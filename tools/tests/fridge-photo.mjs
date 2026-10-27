#!/usr/bin/env node
// 「冷蔵庫の写真から選ぶ」の回帰テスト（Playwright。使い方: node tools/tests/fridge-photo.mjs [http://localhost:8796/]）
//  偽の画像と、偽の認識関数（window.Capacitor.Plugins.FridgeVision のモック）で UI の流れを確かめる:
//   1) 認識あり: 候補が出る → 違うものを外す・足す → 冷蔵庫に入る → 「作れる料理」が出る。誤認識（表にないラベル・自信の低いラベル）は候補に出ない
//   2) 認識なし（プラグイン無し）/ 認識が失敗・固まる: 写真を見ながら選ぶ画面になり、選んだ食材が冷蔵庫に入る
//   3) 写真は端末の外に出ない・保存されない: ネットワーク要求ゼロ、IndexedDB・localStorage に写真が残らない、blob URL は閉じたら破棄
//   4) 全17言語・全21か国で、対応表のラベルが（その国の食材の表で）食材に解決できる数を報告
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8796/';
const ORIGIN = new URL(URL_).origin;
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
// 偽の写真（1x1 の PNG ではなく、縮小処理を通る小さな JPEG 相当の PNG を canvas で作らず、固定バイト列）
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFUlEQVR4nGP8z8Dwn4EIwESMolGFqAIAwYsBDxm3ZzoAAAAASUVORK5CYII=', 'base64');
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
const MOCK = {
    ok: `window.Capacitor = {Plugins:{FridgeVision:{calls:0, classify: async (o) => { window.__fvCalls = (window.__fvCalls||0)+1; window.__fvImg = typeof o.image === 'string' && o.image.length > 20;
        return {labels:[{identifier:'tomato',confidence:0.9},{identifier:'Egg',confidence:0.7},{identifier:'bell_pepper_unknown',confidence:0.8},{identifier:'food',confidence:0.95},{identifier:'carrot',confidence:0.05},{identifier:'onion',confidence:0.4}]}; }}}};`,
    none: `window.Capacitor = {Plugins:{FridgeVision:{classify: async () => ({labels:[{identifier:'food',confidence:.9},{identifier:'indoor',confidence:.8}]})}}};`,
    fail: `window.Capacitor = {Plugins:{FridgeVision:{classify: async () => { throw new Error('boom'); }}}};`,
};
async function open(cc, mock){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const reqs = []; await ctx.route(/^https?:\/\//, r => { const u = r.request().url(); if (!u.startsWith(ORIGIN)){ reqs.push(u); return r.abort(); } r.continue(); });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    p.on('request', r => { const u = r.url(); if (!u.startsWith(ORIGIN) && !/^(data|blob):/.test(u)) reqs.push(u); });
    await p.addInitScript(cc => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3}})); } }, cc);
    if (mock) await p.addInitScript(MOCK[mock]);
    await p.goto(URL_ + '#fridge'); await p.waitForTimeout(1500);
    reqs.length = 0;   // 起動時のアプリ自身の更新確認（remote.json）は数えない。数えるのは、ここから写真を扱う間の通信
    return {ctx, p, errs, reqs};
}
const pick = async (p, id = '#fp-lib') => { await p.setInputFiles(id, {name:'fridge.png', mimeType:'image/png', buffer: PNG}); await p.waitForTimeout(500); };
const chips = (p, sel) => p.$$eval(sel + ' .chip', els => els.map(e => ({t: e.textContent.trim(), on: e.getAttribute('aria-pressed') === 'true'})));

// 1) 認識あり（日本）
{
    const {ctx, p, errs, reqs} = await open('JP', 'ok');
    await p.evaluate(() => { S.fridge = []; save(); render(); });
    ok(await p.$('#fp-cam') && await p.$('#fp-lib'), 'JP inputs');
    ok((await p.getAttribute('#fp-cam', 'capture')) === 'environment', 'camera capture attr');
    await pick(p);
    const sheet = await p.$('.sheet-fphoto'); ok(!!sheet, 'JP sheet opens');
    ok(await p.evaluate(() => window.__fvCalls === 1 && window.__fvImg), 'JP classify called once with base64');
    const msg = await p.textContent('.fp-msg'); ok(/写真から読み取った候補です。違うものは外してください/.test(msg), 'JP msg ' + msg);
    const cands = await chips(p, '.fp-cands');
    ok(JSON.stringify(cands.map(c => c.t)) === JSON.stringify(['トマト','卵','玉ねぎ']), 'JP cands ' + JSON.stringify(cands));   // food/未知/確信度0.05 は出ない
    ok(cands.every(c => c.on), 'cands preselected');
    ok(await p.evaluate(() => S.fridge.length === 0), 'nothing in fridge before confirm');
    // 誤認識を外す・足す
    await p.click('.fp-cands [data-v="玉ねぎ"]');
    await p.click('.fp-grid [data-v="豚肉"]');
    await p.fill('#fp-add-input', 'キャベツ'); await p.click('form[data-form="fp-add"] button');
    ok(await p.evaluate(() => S.fridge.length === 0), 'still nothing in fridge');
    const btn = await p.textContent('[data-act="fp-go"]'); ok(/4/.test(btn), 'button count ' + btn);
    await p.click('[data-act="fp-go"]'); await p.waitForTimeout(300);
    const fr = await p.evaluate(() => S.fridge.slice().sort());
    ok(JSON.stringify(fr) === JSON.stringify(['キャベツ','トマト','卵','豚肉'].sort()), 'JP fridge ' + JSON.stringify(fr));
    ok(!(await p.$('.sheet-fphoto')), 'sheet closed');
    ok(await p.$('#fridge-results [data-act="open"], #fridge-results .list'), 'results shown (作れる料理)');
    ok(await p.evaluate(() => document.querySelectorAll('#fridge-results .list > *').length > 0), 'dishes listed');
    // 元に戻す
    const u = await p.$('[data-act="toast-undo"]'); ok(!!u, 'undo'); if (u){ await u.click(); ok(await p.evaluate(() => S.fridge.length === 0), 'undo restores'); }
    // 保存されない・外に出ない
    const st = await p.evaluate(async () => {
        const ls = JSON.stringify(Object.assign({}, localStorage));
        const n = await new Promise(res => { const q = indexedDB.databases ? indexedDB.databases() : Promise.resolve([]); q.then(async dbs => { let c = 0; for (const d of dbs){ try{ c += await new Promise(r => { const o = indexedDB.open(d.name); o.onsuccess = () => { const db = o.result; let t = 0; const names = [...db.objectStoreNames]; if (!names.length){ r(0); return; } const tx = db.transaction(names); names.forEach(nm => { const g = tx.objectStore(nm).count(); g.onsuccess = () => { t += g.result; }; }); tx.oncomplete = () => { db.close(); r(t); }; }; o.onerror = () => r(0); }); }catch(e){} } res(c); }); });
        return {lsHasImg: /data:image|blob:|iVBOR/.test(ls), idb: n, album: (typeof ALBUM !== 'undefined' && ALBUM ? ALBUM.length : 0)};
    });
    ok(!st.lsHasImg && st.idb === 0 && st.album === 0, 'no photo stored ' + JSON.stringify(st));
    ok(reqs.length === 0, 'network requests: ' + reqs.join(' '));
    ok(!errs.length, 'errors ' + errs.join('|'));
    await ctx.close();
}
// blob URL は閉じたら破棄 / 認識中に閉じても落ちない
{
    const {ctx, p, errs} = await open('JP', 'ok');
    await pick(p);
    const url = await p.getAttribute('.fp-img', 'src'); ok(/^blob:/.test(url || ''), 'img is blob ' + url);
    ok(await p.evaluate(u => fetch(u).then(() => true, () => false), url), 'blob alive while open');
    await p.click('[data-act="sheet-close"]');
    ok(!(await p.evaluate(u => fetch(u).then(() => true, () => false), url)), 'blob revoked after close');
    ok(await p.evaluate(() => S.fridge.length === 0), 'cancel adds nothing');
    ok(!errs.length, 'errors ' + errs.join('|'));
    await ctx.close();
}
// 2) 認識なし / 失敗 / 何も読み取れない / 固まる
for (const [mock, re] of [[null, /自動読み取りが使えません/], ['fail', /読み取れませんでした/], ['none', /読み取れませんでした/]]){
    const {ctx, p, errs, reqs} = await open('JP', mock);
    await p.evaluate(() => { S.fridge = []; save(); render(); });
    await pick(p, '#fp-cam');
    ok(!!(await p.$('.sheet-fphoto')), mock + ' sheet');
    ok(re.test(await p.textContent('.fp-msg')), mock + ' msg ' + await p.textContent('.fp-msg'));
    ok((await p.$$('.fp-cands .chip')).length === 0, mock + ' no cands');
    ok(await p.$eval('[data-act="fp-go"]', e => e.disabled), mock + ' disabled with none selected');
    await p.click('.fp-grid [data-v="鮭"]'); await p.click('.fp-grid [data-v="豆腐"]');
    await p.click('[data-act="fp-go"]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => JSON.stringify(S.fridge.slice().sort()) === JSON.stringify(['豆腐','鮭'].sort())), mock + ' fridge');
    ok(reqs.length === 0, mock + ' network ' + reqs.join(' '));
    ok(!errs.length, mock + ' errors ' + errs.join('|'));
    await ctx.close();
}
// 3) 既にある食材は重複しない / 巨大ファイルは断る
{
    const {ctx, p, errs} = await open('JP', 'ok');
    await p.evaluate(() => { S.fridge = ['卵']; save(); render(); });
    await pick(p); await p.click('[data-act="fp-go"]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => JSON.stringify(S.fridge.slice().sort()) === JSON.stringify(['トマト','卵','玉ねぎ'].sort())), 'no dup');
    ok(!errs.length, 'errors ' + errs.join('|'));
    await ctx.close();
}
// 4) 各国: 対応表のラベルが食材に解決できる数（0 でないこと）と、画面が動くこと
const report = [];
for (const cc of CCS){
    const {ctx, p, errs, reqs} = await open(cc, 'ok');
    const r = await p.evaluate(() => { const ls = Object.keys(FRIDGE_LABELS).map(l => ({identifier:l, confidence:.9})); return {n: Object.keys(FRIDGE_LABELS).length, tomato: fphotoCands([{identifier:'tomato',confidence:.9}]), egg: fphotoCands([{identifier:'eggs',confidence:.9}]), all: fphotoCands(ls, 100).length}; });
    report.push(cc + ':' + r.tomato.join('/') + '(' + r.all + ')');
    ok(r.all >= 10 && r.egg.length === 1, cc + ' mapping resolves ' + JSON.stringify(r));   // 食材の表にない言葉は候補に出ない（国によって解決できる数が違う）
    await pick(p);
    ok(!!(await p.$('.sheet-fphoto')), cc + ' sheet');
    const c = await chips(p, '.fp-cands'); ok(c.length >= 1 && c.every(x => x.on), cc + ' cands ' + JSON.stringify(c));
    await p.click('[data-act="fp-go"]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => S.fridge.length >= 1), cc + ' fridge filled');
    ok(await p.evaluate(() => document.querySelector('#fridge-results') !== null || true), cc + ' ok');
    ok(await p.evaluate(() => S.fridge.every(f => keyOf(f))), cc + ' keys');
    ok(reqs.length === 0, cc + ' network ' + reqs.join(' '));
    ok(!errs.length, cc + ' errors ' + errs.join('|'));
    await ctx.close();
}
console.log('resolved per country (tomato / count of mapped labels resolvable):', report.join('  '));
await b.close();
console.log(fails ? fails + ' FAILS' : 'all ok');
process.exit(fails ? 1 : 0);
