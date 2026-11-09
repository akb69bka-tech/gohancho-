#!/usr/bin/env node
// 夜勤明けスイッチ（Q28=C）の回帰テスト（Playwright。使い方: node tools/tests/night-r1.mjs [http://localhost:9402/]）
//  N1 OFF: 深夜0時・15時・21時は入口なし／ON: 一日中（0・4・7・11・15・21・23時）出る。ONでも朝食の料理がない条件では出ない仕様は変えない
//  N2 ON の入口が 195〜430px × 文字3段階 × 0時・15時・21時で、お膳・下の帯・下のタブに重ならず、切れず、横にはみ出さない
//  N3 設定のスイッチで切り替わり、保存データに残り、開き直しても残る。OFFに戻すと入口が消える
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const KEY = 'gohancho.v1';
const open = async ({w = 390, h = 844, hour = 8, settings = {}, tag = '', keep = null} = {}) => {
    const ctx = keep || await b.newContext({viewport: {width: w, height: h}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    if (!keep){
        await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
        await ctx.addInitScript(seedScript(seedFor('night', tag + w + hour)));
        await ctx.addInitScript(([settings, KEY]) => { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, settings)})); }, [settings, KEY]);
    }
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({time: new Date(`2026-10-29T${String(hour).padStart(2, '0')}:10:00+09:00`)});
    await p.goto(URL_); await ready(p); await p.clock.runFor(800);
    return {p, ctx};
};
const has = p => p.evaluate(() => !!document.querySelector('#view [data-act=bf-open]'));

// N1
for (const hour of [0, 4, 7, 11, 15, 21, 23]){
    const off = await open({hour, tag: 'off'}); const on = await open({hour, settings: {nightShift: true}, tag: 'on'});
    const morning = hour >= 4 && hour < 11;
    ok(await has(off.p) === morning, `N1 OFF ${hour}時: 入口 ${morning ? 'あり' : 'なし'}`);
    ok(await has(on.p) === true, `N1 ON ${hour}時: 入口あり`);
    await off.ctx.close(); await on.ctx.close();
}
// N2
for (const w of [195, 360, 390, 430]) for (const ts of [undefined, 1, 2]) for (const hour of [0, 15, 21]){
    const {p, ctx} = await open({w, h: 844, hour, settings: Object.assign({nightShift: true}, ts ? {textSize: ts} : {}), tag: 'n2' + ts});
    const g = await p.evaluate(() => {
        const e = document.querySelector('#view [data-act=bf-open]'); if (!e) return null;
        const r = e.getBoundingClientRect(), tr = document.querySelector('#view .tray').getBoundingClientRect();
        const fixed = [...document.querySelectorAll('nav.tabs, .actionbar')].filter(x => x.getClientRects().length).map(x => x.getBoundingClientRect());
        return {r: [r.x, r.y, r.width, r.height], trBottom: tr.bottom, cut: e.scrollHeight > e.clientHeight + 1, vw: innerWidth, sw: document.documentElement.scrollWidth, fixedTops: fixed.map(q => q.top), r2: [r.top, r.bottom]};
    });
    // 入口は固定の帯・タブの「上」にスクロール位置を選んで見えるか: ページ末尾までスクロールしたとき、固定部品と重ならない余白があること
    const g2 = await p.evaluate(async () => {
        const e = document.querySelector('#view [data-act=bf-open]'); if (!e) return null;
        window.scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const r = e.getBoundingClientRect(); let floor = innerHeight;
        document.querySelectorAll('nav.tabs, .actionbar').forEach(x => { const q = x.getBoundingClientRect(); if (q.height && /fixed|sticky/.test(getComputedStyle(x).position) && q.top < floor) floor = q.top; });
        window.scrollTo(0, 0); return {bottom: r.bottom, floor};
    });
    ok(g && g2 && g.r[3] >= 44 && g.r[0] >= 0 && g.r[0] + g.r[2] <= g.vw + 0.5 && g.r[1] >= g.trBottom - 0.5 && !g.cut && g.sw <= g.vw + 1 && g2.bottom <= g2.floor + 0.5,
        `N2 ${w}px 文字${ts || 0} ${hour}時: 入口がお膳の下・帯とタブの上で切れず押せる: ` + JSON.stringify([g, g2]));
    await ctx.close();
}
// N3
{
    const {p, ctx} = await open({hour: 21, tag: 'n3'});
    ok(!(await has(p)), 'N3 初期はOFF（21時は入口なし）');
    await p.evaluate(() => { setTab('settings'); setTabShow('mode'); }); await p.waitForTimeout(300);   // 設定はタブ分け（11/09）。夜勤明けは「モード」のタブの中
    const sw = await p.evaluate(() => { const c = document.querySelector('input[data-act=night-shift]'); if (!c) return null; c.scrollIntoView({block: 'center'}); const r = c.closest('label').getBoundingClientRect(); return {checked: c.checked, w: r.width, vw: innerWidth, h: r.height}; });
    ok(sw && !sw.checked && sw.w <= sw.vw && sw.h >= 20, 'N3 設定にスイッチがある: ' + JSON.stringify(sw));
    await p.click('input[data-act=night-shift]'); await p.waitForTimeout(300);
    const saved = await p.evaluate(KEY => JSON.parse(localStorage.getItem(KEY)).settings.nightShift, KEY);
    ok(saved === true, 'N3 保存データに入る: ' + saved);
    await p.evaluate(() => setTab('today')); await p.waitForTimeout(300);
    ok(await has(p), 'N3 ONにすると21時でも入口が出る');
    await p.close();
    const again = await open({keep: ctx, hour: 21});
    ok(await has(again.p), 'N3 開き直しても残る');
    await again.p.evaluate(() => setTab('settings')); await again.p.waitForTimeout(300);
    const on = await again.p.evaluate(() => document.querySelector('input[data-act=night-shift]').checked);
    ok(on === true, 'N3 設定のスイッチもONのまま');
    await again.p.click('input[data-act=night-shift]'); await again.p.waitForTimeout(300);
    await again.p.evaluate(() => setTab('today')); await again.p.waitForTimeout(300);
    ok(!(await has(again.p)), 'N3 OFFに戻すと入口が消える');
    await ctx.close();
}
ok(errs.length === 0, 'JS エラーなし: ' + errs.slice(0, 3).join(' | '));
await b.close();
console.log(fails ? `FAIL ${fails}` : 'all ok');
process.exit(fails ? 1 : 0);
