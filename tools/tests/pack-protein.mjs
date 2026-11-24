#!/usr/bin/env node
// 国の料理の「主役の食材」（r.protein）の選び方（北条の点検 11/17）: 豆の料理で、ささげ（Long beans）・いんげん・もやしなど「豆」の字が入る野菜を主役にしない。豆腐・テンペ・大豆ミートがあればそれを主役にする
//  使い方: node tools/tests/pack-protein.mjs [http://localhost:9331/]
//  P1 ph_adobongsitaw・ph_ginataangsitawtalong の主役は豆腐（tofu）
//  P2 21か国: 豆の料理（protein legume）で、必須の材料に豆腐・テンペ・大豆ミートがあるときは、それが主役
//  P3 21か国: 豆の料理で、ほかに豆の材料があるのに、主役が豆の字の入る野菜（ささげ・いんげん・もやし・ピーマン）になっていない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
// テストの側の言葉（アプリの PROTEIN_FIRST・NOT_LEGUME とは別に持つ）
const SOY = /tofu|tokwa|tempe|tahu|soya|soy chunk|textured soy/;
const VEG = /long bean|green bean|string bean|runner bean|french bean|snap pea|snow pea|bean sprout|pepper/;
const LEG = /bean|lentil|chickpea|dal|pea|peanut|fava|tofu|tempe/;

const b = await chromium.launch(LAUNCH);
const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
    {onboarded: true, firstUse: '2020-01-01', settings: {country: 'JP', uiLang: 'en', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'a', role: 'adult', avoid: [], allergy: []}]});
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
await p.goto(URL_);
await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, {timeout: 30000});
const rs = await p.evaluate(async () => {
    await Promise.all(COUNTRIES.filter(c => c.cc !== 'JP').map(c => loadBrowse(c.cc)));
    return COUNTRIES.filter(c => c.cc !== 'JP').flatMap(c => (BROWSE[c.cc] || []).map(r => ({id: r.id, cc: c.cc, fam: r.family, protein: r.protein, keys: r.items.filter(i => !i.opt).map(i => i.key)})));
});
console.log('料理', rs.length, '品・豆の料理', rs.filter(r => r.fam === '大豆').length, '品');
const byId = Object.fromEntries(rs.map(r => [r.id, r]));
ok(['ph_adobongsitaw', 'ph_ginataangsitawtalong'].every(id => byId[id] && byId[id].protein === 'tofu'), 'P1 フィリピンの2品の主役は豆腐: ' + ['ph_adobongsitaw', 'ph_ginataangsitawtalong'].map(id => id + '=' + (byId[id] || {}).protein).join(' '));
const bad2 = rs.filter(r => r.fam === '大豆' && r.keys.some(k => SOY.test(k)) && !SOY.test(r.protein || '')).map(r => `${r.id}=${r.protein}`);
ok(bad2.length === 0, 'P2 豆腐・テンペ・大豆ミートのある豆の料理は、それが主役: ' + bad2.join(' '));
const bad3 = rs.filter(r => r.fam === '大豆' && VEG.test(r.protein || '') && r.keys.some(k => LEG.test(k) && !VEG.test(k))).map(r => `${r.id}=${r.protein}`);
ok(bad3.length === 0, 'P3 ほかに豆の材料があるのに、豆の字の入る野菜を主役にしない: ' + bad3.join(' '));
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
