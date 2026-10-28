#!/usr/bin/env node
/*
 * 競作用の試し描きを、本体（gohancho/img/dish/）に触れずに書き出す
 *   node tools/illustrations/draw/r2/render_r2.mjs <盛りつけファイル.mjs> <出力フォルダ> [id ...]
 * 盛りつけファイルは dishes/*.mjs と同じ形（export default { id: p => svg本文 }）。
 * 出力: <id>.svg、<id>.png（512px）、<id>_s.png（192px）、check_96.png（96px で全品を並べた確認用）。
 * PAIRS を export していれば、主役と下地の明るさの比（WCAG の相対輝度）を表で出す。
 * dishes/ に置かないのは、本体の同じ ID と重なると build.mjs が止まるため（採用が決まってから dishes/ に移す）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { Pic } from '../kit.mjs';

const [file, out, ...only] = process.argv.slice(2);
if (!file || !out){ console.error('使い方: render_r2.mjs <盛りつけファイル.mjs> <出力フォルダ> [id ...]'); process.exit(1); }
const mod = await import(pathToFileURL(path.resolve(file)));
const ids = Object.keys(mod.default).filter(id => !only.length || only.includes(id));
fs.mkdirSync(out, { recursive: true });

const lum = c => { const v = c.replace('#', '').match(/../g).map(h => parseInt(h, 16) / 255).map(u => u <= .03928 ? u / 12.92 : ((u + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };

const svgs = {};
for (const id of ids){
    const p = new Pic(id);
    svgs[id] = p.svg(mod.default[id](p));
    fs.writeFileSync(path.join(out, `${id}.svg`), svgs[id]);
    const pairs = mod.PAIRS?.[id];
    console.log(id.padEnd(20), pairs ? pairs.map(([a, ca, b, cb]) => `${a}/${b} ${ratio(ca, cb).toFixed(2)}`).join('  ') : '');
}

// PNG（Playwright。thumbs.mjs と同じく、グローバルの playwright を探す）
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const b = await pw.chromium.launch();
const pg = await b.newPage();
const img = (svg, sz) => `<img width="${sz}" height="${sz}" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`;
for (const id of ids){
    for (const [sz, suf] of [[512, ''], [192, '_s']]){
        await pg.setViewportSize({ width: sz, height: sz });
        await pg.setContent(`<body style="margin:0;background:#fff">${img(svgs[id], sz)}`);
        await pg.screenshot({ path: path.join(out, `${id}${suf}.png`) });
    }
}
// 96px の確認用（明るい背景と暗い背景）
const cols = Math.min(8, ids.length), rows = Math.ceil(ids.length / cols);
await pg.setViewportSize({ width: cols * 104 + 8, height: rows * 104 * 2 + 16 });
const grid = bg => `<div style="background:${bg};display:grid;grid-template-columns:repeat(${cols},96px);gap:8px;padding:8px">${ids.map(id => img(svgs[id], 96)).join('')}</div>`;
await pg.setContent(`<body style="margin:0">${grid('#f4efe6')}${grid('#1e1e1e')}`);
await pg.screenshot({ path: path.join(out, 'check_96.png') });
await b.close();
