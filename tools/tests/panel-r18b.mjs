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
//  第19回（R59・R60・R62・R54 の残り・195px の残り）:
//  R59: 決めた直後の「献立が決まりました…」は、置いたあとページに留める（中身と一緒にスクロール）。360/375/390/430/195 × 文字3段階 × 家族の魚⚠ × 押し方2通りで、押した直後・上まで戻した位置・いちばん下・元の位置のどこでも、料理名・↻・札・決定・「✓ 決めた」にかからない（下の帯・タブより下へ出たあいだは隠れる）
//  R60: 最初の「準備ができました…」も同じ出し方。360/390/430 × 文字3段階 × 家族で同じ
//  R62: 条件のボタンの字は「2人分・おまかせ」（品数おまかせのときは3つ目を出さない。気分がおまかせ以外なら「2人分・ラクの日・おまかせ」）。17言語 × 390 × ふつう/文字大で、日本語・英語・韓国語・中国語・独・仏・西・伊は全部見える。ほかも「…」は最後の手段（見える字が 7 割以上）
//  R54 の残り: 波・越 × 360/375 × 文字大/もっと大きい で、見出し "Dzisiejszy jadłospis"・"Thực đơn hôm nay" の字が条件のボタンの箱に隠れない（17px の2行）
//  195px の残り: 決めたあとの「⚠ 夫に合わない料理があります」が途中で切れない（11px・2行まで）。「✓ 決めた」の印が条件のボタンの裏に入らない
//  第20回（R63〜R66）:
//  R66: 家族の魚⚠で帯に ⚠ の行が付く 375/360 でも、決めた直後のお知らせが帯の裏に入らず置いた位置で見える。430 では 🔍 の札の2行目「🔁 昆布だしで作る」にもかからない
//  R63: 「明日から」の「元に戻す」付きのお知らせは、195px では1語「明日から」＋ボタンの低い形。430 では「✓ 決めました」の帯にかからない
//  R64: まるごと入れ替えの「元に戻す」が残るうちに気分を変えたら、お知らせは消える（newMenu）
//  R65: 「買い物そろいました／元に戻す」は、タブを切りかえたら消える（setTab）
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
        window.__toastCover = () => { const box = document.querySelector('#toast-root .toast') || document.querySelector('#view .tg-mid .mb-back'); if (!box)   // 11/06: 「↶ 前の献立」は丸の右隣（.mb-back）。お知らせがなければ、そのボタンを測る
           return {none: true, cover: [], vessels: 0}; const R = box.getBoundingClientRect(); const ov = q => q.width > 1 && q.height > 1 && q.bottom > R.top + .5 && q.top < R.bottom - .5 && q.right > R.left + .5 && q.left < R.right - .5;
            const list = [], tabTop = __tabTop(); let vessels = 0;
            document.querySelectorAll('#view .spot .vessel, #view .tg-mid .sh-ic, #view .tg-mid .sh-tx, #view .spot .nm, #view .spot .alg-tag, #view .spot .swap:not(.swap-ph), #view .tg-mid .shuffle, #view .actionbar button, #view .p2-ok, #view .p2-sv, header.top h1, header.top .gear, .req-btn, #view button, #view [data-act]').forEach(e => { if (getComputedStyle(e).visibility === 'hidden' || e.closest('#toast-root, .mb-back') || (box.matches('.mb-back') && e.matches('.shuffle'))) return; let q = e.getBoundingClientRect(); if (e.matches('.nm')){ const g = document.createRange(); g.selectNodeContents(e); q = g.getBoundingClientRect(); } if (q.top >= tabTop - .5) return; if (!ov(q)) return; if (e.matches('.vessel')){ vessels++; return; } list.push((e.className || e.tagName).toString().split(' ')[0] + ':' + (e.textContent || '').trim().slice(0, 8) + ':' + Math.round(q.top) + '-' + Math.round(q.bottom)); });
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
        // 第20回のあと（たまに落ちる件）: 献立は毎回作り直すので、席の形（おかずの並び）が 主菜・副菜・汁物 のときと、主菜・副菜・副菜・汁物（上の段が3列）のときがある。
        // 前は最初の献立の並びで料理名を「何番目の席か」で入れていたため、作り直した献立の形がちがうと、汁ものを副菜の席に入れた（汁もの2つ・上の段に🔍が3つ）ありえない献立になり、
        // それがお膳に入りきらずに決定の帯をお膳の下に置く形（bar-static）になって落ちていた（乱数しだいで3〜4回に1回。同じ SEED では毎回同じ。時間差ではない）。
        // ここは S22（第17回の画面: 主菜・副菜・汁もの＋ご飯）の点検なので、席の形が 主菜・副菜・汁物 の献立になるまで作り直し、料理は同じ枠の席に入れる
        const shape = () => session.menu.items.map(x => x.slot).filter(sl => ['主菜', '副菜', '汁物'].includes(sl)).join('/');
        const roll = async () => { for (let i = 0; i < 40; i++){ window.scrollTo(0, 0); session.menu = null; render(); await __tick(); if (shape() === '主菜/副菜/汁物') return true; } return false; };
        if (!await roll()) return [{bad: true, err: '主菜・副菜・汁物の献立にならない'}];
        const m = session.menu, n = m.items.length, pick = (slot, used, k) => RECIPES.filter(x => slotOf(x) === slot && !used.has(x.id) && !isAvoided(x) && (slot !== '主菜' || x.main !== false) && /🔍/.test(algTagHtml(x)))[k];
        for (let k = 0; k < 3; k++){ const used = new Set(); const a = pick(m.items[0].slot, used, k); if (!a) break; used.add(a.id); const z = pick(m.items[n - 1].slot, used, k); if (!z) break; force.push(m.items.map((it, i) => i === 0 ? a.name : i === n - 1 ? z.name : it.r ? it.r.name : null)); }
        for (const names of force){
            if (!await roll()){ out.push({names: names.join('・'), bad: true, err: '主菜・副菜・汁物の献立にならない'}); continue; }
            const mm = session.menu, done = new Set();
            for (const nm of names){ const rr = nm && RECIPES.find(x => x.name === nm); if (!rr) continue; const it = mm.items.find((x, i) => !done.has(i) && x.slot === slotOf(rr)); if (!it) continue; done.add(mm.items.indexOf(it)); it.r = rr; }   // 料理は同じ枠の席に
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
    if (fam || wants) ok(req && req.inView && req.h >= 44 && (fam ? /家族リクエスト/ : /^食べたいもの/).test(req.aria), `R18-2 R20 195px 文字${ts} 家族${fam} リクエスト${wants}: 家族リクエストの入口が最初の画面に残る（44px 以上・読み上げの名前あり）: ` + JSON.stringify(req));
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

// R18-4（R33 → オーナー指示 11/04）195px でまるごと入れ替えを押しても「入れ替えました／元に戻す」のお知らせは出ない（料理の絵・料理名・↻ にかからない）（文字3段階 × 家族なし/あり × 3〜4回 = 20回）
if (want('R18-4')) {
    let n = 0, bad = [];
    for (const ts of [0, 1, 2]) for (const fam of [0, 1]) {
        const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, fam, dc: 3, sv: 3, wants: fam}, `r33-${ts}-${fam}`);
        for (let i = 0; i < (fam ? 4 : 3); i++){
            await p.waitForTimeout(i ? 250 : 0);
            const r = await p.evaluate(async i => { if (toast.hide) toast.hide(); window.scrollTo(0, 0); __tap('#view [data-act=new-menu]', 'new-menu'); await __tick(); await new Promise(r => setTimeout(r, 350)); const c = __toastCover(); c.undo = !!document.querySelector('#view .tg-mid .mb-back'); c.lines = c.h < 60; return c; }, i);
            n++;
            const ctl = r.cover ? r.cover.filter(x => !/^H1/.test(x)) : [];   // アプリの名前（文）は押す場所ではない
            if (r.none || !r.undo || !/前の献立|前へ/.test(r.text || '') || ctl.length || r.vessels) bad.push(`文字${ts} 家族${fam} #${i} ` + JSON.stringify(r));
        }
        await ctx.close();
    }
    ok(n >= 20 && !bad.length, `R18-4 195px まるごと入れ替え ${n} 回: 丸の右隣に「↶ 前の献立」が出て、料理の絵・料理名・↻にかからない（オーナー指示 11/06）: ` + bad.slice(0, 3).join(' / '));
}

// R18-5（R39 → オーナー指示 11/04）430px・文字大/もっと大きい、390px・文字大: まるごと入れ替えを押してもお知らせは出ず、アプリの名前・料理名・↻を隠さない
for (const [w, h, ts] of [[430, 932, 1], [430, 932, 2], [390, 844, 1]]) {
    if (!want('R18-5')) break;
    const {p, ctx} = await open({w, h, lang: 'ja', ts, dc: 3, sv: 3}, `r39-${w}-${ts}`);
    const out = [];
    for (let i = 0; i < 4; i++){
        await p.waitForTimeout(i ? 250 : 0);
        const r = await p.evaluate(async () => { if (toast.hide) toast.hide(); window.scrollTo(0, 0); __tap('#view [data-act=new-menu]', 'new-menu'); await __tick(); await new Promise(r => setTimeout(r, 350)); const c = __toastCover(); c.h1 = c.cover.some(x => /^H1/.test(x)); c.core = c.cover.filter(x => /^(nm|alg-tag|swap|shuffle|btn)/.test(x)); return c; });
        out.push(r);
    }
    ok(out.every(r => !r.none && !r.core.length && !r.vessels), `R18-5 ${w}px 文字${ts}: まるごと入れ替え4回で、「↶ 前の献立」が丸の右隣に出て料理名・↻・絵にかからない（オーナー指示 11/05）: ` + JSON.stringify(out.filter(r => r.none || r.core.length || r.vessels).slice(0, 2)));
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
for (const lang of ['de', 'fr', 'it', 'ar', 'es', 'fil', 'tr', 'pl']) {
    if (!want('R18-7')) break;
    const {p, ctx} = await open({w: 390, h: 844, lang, dc: 3, sv: 2}, `d8-${lang}`);   // 1言語に1ページ。画面の幅・文字の大きさはその中で切りかえる（R18-8 と同じ。ページを開き直す時間を減らす）
    for (const [w, h] of [[390, 844], [360, 740], [430, 932]]) for (const ts of [0, 1, 2]) {
    await p.setViewportSize({width: w, height: h});
    const r = await p.evaluate(async ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; TRAY_FIT.state = null; window.scrollTo(0, 0); session.menu = null; render(); await __tick(); const tr = document.querySelector('#view .tray');
        return {tight: tr.classList.contains('tight'), sw: [...tr.querySelectorAll('.spot .swap[data-act=reroll]')].map(e => { const rg = document.createRange(); rg.selectNodeContents(e); const q = rg.getBoundingClientRect(); const s = e.querySelector('.sw-s'); return {word: e.classList.contains('sw-word'), text: s ? s.textContent : '', shown: !!s && getComputedStyle(s).display !== 'none' && parseFloat(getComputedStyle(e).fontSize) > 0, w: Math.round(q.width), fs: parseFloat(getComputedStyle(e).fontSize), aria: e.getAttribute('aria-label') || ''}; })}; }, ts);
    ok(r.sw.length && (r.tight || r.sw.every(x => x.word && x.shown && x.text && x.w > 0 && x.w <= 32 && x.aria.length > 3)), `R18-7 D8 ${lang} ${w}px 文字${ts}: ↻ の丸に短い字（${r.sw[0] && r.sw[0].text}）が見えて 32px 以内: ` + JSON.stringify(r));
    }
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
for (const [w, h] of [[360, 740], [375, 667], [390, 844], [195, 480]]) for (const ts of [0, 1, 2]) for (const lang of ['ja', 'ko']) {
    if (!want('R18-9')) break;
    const {p, ctx} = await open({w, h, lang, ts, fam: 1, dc: w === 195 ? 3 : 4, sv: 3}, `r57-${w}-${ts}-${lang}`);
    const r = await p.evaluate(async () => {
        // 上の段の ⚠ の札が2つ（主菜も汁ものも当たる: 鮭のムニエル＋出汁の味噌汁など）の献立は、幅195px・文字もっと大きいでは詰めても上の段が最初の画面に入らない（v116 でも同じ。札の2行ぶんで約14px 足りない）。
        // この項目は「札が1つの上の段」の見え方を見るので、札が2つ以上の献立は選び直す（乱数の展開で出る献立が変わると、たまたま当たって落ちていた）
        const tags0 = () => document.querySelectorAll('#view .tg-row:first-child .alg-tag').length;
        let hit = false; for (let i = 0; i < 8 && !(hit && tags0() <= 1); i++){   /* 当たる料理が出なければ、すぐ下で当たる主菜を置く（前は60回作り直していて、1画面で十数秒かかった） */ window.scrollTo(0, 0); session.menu = null; render(); await __tick(); hit = safeSayDishes().some(r => isAvoidedCore(r)); }
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
for (const lang of ['de', 'fr', 'it', 'ar', 'es', 'fil', 'tr', 'pl']) {
    if (!want('R18-10')) break;
    const {p, ctx} = await open({w: 390, h: 844, lang, dc: 3, sv: 2}, `r58-${lang}`);   // 1言語に1ページ。画面の幅・文字の大きさはその中で切りかえる（R18-8 と同じ。ページを開き直す時間を減らす）
    for (const [w, h] of [[390, 844], [360, 740], [430, 932]]) for (const ts of [0, 1, 2]) {
    await p.setViewportSize({width: w, height: h});
    const r = await p.evaluate(async ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; TRAY_FIT.state = null; window.scrollTo(0, 0); let st = null; for (let i = 0; i < 30 && !st; i++){ session.menu = null; render(); await __tick(); st = document.querySelector('#view .tray .spot .swap[data-act=staple-next]:not(.tray-add)'); }
        const tr = document.querySelector('#view .tray'), info = e => { const rg = document.createRange(); rg.selectNodeContents(e); const q = rg.getBoundingClientRect(); const s = e.querySelector('.sw-s'); return {word: e.classList.contains('sw-word'), text: s ? s.textContent : '', shown: !!s && getComputedStyle(s).display !== 'none' && parseFloat(getComputedStyle(e).fontSize) > 0, w: Math.round(q.width), aria: e.getAttribute('aria-label') || ''}; };
        const re = tr.querySelector('.spot .swap[data-act=reroll]');
        return {tight: tr.classList.contains('tight'), staple: st ? info(st) : null, reroll: re ? info(re) : null, whole: t('献立を変える')}; }, ts);
    const s = r.staple, q = r.reroll;
    ok(s && q && (r.tight || (s.word && s.shown && s.text && s.text === q.text && s.w > 0 && s.w <= 32 && s.aria.length > 3 && s.text !== r.whole && (lang !== 'de' || s.text === 'Tausch'))), `R18-10 R58 ${lang} ${w}px 文字${ts}: 主食の ↻ の丸に主菜と同じ短い字（${s && s.text}）が見えて 32px 以内: ` + JSON.stringify(r));
    }
    await ctx.close();
}

// R18-11（R33 の残り → オーナー指示 11/04）195px・スクロールした位置（0・60・120・200px、丸を真ん中にした位置）× 文字3段階 × 家族の魚⚠あり/なし × 2回 = 60回。まるごと入れ替えを押しても「元に戻す」のお知らせは出ない
if (want('R18-11')) {
    let n = 0; const bad = [];
    for (const ts of [0, 1, 2]) for (const fam of [0, 1]) {
        const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, fam, dc: 3, sv: 3, wants: fam}, `r33s-${ts}-${fam}`);
        for (const sy of [0, 60, 120, 200, 'mid']) for (let i = 0; i < 2; i++) {
            const r = await p.evaluate(async sy => { if (toast.hide) toast.hide(); window.scrollTo(0, 0); await __tick(); if (sy === 'mid') document.querySelector('#view [data-act=new-menu]').scrollIntoView({block: 'center'}); else window.scrollTo(0, sy); await __tick(); const y0 = Math.round(scrollY);
                __tap('#view [data-act=new-menu]', 'new-menu'); await __tick(); await new Promise(r => setTimeout(r, 350)); const c = __toastCover(); c.y0 = y0; c.y1 = Math.round(scrollY); c.undo = !!document.querySelector('#view .tg-mid .mb-back'); return c; }, sy);
            n++; const ctl = r.cover ? r.cover.filter(x => !/^H1/.test(x)) : [];
            if (r.none || !r.undo || !/前の献立|前へ/.test(r.text || '') || (r.bottom > 0 && ctl.length) || r.vessels) bad.push(`文字${ts} 家族${fam} 送り${sy} #${i} ` + JSON.stringify(r));
            await p.waitForTimeout(200);
        }
        await ctx.close();
    }
    ok(n >= 60 && !bad.length, `R18-11 195px まるごと入れ替え ${n} 回（スクロールした位置でも）: 「↶ 前の献立」が丸の右隣に出て、絵・料理名・↻にかからない（オーナー指示 11/05）: ` + bad.slice(0, 3).join(' / '));
}

// R18-12（R39 の残り）195px・画面が切りかわった直後のお知らせ（「準備ができました…」と同じ出し方）: アプリの名前（h1）ではなく器の絵の帯に出る。料理名・↻・ボタンにもかからない。文字3段階 × 家族あり/なし
for (const ts of [0, 1, 2]) for (const fam of [0, 1]) {
    if (!want('R18-12')) break;
    const {p, ctx} = await open({w: 195, h: 422, lang: 'ja', ts, fam, dc: 3, sv: 3, wants: fam}, `r39n-${ts}-${fam}`);
    const r = await p.evaluate(async () => { window.scrollTo(0, 0); TOAST_TAP.at = performance.now(); TOAST_TAP.layer = true; TOAST_TAP.y = 200; TOAST_TAP.box = null; TOAST_TAP.act = ''; toast(t('準備ができました。今日の献立はこちらです'), true); await __tick(); await new Promise(r => setTimeout(r, 350)); const c = __toastCover(); c.h1 = c.cover.some(x => /^H1/.test(x)); c.core = c.cover.filter(x => /^(nm|alg-tag|swap|shuffle|btn|p2-ok)/.test(x)); return c; });
    ok(!r.none && !r.h1 && !r.core.length, `R18-12 R39 195px 文字${ts} 家族${fam}: 切りかわった直後のお知らせがアプリの名前・料理名・↻・ボタンを隠さない（器の絵の上は可）: ` + JSON.stringify(r));
    await ctx.close();
}

// 第19回の共通: お知らせの隠れ（ページに留めたお知らせは、下の帯・タブより下、上の端より上へ出たあいだは visibility:hidden）
const coverCore = c => c.hidden ? [] : (c.cover || []).filter(x => /^(nm|alg-tag|swap|shuffle|btn|p2-ok)/.test(x));

// R18-13（R59）決めた直後のお知らせ: 360/375/390/430/195 × 文字3段階 × 家族の魚⚠ × 押し方2通り（画面の上の固定の決定ボタン／下の段を真ん中にスクロールして押す）。押した直後（送った位置）・上まで戻した位置・いちばん下・元の位置のどこでも、料理名・↻・札・決定・「✓ 決めた」にかからない。送った位置では見える
if (want('R18-13')) {
    let n = 0; const bad = [];
    for (const [w, h] of [[360, 740], [375, 667], [390, 844], [430, 932], [195, 422]]) for (const ts of [0, 1, 2]) for (const fam of [0, 1]) for (const mode of ['top', 'mid']) {
        const {p, ctx} = await open({w, h, lang: 'ja', ts, fam, dc: w === 195 ? 3 : 4, sv: 3, wants: fam}, `r59-${w}-${ts}-${fam}-${mode}`);
        {
            const r = await p.evaluate(async mode => { window.scrollTo(0, 0); session.menu = null; render(); await __tick();
                if (!document.querySelector('#view [data-act=decide]')) return {err: '決定なし'};
                if (mode === 'mid'){ const rows = document.querySelectorAll('#view .tray .tg-row'); rows[rows.length - 1].scrollIntoView({block: 'center'}); await __tick(); }
                const hid = () => { const bx = document.querySelector('#toast-root .toast'); return !!bx && getComputedStyle(bx).visibility === 'hidden'; };
                const at = async (sy, tag) => { if (sy != null){ TOAST_TAP.at = performance.now(); window.scrollTo(0, sy); await __tick(); await new Promise(r => setTimeout(r, 80)); } toastAlign(); const c = __toastCover(); c.hidden = hid(); c.sy = Math.round(scrollY); c.tag = tag; return c; };
                __tap('#view [data-act=decide]', 'decide'); await __tick(); for (let i = 0; i < 100 && !document.querySelector('#toast-root .toast[data-placed]'); i++) await new Promise(r => setTimeout(r, 20)); await new Promise(r => setTimeout(r, 400)); await __tick(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; guard('tray', fitTray); await __tick();   // 字の読みこみ後の測り直し（fonts loadingdone）と同じ: 置いたあとにお膳を詰め直しても、お知らせが付いてくる   // 置き場所が決まるのを待つ（CI の遅さに依らない）
                const a = await at(null, 'auto'); const bx = document.querySelector('#toast-root .toast'); a.pos = bx ? getComputedStyle(bx).position : '';
                const b = await at(0, 'top'), c = await at(1e6, 'max'), d = await at(a.sy, 'back');
                return {a, b, c, d}; }, mode);
            n++;
            if (r.err){ bad.push(`${w}px 文字${ts} 家族${fam} ${mode}: ` + r.err); continue; }
            const hits = [r.a, r.b, r.c, r.d].map(x => [x.tag, coverCore(x)]).filter(x => x[1].length);
            if (r.a.none || r.a.hidden || r.a.pos !== 'absolute' || hits.length) bad.push(`${w}px 文字${ts} 家族${fam} ${mode}: ` + JSON.stringify({auto: r.a, hits}).slice(0, 400));
        }
        await ctx.close();
    }
    ok(n >= 60 && !bad.length, `R18-13 R59 決めた直後のお知らせ ${n} 回（5幅 × 文字3段階 × 家族 × 押し方2通り）: ページに留まり、送った位置で見える。上まで戻しても・いちばん下でも・元の位置でも、料理名・↻・札・決定・「✓ 決めた」にかからない: ` + bad.slice(0, 3).join(' / '));
}

// R18-14（R60）最初の「準備ができました…」（画面が切りかわった直後の出し方）: 360/390/430 × 文字3段階 × 家族。送った位置・上まで戻した位置・いちばん下で、料理名・↻・札・決定にかからない
if (want('R18-14')) {
    let n = 0; const bad = [];
    for (const [w, h] of [[360, 740], [390, 844], [430, 932]]) for (const fam of [0, 1]) {
        const {p, ctx} = await open({w, h, lang: 'ja', fam, dc: 4, sv: fam ? 3 : 2}, `r60-${w}-${fam}`);
        for (const ts of [0, 1, 2]) {
            const r = await p.evaluate(async ts => { if (toast.hide) toast.hide(); if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; window.scrollTo(0, 0); session.menu = null; render(); await __tick();
                const hid = () => { const bx = document.querySelector('#toast-root .toast'); return !!bx && getComputedStyle(bx).visibility === 'hidden'; };
                const at = async (sy, tag) => { if (sy != null){ TOAST_TAP.at = performance.now(); window.scrollTo(0, sy); await __tick(); await new Promise(r => setTimeout(r, 80)); } toastAlign(); const c = __toastCover(); c.hidden = hid(); c.sy = Math.round(scrollY); c.tag = tag; return c; };
                TOAST_TAP.at = performance.now(); TOAST_TAP.layer = true; TOAST_TAP.y = 300; TOAST_TAP.box = null; TOAST_TAP.act = ''; toast(t('準備ができました。今日の献立はこちらです'), true); await __tick(); for (let i = 0; i < 100 && !document.querySelector('#toast-root .toast[data-placed]'); i++) await new Promise(r => setTimeout(r, 20)); await new Promise(r => setTimeout(r, 400)); await __tick(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; guard('tray', fitTray); await __tick();   // 字の読みこみ後の測り直し（fonts loadingdone）と同じ: 置いたあとにお膳を詰め直しても、お知らせが付いてくる
                const a = await at(null, 'auto'), b = await at(0, 'top'), c = await at(1e6, 'max'); return {a, b, c}; }, ts);
            n++;
            const hits = [r.a, r.b, r.c].map(x => [x.tag, coverCore(x)]).filter(x => x[1].length);
            if (r.a.none || r.a.hidden || hits.length) bad.push(`${w}px 文字${ts} 家族${fam}: ` + JSON.stringify({auto: r.a, hits}).slice(0, 400));
            await p.waitForTimeout(150);
        }
        await ctx.close();
    }
    ok(n >= 18 && !bad.length, `R18-14 R60 最初の「準備ができました…」 ${n} 回（360/390/430 × 文字3段階 × 家族）: 送った位置で見える。上まで戻しても・いちばん下でも料理名・↻・札・決定にかからない: ` + bad.slice(0, 3).join(' / '));
}

// R18-15（R62）条件のボタンの字: 品数おまかせのときは「2人分・おまかせ」（3つ目を出さない）。17言語 × 390 × ふつう/文字大。日・英・韓・中・独・仏・西・伊は全部見える。ほかも見える字が 8 割以上。気分が「ラクの日」なら「2人分・ラクの日」、品数を決めているときは「2人分・4品」（第21回 R77 で、おまかせの物は書かないことにした）
if (want('R18-15')) {
    let n = 0; const bad = [];
    const FULL = ['ja', 'en', 'ko', 'zh-Hans', 'de', 'fr', 'es', 'it'];
    for (const lang of Object.keys(CC)) {
        const {p, ctx} = await open({w: 390, h: 844, lang, dc: 'auto', sv: 2}, `r62-${lang}`);
        for (const ts of [0, 1]) for (const mood of ['all', 'easy']) {
            const r = await p.evaluate(async ([ts, mood]) => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); session.mood = mood; session.menu = null; TRAY_FIT.key = ''; TRAY_FIT.base = ''; window.scrollTo(0, 0); render(); await __tick();
                const ch = document.querySelector('#view [data-act=cond-open]'), sv = ch && ch.querySelector('.sv1'); if (!sv) return {err: 'なし'};
                const sb = sv.getBoundingClientRect(), rg = document.createRange(); let vis = 0, all = 0; const tw = document.createTreeWalker(sv, NodeFilter.SHOW_TEXT); let node;
                while ((node = tw.nextNode())) for (let i = 0; i < node.data.length; i++){ rg.setStart(node, i); rg.setEnd(node, i + 1); const q = rg.getBoundingClientRect(); if (!q.width) continue; all++; if (q.right <= sb.right + .5 && q.left >= sb.left - .5) vis++; }
                return {text: sv.textContent, vis, all, sep: t('・'), auto: t('おまかせ'), dc: t('品数おまかせ'), easy: t('ラクの日')}; }, [ts, mood]);
            n++;
            if (r.err){ bad.push(`${lang} 文字${ts} ${mood}: なし`); continue; }
            const parts = r.text.split(r.sep).map(x => x.trim()), wantParts = 2;   // 第21回 R77: 気分を選んだときは「2人分・ラクの日」（品数おまかせの「おまかせ」は書かない）
            const okText = parts.length === wantParts && !r.text.includes(r.dc) && (mood === 'all' ? parts[1] === r.auto : parts[1] === r.easy);
            const okVis = FULL.includes(lang) ? r.vis >= r.all : r.vis >= r.all * .7;
            if (!okText || (mood === 'all' && !okVis)) bad.push(`${lang} 文字${ts} ${mood}: ` + JSON.stringify(r));
        }
        await ctx.close();
    }
    ok(n >= 68 && !bad.length, `R18-15 R62 条件のボタンの字 ${n} 画面（17言語 × 390 × ふつう/文字大 × 気分2通り）: 「2人分・おまかせ」「2人分・ラクの日」の2つ。主な8言語は全部見える・ほかも 7 割以上: ` + bad.slice(0, 3).join(' / '));
}

// R18-16（R54 の残り）波・越 × 360/375 × 文字大/もっと大きい: 見出しの字が条件のボタンの箱に隠れない（1行に入らない見出しは 17px の2行。見出しの行は 48px 以下）
for (const lang of ['pl', 'vi']) for (const [w, h] of [[360, 740], [375, 667]]) for (const ts of [1, 2]) {
    if (!want('R18-16')) break;
    const {p, ctx} = await open({w, h, lang, ts, dc: 'auto', sv: 2}, `r54b-${lang}-${w}-${ts}`);
    const r = await p.evaluate(async () => { window.scrollTo(0, 0); session.menu = null; render(); await __tick();
        const h2 = document.querySelector('#view .today-head h2'), ch = document.querySelector('#view [data-act=cond-open]'); if (!h2 || !ch) return {err: 'なし'};
        const hb = h2.getBoundingClientRect(), cb = ch.getBoundingClientRect(), tx = h2.firstChild, rg = document.createRange(); rg.selectNodeContents(tx);
        let hidden = 0, all = 0; for (let i = 0; i < tx.data.length; i++){ rg.setStart(tx, i); rg.setEnd(tx, i + 1); const q = rg.getBoundingClientRect(); if (!q.width) continue; all++; if (q.right > hb.right + .5 || q.right > cb.left + .5 && q.bottom > cb.top && q.top < cb.bottom) hidden++; }
        return {text: tx.data, all, hidden, two: h2.classList.contains('h2-2l'), h2h: Math.round(hb.height), headH: Math.round(document.querySelector('#view .today-head').getBoundingClientRect().height), fs: getComputedStyle(h2).fontSize, tight: document.body.classList.contains('tray-tight')}; });
    ok(!r.err && !r.hidden && r.headH <= 48, `R18-16 R54 ${lang} ${w}px 文字${ts}: 見出し「${r.text}」の字が全部見える（条件のボタンの箱に隠れない）・見出しの行は 48px 以下: ` + JSON.stringify(r));
    await ctx.close();
}

// R18-17（195px の残り）195×422 × 文字大/もっと大きい × 日本語/英語・家族の魚⚠で決めたあと: 「⚠ 夫に合わない料理があります」が切れない（2行まで・11px）。「✓ 決めた」の印が条件のボタンの箱に重ならず、見出しの箱からはみ出さない
for (const ts of [1, 2]) for (const lang of ['ja', 'en']) {
    if (!want('R18-17')) break;
    const {p, ctx} = await open({w: 195, h: 422, lang, ts, fam: 1, dc: 3, sv: 2}, `n195-${ts}-${lang}`);
    const r = await p.evaluate(async () => {
        // 上の段の ⚠ の札が2つ（主菜も汁ものも当たる: 鮭のムニエル＋出汁の味噌汁など）の献立は、幅195px・文字もっと大きいでは詰めても上の段が最初の画面に入らない（v116 でも同じ。札の2行ぶんで約14px 足りない）。
        // この項目は「札が1つの上の段」の見え方を見るので、札が2つ以上の献立は選び直す（乱数の展開で出る献立が変わると、たまたま当たって落ちていた）
        const tags0 = () => document.querySelectorAll('#view .tg-row:first-child .alg-tag').length;
        let hit = false; for (let i = 0; i < 8 && !(hit && tags0() <= 1); i++){   /* 当たる料理が出なければ、すぐ下で当たる主菜を置く（前は60回作り直していて、1画面で十数秒かかった） */ window.scrollTo(0, 0); session.menu = null; render(); await __tick(); hit = safeSayDishes().some(r => isAvoidedCore(r)); }
        if (!hit){ const bad = RECIPES.find(x => slotOf(x) === '主菜' && isAvoidedCore(x)); if (bad){ session.menu.items[0].r = bad; TRAY_FIT.key = ''; TRAY_FIT.state = null; render(); await __tick(); hit = safeSayDishes().some(r => isAvoidedCore(r)); } }
        __tap('#view [data-act=decide]', 'decide'); await __tick(); await new Promise(r => setTimeout(r, 350)); if (toast.hide) toast.hide(); window.scrollTo(0, 0); setTab('today'); render(); await __tick(); window.scrollTo(0, 0); await __tick();
        const lines = [...document.querySelectorAll('#view .alg-bar, #view .alg-top')].filter(e => getComputedStyle(e).display !== 'none').map(e => { const rg = document.createRange(); rg.selectNodeContents(e); return {text: e.textContent.trim(), h: Math.round(e.getBoundingClientRect().height), cutW: e.scrollWidth > e.clientWidth + 1, cutH: e.scrollHeight > e.clientHeight + 1, fs: getComputedStyle(e).fontSize}; });
        const okB = document.querySelector('#view .p2-ok'), ch = document.querySelector('#view [data-act=cond-open]'), h2 = document.querySelector('#view .today-head h2'); if (!okB || !ch || !h2) return {err: 'なし', lines};
        const q = okB.getBoundingClientRect(), cb = ch.getBoundingClientRect(), hb = h2.getBoundingClientRect();
        const ov = q.right > cb.left + .5 && q.left < cb.right - .5 && q.bottom > cb.top + .5 && q.top < cb.bottom - .5, out = q.right > hb.right + .5 || q.left < hb.left - .5 || q.bottom > hb.bottom + .5 || q.top < hb.top - .5;
        const top = document.elementsFromPoint(q.right - 2, (q.top + q.bottom) / 2)[0];
        return {hit, lines, ok: {w: Math.round(q.width), h: Math.round(q.height), ov, out, topIsOk: !!top && (top === okB || okB.contains(top))}, row0: __rows()[0], cls: document.body.className.replace('on-today', '').trim()}; });
    ok(!r.err && r.hit && r.lines.length && r.lines.every(x => !x.cutW && !x.cutH && x.h <= 32) && !r.ok.ov && !r.ok.out && r.ok.topIsOk && r.ok.h <= 24 && r.row0 && !r.row0.hid.length, `R18-17 195px ${lang} 文字${ts}: 決めたあとの ⚠ の行が切れない（32px 以下）・「✓ 決めた」が条件のボタンに重ならず見出しの箱の中（24px 以下）・上の段はタブより上: ` + JSON.stringify(r));
    await ctx.close();
}

// R18-18（R66）決めた直後のお知らせ: 家族の魚⚠で帯に ⚠ の行が付く 375/360 × 文字3段階 → 画面の上で決める → 置いた位置で見える（帯の裏に入らない）・料理名・↻・札・決定にかからない。430 × 文字3段階 × 家族で、🔍 の札の2行目「🔁 昆布だしで作る」（swap-line）にもかからない
if (want('R18-18')) {
    let n = 0; const bad = [];
    for (const [w, h] of [[375, 667], [360, 740], [430, 932]]) for (const ts of [0, 1, 2]) {
        const {p, ctx} = await open({w, h, lang: 'ja', ts, fam: 1, dc: 4, sv: 3}, `r66-${w}-${ts}`);
        const r = await p.evaluate(async w => {
            // 当たる主菜（⚠ の行）と、昆布だしにした汁もの（🔁 の2行目）を置く（判定はアプリのまま）
            window.scrollTo(0, 0); session.menu = null; render(); await __tick();
            const m = session.menu, bad = RECIPES.find(x => slotOf(x) === '主菜' && isAvoidedCore(x)), soup = RECIPES.find(x => slotOf(x) === '汁物' && !isAvoided(x) && typeof dashiSwapped === 'function' && dashiSwapped(x));
            if (bad) m.items[0].r = bad; const si = m.items.findIndex(x => x.slot === '汁物'); if (soup && si >= 0) m.items[si].r = soup;
            TRAY_FIT.key = ''; TRAY_FIT.base = ''; TRAY_FIT.state = null; window.scrollTo(0, 0); render(); await __tick();
            const warn = !!bad && safeSayDishes().some(r => isAvoidedCore(r)), swapLine = !!document.querySelector('#view .spot .swap-line');
            __tap('#view [data-act=decide]', 'decide'); await __tick(); for (let i = 0; i < 100 && !document.querySelector('#toast-root .toast[data-placed]'); i++) await new Promise(r => setTimeout(r, 20)); await new Promise(r => setTimeout(r, 400)); await __tick(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; guard('tray', fitTray); await __tick();   // 字の読みこみ後の測り直し（fonts loadingdone）と同じ: 置いたあとにお膳を詰め直しても、お知らせが付いてくる toastAlign();
            const c = __toastCover(); const box = document.querySelector('#toast-root .toast'); c.hidden = !!box && getComputedStyle(box).visibility === 'hidden';
            const R = box && box.getBoundingClientRect(), ov = q => R && q.width > 1 && q.height > 1 && q.bottom > R.top + .5 && q.top < R.bottom - .5 && q.right > R.left + .5 && q.left < R.right - .5;
            c.swap = [...document.querySelectorAll('#view .spot .swap-line')].filter(e => ov(e.getBoundingClientRect())).map(e => e.textContent.trim());
            c.algLine = [...document.querySelectorAll('#view .alg-bar, #view .alg-top')].some(e => getComputedStyle(e).display !== 'none');
            return Object.assign(c, {warn, swapLine, sy: Math.round(scrollY)}); }, w);
        n++;
        const core = r.none ? [] : (r.cover || []).filter(x => /^(nm|alg-tag|swap|shuffle|btn|p2-ok)/.test(x));
        if (r.none || r.hidden || core.length || r.swap.length || !r.warn) bad.push(`${w}px 文字${ts}: ` + JSON.stringify(r).slice(0, 400));
        await ctx.close();
    }
    ok(n >= 9 && !bad.length, `R18-18 R66 家族の魚⚠で決めた直後のお知らせ ${n} 回（375/360/430 × 文字3段階）: 帯に ⚠ の行が付いても置いた位置で見える。料理名・↻・札・🔁 の2行目・決定にかからない: ` + bad.slice(0, 3).join(' / '));
}

// R18-19（R63）「明日から」の「元に戻す」付きのお知らせ: 195×422・もっと大きい は1語＋ボタンの低い形（56px 以下）で下の段の料理名・↻にかからない。430 × ふつう/もっと大きい × 上/スクロールした位置 では「✓ 決めました」の帯にかからない
for (const [w, h, ts, pos] of [[195, 520, 2, 'top'], [195, 520, 2, 'mid'], [430, 932, 0, 'top'], [430, 932, 0, 'mid'], [430, 932, 2, 'top'], [430, 932, 2, 'mid']]) {
    if (!want('R18-19')) break;
    const {p, ctx} = await open({w, h, lang: 'ja', ts, dc: w === 195 ? 3 : 4, sv: 2}, `r63-${w}-${ts}-${pos}`);
    const r = await p.evaluate(async pos => { window.scrollTo(0, 0); session.menu = null; render(); await __tick(); __tap('#view [data-act=decide]', 'decide'); await __tick(); await new Promise(r => setTimeout(r, 400)); tapGuard = 0; if (toast.hide) toast.hide(); window.scrollTo(0, 0); setTab('today'); render(); await __tick();   // tapGuard: 決めた直後 350ms は押せない（テストは時計を止めているので外す）
        if (pos === 'mid'){ const rows = document.querySelectorAll('#view .tray .tg-row'); rows[rows.length - 1].scrollIntoView({block: 'center'}); await __tick(); }
        openCondSheet(); await __tick(); const mb = document.querySelector('#sheet-root [data-act=mood][data-k=ten]'); if (!mb) return {err: '気分なし'}; TOAST_TAP.layer = true; TOAST_TAP.at = performance.now(); mb.click(); await __tick(); await new Promise(r => setTimeout(r, 200));
        const lt = document.querySelector('#sheet-root [data-act=later-tomorrow]'); if (!lt) return {err: '明日からなし'}; TOAST_TAP.layer = true; TOAST_TAP.at = performance.now(); TOAST_TAP.y = lt.getBoundingClientRect().top + 5; lt.click(); await __tick(); for (let i = 0; i < 100 && !document.querySelector('#toast-root .toast[data-placed]'); i++) await new Promise(r => setTimeout(r, 20)); await new Promise(r => setTimeout(r, 400)); await __tick(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; guard('tray', fitTray); await __tick();   // 字の読みこみ後の測り直し（fonts loadingdone）と同じ: 置いたあとにお膳を詰め直しても、お知らせが付いてくる
        const c = __toastCover(); c.undo = !!document.querySelector('#toast-root [data-act=toast-undo]'); c.bar = c.cover.filter(x => /^btn/.test(x)); c.core = c.cover.filter(x => /^(nm|alg-tag|swap|shuffle|p2-ok)/.test(x)); c.sy = Math.round(scrollY); return c; }, pos);
    const okNarrow = w !== 195 || (r.h <= 56 && /compact/.test(r.cls || '') && /^明日から/.test(r.text || ''));
    ok(!r.err && !r.none && r.undo && okNarrow && !r.core.length && !r.bar.length, `R18-19 R63 ${w}px 文字${ts} ${pos}: 「明日から」の元に戻すのお知らせが${w === 195 ? '1語＋ボタンの低い形で' : ''}料理名・↻・札・「✓ 決めました」の帯にかからない: ` + JSON.stringify(r));
    await ctx.close();
}

// R18-20（R64 → オーナー指示 11/04）まるごと入れ替えのあとは「元に戻す」が出ず、そのあと条件で気分を変えても、新しいお膳の↻・条件のボタンにお知らせは乗らない。390/375 × 文字3段階
for (const [w, h] of [[390, 844], [375, 667]]) for (const ts of [0, 1, 2]) {
    if (!want('R18-20')) break;
    const {p, ctx} = await open({w, h, lang: 'ja', ts, dc: 4, sv: 2}, `r64-${w}-${ts}`);
    const r = await p.evaluate(async () => { window.scrollTo(0, 0); session.menu = null; render(); await __tick(); __tap('#view [data-act=new-menu]', 'new-menu'); await __tick(); await new Promise(r => setTimeout(r, 300));
        const before = !!document.querySelector('#view .tg-mid .mb-back'); openCondSheet(); await __tick(); const mb = document.querySelector('#sheet-root [data-act=mood][data-k=slow]'); if (!mb) return {err: '気分なし'}; mb.click(); await __tick(); await new Promise(r => setTimeout(r, 300));
        const sheetOpen = !!sheet; if (sheet) closeSheet(); await __tick(); const c = __toastCover(); return {before, sheetOpen, mood: session.mood, after: !!document.querySelector('#view .tg-mid .mb-back'), none: c.none, core: c.none ? [] : c.cover.filter(x => /^(nm|alg-tag|swap|shuffle|btn|p2-sv)/.test(x))}; });
    ok(!r.err && r.before && r.mood === 'slow' && !r.after && !r.core.length, `R18-20 ${w}px 文字${ts}: まるごと入れ替えのあとは「↶ 前の献立」が出て、気分を変える（ほかの方法で献立が変わる）と消え、↻・条件のボタンに乗らない（オーナー指示 11/05）: ` + JSON.stringify(r));
    await ctx.close();
}

// R18-21（R65）「買い物そろいました／元に戻す」が、作る段から「今日の献立」のタブに戻ったら消える。390/195 × 文字3段階
for (const [w, h] of [[390, 844], [195, 422]]) for (const ts of [0, 1, 2]) {
    if (!want('R18-21')) break;
    const {p, ctx} = await open({w, h, lang: 'ja', ts, dc: w === 195 ? 3 : 4, sv: 2}, `r65-${w}-${ts}`);
    const r = await p.evaluate(async () => { window.scrollTo(0, 0); session.menu = null; render(); await __tick(); __tap('#view [data-act=decide]', 'decide'); await __tick(); await new Promise(r => setTimeout(r, 400)); tapGuard = 0; if (toast.hide) toast.hide();
        setTab('today'); gotoStage('shop'); render(); await __tick(); const okb = document.querySelector('#view [data-act=shop-ok]'); if (!okb) return {err: 'そろったなし'}; __tap('#view [data-act=shop-ok]', 'shop-ok'); await __tick(); await new Promise(r => setTimeout(r, 300));
        const before = !!document.querySelector('#toast-root [data-act=toast-undo]'), stage = session.stage; document.querySelector('nav.tabs [data-tab=today]').click(); await __tick(); await new Promise(r => setTimeout(r, 300));
        const c = __toastCover(); return {before, stage, tab, after: !c.none, core: c.none ? [] : c.cover.filter(x => /^(nm|alg-tag|swap|shuffle|btn)/.test(x))}; });
    ok(!r.err && r.before && !r.after && !r.core.length, `R18-21 R65 ${w}px 文字${ts}: 買い物そろいましたの元に戻すが、今日の献立のタブに戻ったら消える: ` + JSON.stringify(r));
    await ctx.close();
}

ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
