#!/usr/bin/env node
// 第29回 R136・R140・R141 の回帰テスト（Playwright。使い方: node tools/tests/bfast-r29.mjs [http://localhost:9203/]）
//  A1 台湾の朝食が5品以上。大豆アレルギーだけでも朝の入口（bf-open）が出る
//  A2 台湾・インド・アメリカ・イギリス・エジプトで、アレルゲン1つ・2つ組み（全アレルゲン＋ハラール・ベジタリアン・ヴィーガン）にしても、朝食が1品以上残る
//  A3 新しい朝食の料理を、自分の正規表現（原文のキー・名前・調味料の言葉だけ。13アレルゲン）で照合し、アプリの判定が取りこぼさない
//  B1 アラビア語・ベジタリアン向け: 🔍 の材料名にラテン文字が混ざらない（エジプト・タイの全料理）。محشي كوسة は「مكعب مرقة」
//  C1 韓国「콩나물밥」をベジタリアン・ヴィーガンにすると、材料・調味・手順の全言語（ko・ja・en）に肉の語が残らない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const NEW = {TW: ['tw_digua_xifan', 'tw_nangua_xiaomi_zhou', 'tw_shuiguo_pan', 'tw_zheng_digua', 'tw_mantou'], IN: ['in_idli', 'in_moong_chilla', 'in_fruit_chaat'],
    US: ['us_breakfastpotatoes', 'us_berrybowl'], GB: ['gb_bubbleandsqueak', 'gb_stewedpears'], EG: ['eg_batata_mashwiya', 'eg_tamr_fakha']};
const LANG_OF = {TW: 'zh-Hant', IN: 'hi', US: 'en', GB: 'en', EG: 'ar'};
// 自分の照合（アプリの正規表現は使わない）: 13アレルゲン
const OWN = {egg: /\beggs?\b|卵|蛋|बंडे|अंडे|بيض/i, milk: /\b(milk|butter|cheese|cream|yogh?urt|ghee|paneer|curd)\b|牛乳|乳|奶|दूध|दही|لبن|زبادي/i,
    wheat: /\b(wheat|flour|bread|semolina|atta|noodles?|pasta)\b|小麦|麦粉|麵粉|面粉|आटा|गेहूं|قمح|دقيق/i, soy: /\b(soy|soya|tofu|miso|edamame)\w*|大豆|豆腐|味噌|醬油|醤油|सोया/i,
    peanut: /\bpeanuts?\b|\bgroundnuts?\b|落花生|ピーナッツ|花生|मूंगफली|فول سوداني/i, sesame: /\bsesame\b|\btahini\b|ごま|ゴマ|芝麻|तिल|سمسم|طحينة/i,
    shrimp: /\b(shrimps?|prawns?)\b|えび|海老|蝦|झींगा|جمبري/i, crab: /\bcrab\b|かに|蟹|केकड़ा|سلطعون/i, walnut: /\bwalnuts?\b|くるみ|核桃|अखरोट|عين جمل/i,
    buckwheat: /\bbuckwheat\b|\bsoba\b|そば|荞麦|蕎麦/i, fish: /\b(fish|salmon|mackerel|anchov\w*|tuna|cod)\b|魚|鮭|さば|魚|मछली|سمك/i,
    treenut: /\b(almonds?|cashews?|pistachios?|hazelnuts?|pecans?|macadamia)\b|アーモンド|カシュー|ピスタチオ|杏仁|बादाम|काजू|لوز|فستق/i, gluten: /\b(wheat|flour|barley|rye|semolina|atta|bread)\b|小麦|大麦|麦粉|麵粉|आटा|قمح|دقيق|شعير/i};
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const KEY = 'gohancho.v1';
async function open(cc, lang, clock){
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r29', cc, lang)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    if (clock) await p.clock.install({time: new Date('2026-10-29T06:10:00+09:00')});
    await p.addInitScript(([cc, lang, KEY]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem(KEY, JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: {country: cc, uiLang: lang, dishCount: 4, servings: 2, avoidSwap: true}})); } }, [cc, lang, KEY]);
    await p.goto(URL_); await ready(p); if (clock) await p.clock.runFor(800);
    return {ctx, p};
}
// A: 台湾ほか5か国
for (const cc of Object.keys(NEW)){
    const {ctx, p} = await open(cc, LANG_OF[cc], true);
    const base = await p.evaluate(() => ({n: breakfastDishes().length, ids: breakfastDishes().map(r => r.id)}));
    ok(NEW[cc].every(id => base.ids.includes(id)), `${cc}: 新しい朝食がそろう: ${base.ids.join()}`);
    if (cc === 'TW') ok(base.n >= 5 + 2 || base.n >= 5, `A1 TW: 朝食 5品以上: ${base.n}`);
    const zero = await p.evaluate(() => {
        const algs = Object.keys(ALG_DEF), diets = ['vegi', 'vegan', 'halal'];
        const all = [...algs.map(a => ({k: a, al: [a], av: []})), ...diets.map(d => ({k: d, al: [], av: dietBundleToggle([], d)}))];
        const cnt = rs => { S.settings.allergens = []; S.settings.avoid = []; rs.forEach(x => { S.settings.allergens.push(...x.al); S.settings.avoid.push(...x.av); }); S.settings.avoid = [...new Set(S.settings.avoid)];
            avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; const n = breakfastDishes().length; S.settings.allergens = []; S.settings.avoid = []; avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; return n; };
        const z = []; all.forEach(x => { if (!cnt([x])) z.push(x.k); });
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (!cnt([all[i], all[j]])) z.push(all[i].k + '+' + all[j].k);
        return z;
    });
    ok(!zero.length, `A2 ${cc}: 0品になる組み合わせ ${zero.length}: ${zero.slice(0, 6).join(' ')}`);
    // A3 自分の照合
    const rows = await p.evaluate(ids => ids.map(id => {
        const r = RECIPES.find(x => x.id === id); const txt = [r.name, r.local || '', r.seas || '', ...(r.items || []).map(i => i.key + ' ' + (i.en || '') + ' ' + i.label)].join(' | ');
        const hit = {}; ['egg', 'milk', 'wheat', 'soy', 'peanut', 'sesame', 'shrimp', 'crab', 'walnut', 'buckwheat', 'fish', 'treenut', 'gluten'].forEach(a => {
            const idm = {treenut: 'treenut', gluten: 'gluten'}[a] || a; S.settings.allergens = [idm]; avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; hit[a] = allergyConflict(r); });
        S.settings.allergens = []; return {id, txt, hit};
    }), NEW[cc]);
    for (const row of rows) for (const [a, re] of Object.entries(OWN)) if (re.test(row.txt)) ok(row.hit[a], `A3 ${cc} ${row.id}: ${a} を取りこぼし（${row.txt.slice(0, 80)}）`);
    if (cc === 'TW'){
        // 大豆アレルギーだけでも入口が出る
        await p.evaluate(() => { S.settings.allergens = ['soy']; save && save(); });
        await p.reload(); await ready(p); await p.clock.runFor(800);
        const entry = await p.evaluate(() => ({n: breakfastDishes().length, e: !!document.querySelector('#view [data-act=bf-open]')}));
        ok(entry.n >= 5 && entry.e, `A1 TW 大豆: 入口が出る: ${JSON.stringify(entry)}`);
    }
    await ctx.close();
}
// B: アラビア語の 🔍
{
    const {ctx, p} = await open('EG', 'ar', false);
    const r = await p.evaluate(() => {
        S.settings.avoid = dietBundleToggle([], 'vegi'); avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null;
        const bad = []; RECIPES.forEach(x => { let h = []; try { h = dietMayHits(x); } catch (e) {} h.forEach(n => { if (/[A-Za-z]/.test(n)) bad.push(x.id + ':' + n); }); });
        const m = RECIPES.find(x => x.id === 'eg_mahshi'); return {bad, mahshi: dietMayHits(m), badge: dietMayBadgeHtml(m)};
    });
    ok(!r.bad.length, `B1 EG ar: 🔍 の材料名にラテン文字 ${r.bad.slice(0, 4).join(' ')}`);
    ok(r.mahshi.join() === 'مكعب مرقة' && !/stock/i.test(r.badge), `B1 محشي كوسة: ${r.mahshi.join()} / ${r.badge}`);
    await ctx.close();
    const t = await open('TH', 'ar', false);
    const bad = await t.p.evaluate(() => { S.settings.avoid = dietBundleToggle([], 'vegi'); avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; const o = []; RECIPES.forEach(x => { let h = []; try { h = dietMayHits(x); } catch (e) {} h.forEach(n => { if (/[A-Za-z]/.test(n)) o.push(x.id + ':' + n); }); }); return o; });
    ok(!bad.length, `B1 TH ar: 🔍 の材料名にラテン文字 ${bad.slice(0, 4).join(' ')}`);
    await t.ctx.close();
}
// C: 콩나물밥
for (const lang of ['ko', 'ja', 'en']){
    const {ctx, p} = await open('KR', lang, false);
    for (const d of ['vegi', 'vegan']){
        const r = await p.evaluate(d => { S.settings.avoid = dietBundleToggle([], d); avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null;
            const x = RECIPES.find(y => y.id === 'kr_kongnamulbap'); const sw = swappedRecipe(x) || x;
            return {avoided: isAvoided(x), txt: [seasFor(x), ...(sw.items || []).map(i => i.label), ...sw.steps.map(s => typeof s === 'string' ? s : s.t)].join(' / ')}; }, d);
        ok(!r.avoided, `C1 ${lang} ${d}: 料理は残る`);
        ok(!/for the meat|meat|고기|肉|돼지|소고기|豚|牛/i.test(r.txt), `C1 ${lang} ${d}: 肉の語が残る: ${r.txt.slice(0, 120)}`);
    }
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(fails ? `NG ${fails}` : 'OK bfast-r29');
process.exit(fails ? 1 : 0);
