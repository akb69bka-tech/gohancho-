#!/usr/bin/env node
// 第25回 R105・R106・R108（安全）: 英語の名前だけで分かるチーズ・卵のパスタ・stock の読み落とし（Playwright。使い方: node tools/tests/alg-r105.mjs [http://localhost:8765/]）
//  C1 R105 チーズの名前（Monterey Jack・pepper jack・colby・provolone・gruyère・emmental・manchego など）が乳。似た言葉（jackfruit・butternut・coconut milk など）には付けない
//  C2 R106 fettuccine・pappardelle はタリアテッレと同じ扱い（卵の「よく含まれる加工品」）。linguine・spaghetti には付けない
//  C3 R108 材料の「stock」（キーが stock で元の名前も stock。イギリスの家庭はキューブで作ることが多い）・creamed corn は 🔍（袋の表示を確認）だけ。⚠ にはしない。アメリカの broth は印なしのまま
//  C4 名指しの料理が、画面の言葉（日本語と17言語。LANGS で しぼれる）のどれでも同じ印
//     us_tortillasoup 乳⚠・us_alfredo 卵⚠・gb_leekpotato 小麦/大豆/グルテン🔍・gb_mulligatawny 乳🔍・cn_yumi_geng 乳🔍・us_tortillasoup 小麦なし
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ALL_LANGS = ['ja', 'en', 'fr', 'de', 'it', 'es', 'pt-BR', 'pl', 'tr', 'ar', 'hi', 'id', 'fil', 'th', 'zh-Hans', 'zh-Hant', 'ko', 'vi'];
const LANGS = (process.env.LANGS || ALL_LANGS.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(SEED));
await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', dishCount: 3, servings: 2}})); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);

// ---- C1〜C3 言葉ごと（[キー, 元の名前, アレルゲン, 期待する種類（1・2 = ⚠ / 4 = 🔍 / 0 = なし）]）----
{
    const K = [
        // C1 チーズ
        ['monterey jack', 'Shredded Monterey Jack (optional)', 'milk', 1], ['cheese', 'Pepper jack', 'milk', 1], ['colby', 'Colby', 'milk', 1], ['provolone', 'Provolone slices', 'milk', 1],
        ['gruyere', 'Gruyère', 'milk', 1], ['emmental', 'Emmentaler', 'milk', 1], ['manchego', 'Manchego', 'milk', 1], ['cotija', 'Crumbled cotija', 'milk', 1], ['fontina', 'Fontina', 'milk', 1],
        ['parmigiano', 'Parmigiano Reggiano', 'milk', 1], ['gorgonzola', 'Gorgonzola', 'milk', 1], ['comte', 'Comté', 'milk', 1], ['stilton', 'Stilton', 'milk', 1], ['catupiry', 'Catupiry', 'milk', 1],
        ['cheddar', 'Sharp cheddar', 'milk', 1], ['red leicester', 'Red Leicester', 'milk', 1], ['edam', 'Edam', 'milk', 1], ['burrata', 'Burrata', 'milk', 1],
        ['jackfruit', 'Young jackfruit', 'milk', 0], ['butternut squash', 'Butternut squash', 'milk', 0], ['coconut milk', 'Coconut milk', 'milk', 0], ['edamame', 'Edamame', 'milk', 0],
        // C2 卵のパスタ（タリアテッレと同じ）
        ['pasta', 'Fettuccine', 'egg', 2], ['pasta', 'Fettucine', 'egg', 2], ['pasta', 'Pappardelle', 'egg', 2], ['pasta', 'Tagliatelle', 'egg', 2],
        ['pasta', 'Linguine', 'egg', 0], ['pasta', 'Spaghetti', 'egg', 0], ['pasta', 'Penne', 'egg', 0],
        // C3 stock・creamed corn は 🔍 だけ
        ['stock', 'Vegetable stock', 'wheat', 4], ['stock', 'Beef stock', 'soy', 4], ['stock', 'Vegetable or chicken stock', 'milk', 4], ['stock', 'Chicken stock', 'gluten', 4], ['stock', 'Stock', 'wheat', 4],
        ['corn', 'Sweet corn kernels (or creamed corn)', 'milk', 4], ['corn', 'Cream-style corn', 'milk', 1],
        ['stock', 'Chicken broth', 'wheat', 0], ['stock', 'Chicken broth', 'milk', 0], ['corn', 'Sweet corn kernels', 'milk', 0], ['stockfish', 'Stockfish', 'wheat', 0]];
    const r = await p.evaluate(K => K.map(([key, en, a, want]) => { const i = Object.assign(parseIng(en), {key, en: en.toLowerCase(), trn: true}); const k = algKind(a, i);
        const got = k === 1 || k === 2 ? 'h' : k === 4 ? 'm' : k === 3 ? 'f' : '', exp = want === 1 || want === 2 ? 'h' : want === 4 ? 'm' : '';
        return [key + '|' + en, a, exp, got]; }), K);
    r.forEach(([n, a, exp, got]) => ok(exp === got, `C1-3 ${n} → ${a}: ${exp || 'なし'} のはずが ${got || 'なし'}`));
}

// ---- C4 名指しの料理 × 画面の言葉 ----
const NAMED = [['US', 'us_tortillasoup', 'milk', 'h'], ['US', 'us_alfredo', 'egg', 'h'], ['US', 'us_tortillasoup', 'wheat', ''],
    ['GB', 'gb_leekpotato', 'wheat', 'm'], ['GB', 'gb_leekpotato', 'soy', 'm'], ['GB', 'gb_leekpotato', 'gluten', 'm'], ['GB', 'gb_mulligatawny', 'milk', 'm'], ['GB', 'gb_caulicheese', 'wheat', 'm'],
    ['CN', 'cn_yumi_geng', 'milk', 'm']];
for (const cc of [...new Set(NAMED.map(x => x[0]))]){
    const xs = NAMED.filter(x => x[0] === cc).map(x => x.slice(1));
    for (const lg of LANGS){
        const r = await p.evaluate(async ([cc, lg, xs]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            if (LANG !== lg){ const n = ++uiLangSeq; await switchLang(lg, n); }
            if (LANG !== lg) return null;
            const S0 = JSON.stringify(S.settings.allergens || []);
            const out = xs.map(([id, a]) => { S.settings.allergens = [a]; const rc = recipeById(id); return rc ? (allergyConflict(rc) ? 'h' : algMayHits(rc).length ? 'm' : '') : 'NO-RECIPE'; });
            S.settings.allergens = JSON.parse(S0); return out;
        }, [cc, lg, xs]);
        if (!r){ ok(false, `C4 ${cc} 画面の言葉を ${lg} にできない`); continue; }
        xs.forEach(([id, a, want], k) => ok(r[k] === want, `C4 ${cc}/${id} ${lg} の画面で ${a}: ${want || 'なし'} のはずが ${r[k] || 'なし'}`));
    }
}
await p.evaluate(async () => { if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); } });
await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
