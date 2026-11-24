#!/usr/bin/env node
// 第24回 R101（安全）: アレルゲンの判定（⚠／🔍）が画面の言葉で変わらないか（Playwright。使い方: node tools/tests/alg-lang.mjs [http://localhost:8765/]）
//  G1 全部の国 × 画面の言葉（日本語と17言語。LANGS で しぼれる）で、全部の料理 × 全部のアレルゲンの判定（当たる／袋の表示を確認／なし）が同じ
//  G2 ハム・ベーコン・ソーセージなどの卵の🔍、福神漬け・らっきょう漬け・アサフェティダの🔍 などが、どの言葉でも付く（名指しの料理）
//  DUMP=ファイル で、言葉ごとの判定のいちばん強いもの（全部の言葉の和）を書き出す。UNION=ファイル で、その和より弱くなった判定がないか見る（直す前と比べる）
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ALL_CC = ['JP', 'US', 'KR', 'TH', 'FR', 'BR', 'CN', 'DE', 'EG', 'ES', 'GB', 'ID', 'IN', 'IT', 'MX', 'PE', 'PH', 'PL', 'TR', 'TW', 'VN'];
const ALL_LANGS = ['ja', 'en', 'fr', 'de', 'it', 'es', 'pt-BR', 'pl', 'tr', 'ar', 'hi', 'id', 'fil', 'th', 'zh-Hans', 'zh-Hant', 'ko', 'vi'];
const CCS = (process.env.CCS || ALL_CC.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const LANGS = (process.env.LANGS || ALL_LANGS.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(SEED));
await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', dishCount: 3, servings: 2}})); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);
// 名指しの料理と、どの言葉でも付いていてほしい判定（may 以上）
const NAMED = {US: [['us_potatosoup', 'egg']], JP: [['rollcabbage', 'egg']], IN: [['in_dal', 'wheat']], CN: [['cn_donggua_paigu', 'wheat']]};
const union = {}, base = process.env.UNION ? JSON.parse(fs.readFileSync(process.env.UNION, 'utf8')) : null;
let diffN = 0, recN = 0, weaker = 0; const diffByLang = {};
for (const cc of CCS){
    const per = {};
    for (const lg of LANGS){
        const sig = await p.evaluate(async ([cc, lg]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            if (LANG !== lg){ const n = ++uiLangSeq; await switchLang(lg, n); }
            if (LANG !== lg) return null;
            S.settings.allergens = [];
            const out = {};
            RECIPES.forEach(r => { if (r.isTwist || isCustomId(r.id)) return; const m = algRecipeMap(r), s = [];
                Object.keys(m).sort().forEach(id => { const ks = m[id].map(x => x.kind); const hit = ks.some(k => k === 1 || k === 2 || (k === 3 && algFerm())); const may = ks.includes(4); if (hit) s.push(id + ':h'); else if (may) s.push(id + ':m'); });
                out[r.id] = s.join(','); });
            return out;
        }, [cc, lg]);
        if (!sig){ ok(false, `G1 ${cc} 画面の言葉を ${lg} にできない`); continue; }
        per[lg] = sig;
    }
    const langs = Object.keys(per); if (!langs.length) continue;
    const ids = Object.keys(per[langs[0]]); recN += ids.length;
    const diffs = [];
    ids.forEach(id => {
        const vals = langs.map(l => per[l][id] || '');
        const u = {}; vals.forEach(v => v.split(',').filter(Boolean).forEach(x => { const [a, c] = x.split(':'); if (c === 'h' || !u[a]) u[a] = c; }));
        union[cc + '/' + id] = u;
        if (new Set(vals).size > 1){ diffs.push(id); langs.forEach((l, k) => { if (vals[k] !== vals[0]) diffByLang[l] = (diffByLang[l] || 0) + 1; });
            if (diffs.length <= 4) console.log(`  ${cc}/${id}: ` + langs.map((l, k) => l + '=' + vals[k]).filter((x, k) => vals[k] !== vals[0] || k === 0).join(' | ').slice(0, 300)); }
        if (base && base[cc + '/' + id]){ const B = base[cc + '/' + id]; Object.entries(B).forEach(([a, c]) => { const now = u[a]; if (!now || (c === 'h' && now !== 'h')){ weaker++; if (weaker <= (+process.env.SHOWW || 20)) console.log(`  弱くなった ${cc}/${id} ${a}: ${c} → ${now || 'なし'}`); } }); }
    });
    diffN += diffs.length;
    ok(!diffs.length, `G1 ${cc} 画面の言葉で判定が変わる料理 ${diffs.length}品: ${diffs.slice(0, 12).join(',')}`);
    for (const [id, a] of NAMED[cc] || []) langs.forEach(l => ok(!!(per[l][id] || '').split(',').some(x => x.startsWith(a + ':')), `G2 ${cc}/${id} ${l} の画面で ${a} の印`));
}
await p.evaluate(async () => { if (LANG !== 'ja'){ const n = ++uiLangSeq; await switchLang('ja', n); } });
console.log(`G1 料理 ${recN}（国ごと）・言葉で判定が変わる料理 ${diffN}・言葉ごと ${JSON.stringify(diffByLang)}`);
if (base) console.log(`G1 直す前の全部の言葉の和より弱くなった判定 ${weaker}（訳の言葉の読みちがいが消えた分を含む。一覧を読んで確かめる）`);
if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify(union));
await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
