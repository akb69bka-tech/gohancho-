#!/usr/bin/env node
// 利用者モニター第3回（案2「今日の一膳」）の声 R1・R3・R4・R6 の回帰テスト（Playwright。使い方: node tools/tests/panel-r3.mjs [http://localhost:8874/]）
//  R1 家族の「少なめ・多め」が、表示の合計だけでなく、材料の分量・買い物メモ・手順の量・ご飯の合数に効く。1人分の「鶏もも肉 1/2枚（150g）」も買う単位（1枚・1/2枚使う）で出す
//  R3 おかゆの日: 早くできるおかゆ（ご飯から作る雑炊など）を先に出し、副菜・汁ものはやわらかい・あっさりした短い料理。健康・医療の言い切りは書かない
//  R4 組み合わせ: 1品・麺・パスタの日にお漬物を付けない／洋食のパスタに味噌汁・和の副菜を付けない／主食がご飯の日にご飯の副菜を付けない（ブラジル）／
//     イタリアのパスタ・リゾットは「Primo」（主菜の Secondo ではない）でズッパを重ねない／晩ごはんの汁ものに甘い羹を出さない（中国）
//  R6 食べる時刻: 過ぎていたら「もう過ぎています。今から作ると○時ごろ」、朝の時刻なら「明日の○時」。「いま…に始めると」とは出さない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const open = async (settings = {}, opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('panel-r3', JSON.stringify(settings))));
    await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, st)})); }, settings);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    if (opt.time) await p.clock.install({ time: opt.time });
    await p.goto(URL_); await ready(p);
    const cc = settings.country || 'JP';
    if (cc !== 'JP') await p.waitForFunction(cc => typeof PACK !== 'undefined' && PACK && PACK.country === cc && RECIPES.some(r => r.pack === cc), cc, { timeout: 30000 }).catch(() => {});
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};

// ---- R1 家族の量（少なめ・多め）が分量に効く ----
{
    const {p, ctx} = await open({dishCount: 3});
    const r = await p.evaluate(() => {
        S.family = [{id: 'a', name: '長男', avoid: [], allergy: [], portion: 1.5}, {id: 'b', name: '母', avoid: [], allergy: []}, {id: 'c', name: '末っ子', avoid: [], allergy: [], portion: 0.5}, {id: 'd', name: '次男', avoid: [], allergy: [], portion: 1.5}];
        S.eaters = ['a', 'b', 'c', 'd']; S.settings.servings = 4;
        const sv = svToday(), fac = servingFactor();
        setTab('today'); session.stage = 'decide'; render();
        const head = (document.querySelector('.p2-sv') || {}).textContent || '';
        // 決めた献立（照り焼きチキン: 鶏もも肉 1枚（300g）が2人分）の買い物メモ・手順・ご飯
        S.cook = {d: TODAY, ids: ['teriyaki', 'misoshiru'], slots: ['主菜', '汁物']};
        const row = todayShopRows().rows.find(e => /鶏もも肉/.test(e.key)) || {};
        const steps = stepTextsOf(byId('kakuni'), servingFactor()).join(' ');
        const rice = riceRow(cookItems());
        // 2人とも少なめ → 1人分
        S.family = [{id: 'a', name: '父', avoid: [], allergy: [], portion: 0.5}, {id: 'b', name: '母', avoid: [], allergy: [], portion: 0.5}]; S.eaters = ['a', 'b'];
        const sv2 = svToday();
        S.family = []; S.eaters = null; S.cook = null;
        return {sv, fac, head, buy: row.buyQty, use: row.use, steps, go: rice && rice.go, sv2};
    });
    ok(r.sv === 4.5 && r.fac === 2.25, 'R1-1 4人（多め2人・少なめ1人）は4.5人分として分量の倍率に入る: ' + JSON.stringify([r.sv, r.fac]));
    ok(/4\.5人分/.test(r.head), 'R1-2 今日の一膳の人数の表示も4.5人分: ' + r.head);
    ok(r.buy === '3枚' && /2と1\/4枚|2 1\/4枚/.test(r.use || ''), 'R1-3 買い物メモの鶏もも肉は4.5人分（3枚・2と1/4枚使う）: ' + JSON.stringify([r.buy, r.use]));
    ok(/水1350ml/.test(r.steps), 'R1-4 手順の量も4.5人分（豚の角煮の水600ml → 1350ml）: ' + (r.steps.match(/水\d+ml/) || [])[0]);
    ok(r.go === 2.5, 'R1-5 ご飯の合数も4.5人分（2.5合）: ' + r.go);
    ok(r.sv2 === 1, 'R1-6 2人とも少なめなら1人分: ' + r.sv2);
    await ctx.close();
}
{
    // 1人分: 鶏もも肉 1/2枚（150g）を、買う単位（1枚・1/2枚使う・残りは使いかけ）で出す
    const {p, ctx} = await open({servings: 1, dishCount: 2});
    const r = await p.evaluate(() => {
        S.cook = {d: TODAY, ids: ['teriyaki'], slots: ['主菜']};
        const row = todayShopRows().rows.find(e => /鶏もも肉/.test(e.key)) || {};
        setTab('today'); session.stage = 'shop'; render();
        const txt = (document.querySelector('.stage-shop') || document.body).textContent;
        return {buy: row.buyQty, use: row.use, left: row.left, txt: txt.slice(0, 2000)};
    });
    ok(r.buy === '1枚', 'R1-7 1人分の鶏もも肉は「1枚」を買う（1/2枚を買う数にしない）: ' + JSON.stringify(r.buy));
    ok(/^1\/2枚/.test(r.use || '') && r.left && r.left.qty === 0.5 && r.left.unit === '枚', 'R1-8 使う量 1/2枚と、残り 1/2枚は使いかけ: ' + JSON.stringify([r.use, r.left]));
    ok(/1\/2枚.*使う/.test(r.txt), 'R1-9 買う段に「1/2枚…使う」と出る');
    await ctx.close();
}

// ---- R3 おかゆの日 ----
{
    const {p, ctx} = await open({dishCount: 'auto'});
    const r = await p.evaluate(() => {
        session.mood = 'okayu'; const mains = [], bad = [], totals = [];
        for (let k = 0; k < 30; k++){
            session.rejected.clear(); newMenu();
            const its = session.menu.items.filter(x => x.r);
            mains.push(its[0] ? its[0].r.id + ':' + its[0].r.min : 'none');
            its.slice(1).forEach(x => { const q = x.r; if (q.min > 20 || ['揚', '焼', '炒'].includes(q.method) || spiceLevel(q) > 0 || /サラダ|漬け|酢の物|チゲ|ワンタン/.test(q.name)) bad.push(x.slot + ':' + q.name + q.min); });
            totals.push(its.reduce((a, x) => a + x.r.min, 0));
        }
        let pickles = 0; setTab('today'); session.stage = 'decide';
        for (let k = 0; k < 8; k++){ session.rejected.clear(); newMenu(); render(); if (/お漬物/.test(document.querySelector('.tray').textContent)) pickles++; }
        const note = typeof okayuNote === 'function' ? okayuNote() : '';
        session.mood = 'all';
        return {mains, bad, max: Math.max(...totals), note, pickles};
    });
    const slow = r.mains.filter(x => Number(x.split(':')[1]) > 20);
    ok(!slow.length, 'R3-1 おかゆの日の主菜は、早くできるおかゆ・雑炊（20分以内）を先に出す: ' + slow.slice(0, 5));
    ok(!r.bad.length, 'R3-2 おかゆの日の副菜・汁ものは、やわらかい・あっさりした20分以内の料理: ' + r.bad.slice(0, 6));
    ok(r.max <= 60, 'R3-3 おかゆの日の献立の合計は60分以内: ' + r.max);
    ok(r.note && !/副菜・汁ものはいつもどおり/.test(r.note), 'R3-4 説明は「副菜・汁ものはいつもどおり」ではない: ' + r.note);
    ok(!r.pickles, 'R3-6 おかゆの日はお漬物を付けない: ' + r.pickles);
    ok(!/効く|治|回復|症状|栄養|体に(良|いい)|消化|病気|健康/.test(r.note), 'R3-5 健康・医療の言い切りを書かない: ' + r.note);
    await ctx.close();
}

// ---- R4 組み合わせ（日本） ----
{
    const {p, ctx} = await open({dishCount: 1});
    const r = await p.evaluate(() => {
        const out = {one: [], pasta: [], wa: []};
        setTab('today'); session.stage = 'decide';
        for (let k = 0; k < 8; k++){ session.rejected.clear(); session.menu = null; newMenu(); render(); if (document.querySelector('.tray .v-konomono') || /お漬物/.test(document.querySelector('.tray').textContent)) out.one.push(menuIds().join()); }
        S.settings.dishCount = 3;
        for (const id of ['carbonara', 'meatsauce', 'napolitan', 'kinokopasta', 'yakiudon']){
            if (!byId(id)) continue;
            session.rejected.clear(); session.menu = null; newMenu(); session.menu.items[0].r = byId(id); render();
            if (/お漬物/.test(document.querySelector('.tray').textContent)) out.pasta.push(id);
        }
        for (const id of ['carbonara', 'meatsauce', 'napolitan', 'salmoncreampasta', 'tunatomatopasta']){
            const main = byId(id);
            for (let k = 0; k < 12; k++){ session.rejected.clear();
                const soup = suggestOrAny('汁物', [{slot: '主菜', r: main}], main), side = suggestOrAny('副菜', [{slot: '主菜', r: main}], main);
                [soup, side].forEach(x => { if (x && (x.genre === '和' || /味噌汁|漬け/.test(x.name))) out.wa.push(id + '+' + x.name); });
            }
        }
        return out;
    });
    ok(!r.one.length, 'R4-1 1品の日にお漬物を付けない: ' + r.one.slice(0, 3));
    ok(!r.pasta.length, 'R4-2 麺・パスタの日にお漬物を付けない: ' + r.pasta);
    ok(!r.wa.length, 'R4-3 洋食のパスタに味噌汁・和の副菜を付けない: ' + [...new Set(r.wa)].slice(0, 5));
    await ctx.close();
}
{
    // ブラジル: 主食が Arroz branco の日に、ご飯の副菜（Arroz com brócolis）を付けない
    const {p, ctx} = await open({country: 'BR', uiLang: 'ja', dishCount: 4});
    const r = await p.evaluate(() => {
        const two = [];
        if (!RECIPES.some(x => x.id === 'br_arroz_brocolis')) return {skip: true};
        for (let k = 0; k < 30; k++){ session.rejected.clear(); newMenu(); const its = session.menu.items.filter(x => x.r && x.slot !== '主菜');
            its.forEach(x => { if (x.r.method === '炊') two.push(x.r.name); }); }
        return {two, staple: stapleSpot() && stapleSpot().name};
    });
    ok(!r.skip, 'R4-4 ブラジルのデータを読みこめる');
    ok(!(r.two || []).length, 'R4-5 主食がご飯（' + r.staple + '）の日に、ご飯の副菜を付けない: ' + [...new Set(r.two || [])]);
    await ctx.close();
}
{
    // イタリア: パスタ・リゾットは Primo。Secondo の枠に入れない。Primo にズッパを重ねない
    const {p, ctx} = await open({country: 'IT', uiLang: 'it', dishCount: 4});
    const r = await p.evaluate(() => {
        const main = RECIPES.find(x => x.id === 'it_norma') || RECIPES.find(x => x.pack === 'IT' && x.type === '麺');
        if (!main) return {skip: true};
        session.rejected.clear(); newMenu(); session.menu.items[0].r = main;
        session.menu.items.forEach((x, i) => { if (i && x.slot === '汁物') x.r = suggestOrAny('汁物', session.menu.items.slice(0, i), main); });
        setTab('today'); session.stage = 'decide'; render();
        const lab = (document.querySelector('.tray .spot.main .slot') || {}).textContent || '';
        const zuppa = session.menu.items.filter(x => x.slot === '汁物' && x.r).map(x => x.r.name);
        const meat = RECIPES.find(x => x.pack === 'IT' && x.type === '主菜'); session.menu.items[0].r = meat; render();
        const lab2 = (document.querySelector('.tray .spot.main .slot') || {}).textContent || '';
        return {name: main.name, lab, zuppa, lab2};
    });
    ok(!r.skip && /Primo/i.test(r.lab) && !/Secondo/i.test(r.lab), 'R4-6 イタリアのパスタは「Primo」の枠: ' + JSON.stringify(r));
    ok(!(r.zuppa || []).length, 'R4-7 Primo（パスタ）にズッパを重ねない: ' + r.zuppa);
    ok(/Secondo/i.test(r.lab2 || ''), 'R4-8 肉・魚の主菜はいままでどおり「Secondo」: ' + r.lab2);
    await ctx.close();
}
{
    // 中国: 晩ごはんの汁もの（汤）に甘い羹（银耳莲子羹・绿豆汤）を出さない
    const {p, ctx} = await open({country: 'CN', uiLang: 'ja', dishCount: 3});
    const r = await p.evaluate(() => {
        const sweet = [], main = RECIPES.find(x => x.pack === 'CN' && x.type === '主菜');
        if (!RECIPES.some(x => x.id === 'cn_yiner_lianzi')) return {skip: true};
        for (let k = 0; k < 60; k++){ session.rejected.clear(); const s = suggestOrAny('汁物', [{slot: '主菜', r: main}], main); if (s && /cn_yiner_lianzi|cn_lvdou_tang/.test(s.id)) sweet.push(s.name); }
        for (let k = 0; k < 20; k++){ session.rejected.clear(); newMenu(); session.menu.items.forEach(x => { if (x.r && /cn_yiner_lianzi|cn_lvdou_tang/.test(x.r.id)) sweet.push(x.r.name); }); }
        return {sweet};
    });
    ok(!r.skip && !r.sweet.length, 'R4-9 晩ごはんの汁ものに甘い羹を出さない: ' + [...new Set(r.sweet || [])]);
    await ctx.close();
}

// ---- R6 食べる時刻が過ぎている・翌朝 ----
for (const [now, at, want, label] of [
    ['2026-10-28T21:38:00', '18:00', /18:00.*過ぎ.*今から作ると/, 'R6-1 過ぎた時刻なら「もう過ぎています。今から作ると○時ごろ」'],
    ['2026-10-28T21:52:00', '07:30', /明日の\s?7:30/, 'R6-2 朝の時刻なら「明日の7:30」'],
    ['2026-10-28T16:00:00', '18:30', /18:30に間に合います|18:30には間に合いません|18:30を過ぎます/, 'R6-3 これからの時刻はいままでどおり'],
]){
    const {p, ctx} = await open({dishCount: 3}, {time: new Date(now)});
    const r = await p.evaluate(at => {
        S.cook = {d: TODAY, ids: ['butadaikon', 'misoshiru', 'ohitashi'], slots: ['主菜', '汁物', '副菜']};
        S.settings.dinnerAt = at;
        const box = document.createElement('div'); box.innerHTML = eatPlanHtml(cookItems());
        S.cook = null;
        return [...box.querySelectorAll('.eat-line')].map(x => x.textContent).join(' / ').replace(/ /g, ' ');
    }, at);
    ok(want.test(r), label + ': ' + r);
    if (label.startsWith('R6-1') || label.startsWith('R6-2')) ok(!/いま\s?\d{1,2}:\d\dに始めると/.test(r), label.slice(0, 4) + 'b 「いま○時に始めると」と出さない: ' + r);
    await ctx.close();
}

await b.close();
if (errs.length){ console.log('ページのエラー:', [...new Set(errs)].slice(0, 5)); }
console.log(`panel-r3: ${checks - fails}/${checks} 成功`);
process.exit(fails || errs.length ? 1 : 0);
