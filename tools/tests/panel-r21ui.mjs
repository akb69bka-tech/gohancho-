#!/usr/bin/env node
// 利用者モニター 第21回の直し（デザイン部・真壁）: R75・R77・R79・R78。Playwright。使い方: node tools/tests/panel-r21ui.mjs [http://localhost:8999/]
//  R75: 買い物メモの行は、17言語（＋繁体字） × 195/360/375/390/430 × 文字3段階で、品名が1文字ずつ縦に割れない（品名の幅が字の 1.6 倍以上・3字以上の名前が字の数の行にならない）。
//       ［買う］［家にある］・量・品名・チェックの箱は画面の中（左右に出ない）。量の字がチェックの箱に乗らない。横スクロールなし
//  R77: 条件のボタンの字（10分以内・3品・10分以内＋3品・ラクの日・おまかせ）は、17言語 × 390 ふつう／390 大きい／360 もっと大きい／430 もっと大きい で、出ている字が全部見える（… で切れない）。
//       ボタンは 48px 以下。気分と品数の字はいつも見える（入らないときに外すのは人数だけ）。語の途中で折れない（日・中・泰を除く）
//  R79: はじめての設定（人数・苦手）を 195px × 17言語 × 文字3段階で開くと、「ステップ 2 / 3」「スキップ」「もどる」「次へ」「献立を見る」が画面の中で、1語が縦に割れない（行の数 ≦ 語の数）
//  R78: アイコン（gohancho の4つ・ios-app/assets の5つ）に紺色・青の面がない（青みの強い画素が 1% 未満）。大きさは前と同じ。manifest・capacitor の色にも紺・青灰がない
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const CC = {ja: 'JP', en: 'US', fr: 'FR', de: 'DE', it: 'IT', es: 'ES', 'pt-BR': 'BR', pl: 'PL', tr: 'TR', ar: 'EG', hi: 'IN', 'zh-Hans': 'CN', 'zh-Hant': 'TW', ko: 'KR', th: 'TH', vi: 'VN', id: 'ID', fil: 'PH'};
const LANGS = (process.env.LANGS || Object.keys(CC).join(',')).split(',');
const open = async (o, tag) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: o.h || 844}, timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: true});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r21ui', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(([cc, lang, onb]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: onb, firstUse: '2026-10-01', foldOpen: {upg: true, tw: true, week: true}, settings: {country: cc, uiLang: lang, dishCount: 'auto', servings: 2}})); } }, [CC[o.lang || 'ja'], o.lang || 'ja', o.onb !== false]);
    await p.goto(URL_); await ready(p);
    if ((o.lang || 'ja') !== 'ja') await p.waitForFunction(cc => typeof PACK !== 'undefined' && PACK && PACK.country === cc, CC[o.lang], {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return {p, ctx};
};
const setTs = (p, ts) => p.evaluate(async ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; render(); await __tick(); }, ts);

// R75 買い物メモ
if (want('R75')) {
    let n = 0, rows = 0; const bad = [];
    for (const lang of LANGS) {
        const {p, ctx} = await open({lang}, `r75-${lang}`);
        await p.locator('#view [data-act="decide"]').first().tap(); await p.waitForTimeout(600); await p.evaluate(() => scrollTo(0, 0));
        await p.locator('#view .big-decide').first().tap(); await p.waitForTimeout(900);
        for (const [w, h] of [[195, 422], [360, 740], [375, 667], [390, 844], [430, 932]]) {
            await p.setViewportSize({width: w, height: h});
            for (const ts of [0, 1, 2]) {
                await setTs(p, ts);
                const r = await p.evaluate(() => { const vw = document.documentElement.clientWidth, out = []; let k = 0;
                    document.querySelectorAll('#view .buy-row').forEach(li => { const nm = li.querySelector('.br-nm b'); if (!nm || !li.getBoundingClientRect().width) return; k++;
                        const s = nm.textContent.trim(), q = nm.getBoundingClientRect(), fs = parseFloat(getComputedStyle(nm).fontSize), rg = document.createRange(); rg.selectNodeContents(nm);
                        const lines = new Set([...rg.getClientRects()].filter(x => x.width).map(x => Math.round(x.top))).size, chars = [...s.replace(/\s/g, '')].length;
                        if (chars >= 2 && q.width < fs * 1.6 || chars >= 3 && lines >= chars) out.push('縦に割れる:' + s.slice(0, 12) + '(' + Math.round(q.width) + 'px)');
                        const nb = li.querySelector('.br-nm').getBoundingClientRect(), mb = (li.querySelector('.br-main') || li).getBoundingClientRect(); if (nb.width < Math.min(fs * 5, mb.width - 1)) out.push('品名の欄が細い:' + s.slice(0, 12) + '(' + Math.round(nb.width) + 'px)');   // 下の小さい字（料理名・使う量）も細い欄で割れない
                        li.querySelectorAll('button, .br-q, .br-nm, input').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.right > vw + .5 || r.left < -.5)) out.push('画面の外:' + s.slice(0, 12) + ' ' + e.className); });
                        const bq = li.querySelector('.br-q'), cb = li.querySelector('.br-chk input'); if (bq && cb){ const a = bq.getBoundingClientRect(), c = cb.getBoundingClientRect(); if (a.left < c.right - 1 && a.right > c.left + 1 && a.top < c.bottom - 1 && a.bottom > c.top + 1) out.push('量が箱に乗る:' + s.slice(0, 12)); }
                    });
                    if (document.documentElement.scrollWidth > innerWidth + 1) out.push('横スクロール');
                    return {k, out}; });
                n++; rows += r.k; if (!r.k) bad.push(`${lang} ${w} 文字${ts}: 行なし`); if (r.out.length) bad.push(`${lang} ${w} 文字${ts}: ` + r.out.slice(0, 3).join(','));
            }
        }
        await ctx.close();
    }
    ok(n >= 255 && rows > 1000 && !bad.length, `R75 買い物メモ ${n} 画面・${rows} 行（17言語 × 5幅 × 文字3段階）: 品名が縦に割れない・ボタンと量が画面の中・量が箱に乗らない: ` + bad.slice(0, 4).join(' / '));
}

// R77 条件のボタンの字
if (want('R77')) {
    let n = 0, drop = 0; const bad = [];
    for (const lang of LANGS) {
        const {p, ctx} = await open({lang}, `r77-${lang}`);
        for (const [w, h, ts] of [[390, 844, 0], [390, 844, 1], [360, 740, 2], [430, 932, 2]]) {
            await p.setViewportSize({width: w, height: h});
            for (const kind of ['ten', 'dc3', 'ten3', 'easy', 'all']) {
                const r = await p.evaluate(async ([ts, kind]) => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize();
                    session.mood = /^ten/.test(kind) ? 'ten' : kind === 'easy' ? 'easy' : 'all'; S.settings.dishCount = /3$/.test(kind) ? 3 : 'auto'; session.menu = null; TRAY_FIT.key = ''; TRAY_FIT.base = ''; scrollTo(0, 0); render(); await __tick();
                    const ch = document.querySelector('#view [data-act=cond-open]'), sv = ch && ch.querySelector('.sv1'); if (!sv) return {err: 'なし'};
                    const cb = ch.getBoundingClientRect(), sb = sv.getBoundingClientRect(), rg = document.createRange(); let vis = 0, all = 0, split = 0; const tw = document.createTreeWalker(sv, NodeFilter.SHOW_TEXT); let nd; const seen = [];
                    while ((nd = tw.nextNode())) { let txt = ''; for (let i = 0; i < nd.data.length; i++){ if (/\s/.test(nd.data[i])) continue; rg.setStart(nd, i); rg.setEnd(nd, i + 1); const q = rg.getBoundingClientRect(); if (!q.width) continue; all++; txt += nd.data[i]; if (q.right <= Math.min(sb.right, cb.right) + .5 && q.left >= Math.max(sb.left, cb.left) - .5 && q.bottom <= sb.bottom + 1 && q.top >= sb.top - 1) vis++; }
                        if (txt) seen.push(nd.data);
                        const re = /[^\s·・]+/g; let mm; while ((mm = re.exec(nd.data))) { if (/[฀-๿぀-鿿]/.test(mm[0])) continue; const tops = new Set(); for (let i = mm.index; i < mm.index + mm[0].length; i++){ rg.setStart(nd, i); rg.setEnd(nd, i + 1); const q = rg.getBoundingClientRect(); if (q.width) tops.add(Math.round(q.top / 4)); } if (tops.size > 1) split++; } }
                    const shown = seen.join('');
                    const mood = session.mood === 'all' ? '' : MOODS.find(x => x.k === session.mood).label, cnt = S.settings.dishCount === 'auto' ? '' : t('{n}品', {n: menuSeats(session.menu)});
                    return {text: sv.textContent, vis, all, split, chipH: Math.round(cb.height), drop: ch.classList.contains('sv-nosv'), moodOk: !mood || shown.includes(mood), cntOk: !cnt || shown.includes(cnt), autoOk: mood || cnt || shown.includes(t('おまかせ'))}; }, [ts, kind]);
                n++; if (r.drop) drop++;
                if (r.err || r.vis < r.all || r.chipH > 48 || r.split || !r.moodOk || !r.cntOk || !r.autoOk) bad.push(`${lang} ${w} 文字${ts} ${kind}: ` + JSON.stringify(r));
            }
        }
        await ctx.close();
    }
    ok(n >= 340 && !bad.length, `R77 条件のボタンの字 ${n} 画面（17言語 × 4通り × 5つの条件。人数を外したのは ${drop}）: 字が全部見える・48px 以下・気分と品数は出る・語の途中で折れない: ` + bad.slice(0, 3).join(' / '));
}

// R79 はじめての設定 195px
if (want('R79')) {
    let n = 0; const bad = [];
    for (const lang of LANGS) {
        const {p, ctx} = await open({lang, w: 195, h: 422}, `r79-${lang}`);
        for (const ts of [0, 1, 2]) for (const step of [0]) {   // 第39回: はじめての設定の手順は2つ（2つめの使い方だけがこのシート）
            const r = await p.evaluate(async ([ts, step]) => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); startOnboard(); sheet.step = step; renderSheet(); await __tick(); await new Promise(r => setTimeout(r, 300));
                const vw = document.documentElement.clientWidth, out = [];
                const lines = e => { const rg = document.createRange(); rg.selectNodeContents(e); return new Set([...rg.getClientRects()].filter(x => x.width > 0).map(x => Math.round(x.top))).size; };
                const els = [...document.querySelectorAll('#sheet-root .ob-actions .btn, #sheet-root .ob-count > span, #sheet-root .ob-count .ob-skip')];
                for (const e of els){ const rr = e.getBoundingClientRect(), txt = e.textContent.trim(), words = txt.split(/\s+/).length, ln = lines(e); if (rr.right > vw + .5 || rr.left < -.5) out.push('外:' + txt); if (ln > Math.max(1, words)) out.push(ln + '行:' + txt); }
                const bar = document.querySelector('#sheet-root .ob-actions'); return {els: els.length, out, barH: bar ? Math.round(bar.getBoundingClientRect().height) : 0}; }, [ts, step]);
            n++; if (r.els < 4 || r.out.length || r.barH > 180) bad.push(`${lang} 文字${ts} 手順2: ` + JSON.stringify(r));
        }
        await ctx.close();
    }
    ok(n >= 51 && !bad.length, `R79 はじめての設定 195px ${n} 画面（17言語 × 文字3段階 × 使い方の手順）: ステップ・スキップ・もどる・献立を見るが画面の中で、1語が縦に割れない: ` + bad.slice(0, 3).join(' / '));
}

// R78 アイコン
if (want('R78')) {
    const files = [['gohancho/icon-192.png', 192], ['gohancho/icon-512.png', 512], ['gohancho/icon-maskable-512.png', 512], ['gohancho/apple-touch-icon.png', 180],
        ['ios-app/assets/icon-only.png', 1024], ['ios-app/assets/icon-foreground.png', 1024], ['ios-app/assets/icon-background.png', 1024], ['ios-app/assets/splash.png', 2732], ['ios-app/assets/splash-dark.png', 2732]];
    const p = await b.newPage(); await p.setContent('<!doctype html><body></body>');
    const bad = [];
    for (const [f, size] of files) {
        const src = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
        const r = await p.evaluate(async src => { const img = new Image(); img.src = src; await img.decode(); const w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, 512 / w);
            const cv = document.createElement('canvas'); cv.width = Math.round(w * s); cv.height = Math.round(h * s); const g = cv.getContext('2d'); g.drawImage(img, 0, 0, cv.width, cv.height);
            const d = g.getImageData(0, 0, cv.width, cv.height).data; let op = 0, blue = 0, navy = 0;
            for (let i = 0; i < d.length; i += 4){ if (d[i + 3] < 128) continue; op++; const [R, G, B] = [d[i], d[i + 1], d[i + 2]]; if (B > R + 24 && B > G + 8) blue++; if (Math.abs(R - 34) < 16 && Math.abs(G - 64) < 16 && Math.abs(B - 107) < 16) navy++; }
            return {w, h, blue: op ? blue / op : 0, navy}; }, src);
        if (r.w !== size || r.h !== size || r.blue >= .01 || r.navy) bad.push(f + ' ' + JSON.stringify(r));
    }
    await p.close();
    const man = fs.readFileSync(path.join(ROOT, 'gohancho/manifest.webmanifest'), 'utf8'), cap = fs.readFileSync(path.join(ROOT, 'ios-app/capacitor.config.json'), 'utf8');
    for (const [name, s] of [['manifest', man], ['capacitor', cap]]) for (const c of ['#22406b', '#eef1f4']) if (s.toLowerCase().includes(c)) bad.push(name + ' に ' + c);
    ok(!bad.length, `R78 アイコン ${files.length} ファイル: 大きさは前と同じ・紺／青の面なし（青みの画素 1% 未満）・manifest と capacitor の色に紺・青灰なし: ` + bad.slice(0, 4).join(' / '));
}

ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
