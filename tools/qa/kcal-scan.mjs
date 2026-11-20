#!/usr/bin/env node
// カロリーの目安を21か国の全料理で出して JSON に書き出し、前の結果とくらべる（R154 の確かめ用。Playwright）
//   node tools/qa/kcal-scan.mjs out.json [前の結果.json] [http://localhost:8765/]
//   前の結果を渡すと、前・後の高い順 20 品と、値の変わった料理の数を出す
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE, seedScript, ready } = require('../lib/pw.cjs');
const [OUT, PREV, URL_ = process.env.BASE || BASE] = process.argv.slice(2);
if (!OUT){ console.log('使い方: node tools/qa/kcal-scan.mjs out.json [前の結果.json] [URL]'); process.exit(2); }
const ALL = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const b = await chromium.launch(LAUNCH); const ctx = await b.newContext({locale: 'ja-JP'});
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(1));
await ctx.addInitScript(() => { localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'a', role: 'adult', avoid: [], allergy: []}]})); });
const p = await ctx.newPage(); await p.goto(URL_); await ready(p);
const now = await p.evaluate(async ccs => { const o = {};
    for (const cc of ccs){ await setCountry(cc); RECIPES.forEach(r => { const k = kcalOf(r), x = kcalRaw(r); o[cc + ':' + r.id] = {st: k.st, v: k.v, big: !!k.big, raw: x && x.kcal, type: r.type}; }); }
    await setCountry('JP'); return o; }, ALL);
await b.close();
fs.writeFileSync(OUT, JSON.stringify(now));
const show = x => !x ? '-' : x.st === 'ok' ? x.v : x.big ? `出せない(量が多い ${Math.round(x.raw)})` : x.st;
const top = o => Object.entries(o).filter(([, v]) => v.st === 'ok').sort((a, c) => c[1].raw - a[1].raw).slice(0, 20);
if (PREV){
    const pr = JSON.parse(fs.readFileSync(PREV, 'utf8'));
    console.log('--- 前の高い順 20'); top(pr).forEach(([k, v], i) => console.log(i + 1, k, v.v, '→', show(now[k])));
    console.log('--- 後の高い順 20'); top(now).forEach(([k, v], i) => console.log(i + 1, k, v.v, '（前', show(pr[k]) + '）'));
    const ch = Object.keys(now).filter(k => !pr[k] || pr[k].st !== now[k].st || pr[k].v !== now[k].v);
    console.log(`全 ${Object.keys(now).length} 品のうち、変わった料理 ${ch.length} 品（量が多くて出せない ${Object.values(now).filter(x => x.big).length} 品）`);
} else console.log('高い順 20'), top(now).forEach(([k, v], i) => console.log(i + 1, k, v.v));
