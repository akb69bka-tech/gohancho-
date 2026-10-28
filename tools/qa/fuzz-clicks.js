// 本物のタップ操作だけで、数千ステップのランダム操作を流し、
// 「直前に押した枠以外の料理が変わっていないか」を毎ステップ検査するファズテスト。
//   state を直接書き換えない。Playwright の page.click / selectOption で実際のボタン・プルダウンを押す。
//   操作: かえる / 主食のかえる / あと1品(開く→選ぶ→入れる) / 品数変更 / 気分 / 国のミックス / 汁ものを足す /
//         設定の開閉 / タブ移動 / 決定 / 決定の取り消し / 1週間プラン(作り直す) / 主菜を献立にする / ひとひねりを主菜に /
//         再読込(reload) / アプリを閉じて開く(新しいcontext+localStorage引き継ぎ) / 日付またぎ(月曜日を含む) / sw更新後の再読込
//   構成: 全21か国 × 品数2〜6・おまかせ × iPhone幅390px × 国別ミックス あり/なし × 気分 × 苦手食材 × 家族プロフィール
// 使い方: node tools/qa/fuzz-clicks.js            （アプリは中で一時的に配信する。BASE=http://localhost:8792/ で外のサーバを使う）
//   RUNS=63    試行数（既定 63 = 21か国×3）      STEPS=60  1試行あたりの操作数（既定 60）
//   SEED=1     乱数の種（同じ種なら同じ操作列）   JOBS=4    並列数
//   CCS=JP,US  国を絞る                         LOG=path  不一致を全部このファイルに書く
//   SHRINK=0   失敗を最小の操作列に縮める処理を止める（既定は縮める）
//   REPLAY=file  LOG に出た「replay」行の JSON を1行だけ書いたファイルを、そのまま再生する
// 合格は「BAD 0」。
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const ALL_CC = 'JP,US,GB,FR,DE,IT,ES,PL,TR,EG,IN,CN,TW,KR,TH,VN,ID,PH,MX,BR,PE'.split(',');
const CCS = (process.env.CCS || ALL_CC.join()).split(',');
const RUNS = Number(process.env.RUNS || CCS.length * 3), STEPS = Number(process.env.STEPS || 60), SEED = Number(process.env.SEED || 1), JOBS = Number(process.env.JOBS || 4);
const SHRINK = process.env.SHRINK !== '0';
const ROOT = path.resolve(__dirname, '../../gohancho');
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

/* ---- アプリの配信（sw.js だけ、呼ぶたびに版を変えて「sw更新」を再現する） ---- */
let swBump = 0, BASE = process.env.BASE || '';
function serve() {
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('no'); }
      let body = fs.readFileSync(f);
      if (p === '/sw.js') body = Buffer.from(body.toString().replace(/gohancho-v(\d+)'/, (m, v) => 'gohancho-v' + v + '-fz' + swBump + "'"));
      r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); r.end(body);
    }).listen(0, '127.0.0.1', () => { BASE = 'http://127.0.0.1:' + srv.address().port + '/'; res(srv); });
  });
}

/* ---- ページの中の道具（読むだけ。state は書き換えない） ---- */
const PAGE_LIB = `
window.__snap = () => {
  const m = session.menu;
  const spots = [...document.querySelectorAll('.tray .spot')].map((sp, k) => {
    const sa = sp.querySelector('[data-act="soup-add"]');
    const b = sp.querySelector('[data-act="reroll"]') || sa; const c = sp.cloneNode(true); c.querySelectorAll('.swap, .last, .spice-tag, .swap-line').forEach(x => x.remove());   // 「今日作った」など記録の表示は料理の入れ替わりではない
    return {key: b ? 'i' + b.dataset.i : sp.classList.contains('rice') ? 'rice' : 'x' + k, html: (sa || sp.querySelector('.nm.none')) ? 'EMPTY' : c.outerHTML.replace(/ style="[^"]*"/g, '').replace(/ rise-in/g, '')};
  });
  const ings = m ? m.items.map(x => x.r ? x.r.items.map(i => i.key + ':' + i.label + ':' + i.qty).join(',') : '-') : [];
  let shop = ''; try { shop = JSON.stringify(shoppingList()); } catch (e) { shop = 'ERR'; }
  const st = JSON.parse(JSON.stringify(S.settings)); delete st.stapleBy;
  return {
    n: m && m.n, adj: !!(m && m.adj), mood: session.mood, today: TODAY, tab: tab,
    ids: m ? m.items.map(x => x.slot + ':' + (x.r ? x.r.id : '-')) : [],
    ings, spots, rice: (document.querySelector('.tray .spot.rice') || {}).textContent || '',
    staple: JSON.stringify((S.settings || {}).stapleBy || {}),
    week: JSON.stringify(S.week), hist: JSON.stringify(S.history), favs: JSON.stringify(S.favs), hidden: JSON.stringify(S.hidden),
    cook: JSON.stringify(S.cook), saved: JSON.stringify(S.savedMenus), shop, settings: JSON.stringify(st),
    bad: m ? m.items.filter(x => x.r && isAvoided(x.r)).map(x => x.r.id) : [],
    dup: m ? m.items.map(x => x.r && x.r.id).filter(Boolean).length - new Set(m.items.map(x => x.r && x.r.id).filter(Boolean)).size : 0,
    cookToday: !!(S.cook && S.cook.d === TODAY),
  };
};`;
const dateShim = `(() => { const R = Date; const off = () => Number(sessionStorage.getItem('__off') || 0);
  function D(...a) { if (!(this instanceof D)) return new R(R.now() + off()).toString(); if (!a.length) return new R(R.now() + off()); return new R(...a); }
  D.prototype = R.prototype; D.now = () => R.now() + off(); D.parse = R.parse; D.UTC = R.UTC; window.Date = D; })();`;
const randShim = `(() => { let a = Number(sessionStorage.getItem('__seed')) || 1; const rc = Number(sessionStorage.getItem('__rc') || 0) + 1; sessionStorage.setItem('__rc', rc); a = (a + rc * 7919) | 0;
  Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;

/* ---- 比べる（linkage-all.js と同じ） ---- */
function diff(a, c, pressed, o = {}) {
  const d = [];
  const pk = pressed === null || pressed === 'staple' || pressed === undefined ? null : 'i' + pressed;
  if (typeof pressed !== 'number') pressed = -1;
  if (a.ids.length !== c.ids.length) d.push('品数 ' + a.ids.length + '->' + c.ids.length);
  else a.ids.forEach((x, j) => { if (j !== pressed && x !== c.ids[j]) d.push('料理#' + j + ' ' + x + ' -> ' + c.ids[j]); });
  if (o.idsOnly) { if (a.ids.join() !== c.ids.join()) d.push('料理 ' + a.ids.join() + ' -> ' + c.ids.join()); return d; }
  a.ings.forEach((x, j) => { if (j !== pressed && c.ings[j] !== undefined && x !== c.ings[j] && a.ids[j] === c.ids[j]) d.push('材料#' + j); });
  a.spots.forEach(sp => {
    if (sp.key === pk) return; if (o.staple && sp.key === 'rice') return;
    const q = c.spots.find(y => y.key === sp.key);
    if (!q) d.push('枠が消えた ' + sp.key); else if (q.html !== sp.html) { let z = 0; while (z < sp.html.length && sp.html[z] === q.html[z]) z++; d.push('枠の表示(画像・名前) ' + sp.key + ' [' + sp.html.slice(Math.max(0, z - 40), z + 60) + '] => [' + q.html.slice(Math.max(0, z - 40), z + 60) + ']'); }
  });
  if (!o.staple) { if (c.spots.length !== a.spots.length) d.push('枠の数 ' + a.spots.length + '->' + c.spots.length); if (a.rice.replace(/かえる|Change|\s/g, '') !== c.rice.replace(/かえる|Change|\s/g, '')) d.push('ご飯/主食欄'); if (a.staple !== c.staple) d.push('主食の設定'); }
  const keys = ['week', 'hist', 'favs', 'hidden', 'cook', 'saved', 'shop', 'settings'].filter(k => !(o.skip || []).includes(k));
  keys.forEach(k => { if (a[k] !== c[k]) d.push({ week: '1週間プラン', hist: '履歴', favs: 'お気に入り', shop: '買い物リスト', cook: '決定済み(S.cook)', saved: '保存した献立' }[k] || k); });
  if (a.mood !== c.mood && !o.mood) d.push('気分 ' + a.mood + '->' + c.mood);
  if (a.adj !== c.adj || a.n !== c.n) d.push('品数/あと1品 ' + a.n + (a.adj ? '+' : '') + '->' + c.n + (c.adj ? '+' : ''));
  return d;
}

/* ---- 1試行の設定と操作列 ---- */
function makeRun(i, rng) {
  const cc = CCS[i % CCS.length], pickOf = a => a[Math.floor(rng() * a.length)];
  const others = ALL_CC.filter(x => x !== cc), mix = {};
  if (rng() < 0.45) { const slots = ['主菜', '副菜', '汁物'].filter(() => rng() < 0.5); if (!slots.length) slots.push(pickOf(['主菜', '副菜', '汁物'])); slots.forEach(s => mix[s] = pickOf(others)); }
  const avoid = rng() < 0.3 ? [pickOf(['@pork', '@chicken', '@fish', '@egg', '@dairy', '@beef', '@shellfish'])] : [];
  const family = rng() < 0.25 ? [{ id: 'f1', name: 'A', role: 'child', avoid: ['@' + pickOf(['egg', 'fish', 'dairy', 'wheat'])], allergy: [], mild: false }, { id: 'f2', name: 'B', role: 'adult', avoid: [], allergy: [], mild: rng() < 0.5 }] : null;
  const cfg = { cc, n: pickOf(['auto', 2, 3, 4, 5, 6]), mix, avoid, family, off: Math.floor(rng() * 9), seed: Math.floor(rng() * 1e9) };
  const W = [['reroll', 30], ['staple', 3], ['one', 7], ['count', 6], ['mood', 4], ['mix', 4], ['soupadd', 4], ['settings', 4], ['tab', 6], ['decide', 4], ['undo', 3], ['week', 3], ['useplan', 3], ['twist', 3], ['avoidtoggle', 3], ['alg', 3], ['weekskip', 2], ['hide', 3], ['avoidswap', 1], ['eater', 2], ['lang', 2], ['reload', 6], ['reopen', 4], ['day', 4], ['monday', 1], ['swup', 2]];
  const tot = W.reduce((s, x) => s + x[1], 0), acts = [];
  for (let k = 0; k < STEPS; k++) { let r = rng() * tot, a = W[0][0]; for (const [n, w] of W) { if ((r -= w) < 0) { a = n; break; } } acts.push({ a, p: Math.floor(rng() * 1e6), q: Math.floor(rng() * 1e6) }); }
  return { cfg, acts };
}

/* ---- 開く ---- */
async function openCtx(b, cfg, state, off, hold) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, storageState: state && state.storage ? state.storage : undefined });
  await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(([off, seed]) => { if (sessionStorage.getItem('__off') == null) sessionStorage.setItem('__off', off); sessionStorage.setItem('__seed', seed); }, [off, cfg.seed]);
  await p.addInitScript(dateShim); await p.addInitScript(randShim); await p.addInitScript(PAGE_LIB);
  if (!state || !state.storage) {
    await p.addInitScript(([cfg, firstUse]) => {
      if (sessionStorage.getItem('__init')) return; sessionStorage.setItem('__init', 1);
      const st = { onboarded: true, firstUse, settings: { country: cfg.cc, dishCount: cfg.n, mix: cfg.mix, avoid: cfg.avoid } };
      if (cfg.family) st.family = cfg.family;
      localStorage.setItem('gohancho.v1', JSON.stringify(st));
    }, [cfg, '2026-10-20']);
  }
  await p.goto(BASE); await ready(p);
  return { ctx, p };
}
async function ready(p) {
  await p.waitForFunction(() => typeof session !== 'undefined' && session.menu && document.querySelectorAll('.tray .spot').length && !mixWaiting(), null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(350);
}
const snap = p => p.evaluate(() => window.__snap());

/* ---- 操作（すべて本物のクリック） ---- */
async function click(p, sel, nth = 0) {
  const l = p.locator(sel).nth(nth);
  try { await l.click({ timeout: 2500 }); } catch (e) { await p.waitForTimeout(1200); try { await l.click({ timeout: 2500 }); } catch (e2) { return false; } }
  return true;
}
const count = (p, sel) => p.locator(sel).count();
async function toToday(p) {
  for (let k = 0; k < 3 && (await p.evaluate(() => tab)) !== 'today'; k++) {
    if (!await click(p, 'nav.tabs [data-tab="today"]')) await p.waitForTimeout(2500);   // 通知（トースト）が下のタブに重なっているあいだは待つ
    await p.waitForTimeout(150);
  }
  if ((await p.evaluate(() => tab)) !== 'today') { await p.evaluate(() => document.querySelector('nav.tabs [data-tab="today"]').click()); await p.waitForTimeout(150); }   // それでも押せないときだけ最後の手段
}
async function openCond(p) { const open = await p.evaluate(() => { const d = document.querySelector('details.cond'); return d && d.open; }); if (!open) { if (!await click(p, 'details.cond > summary')) return false; await p.waitForTimeout(150); } return true; }
async function dayEvent(p) { await p.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); }); await p.waitForTimeout(500); }

// 返り値: null=この操作はできなかった（スキップ）／ {desc, pressed, o, special}
const ACTIONS = {
  async reroll(p, A, st) {
    await toToday(p); const n = await count(p, '.tray [data-act="reroll"]'); if (!n) return null;
    const k = A.p % n, i = Number(await p.locator('.tray [data-act="reroll"]').nth(k).getAttribute('data-i'));
    if (!await click(p, '.tray [data-act="reroll"]', k)) return null; await p.waitForTimeout(150);
    return { desc: 'かえる#' + i, pressed: i, o: {} };
  },
  async staple(p, A) { await toToday(p); if (!await count(p, '.tray [data-act="staple-next"]')) return null; if (!await click(p, '.tray [data-act="staple-next"]')) return null; await p.waitForTimeout(150); return { desc: '主食かえる', pressed: 'staple', o: { staple: true } }; },
  async soupadd(p, A) { await toToday(p); if (!await count(p, '.tray [data-act="soup-add"]')) return null; const i = Number(await p.locator('.tray [data-act="soup-add"]').first().getAttribute('data-i')); if (!await click(p, '.tray [data-act="soup-add"]')) return null; await p.waitForTimeout(150); return { desc: '汁ものを足す#' + i, pressed: i, o: {}, soupAdd: i }; },
  async one(p, A) {
    await toToday(p); if (!await click(p, '[data-act="one-open"]')) return null; await p.waitForTimeout(250);
    const chips = await count(p, '#sheet-root [data-act="one-pick"]');
    if (chips) { await click(p, '#sheet-root [data-act="one-pick"]', A.p % chips); await p.waitForTimeout(250); }
    const adds = await count(p, '#sheet-root [data-act="one-add"]');
    if (!adds) { await click(p, '#sheet-root [data-act="sheet-close"]'); await p.waitForTimeout(150); return { desc: 'あと1品(開いて閉じる)', pressed: null, o: {} }; }
    await click(p, '#sheet-root [data-act="one-add"]', A.q % adds); await p.waitForTimeout(300);
    return { desc: 'あと1品を入れる', pressed: null, o: {}, special: 'one' };
  },
  async count(p, A) {
    await toToday(p); if (!await openCond(p)) return null;
    const v = ['auto', 2, 3, 4, 5, 6][A.p % 6], cur = await p.evaluate(() => [String(S.settings.dishCount), !!session.menu.adj]);
    if (!await click(p, '[data-act="count"][data-v="' + v + '"]')) return null; await p.waitForTimeout(250);
    const same = cur[0] === String(v) && !cur[1];
    return { desc: '品数=' + v, pressed: null, o: same ? {} : { skipAll: true, skip: ['settings'] }, rebuild: !same };
  },
  async mood(p, A) {
    await toToday(p); if (!await openCond(p)) return null;
    const ks = await p.evaluate(() => MOODS.map(x => x.k)), k = ks[A.p % ks.length], cur = await p.evaluate(() => session.mood);
    if (!await click(p, '[data-act="mood"][data-k="' + k + '"]')) return null; await p.waitForTimeout(250);
    return { desc: '気分=' + k, pressed: null, o: k === cur ? {} : { skipAll: true }, rebuild: k !== cur };
  },
  async mix(p, A) {
    await toToday(p); if (!await openCond(p)) return null;
    const slot = ['主菜', '副菜', '汁物'][A.p % 3], opts = await p.evaluate(s => [...document.querySelectorAll('select[data-act="mix"][data-slot="' + s + '"] option')].map(o => o.value), slot);
    const v = opts[A.q % opts.length]; const before = await p.evaluate(s => mixCc(s) || '', slot);
    try { await p.locator('select[data-act="mix"][data-slot="' + slot + '"]').selectOption(v, { timeout: 2500 }); } catch (e) { return null; }
    await ready(p); await p.waitForTimeout(500);
    return { desc: '混ぜる ' + slot + '=' + (v || 'いまの国'), pressed: null, o: {}, mixSlot: slot, mixChanged: (v || '') !== before };
  },
  async settings(p) {
    await toToday(p); if (!await click(p, 'header.top [data-act="settings"]')) return null; await p.waitForTimeout(250);
    await click(p, '[data-act="settings-back"]'); await p.waitForTimeout(250); await toToday(p);
    return { desc: '設定を開いて閉じる', pressed: null, o: {} };
  },
  async tab(p, A) {
    const ts = ['cook', 'fridge', 'twist', 'world', 'log'], t = ts[A.p % ts.length];
    if (!await p.locator('nav.tabs [data-tab="' + t + '"]').isVisible()) return null;
    if (!await click(p, 'nav.tabs [data-tab="' + t + '"]')) return null; await p.waitForTimeout(250); await toToday(p); await p.waitForTimeout(150);
    return { desc: 'タブ ' + t + ' を見て戻る', pressed: null, o: {} };
  },
  async decide(p, A) {
    await toToday(p); const sel = A.p % 2 ? '.big-decide' : '.actions [data-act="decide"]'; if (!await count(p, sel)) return null;
    if (!await click(p, sel)) return null; await p.waitForTimeout(500); await toToday(p); await p.waitForTimeout(200);
    return { desc: '決定→今日の献立へ戻る', pressed: null, o: { skip: ['hist', 'cook', 'shop'] } };
  },
  async undo(p) {
    if (!await p.evaluate(() => !!(S.cook && S.cook.d === TODAY))) return null;
    if (!await click(p, 'nav.tabs [data-tab="cook"]')) return null; await p.waitForTimeout(250);
    if (!await count(p, '[data-act="undo-decide"]')) { await toToday(p); return null; }
    if (!await click(p, '[data-act="undo-decide"]')) return null; await p.waitForTimeout(400); await toToday(p);
    return { desc: '決定の取り消し', pressed: null, o: { skip: ['hist', 'cook', 'shop'] } };
  },
  async week(p) { await toToday(p); if (!await count(p, '[data-act="make-week"]')) return null; if (!await click(p, '[data-act="make-week"]')) return null; await p.waitForTimeout(300); return { desc: '1週間プランを考える/作り直す', pressed: null, o: { skip: ['week', 'shop'] } }; },
  async useplan(p) {
    await toToday(p); if (!await count(p, '[data-act="use-plan"]')) return null; if (!await click(p, '[data-act="use-plan"]')) return null; await p.waitForTimeout(250);
    return { desc: 'プランの主菜を献立にする', pressed: 0, o: {}, special: 'main' };
  },
  async twist(p) {
    await toToday(p); if (!await count(p, '[data-act="twist-main"]')) return null; if (!await click(p, '[data-act="twist-main"]')) return null; await p.waitForTimeout(250);
    return { desc: 'ひとひねりを主菜にする', pressed: 0, o: {}, special: 'main' };
  },
  async avoidtoggle(p, A) {
    await toToday(p); if (!await click(p, 'header.top [data-act="settings"]')) return null; await p.waitForTimeout(250);
    const sel = '[data-act="toggle-avoid"], [data-act="toggle-avoid-fam"]', n = await count(p, sel);
    if (!n) { await click(p, '[data-act="settings-back"]'); return null; }
    const k = A.p % n; if (!await click(p, sel, k)) { await click(p, '[data-act="settings-back"]'); return null; }
    await p.waitForTimeout(250); await click(p, '[data-act="settings-back"]'); await p.waitForTimeout(250); await toToday(p);
    return { desc: '苦手食材を入れる/外す', pressed: null, o: {}, special: 'avoidchg' };
  },
  async alg(p, A) {
    await toToday(p); if (!await click(p, 'header.top [data-act="settings"]')) return null; await p.waitForTimeout(250);
    const n = await count(p, '[data-act="alg-toggle"]');
    if (!n) { await click(p, '[data-act="settings-back"]'); return null; }
    const ferm = A.q % 5 === 0 && await count(p, 'input[data-act="alg-ferm"]');
    if (ferm) await click(p, 'input[data-act="alg-ferm"]'); else await click(p, '[data-act="alg-toggle"]', A.p % n);
    await p.waitForTimeout(250); await click(p, '[data-act="settings-back"]'); await p.waitForTimeout(250); await toToday(p);
    return { desc: 'アレルゲンを入れる/外す', pressed: null, o: {}, special: 'avoidchg' };
  },
  async weekskip(p, A) {
    await toToday(p); const n = await count(p, '[data-act="week-skip"], [data-act="week-who"]'); if (!n) return null;
    const k = A.p % n, el = p.locator('[data-act="week-skip"], [data-act="week-who"]').nth(k), act = await el.getAttribute('data-act');
    if (!await click(p, '[data-act="week-skip"], [data-act="week-who"]', k)) return null; await p.waitForTimeout(250);
    if (act === 'week-who') { const m = await count(p, '#sheet-root [data-act="who-pick"]'); if (m) await click(p, '#sheet-root [data-act="who-pick"]', A.q % m); else await click(p, '#sheet-root [data-act="sheet-close"]'); await p.waitForTimeout(250); }
    return { desc: act === 'week-skip' ? '作らない日/戻す' : '担当を決める', pressed: null, o: { skip: ['week', 'shop'] } };
  },
  async hide(p, A) {
    await toToday(p); const n = await count(p, '.tray [data-act="open"]'); if (!n) return null;
    const k = A.p % n, id = await p.locator('.tray [data-act="open"]').nth(k).getAttribute('data-id');
    if (!await click(p, '.tray [data-act="open"]', k)) return null; await p.waitForTimeout(300);
    if (!await count(p, '[data-act="hide"]')) { await click(p, '[data-act="close"]'); return null; }
    await click(p, '[data-act="hide"]'); await p.waitForTimeout(200); await click(p, '[data-act="hide-yes"]'); await p.waitForTimeout(400);
    return { desc: '作らない(' + id + ')', pressed: null, o: {}, special: 'hide', hideId: id };
  },
  async avoidswap(p) {
    await toToday(p); if (!await click(p, 'header.top [data-act="settings"]')) return null; await p.waitForTimeout(250);
    if (!await count(p, 'input[data-act="avoid-swap"]')) { await click(p, '[data-act="settings-back"]'); return null; }
    await click(p, 'input[data-act="avoid-swap"]'); await p.waitForTimeout(250); await click(p, '[data-act="settings-back"]'); await p.waitForTimeout(250); await toToday(p);
    return { desc: '置き換えのチェック', pressed: null, o: {}, special: 'avoidchg' };
  },
  async eater(p, A) {
    await toToday(p); if (!await count(p, 'details.cond')) return null; if (!await openCond(p)) return null;
    const n = await count(p, '[data-act="eater"]'); if (!n) return null;
    if (!await click(p, '[data-act="eater"]', A.p % n)) return null; await p.waitForTimeout(250);
    return { desc: '食べる人を入れる/外す', pressed: null, o: {}, special: 'avoidchg' };
  },
  async lang(p, A) {
    await toToday(p); if (!await click(p, 'header.top [data-act="settings"]')) return null; await p.waitForTimeout(250);
    const v = ['en', 'ja', 'ko', 'es'][A.p % 4]; if (!await count(p, '[data-act="ui-lang"][data-v="' + v + '"]')) { await click(p, '[data-act="settings-back"]'); return null; }
    await click(p, '[data-act="ui-lang"][data-v="' + v + '"]'); await p.waitForTimeout(1800); await click(p, '[data-act="settings-back"]'); await p.waitForTimeout(300); await toToday(p); await ready(p);
    return { desc: '言語=' + v, pressed: null, o: { idsOnly: true }, special: 'idsonly' };
  },
  async reload(p) { await p.reload({ waitUntil: 'domcontentloaded' }); await ready(p); return { desc: '再読込', pressed: null, o: { idsAll: true }, restart: true }; },
  async reopen(p, A, st) {
    await p.waitForTimeout(450);   // iPhone でアプリを閉じるまでに保存は済んでいる（保存は 0.3 秒後）
    st.storage = await st.ctx.storageState(); st.off = await p.evaluate(() => Number(sessionStorage.getItem('__off') || 0));
    if (process.env.DBG) console.log('DBG before-close', JSON.stringify(await p.evaluate(() => ({ td: TODAY, draft: S.draft, ids: menuIds(), ls: (JSON.parse(localStorage.getItem('gohancho.v1')) || {}).draft }))));
    await st.ctx.close(); const n = await openCtx(st.b, st.cfg, st, st.off); st.ctx = n.ctx; st.p = n.p;
    if (process.env.DBG) console.log('DBG after-open', JSON.stringify(await n.p.evaluate(() => ({ td: TODAY, draft: S.draft, ids: menuIds(), dc: S.settings.dishCount, mood: session.mood }))));
    return { desc: 'アプリを閉じて開く', pressed: null, o: { idsAll: true }, restart: true, newPage: true };
  },
  async day(p, A, st) {
    await p.evaluate(() => sessionStorage.setItem('__off', Number(sessionStorage.getItem('__off') || 0) + 86400000)); await dayEvent(p); await ready(p);
    return { desc: '日付が1日進む', pressed: null, o: { skipAll: true, skip: ['settings', 'cook', 'shop'] }, rebuild: true, dayChange: true };
  },
  async monday(p) {
    await p.evaluate(() => { const now = new Date(), dw = now.getDay(), add = ((8 - dw) % 7) || 7; sessionStorage.setItem('__off', Number(sessionStorage.getItem('__off') || 0) + add * 86400000); }); await dayEvent(p); await ready(p);
    return { desc: '日付が次の月曜日になる', pressed: null, o: { skipAll: true, skip: ['settings', 'cook', 'shop'] }, rebuild: true, dayChange: true };
  },
  async swup(p, A, st) {
    swBump++; await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); if (r) await r.update(); }).catch(() => {});
    await p.waitForTimeout(900); await p.reload({ waitUntil: 'domcontentloaded' }); await ready(p);
    return { desc: 'sw更新のあと再読込', pressed: null, o: { idsAll: true }, restart: true };
  },
};

/* ---- 1試行を流す。失敗は [{step, act, msg, kind}] で返す ---- */
async function exec(b, run, onStep) {
  const { cfg, acts } = run; const fails = [];
  let st = { b, cfg, ctx: null, p: null, storage: null, off: cfg.off * 86400000 };
  const o0 = await openCtx(b, cfg, null, st.off); st.ctx = o0.ctx; st.p = o0.p;
  let prev = await snap(st.p), done = 0;
  for (let k = 0; k < acts.length; k++) {
    const A = acts[k], p = st.p;
    let r; try { r = await Promise.race([ACTIONS[A.a](p, A, st), new Promise((_, rej) => setTimeout(() => rej(new Error('HANG 90秒たっても終わらない（ページが固まった可能性）')), 90000))]); } catch (e) {
      if (/^HANG/.test(e.message)) { fails.push({ step: k, act: A.a, kind: 'HANG', msg: '#' + k + ' ' + A.a + ' ' + e.message }); break; } fails.push({ step: k, act: A.a, kind: 'エラー', msg: 'ACTION ERROR ' + e.message.split('\n')[0] }); try { st.p = st.p; await toToday(st.p); } catch (e2) { break; } continue; }
    if (!r) continue;
    const q = st.p; await q.waitForTimeout(80);
    let s1; try { s1 = await snap(q); } catch (e) { fails.push({ step: k, act: A.a, kind: 'エラー', msg: 'SNAP ERROR ' + e.message.split('\n')[0] }); break; }
    done++; const d = [];
    const tag = (r.desc) + ' [' + A.a + ']';
    if (q.errs.length) { d.push('JSエラー ' + q.errs.splice(0).join(' / ')); }
    if (r.idsAll) { const x = diff(prev, s1, null, { idsOnly: true }); d.push(...x); if (!x.length) d.push(...diff(prev, s1, null, { skip: ['hist', 'cook', 'shop', 'settings'] })); }
    else if (r.dayChange) { ['week', 'hist', 'favs', 'hidden', 'saved'].forEach(x => { if (prev[x] !== s1[x] && !(x === 'hist' && false)) d.push(x + ' が日付またぎで変わった'); }); }
    else if (r.special === 'one') {
      const a = prev.ids, c = s1.ids;
      if (c.length === a.length + 1) { let ok = false; for (let j = 0; j < c.length && !ok; j++) if (c.filter((_, i2) => i2 !== j).join() === a.join()) ok = true; if (!ok) d.push('あと1品: 追加以外の料理が変わった ' + a.join() + ' -> ' + c.join()); }
      else if (c.length === a.length) { const ch = a.map((x, j) => x !== c[j] ? j : -1).filter(j => j >= 0); if (ch.length > 1) d.push('あと1品: 2か所以上が変わった ' + ch.map(j => a[j] + '->' + c[j]).join(', ')); else if (ch.length && a[ch[0]].split(':')[0] !== c[ch[0]].split(':')[0]) d.push('あと1品: 別の種類の枠が変わった'); }
      else d.push('あと1品: 品数 ' + a.length + '->' + c.length);
      ['week', 'favs', 'hidden'].forEach(x => { if (prev[x] !== s1[x]) d.push(x); });
    }
    else if (r.special === 'hide') {
      // 「作らない」にした料理の枠だけ選び直してよい。ほかの枠は変えない
      if (prev.ids.length !== s1.ids.length) d.push('品数 ' + prev.ids.length + '->' + s1.ids.length);
      else prev.ids.forEach((x, j) => { if (x.split(':')[1] === r.hideId) return; if (x !== s1.ids[j]) d.push('作らないにした料理以外 #' + j + ' ' + x + ' -> ' + s1.ids[j]); });
      if (s1.ids.some(x => x.split(':')[1] === r.hideId)) {
        // 代わりになる料理が1つも残っていない（ほかを全部「作らない」にした）ときは、残って当然
        const hs = prev.ids.find(x => x.split(':')[1] === r.hideId).split(':')[0];
        const alt = await q.evaluate(hs => poolFor(hs).filter(x => (hs === '主菜' ? x.main : slotOf(x) === hs) && !isAvoided(x) && !S.hidden.includes(x.id) && !menuIds().includes(x.id)).length, hs);
        if (alt > 0) d.push('作らないにした料理が残った（代わりの候補は' + alt + '品あった）');
      }
    }
    else if (r.special === 'idsonly') { d.push(...diff(prev, s1, null, { idsOnly: true })); }
    else if (r.special === 'avoidchg') {
      // 苦手・食べる人を変えたら、「いま苦手に当たる料理の枠」だけ選び直してよい。ほかの枠は変えない
      const gone = await q.evaluate(ids => ids.map(x => { const id = x.split(':')[1]; const r = id === '-' ? null : byId(id); return !!(r && (isAvoided(r) || S.hidden.includes(id))); }), prev.ids);
      if (prev.ids.length !== s1.ids.length) d.push('品数 ' + prev.ids.length + '->' + s1.ids.length);
      else prev.ids.forEach((x, j) => {
        if (gone[j]) return;
        if (x !== s1.ids[j]) d.push('苦手に当たらない枠 #' + j + ' ' + x + ' -> ' + s1.ids[j]);
        else { const a = prev.spots.find(y => y.key === 'i' + j), c = s1.spots.find(y => y.key === 'i' + j); if (a && c && a.html !== c.html) { let z = 0; while (z < a.html.length && a.html[z] === c.html[z]) z++; d.push('枠の表示 #' + j + ' [' + a.html.slice(Math.max(0, z - 30), z + 70).replace(/\s+/g, ' ') + '] => [' + c.html.slice(Math.max(0, z - 30), z + 70).replace(/\s+/g, ' ') + ']'); } }
      });
      if (!gone[0] && !gone.some(Boolean) && prev.rice !== s1.rice) d.push('ご飯/主食欄');
      ['favs', 'hidden', 'hist', 'cook'].forEach(x => { if (prev[x] !== s1[x]) d.push(x); });
    }
    else if (r.special === 'main') {
      // 主菜を変える操作: 空の枠は空のまま・主菜以外は（新しい主菜と同じ料理/同じ肉魚で重なる枠を除き）変えない
      const nm = s1.ids[0].split(':')[1];
      prev.ids.forEach((x, j) => { if (j && x !== s1.ids[j]) { const clash = x.split(':')[1] === nm; if (!clash) d.push('主菜を変えたら #' + j + ' ' + x + ' -> ' + s1.ids[j]); } });
      if (prev.ids.length !== s1.ids.length) d.push('品数が変わった');
    }
    else if (r.rebuild) { /* 全体の作り直しは仕様。設定の保存だけ確かめる */ }
    else if (r.mixSlot) {
      const sl = prev.ids.map(x => x.split(':')[0]);
      prev.ids.forEach((x, j) => { if (sl[j] !== r.mixSlot && x !== s1.ids[j]) d.push('混ぜた枠(' + r.mixSlot + ')以外 #' + j + ' ' + x + ' -> ' + s1.ids[j]); });
      if (!r.mixChanged && prev.ids.join() !== s1.ids.join()) d.push('同じ国を選び直しただけなのに変わった');
    }
    else {
      const dd = diff(prev, s1, r.pressed, r.o); d.push(...dd);
      if (r.soupAdd !== undefined && s1.ids[r.soupAdd] && s1.ids[r.soupAdd].endsWith(':-')) d.push('汁ものを足すを押したのに空のまま');
    }
    if (s1.bad.length && (cfg.avoid.length || cfg.family || r.special === 'avoidchg')) {
      // 代わりになる料理が1つもない（苦手・アレルゲンを重ねて候補がなくなった）ときは、その料理が残って当然（画面には注意が出る）
      const real = await q.evaluate(ids => ids.filter(id => { const sl = (session.menu.items.find(x => x.r && x.r.id === id) || {}).slot; return sl && poolFor(sl).some(x => (sl === '主菜' ? x.main : slotOf(x) === sl) && !isAvoided(x) && !S.hidden.includes(x.id) && !menuIds().includes(x.id)); }), s1.bad);
      if (real.length) d.push('苦手/アレルギーの料理が出た ' + real.join());
    }
    if (d.length && process.env.DBG) console.log('DBG state', JSON.stringify(await q.evaluate(() => ({ tab, menu: !!session.menu, n: session.menu && session.menu.n, view: document.querySelector('.tray') && document.querySelector('.tray').innerText.replace(/\s+/g, ' ') + ' | ' + session.menu.items.map(x => x.slot + ':' + (x.r ? x.r.id + '(' + x.r.type + ')' : '-')).join(), lang: LANG, set: JSON.stringify([S.settings.avoid, S.settings.allergens, S.settings.avoidSwap, S.settings.allergenFerm, S.hidden]), eaters: S.eaters, mw: mixWaiting(), boot: bootReady, td: TODAY }))), q.errs);
    if (d.length) fails.push({ step: k, act: A.a, kind: A.a + ':' + d[0].replace(/[0-9]+|[A-Za-z_]+\d*/g, '').slice(0, 24), msg: '#' + k + ' ' + tag + ' 前=' + prev.ids.join() + ' => ' + d.join(' | ') });
    if (onStep) onStep(k);
    prev = s1;
  }
  try { await st.ctx.close(); } catch (e) {}
  fails.steps = done; return fails;
}

// 失敗した操作列を、同じ種類の失敗が残るかぎり縮める
async function shrink(b, run, f0) {
  let acts = run.acts.slice(0, f0.step + 1), best = f0, tries = 0;
  const still = async cand => { tries++; const fl = await exec(b, { cfg: run.cfg, acts: cand }, null); return fl.find(x => x.kind === f0.kind && x.step === cand.length - 1) || fl.find(x => x.kind === f0.kind); };
  for (let sz = Math.ceil(acts.length / 2); sz >= 1 && tries < 25; sz = sz === 1 ? 0 : Math.ceil(sz / 2)) {
    for (let at = 0; at < acts.length - 1 && tries < 25;) {
      const cand = acts.slice(0, at).concat(acts.slice(at + sz));
      if (cand.length && cand.length < acts.length) { const hit = await still(cand); if (hit) { acts = cand.slice(0, hit.step + 1); best = hit; continue; } }
      at += sz;
    }
  }
  return { acts, hit: best, tries };
}

(async () => {
  let srv = null; if (!BASE) srv = await serve();
  const b = await chromium.launch({ executablePath: EXE });
  const rng = mulberry(SEED); let runs = [];
  if (process.env.REPLAY) runs = [JSON.parse(fs.readFileSync(process.env.REPLAY, 'utf8').trim().split('\n').pop().replace(/^.*replay /, ''))];
  else for (let i = 0; i < RUNS; i++) runs.push(makeRun(i, rng));
  const stat = {}, bads = []; let steps = 0, doneRuns = 0; const t0 = Date.now();
  const q = runs.map((r, i) => [r, i]);
  await Promise.all(Array.from({ length: JOBS }, async () => {
    while (q.length) {
      const [run, i] = q.shift(); let fl;
      try { fl = await exec(b, run, null); } catch (e) { fl = [{ step: -1, act: '?', kind: 'エラー', msg: 'RUN ERROR ' + e.message.split('\n')[0] }]; fl.steps = 0; }
      steps += fl.steps || 0; const s = stat[run.cfg.cc] = stat[run.cfg.cc] || { runs: 0, bad: 0 }; s.runs++;
      if (fl.length) {
        s.bad += fl.length;
        const first = fl[0]; let small = null;
        if (SHRINK && first.step >= 0 && first.kind !== 'エラー' && first.kind !== 'HANG') { try { small = await shrink(b, run, first); } catch (e) {} }
        const cfgTxt = JSON.stringify({ cc: run.cfg.cc, n: run.cfg.n, mix: run.cfg.mix, avoid: run.cfg.avoid, fam: !!run.cfg.family, off: run.cfg.off });
        const out = ['BAD run#' + i + ' ' + cfgTxt, ...fl.slice(0, 6).map(x => '   ' + x.msg)];
        if (small) out.push('   最小の操作列(' + small.acts.length + '手): ' + small.acts.map(x => x.a).join(' > ') + '\n   => ' + small.hit.msg);
        out.push('   replay ' + JSON.stringify(small ? { cfg: run.cfg, acts: small.acts } : { cfg: run.cfg, acts: run.acts.slice(0, first.step + 1) }));
        bads.push(out.join('\n')); console.log(out.join('\n'));
        if (process.env.LOG) fs.appendFileSync(process.env.LOG, out.join('\n') + '\n');
      }
      if (++doneRuns % 10 === 0) console.error('..', doneRuns + '/' + runs.length, 'steps', steps, Math.round((Date.now() - t0) / 1000) + 's');
    }
  }));
  await b.close(); if (srv) srv.close();
  console.log('国別 ' + Object.entries(stat).map(([k, v]) => k + ':' + v.runs + (v.bad ? '(bad' + v.bad + ')' : '')).join(' '));
  console.log('TOTAL runs', runs.length, 'steps', steps, 'bad-runs', bads.length);
  process.exit(bads.length ? 1 : 0);
})();
