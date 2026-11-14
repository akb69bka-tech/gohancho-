#!/usr/bin/env node
// 第52回 R213: はじめの「アレルギー・苦手の設定」の案内が、幅 320px 以下でお膳の料理に重ならない
//  使い方: node tools/tests/ui52.mjs [http://localhost:9291/]   （LANGS=ja,en で言語をしぼる。CI では run-all.sh が 6 言語にしぼる）
//  U1 幅 195・240・280・320px × 18言語 × 文字 0〜2: 案内（決定の帯の中・下のタブの上・お膳の下のどれか）が出ていて、
//     最初の画面で、お膳の料理（器・名前・かえる・札）に重ならない。決定の帯（案内入り）も料理に重ならない。案内はお膳より上に出ない。
//     案内の「設定」ボタンは 40px 以上で、押すとアレルギーの設定（アレルギー対策）へ行ける。
//     幅 260px 未満だけ、上の段の「かえる」の下半分にかかるのは許す（ob40 の決まり。かえるの上半分は見えて押せる）。そのときも案内は最初の画面に出ていること
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const LANGS = (process.env.LANGS || 'ja,ar,de,en,es,fil,fr,hi,id,it,ko,pl,pt-BR,th,tr,vi,zh-Hans,zh-Hant').split(',');
const CC = { ja: 'JP', ar: 'EG', de: 'DE', en: 'US', es: 'ES', fil: 'PH', fr: 'FR', hi: 'IN', id: 'ID', it: 'IT', ko: 'KR', pl: 'PL', 'pt-BR': 'BR', th: 'TH', tr: 'TR', vi: 'VN', 'zh-Hans': 'CN', 'zh-Hant': 'TW' };
const WS = (process.env.WS || '195,240,280,320').split(',').map(Number);
const geo = p => p.evaluate(() => {
    const nav = document.querySelector('nav.tabs'), navTop = nav ? nav.getBoundingClientRect().top : innerHeight;
    const hs = [...document.querySelectorAll('#view .alg-hint')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none');
    if (!hs.length) return { none: true };
    const h = hs[0], a = h.getBoundingClientRect(), tr = document.querySelector('#view .tray'), trTop = tr.getBoundingClientRect().top;
    const hit = (a, q) => a.left < q.right - .5 && q.left < a.right - .5 && a.top < q.bottom - .5 && q.top < a.bottom - .5;
    const vis = q => q.height > 0 && q.width > 0 && q.top < navTop - .5 && q.bottom > .5;
    const dishes = [...tr.querySelectorAll('.spot .vessel, .spot .nm, .spot .swap:not(.swap-ph), .spot .alg-tag')].map(e => ({ e, q: e.getBoundingClientRect() })).filter(x => vis(x.q));
    const name = e => (e.className.baseVal || e.className).split(' ')[0];
    // 幅 260px 未満（195 など）は、上の段の「かえる」の下の方にかかるのだけ前から許している（ob40。上の段がやっと入る高さで、案内を最初の画面に残すのを先に）。かえるの上半分は見えて押せること
    const row0 = tr.querySelector('.tg-row'), narrowOk = x => innerWidth < 260 && row0 && row0.contains(x.e) && x.e.matches('.swap') && a.top - x.q.top >= x.q.height / 2 - .5;
    const cover = a.top < navTop ? dishes.filter(x => hit(a, x.q) && !narrowOk(x)).map(x => name(x.e) + ':' + Math.round(Math.min(a.bottom, x.q.bottom) - Math.max(a.top, x.q.top))) : [];
    const swapPart = dishes.filter(x => hit(a, x.q) && narrowOk(x)).length;
    const bar = h.closest('.actionbar'), br = bar && /sticky|fixed/.test(getComputedStyle(bar).position) ? bar.getBoundingClientRect() : null;
    const barCover = br ? dishes.filter(x => hit(br, x.q)).map(x => name(x.e)) : [];
    const go = h.querySelector('[data-act="alg-hint-open"]'), gr = go && go.getBoundingClientRect();
    return { swapPart, inView: a.top >= -.5 && a.bottom <= navTop + .5, cls: h.className, top: Math.round(a.top), bottom: Math.round(a.bottom), trTop: Math.round(trTop), navTop: Math.round(navTop), cover, barCover, go: gr ? [Math.round(gr.width), Math.round(gr.height)] : null, body: document.body.className };
});
const bad = []; let n = 0;
for (const W of WS) for (const ts of [0, 1, 2]) for (const lang of LANGS){
    const H = W <= 200 ? 422 : 640, tag = `${W}-${ts}-${lang}`;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('ui52', tag)));
    const st = { onboarded: true, algHint: true, firstUse: '2026-11-13', settings: { country: CC[lang], uiLang: lang, dishCount: 'auto', servings: 2, textSize: ts } };
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && !!document.querySelector('#view .tray'), null, { timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(1200);
    const g = await geo(p); n++;
    if (g.none || (g.swapPart && !g.inView) || g.cover.length || g.barCover.length || g.top < g.trTop - .5 || !g.go || g.go[0] < 40 || g.go[1] < 40) bad.push(`${tag}: ` + JSON.stringify(g));
    if (W === 280 && ts === 2 && !g.none){   // 押すとアレルギー対策へ
        await p.evaluate(() => document.querySelector('#view .alg-hint [data-act="alg-hint-open"]').click()); await p.waitForTimeout(500);
        const to = await p.evaluate(() => { const c = document.getElementById('allergy-card'); return tab === 'settings' && !!c; });
        if (!to) bad.push(`${tag}: 案内のボタンでアレルギー対策へ行けない`);
    }
    await ctx.close();
}
ok(n === WS.length * 3 * LANGS.length && !bad.length, `U1 幅 ${WS.join('・')}px × 文字3段階 × ${LANGS.length}言語（${n}画面）: 案内が出て、お膳の料理に重ならない: ${bad.length}件 ` + bad.slice(0, 5).join(' / '));
await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nui52: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
