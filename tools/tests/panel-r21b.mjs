#!/usr/bin/env node
// 利用者モニター 第21回・第22回の直し（画面・三宅）。Playwright。使い方: node tools/tests/panel-r21b.mjs [http://localhost:8999/]
//  （panel-r18b と同じ準備。panel-r18b が run-all の1項目の上限 900 秒に近いので、別のファイルにした）
//  R72: 今日の献立の画面の「元に戻す」付きのお知らせ（1品の「これにする」・家族リクエストの「入れかえる」・決めた献立の作り直し）は、見出しの行（今日の献立・条件のボタン）に1行で重ねる（見出しの行が画面の外なら、料理にかからない高さ）。
//       料理の絵・料理名・↻・札・まるごと入れ替え・「✓ 決めた」にかからない。「元に戻す」は見えて押せる（195/360/375/390/430 × 文字ふつう/もっと大きい）
//  R73: まるごと入れ替えの丸と、↻・料理の絵のすき間が 8px 以上（195/360/375/390/430 × 文字ふつう/もっと大きい）
//  R81: 幅195px で、4品（上の段が3列）の日に決めた直後のお知らせが、料理名・↻・札・「買い物メモを見る」にかからない（文字3段階 × 家族 × 上/スクロールした位置）
//  第22回:
//  R94: ↻（候補の「これにする」・その場でかえる）のあとの「元に戻す」の帯は、見出し「今日の献立」と条件のボタンも隠さない（画面のいちばん上の帯に出る）。
//       字は何をかえたかが分かる文（料理名が入る。入らないときは料理名を短くして「…」）。料理の絵・料理名・↻にもかからない。「元に戻す」は押せる
//  R93: 幅195px のはじめての設定で、見出し「何人分つくりますか」が1行（文字3段階）。「苦手な食材はありますか」は2行まで
//  第23回:
//  R99: 幅195px でも「元に戻す」の帯が国旗・設定のボタンを隠さない（R21-1・R22-1 で上の帯のボタンも数える。家族リクエストを上の帯に上げた形でも）
//  R100: 幅195px のはじめての設定の2つめで、人数のボタンの1段目が下の「もどる／次へ」の帯より上に見える（文字3段階）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);   // ONLY=R18-1,R18-3 で項目を絞る
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const CC = {ja: 'JP', ko: 'KR', en: 'US', de: 'DE', fr: 'FR', it: 'IT', ar: 'EG', es: 'ES', fil: 'PH', tr: 'TR', pl: 'PL', th: 'TH', 'zh-Hans': 'CN', vi: 'VN', 'pt-BR': 'BR', hi: 'IN', id: 'ID'};
const FAM_ALG = {ja: ['fish'], ko: ['shrimp', 'crab', 'fish']};
// o: {w, h, lang, ts, fam, dc, sv, dark, wants}
const open = async (o, tag) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: o.h || 844}, colorScheme: o.dark ? 'dark' : 'light', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r21', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    const lang = o.lang || 'ja', alg = o.fam ? (FAM_ALG[lang] || ['fish']) : null;
    await p.addInitScript(([cc, lang, ts, alg, dc, sv]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', family: alg ? [{id: 'f1', name: lang === 'ja' ? '夫' : 'A', role: 'adult', avoid: alg.map(x => '@' + x), allergy: alg.map(x => '@' + x), mild: false}] : [], settings: {country: cc, uiLang: lang, dishCount: dc || 4, servings: sv || 3, textSize: ts || undefined}})); } }, [CC[lang], lang, o.ts || 0, alg, o.dc, o.sv]);
    await p.clock.setFixedTime(new Date('2026-10-30T12:15:00+09:00'));   // お昼（あいさつが長い）
    await p.goto(URL_); await ready(p);
    if (lang !== 'ja') await p.waitForFunction(cc => typeof PACK !== 'undefined' && PACK && PACK.country === cc, CC[lang], {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    if (o.wants) await p.evaluate(() => { const w = RECIPES.find(x => slotOf(x) === '主菜' && !isAvoided(x)); S.wants = w ? [{id: w.id, at: TODAY, n: famMembers()[0] ? famMembers()[0].name : '夫', m: 0}] : []; render(); });
    await p.evaluate(() => {
        window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        window.__tabTop = () => document.querySelector('nav.tabs').getBoundingClientRect().top;
        window.__still = () => document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });
        // 段ごとの器・名前・かえる・札の下端と、タブの裏に入ったもの
        window.__rows = () => { __still(); const tabTop = __tabTop(); return [...document.querySelectorAll('#view .tray .tg-row')].map(row => { const parts = [...row.querySelectorAll('.spot .vessel, .spot .nm, .spot .swap:not(.swap-ph), .spot .alg-tag')]; return {max: Math.round(Math.max(...parts.map(e => e.getBoundingClientRect().bottom))), hid: parts.filter(e => e.getBoundingClientRect().bottom > tabTop + .5 || e.getBoundingClientRect().top < -.5).map(e => (e.className || '').split(' ')[0] + ':' + Math.round(e.getBoundingClientRect().bottom)), tags: row.querySelectorAll('.alg-tag').length}; }); };
        window.__bar = () => { const bt = document.querySelector('#view .actionbar [data-act=decide]'); if (!bt) return null; const q = bt.getBoundingClientRect(); return {bottom: Math.round(q.bottom), tabTop: Math.round(__tabTop()), hidden: q.bottom > __tabTop() + .5}; };
        // お知らせが重なるもの（器の絵は別に数える）
        window.__toastCover = () => { const box = document.querySelector('#toast-root .toast'); if (!box) return {none: true, cover: [], vessels: 0}; const R = box.getBoundingClientRect(); const ov = q => q.width > 1 && q.height > 1 && q.bottom > R.top + .5 && q.top < R.bottom - .5 && q.right > R.left + .5 && q.left < R.right - .5;
            const list = [], tabTop = __tabTop(); let vessels = 0;
            document.querySelectorAll('#view .spot .nm, #view .spot .alg-tag, #view .spot .swap:not(.swap-ph), #view .tg-mid .shuffle, #view .actionbar button, #view .p2-ok, #view .p2-sv, header.top h1, header.top .gear, .req-btn, #view button, #view [data-act]').forEach(e => { if (getComputedStyle(e).visibility === 'hidden' || e.closest('#toast-root')) return; let q = e.getBoundingClientRect(); if (e.matches('.nm')){ const g = document.createRange(); g.selectNodeContents(e); q = g.getBoundingClientRect(); } if (q.top >= tabTop - .5) return; if (!ov(q)) return; if (e.matches('.vessel')){ vessels++; return; } list.push((e.className || e.tagName).toString().split(' ')[0] + ':' + (e.textContent || '').trim().slice(0, 8) + ':' + Math.round(q.top) + '-' + Math.round(q.bottom)); });
            return {top: Math.round(R.top), bottom: Math.round(R.bottom), h: Math.round(R.height), cls: box.className, text: box.textContent.trim().slice(0, 40), cover: [...new Set(list)], vessels}; };
        // 押した指の記録つきで押す（toastPlace は最後に押した場所を見る）
        window.__tap = (sel, act) => { const bt = document.querySelector(sel); if (!bt) return false; const q = bt.getBoundingClientRect(); TOAST_TAP.y = q.top + 5; TOAST_TAP.at = performance.now(); TOAST_TAP.box = q; TOAST_TAP.act = act || ''; TOAST_TAP.tapView = TOAST_TAP.view; TOAST_TAP.layer = false; bt.click(); return true; };
    });
    return {p, ctx};
};

const DISH = '#view .spot .vessel, #view .spot .nm, #view .spot .swap:not(.swap-ph), #view .spot .alg-tag, #view .spot .swap-line, #view .tg-mid .shuffle, #view .p2-ok, header.top button, header.top [data-act]';   // 第23回 R99: 上の帯のボタン（国旗・設定・家族リクエスト）にもかからない
// お知らせが重なる料理の絵・料理名・↻・札・丸・印と、「元に戻す」が見えて押せるか
const undoMeasure = (sel) => { const t = document.querySelector('#toast-root .toast'); if (!t) return {none: true}; const a = t.getBoundingClientRect();
    const ov = q => a.left < q.right - 1 && a.right > q.left + 1 && a.top < q.bottom - 1 && a.bottom > q.top + 1;
    const hits = [...document.querySelectorAll(sel)].filter(e => { const q = e.getBoundingClientRect(); return q.width > 1 && ov(q); }).map(e => e.className.split(' ')[0] + ':' + (e.textContent || '').trim().slice(0, 8));
    const bt = t.querySelector('[data-act=toast-undo]'), bq = bt && bt.getBoundingClientRect(), at = bq && document.elementFromPoint((bq.left + bq.right) / 2, (bq.top + bq.bottom) / 2);
    return {cls: t.className, top: Math.round(a.top), h: Math.round(a.height), hits, undo: !!bt, inView: a.top >= 0 && a.bottom <= innerHeight, clickable: !!(bt && at && (at === bt || bt.contains(at)))}; };

// R21-1（R72）1ページで 1品の「これにする」（上の段・下の段）→ 家族リクエストの「入れかえる」→ 決めた献立の作り直し の順に
for (const [w, h] of [[195, 422], [360, 740], [375, 667], [390, 844], [430, 932]]) for (const ts of [0, 2]) {
    if (!want('R21-1')) break;
    const {p, ctx} = await open({w, h, lang: 'ja', ts, dc: w === 195 ? 3 : 4, sv: 2}, `r72-${w}-${ts}`);
    const out = [];
    const after = async (kind) => { await p.waitForTimeout(450); const r = await p.evaluate(undoMeasure, DISH); r.kind = kind; out.push(r); await p.evaluate(() => { if (toast.hide) toast.hide(); tapGuard = 0; window.scrollTo(0, 0); }); await p.waitForTimeout(150); };
    await p.evaluate(() => { window.__swapDirect = false; window.scrollTo(0, 0); });
    for (const k of ['first', 'last']) {
        // 上の段の最初・下の段の最後の↻から。候補に「これにする」がない料理なら、となりの↻で
        const n0 = await p.locator('#view [data-act="reroll"]').count(), order = [...Array(n0).keys()]; if (k === 'last') order.reverse();
        let picked = false;
        for (const i of order){ await p.locator('#view [data-act="reroll"]').nth(i).click(); await p.waitForTimeout(400);
            if (await p.locator('#sheet-root [data-act="swap-pick"]').count()){ await p.locator('#sheet-root [data-act="swap-pick"]').first().click(); picked = true; break; }
            await p.evaluate(() => { if (sheet) closeSheet(); tapGuard = 0; }); await p.waitForTimeout(200); }
        if (picked) await after('swap-' + k); else out.push({kind: 'swap-' + k, none: true, err: '「これにする」なし'});
    }
    await p.evaluate(() => { const cur = session.menu.items.map(x => x.r && x.r.id); const r0 = RECIPES.find(r => slotOf(r) === '主菜' && r.main !== false && !cur.includes(r.id) && !isAvoided(r)); S.wants = [{id: r0.id, at: TODAY, by: '娘', m: 0}]; save(); render(); window.scrollTo(0, 0); });
    await p.locator('[data-act="wish-list"]').first().click(); await p.waitForTimeout(400); await p.locator('#sheet-root [data-act="wish-today"]').first().click(); await p.waitForTimeout(250); await p.locator('#sheet-root [data-act="wish-today-ok"]').first().click(); await after('wish');
    await p.locator('#view [data-act="decide"]').first().click(); await p.waitForTimeout(450); await p.evaluate(() => { if (toast.hide) toast.hide(); tapGuard = 0; setTab('today'); render(); window.scrollTo(0, 0); openCondSheet(); }); await p.waitForTimeout(250);
    await p.locator('#sheet-root [data-act="mood"][data-k="ten"]').click(); await p.waitForTimeout(250); await p.locator('#sheet-root [data-act="later-today"]').click(); await after('remake');
    const bad = out.filter(r => r.none || !r.undo || r.hits.length || !r.inView || !r.clickable || !/headdock|at-top/.test(r.cls));   // 見出しの行が画面の外（下の段の↻を押すとき画面が動いた）なら、画面の中の料理にかからない高さ（at-top）でも可
    ok(out.length === 4 && !bad.length, `R21-1 R72 ${w}px 文字${ts}: 「これにする」（上・下）・リクエストの「入れかえる」・決めた献立の作り直しの「元に戻す」が見出しの行に出て、料理の絵・料理名・↻・札・丸・「✓ 決めた」にかからず押せる: ` + JSON.stringify(bad.slice(0, 2)));
    await ctx.close();
}

// R21-2（R73）まるごと入れ替えの丸と、↻・料理の絵のすき間（1つの幅に1ページ。文字の大きさはその中で切りかえる）
for (const [w, h] of [[195, 422], [360, 740], [375, 667], [390, 844], [430, 932]]) {
    if (!want('R21-2')) break;
    const {p, ctx} = await open({w, h, lang: 'ja', dc: w === 195 ? 3 : 4, sv: 2}, `r73-${w}`);
    for (const ts of [0, 2]) {
        const r = await p.evaluate(async ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; TRAY_FIT.state = null; window.scrollTo(0, 0); session.menu = null; render(); await __tick(); __still();
            const sh = document.querySelector('#view .tg-mid .shuffle .sh-ic') || document.querySelector('#view .tg-mid .shuffle'); if (!sh) return {err: 'なし'}; const a = sh.getBoundingClientRect();
            const gap = b => Math.round(Math.hypot(Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right)), Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom))));
            let min = 1e9, who = ''; document.querySelectorAll('#view .spot .swap:not(.swap-ph), #view .spot .vessel').forEach(e => { const q = e.getBoundingClientRect(); if (q.width > 1){ const g = gap(q); if (g < min){ min = g; who = e.className.split(' ')[0]; } } });
            return {min, who, tray: document.querySelector('#view .tray').className}; }, ts);
        ok(!r.err && r.min >= 8, `R21-2 R73 ${w}px 文字${ts}: まるごと入れ替えの丸と↻・料理の絵のすき間が 8px 以上（${r.min}px・${r.who}）: ` + JSON.stringify(r));
    }
    await ctx.close();
}

// R21-3（R81）幅195px・4品（上の段が3列）の日に決めた直後のお知らせ: 文字3段階 × 家族の魚⚠ × 上/下の段を真ん中にした位置
for (const ts of [0, 1, 2]) for (const fam of [0, 1]) {
    if (!want('R21-3')) break;
    const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, fam, dc: 5, sv: 2}, `r81-${ts}-${fam}`);
    for (const pos of ['top', 'mid']) {
        const r = await p.evaluate(async ([pos, sel]) => {
            const sh = () => session.menu.items.map(x => x.slot).filter(sl => ['主菜', '副菜', '汁物'].includes(sl)).join('/');
            if (toast.hide) toast.hide(); let got = false; for (let i = 0; i < 40 && !got; i++){ window.scrollTo(0, 0); session.menu = null; render(); await __tick(); got = sh() === '主菜/副菜/副菜/汁物'; }
            if (!got) return {err: '4品の献立にならない: ' + sh()};
            if (pos === 'mid'){ const rows = document.querySelectorAll('#view .tray .tg-row'); rows[rows.length - 1].scrollIntoView({block: 'center'}); await __tick(); }
            __tap('#view [data-act=decide]', 'decide'); await __tick(); for (let i = 0; i < 100 && !document.querySelector('#toast-root .toast[data-placed]'); i++) await new Promise(r => setTimeout(r, 20)); await new Promise(r => setTimeout(r, 400)); await __tick(); toastAlign();
            const t = document.querySelector('#toast-root .toast'); if (!t) return {none: true}; const a = t.getBoundingClientRect(), ov = q => a.left < q.right - 1 && a.right > q.left + 1 && a.top < q.bottom - 1 && a.bottom > q.top + 1;
            const hits = [...document.querySelectorAll(sel)].filter(e => { const q = e.getBoundingClientRect(); return q.width > 1 && ov(q); }).map(e => e.className.split(' ')[0] + ':' + e.textContent.trim().slice(0, 8));
            const res = {cls: t.className, top: Math.round(a.top), hid: getComputedStyle(t).visibility === 'hidden', hits, sy: Math.round(scrollY)};
            // 次の回のために決めたのを取り消す（決めた記録を消す）
            if (S.cook) S.cook = null; tapGuard = 0; if (toast.hide) toast.hide(); window.scrollTo(0, 0); render(); await __tick(); return res; }, [pos, '#view .spot .nm, #view .spot .swap:not(.swap-ph), #view .spot .alg-tag, #view .spot .swap-line, #view .tg-mid .shuffle, #view .p2-ok, #view .p2-link, #view .actionbar button']);
        ok(!r.err && !r.none && !r.hid && !r.hits.length, `R21-3 R81 195px 文字${ts} 家族${fam} ${pos}: 4品の日の決めた直後のお知らせが、料理名・↻・札・「買い物メモを見る」・決定にかからず見える: ` + JSON.stringify(r));
    }
    await ctx.close();
}

// R22-1（R94）↻ のあとの「元に戻す」の帯: 1つの幅・文字の大きさに1ページで、候補の「これにする」と、その場でかえる（候補を通さない）の2通り
for (const [w, h] of [[195, 470], [360, 740], [375, 667], [390, 844], [430, 932]]) for (const ts of [0, 2]) {
    if (!want('R22-1')) break;
    const {p, ctx} = await open({w, h, lang: 'ja', ts, dc: w === 195 ? 3 : 4, sv: 2}, `r94-${w}-${ts}`);
    const out = [];
    for (const how of ['pick', 'direct']) {
        await p.evaluate(direct => { if (toast.hide) toast.hide(); tapGuard = 0; window.__swapDirect = direct; window.scrollTo(0, 0); }, how === 'direct'); await p.waitForTimeout(150);
        const before = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.name));
        const n0 = await p.locator('#view [data-act="reroll"]').count(); let done = false;
        for (let i = 0; i < n0 && !done; i++){
            await p.locator('#view [data-act="reroll"]').nth(i).click(); await p.waitForTimeout(400);
            if (how === 'pick'){ if (await p.locator('#sheet-root [data-act="swap-pick"]').count()){ await p.locator('#sheet-root [data-act="swap-pick"]').first().click(); done = true; } else { await p.evaluate(() => { if (sheet) closeSheet(); tapGuard = 0; }); await p.waitForTimeout(150); } }
            else done = true;
        }
        await p.waitForTimeout(450);
        const r = await p.evaluate(([sel, before]) => { const t = document.querySelector('#toast-root .toast'); if (!t) return {none: true}; const a = t.getBoundingClientRect();
            const ov = q => a.left < q.right - 1 && a.right > q.left + 1 && a.top < q.bottom - 1 && a.bottom > q.top + 1;
            const hits = [...document.querySelectorAll(sel)].filter(e => { const q = e.getBoundingClientRect(); return q.width > 1 && ov(q); }).map(e => e.className.split(' ')[0] + ':' + (e.textContent || '').trim().slice(0, 8));
            const bt = t.querySelector('[data-act=toast-undo]'), bq = bt && bt.getBoundingClientRect(), at = bq && document.elementFromPoint((bq.left + bq.right) / 2, (bq.top + bq.bottom) / 2);
            const now = session.menu.items.map(x => x.r && x.r.name), nw = now.find((n, i) => n && n !== before[i]) || '';
            const tx = t.querySelector('.tx'), vis = tx ? tx.textContent.trim() : '', head = nw ? [...nw].slice(0, 2).join('') : '';
            return {vis, nw, named: !!nw && (vis.includes(nw) || (vis.includes(head) && vis.includes('…'))), full: t.textContent.includes(nw), hits, undo: !!bt, clickable: !!(bt && at && (at === bt || bt.contains(at))), cls: t.className, top: Math.round(a.top), h: Math.round(a.height)}; },
            ['#view .spot .vessel, #view .spot .nm, #view .spot .swap:not(.swap-ph), #view .spot .alg-tag, #view .spot .swap-line, #view .tg-mid .shuffle, #view .p2-ok, #view .today-head h2, #view .today-head .p2-sv, header.top button, header.top [data-act]', before]);
        r.how = how; out.push(r);
    }
    const bad = out.filter(r => r.none || !r.undo || r.hits.length || !r.clickable || !r.named || !r.full);
    ok(out.length === 2 && !bad.length, `R22-1 R94 ${w}px 文字${ts}: ↻ のあとの「元に戻す」の帯が見出し・条件のボタン・料理の絵・料理名・↻にかからず押せる。字に料理名（短くしても頭の字と「…」）: ` + JSON.stringify(bad.slice(0, 2)));
    await ctx.close();
}

// R22-2（R93）幅195px のはじめての設定の見出し（文字3段階）
for (const ts of [0, 1, 2]) {
    if (!want('R22-2')) break;
    const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, dc: 3, sv: 2}, `r93-${ts}`);
    const r = await p.evaluate(async () => { const lines = () => { const h2 = document.querySelector('#sheet-root .sheet h2'); const rg = document.createRange(); rg.selectNodeContents(h2); return {text: h2.textContent, n: new Set([...rg.getClientRects()].map(q => Math.round(q.top))).size, over: h2.scrollWidth > h2.clientWidth + 1}; };
        startOnboard(); await __tick(); const a = lines(); sheet.step = 1; renderSheet(); await __tick(); const c = lines(); closeSheet(); return {a, c}; });
    ok(r.a.n === 1 && !r.a.over && r.c.n <= 2 && !r.c.over, `R22-2 R93 195px 文字${ts}: はじめての設定の見出し「${r.a.text}」が1行・「${r.c.text}」が2行まで: ` + JSON.stringify(r));
    await ctx.close();
}

// R23-1（R100）幅195px のはじめての設定の2つめ: 人数のボタンの1段目が、下の「もどる／次へ」の帯より上に見える。見出し・説明の文も見える（文字3段階）
for (const ts of [0, 1, 2]) {
    if (!want('R23-1')) break;
    const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, dc: 3, sv: 2}, `r100-${ts}`);
    const r = await p.evaluate(async () => { startOnboard(); await __tick(); await new Promise(r => setTimeout(r, 300));
        const sh = document.querySelector('#sheet-root .sheet'), foot = sh.querySelector('.ob-actions'), chip = sh.querySelector('[data-act=ob-sv]'), h2 = sh.querySelector('h2'), para = sh.querySelector('h2 + p');
        const f = foot.getBoundingClientRect(), c = chip.getBoundingClientRect(), hq = h2.getBoundingClientRect(), pq = para ? para.getBoundingClientRect() : null;
        const res = {footTop: Math.round(f.top), chip: [Math.round(c.top), Math.round(c.bottom)], h2: [Math.round(hq.top), Math.round(hq.bottom)], p: pq && [Math.round(pq.top), Math.round(pq.bottom)], back: !!foot.querySelector('[data-act]')}; closeSheet(); return res; });
    ok(r.chip[1] <= r.footTop && r.h2[0] >= 0 && (!r.p || r.p[1] <= r.footTop) && r.back, `R23-1 R100 195px 文字${ts}: はじめての設定の人数のボタンの1段目・見出し・説明が「もどる／次へ」の帯より上に見える: ` + JSON.stringify(r));
    await ctx.close();
}

ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
