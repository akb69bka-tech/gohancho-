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
//  L8 （第21回 R68）確かめのシートに、小さな「言葉は今の{言語}のままにする」が出る（いまの言葉と国の言葉がちがうときだけ。言語名はその言語の字で）。
//     押さなければ今までどおりその国の言葉、押せばいまの言葉のまま（日本に住むベトナム語の人がアメリカを見る → ベトナム語のまま）
//  L9 国の言葉といまの言葉が同じときは出ない（英語でアメリカ → イギリス）
//  L10（第21回 R69・R70）設定の「表示と言語」の見出しに、どの言葉でも "Language" と 🌐 が入る（英語では Language を重ねない）。説明は「国を選び直すと…変わります」
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
const pickByFlag = async (p, cc, cancel, keep) => {
    await p.click('#flag-btn'); await p.waitForTimeout(400);
    await p.evaluate(cc => { const t = document.querySelector(`#sheet-root [data-act=cc-tab][data-ccs~="${cc}"]`); if (t) t.click(); }, cc); await p.waitForTimeout(250);
    await p.evaluate(cc => { const e = document.querySelector(`#sheet-root .country-list [data-act=cc-choose][data-cc="${cc}"]`); if (e) e.click(); }, cc); await p.waitForTimeout(250);
    await p.evaluate(cc => { const e = document.querySelector(`#sheet-root .ob-actions [data-act=pick-country][data-cc="${cc}"]`); if (e) e.click(); }, cc); await p.waitForTimeout(400);
    const conf = await p.evaluate(() => !!document.querySelector('#sheet-root [data-act=country-ok]'));
    if (conf){
        pickByFlag.sheet = await p.evaluate(() => { const k = document.querySelector('#sheet-root [data-act=cc-keep-lang]'), lab = k && k.closest('label');
            return {keep: !!k, keepText: lab ? lab.textContent.trim() : '', keepIsBtn: !!(k && k.closest('.btn')), text: (document.querySelector('#sheet-root') || {}).textContent || ''}; });
        if (keep) await p.click('#sheet-root [data-act=cc-keep-lang]');
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
// L8 ベトナム語で日本に住む人
{
    const {p, ctx} = await open(saved('JP', 'vi'), 'vi-VN', 'L8');
    const s0 = await state(p);
    ok(s0.cc === 'JP' && s0.lang === 'vi', 'L8 はじめは日本・ベトナム語: ' + JSON.stringify(s0));
    await pickByFlag(p, 'US', false, true);
    const sh = pickByFlag.sheet, s1 = await state(p);
    ok(sh.keep && /Tiếng Việt/.test(sh.keepText) && !sh.keepIsBtn, 'L8 確かめのシートに小さな「Tiếng Việt のままにする」（ボタンではない）: ' + JSON.stringify(sh).slice(0, 300));
    ok(s1.cc === 'US' && s1.lang === 'vi' && s1.ui === 'vi', 'L8 押すとアメリカでもベトナム語のまま: ' + JSON.stringify(s1));
    await pickByFlag(p, 'JP');
    const s2 = await state(p);
    ok(pickByFlag.sheet.keep && s2.cc === 'JP' && s2.lang === 'ja' && s2.ui === 'auto', 'L8 押さなければ今までどおり国の言葉（日本語）に変わる: ' + JSON.stringify(s2));
    // 日本語で使っている人がエジプトを見る: 「日本語のまま」を押す → 日本語のまま
    await pickByFlag(p, 'EG', false, true);
    const s3 = await state(p);
    ok(/日本語/.test(pickByFlag.sheet.keepText) && s3.cc === 'EG' && s3.lang === 'ja' && s3.html === 'ja', 'L8 日本語の人がエジプトを選んでも、押せば日本語のまま: ' + JSON.stringify(s3) + ' ' + pickByFlag.sheet.keepText);
    await ctx.close();
}
// L9 英語でアメリカ → イギリス（言葉は同じ）
{
    const {p, ctx} = await open(saved('US', 'auto'), 'en-US', 'L9');
    await pickByFlag(p, 'GB');
    const s1 = await state(p);
    ok(!pickByFlag.sheet.keep && s1.cc === 'GB' && s1.lang === 'en', 'L9 言葉が同じ国では「今のまま」を出さない: ' + JSON.stringify(s1) + ' ' + JSON.stringify(pickByFlag.sheet.keep));
    await ctx.close();
}
// L10 設定の「表示と言語」の見出しと説明（日本語・ベトナム語・英語・アラビア語）
{
    const {p, ctx} = await open(saved('JP', 'ja'), 'ja-JP', 'L10');
    for (const l of ['ja', 'vi', 'en', 'ar']){
        const r = await p.evaluate(async l => {
            const n = ++uiLangSeq; await switchLang(l, n);
            setTab('settings'); render(); await new Promise(r => setTimeout(r, 300));
            const sum = document.querySelector('#set-display .set-sec-h'), toc = document.querySelector('.set-toc [data-k=display]');
            const det = document.querySelector('#set-display'); if (det) det.open = true;
            const lab = det && det.querySelector('.field > label');
            return {lang: LANG, sum: sum ? sum.textContent.trim() : '', toc: toc ? toc.textContent.trim() : '', lab: lab ? lab.textContent.trim() : '', body: det ? det.textContent : ''};
        }, l);
        const cnt = (r.sum.match(/language/gi) || []).length;
        ok(r.lang === l && /Language/i.test(r.sum) && r.sum.includes('🌐') && cnt === 1 && /Language/i.test(r.toc) && r.toc.includes('🌐') && /Language/i.test(r.lab) && r.lab.includes('🌐'), `L10 ${l} 見出し・目次・言語の欄に Language と 🌐（1回だけ）: ` + JSON.stringify(r).slice(0, 300));
        if (l === 'ja') ok(/国を選び直すと、表示する言語もその国の言葉に変わります/.test(r.body) && !/国を変えても、表示する言語はそのまま/.test(r.body), 'L10 説明は「国を選び直すと…変わります」（第21回 R69）: ' + r.body.slice(0, 200));
    }
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
