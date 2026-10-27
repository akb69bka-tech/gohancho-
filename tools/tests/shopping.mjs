#!/usr/bin/env node
// 買い物メモ・1週間プランの回帰テスト（Playwright。使い方: node tools/tests/shopping.mjs [http://localhost:8794/]）
//  1) 全21か国で7日プランを何回か作り、買い物メモの行に「同じ核の名前」が2つないこと（残りの候補は表示するだけ）
//  2) 副菜・汁ものを含めるスイッチ: S.week.days[i].extra が保存され、読みこみ直しても同じ・買い物メモに入る
//  3) 苦手な食材の置き換えをした料理は、置き換えた食材が買い物メモと送る文面に入る
//  4) 中華圏の1週間プランで、ごはんもの・麺の主菜は3日まで
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/', N = Number(process.env.N || 10);
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
async function open(cc, settings = {}, store = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(cc + ': ' + m.text()); });
    await p.addInitScript(([cc, settings, store]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3, ...settings}, ...store})); } }, [cc, settings, store]);
    await p.goto(URL_); await p.waitForTimeout(900); await p.evaluate(() => { hasPro = () => true; });
    return { ctx, p };
}
// 1) 重複
const cand = [];
for (const cc of CCS){
    const { ctx, p } = await open(cc);
    const r = await p.evaluate(N => {
        S.staples = []; S.fridge = [];
        const core = s => { s = String(s).normalize('NFKC').toLowerCase().replace(/[（(][^）)]*[）)]/g, ' ').split(/[,，、]/)[0].trim();
            if (/[฀-๿]/.test(s)) s = s.split(/\s+/)[0];
            if (/^[㐀-鿿]+$/.test(s)) return s.replace(/(?<=.{2})肉$/, '').replace(/(?<=.)[片丝絲末泥块塊丁条條粒段]$/, '');
            return s.normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).map(w => w.replace(/ies$/, 'y').replace(/(?<=..)(oes|es|s)$/, '')).join(' '); };
        const dup = new Set(), near = new Set();
        for (let k = 0; k < N; k++){
            makeWeek(); const list = shoppingList(), cs = list.map(e => core(e.label));
            cs.forEach((c, i) => cs.forEach((d, j) => { if (j <= i || !c || !d) return; const pair = list[i].label + ' / ' + list[j].label;
                if (c === d) dup.add(pair); else if (c.length >= 3 && d.length >= 3 && (c.includes(d) || d.includes(c)) && /^[a-z ]+$/.test(c + d) === /^[a-z ]+$/.test(c + d)) near.add(pair); }));
        }
        return { dup: [...dup], near: [...near] };
    }, N);
    ok(!r.dup.length, cc + ' 重複: ' + r.dup.join(' ; '));
    r.near.forEach(x => cand.push(cc + ': ' + x));
    await ctx.close();
}
console.log('残りの候補（名前が含み合うが、別の品として扱っているもの。Chicken と Chicken breast など）: ' + cand.length); cand.slice(0, 40).forEach(x => console.log('  ' + x));
// 2) 副菜・汁もの
for (const cc of ['JP', 'TW', 'KR', 'US']){
    const { ctx, p } = await open(cc, {}, {});
    const r = await p.evaluate(() => { S.staples = []; S.fridge = []; makeWeek(); const off = shoppingList(); S.settings.weekSides = true; const on = shoppingList(); save();
        return { off: off.length, on: on.length, extras: S.week.days.map(x => x.extra), ids: S.week.days.map(x => x.id) }; });
    ok(r.on >= r.off, cc + ' 副菜を含めると材料が増える');
    ok(r.extras.every(e => e && (e.side || e.soup)), cc + ' 各日に extra');
    const n1 = JSON.stringify(r.extras);
    await p.reload(); await p.waitForTimeout(900); await p.evaluate(() => { hasPro = () => true; });
    const again = await p.evaluate(() => { const l = shoppingList(); return { extras: JSON.stringify(S.week.days.map(x => x.extra)), n: l.length, hint: (() => { setTab('plan'); return ''; })() }; });
    ok(again.extras === n1, cc + ' 読みこみ直しても副菜・汁ものが同じ'); ok(again.n === r.on, cc + ' 読みこみ直しても行数が同じ');
    const text = await p.evaluate(() => { document.body.innerHTML; return document.querySelector('.shop') ? document.querySelector('.sec-head + .chips') ? document.querySelector('.sec-head + .chips').previousElementSibling.innerText : '' : 'noshop'; });
    ok(text && text !== 'noshop', cc + ' 買い物メモの見出し: ' + text);
    console.log(cc, '主菜のみ', r.off, '行 → 副菜・汁ものも', r.on, '行 / 見出し:', text.replace(/\n/g, ' '));
    await ctx.close();
}
// 3) 置き換え
{
    const { ctx, p } = await open('JP', { avoid: ['@pork'], avoidSwap: true });
    const r = await p.evaluate(() => {
        const rs = RECIPES.filter(r => r.main && !isAvoided(r) && (swappedRecipe(r).swapped || {}).swaps && swappedRecipe(r).swapped.swaps.length);
        if (!rs.length) return { none: true };
        const r0 = rs[0], sw = swappedRecipe(r0); S.staples = []; S.fridge = [];
        S.week = { start: TODAY, days: [{ d: TODAY, id: r0.id }] };
        const labels = shoppingList().map(e => e.label), share = weekShareText();
        const to = sw.swapped.swaps.map(x => x.to && (x.to.label || x.to.name || x.to)).filter(Boolean);
        const inList = sw.items.filter(i => !i.opt && !PANTRY.has(i.key)).every(i => labels.includes(i.label) || labels.some(l => l.includes(i.label) || i.label.includes(l)));
        return { id: r0.id, labels, to, inList, pork: labels.filter(l => /豚|ベーコン|ハム/.test(l)), shareHas: sw.items.filter(i => !i.opt && !PANTRY.has(i.key)).every(i => share.includes(i.label)) };
    });
    if (r.none) console.log('置き換えのある主菜が見つからない'); else { ok(r.inList, '置き換えた食材が買い物メモに入る ' + r.id); ok(!r.pork.length, '苦手な豚肉が買い物メモに残っていない ' + r.pork); ok(r.shareHas, '送る文面にも置き換えた食材が入る'); console.log('置き換え', r.id, r.to.join(','), r.labels.length, '行'); }
    await ctx.close();
}
// 4) ごはんもの・麺の偏り
for (const cc of ['CN', 'TW', 'KR', 'VN', 'JP']){
    const { ctx, p } = await open(cc);
    const mx = await p.evaluate(() => { let m = 0; for (let k = 0; k < 40; k++){ makeWeek(); m = Math.max(m, S.week.days.filter(x => weekBowl(byId(x.id))).length); } return m; });
    ok(mx <= 3, cc + ' 一品料理(ごはん・麺)が最大 ' + mx + ' 日'); console.log(cc, '1週間の丼・麺 最大', mx);
    await ctx.close();
}
console.log('console errors', errs.length, errs.slice(0, 5)); await b.close();
console.log(fails ? 'FAILED ' + fails : 'OK'); process.exit(fails || errs.length ? 1 : 0);
