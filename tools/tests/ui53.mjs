#!/usr/bin/env node
// ui53（第48回モニター: R215・R213 の残り・R216・R214）の回帰テスト
//  使い方: node tools/tests/ui53.mjs [http://localhost:9331/]   （ONLY=A,B,C・LANGS=ja,en でしぼる）
//  A（R215・R213）幅195px × 18言語 × 文字0〜2: はじめの「アレルギー・苦手を設定」の案内が最初の画面（下のタブより上）に見える。
//     お膳の料理（器・名前・かえる・札）に重ならない。丸い「まるごと入れ替え」には 8px までしか重ならない。お膳より上には出ない
//     （直す前: 文字いちばん大きいでお膳の下・画面2つ分ほど下に回る・丸いボタンの下半分 24px〜にかかる・料理名にかかる）
//  B（R216）設定を開いた直後（家族・アレルギーのタブ）: 18言語 × 320・360・390px × 文字0〜2 で、‹ › が出ている側では、
//     丸とぼかし（24px）の外に、隣のタブの頭が 8px 以上見える（直す前: 360px の ja・en・es・ar・hi・pt、390px の it・vi・zh などで丸の下に隠れた）
//  C（R214）サポートのページの機種変更の手順: 「ファイルから読み込む」は「データの引っ越し・バックアップ」をひらくと出てくる、と書いてある（日本語・英語）。
//     英語のページ（日本語と英語以外の言語でも開く）には、ボタンの名前がアプリの言語で出ることと、ボタンの場所を書いてある。課金の質問3つは hidden のまま
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = (process.argv[2] || process.env.BASE || BASE_).replace(/\/?$/, '/');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const LANGS = (process.env.LANGS || 'ja,ar,de,en,es,fil,fr,hi,id,it,ko,pl,pt-BR,th,tr,vi,zh-Hans,zh-Hant').split(',');
const CC = { ja: 'JP', ar: 'EG', de: 'DE', en: 'US', es: 'ES', fil: 'PH', fr: 'FR', hi: 'IN', id: 'ID', it: 'IT', ko: 'KR', pl: 'PL', 'pt-BR': 'BR', th: 'TH', tr: 'TR', vi: 'VN', 'zh-Hans': 'CN', 'zh-Hant': 'TW' };
const b = await chromium.launch(LAUNCH);
const open = async (w, h, st, tag, touch) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: !!touch, isMobile: !!touch, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('ui53', tag)));
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && !!document.querySelector('#view > *'), null, { timeout: 60000 }).catch(() => {});
    return { p, ctx };
};

// ---- A 幅195px の案内 ----
if (want('A')){
    const bad = []; let n = 0;
    for (const ts of [0, 1, 2]) for (const lang of LANGS){
        const tag = `a-${ts}-${lang}`;
        const { p, ctx } = await open(195, 422, { onboarded: true, algHint: true, firstUse: '2026-11-13', settings: { country: CC[lang], uiLang: lang, dishCount: 'auto', servings: 2, textSize: ts } }, tag, true);
        await p.waitForSelector('#view .tray', { timeout: 60000 }).catch(() => {}); await p.waitForTimeout(1200);
        const g = await p.evaluate(() => {
            const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
            const h = [...document.querySelectorAll('#view .alg-hint')].filter(vis)[0]; if (!h) return { none: true };
            const a = h.getBoundingClientRect(), nav = document.querySelector('nav.tabs'), floor = nav ? nav.getBoundingClientRect().top : innerHeight, tr = document.querySelector('#view .tray').getBoundingClientRect();
            const ov = q => q.left < a.right - .5 && q.right > a.left + .5 ? Math.max(0, Math.min(a.bottom, q.bottom) - Math.max(a.top, q.top)) : 0;
            const dish = [...document.querySelectorAll('#view .spot .vessel, #view .spot .nm, #view .spot .swap:not(.swap-ph), #view .spot .alg-tag')].filter(vis).map(e => [e.className.split(' ')[0], Math.round(ov(e.getBoundingClientRect()))]).filter(x => x[1] > 0);
            const sh = Math.max(0, ...[...document.querySelectorAll('#view .tg-mid .shuffle')].filter(vis).map(e => ov(e.getBoundingClientRect())));
            const go = h.querySelector('[data-act="alg-hint-open"]').getBoundingClientRect();
            return { cls: h.className, top: Math.round(a.top), bottom: Math.round(a.bottom), floor: Math.round(floor), trTop: Math.round(tr.top), inView: a.top >= -.5 && a.bottom <= floor + .5, dish, sh: Math.round(sh), go: [Math.round(go.width), Math.round(go.height)] };
        });
        n++;
        if (g.none || !g.inView || g.dish.length || g.sh > 8 || g.top < g.trTop - .5 || g.go[0] < 40 || g.go[1] < 40) bad.push(`文字${ts} ${lang}: ` + JSON.stringify(g));
        await ctx.close();
    }
    ok(!bad.length && n === 3 * LANGS.length, `A 幅195px × 文字3段階 × ${LANGS.length}言語（${n}画面）: 案内が最初の画面に見え、料理に重ならず、丸いボタンには 8px まで: ${bad.length}件 ` + bad.slice(0, 4).join(' / '));
}

// ---- B 設定のタブの列（開いた直後のぞき） ----
if (want('B')){
    const bad = []; let n = 0;
    for (const lang of LANGS) for (const w of [320, 360, 390]) for (const ts of [0, 1, 2]){
        const { p, ctx } = await open(w, 740, { onboarded: true, firstUse: '2026-01-01', settings: { country: 'JP', uiLang: lang, dishCount: 3, textSize: ts || undefined } }, `b-${lang}-${w}-${ts}`);
        const r = await p.evaluate(async () => {
            setTab('settings'); await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
            const sc = document.querySelector('#view .set-tabs'), A = sc.getBoundingClientRect(), R = [...sc.querySelectorAll('.set-tab')].map(x => x.getBoundingClientRect());
            const out = { k: sc.querySelector('[aria-selected="true"]').dataset.k };
            for (const d of ['prev', 'next']){
                const c = document.querySelector(`#view .set-tabs-cue[data-dir="${d}"]`); if (!c || c.hidden) continue;
                const cr = c.getBoundingClientRect(), left = cr.left < (A.left + A.right) / 2;
                out[d] = Math.round(Math.max(0, ...R.map(q => left ? (q.left < cr.right && q.right > cr.right ? q.right - cr.right : 0) : (q.right > cr.left && q.left < cr.left ? cr.left - q.left : 0))));
            }
            const act = sc.querySelector('[aria-selected="true"]').getBoundingClientRect(); out.act = act.left >= A.left - 1 && act.right <= A.right + 1;
            return out;
        });
        n++;
        if ((r.prev != null && r.prev < 8) || (r.next != null && r.next < 8) || !r.act) bad.push(`${lang} ${w}px 文字${ts}: ` + JSON.stringify(r));
        await ctx.close();
    }
    ok(!bad.length && n === LANGS.length * 9, `B 設定を開いた直後（${n}画面）: ‹ › の丸とぼかしの外に、隣のタブの頭が 8px 以上見える: ${bad.length}件 ` + bad.slice(0, 6).join(' / '));
}

// ---- C サポートのページの機種変更の手順 ----
if (want('C')){
    const ja = fs.readFileSync(ROOT + '/support.html', 'utf8'), en = fs.readFileSync(ROOT + '/support-en.html', 'utf8');
    const step = (s, open, load) => { const i = s.indexOf(open), j = s.indexOf(load, i); return i >= 0 && j > i; };
    ok(step(ja, '「データの引っ越し・バックアップ」を押してひらき', '「ファイルから読み込む」') && step(en, '"Move or back up your data" to open it', '"Load from file" inside it'),
        'C1 「ファイルから読み込む」は「データの引っ越し・バックアップ」をひらくと出てくる、と書いてある（日本語・英語）');
    ok(/another language, the buttons show in that language/.test(en) && /"Save as file" is the first button under Data/.test(en), 'C2 英語のページ（ほかの16言語でも開く）に、ボタンの名前はアプリの言語で出ることと、ボタンの場所がある');
    ok([ja, en].every(s => (s.match(/data-billing="paid" hidden/g) || []).length === 3), 'C3 課金の質問3つは hidden のまま残っている');
}

await b.close();
if (errs.length) { fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`ui53: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
