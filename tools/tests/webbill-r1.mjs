#!/usr/bin/env node
// Web 版 300円課金の下準備の回帰テスト（Playwright。使い方: node tools/tests/webbill-r1.mjs [http://localhost:9404/]）
//  W1 既定（billingMode 'off'）: 設定にも購入画面にも課金の表示が一切ない（購入ボタン・復元・購入ID・特商法の表記・解約）。決済 SDK の通信もしない。静的に 'off' かつ Web の設定値が空
//  W2 billingMode 'all' でも、設定値（Web の公開キー・特商法の URL・利用規約の URL）が1つでも空なら課金は有効にならない（全員無料のまま・ロックされない）。iPhone でも RevenueCat のキーが空なら有効にならない
//  W3 設定値がそろって 'all' のとき: 購入ボタン（月額・年額＝円）・復元・購入ID・特商法の表記・解約の案内が出る。英語でも円で出る
//  W4 （RevenueCat の Web SDK を模したもので）購入 → プラスになる／復元／キャンセルでは何も変わらない／SDK が読めなくても落ちない
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready, SEED, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [], sdkReq = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
const FAKE_SDK = `window.__calls=[];window.Purchases={Purchases:{configure(o){window.__calls.push(['configure',o.appUserId]);const ci=(act)=>({entitlements:{active:act?{plus:{originalPurchaseDate:new Date('2026-11-07T01:00:00Z'),expirationDate:new Date('2026-12-07T01:00:00Z'),periodType:'trial',productIdentifier:'gohancho_plus_monthly',willRenew:true}}:{}},managementURL:'https://example.invalid/manage'});
return {getOfferings:async()=>({current:{availablePackages:[{identifier:'$rc_monthly'},{identifier:'$rc_annual'}]}}),purchase:async(a)=>{window.__calls.push(['purchase',a.rcPackage.identifier]);if(window.__cancel){const e=new Error('cancel');e.userCancelled=true;throw e;}window.__bought=true;return {customerInfo:ci(true)};},getCustomerInfo:async()=>ci(!!window.__bought)};}}};`;
async function open({lang = 'ja', sdk = 'none'} = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: lang === 'ja' ? 'ja-JP' : 'en-US' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.route(/jsdelivr|unpkg|revenuecat|stripe/, r => { sdkReq.push(r.request().url()); if (sdk === 'fake') r.fulfill({contentType: 'application/javascript', body: FAKE_SDK}); else r.abort(); });
    await ctx.addInitScript(rngScript(seedFor('webbill', lang)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lang + ': ' + e.message));
    await p.addInitScript(lang => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:'JP', dishCount:3, uiLang:lang}})); } }, lang);
    await p.goto(URL_); await ready(p);
    return { ctx, p };
}
const CONF = "PLAN.revenueCatWebKey='rcb_test'; PLAN.legalUrl='https://example.invalid/tokushoho'; PLAN.webTermsUrl='https://example.invalid/terms';";

// ---- W1 既定（off）----
{
    const { ctx, p } = await open();
    const r = await p.evaluate(async () => {
        const bad = [];
        if (PLAN.billingMode !== 'off' || PLAN.billingEnabled || !hasPro() || isLocked()) bad.push('off なのに課金が有効/制限がある');
        if (PLAN.revenueCatWebKey || PLAN.legalUrl || PLAN.webTermsUrl || PLAN.revenueCatApiKey) bad.push('設定値が空でない（キーや URL は、オーナーが記入するまで空）');
        S.firstUse = '2020-01-01'; save();
        const out = [];
        openPaywall('start');
        const html = document.querySelector('#sheet-root').innerHTML;
        for (const re of [/data-act="buy"/, /data-act="restore"/, /data-act="link-id"/, /data-act="manage-sub"/, /pw-terms/, /tokushoho|特定商取引/, /web_[0-9a-f]/]) if (re.test(html)) bad.push('off なのに課金の表示: ' + re);
        if (!/無料/.test(document.querySelector('#sheet-root').innerText)) bad.push('off の案内に「無料」がない');
        closeSheet();
        return bad;
    });
    r.forEach(m => ok(false, 'W1 ' + m)); ok(true, 'W1');
    const txt = await p.evaluate(() => { setTab('settings'); document.querySelectorAll('details').forEach(d => d.open = true); return document.body.innerText; });
    ok(/すべてのデータを消す|プライバシー/.test(txt) && txt.includes('わが家のご飯帖は無料です'), 'W1 設定の画面が開けていない/無料の案内がない');
    ok(!/購入を復元|購入ID|特定商取引|プランの管理・解約/.test(txt), 'W1 設定に課金の表示が出ている');
    ok(sdkReq.length === 0, 'W1 off なのに決済 SDK へ通信した: ' + sdkReq);
    await ctx.close();
}
// ---- W2 'all' でも設定値が空なら有効にならない ----
{
    const { ctx, p } = await open();
    const r = await p.evaluate(CONFS => {
        const bad = [];
        PLAN.billingMode = 'all';
        if (PLAN.billingEnabled || !hasPro() || isLocked()) bad.push("'all' で設定値が全部空なのに有効/ロック");
        for (const k of ['revenueCatWebKey', 'legalUrl', 'webTermsUrl']){
            PLAN.revenueCatWebKey = 'k'; PLAN.legalUrl = 'u'; PLAN.webTermsUrl = 'u'; PLAN[k] = '';
            if (PLAN.billingEnabled) bad.push(k + ' が空なのに有効');
        }
        PLAN.revenueCatWebKey = 'k'; PLAN.legalUrl = 'u'; PLAN.webTermsUrl = 'u';
        if (!PLAN.billingEnabled) bad.push('そろっているのに有効にならない');
        const n0 = isNative; isNative = () => true; PLAN.revenueCatApiKey = '';
        if (PLAN.billingEnabled) bad.push('iPhone で RevenueCat のキーが空なのに有効');
        PLAN.revenueCatApiKey = 'appl_x'; if (!PLAN.billingEnabled) bad.push('iPhone でキーがあるのに有効にならない');
        PLAN.revenueCatApiKey = ''; isNative = n0;
        PLAN.billingMode = 'off'; if (PLAN.billingEnabled) bad.push('off に戻しても有効');
        return bad;
    });
    r.forEach(m => ok(false, 'W2 ' + m)); ok(true, 'W2'); await ctx.close();
}
// ---- W3 そろった 'all'（SDK なし）----
for (const lang of ['ja', 'en']){
    const { ctx, p } = await open({lang});
    const r = await p.evaluate(CONF => {
        const bad = []; eval(CONF.code); PLAN.billingMode = 'all'; S.firstUse = '2020-01-01'; S.pro = null;
        openPaywall('start');
        const root = document.querySelector('#sheet-root'), html = root.innerHTML, txt = root.innerText;
        const buys = [...root.querySelectorAll('[data-act=buy]')];
        if (buys.length !== 2) bad.push('購入ボタンが2つでない: ' + buys.length);
        if (!/300/.test(txt) || !/3,?000/.test(txt)) bad.push('円の料金が出ない');
        for (const a of ['restore', 'link-id']) if (!root.querySelector('[data-act=' + a + ']')) bad.push(a + ' のボタンがない');
        if (!root.querySelector('a[href="https://example.invalid/tokushoho"]')) bad.push('特商法の表記へのリンクがない');
        if (!root.querySelector('a[href="https://example.invalid/terms"]')) bad.push('Web の利用規約へのリンクがない');
        if (/Apple ID/.test(txt)) bad.push('Web の案内に Apple ID の解約手順が出る');
        if (!/web_/.test(txt)) bad.push('購入IDが出ない');
        if (document.documentElement.scrollWidth > innerWidth + 1) bad.push('横にはみ出す');
        closeSheet(); setTab('settings'); document.querySelectorAll('details').forEach(d => d.open = true);
        if (!document.querySelector('#view [data-act=restore]')) bad.push('設定に購入を復元がない');
        PLAN.billingMode = 'off';
        return bad;
    }, {code: CONF});
    r.forEach(m => ok(false, 'W3 ' + lang + ' ' + m)); ok(true, 'W3 ' + lang); await ctx.close();
}
// ---- W4 SDK を模して購入・復元・キャンセル ----
{
    const { ctx, p } = await open({sdk: 'fake'});
    await p.evaluate(CONF => { eval(CONF); PLAN.billingMode = 'all'; S.firstUse = '2020-01-01'; S.pro = null; save(); }, CONF);
    await p.evaluate(() => { window.__cancel = true; return purchase('gohancho_plus_monthly'); });
    ok(await p.evaluate(() => !isSubscribed() && !hasPro()), 'W4 キャンセルでプラスになった');
    await p.evaluate(() => { window.__cancel = false; return purchase('gohancho_plus_yearly'); });
    const r = await p.evaluate(() => ({sub: isSubscribed(), pro: hasPro(), calls: JSON.stringify(window.__calls), uid: S.webUid, manage: S.pro && S.pro.manageUrl, exp: S.pro && S.pro.expires, trial: S.pro && S.pro.trialEnd}));
    ok(r.sub && r.pro, 'W4 購入してもプラスにならない ' + JSON.stringify(r));
    ok(/"purchase","\$rc_annual"/.test(r.calls), 'W4 年額のパッケージが選ばれない ' + r.calls);
    ok(r.uid && r.calls.includes(r.uid), 'W4 購入IDが SDK に渡らない');
    ok(r.manage === 'https://example.invalid/manage', 'W4 管理ページの URL を覚えない');
    ok(r.exp === '2026-12-07', 'W4 更新日が読めない ' + r.exp);
    // 復元: 別の状態から購入IDで取り直す
    await p.evaluate(() => { S.pro = null; save(); return restorePurchases(); });
    ok(await p.evaluate(() => isSubscribed()), 'W4 復元できない');
    // すべて消しても購入IDは残る（プランを失わない）
    // SDK が読めないとき: 落ちない・プラスにならない
    const q = await open({sdk: 'none'});
    await q.p.evaluate(CONF => { eval(CONF); PLAN.billingMode = 'all'; S.firstUse = '2020-01-01'; S.pro = null; save(); }, CONF);
    await q.p.evaluate(() => purchase('gohancho_plus_monthly')); await q.p.evaluate(() => restorePurchases());
    ok(await q.p.evaluate(() => !isSubscribed()), 'W4 SDK が読めないのにプラス');
    await q.ctx.close(); await ctx.close();
}
const src = fs.readFileSync(new URL('../../gohancho/index.html', import.meta.url), 'utf8');
ok(/billingMode: 'off',/.test(src), "PLAN.billingMode が 'off' でない（課金の開始はオーナーだけが決める）");
ok(/revenueCatWebKey: '',/.test(src) && /legalUrl: '',/.test(src) && /webTermsUrl: '',/.test(src) && /revenueCatApiKey: '',/.test(src), '決済の設定値（キー・URL）が空でない');
ok(!/rcb_[A-Za-z0-9]{6,}|sk_(live|test)_|pk_(live|test)_/.test(src), 'キーらしい文字列がコードに入っている');
ok(errs.length === 0, 'ページのエラー: ' + errs.slice(0, 3).join(' | '));
await b.close();
console.log(`webbill-r1: ${checks} checks, ${fails} fail`);
process.exit(fails ? 1 : 0);
