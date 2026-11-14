#!/usr/bin/env node
/*
 * 写真風の料理の絵（Gemini などで作った画像）を、アプリの絵として取りこむ
 *
 *   node tools/illustrations/import-photos.mjs <画像のフォルダ> [--dry-run] [--quality 0.8] [--max-kb 40] [--keep-original] [--thumb 192] [--thumb-quality 0.8]
 *   --keep-original: 元がもう 512×512 の WebP なら、作り直さずにそのままのバイトで入れる（オーナーの元の絵がいちばんくっきりしているため。品質・大きさの上限は使わない）
 *   --thumb / --thumb-quality: 一覧用の小さい絵の大きさ（px）と品質。くっきりさせるなら --thumb 256 --thumb-quality 0.92
 *
 * 入力: フォルダの中（下のフォルダも見る）の <料理のID>.png / .jpg / .jpeg / .webp
 *       （ID は gohancho/img/dish/manifest.json の items のキー。オーナーの一覧の C 列「画像ID」、D 列「<ID>.png」）
 * 出力: gohancho/img/dish/<ID>.webp   … 真ん中を正方形に切って 512×512 の WebP（品質 0.8。40KB を超えたら品質を少し下げる）
 *                                       大きさの変更は Lanczos（a=3）。元が小さい（150px ほど）ときは、拡大のあとに軽いアンシャープマスクをかける（ぼやけないように）
 *       元が小さい絵は --quality 0.88 で取りこむとよい（くっきりした分、品質 0.8 ではざらつきやすい）
 *       gohancho/img/dish/t/<ID>.webp … 一覧用の 192×192 の WebP
 *       manifest.json の items[<ID>] を { file:'<ID>.webp', via:'photo', model:'gemini', date, thumb:'t/<ID>.webp', v } に
 * 入っていない ID は、いまの絵（手描きの SVG）のまま。何回かに分けて入れ替えられる。
 * 手描きの SVG（<ID>.svg）は消さない（manifest を戻せば、元の絵に戻せる）。
 * 画像の変換は、手元の Chromium（Playwright）の canvas で行う。外へは通信しない。
 * 必要なもの: Node 20 以上と Playwright（npm i -g playwright && npx playwright install chromium）
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DISH = path.resolve(HERE, '../..', 'gohancho', 'img', 'dish');
const MANIFEST = path.join(DISH, 'manifest.json');
const SIZE = 512, BG = '#FBF5EC';   // 背景が透けている画像は、生成り（写真の背景と同じ色）で埋める

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = name => { const i = args.indexOf(name); if (i < 0) return false; args.splice(i, 1); return true; };
const DRY = flag('--dry-run');
const QUALITY = Number(opt('--quality', '0.8'));
const KEEP = flag('--keep-original');
const THUMB = Number(opt('--thumb', '192')), THUMB_Q = Number(opt('--thumb-quality', '0.8'));
const MAX_KB = Number(opt('--max-kb', '40'));
const SRC = args[0];
if (!SRC || !fs.existsSync(SRC) || !fs.statSync(SRC).isDirectory()){
    console.error('使い方: node tools/illustrations/import-photos.mjs <画像のフォルダ> [--dry-run] [--quality 0.8] [--max-kb 40]');
    process.exit(2);
}
if (!(QUALITY > 0 && QUALITY <= 1) || !(MAX_KB > 0) || !(THUMB >= 64 && THUMB <= SIZE) || !(THUMB_Q > 0 && THUMB_Q <= 1)){ console.error('--quality は 0〜1、--max-kb は正の数で指定してください'); process.exit(2); }

const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const items = m.items || {};

// フォルダの中の画像を集める（zip を開いたときの下のフォルダも見る。隠しファイル・__MACOSX は見ない）
const found = new Map(), unknown = [], dup = [];
(function walk(dir){
    for (const e of fs.readdirSync(dir, { withFileTypes: true })){
        if (e.name.startsWith('.') || e.name === '__MACOSX') continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()){ walk(p); continue; }
        const mm = /^([\w-]+)\.(png|jpe?g|webp)$/i.exec(e.name);
        if (!mm) continue;
        const id = mm[1];
        if (!Object.prototype.hasOwnProperty.call(items, id)){ unknown.push(e.name); continue; }
        if (found.has(id)){ dup.push(e.name); continue; }
        found.set(id, p);
    }
})(SRC);
if (unknown.length) console.log(`一覧にない名前のため飛ばした画像: ${unknown.length}枚（例: ${unknown.slice(0, 5).join(', ')}）`);
if (dup.length) console.log(`同じ ID の画像が2枚以上あったため、2枚目以降を飛ばしました: ${dup.slice(0, 5).join(', ')}`);
if (!found.size){ console.log('取りこめる画像がありません（ファイル名は <料理のID>.png / .jpg / .webp）'); process.exit(unknown.length ? 1 : 0); }
if (DRY){
    console.log(`取りこむ予定: ${found.size}枚 / 全 ${Object.keys(items).length}品（--dry-run なので何も書きません）`);
    process.exit(0);
}

// Playwright（tools/lib/pw.cjs と同じ探し方）
const { chromium, LAUNCH } = createRequire(import.meta.url)('../lib/pw.cjs');
const browser = await chromium.launch(LAUNCH);
const ctx = await browser.newContext();
await ctx.route('**/*', r => r.abort());   // 外へは一切通信しない（画像は data で渡す）
const page = await ctx.newPage();
await page.setContent('<!doctype html><title>import-photos</title>');

// 1枚を「真ん中の正方形 → 512px と 192px の WebP」にする（大きいものは品質を少しずつ下げて MAX_KB 以内に）
const convert = (b64) => page.evaluate(async ({ b64, SIZE, THUMB, THUMB_Q, BG, QUALITY, MAX, KEEP }) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes]));   // 拡張子と中身が違っても（.png の中身が JPEG など）読める
    const s = Math.min(bmp.width, bmp.height), sx = (bmp.width - s) / 2, sy = (bmp.height - s) / 2;
    // 元の正方形（生成りの地で埋めたもの）を、そのままの画素で取り出す（大きすぎる元は、先に半分ずつ 1024px 前後まで縮める）
    let base = bmp, S0 = s, bx = sx, by = sy;
    while (S0 / 2 >= 1024){ const h = document.createElement('canvas'); h.width = h.height = Math.round(S0 / 2); const hg = h.getContext('2d'); hg.imageSmoothingQuality = 'high'; hg.drawImage(base, bx, by, S0, S0, 0, 0, h.width, h.height); base = h; S0 = h.width; bx = by = 0; }
    S0 = Math.round(S0);
    const bc = document.createElement('canvas'); bc.width = bc.height = S0;
    { const g = bc.getContext('2d'); g.fillStyle = BG; g.fillRect(0, 0, S0, S0); g.drawImage(base, bx, by, S0 === s ? s : S0, S0 === s ? s : S0, 0, 0, S0, S0); }
    const srcPx = bc.getContext('2d').getImageData(0, 0, S0, S0).data;
    // Lanczos（a=3）で大きさを変える。canvas の拡大（双一次）は、元が 150px ほどの絵を 512px にするとぼやけるため（オーナーの指示: 絵がボケている）
    const lanczos = (src, sw, n) => {
        const scale = n / sw, fs = Math.min(1, scale), sup = 3 / fs;
        const kern = x => { x = Math.abs(x); if (x < 1e-7) return 1; if (x >= 3) return 0; const p = Math.PI * x; return 3 * Math.sin(p) * Math.sin(p / 3) / (p * p); };
        const ws = []; for (let i = 0; i < n; i++){ const c = (i + .5) / scale - .5, lo = Math.max(0, Math.ceil(c - sup)), hi = Math.min(sw - 1, Math.floor(c + sup)); const w = []; let t = 0; for (let j = lo; j <= hi; j++){ const v = kern((j - c) * fs); w.push(v); t += v; } ws.push({lo, w: w.map(v => v / t)}); }
        const tmp = new Float32Array(n * sw * 3);   // 横 → 縦の順
        for (let y = 0; y < sw; y++) for (let x = 0; x < n; x++){ const {lo, w} = ws[x]; let r = 0, g = 0, b = 0; for (let k = 0; k < w.length; k++){ const o = (y * sw + lo + k) * 4; r += src[o] * w[k]; g += src[o + 1] * w[k]; b += src[o + 2] * w[k]; } const q = (y * n + x) * 3; tmp[q] = r; tmp[q + 1] = g; tmp[q + 2] = b; }
        const out = new Float32Array(n * n * 3);
        for (let y = 0; y < n; y++){ const {lo, w} = ws[y]; for (let x = 0; x < n; x++){ let r = 0, g = 0, b = 0; for (let k = 0; k < w.length; k++){ const q = ((lo + k) * n + x) * 3; r += tmp[q] * w[k]; g += tmp[q + 1] * w[k]; b += tmp[q + 2] * w[k]; } const o = (y * n + x) * 3; out[o] = r; out[o + 1] = g; out[o + 2] = b; } }
        return out;
    };
    // 拡大したときだけ、軽いアンシャープマスク（ぼかしとの差を少し足す。差の小さい所＝地のざらつきは強めない）
    const unsharp = (px, n, sigma, amount, thr) => {
        const r = Math.ceil(sigma * 3), k = []; let t = 0; for (let i = -r; i <= r; i++){ const v = Math.exp(-i * i / (2 * sigma * sigma)); k.push(v); t += v; } for (let i = 0; i < k.length; i++) k[i] /= t;
        const b1 = new Float32Array(px.length), bl = new Float32Array(px.length), cl = v => v < 0 ? 0 : v > n - 1 ? n - 1 : v;
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) for (let c = 0; c < 3; c++){ let a = 0; for (let i = -r; i <= r; i++) a += px[(y * n + cl(x + i)) * 3 + c] * k[i + r]; b1[(y * n + x) * 3 + c] = a; }
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) for (let c = 0; c < 3; c++){ let a = 0; for (let i = -r; i <= r; i++) a += b1[(cl(y + i) * n + x) * 3 + c] * k[i + r]; bl[(y * n + x) * 3 + c] = a; }
        for (let i = 0; i < px.length; i++){ const d = px[i] - bl[i]; if (Math.abs(d) > thr) px[i] += d * amount; }
        return px;
    };
    const draw = (n) => {
        let px = lanczos(srcPx, S0, n);
        if (n > S0 * 1.05) px = unsharp(px, n, Math.min(2, .5 * n / S0), .9, 2);
        const c = document.createElement('canvas'); c.width = c.height = n;
        const g = c.getContext('2d'), im = g.createImageData(n, n);
        for (let i = 0, j = 0; i < px.length; i += 3, j += 4){ im.data[j] = px[i]; im.data[j + 1] = px[i + 1]; im.data[j + 2] = px[i + 2]; im.data[j + 3] = 255; }   // Uint8ClampedArray なので 0〜255 に丸まる
        g.putImageData(im, 0, 0);
        return c;
    };
    const enc = (c, q) => c.toDataURL('image/webp', q).split(',')[1];
    const thumb = enc(draw(THUMB), THUMB_Q);
    // 元がもう 512×512 の WebP: 作り直さない（そのままのバイトを使う。null を返すと Node 側で元のファイルを写す）
    const webp = bytes.length > 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (KEEP && webp && bmp.width === SIZE && bmp.height === SIZE) return { w: bmp.width, h: bmp.height, q: null, data: null, thumb };
    const big = draw(SIZE);
    let q = QUALITY, data = enc(big, q);
    while (data.length * 3 / 4 > MAX && q > 0.55){ q = Math.round((q - 0.05) * 100) / 100; data = enc(big, q); }
    return { w: bmp.width, h: bmp.height, q, data, thumb };
}, { b64, SIZE, THUMB, THUMB_Q, BG, QUALITY, MAX: MAX_KB * 1024, KEEP });

const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
fs.mkdirSync(path.join(DISH, 't'), { recursive: true });
let n = 0, total = 0, maxB = 0, maxId = '';
const over = [], fail = [], notSquare = [];
for (const [id, file] of [...found].sort((a, b) => a[0].localeCompare(b[0]))){
    let r; const raw = fs.readFileSync(file);
    try{ r = await convert(raw.toString('base64')); }
    catch(e){ fail.push(`${path.basename(file)}（${String(e.message || e).split('\n')[0]}）`); continue; }
    const big = r.data == null ? raw : Buffer.from(r.data, 'base64'), th = Buffer.from(r.thumb, 'base64');
    if (big.slice(0, 4).toString() !== 'RIFF' || big.slice(8, 12).toString() !== 'WEBP'){ fail.push(`${path.basename(file)}（WebP にできませんでした）`); continue; }
    fs.writeFileSync(path.join(DISH, `${id}.webp`), big);
    fs.writeFileSync(path.join(DISH, 't', `${id}.webp`), th);
    const v = crypto.createHash('sha1').update(big).update(th).digest('hex').slice(0, 8);   // thumbs.mjs の stamp と同じ作り方
    items[id] = Object.assign({}, items[id], { file: `${id}.webp`, via: 'photo', model: 'gemini', date: today, thumb: `t/${id}.webp`, v });
    n++; total += big.length;
    if (big.length > maxB){ maxB = big.length; maxId = id; }
    if (big.length > MAX_KB * 1024 && r.data != null) over.push(`${id}（${Math.round(big.length / 1024)}KB）`);
    if (Math.abs(r.w - r.h) > 2) notSquare.push(`${id}（${r.w}×${r.h}）`);
}
await browser.close();
fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');

const photos = Object.values(items).filter(it => it && it.via === 'photo').length;
console.log(`${n}枚を取りこみました（512px の WebP: 平均 ${n ? Math.round(total / n / 1024) : 0}KB・いちばん大きいもの ${maxId} ${Math.round(maxB / 1024)}KB）`);
console.log(`写真の絵: ${photos}品 / 全 ${Object.keys(items).length}品（残り ${Object.keys(items).length - photos}品はいままでの絵）`);
if (notSquare.length) console.log(`正方形でなかったので真ん中を切り取りました: ${notSquare.length}枚（例: ${notSquare.slice(0, 5).join(', ')}）`);
if (over.length) console.log(`${MAX_KB}KB を超えたもの: ${over.length}枚（例: ${over.slice(0, 5).join(', ')}）`);
if (fail.length){ console.log(`読めなかった画像: ${fail.length}枚`); for (const f of fail) console.log('  ' + f); process.exit(1); }
