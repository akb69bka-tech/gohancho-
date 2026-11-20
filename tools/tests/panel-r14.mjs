#!/usr/bin/env node
// 利用者モニター第14回の直し（安全）。Playwright。使い方: node tools/tests/panel-r14.mjs [http://localhost:8999/]
//  S26: ○つけ表の「そろった○品から来週を組む」の「元に戻す」（1週間プランを戻す）も、献立の「元に戻す」と同じ守り（menuUndo → weekUndo）を通る。
//   ・出したあとにアレルギー（本人・家族）を足したら、ボタンは消え、残っていた処理を呼んでも、当たる主菜を1週間プランに戻さない
//   ・設定を変えなければ、今までどおり戻る
//   ・戻すと出る料理に、いまの設定で出さない料理（今は出さない・苦手）があるときも戻さない
//  S26 の見直し: 「作らない日」を作る日に戻したとき、休んでいるあいだに足したアレルギーに当たる料理には戻さない（選び直す）
//  S26 の見え方: 1週間プランにアレルゲンに当たる料理が残っているあいだ（今日より前に組んだ日の料理など）、買い物メモの当たる材料の行に ⚠、上に料理の名前の ⚠。
//   当たらないときは ⚠ を出さない（🔍 の「袋の表示を確認」はそのまま）
//  R41（小）: 幅195px・家族ありで決めた直後のお知らせは、料理名・かえる・まるごと入れ替えに重ならない（R38 のまま。空いた高さがないので場所は変えていない）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (settings, tag, vp = { width: 390, height: 844 }) => {
    const ctx = await b.newContext({ viewport: vp, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r14', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, st)})); } }, settings);
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
const undoShown = p => p.locator('#toast-root [data-act=toast-undo]').count();
// 今週のプランを作り、今日より後の日の主菜にだけ当たるアレルゲンを探す（家族の区分に読みかえられるものだけ: fam）。そのあと来週の○つけ表（全員○）を開く
const prepVote = (p, fam) => p.evaluate(fam => {
    for (let k = 0; k < 20; k++){
        makeWeek();
        const days = S.week.days.filter(x => x.d > TODAY && !x.skip && byId(x.id));
        for (const a of ALG_ALL){
            const fk = Object.keys(FAM_ALG).find(f => FAM_ALG[f].includes(a));
            if (fam && !fk) continue;
            const x = days.find(x => algSelectedHits(byId(x.id), [a]).length);
            if (!x) continue;
            const ids = voteSuggest(6, []).filter(id => !S.week.days.some(y => y.id === id) && !algSelectedHits(byId(id), fam ? FAM_ALG[fk] : [a]).length);
            if (ids.length < 2) continue;
            S.votes = [{w: voteWeek(), ids, ans: {'夫': ids.map(() => '2').join(''), '長女': ids.map(() => '2').join('')}, at: Date.now()}]; save();
            sheet = {kind: 'vote-table', w: voteWeek()}; renderSheet();
            return {a, fk, d: x.d, id: x.id, name: byId(x.id).name, before: JSON.stringify(S.week)};
        }
    }
    return null;
}, !!fam);
const weekState = p => p.evaluate(() => ({json: JSON.stringify(S.week), bad: (S.week ? S.week.days : []).filter(x => x.d >= TODAY && !x.skip && byId(x.id) && allergyConflict(byId(x.id))).map(x => x.d + ' ' + byId(x.id).name)}));

// R14-1 設定を変えなければ、○つけ表から来週を組んだあとの「元に戻す」で前のプランに戻る
{
    const {p, ctx} = await open({}, 'vote-keep');
    const c = await prepVote(p);
    ok(!!c, 'R14-1 今週のプランの主菜に当たるアレルゲンと○つけ表が用意できる: ' + JSON.stringify(c && {a: c.a, name: c.name}));
    if (c){
        await p.click('#sheet-root [data-act=vote-week]'); await p.waitForTimeout(300);
        const mid = await weekState(p);
        ok(mid.json !== c.before && await undoShown(p) === 1, 'R14-1 来週の日にプランが入り、「元に戻す」が出る');
        await p.click('#toast-root [data-act=toast-undo]'); await p.waitForTimeout(200);
        const after = await weekState(p);
        ok(after.json === c.before, 'R14-1 設定を変えなければ、元に戻すで前のプランに戻る');
    }
    await ctx.close();
}
// R14-2 本人のアレルギー（設定の画面で足す）・家族のアレルギーを8秒のうちに足したら、「元に戻す」は消え、残っていた処理を呼んでも当たる主菜をプランに戻さない
for (const how of ['self', 'fam']){
    const {p, ctx} = await open({}, 'vote-' + how);
    const c = await prepVote(p, how === 'fam');
    ok(!!c, `R14-2 ${how} 今週のプランの主菜に当たるアレルゲンと○つけ表が用意できる: ` + JSON.stringify(c && {a: c.a, fk: c.fk, name: c.name}));
    if (c){
        await p.click('#sheet-root [data-act=vote-week]'); await p.waitForTimeout(300);
        await p.evaluate(() => { window.__u = toast.undo; });
        if (how === 'self'){
            await p.click('button[data-act=settings]'); await p.waitForTimeout(300); await p.evaluate(() => document.querySelectorAll('#view details').forEach(d => d.open = true));
            const bt = p.locator(`button[data-act=alg-toggle][data-v="${c.a}"]:visible`).first();
            if (await bt.count()){ await bt.scrollIntoViewIfNeeded(); await bt.click(); } else await p.evaluate(a => { S.settings.allergens = algIds().concat(a); save(); reconcileMenu(); refreshWeek(); render(); }, c.a);
            await p.waitForTimeout(250); await p.click('[data-act=settings-back]'); await p.waitForTimeout(400);
        } else await p.evaluate(fk => { S.family = (S.family || []).concat([{id: 'r14', name: '花子', allergy: ['@' + fk], avoid: ['@' + fk]}]); save(); reconcileMenu(); refreshWeek(); render(); }, c.fk);
        const mid = await weekState(p);
        ok(!mid.bad.length, `R14-2 ${how} 足したあと、プランは選び直されて当たる主菜がない: ` + JSON.stringify(mid.bad));
        ok(await undoShown(p) === 0, `R14-2 ${how} 足したあとは「元に戻す」が出ていない`);
        const after = await p.evaluate(() => { const j0 = JSON.stringify(S.week); if (window.__u) window.__u(); render();
            return {same: JSON.stringify(S.week) === j0, bad: S.week.days.filter(x => x.d >= TODAY && !x.skip && byId(x.id) && allergyConflict(byId(x.id))).map(x => byId(x.id).name), planOk: S.week.days.filter(x => x.d >= TODAY && !x.skip).every(x => !byId(x.id) || planUsable(byId(x.id)) || daysSince(x.id) < (Number(S.settings.avoidDays) || 0))}; });
        ok(after.same && !after.bad.length, `R14-2 ${how} 残っていた処理を呼んでも、足す前のプラン（${c.name}）に戻さない: ` + JSON.stringify(after));
        // 買い物メモにも当たる料理の ⚠ の文が出ない（当たる料理がプランにない）
        const shop = await p.evaluate(() => { const h = shoppingHtml(); return {hit: /alg-shop-hit/.test(h), warnRow: /class="alg-tag" role="note"/.test(h)}; });
        ok(!shop.hit && !shop.warnRow, `R14-2 ${how} 買い物メモに当たる料理の ⚠ が出ない（プランに残っていない）: ` + JSON.stringify(shop));
    }
    await ctx.close();
}
// R14-3 設定は同じでも、戻すと出る料理を「今は出さない」にしていたら戻さない（weekUndo）
{
    const {p, ctx} = await open({}, 'vote-hide');
    const c = await prepVote(p);
    if (c){
        await p.click('#sheet-root [data-act=vote-week]'); await p.waitForTimeout(300);
        const r = await p.evaluate(id => { const u = toast.undo; S.hidden.push(id); refreshWeek(); save(); render(); const j0 = JSON.stringify(S.week); u(); return {same: JSON.stringify(S.week) === j0, back: S.week.days.some(x => x.id === id && !x.skip)}; }, c.id);
        ok(r.same && !r.back, 'R14-3 「今は出さない」にした料理のあるプランには戻さない: ' + JSON.stringify(r));
    } else ok(false, 'R14-3 ○つけ表が用意できる');
    await ctx.close();
}
// R14-4 「作らない日」を作る日に戻すとき、休んでいるあいだに足したアレルギーに当たる料理には戻さない。当たらなければ同じ料理に戻る
for (const change of [false, true]){
    const {p, ctx} = await open({}, 'skip-' + change);
    const r0 = await p.evaluate(() => { for (let k = 0; k < 20; k++){ makeWeek(); const x = S.week.days.find(x => x.d > TODAY && byId(x.id) && ALG_ALL.some(a => algSelectedHits(byId(x.id), [a]).length && !S.week.days.some(y => y !== x && y.d >= TODAY && algSelectedHits(byId(y.id), [a]).length)));
        if (x) return {d: x.d, id: x.id, a: ALG_ALL.find(a => algSelectedHits(byId(x.id), [a]).length && !S.week.days.some(y => y !== x && y.d >= TODAY && algSelectedHits(byId(y.id), [a]).length))}; } return null; });
    ok(!!r0, `R14-4 ${change} 1日の主菜にだけ当たるアレルゲンが見つかる: ` + JSON.stringify(r0));
    if (r0){
        await p.evaluate(d => { sheet = {kind: 'wday', d}; renderSheet(); }, r0.d); await p.waitForTimeout(200);
        await p.locator(`#sheet-root [data-act=week-skip][data-d="${r0.d}"]`).first().click(); await p.waitForTimeout(200);   // 1日の画面の「作らない」
        if (change) await p.evaluate(a => { S.settings.allergens = algIds().concat(a); save(); reconcileMenu(); refreshWeek(); render(); document.querySelectorAll('#view details').forEach(d => d.open = true); }, r0.a);
        const mid = await p.evaluate(d => ({skip: !!S.week.days.find(x => x.d === d).skip}), r0.d);
        await p.evaluate(() => document.querySelectorAll('#view details').forEach(d => d.open = true));
        const back = p.locator(`#view [data-act=week-skip][data-d="${r0.d}"]`).first(); await back.scrollIntoViewIfNeeded(); await back.click(); await p.waitForTimeout(200);   // プランの行の「作る日に戻す」
        const r = await p.evaluate(d => { const x = S.week.days.find(x => x.d === d); return {skip: !!x.skip, id: x.id, hit: !!(byId(x.id) && allergyConflict(byId(x.id)))}; }, r0.d);
        if (!change) ok(mid.skip && !r.skip && r.id === r0.id, 'R14-4 設定を変えなければ、作る日に戻すと同じ料理に戻る: ' + JSON.stringify(r));
        else ok(mid.skip && !r.hit && r.id !== r0.id, 'R14-4 アレルギーを足したあとは、作る日に戻しても当たる料理（' + r0.id + '）には戻さず選び直す: ' + JSON.stringify(r));
    }
    await ctx.close();
}
// R14-5 1週間プランにアレルゲンに当たる料理が残っているとき（プランを作ってから、選び直しを通らずに足した形）: 買い物メモの当たる材料の行に ⚠、上に料理の名前の ⚠。
//  ⚠ の行は、プランの行の「⚠ アレルゲンあり」と同じ判定（itemAvoided）。当たらない行には ⚠ を付けない
for (const how of ['self', 'fam']){
    const {p, ctx} = await open({}, 'shop-' + how);
    const r = await p.evaluate(how => {
        for (let k = 0; k < 20; k++){
            makeWeek();
            const xs = visiblePlanDays();
            const a = ALG_ALL.find(a => (how !== 'fam' || Object.values(FAM_ALG).some(v => v.includes(a))) && xs.some(x => algSelectedHits(byId(x.id), [a]).length) && !xs.every(x => algSelectedHits(byId(x.id), [a]).length));
            if (!a) continue;
            if (how === 'self') S.settings.allergens = [a];
            else { const fk = Object.keys(FAM_ALG).find(f => FAM_ALG[f].includes(a)); S.family = [{id: 'r14', name: '花子', allergy: ['@' + fk], avoid: ['@' + fk]}]; }
            save();   // 選び直し（refreshWeek）は通さない: 当たる料理がプランに残っている
            // 当たる材料が「あれば」の任意（卵 2個? など）だけの料理は、買い物メモに行が入らない（任意は買う物に数えない）ので、⚠ の行の対象にならない。
            //  朝食を増やして乱数の展開が変わると、そういう組み合わせが先に見つかるようになった（アプリの不具合ではない）。別の組み合わせを探す
            { const g0 = allergyCtx(); if (!visiblePlanDays().flatMap(x => dayDishes(x)).some(r => (swappedRecipe(r) || r).items.some(i => !i.opt && itemAvoided(i, g0)))){ S.settings.allergens = []; S.family = []; save(); continue; } }
            const flagged = [...new Set(visiblePlanDays().flatMap(x => dayDishes(x)).filter(r => allergyConflict(r)))].map(r => r.name);
            const list = shoppingList(), g = allergyCtx();
            // ⚠ のある行は、プランの当たる料理の材料で itemAvoided が当たるもの。⚠ のない行は、どの料理の材料でも当たらない
            const hitKeys = new Set(), plan = visiblePlanDays().flatMap(x => dayDishes(x)).map(r => swappedRecipe(r) || r);
            plan.forEach(r => r.items.forEach(i => { if (!i.opt && itemAvoided(i, g)) hitKeys.add(shopBase(shopName(i, r))); }));
            const wrongNo = list.filter(e => !e.extra && !e.alg && hitKeys.has(shopBase(e.label))).map(e => e.label);
            const wrongYes = list.filter(e => e.alg && !hitKeys.has(shopBase(e.label))).map(e => e.label);
            const h = shoppingHtml(), box = document.createElement('div'); box.innerHTML = h;
            const rows = [...box.querySelectorAll('.shop-row')].filter(e => e.querySelector('.alg-tag:not(.may)')).map(e => e.querySelector('.nm').firstChild.textContent);
            const head = box.querySelector('.alg-shop-hit'), headTx = head ? head.textContent : '';
            return {a, flagged, warnRows: rows, wrongNo, wrongYes, head: headTx, headAll: flagged.every(n => headTx.includes(n)), sample: list.filter(e => e.alg).slice(0, 3).map(e => e.label + ' ' + JSON.stringify(e.alg))};
        }
        return null;
    }, how);
    ok(!!r, `R14-5 ${how} プランの一部の料理にだけ当たるアレルゲンが見つかる: ` + JSON.stringify(r && r.a));
    if (r){
        ok(r.flagged.length > 0 && r.warnRows.length > 0, `R14-5 ${how} 当たる材料の行に ⚠ が付く: ` + JSON.stringify({flagged: r.flagged, rows: r.warnRows.slice(0, 5), s: r.sample}));
        ok(!r.wrongNo.length && !r.wrongYes.length, `R14-5 ${how} ⚠ の行は、プランの行の ⚠ と同じ判定（取りこぼし・付けすぎなし）: ` + JSON.stringify({no: r.wrongNo, yes: r.wrongYes}));
        ok(r.headAll, `R14-5 ${how} 買い物メモの上に、当たる料理の名前の ⚠ が出る: ` + JSON.stringify(r.head));
    }
    // 当たらない設定に戻すと ⚠ は消える
    const off = await p.evaluate(() => { S.settings.allergens = []; S.family = []; save(); const h = shoppingHtml(); return {hit: /alg-shop-hit/.test(h), warnRow: /class="alg-tag" role="note"/.test(h)}; });
    ok(!off.hit && !off.warnRow, `R14-5 ${how} アレルギーの設定がなければ ⚠ の行・文は出ない: ` + JSON.stringify(off));
    await ctx.close();
}
// R14-6 本当の流れ（設定の画面でアレルギーを足す → 選び直し）のあとは、プランに当たる料理がなく、買い物メモに ⚠ の行も出ない
{
    const {p, ctx} = await open({}, 'shop-flow');
    const a = await p.evaluate(() => { makeWeek(); return ALG_ALL.find(a => visiblePlanDays().some(x => algSelectedHits(byId(x.id), [a]).length)) || null; });
    if (a){
        const r = await p.evaluate(a => { S.settings.allergens = [a]; save(); reconcileMenu(); refreshWeek(); render(); const h = shoppingHtml();
            return {bad: shopAlgDishes().map(r => r.name), hit: /alg-shop-hit/.test(h), warnRow: /class="alg-tag" role="note"/.test(h)}; }, a);
        ok(!r.bad.length && !r.hit && !r.warnRow, 'R14-6 選び直したあとはプランにも買い物メモにも当たる料理・⚠ の行がない: ' + JSON.stringify(r));
    } else ok(false, 'R14-6 プランに当たるアレルゲンがある');
    await ctx.close();
}
// R14-7（R41・R38 のまま）幅195px・家族あり・文字もっと大きい: 決めた直後のお知らせは、料理名・かえる・まるごと入れ替えに重ならない
{
    const {p, ctx} = await open({textSize: 2}, 'r41', { width: 195, height: 422 });
    await p.evaluate(() => { S.family = [{id: 'r14', name: '花子', allergy: [], avoid: []}]; save(); reconcileMenu(); setTab('today'); window.scrollTo({top: 0}); render(); if (toast.hide) toast.hide(); });
    await p.waitForTimeout(300);
    await p.locator('#view [data-act=decide]').click({force: true}); await p.waitForTimeout(600);
    const r = await p.evaluate(() => { const tb = document.querySelector('#toast-root .toast'); if (!tb) return {toast: false};
        const T = tb.getBoundingClientRect(), ov = a => !(a.right <= T.left || a.left >= T.right || a.bottom <= T.top || a.top >= T.bottom);
        const core = [...document.querySelectorAll('#view .spot .nm, #view .spot .swap:not(.swap-ph), #view [data-act=new-menu]')].filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight && ov(r); }).map(e => e.innerText.replace(/\s+/g, '').slice(0, 10));
        return {toast: true, top: Math.round(T.top), bottom: Math.round(T.bottom), core}; });
    ok(r.toast && !r.core.length, 'R14-7 幅195px・家族ありで、決めた直後のお知らせが料理名・かえる・まるごと入れ替えに重ならない: ' + JSON.stringify(r));
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
