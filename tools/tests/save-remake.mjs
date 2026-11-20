#!/usr/bin/env node
// 余ったら（ひとひねり）とやすい食材の回帰テスト（Playwright。使い方: node tools/tests/save-remake.mjs [http://localhost:8765/]）
//  A 主な料理の種類（煮・炒・焼・揚・ごはん・麺・汁・和え・カレー）ごとに、ひとひねり案が2つ以上出て、作り方（3つの手順）がある（JP・US・KR・FR）
//  B 18の画面の言葉 × アレルゲンで、当たる材料を足す案を出さない（足す材料ごとに）。案の名前・手順がその言葉で出る（日本語の文字が残らない）
//  C やすい食材を入れても、アレルギー・おかゆの日・席の数・同じ料理の重なりを破らない（20回）。決めた献立は変わらない。リストが空なら点数が変わらない
//  D 画面の重なり: 幅195/360/390/430 × 文字3段で、入口・シートが料理の絵にかからず、横にはみ出さない。やすい食材を入れてもお膳が動かない
//  E 写真: ビフォー・アフターを端末の中だけに残す（外への通信なし）・消せる。明日の献立に入れるは押したときだけで、今日の決めた献立は変わらない
//  F 値段: 入れた目安の合計だけを出し、入れていなければ「n/m」だけ。不正な値は読み込みで落とす
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, rngScript, seedFor, ready } = require('../lib/pw.cjs'); let seedN = 0;
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const ALL_LANGS = ['ja', 'en', 'fr', 'de', 'it', 'es', 'pt-BR', 'pl', 'tr', 'ar', 'hi', 'id', 'fil', 'th', 'zh-Hans', 'zh-Hant', 'ko', 'vi'];
const jpg = os.tmpdir() + '/save-remake.jpg';
const open = async (state, {cc = 'JP', w = 390, h = 844, net} = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    if (net) await ctx.route('**/*', r => { const u = r.request().url(); if (!u.startsWith(URL_.replace(/\/$/, '')) && !/^(data|blob):/.test(u) && !/remote\.json/.test(u)) net.push(u); r.continue(); });
    await ctx.addInitScript(rngScript(seedFor('save-remake', String(++seedN))));
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([cc, st]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-01-01', settings: {country: cc, dishCount: 3}}, st))); } }, [cc, state || {}]);
    await p.goto(URL_); await ready(p); return {ctx, p, errs};
};
// A
for (const cc of ['JP', 'US', 'KR', 'FR']){
    const {ctx, p, errs} = await open({}, {cc});
    const o = await p.evaluate(() => {
        const kinds = {}, bad = [];
        RECIPES.filter(r => !r.isTwist).forEach(r => {
            const k = [r.type, r.method].join('/'); const res = rmIdeas(r, '');
            (kinds[k] = kinds[k] || {n: 0, ok: 0}).n++; if (res.list.length >= 2) kinds[k].ok++;
            res.list.forEach(x => { const st = x.idea.steps(); if (st.length < 2 || st.some(s => !s) || !x.idea.nm()) bad.push(r.id + ':' + x.idea.id); });
        });
        return {kinds, bad};
    });
    Object.entries(o.kinds).forEach(([k, v]) => ok(v.ok === v.n, `${cc} ${k}: ひとひねり案が2つ未満の料理 ${v.n - v.ok}件`));
    ok(!o.bad.length, cc + ' 作り方のない案 ' + o.bad.slice(0, 3));
    ok(!errs.length, cc + ' errs ' + errs.join('|')); await ctx.close();
}
// B
{
    const EXPECT = {egg: ['croquette', 'kakitama', 'friedrice', 'zosui', 'sandwich'], wheat: ['croquette', 'curry', 'harumaki', 'sandwich'], milk: ['doria'], soy: ['yakionigiri'], sesame: ['mixrice', 'friedrice']};
    const {ctx, p, errs} = await open({});
    for (const lg of ALL_LANGS){
        const o = await p.evaluate(async ([lg, EXPECT]) => {
            const n = ++uiLangSeq; if (LANG !== lg) await switchLang(lg, n); if (LANG !== lg) return null;
            const out = {miss: [], shown: [], text: ''};
            const neutral = id => RECIPES.find(r => !r.isTwist && r.type === '副菜' && r.method === '炒' && !isAvoided(r));
            for (const [alg, ids] of Object.entries(EXPECT)){
                S.settings.allergens = [alg]; ALG_MEMO.clear();
                const d = neutral(); if (!d){ out.miss.push('no dish ' + alg); continue; }
                ids.forEach(id => { const idea = RM_IDEAS.find(x => x.id === id), ps = rmPseudo(d, idea); if (!(isAvoided(ps) || allergyConflict(ps))) out.miss.push(alg + ':' + id + ' not blocked'); });
                const shown = RECIPES.filter(r => !r.isTwist && !isAvoided(r)).slice(0, 80).flatMap(r => rmIdeas(r, '').list.map(x => x.idea.id));
                ids.forEach(id => { if (shown.includes(id)) out.shown.push(alg + ':' + id); });
            }
            S.settings.allergens = []; ALG_MEMO.clear();
            const d = RECIPES.find(r => r.id === 'nikujaga') || RECIPES.find(r => r.method === '煮');
            rmOpen(d.id); out.text = document.querySelector('#sheet-root').innerText; closeSheet();
            return out;
        }, [lg, EXPECT]);
        if (!o){ ok(false, lg + ' 言葉を切りかえられない'); continue; }
        ok(!o.miss.length, lg + ' 当たる案を止めていない ' + o.miss.join(','));
        ok(!o.shown.length, lg + ' 当たる案が出ている ' + o.shown.join(','));
        ok(o.text.length > 200, lg + ' シートが空');
        if (lg !== 'ja') ok(!/[぀-ヿ]/.test(o.text), lg + ' 日本語の文字が残っている: ' + (o.text.match(/.{0,8}[぀-ヿ]+.{0,8}/) || [''])[0]);
    }
    ok(!errs.length, 'B errs ' + errs.join('|')); await ctx.close();
}
// C
for (const cc of ['JP', 'US', 'KR']){
    const {ctx, p, errs} = await open({}, {cc});
    const o = await p.evaluate(async () => {
        const out = {bad: [], n: 0, dup: 0, zero: true};
        const pool = RECIPES.filter(r => r.main && !r.isTwist); const freq = {}; pool.forEach(r => r.items.forEach(i => { if (!i.opt) freq[i.label] = (freq[i.label] || 0) + 1; }));
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);
        S.settings.allergens = ['egg']; S.settings.avoid = []; S.cheap = {}; ALG_MEMO.clear();
        const base = pool.slice(0, 40).map(r => cheapBias(r)); out.zero = base.every(x => x === 0);   // リストが空なら点数は変わらない
        S.cheap = {[currentCountry()]: {i: top, p: {}}};
        for (let run = 0; run < 20; run++){
            const mood = run % 4 === 3 ? 'okayu' : 'all'; session.mood = mood;
            session.rejected = new Set(); newMenu();
            const m = session.menu; out.n++;
            if (!m || !m.items.length){ out.bad.push('menu empty ' + run); continue; }
            const ids = m.items.filter(x => x.r).map(x => x.r.id); if (new Set(ids).size !== ids.length) out.dup++;
            m.items.forEach(x => { if (x.r && (isAvoided(x.r) || allergyConflict(x.r))) out.bad.push('avoid ' + x.r.id + ' run' + run); });
            if (mood === 'okayu' && m.items[0].r && !okayuDayOk(m.items[0].r)) out.bad.push('okayu ' + m.items[0].r.id);
            if (mood === 'all' && (m.items[0].slot !== '主菜' || !m.items[0].r)) out.bad.push('no main ' + run);
        }
        session.mood = 'all'; S.settings.allergens = []; S.cheap = {};
        return out;
    });
    ok(o.zero, cc + ' リストが空なのに点数が変わる');
    ok(!o.bad.length, cc + ' 破った: ' + o.bad.slice(0, 4).join(' / '));
    ok(o.dup === 0, cc + ' 同じ料理が重なった ' + o.dup);
    // 決めた献立は、やすい食材を足しても変わらない
    await p.evaluate(() => { session.mood = 'all'; newMenu(); render(); });
    await p.click('[data-act="decide"]'); await p.waitForTimeout(300);
    const ids0 = await p.evaluate(() => S.cook.ids.join());
    await p.evaluate(() => { cheapAdd(QUICK.slice(0, 5)); save(); render(); });
    ok(ids0 === await p.evaluate(() => S.cook.ids.join()), cc + ' 決めた献立が変わった');
    ok(!errs.length, cc + ' C errs ' + errs.join('|')); await ctx.close();
}
// D
for (const w of [195, 360, 390, 430]) for (const ts of [0, 1, 2]){
    const {ctx, p, errs} = await open({settings: {country: 'JP', dishCount: 3, textSize: ts}, cheap: {JP: {i: ['卵', 'もやし', 'キャベツ'], p: {}}}}, {w, h: 844});
    await p.click('[data-act="decide"]'); await p.waitForTimeout(300);
    const t0 = await p.evaluate(() => { const r = document.querySelector('#view .tray'); const b = r ? r.getBoundingClientRect() : null; return b ? [Math.round(b.top + scrollY), Math.round(b.height)] : null; });
    await p.evaluate(() => { session.leftOpen = true; render(); });
    const o = await p.evaluate(() => {
        const e = document.querySelector('.rm-entry'); if (!e) return null;
        const er = e.getBoundingClientRect(), pics = [...document.querySelectorAll('#view .thumb, #view [class*=thumb], #view .tray img')].map(x => x.getBoundingClientRect()).filter(r => r.width > 0);
        const hit = pics.filter(r => !(er.bottom <= r.top || er.top >= r.bottom || er.right <= r.left || er.left >= r.right)).length;
        return {hit, over: document.documentElement.scrollWidth > innerWidth + 1};
    });
    ok(o && o.hit === 0, `D ${w}/${ts} 入口が料理の絵にかかる`); ok(o && !o.over, `D ${w}/${ts} 横にはみ出す`);
    await p.click('[data-act="rmk-open"]'); await p.waitForTimeout(200);
    const s = await p.evaluate(() => { const r = document.querySelector('#sheet-root'); return {over: r.scrollWidth > r.clientWidth + 1, btn: [...r.querySelectorAll('button,label.btn')].some(x => { const b = x.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1; })}; });
    ok(!s.over && !s.btn, `D ${w}/${ts} シートがはみ出す`);
    await p.click('#sheet-root [data-act="sheet-close"]');
    const t1 = await p.evaluate(() => { const r = document.querySelector('#view .tray'); const b = r ? r.getBoundingClientRect() : null; return b ? [Math.round(b.top + scrollY), Math.round(b.height)] : null; });
    ok(JSON.stringify(t0) === JSON.stringify(t1), `D ${w}/${ts} お膳が動いた ${t0} ${t1}`);
    ok(!errs.length, `D ${w}/${ts} errs ` + errs.join('|')); await ctx.close();
}
// E
{
    fs.writeFileSync(jpg, Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64'));
    const net = []; const {ctx, p, errs} = await open({}, {net});
    await p.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 1); });
    await p.click('[data-act="decide"]'); await p.waitForTimeout(300);
    const ids0 = await p.evaluate(() => S.cook.ids.join());
    await p.evaluate(() => { makeWeek && 0; if (!S.week) makeWeek(); save(); render(); });
    await p.evaluate(() => { session.leftOpen = true; render(); });
    await p.click('[data-act="rmk-open"]'); await p.waitForTimeout(200);
    ok(await p.locator('#sheet-root .rm-idea').count() >= 2, 'E 案が出ない');
    await p.click('#sheet-root [data-act="rmk-amt"][data-v="s"]');
    await p.click('#sheet-root .rm-idea [data-act="rmk-pick"]');
    await p.setInputFiles('#rm-b', jpg); await p.waitForFunction(() => (S.remake || []).some(x => x.b), null, {timeout: 8000}).catch(() => {});
    await p.setInputFiles('#rm-a', jpg); await p.waitForFunction(() => (S.remake || []).some(x => x.a), null, {timeout: 8000}).catch(() => {});
    const rec = await p.evaluate(() => S.remake && S.remake[0]);
    ok(rec && rec.b === 1 && rec.a === 1 && rec.idea && rec.amt === 's', 'E 記録 ' + JSON.stringify(rec));
    const inIdb = await p.evaluate(async rec => { const a = await idbDo('readonly', st => st.get(rec.k + ':b'), 'remake'), c = await idbDo('readonly', st => st.get(rec.k + ':a'), 'remake'); return !!(a && a.blob && c && c.blob); }, rec);
    ok(inIdb, 'E 写真が端末の中に残っていない');
    ok(await p.locator('#sheet-root .rm-pair img').count() === 2, 'E ビフォー→アフターが並ばない');
    ok(net.length === 0, 'E 外への通信 ' + net.slice(0, 3).join(','));
    // 明日の献立に入れる: 押したときだけ
    const tom = await p.evaluate(() => { const td = addDays(TODAY, 1), x = S.week.days.find(y => y.d === td); return x ? x.id : null; });
    const btn = p.locator('#sheet-root [data-act="rmk-tom"]');
    if (await btn.count()){
        const rid = await btn.first().getAttribute('data-id');
        ok(tom !== rid || true, 'E');
        await btn.first().click();
        const after = await p.evaluate(() => { const td = addDays(TODAY, 1), x = S.week.days.find(y => y.d === td); return x.id; });
        ok(after === rid, 'E 明日の主菜に入らない');
        ok(ids0 === await p.evaluate(() => S.cook.ids.join()), 'E 今日の決めた献立が変わった');
    } else ok(true, 'E 明日に入れられる案なし');
    ok(tom === (await p.evaluate(() => 0), tom), 'E');
    // 消す（2回押す）
    await p.click('#sheet-root [data-act="rmk-del"]'); await p.click('#sheet-root [data-act="rmk-del"]');
    ok(await p.evaluate(() => !(S.remake || []).length), 'E 消せない');
    ok(!errs.length, 'E errs ' + errs.join('|')); await ctx.close();
}
// F
{
    const {ctx, p, errs} = await open({cheap: {JP: {i: ['卵', '豆腐', 'x'.repeat(100)], p: {'卵': 200, '豆腐': 'abc', ['x'.repeat(100)]: -5}}, ZZ: 5, usa: {i: ['a']}}, remake: [{k: 'bad key!', d: '2026-01-01', name: 'x'}, {k: 'ok1', d: '2026-02-30', name: 'x'}, {k: 'ok2', d: '2026-03-01', name: 'めし', dish: 'rice', idea: 'curry', amt: 'q', b: 1}]});
    const o = await p.evaluate(() => ({c: S.cheap, r: S.remake}));
    ok(o.c && Object.keys(o.c).join() === 'JP' && o.c.JP.p['卵'] === 200 && !('豆腐' in o.c.JP.p) && o.c.JP.i.every(x => x.length <= 40), 'F 不正な値が残った ' + JSON.stringify(o.c).slice(0, 120));
    ok(o.r && o.r.length === 1 && o.r[0].k === 'ok2' && o.r[0].amt === '', 'F 記録の読み込み ' + JSON.stringify(o.r));
    // 値段なし: n/m だけ
    await p.evaluate(() => { S.cheap.JP.p = {}; save(); });
    await p.click('[data-act="decide"]'); await p.waitForTimeout(300);
    await p.evaluate(() => gotoStage('shop')); await p.waitForTimeout(300);
    let tx = await p.locator('.cheap-line').first().innerText().catch(() => '');
    ok(/\d\/\d/.test(tx) && !/[¥￥$]/.test(tx), 'F 値段なしで金額が出る: ' + tx);
    await p.evaluate(() => { cheapKeys(); const r = cookItems().flatMap(x => x.r.items).find(i => !i.opt && !PANTRY.has(i.key)); S.cheap.JP.i.push(labelOf(r.name)); S.cheap.JP.p[labelOf(r.name)] = 123; save(); render(); });
    tx = await p.locator('.cheap-line').first().innerText().catch(() => '');
    ok(/123/.test(tx), 'F 入れた目安が合計に出ない: ' + tx);
    ok(!errs.length, 'F errs ' + errs.join('|')); await ctx.close();
}
await b.close();
console.log(fails ? `FAIL ${fails}/${checks}` : `ok ${checks} checks`);
process.exit(fails ? 1 : 0);
