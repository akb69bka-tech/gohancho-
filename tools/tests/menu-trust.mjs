#!/usr/bin/env node
// 「今日の献立」を信頼できるかの回帰テスト（Playwright。使い方: node tools/tests/menu-trust.mjs [http://localhost:8765/]）
// モニター第1回（佐々木・田村）の指摘と、鷹野の quickfix H1〜H8 の再発を防ぐ:
//  1) 設定を変える → 今日の献立を見ずに開き直す: 苦手・アレルギーに当たる下書きが戻らない（はじめての設定の「アレルギー対策へ」・設定の苦手）
//  2) 決めたあとにアレルゲンを足す: 決めた献立は黙って替わらない（今日・作り方の両方で同じ）。合わない料理に［かえる］［このまま］が出て、
//     ［かえる］はその1品だけ替える（ほかの料理・記録の整合）。開き直しても同じ
//  3) まだ決めていない案にアレルゲンを足す: 当たった枠だけ替わり、何を替えたかを知らせる
//  4) 決めたあとに気分（おかゆの日）・品数・まるごと入れ替え: 確認なしに作り直さない。やめると元のまま、作り直すと「元に戻す」で戻せる
//  5) 入れない材料（ちらし寿司のむきえび）は、作り方の文からも外す
//  6) ちくわ・ワンタンの皮など卵が入っていることがある加工品: 料理は外さず、詳細に注意を出す
//  7) 家族のアレルギーは1回押すだけで登録される（以前の「食べられない食材 → ⚠」も使える）
//  8) 「卵」を卵アレルギーでさがして0件のとき、理由を出す
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
// 古い版のアプリをキャッシュから出さないように、Service Worker は止める（ここで確かめたいのは配信中の index.html）
async function open(store, fresh = false){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    if (!fresh) await p.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: {country: 'JP', dishCount: 3}}, st))); } }, store || {});
    await p.goto(URL_);
    if (!fresh) await booted(p);
    return { ctx, p };
}
const booted = p => p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && !!session.menu, null, { timeout: 30000 });
const openMood = p => p.evaluate(() => document.querySelectorAll('details').forEach(d => { if (d.querySelector('[data-act="mood"]')) d.open = true; }));

// ---------- 1) 設定を変える → 開き直す ----------
for (const k of [0, 1, 2]){
    // はじめての設定で えび → 「アレルギー対策へ」（設定のタブへ移る）→ 開き直す
    const { ctx, p } = await open(null, true);
    await p.waitForSelector('[data-act="pick-country"][data-cc="JP"]', { timeout: 30000 });
    await p.click('[data-act="pick-country"][data-cc="JP"]');
    await p.waitForSelector('[data-act="ob-next"]'); await p.click('[data-act="ob-next"]'); await p.click('[data-act="ob-next"]');
    await p.evaluate(() => { session.menu.items[0].r = byId('ebifry'); keepDraft(); });   // 設定の後ろの案（と下書き）がえびフライ
    await p.click('[data-act="ob-avoid"][data-v="えび"]');
    await p.click('[data-act="ob-allergy"]'); await p.waitForTimeout(300);
    const others = await p.evaluate(() => session.menu.items.slice(1).map(x => x.r && x.r.id));
    await p.reload(); await booted(p);
    const r = await p.evaluate(() => ({ ids: session.menu.items.map(x => x.r && x.r.id), hit: session.menu.items.filter(x => x.r && isAvoided(x.r)).map(x => x.r.id), draft: S.draft && S.draft.ids }));
    ok(!r.hit.length, 'はじめての設定→アレルギー対策へ→開き直す: 苦手の料理が戻らない ' + JSON.stringify(r));
    ok(JSON.stringify(r.ids.slice(1)) === JSON.stringify(others), 'はじめての設定→開き直す: 当たっていない枠は動かない ' + JSON.stringify(others) + ' → ' + JSON.stringify(r.ids.slice(1)));
    await ctx.close();
}
{
    // 設定のタブで苦手を足して、今日の献立を見ずに開き直す（下書きにはえびフライ）
    const { ctx, p } = await open({});
    await p.evaluate(() => { session.menu.items[0].r = byId('ebifry'); keepDraft(); setTab('settings'); });
    await p.evaluate(() => { const a = S.settings.avoid; a.push('えび'); save(); reconcileMenu(); refreshWeek(); render(); });
    await p.reload(); await booted(p);
    const r = await p.evaluate(() => session.menu.items.filter(x => x.r && isAvoided(x.r)).map(x => x.r.id));
    ok(!r.length, '設定で苦手を足す→開き直す: 苦手の料理が戻らない ' + r);
    // 下書きを書き直す前の古いデータ（下書きにえびフライ・苦手にえび）からも、開いたときに選び直す
    await p.evaluate(() => { S.draft.ids[0] = 'ebifry'; save(); });
    await p.reload(); await booted(p);
    const r2 = await p.evaluate(() => ({ ids: session.menu.items.map(x => x.r && x.r.id), draft: S.draft.ids }));
    ok(r2.ids[0] !== 'ebifry' && r2.draft[0] === r2.ids[0], '古い下書き（苦手に当たる）を開いたときに選び直し、下書きも書き直す ' + JSON.stringify(r2));
    await ctx.close();
}

// ---------- 2) 決めたあとにアレルゲンを足す / 3) まだ決めていない案に足す ----------
{
    const { ctx, p } = await open({});
    await p.evaluate(() => setTab('today'));
    // 主菜がえびの料理の献立に決める
    await p.evaluate(() => { session.menu.items[0].r = byId('ebifry'); render(); });
    await p.click('[data-act="decide"]'); await p.waitForTimeout(200);
    const decided = await p.evaluate(() => S.cook.ids.slice());
    await p.evaluate(() => setTab('settings'));
    await p.click('#allergy-card .chip[data-v="shrimp"]'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { setTab('today'); return { ids: menuIds(), cook: S.cook.ids.slice(), warn: !!document.querySelector('.cook-warn [data-act="cook-swap"][data-id="ebifry"]'), keep: !!document.querySelector('.cook-warn [data-act="cook-keep"][data-id="ebifry"]') }; });
    ok(JSON.stringify(r.ids) === JSON.stringify(decided) && JSON.stringify(r.cook) === JSON.stringify(decided), '決めたあとにアレルゲン: 今日の画面も決めた献立も黙って替わらない ' + JSON.stringify(r));
    ok(r.warn && r.keep, '決めたあとにアレルゲン: 今日の画面に［かえる］［このまま］');
    const cookWarn = await p.evaluate(() => { setTab('cook'); return !!document.querySelector('.cook-warn [data-act="cook-swap"][data-id="ebifry"]'); });
    ok(cookWarn, '決めたあとにアレルゲン: 作り方の画面にも同じ知らせ');
    // 開き直しても、決めた献立と知らせはそのまま
    await p.reload(); await booted(p);
    const r2 = await p.evaluate(() => { setTab('today'); return { ids: menuIds(), warn: !!document.querySelector('.cook-warn [data-act="cook-swap"]') }; });
    ok(JSON.stringify(r2.ids) === JSON.stringify(decided) && r2.warn, '開き直しても、決めた献立は替わらず知らせが出る ' + JSON.stringify(r2));
    // ［かえる］: その1品だけ替わる。決めた献立・画面・記録がそろう
    await p.click('.cook-warn [data-act="cook-swap"][data-id="ebifry"]'); await p.waitForTimeout(200);
    const r3 = await p.evaluate(() => ({ ids: menuIds(), cook: S.cook.ids.slice(), hist: S.history.filter(h => h.d === TODAY).map(h => h.id), bad: S.cook.ids.filter(id => isAvoidedCore(byId(id))), warn: !!document.querySelector('.cook-warn') }));
    ok(r3.cook[0] !== 'ebifry' && JSON.stringify(r3.cook.slice(1)) === JSON.stringify(decided.slice(1)), '［かえる］: 当たった1品だけ替わる ' + JSON.stringify(r3.cook));
    ok(JSON.stringify(r3.ids) === JSON.stringify(r3.cook) && !r3.bad.length && !r3.warn, '［かえる］: 今日の画面と決めた献立がそろい、知らせが消える');
    ok(!r3.hist.includes('ebifry') && r3.hist.includes(r3.cook[0]), '［かえる］: 記録も替えた料理になる ' + JSON.stringify(r3.hist));
    // ［このまま］: 知らせを消す（料理はそのまま）
    await p.evaluate(() => { S.settings.allergens = ['egg']; save(); setTab('today'); });
    const eggy = await p.evaluate(() => S.cook.ids.find(id => isAvoidedCore(byId(id))) || null);
    if (eggy){
        await p.click(`.cook-warn [data-act="cook-keep"][data-id="${eggy}"]`); await p.waitForTimeout(150);
        const r4 = await p.evaluate(id => ({ still: S.cook.ids.includes(id), warn: !!document.querySelector(`.cook-warn [data-id="${id}"]`) }), eggy);
        ok(r4.still && !r4.warn, '［このまま］: 料理は替えず、知らせを消す ' + JSON.stringify(r4));
    }
    await ctx.close();
}
{
    // まだ決めていない案: 当たった枠だけ替わり、何を替えたかを知らせる
    const { ctx, p } = await open({});
    await p.evaluate(() => { setTab('today'); session.menu.items[0].r = byId('ebifry'); keepDraft(); render(); });
    const before = await p.evaluate(() => menuIds());
    await p.evaluate(() => setTab('settings'));
    await p.click('#allergy-card .chip[data-v="shrimp"]'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({ ids: menuIds(), toast: (document.querySelector('#toast-root') || {}).innerText || '', draft: S.draft.ids }));
    ok(r.ids[0] !== 'ebifry' && JSON.stringify(r.ids.slice(1)) === JSON.stringify(before.slice(1)), 'まだ決めていない案: 当たった枠だけ替わる ' + JSON.stringify(before) + ' → ' + JSON.stringify(r.ids));
    ok(/えびフライ/.test(r.toast), 'まだ決めていない案: 何を替えたかを知らせる: ' + r.toast);
    ok(JSON.stringify(r.draft) === JSON.stringify(r.ids), 'まだ決めていない案: 下書きもその場で書き直す');
    await ctx.close();
}

// ---------- 4) 決めたあとに気分・品数・まるごと入れ替え ----------
{
    const { ctx, p } = await open({});
    await p.evaluate(() => setTab('today'));
    await p.click('[data-act="decide"]'); await p.waitForTimeout(200);
    await p.evaluate(() => setTab('today'));
    const decided = await p.evaluate(() => S.cook.ids.slice());
    for (const [name, sel] of [['気分（おかゆの日）', '[data-act="mood"][data-k="okayu"]'], ['品数', '[data-act="count"][data-v="4"]'], ['まるごと入れ替え', '[data-act="new-menu"]']]){
        await openMood(p);
        const btn = p.locator(sel).first(); await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.waitForTimeout(200);
        const ask = await p.evaluate(() => ({ sheet: !!document.querySelector('[data-act="redo-yes"]'), ids: menuIds(), mood: session.mood, dc: S.settings.dishCount }));
        ok(ask.sheet && JSON.stringify(ask.ids) === JSON.stringify(decided), name + ': 決めた献立があるときは確認を出し、まだ替えない ' + JSON.stringify(ask));
        await p.click('[data-act="sheet-close"]'); await p.waitForTimeout(150);
        const kept = await p.evaluate(() => ({ ids: menuIds(), mood: session.mood, dc: S.settings.dishCount }));
        ok(JSON.stringify(kept.ids) === JSON.stringify(decided) && kept.mood !== 'okayu' && String(kept.dc) === '3', name + ': 「やめる」で元のまま ' + JSON.stringify(kept));
        await openMood(p);
        await p.locator(sel).first().click(); await p.waitForTimeout(150);
        await p.click('[data-act="redo-yes"]'); await p.waitForTimeout(200);
        const done = await p.evaluate(() => ({ ids: menuIds(), cook: S.cook.ids.slice(), undo: !!document.querySelector('#toast-root [data-act="toast-undo"]') }));
        ok(JSON.stringify(done.ids) !== JSON.stringify(decided) && JSON.stringify(done.cook) === JSON.stringify(decided) && done.undo, name + ': 作り直すと案が替わり、決めた献立は残り、「元に戻す」が出る ' + JSON.stringify(done));
        await p.click('#toast-root [data-act="toast-undo"]'); await p.waitForTimeout(200);
        const back = await p.evaluate(() => ({ ids: menuIds(), mood: session.mood, dc: S.settings.dishCount }));
        ok(JSON.stringify(back.ids) === JSON.stringify(decided) && String(back.dc) === '3', name + ': 「元に戻す」で決めた献立に戻る ' + JSON.stringify(back));
    }
    // 決めていないときは、今までどおり確認なしで作り直す
    await p.evaluate(() => { S.cook = null; save(); render(); });
    await openMood(p);
    await p.click('[data-act="mood"][data-k="okayu"]'); await p.waitForTimeout(200);
    const free = await p.evaluate(() => ({ sheet: !!document.querySelector('[data-act="redo-yes"]'), mood: session.mood }));
    ok(!free.sheet && free.mood === 'okayu', '決めていないときは確認なしで気分を変える ' + JSON.stringify(free));
    await ctx.close();
}

// ---------- 5)〜8) ----------
{
    const { ctx, p } = await open({ settings: { country: 'JP', dishCount: 3, avoid: ['えび'] } });
    const r = await p.evaluate(() => {
        const out = {};
        const w = swappedRecipe(byId('chirashi')); out.omit = (w.swapped && w.swapped.omit || []).map(i => i.name);
        out.steps = w.steps.map(s => typeof s === 'string' ? s : s.t).join(' / ');
        // 全料理: 入れない材料が手順の文にそのまま残らない（残るときは「（入れない）」と添える）
        const left = [];
        for (const av of [['えび'], ['@shellfish'], ['しいたけ'], ['卵'], ['@pork'], ['パクチー'], ['セロリ']]){
            S.settings.avoid = av;
            RECIPES.forEach(r => { const x = swappedRecipe(r); if (!x.swapped || !x.swapped.omit.length) return; const tx = x.steps.map(s => typeof s === 'string' ? s : s.t).join(' ').split('（' + t('入れない') + '）').join('\u0000');
                const keep = x.items.flatMap(i => [i.name, i.label, i.key]).filter(Boolean);
                x.swapped.omit.forEach(i => [i.name, i.label, i.key].filter(n => n && n.length > 1 && !keep.includes(n)).forEach(n => { const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\u0000)'); if (re.test(tx) && !keep.some(k => k.includes(n))) left.push(av + ' ' + r.id + ' ' + n); })); });
        }
        out.left = left; S.settings.avoid = ['えび'];
        return out;
    });
    ok(r.omit.includes('むきえび') && !/えび/.test(r.steps), 'ちらし寿司: むきえびを入れないとき、手順の文にもえびが残らない: ' + r.steps.slice(0, 160));
    ok(/いんげんはゆでる/.test(r.steps) && /錦糸卵・いんげん・のり/.test(r.steps), 'ちらし寿司: 文が自然に残る（いんげんはゆでる・錦糸卵・いんげん・のり）');
    ok(!r.left.length, '全料理: 入れない材料が手順にそのまま残らない ' + r.left.slice(0, 5).join(' ; '));
    const g = await p.evaluate(() => {
        S.settings.avoid = []; S.settings.allergens = ['egg']; save();
        const box = id => { modalId = id; renderModal(); const e = document.querySelector('#allergen-box'); const tx = e ? e.innerText : ''; closeModal(); return tx; };
        return { isobe: box('isobeage'), wantan: box('wantansoup'), shown: ['isobeage', 'wantansoup'].filter(id => !isAvoidedCore(byId(id))).length, mayo: isAvoidedCore(byId('potesala')) };
    });
    ok(/ちくわ（入っていることがある加工品/.test(g.isobe) && /袋の表示を確かめて/.test(g.isobe), 'ちくわ: 卵の注意（断定しない）: ' + g.isobe.slice(0, 120));
    ok(/ワンタンの皮（入っていることがある加工品/.test(g.wantan), 'ワンタンの皮: 卵の注意');
    ok(g.shown === 2, 'ちくわ・ワンタンの皮: 卵を選んでも料理は外さない（注意だけ）');
    ok(g.mayo === true, 'マヨネーズ（よく含まれる）は今までどおり外す');
    const s = await p.evaluate(() => { setTab('fridge'); return searchResultsHtml('卵').replace(/<[^>]+>/g, ' '); });
    ok(/見つかりませんでした/.test(s) && /\d+品は、アレルギー/.test(s), '卵アレルギーで「卵」をさがす: 理由を出す: ' + s.replace(/\s+/g, ' ').slice(0, 120));
    await ctx.close();
}
{
    const { ctx, p } = await open({});
    await p.evaluate(() => setTab('settings'));
    await p.click('[data-act="fam-add"]'); await p.waitForTimeout(150);
    await p.locator('#family-profile .fam-member[open] [data-act="fam-alg-fam"][data-v="egg"]').click(); await p.waitForTimeout(150);
    const r = await p.evaluate(() => ({ avoid: S.family[0].avoid, allergy: S.family[0].allergy, menuEgg: session.menu.items.filter(x => x.r && allergyConflict(x.r)).length }));
    ok(r.allergy.includes('@egg') && r.avoid.includes('@egg') && r.menuEgg === 0, '家族のアレルギー: 1回押すだけで登録され、献立に卵の料理が残らない ' + JSON.stringify(r));
    await p.locator('#family-profile .fam-member[open] [data-act="fam-alg-fam"][data-v="egg"]').click(); await p.waitForTimeout(150);
    const off = await p.evaluate(() => ({ avoid: S.family[0].avoid, allergy: S.family[0].allergy }));
    ok(!off.allergy.length && !off.avoid.length, '家族のアレルギー: もう一度押すと外れる ' + JSON.stringify(off));
    // 以前の方法（食べられない食材 → ⚠）も使える
    await p.evaluate(() => { const e = document.querySelector('#family-profile .fam-member[open] [data-act="fam-avoid"][data-v="なす"]'); const d = e && e.closest('details.avoid-more'); if (d && !d.open) d.querySelector('summary').click(); });
    await p.click('#family-profile .fam-member[open] [data-act="fam-avoid"][data-v="なす"]'); await p.waitForTimeout(150);
    await p.click('#family-profile .fam-member[open] [data-act="fam-allergy"][data-v="なす"]'); await p.waitForTimeout(150);
    const old = await p.evaluate(() => S.family[0].allergy);
    ok(old.includes('なす'), '家族: 食べられない食材 → ⚠ でアレルギーにする方法も残る ' + JSON.stringify(old));
    await ctx.close();
}
await b.close();
ok(errs.length === 0, 'ページのエラー: ' + errs.slice(0, 3).join(' | '));
console.log(fails ? `NG ${fails}/${checks}` : `ALL OK ${checks} checks`);
process.exit(fails ? 1 : 0);
