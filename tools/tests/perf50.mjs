#!/usr/bin/env node
// 第50回（速さ）R184 の続き: 日本語で使う人には、英語の訳（i18n/en.js 約200KB）を最初に読まない
//  使い方: node tools/tests/perf50.mjs [http://localhost:9291/]
//  E1 日本語の端末ではじめて開く（sw.js あり）: 国を選ぶ画面・はじめての流れ・献立が出るまで、英語の訳を読まない（sw.js の事前取りこみにも入っていない）
//  E2 そのあと落ち着いてから（はじめての流れが済んで約15秒）、裏で1回だけ英語の訳（画面の言葉・いまの国の料理の訳）を取って sw.js に保存する。画面は日本語のまま・献立は変わらない
//  E3 電波がなくても、英語に切りかえられる（画面の言葉が英語になる。エラーなし）
//  E4 英語の端末ではじめて開くと、英語の訳を読み、国を選ぶ画面が英語で出る
//  E5 日本語で使っている人が2回目に開いたとき（国を選んだあと）も、最初の 10 秒は英語の訳を読まない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const SHEET = () => typeof sheet !== 'undefined' && sheet && sheet.kind === 'country' && !!document.querySelector('#sheet-root [data-act="cc-choose"]');
const isEn = u => /\/i18n\/en\.js(\?|$)/.test(u);
const cachedEn = p => p.evaluate(async () => { for (const k of await caches.keys()){ const c = await caches.open(k); for (const r of await c.keys()) if (/\/i18n\/en\.js/.test(r.url)) return r.url.replace(location.origin, ''); } return null; });
const open = async (locale, st) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale, serviceWorkers: 'allow' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    if (st) await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(st)); }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(locale + ': ' + e.message));
    const reqs = []; const t0 = Date.now(); ctx.on('request', r => reqs.push({ t: Date.now() - t0, u: r.url(), sw: !!r.serviceWorker() }));
    return { ctx, p, reqs, t0 };
};
// E1〜E3
{
    const { ctx, p, reqs, t0 } = await open('ja-JP', null);
    await p.goto(URL_); let sheetOk = true;
    try{ await p.waitForFunction(SHEET, null, { timeout: 60000 }); }catch(e){ sheetOk = false; }
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 }).catch(() => {});
    let flow = false;
    try{
        await pickCountry(p, 'JP');
        await p.waitForFunction(() => sheet && sheet.kind === 'onboard' && document.querySelector('#sheet-root [data-act=ob-done]'), null, { timeout: 30000 });
        await p.click('#sheet-root [data-act=ob-done]');
        await p.waitForFunction(() => S.onboarded === true && !sheet && session.menu && document.querySelector('#view .tray .spot .nm'), null, { timeout: 30000 });
        flow = true;
    }catch(e){ errs.push('E1: ' + e.message.slice(0, 100)); }
    const tDone = Date.now() - t0;
    await p.waitForTimeout(3000);
    const early = reqs.filter(r => isEn(r.u)), c0 = await cachedEn(p);
    ok(sheetOk && flow && !early.length && !c0, 'E1 日本語の端末: はじめての流れ・献立が出るまで（とその 3 秒あと）、英語の訳を読まない・保存しない: ' + JSON.stringify({ sheetOk, flow, early: early.slice(0, 3), c0 }));
    const menu0 = await p.evaluate(() => menuIds().join());
    let got = null; for (let i = 0; i < 40 && !got; i++){ await p.waitForTimeout(1000); got = await cachedEn(p); }
    const late = reqs.filter(r => isEn(r.u) && !r.sw), state = await p.evaluate(() => ({ lang: LANG, en: !!I18N.en, menu: menuIds().join() }));
    ok(got && late.length === 1 && late[0].t > tDone && state.lang === 'ja' && state.menu === menu0, 'E2 落ち着いてから、英語の訳を裏で1回だけ取って保存する。画面は日本語のまま・献立は変わらない: ' + JSON.stringify({ got, n: late.length, t: late.map(r => r.t), tDone, state }));
    await ctx.setOffline(true);
    const off = await p.evaluate(async () => { await switchLang('en', ++uiLangSeq); return { lang: LANG, tab: (document.querySelector('nav.tabs') || {}).textContent || '', ja: ((document.querySelector('#view') || {}).innerText || '').match(/[ぁ-ん]{3,}/g) || [] }; });
    ok(off.lang === 'en' && /Today/.test(off.tab) && !off.ja.length, 'E3 電波がなくても英語に切りかえられる: ' + JSON.stringify({ lang: off.lang, tab: off.tab.slice(0, 40), ja: off.ja.slice(0, 3) }));
    await ctx.close();
}
// E4 英語の端末
{
    const { ctx, p, reqs } = await open('en-US', null);
    await p.goto(URL_); let sheetOk = true;
    try{ await p.waitForFunction(SHEET, null, { timeout: 60000 }); }catch(e){ sheetOk = false; }
    const h = await p.evaluate(() => (document.querySelector('#sheet-root h2') || {}).textContent || '');
    ok(sheetOk && reqs.some(r => isEn(r.u)) && /[A-Za-z]/.test(h) && !/[ぁ-ん]/.test(h), 'E4 英語の端末: 英語の訳を読み、国を選ぶ画面が英語で出る: ' + JSON.stringify({ sheetOk, h }));
    await ctx.close();
}
// E5 日本語で使っている人の2回目
{
    const { ctx, p, reqs } = await open('ja-JP', { onboarded: true, firstUse: '2026-11-01', settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2 } });
    await p.goto(URL_); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && !!document.querySelector('#view .tray'), null, { timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(10000);
    const early = reqs.filter(r => isEn(r.u));
    ok(!early.length, 'E5 日本語で使っている人の2回目: 最初の 10 秒は英語の訳を読まない: ' + JSON.stringify(early.slice(0, 3)));
    await ctx.close();
}
await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nperf50: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
