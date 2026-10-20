// わが家のごはん帖: オフラインで開けるようにアプリ本体をキャッシュする
const VERSION = 'gohancho-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './privacy.html', './support.html', './i18n/en.js'];
const IMG = 'gohancho-img-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== IMG).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // ページ本体: まずネットから最新を取り、だめならキャッシュ
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // 料理写真とフォント: 一度見たものは電波がなくても出す
  if (/(^|\.)upload\.wikimedia\.org$|fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.open(IMG).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  // ChatGPT で作った絵の一覧: 作り直したら反映されるよう、まずネットから
  if (url.origin === self.location.origin && /\/img\/dish\/manifest\.json$/.test(url.pathname)){
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, {ignoreSearch:true})));
    return;
  }
  // 国のレシピ（packs/）と画面の言葉の辞書（i18n/）: 直したら反映されるよう、まずネットから。だめならキャッシュ（電波がなくても使える）
  if (url.origin === self.location.origin && /\/(packs|i18n)\/[^/]+\.js$/.test(url.pathname)){
    e.respondWith(fetch(req).then(res => { if (res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, {ignoreSearch:true}).then(hit => hit || Response.error())));
    return;
  }
  // 同じサイトのファイル（アイコン・料理の絵など）。一度見たものは保存して電波がなくても出す
  if (url.origin === self.location.origin && /\/img\//.test(url.pathname)){
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin === self.location.origin){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
});
