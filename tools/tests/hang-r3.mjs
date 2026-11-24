#!/usr/bin/env node
// 二日酔いの日: あっさりの主菜が少ない国（メキシコ・タイ）の判定もれと説明（第35回 R163）の回帰テスト（Playwright。使い方: node tools/tests/hang-r3.mjs [http://localhost:8765/]）
//  R1 判定のもれ: レシピにある汁けの多い主菜（メキシコのポソレ・汁ごと煮た豆、タイの粥・米のスープ）があっさりに入る。
//     タイの「แกงจืด」（すましの汁もの）はカレーに数えない。カレー・こってりの例はあっさりに入らないまま
//  R2 主菜の候補にあっさりが少ない国（メキシコ・タイ）では、オンのとき二日酔いの欄（条件のシート・設定のモードのタブ・モードのシート）に説明を1回ずつ出す。
//     オフのとき・候補が多い国（日本・スペイン）では出さない。体への言い切り（効く・回復・治る）がない。訳がある（英語）
//  R3 メキシコ・タイ: オンの最初の案（N回）で主菜のあっさりがオフより減らない・いちばん多い1品が 22% 以下
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const N = Number(process.env.N || 200), TOP_MAX = 0.22;
const KEY = 'gohancho.v1';
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const st = (cc, lang = 'ja') => ({onboarded: true, firstUse: '2026-01-01', settings: {country: cc, uiLang: lang, dishCount: 4, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]});
const newPage = async ({cc = 'JP', lang = 'ja', tag = 'h'} = {}) => {
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('hang3', tag)));
    await ctx.addInitScript(([s, KEY]) => { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(s)); }, [st(cc, lang), KEY]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
    await p.goto(URL_); await ready(p);
    return {p, ctx};
};
const FEW_JA = 'この国の料理には、あっさりした主菜が少ないため、主菜はなるべく重すぎない料理を選んでいます。';

// ---- R1 判定のもれ ----
{
    const {p, ctx} = await newPage({tag: 'r1'});
    for (const [cc, light, heavy] of [
        ['MX', ['mx_pozole_verde_hongos', 'mx_frijoles_arroz_rojo', 'mx_caldo', 'mx_frijoles_olla'], ['mx_picadillo', 'mx_pollo_mole', 'mx_milanesa', 'mx_carne_asada', 'mx_pozole_verde']],
        ['TH', ['th_jokmoo', 'th_jokgai', 'th_khaotom_hed', 'th_khaotom', 'th_tomjued', 'th_kaengjuedfak', 'th_kainuengkhing'], ['th_kaengkiaowan', 'th_massamannuea', 'th_panangmoo', 'th_kaengpa', 'th_tomyum', 'th_padpriewan', 'th_kaprao']]]){
        const r = await p.evaluate(async ([cc, light, heavy]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            const get = id => RECIPES.find(x => x.id === id);
            const chued = RECIPES.filter(x => /แกงจืด/.test(x.name) && spiceLevel(x) === 0 && !hangLight(x)).map(x => x.id + ':' + JSON.stringify(hangInfo(x)));
            return {missing: [...light, ...heavy].filter(id => !get(id)), notLight: light.filter(id => get(id) && !hangLight(get(id))).map(id => id + ':' + JSON.stringify(hangInfo(get(id)))),
                light: heavy.filter(id => get(id) && hangLight(get(id))), chued};
        }, [cc, light, heavy]);
        ok(!r.missing.length, `R1a ${cc} 見る料理がレシピにある: ${r.missing.join(',')}`);
        ok(!r.notLight.length, `R1b ${cc} 汁けの多い主菜・粥・煮もの・蒸し料理があっさりに入る: ${r.notLight.join(' ')}`);
        ok(!r.light.length, `R1c ${cc} カレー・こってり・辛い料理はあっさりに入らない: ${r.light.join(',')}`);
        if (cc === 'TH') ok(!r.chued.length, 'R1d タイのแกงจืด（すましの汁もの）をカレーに数えない: ' + r.chued.join(' '));
    }
    await ctx.close();
}

// ---- R2 説明 ----
const notes = async (p) => p.evaluate(async () => {
    const tick = () => new Promise(res => setTimeout(res, 60)), o = {};
    const cnt = sel => [...document.querySelectorAll(sel)].map(e => e.textContent.trim());
    setTab('today'); await tick();
    openCondSheet(); await tick(); o.cond = cnt('#sheet-root #hang-field .hang-few'); closeSheet();
    openModeSheet(); await tick(); o.mode = cnt('#sheet-root .hang-few'); closeSheet();
    setTab('settings'); await tick(); const tb = document.querySelector('#view .set-tab[data-k="mode"]'); if (tb) tb.click(); await tick();
    o.set = cnt('#view #hang-card .hang-few'); setTab('today'); await tick();
    return o;
});
const BAD = /効く|効き|回復|治る|治す|解消|改善/;
for (const cc of ['MX', 'TH', 'JP', 'ES']){
    const few = cc === 'MX' || cc === 'TH';
    const {p, ctx} = await newPage({cc, tag: 'r2' + cc});
    const off = await notes(p);
    await p.evaluate(() => { S.settings.hangover = TODAY; save(); render(); });
    const on = await notes(p);
    ok(!off.cond.length && !off.mode.length && !off.set.length, `R2a ${cc} オフのときは説明を出さない: ` + JSON.stringify(off));
    if (few){
        ok(on.cond.length === 1 && on.mode.length === 1 && on.set.length === 1, `R2b ${cc} オンのとき、二日酔いの欄に説明を1回ずつ: ` + JSON.stringify(on));
        ok([...on.cond, ...on.mode, ...on.set].every(x => x === FEW_JA), `R2c ${cc} 説明の文言: ` + JSON.stringify(on));
    } else ok(!on.cond.length && !on.mode.length && !on.set.length, `R2d ${cc} あっさりの主菜が多い国では出さない: ` + JSON.stringify(on));
    await ctx.close();
}
ok(!BAD.test(FEW_JA), 'R2e 体への言い切りがない');
{
    const {p, ctx} = await newPage({cc: 'TH', lang: 'en', tag: 'r2en'});
    await p.evaluate(() => { S.settings.hangover = TODAY; save(); render(); });
    const on = await notes(p);
    ok(on.cond.length === 1 && /light main dishes/i.test(on.cond[0]) && !/[ぁ-ん]/.test(on.cond[0]), 'R2f 英語の訳: ' + JSON.stringify(on.cond));
    await ctx.close();
}

// ---- R3 メキシコ・タイの最初の案 ----
{
    const {p, ctx} = await newPage({tag: 'r3'});
    const rows = [];
    for (const cc of ['MX', 'TH']){
        const r = await p.evaluate(async ([cc, N]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            S.history = []; S.hidden = []; session.mood = 'all';
            const run = on => { if (on) S.settings.hangover = TODAY; else delete S.settings.hangover;
                const cnt = {}; let lt = 0, hv = 0;
                for (let i = 0; i < N; i++){ session.rejected = new Set(); newMenu(); const m = session.menu.items[0].r; if (!m) continue; cnt[m.id] = (cnt[m.id] || 0) + 1; if (hangLight(m) || hangPlain(m)) lt++; if (hangHeavy(m)) hv++; }
                const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || ['', 0];
                return {top: top[1] / N, topId: top[0], lt: lt / N, hv: hv / N}; };
            const off = run(false), on = run(true); delete S.settings.hangover;
            return {off, on};
        }, [cc, N]);
        ok(r.on.lt >= r.off.lt, `R3a ${cc} オンで主菜のあっさりが減らない: ${r.off.lt} → ${r.on.lt}`);
        ok(r.on.hv < r.off.hv, `R3b ${cc} オンで主菜の重めが減る: ${r.off.hv} → ${r.on.hv}`);
        ok(r.on.top <= TOP_MAX, `R3c ${cc} いちばん多い主菜が ${TOP_MAX * 100}% 以下: ${r.on.topId} ${(r.on.top * 100).toFixed(0)}%`);
        rows.push(`${cc} あっさり ${(r.off.lt * 100).toFixed(0)}%→${(r.on.lt * 100).toFixed(0)}%・重め ${(r.off.hv * 100).toFixed(0)}%→${(r.on.hv * 100).toFixed(0)}%・最多 ${r.on.topId} ${(r.on.top * 100).toFixed(0)}%`);
    }
    console.log('R3（' + N + '回・シード ' + SEED + '）\n  ' + rows.join('\n  '));
    await ctx.close();
}

await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー: ' + [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(`hang-r3: ${checks - fails}/${checks} ok` + (fails ? `（${fails} 件 FAIL）` : ''));
process.exit(fails ? 1 : 0);
