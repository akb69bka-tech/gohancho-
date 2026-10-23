#!/usr/bin/env node
// 国ごとのレシピ（gohancho/packs/*.js）と翻訳（packs/i18n/*.js）、日本のレシピ（index.html の R(...)）と英訳（jp.en.js）を検査する
//   node tools/packs/check.mjs           すべての国
//   node tools/packs/check.mjs FR JP     指定した国だけ
//   --summary   国ごとの品数の表だけ出す
// 問題があれば終了コード 1。絵（img/dish/manifest.json）がない料理は「絵なし」として数える（エラーではない。アプリが自動で描く）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = path.join(ROOT, 'gohancho');
const args = process.argv.slice(2);
const summaryOnly = args.includes('--summary');
const only = args.filter(a => !a.startsWith('--')).map(a => a.toUpperCase());

const TYPES = ['main', 'rice', 'noodle', 'side', 'soup'];
const METHODS = ['fry', 'grill', 'raw', 'rice', 'simmer', 'soup', 'stirfry'];
const PROTEINS = ['beef', 'chicken', 'egg', 'fish', 'lamb', 'legume', 'mince', 'pork', 'processed', 'seafood', 'veg'];
const manifest = JSON.parse(fs.readFileSync(path.join(APP, 'img/dish/manifest.json'), 'utf8')).items;

const errors = [], warns = [];
const err = (cc, m) => errors.push(`[${cc}] ${m}`);
const warn = (cc, m) => warns.push(`[${cc}] ${m}`);

function loadPack(file){
    let pack = null;
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { GOHAN_PACK: p => { pack = p; } }, { filename: file });
    return pack;
}
function loadTr(file){
    let d = null;
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { GOHAN_PACK_TR: (cc, lang, x) => { d = x; } }, { filename: file });
    return d;
}
const allIds = new Map();
const rows = [];

// ---------- 日本 ----------
function checkJP(){
    const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
    const list = [];
    const ctx = { R: (id, name, genre, type, method, min, ings, seas, steps) => list.push({ id, name, genre, type, method, min, ings, seas, steps }) };
    const lines = html.split('\n').filter(l => /^R\('/.test(l));
    vm.runInNewContext(lines.join('\n'), ctx);
    const en = loadTr(path.join(APP, 'packs/i18n/jp.en.js')) || {};
    const counts = { main: 0, side: 0, soup: 0, art: 0 };
    for (const r of list){
        if (allIds.has(r.id)) err('JP', `ID が重なっています: ${r.id}（${allIds.get(r.id)} と）`); allIds.set(r.id, 'JP');
        if (!['主菜', 'ごはん', '麺', '副菜', '汁物'].includes(r.type)) err('JP', `${r.id}: 種類が不明 ${r.type}`);
        const ings = r.ings.split('|'), steps = r.steps.split('|');
        if (ings.length < 1) err('JP', `${r.id}: 材料がありません`);
        if (steps.length < 2) err('JP', `${r.id}: 手順が少なすぎます`);
        ings.forEach(s => { if (!/\S\s+\S/.test(s.replace(/\?$/, ''))) warn('JP', `${r.id}: 分量のない材料「${s}」`); });
        const t = en.recipes && en.recipes[r.id];
        if (!t) err('JP', `${r.id}: 英訳（jp.en.js）がありません`);
        else {
            if (!t.name) err('JP', `${r.id}: 英訳の名前がありません`);
            if (!t.ings || t.ings.length !== ings.length) err('JP', `${r.id}: 英訳の材料の数が違います（${t.ings ? t.ings.length : 0} / ${ings.length}）`);
            if (!t.steps || t.steps.length !== steps.length) err('JP', `${r.id}: 英訳の手順の数が違います（${t.steps ? t.steps.length : 0} / ${steps.length}）`);
        }
        const k = r.type === '副菜' ? 'side' : r.type === '汁物' ? 'soup' : 'main';
        counts[k]++; if (manifest[r.id]) counts.art++;
    }
    rows.push(['JP', counts.main, counts.side, counts.soup, list.length, counts.art]);
}

// ---------- 国のパック ----------
function checkPack(file){
    const pk = loadPack(file); if (!pk){ err(path.basename(file), '読みこめません'); return; }
    const cc = pk.country, pre = cc.toLowerCase() + '_';
    const counts = { main: 0, side: 0, soup: 0, art: 0 };
    const nameKeys = new Set(Object.keys(pk.names || {}));
    const langs = [pk.lang, 'ja'].filter((v, i, a) => v && v !== 'en' && a.indexOf(v) === i);
    const trs = {};
    for (const l of langs){
        const f = path.join(APP, 'packs/i18n', `${cc.toLowerCase()}.${l}.js`);
        if (!fs.existsSync(f)){ err(cc, `翻訳ファイルがありません: ${path.basename(f)}`); continue; }
        try{ trs[l] = loadTr(f); }catch(e){ err(cc, `${path.basename(f)} を読みこめません: ${e.message}`); }
    }
    for (const r of pk.recipes || []){
        const where = `${r.id || '(IDなし)'}`;
        if (!r.id || !r.id.startsWith(pre)) err(cc, `${where}: ID は ${pre} で始めてください`);
        if (allIds.has(r.id)) err(cc, `ID が重なっています: ${r.id}（${allIds.get(r.id)} と）`); allIds.set(r.id, cc);
        if (!r.name) err(cc, `${where}: name（英語名）がありません`);
        if (!r.local) warn(cc, `${where}: local（現地の名前）がありません`);
        if (!TYPES.includes(r.type)) err(cc, `${where}: type が不明 ${r.type}`);
        if (!METHODS.includes(r.method)) err(cc, `${where}: method が不明 ${r.method}`);
        if (!PROTEINS.includes(r.protein)) err(cc, `${where}: protein が不明 ${r.protein}`);
        if (!(Number(r.min) > 0 && Number(r.min) <= 600)) err(cc, `${where}: min（分）が不正 ${r.min}`);
        if (!Array.isArray(r.ings) || !r.ings.length) err(cc, `${where}: ings がありません`);
        (r.ings || []).forEach(s => {
            const parts = s.replace(/\?$/, '').split('|');
            if (parts.length !== 3) err(cc, `${where}: 材料の形が「キー|表示名|分量」ではありません: ${s}`);
            else if (!nameKeys.has(parts[0].trim().toLowerCase())) err(cc, `${where}: 材料のキー「${parts[0]}」が names にありません`);
        });
        if (!Array.isArray(r.steps) || r.steps.length < 2) err(cc, `${where}: 手順（steps）が少なすぎます`);
        if (r.seas == null) warn(cc, `${where}: seas（調味料）がありません`);
        for (const [l, tr] of Object.entries(trs)){
            const t = tr && tr.recipes && tr.recipes[r.id];
            if (!t){ err(cc, `${where}: ${l} の翻訳がありません`); continue; }
            if (!t.name) err(cc, `${where}: ${l} の翻訳に名前がありません`);
            if (!t.ings || t.ings.length !== r.ings.length) err(cc, `${where}: ${l} の材料の数が違います（${t.ings ? t.ings.length : 0} / ${r.ings.length}）`);
            if (!t.steps || t.steps.length !== r.steps.length) err(cc, `${where}: ${l} の手順の数が違います（${t.steps ? t.steps.length : 0} / ${r.steps.length}）`);
            if (r.seas && t.seas == null) err(cc, `${where}: ${l} の調味料の翻訳がありません`);
        }
        const k = r.type === 'side' ? 'side' : r.type === 'soup' ? 'soup' : 'main';
        counts[k]++; if (manifest[r.id]) counts.art++;
    }
    for (const [l, tr] of Object.entries(trs)){
        for (const key of nameKeys) if (!(tr.names && tr.names[key])) err(cc, `${l} の names に「${key}」の訳がありません`);
    }
    for (const key of nameKeys) if (!(pk.aliases && pk.aliases[key])) warn(cc, `aliases に「${key}」がありません（材料から検索で見つかりにくい）`);
    rows.push([cc, counts.main, counts.side, counts.soup, (pk.recipes || []).length, counts.art]);
}

if (!only.length || only.includes('JP')) checkJP();
for (const f of fs.readdirSync(path.join(APP, 'packs')).filter(f => f.endsWith('.js')).sort()){
    const cc = f.slice(0, -3).toUpperCase();
    if (only.length && !only.includes(cc)) continue;
    try{ checkPack(path.join(APP, 'packs', f)); }catch(e){ err(cc, `読みこめません: ${e.message}`); }
}

const pad = (s, n) => String(s).padStart(n);
console.log('国   主菜等  副菜  汁物   合計  絵あり');
let tot = [0, 0, 0, 0, 0];
for (const r of rows){ console.log(`${r[0].padEnd(4)} ${pad(r[1], 6)} ${pad(r[2], 5)} ${pad(r[3], 5)} ${pad(r[4], 6)} ${pad(r[5], 7)}`); for (let i = 0; i < 5; i++) tot[i] += r[i + 1]; }
console.log(`計   ${pad(tot[0], 6)} ${pad(tot[1], 5)} ${pad(tot[2], 5)} ${pad(tot[3], 6)} ${pad(tot[4], 7)}`);
if (!summaryOnly){
    if (warns.length) console.log(`\n注意 ${warns.length}件\n` + warns.slice(0, 40).join('\n') + (warns.length > 40 ? '\n…' : ''));
    if (errors.length) console.log(`\nエラー ${errors.length}件\n` + errors.slice(0, 80).join('\n') + (errors.length > 80 ? '\n…' : ''));
    else console.log('\nエラーなし');
}
process.exit(errors.length ? 1 : 0);
