#!/usr/bin/env node
// 第26回 R110・R111（安全）: 粉・顆粒・固形のスープの素と、調味料の欄の stock（Playwright。使い方: node tools/tests/alg-r110.mjs [http://localhost:8765/]）
//  C1 R110 stock powder・broth granules・各国の元の言葉の言い方（kaldu bubuk・Brühpulver・高湯粉・雞粉・다시다・hạt nêm・ซุปก้อน・caldo em pó・dado da brodo・bulion w kostce・et suyu tablet など）は
//     bouillon・stock cube と同じく 小麦・大豆・乳・グルテン の 🔍（⚠ にはしない）。似た言葉（chili powder・角切りの cubes・液体の caldo/Brühe/육수・牛肉粉・鸡蛋 など）には付けない
//  C2 R111 イギリス・ポーランド（材料のキーを stock にしている国）の調味料の欄の stock も 🔍。ほかの国の液体の stock・broth は今までどおり印なし
//  C3 名指しの料理が、画面の言葉（日本語と17言語。LANGS で しぼれる）のどれでも同じ印（⚠ にならない）
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

// ---- C1 言葉ごと（調味料の欄の1行として判定。期待: m = 🔍 / '' = なし）----
{
    const POS = ['1/2 tsp chicken stock powder', '1 tsp vegetable stock powder', '1 tsp bonito-flavoured stock powder (or kelp stock)', '2 tsp chicken bouillon powder', '1 tsp beef stock granules',
        '1 broth cube', 'Chicken powder', '1 Knorr cube', '1 OXO cube', '1 tsp dashi powder', '1 tsp hondashi',
        '1 sdt kaldu ayam bubuk', 'kaldu bubuk', 'penyedap rasa', '1 TL Gemüsebrühpulver', '1 Brühwürfel', 'Gemüsebrühe (instant)', '1 Suppenwürfel', 'gekörnte Brühe',
        '1小匙高湯粉', '雞粉', '鸡精 1小勺', '烹大師', '鰹魚風味粉', '쇠고기 다시다', '치킨스톡', '코인육수 1알', '1 muỗng hạt nêm', 'bột nêm', 'ซุปก้อน 1 ก้อน', 'ผงปรุงรส',
        '1 kostka rosołowa', 'bulion w proszku', '1 cubito de caldo de pollo', 'caldo de pollo en polvo', 'consomé de pollo', '1 tablete de caldo de galinha', 'caldo de legumes em pó',
        '1 dado da brodo', 'brodo granulare', '1 tavuk suyu tablet', '1 bulyon', 'مكعب مرق', 'ماجي', 'स्टॉक क्यूब', '中華スープの素', 'チキンストック'];
    const NEG = ['2 tsp chili powder', '1 tsp baking powder', 'Chicken breast, in 3 cm cubes', 'Beef stew cubes', 'ice cubes', 'Stockfish', 'stockpot',
        '1 l Gemüsebrühe', 'Hühnerbrühe', 'kaldu ayam', '牛肉粉', '鸡粉丝', '雞蛋', '육수 1L', 'caldo de pollo', 'caldo de galinha', 'cortado en dados', 'brodo di carne', 'et suyu', 'bulion',
        '800 ml chicken broth', 'Chicken broth', 'water or stock', '400 ml vegetable stock'];   // 最後の2つ: パックではない（日本のレシピ・自分のレシピ）の調味料。キー stock を使わないので今までどおり
    const r = await p.evaluate(([POS, NEG]) => {
        const kind = (a, s) => { const l = s.toLowerCase(); const i = {name: s, label: s, key: l, en: l, qty: '', opt: false}; return algKind(a, i); };
        const g = k => k === 1 || k === 2 ? 'h' : k === 4 ? 'm' : k === 3 ? 'f' : '';
        return {pos: POS.map(s => [s, ['wheat', 'soy', 'milk', 'gluten'].map(a => g(kind(a, s)))]), neg: NEG.map(s => [s, ['wheat', 'soy', 'milk', 'gluten'].map(a => g(kind(a, s)))])};
    }, [POS, NEG]);
    // 牛乳の入らないだし（dashi powder・hondashi・中華スープの素以外のだしの素）は、日本の「だしの素」と同じく小麦・大豆だけ
    const DASHI = /dashi/;
    r.pos.forEach(([s, v]) => { const exp = DASHI.test(s) ? ['m', 'm', '', 'm'] : ['m', 'm', 'm', 'm']; ok(v.join() === exp.join(), `C1 「${s}」 小麦/大豆/乳/グルテン: ${exp.join('/')} のはずが ${v.map(x => x || '-').join('/')}`); });
    r.neg.forEach(([s, v]) => ok(v.every(x => x === ''), `C1 「${s}」 には印を付けない: ${v.map(x => x || '-').join('/')}`));
    // オーナー決定 Q16=A: カレー粉（市販のミックスに小麦粉が入ることがある）は 小麦・グルテン だけ 🔍（大豆・乳は付けない）。詳しくは tools/tests/curry-r1.mjs
    const cp = await p.evaluate(() => ['1 tsp curry powder', 'カレー粉 小さじ1'].map(s => { const l = s.toLowerCase(); const i = /[ぁ-んァ-ヶ一-龯]/.test(s) ? parseIng(s) : {name: s, label: s, key: l, en: l, qty: '', opt: false}; return [s, ['wheat', 'soy', 'milk', 'gluten'].map(a => algKind(a, i))]; }));
    cp.forEach(([s, v]) => ok(v.join() === '4,0,0,4', `C1 「${s}」 は小麦・グルテンだけ 🔍: 4,0,0,4 のはずが ${v.join()}`));
}

// ---- C2・C3 名指しの料理 × 画面の言葉（'m' = 🔍・'h' = ⚠・'' = なし）----
const NAMED = [
    // R110
    ['ID', 'id_telurdadar', 'wheat', 'm'], ['ID', 'id_telurdadar', 'soy', 'm'], ['ID', 'id_telurdadar', 'milk', 'm'], ['ID', 'id_nasiliwet', 'wheat', 'm'], ['ID', 'id_nasiliwet', 'gluten', 'm'],
    ['ID', 'id_ayamgeprek', 'soy', 'm'], ['ID', 'id_ayamgeprek', 'wheat', 'h'], ['ID', 'id_bakwan', 'milk', 'm'],
    ['TW', 'tw_weicheng_tang', 'wheat', 'm'], ['TW', 'tw_weicheng_tang', 'milk', 'm'], ['DE', 'de_weissebohnen', 'wheat', 'm'],
    ['MX', 'mx_arroz', 'wheat', 'm'],
    // R111
    ['GB', 'gb_quicksweetcorn', 'wheat', 'm'], ['GB', 'gb_quicksweetcorn', 'soy', 'm'], ['GB', 'gb_quickspinach', 'gluten', 'm'], ['GB', 'gb_cockaleekie', 'milk', 'm'], ['GB', 'gb_quickchickennoodle', 'milk', 'm'],
    ['GB', 'gb_leekpotato', 'wheat', 'm'],
    ['PL', 'pl_golabki', 'wheat', 'm'], ['PL', 'pl_groszkowa', 'soy', 'm'], ['PL', 'pl_szpinakowa', 'wheat', 'm'], ['PL', 'pl_pulpety', 'soy', 'm'], ['PL', 'pl_pulpety', 'wheat', 'h'], ['PL', 'pl_kaszagrzyby', 'soy', 'm'], ['PL', 'pl_potrawka', 'soy', 'm'],
    // 液体の broth・stock（キーを stock にしていない国）は今までどおり
    ['US', 'us_tortillasoup', 'wheat', ''], ['DE', 'de_tomatensuppe', 'wheat', ''], ['DE', 'de_gulaschsuppe', 'soy', ''], ['DE', 'de_kartoffelsalat', 'wheat', ''], ['KR', 'kr_doenjangjjigae', 'milk', '']];
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
        if (!r){ ok(false, `C3 ${cc} 画面の言葉を ${lg} にできない`); continue; }
        xs.forEach(([id, a, want], k) => ok(r[k] === want, `C2/3 ${cc}/${id} ${lg} の画面で ${a}: ${want || 'なし'} のはずが ${r[k] || 'なし'}`));
    }
}
await p.evaluate(async () => { if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); } });
await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
