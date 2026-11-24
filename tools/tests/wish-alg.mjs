#!/usr/bin/env node
// 第22回 R84（安全）: 家族の「食べたい」の一覧（「何が食べたい？」と聞く ／ 食べたいものを送る）で、家族・自分のアレルゲンに当たる料理に ⚠ が付くか
// 使い方: node tools/tests/wish-alg.mjs [http://localhost:8765/]（CCS=JP,US で国をしぼれる。既定は全部の国）
//  A1 全部の国 × 8アレルゲン × 3通り（自分の「選んだアレルゲン」／家族〔いつも食べる人〕／家族〔ときどき一緒に食べる人〕）× 2つの一覧（家でよく出る料理）:
//     受けとる側が止める料理（wishBlockWhy）と、材料の判定でそのアレルゲンが入る料理に、⚠ の札が付いていない枚数 = 0
//  A2 ⚠ の料理は、当たらない料理のうしろに並ぶ
//  A3 料理名でさがした一覧でも、出た料理に当たるものがあれば ⚠（出なければ 0）
//  A4 「今日の献立の候補から」には当たる料理が入らない
//  A5 送るリンク（ask.html#g=…）に、当たる料理の番号（a）が全部入る
//  A6 ask.html で、当たる料理に「⚠ アレルギーに注意」が出る（当たらない料理には出ない）。当たる料理は うしろ
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = (process.env.CCS || ALL_CC.join(',')).split(',').map(s => s.trim()).filter(Boolean);
// アレルゲンの id と、家族の欄での登録のしかた（なかまの印、または食材の名前）
const ALGS = [['egg', '@egg'], ['milk', '@dairy'], ['wheat', '@wheat'], ['fish', '@fish'], ['crustacean', '@shellfish'], ['soy', '大豆'], ['sesame', 'ごま'], ['peanut', '@nuts']];
const SCOPES = ['user', 'family', 'sometimes'];
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(SEED));
await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]})); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);
// ask.html（家族の端末）: 1枚のページで、#g= を入れかえて読み直す
const pa = await ctx.newPage(); pa.on('pageerror', e => errs.push('ask: ' + e.message));
await pa.goto(URL_ + 'ask.html#g=x'); await pa.waitForLoadState('load');

const tot = {screens: 0, noTag: 0, tiles: 0, hitTiles: 0, hitScreens: 0, order: 0, search: 0, searchNoTag: 0, today: 0, todayHit: 0, linkMiss: 0, askTiles: 0, askNoTag: 0, askFalse: 0, askOrder: 0};
for (const cc of CCS){
    const r = await p.evaluate(async ([cc, ALGS, SCOPES]) => {
        if (currentCountry() !== cc) await setCountry(cc);
        const out = [], ME = {id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []};
        const reset = () => { S.settings.allergens = []; S.settings.avoid = []; S.settings.scarce = []; S.family = [Object.assign({}, ME)]; setEaters(null); S.history = []; S.favs = []; S.wants = []; };
        const mains = RECIPES.filter(r => r.main && !r.isTwist && !isCustomId(r.id) && WISH_ID_RE.test(r.id));
        const hitOf = (r, id) => weekAlg(() => (algRecipeMap(r)[id] || []).some(x => x.kind !== 4 && (x.kind !== 3 || algFerm())));   // 家族みんな（ときどき一緒に食べる人も）で見たときの材料（だしを昆布だしにする などの置き換えのあと）
        const tiles = () => [...document.querySelectorAll('#wish-grid .wsh-card')].map(x => ({id: x.dataset.id, tag: !!x.querySelector('.alg-tag:not(.may)')}));
        for (const [id, fv] of ALGS) for (const sc of SCOPES){
            reset();
            if (sc === 'user') S.settings.allergens = [id];
            else S.family.push({id: 'f1', name: '子', role: 'child', avoid: [fv], allergy: [fv], ...(sc === 'sometimes' ? {sometimes: true} : {})});
            // 家でよく出る料理: 当たる料理（3）を多めに、当たらない料理（3）を少なめに作った記録（当たる料理が一覧の先に来る並び）
            const hits = mains.filter(r => hitOf(r, id)).slice(0, 3), safe = mains.filter(r => !hitOf(r, id) && !wishBlockWhy(r)).slice(0, 3);
            hits.forEach((r, i) => { for (let k = 0; k < 4; k++) S.history.push({d: addDays(TODAY, -1 - i * 4 - k), id: r.id, slot: '主菜'}); });
            safe.forEach((r, i) => S.history.push({d: addDays(TODAY, -20 - i), id: r.id, slot: '主菜'}));
            save(); session.menu = null; setTab('today'); render();
            const conflict = rid => { const x = recipeById(rid); return !!x && (hitOf(x, id) || !!wishBlockWhy(x)); };
            for (const pk of ['wish', 'ask']){
                if (pk === 'wish') wishSendOpen(); else askOpen();
                const ts = tiles(), bad = ts.filter(x => conflict(x.id) && !x.tag), hit = ts.filter(x => conflict(x.id));
                const firstTag = ts.findIndex(x => x.tag), order = firstTag >= 0 && ts.slice(firstTag).some(x => !x.tag);
                const o = {cc, id, sc, pk, n: ts.length, hit: hit.length, noTag: bad.map(x => x.id), order};
                // さがした一覧
                if (hits[0]){ sheet.q = hits[0].name; renderSheet(); const ss = tiles(); o.search = ss.length; o.searchNoTag = ss.filter(x => conflict(x.id) && !x.tag).map(x => x.id); sheet.q = ''; }
                if (pk === 'ask'){
                    const td = askToday(); o.today = td.length; o.todayHit = td.filter(conflict);
                    const sel = [...hit.map(x => x.id), ...ts.filter(x => !conflict(x.id)).map(x => x.id)].slice(0, ASK_MAX);
                    const link = askLink(sel, 'ママ');
                    const js = link ? JSON.parse(b64uDec(link.split('#g=')[1])) : null;
                    const sent = sel.filter(x => askOk(recipeById(x)));
                    o.linkMiss = js ? sent.filter(x => conflict(x) && !(js.a || []).includes(x)) : sent.filter(conflict);
                    o.hash = link ? '#g=' + link.split('#g=')[1] : ''; o.sentHit = sent.filter(conflict);
                }
                closeSheet();
                out.push(o);
            }
        }
        reset(); save();
        return out;
    }, [cc, ALGS, SCOPES]);
    for (const o of r){
        const tag = `${o.cc}/${o.id}/${o.sc}/${o.pk}`;
        tot.screens++; tot.tiles += o.n; tot.hitTiles += o.hit; if (o.hit) tot.hitScreens++; tot.noTag += o.noTag.length; if (o.order) tot.order++;
        ok(!o.noTag.length, `A1 ${tag} 当たる料理に ⚠ がない: ${o.noTag.join(',')}`);
        ok(!o.order, `A2 ${tag} ⚠ の料理は当たらない料理のうしろ`);
        if (o.search != null){ tot.search++; tot.searchNoTag += o.searchNoTag.length; ok(!o.searchNoTag.length, `A3 ${tag} さがした一覧で ⚠ がない: ${o.searchNoTag.join(',')}`); }
        if (o.pk === 'ask'){
            tot.today += o.today; tot.todayHit += o.todayHit.length; tot.linkMiss += o.linkMiss.length;
            ok(!o.todayHit.length, `A4 ${tag} 今日の献立の候補からに当たる料理: ${o.todayHit.join(',')}`);
            ok(!o.linkMiss.length, `A5 ${tag} リンクに当たる料理の印がない: ${o.linkMiss.join(',')}`);
            if (o.hash){
                await pa.evaluate(h => { location.hash = h; }, o.hash); await pa.waitForTimeout(30);
                const a = await pa.evaluate(() => [...document.querySelectorAll('#grid .dish')].map(x => ({id: x.dataset.id, alg: !!x.querySelector('.alg:not(.chk)') && /⚠/.test(x.querySelector('.alg:not(.chk)').textContent)})));
                const miss = a.filter(x => o.sentHit.includes(x.id) && !x.alg), fal = a.filter(x => x.alg && !o.sentHit.includes(x.id));
                const ft = a.findIndex(x => x.alg), ord = ft >= 0 && a.slice(ft).some(x => !x.alg);
                tot.askTiles += a.length; tot.askNoTag += miss.length; tot.askFalse += fal.length; if (ord) tot.askOrder++;
                ok(!miss.length && !fal.length, `A6 ${tag} ask.html の ⚠「アレルギーに注意」: なし ${miss.map(x => x.id).join(',')} / 余分 ${fal.map(x => x.id).join(',')}`);
                ok(!ord, `A6 ${tag} ask.html でも ⚠ の料理はうしろ`);
            }
        }
    }
}
await b.close();
console.log('R84', JSON.stringify(tot));
ok(tot.hitScreens > 0 && tot.hitTiles > 0, 'A0 当たる料理の出る一覧を確かめた: ' + tot.hitScreens + '画面・' + tot.hitTiles + '枚');
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
