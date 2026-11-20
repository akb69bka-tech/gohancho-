#!/usr/bin/env node
// dm44（第43回モニター: R198 の残り・R208）の回帰テスト
//  使い方: node tools/tests/dm44.mjs [http://localhost:9331/]   （ONLY=G1,G2 で絞る・CCS=PL,TR で国を絞る・N=回数）
//  G1 R198 の残り: 糖質ひかえめで主菜が2品の日（品数 7）、2品目の主菜に糖質の多い料理を出さない（条件に合う糖質の多くない主菜がほかに残っているとき）。
//     21か国 × 条件（なし・ベジタリアン・ヴィーガン）。直す前: ポーランド・ベジタリアンで約3割の日に、2品目がレンズ豆の煮込みなど（1品目と同じ「野菜」のなかまを避ける段階で出た）
//  G2 R198 の残り（知らせ）: 2品目が糖質の多い主菜で、ほかに合う糖質の多くない主菜が残っていないときは、お膳の下に知らせ（CARB_TX.few）を出す。残っているとき・オフでは出さない
//  G3 R208: 1週間プランのある日に開くと、プランの主菜（ご飯もの）に替えた案に、ご飯の副菜（トルコの Pirinç pilavı など）が残らない
//     （ご飯の副菜を除いても副菜の候補があるとき。直す前: 今日の案を作ってからプランの主菜に替えるとき、ご飯の副菜を選び直していなかった）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = process.env.CCS ? process.env.CCS.split(',') : ALL_CC;
const N = Number(process.env.N || 40);

const b = await chromium.launch(LAUNCH);
const ctxOf = async (st, tag) => {
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('dm44', tag)));
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { window.hasPro = () => true; window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return {p, ctx};
};
const ST = cc => ({onboarded: true, firstUse: '2026-01-01', settings: {country: cc, uiLang: 'ja', dishCount: 7, servings: 2, carb: true, carbNoted: true}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]});

// ---- G1・G2 主菜が2品の日 ----
if (want('G1') || want('G2')){
    const {p, ctx} = await ctxOf(ST('PL'), 'g1');
    await p.waitForSelector('#view .tray', {timeout: 30000});
    const G1bad = [], G2bad = [], lines = [];
    for (const cc of CCS){
        const r = await p.evaluate(async ([cc, N]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            const out = {g1: [], g2: [], n: 0, heavy2: 0};
            const note = async () => { render(); await __tick(); return [...document.querySelectorAll('#view .carb-few')].filter(e => e.getClientRects().length).map(e => e.textContent.trim()).join('|'); };
            for (const diet of ['', 'vegi', 'vegan']){
                S.settings.carb = true; S.settings.dishCount = 7; S.settings.avoid = diet ? dietBundleToggle([], diet, S.settings) : []; S.history = []; S.hidden = []; S.week = null; S.cook = null; save(); reconcileMenu();
                for (let i = 0; i < N; i++){
                    session.rejected = new Set(); session.mood = 'all'; newMenu();
                    const m = session.menu, two = m.items.filter((x, k) => k > 0 && x.slot === '主菜' && x.r);
                    if (!two.length) continue; out.n++;
                    const h = two.filter(x => carbHeavy(x.r)); if (!h.length) continue; out.heavy2++;
                    const left = poolForMood('主菜', 'all').filter(r => r.main && !isAvoided(r) && !S.hidden.includes(r.id) && !carbHeavy(r) && !m.items.some(y => y.r && y.r.id === r.id));
                    if (left.length) out.g1.push(`${diet || 'なし'} ${h[0].r.id}（ほかに ${left.length}品）`);
                    else if (out.g2.length < 3 && (await note()) !== CARB_TX.few()) out.g2.push(`${diet || 'なし'} ${h[0].r.id} 知らせなし`);
                }
            }
            // 知らせ: 2品目に糖質の多い主菜を置き、ほかに合う主菜を「今は出さない」にした献立 → 出る。オフ → 出ない。ほかに合う主菜があるとき（条件なし）→ 出ない
            S.settings.avoid = dietBundleToggle([], 'vegi', S.settings); S.hidden = []; save(); reconcileMenu();
            session.mood = 'all'; newMenu(); const m = session.menu, k2 = m.items.findIndex((x, k) => k > 0 && x.slot === '主菜');
            const hv = poolForMood('主菜', 'all').find(r => r.main && !isAvoided(r) && carbHeavy(r) && !m.items.some(y => y.r && y.r.id === r.id));
            if (k2 > 0 && hv){
                m.items[k2].r = hv;
                const lows = poolForMood('主菜', 'all').filter(r => r.main && !isAvoided(r) && !carbHeavy(r) && !m.items.some(y => y.r && y.r.id === r.id));
                S.hidden = lows.map(r => r.id); save(); const n1 = await note();
                S.settings.carb = false; save(); const n2 = await note(); S.settings.carb = true;
                if (n1 !== CARB_TX.few() || n2) out.g2.push('置いた2品目: ' + JSON.stringify({n1, n2}));
                S.hidden = []; save();
            }
            S.settings.avoid = []; save(); reconcileMenu();
            return out;
        }, [cc, N]);
        if (r.g1.length) G1bad.push(cc + ' ' + r.g1.slice(0, 3).join(' / '));
        if (r.g2.length) G2bad.push(cc + ' ' + r.g2.slice(0, 3).join(' / '));
        lines.push(`${cc} ${r.heavy2}/${r.n}`);
    }
    console.log('   2品目が糖質の多い主菜（日数/主菜2品の日）: ' + lines.join(' | '));
    if (want('G1')) ok(!G1bad.length, `G1 ${CCS.length}か国 × 条件3通り: 主菜2品の日、ほかに合う糖質の多くない主菜があるのに、2品目へ糖質の多い主菜を出さない: ` + G1bad.slice(0, 6).join(' || '));
    if (want('G2')) ok(!G2bad.length, `G2 ${CCS.length}か国: 2品目が糖質の多い主菜で、ほかに合う主菜がないときは知らせ。オフでは出さない: ` + G2bad.slice(0, 6).join(' || '));
    await ctx.close();
}

// ---- G3 プランのある日に開く（ご飯ものの主菜にご飯の副菜を付けない） ----
if (want('G3')){
    const {p, ctx} = await ctxOf(Object.assign(ST('TR'), {settings: Object.assign(ST('TR').settings, {carb: false, dishCount: 4})}), 'g3');
    await p.waitForSelector('#view .tray', {timeout: 30000});
    const bad = [], seen = [];
    for (const cc of CCS){
        const r = await p.evaluate(async ([cc, N]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            S.settings.avoid = []; S.history = []; S.hidden = []; S.cook = null; save();
            const rice = poolForMood('主菜', 'all').filter(r => r.main && r.type === 'ごはん' && !isAvoided(r) && !LIGHT_MEALS.has(r.id) && !EVENT_RICE.has(r.id));
            const sides = poolFor('副菜').filter(r => r.type === '副菜' && !isAvoided(r));
            if (!rice.length || !sides.some(riceSide) || !sides.some(r => !riceSide(r))) return {skip: true};
            const out = {bad: [], n: 0, riceSides: 0};
            for (let i = 0; i < N; i++){
                const p = rice[i % rice.length];
                S.week = {start: TODAY, days: [{d: TODAY, id: p.id}]}; delete S.day[TODAY]; S.draft = null; session.menu = null; session.moodDay = null; session.mood = 'all'; save();
                // 案を作ったときにご飯の副菜が入りやすいように、ご飯の副菜を先に出す（newMenu のあとプランの主菜に替える流れを見る）
                const orig = window.newMenu; let had = false;
                window.newMenu = function(){ const v = orig.apply(this, arguments); const m = session.menu; if (m){ const j = m.items.findIndex((x, k) => k > 0 && x.slot === '副菜'); const rs = poolFor('副菜').find(r => riceSide(r) && !isAvoided(r)); if (j > 0 && rs){ m.items[j].r = rs; had = true; } } return v; };
                try { ensureMenu(); } finally { window.newMenu = orig; }
                const m = session.menu; if (!m || !m.items[0].r || m.items[0].r.id !== p.id) continue;
                out.n++; if (had) out.riceSides++;
                m.items.forEach(x => { if (x.slot === '副菜' && riceSide(x.r)) out.bad.push(p.id + ' + ' + x.r.id); });
            }
            S.week = null; session.menu = null; delete S.day[TODAY]; save();
            return out;
        }, [cc, Math.min(N, 12)]);
        if (r.skip) continue;
        seen.push(`${cc} ${r.n}`);
        if (r.bad.length) bad.push(cc + ' ' + [...new Set(r.bad)].slice(0, 3).join(' / '));
        if (!r.n) bad.push(cc + ' プランの主菜が今日の案に入らない');
    }
    console.log('   見た国（プランの主菜がご飯ものの日）: ' + seen.join(' | '));
    ok(seen.some(x => x.startsWith('TR')) || !CCS.includes('TR'), 'G3a トルコを見た: ' + seen.join(' '));
    ok(!bad.length, 'G3b プランのある日に開くと、ご飯ものの主菜にご飯の副菜（Pirinç pilavı など）が残らない: ' + bad.slice(0, 6).join(' || '));
    await ctx.close();
}

await b.close();
if (errs.length) { fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`dm44: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
