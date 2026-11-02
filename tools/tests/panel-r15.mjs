#!/usr/bin/env node
// 利用者モニター第15回の直し（安全）。Playwright。使い方: node tools/tests/panel-r15.mjs [http://localhost:8999/]
//  S27: 「今日食べる人」から外した家族・「ときどき一緒に食べる」家族のアレルギーも、1週間プラン（1週間分を考える・別の案・○つけ表から組む・選び直し）と
//       1週間の買い物メモには効く（家族みんなのアレルギーで見る）。行の ⚠・買い物メモの ⚠ も家族みんなで見る。
//       今日の献立は今までどおり今日食べる人で考えるが、外した人の名前を出す。「今日食べる人」は今日だけ（日付が替わったら戻る）。明日の案も明日の形で考える
//  R42: 1週間の買い物メモの ⚠ の文は、保存した献立の文ではなく専用の文（17言語）
//  R43: きのう明日へまわした献立のお知らせで、当たる料理の名前に ⚠ を付ける
//  R44: 料理の詳細の「今日これを作る」で当たる料理を入れるときは、アレルゲンの名前を出して確かめる。入れたあとは「入れていません」「食べられるお膳です」と言わない
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const FAMS = ['egg', 'fish', 'shellfish', 'dairy'];
const open = async (settings, tag, st0 = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r15', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(([st, s0]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, st)}, s0))); } }, [settings, st0]);
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
// 家族（長男）を足して、そのアレルギー（家族の区分 fk）を付ける。how: out（今日食べる人から外す）・some（ときどき一緒に食べる）
const famSet = (p, fk, how) => p.evaluate(([fk, how]) => {
    S.family = [{id: 'r15', name: '長男', role: 'child', allergy: ['@' + fk], avoid: ['@' + fk], mild: false}];
    if (how === 'some') S.family[0].sometimes = true;
    if (how === 'out') setEaters(['__me']);
    save(); reconcileMenu(); refreshWeek(); render();
    return {members: eaterMembers().map(m => m.name), out: eatersOut().map(m => m.name)};
}, [fk, how]);
// 1週間プラン（今日から先の作る日の主菜と副菜・汁もの）のうち、その家族のアレルゲン（FAM_ALG）に当たる料理
const planHits = (p, fk) => p.evaluate(fk => weekAlg(() => weekDishesOf(S.week).filter(r => algSelectedHits(byId(r.id), FAM_ALG[fk]).length || allergyConflict(byId(r.id))).map(r => r.name)), fk);   // 料理は家族みんなの形（だしの置き換えなど）で見る

// R15-1 今日食べる人から外した家族・ときどきの家族のアレルギーで、1週間分を考える・選び直す・別の案に当たる料理が入らない
for (const how of ['out', 'some']){
    const {p, ctx} = await open({weekSides: true}, 'week-' + how);
    let bad = [], n = 0;
    for (const fk of FAMS){
        const s = await famSet(p, fk, how);
        if (n === 0) ok(!s.members.includes('長男') && s.out.includes('長男'), `R15-1 ${how} 長男は今日の献立では外れている: ` + JSON.stringify(s));
        for (let k = 0; k < 3; k++){
            await p.evaluate(() => { makeWeek(); ensureWeekExtras(); render(); }); n++;
            const h = await planHits(p, fk); if (h.length) bad.push(fk + ':' + h.join('・'));
        }
        // 別の案（画面のボタン）を何回か
        for (let k = 0; k < 4; k++){
            const d = await p.evaluate(k => { const xs = S.week.days.filter(x => x.d > TODAY && !x.skip); const x = xs[k % xs.length]; sheet = {kind: 'wday', d: x.d}; renderSheet(); return x.d; }, k);
            const rr = p.locator('#sheet-root [data-act=week-reroll]'); if (await rr.count()) await rr.first().click(); await p.waitForTimeout(80);
            await p.evaluate(() => { if (sheet) closeSheet(); });
            const h = await planHits(p, fk); if (h.length) bad.push(fk + ' reroll ' + d + ':' + h.join('・'));
        }
    }
    ok(n === 12 && !bad.length, `R15-1 ${how} 1週間分を考える12回と別の案16回で、長男のアレルゲンの料理がプランに入らない: ` + JSON.stringify(bad.slice(0, 5)));
    await ctx.close();
}

// R15-2 プランに当たる料理が残っているとき（アレルギーを足す前に組んだ日など）、外した家族の分でも、行と買い物メモに ⚠。文は1週間の買い物メモ専用（R42）
{
    const {p, ctx} = await open({}, 'shop-warn');
    const r = await p.evaluate(() => {
        for (let k = 0; k < 20; k++){
            makeWeek();
            const xs = visiblePlanDays();
            const fk = Object.keys(FAM_ALG).find(f => xs.some(x => algSelectedHits(byId(x.id), FAM_ALG[f]).length) && !xs.every(x => algSelectedHits(byId(x.id), FAM_ALG[f]).length));
            if (!fk) continue;
            S.family = [{id: 'r15', name: '長男', role: 'child', allergy: ['@' + fk], avoid: ['@' + fk]}]; setEaters(['__me']); save();   // 選び直し（refreshWeek）は通さない: 当たる料理がプランに残る
            setTab('today'); render(); document.querySelectorAll('#view details').forEach(d => d.open = true);
            const hitNames = xs.filter(x => algSelectedHits(byId(x.id), FAM_ALG[fk]).length).map(x => byId(x.id).name);
            const rows = [...document.querySelectorAll('#view .list.week .item')].filter(e => e.querySelector('.badge.allergy')).map(e => (e.querySelector('.wnm') || {}).textContent);
            const box = document.createElement('div'); box.innerHTML = shoppingHtml();
            const head = (box.querySelector('.alg-shop-hit') || {}).textContent || '';
            return {fk, hitNames, rows, head, todayHit: allergyConflict(byId(hitNames[0])), share: weekShareText().length > 0};
        }
        return null;
    });
    ok(!!r, 'R15-2 プランの一部にだけ当たる家族のアレルゲンが見つかる');
    if (r){
        ok(r.hitNames.every(n => r.rows.includes(n)), 'R15-2 外した家族のアレルゲンでも、プランの行に ⚠ が付く: ' + JSON.stringify({hit: r.hitNames, rows: r.rows}));
        ok(r.hitNames.every(n => r.head.includes(n)) && /1週間プラン/.test(r.head) && !/今日の献立にするときは/.test(r.head), 'R15-2 買い物メモの上に、当たる料理の名前の ⚠（1週間プランの文）: ' + JSON.stringify(r.head));
    }
    await ctx.close();
}
// R15-2b R42: 新しい文は17言語すべてにあり、保存した献立の文の訳と同じではない
{
    const html = fs.readFileSync(path.join(ROOT, 'gohancho', 'index.html'), 'utf8');
    const K = '⚠ 1週間プランの「{names}」は、選んでいるアレルゲンや家族のアレルギーを使う料理です。買う前に、プランの「変更」から別の案にできます。';
    const OLD = '⚠ 「{names}」は、選んでいるアレルゲンや家族のアレルギーを使う料理です。今日の献立にするときは、その枠だけ選び直します。';
    const keys = [K, OLD, '⚠ 「{names}」は、選んでいるアレルゲンや家族のアレルギーを使う料理です。今日の案にすると、その料理だけ選び直します。', '今日の献立は、{names}を除いて考えています', '今日食べる人は今日だけの設定です。明日は元に戻ります。', '1週間プランと買い物メモは、家族みんなのアレルギーで考えます。', '「{name}」は、アレルゲン（{list}）を使う料理です', '今日の作り方に入れますか？食べる人のアレルギーを、もう一度確かめてください。', '⚠ 確かめたうえで作る'];
    ok(html.includes(`t('${K}'`) && (html.match(/alg-shop-hit/g) || []).length >= 1 && !new RegExp(`alg-shop-hit[^\\n]*${OLD.slice(2, 12)}[^\\n]*今日の献立にするときは`).test(html), 'R15-2b 1週間の買い物メモは専用の文を使う');
    const miss = [];
    for (const L of 'ar de en es fil fr hi id it ko pl pt-BR th tr vi zh-Hans zh-Hant'.split(' ')){
        let d = null; const GOHAN_I18N = (l, o) => { d = o; }; new Function('GOHAN_I18N', fs.readFileSync(path.join(ROOT, 'gohancho', 'i18n', L + '.js'), 'utf8'))(GOHAN_I18N);
        keys.forEach(k => { if (!d[k]) miss.push(L + ':' + k.slice(0, 12)); });
        if (d[K] && d[K] === d[OLD]) miss.push(L + ': same as saved');
        if (L === 'en' && !/weekly plan/i.test(d[K] || '')) miss.push('en: not weekly plan');
        if (/saved|저장|保存|儲存|enregistr|gespeichert|guardado|salvo|zapisan|kayıtlı|đã lưu|บันทึก|naka-save|tersimpan|सहेजे|المحفوظة|salvato/i.test(d[K] || '')) miss.push(L + ': says saved');
    }
    ok(!miss.length, 'R15-2b 新しい文が17言語にあり、「保存した献立」と訳されていない: ' + JSON.stringify(miss.slice(0, 6)));
}

// R15-3 今日の献立は今日食べる人で考える（外した人は今日の献立では見ない）が、外した人の名前をお膳の下と条件の画面に出す
{
    const {p, ctx} = await open({}, 'today-out');
    await famSet(p, 'egg', null);
    await p.evaluate(() => { openCondSheet(); }); await p.waitForTimeout(200);
    const before = await p.evaluate(() => ({out: document.querySelectorAll('#sheet-root .eaters-out').length}));
    await p.locator('#sheet-root [data-act=eater][data-v=r15]').click(); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({eaters: S.eaters, d: S.eatersD, today: TODAY, sheet: (document.querySelector('#sheet-root') || {}).innerText || '', }));
    await p.evaluate(() => { closeSheet(); setTab('today'); render(); }); await p.waitForTimeout(200);
    const v = await p.evaluate(() => ({line: (document.querySelector('#view .eaters-line') || {}).textContent || '', cond: (document.querySelector('#view [data-act=cond-open]') || {getAttribute: () => ''}).getAttribute('aria-label'), members: eaterMembers().map(m => m.name)}));
    ok(before.out === 0, 'R15-3 みんなが食べるときは、外した人の文は出ない');
    ok(Array.isArray(r.eaters) && r.d === r.today, 'R15-3 今日食べる人を選ぶと、選んだ日も残す: ' + JSON.stringify({e: r.eaters, d: r.d}));
    ok(/長男を除いて考えています/.test(r.sheet) && /今日だけの設定/.test(r.sheet) && /家族みんなのアレルギー/.test(r.sheet), 'R15-3 条件の画面に、外した人・今日だけ・1週間プランは家族みんな、が出る: ' + JSON.stringify(r.sheet.slice(-300)));
    ok(!v.members.includes('長男') && /長男を除いて考えています/.test(v.line) && /長男を除いて/.test(v.cond || ''), 'R15-3 お膳の下と条件のボタンに、外した人の名前が出る（今日の献立は外したまま）: ' + JSON.stringify(v));
    // ときどきの家族（いつものメンバー）も、外していることを出す
    const s = await p.evaluate(() => { setEaters(null); S.family[0].sometimes = true; save(); render(); return (document.querySelector('#view .eaters-line') || {}).textContent || ''; });
    ok(/長男を除いて考えています/.test(s), 'R15-3 ときどき一緒に食べる家族を外しているときも名前が出る: ' + JSON.stringify(s));
    await ctx.close();
}

// R15-4 「今日食べる人」は今日だけ: 次の日に開くと家族みんなに戻り、外していた家族のアレルゲンの料理は今日の献立に出ない。同じ日に開き直したときはそのまま
for (const fk of ['egg', 'fish', 'dairy']){
    const {p, ctx} = await open({}, 'nextday-' + fk);
    await famSet(p, fk, 'out');
    await p.evaluate(() => { makeWeek(); saveNow(); });
    await p.reload(); await ready(p);
    const same = await p.evaluate(() => ({eaters: S.eaters, members: eaterMembers().map(m => m.name)}));
    ok(Array.isArray(same.eaters) && !same.members.includes('長男'), `R15-4 ${fk} 同じ日に開き直しても、今日食べる人はそのまま: ` + JSON.stringify(same));
    // 前の日に選んだ形にして開き直す（選んだ日を前の日にする）
    await p.evaluate(() => { S.eatersD = addDays(TODAY, -1); saveNow(); });
    await p.reload(); await ready(p);
    const r = await p.evaluate(fk => { const menu = session.menu ? session.menu.items.map(x => x.r).filter(Boolean) : [];
        return {eaters: S.eaters, members: eaterMembers().map(m => m.name), menuHit: menu.filter(r => algSelectedHits(r, FAM_ALG[fk]).length).map(r => r.name), planHit: weekDishesOf(S.week).filter(r => algSelectedHits(r, FAM_ALG[fk]).length).map(r => r.name), line: (document.querySelector('#view .eaters-line') || {}).textContent || ''}; }, fk);
    ok(r.eaters === null && r.members.includes('長男') && !/除いて/.test(r.line), `R15-4 ${fk} 次の日は今日食べる人が家族みんなに戻る: ` + JSON.stringify(r));
    ok(!r.menuHit.length && !r.planHit.length, `R15-4 ${fk} 次の日の献立・プランに長男のアレルゲンの料理が出ない: ` + JSON.stringify(r));
    // 開いたまま日付が替わったとき（refreshToday）も戻す
    const z = await p.evaluate(() => { setEaters(['__me']); S.eatersD = addDays(TODAY, -1); const ch = eatersDayCheck(); return {ch, eaters: S.eaters}; });
    ok(z.ch && z.eaters === null, `R15-4 ${fk} 日付が替わったときの確かめで戻る: ` + JSON.stringify(z));
    // 明日の献立（明日の案）は、今日だけ外した家族も入れて考える
    const t = await p.evaluate(fk => { setEaters(['__me']); save(); const out = [];
        for (let k = 0; k < 4; k++){ const o = dayObj(addDays(TODAY, 1)); o.items = []; delete o.state; const its = tomorrowDraft(); asTomorrow(() => its.forEach(x => { const r = byId(x.id); if (r && (algSelectedHits(r, FAM_ALG[fk]).length || allergyConflict(r))) out.push(r.name); })); }
        return {out, eaters: S.eaters}; }, fk);
    ok(!t.out.length && Array.isArray(t.eaters), `R15-4 ${fk} 明日の案に長男のアレルゲンの料理が入らない（今日の選び方はそのまま）: ` + JSON.stringify(t));
    await ctx.close();
}

// R15-5 R43: きのう明日へまわした献立のお知らせで、当たる料理の名前に ⚠ と、選び直すことの文
{
    const {p, ctx} = await open({}, 'kept');
    const r = await p.evaluate(() => {
        const ids = (session.menu ? session.menu.items : []).map(x => x.r).filter(Boolean).map(r => r.id), slots = session.menu.items.filter(x => x.r).map(x => x.slot);
        const a = ALG_ALL.find(a => ids.some(id => algSelectedHits(byId(id), [a]).length) && !ids.every(id => algSelectedHits(byId(id), [a]).length));
        if (!a) return null;
        keepSet({d: TODAY, ids, slots}); S.settings.allergens = [a]; save(); setTab('today'); render();
        const el = document.querySelector('#view .kept-offer'), tx = el ? el.textContent : '';
        const hit = ids.filter(id => algSelectedHits(byId(id), [a]).length).map(id => byId(id).name), no = ids.filter(id => !algSelectedHits(byId(id), [a]).length).map(id => byId(id).name);
        return {a, tx, hit, no};
    });
    if (r){
        ok(r.hit.every(n => r.tx.includes('⚠ ' + n)) && r.no.every(n => !r.tx.includes('⚠ ' + n + '・') && !r.tx.endsWith('⚠ ' + n)) && /選び直します/.test(r.tx), 'R15-5 まわした献立の当たる料理だけに ⚠: ' + JSON.stringify(r));
    } else ok(false, 'R15-5 献立の一部に当たるアレルゲンがある');
    await ctx.close();
}

// R15-6 R44: 「今日これを作る」で当たる料理を入れるときは、アレルゲンの名前を出して確かめる。入れたあと「入れていません」「食べられるお膳です」と言わない
{
    const {p, ctx} = await open({allergens: ['egg']}, 'start');
    await p.evaluate(() => { S.family = [{id: 'r15', name: '花子', role: 'adult', allergy: [], avoid: ['セロリ'], mild: false}]; save(); reconcileMenu(); render(); });
    const r0 = await p.evaluate(() => { const r = RECIPES.find(r => r.main && algSelectedHits(r, ['egg']).length && !menuIds().includes(r.id)); const s = RECIPES.find(r => r.main && !allergyConflict(r) && !algMayHits(r).length && !menuIds().includes(r.id));
        setTab('today'); render(); return {id: r && r.id, name: r && r.name, safe: s && s.id, line: (document.querySelector('#view .eaters-line') || {}).textContent || ''}; });
    ok(/入れていません/.test(r0.line), 'R15-6 はじめは「入れていません」が出ている（お膳に当たる料理がない）: ' + JSON.stringify(r0.line));
    await p.evaluate(id => openModal(id), r0.id); await p.waitForTimeout(300);
    await p.locator('#modal-root [data-act=vid-start]').first().click(); await p.waitForTimeout(300);
    const c = await p.evaluate(id => ({kind: sheet && sheet.kind, h: (document.querySelector('#sheet-root h2') || {}).textContent || '', inCook: !!(S.cook && (S.cook.ids || []).includes(id))}), r0.id);
    ok(c.kind === 'start-alg' && /⚠/.test(c.h) && /卵/.test(c.h) && c.h.includes(r0.name) && !c.inCook, 'R15-6 当たる料理は、アレルゲンの名前を出して確かめる（まだ入れない）: ' + JSON.stringify(c));
    await p.locator('#sheet-root .btn[data-act=sheet-close]').click(); await p.waitForTimeout(200);
    ok(!(await p.evaluate(id => !!(S.cook && (S.cook.ids || []).includes(id)), r0.id)), 'R15-6 やめると作り方に入らない');
    await p.evaluate(id => { if (modalId) closeModal(); openModal(id); }, r0.id); await p.waitForTimeout(200);
    await p.locator('#modal-root [data-act=vid-start]').first().click(); await p.waitForTimeout(200);
    await p.locator('#sheet-root [data-act=start-alg-ok]').click(); await p.waitForTimeout(400);
    const d = await p.evaluate(id => { const inCook = !!(S.cook && (S.cook.ids || []).includes(id)); setTab('today'); render(); return {inCook, tab, line: (document.querySelector('#view .eaters-line') || {}).textContent || ''}; }, r0.id);
    ok(d.inCook, 'R15-6 確かめたあとは、本人が選んだとおり作り方に入る');
    ok(!/入れていません/.test(d.line) && !/食べられるお膳です/.test(d.line) && /卵/.test(d.line), 'R15-6 作り方に当たる料理があるあいだ、「入れていません」「食べられるお膳です」と言わない: ' + JSON.stringify(d.line));
    // 当たらない料理は今までどおりすぐ入る
    await p.evaluate(id => openModal(id), r0.safe); await p.waitForTimeout(200);
    await p.locator('#modal-root [data-act=vid-start]').first().click(); await p.waitForTimeout(300);
    const s = await p.evaluate(id => ({kind: sheet && sheet.kind, inCook: !!(S.cook && (S.cook.ids || []).includes(id))}), r0.safe);
    ok(s.inCook && s.kind !== 'start-alg', 'R15-6 当たらない料理は確かめずに入る: ' + JSON.stringify(s));
    await ctx.close();
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
