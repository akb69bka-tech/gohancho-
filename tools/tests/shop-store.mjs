#!/usr/bin/env node
// 店内で使う買い物メモの回帰テスト（Playwright。使い方: node tools/tests/shop-store.mjs [http://localhost:8793/]）
//  390px・片手: 行とチェックの大きさ(44px以上)、行全体タップ、チェックの取り消し、買ったものは「買った（n）」に沈む
//  自分で足した品（重複は足さない・消せる・送る文面に入る・冷蔵庫には入れない）、買い忘れ確認、買い物モード(wakeLock)、オフライン、暗い画面・文字拡大
//  売り場: 加工品・缶・ジュースが「野菜」に入らない。献立は変わらない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready, SEED, rngScript, seedFor } = require('../lib/pw.cjs'); let seedN = 0;   // 乱数は SEED から（失敗したら表示の SEED=… を付けて実行すると同じ献立で再現する）
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const errs = [];
async function open(cc, opts = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: opts.dark ? 'dark' : 'light', hasTouch: true }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('shop-store', String(++seedN))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(([cc, wake]) => {
        if (wake){ window.__wl = {req:0, rel:0}; Object.defineProperty(navigator, 'wakeLock', {configurable:true, value:{request: async () => { __wl.req++; const l = {addEventListener(){}, release: async () => { __wl.rel++; }}; return l; }}}); }
        if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({foldOpen:{upg:true,tw:true,week:true}, onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3}})); } }, [cc, !!opts.wake]);
    await p.goto(URL_); await ready(p); await p.evaluate(() => { hasPro = () => true; });
    await p.evaluate(() => { S.fridge = []; S.staples = []; makeWeek(); render(); }); await p.waitForTimeout(300);
    return { ctx, p };
}
// 1) 大きさ・行全体タップ・取り消し・沈む
{
    const { ctx, p } = await open('JP', {wake:true});
    const g = await p.evaluate(() => { const rs = [...document.querySelectorAll('.shop-row')], r = rs[0], i = r.querySelector('input'); const a = r.getBoundingClientRect(), c = i.getBoundingClientRect(); return {n: rs.length, h: a.height, w: a.width, cw: c.width, ch: c.height, tag: r.tagName}; });
    ok(g.n > 3, 'rows exist'); ok(g.h >= 44 && g.cw >= 24 && g.ch >= 24, 'row/check size ' + JSON.stringify(g)); ok(g.tag === 'LABEL', 'whole row is a label');
    const ids0 = await p.evaluate(() => JSON.stringify(S.week.days.map(x => x.id)));
    const first = await p.evaluate(() => document.querySelector('.shop-row .nm').textContent);
    await p.locator('.shop-row').first().locator('.for').click({force:true});   // 行のはしをタップしてもチェックされる
    await p.waitForTimeout(200);
    ok(await p.evaluate(() => S.shopDone.keys.length) === 1, 'tap anywhere on row checks');
    ok(await p.evaluate(() => !!document.querySelector('.shop-sec.done') && /1/.test(document.querySelector('.shop-sec.done').textContent)), 'done header with count');
    ok(await p.evaluate(() => !!document.querySelector('.toast [data-act="toast-undo"]')), 'undo toast after check');
    await p.click('[data-act="toast-undo"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => S.shopDone.keys.length) === 0, 'undo unchecks');
    ok(await p.evaluate(() => JSON.stringify(S.week.days.map(x => x.id))) === ids0, 'plan unchanged by checking');
    // 2) 自分で足す
    await p.fill('#shop-add-input', '  トイレットペーパー '); await p.press('#shop-add-input', 'Enter'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => shoppingList().some(e => e.label === 'トイレットペーパー' && e.extra && e.sec === 'other')), 'extra added to その他');
    await p.fill('#shop-add-input', 'トイレットペーパー'); await p.press('#shop-add-input', 'Enter'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => shoppingList().filter(e => e.label === 'トイレットペーパー').length) === 1, 'no duplicate extra');
    const dupName = await p.evaluate(() => shoppingList().find(e => !e.extra).label);
    await p.fill('#shop-add-input', dupName); await p.press('#shop-add-input', 'Enter'); await p.waitForTimeout(200);
    ok(await p.evaluate(n => shoppingList().filter(e => e.label === n).length, dupName) === 1, 'no duplicate of plan item');
    ok(await p.evaluate(() => weekShareText().includes('トイレットペーパー')), 'extra in share text');
    // 買い忘れ確認
    await p.evaluate(() => { const k = shoppingList().find(e => e.extra).key; shopDoneSet(); S.shopDone.keys.push(k); const f = shoppingList().find(e => !e.extra).key; S.shopDone.keys.push(f); save(); render(); });
    await p.click('[data-act="shop-to-fridge"]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => !!document.querySelector('.sheet-shopdone .shop-left li')), 'confirm sheet lists unbought');
    const fr0 = await p.evaluate(() => S.fridge.length);
    await p.click('.sheet-shopdone [data-act="sheet-close"]'); await p.waitForTimeout(100);
    ok(await p.evaluate(() => S.fridge.length) === fr0, 'back to shopping changes nothing');
    await p.click('[data-act="shop-to-fridge"]'); await p.click('[data-act="shop-to-fridge-go"]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => S.fridge.length) === fr0 + 1 && await p.evaluate(() => !S.fridge.includes('free')), 'only checked plan item goes to fridge, not the extra');
    ok(await p.evaluate(() => shoppingList().some(e => e.extra && shopDoneSet().has(e.key))), 'extra stays');
    await p.click('.shop-row.extra [data-act="shop-extra-rm"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => !shoppingList().some(e => e.extra)), 'extra removable');
    ok(await p.evaluate(() => JSON.stringify(S.week.days.map(x => x.id))) === ids0, 'plan unchanged by extras/fridge');
    // 買い物モード
    await p.click('[data-act="shop-mode"]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __wl.req) >= 1 && await p.evaluate(() => !!document.querySelector('.list.shop.big')), 'shop mode requests wakeLock + big rows');
    await p.evaluate(() => setTab('log')); await p.waitForTimeout(200);
    ok(await p.evaluate(() => __wl.rel) >= 1, 'wakeLock released when leaving');
    // オフライン
    await p.evaluate(() => setTab('today')); await p.waitForTimeout(200);
    await ctx.setOffline(true);
    await p.fill('#shop-add-input', 'ティッシュ'); await p.press('#shop-add-input', 'Enter'); await p.waitForTimeout(150);
    await p.locator('.shop-row').first().click({force:true}); await p.waitForTimeout(150);
    ok(await p.evaluate(() => shoppingList().some(e => e.label === 'ティッシュ') && S.shopDone.keys.length > 0), 'works offline');
    await ctx.setOffline(false);
    // 暗い画面・文字拡大で横にはみ出さない
    await p.evaluate(() => { document.documentElement.style.fontSize = '24px'; }); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal scroll at large text');
    await ctx.close();
}
// 3) 売り場: 加工品は野菜に入らない
{
    const { ctx, p } = await open('US');
    const r = await p.evaluate(() => ({ soup: shopSec({key:'cream of mushroom', en:'cream of mushroom', label:'Condensed cream of mushroom soup'}), juice: shopSec({key:'orange', en:'orange', label:'Jugo de naranja'}), peas: shopSec({key:'peas', en:'peas', label:'Frozen peas'}), carrot: shopSec({key:'carrot', en:'carrot', label:'Carrot'}) }));
    ok(r.soup === 'other' && r.juice === 'other' && r.peas === 'other' && r.carrot === 'veg', 'shopSec ' + JSON.stringify(r));
    await ctx.close();
}
await b.close();
if (errs.length){ fails++; console.log('errors:', errs.slice(0, 5)); }
console.log(fails ? 'FAILED ' + fails : 'shop-store OK');
process.exit(fails ? 1 : 0);
