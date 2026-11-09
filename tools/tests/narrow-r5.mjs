#!/usr/bin/env node
// 利用者モニター v110（R120〜R125）: 狭い幅の重なり・はみ出し・押せる大きさの回帰テスト（Playwright。使い方: node tools/tests/narrow-r5.mjs [http://localhost:8881/]）
//  N1 R120 下のタブ: 幅 195 でも全タブが画面に入り、1つ 44×44px 以上（320px 以上は1段のまま）
//  N2 R125 国旗・設定・ご飯の説明（rice-info）が 44×44px 以上（幅 320・360・390・430）
//  N3 R121 幅 195: 見出し「今日の献立」が条件ボタンに隠れない・設定の入力欄の幅
//  N4 R122 「前の献立」と「まるごと入れ替え」: 押せる領域（ヒット領域）が重ならず、中心を押すと自分に当たる
//  N5 R123 「前の献立」に字が出る（読み上げだけでなく見える字）・画面からはみ出さない
//  N6 R124 1週間プランの🔍バッジが右はしで切れない（折り返す）
//  幅 195・320・360・390・430 × 文字の大きさ 3段階
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const WIDTHS = [[195, 422], [320, 640], [360, 740], [390, 844], [430, 900]];
const open = async (settings = {}, vp = [390, 844], tag = '') => {
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('narrow-r5', tag, vp.join('x'))));
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

// N1 下のタブ
{
    const {p, ctx} = await open({dishCount: 4}, [390, 844], 'n1'); const bad = [], rows = {};
    for (const [w, h] of WIDTHS){
        await p.setViewportSize({width: w, height: h});
        for (const ts of [0, 1, 2]){
            await setTs(p, ts); await p.waitForTimeout(80);
            const r = await p.evaluate(() => { const o = []; document.querySelectorAll('nav.tabs button[data-tab]:not([hidden])').forEach(e => { const q = e.getBoundingClientRect(); o.push([q.left, q.top, q.right, q.bottom]); }); return {o, vw: innerWidth, sw: document.documentElement.scrollWidth, tops: new Set(o.map(x => Math.round(x[1]))).size}; });
            rows[w] = r.tops;
            r.o.forEach((q, i) => { if (q[0] < -0.5 || q[2] > r.vw + 0.5) bad.push(`${w}/文字${ts} タブ${i}が画面の外 ${rnd(q[0])}〜${rnd(q[2])}`); if (q[2] - q[0] < 43.5 || q[3] - q[1] < 43.5) bad.push(`${w}/文字${ts} タブ${i}が小さい ${rnd(q[2] - q[0])}×${rnd(q[3] - q[1])}`); });
            if (r.sw > r.vw + 1) bad.push(`${w} 横スクロール`);
            // 全部のタブが、押すとそのタブへ行ける（真ん中を押して当たるのが自分）
            const hit = await p.evaluate(() => [...document.querySelectorAll('nav.tabs button[data-tab]:not([hidden])')].filter(e => { const q = e.getBoundingClientRect(), t = document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2); return !(t && (t === e || e.contains(t))); }).length);
            if (hit) bad.push(`${w}/文字${ts} 真ん中を押しても当たらないタブ ${hit}`);
        }
    }
    ok(!bad.length && rows[195] === 2 && rows[320] === 1 && rows[360] === 1, `N1 R120 下のタブ（195=${rows[195]}段・320以上=1段）全部が画面に入り 44px 以上: ` + bad.slice(0, 5).join(' / '));
    // 195 でも「記録」まで押して行ける
    await p.setViewportSize({width: 195, height: 422}); await setTs(p, 0);
    await p.click('nav.tabs [data-tab=log]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => tab) === 'log', 'N1 R120 幅195で「記録」を押して開ける');
    await p.click('nav.tabs [data-tab=world]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => tab) === 'world', 'N1 R120 幅195で「世界のレシピ」を押して開ける');
    await ctx.close();
}
// N2 押せる大きさ
{
    const {p, ctx} = await open({dishCount: 4}, [390, 844], 'n2'); const bad = [];
    // ご飯の説明（rice-info）は、主食がご飯の日にだけ出る。出るまで入れ替える
    for (let i = 0; i < 12 && !await p.locator('#view [data-act=rice-info]').count(); i++){ await p.click(MARU); await p.waitForTimeout(400); }
    for (const [w, h] of WIDTHS){
        await p.setViewportSize({width: w, height: h});
        for (const ts of [0, 1, 2]){
            await setTs(p, ts); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(80);
            const r = await p.evaluate(() => [...document.querySelectorAll('header.top button.gear, header.top .gear, #view [data-act=rice-info]')].map(e => { const q = e.getBoundingClientRect(); return [e.getAttribute('data-act') || e.className, q.width, q.height]; }));
            r.forEach(([n, ww, hh]) => { if (ww < 43.5 || hh < 43.5) bad.push(`${w}/文字${ts} ${n} ${rnd(ww)}×${rnd(hh)}`); });
            if (!r.some(x => x[0] === 'rice-info')) bad.push(`${w}/文字${ts} ご飯の説明が見つからない`);
        }
    }
    ok(!bad.length, 'N2 R125 国旗・設定・ご飯の説明が 44×44px 以上: ' + bad.slice(0, 5).join(' / '));
    await ctx.close();
}
// N3 見出し・設定の入力欄
{
    const {p, ctx} = await open({dishCount: 4}, [195, 422], 'n3'); const bad = [];
    for (const [w, h] of WIDTHS){
        await p.setViewportSize({width: w, height: h});
        for (const ts of [0, 1, 2]){
            await setTs(p, ts); await p.evaluate(() => { scrollTo(0, 0); }); await p.waitForTimeout(100);
            const r = await p.evaluate(() => { const h2 = document.querySelector('#view .today-head h2'), sv = document.querySelector('#view .today-head .p2-sv, #view .today-head details.cond'); if (!h2 || !sv) return null;
                const g = document.createRange(); g.selectNodeContents(h2); const q = [...g.getClientRects()].filter(x => x.width > 0.5), s = sv.getBoundingClientRect(), hb = h2.getBoundingClientRect();
                const txt = (h2.textContent || '').trim(); const cs = getComputedStyle(h2);
                return {txt, fs: parseFloat(cs.fontSize), clipX: h2.scrollWidth > h2.clientWidth + 1, clipY: h2.scrollHeight > h2.clientHeight + 1, over: q.some(x => x.right > s.left + 0.5 && x.left < s.right && x.bottom > s.top && x.top < s.bottom), hr: hb.right, sl: s.left, tx: q.length ? Math.max(...q.map(x => x.right)) : 0}; });
            if (!r) { bad.push(`${w}/文字${ts} 見出しなし`); continue; }
            if (r.fs > 0 && (r.over || r.clipX || r.clipY)) bad.push(`${w}/文字${ts} 見出し「${r.txt.slice(0, 8)}」が切れる/重なる over=${r.over} clipX=${r.clipX} clipY=${r.clipY}`);
        }
    }
    ok(!bad.length, 'N3 R121 見出し「今日の献立」が条件ボタンに隠れない: ' + bad.slice(0, 5).join(' / '));
    // 設定の入力欄
    await p.setViewportSize({width: 195, height: 422}); await setTs(p, 0);
    await p.evaluate(() => { setTab('settings'); setTabShow('food'); }); await p.waitForTimeout(300);   // 設定はタブ分け（11/09）。苦手な食材の入力欄は「苦手・食の決まり」のタブ
    const iw = await p.evaluate(() => { const e = document.querySelector('#avoid-input'); if (!e) return -1; e.scrollIntoView(); const q = e.getBoundingClientRect(); const f = e.closest('form').getBoundingClientRect(); return {w: q.width, fw: f.width, r: q.right, vw: innerWidth}; });
    ok(iw !== -1 && iw.w >= 90 && iw.r <= iw.vw, 'N3 R121 幅195の設定「苦手な食材を追加」の入力欄が 90px 以上: ' + JSON.stringify(iw));
    await ctx.close();
}
// N4・N5 前の献立
{
    const bad = [], bad5 = [];
    for (const dc of [4, 6]){
        const {p, ctx} = await open({dishCount: dc}, [390, 844], 'n4' + dc);
        await p.click(MARU); await p.waitForTimeout(500);
        for (const [w, h] of WIDTHS){
            await p.setViewportSize({width: w, height: h});
            for (const ts of [0, 1, 2]){
                await setTs(p, ts); await p.waitForTimeout(500);
                if (!await p.locator('#view .tg-mid .mb-back').count()) { await p.click(MARU); await p.waitForTimeout(500); }
                await p.evaluate(() => document.querySelector('#view .tg-mid .mb-back').scrollIntoView({block: 'center'})); await p.waitForTimeout(150);
                const r = await p.evaluate(() => { const m = document.querySelector('#view .tg-mid .shuffle'), bk = document.querySelector('#view .tg-mid .mb-back'); const a = m.getBoundingClientRect(), c = bk.getBoundingClientRect();
                    const mid = (e, q) => { const t = document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2); return !!t && (t === e || e.contains(t)); };
                    const tx = bk.querySelector('.mb-tx'), tq = tx.getBoundingClientRect(), cs = getComputedStyle(tx);
                    const vis = cs.position !== 'absolute' && tq.width > 6 && tq.height > 6 && cs.visibility !== 'hidden' && tx.scrollWidth <= tx.clientWidth + 1;
                    return {a: [a.left, a.top, a.right, a.bottom], c: [c.left, c.top, c.right, c.bottom], hitM: mid(m, a), hitB: mid(bk, c), vis, dbg: [cs.position, tq.width, tq.height, tx.scrollWidth, tx.clientWidth, bk.className, cs.fontSize], bw: c.width, bh: c.height, vw: innerWidth, txt: tx.textContent}; });
                const A = {left: r.a[0], top: r.a[1], right: r.a[2], bottom: r.a[3]}, C = {left: r.c[0], top: r.c[1], right: r.c[2], bottom: r.c[3]}, k = `${dc}品 ${w}/文字${ts}`;
                if (inter(A, C)) bad.push(`${k} 押せる領域が重なる（入れ替え ${A.left | 0}〜${A.right | 0} / 前 ${C.left | 0}〜${C.right | 0}）`);
                if (!r.hitM || !r.hitB) bad.push(`${k} 真ん中を押すと取り違える 入れ替え=${r.hitM} 前=${r.hitB}`);
                if (r.bw < 43.5 || r.bh < 43.5) bad.push(`${k} 前の献立が小さい ${rnd(r.bw)}×${rnd(r.bh)}`);
                if (C.left < -0.5 || C.right > r.vw + 0.5) bad.push(`${k} 前の献立が画面の外`);
                if (!r.vis && (w >= 360 || (w >= 320 && ts < 2))) bad5.push(`${k} 字「${r.txt}」が見えない ${JSON.stringify(r.dbg)}`);
            }
        }
        await ctx.close();
    }
    ok(!bad.length, 'N4 R122 「前の献立」と「まるごと入れ替え」の押せる領域が重ならず、中心の取り違えは0: ' + bad.slice(0, 5).join(' / '));
    ok(!bad5.length, 'N5 R123 「前の献立」の字が見える（幅360以上はどの文字の大きさでも・320は文字ふつう〜大。幅195と320の最大の文字は余白がないので絵だけ）: ' + bad5.slice(0, 5).join(' / '));
}
// N6 1週間プランの🔍バッジ
{
    const {p, ctx} = await open({dishCount: 4, allergies: ['soy', 'wheat', 'egg', 'milk'], weekSides: true}, [390, 844], 'n6'); const bad = []; let seen = 0;
    await p.evaluate(() => { try { S.settings.allergy = ['@egg', '@milk', '@soy', '@wheat']; } catch (e) {} });
    for (const [w, h] of WIDTHS){
        await p.setViewportSize({width: w, height: h});
        for (const ts of [0, 1, 2]){
            await setTs(p, ts);
            const r = await p.evaluate(async () => { try { makeWeek(); ensureWeekExtras(); } catch (e) {} render(); await __tick();
                // 🔍バッジの文を長くして確かめる（食の決まり・家族・アレルギーが重なる人）
                const L = '🔍 食の決まり（コンソメ・ウスターソース・オイスターソース・みりん風調味料・中華だしの袋の表示を確認）';
                const host = document.querySelector('#view .list.week .item .t'); if (!host) return {none: true};
                host.insertAdjacentHTML('beforeend', `<div class="s"><span class="badge caution">${L}</span></div>`);
                const out = []; document.querySelectorAll('#view .list.week .badge.caution').forEach(e => { const q = e.getBoundingClientRect(), it = e.closest('.item').getBoundingClientRect(); out.push({l: q.left, r: q.right, ir: it.right, vw: innerWidth, h: q.height, sw: e.scrollWidth > e.clientWidth + 1}); });
                return {out, sw: document.documentElement.scrollWidth, vw: innerWidth}; });
            if (r.none) { bad.push(`${w}/文字${ts} 1週間の一覧が出ない`); continue; }
            seen += r.out.length;
            r.out.forEach(o => { if (o.r > o.vw + 0.5 || o.r > o.ir + 0.5 || o.l < -0.5 || o.sw) bad.push(`${w}/文字${ts} 🔍バッジが切れる ${rnd(o.l)}〜${rnd(o.r)} / 行 ${rnd(o.ir)} / 画面 ${o.vw}`); });
            if (r.sw > r.vw + 1) bad.push(`${w}/文字${ts} 横スクロール`);
        }
    }
    ok(seen > 0 && !bad.length, `N6 R124 1週間プランの🔍バッジが右はしで切れない（${seen}件）: ` + bad.slice(0, 5).join(' / '));
    await ctx.close();
}
await b.close();
if (errs.length){ fails++; console.log('FAIL pageerror', errs.slice(0, 3)); }
console.log(fails ? `NG ${fails}` : 'ALL OK'); process.exit(fails ? 1 : 0);
