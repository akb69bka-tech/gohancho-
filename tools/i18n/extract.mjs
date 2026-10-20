#!/usr/bin/env node
// ごはん帖の翻訳キーを取り出す / 辞書を確かめる（依存なし）
//
//   node tools/i18n/extract.mjs                 → gohancho/index.html の t('…') をすべて集めて tools/i18n/keys.json に書き出す
//   node tools/i18n/extract.mjs --check en      → gohancho/i18n/en.js に足りない訳・{n} などの置き換え記号の食い違いを表示
//                                                 （問題があれば終了コード 1）
//
// キーは t('…') / t("…") / t(`…`) の最初の引数（文字列そのもの）。`…` の中に ${} は使えない（{n} などの置き換え記号を使う）。
// tc('場面', '…') は '場面|…' というキーになる（同じ日本語を場面で訳し分けるとき。なければ '…' の訳を使う）。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const HTML = path.join(ROOT, 'gohancho', 'index.html');
const OUT = path.join(HERE, 'keys.json');

function unescapeJs(raw){
    return raw.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (m, e) => {
        if (e[0] === 'u') return String.fromCodePoint(parseInt(e[1] === '{' ? e.slice(2, -1) : e.slice(1), 16));
        if (e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
        return {n:'\n', t:'\t', r:'\r', b:'\b', f:'\f', v:'\v', '0':'\0', '\n':''}[e] ?? e;
    });
}

// src[i] が引用符のとき、その文字列リテラルを読む → {raw, end}（end は閉じ引用符の次）
function readString(src, i){
    const q = src[i];
    if (!/['"`]/.test(q)) return null;
    let raw = '';
    for (let j = i + 1; j < src.length; j++){
        const c = src[j];
        if (c === '\\'){ raw += c + src[j + 1]; j++; continue; }
        if (c === q) return {raw, q, end: j + 1};
        if (q !== '`' && c === '\n') return null;
        raw += c;
    }
    return null;
}

export function extractKeys(src){
    const keys = new Set(), errors = [];
    const re = /(^|[^\w$.])(tc?)\(\s*/g;
    let m;
    while ((m = re.exec(src))){
        const line = src.slice(0, m.index).split('\n').length;
        let i = re.lastIndex, ctx = null;
        if (!/['"`]/.test(src[i])) continue;            // t(変数) は関数の定義など。キーではない
        if (m[2] === 'tc'){
            const c = readString(src, i);
            const comma = c && src.slice(c.end).match(/^\s*,\s*/);
            if (!comma){ errors.push(`line ${line}: tc() needs ('context', 'key')`); continue; }
            ctx = unescapeJs(c.raw); i = c.end + comma[0].length;
        }
        const s = readString(src, i);
        if (!s){ errors.push(`line ${line}: unterminated or non-literal key`); continue; }
        re.lastIndex = s.end;
        if (s.q === '`' && s.raw.includes('${')){ errors.push(`line ${line}: template key contains \${}: ${s.raw.slice(0, 60)}`); continue; }
        // 最初の引数が文字列だけのとき（t('a' + b) のような足し算は使わない）
        if (!/^\s*[,)]/.test(src.slice(s.end))){ errors.push(`line ${line}: key is not a plain string literal: ${s.raw.slice(0, 60)}`); continue; }
        const key = unescapeJs(s.raw);
        keys.add(ctx === null ? key : ctx + '|' + key);
    }
    return {keys: [...keys].sort(), errors};
}

// {n} と、訳の中の {n:# day:# days}（単数・複数）を同じ置き換え記号として数える
function placeholders(s){ return [...new Set([...String(s).matchAll(/\{(\w+)(?::[^:{}]*:[^:{}]*)?\}/g)].map(x => '{' + x[1] + '}'))].sort().join(','); }

function loadDict(lang){
    const file = path.join(ROOT, 'gohancho', 'i18n', `${lang}.js`);
    if (!fs.existsSync(file)) throw new Error(`not found: ${path.relative(ROOT, file)}`);
    const dicts = {};
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {GOHAN_I18N: (l, d) => { dicts[l] = Object.assign(dicts[l] || {}, d); }}, {filename: file});
    if (!dicts[lang]) throw new Error(`${path.relative(ROOT, file)} does not call GOHAN_I18N('${lang}', {...})`);
    return dicts[lang];
}

const args = process.argv.slice(2);
const {keys, errors} = extractKeys(fs.readFileSync(HTML, 'utf8'));
fs.writeFileSync(OUT, JSON.stringify(keys, null, 1) + '\n');
console.log(`${keys.length} keys → ${path.relative(ROOT, OUT)}`);
errors.forEach(e => console.log('ERROR ' + e));
let bad = errors.length;

const ci = args.indexOf('--check');
if (ci >= 0){
    const lang = args[ci + 1];
    if (!lang){ console.error('usage: extract.mjs --check <lang>'); process.exit(2); }
    const dict = loadDict(lang);
    const missing = [], mismatch = [], unused = [];
    keys.forEach(k => {
        if (!(k in dict)){ missing.push(k); return; }
        const v = dict[k], want = placeholders(k);
        const forms = v && typeof v === 'object' ? Object.values(v) : [v];
        if (typeof v === 'object' && !('other' in v)) mismatch.push(`${k}  (plural object needs "other")`);
        forms.forEach(f => {
            // 複数形の one は {n} を書かなくてもよい（"1 day" → "a day" など）
            const have = placeholders(f);
            if (have !== want && !(typeof v === 'object' && f !== v.other && have.split(',').every(p => !p || want.split(',').includes(p))))
                mismatch.push(`${k}  → ${JSON.stringify(f)}  (expected {${want}} got {${have}})`);
        });
    });
    Object.keys(dict).forEach(k => { if (!keys.includes(k)) unused.push(k); });
    console.log(`\n[${lang}] ${keys.length - missing.length}/${keys.length} translated, ${missing.length} missing, ${mismatch.length} placeholder mismatches, ${unused.length} unused`);
    missing.forEach(k => console.log('MISSING  ' + JSON.stringify(k)));
    mismatch.forEach(k => console.log('MISMATCH ' + k));
    unused.forEach(k => console.log('UNUSED   ' + JSON.stringify(k)));
    bad += missing.length + mismatch.length;
}
process.exit(bad ? 1 : 0);
