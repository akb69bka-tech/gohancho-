#!/usr/bin/env node
// 利用者モニター第4回（案2・v40）の画面の不具合 A09・R7・D4 の回帰テスト（Playwright。使い方: node tools/tests/panel-r4-ui.mjs [http://localhost:8881/]）
//  A09 幅195px（200%拡大）・文字「もっと大きい」でも、題名・日付が縦に1文字ずつ並ばない（日付は1行、題名は折り返すか1行）。下のタブの文字は12px より小さくしない
//  R7  「設定に合わせて…かえました」: はじめての設定のあとには出さない。設定を本当に変えたときは決める段に出て、次の操作（条件を変える・気分など）で消える。
//      「ほかの候補」は押せる。気分を変えて新しい案になったら残さない。1品を選び直しても、ほかの料理は変えない
//  D4  はじめての設定の「準備ができました」のお知らせが、見えていた料理の行・「かえる」などの押す場所に重ならない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const want = k => !ONLY.length || ONLY.includes(k);
const SHOT = process.env.SHOT_DIR || '';
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const ctxOf = async (vp, lang, tag) => {
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, locale: lang === 'ja' ? 'ja-JP' : lang, timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('panel-r4', tag)));
    return ctx;
};
const open = async (settings = {}, opt = {}) => {
    const ctx = await ctxOf(opt.vp || [390, 844], settings.uiLang || 'ja', JSON.stringify(settings));
    await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, st)})); }, settings);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};

// ---- A09 幅195px・文字が大きいときの見出しと下のタブ ----
if (want('A09')){
    for (const lang of ['ja', 'en', 'de', 'vi', 'ar', 'th']) for (const ts of [0, 1, 2]) for (const w of [195, 240, 280]){
        const {p, ctx} = await open({uiLang: lang, textSize: ts || undefined}, {vp: [w, 422]});
        await p.waitForTimeout(200);
        const r = await p.evaluate(() => {
            const lines = e => { const cs = getComputedStyle(e), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3; return Math.round(e.getBoundingClientRect().height / lh); };
            const h = document.querySelector('header.top h1'), d = document.querySelector('header.top .date');
            const kids = [...document.querySelectorAll('header.top > *')].map(e => e.getBoundingClientRect());
            const nav = [...document.querySelectorAll('nav.tabs button[data-tab]:not([hidden])')].map(e => parseFloat(getComputedStyle(e).fontSize));
            return {h1: lines(h), h1W: Math.round(h.getBoundingClientRect().width), h1Clip: h.scrollWidth > h.clientWidth + 1, date: lines(d), dateW: Math.round(d.getBoundingClientRect().width),
                inside: kids.every(k => k.left >= -1 && k.right <= innerWidth + 1), nav: Math.min(...nav), sw: document.documentElement.scrollWidth, iw: innerWidth};
        });
        const tag = `A09 ${w}px ${lang} 文字${['ふつう', '大きい', 'もっと大きい'][ts]}`;
        ok(r.date === 1 && r.dateW >= 100, `${tag}: 日付は1行で、縦1文字にならない: ` + JSON.stringify(r));
        ok(r.h1 <= 2 && r.h1W >= 100 && !r.h1Clip, `${tag}: 題名は2行まで（縦1文字・はみ出しなし）: ` + JSON.stringify(r));
        ok(r.inside && r.sw <= r.iw, `${tag}: 見出しが画面に収まり、横にはみ出さない: ` + JSON.stringify(r));
        ok(r.nav >= 12, `${tag}: 下のタブの文字は12px以上: ` + r.nav);
        if (SHOT && w === 195 && ts === 2 && lang === 'ja') await p.screenshot({path: SHOT + '/A09_195_ts2.png'}).catch(() => {});
        await ctx.close();
    }
}

// はじめての設定（国→設定）を画面で進める。avoid: 苦手に入れる食材
const onboard = async (p, cc, avoid = [], before) => {
    await p.waitForSelector('#sheet-root [data-act=pick-country]', {timeout: 20000});
    await p.click(`#sheet-root [data-act=pick-country][data-cc="${cc}"]`);
    await p.waitForSelector('#sheet-root [data-act=ob-next], #sheet-root [data-act=ob-done]', {timeout: 20000});
    for (let i = 0; i < 6; i++){
        for (const v of avoid){ const c = p.locator(`#sheet-root [data-act=ob-avoid][data-v="${v}"]`); if (await c.count() && (await c.first().getAttribute('aria-pressed')) !== 'true'){ await c.first().click(); await p.waitForTimeout(80); } }
        if (await p.locator('#sheet-root [data-act=ob-done]').count()){ if (before) await before(); await p.click('#sheet-root [data-act=ob-done]'); break; }
        await p.click('#sheet-root [data-act=ob-next]'); await p.waitForTimeout(200);
    }
    await p.waitForTimeout(500);
};
const fresh = async (cc, lang, vp, tag) => {
    const ctx = await ctxOf(vp, lang, tag);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined', null, {timeout: 30000}).catch(() => {});
    return {p, ctx};
};

// ---- R7 「設定に合わせて…かえました」 ----
if (want('R7')){
    // はじめての設定: 苦手に入れた食材で今日の案が選び直されても、知らせは出さない（献立は設定に合っている）
    for (const [cc, lang, avoid] of [['JP', 'ja', ['豚肉', '牛肉', '鶏肉', 'さば', '鮭', 'えび']], ['KR', 'ko', []]]){
        const {p, ctx} = await fresh(cc, lang, [390, 844], 'R7-ob-' + cc);
        // 設定の画面の下に用意されている今日の案の主菜の材料も苦手に入れて、はじめての設定で必ず選び直しが起きるようにする
        await onboard(p, cc, avoid, () => p.evaluate(() => { const o = reconcileMenu; reconcileMenu = function(...a){ const r = o.apply(this, a); window.__rc = (window.__rc || 0) + (r ? 1 : 0); return r; };
            const m = session.menu && session.menu.items[0].r; if (m && sheet && sheet.avoid) m.items.filter(i => !i.opt).forEach(i => sheet.avoid.add(i.key)); }));
        const r = await p.evaluate(() => ({note: !!document.querySelector('.avoid-note'), sn: !!session.avoidNote, toast: (document.querySelector('#toast-root') || {}).textContent || '', rc: window.__rc || 0,
            bad: session.menu.items.filter(x => x.r && isAvoided(x.r)).map(x => x.r.id)}));
        ok(r.rc > 0, `R7-0 ${cc} はじめての設定で今日の案が選び直される（テストの前提）: ` + r.rc);
        ok(!r.note && !r.sn && !/かえました|바꿨어요/.test(r.toast), `R7-1 ${cc} はじめての設定のあとに「設定に合わせて…かえました」を出さない（選び直し ${r.rc}回）: ` + JSON.stringify(r));
        ok(!r.bad.length, `R7-2 ${cc} はじめての献立は苦手に当たらない: ` + r.bad.join());
        if (SHOT && cc === 'JP') await p.screenshot({path: SHOT + '/R7_onboard.png'}).catch(() => {});
        await ctx.close();
    }
    // 設定を本当に変えた（家族のアレルギー）→ 決める段に出る → 次の操作（条件を変える）で消え、閉じても戻らない
    const famChange = p => p.evaluate(() => { setTab('settings'); if (!Array.isArray(S.family)) S.family = []; const m = session.menu.items[0].r; S.family.push({id: 'k', name: '娘', role: 'child', avoid: [m.family === '魚' ? '@fish' : '@pork', '@chicken', '@beef', '@pork', '@fish'], allergy: [], mild: true}); save(); reconcileMenu(); render(); return session.menu.items.map(x => x.r && x.r.id); });
    {
        const {p, ctx} = await open({dishCount: 3});
        const ids0 = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
        const ids1 = await famChange(p);
        await p.click('[data-act=settings-back]'); await p.waitForTimeout(300);
        const vis = () => p.evaluate(() => { const n = document.querySelector('.avoid-note'); return !!n && n.getBoundingClientRect().height > 0; });
        const changed = ids0.some((x, i) => x !== ids1[i]);
        ok(!changed || await vis(), 'R7-3 設定で献立が変わったら、決める段に「設定に合わせて…かえました」が出る: ' + JSON.stringify([ids0, ids1]));
        // 変わらなかった料理はそのまま（1品ずつ選び直す）
        const kept = await p.evaluate(ids => ids.map((id, i) => { const r0 = id && byId(id); return !r0 || isAvoided(r0) || (session.menu.items[i].r && session.menu.items[i].r.id) === id; }), ids0);
        ok(kept.every(Boolean), 'R7-4 設定に合う料理は変えない（合わなくなった枠だけ選び直す）: ' + JSON.stringify([ids0, ids1, kept]));
        if (SHOT) await p.screenshot({path: SHOT + '/R7_note_shown.png'}).catch(() => {});
        // 次の操作: 条件を変える を開く → 消える。閉じても戻らない
        await p.click('[data-act=cond-open]'); await p.waitForTimeout(300);
        const inSheet = await p.evaluate(() => ({sn: !!session.avoidNote, dom: !!document.querySelector('#view .avoid-note')}));
        const mood = p.locator('#sheet-root [data-act=mood]:not([aria-pressed=true])').first();
        if (await mood.count()){ await mood.click(); await p.waitForTimeout(300); }
        const sc = p.locator('#sheet-root [data-act=sheet-close]').first(); if (await sc.count()) await sc.click().catch(() => {});
        await p.evaluate(() => { if (sheet) closeSheet(); render(); }); await p.waitForTimeout(200);
        const after = await p.evaluate(() => ({sn: !!session.avoidNote, dom: !!document.querySelector('#view .avoid-note')}));
        ok(!inSheet.sn && !inSheet.dom && !after.sn && !after.dom, 'R7-5 次の操作（条件を変える・気分）で「かえました」が消え、もどっても残らない: ' + JSON.stringify([inSheet, after]));
        if (SHOT) await p.screenshot({path: SHOT + '/R7_after_mood.png'}).catch(() => {});
        await ctx.close();
    }
    // 「ほかの候補」は押せる（知らせの続き）
    {
        const {p, ctx} = await open({dishCount: 3});
        await famChange(p);
        await p.click('[data-act=settings-back]'); await p.waitForTimeout(300);
        const btn = p.locator('#view .avoid-note [data-act=avoid-other]');
        if (await btn.count()){ await btn.click(); await p.waitForTimeout(300); const k = await p.evaluate(() => sheet && sheet.kind); ok(k === 'swap', 'R7-6 「ほかの候補」を押すと候補のシートが開く: ' + k); }
        else ok(true, 'R7-6 （外した枠のため「ほかの候補」なし）');
        await ctx.close();
    }
    // 決めた献立は、設定を変えても勝手に変えない
    {
        const {p, ctx} = await open({dishCount: 3});
        await p.click('button[data-act=decide]'); await p.waitForTimeout(400);
        const c0 = await p.evaluate(() => JSON.stringify(S.cook && S.cook.ids));
        await famChange(p);
        const c1 = await p.evaluate(() => ({ids: JSON.stringify(S.cook && S.cook.ids), sn: !!session.avoidNote}));
        ok(c0 === c1.ids && !c1.sn, 'R7-7 決めた献立は設定を変えても変えず、「かえました」も出さない: ' + JSON.stringify([c0, c1]));
        await ctx.close();
    }
}

// ---- D4 はじめての設定のお知らせが、押す場所に重ならない ----
// お知らせを出す直前に見えていた押せるもの・文の場所を控え（下の帯の裏は除く）、出たお知らせ（画面を送った分を足して）と重なっていないかを見る
const SEE = 'button, a[href], input, select, textarea, summary, label, [data-act], .chip, h1, h2, h3, p, li';
const hookToast = p => p.evaluate(sel => {
    if (window.__toastHooked) return; window.__toastHooked = 1;
    const orig = toast;
    toast = function(...a){
        requestAnimationFrame(() => {
            const root = document.querySelector('#toast-root'); root.style.visibility = 'hidden';
            const out = []; let floor = innerHeight;
            document.querySelectorAll('nav.tabs, .actionbar, .cook-ctl').forEach(e => { const r = e.getBoundingClientRect(); if (r.height && r.top > innerHeight * .5 && r.top < floor) floor = r.top; });
            for (const e of document.querySelectorAll(sel)){
                if (e.closest('#toast-root, nav.tabs, .actionbar, .cook-ctl, #sheet-root, #modal-root')) continue;
                const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= floor) continue;
                const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), y = Math.min(Math.max(r.top + Math.min(r.height, floor - r.top) / 2, 1), innerHeight - 1);
                const top = document.elementFromPoint(x, y);
                if (top && (top === e || e.contains(top) || top.contains(e))) out.push({tap: e.matches('button, a[href], input, select, textarea, summary, [data-act], .chip'), k: (e.dataset.act || e.tagName) + ':' + (e.textContent || '').trim().slice(0, 16), l: r.left, t: r.top, r: r.right, b: Math.min(r.bottom, floor)});
            }
            root.style.visibility = '';
            window.__toastPre = {sy: scrollY, out};
        });
        return orig.apply(this, a);
    };
}, SEE);
const toastCover = p => p.evaluate(() => {
    const tb = document.querySelector('#toast-root .toast'); if (!tb) return {none: true};
    const T = {left: tb.offsetLeft, top: tb.offsetTop, right: tb.offsetLeft + tb.offsetWidth, bottom: tb.offsetTop + tb.offsetHeight}, hit = [], tapHit = [];
    const pre = window.__toastPre || {sy: scrollY, out: []}, dy = scrollY - pre.sy;
    for (const r of pre.out){
        const ix = Math.min(r.r, T.right) - Math.max(r.l, T.left), iy = Math.min(r.b - dy, T.bottom) - Math.max(r.t - dy, T.top);
        if (ix > 1 && iy > 1){ hit.push(r.k); if (r.tap) tapHit.push(r.k); }
    }
    return {hit: [...new Set(hit)], tapHit: [...new Set(tapHit)], n: pre.out.length, dy: Math.round(dy), text: tb.textContent.trim().slice(0, 40), cls: tb.className};
});
if (want('D4')){
    for (const [cc, lang] of [['JP', 'ja'], ['KR', 'ko'], ['IT', 'it'], ['US', 'en']]) for (const vp of [[390, 844], [375, 667]]){
        const {p, ctx} = await fresh(cc, lang, vp, 'D4-' + cc + vp[0]);
        await onboard(p, cc, [], () => hookToast(p));
        await p.waitForTimeout(300);
        const r = await toastCover(p);
        ok(!r.none, `D4-1 ${cc} ${vp.join('x')} はじめての設定のあとにお知らせが出る`);
        ok(r.none || (!r.hit.length && r.n > 3), `D4-2 ${cc} ${vp.join('x')} 「準備ができました」が、見えていた料理の行・かえる・見出しに重ならない: ` + JSON.stringify(r));
        if (SHOT && vp[0] === 390) await p.screenshot({path: `${SHOT}/D4_${cc}.png`}).catch(() => {});
        await ctx.close();
    }
}

await b.close();
if (errs.length){ fails++; console.log('FAIL JSエラー', errs.slice(0, 3)); }
console.log(`\n${checks - fails}/${checks} ok` + (fails ? `  失敗 ${fails}  [再現: SEED=${SEED}]` : ''));
process.exit(fails ? 1 : 0);
