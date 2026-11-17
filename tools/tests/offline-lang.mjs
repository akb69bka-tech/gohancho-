#!/usr/bin/env node
// 第51回（offen）: 英語など日本語以外で使う人が、はじめて開いたあと電波のない所で開き直すと、画面が日本語になっていた（v149）。
//   はじめて開いたときは sw.js が働く前に画面の言葉（i18n/）・国のレシピ（packs/）・料理の訳（packs/i18n/）を読むので、保存されていなかった
//  使い方: node tools/tests/offline-lang.mjs [http://localhost:9291/]
//  L1 英語の端末・アメリカ: はじめての流れのあと落ち着いたら、使っている辞書・国のレシピが保存され、電波なしで開き直しても英語の画面・アメリカの献立で出る
//  L2 韓国語の端末・韓国: 同じく韓国語の画面・韓国の献立で出る
//  L3 日本語の端末・トルコ: トルコのレシピと日本語の訳が保存され、電波なしで開き直しても日本語の料理名のトルコの献立で出る
//  L4 日本語の端末・日本: 最初の 10 秒は英語の訳もほかの国のレシピも読まない（perf50 の軽さのまま）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const SHEET = () => typeof sheet !== 'undefined' && sheet && sheet.kind === 'country' && !!document.querySelector('#sheet-root [data-act="cc-choose"]');
const cached = p => p.evaluate(async () => { const out = []; for (const k of await caches.keys()){ const c = await caches.open(k); for (const r of await c.keys()){ const u = new URL(r.url); if (/\/(i18n|packs)\//.test(u.pathname)) out.push(u.pathname.replace(/^.*?\/((?:i18n|packs)\/)/, '$1')); } } return out.sort(); });
// はじめて開く → 国を選ぶ → はじめての案内を閉じる → 献立
const first = async (locale, cc) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale, serviceWorkers: 'allow' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(locale + ': ' + e.message));
    const reqs = []; const t0 = Date.now(); ctx.on('request', r => reqs.push({ t: Date.now() - t0, u: r.url(), sw: !!r.serviceWorker() }));
    await p.goto(URL_);
    await p.waitForFunction(SHEET, null, { timeout: 60000 });
    await pickCountry(p, cc);
    await p.waitForFunction(() => sheet && sheet.kind === 'onboard' && document.querySelector('#sheet-root [data-act=ob-done]'), null, { timeout: 30000 });
    await p.click('#sheet-root [data-act=ob-done]');
    await p.waitForFunction(() => S.onboarded === true && !sheet && session.menu && document.querySelector('#view .tray .spot .nm'), null, { timeout: 30000 });
    return { ctx, p, reqs, t0 };
};
// 保存されるのを待って（最大 60 秒）、電波を切って開き直す
const offline = async (p, ctx, want) => {
    let have = []; for (let i = 0; i < 60; i++){ have = await cached(p); if (want.every(w => have.includes(w))) break; await p.waitForTimeout(1000); }
    await ctx.setOffline(true);
    await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray .spot .nm'), null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(1500);
    const st = await p.evaluate(() => ({ lang: LANG, cc: currentCountry(), tab: ((document.querySelector('nav.tabs') || {}).innerText || '').replace(/\s+/g, ' '),
        menu: session.menu ? session.menu.items.map(x => x.r && x.r.id).filter(Boolean) : [], names: [...document.querySelectorAll('#view .tray .spot .nm')].map(e => e.textContent.trim()),
        kana: (((document.querySelector('#view') || {}).innerText || '').match(/[ぁ-ゖ]{3,}/g) || []).slice(0, 3) }));
    return { have, st };
};
// L1 英語・アメリカ
{
    const { ctx, p } = await first('en-US', 'US');
    const want = ['i18n/en.js', 'packs/us.js'];
    const { have, st } = await offline(p, ctx, want);
    ok(want.every(w => have.includes(w)), 'L1 英語の端末・アメリカ: 使っている辞書と国のレシピが保存される: ' + JSON.stringify(have));
    ok(st.lang === 'en' && /Today/.test(st.tab) && st.cc === 'US' && st.menu.length && st.menu.every(id => /^us_/.test(id) || !/^[a-z]{2}_/.test(id)) && !st.kana.length,
        'L1 英語の端末・アメリカ: 電波なしで開き直しても、英語の画面・アメリカの献立: ' + JSON.stringify(st));
    await ctx.close();
}
// L2 韓国語・韓国
{
    const { ctx, p } = await first('ko-KR', 'KR');
    const want = ['i18n/ko.js', 'i18n/en.js', 'packs/kr.js'];
    const { have, st } = await offline(p, ctx, want);
    ok(want.every(w => have.includes(w)), 'L2 韓国語の端末・韓国: 使っている辞書と国のレシピが保存される: ' + JSON.stringify(have));
    ok(st.lang === 'ko' && /[가-힣]/.test(st.tab) && st.cc === 'KR' && st.menu.length && st.menu.some(id => /^kr_/.test(id)) && !st.kana.length,
        'L2 韓国語の端末・韓国: 電波なしで開き直しても、韓国語の画面・韓国の献立: ' + JSON.stringify(st));
    await ctx.close();
}
// L3 日本語・トルコ
{
    const { ctx, p } = await first('ja-JP', 'TR');
    const want0 = await p.evaluate(() => Object.keys(PACK_TR).filter(k => PACK_TR[k] && k.startsWith('TR.')).map(k => `packs/i18n/tr.${k.slice(3)}.js`));
    const want = ['packs/tr.js', ...want0];
    const { have, st } = await offline(p, ctx, want);
    ok(want0.length && want.every(w => have.includes(w)), 'L3 日本語の端末・トルコ: トルコのレシピと料理の訳が保存される: ' + JSON.stringify({ want, have }));
    ok(st.lang === 'ja' && st.cc === 'TR' && st.menu.some(id => /^tr_/.test(id)) && st.names.length && st.names.every(n => /[ぁ-ゖァ-ヺ一-龯]/.test(n)),
        'L3 日本語の端末・トルコ: 電波なしで開き直しても、日本語の料理名のトルコの献立: ' + JSON.stringify(st));
    await ctx.close();
}
// L4 日本語・日本: 最初の 10 秒は英語の訳もほかの国のレシピも読まない
{
    const { ctx, p, reqs } = await first('ja-JP', 'JP');
    await p.waitForTimeout(10000);
    const early = reqs.filter(r => /\/(i18n|packs)\/.+\.js/.test(r.u)).map(r => r.u.replace(/^.*?\/((?:i18n|packs)\/)/, '$1'));
    ok(!early.length, 'L4 日本語の端末・日本: はじめての流れから 10 秒は、画面の言葉・国のレシピ・料理の訳を読まない: ' + JSON.stringify(early.slice(0, 5)));
    await ctx.close();
}
await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\noffline-lang: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
