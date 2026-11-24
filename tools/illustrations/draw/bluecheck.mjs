#!/usr/bin/env node
/*
 * 料理の絵に青系の色（色相 190〜250 度で彩度のあるもの）が残っていないか調べる（基準書「2. 縁の色」）
 *   node tools/illustrations/draw/bluecheck.mjs                 斜め上の絵（3q/*.mjs の全品）の gohancho/img/dish/<id>.svg
 *   node tools/illustrations/draw/bluecheck.mjs 3q/us.mjs kr_x  盛りつけファイルの全品や id を指定（まぜてよい）
 *   彩度の下限は環境変数 SMIN（既定 .12）。残っていれば終了コード 1
 * fill・stroke・stop-color などの #rgb・#rrggbb・rgb()・色の名前を見る（藍 #2c4c7c は h216 s.48）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(HERE, '../../../gohancho/img/dish');
const args = process.argv.slice(2);
const files = args.filter(a => a.endsWith('.mjs'));
let ids = args.filter(a => !a.endsWith('.mjs'));
if (!args.length) files.push(...fs.readdirSync(path.join(HERE, '3q')).filter(f => f.endsWith('.mjs') && !f.startsWith('_')).map(f => '3q/' + f));
for (const f of files) ids.push(...Object.keys((await import(pathToFileURL(path.resolve(HERE, f)))).default));
const SMIN = +(process.env.SMIN || .12);
const NAMED = { blue: '#0000ff', navy: '#000080', skyblue: '#87ceeb', steelblue: '#4682b4', royalblue: '#4169e1', dodgerblue: '#1e90ff', lightblue: '#add8e6', cornflowerblue: '#6495ed', deepskyblue: '#00bfff', midnightblue: '#191970', cyan: '#00ffff', aqua: '#00ffff', teal: '#008080', slateblue: '#6a5acd', powderblue: '#b0e0e6', lightskyblue: '#87cefa', cadetblue: '#5f9ea0', darkblue: '#00008b', mediumblue: '#0000cd', indigo: '#4b0082', aliceblue: '#f0f8ff', azure: '#f0ffff', lightsteelblue: '#b0c4de', darkslateblue: '#483d8b', lightcyan: '#e0ffff' };
function hsl(r, g, b){
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
    return [h, s, l];
}
function parse(c){
    c = c.trim().toLowerCase();
    if (NAMED[c]) c = NAMED[c];
    let m;
    if ((m = c.match(/^#([0-9a-f]{3})$/))) return [...m[1]].map(x => parseInt(x + x, 16));
    if ((m = c.match(/^#([0-9a-f]{6})$/))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
    if ((m = c.match(/^rgba?\(([^)]+)\)$/))) return m[1].split(',').slice(0, 3).map(x => x.includes('%') ? parseFloat(x) * 2.55 : +x);
    return null;
}
let bad = 0, total = 0;
const report = [];
for (const id of ids){
    const file = path.join(dir, id + '.svg');
    if (!fs.existsSync(file)){ report.push(`${id}: ファイルなし`); bad++; continue; }
    total++;
    const svg = fs.readFileSync(file, 'utf8');
    const hits = new Map();
    const re = /(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)|\b(?:fill|stroke|stop-color|flood-color|lighting-color|color)\s*[=:]\s*"?([a-zA-Z]+))/g;
    let m;
    while ((m = re.exec(svg))){
        const c = m[2] || m[1];
        const rgb = parse(c); if (!rgb) continue;
        const [h, s, l] = hsl(...rgb);
        if (h >= 190 && h <= 250 && s >= SMIN && l > .04 && l < .97) hits.set(c, `${c}(h${h.toFixed(0)} s${s.toFixed(2)} l${l.toFixed(2)})`);
    }
    if (hits.size){ bad++; report.push(`${id}: ${[...hits.values()].join(' ')}`); }
}
console.log(report.join('\n'));
console.log(`調べた ${total} 品 / 青系の色が残る ${bad} 品（色相190〜250度・彩度${SMIN}以上）`);
process.exit(bad ? 1 : 0);
