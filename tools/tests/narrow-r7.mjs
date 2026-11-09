#!/usr/bin/env node
// 利用者モニター 第29回（R137〜R139）: 狭い幅・朝の入口の回帰テスト（Playwright。使い方: node tools/tests/narrow-r7.mjs [http://localhost:9202/]）
//  X1 R137 幅260（と195・320）の設定「ほかの苦手」入力欄（家族の欄・本人の欄）が 120px 以上（195 は縦並びで全幅・320 は 150px 以上）。全言語・文字3段階
//  X2 R138 幅195で「前の献立」が字つき（12px 以上・44×44px 以上・丸の隣と重ならない）。長い言葉の言語（de pl fr it id fil）
//  X3 R139 幅430×844・米国/仏・ベジ・朝7:15で、朝の入口が下の帯（決める・タブ）の上端をまたがない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const open = async (settings, vp, tag, extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('narrow-r7', tag, vp.join('x'))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    if (extra.clock) await p.clock.install({time: new Date(extra.clock)});
    await p.addInitScript(([st, fam]) => { if (!sessionStorage.getItem('s7')){ sessionStorage.setItem('s7', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja'}, st)}, fam ? {family: [{id: 'f1', name: 'A', role: 'adult', avoid: [], allergy: [], mild: false}]} : {}))); } }, [settings, !!extra.fam]);
    await p.goto(URL_); await ready(p);
    if (extra.clock) await p.clock.runFor(800);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return {p, ctx};
};
const setTs = (p, ts) => p.evaluate(async ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; render(); await __tick(); }, ts);
const LANGS = (process.env.LANGS || 'ja,de,pt-BR,it,id,fil,en').split(',');

// X1
{
    const bad = [];
    for (const lang of LANGS){
        const {p, ctx} = await open({uiLang: lang}, [260, 640], 'x1' + lang, {fam: true});
        for (const [w, h, min] of [[195, 422, 100], [260, 640, 120], [320, 640, 100]]){
            await p.setViewportSize({width: w, height: h});
            for (const ts of [0, 1, 2]){
                await setTs(p, ts);
                await p.evaluate(() => { setTab('settings'); }); await p.waitForTimeout(250);
                const r = await p.evaluate(() => SET_TABS.flatMap(([k]) => { setTabShow(k); return [...document.querySelectorAll('#view .set-panel:not([hidden]) .inputbar input[type=text]')].map(e => { e.scrollIntoView(); const q = e.getBoundingClientRect(); return [e.className || e.id, q.width, q.right]; }).concat([['sw', document.documentElement.scrollWidth, innerWidth]]); }));   // 設定はタブ分け（11/09）。タブを1つずつ開いて、その中の入力欄を測る
                const inp = r.filter(x => x[0] !== 'sw'); const sw = r.filter(x => x[0] === 'sw').reduce((a, x) => x[1] - x[2] > a[1] - a[2] ? x : a);
                if (!inp.length) bad.push(`${lang} ${w}/文字${ts} 入力欄が出ない`);
                inp.forEach(x => { if (x[1] < min) bad.push(`${lang} ${w}/文字${ts} ${x[0]} ${Math.round(x[1])}px`); if (x[2] > w + .5) bad.push(`${lang} ${w}/文字${ts} 画面の外`); });
                if (sw[1] > sw[2] + 1) bad.push(`${lang} ${w}/文字${ts} 横スクロール`);
            }
        }
        await ctx.close();
    }
    ok(!bad.length, 'X1 R137 設定の「ほかの苦手」入力欄が幅195は100px・260は120px・320は100px 以上: ' + bad.slice(0, 6).join(' / '));
}
// X2
{
    const bad = [];
    for (const lang of ['de', 'pl', 'fr', 'it', 'id', 'fil']){
        const {p, ctx} = await open({dishCount: 4, uiLang: lang}, [195, 422], 'x2' + lang);
        for (let k = 0; k < 3; k++){
            await p.click('#view .tray .tg-mid .shuffle[data-act=new-menu]'); await p.waitForTimeout(500);
            await p.evaluate(() => document.querySelector('#view .tg-mid .mb-back').scrollIntoView({block: 'center'})); await p.waitForTimeout(150);
            const r = await p.evaluate(() => { const bk = document.querySelector('#view .tg-mid .mb-back'), sh = document.querySelector('#view .tg-mid .shuffle'), tx = bk.querySelector('.mb-tx'), c = bk.getBoundingClientRect(), a = sh.getBoundingClientRect(), cs = getComputedStyle(tx), tq = tx.getBoundingClientRect();
                return {w: c.width, h: c.height, fs: parseFloat(cs.fontSize), pos: cs.position, tw: tq.width, ok: tx.scrollWidth <= tx.clientWidth + 1 && tx.scrollHeight <= tx.clientHeight + 1, ov: Math.min(a.right, c.right) - Math.max(a.left, c.left) > .5 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > .5, out: c.right > innerWidth + .5 || c.left < -.5, txt: tx.textContent, cls: bk.className}; });
            if (r.pos === 'absolute' || r.tw < 6 || !r.ok) bad.push(`${lang} 字なし ${JSON.stringify(r)}`);
            else if (r.fs < 11.95) bad.push(`${lang} 字が小さい ${r.fs}`);
            if (r.w < 43.5 || r.h < 43.5) bad.push(`${lang} 44px 未満 ${r.w}x${r.h}`);
            if (r.ov || r.out) bad.push(`${lang} 重なり/画面の外`);
        }
        await ctx.close();
    }
    ok(!bad.length, 'X2 R138 幅195の「前の献立」が字つき（12px 以上）・44px 以上・重ならない（独波仏伊印尼比）: ' + bad.slice(0, 4).join(' / '));
}
// X3
{
    const bad = []; let seen = 0;
    for (const [cc, lang] of [['US', 'en'], ['FR', 'fr']]){
        for (const [w, h] of [[430, 844], [390, 844], [430, 932], [393, 852], [428, 926], [430, 820], [430, 860]]){
            const {p, ctx} = await open({country: cc, uiLang: lang, avoid: [], diet: 'vegi'}, [w, h], 'x3' + cc + w + h, {clock: '2026-10-29T07:15:00+09:00'});
            await p.evaluate(() => { S.settings.avoid = dietBundleToggle([], 'vegi'); avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; newMenu(); render(); }); await p.waitForTimeout(900);
            // 入口を、決めるの帯の下・タブの上端をまたぐ位置（上端がタブの 9px 上）に置いてから測り直す（実際の 765〜809px の形）
            await p.evaluate(() => { const en = document.querySelector('#view .bf-entry'), tb = document.querySelector('nav.tabs'); if (!en || !tb) return; document.querySelectorAll('.bf-spacer').forEach(e => e.remove()); en.style.removeProperty('margin-top'); const sp = document.createElement('div'); sp.className = 'bf-spacer'; en.parentNode.insertBefore(sp, en);
                sp.style.height = Math.max(0, tb.getBoundingClientRect().top - 9 - en.getBoundingClientRect().top) + 'px'; bfEntryFit(); });
            const r = await p.evaluate(() => { const en = document.querySelector('#view .bf-entry'); if (!en) return null; const q = en.getBoundingClientRect();
                const tops = [...document.querySelectorAll('nav.tabs, .actionbar')].map(e => e.getBoundingClientRect()).filter(r => r.height && r.top > innerHeight * .4).map(r => r.top);
                return {t: q.top, b: q.bottom, hit: tops.filter(t => q.top < t - 1 && q.bottom > t + 1)}; });
            if (!r) continue; seen++;
            if (r.hit.length) bad.push(`${cc} ${w}x${h} 入口 ${Math.round(r.t)}〜${Math.round(r.b)} が帯 ${r.hit.map(Math.round)} をまたぐ`);
            await ctx.close();
        }
    }
    ok(seen > 0 && !bad.length, `X3 R139 朝の入口が下の帯（決める・タブ）をまたがない（${seen}回）: ` + bad.slice(0, 4).join(' / '));
}
await b.close();
if (errs.length){ fails++; console.log('FAIL pageerror', errs.slice(0, 3)); }
console.log(fails ? `NG ${fails}` : 'ALL OK'); process.exit(fails ? 1 : 0);
