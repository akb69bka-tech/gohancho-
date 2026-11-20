#!/usr/bin/env node
// 日本語の変換中に Enter を押したときの回帰テスト（第51回。使い方: node tools/tests/ime51.mjs [http://localhost:9291/]）
//  変換中の字（き・きの・きのこ…）を入れて「キノコ」と確定しても、フォームは送られず、何も足さない・変えない。確定のあとの Enter では送られる（ふつうの動き）
//  I1 苦手を足す欄（設定） I2 冷蔵庫に足す欄（材料から） I3 備蓄の欄 I4 料理名から I5 材料からの検索
//  Chromium の IME の動きを CDP（Input.imeSetComposition・Input.insertText）でまねる。確定の Enter そのもの（実機のかな入力・iPhone）はまねられない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED } = require('../lib/pw.cjs');
const URL_ = (u => u.endsWith('/') ? u : u + '/')(process.argv[2] || process.env.BASE || BASE_);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(st)); }, { onboarded: true, firstUse: '2020-01-01', settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2 }, family: [] });
const P = await ctx.newPage(); P.on('pageerror', e => errs.push(e.message));
await P.goto(URL_); await P.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, { timeout: 30000 });
const cdp = await ctx.newCDPSession(P);
await P.evaluate(() => { window.__sub = []; document.addEventListener('submit', e => window.__sub.push(e.target.dataset.form), true); });
const ime = async (sel, steps, commit) => {
    await P.focus(sel);
    for (const s of steps){ await cdp.send('Input.imeSetComposition', { text: s, selectionStart: s.length, selectionEnd: s.length }); await P.waitForTimeout(80); }
    await cdp.send('Input.insertText', { text: commit }); await P.waitForTimeout(500);
};
// [名前, 画面を出す, 入力欄, 送られるフォーム, 変わってはいけないもの]
const CASES = [
    ['I1 苦手を足す欄（設定）', () => { setGo('food'); }, '#avoid-input', 'add-avoid', () => JSON.stringify([S.settings.avoid || [], S.settings.avoidX || {}])],
    ['I2 冷蔵庫に足す欄（材料から）', () => { setTab('fridge'); }, '#ing-input', 'add-ing', () => JSON.stringify(S.fridge || [])],
    ['I3 備蓄の欄', () => { setTab('fridge'); const d = document.querySelector('details[data-fold="fr-stock"]'); if (d) d.open = true; }, '#stock-name', 'stock-add', () => JSON.stringify(S.stock || [])],
    ['I4 料理名から', () => { setTab('name'); }, '#ns-input', 'ns', () => JSON.stringify([menuIds(), S.settings, S.fridge || []])],
    ['I5 材料からの検索', () => { setTab('fridge'); }, '#search-input', 'search', () => JSON.stringify([menuIds(), S.settings, S.fridge || []])],
];
for (const [nm, go, sel, form, val] of CASES){
    await P.evaluate(go); await P.waitForTimeout(400);
    const vis = await P.evaluate(sel => { const e = document.querySelector(sel); if (e && e.offsetParent) e.scrollIntoView({ block: 'center' }); return !!(e && e.offsetParent); }, sel);
    if (!vis){ ok(false, `${nm}: 入力欄 ${sel} が画面にない`); continue; }
    const v0 = await P.evaluate(val); await P.evaluate(() => { window.__sub = []; });
    await ime(sel, ['k', 'き', 'きn', 'きの', 'きのk', 'きのこ'], 'キノコ');
    const r = await P.evaluate(([sel, f]) => ({ sub: window.__sub.slice(), v: (document.querySelector(sel) || {}).value, now: (0, eval)('(' + f + ')')() }), [sel, val.toString()]);
    ok(!r.sub.length && r.now === v0 && r.v === 'キノコ', `${nm}: 変換中・変換の確定ではフォームを送らず、何も足さない・変えない: ` + JSON.stringify({ sub: r.sub, v: r.v, changed: r.now !== v0 }));
    await P.press(sel, 'Enter'); await P.waitForTimeout(400);
    const sub2 = await P.evaluate(() => window.__sub.slice());
    ok(sub2.length === 1 && sub2[0] === form, `${nm}: 確定のあとの Enter では送られる（${form}）: ` + JSON.stringify(sub2));
}
await b.close();
if (errs.length){ console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nime51: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
