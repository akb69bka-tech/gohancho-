#!/usr/bin/env node
// 作り置き・残り物メモ / 食費メモ / 文字の大きさ の回帰テスト（Playwright。使い方: node tools/tests/memo-size.mjs [http://localhost:8795/]）
//  1) 残り物メモ: 1タップで記録 → 「今日の…（1日目）」「昨日の…（2日目）」。献立・冷蔵庫の食材は1つも変わらない。もう一度押すと消える／「食べきった」で消える／再読み込みしても残る
//  2) 食費メモ: 入力した金額の直近7日の合計だけ。8日前の記録は含めない。不正な入力は受けつけない。通貨は国の通貨。外へ通信しない
//  3) 文字の大きさ: 3段階で html の基準が 1 / 1.15 / 1.3 倍。全タブ・複数の国と言語で横にはみ出さない
//  4) 壊れた保存データを読んでも起動する
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || 'http://localhost:8795/';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
async function open(cc, extra = {}, lang){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    p.reqs = []; p.on('request', r => { if (r.method() !== 'GET' || /[?&](amount|spend)/i.test(r.url())) p.reqs.push(r.method() + ' ' + r.url()); });
    await p.addInitScript(([cc, extra, lang]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1);
        localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3, uiLang: lang || 'auto'}}, extra))); } }, [cc, extra, lang]);
    await p.goto(URL_); await p.waitForTimeout(900); p.ctx = ctx; return p;
}
// 1) 残り物メモ
for (const cc of ['JP', 'US', 'FR', 'IN', 'BR']){
    const p = await open(cc);
    const o = await p.evaluate(() => {
        setTab('today'); ensureMenu(); render();
        const ids0 = menuIds().join(), fr0 = JSON.stringify(S.fridge), st0 = JSON.stringify(S.staples);
        const btn = document.querySelector('[data-act="left-add"]'); if (!btn) return {err:'no chip'};
        const id = btn.dataset.id; btn.click();
        const first = S.leftovers.slice(), line1 = (document.querySelector('.left-line span') || {}).textContent;
        const pressed = document.querySelector(`[data-act="left-add"][data-id="${id}"]`).getAttribute('aria-pressed');
        // 昨日に入れたことにする
        S.leftovers[0].d = addDays(TODAY, -1); render();
        const line2 = (document.querySelector('.left-line span') || {}).textContent;
        S.leftovers[0].d = addDays(TODAY, -4); render();
        const line3 = (document.querySelector('.left-line span') || {}).textContent;
        S.leftovers[0].d = TODAY; render();
        document.querySelector(`[data-act="left-add"][data-id="${id}"]`).click();   // もう一度で消える
        const afterToggle = S.leftovers.length;
        document.querySelector(`[data-act="left-add"][data-id="${id}"]`).click();   // また入れる
        document.querySelector('[data-act="left-done"]').click();   // 食べきった
        const afterDone = S.leftovers.length;
        document.querySelector(`[data-act="left-add"][data-id="${id}"]`).click(); saveNow();
        return {first: first.length, line1, line2, line3, pressed, afterToggle, afterDone, same: menuIds().join() === ids0 && JSON.stringify(S.fridge) === fr0 && JSON.stringify(S.staples) === st0};
    });
    ok(!o.err, cc + ' ' + JSON.stringify(o));
    if (!o.err){
        ok(o.first === 1 && o.pressed === 'true', cc + ' add ' + JSON.stringify(o));
        if (cc === 'JP'){ ok(/^今日の.+の残りがあります（1日目）$/.test(o.line1), 'line1 ' + o.line1); ok(/^昨日の.+の残りがあります（2日目）$/.test(o.line2), 'line2 ' + o.line2); ok(/^.+の残りがあります（5日目）$/.test(o.line3) && !/日前|昨日|今日/.test(o.line3), 'line3 ' + o.line3); }
        ok(o.afterToggle === 0 && o.afterDone === 0, cc + ' toggle/done ' + JSON.stringify(o));
        ok(o.same, cc + ' 献立・冷蔵庫が変わった');
    }
    await p.reload(); await p.waitForTimeout(700);
    ok(await p.evaluate(() => S.leftovers.length === 1 && /残り/.test(document.body.innerText) || S.leftovers.length === 1), cc + ' 再読み込みで消えた');
    ok(!/undefined|\[object/.test(await p.evaluate(() => document.querySelector('.left-card').innerText)), cc + ' 表示に undefined');
    ok(!p.errs.length, cc + ' errors ' + p.errs.join('|'));
    await p.ctx.close();
}
// 2) 食費メモ
{
    const CUR = {JP:/[¥￥]/, US:/\$/, GB:/£/, FR:/€/, IN:/₹/, KR:/₩/, BR:/R\$/, TH:/฿/, TR:/₺/, PL:/zł/, MX:/\$/, ID:/Rp/, VN:/₫/, TW:/\$/, CN:/[¥￥]/, PH:/₱/, EG:/E£|EGP|ج/, PE:/S\//, DE:/€/, IT:/€/, ES:/€/};
    for (const cc of Object.keys(CUR)){
        const p = await open(cc);
        const o = await p.evaluate(() => {
            setTab('today'); ensureMenu(); render();
            const inp = () => document.querySelector('#spend-a'), go = v => { document.querySelector('details.spend-card').open = true; inp().value = v; document.querySelector('form[data-form="spend"]').dispatchEvent(new Event('submit', {cancelable:true, bubbles:true})); };
            go('abc'); const bad1 = S.spend.length, errShown = !!document.querySelector('[role=alert]');
            go('-5'); go('0'); go('1e3'); const bad2 = S.spend.length;
            go('1,200'); go('350.5'); go('９００');
            S.spend.push({id:'old', d:addDays(TODAY, -7), a:99999}, {id:'edge', d:addDays(TODAY, -6), a:10}); render();
            const sum = document.querySelector('.spend-sum').textContent, rows = document.querySelectorAll('.spend-card .left-line').length;
            const amounts = S.spend.map(x => x.a);
            document.querySelector('[data-act="spend-del"]').click(); const afterDel = S.spend.length;
            return {bad1, errShown, bad2, sum, rows, amounts, afterDel, sample: moneyText(1234.5)};
        });
        ok(o.bad1 === 0 && o.errShown && o.bad2 === 0, cc + ' 不正入力 ' + JSON.stringify(o));
        ok(JSON.stringify(o.amounts.slice(0, 3)) === '[1200,350.5,900]', cc + ' parse ' + JSON.stringify(o.amounts));
        ok(o.rows === 4, cc + ' rows ' + o.rows);   // 1200, 350.5, 900, edge(-6日)。8日前は出さない
        ok(CUR[cc].test(o.sample), cc + ' 通貨 ' + o.sample);
        ok(o.afterDel === o.amounts.length - 1, cc + ' del');
        ok(!p.reqs.length, cc + ' 外への通信 ' + p.reqs.join(','));
        ok(!p.errs.length, cc + ' errors ' + p.errs.join('|'));
        if (cc === 'JP') ok(/2,460\.50/.test(o.sum), 'sum ' + o.sum);   // 1200+350.5+900+10。円でも端数を丸めて見せない
        await p.ctx.close();
    }
    // 合計の値（JP: 1200+350.5+900+10 = 2460.5）
    const p = await open('JP', {spend:[{id:'a', d:new Date().toISOString().slice(0,10), a:1200}, {id:'b', d:new Date().toISOString().slice(0,10), a:350.5}, {id:'c', d:'2000-01-01', a:5}]});
    const s = await p.evaluate(() => { setTab('today'); ensureMenu(); render(); return document.querySelector('.spend-sum').textContent; });
    ok(/1,550\.5|1,551|1550/.test(s), '合計 ' + s);
    await p.ctx.close();
}
// 3) 文字の大きさ
for (const [cc, lang] of [['JP'], ['US'], ['DE', 'de'], ['EG', 'ar'], ['TH', 'th'], ['KR', 'ko'], ['PL', 'pl'], ['IN', 'hi']]){
    for (const sz of [0, 1, 2]){
        const p = await open(cc, {settings:{country:cc, dishCount:5, uiLang: lang || 'auto', textSize: sz || undefined}, leftovers:[{id:'x', name:'テスト料理の名前が長いときのようす', d:new Date().toISOString().slice(0,10)}], spend:[{id:'a', d:new Date().toISOString().slice(0,10), a:123456}]}, lang);
        const r = await p.evaluate(async sz => {
            const out = {fs: getComputedStyle(document.documentElement).fontSize, ts: document.documentElement.getAttribute('data-ts'), over: []};
            for (const tb of ['today', 'cook', 'fridge', 'world', 'log', 'settings']){
                setTab(tb); await new Promise(r => setTimeout(r, 120));
                if (document.documentElement.scrollWidth > innerWidth + 1) out.over.push(tb + ':' + document.documentElement.scrollWidth);
                for (const el of document.querySelectorAll('#view *, nav.tabs *')){ const rc = el.getBoundingClientRect(); if (rc.width && rc.right > innerWidth + 1 && !el.closest('.scroll, .chips.scroll') && getComputedStyle(el).position !== 'fixed'){ out.over.push(tb + ' ' + el.tagName + '.' + el.className + ' ' + Math.round(rc.right)); break; } }
            }
            return out;
        }, sz);
        ok(r.fs === ['16px', '18.4px', '20.8px'][sz], `${cc} sz${sz} font-size ${r.fs}`);
        ok(r.over.length === 0, `${cc}/${lang || ''} sz${sz} はみ出し ${r.over.join(' ; ')}`);
        ok(!p.errs.length, cc + ' errors ' + p.errs.join('|'));
        await p.ctx.close();
    }
}
// 設定で切りかえ → 保存 → 再読み込みで保たれる
{
    const p = await open('JP');
    await p.evaluate(() => { setTab('settings'); document.querySelector('[data-act="text-size"][data-v="2"]').click(); saveNow(); });
    ok(await p.evaluate(() => document.documentElement.getAttribute('data-ts') === '2' && S.settings.textSize === 2), '設定で大きく');
    await p.reload(); await p.waitForTimeout(600);
    ok(await p.evaluate(() => document.documentElement.getAttribute('data-ts') === '2'), '再読み込みで保持');
    await p.evaluate(() => { setTab('settings'); document.querySelector('[data-act="text-size"][data-v="0"]').click(); });
    ok(await p.evaluate(() => !document.documentElement.hasAttribute('data-ts') && S.settings.textSize === undefined), 'ふつうに戻す');
    await p.ctx.close();
}
// 4) 壊れた保存データ
{
    const p = await open('JP', {leftovers:[null, 5, {name:'', d:'2026-01-01'}, {name:'ok', d:'bad'}, {name:'ok2', d:'2026-10-26', id:1}], spend:[null, {d:'2026-10-26', a:'x'}, {d:'2026-10-26', a:-3}, {d:'2026-10-26', a:'12.345'}], settings:{country:'JP', textSize:9}});
    const o = await p.evaluate(() => ({l: S.leftovers.length, s: S.spend.map(x => x.a), ts: S.settings.textSize}));
    ok(o.l === 1 && JSON.stringify(o.s) === '[12.35]' || JSON.stringify(o.s) === '[12.34]' || JSON.stringify(o.s) === '[12.35]', '壊れたデータ ' + JSON.stringify(o));
    ok(o.ts === undefined, 'textSize 不正値');
    ok(!p.errs.length, 'errors ' + p.errs.join('|'));
    await p.ctx.close();
}
await b.close();
console.log(fails ? 'FAILS ' + fails : 'ALL OK');
process.exit(fails ? 1 : 0);
