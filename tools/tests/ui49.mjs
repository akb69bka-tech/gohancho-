#!/usr/bin/env node
// ui49（R146）: 全員無料のあいだは「プランと購入」の入口を見せない。課金が有効なら今までどおり出る
//  オーナー決定（2026-11-23）で既定は billingMode 'native'（iPhone アプリ版だけ課金。Web 版は無料のまま）
//  使い方: node tools/tests/ui49.mjs [http://localhost:9331/]
//  U1 既定（'native'）の Web 版・'native' の iPhone アプリ版で RevenueCat のキーが空のとき・'off'（全員無料）: 設定の全部のタブ・下のタブ全部（今日・1週間プラン・作る・冷蔵庫・道具・ひとひねり・世界・記録）に「プランと購入」「プラスの内容」「ご飯帖プラス」の文字と、購入画面を開く入口（data-act="paywall…"）・「プラス」の札が 0 か所。
//     設定のタブの名前は「その他」（プランの字を出さない）。18言語（訳した文字で数える）
//     U1b・U1c は ja・en・ar の3言語（U1a の既定の Web 版は18言語）
//  U2 'native' の iPhone アプリ版でキーがあるとき・'all'（Web も課金）: 「プランと購入」のまとまりと「プラスの内容」／「…を見る」の入口が、プランのタブに今までどおり出る。タブの名前は「プラン・その他」
//  U3 課金のしくみは変えていない: 既定は 'native'・価格2つ（年額は yearlyOn: false で出さない・確認まとめ85）・購入の処理（openPaywall・購入の画面）はそのまま。Web 版では課金は有効にならず、全部の機能が使える
//  U4 'native' の iPhone アプリ版でキーがあるとき: 購入画面・設定に年額の価格も「年額」「年」の語も出ない（App Store から年額の価格が取れたときも、取れずに目安を出すときも）。月額は出る
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const LANGS = ['ja', ...fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''))];
const WORDS = ['プランと購入', 'プラスの内容', 'ご飯帖プラス', '{plan}を見る', 'プラン・その他', 'プラスで見られます', 'プラス'];
const trOf = lg => { if (lg === 'ja') return null; let d = null; vm.runInNewContext(fs.readFileSync(`${ROOT}/i18n/${lg}.js`, 'utf8'), {GOHAN_I18N: (l, o) => { d = o; }, window: {}}); return d; };

// U3 静的: 既定は 'native'（オーナー決定 2026-11-23）・年額は出さない（あとで足せるように行は残す）
const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
ok(/billingMode:\s*'native',/.test(src) && /yearlyOn:\s*false,/.test(src) && /revenueCatApiKey:\s*'',/.test(src) && /function openPaywall\(/.test(src) && /gohancho_plus_monthly/.test(src) && /gohancho_plus_yearly/.test(src), "U3a 既定は billingMode 'native'・yearlyOn false・キーは空。価格・購入画面のしくみは残っている");

const b = await chromium.launch(LAUNCH);
// iPhone アプリ版のまね（Capacitor）。store を渡すと RevenueCat のプラグイン（Purchases）もまねる: その製品の価格と1か月のお試しを返す
const capScript = store => `window.Capacitor = {isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: {${store ? `Purchases: {
    configure: async () => {}, getCustomerInfo: async () => ({customerInfo: {entitlements: {active: {}}}}),
    checkTrialOrIntroductoryPriceEligibility: async o => Object.fromEntries(o.productIdentifiers.map(id => [id, {status: 2}])),
    getOfferings: async () => ({current: {availablePackages: ${JSON.stringify(store)}.map(([id, ps, pr]) => ({identifier: id, product: {identifier: id, priceString: ps, price: pr, currencyCode: 'JPY', introPrice: {periodUnit: 'MONTH', periodNumberOfUnits: 1, price: 0}}}))}})}` : ''}}};`;
const open = async (lg, o = {}) => {
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    if (o.native) await ctx.addInitScript(capScript(o.store));
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } },
        {onboarded: true, firstUse: '2020-01-01', settings: {country: 'JP', uiLang: lg, dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'a', role: 'adult', avoid: [], allergy: []}]});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lg + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view > *'), null, {timeout: 30000});
    return {p, ctx};
};
// 設定の全部のタブと、今日・買い物・1週間プランの文字と入口を集める
const scan = p => p.evaluate(async () => {
    const tick = () => new Promise(r => setTimeout(r, 50));
    const out = {txt: [], acts: [], marks: 0, tabs: []};
    const grab = () => { const v = document.querySelector('#view'); out.txt.push(v.innerText); v.querySelectorAll('[data-act^="paywall"]').forEach(e => out.acts.push(e.dataset.act)); out.marks += v.querySelectorAll('.plus-mark').length; };
    setTab('settings'); await tick();
    document.querySelectorAll('#view details').forEach(d => d.open = true);
    out.tabs = [...document.querySelectorAll('#view .set-tab')].map(e => e.textContent.trim());
    for (const [k] of SET_TABS){ setTabShow(k); await tick(); grab(); }
    setTab('today'); await tick(); S.foldOpen = Object.assign({}, S.foldOpen, {week: true}); if (!S.week) makeWeek(); render(); await tick(); grab();
    for (const tb of ['cook', 'fridge', 'tools', 'twist', 'world', 'log']){ setTab(tb); await tick(); grab(); }
    setTab('today'); await tick();
    return out;
});

// ---- U1 'off' ----
{
    const bad = [];
    for (const lg of LANGS){
        const tr = trOf(lg), w = WORDS.map(x => (tr && tr[x]) || x).map(x => x.replace(/\{plan\}/, (tr && tr['ご飯帖プラス']) || 'ご飯帖プラス'));
        const {p, ctx} = await open(lg);
        const r = await scan(p);
        const st = await p.evaluate(() => ({mode: PLAN.billingMode, native: isNative(), enabled: PLAN.billingEnabled, pro: hasPro(), locked: isLocked()}));
        const txt = r.txt.join('\n');
        // 「プラス」1語は他の言葉の中にも出る（例: 日本語の「プラスチック」はない）ので、札（.plus-mark）で数える。ほかの語は文字で数える
        const hit = w.slice(0, -1).filter(x => x && txt.includes(x));
        if (st.mode !== 'native' || st.native || st.enabled || !st.pro || st.locked) bad.push(lg + ' Web 版で課金が有効 ' + JSON.stringify(st));
        if (hit.length || r.acts.length || r.marks) bad.push(`${lg} 文字 ${JSON.stringify(hit)} 入口 ${JSON.stringify(r.acts)} 札 ${r.marks}`);
        if (lg === 'ja' && r.tabs[r.tabs.length - 1] !== 'その他') bad.push('ja タブの名前 ' + r.tabs.join(','));
        await ctx.close();
    }
    ok(!bad.length, `U1a 既定の 'native' の Web 版（${LANGS.length}言語）: 「プランと購入」の入口・文字・札が 0 か所: ` + bad.slice(0, 6).join(' || '));
}
// U1b 'native' の iPhone アプリ版で、RevenueCat のキーが空のあいだ（いまの既定）・U1c 'off'（全員無料。オーナーが戻したとき）
for (const [id, o] of [['U1b', {native: true, label: "'native' の iPhone アプリ版でキーが空"}], ['U1c', {off: true, label: "'off'"}]]){
    const bad = [];
    for (const lg of ['ja', 'en', 'ar']){
        const tr = trOf(lg), w = WORDS.map(x => (tr && tr[x]) || x).map(x => x.replace(/\{plan\}/, (tr && tr['ご飯帖プラス']) || 'ご飯帖プラス'));
        const {p, ctx} = await open(lg, o);
        if (o.off) await p.evaluate(() => { PLAN.billingMode = 'off'; render(); });
        const r = await scan(p);
        const st = await p.evaluate(() => ({mode: PLAN.billingMode, native: isNative(), key: PLAN.revenueCatApiKey, enabled: PLAN.billingEnabled, pro: hasPro(), locked: isLocked()}));
        const txt = r.txt.join('\n'), hit = w.slice(0, -1).filter(x => x && txt.includes(x));
        if (st.mode !== (o.off ? 'off' : 'native') || st.native !== !!o.native || st.key || st.enabled || !st.pro || st.locked) bad.push(lg + ' 課金が有効 ' + JSON.stringify(st));
        if (hit.length || r.acts.length || r.marks) bad.push(`${lg} 文字 ${JSON.stringify(hit)} 入口 ${JSON.stringify(r.acts)} 札 ${r.marks}`);
        if (lg === 'ja' && r.tabs[r.tabs.length - 1] !== 'その他') bad.push('ja タブの名前 ' + r.tabs.join(','));
        await ctx.close();
    }
    ok(!bad.length, `${id} ${o.label}（ja・en・ar）: 課金は有効にならず全部の機能が使え、「プランと購入」の入口・文字・札が 0 か所: ` + bad.slice(0, 6).join(' || '));
}

// ---- U2 'native'・'all' ----
{
    const bad = [];
    for (const mode of ['native', 'all']){
        const {p, ctx} = await open('ja', {native: mode === 'native'});
        const r = await p.evaluate(async mode => {
            PLAN.billingMode = mode; if (mode === 'native') PLAN.revenueCatApiKey = 'appl_test'; else { PLAN.revenueCatWebKey = 'rcb_test'; PLAN.legalUrl = 'x'; PLAN.webTermsUrl = 'x'; }
            const o0 = {enabled: PLAN.billingEnabled}; setTab('settings'); await new Promise(r => setTimeout(r, 50)); setTabShow('plan'); await new Promise(r => setTimeout(r, 50));
            const v = document.querySelector('#view'), sec = v.querySelector('#set-plan');
            const o = {sec: !!sec && !sec.closest('[hidden]'), title: sec ? sec.querySelector('.set-sec-h').textContent.trim() : '', pay: v.querySelectorAll('#set-plan [data-act="paywall"]').length,
                tab: [...v.querySelectorAll('.set-tab')].map(e => e.textContent.trim()).pop()};
            if (o.pay) { v.querySelector('#set-plan [data-act="paywall"]').click(); await new Promise(r => setTimeout(r, 80)); o.sheet = !!document.querySelector('#sheet-root .sheet-paywall, #sheet-root .pw-head'); closeSheet(); }
            o.enabled = o0.enabled; return o;
        }, mode);
        if (!(r.enabled && r.sec && r.title === 'プランと購入' && r.pay === 1 && r.tab === 'プラン・その他' && r.sheet)) bad.push(mode + ' ' + JSON.stringify(r));
        await ctx.close();
    }
    ok(!bad.length, "U2 'native'（iPhone アプリ版・キーあり）・'all'（Web の設定あり）では「プランと購入」と入口が今までどおり出て、押すと購入画面（の紹介）が開く: " + bad.join(' || '));
}

// ---- U4 年額を出さない（確認まとめ85） ----
{
    const bad = [];
    for (const [lg, store] of [['ja', [['$rc_monthly', '¥300', 300], ['$rc_annual', '¥3,000', 3000]]], ['ja', null], ['en', [['$rc_monthly', '¥300', 300], ['$rc_annual', '¥3,000', 3000]]]]){
        const st = store && store.map(([pk, ps, pr]) => [pk === '$rc_monthly' ? 'gohancho_plus_monthly' : 'gohancho_plus_yearly', ps, pr]);
        const {p, ctx} = await open(lg, {native: true, store: st});
        const r = await p.evaluate(async () => {
            const tick = (n = 80) => new Promise(r => setTimeout(r, n));
            PLAN.revenueCatApiKey = 'appl_test'; S.pro = null; save();
            if (purchasesPlugin()){ await loadStorePrices(); for (let i = 0; i < 40 && !introChecked; i++) await tick(50); }
            openPaywall('settings'); await tick(); const sh = document.querySelector('#sheet-root');
            const o = {enabled: PLAN.billingEnabled, store: Object.keys(storePrices), txt: sh ? sh.innerText : '', btns: [...document.querySelectorAll('#sheet-root .pw-price')].map(e => e.dataset.id || e.dataset.product || e.innerText.replace(/\s+/g, ' '))};
            closeSheet(); setTab('settings'); await tick(50); setTabShow('plan'); await tick(50); o.set = document.querySelector('#view').innerText; return o;
        });
        const tr = trOf(lg), YR = ['年額プラン', '3,000円 / 年'].map(k => (tr && tr[k]) || k);   // 年額の名前と目安の価格（訳した文字のまま）
        const yw = lg === 'ja' ? /年額|\/\s*年|1年|年ごと|3,000/ : /year|annual|3,000/i;
        const all = r.txt + '\n' + r.set;
        const hits = [...new Set([...(all.match(new RegExp(yw.source, 'g' + yw.flags)) || []), ...YR.filter(x => all.includes(x))])];
        const monthly = lg === 'ja' ? /\/\s*月/ : /\/\s*month/i;
        if (!r.enabled || hits.length || !monthly.test(r.txt) || r.btns.length !== 1) bad.push(`${lg} ${store ? 'ストアの価格あり' : 'ストアなし（目安）'} 年額の語 ${JSON.stringify(hits)} ボタン ${JSON.stringify(r.btns)} 有効 ${r.enabled} 月額 ${monthly.test(r.txt)}`);
        await ctx.close();
    }
    ok(!bad.length, "U4 'native' の iPhone アプリ版（キーあり）: 購入画面・設定に年額の価格も「年額」の語も出ず、月額のボタン1つだけ（ストアの価格あり・なし）: " + bad.join(' || '));
}

await b.close();
if (errs.length) { fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`ui49: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
