#!/usr/bin/env node
// 写真風の料理の絵（via:'photo'。Gemini で作った画像を tools/illustrations/import-photos.mjs で取りこんだもの）
//   node tools/tests/photo-dish.mjs        （自分で小さなサーバーを立てる。リポジトリのファイルは書きかえない）
//  F1 取りこみの道具: <ID>.png / .jpg / .webp（横長も）を、512×512 と 192×192 の WebP にして、manifest を via:'photo'・model:'gemini' に変える。
//     40KB 以内。入っていない ID・一覧にない名前の画像は、manifest をそのまま（手描きの SVG のまま）
//  F2 お膳: 写真の料理は写真（.webp）を、ほかの料理は SVG を、手描きの絵と同じ場所・同じ大きさで出す
//  F3 詳しい画面: 写真の料理は丸く切った写真と Gemini の注記。SVG の料理はいままでどおり
//  F4 一覧（料理をさがす）: 写真の料理は 192px の写真、ほかは SVG の小さい絵
//  F5 暗い表示: 写真の生成りの四角い背景が、お膳の上に見えない（器のまわりの角はお膳の色）
//  F6 オフライン: 一度見た写真の絵は、電波がなくても出る（sw.js のキャッシュ）
//  F7 試せるページ（data URL で埋めこんだ絵）: image/webp の data URL も写真として出す
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..'), APP = path.join(REPO, 'gohancho');
let fails = 0, checks = 0;
const ok = (c, m, info) => { checks++; if (!c){ fails++; console.log('FAIL', m, info === undefined ? '' : JSON.stringify(info), ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m); };

// ---- 取りこみの道具を、一時フォルダに写した manifest に対して動かす（リポジトリの manifest は変えない） ----
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gohancho-photo-'));
fs.mkdirSync(path.join(TMP, 'tools/illustrations'), { recursive: true }); fs.mkdirSync(path.join(TMP, 'tools/lib'), { recursive: true });
fs.mkdirSync(path.join(TMP, 'gohancho/img/dish/t'), { recursive: true });
fs.copyFileSync(path.join(REPO, 'tools/illustrations/import-photos.mjs'), path.join(TMP, 'tools/illustrations/import-photos.mjs'));
fs.copyFileSync(path.join(REPO, 'tools/lib/pw.cjs'), path.join(TMP, 'tools/lib/pw.cjs'));
// 本物の写真がすでに入っていても、この点検は「写真なし（手描きの SVG だけ）」から始める。SVG が残っている料理は SVG の形に戻した manifest を使う
const ORIG = JSON.parse(fs.readFileSync(path.join(APP, 'img/dish/manifest.json'), 'utf8'));
for (const [id, it] of Object.entries(ORIG.items)){
    if (it.via === 'photo' && fs.existsSync(path.join(APP, 'img/dish', id + '.svg')))ORIG.items[id] = { ...it, file: id + '.svg', via: 'svg', model: 'hand-drawn-3q' };
}
fs.writeFileSync(path.join(TMP, 'gohancho/img/dish/manifest.json'), JSON.stringify(ORIG));
const TDISH = path.join(TMP, 'gohancho/img/dish');

// ---- サーバー: gohancho/ をそのまま出す。override に入れたもの（manifest・写真）だけ差しかえる ----
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const ctl = { down: false, override: { '/img/dish/manifest.json': Buffer.from(JSON.stringify(ORIG)) } };
const server = http.createServer((req, res) => {
    if (ctl.down) return req.destroy();
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const o = ctl.override[p];
    if (o){ res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'max-age=0' }); return res.end(o); }
    const file = path.join(APP, p);
    if (!file.startsWith(APP + path.sep)){ res.writeHead(404); return res.end('no'); }
    fs.stat(file, (err, st) => {
        if (err || !st.isFile()){ res.writeHead(404); return res.end('no'); }
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'max-age=0', 'last-modified': st.mtime.toUTCString() });
        fs.createReadStream(file).pipe(res);
    });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL_ = `http://localhost:${server.address().port}/`;
const b = await chromium.launch(LAUNCH);
const errs = [];

async function newPage({ scheme = 'light', sw = 'block' } = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, serviceWorkers: sw });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('photo-dish')));
    await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({ onboarded: true, firstUse: '2026-10-26', settings: { country: 'JP', dishCount: 4 } })); });
    const p = await ctx.newPage(); p.ctx = ctx; p.on('pageerror', e => errs.push(e.message));
    return p;
}
const trayReady = p => p.waitForFunction(() => typeof GEN !== 'undefined' && Object.keys(GEN).length > 100 && document.querySelectorAll('main .vessel').length >= 3, null, { timeout: 30000 }).then(() => p.waitForTimeout(400));
// お膳の器: 料理の ID・クラス・絵のアドレス・大きさ
const vessels = p => p.evaluate(() => {
    const ids = session.menu.items.map(x => x.r && x.r.id);
    return [...document.querySelectorAll('main .tray .vessel')].map(v => {
        const id = v.dataset.id || (v.classList.contains('v-chawan') ? 'rice' : v.classList.contains('v-konomono') ? 'konomono' : null);
        const f = v.querySelector('.food'), r = v.getBoundingClientRect(), fr = f && f.getBoundingClientRect();
        return { id, cls: v.className, img: ((v.getAttribute('style') || '').match(/img\/dish\/([\w.-]+)/) || [])[1] || '', rect: [r.x, r.y, r.width, r.height].map(Math.round),
            food: fr ? [fr.x, fr.y, fr.width, fr.height].map(Math.round) : null, radius: f ? getComputedStyle(f).borderRadius : '' };
    }).concat([{ menu: ids }]);
});
const loads = (p, src) => p.evaluate(src => new Promise(res => { const im = new Image(); im.onload = () => res(im.naturalWidth); im.onerror = () => res(0); im.src = src; }), src);

// ---- 1. 写真なし（いまの manifest）でお膳を見て、どの料理が出るか・器の場所と大きさを覚える ----
const p0 = await newPage();
await p0.goto(URL_); await trayReady(p0);
const base = await vessels(p0);
const menu = base.pop().menu.filter(Boolean);
await p0.ctx.close();
ok(menu.length >= 2 && base.filter(v => v.img).length >= 3 && base.filter(v => v.img).every(v => /\.svg$/.test(v.img)), 'F0 写真がないときは、お膳の絵はすべて SVG', { menu, base: base.map(v => v.img) });

// 写真にする料理: お膳の主菜とご飯、一覧で見る肉じゃが。お膳の残り（副菜・汁もの）は SVG のまま
const PHOTO = [...new Set([menu[0], 'rice', 'nikujaga'])];
const KEEP = menu.filter(id => !PHOTO.includes(id));
ok(KEEP.length >= 1, 'F0 お膳に SVG のまま残る料理がある', { menu, PHOTO });

// ---- 2. 仮の画像を作って、道具で取りこむ ----
const IN = path.join(TMP, 'in'); fs.mkdirSync(path.join(IN, 'sub'), { recursive: true });
{
    const pg = await b.newPage();
    const mk = (w, h, type, col) => pg.evaluate(({ w, h, type, col }) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
        g.fillStyle = '#FBF5EC'; g.fillRect(0, 0, w, h); g.fillStyle = col; g.beginPath(); g.arc(w / 2, h / 2, Math.min(w, h) * .3, 0, 7); g.fill();
        for (let i = 0; i < 400; i++){ g.fillStyle = `hsl(${(i * 37) % 60 + 10},70%,${30 + (i % 5) * 8}%)`; g.fillRect((i * 97) % w, (i * 53) % h, 6, 6); }
        return c.toDataURL(type, .95).split(',')[1];
    }, { w, h, type, col });
    fs.writeFileSync(path.join(IN, PHOTO[0] + '.png'), Buffer.from(await mk(1024, 1024, 'image/png', '#a0522d'), 'base64'));
    fs.writeFileSync(path.join(IN, 'sub', 'rice.jpg'), Buffer.from(await mk(1200, 900, 'image/jpeg', '#e8e0d0'), 'base64'));   // 横長・下のフォルダ・JPEG
    if (PHOTO.includes('nikujaga') && PHOTO[0] !== 'nikujaga') fs.writeFileSync(path.join(IN, 'nikujaga.webp'), Buffer.from(await mk(900, 1100, 'image/webp', '#8a5a2b'), 'base64'));   // 縦長・WebP
    fs.writeFileSync(path.join(IN, 'no_such_dish_zz.png'), Buffer.from(await mk(64, 64, 'image/png', '#000'), 'base64'));   // 一覧にない名前
    fs.writeFileSync(path.join(IN, 'memo.txt'), 'x');
    await pg.close();
}
let out = '';
try{ out = execFileSync(process.execPath, [path.join(TMP, 'tools/illustrations/import-photos.mjs'), IN], { encoding: 'utf8' }); }
catch(e){ out = String(e.stdout || '') + String(e.stderr || ''); ok(false, 'F1 道具が終了コード0で終わる', out); }
const M = JSON.parse(fs.readFileSync(path.join(TDISH, 'manifest.json'), 'utf8'));
const webpSize = buf => buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
for (const id of PHOTO){
    const it = M.items[id] || {};
    ok(it.file === id + '.webp' && it.via === 'photo' && it.model === 'gemini' && it.thumb === `t/${id}.webp` && /^[0-9a-f]{8}$/.test(it.v || '') && /^\d{4}-\d\d-\d\d$/.test(it.date || ''), `F1 manifest の ${id} が写真になる`, it);
    const big = fs.existsSync(path.join(TDISH, id + '.webp')) ? fs.readFileSync(path.join(TDISH, id + '.webp')) : Buffer.alloc(0);
    const th = fs.existsSync(path.join(TDISH, 't', id + '.webp')) ? fs.readFileSync(path.join(TDISH, 't', id + '.webp')) : Buffer.alloc(0);
    ok(webpSize(big) && webpSize(th) && big.length <= 40 * 1024, `F1 ${id}: WebP（${Math.round(big.length / 1024)}KB・40KB 以内）`);
    ctl.override[`/img/dish/${id}.webp`] = big; ctl.override[`/img/dish/t/${id}.webp`] = th;
}
const changed = Object.keys(ORIG.items).filter(id => JSON.stringify(ORIG.items[id]) !== JSON.stringify(M.items[id]));
ok(JSON.stringify(changed.sort()) === JSON.stringify([...PHOTO].sort()) && Object.keys(M.items).length === Object.keys(ORIG.items).length && !M.items.no_such_dish_zz,
    'F1 入れた料理だけが変わり、ほかの料理（' + (Object.keys(ORIG.items).length - PHOTO.length) + '品）は SVG のまま', changed);
ok(/飛ばした画像: 1枚/.test(out), 'F1 一覧にない名前の画像は飛ばして知らせる', out);
ctl.override['/img/dish/manifest.json'] = fs.readFileSync(path.join(TDISH, 'manifest.json'));

// 大きさ・形（ブラウザで読む）
{
    const pg = await b.newPage(); await pg.goto(URL_ + 'manifest.webmanifest');
    for (const id of PHOTO){
        const wh = await pg.evaluate(async id => { const g = async u => { const im = new Image(); im.src = u; await im.decode(); return [im.naturalWidth, im.naturalHeight]; }; return [await g(`/img/dish/${id}.webp`), await g(`/img/dish/t/${id}.webp`)]; }, id).catch(e => String(e));
        ok(JSON.stringify(wh) === '[[512,512],[192,192]]', `F1 ${id}: 512×512 と 192×192`, wh);
    }
    await pg.close();
}

// ---- 3. 写真ありで、お膳・詳しい画面・一覧（明るい表示と暗い表示） ----
for (const scheme of ['light', 'dark']){
    const p = await newPage({ scheme });
    await p.goto(URL_); await trayReady(p);
    const vs = await vessels(p); const m2 = vs.pop().menu.filter(Boolean);
    ok(JSON.stringify(m2) === JSON.stringify(menu), `F2 ${scheme}: 献立は写真があってもなくても同じ`, { menu, m2 });
    for (const v of vs){
        if (!v.id) continue;
        const want = PHOTO.includes(v.id), b0 = base.find(x => x.id === v.id);
        if (want) ok(/\bgph\b/.test(v.cls) && v.img === v.id + '.webp' && v.radius === '50%' && v.food && b0 && JSON.stringify(v.food) === JSON.stringify(v.rect), `F2 ${scheme}: お膳の ${v.id} は写真（丸く切る・器いっぱい）`, v);
        else ok(!/\bgph\b/.test(v.cls) && v.img === v.id + '.svg', `F2 ${scheme}: お膳の ${v.id} は SVG のまま`, v);
        ok(b0 && JSON.stringify(b0.rect) === JSON.stringify(v.rect), `F2 ${scheme}: ${v.id} の器は SVG のときと同じ場所・大きさ`, { svg: b0 && b0.rect, now: v.rect });
    }
    const main = vs.find(v => v.id === PHOTO[0]);
    ok(main && await loads(p, `img/dish/${PHOTO[0]}.webp`) === 512, `F2 ${scheme}: 写真が読みこめる`);
    // 暗い表示・明るい表示とも、器の四隅（丸の外）はお膳の色（生成りの四角が見えない）
    if (main){
        const el = p.locator(`main .tray .vessel[data-id="${PHOTO[0]}"]`);
        let png; for (let k = 0; ; k++){ try{ png = (await el.screenshot()).toString('base64'); break; } catch(e){ if (k >= 2) throw e; await p.waitForTimeout(500); } }   // 描き直しの途中で器が入れかわることがあるので、取り直す
        const px = await p.evaluate(async b64 => {
            const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
            const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
            const at = (x, y) => Array.from(g.getImageData(x, y, 1, 1).data.slice(0, 3));
            return { corner: at(2, 2), center: at(im.width >> 1, im.height >> 1) };
        }, png);
        const cream = c => Math.abs(c[0] - 0xFB) + Math.abs(c[1] - 0xF5) + Math.abs(c[2] - 0xEC) < 40;
        ok(!cream(px.corner), `F5 ${scheme}: 器の角に生成りの四角が見えない`, px);
    }
    // 詳しい画面
    await p.evaluate(id => openModal(id), PHOTO[0]); await p.waitForTimeout(500);
    const h1 = await p.evaluate(() => { const h = document.querySelector('.hero'), i = h && h.querySelector('img'), hr = h.getBoundingClientRect(), ir = i && i.getBoundingClientRect();
        return { cls: h.className, src: i && i.getAttribute('src'), nw: i && i.naturalWidth, cap: (h.querySelector('.cap') || {}).textContent || '', radius: i && getComputedStyle(i).borderRadius,
            inside: !!ir && ir.left >= hr.left && ir.right <= hr.right && ir.top >= hr.top && ir.bottom <= hr.bottom && Math.abs(ir.width - ir.height) < 2 && ir.width > 120 }; });
    ok(/\bgph\b/.test(h1.cls) && (h1.src || '').includes(`img/dish/${PHOTO[0]}.webp`) && h1.nw === 512 && h1.radius === '50%' && h1.inside && /Gemini/.test(h1.cap), `F3 ${scheme}: 詳しい画面に丸い写真と Gemini の注記`, h1);
    await p.evaluate(() => closeModal()); await p.waitForTimeout(200);
    await p.evaluate(id => openModal(id), KEEP[0]); await p.waitForTimeout(500);
    const h2 = await p.evaluate(() => { const h = document.querySelector('.hero'), i = h && h.querySelector('img'); return { cls: h.className, src: i && i.getAttribute('src'), cap: (h.querySelector('.cap') || {}).textContent || '' }; });
    ok(!/\bgph\b/.test(h2.cls) && /\.svg\b/.test(h2.src || '') && !/Gemini/.test(h2.cap), `F3 ${scheme}: SVG の料理の詳しい画面はいままでどおり`, h2);
    await p.evaluate(() => closeModal()); await p.waitForTimeout(200);
    // 一覧（材料から → 料理をさがす）
    await p.click('nav.tabs [data-tab="fridge"]'); await p.waitForSelector('#search-input');
    await p.fill('#search-input', '豚肉'); await p.press('#search-input', 'Enter'); await p.waitForTimeout(700);
    const th = await p.evaluate(() => [...document.querySelectorAll('#search-results .dcard, #search-results .match')].map(c => { const t = c.querySelector('.thumb'), i = t && t.querySelector('img');
        const btn = c.querySelector('[data-id]'); return { id: btn && btn.dataset.id, cls: t && t.className, src: i && i.getAttribute('src'), nw: i && i.naturalWidth, w: t && Math.round(t.getBoundingClientRect().width) }; }));
    const nk = th.find(x => x.id === 'nikujaga'), other = th.find(x => x.id && !PHOTO.includes(x.id));
    ok(nk && /\bgph\b/.test(nk.cls) && /img\/dish\/t\/nikujaga\.webp\?v=/.test(nk.src) && nk.src.includes(M.items.nikujaga.v) && nk.nw === 192, `F4 ${scheme}: 一覧の肉じゃがは写真の小さい絵`, nk);
    ok(other && !/\bgph\b/.test(other.cls) && /img\/dish\/t\/[\w-]+\.webp\?v=/.test(other.src) && other.src.includes(ORIG.items[other.id].v) && nk && other.w === nk.w, `F4 ${scheme}: 一覧のほかの料理は手描きの小さい絵のまま・同じ大きさ`, other);
    await p.ctx.close();
}

// ---- 4. オフライン: 一度見た写真は、電波がなくても出る ----
{
    const p = await newPage({ sw: 'allow' });
    await p.goto(URL_); await trayReady(p);
    await p.evaluate(() => navigator.serviceWorker.ready.then(() => 1));
    await p.reload(); await trayReady(p);
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
    await p.reload(); await trayReady(p); await p.waitForTimeout(800);   // SW を通して写真を読み、保存させる
    const cached = await p.evaluate(async id => { for (const k of await caches.keys()){ const c = await caches.open(k); for (const r of await c.keys()) if (new URL(r.url).pathname.endsWith(`/img/dish/${id}.webp`)) return k; } return null; }, PHOTO[0]);
    ok(!!cached, 'F6 写真が SW のキャッシュに入る', cached);
    ctl.down = true; await p.ctx.setOffline(true);
    await p.reload(); await trayReady(p).catch(() => {});
    const v = (await vessels(p)).find(x => x.id === PHOTO[0]);
    const src = await p.evaluate(id => GEN[id] && GEN[id].src, PHOTO[0]);
    ok(v && /\bgph\b/.test(v.cls) && src && await loads(p, src) === 512, 'F6 オフラインで開き直しても、お膳に写真が出る', v);
    ctl.down = false; await p.ctx.setOffline(false);
    await p.ctx.close();
}

// ---- 5. 試せるページの形（data URL で埋めこんだ WebP） ----
{
    const p = await newPage();
    await p.goto(URL_); await trayReady(p);
    const b64 = (ctl.override[`/img/dish/${PHOTO[0]}.webp`]).toString('base64');
    const r = await p.evaluate(({ id, b64 }) => { addGenerated({ [id]: { file: id + '.webp', via: 'photo', model: 'gemini', v: 'x', data: 'data:image/webp;base64,' + b64 } });
        const g = GEN[id]; return { photo: g.photo, data: /^data:image\/webp;base64,/.test(g.src) }; }, { id: PHOTO[0], b64 });
    await p.evaluate(() => render()); await p.waitForTimeout(300);
    const v = (await vessels(p)).find(x => x.id === PHOTO[0]);
    ok(r.photo && r.data && v && /\bgph\b/.test(v.cls), 'F7 image/webp の data URL も写真として出す', { r, v });
    await p.ctx.close();
}

await b.close(); server.close();
fs.rmSync(TMP, { recursive: true, force: true });
ok(!errs.length, 'ページのエラーなし', errs.slice(0, 5));
console.log(`\n${checks - fails}/${checks} ok` + (fails ? `  （${fails} 件失敗）` : ''));
process.exit(fails ? 1 : 0);
