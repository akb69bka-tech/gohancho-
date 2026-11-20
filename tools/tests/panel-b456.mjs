#!/usr/bin/env node
// 利用者モニター第2回〜第4回の残り（B4・B5・B6・R15）と S24 の残り（今日の買い物メモ）。Playwright。使い方: node tools/tests/panel-b456.mjs [http://localhost:8999/]
//  B4: ひとひねりの手順の順番（「はじめに…」は火を使う最初の手順より前、「最後に／仕上げに…」は火を使う手順のあと）を、全部の案で確かめる
//  B5: 「おかゆ・お粥・粥・かゆ・がゆ・オカユ」で同じ10品。漢字で入れた料理名（七草粥・玉子がゆ・饂飩・金平・おみそ汁）も、よみに直して当てる（さがす・食べたいものの検索）
//  B6: タイマー中に「次へ」を続けて押しても手順は1つしか進まない（1回目は「タイマーが残っています」の確認）。国旗を押しても国は替わらず、別の国を選ぶと「国を○○に変えますか？」で確認する
//  R15: 家族のいない人にも、今日の献立のタブに「食べたいもの」の小さな入口（あいさつと同じ行。お膳の位置は変えない）。自分で候補に入れられ、再読み込みでも残る。家族のいる人の送る画面には「送らずに、自分の候補に入れる」
//  S24: 今日決めた献立（カレーの日）の買い物メモに 福神漬け／らっきょう漬け の行（ごま・大豆のアレルギーの日は 🔍）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (settings, tag, extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('b456', tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.addInitScript(([st, ex]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, st)}, ex))); } }, [settings, extra]);
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};

// ---- B4: ひとひねりの手順の順番（味・かたち・味＋かたち の全部の案）
{
    const {p, ctx} = await open({}, 'b4');
    const r = await p.evaluate(() => {
        const bad = []; let n = 0;
        RECIPES.filter(r => !r.pack).forEach(base => { const o = twistOptions(base), combos = [];
            o.flavors.forEach(f => combos.push([f, '']));
            (o.forms || []).forEach(m => combos.push(['', m]));
            o.flavors.forEach(f => (o.forms || []).forEach(m => combos.push([f, m])));
            combos.forEach(([f, m]) => { const tw = buildTwist(twistId(base.id, f, m, '')); if (!tw) return; n++;
                const st = tw.steps.map(x => x.t), formSt = m ? FORMS[m].steps : [];
                const heat = st.map((t, i) => TW_HEAT.test(t) && !formSt.includes(t) ? i : -1).filter(i => i >= 0);
                const firstHeat = heat.length ? heat[0] : -1;
                st.forEach((t, i) => {
                    if (/^はじめに/.test(t) && firstHeat >= 0 && i > firstHeat) bad.push(tw.id + ' 「はじめに」が火のあと(' + i + '>' + firstHeat + ')');
                    if (tw.steps[i].add && /^(最後に|火を止めてから|仕上げに)/.test(t) && !formSt.includes(t) && heat.some(h => h > i)) bad.push(tw.id + ' 「仕上げ」のあとに火を使う手順(' + i + ')');
                });
                // 元の手順（置きかえていないもの）の順番そのものは変わらない
                const orig = base.steps.filter((_, k) => st.includes(base.steps[k])).map(t => st.indexOf(t));
                if (orig.some((v, k) => k && v < orig[k - 1])) bad.push(tw.id + ' 元の手順の順が入れかわった');
            });
        });
        return {n, bad: bad.slice(0, 10), nbad: bad.length};
    });
    ok(r.n > 3000 && r.nbad === 0, `B4 ひとひねり ${r.n}案で手順の順番の狂いなし: ` + JSON.stringify(r.bad));
    await ctx.close();
}

// ---- B5: おかゆ と、漢字で入れた料理名
{
    const {p, ctx} = await open({}, 'b5');
    const r = await p.evaluate(() => {
        const ids = q => searchRecipes(q).hits.map(r => r.id), first = q => (searchRecipes(q).hits[0] || {}).id;
        const okayu = ['おかゆ', 'お粥', '粥', 'かゆ', 'がゆ', 'オカユ'].map(q => [q, ids(q).slice().sort().join()]);
        return {
            okayu, okayuN: ids('おかゆ').length,
            nanakusa: [first('七草粥'), first('七草がゆ'), first('ななくさがゆ')],
            tamago: [first('玉子がゆ'), first('たまご粥'), first('卵がゆ')],
            chuka: [first('中華粥'), first('中華がゆ')],
            udon: [ids('饂飩').slice(0, 3).join(), ids('うどん').slice(0, 3).join()],
            kinpira: [first('金平'), first('きんぴら')],
            miso: [ids('おみそ汁').length, ids('味噌汁').length, ids('みそ汁').length],
            gyoza: [first('餃子'), first('ぎょうざ'), first('ギョーザ')],
            latin: [searchRecipes('karaage').hits.length, searchRecipes('curry').hits.length],   // ローマ字・ラテン文字の検索は今までどおり
        };
    });
    ok(r.okayuN >= 10 && r.okayu.every(x => x[1] === r.okayu[0][1]), 'B5 おかゆ・お粥・粥・かゆ・がゆ・オカユ で同じ料理: ' + JSON.stringify(r.okayu.map(x => [x[0], x[1].split(',').length])));
    ok(r.nanakusa.every(x => x === 'nanakusagayu'), 'B5 七草粥・七草がゆ・ななくさがゆ → 七草がゆ: ' + r.nanakusa);
    ok(r.tamago.every(x => x === 'tamagogayu'), 'B5 玉子がゆ・たまご粥・卵がゆ → 卵がゆが先頭: ' + r.tamago);
    ok(r.chuka.every(x => x === 'chukagayu'), 'B5 中華粥・中華がゆ → 中華がゆ: ' + r.chuka);
    ok(r.udon[0] === r.udon[1] && r.udon[0].includes('udon'), 'B5 饂飩 と うどん で同じ並び: ' + r.udon);
    ok(r.kinpira[0] === r.kinpira[1] && r.kinpira[0], 'B5 金平 と きんぴら: ' + r.kinpira);
    ok(r.miso[0] === r.miso[1] && r.miso[1] === r.miso[2] && r.miso[0] > 0, 'B5 おみそ汁・味噌汁・みそ汁 で同じ数: ' + r.miso);
    ok(r.gyoza.every(x => x === r.gyoza[0] && x), 'B5 餃子・ぎょうざ・ギョーザ: ' + r.gyoza);
    ok(r.latin[0] === 1 && r.latin[1] === 3, 'B5 ローマ字の検索は今までどおり（karaage 1・curry 3）: ' + r.latin);
    // さがすタブの画面と、食べたいものの検索でも同じ
    await p.evaluate(() => { setTab('fridge'); render(); });
    await p.fill('#search-input', '七草粥'); await p.press('#search-input', 'Enter'); await p.waitForTimeout(200);
    const hit = await p.evaluate(() => [...document.querySelectorAll('#search-results [data-act="open"][data-id]')].map(e => e.dataset.id));
    ok(hit[0] === 'nanakusagayu', 'B5 さがすタブで「七草粥」: ' + hit.slice(0, 3));
    await p.evaluate(() => { S.family = [{id: 'f1', name: '長男', role: 'child', allergy: [], avoid: []}]; save(); wishSendOpen(); sheet.q = 'たまご粥'; renderSheet(); });
    const grid = await p.evaluate(() => [...document.querySelectorAll('#wish-grid [data-act="wish-pick"]')].map(e => e.dataset.id));
    ok(grid[0] === 'tamagogayu', 'B5 食べたいものの検索で「たまご粥」: ' + grid.slice(0, 3));
    await ctx.close();
}

// ---- B6: タイマー中に「次へ」を続けて押す／国旗の確認
{
    const {p, ctx} = await open({}, 'b6');
    await p.evaluate(() => { setMenuMain(RECIPES.find(r => r.id === 'curry')); keepDraft(); render(); });
    await p.click('#view [data-act="decide"]'); await p.waitForTimeout(300);
    await p.evaluate(() => { setTab('cook'); render(); }); await p.waitForTimeout(200);
    await p.click('#view [data-act="shop-ok"]'); await p.waitForTimeout(300);
    await p.click('#view [data-act="cook-start"]'); await p.waitForTimeout(300);
    const st = await p.evaluate(() => { const r = cookItems()[session.cookIdx || 0].r; startTimer(600, r.name, '10分', r.id, 0); render(); return {id: r.id, n: r.steps.length}; });
    const bb = await (await p.$('.cook-next')).boundingBox();
    ok(!!bb, 'B6 作る段の「次へ」がある');
    const seen = [];
    for (let i = 0; i < 5; i++){ await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(80); seen.push(await p.evaluate(() => [(S.cook.done || {})[cookItems()[0].r.id] || [], !!session.timerAsk, !!session.celeb])); }
    const done = seen[4][0];
    ok(seen[0][1] === true && done.length <= 1 && !seen[4][2], 'B6 タイマー中に5回続けて押しても、確認が出て手順は1つまで: ' + JSON.stringify(seen.map(x => [x[0].length, x[1]])));
    // 間を置いて押せば進む（確認の「進む」も、ふつうの「次へ」も）
    await p.waitForTimeout(700);
    const ask = await p.evaluate(() => !!session.timerAsk);
    if (!ask){ await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(700); }
    const dock = await p.evaluate(() => (document.querySelector('.actionbar.p2m-ask') || {}).textContent || '');
    ok(/タイマーが残っています/.test(dock), 'B6 タイマー中の「次へ」は確認を出す: ' + dock.slice(0, 40));
    await p.click('.actionbar [data-act="cook-next"][data-force="1"]'); await p.waitForTimeout(700);
    const d2 = await p.evaluate(() => ((S.cook.done || {})[cookItems()[0].r.id] || []).length);
    ok(d2 === done.length + 1, 'B6 間を置いて「進む」を押せば1つ進む: ' + done.length + '→' + d2);
    // 国旗: 1回押しても国は替わらない。別の国を選ぶと確認
    await p.evaluate(() => { setTab('today'); render(); });
    await p.click('#flag-btn'); await p.waitForTimeout(200);
    const f1 = await p.evaluate(() => ({kind: sheet && sheet.kind, cc: S.settings.country, pick: document.querySelectorAll('#sheet-root [data-act="pick-country"]').length}));
    ok(f1.kind === 'country' && f1.cc === 'JP' && f1.pick === 0, 'B6 国旗を1回押しても国は替わらず、選ぶ画面だけ: ' + JSON.stringify(f1));
    await p.evaluate(() => { const b = [...document.querySelectorAll('#sheet-root [data-act="cc-tab"]')].find(x => (x.dataset.ccs || '').split(' ').includes('KR')); if (b) b.click(); });
    await p.waitForTimeout(100); await p.click('#sheet-root [data-act="cc-choose"][data-cc="KR"]'); await p.waitForTimeout(100);
    const f2 = await p.evaluate(() => ({cc: S.settings.country, btn: (document.querySelector('#sheet-root [data-act="pick-country"]') || {}).textContent}));
    ok(f2.cc === 'JP' && /韓国/.test(f2.btn || ''), 'B6 国を選んだだけでは替わらない（決めるボタンに国の名前）: ' + JSON.stringify(f2));
    await p.click('#sheet-root [data-act="pick-country"]'); await p.waitForTimeout(200);
    const f3 = await p.evaluate(() => ({kind: sheet && sheet.kind, cc: S.settings.country, h: (document.querySelector('#sheet-root h2') || {}).textContent, ok: !!document.querySelector('#sheet-root [data-act="country-ok"]'), no: !!document.querySelector('#sheet-root [data-act="sheet-close"]')}));
    ok(f3.kind === 'country-ok' && f3.cc === 'JP' && /変えますか/.test(f3.h) && f3.ok && f3.no, 'B6 別の国は「国を○○に変えますか？」で確認（まだ替わらない）: ' + JSON.stringify(f3));
    await p.click('#sheet-root [data-act="sheet-close"]'); await p.waitForTimeout(200);
    const f4 = await p.evaluate(() => ({cc: S.settings.country, flag: document.querySelector('#flag-btn').textContent, sheet: !!sheet}));
    ok(f4.cc === 'JP' && f4.flag === '🇯🇵' && !f4.sheet, 'B6 「やめる」で国はそのまま: ' + JSON.stringify(f4));
    await ctx.close();
}

// ---- R15: 家族のいない人の「食べたいもの」の入口
{
    const {p, ctx} = await open({}, 'r15');
    const g = await p.evaluate(() => { const row = document.querySelector('#greet .greet-row'), tx = row && row.querySelector('.greet-tx'), bt = row && row.querySelector('.req-btn.lite'); return {fam: famMembers().length, cls: row && row.className, rowH: row && row.getBoundingClientRect().height, txH: tx && tx.getBoundingClientRect().height, bt: bt && bt.textContent.trim(), btH: bt && bt.getBoundingClientRect().height, same: !!bt && !!tx && Math.abs(bt.getBoundingClientRect().top + bt.getBoundingClientRect().height / 2 - (tx.getBoundingClientRect().top + tx.getBoundingClientRect().height / 2)) < 8}; });
    ok(g.fam === 0 && g.bt === '食べたいもの' && g.same, 'R15 家族のいない人に「食べたいもの」の入口（あいさつと同じ行）: ' + JSON.stringify(g));
    ok(g.rowH <= Math.max(g.txH, 36) + 1, 'R15 入口であいさつの行が高くならない（お膳を下げない）: ' + g.rowH + ' / ' + g.txH);
    await p.click('#greet .req-btn.lite'); await p.waitForTimeout(200);
    const s1 = await p.evaluate(() => ({kind: sheet && sheet.kind, tx: document.querySelector('#sheet-root').innerText.replace(/\s+/g, ' ')}));
    ok(s1.kind === 'wish-list' && /まだありません/.test(s1.tx) && /食べたいものを選ぶ/.test(s1.tx) && !/届いているもの/.test(s1.tx), 'R15 入口から食べたいものの一覧（一人向けの文）: ' + s1.tx.slice(0, 120));
    await p.click('#sheet-root [data-act="wish-open"]'); await p.waitForTimeout(200);
    const s2 = await p.evaluate(() => ({kind: sheet && sheet.kind, lead: (document.querySelector('#sheet-root .wsh-lead') || {}).textContent, name: !!document.querySelector('#sheet-root .wsh-name'), acts: [...document.querySelectorAll('#sheet-root .wsh-actions button')].map(b => b.dataset.act)}));
    ok(s2.kind === 'wish-send' && !/作る人に届いて/.test(s2.lead) && !s2.name && s2.acts[0] === 'wish-keep' && s2.acts.includes('wish-make'), 'R15 選ぶ画面は「候補に入れる」が主（送る名前の欄はない）: ' + JSON.stringify(s2));
    const picked = await p.evaluate(() => { const b = document.querySelector('#wish-grid [data-act="wish-pick"]'); b.click(); return b.dataset.id; });
    await p.click('#sheet-root [data-act="wish-keep"]'); await p.waitForTimeout(300);
    const s3 = await p.evaluate(() => ({sheet: !!sheet, w: S.wants.map(w => [w.id, !!w.self, w.n]), act: wishesActive().length, req: (document.querySelector('#greet .req-btn') || {}).textContent, lite: !!document.querySelector('#greet .req-btn.lite')}));
    ok(!s3.sheet && s3.w.length === 1 && s3.w[0][0] === picked && s3.w[0][1] && s3.act === 1 && /自分/.test(s3.req || '') && !s3.lite, 'R15 候補に入れると入口に「自分：○○」: ' + JSON.stringify(s3));
    await p.reload(); await ready(p);
    const s4 = await p.evaluate(() => ({act: wishesActive().length, self: S.wants.map(w => !!w.self), req: (document.querySelector('#greet .req-btn') || {}).textContent}));
    ok(s4.act === 1 && s4.self[0] && /自分/.test(s4.req || ''), 'R15 再読み込みでも自分の候補として残る: ' + JSON.stringify(s4));
    // 一覧の行の文と、今日に入れる
    await p.click('#greet .req-btn'); await p.waitForTimeout(200);
    const s5 = await p.evaluate(() => document.querySelector('#sheet-root').innerText.replace(/\s+/g, ' '));
    ok(/自分で入れた料理/.test(s5) && !/から届いた/.test(s5), 'R15 一覧の行は「自分で入れた料理」: ' + s5.slice(0, 160));
    // 家族のいる人: 送る画面に「送らずに、自分の候補に入れる」も
    await p.evaluate(() => { closeSheet(); S.family = [{id: 'f1', name: '長男', role: 'child', allergy: [], avoid: []}]; save(); render(); wishSendOpen(); });
    const s6 = await p.evaluate(() => ({name: !!document.querySelector('#sheet-root .wsh-name'), acts: [...document.querySelectorAll('#sheet-root .wsh-actions button')].map(b => b.dataset.act), lead: (document.querySelector('#sheet-root .wsh-lead') || {}).textContent, req: (document.querySelector('#greet .req-btn') || {}).textContent}));
    ok(s6.name && s6.acts[0] === 'wish-make' && s6.acts[1] === 'wish-keep' && /作る人に届いて/.test(s6.lead) && /家族リクエスト/.test(s6.req || ''), 'R15 家族のいる人は今までどおり（送るが主、「送らずに」も）: ' + JSON.stringify(s6));
    await ctx.close();
    // 英語でも入口の言葉が訳される
    const en = await open({uiLang: 'en'}, 'r15-en');
    const e1 = await en.p.evaluate(() => ({lite: (document.querySelector('#greet .req-btn.lite') || {}).textContent || '', lang: LANG}));
    ok(e1.lang === 'en' && e1.lite.trim() && !/食べたい/.test(e1.lite), 'R15 英語の入口: ' + JSON.stringify(e1));
    await en.ctx.close();
}

// ---- S24: 今日決めた献立の買い物メモに 福神漬け／らっきょう漬け
for (const [st, want, may] of [[{}, '福神漬け', null], [{allergens: ['sesame']}, '福神漬け', 'sesame'], [{allergens: ['soy']}, 'らっきょう漬け', 'soy']]){
    const {p, ctx} = await open(st, 's24-' + (may || 'none'));
    await p.evaluate(() => { setMenuMain(RECIPES.find(r => r.id === 'curry')); keepDraft(); render(); });
    await p.click('#view [data-act="decide"]'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const {rows} = todayShopRows(); return {dec: decidedToday(), rows: rows.map(e => [e.label, (e.may || []).join()])}; });
    const row = r.rows.find(x => x[0] === want);
    ok(r.dec && !!row && (may ? row[1].includes(may) : !row[1]), `S24 今日の買い物メモに ${want}${may ? '（🔍 ' + may + '）' : ''}: ` + JSON.stringify(r.rows));
    await ctx.close();
}

ok(errs.length === 0, 'ページのエラーなし: ' + errs.join(' | '));
await b.close();
console.log(`${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
