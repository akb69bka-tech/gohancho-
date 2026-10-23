#!/usr/bin/env node
/*
 * 一覧用の小さい絵（192px の WebP）を作る
 *   node tools/illustrations/draw/thumbs.mjs          小さい絵がない・古いものだけ作る
 *   node tools/illustrations/draw/thumbs.mjs --all    全部作り直す
 * 一覧（世界のレシピ・作る・冷蔵庫など）は 52〜64px の小さい丸で絵を出す。SVG のままだと、影のフィルターを
 * 端末が毎回計算するので、何百品も並ぶと遅い。前もって小さい画像にしておくと、読みこみも表示も速い。
 * 料理の詳しい画面とお膳の器は、大きく出すので SVG のまま使う。
 * 出力: gohancho/img/dish/t/{id}.webp と、manifest.json の各料理の "thumb"
 * 必要なもの: Playwright（npm i -g playwright && npx playwright install chromium）
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../..', 'gohancho', 'img', 'dish');
const TDIR = path.join(OUT, 't');
const MANIFEST = path.join(OUT, 'manifest.json');
const SIZE = 192, QUALITY = 0.8;
const all = process.argv.includes('--all');

let chromium;
try{ ({ chromium } = await import('playwright')); }
catch(e){
    try{ ({ chromium } = createRequire(import.meta.url)(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }
    catch(e2){ console.error('Playwright が見つかりません。npm i -g playwright && npx playwright install chromium を実行してください'); process.exit(1); }
}

const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
fs.mkdirSync(TDIR, { recursive: true });
const mime = f => f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.png') ? 'image/png' : f.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
const todo = Object.entries(m.items).filter(([id, it]) => {
    if (!it || !it.file) return false;
    const src = path.join(OUT, it.file), dst = path.join(TDIR, `${id}.webp`);
    if (all || !it.thumb || !fs.existsSync(dst)) return true;
    return fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs;
});
if (!todo.length){ console.log('小さい絵はそろっています'); process.exit(0); }

let browser;
try{ browser = await chromium.launch(); }
catch(e){ browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
const page = await browser.newPage();
await page.setContent('<!doctype html><title>thumbs</title>');
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
fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
console.log(`${n}品の小さい絵を作りました（合計 ${Math.round(bytes / 1024)}KB）`);
