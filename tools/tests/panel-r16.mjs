#!/usr/bin/env node
// 利用者モニター第16回の直し（安全の周辺）。Playwright。使い方: node tools/tests/panel-r16.mjs [http://localhost:8999/]
//  R45: 「今日食べる人」から外した家族のアレルゲンを使う料理が今日の献立に出るとき（約束どおり料理は出す・選び方は変えない）、
//       お膳の札（赤い ⚠ とは別の柿色の枠「⚠ ○○のアレルゲン（卵）入り」）・お膳の下の文（料理の名前と「○○は食べられません」）・料理の詳細・作り方（段取り・買い物メモ）・まわした献立のお知らせに同じ印を出す。
//       「食べられるお膳です」などの安心の文とは並ばない。戻しても決めた献立は勝手に変わらない。17言語の訳
//  R43: きのう明日へまわした献立のお知らせの ⚠（v84）は、家族のアレルギーでも付く（全員共通のアレルゲンは panel-r15 の R15-5）
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
const open = async (settings, tag) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r16', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3}, st)})); } }, settings);
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};
// 長男（アレルギー fk）を足す。out: 今日食べる人から外す
const famSet = (p, fk, out) => p.evaluate(([fk, out]) => { S.family = [{id: 'r16', name: '長男', role: 'child', allergy: ['@' + fk], avoid: ['@' + fk], mild: false}]; if (out) setEaters(['__me']); else setEaters(null); save(); reconcileMenu(); render(); return eatersOut().map(m => m.name); }, [fk, out]);
// お膳に長男のアレルゲンの料理が出るまで「まるごと入れ替え」（出る形が約束。外した家族のアレルギーは今日の献立では見ない）。当たるかどうかは、アプリの判定そのもの（家族みんなで見る allergyConflict。だしの置き換えなどもアプリと同じ）
const hitNames = () => weekAlg(() => session.menu.items.map(x => x.r).filter(Boolean).filter(r => allergyConflict(r)).map(r => r.name));
const shuffleUntilHit = async (p, fk) => { let hit = []; for (let i = 0; i < 25; i++){ hit = await p.evaluate(hitNames); if (hit.length) break; await p.click('#view [data-act=new-menu]'); await p.waitForTimeout(150); } return hit; };
const trayTags = p => p.evaluate(() => [...document.querySelectorAll('#view .tray .spot')].map(e => ({name: (e.querySelector('.nm') || {}).textContent || '', out: [...e.querySelectorAll('.alg-tag.out')].map(x => x.textContent), red: [...e.querySelectorAll('.alg-tag:not(.out):not(.may)')].map(x => x.textContent), aria: [...e.querySelectorAll('.alg-tag.out')].map(x => x.getAttribute('aria-label'))})));

// R16-1 R45: 外した家族のアレルゲンの料理に、お膳の札・お膳の下の文・料理の詳細・作り方の画面で同じ印
for (const fk of ['egg', 'fish', 'shellfish']){
    const {p, ctx} = await open({}, 'out-' + fk);
    const out = await famSet(p, fk, true);
    ok(out.includes('長男'), `R16-1 ${fk} 長男は今日の献立では外れている: ` + JSON.stringify(out));
    const hit = await shuffleUntilHit(p, fk);
    if (!hit.length){ ok(false, `R16-1 ${fk} 25回の入れ替えで長男のアレルゲンの料理が出る（出なければこの回は確かめられない）`); await ctx.close(); continue; }
    const ids0 = await p.evaluate(() => session.menu.items.map(x => x.r ? x.r.id : '-'));
    const tags = await trayTags(p);
    const hitSpots = tags.filter(x => hit.some(n => x.name.includes(n.slice(0, 6)))), other = tags.filter(x => !hitSpots.includes(x));
    ok(hitSpots.length === hit.length && hitSpots.every(x => x.out.length === 1 && /^⚠ 長男のアレルゲン/.test(x.out[0]) && !x.red.length), `R16-1 ${fk} 当たる料理のお膳の札は「⚠ 長男のアレルゲン…入り」（赤い ⚠ ではない）: ` + JSON.stringify({hit, hitSpots}));
    ok(other.every(x => !x.out.length), `R16-1 ${fk} 当たらない料理には出ない: ` + JSON.stringify(other.map(x => x.name + ':' + x.out.join())));
    ok(hitSpots.every(x => /食べられません/.test(x.aria[0] || '') && /除いて考えています/.test(x.aria[0] || '')), `R16-1 ${fk} 札の読み上げは「食べられません」と言い切る: ` + JSON.stringify(hitSpots.map(x => x.aria)));
    const line = await p.evaluate(() => (document.querySelector('#view .eaters-line') || {}).textContent || '');
    ok(/長男を除いて考えています/.test(line) && hit.every(n => line.includes(n)) && /長男は食べられません/.test(line) && !/食べられるお膳です/.test(line) && !/入れていません/.test(line), `R16-1 ${fk} お膳の下の文に当たる料理の名前と「長男は食べられません」（安心の文はない）: ` + JSON.stringify(line));
    const ids1 = await p.evaluate(() => { render(); return session.menu.items.map(x => x.r ? x.r.id : '-'); });
    ok(ids1.join() === ids0.join(), `R16-1 ${fk} 印を出しても献立は変わらない（選び方はそのまま）`);
    // 料理の詳細
    const id = await p.evaluate(n => session.menu.items.map(x => x.r).filter(Boolean).find(r => r.name === n).id, hit[0]);
    await p.evaluate(id => openModal(id), id); await p.waitForTimeout(300);
    const box = await p.evaluate(() => ({out: (document.querySelector('#allergen-box .out-alg') || {}).textContent || '', warn: (document.querySelector('#allergen-box .warn') || {}).textContent || ''}));
    ok(/^⚠ 長男のアレルゲン/.test(box.out) && /食べられません/.test(box.out) && !box.warn, `R16-1 ${fk} 料理の詳細にも同じ文（赤い「選んでいるアレルゲン」の文は出ない）: ` + JSON.stringify(box));
    await p.evaluate(() => closeModal());
    // 決める → 作り方（買い物メモ・段取り）
    await p.click('#view [data-act=decide]'); await p.waitForTimeout(400);
    await p.evaluate(() => setTab('cook')); await p.waitForTimeout(300);
    const cook = await p.evaluate(() => ({notes: [...document.querySelectorAll('#view .out-alg-note')].map(e => e.textContent), ids: S.cook.ids.slice()}));
    ok(cook.notes.length >= 2 && cook.notes.every(s => hit.every(n => s.includes(n)) && /長男は食べられません/.test(s)), `R16-1 ${fk} 作り方（買い物メモ・段取り）にも当たる料理の名前の文: ` + JSON.stringify(cook.notes));
    // 作りはじめる（1手順の画面）にも札
    await p.evaluate(() => { session.cookView = 'step'; session.cookIdx = S.cook.ids.findIndex(id => weekAlg(() => allergyConflict(byId(id)))); render(); }); await p.waitForTimeout(200);
    const step = await p.evaluate(() => [...document.querySelectorAll('#view .cook-now .alg-tag.out')].map(e => e.textContent));
    ok(step.length === 1 && /長男のアレルゲン/.test(step[0]), `R16-1 ${fk} 1手順の画面にも札: ` + JSON.stringify(step));
    // 長男を戻す: 決めた献立は勝手に変わらない。赤い ⚠（いま食べる人に当たる）に替わり、柿色の札は消える
    const back = await p.evaluate(() => { setEaters(null); save(); reconcileMenu(); setTab('today'); render(); return {ids: S.cook.ids.slice(), out: document.querySelectorAll('#view .alg-tag.out, #view .out-alg, #view .out-alg-note').length, warn: (document.querySelector('#view .cook-warn') || {}).textContent || ''}; });
    ok(back.ids.join() === cook.ids.join(), `R16-1 ${fk} 長男を戻しても決めた献立は変わらない`);
    ok(back.out === 0 && hit.every(n => back.warn.includes(n)), `R16-1 ${fk} 戻すと柿色の印は消え、赤い確かめの文に替わる: ` + JSON.stringify(back));
    await ctx.close();
}

// R16-2 長男が今日食べる人にいるときは柿色の印は出ず、当たる料理は今までどおり赤い ⚠（献立には選ばれない・勝手にかえられるので、札の関数で確かめる）
{
    const {p, ctx} = await open({}, 'in');
    await famSet(p, 'egg', false);
    const r = await p.evaluate(() => { const r = RECIPES.find(r => r.main && allergyConflict(r) && isAvoidedCore(r));   // 長男（卵）に当たる料理（卵を抜く置き換えでは直らないもの）
        const box = document.createElement('div'); box.innerHTML = algTagHtml(r);
        return {name: r.name, outHits: outAlgHits(r).length, tags: [...box.querySelectorAll('.alg-tag')].map(e => e.className + '|' + e.textContent), outAll: document.querySelectorAll('#view .alg-tag.out, #view .out-alg, #view .out-alg-note').length, line: (document.querySelector('#view .eaters-line') || {}).textContent || ''}; });
    ok(r.outHits === 0 && r.tags.length === 1 && r.tags[0] === 'alg-tag|⚠ 卵' && r.outAll === 0 && !/食べられません/.test(r.line), 'R16-2 長男が食べる日は、赤い ⚠ だけ（柿色の印はない）: ' + JSON.stringify(r));
    await ctx.close();
}

// R16-3 R43: まわした献立のお知らせの ⚠ は、家族のアレルギー（長男が食べる日）でも付く。長男を外した日は柿色の文で料理の名前
{
    const {p, ctx} = await open({}, 'kept');
    const r = await p.evaluate(() => {
        const ids = session.menu.items.map(x => x.r).filter(Boolean).map(r => r.id), slots = session.menu.items.filter(x => x.r).map(x => x.slot);
        const fam = fk => { S.family = [{id: 'r16', name: '長男', role: 'child', allergy: ['@' + fk], avoid: ['@' + fk], mild: false}]; setEaters(null); };
        const fk = Object.keys(FAM_ALG).find(f => { fam(f); return ids.some(id => allergyConflict(byId(id))) && !ids.every(id => allergyConflict(byId(id))); });
        if (!fk) return null;
        keepSet({d: TODAY, ids, slots});
        fam(fk); save(); setTab('today'); render();
        const el = () => document.querySelector('#view .kept-offer'), hit = ids.filter(id => allergyConflict(byId(id))).map(id => byId(id).name), no = ids.filter(id => !allergyConflict(byId(id))).map(id => byId(id).name);
        const tIn = el() ? el().textContent : '';
        setEaters(['__me']); save(); render();
        const tOut = el() ? el().textContent : '', outEl = el() && el().querySelector('.alg-kept-out'), redOut = el() && el().querySelector('.alg-kept');
        return {fk, hit, no, tIn, tOut, outTx: outEl ? outEl.textContent : '', redOut: !!redOut};
    });
    if (r){
        ok(r.hit.every(n => r.tIn.includes('⚠ ' + n)) && r.no.every(n => !r.tIn.includes('⚠ ' + n + '・') && !r.tIn.includes('⚠ ' + n + '）')) && /選び直します/.test(r.tIn), 'R16-3 R43 長男が食べる日: まわした献立の当たる料理だけに ⚠: ' + JSON.stringify({hit: r.hit, no: r.no, t: r.tIn}));
        ok(r.hit.every(n => r.outTx.includes(n)) && /長男は食べられません/.test(r.outTx) && !r.redOut && r.hit.every(n => !r.tOut.includes('⚠ ' + n)), 'R16-3 長男を外した日: まわした献立のお知らせに柿色の文で料理の名前（赤い ⚠ ではない）: ' + JSON.stringify({hit: r.hit, outTx: r.outTx}));
    } else ok(false, 'R16-3 献立の一部に当たる家族のアレルギーがある');
    await ctx.close();
}

// R16-4 新しい文は17言語すべてにあり、⚠ と {names}（と {list}・{dishes}）を持ち、「食べられる（安心）」の文ではない
{
    const keys = ['⚠ {names}のアレルゲン（{list}）入り', '⚠ {names}のアレルゲン入り', '⚠ {names}のアレルゲン（{list}）を使う料理です。今日の献立は{names}を除いて考えていますが、{names}は食べられません。', '⚠ {names}のアレルゲンを使う料理です。今日の献立は{names}を除いて考えていますが、{names}は食べられません。', '⚠ 「{dishes}」は、{names}のアレルゲンを使う料理です。{names}は食べられません。'];
    const html = fs.readFileSync(path.join(ROOT, 'gohancho', 'index.html'), 'utf8');
    ok(keys.every(k => html.includes(`t('${k}'`)), 'R16-4 5つの文を画面で使っている');
    const miss = [];
    for (const L of 'ar de en es fil fr hi id it ko pl pt-BR th tr vi zh-Hans zh-Hant'.split(' ')){
        let d = null; const GOHAN_I18N = (l, o) => { d = o; }; new Function('GOHAN_I18N', fs.readFileSync(path.join(ROOT, 'gohancho', 'i18n', L + '.js'), 'utf8'))(GOHAN_I18N);
        keys.forEach(k => { const v = d[k]; if (!v) return miss.push(L + ':' + k.slice(0, 14)); const ph = (k.match(/\{\w+\}/g) || []).filter((x, i, a) => a.indexOf(x) === i); if (!/^⚠/.test(v) || ph.some(x => !v.includes(x))) miss.push(L + ' ph:' + k.slice(0, 14)); });
        if (L === 'en' && !/cannot eat/.test(d[keys[4]] || '')) miss.push('en: not "cannot eat"');
    }
    ok(!miss.length, 'R16-4 17言語にあり、⚠ と置き換え記号がそろっている: ' + JSON.stringify(miss.slice(0, 6)));
}
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\n${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
