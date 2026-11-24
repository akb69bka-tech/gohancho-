#!/usr/bin/env node
// カロリー「出せません」の理由（第35回 R164。Playwright。使い方: node tools/tests/kcal-r3.mjs [http://localhost:8765/]）
//  R1 読みとりの誤り: 「Pork shoulder or belly」は豚バラではなく豚肉（タイの豚の甘煮 th_moowan が数字で出る）。
//     小玉ねぎ（pearl onions・small white onions・petits oignons など）は1個 約18g（fr_petitspois の8個が 1600g にならない）。「1 small onion」はふつうの玉ねぎのまま
//  R2 理由を分ける: 1回に作る量で書かれた料理（パイ・キッシュ・もっと多い人数で割った料理）は「何人分かわからない」、
//     2人分の量なのに上限を超える料理（揚げピーナッツ・滷花生）は「1人分としては多すぎる」。21か国で、出せない料理はどちらかの文
//  R3 お膳の合計: 出せない料理があれば、その料理の名前を添える（画面のお膳の下）。主食の目安がないときは理由を添える
//  R4 新しい文の訳が17言語にある（日本語が残らない・{name} がある・効き目の言い切りがない）
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
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const BATCH = 'カロリーの目安を出せません（1回に作る量が多く、何人分かわからないため）';
const KNOWN = 'カロリーの目安を出せません（材料の量から出した数が、1人分としては多すぎるため）';
const TRAY_DISH = 'お膳の合計の目安は出せません（「{name}」の目安を出せないため）';
const TRAY_STAPLE = 'お膳の合計の目安は出せません（主食の目安がないため）';
const CLAIM = /健康|やせ|痩せ|減量|体重|効果|効く|health|weight|slim|lose|burn|gesund|abnehm|gewicht|santé|maigr|minceur|poids|salud|adelgaz|\bpeso\b|saúde|emagrec|salute|dimagr|zdrow|schud|odchud|sağlık|kilo ver|zayıfla|صحة|وزن|نحاف|सेहत|स्वास्थ्य|वज़न|वजन|kesehatan|berat badan|langsing|kalusugan|timbang|pumayat|건강|체중|살 빼|สุขภาพ|น้ำหนัก|ลดน้ำหนัก|sức khỏe|giảm cân|cân nặng|减肥|減肥|瘦|体重|體重/i;

// ---- R4 訳（ブラウザ不要）----
{
    const langs = fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
    ok(langs.length === 17, 'R4a 辞書が17言語: ' + langs.length);
    for (const lg of langs){
        let d = null; const c2 = {GOHAN_I18N: (l, o) => { d = o; }, window: {}}; vm.createContext(c2); vm.runInContext(fs.readFileSync(ROOT + '/i18n/' + lg + '.js', 'utf8'), c2);
        for (const k of [KNOWN, TRAY_DISH, TRAY_STAPLE]){
            const v = d && d[k];
            ok(typeof v === 'string' && v.length > 0, `R4b ${lg} 訳がない: ${k}`);
            if (typeof v !== 'string') continue;
            ok(!/[ぁ-んァ-ヶ]/.test(v), `R4c ${lg} 日本語が残っている: ${v}`);
            ok(!CLAIM.test(v), `R4d ${lg} 効き目の言い切り: ${v}`);
            if (k === TRAY_DISH) ok(v.includes('{name}'), `R4e ${lg} {name} がない: ${v}`);
        }
    }
    for (const k of [KNOWN, TRAY_DISH, TRAY_STAPLE]) ok(!CLAIM.test(k), 'R4d ja 効き目の言い切り: ' + k);
}

const b = await chromium.launch(LAUNCH);
const ctx = await b.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', serviceWorkers: 'block'});
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(SEED));
await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]})); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);
const get = (cc, ids) => p.evaluate(async ([cc, ids, BATCH, KNOWN]) => {
    if (currentCountry() !== cc) await setCountry(cc);
    const out = {};
    for (const id of ids){ const r = RECIPES.find(x => x.id === id); if (!r){ out[id] = null; continue; }
        const k = kcalOf(r), x = kcalRaw(r); out[id] = {k, text: kcalText(k), batch: t(BATCH), known: t(KNOWN), rows: x.rows.map(q => ({txt: q.txt, f: q.f, g: q.g, k: q.k}))}; }
    return out;
}, [cc, ids, BATCH, KNOWN]);
const row = (d, re) => d && d.rows.find(q => re.test(q.txt));

// ---- R1 読みとりの誤り ----
{
    const th = await get('TH', ['th_moowan']), m = th.th_moowan, pork = row(m, /pork/);
    ok(pork && pork.k / pork.g * 100 < 300, 'R1a th_moowan の「pork shoulder or belly」は豚バラにしない: ' + JSON.stringify(pork));
    ok(m && m.k.st === 'ok' && m.k.v <= 600, 'R1b th_moowan（タイの豚の甘煮）が数字で出る: ' + JSON.stringify(m && m.k));
    const fr = await get('FR', ['fr_petitspois']), on = row(fr.fr_petitspois, /onion/);
    ok(on && on.g >= 100 && on.g <= 200, 'R1c fr_petitspois の小玉ねぎ8個が 100〜200g: ' + JSON.stringify(on));
    ok(fr.fr_petitspois.k.st === 'ok' && fr.fr_petitspois.k.v >= 120, 'R1d fr_petitspois の1人分が 120kcal 以上: ' + JSON.stringify(fr.fr_petitspois.k));
    const g = await p.evaluate(() => [['pearl onions', '10'], ['small white onions | onion', '8'], ['petits oignons', '6'], ['小玉ねぎ', '4個'], ['small onion | onion', '1'], ['onion | onion', '1'], ['pork belly | pork', '300 g'], ['pork shoulder | pork', '300 g']].map(([x, q]) => { const f = kcMatch(x), gq = f && kcGrams(q, f, x); return [x, f && f[1], gq && gq.g]; }));
    const n = {'pearl onions': 10, 'small white onions | onion': 8, 'petits oignons': 6, '小玉ねぎ': 4};
    for (const [x, , gg] of g.slice(0, 4)) ok(gg && gg / n[x] >= 12 && gg / n[x] <= 25, `R1e ${x} は1個 12〜25g: ${gg}`);
    for (const [x, , gg] of g.slice(4, 6)) ok(gg && gg >= 120, `R1f ${x} 1個はふつうの玉ねぎ: ${gg}`);
    ok(g[6][1] > 300 && g[7][1] < 300, 'R1g pork belly は豚バラ・pork shoulder は豚肉: ' + JSON.stringify(g.slice(6)));
}
// ---- R2 理由を分ける ----
{
    const gb = await get('GB', ['gb_baconeggpie', 'gb_steakpie']), fr = await get('FR', ['fr_quiche']), cn = await get('CN', ['cn_youzha_huasheng']), tw = await get('TW', ['tw_lu_huasheng']);
    for (const [id, d] of [['gb_baconeggpie', gb.gb_baconeggpie], ['gb_steakpie', gb.gb_steakpie], ['fr_quiche', fr.fr_quiche]]) ok(d && d.k.big && d.k.batch && d.text === d.batch, `R2a ${id} は「何人分かわからない」: ${d && d.text}`);
    for (const [id, d] of [['cn_youzha_huasheng', cn.cn_youzha_huasheng], ['tw_lu_huasheng', tw.tw_lu_huasheng]]) ok(d && d.k.big && !d.k.batch && d.text === d.known, `R2b ${id} は「1人分としては多すぎる」: ${d && d.text}`);
    const r = await p.evaluate(async ([ccs, BATCH, KNOWN]) => {
        const bad = [], tally = {batch: 0, known: 0}; let n = 0;
        for (const cc of ccs){ await setCountry(cc); RECIPES.forEach(x => { n++; const k = kcalOf(x); if (!k.big) return; const tx = kcalText(k); tally[k.batch ? 'batch' : 'known']++; if (tx !== t(k.batch ? BATCH : KNOWN)) bad.push(cc + ':' + x.id); }); }
        return {bad, tally, n};
    }, [ALL_CC, BATCH, KNOWN]);
    ok(!r.bad.length, 'R2c 出せない料理の文: ' + r.bad.slice(0, 5).join(','));
    ok(r.tally.batch > 0 && r.tally.known > 0, 'R2d 21か国で両方の理由がある: ' + JSON.stringify(r.tally));
    console.log(`R2 全 ${r.n} 品: 何人分かわからない ${r.tally.batch} 品・1人分としては多すぎる ${r.tally.known} 品`);
}
// ---- R3 お膳の合計 ----
{
    const r = await p.evaluate(async () => {
        await setCountry('TW'); setTab('today'); session.menu = null; render();
        const bad = RECIPES.find(x => x.id === 'tw_lu_huasheng');
        newMenu(); const m = session.menu; const i = m.items.length - 1;
        m.items[i].r = bad; render();
        const sum = (document.querySelector('.kcal-sum .kc-v') || {}).textContent || '';
        const k = menuKcal(m), html = kcalTrayHtml(m);
        // 主食の目安がない（主食の表にない席）
        const st0 = KCAL_STAPLE.tw_staple; delete KCAL_STAPLE.tw_staple; m.items[i].r = RECIPES.find(x => slotOf(x) === '副菜' && kcalOf(x).st === 'ok' && !m.items.some(y => y.r === x));
        const k2 = menuKcal(m), html2 = kcalTrayHtml(m); KCAL_STAPLE.tw_staple = st0;
        const want = t('お膳の合計の目安は出せません（「{name}」の目安を出せないため）', {name: bad.name}), want2 = t('お膳の合計の目安は出せません（主食の目安がないため）');
        await setCountry('JP');
        return {i, sum, why: k.why && k.why.id, name: bad.name, html, k2, html2, want, want2};
    });
    ok(r.i >= 0 && r.why === 'tw_lu_huasheng', 'R3a 出せない料理を返す: ' + JSON.stringify({i: r.i, why: r.why}));
    ok(r.sum === r.want && r.sum.includes(r.name), 'R3b お膳の下に料理の名前: ' + r.sum);
    if (process.env.VERBOSE) console.log('R3c', JSON.stringify(r.k2).slice(0, 80));
    ok(r.k2.st !== 'na' || (r.k2.staple && r.html2.includes(r.want2)), 'R3c 主食の目安がないときは理由: ' + JSON.stringify(r.k2) + ' ' + r.html2.slice(0, 120));
}
// 英語の画面
{
    const r = await p.evaluate(async () => {
        await setCountry('TW'); const n = ++uiLangSeq; await switchLang('en', n);
        const bad = RECIPES.find(x => x.id === 'tw_lu_huasheng');
        newMenu(); const m = session.menu; m.items[m.items.length - 1].r = bad;
        const div = document.createElement('div'); div.innerHTML = kcalTrayHtml(m);
        return {tray: div.textContent, text: kcalText(kcalOf(bad)), name: bad.name};
    });
    ok(/meal total/i.test(r.tray) && r.tray.includes(r.name) && !/[ぁ-ん]/.test(r.tray.replace(r.name, '')), 'R3d 英語: お膳の下に料理の名前: ' + r.tray);
    ok(/too high for one serving/i.test(r.text), 'R3e 英語: 1人分としては多すぎる: ' + r.text);
}

ok(errs.length === 0, 'ページのエラー: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`kcal-r3: ${checks - fails}/${checks} ok` + (fails ? ` (SEED=${SEED})` : ''));
process.exit(fails ? 1 : 0);
