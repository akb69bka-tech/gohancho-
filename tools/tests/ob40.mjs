#!/usr/bin/env node
// 第40回（モニター第39回 v135 の、はじめての設定まわり）の回帰テスト
//  使い方: node tools/tests/ob40.mjs [http://localhost:9191/]
//  H1（R178）はじめての献立の「アレルギーや苦手な食材がある方は…［設定］［×］」: 「献立を見る」のすぐあと（1秒以内）に、最初の画面の中に出る。
//     幅 195/260/320/360/390/430 × 文字3段階。料理（器・名前・かえる）と丸い「まるごと入れ替え」に重ならず、お膳より上に出さない。
//     「準備ができました」のお知らせと重ならない。読み上げ（aria-live="polite"）で1回だけ知らせる（描き直しても2回目は言わない）
//  H2（R186）案内の「設定」で設定を見て、何もせずに戻ると案内は残る。苦手を1つ入れても残る。アレルギーか食の決まりを入れたら消える。×で消える
//  H3（R180）使い方を選んでから「スキップ」→ 選んだ使い方のまま献立へ
//  H4（R181）家族5人のうち1人だけ卵アレルギー: 「…に合わない料理があります」には、当たる人の名前だけ（全員を並べない）
//  H5（R182）使い方の画面: 360×640・文字大きい/もっと大きいで、5つの選択肢と「献立を見る」が1画面に入る。195 でも1つめ〜の選択肢と帯が見える
//  H6（R183）1つめの画面の右上に文字の大きさ（A / A+ / A++）。押すと文字の大きさの設定（S.settings.textSize）が変わる。はじめての画面の字は 12px 以上
//  H7（R188）使い方は radio のまとまり（矢印キーで動く・選んだ1つだけ Tab で止まる）。「献立を見る」のあと、焦点は「今日の献立」の見出しへ
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const HINT = 'アレルギーや苦手な食材がある方は、ここから設定できます';
const ctxOf = async (o, tag) => {
    const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, locale: o.locale || 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: !!o.touch });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('ob40', tag)));
    if (o.state) await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, o.state);
    // 読み上げの知らせ（aria-live のある所に入った字）を数える
    await ctx.addInitScript(() => { window.__live = []; const seen = new WeakMap();
        const look = () => document.querySelectorAll('[aria-live]:not([aria-live=off]), [role=status], [role=alert]').forEach(e => { const tx = (e.textContent || '').trim(); if (tx && seen.get(e) !== tx){ seen.set(e, tx); window.__live.push(tx); } else if (!tx) seen.set(e, ''); });
        document.addEventListener('DOMContentLoaded', () => new MutationObserver(look).observe(document.body, { childList: true, subtree: true, characterData: true })); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 30000 }).catch(() => {});
    return { p, ctx };
};
const toMode = async (p, cc = 'JP') => {
    await p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 });
    await pickCountry(p, cc);
    await p.waitForSelector('#sheet-root [data-act=ob-mode]', { timeout: 30000 }); await p.waitForTimeout(150);
};
const done = async p => {
    await p.click('#sheet-root [data-act=ob-done]');
    await p.waitForFunction(() => S.onboarded === true && !sheet && session.menu && document.querySelector('#view .tray'), null, { timeout: 30000 });
};
// 見えている案内（画面の中にあるもの）の位置
const hintGeo = p => p.evaluate(() => {
    const vw = document.documentElement.clientWidth, nav = document.querySelector('nav.tabs'), navTop = nav ? nav.getBoundingClientRect().top : innerHeight;
    const hs = [...document.querySelectorAll('.alg-hint')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    if (!hs.length) return { none: true };
    const h = hs[0], r = h.getBoundingClientRect(), tr = document.querySelector('#view .tray').getBoundingClientRect();
    const hit = (a, c) => a.left < c.right - .5 && c.left < a.right - .5 && a.top < c.bottom - .5 && c.top < a.bottom - .5;
    // 料理（器・名前・かえる・札）と丸いボタン。見えている所だけ（画面の外・タブの裏は数えない）
    // 重なり: 上の段の器・名前（row0）、上の段のかえる・丸いボタン（mid）、下の段（low）に分けて数える
    const row0 = document.querySelector('#view .tray .tg-row');
    const cover = [...document.querySelectorAll('#view .tray .spot .vessel, #view .tray .spot .nm, #view .tray .spot .swap:not(.swap-ph), #view .tray .spot .alg-tag, #view .tray .shuffle')].filter(e => { const q = e.getBoundingClientRect(); return q.height && q.top < navTop && q.bottom > 0 && hit(r, q); })
        .map(e => (row0.contains(e) ? (e.matches('.swap') ? 'mid:' : 'row0:') : e.matches('.shuffle') ? 'mid:' : 'low:') + (e.className.baseVal || e.className).split(' ')[0]);
    const btns = [...h.querySelectorAll('button')].map(e => { const q = e.getBoundingClientRect(); return { w: Math.round(q.width), h: Math.round(q.height), out: q.left < -.5 || q.right > vw + .5 || q.top < -.5 || q.bottom > navTop + .5 }; });
    const tx = h.querySelector('.ah-tx'), txt = tx ? tx.textContent : '';
    const toast = document.querySelector('#toast-root .toast'), tr2 = toast && toast.getBoundingClientRect();
    return { n: hs.length, top: Math.round(r.top), bottom: Math.round(r.bottom), navTop: Math.round(navTop), trayTop: Math.round(tr.top), inView: r.top >= -.5 && r.bottom <= navTop + .5 && r.left >= -.5 && r.right <= vw + .5,
        cover, btns, txt, sw: document.documentElement.scrollWidth > vw + 1, txOver: !!tx && (tx.scrollWidth > tx.clientWidth + 1 || tx.scrollHeight > tx.clientHeight + 1), toastHit: !!(tr2 && hit(r, tr2)), scrollY: Math.round(scrollY), barStatic: document.body.classList.contains('bar-static') };
});

// ---- H1 すぐに・最初の画面に出る ----
if (want('H1')){
    const bad = []; let n = 0;
    const SIZES = [[195, 422], [260, 560], [320, 568], [360, 640], [390, 844], [430, 932]];
    for (const [w, h] of SIZES) for (const ts of [0, 1, 2]){
        const { p, ctx } = await ctxOf({ w, h, touch: true }, `h1-${w}-${ts}`);
        await p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 });
        await p.evaluate(ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); }, ts);
        await toMode(p);
        const t0 = Date.now(); await done(p);
        await p.waitForFunction(() => [...document.querySelectorAll('.alg-hint')].some(e => e.getClientRects().length), null, { timeout: 1500 }).catch(() => {});
        const dt = Date.now() - t0; await p.waitForTimeout(250);
        const g = await hintGeo(p); n++;
        // 帯をお膳の下に置く画面（bar-static: お膳が最初の画面に入りきらず、下の段はもともとタブの裏に切れている）では、案内は下のタブの上に貼りつく。
        // そこでも上の段の器・名前には重ねない。幅260以上では上の段のかえる・丸いボタンにも重ねない（195 は上の段がやっと入る高さなので、かえる・丸いボタンの下の方にかかるのは許す）。
        // 帯がいつもの場所にある画面では、何にも重ねない
        const badCover = g.cover && g.cover.filter(c => !g.barStatic || c.startsWith('row0:') || w >= 260 && c.startsWith('mid:'));
        if (g.none || dt > 1500 || !g.inView || badCover.length || g.top < g.trayTop || g.sw || g.txOver || g.toastHit || !g.btns.every(x => x.h >= 40 && x.w >= 40 && !x.out)) bad.push(`${w}x${h} 文字${ts}: ` + JSON.stringify({ dt, ...g }));
        await ctx.close();
    }
    ok(n === 18 && !bad.length, `H1 幅195/260/320/360/390/430 × 文字3段階（${n}画面）: 「献立を見る」のすぐあとに案内が最初の画面に出て、料理・丸いボタン・お知らせに重ならず、お膳より上に出ない: ` + bad.slice(0, +(process.env.NBAD || 3)).join(' / '));
    // 読み上げで1回だけ知らせる
    {
        const { p, ctx } = await ctxOf({}, 'h1live');
        await toMode(p); await done(p); await p.waitForTimeout(1500);
        await p.evaluate(() => { render(); }); await p.waitForTimeout(300); await p.evaluate(() => { render(); }); await p.waitForTimeout(300);
        const r = await p.evaluate(HINT => ({ said: window.__live.filter(x => x.includes(HINT)).length, live: [...document.querySelectorAll('[aria-live=polite]')].some(e => e.textContent.includes(HINT)) || [...document.querySelectorAll('[aria-live=polite]')].length }), HINT);
        ok(r.said === 1, 'H1 案内は読み上げ（aria-live="polite"）で1回だけ知らせる（描き直しても2回目は言わない）: ' + JSON.stringify(r));
        await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, { timeout: 30000 }); await p.waitForTimeout(600);
        const r2 = await p.evaluate(HINT => ({ said: window.__live.filter(x => x.includes(HINT)).length, shown: [...document.querySelectorAll('.alg-hint')].some(e => e.getClientRects().length) }), HINT);
        ok(r2.shown && r2.said === 0, 'H1 開き直したときは案内は見えるが、もう読み上げない: ' + JSON.stringify(r2));
        await ctx.close();
    }
}

// ---- H2 消える条件 ----
if (want('H2')){
    const shown = p => p.evaluate(() => [...document.querySelectorAll('#view .alg-hint')].some(e => e.getClientRects().length));
    const back = async p => { await p.click('nav.tabs [data-tab=today]'); await p.waitForFunction(() => tab === 'today' && document.querySelector('#view .tray'), null, { timeout: 10000 }); await p.waitForTimeout(300); };
    {
        const { p, ctx } = await ctxOf({}, 'h2');
        await toMode(p); await done(p); await p.waitForTimeout(400);
        await p.click('#view .alg-hint [data-act=alg-hint-open] >> visible=true', { timeout: 8000 }).catch(() => p.evaluate(() => document.querySelector('#view [data-act=alg-hint-open]') && document.querySelector('#view [data-act=alg-hint-open]').click()));
        await p.waitForFunction(() => tab === 'settings', null, { timeout: 10000 }); await p.waitForTimeout(400);
        await back(p);
        ok(await shown(p), 'H2 「設定」で設定を見て、何もせずに戻ると案内は残る');
        await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, { timeout: 30000 }); await p.waitForTimeout(400);
        ok(await shown(p), 'H2 開き直しても案内は残る');
        await p.evaluate(() => { S.settings.avoid = ['ピーマン']; save(); reconcileMenu(); render(); }); await p.waitForTimeout(300);
        ok(await shown(p), 'H2 苦手を1つ入れただけでは案内は消えない（アレルギーの入口のまま）');
        await p.evaluate(() => setGo('allergy-card'));
        await p.waitForFunction(() => tab === 'settings', null, { timeout: 10000 }); await p.waitForTimeout(400);
        await p.click('#allergy-card [data-act=alg-toggle][data-v=egg]'); await p.waitForTimeout(300);
        await back(p);
        ok(!(await shown(p)), 'H2 アレルギーを入れたら案内は消える');
        await p.evaluate(() => { S.settings.allergens = []; save(); reconcileMenu(); render(); }); await p.waitForTimeout(300);
        ok(!(await shown(p)), 'H2 アレルギーを外しても、消えた案内は戻らない');
        await ctx.close();
    }
    {
        const { p, ctx } = await ctxOf({}, 'h2diet');
        await toMode(p); await done(p); await p.waitForTimeout(400);
        await p.evaluate(() => { S.settings.avoid = dietBundleToggle(S.settings.avoid, 'halal', S.settings); save(); reconcileMenu(); render(); }); await p.waitForTimeout(300);
        ok(!(await shown(p)), 'H2 食の決まり（ハラール向け）を入れたら案内は消える');
        await ctx.close();
    }
    {
        const { p, ctx } = await ctxOf({}, 'h2fam');
        await toMode(p); await done(p); await p.waitForTimeout(400);
        await p.evaluate(() => { S.family = [{ id: 'fa', name: '夫', role: 'adult', avoid: ['@egg'], allergy: ['@egg'], mild: false }]; save(); reconcileMenu(); render(); }); await p.waitForTimeout(300);
        ok(!(await shown(p)), 'H2 家族のアレルギーを入れたら案内は消える');
        await ctx.close();
    }
    {
        const { p, ctx } = await ctxOf({}, 'h2x');
        await toMode(p); await done(p); await p.waitForTimeout(400);
        await p.click('#view .alg-hint [data-act=alg-hint-close] >> visible=true', { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(300);
        ok(!(await shown(p)), 'H2 ×で消える');
        await ctx.close();
    }
}

// ---- H3 スキップで選んだ使い方を残す ----
if (want('H3')) for (const k of ['ten', 'diet']){
    const { p, ctx } = await ctxOf({}, 'h3' + k);
    await toMode(p);
    await p.click(`#sheet-root [data-act=ob-mode][data-v=${k}]`);
    await p.click('#sheet-root [data-act=ob-skipstep]');
    await p.waitForFunction(() => S.onboarded === true && !sheet && document.querySelector('#view .tray'), null, { timeout: 30000 }); await p.waitForTimeout(300);
    const s = await p.evaluate(() => ({ mood: session.mood, diet: !!S.settings.diet, sv: S.settings.servings, dc: S.settings.dishCount }));
    ok(k === 'diet' ? s.diet && s.mood === 'all' : s.mood === k && !s.diet, `H3 ${k} を選んでスキップ → 選んだ使い方のまま献立へ: ` + JSON.stringify(s));
    await ctx.close();
}

// ---- H4 合わない料理の文は、当たる家族だけ ----
if (want('H4')){
    const fam = (eggs, milk) => ['長男', '次男', '長女', '祖母', '夫'].map((nm, i) => ({ id: 'f' + i, name: nm, role: 'adult', avoid: [...(eggs.includes(nm) ? ['@egg'] : []), ...(milk.includes(nm) ? ['@dairy'] : [])], allergy: [...(eggs.includes(nm) ? ['@egg'] : []), ...(milk.includes(nm) ? ['@dairy'] : [])], mild: false }));
    for (const [label, eggs, milk, kinds, want_] of [
        ['卵1人', ['長女'], [], ['egg'], ['長女']],
        ['卵1人・乳1人で卵の料理', ['長女'], ['夫'], ['egg'], ['長女']],
        ['卵1人・乳1人で両方の料理', ['長女'], ['夫'], ['egg', 'milk'], ['長女', '夫']],
    ]){
        const { p, ctx } = await ctxOf({ state: { onboarded: true, firstUse: '2026-10-01', settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2, avoid: [] }, family: fam(eggs, milk) } }, 'h4' + label);
        await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, { timeout: 30000 }); await p.waitForTimeout(300);
        const r = await p.evaluate(async kinds => {
            const ALL = ['egg', 'milk'], hits = r => { const a0 = S.settings.allergens, f0 = S.family; S.family = []; S.settings.allergens = ALL; try{ return algSelectedHits(r, ALL); } finally { S.settings.allergens = a0; S.family = f0; } };
            const it = session.menu.items;
            // 当てたいアレルゲンを、主菜（と副菜）に入れる
            const pick = (slot, want) => RECIPES.find(r => !r.pack && slotOf(r) === slot && JSON.stringify(hits(r).sort()) === JSON.stringify(want.slice().sort()));
            if (kinds.length === 1){ const e = pick(slotOf(it[0].r), kinds); if (!e) return null; it[0].r = e; }
            else { const e = pick(slotOf(it[0].r), [kinds[0]]), d = pick(slotOf(it[1].r), [kinds[1]]); if (!e || !d) return null; it[0].r = e; it[1].r = d; }
            keepDraft(); render(); await new Promise(res => setTimeout(res, 200));
            const line = (document.querySelector('#view .eaters-line') || {}).textContent || '';
            return { line, el: eatersLine() };
        }, kinds);
        const m = r && /([^\n]*)に合わない料理があります/.exec(r.el);
        const names = m ? m[1].split(/[・、,]/).map(x => x.trim()).filter(Boolean) : null;
        ok(names && JSON.stringify(names.slice().sort()) === JSON.stringify(want_.slice().sort()) && r.line.includes(m[0]), `H4 ${label}: 「…に合わない料理があります」は当たる人（${want_.join('・')}）だけ: ` + JSON.stringify(r));
        // 決めたあとの帯の ⚠ の1行も同じ（S.cook に今の献立を入れる。決める操作と同じ形）
        const w = await p.evaluate(() => { const m = session.menu; S.cook = { d: TODAY, ids: menuIds(), slots: m.items.filter(x => x.r).map(x => x.slot), done: {}, seat: 1 }; return algWarnLine(); });
        const m2 = /([^\n]*)に合わない料理があります/.exec(w || '');
        const n2 = m2 ? m2[1].split(/[・、,]/).map(x => x.trim()).filter(Boolean) : null;
        ok(n2 && JSON.stringify(n2.slice().sort()) === JSON.stringify(want_.slice().sort()), `H4 ${label}: 決めたあとの帯の ⚠ の1行も当たる人だけ: ` + w);
        await ctx.close();
    }
}

// ---- H5 使い方の画面がつまって1画面に入る ----
if (want('H5')){
    const geo = p => p.evaluate(() => {
        const sh = document.querySelector('#sheet-root .sheet'), vh = innerHeight, vw = document.documentElement.clientWidth;
        const rows = [...sh.querySelectorAll('[data-act=ob-mode]')], go = sh.querySelector('[data-act=ob-done]').getBoundingClientRect();
        const inV = r => r.top >= -.5 && r.bottom <= vh + .5 && r.left >= -.5 && r.right <= vw + .5;
        const foot = sh.querySelector('.ob-actions').getBoundingClientRect();
        const vis = rows.filter(e => { const r = e.getBoundingClientRect(); return inV(r) && r.bottom <= foot.top + .5; }).length;
        return { vis, n: rows.length, go: inV(go), over: rows.some(e => e.scrollWidth > e.clientWidth + 1), low: rows.some(e => e.getBoundingClientRect().height < 44), scrollTop: sh.scrollTop };
    });
    for (const [w, h, ts, need] of [[360, 640, 1, 5], [360, 640, 2, 5], [320, 568, 1, 5], [390, 844, 2, 5], [195, 422, 2, 3], [195, 422, 0, 3]]){
        const { p, ctx } = await ctxOf({ w, h, touch: true }, `h5-${w}-${ts}`);
        await p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 });
        await p.evaluate(ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); }, ts);
        await toMode(p); await p.waitForTimeout(300);
        const g = await geo(p);
        ok(g.vis >= need && g.go && !g.over && !g.low, `H5 ${w}×${h} 文字${ts}: 使い方の選択肢 ${need} つ以上と「献立を見る」が1画面に入る: ` + JSON.stringify(g));
        await ctx.close();
    }
    // 195 の国の画面: 文字ふつうでは国のボタンが1つ、下の「次へ」の帯の上に全部見える。もっと大きいでも1つめの上の部分（16px 以上）が見える（その下に国が並ぶとわかる）
    for (const ts of [0, 2]){
        const { p, ctx } = await ctxOf({ w: 195, h: 422, touch: true }, `h5cc-${ts}`);
        await p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 });
        await p.evaluate(ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); }, ts);
        await p.click('#sheet-root [data-act=cc-tab][data-ccs~="JP"]'); await p.waitForTimeout(300);
        const g = await p.evaluate(() => { const sh = document.querySelector('#sheet-root .sheet'), foot = sh.querySelector('.ob-actions').getBoundingClientRect();
            const c0 = sh.querySelector('[data-act=cc-choose]').getBoundingClientRect();
            return { vis: [...sh.querySelectorAll('[data-act=cc-choose]')].filter(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= foot.top + .5; }).length, peek: Math.round(foot.top - c0.top) }; });
        ok(ts === 0 ? g.vis >= 1 : g.peek >= 16, `H5 195×422 文字${ts} 国の画面: 国のボタンがスクロールせずに見える（もっと大きいは1つめの上の部分）: ` + JSON.stringify(g));
        await ctx.close();
    }
}

// ---- H6 文字の大きさ（1つめの画面） ----
if (want('H6')){
    for (const w of [195, 390]){
        const { p, ctx } = await ctxOf({ w, h: w < 300 ? 422 : 844, touch: true }, 'h6' + w);
        await p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 }); await p.waitForTimeout(200);
        const c = await p.evaluate(() => {
            const sh = document.querySelector('#sheet-root .sheet'), bs = [...sh.querySelectorAll('[data-act=ob-ts]')], sr = sh.getBoundingClientRect(), vw = document.documentElement.clientWidth;
            const grp = bs[0] && bs[0].closest('[role=group]'), gr = grp && grp.getBoundingClientRect();
            return { n: bs.length, labels: bs.map(e => e.textContent.trim()), pressed: bs.map(e => e.getAttribute('aria-pressed')), names: bs.map(e => e.getAttribute('aria-label')), grp: grp && grp.getAttribute('aria-label'),
                topRight: !!gr && gr.top < sr.top + 90 && gr.right >= sr.right - 24 && gr.left > sr.left + sr.width * .2 && bs.every(e => { const r = e.getBoundingClientRect(); return r.right <= vw + .5 && r.left >= 0; }), small: bs.some(e => { const r = e.getBoundingClientRect(); return r.width < 40 || r.height < 40; }) };
        });
        ok(c.n === 3 && JSON.stringify(c.labels) === '["A","A+","A++"]' && JSON.stringify(c.pressed) === '["true","false","false"]' && c.grp && c.names.every(Boolean) && c.topRight && !c.small, `H6 ${w}px: 1つめの画面の右上に A / A+ / A++（読み上げの名前つき・押せる大きさ）: ` + JSON.stringify(c));
        await p.click('#sheet-root [data-act=ob-ts][data-v="2"]', { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(200);
        const s = await p.evaluate(() => ({ ts: S.settings.textSize, attr: document.documentElement.getAttribute('data-ts'), pressed: [...document.querySelectorAll('#sheet-root [data-act=ob-ts]')].map(e => e.getAttribute('aria-pressed')), cc: !!document.querySelector('#sheet-root [data-act=cc-choose]') }));
        ok(s.ts === 2 && s.attr === '2' && JSON.stringify(s.pressed) === '["false","false","true"]' && s.cc, `H6 ${w}px: A++ で文字の大きさの設定が「もっと大きい」になる（同じ画面のまま）: ` + JSON.stringify(s));
        await p.click('#sheet-root [data-act=ob-ts][data-v="0"]', { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(200);
        const s0 = await p.evaluate(() => ({ ts: S.settings.textSize, attr: document.documentElement.getAttribute('data-ts') }));
        ok(s0.ts === undefined && s0.attr === null, `H6 ${w}px: A でふつうに戻る: ` + JSON.stringify(s0));
        await ctx.close();
    }
    // 字の大きさ: はじめての2つの画面の字は 12px 以上（幅195・390 × 文字ふつう）
    const bad = [];
    for (const w of [195, 390]) for (const lang of ['ja', 'en']){
        const { p, ctx } = await ctxOf({ w, h: w < 300 ? 422 : 844, locale: lang === 'ja' ? 'ja-JP' : 'en-US' }, `h6fs-${w}-${lang}`);
        await p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 }); await p.waitForTimeout(200);
        const small = () => p.evaluate(() => { const out = []; const sh = document.querySelector('#sheet-root .sheet'); const tw = document.createTreeWalker(sh, NodeFilter.SHOW_TEXT);
            for (let n; (n = tw.nextNode());){ const e = n.parentElement; if (!n.data.trim() || !e.getClientRects().length || e.closest('.vh,[hidden]')) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11.95) out.push(n.data.trim().slice(0, 10) + ':' + fs); } return out; });
        const a = await small();
        await p.click(`#sheet-root [data-act=cc-tab][data-ccs~="${lang === 'ja' ? 'JP' : 'US'}"]`); await pickCountry(p, lang === 'ja' ? 'JP' : 'US'); await p.waitForSelector('#sheet-root [data-act=ob-mode]'); await p.waitForTimeout(200);
        const c = await small();
        if (a.length || c.length) bad.push(`${w} ${lang}: ` + JSON.stringify([a.slice(0, 4), c.slice(0, 4)]));
        await ctx.close();
    }
    ok(!bad.length, 'H6 はじめての画面の字は 12px 以上: ' + bad.join(' / '));
}

// ---- H7 キーボード・読み上げ ----
if (want('H7')){
    const { p, ctx } = await ctxOf({}, 'h7');
    await toMode(p);
    const g = await p.evaluate(() => { const rs = [...document.querySelectorAll('#sheet-root [data-act=ob-mode]')]; return { grp: !!rs[0].closest('[role=radiogroup]'), roles: rs.every(e => e.getAttribute('role') === 'radio'), tabs: rs.map(e => e.tabIndex), last: rs[rs.length - 1].dataset.v }; });
    const NM = g.tabs.length, tabsAt = k => JSON.stringify(Array.from({length: NM}, (_, j) => j === k ? 0 : -1));   // dm41: 糖質ひかえめが増えて6つ（数は画面から）
    ok(g.grp && g.roles && JSON.stringify(g.tabs) === tabsAt(0) && NM >= 5, 'H7 使い方は radio のまとまりで、選んだ1つだけが Tab で止まる: ' + JSON.stringify(g));
    await p.focus('#sheet-root [data-act=ob-mode][data-v=all]');
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150);
    const a1 = await p.evaluate(() => ({ f: document.activeElement && document.activeElement.dataset.v, on: [...document.querySelectorAll('#sheet-root [data-act=ob-mode][aria-checked=true]')].map(e => e.dataset.v), tabs: [...document.querySelectorAll('#sheet-root [data-act=ob-mode]')].map(e => e.tabIndex) }));
    ok(a1.f === 'ten' && JSON.stringify(a1.on) === '["ten"]' && JSON.stringify(a1.tabs) === tabsAt(1), 'H7 ↓ で次の選択肢へ動き、選ばれる: ' + JSON.stringify(a1));
    await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(150);
    const a2 = await p.evaluate(() => ({ f: document.activeElement && document.activeElement.dataset.v, on: [...document.querySelectorAll('#sheet-root [data-act=ob-mode][aria-checked=true]')].map(e => e.dataset.v) }));
    ok(a2.f === g.last && JSON.stringify(a2.on) === JSON.stringify([g.last]), 'H7 ↑ で前へ（先頭からは最後へ回る）: ' + JSON.stringify(a2));
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
    const a3 = await p.evaluate(() => document.activeElement && document.activeElement.dataset.v);
    ok(a3 === 'all', 'H7 → でも次へ（最後からは先頭へ）: ' + a3);
    await p.focus('#sheet-root [data-act=ob-done]'); await p.keyboard.press('Enter');
    await p.waitForFunction(() => S.onboarded === true && !sheet && document.querySelector('#view .tray'), null, { timeout: 30000 }); await p.waitForTimeout(500);
    const f = await p.evaluate(() => { const a = document.activeElement; return { tag: a && a.tagName, tx: a && a.textContent.trim().slice(0, 12), head: !!(a && a.closest('.today-head')), y: Math.round(scrollY) }; });
    ok(f.head && f.tag === 'H2', 'H7 「献立を見る」のあと、焦点は「今日の献立」の見出しへ（ページの先頭ではない）: ' + JSON.stringify(f));
    await ctx.close();
}

ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`ob40: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
