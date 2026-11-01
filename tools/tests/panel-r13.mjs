#!/usr/bin/env node
// 利用者モニター第13回の直し（安全）。Playwright。使い方: node tools/tests/panel-r13.mjs [http://localhost:8999/]
//  S25 の残り: 献立の料理を戻す「元に戻す」は、どれも同じ守り（menuUndo）を通る。
//      出したあとにアレルギー（本人・家族）・苦手など判定に効く設定を変えたら戻さない。念のため、戻すと出る料理がいまの設定でアレルゲンに当たるときも戻さない
//   ・「あと1品」で同じ種類の最後の料理とかえた／品数を1つ増やしたときの「元に戻す」
//   ・決めた献立を作り直したあとの「元に戻す」（今日の画面に決めた献立を戻す）。決めた献立の記録と「作り方」は変えない
//   ・決めた献立の取り消しの「元に戻す」（ボタンは消えるが、中の処理も守る）
//   ・決めた一膳があるときの「明日から」の「元に戻す」（明日の下書きも戻すため）
//   設定を変えなければ、どれも今までどおり戻る
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (settings, tag, extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r13', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(([st, ex]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, st)}, ex))); } }, [settings, extra]);
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
const undoShown = p => p.locator('#toast-root [data-act=toast-undo]').count();

// 「あと1品」の入れかえ（replace）: 5品の献立の汁ものを、別の汁ものにかえる。前の汁ものにだけ当たるアレルゲンを探しておく
const oneReplace = (p, fam) => p.evaluate(fam => {
    for (let k = 0; k < 300; k++){
        const m = session.menu, at = m.items.findIndex(x => x.slot === '汁物' && x.r);
        if (at < 0){ session.rejected.clear(); newMenu(); render(); continue; }
        const old = m.items[at].r;
        const add = ALG_ALL.filter(a => (!fam || Object.values(FAM_ALG).some(v => v.includes(a))) && (() => { const p0 = S.settings.allergens; S.settings.allergens = [a]; const h = allergyConflict(old); S.settings.allergens = p0; return h; })() && !m.items.some((x, i) => i !== at && x.r && algSelectedHits(x.r, [a]).length));
        if (add.length){
            const r = RECIPES.find(c => slotOf(c) === '汁物' && c.id !== old.id && !m.items.some(x => x.r && x.r.id === c.id) && !allergyConflict(c) && !algSelectedHits(c, add).length && oneWhere(c).mode === 'replace');
            if (r) return {at, old: old.id, r: r.id, add: add.slice(0, 1), fk: Object.keys(FAM_ALG).find(k => FAM_ALG[k].includes(add[0]))};
        }
        session.rejected.clear(); newMenu(); render();
    }
    return null;
}, !!fam);

// R13-1 あと1品の入れかえ: 設定を変えなければ戻る
{
    const {p, ctx} = await open({dishCount: 5}, 'one-keep');
    const c = await oneReplace(p);
    ok(!!c, 'R13-1 汁ものがある5品の献立と、かえる汁ものが見つかる: ' + JSON.stringify(c));
    if (c){
        const r = await p.evaluate(c => { oneAdd(c.r); const a = session.menu.items[c.at].r.id; const shown = !!document.querySelector('#toast-root [data-act=toast-undo]'); toast.undo(); return {a, shown, b: session.menu.items[c.at].r.id}; }, c);
        ok(r.a === c.r && r.shown && r.b === c.old, 'R13-1 あと1品でかえたあと、設定を変えなければ「元に戻す」で前の汁ものに戻る: ' + JSON.stringify(r));
    }
    await ctx.close();
}
// R13-2 あと1品の入れかえ: 本人のアレルギーを足したら、「元に戻す」は消え、残っていた処理を呼んでも前の料理（アレルゲン）に戻らない
for (const how of ['self', 'fam']){
    const {p, ctx} = await open({dishCount: 5}, 'one-' + how);
    const c = await oneReplace(p, how === 'fam');
    ok(!!c, `R13-2 ${how} かえる汁ものが見つかる: ` + JSON.stringify(c));
    if (c){
        const r = await p.evaluate(([c, how]) => {
            oneAdd(c.r); const u = toast.undo, before = session.menu.items.map(x => x.r && x.r.id);
            if (how === 'self') S.settings.allergens = algIds().concat(c.add);
            else S.family = (S.family || []).concat([{id: 'r13', name: '花子', allergy: ['@' + c.fk], avoid: ['@' + c.fk]}]);
            save(); reconcileMenu(); render();
            const oldHit = allergyConflict(byId(c.old));
            const shown = !!document.querySelector('#toast-root [data-act=toast-undo]'); const mid = session.menu.items.map(x => x.r && x.r.id);
            if (u) u(); render();
            return {oldHit, before, shown, mid, after: session.menu.items.map(x => x.r && x.r.id), hits: session.menu.items.filter(x => x.r && allergyConflict(x.r)).map(x => x.r.name), tags: document.querySelectorAll('#view .tray .alg-tag:not(.may)').length};
        }, [c, how]).catch(e => ({err: e.message}));
        ok(!r.err && r.oldHit && !r.shown && JSON.stringify(r.mid) === JSON.stringify(r.after) && !r.after.includes(c.old) && !r.hits.length && !r.tags,
            `R13-2 ${how} あと1品の「元に戻す」は、アレルギーを足したあとは出ず、呼んでも戻らない（⚠ なし）: ` + JSON.stringify([c, r]));
    }
    await ctx.close();
}
// R13-3 あと1品の入れかえ: 念のための守り（設定はそのままでも、戻すと出る料理がアレルゲンに当たるなら戻さない）
{
    const {p, ctx} = await open({dishCount: 5}, 'one-def');
    const c = await oneReplace(p);
    if (c){
        const r = await p.evaluate(c => {
            S.settings.allergens = c.add; save();   // 前の汁もの（old）はアレルゲンに当たる。献立は仮にそのまま
            oneAdd(c.r); const a = session.menu.items[c.at].r.id; toast.undo && toast.undo();
            return {a, b: session.menu.items[c.at].r.id};
        }, c);
        ok(r.a === c.r && r.b === c.r, 'R13-3 戻すとアレルゲンに当たる汁ものが出るときは、あと1品の「元に戻す」で戻さない: ' + JSON.stringify([c, r]));
    } else ok(false, 'R13-3 かえる汁ものが見つかる');
    await ctx.close();
}
// R13-4 あと1品で品数を1つ増やした（add）あとの「元に戻す」: 設定を変えなければ戻る・アレルギーを足したら戻さない
for (const change of [false, true]){
    const {p, ctx} = await open({dishCount: 3}, 'one-add-' + change);
    const r = await p.evaluate(change => {
        const m = session.menu, n0 = m.n, ids0 = m.items.map(x => x.r && x.r.id);
        const c = RECIPES.find(x => slotOf(x) === '副菜' && !m.items.some(y => y.r && y.r.id === x.id) && !allergyConflict(x) && oneWhere(x).mode === 'add');
        if (!c) return {err: 'no side'};
        oneAdd(c.id); const n1 = session.menu.n, u = toast.undo;
        if (change){ const hit = ALG_ALL.filter(a => !algSelectedHits(c, [a]).length && session.menu.items.some(x => x.r && x.r.id !== c.id && algSelectedHits(x.r, [a]).length)), add = (hit.length ? hit : ALG_ALL.filter(a => !algSelectedHits(c, [a]).length)).slice(0, 1); S.settings.allergens = add; save(); reconcileMenu(); render(); }
        const mid = session.menu.items.map(x => x.r && x.r.id); if (u) u(); render();
        return {n0, n1, n2: session.menu.n, ids0, mid, after: session.menu.items.map(x => x.r && x.r.id), hits: session.menu.items.filter(x => x.r && allergyConflict(x.r)).length};
    }, change);
    if (!change) ok(!r.err && r.n1 === r.n0 + 1 && r.n2 === r.n0 && JSON.stringify(r.after) === JSON.stringify(r.ids0), 'R13-4 品数を増やしたあと、設定を変えなければ「元に戻す」で元の品数・料理に戻る: ' + JSON.stringify(r));
    else ok(!r.err && JSON.stringify(r.after) === JSON.stringify(r.mid) && !r.hits, 'R13-4 品数を増やしたあと、アレルギーを足したら「元に戻す」で戻さない（⚠ なし）: ' + JSON.stringify(r));
    await ctx.close();
}

// 決めた献立のアレルゲン（決めた料理に当たり、作り直した今日の案に当たらないもの）
const decide = async p => { await p.click('#view [data-act=decide]'); await p.waitForTimeout(400); return p.evaluate(() => ({ids: S.cook && S.cook.ids.slice(), dec: menuIsDecided()})); };
const redo = async p => {
    await p.evaluate(() => { setTab('today'); session.stage = 'decide'; render(); });
    await p.click('#view .tray .tg-mid .shuffle[data-act=new-menu]'); await p.waitForTimeout(300);
    const s = await p.locator('#sheet-root [data-act=redo-yes]').count();
    if (s) await p.click('#sheet-root [data-act=redo-yes]'); await p.waitForTimeout(300);
    return p.evaluate(() => { window.__u = toast.undo; return {sheet: true, undo: !!toast.undo, dec: menuIsDecided()}; });
};
// R13-5 決めた献立を作り直したあとの「元に戻す」: 設定を変えなければ、今日の画面が決めた献立に戻る
{
    const {p, ctx} = await open({}, 'redo-keep');
    const d = await decide(p);
    ok(d.dec, 'R13-5 献立を決める: ' + JSON.stringify(d));
    const r = await redo(p);
    ok(r.undo && !r.dec, 'R13-5 作り直すと「元に戻す」が出て、今日の画面は新しい案: ' + JSON.stringify(r));
    await p.click('#toast-root [data-act=toast-undo]'); await p.waitForTimeout(300);
    const a = await p.evaluate(() => ({dec: menuIsDecided(), ids: S.cook.ids.slice()}));
    ok(a.dec && JSON.stringify(a.ids) === JSON.stringify(d.ids), 'R13-5 設定を変えなければ、決めた献立に戻る: ' + JSON.stringify(a));
    await ctx.close();
}
// R13-6 決めた献立を作り直したあと、決めた料理に当たるアレルギーを足したら、「元に戻す」は消え、呼んでも決めた献立（⚠）を今日の画面に戻さない。決めた献立の記録はそのまま
for (const how of ['settings', 'direct']){
    const {p, ctx} = await open({}, 'redo-' + how);
    let found = null;
    for (let k = 0; k < 30 && !found; k++){
        const d = await decide(p); const r = await redo(p);
        found = await p.evaluate(ids => { const add = ALG_ALL.filter(a => ids.some(id => algSelectedHits(byId(id), [a]).length) && !session.menu.items.some(x => x.r && algSelectedHits(x.r, [a]).length)); return add.length && window.__u ? {ids, add: add.slice(0, 1)} : null; }, d.ids);
        void r;
        if (!found) await p.evaluate(() => { S.cook = null; save(); if (toast.hide) toast.hide(); setTab('today'); render(); });
    }
    ok(!!found, `R13-6 ${how} 決めた料理にだけ当たるアレルゲンが見つかる: ` + JSON.stringify(found));
    if (found){
        if (how === 'settings'){
            await p.click('button[data-act=settings]'); await p.waitForTimeout(300); await p.evaluate(() => document.querySelectorAll('#view details').forEach(d => d.open = true));
            const bt = p.locator(`button[data-act=alg-toggle][data-v="${found.add[0]}"]:visible`).first();
            if (await bt.count()){ await bt.scrollIntoViewIfNeeded(); await bt.click(); } else await p.evaluate(a => { S.settings.allergens = algIds().concat(a); save(); render(); }, found.add);
            await p.waitForTimeout(250); await p.click('[data-act=settings-back]'); await p.waitForTimeout(400);
        } else await p.evaluate(a => { S.settings.allergens = algIds().concat(a); save(); render(); }, found.add);
        ok(await undoShown(p) === 0, `R13-6 ${how} アレルギーを足したあとは「元に戻す」が出ていない`);
        const r = await p.evaluate(() => { const ids0 = session.menu.items.map(x => x.r && x.r.id); if (window.__u) window.__u(); render();
            return {ids0, ids1: session.menu.items.map(x => x.r && x.r.id), dec: menuIsDecided(), cook: S.cook && S.cook.ids.slice(), hits: session.menu.items.filter(x => x.r && allergyConflict(x.r)).length}; });
        ok(JSON.stringify(r.ids0) === JSON.stringify(r.ids1) && !r.dec && !r.hits, `R13-6 ${how} 呼んでも決めた献立（⚠）を今日の画面に戻さない: ` + JSON.stringify(r));
        ok(JSON.stringify(r.cook) === JSON.stringify(found.ids), `R13-6 ${how} 決めた献立の記録（作り方）はそのまま: ` + JSON.stringify(r.cook));
    }
    await ctx.close();
}
// R13-7 決めた献立の取り消しの「元に戻す」: 設定を変えなければ戻る。決めた料理に当たるアレルギーを足したら、呼んでも決めた献立に戻さない
for (const change of [false, true]){
    const {p, ctx} = await open({}, 'undec-' + change);
    const d = await decide(p);
    const add = await p.evaluate(ids => ALG_ALL.filter(a => ids.some(id => algSelectedHits(byId(id), [a]).length)).slice(0, 1), d.ids);
    await p.evaluate(() => { setTab('cook'); render(); });
    const bt = p.locator('#view [data-act=undo-decide]:visible').first();
    ok(await bt.count() > 0, 'R13-7 決めた献立を取り消すボタンがある');
    await bt.click(); await p.waitForTimeout(300);
    const u0 = await p.evaluate(() => { window.__u = toast.undo; return {undo: !!toast.undo, cook: !!(S.cook && S.cook.d === TODAY)}; });
    ok(u0.undo && !u0.cook, 'R13-7 取り消すと「元に戻す」が出る: ' + JSON.stringify(u0));
    if (change){
        ok(add.length > 0, 'R13-7 決めた料理に当たるアレルゲンがある: ' + JSON.stringify(add));
        await p.evaluate(a => { S.settings.allergens = algIds().concat(a); save(); render(); }, add);
        ok(await undoShown(p) === 0, 'R13-7 アレルギーを足したあとは「元に戻す」が出ていない');
    }
    const r = await p.evaluate(() => { if (window.__u) window.__u(); return {cook: S.cook && S.cook.d === TODAY ? S.cook.ids.slice() : null}; });
    if (!change) ok(JSON.stringify(r.cook) === JSON.stringify(d.ids), 'R13-7 設定を変えなければ、決めた献立に戻る: ' + JSON.stringify(r));
    else ok(r.cook === null, 'R13-7 アレルギーを足したあとは、残っていた処理を呼んでも決めた献立（⚠）に戻さない: ' + JSON.stringify(r));
    await ctx.close();
}
// R13-8 決めた一膳があるときの「明日から」の「元に戻す」: 明日の下書きも戻すので、アレルギーを足したあとは戻さない
for (const change of [false, true]){
    const {p, ctx} = await open({}, 'later-' + change);
    await decide(p);
    const r = await p.evaluate(change => {
        const td = addDays(TODAY, 1); const its = session.menu.items.filter(x => x.r).map(x => ({slot: x.slot, id: x.r.id}));
        Object.assign(dayObj(td), {state: 'draft', items: its}); save();
        const add = ALG_ALL.filter(a => its.some(x => algSelectedHits(byId(x.id), [a]).length)).slice(0, 1);
        laterIfDecided('品数', () => {}); const u = toast.undo, mid = JSON.stringify((dayRec(td) || {}).items || []);
        if (change){ S.settings.allergens = algIds().concat(add); save(); render(); }
        const shown = !!document.querySelector('#toast-root [data-act=toast-undo]');
        if (u) u();
        return {add, shown, mid, after: JSON.stringify((dayRec(td) || {}).items || []), orig: JSON.stringify(its)};
    }, change);
    if (!change) ok(r.shown && r.after === r.orig, 'R13-8 設定を変えなければ「明日から」の「元に戻す」で明日の下書きも戻る: ' + JSON.stringify(r));
    else ok(r.add.length && !r.shown && r.after === r.mid, 'R13-8 アレルギーを足したあとは「明日から」の「元に戻す」で明日の下書き（アレルゲン）を戻さない: ' + JSON.stringify(r));
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
