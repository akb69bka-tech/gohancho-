#!/usr/bin/env node
// 第49回（速さ）R184 の続き: 公開用に軽くした版（tools/build/slim.mjs。コメント・字下げ・空白を取る）で、遅い回線ではじめて開く速さ
//  使い方: node tools/tests/perf49.mjs [http://localhost:9291/]   （引数の URL は元の版。軽くした版はこのテストが自分で作って配る。SLOW=0 で遅い回線の測りを省く）
//  B1 軽くした版を作れる（元と軽くした版の JS を構文木で読み比べ、字句の並びが同じ。違えば作るところで止まる）。本体は元の 80% 以下の大きさ
//  B2 軽くした版でも、はじめての流れ（国 → 献立を見る）が進み、献立が出る。アレルギー（乳）を選ぶと、乳の料理が献立に残らない。英語に切りかえられる。ページのエラーなし
//  B3 軽くした版でも、2回目は電波がなくても開ける（sw.js）
//  P1 遅い回線（試験と同じ 400kbps・遅れ 400ms・CPU 1/4）で、国を選ぶ画面までの秒数を、元の版と軽くした版で測る（日本語・英語の端末）。
//     軽くした版は、元の版より、減らした大きさを読む時間の 7 割以上早い。秒数を出す
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, pickCountry } = require('../lib/pw.cjs');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_URL = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };

// ---- B1 軽くした版を作る ----
const DIST = fs.mkdtempSync(path.join(os.tmpdir(), 'gohancho-slim-'));
let built = true, buildLog = '';
try{ buildLog = execFileSync(process.execPath, [path.join(ROOT, 'tools/build/slim.mjs'), DIST, '--link-assets'], { encoding: 'utf8' }); }catch(e){ built = false; buildLog = String(e.stdout || '') + String(e.stderr || e.message); }
const srcSize = fs.statSync(path.join(ROOT, 'gohancho/index.html')).size, dstSize = built ? fs.statSync(path.join(DIST, 'index.html')).size : 0;
ok(built && dstSize > 0 && dstSize <= srcSize * 0.8, `B1 軽くした版を作れる（構文木が元と同じ）・本体 ${srcSize} → ${dstSize} バイト: ` + buildLog.trim().split('\n').slice(-2).join(' / '));
// 軽くした版を配る（圧縮しない。試験のサーバーと同じ）
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.css': 'text/css' };
const srv = http.createServer((req, res) => {
    let u = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (u.endsWith('/')) u += 'index.html';
    const f = path.join(DIST, u); if (!f.startsWith(DIST)){ res.writeHead(403); res.end(); return; }
    fs.stat(f, (e, st) => { if (e || !st.isFile()){ res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Content-Length': st.size }); fs.createReadStream(f).pipe(res); });
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const DST_URL = `http://127.0.0.1:${srv.address().port}/`;

const SHEET = () => typeof sheet !== 'undefined' && sheet && sheet.kind === 'country' && !!document.querySelector('#sheet-root [data-act="cc-choose"]');
const BW = 400 * 1024 / 8;
const fresh = async (url, locale, slow, sw = 'block') => {
    const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, locale, serviceWorkers: sw });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(url + ' ' + locale + ': ' + e.message));
    const t0 = Date.now();
    if (slow){ const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: BW, uploadThroughput: 200 * 1024 / 8 }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
    await p.goto(url, { waitUntil: 'commit', timeout: 180000 });
    let tSheet = null; try{ await p.waitForFunction(SHEET, null, { timeout: 180000, polling: 200 }); tSheet = Date.now() - t0; }catch(e){}
    return { ctx, p, tSheet };
};

// ---- B2 はじめての流れ・アレルギー・言語 ----
if (built){
    const { ctx, p, tSheet } = await fresh(DST_URL, 'ja-JP', false);
    let flow = false, menu = false, alg = null, en = null;
    try{
        await pickCountry(p, 'JP');
        await p.waitForFunction(() => sheet && sheet.kind === 'onboard' && document.querySelector('#sheet-root [data-act=ob-done]'), null, { timeout: 30000 });
        await p.click('#sheet-root [data-act=ob-done]');
        await p.waitForFunction(() => S.onboarded === true && !sheet && session.menu && document.querySelector('#view .tray .spot .nm'), null, { timeout: 30000 });
        flow = true; menu = await p.evaluate(() => session.menu.items.filter(x => x.r).length >= 2);
        alg = await p.evaluate(() => { S.settings.allergens = ['milk']; save(); reconcileMenu(); render();
            const bad = RECIPES.filter(r => !isAvoided(r) && !allergyConflict(r) && algSelectedHits(r, ['milk']).length).length;
            return { inMenu: session.menu.items.filter(x => x.r && allergyConflict(x.r)).map(x => x.r.id), bad, n: RECIPES.length }; });
        await p.evaluate(async () => { await switchLang('en', ++uiLangSeq); }); await p.waitForTimeout(500);
        en = await p.evaluate(() => ({ lang: LANG, h: (document.querySelector('nav.tabs') || {}).textContent || '' }));
    }catch(e){ errs.push('B2: ' + e.message.slice(0, 120)); }
    ok(tSheet != null && flow && menu, 'B2 軽くした版: はじめての流れが進み、献立が出る: ' + JSON.stringify({ tSheet, flow, menu }));
    ok(alg && !alg.inMenu.length && alg.bad === 0 && alg.n > 50, 'B2 軽くした版: 乳を選ぶと、乳の料理が献立に残らない: ' + JSON.stringify(alg));
    ok(en && en.lang === 'en' && /Today/.test(en.h), 'B2 軽くした版: 英語に切りかえられる: ' + JSON.stringify(en));
    await ctx.close();
    // B3 2回目は電波がなくても開ける
    { const ctx2 = await b.newContext({ viewport: { width: 360, height: 740 }, serviceWorkers: 'allow' });
      await ctx2.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
      await ctx2.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(st)); }, { onboarded: true, firstUse: '2026-11-14', settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2 } });
      const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push('B3: ' + e.message));
      await p2.goto(DST_URL); await p2.waitForFunction(() => typeof GH !== 'undefined' && GH.booted, null, { timeout: 30000 }).catch(() => {});
      const ready = await p2.evaluate(async () => { try{ const r = await navigator.serviceWorker.ready; return !!r.active; }catch(e){ return false; } });
      await p2.waitForTimeout(3000);
      await ctx2.setOffline(true); let off = false;
      try{ await p2.reload({ timeout: 30000 }); await p2.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && !!document.querySelector('#view .tray'), null, { timeout: 30000 }); off = true; }catch(e){}
      ok(ready && off, 'B3 軽くした版: 2回目は電波がなくても開ける: ' + JSON.stringify({ ready, off }));
      await ctx2.close(); }
}

// ---- P1 遅い回線の秒数 ----
if (built && process.env.SLOW !== '0'){
    for (const loc of ['ja-JP', 'en-US']){
        const a = await fresh(SRC_URL, loc, true); await a.ctx.close();
        const c = await fresh(DST_URL, loc, true); await c.ctx.close();
        const saved = (srcSize - dstSize) / BW * 1000;
        console.log(`   ${loc}: 国を選ぶ画面まで 元の版 ${(a.tSheet / 1000).toFixed(1)} 秒 → 軽くした版 ${(c.tSheet / 1000).toFixed(1)} 秒（本体 ${srcSize} → ${dstSize} バイト。減らした分を読む時間 ${(saved / 1000).toFixed(1)} 秒）`);
        ok(a.tSheet != null && c.tSheet != null && a.tSheet - c.tSheet >= saved * 0.7, `P1 ${loc}: 遅い回線で、軽くした版は国を選ぶ画面が早く出る: ` + JSON.stringify({ src: a.tSheet, slim: c.tSheet, saved: Math.round(saved) }));
    }
}

srv.close(); await b.close();
try{ fs.rmSync(DIST, { recursive: true, force: true }); }catch(e){}
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nperf49: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
