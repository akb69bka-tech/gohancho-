#!/usr/bin/env node
/*
 * 料理イラスト（SVG）を作る
 *   node tools/illustrations/draw/build.mjs            全部作る → gohancho/img/dish/{id}.svg と manifest.json
 *   node tools/illustrations/draw/build.mjs nikujaga   1品だけ
 *   --file f_side1.mjs  その盛りつけファイルだけ読む（3q/<名前>.mjs も指定できる）　--no-manifest  manifest.json を書きかえない（試し描き用）
 * dishes/*.mjs に料理ごとの盛りつけ（どの器に、どの具を、どこに置くか）を書く。部品は kit.mjs
 * 3q/*.mjs は斜め上35度の絵（部品は kit3q.mjs、基準は docs/illustration_3q.md）。同じ ID があれば 3q/ を使う
 * ChatGPT で作った画像（manifest の via が api / chatgpt）がある料理は、manifest をそのままにする
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Pic } from './kit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'gohancho', 'img', 'dish');
const MANIFEST = path.join(OUT, 'manifest.json');

const args = process.argv.slice(2);
const fileOnly = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;
const noManifest = args.includes('--no-manifest');
const DISHES = {};
for (const f of fs.readdirSync(path.join(HERE, 'dishes')).filter(f => f.endsWith('.mjs') && (!fileOnly || f === fileOnly)).sort()){
    const mod = await import(pathToFileURL(path.join(HERE, 'dishes', f)));
    for (const [id, fn] of Object.entries(mod.default)){
        if (DISHES[id]) throw new Error(`${id} が2回出てきます（${f}）`);
        DISHES[id] = fn;
    }
}
// 斜め上35度の絵（3q/*.mjs。_ で始まるファイルは見本なので読まない）。同じ ID は dishes/ の真上の絵より優先する
const Q3 = new Set();
if (!fileOnly || fileOnly.startsWith('3q/')) for (const f of fs.readdirSync(path.join(HERE, '3q')).filter(f => f.endsWith('.mjs') && !f.startsWith('_') && (!fileOnly || fileOnly === '3q/' + f)).sort()){
    const mod = await import(pathToFileURL(path.join(HERE, '3q', f)));
    for (const [id, fn] of Object.entries(mod.default)){
        if (Q3.has(id)) throw new Error(`${id} が 3q/ に2回出てきます（${f}）`);
        Q3.add(id); DISHES[id] = fn;
    }
}
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--file');
const ids = Object.keys(DISHES).filter(id => !only.length || only.includes(id));
let m; try{ m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }catch(e){ m = { version: 1, items: {} }; }
fs.mkdirSync(OUT, { recursive: true });
let n = 0, bytes = 0;
for (const id of ids){
    const p = new Pic(id);
    const svg = p.svg(DISHES[id](p));
    const file = path.join(OUT, `${id}.svg`);
    // 絵が前と同じなら、manifest の日付と一覧用の小さい絵（thumb）はそのまま残す
    const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === svg;
    if (!same) fs.writeFileSync(file, svg);
    bytes += svg.length; n++;
    const cur = m.items[id];
    if (!cur || (cur.via === 'svg' && !same)) m.items[id] = { file: `${id}.svg`, via: 'svg', model: Q3.has(id) ? 'hand-drawn-3q' : 'hand-drawn', date: new Date().toISOString().slice(0, 10) };
}
if (!noManifest) fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
console.log(`${n}品の絵を作りました（合計 ${Math.round(bytes / 1024)}KB）`);
if (!noManifest) console.log('続けて node tools/illustrations/draw/thumbs.mjs で、一覧用の小さい絵を作ってください');
