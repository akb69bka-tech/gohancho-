#!/usr/bin/env node
// 第52回 R226（安全）: 食の決まりで「ベジタリアン向け」を選んでも、卵・乳製品は外さない。選んだときにそのことを一言で知らせ、卵・乳製品も外すボタンを添える
//  使い方: node tools/tests/r226.mjs [http://localhost:9331/]   （LANGS=ja,en でしぼれる）
//  V1 設定（苦手・食の決まり）: ベジタリアン向けを押すと一言とボタン2つが出る。卵・乳製品は勝手に外れない（avoid に @egg・@dairy が入らない）
//  V2 「卵も外す」を押すと @egg が入り、そのボタンは消える。「乳製品も外す」も押すと一言は消える。ヴィーガン向けを選んだときは一言を出さない
//  V3 家族の人の画面でも同じ（その人の avoid にだけ入る）
//  V4 インド（N090 の形）: ベジタリアン向けだけでは卵カレーは外れない（今までどおり）。「卵も外す」を押すと卵カレーが外れる
//  V5 18言語 × 幅 195・320・390: 一言とボタンが画面に入り、字が切れない・横スクロールしない
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
const FAM = [{id: 'f1', name: 'ラヴィ', role: 'adult', avoid: [], allergy: []}];

const b = await chromium.launch(LAUNCH);
const open = async (o = {}) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: 844}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        {onboarded: true, firstUse: '2020-01-01', settings: {country: o.cc || 'JP', uiLang: o.lg || 'ja', dishCount: 3, servings: 2}, family: o.family || FAM});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push((o.lg || 'ja') + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, {timeout: 30000});
    return {p, ctx};
};
const food = p => p.evaluate(async () => { setTab('settings'); setTabShow('food'); await new Promise(r => setTimeout(r, 150)); });
const note = (p, scope) => p.evaluate(scope => { const root = scope ? document.querySelector(scope) : document.querySelector('#view'); const n = root && root.querySelector('.diet-vegi-note'); return n ? {text: n.innerText, btn: [...n.querySelectorAll('.diet-add')].map(x => x.dataset.v)} : null; }, scope);

// ---- V1・V2 設定 ----
{
    const {p, ctx} = await open();
    await food(p);
    ok(!(await note(p)), 'V1 選ぶ前は一言を出さない');
    await p.click('[data-act="toggle-avoid-diet"][data-v="vegi"]'); await p.waitForTimeout(250);
    const n1 = await note(p), av1 = await p.evaluate(() => S.settings.avoid.slice());
    ok(n1 && /卵・乳製品は外しません/.test(n1.text) && n1.btn.join() === 'egg,dairy', 'V1 ベジタリアン向けを押すと、一言とボタン2つ（卵・乳製品）: ' + JSON.stringify(n1));
    ok(!av1.includes('@egg') && !av1.includes('@dairy') && av1.includes('@pork'), 'V1 卵・乳製品は勝手に外れない: ' + av1.join(','));
    await p.click('.diet-vegi-note .diet-add[data-v="egg"]'); await p.waitForTimeout(250);
    const n2 = await note(p), av2 = await p.evaluate(() => S.settings.avoid.slice());
    ok(av2.includes('@egg') && !av2.includes('@dairy') && n2 && n2.btn.join() === 'dairy', 'V2 「卵も外す」で卵だけが入り、そのボタンは消える: ' + JSON.stringify([av2, n2]));
    await p.click('.diet-vegi-note .diet-add[data-v="dairy"]'); await p.waitForTimeout(250);
    const av3 = await p.evaluate(() => S.settings.avoid.slice());
    ok(av3.includes('@dairy') && !(await note(p)), 'V2 「乳製品も外す」も押すと、一言は消える: ' + av3.join(','));
    ok(await p.evaluate(() => dietBundleOn(S.settings.avoid, 'vegan')), 'V2 卵・乳製品を足すと、ヴィーガン向けと同じ中身になる');
    await p.evaluate(() => { S.settings.avoid = []; delete S.settings.dietAdd; save(); render(); }); await food(p);
    await p.click('[data-act="toggle-avoid-diet"][data-v="vegan"]'); await p.waitForTimeout(250);
    ok(!(await note(p)), 'V2 ヴィーガン向けを選んだときは一言を出さない');
    await ctx.close();
}
// ---- V3 家族の人 ----
{
    const {p, ctx} = await open();
    await p.evaluate(async () => { setTab('settings'); setTabShow('family'); session.famOpen = 'f1'; render(); await new Promise(r => setTimeout(r, 200)); });
    const has = await p.evaluate(() => !!document.querySelector('[data-fm="f1"] [data-act="fam-avoid-diet"][data-v="vegi"]'));
    ok(has, 'V3 家族の人の画面に食の決まりのボタンがある');
    if (has){
        await p.click('[data-fm="f1"] [data-act="fam-avoid-diet"][data-v="vegi"]'); await p.waitForTimeout(400);
        const n = await note(p, '[data-fm="f1"]');
        ok(n && n.btn.join() === 'egg,dairy', 'V3 家族の人でも、一言とボタン2つ: ' + JSON.stringify(n));
        await p.click('[data-fm="f1"] .diet-vegi-note .diet-add[data-v="egg"]'); await p.waitForTimeout(400);
        const r = await p.evaluate(() => ({m: S.family.find(x => x.id === 'f1').avoid.slice(), g: S.settings.avoid.slice()}));
        ok(r.m.includes('@egg') && !r.g.includes('@egg'), 'V3 「卵も外す」は、その人にだけ入る: ' + JSON.stringify(r));
    }
    await ctx.close();
}
// ---- V4 インド（N090） ----
{
    const {p, ctx} = await open({cc: 'IN', lg: 'en'});
    await p.evaluate(async () => { await loadBrowse('IN'); });
    await food(p);
    await p.click('[data-act="toggle-avoid-diet"][data-v="vegi"]'); await p.waitForTimeout(300);
    const a = await p.evaluate(() => { const r = RECIPES.find(x => x.id === 'in_eggcurry'); return {has: !!r, av: r ? isAvoided(r) : null}; });
    ok(a.has && a.av === false, 'V4 ベジタリアン向けだけでは、卵カレーは外れない（勝手に外さない）: ' + JSON.stringify(a));
    await p.click('.diet-vegi-note .diet-add[data-v="egg"]'); await p.waitForTimeout(300);
    const z = await p.evaluate(() => { const r = RECIPES.find(x => x.id === 'in_eggcurry'); return {av: isAvoided(r), any: RECIPES.filter(x => !isAvoided(x) && x.items.some(i => !i.opt && /(^|\s)eggs?(\s|$)/.test(i.key))).map(x => x.id).slice(0, 5)}; });
    ok(z.av === true && z.any.length === 0, 'V4 「卵も外す」を押すと、卵カレー（と卵を使う料理）が外れる: ' + JSON.stringify(z));
    await ctx.close();
}
// ---- V5 18言語 × 狭い幅 ----
{
    const bad = [];
    for (const lg of LANGS){
        const {p, ctx} = await open({lg});
        await food(p);
        await p.click('[data-act="toggle-avoid-diet"][data-v="vegi"]'); await p.waitForTimeout(250);
        for (const w of [195, 320, 390]){
            await p.setViewportSize({width: w, height: 800}); await p.waitForTimeout(200);
            const r = await p.evaluate(() => { const n = document.querySelector('.diet-vegi-note'); if (!n) return {none: true};
                const out = [], W = innerWidth;
                [n, ...n.querySelectorAll('p, .diet-add')].forEach(e => { const q = e.getBoundingClientRect(); if (q.left < -0.5 || q.right > W + 0.5) out.push(e.className + ' 画面の外'); if (e.scrollWidth > e.clientWidth + 1) out.push(e.className + ' 字が切れる'); });
                if (document.documentElement.scrollWidth > W + 1) out.push('横スクロール');
                const t = n.querySelector('p').textContent;
                return {out, t, b: [...n.querySelectorAll('.diet-add')].map(e => e.textContent)}; });
            if (r.none) bad.push(`${lg} ${w}: 一言が出ない`);
            else { r.out.forEach(x => bad.push(`${lg} ${w}: ${x}`)); if (lg !== 'ja' && /[ぁ-ん]/.test(r.t + r.b.join(''))) bad.push(`${lg}: 訳がない`); }
        }
        await ctx.close();
    }
    ok(bad.length === 0, `V5 ${LANGS.length}言語 × 幅195・320・390: 一言とボタンが画面に入り、字が切れない: ` + bad.slice(0, 8).join(' / '));
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
