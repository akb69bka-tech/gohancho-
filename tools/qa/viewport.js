// iPad・横向き・分割表示・極小画面・キーボード・回転の総点検。
//  (1) 画面幅ごと・言語ごと・全タブで、横にはみ出さない・下のタブが画面を占領しない（横向きは高さの16%まで）
//  (2) 購入画面・共有シート・おすすめ入力のシートを開いても、シートが画面に収まる（横向きでもシートの中身がスクロールで読める）
//  (3) キーボードが出たとき（画面が縮む端末／visualViewport だけ縮む端末の両方）、食費・材料・自由入力の欄が見える位置にあり、下のタブは隠れる
//  (4) 画面を回転（縦→横→縦）・分割表示の幅変更をしても、タブ・入力途中の文字・献立が変わらない
//  (5) safe-area（env(safe-area-inset-*)）が本文・下のタブ・シートに効いている（ソースの確認）
// 使い方: BASE=http://localhost:8791/ node tools/qa/viewport.js [--quick]   「NG 0」が合格
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765/';
const quick = process.argv.includes('--quick');
const VPS = (process.env.VPS || (quick ? '820x1180,844x390,320x568' : '768x1024,820x1180,1024x1366,844x390,932x430,667x375,375x667,320x568,320x400,390x844')).split(',').map(s => s.split('x').map(Number));
const LANGS = (process.env.LANGS || (quick ? 'ja,ar' : 'ja,en,de,ar')).split(',');
const TABS = ['today', 'cook', 'fridge', 'twist', 'world', 'log'];
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ng = 0, ok = 0; const bad = (m) => { ng++; console.log('NG', m); }; const good = () => ok++;
const chk = (c, m) => (c ? good() : bad(m));

async function open(b, w, h, lang) {
  const ctx = await b.newContext({viewport: {width: w, height: h}, deviceScaleFactor: 1, hasTouch: true});
  await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(([lang]) => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-26', settings: {country: 'JP', dishCount: 4, uiLang: lang}})); }, [lang]);
  await p.goto(BASE); await p.waitForTimeout(700);
  await p.evaluate(() => { window.hasPro = () => true; window.isLocked = () => false; });
  return {ctx, p};
}
const overflow = p => p.evaluate(() => {
  const iw = innerWidth; const o = [...document.body.querySelectorAll('*')].filter(e => { if (e.closest('[hidden]') || getComputedStyle(e).position === 'fixed') return false; const r = e.getBoundingClientRect(); return r.width && (r.right > iw + 1 || r.left < -1) && !e.closest('.scroll,.timer-list,pre'); }).slice(0, 2).map(e => e.tagName + '.' + (e.className.baseVal ?? e.className));
  return {sw: document.documentElement.scrollWidth, iw, o};
});

(async () => {
  const b = await chromium.launch({executablePath: EXE});
  // (5) ソースの確認
  const src = fs.readFileSync(path.join(__dirname, '../../gohancho/index.html'), 'utf8');
  chk(/body\{[^}]*padding-inline:max\(16px,env\(safe-area-inset-left/.test(src), 'safe-area: body の左右');
  chk(/nav\.tabs\{[^}]*env\(safe-area-inset-bottom/.test(src) && /nav\.tabs\{[^}]*env\(safe-area-inset-left/.test(src), 'safe-area: 下のタブの下・左右');
  chk(/\.modal\{[^}]*env\(safe-area-inset-left/.test(src) && /\.sheet\{[^}]*env\(safe-area-inset-bottom/.test(src), 'safe-area: シート');
  chk(/viewport-fit=cover/.test(src), 'viewport-fit=cover');

  // (1)(2)
  for (const [w, h] of VPS) for (const lang of LANGS) {
    const {ctx, p} = await open(b, w, h, lang); const land = w > h && h <= 500; const tag = `${w}x${h} ${lang}`;
    for (const tb of TABS) {
      await p.evaluate(t => setTab(t), tb); await p.waitForTimeout(150);
      const m = await p.evaluate(() => { const n = document.querySelector('nav.tabs'); const r = n.getBoundingClientRect(); return {navH: Math.round(r.height), vis: getComputedStyle(n).display !== 'none', bottom: Math.round(r.bottom), ih: innerHeight, btnW: [...n.querySelectorAll('button:not([hidden])')].map(x => Math.round(x.getBoundingClientRect().width))}; });
      const o = await overflow(p);
      chk(o.sw <= o.iw && !o.o.length, `${tag} ${tb}: 横にはみ出し ${JSON.stringify(o)}`);
      if (tb === 'twist' && lang !== 'ja') continue;
      chk(m.navH <= h * (land ? 0.16 : 0.22), `${tag} ${tb}: 下のタブが高すぎる ${m.navH}px`);
      chk(m.bottom <= m.ih + 1, `${tag} ${tb}: 下のタブが画面外`);
    }
    // シート類
    for (const [name, js] of [['購入', "openPaywall('info')"], ['共有', "openShare('menu')"], ['1品追加', 'openOne()']]) {
      await p.evaluate(j => { try { closeSheet(); } catch (e) {} eval(j); }, js).catch(() => {}); await p.waitForTimeout(600);
      const s = await p.evaluate(() => { const e = document.querySelector('#modal-root .sheet, #sheet-root .sheet, .sheet'); if (!e) return null; const r = e.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), ih: innerHeight, iw: innerWidth, sh: e.scrollHeight, ch: e.clientHeight, oy: getComputedStyle(e).overflowY}; });
      if (s) { chk(s.top >= -1 && s.bottom <= s.ih + 1 && s.left >= -1 && s.right <= s.iw + 1, `${tag} ${name}シートが画面に収まらない ${JSON.stringify(s)}`); chk(s.sh <= s.ch + 1 || /auto|scroll/.test(s.oy), `${tag} ${name}シートがスクロールできない`); }
      await p.evaluate(() => { try { closeSheet(); closeModal(); } catch (e) {} });
    }
    chk(!p.errs.length, `${tag}: JSエラー ${p.errs[0]}`);
    await ctx.close();
  }

  // (3) キーボード
  for (const [w, h, kh] of [[390, 844, 336], [844, 390, 200], [820, 1180, 380], [320, 568, 260]]) {
    for (const mode of ['resize', 'overlay']) {
      for (const [tb, sel, pre] of [['fridge', '#ing-input'], ['log', '#spend-a', "document.querySelector('#log-more').open=true"], ['log', '#c-name', "document.querySelector('#custom-box').open=true"]]) {
        const {ctx, p} = await open(b, w, h, 'ja'); const tag = `kb ${w}x${h} ${mode} ${sel}`;
        await p.evaluate(t => setTab(t), tb); await p.waitForTimeout(1000);
        if (pre) await p.evaluate(pre);
        const exists = await p.$(sel); if (!exists) { await ctx.close(); continue; }
        await p.evaluate(s => { const e = document.querySelector(s); e.scrollIntoView({block: 'start'}); window.scrollBy(0, -20); }, sel);
        if (mode === 'overlay') {   // visualViewport だけが縮む（iOS Safari の重なり型）
          await p.evaluate(([h, kh]) => { const vv = window.visualViewport; Object.defineProperty(vv, 'height', {configurable: true, get: () => h - kh}); window.__vvfake = 1; }, [h, kh]);
        }
        await p.focus(sel);
        if (mode === 'resize') await p.setViewportSize({width: w, height: h - kh});
        else await p.evaluate(() => window.visualViewport.dispatchEvent(new Event('resize')));
        await p.waitForTimeout(700);
        const r = await p.evaluate(sel => { const e = document.querySelector(sel).getBoundingClientRect(); const vh = window.visualViewport.height; const n = document.querySelector('nav.tabs'); return {top: e.top, bottom: e.bottom, vh, nav: getComputedStyle(n).display, kb: document.body.classList.contains('kb')}; }, sel);
        chk(r.top >= 0 && r.bottom <= r.vh + 1, `${tag}: 入力欄がキーボードの下 ${JSON.stringify(r)}`);
        chk(r.kb && r.nav === 'none', `${tag}: キーボード中に下のタブが残る ${JSON.stringify(r)}`);
        await p.evaluate(() => document.activeElement.blur()); if (mode === 'resize') await p.setViewportSize({width: w, height: h});
        else await p.evaluate(() => { delete window.visualViewport.height; window.visualViewport.dispatchEvent(new Event('resize')); });
        await p.waitForTimeout(400);
        const a = await p.evaluate(() => ({kb: document.body.classList.contains('kb'), nav: getComputedStyle(document.querySelector('nav.tabs')).display}));
        chk(!a.kb && a.nav !== 'none', `${tag}: キーボードを閉じても下のタブが戻らない ${JSON.stringify(a)}`);
        await ctx.close();
      }
      // シートの入力欄（1品追加）
      const {ctx, p} = await open(b, w, h, 'ja'); const tag = `kb ${w}x${h} ${mode} sheet`;
      await p.evaluate(() => { openOne(); }); await p.waitForTimeout(250);
      if (await p.$('#one-input')) {
        if (mode === 'overlay') await p.evaluate(([h, kh]) => Object.defineProperty(window.visualViewport, 'height', {configurable: true, get: () => h - kh}), [h, kh]);
        await p.focus('#one-input'); if (mode === 'resize') await p.setViewportSize({width: w, height: h - kh}); else await p.evaluate(() => window.visualViewport.dispatchEvent(new Event('resize')));
        await p.waitForTimeout(700);
        const r = await p.evaluate(() => { const e = document.querySelector('#one-input').getBoundingClientRect(); return {top: e.top, bottom: e.bottom, vh: window.visualViewport.height}; });
        chk(r.top >= 0 && r.bottom <= r.vh + 1, `${tag}: シートの入力欄がキーボードの下 ${JSON.stringify(r)}`);
      }
      await ctx.close();
    }
  }

  // (4) 回転・分割表示で状態が失われない
  {
    const {ctx, p} = await open(b, 390, 844, 'de');
    await p.evaluate(() => setTab('fridge')); await p.waitForTimeout(200);
    await p.fill('#ing-input', 'Zwiebel, Kohl');
    const before = await p.evaluate(() => ({tab, menu: JSON.stringify(session.menu), v: document.querySelector('#ing-input').value, st: localStorage.getItem('gohancho.v1')}));
    for (const [w, h] of [[844, 390], [320, 568], [1024, 768], [375, 667], [390, 844]]) {
      await p.setViewportSize({width: w, height: h}); await p.waitForTimeout(250);
      const a = await p.evaluate(() => ({tab, menu: JSON.stringify(session.menu), v: (document.querySelector('#ing-input') || {}).value, st: localStorage.getItem('gohancho.v1')}));
      chk(a.tab === before.tab && a.menu === before.menu && a.v === before.v && a.st === before.st, `回転 ${w}x${h}: 状態が変わった tab=${a.tab} v=${a.v}`);
    }
    await p.evaluate(() => setTab('today')); await p.waitForTimeout(200);
    const m0 = await p.evaluate(() => JSON.stringify(session.menu));
    for (const [w, h] of [[844, 390], [390, 844], [768, 1024]]) { await p.setViewportSize({width: w, height: h}); await p.waitForTimeout(200); chk(await p.evaluate(() => JSON.stringify(session.menu)) === m0, `回転 ${w}x${h}: 献立が変わった`); }
    await ctx.close();
  }
  await b.close();
  console.log(`ok ${ok} / NG ${ng}`); process.exit(ng ? 1 : 0);
})();
