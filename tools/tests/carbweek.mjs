#!/usr/bin/env node
// 糖質ひかえめの1週間プランで、糖質の多い汁もの・副菜が出ないこと（dm41 D5 の SEED=2676281614 で、日本の1週間にコーンスープが出ていた件）と、
// 糖質ひかえめでない人の献立・1週間プランが1つも変わらないこと。
//  使い方: node tools/tests/carbweek.mjs [http://localhost:9351/]
//    N=20（国ごとのシードの数）・NJP=200（日本のシードの数）・CCS=JP,US（国を絞る）・OLD_BASE=http://localhost:9352/（直す前の版。あれば C2 で1品ずつくらべる）
//  C1 糖質ひかえめ: 21か国 × シードごとに1週間プラン（主菜・副菜・汁もの）と献立を作り、糖質の多い料理が出ない・1週間の中で同じ料理が重ならない
//  C2 糖質ひかえめでない: OLD_BASE があれば、同じシードで直す前の版と1週間プラン・献立が1品も変わらない。
//     OLD_BASE がなければ、carbPrefer を何もしない関数に替えても結果が同じ（糖質ひかえめでないときは、並べかえた所を通っても何も変わらない）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const OLD = process.env.OLD_BASE || '';
const N = Number(process.env.N || 20), NJP = Number(process.env.NJP || N);
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = process.env.CCS ? process.env.CCS.split(',') : ALL_CC;
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const ST = carb => ({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 4, servings: 2, carb, carbNoted: true, weekSides: true}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]});
const b = await chromium.launch(LAUNCH);
async function open(url, carb){
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(`(() => { window.__swapDirect = true; })();` + rngScript(seedFor('carbweek', 'boot')));
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, ST(carb));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(url);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, {timeout: 30000});
    await p.waitForSelector('#view .tray', {timeout: 30000}); await p.waitForTimeout(200);
    return {p, ctx};
}
// 1つの国・1つのシードで、1週間プラン（3回）と献立（2回）を作って、料理の ID を返す
const run = (p, cc, seed, carb, noPrefer) => p.evaluate(async ([cc, seed, rs, carb, noPrefer]) => {
    if (currentCountry() !== cc) await setCountry(cc);
    S.settings.carb = carb; S.settings.weekSides = true; S.settings.dishCount = 4;
    const keep = window.carbPrefer; if (noPrefer) window.carbPrefer = l => l;
    (0, eval)(rs);   // この国・このシードの乱数に替える
    const weeks = [], menus = [];
    try {
        for (let k = 0; k < 3; k++){
            S.week = null; makeWeek(); ensureWeekExtras();
            weeks.push(S.week.days.map(x => [x.id, (x.extra || {}).side || null, (x.extra || {}).soup || null]));
        }
        for (let k = 0; k < 2; k++){ session.rejected.clear(); newMenu(); menus.push(session.menu.items.map(x => x.slot + ':' + (x.r ? x.r.id : '-'))); }
    } finally { window.carbPrefer = keep; S.week = null; save(); }
    const heavy = [];
    weeks.forEach((w, k) => w.forEach(([m, s, u]) => [['主菜', m], ['副菜', s], ['汁物', u]].forEach(([sl, id]) => { const r = id && byId(id); if (r && carbHeavy(r)) heavy.push(`週${k} ${sl} ${id}`); })));
    menus.forEach((m, k) => m.forEach(x => { const id = x.split(':')[1], r = byId(id); if (r && carbHeavy(r)) heavy.push(`献立${k} ${x}`); }));
    const dup = [];
    weeks.forEach((w, k) => [0, 1, 2].forEach(j => { const ids = w.map(x => x[j]).filter(Boolean); if (new Set(ids).size !== ids.length) dup.push(`週${k} ${['主菜', '副菜', '汁物'][j]} ${ids.join(',')}`); }));
    return {weeks, menus, heavy, dup};
}, [cc, seed, rngScript(seed), carb, !!noPrefer]);

// ---- C1 糖質ひかえめ ----
{
    const {p, ctx} = await open(URL_, true);
    const bad = []; let n = 0;
    for (const cc of CCS) for (let i = 0; i < (cc === 'JP' ? NJP : N); i++){
        const seed = seedFor('carbweek', cc, i); const r = await run(p, cc, seed, true);
        n++; if (r.heavy.length || r.dup.length) bad.push(`${cc} seed=${seed}: ${[...r.heavy, ...r.dup].slice(0, 3).join(' / ')}`);
    }
    console.log(`   C1 ${n} 通り（${CCS.length}か国）`);
    ok(!bad.length, `C1 糖質ひかえめの1週間プラン・献立に糖質の多い主菜・副菜・汁ものが出ない・1週間で重ならない（${n}通り）: ` + bad.slice(0, 6).join(' || '));
    await ctx.close();
}
// ---- C2 糖質ひかえめでない人は変わらない ----
{
    const A = await open(URL_, false), B = await open(OLD || URL_, false);   // 同じ状態から始めるため、くらべる側も別のページで開く
    const diff = []; let n = 0;
    for (const cc of CCS) for (let i = 0; i < Math.min(N, 10); i++){
        const seed = seedFor('carbweek-off', cc, i);
        const x = await run(A.p, cc, seed, false), y = await run(B.p, cc, seed, false, !OLD);
        n++; if (JSON.stringify([x.weeks, x.menus]) !== JSON.stringify([y.weeks, y.menus])) diff.push(`${cc} seed=${seed}`);
    }
    ok(!diff.length, `C2 糖質ひかえめでないときの1週間プラン・献立が${OLD ? '直す前の版' : '並べかえの前'}と同じ（${n}通り）: ` + diff.slice(0, 6).join(' / '));
    await A.ctx.close(); await B.ctx.close();
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\ncarbweek: ${checks - fails}/${checks} ok${fails ? '  NG ' + fails : ''}`);
process.exit(fails ? 1 : 0);
