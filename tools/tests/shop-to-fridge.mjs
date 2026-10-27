#!/usr/bin/env node
// 「買ったものを冷蔵庫に入れる」の回帰テスト（Playwright。使い方: node tools/tests/shop-to-fridge.mjs [http://localhost:8795/]）
//  全21か国: 1週間プランを作り、買い物メモの全行にチェック → 冷蔵庫に入れる → 買い物メモからは消える（食材名として読み取りがずれるものは、チェックしたまま残る）、プランの料理は変わらず、元に戻すで完全に戻る
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
for (const cc of CCS){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(cc => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({foldOpen:{upg:true,tw:true,week:true}, onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3}})); } }, cc);
    await p.goto(URL_); await p.waitForTimeout(900); await p.evaluate(() => { hasPro = () => true; });
    const r = await p.evaluate(() => {
        S.fridge = []; S.staples = []; makeWeek && 0;
        return 1;
    }).catch(() => 0);
    const res = await p.evaluate(() => {
        const mk = document.querySelector('[data-act="make-week"]'); return !!mk;
    });
    await p.evaluate(() => { setTab('today'); });
    await p.evaluate(() => { const b = document.querySelector('[data-act="make-week"]'); b && b.click(); });
    await p.waitForTimeout(600);
    const o = await p.evaluate(() => {
        const ids0 = S.week.days.map(x => x.id).join(), list0 = shoppingList(), n0 = list0.length;
        list0.forEach(e => { shopDoneSet(); S.shopDone.keys.push(e.key); }); save(); render();
        const btn = document.querySelector('[data-act="shop-to-fridge"]'); if (!btn) return {err:'no button', n0};
        btn.click();
        const left = shoppingList().map(e => e.key + "/" + e.label).join(); const after = shoppingList().length, leftDone = shoppingList().filter(e => shopDoneSet().has(e.key)).length, fr = S.fridge.length, ids1 = S.week.days.map(x => x.id).join();
        document.querySelector('[data-act="toast-undo"]').click();
        return {n0, left, after, leftDone, fr, same: ids0 === ids1, undoFridge: S.fridge.length, undoList: shoppingList().length, undoDone: shopDoneSet().size};
    });
    ok(!o.err && o.n0 > 0, cc + ' ' + JSON.stringify(o));
    if (!o.err){ ok(o.after === o.leftDone, cc + " list not empty after: " + o.after + " " + (o.left||"")); ok(o.same, cc + ' plan changed'); ok(o.undoFridge === 0 && o.undoList === o.n0 && o.undoDone === o.n0, cc + ' undo ' + JSON.stringify(o)); }
    ok(!errs.length, cc + ' errors ' + errs.join('|'));
    await ctx.close();
}
await b.close(); console.log(fails ? 'FAILS ' + fails : 'all ok'); process.exit(fails ? 1 : 0);
