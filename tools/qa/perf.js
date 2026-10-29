#!/usr/bin/env node
// 速さを測る（docs/perf.md の数字はこれで取る。run-all には入れない）
//   node tools/qa/perf.js [BASE]           例: node tools/qa/perf.js http://localhost:8886/
//   環境変数: RUNS（起動を何回測るか。既定 5）, REPS（操作を何回測るか。既定 6）, CPU（"1,4" のように CPU を何倍遅くするか）, JSON=1（結果を JSON で出す）
// 画面は 390×844。CPU を遅くするのは CDP の Emulation.setCPUThrottlingRate。
// 測るもの:
//   起動: ページを開いてから、献立（お膳の料理）が描かれて次の描画までの時間。FCP・Long Task（50ms 以上）の数と合計、読みこんだファイルの大きさ
//   操作: まるごと入れ替え・かえる（候補のシートを開く／候補を選ぶ）・タブの切りかえ（さがす・記録・今日）・設定を開く
//         押してから次の描画まで（click → requestAnimationFrame → その次のタスク）。中央値と最大
const { chromium, LAUNCH, rngScript } = require('../lib/pw.cjs');
const BASE = process.argv[2] || process.env.BASE || 'http://localhost:8886/';
const RUNS = Number(process.env.RUNS || 5), REPS = Number(process.env.REPS || 6);
const CPUS = String(process.env.CPU || '1,4').split(',').map(Number);
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN; };
const r0 = x => Math.round(x);

const INIT = `(() => {
  window.__perf = {lt: [], menuAt: 0};
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) __perf.lt.push([e.startTime, e.duration]); }).observe({type: 'longtask', buffered: true}); } catch (e) {}
  // 献立が描かれた（DOM に料理が入った）→ 次の描画。絵が届いた時刻は、料理の絵のファイルの読みこみが終わった時刻（Resource Timing）で取る
  const after = f => requestAnimationFrame(() => setTimeout(f, 0));
  const mo = new MutationObserver(() => {
    if (!__perf.menuDom && document.querySelector('#view .tray .spot')) { __perf.menuDom = performance.now(); after(() => { __perf.menuAt = performance.now(); }); }
  });
  mo.observe(document, {childList: true, subtree: true});
})();`;

async function newCtx(b, cpu){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(12345));
    await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}})); });
    await ctx.addInitScript(INIT);
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    return { ctx, p, cdp };
}
async function waitMenu(p){ await p.waitForFunction(() => window.__perf && __perf.menuAt > 0, null, { timeout: 60000 }); }

async function startup(b, cpu, warm){
    const { ctx, p } = await newCtx(b, cpu);
    if (warm){ await p.goto(BASE); await waitMenu(p); await p.waitForTimeout(1500); await p.reload(); }
    else await p.goto(BASE);
    await waitMenu(p);
    await p.waitForTimeout(2500);   // 起動直後に裏で走る処理の Long Task も拾う
    const r = await p.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] || {};
        const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0;
        const res = performance.getEntriesByType('resource');
        const sum = (f) => res.filter(f).reduce((s, e) => s + (e.decodedBodySize || e.encodedBodySize || 0), 0);
        const imgs = res.filter(e => /\/img\//.test(e.name));
        const lt = __perf.lt.filter(([s]) => s <= __perf.menuAt), ltAfter = __perf.lt.filter(([s]) => s > __perf.menuAt);
        return { menu: __perf.menuAt, menuDom: __perf.menuDom, img: res.filter(e => /\/img\/dish\/[^/]+\.(svg|webp|png)/.test(e.name)).reduce((m, e) => Math.max(m, e.responseEnd), 0), fcp, dcl: nav.domContentLoadedEventEnd || 0, load: nav.loadEventEnd || 0,
            html: nav.decodedBodySize || nav.encodedBodySize || 0, htmlXfer: nav.transferSize || 0,
            res: res.length, resBytes: sum(() => true), imgN: imgs.length, imgBytes: sum(e => /\/img\//.test(e.name)),
            manifest: sum(e => /manifest\.json/.test(e.name)), jsBytes: sum(e => /\.js(\?|$)/.test(e.name)),
            ltN: lt.length, ltSum: lt.reduce((s, x) => s + x[1], 0), ltMax: lt.reduce((m, x) => Math.max(m, x[1]), 0),
            ltAfterN: ltAfter.length, ltAfterSum: ltAfter.reduce((s, x) => s + x[1], 0),
            files: res.map(e => [e.name.replace(location.origin, ''), e.decodedBodySize || 0, Math.round(e.startTime)]).sort((a, b) => b[1] - a[1]).slice(0, 8) };
    });
    await ctx.close();
    return r;
}

// 押してから次の描画まで（本物のタップ: Playwright の tap）。click の始まり（capture）から、そのあとの最初の描画（rAF → 次のタスク）まで。
// 同期（sync）は click の処理が終わるまで。押したあと 300ms の Long Task も数える
async function act(p, sel){
    await p.waitForTimeout(250);
    await p.evaluate(() => {
        __perf.a = null; const lt0 = __perf.lt.length;
        document.addEventListener('click', () => {
            const t0 = performance.now(); let ts = 0;
            window.addEventListener('click', () => { ts = performance.now(); }, {once: true});
            setTimeout(() => { if (!ts) ts = performance.now(); }, 0);
            requestAnimationFrame(() => setTimeout(() => { __perf.a = {t0, ts, t1: performance.now(), lt0}; }, 0));
        }, {capture: true, once: true});
    });
    await p.tap(sel);
    await p.waitForFunction(() => __perf.a, null, { timeout: 30000 });
    await p.waitForTimeout(300);
    return p.evaluate(() => { const a = __perf.a, lt = __perf.lt.slice(a.lt0); return { sync: a.ts - a.t0, paint: a.t1 - a.t0, ltN: lt.length, ltSum: lt.reduce((s, x) => s + x[1], 0) }; });
}
const click = sel => sel;

async function actions(b, cpu){
    const { ctx, p } = await newCtx(b, cpu);
    await p.goto(BASE); await waitMenu(p); await p.waitForTimeout(2000);
    const out = { newMenu: [], swapOpen: [], swapPick: [], tabFridge: [], tabLog: [], tabToday: [], settings: [], settingsBack: [] };
    for (let i = 0; i < REPS; i++){
        out.newMenu.push(await act(p, click('#view .tray .tray-shuffle .shuffle[data-act=new-menu]')));
        out.swapOpen.push(await act(p, click('#view .tray button.swap[data-act=reroll][data-i="1"]')));
        out.swapPick.push(await act(p, click('#sheet-root [data-act=swap-pick]')));
        out.tabFridge.push(await act(p, click('nav.tabs [data-tab=fridge]')));
        out.tabLog.push(await act(p, click('nav.tabs [data-tab=log]')));
        out.tabToday.push(await act(p, click('nav.tabs [data-tab=today]')));
        out.settings.push(await act(p, click('header [data-act=settings]')));
        out.settingsBack.push(await act(p, click('nav.tabs [data-tab=today]')));
    }
    await ctx.close();
    const s = {};
    for (const [k, v] of Object.entries(out)) s[k] = { med: med(v.map(x => x.paint)), max: Math.max(...v.map(x => x.paint)), sync: med(v.map(x => x.sync)), ltN: v.reduce((a, x) => a + x.ltN, 0) / v.length, ltSum: med(v.map(x => x.ltSum)) };
    return s;
}

(async () => {
    const b = await chromium.launch(LAUNCH);
    const all = {};
    for (const cpu of CPUS){
        const cold = [], warm = [];
        for (let i = 0; i < RUNS; i++) cold.push(await startup(b, cpu, false));
        for (let i = 0; i < Math.max(1, Math.ceil(RUNS / 2)); i++) warm.push(await startup(b, cpu, true));
        const A = await actions(b, cpu);
        all[cpu] = { cold, warm, A };
        const S = k => r0(med(cold.map(x => x[k]))), W = k => r0(med(warm.map(x => x[k])));
        console.log(`\n=== CPU ${cpu}x (390x844) ===`);
        console.log(`起動（初回）: 献立まで ${S('menu')}ms（DOM ${S('menuDom')}） 絵まで ${S('img')}ms FCP ${S('fcp')} DCL ${S('dcl')} load ${S('load')} / LongTask ${S('ltN')}件 計${S('ltSum')}ms 最大${S('ltMax')}ms / 献立のあと2.5秒 ${S('ltAfterN')}件 計${S('ltAfterSum')}ms`);
        console.log(`起動（2回目）: 献立まで ${W('menu')}ms 絵まで ${W('img')}ms FCP ${W('fcp')} / LongTask ${W('ltN')}件 計${W('ltSum')}ms`);
        const c = cold[0];
        console.log(`読みこみ: html ${(c.html / 1024).toFixed(0)}KB / ファイル ${c.res}件 ${(c.resBytes / 1024).toFixed(0)}KB（js ${(c.jsBytes / 1024).toFixed(0)}KB, 絵 ${c.imgN}件 ${(c.imgBytes / 1024).toFixed(0)}KB, manifest ${(c.manifest / 1024).toFixed(0)}KB）`);
        console.log('大きいファイル: ' + c.files.map(f => `${f[0]} ${(f[1] / 1024).toFixed(0)}KB@${f[2]}ms`).join(', '));
        for (const [k, v] of Object.entries(A)) console.log(`${k.padEnd(13)} 中央 ${r0(v.med)}ms 最大 ${r0(v.max)}ms（同期 ${r0(v.sync)}ms）LongTask 平均${v.ltN.toFixed(1)}件 計${r0(v.ltSum)}ms`);
    }
    if (process.env.JSON) console.log(JSON.stringify(all));
    await b.close();
})().catch(e => { console.error(e); process.exit(1); });
