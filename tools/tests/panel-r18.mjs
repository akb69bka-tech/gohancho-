#!/usr/bin/env node
// 利用者モニター 第18回の直し（画面・三宅）。Playwright。使い方: node tools/tests/panel-r18.mjs [http://localhost:8999/]
//  S22: 360×740・家族の🔍 が上下の段に出る日（文字3段階・日本/韓国・明暗）でも、下の段（器・名前・かえる・札）と「この献立に決定」が下のタブより上（いちばん詰めても入らないときは、家族リクエストの入口を上の端の行へ: tray-tight5）
//  R20: 195×422・文字大/もっと大きい・家族（🔍）・家族リクエストあり: 上の段の器・名前・↻・札が、決める前も決めたあともタブより上。入口は残る
//  R41: 195px・家族ありで決めた直後のお知らせ（低い形）は、「✓ 決めた」の印・条件のボタン・料理名・↻・まるごと入れ替え・家族リクエストにかからない（器の絵の上は可）
//  R33: 195px の「元に戻す」付きのお知らせは1語＋ボタンの低い形で、料理名・↻・🔍の札・ボタンにかからない（20回）
//  R39: 430px・文字大/もっと大きい、390px・文字大: まるごと入れ替えのお知らせがアプリの名前を隠さない（空いた高さがあればそこへ。なければ低い形）
//  R13: 文字大/もっと大きい の下のタブは 13.5px/15px（お膳を詰めても 12px に戻らない。作り方のタブでも）
//  D8: 独・仏・伊・亜・西・比・土・波 の ↻ の丸に短い1語の字（幅 32px 以内。文字3段階・360/390/430）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);   // ONLY=R18-1,R18-3 で項目を絞る
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const CC = {ja: 'JP', ko: 'KR', en: 'US', de: 'DE', fr: 'FR', it: 'IT', ar: 'EG', es: 'ES', fil: 'PH', tr: 'TR', pl: 'PL'};
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

ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
