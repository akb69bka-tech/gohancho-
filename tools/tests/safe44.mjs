#!/usr/bin/env node
// 第44回（安全）: 第42回モニター R203・R204 の回帰テスト
//  使い方: node tools/tests/safe44.mjs [http://localhost:9321/]   （ONLY=A または ONLY=B で片方だけ）
//  A（R203）設定の家族のアレルギーのチップ（乳製品など）を押しても、指の下のチップが替わらない
//   A1 押したあと、押したチップが同じ高さにある（上に「⚠ アレルギー: 夫（乳製品…）」などの行が増えても）。390/360/320px・ja/en/th・文字大
//   A2 0.25 秒あけた二度押しで、ほかのチップ（卵など）が入らない。押したチップも入ったまま
//   A3 2 秒後の押し直しは、同じチップに当たる（卵が入らない）
//   A4 押した形（aria-pressed）を先に描き、献立の確かめ（reconcileMenu）はそのあと（押した処理の中では行わない）。確かめは 1 秒のうちに済む
//   A5 押した直後に今日の献立へ移っても、合わない料理（乳製品）を献立に残さない
//  B（R204）🔍「袋の表示を確認」の材料名が、21か国 × 18言語で画面の言葉で出る（ほかの言葉・文字が残らない）。
//    対象: 食の決まり（ベジタリアン・ヴィーガン）の 🔍 と、アレルギー（肉・魚・えびかに・貝・ゼラチン）の 🔍 の名前。
//    （小麦・大豆・乳・卵などの 🔍 は、訳のない国の料理の材料名そのもの（英語）なので、ここでは見ない）
//   味噌・納豆（日本語のまま）、Barbecue sauce・Thai curry paste・chili jam・natto sauce・Ponzu・Shirasu・Chirimen jako（英語のまま）など
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const VEGI = ['@pork', '@chicken', '@beef', '@fish', '@shellfish'], VEGAN = VEGI.concat(['@egg', '@dairy']);
const boot = async (p) => p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 60000 }).catch(() => {});

// ---- A（R203）----
const famCtx = async (W, H, lang, cc, ts, tag) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('safe44', tag)));
    const st = { onboarded: true, algAsk: 0, firstUse: '2026-11-11', foldOpen: {}, settings: { country: cc, uiLang: lang, dishCount: 3, servings: 2, textSize: ts },
        family: [{ id: 'fa0', name: '妻', role: 'adult', avoid: [], allergy: [], mild: false }, { id: 'fa1', name: '夫', role: 'adult', avoid: [], allergy: [], mild: false }] };
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await boot(p); await p.waitForTimeout(400);
    await p.evaluate(() => { try{ applyTextSize(); }catch(e){} session.famOpen = 'fa1'; setGo('family-profile'); }); await p.waitForTimeout(900);
    return { p, ctx };
};
const SEL = v => `#view details.fam-member[data-fm="fa1"] [data-act="fam-alg-fam"][data-v="${v}"]`;
// 乳製品のチップを画面の中ほどへ（上に行が増えたとき、指の下に上のチップ（卵）が来る位置）
const place = async (p) => {
    await p.locator(SEL('dairy')).scrollIntoViewIfNeeded();
    await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); scrollBy(0, r.top - innerHeight * 0.45); }, SEL('dairy'));
    await p.waitForTimeout(400);
    const bx = await p.locator(SEL('dairy')).boundingBox();
    return { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2, top: bx.y };
};
// 人の二度押し（指を当てて離す、を gap ミリ秒あけて2回）。Playwright の tap は前の tap の後片付けを待つので、CDP で直に送る
const rawTap = async (ctx, p, pt, gap) => {
    const cdp = await ctx.newCDPSession(p);
    const one = async () => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
    const t0 = Date.now(); await one(); await sleep(Math.max(0, gap - (Date.now() - t0))); await one();
    await cdp.detach().catch(() => {});
};
const under = (p, pt) => p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y), a = e && e.closest('[data-act]'); return a ? a.dataset.act + ':' + (a.dataset.v || '') : null; }, [pt.x, pt.y]);
const alg = p => p.evaluate(() => S.family.find(m => m.id === 'fa1').allergy.slice());
if (want('A')){
    for (const [W, H, lang, cc, ts] of [[390, 844, 'ja', 'JP', 0], [360, 740, 'ja', 'JP', 0], [320, 640, 'ja', 'JP', 2], [390, 844, 'en', 'US', 0], [360, 740, 'th', 'TH', 0], [320, 640, 'en', 'GB', 2]]){
        const v = `${W}px ${lang} 文字${ts}`;
        // A1
        { const { p, ctx } = await famCtx(W, H, lang, cc, ts, 'a1' + v);
          const pt = await place(p);
          await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(1200);
          const bx = await p.locator(SEL('dairy')).boundingBox(), u = await under(p, pt), a = await alg(p);
          ok(bx && Math.abs(bx.y - pt.top) <= 2 && u === 'fam-alg-fam:dairy' && a.includes('@dairy'), `A1 ${v}: 押したチップが動かない（指の下は乳製品のまま）: ` + JSON.stringify({ before: Math.round(pt.top), after: bx && Math.round(bx.y), under: u, a }));
          await ctx.close(); }
        // A2 二度押し（0.25 秒）
        { const { p, ctx } = await famCtx(W, H, lang, cc, ts, 'a2' + v);
          const pt = await place(p);
          await rawTap(ctx, p, pt, 250);
          await p.waitForTimeout(1500); const a = await alg(p);
          ok(JSON.stringify(a) === '["@dairy"]', `A2 ${v}: 二度押しで、ほかのチップ（卵など）が入らない・乳製品は入ったまま: ` + JSON.stringify(a));
          await ctx.close(); }
        // A3 2 秒後の押し直し
        { const { p, ctx } = await famCtx(W, H, lang, cc, ts, 'a3' + v);
          const pt = await place(p);
          await p.touchscreen.tap(pt.x, pt.y); await sleep(2000); await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(1200);
          const a = await alg(p);
          ok(!a.some(x => x !== '@dairy'), `A3 ${v}: 2 秒後の押し直しは同じチップ（卵などが入らない）: ` + JSON.stringify(a));
          await ctx.close(); }
    }
    // A4・A5（日本・ja）: 献立に乳製品の料理を入れておく
    const setup = async (tag) => {
        const { p, ctx } = await famCtx(390, 844, 'ja', 'JP', 0, tag);
        const r = await p.evaluate(() => {
            const m = session.menu; if (!m) return null;
            const i = m.items.findIndex(x => x.slot === '主菜'), d = RECIPES.find(r => r.main && !isAvoided(r) && algSelectedHits(r, ['milk']).length && !algSelectedHits(r, ['egg']).length);
            if (i < 0 || !d) return null; m.items[i].r = d; return d.id;
        });
        return { p, ctx, r };
    };
    { const { p, ctx, r } = await setup('a4');
      const pt = await place(p);
      await p.evaluate(s => {
          window.__rc = 0; const f = reconcileMenu; reconcileMenu = function(...a){ window.__rc++; return f.apply(this, a); };
          window.__st = null;
          // 押した処理が終わった直後（同じタスクの続き）と、次の描画の時点で、確かめが何回走ったかを見る
          document.addEventListener('click', () => { if (window.__hit) window.__inClick = window.__rc; }, false);   // アプリの受け口（同じ document・先に登録）のあと
          document.addEventListener('click', e => { if (e.target.closest && e.target.closest(s)) { window.__hit = true; requestAnimationFrame(() => { const el = document.querySelector(s); window.__st = { rcAtFrame: window.__rc, pressed: el && el.getAttribute('aria-pressed') }; }); } }, true);
      }, SEL('dairy'));
      await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(1000);
      const s = await p.evaluate(() => ({ inClick: window.__inClick, frame: window.__st, rc: window.__rc, bad: session.menu.items.filter(x => x.r && allergyConflict(x.r)).map(x => x.r.id) }));
      ok(r && s.inClick === 0 && s.frame && s.frame.pressed === 'true' && s.frame.rcAtFrame === 0, 'A4 押した形を先に描き、献立の確かめは押した処理の中で行わない: ' + JSON.stringify({ r, s }));
      ok(r && s.rc >= 1 && !s.bad.length, 'A4 献立の確かめは 1 秒のうちに済む（乳製品の料理を替える）: ' + JSON.stringify({ r, s }));
      await ctx.close(); }
    // A6 遅い端末（CPU 1/4）: 押したあと、画面が長く止まらない（お知らせの置き場所を探す処理で 3 秒以上止まっていた）。押した形が 1.5 秒のうちに描かれる
    { const { p, ctx, r } = await setup('a6');
      const pt = await place(p);
      const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.evaluate(s => { const t0 = performance.now(); window.__lt = []; window.__pf = null; new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask' });
          document.addEventListener('click', e => { if (e.target.closest && e.target.closest(s)){ const tc = performance.now(); const f = () => { const el = document.querySelector(s); if (el && el.getAttribute('aria-pressed') === 'true') window.__pf = Math.round(performance.now() - tc); else requestAnimationFrame(f); }; requestAnimationFrame(f); } }, true); }, SEL('dairy'));
      await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(5000);
      const s = await p.evaluate(() => ({ lt: window.__lt, pressedFrame: window.__pf, a: S.family.find(m => m.id === 'fa1').allergy, toast: !!document.querySelector('#toast-root .toast') }));
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      ok(r && s.pressedFrame != null && s.pressedFrame < 1500 && Math.max(0, ...s.lt) < 1500 && s.a.includes('@dairy'), 'A6 CPU 1/4: 押した形が早く出て、長く止まらない: ' + JSON.stringify({ r, s }));
      await ctx.close(); }
    { const { p, ctx, r } = await setup('a5');
      const s = await p.evaluate(s => { document.querySelector(s).click(); setTab('today'); render(); return { tab, bad: session.menu.items.filter(x => x.r && allergyConflict(x.r)).map(x => x.r.id) }; }, SEL('dairy'));
      ok(r && s.tab === 'today' && !s.bad.length, 'A5 押した直後に今日の献立へ移っても、乳製品の料理を残さない: ' + JSON.stringify({ r, s }));
      await ctx.close(); }
}

// ---- B（R204）----
const LANGS = ['en', 'ja', 'ar', 'de', 'es', 'fil', 'fr', 'hi', 'id', 'it', 'ko', 'pl', 'pt-BR', 'th', 'tr', 'vi', 'zh-Hans', 'zh-Hant'];
const CCS = (process.env.CCS || 'JP BR CN DE EG ES FR GB ID IN IT KR MX PE PH PL TH TR TW US VN').split(' ');
const KANA = /[ぁ-んァ-ヶ]/, HAN = /[一-龯]/, HANGUL = /[가-힣]/, THAI = /[฀-๿]/, ARAB = /[؀-ۿ]/, DEVA = /[ऀ-ॿ]/, LATINW = /[A-Za-z]{3,}/;
const NONLAT = /[ぁ-んァ-ヶ一-龯가-힣฀-๿؀-ۿऀ-ॿ]/;
// その言葉の文字か
const scriptOk = (L, n) => {
    if (L === 'ja') return KANA.test(n) || HAN.test(n);
    if (L.startsWith('zh')) return HAN.test(n) && !KANA.test(n) && !HANGUL.test(n) && !LATINW.test(n);
    if (L === 'ko') return HANGUL.test(n) && !KANA.test(n) && !HAN.test(n) && !LATINW.test(n);
    if (L === 'th') return THAI.test(n) && !KANA.test(n) && !HAN.test(n) && !LATINW.test(n);
    if (L === 'hi') return DEVA.test(n) && !KANA.test(n) && !HAN.test(n) && !LATINW.test(n);
    if (L === 'ar') return ARAB.test(n) && !KANA.test(n) && !HAN.test(n) && !LATINW.test(n);
    return !NONLAT.test(n);
};
if (want('B')){
    const all = {};   // lang -> [[cc, id, name, kind]]
    let col = null;
    const runCc = async (cc) => {
        const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
        await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
        await ctx.addInitScript(seedScript(seedFor('safe44', 'b' + cc)));
        const st = { onboarded: true, algAsk: 0, firstUse: '2026-11-11', settings: { country: cc, uiLang: 'en', dishCount: 3, servings: 2, avoid: VEGAN, allergens: [] } };
        await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
        const p = await ctx.newPage(); p.on('pageerror', e => errs.push('b' + cc + ': ' + e.message));
        await p.goto(URL_); await boot(p);
        if (!col) col = await p.evaluate(() => typeof MAY_LOC !== 'undefined' ? Object.fromEntries(MAY_LOC_LANGS.map((l, k) => [l, MAY_LOC.map(x => x[1].split('|')[k])])) : {});
        for (const L of LANGS){
            const r = await p.evaluate(async ([L, VEGAN, VEGI]) => {
                if (LANG !== L && !(L === 'ja' && LANG === 'ja')){ await switchLang(L, ++uiLangSeq); }
                const o = [];
                for (const av of [VEGAN, VEGI]){ S.settings.avoid = av; RECIPES.forEach(r => { if (!isAvoidedCore(r)) dietMayHits(r).forEach(n => o.push([r.id, n, 'diet'])); }); }
                S.settings.avoid = VEGAN;
                // アレルギーの 🔍 は、肉・魚・えびかに・貝・ゼラチン（食の決まりと同じなかま。DIET_MAY_ALG）の「入っていることがある加工品」
                RECIPES.forEach(r => { const m = algRecipeMap(r); Object.keys(m).filter(id => DIET_MAY_ALG.includes(id)).forEach(id => m[id].filter(x => x.kind === 4).forEach(x => mayNameParts(id, x.name).forEach(n => o.push([r.id, n, 'alg:' + id])))); });
                return { lang: LANG, o };
            }, [L, VEGAN, VEGI]);
            if (r.lang !== L) errs.push(`b${cc}: 言語が ${L} にならない（${r.lang}）`);
            (all[L] = all[L] || []).push(...r.o.map(([id, n, k]) => [cc, id, n, k]));
        }
        await ctx.close();
    };
    const q = [...CCS]; await Promise.all([0, 1, 2].map(async () => { while (q.length) await runCc(q.shift()); }));
    const en = new Map(); (all.en || []).forEach(([cc, id, n]) => { const k = cc + '|' + id; if (!en.has(k)) en.set(k, new Set()); en.get(k).add(n.toLowerCase()); });
    for (const L of LANGS){
        const xs = all[L] || [], okSet = new Set((col && col[L]) || []);
        const bad = xs.filter(([cc, id, n]) => {
            if (/\?$/.test(n)) return true;
            if (okSet.has(n)) return false;
            if (!scriptOk(L, n)) return true;
            if (L !== 'en' && !NONLAT.test(n) && en.has(cc + '|' + id) && en.get(cc + '|' + id).has(n.toLowerCase())) return true;   // ラテン文字の言語: 英語の画面と同じ名前（英語のまま）
            return false;
        });
        const names = [...new Set(bad.map(x => x[2] + ' (' + x[0] + ':' + x[1] + ')'))];
        ok(xs.length > 20 && !bad.length, `B1 ${L}: 🔍 の材料名が画面の言葉で出る（${xs.length}件・${new Set(xs.map(x => x[2])).size}種類）: ` + JSON.stringify(names.slice(0, 30)) + (names.length > 30 ? ` ほか${names.length - 30}` : ''));
    }
    // 名前が出ていること（報告の例）: 味噌・納豆（日本）・Barbecue sauce（米国）・タイのカレーペースト・chili jam・Ponzu・しらす・ちりめんじゃこ・納豆のたれ
    const has = (L, cc, re) => (all[L] || []).some(x => x[0] === cc && re.test(x[2]));
    const MUST = [['JP', /^miso$/i, /ميسو/, /Miso/], ['JP', /natto/i, /الناتو/, /Natto-Soße/], ['JP', /ponzu/i, /بونزو/, /Ponzu/], ['JP', /shirasu|whitebait|chirimen/i, /شيراسو|جاكو/, /Shirasu|Chirimen/],
        ['US', /barbecue|bbq/i, /باربكيو/, /Grillsoße/], ['TH', /red curry paste/i, /الكاري الأحمر/, /rote Currypaste/], ['TH', /massaman/i, /ماسامان/, /Massaman-Currypaste/], ['TH', /chili jam|nam prik pao/i, /نام بريك باو/, /Chilimarmelade/]];
    for (const [cc, enRe, arRe, deRe] of MUST){
        ok(has('en', cc, enRe) && has('ar', cc, arRe) && has('de', cc, deRe), `B2 ${cc} ${enRe}: 🔍 に出て、ar・de でも訳で出る: ` + JSON.stringify(['en', 'ar', 'de'].map(L => [...new Set((all[L] || []).filter(x => x[0] === cc).map(x => x[2]))].slice(0, 40))));
    }
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe44: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
