#!/usr/bin/env node
// 第54回 R228・R229（安全寄り）: すばやい2回押しの2回目が、指の下に来たちがうボタン（画面を送った・並びが変わった・段が切りかわった）を押さない。
// 受けなかったときは、ボタンの横に「もう一度押してください」を1.5秒出す
//  使い方: node tools/tests/r228.mjs [http://localhost:9331/]   （LANGS=ja,en でしぼれる）
//  洗い出し（v153・日本語・195/320/390・15画面）で、2回目がちがうボタンに当たったところ: 設定の食の決まり（→ なかまのチップ）、家族のアレルギー（→ 人数）、
//  設定のタブの移動（→ タブの列）、作り方の段（→ 買い物の「済み」）、1週間プラン（→ 料理の画面のうしろ）など
//  X1 18言語 × 195・320・390: 設定の「ベジタリアン向け」を下のタブのすぐ上で2回押し → なかまのチップ・ほかの食の決まりは入らない（avoid はベジタリアン向けの5つだけか、空）
//  X2 X1 で受けなかったとき、「もう一度押してください」がボタンのそばに出て（画面の中・訳がある）、1.5秒ほどで消える
//  X3 家族のアレルギーのなかま（卵）を2回押し → 人数は変わらない（日本語・英語 × 3つの幅）
//  X4 作り方の段（買い物）を2回押し → 買い物の「済み」は入らない（日本語・英語 × 3つの幅）
//  X5 同じボタンの押し直し（人数の＋）は今までどおり2回とも受ける・間をあければ（0.7秒）ちがうボタンも受ける
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const ALL = ['ja', ...fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''))];
const LANGS = process.env.LANGS ? process.env.LANGS.split(',') : ALL;
const WIDTHS = [[195, 422], [320, 568], [390, 844]];
const TR = lg => { if (lg === 'ja') return 'もう一度押してください'; let d = null; const vm = require('node:vm'); vm.runInNewContext(fs.readFileSync(`${ROOT}/i18n/${lg}.js`, 'utf8'), {GOHAN_I18N: (l, o) => { d = o; }, window: {}}); return d['もう一度押してください']; };

const b = await chromium.launch(LAUNCH);
const open = async (lg, w, h, extra = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        Object.assign({onboarded: true, firstUse: '2020-01-01', settings: {country: 'JP', uiLang: lg, dishCount: 3, servings: 2}, family: [{id: 'f1', name: 'Ravi', role: 'adult', avoid: [], allergy: []}]}, extra));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lg + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, {timeout: 30000});
    return {p, ctx};
};
// ボタンを下のタブのすぐ上まで送り、その真ん中を2回すばやく押す（60ms）。2回目の直前に指の下にあったボタンも返す
const dbl = async (p, sel, gap = 60) => {
    const c = await p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const nav = document.querySelector('nav.tabs').getBoundingClientRect(); const q0 = e.getBoundingClientRect(); window.scrollBy(0, q0.bottom - (nav.top - 6)); const q = e.getBoundingClientRect(); return {x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2}; }, sel);
    if (!c) return null;
    await p.waitForTimeout(120);
    await p.mouse.click(c.x, c.y); await p.waitForTimeout(gap);
    const under = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y), t = e && e.closest('[data-act]'); return t ? t.dataset.act + '|' + (t.dataset.v || '') : ''; }, [c.x, c.y]);
    await p.mouse.click(c.x, c.y);
    return {c, under};
};
const tipOf = p => p.evaluate(() => { const e = document.querySelector('.tap-again'); if (!e) return null; const q = e.getBoundingClientRect(); return {text: e.textContent, inView: q.left >= -0.5 && q.right <= innerWidth + 0.5 && q.top >= -0.5 && q.bottom <= innerHeight + 0.5}; });

// ---- X1・X2 ----
{
    const bad = []; let held = 0, tipOk = 0, tipBad = [];
    for (const lg of LANGS) for (const [w, h] of WIDTHS){
        const {p, ctx} = await open(lg, w, h);
        await p.evaluate(async () => { setTab('settings'); setTabShow('food'); await new Promise(r => setTimeout(r, 200)); });
        const r = await dbl(p, '#view [data-act="toggle-avoid-diet"][data-v="vegi"]');
        await p.waitForTimeout(150);
        const tip = await tipOf(p);
        await p.waitForTimeout(400);
        const av = await p.evaluate(() => S.settings.avoid.slice().sort().join());
        const vegi = ['@beef', '@chicken', '@fish', '@pork', '@shellfish'].join();
        if (av !== vegi && av !== '') bad.push(`${lg} ${w}: ${av}（2回目の下: ${r && r.under}）`);
        if (r && r.under && r.under !== 'toggle-avoid-diet|vegi'){ held++; if (!tip || tip.text !== TR(lg) || !tip.inView) tipBad.push(`${lg} ${w}: ${JSON.stringify(tip)}`); else tipOk++; }
        await p.waitForTimeout(1300);
        if (await tipOf(p)) tipBad.push(`${lg} ${w}: 1.5秒たっても消えない`);
        await ctx.close();
    }
    console.log('2回目の下にちがうボタンが来た形', held, '件');
    ok(bad.length === 0, `X1 ${LANGS.length}言語 × 195・320・390: 食の決まりの2回押しで、なかまのチップ・ほかの決まりが入らない: ` + bad.slice(0, 6).join(' | '));
    ok(tipBad.length === 0 && (held === 0 || tipOk === held), `X2 受けなかったときは「もう一度押してください」が画面の中に出て（訳あり）、1.5秒で消える（${tipOk}/${held}）: ` + tipBad.slice(0, 6).join(' | '));
}
// ---- X3 家族のアレルギー → 人数 ----
{
    const bad = [];
    for (const lg of ['ja', 'en']) for (const [w, h] of WIDTHS){
        const {p, ctx} = await open(lg, w, h);
        await p.evaluate(async () => { setTab('settings'); setTabShow('family'); session.famOpen = 'f1'; render(); await new Promise(r => setTimeout(r, 200)); });
        const s0 = await p.evaluate(() => S.settings.servings);
        const sel = await p.evaluate(() => { const e = document.querySelector('[data-fm="f1"] [data-act="fam-alg-fam"]'); return e ? `[data-fm="f1"] [data-act="fam-alg-fam"][data-v="${e.dataset.v}"]` : null; });
        if (!sel){ bad.push(`${lg} ${w}: 家族のアレルギーのボタンがない`); await ctx.close(); continue; }
        await dbl(p, sel); await p.waitForTimeout(500);
        const s1 = await p.evaluate(() => S.settings.servings);
        if (s1 !== s0) bad.push(`${lg} ${w}: 人数が ${s0}→${s1}`);
        await ctx.close();
    }
    ok(bad.length === 0, 'X3 家族のアレルギーの2回押しで、人数は変わらない: ' + bad.join(' | '));
}
// ---- X4 作り方の段 → 買い物の「済み」 ----
{
    const bad = [];
    for (const lg of ['ja', 'en']) for (const [w, h] of WIDTHS){
        const {p, ctx} = await open(lg, w, h);
        await p.click('[data-act="decide"]').catch(() => {}); await p.waitForTimeout(400);
        await p.evaluate(async () => { setTab('cook'); await new Promise(r => setTimeout(r, 300)); });
        const k0 = await p.evaluate(() => JSON.stringify(S.cook && [S.cook.shopOK, S.cook.ids]));
        const sel = await p.evaluate(() => { const e = [...document.querySelectorAll('#view [data-act="stage"]')].find(x => x.getBoundingClientRect().height); return e ? `#view [data-act="stage"][data-v="${e.dataset.v}"]` : null; });
        if (sel){ await dbl(p, sel); await p.waitForTimeout(500); }
        const k1 = await p.evaluate(() => JSON.stringify(S.cook && [S.cook.shopOK, S.cook.ids]));
        if (k1 !== k0) bad.push(`${lg} ${w}: ${k0} → ${k1}`);
        await ctx.close();
    }
    ok(bad.length === 0, 'X4 作り方の段の2回押しで、買い物の「済み」は入らない・決めた献立は変わらない: ' + bad.join(' | '));
}
// ---- X5 同じボタンの押し直しと、間をあけた押し ----
{
    const {p, ctx} = await open('ja', 390, 844);
    await p.evaluate(async () => { setTab('settings'); setTabShow('food'); await new Promise(r => setTimeout(r, 200)); });
    const r = await dbl(p, '#view [data-act="toggle-avoid-diet"][data-v="vegi"]', 700);   // 0.7秒あける
    await p.waitForTimeout(500);
    const av = await p.evaluate(() => S.settings.avoid.slice().sort().join());
    // 0.7秒あけた2回目は受ける: 指の下が同じボタンなら外れ（空）、ちがうボタンならそのボタンが入る
    ok(r && (r.under === 'toggle-avoid-diet|vegi' ? av === '' : av !== ['@beef', '@chicken', '@fish', '@pork', '@shellfish'].join()), 'X5 0.7秒あけた2回目は受ける: ' + JSON.stringify([r && r.under, av]));
    await ctx.close();
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
