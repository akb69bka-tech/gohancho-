#!/usr/bin/env node
// 今日の献立の上のあいさつと、家族リクエストの入口（オーナーの指示。Playwright。使い方: node tools/tests/greet.mjs [http://localhost:8898/]）
//  G1 時間帯（朝・昼・午後・夕方・夜）であいさつが変わる。献立を決めたあとは料理名が入る。同じ日・同じ時間帯は同じ文。全部で10パターン以上
//  G2 17言語＋日本語で、あいさつが切れない（390×844・標準の文字で2行まで）。体への効き目を言い切らない・急かさない
//  G3 家族を登録している人: 「家族リクエスト」と届いた数・いちばん新しいものの一言（ゆい：豚の生姜焼き）が出る。押すと「食べたいもの」のシートが開き、届いたものが並ぶ。44px 以上
//  G4 家族を登録していて届いていない人: 数字なしで出る（押すと送る・貼りつけるの入口がある）。家族がいない人には出ない
//  G5 あいさつ・入口を足しても、お膳が最初の画面（決定の帯の上）に入る（390×844・360×740・文字大）
//  G6 深夜0〜3時（アプリの「今日」はまだ前の日。dayNow の4時区切り）・4時は「明日の献立」と言わない（第8回 R23）
//  G7 決めた献立に家族の ⚠ があると、「できあがりが楽しみです」ではなく、確かめてもらう一言。決めた献立は変わらない。⚠ がなければ今までどおり（第8回 R22）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const FAM = {family: [{id: 'f1', name: 'ゆい'}, {id: 'f2', name: 'けん'}], wants: [{k: 'a1', n: 'ゆい', id: 'shogayaki', m: 0, t: '2026-10-28', at: '2026-10-28'}, {k: 'a2', n: 'けん', id: 'karaage', m: 0, t: '2026-10-27', at: '2026-10-27'}]};
const open = async ({w = 390, h = 844, hour = 8, settings = {}, state = {}, tag = ''} = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('greet', tag + w + h + hour)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({time: new Date(`2026-10-29T${String(hour).padStart(2, '0')}:10:00+09:00`)});
    await p.addInitScript(([settings, state]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, settings)}, state))); } }, [settings, state]);
    await p.goto(URL_); await ready(p); await p.clock.runFor(800);
    return {p, ctx};
};
const greet = p => p.evaluate(() => { const e = document.querySelector('#greet .greet-tx'); return e ? {t: e.textContent, cut: e.scrollHeight > e.clientHeight + 1, lines: Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)), fs: parseFloat(getComputedStyle(e).fontSize)} : null; });

// G1 時間帯
{
    const seen = {}; const all = new Set();
    for (const hour of [7, 12, 15, 18, 22]){
        const {p, ctx} = await open({hour, tag: 'g1'});
        const g = await greet(p); seen[hour] = g && g.t;
        const again = await p.evaluate(() => { render(); return document.querySelector('#greet .greet-tx').textContent; });
        ok(g && g.t && again === g.t, `G1 ${hour}時: あいさつが出て、描き直しても同じ文: ` + JSON.stringify([g, again]));
        // その時間帯の文の候補（日付を変えて数える）
        const cands = await p.evaluate(() => { const out = new Set(), t0 = TODAY; for (let i = 0; i < 40; i++){ TODAY = addDays(t0, i); out.add(greetText()); } TODAY = t0; return [...out]; });
        cands.forEach(x => all.add(x));
        await p.click('button[data-act=decide]'); await p.waitForTimeout(400); await p.evaluate(() => setTab('today')); await p.waitForTimeout(300);
        const d = await p.evaluate(() => ({t: document.querySelector('#greet .greet-tx').textContent, dish: trayName(recipeById(S.cook.ids[0]).name)}));
        if (hour !== 22) ok(d.t.includes(d.dish), `G1 ${hour}時: 決めたあとは料理名が入る: ` + JSON.stringify(d));
        all.add(d.t.replace(d.dish, '{dish}'));
        await ctx.close();
    }
    const vals = Object.values(seen);
    ok(new Set(vals).size >= 4, 'G1 朝・昼・午後・夕方・夜で文が変わる: ' + JSON.stringify(seen));
    ok(/おはよう/.test(seen[7]) && !/おはよう/.test(seen[18]), 'G1 朝は「おはよう」、夕方は言わない: ' + JSON.stringify(seen));
    ok(all.size >= 10, 'G1 あいさつは10パターン以上: ' + all.size);
    const bad = [...all].filter(x => /健康|体にいい|体に良い|効く|効果|痩せ|ダイエット|早く|急いで|まだ決めていない|しなければ/.test(x));
    ok(!bad.length, 'G1 体への効き目を言わない・急かさない: ' + bad.join(' / '));
}
// G2 17言語＋日本語で切れない
{
    const CCL = {ja: 'JP', ar: 'EG', de: 'DE', en: 'US', es: 'ES', fil: 'PH', fr: 'FR', hi: 'IN', id: 'ID', it: 'IT', ko: 'KR', pl: 'PL', 'pt-BR': 'BR', th: 'TH', tr: 'TR', vi: 'VN', 'zh-Hans': 'CN', 'zh-Hant': 'TW'};
    const bad = [];
    for (const [lang, cc] of Object.entries(CCL)){
        const {p, ctx} = await open({hour: 12, settings: {country: cc, uiLang: lang}, state: FAM, tag: lang});
        // どの時間帯・決める前の文も、入口が並んだ幅で2行に入る
        const r = await p.evaluate(() => { const e = document.querySelector('#greet .greet-tx'); if (!e) return ['no greet']; const out = [], t0 = TODAY;
            for (const band of ['morning', 'noon', 'afternoon', 'evening', 'night', 'late']) for (const wish of [0, 2]) for (const ln of greetLines(band, {dish: '', wish})){ e.textContent = ln; if (e.scrollHeight > e.clientHeight + 1) out.push(ln); }
            for (const band of ['morning', 'noon', 'evening', 'late']) for (const warn of [false, true]) for (const ln of greetLines(band, {dish: trayName(session.menu.items[0].r.name), wish: 0, warn})){ e.textContent = ln; if (e.scrollHeight > e.clientHeight + 1) out.push(ln); }
            const rq = document.querySelector('#greet .req-btn .rq-l'); if (rq && rq.scrollWidth > rq.clientWidth + 1) out.push('入口: ' + rq.textContent);
            void t0; return out; });
        if (r.length) bad.push(lang + ': ' + r.slice(0, 2).join(' | '));
        await ctx.close();
    }
    ok(!bad.length, 'G2 17言語＋日本語で、あいさつ・入口の字が切れない（390×844・2行まで）: ' + bad.join(' / '));
}
// G3 家族リクエスト（届いている）
{
    const {p, ctx} = await open({hour: 18, state: FAM, tag: 'g3'});
    const r = await p.evaluate(() => { const bt = document.querySelector('#greet .req-btn'); if (!bt) return null; const q = bt.getBoundingClientRect(); return {txt: bt.textContent.replace(/\s+/g, ''), n: (bt.querySelector('.rq-n') || {}).textContent, w: q.width, h: q.height, aria: bt.getAttribute('aria-label')}; });
    ok(r && /家族リクエスト/.test(r.txt) && r.n === '2' && /ゆい：豚の生姜焼き/.test(r.txt) && r.w >= 44 && r.h >= 44 && /2件/.test(r.aria), 'G3 「家族リクエスト」・届いた数・いちばん新しい一言・44px 以上: ' + JSON.stringify(r));
    await p.click('#greet .req-btn'); await p.waitForTimeout(300);
    const s = await p.evaluate(() => ({kind: sheet && sheet.kind, rows: [...document.querySelectorAll('#sheet-root .wsh-row .wsh-nm')].map(e => e.textContent)}));
    ok(s.kind === 'wish-list' && s.rows.includes('豚の生姜焼き') && s.rows.includes('鶏の唐揚げ'), 'G3 押すと「食べたいもの」のシートが開き、届いたものが並ぶ: ' + JSON.stringify(s));
    await ctx.close();
}
// G4 0件・家族なし
{
    let {p, ctx} = await open({hour: 9, state: {family: FAM.family}, tag: 'g4a'});
    let r = await p.evaluate(() => { const bt = document.querySelector('#greet .req-btn'); return bt ? {n: !!bt.querySelector('.rq-n'), txt: bt.textContent.trim()} : null; });
    ok(r && !r.n && /家族リクエスト/.test(r.txt), 'G4 家族がいて届いていない: 数字なしで出る: ' + JSON.stringify(r));
    await p.click('#greet .req-btn'); await p.waitForTimeout(300);
    const s = await p.evaluate(() => ({kind: sheet && sheet.kind, send: !!document.querySelector('#sheet-root [data-act=wish-open]'), paste: !!document.querySelector('#sheet-root [data-act=wish-paste-open]')}));
    ok(s.kind === 'wish-list' && s.send && s.paste, 'G4 押すと、送る・貼りつけるの入口がある: ' + JSON.stringify(s));
    await ctx.close();
    ({p, ctx} = await open({hour: 9, tag: 'g4b'}));
    r = await p.evaluate(() => ({btn: !!document.querySelector('#greet .req-btn'), g: !!document.querySelector('#greet .greet-tx')}));
    ok(!r.btn && r.g, 'G4 家族がいない人には入口を出さない（あいさつは出る）: ' + JSON.stringify(r));
    await p.evaluate(() => setTab('cook')); await p.waitForTimeout(200);
    ok(await p.evaluate(() => !document.querySelector('#greet .greet-tx')), 'G4 今日の献立のほかの画面では、あいさつを出さない');
    await ctx.close();
}
// G5 お膳が最初の画面に入る
{
    const bad = [];
    for (const [w, h, ts] of [[390, 844, 0], [360, 740, 0], [390, 844, 2], [375, 667, 0]]) for (const dc of [4, 7]){
        const {p, ctx} = await open({w, h, hour: 18, settings: {dishCount: dc, textSize: ts || undefined}, state: FAM, tag: 'g5' + dc});
        const r = await p.evaluate(() => { const tr = document.querySelector('#view .tray'); let fl = innerHeight;
            document.querySelectorAll('nav.tabs, .actionbar').forEach(e => { const q = e.getBoundingClientRect(); if (q.height && /fixed|sticky/.test(getComputedStyle(e).position) && q.top > innerHeight * .4 && q.top < fl) fl = q.top; });
            const hid = document.body.classList.contains('bar-static') ? [] : [...tr.querySelectorAll('.spot .vessel, .spot .nm, .spot .swap:not(.swap-ph), .tg-mid .shuffle')].filter(e => e.getBoundingClientRect().bottom > fl + .5).map(e => e.className.split(' ')[0]);
            const g = document.querySelector('#greet .greet-tx'), bt = document.querySelector('#greet .req-btn');
            return {hid, scroll: document.body.classList.contains('bar-static'), g: !!g, bt: !!bt && bt.getBoundingClientRect().height >= 44}; });
        if (r.hid.length || !r.g || !r.bt) bad.push(`${w}x${h} 文字${ts} ${dc}品 ` + JSON.stringify(r));
        if (r.scroll && w === 390 && !ts) bad.push(`${w}x${h} ${dc}品 帯をお膳の下に置いた（390 標準の文字では入るはず）`);
        await ctx.close();
    }
    ok(!bad.length, 'G5 あいさつ・入口を足しても、お膳が帯の上に入る（390×844 標準の文字では帯をお膳の下にしない）: ' + bad.join(' / '));
}
// G6 深夜
{
    const out = {}, bad = [];
    for (const hour of [0, 2, 3, 4]){
        const {p, ctx} = await open({hour, tag: 'g6'});
        const g = await greet(p);
        const all = await p.evaluate(() => { const o = new Set(), t0 = TODAY; for (let i = 0; i < 20; i++){ TODAY = addDays(t0, i); o.add(greetText()); } TODAY = t0; return [...o]; });
        await p.click('button[data-act=decide]'); await p.waitForTimeout(400); await p.evaluate(() => setTab('today')); await p.waitForTimeout(300);
        const d = await p.evaluate(() => ({t: document.querySelector('#greet .greet-tx').textContent, dish: trayName(recipeById(S.cook.ids[0]).name), today: TODAY}));
        out[hour] = [g && g.t, d.t];
        [...all, d.t].forEach(x => { if (/明日/.test(x)) bad.push(hour + '時: ' + x); });
        if (hour < 4 && !d.t.includes(d.dish)) bad.push(hour + '時 決めたあとに料理名がない: ' + d.t);
        if (hour < 4 && d.today !== '2026-10-28') bad.push(hour + '時 今日が前の日になっていない: ' + d.today);
        await ctx.close();
    }
    ok(!bad.length, 'G6 深夜0〜4時は「明日の献立」と言わない。0〜3時に決めた献立は料理名で: ' + bad.join(' / ') + ' ' + JSON.stringify(out));
}
// G7 決めた献立に ⚠
{
    for (const hour of [7, 12, 18]){
        const {p, ctx} = await open({hour, state: {family: [{id: 'f1', name: '夫', role: 'adult', avoid: [], allergy: [], mild: false}]}, tag: 'g7'});
        await p.click('button[data-act=decide]'); await p.waitForTimeout(400); await p.evaluate(() => setTab('today')); await p.waitForTimeout(300);
        const r = await p.evaluate(() => {
            const before = S.cook.ids.slice(), g0 = document.querySelector('#greet .greet-tx').textContent;
            const main = recipeById(S.cook.ids[0]); let hit = null;
            for (const k of Object.keys(FAM_ALG)){ S.family[0].allergy = ['@' + k]; S.family[0].avoid = ['@' + k]; if (allergyConflict(main)){ hit = k; break; } }
            if (!hit){ S.family[0].allergy = []; S.family[0].avoid = []; }
            save(); render();
            const g1 = document.querySelector('#greet .greet-tx').textContent;
            return {hit, g0, g1, same: JSON.stringify(before) === JSON.stringify(S.cook.ids), tag: !!document.querySelector('#view .tray .alg-tag:not(.may)')};
        });
        if (!r.hit){ console.log('skip G7', hour, '（決めた主菜に当たる家族のアレルゲンがない）'); await ctx.close(); continue; }
        ok(r.same && r.tag, `G7 ${hour}時: 家族の ⚠ を足しても、決めた献立は変わらず、⚠ の印が出る: ` + JSON.stringify(r));
        ok(!/楽しみ/.test(r.g1) && /⚠/.test(r.g1) && /確かめ/.test(r.g1), `G7 ${hour}時: あいさつは「楽しみ」ではなく、確かめてもらう一言: ` + JSON.stringify(r));
        ok(!/健康|危険|命|病|症状|必ず|絶対/.test(r.g1), `G7 ${hour}時: 医療・健康の言い切りをしない: ` + r.g1);
        ok(r.g0 !== r.g1 && !/⚠/.test(r.g0), `G7 ${hour}時: ⚠ がないときは今までどおりの一言: ` + r.g0);
        await ctx.close();
    }
}
await b.close();
if (errs.length){ fails++; console.log('FAIL JSエラー', errs.slice(0, 3)); }
console.log(`\n${checks - fails}/${checks} ok` + (fails ? `  失敗 ${fails}  [再現: SEED=${SEED}]` : ''));
process.exit(fails ? 1 : 0);
