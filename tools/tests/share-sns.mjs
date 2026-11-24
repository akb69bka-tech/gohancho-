#!/usr/bin/env node
// 「何が食べたい？」・献立を、国でよく使うアプリに送る・貼る（オーナーの依頼 11/23）の確かめ
//  使い方: node tools/tests/share-sns.mjs [http://localhost:9331/]   （CCS=JP,KR でしぼる）
//  各国（アプリの対応国 21）で、送る画面に出るボタンを確かめる:
//    LINE（日本・タイ・台湾: line.me/R/share?text=）・WhatsApp（12か国: wa.me/?text=）。リンクの text を戻すと、送る文と1字もちがわない
//    共有のリンクがないアプリ（中国 WeChat・韓国 KakaoTalk・ベトナム Zalo・アメリカ／フィリピン／ポーランド Messenger）: ボタンは作らず、
//    そのアプリの名前と「ほかのアプリで送る」「コピーする」を知らせる一文。「ほかのアプリで送る」（navigator.share）と「コピーする」（クリップボード）に渡る文も1字もちがわない
//  送る文: 今日の献立・「何が食べたい？」（askSendText）・「食べたいもの」（wishSendText）。わざと崩れやすい文（改行・絵文字・右から左の字・タイ語・& # + % ? = のある URL）も
//  文の中の改行・絵文字・その国の字・URL（# のうしろ）がそのまま残る（リンクの長さも記録する）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const WANT = {JP: 'LINE', TH: 'LINE', TW: 'LINE', CN: 'WeChat', KR: 'KakaoTalk', VN: 'Zalo', US: 'Messenger', PH: 'Messenger', PL: 'Messenger'};
const CCS = (process.env.CCS || 'JP,US,GB,FR,DE,IT,ES,PL,TR,EG,IN,CN,TW,KR,TH,VN,ID,PH,MX,BR,PE').split(',');
const TRICKY = '1行目 😀🍙\n2行目 مرحبا ภาษาไทย 한국어 Tiếng Việt\n\nhttps://example.com/gohancho/#g=a+b%2Fc&x=1?y=2 🇯🇵';
const b = await chromium.launch(LAUNCH);
const rows = [], bad = [];
for (const cc of CCS){
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr|wa\.me/, r => r.abort());
    const lang = await (async () => { const pg = await ctx.newPage(); await pg.goto(URL_); await pg.waitForFunction(() => typeof COUNTRIES !== 'undefined'); const l = await pg.evaluate(cc => countryOf(cc).lang, cc); await pg.close(); return l; })();
    await ctx.addInitScript(st => { if (!sessionStorage.getItem('s2')){ sessionStorage.setItem('s2', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, {onboarded: true, firstUse: '2026-11-01', settings: {country: cc, uiLang: lang, dishCount: 3, servings: 2}});
    await ctx.addInitScript(() => { window.__shared = []; window.__copied = []; navigator.share = async d => { window.__shared.push(d); }; try{ Object.defineProperty(navigator, 'clipboard', {value: {writeText: async x => { window.__copied.push(x); }}, configurable: true}); }catch(e){} });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(cc => typeof GH !== 'undefined' && GH.booted && currentCountry() === cc && document.querySelector('#view .tray'), cc, {timeout: 40000});
    const r = await p.evaluate(async ({TRICKY}) => {
        const tick = (n = 150) => new Promise(r => setTimeout(r, n)), ids = menuIds().filter(Boolean).slice(0, 2), l = askLangOf();
        try{ await askPrepLang(ids, l); }catch(e){}
        const texts = {menu: menuShareText(), ask: askSendText(ids, 'Ana 😀', l), wish: wishSendText(ids.slice(0, 1), 0, 'Ana 😀'), tricky: TRICKY};
        const out = {};
        for (const [k, text] of Object.entries(texts)){
            if (!text){ out[k] = {none: true}; continue; }
            sheet = {kind: 'share', card: k === 'menu' ? 'menu' : 'wish', text, title: 'x'}; renderSheet(); await tick();
            const root = document.querySelector('#sheet-root'), a = root.querySelector('a.btn.msg'), hint = root.querySelector('.share-app-hint');
            let got = null, host = '';
            if (a){ const u = new URL(a.href); host = u.hostname + u.pathname; got = u.searchParams.get('text'); }
            window.__shared = []; window.__copied = [];
            const sys = root.querySelector('[data-act=share-system]'); if (sys){ sys.click(); await tick(); }
            const cp = root.querySelector('[data-act=share-copy]'); if (cp){ cp.click(); await tick(); }
            out[k] = {len: text.length, href: a ? a.href.length : 0, host, label: a ? a.textContent.trim() : '', linkSame: a ? got === text : null, hint: hint ? hint.textContent : '',
                shareSame: window.__shared.length ? window.__shared[0].text === text : null, copySame: window.__copied.length ? window.__copied[0] === text : null,
                nl: (text.match(/\n/g) || []).length, emoji: /\p{Extended_Pictographic}/u.test(text), url: /https?:\/\/\S+/.test(text) ? text.match(/https?:\/\/\S+/)[0].slice(0, 60) : ''};
            closeSheet(); await tick(50);
        }
        return {share: PACK ? PACK.share : 'line', out};
    }, {TRICKY});
    const want = WANT[cc] || 'WhatsApp';
    for (const [k, o] of Object.entries(r.out)){
        if (o.none){ if (k === 'menu' || k === 'tricky') bad.push(`${cc} ${k}: 送る文がない`); continue; }
        const link = want === 'LINE' || want === 'WhatsApp';
        if (link && !(o.linkSame && (want === 'LINE' ? /^line\.me\/R\/share$/.test(o.host) : /^wa\.me\/$/.test(o.host)) && o.label.includes(want))) bad.push(`${cc} ${k}: ${want} のボタン・リンクの文 ${JSON.stringify(o)}`);
        if (!link && (o.label || !o.hint.includes(want === 'WeChat' && /^zh/.test(lang) ? '微信' : want === 'KakaoTalk' && lang === 'ko' ? '카카오톡' : want))) bad.push(`${cc} ${k}: ${want} の知らせ ${JSON.stringify(o)}`);
        if (o.shareSame !== true || o.copySame !== true) bad.push(`${cc} ${k}: ほかのアプリ・コピーに渡る文がちがう ${JSON.stringify(o)}`);
        rows.push(`${cc}(${lang}) ${k}: ${o.label || '（ボタンなし: ' + o.hint.slice(0, 40) + '…）'} 文${o.len}字・リンク${o.href}字・改行${o.nl}・絵文字${o.emoji ? 'あり' : 'なし'}${o.url ? '・URL ' + o.url : ''}`);
    }
    await ctx.close();
}
if (process.env.LIST) rows.forEach(x => console.log('  ' + x));
ok(!bad.length, `国でよく使うアプリに送る（${CCS.length}か国 × 今日の献立・何が食べたい？・食べたいもの・崩れやすい文）: LINE・WhatsApp のリンクの文、ほかのアプリ・コピーに渡る文が1字もちがわない。リンクのないアプリは名前を出して知らせる: ` + bad.slice(0, 6).join(' || '));
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\nshare-sns: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
