#!/usr/bin/env node
// 第51回（offen）: ハラール・ベジタリアン・ヴィーガンで、ほかの国の料理（世界のレシピ・料理名から）を開くと、
//   当たる「なくても可」の材料（ベーコン・ハム・パルメザンなど）が材料の欄にそのまま並んでいた（いまの国の料理なら「〜は入れません」と出る）
//  使い方: node tools/tests/diet-r6.mjs [http://localhost:9291/]
//  R1 世界のレシピから開く（国は日本、ほかの国の料理）: 当たる材料が材料の欄に出ず、「〜は入れません（なくても作れます）」と「手順の文に出てきても入れないでください。」が出る
//     （ハラール: アメリカのコーンチャウダーのベーコン、ベジ: ベイクドポテトのベーコン、ヴィーガン: ブロッコリーのパルメザン）。英語の画面でも同じ（訳で出る）
//  R2 料理名からのタブと同じ開き方（カードの data-act="open" → openModal）: ほかの国の料理すべてで、当たる なくても可の材料が swappedRecipe の材料に残らない。
//     外す材料のない料理は、そのまま（同じもの）を返す
//  R3 いまの国の料理の出方は前と同じ: 「手順の文に…」は出さない。置き換えの印（other）も付けない
//  R4 アレルギーの判定は変えない: 豚のアレルギー（苦手ではない）では、ベーコンが なくても可の料理も出さない（isAvoided）。材料も外さない（判定で出さないので開かない）
//  R5 開いても、決めた献立は変わらない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const HALAL = ['@pork', '@alcohol'], VEGI = ['@pork', '@chicken', '@beef', '@fish', '@shellfish'], VEGAN = VEGI.concat(['@egg', '@dairy']);
const open = async (st, lg = 'ja', cc = 'JP') => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        { onboarded: true, firstUse: '2020-01-01', settings: Object.assign({ country: cc, uiLang: lg, dishCount: 3, servings: 2 }, st), family: [] });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, { timeout: 30000 });
    return { p, ctx };
};
// 世界のレシピのタブで国を選び、その料理を開く（並びの先に出ていなければ「すべて見る」を押す）
const openFromWorld = async (p, cc, id) => {
    await p.click('nav.tabs button[data-tab="world"]');
    await p.click(`[data-act="world-cc"][data-cc="${cc}"]`);
    await p.waitForFunction(cc => BROWSE[cc] && document.querySelector(`#view .world-sec[data-cc="${cc}"]`), cc, { timeout: 30000 });
    const sel = `#view [data-act="open"][data-id="${id}"]`;
    // 並びは少しずつ描かれる（先に出す分のあと、残りをあとから足す）ので、待ちながら「すべて見る」を押す
    for (let i = 0; i < 20 && !(await p.$(sel)); i++){ const more = await p.$$('#view [data-act="world-all"]'); if (more.length) await more[0].click(); await p.waitForTimeout(400); }
    const el = await p.$(sel); if (!el) return false;
    await el.scrollIntoViewIfNeeded(); await el.click();
    await p.waitForSelector('#modal-root [role="dialog"]', { timeout: 10000 });
    await p.waitForTimeout(300);
    return true;
};
const modalInfo = p => p.evaluate(() => { const m = document.querySelector('#modal-root'); const note = m.querySelector('.swap-note'); return { note: note ? note.innerText : '', all: m.innerText }; });
const ingText = (p, id) => p.evaluate(id => { const r = swappedRecipe(byId(id)); return r.items.map(i => i.name).join('、'); }, id);

// R1 世界のレシピから開く
for (const [nm, avoid, cc, id, word, lg] of [['ハラール', HALAL, 'US', 'us_cornchowder', /ベーコン/, 'ja'], ['ベジタリアン', VEGI, 'US', 'us_bakedpotato', /ベーコン/, 'ja'], ['ヴィーガン', VEGAN, 'US', 'us_broccoli', /パルメザン/, 'ja'],
    ['ハラール（英語）', HALAL, 'GB', 'gb_cabbage', /bacon/i, 'en'], ['ベジタリアン（英語）', VEGI, 'FR', 'fr_poiscasses', /lardon|bacon/i, 'en']]){
    const { p, ctx } = await open({ avoid }, lg);
    const opened = await openFromWorld(p, cc, id);
    const m = opened ? await modalInfo(p) : { note: '', all: '' };
    const items = opened ? await ingText(p, id) : '';
    const omitted = await p.evaluate(id => { const r = byId(id); const c = avoidCtx(); return r ? r.items.filter(i => i.opt && itemAvoided(i, c)).map(i => i.name) : []; }, id);
    const noteOk = lg === 'ja' ? /は入れません（なくても作れます）/.test(m.note) && /手順の文に出てきても入れないでください。/.test(m.note)
        : /Leave out/.test(m.note) && /Even if the steps mention it, leave it out\./.test(m.note);
    ok(opened && omitted.length && !omitted.some(n => items.includes(n)) && noteOk && omitted.every(n => m.note.includes(n)),
        `R1 ${nm}: 世界のレシピから開くと、当たる なくても可の材料（${omitted.join('・')}）が材料の欄に出ず、案内が出る: ` + JSON.stringify({ opened, items, note: m.note.slice(0, 200) }));
    // 画面の材料の欄（.recipe-ings）の行にも名前が出ない（手順の文は元のまま。案内で「入れないでください」と言う）
    const rows = await p.evaluate(() => [...document.querySelectorAll('#modal-root .recipe-ings li')].map(e => e.innerText));
    const leftInList = rows.filter(t => omitted.some(n => t.includes(n)));
    ok(opened && rows.length > 0 && !leftInList.length, `R1 ${nm}: 画面の材料の欄の行に、外した材料が出ない: ` + JSON.stringify({ rows: rows.length, leftInList }));
    await ctx.close();
}
// R2 料理名からのタブと同じ開き方（関数単位）・全部の料理
for (const [nm, avoid] of [['ハラール', HALAL], ['ベジタリアン', VEGI], ['ヴィーガン', VEGAN]]){
    const { p, ctx } = await open({ avoid });
    const r = await p.evaluate(async () => {
        await Promise.all(COUNTRIES.filter(c => c.cc !== currentCountry()).map(c => loadBrowse(c.cc)));
        const c = avoidCtx(); let n = 0, left = [], noNote = [], same = 0, tot = 0, stepsChanged = 0;
        COUNTRIES.forEach(x => (BROWSE[x.cc] || []).forEach(r => {
            if (RECIPES.includes(r) || isAvoidedCore(r)) return;
            const o = r.items.filter(i => i.opt && itemAvoided(i, c)), s = swappedRecipe(r);
            if (!o.length){ tot++; if (s === r) same++; return; }
            n++;
            if (s.items.some(i => o.includes(i))) left.push(r.id);
            if (!s.swapped || !s.swapped.other || !swapNoteHtml(s).includes(esc(t('手順の文に出てきても入れないでください。')))) noNote.push(r.id);
            if (s.steps !== r.steps) stepsChanged++;
        }));
        // カードを押したときと同じ開き方（openModal）で1品開いて、材料の欄を見る
        const id = (BROWSE.US || []).map(r => r.id).find(id => { const r = byId(id); return !isAvoidedCore(r) && r.items.some(i => i.opt && itemAvoided(i, c)); });
        openModal(id); await new Promise(res => setTimeout(res, 300));
        const om = byId(id).items.filter(i => i.opt && itemAvoided(i, c)).map(i => i.name);
        const rows = [...document.querySelectorAll('#modal-root .recipe-ings li')].map(e => e.innerText), note = (document.querySelector('#modal-root .swap-note') || {}).innerText || '';
        const listed = rows.length ? rows.filter(l => om.some(n => l.includes(n))) : ['材料の欄がない'];
        if (!om.every(n => note.includes(n))) listed.push('案内に名前がない: ' + note.slice(0, 80));
        return { n, left, noNote, same, tot, stepsChanged, id, listed };
    });
    ok(r.n > 10 && !r.left.length && !r.noNote.length, `R2 ${nm}: ほかの国の料理（${r.n}品）で、当たる なくても可の材料が残らず、案内が付く: ` + JSON.stringify({ left: r.left.slice(0, 5), noNote: r.noNote.slice(0, 5) }));
    ok(r.same === r.tot && r.stepsChanged === 0, `R2 ${nm}: 外す材料のない料理（${r.tot}品）はそのまま、手順の文は変えない: ` + JSON.stringify({ same: r.same, tot: r.tot, stepsChanged: r.stepsChanged }));
    ok(r.id && !r.listed.length, `R2 ${nm}: カードと同じ開き方（openModal）で開いても、外した材料は材料の欄に出ず、案内に出る: ` + JSON.stringify({ id: r.id, listed: r.listed.slice(0, 3) }));
    await ctx.close();
}
// R3 いまの国の料理は前と同じ
{
    const { p, ctx } = await open({ avoid: HALAL }, 'ja', 'US');
    const r = await p.evaluate(() => { const bad = []; RECIPES.forEach(r => { const s = swappedRecipe(r); if (s && s.swapped && s.swapped.other) bad.push(r.id); }); return { bad, n: RECIPES.filter(r => swappedRecipe(r) !== r).length }; });
    ok(!r.bad.length && r.n > 0, 'R3 いまの国（アメリカ）の料理は、前と同じ置き換え（「手順の文に…」の印を付けない）: ' + JSON.stringify(r));
    // いまの国の料理を開いても「手順の文に…」は出ない
    const id = await p.evaluate(() => { const c = avoidCtx(); const r = RECIPES.find(r => !isAvoidedCore(r) && r.items.some(i => i.opt && itemAvoided(i, c))); return r && r.id; });
    await p.evaluate(id => openModal(id), id); await p.waitForTimeout(300);
    const m = await modalInfo(p);
    ok(id && /は入れません/.test(m.note) && !/手順の文に出てきても/.test(m.note), 'R3 いまの国の料理を開くと、前と同じ案内（手順の文からも外す・一言は足さない）: ' + JSON.stringify({ id, note: m.note.slice(0, 160) }));
    await ctx.close();
}
// R4 アレルギーの判定は変えない
{
    const { p, ctx } = await open({ allergens: ['pork'] });
    const r = await p.evaluate(async () => { await loadBrowse('US'); const x = byId('us_cornchowder'); return { avoided: isAvoided(x), same: swappedRecipe(x) === x }; });
    ok(r.avoided && r.same, 'R4 豚のアレルギー: ベーコンが なくても可の料理も出さない（材料を外して出すことはしない）: ' + JSON.stringify(r));
    await ctx.close();
}
// R5 決めた献立は変わらない
{
    const { p, ctx } = await open({ avoid: HALAL });
    await p.waitForTimeout(800); await p.click('[data-act="decide"]'); await p.waitForTimeout(600);
    const snap = () => p.evaluate(() => JSON.stringify({ menu: session.menu && session.menu.items.map(x => x.r && x.r.id), dec: menuIsDecided(), s: (() => { const s = JSON.parse(localStorage.getItem('gohancho.v1')); return [s.cook, s.draft, s.week, s.history && s.history.length]; })() }));
    const s0 = await snap();
    const opened = await openFromWorld(p, 'US', 'us_cornchowder');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await p.click('nav.tabs button[data-tab="today"]'); await p.waitForTimeout(400);
    const s1 = await snap();
    ok(opened && s0 === s1 && JSON.parse(s0).dec, 'R5 ほかの国の料理を開いて閉じても、決めた献立は変わらない: ' + JSON.stringify({ opened, s0, s1 }));
    await ctx.close();
}
await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\ndiet-r6: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
