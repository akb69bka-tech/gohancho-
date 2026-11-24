#!/usr/bin/env node
// 同じ名前の別の料理（統括の判断 11/17・docs/dupnames.md）: どの国でも、同じ言語の画面で、ちがう料理（ちがう ID）が同じ名前で出ないこと（18言語 × 21か国）
//  使い方: node tools/tests/dupnames.mjs [http://localhost:9331/]   （LANGS=ja,en でしぼれる）
//  D1 18言語それぞれの画面で、21か国の料理の名前（画面に出る名前 r.name）に、ID がちがうのに同じ名前のものがない（前後の空白・大文字小文字・全角半角は同じとみなす）
//  D2 名前を変えた22品（あとから足したベジ版・主菜版など）の ID が残っていて、手順・材料はそのまま（ID・材料の数が変わっていない）
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const ALL = ['ja', ...fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''))];
const LANGS = process.env.LANGS ? process.env.LANGS.split(',') : ALL;
// 名前を変えた料理（変える側）と、もとの料理（名前はそのまま）
const PAIRS = [['cn_disanxian', 'cn_di_san_xian'], ['de_weissebohnen', 'de_weisse_bohnen_eintopf'], ['eg_ful', 'eg_ful_medames_v'], ['es_espinacas', 'es_espinacasgarbanzos'], ['es_menestra', 'es_menestraverde'],
    ['es_coliflor', 'es_coliflorajoarriero'], ['fr_choufleurgratin', 'fr_gratinchoufleur'], ['gb_bubble', 'gb_bubbleandsqueak'], ['id_tempeorek', 'id_tempe_orek'], ['id_sayurlodeh', 'id_sayur_lodeh_v'], ['id_gadogado', 'id_gado_gado_vegan'],
    ['it_pastafagioli', 'it_pasta_fagioli_v'], ['it_pappapomodoro', 'it_pappa_pomodoro'], ['it_pastaceci', 'it_pasta_ceci'], ['pe_sudado', 'pe_sudado_pescado'], ['pe_sopa_quinua', 'pe_sopa_quinua_v'], ['ph_munggo', 'ph_ginisang_munggo_v'],
    ['ph_kalabasa', 'ph_ginataang_kalabasa_v'], ['ph_lumpiang_gulay', 'ph_lumpiang_gulay_v'], ['tr_ezogelin', 'tr_ezogelin_v'], ['tr_imambayildi', 'tr_imam_bayildi'], ['vn_dauhusaot', 'vn_dauhuchiensa']];

const b = await chromium.launch(LAUNCH);
const bad = [], seen = {};
for (const lg of LANGS){
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        {onboarded: true, firstUse: '2020-01-01', settings: {country: 'JP', uiLang: lg, dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'a', role: 'adult', avoid: [], allergy: []}]});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lg + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, {timeout: 30000});
    const r = await p.evaluate(async PAIRS => {
        const home = currentCountry();
        await Promise.all(COUNTRIES.filter(c => c.cc !== home && !BROWSE[c.cc]).map(c => loadBrowse(c.cc)));
        const out = {dup: [], miss: COUNTRIES.filter(c => c.cc !== home && !BROWSE[c.cc]).map(c => c.cc), n: 0, pairs: []};
        const key = s => String(s || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
        for (const c of COUNTRIES){
            const list = c.cc === home ? RECIPES.filter(r => (r.pack || 'JP') === c.cc) : (BROWSE[c.cc] || []);
            const by = new Map();
            list.forEach(r => { out.n++; const k = key(r.name); if (!k) return; const e = by.get(k) || new Set(); e.add(r.id); by.set(k, e); });
            by.forEach((ids, k) => { if (ids.size > 1) out.dup.push(c.cc + ' 「' + k + '」 ' + [...ids].join(' / ')); });
        }
        const byId = id => { for (const c of COUNTRIES){ const list = c.cc === home ? RECIPES : (BROWSE[c.cc] || []); const r = list.find(x => x.id === id); if (r) return r; } return null; };
        out.pairs = PAIRS.map(([a, z]) => { const ra = byId(a), rz = byId(z); return {a, z, ok: !!(ra && rz), na: ra && ra.name, nz: rz && rz.name, ia: ra && ra.items.length, iz: rz && rz.items.length}; });
        return out;
    }, PAIRS);
    if (r.miss.length) bad.push(`${lg}: 読めなかった国 ${r.miss.join(',')}`);
    r.dup.forEach(x => bad.push(`${lg}: ${x}`));
    seen[lg] = r;
    console.log(`${lg}: ${r.n}品・同じ名前 ${r.dup.length}組`);
    await ctx.close();
}
ok(bad.length === 0, `D1 ${LANGS.length}言語 × 21か国: ちがう料理が同じ名前で出ない: ` + bad.slice(0, 10).join(' | '));
// D2 名前を変えた料理は ID がそのまま・材料の数もそのまま（言語によらない）
{
    const r = seen[LANGS[0]], miss = r.pairs.filter(x => !x.ok).map(x => x.a + '/' + x.z);
    ok(miss.length === 0 && r.pairs.length === 22, 'D2 名前を変えた22品と、もとの料理の ID が残っている: ' + miss.join(','));
    const fsrc = id => { const cc = id.split('_')[0]; const s = fs.readFileSync(`${ROOT}/packs/${cc}.js`, 'utf8'); const i = s.search(new RegExp(`id:\\s*['"]${id}['"]`)); return i >= 0; };
    ok(PAIRS.every(([a, z]) => fsrc(a) && fsrc(z)), 'D2 パックのファイルに22組の ID がそのまま');
    console.log(r.pairs.map(x => `${x.z}: ${x.nz}（もと ${x.a}: ${x.na}）`).join('\n'));
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
