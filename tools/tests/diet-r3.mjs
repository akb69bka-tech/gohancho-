#!/usr/bin/env node
// 食の決まり（第2班 第2回 R2-06・R2-14）の回帰テスト（Playwright。使い方: node tools/tests/diet-r3.mjs [http://localhost:8765/]）
//  1) 束ねたチップ（ハラール・ベジタリアン・ヴィーガン）: 押すと既存のなかまのチップの組み合わせに広げるだけ（ハラール=豚+お酒、ベジタリアン=豚鶏牛魚貝、ヴィーガン=＋卵乳）。
//     もう一度押すと外れる。選んだあとに個別のチップを足し引きできる（押した形の表示も合わせて変わる）。ほかの束に必要ななかまは外さない
//  2) 全21か国の全料理: 外した材料（苦手に当たって「入れない」になった材料）が、材料の一覧にも手順の文にも出ない。手順の文に「（入れない）」などの添え書きが残らない
//  3) 画面の言語18種: 同じ設定なら、どの言語でも入れない材料・出す料理・手順の文（飛ばす手順を除く）が同じ
//  4) 入口の配置: 195/360/390/430px × 文字3段階で、入口の3つは重ならず・画面の横からはみ出さず・押せる（高さ36px以上・押した点にそのボタンがある）
//  5) 言葉: 新しい文言に宗教や専門機関の判断を言う言葉（認証・認定・戒律 など）がない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const { SEED, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
const LANGS = ['ja','en','ar','de','es','fil','fr','hi','id','it','ko','pl','pt-BR','th','tr','vi','zh-Hans','zh-Hant'];
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let fails = 0, opened = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
async function open(cc = 'JP', settings = {}, vp = { width: 390, height: 844 }){
    const ctx = await b.newContext({ viewport: vp, serviceWorkers: 'block' }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('diet-r3', String(++opened))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(([cc, settings]) => { window.__swapDirect = true; if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({ foldOpen: {upg: true, tw: true, week: true}, onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: { country: cc, dishCount: 'auto', servings: 2, ...settings } })); } }, [cc, settings]);
    await p.goto(URL_); await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(150);
    await p.evaluate(() => { hasPro = () => true; });
    return { ctx, p };
}
const FAM = { halal: ['pork', 'alcohol'], vegi: ['pork', 'chicken', 'beef', 'fish', 'shellfish'], vegan: ['pork', 'chicken', 'beef', 'fish', 'shellfish', 'egg', 'dairy'] };
const MARKS = ['入れない', 'بدون', 'weglassen', 'leave out', 'omitir', 'huwag isama', 'à omettre', 'न डालें', 'tidak dipakai', 'da omettere', '넣지 않음', 'pomiń', 'ไม่ใส่', 'koymayın', 'bỏ qua', '不放'];
const openSettings = async p => {
    await p.evaluate(() => { setTab('settings'); });
    await p.waitForTimeout(250);
    await p.evaluate(() => { document.querySelectorAll('#view details').forEach(d => { if (d.querySelector('.diet-bundle')) { let e = d; while (e){ if (e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } } }); document.querySelectorAll('.avoid-more').forEach(d => { d.open = true; }); const e = document.querySelector('.diet-bundle'); if (e) e.scrollIntoView({block: 'center'}); });
    await p.waitForTimeout(150);
};
const famsNow = p => p.evaluate(() => [...new Set(S.settings.avoid.map(avoidFamOf).filter(Boolean))].sort());
const pressed = (p, k) => p.evaluate(k => { const e = document.querySelector(`.diet-bundle[data-v="${k}"]`); return e ? e.getAttribute('aria-pressed') : null; }, k);
const same = (a, b_) => JSON.stringify([...a].sort()) === JSON.stringify([...b_].sort());
const reset = async (p, list = []) => { await p.evaluate(l => { S.settings.avoid = l; save(); render(); }, list); await openSettings(p); };

// ---------- 1) 束ねたチップ ----------
{
    const { ctx, p } = await open('JP');
    await p.evaluate(() => { S.settings.allergens = []; });
    await reset(p);
    const n = await p.evaluate(() => document.querySelectorAll('.diet-bundle').length);
    ok(n === 3, `設定の苦手に束ねたチップが3つある: ${n}`);
    for (const k of ['halal', 'vegi', 'vegan']){
        await reset(p);
        await p.click(`.diet-bundle[data-v="${k}"]`); await p.waitForTimeout(200);
        ok(same(await famsNow(p), FAM[k]), `${k}: 押すと ${FAM[k].join('+')} に広げる（実際 ${await famsNow(p)}）`);
        ok(await pressed(p, k) === 'true', `${k}: 押した形になる`);
        if (k === 'vegan') ok(await pressed(p, 'vegi') === 'true', 'ヴィーガンはベジタリアンも含むので押した形');
        await openSettings(p);
        await p.click(`[data-act="toggle-avoid-fam"][data-v="${FAM[k][0]}"]`); await p.waitForTimeout(200);
        ok(!(await famsNow(p)).includes(FAM[k][0]) && await pressed(p, k) === 'false', `${k}: 個別のチップを外せる（${FAM[k][0]}）→ 束は押していない形`);
        await openSettings(p);
        await p.click(`[data-act="toggle-avoid-fam"][data-v="${FAM[k][0]}"]`); await p.waitForTimeout(200);
        ok(await pressed(p, k) === 'true', `${k}: 個別のチップを足すと、また束が押した形`);
        await openSettings(p);
        await p.click(`.diet-bundle[data-v="${k}"]`); await p.waitForTimeout(200);
        ok((await famsNow(p)).length === 0, `${k}: もう一度押すと外れる（${await famsNow(p)}）`);
    }
    await reset(p);
    await p.click('.diet-bundle[data-v="vegi"]'); await p.waitForTimeout(150); await openSettings(p);
    await p.click('.diet-bundle[data-v="vegan"]'); await p.waitForTimeout(150);
    ok(same(await famsNow(p), FAM.vegan), 'ベジタリアンのあとヴィーガンを押すと卵・乳が足される');
    await openSettings(p); await p.click('.diet-bundle[data-v="vegan"]'); await p.waitForTimeout(150);
    ok((await famsNow(p)).length === 0, 'ヴィーガンを押して外すと、全部外れる');
    await reset(p);
    await p.click('.diet-bundle[data-v="halal"]'); await p.waitForTimeout(150); await openSettings(p);
    await p.click('.diet-bundle[data-v="vegan"]'); await p.waitForTimeout(150); await openSettings(p);
    await p.click('.diet-bundle[data-v="halal"]'); await p.waitForTimeout(150);
    ok(same(await famsNow(p), FAM.vegan), `ハラール＋ヴィーガンからハラールを外すと、豚は残りお酒は外れる（${await famsNow(p)}）`);
    await reset(p, ['えび', 'ねぎ']);
    await p.click('.diet-bundle[data-v="vegi"]'); await p.waitForTimeout(150);
    const l = await p.evaluate(() => S.settings.avoid.slice());
    ok(l.includes('ねぎ') && !l.includes('えび') && l.includes('@shellfish'), `束を押しても関係ない食材（ねぎ）は残り、貝に入るえびは貝にまとまる: ${l}`);
    const cnt = await p.evaluate(() => { S.settings.avoid = ['@pork', '@alcohol']; const a = RECIPES.filter(r => r.items && !isAvoided(r)).map(r => r.id).join(); S.settings.avoid = dietBundleToggle([], 'halal'); const b = RECIPES.filter(r => r.items && !isAvoided(r)).map(r => r.id).join(); return a === b; });
    ok(cnt, 'ハラールの束の判定は、豚＋お酒のチップと同じ');
    const html = await p.evaluate(() => { S.settings.avoid = []; return avoidChipsHtml([], 'ob-avoid', 'ob-avoid-fam') + avoidChipsHtml([], 'fam-avoid', 'fam-avoid-fam', false); });
    ok((html.match(/data-act="ob-avoid-diet"/g) || []).length === 3 && (html.match(/data-act="fam-avoid-diet"/g) || []).length === 3, 'はじめての設定・家族の苦手にも束がある');
    await ctx.close();
}

// ---------- 2) 全21か国の全料理 ----------
{
    let tot = 0, withOmit = 0, steps = 0, skipped = 0;
    for (const cc of CCS){
        const { ctx, p } = await open(cc, { avoidSwap: true });
        const r = await p.evaluate(([FAMS, MARKS]) => {
            S.settings.allergens = []; const o = { n: 0, withOmit: 0, steps: 0, skipped: 0, bad: [] };
            const sets = Object.keys(AVOID_FAM).map(f => [f]).concat(FAMS);
            const mk = new RegExp('[（(](?:' + MARKS.join('|') + ')[)）]|\\u0003');
            const skipTxt = t('この手順は、入れない材料のぶんなので飛ばせます');
            for (const fs of sets){
                S.settings.avoid = fs.map(f => '@' + f);
                RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id)).forEach(x => {
                    if (isAvoided(x) || allergyConflict(x)) return; o.n++;
                    const sw = swappedRecipe(x); if (!sw || !sw.swapped) return;
                    const om = sw.swapped.omit || []; if (!om.length) return; o.withOmit++;
                    const tx = (sw.steps || []).map(s => typeof s === 'string' ? s : s.t);
                    if (tx.length !== (x.steps || []).length) o.bad.push(x.id + ' 手順の数が変わった');
                    tx.forEach((s, i) => { o.steps++; if (s === skipTxt) o.skipped++; if (mk.test(s)) o.bad.push(fs.join() + ' ' + x.id + ' #' + (i + 1) + ' 添え書きが残る: ' + s.slice(0, 70)); if (!String(s).trim()) o.bad.push(x.id + ' 空の手順'); });
                    om.forEach(i => { if (sw.items.some(j => j.key === i.key && j.name === i.name)) o.bad.push(fs.join() + ' ' + x.id + ' 材料に残る: ' + i.name); });
                    const keepNames = sw.items.flatMap(j => [j.name, j.label, j.key, j.en]).filter(Boolean).map(z => String(z).toLowerCase());
                    om.forEach(i => { [i.name, i.label, i.key].filter(z => z && String(z).length > 1).forEach(z => { const zl = String(z).toLowerCase(); if (keepNames.some(kn => kn.includes(zl))) return;
                        const re = /^[a-zà-ÿ]/i.test(zl) ? new RegExp('(?<![\\p{L}])' + zl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}])', 'iu') : null;
                        tx.forEach((s, k) => { if (s === skipTxt) return; if (re ? re.test(s) : String(s).toLowerCase().includes(zl)) o.bad.push(fs.join() + ' ' + x.id + ' #' + (k + 1) + ' 入れない「' + z + '」が手順に出る: ' + s.slice(0, 80)); }); }); });
                });
            }
            return o; }, [Object.values(FAM), MARKS]);
        tot += r.n; withOmit += r.withOmit; steps += r.steps; skipped += r.skipped;
        ok(r.bad.length === 0, `${cc}: ${r.bad.length}件 ${r.bad.slice(0, 3).join(' / ')}`);
        await ctx.close();
    }
    console.log(`全21か国: 見た料理（のべ）${tot}・入れない材料がある料理 ${withOmit}・見た手順 ${steps}・飛ばす手順 ${skipped}`);
    ok(withOmit > 100, `入れない材料がある料理を十分に見ている: ${withOmit}`);
}

// ---------- 3) 画面の言語18種で同じ ----------
{
    // (a) 置き換えを切って比べる（材料のキー・元の言葉だけで決まる）: 日本・イギリス・タイ × 18言語 × 3つの束
    for (const cc of ['JP', 'GB', 'TH']){
        const base = {};
        for (const lang of LANGS){
            const { ctx, p } = await open(cc, { uiLang: lang, avoidSwap: false });
            const r = await p.evaluate(SETS => { const o = {}; S.settings.allergens = [];
                for (const [k, fs] of Object.entries(SETS)){ S.settings.avoid = dietBundleToggle([], k); o[k] = RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id) && !isAvoided(x)).map(x => x.id).join(','); o[k + '_may'] = RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id) && !isAvoided(x) && dietMayHits(x).length).map(x => x.id).join(','); }
                return o; }, FAM);
            if (lang === LANGS[0]) Object.assign(base, r); else for (const k of Object.keys(r)) ok(r[k] === base[k], `${cc} ${lang}: ${k} の出す料理が ${LANGS[0]} と違う`);
            await ctx.close();
        }
    }
    // (b) 置き換えをする料理: 入れない材料・手順の数が18言語で同じ。どの言語でも手順に添え書き（「（入れない）」の各言語）・印が残らない（手順の文は画面の言語に訳されるので、文そのものは比べない）
    for (const cc of ['JP', 'GB', 'FR', 'TH', 'MX']){
        const base = {};
        for (const lang of LANGS){
            const { ctx, p } = await open(cc, { uiLang: lang, avoidSwap: true });
            const r = await p.evaluate(([SETS, MARKS]) => { const o = {}; S.settings.allergens = []; const mk = new RegExp('[（(](?:' + MARKS.join('|') + ')[)）]|\\u0003'); let bad = 0, ex = '';
                for (const k of Object.keys(SETS)){ S.settings.avoid = dietBundleToggle([], k);
                    o[k] = RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id) && !isAvoided(x)).map(x => { const sw = swappedRecipe(x) || x; const tx = (sw.steps || []).map(s => (typeof s === 'string' ? s : s.t)); tx.forEach(s => { if (mk.test(s) || !String(s).trim()){ bad++; ex = s; } }); return x.id + ':' + ((sw.swapped && sw.swapped.omit) || []).map(i => i.key).join('+') + ':' + tx.length; }).join(','); }
                o.bad = bad; o.ex = ex; return o; }, [FAM, MARKS]);
            ok(r.bad === 0, `${cc} ${lang}: 手順に添え書き・印・空の手順が ${r.bad} か所 ${String(r.ex).slice(0, 60)}`);
            if (cc === 'JP') { /* 日本の料理の置き換えは、代わりの食材の候補（swapPool）が画面の言語で決まる既存のしくみ。ここでは添え書きだけ見る */ } else if (lang === LANGS[0]) Object.assign(base, r); else for (const k of Object.keys(FAM)) ok(r[k] === base[k], `${cc} ${lang}: ${k} の入れない材料・手順の数が ${LANGS[0]} と違う`);
            await ctx.close();
        }
    }
}

// ---------- 4) 入口の配置 ----------
{
    for (const [w, h] of [[195, 422], [360, 740], [390, 844], [430, 932]]){
        for (const ts of [0, 1, 2]){
            const { ctx, p } = await open('JP', ts ? { textSize: ts } : {}, { width: w, height: h });
            await p.evaluate(() => { S.settings.avoid = []; save(); });
            await openSettings(p);
            const r = await p.evaluate(() => {
                const bs = [...document.querySelectorAll('.diet-bundle')], rs = bs.map(e => e.getBoundingClientRect()), out = [];
                if (bs.length !== 3) out.push('個数 ' + bs.length);
                rs.forEach((a, i) => { if (a.right > innerWidth + 0.5 || a.left < -0.5) out.push(`横にはみ出す #${i} (${Math.round(a.left)}-${Math.round(a.right)})`); if (a.height < 36) out.push(`低い #${i} (${Math.round(a.height)}px)`); if (a.width < 40) out.push(`細い #${i}`);
                    rs.forEach((c, j) => { if (j > i && a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) out.push(`重なる #${i}/#${j}`); }); });
                bs.forEach((e, i) => { e.scrollIntoView({block: 'center'}); const a = e.getBoundingClientRect(), hit = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2); if (!hit || !(hit === e || e.contains(hit))) out.push(`押せない #${i}`); if (e.scrollWidth > e.clientWidth + 1) out.push(`文字が切れる #${i}`); });
                if (document.documentElement.scrollWidth > innerWidth + 1) out.push('画面が横にスクロールする ' + document.documentElement.scrollWidth);
                return out; });
            ok(r.length === 0, `${w}px 文字${ts}: ${r.join(' / ')}`);
            await ctx.close();
        }
    }
}

// ---------- 5) 言葉 ----------
{
    const src = fs.readFileSync(new URL('../../gohancho/index.html', import.meta.url), 'utf8');
    const blk = src.slice(src.indexOf('const DIET_BUNDLES'), src.indexOf('// 苦手のチップ: 「なかまでまとめて」'));
    const strs = (blk.match(/t\('[^']*'\)/g) || []).join(' ');
    const bad = strs.match(/認証|認定|戒律|イスラム|宗教|教義|保証します|安全です|certif/i);
    ok(!bad, '新しい文言に宗教・認証の言葉がある: ' + (bad || [''])[0]);
    ok(/保証ではありません/.test(strs), '「保証ではありません」の一言がある');
}

console.log(errs.length ? '実行時エラー ' + errs.slice(0, 5).join(' | ') : '実行時エラーなし');
ok(errs.length === 0, '実行時エラー');
await b.close();
console.log(fails ? `NG ${fails}件` : 'OK diet-r3');
process.exit(fails ? 1 : 0);
