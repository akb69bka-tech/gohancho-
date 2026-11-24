#!/usr/bin/env node
// 利用者モニター 第28回（R129〜R131）: 狭い幅の回帰テスト（Playwright。使い方: node tools/tests/narrow-r6.mjs [http://localhost:8881/]）
//  W1 R129 1週間プラン: 幅195・260・320 でも、料理名と🔍バッジの列が 80px 以上（1文字ずつ縦に並ばない）・バッジは行と画面の中
//  W2 R130 「前の献立」: 幅260以上は、どの言語・文字の大きさでも字が見える（12px 以上）。幅195は日本語だけ字つき（長い語は絵だけで読み上げは残る）
//  W3 R131 「前の献立」と「まるごと入れ替え」: 押せる範囲が重ならず、中心を押すと自分に当たる・画面の外に出ない（全言語・全幅・全文字）
//  R132（見出し「今日の献立」の畳み）は fitTray の設計どおりの畳みなので、ここでは測らない（narrow-r5 N3 が 幅195 の見出しと条件ボタンの重なりを見る）
//  幅 195・260・320・360・390・430 × 文字の大きさ 3段階
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const WIDTHS = [[195, 422], [260, 560], [320, 640], [360, 740], [390, 844], [430, 900]];
const open = async (settings = {}, vp = [390, 844], tag = '') => {
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('narrow-r6', tag, vp.join('x'))));
    await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja'}, st)})); }, settings);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return {p, ctx};
};
const setTs = (p, ts) => p.evaluate(async ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; render(); await __tick(); }, ts);
const rnd = n => Math.round(n * 10) / 10;
const MARU = '#view .tray .tg-mid .shuffle[data-act=new-menu]';
const inter = (a, c) => Math.min(a.right, c.right) - Math.max(a.left, c.left) > 0.5 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 0.5;

// W1 1週間プランの列幅
{
    const {p, ctx} = await open({dishCount: 4}, [390, 844], 'w1'); const bad = []; let seen = 0;
    await p.evaluate(() => { try { S.settings.allergy = ['@egg', '@milk', '@soy', '@wheat']; } catch (e) {} });
    for (const [w, h] of WIDTHS){
        await p.setViewportSize({width: w, height: h});
        for (const ts of [0, 1, 2]){
            await setTs(p, ts);
            const r = await p.evaluate(async () => { try { makeWeek(); ensureWeekExtras(); } catch (e) {} render(); await __tick();
                document.querySelectorAll('#view details').forEach(d => { d.open = true; }); await __tick();
                const L = '🔍 食の決まり（コンソメ・ウスターソース・オイスターソース・みりん風調味料・中華だしの袋の表示を確認）';
                const host = document.querySelector('#view .list.week .item .t'); if (!host) return {none: true};
                host.insertAdjacentHTML('beforeend', `<div class="s"><span class="badge caution">${L}</span></div>`);
                const out = []; document.querySelectorAll('#view .list.week .item').forEach(it => { const t = it.querySelector('.t'), bd = it.querySelector('.badge.caution'), q = t.getBoundingClientRect(), ir = it.getBoundingClientRect(), o = {tw: q.width, tr: q.right, ir: ir.right, vw: innerWidth};
                    if (bd){ const bq = bd.getBoundingClientRect(); o.bw = bq.width; o.bh = bq.height; o.br = bq.right; } out.push(o); });
                return {out, sw: document.documentElement.scrollWidth, vw: innerWidth}; });
            if (r.none) { bad.push(`${w}/文字${ts} 1週間の一覧が出ない`); continue; }
            seen += r.out.length;
            r.out.forEach(o => { if (o.tw < 80) bad.push(`${w}/文字${ts} 料理名の列が細い ${rnd(o.tw)}px`); if (o.tr > o.ir + 0.5) bad.push(`${w}/文字${ts} 名前の列が行の外`); if (o.bw != null && (o.bw < 70 || o.br > o.ir + 0.5 || o.br > o.vw + 0.5 || o.bh > o.bw * 4)) bad.push(`${w}/文字${ts} 🔍バッジが縦に潰れる/はみ出す ${rnd(o.bw)}×${rnd(o.bh)}`); });
            if (r.sw > r.vw + 1) bad.push(`${w}/文字${ts} 横スクロール`);
        }
    }
    ok(seen > 0 && !bad.length, `W1 R129 1週間プランの名前・🔍バッジの列が 80px 以上（${seen}行）: ` + bad.slice(0, 5).join(' / '));
    await ctx.close();
}
// W2・W3 前の献立
{
    const bad2 = [], bad3 = [];
    for (const lang of (process.env.LANGS || 'ja,en,fr,it,vi,id,de').split(',')){
        const {p, ctx} = await open({dishCount: 4, uiLang: lang}, [390, 844], 'w2' + lang);
        await p.click(MARU); await p.waitForTimeout(500);
        for (const [w, h] of WIDTHS){
            await p.setViewportSize({width: w, height: h});
            for (const ts of [0, 1, 2]){
                await setTs(p, ts); await p.waitForTimeout(500);
                if (!await p.locator('#view .tg-mid .mb-back').count()) { await p.click(MARU); await p.waitForTimeout(500); }
                await p.evaluate(() => document.querySelector('#view .tg-mid .mb-back').scrollIntoView({block: 'center'})); await p.waitForTimeout(150);
                const pre = await p.evaluate(() => document.querySelector('#view .tg-mid .mb-back').className); if (process.env.DBG) await p.evaluate(() => menuBackFit());
                const r = await p.evaluate(() => { const m = document.querySelector('#view .tg-mid .shuffle'), bk = document.querySelector('#view .tg-mid .mb-back'); const a = m.getBoundingClientRect(), c = bk.getBoundingClientRect();
                    const mid = (e, q) => { const t = document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2); return !!t && (t === e || e.contains(t)); };
                    const tx = bk.querySelector('.mb-tx'), tq = tx.getBoundingClientRect(), cs = getComputedStyle(tx);
                    const vis = cs.position !== 'absolute' && tq.width > 6 && tq.height > 6 && cs.visibility !== 'hidden' && tx.scrollWidth <= tx.clientWidth + 1 && tx.scrollHeight <= tx.clientHeight + 1;
                    return {dbg: [tq.width, tq.height, tx.scrollWidth, tx.clientWidth, tx.scrollHeight, tx.clientHeight, bk.className, cs.position], a: [a.left, a.top, a.right, a.bottom], c: [c.left, c.top, c.right, c.bottom], hitM: mid(m, a), hitB: mid(bk, c), vis, fs: parseFloat(cs.fontSize), vw: innerWidth, txt: tx.textContent}; });
                const A = {left: r.a[0], top: r.a[1], right: r.a[2], bottom: r.a[3]}, C = {left: r.c[0], top: r.c[1], right: r.c[2], bottom: r.c[3]}, k = `${lang} ${w}/文字${ts}`;
                if (inter(A, C)) bad3.push(`${k} 押せる範囲が重なる（入れ替え ${rnd(A.left)}〜${rnd(A.right)} / 前 ${rnd(C.left)}〜${rnd(C.right)}）`);
                if (!r.hitM || !r.hitB) bad3.push(`${k} 真ん中を押すと取り違える`);
                if (C.left < -0.5 || C.right > r.vw + 0.5) bad3.push(`${k} 画面の外`);
                if (C.right - C.left < 43.5 || C.bottom - C.top < 43.5) bad3.push(`${k} 44px 未満`);
                if (w >= 260 || lang === 'ja'){ if (!r.vis && process.env.DBG2){ await p.screenshot({path: '/tmp/s6/fail.png'}); console.log(JSON.stringify(await p.evaluate(() => { const bk = document.querySelector('#view .tg-mid .mb-back'), mid = bk.closest('.tg-mid'), R = e => { const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom].map(Math.round); }; return {mid: R(mid), sh: R(mid.querySelector('.shuffle')), bk: R(bk), cls: mid.className, ic: R(mid.querySelector('.sh-ic'))}; }))); }
                if (!r.vis) bad2.push(`${k} 字「${r.txt}」が見えない ${JSON.stringify(r.dbg)} 直前=${pre}`); else if (r.fs < 11.95) bad2.push(`${k} 字が小さい ${r.fs}px`); }
            }
        }
        await ctx.close();
    }
    ok(!bad3.length, 'W3 R131 「前の献立」と「まるごと入れ替え」が重ならず、中心の取り違えは0（7言語）: ' + bad3.slice(0, 5).join(' / '));
    ok(!bad2.length, 'W2 R130 「前の献立」の字が見える・12px 以上（幅260以上は全言語・幅195は日本語）: ' + bad2.slice(0, 5).join(' / '));
}
await b.close();
if (errs.length){ fails++; console.log('FAIL pageerror', errs.slice(0, 3)); }
console.log(fails ? `NG ${fails}` : 'ALL OK'); process.exit(fails ? 1 : 0);
