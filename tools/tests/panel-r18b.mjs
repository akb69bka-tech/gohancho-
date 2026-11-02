#!/usr/bin/env node
// 利用者モニター 第18回の直し（画面・三宅）。Playwright。使い方: node tools/tests/panel-r18.mjs [http://localhost:8999/]
//  S22: 360×740・家族の🔍 が上下の段に出る日（文字3段階・日本/韓国・明暗）でも、下の段（器・名前・かえる・札）と「この献立に決定」が下のタブより上（いちばん詰めても入らないときは、家族リクエストの入口を上の端の行へ: tray-tight5）
//  R20: 195×422・文字大/もっと大きい・家族（🔍）・家族リクエストあり: 上の段の器・名前・↻・札が、決める前も決めたあともタブより上。入口は残る
//  R41: 195px・家族ありで決めた直後のお知らせ（低い形）は、「✓ 決めた」の印・条件のボタン・料理名・↻・まるごと入れ替え・家族リクエストにかからない（器の絵の上は可）
//  R33: 195px の「元に戻す」付きのお知らせは1語＋ボタンの低い形で、料理名・↻・🔍の札・ボタンにかからない（20回）
//  R39: 430px・文字大/もっと大きい、390px・文字大: まるごと入れ替えのお知らせがアプリの名前を隠さない（空いた高さがあればそこへ。なければ低い形）
//  R13: 文字大/もっと大きい の下のタブは 13.5px/15px（お膳を詰めても 12px に戻らない。作り方のタブでも）
//  D8: 独・仏・伊・亜・西・比・土・波 の ↻ の丸に短い1語の字（幅 32px 以内。文字3段階・360/390/430）
//  第18回のあとの直し（R54・R57・R58・R33 の残り・R39 の残り）:
//  R54: 条件のボタン「3人分・おまかせ・品数おまかせ ▾」の字が、17言語 × 360/375/390/430 × 文字3段階で、箱の中（… で省略）。見出し「今日の献立」・左の印に重ならない。ボタンは 48px 以下
//  R57: 360/375/390/195 × 文字3段階 × 日本・韓国・家族の魚⚠で決めたあと、「夫に合わない料理があります」の ⚠ の1行が最初の画面に見える（固定の帯の中。帯をお膳の下に置く画面ではお膳のすぐ上）。上の段はタブより上のまま
//  R58: 主食の ↻ の丸にも短い1語（主菜と同じ語・32px 以内）。独語は "Tausch"（"Neues Menü" と別の語）
//  R33 の残り: 195px の「元に戻す」のお知らせは、スクロールした位置（0・60・120・200px・まるごと入れ替えを真ん中にした位置）でも料理名・↻・札にかからない
//  R39 の残り: 195px の「準備ができました…」（画面が切りかわった直後のお知らせ）は、アプリの名前ではなく器の絵の帯に出る
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
    await ctx.addInitScript(seedScript(seedFor('r18', tag)));
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
const reqEntry = p => p.evaluate(() => { const e = document.querySelector('#greet .req-btn, header.top .req-btn'); if (!e) return null; const q = e.getBoundingClientRect(); return {where: e.closest('header.top') ? 'header' : 'greet', w: Math.round(q.width), h: Math.round(q.height), inView: q.top >= 0 && q.bottom <= __tabTop(), aria: e.getAttribute('aria-label') || '', n: (e.querySelector('.rq-n') || {}).textContent || ''}; });

// R18-1（S22）360×740・家族の🔍 が上下の段に出る日: 文字3段階 × 日本・韓国 × 明暗。下の段と決定の帯がタブより上
for (const lang of ['ja', 'ko']) for (const ts of [0, 1, 2]) for (const dark of [false, true]) {
    if (!want('R18-1')) break;
    const {p, ctx} = await open({w: 360, h: 740, lang, ts, fam: 1, dc: 4, dark, wants: 1}, `s22-${lang}-${ts}-${dark}`);
    const r = await p.evaluate(async lang => {
        const out = [];
        // 🔍 の札（家族のアレルゲンの「袋の表示を確認」）が上下の段に出る献立を作る: 上の段の最初と下の段の最後の席を、その枠で 🔍 の出る料理にかえる（候補を変えて 3 通り）。日本は第17回の画面（なすと豚肉の味噌炒め・きんぴらごぼう・じゃがいもと玉ねぎの味噌汁）も
        const force = lang === 'ja' ? [['なすと豚肉の味噌炒め', 'きんぴらごぼう', 'じゃがいもと玉ねぎの味噌汁']] : [];
        window.scrollTo(0, 0); session.menu = null; render(); await __tick();
        const m = session.menu, n = m.items.length, pick = (slot, used, k) => RECIPES.filter(x => slotOf(x) === slot && !used.has(x.id) && !isAvoided(x) && (slot !== '主菜' || x.main !== false) && /🔍/.test(algTagHtml(x)))[k];
        for (let k = 0; k < 3; k++){ const used = new Set(); const a = pick(m.items[0].slot, used, k); if (!a) break; used.add(a.id); const z = pick(m.items[n - 1].slot, used, k); if (!z) break; force.push(m.items.map((it, i) => i === 0 ? a.name : i === n - 1 ? z.name : it.r ? it.r.name : null)); }
        for (const names of force){
            session.menu = null; render(); await __tick();
            const mm = session.menu; mm.items.forEach((it, i) => { const rr = names[i] && RECIPES.find(x => x.name === names[i]); if (rr) it.r = rr; });
            TRAY_FIT.key = ''; TRAY_FIT.base = ''; TRAY_FIT.state = null; window.scrollTo(0, 0); render(); await __tick();
            const rows = __rows(); if (!(rows.length > 1 && rows.every(x => x.tags))) continue;
            const bar = __bar(); const bad = rows.some(x => x.hid.length) || !bar || bar.hidden;
            out.push({names: session.menu.items.map(x => x.r ? x.r.name : '-').join('・'), rows, bar, cls: document.body.className.replace('on-today', '').trim(), bad, req: !!document.querySelector('#greet .req-btn, header.top .req-btn')});
        }
        return out;
    }, lang);
    ok(r.length >= 1 && r.every(x => !x.bad && x.req), `R18-1 S22 360×740 ${lang} 文字${ts}${dark ? ' dark' : ''}: 🔍 が上下の段に出る献立 ${r.length} 件で、下の段と決定の帯がタブより上・家族リクエストの入口あり: ` + JSON.stringify(r.filter(x => x.bad || !x.req).slice(0, 2)));
    await ctx.close();
}

// R18-2（R20）195×422・文字大/もっと大きい × 家族の🔍 × 家族リクエスト: 上の段が決める前・決めたあともタブより上。入口は残る（上の端の行でも可）
for (const ts of [1, 2]) for (const fam of [0, 1]) for (const wants of [0, 1]) {
    if (!want('R18-2')) break;
    const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, fam, dc: 3, sv: 2, wants}, `r20-${ts}-${fam}-${wants}`);
    const r = await p.evaluate(async fam => {
        // 家族の🔍 が上の段に出る献立まで回す（家族ありのとき）
        for (let i = 0; i < 40; i++){ window.scrollTo(0, 0); session.menu = null; render(); await __tick(); const row = document.querySelector('#view .tray .tg-row'); if (!fam || (row && row.querySelector('.alg-tag'))) break; }
        const before = __rows()[0], tag = before.tags;
        __tap('#view [data-act=decide]', 'decide'); await __tick(); window.scrollTo(0, 0); setTab('today'); render(); await __tick();
        const after = __rows()[0];
        return {tag, before, after, cls: document.body.className};
    }, fam);
    const req = await reqEntry(p);
    ok(!r.before.hid.length && !r.after.hid.length && (!fam || r.tag), `R18-2 R20 195px 文字${ts} 家族${fam} リクエスト${wants}: 上の段の器・名前・↻・札が決める前も決めたあともタブより上: ` + JSON.stringify(r));
    if (fam || wants) ok(req && req.inView && req.h >= 44 && /家族リクエスト/.test(req.aria), `R18-2 R20 195px 文字${ts} 家族${fam} リクエスト${wants}: 家族リクエストの入口が最初の画面に残る（44px 以上・読み上げの名前あり）: ` + JSON.stringify(req));
    await ctx.close();
}

// R18-3（R41）195px・家族あり・決めた直後のお知らせ: 「✓ 決めた」の印・条件のボタン・料理名・↻・まるごと入れ替え・家族リクエスト・国・設定にかからない（器の絵の上は可）
for (const ts of [0, 1, 2]) for (const fam of [0, 1]) {
    if (!want('R18-3')) break;
    const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, fam, dc: 3, sv: 3, wants: fam}, `r41-${ts}-${fam}`);
    const r = await p.evaluate(async () => { window.scrollTo(0, 0); session.menu = null; render(); await __tick(); __tap('#view [data-act=decide]', 'decide'); await __tick(); await new Promise(r => setTimeout(r, 350)); return __toastCover(); });
    const ctl = r.cover ? r.cover.filter(x => !/^H1/.test(x)) : [];   // アプリの名前（文）は押す場所ではない（器の絵の帯がない献立では、そこに出る）
    ok(!r.none && !ctl.length && /compact/.test(r.cls), `R18-3 R41 195px 文字${ts} 家族${fam}: 決めた直後のお知らせ（低い形）が「✓ 決めた」・条件・料理名・↻・ボタンにかからない: ` + JSON.stringify(r));
    await ctx.close();
}

// R18-4（R33）195px の「元に戻す」付きのお知らせ: 1語＋ボタンの低い形。料理名・↻・🔍の札・ボタンにかからない（文字3段階 × 家族なし/あり × 3〜4回 = 20回）
if (want('R18-4')) {
    let n = 0, bad = [];
    for (const ts of [0, 1, 2]) for (const fam of [0, 1]) {
        const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, fam, dc: 3, sv: 3, wants: fam}, `r33-${ts}-${fam}`);
        for (let i = 0; i < (fam ? 4 : 3); i++){
            await p.waitForTimeout(i ? 250 : 0);
            const r = await p.evaluate(async i => { if (toast.hide) toast.hide(); window.scrollTo(0, 0); __tap('#view [data-act=new-menu]', 'new-menu'); await __tick(); await new Promise(r => setTimeout(r, 350)); const c = __toastCover(); c.undo = !!document.querySelector('#toast-root [data-act=toast-undo]'); c.lines = c.h < 60; return c; }, i);
            n++;
            const ctl = r.cover ? r.cover.filter(x => !/^H1/.test(x)) : [];   // アプリの名前（文）は押す場所ではない
            if (r.none || !r.undo || ctl.length || !/compact/.test(r.cls) || !/^入れ替えました/.test(r.text) || r.h > 56) bad.push(`文字${ts} 家族${fam} #${i} ` + JSON.stringify(r));
        }
        await ctx.close();
    }
    ok(n >= 20 && !bad.length, `R18-4 R33 195px の元に戻すのお知らせ ${n} 回: 「入れ替えました 元に戻す」の低い形（56px 以下）で、料理名・↻・札・ボタンにかからない: ` + bad.slice(0, 3).join(' / '));
}

// R18-5（R39）430px・文字大/もっと大きい、390px・文字大: まるごと入れ替えのお知らせがアプリの名前（h1）を隠さない
for (const [w, h, ts] of [[430, 932, 1], [430, 932, 2], [390, 844, 1]]) {
    if (!want('R18-5')) break;
    const {p, ctx} = await open({w, h, lang: 'ja', ts, dc: 3, sv: 3}, `r39-${w}-${ts}`);
    const out = [];
    for (let i = 0; i < 4; i++){
        await p.waitForTimeout(i ? 250 : 0);
        const r = await p.evaluate(async () => { if (toast.hide) toast.hide(); window.scrollTo(0, 0); __tap('#view [data-act=new-menu]', 'new-menu'); await __tick(); await new Promise(r => setTimeout(r, 350)); const c = __toastCover(); c.h1 = c.cover.some(x => /^H1/.test(x)); c.core = c.cover.filter(x => /^(nm|alg-tag|swap|shuffle|btn)/.test(x)); return c; });
        out.push(r);
    }
    ok(out.every(r => !r.none && !r.h1 && !r.core.length), `R18-5 R39 ${w}px 文字${ts}: まるごと入れ替え4回のお知らせが、アプリの名前・料理名・↻・まるごと入れ替え・決定を隠さない: ` + JSON.stringify(out.filter(r => r.none || r.h1 || r.core.length).slice(0, 2)));
    await ctx.close();
}

// R18-6（R13）文字大 13.5px・もっと大きい 15px（語が入らない言語は 12px より大きい範囲で下げる）。お膳を詰める処理（fitTray）のあとも、作り方のタブでも同じ
for (const [w, h] of [[360, 740], [390, 844], [430, 932]]) for (const lang of ['ja', 'ko', 'en']) for (const ts of [1, 2]) {
    if (!want('R18-6')) break;
    const {p, ctx} = await open({w, h, lang, ts, fam: 1, dc: 4, wants: 1}, `r13-${w}-${lang}-${ts}`);
    const r = await p.evaluate(async () => { const nv = document.querySelector('nav.tabs'); const fs = () => parseFloat(getComputedStyle(nv.querySelector('button[data-tab=today]')).fontSize); session.menu = null; render(); await __tick(); const a = fs(); setTab('cook'); render(); await __tick(); const c = fs(); setTab('today'); render(); await __tick(); return {today: a, cook: c, back: fs(), ico: nv.classList.contains('ico')}; });
    const std = ts === 2 ? 15 : 13.5, min = ts === 2 ? 14 : 13;
    ok(!r.ico && [r.today, r.cook, r.back].every(v => v >= min && v <= std), `R18-6 R13 ${w}px ${lang} 文字${ts}: 下のタブの字が ${min}px 以上（標準 ${std}px）。お膳を詰めたあと・作り方のタブでも: ` + JSON.stringify(r));
    await ctx.close();
}

// R18-7（D8）独・仏・伊・亜・西・比・土・波: ↻ の丸に短い1語（幅 32px 以内・見える）。文字3段階 × 360/390/430。読み上げは「…を別の料理にかえる」のまま
for (const lang of ['de', 'fr', 'it', 'ar', 'es', 'fil', 'tr', 'pl']) for (const [w, h] of [[390, 844], [360, 740], [430, 932]]) for (const ts of [0, 1, 2]) {
    if (!want('R18-7')) break;
    const {p, ctx} = await open({w, h, lang, ts, dc: 3, sv: 2}, `d8-${lang}-${w}-${ts}`);
    const r = await p.evaluate(async () => { session.menu = null; render(); await __tick(); const tr = document.querySelector('#view .tray');
        return {tight: tr.classList.contains('tight'), sw: [...tr.querySelectorAll('.spot .swap[data-act=reroll]')].map(e => { const rg = document.createRange(); rg.selectNodeContents(e); const q = rg.getBoundingClientRect(); const s = e.querySelector('.sw-s'); return {word: e.classList.contains('sw-word'), text: s ? s.textContent : '', shown: !!s && getComputedStyle(s).display !== 'none' && parseFloat(getComputedStyle(e).fontSize) > 0, w: Math.round(q.width), fs: parseFloat(getComputedStyle(e).fontSize), aria: e.getAttribute('aria-label') || ''}; })}; });
    ok(r.sw.length && (r.tight || r.sw.every(x => x.word && x.shown && x.text && x.w > 0 && x.w <= 32 && x.aria.length > 3)), `R18-7 D8 ${lang} ${w}px 文字${ts}: ↻ の丸に短い字（${r.sw[0] && r.sw[0].text}）が見えて 32px 以内: ` + JSON.stringify(r));
    await ctx.close();
}

// R18-8（R54）条件のボタンの字: 17言語 × 360/375/390/430 × 文字3段階 = 204 画面。字は箱の中（… で省略）、見出し・左の印の字に重ならない、ボタンは 48px 以下（1言語ごとに1ページで、画面の幅・文字の大きさを切りかえて測る）
if (want('R18-8')) {
    let n = 0; const bad = [];
    for (const lang of Object.keys(CC)) {
        const {p, ctx} = await open({w: 390, h: 844, lang, dc: 'auto', sv: 3}, `r54-${lang}`);
        for (const [w, h] of [[360, 740], [375, 667], [390, 844], [430, 932]]) {
            await p.setViewportSize({width: w, height: h});
            for (const ts of [0, 1, 2]) {
                const r = await p.evaluate(async ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; window.scrollTo(0, 0); render(); await __tick();
                    const rr = e => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect(); }, clip = (a, b) => ({left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom)});   // … で省略した字は、箱の中に見えている分だけ
                    const h2 = document.querySelector('#view .today-head h2'), ch = document.querySelector('#view [data-act=cond-open]'), sv = ch && ch.querySelector('.sv1'); if (!h2 || !sv) return {err: 'なし'};
                    const a = clip(rr(h2), h2.getBoundingClientRect()), b = clip(rr(sv), sv.getBoundingClientRect()), cb = ch.getBoundingClientRect(), ib = ch.querySelector('svg').getBoundingClientRect();
                    const ov = (p, q) => Math.round(Math.max(0, Math.min(p.right, q.right) - Math.max(p.left, q.left)) * Math.max(0, Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top)));
                    const sb = sv.getBoundingClientRect();
                    return {ovH2: ov(a, b), ovIc: ov(ib, b), out: Math.round(Math.max(0, cb.left - sb.left, sb.right - cb.right)), chipH: Math.round(cb.height), text: sv.textContent.trim().slice(0, 30)}; }, ts);
                n++; if (r.err || r.ovH2 || r.ovIc || r.out > 1 || r.chipH > 48) bad.push(`${lang} ${w}px 文字${ts} ` + JSON.stringify(r));
            }
        }
        await ctx.close();
    }
    ok(n >= 204 && !bad.length, `R18-8 R54 条件のボタンの字 ${n} 画面（17言語 × 4幅 × 文字3段階）: 箱の中・見出しと印に重ならない・48px 以下: ` + bad.slice(0, 3).join(' / '));
}

// R18-9（R57）決めたあとの ⚠ の1行: 360/375/390/195 × 文字3段階 × 日本・韓国 × 家族の魚⚠（当たる料理のあるお膳）→ 決める → 「夫に合わない料理があります」の ⚠ の行が最初の画面に見える。上の段もタブより上
for (const [w, h] of [[360, 740], [375, 667], [390, 844], [195, 422]]) for (const ts of [0, 1, 2]) for (const lang of ['ja', 'ko']) {
    if (!want('R18-9')) break;
    const {p, ctx} = await open({w, h, lang, ts, fam: 1, dc: w === 195 ? 3 : 4, sv: 3}, `r57-${w}-${ts}-${lang}`);
    const r = await p.evaluate(async () => {
        let hit = false; for (let i = 0; i < 60 && !hit; i++){ window.scrollTo(0, 0); session.menu = null; render(); await __tick(); hit = safeSayDishes().some(r => isAvoidedCore(r)); }
        if (!hit){ const bad = RECIPES.find(x => slotOf(x) === '主菜' && isAvoidedCore(x)); if (bad){ session.menu.items[0].r = bad; TRAY_FIT.key = ''; TRAY_FIT.state = null; render(); await __tick(); hit = safeSayDishes().some(r => isAvoidedCore(r)); } }   // 当たる主菜を置く（判定はアプリのまま）
        __tap('#view [data-act=decide]', 'decide'); await __tick(); await new Promise(r => setTimeout(r, 350)); window.scrollTo(0, 0); setTab('today'); render(); await __tick(); window.scrollTo(0, 0); await __tick();
        const tabTop = __tabTop(), ab = document.querySelector('#view .actionbar'), abFixed = ab && /fixed|sticky/.test(getComputedStyle(ab).position), lim = abFixed ? ab.getBoundingClientRect().top : tabTop;
        const seen = e => { const q = e.getBoundingClientRect(), cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && q.height > 1 && q.top >= -.5 && q.bottom <= (e.closest('.actionbar') && abFixed ? tabTop : lim) + .5; };
        const lines = [...document.querySelectorAll('#view .alg-bar, #view .alg-top, #view .eaters-line')].map(e => ({cls: e.className.split(' ').pop(), text: e.textContent.trim().slice(0, 30), vis: seen(e), h: Math.round(e.getBoundingClientRect().height)}));
        const warn = lines.filter(x => x.vis && /合わない|맞지 않/.test(x.text));
        return {hit, decided: !!document.querySelector('#view .decide-bar.done'), warn, row0: __rows()[0], cls: document.body.className.replace('on-today', '').trim(), tag: !!document.querySelector('#view .spot .alg-tag:not(.may)')};
    });
    ok(r.hit && r.decided && r.warn.length && r.warn.every(x => x.h <= 48) && r.row0 && !r.row0.hid.length, `R18-9 R57 ${w}×${h} ${lang} 文字${ts}: 家族の魚⚠で決めたあと、「合わない料理があります」の ⚠ の1行が最初の画面に見える（48px 以下）・上の段はタブより上: ` + JSON.stringify(r));
    await ctx.close();
}

// R18-10（R58）主食の ↻ の丸にも短い1語（主菜の ↻ と同じ語・32px 以内）。独 "Tausch"（まるごと入れ替えの "Neues Menü" と別の語）。8言語 × 360/390/430 × 文字3段階
for (const lang of ['de', 'fr', 'it', 'ar', 'es', 'fil', 'tr', 'pl']) for (const [w, h] of [[390, 844], [360, 740], [430, 932]]) for (const ts of [0, 1, 2]) {
    if (!want('R18-10')) break;
    const {p, ctx} = await open({w, h, lang, ts, dc: 3, sv: 2}, `r58-${lang}-${w}-${ts}`);
    const r = await p.evaluate(async () => { let st = null; for (let i = 0; i < 30 && !st; i++){ session.menu = null; render(); await __tick(); st = document.querySelector('#view .tray .spot .swap[data-act=staple-next]:not(.tray-add)'); }
        const tr = document.querySelector('#view .tray'), info = e => { const rg = document.createRange(); rg.selectNodeContents(e); const q = rg.getBoundingClientRect(); const s = e.querySelector('.sw-s'); return {word: e.classList.contains('sw-word'), text: s ? s.textContent : '', shown: !!s && getComputedStyle(s).display !== 'none' && parseFloat(getComputedStyle(e).fontSize) > 0, w: Math.round(q.width), aria: e.getAttribute('aria-label') || ''}; };
        const re = tr.querySelector('.spot .swap[data-act=reroll]');
        return {tight: tr.classList.contains('tight'), staple: st ? info(st) : null, reroll: re ? info(re) : null, whole: t('献立を変える')}; });
    const s = r.staple, q = r.reroll;
    ok(s && q && (r.tight || (s.word && s.shown && s.text && s.text === q.text && s.w > 0 && s.w <= 32 && s.aria.length > 3 && s.text !== r.whole && (lang !== 'de' || s.text === 'Tausch'))), `R18-10 R58 ${lang} ${w}px 文字${ts}: 主食の ↻ の丸に主菜と同じ短い字（${s && s.text}）が見えて 32px 以内: ` + JSON.stringify(r));
    await ctx.close();
}

// R18-11（R33 の残り）195px の「元に戻す」のお知らせ: スクロールした位置（0・60・120・200px、まるごと入れ替えの丸を真ん中にした位置）× 文字3段階 × 家族の魚⚠あり/なし × 2回 = 60回。料理名・↻・札・ボタンにかからない（器の絵の上は可）
if (want('R18-11')) {
    let n = 0; const bad = [];
    for (const ts of [0, 1, 2]) for (const fam of [0, 1]) {
        const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, fam, dc: 3, sv: 3, wants: fam}, `r33s-${ts}-${fam}`);
        for (const sy of [0, 60, 120, 200, 'mid']) for (let i = 0; i < 2; i++) {
            const r = await p.evaluate(async sy => { if (toast.hide) toast.hide(); window.scrollTo(0, 0); await __tick(); if (sy === 'mid') document.querySelector('#view [data-act=new-menu]').scrollIntoView({block: 'center'}); else window.scrollTo(0, sy); await __tick(); const y0 = Math.round(scrollY);
                __tap('#view [data-act=new-menu]', 'new-menu'); await __tick(); await new Promise(r => setTimeout(r, 350)); const c = __toastCover(); c.y0 = y0; c.y1 = Math.round(scrollY); c.undo = !!document.querySelector('#toast-root [data-act=toast-undo]'); return c; }, sy);
            n++; const ctl = r.cover ? r.cover.filter(x => !/^H1/.test(x)) : [];
            if (r.none || !r.undo || ctl.length || !/compact/.test(r.cls) || r.h > 56) bad.push(`文字${ts} 家族${fam} 送り${sy} #${i} ` + JSON.stringify(r));
            await p.waitForTimeout(200);
        }
        await ctx.close();
    }
    ok(n >= 60 && !bad.length, `R18-11 R33 195px の元に戻すのお知らせ ${n} 回（スクロールした位置でも）: 低い形で、料理名・↻・札・ボタンにかからない: ` + bad.slice(0, 3).join(' / '));
}

// R18-12（R39 の残り）195px・画面が切りかわった直後のお知らせ（「準備ができました…」と同じ出し方）: アプリの名前（h1）ではなく器の絵の帯に出る。料理名・↻・ボタンにもかからない。文字3段階 × 家族あり/なし
for (const ts of [0, 1, 2]) for (const fam of [0, 1]) {
    if (!want('R18-12')) break;
    const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, fam, dc: 3, sv: 3, wants: fam}, `r39n-${ts}-${fam}`);
    const r = await p.evaluate(async () => { window.scrollTo(0, 0); TOAST_TAP.at = performance.now(); TOAST_TAP.layer = true; TOAST_TAP.y = 200; TOAST_TAP.box = null; TOAST_TAP.act = ''; toast(t('準備ができました。今日の献立はこちらです'), true); await __tick(); await new Promise(r => setTimeout(r, 350)); const c = __toastCover(); c.h1 = c.cover.some(x => /^H1/.test(x)); c.core = c.cover.filter(x => /^(nm|alg-tag|swap|shuffle|btn|p2-ok)/.test(x)); return c; });
    ok(!r.none && !r.h1 && !r.core.length, `R18-12 R39 195px 文字${ts} 家族${fam}: 切りかわった直後のお知らせがアプリの名前・料理名・↻・ボタンを隠さない（器の絵の上は可）: ` + JSON.stringify(r));
    await ctx.close();
}

ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
