#!/usr/bin/env node
// 第2班 第1回の小さな困りごと（日向・UI／アクセシビリティ）の回帰テスト。Playwright。
// 使い方: node tools/tests/panel-b2-ui.mjs [http://localhost:9095/]   （ONLY=R2-07,R2-12 のように絞れる）
//  R2-07 買い物メモの「買った」チェックは 44×44px 以上（195/320/360/390/430 × 文字3段階）。行は横にはみ出さない
//  R2-08 特売の店の登録の入力欄・選ぶ欄・ボタンは高さ 44px 以上
//  R2-09 残り物メモの料理名は「…」で切らず折り返す（195/360/390）。全文が見える
//  R2-10 片手: 「条件」に下のほうからも届く入口（決定の帯の中）がある。料理の絵・名前・かえるに重ならない。押すと条件のシートが開き、そこから設定にも行ける
//  R2-11 条件のシートをタップで開くと、読み上げの焦点がシートの中へ移る。閉じると開いたボタンに戻る（日・英・アラビア語）
//  R2-12 タイマーが終わったら: 音（WebAudio・設定でオフにできる・はじめはオン）・振動のパターン・消えないお知らせ帯・読み上げ（role=alert）。画面をさわると音は止まり、帯は閉じるまで残る
//  R2-19 下のタブは 195px でも 44px 以上の幅（R120 で、1つが 44px に足りない幅は3つずつ2段。全部が画面に入る）。選んでいるタブは見える場所に出る
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.length > 110 ? m.slice(0, 110) + '…' : m); };
const CC = {ja: 'JP', en: 'US', ar: 'EG'};
const WIDTHS = [[195, 422], [320, 700], [360, 740], [390, 844], [430, 932]];
const open = async (o, tag) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: o.h || 844}, timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: true});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('b2ui', tag)));
    if (o.fakeAudio) await ctx.addInitScript(() => {   // 音は鳴らさず、鳴らそうとした数だけ数える
        window.__osc = 0; window.__vib = [];
        window.AudioContext = window.webkitAudioContext = class { constructor(){ this.state = 'running'; this.currentTime = 0; this.destination = {}; }
            resume(){ return Promise.resolve(); } close(){ return Promise.resolve(); }
            createOscillator(){ window.__osc++; return {type: '', frequency: {value: 0, setValueAtTime(){}}, connect(){}, start(){}, stop(){}}; }
            createGain(){ return {gain: {value: 0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){}, cancelScheduledValues(){}}, connect(){}}; } };
        navigator.vibrate = p => { window.__vib.push(p); return true; };
    });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(([cc, lang, extra]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', foldOpen: {upg: true, tw: true, week: true}, settings: {country: cc, uiLang: lang, dishCount: 'auto', servings: 2}}, extra))); } }, [CC[o.lang || 'ja'], o.lang || 'ja', o.extra || {}]);
    await p.goto(URL_); await ready(p);
    if ((o.lang || 'ja') !== 'ja') await p.waitForFunction(cc => typeof PACK !== 'undefined' && PACK && PACK.country === cc, CC[o.lang], {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return {p, ctx};
};
const setTs = (p, ts) => p.evaluate(async ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; render(); await __tick(); }, ts);
const rnd = x => Math.round(x * 10) / 10;

// R2-07 買い物メモの「買った」
if (want('R2-07')) {
    const {p, ctx} = await open({}, 'r07');
    await p.locator('#view [data-act="decide"]').first().tap(); await p.waitForTimeout(600); await p.evaluate(() => scrollTo(0, 0));
    await p.locator('#view .big-decide').first().tap(); await p.waitForTimeout(900);
    const bad = []; let minW = 999, minH = 999, rows = 0;
    for (const [w, h] of WIDTHS) {
        await p.setViewportSize({width: w, height: h});
        for (const ts of [0, 1, 2]) {
            await setTs(p, ts);
            const r = await p.evaluate(() => { const vw = document.documentElement.clientWidth, out = []; let mw = 999, mh = 999, k = 0;
                document.querySelectorAll('#view .buy-row .br-chk input').forEach(i => { const q = i.getBoundingClientRect(); if (!q.width) return; k++; mw = Math.min(mw, q.width); mh = Math.min(mh, q.height);
                    if (q.right > vw + .5 || q.left < -.5) out.push('画面の外');
                    const row = i.closest('.buy-row').getBoundingClientRect(); if (q.top < row.top - .5 || q.bottom > row.bottom + .5) out.push('行から出る(' + Math.round(q.height) + 'px/行' + Math.round(row.height) + 'px)'); });
                document.querySelectorAll('#view .buy-row .br-nm b').forEach(nm => { const q = nm.getBoundingClientRect(); if (q.width && q.width < 20) out.push('品名が細い(' + Math.round(q.width) + 'px)'); });
                if (document.documentElement.scrollWidth > innerWidth + 1) out.push('横スクロール');
                return {k, mw, mh, out}; });
            rows += r.k; if (!r.k) bad.push(`${w} 文字${ts}: 行なし`); else { minW = Math.min(minW, r.mw); minH = Math.min(minH, r.mh); if (r.mw < 44 || r.mh < 44) bad.push(`${w} 文字${ts}: ${rnd(r.mw)}×${rnd(r.mh)}px`); }
            if (r.out.length) bad.push(`${w} 文字${ts}: ` + [...new Set(r.out)].slice(0, 3).join(','));
        }
    }
    ok(!bad.length && rows > 0, `R2-07 「買った」チェックは最小 ${minW}×${minH}px（44×44 以上・行からも画面からもはみ出さない）5幅×3段 ${rows} 行: ` + bad.slice(0, 4).join(' / '));
    await ctx.close();
}

// R2-08 特売の店の登録
if (want('R2-08')) {
    const {p, ctx} = await open({}, 'r08');
    await p.evaluate(() => { setTab('settings'); session.setOpen = {store: true}; render(); });
    await p.click('[data-act="sale-new"]');
    const bad = []; let minH = 999, n = 0;
    for (const [w, h] of WIDTHS) {
        await p.setViewportSize({width: w, height: h});
        for (const ts of [0, 1, 2]) {
            await setTs(p, ts);
            const r = await p.evaluate(() => { const o = []; let mh = 999, k = 0; document.querySelectorAll('#sale-form input, #sale-form select, #sale-form button[type=submit], #sale-form .sale-day-add .btn').forEach(e => { const q = e.getBoundingClientRect(); if (!q.width) return; k++; mh = Math.min(mh, q.height); if (q.height < 43.5) o.push((e.id || e.className || e.tagName) + ' ' + Math.round(q.height * 10) / 10); });
                if (document.documentElement.scrollWidth > innerWidth + 1) o.push('横スクロール'); return {k, mh, o}; });
            n += r.k; minH = Math.min(minH, r.mh); if (r.o.length) bad.push(`${w} 文字${ts}: ` + r.o.slice(0, 3).join(','));
        }
    }
    ok(!bad.length && n > 0, `R2-08 店の登録の欄・ボタンは最小 ${rnd(minH)}px（44px 以上）5幅×3段 ${n} 個: ` + bad.slice(0, 4).join(' / '));
    await ctx.close();
}

// R2-09 残り物メモの料理名
if (want('R2-09')) {
    const {p, ctx} = await open({}, 'r09');
    await p.evaluate(() => { session.leftOpen = true; render(); });
    const bad = []; let n = 0, tall = 0;
    for (const [w, h] of [[195, 422], [360, 740], [390, 844]]) {
        await p.setViewportSize({width: w, height: h});
        for (const ts of [0, 1, 2]) {
            await setTs(p, ts);
            const r = await p.evaluate(() => { const o = []; let k = 0, mx = 0; document.querySelectorAll('.left-chips .chip').forEach(e => { const q = e.getBoundingClientRect(); if (!q.width) return; k++; mx = Math.max(mx, q.height);
                const cs = getComputedStyle(e); if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1 || cs.textOverflow === 'ellipsis' && cs.overflow !== 'visible') o.push(e.textContent.trim().slice(0, 12) + ' ' + e.scrollWidth + '/' + e.clientWidth + '・' + e.scrollHeight + '/' + e.clientHeight);
                if (q.height < 43.5) o.push('低い ' + Math.round(q.height)); });
                if (document.documentElement.scrollWidth > innerWidth + 1) o.push('横スクロール'); return {k, mx, o}; });
            n += r.k; tall = Math.max(tall, r.mx); if (!r.k) bad.push(`${w} 文字${ts}: チップなし`); if (r.o.length) bad.push(`${w} 文字${ts}: ` + r.o.slice(0, 3).join(','));
        }
    }
    ok(!bad.length && n > 0, `R2-09 残り物メモの料理名は切れずに折り返す（最大の高さ ${rnd(tall)}px・${n} 個）: ` + bad.slice(0, 4).join(' / '));
    await ctx.close();
}

// R2-10 片手: 下からも届く「条件」
if (want('R2-10')) {
    const {p, ctx} = await open({}, 'r10');
    const bad = []; const tops = [];
    for (const [w, h] of WIDTHS) {
        await p.setViewportSize({width: w, height: h}); await setTs(p, 0); await p.evaluate(() => scrollTo(0, 0));
        const r = await p.evaluate(() => { const lo = document.querySelector('.decide-bar [data-act="cond-open-low"]'); if (!lo) return {none: true};
            const q = lo.getBoundingClientRect(), o = []; document.querySelectorAll('#view .tray [data-act="open"], #view .tray [data-act="reroll"], #view .tray .shuffle, #view .tray img, #view .tray .nm, #view .tray .bowl').forEach(e => { const a = e.getBoundingClientRect(); if (a.width && a.height && !(a.right <= q.left || a.left >= q.right || a.bottom <= q.top || a.top >= q.bottom)) o.push(e.className || e.dataset.act); });
            return {x: q.left, y: q.top, w: q.width, h: q.height, ratio: q.top / innerHeight, over: o, hs: document.documentElement.scrollWidth > innerWidth + 1}; });
        if (r.none){ bad.push(`${w}: 下の入口なし`); continue; }
        tops.push(`${w}:y${Math.round(r.y)}`);
        if (r.w < 43.5 || r.h < 43.5) bad.push(`${w}: ${rnd(r.w)}×${rnd(r.h)}px`);
        if (r.ratio < .55) bad.push(`${w}: 画面の上のほう(y${Math.round(r.y)})`);
        if (r.over.length) bad.push(`${w}: 料理に重なる ${r.over.slice(0, 2)}`);
        if (r.hs) bad.push(`${w}: 横スクロール`);
    }
    await p.setViewportSize({width: 390, height: 844});
    await p.locator('.decide-bar [data-act="cond-open-low"]').first().tap().catch(() => {}); await p.waitForTimeout(400);
    ok(await p.evaluate(() => !!sheet && sheet.kind === 'cond' && !!document.querySelector('#sheet-root [data-act="cond-settings"]')), 'R2-10 下の入口で条件のシートが開き、中に「設定」への入口がある');
    await p.locator('#sheet-root [data-act="cond-settings"]').first().tap().catch(() => {}); await p.waitForTimeout(400);
    ok(await p.evaluate(() => tab === 'settings' && !sheet), 'R2-10 そこから設定が開く（シートは閉じる）');
    ok(!bad.length, `R2-10 下の入口（決定の帯の中）の位置 ${tops.join(' ')}・44px 以上・料理に重ならない: ` + bad.slice(0, 4).join(' / '));
    await ctx.close();
}

// R2-11 条件のシートの焦点
if (want('R2-11')) {
    for (const lang of ['ja', 'en', 'ar']) {
        const {p, ctx} = await open({lang}, 'r11-' + lang);
        const act = () => p.evaluate(() => { const a = document.activeElement; return {inSheet: !!(a && a.closest('#sheet-root')), tag: a && a.tagName, act: a && a.dataset && a.dataset.act}; });
        await p.locator('#view [data-act="cond-open"]').first().tap(); await p.waitForTimeout(700);
        const a1 = await act();
        ok(a1.inSheet, `R2-11 ${lang}: タップで開くと焦点がシートの中（${a1.tag}）`);
        await p.locator('#sheet-root [data-act="sheet-close"]').last().tap(); await p.waitForTimeout(400);
        const a2 = await act();
        ok(a2.act === 'cond-open', `R2-11 ${lang}: 閉じると焦点が開いたボタンに戻る（${a2.tag}:${a2.act}）`);
        await ctx.close();
    }
}

// R2-12 タイマー終了のお知らせ
if (want('R2-12')) {
    const {p, ctx} = await open({fakeAudio: true}, 'r12');
    ok(await p.evaluate(() => !S.settings.timerAlertOff), 'R2-12 音のお知らせは、はじめはオン');
    await p.tap('#view .big-decide, #view [data-act="decide"]').catch(() => {});   // 最初の画面タッチ（音を出せるようにする）
    await p.evaluate(() => { setTab('today'); startTimer(2, 'ほうれん草', '2秒', '', null); });
    await p.waitForTimeout(3500);
    const s1 = await p.evaluate(() => ({osc: window.__osc, vib: window.__vib.slice(), el: !!document.querySelector('#timer-alert'), role: (document.querySelector('#timer-alert') || {}).getAttribute && document.querySelector('#timer-alert').getAttribute('role'), txt: (document.querySelector('#timer-alert') || {}).textContent || ''}));
    ok(s1.osc >= 3, `R2-12 終わると短い音がくり返し鳴る（発振 ${s1.osc} 回）`);
    ok(s1.vib.some(v => Array.isArray(v) && v.length >= 3), 'R2-12 振動はパターン（' + JSON.stringify(s1.vib[0]) + '）');
    ok(s1.el && s1.role === 'alert' && /ほうれん草/.test(s1.txt), 'R2-12 画面にお知らせの帯があり、読み上げ（role=alert）に名前が届く: ' + s1.txt.slice(0, 30));
    // 幅ごと: 帯は画面の中・閉じるボタンは 44px 以上・料理に重ならない
    const bad = [], hs = [];
    for (const [w, h] of WIDTHS) { await p.setViewportSize({width: w, height: h}); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(250);   // 画面の一番上（貼りつく帯は、ここでは流れの中にあり、料理を押し下げる）
        const r = await p.evaluate(() => { const e = document.querySelector('#timer-alert'); if (!e) return {none: true}; const q = e.getBoundingClientRect(), x = e.querySelector('button').getBoundingClientRect(), o = [];
            document.querySelectorAll('#view .tray [data-act="open"], #view .tray [data-act="reroll"], #view .tray .shuffle, #view .tray img').forEach(d => { const a = d.getBoundingClientRect(); if (a.width && !(a.right <= q.left || a.left >= q.right || a.bottom <= q.top || a.top >= q.bottom)) o.push((d.className || d.dataset.act) + '@y' + Math.round(a.top) + '-' + Math.round(a.bottom) + ' 帯y' + Math.round(q.top) + '-' + Math.round(q.bottom) + ' scrollY' + Math.round(scrollY)); });
            return {hh: q.height, l: q.left, r: q.right, t: q.top, bt: q.bottom, bh: x.height, bw: x.width, o, vw: innerWidth, vh: innerHeight}; });
        if (!r.none) hs.push(w + ':' + Math.round(r.hh));
        if (r.none) bad.push(w + ': 帯なし'); else { if (r.l < -.5 || r.r > r.vw + .5 || r.t < -.5) bad.push(`${w}: 画面の外`); if (r.bh < 43.5 || r.bw < 43.5) bad.push(`${w}: ボタン ${rnd(r.bw)}×${rnd(r.bh)}px`); if (r.o.length) bad.push(`${w}: 料理に重なる ${r.o[0]}`); } }
    ok(!bad.length, 'R2-12 帯（画面の上に貼りつく）は5つの幅で画面の中・ボタン 44px 以上・料理の絵に重ならない（高さ ' + hs.join(' ') + '）: ' + bad.join(' / '));
    await p.setViewportSize({width: 390, height: 844});
    // 画面をさわると音は止まる。帯は10秒たっても残る
    await p.mouse.click(5, 300); await p.waitForTimeout(300);
    const o1 = await p.evaluate(() => window.__osc); await p.waitForTimeout(2200);
    const o2 = await p.evaluate(() => window.__osc);
    ok(o1 > 0 && o2 === o1, `R2-12 画面をさわると音が止まる（${o1}→${o2}）`);
    await p.waitForTimeout(8500);
    ok(await p.evaluate(() => !!document.querySelector('#timer-alert') && !document.querySelector('#toast-root .toast')), 'R2-12 帯は10秒以上たっても残る（お知らせの文は消えても）');
    await p.locator('#timer-alert button').first().tap(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.querySelector('#timer-alert')), 'R2-12 閉じるボタンで帯が消える');
    // 設定でオフ: 音は鳴らさず、帯と振動は出る
    await p.evaluate(() => { S.settings.timerAlertOff = true; window.__osc = 0; startTimer(1, 'みそ汁', '1秒', '', null); });
    await p.waitForTimeout(2800);
    const s3 = await p.evaluate(() => ({osc: window.__osc, el: !!document.querySelector('#timer-alert')}));
    ok(s3.osc === 0 && s3.el, `R2-12 設定でオフにすると音は鳴らない（${s3.osc} 回）が、帯は出る`);
    // 設定の画面にスイッチがある
    await p.evaluate(() => { setTab('settings'); session.setOpen = {notify: true}; render(); });
    ok(await p.evaluate(() => !!document.querySelector('#set-notify input[data-act="timer-alert-set"]')), 'R2-12 設定の「お知らせ」に、音のスイッチがある');
    await ctx.close();
}

// R2-19 下のタブ
if (want('R2-19')) {
    const {p, ctx} = await open({}, 'r19');
    const bad = []; const mins = {};
    for (const [w, h] of WIDTHS) {
        await p.setViewportSize({width: w, height: h});
        for (const ts of [0, 1, 2]) {
            await setTs(p, ts);
            const r = await p.evaluate(async () => { const o = []; let mw = 999, mh = 999, k = 0; document.querySelectorAll('nav.tabs button[data-tab]:not([hidden])').forEach(e => { const q = e.getBoundingClientRect(); k++; mw = Math.min(mw, q.width); mh = Math.min(mh, q.height); });
                // 選んでいるタブが、見える範囲にある（最後のタブを選んでみる）
                const bs = [...document.querySelectorAll('nav.tabs button[data-tab]:not([hidden])')], last = bs[bs.length - 1]; setTab(last.dataset.tab); await new Promise(r => setTimeout(r, 450));
                const nv = document.querySelector('nav.tabs .in').getBoundingClientRect(), q = last.getBoundingClientRect(); if (q.right > nv.right + 1 || q.left < nv.left - 1) o.push('選んだタブが見えない');
                if (document.documentElement.scrollWidth > innerWidth + 1) o.push('横スクロール');
                setTab('today'); await new Promise(r => setTimeout(r, 200)); return {k, mw, mh, o}; });
            mins[w] = Math.min(mins[w] || 999, r.mw);
            if (r.mw < 43.5 || r.mh < 43.5) bad.push(`${w} 文字${ts}: ${rnd(r.mw)}×${rnd(r.mh)}px`); if (r.o.length) bad.push(`${w} 文字${ts}: ` + r.o.join(','));
        }
    }
    ok(!bad.length, `R2-19 タブの最小の幅 ${Object.entries(mins).map(([w, v]) => w + ':' + rnd(v)).join(' ')}（44px 以上・選んだタブは見える）: ` + bad.slice(0, 4).join(' / '));
    await ctx.close();
}

ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
