#!/usr/bin/env node
// カロリーの目安（1人分）とダイエットモードの回帰テスト（オーナー指示 11/09。Playwright。使い方: node tools/tests/kcal-r1.mjs [http://localhost:8765/]）
//  K1 21か国の全料理: 数字（30〜2500、10 単位）か「30 kcal 未満」か「出せない」のどれか。NaN・0・極端な値がない。出せない料理は国ごとに 1 割まで
//  K2 代表料理の値が範囲内（肉じゃが・カレー・唐揚げ・味噌汁・ご飯 など。docs/kcal-check.md と同じ料理）
//  K3 作り方の画面とお膳の下に、目安と注意書きが出る。注意書きは17言語に訳があり、その言語で出る（日本語が残らない）。健康・やせる等の言い切りがない
//  K4 ダイエットモード: オンで献立の平均 kcal が下がり、揚げ物の割合も下がる（seed 固定）。外しはしない（重めの料理も出る）。同じ料理ばかりにならない
//  K5 決めた献立・いまのお膳は、スイッチを押しても変わらない。アレルギー・苦手の除外は、オンでも漏れない
//  K6 狭い幅（195〜430px）で、お膳の下の合計・作り方の画面の目安・設定のスイッチがはみ出さない
//  K7 設定のスイッチ（初期はオフ・押すと S.settings.diet が true／切ると消える・保存の整え）
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
// ページの中で乱数の種を決め直す（オン・オフを同じ種でくらべる）
await ctx.addInitScript(() => { window.__seedRng = s => { let a = s >>> 0; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }; });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);
const reset = () => p.evaluate(async () => { if (currentCountry() !== 'JP') await setCountry('JP'); if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); } delete S.settings.diet; delete S.settings.lowSalt; S.settings.allergens = []; S.settings.avoid = []; S.family = [S.family[0]]; setEaters(null); S.history = []; S.cook = null; session.menu = null; save(); });

// ---- K1 全料理 ----
await reset();
{
    const r = await p.evaluate(async ccs => {
        const out = {};
        for (const cc of ccs){
            await setCountry(cc);
            const o = out[cc] = {n: 0, ok: 0, low: 0, na: 0, bad: []};
            RECIPES.forEach(x => { o.n++; const k = kcalOf(x);
                if (k.st === 'ok'){ o.ok++; if (!(Number.isFinite(k.v) && k.v >= 30 && k.v <= 2500 && k.v % 10 === 0)) o.bad.push(x.id + ':' + k.v); }
                else if (k.st === 'low'){ o.low++; if (!(k.raw > 0 && k.raw < 30)) o.bad.push(x.id + ':low' + k.raw); }
                else if (k.st === 'na') o.na++;
                else o.bad.push(x.id + ':?' + JSON.stringify(k)); });
        }
        await setCountry('JP');
        return out;
    }, CCS);
    let tot = 0, na = 0, low = 0;
    for (const [cc, o] of Object.entries(r)){
        tot += o.n; na += o.na; low += o.low;
        ok(o.bad.length === 0, `K1a ${cc} NaN・0・極端な値: ${o.bad.slice(0, 5).join(', ')}`);
        ok(o.na / o.n <= 0.1, `K1b ${cc} 出せない料理が多すぎる: ${o.na}/${o.n}`);
        ok(o.ok / o.n >= 0.85, `K1c ${cc} 数字の出る料理が少ない: ${o.ok}/${o.n}`);
    }
    console.log(`K1 全 ${tot} 品: 出せない ${na} 品・30 kcal 未満 ${low} 品 / ` + Object.entries(r).map(([cc, o]) => `${cc} ${o.na}/${o.n}`).join(' '));
}

// ---- K2 代表料理の範囲 ----
{
    const RANGE = {JP: {nikujaga: [300, 600], curry: [600, 1100], karaage: [450, 950], misoshiru: [50, 160], shogayaki: [280, 550], hamburg: [350, 650], gyoza: [350, 650], sabamiso: [200, 400], tonkatsu: [450, 800], oyakodon: [450, 800], ramen: [400, 750], tonjiru: [150, 350], potesala: [150, 320], yakisoba: [400, 700], mapo: [250, 500]},
        US: {us_tacos: [450, 900], us_spaghetti: [650, 1150], us_macncheese: [600, 1100]}, GB: {gb_shepherdspie: [550, 1000]}, IT: {it_carbonara: [500, 900]}, DE: {de_schnitzel: [500, 950]}, ES: {es_tortilla: [350, 700]},
        KR: {kr_kimchijjigae: [200, 450], kr_bulgogi: [350, 650]}, CN: {cn_dan_chaofan: [400, 750]}, TH: {th_padthai: [550, 1000], th_kaengkiaowan: [280, 550]}, IN: {in_dal: [170, 380], in_butterchicken: [400, 750]},
        TR: {tr_mercimek: [180, 400]}, VN: {vn_pho_ga: [400, 750]}, ID: {id_nasigoreng: [500, 900]}, PH: {ph_adobo: [380, 700]}, BR: {br_feijoada: [500, 950]}, PE: {pe_lomo_saltado: [350, 700]}, EG: {eg_koshari: [500, 850]}, MX: {mx_tacosbistec: [450, 900]}};
    const r = await p.evaluate(async R => {
        const out = [];
        for (const [cc, ids] of Object.entries(R)){ await setCountry(cc); for (const id of Object.keys(ids)){ const x = RECIPES.find(y => y.id === id); out.push([cc, id, x ? kcalOf(x) : null]); } }
        await setCountry('JP');
        out.push(['JP', 'staple-rice', {st: 'ok', v: kcalStaple({id: 'rice'})}], ['JP', 'ohitashi', kcalOf(recipeById('ohitashi'))]);
        return out;
    }, RANGE);
    for (const [cc, id, k] of r){
        if (id === 'staple-rice'){ ok(k.v === 234, 'K2 ご飯 茶碗1杯（150g × 156kcal/100g）: ' + k.v); continue; }
        if (id === 'ohitashi'){ ok(k.st === 'low' || (k.st === 'ok' && k.v <= 60), 'K2 ほうれん草のおひたしは軽い: ' + JSON.stringify(k)); continue; }
        const [lo, hi] = RANGE[cc][id];
        ok(k && k.st === 'ok' && k.v >= lo && k.v <= hi, `K2 ${cc} ${id} が範囲 ${lo}〜${hi} の外: ${JSON.stringify(k)}`);
    }
}

// ---- K3 画面と注意書き（17言語）----
await reset();
const NOTE_KEY = '材料の量からの目安です。実際の量・作り方で変わります。';
const KEYS = ['約 {n} kcal（1人分・目安）', '30 kcal 未満（1人分・目安）', 'カロリーの目安を出せません（量のわからない材料が多いため）', NOTE_KEY, 'お膳の合計：約 {n} kcal（1人分・目安）', 'お膳の合計の目安は出せません', 'カロリーの目安|ふつう', 'カロリーの目安|軽め', 'ダイエットモード（カロリーの目安が低めの料理を出しやすくする）', 'オンにすると、献立を選ぶときに、カロリーの目安が低めの料理を出しやすくし、揚げ物を少し控えめにします（外しはしません。決めた献立は変えません）。お膳の下の合計に「軽め」「ふつう」の印を出します。'];
// 健康・体・やせる等の言い切り（モードの名前「ダイエット」は、オーナーの名前なので除く）
const CLAIM = /健康|やせ|痩せ|減量|体重|効果|効く|health|weight|slim|lose|burn|gesund|abnehm|gewicht|santé|maigr|minceur|poids|salud|adelgaz|\bpeso\b|saúde|emagrec|salute|dimagr|zdrow|schud|odchud|wag[aię]|sağlık|kilo ver|zayıfla|صحة|وزن|نحاف|सेहत|स्वास्थ्य|वज़न|वजन|kesehatan|berat badan|langsing|kalusugan|timbang|pumayat|건강|체중|살 빼|สุขภาพ|น้ำหนัก|ลดน้ำหนัก|sức khỏe|giảm cân|cân nặng|健康|减肥|減肥|瘦|体重|體重|减脂|減脂/i;
{
    const langs = fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
    ok(langs.length === 17, 'K3a 辞書が17言語: ' + langs.length);
    for (const lg of langs){
        let d = null; const c2 = {GOHAN_I18N: (l, o) => { d = o; }, window: {}}; vm.createContext(c2); vm.runInContext(fs.readFileSync(ROOT + '/i18n/' + lg + '.js', 'utf8'), c2);
        for (const k of KEYS){
            const v = d && d[k];
            ok(typeof v === 'string' && v.length > 0, `K3b ${lg} 訳がない: ${k.slice(0, 16)}`);
            if (typeof v !== 'string') continue;
            ok(!/[ぁ-んァ-ヶ]/.test(v), `K3c ${lg} 日本語が残っている: ${v.slice(0, 30)}`);
            ok(!CLAIM.test(k.startsWith('ダイエットモード') ? v.replace(/^[^（(]*/, '') : v), `K3d ${lg} 効き目の言い切り: ${v.slice(0, 50)}`);   // モードの名前（ダイエット）はオーナーの名前なので、かっこの前は見ない
            if (/\{n\}/.test(k)) ok(/\{n\}/.test(v), `K3e ${lg} {n} がない: ${v}`);
        }
    }
    for (const k of KEYS.slice(1)) ok(!CLAIM.test(k.replace(/^ダイエットモード/, '')), 'K3d ja 効き目の言い切り: ' + k.slice(0, 30));
    // 画面: 作り方の画面（調味料の下）とお膳の下。言語を変えると注意書きもその言語で
    for (const lg of ['ja', 'en', 'de', 'ar', 'th', 'zh-Hant', 'hi']){
        const r = await p.evaluate(async lg => {
            if (LANG !== lg){ const n = ++uiLangSeq; await switchLang(lg, n); }
            session.menu = null; setTab('today'); render(); setMenuMain(recipeById('nikujaga')); render();
            const sum = document.querySelector('.kcal-sum');
            const core = recipeCoreHtml(recipeById('nikujaga')), div = document.createElement('div'); div.innerHTML = core;
            const kn = div.querySelector('.kcal-note');
            return {sum: sum ? sum.textContent : '', note: kn ? kn.textContent : '', want: t('材料の量からの目安です。実際の量・作り方で変わります。'), v: kcalOf(recipeById('nikujaga')).v};
        }, lg);
        ok(r.note.includes(r.want) && r.note.includes(String(r.v)), `K3f ${lg} 作り方の画面に目安と注意書き: ${r.note}`);
        ok(r.sum.includes(r.want) && /\d/.test(r.sum), `K3g ${lg} お膳の下に合計と注意書き: ${r.sum}`);
        if (lg !== 'ja') ok(r.want !== NOTE_KEY && !/[ぁ-ん]/.test(r.note + r.sum), `K3h ${lg} 日本語のまま: ${r.note} / ${r.sum}`);
    }
    await reset();
}

// ---- K4 ダイエットモードの献立（seed 固定でオン・オフをくらべる）----
{
    const N = Number(process.env.N || 120);
    for (const cc of CCS.length === ALL_CC.length ? ['JP', 'US', 'KR', 'TH', 'DE'] : CCS){
        const r = await p.evaluate(async ({cc, N, seed}) => {
            if (currentCountry() !== cc) await setCountry(cc);
            const run = on => { if (on) S.settings.diet = true; else delete S.settings.diet;
                window.__seedRng(seed); let sum = 0, n = 0, fried = 0, heavy = 0; const mains = new Set();
                for (let i = 0; i < N; i++){ session.menu = null; session.rejected = new Set(); newMenu(); const m = session.menu;
                    const k = menuKcal(m); if (k.st !== 'ok') continue; n++; sum += k.dish;
                    m.items.forEach(x => { if (x.r && kcalFried(x.r)) fried++; });
                    const mn = m.items[0] && m.items[0].r; if (mn) mains.add(mn.id); }
                return {avg: sum / Math.max(1, n), n, fried, mains: mains.size}; };
            const off = run(false), on = run(true);
            delete S.settings.diet; session.menu = null;
            return {off, on};
        }, {cc, N, seed: SEED});
        console.log(`K4 ${cc} ${N}回: 平均 ${Math.round(r.off.avg)} → ${Math.round(r.on.avg)} kcal（料理の合計・1人分） / 揚げ物 ${r.off.fried} → ${r.on.fried} / 主菜の種類 ${r.off.mains} → ${r.on.mains}`);
        ok(r.on.avg < r.off.avg, `K4a ${cc} オンで平均が下がらない: ${JSON.stringify(r)}`);
        ok(r.on.fried <= r.off.fried + 1, `K4b ${cc} オンで揚げ物が増えた: ${JSON.stringify(r)}`);
        ok(r.on.mains >= r.off.mains * 0.6, `K4c ${cc} オンで同じ料理ばかり: ${JSON.stringify(r)}`);
    }
    // 外しはしない: 揚げ物も重めの料理も、オンでもときどき出る
    const r = await p.evaluate(async seed => {
        if (currentCountry() !== 'JP') await setCountry('JP');
        S.settings.diet = true; window.__seedRng(seed); let fried = 0;
        for (let i = 0; i < 400; i++){ session.rejected = new Set(); const m = suggestMain(); if (m && kcalFried(m)) fried++; }
        const avoided = RECIPES.filter(x => isAvoided(x)).length;
        delete S.settings.diet;
        return {fried, avoided};
    }, SEED);
    ok(r.fried > 0, 'K4d オンでも揚げ物は外さない（ときどき出る）: ' + r.fried);
    ok(r.avoided === 0, 'K4e オンで候補から外された料理がある: ' + r.avoided);
}

// ---- K5 決めた献立・いまのお膳は変わらない／除外は守る ----
await reset();
{
    const tap = () => p.evaluate(() => { setTab('settings'); render(); document.querySelector('#diet-card input[data-act="diet-mode"]').click(); setTab('today'); render(); });
    const ids = () => p.evaluate(() => JSON.stringify(session.menu.items.map(x => x.r && x.r.id)));
    await p.evaluate(() => { setTab('today'); session.menu = null; render(); });
    const a0 = await ids(); await tap(); const a1 = await ids(); await tap(); const a2 = await ids();
    ok(a0 === a1 && a1 === a2, `K5a まだ決めていないお膳も、スイッチで変わらない: ${a0} / ${a1} / ${a2}`);
    const d = await p.evaluate(() => { const m = session.menu, its = m.items.filter(x => x.r); S.cook = {d: TODAY, ids: its.map(x => x.r.id), slots: its.map(x => x.slot), done: {}}; save(); return JSON.stringify(S.cook.ids); });
    await tap(); const d1 = await p.evaluate(() => JSON.stringify(S.cook.ids)); const a3 = await ids(); await tap(); const d2 = await p.evaluate(() => JSON.stringify(S.cook.ids));
    ok(d === d1 && d1 === d2 && a3 === a2, `K5b 決めた献立が変わった: ${d} / ${d1} / ${d2}`);
    // 除外: 卵のアレルギー・苦手（豚肉）・辛いのが苦手 を入れて、オンで献立を何度作っても当たらない
    const r = await p.evaluate(async seed => {
        S.cook = null; S.settings.allergens = ['egg']; S.settings.avoid = ['豚肉']; S.settings.diet = true; save();
        window.__seedRng(seed); let bad = [], n = 0;
        for (const cc of ['JP', 'US', 'TH']){
            await setCountry(cc);
            for (let i = 0; i < 60; i++){ session.menu = null; session.rejected = new Set(); newMenu(); session.menu.items.forEach(x => { if (!x.r) return; n++; if (isAvoided(x.r) || allergyConflict(x.r)) bad.push(cc + ':' + x.r.id); }); }
        }
        await setCountry('JP'); S.settings.allergens = []; S.settings.avoid = []; delete S.settings.diet; save();
        return {n, bad};
    }, SEED);
    ok(r.n > 100 && r.bad.length === 0, `K5c オンでもアレルギー・苦手の料理が出ない: ${r.n}品中 ${r.bad.slice(0, 5).join(', ')}`);
}

// ---- K6 狭い幅 ----
await reset();
for (const w of [195, 260, 320, 360, 390, 430]){
    for (const lg of ['ja', 'de', 'ar']){
        await p.setViewportSize({width: w, height: 800});
        const r = await p.evaluate(async lg => {
            if (LANG !== lg){ const n = ++uiLangSeq; await switchLang(lg, n); }
            S.settings.diet = true; session.menu = null; setTab('today'); render(); setMenuMain(recipeById('karaage')); render();
            await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
            const vw = document.documentElement.clientWidth, over = [];
            const chk = (sel, where) => document.querySelectorAll(sel).forEach(el => { const b = el.getBoundingClientRect(); if (b.width && (b.left < -1 || b.right > vw + 1 || el.scrollWidth > el.clientWidth + 1)) over.push(where + ' ' + sel + ' ' + Math.round(b.left) + '..' + Math.round(b.right)); });
            chk('.kcal-sum', 'today'); chk('.kcal-sum .kc-tag', 'today');
            const sum = !!document.querySelector('.kcal-sum'), tag = !!document.querySelector('.kcal-sum .kc-tag');
            const page1 = document.documentElement.scrollWidth <= vw + 1;
            setTab('settings'); setTabShow('mode'); /* 設定はタブ分け（11/09）。ダイエットモードは「モード」のタブ。開かないと hidden で幅を測れない */ const dc = document.querySelector('#diet-card'); if (dc) dc.closest('details') && (dc.closest('details').open = true);
            await new Promise(res => requestAnimationFrame(res));
            chk('#diet-card', 'settings'); chk('#diet-card .check', 'settings');
            const page2 = document.documentElement.scrollWidth <= vw + 1;
            setTab('today'); render(); delete S.settings.diet;
            return {over, sum, tag, page1, page2};
        }, lg).catch(e => ({err: String(e)}));
        ok(!r.err && r.sum && r.tag, `K6a ${w}px ${lg} お膳の下の合計と印: ${JSON.stringify(r)}`);
        ok(!r.err && r.over.length === 0 && r.page1 && r.page2, `K6b ${w}px ${lg} はみ出し: ${JSON.stringify(r)}`);
    }
}
// 作り方の画面（シート）の目安
for (const w of [195, 320, 430]){
    await p.setViewportSize({width: w, height: 800});
    const r = await p.evaluate(async () => {
        if (LANG !== 'de'){ const n = ++uiLangSeq; await switchLang('de', n); }
        setTab('today'); render();
        const btn = document.querySelector('[data-act="open"][data-id]') || null;
        const box = document.createElement('div'); box.style.cssText = 'width:100%;'; box.className = 'sec'; box.innerHTML = recipeCoreHtml(recipeById('curry')); document.querySelector('#view').appendChild(box);
        await new Promise(res => requestAnimationFrame(res));
        const vw = document.documentElement.clientWidth, el = box.querySelector('.kcal-note'), b = el.getBoundingClientRect();
        const o = {ok: b.right <= vw + 1 && b.left >= -1 && el.scrollWidth <= el.clientWidth + 1, txt: el.textContent, page: document.documentElement.scrollWidth <= vw + 1};
        box.remove(); return o;
    });
    ok(r.ok && r.page, `K6c ${w}px 作り方の画面の目安がはみ出す: ${JSON.stringify(r)}`);
}
await p.setViewportSize({width: 390, height: 844});

// ---- K7 設定のスイッチ・保存 ----
await reset();
{
    const r = await p.evaluate(() => {
        setTab('settings'); render();
        const card = document.querySelector('#diet-card'), o = {card: !!card, off: S.settings.diet === undefined, checked: card ? card.querySelector('input').checked : null, warn: card ? card.querySelector('.warn').textContent : ''};
        o.nearSalt = !!(card && document.querySelector('#salt-card') && card.parentElement === document.querySelector('#salt-card').parentElement);
        return o;
    });
    ok(r.card && r.off && r.checked === false, 'K7a 設定に「ダイエットモード」（初期はオフ）: ' + JSON.stringify(r));
    ok(r.nearSalt, 'K7b 減塩の設定のすぐ近くにある: ' + JSON.stringify(r));
    ok(r.warn.includes(NOTE_KEY), 'K7c 注意書き: ' + r.warn);
    await p.evaluate(() => document.querySelector('#diet-card input[data-act="diet-mode"]').click());
    const s1 = await p.evaluate(() => { saveNow(); return {s: S.settings.diet, ls: JSON.parse(localStorage.getItem('gohancho.v1')).settings.diet}; });
    ok(s1.s === true && s1.ls === true, 'K7d 押すと S.settings.diet = true で保存: ' + JSON.stringify(s1));
    await p.evaluate(() => document.querySelector('#diet-card input[data-act="diet-mode"]').click());
    const s2 = await p.evaluate(() => { saveNow(); return {s: S.settings.diet, ls: JSON.parse(localStorage.getItem('gohancho.v1')).settings.diet}; });
    ok(s2.s === undefined && s2.ls === undefined, 'K7e 切ると消える: ' + JSON.stringify(s2));
    // オフのときは「軽め・ふつう」の印を出さない（合計は出す）
    const r2 = await p.evaluate(() => { setTab('today'); session.menu = null; render(); return {sum: !!document.querySelector('.kcal-sum'), tag: !!document.querySelector('.kcal-sum .kc-tag')}; });
    ok(r2.sum && !r2.tag, 'K7f オフ: 合計は出す・印は出さない: ' + JSON.stringify(r2));
}
// 保存した状態の整え（true でなければ捨てる）
// 先のページを閉じてから開く（開いたままだと、2つのタブの同期で先のページの保存がこのページを読み直させ、evaluate が途中で切れる）
await p.close();
{
    const p2 = await ctx.newPage();
    await p2.addInitScript(() => { localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', dishCount: 3, servings: 2, diet: 'yes'}, family: [{id: 'f0', name: 'a', role: 'adult', avoid: [], allergy: []}]})); });
    await p2.goto(URL_); await ready(p2);
    const v = await p2.evaluate(() => S.settings.diet);
    ok(v === undefined, 'K7g 真偽値でない diet は捨てる: ' + v);
    await p2.close();
}

ok(errs.length === 0, 'ページのエラー: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`kcal-r1: ${checks - fails}/${checks} ok` + (fails ? `  （SEED=${SEED}）` : ''));
process.exit(fails ? 1 : 0);
