#!/usr/bin/env node
// 第55回 R233（安全）: アレルギー・食の決まりのチップを 0.2 秒のうちに2回押したとき、押した所を保つ送り（holdView）などで指の下に来た別のチップ（小麦・かに・ヴィーガン向け）を押さない
//  使い方: node tools/tests/r233.mjs [http://localhost:9331/]   （LANGS=ja,en でしぼれる）
//  A1 自分のアレルギー（卵・小麦あり）で「卵」を2回押し → 卵のほか（小麦など）は変わらない
//  A2 自分のアレルギー（卵・小麦あり）で「小麦」を2回押し → 小麦のほか（卵・かになど）は変わらない
//  A3 自分のアレルギー（なし）で「小麦」を2回押し → 小麦のほか（卵など）は入らない
//  A4 家族の人のアレルギー（卵・小麦あり）で「卵」を2回押し → その人の卵のほかは変わらない
//  A5 家族の人の食の決まり（なし）で「ベジタリアン向け」を2回押し → ヴィーガン向け・卵・乳製品は入らない
//  A6 自分の食の決まり（なし）で「ベジタリアン向け」を2回押し → 同じ
//  どれも 4言語（ja・en・de・ar）× 幅195・320・390、0.15 秒あけた2回押し（外すつもり・入れるつもりの両方）。2回目が別のチップの上なら「もう一度押してください」が出る
//  B1 止めすぎない: 同じチップの 0.7 秒あけた押し直しは2回とも受ける。人がスクロールしてから押した別のチップは受ける
//  C1 第56回: アプリが送ってから 0.6 秒のうちの2回目は、1回目から 0.6 秒を過ぎていても止める。送ってから 0.6 秒を過ぎた押しは受ける
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const LANGS = process.env.LANGS ? process.env.LANGS.split(',') : ['ja', 'en', 'de', 'ar'];
const WIDTHS = [[195, 422], [320, 568], [390, 844]];
const b = await chromium.launch(LAUNCH);
const open = async (lg, w, h, st) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        {onboarded: true, firstUse: '2020-01-01', settings: Object.assign({country: 'JP', uiLang: lg, dishCount: 3, servings: 2}, st.settings || {}), family: [Object.assign({id: 'f1', name: 'Ravi', role: 'adult', avoid: [], allergy: []}, st.fam || {})]});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lg + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, {timeout: 30000});
    await p.evaluate(async () => { setTab('settings'); setTabShow('family'); session.famOpen = 'f1'; render(); await new Promise(r => setTimeout(r, 250)); });
    return {p, ctx};
};
// ボタンを画面の下のほう（下のタブの少し上）に置いて、真ん中を gap ミリ秒あけて2回押す
const dbl = async (p, sel, gap) => {
    const c = await p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const nav = document.querySelector('nav.tabs').getBoundingClientRect(); const q0 = e.getBoundingClientRect(); window.scrollBy(0, q0.bottom - (nav.top - 40)); const q = e.getBoundingClientRect(); return {x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2}; }, sel);
    if (!c) return null;
    await p.waitForTimeout(150);
    await p.mouse.click(c.x, c.y); await p.waitForTimeout(gap);
    const under = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y), t = e && e.closest('[data-act]'); return t ? t.dataset.act + '|' + (t.dataset.v || '') : ''; }, [c.x, c.y]);
    await p.mouse.click(c.x, c.y);
    await p.waitForTimeout(150);
    const tip = await p.evaluate(() => !!document.querySelector('.tap-again'));
    await p.waitForTimeout(400);
    return {c, under, tip};
};
const own = p => p.evaluate(() => algIds().slice().sort());
const fam = p => p.evaluate(() => { const m = S.family.find(x => x.id === 'f1'); return {alg: m.allergy.slice().sort(), avoid: m.avoid.slice().sort()}; });
const famAlgOf = p => p.evaluate(() => { const m = S.family.find(x => x.id === 'f1'); return (typeof famAlgIdsOf === 'function' ? famAlgIdsOf(m) : m.allergy).slice().sort(); });
const CASES = [
    {k: 'A1', nm: '自分のアレルギー（卵・小麦）で「卵」2回', st: {settings: {allergens: ['egg', 'wheat']}}, sel: '#allergy-card [data-act="alg-toggle"][data-v="egg"]', read: own, keep: x => x.filter(v => v !== 'egg')},
    {k: 'A2', nm: '自分のアレルギー（卵・小麦）で「小麦」2回', st: {settings: {allergens: ['egg', 'wheat']}}, sel: '#allergy-card [data-act="alg-toggle"][data-v="wheat"]', read: own, keep: x => x.filter(v => v !== 'wheat')},
    {k: 'A3', nm: '自分のアレルギー（なし）で「小麦」2回', st: {}, sel: '#allergy-card [data-act="alg-toggle"][data-v="wheat"]', read: own, keep: x => x.filter(v => v !== 'wheat')},
    {k: 'A4', nm: '家族の人のアレルギー（卵・小麦）で「卵」2回', st: {fam: {avoid: ['@egg', '@wheat'], allergy: ['@egg', '@wheat']}}, sel: '[data-fm="f1"] [data-act="fam-alg-fam"][data-v="egg"]', read: fam, keep: x => ({alg: x.alg.filter(v => !/egg/.test(v)), avoid: x.avoid.filter(v => !/egg/.test(v))})},
    {k: 'A5', nm: '家族の人の食の決まりで「ベジタリアン向け」2回', st: {}, sel: '[data-fm="f1"] [data-act="fam-avoid-diet"][data-v="vegi"]', read: fam, keep: x => ({egg: x.avoid.includes('@egg'), dairy: x.avoid.includes('@dairy')})},
    {k: 'A6', nm: '自分の食の決まりで「ベジタリアン向け」2回', st: {}, sel: '#view [data-act="toggle-avoid-diet"][data-v="vegi"]', read: p => p.evaluate(() => S.settings.avoid.slice().sort()), keep: x => ({egg: x.includes('@egg'), dairy: x.includes('@dairy')})},
];
for (const cs of CASES){
    const bad = []; let moved = 0, tipped = 0;
    for (const lg of LANGS) for (const [w, h] of WIDTHS){
        const {p, ctx} = await open(lg, w, h, cs.st);
        const has = await p.evaluate(sel => !!document.querySelector(sel), cs.sel);
        if (!has){ bad.push(`${lg} ${w}: ボタンがない ${cs.sel}`); await ctx.close(); continue; }
        const before = await cs.read(p);
        const r = await dbl(p, cs.sel, 150);
        const after = await cs.read(p);
        const k0 = JSON.stringify(cs.keep(before)), k1 = JSON.stringify(cs.keep(after));
        if (k0 !== k1) bad.push(`${lg} ${w}: 押していないものが変わった ${k0} → ${k1}（2回目の下: ${r.under}）`);
        const same = r.under === cs.sel.match(/data-act="([^"]+)"/)[1] + '|' + cs.sel.match(/data-v="([^"]+)"/)[1];
        if (!same && r.under){ moved++; if (r.tip) tipped++; else bad.push(`${lg} ${w}: 2回目が別のボタン（${r.under}）の上なのに「もう一度押してください」が出ない`); }
        await ctx.close();
    }
    console.log(cs.k, '2回目の下に別のボタンが来た形', moved, '件・知らせ', tipped);
    ok(bad.length === 0, `${cs.k} ${cs.nm}（${LANGS.length}言語 × 195・320・390）: 押していないものは変わらない: ` + bad.slice(0, 6).join(' | '));
}
// ---- B1 止めすぎない ----
{
    const {p, ctx} = await open('ja', 320, 568, {settings: {allergens: ['egg', 'wheat']}});
    // 同じチップの押し直し: 1回目のあと画面が動くことがあるので、2回目は卵のチップの今の場所を押す（人は目で見て押す）
    const at = () => p.evaluate(() => { const e = document.querySelector('#allergy-card [data-act="alg-toggle"][data-v="egg"]'); const q = e.getBoundingClientRect(); return {x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2}; });
    await p.evaluate(() => { const e = document.querySelector('#allergy-card [data-act="alg-toggle"][data-v="egg"]'); const q = e.getBoundingClientRect(); window.scrollBy(0, q.top - innerHeight / 3); }); await p.waitForTimeout(150);   // 押す前に画面の中へ
    let q1 = await at(); await p.mouse.click(q1.x, q1.y); await p.waitForTimeout(700);
    const mid = await own(p);
    q1 = await at(); await p.mouse.click(q1.x, q1.y); await p.waitForTimeout(400);
    const a = await own(p);
    ok(!mid.includes('egg') && mid.includes('wheat') && a.includes('egg') && a.includes('wheat'), 'B1 同じチップを 0.7 秒あけて2回押すと、2回とも受ける（卵は外れて、また入る）: ' + JSON.stringify([mid, a]));
    // 人がスクロールしてから別のチップを押す（0.3 秒のうち）: 受ける
    const c = await p.evaluate(() => { const e = document.querySelector('#allergy-card [data-act="alg-toggle"][data-v="egg"]'); const q = e.getBoundingClientRect(); return {x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2}; });
    await p.mouse.click(c.x, c.y);   // 卵を外す
    await p.mouse.wheel(0, 60); await p.waitForTimeout(150);
    const target = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y), t = e && e.closest('[data-act]'); return t ? {act: t.dataset.act, v: t.dataset.v || ''} : null; }, [c.x, c.y]);
    const b0 = await own(p);
    await p.mouse.click(c.x, c.y); await p.waitForTimeout(400);
    const b1 = await own(p);
    const accepted = target && target.act === 'alg-toggle' ? (b0.includes(target.v) !== b1.includes(target.v)) : true;
    ok(accepted, 'B1 人がスクロールしてから押した別のチップは受ける: ' + JSON.stringify({target, b0, b1}));
    await ctx.close();
}
// ---- C1 第56回: アプリが送ったあと 0.6 秒のうちの2回目（1回目からは 0.6 秒を過ぎている）も止める。送ってから 0.6 秒を過ぎた押しは受ける ----
//  自分のアレルギー（なし／卵・小麦）で「小麦」を押すと、押した所を保つ送り（holdView）で別のチップ（卵・かに）が指の下に来る（幅320）。
//  early: 2回目を「1回目から 0.61 秒（送ってから 0.6 秒より前）」に押す → 止める。late: 「送ってから 0.75 秒」に押す → 受ける（止めすぎない）。
//  押しは送った時刻をつけて送る（CDP の timestamp。遅い機械でも、押しの時刻がテストの道具の待ちでずれない）。時刻はアプリの時計で見る。
//  送った時刻は、アプリの記録（spotTap.movedAt）があればそれ、なければ画面が動いた（scroll）時刻。ねらった間合いにならなかった回は 4回までやり直す
{
    const bad = []; let n = 0, late = 0;
    const once = async (lg, w, h, init, wait) => {
        const {p, ctx} = await open(lg, w, h, {settings: {allergens: init}});
        try {
            const cdp = await ctx.newCDPSession(p);
            const sel = '#allergy-card [data-act="alg-toggle"][data-v="wheat"]';
            const c = await p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const q0 = e.getBoundingClientRect(); window.scrollBy(0, q0.top - innerHeight * 0.5); const q = e.getBoundingClientRect(); return {x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2}; }, sel);
            if (!c) return {skip: 'no-chip'};
            await p.waitForTimeout(200);
            await p.evaluate(() => { window.__mv = null; addEventListener('scroll', () => { if (window.__mv == null) window.__mv = performance.now(); }, {capture: true}); });
            const press = async (x, y) => { const ts = Date.now() / 1000; await Promise.all(['mousePressed', 'mouseReleased'].map((type, i) => cdp.send('Input.dispatchMouseEvent', {type, x, y, button: 'left', clickCount: 1, timestamp: ts + i * 0.03}))); };
            await press(c.x, c.y);
            let st = null;
            for (let k = 0; k < 40; k++){ st = await p.evaluate(() => spotTap && window.__mv != null ? {t: spotTap.t, m: spotTap.movedAt != null ? spotTap.movedAt : window.__mv, origin: performance.timeOrigin} : null); if (st) break; await p.waitForTimeout(25); }
            if (!st) return {skip: 'no-move'};
            if (wait === 'early' && st.m + 600 <= st.t + 640) return {skip: 'move-too-early'};   // 送りが早すぎて、この形にならない
            const goal = wait === 'early' ? st.origin + st.t + 610 : st.origin + st.m + 750;
            await p.waitForTimeout(Math.max(0, goal - Date.now()));
            const under = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y), t = e && e.closest('[data-act]'); return t ? t.dataset.act + ':' + (t.dataset.v || '') : ''; }, [c.x, c.y]);
            const b0 = await own(p);
            await p.evaluate(() => { window.__ck = null; document.addEventListener('click', e => { window.__ck = {ts: e.timeStamp, t: spotTap && spotTap.t, m: spotTap && spotTap.movedAt != null ? spotTap.movedAt : window.__mv}; }, {capture: true, once: true}); });
            await press(c.x, c.y); await p.waitForTimeout(150);
            const tip = await p.evaluate(() => !!document.querySelector('.tap-again')), ck = await p.evaluate(() => window.__ck);
            await p.waitForTimeout(300);
            const b1 = await own(p);
            if (!under || under === 'alg-toggle:wheat' || !ck) return {skip: 'same-under'};   // 指の下に別のチップが来ていない
            return {under, b0, b1, tip, sinceFirst: Math.round(ck.ts - ck.t), sinceMove: Math.round(ck.ts - ck.m)};
        } finally { await ctx.close(); }
    };
    for (const lg of LANGS) for (const [w, h] of WIDTHS) for (const init of [[], ['egg', 'wheat']]) for (const wait of ['early', 'late']){
        const tag = `${lg} ${w} ${JSON.stringify(init)} ${wait}`;
        for (let tr = 0; tr < 4; tr++){
            const r = await once(lg, w, h, init, wait);
            if (process.env.DBG) console.log(tag, JSON.stringify(r));
            if (r.skip === 'no-chip' || r.skip === 'no-move' || r.skip === 'same-under') break;   // この幅・言語では、この形にならない
            if (r.skip) continue;
            const info = `1回目から${r.sinceFirst}ms・送ってから${r.sinceMove}ms 下=${r.under} ${JSON.stringify(r.b0)}→${JSON.stringify(r.b1)} tip=${r.tip}`, chg = JSON.stringify(r.b0) !== JSON.stringify(r.b1);
            if (r.sinceFirst < 600 || r.sinceMove < 600){ if (chg || !r.tip) bad.push(`${tag}: 0.6 秒のうちの2回目が、指の下に来た別のチップを押した ${info}`); }   // 止まるべき押しは、どの回でも止まっていること
            else if (r.sinceMove >= 640 && (!chg || r.tip)) bad.push(`${tag}: 送ってから 0.6 秒を過ぎた押しが受けられない（止めすぎ） ${info}`);
            if (wait === 'early' && r.sinceFirst >= 600 && r.sinceMove < 600){ n++; break; }
            if (wait === 'late' && r.sinceMove >= 640){ late++; break; }
        }
    }
    ok(n > 0 && late > 0 && bad.length === 0, `C1 アプリが送ってから 0.6 秒のうちの2回目は止める（${n}回）・過ぎた押しは受ける（${late}回）（${LANGS.length}言語 × 195・320・390）: ` + bad.slice(0, 6).join(' | '));
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
