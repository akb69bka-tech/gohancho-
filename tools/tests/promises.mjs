#!/usr/bin/env node
// 守る約束（docs/concept.md）の回帰テスト（Playwright。使い方: node tools/tests/promises.mjs [http://localhost:8794/]）
//  A 決めた≠作った: 「この献立に決定」では記録しない / 料理の手順を全部終えたら記録 / 手順を戻したら記録を外す /
//    献立の料理を全部作ったら「ぜんぶできました」/ 決定の取り消しで作った記録は消えない
//  B かえる: 何に変わったかを知らせ、「元に戻す」で押した枠だけ前の料理に戻る（ほかの枠は動かない）
//  C 設定と決めた献立（北条の修正 H1・H3・H4 の再発防止。ふだんから失敗扱い。STRICT=0 のときだけ「待ち」表示にできる）
//    C1 苦手を足して今日の献立を見ずに開き直しても、苦手の料理が戻らない
//    C2 決めたあとにアレルギーを足しても、決めた献立が黙って変わらず、画面の献立と作り方が食い違わない
//    C3 決めたあとに気分（おかゆの日）を押しても、確認なしに決めた献立が変わらない
//  F 献立の組み立て（戸川）: F1 気分の時間条件が副菜・汁ものにも効く / F2 季節外れの行事料理を出さない / F3 汁けの多い主菜に汁ものを付けない / F4〜F8 食べる人の人数（わたし）と辛さ・買い物の重なり・10人まで
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const STRICT = process.env.STRICT !== '0';
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0, waits = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const pend = (c, m) => { checks++; if (!c){ if (STRICT){ fails++; console.log('FAIL', m); } else { waits++; console.log('待ち（STRICT=0）', m); } } };
const open = async (state = {}, ctxIn) => {
    const ctx = ctxIn || await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
    if (!ctxIn){ await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort()); await ctx.addInitScript(seedScript(SEED));
        await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')){ localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded:true, firstUse:'2026-01-01'}, st, {settings: Object.assign({country:'JP', dishCount:3, servings:2}, st.settings || {})}))); } }, state); }
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p); return {p, ctx};
};
const todayIds = p => p.evaluate(() => S.history.filter(h => h.d === TODAY).map(h => h.id).sort().join());

// ---- A 決めた≠作った ----
{
    const {p, ctx} = await open();
    await p.evaluate(() => { setTab('today'); render(); });
    await p.evaluate(() => document.querySelector('[data-act="decide"]').click());
    await p.waitForTimeout(450);   // 決定の直後 350ms は、続けて押したタップを受けつけない（tapGuard。二度押し・ゴースト防止）
    const ids = await p.evaluate(() => S.cook.ids);
    ok(ids.length >= 2, 'A0 献立が決まる');
    ok(await todayIds(p) === '', 'A1 決めただけでは記録しない: ' + await todayIds(p));
    ok(!(await p.evaluate(() => document.querySelector('#toast-root').textContent)).includes('増えました'), 'A2 決めただけで「作った料理が増えました」と出さない');
    // 1品目の手順を全部終える
    const finish = async k => p.evaluate(k => { session.cookIdx = k; setTab('cook'); render(); const r = cookItems()[k].r;
        for (let i = 0; i < r.steps.length + 2; i++){ const b = document.querySelector('[data-act="cook-next"]'); if (!b || (((S.cook.done || {})[r.id]) || []).length >= r.steps.length) break; b.click(); } return (((S.cook.done || {})[r.id]) || []).length >= r.steps.length; }, k);
    ok(await finish(0), 'A3 1品目の手順を全部終えられる');
    ok(await todayIds(p) === ids[0], 'A4 作り終えた料理だけ記録する: ' + await todayIds(p));
    // 最後の手順を戻すと記録を外す
    await p.evaluate(() => { session.cookIdx = 0; render(); const li = [...document.querySelectorAll('.cook-steps li[data-k]')].pop(); li.click(); });
    ok(await todayIds(p) === '', 'A5 手順を戻すと、作り方で付けた記録を外す: ' + await todayIds(p));
    for (let k = 0; k < ids.length; k++) await finish(k);
    ok(await todayIds(p) === [...ids].sort().join(), 'A6 全部作ると全部記録する: ' + await todayIds(p));
    ok((await p.evaluate(() => document.querySelector('#toast-root').textContent)).includes('ぜんぶできました'), 'A7 献立の料理を全部作ったら「ぜんぶできました」');
    await p.evaluate(() => { const c = S.cook; S.cook = c; document.body.insertAdjacentHTML('beforeend', '<button id="ud" data-act="undo-decide"></button>'); document.getElementById('ud').click(); });
    ok(await todayIds(p) === [...ids].sort().join(), 'A8 決定を取り消しても、作った記録は残る');
    await ctx.close();
}

// ---- B かえるの「元に戻す」 ----
{
    const {p, ctx} = await open();
    await p.evaluate(() => { setTab('today'); render(); });
    const r = await p.evaluate(async () => {
        const m = session.menu, before = m.items.map(x => x.r && x.r.id);
        const k = m.items.findIndex((x, i) => i > 0 && x.r); if (k < 0) return {skip: true};
        const btn = document.querySelector(`[data-act="reroll"][data-i="${k}"]`); if (!btn) return {skip: true};
        btn.click();
        const mid = session.menu.items.map(x => x.r && x.r.id), msg = document.querySelector('#toast-root').textContent;
        const u = document.querySelector('[data-act="toast-undo"]'); if (u) u.click();
        const after = session.menu.items.map(x => x.r && x.r.id);
        return {k, before, mid, after, msg, hasUndo: !!u};
    });
    if (!r.skip){
        ok(r.mid.every((id, i) => i === r.k || id === r.before[i]), 'B1 かえるは押した枠だけ変わる');
        ok(r.mid[r.k] === r.before[r.k] || (r.hasUndo && r.msg.includes('にかえました')), 'B2 何に変わったかを知らせ、元に戻すが出る: ' + r.msg);
        ok(r.after.join() === r.before.join(), 'B3 元に戻すで、押した枠だけ前の料理に戻る: ' + r.before + ' → ' + r.after);
    } else ok(false, 'B0 かえるを押せる副菜がない');
    await ctx.close();
}

// ---- D モニターの小さな指摘（X5・X6・X9） ----
{
    // D1 「鶏もも」と入れたら、作れる料理でもも肉の料理を先に出す（むね肉・手羽より前）
    const {p, ctx} = await open();
    await p.evaluate(() => { setTab('fridge'); render(); });
    await p.fill('#ing-input', '鶏もも、キャベツ、卵'); await p.press('#ing-input', 'Enter'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({cut: Object.values(S.fridgeMeta).map(e => e.cut).filter(Boolean).join(), names: [...document.querySelectorAll('#fridge-results .w4x_m .name')].map(e => e.textContent)}));
    ok(r.cut === 'もも', 'D1 入力した部位（もも）を覚える: ' + r.cut);
    const firstChicken = await p.evaluate(names => { const i = names.findIndex(n => RECIPES.some(x => x.name === n && x.items.some(it => it.key === '鶏肉'))); const x = RECIPES.find(x => x.name === names[i]); return x ? x.items.filter(it => it.key === '鶏肉').map(it => it.name || it.label).join() : ''; }, r.names);
    ok(/もも/.test(firstChicken), 'D2 鶏肉の料理の先頭は、もも肉を使う料理: ' + firstChicken);
    // D3 作り方の時間は「目安 最長〜合計」
    await p.evaluate(() => { setTab('today'); render(); document.querySelector('[data-act="decide"]').click(); setTab('cook'); render(); });
    const hint = await p.evaluate(() => document.querySelector('#view').textContent);
    ok(/目安 \d+〜\d+分/.test(hint) && !hint.includes('同時に進めればもっと短く'), 'D3 作り方の時間は目安の幅で出す');
    await ctx.close();
}
{
    // D4 「ときどき一緒に食べる」家族は、ふだんの「今日食べる人」に入らない。「いつものメンバー」で戻せる
    const {p, ctx} = await open({family: [{id: 'a', name: '夫', role: 'adult', avoid: [], allergy: []}, {id: 'b', name: '母', role: 'adult', avoid: ['えび'], allergy: [], sometimes: true}]});
    const r = await p.evaluate(() => { const a = eaterMembers().map(m => m.name).join(); const av = effAvoid().includes('えび');
        S.eaters = ['a', 'b']; const b2 = eaterMembers().map(m => m.name).join(), av2 = effAvoid().includes('えび');
        setTab('today'); render(); document.querySelectorAll('details').forEach(d => d.open = true);
        const btn = document.querySelector('[data-act="eaters-usual"]'); return {a, av, b2, av2, hasBtn: !!btn, line: eatersLine()}; });
    ok(r.a === '夫' && !r.av, 'D4 ふだんは「ときどき」の人を入れない: ' + r.a);
    ok(r.b2.includes('母') && r.av2, 'D5 今日食べる人に選べば、その人の苦手も効く: ' + JSON.stringify(r));
    ok(r.hasBtn, 'D6 「いつものメンバー」で戻せる');
    await ctx.close();
}

// ---- F 献立の組み立て（戸川 A2・A4・A5） ----
{
    const {p, ctx} = await open({settings: {country: 'JP', uiLang: 'ja', dishCount: 4}});
    const r = await p.evaluate(() => {
        const over = [];
        for (const mood of ['quick', 'easy']){ session.mood = mood; for (let k = 0; k < 20; k++){ session.rejected.clear(); newMenu(); session.menu.items.forEach(x => { if (x.r && (mood === 'quick' ? x.r.min > 20 : (x.slot !== '主菜' && x.r.min > 10))) over.push(mood + ':' + x.slot + ':' + x.r.name + x.r.min); }); } }
        session.mood = 'all'; const season = [];
        const ym = parseYmd(TODAY).getMonth() + 1;
        for (let k = 0; k < 30; k++){ session.rejected.clear(); newMenu(); session.menu.items.forEach(x => { if (x.r && !inSeason(x.r)) season.push(x.r.id); }); }
        const soupy = ['ramen', 'oden', 'yosenabe', 'stew', 'curryudon'].filter(id => byId(id) && suggestOrAny('汁物', [{r: byId(id)}], byId(id)));
        return {over, season, soupy, ym};
    });
    ok(!r.over.length, 'F1 20分以内・ラクの日は、副菜・汁ものにも時間の条件が効く: ' + r.over.slice(0, 3));
    ok(!r.season.length, 'F2 季節外れの行事料理（' + r.ym + '月）をおまかせに出さない: ' + r.season);
    ok(!r.soupy.length, 'F3 汁けの多い主菜（ラーメン・鍋・シチューなど）に汁ものを付けない: ' + r.soupy);
    // A9・A15・A19
    const r2 = await p.evaluate(() => {
        S.family = [{id: 'a', name: '母', avoid: [], allergy: [], mild: true}, {id: 'b', name: '父', avoid: [], allergy: [], mild: false}];
        S.eaters = ['a']; S.settings.servings = 2;
        const sv = svToday(), wk = servingFactor(true), mild = allMild();
        const spicy = RECIPES.filter(x => x.main && spiceLevel(x) === 1).slice(0, 5).filter(x => !isAvoided(x)).map(x => x.id);
        S.eaters = undefined; S.family = [];
        S.week = {start: TODAY, days: ['chirashi'].map(id => ({d: TODAY, id}))};
        const buy = new Set(shoppingList().map(e => e.key.split('|')[0])), both = pantryList().filter(e => buy.has(e.key.slice(2))).map(e => e.label);
        S.week = null;
        return {sv, wk, mild, spicy, both, famMax: FAM_MAX};
    });
    ok(r2.sv === 1 && r2.wk === 1, 'F4 今日食べる人を1人にすると今日の分量は1人分（1週間の買い物メモは設定の人数）: ' + JSON.stringify(r2));
    ok(r2.mild && !r2.spicy.length, 'F5 食べる人が全員辛いのが苦手な日は、辛みのある料理を出さない: ' + r2.spicy);
    ok(!r2.both.length, 'F6 買う物に入っている食材を「家にあるかも」に重ねて出さない: ' + r2.both);
    ok(r2.famMax >= 10, 'F7 家族・人数は10人まで登録できる');
    const r3 = await p.evaluate(() => {
        S.family = [{id: 'a', name: '母', avoid: [], allergy: [], mild: false}, {id: 'b', name: '子', avoid: [], allergy: [], mild: false}]; S.eaters = null; S.condOpen = true; setTab('today'); render();
        const meChip = !!document.querySelector('[data-act="eater"][data-v="__me"][aria-pressed="true"]');
        S.eaters = ['__me', 'a']; const sv2 = svToday();
        S.family[1].me = true; render(); const noChip = !document.querySelector('[data-act="eater"][data-v="__me"]'); S.eaters = ['a', 'b']; const sv3 = svToday();
        S.family = []; S.eaters = null; render();
        return {meChip, sv2, noChip, sv3};
    });
    ok(r3.meChip && r3.sv2 === 2 && r3.noChip && r3.sv3 === 2, 'F8 「わたし」ははじめから選ばれ、人数に数える。家族に「これはわたし」を付けたら出さない: ' + JSON.stringify(r3));
    await ctx.close();
}

// ---- E 第2回モニターの不具合（A4・A7・A8・A11・A12） ----
{
    const {p, ctx} = await open();
    const r = await p.evaluate(() => {
        const out = {};
        // A4 季節の料理: 10月はおまかせの候補にお雑煮が出ない／1月は出る（検索では出る）
        const t0 = TODAY; TODAY = t0.slice(0, 4) + '-10-28'; out.oct = poolFor('汁物').some(r => r.id === 'zoni'); out.search = searchRecipes('お雑煮').hits.some(h => (h.r || h).id === 'zoni');
        TODAY = t0.slice(0, 4) + '-01-05'; out.jan = poolFor('汁物').some(r => r.id === 'zoni'); TODAY = t0;
        // A12 調味料の欄: 小さじ3以上は大さじに
        out.tsp = scaleSeas('醤油 小さじ1・砂糖 小さじ2', 2.5);
        return out; });
    ok(!r.oct && r.jan && r.search, 'E1 季節の料理は時期だけおまかせに出る（検索では出る）: ' + JSON.stringify(r));
    ok(r.tsp === '醤油 小さじ2と1/2・砂糖 大さじ1と小さじ2', 'E2 調味料の小さじ5は「大さじ1と小さじ2」: ' + r.tsp);
    // A7 タイマーが動いているあいだに最後の手順を押しても、1回目は「できた」にしない
    await p.evaluate(() => { setTab('today'); render(); document.querySelector('[data-act="decide"]').click(); });
    await p.waitForTimeout(450);
    const t7 = await p.evaluate(() => { session.cookIdx = 0; setTab('cook'); render(); const x = cookItems()[0]; const n = x.r.steps.length;
        S.cook.done = {[x.r.id]: [...Array(n - 1).keys()]}; render(); startTimer(300, x.r.name, 'test', x.r.id, n - 1);
        document.querySelector('[data-act="cook-next"]').click(); const first = (S.cook.done[x.r.id] || []).length >= n;
        document.querySelector('[data-act="cook-next"]').click(); const second = (S.cook.done[x.r.id] || []).length >= n;
        TIMERS.forEach(t => stopTimer(t.id)); return {first, second}; });
    ok(!t7.first && t7.second, 'E3 タイマー中の最後の手順は、1回目は止めて知らせ、2回目で「できた」: ' + JSON.stringify(t7));
    // A8 国旗から国を選ぶと、先に聞く（やめると変わらない）
    await p.evaluate(() => openCountrySheet()); await p.waitForTimeout(200);
    await p.click('[data-act="pick-country"][data-cc="US"]'); await p.waitForTimeout(200);
    const k8 = await p.evaluate(() => ({kind: sheet && sheet.kind, cc: S.settings.country}));
    await p.evaluate(() => document.querySelector('[data-act="sheet-close"]').click()); await p.waitForTimeout(200);
    ok(k8.kind === 'country-ok' && k8.cc === 'JP' && await p.evaluate(() => S.settings.country) === 'JP', 'E4 国を変える前に聞き、やめると変わらない: ' + JSON.stringify(k8));
    // A11 こま切れの冷蔵庫では、とんかつ・角煮は「今ある材料で作れる」に入らない
    await p.evaluate(() => { setTab('fridge'); render(); });
    await p.fill('#ing-input', '豚こま、キャベツ、玉ねぎ、卵、パン粉、小麦粉'); await p.press('#ing-input', 'Enter'); await p.waitForTimeout(200);
    const k11 = await p.evaluate(() => { const box = [...document.querySelectorAll('#fridge-results .w4x_grp')].find(h => h.textContent.includes('今ある材料で作れる'));
        const list = box ? box.nextElementSibling : null; return list ? [...list.querySelectorAll('.name')].map(e => e.textContent) : []; });
    ok(!k11.some(n => /とんかつ|角煮/.test(n)), 'E5 こま切れでとんかつ・角煮を「今ある材料で作れる」に入れない: ' + k11.slice(0, 8).join('・'));
    await ctx.close();
}

// ---- C 設定と決めた献立（北条の修正待ち） ----
{
    // C1 下書きにえびフライ → 設定でえびを苦手に → 今日の献立を見ずに開き直す
    const {p, ctx} = await open();
    await p.evaluate(() => { setTab('today'); session.menu.items[0].r = byId('ebifry'); render(); });
    await p.evaluate(() => { S.settings.avoid = ['えび']; save(); reconcileMenu(); refreshWeek(); setTab('settings'); render(); saveNow(); });
    const p2 = await ctx.newPage(); await p2.goto(URL_); await ready(p2);
    pend(!(await p2.evaluate(() => menuIds().includes('ebifry'))), 'C1 苦手を足して開き直しても、えびフライが戻らない');
    await ctx.close();
}
{
    // C2 えびフライに決めたあと、アレルギー（えび）を足す
    const {p, ctx} = await open();
    const r = await p.evaluate(() => { setTab('today'); session.menu.items[0].r = byId('ebifry'); render(); document.querySelector('[data-act="decide"]').click();
        const cook0 = S.cook.ids.join(); S.settings.allergens = ['shrimp']; save(); reconcileMenu(); refreshWeek(); setTab('today'); render();
        return {cook0, cook: S.cook.ids.join(), menu: menuIds().join()}; });
    pend(r.menu === r.cook, 'C2 決めたあとにアレルギーを足しても、画面の献立と作り方が食い違わない（黙って変えず知らせる）: 画面 ' + r.menu + ' / 作り方 ' + r.cook);
    await ctx.close();
}
{
    // C3 決めたあとに「おかゆの日」（画面のボタンを本当に押す）
    const {p, ctx} = await open();
    const before = await p.evaluate(() => { setTab('today'); render(); document.querySelector('[data-act="decide"]').click(); setTab('today'); render();
        const d = document.querySelector('details.cond'); if (d) d.open = true; return menuIds().join(); });
    await p.waitForTimeout(500);
    const ch = p.locator('[data-act="mood"][data-k="okayu"]');
    if (await ch.count()){
        await ch.first().click(); await p.waitForTimeout(300);
        const r = await p.evaluate(() => ({after: menuIds().join(), cook: S.cook.ids.join()}));
        pend(r.after === before && r.cook === before, 'C3 決めたあとに気分を押しても、確認なしに献立が変わらない: ' + before + ' → ' + r.after);
    }
    await ctx.close();
}

await b.close();
if (errs.length){ fails++; console.log('ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(`${checks - fails - waits}/${checks} ok${waits ? `（待ち ${waits}: STRICT=0 で失敗を待ちにしている）` : ''}  SEED=${SEED}`);
process.exit(fails ? 1 : 0);
