#!/usr/bin/env node
// はじめての設定の国と言語（Playwright。使い方: node tools/tests/first-country.mjs [http://localhost:8887/]）
//  C1 端末の言語とタイムゾーンから、21か国のどれかを推す（guessCountry の表。通信・位置情報は使わない）
//  C2 21か国それぞれの locale・タイムゾーンで開くと、はじめての設定でその国が選ばれて見え、画面の言語が端末の言語になる。
//     下のボタンでその国ではじめると、国と言語がそのまま決まる（ja-JP は日本・日本語のまま）
//  C3 どの国にも当てはまらない端末（nl-NL / Europe/Amsterdam など）では、日本に決めつけず、国を選ぶ一覧を先に出す
//  C4 保存済みの設定がある人の国は、端末の言語・タイムゾーンが違っても変えない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const ctxOf = async (locale, timezoneId, tag) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale, timezoneId, serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('first-country', tag)));
    return ctx;
};
const openFirst = async (locale, tz) => {
    const ctx = await ctxOf(locale, tz, locale + tz);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(locale + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForSelector('#sheet-root [data-act=pick-country]', { timeout: 30000 });
    await p.waitForTimeout(150);
    return { p, ctx };
};
const screen = p => p.evaluate(() => {
    const on = [...document.querySelectorAll('#sheet-root .country-list .country.on')].map(e => e.dataset.cc);
    const btn = document.querySelector('#sheet-root .ob-actions [data-act=pick-country]');
    const r = btn && btn.getBoundingClientRect(), first = document.querySelector('#sheet-root .country-list .country');
    const fr = first && first.getBoundingClientRect();
    return { on, lang: LANG, sel: (document.querySelector('#sheet-root select[data-ob=lang]') || {}).value, btn: btn ? btn.dataset.cc : '', btnText: btn ? btn.textContent : '',
        btnVis: !!r && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight, first: first ? first.dataset.cc : '', firstVis: !!fr && fr.top >= 0 && fr.bottom <= innerHeight,
        hint: !!document.querySelector('#sheet-root .ob-pick-hint'), flag: document.querySelector('#flag-btn').textContent, country: S.settings.country || '' };
});

// ---- C1 推し方の表 ----
{
    const { p, ctx } = await openFirst('ja-JP', 'Asia/Tokyo');
    const table = [
        [['en-US'], 'America/New_York', 'US'], [['en-GB'], 'Europe/London', 'GB'], [['pt-BR'], 'America/Sao_Paulo', 'BR'], [['pt'], 'Europe/Lisbon', 'BR'],
        [['es'], 'America/Mexico_City', 'MX'], [['es'], 'America/Lima', 'PE'], [['es'], 'Europe/Madrid', 'ES'], [['es'], 'America/Bogota', 'ES'], [['es-419'], 'America/Lima', 'PE'],
        [['es-MX'], 'Europe/Madrid', 'MX'], [['es-AR'], 'America/Argentina/Buenos_Aires', 'ES'],
        [['zh-TW'], 'Asia/Taipei', 'TW'], [['zh-Hant'], 'Asia/Shanghai', 'TW'], [['zh-Hant-HK'], 'Asia/Hong_Kong', 'TW'], [['zh-HK'], 'Asia/Hong_Kong', 'TW'], [['zh-CN'], 'Asia/Shanghai', 'CN'], [['zh'], 'Asia/Taipei', 'TW'], [['zh'], 'Asia/Singapore', 'CN'],
        [['ar'], 'Africa/Cairo', 'EG'], [['ar-SA'], 'Asia/Riyadh', 'EG'], [['hi'], 'Asia/Kolkata', 'IN'], [['en-IN'], 'Asia/Kolkata', 'IN'], [['en'], 'Asia/Kolkata', 'IN'], [['en'], 'Europe/London', 'GB'], [['en'], 'America/Chicago', 'US'], [['en-AU'], 'Australia/Sydney', 'US'],
        [['tl'], 'Asia/Manila', 'PH'], [['fil'], 'Asia/Manila', 'PH'], [['ko'], 'Asia/Seoul', 'KR'], [['de-AT'], 'Europe/Vienna', 'DE'], [['fr-CA'], 'America/Toronto', 'FR'],
        [['ja'], 'America/New_York', 'JP'], [['ja-JP'], 'Asia/Tokyo', 'JP'],
        [['nl-NL'], 'Europe/Amsterdam', ''], [['sv-SE'], 'Europe/Stockholm', ''], [['nl-NL'], 'Europe/Berlin', 'DE'], [['nl-NL', 'en-US'], 'Europe/Amsterdam', 'US'], [[], 'America/Lima', 'PE'], [[], 'UTC', ''],
    ];
    const got = await p.evaluate(tb => tb.map(([l, tz]) => guessCountry(l, tz)), table);
    table.forEach(([l, tz, want], i) => ok(got[i] === want, `C1 ${l.join(',') || '(なし)'} / ${tz} → ${want || '（選んでもらう）'}: ${got[i]}`));
    await ctx.close();
}

// ---- C2 21か国の端末で、はじめての設定 ----
const CASES = [
    ['JP', 'ja-JP', 'Asia/Tokyo', 'ja'], ['US', 'en-US', 'America/New_York', 'en'], ['GB', 'en-GB', 'Europe/London', 'en'], ['KR', 'ko-KR', 'Asia/Seoul', 'ko'],
    ['CN', 'zh-CN', 'Asia/Shanghai', 'zh-Hans'], ['TW', 'zh-TW', 'Asia/Taipei', 'zh-Hant'], ['TH', 'th-TH', 'Asia/Bangkok', 'th'], ['VN', 'vi-VN', 'Asia/Ho_Chi_Minh', 'vi'],
    ['PH', 'fil-PH', 'Asia/Manila', 'fil'], ['ID', 'id-ID', 'Asia/Jakarta', 'id'], ['IN', 'hi-IN', 'Asia/Kolkata', 'hi'], ['TR', 'tr-TR', 'Europe/Istanbul', 'tr'],
    ['EG', 'ar-EG', 'Africa/Cairo', 'ar'], ['FR', 'fr-FR', 'Europe/Paris', 'fr'], ['DE', 'de-DE', 'Europe/Berlin', 'de'], ['IT', 'it-IT', 'Europe/Rome', 'it'],
    ['ES', 'es-ES', 'Europe/Madrid', 'es'], ['PL', 'pl-PL', 'Europe/Warsaw', 'pl'], ['MX', 'es-MX', 'America/Mexico_City', 'es'], ['BR', 'pt-BR', 'America/Sao_Paulo', 'pt-BR'],
    ['PE', 'es-PE', 'America/Lima', 'es'],
    // 地域のない言語・ほかの国の言語の端末
    ['MX', 'es', 'America/Mexico_City', 'es'], ['PE', 'es', 'America/Lima', 'es'], ['ES', 'es', 'America/Bogota', 'es'], ['TW', 'zh-Hant', 'Asia/Taipei', 'zh-Hant'],
    ['EG', 'ar', 'Asia/Dubai', 'ar'], ['IN', 'en-IN', 'Asia/Kolkata', 'en'], ['IN', 'hi', 'Asia/Kolkata', 'hi'],
];
const ONLY = (process.env.CCS || '').split(',').filter(Boolean);
for (const [cc, locale, tz, lang] of CASES){
    if (ONLY.length && !ONLY.includes(cc)) continue;
    const tag = `C2 ${locale} / ${tz}`;
    const { p, ctx } = await openFirst(locale, tz);
    const s = await screen(p);
    ok(s.on.length === 1 && s.on[0] === cc && s.first === cc && s.firstVis, `${tag}: はじめての設定で ${cc} が選ばれて、一覧のいちばん上に見える: ` + JSON.stringify(s));
    ok(s.btn === cc && s.btnVis, `${tag}: 「${cc}ではじめる」が画面に見えていて、押せる: ` + JSON.stringify(s));
    ok(s.lang === lang && s.sel === lang, `${tag}: 画面の言語は端末の言語（${lang}）: ` + JSON.stringify(s));
    ok(s.country === '' && s.flag !== '🇯🇵' || cc === 'JP' && s.country === '', `${tag}: 選ぶ前は国を保存せず、上の旗も日本にしない: ` + JSON.stringify(s));
    await p.click('#sheet-root .ob-actions [data-act=pick-country]');
    await p.waitForFunction(() => !!S.settings.country, null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(200);
    const a = await p.evaluate(() => ({ country: S.settings.country, ui: S.settings.uiLang, lang: LANG, flag: document.querySelector('#flag-btn').textContent }));
    ok(a.country === cc && a.lang === lang && a.ui === lang, `${tag}: はじめるを押すと ${cc}・${lang} に決まる: ` + JSON.stringify(a));
    await ctx.close();
}

// ---- C3 どの国にも当てはまらない端末 ----
if (!ONLY.length){
    for (const [locale, tz] of [['nl-NL', 'Europe/Amsterdam'], ['sv-SE', 'Europe/Stockholm']]){
        const tag = `C3 ${locale} / ${tz}`;
        const { p, ctx } = await openFirst(locale, tz);
        const s = await screen(p);
        ok(!s.on.length && !s.btn && s.hint && s.flag !== '🇯🇵', `${tag}: 日本に決めつけず、国を選ぶ一覧を先に出す: ` + JSON.stringify(s));
        ok(s.lang === 'en', `${tag}: 端末の言語の辞書がなければ英語: ` + s.lang);
        await p.click('#sheet-root .country-list [data-act=pick-country][data-cc="DE"]');
        await p.waitForFunction(() => !!S.settings.country, null, { timeout: 30000 }).catch(() => {});
        const a = await p.evaluate(() => ({ country: S.settings.country, lang: LANG }));
        ok(a.country === 'DE', `${tag}: 一覧で選んだ国になる: ` + JSON.stringify(a));
        await ctx.close();
    }
    // 選び方を変えても（言語を先に選んでも）、国は推したまま
    const { p, ctx } = await openFirst('pt-BR', 'America/Sao_Paulo');
    await p.selectOption('#sheet-root select[data-ob=lang]', 'en');
    await p.waitForFunction(() => LANG === 'en', null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(200);
    const s = await screen(p);
    ok(s.lang === 'en' && s.on[0] === 'BR' && s.btn === 'BR', 'C3 言語を変えても、推した国（BR）は選ばれたまま: ' + JSON.stringify(s));
    await p.click('#sheet-root .ob-actions [data-act=pick-country]');
    await p.waitForFunction(() => !!S.settings.country, null, { timeout: 30000 }).catch(() => {});
    const a = await p.evaluate(() => ({ country: S.settings.country, lang: LANG }));
    ok(a.country === 'BR' && a.lang === 'en', 'C3 選んだ言語のまま、ブラジルではじめる: ' + JSON.stringify(a));
    await ctx.close();
}

// ---- C4 保存済みの設定がある人 ----
if (!ONLY.length){
    for (const [saved, locale, tz] of [[{ onboarded: true, settings: { country: 'JP', uiLang: 'ja' } }, 'en-US', 'America/New_York'],
        [{ onboarded: true, settings: { uiLang: 'auto' } }, 'es-MX', 'America/Mexico_City'],
        [{ onboarded: true, settings: { country: 'FR', uiLang: 'auto' } }, 'ko-KR', 'Asia/Seoul'],
        [{ onboarded: false, settings: { country: 'KR', uiLang: 'ko' } }, 'pt-BR', 'America/Sao_Paulo']]){
        const want = saved.settings.country || 'JP';
        const tag = `C4 保存済み ${saved.settings.country || '(国なし・以前から)'} を ${locale} で開く`;
        const ctx = await ctxOf(locale, tz, tag);
        await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({ firstUse: '2026-01-01' }, st))); }, saved);
        const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
        await p.goto(URL_);
        await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && GH.booted, null, { timeout: 30000 }).catch(() => {});
        await p.waitForTimeout(400);
        const a = await p.evaluate(() => ({ country: S.settings.country, stored: (JSON.parse(localStorage.getItem('gohancho.v1') || '{}').settings || {}).country, sheet: sheet && sheet.kind }));
        ok(a.country === want && a.stored === want && a.sheet !== 'country', `${tag}: 国は ${want} のまま変えない: ` + JSON.stringify(a));
        await ctx.close();
    }
}

ok(!errs.length, 'ページのエラーがない: ' + errs.join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
