// Service Worker（sw.js）の確認: オフライン起動・オフラインで国切替・更新直後の初回・壊れた保存からの復帰・遅いネットでの起動
// 自分で小さなサーバーを立てる（gohancho/ のコピーを一時フォルダに作り、index.html・sw.js だけ書きかえられるようにする。packs/ i18n/ は共有）。
//   node tools/qa/sw-offline.js        ... 全部 ok なら合格（FAIL が出たら終了コード1）
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const SRC = path.resolve(__dirname, '../../gohancho');
const MIME = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml'};
let fails = 0;
const ok = (name, cond, info) => { if (cond) console.log('ok:', name); else { fails++; console.log('FAIL:', name, info === undefined ? '' : JSON.stringify(info)); } };

// ---- サーバー ----
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'gohancho-sw-'));
for (const f of ['index.html', 'sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'privacy.html', 'support.html', 'privacy-en.html', 'support-en.html', 'remote.json']) fs.copyFileSync(path.join(SRC, f), path.join(ROOT, f));
for (const d of ['packs', 'i18n']) fs.symlinkSync(path.join(SRC, d), path.join(ROOT, d));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = f => c => { fs.writeFileSync(path.join(ROOT, f), c); const t = new Date(Date.now() + Math.random() * 1e3); fs.utimesSync(path.join(ROOT, f), t, t); };
const ORIG = {index: read('index.html'), sw: read('sw.js')};
const ctl = {delay: 0, hits: {}, override: {}, down: false};   // down: サーバーへつながらない（Playwright の setOffline は SW の通信に効かないので、サーバー側でも切る）   // delay: index.html を返すまでの遅れ(ms)
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (ctl.down) return req.destroy();
  ctl.hits[p] = (ctl.hits[p] || 0) + 1;
  if (ctl.override[p]) { res.writeHead(200, {'content-type': ctl.override[p].type}); return res.end(ctl.override[p].body); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile() || !file.startsWith(ROOT)) { res.writeHead(404); return res.end('no'); }
    const send = () => { res.writeHead(200, {'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'last-modified': st.mtime.toUTCString(), 'etag': '"' + st.size + '-' + st.mtimeMs + '"', 'cache-control': 'max-age=0'}); fs.createReadStream(file).pipe(res); };
    if (/index\.html$/.test(p) && ctl.delay) setTimeout(send, ctl.delay); else send();
  });
});

const trayReady = () => document.querySelectorAll('main .vessel').length >= 3 && !document.documentElement.classList.contains('i18n-wait');
let BASE;
const offline = (p, on) => { ctl.down = on; return p.ctx.setOffline(on); };
async function newPage(b, {cc = 'JP', seed = true} = {}) {
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'allow'});
  await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.ctx = ctx;
  if (seed) await p.addInitScript(([cc]) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-26', settings: {country: cc, dishCount: 4}})); } }, [cc]);
  // 画面を読み直した直後の evaluate が「古い画面の文脈が消えた」と失敗することがある（Playwright と SW の組み合わせ）。数回やり直す
  const ev = p.evaluate.bind(p);
  p.evaluate = async (...a) => { for (let i = 0; ; i++) { try { return await ev(...a); } catch (e) { if (i >= 3 || !/Execution context was destroyed|Target closed|navigation/.test(e.message)) throw e; await p.waitForLoadState('load').catch(() => {}); await p.waitForTimeout(300); } } };
  return p;
}
const tray = (p, ms = 15000) => p.waitForFunction(trayReady, null, {timeout: ms}).then(() => true, () => false);
// SW が入って、このページを操作している状態にする（入れてから読み直す）
async function controlled(p) {
  await p.evaluate(() => navigator.serviceWorker.ready.then(() => 1));
  await p.waitForFunction(() => caches.keys().then(k => k.some(x => x.startsWith('gohancho-v'))), null, {timeout: 15000});
  await p.reload(); await tray(p);
  await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, {timeout: 10000});
}
const cacheHas = (p, url) => p.evaluate(async u => { for (const k of await caches.keys()) { const c = await caches.open(k); if (await c.match(u, {ignoreSearch: true})) return k; } return null; }, url);
const swVersion = p => p.evaluate(() => caches.keys().then(k => k.filter(x => x.startsWith('gohancho-v'))));

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  BASE = `http://localhost:${server.address().port}/`;
  const b = await chromium.launch(LAUNCH);
  const reset = () => { ctl.override = {}; ctl.down = false; write('index.html')(ORIG.index); write('sw.js')(ORIG.sw); ctl.delay = 0; };

  // 0. 版の印が合っている
  {
    const v = /const VERSION = 'gohancho-(v\d+)'/.exec(ORIG.sw), a = /window\.ASSET_V='(v\d+)'/.exec(ORIG.index);
    ok('version: sw.js VERSION と index.html ASSET_V が同じ', v && a && v[1] === a[1], [v && v[1], a && a[1]]);
    ok('version: 国・辞書の読みこみは ?v= 付き', /assetUrl\(`packs\//.test(ORIG.index) && /assetUrl\(`i18n\//.test(ORIG.index) && /assetUrl\(`packs\/i18n\//.test(ORIG.index));
  }

  // 1. オフライン起動・オフラインで国切替
  {
    reset();
    const p = await newPage(b);
    await p.goto(BASE); ok('online: 献立が出る', await tray(p));
    await controlled(p);
    // 別の国を一度開いておく（オンライン）→ 日本に戻す
    ok('online: 米国に切替', await p.evaluate(async () => (await setCountry('US'), currentCountry())) === 'US');
    ok('online: 米国の料理が出る', await p.evaluate(async () => { await setCountry('US'); session.menu = null; render(); return session.menu && session.menu.items.some(x => x.r && x.r.pack === 'US'); }));
    await p.evaluate(async () => { await setCountry('JP'); });
    ok('cache: packs/us.js が保存された', !!(await cacheHas(p, BASE + 'packs/us.js')));
    ok('cache: i18n/en.js が保存された', !!(await cacheHas(p, BASE + 'i18n/en.js')));
    await offline(p, true);
    await p.reload(); ok('offline: 起動して献立が出る', await tray(p, 20000), p.errs);
    ok('offline: 起動でエラーなし', p.errs.length === 0, p.errs);
    const sw = await p.evaluate(() => !!navigator.serviceWorker.controller); ok('offline: SW が画面を操作している', sw);
    ok('offline: 保存した国（米国）に切替できる', await p.evaluate(async () => { const r = await setCountry('US'); session.menu = null; render(); return r !== false && currentCountry() === 'US' && session.menu.items.some(x => x.r && x.r.pack === 'US'); }));
    ok('offline: 保存していない国（韓国）は切り替わらず、画面は生きている', await p.evaluate(async () => { const before = currentCountry(); const r = await setCountry('KR'); render(); return {r, same: currentCountry() === before, n: document.querySelectorAll('main .vessel').length}; }).then(x => x.r === false && x.same && x.n >= 3));
    ok('offline: ページ移動（プライバシー）でも落ちない', await p.evaluate(async () => (await fetch('privacy.html')).ok));
    ok('offline: エラーなし（国切替のあと）', p.errs.length === 0, p.errs);
    await offline(p, false);
    await p.ctx.close();
  }

  // 2. 遅いネットではキャッシュで開き、裏で新しい版を保存する。次に開くと新しい版
  {
    reset();
    const p = await newPage(b);
    await p.goto(BASE); await tray(p); await controlled(p);
    write('index.html')(ORIG.index.replace('</body>', '<!--MARK2--></body>').replace('<script>window.ASSET_V', '<script>window.__mark2=1;window.ASSET_V'));
    ctl.delay = 5500;
    const t0 = Date.now();
    await p.reload({waitUntil: 'commit'}); const okTray = await tray(p, 20000); const dt = Date.now() - t0;
    ok('slow: 3秒で保存した画面に切り替わって開く', okTray && dt >= 2800 && dt < 5000, dt);
    ok('slow: 開いたのは前の版（保存した画面）', await p.evaluate(() => !window.__mark2));
    // 裏でネットの返事（新しい版）を保存するのを待つ
    const got = await p.waitForFunction(async () => { const r = await (await caches.match('./index.html', {ignoreSearch: true})).text(); return r.includes('MARK2'); }, null, {timeout: 20000, polling: 500}).then(() => true, () => false);
    ok('slow: 裏で新しい版が保存された', got);
    ctl.delay = 0;
    await p.reload(); await tray(p);
    ok('slow: 次に開くと新しい版', await p.evaluate(() => !!window.__mark2));
    // オフラインでも新しい版で開く
    await offline(p, true); await p.reload(); ok('slow: 新しい版のままオフラインで開く', (await tray(p)) && await p.evaluate(() => !!window.__mark2));
    await p.ctx.close();
  }

  // 3. 更新直後の初回: 版を上げると、前の版の国のデータが新しい版に移り、古い版は消え、開いていた画面に知らせる
  {
    reset();
    const p = await newPage(b);
    await p.goto(BASE); await tray(p); await controlled(p);
    await p.evaluate(async () => { await setCountry('US'); await setCountry('JP'); });
    await p.evaluate(() => { window.__upd = false; navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'gohancho-updated') window.__upd = true; }); });
    write('sw.js')(ORIG.sw.replace("'gohancho-v18'", "'gohancho-v19'"));
    write('index.html')(ORIG.index.replace("window.ASSET_V='v18'", "window.ASSET_V='v19';window.__v19=1"));
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    const upd = await p.waitForFunction(() => window.__upd, null, {timeout: 15000}).then(() => true, () => false);
    ok('update: 開いている画面に「更新した」と届く', upd);
    ok('update: 古い版の保存が消えて新しい版だけ', JSON.stringify(await swVersion(p)) === JSON.stringify(['gohancho-v19']), await swVersion(p));
    ok('update: 前の版の米国データが新しい版に移った', (await cacheHas(p, BASE + 'packs/us.js')) === 'gohancho-v19');
    // アプリに戻ってきたとき読み直して新しい版になる
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', {value: false, configurable: true}); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForFunction(() => window.__v19, null, {timeout: 15000}).catch(() => {});
    ok('update: 戻ってきたら新しい版に読み直される', await p.evaluate(() => !!window.__v19));
    // 更新直後に電波が切れても、米国に切り替えて使える
    await tray(p); await offline(p, true); await p.reload();
    ok('update: 更新直後でもオフラインで起動', await tray(p, 20000), p.errs);
    ok('update: 更新直後でもオフラインで米国に切替', await p.evaluate(async () => { const r = await setCountry('US'); session.menu = null; render(); return r !== false && session.menu.items.some(x => x.r && x.r.pack === 'US'); }));
    ok('update: 新しい版の辞書・国の取り直しは ?v=v19', await p.evaluate(() => assetUrl('packs/us.js')) === 'packs/us.js?v=v19');
    await p.ctx.close();
  }

  // 4. 壊れた保存からの復帰
  {
    // 4a. 保存してある画面（index.html）が壊れていて、ネットが遅い → 保存を捨てて読み直し、ネットから正しく開く
    reset();
    let p = await newPage(b);
    await p.goto(BASE); await tray(p); await controlled(p);
    await p.evaluate(async html => { const c = await caches.open((await caches.keys()).find(k => k.startsWith('gohancho-v'))); await c.put('./index.html', new Response(html.slice(0, Math.floor(html.length * 0.6)), {headers: {'content-type': 'text/html'}})); }, ORIG.index);
    ctl.delay = 4000;
    await p.reload({waitUntil: 'commit'});
    const healed = await tray(p, 30000);
    ok('broken: 壊れた画面の保存から、読み直して正しく開く', healed, p.errs);
    ok('broken: 保存が正しい画面に置きかわった', healed && await p.waitForFunction(async () => { const r = await caches.match('./index.html', {ignoreSearch: true}); return r && (await r.text()).includes('__gohanOK = 1'); }, null, {timeout: 15000, polling: 500}).then(() => true, () => false));
    ctl.delay = 0; await p.ctx.close();

    // 4b. 国のレシピの保存が壊れている（途中で切れた）→ 捨てて取り直して使える
    reset();
    p = await newPage(b);
    await p.goto(BASE); await tray(p); await controlled(p);
    await p.evaluate(async () => { await setCountry('US'); await setCountry('JP'); });
    await p.evaluate(async () => { const c = await caches.open((await caches.keys()).find(k => k.startsWith('gohancho-v'))); for (const k of await c.keys()) if (/packs\/us\.js/.test(k.url)) await c.put(k, new Response('GOHAN_PACK({"cc":"US", "recipes":[{"id":', {headers: {'content-type': 'text/javascript'}})); });
    await p.reload(); await tray(p);
    ok('broken: 壊れた国の保存でも、取り直して国に切替できる', await p.evaluate(async () => { delete PACKS.US; const r = await setCountry('US'); session.menu = null; render(); return r !== false && session.menu.items.some(x => x.r && x.r.pack === 'US'); }));
    ok('broken: 壊れた保存が正しいものに置きかわった', await p.evaluate(async () => (await (await caches.match('packs/us.js?v=' + ASSET_V)).text()).length > 10000));

    // 4c. 電波の入り口の案内ページ（HTML）が js の場所に返ってきても、保存しない
    await p.evaluate(async () => { const k = (await caches.keys()).find(k => k.startsWith('gohancho-v')); await (await caches.open(k)).delete('packs/us.js?v=' + ASSET_V, {ignoreSearch: true}); });
    ctl.override['/packs/us.js'] = {type: 'text/html', body: '<html>captive portal</html>'};
    await p.evaluate(async () => { delete PACKS.US; try { await setCountry('US'); } catch (e) {} });
    ok('broken: js の場所に返ってきた HTML は保存されない', !(await cacheHas(p, BASE + 'packs/us.js')));
    ctl.override = {};
    await p.ctx.close();

    // 4d. オフラインで保存も壊れている → 落ちずに止まる（入り口の画面が無い）。電波が戻ったら開ける
    reset();
    p = await newPage(b);
    await p.goto(BASE); await tray(p); await controlled(p);
    await offline(p, true);
    await p.evaluate(async html => { const c = await caches.open((await caches.keys()).find(k => k.startsWith('gohancho-v'))); await c.put('./index.html', new Response(html.slice(0, Math.floor(html.length * 0.6)), {headers: {'content-type': 'text/html'}})); }, ORIG.index);
    await p.reload().catch(() => {}); await p.waitForTimeout(2500);
    await offline(p, false);
    await p.goto(BASE); ok('broken: 電波が戻ったら開ける', await tray(p, 20000));
    await p.ctx.close();
  }

  await b.close(); server.close(); fs.rmSync(ROOT, {recursive: true, force: true});
  console.log(fails ? `FAIL ${fails}` : 'ALL OK');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
