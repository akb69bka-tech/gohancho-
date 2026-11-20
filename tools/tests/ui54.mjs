#!/usr/bin/env node
// ui54（第49回 R217）: 幅 260px 未満のはじめの案内（お膳の中・下のタブの上のどちらでも）の「アレルギー・苦手を設定」のボタンの字が切れない（… で途切れない・はみ出さない）
//  使い方: node tools/tests/ui54.mjs [http://localhost:9331/]   （LANGS=ja,en・WS=195 でしぼる）
//  L1 幅 195・240px × 18言語 × 文字0〜2: 見えている案内のボタンの見えている字（幅 260px 未満は短い言い方 .ah-n）が、箱に収まっている（高さ・幅とも）。3行まで。ボタンは 40px 以上で、画面の中
//  L2 そのとき、案内は最初の画面（下のタブより上）に入り、お膳の料理（器・名前・かえる・札）に重ならない（ui53 A と同じ決まり。字を増やしても崩れない）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = (process.argv[2] || process.env.BASE || BASE_).replace(/\/?$/, '/');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const LANGS = (process.env.LANGS || 'ja,ar,de,en,es,fil,fr,hi,id,it,ko,pl,pt-BR,th,tr,vi,zh-Hans,zh-Hant').split(',');
const CC = { ja: 'JP', ar: 'EG', de: 'DE', en: 'US', es: 'ES', fil: 'PH', fr: 'FR', hi: 'IN', id: 'ID', it: 'IT', ko: 'KR', pl: 'PL', 'pt-BR': 'BR', th: 'TH', tr: 'TR', vi: 'VN', 'zh-Hans': 'CN', 'zh-Hant': 'TW' };
const WS = (process.env.WS || '195,240').split(',').map(Number);
const b = await chromium.launch(LAUNCH);
const cut = [], place = []; let n = 0;
for (const W of WS) for (const ts of [0, 1, 2]) for (const lang of LANGS){
    const tag = `${W}-${ts}-${lang}`, H = W <= 200 ? 422 : 640;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('ui54', tag)));
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, { onboarded: true, algHint: true, firstUse: '2026-11-13', settings: { country: CC[lang], uiLang: lang, dishCount: 'auto', servings: 2, textSize: ts } });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && !!document.querySelector('#view .tray'), null, { timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(1200);
    const g = await p.evaluate(() => {
        const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
        const h = [...document.querySelectorAll('#view .alg-hint')].filter(vis)[0]; if (!h) return { none: true };
        const s = [...h.querySelectorAll('.ah-go > span')].find(vis), go = h.querySelector('.ah-go'), sr = s.getBoundingClientRect(), gr = go.getBoundingClientRect(), a = h.getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(s).lineHeight) || 16, lines = Math.round(sr.height / lh);
        const clip = s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1 || sr.bottom > gr.bottom + .5 || sr.right > gr.right + .5 || sr.left < gr.left - .5 || go.scrollWidth > go.clientWidth + 1;
        const nav = document.querySelector('nav.tabs'), floor = nav ? nav.getBoundingClientRect().top : innerHeight;
        const ov = q => q.left < a.right - .5 && q.right > a.left + .5 ? Math.max(0, Math.min(a.bottom, q.bottom) - Math.max(a.top, q.top)) : 0;
        const dish = [...document.querySelectorAll('#view .spot .vessel, #view .spot .nm, #view .spot .swap:not(.swap-ph), #view .spot .alg-tag')].filter(vis).filter(e => ov(e.getBoundingClientRect()) > .5).length;
        return { cls: h.className, text: s.textContent, lines, clip, go: [Math.round(gr.width), Math.round(gr.height)], goOut: gr.left < -.5 || gr.right > document.documentElement.clientWidth + .5, inView: a.top >= -.5 && a.bottom <= floor + .5, dish };
    });
    n++;
    if (g.none || g.clip || g.lines > 3 || g.go[0] < 40 || g.go[1] < 40 || g.goOut) cut.push(`${tag}: ` + JSON.stringify(g));
    if (!g.none && (!g.inView || g.dish)) place.push(`${tag}: ` + JSON.stringify(g));
    await ctx.close();
}
await b.close();
ok(!cut.length && n === WS.length * 3 * LANGS.length, `L1 幅 ${WS.join('・')}px × 文字3段階 × ${LANGS.length}言語（${n}画面）: 案内のボタンの字が切れない（3行まで）: ${cut.length}件 ` + cut.slice(0, 5).join(' / '));
ok(!place.length, `L2 案内は最初の画面に入り、お膳の料理に重ならない: ${place.length}件 ` + place.slice(0, 5).join(' / '));
if (errs.length) { fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`ui54: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
