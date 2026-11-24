#!/usr/bin/env node
// アサフェティダ（ヒング）の小麦と、「袋の表示によってはアレルゲンが入る」調味料の点検（Playwright。使い方: node tools/tests/hing.mjs [http://localhost:8765/]）
//  H1 アサフェティダの表記ゆれ（hing・heeng・asafetida・asafoetida・हींग・ヒング・アサフェティダ など）→ 小麦「袋の表示を確認」（🔍）。似た言葉（thing・hinge・khing〔しょうが〕・ขิง など）は 0
//  H2 主な8つのアレルゲン × 袋の表示によって入る調味料の表（抜けがないか）。表を出す
//  H3 全部の国の全部の料理: 材料・調味料にアサフェティダがある料理は、小麦の判定（🔍 以上）が付く（インドは en・hi・ja の画面でも）
//  H4 小麦アレルギー（自分／家族）: 今日の献立の札（🔍 小麦）・1週間プランの行の 🔍・1週間の買い物メモの「袋の表示を確認」・家族の「食べたい」の2つの一覧の 🔍・
//     送るリンクの印（c）と ask.html の「🔍 袋の表示を確認」
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

// ---- H1 表記ゆれ ----
const HING = ['asafoetida', 'Pinch of asafoetida (hing)', 'asafetida', 'Asafoetida powder', 'hing', 'Hing', 'heeng', 'hingu', 'हींग', 'हिंग', 'ヒング', 'アサフェティダ', 'アサフェティダ（ヒング）ひとつまみ', '阿魏', '아위', 'มหาหิงคุ์', 'ase fétide', 'Asant', 'asafétida', 'assafetida', 'asafetyda', 'şeytantersi', 'a ngùy', 'حلتيت', 'perungayam', 'kayam'];
const NOT = ['thing', 'hinge', 'shingle', 'khing', 'ขิง', 'ginger', 'Peking duck sauce', 'kayak', 'プディング', 'cumin seeds'];
{
    const k = await kindOf(HING, ['wheat', 'gluten']), n = await kindOf(NOT, ['wheat']);
    const miss = HING.filter((x, i) => !k[i][0] || !k[i][1]);
    console.log(`H1 アサフェティダの表記 ${HING.length}通り中 小麦の判定あり ${HING.length - miss.length}（種類: ${[...new Set(k.map(x => x[0]))].join(',')}）`);
    ok(!miss.length, 'H1a アサフェティダの表記ゆれで小麦（グルテン）の判定がない: ' + miss.join(' / '));
    ok(k.every(x => x[0] === 4 || x[0] === 0), 'H1b 判定は「袋の表示を確認」（4）: ' + k.map(x => x[0]).join(','));
    ok(n.every(x => !x[0]), 'H1c 似た言葉には付けない: ' + NOT.filter((x, i) => n[i][0]).join(' / '));
}

// ---- H2 袋の表示によって入る調味料 × 主な8つのアレルゲン ----
const A8 = ['egg', 'milk', 'wheat', 'soy', 'sesame', 'peanut', 'fish', 'crustacean'];
const TABLE = [   // [調味料（英語・日本語の表記）, 入ることがあるアレルゲン]
    [['asafoetida', 'ヒング'], ['wheat']],
    [['curry roux', 'カレールウ'], ['wheat', 'milk', 'soy']],
    [['consomme', 'コンソメ', 'bouillon', 'stock cube'], ['wheat', 'milk', 'soy']],
    [['oyster sauce', 'オイスターソース'], ['wheat']],
    [['soy sauce', '醤油'], ['wheat', 'soy']],
    [['worcestershire sauce', 'ウスターソース'], ['wheat', 'soy', 'fish']],
    [['hoisin sauce', '海鮮醤'], ['wheat', 'soy', 'sesame']],
    [['tianmianjiang', '甜麺醤'], ['wheat', 'soy']],
    [['gochujang', 'コチュジャン'], ['wheat', 'soy']],
    [['doubanjiang', '豆板醤'], ['wheat', 'soy']],
    [['kecap manis'], ['wheat', 'soy']],
    [['teriyaki sauce', 'めんつゆ', 'ポン酢'], ['wheat', 'soy']],
    [['BBQ sauce', 'barbecue sauce'], ['wheat', 'soy', 'fish']],
    [['miso', '味噌'], ['soy']],
    [['fish sauce', 'ナンプラー'], ['fish']],
    [['shrimp paste'], ['crustacean']],
    [['XO sauce'], ['crustacean', 'fish']],
    [['red curry paste', 'green curry paste', 'massaman curry paste', 'レッドカレーペースト'], ['crustacean']],
    [['nam prik pao', 'chili paste in soybean oil'], ['crustacean', 'fish']],
    [['Caesar dressing'], ['fish', 'egg', 'milk']],
    [['ranch dressing'], ['milk', 'egg']],
    [['mayonnaise', 'マヨネーズ'], ['egg']],
    [['panko', 'パン粉'], ['wheat', 'milk']],
    [['margarine', 'マーガリン'], ['milk', 'soy']],
    [['chocolate', 'チョコレート'], ['milk', 'soy']],
    [['pesto'], ['milk']],
    [['shichimi togarashi', '七味唐辛子'], ['sesame']],
    [['chili crisp'], ['sesame', 'soy', 'peanut']],
    [['ラー油', 'chili oil'], ['sesame']],
    [['satay sauce'], ['peanut']],
    [['tahini'], ['sesame']],
    [['kimchi', 'キムチ'], ['fish', 'crustacean']],
];
{
    const rows = [], miss = [];
    for (const [names, exp] of TABLE){
        const k = await kindOf(names, A8);
        const cell = A8.map((a, j) => { const ks = [...new Set(k.map(x => x[j]))]; const need = exp.includes(a); const bad = need && k.some(x => !x[j]); if (bad) miss.push(names.filter((n, i) => !k[i][j]).join('/') + '→' + a); return (need ? (bad ? '✗' : '○') : '') + ks.join('/'); });
        rows.push('| ' + names.join(' / ') + ' | ' + cell.join(' | ') + ' |');
    }
    console.log('H2 調味料の表（○=入ることがある・判定あり ✗=抜け。数字は判定の種類 1 そのもの 2 加工品 3 発酵 4 袋の表示を確認 0 なし）');
    console.log('| 調味料 | ' + A8.join(' | ') + ' |'); rows.forEach(r => console.log(r));
    console.log(`H2 抜け ${miss.length}`);
    ok(!miss.length, 'H2 袋の表示によって入るアレルゲンの判定がない: ' + miss.join(' ; '));
}

// ---- H3 全部の国の料理 ----
const ASA_RE = 'asaf(?:o|oe|e)tida|asafétida|\\bhing\\b|\\bheeng\\b|हींग|हिंग|ヒング|アサフェティダ|阿魏|아위|มหาหิงคุ์';
let asaDishes = 0, asaMiss = 0, stepOnly = 0, inId = '';
for (const cc of CCS){
    const langs = cc === 'IN' ? ['en', 'hi', 'ja'] : [null];
    for (const lg of langs){
        const r = await p.evaluate(async ([cc, lg, src]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            if (lg && LANG !== lg){ const n = ++uiLangSeq; await switchLang(lg, n); }
            const re = new RegExp(src, 'i'), out = {n: 0, miss: [], stepOnly: [], ids: []};
            RECIPES.forEach(r => {
                const txt = [r.seas, r.seasBase, ...(r.items || []).map(i => [i.name, i.label, i.key, i.en].join(' '))].join(' | ');
                const st = [].concat(r.steps || [], r.stepsBase || []).join(' ');
                if (!re.test(txt)){ if (re.test(st)) out.stepOnly.push(r.id); return; }
                out.n++; out.ids.push(r.id);
                if (!(algRecipeMap(r).wheat || []).length) out.miss.push(r.id);
            });
            return out;
        }, [cc, lg, ASA_RE]);
        asaDishes += r.n; asaMiss += r.miss.length; stepOnly += r.stepOnly.length;
        if (cc === 'IN' && r.ids.length && !inId) inId = r.ids[0];
        ok(!r.miss.length, `H3 ${cc}${lg ? '/' + lg : ''} アサフェティダの料理 ${r.n}品のうち、小麦の判定がない: ${r.miss.join(',')}`);
        ok(!r.stepOnly.length, `H3 ${cc}${lg ? '/' + lg : ''} 手順にだけアサフェティダがある料理（材料・調味料にない）: ${r.stepOnly.join(',')}`);
    }
}
await p.evaluate(async () => { if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); } });
console.log(`H3 アサフェティダの料理（国 × 画面の言葉ののべ） ${asaDishes}品・小麦の判定なし ${asaMiss}・手順にだけ ${stepOnly}`);

// ---- H4 小麦アレルギーの人・家族の画面 ----
let h4 = {tray: 0, week: 0, shop: 0, wish: 0, link: 0, ask: 0, n: 0};
if (inId){
    const pa = await ctx.newPage(); pa.on('pageerror', e => errs.push('ask: ' + e.message));
    await pa.goto(URL_ + 'ask.html#g=x'); await pa.waitForLoadState('load');
    for (const sc of ['user', 'family']){
        h4.n++;
        const r = await p.evaluate(async ([id, sc]) => {
            if (currentCountry() !== 'IN') await setCountry('IN');
            if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); }
            S.settings.allergens = sc === 'user' ? ['wheat'] : [];
            S.family = [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}, ...(sc === 'family' ? [{id: 'f1', name: '子', role: 'child', avoid: ['@wheat'], allergy: ['@wheat']}] : [])];
            setEaters(null); S.history = [{d: addDays(TODAY, -2), id, slot: '主菜'}, {d: addDays(TODAY, -3), id, slot: '主菜'}]; save();
            const r = recipeById(id), o = {id, name: r.name};
            // 今日の献立: 主菜にして、お膳の札
            setTab('today'); session.menu = null; render(); setMenuMain(r); render();
            o.trayAll = [...document.querySelectorAll('.tray .spot')].map(s => s.innerHTML.slice(0, 300)).join(' ## '); o.tray = [...document.querySelectorAll('.tray .spot')].filter(s => (session.menu.items.find(x => x.r && x.r.id === id) || {}).r && s.querySelector(`[data-id="${id}"]`)).map(s => [...s.querySelectorAll('.alg-tag')].map(x => (x.classList.contains('may') ? 'may:' : '') + x.textContent).join(' ')).join(' ');
            // 1週間プラン: 今日の行にその料理
            makeWeek(); S.week.days[0].id = id; save(); render();
            o.week = [...document.querySelectorAll('.list.week .item')].filter(x => x.textContent.includes(r.name)).map(x => [...x.querySelectorAll('.badge')].map(y => y.textContent).join(' ')).join(' ');
            o.shop = shopMayList().join(' / ');
            // 家族の「食べたい」の2つの一覧
            o.wish = [];
            for (const f of [wishSendOpen, askOpen]){ f(); const c = document.querySelector(`#wish-grid .wsh-card[data-id="${id}"]`); o.wish.push(c ? [...c.querySelectorAll('.alg-tag')].map(x => (x.classList.contains('may') ? 'may:' : '') + x.textContent).join(' ') : 'なし'); closeSheet(); }
            const link = askLink([id], 'ママ', 'ja'); o.hash = link ? '#g=' + link.split('#g=')[1] : '';
            o.js = link ? JSON.parse(b64uDec(link.split('#g=')[1])) : null;
            S.settings.allergens = []; S.family = [S.family[0]]; S.history = []; save();
            return o;
        }, [inId, sc]);
        const tag = `${sc}/${r.id}`;
        const tr = /may:🔍 [^ ]*小麦/.test(r.tray), wk = /🔍.*小麦/.test(r.week), sh = /小麦/.test(r.shop) && /アサフェティダ|ヒング|asaf/i.test(r.shop), wi = r.wish.every(x => /may:🔍.*小麦/.test(x)), ln = !!r.js && (r.js.c || []).includes(r.id);
        if (tr) h4.tray++; if (wk) h4.week++; if (sh) h4.shop++; if (wi) h4.wish++; if (ln) h4.link++;
        ok(tr, `H4 ${tag} 今日の献立の札 🔍 小麦: ${r.tray} / ${r.trayAll}`);
        ok(wk, `H4 ${tag} 1週間プランの行に 🔍 小麦: ${r.week}`);
        ok(sh, `H4 ${tag} 1週間の買い物メモの「袋の表示を確認」にアサフェティダ（小麦）: ${r.shop}`);
        ok(wi, `H4 ${tag} 家族の「食べたい」の2つの一覧に 🔍 小麦: ${r.wish.join(' | ')}`);
        ok(ln, `H4 ${tag} 送るリンクに「袋の表示を確認」の印（c）: ${JSON.stringify(r.js && r.js.c)}`);
        if (r.hash){
            await pa.evaluate(h => { location.hash = h; }, r.hash); await pa.waitForTimeout(60);
            const a = await pa.evaluate(id => (document.querySelector(`#grid .dish[data-id="${id}"] .alg`) || {}).textContent || '', r.id);
            if (/^🔍/.test(a)) h4.ask++;
            ok(/^🔍 /.test(a), `H4 ${tag} ask.html に「🔍 袋の表示を確認」: ${a}`);
        }
    }
} else ok(false, 'H4 インドにアサフェティダの料理がない（確かめられない）');
console.log('H4', JSON.stringify(h4));
await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
