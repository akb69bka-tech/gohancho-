#!/usr/bin/env node
/*
 * ごはん帖の料理イラストを ChatGPT（OpenAI の画像生成）で作るツール
 *
 * 作った画像は gohancho/img/dish/ に保存し、manifest.json に登録する。
 * アプリは manifest.json を読み、登録された料理はこの画像を表示する（ない料理はアプリが描くイラスト）。
 * API キーをアプリに入れると誰でも見られてしまうため、画像は前もって作ってアプリに同梱する。
 *
 * 使い方（詳しくは同じフォルダの README.md）
 *   node tools/illustrations/generate.mjs --dry-run              作る料理と費用の目安を表示（通信しない）
 *   node tools/illustrations/generate.mjs --only nikujaga        1品だけ作る
 *   node tools/illustrations/generate.mjs                       まだ画像がない料理をすべて作る
 *   node tools/illustrations/generate.mjs --only mapo --force    作り直す
 *   node tools/illustrations/generate.mjs --export-prompts      ChatGPT アプリに貼るための指示文の一覧を書き出す（API 不要）
 *   node tools/illustrations/generate.mjs --import ~/Downloads/ごはん帖  ChatGPT アプリで保存した画像を取りこむ
 *
 * 必要なもの: Node.js 18 以上。自動で作る場合は環境変数 OPENAI_API_KEY。
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const APP = path.join(ROOT, 'gohancho', 'index.html');
const OUT = path.join(ROOT, 'gohancho', 'img', 'dish');
const MANIFEST = path.join(OUT, 'manifest.json');

// ---- 設定（環境変数で変えられる） ----
const CONF = {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    model: process.env.GOHAN_IMAGE_MODEL || 'gpt-image-1',     // OpenAI の画像生成モデル名。新しいモデルが出たらここを変える
    quality: process.env.GOHAN_IMAGE_QUALITY || 'medium',       // low / medium / high
    size: '1024x1024',
    format: 'webp',
    concurrency: Number(process.env.GOHAN_CONCURRENCY || 2),
};
// 1枚あたりの料金の目安（米ドル、1024x1024）。料金は変わるので https://platform.openai.com/docs/pricing で確認すること
const PRICE_HINT = { low: 0.011, medium: 0.042, high: 0.167 };

// ---- アプリからレシピを読み出す（index.html の R(...) の行をそのまま評価する） ----
function loadRecipes(){
    const html = fs.readFileSync(APP, 'utf8');
    const lines = html.split('\n').filter(l => /^R\('/.test(l));
    const list = [];
    const ctx = { R: (id, name, genre, type, method, min, ings, seas) => list.push({ id, name, genre, type, method, ings: ings.split('|').map(s => s.replace(/\?$/, '').split(' ')[0]) }) };
    vm.createContext(ctx);
    vm.runInContext(lines.join('\n'), ctx);
    // お膳の「ご飯」「香の物」も作る
    list.push({ id: 'rice', name: '白ご飯', type: 'ごはん', method: '炊', ings: ['ご飯'], extra: true });
    list.push({ id: 'konomono', name: 'お漬物（たくあん・きゅうりの浅漬け）', type: '副菜', method: '和え', ings: ['たくあん'], extra: true });
    return list;
}

// ---- 指示文（プロンプト） ----
function vesselOf(r){
    if (r.id === 'rice') return 'a small white rice bowl (chawan) with a thin indigo band';
    if (r.id === 'konomono') return 'a small rectangular white ceramic dish';
    if (r.type === '汁物') return 'a red-lacquered Japanese soup bowl';
    if (r.type === 'ごはん' || r.type === '麺') return 'a large white donburi bowl with an indigo pattern on the rim';
    if (r.type === '副菜') return 'a small celadon-green ceramic bowl';
    return 'a round white ceramic plate with a thin indigo rim';
}
export function promptOf(r){
    const garnish = r.type === '主菜' && (r.method === '焼' || r.method === '揚') ? ' Served with a little shredded cabbage and a cherry tomato on the side.' : '';
    return [
        `A cute, clean pop-style food illustration of the Japanese home-cooked dish "${r.name}".`,
        `Main ingredients: ${r.ings.slice(0, 6).join(', ')}.${garnish}`,
        `Served in ${vesselOf(r)}, seen from directly above (top-down view), centered, the dish filling about 90% of the image.`,
        'Style: modern flat illustration for a recipe app, soft rounded shapes, bright and appetizing colors, gentle shading and small white highlights, clean dark-brown outlines.',
        'Accurate to how this dish really looks in a Japanese home. No text, no letters, no hands, no chopsticks, no table, no other dishes. Transparent background.',
        'Keep the same illustration style across a whole series of dishes.',
    ].join(' ');
}

// ---- 保存と manifest ----
function readManifest(){ try{ return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }catch(e){ return { version: 1, items: {} }; } }
function writeManifest(m){ fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n'); }
// 同じ料理の古い画像（拡張子ちがい）を消す
function removeOld(id, keep){
    for (const ext of ['.png', '.webp', '.jpg']){ const f = path.join(OUT, id + ext); if (id + ext !== keep && fs.existsSync(f)) fs.unlinkSync(f); }
}
function record(m, id, file, via){
    m.items[id] = { file, via, model: via === 'api' ? CONF.model : 'chatgpt', date: new Date().toISOString().slice(0, 10) };
}

// ---- OpenAI の画像生成 API ----
async function generateOne(r){
    const body = { model: CONF.model, prompt: promptOf(r), size: CONF.size, quality: CONF.quality, n: 1, background: 'transparent', output_format: CONF.format, output_compression: 82 };
    for (let attempt = 1; attempt <= 4; attempt++){
        const res = await fetch(`${CONF.baseUrl}/images/generations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CONF.apiKey}` },
            body: JSON.stringify(body),
        });
        if (res.ok){
            const j = await res.json();
            const b64 = j && j.data && j.data[0] && j.data[0].b64_json;
            if (!b64) throw new Error('画像が返ってきませんでした');
            return Buffer.from(b64, 'base64');
        }
        const text = await res.text().catch(() => '');
        if ((res.status === 429 || res.status >= 500) && attempt < 4){
            const wait = 2000 * 2 ** (attempt - 1);
            console.log(`  ${r.name}: 混雑しているので ${wait / 1000} 秒待って再試行します（${res.status}）`);
            await new Promise(ok => setTimeout(ok, wait));
            continue;
        }
        throw new Error(`OpenAI API エラー ${res.status}: ${text.slice(0, 300)}`);
    }
}

async function runGenerate(targets, m){
    let done = 0, failed = 0;
    const queue = targets.slice();
    async function worker(){
        while (queue.length){
            const r = queue.shift();
            try{
                const buf = await generateOne(r);
                const file = `${r.id}.${CONF.format}`;
                fs.mkdirSync(OUT, { recursive: true });
                fs.writeFileSync(path.join(OUT, file), buf); removeOld(r.id, file);
                record(m, r.id, file, 'api'); writeManifest(m);
                done++; console.log(`✓ ${r.name}（${file}、${Math.round(buf.length / 1024)}KB）`);
            }catch(e){ failed++; console.log(`✗ ${r.name}: ${e.message}`); }
        }
    }
    await Promise.all(Array.from({ length: Math.max(1, CONF.concurrency) }, worker));
    console.log(`\n完了: ${done}品 作成、${failed}品 失敗。画像: ${path.relative(ROOT, OUT)}`);
    if (failed){ console.log('失敗した料理は、もう一度同じコマンドを実行すると作り直します（できた料理は飛ばします）。'); process.exitCode = 1; }
}

// ---- ChatGPT アプリ用: 指示文の書き出しと、保存した画像の取りこみ ----
function exportPrompts(targets){
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'prompts.md');
    const lines = ['# ChatGPT に貼る指示文（ごはん帖の料理イラスト）', '',
        '1つずつ ChatGPT に貼って画像を作り、**指定のファイル名**で同じフォルダに保存してください。',
        '保存したら `node tools/illustrations/generate.mjs --import <そのフォルダ>` で取りこめます。', ''];
    targets.forEach((r, i) => lines.push(`## ${i + 1}. ${r.name}`, '', `保存するファイル名: \`${r.id}.png\``, '', '```', promptOf(r), '```', ''));
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`指示文を書き出しました: ${path.relative(ROOT, file)}（${targets.length}品）`);
}
function importFolder(dir, recipes, m){
    const ids = new Set(recipes.map(r => r.id));
    let n = 0;
    for (const f of fs.readdirSync(dir)){
        const ext = path.extname(f).toLowerCase(), id = path.basename(f, path.extname(f));
        if (!['.png', '.webp', '.jpg', '.jpeg'].includes(ext) || !ids.has(id)) continue;
        fs.mkdirSync(OUT, { recursive: true });
        const out = `${id}${ext === '.jpeg' ? '.jpg' : ext}`;
        const dest = path.join(OUT, out);
        fs.copyFileSync(path.join(dir, f), dest); removeOld(id, out);
        // ChatGPT アプリの画像は 1〜3MB と大きいので、Mac なら標準の sips で 640px に縮める（透明な背景はそのまま）
        if (process.platform === 'darwin' && fs.statSync(dest).size > 400 * 1024){
            try{ execFileSync('sips', ['-Z', '640', dest], { stdio: 'ignore' }); }catch(e){ console.log(`  ${id}: 縮小できなかったのでそのまま使います`); }
        }
        record(m, id, out, 'chatgpt'); n++;
        console.log(`✓ ${id} を取りこみました（${Math.round(fs.statSync(dest).size / 1024)}KB）`);
    }
    writeManifest(m);
    console.log(`\n${n}枚を取りこみました。料理の ID と一致しないファイル名は無視しています（ID は prompts.md を参照）。`);
}

// ---- 実行 ----
async function main(){
    const args = process.argv.slice(2);
    const has = k => args.includes(k);
    const val = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
    const recipes = loadRecipes();
    const m = readManifest();
    const only = val('--only') ? new Set(val('--only').split(',').map(s => s.trim())) : null;
    let targets = recipes.filter(r => (!only || only.has(r.id)));
    if (!has('--force') && !has('--export-prompts')) targets = targets.filter(r => !m.items[r.id]);
    if (only){ const unknown = [...only].filter(id => !recipes.some(r => r.id === id)); if (unknown.length) console.log(`見つからない料理 ID: ${unknown.join(', ')}`); }

    if (has('--import')){
        const dir = val('--import');
        if (!dir || !fs.existsSync(dir)){ console.log('取りこむフォルダが見つかりません。例: --import ~/Downloads/ごはん帖'); process.exitCode = 1; return; }
        return importFolder(dir, recipes, m);
    }
    if (has('--export-prompts')) return exportPrompts(targets);

    const cost = targets.length * (PRICE_HINT[CONF.quality] || PRICE_HINT.medium);
    console.log(`作る料理: ${targets.length}品（モデル ${CONF.model}・品質 ${CONF.quality}）。費用の目安: 約 ${cost.toFixed(2)} 米ドル（料金は公式ページで確認してください）`);
    if (has('--dry-run')){ targets.slice(0, 3).forEach(r => console.log(`\n[${r.id}] ${promptOf(r)}`)); if (targets.length > 3) console.log(`\n…ほか ${targets.length - 3}品`); return; }
    if (!targets.length){ console.log('作る料理はありません（作り直すときは --force）。'); return; }
    if (!CONF.apiKey){ console.log('\nOPENAI_API_KEY が設定されていません。README.md の手順1・2を見てください。'); process.exitCode = 1; return; }
    await runGenerate(targets, m);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
