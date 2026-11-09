#!/usr/bin/env node
// 第32回 利用者モニター（画面）の回帰テスト（Playwright。使い方: node tools/tests/ui32.mjs [http://localhost:8817/]）
//  R147 入力欄（input・select・textarea。読むだけの欄も）の字は、文字の大きさの設定（3段階）に関係なく 16px 以上（iPhone の Safari は 16px 未満の欄を押すと拡大して戻らない）。
//       全画面を走査: 今日・各タブ（畳んだ欄を全部開く）・設定・条件シート（国の組み合わせ）・家族に聞く（家族の画面の言葉・送る名前）・食べたいもの・
//       食品ロス（期限を入れる食材）・共有の文の欄。どの画面でも、すべての入れ物の中に試しの欄を置いて測る（入れ物ごとの font:inherit などで小さくならない）。
//       ソースの CSS で input・select・textarea に字の大きさを決める規則が 16px 未満にしていない
//  R148 「前の献立」の丸は「まるごと入れ替え」の丸と同じ大きさ・字も同じ大きさ（絵だけ・小さい丸にならない）。押せる範囲は 44px 以上。押すと前の献立に戻る
//  R149 どの幅でも（500px 以上も）2つの丸を並べて、まとめて帯の真ん中に（左右の余りの差 2px 以内）。丸の高さはそろう。右から左の言語（ar）は前の献立が左
//  R153 「まるごと入れ替え」「前の献立」の字は語の途中で折れない（Intl.Segmenter の語）。下のタブの名前が消えない（ベトナム語の幅280pxなど）
//  R150 調理道具タブの一覧: 「献立に入れる」ボタンが画面からはみ出さない・字が切れない。道具チップの品数（3 món など）は折り返さない。チップの名前は語の途中で折れない
//  幅 195〜1024px × 文字3段階 × 18言語の抜き取り（ar を含む）。押していない料理（前の献立が出ても、下の段の料理）は動かない
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const LG = {ja: ['JP', 'ja-JP'], en: ['US', 'en-US'], es: ['ES', 'es-ES'], de: ['DE', 'de-DE'], hi: ['IN', 'hi-IN'], 'zh-Hans': ['CN', 'zh-CN'], 'zh-Hant': ['TW', 'zh-TW'], ko: ['KR', 'ko-KR'], pl: ['PL', 'pl-PL'], 'pt-BR': ['BR', 'pt-BR'], vi: ['VN', 'vi-VN'], it: ['IT', 'it-IT'], fil: ['PH', 'fil-PH'], id: ['ID', 'id-ID'], ar: ['EG', 'ar-EG'], fr: ['FR', 'fr-FR'], th: ['TH', 'th-TH'], tr: ['TR', 'tr-TR']};
const LANGS = Object.keys(LG);
const hOf = w => w <= 200 ? 422 : w <= 330 ? 640 : w <= 375 ? 740 : w <= 430 ? 844 : 900;
async function open({ui = 'ja', w = 390, ts = 0, extra = {}} = {}){
    const [cc, loc] = LG[ui];
    const ctx = await b.newContext({viewport: {width: w, height: hOf(w)}, locale: loc, timezoneId: 'Asia/Tokyo', hasTouch: true, isMobile: true, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('ui32', ui, w, ts)));
    const st = Object.assign({onboarded: true, firstUse: '2026-09-01', foldOpen: {upg: true, tw: true, week: true}, settings: {country: cc, uiLang: ui, dishCount: 'auto', servings: 2, textSize: ts || undefined}}, extra);
    await ctx.addInitScript(x => { try{ if (!sessionStorage.getItem('seeded')){ sessionStorage.setItem('seeded', '1'); localStorage.setItem('gohancho.v1', x); } }catch(e){} }, JSON.stringify(st));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(`${ui}/${w}/${ts}: ${e.message}`));
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    p.ctx = ctx; return p;
}

// ---- R147 静的: CSS の規則 ----
{
    const src = fs.readFileSync(path.join(ROOT, 'gohancho/index.html'), 'utf8');
    const css = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
    const bad = [];
    for (const m of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)){
        const sels = m[1].split(',').map(x => x.trim()), body = m[2];
        if (!sels.some(s => /(^|[\s>+~])(input|select|textarea)(\[[^\]]*\]|:[\w-]+(\([^)]*\))?)*$/.test(s))) continue;
        if (!/font(-size)?\s*:/.test(body)) continue;
        const decl = body.split(';').map(x => x.trim()).filter(Boolean);
        let fsz = null, inh = false;
        for (const d of decl){ const [k, ...v] = d.split(':'); const val = v.join(':').trim(); if (k.trim() === 'font' && /inherit/.test(val)){ inh = true; fsz = null; } if (k.trim() === 'font-size') fsz = val; }
        const good = v => /^max\(\s*16px/.test(v) || /^var\(--fs(16|18|20)/.test(v) || (/^([\d.]+)px$/.test(v) && parseFloat(v) >= 16) || (/^([\d.]+)rem$/.test(v) && parseFloat(v) >= 1);
        const base = sels.includes('button') && sels.includes('input');   // 共通の規則 button,input,select,textarea{font:inherit} は、すぐ後の input,select,textarea{font-size:max(16px,1em)} が受ける
        if (fsz != null ? !good(fsz) : (inh && !base)) bad.push(m[1].trim().slice(0, 60) + ' {' + (fsz || 'font:inherit') + '}');
    }
    ok(bad.length === 0, 'R147 CSS: 入力欄の字の大きさを 16px 未満にする規則がない: ' + bad.join(' / '));
    ok(/input,select,textarea\{font-size:max\(16px,1em\)\}/.test(css), 'R147 CSS: 入力欄の共通の規則は max(16px,1em)');
    const js = [...src.matchAll(/cssText\s*=\s*'([^']*)'/g)].map(m => m[1]).filter(x => /font:inherit/.test(x) && !/font-size:max\(16px/.test(x));
    ok(js.length === 0, 'R147 JS で作る欄（書き出しの予備の文の欄）も 16px 以上: ' + js.join(' / '));
}

// ---- R147 動き: 全画面の走査 ----
const MEASURE = `(() => {
    const vis = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
    const sel = 'input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=hidden]):not([type=color]):not([type=button]):not([type=submit]), textarea, select';
    const small = [...document.querySelectorAll(sel)].filter(e => vis(e) && !e.closest('.u32probe')).map(e => ({id: e.id || e.className || e.getAttribute('aria-label') || e.tagName, fs: parseFloat(getComputedStyle(e).fontSize)})).filter(x => x.fs < 16).map(x => x.id + ' ' + x.fs + 'px');
    const n = [...document.querySelectorAll(sel)].filter(vis).length;
    // すべての入れ物（クラスごとに1つ）に試しの欄を置いて測る
    const seen = new Set(), probe = [];
    for (const c of document.querySelectorAll('#view *, #sheet-root *, #modal-root *')){
        if (!vis(c) || /^(INPUT|SELECT|TEXTAREA|BUTTON|svg|path|IMG|OPTION|BR|WBR)$/i.test(c.tagName) || c.closest('svg')) continue;
        const k = c.tagName + '.' + (typeof c.className === 'string' ? c.className : '') + '|' + (c.parentElement && typeof c.parentElement.className === 'string' ? c.parentElement.className : '');
        if (seen.has(k) || seen.size > 1500) continue; seen.add(k);
        const d = document.createElement('span'); d.className = 'u32probe'; d.innerHTML = '<input type="text"><select><option>a</option></select><textarea></textarea><input type="number"><input type="time">';
        c.appendChild(d); d.querySelectorAll('input,select,textarea').forEach(e => { const f = parseFloat(getComputedStyle(e).fontSize); if (f < 16) probe.push(k.slice(0, 50) + ' ' + e.tagName + ' ' + f + 'px'); }); d.remove();
    }
    return {small, n, probe: [...new Set(probe)].slice(0, 6), probeN: seen.size};
})()`;
for (const [ui, ts] of [['ja', 0], ['ja', 1], ['ja', 2], ['en', 2], ['ar', 1], ['vi', 0]]){
    const p = await open({ui, ts, extra: {fridge: ['卵', '玉ねぎ', 'にんじん'], fridgeMeta: {'卵': {exp: '2026-11-10'}}, history: [{id: 'nikujaga', d: '2026-11-01'}], favs: ['nikujaga']}});
    const found = [], probes = []; let inputs = 0, probeN = 0;
    const measure = async where => { const r = await p.evaluate(MEASURE); inputs += r.n; probeN += r.probeN; r.small.forEach(x => found.push(where + ': ' + x)); r.probe.forEach(x => probes.push(where + ': ' + x)); };
    const openAll = async () => { for (let k = 0; k < 3; k++){ const n = await p.evaluate(() => { const ss = [...document.querySelectorAll('#view details:not([open]), #sheet-root details:not([open])')]; ss.forEach(d => d.open = true); return ss.length; }); if (!n) break; await p.waitForTimeout(150); } };
    const sheetOpen = async (fn, where) => { await p.evaluate(fn).catch(e => errs.push(where + ': ' + e.message)); await p.waitForTimeout(350); await openAll(); await measure(where); await p.evaluate(() => { try{ sheet = null; renderSheet(); }catch(e){} }); await p.waitForTimeout(200); };
    await openAll(); await measure('今日');
    const tabs = await p.$$eval('nav.tabs [data-tab]:not([hidden])', es => es.map(e => e.dataset.tab));
    for (const tb of tabs){ await p.click(`nav.tabs [data-tab="${tb}"]`).catch(() => {}); await p.waitForTimeout(400); await openAll(); await measure('タブ ' + tb); }
    await p.click('nav.tabs [data-tab="today"]').catch(() => {}); await p.waitForTimeout(300);
    await sheetOpen(() => openCondSheet(), '条件シート（国の組み合わせ）');
    await sheetOpen(() => { askOpen(); sheet.nameEdit = true; renderSheet(); }, '家族に聞く');
    await sheetOpen(() => { wishSendOpen(); sheet.nameEdit = true; renderSheet(); }, '食べたいもの');
    await sheetOpen(() => openShare('menu'), '共有');
    await p.click('[data-act="settings"]').catch(() => {}); await p.waitForTimeout(400);
    for (const k of await p.evaluate(() => SET_TABS.map(x => x[0]))){ await p.evaluate(k => setTabShow(k), k); await openAll(); await measure('設定 ' + k); }   // 設定はタブ分け（11/09）。タブを1つずつ開いて測る（選んでいないタブは hidden）
    ok(inputs >= 6, `R147 ${ui} 文字${ts}: 入力欄を走査した（${inputs} 欄・試しの入れ物 ${probeN}）`);
    ok(found.length === 0, `R147 ${ui} 文字${ts}: 画面の入力欄は 16px 以上: ` + found.slice(0, 8).join(' / '));
    ok(probes.length === 0, `R147 ${ui} 文字${ts}: どの入れ物に置いた欄も 16px 以上: ` + probes.slice(0, 8).join(' / '));
    await p.ctx.close();
}

// ---- R148・R149・R153・R150: 幅 × 文字 × 言語の抜き取り ----
const WS = [195, 220, 240, 260, 280, 320, 360, 390, 430, 500, 600, 768, 1024];
const CELLS = [];
WS.forEach((w, i) => [0, 1, 2].forEach(ts => {
    const k = i * 3 + ts; const set = new Set([LANGS[k % 18], LANGS[(k * 7 + 5) % 18]]);
    if (ts === 0 && [195, 390, 600].includes(w)){ set.add('ja'); set.add('en'); }
    if ([220, 500, 768].includes(w) && ts === 1) set.add('ar');
    if (w === 280) set.add('vi');
    set.forEach(ui => CELLS.push({ui, w, ts}));
}));
// 字が切れる・語の途中で折れる（Range で語ごとの行を見る）
const PAIR = `(() => {
    const q = s => document.querySelector(s), R = e => e ? e.getBoundingClientRect() : null;
    const mid = q('#view .tray .tg-mid'), sh = mid && mid.querySelector('.shuffle'), bk = mid && mid.querySelector('.mb-back');
    if (!sh || !bk) return {none: true};
    const si = sh.querySelector('.sh-ic'), bi = bk.querySelector('.mb-ic'), st = sh.querySelector('.sh-tx'), bt = bk.querySelector('.mb-tx');
    const lang = document.documentElement.lang || undefined;
    const broken = e => { const tx = e.textContent; let off = 0; const out = []; const tn = []; const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n; while (n = w.nextNode()) tn.push(n);
        const at = i => { let k = i; for (const t of tn){ if (k <= t.length) return [t, k]; k -= t.length; } return [tn[tn.length - 1], tn[tn.length - 1].length]; };
        for (const s of new Intl.Segmenter(lang, {granularity: 'word'}).segment(tx)){ if (s.isWordLike === false || !s.segment.trim()){ continue; } const r = document.createRange(); const a = at(s.index), z = at(s.index + s.segment.length); r.setStart(a[0], a[1]); r.setEnd(z[0], z[1]);
            const tops = new Set([...r.getClientRects()].filter(x => x.width > .5).map(x => Math.round(x.top / 4))); if (tops.size > 1) out.push(s.segment); }
        return out; };
    const clipped = e => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1;
    const m = R(mid), a = R(sh), c = R(bk), ra = R(si), rc = R(bi);
    const cs = getComputedStyle(mid), pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;
    const L = Math.min(a.left, c.left), Rr = Math.max(a.right, c.right);
    return {cls: bk.className, rtl: getComputedStyle(mid).direction === 'rtl', si: [ra.width, ra.height, ra.top], bi: [rc.width, rc.height, rc.top], sh: [a.left, a.right, a.width, a.height], bk: [c.left, c.right, c.width, c.height],
        fs: [parseFloat(getComputedStyle(st).fontSize), parseFloat(getComputedStyle(bt).fontSize)], txt: [st.textContent, bt.textContent], tvis: [st.getClientRects().length > 0 && R(st).width > 4, bt.getClientRects().length > 0 && R(bt).width > 4],
        clip: [clipped(st), clipped(bt)], broken: broken(st).concat(broken(bt)), gapL: L - (m.left + pl), gapR: (m.right - pr) - Rr, overlap: a.left < c.right - 1 && a.right > c.left + 1, vw: innerWidth };
})()`;
const NAVCHK = `(() => { const nv = document.querySelector('nav.tabs'); const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 1 && r.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.clipPath !== 'inset(50%)'; };   // 読み上げだけの名前（1px・clip-path）は数えない
    return [...nv.querySelectorAll('[data-tab]:not([hidden])')].map(b => { const ls = [...b.querySelectorAll('.tl,.tsn')].filter(vis); return {tab: b.dataset.tab, lab: ls.map(e => e.textContent).join('/'), clip: ls.some(e => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2)}; }); })()`;
const TOOLS = `(() => { const vw = innerWidth, sec = document.querySelector('#view .tt-sec'); if (!sec) return null; const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const adds = [...sec.querySelectorAll('.tt-add')].filter(vis).map(e => { const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, clip: e.scrollWidth > e.clientWidth + 1, h: r.height, w: r.width}; });
    const ns = [...sec.querySelectorAll('.chip .tt-n')].filter(vis).map(e => { const lh = parseFloat(getComputedStyle(e).fontSize) * 1.6; return {t: e.textContent, h: e.getBoundingClientRect().height, lh}; });
    const spaced = !/^(ja|zh|th)/.test(document.documentElement.lang || '');
    const brokenL = []; if (spaced) sec.querySelectorAll('.chip .tt-l').forEach(e => { if (!vis(e)) return; const tn = e.firstChild; if (!tn) return; const tx = tn.textContent; let i = 0; for (const wd of tx.split(/(\\s+)/)){ if (wd.trim()){ const r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + wd.length); const tops = new Set([...r.getClientRects()].filter(x => x.width > .5).map(x => Math.round(x.top / 4))); if (tops.size > 1) brokenL.push(wd); } i += wd.length; } });
    return {off: adds.filter(x => x.l < -1 || x.r > vw + 1).length, clip: adds.filter(x => x.clip).length, small: adds.filter(x => x.h < 43.5 || x.w < 43.5).length, n: adds.length, nWrap: ns.filter(x => x.h > x.lh).map(x => x.t), brokenL, hs: document.documentElement.scrollWidth > vw + 1}; })()`;
const bad = {r148: [], r149: [], r153: [], nav: [], r150: [], move: [], back: []};
let nPair = 0, nTools = 0;
async function cell({ui, w, ts}){
    const p = await open({ui, w, ts});
    try{
        const tag = `${ui}/${w}/${ts}`;
        const nav = await p.evaluate(NAVCHK);
        nav.filter(x => !x.lab || x.clip).forEach(x => bad.nav.push(`${tag} ${x.tab}:${x.lab || '（名前なし）'}${x.clip ? '（切れる）' : ''}`));
        const MARU = '#view .tray .tg-mid [data-act="new-menu"]';
        await p.locator(MARU).first().scrollIntoViewIfNeeded().catch(() => {});
        const before = await p.evaluate(() => JSON.stringify(session.menu.items.map(i => i.r && i.r.id)));
        // 押していない料理を動かさない（幅500px以上）: 前の献立が出ても、まるごと入れ替えの帯（.tg-mid）の高さは変わらない（下の段の料理が上下しない）。
        // 幅500px未満は、お膳を詰めたとき丸の横に字を置くので、前の献立が出ると字を丸の下に回して帯が高くなる（11/09 オーナー指示「丸の下に字を置いて場所をとり」。narrow-r7・menu-back の約束）
        const MIDH = `(() => { const m = document.querySelector('#view .tray .tg-mid'), t = document.querySelector('#view .tray'); const r = m.getBoundingClientRect(); return Math.round(r.height); })()`;
        const h0 = await p.evaluate(MIDH);
        await p.locator(MARU).first().tap(); await p.waitForTimeout(1000);
        const h1 = await p.evaluate(MIDH);
        if (w >= 500 && h0 !== h1) bad.move.push(`${tag} ${h0} → ${h1}`);
        await p.locator(MARU).first().tap(); await p.waitForTimeout(600);
        const r = await p.evaluate(PAIR);
        if (r.none){ bad.r148.push(tag + ' 前の献立が出ない'); }
        else {
            nPair++;
            const d = (x, y) => Math.abs(x - y);
            if (d(r.si[0], r.bi[0]) > 1 || d(r.si[1], r.bi[1]) > 1 || r.bi[0] < 44) bad.r148.push(`${tag} 丸 ${r.si[0]}/${r.bi[0]}`);
            if (d(r.fs[0], r.fs[1]) > .1) bad.r148.push(`${tag} 字 ${r.fs.join('/')}`);
            if (/\b(icon|nocap|tightb)\b/.test(r.cls) || !r.tvis[0] || !r.tvis[1]) bad.r148.push(`${tag} 字が出ない ${r.cls}`);
            if (r.clip[0] || r.clip[1]) bad.r148.push(`${tag} 字が切れる ${r.txt.join('|')}`);
            if (Math.min(r.sh[2], r.sh[3], r.bk[2], r.bk[3]) < 44) bad.r148.push(`${tag} 押せる範囲 ${[r.sh[2], r.sh[3], r.bk[2], r.bk[3]].map(Math.round)}`);
            if (d(r.si[2], r.bi[2]) > 1) bad.r149.push(`${tag} 丸の高さ ${r.si[2]}/${r.bi[2]}`);
            if (d(r.gapL, r.gapR) > 2) bad.r149.push(`${tag} 左右の余り ${Math.round(r.gapL)}/${Math.round(r.gapR)}`);
            if (r.overlap) bad.r149.push(`${tag} 重なる`);
            if (r.rtl ? !(r.bk[1] <= r.sh[0] + 1) : !(r.bk[0] >= r.sh[1] - 1)) bad.r149.push(`${tag} 左右が逆（rtl=${r.rtl}）`);
            if (r.broken.length) bad.r153.push(`${tag} ${r.broken.join(',')}`);
            // 押すと前の献立に戻る（押せる）
            const hist = await p.evaluate(() => JSON.stringify(menuBack.list[menuBack.list.length - 1].menu.items.map(i => i.r && i.r.id)));
            await p.locator('#view .tg-mid [data-act="menu-back"]').first().tap(); await p.waitForTimeout(500);
            const now = await p.evaluate(() => JSON.stringify(session.menu.items.map(i => i.r && i.r.id)));
            if (now !== hist || now === before && false) bad.back.push(tag);
        }
        if ([195, 220, 240, 260, 320, 390].includes(w)){
            await p.locator('nav.tabs [data-tab="tools"]').first().tap(); await p.waitForTimeout(400);
            const cat = p.locator('#view [data-act="tt-cat"][data-v="grill"]').first();
            if (await cat.count()){
                await cat.scrollIntoViewIfNeeded().catch(() => {}); await cat.tap(); await p.waitForTimeout(300);
                const tl = p.locator('#view [data-act="tt-tool"][data-v="pan"]').first(); if (await tl.count()){ await tl.scrollIntoViewIfNeeded().catch(() => {}); await tl.tap(); await p.waitForTimeout(300); }
                const t = await p.evaluate(TOOLS);
                if (t){ nTools++; if (t.off || t.clip || t.small || t.hs) bad.r150.push(`${tag} 献立に入れる はみ出し${t.off}・切れ${t.clip}・小さい${t.small}/${t.n}${t.hs ? '・横スクロール' : ''}`); if (t.nWrap.length) bad.r150.push(`${tag} 品数が折れる ${t.nWrap.join(',')}`); if (t.brokenL.length) bad.r150.push(`${tag} 道具の名前が語の途中で折れる ${t.brokenL.join(',')}`); }
            }
        }
    } finally { await p.ctx.close(); }
}
const queue = CELLS.slice(); const J = Number(process.env.UI32_JOBS || 4);
await Promise.all(Array.from({length: J}, async () => { while (queue.length){ const c = queue.shift(); try{ await cell(c); }catch(e){ errs.push(`${c.ui}/${c.w}/${c.ts}: ${e.message.slice(0, 120)}`); } } }));
const show = a => a.slice(0, 10).join(' / ') + (a.length > 10 ? ` …ほか${a.length - 10}` : '');
ok(nPair >= CELLS.length - 2, `R148 前の献立を測った（${nPair}/${CELLS.length} 画面・${WS.length}幅 × 文字3段階 × 18言語の抜き取り）`);
ok(bad.r148.length === 0, 'R148 前の献立の丸はまるごと入れ替えと同じ大きさ・同じ字（字が出る・切れない・押せる範囲 44px 以上）: ' + show(bad.r148));
ok(bad.back.length === 0, 'R148 前の献立を押すと前の献立に戻る: ' + show(bad.back));
ok(bad.r149.length === 0, 'R149 2つの丸を並べて帯の真ん中に（丸の高さ・左右の余り・右から左の言語は前の献立が左）: ' + show(bad.r149));
ok(bad.move.length === 0, '押していない料理は動かない（幅500px以上: 前の献立が出ても、丸の帯の高さが変わらない）: ' + show(bad.move));
ok(bad.r153.length === 0, 'R153 まるごと入れ替え・前の献立の字は語の途中で折れない: ' + show(bad.r153));
ok(bad.nav.length === 0, 'R153 下のタブの名前が消えない・切れない: ' + show(bad.nav));
ok(nTools >= 20, `R150 調理道具の一覧を測った（${nTools} 画面）`);
ok(bad.r150.length === 0, 'R150 献立に入れるがはみ出さない・品数が折れない・名前が語の途中で折れない: ' + show(bad.r150));
ok(errs.length === 0, 'ページの例外なし: ' + errs.slice(0, 3).join(' | '));
await b.close();
console.log(fails ? `FAIL ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
