#!/usr/bin/env node
// 第48回（速さ）R184: 遅い回線ではじめて開いたとき、国を選ぶ画面が出るまでの時間
//  使い方: node tools/tests/perf48.mjs [http://localhost:9291/]   （SLOW=0 で遅い回線の測りを省く）
//  P1 はじめて開いたとき（国をまだ選んでいない）、本体（index.html）を読み終えるまでに、料理の絵の一覧（img/dish/manifest.json）を取りはじめない
//     （本体と回線を取り合わない）。端末が日本語なら英語の訳（i18n/en.js）も取らない。国を選ぶ画面までに料理の絵は読まない
//  P2 国を選ぶ画面が出たあとは、料理の絵の一覧を読む（絵が出る）。2回目に開いたとき（国を選んだあと）は、いままでどおり先に取りはじめる
//  P3 遅い回線（試験と同じ 400kbps・遅れ 400ms・CPU 1/4）で、国を選ぶ画面は「本体を読み終える時間＋数秒」で出る（ほかのファイルを待たない）。秒数を出す
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const SHEET = () => typeof sheet !== 'undefined' && sheet && sheet.kind === 'country' && !!document.querySelector('#sheet-root [data-act="cc-choose"]');
const BW = 400 * 1024 / 8;
const fresh = async (locale, slow) => {
    const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, locale, serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(locale + ': ' + e.message));
    const reqs = []; const t0 = Date.now();
    p.on('request', r => reqs.push({ t: Date.now() - t0, u: r.url().replace(URL_, '').replace(/\?.*$/, '') }));
    const sizes = {}, done = {}; p.on('requestfinished', async r => { const u = r.url().replace(URL_, '').replace(/\?.*$/, ''); done[u] = Date.now() - t0; try{ sizes[u] = (await r.sizes()).responseBodySize; }catch(e){} });
    if (slow){ const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: BW, uploadThroughput: 200 * 1024 / 8 }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
    await p.goto(URL_, { waitUntil: 'commit', timeout: 180000 });
    let tSheet = null; try{ await p.waitForFunction(SHEET, null, { timeout: 180000, polling: 200 }); tSheet = Date.now() - t0; }catch(e){}
    for (let i = 0; i < 30 && sizes[''] == null && sizes['index.html'] == null; i++) await p.waitForTimeout(100);   // 本体の大きさ（読み終えた知らせ）を待つ
    return { ctx, p, reqs, sizes, done, tSheet };
};
// P1・P2
for (const [loc, needEn] of [['ja-JP', false], ['en-US', true]]){
    const { ctx, p, reqs, done, tSheet } = await fresh(loc, false);
    const tHtml = done[''] != null ? done[''] : done['index.html'];
    const before = reqs.filter(r => r.t < tHtml).map(r => r.u), beforeSheet = reqs.filter(r => r.t <= tSheet).map(r => r.u);
    ok(tSheet != null && tHtml != null && !before.some(u => /img\/dish\//.test(u)) && (needEn || !before.includes('i18n/en.js')) && !beforeSheet.some(u => /img\/dish\/(?!manifest)/.test(u)),
        `P1 ${loc}: 本体を読み終えるまでに、絵の一覧・絵${needEn ? '' : '・英語の訳'}を取りはじめない（本体と取り合わない）。国を選ぶ画面までに料理の絵を読まない: ` + JSON.stringify({ before, beforeSheet }));
    await pickCountry(p, 'JP').catch(e => errs.push('pick: ' + e.message));
    const got = await p.waitForFunction(() => typeof GEN_STATE !== 'undefined' && GEN_STATE === 1, null, { timeout: 15000 }).then(() => true).catch(() => false);
    ok(got && reqs.some(r => r.u === 'img/dish/manifest.json'), `P2 ${loc}: 国を選んだあと、絵の一覧を読む: ` + JSON.stringify({ got }));
    // 2回目に開く（国を選んだあと）: 本体のスクリプトより先に絵の一覧を取りはじめる
    const r2 = []; const t1 = Date.now(); p.on('request', r => r2.push({ t: Date.now() - t1, u: r.url().replace(URL_, '').replace(/\?.*$/, '') }));
    await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted, null, { timeout: 30000 }).catch(() => {});
    const iMan = r2.findIndex(r => r.u === 'img/dish/manifest.json'), early = await p.evaluate(() => typeof GEN_STATE !== 'undefined' && GEN_STATE === 1);
    ok(iMan >= 0 && early, `P2 ${loc}: 2回目に開いたときは、絵の一覧を読む: ` + JSON.stringify({ iMan }));
    await ctx.close();
}
// P3 遅い回線
if (process.env.SLOW !== '0'){
    for (const loc of ['ja-JP', 'en-US']){
        const { ctx, sizes, tSheet } = await fresh(loc, true);
        const html = sizes[''] || sizes['index.html'] || 0, en = loc.startsWith('ja') ? 0 : (sizes['i18n/en.js'] || 0);
        const expect = Math.round(((html + en) / BW) * 1000 + 3 * 400);   // 本体（と英語の訳）を読み終える時間（遅れ 3回分）
        console.log(`   ${loc}: 国を選ぶ画面まで ${(tSheet / 1000).toFixed(1)} 秒（本体 ${html} バイト・英語の訳 ${en} バイト・読み終える目安 ${(expect / 1000).toFixed(1)} 秒）`);
        ok(tSheet != null && html > 0 && tSheet <= expect + 8000, `P3 ${loc}: 遅い回線で、国を選ぶ画面が本体を読み終えて数秒で出る: ` + JSON.stringify({ tSheet, expect }));
        await ctx.close();
    }
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nperf48: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
