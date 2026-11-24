#!/usr/bin/env node
// カレー粉の小麦（オーナー決定 Q16=A）の回帰テスト（Playwright。使い方: node tools/tests/curry-r1.mjs [http://localhost:8765/]）
//  カレー粉（市販のミックスに小麦粉が入ることがある）は、アサフェティダ・コンソメなどと同じ「🔍 小麦（袋の表示を確認）」（kind 4）。カレールウは従来どおり小麦あり（kind 1・⚠）
//  C1 表記ゆれ（カレー粉・curry powder・Currypulver・ผงกะหรี่・bubuk kari・咖喱粉 など）→ 小麦（グルテン）は 4。似た言葉（カレールウ〔1〕・curry leaves・curry paste・カレー味）には付けない
//  C2 21か国の全料理: 調味料の欄・材料にカレー粉がある料理は、小麦の判定（🔍 以上）が付く。判定は画面の言語に依らない（日本は ja/en/de、各国は ja と en の画面で同じ）
//  C3 小麦アレルギー（自分／家族）: 日本・アメリカ・イギリス・ドイツ・インドネシアのカレー粉の料理が、除外されず 🔍 の札（お膳）・1週間プランの行・買い物メモの「袋の表示を確認」に出る（既存の 🔍 と同じ扱い）。カレールウの料理は ⚠
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = (process.env.CCS || ALL_CC.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(SEED));
await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]})); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);
const kindOf = (names, algs) => p.evaluate(([names, algs]) => names.map(n => { const i = /[ぁ-んァ-ヶ一-龯]/.test(n) ? parseIng(n) : Object.assign(parseIng(n), {en: n.toLowerCase(), key: n.toLowerCase()}); return algs.map(a => algKind(a, i)); }), [names, algs]);

// ---- C1 表記ゆれ ----
const CURRY = ['カレー粉', 'カレー粉 大さじ1', 'curry powder', 'Curry powder', '2 tsp mild curry powder', 'Madras curry powder', 'Currypulver', '1/2 TL Currypulver', '1 Prise milder Curry', 'poudre de curry', 'curry en polvo', 'polvere di curry', 'curry em pó', 'curry w proszku', 'ผงกะหรี่', 'bột cà ri', 'bubuk kari', '咖喱粉', '咖哩粉', '카레가루', '카레 가루', 'köri baharat', 'مسحوق الكاري', 'करी पाउडर'];
const NOT = ['curry leaves', 'カレールウ', 'curry paste', 'red curry paste', 'カレー味', 'カレー用牛肉', 'chicken curry cut', 'करी पत्ते', 'ผงกะหรี่ไม่', 'turmeric powder', 'garam masala'];
{
    const k = await kindOf(CURRY, ['wheat', 'gluten']);
    const miss = CURRY.filter((x, i) => k[i][0] !== 4 || k[i][1] !== 4);
    console.log(`C1 カレー粉の表記 ${CURRY.length}通り中 小麦・グルテンとも「袋の表示を確認」(4) ${CURRY.length - miss.length}`);
    ok(!miss.length, 'C1a カレー粉の表記ゆれで 小麦/グルテン が 4 でない: ' + miss.join(' / '));
    const n = await kindOf(NOT, ['wheat']);
    const bad = NOT.filter((x, i) => n[i][0] === 4 && x !== 'ผงกะหรี่ไม่');
    ok(!bad.length, 'C1b カレー粉ではない言葉に 4 を付けている: ' + bad.join(' / '));
    const roux = await kindOf(['カレールウ', 'curry roux'], ['wheat']);
    ok(roux.every(x => x[0] === 1), 'C1c カレールウは従来どおり小麦あり(1): ' + JSON.stringify(roux));
    const others = await kindOf(['アサフェティダ', 'コンソメ', '味噌テンジャン', 'doenjang'], ['wheat']);
    ok(others.every(x => x[0] === 4 || x[0] === 2 || x[0] === 3), 'C1d 既存の 🔍（コンソメ等）が変わっていない: ' + JSON.stringify(others));
}

// ---- C2 全部の国の料理 ----
const CURRY_SRC = 'カレー粉|\\bcurry powders?\\b|currypulver|milder curry|poudre de curry|curry en polvo|polvere di curry|curry em pó|curry w proszku|ผงกะหรี่|bột cà ri|bubuk kari|咖喱粉|咖哩粉|카레 ?가루|köri baharat|مسحوق الكاري|करी पाउडर';
const found = {};   // cc -> [id]
let nDish = 0, nMiss = 0;
for (const cc of CCS){
    const langs = cc === 'JP' ? ['ja', 'en', 'de'] : ['ja', 'en'];
    const sets = [];
    for (const lg of langs){
        const r = await p.evaluate(async ([cc, lg, src]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            if (LANG !== lg){ const n = ++uiLangSeq; await switchLang(lg, n); }
            const re = new RegExp(src, 'i'), out = {ids: [], miss: [], conflict: []};
            RECIPES.forEach(r => {
                const txt = [r.seasBase != null ? r.seasBase : r.seas, ...(r.items || []).map(i => [i.key, i.en, i.jp].join(' '))].join(' | ');
                if (!re.test(txt)) return;
                out.ids.push(r.id);
                const w = (algRecipeMap(r).wheat || []);
                if (!w.length) out.miss.push(r.id);
            });
            return out;
        }, [cc, lg, CURRY_SRC]);
        sets.push(JSON.stringify(r.ids)); nDish += r.ids.length; nMiss += r.miss.length;
        if (lg === 'ja') found[cc] = r.ids;
        ok(!r.miss.length, `C2 ${cc}/${lg} カレー粉の料理 ${r.ids.length}品のうち、小麦の判定がない: ${r.miss.join(',')}`);
    }
    ok(new Set(sets).size === 1, `C2 ${cc} 画面の言葉で、カレー粉の料理の顔ぶれが変わる: ${sets.join(' / ').slice(0, 200)}`);
}
await p.evaluate(async () => { if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); } });
const total = Object.values(found).reduce((a, x) => a + x.length, 0);
console.log(`C2 カレー粉の料理（国 × 画面の言葉ののべ） ${nDish}品・小麦の判定なし ${nMiss}・国ごと: ` + Object.entries(found).filter(([, x]) => x.length).map(([c, x]) => c + ':' + x.length).join(' '));
ok(!CCS.includes('JP') || (found.JP || []).includes('tandoori'), 'C2 日本のタンドリーチキンがカレー粉の料理に入っている');
ok(total >= (CCS.length === ALL_CC.length ? 15 : 1), 'C2 カレー粉の料理が見つかる（' + total + '）');

// ---- C3 小麦アレルギーの人・家族の画面 ----
const PICK = {JP: 'tandoori', GB: 'gb_cauli_potato_curry', DE: 'de_kuerbis_linsen_curry', ID: 'id_kariayam', US: 'us_sweetpotato_stew'};
let c3 = {tray: 0, week: 0, shop: 0, avoided: 0, roux: 0, n: 0};
for (const [cc, id] of Object.entries(PICK)){
    if (!CCS.includes(cc)) continue;
    for (const sc of ['user', 'family']){
        c3.n++;
        const r = await p.evaluate(async ([cc, id, sc]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); }
            S.settings.allergens = sc === 'user' ? ['wheat'] : [];
            S.family = [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}, ...(sc === 'family' ? [{id: 'f1', name: '子', role: 'child', avoid: ['@wheat'], allergy: ['@wheat']}] : [])];
            setEaters(null); S.history = []; save();
            const r = recipeById(id); if (!r) return {err: 'no recipe ' + id};
            const o = {id, name: r.name, avoided: isAvoided(r), conflict: allergyConflict(r)};
            setTab('today'); session.menu = null; render(); setMenuMain(r); render();
            o.tray = [...document.querySelectorAll('.tray .spot')].filter(s => s.querySelector(`[data-id="${id}"]`) || s.textContent.includes(r.name)).map(s => [...s.querySelectorAll('.alg-tag')].map(x => (x.classList.contains('may') ? 'may:' : '') + x.textContent).join(' ')).join(' ');
            makeWeek(); S.week.days[0].id = id; save(); render();
            o.week = [...document.querySelectorAll('.list.week .item')].filter(x => x.textContent.includes(r.name)).map(x => [...x.querySelectorAll('.badge')].map(y => y.textContent).join(' ')).join(' ');
            o.shop = shopMayList().join(' / ');
            S.settings.allergens = []; S.family = [S.family[0]]; S.history = []; save();
            return o;
        }, [cc, id, sc]);
        const tag = `${cc}/${sc}/${id}`;
        if (r.err){ ok(false, 'C3 ' + r.err); continue; }
        const av = !r.avoided && !r.conflict, tr = /may:🔍 [^ ]*小麦/.test(r.tray) || /may:🔍.*(?:Wheat|小麦)/.test(r.tray), wk = /🔍.*小麦/.test(r.week), sh = /小麦/.test(r.shop) && /カレー粉|curry|Curry|ผงกะหรี่|kari|Prise|milder/i.test(r.shop);
        if (av) c3.avoided++; if (tr) c3.tray++; if (wk) c3.week++; if (sh) c3.shop++;
        ok(av, `C3 ${tag} 除外されている／⚠ になっている（🔍 のはず）: avoided=${r.avoided} conflict=${r.conflict}`);
        ok(tr, `C3 ${tag} お膳の札 🔍 小麦: ${r.tray}`);
        ok(wk, `C3 ${tag} 1週間プランの行に 🔍 小麦: ${r.week}`);
        ok(sh, `C3 ${tag} 買い物メモの「袋の表示を確認」にカレー粉（小麦）: ${r.shop}`);
    }
}
// タイのカレー粉の料理（オイスターソース・醤油もあるので小麦は ⚠。カレー粉は 🔍 の項目として入っている）
if (CCS.includes('TH')){
    const r = await p.evaluate(async () => { if (currentCountry() !== 'TH') await setCountry('TH'); return (algRecipeMap(recipeById('th_kungphongkari')).wheat || []).map(x => x.kind + ':' + x.name); });
    ok(r.some(x => /^4:ผงกะหรี่/.test(x)), 'C3 タイのカレー粉は 🔍(4) の項目として入っている: ' + r.join(' / '));
}
// ひとひねり「カレー風味」（足す材料にカレー粉）も 🔍
if (CCS.includes('JP')){
    const r = await p.evaluate(async () => { if (currentCountry() !== 'JP') await setCountry('JP'); const tw = buildTwist('tw~nikujaga~curry~~'); return tw ? (algRecipeMap(tw).wheat || []).map(x => x.kind + ':' + x.name) : null; });
    ok(r && r.some(x => /^4:カレー粉/.test(x)), 'C3 ひとひねり「カレー風味」のカレー粉は 🔍(4): ' + JSON.stringify(r));
}
// カレールウの料理は従来どおり ⚠
if (CCS.includes('JP')){
    const r = await p.evaluate(async () => {
        if (currentCountry() !== 'JP') await setCountry('JP');
        S.settings.allergens = ['wheat']; setEaters(null); save();
        const x = recipeById('curry'), y = recipeById('tandoori'); const o = {roux: allergyConflict(x), roux_avoided: isAvoided(x), tandoori: allergyConflict(y), tandoori_avoided: isAvoided(y)};
        S.settings.allergens = []; save(); return o;
    });
    if (r.roux) c3.roux++;
    ok(r.roux && r.roux_avoided, 'C3 カレールウのカレーは小麦アレルギーで ⚠（従来どおり）: ' + JSON.stringify(r));
    ok(!r.tandoori && !r.tandoori_avoided, 'C3 カレー粉のタンドリーチキンは ⚠ にも除外にもならない（🔍）: ' + JSON.stringify(r));
}
console.log('C3', JSON.stringify(c3));
await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
