// 「ある料理を変えると、ほかの料理（とくに汁もの）まで連動して変わる」不具合を、あらゆる経路で確かめる
//   操作の前後で「押した枠以外」の全料理ID・ご飯/主食の欄・汁もの・画像（お膳の各枠のHTML）・
//   1週間プラン・買い物リスト・記録（履歴）・お気に入り・決定済みの献立・保存した献立・設定が完全に一致することを検証する。
// 使い方: cd gohancho && python3 -m http.server 8765 &   →   node tools/qa/linkage-all.js
//   BASE=http://localhost:8792/  アプリのURL（既定 8765）
//   REPS=3    1ボタンあたりの回数（既定 3）
//   CCS=JP,US 国を絞る（既定は全21か国）
//   ONLY=matrix,mix  走らせる区画を絞る（matrix,mix,mood,one,saved,family,avoid,decided,week,lang,soup）
//   JOBS=3    並列数（既定 3）    LOG=path  不一致を全部このファイルに書く
// 合格は「BAD 0」。BAD の行に、国・品数・操作・変わった枠が出る。
const fs = require('fs');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const BASE = process.env.BASE || 'http://localhost:8765/';
const REPS = Number(process.env.REPS || 3), JOBS = Number(process.env.JOBS || 3);
const ALL_CC = 'JP,US,GB,FR,DE,IT,ES,PL,TR,EG,IN,CN,TW,KR,TH,VN,ID,PH,MX,BR,PE'.split(',');
const CCS = (process.env.CCS || ALL_CC.join()).split(',');
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const want = n => !ONLY || ONLY.has(n);
const logLines = []; const errs = [];
const stat = {}; // 区画 -> {taps, bad}
const log = (...a) => { const s = a.join(' '); logLines.push(s); if (process.env.LOG) fs.appendFileSync(process.env.LOG, s + '\n'); };
const BAD_SHOW = Number(process.env.BAD_SHOW || 40); let shown = 0;
function bad(area, msg) { stat[area].bad++; log('BAD [' + area + '] ' + msg); if (shown++ < BAD_SHOW) console.log('BAD [' + area + '] ' + msg); }
const area = a => (stat[a] = stat[a] || { taps: 0, bad: 0, notes: {} });
const note = (a, k) => { area(a).notes[k] = (area(a).notes[k] || 0) + 1; };

/* ---- ページの中で動く道具（スナップショット） ---- */
const PAGE_LIB = `
window.__snap = (opts) => {
  opts = opts || {};
  const m = session.menu;
  const spots = [...document.querySelectorAll('.tray .spot')].map((sp, k) => {
    const sa = sp.querySelector('[data-act="soup-add"]');
    const b = sp.querySelector('[data-act="reroll"]') || sa; const c = sp.cloneNode(true); c.querySelectorAll('.swap').forEach(x => x.remove());
    // 空の汁もの枠の説明文は、主菜が変わると言い方が変わる（「汁ものの麺なので、なし」「汁ものは入れていません」）。料理ではないので「空」とだけ比べる
    return {key: b ? 'i' + b.dataset.i : sp.classList.contains('rice') ? 'rice' : 'x' + k, html: sa ? 'EMPTY-SOUP' : c.outerHTML.replace(/ style="[^"]*"/g, '').replace(/ rise-in/g, '')};   // 幅(--w)は品数・主食の有無で変わる配置なので比べない
  });
  const ings = m ? m.items.map(x => x.r ? x.r.items.map(i => i.key + ':' + i.label + ':' + i.qty).join(',') : '-') : [];
  let shop = ''; try { shop = JSON.stringify(shoppingList()); } catch (e) { shop = 'ERR'; }
  const st = JSON.parse(JSON.stringify(S.settings)); delete st.stapleBy;
  return {
    n: m && m.n, adj: !!(m && m.adj), mood: session.mood,
    ids: m ? m.items.map(x => x.slot + ':' + (x.r ? x.r.id : '-')) : [],
    ings, spots, rice: (document.querySelector('.tray .spot.rice') || {}).textContent || '',
    staple: JSON.stringify((S.settings || {}).stapleBy || {}),
    week: JSON.stringify(S.week), hist: JSON.stringify(S.history), favs: JSON.stringify(S.favs), hidden: JSON.stringify(S.hidden),
    cook: JSON.stringify(S.cook), saved: JSON.stringify(S.savedMenus), shop, settings: JSON.stringify(st), draftIds: JSON.stringify(S.draft && S.draft.ids),
    bad: m ? m.items.filter(x => x.r && isAvoided(x.r)).map(x => x.r.id) : [],
    dup: m ? m.items.map(x => x.r && x.r.id).filter(Boolean).length - new Set(m.items.map(x => x.r && x.r.id).filter(Boolean)).size : 0,
  };
};
window.__press = (k) => { const bt = document.querySelectorAll('.tray [data-act="reroll"]')[k]; if (!bt) return -1; const i = Number(bt.dataset.i); bt.click(); return i; };
window.__pressStaple = () => { const bt = document.querySelector('.tray [data-act="staple-next"]'); if (!bt) return false; bt.click(); return true; };
window.__nBtn = () => document.querySelectorAll('.tray [data-act="reroll"]').length;
`;

/* ---- 比べる ---- */
// pressed: 押した枠の番号（料理の押下）、'staple'（主食ボタン）、null（何も押していない操作＝すべて同じのはず）
function diff(a, c, pressed, o = {}) {
  const d = [];
  const pk = pressed === null || pressed === 'staple' ? null : 'i' + pressed;
  if (a.ids.length !== c.ids.length) d.push('品数 ' + a.ids.length + '->' + c.ids.length);
  else a.ids.forEach((x, j) => { if (j !== pressed && x !== c.ids[j]) d.push('料理#' + j + ' ' + x + ' -> ' + c.ids[j]); });
  if (o.idsOnly) { if (a.ids.join() !== c.ids.join()) d.push('料理 ' + a.ids.join() + ' -> ' + c.ids.join()); ['week', 'favs', 'hidden', 'cook'].forEach(k => { if (a[k] !== c[k]) d.push(k); }); if (a.adj !== c.adj || a.n !== c.n) d.push('品数/あと1品 ' + a.n + (a.adj ? '+' : '') + '->' + c.n + (c.adj ? '+' : '')); return d; }   // 言語を変えると名前・材料の表示は変わるので、料理のIDだけ比べる
  a.ings.forEach((x, j) => { if (j !== pressed && c.ings[j] !== undefined && x !== c.ings[j] && a.ids[j] === c.ids[j]) d.push('材料#' + j); });
  a.spots.forEach(sp => {
    if (sp.key === pk) return; if (pressed === 'staple' && sp.key === 'rice') return;
    const q = c.spots.find(y => y.key === sp.key);
    if (!q) d.push('枠が消えた ' + sp.key); else if (q.html !== sp.html) d.push('枠の表示(画像・名前) ' + sp.key);
  });
  if (pressed !== 'staple' && c.spots.length !== a.spots.length) d.push('枠の数 ' + a.spots.length + '->' + c.spots.length);
  if (pressed !== 'staple') { if (a.rice.replace(/かえる|Change|\s/g, '') !== c.rice.replace(/かえる|Change|\s/g, '')) d.push('ご飯/主食欄'); if (a.staple !== c.staple) d.push('主食の設定'); }
  const keys = ['week', 'hist', 'favs', 'hidden', 'cook', 'saved', 'shop', 'settings'].filter(k => !(o.skip || []).includes(k));
  keys.forEach(k => { if (a[k] !== c[k]) d.push(k === 'week' ? '1週間プラン' : k === 'hist' ? '履歴' : k === 'favs' ? 'お気に入り' : k === 'shop' ? '買い物リスト' : k === 'cook' ? '決定済み(S.cook)' : k === 'saved' ? '保存した献立' : k); });
  if (a.mood !== c.mood) d.push('気分 ' + a.mood + '->' + c.mood);
  if (a.adj !== c.adj || a.n !== c.n) d.push('品数/あと1品 ' + a.n + (a.adj ? '+' : '') + '->' + c.n + (c.adj ? '+' : ''));
  return d;
}

/* ---- 開く ---- */
async function open(b, { cc, n = 'auto', settings = {}, state = {}, wait = 1500, pro = true }) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ' ' + e.message));
  await p.addInitScript(([cc, n, settings, state]) => {
    if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({ onboarded: true, firstUse: '2026-10-26', settings: Object.assign({ country: cc, dishCount: n }, settings) }, state))); }
  }, [cc, n, settings, state]);
  await p.addInitScript(PAGE_LIB);
  await p.goto(BASE); await p.waitForTimeout(wait);
  await p.evaluate(pro => { if (pro) window.hasPro = () => true; session.menu = null; render(); }, pro);
  await p.waitForTimeout(100);
  return { ctx, p };
}
const snap = p => p.evaluate(() => window.__snap());

// 全部の「かえる」（と主食）を何度か押して、押した枠以外が変わらないことを確かめる
async function pressAll(p, a, label, o = {}) {
  const reps = o.reps || REPS;
  const nb = await p.evaluate(() => window.__nBtn());
  for (let rep = 0; rep < reps; rep++) {
    for (let k = 0; k < nb; k++) {
      const s0 = await snap(p); const i = await p.evaluate(k => window.__press(k), k); const s1 = await snap(p); area(a).taps++;
      const d = diff(s0, s1, i, o);
      if (d.length) bad(a, label + ' 押した=' + s0.ids[i] + ' => ' + d.join(' | '));
      if (o.checkAvoid && s1.bad.length) bad(a, label + ' 押した=' + s0.ids[i] + ' => 苦手/アレルギーの料理が出た ' + s1.bad.join());
      if (s1.dup > s0.dup) note(a, '同じ料理が重なった(参考)');
    }
    if (o.staple !== false) {
      const s0 = await snap(p); const ok = await p.evaluate(() => window.__pressStaple());
      if (ok) { const s1 = await snap(p); area(a).taps++; const d = diff(s0, s1, 'staple', o); if (d.length) bad(a, label + ' 主食を押した => ' + d.join(' | ')); }
    }
  }
}
// 何も押さない設定まわりの操作が、料理を1つも変えないこと
async function stays(p, a, label, fn, o = {}) {
  const s0 = await snap(p); await p.evaluate(fn, o.arg); await p.waitForTimeout(o.wait || 400); const s1 = await snap(p); area(a).taps++;
  const d = diff(s0, s1, null, o);
  if (d.length) bad(a, label + ' => ' + d.join(' | '));
  return { s0, s1 };
}

/* ---- 各区画 ---- */
// 1. 全国 × 品数 × 全ボタン（主菜・副菜・汁もの・ご飯/主食）
async function secMatrix(b, cc) {
  for (const n of [2, 3, 4, 5, 6, 'auto']) {
    const { ctx, p } = await open(b, { cc, n });
    await pressAll(p, 'matrix', cc + ' n=' + n);
    await ctx.close();
  }
}
// 2. 汁もの専用: 汁ものだけを何度も押す／主菜と副菜だけを何度も押して汁ものが動かない
async function secSoup(b, cc) {
  for (const n of [2, 3, 4, 5, 'auto']) {
    const { ctx, p } = await open(b, { cc, n });
    for (let rep = 0; rep < REPS * 3; rep++) {
      const nb = await p.evaluate(() => window.__nBtn());
      for (let k = 0; k < nb; k++) {
        const s0 = await snap(p); const i = await p.evaluate(k => window.__press(k), k); const s1 = await snap(p); area('soup').taps++;
        const slot = s0.ids[i].split(':')[0];
        const soupIdx = s0.ids.map((x, j) => x.startsWith('汁物:') ? j : -1).filter(j => j >= 0);
        if (slot !== '汁物') soupIdx.forEach(j => { if (s0.ids[j] !== s1.ids[j]) bad('soup', cc + ' n=' + n + ' ' + s0.ids[i] + ' を押したら汁ものが ' + s0.ids[j] + ' -> ' + s1.ids[j]); });
        if (slot === '汁物') s0.ids.forEach((x, j) => { if (j !== i && x !== s1.ids[j]) bad('soup', cc + ' n=' + n + ' 汁もの ' + s0.ids[i] + ' を押したら #' + j + ' ' + x + ' -> ' + s1.ids[j]); });
      }
    }
    await ctx.close();
  }
}
// 3. 国のミックス（主菜だけ別の国など）での「かえる」と、ミックスを変えたときに変わるのはその枠だけ
async function secMix(b, cc) {
  const others = ALL_CC.filter(x => x !== cc); const pick = i => others[(ALL_CC.indexOf(cc) * 3 + i) % others.length];
  const combos = [{ '主菜': pick(0) }, { '副菜': pick(1) }, { '汁物': pick(2) }, { '主菜': pick(3), '汁物': pick(4) }, { '主菜': pick(5), '副菜': pick(6), '汁物': pick(7) }];
  for (const mix of combos) {
    const { ctx, p } = await open(b, { cc, n: 4 });
    // 先に基準の献立を見る → ミックスを選ぶ（実際の操作と同じ: プルダウンを変える）
    const s0 = await snap(p);
    for (const [slot, mc] of Object.entries(mix)) {
      const before = await snap(p);
      await p.evaluate(([slot, mc]) => { const sel = document.querySelector('select[data-act="mix"][data-slot="' + slot + '"]'); sel.value = mc; sel.dispatchEvent(new Event('change', { bubbles: true })); }, [slot, mc]);
      await p.waitForTimeout(1800);   // その国のデータを読みこむ
      const after = await snap(p); area('mix').taps++;
      const slots = before.ids.map(x => x.split(':')[0]);
      before.ids.forEach((x, j) => { if (slots[j] !== slot && x !== after.ids[j]) bad('mix', cc + ' 混ぜる ' + slot + '=' + mc + ' ' + JSON.stringify(mix) + ' なのに ' + slots[j] + ' が ' + x + ' -> ' + after.ids[j]); });
      // 選んだ枠が本当にその国の料理になっているか（読みこみ前に家の国から選ばれたままになっていないか）
      const wrong = await p.evaluate(([slot, mc]) => session.menu.items.filter(x => x.slot === slot && x.r && (x.r.pack || 'JP') !== mc).map(x => x.r.id + '(' + (x.r.pack || 'JP') + ')'), [slot, mc]);
      if (wrong.length) bad('mix', cc + ' ' + slot + ' を ' + mc + ' に混ぜたのに、別の国の料理のまま ' + wrong.join());
    }
    await pressAll(p, 'mix', cc + ' mix=' + JSON.stringify(mix), { staple: true });
    // そのあと関係ない操作（苦手の追加→削除）でも、押していない料理は変わらない
    await stays(p, 'mix', cc + ' mix 再調整 ' + JSON.stringify(mix), () => { reconcileMenu(); render(); });
    await stays(p, 'mix', cc + ' mix ヒット無関係の苦手 ' + JSON.stringify(mix), () => { S.settings.avoid = ['@dairy']; save(); const ids = menuIds(); const bad0 = session.menu.items.some(x => x.r && isAvoided(x.r)); if (!bad0) { reconcileMenu(); render(); } else { S.settings.avoid = []; save(); } S.settings.avoid = []; save(); });
    await ctx.close();
  }
}
// 4. 気分（魚・お肉・ラク・お弁当など）の最中の「かえる」
async function secMood(b, cc) {
  for (const mood of ['all', 'quick', 'easy', 'bento', '和', '洋', '中', 'asia', 'fish', 'meat']) {
    const { ctx, p } = await open(b, { cc, n: 'auto' });
    const has = await p.evaluate(m => MOODS.some(x => x.k === m), mood); if (!has) { await ctx.close(); continue; }
    await p.evaluate(m => { document.querySelector('[data-act="mood"][data-k="' + m + '"]').click(); }, mood);
    await p.waitForTimeout(200);
    await pressAll(p, 'mood', cc + ' mood=' + mood);
    await ctx.close();
  }
}
// 5. あと1品（足す・埋める・かえる）のあとの「かえる」と、あと1品で増えた品数が設定変更や言語で崩れないこと
async function secOne(b, cc) {
  for (const n of [2, 3, 4]) {
    const { ctx, p } = await open(b, { cc, n });
    // 副菜か汁ものを1つ足す
    const added = await p.evaluate(() => {
      const m = session.menu, have = new Set(menuIds());
      const cand = (RECIPES || []).filter(r => !have.has(r.id) && !isAvoided(r) && (r.type === '副菜' || r.type === '汁物'));
      for (const r of cand) { const w = oneWhere(r); if (w && w.mode === 'add') { oneAdd(r.id); return r.id + ':' + w.slot; } }
      for (const r of cand) { const w = oneWhere(r); if (w && w.mode === 'replace') { oneAdd(r.id); return r.id + ':replace'; } }
      return null;
    });
    await p.waitForTimeout(300);
    if (added) {
      await pressAll(p, 'one', cc + ' n=' + n + ' あと1品=' + added);
      // 品数が増えたままの献立は、無関係な設定変更・言語切替・再調整でも崩れない
      await stays(p, 'one', cc + ' n=' + n + ' あと1品のあと 苦手(無関係)を足す/外す', () => { S.settings.avoidDays = 14; save(); reconcileMenu(); refreshWeek(); render(); }, { skip: ['settings'] });
      await stays(p, 'one', cc + ' n=' + n + ' あと1品のあと 言語を en にする', async () => { S.settings.uiLang = 'en'; save(); await setLang('en'); await refreshRecipes(); relocalize(); render(); }, { wait: 1500, idsOnly: true });
      await stays(p, 'one', cc + ' n=' + n + ' あと1品のあと 言語切替後の再調整', () => { reconcileMenu(); render(); });
      await stays(p, 'one', cc + ' n=' + n + ' あと1品のあと 言語を ja に戻す', async () => { S.settings.uiLang = 'ja'; save(); await setLang('ja'); await refreshRecipes(); relocalize(); render(); }, { wait: 1500, idsOnly: true });
      await stays(p, 'one', cc + ' n=' + n + ' あと1品のあと 再調整', () => { reconcileMenu(); render(); });
    }
    await ctx.close();
  }
}
// 6. 保存した献立の適用 → かえる
async function secSaved(b, cc) {
  for (const n of [3, 5]) {
    const { ctx, p } = await open(b, { cc, n });
    const s0 = await snap(p);
    await p.evaluate(() => { saveMenu(); });
    const sm = await p.evaluate(() => (S.savedMenus || [])[0] && S.savedMenus[0].id);
    // 品数を変えてから、保存した献立を適用（別の品数・別の献立）
    await p.evaluate(async m => { S.settings.dishCount = m; save(); session.menu = null; render(); }, n === 3 ? 4 : 3);
    await p.waitForTimeout(200);
    await p.evaluate(id => applySavedMenu(id), sm); await p.waitForTimeout(300);
    const s1 = await snap(p); area('saved').taps++;
    if (s1.ids.join() !== s0.ids.join()) bad('saved', cc + ' n=' + n + ' 保存した献立を適用したのに ' + s0.ids.join() + ' -> ' + s1.ids.join());
    await pressAll(p, 'saved', cc + ' 保存献立適用後 n=' + n);
    // 設定の品数と違う保存献立のあとに、無関係な設定変更をしても全体は作り直されない
    await stays(p, 'saved', cc + ' 保存献立適用後 再調整(n=' + n + ')', () => { reconcileMenu(); render(); });
    await stays(p, 'saved', cc + ' 保存献立適用後 言語 en->ja (n=' + n + ')', async () => { S.settings.uiLang = 'en'; save(); await setLang('en'); await refreshRecipes(); relocalize(); render(); reconcileMenu(); render(); }, { wait: 1500, idsOnly: true });
    await ctx.close();
  }
}
// 6b. 国ミックスで保存した献立の復元（保存 → ミックスをやめて別の献立 → 復元）。復元した献立は保存と同じで、そのあとの「かえる」・再調整・言語切替でも押していない枠は変わらない
async function secSavedMix(b, cc) {
  const others = ALL_CC.filter(x => x !== cc); const pick = i => others[(ALL_CC.indexOf(cc) * 3 + i) % others.length];
  for (const mix of [{ '主菜': pick(0), '汁物': pick(1) }, { '副菜': pick(2) }, { '主菜': pick(3), '副菜': pick(4), '汁物': pick(5) }]) {
    const { ctx, p } = await open(b, { cc, n: 4 });
    for (const [slot, mc] of Object.entries(mix)) {
      await p.evaluate(([slot, mc]) => { const sel = document.querySelector('select[data-act="mix"][data-slot="' + slot + '"]'); sel.value = mc; sel.dispatchEvent(new Event('change', { bubbles: true })); }, [slot, mc]);
      await p.waitForTimeout(1800);
    }
    const s0 = await snap(p);
    const sm = await p.evaluate(() => { saveMenu(); return S.savedMenus[0] && S.savedMenus[0].id; });
    await p.evaluate(() => { S.settings.mix = {}; save(); session.menu = null; render(); }); await p.waitForTimeout(200);
    await p.evaluate(id => applySavedMenu(id), sm); await p.waitForTimeout(2500);
    const s1 = await snap(p); area('savedmix').taps++;
    if (s1.ids.join() !== s0.ids.join()) bad('savedmix', cc + ' ' + JSON.stringify(mix) + ' 復元した献立が保存と違う ' + s0.ids.join() + ' -> ' + s1.ids.join());
    await stays(p, 'savedmix', cc + ' 復元後 再調整 ' + JSON.stringify(mix), () => { reconcileMenu(); refreshWeek(); render(); });
    await pressAll(p, 'savedmix', cc + ' 復元後 ' + JSON.stringify(mix), { reps: 2 });
    // 復元した献立のあとの言語切替でも料理は変わらない
    await stays(p, 'savedmix', cc + ' 復元後 言語 en', async () => { S.settings.uiLang = 'en'; save(); await setLang('en'); await refreshRecipes(); relocalize(); render(); reconcileMenu(); render(); }, { wait: 1500, idsOnly: true });
    await ctx.close();
  }
}
// 6c. 手に入りにくい食材を登録・解除しても、使っていない枠は変わらない。登録後の「かえる」で登録した食材を使う料理が出ない
async function secScarce(b, cc) {
  for (const n of [3, 5]) {
    const { ctx, p } = await open(b, { cc, n });
    const s0 = await snap(p);
    const word = await p.evaluate(() => { const m = session.menu, k = new Set(m.items[0].r.items.map(g => g.key)); const it = m.items.slice(1).flatMap(x => x.r ? x.r.items : []).find(g => !g.opt && g.label && g.label.length >= 2 && !k.has(g.key)); return it ? it.label : null; });
    if (word) {
      // 登録した食材（同じ食材として照らされる言い方も含む）を必須に使っている枠。登録だけして、選び直す前に調べる
      const used = await p.evaluate(w => { S.settings.scarce = [w]; save(); return session.menu.items.map(x => !!(x.r && isScarce(x.r))); }, word);
      await p.evaluate(() => { reconcileMenu(); refreshWeek(); render(); });
      const s1 = await snap(p); area('scarce').taps++;
      s0.ids.forEach((x, j) => { if (x !== s1.ids[j] && !used[j]) bad('scarce', cc + ' n=' + n + ' 登録=' + word + ' 使っていない枠#' + j + ' が ' + x + ' -> ' + s1.ids[j]); });
      await pressAll(p, 'scarce', cc + ' n=' + n + ' 登録=' + word, { checkAvoid: true, reps: 2 });
      const bad0 = await p.evaluate(() => session.menu.items.filter(x => x.r && isScarce(x.r)).map(x => x.r.id));
      if (bad0.length) bad('scarce', cc + ' 登録した食材を使う料理が出た ' + bad0.join());
      // 解除: 何も変わらない
      await stays(p, 'scarce', cc + ' n=' + n + ' 解除', () => { S.settings.scarce = []; save(); reconcileMenu(); refreshWeek(); render(); }, { skip: ['settings'] });
    }
    await ctx.close();
  }
}
// 7. 家族プロフィール（アレルギー）
async function secFamily(b, cc) {
  for (const fam of ['shellfish', 'egg', 'fish', 'pork', 'dairy', 'nuts', 'wheat']) {
    const { ctx, p } = await open(b, { cc, n: 4, state: { family: [{ id: 'f1', name: 'A', role: 'child', avoid: ['@' + fam], allergy: ['@' + fam], mild: false }, { id: 'f2', name: 'B', role: 'adult', avoid: [], allergy: [], mild: true }] } });
    await p.evaluate(() => { session.menu = null; render(); }); await p.waitForTimeout(150);
    await pressAll(p, 'family', cc + ' アレルギー=' + fam, { checkAvoid: true });
    // 食べる人を外す/戻す
    await ctx.close();
  }
}
// 8. 苦手食材（置き換え有効/無効）
async function secAvoid(b, cc) {
  for (const [fam, swap] of [['pork', true], ['chicken', true], ['fish', true], ['egg', true], ['shellfish', false], ['beef', true]]) {
    const { ctx, p } = await open(b, { cc, n: 4, settings: { avoid: ['@' + fam], avoidSwap: swap } });
    await p.evaluate(() => { session.menu = null; render(); }); await p.waitForTimeout(150);
    await pressAll(p, 'avoid', cc + ' 苦手=' + fam + ' 置き換え=' + swap, { checkAvoid: true });
    // 献立にある料理に使われていない食材を苦手にしても、ほかは変わらない／使われている食材なら、その枠だけ
    const s0 = await snap(p);
    await p.evaluate(() => { const m = session.menu; const r = m.items[1] && m.items[1].r; if (!r) return; const key = r.items.find(i => !i.opt && FAMILY[i.key] && i.key !== r.protein) || r.items.find(i => !i.opt); if (key) { S.settings.avoid.push(key.name); save(); reconcileMenu(); refreshWeek(); render(); } });
    const s1 = await snap(p); area('avoid').taps++;
    const changed = s0.ids.map((x, j) => x !== s1.ids[j] ? j : -1).filter(j => j >= 0);
    // 変わった枠は、苦手にした食材を使っていた枠だけであるべき（仕様として必要な再選択）。ここでは「苦手を使う料理が残っていない」ことと変更枠数を記録
    if (s1.bad.length) bad('avoid', cc + ' 苦手を足したのに苦手の料理が残った ' + s1.bad.join());
    note('avoid', '苦手追加で再選択された枠=' + changed.length);
    await ctx.close();
  }
}
// 9. 決定済み(S.cook)のあと
async function secDecided(b, cc) {
  for (const n of [3, 4]) {
    const { ctx, p } = await open(b, { cc, n });
    await p.evaluate(() => { document.querySelector('[data-act="decide"]').click(); }); await p.waitForTimeout(500);
    await p.evaluate(() => setTab('today')); await p.waitForTimeout(200);
    // 「食べる時刻から逆算」は現在時刻の文字が入るので比べない
    const cookTab = async () => { await p.evaluate(() => setTab('cook')); const h = await p.evaluate(() => { const c = document.querySelector('#view').cloneNode(true); c.querySelectorAll('.eat-plan').forEach(x => x.remove()); return c.innerHTML.replace(/\s+/g, ' '); }); await p.evaluate(() => setTab('today')); return h; };
    const c0 = await cookTab();
    await pressAll(p, 'decided', cc + ' 決定後 n=' + n, { reps: 2 });
    // 作り方タブは「決めた献立」のまま（かえる で作り方タブの料理が変わらない）
    const c1 = await cookTab(); area('decided').taps++;
    if (c0 !== c1) bad('decided', cc + ' 決定後に「かえる」を押したら作り方タブが変わった n=' + n);
    // 決めた献立は、アプリを開き直しても同じ
    await ctx.close();
  }
}
// 10. 1週間プラン内の日の「かえる」・他の日・買い物リストが変わらない
async function secWeek(b, cc) {
  for (const sides of [false, true]) {
    const { ctx, p } = await open(b, { cc, n: 4, settings: { weekSides: sides } });
    await p.evaluate(() => { makeWeek(); render(); }); await p.waitForTimeout(300);
    await pressAll(p, 'week', cc + ' プラン後 副菜汁もの=' + sides, { reps: 2 });
    // プランの今日の主菜を使う → その後は、主菜以外を変えない（空き枠以外）
    const s0 = await snap(p);
    await p.evaluate(() => { const b = document.querySelector('[data-act="use-plan"]'); if (b) b.click(); }); await p.waitForTimeout(200);
    const s1 = await snap(p); area('week').taps++;
    const sl = s0.ids.map((x, j) => x !== s1.ids[j] ? j : -1).filter(j => j >= 0);
    if (sl.some(j => j !== 0 && !s0.ids[j].endsWith(':-') && !(s1.ids[0].split(':')[1] === s0.ids[j].split(':')[1]) && !(s0.ids[j].startsWith('主菜')))) bad('week', cc + ' プランの主菜を献立にしたら主菜以外が変わった ' + s0.ids.join() + ' -> ' + s1.ids.join());
    if (s0.week !== s1.week) bad('week', cc + ' プランの主菜を献立にしたらプランが変わった');
    await pressAll(p, 'week', cc + ' プラン主菜を使った後', { reps: 1 });
    await ctx.close();
  }
}
// 11. 言語切替・履歴・お気に入りがあるとき
async function secLang(b, cc) {
  const { ctx, p } = await open(b, { cc, n: 4, state: { favs: [], history: [] } });
  await p.evaluate(() => { const m = session.menu; m.items.forEach((x, i) => { if (i % 2 === 0 && x.r) S.favs.push(x.r.id); }); record(m.items[1].r.id, m.items[1].slot, addDays(TODAY, -3)); save(); render(); });
  await pressAll(p, 'lang', cc + ' お気に入り/履歴あり', { reps: 2 });
  for (const lg of ['en', 'ja']) {
    await stays(p, 'lang', cc + ' 言語=' + lg, async lg => { S.settings.uiLang = lg; save(); await setLang(lg); await refreshRecipes(); relocalize(); render(); }, { arg: lg, wait: 1500, idsOnly: true });
  }
  await pressAll(p, 'lang', cc + ' 言語切替後', { reps: 1 });
  await ctx.close();
}

const SECTIONS = [['matrix', secMatrix], ['soup', secSoup], ['mix', secMix], ['mood', secMood], ['one', secOne], ['saved', secSaved], ['savedmix', secSavedMix], ['scarce', secScarce], ['family', secFamily], ['avoid', secAvoid], ['decided', secDecided], ['week', secWeek], ['lang', secLang]];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const jobs = [];
  for (const [name, fn] of SECTIONS) if (want(name)) { area(name); for (const cc of CCS) jobs.push([name, fn, cc]); }
  let done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: JOBS }, async () => {
    while (jobs.length) {
      const [name, fn, cc] = jobs.shift();
      try { await fn(b, cc); } catch (e) { errs.push(name + ' ' + cc + ' ' + e.message.split('\n')[0]); }
      if (++done % 21 === 0) console.error('..', done, Math.round((Date.now() - t0) / 1000) + 's');
    }
  }));
  let totalBad = 0, totalTaps = 0;
  for (const [k, v] of Object.entries(stat)) { totalBad += v.bad; totalTaps += v.taps; console.log(k.padEnd(8), 'taps', String(v.taps).padStart(6), 'bad', v.bad, Object.keys(v.notes).length ? JSON.stringify(v.notes) : ''); }
  console.log('TOTAL taps', totalTaps, 'bad', totalBad, 'errs', errs.slice(0, 5));
  await b.close();
  process.exit(totalBad || errs.length ? 1 : 0);
})();
