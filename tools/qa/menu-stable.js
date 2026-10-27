// 「押していない料理は絶対に変わらない」ことを、設定まわりの操作ごとに繰り返し確かめる
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const BASE = process.env.BASE || 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const res = {}; const errs = [];
  const bad = (name, info) => { res[name] = (res[name] || 0) + 1; if (res[name] <= 2) console.log('BAD', name, info); };
  const ok = name => { res['ok:' + name] = (res['ok:' + name] || 0) + 1; };
  for (let rep = 0; rep < 5; rep++) for (const [cc, extra] of [['JP', {}], ['US', {}], ['KR', {}]]) {
    const ctx = await b.newContext({viewport:{width:390,height:900}}); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + e.message));
    await p.addInitScript(([cc]) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:'2026-10-26', settings:{country:cc, dishCount:4}})); } }, [cc]);
    await p.goto(BASE); await p.waitForTimeout(1800);
    await p.evaluate(() => { window.hasPro = () => true; session.menu = null; render(); });
    const snap = () => p.evaluate(() => ({ids: session.menu.items.map(x => x.r ? x.r.id : '-'), mood: session.mood, rice: (document.querySelector('.tray .spot.rice') || {}).textContent || ''}));
    const same = (a, c) => JSON.stringify(a.ids) === JSON.stringify(c.ids) && a.rice.replace(/かえる|Change|\s/g, '') === c.rice.replace(/かえる|Change|\s/g, '');
    const act = async (name, fn, expectSame = true) => {
      const a = await snap(); await p.evaluate(fn); await p.waitForTimeout(500); const c = await snap();
      if (expectSame && !same(a, c)) bad(name, cc + ' ' + JSON.stringify(a.ids) + ' -> ' + JSON.stringify(c.ids)); else ok(name);
      return {a, c};
    };
    // 献立に出ていない食材を苦手にする（たこ・いか・貝なども「魚介」に入るので、献立にあれば無関係な苦手にならない）
    await act('avoid-chip-unrelated', () => { const ings = new Set(session.menu.items.flatMap(x => x.r.items.map(i => i.key))); const cand = ['えび','あさり','鮭','shrimp','shellfish','salmon'].find(k => !ings.has(k)); S.settings.avoid = ['@shellfish']; if (session.menu.items.some(x => x.r && isAvoided(x.r))) S.settings.avoid = ['@dairy_unrelated_zzz']; save(); reconcileMenu(); refreshWeek(); render(); });
    await act('toggle-swap', () => { S.settings.avoidSwap = false; save(); reconcileMenu(); refreshWeek(); render(); });
    await act('toggle-swap-back', () => { S.settings.avoidSwap = true; save(); reconcileMenu(); refreshWeek(); render(); });
    await act('avoid-days', () => { S.settings.avoidDays = 21; save(); render(); });
    await act('make-week', () => { makeWeek(); render(); });
    await act('same-country', async () => { await setCountry(currentCountry()); render(); });
    await act('open-settings', () => { setTab('settings'); setTab('today'); });
    await act('onboard-again', () => { startOnboard(); sheet.avoid = new Set(S.settings.avoid); closeSheet(); reconcileMenu(); render(); });
    // 国の組み合わせ: 副菜だけ別の国 → 副菜の枠だけ変わる
    const m1 = await snap();
    await p.evaluate(() => { S.settings.mix = {'副菜': currentCountry() === 'KR' ? 'JP' : 'KR'}; save(); reconcileMenu(); render(); });
    await p.waitForTimeout(1200); await p.evaluate(() => { reconcileMenu(); render(); }); await p.waitForTimeout(500);
    const m2 = await snap();
    const slots = await p.evaluate(() => session.menu.items.map(x => x.slot));
    const nonSideChanged = m1.ids.some((x, j) => slots[j] !== '副菜' && x !== m2.ids[j]);
    if (nonSideChanged) bad('mix-side-only', cc + JSON.stringify(m1.ids) + '->' + JSON.stringify(m2.ids)); else ok('mix-side-only');
    await p.evaluate(() => { S.settings.mix = {}; save(); reconcileMenu(); render(); }); await p.waitForTimeout(400);
    // 言語を変える（主菜を別の国にしてから）
    await p.evaluate(() => { S.settings.mix = {'主菜': currentCountry() === 'CN' ? 'JP' : 'CN'}; save(); reconcileMenu(); render(); }); await p.waitForTimeout(1500);
    await p.evaluate(() => { reconcileMenu(); render(); }); await p.waitForTimeout(500);
    await p.evaluate(() => { session.mood = 'fish'; });
    const before = await snap();
    await p.evaluate(async () => { S.settings.uiLang = 'en'; save(); await setLang('en'); await refreshRecipes(); render(); }); await p.waitForTimeout(1500);
    const after = await snap();
    if (after.ids.includes('-') || JSON.stringify(before.ids) !== JSON.stringify(after.ids)) bad('lang-keeps-menu', cc + JSON.stringify(before.ids) + '->' + JSON.stringify(after.ids)); else ok('lang-keeps-menu');
    if (after.mood !== 'fish') bad('lang-keeps-mood', after.mood); else ok('lang-keeps-mood');
    await ctx.close();
  }
  console.log(JSON.stringify(res), 'errs', errs.slice(0, 3));
  await b.close();
})();
