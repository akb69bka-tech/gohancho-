#!/usr/bin/env node
// 「まるごと入れ替え」をお膳の表に出す（オーナーの指示）の回帰テスト（Playwright。使い方: node tools/tests/marugoto.mjs [http://localhost:8881/]）
//  1. 決める段の表（条件シートを開かずに）に「まるごと入れ替え」があり、「今日の一膳」の見出しの行（狭いときはすぐ下の行）・「この一膳にする」より上にある。44px 以上で押しやすい
//  1b. スクロールしなくても最初の画面で見えて押せる（360×740・390×844・大きい文字）。下の「この一膳にする」の帯やお知らせの後ろに隠れない（オーナーの指示）
//  2. 押すと献立がまるごと変わる（主菜も入れ替わる）。条件シートのいちばん下のボタンも残っている
//  3. 決めた献立を出しているときは、先に確かめる（シート）。やめると何も変わらない。作り直すと決めた献立（S.cook）はそのままで「元に戻す」が出て、押すと元の案に戻る
//  4. 「かえる」で1品を変えても、ほかの料理は変わらない
//  5. 狭い幅（195px・もっと大きい文字）・英語・アラビア語（右から左）でも、ボタンが画面からはみ出さず、文字が切れず、ほかの押す場所に重ならない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const open = async (settings = {}, vp = [390, 844]) => {
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('marugoto', JSON.stringify(settings), vp.join('x'))));
    await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, st)})); }, settings);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
const ids = p => p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
const BTN = '#view .p2-head .shuffle[data-act=new-menu]';
// 押せるか: ボタンの中の5点（真ん中と四隅の少し内側）がすべて、ほかのもの（下の帯・お知らせ・お膳）に覆われずにボタン自身に当たり、画面の中（下の帯より上）にある
const reach = p => p.evaluate(sel => {
    const s = document.querySelector(sel); if (!s) return null;
    const R = s.getBoundingClientRect(), bar = [...document.querySelectorAll('.actionbar, nav.tabs')].map(e => e.getBoundingClientRect()).filter(q => q.height && q.top > innerHeight * .4).reduce((m, q) => Math.min(m, q.top), innerHeight);
    const pts = [[.5, .5], [.15, .25], [.85, .25], [.15, .75], [.85, .75]].map(([fx, fy]) => [R.left + R.width * fx, R.top + R.height * fy]);
    const hits = pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e && s.contains(e) ? 'ok' : (e ? (e.className || e.tagName).toString().slice(0, 30) : 'none'); });
    return {sy: Math.round(scrollY), top: Math.round(R.top), bottom: Math.round(R.bottom), w: Math.round(R.width), h: Math.round(R.height), bar: Math.round(bar), inView: R.top >= 0 && R.bottom <= bar && R.left >= 0 && R.right <= innerWidth, hits};
}, BTN);

// 1・2 表にあり、押すと丸ごと変わる
for (const n of [3, 4, 5]){
    const {p, ctx} = await open({dishCount: n});
    const g = await p.evaluate(sel => {
        const s = document.querySelector(sel); if (!s) return null;
        const dec = document.querySelector('[data-act=decide]'), tray = document.querySelector('#view .tray');
        const R = s.getBoundingClientRect(), ic = s.querySelector('.sh-ic').getBoundingClientRect(), h2 = document.querySelector('#view .p2-head h2').getBoundingClientRect();
        return {sheet: !!sheet, inHead: !!s.closest('.today-head'), aboveTray: !tray || tray.getBoundingClientRect().top >= R.bottom - 1, nearHead: R.top >= h2.top - 1 && R.top <= h2.bottom + 24,
            aboveDecide: !dec || dec.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_PRECEDING, w: R.width, h: R.height, icW: ic.width, label: s.textContent.trim()};
    }, BTN);
    ok(g && !g.sheet, `M1 ${n}品 決める段のお膳の表に「まるごと入れ替え」がある（条件シートを開かずに）: ` + JSON.stringify(g));
    if (g){
        ok(g.inHead && g.nearHead && g.aboveTray, `M2 ${n}品 「今日の一膳」の見出しの行（またはすぐ下）・お膳より上: ` + JSON.stringify(g));
        ok(g.aboveDecide, `M3 ${n}品 「この一膳にする」より上（画面の並び）`);
        ok(g.h >= 44 && g.w >= 88 && g.icW >= 32 && /まるごと入れ替え/.test(g.label), `M4 ${n}品 押しやすい大きさ（高さ44px 以上）・印と文字つき: ` + JSON.stringify(g));
    }
    const a = await ids(p);
    await p.click(BTN);   // click は要素を探し直して見える所まで送るので、絵の読みこみで描き直されても外れない await p.waitForTimeout(400);
    const c = await ids(p);
    const changed = a.filter((x, i) => x && x !== c[i]).length;
    ok(c[0] && c[0] !== a[0] && changed >= Math.ceil(a.filter(Boolean).length / 2), `M5 ${n}品 押すと献立がまるごと変わる: ` + JSON.stringify([a, c]));
    const inSheet = await p.evaluate(() => { openCondSheet(); const r = !!document.querySelector('#sheet-root [data-act=new-menu]'); closeSheet(); return r; });
    ok(inSheet, `M6 ${n}品 条件シートのいちばん下のボタンも残っている`);
    await ctx.close();
}

// 1b 最初の画面（スクロールなし）で見えて押せる。下の帯・お知らせに隠れない
for (const [vp, ts, n, lang] of [[[360, 740], 0, 3, 'ja'], [[360, 740], 0, 6, 'ja'], [[390, 844], 0, 4, 'ja'], [[390, 844], 0, 5, 'ja'], [[390, 844], 1, 4, 'ja'], [[390, 844], 2, 3, 'ja'], [[360, 740], 2, 4, 'ja'], [[360, 740], 1, 6, 'ja'], [[360, 740], 0, 4, 'en'], [[360, 740], 2, 4, 'de'], [[360, 740], 0, 4, 'ar']]){
    const {p, ctx} = await open({uiLang: lang, textSize: ts || undefined, dishCount: n}, vp);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(250);
    const tag = `M1b ${lang} ${vp.join('x')} 文字${ts} ${n}品`;
    const r0 = await reach(p);
    ok(r0 && r0.sy === 0 && r0.inView && r0.hits.every(h => h === 'ok'), `${tag} 最初の画面で、スクロールせずに見えて押せる（下の帯の上）: ` + JSON.stringify(r0));
    // お知らせ（トースト）が出ているときも隠れない。長めのお知らせを、いつもの置き場所の決め方（toastPlace）で出す
    await p.evaluate(() => toast(t('「{name}」を保存しました。記録タブの「保存した献立」から呼び出せます', {name: t('{name}の日', {name: session.menu.items[0].r.name})}))); await p.waitForTimeout(400);
    const r1 = await reach(p), tst = await p.evaluate(() => !!document.querySelector('#toast-root .toast'));
    ok(tst && r1 && r1.inView && r1.hits.every(h => h === 'ok'), `${tag} お知らせが出ていても隠れない: ` + JSON.stringify([tst, r1]));
    // 実際に押して（指で押す位置に出ている）献立が変わる
    const a = await ids(p); await p.locator(BTN).click({trial: false}); await p.waitForTimeout(300); const c = await ids(p);
    ok(c[0] && c[0] !== a[0] && await p.evaluate(() => scrollY) === 0, `${tag} そのまま押すと入れ替わる（画面は動かない）: ` + JSON.stringify([a, c]));
    await ctx.close();
}

// 3 決めた献立では先に確かめる → やめる／作り直す → 元に戻す
{
    const {p, ctx} = await open({dishCount: 3});
    await p.click('button[data-act=decide]'); await p.waitForTimeout(400);
    const cook0 = await p.evaluate(() => JSON.stringify(S.cook && S.cook.ids));
    await p.click('[data-act=stage][data-k=decide]'); await p.waitForTimeout(300);
    const a = await ids(p);
    ok(await p.locator(BTN).count() === 1, 'M7 決めたあとに決める段を見ても、表に「まるごと入れ替え」がある');
    await p.click(BTN);   // click は要素を探し直して見える所まで送るので、絵の読みこみで描き直されても外れない await p.waitForTimeout(300);
    const k1 = await p.evaluate(() => sheet && sheet.kind);
    ok(k1 === 'redo' && JSON.stringify(await ids(p)) === JSON.stringify(a), 'M8 決めた献立では、まず確かめる（まだ変えない）: ' + k1);
    await p.click('#sheet-root [data-act=sheet-close]'); await p.waitForTimeout(300);
    ok(JSON.stringify(await ids(p)) === JSON.stringify(a) && await p.evaluate(() => JSON.stringify(S.cook && S.cook.ids)) === cook0, 'M9 やめると献立も決めた献立も変わらない');
    await p.click(BTN);   // click は要素を探し直して見える所まで送るので、絵の読みこみで描き直されても外れない await p.waitForTimeout(300);
    await p.click('#sheet-root [data-act=redo-yes]'); await p.waitForTimeout(400);
    const c = await ids(p), cook1 = await p.evaluate(() => JSON.stringify(S.cook && S.cook.ids));
    const undo = p.locator('#toast-root [data-act=toast-undo]');
    ok(c[0] !== a[0] && cook1 === cook0 && await undo.count() === 1, 'M10 作り直すと案は変わり、決めた献立（作り方）はそのまま・「元に戻す」が出る: ' + JSON.stringify([a, c, cook0, cook1]));
    if (await undo.count()){ await undo.click(); await p.waitForTimeout(300); ok(JSON.stringify(await ids(p)) === JSON.stringify(a), 'M11 「元に戻す」で元の案に戻る'); }
    await ctx.close();
}

// 4 「かえる」で1品を変えても、ほかは変わらない
{
    const {p, ctx} = await open({dishCount: 4});
    const a = await ids(p);
    const bs = p.locator('#view button.swap[data-act=reroll]'); const n = await bs.count();
    if (n > 1){ await bs.nth(1).click(); await p.waitForTimeout(400); }
    const c = await ids(p), diff = a.map((x, i) => x !== c[i]).filter(Boolean).length;
    ok(n > 1 && diff <= 1, 'M12 「かえる」で変わるのは1品だけ: ' + JSON.stringify([a, c]));
    await ctx.close();
}

// 5 狭い幅・長い言葉・右から左
for (const [lang, w, ts, n] of [['ja', 195, 2, 3], ['ja', 195, 0, 5], ['en', 195, 2, 4], ['de', 320, 2, 4], ['ar', 390, 0, 3], ['ar', 195, 2, 4], ['fil', 280, 1, 5]]){
    const {p, ctx} = await open({uiLang: lang, textSize: ts || undefined, dishCount: n}, [w, 600]);
    await p.waitForTimeout(200);
    const r = await p.evaluate(sel => {
        const s = document.querySelector(sel); if (!s) return null;
        s.scrollIntoView({block: 'center'});
        const R = s.getBoundingClientRect(), tx = s.querySelector('.sh-tx'), hd = s.closest('.today-head').getBoundingClientRect();
        const others = [...document.querySelectorAll('#view button, #view [data-act]')].filter(e => !s.contains(e) && !e.closest('.actionbar')).filter(e => { const q = e.getBoundingClientRect(); return q.width > 1 && Math.min(q.right, R.right) - Math.max(q.left, R.left) > 1 && Math.min(q.bottom, R.bottom) - Math.max(q.top, R.top) > 1; }).map(e => e.dataset.act || e.tagName);
        return {inside: R.left >= hd.left - 1 && R.right <= hd.right + 1 && R.left >= 0 && R.right <= innerWidth, clip: tx.scrollWidth > tx.clientWidth + 1 || tx.scrollHeight > tx.clientHeight + 1, overlap: others, sw: document.documentElement.scrollWidth, iw: innerWidth};
    }, BTN);
    const tag = `M13 ${lang} ${w}px 文字${ts} ${n}品`;
    ok(r && r.inside && !r.clip && !r.overlap.length && r.sw <= r.iw, `${tag}: はみ出さず・文字が切れず・ほかのボタンに重ならない: ` + JSON.stringify(r));
    await ctx.close();
}

await b.close();
if (errs.length){ fails++; console.log('FAIL JSエラー', errs.slice(0, 3)); }
console.log(`\n${checks - fails}/${checks} ok` + (fails ? `  失敗 ${fails}  [再現: SEED=${SEED}]` : ''));
process.exit(fails ? 1 : 0);
