#!/usr/bin/env node
// 品数を「席の数」で読むようになった版（ご飯の席も1品。オーナーの「6品なら上下3つずつ」・基準書 7章 4A）の引き継ぎテスト
// （使い方: node tools/tests/upgrade-seats.mjs [http://localhost:8795/]）
//  前の版（本体 v36・案2 v52）で「6品」にしていた人の保存データを開いて、
//  ・保存してある品数（settings.dishCount = 6）は書き換えない。画面は6席（上3・下3、ご飯も1品）で「6品」と出る（まだ決めていない今日の案は、副菜が1つ減ってよい）
//  ・その日に決めた献立（S.cook・S.day）は変えない。決めたとおりの席の数（おかず6＋ご飯 = 7席）で、決めた印つきで出す
//  ・記録・保存した献立・家族・アレルギーなど、ほかのデータは変わらない。再読み込みしても同じ。例外が出ない
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
// 本体 v36 の保存データ（upgrade-v36.mjs と同じもの）
const OLD = JSON.parse(readFileSync(new URL('./upgrade-v36.mjs', import.meta.url), 'utf8').match(/^const OLD = (\{.*\});$/m)[1]);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0, opened = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(':')[0]); };
const KEEP = ['history', 'favs', 'hidden', 'fridge', 'staples', 'savedMenus', 'family', 'eaters', 'leftovers', 'spend'];
async function open(state){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo', locale: 'ja-JP' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('upgrade-seats', String(++opened))));
    const p = await ctx.newPage(); p.errs = [];
    p.on('pageerror', e => p.errs.push(e.message));
    await p.clock.install({ time: new Date('2026-10-28T18:00:00+09:00') });
    await p.addInitScript(raw => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', raw); } }, JSON.stringify(state));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && !!document.querySelector('#view > *'), null, { timeout: 30000 });
    await p.waitForTimeout(800); p.ctx = ctx; return p;
}
const look = p => p.evaluate(() => { if (tab !== 'today') setTab('today'); return {
    dc: S.settings.dishCount, cook: S.cook ? S.cook.ids : null, day: S.day && S.day[TODAY] ? {state: S.day[TODAY].state, ids: (S.day[TODAY].items || []).map(x => x.id)} : null,
    menu: session.menu ? session.menu.items.map(x => x.r ? x.r.id : '-') : null, rows: [...document.querySelectorAll('#view .tray .tg-row')].map(e => e.children.length),
    rice: !!document.querySelector('#view .tray .spot.rice'), lab: (document.querySelector('#view .p2-sv') || {}).textContent || '', decided: !!document.querySelector('#view .p2-ok'),
    keep: JSON.stringify(['history', 'favs', 'hidden', 'fridge', 'staples', 'savedMenus', 'family', 'eaters', 'leftovers', 'spend'].map(k => S[k])), saved: JSON.parse(localStorage.getItem('gohancho.v1') || '{}').settings.dishCount }; });
const keepOf = st => JSON.stringify(KEEP.map(k => st[k]));

// 1) v36 で「6品」・今日はまだ決めていない → 6席（上3・下3）、「6品」と出る。保存した値は 6 のまま
{
    const st = JSON.parse(JSON.stringify(OLD)); st.settings.dishCount = 6; delete st.cook; delete st.draft;
    const p = await open(st), a = await look(p);
    ok(a.dc === 6 && a.saved === 6, '1 保存してある品数は 6 のまま（書き換えない）: ' + JSON.stringify([a.dc, a.saved]));
    ok(JSON.stringify(a.rows) === '[3,3]' && a.rice && /6品/.test(a.lab), '1 v36 の「6品」は6席（上3・下3、ご飯も1品）・「6品」と出る: ' + JSON.stringify(a));
    ok(a.keep === keepOf(st), '1 記録・保存した献立・家族などはそのまま');
    await p.reload(); await p.waitForTimeout(1200); const r = await look(p);
    ok(JSON.stringify(r.rows) === '[3,3]' && r.dc === 6 && JSON.stringify(r.menu) === JSON.stringify(a.menu), '1 再読み込みしても6席・同じ案: ' + JSON.stringify([a.menu, r.menu]));
    ok(!p.errs.length, '1 例外なし ' + p.errs.join('|'));
    await p.ctx.close();
}
// 2) v36 で「6品」・今日の献立（おかず6）を決めてある → 決めた献立は変えず、決めたとおり7席で、決めた印つき
{
    const st = JSON.parse(JSON.stringify(OLD)); st.settings.dishCount = 6;
    st.cook = {d: '2026-10-28', ids: ['karaage', 'nikujaga', 'agedashidofu', 'ohitashi', 'kinpira', 'ishikarijiru'], slots: ['主菜', '主菜', '副菜', '副菜', '副菜', '汁物'], done: {}};
    const p = await open(st), a = await look(p);
    const ex = await p.evaluate(ids => ids.every(id => !!byId(id)), st.cook.ids);
    ok(ex, '2 決めた料理がこの版にもある');
    ok(JSON.stringify(a.cook) === JSON.stringify(st.cook.ids), '2 決めた献立（S.cook）はそのまま: ' + JSON.stringify(a.cook));
    ok(JSON.stringify(a.menu) === JSON.stringify(st.cook.ids) && a.decided, '2 今日の献立は決めたとおり（6品＋ご飯）・決めた印: ' + JSON.stringify(a));
    ok(a.rows.reduce((x, y) => x + y, 0) === 7 && a.dc === 6, '2 決めた献立は決めたときの席の数（7席）で出す・設定は6のまま: ' + JSON.stringify(a.rows));
    ok(a.keep === keepOf(st), '2 記録などはそのまま');
    await p.reload(); await p.waitForTimeout(1200); const r = await look(p);
    ok(JSON.stringify(r.cook) === JSON.stringify(st.cook.ids) && JSON.stringify(r.menu) === JSON.stringify(st.cook.ids), '2 再読み込みしても決めた献立のまま');
    ok(!p.errs.length, '2 例外なし ' + p.errs.join('|'));
    await p.ctx.close();
}
// 3) v52（案2）の形: 「6品」・今日の決めた一膳が S.day[今日] にも入っている → 変えない
{
    const st = JSON.parse(JSON.stringify(OLD)); st.settings.dishCount = 6;
    const ids = ['karaage', 'nikujaga', 'agedashidofu', 'ohitashi', 'kinpira', 'ishikarijiru'], slots = ['主菜', '主菜', '副菜', '副菜', '副菜', '汁物'];
    st.cook = {d: '2026-10-28', ids, slots, done: {}, shopOK: 1};
    st.day = {'2026-10-28': {state: 'decided', items: ids.map((id, i) => ({id, slot: slots[i]}))}};
    const p = await open(st), a = await look(p);
    ok(JSON.stringify(a.cook) === JSON.stringify(ids) && a.day && JSON.stringify(a.day.ids) === JSON.stringify(ids) && a.day.state !== 'draft', '3 v52 の決めた一膳（S.cook・S.day）はそのまま: ' + JSON.stringify([a.cook, a.day]));
    ok(JSON.stringify(a.menu) === JSON.stringify(ids) && a.decided, '3 今日の献立も決めたとおり: ' + JSON.stringify(a.menu));
    ok(!p.errs.length, '3 例外なし ' + p.errs.join('|'));
    await p.ctx.close();
}
// 4) v36 で「3品」（おかず3＋ご飯）にしていた人 → 3席（おかず2＋ご飯）。「3品」と出る
{
    const st = JSON.parse(JSON.stringify(OLD)); st.settings.dishCount = 3; delete st.cook; delete st.draft;
    const p = await open(st), a = await look(p);
    const seats = a.rows.reduce((x, y) => x + y, 0);
    ok(a.dc === 3 && a.menu.length === 2 && seats === (a.rice ? 3 : 2) && a.lab.includes(seats + '品'), '4 「3品」はおかず2＋ご飯の3席（一品ものの主菜でご飯の席がない日は2席）: ' + JSON.stringify(a));
    await p.ctx.close();
}

await b.close();
console.log(fails ? `\n${fails} FAILED / ${checks} checks` : `\nall ${checks} checks passed`);
process.exit(fails ? 1 : 0);
