#!/usr/bin/env node
// 上の端の「モード」ボタン（オーナー指示 11/09）の回帰テスト（Playwright。使い方: node tools/tests/modebtn-r1.mjs [http://localhost:8765/]）
//  M1 位置・大きさ: 幅195〜430px × 文字3段階 × 17言語（幅ごとに言語を抜き取り。195・390 は17言語すべて）で、国旗・モード・設定の3つが 44×44px 以上・重ならない・画面の外に出ない・横スクロールなし。
//     印（膳）・題名の欄とも重ならない。題名（畳んでいないとき）は1行で切れない。並びは 国旗→モード→設定（アラビア語は右から）
//  M2 シート: モードを押すと小さなシート（二日酔いの日・ダイエット・減塩・夜勤明け、各行に一言の説明）。シートで変えた値が設定画面のスイッチと同じ（逆も同じ）。どれかオンならボタンに点
//  M3 二日酔いの日は今日だけ: シートで入れると S.settings.hangover が今日の日付・条件のシートの「飲んだ次の日」も入る。前の日の日付なら点もスイッチも切れている
//  M4 お酒を避ける人（家の設定でお酒・ハラール向け）には二日酔いの行を出さない（すでにオンなら切れるように出す）
//  M5 切り替えで献立が変わらない（まだ決めていない案・決めた献立）
//  M6 17言語: ボタンの読み上げ名・シートの見出しが訳されている（日本語のまま残らない）。アラビア語は右から左（チェックが文の右）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const KEY = 'gohancho.v1';
const ALL_LANGS = ['ja', 'en', 'ko', 'zh-Hans', 'zh-Hant', 'th', 'vi', 'id', 'fil', 'hi', 'ar', 'tr', 'de', 'fr', 'es', 'it', 'pt-BR', 'pl'];
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const BASE_ST = {onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}};
const open = async ({w = 390, h = 844, st = BASE_ST, tag = 'm'} = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('modebtn', tag)));
    await ctx.addInitScript(([st, KEY]) => { if (!sessionStorage.getItem('mb')){ sessionStorage.setItem('mb', 1); localStorage.setItem(KEY, JSON.stringify(st)); } }, [st, KEY]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return {p, ctx};
};
const withLang = lang => Object.assign({}, BASE_ST, {settings: Object.assign({}, BASE_ST.settings, {uiLang: lang})});

// ---- M1 位置・大きさ・重なり ----
{
    const bad = []; let n = 0;
    const WIDTHS = [[195, 422], [230, 520], [260, 560], [290, 640], [320, 640], [360, 740], [375, 667], [390, 844], [414, 896], [430, 932]];
    for (const [li, lang] of ALL_LANGS.entries()){
        const {p, ctx} = await open({st: withLang(lang), tag: 'm1' + lang, w: 390, h: 844});
        for (const [wi, [w, h]] of WIDTHS.entries()){
            if (w !== 195 && w !== 390 && (li + wi) % 3) continue;   // 抜き取り（195・390 は全言語）
            await p.setViewportSize({width: w, height: h});
            for (const ts of [0, 1, 2]){
                const r = await p.evaluate(async ts => {
                    if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; render(); await __tick(); await new Promise(res => setTimeout(res, 120));
                    const hd = document.querySelector('header.top'), rc = e => { const q = e.getBoundingClientRect(); return {l: q.left, t: q.top, r: q.right, b: q.bottom, w: q.width, h: q.height}; };
                    const btn = sel => { const e = hd.querySelector(sel); return e && getComputedStyle(e).display !== 'none' ? rc(e) : null; };
                    const h1 = hd.querySelector('h1'), col = h1.parentElement, folded = getComputedStyle(col).position === 'absolute';
                    const seal = hd.querySelector('.seal'), sealR = seal && getComputedStyle(seal).display !== 'none' ? rc(seal) : null;
                    const lh = parseFloat(getComputedStyle(h1).lineHeight) || parseFloat(getComputedStyle(h1).fontSize) * 1.3;
                    return {flag: btn('#flag-btn'), mode: btn('#mode-btn'), set: btn('[data-act="settings"]'), seal: sealR, col: folded ? null : rc(col), folded,
                        h1clip: !folded && h1.scrollWidth > h1.clientWidth + 1, h1lines: folded ? 0 : Math.round(h1.getBoundingClientRect().height / lh),
                        sw: document.documentElement.scrollWidth > innerWidth + 1, iw: innerWidth, rtl: document.documentElement.dir === 'rtl'};
                }, ts);
                n++;
                const tag = `${lang} ${w}/文字${ts}`;
                const bs = [['国旗', r.flag], ['モード', r.mode], ['設定', r.set]];
                if (!r.flag || !r.mode || !r.set){ bad.push(tag + ' ボタンが出ない'); continue; }
                for (const [nm, q] of bs){
                    if (q.w < 43.5 || q.h < 43.5) bad.push(`${tag} ${nm} ${Math.round(q.w)}x${Math.round(q.h)}`);
                    if (q.l < -.5 || q.r > r.iw + .5) bad.push(`${tag} ${nm} 画面の外`);
                }
                const ov = (a, c) => a && c && Math.min(a.r, c.r) - Math.max(a.l, c.l) > .5 && Math.min(a.b, c.b) - Math.max(a.t, c.t) > .5;
                const all = bs.concat([['印', r.seal], ['題名', r.col]]);
                for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (ov(all[i][1], all[j][1])) bad.push(`${tag} ${all[i][0]}と${all[j][0]}が重なる`);
                if (r.sw) bad.push(tag + ' 横スクロール');
                if (r.h1clip) bad.push(tag + ' 題名が切れる');
                if (r.h1lines > 1 && w >= 290) bad.push(tag + ' 題名が2行');
                const order = r.rtl ? r.set.l < r.mode.l && r.mode.l < r.flag.l : r.flag.l < r.mode.l && r.mode.l < r.set.l;
                if (!order) bad.push(tag + ' 並びが 国旗→モード→設定 でない');
            }
        }
        await ctx.close();
    }
    ok(!bad.length && n > 150, `M1 幅195〜430 × 文字3段階 × 17言語（${n}通り）で、国旗・モード・設定が 44px 以上・重ならない・はみ出さない・題名が1行で切れない: ` + bad.slice(0, 8).join(' / '));
}

// ---- M2・M3・M5 シート・設定画面と同じ値・今日だけ・献立は変わらない ----
{
    const {p, ctx} = await open({tag: 'm2'});
    const dot = () => p.evaluate(() => { const d = document.querySelector('#mode-btn .mode-dot'); return !!d && !d.hidden && getComputedStyle(d).display !== 'none'; });
    ok(!(await dot()), 'M2a どれもオフのときは点を出さない');
    const ids0 = await p.evaluate(() => JSON.stringify(menuIds()));
    await p.click('#mode-btn'); await p.waitForTimeout(200);
    const s = await p.evaluate(() => {
        const sh = document.querySelector('#sheet-root .sheet'); if (!sh) return null;
        const q = sh.getBoundingClientRect();
        return {kind: sheet && sheet.kind, dlg: sh.getAttribute('role'), h2: (sh.querySelector('h2') || {}).textContent, rows: [...sh.querySelectorAll('.mode-row')].map(r => ({m: r.dataset.mode, nm: r.querySelector('b').textContent, d: [...r.querySelectorAll('.mode-d')].map(x => x.textContent).join('|'), on: r.querySelector('input').checked, h: r.getBoundingClientRect().height})),
            foot: (sh.querySelector('.mode-foot') || {}).textContent || '', h: q.height, ih: innerHeight, aria: document.querySelector('#mode-btn').getAttribute('aria-label')};
    });
    ok(s && s.kind === 'mode' && s.dlg === 'dialog' && s.h2 === 'モード' && s.aria === 'モード', 'M2b モードを押すとシート（見出し・読み上げ名「モード」）: ' + JSON.stringify(s && {kind: s.kind, h2: s.h2, aria: s.aria}));
    ok(s && s.rows.map(r => r.m).join(',') === 'hangover,diet-mode,low-salt,night-shift' && s.rows.every(r => r.nm && r.d && !r.on && r.h >= 44), 'M2c 二日酔いの日・ダイエット・減塩・夜勤明けの4行（名前と一言の説明・初期はオフ・44px 以上）: ' + JSON.stringify(s && s.rows));
    ok(s && /いまの献立は変えません/.test(s.foot) && s.h < s.ih * .9, 'M2d 献立は変えない旨の一言・小さなシート: ' + JSON.stringify(s && {foot: s.foot, h: s.h}));
    // シートで入れる → 設定画面のスイッチも入る
    for (const act of ['diet-mode', 'low-salt', 'night-shift', 'hangover']) await p.click(`#sheet-root .mode-row[data-mode="${act}"] input`);
    await p.waitForTimeout(150);
    const r1 = await p.evaluate(() => { saveNow(); const st = JSON.parse(localStorage.getItem('gohancho.v1')).settings;
        return {diet: S.settings.diet === true && st.diet === true, salt: S.settings.lowSalt === true && st.lowSalt === true, night: S.settings.nightShift === true && st.nightShift === true, hang: S.settings.hangover === TODAY && st.hangover === TODAY, ids: JSON.stringify(menuIds()), n: modesOn()}; });
    ok(r1.diet && r1.salt && r1.night && r1.hang && r1.n === 4, 'M2e シートのスイッチで S.settings（diet・lowSalt・nightShift・hangover=今日）が入り保存される: ' + JSON.stringify(r1));
    ok(await dot(), 'M2f どれかオンならボタンに点');
    ok(r1.ids === ids0, 'M5a 切り替えても、まだ決めていない案は変わらない: ' + ids0 + ' → ' + r1.ids);
    const r2 = await p.evaluate(async () => { closeSheet(); setTab('settings'); await __tick();
        const c = a => { const e = document.querySelector(`#view input[data-act="${a}"]`); return e ? e.checked : null; };
        const o = {diet: c('diet-mode'), salt: c('low-salt'), night: c('night-shift')};
        openCondSheet(); const hf = document.querySelector('#hang-field input[data-act="hangover"]'); o.hang = hf ? hf.checked : null; closeSheet();
        return o; });
    ok(r2.diet === true && r2.salt === true && r2.night === true && r2.hang === true, 'M2g 設定画面・条件のシートのスイッチも同じ値（オン）: ' + JSON.stringify(r2));
    // 設定画面で切る → シートも切れている
    const r3 = await p.evaluate(async () => { setTab('settings'); await __tick();
        for (const a of ['diet-mode', 'low-salt', 'night-shift']) document.querySelector(`#view input[data-act="${a}"]`).click();
        await __tick(); return {diet: S.settings.diet === true, salt: S.settings.lowSalt === true, night: S.settings.nightShift === true}; });
    await p.click('#mode-btn'); await p.waitForTimeout(150);
    const r4 = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#sheet-root .mode-row')].map(r => [r.dataset.mode, r.querySelector('input').checked])));
    ok(!r3.diet && !r3.salt && !r3.night && r4['diet-mode'] === false && r4['low-salt'] === false && r4['night-shift'] === false && r4.hangover === true, 'M2h 設定画面で切ると、シートでも切れている（二日酔いはオンのまま）: ' + JSON.stringify({r3, r4}));
    // 決めた献立も変わらない
    const r5 = await p.evaluate(async () => { closeSheet(); setTab('today'); await __tick();
        const m = session.menu; S.cook = {d: TODAY, ids: menuIds(), slots: m.items.filter(x => x.r).map(x => x.slot)}; save(); render(); await __tick();
        const c0 = JSON.stringify(S.cook), i0 = JSON.stringify(menuIds());
        openModeSheet(); for (const a of ['hangover', 'diet-mode', 'low-salt', 'night-shift', 'diet-mode', 'hangover']) document.querySelector(`#sheet-root .mode-row[data-mode="${a}"] input`).click();
        await __tick(); const o = {same: JSON.stringify(S.cook) === c0 && JSON.stringify(menuIds()) === i0 && menuIsDecided(), sheet: sheet && sheet.kind};
        closeSheet(); return o; });
    ok(r5.same && r5.sheet === 'mode', 'M5b 決めた献立は、切り替えても変わらない（確かめのシートにも替わらない）: ' + JSON.stringify(r5));
    // M3 前の日の日付なら、点・スイッチとも切れている
    const r6 = await p.evaluate(async () => { delete S.cook; delete S.settings.lowSalt; delete S.settings.nightShift; delete S.settings.diet; S.settings.hangover = addDays(TODAY, -1); save(); render(); await __tick();
        const d = document.querySelector('#mode-btn .mode-dot'); openModeSheet(); const hv = document.querySelector('#sheet-root .mode-row[data-mode="hangover"] input'); const o = {dot: !d.hidden, hang: hv ? hv.checked : null, on: hangOn()}; closeSheet(); return o; });
    ok(r6.dot === false && r6.hang === false && r6.on === false, 'M3 二日酔いの日は今日だけ（前の日の日付なら点もスイッチも切れている）: ' + JSON.stringify(r6));
    await ctx.close();
}

// ---- M4 お酒を避ける人には二日酔いの行を出さない ----
for (const [nm, avoid, hangover, want] of [['家の設定でお酒', ['@alcohol'], false, false], ['ハラール向け', ['@pork', '@alcohol'], false, false], ['お酒・すでにオン', ['@alcohol'], true, true], ['避けない', [], false, true]]){
    const {p, ctx} = await open({tag: 'm4' + nm, st: Object.assign({}, BASE_ST, {settings: Object.assign({}, BASE_ST.settings, {avoid})})});
    if (hangover) await p.evaluate(() => { S.settings.hangover = TODAY; save(); render(); });
    await p.click('#mode-btn'); await p.waitForTimeout(150);
    const r = await p.evaluate(() => ({hang: !!document.querySelector('#sheet-root .mode-row[data-mode="hangover"]'), rows: document.querySelectorAll('#sheet-root .mode-row').length}));
    ok(r.hang === want && r.rows === (want ? 4 : 3), `M4 ${nm}: 二日酔いの行を${want ? '出す' : '出さない'}: ` + JSON.stringify(r));
    await ctx.close();
}

// ---- M6 17言語の訳・RTL ----
{
    const bad = [];
    for (const lang of ALL_LANGS){
        const {p, ctx} = await open({tag: 'm6' + lang, st: withLang(lang), w: 360, h: 740});
        await p.click('#mode-btn'); await p.waitForTimeout(150);
        const r = await p.evaluate(() => { const sh = document.querySelector('#sheet-root .sheet'); const tx = sh ? sh.innerText : '';
            const rows = [...document.querySelectorAll('#sheet-root .mode-row')].map(r => { const i = r.querySelector('input').getBoundingClientRect(), b = r.querySelector('b').getBoundingClientRect(); return {ir: i.right, il: i.left, bl: b.left, br: b.right, nm: r.querySelector('b').textContent, d: (r.querySelector('.mode-d') || {}).textContent || ''}; });
            return {aria: document.querySelector('#mode-btn').getAttribute('aria-label'), h2: (sh && sh.querySelector('h2') || {}).textContent, kana: /[぀-ヿ]/.test(tx), rows, dir: getComputedStyle(sh).direction, sw: sh.scrollWidth > sh.clientWidth + 1, want: t('モード')}; });
        if (lang === 'ja'){ if (r.aria !== 'モード') bad.push('ja 読み上げ名'); }
        else {
            if (!r.aria || r.aria === 'モード' || r.aria !== r.want) bad.push(`${lang} 読み上げ名 ${r.aria}`);
            if (r.h2 !== r.want) bad.push(`${lang} 見出し ${r.h2}`);
            if (r.kana) bad.push(`${lang} シートに日本語が残る`);
        }
        if (r.rows.length !== 4 || r.rows.some(x => !x.nm || !x.d || /[（(]/.test(x.nm))) bad.push(`${lang} 行の名前と説明 ${JSON.stringify(r.rows.map(x => [x.nm, x.d]))}`);
        if (r.sw) bad.push(`${lang} シートが横にはみ出す`);
        if (lang === 'ar' && (r.dir !== 'rtl' || r.rows.some(x => !(x.il > x.br - 1)))) bad.push(`ar 右から左でない ${JSON.stringify(r)}`);
        if (lang !== 'ar' && r.rows.some(x => !(x.ir < x.bl + 1))) bad.push(`${lang} チェックが文の左でない`);
        await ctx.close();
    }
    ok(!bad.length, 'M6 17言語でボタンの読み上げ名・シートの見出しが訳され、各行が名前と説明に分かれる。アラビア語は右から左: ' + bad.slice(0, 6).join(' / '));
}

await b.close();
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
