#!/usr/bin/env node
// 第41回（安全）: 「家族にアレルギーや食の決まりはありますか？」→［ある（設定する）］から設定して戻ったときの守り（R189〜R194）の回帰テスト
//  使い方: node tools/tests/safe41.mjs [http://localhost:9251/]
//  A1 R189 ブラジル・ベジタリアン: えびの主菜（Camarão alho e óleo など）で「決定」→［ある］→ 食の決まりへ → ベジタリアン → 戻る。
//     えびの主菜は合う料理に替わり、「食の決まりに合わない料理を替えました（主菜：A → B）」が1回出る。合っていた料理は動かない。「決定」で聞かずに決まる
//  A2 R190 日本・卵: 卵の主菜で同じ流れ（アレルギー対策で卵）。卵の料理は替わり、「アレルギーに合わない料理を替えました（主菜：…）」。⚠ の料理は残らない
//  A3 R190 合う料理がなく残った料理: 食の決まりの料理にも ⚠ と理由（「⚠ 食の決まり（えび）」）。「決定」で確かめを1回（［替える］［このまま決める］）
//     ［替える］→ 合う料理に替わり、まだ決めない／［このまま決める］→ 決まる（作り方の画面でもう一度は聞かない）。アレルギーの料理でも同じ
//  A4 R189 シートの文言は「⚠ が付きます」ではなく「合う料理に替えます」
//  B1 R191 コーシャ（豚肉と、えび・かに・貝）・豚肉を食べない・牛肉を食べないを入れた人には、決めるときに聞かない
//  B2 R191 インド: 苦手・食の決まりに牛肉のボタンがある。押して戻ると、決めるときに聞かない
//  C1 R192 シートが開くと焦点がシートの中へ。Tab はシートの中を回る。閉じると「この献立に決定」へ戻る
//  C2 R193 幅195px・文字もっと大きい: ［ない］［ある］がスクロールせずに見えて押せる
//  D1 R194 タイ語の「ปู」（かに）・各言語のえび・かにの基本の言葉が、家族のアレルギーで読める（料理が外れる。日本の料理で照らす）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const booted = p => p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 30000 }).catch(() => {});
const ctxOf = async (o, tag) => {
    const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, locale: o.locale || 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('safe41', tag)));
    if (o.state) await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, o.state);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await booted(p);
    await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return { p, ctx };
};
const fresh = async (tag, cc = 'JP', o = {}) => {
    const r = await ctxOf(o, tag);
    await r.p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 });
    await pickCountry(r.p, cc);
    await r.p.waitForSelector('#sheet-root [data-act=ob-done]', { timeout: 30000 });
    await r.p.click('#sheet-root [data-act=ob-done]');
    await r.p.waitForFunction(() => S.onboarded === true && !sheet && session.menu && document.querySelector('#view [data-act=decide]'), null, { timeout: 30000 });
    await r.p.waitForTimeout(300);
    return r;
};
const st = p => p.evaluate(() => ({ sheet: sheet && sheet.kind, decided: decidedToday(), ask: S.algAsk, tab, h2: (document.querySelector('#sheet-root h2') || {}).textContent || '' }));
const clickDecide = async p => { await p.evaluate(() => { if (tab !== 'today') setTab('today'); session.stage = 'decide'; render(); }); await p.waitForTimeout(150); await p.click('#view [data-act=decide]'); await p.waitForTimeout(500); };
// 主菜を「当たる料理」にして、ほかの料理は当たらないものにする（hit: 料理 → 当たるか。ページの中で評価する式の文字列）
const setMain = (p, hitSrc, re) => p.evaluate(([hitSrc, re]) => {
    const hit = new Function('r', 'return ' + hitSrc);
    const it = session.menu.items, m0 = it[0].r, rx = re ? new RegExp(re, 'i') : null;
    // 同じ枠に当たる料理がないとき（献立の並びが変わったとき）は、同じ種類の料理から選ぶ
    const c1 = RECIPES.filter(r => hit(r) && r.id !== m0.id && !S.hidden.includes(r.id)), cT = c1.filter(r => r.type === m0.type), c0 = cT.length ? cT : c1.filter(r => r.type === '主菜'), cs = c0.filter(r => slotOf(r) === slotOf(m0)), cand = cs.length ? cs : c0;
    const e = (rx && cand.find(r => rx.test(r.name))) || cand[0]; if (!e) return null;
    for (let i = 1; i < it.length; i++) if (it[i].r && hit(it[i].r)){ const alt = RECIPES.find(r => slotOf(r) === slotOf(it[i].r) && r.type === it[i].r.type && !hit(r) && !it.some(x => x.r && x.r.id === r.id)); if (alt) it[i].r = alt; }
    it[0].r = e; keepDraft(); render();
    return { main: e.id, name: e.name, ids: it.map(x => x.r && x.r.id) };
}, [hitSrc, re]);
const SHELL = "(r.items || []).some(i => inFam('shellfish', i)) && !(r.items || []).some(i => ['pork','chicken','beef','fish'].some(f => inFam(f, i)))";
const EGG = "(() => { const a0 = S.settings.allergens; S.settings.allergens = ['egg']; try{ return !!allergyConflict(r); } finally { S.settings.allergens = a0; } })()";
const askYes = async p => {
    await p.click('#sheet-root [data-act=alg-ask-yes]');
    await p.waitForFunction(() => tab === 'settings', null, { timeout: 10000 }); await p.waitForTimeout(500);
};
const back = async p => { await p.click('#view [data-act=settings-back]'); await p.waitForTimeout(600); };
const menuState = p => p.evaluate(() => ({ tab, decided: decidedToday(), ids: session.menu.items.map(x => x.r && x.r.id), bad: session.menu.items.filter(x => x.r && isAvoidedCore(x.r)).map(x => x.r.id),
    note: (document.querySelector('#view .avoid-note') || {}).textContent || '', toast: (document.querySelector('#toast-root') || {}).textContent || '',
    tags: [...document.querySelectorAll('#view .tray .spot .alg-tag:not(.may):not(.salt):not(.out)')].map(e => e.textContent) }));

// ---- A1 R189 ブラジル・ベジタリアン ----
if (want('A1')){
    const { p, ctx } = await fresh('a1', 'BR');
    const pre = await setMain(p, SHELL, 'camar');
    ok(!!pre, 'A1 前提: 主菜をえびの料理に: ' + JSON.stringify(pre));
    // ベジタリアンに合わない料理（主菜のほかにも、だしなどで当たる料理があれば、それも替わる）
    const vbad = await p.evaluate(() => { const a0 = S.settings.avoid; S.settings.avoid = ['@pork', '@chicken', '@beef', '@fish', '@shellfish']; try{ return session.menu.items.map(x => !!x.r && isAvoidedCore(x.r)); } finally { S.settings.avoid = a0; } });
    await clickDecide(p);
    const s0 = await st(p);
    ok(s0.sheet === 'alg-ask' && !s0.decided, 'A1 最初の「決定」で聞く: ' + JSON.stringify(s0));
    await askYes(p);
    await p.click('#allergy-card [data-act=alg-jump][data-v=food]'); await p.waitForTimeout(600);
    await p.click('#view .set-panel:not([hidden]) [data-act=toggle-avoid-diet][data-v=vegi]'); await p.waitForTimeout(500);
    await back(p);
    const a = await menuState(p);
    ok(a.tab === 'today' && !a.decided && pre && a.ids[0] !== pre.main && !a.bad.length, 'A1 戻ると、えびの主菜は合う料理に替わっている（合わない料理は残らない）: ' + JSON.stringify([a, pre]));
    ok(pre && a.ids.every((id, i) => vbad[i] || id === pre.ids[i]), 'A1 合っていたほかの料理は動かない: ' + JSON.stringify([a.ids, pre && pre.ids, vbad]));
    ok(/食の決まりに合わない料理を替えました/.test(a.note) && pre && a.note.includes('主菜：' + pre.name), 'A1 「食の決まりに合わない料理を替えました（主菜：A → B）」がはっきり出る: ' + JSON.stringify(a.note));
    await clickDecide(p);
    const s2 = await st(p);
    ok(!s2.sheet && s2.decided, 'A1 そのあとの「決定」は、聞かずに決まる: ' + JSON.stringify(s2));
    await ctx.close();
}

// ---- A2 R190 日本・卵 ----
if (want('A2')){
    const { p, ctx } = await fresh('a2');
    const pre = await setMain(p, EGG);
    ok(!!pre, 'A2 前提: 主菜を卵の料理に: ' + JSON.stringify(pre));
    await clickDecide(p);
    await askYes(p);
    await p.click('#allergy-card [data-act=alg-toggle][data-v=egg]'); await p.waitForTimeout(400);
    await back(p);
    const a = await menuState(p);
    ok(a.tab === 'today' && !a.decided && pre && a.ids[0] !== pre.main && !a.bad.length && !a.tags.length, 'A2 卵の料理は合う料理に替わり、⚠ の料理は残らない: ' + JSON.stringify([a, pre]));
    ok(/アレルギーに合わない料理を替えました/.test(a.note) && pre && a.note.includes('主菜：' + pre.name), 'A2 「アレルギーに合わない料理を替えました（主菜：…）」: ' + JSON.stringify(a.note));
    await clickDecide(p);
    const s2 = await st(p);
    ok(!s2.sheet && s2.decided, 'A2 そのあとの「決定」は、聞かずに決まる: ' + JSON.stringify(s2));
    await ctx.close();
}

// ---- A3 R190 合う料理がなく残った料理: ⚠ と理由、決める前の確かめ ----
if (want('A3')){
    for (const [label, cc, avoid, allergens, hitSrc, re, why, tagRe] of [
        ['食の決まり（ベジタリアン）', 'BR', ['@pork', '@chicken', '@beef', '@fish', '@shellfish'], [], SHELL, 'camar', '食の決まり', /^⚠ 食の決まり（.+）$/],
        ['アレルギー（卵）', 'JP', [], ['egg'], EGG, null, 'アレルギー', /^⚠ /],
    ]){
        for (const choice of ['swap', 'keep']){
            const { p, ctx } = await ctxOf({ state: { onboarded: true, algAsk: 0, firstUse: '2026-11-11', settings: { country: cc, uiLang: 'ja', dishCount: 3, servings: 2, avoid, allergens } } }, 'a3' + cc + choice);
            await p.waitForFunction(() => document.querySelector('#view [data-act=decide]') && session.menu, null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(300);
            // 料理の判定を外して当たる料理を入れる（合う料理がなかった・あとから入った、の代わり）
            const pre = await p.evaluate(([hitSrc, re, avoid, allergens]) => {
                const a0 = S.settings.avoid, g0 = S.settings.allergens; S.settings.avoid = []; S.settings.allergens = [];
                const hit = new Function('r', 'return ' + hitSrc), rx = re ? new RegExp(re, 'i') : null, m0 = session.menu.items[0].r;
                const c1 = RECIPES.filter(r => hit(r)), cT = c1.filter(r => r.type === m0.type), c0 = cT.length ? cT : c1.filter(r => r.type === '主菜'), cs = c0.filter(r => slotOf(r) === slotOf(m0)), cand = cs.length ? cs : c0;
                S.settings.avoid = a0; S.settings.allergens = g0;
                const e = (rx && cand.find(r => rx.test(r.name))) || cand[0]; if (!e) return null;
                session.menu.items[0].r = e; keepDraft(); render(); return { id: e.id, name: e.name };
            }, [hitSrc, re, avoid, allergens]);
            ok(!!pre, `A3 ${label} 前提: 合わない主菜が残った献立: ` + JSON.stringify(pre));
            await p.waitForTimeout(200);
            const tag = await p.evaluate(() => (document.querySelector('#view .tray .spot .alg-tag:not(.may):not(.salt):not(.out)') || {}).textContent || '');
            ok(tagRe.test(tag.trim()), `A3 ${label}: 残った料理に ⚠ と理由: ` + JSON.stringify(tag));
            await clickDecide(p);
            const s = await st(p);
            const btn = await p.evaluate(() => [...document.querySelectorAll('#sheet-root .ask-acts button')].map(b => [b.dataset.act, b.textContent.trim()]));
            ok(s.sheet === 'alg-confirm' && !s.decided && /合わない料理があります/.test(s.h2) && pre && s.h2.includes(pre.name) && s.h2.includes(why), `A3 ${label}: 「決定」で1回確かめる（まだ決めない）: ` + JSON.stringify(s));
            ok(btn.some(x => x[0] === 'alg-confirm-swap' && x[1] === '替える') && btn.some(x => x[0] === 'alg-confirm-keep' && x[1] === 'このまま決める'), `A3 ${label}: ［替える］［このまま決める］: ` + JSON.stringify(btn));
            if (s.sheet !== 'alg-confirm'){ await ctx.close(); continue; }
            if (choice === 'swap'){
                await p.click('#sheet-root [data-act=alg-confirm-swap]'); await p.waitForTimeout(500);
                const a = await menuState(p);
                ok(!a.decided && pre && a.ids[0] !== pre.id && !a.bad.length && new RegExp(why + 'に合わない料理を替えました').test(a.note), `A3 ${label}: ［替える］→ 合う料理に替わり、まだ決めない: ` + JSON.stringify(a));
                await clickDecide(p);
                const s2 = await st(p);
                ok(!s2.sheet && s2.decided, `A3 ${label}: 替えたあとの「決定」はそのまま決まる: ` + JSON.stringify(s2));
            } else {
                await p.click('#sheet-root [data-act=alg-confirm-keep]'); await p.waitForTimeout(600);
                const r = await p.evaluate(() => ({ sheet: sheet && sheet.kind, decided: decidedToday(), ids: S.cook.ids, keep: S.cook.keep || [], warn: !!document.querySelector('.cook-warn') }));
                ok(!r.sheet && r.decided && pre && r.ids.includes(pre.id) && r.keep.includes(pre.id), `A3 ${label}: ［このまま決める］→ 決まる（作り方でもう一度は聞かない）: ` + JSON.stringify(r));
            }
            await ctx.close();
        }
    }
}

// ---- A4 R189 シートの文言 ----
if (want('A4')){
    const { p, ctx } = await fresh('a4');
    await clickDecide(p);
    const tx = await p.evaluate(() => (document.querySelector('#sheet-root .sheet-body p') || {}).textContent || '');
    ok(!/⚠ が付きます/.test(tx) && /合う料理に替えます/.test(tx), 'A4 シートの文は動きと同じ（合う料理に替えます）: ' + JSON.stringify(tx));
    await ctx.close();
}

// ---- B1 R191 コーシャ・豚肉・牛肉を食べない ----
if (want('B1')){
    for (const [label, state] of [
        ['コーシャ（豚肉・えびかに貝）', { settings: { avoid: ['@pork', '@shellfish'] } }],
        ['豚肉を食べない', { settings: { avoid: ['@pork'] } }],
        ['牛肉を食べない', { settings: { avoid: ['@beef'] } }],
        ['家族が牛肉を食べない', { settings: { avoid: [] }, family: [{ id: 'f1', name: 'A', role: 'adult', avoid: ['@beef'], allergy: [] }] }],
    ]){
        const s0 = Object.assign({ onboarded: true, algAsk: 1, firstUse: '2026-11-11' }, state, { settings: Object.assign({ country: 'JP', uiLang: 'ja', dishCount: 'auto', servings: 2 }, state.settings) });
        const { p, ctx } = await ctxOf({ state: s0 }, 'b1' + label);
        await p.waitForFunction(() => document.querySelector('#view [data-act=decide]'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(300);
        await clickDecide(p);
        const s = await st(p);
        ok(!s.sheet && s.decided, `B1 ${label}: 決めるときにもう聞かない: ` + JSON.stringify(s));
        await ctx.close();
    }
}

// ---- B2 R191 インドの牛肉のボタン ----
if (want('B2')){
    const { p, ctx } = await fresh('b2', 'IN');
    await clickDecide(p);
    const s0 = await st(p);
    ok(s0.sheet === 'alg-ask', 'B2 前提: インドで最初の「決定」で聞く: ' + JSON.stringify(s0));
    await askYes(p);
    await p.click('#allergy-card [data-act=alg-jump][data-v=food]'); await p.waitForTimeout(600);
    const has = await p.evaluate(() => { const e = document.querySelector('#view .set-panel:not([hidden]) [data-act=toggle-avoid-fam][data-v=beef]'); return !!e && e.getClientRects().length > 0; });
    ok(has, 'B2 インドの「苦手・食の決まり」に牛肉のボタンがある');
    if (has){ await p.click('#view .set-panel:not([hidden]) [data-act=toggle-avoid-fam][data-v=beef]'); await p.waitForTimeout(400); }
    await back(p);
    await clickDecide(p);
    const s = await st(p);
    ok(!s.sheet && s.decided, 'B2 牛肉を食べないを入れたら、決めるときに聞かない: ' + JSON.stringify(s));
    await ctx.close();
}

// ---- C1 R192 焦点 ----
if (want('C1')){
    const { p, ctx } = await fresh('c1');
    await p.evaluate(() => { session.stage = 'decide'; render(); }); await p.waitForTimeout(150);
    await p.click('#view [data-act=decide]'); await p.waitForTimeout(500);
    const f0 = await p.evaluate(() => ({ sheet: sheet && sheet.kind, inSheet: !!document.activeElement && document.querySelector('#sheet-root').contains(document.activeElement), el: document.activeElement && (document.activeElement.tagName + '.' + (document.activeElement.dataset.act || '')) }));
    ok(f0.sheet === 'alg-ask' && f0.inSheet, 'C1 シートが開くと、焦点がシートの中へ: ' + JSON.stringify(f0));
    const seen = [];
    for (let i = 0; i < 8; i++){ await p.keyboard.press('Tab'); seen.push(await p.evaluate(() => document.querySelector('#sheet-root').contains(document.activeElement) ? (document.activeElement.dataset.act || document.activeElement.tagName) : 'OUT:' + (document.activeElement && (document.activeElement.dataset.act || document.activeElement.tagName)))); }
    ok(!seen.some(x => /^OUT/.test(x)) && seen.includes('alg-ask-no') && seen.includes('alg-ask-yes'), 'C1 Tab はシートの中を回る: ' + JSON.stringify(seen));
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const f1 = await p.evaluate(() => ({ sheet: sheet && sheet.kind, act: document.activeElement && document.activeElement.dataset.act }));
    ok(!f1.sheet && f1.act === 'decide', 'C1 閉じると「この献立に決定」へ戻る: ' + JSON.stringify(f1));
    await ctx.close();
}

// ---- C2 R193 幅195px・文字もっと大きい ----
if (want('C2')){
    for (const lang of ['ja', 'en', 'de', 'ar']){
        const { p, ctx } = await ctxOf({ w: 195, h: 640, state: { onboarded: true, algAsk: 1, firstUse: '2026-11-11', settings: { country: 'JP', uiLang: lang, dishCount: 'auto', servings: 2, avoid: [], textSize: 2 } } }, 'c2' + lang);
        await p.waitForFunction(() => document.querySelector('#view [data-act=decide]') && session.menu, null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(300);
        await p.evaluate(() => { session.stage = 'decide'; sheet = {kind: 'alg-ask', then: 'decide'}; renderSheet(); }); await p.waitForTimeout(400);
        const r = await p.evaluate(() => ['alg-ask-no', 'alg-ask-yes'].map(a => { const e = document.querySelector(`#sheet-root [data-act=${a}]`), q = e.getBoundingClientRect(), h = document.elementFromPoint(q.left + q.width / 2, q.top + Math.min(q.height / 2, 20));
            return { a, top: Math.round(q.top), bottom: Math.round(q.bottom), vh: innerHeight, hit: !!h && (h === e || e.contains(h)) }; }));
        ok(r.every(x => x.top >= 0 && x.bottom <= x.vh && x.hit), `C2 ${lang} 幅195px・文字もっと大きい: ［ない］［ある］が見えて押せる: ` + JSON.stringify(r));
        await ctx.close();
    }
}

// ---- D1 R194 えび・かにの言葉 ----
if (want('D1')){
    const W = [['crab', 'ปู'], ['crab', 'かに'], ['crab', 'カニ'], ['crab', '蟹'], ['crab', 'crab'], ['crab', 'crabe'], ['crab', 'Krabbe'], ['crab', 'granchio'], ['crab', 'cangrejo'], ['crab', 'caranguejo'], ['crab', 'krab'], ['crab', 'yengeç'], ['crab', 'سلطعون'], ['crab', 'केकड़ा'], ['crab', '螃蟹'], ['crab', '게'], ['crab', 'cua'], ['crab', 'kepiting'], ['crab', 'alimango'],
        ['shrimp', 'กุ้ง'], ['shrimp', 'えび'], ['shrimp', '海老'], ['shrimp', 'shrimp'], ['shrimp', 'prawns'], ['shrimp', 'crevettes'], ['shrimp', 'Garnelen'], ['shrimp', 'gamberi'], ['shrimp', 'camarones'], ['shrimp', 'camarão'], ['shrimp', 'krewetki'], ['shrimp', 'karides'], ['shrimp', 'روبيان'], ['shrimp', 'झींगा'], ['shrimp', '虾'], ['shrimp', '새우'], ['shrimp', 'tôm'], ['shrimp', 'udang'], ['shrimp', 'hipon']];
    const { p, ctx } = await ctxOf({ state: { onboarded: true, firstUse: '2026-10-01', settings: { country: 'JP', uiLang: 'th', dishCount: 3, servings: 2, avoid: [] }, family: [{ id: 'f1', name: 'A', role: 'adult', avoid: [], allergy: [] }] } }, 'd1');
    const r = await p.evaluate(W => W.map(([id, w]) => { const m = famMembers()[0]; m.avoid = [w]; m.allergy = [w]; famAlgIds.c = null; return { id, w, ok: famAlgWordOk(w), ids: famAlgIds(), n: RECIPES.filter(r => isAvoided(r)).length }; }), W);
    r.forEach(x => ok(x.ok && x.ids.includes(x.id), `D1 「${x.w}」→ ${x.id}: ` + JSON.stringify(x)));
    const th = r.find(x => x.w === 'ปู');
    ok(th && th.n > 0, 'D1 タイ語の「ปู」を入れると、かにの料理（かに玉など）が外れる（タイの料理には、かにを使う料理がない）: ' + JSON.stringify(th));
    // 画面から入れても「判定できません」にならない
    await p.evaluate(() => { const m = famMembers()[0]; m.avoid = []; m.allergy = []; famAlgIds.c = null; save(); session.famOpen = 'f1'; setGo('family-profile'); }); await p.waitForTimeout(500);
    const inp = '[data-fm=f1] form[data-form=fam-add-alg] input';
    if (await p.$(inp)){
        await p.fill(inp, 'ปู'); await p.press(inp, 'Enter'); await p.waitForTimeout(400);
        const u = await p.evaluate(() => ({ allergy: famMembers()[0].allergy.slice(), bad: !!document.querySelector('[data-fm=f1] .fam-alg-bad') }));
        ok(u.allergy.includes('ปู') && !u.bad, 'D1 画面から「ปู」を入れても「判定できません」にならない: ' + JSON.stringify(u));
    } else ok(false, 'D1 家族のアレルギーの入力欄がない');
    await ctx.close();
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe41: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
