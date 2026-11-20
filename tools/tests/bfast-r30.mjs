#!/usr/bin/env node
// オーナー決定 Q35=B: 日本の朝食を 16 品に（Playwright。使い方: node tools/tests/bfast-r30.mjs [http://localhost:9403/]）
//  A1 日本の朝食が 14〜16 品。新しい8品がそろい、BREAKFAST_JP・YOMI（読み）・英語/韓国語/タイ語/ベトナム語の名前がある
//  A2 アレルゲン1つ・2つ組み（13アレルゲン＋ハラール・ベジタリアン・ヴィーガン）にしても、日本の朝食が 2 品以上残る。ベジ・ヴィーガン単独でも 2 品以上
//  A3 新しい朝食を、自分の正規表現（原文の料理名・材料名・調味料だけ。13アレルゲン）で照合し、アプリの判定が取りこぼさない
//  A4 新しい朝食は 5〜10 分・手順 3 つ・夕食（おまかせの主菜・副菜・汁もの）には出ない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const NEW = ['sake_zakkoku', 'shirasu_tkg', 'okayu_asa', 'natto_omelet', 'tofu_wakame_miso', 'yaki_onigiri', 'satsumaimo_banana', 'hotcake_asa'];
// 自分の照合（アプリの正規表現は使わない）: 13アレルゲン（原文＝日本語の名前・材料・調味料）
const OWN = {egg: /卵|たまご|玉子|エッグ|オムレツ|ホットケーキ/, milk: /牛乳|ミルク|バター|チーズ|ヨーグルト|クリーム|ホットケーキ/, wheat: /小麦|パン|ホットケーキ|麺|醤油|粉/,
    soy: /大豆|豆腐|納豆|味噌|みそ|醤油|油揚げ|豆乳/, peanut: /ピーナッツ|落花生/, sesame: /ごま|ゴマ|胡麻/, shrimp: /えび|海老/, crab: /かに|蟹/, walnut: /くるみ|クルミ/,
    buckwheat: /そば|蕎麦/, fish: /鮭|さけ|しらす|魚|さば|かつお|いりこ|ツナ/   // だし（かつお）は、魚アレルギーのとき昆布だしに替わる決まり（下の A3b）
    , treenut: /アーモンド|カシュー|ピスタチオ|ヘーゼルナッツ|マカダミア|ペカン/, gluten: /小麦|パン|ホットケーキ|麺|醤油|大麦|ライ麦/};
const ALGS = Object.keys(OWN);
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const KEY = 'gohancho.v1';
async function open(lang){
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r30', 'JP', lang)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lang + ': ' + e.message));
    await p.clock.install({time: new Date('2026-10-29T06:10:00+09:00')});
    await p.addInitScript(([lang, KEY]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem(KEY, JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: {country: 'JP', uiLang: lang, dishCount: 4, servings: 2, avoidSwap: true}})); } }, [lang, KEY]);
    await p.goto(URL_); await ready(p); await p.clock.runFor(800);
    return {ctx, p};
}
{
    const {ctx, p} = await open('ja');
    const base = await p.evaluate(() => ({n: breakfastDishes().length, ids: breakfastDishes().map(r => r.id)}));
    ok(base.n >= 14 && base.n <= 16, `A1 日本の朝食が14〜16品: ${base.n}`);
    ok(NEW.every(id => base.ids.includes(id)), `A1 新しい朝食がそろう: ${base.ids.join()}`);
    const meta = await p.evaluate(NEW => NEW.map(id => { const r = RECIPES.find(x => x.id === id); return {id, ok: !!r, min: r && r.min, steps: r && r.steps.length, yomi: YOMI[id] || '', inSet: BREAKFAST_JP.has(id), main: r && r.main, type: r && r.type}; }), NEW);
    for (const m of meta){
        ok(m.ok && m.min >= 5 && m.min <= 10, `A4 ${m.id}: 5〜10分: ${m.min}`);
        ok(m.steps >= 3 && m.steps <= 4, `A4 ${m.id}: 手順 3〜4: ${m.steps}`);
        ok(/^[ぁ-んー,]+$/.test(m.yomi), `A1 ${m.id}: 読みがひらがな: ${m.yomi}`);
        ok(m.inSet, `A1 ${m.id}: BREAKFAST_JP にある`);
    }
    // A2
    const zero = await p.evaluate(() => {
        const cnt = rs => { S.settings.allergens = []; S.settings.avoid = []; rs.forEach(x => { S.settings.allergens.push(...x.al); S.settings.avoid.push(...x.av); }); S.settings.avoid = [...new Set(S.settings.avoid)];
            avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; const n = breakfastDishes().length; S.settings.allergens = []; S.settings.avoid = []; avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; return n; };
        const algs = Object.keys(ALG_DEF), diets = ['vegi', 'vegan', 'halal'];
        const all = [...algs.map(a => ({k: a, al: [a], av: []})), ...diets.map(d => ({k: d, al: [], av: dietBundleToggle([], d)}))];
        const low = []; all.forEach(x => { const n = cnt([x]); if (n < 2) low.push(x.k + '=' + n); });
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++){ const n = cnt([all[i], all[j]]); if (n < 2) low.push(all[i].k + '+' + all[j].k + '=' + n); }
        return {low, vegi: cnt([all.find(x => x.k === 'vegi')]), vegan: cnt([all.find(x => x.k === 'vegan')]), nalg: algs.length};
    });
    ok(!zero.low.length, `A2 日本: 2品未満になる組み合わせ ${zero.low.length}: ${zero.low.slice(0, 8).join(' ')}`);
    ok(zero.vegi >= 2 && zero.vegan >= 2, `A2 ベジ ${zero.vegi} ・ヴィーガン ${zero.vegan} が2品以上`);
    ok(zero.nalg === 13 || zero.nalg > 13, `A2 アレルゲン数 ${zero.nalg}`);
    // A3
    const rows = await p.evaluate(ids => ids.map(id => {
        const r = RECIPES.find(x => x.id === id); const txt = [r.name, ...r.ings, r.seas].join(' | ');
        const hit = {}; ['egg', 'milk', 'wheat', 'soy', 'peanut', 'sesame', 'shrimp', 'crab', 'walnut', 'buckwheat', 'fish', 'treenut', 'gluten'].forEach(a => {
            S.settings.allergens = [a]; avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; hit[a] = allergyConflict(r); });
        S.settings.allergens = []; return {id, txt, hit};
    }), NEW);
    for (const row of rows) for (const [a, re] of Object.entries(OWN)) if (re.test(row.txt)) ok(row.hit[a], `A3 ${row.id}: ${a} を取りこぼし（${row.txt.slice(0, 90)}）`);
    // A3b だしの料理は、魚アレルギーなら昆布だしに替わって残り、ヴィーガンでも残る
    const dashi = await p.evaluate(() => { const out = {}; for (const [k, cfg] of [['fish', {allergens: ['fish']}], ['vegan', {avoid: dietBundleToggle([], 'vegan')}]]){
        S.settings.allergens = cfg.allergens || []; S.settings.avoid = cfg.avoid || []; avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null;
        const ids = breakfastDishes().map(r => r.id); const r = RECIPES.find(x => x.id === 'tofu_wakame_miso'); const sw = (typeof swappedRecipe === 'function' && swappedRecipe(r)) || r;
        out[k] = {shown: ids.includes('tofu_wakame_miso'), seas: typeof seasFor === 'function' ? seasFor(r) : sw.seas}; }
        S.settings.allergens = []; S.settings.avoid = []; avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; return out; });
    ok(dashi.fish.shown && !/かつお|鰹/.test(dashi.fish.seas) && /昆布/.test(dashi.fish.seas), `A3b 魚アレルギーでは昆布だしに替わって出る: ${JSON.stringify(dashi.fish)}`);
    ok(dashi.vegan.shown, `A3b ヴィーガンでも出る: ${JSON.stringify(dashi.vegan)}`);
    // A4 夕食に出ない（おまかせの献立を何回か作る）
    const dinner = await p.evaluate(NEW => { let n = 0; const bad = []; for (let k = 0; k < 40; k++){ try { newMenu(); ((session.menu && session.menu.items) || []).forEach(x => { if (x.r && NEW.includes(x.r.id)) bad.push(x.r.id); }); n++; } catch (e) { bad.push('ERR ' + e.message); } } if (!n) bad.push('献立が作れない'); return bad; }, NEW);
    ok(!dinner.length, `A4 夕食の献立に朝食が出る: ${dinner.join()}`);
    await ctx.close();
}
// 翻訳: 英・韓・タイ・ベトナム語の画面で、新しい朝食の名前が日本語のままにならない
for (const lang of ['en', 'ko', 'th', 'vi']){
    const {ctx, p} = await open(lang);
    const nm = await p.evaluate(NEW => NEW.map(id => { const r = RECIPES.find(x => x.id === id); return [id, r ? (typeof dispName === 'function' ? dispName(r) : r.name) : null]; }), NEW);
    for (const [id, n] of nm) ok(n && !/[ぁ-んァ-ヶ]/.test(n), `T ${lang} ${id}: 名前が訳されている: ${n}`);
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(fails ? `NG ${fails}` : 'OK bfast-r30');
process.exit(fails ? 1 : 0);
