// 料理を入れ替えたり画像が読み込まれたりしたとき、画面がガタつかない（押した料理以外の位置・大きさが変わらない）ことを確かめる。
//  - PerformanceObserver('layout-shift') の合計（CLS）
//  - 操作の前後で、全要素の位置・大きさ（getBoundingClientRect）を比べる。押した料理の中身以外が1px(0.5px超)でも動いたら違反
//  - スクロール位置のずれ
// 使い方: BASE=http://localhost:8791/ node tools/qa/layout-shift.js [--quick] [--json out.json]
//   環境変数 CCS=JP,US  国を絞る / WIDTHS=320,390  幅を絞る / SCALES=1,1.25  文字の拡大 / IMG=ok,fail,slow  画像の状態
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const BASE = process.env.BASE || 'http://localhost:8765/';
const quick = process.argv.includes('--quick');
const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
const list = (k, d) => (process.env[k] ? process.env[k].split(',') : d);
const WIDTHS = list('WIDTHS', quick ? ['390'] : ['320', '375', '390', '430']).map(Number);
const SCALES = list('SCALES', quick ? ['1'] : ['1', '1.25']).map(Number);
const IMGS = list('IMG', quick ? ['ok'] : ['ok', 'fail', 'slow']);
const TOL = 0.5;
const jobs = process.argv.includes('--jobs') ? Number(process.argv[process.argv.indexOf('--jobs') + 1]) : 1;
if (jobs > 1 && !process.env.LS_CHILD) {   // 国ごとに分けて並列に走らせ、結果を合わせる
  (async () => {
    const { chromium: c0 } = { chromium };
    const br = await c0.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}); const pg = await br.newPage(); await pg.goto(BASE); await pg.waitForTimeout(500);
    const all = process.env.CCS ? process.env.CCS.split(',') : await pg.evaluate(() => COUNTRIES.map(c => c.cc)); await br.close();
    const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-')); const parts = Array.from({length: jobs}, (_, i) => all.filter((_, k) => k % jobs === i)).filter(a => a.length);
    const outs = await Promise.all(parts.map((ccs, i) => new Promise(res => { const f = path.join(dir, i + '.json'); const ch = spawn(process.execPath, [__filename, ...process.argv.slice(2).filter((a, k, arr) => a !== '--jobs' && arr[k - 1] !== '--jobs' && a !== '--json' && arr[k - 1] !== '--json'), '--json', f], {env: Object.assign({}, process.env, {LS_CHILD: '1', CCS: ccs.join(',')}), stdio: ['ignore', 'pipe', 'inherit']}); let o = ''; ch.stdout.on('data', d => o += d); ch.on('close', () => { process.stdout.write(o.split('\n').filter(l => l.startsWith('SHIFT')).slice(0, 6).join('\n') + '\n'); res(f); }); })));
    const results = outs.flatMap(f => { try { return JSON.parse(fs.readFileSync(f)).results; } catch (e) { return []; } });
    report(results, [], jsonOut); })();
  return;
}

// ページ内に入れる計測の道具
const INJECT = () => {
  window.__cls = 0; window.__shifts = [];
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__cls += e.value; window.__shifts.push({v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 3).map(s => (s.node && (s.node.className || s.node.nodeName)) + '').join('|')}); } }).observe({type: 'layout-shift', buffered: true}); } catch (e) {}
  const keyOf = el => { const a = []; for (let n = el; n && n !== document.body; n = n.parentElement) { const p = n.parentElement; a.push(n.tagName + (p ? ':' + [...p.children].indexOf(n) : '')); } return a.reverse().join('>'); };
  window.__keyOf = keyOf;
  window.__snap = () => {
    const out = {}, fixedCache = new Map();
    const isFixed = el => { for (let n = el; n && n !== document.documentElement; n = n.parentElement) { if (fixedCache.has(n)) return fixedCache.get(n); if (getComputedStyle(n).position === 'fixed') return true; } return false; };
    const stop = window.__stop ? document.querySelector(window.__stop) : null;
    for (const el of document.body.querySelectorAll('*')) {
      if (stop && stop !== el && (stop.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) && !stop.contains(el)) continue;
      if (/^(SCRIPT|STYLE|PATH|CIRCLE|RECT|G|LINE|POLYGON|ELLIPSE|DEFS|LINEARGRADIENT|RADIALGRADIENT|STOP|USE|TEXT|TSPAN)$/i.test(el.tagName) || el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
      const fx = isFixed(el); const dx = fx ? 0 : scrollX, dy = fx ? 0 : scrollY;
      out[keyOf(el)] = [r.left + dx, r.top + dy, r.width, r.height, (el.className && el.className.baseVal === undefined ? el.className : el.tagName).toString().slice(0, 40), fx ? 1 : 0];
    }
    return {rects: out, sy: scrollY, docH: document.documentElement.scrollHeight};
  };
};

function compare(a, b, exempt, vh = 844, above = null) {   // above: この高さ(文書内)より下は比べない

  let worst = 0, n = 0, worstAll = 0; const offenders = [];
  for (const k in a.rects) {
    if (!(k in b.rects)) continue;
    if (exempt && exempt.some(x => k.startsWith(x + '>') || x.startsWith(k + '>'))) continue;   // 押した料理の中身と、それを入れている入れ物（高さが変わると下が動くので、動いた「下の要素」で見る）は除く
    const p = a.rects[k], q = b.rects[k];
    if (above !== null && !p[5] && p[1] >= above - 0.5) continue;
    const isBox = (exempt && !exempt.noBox && exempt.includes(k)) || /vessel|tray/.test(q[4]);
    if (/toast/.test(q[4])) continue;   // 知らせ（トーストは画面に固定で、文が変わると大きさも変わる。レイアウトは押さない）   // 枠そのものは大きさも見る。ほかは位置だけ（文字の幅が変わっても、まわりが動かなければよい）
    const sa = p[5] ? 0 : a.sy, sb = q[5] ? 0 : b.sy;   // 画面の上からの位置で比べる（スクロール位置を戻す対策が効いているかも見える）
    const py = p[1] - sa, qy = q[1] - sb;
    const d = Math.max(Math.abs(p[0] - q[0]), Math.abs(py - qy), isBox ? Math.abs(p[2] - q[2]) : 0, isBox ? Math.abs(p[3] - q[3]) : 0);
    const vis = (py + p[3] > 0 && py < vh) || (qy + q[3] > 0 && qy < vh);   // 画面に見えているところだけ数える（画面の下の遠くが動くのは、見えない）
    if (d > TOL) worstAll = Math.max(worstAll, d);
    if (d > TOL && vis) { n++; if (d > worst) worst = d; if (offenders.length < 4) offenders.push(`${q[4]} ${p.slice(0, 4).map(Math.round)}->${q.slice(0, 4).map(Math.round)}`); }
  }
  return {worst: +worst.toFixed(1), n, offenders, worstAll: +worstAll.toFixed(1)};
}

var results = []; // {scn, cc, w, sc, img, cls, worst, n, dsy, off}
const record = r => { if (process.env.ONLY && !r.scn.includes(process.env.ONLY)) return; results.push(r); if ((r.worst > TOL || r.cls > 0.001) && results.filter(x => x.scn === r.scn && (x.worst > TOL || x.cls > 0.001)).length <= 2) console.log('SHIFT', r.scn, r.cc, r.w, 'x' + r.sc, r.img, 'cls=' + r.cls.toFixed(3), 'worst=' + r.worst, 'n=' + r.n, 'dSY=' + r.dsy, (r.off || []).join(' / ')); };

(async () => {
  let b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const errs = [];
  const probe = await b.newPage(); await probe.goto(BASE); await probe.waitForTimeout(500);
  const allCC = await probe.evaluate(() => COUNTRIES.map(c => c.cc)); await probe.close();
  const CCS = list('CCS', quick ? ['JP', 'US', 'KR', 'EG'] : allCC);
  // 組み合わせ: A = 全部の操作を 390px・文字等倍・絵あり / B = お膳まわりの操作を ほかの幅と文字拡大 / C = 絵の失敗・遅い読み込み
  const tasks = [];
  CCS.forEach((cc, ci) => {
    if (quick) { for (const im of IMGS) for (const n of [4, 6]) tasks.push({cc, w: 390, sc: 1, img: im, n, lv: 'full'}); return; }
    for (const n of [4, 6]) tasks.push({cc, w: 390, sc: 1, img: 'ok', n, lv: 'full'});
    for (const w of WIDTHS) for (const sc of SCALES) { if (w === 390 && sc === 1) continue; tasks.push({cc, w, sc, img: 'ok', n: ci % 2 ? 6 : 4, lv: 'core'}); }
    for (const im of IMGS) if (im !== 'ok') for (const [w, sc] of [[390, 1], [320, 1.25]]) tasks.push({cc, w, sc, img: im, n: ci % 2 ? 6 : 4, lv: 'img'});
  });
  for (const {cc, w, sc, img, n, lv} of tasks) {
    try {
      const ctx = await b.newContext({viewport: {width: w, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
      await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
      if (img === 'fail') await ctx.route(/\/img\//, r => r.abort());
      if (img === 'slow') await ctx.route(/\/img\//, async r => { await new Promise(s => setTimeout(s, 700)); r.continue(); });
      const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ' ' + e.message));
      await p.addInitScript(([cc, n, sc, INJECT]) => {
        if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-26', settings: {country: cc, dishCount: n}})); }
        new Function('(' + INJECT + ')()')();
        if (sc !== 1) document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = sc * 100 + '%'; });
      }, [cc, n, sc, INJECT.toString()]);
      await p.goto(BASE); await p.waitForTimeout(img === 'slow' ? 3000 : 1500);
      await p.evaluate(() => { window.hasPro = () => true; session.menu = null; render(); });
      await p.waitForTimeout(img === 'slow' ? 1500 : 800);
      const base = {cc, w, sc, img: img + (quick || true ? '/n' + n : '')};

      // 1つの操作を実行して前後を比べる。exemptSel: 中身が変わってよい入れ物の選び方
      //   'press:.spot' = 押したボタンを含む .spot の中身だけ / '.tray' など = その CSS に合う要素の中身
      const act = async (scn, doFn, arg, exemptSel, scrollTo, stop) => {
        if (process.env.ONLY && !scn.includes(process.env.ONLY)) return;
        await p.evaluate(st => { window.__stop = st || null; }, stop);
        if (scrollTo === 'btn' || scrollTo === 'btn2') { await p.evaluate(([fn, arg]) => { const el = fn === 'reroll' ? document.querySelectorAll('.tray [data-act="reroll"]')[arg] : fn === 'sel' ? document.querySelector(arg) : fn === 'nth' ? document.querySelectorAll(arg[0])[arg[1]] : null; if (el) el.scrollIntoView({block: 'center'}); }, [doFn, arg]); await p.waitForTimeout(120); }   // 押すボタンが見える位置で押す（見えないボタンは押せない）
        else if (scrollTo !== undefined) { await p.evaluate(y => window.scrollTo(0, y), scrollTo); await p.waitForTimeout(120); }
        const before = await p.evaluate(() => window.__snap());
        const exempt = await p.evaluate(([fn, arg, ex]) => {
          window.__cls = 0; window.__shifts = [];
          const el = fn === 'reroll' ? document.querySelectorAll('.tray [data-act="reroll"]')[arg] : fn === 'sel' ? document.querySelector(arg) : fn === 'nth' ? document.querySelectorAll(arg[0])[arg[1]] : null;
          const keys = ex.startsWith('press:') ? (el && el.closest(ex.slice(6)) ? [window.__keyOf(el.closest(ex.slice(6)))] : []) : [...document.querySelectorAll(ex)].map(window.__keyOf);
          if (el) el.click(); else if (fn === 'eval') (0, eval)(arg);
          return keys;
        }, [doFn, arg, exemptSel]);
        if (/world|week|cook/.test(exemptSel)) exempt.noBox = true;
        const imm = await p.evaluate(() => window.__snap());
        if (process.env.DBG) console.log('DBG', scn, JSON.stringify(await p.evaluate(() => [session.trayShown, [...document.querySelectorAll('.tray .vessel')].map(e => e.className.replace('vessel ', ''))])));
        await p.waitForTimeout(img === 'slow' ? 1400 : 600);
        const after = await p.evaluate(() => window.__snap());
        const cls = await p.evaluate(() => window.__cls);
        if (process.env.DBG) console.log('DBG2', scn, JSON.stringify(await p.evaluate(() => [[...document.querySelectorAll('.tray .vessel')].map(e => e.className.replace('vessel ', '') + ':' + Math.round(e.getBoundingClientRect().top))])));
        // お膳ごと入れ替える操作: お膳の高さが同じなら、お膳より下も動いてはいけない。高さが変わる（品数や一品ものの有無が変わった）ときは、お膳より上だけ見る
        let above = null;
        const tk = exempt.find(k => before.rects[k] && /(^| )tray( |$)/.test(before.rects[k][4]));
        if (exemptSel.startsWith('.tray') && tk) { const tb = before.rects[tk], ta = after.rects[tk]; if (tb && ta && Math.abs(tb[3] - ta[3]) > TOL) above = tb[1]; }
        const c1 = compare(before, imm, exempt, 844, above), c2 = compare(before, after, exempt, 844, above);
        const c = c2.worst >= c1.worst ? c2 : c1;
        record(Object.assign({}, base, {scn, cls, worst: c.worst, n: c.n, all: c.worstAll, dsy: Math.round(after.sy - before.sy), off: c.offenders, dh: Math.round(after.docH - before.docH)}));
      };

      const nBtn = await p.evaluate(() => document.querySelectorAll('.tray [data-act="reroll"]').length);
      // かえる: 各枠を数回。押した枠の「箱」自体（spot）が動かないことも見るため、exempt は spot の中身（子孫）のみ
      for (let rep = 0; rep < 2; rep++) for (let k = 0; k < nBtn; k++) {
        await act('かえる', 'reroll', k, 'press:.spot', rep === 1 ? 'btn' : 0);
      }
      // 主食
      if (await p.evaluate(() => !!document.querySelector('[data-act="staple-next"]'))) for (let i = 0; i < 2; i++) await act('主食かえる', 'sel', '[data-act="staple-next"]', 'press:.spot', 'btn');
      await p.evaluate(() => { S.condOpen = true; render(); }); await p.waitForTimeout(200);
      // 気分・まるごと入れ替え（お膳の中は変わってよい。お膳の外は動かない）
      for (const k of ['fish', 'meat', 'quick']) await act('気分', 'sel', `[data-act="mood"][data-k="${k}"]`, '.tray,.cond-sum', 'btn');
      for (let i = 0; i < 2; i++) await act('まるごと入れ替え', 'sel', '.shuffle', '.tray', 'btn');
      // 条件を開く/閉じる: 開いたぶん下が動くのは当然なので計測しない。品数を変える（同じ品数の中での入れ替えは上で確認済み）
      // あと1品
      await act('あと1品を開く', 'sel', '[data-act="one-open"]', '.tray', 'btn');
      await p.evaluate(() => { if (typeof closeSheet === 'function') closeSheet(); });
      // 保存した献立を適用
      await p.evaluate(() => { saveMenu(); });
      await p.waitForTimeout(300);
      await act('保存献立を適用', 'eval', `(()=>{const id=(S.savedMenus||[])[0]&&S.savedMenus[0].id; if(id){ session.menu.items.forEach(x=>{}); setTab('log'); setTab('today'); applySavedMenu(id);} })()`, '.tray', 0);
      // 1週間プラン: 日の入れ替え
      await p.evaluate(() => { makeWeek(); setTab('today'); render(); });
      await p.waitForTimeout(600);
      const wd = await p.evaluate(() => document.querySelectorAll('[data-act="week-reroll"]').length);
      for (let k = 0; k < Math.min(wd, 3); k++) {
        await act('週プラン日かえる', 'eval', `(()=>{const el=document.querySelectorAll('[data-act="week-reroll"]')[${k}]; el.click();})()`, '.week .item:nth-child(' + (k + 1) + '),.week ~ *', 0, '.list.shop');
      }
      if (lv !== 'core') {
      // 作り方タブ: 料理のタブを切り替える（タブの列と、その上は動かない）
      {
        await p.evaluate(() => { const b = document.querySelector('[data-act="decide"]'); if (b) b.click(); });
        await p.waitForTimeout(700);
        const nt = await p.evaluate(() => document.querySelectorAll('.cook-tab').length);
        for (let k = 1; k < nt; k++) await act('作り方・料理タブ切替', 'nth', ['.cook-tab', k], '.cook-card,.cook-nav,.cook-nav ~ *', 'btn2');
        for (let k = nt - 2; k >= 0; k--) await act('作り方・料理タブ切替', 'nth', ['.cook-tab', k], '.cook-card,.cook-nav,.cook-nav ~ *', 'btn2');
        // 作り方の詳細（くわしく見る）を開いて閉じる: 開いた画面の中で、絵が読み込まれても大きさが変わらない
        await p.evaluate(() => setTab('today'));
      }
      // 料理の詳細（モーダル）: 絵が読み込まれる前後で、枠の大きさと文字の位置が変わらない
      for (let k = 0; k < 3; k++) {
        await p.evaluate(() => { closeSheet && closeSheet(); setTab('today'); });
        await p.waitForTimeout(150);
        await p.evaluate(() => { if (!document.getElementById('noanim')) { const st = document.createElement('style'); st.id = 'noanim'; st.textContent = '.pop{animation:none!important}'; document.head.appendChild(st); } });   // 開くときの浮き上がり（transform）は、レイアウトのずれではない
        await p.evaluate(k => { window.__cls = 0; const ids = session.menu.items.map(x => x.r && x.r.id).filter(Boolean); openModal(ids[k % ids.length]); }, k);
        const a0 = await p.evaluate(() => window.__snap());
        await p.waitForTimeout(img === 'slow' ? 1800 : 900);
        const b0 = await p.evaluate(() => window.__snap()); const cls0 = await p.evaluate(() => window.__cls);
        const c0 = compare(a0, b0, [], 844);
        record(Object.assign({}, base, {scn: '料理の詳細（絵の読み込み）', cls: cls0, worst: c0.worst, n: c0.n, all: c0.worstAll, dsy: Math.round(b0.sy - a0.sy), off: c0.offenders}));
        await p.evaluate(() => { modalId = null; renderModal && renderModal(); });
      }
      }
      if (lv === 'full') {
      // 絵がない状態（イラスト）から、あとで絵が届いたとき: 詳細の枠と文字の位置が変わらない
      for (let k = 0; k < 2; k++) {
        await p.evaluate(() => { modalId = null; renderModal && renderModal(); setTab('today'); });
        const hid = await p.evaluate(k => { const ids = session.menu.items.map(x => x.r && x.r.id).filter(Boolean); const id = ids[k % ids.length]; window.__g = [id, GEN[id], PHOTOS[id]]; delete GEN[id]; delete PHOTOS[id]; openModal(id); return id; }, k);
        const a1 = await p.evaluate(() => window.__snap());
        await p.evaluate(() => { const [id, g, ph] = window.__g; if (g) GEN[id] = g; if (ph) PHOTOS[id] = ph; renderModal(); });
        await p.waitForTimeout(img === 'slow' ? 1500 : 700);
        const b1 = await p.evaluate(() => window.__snap());
        const c1 = compare(a1, b1, [], 844);
        record(Object.assign({}, base, {scn: '料理の詳細（絵なし→絵が届く）', cls: 0, worst: c1.worst, n: c1.n, all: c1.worstAll, dsy: 0, off: c1.offenders}));
      }
      // 言語を切り替える: 同じ献立のお膳の高さと、下のタブの高さが変わらない
      for (const lg of (quick ? ['en', 'ar'] : ['en', 'ko', 'ar', 'th', 'de', 'vi', 'hi'])) {
        await p.evaluate(() => setTab('today')); await p.waitForTimeout(200);
        const bf = await p.evaluate(() => { const t = document.querySelector('.tray'); return t ? Math.round(t.getBoundingClientRect().height) : 0; });
        await p.evaluate(async lg => { S.settings.uiLang = lg; save(); await setLang(lg); await refreshRecipes(); render(); }, lg);
        await p.waitForTimeout(img === 'slow' ? 1200 : 700);
        const af = await p.evaluate(() => { const t = document.querySelector('.tray'); return t ? Math.round(t.getBoundingClientRect().height) : 0; });
        record(Object.assign({}, base, {scn: '言語切替（お膳の高さ）', cls: 0, worst: Math.abs(af - bf) > 0 ? Math.abs(af - bf) : 0, n: 0, all: 0, dsy: 0, off: [lg + ' ' + bf + '->' + af]}));
      }
      }
      // 世界タブ: 国を切り替え、画像が読み込まれる
      {
        await p.evaluate(() => setTab('world')); await p.waitForTimeout(img === 'slow' ? 2500 : 1500);
        await act('世界・国を選ぶ', 'eval', `(()=>{const bs=[...document.querySelectorAll('[data-act="world-cc"]')]; const e=bs.find(x=>x.getAttribute('aria-pressed')!=='true'); if(e) e.click();})()`, '.world-sec .world-list,.world-sec .world-head,.world-sec .sec-head,.world-sec .row,.world-sec .empty');
        await p.evaluate(() => setTab('today'));
      }
      if (lv !== 'core') {
      // 世界タブをスクロールで下まで読み進める: 行の高さの見積もり（content-visibility）と実際の違いで、画面の位置がずれない
      {
        await p.evaluate(() => { setTab('world'); window.scrollTo(0, 0); }); await p.waitForTimeout(img === 'slow' ? 2500 : 1500);
        await p.evaluate(() => { window.__cls = 0; });
        let drift = 0, worst = 0;
        for (let i = 0; i < 12; i++) {
          // 画面の真ん中あたりの行を目印にして、スクロールしたあと、その行がどれだけ「勝手に」動いたかを見る
          const r = await p.evaluate(async () => { const rows = [...document.querySelectorAll('.world-list .match')]; const vis = rows.find(e => e.getBoundingClientRect().top > 120); if (!vis) return null; const a = vis.getBoundingClientRect().top; window.scrollBy(0, 0); await new Promise(r => setTimeout(r, 60)); const b2 = vis.getBoundingClientRect().top; return Math.abs(b2 - a); });
          await p.evaluate(() => window.scrollBy(0, 420)); await p.waitForTimeout(img === 'slow' ? 350 : 120);
          if (r !== null) worst = Math.max(worst, r);
        }
        const cls = await p.evaluate(() => window.__cls);
        record(Object.assign({}, base, {scn: '世界タブをスクロール', cls, worst, n: 0, all: worst, dsy: 0, off: []}));
        await p.evaluate(() => setTab('today'));
      }
      }
      // 横にはみ出して、画面全体が横に広がらない（固定の下タブがずれる原因になる）
      for (const tb of ['today', 'cook', 'fridge', 'twist', 'world', 'log', 'settings']) {
        const ov = await p.evaluate(async tb => { setTab(tb); await new Promise(r => setTimeout(r, 350)); return document.documentElement.scrollWidth - document.documentElement.clientWidth; }, tb);
        record(Object.assign({}, base, {scn: '横はみ出し（7つのタブ）', cls: 0, worst: Math.max(0, ov), n: 0, all: Math.max(0, ov), dsy: 0, off: [tb + ' +' + ov + 'px']}));
      }
      await ctx.close();
    } catch (e) { errs.push(`${cc} ${w} x${sc} ${img} n${n}: ${String(e.message).split('\n')[0]}`); try { await b.close(); } catch (e2) {} b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}); }
  }
  await b.close();

  report(results, errs, jsonOut);
})();
function report(results, errs, jsonOut) {
  const groups = {};
  for (const r of results) { const g = groups[r.scn] = groups[r.scn] || {all: 0, runs: 0, bad: 0, cls: 0, clsMax: 0, worst: 0, dsy: 0, dh: 0}; g.runs++; if (r.worst > TOL || r.cls > 0.001 || Math.abs(r.dsy) > 1) g.bad++; g.cls += r.cls; g.clsMax = Math.max(g.clsMax, r.cls); g.worst = Math.max(g.worst, r.worst); g.all = Math.max(g.all, r.all || 0); g.dsy = Math.max(g.dsy, Math.abs(r.dsy)); }
  console.log('\n操作 | 回数 | 違反 | CLS合計 | CLS最大 | 画面内の最大ずれpx | ページ全体の最大ずれpx | 最大スクロールずれ');
  for (const k in groups) { const g = groups[k]; console.log(`${k} | ${g.runs} | ${g.bad} | ${g.cls.toFixed(3)} | ${g.clsMax.toFixed(3)} | ${g.worst} | ${g.all} | ${g.dsy}`); }
  console.log('errs', errs.slice(0, 3));
  if (jsonOut) require('fs').writeFileSync(jsonOut, JSON.stringify({groups, results}, null, 1));
}
