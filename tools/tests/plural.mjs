#!/usr/bin/env node
// 単数・複数（第21回 R71）と、中国語・韓国語の区切り記号（第21回 R80）
// 使い方: node tools/tests/plural.mjs [http://localhost:8881/]
//  P1 英・独・波・亜で、家族の「食べたい」の文が n=1・2・5 で正しい形になる（亜は 11 も）
//  P2 英語の「{n} days left」「Plan for {n} dishes」「{n} steps」「Cooked {n} times」「{n} timers」が n=1 で単数
//  P3 ポーランド語の 1・2・5・22 日、アラビア語の 1・2・3・11・100 日
//  P4 形の変わらない言語（日・中・韓・タイ・越・インドネシア）は今までどおり
//  P5 i18n の辞書: 中国語・韓国語の訳に日本語の「・」がない。韓国語の訳に全角の（ ）がない
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };

// P5（ブラウザ不要）
for (const L of ['zh-Hans', 'zh-Hant', 'ko']){
    const d = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'gohancho', 'i18n', L + '.js'), 'utf8'), {GOHAN_I18N: (l, x) => Object.assign(d, x)});
    const vals = Object.entries(d).map(([k, v]) => [k, typeof v === 'object' ? Object.values(v).join('|') : String(v)]);
    const dot = vals.filter(([k, v]) => /・/.test(v)), par = L === 'ko' ? vals.filter(([k, v]) => /[（）]/.test(v)) : [];
    ok(!dot.length, `P5 ${L} の訳に日本語の「・」がない: ${dot.slice(0, 3).map(x => x[1]).join(' / ')}`);
    if (L === 'ko') ok(!par.length, `P5 ko の訳に全角の（ ）がない: ${par.slice(0, 3).map(x => x[1]).join(' / ')}`);
}

const b = await chromium.launch(LAUNCH);
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
await ctx.addInitScript(seedScript(seedFor('plural', 'p')));
await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', st); }, JSON.stringify({onboarded: true, firstUse: '2026-01-05', settings: {country: 'JP', uiLang: 'ja'}}));
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
await p.goto(URL_); await ready(p); await p.waitForTimeout(400);
// 言語 l で、日本語の文 key を n ごとに訳す
const tr = (l, key, ns, more) => p.evaluate(async ([l, key, ns, more]) => { const prev = LANG; await setLang(l); const out = ns.map(n => t(key, Object.assign({n}, more || {}))); await setLang(prev); return out; }, [l, key, ns, more]);

const WISH = '家族から「食べたい」が{n}件届いています。献立に入れてみませんか';
{
    const [a1, a2, a5] = await tr('en', WISH, [1, 2, 5]);
    ok(/sent a request\./.test(a1) && !/requests/.test(a1) && /sent 2 requests/.test(a2) && /sent 5 requests/.test(a5), `P1 en 1/2/5: ${a1} | ${a2} | ${a5}`);
}
{
    const [a1, a2, a5] = await tr('de', WISH, [1, 2, 5]);
    ok(/einen Wunsch/.test(a1) && !/Wünsche/.test(a1) && /2 Wünsche/.test(a2) && /5 Wünsche/.test(a5), `P1 de 1/2/5: ${a1} | ${a2} | ${a5}`);
}
{
    const [a1, a2, a5, a22] = await tr('pl', WISH, [1, 2, 5, 22]);
    ok(/1 życzenie\./.test(a1) && /2 życzenia\./.test(a2) && /5 życzeń\./.test(a5) && /22 życzenia\./.test(a22), `P1 pl 1/2/5/22: ${a1} | ${a2} | ${a5} | ${a22}`);
}
{
    const [a1, a2, a5, a11] = await tr('ar', WISH, [1, 2, 5, 11]);
    ok(/طلبًا واحدًا/.test(a1) && /طلبين/.test(a2) && /5 طلبات/.test(a5) && /11 طلبًا/.test(a11) && !/طلبات/.test(a1), `P1 ar 1/2/5/11: ${a1} | ${a2} | ${a5} | ${a11}`);
}
{
    const cases = [['あと{n}日', '1 day left', '5 days left'], ['{n}品の段取り', 'Plan for 1 dish', 'Plan for 5 dishes'], ['手順{n}つ', '1 step', '5 steps'], ['作った記録{n}回', 'Cooked once', 'Cooked 5 times'], ['タイマー{n}つ', '1 timer', '5 timers'], ['材料{n}つ', '1 ingredient', '5 ingredients'], ['{n}品を外しました', 'Removed 1 item', 'Removed 5 items']];
    for (const [k, one, five] of cases){
        const [a1, a5] = await tr('en', k, [1, 5]);
        ok(a1 === one && a5 === five, `P2 en「${k}」: ${a1} | ${a5}`);
    }
    // 2つの数がある文（それぞれの数で形を選ぶ）
    const [x] = await tr('en', '材料{n}品・作り方{m}手順を読み取りました。内容を確かめてから追加してください', [1], {m: 4});
    ok(/Read 1 ingredient and 4 steps\./.test(x), `P2 en 2つの数: ${x}`);
}
{
    const d = await tr('pl', 'あと{n}日', [1, 2, 5, 22]);
    ok(d[0] === 'Został 1 dzień' && d[1] === 'Zostały 2 dni' && d[2] === 'Zostało 5 dni' && d[3] === 'Zostały 22 dni', `P3 pl あと{n}日: ${d.join(' | ')}`);
    const a = await tr('ar', 'あと{n}日', [1, 2, 3, 11, 100]);
    ok(a[0] === 'باقي يوم واحد' && a[1] === 'باقي يومان' && a[2] === 'باقي 3 أيام' && a[3] === 'باقي 11 يومًا' && a[4] === 'باقي 100 يوم', `P3 ar あと{n}日: ${a.join(' | ')}`);
    const de = await tr('de', 'あと{n}日', [1, 2]);
    ok(de[0] === 'Noch 1 Tag' && de[1] === 'Noch 2 Tage', `P3 de あと{n}日: ${de.join(' | ')}`);
}
{
    const ja = await tr('ja', WISH, [1]);
    ok(ja[0] === '家族から「食べたい」が1件届いています。献立に入れてみませんか', `P4 ja はそのまま: ${ja[0]}`);
    for (const l of ['zh-Hans', 'ko', 'th', 'vi', 'id']){
        const [a1, a5] = await tr(l, 'あと{n}日', [1, 5]);
        ok(a1.includes('1') && a5.includes('5') && a1.replace('1', '#') === a5.replace('5', '#') && !/[{}|]/.test(a1), `P4 ${l} 形が変わらない: ${a1} | ${a5}`);
    }
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
