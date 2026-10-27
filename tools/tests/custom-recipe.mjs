#!/usr/bin/env node
// 自作レシピ（わが家のレシピ）の回帰テスト（Playwright。使い方: node tools/tests/custom-recipe.mjs [http://localhost:8794/]）
//  1) 材料の行の読み取り（豚肉200g・・豚肉：200g・① 豚肉 200g・2 cups flour・Ground beef 500 g）と作り方の分割・見出し付き貼りつけ
//  2) フォームから追加 → 材料の名前と分量が分かれ、買い物メモに入り、小麦アレルギーで出なくなる（薄力粉・ホタテ・ピーナッツ…）
//  3) 4人分のレシピは2人分に換算して持ち、4人分に戻すと元の分量になる。編集しても元の文章が残る
//  4) 食材の表と結びつかない材料の警告と候補、候補を押すと名前が置き換わる
//  5) 由来メモ・作った回数の表示、バックアップに入り写真の注意が出る、壊れた値の読み込み
//  6) 自作レシピを足しても、いま出ている献立の料理は1品も変わらない
//  7) 写真: 40MB超は断る
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8794/';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
async function open(cc, settings = {}, store = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(cc + ': ' + m.text()); });
    await p.addInitScript(([cc, settings, store]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3, ...settings}, ...store})); } }, [cc, settings, store]);
    await p.goto(URL_); await p.waitForTimeout(900); await p.evaluate(() => { hasPro = () => true; });
    return { ctx, p };
}
const { ctx, p } = await open('JP');
// 1) 行の読み取り
const L = await p.evaluate(() => {
    const f = s => { const x = normIngLine(s); return x ? x.name + '|' + x.qty : null; };
    return {
        a: f('豚肉200g'), b: f('・豚バラ 150g'), c: f('大根　1/3本'), d: f('① 豚肉 200g'), e: f('2 cups flour'), g: f('Ground beef 500 g'), h: f('じゃがいも：2個'), i: f('塩 少々'),
        j: f('1. 玉ねぎ 1個'), k: f('１．玉ねぎ　２個'), l: f('材料（2人分）'), m: f('卵'), n: f('醤油 大さじ2'), o: f('1.5 kg potatoes'), q: f('豚バラ 薄切り 150g'), r: f('A 醤油 大さじ1'), s: f('A pinch of salt'),
        s1: normSteps('1. 切る\n② 煮る\n手順3: 盛る'), s2: normSteps('大根を切る。鍋で煮る。盛りつける。'), s3: normSteps('Chop the onion. Fry it for 3.5 minutes. Serve.'),
        p: parseRecipePaste('実家の豚バラ大根\n【材料】（4人分）\n・豚バラ薄切り肉 300g\n大根 1/2本\n■調味料\n醤油 大さじ3\nみりん 大さじ2\n■作り方\n1. 大根を切る\n2. 煮る'), p0: parseRecipePaste('ただのメモです'),
    };
});
ok(L.a === '豚肉|200g', '豚肉200g: ' + L.a); ok(L.b === '豚バラ|150g', L.b); ok(L.c === '大根|1/3本', L.c); ok(L.d === '豚肉|200g', L.d);
ok(L.e === 'flour|2 cups', L.e); ok(L.g === 'Ground beef|500 g', L.g); ok(L.h === 'じゃがいも|2個', L.h); ok(L.i === '塩|少々', L.i);
ok(L.j === '玉ねぎ|1個', L.j); ok(L.k === '玉ねぎ|2個', L.k); ok(L.l === null, '見出しは材料にしない'); ok(L.m === '卵|', L.m); ok(L.n === '醤油|大さじ2', L.n);
ok(L.o === 'potatoes|1.5 kg', L.o); ok(L.q === '豚バラ 薄切り|150g', L.q); ok(L.r === '醤油|大さじ1', L.r); ok(L.s === 'A pinch of salt|', 'A pinch は名前のまま: ' + L.s);
ok(JSON.stringify(L.s1) === JSON.stringify(['切る', '煮る', '盛る']), '番号を取る ' + JSON.stringify(L.s1));
ok(L.s2.length === 3, '1行の作り方を文で分ける ' + JSON.stringify(L.s2)); ok(L.s3.length === 3, '3.5 を割らない ' + JSON.stringify(L.s3));
ok(L.p && L.p.name === '実家の豚バラ大根' && L.p.serves === 4 && L.p.ings.length === 2 && L.p.seas.length === 2 && L.p.steps.length === 2, '貼りつけの分解 ' + JSON.stringify(L.p));
ok(L.p0 === null, '見出しがなければ読み取らない');
// 2) フォームから追加
await p.evaluate(() => { setTab('log'); });
await p.waitForTimeout(300);
const before = await p.evaluate(() => { newMenu && 0; return JSON.stringify((session.menu ? session.menu.items : []).map(x => x.r && x.r.id)); });
await p.evaluate(() => { document.querySelector('#custom-box').open = true; });
await p.fill('#c-name', '母の小麦ホタテ煮');
await p.fill('#c-ings', '薄力粉200g\n・ホタテ 4個\nピーナッツ：30g\nGround beef 500 g\nほうれんそ 1束\nズッキーニ 1本');
await p.waitForTimeout(600);
const chk = await p.evaluate(() => document.querySelector('#c-check').innerText);
ok(/結びつかない/.test(chk), '警告が出る: ' + chk);
ok(await p.locator('#c-check [data-act="c-sugg"]').count() >= 1, '候補ボタンが出る');
await p.fill('#c-src', '母のレシピ');
await p.selectOption('#c-serves', '4');
await p.fill('#c-seas', '醤油 大さじ4');
await p.fill('#c-steps', '1. 切る。煮る。\n');
await p.evaluate(() => { document.querySelector('[data-form="custom"]').requestSubmit(); });
await p.waitForTimeout(400);
const R = await p.evaluate(() => {
    const c = S.custom[0], r = byId(c.id);
    S.settings.servings = 4;
    const q4 = r.items.map(i => i.name + ':' + scaleText(i.qty, servingFactor()));
    S.settings.servings = 2;
    S.family = [{id:'f1', name:'子', role:'child', avoid:['@wheat'], allergy:['@wheat'], mild:false}]; S.eaters = null;
    const avWheat = isAvoided(r);
    S.family[0].avoid = ['@shellfish']; S.family[0].allergy = ['@shellfish'];
    const c2 = {id:'u9', name:'ホタテだけ', type:'主菜', genre:'和', method:'煮', min:10, ings:['ホタテ 4個'], seas:'', steps:['煮る'], serves:2, src:''}; RECIPES.push(prepCustom(c2));
    const avShell = isAvoided(byId('u9'));
    S.family = []; S.eaters = null; RECIPES.splice(RECIPES.findIndex(x => x.id === 'u9'), 1);
    return { c, names: r.items.map(i => i.name), q4, seas: r.seas, avWheat, avShell, listed: document.body.innerText.includes('母のレシピ') };
});
ok(R.c.serves === 4 && R.c.src === '母のレシピ', '保存された値 ' + JSON.stringify(R.c));
ok(R.names.includes('Ground beef') && R.names.includes('薄力粉'), '名前が分かれる ' + R.names);
ok(R.c.ings[0] === '薄力粉 200g', '保存は元の分量: ' + R.c.ings[0]);
ok(R.q4[0] === '薄力粉:200g' || R.q4[0] === '薄力粉:200g', '4人分で元の分量 ' + R.q4[0]);
ok(R.seas === '醤油 大さじ2', '調味料は2人分に換算 ' + R.seas);
ok(R.c.steps.length === 2, '作り方が文ごとに ' + R.c.steps);
ok(R.avWheat, '小麦アレルギーで薄力粉の自作レシピが出ない'); ok(R.avShell, '貝のアレルギーでホタテの自作レシピが出ない');
ok(R.listed, '由来メモが一覧に出る');
const after = await p.evaluate(() => JSON.stringify((session.menu ? session.menu.items : []).map(x => x.r && x.r.id)));
ok(before === after, '自作レシピを足しても献立の料理は変わらない');
// 3) 編集
await p.evaluate(() => { session.editCustom = S.custom[0].id; render(); });
const ed = await p.evaluate(() => ({ ings: document.querySelector('#c-ings').value, serves: document.querySelector('#c-serves').value, src: document.querySelector('#c-src').value, seas: document.querySelector('#c-seas').value }));
ok(ed.ings.split('\n')[0] === '薄力粉 200g' && ed.serves === '4' && ed.src === '母のレシピ' && ed.seas === '醤油 大さじ4', '編集欄に元の文章 ' + JSON.stringify(ed));
await p.evaluate(() => { document.querySelector('[data-form="custom"]').requestSubmit(); });
await p.waitForTimeout(300);
const ed2 = await p.evaluate(() => ({ n: S.custom.length, ing: S.custom[0].ings[0], seas: byId(S.custom[0].id).seas }));
ok(ed2.n === 1 && ed2.ing === '薄力粉 200g' && ed2.seas === '醤油 大さじ2', '編集して保存しても換算が重ならない ' + JSON.stringify(ed2));
// 4) 候補
await p.evaluate(() => { session.editCustom = null; render(); document.querySelector('#custom-box').open = true; });
await p.fill('#c-ings', 'ほうれんそ 1束\n豚肉 100g');
await p.waitForTimeout(600);
const sg = await p.evaluate(() => [...document.querySelectorAll('#c-check [data-act="c-sugg"]')].map(x => x.dataset.name));
ok(sg.includes('ほうれん草'), '候補にほうれん草 ' + sg);
await p.click('#c-check [data-act="c-sugg"]');
ok((await p.inputValue('#c-ings')).startsWith('ほうれん草 1束'), '候補を押すと名前が置き換わる: ' + await p.inputValue('#c-ings'));
// 貼りつけ
await p.evaluate(() => { document.querySelector('#c-paste-box').open = true; });
await p.fill('#c-paste', '祖母のけんちん汁\n材料（4人分）\n大根 1/4本\n人参 1/2本\n作り方\n切る。煮る。');
await p.click('[data-act="c-paste-go"]');
const pv = await p.evaluate(() => ({ n: document.querySelector('#c-name').value, i: document.querySelector('#c-ings').value, s: document.querySelector('#c-steps').value, sv: document.querySelector('#c-serves').value }));
ok(pv.n === '祖母のけんちん汁' && pv.i === '大根 1/4本\n人参 1/2本' && pv.s === '切る。\n煮る。' && pv.sv === '4', '貼りつけが欄に入る ' + JSON.stringify(pv));
// 5) 回数・バックアップ・壊れた値
const BK = await p.evaluate(() => {
    const id = S.custom[0].id; S.history.push({d: TODAY, id, slot: '主菜'}); render();
    const lab = customMadeLabel(id);
    const dump = JSON.parse(JSON.stringify(S)); dump.custom.push({id:'u77', name:'壊れ', ings:['卵 1'], serves:'abc', src: 5, steps:'x', type:'??'});
    const st = normalizeState(dump);
    return { lab, serves: st.custom.map(r => r.serves), src: st.custom.map(r => r.src), back: JSON.stringify(S).includes('母のレシピ') };
});
ok(/1回/.test(BK.lab) || BK.lab.includes('1'), '作った回数 ' + BK.lab); ok(BK.back, 'バックアップに由来メモが入る'); ok(BK.serves.every(n => n >= 1 && n <= 12) && BK.src.every(x => typeof x === 'string'), '壊れた値は直る ' + BK.serves);
await p.evaluate(() => { setTab('settings'); });
ok((await p.evaluate(() => document.body.innerText)).includes('写真（わが家の一枚・アルバム）は入りません'), '設定のバックアップに写真の注意');
// 7) 写真
const ph = await p.evaluate(async () => { try{ await shrinkImage({size: 41e6}); return 'no'; }catch(e){ return e.message; } });
ok(ph === 'big', '40MB超は断る ' + ph);
// 英語の自作レシピ（米国）でも名前と分量が分かれる
await ctx.close();
{
    const { ctx: c2, p: p2 } = await open('US');
    const r = await p2.evaluate(() => { const c = {id:'u5', name:'Mom chili', type:'主菜', genre:'local', method:'煮', min:30, ings:[ingLineOf(normIngLine('Ground beef 1 lb')), ingLineOf(normIngLine('2 cups kidney beans')), ingLineOf(normIngLine('Onion 1'))], seas:'', steps:['Simmer.'], serves:4, src:''}; const x = prepCustom(c); return x.items.map(i => i.name + '|' + i.qty); });
    ok(r[0] === 'Ground beef|2 lb' || r[0].startsWith('Ground beef|'), '米国: ' + r.join(' ; ')); ok(r[1].startsWith('kidney beans|'), r[1]);
    await c2.close();
}
// 全言語: 貼りつけ欄の見本（その言語の見出し）が、材料・調味料・作り方に分かれる
{
    const fs = await import('node:fs'), vm = await import('node:vm');
    const KEY = '実家の豚バラ大根\n材料（4人分）\n豚バラ薄切り肉 300g\n大根 1/2本\n調味料\n醤油 大さじ3\n作り方\n1. 大根を切る\n2. 煮る';
    const { ctx: c3, p: p3 } = await open('JP');
    for (const f of fs.readdirSync(new URL('../../gohancho/i18n/', import.meta.url)).filter(x => x.endsWith('.js'))){
        let dict = null; vm.runInNewContext(fs.readFileSync(new URL('../../gohancho/i18n/' + f, import.meta.url), 'utf8'), { GOHAN_I18N: (l, d) => { dict = d; } });
        const sample = dict[KEY]; if (!sample){ ok(false, f + ' に見本がない'); continue; }
        const r = await p3.evaluate(s => { const x = parseRecipePaste(s); return x && { n: x.name, i: x.ings.length, s: x.seas.length, st: x.steps.length, sv: x.serves }; }, sample);
        ok(r && r.n && r.i === 2 && r.s === 1 && r.st === 2 && r.sv === 4, f + ' の見本が分かれない: ' + JSON.stringify(r));
    }
    await c3.close();
}
await b.close();
if (errs.length){ console.log('console errors:', errs.slice(0, 5)); fails++; }
console.log(fails ? 'FAILED ' + fails : 'ALL OK');
process.exit(fails ? 1 : 0);
