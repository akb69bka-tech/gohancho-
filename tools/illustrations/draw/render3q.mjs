#!/usr/bin/env node
/*
 * 斜め上35度の絵を、本体（gohancho/img/dish/）に触れずに書き出して確かめる
 *   node tools/illustrations/draw/render3q.mjs <盛りつけファイル.mjs> <出力フォルダ> [id ...]
 * 出力: <id>.svg、<id>_192.png、<id>_96.png、check.png（いまの絵と並べて 192 / 96 / 48px、暗い背景も）
 * 大きさの目安: 96px で絵が塗っている割合（%）と縦横の広がりを、いまの絵と並べて表に出す（基準書の「大きさ」）
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { Pic } from './kit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const [file, out, ...only] = process.argv.slice(2);
if (!file || !out){ console.error('使い方: render3q.mjs <盛りつけファイル.mjs> <出力フォルダ> [id ...]'); process.exit(1); }
const mod = await import(pathToFileURL(path.resolve(file)));
const ids = Object.keys(mod.default).filter(id => !only.length || only.includes(id));
fs.mkdirSync(out, { recursive: true });
const svgs = {};
for (const id of ids){ const p = new Pic(id); svgs[id] = p.svg(mod.default[id](p)); fs.writeFileSync(path.join(out, `${id}.svg`), svgs[id]); }
const cur = id => { const fp = path.join(ROOT, 'gohancho/img/dish', `${id}.svg`); return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : null; };

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const b = await pw.chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const pg = await b.newPage();
const img = (svg, sz) => svg ? `<img width="${sz}" height="${sz}" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">` : `<span style="display:inline-block;width:${sz}px"></span>`;
for (const id of ids) for (const sz of [192, 96]){
    await pg.setViewportSize({ width: sz, height: sz });
    await pg.setContent(`<body style="margin:0;background:#fff">${img(svgs[id], sz)}`);
    await pg.screenshot({ path: path.join(out, `${id}_${sz}.png`) });
}
// 大きさ: 96px で透明でない画素の割合と、縦横の広がり
async function measure(svg){
    if (!svg) return null;
    await pg.setViewportSize({ width: 96, height: 96 });
    await pg.setContent(`<body style="margin:0;background:transparent">${img(svg, 96)}`);
    return pg.evaluate(async src => {
        const im = new Image(); im.src = src; await im.decode();
        const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 96, 96);
        const d = x.getImageData(0, 0, 96, 96).data; let n = 0, x0 = 96, x1 = 0, y0 = 96, y1 = 0;
        for (let i = 0; i < 96 * 96; i++) if (d[i * 4 + 3] > 128){ n++; const u = i % 96, v = (i / 96) | 0; x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
        return { fill: Math.round(n / 96 / 96 * 100), w: x1 - x0 + 1, h: y1 - y0 + 1, top: y0, bottom: 95 - y1 };
    }, 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'));
}
console.log('id'.padEnd(22), '新: 塗り% 幅x高 上/下の空き', '  いま: 塗り% 幅x高');
for (const id of ids){
    const a = await measure(svgs[id]), c = await measure(cur(id));
    console.log(id.padEnd(22), `${a.fill}% ${a.w}x${a.h} ${a.top}/${a.bottom}`.padEnd(26), c ? `${c.fill}% ${c.w}x${c.h}` : '-');
}
const cols = Math.min(4, ids.length);
await pg.setViewportSize({ width: cols * 540, height: 400 });
await pg.setContent(`<body style="margin:0;padding:10px;background:#f4efe6;font:12px sans-serif;color:#3a2a1f"><div style="display:grid;grid-template-columns:repeat(${cols},530px);gap:12px">${ids.map(id => `<div><b>${id}</b><div style="display:flex;align-items:end;gap:4px">${img(cur(id), 96)}${img(cur(id), 48)}<span style="margin:0 4px">→</span>${img(svgs[id], 192)}${img(svgs[id], 96)}${img(svgs[id], 48)}</div><div style="display:flex;gap:4px;background:#1e1e1e;padding:4px;margin-top:4px">${img(svgs[id], 96)}${img(svgs[id], 48)}</div></div>`).join('')}</div>`);
await pg.waitForTimeout(300);
await pg.screenshot({ path: path.join(out, 'check.png'), fullPage: true });
await b.close();
