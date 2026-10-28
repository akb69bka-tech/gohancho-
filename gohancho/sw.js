// わが家のご飯帖: オフラインで開けるようにアプリ本体をキャッシュする
// 版を上げるとき: VERSION と、index.html の ASSET_V を同じ値にする（tools/qa/sw-offline.js が一致を確かめる）
const VERSION = 'gohancho-v25';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './privacy.html', './support.html', './privacy-en.html', './support-en.html', './i18n/en.js'];
const IMG = 'gohancho-img-v1';
const NET_WAIT = 3000;   // アプリの画面: ネットがこの時間（ms）で返らなければ、保存してある画面で開く（ネットの返事は裏で待って保存する）

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
// 版を上げたとき、前の版で保存した国のレシピ・辞書・料理の絵を新しい版へ移してから古い版を消す
// （移さないと、更新した直後に電波がない場所で開いたとき、使っている国のデータがなくなる）
// 同じファイルは1つだけ残す（?v= が違うだけの古いものは、新しい版のものがあれば移さない）
const KEEP = /\/(packs|i18n|img)\//;
async function carryOver(oldKeys){
  const cur = await caches.open(VERSION);
  for (const k of oldKeys){
    const old = await caches.open(k);
    for (const req of await old.keys()){
      if (!KEEP.test(new URL(req.url).pathname) || await cur.match(req, {ignoreSearch:true})) continue;
      const res = await old.match(req); if (res) await cur.put(req, res);
    }
  }
}
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter(k => k !== VERSION && k !== IMG && k.startsWith('gohancho-'));
    await carryOver(old).catch(() => {});
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    // 前の版からの更新: 開いている画面に知らせる（画面は、アプリに戻ってきたときに読み直す）
    if (old.length) for (const c of await self.clients.matchAll()) c.postMessage({type:'gohancho-updated'});
  })());
});
// 画面からの頼み: 壊れた保存を捨てる（そのファイルだけ／すべて）
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'evict' && typeof d.url === 'string') e.waitUntil(evict(d.url));
  else if (d.type === 'reset') e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('gohancho-') && k !== IMG).map(k => caches.delete(k)))));
});
async function evict(url){
  const c = await caches.open(VERSION), u = new URL(url, self.location.href);
  for (const req of await c.keys()){ const r = new URL(req.url); if (r.origin === u.origin && r.pathname === u.pathname) await c.delete(req); }
}

// 保存してよい返事か（エラーページや、電波の途中で出る別のページを保存しない）
function okFor(res, kind){
  if (!res || !res.ok || res.status !== 200 || res.type === 'opaque') return false;
  const ct = res.headers.get('content-type') || '';
  if (kind === 'html') return /html/i.test(ct) || ct === '';
  return !/text\/html/i.test(ct);   // js・json の場所に別のページ（電波の入り口の案内など）が返ってきたら保存しない
}
// 同じファイルで ?v= だけ違う古い保存を消して、1つだけ残す
async function putOne(cache, req, res){
  await cache.put(req, res);
  const u = new URL(req.url);
  if (!u.search) return;
  for (const k of await cache.keys()){ const r = new URL(k.url); if (r.pathname === u.pathname && r.origin === u.origin && r.search !== u.search) await cache.delete(k); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function differs(a, b){
  const h = r => (r.headers.get('etag') || '') + '|' + (r.headers.get('last-modified') || '') + '|' + (r.headers.get('content-length') || '');
  if (h(a) !== '||' && h(b) !== '||') return h(a) !== h(b);
  return (await a.clone().text()) !== (await b.clone().text());
}

// アプリの画面: まずネットから最新を取る。3秒で返らなければ保存してある画面で開き、ネットの返事は裏で待って保存する
// （保存した画面と違っていたら、開いている画面に知らせる）
async function appShell(e, req, key){
  const cache = await caches.open(VERSION);
  const cached = await cache.match(key, {ignoreSearch:true}) || await cache.match('./index.html');
  let fresh;
  try{ fresh = new Request(req, {cache:'no-cache'}); }catch(err){ fresh = req; }   // 端末の一時保存に頼らず、変わっているか確かめる
  // 本文を最後まで受け取ってから返す（ヘッダーが来ただけで「間に合った」とせず、3秒の中に画面が届いたかを見る）。
  // 保存するのは、アプリの画面だとわかるものだけ（電波の入り口の案内ページなどで、いまの画面を上書きしない）
  const net = fetch(fresh).then(async res => {
    if (!okFor(res, 'html') || res.redirected) return res;
    const buf = await res.arrayBuffer(), out = new Response(buf, {status: res.status, statusText: res.statusText, headers: res.headers});
    if (new TextDecoder().decode(buf).includes('window.__gohanOK = 1')) await cache.put(key, out.clone());
    return out;
  });
  if (!cached) return net.catch(() => Response.error());
  let late = false;
  const first = await Promise.race([net.catch(() => null), sleep(NET_WAIT).then(() => { late = true; return null; })]);
  if (first && okFor(first, 'html')) return first;
  if (first && first.status >= 400 && first.status < 500) return first;   // 本当に無いページ
  // 遅い・つながらない・サーバーのエラー: 保存してある画面で開く
  if (late) e.waitUntil(net.then(async res => {
    if (okFor(res, 'html') && await differs(res, cached)) for (const c of await self.clients.matchAll()) c.postMessage({type:'gohancho-updated'});
  }, () => {}));
  return cached;
}
// 国のレシピ（packs/、packs/i18n/）・画面の言葉（i18n/）・料理の絵の一覧: 保存してあればすぐ出し、裏で最新を取って次から使う（stale-while-revalidate）。
// 画面が ?v= 付きで頼むので、版が変わったら別のファイルとしてネットから取る。ネットがだめなら、?v= が違う古い保存でも出す
async function swr(e, req, kind){
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  // 保存してあるものがあるときの確かめは「変わっていなければ中身は送らない」形で聞く（毎回、国のレシピや絵の一覧を取り直さない）
  let ask = req; if (hit){ try{ ask = new Request(req, {cache:'no-cache'}); }catch(err){} }
  const net = fetch(ask).then(async res => { if (okFor(res, kind)) await putOne(cache, req, res.clone()); return res; });
  if (hit){ e.waitUntil(net.catch(() => {})); return hit; }
  try{
    const res = await net; if (okFor(res, kind)) return res;
    return (await cache.match(req, {ignoreSearch:true})) || res;
  }catch(err){
    return (await cache.match(req, {ignoreSearch:true})) || Response.error();
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  // ページ本体
  // アプリの画面（/ と index.html）だけを './index.html' として保存する。プライバシーなど別のページはそのページのURLで保存
  if (req.mode === 'navigate'){
    const isApp = same && /\/(index\.html)?$/.test(url.pathname);
    if (isApp){ e.respondWith(appShell(e, req, './index.html')); return; }
    e.respondWith(fetch(req).then(res => { if (okFor(res, 'html')){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, {ignoreSearch:true}).then(hit => hit || caches.match('./index.html')).then(hit => hit || Response.error())));
    return;
  }
  // 料理写真: 一度見たものは電波がなくても出す
  if (/(^|\.)upload\.wikimedia\.org$/.test(url.hostname)){
    e.respondWith(caches.open(IMG).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  // ChatGPT で作った絵の一覧
  if (same && /\/img\/dish\/manifest\.json$/.test(url.pathname)){ e.respondWith(swr(e, req, 'json')); return; }
  // 国のレシピ（packs/、packs/i18n/）と画面の言葉の辞書（i18n/）
  if (same && /\/(packs|i18n)\/.+\.js$/.test(url.pathname)){ e.respondWith(swr(e, req, 'js')); return; }
  // 同じサイトのファイル（アイコン・料理の絵など）。一度見たものは保存して電波がなくても出す
  if (same && /\/img\//.test(url.pathname)){
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (same){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
});
