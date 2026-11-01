#!/usr/bin/env node
// 利用者モニター第12回の直し（安全）。Playwright。使い方: node tools/tests/panel-r12.mjs [http://localhost:8999/]
//  S25 まるごと入れ替え（と1品かえる）の「元に戻す」は、そのあとにアレルギー（本人・家族）・苦手など、料理を出す・出さないの判定に効く設定を変えたら使えない
//      （お知らせを消す。残っていた押す処理を呼んでも戻さない）。念のため、戻すと出る料理がいまの設定でアレルゲンに当たるときも戻さない（判定そのものは変えない）
//      設定を変えなければ、今までどおりそっくり戻る
//  S24 今日決めた献立の買い物メモにも、カレーの日の付け合わせ（福神漬け・らっきょう漬け）の行があり、アレルギーの日は1週間プランの買い物メモと同じ🔍が付く
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
    await ctx.addInitScript(seedScript(seedFor('r12', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(([st, ex]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, st)}, ex))); } }, [settings, extra]);
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
const BTN = '#view .tray .tg-mid .shuffle[data-act=new-menu]';
const ids = p => p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
const undoShown = p => p.locator('#toast-root [data-act=toast-undo]').count();
// アレルゲン a（本人の設定として仮に入れたときに当たる料理）がある献立になるまで、まるごと入れ替えを押す。見つけたら、出ているお知らせは消しておく
const findHit = async (p, a) => {
    for (let k = 0; k < 40; k++){
        const hit = await p.evaluate(a => { const prev = S.settings.allergens; S.settings.allergens = [a]; const h = session.menu.items.filter(x => x && x.r && algSelectedHits(x.r).length).map(x => x.r.name); S.settings.allergens = prev; return h; }, a);
        if (hit.length){ await p.evaluate(() => { if (toast.hide) toast.hide(); }); return hit; }
        await p.click(BTN); await p.waitForTimeout(150);
    }
    return null;
};
// 入れ替えて、「元に戻す」の押す処理を控えておく（あとで直接呼んで、戻らないことを確かめる）
const swapKeep = async p => { await p.click(BTN); await p.waitForTimeout(300); return p.evaluate(() => { window.__u = toast.undo; return !!toast.undo; }); };
const openSettings = async p => { await p.click('button[data-act=settings]'); await p.waitForTimeout(300); await p.evaluate(() => document.querySelectorAll('#view details').forEach(d => d.open = true)); };
const back = async p => { await p.click('[data-act=settings-back]'); await p.waitForTimeout(400); };
// 戻らないこと: お知らせに「元に戻す」がない・残っていた処理を呼んでも献立はそのまま・お膳に当たる料理（⚠）がない
const noRestore = async (p, tag, before, prevIds) => {
    ok(await undoShown(p) === 0, `${tag}: 設定を変えたあとは「元に戻す」が出ていない`);
    const r = await p.evaluate(() => { const ids0 = session.menu.items.map(x => x.r && x.r.id); if (window.__u) window.__u(); render();
        return {ids0, ids1: session.menu.items.map(x => x.r && x.r.id), hits: session.menu.items.filter(x => x.r && allergyConflict(x.r)).map(x => x.r.name), tags: document.querySelectorAll('#view .tray .alg-tag:not(.may)').length}; });
    ok(JSON.stringify(r.ids0) === JSON.stringify(r.ids1) && JSON.stringify(r.ids1) !== JSON.stringify(prevIds), `${tag}: 残っていた「元に戻す」の処理を呼んでも、入れ替える前の献立には戻らない: ` + JSON.stringify([prevIds, r.ids0, r.ids1]));
    ok(!r.hits.length && !r.tags, `${tag}: お膳にアレルゲンに当たる料理（⚠）がない: ` + JSON.stringify(r));
    void before;
};

// S25-1 本人のアレルギー（設定の画面で えび を足す）
{
    const {p, ctx} = await open({}, 's25-self');
    const hit = await findHit(p, 'shrimp');
    ok(!!hit, 'S25 えびの料理がある献立が見つかる: ' + JSON.stringify(hit));
    if (hit){
        const prevIds = await ids(p);
        ok(await swapKeep(p), 'S25 本人 入れ替えると「元に戻す」が出る');
        await openSettings(p);
        const bt = p.locator('button[data-act=alg-toggle][data-v="shrimp"]:visible').first(); await bt.scrollIntoViewIfNeeded(); await bt.click(); await p.waitForTimeout(250);
        ok(await undoShown(p) === 0, 'S25 本人 アレルギーを足したその場で「元に戻す」が消える');
        await back(p);
        await noRestore(p, 'S25 本人のえび', null, prevIds);
    }
    await ctx.close();
}
// S25-2 家族のアレルギー（設定の画面で家族を足して 魚）
{
    const {p, ctx} = await open({}, 's25-fam');
    const hit = await findHit(p, 'fish');
    ok(!!hit, 'S25 魚の料理がある献立が見つかる: ' + JSON.stringify(hit));
    if (hit){
        const prevIds = await ids(p);
        ok(await swapKeep(p), 'S25 家族 入れ替えると「元に戻す」が出る');
        await openSettings(p);
        await p.click('[data-act=fam-add]'); await p.waitForTimeout(300);
        await p.evaluate(() => document.querySelectorAll('[data-fm] details').forEach(d => d.open = true));
        await p.locator('[data-fm]').last().locator('[data-act=fam-alg-fam][data-v=fish]').click(); await p.waitForTimeout(250);
        await back(p);
        await noRestore(p, 'S25 家族の魚', null, prevIds);
    }
    await ctx.close();
}
// S25-3 苦手（入れ替える前の献立の料理の材料を苦手に入れる）・S25-4 辛いのが苦手の家族（食べる人の条件）
for (const kind of ['avoid', 'mild']){
    const {p, ctx} = await open({}, 's25-' + kind);
    const prevIds = await ids(p);
    ok(await swapKeep(p), `S25 ${kind} 入れ替えると「元に戻す」が出る`);
    const add = await p.evaluate(([kind, prevIds]) => {
        if (kind === 'avoid'){
            const r = byId(prevIds[0]), i = r.items.find(x => !PANTRY.has(x.key)); const v = canonOf(i.label || i.name) || i.label || i.name;
            S.settings.avoid.push(v); save(); reconcileMenu(); refreshWeek(); render(); return v;
        }
        if (!Array.isArray(S.family)) S.family = [];
        S.family.push({id: 'fm', name: '', role: 'adult', avoid: [], allergy: [], mild: true}); save(); reconcileMenu(); refreshWeek(); render(); return 'mild';
    }, [kind, prevIds]);
    ok(await undoShown(p) === 0, `S25 ${kind}（${add}）を変えたあとは「元に戻す」が出ていない`);
    const r = await p.evaluate(() => { const a = session.menu.items.map(x => x.r && x.r.id); if (window.__u) window.__u(); return [a, session.menu.items.map(x => x.r && x.r.id)]; });
    ok(JSON.stringify(r[0]) === JSON.stringify(r[1]), `S25 ${kind} 残っていた処理を呼んでも献立は変わらない: ` + JSON.stringify(r));
    await ctx.close();
}
// S25-5 念のための確かめ: 設定は変わっていなくても、戻すと出る料理がいまの設定でアレルゲンに当たるときは戻さない
{
    const {p, ctx} = await open({allergens: ['shrimp']}, 's25-guard');
    const put = await p.evaluate(() => {
        const r = RECIPES.find(x => x.type !== 'ごはん' && slotOf(x) === session.menu.items[1].slot && allergyConflict(x)); if (!r) return null;
        session.menu.items[1].r = r; render(); return r.name;
    });
    ok(!!put, 'S25 えびの料理を仮に置ける: ' + put);
    if (put){
        const prevIds = await ids(p);
        ok(await swapKeep(p), 'S25 守り 入れ替えると「元に戻す」が出る');
        const r = await p.evaluate(() => { const a = session.menu.items.map(x => x.r && x.r.id); toast.undo && toast.undo(); return {a, b: session.menu.items.map(x => x.r && x.r.id), hits: session.menu.items.filter(x => x.r && allergyConflict(x.r)).length}; });
        ok(JSON.stringify(r.a) === JSON.stringify(r.b) && JSON.stringify(r.b) !== JSON.stringify(prevIds) && !r.hits, 'S25 守り アレルゲンに当たる料理がある献立には戻さない: ' + JSON.stringify([prevIds, r]));
    }
    await ctx.close();
}
// S25-6 設定を変えなければ、今までどおりそっくり戻る（アレルギーを入れている人も）。1品かえるの「元に戻す」も、アレルギーを足したあとは戻さない
{
    const {p, ctx} = await open({allergens: ['milk']}, 's25-keep');
    const a = await ids(p);
    await p.click(BTN); await p.waitForTimeout(300);
    ok(await undoShown(p) === 1, 'S25 設定を変えていないときは「元に戻す」が出ている');
    await p.click('#toast-root [data-act=toast-undo]'); await p.waitForTimeout(300);
    ok(JSON.stringify(await ids(p)) === JSON.stringify(a), 'S25 設定を変えていないときは、入れ替える前の献立にそっくり戻る');
    const rr = await p.evaluate(() => {
        if (toast.hide) toast.hide();
        window.__swapDirect = true; let i = 1, prev, u, now, others0, add = [];
        // 前の料理には当たり、かえたあとの料理・ほかの料理には当たらないアレルゲンが見つかるまで、1品かえるを押し直す
        for (let k = 0; k < 30 && add.length < 2; k++){
            i = 1 + (k % (session.menu.items.length - 1)); if (!session.menu.items[i].r) continue;
            prev = session.menu.items[i].r.id;
            document.querySelector(`#view [data-act=reroll][data-i="${i}"]`).click();
            u = toast.undo; now = session.menu.items[i].r.id; others0 = session.menu.items.map((x, k) => k !== i && x.r && x.r.id);
            add = algIds().concat(ALG_ALL.filter(id => algSelectedHits(byId(prev), [id]).length && !session.menu.items.some(x => x.r && algSelectedHits(x.r, [id]).length)).slice(0, 1));
        }
        S.settings.allergens = add; save(); reconcileMenu(); render();
        const shown = !!document.querySelector('#toast-root [data-act=toast-undo]'); const before = session.menu.items[i].r.id; if (u) u();
        return {prev, now, add, shown, same: session.menu.items[i].r.id === before, others: JSON.stringify(others0) === JSON.stringify(session.menu.items.map((x, k) => k !== i && x.r && x.r.id))};
    });
    ok(rr.add.length > 1 && !rr.shown && rr.same && rr.others, '1品かえるの「元に戻す」も、アレルギーを足したあとは出ず、戻さない: ' + JSON.stringify(rr));
    await ctx.close();
}

// S24 今日決めた献立の買い物メモに、福神漬け・らっきょう漬けの行。アレルギーの日は🔍（1週間プランの買い物メモと同じ）
for (const [st, ex, want, may] of [
    [{}, {}, '福神漬け', null],
    [{allergens: ['sesame']}, {}, '福神漬け', /🔍 ごま（袋の表示を確認）/],
    [{allergens: ['soy']}, {}, 'らっきょう漬け', /🔍 大豆（袋の表示を確認）/],
    [{}, {family: [{id: 'f1', name: '太郎', allergy: ['ごま'], avoid: ['ごま']}]}, '福神漬け', /🔍/],
]){
    const tag = 'S24 ' + (JSON.stringify(st) + JSON.stringify(ex)).slice(0, 60);
    const {p, ctx} = await open(Object.assign({dishCount: 6}, st), 's24-' + tag, ex);
    const c = await p.evaluate(() => { for (let k = 0; k < 800; k++){ session.rejected.clear(); newMenu(); if (CURRY_RICE.has(session.menu.items[0].r.id)) break; } render();
        const s = riceSideOf(session.menu.items[0].r, session.menu.n); return {curry: CURRY_RICE.has(session.menu.items[0].r.id), main: session.menu.items[0].r.id, side: s && s !== 'konomono' ? tsukeName(s) : s}; });
    ok(c.curry && c.side === want, `${tag} カレーの日に ${want}: ` + JSON.stringify(c));
    if (c.curry){
        await p.click('#view [data-act=decide]'); await p.waitForTimeout(500);
        const r = await p.evaluate(() => { const {rows} = todayShopRows(); setTab('cook'); session.stage = 'shop'; render(); return {rows: rows.map(e => e.label), html: (document.querySelector('#view .stage-shop') || {}).innerText || '', text: todayShopText()}; });
        const row = r.html.split('\n').filter(l => l.includes(want));
        ok(r.rows.includes(want) && row.length > 0 && r.text.includes(want), `${tag} 今日の買い物メモ（作り方タブ・送る文）に ${want} の行がある: ` + JSON.stringify(r.rows));
        const block = r.html.slice(r.html.indexOf(want), r.html.indexOf(want) + 80);
        ok(may ? may.test(block) : !/🔍/.test(block), `${tag} ${want} の行の🔍: ` + JSON.stringify(block));
        const week = await p.evaluate(() => shoppingList().filter(e => /福神漬け|らっきょう漬け/.test(e.label)).length);
        void week;
    }
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
