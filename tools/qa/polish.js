// 今日タブの整理（折りたたみ・決めるボタンは1つ・空の画面・横はみ出し）の回帰テスト
// 使い方: BASE=http://localhost:8794/ node tools/qa/polish.js
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const BASE = process.env.BASE || 'http://localhost:8765/';
const TODAY = new Date().toISOString().slice(0, 10);
let bad = 0; const ok = (c, m) => { if (!c){ bad++; console.log('NG', m); } else console.log('ok', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [cc, lang] of [['JP', 'ja'], ['US', 'en'], ['EG', 'ar'], ['DE', 'de']]) for (const dark of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: dark ? 'dark' : 'light', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { if (!sessionStorage.getItem('seeded')){ localStorage.setItem('gohancho.v1', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify({ onboarded: true, firstUse: TODAY, settings: { country: cc, dishCount: 4, uiLang: lang } }));
    await p.goto(BASE); await p.waitForTimeout(1500);
    const tag = `${cc}${dark ? '-dark' : ''}`;
    ok(await p.locator('[data-act="decide"]').count() === 1, tag + ' 決めるボタンは1つだけ');
    ok(await p.locator('details.fold').count() >= 2, tag + ' 折りたたみがある');
    ok(await p.locator('details.fold[open]').count() === 0, tag + ' 初めは畳んである');
    const ids = () => p.evaluate(() => menuIds().join());
    const m0 = await ids();
    await p.locator('details.fold[data-fold="week"] summary').click(); await p.waitForTimeout(300);
    ok(await p.locator('details.fold[data-fold="week"]').evaluate(e => e.open), tag + ' 週の欄が開く');
    ok(await ids() === m0, tag + ' 開いても献立は変わらない');
    await p.evaluate(() => saveNow()); await p.reload(); await p.waitForTimeout(1200);
    ok(await p.locator('details.fold[data-fold="week"]').evaluate(e => e.open), tag + ' 開き方を覚えている');
    await p.locator('details.fold[data-fold="week"] summary').click(); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('details.fold[data-fold="week"] [data-act="make-week"]') && 0);
    await p.evaluate(() => { document.querySelector('details.fold[data-fold="week"]').open = false; });
    await p.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'goto-shop'; b.id = 'tmp-gs'; document.body.appendChild(b); });
    await p.evaluate(() => document.getElementById('tmp-gs').click()); await p.waitForTimeout(200);
    ok(await p.locator('details.fold[data-fold="week"]').evaluate(e => e.open), tag + ' 買い物メモへ移ると週の欄が開く');
    for (const tab of ['today', 'cook', 'fridge', 'world', 'log']) {
      await p.locator(`nav.tabs button[data-tab="${tab}"]`).click(); await p.waitForTimeout(250);
      const hs = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(hs <= 0, `${tag} ${tab} 横にはみ出さない (${hs})`);
      if (tab === 'cook') ok(await p.locator('.empty.ill').count() === 1, tag + ' 作り方の空の画面にイラスト');
      if (tab === 'log') ok(await p.locator('.empty.ill').count() >= 1, tag + ' 記録の空の画面にイラスト');
    }
    ok(await p.locator('#view.view-in').count() === 1, tag + ' タブ切りかえの動き');
    ok(!errs.length, tag + ' JSエラーなし ' + errs.join('|'));
    await ctx.close();
  }
  // 動きを減らす設定: 切りかえの動きなし
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const p = await ctx.newPage(); await p.goto(BASE); await p.waitForTimeout(1200);
  const nm = await p.evaluate(() => { const v = document.getElementById('view'); v.classList.add('view-in'); return getComputedStyle(v).animationName; });
  ok(nm === 'none', '動きを減らす設定では切りかえのアニメなし (' + nm + ')');
  await b.close(); console.log(bad ? 'FAIL ' + bad : 'PASS'); process.exit(bad ? 1 : 0);
})();
