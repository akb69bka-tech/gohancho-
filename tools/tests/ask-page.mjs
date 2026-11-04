#!/usr/bin/env node
// 家族に「何が食べたい？」と聞く（ask.html）の回帰テスト（Playwright。使い方: node tools/tests/ask-page.mjs [http://localhost:8794/]）
//  K1 作る人の端末: 家族リクエスト → 「家族に『何が食べたい？』と聞く」→ 今日の献立の候補から／さがして選ぶ → 送る文（LINE・コピー・ほかのアプリ）。リンクは ask.html#g=…（k:'k'）
//  K2 家族の端末（アプリなし）: ask.html を 390px・195px（ja・en・ar）で開く → ボタンが見えて、はみ出さない。ほかの場所へ通信しない
//  K3 料理を押す → 返事の文とリンク（いつもの「食べたい」のリンク k:'w'）。LINE・メール・SMS・コピー。3つまで。「なんでもいい」はリンクなしの文
//  K4 返事のリンクはアプリの wishParse で読める → アプリで開くと受けとる画面 → 受けとると家族リクエストに入る
//  K5 アプリで ask のリンクを開いたとき・貼りつけたときは、案内だけ出す（落ちない）
//  K6 ask.html: こわれた・長すぎる・形のちがう・よその種類のリンク → 読めないと出して、ボタンは出さない。名前のタグ・よその絵の場所は使わない
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ORIGIN = new URL(URL_).origin;
const SHOTS = process.env.SHOTS || '';
if (SHOTS) fs.mkdirSync(SHOTS, {recursive: true});
const shot = async (p, name) => { if (SHOTS) await p.screenshot({path: `${SHOTS}/${name}.png`, fullPage: true}); };
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const FAM2 = [{id: 'f1', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}];
const DOC = 'https://akb69bka-tech.github.io/gohancho-/';
const b64u = s => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hashOf = u => u.slice(u.indexOf('#'));
const openApp = async (state = {}, hash = '') => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
    const reqs = [];
    ctx.on('request', r => reqs.push(r.url()));
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(SEED));
    await ctx.addInitScript(st => { if (!localStorage.getItem('gohancho.v1')){ localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-01-01'}, st, {settings: Object.assign({country: 'JP', dishCount: 3, servings: 2}, st.settings || {})}))); } }, state);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
    await p.goto(URL_ + hash); await ready(p);
    return {p, ctx, reqs};
};
// 家族の端末: アプリの保存はなし（ask.html だけ）。よその場所への通信を全部控える
const openAsk = async (hash, width = 390, locale = 'ja-JP') => {
    const ctx = await b.newContext({ viewport: { width, height: 800 }, locale });
    const reqs = [];
    ctx.on('request', r => reqs.push(r.url()));
    await ctx.route(u => new URL(u).origin !== ORIGIN, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('ask: ' + e.message));
    await p.goto(URL_ + 'ask.html' + hash); await p.waitForLoadState('load'); await p.waitForTimeout(150);
    const foreign = () => reqs.filter(u => !u.startsWith(ORIGIN) && !u.startsWith('data:'));
    return {p, ctx, reqs, foreign};
};
const sheetKind = p => p.evaluate(() => sheet && sheet.kind);
const sheetText = p => p.evaluate(() => (document.querySelector('#sheet-root') || {}).textContent || '');

// ---- K1 作る人の端末で聞くリンクをつくる ----
let askJa = '', askEn = '', askAr = '', askIds = [];
let wife;
{
    wife = await openApp({family: FAM2, settings: {sendName: 'ママ'}});
    const p = wife.p;
    await p.evaluate(() => { setTab('today'); render(); });
    ok(await p.evaluate(() => !!document.querySelector('.req-btn[data-act="wish-list"]')), 'K1a 今日の画面に家族リクエストの入口');
    await p.click('.req-btn[data-act="wish-list"]');
    ok(await p.evaluate(() => !!document.querySelector('#sheet-root [data-act="ask-open"]')), 'K1b 家族リクエストに「家族に『何が食べたい？』と聞く」');
    await p.click('#sheet-root [data-act="ask-open"]');
    ok(await sheetKind(p) === 'ask-make', 'K1c 候補を選ぶ画面が開く');
    await p.click('[data-act="ask-today"]');
    const sel0 = await p.evaluate(() => sheet.sel.slice());
    ok(sel0.length >= 3 && sel0.length <= 6, 'K1d 今日の献立の候補から（3〜6品）: ' + sel0.join());
    if (!sel0.includes('karaage')){
        await p.fill('#wish-q', '唐揚げ'); await p.waitForTimeout(400);
        await p.click('#wish-grid [data-id="karaage"]');
    }
    askIds = await p.evaluate(() => sheet.sel.slice());
    ok(askIds.includes('karaage'), 'K1e さがして足せる: ' + askIds.join());
    ok(await p.evaluate(() => { const s = sheet.sel.slice(); RECIPES.filter(r => r.main).slice(0, 12).forEach(r => { if (!sheet.sel.includes(r.id)) document.querySelector('#wish-grid') && (sheet.q = r.name, renderSheet(), document.querySelector(`#wish-grid [data-id="${r.id}"]`) && document.querySelector(`#wish-grid [data-id="${r.id}"]`).click()); }); const n = sheet.sel.length; sheet.sel = s; sheet.q = ''; renderSheet(); return n; }) <= 8, 'K1f 8品まで');
    await shot(p, 'app-ask-make-390');
    await p.click('[data-act="ask-make"]');
    ok(await sheetKind(p) === 'share', 'K1g 送る文の画面（LINE・コピー・ほかのアプリ）');
    const text = await p.evaluate(() => document.querySelector('#share-text').value);
    askJa = (text.match(/https:\/\/\S+/) || [''])[0];
    ok(text.includes('何が食べたい？押して返してね') && text.includes('ママ'), 'K1h 文: ' + text.split('\n')[0]);
    ok(askJa.startsWith(DOC + 'ask.html#g='), 'K1i リンクは ask.html#g=…: ' + askJa.slice(0, 70));
    ok(askJa.length < 3200, 'K1j リンクの長さ: ' + askJa.length + '字');
    ok(await p.evaluate(() => !!document.querySelector('#sheet-root a.btn.msg[href^="https://line.me/R/share?text="]')), 'K1k LINE で送るボタン');
    await shot(p, 'app-ask-share-390');
    const o = JSON.parse(Buffer.from(askJa.split('#g=')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    ok(o.v === 1 && o.k === 'k' && o.n === 'ママ' && o.l === 'ja' && Array.isArray(o.d) && o.d.length === askIds.length && o.d.every(a => typeof a[0] === 'string' && typeof a[1] === 'string'), 'K1l 中身 {k:"k", n, d:[[番号, 名前, 絵]], l}: ' + JSON.stringify(o).slice(0, 120));
    ok(o.d.some(a => a[2] && /^img\/dish\//.test(a[2])), 'K1m 料理の絵の場所（img/…）が入る');
    // 設定 › 家族にも入口
    await p.evaluate(() => { closeSheet(); setTab('settings'); });
    ok(await p.evaluate(() => !!document.querySelector('#set-family [data-act="ask-open"]')), 'K1n 設定 › 家族 にも入口');
    // ほかの言葉のリンク（アプリの画面の言葉で送る）
    askEn = await p.evaluate(async ids => { await setLang('en'); return askLink(ids, 'Mom'); }, askIds);
    askAr = await p.evaluate(async ids => { await setLang('ar'); return askLink(ids, 'ماما'); }, askIds);
    await p.evaluate(async () => { await setLang('ja'); });
    ok(/ask\.html#g=/.test(askEn) && /ask\.html#g=/.test(askAr), 'K1o en・ar のリンク');
}

// ---- K2・K3 家族の端末で ask.html を開く ----
const HEAD = {ja: '何が食べたい？', en: 'What do you want to eat?', ar: 'ماذا تريد أن تأكل؟'};
let reply = '';
for (const [lang, link] of [['ja', askJa], ['en', askEn], ['ar', askAr]]){
    for (const w of [390, 195]){
        const {p, ctx, foreign} = await openAsk(hashOf(link), w, lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'ar');
        const tag = `${lang}/${w}px`;
        const info = await p.evaluate(() => {
            const vw = document.documentElement.clientWidth;
            const bs = [...document.querySelectorAll('#grid .dish, #any, .chip, #me')];
            return {h1: (document.querySelector('h1') || {}).textContent, dir: document.documentElement.dir, lang: document.documentElement.lang,
                n: document.querySelectorAll('#grid .dish').length, sw: document.documentElement.scrollWidth, vw,
                out: bs.filter(x => { const r = x.getBoundingClientRect(); return r.left < -0.5 || r.right > vw + 0.5 || r.width < 40 || r.height < 44; }).map(x => x.textContent.slice(0, 12)),
                nmOver: [...document.querySelectorAll('#grid .dish .nm')].filter(x => x.scrollWidth > x.clientWidth + 1).length,
                imgs: [...document.querySelectorAll('#grid img')].map(i => i.getAttribute('src')), loaded: [...document.querySelectorAll('#grid img')].filter(i => i.complete && i.naturalWidth > 0).length,
                bad: !!document.querySelector('#bad'), from: (document.querySelector('.from') || {}).textContent || ''};
        });
        ok(info.h1 === HEAD[lang], `K2a ${tag} 見出し: ${info.h1}`);
        ok(info.lang === lang && info.dir === (lang === 'ar' ? 'rtl' : 'ltr'), `K2b ${tag} 言葉と向き: ${info.lang} ${info.dir}`);
        ok(!info.bad && info.n === askIds.length, `K2c ${tag} 料理のボタン ${info.n}/${askIds.length}`);
        ok(info.sw <= info.vw && !info.out.length && !info.nmOver, `K2d ${tag} はみ出さない・押しやすい大きさ: sw=${info.sw} vw=${info.vw} ${info.out.join('|')} nm=${info.nmOver}`);
        ok(info.imgs.length > 0 && info.imgs.every(s => /^img\/[a-z0-9_\/-]+\.(webp|jpg|png|svg)$/.test(s)) && info.loaded > 0, `K2e ${tag} 料理の絵（同じ場所の img/ だけ）: ${info.loaded}/${info.imgs.length}`);
        ok(info.from.includes(lang === 'ja' ? 'ママさんから' : lang === 'en' ? 'From Mom' : 'ماما'), `K2f ${tag} 送った人: ${info.from}`);
        await shot(p, `ask-${lang}-${w}`);
        // 料理を押す
        await p.click('#grid .dish[data-id="karaage"]');
        const r1 = await p.evaluate(() => ({hidden: document.querySelector('#reply').hidden, text: document.querySelector('#reply-text').value, pressed: document.querySelector('#grid .dish[data-id="karaage"]').getAttribute('aria-pressed'),
            line: document.querySelector('#act-line').href, mail: document.querySelector('#act-mail').href, sms: document.querySelector('#act-sms').href, copy: !!document.querySelector('#act-copy'),
            sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth}));
        ok(!r1.hidden && r1.pressed === 'true' && /#g=/.test(r1.text), `K3a ${tag} 押すと返事の文とリンク`);
        ok(r1.line.startsWith('https://line.me/R/share?text=') && r1.mail.startsWith('mailto:?subject=') && r1.sms.startsWith('sms:?&body=') && r1.copy, `K3b ${tag} LINE・メール・SMS・コピー`);
        ok(r1.sw <= r1.vw, `K3c ${tag} 返事の欄もはみ出さない: ${r1.sw}/${r1.vw}`);
        if (lang === 'ja' && w === 390){
            await p.click('.chip[data-v="1"]');
            await p.fill('#me', 'ゆうき\u202e<b>');
            const t2 = await p.evaluate(() => document.querySelector('#reply-text').value);
            reply = (t2.match(/https:\/\/\S+/) || [''])[0];
            ok(t2.startsWith('ゆうきb: ') && t2.includes('週末でいい') && reply.startsWith(DOC + '#g='), 'K3d 名前（見えない文字・< > は外す）とひとこと: ' + t2.split('\n')[0]);
            // コピー
            await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], {origin: ORIGIN}).catch(() => {});
            await p.click('#act-copy'); await p.waitForTimeout(150);
            ok((await p.evaluate(() => document.querySelector('#st').textContent)) === 'コピーしました', 'K3e コピーできる');
            await shot(p, 'ask-ja-390-reply');
            // 3つまで
            const ids = await p.evaluate(() => [...document.querySelectorAll('#grid .dish')].map(x => x.dataset.id));
            for (const id of ids) if (await p.getAttribute(`#grid .dish[data-id="${id}"]`, 'aria-pressed') !== 'true') await p.click(`#grid .dish[data-id="${id}"]`);
            const n = await p.evaluate(() => document.querySelectorAll('#grid .dish[aria-pressed="true"]').length);
            ok(n === Math.min(3, ids.length), 'K3f 3つまでしか選べない: ' + n);
            // なんでもいい（リンクなしの文）
            await p.click('#any');
            const t3 = await p.evaluate(() => ({t: document.querySelector('#reply-text').value, n: document.querySelectorAll('#grid .dish[aria-pressed="true"]').length}));
            ok(t3.n === 0 && t3.t.includes('なんでもいいよ') && !/#g=/.test(t3.t), 'K3g 「なんでもいい」: ' + t3.t);
            await p.click('#any');
            ok(await p.evaluate(() => document.querySelector('#reply').hidden), 'K3h 何も選ばないと返事の欄は出ない');
        }
        ok(!foreign().length, `K2g ${tag} よその場所へ通信しない: ${foreign().join(' ')}`);
        await ctx.close();
    }
}

// ---- K4 返事をアプリで読む → 受けとる ----
{
    const pr = await wife.p.evaluate(u => { const x = wishParse(u); return x; }, reply);
    ok(pr.k === 'w' && pr.ids.join() === 'karaage' && pr.n === 'ゆうきb' && pr.m === 1 && /^\d{4}-\d{2}-\d{2}$/.test(pr.t), 'K4a 返事はいつもの「食べたい」のリンク: ' + JSON.stringify(pr));
    const n0 = await wife.p.evaluate(() => (S.wants || []).length);
    await wife.p.evaluate(h => { setTab('today'); location.hash = h; }, hashOf(reply));
    await wife.p.waitForFunction(() => sheet && sheet.kind === 'wish-in', null, {timeout: 5000}).catch(() => {});
    ok(await sheetKind(wife.p) === 'wish-in', 'K4b 返事のリンクを開くと受けとる画面');
    const st = await sheetText(wife.p);
    ok(st.includes('ゆうきb') && st.includes('鶏の唐揚げ') && st.includes('週末でいい'), 'K4c 誰から・何が・ひとこと');
    await shot(wife.p, 'app-wish-in-390');
    await wife.p.click('[data-act="wish-accept"]');
    const ws = await wife.p.evaluate(() => S.wants.map(w => w.id + ':' + w.n + ':' + w.m));
    ok(ws.length === n0 + 1 && ws[0] === 'karaage:ゆうきb:1', 'K4d 受けとると家族リクエストに入る: ' + ws.join());
    await wife.p.evaluate(() => { setTab('today'); render(); });
    ok(await wife.p.evaluate(() => (document.querySelector('.req-btn') || {}).textContent.includes('ゆうきb')), 'K4e 家族リクエストの入口に名前と料理');
    await wife.ctx.close();
}
// 新しい端末（アプリを開いたばかりの人）でも同じ
{
    const {p, ctx} = await openApp({family: FAM2}, hashOf(reply));
    await p.waitForFunction(() => sheet && sheet.kind === 'wish-in', null, {timeout: 5000}).catch(() => {});
    ok(await sheetKind(p) === 'wish-in', 'K4f 返事のリンクから開いても受けとる画面');
    await p.click('[data-act="wish-accept"]');
    ok(await p.evaluate(() => S.wants.some(w => w.id === 'karaage' && w.n === 'ゆうきb')), 'K4g 受けとれる');
    // K5 アプリで ask のリンクを開いた・貼りつけた
    ok(await p.evaluate(u => wishParse(u).err, askJa) === 'ask', 'K5a アプリの wishParse は ask のリンクを「ask」として断る');
    await p.evaluate(h => { if (sheet) closeSheet(); location.hash = h; }, hashOf(askJa).replace('#', '#'));
    await p.waitForTimeout(300);
    ok(await sheetKind(p) === 'wish-bad' && (await sheetText(p)).includes('アプリがなくても答えられます'), 'K5b アプリで開くと案内だけ出す');
    await p.evaluate(() => closeSheet());
    ok(await p.evaluate(t => { const x = wishParse('届いた文\n' + t); return x.err; }, askJa) === 'ask', 'K5c 貼りつけても案内');
    ok(await p.evaluate(() => wishParse('#g=' + b64uEnc(JSON.stringify({v: 1, k: 'k', d: 'x'}))).err) === 'ask', 'K5d 形のちがう ask でも落ちない');
    await ctx.close();
}

// ---- K6 こわれた・長すぎる・よその種類（ask.html） ----
{
    const enc = o => '#g=' + b64u(JSON.stringify(o));
    const bads = [
        ['こわれた', '#g=abc!!'],
        ['途中で切れた', hashOf(askJa).slice(0, 40)],
        ['空', '#g='],
        ['なし', ''],
        ['JSON でない', '#g=' + b64u('hello')],
        ['よその種類 w', enc({v: 1, k: 'w', d: ['karaage']})],
        ['よその種類 q', enc({v: 1, k: 'q', w: '20261102', d: ['karaage']})],
        ['版がちがう', enc({v: 2, k: 'k', d: [['karaage', '唐揚げ']]})],
        ['料理が多すぎる', enc({v: 1, k: 'k', d: Array.from({length: 9}, (_, i) => ['d' + i, '料理' + i])})],
        ['長すぎる', enc({v: 1, k: 'k', d: [['karaage', 'あ'.repeat(30)]], x: 'y'.repeat(4000)})],
        ['料理が空', enc({v: 1, k: 'k', d: []})],
        ['番号がだめ', enc({v: 1, k: 'k', d: [['../x', 'a'], ['a b', 'b'], [5, 'c'], ['ok', '']]})],
        ['配列', '#g=' + b64u('[1,2]')],
    ];
    for (const [nm, h] of bads){
        const {p, ctx, foreign} = await openAsk(h, 390);
        const r = await p.evaluate(() => ({bad: !!document.querySelector('#bad'), n: document.querySelectorAll('.dish').length, reply: !!document.querySelector('#reply')}));
        ok(r.bad && !r.n && !r.reply, `K6 ${nm} → 読めない・ボタンなし: ${JSON.stringify(r)}`);
        if (nm === 'よその種類 w') await shot(p, 'ask-bad-390');
        ok(!foreign().length, `K6 ${nm} よその場所へ通信しない`);
        await ctx.close();
    }
    // 名前のタグ・よその絵の場所・見えない文字は使わない（文字として出す）
    const evil = enc({v: 1, k: 'k', n: '<img src=x onerror=alert(1)>\u202eママ', l: 'xx', t: '20261399', d: [
        ['karaage', '<img src=x onerror=alert(1)>唐揚げ', 'https://evil.example/x.png'],
        ['sabamiso', 'さば\u200bの味噌煮', '../secret.png'],
        ['hamburg', 'ハンバーグ', 'img/dish/t/hamburg.webp'],
        ['karaage', '重複', 'img/dish/t/karaage.webp'],
        ['nikujaga', '肉じゃが', 'img/dish/t/NIKU.webp?x=1']]});
    const {p, ctx, foreign} = await openAsk(evil, 390);
    let alerted = false; p.on('dialog', d => { alerted = true; d.dismiss(); });
    const r = await p.evaluate(() => ({n: document.querySelectorAll('#grid .dish').length, imgs: [...document.querySelectorAll('img')].map(i => i.getAttribute('src')),
        names: [...document.querySelectorAll('#grid .nm')].map(x => x.textContent), from: document.querySelector('.from').textContent, lang: document.documentElement.lang}));
    await p.waitForTimeout(200);
    ok(r.n === 4 && r.names[0] === 'img src=x onerror=alert(1)唐揚げ' && r.names[1] === 'さばの味噌煮', 'K6a タグ・見えない文字は文字として外す・重複は1つ: ' + r.names.join('|'));
    ok(r.imgs.length === 1 && r.imgs[0] === 'img/dish/t/hamburg.webp', 'K6b 絵は同じ場所の img/ だけ: ' + r.imgs.join(' '));
    ok(!alerted && r.from.includes('img src=x onerror=alert(1)ママ'.slice(0, 10)) && !r.from.includes('<'), 'K6c 送った人の名前も文字だけ（10文字まで）: ' + r.from);
    ok(r.lang === 'ja', 'K6d 知らない言葉は端末の言葉（ここでは ja）: ' + r.lang);
    ok(!foreign().length, 'K6e よその絵を読みに行かない: ' + foreign().join(' '));
    await ctx.close();
}

await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
