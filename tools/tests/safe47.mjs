#!/usr/bin/env node
// 第47回（安全）: アレルギーを外したときの知らせと「元に戻す」
//  使い方: node tools/tests/safe47.mjs [http://localhost:9291/]
//  T1 設定の「アレルギー対策」で自分のアレルゲン（全員共通・乳）を外すと、「アレルギー対策から「乳」を外しました」と「元に戻す」が見える。
//     押すと乳が戻り、まだ決めていない献立に乳の料理が残らない（日本語・英語・アラビア語、390px・320px）
//  T2 「元に戻す」が出ている 8 秒のうちに別のお知らせが出ても、「元に戻す」は消えない（別のお知らせの文と、外した知らせの文が両方見える）。
//     押すとアレルゲンが戻る。別のお知らせが、家族のアレルギーを足したときの「献立を替えました」でも同じ
//  T3 続けて外した（自分のアレルゲン → 家族のアレルギー）ときは、知らせに両方が出て、「元に戻す」で両方とも戻る
//  T4 足すとき（オフ → オン）は、外した知らせを出さない。献立を作り直しても（気分を変える）、アレルギーの「元に戻す」は消えない
//  T5 外した知らせは 8 秒ほどで消える（別のお知らせが出ても、ずっと残りはしない）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const boot = p => p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 60000 }).catch(() => {});
const open = async (tag, { W = 390, H = 844, lang = 'ja', cc = 'JP', alg = ['milk'], fam = [] } = {}) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('safe47', tag)));
    const st = { onboarded: true, algAsk: 0, firstUse: '2026-11-11', foldOpen: {}, settings: { country: cc, uiLang: lang, dishCount: 3, servings: 2, allergens: alg }, family: fam };
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await boot(p); await p.waitForTimeout(400);
    return { p, ctx };
};
const ALG = v => `#view [data-act="alg-toggle"][data-v="${v}"]`;
const tap = async (p, sel) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); await l.tap(); };
const toastState = p => p.evaluate(() => {
    const tb = document.querySelector('#toast-root .toast'), u = tb && tb.querySelector('[data-act="toast-undo"]');
    let vis = false; if (tb){ const r = tb.getBoundingClientRect(), cs = getComputedStyle(tb); vis = r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.opacity !== '0' && !tb.classList.contains('placing'); }
    let uvis = false; if (u){ const r = u.getBoundingClientRect(); uvis = r.height > 0 && r.bottom > 0 && r.top < innerHeight; }
    return { text: tb ? (tb.getAttribute('aria-label') || tb.textContent).trim() : null, undo: !!u, vis, uvis };
});
const undo = async p => { const l = p.locator('#toast-root [data-act="toast-undo"]'); if (!(await l.count())) return false; try{ await l.tap({ timeout: 5000 }); }catch(e){ return false; } await p.waitForTimeout(600); return true; };
const algs = p => p.evaluate(() => S.settings.allergens.slice());
// 献立の主菜に、乳を使う料理を入れておく（外して戻したあと、献立から外れること）
const milkDish = p => p.evaluate(() => { const m = session.menu; if (!m) return null; const i = m.items.findIndex(x => x.slot === '主菜'); S.settings.allergens = []; const d = RECIPES.find(r => r.main && !isAvoided(r) && algSelectedHits(r, ['milk']).length && !algSelectedHits(r, ['egg']).length); S.settings.allergens = ['milk']; if (i < 0 || !d) return null; return d.id; });

// T1
for (const [W, H, lang, cc] of [[390, 844, 'ja', 'JP'], [320, 640, 'en', 'US'], [390, 844, 'ar', 'EG']]){
    const { p, ctx } = await open('t1' + lang, { W, H, lang, cc });
    await p.evaluate(() => setGo('allergy-card')); await p.waitForTimeout(700);
    const label = await p.evaluate(() => algLabel('milk'));
    await tap(p, ALG('milk')); await p.waitForTimeout(700);
    const a1 = await algs(p), s1 = await toastState(p);
    ok(!a1.includes('milk') && s1.undo && s1.vis && s1.uvis && (s1.text || '').includes(label), `T1 ${W}px ${lang}: 乳を外すと、知らせ（${label}）と元に戻すが見える: ` + JSON.stringify({ a1, s1 }));
    // 外しているあいだに献立へ乳の料理を入れておき、元に戻すで献立から外れる
    const d = await p.evaluate(() => { S.settings.allergens = []; const m = session.menu; const i = m ? m.items.findIndex(x => x.slot === '主菜') : -1; const d = RECIPES.find(r => r.main && !isAvoided(r) && algSelectedHits(r, ['milk']).length); if (i >= 0 && d){ m.items[i].r = d; return d.id; } return null; });
    const u = await undo(p); const a2 = await algs(p);
    const bad = await p.evaluate(() => session.menu ? session.menu.items.filter(x => x.r && allergyConflict(x.r)).map(x => x.r.id) : null);
    ok(u && a2.includes('milk') && d && bad && !bad.length, `T1 ${W}px ${lang}: 元に戻すで乳が戻り、献立に乳の料理が残らない: ` + JSON.stringify({ u, a2, d, bad }));
    await ctx.close();
}
// T2a 別のお知らせ（設定のほかの操作）が出ても、元に戻すは消えない
{
    const { p, ctx } = await open('t2a');
    await p.evaluate(() => setGo('allergy-card')); await p.waitForTimeout(700);
    await tap(p, ALG('milk')); await p.waitForTimeout(600);
    await p.evaluate(() => toast(t('{n}人分の分量で表示します', {n: 3}))); await p.waitForTimeout(500);
    const s = await toastState(p), other = await p.evaluate(() => t('{n}人分の分量で表示します', {n: 3})), lab = await p.evaluate(() => algLabel('milk'));
    ok(s.undo && s.vis && s.uvis && s.text.includes(other) && s.text.includes(lab), 'T2 別のお知らせが出ても、元に戻すと外した知らせが残る: ' + JSON.stringify(s));
    const u = await undo(p); const a = await algs(p);
    ok(u && a.includes('milk'), 'T2 そのあと元に戻すで乳が戻る: ' + JSON.stringify({ u, a }));
    await ctx.close();
}
// T2b 家族のアレルギーを足したときの「献立を替えました」が出ても消えない
{
    const { p, ctx } = await open('t2b', { fam: [{ id: 'fa1', name: '夫', role: 'adult', avoid: [], allergy: [], mild: false }] });
    const egg = await p.evaluate(() => { const m = session.menu; const i = m.items.findIndex(x => x.slot === '主菜'); const d = RECIPES.find(r => r.main && !isAvoided(r) && algSelectedHits(r, ['egg']).length && !algSelectedHits(r, ['milk']).length); if (i < 0 || !d) return null; m.items[i].r = d; return d.id; });
    await p.evaluate(() => { session.famOpen = 'fa1'; setGo('allergy-card'); }); await p.waitForTimeout(700);
    await tap(p, ALG('milk')); await p.waitForTimeout(600);
    await tap(p, '#view details.fam-member[data-fm="fa1"] [data-act="fam-alg-fam"][data-v="egg"]'); await p.waitForTimeout(1200);
    const s = await toastState(p), lab = await p.evaluate(() => algLabel('milk'));
    const swapped = await p.evaluate(() => session.menu.items.every(x => !x.r || !allergyConflict(x.r)));
    ok(egg && swapped && s.undo && s.vis && s.uvis && s.text.includes(lab) && s.text.split('\n').length >= 2, 'T2 献立を替えましたのお知らせが出ても、外した知らせと元に戻すが残る: ' + JSON.stringify({ egg, swapped, s }));
    const u = await undo(p); const a = await algs(p), f = await p.evaluate(() => S.family[0].allergy.slice());
    ok(u && a.includes('milk') && f.includes('@egg'), 'T2 元に戻すは乳を戻す（足した卵はそのまま）: ' + JSON.stringify({ a, f }));
    await ctx.close();
}
// T3 続けて外す（自分の乳 → 家族の卵）
{
    const { p, ctx } = await open('t3', { fam: [{ id: 'fa1', name: '夫', role: 'adult', avoid: ['@egg'], allergy: ['@egg'], mild: false }] });
    await p.evaluate(() => { session.famOpen = 'fa1'; setGo('allergy-card'); }); await p.waitForTimeout(700);
    await tap(p, ALG('milk')); await p.waitForTimeout(600);
    await tap(p, '#view details.fam-member[data-fm="fa1"] [data-act="fam-alg-fam"][data-v="egg"]'); await p.waitForTimeout(900);
    const s = await toastState(p), labs = await p.evaluate(() => [algLabel('milk'), avoidFamLabel('egg')]);
    const mid = { a: await algs(p), f: await p.evaluate(() => S.family[0].allergy.slice()) };
    ok(!mid.a.includes('milk') && !mid.f.length && s.undo && s.vis && labs.every(x => s.text.includes(x)), 'T3 続けて外すと、知らせに両方が出る: ' + JSON.stringify({ mid, s }));
    const u = await undo(p); const a = await algs(p), f = await p.evaluate(() => S.family[0].allergy.slice());
    ok(u && a.includes('milk') && f.includes('@egg'), 'T3 元に戻すで両方とも戻る: ' + JSON.stringify({ a, f }));
    await ctx.close();
}
// T4 足すときは知らせを出さない。献立を作り直しても、元に戻すは消えない
{
    const { p, ctx } = await open('t4', { alg: [] });
    await p.evaluate(() => setGo('allergy-card')); await p.waitForTimeout(700);
    await tap(p, ALG('egg')); await p.waitForTimeout(600);
    const s0 = await toastState(p);
    ok(!s0.undo, 'T4 足すときは、外した知らせ・元に戻すを出さない: ' + JSON.stringify(s0));
    await tap(p, ALG('egg')); await p.waitForTimeout(600);
    await p.evaluate(() => { newMenu(); render(); }); await p.waitForTimeout(400);
    const s1 = await toastState(p);
    ok(s1.undo, 'T4 献立を作り直しても、アレルギーの元に戻すは消えない: ' + JSON.stringify(s1));
    await ctx.close();
}
// T5 8 秒ほどで消える
{
    const { p, ctx } = await open('t5');
    await p.evaluate(() => setGo('allergy-card')); await p.waitForTimeout(700);
    await tap(p, ALG('milk')); await p.waitForTimeout(3000);
    await p.evaluate(() => toast('…')); await p.waitForTimeout(2500);
    const mid = await toastState(p);
    await p.waitForTimeout(4500);
    const end = await toastState(p);
    ok(mid.undo && !end.undo, 'T5 別のお知らせが出ても 8 秒ほどで消える（ずっとは残らない）: ' + JSON.stringify({ mid, end }));
    await ctx.close();
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe47: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
