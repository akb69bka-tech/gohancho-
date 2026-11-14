#!/usr/bin/env node
// オーナー決定 4B: 21か国すべてに「おかゆの日」（Playwright。使い方: node tools/tests/okayu-all.mjs [http://localhost:9090/]）
//  O1 21か国 × 20回: 気分・かえるの両方に「おかゆの日」があり、主菜はおかゆのなかま（麺・揚げ物でない・辛くない・生の魚介なし）、副菜・汁ものはやわらかい料理
//  O2 おかゆの日の名前がその国のおかゆの名前（米のおかゆのない国）。ふだんの献立・1週間プランの主菜に、おかゆのなかま（okayuOnly）が出ない
//  O3 各国のおかゆのなかまの料理について、アレルゲンの判定が18の画面の言葉で同じ（牛乳・小麦・卵 などの印）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const RUNS = +(process.env.RUNS || 20);
const ALL = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const LANGS = ['ja', 'en', 'fr', 'de', 'it', 'es', 'pt-BR', 'pl', 'tr', 'ar', 'hi', 'id', 'fil', 'th', 'zh-Hans', 'zh-Hant', 'ko', 'vi'];
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (cc, tag) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('okayu-all', cc, tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(cc => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: {country: cc, uiLang: 'ja', dishCount: 3, servings: 2}})); } }, cc);
    await p.goto(URL_); await ready(p);
    return {p, ctx};
};
const sigs = {};
for (const cc of ALL){
    const {p, ctx} = await open(cc, 'o1');
    await p.click('[data-act=cond-open]'); await p.waitForTimeout(200);
    const mood = await p.evaluate(() => !!document.querySelector('#sheet-root [data-act=mood][data-k=okayu]'));
    await p.evaluate(() => { closeSheet(); openSwap(0); }); await p.waitForTimeout(150);
    const swap = await p.evaluate(() => !!document.querySelector('#sheet-root [data-act=swap-f][data-v=okayu]'));
    await p.evaluate(() => closeSheet());
    ok(mood && swap, `O1 ${cc} 気分とかえるの両方に「おかゆの日」: 気分=${mood} かえる=${swap}`);
    const r = await p.evaluate(n => {
        const out = {bad: [], mains: {}, label: MOODS.find(x => x.k === 'okayu')?.label, normal: 0};
        session.mood = 'okayu';
        for (let k = 0; k < n; k++){
            session.rejected.clear(); newMenu();
            const its = session.menu.items; const m = its[0] && its[0].r;
            if (!m){ out.bad.push('主菜なし'); continue; }
            out.mains[m.id] = (out.mains[m.id] || 0) + 1;
            if (!okayuDayOk(m) || m.type === '麺' || m.method === '揚') out.bad.push('主菜 ' + m.id);
            if (spiceLevel(m) > 0) out.bad.push('辛い ' + m.id);
            if (okayuSea(m) && okayuRawish(m)) out.bad.push('生の魚介 ' + m.id);
            its.slice(1).forEach(it => { const r2 = it.r; if (r2 && (it.slot === '副菜' || it.slot === '汁物') && !okayuSoftOk(r2) && !okayuMildOk(r2)) out.bad.push('副菜・汁もの ' + r2.id); });
        }
        session.mood = 'all';
        for (let k = 0; k < n; k++){ session.rejected.clear(); newMenu(); const m = session.menu.items[0] && session.menu.items[0].r; if (m && okayuOnly(m)) out.normal++; }
        S.week = null; makeWeek(); out.normal += ((S.week && S.week.days) || []).filter(x => { const r2 = RECIPES.find(y => y.id === x.id); return r2 && okayuOnly(r2); }).length;
        out.only = RECIPES.filter(r => r.pack && okayuOnly(r)).map(r => r.id);
        return out;
    }, RUNS);
    ok(!r.bad.length, `O1 ${cc} ${RUNS}回: 主菜はおかゆのなかまだけ・辛くない・副菜汁ものはやわらかい: ${[...new Set(r.bad)].join(',')} 主菜=${JSON.stringify(r.mains)}`);
    ok(r.normal === 0, `O2 ${cc} ふだんの献立・1週間プランの主菜におかゆのなかまが出ない: ${r.normal}`);
    console.log('   ', cc, '名前=', r.label, '専用=', r.only.length);
    // O3 判定
    for (const lg of LANGS){
        const s = await p.evaluate(async lg => {
            if (LANG !== lg){ const n = ++uiLangSeq; await switchLang(lg, n); }
            if (LANG !== lg) return null;
            const out = {};
            RECIPES.filter(r => okayuDayOk(r) && r.pack).forEach(r => { const m = algRecipeMap(r), a = [];
                Object.keys(m).sort().forEach(id => { const ks = m[id].map(x => x.kind); const hit = ks.some(k => k === 1 || k === 2 || (k === 3 && algFerm())); if (hit) a.push(id + ':h'); else if (ks.includes(4)) a.push(id + ':m'); });
                out[r.id] = a.join(','); });
            const lbl = MOODS.find(x => x.k === 'okayu'); out.__label = lbl ? lbl.label : '';
            return out;
        }, lg);
        if (!s){ ok(false, `O3 ${cc} 画面の言葉を ${lg} にできない`); continue; }
        (sigs[cc] = sigs[cc] || {})[lg] = s;
    }
    await ctx.close();
}
for (const cc of ALL){
    const per = sigs[cc] || {}, langs = Object.keys(per); if (!langs.length) continue;
    const ids = Object.keys(per[langs[0]]).filter(k => k !== '__label');
    const diffs = ids.filter(id => new Set(langs.map(l => per[l][id])).size > 1);
    ok(!diffs.length, `O3 ${cc} 18の言葉でアレルゲンの判定が同じ（${ids.length}品）: ${diffs.join(',')}`);
    const empties = langs.filter(l => ids.length && !per[l].__label);
    ok(!empties.length, `O3 ${cc} 18の言葉で「おかゆの日」の名前が出る: ${empties.join(',')}`);
}
// 名指し: 牛乳を使うおかゆのなかまは牛乳に当たる（全部の言葉）。オートミールはグルテンの🔍
{
    const {p, ctx} = await open('US', 'named');
    for (const lg of LANGS){
        const r = await p.evaluate(async lg => {
            if (LANG !== lg){ const n = ++uiLangSeq; await switchLang(lg, n); }
            const f = id => { const r = RECIPES.find(x => x.id === id); const m = algRecipeMap(r); return Object.keys(m); };
            return {farina: f('us_farina'), oat: f('us_oatmeal')};
        }, lg);
        ok(r.farina.includes('milk') && r.farina.includes('wheat') && r.oat.includes('milk'), `O3 US ${lg} ファリーナは牛乳と小麦、オートミールは牛乳: ${JSON.stringify(r)}`);
    }
    await ctx.close();
}
await b.close();
if (errs.length){ fails++; console.log('FAIL JSエラー', errs.slice(0, 3)); }
console.log(fails ? `NG ${fails}件` : 'OK');
process.exit(fails ? 1 : 0);
