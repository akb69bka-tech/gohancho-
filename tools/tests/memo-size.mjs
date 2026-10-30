#!/usr/bin/env node
// 作り置き・残り物メモ / 食費メモ / 文字の大きさ の回帰テスト（Playwright。使い方: node tools/tests/memo-size.mjs [http://localhost:8795/]）
//  1) 残り物メモ: 1タップで記録 → 「今日の…（1日目）」「昨日の…（2日目）」。献立・冷蔵庫の食材は1つも変わらない。もう一度押すと消える／「食べきった」で消える／再読み込みしても残る
//  2) 食費メモ: 入力した金額の直近7日の合計だけ。8日前の記録は含めない。不正な入力は受けつけない。通貨は国の通貨。外へ通信しない
//  3) 文字の大きさ: 3段階で html の基準が 1 / 1.15 / 1.3 倍。全タブ・複数の国と言語で横にはみ出さない
//  4) 壊れた保存データを読んでも起動する
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready, SEED, rngScript, seedFor } = require('../lib/pw.cjs'); let seedN = 0;   // 乱数は SEED から（失敗したら表示の SEED=… を付けて実行すると同じ献立で再現する）
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
async function open(cc, extra = {}, lang){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('memo-size', String(++seedN))));
    const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    p.reqs = []; p.on('request', r => { if (r.method() !== 'GET' || /[?&](amount|spend)/i.test(r.url())) p.reqs.push(r.method() + ' ' + r.url()); });
    await p.addInitScript(([cc, extra, lang]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1);
        localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3, uiLang: lang || 'auto'}}, extra))); } }, [cc, extra, lang]);
    await p.goto(URL_); await ready(p); p.ctx = ctx; return p;
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
            setTab('log'); ensureMenu(); render();   // 食費メモは記録のタブ（最初の版の場所）
            const inp = () => document.querySelector('#spend-a'), go = v => { document.querySelector('details.spend-card').open = true; inp().value = v; document.querySelector('form[data-form="spend"]').dispatchEvent(new Event('submit', {cancelable:true, bubbles:true})); };
            go('abc'); const bad1 = S.spend.length, errShown = !!document.querySelector('[role=alert]');
            go('-5'); go('0'); go('1e3'); const bad2 = S.spend.length;
            go(new Intl.NumberFormat(LANG).formatToParts(1.5).find(x => x.type === 'decimal').value === ',' ? '1.200' : '1,200'); go('350.5'); go('９００');
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
    const s = await p.evaluate(() => { S.spend.forEach(x => { if (x.d !== '2000-01-01') x.d = TODAY; }); setTab('log'); ensureMenu(); render(); return (document.querySelector('.spend-sum') || {}).textContent || ''; });   // アプリの「今日」（午前4時まで前の日）に合わせる（夜中に流すと日付がずれていた）
    ok(/1,550\.5|1,551|1550/.test(s), '合計 ' + s);
    await p.ctx.close();
}
// 2b) 金額の読み取り: 通貨記号・円・千区切り・小数（末尾1〜2桁だけ）。1000倍の取り違えはしない
{
    const p = await open('DE', {}, 'de'), q = await open('JP', {}, 'ja');
    const run = pg => pg.evaluate(() => ['1.234,50', '35.000', '¥300', '300円', '€ 12,5', '1.234.567', '1,234', '12,345', '1.2.3', '$1,234.50', '12.5', '٣٠٠', '', 'abc', '0', '-5', '10 000', "1'234"].map(v => [v, parseMoney(v)]));
    const d = Object.fromEntries(await run(p)), j = Object.fromEntries(await run(q));
    ok(d['1.234,50'] === 1234.5 && d['35.000'] === 35000 && d['¥300'] === 300 && d['300円'] === 300 && d['€ 12,5'] === 12.5 && d['1.234.567'] === 1234567, 'de: ' + JSON.stringify(d));
    ok(d['1,234'] === null && d['12,345'] === null, 'de: "1,234" is not read as 1234 (would be 1000x): ' + d['1,234']);
    ok(d['1.2.3'] === null && d[''] === null && d['abc'] === null && d['0'] === null && d['-5'] === null, 'de junk');
    ok(j['1,234'] === 1234 && j['$1,234.50'] === 1234.5 && j['300円'] === 300 && j['¥300'] === 300 && j['12.5'] === 12.5 && j['٣٠٠'] === 300 && j['10 000'] === 10000 && j["1'234"] === 1234, 'ja: ' + JSON.stringify(j));
    ok(j['35.000'] === null, 'ja: "35.000" is ambiguous so it is not accepted: ' + j['35.000']);
    await p.ctx.close(); await q.ctx.close();
}
// 1b) 残り物メモ: 言語を切り替えると料理名も直る／4日目以降は薄く出て、まとめて消せる（元に戻せる）
{
    const p = await open('JP', {leftovers:[{id:'nikujaga', name:'肉じゃが', d:new Date().toISOString().slice(0,10)}, {id:'nikujaga', name:'肉じゃが', d:new Date(Date.now() - 5 * 86400000).toISOString().slice(0,10)}, {id:'gone-id', name:'保存した名前', d:new Date(Date.now() - 1 * 86400000).toISOString().slice(0,10)}]});
    const o = await p.evaluate(async () => {
        setTab('today'); ensureMenu(); render();
        const ja = [...document.querySelectorAll('.left-line span')].map(x => x.textContent);
        { const e = document.createElement('button'); e.dataset.act = 'ui-lang'; e.dataset.v = 'en'; document.body.appendChild(e); e.click(); e.remove(); } await new Promise(r => setTimeout(r, 1200)); setTab('today'); render();
        const en = [...document.querySelectorAll('.left-line span')].map(x => x.textContent);
        const old = document.querySelectorAll('.left-line.left-old').length, btn = !!document.querySelector('[data-act="left-clean"]');
        const n0 = S.leftovers.length; document.querySelector('[data-act="left-clean"]').click();
        const n1 = S.leftovers.length, btn1 = !!document.querySelector('[data-act="left-clean"]');
        return {ja, en, old, btn, n0, n1, btn1, fr: JSON.stringify(S.fridge)};
    });
    ok(o.ja.some(x => x.includes('肉じゃが')) && o.ja.some(x => x.includes('保存した名前')), 'ja names: ' + o.ja);
    ok(o.en.some(x => /Nikujaga|pork/i.test(x)) && !o.en.some(x => x.includes('肉じゃが')) && o.en.some(x => x.includes('保存した名前')), 'names follow the language (fallback to the saved name): ' + o.en);
    ok(o.old === 1 && o.btn && o.n0 === 3 && o.n1 === 2 && !o.btn1, 'day-4+ memos are dimmed and can be cleared together: ' + JSON.stringify(o));
    await p.ctx.close();
}
// 2c) 冷蔵庫の食材チップ（⏰と日数）は、狭い幅・大きい文字でもはみ出さない
for (const [w, sz, lang] of [[320, 2, 'de'], [320, 2, 'en'], [360, 1, 'ar'], [320, 2, 'ja']]){
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('memo-size', String(++seedN))));
    const p = await ctx.newPage(); p.errs = [];
    const d0 = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    await p.addInitScript(([lang, sz, d0]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:d0, settings:{country:'JP', dishCount:3, uiLang:lang, textSize:sz}, fridge:['豚肉', '玉ねぎ', 'キャベツ', 'じゃがいも'], fridgeMeta:{'豚肉':{d:d0, soon:true}, '玉ねぎ':{d:d0, soon:true}, 'キャベツ':{d:d0}, 'じゃがいも':{d:d0, soon:true}}})); } }, [lang, sz, d0]);
    await p.goto(URL_); await ready(p);
    const r = await p.evaluate(async () => { setTab('fridge'); await new Promise(r => setTimeout(r, 200)); const chips = [...document.querySelectorAll('.chip.have')];
        return {n: chips.length, sw: document.documentElement.scrollWidth, iw: innerWidth, out: chips.filter(c => c.getBoundingClientRect().right > innerWidth + 1 || c.getBoundingClientRect().left < -1).length, txt: chips.map(c => c.textContent.trim()).join('|')}; });
    ok(r.n === 4 && r.sw <= r.iw + 1 && r.out === 0, `fridge chips ${w}px sz${sz} ${lang}: ` + JSON.stringify(r));
    await ctx.close();
}
// 5) 食べる時刻から逆算: 0時台の指定は、過ぎていれば「あすの未明」。時刻を入れなくても「いま始めたら」を出す
{
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('memo-size', String(++seedN))));
    const p = await ctx.newPage(); p.errs = [];
    const d = '2026-10-27';
    await p.addInitScript(d => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:d, settings:{country:'JP', dishCount:3, uiLang:'ja'}, cook:{d, ids:['nikujaga', 'hamburg'], slots:['主菜', '主菜'], done:{}}})); } }, d);
    await p.clock.install({ time: new Date(d + 'T16:00:00') });
    await p.goto(URL_); await ready(p);
    const r = await p.evaluate(async () => {
        setTab('cook'); await new Promise(r => setTimeout(r, 300));
        const lines = () => [...document.querySelectorAll('.eat-line')].map(x => x.textContent);
        const none = lines(); S.settings.dinnerAt = '00:00'; render(); const mid = lines(); S.settings.dinnerAt = '19:00'; render(); const ev = lines();
        return {none, mid, ev};
    });
    ok(r.none.length === 1 && /いま.*に始めると/.test(r.none[0]), 'no eat time: still shows "if you start now": ' + JSON.stringify(r.none));
    ok(r.mid.some(x => /までに始めれば|同時に進めるなら|1品ずつ順に作ると/.test(x)) && !r.mid.some(x => /いま.*に始めると/.test(x) && r.mid.length === 1), '00:00 is treated as tonight midnight (not already past): ' + JSON.stringify(r.mid));
    ok(r.ev.length >= 2 && r.ev.some(x => /までに始めれば/.test(x)), '19:00 still works: ' + JSON.stringify(r.ev));
    await ctx.close();
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
// 3b) 下のタブの名前は、単語の途中で折れない・はみ出さない（独語・葡語など長い言葉。狭い画面・大きい文字でも）
for (const [lang, w, sz] of [['de', 320, 2], ['de', 360, 1], ['de', 390, 0], ['pt-BR', 320, 2], ['fr', 360, 2], ['tr', 320, 1]]){
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('memo-size', String(++seedN))));
    const p = await ctx.newPage();
    await p.addInitScript(([lang, sz]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:'2026-10-20', settings:{country:'DE', dishCount:3, uiLang:lang, textSize:sz || undefined}})); } }, [lang, sz]);
    await p.goto(URL_); await ready(p);
    const bad = await p.evaluate(() => [...document.querySelectorAll('nav.tabs button:not([hidden])')].map(bt => {
        const words = bt.innerText.trim().split(/\s+/), rg = document.createRange(); const span = [...bt.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()) || bt.querySelector('span');
        if (span) rg.selectNodeContents(span); const lines = span ? rg.getClientRects().length : 1;
        return (bt.scrollWidth > bt.clientWidth + 1 ? 'overflow ' : '') + (lines > words.length ? 'mid-word break ' : '') + (bt.scrollWidth > bt.clientWidth + 1 || lines > words.length ? bt.innerText : '');
    }).filter(Boolean));
    ok(!bad.length, `tabs ${lang} ${w}px sz${sz}: ` + bad.join(' | '));
    await ctx.close();
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
