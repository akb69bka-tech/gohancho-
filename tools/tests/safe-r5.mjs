#!/usr/bin/env node
// 安全 第5回（R126・R127・R128）の回帰テスト（Playwright。使い方: node tools/tests/safe-r5.mjs [http://localhost:8765/]）
//  1) R126: 「まとめて選ぶ」を押して、もう一度押して戻しても、押す前に自分で選んでいた苦手は外れない（束が足したぶんだけ外れる）。
//     設定（画面のボタン）・はじめての設定・家族の苦手の3か所。個別のチップを触ったときの束の見た目（全部そろえば押した形）は変わらない
//  2) R127: 日本でベジ/ヴィーガンのとき、材料欄が顆粒昆布だしに替わる料理の手順にも「鶏ガラ」が残らない。手順の数は変えない。他国は鶏の言葉の取り違え以外に残らない
//  3) R128: 名前が肉の料理（肉じゃが・回鍋肉・青椒肉絲・冷しゃぶサラダ・かつ丼）は、豆腐に替える人（ベジ/ヴィーガン）に出さない。ハラールは従来どおり
//  4) 判定は画面の言語に依らない（18言語で同じ）。新しい文言に宗教や認証の断言語がない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const { SEED, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
const LANGS = ['ja','en','ar','de','es','fil','fr','hi','id','it','ko','pl','pt-BR','th','tr','vi','zh-Hans','zh-Hant'];
const FAM = { halal: ['pork', 'alcohol'], vegi: ['pork', 'chicken', 'beef', 'fish', 'shellfish'], vegan: ['pork', 'chicken', 'beef', 'fish', 'shellfish', 'egg', 'dairy'] };
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let fails = 0, opened = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
async function open(cc = 'JP', settings = {}, lang){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', ...(lang ? { locale: lang } : {}) }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('safe-r5', String(++opened))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(([cc, settings, lang]) => { window.__swapDirect = true; if (lang) try { localStorage.setItem('gohancho.lang', lang); } catch (e) {} if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({ foldOpen: {}, onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: { country: cc, dishCount: 'auto', servings: 2, avoidSwap: true, ...settings } })); } }, [cc, settings, lang]);
    await p.goto(URL_); await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(150);
    await p.evaluate(() => { hasPro = () => true; });
    return { ctx, p };
}
const sorted = a => JSON.stringify([...a].sort());

// ---------- 1) R126 ----------
{
    const { ctx, p } = await open('JP');
    // (a) 設定の画面のボタン
    const openSettings = async () => { await p.evaluate(() => { setTab('settings'); setTabShow('food'); }); await p.waitForTimeout(250);   // 設定はタブ分け（11/09）。苦手な食材は「苦手・食の決まり」のタブの中（ほかのタブを開いていると hidden で押せない）

        await p.evaluate(() => { document.querySelectorAll('#view details').forEach(d => { if (d.querySelector('.diet-bundle')) { let e = d; while (e){ if (e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } } }); document.querySelectorAll('.avoid-more').forEach(d => { d.open = true; }); const e = document.querySelector('.diet-bundle'); if (e) e.scrollIntoView({block: 'center'}); }); await p.waitForTimeout(150); };
    const avoidNow = () => p.evaluate(() => S.settings.avoid.slice());
    for (const k of ['halal', 'vegi', 'vegan']){
        for (const own of [['@pork'], ['@beef'], ['@pork', '@chicken', '@beef', '@fish'], ['@fish', '@egg'], ['@alcohol', '@dairy'], []]){
            await p.evaluate(l => { S.settings.avoid = l; S.settings.allergens = []; save(); render(); }, own);
            await openSettings();
            await p.click(`.diet-bundle[data-v="${k}"]`); await p.waitForTimeout(150);
            const on = await p.evaluate(k => document.querySelector(`.diet-bundle[data-v="${k}"]`).getAttribute('aria-pressed'), k);
            ok(on === 'true', `${k}+${own}: 押すと押した形`);
            await openSettings();
            await p.click(`.diet-bundle[data-v="${k}"]`); await p.waitForTimeout(150);
            ok(sorted(await avoidNow()) === sorted(own), `設定 ${k}: 先に選んだ ${own} が戻したあとも同じ（実際 ${await avoidNow()}）`);
        }
        // 自分の個別チップで束がそろった状態から押すと全部外れる（仕様）
        await p.evaluate(l => { S.settings.avoid = l; save(); render(); }, FAM[k].map(f => '@' + f));
        await openSettings(); await p.click(`.diet-bundle[data-v="${k}"]`); await p.waitForTimeout(150);
        ok((await avoidNow()).length === 0, `設定 ${k}: 自分でそろえた形から1回押すと外れる（仕様）`);
    }
    // 外したあと個別に触ってから束を押し直しても、先に選んでいたものは残る
    await p.evaluate(() => { S.settings.avoid = ['@pork']; save(); render(); }); await openSettings();
    await p.click('.diet-bundle[data-v="vegan"]'); await p.waitForTimeout(150); await openSettings();
    await p.click('[data-act="toggle-avoid-fam"][data-v="egg"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => document.querySelector('.diet-bundle[data-v="vegan"]').getAttribute('aria-pressed')) === 'false', '個別に外すと束は押していない形');
    await openSettings(); await p.click('[data-act="toggle-avoid-fam"][data-v="egg"]'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => document.querySelector('.diet-bundle[data-v="vegan"]').getAttribute('aria-pressed')) === 'true', '個別に足し直すと束は押した形');
    await openSettings(); await p.click('.diet-bundle[data-v="vegan"]'); await p.waitForTimeout(150);
    ok(sorted(await avoidNow()) === sorted(['@pork']) || (await avoidNow()).length === 0, `個別に触ったあとに外しても先の豚は残るか全部外れる（実際 ${await avoidNow()}）`);
    // 束が個別の苦手（豚バラ）を取り込んだぶんは、外すと戻る
    await p.evaluate(() => { S.settings.avoid = ['豚バラ']; save(); render(); }); await openSettings();
    await p.click('.diet-bundle[data-v="halal"]'); await p.waitForTimeout(150); await openSettings();
    await p.click('.diet-bundle[data-v="halal"]'); await p.waitForTimeout(150);
    ok(sorted(await avoidNow()) === sorted(['豚バラ']), `束に取り込まれた個別の苦手（豚バラ）も戻る（実際 ${await avoidNow()}）`);
    // (b) はじめての設定・家族の苦手（関数と呼び出しの引数）
    const r = await p.evaluate(() => {
        const out = {};
        const sheet = {avoid: new Set(['@pork', '@fish'])}, m = {avoid: ['@beef'], allergy: []};
        let a = dietBundleToggle([...sheet.avoid], 'vegan', sheet); out.sheetOn = a.slice(); a = dietBundleToggle(a, 'vegan', sheet); out.sheet = a;
        let c = dietBundleToggle(m.avoid, 'vegi', m); out.memOn = c.slice(); c = dietBundleToggle(c, 'vegi', m); out.mem = c;
        // 別のオーナーの記録は混ざらない
        const o1 = {}, o2 = {}; let x = dietBundleToggle(['@pork'], 'vegi', o1), y = dietBundleToggle([], 'vegi', o2); y = dietBundleToggle(y, 'vegi', o2); x = dietBundleToggle(x, 'vegi', o1); out.o1 = x; out.o2 = y;
        return out; });
    ok(sorted(r.sheet) === sorted(['@pork', '@fish']), `はじめての設定: 先の豚・魚が残る（${r.sheet}）`);
    ok(sorted(r.sheetOn) === sorted(FAM.vegan.map(f => '@' + f)), `はじめての設定: 押すとヴィーガンの形（${r.sheetOn}）`);
    ok(sorted(r.mem) === sorted(['@beef']), `家族の苦手: 先の牛が残る（${r.mem}）`);
    ok(sorted(r.o1) === sorted(['@pork']) && r.o2.length === 0, `オーナーごとに別（${r.o1} / ${r.o2}）`);
    const src = fs.readFileSync(new URL('../../gohancho/index.html', import.meta.url), 'utf8');
    ok(/dietBundleToggle\(S\.settings\.avoid, el\.dataset\.v, S\.settings\)/.test(src) && /dietBundleToggle\(m\.avoid, el\.dataset\.v, m\)/.test(src) && /dietBundleToggle\(\[\.\.\.sheet\.avoid\], el\.dataset\.v, sheet\)/.test(src), '3か所の呼び出しがオーナーを渡している');
    await ctx.close();
}

console.log('--- 2) R127');
// ---------- 2) R127 手順の「鶏ガラ」 ----------
{
    const { ctx, p } = await open('JP');
    for (const k of ['vegi', 'vegan']){
        const r = await p.evaluate(([f]) => { S.settings.avoid = f.map(x => '@' + x); S.settings.allergens = []; const bad = [], n = { shown: 0, swapped: 0 };
            RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id)).forEach(x => { if (isAvoided(x) || allergyConflict(x)) return; n.shown++;
                const sw = swappedRecipe(x) || x, tx = (sw.steps || []).map(s => seasSwapText(typeof s === 'string' ? s : s.t, x));
                if (tx.length !== (x.steps || []).length) bad.push(x.id + ' 手順の数');
                if (/鶏ガラ/.test(seasFor(sw) || '')) bad.push(x.id + ' 調味料に鶏ガラ');
                tx.forEach(s => { if (/鶏ガラ/.test(s)) bad.push(x.id + ' ' + s.slice(0, 40)); if (!String(s).trim()) bad.push(x.id + ' 空'); });
                if (/鶏ガラ/.test(String(x.seas || ''))) n.swapped++; });
            const t1 = seasSwapText('水と鶏ガラを煮立て、鶏ガラスープの素を足す。葉を加え、鶏ガラと塩で味をつける。', RECIPES.find(x => x.id === 'tomatoeggsoup'));
            return { bad, n, t1 }; }, [FAM[k]]);
        ok(r.bad.length === 0, `JP ${k}: ${r.bad.length}件 ${r.bad.slice(0, 4).join(' / ')}`);
        ok(r.n.swapped >= 8, `JP ${k}: 調味料に鶏ガラの料理が見えている（${r.n.swapped}）`);
        ok(r.t1 === '水と顆粒昆布だしを煮立て、顆粒昆布だしを足す。葉を加え、顆粒昆布だしと塩で味をつける。', `JP ${k}: 言い方が置き換わる（${r.t1}）`);
    }
    // 鶏が苦手でない人・置き換えオフには、鶏ガラのまま
    const keep = await p.evaluate(() => { S.settings.avoid = ['@pork']; const a = seasSwapText('水と鶏ガラを煮立て', RECIPES.find(x => x.id === 'tomatoeggsoup')); S.settings.avoid = ['@chicken']; S.settings.avoidSwap = false; const b2 = seasSwapText('水と鶏ガラを煮立て', RECIPES.find(x => x.id === 'tomatoeggsoup')); S.settings.avoidSwap = true; return [a, b2]; });
    ok(keep[0] === '水と鶏ガラを煮立て' && keep[1] === '水と鶏ガラを煮立て', `鶏が苦手でないとき・置き換えオフでは変えない（${keep}）`);
    await ctx.close();
    // 他の国: 鶏の言葉が手順に残らない（材料にもない・名前にもないとき。中国の「鸡蛋」・ヒンディ語の「चिकन＝なめらか」・インドネシアの「〜の代わりに」は語の取り違え）
    const CH = /鶏|鸡肉|鸡汤|雞肉|닭|chicken|poulet|pollo|Hühn|Hähn|frango|ไก่|tavuk|kurczak|manok|\bayam\b/i, SKIP = /鸡蛋|menggantikan|ayam/i;
    for (const cc of CCS.filter(c => c !== 'JP')){
        const { ctx: c2, p: p2 } = await open(cc);
        const r = await p2.evaluate(([f, src]) => { const rx = new RegExp(src, 'i'); const bad = []; S.settings.avoid = f.map(x => '@' + x);
            RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id)).forEach(x => { if (isAvoided(x) || allergyConflict(x)) return; const sw = swappedRecipe(x) || x;
                const kept = (sw.items || []).map(j => [j.name, j.label, j.key, j.en].join('|')).join('||') + ' ' + (seasFor(sw) || '') + ' ' + sw.name;
                (sw.steps || []).map(s => seasSwapText(typeof s === 'string' ? s : s.t, x)).forEach(s => { if (rx.test(s) && !rx.test(kept)) bad.push(x.id + ' ' + s.slice(0, 50)); }); });
            return bad; }, [FAM.vegi, CH.source]);
        const real = r.filter(s => !SKIP.test(s));
        ok(real.length === 0, `${cc} vegi: 鶏の言葉が手順に残る ${real.slice(0, 3).join(' / ')}`);
        await c2.close();
    }
}

console.log('--- 3) R128');
// ---------- 3) R128 名前が肉の料理 ----------
{
    const { ctx, p } = await open('JP');
    const IDS = ['nikujaga', 'hoikoro', 'chinjao', 'reishabu', 'katsudon'];
    for (const k of ['vegi', 'vegan', 'halal']){
        const r = await p.evaluate(([f, ids]) => { S.settings.avoid = f.map(x => '@' + x); S.settings.allergens = []; const o = {}; ids.forEach(id => { const x = RECIPES.find(y => y.id === id); o[id] = !x ? 'missing' : (isAvoided(x) || allergyConflict(x)) ? 'avoided' : 'shown'; });
            const tofuMeaty = RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id) && !isAvoided(x) && !allergyConflict(x) && /肉|しゃぶ|カツ|かつ(?!お|ぶし)/.test(x.name) && ((swappedRecipe(x) || {}).swapped || {swaps: []}).swaps.some(s => s.to.key === '豆腐' || /豆腐/.test(s.to.name))).map(x => x.id);
            return { o, tofuMeaty }; }, [FAM[k], IDS]);
        if (k === 'halal') ok(r.tofuMeaty.length === 0, `ハラール: 名前が肉のまま豆腐になる料理がない（${r.tofuMeaty}）`);   // 豚の料理は以前から出さない（この回で変えていない）
        else { IDS.forEach(id => ok(r.o[id] === 'avoided', `${k}: ${id} は出さない（${r.o[id]}）`)); ok(r.tofuMeaty.length === 0, `${k}: 名前が肉のまま豆腐になる料理がない（${r.tofuMeaty}）`); }
    }
    // 苦手がなければ全部出る
    const none = await p.evaluate(ids => { S.settings.avoid = []; return ids.map(id => isAvoided(RECIPES.find(y => y.id === id))); }, IDS);
    ok(none.every(x => x === false), '苦手がなければ全部出る');
    await ctx.close();
}

console.log('--- 4) 言語');
// ---------- 4) 言語に依らない・言葉 ----------
{
    let base = null;
    for (const L of ['ja','en','ar','ko','vi','zh-Hans']){   // 画面の言語は6種で見る（判定は言語を読まない）
        const { ctx, p } = await open('JP', {}, L);
        const r = await p.evaluate(([f]) => { S.settings.avoid = f.map(x => '@' + x); S.settings.allergens = []; return RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id)).map(x => (isAvoided(x) || allergyConflict(x) ? 'x' : 'o') + x.id + ((swappedRecipe(x) || x).steps || []).map(s => seasSwapText(typeof s === 'string' ? s : s.t, x)).filter(s => /鶏ガラ/.test(s)).length).join(','); }, [FAM.vegi]);
        if (base === null) base = r; else ok(r === base, `${L}: 出す料理・手順が ja と同じ`);
        await ctx.close();
    }
    const src = fs.readFileSync(new URL('../../gohancho/index.html', import.meta.url), 'utf8');
    const a = src.indexOf('const DIET_ADDED'), e = src.indexOf('function dietBundleHtml');
    ok(!/認証|認定|戒律|halal certified|certified|宗教/i.test(src.slice(a, e)), '新しいコードの言葉に宗教や認証の断言がない');
}
await b.close();
if (errs.length){ fails += errs.length; console.log('ページエラー', errs.slice(0, 5)); }
console.log(fails ? `NG: ${fails}件` : 'OK: safe-r5');
process.exit(fails ? 1 : 0);
