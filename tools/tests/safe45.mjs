#!/usr/bin/env node
// 第45回（安全）: 第43回モニター R206・R207・R209・R203（残り）の回帰テスト
//  使い方: node tools/tests/safe45.mjs [http://localhost:9291/]   （ONLY=A,B,C,D で一部だけ）
//  A（R206）遅い端末（CPU 1・1/4・1/6）で、家族のアレルギー（乳製品）のボタンを指で二度押し（0.2〜0.35 秒）しても、乳製品が外れない・卵などが入らない。
//     間をおいた押し直し（1.2・2.5 秒）は、わざとの押し直しとして外れる（卵などは入らない）。マウスで続けて押すと外れる（いままでどおり）
//  B（R207）🔍 の材料名に分量（小さじ2・1/2 tsp・ช้อนโต๊ะ など）が残らない（21か国 × 18言語）
//  C（R209）小麦・大豆・乳・卵・ごま・落花生のアレルギーの 🔍 の名前も、画面の言葉で出る（21か国 × 18言語）
//  D（R203 の残り）お知らせが、押したボタンのすぐ下・すぐ上のアレルギーのボタンに重ならない（320px・英語・文字いちばん大きい ほか）
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
    await ctx.addInitScript(seedScript(seedFor('safe45', tag)));
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
    return { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2, box: bx };
};
// 指で2回押す（gap ミリ秒あけて）。CDP で直に送る（Playwright の tap は前の tap の後片付けを待つ）
const taps = async (cdp, pt, gap) => {
    const one = async () => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
    const t0 = Date.now(); await one(); await sleep(Math.max(0, gap - (Date.now() - t0))); await one();
};
const famState = p => p.evaluate(s => ({ alg: S.family.find(m => m.id === 'fa1').allergy.slice(), pressed: document.querySelector(s).getAttribute('aria-pressed') }), SEL('dairy'));
if (want('A')){
    const reps = Number(process.env.REPS || 2);
    for (const [W, H, lang, cc, ts] of [[360, 740, 'ja', 'JP', 1], [320, 640, 'en', 'US', 2]]){
        for (const cpu of [1, 4, 6]){
            for (const gap of [200, 250, 300, 350]){
                let bad = [];
                for (let k = 0; k < reps; k++){
                    const { p, ctx } = await famCtx(W, H, lang, cc, ts, `a${W}${lang}${cpu}${gap}${k}`);
                    const pt = await place(p); const cdp = await ctx.newCDPSession(p);
                    await p.evaluate(() => { window.__clk = []; document.addEventListener('click', e => { const c = e.target.closest && e.target.closest('[data-act]'); window.__clk.push([c && c.dataset.v, e.detail]); }, true); });
                    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
                    await taps(cdp, pt, gap); await p.waitForTimeout(cpu > 1 ? 3000 : 1200);
                    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
                    const s = await famState(p), clk = await p.evaluate(() => window.__clk);
                    if (JSON.stringify(s.alg) !== '["@dairy"]' || s.pressed !== 'true') bad.push({ k, s, clk });
                    await ctx.close();
                }
                ok(!bad.length, `A1 ${W}px ${lang} CPU 1/${cpu} 二度押し ${gap}ms: 乳製品が入ったまま・ほかは入らない（${reps}回）: ` + JSON.stringify(bad));
            }
            for (const gap of [1200, 2500]){
                const { p, ctx } = await famCtx(W, H, lang, cc, ts, `r${W}${lang}${cpu}${gap}`);
                const pt = await place(p); const cdp = await ctx.newCDPSession(p);
                if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
                const one = async () => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
                await one(); const mid = []; await p.waitForTimeout(gap - 300); mid.push(await famState(p)); await p.waitForTimeout(300); await one(); await p.waitForTimeout(cpu > 1 ? 3000 : 1200);
                await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
                const s = await famState(p);
                // 1回目の結果が出て 0.3 秒より後の押し直しは、わざと（外れる）。結果がまだ出ていない（遅い端末）ときの2回目は、外さない（二度押しと同じ）
                const shown = mid[0].pressed === 'true';
                ok(shown ? (!s.alg.length && s.pressed === 'false') : JSON.stringify(s.alg) === '["@dairy"]', `A2 ${W}px ${lang} CPU 1/${cpu} 間をおいた押し直し ${gap}ms: ${shown ? '外れる' : '外れない'}（ほかは入らない）: ` + JSON.stringify({ mid, s }));
                await ctx.close();
            }
        }
    }
    // A3 マウス（キーボード・テストの click）で続けて押すと、いままでどおり外れる
    { const { p, ctx } = await famCtx(390, 844, 'ja', 'JP', 0, 'a3', false);
      await p.locator(SEL('dairy')).click(); await p.waitForTimeout(100); const s1 = await famState(p);
      await p.locator(SEL('dairy')).click(); await p.waitForTimeout(300); const s2 = await famState(p);
      ok(s1.alg.includes('@dairy') && !s2.alg.length, 'A3 マウスで押し直すと外れる: ' + JSON.stringify({ s1, s2 }));
      await ctx.close(); }
}

// ---- B（R207）・C（R209）: 21か国 × 18言語で、🔍 に出る材料名を集める ----
// 条件（第43回モニターの調べと同じ）: ベジタリアン・ヴィーガン・魚えびかに貝のアレルギー・肉ゼラチンのアレルギー・小麦大豆乳卵ごま落花生のアレルギー。
// 出す料理（isAvoided・allergyConflict に当たらない料理）の 🔍（dietMayHits・algMayHits）の名前。B はさらに全料理・全アレルゲンの「入っていることがある」名前も見る（分量）
const LANGS = ['en', 'ja', 'ar', 'de', 'es', 'fil', 'fr', 'hi', 'id', 'it', 'ko', 'pl', 'pt-BR', 'th', 'tr', 'vi', 'zh-Hans', 'zh-Hant'];
const CCS = (process.env.CCS || 'JP BR CN DE EG ES FR GB ID IN IT KR MX PE PH PL TH TR TW US VN').split(' ');
const VEGI = ['@pork', '@chicken', '@beef', '@fish', '@shellfish'], VEGAN = VEGI.concat(['@egg', '@dairy']);
const CONDS = [{ n: 'vegi', avoid: VEGI, alg: [] }, { n: 'vegan', avoid: VEGAN, alg: [] }, { n: 'algSea', avoid: [], alg: ['fish', 'crustacean', 'mollusc'] },
    { n: 'algMeat', avoid: [], alg: ['beef', 'pork', 'chicken', 'gelatin'] }, { n: 'algMix', avoid: [], alg: ['soy', 'wheat', 'milk', 'egg', 'sesame', 'peanut'] }];
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
const QTY = /\d|[½¼¾⅓⅔⅛]|小さじ|大さじ|少々|適量|\b(?:tsp|tbsp|teaspoons?|tablespoons?|cups?|ml|oz|to taste|to serve)\b|ช้อน|큰술|작은술|ملعقة|चम्मच/i;
if (want('B') || want('C')){
    const all = {}; let col = null;
    const runCc = async (cc) => {
        const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
        await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
        await ctx.addInitScript(seedScript(seedFor('safe45', 'b' + cc)));
        const st = { onboarded: true, algAsk: 0, firstUse: '2026-11-11', settings: { country: cc, uiLang: 'en', dishCount: 3, servings: 2, avoid: [], allergens: [] } };
        await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
        const p = await ctx.newPage(); p.on('pageerror', e => errs.push('b' + cc + ': ' + e.message));
        await p.goto(URL_); await boot(p);
        if (!col) col = await p.evaluate(() => Object.fromEntries(MAY_LOC_LANGS.map((l, k) => [l, MAY_LOC.map(x => x[1].split('|')[k])])));
        for (const L of LANGS){
            const r = await p.evaluate(async ([L, CONDS]) => {
                if (LANG !== L) await switchLang(L, ++uiLangSeq);
                const o = [];
                for (const c of CONDS){ S.settings.avoid = c.avoid; S.settings.allergens = c.alg;
                    RECIPES.forEach(r => { if (isAvoided(r) || allergyConflict(r)) return; dietMayHits(r).forEach(n => o.push([r.id, n, c.n])); algMayHits(r).forEach(y => y.names.forEach(n => o.push([r.id, n, c.n]))); }); }
                S.settings.avoid = []; S.settings.allergens = [];
                const q = []; RECIPES.forEach(r => { const m = algRecipeMap(r); Object.keys(m).forEach(id => m[id].filter(x => x.kind === 4).forEach(x => mayNameParts(id, x.name).forEach(n => q.push([r.id, n, 'all:' + id])))); });
                return { lang: LANG, o, q };
            }, [L, CONDS]);
            if (r.lang !== L) errs.push(`b${cc}: 言語が ${L} にならない（${r.lang}）`);
            (all[L] = all[L] || { o: [], q: [] }); all[L].o.push(...r.o.map(x => [cc, ...x])); all[L].q.push(...r.q.map(x => [cc, ...x]));
        }
        await ctx.close();
    };
    const q = [...CCS]; await Promise.all([0, 1, 2].map(async () => { while (q.length) await runCc(q.shift()); }));
    if (want('B')) for (const L of LANGS){
        const xs = all[L].o.concat(all[L].q), bad = [...new Set(xs.filter(x => QTY.test(x[2])).map(x => x[2] + ' (' + x[0] + ':' + x[1] + ')'))];
        ok(xs.length > 20 && !bad.length, `B1 ${L}: 🔍 の材料名に分量が残らない（${xs.length}件）: ` + JSON.stringify(bad.slice(0, 30)) + (bad.length > 30 ? ` ほか${bad.length - 30}` : ''));
    }
    if (want('C')){
        const en = new Map(); all.en.o.forEach(([cc, id, n]) => { const k = cc + '|' + id; if (!en.has(k)) en.set(k, new Set()); en.get(k).add(n.toLowerCase()); });
        for (const L of LANGS){
            const xs = all[L].o, okSet = new Set(col[L] || []);
            const bad = xs.filter(([cc, id, n]) => {
                if (okSet.has(n)) return false;
                if (!scriptOk(L, n)) return true;
                if (L !== 'en' && !NONLAT.test(n) && en.has(cc + '|' + id) && en.get(cc + '|' + id).has(n.toLowerCase())) return true;   // ラテン文字の言語: 英語の画面と同じ名前（英語のまま）
                return false;
            });
            const names = [...new Set(bad.map(x => x[2] + ' (' + x[0] + ':' + x[3] + ')'))];
            if (process.env.DUMP) console.log('DUMP', L, JSON.stringify([...new Set(bad.map(x => x[2]))]));
            ok(xs.length > 20 && !bad.length, `C1 ${L}: 🔍 の材料名（食の決まり・すべてのアレルギー）が画面の言葉で出る（${xs.length}件・${new Set(xs.map(x => x[2])).size}種類）: ` + JSON.stringify(names.slice(0, 40)) + (names.length > 40 ? ` ほか${names.length - 40}` : ''));
        }
    }
}

// ---- D（R203 の残り）: 献立に乳製品の主菜がある日に、家族の「乳製品」を押す → 「替えました」のお知らせが、押したチップのすぐ上・すぐ下（140px のうち）のアレルギーのチップに重ならない ----
if (want('D')){
    for (const [W, H, lang, cc, ts] of [[320, 640, 'en', 'GB', 2], [320, 640, 'ja', 'JP', 2], [360, 740, 'ja', 'JP', 1], [390, 844, 'ja', 'JP', 0], [390, 844, 'en', 'US', 0]]) for (const pos of [0.3, 0.45, 0.6]) for (const k of [0, 1, 2]){   // 替わる料理（お知らせの長さ）は乱数で変わるので、3通りのシードで
        const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
        await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
        await ctx.addInitScript(seedScript(seedFor('safe45', `d${W}${lang}${pos}${k}`)));
        const st = { onboarded: true, algAsk: 0, firstUse: '2026-11-11', foldOpen: {}, settings: { country: cc, uiLang: lang, dishCount: 3, servings: 2, textSize: ts },
            family: [{ id: 'fa0', name: 'A', role: 'adult', avoid: [], allergy: [], mild: false }, { id: 'fa1', name: 'B', role: 'adult', avoid: [], allergy: [], mild: false }] };
        await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
        const p = await ctx.newPage(); p.on('pageerror', e => errs.push('d: ' + e.message));
        await p.goto(URL_); await boot(p); await p.waitForTimeout(400);
        const dish = await p.evaluate(() => { const m = session.menu; if (!m) return null; const i = m.items.findIndex(x => x.slot === '主菜'); const d = RECIPES.find(r => r.main && !isAvoided(r) && algSelectedHits(r, ['milk']).length && !algSelectedHits(r, ['egg']).length); if (i < 0 || !d) return null; m.items[i].r = d; return d.id; });
        await p.evaluate(() => { try{ applyTextSize(); }catch(e){} session.famOpen = 'fa1'; setGo('family-profile'); }); await p.waitForTimeout(900);
        await p.locator(SEL('dairy')).scrollIntoViewIfNeeded();
        await p.evaluate(([s, pos]) => { const r = document.querySelector(s).getBoundingClientRect(); scrollBy(0, r.top - innerHeight * pos); }, [SEL('dairy'), pos]); await p.waitForTimeout(400);
        const bx = await p.locator(SEL('dairy')).boundingBox();
        await p.touchscreen.tap(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.waitForTimeout(1200);
        const r = await p.evaluate(() => { const tb = document.querySelector('#toast-root .toast'); if (!tb) return null; const T = tb.getBoundingClientRect(), d = document.querySelector('#view details.fam-member[data-fm="fa1"] [data-act="fam-alg-fam"][data-v="dairy"]').getBoundingClientRect(), dy = (d.top + d.bottom) / 2;
            const near = [...document.querySelectorAll('#view details.fam-member[data-fm="fa1"] [data-act^="fam-alg"]')].map(e => [e, e.getBoundingClientRect()]).filter(([e, q]) => Math.abs((q.top + q.bottom) / 2 - dy) < 140 && q.bottom > 0 && q.top < innerHeight);
            return { T: [Math.round(T.top), Math.round(T.bottom)], d: [Math.round(d.top), Math.round(d.bottom)], cover: near.filter(([e, q]) => q.left < T.right - 1 && q.right > T.left + 1 && q.top < T.bottom - 1 && q.bottom > T.top + 1).map(([e]) => e.dataset.v) }; });
        ok(dish && r && !r.cover.length, `D1 ${W}px ${lang} 文字${ts} 位置${pos} (${k}): お知らせが、押したチップのすぐ上・すぐ下のチップに重ならない: ` + JSON.stringify({ dish, r }));
        await ctx.close();
    }
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe45: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
