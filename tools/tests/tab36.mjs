#!/usr/bin/env node
// 2つのタブ・窓で使ったときに、止まらず・消えずに保存できることの回帰テスト（第36回 利用者モニター R165〜R168。使い方: node tools/tests/tab36.mjs [http://localhost:8795/]）
//  R165 2つのタブを1分に8回切りかえたあと（読み直しの上限に届いたタブ）で足したごま・決めた献立・減塩が保存され、もう片方にも出る。
//       切りかえ1回（visibilitychange と focus）は読み直し1回と数える
//  R166 別のタブでわざと消した（家族を消す・アレルギーを外す・家族のアレルギーを外す・献立をやめる）ときは「一部が消えました」を出さない。
//       前の版のふりをした直接の上書きでは出る。ボタンは「消えた分を戻す」で、どの言語でも「キャンセル」と読めない訳
//  R167 入力中・シート・作る段のあいだにこのタブで入れた冷蔵庫の食材・家族の名前・「買えた」の印・気分が、手が空いたときの読み直しで消えない。
//       打ちかけの文字は、読み直しが続いても戻る
//  R168 幅195・文字もっと大きいで、2つのタブの知らせのボタンが枠を送らずに見え、知らせが画面の半分未満（18言語）
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: got ${JSON.stringify(a)} expected ${JSON.stringify(e)}`);
const isReady = () => typeof S !== 'undefined' && typeof session !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *') && GH.booted;
const ready = p => p.waitForFunction(isReady, null, { timeout: 30000 });
const watch = p => { p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) p.errs.push(m.text()); }); return p; };
const origin = p => p.evaluate(() => performance.timeOrigin).catch(() => 0);
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem('gohancho.v1')));
const ev = (p, f, a) => p.evaluate(f, a).catch(async e => { if (!/context was destroyed|navigation/i.test(e.message)) throw e; await ready(p); return null; });
const FAM = [{id: 'f1', name: '娘', role: 'child', avoid: ['@milk'], allergy: ['@milk'], mild: false, sometimes: false, me: false}, {id: 'f2', name: '父', role: 'adult', avoid: ['@shrimp'], allergy: ['@shrimp'], mild: false, sometimes: false, me: false}];

async function pair(seed){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo', locale: 'ja-JP', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat/, r => r.abort());
    await ctx.addInitScript(s => {
        if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3}}, s || {})));
        Object.defineProperty(document, 'hidden', { get: () => sessionStorage.getItem('hid') === '1' });
        Object.defineProperty(document, 'visibilityState', { get: () => sessionStorage.getItem('hid') === '1' ? 'hidden' : 'visible' });
    }, seed || null);
    const A = watch(await ctx.newPage()); await A.goto(URL_); await ready(A);
    const B = watch(await ctx.newPage()); await B.goto(URL_); await ready(B);
    await settle(A, B);
    return { ctx, A, B };
}
async function settle(A, B){
    for (let i = 0, last = ''; i < 20; i++){ await A.waitForTimeout(500); const k = JSON.stringify(await Promise.all([A, B].map(origin))); if (k === last) break; last = k; }
    await ready(A); await ready(B);
    for (const p of [A, B]) await p.evaluate(() => sessionStorage.removeItem('gohanOther'));
}
async function reloaded(p, t0, ms = 6000){
    for (let i = 0; i < ms / 200; i++){ await p.waitForTimeout(200); if (await origin(p) !== t0 && await origin(p) !== 0) break; }
    const t = await origin(p); if (t !== t0) await ready(p);
    return t !== t0 && t !== 0;
}
const setHidden = (p, h) => ev(p, h => { sessionStorage.setItem('hid', h ? '1' : '0'); document.dispatchEvent(new Event('visibilitychange')); if (!h) window.dispatchEvent(new Event('focus')); }, h);
const lostNote = p => p.evaluate(() => { const n = document.getElementById('gh-note-lost'); return n ? [n.innerText, [...n.querySelectorAll('[data-gh]')].map(x => x.dataset.gh + ':' + x.textContent)] : null; });

// ================= R165: 1分に8回切りかえたあと =================
{
    const { ctx, A, B } = await pair();
    // 切りかえ1回（visibilitychange と focus の両方が来る）は、読み直し1回と数える
    await setHidden(B, true);
    await A.evaluate(() => { S.usedDays = [...S.usedDays, '2026-12-20']; saveNow(); });
    let t0 = await origin(B);
    await setHidden(B, false);
    ok(await reloaded(B, t0), 'R165 戻ってきたら読み直す');
    eq(await B.evaluate(() => JSON.parse(sessionStorage.getItem('gohanOther') || '[]').length), 1, 'R165 切りかえ1回（visibilitychange と focus）は1回と数える');
    // 1分に8回切りかえる（そのたびに A で変えて、B はこの間にも変える）
    for (let i = 0; i < 8; i++){
        await setHidden(B, true);
        await A.evaluate(i => { S.usedDays = [...S.usedDays, '2026-12-0' + (i + 1)]; saveNow(); }, i);
        await ev(B, i => { S.stockLog = [...(S.stockLog || []), {d: '2026-11-10', n: 'b' + i}]; save(); }, i);   // 見ていないあいだのこのタブの保存（裏に回るときなど）
        await B.waitForTimeout(350);
        t0 = await origin(B);
        await setHidden(B, false);
        await reloaded(B, t0, 1500);
        await ready(B);
    }
    const st = await B.evaluate(() => ({ log: JSON.parse(sessionStorage.getItem('gohanOther') || '[]').length, other: !!storeInfo.other, note: !!document.getElementById('gh-note-other') }));
    ok(st.log <= 3, 'R165 読み直しは1分に3回まで ' + JSON.stringify(st));
    eq([st.other, st.note], [false, false], 'R165 上限に届いても止まらない（「保存を止めています」は出ない）');
    // 止まったはずのタブ（B）で、ごまを足す・献立を決める・減塩を入れる
    await A.evaluate(() => { S.settings.allergens = ['egg']; saveNow(); });   // その直前にも、あちらで変わる
    await B.waitForTimeout(500);
    await ev(B, () => { S.settings.allergens = [...new Set([...S.settings.allergens, 'sesame'])]; save(); reconcileMenu(); setTab('today'); });
    await B.waitForTimeout(600); await ready(B);
    await ev(B, () => { setTab('today'); const d = document.querySelector('[data-act=decide]'); if (d) d.click(); });
    await B.waitForTimeout(600); await ready(B);
    await ev(B, () => { S.settings.lowSalt = true; save(); });
    await B.waitForTimeout(1500); await ready(B);
    const s = await saved(B), today = await B.evaluate(() => TODAY);
    eq([s.settings.allergens.slice().sort(), s.settings.lowSalt, !!(s.cook && s.cook.d === today && s.cook.ids.length)], [['egg', 'sesame'], true, true], 'R165 止まったはずのタブで足したごま・決めた献立・減塩が保存される（あちらの卵も残る）');
    ok(['2026-12-01', '2026-12-08', '2026-12-20'].every(d => s.usedDays.includes(d)) && ['b0', 'b7'].every(n => (s.stockLog || []).some(x => x.n === n)), 'R165 切りかえのあいだの両方の変更が残る');
    eq(await B.evaluate(() => !!document.getElementById('gh-note-other')), false, 'R165 知らせは出ない');
    await settle(A, B);
    const a = await A.evaluate(() => [S.settings.allergens.slice().sort(), S.settings.lowSalt, !!(S.cook && S.cook.d === TODAY)]);
    eq(a, [['egg', 'sesame'], true, true], 'R165 もう片方のタブにも出る');
    eq([...A.errs, ...B.errs], [], 'R165 例外なし');
    await ctx.close();
}

// ================= R166: わざと消したときは「消えました」を出さない =================
{
    const { ctx, A, B } = await pair({ family: FAM, settings: {country: 'JP', uiLang: 'ja', dishCount: 3, allergens: ['egg', 'milk']} });
    const step = async (label, f) => {
        const t0 = await origin(B);
        await A.evaluate(f);
        ok(await reloaded(B, t0), `R166 ${label}: 見えているタブは読み直す`);
        await B.waitForTimeout(500);
        eq(await lostNote(B), null, `R166 ${label}: わざと消したときは「一部が消えました」を出さない`);
        await settle(A, B);
    };
    await step('家族を消す', () => { S.family = S.family.filter(m => m.id !== 'f2'); save(); });
    eq(await B.evaluate(() => S.family.map(m => m.id)), ['f1'], 'R166 家族を消したのが、もう片方にも出る');
    await step('乳アレルギーを外す', () => { S.settings.allergens = S.settings.allergens.filter(x => x !== 'milk'); save(); });
    await step('家族のアレルギーを外す', () => { const m = S.family.find(x => x.id === 'f1'); m.allergy = []; m.avoid = []; save(); });
    eq(await B.evaluate(() => [S.settings.allergens, S.family[0].allergy]), [['egg'], []], 'R166 外したものが、もう片方でも外れている');
    await A.evaluate(() => { setTab('today'); const d = document.querySelector('[data-act=decide]'); if (d) d.click(); });
    await settle(A, B);
    await step('献立をやめる', () => { S.cook = null; save(); });
    // 前の版のふりをした直接の上書き（消した印なし）: 知らせが出る
    await A.evaluate(() => { S.settings.allergens = ['egg', 'wheat']; S.family[0].avoid = ['@milk']; S.family[0].allergy = ['@milk']; saveNow(); });
    await settle(A, B);
    const t0 = await origin(B);
    await A.evaluate(() => { const old = JSON.parse(localStorage.getItem('gohancho.v1')); delete old.dels; old.settings.allergens = ['egg']; old.family[0].allergy = []; localStorage.setItem('gohancho.v1', JSON.stringify(old)); });
    ok(await reloaded(B, t0), 'R166 前の版の上書き: 読み直す');
    const n = await lostNote(B);
    ok(n && /一部が消えました/.test(n[0]) && n[1].join() === 'lostundo:消えた分を戻す,close:閉じる', 'R166 前の版の上書きでは「一部が消えました」と「消えた分を戻す」を出す ' + JSON.stringify(n));
    await Promise.all([B.waitForEvent('load', { timeout: 15000 }).catch(() => {}), B.click('#gh-note-lost [data-gh="lostundo"]')]);
    await ready(B);
    eq(await B.evaluate(() => [S.settings.allergens, S.family[0].allergy]), [['egg', 'wheat'], ['@milk']], 'R166 「消えた分を戻す」で消えた分だけ戻る');
    eq([...A.errs, ...B.errs], [], 'R166 例外なし');
    await ctx.close();
}
// ボタンの訳: どの言語でも「キャンセル」「取り消し」と読めない
{
    const bad = /annul|cancel|abbrech|anuluj|iptal|vazge|キャンセル|取消|取り消|취소|ยกเลิก|hủy|huỷ|batal|kanselahin|إلغاء|रद्द|undo|deshacer|desfazer|rückgängig|cofnij|geri al|되돌리기 취소|撤销|撤銷|annuller/i;
    const dir = path.join(HERE, '../../gohancho/i18n'), outs = [];
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))){
        const m = fs.readFileSync(path.join(dir, f), 'utf8').match(/"消えた分を戻す":\s*"([^"]+)"/);
        if (!m) outs.push(f + ': 訳がない'); else if (bad.test(m[1])) outs.push(f + ': ' + m[1]);
    }
    eq(outs, [], 'R166 「消えた分を戻す」の訳がそろい、どれも「キャンセル」「元に戻す（Undo）」と読めない');
}

// ================= R167: 手がふさがっている間にこのタブで入れたもの =================
{
    const { ctx, A, B } = await pair({ family: [FAM[0]] });
    // (a) 冷蔵庫: 入力欄で Enter
    await B.evaluate(() => { setTab('fridge'); });
    await B.waitForTimeout(300);
    if (!(await B.evaluate(() => { const i = document.getElementById('ing-input'); return !!(i && i.getClientRects().length); }))) await B.evaluate(() => { const bt = document.querySelector('[data-act="w4x-in"][data-v="text"]'); if (bt) bt.click(); });
    await B.click('#ing-input'); await B.keyboard.type('にんじ');
    let t0 = await origin(B);
    await A.evaluate(() => { S.settings.allergens = ['egg']; saveNow(); });
    await B.waitForTimeout(500);
    await B.keyboard.type('ん'); await B.keyboard.press('Enter');
    await B.waitForTimeout(700);
    await B.evaluate(() => document.activeElement && document.activeElement.blur());
    ok(await reloaded(B, t0), 'R167 冷蔵庫: 入力欄から出たら読み直す');
    eq(await B.evaluate(() => [S.fridge.some(x => /にんじん|人参/.test(x)), S.settings.allergens]), [true, ['egg']], 'R167 冷蔵庫: Enter で入れた「にんじん」が読み直しで消えない（あちらの卵も入る）');
    await settle(A, B);
    // (b) 家族の名前に打ち足す
    await B.evaluate(() => { session.famOpen = 'f1'; setGo('family-profile'); });
    await B.waitForTimeout(500);
    const nameSel = '[data-fm="f1"] .fam-name, .fam-name';
    await B.click(nameSel); await B.keyboard.press('End'); await B.keyboard.type('く');
    t0 = await origin(B);
    await A.evaluate(() => { S.settings.allergens = ['egg', 'wheat']; saveNow(); });
    await B.waitForTimeout(500);
    await B.keyboard.type('ん');
    await B.waitForTimeout(600);
    await B.evaluate(() => document.activeElement && document.activeElement.blur());
    ok(await reloaded(B, t0), 'R167 名前: 入力欄から出たら読み直す');
    eq(await B.evaluate(() => [S.family[0].name, S.settings.allergens]), ['娘くん', ['egg', 'wheat']], 'R167 名前: 打ち足した「くん」が読み直しで消えない');
    eq((await saved(A)).family[0].name, '娘くん', 'R167 名前: 保存にも入る');
    await settle(A, B);
    // (c) 作る段の「買えた」の印
    await B.evaluate(() => { setTab('today'); const d = document.querySelector('[data-act=decide]'); if (d) d.click(); });
    await settle(A, B);
    await B.evaluate(() => { gotoStage('cook'); });
    eq(await B.evaluate(() => tabBusy()), true, 'R167 作る段を開いた');
    t0 = await origin(B);
    await A.evaluate(() => { S.settings.lowSalt = true; saveNow(); });
    await B.waitForTimeout(500);
    const key = await B.evaluate(() => { const r = todayShopRows().rows[0]; const k = r ? r.key : 'x|test'; shopMark('got', k, true); save(); return k; });
    await B.waitForTimeout(700);
    await B.evaluate(() => setTab('today'));
    ok(await reloaded(B, t0), 'R167 買えた: 作る段を閉じたら読み直す');
    eq(await B.evaluate(k => [((S.cook.shop || {}).got || []).includes(k), S.settings.lowSalt], key), [true, true], 'R167 買えた: 作る段で付けた「買えた」の印が読み直しで消えない');
    await settle(A, B);
    // (d) 条件のシートで選んだ気分
    await B.evaluate(() => { S.cook = null; save(); session.mood = 'all'; setTab('today'); });
    await settle(A, B);
    await B.evaluate(() => { setTab('today'); openCondSheet(); });
    await B.waitForTimeout(400);
    t0 = await origin(B);
    await A.evaluate(() => { S.settings.diet = true; saveNow(); });
    await B.waitForTimeout(500);
    await B.evaluate(() => { const c = document.querySelector('#sheet-root [data-act="mood"][data-k="quick"]'); if (c) c.click(); else { session.mood = 'quick'; newMenu(); } });
    await B.waitForTimeout(700);
    await B.evaluate(() => closeSheet());
    ok(await reloaded(B, t0), 'R167 気分: シートを閉じたら読み直す');
    eq(await B.evaluate(() => [session.mood, S.settings.diet === true]), ['quick', true], 'R167 気分: シートで選んだ気分（20分以内）が読み直しで「おまかせ」に戻らない');
    await settle(A, B);
    // (e) 打ちかけの文字は、読み直しが続いても戻る（3回続けて）
    await B.evaluate(() => { setTab('fridge'); });
    await B.waitForTimeout(300);
    if (!(await B.evaluate(() => { const i = document.getElementById('ing-input'); return !!(i && i.getClientRects().length); }))) await B.evaluate(() => { const bt = document.querySelector('[data-act="w4x-in"][data-v="text"]'); if (bt) bt.click(); });
    await B.click('#ing-input'); await B.keyboard.type('たまね');
    let lost = 0;
    for (let i = 0; i < 3; i++){
        await B.evaluate(() => sessionStorage.removeItem('gohanOther'));
        t0 = await origin(B);
        await A.evaluate(i => { S.usedDays = [...S.usedDays, '2026-12-1' + i]; saveNow(); }, i);
        if (i === 0){ await B.waitForTimeout(300); await B.evaluate(() => document.activeElement && document.activeElement.blur()); }
        await reloaded(B, t0);
        await B.waitForTimeout(i === 1 ? 50 : 600);   // 2回めは、戻す前に次の読み直しが来る
        const v = await B.evaluate(() => (document.getElementById('ing-input') || {}).value || '').catch(() => '');
        if (i !== 1 && v !== 'たまね') lost++;
    }
    await B.waitForTimeout(800);
    const v = await B.evaluate(() => (document.getElementById('ing-input') || {}).value || '');
    eq([lost, v], [0, 'たまね'], 'R167 打ちかけの文字は、読み直しが続いても戻る');
    eq([...A.errs, ...B.errs], [], 'R167 例外なし');
    await ctx.close();
}

// ================= まぜ方の決まり（merge3） =================
{
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const p = watch(await ctx.newPage()); await p.goto(URL_); await ready(p);
    const r = await p.evaluate(() => {
        const N = o => normalizeState(o), F = (id, al) => ({id, name: id, role: 'adult', avoid: al.slice(), allergy: al.slice(), mild: false, sometimes: false, me: false});
        const cx = (mineNewer, t, m) => ({mineNewer, delT: delHas(t), delM: delHas(m)});
        const base = N({fridge: ['a', 'b'], settings: {allergens: ['egg', 'milk'], servings: 2}, family: [F('f1', ['@milk']), F('f2', [])], cook: {d: '2026-11-10', ids: ['x']}, week: {start: '2026-11-09', days: [{d: '2026-11-09', id: 'p'}, {d: '2026-11-10', id: 'q'}]}, history: [{id: 'h1', d: '2026-11-01'}]});
        const theirs = N(Object.assign(structuredClone(base), {fridge: ['a', 'b', 'c'], settings: Object.assign({}, base.settings, {allergens: ['egg'], servings: 4}), family: [F('f1', [])], cook: {d: '2026-11-10', ids: ['y']}, week: {start: '2026-11-09', days: [{d: '2026-11-09', id: 'p2'}, {d: '2026-11-10', id: 'q'}]}, history: [{id: 'h2', d: '2026-11-02'}, {id: 'h1', d: '2026-11-01'}]}));
        const mine = N(Object.assign(structuredClone(base), {fridge: ['b', 'd'], settings: Object.assign({}, base.settings, {allergens: ['egg', 'milk', 'sesame'], lowSalt: true}), cook: {d: '2026-11-10', ids: ['z']}, week: {start: '2026-11-09', days: [{d: '2026-11-09', id: 'p'}, {d: '2026-11-10', id: 'q3'}]}, history: [{id: 'h3', d: '2026-11-03'}, {id: 'h1', d: '2026-11-01'}]}));
        const o1 = N(merge3(base, theirs, mine, cx(true, theirs, mine)));
        // あちらがわざと消した（印あり）
        const t2 = Object.assign(structuredClone(theirs), {dels: [{k: 'a', v: 'milk', t: Date.now()}, {k: 'f', v: 'f2', t: Date.now()}, {k: 'fa', v: '@milk', m: 'f1', t: Date.now()}]});
        const o2 = N(merge3(base, t2, mine, cx(false, t2, mine)));
        return {
            fridge: o1.fridge, alg1: o1.settings.allergens, sv: o1.settings.servings, low: o1.settings.lowSalt, fam1: o1.family.map(m => [m.id, m.allergy]), cook1: o1.cook.ids, week1: o1.week.days.map(x => x.id), hist: o1.history.map(h => h.id).sort(),
            alg2: o2.settings.allergens, fam2: o2.family.map(m => [m.id, m.allergy]), cook2: o2.cook.ids,
        };
    });
    eq(r.fridge, ['b', 'c', 'd'], 'M 冷蔵庫は両方の足し引き');
    eq([r.sv, r.low], [4, true], 'M 欄ごと: あちらが変えた人数・このタブが変えた減塩の両方');
    eq(r.alg1, ['egg', 'milk', 'sesame'], 'M アレルギー: 印なしで消えた乳は残し、このタブで足したごまも残す');
    eq(r.fam1, [['f1', ['@milk']], ['f2', []]], 'M 家族: 印なしで消えた人・アレルギーは残す');
    eq([r.cook1, r.week1], [['z'], ['p2', 'q3']], 'M 決めた献立は新しい方。1週間は日ごと（違う日は両方）');
    eq(r.hist, ['h1', 'h2', 'h3'], 'M 記録は両方で足したものを残す');
    eq([r.alg2, r.fam2, r.cook2], [['egg', 'sesame'], [['f1', []]], ['y']], 'M わざと消した印があれば消す・あちらが新しければあちらの献立');
    eq(p.errs, [], 'M 例外なし');
    await ctx.close();
}

// ================= R168: 幅195・文字もっと大きい =================
{
    const LANGS = ['ja', 'en', 'de', 'es', 'fr', 'it', 'pt-BR', 'pl', 'tr', 'ar', 'hi', 'id', 'fil', 'th', 'vi', 'ko', 'zh-Hans', 'zh-Hant'];
    const bad = [];
    for (const [w, h, ts] of [[195, 422, 2], [195, 422, 0], [260, 640, 2]]){
        const ctx = await b.newContext({ viewport: { width: w, height: h }, timezoneId: 'Asia/Tokyo', locale: 'ja-JP', serviceWorkers: 'block' });
        await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat/, r => r.abort());
        const p = watch(await ctx.newPage());
        for (const L of LANGS){
            await p.evaluate(([L, ts]) => { localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: L, dishCount: 3}, ts ? {textSize: ts} : {})})); }, [L, ts]).catch(() => {});
            await p.goto(URL_); await ready(p); await p.waitForTimeout(200);
            for (const id of ['other', 'lost']){
                const r = await p.evaluate(id => {
                    GH.clear('other'); GH.clear('lost'); otherNoted = false;
                    if (id === 'other') otherNote(true); else lostNote();
                    const box = document.getElementById('gh-note-' + id), host = document.getElementById('gh-notes'), hr = host.getBoundingClientRect(), br = box.getBoundingClientRect();
                    const btns = [...box.querySelectorAll('button')].map(x => { const q = x.getBoundingClientRect(); return {t: x.textContent, top: q.top, bottom: q.bottom, left: q.left, right: q.right, h: q.height, w: q.width}; });
                    const col = getComputedStyle(box).borderTopColor.match(/\d+/g).map(Number);
                    const out = {h: br.height, vh: innerHeight, scroll: host.scrollHeight - host.clientHeight, btns, blue: col[2] > col[0] + 40 && col[2] > col[1] + 40, ts: document.documentElement.getAttribute('data-ts')};
                    GH.clear(id);
                    return out;
                }, id);
                const why = [];
                if (r.h >= r.vh / 2) why.push(`高さ ${Math.round(r.h)}/${r.vh}`);
                if (r.scroll > 1) why.push('枠を送らないと見えない');
                if (r.blue) why.push('青');
                r.btns.forEach(x => { if (x.top < 0 || x.bottom > r.vh || x.left < 0 || x.right > w + 0.5 || x.h < 43.5 || x.w < 44) why.push(`ボタン「${x.t}」${Math.round(x.top)}-${Math.round(x.bottom)} ${Math.round(x.w)}x${Math.round(x.h)}`); });
                if (r.btns.length !== 2) why.push('ボタンが2つでない');
                if (why.length) bad.push(`${w}x${h} ts${ts} ${L} ${id}: ${why.join(' / ')}`);
            }
        }
        eq(p.errs, [], `R168 ${w}x${h} ts${ts} 例外なし`);
        await ctx.close();
    }
    ok(!bad.length, 'R168 2つのタブの知らせ: ボタンが見えて押せる・画面の半分未満・青を使わない（18言語） ' + bad.slice(0, 8).join(' | ') + (bad.length > 8 ? ` …ほか${bad.length - 8}` : ''));
}

await b.close();
console.log(`tab36: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
