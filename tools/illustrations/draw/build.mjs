#!/usr/bin/env node
/*
 * 料理イラスト（SVG）を作る
 *   node tools/illustrations/draw/build.mjs            全部作る → gohancho/img/dish/{id}.svg と manifest.json
 *   node tools/illustrations/draw/build.mjs nikujaga   1品だけ
 *   --file f_side1.mjs  その盛りつけファイルだけ読む　--no-manifest  manifest.json を書きかえない（試し描き用）
 * dishes/*.mjs に料理ごとの盛りつけ（どの器に、どの具を、どこに置くか）を書く。部品は kit.mjs
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
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--file');
const ids = Object.keys(DISHES).filter(id => !only.length || only.includes(id));
let m; try{ m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }catch(e){ m = { version: 1, items: {} }; }
fs.mkdirSync(OUT, { recursive: true });
let n = 0, bytes = 0;
for (const id of ids){
    const p = new Pic(id);
    const svg = p.svg(DISHES[id](p));
    fs.writeFileSync(path.join(OUT, `${id}.svg`), svg);
    bytes += svg.length; n++;
    const cur = m.items[id];
    if (!cur || cur.via === 'svg') m.items[id] = { file: `${id}.svg`, via: 'svg', model: 'hand-drawn', date: new Date().toISOString().slice(0, 10) };
}
if (!noManifest) fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
console.log(`${n}品の絵を作りました（合計 ${Math.round(bytes / 1024)}KB）`);
