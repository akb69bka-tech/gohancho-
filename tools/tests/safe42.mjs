#!/usr/bin/env node
// 第42回（安全）: 第41回の利用者モニターで見つかった R197・R199・R200 の回帰テスト
//  使い方: node tools/tests/safe42.mjs [http://localhost:9271/]
//  A1 R197 ベジタリアン・ヴィーガン: カレールウ・シチュールウ（肉のエキス・乳がよく入る）など、アレルゲンの表で肉・魚・貝（ヴィーガンは乳・卵も）が
//     「よく含まれる」「入っていることがある」加工品・調味料を使う料理には 🔍「食の決まり（…の袋の表示を確認）」が付く（国・言語をまたいで）。料理は外さない
//  A2 R197 苦手でない人・卵だけの人には 🔍 を付けない（食の決まりでないとき）
//  B1 R200 決める前の確かめで［替える］を押すと、焦点はページの最初（BODY）でなく、替わった料理へ（キーボード・タップの両方）
//  C1 R199 日本で「ベジタリアン向け」「ヴィーガン向け」を押してから戻るまで 1.5秒未満（直す前は約3〜4.5秒）。品数の一言は前と同じ数
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const VEGI = ['@pork', '@chicken', '@beef', '@fish', '@shellfish'], VEGAN = VEGI.concat(['@egg', '@dairy']);
const ctxOf = async (o, tag) => {
    const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, locale: o.locale || 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('safe42', tag)));
    if (o.state) await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, o.state);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 30000 }).catch(() => {});
    await p.waitForFunction(() => document.querySelector('#view [data-act=decide]') && session.menu, null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(300);
    return { p, ctx };
};
const stateOf = (cc, lang, avoid, extra = {}) => ({ onboarded: true, algAsk: 0, firstUse: '2026-11-11', settings: Object.assign({ country: cc, uiLang: lang, dishCount: 3, servings: 2, avoid, allergens: [] }, extra) });
// 料理を献立に入れて（同じ席の料理と入れかえ）、その料理の札（トレイ）と 🔍 の名前を返す
const putAndRead = (p, id) => p.evaluate(id => {
    const r = byId(id); if (!r) return { missing: true };
    const it = session.menu.items; let k = it.findIndex(x => x.r && slotOf(x.r) === slotOf(r)); if (k < 0) k = 0;
    it[k].r = r; keepDraft(); setTab('today'); render();
    const btn = document.querySelector(`#view .tray [data-act="open"][data-id="${CSS.escape(id)}"]`), spot = btn && btn.closest('.spot');
    return { name: r.name, avoided: isAvoidedCore(r), hits: dietMayHits(r), tag: spot ? [...spot.querySelectorAll('.alg-tag.may')].map(e => e.textContent.trim()).join(' / ') : null };
}, id);

// ---- A1 R197 ----
if (want('A1')){
    for (const [cc, lang, avoid, id, re, label] of [
        ['JP', 'ja', VEGAN, 'curry', /カレールウ/, '日本・ヴィーガン・カレーライス（カレールウ）'],
        ['JP', 'ja', VEGI, 'curry', /カレールウ/, '日本・ベジタリアン・カレーライス'],
        ['JP', 'ja', VEGI, 'stew', /シチュールウ/, '日本・ベジタリアン・クリームシチュー（シチュールウ）'],
        ['JP', 'en', VEGAN, 'curry', /./, '日本・英語・ヴィーガン・カレーライス'],
        ['JP', 'ko', VEGI, 'stew', /./, '日本・韓国語・ベジタリアン・クリームシチュー'],
        ['JP', 'ja', VEGI, 'yudofu', /ぽん酢|ポン酢/, '日本・ベジタリアン・湯豆腐（ぽん酢）'],
        ['TW', 'zh', VEGI, 'tw_shacha_kongxincai', /./, '台湾・ベジタリアン・沙茶醬'],
        ['ID', 'id', VEGI, 'id_gadogado', /./, 'インドネシア・ベジタリアン・クルプック'],
        ['US', 'en', VEGAN, 'us_salad', /ranch/i, 'アメリカ・ヴィーガン・ランチドレッシング'],
        ['GB', 'en', VEGAN, 'gb_lentil_pie', /stock/i, 'イギリス・ヴィーガン・野菜のスープの素'],
    ]){
        const { p, ctx } = await ctxOf({ state: stateOf(cc, lang, avoid) }, 'a1' + cc + lang + id);
        const r = await putAndRead(p, id);
        ok(!r.missing && !r.avoided, `A1 ${label} 前提: 料理は外さない（合う料理として出る）: ` + JSON.stringify(r));
        ok(r.hits && r.hits.some(x => re.test(x)), `A1 ${label}: 🔍 の名前に入る: ` + JSON.stringify(r.hits));
        ok(r.tag && /^🔍 /.test(r.tag) && r.hits && r.hits.every(x => r.tag.includes(x)), `A1 ${label}: 献立のトレイに 🔍 の札: ` + JSON.stringify(r.tag));
        if (id === 'curry' && lang === 'ja'){   // 料理の詳しい画面にも「食の決まりに合わない可能性があるもの」の一言
            await p.evaluate(() => { const b = document.querySelector('#view .tray [data-act="open"][data-id="curry"]'); if (b) b.click(); }); await p.waitForTimeout(600);
            const d = await p.evaluate(() => [...document.querySelectorAll('.caution')].map(e => e.textContent).find(x => /食の決まりに合わない可能性/.test(x)) || '');
            ok(/カレールウ/.test(d), `A1 ${label}: 料理の詳しい画面にも 🔍（カレールウ）: ` + JSON.stringify(d));
        }
        await ctx.close();
    }
}

// ---- A2 R197 食の決まりでない人には付けない ----
if (want('A2')){
    for (const [avoid, label] of [[[], '苦手なし'], [['@egg'], '卵だけ'], [['@pork', '@beef'], '豚・牛だけ']]){
        const { p, ctx } = await ctxOf({ state: stateOf('JP', 'ja', avoid) }, 'a2' + avoid.join());
        const r = await putAndRead(p, 'curry');
        ok(!r.missing && r.hits.length === 0 && !r.tag, `A2 ${label}: カレールウでも食の決まりの 🔍 は付けない: ` + JSON.stringify(r));
        await ctx.close();
    }
}

// ---- B1 R200 確かめのシートの［替える］のあとの焦点 ----
if (want('B1')){
    const SHELL = "(r.items || []).some(i => inFam('shellfish', i)) && !(r.items || []).some(i => ['pork','chicken','beef','fish'].some(f => inFam(f, i)))";
    for (const [cc, avoid, hitSrc, how] of [['BR', VEGI, SHELL, 'key'], ['BR', VEGI, SHELL, 'click'], ['JP', VEGI, SHELL, 'key']]){
        const { p, ctx } = await ctxOf({ state: stateOf(cc, 'ja', avoid) }, 'b1' + cc + how);
        const pre = await p.evaluate(hitSrc => {
            const a0 = S.settings.avoid; S.settings.avoid = [];
            const hit = new Function('r', 'return ' + hitSrc), m0 = session.menu.items[0].r;
            const c1 = RECIPES.filter(r => hit(r)), cT = c1.filter(r => r.type === m0.type), c0 = cT.length ? cT : c1.filter(r => r.type === '主菜'), cs = c0.filter(r => slotOf(r) === slotOf(m0)), cand = cs.length ? cs : c0;
            S.settings.avoid = a0;
            const e = cand[0]; if (!e) return null;
            session.menu.items[0].r = e; keepDraft(); setTab('today'); session.stage = 'decide'; render(); return { id: e.id, name: e.name };
        }, hitSrc);
        ok(!!pre, `B1 ${cc} ${how} 前提: 合わない主菜が残った献立: ` + JSON.stringify(pre));
        await p.waitForTimeout(200);
        await p.click('#view [data-act=decide]'); await p.waitForTimeout(500);
        const s = await p.evaluate(() => sheet && sheet.kind);
        ok(s === 'alg-confirm', `B1 ${cc} ${how} 前提: 確かめのシート: ` + s);
        if (s !== 'alg-confirm'){ await ctx.close(); continue; }
        if (how === 'key'){ await p.focus('#sheet-root [data-act=alg-confirm-swap]'); await p.keyboard.press('Enter'); }
        else await p.click('#sheet-root [data-act=alg-confirm-swap]');
        await p.waitForTimeout(800);
        const f = await p.evaluate(() => { const a = document.activeElement; return { tag: a ? a.tagName : null, act: a && a.dataset ? a.dataset.act || '' : '', id: a && a.dataset ? a.dataset.id || '' : '', inView: !!(a && document.querySelector('#view').contains(a)), main: session.menu.items[0].r && session.menu.items[0].r.id, decided: decidedToday() }; });
        ok(f.tag !== 'BODY' && f.inView, `B1 ${cc} ${how}: 焦点が BODY に落ちない: ` + JSON.stringify(f));
        ok(!f.decided && pre && f.main !== pre.id && ((f.act === 'open' && f.id === f.main) || f.act === 'decide' || f.act === 'reroll'), `B1 ${cc} ${how}: 焦点は替わった料理（作り方を見る）へ: ` + JSON.stringify(f));
        await ctx.close();
    }
}

// ---- C1 R199 ベジタリアン向け・ヴィーガン向けの速さ ----
if (want('C1')){
    for (const [lang, k, loc] of [['ja', 'vegan', 'ja-JP'], ['ja', 'vegi', 'ja-JP'], ['en', 'vegi', 'en-US']]){
        const { p, ctx } = await ctxOf({ locale: loc, state: stateOf('JP', lang, []) }, 'c1' + lang + k);
        await p.evaluate(() => setGo('food')); await p.waitForTimeout(800);
        const sel = `#view .set-panel:not([hidden]) [data-act=toggle-avoid-diet][data-v=${k}]`;
        const r = await p.evaluate(sel => {
            const el = document.querySelector(sel); if (!el) return { missing: true };
            const t0 = performance.now(); el.click(); const ms = performance.now() - t0;
            // 品数の一言（置き換える品数・出さない品数）は、作り方の文まで置き換えた形（swappedRecipe）で数えたのと同じ
            let a = 0, bb = 0; RECIPES.forEach(r => { if (isAvoided(r)) bb++; else if (((swappedRecipe(r) || {}).swapped || { swaps: [] }).swaps.length) a++; });
            const sum = (document.querySelector('#view .avoid-sum') || {}).textContent || '';
            return { ms: Math.round(ms), a, b: bb, sum, avoid: S.settings.avoid.slice() };
        }, sel);
        ok(!r.missing && r.avoid.length >= 5, `C1 ${lang} ${k} 前提: ボタンで食の決まりが入る: ` + JSON.stringify(r));
        ok(r.ms < 1500, `C1 ${lang} ${k}: 押してから戻るまで 1.5秒未満: ${r.ms}ms`);
        ok(r.sum && r.sum.includes(String(r.a)) && r.sum.includes(String(r.b)), `C1 ${lang} ${k}: 品数の一言は前と同じ数（置き換え ${r.a}・出さない ${r.b}）: ` + JSON.stringify(r.sum));
        await ctx.close();
    }
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe42: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
