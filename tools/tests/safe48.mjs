#!/usr/bin/env node
// 第48回（安全）: R211 アレルギーを外したときの知らせ（元に戻す付き）が、画面の中に収まり、指で「元に戻す」を押せる
//  使い方: node tools/tests/safe48.mjs [http://localhost:9291/]   （LANGS=ja,en で言語をしぼる）
//  W1 設定の家族の画面: 家族（長い名前）の「乳製品（牛乳・チーズ・バター）」を外す → 知らせが画面の中（左右・上下）に入り、文が「外しました」まで
//     切れずに読める（折り返してよい。… や途中切れなし。文は全部見える）。「元に戻す」を指で押すと乳製品が戻る（320・360・390px × 18言語、文字いちばん大きい）
//  W2 はじめての流れ（決める →［ある］→ 家族を足す → 乳製品を押す → 押し直して外す）で同じ（N034 の流れ）
//  W3 自分のアレルゲン（アレルギー対策の乳）を外したときも同じ
//  W4 ほかの「元に戻す」付きの知らせ（今日の献立の1品をかえる）も、画面の中に入り、指で「元に戻す」を押すと戻る
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const boot = p => p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 60000 }).catch(() => {});
const LANGS = (process.env.LANGS || 'ja,ar,de,en,es,fil,fr,hi,id,it,ko,pl,pt-BR,th,tr,vi,zh-Hans,zh-Hant').split(',');
const CC = { ja: 'JP', ar: 'EG', de: 'DE', en: 'US', es: 'ES', fil: 'PH', fr: 'FR', hi: 'IN', id: 'ID', it: 'IT', ko: 'KR', pl: 'PL', 'pt-BR': 'BR', th: 'TH', tr: 'TR', vi: 'VN', 'zh-Hans': 'CN', 'zh-Hant': 'TW' };
const SIZES = [[320, 640], [360, 740], [390, 844]];
const LONG = 'おじいちゃん（父方の高橋）';
const open = async (tag, W, H, lang, st0) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('safe48', tag)));
    const st = Object.assign({ onboarded: true, algAsk: 0, firstUse: '2026-11-11', foldOpen: {} }, st0, { settings: Object.assign({ country: CC[lang], uiLang: lang, dishCount: 3, servings: 2, textSize: 2 }, st0.settings || {}) });
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await boot(p); await p.waitForTimeout(400);
    await p.evaluate(() => { try{ applyTextSize(); }catch(e){} });
    return { p, ctx };
};
const tapSel = async (p, sel) => { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); await l.evaluate(e => { if (!e.closest('#sheet-root')){ const r = e.getBoundingClientRect(); scrollBy(0, r.top - innerHeight * 0.4); } }); await p.waitForTimeout(250);   /* 下のタブの裏に入らないよう、画面の中ほどへ */ const bx = await l.boundingBox(); await p.touchscreen.tap(bx.x + bx.width / 2, bx.y + bx.height / 2); };
// 知らせ: 画面の中に入っているか・文が切れていないか（はみ出し・… の省略）・「元に戻す」の場所
const toastBox = p => p.evaluate(() => {
    const tb = document.querySelector('#toast-root .toast'); if (!tb) return null;
    const r = tb.getBoundingClientRect(), u = tb.querySelector('[data-act="toast-undo"]'), tx = tb.querySelector('.tx') || tb;
    const ur = u ? u.getBoundingClientRect() : null;
    const clipped = tx.scrollHeight > tx.clientHeight + 2 || tx.scrollWidth > tx.clientWidth + 2;
    const lh = parseFloat(getComputedStyle(tx).lineHeight) || 20, lines = Math.round(tx.getBoundingClientRect().height / lh);
    const nav = document.querySelector('nav.tabs'), floor = nav && nav.offsetHeight ? nav.getBoundingClientRect().top : innerHeight;
    return { text: (tb.getAttribute('aria-label') || tb.textContent).trim(), shown: (tx.innerText || '').trim(), l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), vw: innerWidth, vh: innerHeight, clipped, lines,
        u: ur && { x: ur.left + ur.width / 2, y: ur.top + ur.height / 2, l: Math.round(ur.left), r: Math.round(ur.right), t: Math.round(ur.top), b: Math.round(ur.bottom) }, floor: Math.round(floor), placing: tb.classList.contains('placing') };
});
const inView = s => s && !s.placing && s.l >= 0 && s.r <= s.vw && s.t >= 0 && s.b <= s.vh && s.u && s.u.l >= 0 && s.u.r <= s.vw && s.u.t >= 0 && s.u.b <= s.floor;
const fingerUndo = async (p, s) => { await p.touchscreen.tap(s.u.x, s.u.y); await p.waitForTimeout(700); };
const MSG = (p, key, vars) => p.evaluate(([k, v]) => t(k, v), [key, vars]);
const famAlg = p => p.evaluate(() => S.family.length ? S.family[S.family.length - 1].allergy.slice() : []);

for (const lang of LANGS) for (const [W, H] of SIZES){
    const v = `${W}px ${lang}`;
    // W1 設定の家族の画面
    { const { p, ctx } = await open('w1' + v, W, H, lang, { family: [{ id: 'fa1', name: LONG, role: 'adult', avoid: ['@dairy'], allergy: ['@dairy'], mild: false }] });
      await p.evaluate(() => { session.famOpen = 'fa1'; setGo('family-profile'); }); await p.waitForTimeout(800);
      await tapSel(p, '#view details.fam-member[data-fm="fa1"] [data-act="fam-alg-fam"][data-v="dairy"]'); await p.waitForTimeout(900);
      const nm = await p.evaluate(() => S.family[0].name), s = await toastBox(p), want = await MSG(p, '{name}のアレルギーから「{what}」を外しました', { name: nm, what: await p.evaluate(() => joinNames([avoidFamLabel('dairy')])) });
      const a0 = await famAlg(p);
      ok(!a0.length && inView(s) && !s.clipped && s.shown.replace(/\s+/g, '') === want.replace(/\s+/g, ''), `W1 ${v} 家族の画面: 知らせが画面の中・「外しました」まで読める: ` + JSON.stringify({ a0, s, want }));
      if (s && s.u){ await fingerUndo(p, s); const a = await famAlg(p); ok(a.includes('@dairy'), `W1 ${v} 指で元に戻すを押すと戻る: ` + JSON.stringify(a)); } else ok(false, `W1 ${v} 指で元に戻すを押すと戻る: 元に戻すがない`);
      await ctx.close(); }
    // W2 はじめての流れ
    { const { p, ctx } = await open('w2' + v, W, H, lang, { algAsk: 1, family: [] });
      let step = 'decide';
      try{
          await tapSel(p, '#view [data-act="decide"]'); await p.waitForSelector('#sheet-root [data-act="alg-ask-yes"]', { timeout: 8000 }); step = 'yes';
          await tapSel(p, '#sheet-root [data-act="alg-ask-yes"]'); await p.waitForTimeout(1200); step = 'fam-add';
          await tapSel(p, '#view [data-act="fam-add"]'); await p.waitForTimeout(900); step = 'name';
          const fid = await p.evaluate(() => S.family[S.family.length - 1].id);
          const nm = p.locator(`#view details.fam-member[data-fm="${fid}"] input.fam-name`); if (await nm.count()){ await nm.fill(LONG); await nm.dispatchEvent('change'); await p.waitForTimeout(600); }
          step = 'dairy';
          const sel = `#view details.fam-member[data-fm="${fid}"] [data-act="fam-alg-fam"][data-v="dairy"]`;
          await tapSel(p, sel); await p.waitForTimeout(1300); step = 'dairy-off';
          await tapSel(p, sel); await p.waitForTimeout(900); step = 'check';
      }catch(e){ step += ': ' + e.message.slice(0, 80); }
      const s = await toastBox(p), a0 = await famAlg(p), name = await p.evaluate(() => { const m = S.family[S.family.length - 1]; return m ? m.name : null; });
      const want = await MSG(p, '{name}のアレルギーから「{what}」を外しました', { name: name || '', what: await p.evaluate(() => joinNames([avoidFamLabel('dairy')])) });
      ok(step === 'check' && !a0.length && inView(s) && !s.clipped && s.shown.replace(/\s+/g, '') === want.replace(/\s+/g, ''), `W2 ${v} はじめての流れ: 知らせが画面の中・「外しました」まで読める: ` + JSON.stringify({ step, name, a0, s }));
      if (s && s.u){ await fingerUndo(p, s); const a = await famAlg(p); ok(a.includes('@dairy'), `W2 ${v} 指で元に戻すを押すと戻る: ` + JSON.stringify(a)); } else ok(false, `W2 ${v} 指で元に戻すを押すと戻る: 元に戻すがない（${step}）`);
      await ctx.close(); }
    // W3 自分のアレルゲン
    { const { p, ctx } = await open('w3' + v, W, H, lang, { settings: { allergens: ['milk'] }, family: [] });
      await p.evaluate(() => setGo('allergy-card')); await p.waitForTimeout(800);
      await tapSel(p, '#view [data-act="alg-toggle"][data-v="milk"]'); await p.waitForTimeout(900);
      const s = await toastBox(p), want = await MSG(p, 'アレルギー対策から「{what}」を外しました', { what: await p.evaluate(() => algLabel('milk')) }), a0 = await p.evaluate(() => S.settings.allergens.slice());
      ok(!a0.includes('milk') && inView(s) && !s.clipped && s.shown.replace(/\s+/g, '') === want.replace(/\s+/g, ''), `W3 ${v} 自分のアレルゲン: 知らせが画面の中・読める: ` + JSON.stringify({ s }));
      if (s && s.u){ await fingerUndo(p, s); const a = await p.evaluate(() => S.settings.allergens.slice()); ok(a.includes('milk'), `W3 ${v} 指で元に戻すを押すと戻る: ` + JSON.stringify(a)); } else ok(false, `W3 ${v} 指で元に戻すを押すと戻る: 元に戻すがない`);
      await ctx.close(); }
    // W4 今日の献立の1品をかえる（「元に戻す」付き）
    { const { p, ctx } = await open('w4' + v, W, H, lang, { family: [] });
      let s = null, before = null;
      try{ before = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id).join()); await tapSel(p, '#view .spot .swap[data-act="reroll"]'); await p.waitForTimeout(1200); s = await toastBox(p); }catch(e){ s = { err: e.message.slice(0, 80) }; }
      ok(s && s.u && inView(s), `W4 ${v} 1品をかえた知らせ: 画面の中・元に戻すが押せる場所: ` + JSON.stringify(s));
      if (s && s.u){ await fingerUndo(p, s); const after = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id).join()); ok(after === before, `W4 ${v} 指で元に戻すを押すと戻る: ` + JSON.stringify({ before, after })); }
      await ctx.close(); }
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe48: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
