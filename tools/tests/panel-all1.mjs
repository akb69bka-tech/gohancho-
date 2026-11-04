#!/usr/bin/env node
// 利用者モニターの掲示板の残り（安全・不具合）の直しと、直っていることの確かめ。Playwright。使い方: node tools/tests/panel-all1.mjs [http://localhost:8999/]
//  S23: おかゆの日の副菜・汁ものは、やわらかい・あっさりした料理だけ。生の魚介（กุ้งแช่น้ำปลา・鹹蜆仔）・辛い料理（中辛以上）・米のスープ（ข้าวต้ม）は、候補が尽きても出さない。
//       やわらかい候補がない国は、ゆるめた条件（辛くない・生ではない・揚げ焼き炒めではない・30分以内）の料理だけ。パックの印 soft（ไข่ตุ๋น など）も見る。
//       おかゆの日がある国（JP・TW・CN・KR・TH・PH）で、まるごと入れ替え20回 × 「かえる」の候補。品数は変わらない・枠は空にならない
//  以下は前の回で直っていたことの確かめ（掲示板の行が古いまま残っていたもの）:
//  S1: 主食のトーストは、小麦・乳・卵のアレルギーで出さず、「入れていません」の文の横にトーストが並ばない
//  B1: 「20分以内」「ラクの日」は副菜・汁ものにも効く
//  B2: 行事・季節の料理（お雑煮・七草がゆ・冷やし中華・そうめん）は、その月以外はおまかせ・1週間プランに出ない
//  B3: 汁けの多い主菜（カレーうどん・鍋）の日は汁ものの枠が空く
//  B8: 華氏はダイヤルの目盛り（25°F きざみ）、同じ料理が献立に2つ入らない、韓国語・ベトナム語の作り方の卵の個数も人数に合わせる
//  R12: おまかせの品数（auto）の日に、まるごと入れ替えで席の数が変わらない
//  第18回 R55: おかゆの日のやわらかい副菜6品・汁もの3品以上（JP・TW・CN・KR・TH・PH）。えび・かに・魚のアレルギーの韓国でも汁ものの席が空かない
//  第18回 R56: タイで卵・魚のアレルギーでも「おかゆの日」が出る（โจ๊กไก่）。粥の主菜が全部止まる条件では理由の一言
//  第18回 R8: 決めたあとの作り方のタブの「家族に送る」も3段
//  第19回 R61: タイ・フィリピンで本人の魚／卵／卵＋魚のアレルギーでも、おかゆの日の汁ものの席が埋まり（18/20以上）、副菜5品以上。フィリピン語の画面の Arroz caldo の日も汁ものが付く。6か国の顔ぶれは減らない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (settings, store, tag, locale = 'ja-JP') => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale, timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('all1', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(([st, store]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, st)}, store || {}))); } }, [settings, store || {}]);
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
const reroll = async (p, n, f) => { for (let i = 0; i < n; i++){ await p.click('#view [data-act=new-menu]'); await p.waitForTimeout(120); await f(i); } };

// ---- S23: おかゆの日の副菜・汁もの ----
{
    const {p, ctx} = await open({country: 'TH'}, {}, 's23-unit');
    const u = await p.evaluate(() => {
        const by = id => RECIPES.find(r => r.id === id) || null, f = r => r ? {never: okayuNever(r), soft: okayuSoftOk(r), mild: okayuMildOk(r)} : null;
        return {kung: f(by('th_kungchaenampla')), somtam: f(by('th_somtam')), khaitun: f(by('th_khaitun')), moowan: f(by('th_moowan')), khaotom: RECIPES.filter(r => r.type === '汁物' && /ข้าวต้ม/.test([r.name, ...(r.alt || [])].join(' '))).map(f), yam: RECIPES.filter(r => r.type === '副菜' && /^ยำ/.test((r.alt || [])[1] || '')).map(f)};
    });
    ok(u.kung && u.kung.never && !u.kung.soft && !u.kung.mild, 'S23 กุ้งแช่น้ำปลา（生えび・唐辛子）は、おかゆの日に出さない: ' + JSON.stringify(u.kung));
    ok(u.somtam && u.somtam.never && !u.somtam.soft && !u.somtam.mild, 'S23 ส้มตำ（辛い生のサラダ）は出さない: ' + JSON.stringify(u.somtam));
    ok(u.khaitun && u.khaitun.soft && u.moowan && u.moowan.soft, 'S23 ไข่ตุ๋น・หมูหวาน（パックの印 soft）はやわらかい料理: ' + JSON.stringify([u.khaitun, u.moowan]));
    ok(u.khaotom.length && u.khaotom.every(x => x.never), 'S23 米のスープ（ข้าวต้ม）は、おかゆの日の汁ものにしない: ' + JSON.stringify(u.khaotom));
    ok(u.yam.length >= 3 && u.yam.every(x => !x.soft && !x.mild), 'S23 ยำ（辛い和え物）はやわらかい・ゆるめた候補にも入らない: ' + JSON.stringify(u.yam));
    await ctx.close();
}
{
    const {p, ctx} = await open({country: 'TW'}, {}, 's23-tw');
    const u = await p.evaluate(() => { const by = id => RECIPES.find(r => r.id === id) || null; return {clam: by('tw_xian_xianzai') ? okayuNever(by('tw_xian_xianzai')) : null, okra: by('tw_tang_qiukui') ? okayuSoftOk(by('tw_tang_qiukui')) : null}; });
    ok(u.clam === true, 'S23 鹹蜆仔（生の貝）は出さない: ' + JSON.stringify(u));
    ok(u.okra === true, 'S23 燙秋葵（ゆでたオクラ）はやわらかい料理: ' + JSON.stringify(u));
    await ctx.close();
}
for (const cc of ['TH', 'CN', 'KR', 'VN', 'JP', 'TW', 'PH']){
    const {p, ctx} = await open({country: cc}, {}, 's23-' + cc);
    const on = await p.evaluate(() => okayuMoodOn());
    if (!on){ ok(cc === 'VN', `S23 ${cc} おかゆの日がない国（おかゆ・粥の主菜がない）`); await ctx.close(); continue; }
    await p.evaluate(() => { session.mood = 'okayu'; session.menu = null; ensureMenu(); render(); });
    const bad = [], empty = [], counts = new Set(), seen = {};
    const look = async () => {
        const r = await p.evaluate(() => ({n: document.querySelectorAll('#view .tray .spot').length, soupy: soupyMain(session.menu.items[0].r), its: session.menu.items.map(x => ({slot: x.slot, name: x.r ? x.r.name : null, soft: x.r ? okayuSoftOk(x.r) : null, mild: x.r ? okayuMildOk(x.r) : null, never: x.r ? okayuNever(x.r) : null, spice: x.r ? spiceLevel(x.r) : 0, rawSea: x.r ? (okayuRawish(x.r) || x.r.method === '和え') && okayuSea(x.r) : false}))}));
        counts.add(r.n);
        r.its.slice(1).forEach(x => { if (!x.name){ if (!(x.slot === '汁物' && r.soupy)) empty.push(x.slot); return; }   // 雑炊（汁けの多いご飯）の日の汁ものの席は空ける（第21回 R82）
            seen[x.name] = (seen[x.name] || 0) + 1; if (x.never || x.spice > 0 || x.rawSea || !(x.soft || x.mild)) bad.push(x.slot + ':' + x.name + ':' + JSON.stringify(x)); });
    };
    await look(); await reroll(p, 20, look);
    ok(!bad.length, `S23 ${cc} おかゆの日の副菜・汁もの（最初＋入れ替え20回）に、生の魚介・辛い料理・米のスープ・炒め物はない: ` + JSON.stringify(bad.slice(0, 4)));
    ok(!empty.length, `S23 ${cc} 副菜・汁ものの枠が空にならない: ` + JSON.stringify(empty));
    ok(counts.size === 1, `S23 ${cc} 入れ替えで品数が変わらない: ` + JSON.stringify([...counts]));
    const sw = await p.evaluate(() => { const i = session.menu.items.findIndex(x => x.slot === '副菜'); const cs = i > 0 ? swapCands(i, null) : []; return cs.map(r => ({name: r.name, okk: okayuSoftOk(r) || okayuMildOk(r), never: okayuNever(r)})); });
    ok(sw.every(x => x.okk && !x.never), `S23 ${cc} 副菜の「かえる」の候補もやわらかい料理だけ: ` + JSON.stringify(sw));
    console.log('     ' + cc + ' 出た料理: ' + JSON.stringify(seen));
    await ctx.close();
}

// ---- S6: 仏語の「bœuf（牛肉）」を卵に当てない（卵の行に牛ひき肉が出ていた。アレルギーの判定そのものの直しなので、ここで確かめる） ----
{
    const {p, ctx} = await open({country: 'FR', uiLang: 'fr', allergens: ['egg']}, {}, 's6-fr', 'fr-FR');
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => { const by = nm => RECIPES.find(x => x.name === nm); const h = by('Hachis parmentier'), t = by('Tomates farcies'), bb = by('Bœuf bourguignon');
        // 第24回 R101: 「Chair à saucisse ou bœuf haché」はソーセージの肉（加工肉）なので卵の🔍（袋の表示を確認）が付く。bœuf だけで卵に当たらないことを見る
        const beefEgg = RECIPES.flatMap(r => (algRecipeMap(r).egg || []).filter(x => /b[oœ]uf/i.test(x.name) && !/saucisse/i.test(x.name)).map(x => r.name + ':' + x.name));
        return {LANG, h: h ? {egg: algRecipeMap(h).egg || null, conflict: allergyConflict(h), avoided: isAvoided(h)} : null, t: t ? {egg: (algRecipeMap(t).egg || []).map(x => x.name), conflict: allergyConflict(t)} : null, bb: bb ? allergyConflict(bb) : null, beefEgg,
            unit: ['Bœuf haché', 'Œuf', '2 œufs', "blanc d'œuf", 'oeuf'].map(n => n + '=' + algKind('egg', Object.assign(parseIng(n), {en: n, key: n.toLowerCase()})))}; });
    ok(r.h && !r.h.egg && !r.h.conflict && !r.h.avoided && r.bb === false && !r.beefEgg.length, 'S6 仏語の bœuf（牛肉）の料理が卵に当たらない（Hachis parmentier・Bœuf bourguignon・卵の行に牛肉の名前 0件）: ' + JSON.stringify({h: r.h, bb: r.bb, beefEgg: r.beefEgg}));
    ok(r.t && r.t.conflict && r.t.egg.some(n => /^Œuf/i.test(n)) && !r.t.egg.some(n => /b[oœ]uf/i.test(n) && !/saucisse/i.test(n)) && /Œuf=1/.test(r.unit.join()) && /2 œufs=1/.test(r.unit.join()) && /blanc d'œuf=1/.test(r.unit.join()) && /Bœuf haché=(0|null|undefined|false)/.test(r.unit.join()), 'S6 Œuf・œufs・blanc d\'œuf は卵に当たる（Tomates farcies は卵の料理のまま）: ' + JSON.stringify({t: r.t, unit: r.unit}));
    await ctx.close();
}

// ---- S1: 主食のトーストとアレルギー ----
for (const alg of ['wheat', 'milk', 'egg']){
    const {p, ctx} = await open({allergens: [alg], stapleBy: {JP: 'toast'}}, {}, 's1-' + alg);
    const r = await p.evaluate(() => ({spot: stapleSpot(), note: stapleBlockedNote(), line: algLine(), tray: (document.querySelector('#view .tray') || {}).textContent || '', view: (document.querySelector('#view') || {}).textContent || ''}));
    ok(!r.spot && !/トースト/.test(r.tray) && /主食の「パン（トースト）」/.test(r.note) && /入れていません|使う料理が/.test(r.line), `S1 ${alg} のアレルギーでトーストはお膳に出ず、出していない知らせがある: ` + JSON.stringify({spot: r.spot, note: r.note.slice(0, 30), line: r.line.slice(0, 30)}));
    await ctx.close();
}

// ---- B1: 20分以内・ラクの日が副菜・汁ものにも効く ----
for (const mood of ['quick', 'easy']){
    const {p, ctx} = await open({}, {}, 'b1-' + mood);
    const out = await p.evaluate(mood => { session.mood = mood; const out = []; for (let i = 0; i < 20; i++){ newMenu(); session.menu.items.forEach(x => { if (x.r && !slotMoodOk(x.r, x.slot)) out.push(x.slot + ':' + x.r.name + ':' + x.r.min); }); } return out; }, mood);
    ok(!out.length, `B1 ${mood} の20回の献立で、副菜・汁ものも条件に合う: ` + JSON.stringify(out.slice(0, 5)));
    await ctx.close();
}

// ---- B2: 季節外れの行事料理 ----
{
    const {p, ctx} = await open({}, {}, 'b2');
    const r = await p.evaluate(() => { const out = []; const ids = Object.keys(SEASON_MONTHS), mon = Number(TODAY.slice(5, 7)), off = ids.filter(id => !SEASON_MONTHS[id].includes(mon)); for (let i = 0; i < 60; i++){ newMenu(); session.menu.items.forEach(x => { if (x.r && off.includes(x.r.id)) out.push(x.r.name); }); } makeWeek(); const w = S.week.days.filter(x => off.includes(x.id)).map(x => x.id); return {off, out, w, inData: ids.filter(id => RECIPES.some(r => r.id === id))}; });
    ok(r.inData.length === 4, 'B2 行事・季節の料理（お雑煮・七草がゆ・冷やし中華・そうめん）がデータにある: ' + JSON.stringify(r.inData));
    ok(!r.out.length && !r.w.length, 'B2 その月でない行事料理は、60回の献立と1週間プランに出ない（今月の外: ' + r.off.join('・') + '）: ' + JSON.stringify({out: r.out, w: r.w}));
    await ctx.close();
}

// ---- B3: 汁けの多い主菜の日は汁ものなし ----
{
    const {p, ctx} = await open({}, {}, 'b3');
    const r = await p.evaluate(() => { const out = [], n = []; for (let i = 0; i < 80; i++){ newMenu(); const m = session.menu.items[0].r; if (soupyMain(m)){ n.push(m.name); const s = session.menu.items.find(x => x.slot === '汁物'); if (s && s.r) out.push(m.name + ' + ' + s.r.name); } } return {n, out}; });
    ok(!r.out.length, 'B3 麺・鍋の主菜（80回中 ' + r.n.length + '回）に汁ものが付かない: ' + JSON.stringify(r.out));
    await ctx.close();
}

// ---- B8: 華氏・同じ料理・韓越の卵の個数 ----
{
    const {p, ctx} = await open({country: 'US'}, {}, 'b8-us');
    const r = await p.evaluate(() => { const fs = [160, 170, 180, 190, 200, 210, 220, 230].map(c => fOf(c)); const dup = []; for (let i = 0; i < 60; i++){ newMenu(); const ids = session.menu.items.map(x => x.r && x.r.id).filter(Boolean); if (new Set(ids).size !== ids.length) dup.push(ids.join()); } return {fs, dup, w: withF('Bake at 200°C for 20 min', RECIPES[0])}; });
    ok(r.fs.every(f => f % 25 === 0) && /200°C \(400°F\)/.test(r.w), 'B8 オーブンの華氏はダイヤルの目盛り（25°F きざみ）: ' + JSON.stringify(r.fs) + ' ' + r.w);
    ok(!r.dup.length, 'B8 同じ料理が1つの献立に2つ入らない（60回）: ' + JSON.stringify(r.dup));
    await ctx.close();
}
{
    const {p, ctx} = await open({country: 'VN', servings: 4, uiLang: 'vi'}, {}, 'b8-vn', 'vi-VN');
    const r = await p.evaluate(() => ({a: scaleSteps('Đập vào 3 quả trứng và đánh tan.', 2, ['Trứng gà']).s, b: scaleSteps('Đập vào 3 quả trứng và đánh tan.', 2, ['Thịt']).s, c: scaleSteps('달걀 2개를 풀어 둔다.', 2, ['달걀']).s, d: scaleSteps('달걀 1개씩 올린다.', 2, ['달걀']).s}));
    ok(r.a === 'Đập vào 6 quả trứng và đánh tan.' && r.b === 'Đập vào 3 quả trứng và đánh tan.' && r.c === '달걀 4개를 풀어 둔다.' && r.d === '달걀 1개씩 올린다.', 'B8 韓国語・ベトナム語の作り方の卵の個数も人数に合わせる（材料に卵があるときだけ。「1個ずつ」はそのまま）: ' + JSON.stringify(r));
    await ctx.close();
}

// ---- R12: おまかせの品数の日に、まるごと入れ替えで席の数が変わらない ----
{
    const {p, ctx} = await open({dishCount: 'auto'}, {}, 'r12');
    const ns = new Set();
    const look = () => p.evaluate(() => document.querySelectorAll('#view .tray .spot').length).then(n => ns.add(n));
    await look(); await reroll(p, 20, look);
    ok(ns.size === 1, 'R12 おまかせの品数で、まるごと入れ替え20回でお膳の席の数が変わらない: ' + JSON.stringify([...ns]));
    await ctx.close();
}

// ---- R55（第18回）: おかゆの日の副菜・汁ものの顔ぶれ。やわらかい料理（soft）が各国で副菜6品・汁もの3品以上。えび・かに・魚のアレルギーの韓国でも汁ものの席が空かない ----
for (const cc of ['JP', 'TW', 'CN', 'KR', 'TH', 'PH']){
    const {p, ctx} = await open({country: cc}, {}, 'r55-' + cc);
    const n = await p.evaluate(() => { session.mood = 'okayu'; const f = slot => poolFor(slot).filter(r => slotOf(r) === slot && !isAvoided(r)).filter(okayuSoftOk).length; return {side: f('副菜'), soup: f('汁物')}; });
    ok(n.side >= 6 && n.soup >= 3, `R55 ${cc} おかゆの日のやわらかい副菜が6品以上・汁ものが3品以上: ` + JSON.stringify(n));
    await ctx.close();
}
{
    const {p, ctx} = await open({country: 'KR', uiLang: 'ko', allergens: ['shellfish', 'crab', 'fish']}, {}, 'r55-kr-alg', 'ko-KR');
    await p.evaluate(() => { session.mood = 'okayu'; session.menu = null; ensureMenu(); render(); });
    const empty = [], bad = [];
    const look = async () => { const r = await p.evaluate(() => session.menu.items.map(x => ({slot: x.slot, id: x.r ? x.r.id : null, okk: x.r ? okayuSoftOk(x.r) || okayuMildOk(x.r) : null, av: x.r ? isAvoided(x.r) : null}))); r.slice(1).forEach(x => { if (!x.id) empty.push(x.slot); else if (!x.okk || x.av) bad.push(x); }); };
    await look(); await reroll(p, 10, look);
    const txt = await p.evaluate(() => document.querySelector('#view').textContent);
    ok(!empty.length && !bad.length, 'R55 韓国・えび・かに・魚のアレルギー: おかゆの日の汁もの・副菜の席が空かず、やわらかい料理だけ（最初＋入れ替え10回）: ' + JSON.stringify({empty, bad}));
    ok(!/국은 넣지 않았어요/.test(txt), 'R55 「국은 넣지 않았어요（汁ものは入れていません）」が出ない');
    await ctx.close();
}
// ---- R56（第18回）: タイで本人の卵・魚アレルギーでも「おかゆの日」が出る（ナンプラー・卵を使わない鶏のジョーク）。主菜が全部止まる条件では、気分の一覧に理由の一言 ----
for (const alg of [['egg'], ['fish'], ['egg', 'fish']]){
    const {p, ctx} = await open({country: 'TH', uiLang: 'th', allergens: alg}, {}, 'r56-' + alg.join('-'), 'th-TH');
    const u = await p.evaluate(() => { const on = okayuMoodOn(); session.mood = 'okayu'; session.menu = null; ensureMenu(); render(); const m = session.menu.items[0].r; return {on, main: m ? m.id : null, okk: m ? okayuDayOk(m) && !isAvoided(m) : false, rest: session.menu.items.slice(1).map(x => x.r ? {id: x.r.id, av: isAvoided(x.r), okk: okayuSoftOk(x.r) || okayuMildOk(x.r)} : null)}; });
    ok(u.on && u.main === 'th_jokgai' && u.okk, `R56 タイ・${alg.join('・')}のアレルギー: おかゆの日が出て、主菜は โจ๊กไก่: ` + JSON.stringify(u));
    ok(u.rest.every(x => !x || (!x.av && x.okk)), `R56 タイ・${alg.join('・')}のアレルギー: 副菜・汁ものにアレルギーの料理がない: ` + JSON.stringify(u.rest));
    await p.evaluate(() => { session.mood = 'all'; session.menu = null; ensureMenu(); render(); });
    await p.click('[data-act=cond-open]'); await p.waitForTimeout(300);
    const c = await p.evaluate(() => ({chip: !!document.querySelector('#sheet-root .chip[data-v="okayu"], #sheet-root [data-mood="okayu"], #sheet-root [data-act="mood"][data-v="okayu"]'), note: !!document.querySelector('#sheet-root .cond-okayu-none'), txt: document.querySelector('#sheet-root').textContent}));
    ok(/วันกินโจ๊ก/.test(c.txt) && !c.note, `R56 タイ・${alg.join('・')}: 条件の画面に「วันกินโจ๊ก」の札があり、理由の一言は出ない: ` + JSON.stringify({chip: c.chip, note: c.note}));
    await ctx.close();
}
{
    const {p, ctx} = await open({country: 'TH', uiLang: 'th', allergens: ['fish', 'chicken']}, {}, 'r56-none', 'th-TH');
    await p.click('[data-act=cond-open]'); await p.waitForTimeout(300);
    const c = await p.evaluate(() => ({on: okayuMoodOn(), gone: okayuMoodGone(), note: (document.querySelector('#sheet-root .cond-okayu-none') || {}).textContent || null, txt: document.querySelector('#sheet-root').textContent}));
    ok(!c.on && c.gone && c.note && /ไม่มีเมนูหลักสำหรับวันกินโจ๊ก/.test(c.note), 'R56 タイ・魚・鶏肉のアレルギー（粥の主菜が全部止まる）: 気分の一覧に理由の一言「ตามเงื่อนไขนี้ ไม่มีเมนูหลักสำหรับวันกินโจ๊ก」: ' + JSON.stringify({on: c.on, gone: c.gone, note: c.note}));
    await ctx.close();
}
{
    const {p, ctx} = await open({}, {}, 'r56-jp');
    const c = await p.evaluate(() => ({on: okayuMoodOn(), gone: okayuMoodGone()}));
    ok(c.on && !c.gone, 'R56 日本（アレルギーなし）: おかゆの日は出て、理由の一言は出ない: ' + JSON.stringify(c));
    await ctx.close();
}
// ---- R61（第19回）: タイ・フィリピンで本人の魚／卵／卵＋魚のアレルギーがあっても、おかゆの日の汁ものの席が埋まり（20回で18回以上）、副菜が5品以上。魚醤（ナンプラー・パティス・バゴオン）・卵・魚介・辛い料理は出ない ----
const FISH_SAUCE_RE = /fish sauce|patis|bagoong|nam ?pla|น้ำปลา|กะปิ|shrimp paste/i;
for (const [cc, ul, loc] of [['TH', 'th', 'th-TH'], ['PH', 'fil', 'fil-PH']]){
    for (const alg of [['fish'], ['egg'], ['egg', 'fish']]){
        const {p, ctx} = await open({country: cc, uiLang: ul, allergens: alg}, {}, 'r61-' + cc + '-' + alg.join('-'), loc);
        await p.evaluate(() => { session.mood = 'okayu'; session.menu = null; ensureMenu(); render(); });
        let soup = 0, n = 0; const sides = new Set(), soups = new Set(), bad = [];
        const look = async () => {
            n++;
            const r = await p.evaluate(() => session.menu.items.map(x => ({slot: x.slot, id: x.r ? x.r.id : null, av: x.r ? isAvoided(x.r) : null, okk: x.r ? okayuSoftOk(x.r) || okayuMildOk(x.r) : null, spice: x.r ? spiceLevel(x.r) : 0, seas: x.r ? String(x.r.seasBase || x.r.seas || '') : '', ings: x.r ? (x.r.ings || []).join('|') : ''})));
            for (const x of r){
                if (x.slot === '汁物' && x.id){ soup++; soups.add(x.id); }
                if (x.slot === '副菜' && x.id) sides.add(x.id);
                if (x.id && (x.av || x.spice > 0 || (alg.includes('fish') && (FISH_SAUCE_RE.test(x.seas) || FISH_SAUCE_RE.test(x.ings))) || (x.slot !== '主菜' && !x.okk))) bad.push({slot: x.slot, id: x.id, av: x.av, spice: x.spice, okk: x.okk});
            }
        };
        await look();
        await reroll(p, 19, look);
        const tag = `R61 ${cc}・本人の${alg.join('・')}のアレルギー`;
        ok(n === 20 && soup >= 18, `${tag}: おかゆの日の汁ものの席が20回中18回以上埋まる: ${soup}/${n} ` + JSON.stringify([...soups]));
        ok(sides.size >= 5, `${tag}: おかゆの日の副菜が20回で5品以上: ${sides.size} ` + JSON.stringify([...sides]));
        ok(!bad.length, `${tag}: アレルギーの料理・辛い料理・やわらかくない料理（魚のアレルギーでは魚醤も）が出ない: ` + JSON.stringify(bad.slice(0, 5)));
        await ctx.close();
    }
}
// R61: フィリピン語・英語の画面で Arroz caldo の日も汁ものの席が埋まる（"caldo" を汁けの多い主菜と見ていた。粥は汁ものと重ならない）
{
    const {p, ctx} = await open({country: 'PH', uiLang: 'fil'}, {}, 'r61-ph-fil', 'fil-PH');
    const u = await p.evaluate(() => { const by = id => RECIPES.find(r => r.id === id) || null; return {arroz: by('ph_arroz_caldo') ? {name: by('ph_arroz_caldo').name, soupy: soupyMain(by('ph_arroz_caldo'))} : null, re: {arroz: SOUPY_RE.test('Arroz caldo'), caldo: SOUPY_RE.test('Caldo de pollo'), caldoVerde: SOUPY_RE.test('Caldo verde')}}; });
    ok(u.arroz && !u.arroz.soupy && !u.re.arroz && u.re.caldo && u.re.caldoVerde, 'R61 Arroz caldo は汁けの多い主菜ではない（Caldo de pollo・Caldo verde は今までどおり汁けの多い主菜）: ' + JSON.stringify(u));
    await p.evaluate(() => { session.mood = 'okayu'; session.menu = null; ensureMenu(); render(); });
    let soup = 0, n = 0; const mains = new Set(); let arrozDays = 0, arrozSoup = 0;
    const look = async () => { n++; const r = await p.evaluate(() => ({main: session.menu.items[0].r ? session.menu.items[0].r.id : null, soup: session.menu.items.some(x => x.slot === '汁物' && x.r)})); if (r.main) mains.add(r.main); if (r.soup) soup++; if (r.main === 'ph_arroz_caldo'){ arrozDays++; if (r.soup) arrozSoup++; } };
    await look(); await reroll(p, 19, look);
    ok(n === 20 && soup === 20 && arrozDays > 0 && arrozSoup === arrozDays, `R61 フィリピン語の画面・おかゆの日: Arroz caldo の日（${arrozDays}回）も汁ものの席が埋まる: 汁もの ${soup}/${n}, Arroz caldo の日の汁もの ${arrozSoup}/${arrozDays} ` + JSON.stringify([...mains]));
    await ctx.close();
}
// R61: おかゆの日のある6か国（アレルギーなし）は、汁ものの席が20回とも埋まり、副菜・汁ものの顔ぶれが減っていない（第19回の数: 副菜6品以上・汁もの3品以上）
for (const cc of ['JP', 'TW', 'CN', 'KR', 'TH', 'PH']){
    const {p, ctx} = await open({country: cc}, {}, 'r61-base-' + cc);
    await p.evaluate(() => { session.mood = 'okayu'; session.menu = null; ensureMenu(); render(); });
    let soup = 0, n = 0, soupy = 0; const sides = new Set(), soups = new Set();   // 第21回 R82: 雑炊（汁けの多いご飯）の日は汁ものを付けない。その日は数えない
    const look = async () => { const r = await p.evaluate(() => session.menu.items.map((x, i) => ({slot: x.slot, id: x.r ? x.r.id : null, soupy: i === 0 && soupyMain(x.r)}))); if (r[0].soupy){ soupy++; r.forEach(x => { if (x.slot === '副菜' && x.id) sides.add(x.id); }); return; } n++; for (const x of r){ if (x.slot === '汁物' && x.id){ soup++; soups.add(x.id); } if (x.slot === '副菜' && x.id) sides.add(x.id); } };
    await look(); await reroll(p, 19, look);
    ok(n + soupy === 20 && n >= 10 && soup === n && sides.size >= 6 && soups.size >= 3, `R61 ${cc}（アレルギーなし）: おかゆの日の汁ものの席が（雑炊の日 ${soupy}回を除いて）全部埋まり、副菜6品以上・汁もの3品以上: 汁もの ${soup}/${n}, 副菜 ${sides.size}品, 汁もの ${soups.size}品`);
    await ctx.close();
}
// ---- R8（第18回の残り）: 決めたあとの作り方のタブの「家族に送る」も、決める前と同じ3段（料理名だけ／買う物も／作り方も） ----
{
    const {p, ctx} = await open({}, {}, 'r8-cook');
    await p.click('button[data-act=decide]'); await p.waitForTimeout(400);
    await p.evaluate(() => { setTab('cook'); render(); });
    await p.waitForTimeout(200);
    await p.click('#view [data-act=share-cook]'); await p.waitForTimeout(300);
    const u = await p.evaluate(() => ({card: sheet && sheet.card, src: sheet && sheet.src, lv: sheet && sheet.lv, chips: [...document.querySelectorAll('#sheet-root .share-lv .chip')].map(e => e.textContent), text: document.querySelector('#share-text').value, same: document.querySelector('#share-text').value === todayShare3Text(2, 'cook'), img: !!document.querySelector('#sheet-root [data-act=share-card][data-k="cook"]'), dishes: cookItems().map(x => x.r.name)}));
    ok(u.card === 'today3' && u.src === 'cook' && u.lv === 2 && u.chips.length === 3 && /料理名だけ/.test(u.chips[0]) && /買う物も/.test(u.chips[1]) && /作り方も/.test(u.chips[2]), 'R8 決めたあとの「家族に送る」（作り方のタブ）も3段（料理名だけ／買う物も／作り方も）: ' + JSON.stringify(u.chips));
    ok(u.same && /【買う物】/.test(u.text) && u.dishes.every(d => u.text.includes(d)) && u.img, 'R8 はじめは「買う物も」。決めた献立の料理名と買う物が入り、「画像でつくる」も残る: ' + u.text.slice(0, 120).replace(/\n/g, '/'));
    await p.click('#sheet-root .share-lv .chip[data-v="3"]'); await p.waitForTimeout(200);
    const t3 = await p.evaluate(() => ({src: sheet.src, text: document.querySelector('#share-text').value}));
    ok(t3.src === 'cook' && /――――/.test(t3.text) && (t3.text.match(/― わが家のご飯帖/g) || []).length === 1, 'R8 「作り方も」で作り方が付き（決めた献立のまま）、署名は最後に1回: ' + t3.text.length);
    await ctx.close();
}

await b.close();
if (errs.length){ console.log('page errors:', errs.slice(0, 5)); fails++; }
console.log(`${fails ? 'FAIL' : 'PASS'}: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
