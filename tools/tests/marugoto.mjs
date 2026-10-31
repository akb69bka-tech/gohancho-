#!/usr/bin/env node
// 「まるごと入れ替え」をお膳の表に出す（オーナーの指示）の回帰テスト（Playwright。使い方: node tools/tests/marugoto.mjs [http://localhost:8881/]）
//  1. 今日の献立のお膳（条件シートを開かずに）の段のあいだに丸い「まるごと入れ替え」があり、「この献立に決定」より上にある。丸は56px 以上
//  1b. スクロールしなくても最初の画面で見えて押せる（360×740・390×844・大きい文字）。下の「この一膳にする」の帯やお知らせの後ろに隠れない（オーナーの指示）
//  1c. お膳は全部の料理を上下2段（上 ⌈席/2⌉・下 ⌊席/2⌋、下は左端ご飯・右端汁もの）。段のあいだの真ん中に丸い「まるごと入れ替え」。押すと変わった料理だけに「新」の札
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
const BTN = '#view .tray .tg-mid .shuffle[data-act=new-menu]';   // お膳の段のあいだの真ん中の丸（見出しの行のボタンは、お膳の上を詰めて外した）
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
        const dec = document.querySelector('[data-act=decide]');
        const R = s.getBoundingClientRect(), ic = s.querySelector('.sh-ic').getBoundingClientRect();
        return {sheet: !!sheet, inTray: !!s.closest('.tray'), heads: document.querySelectorAll('#view .p2-head [data-act=new-menu]').length,
            aboveDecide: !dec || dec.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_PRECEDING, w: R.width, h: R.height, icW: ic.width, label: s.textContent.trim()};
    }, BTN);
    ok(g && !g.sheet, `M1 ${n}品 決める段のお膳の表に「まるごと入れ替え」がある（条件シートを開かずに）: ` + JSON.stringify(g));
    if (g){
        ok(g.inTray && g.heads === 0, `M2 ${n}品 お膳の中（段のあいだ）にあり、見出しの行には同じボタンを置かない: ` + JSON.stringify(g));
        ok(g.aboveDecide, `M3 ${n}品 「この一膳にする」より上（画面の並び）`);
        ok(g.h >= 56 && g.w >= 56 && g.icW >= 56 && /まるごと入れ替え/.test(g.label), `M4 ${n}品 押しやすい大きさ（丸は直径56px 以上）・文字つき: ` + JSON.stringify(g));
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

// 1c お膳（最初のデザイン・基準書 2章）: すべての料理を上下2段に（上 ⌈席/2⌉・下 ⌊席/2⌋。上は主菜→副菜、下は左端ご飯・右端汁もの）。段のあいだの真ん中に丸い「まるごと入れ替え」。
//    押すと変わった料理だけに「新」の札（変わらなかった料理・ご飯には付かない）
const MID = '#view .tray .tg-mid .shuffle[data-act=new-menu]';
for (const [cc, n, lang] of [['JP', 2, 'ja'], ['JP', 3, 'ja'], ['JP', 4, 'ja'], ['JP', 5, 'ja'], ['JP', 6, 'ja'], ['US', 4, 'en'], ['KR', 5, 'ko'], ['EG', 3, 'ar']]){
    const {p, ctx} = await open({country: cc, uiLang: lang, dishCount: n});
    const tag = `M1c ${cc} ${n}品`;
    const g = await p.evaluate(sel => {
        const tr = document.querySelector('#view .tray'), rows = [...tr.querySelectorAll('.tg-row')], b = document.querySelector(sel); if (!b || !rows.length) return null;
        const seat = e => e.classList.contains('rice') ? 'rice' : e.classList.contains('main') ? 'main' : e.classList.contains('side') ? 'side' : 'soup';
        const R = b.getBoundingClientRect(), ic = b.querySelector('.sh-ic').getBoundingClientRect(), T = tr.getBoundingClientRect();
        const rs = rows.map(r => [...r.children].map(seat)), rr = rows.map(r => r.getBoundingClientRect());
        const vs = rows.map(r => [...new Set([...r.querySelectorAll('.vessel')].map(v => Math.round(v.parentElement.getBoundingClientRect().width)))]);
        const rtl = getComputedStyle(tr).direction === 'rtl';
        const lowerX = rows[1] ? [...rows[1].children].map(e => e.getBoundingClientRect().left) : [];
        return {rows: rs, nItems: session.menu.items.filter(x => x.r || x.slot !== '汁物').length, mid: Math.abs((R.left + R.right) / 2 - (T.left + T.right) / 2), between: rr[0].bottom <= ic.top + 1 && (!rr[1] || ic.bottom <= rr[1].top + 1),
            ic: Math.round(ic.width), label: b.textContent.trim(), sameSize: vs.every(x => x.length <= 1), rtl, lowerX};
    }, MID);
    ok(!!g, `${tag} お膳に2段と真ん中の丸がある: ` + JSON.stringify(g));
    if (g){
        const all = g.rows.flat(), top = g.rows[0].length, low = (g.rows[1] || []).length;
        ok(top === Math.ceil(all.length / 2) && low === Math.floor(all.length / 2), `${tag} 上 ⌈席/2⌉・下 ⌊席/2⌋（${top}/${low}）: ` + JSON.stringify(g.rows));
        const lo = g.rows[1] || [];
        ok(!all.includes('rice') || (lo[0] === 'rice'), `${tag} ご飯の席は下の段の端: ` + JSON.stringify(g.rows));
        ok(!lo.length || !lo.includes('soup') || lo[lo.length - 1] === 'soup' || (all.length === 3 && g.rows[0].includes('soup')), `${tag} 汁ものは下の段の反対の端: ` + JSON.stringify(g.rows));
        ok(g.rows[0][0] === 'main', `${tag} 上の段は主菜から: ` + JSON.stringify(g.rows));
        ok(g.mid <= 2 && g.between && g.ic >= 56 && g.ic <= 64 && g.label.length > 0, `${tag} 丸は段のあいだの横の真ん中（直径56〜64px・文字つき）: ` + JSON.stringify(g));
        ok(g.sameSize, `${tag} 同じ段の器は同じ大きさ: ` + JSON.stringify(g));
        if (g.rtl && g.lowerX.length > 1) ok(g.lowerX[0] > g.lowerX[g.lowerX.length - 1], `${tag} 右から左の言語では、段の中の順も右から: ` + JSON.stringify(g.lowerX));
    }
    const riceTx = () => p.evaluate(() => { const e = document.querySelector('#view .tray .spot.rice'); if (!e || e.classList.contains('ghost')) return '';   // 主食「なし」の空の席は料理ではないので札は付けない
        const c = e.cloneNode(true); c.querySelectorAll('.fresh-tag').forEach(x => x.remove()); return c.textContent.replace(/\s/g, '') + '|' + (((e.querySelector('.vessel') || {}).className || '').match(/v-[a-z]+/) || [''])[0]; });
    const a = await ids(p), r0 = await riceTx();
    await p.click(MID); await p.waitForTimeout(400);
    const c = await ids(p), r1 = await riceTx();
    const fr = await p.evaluate(() => ({fresh: [...document.querySelectorAll('#view .tray .spot.fresh [data-act=reroll]')].map(b => Number(b.dataset.i)), tags: document.querySelectorAll('#view .tray .fresh-tag').length, rice: !!document.querySelector('#view .tray .spot.rice.fresh')}));
    const changed = a.map((x, i) => x !== c[i] && c[i] ? i : -1).filter(i => i >= 0);
    ok(c[0] && c[0] !== a[0], `${tag} 真ん中の丸で献立がまるごと変わる: ` + JSON.stringify([a, c]));
    const riceChanged = !!r1 && r0 !== r1;   // ご飯の席がなくなったとき（一品ものの主菜）は札を付ける席がない
    ok(JSON.stringify(fr.fresh.sort()) === JSON.stringify(changed.sort()) && fr.rice === riceChanged && fr.tags === changed.length + (riceChanged ? 1 : 0), `${tag} 変わった料理だけに「新」の札: ` + JSON.stringify([changed, fr, r0, r1]));
    await ctx.close();
}

// 1d 品数の数え方（基準書 7章 4A・オーナーの「6品なら上下3つずつ」）: ご飯の席も1品。「6品」を選ぶと席6（上3・下3）。
//    前から使っている人の保存した品数は、席の数として読む（6品なら6席。決めた献立は upgrade-seats.mjs で確かめる）
{
    const {p, ctx} = await open({dishCount: 3});
    await p.evaluate(() => openCondSheet()); await p.waitForTimeout(200);
    const chip = p.locator('#sheet-root [data-act="count"]', {hasText: /^6品/}).first();
    ok(await chip.count() === 1, 'M1d 条件シートに「6品」がある');
    await chip.click(); await p.waitForTimeout(400);
    await p.evaluate(() => { if (sheet && sheet.kind === 'cond') closeSheet(); }); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({rows: [...document.querySelectorAll('#view .tray .tg-row')].map(e => e.children.length), lab: document.querySelector('#view .p2-sv').textContent, dc: S.settings.dishCount}));
    ok(JSON.stringify(r.rows) === '[3,3]' && /6品/.test(r.lab), 'M1d 「6品」で上3・下3（ご飯も1品）・条件の表示も6品: ' + JSON.stringify(r));
    await ctx.close();
    const q = await open({dishCount: 6});
    const r2 = await q.p.evaluate(() => ({dc: S.settings.dishCount, n: session.menu.n, rows: [...document.querySelectorAll('#view .tray .tg-row')].map(e => e.children.length), lab: document.querySelector('#view .p2-sv').textContent, rice: !!document.querySelector('#view .tray .spot.rice')}));
    ok(r2.dc === 6 && (r2.rice ? JSON.stringify(r2.rows) === '[3,3]' && r2.n === 5 : r2.n === 6) && /6品/.test(r2.lab), 'M1d 前の版で「6品」にしていた人: 保存した値 6 は席の数として読む（6席・上3・下3）: ' + JSON.stringify(r2));
    await q.ctx.close();
}

// 1e 利用者モニター第6回: 「新」の札は開いた直後には付けない・品数が変わっても残ったご飯には付けない。幅195px・もっと大きい文字では帯をお盆に重ねず、タブは絵だけ。大きい文字ではタブの字も大きく。詰めたときの丸い「かえる」にも字
{
    const {p, ctx} = await open({dishCount: 4});
    const f0 = await p.evaluate(() => document.querySelectorAll('#view .tray .spot.fresh, #view .tray .fresh-tag').length);
    ok(f0 === 0, 'M1e 開いた直後は「新」の札を付けない: ' + f0);
    const rice0 = await p.evaluate(() => { const e = document.querySelector('#view .tray .spot.rice .vessel'); return e ? (e.className.match(/v-[a-z]+/) || [''])[0] : ''; });
    await p.evaluate(() => { openCondSheet(); }); await p.locator('#sheet-root [data-act="count"][data-v="5"]').first().click(); await p.waitForTimeout(400); await p.evaluate(() => { if (sheet) closeSheet(); }); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({rice: (e => e ? (e.className.match(/v-[a-z]+/) || [''])[0] : '')(document.querySelector('#view .tray .spot.rice .vessel')), riceFresh: !!document.querySelector('#view .tray .spot.rice.fresh'), n: session.menu.n}));
    ok(!r.rice || r.rice !== rice0 || !r.riceFresh, 'M1e 品数を変えても、変わっていない白ご飯には「新」を付けない: ' + JSON.stringify([rice0, r]));
    await ctx.close();
}
for (const [w, h, ts] of [[195, 700, 2], [390, 844, 2], [360, 740, 1]]){
    const {p, ctx} = await open({dishCount: 4, textSize: ts}, [w, h]);
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
        const tr = document.querySelector('#view .tray').getBoundingClientRect(), bar = document.querySelector('.actionbar.decide-bar'), br = bar.getBoundingClientRect();
        const bs = [...document.querySelectorAll('nav.tabs button[data-tab]:not([hidden])')];
        const tl = bs.map(b => b.querySelector('.tl')).filter(Boolean), vis = tl.filter(e => e.getBoundingClientRect().width > 2);
        const lines = vis.map(e => Math.round(e.getBoundingClientRect().height / (parseFloat(getComputedStyle(e).lineHeight) || 14)));
        return {overlap: Math.min(tr.bottom, br.bottom) - Math.max(tr.top, br.top) > 1 && getComputedStyle(bar).position !== 'static', ico: document.querySelector('nav.tabs').classList.contains('ico'), shown: vis.length, maxLines: Math.max(0, ...lines), fs: parseFloat(getComputedStyle(bs[0]).fontSize), label: bs.every(b => b.textContent.trim().length > 0), shorts: bs.map(b => { const e = b.querySelector('.tsn'), q = e && e.getBoundingClientRect(), bq = b.getBoundingClientRect(); return e && q.width > 2 ? {t: e.textContent, fs: parseFloat(getComputedStyle(e).fontSize), cut: e.scrollWidth > e.clientWidth + 1 || q.left < bq.left - .5 || q.right > bq.right + .5, hid: e.getAttribute('aria-hidden') === 'true'} : null; })};
    });
    const tag = `M1e ${w}x${h} 文字${ts}`;
    ok(!r.overlap, `${tag} 決定の帯をお盆に重ねない: ` + JSON.stringify(r));
    if (w < 300) ok(r.ico && r.shown === 0 && r.label, `${tag} 狭い幅ではタブは絵だけ（字は読み上げに残す）: ` + JSON.stringify(r));
    if (w < 300) ok(r.shorts.every(x => x && x.t.length >= 1 && x.t.length <= 3 && x.fs >= 11 && !x.cut && x.hid), `${tag} 絵だけのタブに短い名前（2〜3文字・11px以上・切れない・読み上げは長い名前）: ` + JSON.stringify(r.shorts));
    if (w >= 300) ok(r.shorts.every(x => !x), `${tag} 字のあるタブには短い名前を出さない: ` + JSON.stringify(r.shorts));
    if (w >= 300) ok(!r.ico && r.maxLines <= 2 && r.fs >= (ts === 2 ? 13.5 : 12.5), `${tag} 大きい文字ではタブの字も大きく、2行まで: ` + JSON.stringify(r));
    await ctx.close();
}

// R13（第7回）: 大きい文字のとき、お膳を画面に入れるために下のタブの字を 12px に戻さない（今日・作り方・記録のどのタブでも）
for (const [w, h] of [[390, 844], [430, 932], [360, 740]]) for (const ts of [1, 2]) for (const dc of [4, 7]){
    const {p, ctx} = await open({dishCount: dc}, [w, h]);   // はじめは標準の文字。設定の画面で文字の大きさを変える（はじめての設定・設定の画面と同じ道）
    await p.waitForTimeout(300);
    await p.evaluate(() => setTab('settings')); await p.waitForTimeout(300);
    ok(await p.evaluate(ts => { const b = document.querySelector(`[data-act="text-size"][data-v="${ts}"]`); if (b) b.click(); return !!b; }, ts), `M1f ${w}x${h} 設定に文字の大きさのボタンがある`); await p.waitForTimeout(300);
    const got = [];
    for (const tb of ['today', 'cook', 'log', 'today']){
        got.push(await p.evaluate(async tb => { setTab(tb); await new Promise(r => setTimeout(r, 250));
            const b = document.querySelector('nav.tabs button[data-tab]'), fs = parseFloat(getComputedStyle(b).fontSize);
            return tb + ':' + fs; }, tb));
    }
    const fs = got.map(x => parseFloat(x.split(':')[1]));
    ok(fs.every(x => x >= 13.5), `M1f ${w}x${h} 文字${ts} ${dc}品 下のタブの字は 13.5px 以上（お膳のために 12px に戻さない）: ` + got.join(' '));
    await ctx.close();
}

// 3 決めた献立では先に確かめる → やめる／作り直す → 元に戻す
{
    const {p, ctx} = await open({dishCount: 3});
    await p.click('button[data-act=decide]'); await p.waitForTimeout(400);
    const cook0 = await p.evaluate(() => JSON.stringify(S.cook && S.cook.ids));
    await p.evaluate(() => setTab('today')); await p.waitForTimeout(300);   // 決めたあとも今日の献立のタブ（四段の印はやめた）
    const a = await ids(p);
    ok(await p.locator(BTN).count() === 1, 'M7 決めたあとに今日の献立を見ても、お膳に「まるごと入れ替え」がある');
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
        const R = s.getBoundingClientRect(), tx = s.querySelector('.sh-tx'), hd = s.closest('.tray').getBoundingClientRect();
        const others = [...document.querySelectorAll('#view button, #view [data-act]')].filter(e => !s.contains(e) && !e.closest('.actionbar')).filter(e => { const q = e.getBoundingClientRect(); return q.width > 1 && Math.min(q.right, R.right) - Math.max(q.left, R.left) > 1 && Math.min(q.bottom, R.bottom) - Math.max(q.top, R.top) > 1; }).map(e => e.dataset.act || e.tagName);
        return {inside: R.left >= hd.left - 1 && R.right <= hd.right + 1 && R.left >= 0 && R.right <= innerWidth, clip: tx.scrollWidth > tx.clientWidth + 1 || tx.scrollHeight > tx.clientHeight + 1, overlap: others, sw: document.documentElement.scrollWidth, iw: innerWidth};
    }, BTN);
    const tag = `M13 ${lang} ${w}px 文字${ts} ${n}品`;
    ok(r && r.inside && !r.clip && !r.overlap.length && r.sw <= r.iw, `${tag}: はみ出さず・文字が切れず・ほかのボタンに重ならない: ` + JSON.stringify(r));
    await ctx.close();
}

// 第7回 A09: 幅195px の絵だけのタブの短い名前は、どの言語でも 11px 以上で切れない。入らない言語は名前を出さず絵だけ（読み上げの長い名前は残す）
{
    const CCL = {ja: 'JP', ar: 'EG', de: 'DE', en: 'US', es: 'ES', fil: 'PH', fr: 'FR', hi: 'IN', id: 'ID', it: 'IT', ko: 'KR', pl: 'PL', 'pt-BR': 'BR', th: 'TH', tr: 'TR', vi: 'VN', 'zh-Hans': 'CN', 'zh-Hant': 'TW'};
    const bad = [], off = [];
    for (const [lang, cc] of Object.entries(CCL)){
        const {p, ctx} = await open({country: cc, uiLang: lang, textSize: 2}, [195, 422]);
        await p.waitForTimeout(300);
        const r = await p.evaluate(() => { const nv = document.querySelector('nav.tabs'); return {ico: nv.classList.contains('ico'), items: [...nv.querySelectorAll('button[data-tab]:not([hidden])')].map(b => { const e = b.querySelector('.tsn'), tl = b.querySelector('.tl'); const shown = e && e.getBoundingClientRect().width > 2; return {shown, t: e ? e.textContent : '', fs: shown ? parseFloat(getComputedStyle(e).fontSize) : 0, cut: shown && e.scrollWidth > e.clientWidth + .5, aria: !!(tl && tl.textContent.trim())}; })}; });
        const sh = r.items.filter(x => x.shown);
        if (!r.ico || (sh.length && sh.length !== r.items.length) || sh.some(x => x.fs < 11 || x.cut) || !r.items.every(x => x.aria)) bad.push(lang + ':' + JSON.stringify(r));
        if (!sh.length) off.push(lang);
        await ctx.close();
    }
    ok(!bad.length, 'A09 195px の絵だけのタブ: 短い名前は 11px 以上・切れない（出すときは全部のタブに）・読み上げの長い名前は残す: ' + bad.join(' / '));
    ok(off.length <= 2 && !off.includes('ja'), 'A09 短い名前を出さない（絵だけ）の言語は2つまで・日本語は出す: ' + off.join(','));
}

// R14（第7回）: はじめての設定を終えた直後は「新」を付けない（設定に合わせて献立を作り直しても、まだ何も入れ替えていない）
for (const [label, steps] of [['そのまま', []], ['人数・アレルギーを選ぶ', ['ob-sv:4', 'ob-alg:egg']]]){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('marugoto-ob', label)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p); await p.waitForTimeout(400);
    const clickAct = async (act, v) => { const sel = `#sheet-root [data-act="${act}"]` + (v ? `[data-v="${v}"]` : ''); await p.evaluate(sel => { const e = document.querySelector(sel); if (e) e.click(); }, sel); await p.waitForTimeout(300); };
    // 国は自分で一覧から選ぶ（はじめから選ばれている国はない）
    await p.evaluate(() => { const e = document.querySelector('#sheet-root .country-list [data-act=pick-country][data-cc="JP"]'); if (e) e.click(); }); await p.waitForTimeout(500);
    for (const st of steps.filter(x => x.startsWith('ob-sv'))) await clickAct('ob-sv', st.split(':')[1]);
    await clickAct('ob-next');
    for (const st of steps.filter(x => x.startsWith('ob-alg'))) { await p.evaluate(() => document.querySelectorAll('details.ob-alg-more').forEach(d => d.open = true)); await clickAct('ob-alg', st.split(':')[1]); }
    await clickAct('ob-done'); await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({onb: !!S.onboarded, spots: document.querySelectorAll('#view .tray .spot').length, fresh: document.querySelectorAll('#view .tray .spot.fresh, #view .tray .fresh-tag').length}));
    ok(r.onb && r.spots > 0 && r.fresh === 0, `R14 はじめての設定（${label}）を終えた直後は「新」を付けない: ` + JSON.stringify(r));
    // そのあと「かえる」で1品変えると、その1品にだけ「新」
    await p.evaluate(() => { window.__swapDirect = true; const bt = document.querySelector('.tray [data-act="reroll"]'); if (bt) bt.click(); }); await p.waitForTimeout(500);
    const r2 = await p.evaluate(() => document.querySelectorAll('#view .tray .spot.fresh').length);
    ok(r2 === 1, `R14 はじめての設定（${label}）のあと、かえるで変えた1品にだけ「新」: ` + r2);
    await ctx.close();
}

// R16（第7回）: 画面の文字に「一膳」を残さない（「献立」にそろえる。店の名前「わが家のご飯帖」の判子の「膳」は別）
{
    const src = (await import('node:fs')).readFileSync(new URL('../../gohancho/index.html', import.meta.url), 'utf8');
    const keys = [...src.matchAll(/\b(?:t|tc)\((?:'(?:[^'\\]|\\.)*'\s*,\s*)?'((?:[^'\\]|\\.)*)'/g)].map(m => m[1]).filter(k => k.includes('一膳'));
    ok(!keys.length, 'R16 画面の文（t・tc）に「一膳」がない: ' + keys.slice(0, 5).join(' / '));
    const {p, ctx} = await open({dishCount: 4});
    const seen = [];
    const look = async where => { const tx = await p.evaluate(() => document.body.innerText); if (tx.includes('一膳')) seen.push(where + ':' + tx.slice(Math.max(0, tx.indexOf('一膳') - 12), tx.indexOf('一膳') + 8)); };
    await look('今日');
    await p.evaluate(() => { const b = document.querySelector('[data-act="tomorrow-open"]'); if (b) b.click(); else { sheet = {kind: 'tomorrow'}; renderSheet(); } }); await p.waitForTimeout(300); await look('明日の献立');
    await p.evaluate(() => closeSheet()); await p.click('button[data-act=decide]'); await p.waitForTimeout(400);
    for (const tb of ['today', 'cook', 'log']){ await p.evaluate(tb => setTab(tb), tb); await p.waitForTimeout(250); await look(tb); }
    await p.evaluate(() => { setTab('today'); openCondSheet(); }); await p.waitForTimeout(300); await look('条件（決めたあと）');
    await p.evaluate(() => { closeSheet(); sheet = {kind: 'tomorrow'}; renderSheet(); }); await p.waitForTimeout(300); await look('明日の献立（決めたあと）');
    await p.evaluate(() => closeSheet()); await p.click(BTN); await p.waitForTimeout(300); await look('作り直しの確かめ');
    ok(!seen.length, 'R16 画面に「一膳」が出ない（今日・明日の献立・決めたあとの各タブ・条件・作り直し）: ' + seen.join(' / '));
    await ctx.close();
}

await b.close();
if (errs.length){ fails++; console.log('FAIL JSエラー', errs.slice(0, 3)); }
console.log(`\n${checks - fails}/${checks} ok` + (fails ? `  失敗 ${fails}  [再現: SEED=${SEED}]` : ''));
process.exit(fails ? 1 : 0);
