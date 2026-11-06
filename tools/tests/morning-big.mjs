#!/usr/bin/env node
// R2-15 朝の「いま食べる朝食」の入口 と R2-17 人数・家族15人まで（Playwright。使い方: node tools/tests/morning-big.mjs [http://localhost:9098/]）
//  時計は固定（Asia/Tokyo。朝4・10時・夜・3時台・11時台と、日付2通り）。実際の時刻では結果が変わらない
//  M1 朝（4〜10時台）だけ入口が出る。3時台・11時台・夜は出ない。日付2通りで同じ
//  M2 入口はお膳（絵・名前・かえる・丸）に重ならず、押すと朝食の料理が並び、作り方を開ける。献立は変わらない
//  M3 アレルギー（卵）の人にはハムエッグを出さない（入口も出ない）。朝食の料理がない国には入口を出さない
//  B1 人数 1〜15 のボタンが 195/360/430px × 文字3段階で重ならず、44px 以上で押せる（今日の条件・設定・はじめて）
//  B2 15人分の分量が 2人分の 7.5 倍（材料・手順の文・買い物メモ）。16 や 99 は 15 に丸まる。保存データの 12 はそのまま
//  B3 家族は15人まで登録でき、16人目は断る。15人の行が重ならず押せる
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async ({w = 390, h = 844, hour = 8, date = '2026-10-29', min = 10, settings = {}, state = {}, tag = ''} = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('mbig', tag + w + h + hour + date)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({time: new Date(`${date}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+09:00`)});
    await p.addInitScript(([settings, state]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, settings)}, state))); } }, [settings, state]);
    await p.goto(URL_); await ready(p); await p.clock.runFor(800);
    return {p, ctx};
};
const entry = p => p.evaluate(() => { const e = document.querySelector('#view [data-act=bf-open]'); if (!e) return null; const r = e.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height, vw: innerWidth}; });
const hit = (a, c) => a.x < c.x + c.width && c.x < a.x + a.w && a.y < c.y + c.height && c.y < a.y + a.h;

// M1 時間帯 × 日付2通り
for (const date of ['2026-10-29', '2026-11-03']){
    for (const [hour, min, want] of [[3, 50, false], [4, 0, true], [7, 30, true], [10, 50, true], [11, 5, false], [19, 0, false]]){
        const {p, ctx} = await open({hour, min, date, tag: 'm1'});
        const e = await entry(p);
        ok(!!e === want, `M1 ${date} ${hour}:${String(min).padStart(2, '0')} 入口 ${want ? 'あり' : 'なし'}: ` + JSON.stringify(e));
        await ctx.close();
    }
}
// M2 重ならない・開く・献立は変わらない（195/360/430 × 文字3段階）
for (const w of [195, 360, 430]){
    for (const ts of [undefined, 1, 2]){
        const {p, ctx} = await open({w, h: 844, hour: 6, settings: ts ? {textSize: ts} : {}, tag: 'm2' + ts});
        const g = await p.evaluate(() => {
            const e = document.querySelector('#view [data-act=bf-open]'); if (!e) return null;
            const r = e.getBoundingClientRect(), tr = document.querySelector('#view .tray').getBoundingClientRect();
            return {r: [r.x, r.y, r.width, r.height], tr: [tr.x, tr.y, tr.width, tr.height], cut: e.scrollHeight > e.clientHeight + 1, vw: innerWidth, sw: document.documentElement.scrollWidth};
        });
        ok(g && g.r[3] >= 44 && g.r[0] >= 0 && g.r[0] + g.r[2] <= g.vw + 0.5 && (g.r[1] >= g.tr[1] + g.tr[3] - 0.5) && !g.cut && g.sw <= g.vw + 1, `M2 ${w}px 文字${ts || 0}: 入口がお膳の下で切れず押せる: ` + JSON.stringify(g));
        if (w === 360 && !ts){
            const before = await p.evaluate(() => ({ids: menuIds().join(), cook: JSON.stringify(S.cook || null)}));
            await p.click('#view [data-act=bf-open]'); await p.waitForTimeout(300);
            const sh = await p.evaluate(() => ({n: document.querySelectorAll('#sheet-root [data-act=bf-pick]').length, names: [...document.querySelectorAll('#sheet-root .t b')].map(x => x.textContent)}));
            ok(sh.n >= 1 && sh.names.includes('ハムエッグ'), 'M2 朝食の料理が並ぶ（日本: ハムエッグ）: ' + JSON.stringify(sh));
            await p.click('#sheet-root [data-act=bf-pick]'); await p.waitForTimeout(400);
            const m = await p.evaluate(() => ({modal: !!document.querySelector('#modal-root *') && modalId, ids: menuIds().join(), cook: JSON.stringify(S.cook || null), sheet: !!sheet}));
            ok(!!m.modal && m.modal === 'hamuegg' && !m.sheet, '作り方が開く: ' + JSON.stringify(m));
            ok(m.ids === before.ids && m.cook === before.cook, 'M2 今日の献立は変わらない: ' + JSON.stringify([before, m]));
        }
        await ctx.close();
    }
}
// M3 アレルギー・朝食のない国
{
    const {p, ctx} = await open({hour: 6, settings: {allergy: ['egg'], avoid: ['卵']}, tag: 'm3'});
    const e = await entry(p), has = await p.evaluate(() => breakfastDishes().map(r => r.id));
    ok(!e && !has.includes('hamuegg'), 'M3 卵アレルギーでは入口もハムエッグも出ない: ' + JSON.stringify([e, has]));
    await ctx.close();
}
{
    const out = {};
    for (const cc of ['FR', 'US', 'IN']){
        const {p, ctx} = await open({hour: 6, settings: {country: cc, uiLang: cc === 'FR' ? 'fr' : cc === 'US' ? 'en' : 'hi'}, tag: 'm3' + cc});
        out[cc] = await p.evaluate(() => ({n: breakfastDishes().length, entry: !!document.querySelector('#view [data-act=bf-open]'), bad: breakfastDishes().filter(r => isAvoided(r) || allergyConflict(r)).length}));
        await ctx.close();
    }
    ok(Object.values(out).every(o => o.entry === (o.n > 0) && o.bad === 0), 'M3 入口は朝食の料理がある国だけ: ' + JSON.stringify(out));
    ok(out.US.n > 0 && out.IN.n > 0, 'M3 米国・インドには朝食の入口がある: ' + JSON.stringify(out));
}

// B1 人数 1〜15 のボタン
for (const w of [195, 360, 430]){
    for (const ts of [undefined, 1, 2]){
        const {p, ctx} = await open({w, hour: 19, settings: ts ? {textSize: ts} : {}, tag: 'b1' + ts});
        const chk = async (sel, label) => {
            const g = await p.evaluate(sel => {
                const cs = [...document.querySelectorAll(sel)].map(e => { const r = e.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height, t: e.textContent}; });
                let ov = 0; for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++){ const a = cs[i], c = cs[j]; if (a.x < c.x + c.w - 0.5 && c.x < a.x + a.w - 0.5 && a.y < c.y + c.h - 0.5 && c.y < a.y + a.h - 0.5) ov++; }
                return {n: cs.length, ov, minH: Math.min(...cs.map(c => c.h)), minW: Math.min(...cs.map(c => c.w)), out: cs.filter(c => c.x < -0.5 || c.x + c.w > innerWidth + 0.5).length, sw: document.documentElement.scrollWidth, vw: innerWidth};
            }, sel);
            ok(g.n === 15 && g.ov === 0 && g.minH >= 40 && g.minW >= 40 && g.out === 0 && g.sw <= g.vw + 1, `B1 ${w}px 文字${ts || 0} ${label}: 15個が重ならず押せる: ` + JSON.stringify(g));
        };
        await p.click('#view [data-act=cond-open]'); await p.waitForTimeout(300);
        await chk('#sheet-root [data-act=servings]', '条件のシート');
        await p.evaluate(() => closeSheet()); await p.evaluate(() => setTab('settings')); await p.waitForTimeout(300);
        await chk('#view [data-act=servings]', '設定');
        await ctx.close();
    }
}
{
    const {p, ctx} = await open({w: 195, hour: 19, tag: 'b1ob', state: {onboarded: false}});
    const n = await p.evaluate(() => { sheet = {kind: 'onboard', step: 0, cc: S.settings.country, servings: 3, count: 4, avoid: new Set(), staples: new Set(), alg: new Set()}; renderSheet(); return document.querySelectorAll('#sheet-root [data-act=ob-sv]').length; });
    ok(n === 15, 'B1 はじめての人数も15個: ' + n);
    await ctx.close();
}

// B2 分量
{
    const {p, ctx} = await open({hour: 19, settings: {servings: 3}, tag: 'b2'});
    const r = await p.evaluate(() => {
        const out = {};
        const mk = n => { S.settings.servings = n; return {sv: svToday(), f: servingFactor(true), t: scaleText('鶏肉 200g・水 400ml・卵 2個', servingFactor(true)), st: scaleSteps('塩 小さじ1と水200mlを入れる', servingFactor(true), []).s}; };
        out.a2 = mk(2); out.a10 = mk(10); out.a12 = mk(12); out.a15 = mk(15);
        return out;
    });
    ok(r.a15.sv === 15 && r.a15.f === 7.5 && /1500g/.test(r.a15.t) && /3000ml/.test(r.a15.t) && /15個/.test(r.a15.t), 'B2 15人分は2人分の7.5倍: ' + JSON.stringify(r.a15));
    ok(r.a12.sv === 12 && r.a12.f === 6 && /1200g/.test(r.a12.t) && /12個/.test(r.a12.t), 'B2 12人分は6倍: ' + JSON.stringify(r.a12));
    await ctx.close();
}
{
    // 保存データ: 12 はそのまま、16・99 は 15 に丸める（読みこみ時）
    const res = {};
    for (const v of [12, 15, 16, 99]){
        const {p, ctx} = await open({hour: 19, settings: {servings: v}, tag: 'b2s' + v});
        res[v] = await p.evaluate(() => S.settings.servings);
        await ctx.close();
    }
    ok(res[12] === 12 && res[15] === 15 && res[16] === 15 && res[99] === 15, 'B2 保存した人数の丸め（12→12・16→15・99→15）: ' + JSON.stringify(res));
    // 買い物メモ（1週間プラン）の合計が人数に比例して伸びる
    const {p, ctx} = await open({hour: 19, settings: {servings: 2}, tag: 'b2shop'});
    const sh = await p.evaluate(() => {
        const dayKeys = Array.from({length: 5}, (_, i) => addDays(TODAY, i));
        const ids = RECIPES.filter(r => r.main && !isAvoided(r) && !breakfastMeal(r)).slice(0, 5).map(r => r.id);
        S.week = {days: dayKeys.map((d, i) => ({d, id: ids[i]})), made: TODAY};
        const sum = n => { S.settings.servings = n; const html = shoppingHtml(); return html.replace(/<[^>]+>/g, ' ').match(/\d+(?:\.\d+)?/g) ? html.length : 0; };
        const qty = n => { S.settings.servings = n; const t = shoppingHtml().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); return t; };
        return {t2: qty(2).slice(0, 400), t15: qty(15).slice(0, 400), l: [sum(2), sum(15)]};
    });
    ok(sh.t2 !== sh.t15 && sh.t15.length > 20, 'B2 買い物メモは15人分で量が変わる: ' + JSON.stringify(sh));
    await ctx.close();
}

// B3 家族15人
{
    const fam = Array.from({length: 14}, (_, i) => ({id: 'f' + i, name: 'かぞく' + (i + 1), role: i % 3 === 0 ? 'child' : 'adult', avoid: [], allergy: [], mild: false}));
    for (const w of [195, 360, 430]){
        const {p, ctx} = await open({w, hour: 19, state: {family: fam}, tag: 'b3' + w});
        await p.evaluate(() => setTab('settings')); await p.waitForTimeout(300);
        await p.evaluate(() => { const d = document.querySelector('#set-family'); d && (d.open = true); });
        await p.click('#view [data-act=fam-add]'); await p.waitForTimeout(300);
        const n15 = await p.evaluate(() => ({n: famMembers().length, add: !!document.querySelector('#view [data-act=fam-add]')}));
        ok(n15.n === 15 && !n15.add, `B3 ${w}px 15人目まで登録でき、そこで追加ボタンが消える: ` + JSON.stringify(n15));
        await p.evaluate(() => { const before = famMembers().length; const el = document.createElement('button'); el.dataset.act = 'fam-add'; document.body.appendChild(el); el.click(); el.remove(); return before; });
        const n16 = await p.evaluate(() => famMembers().length);
        ok(n16 === 15, `B3 ${w}px 16人目は断る: ` + n16);
        const g = await p.evaluate(() => { const hs = [...document.querySelectorAll('#view .fam-row, #view [data-act=fam-open], #view [data-act=fam-toggle]')].map(e => e.getBoundingClientRect()); return {n: hs.length, sw: document.documentElement.scrollWidth, vw: innerWidth}; });
        ok(g.sw <= g.vw + 1, `B3 ${w}px 家族15人でも横にはみ出さない: ` + JSON.stringify(g));
        // 今日食べる人（条件のシート）
        await p.evaluate(() => setTab('today')); await p.waitForTimeout(300);
        await p.click('#view [data-act=cond-open]'); await p.waitForTimeout(300);
        const eg = await p.evaluate(() => { const cs = [...document.querySelectorAll('#sheet-root .chips [data-act]')].filter(e => e.closest('.field') && /今日食べる人/.test(e.closest('.field').textContent)).map(e => { const r = e.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; }); let ov = 0; for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++){ const a = cs[i], c = cs[j]; if (a.x < c.x + c.w - 0.5 && c.x < a.x + a.w - 0.5 && a.y < c.y + c.h - 0.5 && c.y < a.y + a.h - 0.5) ov++; } return {n: cs.length, ov, minH: Math.min(...cs.map(c => c.h))}; });
        ok(eg.n >= 15 && eg.ov === 0 && eg.minH >= 40, `B3 ${w}px 今日食べる人の15個が重ならず押せる: ` + JSON.stringify(eg));
        await ctx.close();
    }
}
await b.close();
ok(!errs.length, 'ページのエラーなし: ' + errs.join(' / '));
console.log(fails ? `\n${fails} 件失敗` : '\n全部通りました');
process.exit(fails ? 1 : 0);
