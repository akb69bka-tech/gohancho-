#!/usr/bin/env node
// 「まるごと入れ替え」（7品）で料理の絵が必ず出る回帰テスト（Playwright。使い方: node tools/tests/marugoto-img.mjs [http://localhost:8881/]）
//  全21か国 × 7品 × 数回（N。既定 6）押して、
//  1. 押した直後: 絵がまだ届いていない器は、絵を出さず生成りの丸（pload）で待ち、器の大きさは変わらない。絵のない料理は同じ大きさの生成りの丸（pwait）
//  2. 待てば（最大8秒）絵のある料理はすべて読みこみ済みで、器に絵が出ている（pload が残らない・背景の絵が none でない・読みこみ失敗なし）
//  3. 絵がないのは「絵の資料が無い料理」だけ（photoOf が null）。絵のある料理なのに空・壊れ・取り違え（器の絵が別の料理）がない
//  4. 押す前後で器の位置が動かない（絵が届いても大きさ・位置が変わらない）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const N = Number(process.env.N) || 6;
const CCS = (process.env.CCS || 'JP,US,GB,FR,DE,IT,ES,PL,TR,EG,IN,CN,TW,KR,TH,VN,ID,PH,MX,BR,PE').split(',');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const tally = {};
for (const cc of CCS){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('marugoto-img', cc)));
    await ctx.addInitScript(c => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: c, uiLang: 'ja', dishCount: 7, servings: 2}})); }, cc);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    const t = tally[cc] = {dishes: 0, noPic: 0};
    for (let i = 1; i <= N; i++){
        await p.evaluate(() => document.querySelector('[data-act=new-menu]').click());
        const at = `${cc} ${i}回目`;
        const snap = () => p.evaluate(() => {
            const out = [];
            document.querySelectorAll('#view .tray .spot').forEach(s => {
                const v = s.querySelector('.vessel'); if (!v || v.getAttribute('aria-hidden') === 'true' && !v.dataset.id && !v.matches('button')) return;
                const f = v.querySelector('.food'), m = /--img:\s*url\(['"]?([^'")]+)/.exec(v.getAttribute('style') || ''), R = v.getBoundingClientRect();
                const id = v.dataset.id || '';
                const r = id && typeof RECIPES !== 'undefined' ? RECIPES.find(x => x.id === id) || (session.menu.items.map(i => i.r).find(x => x && x.id === id)) : null;
                const ph = r && typeof photoOf === 'function' ? photoOf(r) : null;
                const u = m && new URL(m[1], location.href).href;
                out.push({id, pic: !!ph, src: m && m[1], expect: ph && ph.src, pload: v.classList.contains('pload'), pwait: v.classList.contains('pwait'),
                    bg: f ? getComputedStyle(f).backgroundImage : '', w: v.offsetWidth, x: v.offsetLeft, y: v.getBoundingClientRect().top + scrollY - (new DOMMatrix(getComputedStyle(v).transform)).m42,
                    loaded: !!u && performance.getEntriesByName(u).some(e => e.responseEnd > 0), fail: !!(m && typeof IMG_FAIL !== 'undefined' && IMG_FAIL.has(m[1]))});
            });
            return out;
        });
        await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        const a = await snap();
        ok(a.length >= 5, `${at}: お膳に器が出ている（${a.length}）`);
        for (const x of a){
            if (x.pic) ok(!x.pload ? true : x.bg === 'none' || x.bg.indexOf('url') < 0, `${at}: 絵の届く前の器は絵を出さず生成りの丸で待つ ${x.id}`);
            else if (x.id){ ok(x.pwait && x.w > 0, `${at}: 絵のない料理は同じ大きさの生成りの丸 ${x.id}`); }
        }
        // 絵が届くまで待つ（最大8秒）
        await p.waitForFunction(() => !document.querySelector('#view .tray .vessel.pload'), null, {timeout: 8000}).catch(() => {});
        const z = await snap();
        z.forEach((x, k) => {
            t.dishes++; if (!x.pic) t.noPic++;
            if (x.pic){
                ok(!x.pload, `${at}: 絵のある料理が待ちのまま残らない ${x.id}`);
                ok(x.bg.indexOf('url') >= 0 && x.src === x.expect, `${at}: 絵が器に出ている・別の料理の絵でない ${x.id} src=${x.src} expect=${x.expect}`);
                ok(x.loaded && !x.fail, `${at}: 絵が読みこみ済み・壊れていない ${x.id}`);
            }
            const y = a[k]; if (y && y.id === x.id) ok(Math.abs(y.w - x.w) <= 1 && Math.abs(y.x - x.x) <= 1 && Math.abs(y.y - x.y) <= 1, `${at}: 絵が届いても器の大きさ・位置が動かない ${x.id}`);
        });
    }
    ok(errs.length === 0, `${cc}: ページのエラーなし ${errs[0] || ''}`);
    await ctx.close();
}
await b.close();
const tot = Object.values(tally).reduce((s, v) => ({d: s.d + v.dishes, n: s.n + v.noPic}), {d: 0, n: 0});
console.log(`marugoto-img: ${checks} 確認 / ${fails} 失敗（料理 ${tot.d} 品のうち絵の資料なし ${tot.n} 品 = ${(100 * tot.n / Math.max(1, tot.d)).toFixed(1)}%）`);
process.exit(fails ? 1 : 0);
