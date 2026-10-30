#!/usr/bin/env node
// 利用者モニター第8回の直し（献立）。Playwright。使い方: node tools/tests/panel-r8.mjs [http://localhost:8952/]
//  R19 おかゆの日の主菜は短い時間のものから（日本: 卵雑炊15分 → 入れ替えても 45分の おかゆ・卵がゆ・梅がゆ。小豆がゆ80分は出ない）。
//      「かえる」の候補も短いものから。案内の「早くできる」は、主菜が20分以内のときだけ。そうでないときは、かかる時間をそのまま書く
//  R21 おかゆ・粥の主菜がある国（JP・CN・TW・KR・TH・PH）は、条件の「気分」と主菜の「かえる」の両方に「おかゆの日」。ない国は両方ともなし
//  R23 赤飯は主菜にしない（1週間プラン・おまかせ・かえる）。さがすでは出る
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (cc, tag = '') => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r8', cc, tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(cc => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: {country: cc, uiLang: 'ja', dishCount: 4, servings: 3}})); } }, cc);
    await p.goto(URL_); await ready(p);
    return {p, ctx};
};
const PORRIDGE = ['JP', 'CN', 'TW', 'KR', 'TH', 'PH'];
const ALL = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];

// R19 日本のおかゆの日
{
    const {p, ctx} = await open('JP', 'r19');
    await p.click('[data-act=cond-open]'); await p.waitForTimeout(200);
    await p.click('#sheet-root [data-act=mood][data-k=okayu]'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
        const out = {first: null, rolls: [], note0: okayuNote(), notes: [], swaps: []};
        const m = session.menu.items[0].r; out.first = m.id + ':' + m.min;
        out.swaps.push(swapCands(0, null).map(x => x.id + ':' + x.min));
        for (let k = 0; k < 3; k++){ menuIds().forEach(id => session.rejected.add(id)); newMenu(); const r = session.menu.items[0].r; out.rolls.push(r.id + ':' + r.min); out.notes.push(okayuNote()); }
        out.swaps.push(swapCands(0, null).map(x => x.id + ':' + x.min));
        // 気分はおまかせのまま、かえるの「おかゆの日」で絞る
        // （主菜がご飯もの以外のときは、ご飯の欄を動かさないため、おかゆの候補は出ない。ご飯ものの主菜の日で見る）
        session.mood = 'all'; for (let k = 0; k < 60; k++){ session.rejected.clear(); newMenu(); if (isBowlMain(session.menu.items[0].r) === 'pickles') break; }
        out.swapF = swapCands(0, 'okayu').map(x => x.id + ':' + x.min);
        return out;
    });
    const mins = s => s.map(x => Number(x.split(':')[1]));
    ok(/^zosui:15$/.test(r.first) && /早くできる/.test(r.note0), 'R19 おかゆの日の最初の主菜は卵雑炊（15分）で、案内は「早くできる」: ' + JSON.stringify([r.first, r.note0]));
    ok(mins(r.rolls).every(n => n <= 45), 'R19 まるごと入れ替え3回でも45分まで（小豆がゆ80分・50分の粥を先に出さない）: ' + r.rolls.join(' '));
    ok(r.notes.every((x, i) => !/早くできる/.test(x) && x.includes(mins(r.rolls)[i] + '分')), 'R19 主菜が20分をこえるときは「早くできる」と言わず、かかる時間を書く: ' + JSON.stringify(r.notes[0]));
    ok(r.swaps[0].length === 3 && mins(r.swaps[0]).every(n => n <= 45), 'R19 主菜の「かえる」の候補も短いものから（卵雑炊のときは45分の3品）: ' + JSON.stringify(r.swaps));
    ok(r.swaps[1].length === 3 && mins(r.swaps[1]).every(n => n <= 60), 'R19 45分の粥を入れ替えで使ったあとも、小豆がゆ（80分）は先に出さない: ' + JSON.stringify(r.swaps));
    ok(r.swapF.length && mins(r.swapF)[0] <= 20 && mins(r.swapF).every(n => n <= 45), 'R19 かえるの絞りこみ「おかゆの日」も短いものから: ' + JSON.stringify(r.swapF));
    await ctx.close();
}
// R21 気分と「かえる」で、おかゆの日の出し方をそろえる（21か国）
{
    const bad = [], notes = [];
    for (const cc of ALL){
        const {p, ctx} = await open(cc, 'r21');
        await p.click('[data-act=cond-open]'); await p.waitForTimeout(200);
        const mood = await p.evaluate(() => !!document.querySelector('#sheet-root [data-act=mood][data-k=okayu]'));
        await p.evaluate(() => { closeSheet(); openSwap(0); }); await p.waitForTimeout(150);
        const swap = await p.evaluate(() => !!document.querySelector('#sheet-root [data-act=swap-f][data-v=okayu]'));
        await p.evaluate(() => closeSheet());
        const want = PORRIDGE.includes(cc);
        if (mood !== want || swap !== want) bad.push(`${cc} 気分=${mood} かえる=${swap}`);
        if (want){
            const r = await p.evaluate(() => { session.mood = 'okayu'; session.rejected.clear(); newMenu(); const m = session.menu.items[0].r; return {m: m && m.id, ok: !!m && okayuDayOk(m), min: m && m.min, note: okayuNote()}; });
            if (!r.ok || !r.note || (r.min > 20 && /早くできる/.test(r.note))) bad.push(`${cc} おかゆの日の主菜・案内 ` + JSON.stringify(r));
            notes.push(cc + ':' + r.m);
        }
        await ctx.close();
    }
    ok(!bad.length, 'R21 粥の主菜がある国（JP・CN・TW・KR・TH・PH）は気分とかえるの両方、ない15か国は両方なし。案内は時間に合う: ' + bad.join(' / ') + ' ' + notes.join(','));
}
// R23 赤飯を主菜にしない
{
    const {p, ctx} = await open('JP', 'r23');
    const r = await p.evaluate(() => {
        const out = {week: 0, pool: poolForMood('主菜', 'all').some(x => x.id === 'sekihan'), menu: 0, search: 0};
        for (let k = 0; k < 30; k++){ S.week = null; makeWeek(); out.week += ((S.week && S.week.days) || []).filter(x => x.id === 'sekihan').length; }
        S.week = null;
        for (const c of [1, 2, 3]) for (let k = 0; k < 15; k++){ S.settings.dishCount = c; session.rejected.clear(); newMenu(); if (session.menu.items.some(x => x.r && x.r.id === 'sekihan')) out.menu++; }
        try { out.search = searchRecipes('赤飯').hits.filter(h => (h.r || h).id === 'sekihan' || h.id === 'sekihan').length; } catch (e) { out.search = -1; }
        return out;
    });
    ok(!r.week && !r.pool && !r.menu, 'R23 赤飯は1週間プラン（30回）・おまかせの主菜に出ない: ' + JSON.stringify(r));
    ok(r.search > 0, 'R23 さがすでは赤飯が見つかる: ' + JSON.stringify(r));
    await ctx.close();
}
await b.close();
if (errs.length){ fails++; console.log('FAIL JSエラー', errs.slice(0, 3)); }
console.log(`\n${checks - fails}/${checks} ok` + (fails ? `  失敗 ${fails}  [再現: SEED=${SEED}]` : ''));
process.exit(fails ? 1 : 0);
