#!/usr/bin/env node
// よく行くスーパーと特売の回帰テスト（Playwright。使い方: node tools/tests/sale.mjs [http://localhost:9072/]）
//  S1 設定で店を登録（名前は整える・3店まで・URL は https だけ・特売日の曜日と売り場）。消す → 元に戻す
//  S2 特売日: 今日の画面に1行、買い物メモに「今日は○○の特売日」、その売り場が先頭。特売日でない日は出ない。登録がなければ今日の画面に何も足さない
//  S3 今日の特売: よく使う食材のチップ・自由入力・値段のメモ。特売の日の次の日まで残り、そのあとは消える
//  S4 使う料理: 特売の食材を使う。アレルギー（卵）を選ぶと卵の料理は出ない。今日の献立・決めた献立は変わらない。条件のシートに案内
//  S5 提携データ: 正しい JSON は読みこみ「PR」「提携」の札が出る。壊れた JSON・形のちがう・期間切れ・巨大は読みこまず、データは変わらない
//  S6 お知らせ（iPhone アプリ版のみ・はじめはオフ）: 特売日の朝に予約される
//  S7 195px・390px で横にはみ出さない。日本語・英語・アラビア語。ほかのサイトへの通信なし（店の URL・名前・郵便番号を送らない）
//  S8 書き出し・読み込み（バックアップ）に入る。壊れた S.sale でも起動する
//  S9 チラシの写真（iPhone アプリのみ）: 文字から品名と値段を拾う純粋な関数（チラシ風の文字24件）・候補を選んで入れる・ウェブ版はボタンなし
//  R107 特売の日でも器が特売のない日とほぼ同じ大きさ（360/390/430 × 文字3段階。差 6px まで）
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready, SEED, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ORIGIN = new URL(URL_).origin;
const SHOTS = process.env.SHOTS || '';
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [], foreign = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const KNOWN = /google|gstatic|wikipedia|wikimedia|githubusercontent/;   // 前からある料理の写真・字体（テストでは止めている）。特売の機能はこれ以外にも通信しない
async function open(opts = {}){
    const ctx = await b.newContext({ viewport: { width: opts.w || 390, height: 844 }, locale: opts.locale || 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await ctx.route(KNOWN, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('sale', String(opts.w || 390) + (opts.lang || 'ja'))));
    if (opts.native) await ctx.addInitScript(() => { window.__sched = []; window.Capacitor = {isNativePlatform: () => true, Plugins: {LocalNotifications: {checkPermissions: async () => ({display: 'granted'}), requestPermissions: async () => ({display: 'granted'}), cancel: async () => {}, schedule: async x => { window.__sched.push(x); }}}}; });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push((opts.lang || 'ja') + ': ' + e.message));
    p.on('request', r => { const u = r.url(); if (!u.startsWith(ORIGIN) && !u.startsWith('data:') && !u.startsWith('blob:')) foreign.push(u + ' ' + (r.postData() || '')); });
    await p.addInitScript(([lang, init]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: {country: 'JP', dishCount: 3, uiLang: lang}}, init || {}))); } }, [opts.lang || 'ja', opts.init || null]);
    await p.goto(URL_); await ready(p); await p.evaluate(() => { hasPro = () => true; });
    return { ctx, p };
}
const shot = async (p, name) => { if (SHOTS){ fs.mkdirSync(SHOTS, {recursive: true}); await p.screenshot({path: SHOTS + '/' + name + '.png', fullPage: true}); } };
const noOverflow = p => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// ---- S1 店を登録 ----
{
    const { ctx, p } = await open();
    // 登録がないとき: 今日の画面に特売の行・欄はない
    ok(await p.evaluate(() => { setTab('today'); return !document.querySelector('.sale-greet') && !document.querySelector('[data-fold="sale"]'); }), 'S1 登録なし: 今日の画面に何も足さない');
    await p.evaluate(() => { setTab('settings'); session.setOpen = {store: true}; render(); });
    ok(await p.evaluate(() => !!document.querySelector('#set-store') && !!document.querySelector('.set-toc [data-k=store]')), 'S1 設定に「よく行くスーパー」');
    await p.click('[data-act="sale-new"]');
    await p.fill('#sale-f-name', '  <b>ハッピー​マート</b>  駅前店  ');
    await p.selectOption('#sale-f-pref', '東京都'); await p.fill('#sale-f-city', '練馬区'); await p.fill('#sale-f-zip', '176-0001');
    const wd = await p.evaluate(() => parseYmd(TODAY).getDay());
    await p.selectOption('#sale-f-w', String(wd)); await p.selectOption('#sale-f-c', 'veg'); await p.click('[data-act="sale-day-add"]');
    await p.selectOption('#sale-f-w', String((wd + 3) % 7)); await p.selectOption('#sale-f-c', 'meat'); await p.click('[data-act="sale-day-add"]');
    ok(await p.evaluate(() => document.querySelector('#sale-f-name').value.includes('ハッピー')), 'S1 曜日を足しても入力した名前が残る');
    await p.fill('#sale-f-url', 'javascript:alert(1)'); await p.click('#sale-form button[type=submit]');
    ok(await p.evaluate(() => !S.sale || !S.sale.stores.length), 'S1 javascript: の URL は保存しない');
    await p.fill('#sale-f-url', 'https://flyer.example.test/happy'); await p.fill('#sale-f-note', '火曜は卵も安い');
    await p.click('#sale-form button[type=submit]'); await p.waitForTimeout(200);
    const st = await p.evaluate(() => S.sale.stores[0]);
    ok(st && st.name === 'bハッピー マート/b 駅前店' || (st && !/[<>]/.test(st.name) && /ハッピー/.test(st.name)), 'S1 名前は整える（山かっこ・見えない文字なし）: ' + JSON.stringify(st && st.name));
    ok(st && st.pref === '東京都' && st.city === '練馬区' && st.zip === '176-0001' && st.days.length === 2 && st.url === 'https://flyer.example.test/happy', 'S1 地域・特売日・URL ' + JSON.stringify(st));
    const link = await p.evaluate(() => { const a = document.querySelector('.sale-store a'); return a && {href: a.href, rel: a.rel, target: a.target}; });
    ok(link && link.href === 'https://flyer.example.test/happy' && /noopener/.test(link.rel) && /noreferrer/.test(link.rel), 'S1 URL はリンクとして出すだけ ' + JSON.stringify(link));
    // 3店まで
    for (const n of ['二号店', '三号店']){ await p.click('[data-act="sale-new"]'); await p.fill('#sale-f-name', n); await p.click('#sale-form button[type=submit]'); await p.waitForTimeout(100); }
    ok(await p.evaluate(() => S.sale.stores.length === 3 && !document.querySelector('[data-act="sale-new"]')), 'S1 3店まで（追加のボタンが消える）');
    await p.evaluate(() => saleAct({dataset: {}}, 'sale-new')); ok(await p.evaluate(() => S.sale.stores.length === 3 && !session.saleEdit), 'S1 4店目は登録しない');
    // 消す → 元に戻す
    await p.click('.sale-store[data-sid="' + (await p.evaluate(() => S.sale.stores[2].id)) + '"] [data-act="sale-del"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => S.sale.stores.length === 2), 'S1 消せる');
    await p.click('[data-act="toast-undo"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => S.sale.stores.length === 3), 'S1 元に戻す');
    await shot(p, 'settings-390-ja');
    await ctx.close();
}
// ---- S2〜S4 特売日・今日の特売・使う料理（日本語 390px） ----
const DAY = await (async () => { const { ctx, p } = await open(); const d = await p.evaluate(() => [TODAY, parseYmd(TODAY).getDay()]); await ctx.close(); return d; })();
const storeInit = {sale: {stores: [{id: 'stA', name: 'ハッピーマート', pref: '東京都', city: '練馬区', zip: '', days: [{w: DAY[1], c: 'veg'}], note: '', url: 'https://flyer.example.test/a'}, {id: 'stB', name: 'まるやす', pref: '', city: '', zip: '', days: [{w: (DAY[1] + 1) % 7, c: 'meat'}], note: '', url: ''}], items: []}};
{
    const { ctx, p } = await open({init: storeInit});
    await p.evaluate(() => { S.fridge = []; S.staples = []; makeWeek(); setTab('today'); });
    await p.waitForTimeout(200);
    const s2 = await p.evaluate(() => ({line: (document.querySelector('.sale-greet') || {}).textContent || '', fold: !!document.querySelector('[data-fold="sale"]'),
        banner: (document.querySelector('.sale-shop-day') || {}).textContent || '', firstSec: (document.querySelector('.list.shop .shop-sec') || {}).className || '',
        }));
    ok(/ハッピーマート/.test(s2.line) && /特売日/.test(s2.line) && /野菜/.test(s2.line), 'S2 今日の画面に特売日の1行 ' + JSON.stringify(s2));
    ok(!/まるやす/.test(s2.line), 'S2 特売日でない店は出ない');
    ok(s2.fold, 'S2 特売の欄がある');
    ok(/今日はハッピーマートの特売日/.test(s2.banner), 'S2 買い物メモに「今日は○○の特売日」 ' + JSON.stringify(s2.banner));
    ok(/sec-veg/.test(s2.firstSec) && /sale-first/.test(s2.firstSec), 'S2 特売日の売り場（野菜）が先頭 ' + s2.firstSec);
    ok(await p.evaluate(() => { const tr = document.querySelector('.tray'), ln = document.querySelector('#greet .sale-greet'); return !!tr && !!ln && !tr.contains(ln) && !document.querySelector('#greet .greet-tx'); }), 'S2 1行はあいさつの行（お膳の外・あいさつの代わり）（R97）');
    // S3 今日の特売を入れる
    const before = await p.evaluate(() => ({menu: menuIds().join(), week: JSON.stringify(S.week.days.map(x => x.id))}));
    await p.evaluate(() => { S.foldOpen = Object.assign({}, S.foldOpen, {sale: true}); render(); });
    await p.click('[data-act="sale-chip"][data-v="キャベツ"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => S.sale.items.length === 1 && S.sale.items[0].n === 'キャベツ' && S.sale.items[0].s === 'stA' && S.sale.items[0].d === TODAY && S.sale.items[0].u === TODAY), 'S3 チップで今日の特売に入る');
    ok(await p.evaluate(() => document.querySelector('[data-act="sale-chip"][data-v="キャベツ"]').getAttribute('aria-pressed') === 'true'), 'S3 チップが押された表示');
    await p.click('[data-act="sale-chip"][data-v="キャベツ"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => S.sale.items.length === 0), 'S3 もう一度押すと外れる');
    await p.click('[data-act="sale-chip"][data-v="キャベツ"]');
    await p.fill('#sale-name', '卵'); await p.fill('#sale-price', '1パック 198円'); await p.press('#sale-name', 'Enter'); await p.waitForTimeout(150);
    await p.fill('#sale-name', '  '); await p.press('#sale-name', 'Enter'); await p.waitForTimeout(100);
    const its = await p.evaluate(() => S.sale.items.map(x => [x.n, x.p]));
    ok(its.length === 2 && its.some(x => x[0] === '卵' && x[1] === '1パック 198円'), 'S3 自由入力と値段のメモ（空は入れない） ' + JSON.stringify(its));
    ok(await p.evaluate(() => /今日の特売|特売:/.test((document.querySelector('.sale-greet') || {}).textContent) && /キャベツ/.test(document.querySelector('.sale-greet').textContent)), 'S3 今日の画面の1行に特売の食材');
    // 買い物メモに特売の札（メモにある食材だけ）
    const tag = await p.evaluate(() => { const k = shoppingList().find(e => !e.extra && e.sec === 'veg'); if (!k) return null; saleData().items.push({id: 'tz', s: 'stA', sn: '', k: k.key, n: k.label, p: '88円', d: TODAY, u: TODAY}); render(); const row = [...document.querySelectorAll('.shop-row')].find(r => r.querySelector('[data-k]').dataset.k === k.key); const r = row && row.querySelector('.sale-tag') ? row.querySelector('.sale-tag').textContent : ''; S.sale.items = S.sale.items.filter(x => x.id !== 'tz'); render(); return r; });
    ok(tag === null || /特売/.test(tag) && /88円/.test(tag), 'S2 買い物メモの行に特売の札と値段 ' + JSON.stringify(tag));
    // S4 使う料理
    const s4 = await p.evaluate(() => { const f = saleSuggest(3); return {n: f.sugg.length, hits: f.sugg.map(x => x.hit), ids: f.sugg.map(x => x.r.id), shown: document.querySelectorAll('#sale-sec .match').length,
        use: f.sugg.every(x => x.hit.every(k => (swappedRecipe(x.r) || x.r).items.some(i => !i.opt && i.key === k))), ok: f.sugg.every(x => !isAvoided(x.r) && !S.hidden.includes(x.r.id))}; });
    ok(s4.n > 0 && s4.shown === s4.n && s4.use && s4.ok, 'S4 特売の食材を使う料理が出る ' + JSON.stringify(s4));
    // 料理を開いても献立は変わらない
    await p.click('#sale-sec .match [data-act="open"]'); await p.waitForTimeout(200); await p.evaluate(() => closeModal());
    const after = await p.evaluate(() => ({menu: menuIds().join(), week: JSON.stringify(S.week.days.map(x => x.id))}));
    ok(after.menu === before.menu && after.week === before.week, 'S4 特売を入れても今日の献立・1週間プランは変わらない');
    // 卵アレルギー: 卵を使う料理は出ない
    const alg = await p.evaluate(() => { S.sale.items = S.sale.items.filter(x => x.n === '卵'); const free = saleSuggest(20).sugg.length; S.settings.allergens = ['egg']; const f = saleSuggest(20); const r = {free, n: f.sugg.length, bad: f.sugg.filter(x => allergyConflict(x.r) || isAvoided(x.r)).map(x => x.r.name)}; S.settings.allergens = []; return r; });
    ok(alg.free > 0 && alg.bad.length === 0 && alg.n === 0, 'S4 アレルギー（卵）: 卵の特売で卵の料理を出さない ' + JSON.stringify(alg));
    const alg2 = await p.evaluate(() => { saleAddItem('キャベツ', '', true); S.settings.allergens = ['egg']; const f = saleSuggest(20); const r = {n: f.sugg.length, bad: f.sugg.filter(x => allergyConflict(x.r)).map(x => x.r.name)}; S.settings.allergens = []; return r; });
    ok(alg2.n > 0 && alg2.bad.length === 0, 'S4 アレルギーがあっても当たらない料理は出す ' + JSON.stringify(alg2));
    // 決めた献立は変わらない
    const dec = await p.evaluate(async () => { setTab('today'); const btn = document.querySelector('[data-act="decide"]'); if (btn) btn.click(); await new Promise(r => setTimeout(r, 300)); const c0 = JSON.stringify(S.cook && S.cook.ids);
        setTab('today'); saleAddItem('豚肉', '', true); saleAddItem('にんじん', '', true); render(); openCondSheet(); const cond = (document.querySelector('.sale-cond') || {}).textContent || ''; closeSheet();
        document.querySelector('[data-act="sale-goto"]').click(); await new Promise(r => setTimeout(r, 200));
        return {c0, c1: JSON.stringify(S.cook && S.cook.ids), cond, menu: menuIds().join() === (S.cook ? S.cook.ids.join() : '')}; });
    ok(dec.c0 && dec.c0 !== 'null' && dec.c0 === dec.c1 && dec.menu, 'S4 決めた献立は変わらない ' + JSON.stringify(dec));
    ok(/特売/.test(dec.cond), 'S4 条件のシートに特売の案内 ' + JSON.stringify(dec.cond));
    await shot(p, 'today-390-ja');
    // S3 期限: 特売の日の次の日まで残り、そのあとは消える
    const exp = await p.evaluate(() => { const y = addDays(TODAY, -1), y2 = addDays(TODAY, -2); S.sale.items = [{id: 'e1', s: 'stA', sn: '', k: 'キャベツ', n: 'キャベツ', p: '', d: y, u: y}, {id: 'e2', s: 'stA', sn: '', k: '大根', n: '大根', p: '', d: y2, u: y2}, {id: 'e3', s: 'stA', sn: '', k: 'なす', n: 'なす', p: '', d: addDays(TODAY, 1), u: addDays(TODAY, 1)}];
        const all = saleItemsAll().map(x => x.id), act = saleActive().map(x => x.id), use = saleForUse().map(x => x.id), line = saleGreetHtml(); return {all, act, use, lineHasYesterday: /キャベツ/.test(line), sugg: saleSuggest(3).sugg.length}; });
    ok(JSON.stringify(exp.all) === '["e1","e3"]', 'S3 特売の日の次の日が過ぎたら消える ' + JSON.stringify(exp));
    ok(exp.act.length === 0 && JSON.stringify(exp.use) === '["e1"]' && !exp.lineHasYesterday && exp.sugg > 0, 'S3 きのうの特売は「今日の特売」には出さず、次の朝は使う料理を出す（あしたの分はまだ） ' + JSON.stringify(exp));
    await ctx.close();
}
// ---- S5 提携データ ----
{
    const { ctx, p } = await open({init: storeInit});
    const feed = await p.evaluate(() => JSON.stringify({format: 'gohancho-flyer-feed', version: 1, store: {id: 'partner-001', name: 'ハッピーマート', area: {pref: '東京都', city: '練馬区'}}, valid: {from: TODAY, to: addDays(TODAY, 1)}, currency: 'JPY',
        sponsored: false, disclosure: 'ハッピーマートから提供された特売情報です', items: [{key: 'キャベツ', name: 'キャベツ', price: 98, unit: '1玉', category: 'veg'}, {name: '豚こま切れ肉', price: 128, unit: '100g', category: 'meat', sponsored: true}, {foo: 1}]}));
    await p.evaluate(() => { setTab('settings'); session.setOpen = {store: true}; render(); document.querySelector('.sale-feed').open = true; });
    const bad = {json: '{"format":"gohancho-flyer-feed",', arr: '[1,2]', shape: '{"format":"x","version":1}', html: '<html></html>', proto: '{"__proto__":{"polluted":1},"format":"gohancho-flyer-feed","version":1}', empty: ''};
    const snap0 = await p.evaluate(() => JSON.stringify(S.sale));
    for (const [k, v] of Object.entries(bad)){
        await p.fill('#sale-feed-text', v); await p.click('[data-act="sale-feed-go"]'); await p.waitForTimeout(100);
        ok(await p.evaluate(s => JSON.stringify(S.sale) === s, snap0), 'S5 読めないデータ（' + k + '）は読みこまない');
    }
    ok(await p.evaluate(() => ({}).polluted === undefined), 'S5 __proto__ で汚染されない');
    ok(await p.evaluate(() => importFlyerFeed('{"format":"gohancho-flyer-feed","version":1,"store":{"name":"a"},"valid":{"from":"2020-01-01","to":"2020-01-02"},"items":[{"name":"x"}]}', TODAY).err === 'old'), 'S5 期間切れは読みこまない');
    ok(await p.evaluate(() => importFlyerFeed('{"format":"gohancho-flyer-feed","version":1,"store":{"name":"a"},"valid":{"from":"2026-01-01","to":"2026-03-01"},"items":[{"name":"x"}]}').err === 'dates'), 'S5 14日より長い期間は読みこまない');
    ok(await p.evaluate(() => importFlyerFeed('x'.repeat(SALE_FEED_MAX + 1)).err === 'size'), 'S5 巨大なデータは読みこまない');
    await p.fill('#sale-feed-text', feed); await p.click('[data-act="sale-feed-go"]'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({items: S.sale.items.map(x => [x.n, x.s, x.src, !!x.pr, x.v]), stores: S.sale.stores.length, fid: S.sale.stores[0].fid}));
    ok(r.items.length === 2 && r.items.every(x => x[1] === 'stA' && x[2] === 'feed') && r.items.find(x => x[0] === '豚こま切れ肉')[3] && !r.items.find(x => x[0] === 'キャベツ')[3] && r.stores === 2 && r.fid === 'partner-001', 'S5 提携データを同じ店の特売に入れる ' + JSON.stringify(r));
    // 同じデータをもう一度: 重ならない
    await p.evaluate(() => { document.querySelector('.sale-feed').open = true; }); await p.fill('#sale-feed-text', feed); await p.click('[data-act="sale-feed-go"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => S.sale.items.length === 2), 'S5 同じデータを2回読んでも重ならない');
    await p.evaluate(() => { setTab('today'); S.foldOpen = Object.assign({}, S.foldOpen, {sale: true}); render(); });
    const lab = await p.evaluate(() => ({pr: [...document.querySelectorAll('#sale-sec .sale-row')].map(r => r.textContent.replace(/\s+/g, ' ')), disc: [...document.querySelectorAll('#sale-sec .sale-disc')].map(x => x.textContent)}));
    ok(lab.pr.some(x => /豚こま切れ肉PR/.test(x)) && lab.pr.some(x => /キャベツ提携/.test(x)) && lab.pr.some(x => /98/.test(x)), 'S5 「PR」「提携」の札と値段 ' + JSON.stringify(lab));
    ok(lab.disc.some(x => /PR/.test(x) && /提供された特売情報/.test(x)), 'S5 表示文（広告であること）を出す');
    // R98: 提携の「豚こま切れ肉 ¥128 PR」の値段・札は、買い物メモの「豚バラ薄切り肉」には付けない（付けるなら「豚肉の特売」と分けて出す）
    const r98 = await p.evaluate(() => { const mk = label => shopRowsHtml([{key: '豚肉', label, qty: [], dishes: ['x'], sec: 'meat', alt: ''}], new Set());
        const div = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' '); };
        return {bara: div(mk('豚バラ薄切り肉')), koma: div(mk('豚こま切れ肉')), cab: div(shopRowsHtml([{key: 'キャベツ', label: 'キャベツ', qty: [], dishes: ['x'], sec: 'veg', alt: ''}], new Set()))}; });
    ok(!/128|PR/.test(r98.bara) && /豚肉の特売/.test(r98.bara), 'R98 ちがう部位（豚バラ）には値段・PR を付けず「豚肉の特売」 ' + JSON.stringify(r98.bara));
    ok(/128/.test(r98.koma) && /PR/.test(r98.koma), 'R98 同じ品名（豚こま切れ肉）には値段と PR ' + JSON.stringify(r98.koma));
    ok(/98/.test(r98.cab) && /提携/.test(r98.cab), 'R98 キャベツはキャベツに付く ' + JSON.stringify(r98.cab));
    // 純粋な関数: 引数を変えない
    ok(await p.evaluate(() => { const s0 = {stores: [], items: []}, f = importFlyerFeed({format: 'gohancho-flyer-feed', version: 1, store: {id: 'z', name: 'Z'}, valid: {from: TODAY, to: TODAY}, items: [{name: 'x', sponsored: true}]}).feed; const m = mergeFlyerFeed(s0, f, p => p + '1'); return s0.items.length === 0 && s0.stores.length === 0 && m.n === 1 && m.sale.items[0].pr === true && m.sale.stores[0].fid === 'z'; }), 'S5 mergeFlyerFeed は引数を変えない');
    await shot(p, 'feed-390-ja');
    await ctx.close();
}
// ---- S6 お知らせ ----
{
    const { ctx, p } = await open({init: storeInit, native: true});
    const n0 = await p.evaluate(() => notifBuild(new Date(0)).filter(n => n.id >= NOTIFY_SALE_ID && n.id < NOTIFY_SALE_ID + 7).length);
    ok(n0 === 0, 'S6 はじめはオフ');
    await p.evaluate(() => { setTab('settings'); session.setOpen = {store: true}; render(); });
    await p.click('[data-act="sale-remind"][data-v="8"]'); await p.waitForTimeout(300);
    const n1 = await p.evaluate(() => ({r: S.sale.remind, list: notifBuild(new Date(0)).filter(n => n.id >= NOTIFY_SALE_ID && n.id < NOTIFY_SALE_ID + 7).map(n => [n.title, n.schedule.at.getHours()]), all: NOTIFY_ALL.length}));
    ok(n1.r === 8 && n1.list.length === 2 && n1.list.every(x => x[1] === 8 && /特売日/.test(x[0])) && n1.all <= 64, 'S6 特売日の朝に予約（7日で2回） ' + JSON.stringify(n1));
    await p.click('[data-act="sale-remind"][data-v="off"]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => S.sale.remind === undefined), 'S6 オフにできる');
    await ctx.close();
}
// ---- S7 幅・言語・通信 ----
for (const [lang, w] of [['ja', 195], ['en', 390], ['ar', 390], ['en', 195], ['ar', 195]]){
    const { ctx, p } = await open({init: storeInit, lang, w});
    await p.evaluate(() => { S.fridge = []; makeWeek(); saleData().items.push({id: 'w1', s: 'stA', sn: '', k: 'キャベツ', n: labelOf('キャベツ'), p: '98円', d: TODAY, u: TODAY}, {id: 'w2', s: 'stA', sn: 'ハッピーマート', k: 'x', n: 'Pork belly slices long name for wrapping test', p: '', d: TODAY, u: addDays(TODAY, 1), src: 'feed', pr: true});
        S.foldOpen = Object.assign({}, S.foldOpen, {sale: true, week: true}); setTab('today'); });
    await p.waitForTimeout(250);
    ok(await noOverflow(p), `S7 ${lang} ${w}px 今日の画面で横にはみ出さない`);
    const txt = await p.evaluate(() => (document.querySelector('[data-fold="sale"]') || {}).textContent || '');
    if (lang !== 'ja') ok(!/[ぁ-ん]/.test(txt.replace(/キャベツ|ハッピーマート|まるやす/g, '')), `S7 ${lang} 特売の欄に日本語が残らない: ` + (txt.match(/[^\s]*[ぁ-ん][^\s]*/g) || []).slice(0, 4).join(' '));
    if (lang === 'ar') ok(await p.evaluate(() => document.documentElement.dir === 'rtl'), 'S7 ar は右から左');
    await shot(p, `today-${w}-${lang}`);
    await p.evaluate(() => { setTab('settings'); session.setOpen = {store: true}; render(); });
    await p.click('[data-act="sale-edit"]'); await p.waitForTimeout(150);
    await p.evaluate(() => { document.querySelector('.sale-feed').open = true; });
    ok(await noOverflow(p), `S7 ${lang} ${w}px 設定で横にはみ出さない`);
    const st = await p.evaluate(() => (document.querySelector('#set-store') || {}).textContent || '');
    if (lang !== 'ja') ok(!/[ぁ-ん]/.test(st.replace(/ハッピーマート|まるやす|東京都|練馬区/g, '')), `S7 ${lang} 設定に日本語が残らない: ` + (st.match(/[^\s]*[ぁ-ん][^\s]*/g) || []).slice(0, 4).join(' '));
    await shot(p, `settings-${w}-${lang}`);
    await ctx.close();
}
ok(!foreign.some(u => !KNOWN.test(u)), 'S7 ほかのサイトへの通信なし: ' + foreign.filter(u => !KNOWN.test(u)).slice(0, 3).join(' | '));
ok(!foreign.some(u => /flyer\.example|ハッピー|%E3%83%8F%E3%83%83%E3%83%94|176-0001|練馬/.test(u)), 'S7 店の URL・名前・郵便番号を送らない');
// ---- S9 チラシの写真から読み取る（文字から品名と値段を拾う純粋な関数・iPhone アプリのプラグインがあるときだけのボタン） ----
{
    const FLY = [
        ['国産 きゅうり 3本 98円', 'きゅうり', 98], ['豚こま切れ 100g当り 128円（税込138円）', '豚肉', 128], ['キャベツ 1玉 ¥158', 'キャベツ', 158], ['北海道産 じゃがいも 1袋 198円', 'じゃがいも', 198],
        ['鶏もも肉 100g 88円', '鶏肉', 88], ['たまねぎ 3個入 ¥128（税込138）', '玉ねぎ', 128], ['生鮮 ブロッコリー 1株 148円 税込159円', 'ブロッコリー', 148], ['牛乳 1000ml 178円', '牛乳', 178],
        ['卵 Lサイズ 10個入 1パック 213円 税込230円', '卵', 213], ['トマト 1個 78円', 'トマト', 78], ['ピーマン 5個入 98円', 'ピーマン', 98], ['にんじん 3本 ¥99', 'にんじん', 99],
        ['白菜 1/2カット 128円', '白菜', 128], ['しめじ 1袋 88円', 'しめじ', 88], ['もやし 1袋 19円', 'もやし', 19], ['生さけ 切身 1切 158円', '鮭', 158], ['なす 3本 158円', 'なす', 158],
        ['長ねぎ 1本 68円', '長ねぎ', 68], ['ほうれん草 1束 138円', 'ほうれん草', 138], ['合いびき肉 100g当たり 108円', '合いびき肉', 108], ['さば 1尾 298円', 'さば', 298],
        ['牛肩ロース 100g 398円(税込429円)', '牛肉', 398], ['１０％ＯＦＦ 豆腐 ３個パック ９８円', '豆腐', 98], ['大根 1本 ¥1,080', '大根', 1080],
    ];
    const { ctx, p } = await open({init: storeInit});
    const one = await p.evaluate(F => F.map(([line, key, price]) => { const r = parseFlyerText([line]); const c = r.find(x => x.key === key); return {line, key, price, got: c ? c.price : 'none', n: r.length}; }), FLY);
    const bad = one.filter(x => x.got !== x.price);
    ok(FLY.length >= 20 && !bad.length, `S9 チラシ風の文字 ${FLY.length}件で品名と値段を拾う: ` + JSON.stringify(bad));
    const multi = await p.evaluate(() => ({
        split: parseFlyerText(['大根', '1本 98円']).map(x => [x.key, x.price]),
        tax: parseFlyerText(['豚こま切れ 100g当り 128円（税込138円）'])[0].priceText,
        noPrice: parseFlyerText(['お一人様1パック限り', 'ポイント5倍デー', '50円引', '毎週火曜は野菜の日', '10%OFF']).length,
        noise: parseFlyerText('').length + parseFlyerText(null).length,
        noPriceItem: parseFlyerText(['きゅうり']).map(x => [x.key, x.price]),
        discount: parseFlyerText(['なす 30円引 3本 128円']).map(x => x.price),
        pure: (() => { const a = ['キャベツ 98円']; const b = JSON.stringify(a), s0 = JSON.stringify(S); parseFlyerText(a); return JSON.stringify(a) === b && JSON.stringify(S) === s0; })() }));
    ok(JSON.stringify(multi.split) === '[["大根",98]]', 'S9 品名の行と値段の行が分かれていても拾う ' + JSON.stringify(multi.split));
    ok(/128円/.test(multi.tax) && /税込138円/.test(multi.tax), 'S9 本体価格と税込を両方出す ' + multi.tax);
    ok(multi.noPrice === 0 && multi.noise === 0, 'S9 食材のない行（限り・ポイント・円引・OFF）は候補にしない');
    ok(JSON.stringify(multi.noPriceItem) === '[["きゅうり",null]]' && JSON.stringify(multi.discount) === '[128]', 'S9 値段がなければ値段なし・「円引」は値段にしない ' + JSON.stringify(multi));
    ok(multi.pure, 'S9 parseFlyerText は引数・データを変えない');
    // ウェブ版（プラグインなし）: ボタンを出さず「iPhone アプリで使えます」
    await p.evaluate(() => { S.foldOpen = Object.assign({}, S.foldOpen, {sale: true}); setTab('today'); });
    ok(await p.evaluate(() => !document.querySelector('#sale-cam') && !!document.querySelector('.sale-ocr-off')), 'S9 ウェブ版ではボタンを出さず、iPhone アプリで使えると出す');
    await ctx.close();
}
{
    // iPhone アプリ（FlyerText のかわりの部品）: 撮る → 候補（自動では入れない）→ 選んで入れる。写真は保存しない
    const { ctx, p } = await open({init: storeInit});
    await p.evaluate(() => { window.__ocr = 0; window.Capacitor = window.Capacitor || {}; window.Capacitor.Plugins = Object.assign({}, window.Capacitor.Plugins, {FlyerText: {recognize: async x => { window.__ocr++; window.__img = typeof x.image === 'string' && x.image.length > 10; return {lines: [{text: '特売 国産きゅうり 3本'}, {text: '98円'}, {text: 'キャベツ 1玉 ¥158'}, {text: 'ポイント5倍'}]}; }}});
        S.foldOpen = Object.assign({}, S.foldOpen, {sale: true}); setTab('today'); });
    ok(await p.evaluate(() => !!document.querySelector('#sale-cam') && !!document.querySelector('#sale-lib')), 'S9 iPhone アプリでは「チラシを撮る」「写真を選ぶ」');
    const idb0 = await p.evaluate(() => Object.keys(localStorage).join());
    // 描き直しと重なって選んだ入力欄が入れかわると change が届かないことがある（負荷の高いとき）。届くまで3回まで選び直す
    for (let k = 0; k < 3; k++){
        await p.waitForTimeout(300);
        await p.setInputFiles('#sale-lib', new URL('../../gohancho/icon-192.png', import.meta.url).pathname);
        const got = await p.waitForFunction(() => session.saleOcr && session.saleOcr.phase === 'review', null, {timeout: 20000}).then(() => true, () => false);
        if (got || await p.evaluate(() => !!session.saleOcr)) break;
    }
    await p.waitForFunction(() => session.saleOcr && session.saleOcr.phase === 'review', null, {timeout: 40000}).catch(() => {});
    const r = await p.evaluate(() => ({n: (S.sale.items || []).length, cands: session.saleOcr && session.saleOcr.cands.map(c => c.name + ' ' + c.priceText), chips: document.querySelectorAll('[data-act="sale-ocr-tog"]').length, warn: (document.querySelector('.sale-ocr .warn') || {}).textContent || '', calls: window.__ocr, img: window.__img, phase: session.saleOcr && session.saleOcr.phase}));
    ok(r.n === 0 && r.chips === 2 && r.calls === 1 && r.img && /誤り/.test(r.warn), 'S9 読み取った候補を出す（自動では入れない・誤りがあり得ると書く） ' + JSON.stringify(r));
    await p.click('[data-act="sale-ocr-tog"][data-i="0"]');
    await p.click('[data-act="sale-ocr-ok"]'); await p.waitForTimeout(150);
    const r2 = await p.evaluate(() => ({items: S.sale.items.map(x => [x.n, x.p, x.s]), ocr: session.saleOcr}));
    ok(r2.items.length === 1 && r2.items[0][0] === 'きゅうり' && /98円/.test(r2.items[0][1]) && r2.items[0][2] === 'stA' && !r2.ocr, 'S9 選んだ品だけ特売に入る ' + JSON.stringify(r2));
    ok(await p.evaluate(k => Object.keys(localStorage).join() === k && !/base64|data:image/.test(localStorage.getItem('gohancho.v1')), idb0), 'S9 写真は保存しない');
    await shot(p, 'ocr-390-ja');
    await ctx.close();
}
// ---- R97・R103 特売の1行は最初の画面に見え、右へはみ出さず（› と最初の品名が見える）、お膳の詰め方を崩さない（360/375/390/430/195 × 文字3段階 × 家族あり/なし × 特売あり） ----
{
    const fam = [{id: 'f1', name: 'はは', role: 'adult', avoid: ['えび'], allergy: ['えび'], mild: false}, {id: 'f2', name: 'こ', role: 'child', avoid: [], allergy: [], mild: true}];
    const bad = [];
    for (const [w, h] of [[360, 740], [375, 667], [390, 844], [430, 932], [195, 422]]) for (const ts of [0, 1, 2]) for (const withFam of [true, false]){
        const init = Object.assign({}, storeInit, {family: withFam ? fam : [], sale: Object.assign({}, storeInit.sale, {items: [{id: 'g1', s: 'stA', sn: '', k: 'キャベツ', n: 'キャベツ', p: '98円', d: DAY[0], u: DAY[0]}, {id: 'g2', s: 'stA', sn: '', k: '豚肉', n: '豚こま切れ肉', p: '', d: DAY[0], u: DAY[0]}]})});
        const ctx = await b.newContext({ viewport: {width: w, height: h}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', hasTouch: true }); await ctx.route(KNOWN, r => r.abort());
        await ctx.addInitScript(rngScript(seedFor('sale-r97', w + '-' + ts)));
        const p = await ctx.newPage(); p.on('pageerror', e => errs.push('r97: ' + e.message));
        await p.addInitScript(([init, ts]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: new Date().toISOString().slice(0, 10)}, init, {settings: Object.assign({country: 'JP', dishCount: 3, uiLang: 'ja'}, ts ? {textSize: ts} : {})}))); } }, [init, ts]);
        await p.goto(URL_); await ready(p); await p.waitForTimeout(400);
        const m = await p.evaluate(() => {
            const fl = (() => { let f = innerHeight; document.querySelectorAll('nav.tabs, .actionbar').forEach(e => { const r = e.getBoundingClientRect(); if (r.height && /fixed|sticky/.test(getComputedStyle(e).position) && r.top > innerHeight * .4 && r.top < f) f = r.top; }); return f; })();
            const g = document.querySelector('.sale-greet'), r = g && g.getBoundingClientRect();
            const vis = !!r && r.height > 0 && r.top >= 0 && r.bottom <= fl + .5 && getComputedStyle(g).visibility !== 'hidden';
            const parts = [...document.querySelectorAll('.tray .tg-row:first-child .spot .vessel, .tray .tg-row:first-child .spot .nm')].map(e => e.getBoundingClientRect());
            const rowIn = parts.every(x => x.bottom <= fl + .5);
            const go = g && g.querySelector('.sale-greet-go'), gr = go && go.getBoundingClientRect(), tx = g && g.querySelector('.sale-greet-tx');
            const inX = !!r && r.left >= -.5 && r.right <= innerWidth + .5, goVis = !!gr && gr.width > 0 && gr.left >= -.5 && gr.right <= Math.min(innerWidth, r.right) + .5;
            let nameVis = false; try{ const tn = tx.firstChild, i = tn.textContent.indexOf('キャベツ'); const rg = document.createRange(); rg.setStart(tn, 0); rg.setEnd(tn, i + 4); nameVis = i >= 0 && rg.getBoundingClientRect().right <= tx.getBoundingClientRect().right + .5; }catch(e){}
            return {vis, inX, goVis, nameVis, right: r && Math.round(r.right), top: r && Math.round(r.top), bottom: r && Math.round(r.bottom), fl: Math.round(fl), rowIn, over: document.documentElement.scrollWidth > innerWidth + 1, body: document.body.className};
        });
        if (!m.vis || !m.rowIn || m.over || !m.inX || !m.goVis || !m.nameVis) bad.push([w, h, ts, withFam, m]);
        if ((w === 195 || w === 375) && !withFam || w === 390 && ts === 0) await shot(p, `r103-${w}-ts${ts}-${withFam ? 'fam' : 'nofam'}`);
        await ctx.close();
    }
    ok(!bad.length, 'R97・R103 特売の1行が最初の画面に見え、右へはみ出さず › と品名が見え、お膳の上の段もタブ・帯の上（30通り） ' + JSON.stringify(bad));
}
// ---- R107 特売の日でも、お膳の器は特売のない日とほぼ同じ大きさ（360/390/430 × 文字3段階・家族なし。同じ献立で特売あり → なしを比べる） ----
// 第25回: R103 で特売の1行が「食べたいもの」の下の行に回り、文字が大きいと器が 107→86・94→60（360）、113→95（390）に小さくなっていた
{
    const bad = [], rows = [];
    for (const [w, h] of [[360, 800], [390, 844], [430, 932]]) for (const ts of [0, 1, 2]){
        const init = Object.assign({}, storeInit, {family: [], sale: Object.assign({}, storeInit.sale, {items: [{id: 'g1', s: 'stA', sn: '', k: 'キャベツ', n: 'キャベツ', p: '98円', d: DAY[0], u: DAY[0]}, {id: 'g2', s: 'stA', sn: '', k: '豚肉', n: '豚こま切れ肉', p: '', d: DAY[0], u: DAY[0]}, {id: 'g3', s: 'stA', sn: '', k: 'にんじん', n: 'にんじん', p: '', d: DAY[0], u: DAY[0]}]})});
        const ctx = await b.newContext({ viewport: {width: w, height: h}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', hasTouch: true }); await ctx.route(KNOWN, r => r.abort());
        await ctx.addInitScript(rngScript(seedFor('sale-r107', w + '-' + ts)));
        const p = await ctx.newPage(); p.on('pageerror', e => errs.push('r107: ' + e.message));
        await p.addInitScript(([init, ts]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: new Date().toISOString().slice(0, 10)}, init, {settings: Object.assign({country: 'JP', dishCount: 3, uiLang: 'ja'}, ts ? {textSize: ts} : {})}))); } }, [init, ts]);
        await p.goto(URL_); await ready(p); await p.waitForTimeout(400);
        const meas = () => p.evaluate(() => { const v = [...document.querySelectorAll('.tray .tg-row:first-child .spot .vessel')].map(e => e.getBoundingClientRect().width), g = document.querySelector('.sale-greet'), lt = document.querySelector('#greet .req-btn.lite');
            const tx = g && g.querySelector('.sale-greet-tx'); let nameVis = !g; try{ const tn = tx.firstChild, i = tn.textContent.indexOf('キャベツ'); const rg = document.createRange(); rg.setStart(tn, 0); rg.setEnd(tn, i + 4); nameVis = i >= 0 && rg.getBoundingClientRect().right <= tx.getBoundingClientRect().right + .5; }catch(e){}
            const r = g && g.getBoundingClientRect(), lr = lt && lt.getBoundingClientRect();
            return {vs: Math.round(Math.max(...v)), sale: !!g, nameVis, inX: !r || r.left >= -.5 && r.right <= innerWidth + .5, over: document.documentElement.scrollWidth > innerWidth + 1,
                lite: lt ? {name: lt.textContent.trim(), w: Math.round(lr.width), h: Math.round(lr.height), vis: lr.width > 0} : null}; });
        const a = await meas();
        await p.evaluate(() => { S.sale.items = []; S.sale.stores.forEach(st => { st.days = []; }); TRAY_FIT.state = null; render(); });   // 前の詰め方を引きつがない（開き直したときと同じ） await p.waitForTimeout(400);
        const n = await meas();
        rows.push(`${w}/ts${ts}: ${n.vs}→${a.vs}`);
        // 器の差は 6px まで（前は −21〜−34px）。特売の1行は右へはみ出さず品名が見える（R103）。「食べたいもの」は押せる大きさ（44px）で、名前は読み上げに残る
        if (!a.sale || n.sale || a.vs < n.vs - 6 || !a.nameVis || !a.inX || a.over || !a.lite || !a.lite.vis || a.lite.name !== '食べたいもの' || a.lite.h < 36 || a.lite.w < 36) bad.push([w, ts, {sale: a, normal: n}]);
        await ctx.close();
    }
    console.log('R107 器（特売なし→あり）: ' + rows.join(' / '));
    ok(!bad.length, 'R107 特売の日でも器が小さくならない（差 6px まで）・特売の1行は画面の中で品名が見える（9通り） ' + JSON.stringify(bad));
}
// ---- S8 バックアップ ----
{
    const { ctx, p } = await open({init: storeInit});
    const r = await p.evaluate(async () => {
        saleAddItem('キャベツ', '98円', true); S.sale.remind = 8;
        const json = backupJson(), parsed = JSON.parse(json), before = JSON.stringify(normalizeState(JSON.parse(json)).sale);
        delete S.sale; setTab('settings');
        const asked = askImport(json, 'file'); document.querySelector('[data-act="import-yes"]').click(); await new Promise(r => setTimeout(r, 600));
        return {inJson: !!(parsed.sale && parsed.sale.stores.length === 2 && parsed.sale.items.length === 1), asked, same: JSON.stringify(S.sale) === before, remind: S.sale && S.sale.remind};
    });
    ok(r.inJson && r.asked && r.same && r.remind === 8, 'S8 書き出し・読み込みに店と特売が入る ' + JSON.stringify(r));
    const junk = await p.evaluate(() => { const o = {}; [{sale: 3}, {sale: []}, {sale: {stores: 'x', items: [null, {n: 'a', d: 'bad', u: 'x'}]}}, {sale: {stores: [{name: '<x>', days: [{w: 9, c: 'veg'}, {w: 1, c: 'zz'}, {w: 2, c: 'veg'}], url: 'javascript:1'}, {}, {name: 'b'}, {name: 'c'}, {name: 'd'}], items: [], remind: 99}}].forEach((d, i) => { o[i] = normalizeState(d).sale || null; }); return o; });
    ok(junk[0] === null && junk[1] === null && junk[2].stores.length === 0 && junk[2].items.length === 0, 'S8 壊れた S.sale は捨てる ' + JSON.stringify(junk));
    ok(junk[3].stores.length === 3 && junk[3].stores[0].name === 'x' && junk[3].stores[0].days.length === 1 && junk[3].stores[0].url === '' && junk[3].remind === undefined, 'S8 店は3つまで・正しい特売日だけ・URL は http(s) だけ ' + JSON.stringify(junk[3]));
    ok(await p.evaluate(() => { try{ S.sale = {stores: [{id: 'a', name: 'n', days: []}], items: [{id: 'i', s: 'a', n: 'x', k: 'x', d: TODAY, u: TODAY}]}; setTab('today'); render(); setTab('settings'); render(); return true; }catch(e){ return String(e); } }) === true, 'S8 足りない項目があっても描ける');
    await ctx.close();
}
ok(!errs.length, 'エラーなし: ' + errs.slice(0, 3).join(' | '));
await b.close();
console.log(`sale: ${checks} checks, ${fails ? fails + ' FAILS' : 'all ok'}`);
process.exit(fails ? 1 : 0);
