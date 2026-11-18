#!/usr/bin/env node
// 第53回 R227（安全）: ベジタリアン向けを押した直後、一言と「卵も外す」「乳製品も外す」のボタンが下のタブの裏に隠れない（隠れたまま押そうとして、裏の下のタブを押さない）
//  使い方: node tools/tests/r227.mjs [http://localhost:9331/]   （LANGS=ja,en でしぼれる）
//  W1 18言語 × 幅195・320・390 × 設定（苦手・食の決まり）・家族の人: ベジタリアン向けのボタンを、下のタブのすぐ上まで送ってから指で押す（いちばん隠れやすい形）。
//     押したあと、一言とボタンが下のタブ・上の帯にかからず画面の中にある。「卵も外す」の真ん中を指で押すと、そのボタンに当たり（下のタブではない）、卵が入る・画面は変わらない
//  W2 すばやい2回押し（60ms）: 2回目は同じボタンの二度押しとして受けない（R224）か、受けても一言が出ているときは隠れない。卵・乳製品は勝手に外れない
//     一言が上の帯と下のタブのあいだより高いとき（幅195px の家族の人の画面）は、ボタンのある下の端が下のタブより上にあること（ボタンは必ず見えて押せる）
//  W3 卵は勝手に外さない（押す前と、ベジタリアン向けを押しただけでは @egg・@dairy が入らない）
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

const b = await chromium.launch(LAUNCH);
const open = async (lg, w, h) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, serviceWorkers: 'block', hasTouch: false});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        {onboarded: true, firstUse: '2020-01-01', settings: {country: 'JP', uiLang: lg, dishCount: 3, servings: 2}, family: [{id: 'f1', name: 'Ravi', role: 'adult', avoid: [], allergy: []}]});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lg + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, {timeout: 30000});
    return {p, ctx};
};
// 画面の中で、上の帯・下のタブにかからず見えているか
const state = (p, scope) => p.evaluate(scope => {
    const root = document.querySelector(scope), n = root && root.querySelector('.diet-vegi-note');
    let floor = innerHeight, ceil = 0;
    document.querySelectorAll('nav.tabs, .actionbar').forEach(e => { const q = e.getBoundingClientRect(); if (q.height && /fixed|sticky/.test(getComputedStyle(e).position) && q.top > innerHeight * .4 && q.top < floor) floor = q.top; });
    document.querySelectorAll('.set-tabs-bar').forEach(e => { const q = e.getBoundingClientRect(); if (q.height && /fixed|sticky/.test(getComputedStyle(e).position) && q.top <= 1 && q.bottom > ceil) ceil = q.bottom; });
    if (!n) return {none: true, floor, ceil};
    const r = n.getBoundingClientRect(), btns = [...n.querySelectorAll('.diet-add')].map(e => { const q = e.getBoundingClientRect(), x = (q.left + q.right) / 2, y = (q.top + q.bottom) / 2, hit = document.elementFromPoint(x, y); return {v: e.dataset.v, top: q.top, bottom: q.bottom, x, y, hits: !!hit && (hit === e || e.contains(hit))}; });
    return {top: r.top, bottom: r.bottom, floor, ceil, btns};
}, scope);
const bad = [];
for (const lg of LANGS){
    for (const [w, h] of WIDTHS){
        for (const where of ['settings', 'family']){
            for (const twice of [false, true]){
                const {p, ctx} = await open(lg, w, h);
                const sel = where === 'settings' ? '#view [data-act="toggle-avoid-diet"][data-v="vegi"]' : '[data-fm="f1"] [data-act="fam-avoid-diet"][data-v="vegi"]';
                const scope = where === 'settings' ? '#view' : '[data-fm="f1"]';
                await p.evaluate(async where => { setTab('settings'); setTabShow(where === 'settings' ? 'food' : 'family'); if (where === 'family'){ session.famOpen = 'f1'; render(); } await new Promise(r => setTimeout(r, 200)); }, where);
                // ベジタリアン向けのボタンを、下のタブのすぐ上まで送る（押した直後に一言が出る場所が、いちばん下のタブにかかりやすい形）
                await p.evaluate(sel => { const e = document.querySelector(sel); const nav = document.querySelector('nav.tabs').getBoundingClientRect(); const q = e.getBoundingClientRect(); window.scrollBy(0, q.bottom - (nav.top - 6)); }, sel);
                await p.waitForTimeout(150);
                const tag = `${lg} ${w} ${where}${twice ? ' 2回押し' : ''}`;
                const before = await p.evaluate(() => JSON.stringify([S.settings.avoid, S.family[0].avoid]));
                const c = await p.evaluate(sel => { const q = document.querySelector(sel).getBoundingClientRect(); return {x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2}; }, sel);
                await p.mouse.click(c.x, c.y);
                if (twice){ await p.waitForTimeout(60); await p.mouse.click(c.x, c.y); }
                await p.waitForTimeout(900);   // 出たばかりのボタンは 0.6 秒のあいだ受けない（R227）。読んでから押す間合い
                const tabNow = await p.evaluate(() => tab);
                if (tabNow !== 'settings'){ bad.push(`${tag}: 押したら下のタブ（${tabNow}）に当たった`); await ctx.close(); continue; }
                const av = await p.evaluate(() => [S.settings.avoid.slice(), S.family[0].avoid.slice()]);
                const mine = where === 'settings' ? av[0] : av[1];
                if (mine.includes('@egg') || mine.includes('@dairy')) bad.push(`${tag}: 卵・乳製品が勝手に入った`);
                const st = await state(p, scope);
                const vegiOn = await p.evaluate(where => dietBundleOn(where === 'settings' ? S.settings.avoid : S.family[0].avoid, 'vegi'), where);
                if (vegiOn && st.none) bad.push(`${tag}: ベジタリアン向けなのに一言が出ない`);
                if (!vegiOn && !twice) bad.push(`${tag}: 1回押しでベジタリアン向けにならない`);
                if (!st.none){
                    const tall = st.bottom - st.top > st.floor - st.ceil - 8;   // R230: 上下4pxのゆとりで入りきるなら、一言の頭も見えていること   // 一言が上の帯と下のタブのあいだより高いとき（幅195px の家族の人）は、ボタンのある下の端が下のタブより上にあればよい
                    if ((!tall && st.top < st.ceil - 0.5) || st.bottom > st.floor + 0.5) bad.push(`${tag}: 一言が帯・下のタブにかかる top=${Math.round(st.top)} bottom=${Math.round(st.bottom)} ceil=${Math.round(st.ceil)} floor=${Math.round(st.floor)}`);
                    st.btns.forEach(x => { if (!x.hits || x.bottom > st.floor + 0.5 || x.top < st.ceil - 0.5) bad.push(`${tag}: 「${x.v}」のボタンが隠れる・押せない`); });
                    // 「卵も外す」を指で押す: そのボタンに当たり、卵が入る。画面（タブ）は変わらない
                    const egg = st.btns.find(x => x.v === 'egg');
                    if (egg){ await p.mouse.click(egg.x, egg.y); await p.waitForTimeout(400);
                        const z = await p.evaluate(where => ({tab, av: (where === 'settings' ? S.settings.avoid : S.family[0].avoid).slice()}), where);
                        if (z.tab !== 'settings' || !z.av.includes('@egg')) bad.push(`${tag}: 「卵も外す」を押しても卵が入らない／ちがう所に当たった ${JSON.stringify(z)}`); }
                }
                await ctx.close();
            }
        }
    }
    console.log(lg, 'done', bad.length);
}
ok(bad.length === 0, `W1-W3 ${LANGS.length}言語 × 幅195・320・390 × 設定・家族の人 × 1回・すばやい2回押し: 一言とボタンが隠れず、押すとそのボタンに当たる。卵は勝手に外れない: ` + bad.slice(0, 10).join(' | '));
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
