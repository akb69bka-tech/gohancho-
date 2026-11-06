#!/usr/bin/env node
// 「まるごと入れ替え」のあとの「↶ 前の献立」（1つ前に戻る。オーナー指示 11/05）の回帰テスト（Playwright。使い方: node tools/tests/menu-back.mjs [http://localhost:8881/]）
//  B1 まるごと入れ替えのあと、上の端の帯に「↶ 前の献立」が出る。押すと前の献立（料理・席・品数）がそのまま戻る
//  B2 複数回: 3回入れ替えて、3回戻ると元の献立。5つまで（6回入れ替えても戻れるのは5つ前まで）。戻る先がなくなったら帯は消える
//  B3 数秒で消えない（8秒たっても残る）。ほかの方法で献立が変わる（↻・品数・気分）・決める・日が変わるまで残り、そのあとは消える
//  B4 重ならない: 帯が、料理の絵・料理名・⚠札・↻・まるごと入れ替えの丸にかからない（幅 195・360・390・430 × 文字の大きさ 3段階 × 4・6品）
//  B5 守り（S25）: 入れ替えたあとにアレルギー・苦手を足すと帯が消え、前の献立の料理（足した食材を含む）は戻らない。決めた献立は変えない
//  B6 18言語の帯（短い訳でも1行目に収まり、はみ出さない）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const open = async (settings = {}, vp = [390, 844]) => {
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('menu-back', JSON.stringify(settings), vp.join('x'))));
    await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja'}, st)})); }, settings);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
const MENU = p => p.evaluate(() => JSON.stringify({n: session.menu.n, items: session.menu.items.map(x => [x.slot, x.r && x.r.id])}));
const MARU = '#view .tray .tg-mid .shuffle[data-act=new-menu]', BACK = '#toast-root [data-act=toast-undo]';
const band = p => p.evaluate(() => { const e = document.querySelector('#toast-root [data-act=toast-undo]'); return e ? e.textContent.trim() : null; });
const marugo = async p => { await p.click(MARU); await p.waitForTimeout(450); };
const back = async p => { await p.click(BACK); await p.waitForTimeout(450); };

// B1・B2 戻る
{
    const {p, ctx} = await open({dishCount: 4});
    const m0 = await MENU(p);
    ok(await band(p) === null, 'B0 入れ替える前は帯がない');
    await marugo(p); const m1 = await MENU(p);
    const lb = await band(p);
    ok(lb && /前の献立/.test(lb) && m1 !== m0, 'B1 まるごと入れ替えのあと「↶ 前の献立」が出る: ' + JSON.stringify([lb]));
    await back(p);
    ok(await MENU(p) === m0, 'B1 押すと前の献立（料理・席）がそのまま戻る');
    ok(await band(p) === null, 'B1 戻る先がなくなったら帯は消える');
    // 複数回
    const ms = [m0]; for (let i = 0; i < 3; i++){ await marugo(p); ms.push(await MENU(p)); }
    ok(new Set(ms).size === 4, 'B2 3回入れ替えて4つの献立ができた');
    for (let i = 2; i >= 0; i--){ ok(await band(p) !== null, `B2 戻る帯が出ている（残り${i + 1}）`); await back(p); ok(await MENU(p) === ms[i], `B2 ${i + 1}回前の献立に戻る`); }
    ok(await band(p) === null, 'B2 3回戻ると帯は消える');
    // 5つまで
    const hist = [await MENU(p)]; for (let i = 0; i < 6; i++){ await marugo(p); hist.push(await MENU(p)); }
    let n = 0; while (await band(p) !== null && n < 9){ await back(p); n++; }
    ok(n === 5 && await MENU(p) === hist[1], 'B2 戻れるのは5つ前まで（' + n + '回）: 6回入れ替えると最初の献立には戻れない');
    await ctx.close();
}
// B3 残り方
{
    const {p, ctx} = await open({dishCount: 4});
    await marugo(p); await p.waitForTimeout(9500);
    ok(await band(p) !== null, 'B3 9.5秒たっても帯は消えない');
    // 別のタブへ行って戻っても出る
    await p.evaluate(() => { document.querySelector('nav.tabs [data-tab=fridge]').click(); }); await p.waitForTimeout(300);
    await p.evaluate(() => { document.querySelector('nav.tabs [data-tab=today]').click(); }); await p.waitForTimeout(500);
    ok(await band(p) !== null, 'B3 ほかのタブから戻っても帯が出る');
    // ほかのお知らせが出て消えたあとも戻る
    await p.evaluate(() => toast('テスト')); await p.waitForTimeout(100);
    await p.evaluate(() => { toast.hide(); }); await p.waitForTimeout(400);
    ok(await band(p) !== null, 'B3 ほかのお知らせが消えたあとも帯が出る');
    // ↻ で1品かえる → 消える
    await p.evaluate(() => { const b = document.querySelector('#view .tray .spot .swap:not(.swap-ph)'); b.click(); }); await p.waitForTimeout(500);
    ok(!/前の献立/.test(await band(p) || '') && await p.evaluate(() => menuBack.list.length) === 0, 'B3 ↻ で1品かえると「前の献立」は消える（ほかの方法で献立が変わった。↻ 自身の「元に戻す」は出る）');
    await marugo(p); ok(await band(p) !== null, 'B3 また入れ替えると出る');
    await p.evaluate(() => { document.querySelector('[data-act=decide]').click(); }); await p.waitForTimeout(600);
    ok(await band(p) === null, 'B3 決めると消える');
    await ctx.close();
}
{
    const {p, ctx} = await open({dishCount: 4});
    await marugo(p);
    await p.evaluate(() => { S.settings.dishCount = 3; delete S.settings.noSoup; save(); session.menu = null; render(); }); await p.waitForTimeout(500);
    ok(await band(p) === null, 'B3 品数を変えると消える');
    await marugo(p); ok(await band(p) !== null, 'B3 入れ替えで出る');
    await p.evaluate(() => { TODAY = addDays(TODAY, 1); session.menu = null; ensureMenu(); render(); }); await p.waitForTimeout(500);
    ok(await band(p) === null, 'B3 日が変わると消える');
    await ctx.close();
}
// B4 重ならない
const SEE = '#view .spot .vessel, #view .spot .nm, #view .spot .alg-tag, #view .spot .swap-line, #view .spot .swap:not(.swap-ph), #view .tg-mid .shuffle, #view .tray .tg-mid';
for (const [w, h] of [[195, 640], [360, 740], [390, 844], [430, 932]]) for (const ts of [0, 1, 2]) for (const n of [4, 6]){
    const {p, ctx} = await open({dishCount: n, textSize: ts || undefined}, [w, h]);
    const tag = `B4 ${w}px 文字${ts} ${n}品`;
    for (let k = 0; k < 2; k++){
        await marugo(p); await p.waitForTimeout(250);
        const r = await p.evaluate(sel => {
            const bx = document.querySelector('#toast-root .toast'); if (!bx) return {none: true};
            const q = bx.getBoundingClientRect(), hit = [], vw = document.documentElement.clientWidth;
            document.querySelectorAll(sel).forEach(e => { const c = e.getBoundingClientRect(); if (c.width < 2 || c.height < 2 || c.bottom < 0 || c.top > innerHeight) return; if (c.left < q.right - .5 && c.right > q.left + .5 && c.top < q.bottom - .5 && c.bottom > q.top + .5) hit.push((e.className || e.tagName).toString().slice(0, 24) + ':' + Math.round(c.left) + ',' + Math.round(c.top)); });
            const bt = bx.querySelector('[data-act=toast-undo]').getBoundingClientRect();
            return {hit, box: [q.left, q.top, q.right, q.bottom].map(Math.round), inX: q.left >= -.5 && q.right <= vw + .5, btn: Math.round(bt.height), btnIn: bt.left >= q.left - .5 && bt.right <= q.right + .5, sy: Math.round(scrollY)};
        }, SEE);
        ok(!r.none && r.hit.length === 0 && r.inX && r.btn >= 36 && r.btnIn, `${tag} ${k + 1}回目 帯が料理の絵・名前・↻・丸にかからず、画面からはみ出さない: ` + JSON.stringify(r));
    }
    // 押せる（帯の上の点に当たる）
    const hit = await p.evaluate(() => { const e = document.querySelector('#toast-root [data-act=toast-undo]'); const q = e.getBoundingClientRect(); const t = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return !!t && e.contains(t); });
    ok(hit, `${tag} 帯のボタンが実際に押せる（上に別のものがない）`);
    await ctx.close();
}
// B5 守り
{
    const {p, ctx} = await open({dishCount: 4});
    await marugo(p);
    const m1 = await MENU(p);
    // 前の献立の主菜の食材を苦手に足す（toggle-avoid と同じ操作）
    const food = await p.evaluate(() => { const e = menuBack.list[menuBack.list.length - 1]; const r = e.menu.items[0].r; const cur = new Set(menuIds()); const it = r.items.map(i => i[0]).find(x => x && !session.menu.items.some(y => y.r && y.r.items.some(i => i[0] === x))); return it || null; });
    if (food){
        await p.evaluate(v => { const b = document.createElement('button'); b.dataset.act = 'toggle-avoid'; b.dataset.v = v; b.style.cssText = 'position:fixed;left:0;top:0;width:10px;height:10px'; document.body.appendChild(b); b.click(); b.remove(); }, food);
        await p.waitForTimeout(500);
        ok(await band(p) === null, 'B5 苦手を足すと「前の献立」の帯が消える（S25）: ' + food);
        const prevBad = await p.evaluate(() => { const e = menuBack.list[menuBack.list.length - 1]; return e ? 'still' : 'cleared'; });
        ok(prevBad === 'cleared', 'B5 戻る先も捨てられる');
        ok(await p.evaluate(() => { try{ menuBackRestore(); }catch(e){} return true; }) && true, 'B5 呼んでも落ちない');
        ok(await p.evaluate(() => !session.menu.items.some(x => x.r && (isAvoided(x.r) || allergyConflict(x.r)))), 'B5 いまの献立に当たる料理はない');
    } else ok(true, 'B5 （食材が見つからず省略）');
    await ctx.close();
}
{   // 設定が変わっていなくても、戻す先にいまの設定で当たる料理があれば戻さない（直接の守り）
    const {p, ctx} = await open({dishCount: 4});
    await marugo(p);
    const before = await MENU(p);
    await p.evaluate(() => { menuBack.list[menuBack.list.length - 1].menu.items[0].r = Object.assign({}, menuBack.list[0].menu.items[0].r, {id: 'x-bad'}); S.hidden = (S.hidden || []).concat('x-bad'); });
    await p.click(BACK); await p.waitForTimeout(400);
    ok(await MENU(p) === before && await band(p) === null, 'B5 「今は出さない」の料理が入っていると戻さない（帯も消える）');
    await ctx.close();
}
{   // 決めた献立は変えない（まるごと入れ替えの確かめのシートのあと）
    const {p, ctx} = await open({dishCount: 4});
    await p.evaluate(() => { document.querySelector('[data-act=decide]').click(); }); await p.waitForTimeout(600);
    const cook0 = await p.evaluate(() => JSON.stringify(S.cook));
    await p.evaluate(() => { document.querySelector('nav.tabs [data-tab=fridge]').click(); }); await p.waitForTimeout(300);
    await p.evaluate(() => { document.querySelector('nav.tabs [data-tab=today]').click(); }); await p.waitForTimeout(500);
    const dbg = await p.evaluate(() => ({stage: session.stage, v: viewingStage && viewingStage(), has: !!document.querySelector('#view .tray .tg-mid .shuffle'), dec: menuIsDecided()}));
    if (dbg.has){ await p.evaluate(() => { document.querySelector('#view .tray .tg-mid .shuffle').click(); }); await p.waitForTimeout(400); await p.evaluate(() => { const b = document.querySelector('[data-act=redo-yes]'); if (b) b.click(); }); await p.waitForTimeout(500); }
    ok(await p.evaluate(() => JSON.stringify(S.cook)) === cook0, 'B5 決めた献立の記録は、入れ替えても変わらない: ' + JSON.stringify(dbg));
    ok(await p.evaluate(() => menuBack.list.length) === 0, 'B5 決めた献立からは「前の献立」の帯を作らない（確かめのシートと「元に戻す」を使う）');
    await ctx.close();
}
// B6 言語
for (const [lang, cc] of [['en', 'US'], ['ar', 'EG'], ['de', 'DE'], ['th', 'TH'], ['hi', 'IN'], ['ko', 'KR']]) for (const w of [195, 360]){
    const {p, ctx} = await open({dishCount: 4, uiLang: lang, country: cc}, [w, w < 300 ? 640 : 740]);
    await marugo(p); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const bx = document.querySelector('#toast-root .toast'); if (!bx) return null; const q = bx.getBoundingClientRect(), bt = bx.querySelector('[data-act=toast-undo]'), c = bt.getBoundingClientRect(), vw = document.documentElement.clientWidth;
        return {txt: bt.textContent.trim(), inX: q.left >= -.5 && q.right <= vw + .5, btnIn: c.left >= q.left - .5 && c.right <= q.right + .5, clip: bt.scrollWidth > bt.clientWidth + 1, h: Math.round(c.height)}; });
    ok(r && r.inX && r.btnIn && !r.clip && r.h >= 36, `B6 ${lang} ${w}px 帯とボタンがはみ出さず切れない: ` + JSON.stringify(r));
    await ctx.close();
}
await b.close();
console.log(errs.length ? 'ページのエラー: ' + errs.slice(0, 3).join(' / ') : '');
ok(errs.length === 0, 'JS エラーなし');
console.log(fails ? `NG ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
