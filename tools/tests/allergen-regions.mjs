#!/usr/bin/env node
// 国ごとのアレルゲン区分（オーナーの決定12番「国ごとの区分は、その国の決まりに合わせる」）の回帰テスト（Playwright。使い方: node tools/tests/allergen-regions.mjs [http://localhost:8765/]）
//  1) 全21か国: 設定の「アレルギー対策」カードの見出しの品目が、その国の表示制度の品目（docs/allergen_regions.md の表）と同じ並びで出る
//     公的資料で確かめられなかった国・品目は「主なアレルゲン（各国の表示制度の品目とは限りません）」の見出しで、前の並びを引っこめずに出す
//  2) 全21か国: 義務の品目のチップを押すと選べて（設定に入る）、その品目を使う料理が献立・その国の料理から外れる（明らかな言葉のある料理は1品も出ない）
//  3) その国の言葉で画面を出しているとき、選択肢の名前は法令の呼び方（韓国語の 알류(가금류만 해당) など）
//  4) 移し替え: 前の区分（EU の14品目など）で保存したアレルゲンは、国の区分が変わっても消えず、外れず、効き続ける
//  CCS=KR,TW で国を絞れる。乱数: ページの Math.random は SEED から決まる
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const { SEED, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';

// その国の表示制度の品目（アプリの表とは別に、docs/allergen_regions.md から書き写す）。
// m = 表示が義務、r = 表示をすすめる、u = 確かめられなかった（前の並びの残り。各国の表示制度の品目とは限らない）、lang = その国の言葉
const EU14 = ['gluten','crustacean','egg','fish','peanut','soy','milk','treenut','celery','mustard','sesame','sulphite','lupin','mollusc'];
const US9 = ['milk','egg','fish','crustacean','treenut','peanut','wheat','soy','sesame'];
const EXP = {
    JP: { m: ['shrimp','cashew','crab','walnut','wheat','buckwheat','egg','milk','peanut'], r: ['abalone','squid','ikura','orange','kiwi','beef','sesame','salmon','mackerel','soy','chicken','banana','pistachio','pork','macadamia','peach','yamaimo','apple','gelatin','almond'], lang: 'ja' },
    US: { m: US9, lang: 'en', names: { crustacean: 'Crustacean shellfish', soy: 'Soybeans' } },
    GB: { m: EU14, lang: 'en', names: { sulphite: 'Sulphur dioxide and sulphites', gluten: 'Cereals containing gluten' } },
    FR: { m: EU14, lang: 'fr', names: { treenut: 'Fruits à coque' } }, DE: { m: EU14, lang: 'de', names: { mollusc: 'Weichtiere' } }, IT: { m: EU14, lang: 'it', names: { treenut: 'Frutta a guscio' } },
    ES: { m: EU14, lang: 'es', names: { lupin: 'Altramuces' } }, PL: { m: EU14, lang: 'pl', names: { crustacean: 'Skorupiaki' } }, TR: { m: EU14, lang: 'tr', names: { gluten: 'Gluten içeren tahıllar' } },
    IN: { m: ['gluten','crustacean','milk','egg','fish','peanut','treenut','soy','sulphite'], lang: 'en', names: { gluten: 'Cereals containing gluten' } },
    KR: { m: ['egg','milk','buckwheat','peanut','soy','wheat','mackerel','crab','shrimp','pork','peach','tomato','sulphite','walnut','chicken','beef','squid','shellfish','pinenut'], lang: 'ko', names: { egg: '알류(가금류만 해당)', shellfish: '조개류(굴, 전복, 홍합 포함)', pinenut: '잣', tomato: '토마토' } },
    TW: { m: ['crustacean','mango','peanut','milk','egg','treenut','sesame','gluten','soy','fish','sulphite'], r: ['mollusc','seeds','kiwi'], lang: 'zh-Hant', names: { mango: '芒果', gluten: '含麩質之穀物', milk: '牛奶、羊奶' } },
    CN: { r: ['gluten','crustacean','fish','egg','peanut','soy','milk','treenut'], lang: 'zh-Hans', names: { gluten: '含有麸质的谷物及其制品' } },
    MX: { m: ['gluten','crustacean','egg','fish','peanut','soy','milk','treenut','sulphite'], u: ['sesame'], lang: 'es', names: { peanut: 'Cacahuate', soy: 'Soya' } },
    BR: { m: ['gluten','crustacean','egg','fish','peanut','soy','milk','treenut','pinenut'], u: ['sesame'], lang: 'pt-BR', names: { peanut: 'Amendoim', pinenut: 'Pinoli' } },
    ID: { m: ['gluten','egg','fish','crustacean','mollusc','peanut','soy','milk','treenut'], u: ['celery','mustard','sesame','sulphite','lupin'], lang: 'id', names: { peanut: 'Kacang tanah' } },
    TH: { m: ['gluten','crustacean','peanut','soy','mollusc','sulphite'], u: ['egg','fish','milk','treenut','celery','mustard','sesame','lupin'], lang: 'th', names: { crustacean: 'สัตว์น้ำที่มีเปลือกแข็ง' } },
    VN: { u: EU14, lang: 'vi' }, EG: { u: EU14, lang: 'ar' }, PH: { u: US9, lang: 'fil' }, PE: { u: US9, lang: 'es' },
};
// 明らかにその品目の言葉（判定の表とは別に書く）。材料・調味料の欄にこの言葉がある料理は、選んだら必ず出ない
const OBV = {
    shrimp: /えび|海老|\bshrimps?\b|\bprawns?\b|새우|กุ้ง/i, crab: /蟹|\bcrabs?\b|게살|ปู/i, walnut: /くるみ|\bwalnuts?\b|호두/i, wheat: /小麦粉|\bwheat flour\b|\bflour tortillas?\b|\bbread\b|\bspaghetti\b|うどん|밀가루/i,
    buckwheat: /そば粉|\bbuckwheat\b|\bsoba\b|메밀/i, egg: /卵|\beggs?\b|계란|달걀|ไข่/i, milk: /牛乳|バター|チーズ|\bmilk\b|\bbutter\b|\bcheese\b|우유/i, peanut: /ピーナッツ|落花生|\bpeanuts?\b|땅콩/i,
    cashew: /カシュー|\bcashews?\b/i, soy: /豆腐|\btofu\b|\bedamame\b|대두|두부/i, mackerel: /\bmackerel\b|鯖|고등어/i, pork: /豚肉|\bpork\b|\bbacon\b|돼지고기/i, peach: /\bpeach(?:es)?\b|복숭아/i,
    tomato: /トマト|\btomato(?:es)?\b|토마토|มะเขือเทศ/i, sulphite: /\bwhite wine\b|\bred wine\b|\braisins?\b|ワイン/i, chicken: /鶏肉|\bchicken\b|닭고기|ไก่/i, beef: /牛肉|\bbeef\b|쇠고기|소고기/i,
    squid: /\bsquid\b|\bcalamari\b|오징어/i, shellfish: /\bclams?\b|\bmussels?\b|\boysters?\b|\bscallops\b|あさり|조개|홍합/i, pinenut: /\bpine nuts?\b|松の実|잣/i, mango: /\bmangos?\b|\bmangoes\b|マンゴー|芒果/i,
    sesame: /\bsesame (?:seeds?|oil)\b|\btahini\b|ごま油|참기름/i, gluten: /\bwheat flour\b|\bbread\b|\bspaghetti\b|\bbarley\b|\brye\b|小麦粉|うどん/i, crustacean: /えび|\bshrimps?\b|\bprawns?\b|\bcrabs?\b|\blobsters?\b|새우|กุ้ง/i,
    fish: /鮭|\bsalmon\b|\btuna\b|\bcod\b|\bfish sauce\b|\banchov/i, treenut: /\balmonds?\b|\bwalnuts?\b|\bcashews?\b|\bpistachios?\b|\bhazelnuts?\b|\bpine nuts?\b|アーモンド|くるみ/i,
    mollusc: /\bclams?\b|\bmussels?\b|\boysters?\b|\bscallops\b|\boctopus\b|\bsquid\b|あさり/i, seeds: /\bsunflower seeds?\b|\bpumpkin seeds?\b|\bpine nuts?\b|ひまわりの種/i, kiwi: /\bkiwi\b|キウイ/i,
    celery: /\bcelery\b|セロリ/i, mustard: /\bmustard\b(?! (?:greens?|leaves?))|粒マスタード/i, lupin: /\blupin/i,
};
const STRIP = /coconut (?:milk|cream)|soy ?milk|almond milk|oat milk|peanut butter|butternut|cocoa butter|oyster mushroom|oyster crackers|eggplant|water chestnut|rice wine|shaoxing|mustard (?:greens?|leaf|leaves)|ビーフン|ココナッツ|たまねぎ|玉ねぎ|tomatillo/i;
const ALL = Object.keys(EXP);
const CCS = (process.env.CCS || ALL.join(',')).split(',').filter(Boolean);
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let fails = 0, opened = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
async function open(cc, settings = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('alg-region', String(++opened))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(cc + ': ' + m.text()); });
    await p.addInitScript(([cc, settings]) => { window.__swapDirect = true; if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({foldOpen:{upg:true,tw:true,week:true}, onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3, uiLang:'ja', ...settings}})); } }, [cc, settings]);
    await p.goto(URL_); await p.waitForFunction(() => typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof algSections === 'function', null, { timeout: 30000 }); await p.waitForTimeout(400);
    return { ctx, p };
}
const card = p => p.evaluate(() => {
    setTab('settings'); render();
    const c = document.querySelector('#allergy-card'); if (!c) return null;
    return { groups: [...c.querySelectorAll('.avoid-grp')].map(g => ({ title: g.querySelector('.small').innerText, ids: [...g.querySelectorAll('.chip[data-act="alg-toggle"]')].map(x => x.dataset.v) })),
        all: [...c.querySelectorAll('.chip[data-act="alg-toggle"]')].map(x => x.dataset.v), names: Object.fromEntries([...c.querySelectorAll('.chip[data-act="alg-toggle"]')].map(x => [x.dataset.v, x.innerText.replace(/^⚠\s*/, '')])) };
});

for (const cc of CCS){
    const e = EXP[cc];
    // ---------- 1) 見出しの品目 ----------
    {
        const { ctx, p } = await open(cc);
        const c = await card(p);
        ok(!!c, cc + ' 設定に「アレルギー対策」カード');
        if (c){
            const want = [e.m, e.r, e.u].filter(Boolean);
            ok(JSON.stringify(c.groups.map(g => g.ids)) === JSON.stringify(want), cc + ' 見出しの品目: ' + JSON.stringify(c.groups.map(g => g.ids)) + ' / 期待 ' + JSON.stringify(want));
            const gen = await p.evaluate(() => t('主なアレルゲン（各国の表示制度の品目とは限りません）'));
            if (e.u) ok(c.groups[c.groups.length - 1].title === gen, cc + ' 確かめられなかった品目の見出し: ' + c.groups[c.groups.length - 1].title);
            else ok(!c.groups.some(g => g.title === gen), cc + ' 確かめた国に「各国の表示制度の品目とは限りません」を出さない');
            if (e.m && cc !== 'JP') ok(/義務|EU|米国/.test(c.groups[0].title), cc + ' 義務の見出し: ' + c.groups[0].title);
            if (cc === 'CN') ok(/2027-03-16/.test(c.groups[0].title), 'CN 推奨（2027-03-16 から義務）の見出し: ' + c.groups[0].title);
            const ALLIDS = await p.evaluate(() => ALG_ALL.slice());
            ok(c.all.length === ALLIDS.length, cc + ' ほかのアレルゲンも全部選べる: ' + c.all.length + '/' + ALLIDS.length);
        }
        // ---------- 2) 義務（なければ推奨・確かめられなかった並び）の品目を押して選べる・その品目の料理が外れる ----------
        const ids = e.m || e.r || e.u;
        const res = [];
        for (const id of ids){
            await p.evaluate(() => { S.settings.allergens = []; save(); setTab('settings'); render(); });
            const inFold = await p.evaluate(id => { const x = document.querySelector(`#allergy-card .chip[data-v="${id}"]`); return !x ? null : !!(x.closest('details') && !x.closest('details').open); }, id);
            ok(inFold === false, cc + ' ' + id + ' のチップが見出しの中にある（畳まれていない）');
            if (inFold === null) continue;
            await p.click(`#allergy-card .chip[data-v="${id}"]`); await p.waitForTimeout(60);
            const r = await p.evaluate(([id, obv, strip]) => {
                const O = new RegExp(obv[0], obv[1]), ST = new RegExp(strip[0], strip[1]);
                const sel = (S.settings.allergens || []).slice(), pressed = document.querySelector(`#allergy-card .chip[data-v="${id}"]`).getAttribute('aria-pressed') === 'true';
                const txt = i => [i.key, i.en, i.name, i.label].join(' | ');
                const obvious = RECIPES.filter(r => (r.items || []).concat(seasItems(r)).some(i => !ST.test(txt(i)) && O.test(txt(i))));
                const leaked = obvious.filter(r => !isAvoidedCore(r)).map(r => r.id + ' ' + r.name.slice(0, 24));
                const hit = RECIPES.filter(r => algSelectedHits(r, [id]).length);
                const hitShown = hit.filter(r => !isAvoidedCore(r)).length;
                let menuBad = 0; for (let k = 0; k < 4; k++){ session.menu = null; ensureMenu(); if (session.menu.items.some(x => x.r && allergyConflict(x.r))) menuBad++; }
                return { sel, pressed, obvious: obvious.length, leaked, hit: hit.length, hitShown, menuBad };
            }, [id, OBV[id] ? [OBV[id].source, OBV[id].flags] : ['(?!)', ''], [STRIP.source, STRIP.flags]]);
            ok(r.sel.length === 1 && r.sel[0] === id && r.pressed, cc + ' ' + id + ' を押すと選べる: ' + JSON.stringify(r.sel));
            ok(!r.leaked.length, cc + ' ' + id + ' の料理が残る: ' + r.leaked.slice(0, 3).join(', '));
            ok(r.hitShown === 0, cc + ' ' + id + ' に当たる料理が出る: ' + r.hitShown);
            ok(r.menuBad === 0, cc + ' ' + id + ' 献立に当たる料理: ' + r.menuBad);
            res.push(id + ':' + r.hit);
        }
        console.log(cc, '外れる品数', res.join(' '));
        await p.evaluate(() => { S.settings.allergens = []; save(); });
        await ctx.close();
    }
    // ---------- 3) その国の言葉では、法令の呼び方 ----------
    if (e.names){
        const { ctx, p } = await open(cc, { uiLang: e.lang });
        await p.waitForFunction(l => LANG === l, e.lang, { timeout: 15000 }).catch(() => {});
        const c = await card(p), lang = await p.evaluate(() => LANG);
        ok(lang === e.lang, cc + ' 言語 ' + lang);
        for (const [id, nm] of Object.entries(e.names)) ok(c && c.names[id] === nm, cc + '/' + e.lang + ' ' + id + ' の名前: ' + (c && c.names[id]) + ' / 期待 ' + nm);
        // ほかの国の言葉（日本語）では、ふだんの名前
        await ctx.close();
    }
}
// 日本語の画面では、韓国でも日本語の名前（法令の韓国語は、韓国語の画面だけ）
{
    const { ctx, p } = await open('KR', { uiLang: 'ja' });
    const c = await card(p);
    ok(c && c.names.egg === '卵' && c.names.shellfish === '貝類（かき・あわび・ムール貝など）', 'KR/ja はふだんの名前: ' + (c && c.names.egg + ' / ' + c.names.shellfish));
    await ctx.close();
}
// ---------- 4) 移し替え: 前の区分で保存したアレルゲンが消えない・外れない ----------
if (CCS.includes('KR') || CCS.includes('VN')){
    for (const [cc, saved] of [['KR', ['gluten', 'celery', 'lupin', 'mollusc', 'mustard']], ['TW', ['lupin', 'celery', 'mollusc']], ['IN', ['celery', 'mustard', 'sesame']], ['VN', ['gluten', 'celery']]]){
        const { ctx, p } = await open(cc, { allergens: saved });
        const c = await card(p);
        const r = await p.evaluate(saved => {
            const keep = (S.settings.allergens || []).slice();
            const pressed = saved.filter(id => { const x = document.querySelector(`#allergy-card .chip[data-v="${id}"]`); return x && x.getAttribute('aria-pressed') === 'true' && (!x.closest('details') || x.closest('details').open); });
            const celery = RECIPES.filter(r => (r.items || []).some(i => /\bcelery\b|セロリ|셀러리/i.test([i.key, i.en, i.name].join(' '))));
            let menuBad = 0; for (let k = 0; k < 4; k++){ session.menu = null; ensureMenu(); if (session.menu.items.some(x => x.r && allergyConflict(x.r))) menuBad++; }
            return { keep, pressed, celeryN: celery.length, celeryShown: celery.filter(r => !isAvoidedCore(r)).length, menuBad };
        }, saved);
        ok(JSON.stringify(r.keep) === JSON.stringify(saved), cc + ' 保存したアレルゲンが残る: ' + JSON.stringify(r.keep));
        ok(r.pressed.length === saved.length, cc + ' 保存したアレルゲンが押した状態で見える: ' + r.pressed.join());
        ok(r.celeryShown === 0, cc + ' 前の区分のセロリが効き続ける（' + r.celeryShown + '/' + r.celeryN + '）');
        ok(r.menuBad === 0, cc + ' 献立に当たる料理が出ない');
        // 保存しなおしても消えない（国を行き来する）
        const r2 = await p.evaluate(async () => { const a = S.settings.allergens.slice(); save(); return JSON.stringify(JSON.parse(localStorage.getItem('gohancho.v1')).settings.allergens) === JSON.stringify(a); });
        ok(r2, cc + ' 保存しなおしても同じ');
        await ctx.close();
    }
}
await b.close();
errs.filter(x => !/favicon|net::ERR/.test(x)).slice(0, 5).forEach(x => ok(false, 'ページのエラー ' + x));
console.log(fails ? 'NG ' + fails + '  SEED=' + SEED : 'ALL OK  SEED=' + SEED + ' (' + CCS.length + 'か国)');
process.exit(fails ? 1 : 0);
