#!/usr/bin/env node
// はじめての設定の国と言語（Playwright。使い方: node tools/tests/first-country.mjs [http://localhost:8887/]）
//  C1 端末の言語とタイムゾーンから、21か国のどれかを推す（guessCountry の表。通信・位置情報は使わない）
//  C2 21か国それぞれの locale・タイムゾーンで開くと、国は選ばれていない（推した国は一覧のいちばん上に「候補」と出るだけ）。
//     自分で一覧から選ぶまで進めない（はじめるボタンはない・閉じられない）。選ぶとその国になり、画面の言語は端末の言語（ja-JP は日本・日本語）
//  C3 どの国にも当てはまらない端末（nl-NL / Europe/Amsterdam など）では、候補も出さずに一覧から選んでもらう
//  C4 一度選んだ国は、再読み込み・言語の切りかえ・国のデータが読めなかったとき・書き出し・読みこみのあとも変わらない
//  C5 古い版のデータ（国がない）・壊れた国の値では、日本にせず、国を選ぶ画面を出す（無料期間の始まりも変えない）
//  C6 保存済みの設定がある人の国は、端末の言語・タイムゾーンが違っても変えない
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
    const on = [...document.querySelectorAll('#sheet-root .country-list .country.on, #sheet-root .country-list [aria-current]')].map(e => e.dataset.cc);
    const btn = document.querySelector('#sheet-root .ob-actions [data-act=pick-country]');
    const first = document.querySelector('#sheet-root .country-list .country'), fr = first && first.getBoundingClientRect();
    const cand = [...document.querySelectorAll('#sheet-root .country-list .country .cand')].map(e => e.closest('.country').dataset.cc);
    const hint = document.querySelector('#sheet-root .ob-pick-hint'), hr = hint && hint.getBoundingClientRect();
    return { on, cand, lang: LANG, sel: (document.querySelector('#sheet-root select[data-ob=lang]') || {}).value, btn: btn ? btn.dataset.cc : '',
        first: first ? first.dataset.cc : '', firstVis: !!fr && fr.top >= 0 && fr.bottom <= innerHeight,
        hint: !!hr && hr.height > 0 && hr.bottom <= innerHeight + 1, flag: document.querySelector('#flag-btn').textContent, country: S.settings.country || '',
        sheet: sheet && sheet.kind, stored: (JSON.parse(localStorage.getItem('gohancho.v1') || '{}').settings || {}).country || '' };
});
// はじめての設定の残り（人数・苦手など）を進めて終える
const finishOnboard = async p => {
    await p.waitForSelector('#sheet-root [data-act=ob-next], #sheet-root [data-act=ob-done]', { timeout: 30000 });
    for (let i = 0; i < 8; i++){
        if (await p.locator('#sheet-root [data-act=ob-done]').count()){ await p.click('#sheet-root [data-act=ob-done]'); break; }
        await p.click('#sheet-root [data-act=ob-next]'); await p.waitForTimeout(150);
    }
    await p.waitForFunction(() => S.onboarded === true, null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(400);
};
const booted = p => p.waitForFunction(() => typeof S !== 'undefined' && typeof GH !== 'undefined' && GH.booted, null, { timeout: 30000 }).catch(() => {});
const stateOf = p => p.evaluate(() => ({ country: S.settings.country || '', stored: (JSON.parse(localStorage.getItem('gohancho.v1') || '{}').settings || {}).country || '',
    lang: LANG, sheet: sheet && sheet.kind, onboarded: !!S.onboarded, firstUse: S.firstUse }));
const openSaved = async (saved, locale, tz, tag, init) => {
    const ctx = await ctxOf(locale, tz, tag);
    await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', typeof st === 'string' ? st : JSON.stringify(st)); }, saved);
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await booted(p); await p.waitForTimeout(500);
    return { p, ctx };
};

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
    ['MX', 'es', 'America/Mexico_City', 'es'], ['PE', 'es', 'America/Lima', 'es'], ['TW', 'zh-Hant', 'Asia/Taipei', 'zh-Hant'], ['IN', 'en-IN', 'Asia/Kolkata', 'en'],
];
const ONLY = (process.env.CCS || '').split(',').filter(Boolean);
for (const [cc, locale, tz, lang] of CASES){
    if (ONLY.length && !ONLY.includes(cc)) continue;
    const tag = `C2 ${locale} / ${tz}`;
    const { p, ctx } = await openFirst(locale, tz);
    const s = await screen(p);
    ok(!s.on.length && !s.btn && s.country === '' && s.stored === '', `${tag}: 国は選ばれていない（はじめるボタンもない）: ` + JSON.stringify(s));
    ok(s.cand.length === 1 && s.cand[0] === cc && s.first === cc && s.firstVis, `${tag}: 推した ${cc} は、一覧のいちばん上に候補として見える: ` + JSON.stringify(s));
    ok(s.hint, `${tag}: 一覧から選ぶ案内が見える: ` + JSON.stringify(s));
    ok(s.lang === lang && s.sel === lang, `${tag}: 画面の言語は端末の言語（${lang}）: ` + JSON.stringify(s));
    ok(s.flag !== '🇯🇵', `${tag}: 選ぶ前は上の旗を日本にしない: ` + s.flag);
    // 選ぶまで進めない: Esc・背景を押しても閉じず、国も決まらない
    await p.keyboard.press('Escape'); await p.mouse.click(5, 5); await p.waitForTimeout(200);
    const s2 = await screen(p);
    ok(s2.sheet === 'country' && s2.country === '' && s2.stored === '', `${tag}: Esc・背景を押しても閉じず、国は決まらない: ` + JSON.stringify(s2));
    await p.click(`#sheet-root .country-list [data-act=pick-country][data-cc="${cc}"]`);
    await p.waitForFunction(() => !!S.settings.country, null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(200);
    const a = await p.evaluate(() => ({ country: S.settings.country, ui: S.settings.uiLang, lang: LANG }));
    ok(a.country === cc && a.lang === lang && a.ui === lang, `${tag}: 一覧で選ぶと ${cc}・${lang} に決まる: ` + JSON.stringify(a));
    await ctx.close();
}

// ---- C3 どの国にも当てはまらない端末・候補でない国を選ぶ ----
if (!ONLY.length){
    for (const [locale, tz] of [['nl-NL', 'Europe/Amsterdam'], ['sv-SE', 'Europe/Stockholm']]){
        const tag = `C3 ${locale} / ${tz}`;
        const { p, ctx } = await openFirst(locale, tz);
        const s = await screen(p);
        ok(!s.on.length && !s.cand.length && !s.btn && s.hint && s.flag !== '🇯🇵', `${tag}: 候補も出さず、一覧から選んでもらう: ` + JSON.stringify(s));
        ok(s.lang === 'en', `${tag}: 端末の言語の辞書がなければ英語: ` + s.lang);
        await p.click('#sheet-root .country-list [data-act=pick-country][data-cc="DE"]');
        await p.waitForFunction(() => !!S.settings.country, null, { timeout: 30000 }).catch(() => {});
        const a = await p.evaluate(() => ({ country: S.settings.country, lang: LANG }));
        ok(a.country === 'DE', `${tag}: 一覧で選んだ国になる: ` + JSON.stringify(a));
        await ctx.close();
    }
    // 言語を先に変えても、国は選ばれないまま（候補は残る）
    const { p, ctx } = await openFirst('pt-BR', 'America/Sao_Paulo');
    await p.selectOption('#sheet-root select[data-ob=lang]', 'en');
    await p.waitForFunction(() => LANG === 'en', null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(200);
    const s = await screen(p);
    ok(s.lang === 'en' && !s.on.length && s.cand[0] === 'BR' && s.country === '', 'C3 言語を変えても、国は選ばれず候補（BR）のまま: ' + JSON.stringify(s));
    await ctx.close();
}

// ---- C4 一度選んだ国は変わらない ----
if (!ONLY.length){
    const tag = 'C4 en-US の端末で韓国を選ぶ';
    const ctx = await ctxOf('en-US', 'America/New_York', tag);
    let blockPack = false;
    await ctx.route(/\/packs\/kr\.js/, r => blockPack ? r.abort() : r.continue());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await p.waitForSelector('#sheet-root [data-act=pick-country]', { timeout: 30000 });
    await p.click('#sheet-root .country-list [data-act=pick-country][data-cc="KR"]');
    await finishOnboard(p);
    let a = await stateOf(p);
    ok(a.country === 'KR' && a.stored === 'KR' && a.onboarded && a.lang === 'en', `${tag}: 候補（US）でなく、選んだ韓国になる: ` + JSON.stringify(a));
    await p.reload(); await booted(p); await p.waitForTimeout(400);
    a = await stateOf(p);
    ok(a.country === 'KR' && a.stored === 'KR' && a.sheet !== 'country', `${tag}: 再読み込みのあとも韓国: ` + JSON.stringify(a));
    await p.evaluate(() => { const n = ++uiLangSeq; return switchLang('fr', n); }); await p.waitForTimeout(300);
    a = await stateOf(p);
    ok(a.country === 'KR' && a.stored === 'KR' && a.lang === 'fr', `${tag}: 言語をフランス語に変えても韓国: ` + JSON.stringify(a));
    await p.evaluate(() => { const n = ++uiLangSeq; return switchLang('auto', n); }); await p.waitForTimeout(300);
    a = await stateOf(p);
    ok(a.country === 'KR' && a.stored === 'KR', `${tag}: 言語を「自動」に戻しても韓国: ` + JSON.stringify(a));
    await p.reload(); await booted(p); await p.waitForTimeout(300);
    ok((await stateOf(p)).stored === 'KR', `${tag}: 言語を変えて開き直しても韓国`);
    // 国のデータが読めない（電波がない）とき: いまだけ日本の料理で開いても、保存・書き出し・控えの国は韓国のまま
    blockPack = true;
    await p.evaluate(() => { delete PACKS.KR; });
    await p.reload(); await booted(p); await p.waitForTimeout(600);
    const f = await p.evaluate(() => { S.favs.push('x'); saveNow(); saveUndo();
        return { packFail, stored: JSON.parse(localStorage.getItem('gohancho.v1')).settings.country, backup: JSON.parse(backupJson()).settings.country,
            undo: JSON.parse(localStorage.getItem('gohancho.undo')).data.settings.country }; });
    ok(f.packFail === 'KR' && f.stored === 'KR' && f.backup === 'KR' && f.undo === 'KR', `${tag}: 国のデータが読めなくても、保存・書き出し・控えは韓国: ` + JSON.stringify(f));
    blockPack = false;
    await p.reload(); await booted(p); await p.waitForTimeout(400);
    a = await stateOf(p);
    ok(a.country === 'KR' && a.stored === 'KR', `${tag}: 読めるようになったら韓国で開く: ` + JSON.stringify(a));
    // 書き出したデータを読みこんでも韓国
    const bj = await p.evaluate(() => backupJson());
    await p.evaluate(j => { importBuffer = j; document.body.insertAdjacentHTML('beforeend', '<button id="__imp" data-act="import-yes"></button>'); document.getElementById('__imp').click(); document.getElementById('__imp').remove(); }, bj);
    await p.waitForTimeout(800);
    a = await stateOf(p);
    ok(a.country === 'KR' && a.stored === 'KR', `${tag}: 書き出したデータを読みこんでも韓国: ` + JSON.stringify(a));
    await ctx.close();
}

// ---- C5 古い版のデータ・壊れた国の値 ----
if (!ONLY.length){
    // 国を選ぶ前の版（使いはじめているが国がない）: 日本にせず、国を選ぶ画面。選んだ国になり、無料期間の始まりは変えない
    {
        const tag = 'C5 国のない古い版のデータ';
        const { p, ctx } = await openSaved({ onboarded: true, firstUse: '2026-01-05', history: [{ id: 'nikujaga', d: '2026-01-05' }], settings: { uiLang: 'auto' } }, 'ja-JP', 'Asia/Tokyo', tag);
        let a = await stateOf(p); const s = await screen(p);
        ok(a.country === '' && a.stored === '' && a.sheet === 'country' && s.btn === '' && !s.on.length, `${tag}: 日本にせず、国を選ぶ画面を出す: ` + JSON.stringify([a, s]));
        await p.keyboard.press('Escape'); await p.waitForTimeout(150);
        ok((await stateOf(p)).sheet === 'country', `${tag}: 選ぶまで閉じない`);
        await p.click('#sheet-root .country-list [data-act=pick-country][data-cc="FR"]');
        await p.waitForFunction(() => S.settings.country === 'FR', null, { timeout: 30000 }).catch(() => {});
        await p.waitForTimeout(300);
        a = await stateOf(p);
        ok(a.country === 'FR' && a.onboarded && a.firstUse === '2026-01-05' && !a.sheet, `${tag}: 選んだフランスになり、無料期間の始まりは変えない: ` + JSON.stringify(a));
        await p.reload(); await booted(p); await p.waitForTimeout(300);
        ok((await stateOf(p)).stored === 'FR', `${tag}: 開き直してもフランス`);
        await ctx.close();
    }
    // 壊れた国の値（知らないコード・数・小文字）: 日本にせず、国を選ぶ画面。元のデータは端末に残す
    for (const bad of ['XX', 123, 'jp', { cc: 'KR' }]){
        const tag = `C5 壊れた国の値 ${JSON.stringify(bad)}`;
        const { p, ctx } = await openSaved({ onboarded: true, firstUse: '2026-01-05', settings: { country: bad, uiLang: 'ja' } }, 'ja-JP', 'Asia/Tokyo', tag);
        const a = await stateOf(p);
        const kept = await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('gohancho.broken.')).map(k => localStorage.getItem(k)));
        ok(a.country === '' && a.stored !== 'JP' && a.sheet === 'country', `${tag}: 日本にせず、国を選ぶ画面を出す: ` + JSON.stringify(a));
        ok(kept.some(r => r.includes('"country"')), `${tag}: 元のデータは端末に残す`);
        await ctx.close();
    }
    // 保存データがまるごと壊れている: 新しく始めて、国は選ばれていない
    {
        const tag = 'C5 まるごと壊れた保存データ';
        const { p, ctx } = await openSaved('{"settings":{"country":"KR"', 'ja-JP', 'Asia/Tokyo', tag);
        const s = await screen(p);
        ok(s.country === '' && !s.on.length && !s.btn && s.sheet === 'country', `${tag}: 日本にせず、国を選ぶ画面を出す: ` + JSON.stringify(s));
        await ctx.close();
    }
    // 国のないバックアップを読みこむ: 日本にせず、国を選ぶ画面
    {
        const tag = 'C5 国のないバックアップを読みこむ';
        const { p, ctx } = await openSaved({ onboarded: true, firstUse: '2026-01-05', settings: { country: 'IT', uiLang: 'it' } }, 'it-IT', 'Europe/Rome', tag);
        await p.evaluate(() => { importBuffer = JSON.stringify({ onboarded: true, history: [{ id: 'nikujaga', d: '2026-01-05' }], settings: { servings: 3 } }); document.body.insertAdjacentHTML('beforeend', '<button id="__imp" data-act="import-yes"></button>'); document.getElementById('__imp').click(); document.getElementById('__imp').remove(); });
        await p.waitForTimeout(800);
        const a = await stateOf(p);
        ok(a.country === '' && a.stored !== 'JP' && a.sheet === 'country', `${tag}: 日本にせず、国を選ぶ画面を出す: ` + JSON.stringify(a));
        await p.click('#sheet-root .country-list [data-act=pick-country][data-cc="IT"]');
        await p.waitForFunction(() => S.settings.country === 'IT', null, { timeout: 30000 }).catch(() => {});
        await p.waitForFunction(() => (JSON.parse(localStorage.getItem('gohancho.v1') || '{}').settings || {}).country === 'IT', null, { timeout: 5000 }).catch(() => {});
        const a2 = await stateOf(p);
        ok(a2.stored === 'IT' && a2.country === 'IT', `${tag}: 選び直した国で保存する: ` + JSON.stringify(a2));
        await ctx.close();
    }
}

// ---- C6 保存済みの設定がある人 ----
if (!ONLY.length){
    for (const [saved, locale, tz] of [[{ onboarded: true, settings: { country: 'JP', uiLang: 'ja' } }, 'en-US', 'America/New_York'],
        [{ onboarded: true, settings: { country: 'FR', uiLang: 'auto' } }, 'ko-KR', 'Asia/Seoul'],
        [{ onboarded: true, settings: { country: 'US', uiLang: 'en' } }, 'ja-JP', 'Asia/Tokyo'],
        [{ onboarded: false, settings: { country: 'KR', uiLang: 'ko' } }, 'pt-BR', 'America/Sao_Paulo']]){
        const want = saved.settings.country;
        const tag = `C6 保存済み ${want} を ${locale} で開く`;
        const { p, ctx } = await openSaved(Object.assign({ firstUse: '2026-01-01' }, saved), locale, tz, tag);
        const a = await stateOf(p);
        ok(a.country === want && a.stored === want && a.sheet !== 'country', `${tag}: 国は ${want} のまま変えない: ` + JSON.stringify(a));
        await ctx.close();
    }
}

ok(!errs.length, 'ページのエラーがない: ' + errs.join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
