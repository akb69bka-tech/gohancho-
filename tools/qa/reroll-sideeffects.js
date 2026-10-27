// 「かえる」を押したとき、押した料理以外（ほかの料理・ご飯の欄）が1つでも変わらないかを、国・品数・枠ごとに何度も確かめる
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const QUICK = process.env.QUICK === '1', REPS = Number(process.env.REPS || (QUICK ? 3 : 12));   // 失敗時は SEED=... で再現
(async () => {
  const b = await chromium.launch(LAUNCH);
  let total = 0, bad = 0; const errs = [];
  for (const cc of ['JP', 'US', 'TH', 'KR', 'EG', 'CN']) for (const n of [2, 3, 4, 5, 6, 'auto']) {
    const ctx = await b.newContext({viewport:{width:390,height:900}}); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('reroll', cc, n)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + n + e.message));
    await p.addInitScript(([cc, n]) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:'2026-10-26', settings:{country:cc, dishCount:n}})); } }, [cc, n]);
    await p.goto(BASE_); await ready(p);
    await p.evaluate(() => { window.hasPro = () => true; session.menu = null; render(); });
    const snap = () => p.evaluate(() => ({ids: session.menu.items.map(x => x.r ? x.r.id : '-'), rice: (document.querySelector('.tray .spot.rice') || {}).textContent || ''}));
    const nBtn = await p.evaluate(() => document.querySelectorAll('.tray [data-act="reroll"]').length);
    for (let rep = 0; rep < REPS; rep++) for (let k = 0; k < nBtn; k++) {
      const a = await snap();
      const i = await p.evaluate(k => { const b = document.querySelectorAll('.tray [data-act="reroll"]')[k]; const i = b.dataset.i; b.click(); return Number(i); }, k);
      const c = await snap(); total++;
      const others = a.ids.some((x, j) => j !== i && x !== c.ids[j]);
      if (others || a.rice.replace(/かえる|Change|\s/g, '') !== c.rice.replace(/かえる|Change|\s/g, '')) { bad++; if (bad < 12) console.log('BAD', cc, n, 'i=' + i, 'rep=' + rep, 'k=' + k, '再現: SEED=' + SEED + ' CC=' + cc + ' n=' + n, JSON.stringify(a), '->', JSON.stringify(c)); }
    }
    await ctx.close();
  }
  console.log('total taps', total, 'bad', bad, 'errs', errs.slice(0, 3), 'SEED', SEED);
  if (bad || errs.length) process.exitCode = 1;
  await b.close();
})();
