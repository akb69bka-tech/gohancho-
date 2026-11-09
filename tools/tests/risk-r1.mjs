#!/usr/bin/env node
// 公開後の不具合の芽（品質保証 第1回）の回帰テスト（Playwright。使い方: node tools/tests/risk-r1.mjs [http://localhost:8815/]）
//  R1 暗い表示: ブラウザの上の帯・ホーム画面のアプリの帯の色（theme-color）が、暗い表示では暗い色（明るい生成りの帯にならない）
//  R2 入力欄の文字が 16px 以上（iPhone の Safari は 16px 未満の欄を押すと画面を拡大して戻らない）。今日・各タブ・設定（全部開く）
//  R3 記録を消されにくくする: 記録があるブラウザ版では navigator.storage.persist() を1回頼む。記録がない・Firefox・iPhone アプリ版では頼まない。
//     persist が無い・失敗しても起動は止まらない
//  R4 プライバシー（日本語・英語）: 声で入力の説明に、ブラウザで使うときの音声認識（Google など）が書いてある
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const ST = (o = {}) => JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-09-01', settings: {country: 'JP', uiLang: 'ja'}, history: [{id: 'nikujaga', d: '2026-11-01'}], favs: ['nikujaga']}, o));
async function open({state = ST(), dark = false, init = null, ua} = {}){
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light', ...(ua ? {userAgent: ua} : {})});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat|jsdelivr/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.ctx = ctx;
    if (init) await p.addInitScript(init);
    await p.addInitScript(x => { try{ if (!sessionStorage.getItem('seeded')){ sessionStorage.setItem('seeded', '1'); localStorage.setItem('gohancho.v1', x); } }catch(e){} }, state);
    await p.goto(URL_); await p.waitForFunction(() => window.GH && GH.booted, null, {timeout: 20000}).catch(() => {});
    await p.waitForTimeout(300);
    return p;
}

// R1
for (const dark of [false, true]){
    const p = await open({dark});
    const c = await p.evaluate(() => { const m = [...document.querySelectorAll('meta[name="theme-color"]')].find(x => !x.media || matchMedia(x.media).matches); return {meta: m && m.content.toLowerCase(), bg: getComputedStyle(document.body).backgroundColor}; });
    const rgb = h => 'rgb(' + [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')';
    ok(c.meta && rgb(c.meta) === c.bg, `R1 ${dark ? '暗い' : '明るい'}表示: 帯の色 ${c.meta} が画面の地の色 ${c.bg} と同じ`);
    await p.ctx.close();
}

// R2
{
    const p = await open();
    const small = new Set();
    const measure = async where => {
        const r = await p.evaluate(() => [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=hidden]):not([type=color]), textarea, select')]
            .filter(e => e.getClientRects().length && !e.readOnly && !e.disabled).map(e => ({id: e.id || e.className || e.tagName, fs: parseFloat(getComputedStyle(e).fontSize)})).filter(x => x.fs < 16));
        r.forEach(x => small.add(`${where}: ${x.id} ${x.fs}px`));
    };
    const openAll = async () => { for (let k = 0; k < 3; k++){ const ss = await p.$$('details:not([open]) > summary'); if (!ss.length) break; for (const s of ss) await s.click().catch(() => {}); await p.waitForTimeout(150); } };
    await measure('今日');
    const n = (await p.$$('nav button')).length;
    for (let i = 0; i < n; i++){ const t = (await p.$$('nav button'))[i]; if (!t) break; await t.click().catch(() => {}); await p.waitForTimeout(400); await openAll(); await measure('タブ' + i); }
    await p.click('[data-act="settings"]').catch(() => {}); await p.waitForTimeout(400); await openAll(); await measure('設定');
    ok(n >= 4, `R2 下のタブが出ている（${n}）`);
    ok(small.size === 0, 'R2 入力欄の文字が16px以上: ' + [...small].join(' / '));
    await p.ctx.close();
}

// R3
{
    const spy = ua => `(() => { window.__persist = 0; const st = navigator.storage || {}; try{ Object.defineProperty(navigator, 'storage', {configurable: true, value: Object.assign(Object.create(Object.getPrototypeOf(st) || {}), {persisted: () => Promise.resolve(false), persist: () => { window.__persist++; return Promise.resolve(true); }, estimate: st.estimate ? st.estimate.bind(st) : undefined})}); }catch(e){} })();`;
    let p = await open({init: spy()});
    ok(await p.evaluate(() => window.__persist) === 1, 'R3 記録があるブラウザ版: persist を1回頼む');
    ok(await p.evaluate(() => GH.persisted === true), 'R3 頼んだ結果を覚える');
    await p.ctx.close();
    p = await open({init: spy(), state: JSON.stringify({onboarded: true, firstUse: '2026-11-01', settings: {country: 'JP', uiLang: 'ja'}})});
    ok(await p.evaluate(() => window.__persist) === 0, 'R3 まだ何も残していない人には頼まない');
    await p.ctx.close();
    p = await open({init: spy(), ua: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0'});
    ok(await p.evaluate(() => window.__persist) === 0, 'R3 Firefox には頼まない（確認の画面が出るため）');
    await p.ctx.close();
    p = await open({init: spy() + `window.Capacitor = {isNativePlatform: () => true, Plugins: {}, getPlatform: () => 'ios'};`});
    ok(await p.evaluate(() => window.__persist) === 0, 'R3 iPhone アプリ版では頼まない');
    await p.ctx.close();
    p = await open({init: `try{ Object.defineProperty(navigator, 'storage', {configurable: true, value: {persisted: () => Promise.reject(new Error('x')), persist: () => { throw new Error('y'); }}}); }catch(e){}`});
    ok(await p.evaluate(() => GH.booted && document.querySelectorAll('main .vessel').length >= 2), 'R3 persist が失敗しても献立が出る');
    await p.ctx.close();
}

// R4
{
    const ja = fs.readFileSync(path.join(ROOT, 'gohancho/privacy.html'), 'utf8'), en = fs.readFileSync(path.join(ROOT, 'gohancho/privacy-en.html'), 'utf8');
    ok(/ブラウザの音声認識[^<]*Google/.test(ja), 'R4 プライバシー（日本語）: ブラウザで使う声の入力は Google などで処理されることがある');
    ok(/browser's speech recognition[^<]*Google/.test(en), 'R4 プライバシー（英語）: 同じ');
}

ok(errs.length === 0, 'ページの例外なし: ' + errs.slice(0, 3).join(' | '));
await b.close();
console.log(fails ? `FAIL ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
