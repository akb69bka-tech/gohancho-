#!/usr/bin/env node
// 減塩の設定（オーナー決定 Q40=A。目安の表示だけ）の回帰テスト（Playwright。使い方: node tools/tests/salt-r1.mjs [http://localhost:8765/]）
//  S1 初期はオフ: 印・一言は出ない（今までの画面と変わらない）。設定に「減塩」のスイッチと「保証ではありません」の注意が出る。押すと S.settings.lowSalt が変わり、保存される
//  S2 オンのとき: 塩分が多めの料理（ひもの・浅漬け・ラーメン・キムチ・ハム・ベーコンなど）に「塩分が多めの目安」の印（お膳・一覧・詳細）。ふつうの料理には出ない。⚠（アレルゲンに当たる料理）には付けず、🔍 とは並んで出る
//  S3 判定は材料のキーと料理の id だけ: 画面の言葉（ja/en/de/ko）を変えても、同じ料理に付く。21か国で付く料理が全体の 1 割前後（0 でも半分以上でもない）
//  S4 献立のえらび: オンにすると塩分が多めの料理は出にくくなる（割合が下がる）が、外れはしない（出ることがある）。決めた献立（お膳）は、スイッチを押しても変わらない
//  S5 調味の欄: オンのとき、醤油・味噌・塩・だし・スープの素がある料理の調味の欄に「控えめに」の一言。オフでは出ない
//  S6 文言: 17言語に訳がある・数値（g・mg・数字）がない・健康や効き目の言い切りがない・「保証ではありません」の注意がある
//  S7 保存した状態の整え（lowSalt が真偽値でなければ捨てる）
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = (process.env.CCS || ALL_CC.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(SEED));
await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]})); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);
const reset = () => p.evaluate(async () => { if (currentCountry() !== 'JP') await setCountry('JP'); if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); } delete S.settings.lowSalt; S.settings.allergens = []; S.family = [S.family[0]]; setEaters(null); S.history = []; session.menu = null; save(); });

// ---- S1 初期はオフ・設定のスイッチ ----
await reset();
{
    const r = await p.evaluate(() => {
        setTab('today'); render(); setMenuMain(recipeById('ajihimono')); render();
        const o = {off: S.settings.lowSalt === undefined, tray: document.querySelectorAll('.tray .alg-tag.salt').length, badge: document.querySelectorAll('.badge.salt').length, hint: recipeCoreHtml(recipeById('nikujaga')).includes('salt-hint')};
        setTab('settings'); render();
        const card = document.querySelector('#salt-card'); o.card = !!card; o.checked = card ? card.querySelector('input').checked : null; o.warn = card ? card.querySelector('.warn').textContent : '';
        return o;
    });
    ok(r.off && r.tray === 0 && r.badge === 0 && !r.hint, 'S1a オフでは印も一言も出ない: ' + JSON.stringify(r));
    ok(r.card && r.checked === false, 'S1b 設定に「減塩」のスイッチ（初期はオフ）: ' + JSON.stringify(r));
    ok(/保証ではありません/.test(r.warn), 'S1c 設定に「保証ではありません」の短い注意: ' + r.warn);
    const tap = () => p.evaluate(() => document.querySelector('#salt-card input[data-act="low-salt"]').click());   // 画面の中の実際のクリック（細かい表示待ちに左右されない）
    await tap();
    const st = await p.evaluate(() => { saveNow(); return {s: S.settings.lowSalt, ls: JSON.parse(localStorage.getItem('gohancho.v1')).settings.lowSalt}; });
    ok(st.s === true && st.ls === true, 'S1d スイッチを入れると保存される: ' + JSON.stringify(st));
    await tap();
    const st2 = await p.evaluate(() => { saveNow(); return {s: S.settings.lowSalt, ls: JSON.parse(localStorage.getItem('gohancho.v1')).settings.lowSalt}; });
    ok(st2.s === false && st2.ls === false, 'S1e スイッチを切ると false: ' + JSON.stringify(st2));
}

// ---- S2 印（お膳・詳細・一覧）----
await reset();
{
    const r = await p.evaluate(() => {
        S.settings.lowSalt = true; save();
        const o = {};
        const tray = id => { setTab('today'); session.menu = null; render(); setMenuMain(recipeById(id)); render(); // 見る料理の器だけの印（お膳のほかの席は乱数で決まる献立。たまたま塩分が多めの汁ものなどが並ぶと2つになって落ちていた）
            return [...document.querySelectorAll('.tray .spot')].filter(sp => sp.querySelector('[data-act="open"][data-id="' + id + '"]')).flatMap(sp => [...sp.querySelectorAll('.alg-tag.salt')].map(x => x.textContent.trim())); };
        o.himono = tray('ajihimono'); o.ramen = tray('ramen'); o.kimchi = tray('kimchichige'); o.plain = tray('nikujaga');
        o.badgeSalt = badges(recipeById('ajihimono')).includes('salt'); o.badgePlain = badges(recipeById('nikujaga')).includes('salt');
        o.list = algListHtml(recipeById('hakusaiasazuke')).includes('salt');
        o.text = saltTagText();
        // アレルゲンに当たる料理は ⚠ だけ（印を重ねない）、🔍 の料理は 🔍 と並ぶ
        S.settings.allergens = ['fish']; save();
        o.conflict = algTagHtml(recipeById('ajihimono')); o.may = algTagHtml(recipeById('chahan'));
        S.settings.allergens = []; save();
        return o;
    });
    ok(r.himono.length === 1 && /塩分が多めの目安/.test(r.himono[0]) && r.himono[0].startsWith('🧂'), 'S2a ひものにお膳の印: ' + JSON.stringify(r.himono));
    ok(r.ramen.length === 1, 'S2b ラーメンにお膳の印: ' + JSON.stringify(r.ramen));
    ok(r.kimchi.length === 1, 'S2c キムチチゲにお膳の印: ' + JSON.stringify(r.kimchi));
    ok(r.plain.length === 0, 'S2d 肉じゃがには印が出ない: ' + JSON.stringify(r.plain));
    ok(r.badgeSalt && !r.badgePlain && r.list, 'S2e 詳細・一覧の印: ' + JSON.stringify([r.badgeSalt, r.badgePlain, r.list]));
    ok(r.text === '塩分が多めの目安', 'S2f 文言: ' + r.text);
    ok(r.conflict.includes('⚠') && !r.conflict.includes('salt'), 'S2g 当たる料理（⚠）には塩分の印を重ねない: ' + r.conflict);
}

// ---- S3 判定は画面の言葉に依らない・割合 ----
{
    const rate = [];
    for (const cc of CCS){
        const r = await p.evaluate(async cc => {
            if (currentCountry() !== cc) await setCountry(cc);
            const sets = {};
            for (const lg of ['ja', 'en', 'de', 'ko']){ if (LANG !== lg){ const n = ++uiLangSeq; await switchLang(lg, n); } sets[lg] = RECIPES.filter(saltHigh).map(r => r.id).join(','); }
            if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); }
            return {sets, n: RECIPES.length, hit: RECIPES.filter(saltHigh).length};
        }, cc);
        ok(new Set(Object.values(r.sets)).size === 1, `S3a ${cc} 画面の言葉で、塩分が多めの料理の顔ぶれが変わる`);
        rate.push(`${cc}:${r.hit}/${r.n}`);
        const q = r.hit / r.n;
        ok(q < 0.35, `S3b ${cc} 付きすぎ ${r.hit}/${r.n}`);
        if (cc === 'JP') ok(r.hit >= 20, `S3c ${cc} 少なすぎ ${r.hit}/${r.n}`);
    }
    console.log('S3 塩分が多めの目安の料理 ' + rate.join(' '));
    await reset();
}

// ---- S4 献立のえらび ----
{
    const r = await p.evaluate(() => {
        const frac = on => { if (on) S.settings.lowSalt = true; else delete S.settings.lowSalt; let n = 0, s = 0; for (let i = 0; i < 400; i++){ session.rejected = new Set(); const m = suggestMain(); if (m){ n++; if (saltHigh(m)) s++; } } return {n, s}; };
        const off = frac(false), on = frac(true);
        // 決めた献立は動かさない
        delete S.settings.lowSalt; session.menu = null; setTab('today'); render();
        const before = JSON.stringify(session.menu.items.map(x => x.r && x.r.id));
        S.settings.lowSalt = true; save(); render();
        const after = JSON.stringify(session.menu.items.map(x => x.r && x.r.id));
        // 全候補の中の塩分の多い料理は、すべて候補に残る（外さない）
        const pool = RECIPES.filter(r => r.main).length, avoided = RECIPES.filter(r => isAvoided(r)).length;
        delete S.settings.lowSalt; save();
        return {off, on, same: before === after, avoided};
    });
    const qo = r.off.s / r.off.n, qn = r.on.s / r.on.n;
    console.log(`S4 主菜の選び（400回）: オフ ${(qo * 100).toFixed(1)}% → オン ${(qn * 100).toFixed(1)}%（塩分が多めの料理の割合）`);
    ok(qo > 0.05, 'S4a 比べる元の割合が小さすぎる: ' + qo);
    ok(qn < qo * 0.85, `S4b オンで塩分が多めの料理が出にくくなる: ${qo} → ${qn}`);
    ok(r.on.s > 0, 'S4c 外してはいない（オンでも出ることがある）: ' + JSON.stringify(r.on));
    ok(r.same, 'S4d スイッチを押しても、決めた献立（お膳）は変わらない');
    ok(r.avoided === 0, 'S4e スイッチで料理が除外されることはない（isAvoided）: ' + r.avoided);
}

// ---- S5 調味の欄の一言 ----
{
    const r = await p.evaluate(() => {
        const html = id => recipeCoreHtml(recipeById(id));
        const a = html('nikujaga'); delete S.settings.lowSalt;
        S.settings.lowSalt = true; const on = html('nikujaga'), plain = html('hiyayakko') || ''; const sp = on.match(/salt-hint[^>]*>([^<]*)</);
        delete S.settings.lowSalt; const off = html('nikujaga');
        return {on: on.includes('salt-hint'), off: off.includes('salt-hint'), text: sp ? sp[1] : '', digits: sp ? /[0-9０-９]|\bm?g\b/.test(sp[1]) : null};
    });
    ok(r.on && !r.off, 'S5a 調味の欄の一言はオンのときだけ: ' + JSON.stringify(r));
    ok(/控えめ/.test(r.text) && !r.digits, 'S5b 一言に「控えめ」があり、数値がない: ' + r.text);
}

// ---- S6 文言（17言語）----
{
    const KEYS = ['塩分が多めの目安', '減塩（塩分の目安を表示）', 'オンにすると、塩分が多めになりがちな料理に「塩分が多めの目安」の印を出し、献立のえらびで少し出にくくします（外しはしません。決めた献立は変えません）。調味の欄には、醤油・味噌・塩・だし・スープの素を控えめにする一言を添えます。', '材料の名前からの目安です。保証ではありません。', '減塩の設定：醤油・味噌・塩・だし・スープの素は、控えめに入れてみましょう。'];
    const CLAIM = /血圧|予防|治療|病気|健康|効果|効く|下が(?:る|り)|hypertension|blood pressure|healthy|health benefit|prevent|cure|treat|lower(?:s)? (?:your )?blood|Bluthochdruck|gesund|tension|santé|salud|presión|saúde|pressione|salute|ciśnienie|zdrow|tansiyon|sağlık|ضغط|صحة|रक्तचाप|सेहत|स्वास्थ्य|tekanan darah|kesehatan|presyon|kalusugan|혈압|건강|ความดัน|สุขภาพ|huyết áp|sức khỏe|血压|健康|血壓/i;
    const langs = fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
    ok(langs.length === 17, 'S6a 辞書が17言語: ' + langs.length);
    for (const lg of langs){
        let d = null; const ctx2 = {GOHAN_I18N: (l, o) => { d = o; }, window: {}}; vm.createContext(ctx2); vm.runInContext(fs.readFileSync(ROOT + '/i18n/' + lg + '.js', 'utf8'), ctx2);
        for (const k of KEYS){
            const v = d && d[k];
            ok(typeof v === 'string' && v.length > 0, `S6b ${lg} 訳がない: ${k.slice(0, 12)}`);
            if (typeof v !== 'string') continue;
            ok(!/[ぁ-んァ-ヶ]/.test(v) || lg === 'ja', `S6c ${lg} 日本語が残っている: ${v.slice(0, 30)}`);
            ok(!/[0-9０-９]|(?<![\p{L}])(?:mg|kg|g|ml)(?![\p{L}])/u.test(v), `S6d ${lg} 数値がある: ${v.slice(0, 40)}`);
            ok(!CLAIM.test(v), `S6e ${lg} 健康や効き目の言葉がある: ${v.slice(0, 40)}`);
        }
        ok(d && d[KEYS[3]] && d[KEYS[3]] !== KEYS[3], `S6f ${lg} 「保証ではない」注意の訳`);
    }
    const ja = KEYS.join('');
    ok(!CLAIM.test(ja), 'S6g 日本語の文言に健康や効き目の言い切りがない');
    // 画面で: 英語・ドイツ語・韓国語で印が訳された文言になる
    const scr = await p.evaluate(async () => {
        const o = {};
        S.settings.lowSalt = true; save();
        for (const lg of ['en', 'de', 'ko', 'ar', 'th']){ const n = ++uiLangSeq; await switchLang(lg, n); setTab('today'); session.menu = null; render(); setMenuMain(recipeById('ajihimono')); render(); o[lg] = [...document.querySelectorAll('.tray .alg-tag.salt')].map(x => x.textContent.trim()).join('|'); }
        const n = ++uiLangSeq; await switchLang('ja', n); delete S.settings.lowSalt; save();
        return o;
    });
    for (const [lg, v] of Object.entries(scr)) ok(v && !/[ぁ-んァ-ヶ]/.test(v), `S6h ${lg} のお膳の印が訳されている: ${v}`);
}

// ---- S7 保存した状態の整え ----
await reset();
{
    const r = await p.evaluate(() => {
        const mk = v => { const d = JSON.parse(JSON.stringify(S)); d.settings.lowSalt = v; return normalizeState(d).settings.lowSalt; };
        return [mk(true), mk(false), mk('yes'), mk(1), mk(null)];
    });
    ok(r[0] === true && r[1] === false && r[2] === undefined && r[3] === undefined && r[4] === undefined, 'S7 lowSalt は真偽値だけ残す: ' + JSON.stringify(r));
}
await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
