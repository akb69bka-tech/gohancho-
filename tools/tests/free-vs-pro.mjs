#!/usr/bin/env node
// 無料版と Pro の線引きの回帰テスト（Playwright。使い方: node tools/tests/free-vs-pro.mjs [http://localhost:8795/]）
//  freeTier を有効にした状態（PLAN.billingMode='all', PLAN.freeTier=true。課金の経路は使わない）で、
//  ・ロックされない（購入画面が勝手に出ない）。今日の献立・買い物（今日の分）・作り方・記録は無料のまま
//  ・無料版の品数は4品まで（おまかせ・固定・お弁当・あと1品・保存献立のどれでも5品以上にならない）。5/6品を押すと理由つきの購入画面が出て、設定は変わらない
//  ・1週間プランは1日分だけ見え、買い物メモ・お知らせ・週カードもその範囲。2日目以降は伏せ字
//  ・ひとひねりは1日3回、買い足し提案は1件、やってみた/おいしかったは購入画面（データは変わらない）
//  ・hasPro() が true なら 5/6品・全7日・制限なし。課金なし（既定）では何も制限しない
//  ・購入画面の「プラスの内容」は、無料版にも入っている機能（世界のレシピ・冷蔵庫・家族に送る）を並べない
//  ・料金: 月額300円・年額3,000円（誰でも選べる。月額×12＝3,600円より600円お得）。1か月無料は両方。App Store の価格が取れたらそちらとそのお得を出す。billingMode は 'off' のまま
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready, SEED, rngScript, seedFor } = require('../lib/pw.cjs'); let seedN = 0;   // 乱数は SEED から（失敗したら表示の SEED=… を付けて実行すると同じ献立で再現する）
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const CCS = (process.env.CCS || 'JP,US,KR,FR,IN,TH').split(',');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
for (const cc of CCS){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('free-vs-pro', String(++seedN))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(cc => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:'auto'}})); } }, cc);
    await p.goto(URL_); await ready(p);
    const r = await p.evaluate(async cc => {
        const bad = [];
        const click = (act, o = {}) => { const e = document.createElement('button'); e.dataset.act = act; Object.entries(o).forEach(([k, v]) => e.dataset[k] = v); document.body.appendChild(e); e.click(); e.remove(); };
        const paywalls = []; const op = openPaywall; openPaywall = reason => { paywalls.push(reason); sheet = null; };
        // --- 課金なし（既定）: 何も制限しない
        if (!hasPro() || isLocked()) bad.push('課金なしなのに制限がある');
        // --- 課金あり・無料版を残す
        PLAN.billingMode = 'all'; PLAN.freeTier = true; S.pro = null; S.firstUse = TODAY;
        if (!PLAN.billingEnabled) bad.push('billingEnabled にならない');
        if (isLocked()) bad.push('freeTier なのにロックされる');
        if (hasPro()) bad.push('freeTier で未購入なのに hasPro');
        // 品数: おまかせ・固定・お弁当・気分のどれでも4品まで
        const moods = MOODS.map(m => m.k);
        for (const dc of ['auto', 2, 3, 4, 5, 6]) for (const mood of moods) for (let k = 0; k < 8; k++){
            S.settings.dishCount = dc; session.mood = mood; session.countSalt = k;
            const n = menuCount(); if (n > 4) bad.push('無料で ' + n + '品 dc=' + dc + ' mood=' + mood);
        }
        S.settings.dishCount = 3; session.mood = moods[0]; session.menu = null; render();
        // 汁ものの麺（肉うどん）や汁ものが主菜のときは、汁ものの枠を空にする仕様（suggestOrAny）。その空きは「出ない」に数えない
        const soupMain = m => typeof soupyMain === 'function' ? soupyMain(m) : !!m && (m.id === 'nikuudon' || m.type === '汁物');   // 汁けの多い主菜（A5: ラーメン・鍋・シチューなど）の日も同じ
        if (!session.menu || session.menu.n !== dishesFor(3) || !session.menu.items.every(x => x.r || (x.slot === '汁物' && soupMain(session.menu.items[0].r)))) bad.push('無料で今日の献立が出ない');
        paywalls.length = 0;
        // 品数の値は席の数（ご飯の席も1品。基準書 7章 4A）。無料版の上限はおかず4（ご飯のある国では5席）
        const v5 = dishSeats(5), v6 = dishSeats(6), v4 = dishSeats(4);
        click('count', {v: v5}); if (paywalls[0] !== 'dishes' || S.settings.dishCount !== 3) bad.push('おかず5（' + v5 + '品）で購入画面が出ない/設定が変わった');
        click('count', {v: v6}); if (S.settings.dishCount !== 3) bad.push('おかず6（' + v6 + '品）で設定が変わった');
        click('count', {v: v4}); if (S.settings.dishCount !== v4) bad.push('おかず4（' + v4 + '品）は無料で選べるはず');
        // 画面の品数は、ご飯の席も1品と数える（基準書 7章 4A）。値（おかずの数）4 は、ご飯のある国では「5品」と出る
        if (document.body.innerText.indexOf(t('無料版は{n}品までなので{n}品です', {n: dishSeats(4)})) >= 0) bad.push('4品固定なのに「4品までなので」と出る');
        S.settings.dishCount = 6;   // 以前 Pro で選んだ値: 無料では4品で、理由を言う
        if (menuCount() !== 4 || countReason(4) !== t('無料版は{n}品までなので{n}品です', {n: dishSeats(4)})) bad.push('6品設定の理由が正直でない');
        // あと1品: 4品を超えて足せない（入れかえになる）
        S.settings.dishCount = dishSeats(4); session.menu = null; render();   // おかず4（席の数で）
        const fake = RECIPES.find(r => slotOf(r) === '副菜' && !session.menu.items.some(x => x.r && x.r.id === r.id));
        if (fake && oneCanAdd(fake) && session.menu.items.every(x => x.r)) bad.push('あと1品で無料の5品目が足せる');
        // 買い物: 今日の分は無料
        S.settings.dishCount = 3; S.week = null; makeWeek();
        const vis = visiblePlanDaysAll();
        if (vis.length !== PLAN.freeLimits.weekDays) bad.push('見える日数 ' + vis.length);
        const ex = new Set(S.week.days.filter(x => x.d >= TODAY).slice(PLAN.freeLimits.weekDays).filter(x => !x.skip).map(x => x.id));
        const names = new Set(visiblePlanDays().flatMap(x => dayDishes(x).map(r => r.name)));
        shoppingList().forEach(e => e.dishes.forEach(n => { if (!names.has(n)) bad.push('買い物メモに見えない日の料理: ' + n); }));
        if (visiblePlanDays().length && !shoppingList().length && !S.fridge.length) bad.push('今日の分の買い物メモが空');
        if (!weekCutByFree()) bad.push('weekCutByFree');
        S.settings.remind = 8; const generic = t('今日の献立を決めましょう'), nb = notifBuild(new Date(0)).filter(n => n.id >= NOTIFY_DAY_ID && n.id < NOTIFY_DAY_ID + 14 && n.title !== generic).length; if (nb > PLAN.freeLimits.weekDays) bad.push('お知らせが見えない日まで予約される ' + nb);
        const html = viewToday();
        const locked = (html.match(/item locked/g) || []).length; if (locked !== S.week.days.filter(x => x.d >= TODAY).length - PLAN.freeLimits.weekDays) bad.push('伏せ字の日数 ' + locked);
        // 買い足し提案: 1件だけ
        // やってみた・おいしかった: 購入画面。データは変わらない
        const sk = S.skills.length, ya = JSON.stringify(S.history);
        paywalls.length = 0; click('skill-done', {id: RECIPES[0].id}); click('yum', {id: RECIPES[0].id, d: TODAY});
        if (paywalls.join() !== 'skill,award' || S.skills.length !== sk || JSON.stringify(S.history) !== ya) bad.push('やってみた/おいしかった の門: ' + paywalls.join());
        // ひとひねり: 1日3回
        if (twistAvailable()){
            S.usage = {}; paywalls.length = 0; let granted = 0; for (let i = 0; i < 5; i++) if (useTwistQuota()) granted++;
            if (granted !== PLAN.freeLimits.twistPerDay || paywalls.length !== 2 || paywalls[0] !== 'twist') bad.push('ひとひねり回数 ' + granted);
        }
        // 購入画面の内容は、本当に Pro の機能だけ
        const ben = PLAN.benefits.join('|');
        for (const free of ['世界のレシピ', '家族に送る', '冷蔵庫の材料から探せる', '毎日の献立を、お膳ごと提案', '同じ料理が続かない']) if (ben.includes(t(free))) bad.push('無料の機能が「プラスの内容」にある: ' + free);
        for (const k of ['dishes', 'twist', 'photos', 'week', 'skill', 'award', 'hints']) if (!paywallReason(k)) bad.push('理由の文がない ' + k);
        // 「プラスの内容」を開いても閉じられる（ロックされない）
        openPaywall = op; openPaywall('info'); if (!sheet || sheet.kind !== 'paywall') bad.push('購入画面が開かない'); closeSheet(); if (sheet) bad.push('購入画面が閉じられない');
        // 購入画面の文に、無料版にある機能を「ない」と書いていない（無料の範囲は理由文に正直）
        // --- Pro: 制限なし
        const hp = hasPro; hasPro = () => true;
        S.settings.dishCount = dishSeats(6); session.mood = moods[0]; if (menuCount() !== 6) bad.push('Pro でおかず6（' + dishSeats(6) + '品）にならない');   // 値は席の数
        if (visiblePlanDaysAll().length !== S.week.days.filter(x => x.d >= TODAY).length) bad.push('Pro で全日見えない');
        paywalls.length = 0; openPaywall = reason => { paywalls.push(reason); sheet = null; };
        click('skill-done', {id: RECIPES[1].id}); click('count', {v: 5}); if (paywalls.length) bad.push('Pro なのに購入画面 ' + paywalls);
        hasPro = hp;
        // --- 料金（オーナー決定 2026-10-31）: 月額300円・年額3,000円（最初から誰でも選べる）。どちらも1か月無料。App Store の価格が取れたらそちらを出す
        const mo = PLAN.prices.find(x => x.id === 'gohancho_plus_monthly'), yr = PLAN.prices.find(x => x.id === 'gohancho_plus_yearly');
        if (PLAN.prices.length !== 2 || !mo || !yr || mo.per !== '月' || yr.per !== '年') bad.push('プランが月額・年額の2つでない: ' + PLAN.prices.map(x => x.id));
        if (mo && yr && (mo.yen !== 300 || yr.yen !== 3000 || mo.yen * 12 - yr.yen !== 600)) bad.push('目安の価格が 300円・3,000円（600円お得）でない');
        if ('loyalty' in PLAN || 'loyaltyEnabled' in PLAN || typeof loyalEligible === 'function') bad.push('「1年つづいた人だけ」の年額のしくみが残っている');
        const showPw = () => { op('info'); const bs = [...document.querySelectorAll('#sheet-root .pw-price')].map(e => ({id:e.dataset.id, l:(e.querySelector('.l') || {}).textContent || '', p:(e.querySelector('.p') || {}).textContent || '', n:(e.querySelector('.n') || {}).textContent || ''})); const terms = (document.querySelector('#sheet-root .pw-terms') || {}).textContent || ''; closeSheet(); return {bs, terms}; };
        const ja = cc === 'JP' || LANG === 'ja';
        let pw = showPw();
        if (pw.bs.map(x => x.id).join() !== 'gohancho_plus_monthly,gohancho_plus_yearly') bad.push('購入画面に月額と年額の両方が出ない（誰でも選べるはず）: ' + pw.bs.map(x => x.id));
        else if (ja){
            if (pw.bs[0].p !== t('300円 / 月') || pw.bs[1].p !== t('3,000円 / 年')) bad.push('目安の価格の表示: ' + pw.bs.map(x => x.p));
            const want = t('月額の12か月分（{total}）より{save}お得', {total:t('3,600円'), save:t('600円')});
            if (pw.bs[1].n !== want) bad.push('年額のお得の文: ' + pw.bs[1].n);
            if (LANG === 'ja' && pw.bs[1].n !== '月額の12か月分（3,600円）より600円お得') bad.push('年額のお得の文（日本語）: ' + pw.bs[1].n);
            if (!pw.terms.includes(t('{plan}（{price}・1年ごとに自動更新）', {plan:yr.label, price:t('3,000円 / 年')})) || !pw.terms.includes(t('{plan}（{price}・1か月ごとに自動更新）', {plan:mo.label, price:t('300円 / 月')}))) bad.push('料金と解約に月額・年額の更新の文がない');
            // 1か月無料は月額・年額の両方（はじめての人）
            if (!pw.bs[0].l.includes(introShort()) || !pw.bs[1].l.includes(introShort())) bad.push('お試しの文が月額・年額の両方にない: ' + pw.bs.map(x => x.l));
            if (!pw.terms.includes(t('年額プランを選んだ場合も、{trial}のあと{price}になります。', {trial:introShort(), price:t('3,000円 / 年')}))) bad.push('年額のお試しのあとの価格の文がない');
        }else if (pw.bs.some(x => x.p || x.n)) bad.push('日本以外で、App Store の価格がないのに円の価格・お得の文が出る: ' + JSON.stringify(pw.bs));
        // App Store の実際の価格が取れたら、その価格とその価格で計算したお得を出す（目安の円は出さない）
        storePrices.gohancho_plus_monthly = {text:'$2.99', value:2.99, currency:'USD'}; storePrices.gohancho_plus_yearly = {text:'$29.99', value:29.99, currency:'USD'};
        pw = showPw();
        const fm = new Intl.NumberFormat(LANG, {style:'currency', currency:'USD', minimumFractionDigits:2, maximumFractionDigits:2});
        if (pw.bs.length !== 2 || pw.bs[0].p !== t('{price} / 月', {price:'$2.99'}) || pw.bs[1].p !== t('{price} / 年', {price:'$29.99'})) bad.push('App Store の価格が優先されない: ' + pw.bs.map(x => x.p));
        else if (pw.bs[1].n !== t('月額の12か月分（{total}）より{save}お得', {total:fm.format(35.88), save:fm.format(5.89)})) bad.push('App Store の価格でのお得の文: ' + pw.bs[1].n);
        if (pw.bs.some(x => /円|¥/.test(x.p + x.n)) && !/¥/.test(fm.format(1))) bad.push('App Store の価格があるのに目安の円が出る');
        storePrices.gohancho_plus_yearly = {text:'$40.00', value:40, currency:'USD'};   // 年額が月額×12以上ならお得と書かない
        pw = showPw(); if (pw.bs[1] && pw.bs[1].n) bad.push('お得でないのにお得の文: ' + pw.bs[1].n);
        delete storePrices.gohancho_plus_monthly; delete storePrices.gohancho_plus_yearly;
        // --- freeTier を切ると、お試し後はロック（いまの本番の動き）
        PLAN.freeTier = false; if (!isLocked()) bad.push('freeTier=false なのにロックされない');
        PLAN.billingMode = 'native'; PLAN.freeTier = false;
        return bad;
    }, cc);
    r.forEach(m => ok(false, cc + ': ' + m)); ok(true, cc);
    await ctx.close();
}
// 静的: 門の理由はこの一覧だけ（足したら線引き表も更新する）
const src = (await import('node:fs')).readFileSync(new URL('../../gohancho/index.html', import.meta.url), 'utf8');
// 静的: 課金は App Store に出してオーナーが価格を設定するまで始めない（Web 版は無料）
ok(/billingMode: 'off',/.test(src), "PLAN.billingMode が 'off' でない（課金の開始はオーナーが App Store Connect で価格を設定してから）");
ok(/trialMode: 'store',/.test(src), "PLAN.trialMode が 'store'（App Store のお試しオファー）でない");
const reasons = new Set([...src.matchAll(/openPaywall\('([a-zA-Z]+)'\)/g)].map(m => m[1]));
const known = ['twist', 'dishes', 'info', 'week', 'skill', 'hints', 'award', 'photos', 'monitor', 'start', 'locked'];
reasons.forEach(x => ok(known.includes(x), '知らない購入画面の理由: ' + x));
console.log(`${checks - fails}/${checks} ok`, errs.length ? errs : '');
await b.close(); process.exit(fails || errs.length ? 1 : 0);
