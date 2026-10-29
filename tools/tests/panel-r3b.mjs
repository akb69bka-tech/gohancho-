#!/usr/bin/env node
// 利用者モニター第3回b（案2「今日の一膳」）の小さな不具合 N3・N4・N6・N7 の回帰テスト（Playwright。使い方: node tools/tests/panel-r3b.mjs [http://localhost:8874/]）
//  N3 食べる時刻は画面の日付（午前4時で替わる）で数える。0時〜3時台に開いて「18:30」と入れても「間に合います」と出さず「もう過ぎています」。
//     朝の時刻は「明日の○時」、0時〜3時台の指定はその夜ふけ。冷蔵庫・残り物・備蓄を0〜4時に登録しても、画面の日付と見え方がずれない
//  N4 お知らせ（トースト）: 押して画面が切りかわったとき（買う段の「そろった」→作る段）は、見えていた押す場所・文（「最初にすること」など）に重ならない。
//     同じ画面のまま（かえる・家族のアレルギーのチップ）は、お知らせのために画面を送らず、押したもの・押した指のまわりに重ならない。主ボタン（2行でも）にも重ならない。
//     お知らせの文の上を押しても下の操作に届き、「元に戻す」は押せる
//  N6 家族の「苦手」の一覧は、押しても畳まれず、押したチップの位置も変わらない（続けて選べる）
//  N7 記録の画面: 決めただけ（まだ作っていない）のときに「決定を押すと記録されます」と出さず、今日の一膳には「まだ記録していません」と出す
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const want = k => !ONLY.length || ONLY.includes(k);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const open = async (settings = {}, opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', hasTouch: !!opt.touch, isMobile: !!opt.touch });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('panel-r3b', JSON.stringify(settings), opt.time || '')));
    await ctx.addInitScript(([st, extra]) => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, st)}, extra || {}))); }, [settings, opt.state]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    if (opt.time) await p.clock.install({ time: new Date(opt.time) });
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
const eatLines = (p, at, ids = ['butadaikon', 'misoshiru', 'ohitashi']) => p.evaluate(([at, ids]) => {
    S.cook = {d: TODAY, ids, slots: ['主菜', '汁物', '副菜'].slice(0, ids.length)};
    S.settings.dinnerAt = at;
    const box = document.createElement('div'); box.innerHTML = eatPlanHtml(cookItems());
    S.cook = null;
    return {lines: [...box.querySelectorAll('.eat-line')].map(x => x.textContent).join(' / ').replace(/ /g, ' '), sum: (box.querySelector('.eat-sum .muted') || {}).textContent || '', today: TODAY};
}, [at, ids]);

// ---- N3 0時〜3時台の食べる時刻 ----
if (want('N3')){
    for (const [now, at, re, no, label] of [
        ['2026-10-29T00:21:00+09:00', '18:30', /18:30はもう過ぎています。今から作ると/, /間に合います|までに始めれば/, 'N3-1 0:21（画面は10/28）に18:30 → もう過ぎています（「17:55までに始めれば…間に合います」と出さない）'],
        ['2026-10-29T03:50:00+09:00', '18:00', /18:00はもう過ぎています/, /間に合います/, 'N3-2 3:50 に18:00 → もう過ぎています'],
        ['2026-10-29T00:21:00+09:00', '07:30', /明日の\s?7:30/, /いま\s?\d{1,2}:\d\dに始めると|過ぎています/, 'N3-3 0:21 に朝7:30 → 明日の7:30'],
        ['2026-10-29T00:21:00+09:00', '02:00', /2:00に間に合います|2:00を過ぎます|2:00には間に合いません/, /過ぎています/, 'N3-4 0:21 に2:00（その夜ふけ）→ これからの時刻'],
        ['2026-10-29T00:21:00+09:00', '00:10', /0:10はもう過ぎています/, /間に合います/, 'N3-5 0:21 に0:10 → もう過ぎています（あさっての0:10にしない）'],
        ['2026-10-28T23:00:00+09:00', '00:30', /0:30に間に合います|0:30を過ぎます|0:30には間に合いません/, /過ぎています/, 'N3-6 23:00 に0:30 → これからの時刻（いままでどおり）'],
        ['2026-10-29T04:10:00+09:00', '18:30', /18:30に間に合います/, /過ぎています/, 'N3-7 4:10（画面は10/29）に18:30 → 間に合います'],
    ]){
        const {p, ctx} = await open({dishCount: 3}, {time: now});
        const r = await eatLines(p, at);
        ok(re.test(r.lines) && !no.test(r.lines), label + ': [' + r.today + '] ' + r.lines);
        if (label.startsWith('N3-3')){
            ok(/明日の/.test(r.sum), 'N3-3b 見出しの時刻も「明日の」: ' + r.sum);
            ok(/明日の\s?\d{1,2}:\d\dまでに始めれば/.test(r.lines), 'N3-3c 作り始めの時刻も明日（画面の日付の次の日）: ' + r.lines);
        }
        await ctx.close();
    }
    // 画面の操作でも（決める→そろった→食べる時刻）
    {
        const {p, ctx} = await open({dishCount: 3}, {time: '2026-10-29T00:21:00+09:00'});
        await p.click('button[data-act=decide]'); await p.waitForTimeout(400);
        await p.evaluate(() => gotoStage('shop')); await p.waitForTimeout(200);   // 買い物メモは作り方のタブの上（最初の版の6タブ）
        await p.click('button[data-act=shop-ok]'); await p.waitForTimeout(400);
        await p.evaluate(() => { session.eatOpen = true; render(); });
        await p.fill('#eat-at', '18:30'); await p.locator('#eat-at').dispatchEvent('change'); await p.waitForTimeout(400);
        const r = await p.evaluate(() => ({lines: [...document.querySelectorAll('.eat-line')].map(x => x.textContent).join(' / '), head: (document.body.innerText.match(/\d+月\d+日[^\n]*/) || [''])[0]}));
        ok(/10月28日/.test(r.head) && /もう過ぎています/.test(r.lines) && !/間に合います/.test(r.lines), 'N3-8 画面: 10月28日の画面で18:30は「もう過ぎています」: ' + r.head + ' | ' + r.lines);
        await ctx.close();
    }
    // 冷蔵庫・残り物・備蓄を0〜4時に登録したとき、画面の日付（今日の献立）と見え方がずれない
    {
        const {p, ctx} = await open({dishCount: 3}, {time: '2026-10-29T00:40:00+09:00'});
        const r = await p.evaluate(() => {
            S.fridge = ['にんじん']; S.fridgeMeta = {}; save();
            const meta = S.fridgeMeta['にんじん'];
            S.cook = {d: TODAY, ids: ['butadaikon'], slots: ['主菜']};
            const r0 = byId('butadaikon'); S.leftovers = []; leftoverToggle('butadaikon');
            const left = S.leftovers[0]; const line = left ? leftoverLine(left) : '';
            stockAdd('水', 2, '');
            const st = S.stock.find(x => x.n === '水');
            S.fridgeMeta['にんじん'].exp = addDays(TODAY, 3);
            setTab('fridge'); render();
            const chip = [...document.querySelectorAll('.w4x_have .chip.have')].map(e => e.textContent).join('|');
            return {today: TODAY, meta, left: left && left.d, line, stock: st && st.d, exp: expLabel(expDays('にんじん')), chip, def: (document.querySelector('#loss-exp-date') || {}).value};
        });
        ok(r.today === '2026-10-28', 'N3-9 0:40 の画面の日付は10/28: ' + r.today);
        ok(r.left === r.today && /今日の.*残り.*1日目/.test(r.line), 'N3-10 0:40 に入れた残り物は「今日の…残り（1日目）」（画面の日付で数える）: ' + JSON.stringify([r.left, r.line]));
        ok(r.stock === r.today, 'N3-11 備蓄の登録日は画面の日付: ' + r.stock);
        ok(r.exp === 'あと3日' && !/\d+日\s*あと/.test(r.chip.replace(/あと3日/, '')) && !/(^|\D)1日/.test(r.chip), 'N3-12 冷蔵庫: 0:40 に入れた食材は「登録から○日」を出さず、期限は画面の日付から「あと3日」: ' + JSON.stringify([r.meta, r.exp, r.chip]));
        await ctx.close();
        // 同じ食材を、夜（画面は同じ10/29）に見ても「登録から1日」にならない（暦の日付で数える）
        const {p: p2, ctx: c2} = await open({dishCount: 3}, {time: '2026-10-29T20:00:00+09:00', state: {fridge: ['にんじん'], fridgeMeta: {'にんじん': {d: '2026-10-29'}}}});
        const chip2 = await p2.evaluate(() => { setTab('fridge'); render(); return [...document.querySelectorAll('.w4x_have .chip.have')].map(e => e.textContent).join('|'); });
        ok(!/(^|\D)1日/.test(chip2), 'N3-13 0〜4時に入れた食材を同じ日の夜に見ても「1日」と出ない: ' + chip2);
        await c2.close();
    }
}

// ---- N4 お知らせが押す場所・大事な文に重ならない ----
// お知らせを出す直前に画面に見えていた（前のお知らせ・下のタブ・主ボタンの裏ではない）押せるもの（ボタン・チップ・入力など）と文（見出し・段落・「最初にすること」）の場所を控え、
// お知らせが出たあと（画面を送ったぶんを足して）、そのどれにも重なっていないかを見る
const SEE = 'button, a[href], input, select, textarea, summary, label, [data-act], .chip, h1, h2, h3, p, li, .eyebrow, .p2m-first, .p2m-ft, .eat-line';
const hookToast = p => p.evaluate(sel => {
    if (window.__toastHooked) return; window.__toastHooked = 1;
    document.addEventListener('pointerdown', e => { window.__tapY = e.clientY; const el = e.target.closest && e.target.closest('button, [data-act], .chip, a, input, label'); if (el){ const r = el.getBoundingClientRect(); window.__tapRect = {l: r.left, t: r.top, r: r.right, b: r.bottom, sy: scrollY, k: (el.textContent || '').trim().slice(0, 12)}; } }, {capture: true});
    const orig = toast;
    toast = function(...a){
        const pb = document.querySelector('#toast-root .toast'), prev = pb ? pb.getBoundingClientRect() : null;   // いま出ているお知らせ（その裏は見えていない）
        // 押した操作の描き直しが終わってから・お知らせの場所を決める前（アプリの requestAnimationFrame より先）に控える
        requestAnimationFrame(() => {
            const root = document.querySelector('#toast-root'); root.style.visibility = 'hidden';
            const out = []; let floor = innerHeight;   // 下の帯（下のタブ・主ボタン）の上端。その裏は見えていない
            document.querySelectorAll('nav.tabs, .actionbar, .cook-ctl').forEach(e => { const r = e.getBoundingClientRect(); if (r.height && r.top > innerHeight * .5 && r.top < floor) floor = r.top; });
            for (const e of document.querySelectorAll(sel)){
                if (e.closest('#toast-root')) continue;
                const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= innerHeight) continue;
                const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
                if (prev && x > prev.left && x < prev.right && y > prev.top && y < prev.bottom) continue;
                const top = document.elementFromPoint(x, y);
                if (top && (top === e || e.contains(top) || top.contains(e))) out.push({tap: e.matches('button, a[href], input, select, textarea, summary, [data-act], .chip'), k: (e.className && String(e.className).split(' ')[0] || e.tagName) + ':' + (e.textContent || '').trim().slice(0, 16), fx: !!e.closest('nav.tabs, .actionbar, .cook-ctl, #timer-float'), l: r.left, t: r.top, r: r.right, b: Math.min(r.bottom, e.closest('nav.tabs, .actionbar, .cook-ctl, #timer-float') ? innerHeight : floor)});
            }
            root.style.visibility = '';
            window.__toastPre = {sy: scrollY, out};
        });
        return orig.apply(this, a);
    };
}, SEE);
const toastCover = p => p.evaluate(() => {
    const tb = document.querySelector('#toast-root .toast'); if (!tb) return {none: true};
    const T = {left: tb.offsetLeft, top: tb.offsetTop, right: tb.offsetLeft + tb.offsetWidth, bottom: tb.offsetTop + tb.offsetHeight}, hit = [], tapHit = [];
    const pre = window.__toastPre || {sy: scrollY, out: []}, dy = scrollY - pre.sy;
    for (const r of pre.out){
        const d = r.fx ? 0 : dy, ix = Math.min(r.r, T.right) - Math.max(r.l, T.left), iy = Math.min(r.b - d, T.bottom) - Math.max(r.t - d, T.top);
        if (ix > 1 && iy > 1){ hit.push(r.k); if (r.tap) tapHit.push(r.k); }
    }
    const btn = tb.querySelector('button'), br = btn && btn.getBoundingClientRect();
    const at = document.elementFromPoint(T.left + 10, (T.top + T.bottom) / 2), fy = window.__tapY, tr = window.__tapRect;
    const tappedHit = !!tr && (Math.min(tr.r, T.right) - Math.max(tr.l, T.left) > 1) && (Math.min(tr.b - (scrollY - tr.sy), T.bottom) - Math.max(tr.t - (scrollY - tr.sy), T.top) > 1);
    // 「元に戻す」の下に、見えていた押す場所がないか（あると、続けて押したつもりで元に戻してしまう）
    let btnOverTap = false;
    if (br) for (const r of pre.out){ if (!r.tap) continue; const d = r.fx ? 0 : dy; if (Math.min(r.r, br.right) - Math.max(r.l, br.left) > 1 && Math.min(r.b - d, br.bottom) - Math.max(r.t - d, br.top) > 1) btnOverTap = true; }
    return {hit: [...new Set(hit)], tapHit: [...new Set(tapHit)], tappedHit, btnOverTap, lifted: tb.classList.contains('docked'), tapMoved: tr ? Math.round(scrollY - tr.sy) : 0, tapped: tr && tr.k, finger: fy == null ? null : Math.round(fy), fingerClear: fy == null || fy < T.top - 60 || fy > T.bottom + 60, through: !!at && !at.closest('#toast-root'), n: pre.out.length, rect: [Math.round(T.top), Math.round(T.bottom)], dy: Math.round(dy), text: tb.textContent.trim().slice(0, 40), btnHit: btn ? !!(document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2) || {closest: () => null}).closest('[data-act=toast-undo]') : null};
});
if (want('N4')){
    // 作る段: 「買い物そろいました」（元に戻すつき）が「最初にすること」に重ならない（第2回 D4・第3回b F11_03）
    for (const vp of [[390, 844], [375, 667], [320, 568]]){
        const {p, ctx} = await open({dishCount: 3}, {time: '2026-10-28T17:00:00+09:00'});
        await p.setViewportSize({width: vp[0], height: vp[1]});
        await p.click('button[data-act=decide]'); await p.waitForTimeout(400); await p.evaluate(() => gotoStage('shop')); await p.waitForTimeout(200); await hookToast(p);
        await p.click('button[data-act=shop-ok]'); await p.waitForTimeout(500);
        const r = await toastCover(p);
        ok(!r.none && /買い物そろいました/.test(r.text), `N4-1 ${vp[0]}x${vp[1]} 作る段で「買い物そろいました」が出る: ` + r.text);
        ok(!r.none && !r.hit.length, `N4-2 ${vp[0]}x${vp[1]} 作る段のお知らせが、押す場所・「最初にすること」に重ならない: ` + JSON.stringify(r));
        ok(r.btnHit && r.n > 5, `N4-3 ${vp[0]}x${vp[1]} 「元に戻す」は押せる: ` + JSON.stringify([r.btnHit, r.n]));
        if (vp[0] === 390) await p.screenshot({path: (process.env.SHOT_DIR || '/tmp') + '/N4_cook_toast.png'}).catch(() => {});
        await ctx.close();
    }
    // 決める段: 「かえる」（同じ画面のまま・元に戻すつき）。画面は動かさず、押す場所・押した指のまわりに重ねない。文の上を押すと下に届く
    for (const k of [0, 1, 2]){
        const {p, ctx} = await open({dishCount: 3}, {time: '2026-10-28T17:00:00+09:00'}); await hookToast(p);
        const bs = p.locator('button.swap[data-act=reroll]:visible'); const c = await bs.count();
        const sy0 = await p.evaluate(() => scrollY);
        await bs.nth(Math.min(k, c - 1)).click(); await p.waitForTimeout(400);
        const r = await toastCover(p);
        if (r.none){ ok(true, `N4-4 かえる(${k}) お知らせなし`); await ctx.close(); continue; }
        ok(!r.tappedHit && r.fingerClear && !r.lifted, `N4-4 かえる(${k}) のお知らせ（元に戻すつき）は、押した「かえる」・指のまわりに重ならず、お知らせのために画面を送らない: ` + JSON.stringify(r));
        ok(r.through && r.btnHit, `N4-4b かえる(${k}) お知らせの文の上を押すと下に届き、「元に戻す」は押せる: ` + JSON.stringify([r.through, r.btnHit]));
        if (k === 2) await p.screenshot({path: (process.env.SHOT_DIR || '/tmp') + '/N4_today_reroll_toast.png'}).catch(() => {});
        await ctx.close();
    }
    // 決めたあと（買う段に切りかわる）のお知らせが、主ボタン（2行）に重ならない
    {
        const {p, ctx} = await open({dishCount: 3}, {time: '2026-10-28T17:00:00+09:00'}); await hookToast(p);
        await p.click('button[data-act=decide]'); await p.waitForTimeout(500);
        const r2 = await toastCover(p);
        ok(r2.none || !r2.hit.length, 'N4-5 決めたあとのお知らせが押す場所に重ならない: ' + JSON.stringify(r2));
        await ctx.close();
    }
    // 家族のアレルギーのチップ: 押したあとに出る「設定に合わせて…かえました」が、チップに重ならない（S7_4_before）
    {
        const {p, ctx} = await open({dishCount: 3}, {time: '2026-10-28T17:00:00+09:00', touch: true});
        await p.click('button[data-act=settings]'); await p.waitForTimeout(400);
        await p.click('[data-act=fam-add]'); await p.waitForTimeout(400); await hookToast(p);
        const fm = () => p.locator('[data-fm]').last();
        let worst = null, n = 0;
        for (const [a, v] of [['fam-alg-fam', 'dairy'], ['fam-alg-fam', 'egg'], ['fam-alg-w', 'そば'], ['fam-alg-w', '大豆'], ['fam-alg-w', 'ごま']]){
            const e = fm().locator(`[data-act=${a}][data-v="${v}"]`); await e.scrollIntoViewIfNeeded(); await e.tap(); await p.waitForTimeout(350);
            const r = await toastCover(p); if (r.none) continue; n++;
            if ((r.tappedHit || !r.fingerClear || !r.through || r.lifted) && !worst) worst = Object.assign({v}, r);
        }
        ok(!worst, 'N4-6 家族のアレルギーのチップを続けて押しても、お知らせは押した指のまわり（続けて押すチップ）に重ならず、お知らせのために画面を送らず、文の上を押せば下に届く（出たお知らせ ' + n + '件）: ' + JSON.stringify(worst));
        await p.screenshot({path: (process.env.SHOT_DIR || '/tmp') + '/N4_fam_toast.png'}).catch(() => {});
        await ctx.close();
    }
}

// ---- N6 家族の「苦手」の一覧は畳まれない ----
if (want('N6')){
    const {p, ctx} = await open({dishCount: 3}, {touch: true});
    await p.click('button[data-act=settings]'); await p.waitForTimeout(400);
    await p.click('[data-act=fam-add]'); await p.waitForTimeout(400);
    const fm = () => p.locator('[data-fm]').last();
    const seq = ['ピーマン', 'なす', 'しいたけ', 'トマト'];
    const res = [];
    for (const v of seq){
        const e = fm().locator(`[data-act=fam-avoid][data-v="${v}"]`);
        const vis = await e.count() ? await e.first().isVisible() : false;
        if (!vis){ res.push(v + ':見えない'); continue; }
        await e.first().scrollIntoViewIfNeeded(); await p.waitForTimeout(100);
        const y0 = (await e.first().boundingBox()).y; await e.first().tap(); await p.waitForTimeout(350);
        const e2 = fm().locator(`[data-act=fam-avoid][data-v="${v}"]`);
        const y1 = await e2.count() && await e2.first().isVisible() ? (await e2.first().boundingBox()).y : null;
        res.push(`${v}:${Math.round(y0)}→${y1 === null ? '見えない' : Math.round(y1)}:${await e2.first().getAttribute('aria-pressed')}`);
    }
    const st = await p.evaluate(() => ({avoid: famMembers().slice(-1)[0].avoid, closed: [...document.querySelectorAll('[data-fm]:last-of-type details.avoid-more:not([open])')].length}));
    ok(res.every(x => /:true$/.test(x) && !/見えない/.test(x)), 'N6-1 苦手のチップを続けて4つ押せる（畳まれて見えなくならない）: ' + res.join(' / '));
    ok(res.every(x => { const m = x.match(/:(\d+)→(\d+):/); return m && Math.abs(+m[1] - +m[2]) <= 1; }), 'N6-2 押したチップの位置が変わらない: ' + res.join(' / '));
    ok(seq.every(v => st.avoid.some(a => a.includes(v) || v.includes(a))), 'N6-3 4つとも苦手に入る: ' + JSON.stringify(st.avoid));
    // なかまのチップ（豚肉など）も続けて押せる
    const e = fm().locator('[data-act=fam-avoid-fam]').first(); if (await e.isVisible()){ await e.scrollIntoViewIfNeeded(); await e.tap(); await p.waitForTimeout(300); }
    const after = await p.evaluate(() => [...document.querySelectorAll('[data-fm]')].pop().querySelectorAll('details.avoid-more:not(.fam-alg-more)').length);
    ok(after === 0, 'N6-4 苦手の一覧に「ほかの食材を見る」の畳みを作らない: ' + after);
    await p.screenshot({path: (process.env.SHOT_DIR || '/tmp') + '/N6_fam_avoid.png'}).catch(() => {});
    await ctx.close();
}

// ---- N7 記録の画面: 決めただけのとき ----
if (want('N7')){
    const {p, ctx} = await open({dishCount: 3}, {time: '2026-10-28T17:00:00+09:00'});
    await p.click('button[data-act=decide]'); await p.waitForTimeout(400);
    await p.click('nav.tabs [data-tab=log]'); await p.waitForTimeout(500);
    const r = await p.evaluate(() => ({today: (document.querySelector('#log-today') || {}).innerText || '', recent: (document.querySelector('#log-recent') || {}).innerText || '', hist: S.history.length}));
    ok(r.hist === 0, 'N7-0 決めただけでは記録しない（決めた≠作った）: ' + r.hist);
    ok(!/「この献立に決定」を押す/.test(r.recent), 'N7-1 決めたあとに「決定を押すと記録されます」と出さない: ' + r.recent.replace(/\n/g, '/'));
    ok(/記録して\s?おしまい|作り終え/.test(r.recent), 'N7-2 どうすれば記録されるか（作り終えて「記録して おしまい」）を書く: ' + r.recent.replace(/\n/g, '/'));
    ok(/まだ記録していません/.test(r.today), 'N7-3 今日の一膳の料理に「まだ記録していません」と出る: ' + r.today.replace(/\n/g, '/'));
    await p.screenshot({path: (process.env.SHOT_DIR || '/tmp') + '/N7_log.png'}).catch(() => {});
    // 作った料理は「記録済み」・最近作った料理にも出る
    const r2 = await p.evaluate(() => { const x = cookItems()[0]; record(x.r.id, x.slot); render(); return {today: document.querySelector('#log-today').textContent, recent: document.querySelector('#log-recent').textContent, name: x.r.name}; });
    ok(/記録済み/.test(r2.today) && r2.recent.includes(r2.name), 'N7-4 作った料理は「記録済み」で、最近作った料理にも出る: ' + r2.today.replace(/\n/g, '/'));
    await ctx.close();
}

await b.close();
if (errs.length){ console.log('ページのエラー:', [...new Set(errs)].slice(0, 5)); }
console.log(`panel-r3b: ${checks - fails}/${checks} 成功`);
process.exit(fails || errs.length ? 1 : 0);
