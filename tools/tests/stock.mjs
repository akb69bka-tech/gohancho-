#!/usr/bin/env node
// 備蓄（ローリングストック）・あなたの記録・アレルゲン区分表の版の回帰テスト（Playwright。使い方: node tools/tests/stock.mjs [http://localhost:8794/]）
//  備蓄: 追加（品名必須・重複・上限）/ 期限が近い順 / 1つ使った（数を減らす・記録・取り消し・0なら押せない）/ ＋1 / 期限の変更 / 消す（取り消し）
//        買い物メモに足す（1週間プランがあるときだけ出る）/ 不正値の除去(normalizeState) / 書き出し・読み込みの往復 / データの要約
//        全21か国で、備蓄の操作で献立・1週間プラン・冷蔵庫・「早めに使う」・買い物メモの計算が連動して変わらないこと
//  あなたの記録: 今月の件数だけ（作った料理・国・使い切り・捨て・備蓄の使用・わが家のレシピ）/ 記録がなければ出ない / 評価の言葉を出さない / S を書きかえない
//  アレルギー: 設定のカードに区分表の更新日、選んでいるときは買い物メモに原材料表示の一行
//  17言語: 新しい画面に日本語が残らないこと
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready, SEED, rngScript, seedFor } = require('../lib/pw.cjs'); let seedN = 0;   // 乱数は SEED から（失敗したら表示の SEED=… を付けて実行すると同じ献立で再現する）
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const CCS = (process.env.CCS || 'JP,TW,CN,KR,US,TH,VN,FR,DE,IN,MX,BR,GB,IT,ES,TR,EG,PE,PL,PH,ID').split(',');
const LANGS = (process.env.LANGS || 'en,ar,de,es,fil,fr,hi,id,it,ko,pl,pt-BR,th,tr,vi,zh-Hans,zh-Hant').split(',');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const open = async (state = {}, cc = 'JP', uiLang = 'ja') => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('stock', String(++seedN))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(([cc, st, ul]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded:true, firstUse:'2026-01-01'}, st, {settings: Object.assign({country:cc, dishCount:3, uiLang:ul}, st.settings || {})}))); } }, [cc, state, uiLang]);
    await p.goto(URL_); await ready(p); return p;
};
const stored = p => p.evaluate(() => { saveNow(); return JSON.parse(localStorage.getItem('gohancho.v1')); });
const undo = async p => { await p.locator('.toast button, #toast button').first().click().catch(() => {}); await p.waitForTimeout(150); };

// ---- 画面の操作（日本語） ----
{
    const p = await open({});
    await p.evaluate(() => { S.foldOpen = Object.assign({}, S.foldOpen, {'fr-loss': true, 'fr-stock': true}); setTab('fridge'); render(); });
    ok(await p.locator('#stock-sec').count() === 1, 'stock section');
    ok(/まだ登録していません/.test(await p.locator('#stock-sec').innerText()), 'empty text');
    const d = await p.evaluate(() => ({a: addDays(TODAY, 40), b: addDays(TODAY, 5), y: addDays(TODAY, -2)}));
    const add = async (n, q, e) => { await p.fill('#stock-name', n); await p.fill('#stock-q', q); await p.fill('#stock-exp', e); await p.locator('#stock-sec button[type=submit]').click(); await p.waitForTimeout(80); };
    await add('水 2L', '6', d.a); await add('さば缶', '3', d.b); await add('カセットボンベ', '', ''); await add('レトルトカレー', '1', d.y);
    let st = await stored(p);
    ok(st.stock.length === 4, 'added 4 ' + st.stock.length);
    ok(st.stock.find(x => x.n === 'カセットボンベ').q === null && st.stock.find(x => x.n === 'カセットボンベ').e === '', 'optional q/exp empty');
    ok(st.stock.every(x => x.d === st.stock[0].d && /^\d{4}-\d{2}-\d{2}$/.test(x.d)), 'registered date');
    await add('さば缶', '1', ''); ok((await stored(p)).stock.length === 4, 'duplicate rejected');
    await add('   ', '1', ''); ok((await stored(p)).stock.length === 4, 'empty name rejected');
    const names = await p.locator('#stock-sec .stock-row .loss-nm').allInnerTexts();
    ok(names.join('|') === 'レトルトカレー|さば缶|水 2L|カセットボンベ', 'sorted by exp: ' + names.join('|'));
    ok(await p.locator('#stock-sec .stock-row').first().locator('.loss-d.over').count() === 1, 'overdue shown');
    ok(/期限なし/.test(await p.locator('#stock-sec .stock-row').last().innerText()), 'no date label');
    ok(await p.locator('#stock-sec [data-act="stock-shop"]').count() === 0, 'no shop button without week');
    // 1つ使った → 数が減り、記録が残る。取り消しで戻る
    const row = n => p.locator('#stock-sec .stock-row', {hasText: n});
    await row('さば缶').locator('[data-act="stock-use"]').click();
    st = await stored(p); ok(st.stock.find(x => x.n === 'さば缶').q === 2 && st.stockLog.length === 1 && st.stockLog[0].n === 'さば缶', 'use decrements & logs');
    await undo(p); st = await stored(p); ok(st.stock.find(x => x.n === 'さば缶').q === 3 && st.stockLog.length === 0, 'use undo');
    // 数を入れていない品は、減らさずに記録だけ
    await row('カセットボンベ').locator('[data-act="stock-use"]').click();
    st = await stored(p); ok(st.stock.find(x => x.n === 'カセットボンベ').q === null && st.stockLog.length === 1, 'use without q');
    ok(await row('カセットボンベ').locator('[data-act="stock-plus"]').count() === 0, 'no +1 without q');
    // 0 になったら押せない。＋1 で戻る
    await row('レトルトカレー').locator('[data-act="stock-use"]').click();
    ok(await row('レトルトカレー').locator('[data-act="stock-use"]').isDisabled(), 'disabled at 0');
    ok(/残り0/.test(await row('レトルトカレー').innerText()), 'shows 0');
    await row('レトルトカレー').locator('[data-act="stock-plus"]').click();
    st = await stored(p); ok(st.stock.find(x => x.n === 'レトルトカレー').q === 1, 'plus');
    // 期限を変える（並びも変わる）・消す
    await row('水 2L').locator('[data-act="stock-exp"]').fill(d.y); await p.waitForTimeout(100);
    st = await stored(p); ok(st.stock.find(x => x.n === '水 2L').e === d.y, 'exp changed');
    await row('水 2L').locator('[data-act="stock-exp"]').fill(''); await p.waitForTimeout(100);
    st = await stored(p); ok(st.stock.find(x => x.n === '水 2L').e === '', 'exp cleared');
    await row('さば缶').locator('[data-act="stock-rm"]').click();
    st = await stored(p); ok(!st.stock.some(x => x.n === 'さば缶'), 'removed');
    await undo(p); st = await stored(p); ok(st.stock.some(x => x.n === 'さば缶') && st.stock.length === 4, 'remove undo');
    // 量・期間の目安は出さない（数字の目安や「〜日分」を言わない）
    const txt = await p.locator('#stock-sec').innerText();
    ok(!/日分|人分|リットル|目安は(?!、このアプリでは出しません)/.test(txt.replace('備える量の目安は、このアプリでは出しません。', '')), 'no amount guidance');
    // 上限 100 品
    const lim = await p.evaluate(() => { S.stock = Array.from({length: 100}, (_, i) => ({id: 'x' + i, n: 'n' + i, q: null, e: '', d: TODAY})); return stockAdd('もう一品', '', ''); });
    ok(lim === false && (await stored(p)).stock.length === 100, 'limit 100');
    await p.context().close();
}
// ---- 買い物メモに足す（1週間プランがあるとき） ----
{
    const p = await open({});
    const o = await p.evaluate(() => {
        makeWeek(); S.stock = [{id:'s1', n:'さば缶', q:2, e:'', d:TODAY}]; save(); S.foldOpen = Object.assign({}, S.foldOpen, {'fr-loss': true, 'fr-stock': true}); setTab('fridge'); render();
        return {btn: !!document.querySelector('#stock-sec [data-act="stock-shop"]'), before: shoppingList().filter(e => !e.extra).map(e => e.key).join('|')};
    });
    ok(o.btn, 'shop button with week');
    await p.locator('#stock-sec [data-act="stock-shop"]').click();
    const a = await p.evaluate(() => ({extra: shopExtras().map(x => x.label), after: shoppingList().filter(e => !e.extra).map(e => e.key).join('|'), q: S.stock[0].q}));
    ok(a.extra.includes('さば缶'), 'added to shopping memo'); ok(a.after === o.before, 'other shopping rows unchanged'); ok(a.q === 2, 'qty unchanged by shop');
    await p.context().close();
}
// ---- 全21か国: 備蓄の操作で献立などが連動して変わらない ----
for (const cc of CCS){
    const p = await open({}, cc);
    const snap = () => p.evaluate(() => JSON.stringify({m: (session.menu ? session.menu.items : []).map(x => x.slot + ':' + (x.r && x.r.id)), w: S.week, f: S.fridge, fm: S.fridgeMeta, sk: [...soonKeys()].sort(), sl: S.week ? shoppingList().filter(e => !e.extra).map(e => e.key) : [], h: S.history.length}));
    await p.evaluate(() => { makeWeek(); S.fridge = QUICK.slice(0, 3); S.fridgeMeta = {}; save(); setTab('today'); render(); });
    const s1 = await snap();
    await p.evaluate(() => { S.foldOpen = Object.assign({}, S.foldOpen, {'fr-loss': true, 'fr-stock': true}); setTab('fridge'); render(); });
    await p.fill('#stock-name', await p.evaluate(() => QUICK[4] || 'rice')); await p.fill('#stock-q', '2'); await p.fill('#stock-exp', await p.evaluate(() => addDays(TODAY, 1)));
    await p.locator('#stock-sec button[type=submit]').click();
    await p.fill('#stock-name', 'water'); await p.locator('#stock-sec button[type=submit]').click();
    await p.locator('#stock-sec [data-act="stock-use"]').first().click();
    await p.locator('#stock-sec [data-act="stock-plus"]').first().click();
    await p.locator('#stock-sec [data-act="stock-rm"]').last().click();
    await p.evaluate(() => { setTab('today'); render(); });
    const s2 = await snap();
    ok(s1 === s2, cc + ' menu/week/fridge/shopping unchanged by stock');
    { const st = (await stored(p)).stock; ok(st.length === 1, cc + ' stock kept ' + JSON.stringify(st.map(x => x.n))); }
    await p.context().close();
}
// ---- normalizeState / バックアップ / 要約 ----
{
    const p = await open({});
    const o = await p.evaluate(() => {
        const bad = normalizeState({stock: [{id:'a', n:'水', q:6, e:'2026-12-01', d:'2026-10-01'}, {id:'b', n:'  ', q:1}, null, 5, {n:'缶', q:-1, e:'2026-02-30', d:'x'}, {id:'a', n:'重複id'}, {id:'c', n:'米', q:1.5}, {id:'d', n:'塩', q:'3'}, {id:'e', n:'x'.repeat(80), q:1000}],
            stockLog: [{d:'2026-10-02', n:'水'}, {d:'bad', n:'x'}, {d:'2026-10-03', n:''}, {d:'2026-10-04', n:'缶', extra:1}]});
        const none = normalizeState({});
        const big = normalizeState({stock: Array.from({length: 130}, (_, i) => ({id:'i' + i, n:'n' + i})), stockLog: Array.from({length: 450}, (_, i) => ({d:'2026-10-01', n:'n' + i}))});
        S.stock = [{id:'s1', n:'水', q:6, e:'2026-12-01', d:'2026-10-01'}, {id:'s2', n:'缶', q:null, e:'', d:'2026-10-02'}]; S.stockLog = [{d:'2026-10-05', n:'水'}];
        const json = backupJson(); S.stock = []; S.stockLog = [];
        const r = parseBackup(json), st = normalizeState(r.d);
        return {stock: bad.stock, log: bad.stockLog, none: [none.stock, none.stockLog], big: [big.stock.length, big.stockLog.length, big.stockLog[399].n],
            back: JSON.stringify([st.stock, st.stockLog]), want: JSON.stringify([[{id:'s1', n:'水', q:6, e:'2026-12-01', d:'2026-10-01'}, {id:'s2', n:'缶', q:null, e:'', d:'2026-10-02'}], [{d:'2026-10-05', n:'水'}]]),
            sum: stateSummary(st), onlyStock: parseBackup(JSON.stringify({stock: [{n:'水'}]})).ok};
    });
    ok(JSON.stringify(o.stock.map(x => [x.id, /^x{40}$/.test(x.n) ? 'long' : x.n, x.q, x.e])) === JSON.stringify([['a', '水', 6, '2026-12-01'], ['s1', '缶', null, ''], ['c', '米', null, ''], ['d', '塩', 3, ''], ['e', 'long', null, '']]), 'normalize stock ' + JSON.stringify(o.stock));
    ok(o.stock.every(x => x.n.length <= 40) && o.stock.find(x => x.id === 's1').d === '', 'normalize stock fields');
    ok(JSON.stringify(o.log) === JSON.stringify([{d:'2026-10-02', n:'水'}, {d:'2026-10-04', n:'缶'}]), 'normalize stockLog ' + JSON.stringify(o.log));
    ok(JSON.stringify(o.none) === '[[],[]]', 'defaults'); ok(o.big[0] === 100 && o.big[1] === 400 && o.big[2] === 'n449', 'caps ' + o.big);
    ok(o.back === o.want, 'backup roundtrip ' + o.back); ok(/備蓄2品/.test(o.sum), 'summary ' + o.sum); ok(o.onlyStock, 'backup with only stock is recognized');
    await p.context().close();
}
// ---- あなたの記録 ----
{
    const p = await open({});
    ok(await p.evaluate(() => { S.history = []; S.foodLog = []; S.stockLog = []; S.custom = []; return myRecordHtml(); }) === '', 'hidden without data');
    const o = await p.evaluate(() => {
        const m = TODAY.slice(0, 7), prev = addDays(m + '-01', -1);
        const ids = RECIPES.filter(r => !isCustomId(r.id)).slice(0, 3).map(r => r.id);
        S.history = [{d: TODAY, id: ids[0], name: 'a', slot: '主菜'}, {d: TODAY, id: ids[1], name: 'b', slot: '副菜'}, {d: m + '-01', id: 'us_x', name: 'c', slot: '主菜'}, {d: prev, id: ids[2], name: 'old', slot: '主菜'}];
        S.foodLog = [{d: TODAY, n: 'x', r: 'u'}, {d: TODAY, n: 'y', r: 'u'}, {d: TODAY, n: 'z', r: 't'}, {d: prev, n: 'old', r: 't'}];
        S.stockLog = [{d: TODAY, n: '水'}, {d: prev, n: '水'}];
        const before = JSON.stringify(S); const s = myRecordStats(); const same = JSON.stringify(S) === before;
        save(); setTab('log'); render();
        return {s, same};
    });
    ok(o.s.made === 3 && o.s.countries === 2 && o.s.used === 2 && o.s.tossed === 1 && o.s.stockUsed === 1 && o.s.custom === 0, 'stats ' + JSON.stringify(o.s));
    ok(o.same, 'stats do not write S');
    await p.evaluate(() => { S.foldOpen = Object.assign({}, S.foldOpen, {'log-more': true}); render(); });   // 「あなたの記録」は記録タブの「もっと見る」の中（案2）
    const txt = await p.locator('#my-record').innerText();
    ok(/あなたの記録/.test(txt) && /3品/.test(txt) && /2か国/.test(txt) && /1回/.test(txt), 'record text ' + txt.replace(/\n/g, ' '));
    ok(/外には送りません/.test(txt), 'local note');
    ok(!/もったいない|えらい|がんばっ|すごい|よくでき|減らせ|節約|ランキング|平均|みんな/.test(txt), 'no judgement/comparison words');
    await p.context().close();
}
// ---- アレルギー: 区分表の更新日・買い物メモの一行 ----
{
    const p = await open({settings: {allergens: ['egg']}});
    const o = await p.evaluate(() => { setTab('settings'); render(); const card = document.querySelector('#allergy-card'); return {txt: card ? card.innerText : '', date: ALG_TABLE_DATE}; });
    ok(o.txt.includes(o.date) && /区分表の更新日/.test(o.txt), 'allergen table date shown');
    ok(/お店に確かめて/.test(o.txt), 'ask the shop line');
    const s = await p.evaluate(() => { makeWeek(); save(); return shoppingHtml(); });
    ok(/原材料表示を必ず確かめて/.test(s), 'shopping memo allergen line');
    const s0 = await p.evaluate(() => { S.settings.allergens = []; S.family = []; return shoppingHtml(); });
    ok(!/原材料表示を必ず確かめて/.test(s0), 'no line without allergy settings');
    await p.context().close();
}
// ---- 17言語: 新しい画面に日本語が残らない ----
for (const L of LANGS){
    const p = await open({stock: [{id:'s1', n:'Water', q:2, e:'2030-01-01', d:'2026-10-01'}], stockLog: [{d:'2026-10-01', n:'Water'}], settings: {allergens: ['egg']}}, 'US', L);
    const o = await p.evaluate(() => {
        S.history = [{d: TODAY, id: RECIPES[0].id, name: RECIPES[0].name, slot: '主菜'}]; S.stockLog.push({d: TODAY, n: 'Water'});
        S.foldOpen = Object.assign({}, S.foldOpen, {'fr-loss': true, 'fr-stock': true}); setTab('fridge'); render(); const a = document.querySelector('#stock-sec').innerText;
        setTab('log'); render(); const mo = document.querySelector('#log-more'); if (mo) mo.open = true; const m = (document.querySelector('#my-record') || {}).innerText || '';
        setTab('settings'); render(); const al = [...document.querySelectorAll('#allergy-card .alg-ver')].map(e => e.innerText).join(' ');
        makeWeek(); const sh = shoppingHtml().match(/class="pantry-hint alg-shop">([^<]*)/);
        return {lang: LANG, a, m, al, sh: sh ? sh[1] : ''};
    });
    const jp = s => /[぀-ヿ]/.test(s);   // ひらがな・カタカナ（中国語の漢字は除く）
    ok(o.lang === L, L + ' lang ' + o.lang);
    ok(o.a && !jp(o.a), L + ' stock text: ' + o.a.slice(0, 80)); ok(o.m && !jp(o.m), L + ' record text: ' + o.m.slice(0, 80));
    ok(o.al && !jp(o.al), L + ' allergen date'); ok(o.sh && !jp(o.sh), L + ' shopping line');
    await p.context().close();
}
await b.close();
if (errs.length) { console.log('page errors:', errs.slice(0, 5)); fails++; }
console.log(fails ? `FAILED ${fails}/${checks}` : `stock: all ${checks} checks passed`);
process.exit(fails ? 1 : 0);
