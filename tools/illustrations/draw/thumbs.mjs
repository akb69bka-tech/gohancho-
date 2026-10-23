#!/usr/bin/env node
/*
 * 一覧用の小さい絵（192px の WebP）を作る
 *   node tools/illustrations/draw/thumbs.mjs          小さい絵がない・古いものだけ作る
 *   node tools/illustrations/draw/thumbs.mjs --all    全部作り直す
 * 一覧（世界のレシピ・作る・冷蔵庫など）は 52〜64px の小さい丸で絵を出す。SVG のままだと、影のフィルターを
 * 端末が毎回計算するので、何百品も並ぶと遅い。前もって小さい画像にしておくと、読みこみも表示も速い。
 * 料理の詳しい画面とお膳の器は、大きく出すので SVG のまま使う。
 * 出力: gohancho/img/dish/t/{id}.webp と、manifest.json の各料理の "thumb"
 * ChatGPT で作った大きい画像（1024px）は、先に 512px の WebP に縮める（アプリが重くならないように）
 * 必要なもの: Playwright（npm i -g playwright && npx playwright install chromium）
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../..', 'gohancho', 'img', 'dish');
const TDIR = path.join(OUT, 't');
const MANIFEST = path.join(OUT, 'manifest.json');
const SIZE = 192, QUALITY = 0.8, BIG = 512, BIG_QUALITY = 0.85;
const all = process.argv.includes('--all');

let chromium;
try{ ({ chromium } = await import('playwright')); }
catch(e){
    try{ ({ chromium } = createRequire(import.meta.url)(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }
    catch(e2){ console.error('Playwright が見つかりません。npm i -g playwright && npx playwright install chromium を実行してください'); process.exit(1); }
}

const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
fs.mkdirSync(TDIR, { recursive: true });
const isRaster = f => !f.endsWith('.svg');
const mime = f => f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.png') ? 'image/png' : f.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
// 大きい画像（ChatGPT など）: 150KB より大きいものを 512px に縮める
const shrink = Object.entries(m.items).filter(([id, it]) => it && it.file && isRaster(it.file) && fs.existsSync(path.join(OUT, it.file)) && fs.statSync(path.join(OUT, it.file)).size > 150 * 1024);
const todo = Object.entries(m.items).filter(([id, it]) => {
    if (!it || !it.file) return false;
    const src = path.join(OUT, it.file), dst = path.join(TDIR, `${id}.webp`);
    if (all || !it.thumb || !fs.existsSync(dst)) return true;
    return fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs;
});
// 絵の中身から短い印（v）を作る。アプリは絵のアドレスに付けるので、描き直すと端末の古い絵が使われなくなる
function stamp(){
    for (const [id, it] of Object.entries(m.items)){
        if (!it || !it.file || !fs.existsSync(path.join(OUT, it.file))) continue;
        const h = crypto.createHash('sha1').update(fs.readFileSync(path.join(OUT, it.file)));
        if (it.thumb && fs.existsSync(path.join(OUT, it.thumb))) h.update(fs.readFileSync(path.join(OUT, it.thumb)));
        it.v = h.digest('hex').slice(0, 8);
    }
    fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
}
if (!todo.length && !shrink.length){ stamp(); console.log('小さい絵はそろっています'); process.exit(0); }

let browser;
try{ browser = await chromium.launch(); }
catch(e){ browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
const page = await browser.newPage();
await page.setContent('<!doctype html><title>thumbs</title>');
const draw = (batch, size, quality) => page.evaluate(async ({ batch, size, quality }) => {
    const out = [];
    for (const b of batch){
        const im = new Image(); im.src = b.url;
        try{ await im.decode(); }catch(e){ out.push({ id: b.id, err: String(e) }); continue; }
        const c = document.createElement('canvas'); c.width = c.height = size;
        c.getContext('2d').drawImage(im, 0, 0, size, size);
        out.push({ id: b.id, data: c.toDataURL('image/webp', quality).split(',')[1] });
    }
    return out;
}, { batch, size, quality });
let shrunk = 0;
for (let i = 0; i < shrink.length; i += 20){
    const batch = shrink.slice(i, i + 20).map(([id, it]) => ({ id, url: `data:${mime(it.file)};base64,` + fs.readFileSync(path.join(OUT, it.file)).toString('base64') }));
    for (const r of await draw(batch, BIG, BIG_QUALITY)){
        if (r.err){ console.error(`${r.id}: 縮められませんでした（${r.err}）`); continue; }
        const it = m.items[r.id], file = `${r.id}.webp`;
        fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, 'base64'));
        if (it.file !== file) fs.unlinkSync(path.join(OUT, it.file));
        it.file = file; shrunk++;
        if (!todo.some(([id]) => id === r.id)) todo.push([r.id, it]);
    }
}
if (shrunk) console.log(`${shrunk}枚の大きい画像を ${BIG}px に縮めました`);
let n = 0, bytes = 0;
for (let i = 0; i < todo.length; i += 40){
    const batch = todo.slice(i, i + 40).map(([id, it]) => ({ id, url: `data:${mime(it.file)};base64,` + fs.readFileSync(path.join(OUT, it.file)).toString('base64') }));
    const res = await page.evaluate(async ({ batch, SIZE, QUALITY }) => {
        const out = [];
        for (const b of batch){
            const im = new Image(); im.src = b.url;
            try{ await im.decode(); }catch(e){ out.push({ id: b.id, err: String(e) }); continue; }
            const c = document.createElement('canvas'); c.width = c.height = SIZE;
            c.getContext('2d').drawImage(im, 0, 0, SIZE, SIZE);
            out.push({ id: b.id, data: c.toDataURL('image/webp', QUALITY).split(',')[1] });
        }
        return out;
    }, { batch, SIZE, QUALITY });
    for (const r of res){
        if (r.err){ console.error(`${r.id}: 描けませんでした（${r.err}）`); continue; }
        const buf = Buffer.from(r.data, 'base64');
        fs.writeFileSync(path.join(TDIR, `${r.id}.webp`), buf);
        m.items[r.id].thumb = `t/${r.id}.webp`;
        n++; bytes += buf.length;
    }
}
await browser.close();
stamp();
console.log(`${n}品の小さい絵を作りました（合計 ${Math.round(bytes / 1024)}KB）`);
