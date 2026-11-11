#!/usr/bin/env node
// 第43回（安全）: 食の決まりの見落とし（肉・魚・貝の加工品や、その国特有の名前の食材が、肉・魚・貝のなかまとして判定されていなかった）の回帰テスト
//  使い方: node tools/tests/safe43.mjs [http://localhost:9291/]
//  A1 各国の料理が、ベジタリアン・ヴィーガン・豚肉なし・牛肉なし・魚なし・貝なしで外れる（Leberkäse・Maultaschen・mantı・肉入りトルテッリーニ／カペレッティ・
//     ウインナー（hot dog・Frankfurter・Vienna）・肉のマンドゥ・ナンプラー・パティス・ジェオ（jaew）・オイスターソース・テラシ・バゴオン・かつお節・和風だしの素 など）
//  A2 外れた料理は、置き換え（豚肉→鶏肉など）で「合う料理」にしない。日本の料理のオイスターソースは、これまでどおり醤油に置き換えて出す（貝なし）
//  A3 アレルギー（豚肉・牛肉・魚）でも同じ料理が外れる
//  A4 外れてはいけない料理（野菜の料理・ほかの肉の条件）は外さない
//  B1 🔍「食の決まり（…の袋の表示を確認）」の材料名が、画面の言葉（17言語＋日本語）に訳されて出る（Curry roux・shacha sauce・vegetable stock・stock cube・Worcestershire sauce など）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const VEGI = ['@pork', '@chicken', '@beef', '@fish', '@shellfish'], VEGAN = VEGI.concat(['@egg', '@dairy']);
const COND = { vegi: VEGI, vegan: VEGAN, pork: ['@pork'], beef: ['@beef'], fish: ['@fish'], shell: ['@shellfish'] };
const ctxOf = async (cc, lang, tag, avoid = []) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('safe43', tag)));
    const st = { onboarded: true, algAsk: 0, firstUse: '2026-11-11', settings: { country: cc, uiLang: lang, dishCount: 3, servings: 2, avoid, allergens: [] } };
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 60000 }).catch(() => {});
    return { p, ctx };
};
// 条件（苦手の組み合わせ・アレルギー）で、料理が外れるか
const judge = (p, cases) => p.evaluate(([cases, COND]) => cases.map(([id, cond, alg]) => {
    const r = byId(id); if (!r) return { id, cond, missing: true };
    const a0 = S.settings.avoid, g0 = S.settings.allergens;
    try {
        S.settings.avoid = alg ? [] : COND[cond]; S.settings.allergens = alg ? [cond] : [];
        return { id, cond, alg: !!alg, name: r.name, avoided: isAvoidedCore(r) };
    } finally { S.settings.avoid = a0; S.settings.allergens = g0; }
}), [cases, COND]);

// ---- A1〜A4 ----
const A = {
    DE: [['de_leberkaese', 'vegi'], ['de_leberkaese', 'vegan'], ['de_leberkaese', 'pork'], ['de_leberkaese', 'beef'],
        ['de_maultaschen', 'vegi'], ['de_maultaschen', 'pork'], ['de_maultaschen', 'beef'], ['de_linsen', 'beef'], ['de_erbsensuppe', 'beef'],
        ['de_leberkaese', 'pork', 1], ['de_leberkaese', 'beef', 1], ['de_maultaschen', 'pork', 1]],
    TR: [['tr_manti', 'vegi'], ['tr_manti', 'beef'], ['tr_manti', 'beef', 1]],
    IT: [['it_tortellinibrodo', 'pork'], ['it_tortellinibrodo', 'beef'], ['it_tortellinibrodo', 'beef', 1]],
    BR: [['br_sopa_capeletti', 'pork'], ['br_sopa_capeletti', 'beef'], ['br_macarrao_salsicha', 'beef']],
    KR: [['kr_budaejjigae', 'beef'], ['kr_manduguk', 'beef'], ['kr_sosijiyachae', 'beef'], ['kr_sosijiyachae', 'shell'], ['kr_baechugeotjeori', 'fish']],
    PH: [['ph_spaghetti', 'beef'], ['ph_sinigang', 'fish'], ['ph_tinola', 'fish'], ['ph_pancit', 'shell'], ['ph_lechon_kawali', 'pork']],
    TH: [['th_padthai', 'fish'], ['th_kaiyang', 'fish'], ['th_nueadaddiao', 'fish'], ['th_nueadaddiao', 'fish', 1], ['th_padpakbung', 'shell'], ['th_kaprao', 'shell']],
    VN: [['vn_pho_ga', 'fish'], ['vn_chagio', 'fish'], ['vn_boluclac', 'shell']],
    CN: [['cn_haoyou_shengcai', 'shell'], ['cn_haoyou_niurou', 'shell']],
    ID: [['id_karedok', 'shell'], ['id_urap', 'shell']],
    TW: [['tw_taxiang_qiezi', 'shell']],
    PE: [['pe_tallarin_saltado', 'shell']],
    JP: [['hiyayakko', 'fish'], ['okraokaka', 'fish'], ['shirasu_tkg', 'fish']],
};
// 外してはいけない（同じ国の、条件に当たらない料理）
const KEEP = {
    DE: [['de_leberkaese', 'fish'], ['de_maultaschen', 'shell']], TR: [['tr_manti', 'pork'], ['tr_manti', 'fish']], TH: [['th_padthai', 'beef']],
    JP: [['hiyayakko', 'pork'], ['hiyayakko', 'shell']], VN: [['vn_pho_ga', 'pork']],
};
if (want('A')){
    for (const cc of Object.keys(A)){
        const { p, ctx } = await ctxOf(cc, 'ja', 'a' + cc);
        const res = await judge(p, A[cc]);
        res.forEach(x => ok(!x.missing && x.avoided, `A1 ${cc} ${x.id}（${x.name || '?'}）${x.alg ? 'アレルギー' : '苦手'}=${x.cond}: 外れる: ` + JSON.stringify(x)));
        if (KEEP[cc]){ const k = await judge(p, KEEP[cc]); k.forEach(x => ok(!x.missing && !x.avoided, `A4 ${cc} ${x.id} ${x.cond}: 外さない: ` + JSON.stringify(x))); }
        if (cc === 'DE'){   // A2 Leberkäse を鶏肉などに置き換えて出さない（豚肉なし）
            const s = await p.evaluate(() => { S.settings.avoid = ['@pork']; const r = byId('de_leberkaese'), w = recipeSwaps(r); return { swaps: w ? w.swaps.length : 0, avoided: isAvoided(r) }; });
            ok(s.avoided && !s.swaps, 'A2 DE Leberkäse は置き換えて「合う料理」にしない: ' + JSON.stringify(s));
        }
        if (cc === 'JP'){   // A2 日本の料理のオイスターソース（貝なし）は、これまでどおり醤油に置き換えて出す
            const s = await p.evaluate(() => {
                S.settings.avoid = ['@shellfish'];
                const r = RECIPES.find(r => !r.pack && seasItems(r).some(i => /おいすたー/.test(i.key)) && !(r.items || []).some(i => inFam('shellfish', i)));
                return r ? { id: r.id, avoided: isAvoidedCore(r), seas: seasFor(r), fam: seasItems(r).filter(i => inFam('shellfish', i)).map(i => i.key) } : null;
            });
            ok(s && !s.avoided && /オイスターソースの代わり/.test(s.seas) && s.fam.length, 'A2 JP オイスターソースは貝のなかま。醤油に置き換えて出す: ' + JSON.stringify(s));
        }
        await ctx.close();
    }
    // 21か国の全食材で、肉・魚・貝の加工品や国特有の名前のもの（下の一覧）が、なかまとして判定される
    const LIST = [
        ['DE', 'leberkaese', ['pork', 'beef']], ['DE', 'maultaschen', ['pork', 'beef']], ['TR', 'manti', ['beef', 'othermeat']], ['IT', 'tortellini', ['pork', 'beef']],
        ['BR', 'capeletti', ['pork', 'beef']], ['FR', 'Merguez', ['beef', 'othermeat']], ['PH', 'hot dog', ['pork', 'beef']], ['KR', 'Frankfurters', ['pork', 'beef']],
        ['KR', 'meat dumplings', ['pork', 'beef']], ['PH', 'liver sauce', ['pork']], ['TH', 'jaew', ['fish']], ['TH', 'fish sauce', ['fish']], ['VN', 'fish sauce', ['fish']],
        ['PH', 'patis', ['fish']], ['TH', 'padaek', ['fish']], ['CN', 'oyster sauce', ['shellfish']], ['ID', 'terasi', ['shellfish']], ['PH', 'bagoong', ['shellfish']],
        ['JP', 'なんぷらー', ['fish']], ['JP', 'かつお節', ['fish']], ['JP', '和風だしの素', ['fish']], ['JP', 'しらす', ['fish']], ['JP', 'おいすたーそーす', ['shellfish']],
    ];
    const byCc = {}; LIST.forEach(x => (byCc[x[0]] = byCc[x[0]] || []).push(x));
    for (const cc of Object.keys(byCc)){
        const { p, ctx } = await ctxOf(cc, 'ja', 'l' + cc);
        const res = await p.evaluate(list => list.map(([cc, w, fams]) => {
            const its = []; RECIPES.forEach(r => (r.items || []).concat(seasItems(r)).forEach(i => { if ((i.key + '|' + (i.en || '')).toLowerCase().includes(w.toLowerCase())) its.push(i); }));
            const bad = its.filter(i => !fams.every(f => inFam(f, i))).map(i => i.key + '|' + (i.en || ''));
            return { w, n: its.length, bad: [...new Set(bad)] };
        }), byCc[cc]);
        res.forEach(x => ok(x.n > 0 && !x.bad.length, `A1 ${cc} 全料理の「${x.w}」が ${byCc[cc].find(y => y[1] === x.w)[2].join('・')} のなかま: ` + JSON.stringify(x)));
        await ctx.close();
    }
}

// ---- B1 🔍 の材料名の訳 ----
// 画面の言葉の文字でない英語（ASCII の語）・日本語（かな）が、🔍 の材料名に残らない
const LANGS = ['ja', 'ar', 'de', 'en', 'es', 'fil', 'fr', 'hi', 'id', 'it', 'ko', 'pl', 'pt-BR', 'th', 'tr', 'vi', 'zh-Hans', 'zh-Hant'];
// [国, 料理, 元の名前（訳される前）]
const BC = [['JP', 'curry', /curry roux|カレールウ/i], ['JP', 'yudofu', /ポン酢|ぽん酢|ponzu/i], ['TW', 'tw_shacha_kongxincai', /shacha/i], ['GB', 'gb_lentil_pie', /vegetable stock/i], ['EG', null, /stock cube/i], ['JP', null, /ウスター|worcestershire/i]];
const EN_SRC = /\b(?:curry roux|shacha sauce|vegetable stock(?: cube| powder)?|stock cube|worcestershire sauce|ranch dressing|kimchi juice|tenkasu|breadcrumbs|lumpia wrappers|hakka noodles|pancake mix)\b/i, JA_SRC = /[ぁ-んァ-ヶ]/;
if (want('B')){
    for (const lang of LANGS){
        const seen = [];
        for (const cc of ['JP', 'TW', 'GB', 'EG', 'DE', 'ES', 'US', 'KR', 'IT', 'PH', 'IN', 'MX', 'FR', 'PL']){
            const { p, ctx } = await ctxOf(cc, lang, 'b' + cc + lang, cc === 'JP' || cc === 'GB' || cc === 'US' || cc === 'IT' || cc === 'PH' || cc === 'IN' || cc === 'FR' ? VEGAN : VEGI);
            const r = await p.evaluate(() => { const o = []; RECIPES.forEach(r => { if (!isAvoidedCore(r)) dietMayHits(r).forEach(n => o.push([r.id, n])); }); return o; });
            r.forEach(([id, n]) => seen.push([cc, id, n]));
            await ctx.close();
        }
        const bad = seen.filter(([cc, id, n]) => (lang !== 'en' && EN_SRC.test(n)) || (lang !== 'ja' && JA_SRC.test(n)) || /\?$/.test(n));
        ok(seen.length > 10 && !bad.length, `B1 ${lang}: 🔍 の材料名が画面の言葉で出る（${seen.length}件）: ` + JSON.stringify([...new Set(bad.map(x => x[0] + ' ' + x[2]))].slice(0, 12)));
        for (const [cc, id, re] of BC){
            const hit = seen.filter(x => x[0] === cc && (!id || x[1] === id));
            ok(hit.length > 0, `B1 ${lang} ${cc} ${id || re}: 🔍 が出る: ` + JSON.stringify(hit.slice(0, 3)));
        }
    }
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe43: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
