#!/usr/bin/env node
// policy-r1（11/23 オーナー指示「プライバシーポリシー・サポートがアプリの中で見られない／中身が足りない」）
//  使い方: node tools/tests/policy-r1.mjs [http://localhost:8765/]
//  P1 設定のどのタブにも「プライバシーポリシー」「サポート・よくある質問」の入口が見える（「その他」のタブはヘルプの中に。同じタブに2つずつ出さない）
//  P2 入口を押すと、アプリの中の画面（#doc-view）で同梱のページが開く（外のサイト・別の窓に出ない）。後ろは inert。「閉じる」・Esc で閉じ、焦点が入口に戻る
//  P3 言葉: 日本語の画面は privacy.html / support.html、英語の画面は -en。ページの中の「English」「日本語」で切りかえられる
//  P4 電波がなくても開く（Service Worker が保存した同梱のページ）
//  P5 サポートのページ: 見えている質問・読み上げの質問に同じものが2つない（「料金はかかりますか？」の重なり）。HTML の中身（コメント・template を除く）でも重ならない
//  P6 プライバシーポリシーに、審査で求められる項目（集める／集めない情報・保存場所・第三者・広告と解析・子ども・保存期間と消し方・問い合わせ先・改定日）が日本語・英語ともにある
//  P7 アプリの中の画面に青を使わない
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = (process.argv[2] || process.env.BASE || BASE_).replace(/\/?$/, '/');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const KEY = 'gohancho.v1';
const state = lang => ({onboarded: true, firstUse: '2026-11-20', settings: {country: lang === 'ja' ? 'JP' : 'US', uiLang: lang, dishCount: 3, servings: 2}});
const b = await chromium.launch(LAUNCH);
const open = async ({lang = 'ja', sw = 'block', w = 390, h = 844} = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, locale: lang === 'ja' ? 'ja-JP' : 'en-US', timezoneId: 'Asia/Tokyo', serviceWorkers: sw});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(SEED));
    await ctx.addInitScript(([s, KEY]) => { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(s)); }, [state(lang), KEY]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    return {p, ctx};
};
const goSettings = p => p.evaluate(() => { setTab('settings'); });
const frameText = async (p, want) => {
    try{ await p.waitForFunction(re => { const f = document.querySelector('#doc-view iframe'); const d = f && f.contentDocument; return !!(d && d.readyState === 'complete' && new RegExp(re).test(d.body ? d.body.innerText : '')); }, want.source, {timeout: 15000}); }catch(e){}
    return p.evaluate(() => { const f = document.querySelector('#doc-view iframe'); const d = f && f.contentDocument; return {src: f ? f.getAttribute('src') : null, url: d ? d.location.pathname : '', h1: d && d.querySelector('h1') ? d.querySelector('h1').textContent : '', txt: d && d.body ? d.body.innerText : ''}; });
};

// P1・P2・P3（日本語）
{
    const {p, ctx} = await open();
    await goSettings(p);
    const tabs = await p.$$eval('#view .set-tab', xs => xs.map(x => x.dataset.k));
    const miss = [];
    for (const k of tabs){
        await p.click(`#view .set-tab[data-k="${k}"]`); await p.waitForTimeout(150);
        const r = await p.evaluate(() => { const v = [...document.querySelectorAll('#view .set-panel')].find(x => !x.hidden); const vis = e => !!e.getClientRects().length;
            const a = [...v.querySelectorAll('a[data-doc]')].filter(vis); return {privacy: a.filter(x => x.dataset.doc === 'privacy').length, support: a.filter(x => x.dataset.doc === 'support').length}; });
        if (r.privacy !== 1 || r.support !== 1) miss.push(`${k}: privacy ${r.privacy}・support ${r.support}`);
    }
    ok(tabs.length >= 5 && !miss.length, `P1 設定の ${tabs.length} タブすべてに、プライバシーポリシー・サポートの入口が1つずつ見える: ` + miss.join(' / '));

    await p.click('#view .set-tab[data-k="mode"]'); await p.waitForTimeout(150);
    const link = p.locator('#view .set-panel:not([hidden]) a[data-doc="privacy"]');
    await link.focus(); await p.keyboard.press('Enter');
    await p.waitForSelector('#doc-view', {timeout: 5000}).catch(() => {});
    const pages = ctx.pages().length;
    const f = await frameText(p, /集めない情報/);
    const st = await p.evaluate(() => ({dlg: document.querySelector('#doc-view') && document.querySelector('#doc-view').getAttribute('role'), modal: document.querySelector('#doc-view') && document.querySelector('#doc-view').getAttribute('aria-modal'),
        inert: [...document.querySelectorAll('body > .wrap, body > nav.tabs')].every(e => e.hasAttribute('inert')), focus: document.activeElement && document.activeElement.textContent.trim(), top: document.querySelector('#doc-view').getBoundingClientRect().top}));
    ok(f.src === 'privacy.html' && /プライバシーポリシー/.test(f.h1) && pages === 1 && st.dlg === 'dialog' && st.modal === 'true' && st.inert && st.focus === '閉じる',
        `P2a 入口を押すと、アプリの中の画面で同梱の privacy.html が開く（別の窓なし・後ろは inert・焦点は「閉じる」）: ${JSON.stringify({src: f.src, h1: f.h1, pages, ...st})}`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    const back = await p.evaluate(() => ({gone: !document.querySelector('#doc-view'), inert: [...document.querySelectorAll('body > .wrap, body > nav.tabs')].some(e => e.hasAttribute('inert')), focus: document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.doc : null}));
    ok(back.gone && !back.inert && back.focus === 'privacy', 'P2b Esc で閉じ、後ろの inert が外れ、焦点が入口に戻る: ' + JSON.stringify(back));

    await p.click('#view .set-panel:not([hidden]) a[data-doc="support"]');
    const s = await frameText(p, /よくある質問/);
    ok(s.src === 'support.html' && /サポート/.test(s.h1), 'P2c サポートの入口で support.html が開く: ' + JSON.stringify({src: s.src, h1: s.h1}));
    // ページの中の「English」で英語に切りかわる
    await p.frameLocator('#doc-view iframe').locator('a[href="support-en.html"]').click();
    const se = await frameText(p, /Frequently asked questions/);
    ok(/support-en\.html$/.test(se.url) && /Support|Gohancho/.test(se.h1), 'P3a ページの中の「English」で英語のページに切りかわる: ' + se.url);
    await p.click('#doc-view [data-dv="close"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => !document.querySelector('#doc-view')), 'P2d 「閉じる」で閉じる');
    // その他のタブ（ヘルプ）の入口も同じ画面で開く
    await p.click('#view .set-tab[data-k="plan"]'); await p.waitForTimeout(150);
    await p.click('#view .set-panel:not([hidden]) #set-help a[data-doc="privacy"], #view .set-panel:not([hidden]) a[data-doc="privacy"]');
    const hp = await frameText(p, /集めない情報/);
    ok(hp.src === 'privacy.html', 'P2e 「その他」のタブのヘルプの入口も、アプリの中で開く: ' + hp.src);
    // P7 青を使わない（帯・ボタン・地の色）
    const blue = await p.evaluate(() => {
        const hue = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a] = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); if (a === 0) return null;
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 30) return null; let h; if (mx === r) h = ((g - b) / (mx - mn)) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4; h *= 60; return h < 0 ? h + 360 : h; };
        const out = []; document.querySelectorAll('#doc-view, #doc-view *').forEach(e => { const s = getComputedStyle(e); [s.color, s.backgroundColor, s.borderTopColor].forEach(c => { const h = hue(c); if (h != null && h >= 190 && h <= 260) out.push(e.className + ' ' + c); }); });
        return out; });
    ok(!blue.length, 'P7 アプリの中の画面に青を使わない: ' + blue.slice(0, 4).join(' / '));
    await ctx.close();
}

// P3（英語の画面）
{
    const {p, ctx} = await open({lang: 'en'});
    await goSettings(p);
    await p.click('#view .set-panel:not([hidden]) a[data-doc="privacy"]');
    const f = await frameText(p, /Information the developer does not collect/);
    ok(f.src === 'privacy-en.html' && /Privacy Policy/.test(f.h1), 'P3b 英語の画面では privacy-en.html が開く: ' + JSON.stringify({src: f.src, h1: f.h1}));
    await p.frameLocator('#doc-view iframe').locator('a[href="privacy.html"]').click();
    const j = await frameText(p, /集めない情報/);
    ok(/privacy\.html$/.test(j.url) && /プライバシーポリシー/.test(j.h1), 'P3c ページの中の「日本語」で日本語のページに切りかわる: ' + j.url);
    const t = await p.evaluate(() => document.querySelector('#doc-view [data-dv="close"]').textContent.trim());
    ok(t === 'Close', 'P3d 閉じるボタンもアプリの言葉: ' + t);
    await ctx.close();
}

// P4 電波がないとき（Service Worker が保存した同梱のページ）
{
    const {p, ctx} = await open({sw: 'allow'});
    const ctl = await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, {timeout: 20000}).then(() => true, async () => { await p.reload(); await ready(p); return p.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller)); });
    await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; await new Promise(res => { if (r.active && r.active.state === 'activated') res(); else r.active.addEventListener('statechange', () => res()); }); });
    await ctx.setOffline(true);
    await goSettings(p);
    const got = {};
    for (const [doc, re] of [['privacy', /集めない情報/], ['support', /よくある質問/]]){
        await p.click(`#view .set-panel:not([hidden]) a[data-doc="${doc}"]`);
        const f = await frameText(p, re); got[doc] = re.test(f.txt);
        await p.click('#doc-view [data-dv="close"]'); await p.waitForTimeout(100);
    }
    await ctx.setOffline(false);
    ok(ctl && got.privacy && got.support, 'P4 電波がなくても、プライバシーポリシー・サポートがアプリの中で開く: ' + JSON.stringify({ctl, ...got}));
    await ctx.close();
}

// P5 サポートのページの質問が重ならない
{
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
    const p = await ctx.newPage();
    const bad = [];
    for (const f of ['support.html', 'support-en.html']){
        await p.goto(URL_ + f);
        const r = await p.evaluate(() => [...document.querySelectorAll('summary')].filter(s => s.getClientRects().length).map(s => s.textContent.trim()));
        const ax = (await p.locator('body').ariaSnapshot()).split('\n').filter(l => /- group:/.test(l)).map(l => l.replace(/.*- group:\s*/, '').trim());
        const src = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<template[\s\S]*?<\/template>/g, '');
        const raw = [...src.matchAll(/<summary>([^<]*)<\/summary>/g)].map(m => m[1].trim());
        for (const [name, list] of [['見えている', r], ['読み上げ', ax], ['HTML', raw]]){
            const d = list.filter((x, i) => list.indexOf(x) !== i); if (d.length) bad.push(`${f} ${name}: ${[...new Set(d)].join('・')}`);
        }
        if (r.length < 6) bad.push(`${f} 質問が少ない ${r.length}`);
    }
    ok(!bad.length, 'P5 サポートのページに同じ質問が2つない（見えている・読み上げ・HTML）: ' + bad.join(' / '));
    await ctx.close();
}

// P6 プライバシーポリシーの項目
{
    const need = {
        'privacy.html': [/集めない情報/, /端末の中/, /第三者/, /RevenueCat/, /広告/, /解析/, /子ども/, /保存する期間/, /すべてのデータを消す/, /お問い合わせ/, /最終更新/, /改定/, /privacy-en\.html/, /support\.html/],
        'privacy-en.html': [/does not collect/, /only on your device/, /third parties/, /RevenueCat/, /ads/, /analytics/, /Children/, /How long data is kept/, /Erase all data/, /Contact/, /Last updated/, /Changes/, /privacy\.html/, /support-en\.html/],
    };
    const miss = [];
    for (const [f, res] of Object.entries(need)){ const s = fs.readFileSync(path.join(ROOT, f), 'utf8'); res.forEach(re => { if (!re.test(s)) miss.push(`${f} ${re}`); }); }
    ok(!miss.length, 'P6 プライバシーポリシーに審査で求められる項目がそろう（日本語・英語）: ' + miss.join(' / '));
}

await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`policy-r1: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
