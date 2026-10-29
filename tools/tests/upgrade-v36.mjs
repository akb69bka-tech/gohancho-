#!/usr/bin/env node
// 本番の切り替え（本体 v36 → 案2 v37）の回帰テスト（使い方: node tools/tests/upgrade-v36.mjs [http://localhost:8795/]）
//  本体 v36 で使っていた人の保存データ（localStorage gohancho.v1。下の OLD は v36 の本体で献立を決めたあとに書き出したもの）を、
//  案2 で開いても壊れない・消えないことを確かめる。
//  ・アレルギー（本人・家族）・家族・苦手・記録・冷蔵庫・お気に入り・保存した献立・残り物・食費・1週間の予定が、開いたあとも再読み込みのあとも同じ
//  ・本体で決めた今日の献立（S.cook）は案2の正本 S.day[今日] に「決めた」として入り、買う段から始まる。作りかけ（S.cook.done）は作る段のつづきから
//  ・前の日に決めた献立は今日に持ち越さず、決める段から始まる（データは消さない）
//  ・アレルギーの料理を避ける判定がそのまま効く（卵・えび・かにの料理を出さない）。例外が出ない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0, opened = 0;
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: got ${JSON.stringify(a)} expected ${JSON.stringify(e)}`);

// 本体 v36（claude/int 13aba18）で、家族・アレルギー・苦手・冷蔵庫・記録を入れて今日の献立を決めたときの保存データ（2026-10-28）
const OLD = {"history":[{"d":"2026-10-26","id":"nikujaga","name":"肉じゃが","slot":"主菜"},{"d":"2026-10-23","id":"shogayaki","name":"豚の生姜焼き","slot":"主菜"}],"favs":["tonjiru","karaage"],"hidden":["tosani"],"fridge":["鶏肉","キャベツ","にんじん","豆腐"],"fridgeMeta":{"鶏肉":{"d":"2026-10-28","cut":"もも"},"キャベツ":{"d":"2026-10-28"},"にんじん":{"d":"2026-10-28"},"豆腐":{"d":"2026-10-28"}},"staples":["米"],"savedMenus":[{"id":"sm1","name":"いつもの","ids":["tacorice","tonjiru"],"slots":["主菜","汁物"]}],"skills":[],"custom":[],"seenTwists":[],"awards":{},"week":{"start":"2026-10-26","days":[{"d":"2026-10-26","id":"tacorice"},{"d":"2026-10-29","id":"tonjiru","who":"夫"}]},"onboarded":true,"firstUse":"2026-09-01","pro":null,"usage":{},"usedDays":["2026-10-28"],"trialNoticeShown":false,"settings":{"avoidDays":10,"dishCount":3,"servings":3,"avoid":["セロリ"],"uiLang":"ja","country":"JP","allergens":["shrimp","crab"],"mix":{},"scarce":[]},"family":[{"id":"f1","name":"娘","role":"child","avoid":["@egg","ピーマン"],"allergy":["@egg"],"mild":true,"sometimes":false,"me":false},{"id":"f2","name":"夫","role":"adult","avoid":["なす"],"allergy":[],"mild":false,"sometimes":false,"me":false}],"eaters":["__me","f1"],"leftovers":[{"id":"tonjiru","name":"豚汁","d":"2026-10-27"}],"spend":[{"id":"sp1","d":"2026-10-27","a":1800}],"foodLog":[{"d":"2026-10-26","n":"キャベツ","r":"u"}],"stock":[{"id":"s0","n":"米","q":1,"e":"","d":""}],"stockLog":[{"d":"2026-10-25","n":"米"}],"draft":{"d":"2026-10-28","cc":"JP","n":3,"adj":false,"slots":["主菜","副菜","汁物"],"ids":["karaage","agedashidofu","ishikarijiru"],"mood":"all","useFridge":false,"salt":0},"shopDone":{"week":"2026-10-26","keys":[]},"albumMigrated":true,"cook":{"d":"2026-10-28","ids":["karaage","agedashidofu","ishikarijiru"],"slots":["主菜","副菜","汁物"],"done":{},"adj":false,"salt":0}};
// 引き継ぐもの（v36 の形のまま残す）
// draft（まだ決めていない今日の案）は、品数を席の数で読むようになった版（基準書 7章 4A）では作り直してよい（3 で、決めた献立・記録が変わらないことと、新しい案の品数を見る）
const KEEP = ['history', 'favs', 'hidden', 'fridge', 'fridgeMeta', 'staples', 'savedMenus', 'week', 'onboarded', 'firstUse', 'family', 'eaters', 'leftovers', 'spend', 'foodLog', 'stock', 'stockLog'];
const KEEP_SET = ['avoidDays', 'dishCount', 'servings', 'avoid', 'uiLang', 'country', 'allergens'];

async function open(state){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo', locale: 'ja-JP' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('upgrade-v36', String(++opened))));
    const p = await ctx.newPage(); p.errs = [];
    p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) p.errs.push(m.text()); });
    await p.clock.install({ time: new Date('2026-10-28T18:00:00+09:00') });
    await p.addInitScript(raw => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', raw); } }, JSON.stringify(state));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof session !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *'), null, { timeout: 30000 });
    await p.waitForTimeout(600); p.ctx = ctx; return p;
}
const snap = p => p.evaluate(() => ({ S: JSON.parse(JSON.stringify(S)), saved: JSON.parse(localStorage.getItem('gohancho.v1') || '{}'), today: TODAY, stage: session.stage, tab,
    view: ((document.querySelector('#view') || {}).innerText || '').replace(/\s+/g, ' ') }));
function kept(s, label){
    for (const k of KEEP) eq(s[k], OLD[k], `${label}: ${k} が v36 のまま`);
    for (const k of KEEP_SET) eq(s.settings[k], OLD.settings[k], `${label}: settings.${k} が v36 のまま`);
}

// 1) 今日の献立を決めたあと（買う前）
{
    const p = await open(OLD);
    const a = await snap(p);
    eq(a.today, '2026-10-28', '1 今日の日付');
    kept(a.S, '1 開いたとき'); kept(a.saved, '1 保存したデータ');
    eq(a.S.cook.ids, OLD.cook.ids, '1 決めた献立（S.cook）はそのまま');
    eq(await p.evaluate(() => { setTab('today'); return menuIds(); }), OLD.cook.ids, '1 今日の献立のお膳は決めた献立のまま（品数を席の数で読む版でも作り直さない）');
    eq(a.S.day && a.S.day['2026-10-28'] && a.S.day['2026-10-28'].state, 'decided', '1 案2の正本 S.day[今日] は「決めた」');
    eq((((a.S.day || {})['2026-10-28'] || {}).items || []).map(x => x.id), OLD.cook.ids, '1 S.day[今日] の料理は決めた献立と同じ');
    eq(a.stage, 'shop', '1 買う段から始まる');
    const names = await p.evaluate(ids => ids.map(id => byId(id).name), OLD.cook.ids);
    ok(names.every(n => a.view.includes(n)), '1 決めた料理が画面に出る: ' + names.join('・') + ' / ' + a.view.slice(0, 200));
    const g = await p.evaluate(() => {
        const has = (r, re) => r.items.some(i => !i.opt && re.test(String(i.key || '') + ' ' + String(i.text || '')));
        const egg = RECIPES.filter(r => has(r, /^卵|卵 /)), ebi = RECIPES.filter(r => has(r, /えび|かに/));
        return { cookAv: S.cook.ids.filter(id => isAvoided(byId(id))), egg: egg.length, eggOk: egg.filter(r => !isAvoided(r)).map(r => r.id).slice(0, 5),
            ebi: ebi.length, ebiOk: ebi.filter(r => !isAvoided(r)).map(r => r.id).slice(0, 5),
            menuAv: session.menu ? session.menu.items.filter(x => x.r && isAvoided(x.r)).map(x => x.r.id) : [] };
    });
    eq(g.cookAv, [], '1 決めた献立にアレルギー・苦手の料理がない');
    ok(g.egg > 0 && g.eggOk.length === 0, '1 家族（娘）の卵のアレルギーが効く（卵の料理を避ける）: ' + JSON.stringify(g));
    ok(g.ebi > 0 && g.ebiOk.length === 0, '1 本人のえび・かにのアレルギーが効く: ' + JSON.stringify(g));
    eq(g.menuAv, [], '1 今日の案にもアレルギー・苦手の料理がない');
    // 再読み込みしても同じ
    await p.reload(); await p.waitForTimeout(1200);
    const r = await snap(p);
    kept(r.S, '1 再読み込み'); eq(r.S.cook.ids, OLD.cook.ids, '1 再読み込み: 決めた献立');
    eq(await p.evaluate(() => { setTab('today'); return menuIds(); }), OLD.cook.ids, '1 再読み込み: 今日の献立のお膳も決めた献立のまま'); eq(r.stage, 'shop', '1 再読み込み: 買う段');
    eq(p.errs, [], '1 例外なし');
    await p.ctx.close();
}
// 2) 作りかけ（S.cook.done）→ 作る段のつづきから
{
    const st = JSON.parse(JSON.stringify(OLD)); st.cook.done = { [st.cook.ids[0]]: [0, 1] };
    const p = await open(st);
    const a = await snap(p);
    kept(a.S, '2 作りかけ');
    eq(a.S.cook.done, st.cook.done, '2 作った手順が残る');
    eq(await p.evaluate(() => { setTab('today'); return menuIds(); }), st.cook.ids, '2 今日の献立のお膳は決めた献立のまま');
    eq(((a.S.day || {})['2026-10-28'] || {}).state, 'cooking', '2 S.day[今日] は「作っている」');
    eq(a.stage, 'cook', '2 作る段から始まる');
    eq(p.errs, [], '2 例外なし');
    await p.ctx.close();
}
// 3) 前の日に決めた献立 → 今日は決める段から（記録・家族・アレルギーは残る）
{
    const st = JSON.parse(JSON.stringify(OLD)); st.cook.d = '2026-10-27';
    const p = await open(st);
    const a = await snap(p);
    kept(a.S, '3 前の日の献立');
    eq(a.stage, 'decide', '3 決める段から始まる');
    ok(!a.S.day || !a.S.day['2026-10-28'] || a.S.day['2026-10-28'].state === 'draft', '3 今日はまだ決めていない: ' + JSON.stringify(a.S.day));
    const av = await p.evaluate(() => session.menu ? session.menu.items.filter(x => x.r && isAvoided(x.r)).map(x => x.r.id) : ['(献立なし)']);
    eq(av, [], '3 今日の案にアレルギー・苦手の料理がない');
    const dn = await p.evaluate(() => ({n: session.menu && session.menu.n, want: dishesFor(S.settings.dishCount), cook: S.cook}));
    ok(dn.n === dn.want, '3 今日の案は、保存した品数（席の数）どおり: ' + JSON.stringify(dn));
    eq(dn.cook, st.cook, '3 前の日に決めた献立（S.cook）は変えない');
    eq(p.errs, [], '3 例外なし');
    await p.ctx.close();
}

await b.close();
console.log(fails ? `\n${fails} FAILED / ${checks} checks` : `\nall ${checks} checks passed`);
process.exit(fails ? 1 : 0);
