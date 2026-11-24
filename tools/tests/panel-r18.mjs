#!/usr/bin/env node
// 利用者モニターの残り（第4回 R5・R7・R8、第7回 R16、第16回 R46）の回帰テスト（Playwright。使い方: node tools/tests/panel-r18.mjs [http://localhost:8898/]）
//  A R46 深夜0〜3時台は「今日食べる人」の外しが残る（アプリの1日は朝4時区切り）。その知らせに「朝4時に元に戻ります」を添える。4時以降は今までどおり。英語・韓国語も
//  B R8  決める前の「家族に送る」も、決めたあとと同じ3段（料理名だけ／買う物も／作り方も）。買う物は冷蔵庫にある物を除く。決めたあとの文と同じ形
//  C R7  はじめての設定のあとに「設定に合わせて…かえました」が出ない。気分を変えたあとに残らない。記録の案内に古い「この献立に決定」の文がない
//  D R16 画面の文・17言語の辞書に案2の言葉「一膳」がない
//  E R5  ベトナム語・韓国語・タイ語の画面で、日本の料理名と材料名がその言葉で出る（英語のままにしない）。冷蔵庫に trứng／계란／ไข่ で卵の料理が見つかる
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const FAM = [{id: 'f1', name: 'ゆい', role: 'adult', avoid: [], allergy: [], mild: false}];
const open = async ({hour = 12, settings = {}, state = {}, tag = '', fresh = false, locale = 'ja-JP'} = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale, timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r18', tag + hour)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({time: new Date(`2026-10-29T${String(hour).padStart(2, '0')}:10:00+09:00`)});
    if (!fresh) await p.addInitScript(([settings, state]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, settings)}, state))); } }, [settings, state]);
    await p.goto(URL_); await ready(p); await p.clock.runFor(800);
    return {p, ctx};
};
const visibleText = p => p.evaluate(() => [...document.querySelectorAll('#view *, #sheet-root *')].filter(e => e.childElementCount === 0).map(e => e.textContent).join('\n'));

// A R46
{
    const L = {ja: ['JP', /ゆいを除いて考えています。朝4時に元に戻ります/, /朝4時/], en: ['US', /leaves out ゆい\. It goes back to everyone at 4 a\.m\./, /4 a\.m\./], ko: ['KR', /ゆい[을를] 빼고 생각했습니다\. 새벽 4시에 원래대로 돌아갑니다/, /4시/]};
    for (const [lang, [cc, re, hint]] of Object.entries(L)) for (const hour of [2, 12]){
        const {p, ctx} = await open({hour, settings: {country: cc, uiLang: lang}, state: {family: FAM, eaters: []}, tag: 'a' + lang});
        const r = await p.evaluate(() => ({line: eatersOutLine(), today: TODAY, shown: [...document.querySelectorAll('#view *')].filter(e => e.childElementCount === 0 && /ゆい/.test(e.textContent)).map(e => e.textContent)}));
        if (hour === 2) ok(re.test(r.line) && r.shown.some(x => re.test(x)) && r.today === '2026-10-28', `A R46 ${lang} 2時: 外しの知らせに「朝4時に元に戻ります」が付き、お膳の下にも出る: ` + JSON.stringify(r));
        else ok(!hint.test(r.line) && /ゆい/.test(r.line), `A R46 ${lang} 12時: 昼は今までどおり（4時の文なし）: ` + JSON.stringify(r));
        await ctx.close();
    }
}
// B R8
{
    const {p, ctx} = await open({tag: 'b'});
    await p.evaluate(() => { S.fridge = ['玉ねぎ', '卵', '豚肉']; save(); render(); });
    await p.click('[data-act=cond-open]'); await p.waitForTimeout(300); await p.click('#sheet-root [data-act=share-menu]'); await p.waitForTimeout(300);
    const pre = await p.evaluate(() => ({card: sheet && sheet.card, src: sheet && sheet.src, lv: sheet && sheet.lv, chips: [...document.querySelectorAll('#sheet-root .share-lv .chip')].map(e => e.textContent), text: document.querySelector('#share-text').value, dishes: session.menu.items.filter(x => x.r).map(x => x.r.name)}));
    ok(pre.card === 'today3' && pre.chips.length === 3 && /料理名だけ/.test(pre.chips[0]) && /買う物も/.test(pre.chips[1]) && /作り方も/.test(pre.chips[2]), 'B R8 決める前の「家族に送る」に3段（料理名だけ／買う物も／作り方も）がある: ' + JSON.stringify(pre.chips));
    ok(/【買う物】/.test(pre.text) && pre.dishes.every(d => pre.text.includes(d)) && !/□ 玉ねぎ|□ 卵\b|□ 豚肉/.test(pre.text), 'B R8 はじめは「買う物も」。料理名と買う物が入り、冷蔵庫にある物（玉ねぎ・卵・豚肉）は買う物に入らない: ' + pre.text.slice(0, 200).replace(/\n/g, '/'));
    await p.click('#sheet-root .share-lv .chip[data-v="3"]'); await p.waitForTimeout(200);
    const t3 = await p.evaluate(() => document.querySelector('#share-text').value);
    ok(t3.length > pre.text.length && /――――/.test(t3) && (t3.match(/― わが家のご飯帖/g) || []).length === 1, 'B R8 「作り方も」で作り方が付き、署名は最後に1回: ' + t3.length);
    await p.click('#sheet-root .share-lv .chip[data-v="1"]'); await p.waitForTimeout(200);
    const t1 = await p.evaluate(() => document.querySelector('#share-text').value);
    ok(!/【買う物】/.test(t1) && pre.dishes.every(d => t1.includes(d)), 'B R8 「料理名だけ」は料理名だけ: ' + t1.replace(/\n/g, '/'));
    // 決めたあとの文と同じ形（同じ献立で、決めたあとの3段と見比べる）
    await p.evaluate(() => { closeSheet(); });
    await p.click('button[data-act=decide]'); await p.waitForTimeout(400);
    const same = await p.evaluate((pre) => ({after1: todayShare3Text(1), after2: todayShare3Text(2), pre1: todayShare3Text(1, 'menu')}), pre);
    ok(same.after1 === t1 && same.after2 === pre.text, 'B R8 決める前の文は、決めたあとの文と同じ形: ' + JSON.stringify({a1: same.after1 === t1, a2: same.after2 === pre.text}));
    await ctx.close();
}
// C R7
{
    const {p, ctx} = await open({tag: 'c', fresh: true});
    await pickCountry(p, 'JP');
    await p.waitForSelector('#sheet-root [data-act=ob-next], #sheet-root [data-act=ob-done]', { timeout: 30000 });
    for (let i = 0; i < 8; i++){ if (await p.locator('#sheet-root [data-act=ob-done]').count()){ await p.click('#sheet-root [data-act=ob-done]'); break; } await p.click('#sheet-root [data-act=ob-next]'); await p.waitForTimeout(150); }
    await p.waitForFunction(() => S.onboarded === true, null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(500);
    const first = await p.evaluate(() => ({ob: S.onboarded, note: !!document.querySelector('#view .avoid-note'), an: !!session.avoidNote, toast: (document.querySelector('#toast-root') || {textContent: ''}).textContent}));
    ok(first.ob && !first.note && !first.an && !/設定に合わせて/.test(first.toast), 'C R7 はじめての設定のあとに「設定に合わせて…かえました」が出ない: ' + JSON.stringify(first));
    // 設定で家族の魚⚠を足して、知らせを出してから、気分を変える → 知らせが残らない
    const r = await p.evaluate(() => { S.family = [{id: 'f1', name: 'ゆい', role: 'adult', avoid: ['@fish'], allergy: ['@fish'], mild: false}]; save(); reconcileMenu(); render(); return {an: !!session.avoidNote, note: !!document.querySelector('#view .avoid-note')}; });
    await p.click('[data-act=cond-open]'); await p.waitForTimeout(300);
    const k = await p.evaluate(() => { const c = [...document.querySelectorAll('#sheet-root [data-act=mood]')].find(e => e.getAttribute('aria-pressed') !== 'true'); return c && c.dataset.k; });
    if (k){ await p.click(`#sheet-root [data-act=mood][data-k="${k}"]`); await p.waitForTimeout(400); await p.evaluate(() => { closeSheet(); setTab('today'); }); await p.waitForTimeout(300); }
    const after = await p.evaluate(() => ({an: !!session.avoidNote, note: !!document.querySelector('#view .avoid-note'), mood: session.mood}));
    ok(!after.note && !after.an, 'C R7 気分を変えたあとに「設定に合わせて…かえました」が残らない: ' + JSON.stringify({before: r, after, k}));
    await p.evaluate(() => { setTab('cook'); gotoStage('table'); }); await p.waitForTimeout(300);
    const rec = await visibleText(p);
    await p.evaluate(() => setTab('log')); await p.waitForTimeout(300);
    const log = await visibleText(p);
    ok(!/この献立に決定/.test(rec + log) && /記録/.test(log), 'C R7 記録の案内（食卓の段・記録）に古い「この献立に決定」の文がない: ' + (rec + ' | ' + log).replace(/\s+/g, ' ').slice(0, 160));
    await ctx.close();
}
// D R16
{
    const bad = [];
    const keys = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/i18n/keys.json'), 'utf8'));
    keys.filter(k => /一膳/.test(k)).forEach(k => bad.push('key: ' + k));
    for (const f of fs.readdirSync(path.join(ROOT, 'gohancho/i18n'))){ const s = fs.readFileSync(path.join(ROOT, 'gohancho/i18n', f), 'utf8'); if (/一膳/.test(s)) bad.push(f); }
    const {p, ctx} = await open({tag: 'd', state: {family: FAM}});
    const texts = [];
    texts.push(await visibleText(p));
    await p.click('[data-act=cond-open]'); await p.waitForTimeout(200); texts.push(await visibleText(p)); await p.evaluate(() => closeSheet());
    await p.click('button[data-act=decide]'); await p.waitForTimeout(400); texts.push(await visibleText(p));
    for (const tb of ['today', 'find', 'week', 'table', 'cook', 'settings']){ await p.evaluate(tb => { try{ setTab(tb); }catch(e){} }, tb); await p.waitForTimeout(200); texts.push(await visibleText(p)); }
    await p.evaluate(() => { try{ laterIfDecided(t('気分'), () => {}, () => {}); }catch(e){} }); await p.waitForTimeout(200); texts.push(await visibleText(p));
    texts.forEach((x, i) => { if (/一膳/.test(x)) bad.push('画面' + i + ': ' + (x.match(/.{0,12}一膳.{0,12}/) || [''])[0]); });
    ok(!bad.length, 'D R16 画面の文・17言語の辞書に「一膳」がない: ' + bad.join(' / '));
    await ctx.close();
}
// E R5
{
    const L = {vi: [/[\u00C0-\u024F\u1EA0-\u1EF9]/i, 'trứng'], ko: [/[가-힣]/, '계란'], th: [/[฀-๿]/, 'ไข่']};
    for (const [lang, [re, egg]] of Object.entries(L)){
        const {p, ctx} = await open({settings: {country: 'JP', uiLang: lang}, tag: 'e' + lang});
        const r = await p.evaluate((egg) => { const names = session.menu.items.filter(x => x.r).map(x => x.r.name), ings = session.menu.items.filter(x => x.r).flatMap(x => x.r.items.map(i => i.label));
            S.fridge = []; addIngredients(egg); const have = fridgeKeys(); const ms = RECIPES.filter(r => !isAvoided(r)).map(r => matchRecipe(swappedRecipe(r), have)).filter(m => m.used > 0);
            return {names, ings: ings.slice(0, 8), fridge: S.fridge.slice(), uses: ms.length, ready: ms.filter(m => !m.miss.length && !m.subs.length).length, egg: ms.some(m => /tamago|dashimaki|tkg|niratama|kanitama/.test(m.r.id)), tr: Object.keys(PACK_TR)}; }, egg);
        ok(r.names.length && r.names.every(n => re.test(n)) && r.ings.every(n => re.test(n) || /^[0-9()]/.test(n)), `E R5 ${lang}: 日本の料理名・材料名がその言葉で出る: ` + JSON.stringify(r.names) + ' ' + JSON.stringify(r.ings));
        ok(r.fridge.length === 1 && r.uses >= 20 && r.ready >= 1 && r.egg, `E R5 ${lang}: 冷蔵庫に「${egg}」で卵の料理が見つかる: ` + JSON.stringify({fridge: r.fridge, uses: r.uses, ready: r.ready, egg: r.egg}));
        await ctx.close();
    }
}
await b.close();
if (errs.length){ fails++; console.log('FAIL JSエラー', errs.slice(0, 3)); }
console.log(`\n${checks - fails}/${checks} ok` + (fails ? `  失敗 ${fails}  [再現: SEED=${SEED}]` : ''));
process.exit(fails ? 1 : 0);
