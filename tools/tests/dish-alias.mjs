#!/usr/bin/env node
// 料理の別名と声の逆引きのテスト（Playwright。使い方: node tools/tests/dish-alias.mjs [http://localhost:8765/]）
//  1) 料理をさがす: 「ニラトン」「にらとん」「ニラ豚」「豚ニラ」「にらぶた」「ニラ豚炒め」でニラ豚炒め、「ニラレバ」でレバニラ炒め、「ニラたま」でニラ玉が先頭に出る
//  2) 声で入力（材料の欄）: 料理の名前（ニラトン）を言うと、ニラを冷蔵庫に入れずに「料理をさがす」でその料理を出す。食材の名前（なす）はこれまでどおり冷蔵庫に入れる
//  3) 声で入力（さがす欄）: 「にらぶた」でニラ豚炒め
//  4) ニラ豚炒めを献立に入れる・作り方を開く・人数を変える: 崩れない（分量が人数に合わせて変わる、豚肉に火を通す手順がある）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };

async function open(){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => {
        if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: {country: 'JP', dishCount: 3, servings: 2}})); }
        // 声の入力のかわり: start() のあと window.__say の言葉を、聞き取った結果として返す
        window.SpeechRecognition = class {
            start(){ setTimeout(() => { const tx = window.__say || ''; const r = [{ transcript: tx }]; r.isFinal = true; this.onresult && this.onresult({ results: [r] }); setTimeout(() => this.onend && this.onend(), 30); }, 30); }
            stop(){ setTimeout(() => this.onend && this.onend(), 10); }
            abort(){}
        };
    });
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && !!session.menu, null, { timeout: 30000 });
    return { ctx, p };
}
const firstHit = p => p.evaluate(() => { const e = document.querySelector('#search-results [data-act="open"][data-id]'); return e ? e.dataset.id : null; });
async function search(p, q){
    await p.fill('#search-input', q);
    await p.press('#search-input', 'Enter');
    await p.waitForTimeout(150);
    return firstHit(p);
}

const { ctx, p } = await open();
ok(await p.evaluate(() => !!byId('nirabuta') && byId('nirabuta').name === 'ニラ豚炒め'), 'ニラ豚炒め（nirabuta）が日本のレシピにある');
await p.evaluate(() => setTab('fridge'));
await p.waitForSelector('#search-input');

// 1) 料理をさがす
for (const [q, want] of [['ニラトン', 'nirabuta'], ['にらとん', 'nirabuta'], ['ニラ豚', 'nirabuta'], ['豚ニラ', 'nirabuta'], ['にらぶた', 'nirabuta'], ['ニラ豚炒め', 'nirabuta'], ['豚ニラ炒め', 'nirabuta'],
    ['ニラレバ', 'rebanira'], ['レバニラ', 'rebanira'], ['ニラたま', 'niratama'], ['レバニラ炒め', 'rebanira']]){
    const got = await search(p, q);
    ok(got === want, `さがす「${q}」→ 先頭が ${want}（実際: ${got}）`);
}
// 料理名だけの検索では「冷蔵庫に追加」を出さない（料理名の一部の「ニラ」を食材として足す案を出さない）
await search(p, 'ニラトン');
ok(!(await p.$('#search-results [data-act="search-to-fridge"]')), '「ニラトン」で「ニラを冷蔵庫に追加」を出さない');

// 2) 声で入力（材料の欄）: 料理の名前
await search(p, '');
await p.evaluate(() => { S.fridge = []; save(); render(); });
await p.waitForSelector('#mic-btn');
for (const say of ['ニラトン', 'にらとん', 'ニラ豚']){
    await p.evaluate(s => { window.__say = s; }, say);
    await p.click('#mic-btn');
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({ fridge: S.fridge.slice(), q: document.getElementById('search-input').value, ing: document.getElementById('ing-input').value, top: (document.querySelector('#search-results [data-act="open"][data-id]') || {}).dataset?.id }));
    ok(!r.fridge.length, `声「${say}」（材料の欄）: ニラを冷蔵庫に入れない ${JSON.stringify(r.fridge)}`);
    ok(r.q === say && r.top === 'nirabuta', `声「${say}」（材料の欄）: 料理をさがすでニラ豚炒めを出す ${JSON.stringify(r)}`);
    ok(r.ing === '', `声「${say}」（材料の欄）: 材料の欄に料理名を残さない「${r.ing}」`);
}
// 食材の名前はこれまでどおり冷蔵庫に入れる
for (const [say, want] of [['なす', 'なす'], ['ニラ', 'ニラ'], ['豚肉とニラ', '豚肉']]){
    await p.evaluate(() => { S.fridge = []; save(); render(); });
    await p.evaluate(s => { window.__say = s; }, say);
    await p.click('#mic-btn');
    await p.waitForTimeout(400);
    const fr = await p.evaluate(() => S.fridge.slice());
    ok(fr.includes(want), `声「${say}」（材料の欄）: 食材として冷蔵庫に入れる ${JSON.stringify(fr)}`);
}
// 3) 声で入力（さがす欄）
await p.evaluate(() => { S.fridge = []; save(); render(); });
await p.fill('#search-input', '');
await p.evaluate(() => { window.__say = 'にらぶた'; });
await p.click('#mic-search');
await p.waitForTimeout(400);
ok((await firstHit(p)) === 'nirabuta', '声「にらぶた」（さがす欄）: ニラ豚炒め');

// 4) 献立・作り方・人数
await p.evaluate(() => { session.menu.items[0].r = byId('nirabuta'); setTab('today'); render(); });
await p.waitForTimeout(200);
ok(await p.evaluate(() => document.body.innerText.includes('ニラ豚炒め')), '今日の献立にニラ豚炒めが出る');
await p.evaluate(() => openModal('nirabuta'));
await p.waitForTimeout(200);
const m2 = await p.evaluate(() => document.getElementById('modal-root').innerText);
ok(m2.includes('ニラ豚炒め') && m2.includes('200g') && m2.includes('赤みがなくなるまでしっかり火を通す'), '作り方: 名前・分量（2人分 200g）・豚肉に火を通す手順 ' + m2.slice(0, 200).replace(/\n/g, ' '));
await p.evaluate(() => { S.settings.servings = 4; save(); render(); renderModal(); });
await p.waitForTimeout(200);
const m4 = await p.evaluate(() => document.getElementById('modal-root').innerText);
ok(m4.includes('400g') && m4.includes('2束'), '人数を4人に: 豚肉 400g・ニラ 2束 ' + (m4.match(/豚こま[^\n]*/) || [''])[0] + ' / ' + (m4.match(/ニラ [^\n]*/) || [''])[0]);
await p.evaluate(() => { closeModal(); S.settings.servings = 2; save(); });
// 絵がある
ok(await p.evaluate(() => !!(GEN && GEN.nirabuta)), 'ニラ豚炒めの絵（manifest）がある');
await ctx.close();

ok(!errs.length, 'ページのエラーなし ' + errs.join(' / '));
await b.close();
console.log(fails ? `FAIL ${fails}/${checks}` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
