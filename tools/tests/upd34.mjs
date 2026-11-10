#!/usr/bin/env node
// 更新したあとに利用者の端末で起きることの回帰テスト（第34回 品質保証。使い方: node tools/tests/upd34.mjs [http://localhost:8795/]）
//  A. 前の版（v100・v120・v126。tools/tests/fixtures/upd34-*.json は、その版を実際に開いて家族・アレルギー・モードを入れ、
//     献立を決めたときの保存データ）で v128 を開く: 例外なし・家族とアレルギーと苦手がそのまま・アレルギーが効く・決めた献立がそのまま
//     （合わない料理が入っていても勝手に変えず、知らせだけ出す）・昨日の二日酔いは効かない・ダイエット／減塩はそのまま・設定のタブは「家族」から
//  B. サービスワーカーの更新: 前の版を入れて10分以内（GitHub Pages の一時保存の長さ）に新しい版が来ても、新しい版の保存に前の版の画面・言葉が入らない。
//     電波がない所で開いても新しい版で開く（直す前は前の版に戻っていた）。このテストは自分でサーバーを立てる（max-age=600 を付ける）
//  C. 2つのタブ: 片方でアレルギー・家族を足したあと、もう片方（前から開いていたタブ）が古いデータで上書きしない。戻ってきたら読み直す
//  D. 保存場所の不調: 書けない（容量いっぱい）・読めない（プライベートモード）・壊れた JSON でも起動して献立が出る。壊れたデータは残る
//  E. 日付: 夏時間の切りかわり（ニューヨーク・ベルリン）でも、決めた献立と二日酔いの日は朝4時で切りかわる。前の日に決めた献立は変わらない
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '../../gohancho');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: got ${JSON.stringify(a)} expected ${JSON.stringify(e)}`);
const isReady = () => typeof S !== 'undefined' && typeof session !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *');
const ready = p => p.waitForFunction(isReady, null, { timeout: 30000 });
// 読み直しの最中に読みに行ったとき（CI の遅い機械で、別のタブの保存を受けて2回読み直すことがある）は、読みこみが終わってから読みなおす。読み直したかどうかの確かめは performance.timeOrigin でしているので、ここでは中身だけを読みなおす
const watch = p => { p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) p.errs.push(m.text()); }); const ev0 = p.evaluate.bind(p); p.evaluate = async (...a) => { for (let i = 0; ; i++){ try{ return await ev0(...a); }catch(e){ if (i >= 4 || !/context was destroyed|navigation/i.test(e.message)) throw e; await p.waitForLoadState('load').catch(() => {}); await p.waitForFunction(() => typeof S !== 'undefined' && document.querySelector('#app, body'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(300); } } }; return p; };
async function ctxOf(o = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: o.tz || 'Asia/Tokyo', locale: o.locale || 'ja-JP', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat/, r => r.abort());
    return ctx;
}
async function openWith(raw, o = {}){
    const ctx = await ctxOf(o);
    const p = watch(await ctx.newPage()); p.ctx = ctx;
    await p.clock.install({ time: new Date(o.time || '2026-11-10T18:00:00+09:00') });
    if (o.init) await p.addInitScript(o.init);
    await p.addInitScript(x => { try{ if (x != null && !sessionStorage.getItem('seeded')){ localStorage.setItem('gohancho.v1', x); sessionStorage.setItem('seeded', '1'); } }catch(e){} }, raw);
    await p.goto(URL_); await ready(p); await p.waitForTimeout(500);
    return p;
}

// ================= A. 前の版の保存データで開く =================
for (const f of ['v100_ja', 'v120_ja', 'v120_en', 'v126_ja']){
    const OLD = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', `upd34-${f}.json`), 'utf8'));
    const p = await openWith(JSON.stringify(OLD), { locale: f.endsWith('en') ? 'en-US' : 'ja-JP' });
    const a = await p.evaluate(() => {
        setTab('today');
        const has = (r, re) => r.items.some(i => !i.opt && re.test(String(i.key || '') + ' ' + String(i.text || '')));
        const egg = RECIPES.filter(r => has(r, /^卵|卵 /)), ebi = RECIPES.filter(r => has(r, /えび|かに/)), hit = RECIPES.filter(r => allergyConflict(r));
        const saved = JSON.parse(localStorage.getItem('gohancho.v1') || '{}');
        return { S: JSON.parse(JSON.stringify(S)), saved, menu: menuIds(), hangOn: hangOn(), modes: modesOn(), setTab: (setTabCur(), session.setTab),
            hit: hit.length, hitOk: hit.filter(r => !isAvoided(r)).map(r => r.id).slice(0, 5), egg: egg.length, eggOk: egg.filter(r => !isAvoided(r)).map(r => r.id).slice(0, 5), ebi: ebi.length, ebiOk: ebi.filter(r => !isAvoided(r)).map(r => r.id).slice(0, 5),
            cookAv: S.cook.ids.filter(id => isAvoided(byId(id))), note: ((document.querySelector('#gh-notes') || document.body).innerText || '') };
    });
    const L = `A ${f}`;
    for (const s of [a.S, a.saved]){
        eq(s.family, OLD.family, `${L}: 家族（アレルギー・苦手）がそのまま`);
        eq(s.settings.allergens, OLD.settings.allergens, `${L}: 本人のアレルギーがそのまま`);
        eq(s.settings.avoid, OLD.settings.avoid, `${L}: 苦手がそのまま`);
        eq(s.cook, OLD.cook, `${L}: 決めた献立（S.cook）がそのまま`);
        eq([s.settings.diet, s.settings.lowSalt, s.settings.country, s.settings.uiLang], [OLD.settings.diet, OLD.settings.lowSalt, OLD.settings.country, OLD.settings.uiLang], `${L}: ダイエット・減塩・国・言語がそのまま`);
    }
    eq(a.menu, OLD.cook.ids, `${L}: 今日の献立は決めた献立のまま（作り直さない）`);
    ok(a.hit > 0 && a.hitOk.length === 0, `${L}: アレルギーに当たる料理は出さない ${a.hit} ${JSON.stringify(a.hitOk)}`);
    if (OLD.settings.country === 'JP'){
        ok(a.egg > 0 && a.eggOk.length === 0, `${L}: 家族の卵のアレルギーが効く ${JSON.stringify(a.eggOk)}`);
        ok(a.ebi > 0 && a.ebiOk.length === 0, `${L}: えび・かにのアレルギーが効く ${JSON.stringify(a.ebiOk)}`);
    }
    if (a.cookAv.length) ok(/アレルギー|allerg/i.test(a.note), `${L}: 決めた献立に合わない料理があれば知らせる（変えない）`);
    eq(a.hangOn, false, `${L}: 昨日の「二日酔い」は今日は効かない`);
    eq(a.modes, 2, `${L}: モードはダイエット・減塩の2つ`);
    eq(a.setTab, 'family', `${L}: 設定のタブは「家族」から`);
    // 設定・モードを開いても落ちない
    await p.evaluate(() => { for (const tb of ['settings', 'week', 'record', 'cook', 'today']) setTab(tb); openModeSheet(); });
    await p.waitForTimeout(300);
    await p.reload(); await ready(p); await p.waitForTimeout(400);
    eq(await p.evaluate(() => (setTab('today'), menuIds())), OLD.cook.ids, `${L}: 読み直しても決めた献立のまま`);
    eq(p.errs, [], `${L}: 例外なし`);
    await p.ctx.close();
}

// ================= B. サービスワーカーの更新（前の版を入れて10分以内に新しい版） =================
{
    let phase = 'old';
    const NEWV = fs.readFileSync(path.join(APP, 'sw.js'), 'utf8').match(/gohancho-(v\d+)/)[1];
    const OLDV = 'v0old';
    const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
    // 前の版: 本体・sw.js・英語の辞書だけを書きかえたもの（版の名前と目印）。ほかのファイルは同じ
    const oldBody = rel => {
        const s = fs.readFileSync(path.join(APP, rel), 'utf8');
        if (rel === 'index.html') return s.replace(`ASSET_V='${NEWV}'`, `ASSET_V='${OLDV}'`);
        if (rel === 'sw.js') return s.replace(`gohancho-${NEWV}`, `gohancho-${OLDV}`).replace(/new Request\(u, \{cache:'reload'\}\)/, 'u');   // 前の版の sw.js（一時保存を通す）
        if (rel === 'i18n/en.js') return s + '\n/*OLD-EN*/';
        return null;
    };
    const server = http.createServer((req, res) => {
        let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); if (!rel || rel.endsWith('/')) rel += 'index.html';
        const file = path.join(APP, rel); if (!file.startsWith(APP)){ res.writeHead(403); return res.end(); }
        let body = phase === 'old' ? oldBody(rel) : null;
        try{ if (body == null) body = fs.readFileSync(file); }catch(e){ res.writeHead(404); return res.end('nf'); }
        res.writeHead(200, { 'content-type': MIME[path.extname(rel)] || 'application/octet-stream', 'cache-control': 'max-age=600' });
        res.end(body);
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const SWURL = `http://localhost:${server.address().port}/`;
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Europe/Berlin', locale: 'en-US' });   // route を付けない（付けるとブラウザの一時保存が止まり、再現しない）
    await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'DE', uiLang: 'en', dishCount: 3}})); });
    const p = watch(await ctx.newPage());
    const cacheInfo = () => p.evaluate(async () => { const out = {keys: await caches.keys()}; for (const k of out.keys){ const c = await caches.open(k); for (const u of ['./index.html', './', './i18n/en.js']){ const r = await c.match(u); if (r){ const t = await r.text(); out[k + ' ' + u] = (t.match(/ASSET_V='(\w+)'/) || [])[1] || (t.includes('/*OLD-EN*/') ? 'old-en' : 'new-en'); } } } return out; });
    const waitCaches = async want => { for (let i = 0; i < 80; i++){ const ks = await p.evaluate(() => caches.keys()); if (JSON.stringify(ks.filter(k => k !== 'gohancho-img-v1').sort()) === JSON.stringify(want)) return true; await p.waitForTimeout(250); } return false; };
    await p.goto(SWURL); await ready(p);
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20000 });
    ok(await waitCaches([`gohancho-${OLDV}`]), 'B 前の版の保存ができる');
    eq(await p.evaluate(() => ASSET_V), OLDV, 'B 前の版で開いている');
    phase = 'new';
    await p.reload(); await ready(p);
    eq(await p.evaluate(() => ASSET_V), NEWV, 'B 電波があれば新しい版で開く');
    ok(await waitCaches([`gohancho-${NEWV}`]), 'B 新しい版の保存に切りかわる');
    const ci = await cacheInfo();
    eq([ci[`gohancho-${NEWV} ./index.html`], ci[`gohancho-${NEWV} ./`], ci[`gohancho-${NEWV} ./i18n/en.js`]], [NEWV, NEWV, 'new-en'], 'B 新しい版の保存に、前の版の画面・言葉が入らない（ブラウザの一時保存を通さない）');
    await ctx.setOffline(true); p.errs.length = 0;
    await p.reload(); await ready(p); await p.waitForTimeout(800);
    const off = await p.evaluate(() => ({ v: ASSET_V, lang: LANG, menu: menuIds().length, ja: (document.querySelector('#view').innerText.match(/[ぁ-ん]{2,}/g) || []).slice(0, 5) }));
    eq([off.v, off.lang], [NEWV, 'en'], 'B 電波がなくても新しい版・英語で開く');
    ok(off.menu > 0 && off.ja.length === 0, 'B 電波がなくても献立が出て、日本語がまざらない ' + JSON.stringify(off));
    eq(p.errs, [], 'B 例外なし');
    await ctx.close(); server.close();
}

// ================= C. 2つのタブ =================
{
    const ctx = await ctxOf();
    await ctx.addInitScript(() => {
        if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3}}));
        // 見ていないタブにする（テストから切りかえる。読み直したあとも続く）
        Object.defineProperty(document, 'hidden', { get: () => sessionStorage.getItem('hid') === '1' });
        Object.defineProperty(document, 'visibilityState', { get: () => sessionStorage.getItem('hid') === '1' ? 'hidden' : 'visible' });
    });
    const A = watch(await ctx.newPage()); await A.goto(URL_); await ready(A);
    const B = watch(await ctx.newPage()); await B.goto(URL_); await ready(B);
    await A.waitForTimeout(800);
    const loads = () => A.evaluate(() => performance.getEntriesByType('navigation').length && performance.timeOrigin);
    // 1) A を見ていないあいだに、B でアレルギー・家族を足す
    await A.evaluate(() => { sessionStorage.setItem('hid', '1'); document.dispatchEvent(new Event('visibilitychange')); });
    const t0 = await loads();
    await B.evaluate(() => { S.settings.allergens = ['egg']; S.family = [{id: 'f1', name: '娘', role: 'child', avoid: ['@milk'], allergy: ['@milk'], mild: false, sometimes: false, me: false}]; saveNow(); });
    await A.waitForTimeout(300);
    await A.evaluate(() => { S.usedDays = [...S.usedDays, '2026-11-11']; save(); saveNow(); });   // 見ていないタブの保存（裏に回るとき・日付が変わったときなど）
    const s1 = await A.evaluate(() => JSON.parse(localStorage.getItem('gohancho.v1')));   // v132 から A はまぜて書くので、見ている B は読み直しうる。読むのは裏の A から
    eq([s1.settings.allergens, s1.family.length], [['egg'], 1], 'C 別のタブで足したアレルギー・家族を、見ていないタブが古いデータで上書きしない');
    eq(await loads(), t0, 'C 見ていないあいだは読み直さない');
    // A に戻る → 読み直して新しいデータで続ける
    await Promise.all([A.waitForEvent('load', { timeout: 15000 }).catch(() => {}), A.evaluate(() => { sessionStorage.setItem('hid', '0'); document.dispatchEvent(new Event('visibilitychange')); }).catch(() => {})]);
    await ready(A);
    ok(await loads() !== t0, 'C 戻ってきたら読み直す');
    eq(await A.evaluate(() => [S.settings.allergens, S.family.length, location.hash]), [['egg'], 1, '#today'], 'C 読み直したあとは新しいデータ・同じタブ');
    // A が読み直したときの書き直し（今日の下書きなど）で B も読み直すことがある。落ち着くまで待ってから次へ（CI の遅い機械で、その読み直しを数えていた）
    for (let i = 0, last = ''; i < 20; i++){ await A.waitForTimeout(500); const k = JSON.stringify(await Promise.all([A, B].map(p => p.evaluate(() => performance.timeOrigin).catch(() => 0)))); if (k === last) break; last = k; }
    await ready(B);
    await B.evaluate(() => sessionStorage.removeItem('gohanOther'));   // ここまでの読み直しの回数（1分に3回まで）は数えなおす。遅い機械では、ここまでで上限に届いて読み直さないことがあった
    const tb = await B.evaluate(() => performance.timeOrigin);
    await Promise.all([B.waitForEvent('load', { timeout: 15000 }).catch(() => {}), A.evaluate(() => { S.settings.lowSalt = true; saveNow(); })]);
    await ready(B);
    ok(await B.evaluate(() => performance.timeOrigin) !== tb, 'C 見えている別のタブは、すぐ読み直す');
    const s2 = await B.evaluate(() => [JSON.parse(localStorage.getItem('gohancho.v1')), S.settings.lowSalt, S.settings.allergens]);
    eq([s2[0].settings.allergens, s2[0].family.length, s2[0].settings.lowSalt], [['egg'], 1, true], 'C 読み直したあとの保存は、両方の変更を持つ');
    eq([s2[1], s2[2]], [true, ['egg']], 'C 見えている別のタブは、すぐ読み直して同じデータになる');
    // 入力中のタブは読み直さない（打っている文字を消さない）
    const t1 = await loads();
    await A.evaluate(() => { const i = document.createElement('input'); i.id = 'upd34-in'; document.body.appendChild(i); i.focus(); });
    await B.evaluate(() => { S.settings.diet = true; saveNow(); });
    await A.waitForTimeout(500);
    eq(await loads(), t1, 'C 入力中のタブは読み直さない');
    eq([...A.errs, ...B.errs], [], 'C 例外なし');
    await ctx.close();
}

// ================= D. 保存場所の不調 =================
{
    const base = fs.readFileSync(path.join(HERE, 'fixtures', 'upd34-v126_ja.json'), 'utf8');
    // 容量いっぱい（書くと例外）
    let p = await openWith(base, { init: () => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v){ if (sessionStorage.getItem('seeded') && this === localStorage) throw new DOMException('full', 'QuotaExceededError'); return o.call(this, k, v); }; } });
    let r = await p.evaluate(() => { setTab('today'); return { menu: menuIds(), fam: S.family.length, raw: JSON.parse(localStorage.getItem('gohancho.v1')).family.length }; });
    ok(r.menu.length > 0 && r.fam === 2 && r.raw === 2, 'D 容量いっぱい: 開けて献立が出る・家族も読める ' + JSON.stringify(r));
    eq(p.errs, [], 'D 容量いっぱい: 例外なし'); await p.ctx.close();
    // プライベートモード（保存場所そのものが使えない）
    p = await openWith(null, { init: () => { Object.defineProperty(window, 'localStorage', { get(){ throw new DOMException('denied', 'SecurityError'); } }); } });
    r = await p.evaluate(() => (setTab('today'), menuIds().length));
    ok(r > 0, 'D 保存場所が使えない: 開けて献立が出る');
    eq(p.errs, [], 'D 保存場所が使えない: 例外なし'); await p.ctx.close();
    // 書きかけで切れた JSON
    p = await openWith(base.slice(0, Math.floor(base.length / 2)));
    r = await p.evaluate(() => { setTab('today'); S.settings.lowSalt = true; saveNow(); const k = Object.keys(localStorage).filter(k => k.startsWith('gohancho.broken.')); return { menu: menuIds().length, broken: k.map(x => localStorage.getItem(x).length) }; });
    ok(r.menu > 0, 'D 壊れた JSON: 開けて献立が出る');
    eq(r.broken, [Math.floor(base.length / 2)], 'D 壊れた JSON: 元のデータを残し、次の保存でも消さない');
    eq(p.errs, [], 'D 壊れた JSON: 例外なし'); await p.ctx.close();
}

// ================= E. 日付（夏時間・朝4時の切りかわり） =================
for (const [tz, cc, t0, steps] of [
    ['America/New_York', 'US', '2026-03-07T19:00:00-05:00', [['2026-03-08T03:30:00-04:00', '2026-03-07', true], ['2026-03-08T04:01:00-04:00', '2026-03-08', false]]],
    ['America/New_York', 'US', '2026-10-31T19:00:00-04:00', [['2026-11-01T01:30:00-05:00', '2026-10-31', true], ['2026-11-01T03:59:00-05:00', '2026-10-31', true], ['2026-11-01T04:00:00-05:00', '2026-11-01', false]]],
    ['Europe/Berlin', 'DE', '2026-03-28T22:00:00+01:00', [['2026-03-29T03:59:00+02:00', '2026-03-28', true], ['2026-03-29T04:00:30+02:00', '2026-03-29', false]]],
    ['Europe/Berlin', 'DE', '2026-10-24T22:00:00+02:00', [['2026-10-25T02:30:00+01:00', '2026-10-24', true], ['2026-10-25T04:00:30+01:00', '2026-10-25', false]]]]){
    const p = await openWith(JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: cc, uiLang: 'en', dishCount: 3}}), { tz, locale: 'en-US', time: t0 });
    const d0 = await p.evaluate(() => { setTab('today'); document.querySelector('[data-act=decide]').click(); S.settings.hangover = TODAY; saveNow(); return { today: TODAY, cook: S.cook.ids.slice() }; });
    for (const [at, today, still] of steps){
        await p.clock.setSystemTime(new Date(at)); await p.reload(); await ready(p); await p.waitForTimeout(200);
        const r = await p.evaluate(() => ({ today: TODAY, hang: hangOn(), decided: decidedToday(), cook: S.cook.ids, cookD: S.cook.d }));
        eq([r.today, r.hang, r.decided], [today, still, still], `E ${tz} ${at}: 今日の日付・二日酔い・決めた献立`);
        eq([r.cook, r.cookD], [d0.cook, d0.today], `E ${tz} ${at}: 前に決めた献立（日付と料理）は変わらない`);
    }
    eq(p.errs, [], `E ${tz} ${t0}: 例外なし`);
    await p.ctx.close();
}

// D) 2つのタブを開いただけで、読みこみの書き直し（並び順・空の欄）を理由にたがいを読み直させない
{
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const A = await ctx.newPage(); await A.goto(URL_); await A.waitForFunction(isReady, null, { timeout: 30000 }); await A.waitForTimeout(800);
    const ta = await A.evaluate(() => performance.timeOrigin);
    const B = await ctx.newPage(); await B.goto(URL_); await B.waitForFunction(isReady, null, { timeout: 30000 }); await B.waitForTimeout(2000);
    eq(await A.evaluate(() => performance.timeOrigin), ta, 'D 2つめのタブを開いても、1つめは読み直さない');
    ok(await A.evaluate(() => sameStore(JSON.stringify({ settings: { a: 1, b: [] }, x: {} }), JSON.stringify({ x: {}, settings: { b: [], a: 1 } }))), 'D 並び順だけの違いは同じとみる');
    ok(!(await A.evaluate(() => { const s = JSON.parse(JSON.stringify(stateToKeep())); s.settings.allergens = ['egg']; return sameStore(JSON.stringify(s), JSON.stringify(stateToKeep())); })), 'D アレルギーの違いは違うとみる');
    await ctx.close();
}

await b.close();
console.log(`upd34: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
