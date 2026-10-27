#!/usr/bin/env node
// 「冷蔵庫の食材と今日の献立」の回帰テスト（Playwright。使い方: node tools/tests/fridge-use.mjs [http://localhost:8795/]）
//  全21か国: 冷蔵庫に食材を入れる → 使う/使わないの分類が献立の材料と一致 → 提案の「入れる」で、今日のほかの料理が1つも変わらず1品だけ増える（または空き枠に入る）→ 元に戻すで完全に戻る
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
const b = await chromium.launch(LAUNCH);
let fails = 0, shown = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
for (const cc of CCS){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(cc => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3}})); } }, cc);
    await p.goto(URL_); await ready(p);
    const o = await p.evaluate(() => {
        setTab('today'); ensureMenu();
        const m = session.menu, inMenu = new Set(); m.items.forEach(x => x.r && x.r.items.forEach(i => { if (!i.opt) inMenu.add(i.key); }));
        // 献立で使う材料1つ + 使わない副菜の材料2つを冷蔵庫に
        const usedKey = [...inMenu].find(k => !PANTRY.has(k));
        const cand = RECIPES.filter(r => r.type === '副菜' && !menuIds().includes(r.id)).slice(0, 40);
        const extra = []; cand.forEach(r => r.items.forEach(i => { if (!i.opt && !PANTRY.has(i.key) && !inMenu.has(i.key) && extra.length < 2 && !extra.includes(i.key)) extra.push(i.key); }));
        S.fridge = [usedKey, ...extra].filter(Boolean); save(); render();
        const f = fridgeUseInfo(); if (!f) return {err:'no info'};
        const wrongUsed = f.used.filter(k => !inMenu.has(k)).length, wrongUnused = f.unused.filter(k => inMenu.has(k)).length;
        const shownBox = !!document.querySelector('.fridge-use');
        const before = m.items.map(x => x.slot + ':' + (x.r && x.r.id)), nb = m.n;
        const btn = document.querySelector('[data-act="fridge-add"]'); let after = null, undone = null, added = null;
        if (btn){
            const id = btn.dataset.id; btn.click();
            after = session.menu.items.map(x => x.slot + ':' + (x.r && x.r.id));
            added = after.filter(a => !before.includes(a));
            const u = document.querySelector('[data-act="toast-undo"]'); if (u){ u.click(); undone = session.menu.items.map(x => x.slot + ':' + (x.r && x.r.id)); }
            return {wrongUsed, wrongUnused, shownBox, before, after, added, undone, id, nb, nsugg: f.sugg.length, hasUndo: !!u};
        }
        return {wrongUsed, wrongUnused, shownBox, nsugg: f.sugg.length, before};
    });
    ok(!o.err, cc + ' ' + JSON.stringify(o));
    if (!o.err){
        ok(o.wrongUsed === 0 && o.wrongUnused === 0, cc + ' classification ' + JSON.stringify(o)); ok(o.shownBox, cc + ' no box');
        if (o.after){ shown++;
            const kept = o.before.every(x => x.endsWith('undefined') || o.after.includes(x) || /:null$/.test(x));
            ok(kept, cc + ' other dishes changed ' + JSON.stringify(o)); ok(o.added.length === 1 && o.added[0].endsWith(o.id), cc + ' added ' + JSON.stringify(o));
            if (o.hasUndo) ok(JSON.stringify(o.undone) === JSON.stringify(o.before), cc + ' undo ' + JSON.stringify(o)); }
    }
    ok(!errs.length, cc + ' errors ' + errs.join('|'));
    await ctx.close();
}
console.log('suggestions exercised in', shown, 'countries;', fails ? fails + ' FAILS' : 'all ok');
process.exit(fails ? 1 : 0);
