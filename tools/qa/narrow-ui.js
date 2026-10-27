// 狭い画面（320px）・文字を大きくした画面で、文字が切れたり、折れ方がバラバラになったりしないことを、全17言語で確かめる。
//  - 「まるごと入れ替え」の丸ボタン: 文字が丸の外（下）に出て、切れない・画面からはみ出さない（文字サイズ ふつう/もっと大きい）
//  - お膳の枠名（主菜・副菜…）が … で省略されない
//  - 「条件を変える」の要約が1行で切れない（2行まで）
//  - 作り方の「ポイント」（コツ・火の通しの注意）が途中で切れない
//  - 買い物モード（大）で、品名の下に数量が出る（横に並べない）・品名が画面からはみ出さない
//  - 1週間の主菜の各日ボタン（担当・かえる・作らない）が、担当は1段目いっぱい・残りは同じ幅で2段目
//  - 入力欄（文字・検索）に text-overflow:ellipsis が付いていて、長い入力例が途中で切れたとわかる
//  - 横スクロールが出ない
//  - 訳: fil に英語のまま残った語（Southeast Asian / Allergy / Privacy Policy など）がない
// 使い方: BASE=http://localhost:8798/ node tools/qa/narrow-ui.js [--quick]   「NG 0」が合格
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765/';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const quick = process.argv.includes('--quick');
const ALL = 'ar,de,en,es,fil,fr,hi,id,it,ko,pl,pt-BR,th,tr,vi,zh-Hans,zh-Hant,ja'.split(',');
const LANGS = process.env.LANGS ? process.env.LANGS.split(',') : quick ? ['ja', 'en', 'de', 'fil'] : ALL;
const SIZES = quick ? [2] : [0, 2];
let ng = 0, ok = 0; const bad = m => { ng++; console.log('NG', m); }; const chk = (c, m) => (c ? ok++ : bad(m));

(async () => {
  // 訳（辞書の中身）
  const fil = fs.readFileSync(path.join(__dirname, '../../gohancho/i18n/fil.js'), 'utf8');
  for (const w of ['"Southeast Asian"', '"Allergy"', '"Privacy Policy"', '"Terms of Use"', '"Southeast Asian-style"']) chk(!fil.includes(': ' + w), `fil に英語のまま: ${w}`);
  for (const l of ['fr', 'es', 'pt-BR']) chk(!new RegExp('"合計 \\{n\\}分": "Total \\{n\\} min"').test(fs.readFileSync(path.join(__dirname, `../../gohancho/i18n/${l}.js`), 'utf8')), `${l}: 「合計 {n}分」が英語の語順のまま`);

  const b = await chromium.launch({executablePath: EXE});
  for (const l of LANGS) for (const ts of SIZES) {
    const tag = `320 ${l} ts${ts}`;
    const ctx = await b.newContext({viewport: {width: 320, height: 700}}); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([l, ts]) => { localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-26', settings: {country: 'JP', dishCount: 4, uiLang: l, textSize: ts || undefined}})); }, [l, ts]);
    await p.goto(BASE); await p.waitForTimeout(1000);
    await p.evaluate(() => { window.hasPro = () => true; window.isLocked = () => false; });
    // 今日: 丸ボタン・枠名
    const a = await p.evaluate(() => {
      const s = document.querySelector('.shuffle'), tx = s && s.querySelector('.sh-tx'), ic = s && s.querySelector('.sh-ic');
      const slots = [...document.querySelectorAll('.spot-label .slot')].map(e => e.scrollWidth <= e.clientWidth + 1 && getComputedStyle(e).textOverflow !== 'ellipsis' || getComputedStyle(e).whiteSpace !== 'nowrap');
      const r = s ? s.getBoundingClientRect() : null;
      return {has: !!s, txClip: tx ? tx.scrollHeight > tx.clientHeight + 1 || tx.scrollWidth > tx.clientWidth + 1 : true, below: tx && ic ? tx.getBoundingClientRect().top >= ic.getBoundingClientRect().bottom - 1 : false, inside: r ? r.left >= 0 && r.right <= innerWidth : false, slotsOk: slots.every(Boolean), n: slots.length, sw: document.documentElement.scrollWidth};
    });
    chk(a.has && !a.txClip, `${tag}: 丸ボタンの文字が切れる ${JSON.stringify(a)}`);
    chk(a.below, `${tag}: 丸ボタンの文字が丸の下に出ていない`); chk(a.inside, `${tag}: 丸ボタンが画面からはみ出す`);
    chk(a.slotsOk && a.n > 0, `${tag}: 枠名が省略される`); chk(a.sw <= 320, `${tag}: 今日が横にはみ出す ${a.sw}`);
    const c = await p.evaluate(() => { const e = document.querySelector('.cond-sum > .small'); return e ? {clip: e.scrollHeight > e.clientHeight + 1, lines: Math.round(e.clientHeight / parseFloat(getComputedStyle(e).lineHeight))} : null; });
    chk(!c || (!c.clip), `${tag}: 「条件を変える」の要約が切れる ${JSON.stringify(c)}`);
    // 1週間の各日ボタン
    const w = await p.evaluate(() => { makeWeek(); S.foldOpen = Object.assign({}, S.foldOpen, {week: 1}); render(); const a = document.querySelector('.week-acts .who') && document.querySelector('.week-acts .who').parentElement; if (!a) return null; const k = [...a.children].map(e => e.getBoundingClientRect()); return {who: k[0].width, a: k[1].width, b: k[2].width, ya: k[1].top, yb: k[2].top, yw: k[0].top, clip: [...a.children].some(e => e.scrollWidth > e.clientWidth + 1), right: Math.max(...k.map(r => r.right))}; });
    chk(w && Math.abs(w.a - w.b) < 2 && w.yw < w.ya && Math.abs(w.ya - w.yb) < 1 && !w.clip && w.right <= 320, `${tag}: 週プランの各日ボタンの並び ${JSON.stringify(w)}`);
    // 入力欄・作り方・買い物
    for (const tb of ['fridge', 'settings']) { await p.evaluate(t => setTab(t), tb); await p.waitForTimeout(150); const o = await p.evaluate(() => [...document.querySelectorAll('input[placeholder]')].every(e => getComputedStyle(e).textOverflow === 'ellipsis') && document.documentElement.scrollWidth <= innerWidth); chk(o, `${tag} ${tb}: 入力例の … または横はみ出し`); }
    await p.evaluate(() => { try { const m = session.menu; S.cook = {d: TODAY, menu: m && m.items.map(x => x.r.id)}; } catch (e) {} });
    const pt = await p.evaluate(() => { const r = RECIPES.find(x => ['豚', '鶏', '牛', 'ひき肉', '羊', '卵'].includes(x.family)); if (!r) return null; const d = document.createElement('div'); d.innerHTML = pointsHtml(r); document.body.appendChild(d); const e = d.querySelector('.pt-safe'); const res = e ? e.scrollHeight <= e.clientHeight + 1 && getComputedStyle(e).webkitLineClamp === 'none' : null; d.remove(); return res; });
    chk(pt !== false, `${tag}: 作り方のポイントが切れる`);
    if (ts === 2) {
      await p.evaluate(() => { session.shopMode = true; render(); }); await p.waitForTimeout(250);
      const sh = await p.evaluate(() => { const row = document.querySelector('.shop.big .shop-row'); if (!row) return null; const nm = row.querySelector('.nm'), q = row.querySelector('.q'); return {noWrapQ: !q || !q.textContent.trim() || q.getBoundingClientRect().top >= nm.getBoundingClientRect().bottom - 1, nmIn: nm.getBoundingClientRect().right <= innerWidth, sw: document.documentElement.scrollWidth}; });
      if (sh) { chk(sh.noWrapQ, `${tag}: 買い物(大)で数量が品名の下にない`); chk(sh.nmIn && sh.sw <= 320, `${tag}: 買い物(大)が横にはみ出す ${JSON.stringify(sh)}`); }
    }
    chk(errs.length === 0, `${tag}: JSエラー ${errs[0]}`);
    await ctx.close();
  }
  await b.close();
  console.log(`ok ${ok}  NG ${ng}`); process.exit(ng ? 1 : 0);
})();
