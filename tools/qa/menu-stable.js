// 「押していない料理は絶対に変わらない」ことを、設定まわりの操作ごとに繰り返し確かめる
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const QUICK = process.env.QUICK === '1', REPS = Number(process.env.REPS || (QUICK ? 1 : 5));   // 失敗したら SEED=<表示された値> で同じ乱数・同じ国・同じ操作列を再現できる
const BASE = BASE_;
(async () => {
  const b = await chromium.launch(LAUNCH);
  const res = {}; const errs = [];
  let cur = '';   // いまの国・回・直前までの操作列（失敗時に表示する）
  const trail = [];
  const bad = (name, info) => { res[name] = (res[name] || 0) + 1; if (res[name] <= 2) console.log('BAD', name, info, '\n  再現: SEED=' + SEED + ' ' + cur + ' 操作列=' + trail.join('>')); };
  const ok = name => { res['ok:' + name] = (res['ok:' + name] || 0) + 1; };
  for (let rep = 0; rep < REPS; rep++) for (const [cc, extra] of [['JP', {}], ['US', {}], ['KR', {}]]) {
    const ctx = await b.newContext({viewport:{width:390,height:900}}); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    cur = 'CC=' + cc + ' rep=' + rep; trail.length = 0; await ctx.addInitScript(seedScript(seedFor('menu-stable', cc, rep)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + e.message));
    await p.addInitScript(([cc]) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:'2026-10-26', settings:{country:cc, dishCount:4}})); } }, [cc]);
    await p.goto(BASE); await ready(p);
    await p.evaluate(() => { window.hasPro = () => true; session.menu = null; render(); });
    // 献立は今日の画面を描いたときに作られる（起動・国の組み合わせの読みこみ中は「読みこみ中…」で、まだない）。できるまで待ってから読む
    const menuReady = () => p.waitForFunction(() => typeof session !== 'undefined' && !!session.menu, null, {timeout: 30000}).catch(() => {});
    await menuReady();
    const snap = async () => { await menuReady(); return p.evaluate(() => ({ids: session.menu ? session.menu.items.map(x => x.r ? x.r.id : '-') : ['(献立なし)'], mood: session.mood, rice: (document.querySelector('.tray .spot.rice') || {}).textContent || ''})); };
    const same = (a, c) => JSON.stringify(a.ids) === JSON.stringify(c.ids) && a.rice.replace(/かえる|Change|\s/g, '') === c.rice.replace(/かえる|Change|\s/g, '');
    const act = async (name, fn, expectSame = true) => {
      trail.push(name); const a = await snap(); await p.evaluate(fn); await p.waitForTimeout(500); const c = await snap();
      if (expectSame && !same(a, c)) bad(name, cc + ' ' + JSON.stringify(a.ids) + ' -> ' + JSON.stringify(c.ids)); else ok(name);
      return {a, c};
    };
    // 献立に出ていない食材を苦手にする（たこ・いか・貝なども「魚介」に入るので、献立にあれば無関係な苦手にならない）
    await act('avoid-chip-unrelated', () => { S.settings.avoid = ['@shellfish']; if (session.menu.items.some(x => x.r && isAvoidedCore(x.r))) S.settings.avoid = ['@dairy_unrelated_zzz']; save(); reconcileMenu(); refreshWeek(); render(); });
    // 置き換えをオフにする: 置き換えて出していた料理（貝・えびを鶏肉にしたクラムチャウダー・トムヤムクン・海鮮チヂミなど）は出せなくなるので、その枠だけ選び直すのが正しい。
    // ほかの枠は動かない・出せなくなった枠は残らない、を確かめる（「全部同じ」とは見ない）
    {
      trail.push('toggle-swap');
      const dep = await p.evaluate(() => { S.settings.avoidSwap = false; const d = session.menu.items.map(x => !!x.r && isAvoidedCore(x.r)); S.settings.avoidSwap = true; return d; });
      const a = await snap(); await p.evaluate(() => { S.settings.avoidSwap = false; save(); reconcileMenu(); refreshWeek(); render(); }); await p.waitForTimeout(500); const c = await snap();
      const wrong = a.ids.map((id, j) => dep[j] ? (c.ids[j] === id ? 'slot' + j + ' 出せないのに残った ' + id : '') : (c.ids[j] !== id ? 'slot' + j + ' ' + id + '→' + c.ids[j] : '')).filter(Boolean);
      if (wrong.length || a.ids.length !== c.ids.length || a.rice.replace(/かえる|Change|\s/g, '') !== c.rice.replace(/かえる|Change|\s/g, '')) bad('toggle-swap', cc + ' ' + JSON.stringify(a.ids) + ' -> ' + JSON.stringify(c.ids) + ' ' + wrong.join(' ; ')); else ok('toggle-swap');
    }
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
  console.log(JSON.stringify(res), 'errs', errs.slice(0, 3), 'SEED', SEED);
  await b.close();
  if (Object.keys(res).some(k => !k.startsWith('ok:')) || errs.length) process.exitCode = 1;
})();
