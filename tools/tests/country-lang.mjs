#!/usr/bin/env node
// 国を選び直したら、言葉もその国の言葉に戻る（オーナー指示 11/04: 日本のままだと、ほかの国の人が言語の設定の場所をさがせない）
// 使い方: node tools/tests/country-lang.mjs [http://localhost:8881/]
//  L1 日本・日本語で使っている人が、上の国旗から アメリカ を選ぶ → 確かめて変える → 英語の画面になる
//  L2 そのあと国旗から 日本 を選び直す → 日本語に戻る
//  L3 日本で言葉だけ英語にしていた人が 韓国 を選ぶ → 韓国語になる（国を選ぶと言葉はその国の言葉）
//  L4 同じ国をもう一度選んでも、自分で選んだ言葉は変えない
//  L5 国を選んだあとも、設定の「言語」で言葉だけ変えられる
//  L6 「やめる」を押したら、国も言葉も変わらない
//  L7 はじめて国を選ぶとき（使い始め）は、今までどおり端末の言語（英語の端末で日本を選んでも英語）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const open = async (saved, locale, tag) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale, timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('country-lang', tag)));
    if (saved) await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', st); }, JSON.stringify(saved));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p); await p.waitForTimeout(500);
    return {p, ctx};
};
const state = p => p.evaluate(() => ({cc: S.settings.country, ui: S.settings.uiLang, lang: LANG, html: document.documentElement.lang, flag: (document.getElementById('flag-btn') || {}).textContent, tab: ((document.querySelector('nav.tabs [data-tab=today]') || {}).textContent || '').trim()}));
// 上の国旗を押して、一覧から国を選び、決定。確かめのシートが出たら「変える」（やめるときは cancel）
const pickByFlag = async (p, cc, cancel) => {
    await p.click('#flag-btn'); await p.waitForTimeout(400);
    await p.evaluate(cc => { const t = document.querySelector(`#sheet-root [data-act=cc-tab][data-ccs~="${cc}"]`); if (t) t.click(); }, cc); await p.waitForTimeout(250);
    await p.evaluate(cc => { const e = document.querySelector(`#sheet-root .country-list [data-act=cc-choose][data-cc="${cc}"]`); if (e) e.click(); }, cc); await p.waitForTimeout(250);
    await p.evaluate(cc => { const e = document.querySelector(`#sheet-root .ob-actions [data-act=pick-country][data-cc="${cc}"]`); if (e) e.click(); }, cc); await p.waitForTimeout(400);
    const conf = await p.evaluate(() => !!document.querySelector('#sheet-root [data-act=country-ok]'));
    if (conf){
        if (cancel) await p.evaluate(() => { const e = document.querySelector('#sheet-root [data-act=sheet-close]'); if (e) e.click(); });
        else await p.click('#sheet-root [data-act=country-ok]');
    }
    await p.waitForFunction(cc => !countryBusy, cc, {timeout: 20000}).catch(() => {}); await p.waitForTimeout(800);
    // 同じ国のときは「決定」が出ず「閉じる」だけ。開いたままなら閉じる
    await p.evaluate(() => { if (sheet){ const e = document.querySelector('#sheet-root [data-act=sheet-close]'); if (e) e.click(); } }); await p.waitForTimeout(300);
    return conf;
};
const saved = (cc, ui) => ({onboarded: true, firstUse: '2026-01-05', settings: {country: cc, uiLang: ui}});

// L1・L2
{
    const {p, ctx} = await open(saved('JP', 'ja'), 'en-US', 'L1');
    const s0 = await state(p);
    ok(s0.cc === 'JP' && s0.lang === 'ja', 'L1 はじめは日本・日本語: ' + JSON.stringify(s0));
    const conf = await pickByFlag(p, 'US');
    const s1 = await state(p);
    ok(conf && s1.cc === 'US' && s1.lang === 'en' && s1.html === 'en' && s1.ui === 'auto' && !/献立/.test(s1.tab), 'L1 国旗から アメリカ を選ぶと英語の画面になる: ' + JSON.stringify(s1));
    await pickByFlag(p, 'JP');
    const s2 = await state(p);
    ok(s2.cc === 'JP' && s2.lang === 'ja' && s2.html === 'ja', 'L2 日本を選び直すと日本語に戻る: ' + JSON.stringify(s2));
    // L6 やめると変わらない
    await pickByFlag(p, 'FR', true);
    const s3 = await state(p);
    ok(s3.cc === 'JP' && s3.lang === 'ja', 'L6 「やめる」なら国も言葉も変わらない: ' + JSON.stringify(s3));
    await ctx.close();
}
// L3・L4・L5
{
    const {p, ctx} = await open(saved('JP', 'en'), 'ja-JP', 'L3');
    const s0 = await state(p);
    ok(s0.cc === 'JP' && s0.lang === 'en', 'L3 日本で言葉だけ英語にしている: ' + JSON.stringify(s0));
    await pickByFlag(p, 'JP');
    const s1 = await state(p);
    ok(s1.cc === 'JP' && s1.lang === 'en' && s1.ui === 'en', 'L4 国旗を開いて同じ国のまま閉じても、自分で選んだ言葉は変えない: ' + JSON.stringify(s1));
    await pickByFlag(p, 'KR');
    const s2 = await state(p);
    ok(s2.cc === 'KR' && s2.lang === 'ko' && s2.html === 'ko', 'L3 韓国を選ぶと韓国語になる: ' + JSON.stringify(s2));
    await p.evaluate(async () => { const n = ++uiLangSeq; await switchLang('fr', n); render(); }); await p.waitForTimeout(600);
    const s3 = await state(p);
    ok(s3.cc === 'KR' && s3.lang === 'fr' && s3.ui === 'fr', 'L5 国を選んだあとも、言語の設定で言葉だけ変えられる: ' + JSON.stringify(s3));
    await ctx.close();
}
// L7 はじめて国を選ぶとき（使い始め）は端末の言語
{
    const {p, ctx} = await open(null, 'en-US', 'L7');
    await p.evaluate(() => { for (const s of ['[data-act=cc-tab][data-ccs~="JP"]', '.country-list [data-act=cc-choose][data-cc="JP"]', '.ob-actions [data-act=pick-country][data-cc="JP"]']){ const e = document.querySelector('#sheet-root ' + s); if (e) e.click(); } });
    await p.waitForFunction(() => S.settings.country === 'JP' && !countryBusy, null, {timeout: 20000}).catch(() => {}); await p.waitForTimeout(500);
    const s = await state(p);
    ok(s.cc === 'JP' && s.lang === 'en', 'L7 使い始めに英語の端末で日本を選ぶと英語のまま（今までどおり）: ' + JSON.stringify(s));
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
