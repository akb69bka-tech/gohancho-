#!/usr/bin/env node
// R133 朝食の料理（meal: breakfast）が全21か国にあり、アレルギー・食の決まりを入れても1品以上残る（Playwright。使い方: node tools/tests/bfast-r1.mjs [http://localhost:9102/]）
//  B1 全21か国に朝食の料理がある（フランス・ドイツ・イタリア・スペイン・ポーランド・エジプト・ベトナム・インドネシア・ブラジル・ペルーは3品以上、日本は5品以上）。朝食の料理の ID に国の印（xx_）がある
//  B2 各設定でも1品以上残る: 卵・乳・魚・小麦のアレルギー / 肉（豚・鶏・牛）を避ける / ベジタリアン / ヴィーガン / ハラール
//     ベジタリアン・ヴィーガン・ハラールは「束ねたチップ」と同じ内容（DIET_BUNDLES）で判定
//  B3 アレルゲンの照合: 朝食の料理の材料に卵（egg）・乳（milk）を含む料理は、そのアレルギーの人の breakfastDishes() に出ない
//  B4 朝食の料理がある国は朝の入口（bf-open）が出る（朝6時・設定なし）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
const NEW10 = ['FR','DE','IT','ES','PL','EG','VN','ID','BR','PE'];   // R133 で朝食を新しく足した国（3品以上）
const LANG_OF = {JP:'ja',TW:'zh-Hant',CN:'zh-Hans',KR:'ko',US:'en',TH:'th',VN:'vi',FR:'fr',DE:'de',IN:'hi',MX:'es',BR:'pt-BR',GB:'en',IT:'it',ES:'es',TR:'tr',EG:'ar',PE:'es',PL:'pl',PH:'fil',ID:'id'};
const PROFILES = {
    '卵アレルギー': {allergens: ['egg']}, '乳アレルギー': {allergens: ['milk']}, '魚アレルギー': {allergens: ['fish']}, '小麦アレルギー': {allergens: ['wheat']},
    '肉を避ける': {avoid: true}, 'ベジタリアン': 'vegi', 'ヴィーガン': 'vegan', 'ハラール': 'halal'};
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
for (const cc of CCS){
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('bfast', cc)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.clock.install({time: new Date('2026-10-29T06:10:00+09:00')});
    await p.addInitScript(([cc, lang]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: {country: cc, uiLang: lang, dishCount: 4, servings: 2}})); } }, [cc, LANG_OF[cc]]);
    await p.goto(URL_); await ready(p); await p.clock.runFor(800);
    const base = await p.evaluate(() => ({n: breakfastDishes().length, ids: breakfastDishes().map(r => r.id), cc: currentCountry(), entry: !!document.querySelector('#view [data-act=bf-open]')}));
    ok(base.cc === cc, `${cc}: 国が切り替わる: ${base.cc}`);
    const need = cc === 'JP' ? 5 : NEW10.includes(cc) ? 3 : 1;
    ok(base.n >= need, `B1 ${cc}: 朝食の料理が${need}品以上: ${base.n} ${base.ids.join()}`);
    ok(base.ids.every(id => cc === 'JP' || id.startsWith(cc.toLowerCase() + '_')), `B1 ${cc}: 朝食の ID に国の印`);
    ok(base.entry === (base.n > 0), `B4 ${cc}: 朝の入口が出る: ${JSON.stringify(base)}`);
    for (const [label, prof] of Object.entries(PROFILES)){
        const n = await p.evaluate(prof => {
            S.settings.allergens = []; S.settings.avoid = [];
            if (typeof prof === 'string') S.settings.avoid = dietBundleToggle([], prof);
            else { if (prof.allergens) S.settings.allergens = prof.allergens; if (prof.avoid) S.settings.avoid = dietBundleToggle([], 'vegi').filter(x => ['pork', 'chicken', 'beef'].includes(avoidFamOf(x))); }
            avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null;
            const r = breakfastDishes().map(r => r.id);
            S.settings.allergens = []; S.settings.avoid = [];
            return r;
        }, prof);
        ok(n.length >= 1, `B2 ${cc} ${label}: 1品以上残る: ${n.length}`);
    }
    // B3 卵・乳のアレルゲン照合: 材料に egg / 乳製品の語があれば、アレルギーの人には出ない
    const chk = await p.evaluate(() => {
        const out = {egg: [], milk: []};
        const all = RECIPES.filter(r => breakfastMeal(r));
        const has = (r, re) => r.items.some(i => re.test((i.key + '|' + (i.en || '')).toLowerCase().replace(/\b(coconut|soy|almond|oat) milk\b/g, '')));
        for (const [al, re] of [['egg', /\beggs?\b/], ['milk', /\b(milk|butter|cheese|cream|yogh?urt|ghee|paneer|kefir)\b/]]){
            S.settings.allergens = [al]; avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null;
            const shown = new Set(breakfastDishes().map(r => r.id));
            all.forEach(r => { if (has(r, re) && shown.has(r.id)) out[al].push(r.id); });
        }
        S.settings.allergens = []; return out;
    });
    ok(!chk.egg.length && !chk.milk.length, `B3 ${cc}: 卵・乳を含む朝食がアレルギーの人に出ない: ${JSON.stringify(chk)}`);
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(fails ? `NG ${fails}` : 'OK bfast-r1');
process.exit(fails ? 1 : 0);
