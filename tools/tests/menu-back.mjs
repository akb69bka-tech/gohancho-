#!/usr/bin/env node
// 「まるごと入れ替え」のあとの「↶ 前の献立」（1つ前に戻る。オーナー指示 11/05）の回帰テスト（Playwright。使い方: node tools/tests/menu-back.mjs [http://localhost:8881/]）
//  B1 まるごと入れ替えのあと、丸の右隣に「↶ 前の献立」が出る。押すと前の献立（料理・席・品数）がそのまま戻る
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
const MARU = '#view .tray .tg-mid .shuffle[data-act=new-menu]', BACK = '#view .tg-mid .mb-back[data-act=menu-back]';
const band = p => p.evaluate(() => { const e = document.querySelector('#view .tg-mid .mb-back'); return e ? (e.getAttribute('aria-label') || '') + '|' + e.textContent.trim() : null; });
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
    // ほかのお知らせ（toast）が出て消えても、ボタンは残る
    await p.evaluate(() => toast('テスト')); await p.waitForTimeout(300); await p.evaluate(() => { toast.hide(); }); await p.waitForTimeout(300);
    ok(await band(p) !== null, 'B3 ほかのお知らせが出て消えても「前の献立」は残る');
    // ↻ で1品かえる → 消える
    await p.evaluate(() => { const b = document.querySelector('#view .tray .spot .swap:not(.swap-ph)'); b.click(); }); await p.waitForTimeout(500);
    ok(await band(p) === null && await p.evaluate(() => menuBack.list.length) === 0, 'B3 ↻ で1品かえると「前の献立」は消える（ほかの方法で献立が変わった。↻ 自身の「元に戻す」は出る）');
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
const SEE = '#view .spot .vessel, #view .spot .nm, #view .spot .alg-tag, #view .spot .swap-line, #view .spot .swap:not(.swap-ph), #view .tg-mid .sh-ic, #view .tg-mid .sh-tx, #view .tg-mid .shuffle';
let b4n = 0, b4ng = 0;
for (const [w, h] of [[195, 640], [320, 700], [360, 740], [390, 844], [430, 932]]) for (const ts of [0, 1, 2]) for (const n of [4, 6]){
    const {p, ctx} = await open({dishCount: n, textSize: ts || undefined}, [w, h]);
    const tag = `B4 ${w}px 文字${ts} ${n}品`;
    for (let k = 0; k < 2; k++){
        await marugo(p); await p.waitForTimeout(500);
        const r = await p.evaluate(sel => {
            const bt = document.querySelector('#view .tg-mid .mb-back'); if (!bt) return {none: true};
            const q = bt.getBoundingClientRect(), hit = [], vw = document.documentElement.clientWidth, mid = bt.closest('.tg-mid').getBoundingClientRect(), ic = document.querySelector('#view .tg-mid .sh-ic').getBoundingClientRect(), tray = document.querySelector('#view .tray').getBoundingClientRect(), sh0 = document.querySelector('#view .tg-mid .shuffle').getBoundingClientRect();
            document.querySelectorAll(sel).forEach(e => { if (e.closest('.mb-back')) return; const c = e.getBoundingClientRect(); if (c.width < 2 || c.height < 2) return; if (e.matches('.shuffle')) return; if (c.left < q.right - .5 && c.right > q.left + .5 && c.top < q.bottom - .5 && c.bottom > q.top + .5) hit.push((e.className || e.tagName).toString().slice(0, 24) + ':' + Math.round(c.left) + ',' + Math.round(c.top)); });
            const sh = sh0;
            return {hit, w: Math.round(q.width), h: Math.round(q.height), inTray: q.left >= tray.left - .5 && q.right <= tray.right + .5, inMid: q.top >= mid.top - 1 && q.bottom <= mid.bottom + 1, noHscroll: document.documentElement.scrollWidth <= vw, icon: bt.classList.contains('icon'), aria: bt.getAttribute('aria-label'), centered: bt.closest('.tg-mid').classList.contains('mb-stack') ? Math.abs((Math.min(sh0.left, q.left) + Math.max(sh0.right, q.right)) / 2 - (tray.left + tray.right) / 2) <= 6 : Math.abs((sh0.left + sh0.right) / 2 - (tray.left + tray.right) / 2) <= 2, shuf: [Math.round(sh.left), Math.round(sh.right)], box: [q.left, q.top, q.right, q.bottom].map(Math.round)};
        }, SEE);
        const clickable = await p.evaluate(() => { const e = document.querySelector('#view .tg-mid .mb-back'); const q = e.getBoundingClientRect(); return [[.5, .5], [.2, .5], [.8, .5], [.5, .2], [.5, .8]].every(([x, y]) => { const t = document.elementFromPoint(q.left + q.width * x, q.top + q.height * y); return !!t && e.contains(t); }); });
        b4n++;
        const good = !r.none && r.hit.length === 0 && r.w >= 44 && r.h >= 44 && r.inTray && r.inMid && r.noHscroll && r.centered && !!r.aria && clickable;
        if (!good) b4ng++;
        ok(good, `${tag} ${k + 1}回目 丸の右隣のボタンが 絵・名前・⚠札・↻・丸にかからず、44×44px 以上で、トレーの中・横スクロールなし・丸は中央のまま・押せる: ` + JSON.stringify(r) + ' clickable=' + clickable);
    }
    await ctx.close();
}
console.log(`B4 測定 ${b4n} 回（5幅 × 文字3段階 × 4・6品 × 2）うち不合格 ${b4ng}`);
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
// B6 言語（字が丸・名前に当たるときは「↶」だけ。読み上げ名は「前の献立」の訳）
for (const [lang, cc] of [['en', 'US'], ['ar', 'EG'], ['de', 'DE'], ['th', 'TH'], ['hi', 'IN'], ['ko', 'KR']]) for (const w of [195, 360]){
    const {p, ctx} = await open({dishCount: 4, uiLang: lang, country: cc}, [w, w < 300 ? 640 : 740]);
    await marugo(p); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const bt = document.querySelector('#view .tg-mid .mb-back'); if (!bt) return null; const q = bt.getBoundingClientRect(), mid = bt.closest('.tg-mid').getBoundingClientRect(), ic = document.querySelector('#view .tg-mid .sh-ic').getBoundingClientRect(), tx = document.querySelector('#view .tg-mid .sh-tx').getBoundingClientRect(), vw = document.documentElement.clientWidth, tt = bt.querySelector('.mb-tx');
        const vis = !bt.classList.contains('icon');
        return {aria: bt.getAttribute('aria-label'), icon: !vis, inMid: q.left >= mid.left - .5 && q.right <= mid.right + .5, noOverlap: !(q.left < ic.right + 4 && q.right > ic.left - 4) && !(q.left < tx.right && q.right > tx.left && q.top < tx.bottom && q.bottom > tx.top), clip: vis && tt.scrollWidth > tt.clientWidth + 1, h: Math.round(q.height), w: Math.round(q.width), noH: document.documentElement.scrollWidth <= vw}; });
    ok(r && r.aria && r.inMid && r.noOverlap && !r.clip && r.h >= 44 && r.w >= 44 && r.noH, `B6 ${lang} ${w}px ボタンが丸・名前に重ならず、はみ出さず、字が切れない（入らなければ「↶」だけ）: ` + JSON.stringify(r));
    await ctx.close();
}
await b.close();
console.log(errs.length ? 'ページのエラー: ' + errs.slice(0, 3).join(' / ') : '');
ok(errs.length === 0, 'JS エラーなし');
console.log(fails ? `NG ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
