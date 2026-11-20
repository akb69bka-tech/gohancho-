#!/usr/bin/env node
// ui49（R146）: 全員無料（PLAN.billingMode 'off'）のあいだは「プランと購入」の入口を見せない。'native'・'all' にすれば今までどおり出る
//  使い方: node tools/tests/ui49.mjs [http://localhost:9331/]
//  U1 'off'（既定）: 設定の全部のタブ・下のタブ全部（今日・1週間プラン・作る・冷蔵庫・道具・ひとひねり・世界・記録）に「プランと購入」「プラスの内容」「ご飯帖プラス」の文字と、購入画面を開く入口（data-act="paywall…"）・「プラス」の札が 0 か所。
//     設定のタブの名前は「その他」（プランの字を出さない）。18言語（訳した文字で数える）
//  U2 'native'・'all'（オーナーが課金を始めたとき）: 「プランと購入」のまとまりと「プラスの内容」／「…を見る」の入口が、プランのタブに今までどおり出る。タブの名前は「プラン・その他」
//  U3 課金のしくみは変えていない: 既定は 'off'・価格2つ・購入の処理（openPaywall・購入の画面）はそのまま。'off' では課金は有効にならず、全部の機能が使える
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

// U3 静的: 既定は 'off'
const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
ok(/billingMode:\s*'off'/.test(src) && /function openPaywall\(/.test(src) && /gohancho_plus_monthly/.test(src) && /gohancho_plus_yearly/.test(src), "U3a 既定は billingMode 'off'。価格・購入画面のしくみは残っている");

const b = await chromium.launch(LAUNCH);
const open = async lg => {
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
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
        const st = await p.evaluate(() => ({mode: PLAN.billingMode, enabled: PLAN.billingEnabled, pro: hasPro(), locked: isLocked()}));
        const txt = r.txt.join('\n');
        // 「プラス」1語は他の言葉の中にも出る（例: 日本語の「プラスチック」はない）ので、札（.plus-mark）で数える。ほかの語は文字で数える
        const hit = w.slice(0, -1).filter(x => x && txt.includes(x));
        if (st.mode !== 'off' || st.enabled || !st.pro || st.locked) bad.push(lg + ' 課金が有効 ' + JSON.stringify(st));
        if (hit.length || r.acts.length || r.marks) bad.push(`${lg} 文字 ${JSON.stringify(hit)} 入口 ${JSON.stringify(r.acts)} 札 ${r.marks}`);
        if (lg === 'ja' && r.tabs[r.tabs.length - 1] !== 'その他') bad.push('ja タブの名前 ' + r.tabs.join(','));
        await ctx.close();
    }
    ok(!bad.length, `U1 'off'（${LANGS.length}言語）: 「プランと購入」の入口・文字・札が 0 か所: ` + bad.slice(0, 6).join(' || '));
}

// ---- U2 'native'・'all' ----
{
    const bad = [];
    for (const mode of ['native', 'all']){
        const {p, ctx} = await open('ja');
        const r = await p.evaluate(async mode => {
            PLAN.billingMode = mode; setTab('settings'); await new Promise(r => setTimeout(r, 50)); setTabShow('plan'); await new Promise(r => setTimeout(r, 50));
            const v = document.querySelector('#view'), sec = v.querySelector('#set-plan');
            const o = {sec: !!sec && !sec.closest('[hidden]'), title: sec ? sec.querySelector('.set-sec-h').textContent.trim() : '', pay: v.querySelectorAll('#set-plan [data-act="paywall"]').length,
                tab: [...v.querySelectorAll('.set-tab')].map(e => e.textContent.trim()).pop()};
            if (o.pay) { v.querySelector('#set-plan [data-act="paywall"]').click(); await new Promise(r => setTimeout(r, 80)); o.sheet = !!document.querySelector('#sheet-root .sheet-paywall, #sheet-root .pw-head'); closeSheet(); }
            PLAN.billingMode = 'off'; return o;
        }, mode);
        if (!(r.sec && r.title === 'プランと購入' && r.pay === 1 && r.tab === 'プラン・その他' && r.sheet)) bad.push(mode + ' ' + JSON.stringify(r));
        await ctx.close();
    }
    ok(!bad.length, "U2 'native'・'all' では「プランと購入」と入口が今までどおり出て、押すと購入画面（の紹介）が開く: " + bad.join(' || '));
}

await b.close();
if (errs.length) { fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`ui49: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
