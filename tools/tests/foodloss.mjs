#!/usr/bin/env node
// 食品ロスを減らす仕組みの回帰テスト（Playwright。使い方: node tools/tests/foodloss.mjs [http://localhost:8797/]）
//  期限(S.fridgeMeta[食材].exp)の入力・近い順・消す / 使い切った・捨てた の1タップ記録と取り消し / 月・直近7日の件数（事実だけ）
//  不正値の除去(normalizeState) / 書き出し・読み込みの往復 / 期限2日以内は「早めに使う」扱い / 期限の日の朝の通知 / 買い物メモ（冷蔵庫にあるので省いた食材）
//  献立が連動して変わらないこと
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8797/';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const open = async (state, cc = 'JP') => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([cc, st]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded:true, firstUse:'2026-01-01', settings:{country:cc, dishCount:3}}, st))); } }, [cc, state]);
    await p.goto(URL_); await p.waitForTimeout(900); return p;
};
const stored = p => p.evaluate(() => { saveNow(); return JSON.parse(localStorage.getItem('gohancho.v1')); });
for (const cc of ['JP', 'US', 'KR']){
    const p = await open({}, cc);
    const q = await p.evaluate(() => QUICK.slice(0, 5));
    await p.evaluate(q => { S.fridge = q.slice(); S.fridgeMeta = {}; save(); setTab('fridge'); render(); }, q);
    ok(await p.locator('.loss-sec').count() === 1, cc + ' section');
    ok(await p.locator('.loss-sec > .card > .loss-row').count() === 0, cc + ' no urgent rows before expiry');
    // 期限を3つ入れる（今日・3日後・10日後）
    const d = await p.evaluate(() => ({t: TODAY, a: addDays(TODAY, 3), b: addDays(TODAY, 10), y: addDays(TODAY, -1)}));
    const setExp = async (i, date) => { await p.selectOption('#loss-exp-item', {index: i}); await p.fill('#loss-exp-date', date); await p.click('[data-act="loss-exp-add"]'); };
    await setExp(1, d.a); await setExp(0, d.t); await setExp(2, d.b);
    let st = await stored(p);
    ok(st.fridgeMeta[q[0]].exp === d.t && st.fridgeMeta[q[1]].exp === d.a && st.fridgeMeta[q[2]].exp === d.b, cc + ' exp saved');
    ok(/^\d{4}-\d{2}-\d{2}$/.test(st.fridgeMeta[q[0]].d), cc + ' registered date kept');
    const names = await p.locator('.loss-sec > .card > .loss-row .loss-nm').allInnerTexts();
    ok(names.length === 2 && names[0].includes(await p.evaluate(x => labelOf(x), q[0])), cc + ' urgent order ' + names.join('|'));   // 10日後は出ない
    ok(await p.locator('.loss-sec details.loss-rest .loss-row').count() === 3, cc + ' rest rows');
    // 過去の日付も入れられ、期限切れの表示になる
    await setExp(3, d.y);
    ok(await p.locator('.loss-d.over').count() === 1, cc + ' overdue');
    ok((await p.locator('.loss-sec > .card > .loss-row .loss-nm').first().innerText()).includes(await p.evaluate(x => labelOf(x), q[3])), cc + ' overdue first');
    // 2日以内の期限は「早めに使う」扱い（印がなくても）
    const sk = await p.evaluate(() => [...soonKeys()]);
    ok(sk.includes(await p.evaluate(x => keyOf(x), q[0])) && !sk.includes(await p.evaluate(x => keyOf(x), q[1])), cc + ' soonKeys by expiry');
    // 不正な日付は入らない
    await p.fill('#loss-exp-date', ''); await p.selectOption('#loss-exp-item', {index: 4}); await p.click('[data-act="loss-exp-add"]');
    st = await stored(p); ok(!st.fridgeMeta[q[4]].exp, cc + ' empty date rejected');
    // 期限を消す
    await p.locator('.loss-sec > .card > .loss-row [data-act="loss-exp-clear"]').last().click();
    // 使い切った → 冷蔵庫から外れ、記録に残る。取り消しで戻る
    const first = await p.evaluate(() => lossItems()[0].f);
    const nFr = (await stored(p)).fridge.length;
    await p.locator('.loss-sec > .card > .loss-row [data-act="loss-use"]').first().click();
    st = await stored(p);
    ok(st.fridge.length === nFr - 1 && !st.fridge.includes(first) && !st.fridgeMeta[first], cc + ' use removes');
    ok(st.foodLog.length === 1 && st.foodLog[0].r === 'u' && st.foodLog[0].d === d.t, cc + ' use logged');
    await p.locator('.toast button, #toast button').first().click().catch(() => {});
    await p.waitForTimeout(200);
    st = await stored(p);
    ok(st.fridge.includes(first) && st.foodLog.length === 0, cc + ' undo restores (' + st.fridge.length + ',' + st.foodLog.length + ')');
    // 捨てた
    await p.locator('.loss-sec > .card > .loss-row [data-act="loss-toss"]').first().click();
    await p.locator('.loss-sec > .card > .loss-row [data-act="loss-use"]').first().click();
    st = await stored(p); ok(st.foodLog.map(x => x.r).sort().join() === 't,u', cc + ' toss+use');
    const txt = await p.locator('.loss-sec').innerText();
    ok(/1/.test(txt) && txt.split('\n').some(l => /1.*1/.test(l)), cc + ' summary shows counts: ' + txt.slice(-120).replace(/\n/g, ' '));
    // 過去月・8日前の記録は「今月」「直近7日」に数えない
    const c = await p.evaluate(() => { S.foodLog = [{d:addDays(TODAY, -8), n:'a', r:'u'}, {d:addDays(TODAY, -40), n:'b', r:'t'}, {d:TODAY, n:'c', r:'t'}];
        return {w: lossCount(addDays(TODAY, -6), TODAY), m: lossCount(TODAY.slice(0, 7) + '-01', TODAY.slice(0, 7) + '-31')}; });
    ok(c.w.u === 0 && c.w.t === 1, cc + ' week count'); ok(c.m.t === 1 && (c.m.u === (await p.evaluate(() => TODAY.slice(0, 7) === addDays(TODAY, -8).slice(0, 7) ? 1 : 0))), cc + ' month count');
    // 説教・評価の文言が出ない
    const all = await p.locator('.loss-sec').innerText(); ok(!/もったいない|えらい|がんばっ|減らしましょう|反省/.test(all), cc + ' no judgement text');
    // 今日の献立が連動して変わらない（食材の記録で献立は動かない）
    const m1 = await p.evaluate(() => { setTab('today'); render(); return JSON.stringify((session.menu ? session.menu.items : []).map(x => x.r && x.r.id)); });
    await p.evaluate(() => { S.foodLog.push({d:TODAY, n:'x', r:'u'}); save(); render(); });
    const m2 = await p.evaluate(() => JSON.stringify((session.menu ? session.menu.items : []).map(x => x.r && x.r.id)));
    ok(m1 === m2, cc + ' menu unchanged');
    await p.context().close();
}
// ---- normalizeState / バックアップ ----
{
    const p = await open({});
    const o = await p.evaluate(() => {
        const bad = normalizeState({fridge:['玉ねぎ','豚肉'], fridgeMeta:{'玉ねぎ':{d:'2026-05-01', exp:'2026-02-30'}, '豚肉':{d:'2026-05-01', exp:'2026-06-10', soon:true}},
            foodLog:[{d:'2026-06-01', n:'a', r:'u'}, {d:'bad', n:'b', r:'u'}, {d:'2026-06-02', n:'', r:'t'}, {d:'2026-06-02', n:'c', r:'x'}, null, 5, {d:'2026-06-03', n:'d', r:'t', extra:1}],
            settings:{lossRemind: 99}});
        const good = normalizeState({settings:{lossRemind: 8}}), none = normalizeState({});
        const big = normalizeState({foodLog: Array.from({length:600}, (_, i) => ({d:'2026-06-01', n:'n' + i, r:'u'}))});
        S.fridge = ['玉ねぎ','豚肉']; S.fridgeMeta = {'玉ねぎ':{d:'2026-05-01', exp:'2026-06-09'}, '豚肉':{d:'2026-05-02', soon:true, exp:'2026-06-10'}}; S.foodLog = [{d:'2026-06-01', n:'にんじん', r:'u'}, {d:'2026-06-02', n:'卵', r:'t'}];
        const json = backupJson(); const bk = JSON.parse(json);
        S.fridge = []; S.fridgeMeta = {}; S.foodLog = [];
        const r = parseBackup(json); const st = normalizeState(r.d);
        return {badExp: bad.fridgeMeta['玉ねぎ'].exp, okExp: bad.fridgeMeta['豚肉'].exp, soon: bad.fridgeMeta['豚肉'].soon, log: bad.foodLog, lr: bad.settings.lossRemind, good: good.settings.lossRemind, noneLog: none.foodLog, noneLr: 'lossRemind' in none.settings, big: big.foodLog.length, bigLast: big.foodLog[399].n,
            bkLog: bk.foodLog, bkExp: bk.fridgeMeta['玉ねぎ'].exp, back: JSON.stringify([st.fridgeMeta, st.foodLog]), want: JSON.stringify([{'玉ねぎ':{d:'2026-05-01', exp:'2026-06-09'}, '豚肉':{d:'2026-05-02', soon:true, exp:'2026-06-10'}}, [{d:'2026-06-01', n:'にんじん', r:'u'}, {d:'2026-06-02', n:'卵', r:'t'}]]), sum: stateSummary(st)};
    });
    ok(o.badExp === undefined && o.okExp === '2026-06-10' && o.soon === true, 'normalize exp'); ok(JSON.stringify(o.log) === JSON.stringify([{d:'2026-06-01', n:'a', r:'u'}, {d:'2026-06-03', n:'d', r:'t'}]), 'normalize foodLog ' + JSON.stringify(o.log));
    ok(o.lr === undefined && o.good === 8 && !o.noneLr && o.noneLog.length === 0, 'normalize lossRemind');
    ok(o.big === 400 && o.bigLast === 'n599', 'foodLog capped to newest 400');
    ok(o.bkLog.length === 2 && o.bkExp === '2026-06-09', 'backup includes data'); ok(o.back === o.want, 'backup roundtrip ' + o.back);
    ok(/2/.test(o.sum), 'summary mentions log');
    await p.context().close();
}
// ---- 通知（期限の日の朝） ----
{
    const p = await open({settings:{country:'JP', dishCount:3, lossRemind:8}});
    const o = await p.evaluate(() => {
        const t0 = TODAY, tomorrow = addDays(TODAY, 1), far = addDays(TODAY, 9);
        S.fridge = ['玉ねぎ', 'にんじん', '豚肉', 'キャベツ']; S.fridgeMeta = {'玉ねぎ':{d:t0, exp:tomorrow}, 'にんじん':{d:t0, exp:tomorrow}, '豚肉':{d:t0, exp:far}, 'キャベツ':{d:t0}};
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const list = notifBuild(now).filter(n => n.id >= NOTIFY_LOSS_ID && n.id < NOTIFY_LOSS_ID + NOTIFY_LOSS_DAYS);
        S.settings.lossRemind = null; const off = notifBuild(now).filter(n => n.id >= NOTIFY_LOSS_ID && n.id < NOTIFY_LOSS_ID + NOTIFY_LOSS_DAYS).length;
        return {n: list.length, title: list[0] && list[0].title, body: list[0] && list[0].body, id: list[0] && list[0].id, hr: list[0] && list[0].schedule.at.getHours(), all: NOTIFY_ALL.length, off};
    });
    ok(o.n === 1 && o.id === 1301 && o.hr === 8, 'loss notif one for tomorrow ' + JSON.stringify(o)); ok(/玉ねぎ/.test(o.body) && /にんじん/.test(o.body) && !/豚肉/.test(o.body), 'notif body');
    ok(o.title === '今日使い切りたい食材があります', 'notif title'); ok(o.all <= 40, 'notif ids within iOS limit'); ok(o.off === 0, 'notif off');
    await p.context().close();
}
// ---- 買い物メモ（冷蔵庫にあるので省いた食材）と、足すときの知らせ ----
{
    const p = await open({});
    const o = await p.evaluate(() => {
        S.fridge = []; S.fridgeMeta = {}; save();
        const days = [{d:TODAY, id:RECIPES[0].id}]; S.week = {start:TODAY, days}; render();
        const ings = RECIPES[0].items.filter(i => !i.opt && !PANTRY.has(i.key));
        const k = ings[0].key; S.fridge = [ings[0].label]; save();
        const keyed = S.fridge.some(f => keyOf(f) === k);
        const exp = addDays(TODAY, 1); if (keyed) S.fridgeMeta[S.fridge[0]].exp = exp;
        const h = shopHaveHtml(); const inList = shoppingList().some(e => String(e.key).split('|')[0] === k);
        return {keyed, h, inList, label: labelOf(S.fridge[0])};
    });
    if (o.keyed){ ok(!o.inList, 'fridge item not in shopping list'); ok(o.h.includes('shop-have') && o.h.includes(o.label), 'omitted note ' + o.h.slice(0, 120)); ok(o.h.includes('明日'), 'omitted note shows expiry'); }
    await p.context().close();
}
ok(errs.length === 0, 'page errors ' + errs.slice(0, 3).join(' / '));
console.log(fails ? 'FAILED ' + fails + '/' + checks : 'OK ' + checks + ' checks');
await b.close(); process.exit(fails ? 1 : 0);
