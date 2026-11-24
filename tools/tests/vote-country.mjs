#!/usr/bin/env node
// 第26回 R115: 作る人と家族の端末の国の設定がちがっても、○つけ表の料理が出て「○を返す」が押せるか（Playwright。使い方: node tools/tests/vote-country.mjs [http://localhost:8765/]）
//  C1 国の組（作る人 → 家族の端末の国・画面の言葉）ごとに: 作る人が送ったリンクを家族の端末で開くと 6/6品が出て、「○を返す」が押せる
//  C2 家族の端末の国・言葉の設定は変わらない（S.settings.country・currentCountry()・RECIPES の先頭）
//  C3 ⚠/🔍 は、作る人の端末で同じアレルゲンを選んだときと同じ（国・言葉で変わらない）
//  C4 返した○が作る人の端末の表に入る（往復）。返す文の料理名は家族の画面の言葉
//  C5 国の印（c）のない前のリンクでも、料理の番号の国から読む
//  C6 読めない料理だけのリンク（自作の料理など）: 何をすればよいかの案内が出て、「○を返す」は押せない
//  C7 国のデータが読めない（電波なし）: 案内と「もう一度読みこむ」。読めるようになって押すと出る
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const FAM = [{id: 'f1', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}];
const ALG = ['egg', 'wheat', 'milk', 'soy'];
const b64u = s => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hashOf = u => u.slice(u.indexOf('#'));
const open = async (settings, hash = '', state = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(SEED));
    await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(st)); },
        Object.assign({onboarded: true, firstUse: '2026-01-01'}, state, {settings: Object.assign({dishCount: 3, servings: 2}, settings)}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_ + hash); await ready(p);
    return {p, ctx};
};
// 作る人の端末: 主菜から6品（⚠・🔍・なし が混ざるように）選んで表を残し、送る文のリンクと、同じアレルゲンでの印を返す
async function cookLink(cc){
    const {p, ctx} = await open({country: cc, uiLang: 'auto'}, '', {family: FAM});
    const r = await p.evaluate(ALG => {
        const mains = RECIPES.filter(r => r.main && !r.isTwist && !isCustomId(r.id));
        S.settings.allergens = ALG; WISH_BLOCK.clear();
        const kind = r => allergyConflict(r) ? '⚠' : algMayHits(r).length ? '🔍' : '';
        const by = k => mains.filter(r => kind(r) === k);
        const pickN = (a, n) => a.slice(0, n);
        let ids = [...pickN(by('⚠'), 2), ...pickN(by('🔍'), 2), ...pickN(by(''), 2)].map(r => r.id);
        mains.forEach(r => { if (ids.length < 6 && !ids.includes(r.id)) ids.push(r.id); });
        ids = ids.slice(0, 6);
        const marks = ids.map(id => kind(recipeById(id)));
        S.settings.allergens = []; WISH_BLOCK.clear();
        const v = voteSave(ids), text = voteSendText(v);
        return {ids, marks, text, w: v.w};
    }, ALG);
    r.link = (r.text.match(/https:\/\/\S+/) || [''])[0];
    return {p, ctx, ...r};
}
const PAIRS = [['US', 'JP', 'ja'], ['JP', 'US', 'en'], ['US', 'JP', 'en'], ['KR', 'FR', 'fr'], ['IN', 'JP', 'ja'], ['JP', 'TH', 'th'], ['MX', 'DE', 'ar']];
for (const [from, to, lg] of PAIRS){
    const tag = `${from}→${to}(${lg})`;
    const cook = await cookLink(from);
    ok(cook.ids.length === 6 && cook.link.includes('#g='), `C0 ${tag} 作る人のリンク: ${cook.ids.join()}`);
    const {p: e, ctx: ec} = await open({country: to, uiLang: lg, allergens: ALG, sendName: 'そら'}, hashOf(cook.link));
    const before = await e.evaluate(() => ({cc: S.settings.country, cur: currentCountry(), first: RECIPES[0] && RECIPES[0].id, n: RECIPES.length, lang: LANG}));
    ok(await e.evaluate(() => sheet && sheet.kind) === 'vote-in', `C1a ${tag} ○つけ表が開く`);
    try{ await e.waitForFunction(() => document.querySelectorAll('#sheet-root .vt-row').length >= 6, null, {timeout: 20000}); }catch(_){}
    const st = await e.evaluate(() => ({rows: [...document.querySelectorAll('#sheet-root .vt-row')].map(x => ({nm: x.querySelector('.wsh-nm').textContent, m: x.querySelector('.badge.allergy') ? '⚠' : x.querySelector('.badge.caution') ? '🔍' : ''})),
        dis: (document.querySelector('[data-act="vote-return"]') || {disabled: true}).disabled, txt: document.querySelector('#sheet-root').textContent}));
    ok(st.rows.length === 6, `C1b ${tag} 6/6品が出る: ${st.rows.length}品 ${st.txt.slice(0, 120)}`);
    ok(!st.dis, `C1c ${tag} 「○を返す」が押せる`);
    ok(st.rows.map(x => x.m).join('|') === cook.marks.join('|'), `C3 ${tag} ⚠/🔍 が作る人の端末と同じ: ${st.rows.map(x => x.m || '-').join('')} / ${cook.marks.map(x => x || '-').join('')}`);
    const after = await e.evaluate(() => ({cc: S.settings.country, cur: currentCountry(), first: RECIPES[0] && RECIPES[0].id, n: RECIPES.length, lang: LANG}));
    ok(JSON.stringify(before) === JSON.stringify(after) && after.cur === to && after.lang === lg, `C2 ${tag} 家族の端末の国・言葉は変わらない: ${JSON.stringify(after)}`);
    if (st.rows.length < 6 || st.dis){ await ec.close(); await cook.ctx.close(); continue; }
    // ○をつけて返す
    await e.click('.sheet [data-act="vote-mark"][data-i="0"][data-v="2"]');
    await e.click('.sheet [data-act="vote-mark"][data-i="2"][data-v="2"]');
    await e.click('.sheet [data-act="vote-return"]');
    const atext = await e.evaluate(() => (document.querySelector('#share-text') || {}).value || ''), alink = (atext.match(/https:\/\/\S+/) || [''])[0];
    ok(alink.includes('#g=') && atext.includes(st.rows[0].nm) && atext.includes(st.rows[2].nm), `C4a ${tag} 返す文に○の料理名（家族の画面の言葉）: ${atext.split('\n')[1] || ''}`);
    ok(await e.evaluate(cc => S.settings.country === cc && (!S.votes || !S.votes.length), to), `C4b ${tag} 家族の端末に表を残さず、国もそのまま`);
    await ec.close();
    await cook.p.evaluate(h => { location.hash = h; }, hashOf(alink));
    await cook.p.waitForTimeout(400);
    const got = await cook.p.evaluate(w => { const v = S.votes.find(x => x.w === w); return v ? Object.values(v.ans) : []; }, cook.w);
    ok(got.length === 1 && got[0] === '212111', `C4c ${tag} 作る人の表に返事が入る: ${JSON.stringify(got)}`);
    await cook.ctx.close();
}
// C5 国の印のない前のリンク（US の料理 → JP の端末）
{
    const ids = ['us_tacos'];
    const {p: e, ctx} = await open({country: 'JP', uiLang: 'ja'}, '#g=' + b64u(JSON.stringify({v: 1, k: 'q', w: '20991228', d: ids})));
    try{ await e.waitForFunction(() => document.querySelectorAll('#sheet-root .vt-row').length >= 1, null, {timeout: 20000}); }catch(_){}
    ok(await e.evaluate(() => document.querySelectorAll('#sheet-root .vt-row').length) === 1 && !(await e.evaluate(() => document.querySelector('[data-act="vote-return"]').disabled)), 'C5 国の印のないリンクでも料理の番号の国から読む');
    await ctx.close();
}
// C6 読めない料理だけ
{
    const {p: e, ctx} = await open({country: 'JP', uiLang: 'ja'}, '#g=' + b64u(JSON.stringify({v: 1, k: 'q', w: '20991228', d: ['u1234', 'u1235'], c: 'US'})));
    await e.waitForTimeout(1500);
    const s = await e.evaluate(() => ({t: document.querySelector('#sheet-root').textContent, dis: document.querySelector('[data-act="vote-return"]').disabled}));
    ok(s.dis && s.t.includes('作る人に') && s.t.includes('もう一度送って'), 'C6 読めない料理だけ: 案内が出て、「○を返す」は押せない: ' + s.t.slice(0, 200));
    await ctx.close();
}
// C7 国のデータが読めない → 案内 → もう一度読みこむ
{
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', serviceWorkers: 'block' });   // サービスワーカーの手持ち（キャッシュ）から国のデータが読めてしまわないように
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    let block = true;
    await ctx.route(/packs\/kr\.js/, r => block ? r.abort() : r.continue());
    await ctx.addInitScript(seedScript(SEED));
    await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'en', dishCount: 3, servings: 2}})); });
    const e = await ctx.newPage(); e.on('pageerror', x => errs.push(x.message));
    const krIds = ['kr_bulgogi', 'kr_jeyuk'];
    await e.goto(URL_ + '#g=' + b64u(JSON.stringify({v: 1, k: 'q', w: '20991228', d: krIds, c: 'KR'}))); await ready(e);
    try{ await e.waitForFunction(() => sheet && sheet.kind === 'vote-in' && sheet.loadErr, null, {timeout: 60000}); }catch(_){}
    const s = await e.evaluate(() => ({t: document.querySelector('#sheet-root').textContent, retry: !!document.querySelector('[data-act="vote-in-retry"]'), dis: document.querySelector('[data-act="vote-return"]').disabled}));
    ok(s.retry && s.dis && /signal/i.test(s.t), 'C7a 読めないとき: 案内（英語）と「もう一度読みこむ」: ' + s.t.slice(0, 200));
    block = false;
    if (s.retry) await e.click('[data-act="vote-in-retry"]');
    try{ await e.waitForFunction(() => document.querySelectorAll('#sheet-root .vt-row').length >= 1, null, {timeout: 30000}); }catch(_){}
    const n = await e.evaluate(() => ({rows: document.querySelectorAll('#sheet-root .vt-row').length, ids: typeof voteRec === "function" ? sheet.ids.filter(id => voteRec(id)).length : -1}));
    ok(n.rows === n.ids && n.rows >= 1 && !(await e.evaluate(() => document.querySelector('[data-act="vote-return"]').disabled)), 'C7b もう一度読みこむと出る: ' + JSON.stringify(n));
    await ctx.close();
}
ok(!errs.length, 'ページのエラー 0: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`vote-country: ${checks - fails}/${checks} ok` + (fails ? `（SEED=${SEED}）` : ''));
process.exit(fails ? 1 : 0);
