#!/usr/bin/env node
// dm45（第44回モニター: R198 の残り・1品目）の回帰テスト
//  使い方: node tools/tests/dm45.mjs [http://localhost:9331/]   （ONLY=H1,H2 で絞る・CCS=PL で国を絞る・N=回数）
//  H1 糖質ひかえめ＋菜食（ベジタリアン向け）で、条件に合う糖質の多くない主菜を全部この数日に作った（○日以内に作った料理は出さない、に当たる）ときも、
//     今日の献立の1品目に糖質の多い主菜を出さない。最近作った糖質の多くない主菜から選び直す（作ってから日のたった料理を先に）。
//     直す前: ポーランド（ちょうど7品）で、7品とも1〜6日前に作ると、1品目が 100回とも Placki ziemniaczane などだった（知らせなし）。21か国 × 条件（なし・ベジタリアン）
//  H2 糖質の多くない主菜がどうしても選べない（今日「かえる」で全部外した）日に1品目が糖質の多い主菜なら、お膳の下に知らせ（CARB_TX.few）を出す。
//     ほかに選べる糖質の多くない主菜があるとき・糖質ひかえめがオフのときは出さない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = process.env.CCS ? process.env.CCS.split(',') : ALL_CC;
const N = Number(process.env.N || 30);

const b = await chromium.launch(LAUNCH);
const ctx = await b.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(seedFor('dm45', 'h')));
await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
    {onboarded: true, firstUse: '2026-01-01', settings: {country: 'PL', uiLang: 'ja', dishCount: 3, servings: 2, carb: true, carbNoted: true}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]});
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
await p.goto(URL_);
await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, {timeout: 30000}).catch(() => {});
await p.waitForSelector('#view .tray', {timeout: 30000});
await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });

const H1bad = [], H2bad = [], lines = [];
for (const cc of CCS){
    const r = await p.evaluate(async ([cc, N, w1, w2]) => {
        if (currentCountry() !== cc) await setCountry(cc);
        const out = {h1: [], h2: [], heavy: 0, n: 0};
        const note = async () => { render(); await __tick(); return [...document.querySelectorAll('#view .carb-few')].filter(e => e.getClientRects().length).map(e => e.textContent.trim()).join('|'); };
        const setup = diet => {
            S.settings.carb = true; S.settings.dishCount = 3; S.settings.avoid = diet ? dietBundleToggle([], diet, S.settings) : []; S.hidden = []; S.week = null; S.cook = null; session.rejected = new Set(); session.mood = 'all';
            const low = poolForMood('主菜', 'all').filter(r => r.main && !isAvoided(r) && !carbHeavy(r));
            const avoid = Number(S.settings.avoidDays) || 10;
            // 糖質の多くない主菜を全部、1〜(○日−1)日前に作った（○日以内に作った料理は出さない、に全部当たる）
            S.history = low.map((r, i) => ({d: addDays(TODAY, -(1 + (i % Math.max(1, avoid - 1)))), id: r.id, name: r.name, slot: '主菜'}));
            save(); reconcileMenu();
            return low;
        };
        if (w1) for (const diet of ['', 'vegi']){
            const low = setup(diet); if (!low.length) continue;
            for (let i = 0; i < N; i++){ session.rejected = new Set(); newMenu(); const m = session.menu.items[0].r; if (!m) continue; out.n++; if (carbHeavy(m)){ out.heavy++; if (out.h1.length < 3) out.h1.push(`${diet || 'なし'} ${m.id}`); } }
        }
        if (w2){
            const low = setup('vegi');
            newMenu(); const m = session.menu;
            const heavy = poolForMood('主菜', 'all').find(r => r.main && !isAvoided(r) && carbHeavy(r) && !m.items.some(y => y.r && y.r.id === r.id));
            if (heavy && low.length){
                m.items[0].r = heavy;
                const n0 = await note();   // ほかに選べる糖質の多くない主菜がある（合う主菜が7品以上の国）→ 出ない
                low.forEach(r => session.rejected.add(r.id)); const n1 = await note();   // 全部「かえる」で外した → 出る
                S.settings.carb = false; save(); const n2 = await note(); S.settings.carb = true; save();
                const few = carbFewMains() < 7;
                if ((!few && n0) || n1 !== CARB_TX.few() || n2) out.h2.push(JSON.stringify({few, n0, n1, n2}));
            }
            session.rejected = new Set();
        }
        S.settings.avoid = []; S.history = []; save(); reconcileMenu();
        return out;
    }, [cc, N, want('H1'), want('H2')]);
    if (r.h1.length) H1bad.push(`${cc} ${r.heavy}/${r.n} ` + r.h1.join(' / '));
    if (r.h2.length) H2bad.push(cc + ' ' + r.h2.join(' / '));
    lines.push(`${cc} ${r.heavy}/${r.n}`);
}
if (want('H1')){ console.log('   1品目が糖質の多い主菜（回/作った回）: ' + lines.join(' | '));
    ok(!H1bad.length, `H1 ${CCS.length}か国 × 条件2通り: 糖質の多くない主菜を全部この数日に作っていても、1品目に糖質の多い主菜を出さない（最近作った糖質の多くない主菜から選ぶ）: ` + H1bad.slice(0, 6).join(' || ')); }
if (want('H2')) ok(!H2bad.length, `H2 ${CCS.length}か国: 糖質の多くない主菜を選べない日の1品目が糖質の多い主菜なら知らせ。選べるとき・オフでは出さない: ` + H2bad.slice(0, 6).join(' || '));

await b.close();
if (errs.length) { fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`dm45: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
