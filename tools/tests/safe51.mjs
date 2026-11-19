#!/usr/bin/env node
// 第51回（安全）R224・R223 の回帰テスト（使い方: node tools/tests/safe51.mjs [http://localhost:9291/]   ONLY=A,B,C で一部だけ）
//  A（R224）別のボタンを、同じ所（24px 以内）で 0.15〜0.3 秒のうちに続けて押しても、2つ目は二度押しとして止めない（押したとおりに入る）。
//     家族のアレルギー（「子ども」→ アレルゲン）・設定のアレルギー対策・苦手（食の決まりのなかま）。指（タッチ）で、CPU 1 と 1/4
//  B（R206 を壊さない）同じボタンを指で 0.2〜0.3 秒のうちに二度押ししても、入れたアレルギーは外れない。止めたボタンは短く光る（tap-held）
//  C（R223）英語・韓国語で はじめて開き、はじめての流れが済んだら すぐ（15秒を待たず）画面の言葉の辞書が保存され、5秒後に電波なしで開き直しても その言葉の画面
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, pickCountry } = require('../lib/pw.cjs');
const URL_ = (u => u.endsWith('/') ? u : u + '/')(process.argv[2] || process.env.BASE || BASE_);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const boot = p => p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 60000 });

const ctxFor = async (tag, cc = 'ES', lang = 'ja', fam = [{ id: 'fa1', name: '娘', role: 'adult', avoid: [], allergy: [], mild: false }]) => {
    const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('safe51', tag)));
    const st = { onboarded: true, algAsk: 0, firstUse: '2026-11-11', foldOpen: {}, settings: { country: cc, uiLang: lang, dishCount: 3, servings: 2 }, family: fam };
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await boot(p); await p.waitForTimeout(300);
    return { p, ctx, cdp: await ctx.newCDPSession(p) };
};
const touchAt = async (cdp, x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
// A のボタン（selA）を左端から 12px の所で押し、すぐ画面を送って、B（selA と左端がそろう別のボタン。candB の中から）を同じ所に持ってきて押す
async function twoButtons(p, cdp, selA, candB, gap){
    await p.locator(selA).first().scrollIntoViewIfNeeded();
    await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); scrollBy(0, r.top - innerHeight * 0.4); }, selA); await p.waitForTimeout(300);
    const a = await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + 12, y: r.top + r.height / 2 }; }, selA);
    await p.evaluate(() => { window.__clk = []; document.addEventListener('click', e => { const c = e.target.closest && e.target.closest('[data-act]'); window.__clk.push(c ? c.dataset.act + ':' + (c.dataset.v || '') : '-'); }, true); });
    const t0 = Date.now(); await touchAt(cdp, a.x, a.y);
    await sleep(40);
    // 送る量: B の中心を、A を押した高さへ（人が画面を送った形。第55回 r233 からアプリは自分の window.scrollBy・scrollIntoView を「アプリが動かした」に数えるので、ここはそれを通らない scrollTop で送る）
    const target = await p.evaluate(([cand, ax, ay]) => { const els = [...document.querySelectorAll(cand)].filter(e => e.offsetParent && Math.abs(e.getBoundingClientRect().left + 12 - ax) < 6 && e.getAttribute('aria-pressed') !== 'true');
        const e = els[0]; if (!e) return null; const r = e.getBoundingClientRect(); document.scrollingElement.scrollTop += (r.top + r.height / 2) - ay; const r2 = e.getBoundingClientRect();
        return { act: e.dataset.act, v: e.dataset.v, fm: (e.closest('[data-fm]') || {}).dataset ? e.closest('[data-fm]') && e.closest('[data-fm]').dataset.fm : null, dy: Math.round(r2.top + r2.height / 2 - ay), dx: Math.round(r2.left + 12 - ax) }; }, [candB, a.x, a.y]);
    await sleep(Math.max(0, gap - (Date.now() - t0)));
    await touchAt(cdp, a.x, a.y); await sleep(400);
    return { target, clk: await p.evaluate(() => window.__clk).catch(() => null) };
}
const pressedOf = (p, act, v) => p.evaluate(([act, v]) => { const e = [...document.querySelectorAll(`[data-act="${act}"]`)].find(x => x.dataset.v === v); return e ? e.getAttribute('aria-pressed') : null; }, [act, v]);

if (want('A')){
    for (const cpu of [1, 4]) for (const gap of [150, 250, 300]){
        // A1 家族: 「子ども」→ 同じ所に来たアレルゲンのボタン（食の決まりのなかま・アレルゲン）
        { const { p, ctx, cdp } = await ctxFor(`a1${cpu}${gap}`);
          await p.evaluate(() => { session.famOpen = 'fa1'; setGo('family-profile'); }); await p.waitForTimeout(800);
          if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
          const r = await twoButtons(p, cdp, '#view details.fam-member[data-fm="fa1"] [data-act="fam-role"][data-v="child"]', '#view details.fam-member[data-fm="fa1"] [data-act="fam-alg-fam"], #view details.fam-member[data-fm="fa1"] [data-act="fam-alg"], #view details.fam-member[data-fm="fa1"] [data-act="fam-alg-w"]', gap);
          await p.waitForTimeout(cpu > 1 ? 3000 : 1200); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
          const st = await p.evaluate(() => { const m = S.family.find(x => x.id === 'fa1'); return { role: m.role, allergy: m.allergy.slice() }; });
          // 2つ目の押しが当たったボタン（1つ目のあとに描き直されて、送った先とずれることがある）が、押したとおりに入っていること
          const t = r.target, hit = r.clk && r.clk[1] ? r.clk[1].split(':') : null, on = hit && await pressedOf(p, hit[0], hit.slice(1).join(':'));
          ok(r.clk && r.clk.length === 2 && r.clk[0] === 'fam-role:child' && r.clk[1] !== r.clk[0] && st.role === 'child' && on === 'true',
            `A1 家族 CPU 1/${cpu} ${gap}ms: 「子ども」のすぐあとに同じ所の別のボタン（${hit && hit.join(':')}）を押すと、両方入る: ` + JSON.stringify({ t, st, on, clk: r.clk }));
          await ctx.close(); }
        // A2 設定のアレルギー対策（みんなのアレルゲン）: 1つ押して、すぐ同じ所に来た別のアレルゲン
        { const { p, ctx, cdp } = await ctxFor(`a2${cpu}${gap}`, 'JP', 'ja', []);
          await p.evaluate(() => setGo('allergy-card')); await p.waitForTimeout(800);
          const first = await p.evaluate(() => { const els = [...document.querySelectorAll('#view [data-act="alg-toggle"]')].filter(e => e.offsetParent); return els.length ? els[0].dataset.v : null; });
          if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
          const r = await twoButtons(p, cdp, `#view [data-act="alg-toggle"][data-v="${first}"]`, `#view [data-act="alg-toggle"]:not([data-v="${first}"])`, gap);
          await p.waitForTimeout(cpu > 1 ? 3000 : 1200); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
          const st = await p.evaluate(() => algIds()), t = r.target, hit = r.clk && r.clk[1] ? r.clk[1].split(':')[1] : null;
          ok(r.clk && r.clk.length === 2 && r.clk[1] !== r.clk[0] && st.includes(first) && st.includes(hit), `A2 設定のアレルギー対策 CPU 1/${cpu} ${gap}ms: 同じ所に続けて押した別のアレルゲン（${first}・${t && t.v}）が両方入る: ` + JSON.stringify({ t, st, clk: r.clk }));
          await ctx.close(); }
        // A3 苦手（食の決まりのなかま）: 設定の苦手の欄
        { const { p, ctx, cdp } = await ctxFor(`a3${cpu}${gap}`, 'JP', 'ja', []);
          await p.evaluate(() => setGo('food')); await p.waitForTimeout(800);
          const sel = '#view [data-act="toggle-avoid-fam"]';
          const first = await p.evaluate(sel => { const els = [...document.querySelectorAll(sel)].filter(e => e.offsetParent); return els.length ? els[0].dataset.v : null; }, sel);
          if (first){
            if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
            const r = await twoButtons(p, cdp, `${sel}[data-v="${first}"]`, `${sel}:not([data-v="${first}"])`, gap);
            await p.waitForTimeout(cpu > 1 ? 3000 : 1200); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
            const st = await p.evaluate(() => (S.settings.avoid || []).slice()), t = r.target, hit = r.clk && r.clk[1] ? r.clk[1].split(':')[1] : null;
            ok(r.clk && r.clk.length === 2 && r.clk[1] !== r.clk[0] && st.includes('@' + first) && st.includes('@' + hit), `A3 苦手のなかま CPU 1/${cpu} ${gap}ms: 同じ所に続けて押した別のなかま（${first}・${t && t.v}）が両方入る: ` + JSON.stringify({ t, st, clk: r.clk }));
          } else ok(false, 'A3 苦手のなかまのボタンが見つからない');
          await ctx.close(); }
    }
}
if (want('B')){
    for (const cpu of [1, 4]) for (const gap of [200, 300]){
        const { p, ctx, cdp } = await ctxFor(`b${cpu}${gap}`, 'JP');
        await p.evaluate(() => { session.famOpen = 'fa1'; setGo('family-profile'); }); await p.waitForTimeout(800);
        const sel = '#view details.fam-member[data-fm="fa1"] [data-act="fam-alg-fam"][data-v="dairy"]';
        await p.locator(sel).scrollIntoViewIfNeeded(); await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); scrollBy(0, r.top - innerHeight * 0.45); }, sel); await p.waitForTimeout(300);
        const bx = await p.locator(sel).boundingBox(), x = bx.x + bx.width / 2, y = bx.y + bx.height / 2;
        await p.evaluate(() => { window.__held = 0; new MutationObserver(ms => ms.forEach(m => { if (m.target.classList && m.target.classList.contains('tap-held')) window.__held++; })).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true }); });
        if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
        const t0 = Date.now(); await touchAt(cdp, x, y); await sleep(Math.max(0, gap - (Date.now() - t0))); await touchAt(cdp, x, y);
        await p.waitForTimeout(cpu > 1 ? 3000 : 1200); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
        const st = await p.evaluate(() => ({ alg: S.family.find(m => m.id === 'fa1').allergy.slice(), held: window.__held }));
        ok(JSON.stringify(st.alg) === '["@dairy"]' && st.held > 0, `B 同じボタンの二度押し CPU 1/${cpu} ${gap}ms: 乳製品は外れず、止めたボタンが光る: ` + JSON.stringify(st));
        await ctx.close();
    }
}
if (want('C')){
    for (const [locale, cc, lang, re] of [['en-US', 'US', 'en', /Today/], ['ko-KR', 'KR', 'ko', /[가-힣]/]]){
        const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale, serviceWorkers: 'allow' });
        await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
        const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lang + ': ' + e.message));
        await p.goto(URL_);
        await p.waitForFunction(() => typeof sheet !== 'undefined' && sheet && sheet.kind === 'country' && !!document.querySelector('#sheet-root [data-act="cc-choose"]'), null, { timeout: 60000 });
        await pickCountry(p, cc);
        await p.waitForFunction(() => sheet && sheet.kind === 'onboard' && document.querySelector('#sheet-root [data-act=ob-done]'), null, { timeout: 30000 });
        await p.click('#sheet-root [data-act=ob-done]');
        await p.waitForFunction(() => S.onboarded === true && !sheet && document.querySelector('#view .tray .spot .nm'), null, { timeout: 30000 });
        const t0 = Date.now();
        // はじめての流れが済んでから 5 秒のうちに、使っている辞書が保存される
        let saved = false; for (let i = 0; i < 25 && !saved; i++){ await p.waitForTimeout(200); saved = await p.evaluate(async lang => !!(await caches.match(`i18n/${lang}.js?v=` + window.ASSET_V)), lang); }
        const tSaved = Date.now() - t0;
        await p.waitForTimeout(Math.max(0, 5000 - (Date.now() - t0)));
        await ctx.setOffline(true); await p.reload();
        await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, { timeout: 30000 }).catch(() => {});
        await p.waitForTimeout(1200);
        const st = await p.evaluate(() => ({ lang: LANG, tab: ((document.querySelector('nav.tabs') || {}).innerText || '').replace(/\s+/g, ' ') }));
        ok(saved && st.lang === lang && re.test(st.tab), `C ${lang}: はじめての流れから ${(tSaved / 1000).toFixed(1)} 秒で辞書が保存され、5 秒後に電波なしで開き直しても ${lang} の画面: ` + JSON.stringify({ saved, st }));
        await ctx.close();
    }
}
await b.close();
if (errs.length){ console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe51: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
