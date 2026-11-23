#!/usr/bin/env node
// 申請前（11/23・審査部の点検 scratchpad/final/review.md）の直しの確かめ
//  使い方: node tools/tests/prelaunch.mjs [http://localhost:9331/]
//  P1 ノッチ・Dynamic Island: 上の端の分（--safe-top。iPhone アプリ版では env(safe-area-inset-top)）を 59px にすると、日付・アプリの名前・国／モード／設定が
//     上の 59px より下に見えて押せる。下から出る画面（条件・料理の詳しい画面）の上の端・「閉じる」も 59px より下。設定のタブの列は、送っても 59px より下に貼りつく。
//     ふつう（0px）のときは、今までと同じ位置（ページの上の端が動かない）
//  P2 シートを開いているあいだは、後ろ（.wrap・下のタブ）に inert。閉じたら外れ、キーボードで開いたときは焦点が開いたボタンに戻る（2回押しの守りは r235・safe51 などで確かめる）
//  P3 下のタブの読み上げの名前は、見えている名前で始まる（幅 390・320・195。短い名前「作る」「工夫」が見えているときは、その名前）
//  P4 「余ったら」のボタンに、見えている字で始まる読み上げの名前がある
//  P5 設定 › その他の文言: 「テスト通知を送る」「アプリに入っているイラスト」を使わない。「このアプリについて」は「料理の絵は AI で作成したイメージです」（17言語に訳がある）
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const b = await chromium.launch(LAUNCH);
const open = async (w, h, st = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, serviceWorkers: 'block', isMobile: true, hasTouch: true});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        Object.assign({onboarded: true, firstUse: '2026-11-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, family: [{id: 'f1', name: '夫', role: 'adult', avoid: [], allergy: []}]}, st));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, {timeout: 30000});
    return {p, ctx};
};

// ---- P1 ノッチ ----
{
    const bad = [];
    for (const [w, h] of [[393, 852], [375, 812], [320, 568]]){
        const {p, ctx} = await open(w, h);
        const base = await p.evaluate(() => Math.round(document.querySelector('header.top').getBoundingClientRect().top));
        await p.evaluate(() => { document.documentElement.style.setProperty('--safe-top', '59px'); render(); }); await p.waitForTimeout(300);
        const r = await p.evaluate(() => { const vis = sel => { const e = document.querySelector(sel); if (!e) return {sel, none: true}; const q = e.getBoundingClientRect(), x = (q.left + q.right) / 2, y = (q.top + q.bottom) / 2, hit = document.elementFromPoint(x, y); return {sel, top: Math.round(q.top), hit: !!hit && (hit === e || e.contains(hit))}; };
            return ['header.top .date', 'header.top h1', '#flag-btn', '#mode-btn', 'header.top [data-act="settings"]'].map(vis); });
        r.forEach(x => { if (x.none || x.top < 59 || !x.hit) bad.push(`${w}: ${x.sel} が上の 59px にかかる・押せない ${JSON.stringify(x)}`); });
        // 下から出る画面（条件）・料理の詳しい画面
        await p.evaluate(() => document.querySelector('[data-act="cond-open"]').click()); await p.waitForTimeout(400);
        const sh = await p.evaluate(() => { const d = document.querySelector('#sheet-root [role="dialog"]'), c = document.querySelector('#sheet-root [data-act="sheet-close"]'); return {top: d ? Math.round(d.getBoundingClientRect().top) : -1, close: c ? Math.round(c.getBoundingClientRect().top) : -1}; });
        if (sh.top < 59 || sh.close < 59) bad.push(`${w}: 条件の画面が上の 59px にかかる ${JSON.stringify(sh)}`);
        await p.evaluate(() => closeSheet()); await p.waitForTimeout(200);
        await p.evaluate(() => openModal(document.querySelector('#view .spot .vessel[data-id]').dataset.id)); await p.waitForTimeout(500);
        const md = await p.evaluate(() => { const d = document.querySelector('#modal-root [role="dialog"]'), c = document.querySelector('#modal-root [data-act="close"]'); return {top: d ? Math.round(d.getBoundingClientRect().top) : -1, close: c ? Math.round(c.getBoundingClientRect().top) : -1}; });
        if (md.top < 59 || md.close < 59) bad.push(`${w}: 料理の詳しい画面が上の 59px にかかる ${JSON.stringify(md)}`);
        await p.evaluate(() => closeModal()); await p.waitForTimeout(200);
        // 設定のタブの列: 送っても 59px より下に貼りつく
        await p.evaluate(() => { setTab('settings'); setGo('family'); }); await p.waitForTimeout(300);
        await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(200);
        const bar = await p.evaluate(() => Math.round(document.querySelector('#view .set-tabs-bar').getBoundingClientRect().top));
        if (bar < 59) bad.push(`${w}: 設定のタブの列が上の 59px の下に入る（${bar}）`);
        // ふつう（0px）に戻すと、上の端は元の位置
        await p.evaluate(() => { document.documentElement.style.removeProperty('--safe-top'); setTab('today'); render(); window.scrollTo(0, 0); }); await p.waitForTimeout(200);
        const back = await p.evaluate(() => Math.round(document.querySelector('header.top').getBoundingClientRect().top));
        if (back !== base) bad.push(`${w}: ふつうのときの上の端の位置が変わった ${base} → ${back}`);
        await ctx.close();
    }
    ok(!bad.length, 'P1 上の端 59px（ノッチ）でも、日付・アプリの名前・国／モード／設定・下から出る画面の「閉じる」・設定のタブの列が見えて押せる。ふつうのときは位置が変わらない: ' + bad.slice(0, 5).join(' | '));
}

// ---- P2 inert ----
{
    const {p, ctx} = await open(390, 844);
    const st = () => p.evaluate(() => ({wrap: document.querySelector('body > .wrap').hasAttribute('inert'), nav: document.querySelector('body > nav.tabs').hasAttribute('inert'), dlg: !!document.querySelector('#sheet-root [role="dialog"], #modal-root [role="dialog"]')}));
    const s0 = await st();
    await p.focus('[data-act="cond-open"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    const s1 = await st();
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const s2 = await st(), f2 = await p.evaluate(() => document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.act : '');
    await p.evaluate(() => openModal(document.querySelector('#view .spot .vessel[data-id]').dataset.id)); await p.waitForTimeout(400);
    const s3 = await st();
    await p.evaluate(() => closeModal()); await p.waitForTimeout(200);
    const s4 = await st();
    ok(!s0.wrap && !s0.nav && s1.dlg && s1.wrap && s1.nav && !s2.dlg && !s2.wrap && !s2.nav && f2 === 'cond-open' && s3.wrap && s3.nav && !s4.wrap && !s4.nav,
        'P2 シート・料理の詳しい画面を開いているあいだは後ろに inert、閉じたら外れて焦点が開いたボタンに戻る: ' + JSON.stringify({s0, s1, s2, f2, s3, s4}));
    await ctx.close();
}

// ---- P3 下のタブの名前 ----
{
    const bad = [];
    for (const [w, h] of [[390, 844], [320, 568], [195, 422]]){
        const {p, ctx} = await open(w, h);
        const tabs = await p.evaluate(() => [...document.querySelectorAll('nav.tabs [data-tab]')].map(b => ({k: b.dataset.tab, vis: [...b.querySelectorAll('.tl, .tsn')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 2).map(e => e.textContent.trim()).join(' ')})));
        const snap = await p.locator('nav.tabs').ariaSnapshot();
        for (const t of tabs){ if (!t.vis) continue; const line = snap.split('\n').find(l => l.includes('tab') && l.includes(`"${t.vis}`)); if (!line) bad.push(`${w} ${t.k}: 見えている「${t.vis}」で始まる名前がない`); }
        await ctx.close();
    }
    ok(!bad.length, 'P3 下のタブの読み上げの名前は、見えている名前で始まる（390・320・195）: ' + bad.slice(0, 6).join(' | '));
}

// ---- P4 「余ったら」 ----
{
    const {p, ctx} = await open(390, 844);
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-act="rmk-open"]')].map(e => ({tx: e.textContent.trim(), al: e.getAttribute('aria-label') || ''})));
    ok(r.length > 0 && r.every(x => x.al && x.al.startsWith(x.tx) && x.al.length > x.tx.length), 'P4 「余ったら」のボタンに、見えている字で始まる読み上げの名前がある: ' + JSON.stringify(r));
    await ctx.close();
}

// ---- P5 文言 ----
{
    const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
    const langs = fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js'));
    const K = 'わが家のご飯帖 {v}。記録・写真・設定はこの端末の中だけに保存され、外部に送信しません。料理の絵は AI で作成したイメージです。', K2 = 'お知らせを試す';
    const miss = langs.filter(f => { const d = fs.readFileSync(ROOT + '/i18n/' + f, 'utf8'); return !d.includes(JSON.stringify(K)) || !d.includes(JSON.stringify(K2)); });
    ok(!/テスト通知を送る|アプリに入っているイラストです/.test(src) && src.includes(K) && src.includes(`t('${K2}')`) && langs.length === 17 && !miss.length, 'P5 「お知らせを試す」「料理の絵は AI で作成したイメージです」（17言語に訳あり）: ' + miss.join(','));
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\nprelaunch: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
