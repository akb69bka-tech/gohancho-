#!/usr/bin/env node
// 日付・時刻・タイムゾーンの回帰テスト（Playwright の timezoneId と page.clock。使い方: node tools/tests/dates.mjs [http://localhost:8795/]）
//  ・複数の時間帯（東京・LA・NY・ロンドン・シドニー・UTC+14・UTC-11）×時刻（0時前後・夏時間の切り替え日・閏日・年末年始）で、
//    ymd / parseYmd / addDays / daysBetween / weekStart が、UTC で数えた正解と一致する（UTCずれ・夏時間の23/25時間日で1日ずれない）
//  ・開いたまま0時を過ぎると、画面に戻る操作がなくても今日の日付が新しくなる。入力中は邪魔しない
//  ・夏時間の切り替え日をまたぐ14日分の通知予約が、すべて指定の「時」ちょうど。買い物前日の18時も同じ
//  ・お試し終了の解約期限は、夏時間でもちょうど24時間前。夜食時刻（0〜3時台）の「あす」も壁時計で数える
//  ・東京で保存→LA で開く、端末の日付を過去に戻す、でも落ちず、日数の計算が壊れない
//  ・直近7日の食費・残り物の何日目・バックアップ30日/14日・◯日以内に作った料理・無料期間の日数が、境界の日で1日ずれない
//  ・暦にない日付（2026-02-30 など）は読み込みで捨てる。.ics の日付は端末の時間帯に左右されない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: got ${JSON.stringify(a)} expected ${JSON.stringify(e)}`);

// 正解（UTC の暦計算。端末の時間帯に依存しない）
const pad = n => String(n).padStart(2, '0');
const utcYmd = ms => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const utcMs = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const addD = (s, n) => utcYmd(utcMs(s) + n * 86400000);
const wdOf = s => new Date(utcMs(s)).getUTCDay();
const localYmdOf = (iso, tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

async function open(tz, time, state, opt = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: tz, locale: opt.locale || 'ja-JP' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tz + ' ' + time + ': ' + e.message));
    if (time) await p.clock.install({ time: new Date(time) });
    const st = state || { onboarded: true, firstUse: '2026-01-01', settings: { country: 'JP', dishCount: 3 } };
    await p.addInitScript(x => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); if (x) localStorage.setItem('gohancho.v1', JSON.stringify(x)); } }, st);
    await p.goto(URL_); await p.waitForTimeout(700); p.ctx = ctx; return p;
}

// ---------- 1. 日付の部品: 時間帯 × 時刻 × 夏時間・閏日・年末年始 ----------
const TZS = ['Asia/Tokyo', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Australia/Sydney', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'UTC'];
const INSTANTS = [
    '2026-03-08T06:59:00Z', '2026-03-08T07:30:00Z', '2026-03-08T12:00:00Z', '2026-11-01T05:30:00Z', '2026-11-01T06:30:00Z',   // NY/LA の夏時間
    '2026-03-29T00:30:00Z', '2026-03-29T01:30:00Z', '2026-10-25T00:30:00Z', '2026-10-25T01:30:00Z',                       // ロンドン
    '2026-04-04T15:30:00Z', '2026-10-03T15:30:00Z',                                                                       // シドニー（4/5 3:00→2:00、10/4 2:00→3:00）
    '2028-02-28T14:59:30Z', '2028-02-28T15:00:30Z', '2028-02-29T10:00:00Z', '2028-02-29T23:59:30Z', '2027-02-28T23:30:00Z',   // 閏日・平年
    '2026-12-31T14:59:50Z', '2026-12-31T15:00:10Z', '2026-12-31T23:59:50Z', '2027-01-01T00:00:10Z', '2027-01-01T09:00:00Z',  // 年末年始
    '2026-04-30T23:30:00Z', '2026-05-31T23:30:00Z', '2026-10-27T05:00:00Z',
];
for (const tz of TZS){
    const p = await open(tz, INSTANTS[0]);
    for (const iso of INSTANTS){
        await p.clock.setSystemTime(new Date(iso));
        const r = await p.evaluate(() => {
            const out = {now: ymd(), t: [], adds: [], between: [], ws: []};
            // 今日を起点に -400..+400 日
            for (const n of [-400, -366, -35, -31, -30, -14, -7, -1, 0, 1, 6, 7, 13, 14, 21, 29, 30, 31, 35, 59, 60, 365, 366, 400]) out.adds.push([n, addDays(ymd(), n)]);
            return out;
        });
        const exp = localYmdOf(iso, tz);
        ok(r.now === exp, `${tz} ${iso} ymd() ${r.now} != ${exp}`);
        for (const [n, v] of r.adds) ok(v === addD(exp, n), `${tz} ${iso} addDays(${exp},${n}) = ${v} != ${addD(exp, n)}`);
    }
    // daysBetween / weekStart / parseYmd の往復（夏時間の日・閏日・年末をまたぐ組）
    const pairs = [['2026-03-07', '2026-03-09'], ['2026-03-08', '2026-03-09'], ['2026-03-28', '2026-03-30'], ['2026-10-24', '2026-10-26'], ['2026-10-31', '2026-11-02'], ['2026-11-01', '2026-11-02'], ['2026-04-04', '2026-04-06'], ['2026-10-03', '2026-10-05'],
        ['2028-02-28', '2028-03-01'], ['2027-02-28', '2027-03-01'], ['2026-12-31', '2027-01-01'], ['2025-12-31', '2027-01-01'], ['2026-01-01', '2026-12-31'], ['2020-02-29', '2024-02-29'], ['2026-06-01', '2026-06-01'], ['2026-06-10', '2026-06-01']];
    const r2 = await p.evaluate(pairs => ({
        db: pairs.map(([a, c]) => daysBetween(a, c)),
        rt: pairs.map(([a]) => ymd(parseYmd(a))),
        ws: pairs.map(([a]) => weekStart(a)),
        real: [realYmd('2026-02-30'), realYmd('2026-13-01'), realYmd('0000-01-01'), realYmd('2028-02-29'), realYmd('2027-02-29'), realYmd('2026-04-31'), realYmd('2026-12-31'), realYmd('2026-00-10')],
    }), pairs);
    pairs.forEach(([a, c], i) => {
        eq(r2.db[i], Math.round((utcMs(c) - utcMs(a)) / 86400000), `${tz} daysBetween(${a},${c})`);
        eq(r2.rt[i], a, `${tz} parseYmd/ymd 往復 ${a}`);
        eq(r2.ws[i], addD(a, -((wdOf(a) + 6) % 7)), `${tz} weekStart(${a}) は月曜`);
    });
    eq(r2.real, [false, false, false, true, false, false, true, false], `${tz} realYmd`);
    await p.ctx.close();
}

// ---------- 2. 開いたまま0時を過ぎる ----------
for (const [tz, before] of [['Asia/Tokyo', '2026-06-10T14:59:45Z'], ['America/Los_Angeles', '2026-06-11T06:59:45Z'], ['Europe/London', '2026-06-10T22:59:45Z'], ['Pacific/Kiritimati', '2026-06-10T09:59:45Z']]){
    const p = await open(tz, before);
    const a = await p.evaluate(() => ({today: TODAY, label: document.querySelector('#today-label').textContent, used: S.usedDays.slice(-1)[0]}));
    eq(a.today, localYmdOf(before, tz), `${tz} 0時前の TODAY`);
    await p.clock.runFor(31000);   // 30秒ごとの確認が0時の後に走る
    await p.waitForTimeout(200);
    const c = await p.evaluate(() => ({today: TODAY, label: document.querySelector('#today-label').textContent, used: S.usedDays.slice(-2), menuNull: session.menu === null || session.menu != null}));
    eq(c.today, addD(a.today, 1), `${tz} 0時を過ぎたら TODAY が翌日に`);
    ok(c.label !== a.label, `${tz} 0時を過ぎたら画面の日付ラベルも変わる (${a.label} → ${c.label})`);
    ok(c.used.includes(c.today), `${tz} 使った日(usedDays)に翌日が入る`);
    await p.ctx.close();
}
{   // 入力中は0時でも画面を作り直さない（食費の金額入力が消えない）。入力をやめたら次の確認で更新
    const p = await open('Asia/Tokyo', '2026-06-10T14:59:45Z');
    await p.evaluate(() => { setTab('today'); const i = document.createElement('input'); i.id = 'tmp-in'; document.body.appendChild(i); i.focus(); i.value = '123'; });
    await p.clock.runFor(31000); await p.waitForTimeout(100);
    ok(await p.evaluate(() => TODAY === '2026-06-10' && document.activeElement.id === 'tmp-in' && document.activeElement.value === '123'), '入力中は0時を過ぎても日付を切り替えない（入力は消えない）');
    await p.evaluate(() => document.activeElement.blur());
    await p.clock.runFor(31000); await p.waitForTimeout(100);
    ok(await p.evaluate(() => TODAY === '2026-06-11'), '入力が終われば次の確認で日付が新しくなる');
    await p.ctx.close();
}
{   // 夜中に開く（0:05）と、その日の日付で始まる。0:05 → 画面に戻る操作（visibilitychange）でも更新
    const p = await open('America/New_York', '2026-06-11T04:05:00Z');
    eq(await p.evaluate(() => TODAY), '2026-06-11', 'NY 0:05 に開いた日付');
    await p.clock.setSystemTime(new Date('2026-06-11T14:00:00Z'));   // 同じ日の昼
    await p.evaluate(() => refreshToday()); eq(await p.evaluate(() => TODAY), '2026-06-11', '同じ日の昼は変わらない');
    await p.clock.setSystemTime(new Date('2026-06-12T04:00:30Z'));
    await p.evaluate(() => window.dispatchEvent(new Event('focus'))); eq(await p.evaluate(() => TODAY), '2026-06-12', 'フォーカスで翌日に');
    await p.ctx.close();
}

// ---------- 3. 夏時間の切り替え日をまたぐ通知・解約期限・夜食 ----------
for (const [tz, start, label] of [['America/New_York', '2026-03-05T15:00:00Z', 'NY春(3/8)'], ['America/New_York', '2026-10-29T15:00:00Z', 'NY秋(11/1)'], ['America/Los_Angeles', '2026-03-05T15:00:00Z', 'LA春'], ['Europe/London', '2026-03-26T12:00:00Z', 'ロンドン春(3/29)'], ['Europe/London', '2026-10-22T12:00:00Z', 'ロンドン秋(10/25)'], ['Australia/Sydney', '2026-04-01T02:00:00Z', 'シドニー秋(4/5)'], ['Australia/Sydney', '2026-09-30T02:00:00Z', 'シドニー春(10/4)']]){
    const st = { onboarded: true, firstUse: '2026-01-01', settings: { country: 'JP', dishCount: 3, remind: 18, shopRemind: 3, dinnerAt: '19:00' } };
    const p = await open(tz, start, st);
    const r = await p.evaluate(() => {
        hasPro = () => true;
        S.cook = null; S.week = null; makeWeek();
        const list = notifBuild(new Date());
        const days = list.filter(n => n.id >= NOTIFY_DAY_ID && n.id < NOTIFY_DAY_ID + NOTIFY_DAYS), shops = list.filter(n => n.id >= NOTIFY_SHOP_ID);
        return {today: TODAY,
            day: days.map(n => [n.id - NOTIFY_DAY_ID, ymd(n.schedule.at), n.schedule.at.getHours(), n.schedule.at.getMinutes()]),
            shop: shops.map(n => [ymd(n.schedule.at), n.schedule.at.getHours(), n.schedule.at.getDay()]), plan: S.week.days.map(x => x.d)};
    });
    eq(r.plan, Array.from({length: 7}, (_, i) => addD(r.today, i)), `${label} 1週間プランの日付が連続`);
    ok(r.day.length >= 6, `${label} 日ごとの通知が出る (${r.day.length})`);
    r.day.forEach(([i, d, h, m]) => { ok(h === 18 && m === 0, `${label} 通知 ${d} が18:00ちょうど (${h}:${m})`); ok(d === addD(r.today, i), `${label} 通知 id${i} の日付 ${d}`); });
    ok(r.shop.length === 2, `${label} 買い物前日の通知が2件`);
    r.shop.forEach(([d, h, wd]) => { ok(h === 18, `${label} 買い物前日の通知が18時 (${h})`); ok((wd + 1) % 7 === 3, `${label} 買い物日(水)の前日 ${d} の曜日 ${wd}`); });
    // くり返しなし（プランなし）の個別予約: 決めた日は明日から
    const r2 = await p.evaluate(() => { S.week = null; S.cook = {d: TODAY, ids: [], slots: [], done: {}}; const l = notifBuild(new Date()).filter(n => n.id >= NOTIFY_DAY_ID && n.id < NOTIFY_DAY_ID + NOTIFY_DAYS); return {t: TODAY, l: l.map(n => [ymd(n.schedule.at), n.schedule.at.getHours()])}; });
    r2.l.forEach(([d, h], i) => ok(h === 18 && d === addD(r2.t, i + 1), `${label} 決めた日の個別予約 ${d} ${h}時`));
    await p.ctx.close();
}
{   // 解約期限 = お試し終了の24時間前（壁時計ではなく経過時間）
    const p = await open('America/New_York', '2026-03-07T17:00:00Z');   // 3/7 12:00 EST
    const s = await p.evaluate(() => { introOffer = {unit: 'day', n: 1}; return introCancelBy(); });
    ok(/11:00/.test(s) && /3月7日|Mar|7/.test(s), `NY 春: 3/8 12:00 EDT の24時間前は 3/7 11:00 EST (${s})`);
    const s2 = await p.evaluate(() => { introOffer = {unit: 'month', n: 1}; return [introEndYmd(), daysBetween(TODAY, introEndYmd())]; });
    eq(s2, ['2026-04-07', 31], 'NY 春: 1か月後の終了日と日数');
    await p.clock.setSystemTime(new Date('2026-01-31T17:00:00Z'));
    await p.evaluate(() => refreshToday());
    eq(await p.evaluate(() => [introEndYmd(), daysBetween(TODAY, introEndYmd())]), ['2026-02-28', 28], '1/31 の1か月後は月末に丸めて 2/28');
    await p.clock.setSystemTime(new Date('2028-01-31T17:00:00Z')); await p.evaluate(() => refreshToday());
    eq(await p.evaluate(() => introEndYmd()), '2028-02-29', '閏年の 1/31 の1か月後は 2/29');
    await p.clock.setSystemTime(new Date('2026-12-31T17:00:00Z')); await p.evaluate(() => refreshToday());
    eq(await p.evaluate(() => introEndYmd()), '2027-01-31', '12/31 の1か月後は翌年 1/31');
    await p.ctx.close();
}
{   // 夜食時刻（0〜3時台）の「あす」: 夏時間でも壁時計の翌日 03:30（24時間足さない）
    const p = await open('America/New_York', '2026-03-08T03:30:00Z');   // 3/7 22:30 EST
    const r = await p.evaluate(() => {
        S.settings.dinnerAt = '03:30'; session.menu = null;
        const rs = RECIPES.filter(r => Number(r.min) > 0).slice(0, 2);
        const html = eatPlanHtml(rs.map(r => ({r, slot: '主菜'})));
        return html.replace(/<[^>]+>/g, ' ');
    });
    ok(/3:30/.test(r) && !/4:30/.test(r), `NY 3/7 22:30、夜食 03:30 は 3/8 03:30 EDT（4:30 にならない）: ${r.slice(0, 160)}`);
    await p.ctx.close();
}
{   // 無料期間の終了前日の通知（19:00）が夏時間でも19時ちょうど
    const p = await open('America/New_York', '2026-03-01T15:00:00Z');
    const r = await p.evaluate(async () => {
        const got = []; window.Capacitor = {Plugins: {LocalNotifications: {checkPermissions: async () => ({display: 'granted'}), cancel: async () => {}, schedule: async x => { got.push(...x.notifications); }}}, isNativePlatform: () => true};
        S.pro = {active: true, trialEnd: '2026-03-10', willRenew: true}; save();
        await scheduleTrialReminder();
        return got.map(n => [ymd(n.schedule.at), n.schedule.at.getHours(), n.schedule.at.getMinutes()]);
    });
    eq(r, [['2026-03-07', 19, 0]], 'App Store のお試し終了(3/10)の3日前 19:00（夏時間をまたいでも19時）');
    await p.ctx.close();
}

// ---------- 4. 日数の計算（境界の日） ----------
for (const tz of ['Asia/Tokyo', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Australia/Sydney']){
    const p = await open(tz, '2026-03-09T12:00:00Z');   // 夏時間の切り替え直後の月曜（シドニー・ロンドンでは別の日）
    const r = await p.evaluate(() => {
        const T = TODAY, out = {T};
        S.history = []; S.leftovers = []; S.spend = [];
        const id = RECIPES[0].id, id2 = RECIPES[1].id;
        // ◯日以内に作った料理は出さない（境界）
        S.history = [{d: addDays(T, -5), id, slot: '主菜'}, {d: addDays(T, -6), id: id2, slot: '主菜'}]; DS_CACHE = null;
        S.settings.avoidDays = 5; out.fresh5 = [planUsable(byId(id)), planUsable(byId(id2))];
        S.settings.avoidDays = 7; out.fresh7 = [planUsable(byId(id)), planUsable(byId(id2))];
        out.daysSince = [daysSince(id), daysSince(id2)];
        // 食費メモ（直近7日 = 今日を含めて7日）
        S.spend = [-7, -6, -3, 0, 1].map((n, i) => ({id: 's' + i, d: addDays(T, n), a: 100})); out.spend = spendWeek().map(x => x.d === addDays(T, -6) ? 'm6' : x.d === addDays(T, -3) ? 'm3' : x.d === T ? 't' : x.d);
        // 残り物（何日目）
        out.left = [0, 1, 2, 3, 10, -2].map(n => leftDay({d: addDays(T, -n)}));
        // バックアップ 30日 / 14日
        S.history = [1, 2, 3].map(i => ({d: T, id: RECIPES[i].id, slot: '主菜'})); DS_CACHE = null;
        S.firstUse = addDays(T, -29); delete S.lastBackup; delete S.backupSnooze; out.b29 = backupDue();
        S.firstUse = addDays(T, -30); out.b30 = backupDue();
        S.lastBackup = addDays(T, -29); out.l29 = backupDue(); S.lastBackup = addDays(T, -30); out.l30 = backupDue();
        S.backupSnooze = addDays(T, -13); out.s13 = backupDue(); S.backupSnooze = addDays(T, -14); out.s14 = backupDue();
        S.backupSnooze = addDays(T, 20); out.sFuture = backupDue();   // 日付を戻された: 未来の「あとで」は効かせない
        S.lastBackup = addDays(T, 40); delete S.backupSnooze; out.lFuture = backupDue();   // 未来の書き出し日: 落ちず、お知らせは出ない
        // 無料期間 / お試し
        PLAN.billingMode = 'all'; PLAN.trialMode = 'app'; PLAN.trialDays = 30; PLAN.campaign.active = false; S.pro = null;
        S.firstUse = addDays(T, -29); out.t29 = [trialUsed(), trialActive(), trialDaysLeft()];
        S.firstUse = addDays(T, -30); out.t30 = [trialUsed(), trialActive(), trialDaysLeft()];
        S.firstUse = addDays(T, 5); out.tFuture = [trialUsed(), trialActive(), trialDaysLeft()];   // 日付を戻された
        // 週: 月曜はじまり。今日から数えた週の始まり
        out.ws = weekStart(); out.wd = parseYmd(T).getDay();
        // streak
        S.history = [0, 1, 2, 4].map(n => ({d: addDays(T, -n), id: RECIPES[0].id, slot: '主菜'})); out.streak = streak();
        S.history = [1, 2].map(n => ({d: addDays(T, -n), id: RECIPES[0].id, slot: '主菜'})); out.streak2 = streak();
        return out;
    });
    const T = r.T;
    eq(r.daysSince, [5, 6], `${tz} 最後に作ってからの日数`);
    eq(r.fresh5, [true, true], `${tz} 5日以内を避ける: 5日前は出せる`);
    eq(r.fresh7, [false, false], `${tz} 7日以内を避ける: 5・6日前は出さない`);
    eq(r.spend, ['m6', 'm3', 't'], `${tz} 食費の直近7日（今日を含む。7日前と明日は入らない）`);
    eq(r.left, [1, 2, 3, 4, 11, 1], `${tz} 残り物 何日目（当日=1日目、未来は1日目）`);
    eq([r.b29, r.b30, r.l29, r.l30, r.s13, r.s14], [false, true, false, true, false, true], `${tz} バックアップ30日・あとで14日の境界`);
    eq(r.sFuture, true, `${tz} 未来の「あとで」は無視してお知らせを出す`);
    eq(r.lFuture, false, `${tz} 未来の書き出し日でも落ちない`);
    eq(r.t29, [29, true, 1], `${tz} 無料期間 29日目はまだ`); eq(r.t30, [30, false, 0], `${tz} 無料期間 30日目で終了`); eq(r.tFuture, [0, true, 30], `${tz} 使いはじめが未来でも落ちない`);
    eq(r.ws, addD(T, -((wdOf(T) + 6) % 7)), `${tz} 今週の月曜`);
    eq(r.streak, 3, `${tz} 連続日数`); eq(r.streak2, 2, `${tz} 連続日数(今日まだ)`);
    await p.ctx.close();
}
{   // 月曜の境界: 日曜 23:59 と 月曜 0:00 で今週の集計が切り替わる
    for (const tz of ['Asia/Tokyo', 'America/Los_Angeles']){
        const sun = tz === 'Asia/Tokyo' ? '2026-06-14T14:59:30Z' : '2026-06-15T06:59:30Z';   // 現地 6/14(日) 23:59:30
        const p = await open(tz, sun);
        const a = await p.evaluate(() => { S.history = [{d: '2026-06-08', id: RECIPES[0].id, slot: '主菜'}, {d: '2026-06-14', id: RECIPES[1].id, slot: '主菜'}, {d: '2026-06-07', id: RECIPES[2].id, slot: '主菜'}]; return [TODAY, weekStart(), weekStats().days]; });
        eq(a, ['2026-06-14', '2026-06-08', 2], `${tz} 日曜 23:59 は月曜はじまりの週の最終日`);
        await p.clock.runFor(31000); await p.waitForTimeout(150);
        const c = await p.evaluate(() => [TODAY, weekStart(), weekStats().days]);
        eq(c, ['2026-06-15', '2026-06-15', 0], `${tz} 月曜 0:00 を過ぎたら新しい週`);
        await p.ctx.close();
    }
}

// ---------- 5. 閏日・月末・年末年始（1週間プラン・カレンダー・.ics） ----------
for (const [tz, iso, T0] of [['Asia/Tokyo', '2028-02-26T03:00:00Z', '2028-02-26'], ['America/Los_Angeles', '2026-12-28T20:00:00Z', '2026-12-28'], ['Europe/London', '2026-10-22T09:00:00Z', '2026-10-22'], ['Pacific/Kiritimati', '2027-02-25T00:00:00Z', '2027-02-25']]){
    const p = await open(tz, iso);
    const r = await p.evaluate(() => {
        hasPro = () => true; S.week = null; makeWeek(); S.settings.weekSides = false;
        const ics = weekIcs(new Date(Date.UTC(2026, 5, 1, 3, 4, 5)));
        const ym = TODAY.slice(0, 7); session.logMonth = ym;
        const cal = calMonthHtml({}); const cells = (cal.match(/data-act="cal-day"/g) || []).length;
        return {T: TODAY, days: S.week.days.map(x => x.d), ics, cells, ym, dts: [...ics.matchAll(/DTSTART;VALUE=DATE:(\d+)/g)].map(m => m[1]), dte: [...ics.matchAll(/DTEND;VALUE=DATE:(\d+)/g)].map(m => m[1]), stamp: (ics.match(/DTSTAMP:(\S+)/) || [])[1]};
    });
    eq(r.T, T0, `${tz} ${iso} の今日`);
    eq(r.days, Array.from({length: 7}, (_, i) => addD(T0, i)), `${tz} ${T0} 始まりのプランは月末・閏日・年末をまたいでも連続`);
    eq(r.dts, r.days.map(d => d.replace(/-/g, '')), `${tz} .ics の開始日はローカルの日付そのまま`);
    eq(r.dte, r.days.map(d => addD(d, 1).replace(/-/g, '')), `${tz} .ics の終了日は翌日（排他的）`);
    eq(r.stamp, '20260601T030405Z', `${tz} .ics の DTSTAMP は UTC`);
    const [y, m] = r.ym.split('-').map(Number); eq(r.cells, new Date(Date.UTC(y, m, 0)).getUTCDate(), `${tz} ${r.ym} のカレンダーの日数`);
    await p.ctx.close();
}
{   // 月の切り替え（年またぎ・閏月）と曜日の並び（月曜はじまり）
    const p = await open('America/New_York', '2028-03-15T16:00:00Z');
    const r = await p.evaluate(() => {
        const out = {};
        session.logMonth = '2028-02'; const feb = calMonthHtml({}); out.feb = (feb.match(/data-act="cal-day"/g) || []).length;
        const g = feb.slice(feb.indexOf('cal-grid')); const wdEnd = g.lastIndexOf('</span>', g.indexOf('<span></span>') + 1); out.febLead = (g.match(/<span><\/span>/g) || []).length;   // 2028-02-01 は火曜 → 月曜はじまりで先頭に1つ空き
        const nav = v => { const b = document.createElement('button'); b.dataset.act = 'cal-nav'; b.dataset.v = v; document.body.appendChild(b); b.click(); b.remove(); return session.logMonth; };
        session.logMonth = '2027-01'; out.back = nav(-1); out.back2 = nav(-1); out.fwd = nav(1);
        session.logMonth = '2028-03'; out.fwdBlocked = nav(1);   // 今月より先へは進めない
        return out;
    });
    eq([r.feb, r.febLead], [29, 1], '2028年2月は29日で、月曜はじまりの先頭に空き1');
    eq([r.back, r.back2, r.fwd, r.fwdBlocked], ['2026-12', '2026-11', '2026-12', '2028-03'], '月送りは年をまたいでも正しく、今月で止まる');
    await p.ctx.close();
}

// ---------- 6. タイムゾーン移動・日付を過去に戻す ----------
{   // 東京で保存 → LA で開く（保存した日付は文字列のまま。日数の計算が壊れず、落ちない）
    const tokyo = await open('Asia/Tokyo', '2026-06-11T01:00:00Z');   // 東京 6/11 10:00
    const saved = await tokyo.evaluate(() => {
        hasPro = () => true;
        const T = TODAY; S.history = [{d: T, id: RECIPES[0].id, slot: '主菜'}, {d: addDays(T, -1), id: RECIPES[1].id, slot: '主菜'}];
        S.leftovers = [{id: RECIPES[0].id, name: 'x', d: T}]; S.spend = [{id: 's1', d: T, a: 500}]; S.lastBackup = addDays(T, -3); S.firstUse = '2026-06-01';
        makeWeek(); S.cook = {d: T, ids: [RECIPES[0].id], slots: ['主菜'], done: {}}; save();
        return {T, ls: JSON.stringify(S)};   // save() は少しあとに書くので、状態をそのまま持ち出す
    });
    eq(saved.T, '2026-06-11', '東京の今日');
    await tokyo.ctx.close();
    // LA: 同じ瞬間は現地では 6/10 18:00。まだ「前日」
    const la = await open('America/Los_Angeles', '2026-06-11T01:00:00Z', JSON.parse(saved.ls));
    const r = await la.evaluate(() => ({T: TODAY, ds: [lastDays().get(RECIPES[0].id), lastDays().get(RECIPES[1].id)], left: S.leftovers.map(leftDay), spend: spendWeek().length, tr: [trialUsed(), trialActive()], week: S.week && S.week.days.length, cookRestored: !!(S.cook && S.cook.d === TODAY), streak: streak(), hasNote: typeof backupNoteHtml() === 'string'}));
    eq(r.T, '2026-06-10', 'LA は東京より1日前');
    eq(r.ds, [undefined, 0], 'LA: 東京の「今日」の記録はまだ未来（出さない）、東京の「昨日」の記録は今日扱い');
    eq(r.left, [1], 'LA: 未来の残り物メモは1日目に丸める（負の日数を出さない）');
    eq(r.spend, 0, 'LA: 未来日付の食費は直近7日に入れない（東京の今日の分）');
    ok(r.week >= 1 && r.hasNote, 'LA: 週のプランと設定画面が落ちずに開く');
    eq(r.cookRestored, false, 'LA: 未来の日の「決めた献立」を今日のものとして復元しない');
    // 現地が追いつく（LA が 6/11 になる）と、保存した記録がそのまま「今日」として使える
    await la.clock.setSystemTime(new Date('2026-06-11T08:00:00Z')); await la.evaluate(() => refreshToday());
    const r2 = await la.evaluate(() => ({T: TODAY, d0: lastDays().get(RECIPES[0].id), left: S.leftovers.map(leftDay), spend: spendWeek().length}));
    eq([r2.T, r2.d0, r2.left, r2.spend], ['2026-06-11', 0, [1], 1], 'LA が6/11になれば、保存した今日の記録が今日として使える');
    await la.ctx.close();
    // 反対向き: LA で保存 → 東京で開く（東京のほうが進んでいる）。先に保存した日付が「昨日」になる
    const la2 = await open('America/Los_Angeles', '2026-06-11T01:00:00Z', {onboarded: true, firstUse: '2026-06-01', settings: {country: 'JP', dishCount: 3}, history: [{d: '2026-06-10', id: 'x', slot: '主菜'}], leftovers: [{id: '', name: 'カレー', d: '2026-06-10'}]});
    const ls2 = await la2.evaluate(() => JSON.stringify(S)); await la2.ctx.close();
    const tk2 = await open('Asia/Tokyo', '2026-06-11T01:00:00Z', JSON.parse(ls2));
    eq(await tk2.evaluate(() => [TODAY, S.leftovers.map(leftDay)]), ['2026-06-11', [2]], 'LA→東京: 残り物は2日目');
    await tk2.ctx.close();
}
{   // 端末の日付が過去に戻された（開いたまま／起動時）
    const p = await open('Asia/Tokyo', '2026-06-20T03:00:00Z', { onboarded: true, firstUse: '2026-06-01', lastBackup: '2026-06-18', settings: { country: 'JP', dishCount: 3 }, history: [{d: '2026-06-19', id: 'jp_butaniku', slot: '主菜'}, {d: '2026-06-20', id: 'jp_butaniku', slot: '主菜'}] });
    await p.evaluate(() => { hasPro = () => true; });
    await p.clock.setSystemTime(new Date('2026-05-01T03:00:00Z'));   // 1か月以上戻す
    await p.evaluate(() => window.dispatchEvent(new Event('focus')));
    const r = await p.evaluate(() => { const o = {T: TODAY, ds: [...lastDays().entries()].length, streak: streak(), tr: trialUsed(), due: backupDue(), note: typeof backupNoteHtml(), wk: weekStats().days}; makeWeek(); o.plan = S.week.days.map(x => x.d); o.n = notifBuild(new Date()).length; render(); o.cards = document.querySelectorAll('.card').length; return o; });
    eq(r.T, '2026-05-01', '日付を戻すと今日も戻る'); eq(r.streak, 0, '未来の記録は連続日数に入れない'); eq(r.tr, 0, '使いはじめより前でも無料期間の経過は0日（負にならない）');
    eq(r.due, false, '書き出した日が未来でもお知らせは出ない（落ちない）'); eq(r.plan, Array.from({length: 7}, (_, i) => addD('2026-05-01', i)), '戻した日付から1週間プランを作れる');
    ok(r.cards > 0, '日付を戻しても画面が描かれる');
    await p.ctx.close();
}

// ---------- 7. 読み込み時の日付検証 ----------
{
    const p = await open('Asia/Tokyo', '2026-06-20T03:00:00Z');
    const r = await p.evaluate(() => {
        const st = normalizeState({history: [{d: '2026-02-30', id: 'a'}, {d: '2026-02-28', id: 'b'}, {d: '2026-13-01', id: 'c'}, {d: '2028-02-29', id: 'd'}, {d: '0000-00-00', id: 'e'}],
            spend: [{id: 'x', d: '2026-04-31', a: 5}, {id: 'y', d: '2026-04-30', a: 5}], firstUse: '2026-02-31', lastBackup: '2026-06-31', backupSnooze: '2026-06-30',
            leftovers: [{name: 'a', d: '2026-11-31'}, {name: 'b', d: '2026-11-30'}], week: {start: '2026-02-29', days: [{d: '2026-03-01', id: 'a'}]}});
        return {h: st.history.map(x => x.id).sort(), s: st.spend.map(x => x.id), fu: st.firstUse, lb: st.lastBackup, bs: st.backupSnooze, l: st.leftovers.map(x => x.name), w: st.week};
    });
    eq(r.h, ['b', 'd'], '暦にない履歴の日付は捨てる'); eq(r.s, ['y'], '暦にない食費の日付は捨てる'); eq(r.fu, '', '暦にない使いはじめは空に'); eq(r.lb, undefined, '暦にない書き出し日は捨てる');
    eq(r.bs, '2026-06-30', '正しい「あとで」の日は残す'); eq(r.l, ['b'], '暦にない残り物の日付は捨てる'); eq(r.w, null, '暦にない週の開始日はプランごと捨てる');
    await p.ctx.close();
}
{   // ソース検査: UTC で日付を作る書き方（toISOString().slice / new Date('YYYY-MM-DD')）が日付の計算に入っていない
    const html = await (await fetch(URL_)).text();
    const bad = html.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /toISOString\(\)\s*\.(slice|substr|split)|new Date\(\s*['"`]\d{4}-\d{2}-\d{2}|new Date\(\s*[a-zA-Z_.]*\b(?:d|date|ymd|today|TODAY)\b\s*\)|Date\.parse\(|getUTC(Date|Day|Month|FullYear)/.test(l) && !/^\s*\/\//.test(l));
    ok(bad.length === 0, 'UTC で日付を作る書き方が残っている: ' + bad.map(([n, l]) => n + ':' + l.trim().slice(0, 90)).join(' | '));
}

await b.close();
console.log(errs.length ? 'PAGE ERRORS:\n' + [...new Set(errs)].join('\n') : 'no page errors');
console.log(`${checks - fails}/${checks} passed`);
process.exit(fails || errs.length ? 1 : 0);
