#!/usr/bin/env node
// 「道具から料理を選ぶ」（逆引き）の回帰テスト（Playwright。使い方: node tools/tests/tool-r1.mjs [http://localhost:9601/]）
//  T1  推定の正しさ: 各道具の代表料理が付く・誤タグがない（日本と、ほかの国の料理）。推定できない料理にタグを付けない
//  T1b 画面の言葉に依存しない（日本語・英語・韓国語・アラビア語で、日本の料理の道具が同じ）
//  T2  ホットプレート・鉄板・炭火が、日本で各5品以上（主菜）。新しい5品の手順・分・アレルゲン
//  T3  アレルギー・食の決まり・お酒避けは道具の絞りより優先（一覧にも、今日使う道具のおまかせにも、外れた料理は出ない）
//  T4  今日使う道具: 道具のチップを押しても献立は動かない・決めた献立は動かない。まるごと入れ替えでその道具の料理が先に出る。少ないときは無理に絞らない
//  T5  道具から探す: 一覧から主菜を入れ替えられる（ほかの料理は動かさない・元に戻せる）。決めた献立は確かめてから
//  T6  17言語で新しい文言が欠けていない
//  T7  幅195〜430で、道具の欄が重ならず44px以上で押せる（横にはみ出さない）
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const KEY = 'gohancho.v1';
async function open(lang, cc = 'JP', w = 390, h = 844, extra = {}){
    const ctx = await b.newContext({viewport: {width: w, height: h}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('tool', cc, lang, w)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lang + ': ' + e.message));
    await p.clock.install({time: new Date('2026-10-29T18:10:00+09:00')});
    await p.addInitScript(([lang, KEY, cc, extra]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem(KEY, JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: cc, uiLang: lang, dishCount: 4, servings: 2, avoidSwap: true}, extra)})); } }, [lang, KEY, cc, extra]);
    await p.goto(URL_); await ready(p); await p.clock.runFor(800);
    return {ctx, p};
}

// ---------- T1 推定 ----------
const REP_JP = {
    hotplate: ['okonomi', 'yakiniku', 'yakisoba', 'gyoza', 'monja', 'teppan_gyu'], teppan: ['okonomi', 'yakisoba', 'monja', 'teppan_tori'],
    charcoal: ['yakitori', 'sanma', 'yakiniku', 'tsukune', 'yaki_tomorokoshi'], fishgrill: ['sabashio', 'sanma', 'shakeshio', 'ajihimono'],
    donabe: ['yosenabe', 'yudofu', 'shabushabu'], pot: ['nikujaga', 'curry', 'misoshiru', 'sabamiso'], pan: ['shogayaki', 'gyoza', 'chahan', 'hamburg'],
    ricecooker: ['takikomi', 'gomokutakikomi'], deepfry: ['karaage', 'tempura', 'tonkatsu'], microwave: ['satsumaimo_banana', 'kabochasalad'],
    toaster: ['toast_yudetamago'], steamer: ['chawanmushi'], cold: ['yogurt_fruit', 'hiyayakko'], oven: ['gratin'],
};
const NOT_JP = {pot: ['chahan', 'butakimu', 'shogayaki', 'hiyayakko'], pan: ['misoshiru', 'curry', 'yudofu', 'hiyayakko'], hotplate: ['sabashio', 'curry', 'nikujaga', 'misoshiru'],
    charcoal: ['okonomi', 'curry', 'misoshiru', 'karaage'], deepfry: ['hamburg', 'shogayaki', 'nikujaga'], oven: ['karaage', 'shogayaki', 'curry'], cold: ['karaage', 'nikujaga']};
const REP_PACK = {   // 各国の料理（原文＝英語の手順）
    KR: {kr_samgyeopsal: ['charcoal', 'hotplate'], kr_kimchijjigae: ['donabe'], kr_bulgogi: ['hotplate']},
    ES: {es_lomoplancha: ['teppan'], es_calamaresplancha: ['teppan'], es_arrozhorno: ['oven']},
    MX: {mx_carne_asada: ['charcoal'], mx_quesadillas: ['teppan']},
    EG: {eg_shishtawook: ['charcoal'], eg_reyash: ['charcoal']},
    IN: {in_alooparatha: ['teppan'], in_tandoori: ['charcoal']},
    TH: {th_mooping: ['charcoal'], th_kaiyang: ['charcoal'], th_khaitun: ['steamer']},
    ID: {id_satekambing: ['charcoal'], id_ayambakar: ['charcoal']},
    TR: {tr_tavuksis: ['charcoal']}, VN: {vn_cahap: ['steamer'], vn_bunthitnuong: ['charcoal']}, CN: {cn_qingzheng_yu: ['steamer'], cn_yuxiang_qiezi: ['pan']},
    US: {us_bbqchickensandwich: [], us_pulledpork: []},
};
const NOT_PACK = {US: {us_bbqchickensandwich: ['charcoal'], us_pulledpork: ['charcoal']}, KR: {kr_kimchijjigae: ['deepfry', 'oven']}, CN: {cn_qingzheng_yu: ['deepfry', 'oven']}};
const jpTags = () => { const o = {}; RECIPES.forEach(r => { o[r.id] = toolsOf(r).join(); }); return o; };
let tagsJa;
{
    const {ctx, p} = await open('ja');
    tagsJa = await p.evaluate(jpTags);
    const has = (id, k) => (tagsJa[id] || '').split(',').includes(k);
    for (const [k, ids] of Object.entries(REP_JP)) for (const id of ids) ok(has(id, k), `T1 ${id} に ${k} が付く: [${tagsJa[id]}]`);
    for (const [k, ids] of Object.entries(NOT_JP)) for (const id of ids) ok(tagsJa[id] !== undefined && !has(id, k), `T1 ${id} に ${k} が付かない: [${tagsJa[id]}]`);
    const n = Object.keys(tagsJa).length, empty = Object.values(tagsJa).filter(v => !v).length, onlyPan = Object.values(tagsJa).filter(v => v === 'pan').length, onlyPot = Object.values(tagsJa).filter(v => v === 'pot').length;
    ok(empty >= 1 && empty < n * 0.5, `T1 推定できない料理は無印のまま（既定の道具を付けない）: 無印 ${empty}/${n}`);
    ok(onlyPan + onlyPot < n, `T1 「フライパン/鍋」だけを既定にしていない: ${onlyPan}+${onlyPot}/${n}`);
    // ひとひねり案・自分の料理は道具なし
    const tw = await p.evaluate(() => [toolsOf({id: 'a~x~y~z~w', name: 'x', steps: ['フライパンで焼く'], items: []}).length, toolsOf(null).length]);
    ok(tw[0] === 0 && tw[1] === 0, 'T1 ひとひねり案・料理なしは道具なし: ' + tw);
    // 他の国
    const packTags = await p.evaluate(async ccs => { const o = {}; for (const cc of ccs){ await loadBrowse(cc); o[cc] = {}; (BROWSE[cc] || []).forEach(r => { o[cc][r.id] = toolsOf(r).join(); }); } return o; }, Object.keys(REP_PACK));
    for (const [cc, m] of Object.entries(REP_PACK)) for (const [id, ks] of Object.entries(m)){
        ok(packTags[cc][id] !== undefined, `T1 ${cc} ${id} が読めた`);
        for (const k of ks) ok((packTags[cc][id] || '').split(',').includes(k), `T1 ${id} に ${k} が付く: [${packTags[cc][id]}]`);
    }
    for (const [cc, m] of Object.entries(NOT_PACK)) for (const [id, ks] of Object.entries(m)) for (const k of ks) ok(!(packTags[cc][id] || '').split(',').includes(k), `T1 ${id} に ${k} が付かない: [${packTags[cc][id]}]`);
    for (const cc of Object.keys(packTags)){ const v = Object.values(packTags[cc]); ok(v.length > 50 && v.filter(x => !x).length < v.length * 0.4, `T1 ${cc}: 推定できない料理が少なすぎ/多すぎない: 無印 ${v.filter(x => !x).length}/${v.length}`); }
    // T2 日本で各5品以上（主菜）と、新しい5品
    const cnt = await p.evaluate(() => { const o = {}; ['hotplate', 'teppan', 'charcoal'].forEach(k => { o[k] = RECIPES.filter(r => r.main && hasTool(r, k)).map(r => r.id); }); return o; });
    for (const k of ['hotplate', 'teppan', 'charcoal']) ok(cnt[k].length >= 5, `T2 日本の ${k} の主菜が5品以上: ${cnt[k].length} (${cnt[k].join()})`);
    console.log('日本の主菜の数:', JSON.stringify(Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, v.length]))));
    const NEW = ['yakitori', 'monja', 'teppan_gyu', 'teppan_tori', 'yaki_tomorokoshi'];
    const meta = await p.evaluate(NEW => NEW.map(id => { const r = RECIPES.find(x => x.id === id); return {id, ok: !!r, min: r && r.min, steps: r && r.steps.length, yomi: (YOMI[id] || ''), type: r && r.type, txt: r ? [r.name, ...r.ings, r.seas].join(' | ') : '',
        hit: Object.fromEntries(['egg', 'milk', 'wheat', 'soy', 'peanut', 'sesame', 'shrimp', 'crab', 'walnut', 'buckwheat', 'fish', 'treenut', 'gluten'].map(a => { S.settings.allergens = [a]; avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; return [a, !!(r && allergyConflict(r))]; }))}; }), NEW);
    await p.evaluate(() => { S.settings.allergens = []; });
    const OWN = {egg: /卵|たまご|玉子/, milk: /牛乳|ミルク|バター|チーズ|クリーム/, wheat: /小麦|パン粉|麺|醤油|ソース|ポン酢|天かす/, soy: /大豆|豆腐|納豆|味噌|醤油|ポン酢/, sesame: /ごま|ゴマ|胡麻/, shrimp: /えび|海老/, fish: /鮭|さけ|魚|さば|かつお|だし/, gluten: /小麦|パン粉|麺|醤油|ソース|ポン酢|天かす/};
    for (const m of meta){
        ok(m.ok && m.min >= 10 && m.min <= 25, `T2 ${m.id}: 分が10〜25: ${m.min}`);
        ok(m.steps >= 3 && m.steps <= 4, `T2 ${m.id}: 手順3〜4: ${m.steps}`);
        ok(/^[ぁ-んー,]+$/.test(m.yomi), `T2 ${m.id}: 読みがひらがな: ${m.yomi}`);
        for (const [a, re] of Object.entries(OWN)) if (re.test(m.txt)) ok(m.hit[a], `T2 ${m.id}: ${a} を取りこぼし（${m.txt.slice(0, 80)}）`);
    }
    ok(meta.filter(m => m.type === '主菜').length === 4 && meta.find(m => m.id === 'yaki_tomorokoshi').type === '副菜', 'T2 主菜4品・副菜1品');
    await ctx.close();
}
// ---------- T1b 画面の言葉に依存しない ----------
for (const lang of ['en', 'ko', 'ar']){
    const {ctx, p} = await open(lang);
    const tg = await p.evaluate(jpTags);
    const diff = Object.keys(tagsJa).filter(id => tg[id] !== tagsJa[id]);
    ok(diff.length === 0 && Object.keys(tg).length === Object.keys(tagsJa).length, `T1b ${lang}: 日本の料理の道具が日本語の画面と同じ（違う ${diff.slice(0, 5).map(id => id + ':' + tagsJa[id] + '/' + tg[id])}）`);
    await ctx.close();
}
for (const [lang, cc] of [['ko', 'KR'], ['en', 'KR'], ['de', 'KR']]){
    const {ctx, p} = await open(lang, cc);
    const tg = await p.evaluate(() => { const o = {}; RECIPES.forEach(r => { o[r.id] = toolsOf(r).join(); }); return o; });
    globalThis.__kr = globalThis.__kr || {}; globalThis.__kr[lang] = tg;
    ok(Object.keys(tg).length > 50, `T1b ${cc} ${lang}: 料理が読めた`);
    await ctx.close();
}
{
    const a = globalThis.__kr.ko, bb = globalThis.__kr.en, c = globalThis.__kr.de;
    const diff = Object.keys(a).filter(id => a[id] !== bb[id] || a[id] !== c[id]);
    ok(diff.length === 0, `T1b 韓国: ko/en/de で道具が同じ（違う ${diff.slice(0, 5)}）`);
}
// ---------- T3〜T5 ----------
{
    const {ctx, p} = await open('ja');
    const ALGS = await p.evaluate(() => Object.keys(ALG_DEF));
    const check = async (label, set) => {
        const bad = await p.evaluate(async set => {
            const out = [];
            S.settings.allergens = set.al || []; S.settings.avoid = set.av || []; RESET0();
            const pool = toolPool();
            TOOLS.forEach(x => toolMains(x.k, pool).forEach(r => { if (isAvoided(r) || allergyConflict(r) || slotOut(r)) out.push('list:' + x.k + ':' + r.id); }));
            // 道具の一覧の画面（行）にも出ない
            for (const k of ['hotplate', 'teppan', 'charcoal', 'pot', 'fishgrill']){
                session.tool = k; sheet = {kind: 'tools'}; renderSheet();
                document.querySelectorAll('#sheet-root [data-act=tool-pick]').forEach(bt => { const r = byId(bt.dataset.id); if (!r || isAvoided(r) || allergyConflict(r)) out.push('row:' + k + ':' + bt.dataset.id); });
                closeSheet();
                for (let i = 0; i < 8; i++){ session.rejected.clear(); newMenu(); (session.menu.items || []).forEach(it => { if (it.r && (isAvoided(it.r) || allergyConflict(it.r))) out.push('menu:' + k + ':' + it.r.id); }); }
            }
            session.tool = null; S.settings.allergens = []; S.settings.avoid = []; RESET0();
            return out;
        }, set);
        ok(bad.length === 0, `T3 ${label}: 外れた料理が出る ${bad.slice(0, 5)}`);
    };
    await p.evaluate(() => { window.RESET0 = () => { avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; }; });
    for (const a of ALGS) await check('アレルゲン ' + a, {al: [a], av: []});
    for (const d of ['halal', 'vegi', 'vegan']){ const av = await p.evaluate(d => dietBundleToggle([], d), d); await check('食の決まり ' + d, {al: [], av}); }
    await check('お酒避け', {al: [], av: ['@alcohol']});
    await check('小麦+卵+乳', {al: ['wheat', 'egg', 'milk'], av: []});
    // 具体: 小麦アレルギーで、小麦を使うホットプレート料理が一覧に出ない・残りは出る
    const wh = await p.evaluate(() => { S.settings.allergens = ['wheat']; RESET0(); const ids = toolMains('hotplate').map(r => r.id); const all = RECIPES.filter(r => r.main && hasTool(r, 'hotplate')).map(r => r.id); S.settings.allergens = []; RESET0(); return {ids, all}; });
    ok(!wh.ids.includes('okonomi') && !wh.ids.includes('yakisoba') && wh.all.includes('okonomi'), `T3 小麦アレルギーでお好み焼き・焼きそばは一覧にない: ${wh.ids}`);
    // 今は出さない（S.hidden）も一覧に出ない
    const hid = await p.evaluate(() => { S.hidden.push('yakiniku'); const has = toolMains('hotplate').some(r => r.id === 'yakiniku'); S.hidden = S.hidden.filter(x => x !== 'yakiniku'); return has; });
    ok(!hid, 'T3 「今は出さない」の料理は一覧に出ない');
    // 強制: アレルギーに当たる料理を tool-pick に渡しても入らない
    const forced = await p.evaluate(() => { S.settings.allergens = ['wheat']; RESET0(); newMenu(); const before = session.menu.items[0].r.id; session.tool = 'hotplate'; sheet = {kind: 'tools'}; renderSheet();
        const bt = document.createElement('button'); bt.dataset.act = 'tool-pick'; bt.dataset.id = 'okonomi'; document.querySelector('#sheet-root').appendChild(bt); bt.click();
        const after = session.menu.items[0].r.id; S.settings.allergens = []; RESET0(); closeSheet(); session.tool = null; return {before, after}; });
    ok(forced.before === forced.after, `T3 小麦アレルギーでは、お好み焼きを強制しても主菜に入らない: ${forced.before}→${forced.after}`);
    await ctx.close();
}
{
    const {ctx, p} = await open('ja');
    await p.evaluate(() => { window.RESET0 = () => { avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; }; });
    // T4: チップを押しても献立は動かない
    await p.evaluate(() => { newMenu(); render(); });
    const ids0 = await p.evaluate(() => menuIds().join());
    await p.evaluate(() => openCondSheet());
    await p.waitForSelector('#sheet-root .cond-tools [data-act=tool-set][data-k=hotplate]');
    const chips = await p.$$eval('#sheet-root .cond-tools [data-act=tool-set]', els => els.map(e => [e.dataset.k, e.textContent.trim(), e.getAttribute('aria-pressed')]));
    ok(chips.length >= 8 && chips[0][0] === 'hotplate' && chips.some(c => c[0] === 'teppan') && chips.some(c => c[0] === 'charcoal'), `T4 道具のチップが並ぶ（ホットプレート・鉄板・炭火）: ${chips.map(c => c[1])}`);
    ok(chips.every(c => c[2] === 'false'), 'T4 はじめはどれも選んでいない');
    await p.click('#sheet-root [data-act=tool-set][data-k=hotplate]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => session.tool === 'hotplate'), 'T4 チップを押すと今日使う道具になる');
    ok(await p.evaluate(ids0 => menuIds().join() === ids0, ids0), 'T4 チップを押しても、いまの献立は動かない');
    ok(await p.$eval('#sheet-root [data-act=tool-set][data-k=hotplate]', e => e.getAttribute('aria-pressed')) === 'true', 'T4 押したチップが押された表示になる');
    await p.click('#sheet-root [data-act=tool-set][data-k=hotplate]'); await p.waitForTimeout(100);
    ok(await p.evaluate(() => session.tool === null), 'T4 もう一度押すと外れる');
    await p.evaluate(() => closeSheet());
    // まるごと入れ替えでその道具の料理が先に出る
    const pref = await p.evaluate(() => { session.tool = 'hotplate'; const m = []; for (let i = 0; i < 40; i++){ session.rejected.clear(); newMenu(); m.push(hasTool(session.menu.items[0].r, 'hotplate')); } session.tool = 'charcoal'; const c = []; for (let i = 0; i < 40; i++){ session.rejected.clear(); newMenu(); c.push(hasTool(session.menu.items[0].r, 'charcoal')); }
        session.tool = 'oven'; const o = []; for (let i = 0; i < 40; i++){ session.rejected.clear(); newMenu(); o.push(session.menu.items[0].r.id); } session.tool = null; const n = []; for (let i = 0; i < 40; i++){ session.rejected.clear(); newMenu(); n.push(hasTool(session.menu.items[0].r, 'hotplate')); }
        return {hot: m.filter(Boolean).length, cha: c.filter(Boolean).length, ovenNon: o.filter(x => x !== 'gratin').length, none: n.filter(Boolean).length}; });
    ok(pref.hot >= 38, `T4 ホットプレートの日は、主菜がホットプレートの料理（40回中 ${pref.hot}）`);
    ok(pref.cha >= 38, `T4 炭火の日は、主菜が炭火の料理（40回中 ${pref.cha}）`);
    ok(pref.ovenNon >= 10, `T4 オーブンの料理は1品だけなので、無理に絞らない（グラタン以外が ${pref.ovenNon}/40）`);
    ok(pref.none <= 20, `T4 道具を選ばないときは偏らない（ホットプレート ${pref.none}/40）`);
    // 決めた献立は動かない
    await p.evaluate(() => { session.tool = null; session.rejected.clear(); newMenu(); const mb = () => { const c = session.menu && session.menu.items[0] && session.menu.items[0].r; return !!c && !!isBowlMain(c); }; for (let i = 0; i < 40 && mb(); i++) newMenu(); render(); });   // 一覧の入れ替えは『形が同じ主菜』だけなので、ふつうの主菜(丼・麺でない)から始める
    await p.evaluate(() => { document.querySelector('[data-act=decide]').click(); }); await p.waitForTimeout(600);
    const dec = await p.evaluate(() => ({cook: JSON.stringify(S.cook.ids), menu: menuIds().join(), decided: menuIsDecided()}));
    ok(dec.decided, 'T4 献立を決めた');
    await p.evaluate(() => openCondSheet()); await p.waitForSelector('#sheet-root [data-act=tool-set][data-k=teppan]');
    await p.click('#sheet-root [data-act=tool-set][data-k=teppan]'); await p.waitForTimeout(200);
    ok(await p.evaluate(dec => JSON.stringify(S.cook.ids) === dec.cook && menuIds().join() === dec.menu, dec), 'T4 決めた献立は、道具のチップで動かない');
    // T5: 道具から探す（決めた献立）
    await p.click('#sheet-root [data-act=tool-find]'); await p.waitForSelector('#sheet-root .tool-list');
    const rows = await p.$$eval('#sheet-root [data-act=tool-pick]', els => els.map(e => e.dataset.id));
    const tag = await p.evaluate(rows => rows.every(id => hasTool(byId(id), 'teppan') && byId(id).main), rows);
    ok(rows.length >= 4 && tag, `T5 鉄板の主菜の一覧が出る: ${rows}`);
    ok((await p.$eval('#sheet-root .tool-count', e => e.textContent)).includes('鉄板'), 'T5 一覧の見出しに道具の名前');
    const enabledRows = await p.$$eval('#sheet-root [data-act=tool-pick]', els => els.filter(e => !e.disabled).map(e => e.dataset.id));   // 形がちがう主菜は灰色（押せない）。押せるものから選ぶ
    const target = enabledRows[0] || rows[0];
    await p.click(`#sheet-root [data-act=tool-pick][data-id="${target}"]`); await p.waitForTimeout(200);
    ok(await p.evaluate(dec => JSON.stringify(S.cook.ids) === dec.cook && menuIds().join() === dec.menu, dec), 'T5 決めた献立は、確かめる前は動かない');
    ok(await p.$('#sheet-root [data-act=tool-yes]') !== null, 'T5 決めた献立は「変えますか？」と確かめる');
    await p.click('#sheet-root [data-act=sheet-close]'); await p.waitForTimeout(100);
    ok(await p.evaluate(dec => JSON.stringify(S.cook.ids) === dec.cook, dec), 'T5 やめると動かない');
    await p.evaluate(() => { sheet = {kind: 'tools'}; renderSheet(); });
    await p.click(`#sheet-root [data-act=tool-pick][data-id="${target}"]`); await p.click('#sheet-root [data-act=tool-yes]'); await p.waitForTimeout(300);
    const after = await p.evaluate(() => ({cook: S.cook.ids.slice(), menu: menuIds()}));
    const d0 = JSON.parse(dec.cook);
    ok(after.cook[0] === target && after.cook.slice(1).join() === d0.slice(1).join(), `T5 確かめたあと、主菜だけが入れ替わる（ほかは同じ）: ${d0} → ${after.cook}`);
    ok(after.menu.slice(1).join() === dec.menu.split(',').slice(1).join(), 'T5 画面の献立も主菜以外は同じ');
    // 元に戻す
    const undo = await p.$('[data-act="toast-undo"]'); ok(!!undo, 'T5 「元に戻す」が出る');
    if (undo){ await undo.click(); await p.waitForTimeout(300); ok(await p.evaluate(dec => JSON.stringify(S.cook.ids) === dec.cook && menuIds().join() === dec.menu, dec), 'T5 元に戻すと、決めた献立が元どおり'); }
    // 決めていない案: その場で入れ替え・元に戻す
    await p.evaluate(() => { S.cook = null; session.tool = null; session.rejected.clear(); newMenu(); render(); });
    const m0 = await p.evaluate(() => menuIds());
    await p.evaluate(() => { session.tool = 'charcoal'; sheet = {kind: 'tools'}; renderSheet(); });
    const rows2 = await p.$$eval('#sheet-root [data-act=tool-pick]', els => els.map(e => e.dataset.id));
    ok(rows2.length >= 4 && !rows2.includes(m0[0]), `T5 炭火の主菜の一覧（いまの主菜は除く）: ${rows2}`);
    await p.click(`#sheet-root [data-act=tool-pick][data-id="${rows2[0]}"]`); await p.waitForTimeout(300);
    const m1 = await p.evaluate(() => menuIds());
    ok(m1[0] === rows2[0] && m1.slice(1).join() === m0.slice(1).join(), `T5 決めていない案は、押すとすぐ主菜だけ入れ替わる: ${m0} → ${m1}`);
    ok(await p.evaluate(() => !sheet), 'T5 入れ替えたらシートが閉じる');
    const u2 = await p.$('[data-act="toast-undo"]'); ok(!!u2, 'T5 元に戻すが出る');
    if (u2){ await u2.click(); await p.waitForTimeout(300); ok(await p.evaluate(m0 => menuIds().join() === m0.join(), m0), 'T5 元に戻すと主菜も元どおり'); }
    ok(await p.evaluate(() => { sheet = {kind: 'tools'}; session.tool = null; renderSheet(); const r = document.querySelectorAll('#sheet-root [data-act=tool-pick]').length === 0 && !!document.querySelector('#sheet-root .tool-chips'); closeSheet(); return r; }), 'T5 道具を選ぶまでは一覧が空');
    await ctx.close();
}
// ---------- T8 入れ替えで、主食・副菜・汁ものの欄が1つも動かない（全道具×全主菜）。形のちがう主菜は灰色で押せない ----------
{
    const {ctx, p} = await open('ja');
    const res = await p.evaluate(() => {
        const out = {bad: [], n: 0, off: 0, offOk: 0, kinds: {}};
        const snap = () => JSON.stringify([session.menu.items.slice(1).map(x => [x.slot, x.r && x.r.id]), (() => { try { const rc = riceRow(session.menu.items.filter(x => x.r)); return rc ? [rc.name, rc.go] : null; } catch (e) { return 'err'; } })(), session.menu.items.length]);
        for (const want of [false, true]){
            let ok0 = false; for (let i = 0; i < 300 && !ok0; i++){ session.rejected.clear(); newMenu(); const m = session.menu.items[0].r; ok0 = m && !!isBowlMain(m) === want; }
            if (!ok0) continue;
            out.kinds[want] = session.menu.items[0].r.id;
            for (const x of TOOLS){
                session.tool = x.k; sheet = {kind: 'tools'}; renderSheet();
                const btns = [...document.querySelectorAll('#sheet-root [data-act=tool-pick]')];
                const cur = session.menu.items[0].r;
                btns.forEach(bt => {
                    const r = byId(bt.dataset.id), differs = isBowlMain(r) !== isBowlMain(cur);
                    if (differs){ out.off++; if (bt.disabled && bt.closest('.item').querySelector('.tool-off-note')) out.offOk++; }
                    else if (bt.disabled) out.bad.push('disabled:' + r.id);
                });
                closeSheet();
                for (const r of toolMains(x.k)){
                    if (session.menu.items[0].r.id === r.id || menuIds().includes(r.id)) continue;
                    const before = snap(), main0 = session.menu.items[0].r;
                    // 押せない料理を強制しても入らない
                    sheet = {kind: 'tools'}; session.tool = x.k; renderSheet();
                    const bt = document.createElement('button'); bt.dataset.act = 'tool-pick'; bt.dataset.id = r.id; document.querySelector('#sheet-root').appendChild(bt); bt.click();
                    const forcedIn = session.menu.items[0].r !== main0;
                    if (isBowlMain(r) !== isBowlMain(main0)){ if (forcedIn) out.bad.push('forced:' + r.id); closeSheet(); continue; }
                    out.n++;
                    if (!forcedIn) out.bad.push('notapplied:' + r.id);
                    if (snap() !== before) out.bad.push(x.k + ':' + main0.id + '->' + r.id);
                    session.menu.items[0].r = main0; closeSheet();
                }
            }
        }
        session.tool = null; return out;
    });
    ok(res.n > 100 && res.bad.length === 0, `T8 全道具×全主菜で主食・副菜・汁ものが動かない（${res.n}件）: ${res.bad.slice(0, 5)}`);
    ok(res.off > 0 && res.off === res.offOk, `T8 形がちがう主菜は灰色で押せず注記が出る: ${res.offOk}/${res.off}`);
    await ctx.close();
}
// ---------- T6 17言語 ----------
{
    const KEYS = ['土鍋', '圧力鍋', 'ホットプレート', '鉄板', '炭火・BBQ', '蒸し器', '揚げ物鍋', '火を使わない', '選んだ道具の料理を先に選びます（足りないときは、ふつうに選びます）。いまの献立は変わりません。', '道具から料理を探す', '道具から探す', '{tool}で作る主菜（{n}品）', '道具を選ぶと、その道具で作る主菜が出ます。', '形がちがうので入れ替えられません'];
    const REUSED = ['道具', '魚焼きグリル', '鍋', 'フライパン', 'オーブン', 'トースター', '電子レンジ', '炊飯器', 'ミキサー', 'これにする', '合う料理がありません'];
    const LANGS = 'ar de en es fil fr hi id it ko pl pt-BR th tr vi zh-Hans zh-Hant'.split(' ');
    const keysJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/i18n/keys.json'), 'utf8'));
    const kl = Array.isArray(keysJson) ? keysJson : (keysJson.keys || Object.keys(keysJson));
    ok(KEYS.every(k => kl.includes(k)), 'T6 keys.json に新しい文言がある（extract.mjs の再生成）');
    for (const lang of LANGS){
        let dict = null; const ctx = {GOHAN_I18N: (l, d) => { dict = d; }};
        vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'gohancho/i18n', lang + '.js'), 'utf8'), ctx);
        ok(dict, `T6 ${lang}: 辞書が読める`);
        for (const k of [...KEYS, ...REUSED]){
            const v = dict && dict[k];
            ok(typeof v === 'string' && v.trim() && (v !== k || (lang.startsWith('zh') && !/[ぁ-んァ-ヶ]/.test(k))), `T6 ${lang}: 「${k.slice(0, 16)}」の訳がある`);
            if (typeof v === 'string') for (const ph of (k.match(/\{\w+\}/g) || [])) ok(v.includes(ph), `T6 ${lang}: 「${k.slice(0, 16)}」に ${ph} が残る`);
            if (typeof v === 'string' && lang !== 'en' && !['zh-Hans', 'zh-Hant'].includes(lang)) ok(!/[ぁ-んァ-ヶ]/.test(v), `T6 ${lang}: 「${k.slice(0, 16)}」が日本語のまま`);
        }
        let out = ''; try { out = execFileSync('node', [path.join(ROOT, 'tools/i18n/extract.mjs'), '--check', lang], {encoding: 'utf8'}); } catch (e) { out = (e.stdout || '') + 'EXIT'; }
        ok(!/^MISSING|^MISMATCH|EXIT/m.test(out), `T6 ${lang}: extract.mjs --check にエラーがない`);
    }
}
// ---------- T7 幅195〜430 ----------
for (const w of [195, 240, 280, 320, 360, 390, 430]){
    const {ctx, p} = await open('ja', 'JP', w, 780);
    await p.evaluate(() => openCondSheet()); await p.waitForSelector('#sheet-root .cond-tools');
    const lay = async sel => p.evaluate(sel => {
        const root = document.querySelector('#sheet-root .sheet, #sheet-root > *'); const sc = document.querySelector(sel);
        const els = [...document.querySelectorAll(sel + ' button')].map(e => { const r = e.getBoundingClientRect(); return {t: e.textContent.trim().slice(0, 8), x: r.left, y: r.top, w: r.width, h: r.height}; });
        const overlap = []; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++){ const a = els[i], c = els[j]; if (a.x < c.x + c.w - 1 && c.x < a.x + a.w - 1 && a.y < c.y + c.h - 1 && c.y < a.y + a.h - 1) overlap.push(a.t + '×' + c.t); }
        return {n: els.length, minH: Math.min(...els.map(e => e.h)), minW: Math.min(...els.map(e => e.w)), overlap, over: sc.scrollWidth > sc.clientWidth + 1, left: Math.min(...els.map(e => e.x)), right: Math.max(...els.map(e => e.x + e.w)), vw: innerWidth};
    }, sel);
    const a = await lay('#sheet-root .cond-tools');
    ok(a.n >= 9 && a.minH >= 43.5 && a.minW >= 43.5, `T7 ${w}px: 条件の道具の欄のボタンが44px以上: ${JSON.stringify({n: a.n, minH: a.minH, minW: a.minW})}`);
    ok(a.overlap.length === 0, `T7 ${w}px: 条件の道具の欄が重ならない: ${a.overlap.slice(0, 3)}`);
    ok(!a.over && a.left >= -0.5 && a.right <= a.vw + 0.5, `T7 ${w}px: 道具の欄が横にはみ出さない: ${a.left}-${a.right}/${a.vw}`);
    await p.evaluate(() => { session.tool = 'hotplate'; sheet = {kind: 'tools'}; renderSheet(); });
    await p.waitForSelector('#sheet-root .tool-list [data-act=tool-pick]');
    const t2 = await p.evaluate(() => { const sh = document.querySelector('#sheet-root'); const els = [...sh.querySelectorAll('button')].map(e => { const r = e.getBoundingClientRect(); return {t: e.textContent.trim().slice(0, 8), x: r.left, y: r.top, w: r.width, h: r.height}; });
        const overlap = []; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++){ const a = els[i], c = els[j]; if (a.x < c.x + c.w - 1 && c.x < a.x + a.w - 1 && a.y < c.y + c.h - 1 && c.y < a.y + a.h - 1) overlap.push(a.t + '×' + c.t); }
        return {minH: Math.min(...els.map(e => e.h)), overlap, right: Math.max(...els.map(e => e.x + e.w)), vw: innerWidth, n: els.length}; });
    ok(t2.minH >= 43.5 && t2.overlap.length === 0 && t2.right <= t2.vw + 0.5, `T7 ${w}px: 道具から探す の一覧のボタン: ${JSON.stringify({minH: t2.minH, ov: t2.overlap.slice(0, 3), r: t2.right, vw: t2.vw})}`);
    await ctx.close();
}
// ---------- 文言が長い言語（ドイツ語・フィリピン語・ベトナム語）でも幅195で重ならない ----------
for (const lang of ['de', 'fil', 'vi', 'th', 'ar']){
    const {ctx, p} = await open(lang, 'JP', 195, 780);
    await p.evaluate(() => openCondSheet()); await p.waitForSelector('#sheet-root .cond-tools');
    const r = await p.evaluate(() => { const els = [...document.querySelectorAll('#sheet-root .cond-tools button')].map(e => { const r = e.getBoundingClientRect(); return {t: e.textContent.trim().slice(0, 8), x: r.left, y: r.top, w: r.width, h: r.height}; });
        const overlap = []; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++){ const a = els[i], c = els[j]; if (a.x < c.x + c.w - 1 && c.x < a.x + a.w - 1 && a.y < c.y + c.h - 1 && c.y < a.y + a.h - 1) overlap.push(a.t + '×' + c.t); }
        return {minH: Math.min(...els.map(e => e.h)), overlap, right: Math.max(...els.map(e => e.x + e.w)), left: Math.min(...els.map(e => e.x)), vw: innerWidth, jaLeft: /[ぁ-んァ-ヶ]/.test(document.querySelector('#sheet-root .cond-tools').textContent)}; });
    ok(r.minH >= 43.5 && r.overlap.length === 0 && r.right <= r.vw + 0.5 && r.left >= -0.5, `T7 ${lang} 195px: 道具の欄が重ならず44px以上: ${JSON.stringify(r)}`);
    ok(!r.jaLeft, `T7 ${lang}: 道具の欄に日本語が残らない`);
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(fails ? `NG ${fails}` : 'OK tool-r1');
process.exit(fails ? 1 : 0);
