#!/usr/bin/env node
// 2つのタブで同時に開いたときの回帰テスト（第51回。料理名からのタブを足したあとの確かめ。使い方: node tools/tests/tab51.mjs [http://localhost:9291/]）
//  T1 B で料理名からを開いて「オムレツ」をさがしている。A で卵のアレルギーを足すと、B も読み直してアレルギーがそろい、卵に当たる料理を出さない
//  T2 B が入力欄にいるまま A で乳のアレルギーを足し、B でさがす。入力欄から出たあと、B も乳のアレルギーがそろい、乳に当たる料理を出さない
//  T3 A で献立を決め、古いままの B で苦手（セロリ）を足す。決めた献立・アレルギー・苦手が、保存にも両方のタブにも残り、両方で同じ
//  T4 A で卵のアレルギーを外し、古いままの B で人数を変える。卵は外れたまま（よみがえらない）、人数の変更も残る
//  T5 両方のタブで、ほぼ同時にちがう献立に決める。保存は読めて、両方のタブの献立・決めた印・設定がそろう
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED } = require('../lib/pw.cjs');
const URL_ = (u => u.endsWith('/') ? u : u + '/')(process.argv[2] || process.env.BASE || BASE_);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const st0 = { onboarded: true, firstUse: '2020-01-01', settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2 }, family: [{ id: 'f0', name: 'a', role: 'adult', avoid: [], allergy: [] }] };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(st)); }, st0);
const open = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL_); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, { timeout: 30000 }); return p; };
const A = await open(), B = await open();
const stored = () => A.evaluate(() => JSON.parse(localStorage.getItem('gohancho.v1')));
const st = p => p.evaluate(() => ({ alg: algIds().join(), avoid: (S.settings.avoid || []).join(), dec: menuIsDecided(), menu: menuIds().join(), sv: S.settings.servings }));
// 見えて手が空いた（前に出た・入力欄から出た）ときに、ほかのタブの保存を読み直す
const settle = async p => { await p.bringToFront(); await p.evaluate(() => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(900); };
// 料理名からに出ているカードの料理（ひとひねりは作り直す）
const shownOf = p => p.evaluate(() => [...document.querySelectorAll('#ns-results .dcard .head[data-act="open"]')].map(e => String(e.dataset.id).startsWith('a~') ? buildTwist(e.dataset.id) : byId(e.dataset.id)).filter(Boolean).map(r => ({ id: r.id, hit: allergyConflict(r) || (String(r.id).startsWith('a~') && twistAvoided(r)) })));

// T1
await B.bringToFront(); await B.click('nav.tabs button[data-tab="name"]'); await B.waitForSelector('#ns-input'); await B.fill('#ns-input', 'オムレツ'); await B.press('#ns-input', 'Enter');
await B.waitForFunction(() => !nsLoading && COUNTRIES.every(c => c.cc === currentCountry() || BROWSE[c.cc] || browseErr.has(c.cc)), null, { timeout: 90000 }); await B.waitForTimeout(300);
const egg0 = await B.evaluate(() => [...document.querySelectorAll('#ns-results .dcard .head[data-act="open"]')].map(e => byId(e.dataset.id)).filter(r => r && r.items && r.items.some(i => algItemHit(['egg'], i))).length);
await A.bringToFront(); await A.evaluate(() => { const a = algIds(); a.push('egg'); S.settings.allergens = a; save(); reconcileMenu(); refreshWeek(); render(); if (typeof saveNow === 'function') saveNow(); });
await A.waitForTimeout(600);
await settle(B); await B.click('#view h2').catch(() => {}); await B.waitForTimeout(1200);
const t1 = { alg: (await st(B)).alg, shown: await shownOf(B) };
ok(egg0 > 0 && t1.alg.split(',').includes('egg') && !t1.shown.some(x => x.hit), `T1 別のタブで卵のアレルギーを足すと、料理名からを開いていたタブも卵に当たる料理を出さない（前 ${egg0} 品）: ` + JSON.stringify(t1).slice(0, 300));

// T2
await A.bringToFront(); await A.evaluate(() => { const a = algIds(); a.push('milk'); S.settings.allergens = a; save(); if (typeof saveNow === 'function') saveNow(); }); await A.waitForTimeout(500);
await B.bringToFront(); await B.focus('#ns-input'); await B.fill('#ns-input', 'グラタン'); await B.waitForTimeout(700);
await B.click('#view h2').catch(() => {}); await B.waitForTimeout(1200);
const t2 = { alg: (await st(B)).alg, shown: await shownOf(B) };
ok(t2.alg.split(',').includes('milk') && !t2.shown.some(x => x.hit), 'T2 入力欄にいるあいだに別のタブでアレルギーを足しても、入力欄から出たあとはそろい、当たる料理を出さない: ' + JSON.stringify(t2).slice(0, 300));

// T3
await A.bringToFront(); await A.click('nav.tabs button[data-tab="today"]'); await A.waitForTimeout(500); await A.click('[data-act="decide"]'); await A.waitForTimeout(800);
const a3 = await st(A);
await B.bringToFront(); await B.evaluate(() => { const v = S.settings.avoid || []; v.push('セロリ'); S.settings.avoid = v; save(); if (typeof saveNow === 'function') saveNow(); }); await B.waitForTimeout(800);
await settle(A); await settle(B);
const s3 = await stored(), A3 = await st(A), B3 = await st(B);
ok(a3.dec && s3.settings.allergens.includes('egg') && s3.settings.allergens.includes('milk') && (s3.settings.avoid || []).includes('セロリ') && A3.menu === a3.menu && B3.menu === a3.menu && A3.dec && B3.dec && A3.alg === B3.alg && A3.avoid === B3.avoid,
    'T3 A で決めた献立と B で足した苦手が、保存にも両方のタブにも残り、両方で同じ: ' + JSON.stringify({ a3, A3, B3, saved: { alg: s3.settings.allergens, avoid: s3.settings.avoid } }));

// T4
await A.bringToFront(); await A.evaluate(() => { S.settings.allergens = algIds().filter(x => x !== 'egg'); save(); if (typeof saveNow === 'function') saveNow(); });
await A.waitForTimeout(300);
await B.evaluate(() => { S.settings.servings = 3; save(); if (typeof saveNow === 'function') saveNow(); }); await B.waitForTimeout(800);
await settle(A); await settle(B);
const s4 = await stored(), A4 = await st(A), B4 = await st(B);
ok(!s4.settings.allergens.includes('egg') && s4.settings.allergens.includes('milk') && s4.settings.servings === 3 && A4.alg === 'milk' && B4.alg === 'milk' && A4.sv === 3 && B4.sv === 3,
    'T4 A で外した卵のアレルギーは、古いままの B が保存してもよみがえらない。B の変更も残る: ' + JSON.stringify({ saved: { alg: s4.settings.allergens, sv: s4.settings.servings }, A4, B4 }));

// T5
await A.bringToFront(); await A.evaluate(() => { newMenu(); render(); }); await B.evaluate(() => { setTab('today'); newMenu(); render(); });
await A.evaluate(() => { const d = document.querySelector('[data-act="decide"]'); if (d) d.click(); });
await B.evaluate(() => { const d = document.querySelector('[data-act="decide"]'); if (d) d.click(); });
await A.waitForTimeout(1000); await settle(A); await settle(B);
let s5 = null; try{ s5 = await stored(); }catch(e){}
const A5 = await st(A), B5 = await st(B);
ok(!!s5 && A5.menu && A5.menu === B5.menu && A5.dec && B5.dec && A5.alg === B5.alg && A5.avoid === B5.avoid, 'T5 両方のタブでほぼ同時に決めても、保存は読めて、両方のタブの献立・決めた印・設定がそろう: ' + JSON.stringify({ A5, B5 }));

await b.close();
if (errs.length){ console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\ntab51: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
