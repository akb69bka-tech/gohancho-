#!/usr/bin/env node
// バックアップ（書き出し・読み込み・元に戻す・お知らせ）の回帰テスト（Playwright。使い方: node tools/tests/backup.mjs [http://localhost:8794/]）
//  ・往復: 新しい項目（fridgeMeta・leftovers・spend・週のskip/担当・家族・保存献立・自作レシピ）まで、書き出して読み込むと同じになる
//  ・壊れたファイル（空・途中で切れた・配列・別のJSON・HTML・巨大）は読み込めず、いまのデータは1つも変わらない。__proto__ で汚染されない
//  ・古い形式（項目が少ない・BOM つき・fridgeMeta なし）と新しい版の目印は読める。別の国・言語・知らない国でも落ちない
//  ・確認に「置き換わります」と件数の要約が出る。読み込む前の状態を1世代だけ控え、「戻す」でき、もう一度押すと読み込んだ状態に戻る
//  ・購入の状態・無料期間の始まり・最後に書き出した日は、読み込みで変わらない
//  ・30日以上バックアップしていないとき（データがあるときだけ）控えめなお知らせ。「あとで」で14日出ない
//  ・iPhone アプリ版: Filesystem+Share / Share だけ / プラグインなし のどれでも書き出せる。取り消したら「書き出した日」を更新しない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
async function open(init){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(x => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(x)); } }, init || {onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:'JP', dishCount:3}});
    await p.goto(URL_); await ready(p); return p;
}
const p = await open();
await p.evaluate(() => { window.ASK = (txt, from) => { setTab('settings'); return askImport(txt, from); }; });
// ---- 往復 ----
const rt = await p.evaluate(async () => {
    const out = {}, d0 = ymd(), d1 = ymd(new Date(Date.now() + 86400000));
    S.history = [{d:d0, id:S.favs[0] || RECIPES[0].id}, {d:'2026-01-02', id:RECIPES[1].id}];
    S.favs = [RECIPES[2].id]; S.fridge = ['玉ねぎ', 'たまご']; S.fridgeMeta = {'玉ねぎ': {d:'2026-05-01', soon:true}, 'たまご': {d:'2026-05-02'}};
    S.leftovers = [{id:'l1', name:'カレー', d:'2026-05-03'}]; S.spend = [{id:'s1', d:'2026-05-03', a:1234.5}];
    S.family = [{id:'f1', name:'はは', role:'adult', avoid:['えび'], allergy:['えび'], mild:false}, {id:'f2', name:'こ', role:'child', avoid:[], allergy:[], mild:true}];
    S.eaters = ['f1']; S.savedMenus = [{id:'m1', name:'金曜', ids:[RECIPES[0].id], slots:['主菜']}];
    S.custom = [{id:'u1', name:'自作丼', ings:['米 1合'], steps:['炊く'], seas:'', type:'主菜', min:10, genre:'和', method:'炒'}];
    S.week = {start:d0, days:[{d:d0, id:RECIPES[0].id, who:'はは'}, {d:d1, id:RECIPES[1].id, skip:true}]};
    S.settings.servings = 4; S.settings.dinnerAt = '19:30'; S.settings.textSize = 2; S.settings.avoid = ['えび']; S.noticeSeen = 'x';
    const json = backupJson(); out.hasMeta = !!JSON.parse(json)._gohancho;
    const before = JSON.stringify(normalizeState(JSON.parse(json)));
    const keepPro = {plan:'x'}; S.pro = keepPro; const fu = S.firstUse = '2025-01-01'; S.lastBackup = '2026-06-01';
    const snapKeep = JSON.stringify([S.pro, S.firstUse, S.lastBackup]);
    // 別の状態に変えてから読み込む
    S.history = []; S.favs = []; S.fridge = []; S.fridgeMeta = {}; S.leftovers = []; S.spend = []; S.family = []; S.savedMenus = []; S.custom = []; S.week = null;
    out.askOk = ASK(json, 'file');
    out.confirm = document.body.innerText;
    document.querySelector('[data-act="import-yes"]').click();
    await new Promise(r => setTimeout(r, 600));
    const after = JSON.stringify(normalizeState(JSON.parse(JSON.stringify(S))));
    const strip = x => { const o = JSON.parse(x); delete o.pro; delete o.firstUse; delete o.lastBackup; delete o.backupSnooze; return JSON.stringify(o); };
    out.same = strip(before) === strip(after);
    out.kept = JSON.stringify([S.pro, S.firstUse, S.lastBackup]) === snapKeep;
    out.counts = [S.history.length, S.fridge.length, Object.keys(S.fridgeMeta).length, S.leftovers.length, S.spend.length, S.family.length, S.savedMenus.length, S.custom.length, S.week.days.length, S.week.days.filter(x => x.skip).length, S.week.days.filter(x => x.who).length, S.eaters.length];
    out.recipeBack = !!RECIPES.find(r => r.id === 'u1');
    out.noMeta = !('_gohancho' in S);
    out.undo = !!loadUndo();
    return out;
});
ok(rt.hasMeta, '書き出しに版・日時の目印がある');
ok(rt.askOk, '往復: 確認が出る');
ok(/置き換わります/.test(rt.confirm) || /replaced/.test(rt.confirm), '確認に「置き換わります」');
ok(/記録2件/.test(rt.confirm) && /保存した献立1件/.test(rt.confirm) && /家族2人/.test(rt.confirm) && /冷蔵庫の食材2品/.test(rt.confirm) && /作り置きメモ1件/.test(rt.confirm) && /食費メモ1件/.test(rt.confirm) && /作らない日1日/.test(rt.confirm) && /担当を決めた日1日/.test(rt.confirm), '確認に件数の要約: ' + rt.confirm.replace(/\s+/g, ' ').slice(0, 0));
ok(rt.same, '往復で全項目が同じ（fridgeMeta・leftovers・spend・skip・担当・家族・保存献立）');
ok(rt.kept, '購入・無料期間の始まり・最後に書き出した日は読み込みで変わらない');
ok(JSON.stringify(rt.counts) === JSON.stringify([2,2,2,1,1,2,1,1,2,1,1,1]), '往復の件数 ' + JSON.stringify(rt.counts));
ok(rt.recipeBack, '自作レシピが読み込み後に使える');
ok(rt.noMeta, '目印 _gohancho は状態に残らない');
ok(rt.undo, '読み込み前の状態が控えられる');
// ---- 元に戻す・やり直す・1世代 ----
const un = await p.evaluate(async () => {
    const o = {}, wait = () => new Promise(r => setTimeout(r, 500));
    const hist0 = S.history.length;   // 読み込んだ状態（2件）
    // 読み込む前の状態は history 0 件だった
    o.undoHist = loadUndo().data.history.length;
    setTab('settings'); o.undoBtn = !!document.querySelector('[data-act="import-undo"]');
    document.querySelector('[data-act="import-undo"]').click(); await wait();
    o.afterUndo = S.history.length; o.customGone = !RECIPES.find(r => r.id === 'u1');
    document.querySelector('[data-act="import-undo"]').click(); await wait();
    o.afterRedo = S.history.length; o.customBack = !!RECIPES.find(r => r.id === 'u1');
    // 2回続けて読み込んでも控えは1世代（直前の状態）だけ
    const j1 = JSON.stringify({history:[{d:'2026-01-01', id:RECIPES[0].id}], favs:[]}), j2 = JSON.stringify({history:[], favs:[RECIPES[0].id, RECIPES[1].id]});
    ASK(j1, 'text'); document.querySelector('[data-act="import-yes"]').click(); await wait();
    ASK(j2, 'text'); document.querySelector('[data-act="import-yes"]').click(); await wait();
    o.gen = [loadUndo().data.history.length, loadUndo().data.favs.length, S.favs.length];
    o.keys = Object.keys(localStorage).filter(k => /undo/i.test(k)).length;
    return o;
});
ok(un.undoHist === 0 && un.undoBtn, '「読み込む前の状態に戻す」が出る');
ok(un.afterUndo === 0 && un.customGone, '戻すと読み込む前の状態（自作レシピも戻る）: ' + JSON.stringify(un));
ok(un.afterRedo === 2 && un.customBack, 'もう一度押すと読み込んだ状態に戻る');
ok(un.gen[0] === 1 && un.gen[1] === 0 && un.gen[2] === 2 && un.keys === 1, '控えは1世代だけ（直前の状態）: ' + JSON.stringify(un.gen));
// ---- 壊れた・別のファイル・巨大 ----
const bad = await p.evaluate(() => {
    const before = JSON.stringify(S), res = {};
    const huge = '{"history":[],"x":"' + 'a'.repeat(13e6) + '"}';
    const cases = {empty:'', spaces:'   \n', nul:'null', arr:'[]', num:'42', str:'"abc"', obj0:'{}', other:'{"name":"x","items":[1,2]}', trunc:'{"history":[{"d":"2026-01-01","id":"a"}', html:'<!doctype html><html></html>', url:'https://example.com/', histStr:'{"history":"x"}', huge};
    for (const k in cases){ pendingConfirm = null; res[k] = ASK(cases[k], 'file'); }
    res.unchanged = JSON.stringify(S) === before; res.pending = pendingConfirm; pendingConfirm = null;
    res.errMsgs = [importErr]; return res;
});
ok(!bad.empty && !bad.spaces && !bad.nul && !bad.arr && !bad.num && !bad.str && !bad.obj0 && !bad.other && !bad.trunc && !bad.html && !bad.url && !bad.histStr && !bad.huge, '壊れた・別のデータ・巨大は読み込めない: ' + JSON.stringify(bad));
ok(bad.unchanged, '読めないデータでいまのデータは変わらない');
const msgs = await p.evaluate(() => { const r = {}; for (const [k, v] of Object.entries({empty:'', other:'{"a":1}', big:'{"history":[],"x":"' + 'a'.repeat(13e6) + '"}'})){ ASK(v, 'file'); r[k] = importErrMsg('file'); } return r; });
ok(msgs.empty !== msgs.other && msgs.other !== msgs.big && msgs.empty.length > 5, '理由ごとに別の案内が出る');
// ---- 古い形式・新しい版・汚染 ----
const old = await p.evaluate(async () => {
    const wait = () => new Promise(r => setTimeout(r, 500)), o = {};
    const imp = async txt => { if (!ASK(txt, 'text')) return false; document.querySelector('[data-act="import-yes"]').click(); await wait(); return true; };
    o.minimal = await imp('{"history":[]}');
    o.favsOnly = await imp(JSON.stringify({favs:[RECIPES[0].id]})) && S.favs.length === 1 && Array.isArray(S.history) && Array.isArray(S.leftovers) && Array.isArray(S.spend) && S.fridgeMeta && typeof S.fridgeMeta === 'object';
    o.bom = await imp('﻿' + JSON.stringify({history:[{d:'2026-02-01', id:RECIPES[0].id}], favs:[]})) && S.history.length === 1;
    // 冷蔵庫の印がなかった頃（fridgeMeta なし）: 食材は残り、登録日は不明（空）
    o.noMeta = await imp(JSON.stringify({history:[], favs:[], fridge:['にんじん']})) && S.fridge[0] === 'にんじん' && S.fridgeMeta['にんじん'] && S.fridgeMeta['にんじん'].d === '';
    // 新しい項目が壊れていても落ちない
    o.junk = await imp(JSON.stringify({history:[null, 3, {d:'bad'}, {d:'2026-03-01', id:'x'}], favs:[1,null,{}], fridge:'a', fridgeMeta:[1], leftovers:[{name:'a', d:'zz'}, 'x'], spend:[{d:'2026-01-01', a:'abc'}, {d:'2026-01-01', a:-5}, {d:'2026-01-01', a:9e12}], family:[null, {id:'a'}, {id:'a'}], week:{start:'x', days:5}, savedMenus:[{id:1}], settings:{servings:'abc', country:12, uiLang:{}, textSize:9}}));
    o.junkShape = S.history.length === 1 && S.leftovers.length === 0 && S.spend.length === 0 && S.family.length === 1 && S.week === null && S.savedMenus.length === 0 && S.settings.servings === 2;
    o.junkRender = (() => { try{ render(); setTab('settings'); setTab('today'); return true; }catch(e){ return String(e); } })();
    // 新しい版の目印
    ASK(JSON.stringify({history:[], favs:[], _gohancho:{v:99, at:'2099-01-01'}}), 'file'); o.newerNote = document.body.innerText.includes('新しい版') || /newer/i.test(document.body.innerText); pendingConfirm = null;
    // __proto__ 汚染
    await imp('{"history":[],"favs":[],"__proto__":{"polluted":1},"settings":{"__proto__":{"polluted2":1}}}');
    o.pollute = ({}).polluted === undefined && ({}).polluted2 === undefined && S.polluted === undefined && Object.getPrototypeOf(S) === Object.prototype;
    o.protoSettings = Object.getPrototypeOf(S.settings) === Object.prototype;
    return o;
});
for (const k of ['minimal', 'favsOnly', 'bom', 'noMeta', 'junk', 'junkShape', 'junkRender', 'pollute', 'protoSettings']) ok(old[k] === true, '古い形式・壊れた項目: ' + k + ' ' + old[k]);
ok(old.newerNote, '新しい版で書き出したファイルには注意が出る');
// ---- 大きいが正しいデータ ----
const big = await p.evaluate(async () => {
    const hist = []; for (let i = 0; i < 6000; i++) hist.push({d:'2025-' + String(1 + i % 12).padStart(2, '0') + '-' + String(1 + i % 28).padStart(2, '0'), id:RECIPES[i % 50].id});
    const spend = []; for (let i = 0; i < 500; i++) spend.push({id:'s' + i, d:'2026-01-01', a:100 + i});
    const j = JSON.stringify({history:hist, favs:[], spend, custom:Array.from({length:60}, (_, i) => ({id:'u' + (100 + i), name:'自作' + i, ings:['a 1'], steps:['x']}))});
    const t0 = performance.now(); const okk = ASK(j, 'file'); document.querySelector('[data-act="import-yes"]').click(); await new Promise(r => setTimeout(r, 700));
    return {okk, h:S.history.length, s:S.spend.length, c:S.custom.length, ms:performance.now() - t0, len:j.length};
});
ok(big.okk && big.h === 6000 && big.s === 400 && big.c === 60, '大きい（約' + Math.round(big.len / 1e3) + 'KB）データも読める（食費メモは上限400件）: ' + JSON.stringify(big));
// ---- 別の国・言語 ----
for (const [cc, lang] of [['KR', 'ko'], ['FR', 'fr'], ['IN', 'hi'], ['ZZ', 'xx'], ['US', 'auto']]){
    const r = await p.evaluate(async ([cc, lang]) => {
        const j = JSON.stringify({history:[{d:'2026-01-01', id:RECIPES[0].id}], favs:[], onboarded:true, settings:{country:cc, uiLang:lang, servings:3}});
        if (!ASK(j, 'file')) return {err:'ask'};
        const sum = importSummary(); document.querySelector('[data-act="import-yes"]').click(); await new Promise(r => setTimeout(r, 1800));
        try{ render(); setTab('settings'); setTab('today'); }catch(e){ return {err:String(e)}; }
        return {sum, country:S.settings.country, lang:LANG, txt:document.body.innerText.length};
    }, [cc, lang]);
    ok(!r.err && r.sum && r.txt > 100, '別の国・言語の設定を読み込める ' + cc + '/' + lang + ' ' + JSON.stringify(r));
}
// ---- お知らせ（30日以上） ----
const nd = await p.evaluate(async () => {
    S.settings.country = 'JP'; S.settings.uiLang = 'auto'; await setLang('ja'); applyCountry('JP');
    const o = {}, d = n => ymd(new Date(Date.now() - n * 86400000)), save0 = JSON.stringify(S);
    S.history = [1, 2, 3].map(i => ({d:'2026-01-0' + i, id:RECIPES[0].id})); S.firstUse = d(10); delete S.lastBackup; delete S.backupSnooze;
    o.new10 = backupDue();
    S.firstUse = d(40); o.never40 = backupDue(); o.noteHtml = backupNoteHtml().includes('この端末');
    S.lastBackup = d(5); o.recent = backupDue(); S.lastBackup = d(31); o.old31 = backupDue(); o.msg31 = backupNoteHtml().includes('31');
    S.lastBackup = d(30); o.edge30 = backupDue(); S.lastBackup = d(29); o.edge29 = backupDue();
    S.lastBackup = d(60); S.backupSnooze = d(3); o.snoozed = backupDue(); S.backupSnooze = d(14); o.snoozeEnd = backupDue();
    S.history = []; S.favs = []; S.custom = []; S.savedMenus = []; S.family = []; S.backupSnooze = undefined; o.noData = backupDue();
    S.history = [1, 2, 3].map(i => ({d:'2026-01-0' + i, id:RECIPES[0].id})); S.lastBackup = d(60); delete S.backupSnooze;
    setTab('today'); o.shown = !!document.querySelector('[data-act="backup-snooze"]');
    document.querySelector('[data-act="backup-snooze"]').click(); o.hidden = !document.querySelector('[data-act="backup-snooze"]') && S.backupSnooze === ymd();
    markBackedUp(); o.marked = S.lastBackup === ymd() && !S.backupSnooze && !backupDue();
    S.lastBackup = 'garbage'; S.backupSnooze = 5; const n = normalizeState(JSON.parse(JSON.stringify(S))); o.normalized = !('lastBackup' in n) && !('backupSnooze' in n);
    setTab('settings'); o.card = document.body.innerText.includes('バックアップ') && !!document.querySelector('#backup-card');
    return o;
});
ok(!nd.new10 && nd.never40 && nd.noteHtml && !nd.recent && nd.old31 && nd.msg31 && nd.edge30 && !nd.edge29 && !nd.snoozed && nd.snoozeEnd && !nd.noData, 'お知らせの条件（30日・あとで14日・データなしは出ない）: ' + JSON.stringify(nd));
ok(nd.shown && nd.hidden && nd.marked && nd.normalized && nd.card, 'お知らせの表示・あとで・書き出し済み・設定のカード: ' + JSON.stringify(nd));
// ---- iPhone アプリ版（プラグインの有無） ----
const nat = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    const setCap = (plugins) => { window.Capacitor = {isNativePlatform: () => true, Plugins: plugins}; };
    const reset = () => { delete S.lastBackup; };
    // 1. Filesystem + Share
    let wrote = null, shared = null;
    setCap({Filesystem:{writeFile: async a => { wrote = a; return {uri:'file:///cache/' + a.path}; }}, Share:{share: async a => { shared = a; }}});
    reset(); await exportDataFile(); await wait(50);
    o.fsShare = !!wrote && wrote.directory === 'CACHE' && /^gohancho-\d{8}\.json$/.test(wrote.path) && !!JSON.parse(wrote.data).history && shared && /^file:\/\//.test(shared.url) && S.lastBackup === ymd();
    // 2. Share だけ → 文字で渡す
    shared = null; wrote = null; setCap({Share:{share: async a => { shared = a; }}}); reset(); await exportDataFile(); await wait(50);
    o.shareOnly = !wrote && shared && !!JSON.parse(shared.text).history && S.lastBackup === ymd();
    // 3. 取り消し → 日付を更新しない
    setCap({Share:{share: async () => { throw new Error('Share canceled'); }}}); reset(); await exportDataFile(); await wait(50);
    o.cancel = !S.lastBackup;
    // 4. プラグインなし（Capacitor はあるが Share/Filesystem なし）→ ブラウザ版の流れ（ダウンロード）
    setCap({}); reset(); window.__dl = 0;
    const origClick = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function(){ if (this.download) window.__dl++; else origClick.call(this); };
    await exportDataFile(); await wait(50);
    o.none = window.__dl === 1 && S.lastBackup === ymd();
    // 5. Filesystem が失敗 → ダウンロードに落ちる
    window.__dl = 0; setCap({Filesystem:{writeFile: async () => { throw new Error('denied'); }}, Share:{share: async () => {}}}); reset(); await exportDataFile(); await wait(50);
    o.fsFail = window.__dl === 1;
    HTMLAnchorElement.prototype.click = origClick; delete window.Capacitor;
    return o;
});
for (const k of ['fsShare', 'shareOnly', 'cancel', 'none', 'fsFail']) ok(nat[k], 'iOS プラグインの有無: ' + k + ' ' + JSON.stringify(nat));
// ---- 文字でコピー（書き出し） ----
const cp = await p.evaluate(async () => { setTab('settings'); document.querySelector('summary').click(); delete S.lastBackup; document.querySelector('[data-act="export"]').click(); await new Promise(r => setTimeout(r, 200)); const v = document.querySelector('#backup-text').value; return {json:!!JSON.parse(v).history, meta:!!JSON.parse(v)._gohancho, date:S.lastBackup === ymd()}; });
ok(cp.json && cp.meta && cp.date, '文字で書き出すと目印つきで、書き出した日が付く');
// ---- 全画面ファイル選択 ----
const fl = await p.evaluate(() => { const i = document.querySelector('#backup-file'); return !!i; });
ok(fl, '設定にファイル選択がある');
await p.setInputFiles('#backup-file', { name:'ok.json', mimeType:'application/json', buffer: Buffer.from(JSON.stringify({history:[], favs:[], fridge:['トマト']})) });
await p.waitForFunction(() => pendingConfirm === 'import', null, { timeout: 5000 }).catch(() => {});   // 固定の 400ms では、並列で重いときに確認が出る前に見てしまう（run-all で時々落ちていた）
await p.waitForTimeout(100);
ok(await p.evaluate(() => pendingConfirm === 'import' && /置き換わります|replaced/.test(document.body.innerText) && /トマト|1/.test(document.body.innerText)), 'ファイルを選ぶと置き換えの確認が出る');
await p.setInputFiles('#backup-file', { name:'bad.json', mimeType:'application/json', buffer: Buffer.from('not json') });
await p.waitForTimeout(400);
ok(await p.evaluate(() => /壊れ|broken|corrupt|damaged/i.test(document.body.innerText) || !!document.querySelector('.toast')), '壊れたファイルを選ぶと案内が出る');
ok(errs.length === 0, 'ページのエラーなし ' + errs.slice(0, 3).join(' | '));
await b.close();
console.log(`backup: ${checks - fails}/${checks} ok, FAIL ${fails}`);
process.exit(fails ? 1 : 0);
