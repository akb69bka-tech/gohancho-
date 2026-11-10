#!/usr/bin/env node
// 2つの窓でほぼ同時に変えたときに、消えず・食い違わないことの回帰テスト（第37回 利用者モニター R171・R172。使い方: node tools/tests/tab37.mjs [http://localhost:8795/]）
//  R171a 同じ家族の人に、2つの窓でちがうアレルギーをほぼ同時（0秒差）に足しても、両方残る（3回）
//  R171b 2つの窓でほぼ同時（0.15秒以内）に「この献立に決定」を押しても、作り方（決めた献立）と今日（下書き）が同じ献立で、両方の窓・開き直しても同じ（3回）
//        変えた時刻（S.mt）で新しい方を選ぶ。mt のない前の版のデータも読める
//  R172 片方で家族の人を消し、もう片方（入力中）でその人にアレルギーを足したら、消したのはそのまま、足した側に「消されたため残りませんでした」と知らせる
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: got ${JSON.stringify(a)} expected ${JSON.stringify(e)}`);
const isReady = () => typeof S !== 'undefined' && typeof session !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *') && GH.booted;
const ready = p => p.waitForFunction(isReady, null, { timeout: 30000 });
// 読み直しの最中に読みに行ったとき（CI の遅い機械で、別のタブの保存を受けて2回読み直すことがある）は、読みこみが終わってから読みなおす。読み直したかどうかの確かめは performance.timeOrigin でしているので、ここでは中身だけを読みなおす
const watch = p => { p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) p.errs.push(m.text()); }); const ev0 = p.evaluate.bind(p); p.evaluate = async (...a) => { for (let i = 0; ; i++){ try{ return await ev0(...a); }catch(e){ if (i >= 4 || !/context was destroyed|navigation/i.test(e.message)) throw e; await p.waitForLoadState('load').catch(() => {}); await p.waitForFunction(() => typeof S !== 'undefined' && document.querySelector('#app, body'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(300); } } }; return p; };
const origin = p => p.evaluate(() => performance.timeOrigin).catch(() => 0);
// 保存の中身を読む。読んでいる最中にそのタブが読み直したら（別のタブの保存を受けたとき。CI の遅い機械で起きる）、落ち着いてから読みなおす
const saved = async p => { for (let i = 0; ; i++){ try{ return await p.evaluate(() => JSON.parse(localStorage.getItem('gohancho.v1'))); }catch(e){ if (i >= 4 || !/context was destroyed|navigation/i.test(e.message)) throw e; await p.waitForLoadState('load').catch(() => {}); await p.waitForTimeout(300); } } };
const ev = (p, f, a) => p.evaluate(f, a).catch(async e => { if (!/context was destroyed|navigation/i.test(e.message)) throw e; await ready(p); return null; });
const FAM = [{id: 'f1', name: '娘', role: 'child', avoid: ['@milk'], allergy: ['@milk'], mild: false, sometimes: false, me: false}, {id: 'f2', name: '父', role: 'adult', avoid: ['@shrimp'], allergy: ['@shrimp'], mild: false, sometimes: false, me: false}];

async function pair(seed){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo', locale: 'ja-JP', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat/, r => r.abort());
    await ctx.addInitScript(s => {
        if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3}}, s || {})));
        Object.defineProperty(document, 'hidden', { get: () => sessionStorage.getItem('hid') === '1' });
        Object.defineProperty(document, 'visibilityState', { get: () => sessionStorage.getItem('hid') === '1' ? 'hidden' : 'visible' });
    }, seed || null);
    const A = watch(await ctx.newPage()); await A.goto(URL_); await ready(A);
    const B = watch(await ctx.newPage()); await B.goto(URL_); await ready(B);
    await settle(A, B);
    return { ctx, A, B };
}
async function settle(A, B){
    for (let i = 0, last = ''; i < 20; i++){ await A.waitForTimeout(500); const k = JSON.stringify(await Promise.all([A, B].map(origin))); if (k === last) break; last = k; }
    await ready(A); await ready(B);
    for (const p of [A, B]) await p.evaluate(() => sessionStorage.removeItem('gohanOther'));
}
async function reloaded(p, t0, ms = 12000){
    for (let i = 0; i < ms / 200; i++){ await p.waitForTimeout(200); if (await origin(p) !== t0 && await origin(p) !== 0) break; }
    const t = await origin(p); if (t !== t0) await ready(p);
    return t !== t0 && t !== 0;
}
// 読み直したか、読み直さずにその場で保存の中身にそろったか（まぜて書いたあとは、どちらでもよい。CI の遅い機械では読み直す前にそろうことがある）
const inSync = p => p.evaluate(() => { try{ return sameStore(localStorage.getItem('gohancho.v1'), JSON.stringify(stateToKeep())); }catch(e){ return false; } }).catch(() => false);
const setHidden = (p, h) => ev(p, h => { sessionStorage.setItem('hid', h ? '1' : '0'); document.dispatchEvent(new Event('visibilitychange')); if (!h) window.dispatchEvent(new Event('focus')); }, h);
const lostNote = p => p.evaluate(() => { const n = document.getElementById('gh-note-lost'); return n ? [n.innerText, [...n.querySelectorAll('[data-gh]')].map(x => x.dataset.gh + ':' + x.textContent)] : null; });


const algOf = (s, id) => ((s && s.family || []).find(m => m.id === id) || {}).allergy || null;

// ================= R171a: 同じ人に、ちがうアレルギーをほぼ同時に足す =================
{
    const { ctx, A, B } = await pair({ family: [FAM[0]] });
    const words = [['そば', 'くるみ'], ['キウイ', 'バナナ'], ['もも', 'りんご']];
    let lostN = 0;
    for (const [wa, wb] of words){
        await settle(A, B);
        const add = w => { const m = S.family.find(x => x.id === 'f1'); if (!m.avoid.includes(w)) m.avoid.push(w); m.allergy.push(w); save(); saveNow(); };
        await Promise.all([ev(A, add, wa), ev(B, add, wb)]);
        await A.waitForTimeout(1500);
        await settle(A, B);
        const sa = await saved(A), sb = await saved(B);
        const pa = await A.evaluate(() => S.family.find(x => x.id === 'f1').allergy), pb = await B.evaluate(() => S.family.find(x => x.id === 'f1').allergy);
        const all = [algOf(sa, 'f1'), algOf(sb, 'f1'), pa, pb].every(a => a && a.includes(wa) && a.includes(wb));
        if (!all){ lostN++; console.log('  R171a', wa, wb, JSON.stringify([algOf(sa, 'f1'), pa, pb])); }
    }
    eq(lostN, 0, 'R171a 同じ人に、ほぼ同時に足したちがうアレルギーが、3回とも両方残る（保存・両方の窓）');
    const s = await saved(A);
    eq(algOf(s, 'f1').slice().sort(), ['@milk', 'くるみ', 'そば', 'キウイ', 'バナナ', 'もも', 'りんご'].sort(), 'R171a 前からの乳も残る');
    eq(await lostNote(A) || await lostNote(B), null, 'R171a 「一部が消えました」は出ない（消えていない）');
    eq([...A.errs, ...B.errs], [], 'R171a 例外なし');
    await ctx.close();
}

// ================= R171b: ほぼ同時に「この献立に決定」 =================
{
    const view = p => p.evaluate(() => { ensureMenu(); return {cook: S.cook && S.cook.d === TODAY ? S.cook.ids.join() : '', draft: S.draft && S.draft.d === TODAY ? S.draft.ids.filter(Boolean).join() : '', menu: menuIds().join(), dec: menuIsDecided(), day: ((S.day || {})[TODAY] || {}).state || ''}; });
    let bad = [];
    for (let round = 0; round < 3; round++){
        const { ctx, A, B } = await pair();
        await ev(A, () => setTab('today')); await ev(B, () => setTab('today'));
        await settle(A, B);
        // B だけ別の案にしてから決める（A はいまの案のまま決める）。0.1秒ずらす
        const decA = () => { setTab('today'); document.querySelector('[data-act=decide]').click(); return menuIds().join(); };
        const decB = () => { setTab('today'); const a = menuIds().join(); for (let i = 0; i < 30 && menuIds().join() === a; i++) newMenu(); keepDraft(); render(); document.querySelector('[data-act=decide]').click(); return menuIds().join(); };
        const [ia, ib] = await Promise.all([ev(A, decA), B.waitForTimeout(round * 70).then(() => ev(B, decB))]);
        ok(ia && ib && ia !== ib, `R171b(${round}) 2つの窓でちがう献立を決めた ${ia} / ${ib}`);
        await A.waitForTimeout(1500);
        await settle(A, B);
        const va = await view(A), vb = await view(B), s = await saved(A);
        const one = v => v.cook && v.cook === v.draft && v.cook === v.menu && v.dec;
        if (!one(va) || !one(vb) || va.cook !== vb.cook || s.cook.ids.join() !== va.cook || s.draft.ids.filter(Boolean).join() !== va.cook) bad.push(`(${round}) A ${JSON.stringify(va)} B ${JSON.stringify(vb)} saved ${s.cook.ids.join()}/${s.draft.ids.filter(Boolean).join()}`);
        ok([ia, ib].includes(va.cook), `R171b(${round}) 決めた献立は、どちらかの窓で決めたもの（混ぜない）`);
        ok(s.mt && s.mt.menu > 0, `R171b(${round}) 決めた献立に変えた時刻がつく`);
        // 開き直しても同じ
        for (const p of [A, B]){ await p.reload(); await ready(p); }
        await settle(A, B);
        const ra = await view(A), rb = await view(B);
        if (!one(ra) || !one(rb) || ra.cook !== va.cook || rb.cook !== va.cook) bad.push(`(${round}) 開き直し A ${JSON.stringify(ra)} B ${JSON.stringify(rb)} 前 ${va.cook}`);
        eq([...A.errs, ...B.errs], [], `R171b(${round}) 例外なし`);
        await ctx.close();
    }
    eq(bad, [], 'R171b ほぼ同時に決定しても、作り方（決めた献立）と今日（下書き）が同じ献立。両方の窓・開き直しても同じ（3回）');
}

// ================= R171: 変えた時刻の決まり（merge3）・前の版のデータ =================
{
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const p = watch(await ctx.newPage()); await p.goto(URL_); await ready(p);
    const r = await p.evaluate(() => {
        const N = o => normalizeState(o), d = TODAY;
        const base = N({settings: {allergens: []}, draft: {d, ids: ['a1', 'a2'], slots: ['主菜', '副菜']}});
        const A = N(Object.assign(structuredClone(base), {cook: {d, ids: ['a1', 'a2']}, mt: {menu: 1000}}));
        const B = N(Object.assign(structuredClone(base), {cook: {d, ids: ['b1', 'b2']}, draft: {d, ids: ['b1', 'b2'], slots: ['主菜', '副菜']}, mt: {menu: 1100}}));
        // A のタブで、B が届いた（届いた時刻は A の変更よりあと・あとから届いた A の変更の方が届くのが遅い、のどちらも）
        const m1 = mergeStates(JSON.stringify(base), JSON.stringify(B), JSON.stringify(A)).out;
        mineAt = 5000; theirAt = 1;   // 届いた時刻では A が新しく見えても、変えた時刻で B
        const m2 = mergeStates(JSON.stringify(base), JSON.stringify(B), JSON.stringify(A)).out;
        const m3 = mergeStates(JSON.stringify(base), JSON.stringify(A), JSON.stringify(B)).out;
        // 片方が、相手の書いたものを見ないまま書いた（base = このタブの書いたもの）: 変えた時刻の新しい方
        const m4 = mergeStates(JSON.stringify(B), JSON.stringify(A), JSON.stringify(B)).out;
        // 決めていない側（下書きを変えただけ）が新しくても、決めた献立は消えない
        const C = N(Object.assign(structuredClone(base), {draft: {d, ids: ['c1', 'c2'], slots: ['主菜', '副菜']}, mt: {menu: 1200}}));
        const m5 = mergeStates(JSON.stringify(base), JSON.stringify(A), JSON.stringify(C)).out;
        // 前の版（mt なし）のデータも読めて、まぜられる。決めた献立と下書きはそろう
        const oldA = Object.assign(structuredClone(A)); delete oldA.mt; const oldB = structuredClone(B); delete oldB.mt;
        mineAt = 0; theirAt = Date.now() + 1e6;
        const m6 = mergeStates(JSON.stringify(base), JSON.stringify(oldB), JSON.stringify(oldA)).out;
        mineAt = 0; theirAt = 0;
        const j = o => [(o.cook || {}).ids.join(), (o.draft || {ids: []}).ids.filter(Boolean).join() || (o.cook || {}).ids.join()];
        return {m1: j(m1), m2: j(m2), m3: j(m3), m4: j(m4), m5: j(m5), m6: j(m6), mt: m1.mt, n: !!N({mt: {menu: 'x', bad: 3, week: 5}}).mt && N({mt: {menu: 'x', bad: 3, week: 5}}).mt};
    });
    eq([r.m1, r.m2, r.m3, r.m4], [['b1,b2', 'b1,b2'], ['b1,b2', 'b1,b2'], ['b1,b2', 'b1,b2'], ['b1,b2', 'b1,b2']], 'R171 決めた献立と下書きは、変えた時刻の新しい方（届いた順・どちらのタブでまぜても同じ）でそろう');
    eq(r.m5, ['a1,a2', 'a1,a2'], 'R171 下書きを変えただけの側が新しくても、決めた献立は変わらない（下書きも決めた献立にそろう）');
    eq(r.m6[0], r.m6[1], 'R171 前の版（変えた時刻なし）のデータでも、決めた献立と下書きはそろう');
    eq([r.mt && r.mt.menu, r.n], [1100, {week: 5}], 'R171 変えた時刻は新しい方を残す・読めない値は捨てる');
    eq(p.errs, [], 'R171 merge 例外なし');
    await ctx.close();
}

// ================= R172: 消された人に足したアレルギー =================
{
    const FAM2 = [FAM[0], FAM[1]];
    // (a) 入力中のタブ: あちらで「父」が消されたあとに、この人にアレルギーを足す
    {
        const { ctx, A, B } = await pair({ family: FAM2 });
        await ev(B, () => { const i = document.createElement('input'); i.id = 't37in'; document.body.appendChild(i); i.focus(); });
        await ev(A, () => { S.family = S.family.filter(m => m.id !== 'f2'); save(); saveNow(); });
        await B.waitForTimeout(800);
        await ev(B, () => { const m = S.family.find(x => x.id === 'f2'); if (m){ m.avoid.push('そば'); m.allergy.push('そば'); } save(); });
        await B.waitForTimeout(1200);
        const n = await B.evaluate(() => { const x = document.getElementById('gh-note-famgone'); return x ? x.innerText : null; });
        ok(n && /父/.test(n) && /消されたため/.test(n), 'R172 入力中: 足した側に「『父』さんが家族から消されたため…残りませんでした」と出る ' + JSON.stringify(n));
        await ev(B, () => { const i = document.getElementById('t37in'); if (i) i.blur(); });
        await B.waitForTimeout(800);
        await settle(A, B);
        const s = await saved(A);
        eq([s.family.map(m => m.id), await A.evaluate(() => S.family.map(m => m.id)), await B.evaluate(() => S.family.map(m => m.id))], [['f1'], ['f1'], ['f1']], 'R172 入力中: 消したのはそのまま（両方の窓・保存）');
        eq(await lostNote(B), null, 'R172 入力中: 「一部が消えました」（戻すボタン）は出さない');
        eq(await A.evaluate(() => !!document.getElementById('gh-note-famgone')), false, 'R172 消した側には出ない');
        eq([...A.errs, ...B.errs], [], 'R172 入力中 例外なし');
        await ctx.close();
    }
    // (b) ほぼ同時: 片方で消す・もう片方でその人にアレルギーを足す
    {
        const { ctx, A, B } = await pair({ family: FAM2 });
        await Promise.all([
            ev(A, () => { S.family = S.family.filter(m => m.id !== 'f2'); save(); saveNow(); }),
            ev(B, () => { const m = S.family.find(x => x.id === 'f2'); m.avoid.push('くるみ'); m.allergy.push('くるみ'); save(); saveNow(); }),
        ]);
        await B.waitForTimeout(1500);
        await settle(A, B);
        const s = await saved(A);
        eq([s.family.map(m => m.id), await A.evaluate(() => S.family.map(m => m.id)), await B.evaluate(() => S.family.map(m => m.id))], [['f1'], ['f1'], ['f1']], 'R172 ほぼ同時: 消したのはそのまま（あとから届いた足した側の保存で、生き返らない）');
        const n = await B.evaluate(() => { const x = document.getElementById('gh-note-famgone'); return x ? x.innerText : null; });
        ok(n && /父/.test(n), 'R172 ほぼ同時: 足した側に知らせが出る（読み直したあとも） ' + JSON.stringify(n));
        eq([...A.errs, ...B.errs], [], 'R172 ほぼ同時 例外なし');
        await ctx.close();
    }
}

await b.close();
console.log(`tab37: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
