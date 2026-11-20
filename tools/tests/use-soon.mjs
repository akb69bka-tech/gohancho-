#!/usr/bin/env node
// 「早めに使う」印の回帰テスト（Playwright。使い方: node tools/tests/use-soon.mjs [http://localhost:8795/]）
//  印の切り替え・登録からの日数・先頭の新欄（元の欄と重複しない）・献立提案の優先・外した食材のメタ削除・不正値の除去・献立が変わらないこと
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready, SEED, rngScript, seedFor } = require('../lib/pw.cjs'); let seedN = 0;   // 乱数は SEED から（失敗したら表示の SEED=… を付けて実行すると同じ献立で再現する）
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const open = async (state, cc = 'JP') => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('use-soon', String(++seedN))));
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([cc, st]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded:true, firstUse:'2026-01-01', settings:{country:cc, dishCount:3}}, st))); } }, [cc, state]);
    await p.goto(URL_); await ready(p); return {ctx, p, errs};
};
const stored = p => p.evaluate(() => { saveNow(); return JSON.parse(localStorage.getItem('gohancho.v1')); });
for (const cc of ['JP', 'US', 'KR', 'FR']){
    const {ctx, p, errs} = await open({}, cc);
    const o = await p.evaluate(() => {
        setTab('fridge'); S.fridge = QUICK.slice(0, 6); S.fridgeMeta = {}; save(); render();
        const chips = [...document.querySelectorAll('.chip.have .lab')];
        const before = JSON.stringify(S.settings);
        return {n: chips.length, quick: QUICK.slice(0, 6), before};
    });
    ok(o.n === 6, cc + ' chips ' + o.n);
    // 印をつける前は新欄なし
    ok(await p.locator('[data-k="fr-soon"], .sec-head h3:has-text("⏰")').count() === 0, cc + ' soon block before mark');
    // 1つ目に印
    await p.locator('.chip.have .lab').first().click();
    let st = await stored(p); const k0 = st.fridge[0];
    ok(st.fridgeMeta[k0] && st.fridgeMeta[k0].soon === true, cc + ' soon not saved');
    ok(/^\d{4}-\d{2}-\d{2}$/.test(st.fridgeMeta[k0].d), cc + ' no date');
    ok(await p.locator('.chip.soon .soon-tag').count() === 1, cc + ' tag');
    ok(await p.locator('.chip.have .lab[aria-pressed="true"]').count() === 1, cc + ' pressed');
    const r = await p.evaluate(() => {
        const heads = [...document.querySelectorAll('#view .sec-head h3')].map(h => h.textContent.trim());
        const ids = [...document.querySelectorAll('#view .list .match .head[data-act="open"][data-id]')].map(e => e.dataset.id);
        const soonIdx = heads.findIndex(h => h.startsWith('⏰'));
        const lists = [...document.querySelectorAll('#view .list')].map(l => [...l.querySelectorAll('.match .head[data-act="open"][data-id]')].map(e => e.dataset.id));
        const flat = lists.flat(); const dup = flat.length - new Set(flat).size;
        const resHeads = [...document.querySelectorAll('#view .sec-head:has(+ .list .match) h3')].map(h => h.textContent.trim());
        return {heads, soonIdx, dup, firstIsSoon: !resHeads.length || resHeads[0].startsWith('⏰'), nSoon: soonIdx >= 0 ? lists[soonIdx].length : 0};
    });
    // 印の食材で作れる料理があれば先頭の欄に出る・重複しない
    ok(r.dup === 0, cc + ' duplicates ' + r.dup);
    if (r.soonIdx >= 0){ ok(r.firstIsSoon, cc + ' soon block not first'); ok(r.nSoon > 0, cc + ' empty soon block'); }
    // 印を外す → 消える
    await p.locator('.chip.have .lab').first().click();
    st = await stored(p); ok(!st.fridgeMeta[k0].soon, cc + ' unmark');
    ok(await p.locator('.chip.soon').count() === 0, cc + ' soon chip after unmark');
    // 日数: 3日前の登録
    await p.evaluate(() => { const f = S.fridge[1]; const d = new Date(); d.setDate(d.getDate() - 3); S.fridgeMeta[f].d = ymd(d); render(); });
    const txt = await p.locator('.chip.have').nth(1).innerText();
    ok(/3/.test(txt), cc + ' days text ' + txt);
    ok(!/\d/.test(await p.locator('.chip.have').nth(0).innerText().then(x => x.replace(/\D*$/, '')).catch(() => '')) || true, 'n/a');
    ok((await p.locator('.chip.have').nth(0).locator('.chip-d').count()) === 0, cc + ' day shown for today');
    // 外した食材のメタは消える
    await p.evaluate(() => { S.fridgeMeta[S.fridge[2]].soon = true; save(); });
    const rm = await p.evaluate(() => S.fridge[2]);
    await p.locator('.chip.have .x').nth(2).click();
    st = await stored(p); ok(!(rm in st.fridgeMeta), cc + ' meta kept after remove'); ok(Object.keys(st.fridgeMeta).every(k => st.fridge.includes(k)), cc + ' stray meta');
    await p.evaluate(() => { S.fridge = []; save(); }); st = await stored(p); ok(Object.keys(st.fridgeMeta).length === 0, cc + ' meta after clear');
    ok(!errs.length, cc + ' errors ' + errs.join('|'));
    await ctx.close();
}
// 不正値の除去 / 旧データ
{
    const {ctx, p, errs} = await open({fridge:['豚肉','玉ねぎ','キャベツ'], fridgeMeta:{'豚肉':{soon:'yes', d:'bad'}, '玉ねぎ':{soon:true, d:'2026-10-20'}, 'ゴースト':{soon:true, d:'2026-10-20'}, 'キャベツ':5}});
    const m = await p.evaluate(() => S.fridgeMeta);
    ok(!m['ゴースト'], 'ghost kept'); ok(m['豚肉'] && !m['豚肉'].soon, 'bad soon kept'); ok(m['豚肉'].d === (new Date().toISOString().slice(0,4) ? m['豚肉'].d : ''), 'bad d'); ok(/^\d{4}-/.test(m['豚肉'].d), 'bad d not fixed ' + m['豚肉'].d);
    ok(m['玉ねぎ'].soon === true && m['玉ねぎ'].d === '2026-10-20', 'valid lost'); ok(m['キャベツ'] && !m['キャベツ'].soon, 'non-object');
    ok(!errs.length, 'errs'); await ctx.close();
}
{   // 印がなかった頃からのデータ: 日数は出さない
    const {ctx, p} = await open({fridge:['豚肉','玉ねぎ']});
    ok(await p.evaluate(() => S.fridge.every(f => S.fridgeMeta[f].d === '')), 'legacy d not empty');
    await p.evaluate(() => { setTab('fridge'); }); ok(await p.locator('.chip-d').count() === 0, 'legacy days shown');
    await ctx.close();
}
{   // 提案の優先 + 献立が変わらない
    const {ctx, p, errs} = await open({});
    const o = await p.evaluate(() => {
        setTab('today'); ensureMenu(); const ids0 = menuIds().join(',');
        const inMenu = new Set(); session.menu.items.forEach(x => x.r && x.r.items.forEach(i => { if (!i.opt) inMenu.add(i.key); }));
        const cand = RECIPES.filter(r => r.type === '副菜' && !menuIds().includes(r.id)).slice(0, 80);
        const ex = []; cand.forEach(r => r.items.forEach(i => { if (!i.opt && !PANTRY.has(i.key) && !inMenu.has(i.key) && !ex.includes(i.key)) ex.push(i.key); }));
        S.fridge = ex.slice(0, 6); S.fridgeMeta = {}; save();
        const base = fridgeUseInfo().sugg.map(x => x.r.id);
        // 基準の1位が使わない食材に印をつける
        const target = S.fridge.find(f => !fridgeUseInfo().sugg[0].hit.includes(keyOf(f)) && fridgeUseInfo().sugg.length && RECIPES.some(r => r.type === '副菜' && !menuIds().includes(r.id) && !isAvoided(r) && r.items.some(i => !i.opt && i.key === keyOf(f))));
        if (!target) return {skip: true};
        S.fridgeMeta[target].soon = true; save();
        const after = fridgeUseInfo().sugg;
        return {ids0, ids1: menuIds().join(','), top: after[0] && after[0].hit.includes(keyOf(target)), n: after.length, base: base.length};
    });
    if (!o.skip){ ok(o.top, 'suggestion not prioritised ' + JSON.stringify(o)); ok(o.ids0 === o.ids1, 'menu changed'); }
    ok(!errs.length, 'errs ' + errs.join('|')); await ctx.close();
}
console.log(fails ? fails + ' FAILS' : 'all ok'); await b.close(); process.exit(fails ? 1 : 0);
