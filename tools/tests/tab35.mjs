#!/usr/bin/env node
// 2つのタブ・窓で使ったときに、保存から消えないことの回帰テスト（第35回 利用者モニター R159〜R162。使い方: node tools/tests/tab35.mjs [http://localhost:8795/]）
//  R159 窓Bの入力欄に打っているあいだ（作り方・手を使わない作り方のときも）に窓Aでアレルギー・家族を足しても、窓Bの保存で消えない。手が空いたら読み直す。打ちかけの文字は戻る
//  R160 読み直しが続いて上限（1分に3回）に届いたあとも、このタブの中身で上書きしない。
//       （第36回 R165 で変更: 上限に届いたら、読み直さずにその場でまぜてそろえる。知らせは出さず、このタブの変更はまぜて保存する）
//  R161 前の版のタブ（このしくみを持たない）が直接上書きして、アレルギー・家族・決めた献立が減ったら、知らせて「元に戻す」で足し戻せる（自動では戻さない）。
//       知らせ（storage）が届かないうちの保存も、書く直前に見て止める
//  R162 条件のシート（class に open がない）を開いているあいだは読み直さない。閉じたら読み直す
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: got ${JSON.stringify(a)} expected ${JSON.stringify(e)}`);
const isReady = () => typeof S !== 'undefined' && typeof session !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *') && GH.booted;
const ready = p => p.waitForFunction(isReady, null, { timeout: 30000 });
const watch = p => { p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) p.errs.push(m.text()); }); return p; };
const origin = p => p.evaluate(() => performance.timeOrigin).catch(() => 0);
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem('gohancho.v1')));
const FAM = [{id: 'f1', name: '娘', role: 'child', avoid: ['@milk'], allergy: ['@milk'], mild: false, sometimes: false, me: false}];

async function pair(){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo', locale: 'ja-JP', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat/, r => r.abort());
    await ctx.addInitScript(() => {
        if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3}}));
        Object.defineProperty(document, 'hidden', { get: () => sessionStorage.getItem('hid') === '1' });
        Object.defineProperty(document, 'visibilityState', { get: () => sessionStorage.getItem('hid') === '1' ? 'hidden' : 'visible' });
    });
    const A = watch(await ctx.newPage()); await A.goto(URL_); await ready(A);
    const B = watch(await ctx.newPage()); await B.goto(URL_); await ready(B);
    await settle(A, B);
    return { ctx, A, B };
}
// 開いたとき・決めたときの書き直しで読み直しあうのが落ち着くまで待つ。読み直しの回数は数えなおす
async function settle(A, B){
    for (let i = 0, last = ''; i < 20; i++){ await A.waitForTimeout(500); const k = JSON.stringify(await Promise.all([A, B].map(origin))); if (k === last) break; last = k; }
    await ready(A); await ready(B);
    for (const p of [A, B]) await p.evaluate(() => sessionStorage.removeItem('gohanOther'));
}
// p が読み直すのを待つ（読み直したら true）
async function reloaded(p, t0, ms = 6000){
    for (let i = 0; i < ms / 200; i++){ await p.waitForTimeout(200); if (await origin(p) !== t0 && await origin(p) !== 0) break; }
    const t = await origin(p); if (t !== t0) await ready(p);
    return t !== t0 && t !== 0;
}

// ================= R159: 入力中 =================
{
    const { ctx, A, B } = await pair();
    await B.evaluate(() => { setTab('fridge'); });
    await B.waitForTimeout(300);
    const vis = await B.evaluate(() => { const i = document.getElementById('ing-input'); return !!(i && i.getClientRects().length); });
    if (!vis) await B.evaluate(() => { const bt = document.querySelector('[data-act="w4x-in"][data-v="text"]'); if (bt) bt.click(); });
    await B.click('#ing-input'); await B.keyboard.type('にんじ');
    const t0 = await origin(B);
    await A.evaluate(fam => { S.settings.allergens = ['egg']; S.family = fam; saveNow(); }, FAM);
    await B.waitForTimeout(600);
    eq(await origin(B), t0, 'R159 入力中は読み直さない');
    eq(await B.evaluate(() => storeInfo.other), true, 'R159 入力中でも、別のタブの保存に気づいて保存を止める');
    await B.keyboard.type('ん'); await B.keyboard.press('Enter');
    await B.waitForTimeout(900);
    const fr = await B.evaluate(() => [S.fridge.includes('にんじん') || S.fridge.some(x => /にんじん|人参/.test(x)), document.activeElement && document.activeElement.id]);
    ok(fr[0], 'R159 Enter で冷蔵庫に入った（画面の上では） ' + JSON.stringify(fr));
    let s = await saved(B);
    eq([s.settings.allergens, (s.family || []).length], [['egg'], 1], 'R159 入力のあとの保存で、別の窓で足したアレルギー・家族を消さない');
    // 第36回 R167: 入力中に入れた冷蔵庫の食材も、まぜて保存する（止めて知らせない）
    ok(s.fridge.some(x => /にんじん|人参/.test(x)), 'R159/R167 入力中に入れた冷蔵庫の食材も保存する');
    ok(await B.evaluate(() => !document.getElementById('gh-note-other')), 'R159/R167 まぜて保存できたので「保存を止めています」は出さない');
    eq(await origin(B), t0, 'R159 入力欄にいるあいだは読み直さない');
    await B.keyboard.type('たまね');
    await B.evaluate(() => document.activeElement.blur());
    ok(await reloaded(B, t0), 'R159 入力欄から出たら読み直す');
    const r = await B.evaluate(() => [S.settings.allergens, S.family.length, location.hash, (document.getElementById('ing-input') || {}).value]);
    eq(r, [['egg'], 1, '#fridge', 'たまね'], 'R159 読み直したあとは新しいデータ・同じ画面・打ちかけの文字は戻る');
    s = await saved(A);
    eq([s.settings.allergens, s.family.length], [['egg'], 1], 'R159 保存も新しいデータのまま');
    eq([...A.errs, ...B.errs], [], 'R159 入力中: 例外なし');
    await ctx.close();
}

// ================= R159: 作り方・手を使わない作り方 =================
{
    const { ctx, A, B } = await pair();
    await B.evaluate(() => { setTab('today'); const d = document.querySelector('[data-act=decide]'); if (d) d.click(); });
    await settle(A, B);
    await B.evaluate(() => { gotoStage('cook'); });
    eq(await B.evaluate(() => [tab, viewingStage(), tabBusy()]), ['cook', 'cook', true], 'R159 作り方（作る段）を開いた');
    await B.waitForTimeout(300);
    const t0 = await origin(B);
    await A.evaluate(fam => { S.settings.allergens = ['egg', 'milk']; S.family = fam; saveNow(); }, FAM);
    await B.waitForTimeout(1200);
    eq(await origin(B), t0, 'R159 作り方を開いているあいだは読み直さない');
    await B.evaluate(() => { S.usedDays = [...S.usedDays, '2026-11-12']; save(); saveNow(); });
    let s = await saved(B);
    eq([s.settings.allergens, s.family.length], [['egg', 'milk'], 1], 'R159 作り方のあいだの保存で、別の窓で足したアレルギー・家族を消さない');
    await B.evaluate(() => setTab('today'));
    ok(await reloaded(B, t0), 'R159 作り方を閉じたら読み直す');
    eq(await B.evaluate(() => [S.settings.allergens, S.family.length]), [['egg', 'milk'], 1], 'R159 作り方: 読み直したあとは新しいデータ');
    // 手を使わない作り方
    await B.evaluate(() => sessionStorage.removeItem('gohanOther'));
    const t1 = await origin(B);
    await B.evaluate(() => { hf.on = true; });
    await A.evaluate(() => { S.settings.allergens = ['egg', 'milk', 'sesame']; saveNow(); });
    await B.waitForTimeout(1200);
    eq(await origin(B), t1, 'R159 手を使わない作り方のあいだは読み直さない');
    await B.evaluate(() => { S.settings.lowSalt = !S.settings.lowSalt; saveNow(); });
    eq((await saved(B)).settings.allergens, ['egg', 'milk', 'sesame'], 'R159 手を使わない作り方のあいだの保存で消さない');
    await B.evaluate(() => { hf.on = false; });
    const okHf = await reloaded(B, t1);
    if (!okHf) console.log('debug', await B.evaluate(() => ({other: storeInfo.other, busy: tabBusy(), tab, hf: hf.on, log: sessionStorage.getItem('gohanOther'), ae: document.activeElement && document.activeElement.outerHTML.slice(0, 120), dlg: dialogOpen()})));
    ok(okHf, 'R159 手を使わない作り方を終えたら読み直す');
    eq([...A.errs, ...B.errs], [], 'R159 作り方: 例外なし');
    await ctx.close();
}

// ================= R162: 条件のシート =================
{
    const { ctx, A, B } = await pair();
    await B.evaluate(() => { setTab('today'); openCondSheet(); });
    await B.waitForTimeout(400);
    const cls = await B.evaluate(() => { const s = document.querySelector('#sheet-root .sheet'); return s ? s.className : ''; });
    ok(/sheet-cond/.test(cls) && !/\bopen\b/.test(cls), 'R162 条件のシートの class に open はない（' + cls + '）');
    ok(await B.evaluate(() => dialogOpen() && tabBusy()), 'R162 条件のシートを開いているのを、開いているとみる');
    const t0 = await origin(B);
    await A.evaluate(() => { S.settings.allergens = ['shrimp']; saveNow(); });
    await B.waitForTimeout(1200);
    eq(await origin(B), t0, 'R162 シートを開いているあいだは読み直さない');
    await B.evaluate(() => { closeSheet(); });
    ok(await reloaded(B, t0), 'R162 シートを閉じたら読み直す');
    eq(await B.evaluate(() => S.settings.allergens), ['shrimp'], 'R162 読み直したあとは新しいデータ');
    // 料理の詳細（#modal-root）も同じ
    await B.evaluate(() => sessionStorage.removeItem('gohanOther'));
    await B.evaluate(() => openModal(RECIPES[0].id));
    await B.waitForTimeout(300);
    const t1 = await origin(B);
    await A.evaluate(() => { S.settings.allergens = ['shrimp', 'crab']; saveNow(); });
    await B.waitForTimeout(1000);
    eq(await origin(B), t1, 'R162 料理の詳細を開いているあいだは読み直さない');
    await B.evaluate(() => closeModal());
    ok(await reloaded(B, t1), 'R162 料理の詳細を閉じたら読み直す');
    eq([...A.errs, ...B.errs], [], 'R162 例外なし');
    await ctx.close();
}

// ================= R160: 読み直しの上限に届いたあと =================
{
    const { ctx, A, B } = await pair();
    await B.evaluate(() => { const n = Date.now(); sessionStorage.setItem('gohanOther', JSON.stringify([n, n, n])); });   // 1分に3回 読み直したあと
    const t0 = await origin(B);
    await A.evaluate(fam => { S.settings.allergens = ['sesame']; S.family = fam; saveNow(); }, FAM);
    await B.waitForTimeout(800);
    eq(await origin(B), t0, 'R160 上限に届いたあとは、勝手には読み直さない');
    // 第36回 R165: 上限に届いたら、その場でまぜてそろえる（知らせ・「読み直す」は出さない）
    eq(await B.evaluate(() => [!!document.getElementById('gh-note-other'), storeInfo.other, S.settings.allergens, S.family.length]), [false, false, ['sesame'], 1], 'R160/R165 上限に届いたら、読み直さずにその場で新しい中身にそろえる');
    for (let i = 0; i < 3; i++){
        await B.evaluate(i => { S.usedDays = [...S.usedDays, '2026-12-0' + (i + 1)]; S.settings.lowSalt = !!(i % 2); save(); saveNow(); }, i);
        await B.waitForTimeout(200);
    }
    const s = await saved(A);
    eq([s.settings.allergens, s.family.length], [['sesame'], 1], 'R160 上限に届いたあとの保存でも、別のタブのアレルギー・家族を消さない');
    ok(s.usedDays.includes('2026-12-03'), 'R160/R165 上限に届いたあとのこのタブの変更も保存する');
    eq(await origin(B), t0, 'R160 保存しようとしても勝手には読み直さない');
    // もう一度あちらで変わっても、上限のあいだはその場でまぜる。このタブの変更（減塩）とあちらの変更（えび）が両方残る
    await A.evaluate(() => { S.settings.allergens = [...S.settings.allergens, 'shrimp']; saveNow(); });
    await B.waitForTimeout(500);
    await B.evaluate(() => { S.settings.lowSalt = true; save(); saveNow(); });
    const s2 = await saved(B);
    eq([s2.settings.allergens, s2.settings.lowSalt, await B.evaluate(() => !!document.getElementById('gh-note-other'))], [['sesame', 'shrimp'], true, false], 'R160/R165 上限のあいだも、両方の変更をまぜて保存し、止めて知らせない');
    eq(await origin(B), t0, 'R160 上限のあいだは読み直さない');
    eq([...A.errs, ...B.errs], [], 'R160 例外なし');
    await ctx.close();
}

// ================= R161: 前の版のタブの上書き =================
{
    const { ctx, A, B } = await pair();
    await B.evaluate(fam => { setTab('today'); const d = document.querySelector('[data-act=decide]'); if (d) d.click(); setTab('today'); S.settings.allergens = ['egg']; S.family = [...fam, {id: 'f2', name: '父', role: 'adult', avoid: ['@shrimp'], allergy: ['@shrimp'], mild: false, sometimes: false, me: false}]; saveNow(); }, FAM);
    await settle(A, B);
    const mine = await B.evaluate(() => JSON.parse(JSON.stringify({cook: S.cook, family: S.family, allergens: S.settings.allergens})));
    ok(mine.cook && mine.cook.ids.length > 0, 'R161 献立を決めた');
    // A を前の版のタブにみたてる: 自分の古い中身（減ったもの・別の変更）を直接書く（前の版は書く前に確かめない）
    const t0 = await origin(B);
    await A.evaluate(() => {
        const old = JSON.parse(localStorage.getItem('gohancho.v1'));
        old.settings.allergens = []; old.family = [Object.assign({}, old.family[0], {avoid: [], allergy: []})]; old.cook = null; old.day = {}; old.settings.lowSalt = true;
        localStorage.setItem('gohancho.v1', JSON.stringify(old));
    });
    ok(await reloaded(B, t0), 'R161 見えているタブは読み直す');
    const r = await B.evaluate(() => { const n = document.getElementById('gh-note-lost'); return { note: n ? [n.innerText, [...n.querySelectorAll('[data-gh]')].map(x => x.dataset.gh)] : null, alg: S.settings.allergens, fam: S.family.length, cook: S.cook, low: S.settings.lowSalt }; });
    ok(r.note && /一部が消えました/.test(r.note[0]) && r.note[1].join() === 'lostundo,close', 'R161 減ったことを知らせ、「元に戻す」「閉じる」を出す ' + JSON.stringify(r.note));
    eq([r.alg, r.fam, r.cook, r.low], [[], 1, null, true], 'R161 自動では戻さない');
    await Promise.all([B.waitForEvent('load', { timeout: 15000 }).catch(() => {}), B.click('#gh-note-lost [data-gh="lostundo"]')]);
    await ready(B);
    const u = await B.evaluate(() => ({ alg: S.settings.allergens, fam: S.family.map(m => [m.id, m.allergy]), cook: S.cook && S.cook.ids, low: S.settings.lowSalt, note: !!document.getElementById('gh-note-lost') }));
    eq([u.alg, u.fam, u.cook, u.low, u.note], [['egg'], [['f1', ['@milk']], ['f2', ['@shrimp']]], mine.cook.ids, true, false], 'R161 「元に戻す」で、足りないものだけ足し戻す（あちらの別の変更はそのまま）');
    const s = await saved(B);
    eq([s.settings.allergens, s.family.length, s.family[0].allergy, s.cook && s.cook.ids], [['egg'], 2, ['@milk'], mine.cook.ids], 'R161 足し戻したものを保存する');
    // 知らせ（storage）が届く前の保存: 書く直前に、いまの保存がこのタブの知っている中身と違えば書かない
    await settle(A, B);
    const g = await A.evaluate(() => {
        storeInfo.other = false;
        const cur = JSON.parse(localStorage.getItem('gohancho.v1')); cur.settings.allergens = ['egg', 'wheat'];
        localStorage.setItem('gohancho.v1', JSON.stringify(cur));   // 自分のページで書いたものには storage の知らせが来ない（別のタブの知らせがまだ届いていないのと同じ）
        S.settings.allergens = []; S.settings.diet = true; saveNow(true);
        const now = JSON.parse(localStorage.getItem('gohancho.v1'));
        return [now.settings.allergens, now.settings.diet === true];
    });
    // 第36回 R165: 書く直前に気づいたら、上書きせずにまぜる（あちらで足した小麦は残す。このタブで外した卵は、消した印があるので外す）
    eq(g, [['wheat'], true], 'R161 知らせが届く前でも、書く直前に見て上書きせず、まぜて保存する');
    await A.waitForTimeout(1500);
    eq((await saved(B)).settings.allergens, ['wheat'], 'R161 そのあとも消えない');
    eq([...A.errs, ...B.errs], [], 'R161 例外なし');
    await ctx.close();
}

await b.close();
console.log(`tab35: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
