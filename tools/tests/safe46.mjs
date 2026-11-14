#!/usr/bin/env node
// 第46回（安全）: 第44回モニター R206 の残り・R209 の残り・R210 の回帰テスト
//  使い方: node tools/tests/safe46.mjs [http://localhost:9291/]   （ONLY=A,C,E で一部だけ。REPS=回数）
//  A（R206）家族のアレルギー（乳製品）を指で二度押ししたとき、どの間合い（0.38〜0.6 秒）・どの速さの端末（CPU 1・1/4・1/6）でも、
//     知らせなしに外れない（外れたままなら、外したという知らせと「元に戻す」が画面に出ていて、押すと乳製品が戻る）。
//     1 秒あけたわざとの押し直しは外れる（知らせと「元に戻す」が出る）。マウスで押し直しても外れ、知らせが出る
//  C（R209 の残り）アレルギーを1つずつ選んだとき・食の決まりの 🔍 の名前が、画面の言葉で出る（21か国 × 18言語。日本の Bouillon powder・Ground beef・hoisin sauce・doenjang など）
//  E（R210）🔍 の名前が途中で切れない（「About」「Ok.」「…dip:」「… or」で終わる名前を出さない）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const boot = p => p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 60000 }).catch(() => {});

// ---- A（R206）----
const famCtx = async (W, H, lang, cc, ts, tag, touch = true) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('safe46', tag)));
    const st = { onboarded: true, algAsk: 0, firstUse: '2026-11-11', foldOpen: {}, settings: { country: cc, uiLang: lang, dishCount: 3, servings: 2, textSize: ts },
        family: [{ id: 'fa1', name: '夫', role: 'adult', avoid: [], allergy: [], mild: false }] };
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await boot(p); await p.waitForTimeout(300);
    await p.evaluate(() => { try{ applyTextSize(); }catch(e){} session.famOpen = 'fa1'; setGo('family-profile'); }); await p.waitForTimeout(800);
    return { p, ctx };
};
const SEL = v => `#view details.fam-member[data-fm="fa1"] [data-act="fam-alg-fam"][data-v="${v}"]`;
const place = async (p, v = 'dairy') => {
    await p.locator(SEL(v)).scrollIntoViewIfNeeded();
    await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); scrollBy(0, r.top - innerHeight * 0.45); }, SEL(v));
    await p.waitForTimeout(300);
    const bx = await p.locator(SEL(v)).boundingBox();
    return { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 };
};
const touch1 = async (cdp, pt) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
// 状態: 乳製品が入っているか・押した形か・知らせ（外した・元に戻す）が画面の中に見えているか
const state = p => p.evaluate(s => {
    const m = S.family.find(m => m.id === 'fa1'), tb = document.querySelector('#toast-root .toast'), u = tb && tb.querySelector('[data-act="toast-undo"]');
    let vis = false; if (tb && u){ const r = tb.getBoundingClientRect(), cs = getComputedStyle(tb); vis = r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.opacity !== '0' && !tb.classList.contains('placing'); }
    return { alg: m.allergy.slice(), pressed: document.querySelector(s).getAttribute('aria-pressed'), toast: tb ? tb.textContent.trim().slice(0, 80) : null, undo: !!u, vis };
}, SEL('dairy'));
// 外れたままのとき: 知らせが見えていて、「元に戻す」で乳製品が戻ること
const checkOff = async (p, s) => {
    if (s.alg.includes('@dairy')) return { kept: true };
    if (!s.undo || !s.vis) return { kept: false, noticed: false };
    await p.evaluate(() => document.querySelector('#toast-root [data-act="toast-undo"]').click()); await p.waitForTimeout(600);
    const s2 = await state(p);
    return { kept: false, noticed: true, restored: s2.alg.includes('@dairy') && s2.pressed === 'true' };
};
if (want('A')){
    const reps = Number(process.env.REPS || 2);
    for (const [W, H, lang, cc, ts] of [[360, 740, 'ja', 'JP', 1], [320, 640, 'en', 'US', 2]]){
        for (const cpu of [1, 4, 6]){
            for (const gap of [380, 400, 420, 450, 500, 600]){
                const bad = [];
                for (let k = 0; k < reps; k++){
                    const { p, ctx } = await famCtx(W, H, lang, cc, ts, `a${W}${lang}${cpu}${gap}${k}`);
                    const pt = await place(p); const cdp = await ctx.newCDPSession(p);
                    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
                    const t0 = Date.now(); await touch1(cdp, pt); await sleep(Math.max(0, gap - (Date.now() - t0))); await touch1(cdp, pt);
                    await p.waitForTimeout(cpu > 1 ? 2500 : 1000);
                    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
                    const s = await state(p), c = await checkOff(p, s);
                    if (s.alg.some(x => x !== '@dairy') || !(c.kept || (c.noticed && c.restored))) bad.push({ k, s, c });
                    await ctx.close();
                }
                ok(!bad.length, `A1 ${W}px ${lang} CPU 1/${cpu} 二度押し ${gap}ms: 知らせなしに外れない（外れたら知らせと元に戻す。${reps}回）: ` + JSON.stringify(bad));
            }
            // 1 秒あけたわざとの押し直し: 外れて、知らせと「元に戻す」が出る
            { const { p, ctx } = await famCtx(W, H, lang, cc, ts, `r${W}${lang}${cpu}`);
              const pt = await place(p); const cdp = await ctx.newCDPSession(p);
              if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
              await touch1(cdp, pt); await p.waitForTimeout(cpu > 1 ? 1600 : 1000); const mid = await state(p); await touch1(cdp, pt); await p.waitForTimeout(cpu > 1 ? 2500 : 1000);
              await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
              const s = await state(p);
              ok(mid.alg.includes('@dairy') && !s.alg.length && s.pressed === 'false' && s.undo && s.vis, `A2 ${W}px ${lang} CPU 1/${cpu} 1秒あけた押し直し: 外れて、知らせと元に戻すが出る: ` + JSON.stringify({ mid, s }));
              const c = await checkOff(p, s);
              ok(c.restored, `A2 ${W}px ${lang} CPU 1/${cpu} 元に戻すで乳製品が戻る: ` + JSON.stringify(c));
              await ctx.close(); }
        }
    }
    // A3 マウスで押し直すと外れ、知らせが出る。主なアレルゲン（そば）・入力した言葉の × でも同じ
    { const { p, ctx } = await famCtx(390, 844, 'ja', 'JP', 0, 'a3', false);
      await p.locator(SEL('dairy')).click(); await p.waitForTimeout(100); const s1 = await state(p);
      await p.locator(SEL('dairy')).click(); await p.waitForTimeout(300); const s2 = await state(p);
      ok(s1.alg.includes('@dairy') && !s2.alg.length && s2.undo && /乳製品/.test(s2.toast || ''), 'A3 マウスで押し直すと外れ、外した知らせ（乳製品）と元に戻す: ' + JSON.stringify({ s1, s2 }));
      const w = '#view details.fam-member[data-fm="fa1"] [data-act="fam-alg-w"][data-v="そば"]';
      await p.locator(w).click(); await p.waitForTimeout(100); await p.locator(w).click(); await p.waitForTimeout(300);
      const s3 = await state(p);
      ok(s3.undo && /そば/.test(s3.toast || ''), 'A3 そばを外したときも知らせと元に戻す: ' + JSON.stringify(s3));
      await ctx.close(); }
}

// ---- C・E（R209 の残り・R210）: 21か国 × 18言語、条件ごとに 🔍 に出る名前を集める ----
const LANGS = ['en', 'ja', 'ar', 'de', 'es', 'fil', 'fr', 'hi', 'id', 'it', 'ko', 'pl', 'pt-BR', 'th', 'tr', 'vi', 'zh-Hans', 'zh-Hant'];
const CCS = (process.env.CCS || 'JP BR CN DE EG ES FR GB ID IN IT KR MX PE PH PL TH TR TW US VN').split(' ');
const VEGI = ['@pork', '@chicken', '@beef', '@fish', '@shellfish'], VEGAN = VEGI.concat(['@egg', '@dairy']);
const ALGS = ['milk', 'egg', 'wheat', 'gluten', 'soy', 'sesame', 'peanut', 'treenut', 'buckwheat', 'celery', 'mustard', 'sulphite', 'fish', 'crustacean', 'mollusc', 'beef', 'pork', 'chicken', 'gelatin'];
const CONDS = [{ n: 'vegi', avoid: VEGI, alg: [] }, { n: 'vegan', avoid: VEGAN, alg: [] }].concat(ALGS.map(a => ({ n: 'a_' + a, avoid: [], alg: [a] })));
const KANA = /[ぁ-んァ-ヶ]/, HAN = /[一-龯]/, HANGUL = /[가-힣]/, THAI = /[฀-๿]/, ARAB = /[؀-ۿ]/, DEVA = /[ऀ-ॿ]/, LATINW = /[A-Za-z]{3,}/;
const NONLAT = /[ぁ-んァ-ヶ一-龯가-힣฀-๿؀-ۿऀ-ॿ]/;
const scriptOk = (L, n) => {
    if (L === 'ja') return KANA.test(n) || HAN.test(n);
    if (L.startsWith('zh')) return HAN.test(n) && !KANA.test(n) && !HANGUL.test(n) && !LATINW.test(n);
    if (L === 'ko') return HANGUL.test(n) && !KANA.test(n) && !HAN.test(n) && !LATINW.test(n);
    if (L === 'th') return THAI.test(n) && !KANA.test(n) && !HAN.test(n) && !LATINW.test(n);
    if (L === 'hi') return DEVA.test(n) && !KANA.test(n) && !HAN.test(n) && !LATINW.test(n);
    if (L === 'ar') return ARAB.test(n) && !KANA.test(n) && !HAN.test(n) && !LATINW.test(n);
    return !NONLAT.test(n);
};
// 途中で切れた名前: 「:」で終わる・「or / and / または / hoặc」で終わる・1語だけの言葉（About・Ok・約 など）・閉じていないかっこ
const CUT = /[:：]\s*$|\s(?:or|and|o|ou|oder|und|e|y|atau|dan|lub|i|veya|ve|hoặc|và|o kaya|at)\s*$|^(?:about|approx\.?|ok\.?|ca\.?|około|約|およそ|khoảng|sekitar|circa|environ|aprox\.?|yaklaşık)$|[（(][^）)]*$/i;
if (want('C') || want('E')){
    const all = {}; let col = null;
    const runCc = async (cc) => {
        const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
        await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
        await ctx.addInitScript(seedScript(seedFor('safe46', 'c' + cc)));
        const st = { onboarded: true, algAsk: 0, firstUse: '2026-11-11', settings: { country: cc, uiLang: 'en', dishCount: 3, servings: 2, avoid: [], allergens: [] } };
        await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
        const p = await ctx.newPage(); p.on('pageerror', e => errs.push('c' + cc + ': ' + e.message));
        await p.goto(URL_); await boot(p);
        if (!col) col = await p.evaluate(() => Object.fromEntries(MAY_LOC_LANGS.map((l, k) => [l, MAY_LOC.map(x => x[1].split('|')[k])])));
        for (const L of LANGS){
            const r = await p.evaluate(async ([L, CONDS]) => {
                if (LANG !== L) await switchLang(L, ++uiLangSeq);
                const o = [];
                for (const c of CONDS){ S.settings.avoid = c.avoid; S.settings.allergens = c.alg;
                    RECIPES.forEach(r => { if (isAvoided(r) || allergyConflict(r)) return; dietMayHits(r).forEach(n => o.push([r.id, n, c.n])); algMayHits(r).forEach(y => y.names.forEach(n => o.push([r.id, n, c.n]))); }); }
                S.settings.avoid = []; S.settings.allergens = [];
                return { lang: LANG, o };
            }, [L, CONDS]);
            if (r.lang !== L) errs.push(`c${cc}: 言語が ${L} にならない（${r.lang}）`);
            (all[L] = all[L] || []).push(...r.o.map(x => [cc, ...x]));
        }
        await ctx.close();
    };
    const q = [...CCS]; await Promise.all([0, 1, 2].map(async () => { while (q.length) await runCc(q.shift()); }));
    const en = new Map(); all.en.forEach(([cc, id, n]) => { const k = cc + '|' + id; if (!en.has(k)) en.set(k, new Set()); en.get(k).add(n.toLowerCase()); });
    for (const L of LANGS){
        const xs = all[L], okSet = new Set(col[L] || []);
        if (want('C') && L !== 'en'){
            const bad = xs.filter(([cc, id, n]) => {
                if (okSet.has(n)) return false;
                if (!scriptOk(L, n)) return true;
                if (!NONLAT.test(n) && en.has(cc + '|' + id) && en.get(cc + '|' + id).has(n.toLowerCase())) return true;   // ラテン文字の言語: 英語の画面と同じ名前（英語のまま）
                return false;
            });
            const names = [...new Set(bad.map(x => x[2]))];
            if (process.env.DUMP) console.log('DUMP', L, JSON.stringify(names));
            ok(xs.length > 20 && !bad.length, `C1 ${L}: 🔍 の名前（アレルギーを1つずつ・食の決まり）が画面の言葉で出る（${xs.length}件・${new Set(xs.map(x => x[2])).size}種類）: ` + JSON.stringify([...new Set(bad.map(x => x[2] + ' (' + x[0] + ':' + x[3] + ')'))].slice(0, 40)) + (names.length > 40 ? ` ほか` : ''));
        }
        if (want('E')){
            const bad = [...new Set(xs.filter(x => CUT.test(x[2].trim())).map(x => x[2] + ' (' + x[0] + ':' + x[1] + ')'))];
            ok(xs.length > 20 && !bad.length, `E1 ${L}: 🔍 の名前が途中で切れない: ` + JSON.stringify(bad.slice(0, 30)));
        }
    }
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe46: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
