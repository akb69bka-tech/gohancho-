#!/usr/bin/env node
// 第55回 R235〜R238（小さな件）
//  使い方: node tools/tests/r235.mjs [http://localhost:9331/]   （LANGS=ja,en でしぼれる）
//  C1 R235 設定のタブの列を、あと1回の「次へ」で端に着く所（と列の頭）に置き、「次へ」（›）を 0.25 秒あけて2回押す: 2回目が、列が送られて指の下に来た別のタブ（「家族へ」など）なら受けない（画面は移らない）。「もう一度押してください」が出る
//  C2 R235 止めすぎない: 「次へ」のあと 0.8 秒あけて同じ所のタブを押せば、そのタブに移る。「次へ」の2回目が「次へ」の上なら、列はもう一度送られる
//  C3 R236 ベジタリアン向けを押してから 0.8 秒で「卵も外す」を押すと受ける（重い機械でなくても、一言のたしかめ直しで守りが延びない）。出てすぐ（0.25 秒）の押しは受けない
//  C4 R237 一言が上の帯と下のタブのあいだに入りきらないとき（幅195px のドイツ語・英語・フランス語の家族の人など）: ボタンが一言の上にあり、一言の頭は上の帯の下に見える。
//     文は「上のボタンで外せます」。描き直しても同じ形。入りきるときは、これまでどおり（一言が上・ボタンが下・「下のボタン」）
//  C5 R237 18言語とも「上のボタンで外せます」の訳がある（日本語の文のままにならない・「下」の訳と別の文）
//  C6 R238 料理名から（英語・日本語・ドイツ語、ヴィーガン）で「世界の似た料理」だけが空で読みこみ中の国が残るとき、2つの文が別の行に出る（.ns-still が1つ目の文の下の行）
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
const ALL = ['ja', ...fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''))];
const LANGS = process.env.LANGS ? process.env.LANGS.split(',') : ['ja', 'en', 'de', 'ar'];
const WIDTHS = [[195, 422], [320, 568], [390, 844]];
const b = await chromium.launch(LAUNCH);
const open = async (lg, w, h, st = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        {onboarded: true, firstUse: '2020-01-01', settings: Object.assign({country: 'JP', uiLang: lg, dishCount: 3, servings: 2}, st.settings || {}), family: [{id: 'f1', name: 'Ravi', role: 'adult', avoid: [], allergy: []}]});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lg + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, {timeout: 30000});
    return {p, ctx};
};
const curTab = p => p.evaluate(() => { const e = document.querySelector('#view .set-tab[aria-selected="true"]'); return e ? e.dataset.k : ''; });
const underAt = (p, c) => p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y), t = e && e.closest('[data-act]'); return t ? t.dataset.act + ':' + (t.dataset.k || t.dataset.dir || '') : ''; }, [c.x, c.y]);
// 設定を開き、tab のタブを出して、列の「次へ」（›）の真ん中を返す（出ていなければ null）
const cueOf = async (p, k, end = true) => {
    // 列を、あと1回の「次へ」で端に着く所まで送っておく（端に着くと「次へ」が消え、その下のタブが指の下に来る。調査で起きた形）
    await p.evaluate(async ([k, end]) => { setTab('settings'); setGo(k); window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 200));
        const sc = document.querySelector('#view .set-tabs'), rtl = getComputedStyle(sc).direction === 'rtl', max = sc.scrollWidth - sc.clientWidth, to = Math.max(0, max - sc.clientWidth * 0.4);
        if (end) sc.scrollLeft = rtl ? -to : to; await new Promise(r => setTimeout(r, 300)); }, [k, end]);
    return p.evaluate(() => { const e = document.querySelector('#view .set-tabs-cue[data-dir="next"]'); if (!e || e.hidden) return null; const q = e.getBoundingClientRect(); if (!q.width) return null; return {x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2}; });
};

// ---- C1・C2 R235 ----
{
    const bad = [], seen = []; let hit = 0, okLate = 0, lateN = 0, again = 0, againN = 0;
    for (const lg of LANGS) for (const [w, h] of WIDTHS) for (const k of ['food', 'menu', 'family']){
        for (const end of [true, false]){   // C1: 0.25 秒あけた2回押し（端の手前から・列の頭から）
            const tag = `${lg} ${w} ${k}${end ? ' 端の手前' : ' 頭から'}`;
            const {p, ctx} = await open(lg, w, h);
            const c = await cueOf(p, k, end);
            if (c){
                const t0 = await curTab(p), sl0 = await p.evaluate(() => document.querySelector('#view .set-tabs').scrollLeft);
                await p.mouse.click(c.x, c.y); await p.waitForTimeout(250);
                const under = await underAt(p, c);
                await p.mouse.click(c.x, c.y); await p.waitForTimeout(120);
                const tip = await p.evaluate(() => !!document.querySelector('.tap-again'));
                await p.waitForTimeout(500);
                const t1 = await curTab(p), sl1 = await p.evaluate(() => document.querySelector('#view .set-tabs').scrollLeft);
                seen.push(`${tag}:${under}`);
                if (under.startsWith('set-jump:')){ hit++;
                    if (t1 !== t0) bad.push(`${tag}: 2回目が「${under}」に当たって画面が移った（${t0}→${t1}）`);
                    if (!tip) bad.push(`${tag}: 2回目を止めたのに「もう一度押してください」が出ない`);
                } else if (under.startsWith('set-tabs-step:')){ againN++; if (Math.abs(sl1 - sl0) > 1) again++; if (t1 !== t0) bad.push(`${tag}: 「次へ」の2回目で画面が移った`); if (tip) bad.push(`${tag}: 「次へ」の2回目（同じボタン）で「もう一度押してください」が出た`); }
            }
            await ctx.close();
        }
        {   // C2: 0.8 秒あけて同じ所のタブを押す → 移る
            const tag = `${lg} ${w} ${k}`;
            const {p, ctx} = await open(lg, w, h);
            const c = await cueOf(p, k);
            if (c){
                await p.mouse.click(c.x, c.y); await p.waitForTimeout(800);
                const under = await underAt(p, c);
                if (under.startsWith('set-jump:')){ lateN++;
                    await p.mouse.click(c.x, c.y); await p.waitForTimeout(300);
                    const t1 = await curTab(p), tip = await p.evaluate(() => !!document.querySelector('.tap-again'));
                    if (t1 === under.split(':')[1] && !tip) okLate++; else bad.push(`${tag}: 0.8 秒あけて押した「${under}」が受けられない（${t1}・tip=${tip}）`);
                }
            }
            await ctx.close();
        }
    }
    console.log('C1 指の下:', seen.join(' '));
    ok(hit > 0 && againN > 0 && again === againN && bad.filter(x => !/0\.8/.test(x)).length === 0, `C1 R235 ${LANGS.length}言語 × 幅195・320・390 × 3つのタブ: 「次へ」の2回目が別のタブの上（${hit}回）でも画面は移らず、「もう一度押してください」が出る。同じ「次へ」の上なら送る（${again}/${againN}）: ` + bad.slice(0, 6).join(' | '));
    ok(lateN > 0 && okLate === lateN, `C2 R235 止めすぎない: 0.8 秒あけて押したタブには移る（${okLate}/${lateN}）: ` + bad.filter(x => /0\.8/.test(x)).slice(0, 6).join(' | '));
}

// ---- C3 R236 ----
{
    const bad = []; let n = 0;
    for (const lg of LANGS) for (const [w, h] of WIDTHS) for (const where of ['settings', 'family']) for (const gap of [800, 250]){
        const {p, ctx} = await open(lg, w, h);
        const sel = where === 'settings' ? '#view [data-act="toggle-avoid-diet"][data-v="vegi"]' : '[data-fm="f1"] [data-act="fam-avoid-diet"][data-v="vegi"]';
        const scope = where === 'settings' ? '#view' : '[data-fm="f1"]';
        await p.evaluate(async where => { setTab('settings'); setTabShow(where === 'settings' ? 'food' : 'family'); if (where === 'family'){ session.famOpen = 'f1'; render(); } await new Promise(r => setTimeout(r, 200)); }, where);
        const c = await p.evaluate(sel => { const e = document.querySelector(sel); e.scrollIntoView({block: 'center'}); const q = e.getBoundingClientRect(); return {x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2}; }, sel);
        await p.waitForTimeout(150);
        const t0 = Date.now();
        await p.mouse.click(c.x, c.y);
        // 一言の「卵も外す」の場所を、押す少し前に読む（人が見て押す形）
        await p.waitForTimeout(Math.max(0, gap - 120 - (Date.now() - t0)));
        const egg = await p.evaluate(scope => { const e = document.querySelector(scope + ' .diet-vegi-note .diet-add[data-v="egg"]'); if (!e) return null; const q = e.getBoundingClientRect(); return {x: (q.left + q.right) / 2, y: (q.top + q.bottom) / 2}; }, scope);
        const tag = `${lg} ${w} ${where} ${gap}ms`;
        if (!egg){ bad.push(`${tag}: 「卵も外す」が出ない`); await ctx.close(); continue; }
        await p.waitForTimeout(Math.max(0, gap - (Date.now() - t0)));
        const at = Date.now() - t0;
        await p.mouse.click(egg.x, egg.y); await p.waitForTimeout(120);
        const z = await p.evaluate(where => ({av: (where === 'settings' ? S.settings.avoid : S.family[0].avoid).slice(), tip: !!document.querySelector('.tap-again'), tab}), where);
        n++;
        if (z.tab !== 'settings') bad.push(`${tag}: 画面が移った`);
        else if (gap === 800 && !z.av.includes('@egg')) bad.push(`${tag}: ${at}ms で押した「卵も外す」が受けられない（tip=${z.tip}）`);
        else if (gap === 250 && (z.av.includes('@egg') || !z.tip)) bad.push(`${tag}: 出てすぐ（${at}ms）の「卵も外す」を受けた・「もう一度」が出ない`);
        await ctx.close();
    }
    ok(n > 0 && bad.length === 0, `C3 R236 ${LANGS.length}言語 × 幅195・320・390 × 設定・家族の人: 0.8 秒の「卵も外す」は受け、0.25 秒の押しは受けない（${n}回）: ` + bad.slice(0, 8).join(' | '));
}

// ---- C4 R237 ----
{
    const bad = []; let tallN = 0, fitN = 0;
    const UP = {de: /oben/, en: /above/, fr: /ci-dessus/, ja: /上のボタン/, ar: /أعلاه/};
    for (const lg of ['de', 'en', 'fr', 'ja', 'ar']) for (const [w, h] of WIDTHS) for (const where of ['settings', 'family']){
        const {p, ctx} = await open(lg, w, h);
        const sel = where === 'settings' ? '#view [data-act="toggle-avoid-diet"][data-v="vegi"]' : '[data-fm="f1"] [data-act="fam-avoid-diet"][data-v="vegi"]';
        const scope = where === 'settings' ? '#view' : '[data-fm="f1"]';
        await p.evaluate(async where => { setTab('settings'); setTabShow(where === 'settings' ? 'food' : 'family'); if (where === 'family'){ session.famOpen = 'f1'; render(); } await new Promise(r => setTimeout(r, 200)); }, where);
        const c = await p.evaluate(sel => { const e = document.querySelector(sel); const nav = document.querySelector('nav.tabs').getBoundingClientRect(); const q = e.getBoundingClientRect(); window.scrollBy(0, q.bottom - (nav.top - 6)); const r = e.getBoundingClientRect(); return {x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2}; }, sel);
        await p.waitForTimeout(150);
        await p.mouse.click(c.x, c.y); await p.waitForTimeout(900);
        const st = await p.evaluate(scope => {
            const n = document.querySelector(scope + ' .diet-vegi-note'); if (!n) return null;
            let floor = innerHeight, ceil = 0;
            document.querySelectorAll('nav.tabs').forEach(e => { const q = e.getBoundingClientRect(); if (q.height && q.top < floor) floor = q.top; });
            document.querySelectorAll('.set-tabs-bar').forEach(e => { const q = e.getBoundingClientRect(); if (q.height && q.top <= 1 && q.bottom > ceil) ceil = q.bottom; });
            const r = n.getBoundingClientRect(), pr = n.querySelector('p').getBoundingClientRect(), ch = n.querySelector('.chips').getBoundingClientRect();
            const btn = [...n.querySelectorAll('.diet-add')].map(e => { const q = e.getBoundingClientRect(), hit = document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2); return {top: q.top, bottom: q.bottom, hits: !!hit && e.contains(hit)}; });
            return {top: r.top, bottom: r.bottom, h: r.height, room: floor - ceil - 8, floor, ceil, tall: n.classList.contains('tall'), pTop: pr.top, chBottom: ch.bottom, chTop: ch.top, pBottom: pr.bottom, text: n.querySelector('p').textContent, btn};
        }, scope);
        const tag = `${lg} ${w} ${where}`;
        if (!st){ bad.push(`${tag}: 一言が出ない`); await ctx.close(); continue; }
        const upText = await p.evaluate(() => [t('卵・乳製品を使う料理は出ます。食べないときは、上のボタンで外せます'), t('卵・乳製品を使う料理は出ます。食べないときは、下のボタンで外せます')]);
        if (st.h > st.room){ tallN++;
            if (!st.tall) bad.push(`${tag}: 入りきらない（${Math.round(st.h)}>${Math.round(st.room)}）のにボタンが上に来ない`);
            if (st.chBottom > st.pTop + 0.5) bad.push(`${tag}: ボタンが一言の文より上にない`);
            if (st.top < st.ceil - 0.5) bad.push(`${tag}: 一言の頭が上の帯に隠れる top=${Math.round(st.top)} ceil=${Math.round(st.ceil)}`);
            if (st.pTop + 20 > st.floor) bad.push(`${tag}: 文の書き出しが見えない`);
            if (st.text !== upText[0] || !UP[lg].test(st.text)) bad.push(`${tag}: 文が「上のボタン」になっていない: ${st.text}`);
        } else { fitN++;
            if (st.tall) bad.push(`${tag}: 入りきるのにボタンが上`);
            if (st.pBottom > st.chTop + 0.5) bad.push(`${tag}: 入りきるのに文が下`);
            if (st.text !== upText[1]) bad.push(`${tag}: 入りきるときの文が「下のボタン」でない: ${st.text}`);
            if (st.top < st.ceil - 0.5 || st.bottom > st.floor + 0.5) bad.push(`${tag}: 入りきるのに帯・下のタブにかかる`);
        }
        st.btn.forEach((x, i) => { if (!x.hits || x.top < st.ceil - 0.5 || x.bottom > st.floor + 0.5) bad.push(`${tag}: ボタン${i + 1}が隠れる・押せない`); });
        // 描き直しても同じ形・同じ文
        const again = await p.evaluate(async scope => { render(); await new Promise(r => setTimeout(r, 100)); const n = document.querySelector(scope + ' .diet-vegi-note'); return n ? {tall: n.classList.contains('tall'), text: n.querySelector('p').textContent} : null; }, scope);
        if (!again || again.tall !== st.tall || again.text !== st.text) bad.push(`${tag}: 描き直すと形・文が変わる ${JSON.stringify(again)}`);
        await ctx.close();
    }
    ok(tallN > 0 && fitN > 0 && bad.length === 0, `C4 R237 5言語 × 幅195・320・390 × 設定・家族の人: 入りきらないとき（${tallN}回）はボタンが上・一言の頭が見え・文は「上のボタン」。入りきるとき（${fitN}回）はこれまでどおり: ` + bad.slice(0, 8).join(' | '));
}

// ---- C5 R237 の訳 ----
{
    const {p, ctx} = await open('ja', 390, 844);
    const bad = await p.evaluate(async all => {
        const out = [], K = '卵・乳製品を使う料理は出ます。食べないときは、上のボタンで外せます', K0 = K.replace('上のボタン', '下のボタン');
        for (const lg of all.filter(x => x !== 'ja')){
            const d = I18N[lg] || (await new Promise(r => { const s = document.createElement('script'); s.src = 'i18n/' + lg + '.js'; s.onload = () => r(I18N[lg]); s.onerror = () => r(null); document.head.appendChild(s); }));
            if (!d || typeof d[K] !== 'string' || !d[K].trim()) out.push(lg + ': 訳がない');
            else if (/[ぁ-ん]/.test(d[K]) || d[K] === d[K0]) out.push(lg + ': 訳が日本語のまま・「下」と同じ');
        }
        return out;
    }, ALL);
    ok(bad.length === 0, `C5 R237 ${ALL.length}言語: 「上のボタンで外せます」の訳がある: ` + bad.join(' / '));
    await ctx.close();
}

// ---- C6 R238 ----
{
    const bad = [], got = [];
    for (const [lg, q] of [['en', 'curry'], ['ja', 'カレー'], ['de', 'Curry']]){
        const {p, ctx} = await open(lg, 390, 844);
        await p.evaluate(() => { S.settings.avoid = ['@pork', '@chicken', '@beef', '@fish', '@shellfish', '@egg', '@dairy']; save(); });
        await ctx.route(/\/packs\/(?!i18n)[a-z]{2}\.js/, async r => { await new Promise(res => setTimeout(res, 5000)); await r.continue(); });
        await p.click('nav.tabs button[data-tab="name"]');
        await p.waitForFunction(() => tab === 'name' && document.querySelector('#ns-input'), null, {timeout: 30000});
        await p.fill('#ns-input', q); await p.press('#ns-input', 'Enter'); await p.waitForTimeout(3800);
        const r = await p.evaluate(() => { const w = document.querySelector('#ns-results [data-tier="world"] .ns-wstat'); if (!w) return null; const s = w.querySelector('.ns-still');
            if (!s) return {two: false, text: w.textContent, wc: document.querySelectorAll('#ns-results [data-tier="world"] .dcard').length, loading: nsLoading};
            const first = document.createRange(); first.setStart(w.firstChild, 0); first.setEnd(w.firstChild, w.firstChild.length || 0);
            const a = first.getBoundingClientRect(), z = s.getBoundingClientRect();
            return {two: true, block: getComputedStyle(s).display, below: z.top >= a.bottom - 0.5, text: w.innerText}; });
        const tag = `${lg} ${q}`;
        if (!r) bad.push(`${tag}: 2段目の1行がない`);
        else if (r.two){ got.push(lg); if (r.block !== 'block' || !r.below || !/\n/.test(r.text)) bad.push(`${tag}: 2つの文が同じ行に続く ${JSON.stringify(r)}`); }
        else if (/still loading|読みこみ中の国|noch/i.test(r.text)) bad.push(`${tag}: 読みこみ中の文が .ns-still の外にある ${JSON.stringify(r)}`);
        else console.log('C6', tag, '2段目だけが空の形にならなかった', JSON.stringify(r));
        await ctx.close();
    }
    ok(got.includes('en') && bad.length === 0, `C6 R238 料理名から（${got.join('・')}）: 「似た料理は見つかりませんでした」と「まだ読みこみ中の国があります」は別の行: ` + bad.join(' | '));
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
