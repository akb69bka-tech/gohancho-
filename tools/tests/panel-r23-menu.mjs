#!/usr/bin/env node
// 第23回の残り（戸川・柊）の確かめ。Playwright。使い方: node tools/tests/panel-r23-menu.mjs [http://localhost:8999/]
//  R90 の残り: 主食なしの国（アメリカ・イギリス）の「10分以内」「いちばん簡単」で、まるごと入れ替え5回・続けて5回作っても、主菜が5品とも別（前は 2〜3品の中で回っていた）。
//              足した主食入りの主菜は 10分以内・手順3つ・材料6つまで・揚げ物とオーブンなしで、10分・かんたんの札の条件に合う。アレルゲンは言葉どおりに判定
//  R91 の残り: ベトナム語でタイ・韓国、アラビア語でタイの料理名が、その言葉で出る（料理名だけの訳。材料・手順は英語のまま。詳しい画面の副題はその国の名前）
//  環境変数: BASE, SEED
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (cc, tag, settings = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r23m', cc, tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript((st) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({uiLang: 'ja', dishCount: 'auto', servings: 2}, st)})); } }, Object.assign({country: cc}, settings));
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; setTab('today'); render(); });
    return {p, ctx};
};
const NEW = {US: ['us_blt', 'us_turkeywrap', 'us_eggmuffin', 'us_bbqchickensandwich'], GB: ['gb_sardinestoast', 'gb_mushroomstoast', 'gb_hamcheesetoastie']};
const MUST = {us_blt: ['wheat', 'egg'], us_turkeywrap: ['wheat', 'milk', 'egg', 'mustard'], us_eggmuffin: ['wheat', 'egg', 'milk'], us_bbqchickensandwich: ['wheat', 'egg'],
    gb_sardinestoast: ['wheat', 'fish', 'milk'], gb_mushroomstoast: ['wheat', 'milk'], gb_hamcheesetoastie: ['wheat', 'milk', 'mustard']};

// ---- 足した主菜 ----
{
    const bad = [], miss = [];
    for (const cc of Object.keys(NEW)){
        const {p, ctx} = await open(cc, 'new');
        const r = await p.evaluate(([ids, must]) => ids.map(id => { const r = byId(id); if (!r) return {id, none: true};
            const m = algRecipeMap(r), hits = Object.keys(m).filter(k => m[k].some(x => x.kind !== 4));
            return {id, min: r.min, steps: stepCount(r), ing: ingCount(r), main: r.main, starch: r.starch, heavy: easyHeavy(r), ten: modeStrict(r, 'ten'), simple: modeStrict(r, 'simple'), lack: (must[id] || []).filter(a => !hits.includes(a))}; }), [NEW[cc], MUST]);
        r.forEach(x => { if (x.none || x.min > 10 || x.steps > 3 || x.ing > 6 || !x.main || !x.starch || x.heavy || !x.ten || !x.simple) bad.push(JSON.stringify(x)); if (x.lack && x.lack.length) miss.push(x.id + ':' + x.lack.join(',')); });
        await ctx.close();
    }
    ok(!bad.length, 'R90 足した主菜（アメリカ4品・イギリス3品）は主食入り・10分以内・手順3つ・材料6つまで・揚げ物とオーブンなしで、10分・かんたんの札の条件に合う: ' + bad.slice(0, 3).join(' | '));
    ok(!miss.length, 'R90 足した主菜のアレルゲンを言葉どおりに判定する（パン・トルティーヤ・マフィンの小麦、マヨネーズの卵など）: ' + miss.join(' | '));
}

// ---- R90: まるごと入れ替え5回・続けて5回で、主菜が5品とも別 ----
{
    const res = [];
    for (const cc of ['US', 'GB']) for (const mode of ['ten', 'simple']){
        const {p, ctx} = await open(cc, 'r90-' + mode);
        const r = await p.evaluate(async (mode) => {
            session.mood = mode; session.rejected.clear(); newMenu(); render();
            const shuffle = [session.menu.items[0].r.id];
            for (let k = 0; k < 4; k++){ document.querySelector('#view .tray [data-act=new-menu]').click(); await new Promise(r => setTimeout(r, 30)); shuffle.push(session.menu.items[0].r.id); }
            S.modeSeen = {}; save();
            const seq = []; for (let k = 0; k < 5; k++){ session.rejected.clear(); newMenu(); render(); seq.push(session.menu.items[0].r.id); }
            return {shuffle, seq};
        }, mode);
        res.push({cc, mode, shuffle: new Set(r.shuffle).size, seq: new Set(r.seq).size});
        await ctx.close();
    }
    ok(res.every(x => x.shuffle === 5 && x.seq === 5), 'R90 アメリカ・イギリスの10分以内・いちばん簡単で、まるごと入れ替え5回・続けて5回とも主菜が5品とも別（前は 2〜3種類）: ' + JSON.stringify(res));
}

// ---- R91: ベトナム語でタイ・韓国、アラビア語でタイ ----
{
    const res = [];
    for (const [cc, ui, re] of [['TH', 'vi', /^[\p{Script=Latin}\d\s()'’,.\-]+$/u], ['KR', 'vi', /^[\p{Script=Latin}\d\s()'’,.\-]+$/u], ['TH', 'ar', /[؀-ۿ]/]]){
        const {p, ctx} = await open(cc, 'r91-' + ui, {uiLang: ui});
        const r = await p.evaluate(async () => {
            const en = new Map((PACK.recipes || []).map(x => [x.id, x.name]));
            const out = RECIPES.filter(r => r.pack).map(r => ({id: r.id, name: r.name, en: en.get(r.id), local: r.nameEn, step: (r.steps[0] || '')}));
            const r0 = RECIPES.find(r => r.pack); openModal(r0.id); await new Promise(res => setTimeout(res, 50));
            const sub = ((document.querySelector('#modal-root .sheet') || {}).textContent || '').includes(r0.nameEn);
            return {out, sub};
        });
        const english = r.out.filter(x => x.name === x.en || !re.test(x.name)).map(x => x.id);
        res.push({cc, ui, n: r.out.length, english: english.length, sample: r.out[0].name, stepsEn: r.out.every(x => /^[\x20-\x7e°–—’]+$/.test(x.step)), sub: r.sub});
        await ctx.close();
    }
    ok(res.every(x => x.english === 0 && x.stepsEn && x.sub), 'R91 ベトナム語でタイ・韓国、アラビア語でタイ: 料理名はすべてその言葉（英語のまま 0）。材料・手順は英語のまま、詳しい画面の副題はその国の名前: ' + JSON.stringify(res));
}

await b.close();
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' | '));
console.log(`\n${checks - fails}/${checks} 通過${fails ? '（失敗 ' + fails + '）' : ''}  SEED=${SEED}`);
process.exit(fails ? 1 : 0);
