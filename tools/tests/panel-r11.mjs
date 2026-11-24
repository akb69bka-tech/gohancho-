#!/usr/bin/env node
// 利用者モニター第11回の直し（献立・安全の周辺）。Playwright。使い方: node tools/tests/panel-r11.mjs [http://localhost:8999/]
//  S24 福神漬け・らっきょう漬けは市販品。今の判定（当たれば出さない）はそのままに、選んだアレルゲン（本人・家族）には「🔍 袋の表示を確認」を付ける。
//      お膳の下の一言でも言い切らない。買い物メモにも1行で出し、同じ🔍を付ける
//  R32 苦手に「福神漬け」「らっきょう漬け」と名前で入れても当てる（材料の大根・らっきょうだけを見ていた）
//  R29 用意した絵（img/dish/fukujinzuke.svg・rakkyo.svg）が、しま模様の背景で隠れない
//  R30 7品の日の ご飯もの・麺の主菜も7席。鍋・おでんなどの主菜の日も、料理が品数どおり（空いた汁ものの席を出さない）
//  R31 おなかにたまる副菜（いも・かぼちゃ・マカロニ）は1献立に1つまで。2品目の主菜に ご飯もの・麺を重ねない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (settings, tag, extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r11', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(([st, ex]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 6, servings: 3}, st)}, ex))); } }, [settings, extra]);
    await p.goto(URL_); await ready(p);
    return {p, ctx};
};
// カレーの日になるまで作り直して、香の物の席と🔍を見る
const curryDay = p => p.evaluate(() => {
    for (let k = 0; k < 800; k++){ session.rejected.clear(); newMenu(); if (CURRY_RICE.has(session.menu.items[0].r.id)) break; }
    render();
    const main = session.menu.items[0].r, side = riceSideOf(main, session.menu.n), el = document.querySelector('.spot.tsuke');
    return {main: main.id, side: side && side !== 'konomono' ? side.id : side, tag: el ? (el.querySelector('.alg-tag.may') || {}).textContent || '' : '', warn: el ? !!el.querySelector('.alg-tag:not(.may)') : false, line: eatersLine(), seats: menuSeats(session.menu), spots: document.querySelectorAll('.tray .spot').length};
});

// S24 ごま（本人）・大豆（本人）・家族のごま: 福神漬け／らっきょう漬けに🔍。判定は今までどおり（大豆なら らっきょう漬け）
{
    const cases = [
        [{allergens: ['sesame']}, {}, 'fukujinzuke', /ごま（福神漬けの袋の表示を確認）/],
        [{allergens: ['soy']}, {}, 'rakkyo', /大豆（らっきょう漬けの袋の表示を確認）/],
        [{allergens: ['wheat', 'milk']}, {}, null, null],   // 小麦: カレーの日そのものが出ない（ここでは見つからなくてよい）
        [{}, {family: [{id: 'f1', name: '太郎', allergy: ['ごま'], avoid: ['ごま']}]}, 'fukujinzuke', /袋の表示を確認/],
    ];
    for (const [st, ex, want, re] of cases){
        const {p, ctx} = await open(st, 's24' + JSON.stringify(st) + JSON.stringify(ex), ex);
        const r = await curryDay(p);
        if (want === null) ok(!CURRY(r.main) || r.side !== 'fukujinzuke', 'S24 小麦の日は福神漬けを出さない（判定は弱めない）: ' + JSON.stringify(r));
        else {
            ok(r.side === want, 'S24 判定は今までどおり（' + JSON.stringify(st) + ' → ' + want + '）: ' + JSON.stringify(r));
            ok(re.test(r.tag) && !r.warn, 'S24 香の物の席に「🔍 袋の表示を確認」（' + JSON.stringify(st) + JSON.stringify(ex) + '）: ' + JSON.stringify(r));
            ok(/袋の表示を確かめてください/.test(r.line) && !/食べられるお膳です/.test(r.line), 'S24 お膳の下の一言でも言い切らない: ' + JSON.stringify(r.line));
        }
        await ctx.close();
    }
    // アレルギーの設定がない日は🔍を出さない（今までどおり）
    const {p, ctx} = await open({}, 's24none'); const r = await curryDay(p);
    ok(r.side === 'fukujinzuke' && !r.tag, 'S24 アレルギーなしの日は🔍なし: ' + JSON.stringify(r));
    await ctx.close();
}
function CURRY(id){ return ['curry', 'hayashi', 'drycurry'].includes(id); }
// S24・R32 買い物メモ: カレーの日は福神漬けの行。アレルギーの日は🔍、苦手に入れた日は らっきょう漬け
{
    for (const [st, want, mayRe] of [[{}, '福神漬け', null], [{allergens: ['sesame']}, '福神漬け', /ごま/], [{avoid: ['福神漬け']}, 'らっきょう漬け', null]]){
        const {p, ctx} = await open(st, 'shop' + JSON.stringify(st));
        const r = await p.evaluate(() => {
            S.week = {start: TODAY, days: [{d: TODAY, id: 'curry'}, {d: addDays(TODAY, 1), id: 'nikujaga'}]}; save(); setTab('shop'); render();
            const rows = shoppingList(), row = rows.find(e => /福神漬け|らっきょう漬け/.test(e.label));
            const html = shoppingHtml();
            return {row: row ? {label: row.label, may: row.may || [], dishes: row.dishes} : null, html: /福神漬け|らっきょう漬け/.test(html), hint: shopMayList()};
        });
        ok(r.row && r.row.label === want && r.row.dishes.includes('カレーライス') && r.html, 'S24 買い物メモに「' + want + '」（カレーライスの付け合わせ）: ' + JSON.stringify(r));
        if (mayRe) ok(r.row && r.row.may.includes('sesame') && r.hint.some(x => /福神漬け/.test(x)), 'S24 買い物メモの行にも🔍（袋の表示を確認）: ' + JSON.stringify(r));
        else ok(r.row && !r.row.may.length, 'S24 アレルギーなしの日は買い物メモにも🔍なし: ' + JSON.stringify(r));
        await ctx.close();
    }
}
// R32 苦手に名前で入れる
{
    for (const [av, want] of [[['福神漬け'], 'rakkyo'], [['らっきょう漬け'], 'fukujinzuke'], [['らっきょう'], 'fukujinzuke'], [['福神漬け', 'らっきょう漬け'], null]]){
        const {p, ctx} = await open({avoid: av}, 'r32' + av.join());
        const r = await curryDay(p);
        ok(r.side === want && r.seats === 6 && r.spots === 6, 'R32 苦手「' + av.join('・') + '」→ ' + (want || '香の物なし（副菜を足して6席）') + ': ' + JSON.stringify(r));
        await ctx.close();
    }
}
// R29 絵が背景で隠れない
{
    for (const [st, id] of [[{}, 'fukujinzuke'], [{allergens: ['soy']}, 'rakkyo']]){
        const {p, ctx} = await open(st, 'r29' + id);
        await curryDay(p);
        await p.waitForFunction(id => { const e = document.querySelector('.spot.tsuke .food'); return e && e.classList.contains('photo') && !e.closest('.vessel.pload'); }, id, {timeout: 15000}).catch(() => {});
        const r = await p.evaluate(() => { const e = document.querySelector('.spot.tsuke .food'); const cs = getComputedStyle(e); return {cls: e.className, img: cs.backgroundImage}; });
        ok(r.cls.includes('photo') && r.img.includes('img/dish/' + id + '.svg') && !/gradient/.test(r.img), 'R29 ' + id + ' の絵がそのまま見える（しま模様で隠れない）: ' + JSON.stringify(r));
        await ctx.close();
    }
}
// R30・R31 品数どおりの席・副菜の重なり・2品目の主菜
{
    for (const dc of [4, 5, 6, 7]){
        const {p, ctx} = await open({dishCount: dc}, 'r30-' + dc);
        const r = await p.evaluate(dc => {
            const out = {n: 0, seat: [], food: [], starch: [], mains: []}, carb = r => r.type === 'ごはん' || r.type === '麺';
            for (let k = 0; k < 250; k++){
                if (k % 50 === 0) session.rejected.clear();
                menuIds().forEach(id => session.rejected.add(id)); newMenu(); render();
                const m = session.menu, main = m.items[0].r; out.n++;
                const spots = document.querySelectorAll('.tray .spot').length, seats = menuSeats(m);
                if (seats !== dc || spots !== dc) out.seat.push(main.name + ':' + seats + '/' + spots);
                if (nabeMain(main) && m.items.filter(x => x.r).length + (stapleSpot() ? 1 : 0) !== dc) out.food.push(main.name);
                const sides = m.items.filter(x => x.slot === '副菜' && x.r).map(x => x.r);
                if (sides.filter(starchySide).length >= 2) out.starch.push(main.name + '＋' + sides.map(x => x.name).join('・'));
                const ms = m.items.filter(x => x.slot === '主菜' && x.r).map(x => x.r);
                if (ms.length === 2 && ((carb(ms[0]) && carb(ms[1])) || tooSimilar(ms[0], ms[1]))) out.mains.push(ms.map(x => x.name).join('＋'));
            }
            return out;
        }, dc);
        ok(!r.seat.length, 'R30 ' + dc + '品の日は' + dc + '席（ご飯もの・麺の主菜も）: ' + r.seat.slice(0, 5).join(' / '));
        ok(!r.food.length, 'R30 ' + dc + '品の 鍋・おでんの日も料理が品数どおり: ' + r.food.slice(0, 5).join(' / '));
        ok(!r.starch.length, 'R31 ' + dc + '品の日、いも・かぼちゃ・マカロニの副菜は1つまで: ' + r.starch.slice(0, 3).join(' / '));
        ok(!r.mains.length, 'R31 ' + dc + '品の日、2品目の主菜に ご飯もの・麺を重ねない: ' + r.mains.slice(0, 3).join(' / '));
        await ctx.close();
    }
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
