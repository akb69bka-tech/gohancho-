#!/usr/bin/env node
// カロリーの目安の食材の当て違いの回帰テスト（R154・ユーザーモニター 33 回目。Playwright。使い方: node tools/tests/kcal-r2.mjs [http://localhost:8765/]）
//  R1 スイスチャード（swiss chard・acelga）はチーズではなく葉物。es_acelgas・pe_pastel_acelga が軽い
//  R2 缶詰・ゆでた豆（「400 g tin」「2 cans (800 g)」「cooked」）は、乾いた豆ではなく、ゆでた豆の値と汁を切った重さ。gb_beanburgers・gb_chilli・mx_frijoles_arroz_rojo
//  R3 青ねぎ・spring onion・scallion は1本 10〜15g（玉ねぎ1個 200g にしない）。daepa（太いねぎ）は長ねぎ。玉ねぎ・長ねぎは今までどおり
//  R4 型1台分のパイなど、1人分が上限（主菜 1100・ご飯もの/麺 1200・副菜 600・汁もの 800）を超える料理は数字を出さず「何人分かわからないため出せない」。
//     21か国の全料理で、上限を超える数字が出ない。訳が17言語にあり、日本語が残らず、効き目の言い切りがない。ダイエットモードでは重めとみる
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
const BIG_KEY = 'カロリーの目安を出せません（1回に作る量が多く、何人分かわからないため）';
const CLAIM = /健康|やせ|痩せ|減量|体重|効果|効く|health|weight|slim|lose|burn|gesund|abnehm|gewicht|santé|maigr|minceur|poids|salud|adelgaz|\bpeso\b|saúde|emagrec|salute|dimagr|zdrow|schud|odchud|sağlık|kilo ver|zayıfla|صحة|وزن|نحاف|सेहत|स्वास्थ्य|वज़न|वजन|kesehatan|berat badan|langsing|kalusugan|timbang|pumayat|건강|체중|살 빼|สุขภาพ|น้ำหนัก|ลดน้ำหนัก|sức khỏe|giảm cân|cân nặng|减肥|減肥|瘦|体重|體重/i;

// ---- 訳（ブラウザ不要）----
{
    const langs = fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
    ok(langs.length === 17, 'R4a 辞書が17言語: ' + langs.length);
    for (const lg of langs){
        let d = null; const c2 = {GOHAN_I18N: (l, o) => { d = o; }, window: {}}; vm.createContext(c2); vm.runInContext(fs.readFileSync(ROOT + '/i18n/' + lg + '.js', 'utf8'), c2);
        const v = d && d[BIG_KEY];
        ok(typeof v === 'string' && v.length > 0, `R4b ${lg} 訳がない`);
        if (typeof v === 'string'){ ok(!/[ぁ-んァ-ヶ]/.test(v), `R4c ${lg} 日本語が残っている: ${v}`); ok(!CLAIM.test(v), `R4d ${lg} 効き目の言い切り: ${v}`); }
    }
    ok(!CLAIM.test(BIG_KEY), 'R4d ja 効き目の言い切り');
}

const b = await chromium.launch(LAUNCH);
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(SEED));
await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]})); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);

// 料理の値と、材料の行（食材の行の頭・グラム）
const get = (cc, ids) => p.evaluate(async ([cc, ids]) => {
    await setCountry(cc);
    const out = {};
    for (const id of ids){
        const r = RECIPES.find(x => x.id === id); if (!r){ out[id] = null; continue; }
        const k = kcalOf(r), x = kcalRaw(r);
        out[id] = {k, text: kcalText(k), want: t('カロリーの目安を出せません（1回に作る量が多く、何人分かわからないため）'), rows: x.rows.map(q => ({txt: q.txt, f: q.f, g: q.g, k: q.k}))};
    }
    return out;
}, [cc, ids]);
const row = (d, re) => d.rows.find(q => re.test(q.txt));
const inRange = (k, lo, hi) => k.st === 'ok' && k.v >= lo && k.v <= hi;

// ---- R1 スイスチャード ----
{
    const es = await get('ES', ['es_acelgas']), pe = await get('PE', ['pe_pastel_acelga']);
    const a = es.es_acelgas, c = row(a, /chard/);
    ok(c && !/チーズ|cheese/.test(c.f) && c.k < 200, 'R1a es_acelgas の swiss chard がチーズに当たる: ' + JSON.stringify(c));
    ok(inRange(a.k, 100, 400), 'R1b es_acelgas が 100〜400: ' + JSON.stringify(a.k));
    const q = row(pe.pe_pastel_acelga, /chard/);
    ok(q && !/チーズ|cheese/.test(q.f), 'R1c pe_pastel_acelga の chard がチーズに当たる: ' + JSON.stringify(q));
    ok(inRange(pe.pe_pastel_acelga.k, 150, 600) || pe.pe_pastel_acelga.k.big, 'R1d pe_pastel_acelga が 150〜600: ' + JSON.stringify(pe.pe_pastel_acelga.k));
    const jp = await p.evaluate(() => { const f = kcMatch('スイスチャード'), g = kcMatch('swiss cheese'), h = kcMatch('acelgas'); return [f && f[1], g && g[1], h && h[1]]; });
    ok(jp[0] < 50 && jp[2] < 50, 'R1e スイスチャード・acelgas は葉物: ' + jp);
    ok(jp[1] > 300, 'R1f swiss cheese はチーズのまま: ' + jp);
}
// ---- R2 缶詰の豆 ----
{
    const gb = await get('GB', ['gb_beanburgers', 'gb_chilli']), mx = await get('MX', ['mx_frijoles_arroz_rojo']);
    for (const [d, re, lo, hi, id] of [[gb.gb_beanburgers, /kidney/, 200, 260, 'gb_beanburgers'], [gb.gb_chilli, /kidney/, 200, 260, 'gb_chilli'], [mx.mx_frijoles_arroz_rojo, /beans/, 400, 500, 'mx_frijoles_arroz_rojo']]){
        const q = row(d, re);
        ok(q && q.g >= lo && q.g <= hi && q.k / q.g * 100 < 150, `R2a ${id} の缶の豆が、汁を切ったゆでた豆になっていない: ${JSON.stringify(q)}`);
    }
    ok(inRange(gb.gb_beanburgers.k, 450, 950) || gb.gb_beanburgers.k.big, 'R2b gb_beanburgers が 450〜950: ' + JSON.stringify(gb.gb_beanburgers.k));
    ok(inRange(gb.gb_chilli.k, 400, 800), 'R2c gb_chilli が 400〜800: ' + JSON.stringify(gb.gb_chilli.k));
    const t = await p.evaluate(() => {
        const g = (txt, q) => { const lg = kcLegume(kcMatch(txt), txt, q); return [lg.f[1], lg.drain]; };
        return {dried: g('dried white beans | white beans', '250 g'), lent: g('red lentils | red lentils', '150 g'), cooked: g('white beans (cooked or canned) | white beans', '2 cans (800 g)'), jp: g('ひよこ豆（水煮）', '100g'), sprout: g('mung bean sprouts | bean sprouts', '300 g'), drained: g('chickpeas (canned, drained) | chickpeas', '1 can (240 g)')};
    });
    ok(t.dried[0] > 300 && t.lent[0] > 300, 'R2d 乾いた豆・レンズ豆は乾物のまま: ' + JSON.stringify(t));
    ok(t.cooked[0] <= 140 && t.cooked[1] === 0.6, 'R2e 「cooked or canned」「2 cans (800 g)」はゆでた豆・6割: ' + JSON.stringify(t.cooked));
    ok(t.jp[0] <= 140, 'R2f ひよこ豆（水煮）はゆでた豆: ' + JSON.stringify(t.jp));
    ok(t.sprout[0] < 50, 'R2g mung bean sprouts はもやし: ' + JSON.stringify(t.sprout));
    ok(t.drained[1] === 1, 'R2h drained と書いてあれば、重さはそのまま: ' + JSON.stringify(t.drained));
}
// ---- R3 青ねぎ ----
{
    const tr = await get('TR', ['tr_patates']), cn = await get('CN', ['cn_hongshaorou']), kr = await get('KR', ['kr_yukgaejang']);
    const q = row(tr.tr_patates, /spring onion/);
    ok(q && q.g <= 60 && !/玉ねぎ/.test(q.f), 'R3a tr_patates の spring onions 3本が 60g 以下: ' + JSON.stringify(q));
    const s = row(cn.cn_hongshaorou, /spring onion|scallion/);
    ok(s && s.g <= 40, 'R3b cn_hongshaorou の spring onions 2本が 40g 以下: ' + JSON.stringify(s));
    const d = row(kr.kr_yukgaejang, /daepa/);
    ok(d && d.g >= 200, 'R3c daepa（太いねぎ）3本は長ねぎ: ' + JSON.stringify(d));
    const g = await p.evaluate(() => ['青ねぎ', 'わけぎ', '万能ねぎ', 'green onions | scallion', 'spring onion', 'scallions', 'taze soğan', '玉ねぎ', 'onion', 'red onion', '長ねぎ', 'leeks'].map(x => { const f = kcMatch(x); return [x, f && f[1], f && kcGrams('1', f, x)]; }));
    for (const [x, v, gq] of g.slice(0, 7)) ok(gq && gq.g <= 15, `R3d ${x} 1本は 15g 以下: ${JSON.stringify(gq)}`);
    for (const [x, v, gq] of g.slice(7, 10)) ok(v === 33 && gq && gq.g >= 150, `R3e ${x} は玉ねぎのまま: ${v} ${JSON.stringify(gq)}`);
    for (const [x, v, gq] of g.slice(10)) ok(gq && gq.g >= 100, `R3f ${x} は長ねぎのまま: ${JSON.stringify(gq)}`);
}
// ---- R4 量が多すぎる料理 ----
{
    const gb = await get('GB', ['gb_baconeggpie']), e = gb.gb_baconeggpie, t0 = await p.evaluate(() => t('カロリーの目安を出せません（量のわからない材料が多いため）'));
    ok(e.k.st === 'na' && e.k.big, 'R4e gb_baconeggpie は「何人分かわからない」で数字を出さない: ' + JSON.stringify(e.k));
    ok(e.text === e.want && e.want !== t0, 'R4f 出せない理由の文: ' + e.text);
    const r = await p.evaluate(async ccs => {
        const bad = [], big = []; let n = 0;
        const CEIL = {'主菜': 1100, 'ごはん': 1200, '麺': 1200, '副菜': 600, '汁物': 800};
        for (const cc of ccs){ await setCountry(cc); RECIPES.forEach(x => { n++; const k = kcalOf(x); if (k.st === 'ok' && k.raw > (CEIL[x.type] || 1100)) bad.push(cc + ':' + x.id + ':' + k.v); if (k.big) big.push(cc + ':' + x.id); }); }
        await setCountry('GB');
        const heavy = dietHeavyFn(RECIPES)(recipeById('gb_baconeggpie') || RECIPES.find(x => x.id === 'gb_baconeggpie'));
        await setCountry('JP');
        return {bad, big, n, heavy};
    }, ALL_CC);
    ok(r.bad.length === 0, 'R4g 上限を超える数字が出ている: ' + r.bad.slice(0, 5).join(', '));
    ok(r.big.length <= r.n * 0.02, `R4h 「何人分かわからない」が多すぎる: ${r.big.length}/${r.n}`);
    ok(r.heavy === true, 'R4i ダイエットモードで、出せない（量が多すぎる）料理は重めとみる');
    console.log(`R4 全 ${r.n} 品: 量が多すぎて出せない ${r.big.length} 品`);
}

ok(errs.length === 0, 'ページのエラー: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`kcal-r2: ${checks - fails}/${checks} ok` + (fails ? ` (SEED=${SEED})` : ''));
process.exit(fails ? 1 : 0);
