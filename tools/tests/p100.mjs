#!/usr/bin/env node
// 100人の最終チェック（11/23・scratchpad/final/panel100.md）の、デザインを変えない小さな直しの確かめ
//  使い方: node tools/tests/p100.mjs [http://localhost:9331/]   （ONLY=S,U,K,N,B でしぼる）
//  S（3位）日本の献立を、日本の料理の訳がない言葉（pt-BR・es・fil・id・zh-Hans・ar）で見ると、今日の買い物メモの材料名・調味料の名前に日本語の名前（lang="ja"）が小さく添えてあり、
//     料理名のあとに（日本語の名前）。1週間の買い物メモ・家にあるかもも同じ（もうひとつの名前の設定を切っていても）。日本語の画面には添えない。献立・材料は変わらない
//     第58回（11/23・統括の決め）: 訳のある言葉（en・ko・th・vi）でも材料名・調味料に日本語の名前を添える（店の日本語の札と見くらべる）。料理名の日本語は訳のない言葉だけ
//  S2（第58回）英語の画面・日本の献立で「Cabbage キャベツ」。日本以外の国の献立（US・英語、KR・韓国語）には日本語の名前を出さない
//  U（4位）同じ画面で、分量の単位（block・head・bunch など）が英語のまま出ない: 訳のある言葉は単位をその言葉に（1/2 bloque・1/2 모）。ar・hi・pl・tr も（第58回の提案 11/23。1/2 قالب・1/2 ब्लॉक・1/2 kostki・1/2 kalıp。前は英語のあとに日本語の単位）。
//     料理の詳しい画面の材料の分量も同じ。英語・日本語の画面は今までどおり
//  K（6位）お膳の角の丸の「かえる」の字: 文字の大きさ「大きい」「もっと大きい」で字が大きくなる（ja: 10 → 11.5 → 13px）。丸は 44×44 のまま、字は丸のふちの内側
//  N（11位）日本語の「{n}つ」: 10 以上は「個」（買う物 11個・調味料 13個）。1〜9 は「つ」のまま。17言語で「つ」が出ず、数が入る（other の形に {n}。アラビア語の「1つ」などは数を字で書く）。ヒンディー語の「買う物」は1つのときの形がある
//  B（13位・14位ほか）44px より小さいボタン: 「食べたいもの」は高さ 44px 以上で、お膳の位置は前（36px）と同じ。はじめの画面の文字の大きさ（A / A+ / A++）は 44×44 以上（195・320・390px × 文字0〜2）。
//     「ほかの食材に置き換えて…」（avoid-swap）は、押せる所（ラベル）が高さ 44px 以上で、ラベルを押すと切りかわる
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const b = await chromium.launch(LAUNCH);
const open = async (o = {}) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: o.h || 844}, serviceWorkers: 'block', isMobile: true, hasTouch: true});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    if (!o.fresh) await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        {onboarded: true, firstUse: '2026-11-01', settings: Object.assign({country: 'JP', uiLang: o.lang || 'ja', dishCount: 3, servings: 2}, o.ts ? {textSize: o.ts} : {})});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push((o.lang || '') + ': ' + e.message));
    await p.goto(URL_);
    if (o.fresh) await p.waitForSelector('#sheet-root [data-act=cc-choose]', {timeout: 30000});
    else await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, {timeout: 30000});
    return {p, ctx};
};
// 今日の買い物メモ（肉じゃが・豆腐とわかめの味噌汁を決めた日）と、1週間の買い物メモの行、料理の詳しい画面の材料の分量
const shopOf = p => p.evaluate(async () => {
    const tick = (n = 250) => new Promise(r => setTimeout(r, n)), ids = ['nikujaga', 'misoshiru'];
    const menu0 = JSON.stringify(ids.map(id => byId(id).items.map(i => i.key)));
    S.cook = {d: TODAY, ids, slots: ids.map(id => byId(id).type || '主菜'), done: {}, adj: true, salt: 0}; save(); gotoStage('shop'); await tick();
    const rows = [...document.querySelectorAll('.stage-shop .buy-row')].filter(x => x.querySelector('.br-nm')).map(x => {
        const alt = x.querySelector('.br-alt bdi'), sub = [...x.querySelectorAll('.br-nm small:not(.br-alt):not(.alg-tag)')].map(e => e.textContent).join(' '), q = x.querySelector('.br-q');
        return {nm: x.querySelector('.br-nm b').textContent.trim(), alt: alt ? alt.textContent : '', altLang: alt ? alt.getAttribute('lang') : null, sub, q: q ? q.textContent.trim() : ''}; });
    // 1週間の買い物メモ（同じ料理を1日目に）
    let ph = '';
    const wl = (() => { const old = S.week; S.week = {start: TODAY, days: [{d: TODAY, id: 'misoshiru'}]}; let h = ''; try{ h = shopRowsHtml(shoppingList(), new Set()); ph = pantryHtml(); }catch(e){ h = 'ERR ' + e.message; } S.week = old; return h; })();
    const pdiv = document.createElement('div'); pdiv.innerHTML = ph;
    const pantry = [...pdiv.querySelectorAll('.shop-row')].map(x => ({nm: (x.querySelector('.nm') || {}).textContent || '', alt: (x.querySelector('.alt') || {}).textContent || '', altLang: x.querySelector('.alt') ? x.querySelector('.alt').getAttribute('lang') : null}));
    const div = document.createElement('div'); div.innerHTML = wl;
    const week = [...div.querySelectorAll('.shop-row')].map(x => ({nm: (x.querySelector('.nm') || {}).textContent || '', alt: (x.querySelector('.alt') || {}).textContent || '', altLang: x.querySelector('.alt') ? x.querySelector('.alt').getAttribute('lang') : null, q: (x.querySelector('.q') || {}).textContent || '', f: (x.querySelector('.for') || {}).textContent || ''}));
    S.cook = null; save(); setTab('today'); await tick(100);
    openModal('misoshiru'); await tick(); const rq = [...document.querySelectorAll('#modal-root .recipe-ings .q')].map(e => e.textContent.trim()); closeModal(); await tick(100);
    return {rows, week, pantry, rq, same: menu0 === JSON.stringify(ids.map(id => byId(id).items.map(i => i.key))), nikujaga: byId('nikujaga').nameEn || byId('nikujaga').name};
});
const U4 = {ar: '1/2 قالب', hi: '1/2 ब्लॉक', pl: '1/2 kostki', tr: '1/2 kalıp'};   // 第58回の提案: 4言語の豆腐 1/2丁
const EN_UNIT = /\b(block|blocks|head|heads|bunch|bunches|slices?|packs?|bowls?|knob|fillets?|tbsp|tsp|go)\b/i;

if (want('S') || want('U')){
    const badS = [], badU = [];
    for (const lang of ['pt-BR', 'es', 'fil', 'id', 'zh-Hans', 'ar', 'hi', 'pl', 'tr', 'ko', 'th', 'vi', 'ja', 'en']){
        const {p, ctx} = await open({lang});
        const r = await shopOf(p);
        const noTr = ['pt-BR', 'es', 'fil', 'id', 'zh-Hans', 'ar', 'hi', 'pl', 'tr'].includes(lang), jpRe = /[ぁ-んァ-ヶ一-龠]/;
        const tofu = r.rows.find(x => /tofu|豆腐|두부|เต้าหู้|đậu|tahu|توفو/i.test(x.nm + x.alt)) || {};
        if (!r.rows.length || !r.same) badS.push(`${lang} 行がない・材料が変わった ${JSON.stringify(r).slice(0, 200)}`);
        // 第58回（11/23・統括の決め）: 日本語以外の画面なら、訳のある言葉（en・ko・th・vi）でも材料名・調味料に日本語の名前を添える。料理名の日本語は訳のない言葉だけ
        if (lang !== 'ja'){
            if (!r.rows.every(x => x.alt && jpRe.test(x.alt) && x.altLang === 'ja')) badS.push(`${lang} 今日: 日本語の名前がない行 ${JSON.stringify(r.rows.filter(x => !x.alt || !jpRe.test(x.alt)).slice(0, 2))}`);
            if (!r.week.length || !r.week.every(x => x.alt && jpRe.test(x.alt) && x.altLang === 'ja')) badS.push(`${lang} 1週間: 日本語の名前がない ${JSON.stringify(r.week.slice(0, 2))}`);
            if (!r.pantry.length || !r.pantry.every(x => x.alt && jpRe.test(x.alt) && x.altLang === 'ja')) badS.push(`${lang} 家にあるかも: 日本語の名前がない ${JSON.stringify(r.pantry.slice(0, 3))}`);
            if (noTr !== r.rows.some(x => x.sub.includes('（肉じゃが）'))) badS.push(`${lang} 今日: 料理名のあとの（肉じゃが）が${noTr ? 'ない' : '訳のある言葉なのに出る'} ${JSON.stringify(r.rows.map(x => x.sub).slice(0, 2))}`);
            if (noTr && !r.week.some(x => x.f.includes('（豆腐とわかめの味噌汁）'))) badS.push(`${lang} 1週間: 料理名のあとに（豆腐とわかめの味噌汁）がない`);
        } else if (r.rows.some(x => x.alt) || r.week.some(x => x.alt) || r.pantry.some(x => x.alt)) badS.push(`ja 日本語の画面なのに名前を添えた ${JSON.stringify([r.rows[0], r.week[0], r.pantry[0]])}`);
        // 単位
        const qs = [...r.rows.map(x => x.q), ...r.week.map(x => x.q), ...r.rq];
        if (lang === 'en'){ if (!/\bblock\b/.test(tofu.q)) badU.push(`en 英語の単位が変わった ${tofu.q}`); }
        else if (lang === 'ja'){ if (!/丁/.test(tofu.q)) badU.push(`ja 日本語の単位が変わった ${tofu.q}`); }
        else if (U4[lang]){   // 第58回の提案（11/23）: ar・hi・pl・tr も単位をその言葉に（英語のあとに日本語の単位を添える形はやめた）。豆腐 1/2丁 → その言葉の形
            const left = qs.filter(q => EN_UNIT.test(q) || /（[^）]*）/.test(q));
            if (left.length || tofu.q !== U4[lang] || !r.rq.includes(U4[lang])) badU.push(`${lang} 英語の単位・日本語の単位が残る、または豆腐の形がちがう ${JSON.stringify(left)} 豆腐 ${tofu.q}（${U4[lang]}） 詳しい画面 ${JSON.stringify(r.rq)}`); }
        else { const left = qs.filter(q => EN_UNIT.test(q.replace(/（[^）]*）/g, ''))); if (left.length || !tofu.q || /block/.test(tofu.q)) badU.push(`${lang} 英語の単位が残る ${JSON.stringify(left)} 豆腐 ${tofu.q}`); }
        await ctx.close();
    }
    if (want('S')) ok(!badS.length, 'S 日本の献立の買い物メモ（今日・1週間・家にあるかも）に、日本語以外の画面なら日本語の名前を添える（料理名の日本語は訳のない言葉だけ）。日本語の画面には添えない。材料は変わらない: ' + badS.join(' || '));
    if (want('U')) ok(!badU.length, 'U 分量の単位が英語のまま出ない（その言葉の単位。ar・hi・pl・tr も第58回の提案でその言葉に。英語・日本語は今までどおり）: ' + badU.join(' || '));
}

// U2（11/23・統括の決め 案A）: 食材そのものを数える単位（キャベツの head など）は、日本語・英語以外の画面では単位を出さず数だけ（キャベツ 1/4）。
//    油揚げは英語の元の訳を sheet → piece に（案C）。英語は「1/4 head」・日本語は「1/4個」のまま
// U3 同じ行の並び: アラビア語（右から左）とヒンディー語で、名前と「1/4」が重ならず、行の中に見えて、数は切れない（今日の買い物メモ・1週間の買い物メモ。幅 390・320）
if (want('U')){
    const bad = [], bad3 = [];
    for (const lang of ['pt-BR', 'es', 'ar', 'hi', 'pl', 'tr', 'ko', 'vi', 'zh-Hans', 'en', 'ja']) for (const w of (['ar', 'hi'].includes(lang) ? [390, 320] : [390])){
        const {p, ctx} = await open({lang, w, h: w === 320 ? 640 : 844});
        const r = await p.evaluate(async () => {
            const tick = (n = 300) => new Promise(r => setTimeout(r, n)), ids = ['butacabbage', 'daikonmiso'];
            S.cook = {d: TODAY, ids, slots: ids.map(id => byId(id).type || '主菜'), done: {}, adj: true, salt: 0}; save(); gotoStage('shop'); await tick();
            const box = e => { const q = e.getBoundingClientRect(); return {l: q.left, r: q.right, t: q.top, b: q.bottom}; };
            const rowOf = x => { const nm = x.querySelector('.br-nm b'), q = x.querySelector('.br-q bdi') || x.querySelector('.br-q'); return {key: x.querySelector('[data-k]') ? x.querySelector('[data-k]').dataset.k : '', nm: nm ? nm.textContent.trim() : '', q: q ? q.textContent.trim() : '', nb: nm && box(nm), qb: q && box(q), row: box(x), qcut: q ? q.scrollWidth > q.clientWidth + 1 : false}; };
            const rows = [...document.querySelectorAll('.stage-shop .buy-row')].filter(x => x.querySelector('.br-nm')).map(rowOf);
            const old = S.week; S.week = {start: TODAY, days: [{d: TODAY, id: 'butacabbage'}]}; const holder = document.createElement('div'); holder.className = 'list shop'; holder.innerHTML = shopRowsHtml(shoppingList(), new Set()); S.week = old;
            document.querySelector('#view').appendChild(holder); await tick(100);
            const week = [...holder.querySelectorAll('.shop-row')].map(x => { const nm = x.querySelector('.nm'), q = x.querySelector('.q'); return {nm: nm.textContent.trim(), q: q.textContent.trim(), nb: box(nm.firstChild && nm.firstChild.nodeType === 3 ? (() => { const g = document.createRange(); g.selectNodeContents(nm.firstChild); return g; })() : nm), qb: box(q), row: box(x)}; });
            holder.remove();
            return {rows, week, dir: document.documentElement.dir || getComputedStyle(document.body).direction};
        });
        const cab = r.rows.find(x => /^キャベツ$|cabbage|repollo|repolho|kapust|lahana|ملفوف|كرنب|पत्ता\s*गोभी|गोभी|양배추|bắp cải|卷心菜|圆白菜|包菜|甘蓝/i.test(x.nm)) || r.rows.find(x => /キャベツ/.test(x.key)), abu = r.rows.find(x => /油揚げ/.test(x.key));
        const want1 = lang === 'en' ? '1/4 head' : lang === 'ja' ? '1個' : '1/4';   // 日本語は今までどおり買う数（1個。下に「1/4個使う」）
        if (w === 390){
            if (!cab || cab.q !== want1) bad.push(`${lang} キャベツ ${cab ? cab.q : 'なし'}（${want1}） ${JSON.stringify(r.rows.map(x => x.key + ':' + x.q))}`);
            if (lang === 'en' && (!abu || abu.q !== '1/2 piece')) bad.push(`en 油揚げ ${abu && abu.q}（1/2 piece）`);
            if (lang === 'ja' && (!abu || !/枚/.test(abu.q))) bad.push(`ja 油揚げ ${abu && abu.q}（枚のまま）`);
            if (!['en', 'ja'].includes(lang) && (!abu || /sheet|hoja|folha|feuille|Blatt|foglio|arkusz|yaprak|ورقة|शीट|장|tờ|张/i.test(abu.q))) bad.push(`${lang} 油揚げが紙の1枚の言い方 ${abu && abu.q}`);
        }
        if (['ar', 'hi'].includes(lang)){
            const rtl = lang === 'ar';
            const chk = (x, where) => { if (!x || !x.qb || !x.nb || !x.q) return;
                const over = Math.min(x.nb.r, x.qb.r) - Math.max(x.nb.l, x.qb.l) > 1 && Math.min(x.nb.b, x.qb.b) - Math.max(x.nb.t, x.qb.t) > 1;
                const inRow = x.qb.l >= x.row.l - .5 && x.qb.r <= x.row.r + .5 && x.nb.l >= x.row.l - .5 && x.nb.r <= x.row.r + .5;
                const side = rtl ? x.qb.r <= x.nb.l + 1 || x.qb.t >= x.nb.b - 1 : x.qb.l >= x.nb.r - 1 || x.qb.t >= x.nb.b - 1;   // 右から左では数が名前の左（または下の行）
                if (over || !inRow || !side || x.qcut) bad3.push(`${lang} ${w} ${where} ${x.nm} 「${x.q}」 重なり${over} 行の外${!inRow} 向き${!side} 切れ${x.qcut}`); };
            [cab].forEach(x => chk(x, '今日'));
            const wc = r.week.find(x => x.q === '1/4'); if (!wc) bad3.push(`${lang} ${w} 1週間: 「1/4」の行がない ${JSON.stringify(r.week.map(x => x.q))}`); else chk(wc, '1週間');
            if (lang === 'ar' && r.dir !== 'rtl') bad3.push('ar 右から左になっていない ' + r.dir);
        }
        await ctx.close();
    }
    ok(!bad.length, 'U2 キャベツなど食材そのものを数える単位は、日本語・英語以外では数だけ（1/4）。油揚げは英語で piece・ほかの言葉で紙の1枚の言い方にしない。英語・日本語は今までどおり: ' + bad.join(' || '));
    ok(!bad3.length, 'U3 アラビア語（右から左）・ヒンディー語で、名前と数だけ（1/4）の並びが崩れない（重ならない・行の中・数は名前の先の側・切れない。今日・1週間 × 390・320）: ' + bad3.join(' || '));
}

// S2（第58回）英語の画面・日本の献立: 「Cabbage キャベツ」のように日本語の名前が出る。日本以外の国の献立（アメリカ・英語、韓国・韓国語）では日本語の名前を出さない
if (want('S')){
    const bad = [];
    for (const [cc, lang, ids] of [['JP', 'en', ['tonkatsu']], ['US', 'en', null], ['KR', 'ko', null]]){
        const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
        await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
        await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, {onboarded: true, firstUse: '2026-11-01', settings: {country: cc, uiLang: lang, dishCount: 3, servings: 2}});
        const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message)); await p.goto(URL_);
        await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, {timeout: 30000});
        const r = await p.evaluate(async ids => {
            const tick = (n = 300) => new Promise(r => setTimeout(r, n)); ids = ids || menuIds();
            S.cook = {d: TODAY, ids, slots: ids.map(id => byId(id).type || '主菜'), done: {}, adj: true, salt: 0}; save(); gotoStage('shop'); await tick();
            const rows = [...document.querySelectorAll('.stage-shop .buy-row')].filter(x => x.querySelector('.br-nm')).map(x => ({nm: x.querySelector('.br-nm b').textContent.trim(), alt: (x.querySelector('.br-alt') || {}).textContent || ''}));
            const old = S.week; S.week = {start: TODAY, days: [{d: TODAY, id: ids[0]}]}; const d = document.createElement('div'); d.innerHTML = shopRowsHtml(shoppingList(), new Set()) + pantryHtml(); S.week = old;
            return {ids, pack: ids.map(id => byId(id).pack || ''), rows, other: [...d.querySelectorAll('.alt')].map(e => e.textContent)};
        }, ids);
        const jpRe = /[ぁ-んァ-ヶ一-龠]/;
        if (cc === 'JP'){ const cab = r.rows.find(x => /^Cabbage/i.test(x.nm)); if (!cab || cab.alt !== 'キャベツ') bad.push(`JP en 「Cabbage キャベツ」にならない ${JSON.stringify(r.rows)}`); }
        else if (!r.rows.length || r.pack.some(x => !x) || r.rows.some(x => jpRe.test(x.alt)) || r.other.some(x => jpRe.test(x))) bad.push(`${cc} ${lang} 日本以外の国の献立に日本語の名前 ${JSON.stringify(r).slice(0, 300)}`);
        await ctx.close();
    }
    ok(!bad.length, 'S2 英語の画面・日本の献立は「Cabbage キャベツ」。日本以外の国の献立（US・KR）には日本語の名前を出さない: ' + bad.join(' || '));
}

if (want('K')){
    const bad = [];
    for (const lang of ['ja', 'ko', 'th', 'en', 'de']) for (const w of [360, 390]){
        const fs = {};
        for (const ts of [0, 1, 2]){
            const {p, ctx} = await open({lang, ts, w, h: w === 360 ? 740 : 844}); await p.waitForTimeout(300);
            const r = await p.evaluate(() => { const tr = document.querySelector('#view .tray'); return {tight: tr.classList.contains('tight'), sw: [...tr.querySelectorAll('.spot .swap[data-act=reroll]')].map(e => { const q = e.getBoundingClientRect(), s = e.querySelector('.sw-s'), sq = s.getBoundingClientRect(), cx = (q.left + q.right) / 2, cy = (q.top + q.bottom) / 2;
                const rg = document.createRange(); rg.selectNodeContents(e);
                return {word: e.classList.contains('sw-word') && getComputedStyle(s).display !== 'none', fs: parseFloat(getComputedStyle(e).fontSize), w: Math.round(q.width), h: Math.round(q.height), tw: Math.round(rg.getBoundingClientRect().width), cd: +Math.max(...[[sq.left, sq.top], [sq.right, sq.top], [sq.left, sq.bottom], [sq.right, sq.bottom]].map(([x, y]) => Math.hypot(x - cx, y - cy))).toFixed(1)}; })}; });
            await ctx.close();
            if (r.tight) continue;
            fs[ts] = Math.min(...r.sw.map(x => x.fs));
            // 標準（文字0）は今までどおり ↻ と字で、字の幅 32px 以内（panel-r18b R18-7）。大きいときは字だけで、字の四すみが丸のふちの内側（半径 19.5px）
            if (!r.sw.length || r.sw.some(x => !x.word || x.w !== 44 || x.h !== 44 || (ts ? x.cd > 19.5 : x.tw > 32))) bad.push(`${lang} ${w} 文字${ts} 丸・字 ${JSON.stringify(r.sw[0])}`);
        }
        if (fs[1] != null && !(fs[1] >= fs[0] && fs[2] >= fs[1])) bad.push(`${lang} ${w} 字が大きくならない ${JSON.stringify(fs)}`);
        if (lang === 'ja' && !(fs[0] === 10 && fs[1] === 11.5 && fs[2] === 13)) bad.push(`ja ${w} 字の大きさ ${JSON.stringify(fs)}（10 → 11.5 → 13）`);
    }
    ok(!bad.length, 'K 「かえる」の字が文字の大きさに合わせて大きくなる（丸は 44×44・字は丸のふちの内側）: ' + bad.join(' || '));
}

if (want('N')){
    const {p, ctx} = await open({lang: 'ja'});
    const r = await p.evaluate(() => ({a: t('買う物 {n}つ', {n: 11}), b: t('調味料 {n}つ', {n: 13}), c: t('買う物 {n}つ', {n: 3}), d: t('「{skill}」を習得しました。これで{n}つ目のコツです。', {skill: 'x', n: 12}), e: t('ほか{n}つの袋', {n: 10}), f: t('材料{n}つ', {n: 9})}));
    ok(r.a === '買う物 11個' && r.b === '調味料 13個' && r.c === '買う物 3つ' && r.d.includes('12個目') && r.e === 'ほか10個の袋' && r.f === '材料9つ', 'N1 日本語: 10 以上は「個」、1〜9 は「つ」: ' + JSON.stringify(r));
    await ctx.close();
    const bad = [], KEYS = ['買う物 {n}つ', '家にある {n}つ', '調味料 {n}つ', 'なくても作れる {n}つ', '材料{n}つ', 'ほか{n}つの袋', '{n}つ'];
    for (const f of fs.readdirSync(ROOT + '/i18n').filter(x => x.endsWith('.js'))){
        const lg = f.replace(/\.js$/, ''); let d = null; vm.runInNewContext(fs.readFileSync(ROOT + '/i18n/' + f, 'utf8'), {GOHAN_I18N: (l, o) => { d = o; }, window: {}});
        for (const k of KEYS){ const v = d[k]; if (v == null){ bad.push(`${lg} 「${k}」の訳がない`); continue; }
            const forms = typeof v === 'object' ? Object.values(v) : [v];
            if (forms.some(x => /つ/.test(x)) || !/\{n|#/.test(typeof v === 'object' ? v.other || '' : v)) bad.push(`${lg} 「${k}」${JSON.stringify(v)}`); }
        if (lg === 'hi' && !(typeof d['買う物 {n}つ'] === 'object' && d['買う物 {n}つ'].one && !/ें/.test(d['買う物 {n}つ'].one))) bad.push('hi 「買う物」の1つのときの形');
    }
    ok(!bad.length, 'N2 17言語の数え方: 「つ」が出ず、数が入る。ヒンディー語の「買う物」は1つのときの形がある: ' + bad.join(' / '));
}

if (want('B')){
    const bad = [];
    // 「食べたいもの」（家族のいない人のあいさつの横）: 高さ 44px 以上・お膳の位置は前と同じ
    for (const [w, h] of [[390, 844], [360, 740], [320, 568]]) for (const ts of [0, 2]){
        const {p, ctx} = await open({w, h, ts}); await p.waitForTimeout(300);
        const r = await p.evaluate(async () => { const e = document.querySelector('#view .req-btn.lite'); if (!e || !e.getClientRects().length) return {none: true};
            const q = e.getBoundingClientRect(), tray = () => Math.round(document.querySelector('#view .tray').getBoundingClientRect().top);
            const t1 = tray(); e.style.minHeight = '36px'; e.style.marginBlock = '0'; await new Promise(r => setTimeout(r, 50)); const t0 = tray(); e.style.minHeight = ''; e.style.marginBlock = '';
            return {h: Math.round(q.height), w: Math.round(q.width), t1, t0}; });
        if (!r.none && (r.h < 44 || r.t1 !== r.t0)) bad.push(`食べたいもの ${w} 文字${ts} ${JSON.stringify(r)}`);
        await ctx.close();
    }
    // はじめの画面の A / A+ / A++
    for (const [w, h] of [[195, 422], [320, 568], [390, 844]]){
        const {p, ctx} = await open({w, h, fresh: true});
        for (const ts of [0, 1, 2]){
            await p.evaluate(ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); }, ts); await p.waitForTimeout(150);
            const r = await p.evaluate(() => { const vw = document.documentElement.clientWidth; return [...document.querySelectorAll('#sheet-root [data-act=ob-ts]')].map(e => { const q = e.getBoundingClientRect(); return {w: Math.round(q.width), h: Math.round(q.height), in: q.left >= 0 && q.right <= vw + .5}; }); });
            if (r.length !== 3 || r.some(x => x.w < 44 || x.h < 44 || !x.in)) bad.push(`A/A+/A++ ${w} 文字${ts} ${JSON.stringify(r)}`);
        }
        await ctx.close();
    }
    // avoid-swap: ラベルが押せる所（高さ 44px 以上）で、ラベルを押すと切りかわる
    {
        const {p, ctx} = await open({});
        await p.evaluate(async () => { setTab('settings'); await new Promise(r => setTimeout(r, 50)); setTabShow('food'); await new Promise(r => setTimeout(r, 80)); document.querySelectorAll('#view details').forEach(d => d.open = true); await new Promise(r => setTimeout(r, 50)); });
        const sel = '#view input[data-act="avoid-swap"]';
        const r0 = await p.evaluate(sel => { const i = document.querySelector(sel); if (!i) return null; const l = i.closest('label'); l.scrollIntoView({block: 'center'}); const q = l.getBoundingClientRect(); return {h: Math.round(q.height), w: Math.round(q.width), on: i.checked}; }, sel);
        if (!r0) bad.push('avoid-swap がない');
        else {
            const lb = await p.evaluate(sel => { const l = document.querySelector(sel).closest('label'), q = l.getBoundingClientRect(); return {x: q.right - 12, y: q.top + q.height / 2}; }, sel);
            await p.mouse.click(lb.x, lb.y); await p.waitForTimeout(200);
            const on = await p.evaluate(sel => document.querySelector(sel).checked, sel);
            if (r0.h < 44 || on === r0.on) bad.push(`avoid-swap ${JSON.stringify(r0)} 押したあと ${on}`);
        }
        await ctx.close();
    }
    ok(!bad.length, 'B 44px より小さいボタン: 「食べたいもの」（お膳の位置は前と同じ）・はじめの A / A+ / A++・avoid-swap のラベル: ' + bad.join(' || '));
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\np100: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
