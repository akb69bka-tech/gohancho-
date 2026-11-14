#!/usr/bin/env node
// 第40回（安全）: はじめての設定でアレルギーを聞かなくなったあとの守り（R177・R185・R179・R187）の回帰テスト
//  使い方: node tools/tests/safe40.mjs [http://localhost:9211/]
//  A1 いまの流れで始めた人: 最初の「この献立に決定」で「家族にアレルギーや食の決まりはありますか？」が出る（まだ決めない）。
//     ［ない］→ そのまま決まり、答えを覚える（取り消してもう一度決めても、開き直しても出ない）
//  A2 ［ある］→ 設定のアレルギー対策（家族のアレルギー・食の決まりへの入口が上に）。決めていない。卵を選んで戻ると、
//     卵の料理は合う料理に替わる（第41回 R190: 安全を優先。ほかの料理は動かない）。もう一度「決定」で、聞かずに決まる
//  A3 ［ある］で何も設定せずに戻る → 次の「決定」でまた聞く
//  A4 前から使っている人（設定を終えた人・記録がある人・アレルギーがある人・食の決まりがある人）には出ない。第39回の流れで始めた人（案内が出ている人）には出る
//  A5 料理の詳細の「今日これを作る」（作りはじめる）でも1回だけ聞く。［ない］→ 作り方へ
//  A6 決めた献立の「買う」の段: 畳んだ「調味料 ○つ」の行に、アレルゲンを含む調味料を ⚠ と名前で出す（しょうゆの小麦など）
//  B1 第39回で外れなかった言葉（gluten・グルテン・แป้งสาลี など11件）: 家族の「食べられない食材」に入れて ⚠ を付けると、料理が外れる（または判定できないと知らせて ⚠ を付けない）
//  B2 18言語の言葉の例: 家族のアレルギーに読みかわり、料理が外れる
//  B3 判定できない言葉: ［追加］しても入れず「この言葉はアプリで判定できません…」と近いボタンを出す。前の版で入った言葉は ⚠ なしの「判定なし」
//  C1 21か国: 家族のアレルギーのボタンに 乳製品・グルテンを含む穀物・そば・ごま・キウイ がそろう
//  C2 グルテンを含む穀物のボタン（米国・ペルー）: 大麦の料理も外れる。小麦のボタンだけでは大麦は外れない（区別できる）
//  C3 アレルギー対策の上の「家族のアレルギーへ」で、家族のプロフィールが画面に入る。「食の決まり…へ」で食の決まりのまとめ選びが見える
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
    await ctx.addInitScript(seedScript(seedFor('safe40', tag)));
    if (o.state) await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, o.state);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_); await booted(p);
    await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return { p, ctx };
};
const fresh = async (tag, cc = 'JP', locale = 'ja-JP') => {
    const r = await ctxOf({ locale }, tag);
    await r.p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 });
    await pickCountry(r.p, cc);
    await r.p.waitForSelector('#sheet-root [data-act=ob-done]', { timeout: 30000 });
    await r.p.click('#sheet-root [data-act=ob-done]');
    await r.p.waitForFunction(() => S.onboarded === true && !sheet && session.menu && document.querySelector('#view [data-act=decide]'), null, { timeout: 30000 });
    await r.p.waitForTimeout(300);
    return r;
};
const st = p => p.evaluate(() => ({ sheet: sheet && sheet.kind, decided: decidedToday(), ask: S.algAsk, tab, ids: session.menu ? session.menu.items.map(x => x.r && x.r.id) : null,
    h2: (document.querySelector('#sheet-root h2') || {}).textContent || '' }));
// 決めた献立の取り消し（アプリの「取り消す」と同じ操作）
const undoDecide = async p => { await p.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'undo-decide'; document.querySelector('#view').appendChild(b); b.click(); b.remove(); }); await p.waitForFunction(() => !decidedToday() && !(dayRec() && dayRec().state === 'decided'), null, { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(300); };
const clickDecide = async p => { await p.evaluate(() => { if (tab !== 'today') setTab('today'); session.stage = 'decide'; render(); }); await p.waitForTimeout(150); await p.click('#view [data-act=decide]'); await p.waitForTimeout(500); };   // 決定のあと 350ms は二度押しの守り（tapGuard）で押せないので待つ
// 主菜を卵の料理にして、ほかは卵なしにする
const eggMain = p => p.evaluate(() => {
    const egg = r => { const a0 = S.settings.allergens; S.settings.allergens = ['egg']; try{ return !!allergyConflict(r); } finally { S.settings.allergens = a0; } };
    const it = session.menu.items, m0 = it[0].r;
    const e = RECIPES.find(r => !r.pack && r.type === m0.type && egg(r) && slotOf(r) === slotOf(m0) && r.id !== m0.id); if (!e) return null;
    for (let i = 1; i < it.length; i++) if (it[i].r && egg(it[i].r)){ const alt = RECIPES.find(r => !r.pack && slotOf(r) === slotOf(it[i].r) && r.type === it[i].r.type && !egg(r) && !it.some(x => x.r && x.r.id === r.id)); if (alt) it[i].r = alt; }
    it[0].r = e; keepDraft(); render();
    return { main: e.id, ids: it.map(x => x.r && x.r.id) };
});

// ---- A1 ［ない］ ----
if (want('A1')){
    const { p, ctx } = await fresh('a1');
    await clickDecide(p);
    const s1 = await st(p);
    ok(s1.sheet === 'alg-ask' && !s1.decided && /アレルギー/.test(s1.h2) && /食の決まり/.test(s1.h2), 'A1 最初の「決定」で、アレルギー・食の決まりを1回だけ聞く（まだ決めない）: ' + JSON.stringify(s1));
    const btn = await p.evaluate(() => [...document.querySelectorAll('#sheet-root button[data-act^=alg-ask]')].map(b => [b.dataset.act, b.textContent.trim()]));
    ok(btn.some(x => x[0] === 'alg-ask-no' && /ない/.test(x[1])) && btn.some(x => x[0] === 'alg-ask-yes' && /ある/.test(x[1])), 'A1 ［ない（このまま決める）］［ある（設定する）］: ' + JSON.stringify(btn));
    await p.click('#sheet-root [data-act=alg-ask-no]'); await p.waitForTimeout(400);
    const s2 = await st(p);
    ok(!s2.sheet && s2.decided && s2.ask === 0, 'A1 ［ない］→ そのまま決まり、答えを覚える: ' + JSON.stringify(s2));
    await undoDecide(p);
    await clickDecide(p);
    const s3 = await st(p);
    ok(!s3.sheet && s3.decided, 'A1 取り消してもう一度決めても、もう聞かない: ' + JSON.stringify(s3));
    await undoDecide(p); await p.reload(); await booted(p); await p.waitForTimeout(500);
    if (await p.evaluate(() => decidedToday())) await undoDecide(p);
    await clickDecide(p);
    const s4 = await st(p);
    ok(!s4.sheet && s4.decided, 'A1 開き直しても、もう聞かない: ' + JSON.stringify(s4));
    await ctx.close();
}

// ---- A2 ［ある］→ 設定 → 卵 → 戻る（替えずに ⚠）----
if (want('A2')){
    const { p, ctx } = await fresh('a2');
    const pre = await eggMain(p);
    ok(!!pre, 'A2 前提: 主菜を卵の料理に: ' + JSON.stringify(pre));
    await clickDecide(p);
    await p.click('#sheet-root [data-act=alg-ask-yes]');
    await p.waitForFunction(() => tab === 'settings', null, { timeout: 10000 }); await p.waitForTimeout(500);
    const s = await p.evaluate(() => { const c = document.querySelector('#allergy-card'), r = c && c.getBoundingClientRect();
        return { sheet: sheet && sheet.kind, decided: decidedToday(), card: !!c && r.top < innerHeight && r.bottom > 0, jump: [...document.querySelectorAll('#allergy-card [data-act=alg-jump]')].map(e => e.dataset.v) }; });
    ok(!s.sheet && !s.decided && s.card && s.jump.includes('family-profile') && s.jump.includes('food'), 'A2 ［ある］→ アレルギー対策（家族のアレルギー・食の決まりへの入口）。まだ決めていない: ' + JSON.stringify(s));
    await p.click('#allergy-card [data-act=alg-toggle][data-v=egg]'); await p.waitForTimeout(400);
    await p.click('#view [data-act=settings-back]'); await p.waitForTimeout(500);
    const a = await p.evaluate(() => ({ tab, decided: decidedToday(), ids: session.menu.items.map(x => x.r && x.r.id), tag: [...document.querySelectorAll('#view .tray .spot')].some(e => /⚠/.test((e.querySelector('.alg-tag:not(.may):not(.salt)') || {}).textContent || '')) }));
    ok(a.tab === 'today' && !a.decided && pre && a.ids[0] !== pre.ids[0] && JSON.stringify(a.ids.slice(1)) === JSON.stringify(pre.ids.slice(1)) && !a.tag, 'A2 戻ると、まだ決めていない献立のまま。卵の料理は合う料理に替わり（第41回 R190）、ほかの料理は動かない: ' + JSON.stringify([a, pre && pre.ids]));
    await clickDecide(p);
    const s2 = await st(p);
    ok(!s2.sheet && s2.decided, 'A2 設定したあとの「決定」は、聞かずに決まる: ' + JSON.stringify(s2));
    await ctx.close();
}

// ---- A3 ［ある］で何もせず戻る → また聞く ----
if (want('A3')){
    const { p, ctx } = await fresh('a3');
    await clickDecide(p);
    const s0 = await st(p);
    if (s0.sheet === 'alg-ask'){ await p.click('#sheet-root [data-act=alg-ask-yes]'); await p.waitForFunction(() => tab === 'settings', null, { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(300);
        await p.click('#view [data-act=settings-back]'); await p.waitForTimeout(300); }
    await clickDecide(p);
    const s = await st(p);
    ok(s.sheet === 'alg-ask' && !s.decided, 'A3 何も設定せずに戻ると、次の「決定」でまた聞く: ' + JSON.stringify(s));
    await ctx.close();
}

// ---- A4 前から使っている人 ----
if (want('A4')){
    for (const [label, state, expect] of [
        ['設定を終えた人（アレルギーなし・記録なし）', { onboarded: true, firstUse: '2026-10-01', settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2, avoid: [] } }, false],
        ['記録がある人', { onboarded: false, firstUse: '2026-09-01', history: [{ id: 'nikujaga', d: '2026-10-01' }], settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2, avoid: [] } }, false],
        ['第39回の流れで始めた人（案内が出ている）', { onboarded: true, algHint: true, firstUse: '2026-11-11', settings: { country: 'JP', uiLang: 'ja', dishCount: 'auto', servings: 2, avoid: [] } }, true],
        ['いまの流れ・アレルギーあり', { onboarded: true, algAsk: 1, firstUse: '2026-11-11', settings: { country: 'JP', uiLang: 'ja', dishCount: 'auto', servings: 2, avoid: [], allergens: ['egg'] } }, false],
        ['いまの流れ・家族のアレルギーあり', { onboarded: true, algAsk: 1, firstUse: '2026-11-11', family: [{ id: 'f1', name: 'A', role: 'adult', avoid: ['@egg'], allergy: ['@egg'] }], settings: { country: 'JP', uiLang: 'ja', dishCount: 'auto', servings: 2, avoid: [] } }, false],
        ['いまの流れ・ハラール', { onboarded: true, algAsk: 1, firstUse: '2026-11-11', settings: { country: 'JP', uiLang: 'ja', dishCount: 'auto', servings: 2, avoid: ['@pork', '@alcohol'] } }, false],
        ['いまの流れ・豚肉を食べない（第41回 R191: 決まりとみなす）', { onboarded: true, algAsk: 1, firstUse: '2026-11-11', settings: { country: 'JP', uiLang: 'ja', dishCount: 'auto', servings: 2, avoid: ['@pork'] } }, false],
        ['いまの流れ・苦手（なす）だけ', { onboarded: true, algAsk: 1, firstUse: '2026-11-11', settings: { country: 'JP', uiLang: 'ja', dishCount: 'auto', servings: 2, avoid: ['なす'] } }, true],
        ['いまの流れ・もう答えた人', { onboarded: true, algAsk: 0, firstUse: '2026-11-11', settings: { country: 'JP', uiLang: 'ja', dishCount: 'auto', servings: 2, avoid: [] } }, false],
    ]){
        const { p, ctx } = await ctxOf({ state }, 'a4' + label);
        await p.waitForFunction(() => document.querySelector('#view [data-act=decide]'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(300);
        await clickDecide(p);
        const s = await st(p);
        ok(expect ? s.sheet === 'alg-ask' && !s.decided : !s.sheet && s.decided, `A4 ${label}: ${expect ? '聞く' : '聞かずに決まる'}: ` + JSON.stringify(s));
        await ctx.close();
    }
}

// ---- A5 作りはじめる ----
if (want('A5')){
    const { p, ctx } = await fresh('a5');
    const id = await p.evaluate(() => session.menu.items[1].r.id);
    await p.evaluate(id => openModal(id), id); await p.waitForTimeout(300);
    await p.click('#modal-root [data-act=vid-start]'); await p.waitForTimeout(300);
    const s = await st(p);
    ok(s.sheet === 'alg-ask' && !(await p.evaluate(() => !!(S.cook && S.cook.ids && S.cook.ids.length))), 'A5 「今日これを作る」でも1回だけ聞く: ' + JSON.stringify(s));
    const lab = await p.evaluate(() => (document.querySelector('#sheet-root [data-act=alg-ask-no]') || {}).textContent || '');
    await p.click('#sheet-root [data-act=alg-ask-no]'); await p.waitForTimeout(400);
    const s2 = await p.evaluate(id => ({ tab, inCook: !!(S.cook && S.cook.ids.includes(id)), ask: S.algAsk }), id);
    ok(/作る/.test(lab) && s2.tab === 'cook' && s2.inCook && s2.ask === 0, 'A5 ［ない（このまま作る）］→ 作り方へ: ' + JSON.stringify([lab, s2]));
    await ctx.close();
}

// ---- A6 畳んだ調味料の行の ⚠ ----
if (want('A6')){
    const { p, ctx } = await ctxOf({ state: { onboarded: true, firstUse: '2026-10-01', settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2, avoid: [], allergens: ['wheat'] } } }, 'a6');
    await p.waitForFunction(() => document.querySelector('#view .tray'), null, { timeout: 30000 }).catch(() => {});
    const r = await p.evaluate(async () => {
        // 材料には小麦がなく、調味料（しょうゆなど）にだけ小麦がある料理
        const cand = RECIPES.filter(r => !r.pack && r.seas && /醤油|しょうゆ/.test(r.seas) && !(r.items || []).some(i => !PANTRY.has(i.key) && algItemHit(['wheat'], i)));
        const r = cand[0]; if (!r) return null;
        S.cook = {d: TODAY, ids: [r.id], slots: [slotOf(r)], done: {}}; save(); session.stage = 'shop'; setTab('cook'); render(); await __tick();
        const f = document.querySelector('#view details.buy-fold[data-bf=seas]');
        return { id: r.id, open: f && f.open, sum: f ? f.querySelector('summary').textContent : null, tag: f ? (f.querySelector('summary .bf-alg') || {}).textContent || '' : '', vis: f ? !!f.querySelector('summary .bf-alg') && f.querySelector('summary .bf-alg').getBoundingClientRect().height > 0 : false, wheat: algLabel('wheat') };
    });
    ok(r && !r.open && r.vis && /⚠/.test(r.tag) && r.tag.includes(r.wheat), 'A6 畳んだ「調味料 ○つ」の行に、アレルゲン（小麦）を含む調味料を ⚠ で出す: ' + JSON.stringify(r));
    await ctx.close();
}

// ---- B 家族のアレルギーの言葉 ----
const famState = (cc, lang, member) => ({ onboarded: true, firstUse: '2026-10-01', settings: { country: cc, uiLang: lang, dishCount: 3, servings: 2, avoid: [] }, family: [Object.assign({ id: 'f1', name: 'A', role: 'adult', avoid: [], allergy: [] }, member || {})] });
const openFam = async p => { await p.evaluate(() => { session.famOpen = 'f1'; setGo('family-profile'); }); await p.waitForTimeout(400); };
// 食べられない食材に入れて ⚠ を付ける（第39回のモニターと同じ道）
const typeAvoidAndMark = async (p, w) => {
    await p.fill('[data-fm=f1] .fam-avoid-input', w); await p.press('[data-fm=f1] .fam-avoid-input', 'Enter'); await p.waitForTimeout(300);
    const v = await p.evaluate(() => { const m = famMembers()[0]; return m.avoid[m.avoid.length - 1]; });
    if (v != null) { await p.evaluate(v => { const b = [...document.querySelectorAll('[data-fm=f1] [data-act=fam-allergy]')].find(e => e.dataset.v === v); if (b) b.click(); }, v); await p.waitForTimeout(300); }
    return p.evaluate(v => { const m = famMembers()[0]; famAlgIds.c = null;
        const chip = [...document.querySelectorAll('[data-fm=f1] [data-act=fam-allergy]')].find(e => e.dataset.v === v);
        return { v, allergy: m.allergy.slice(), ids: famAlgIds(), n: RECIPES.filter(r => isAvoided(r)).length, chipWarn: !!chip && /⚠/.test(chip.textContent) && chip.classList.contains('allergy'), bad: !!document.querySelector('[data-fm=f1] .fam-alg-bad') }; }, v);
};
if (want('B1')){
    const W = [['US', 'en', 'gluten'], ['MX', 'es', 'gluten'], ['PE', 'es', 'gluten'], ['JP', 'ja', 'グルテン'], ['TH', 'th', 'แป้งสาลี'], ['KR', 'ko', '글루텐'], ['CN', 'zh-Hans', '麸质'], ['TW', 'zh-Hant', '麩質'], ['DE', 'de', 'Gluten'], ['US', 'en', 'tree nuts'], ['EG', 'ar', 'حليب']];
    for (const [cc, lang, w] of W){
        const { p, ctx } = await ctxOf({ state: famState(cc, lang) }, 'b1' + cc + w);
        await openFam(p);
        const r = await typeAvoidAndMark(p, w);
        const filters = r.allergy.includes(r.v) && r.n > 0 && r.ids.length > 0 && r.chipWarn;
        const refused = !r.allergy.includes(r.v) && r.bad && !r.chipWarn;
        ok(filters || refused, `B1 ${cc} 「${w}」: ⚠ を付けると料理が外れる（または判定できないと知らせて ⚠ を付けない）: ` + JSON.stringify(r));
        if (/gluten|グルテン|글루텐|麸质|麩質/i.test(w)) ok(r.ids.includes('gluten'), `B1 ${cc} 「${w}」: グルテンを含む穀物として読む: ` + JSON.stringify(r.ids));
        await ctx.close();
    }
}
if (want('B2')){
    // 18言語のよくある言い方（日本の料理で照らす。材料の判定は言語によらない）
    const L = [['ja', 'グルテン', 'gluten'], ['en', 'dairy', 'milk'], ['fr', 'produits laitiers', 'milk'], ['de', 'Weizen', 'wheat'], ['it', 'glutine', 'gluten'], ['es', 'lácteos', 'milk'], ['pt-BR', 'glúten', 'gluten'], ['pl', 'pszenica', 'wheat'],
        ['tr', 'süt ürünleri', 'milk'], ['ar', 'بيض', 'egg'], ['hi', 'गेहूं', 'wheat'], ['zh-Hans', '鸡蛋', 'egg'], ['zh-Hant', '麩質', 'gluten'], ['ko', '유제품', 'milk'], ['th', 'แป้งสาลี', 'wheat'], ['vi', 'đậu nành', 'soy'], ['id', 'kedelai', 'soy'], ['fil', 'itlog', 'egg']];
    const { p, ctx } = await ctxOf({ state: famState('JP', 'ja') }, 'b2');
    const r = await p.evaluate(L => L.map(([lang, w, id]) => { const m = famMembers()[0]; m.avoid = [w]; m.allergy = [w]; famAlgIds.c = null; const ids = famAlgIds(); return { lang, w, id, ids, ok: famAlgWordOk(w), n: RECIPES.filter(r => isAvoided(r)).length }; }), L);
    r.forEach(x => ok(x.ids.includes(x.id) && x.ok && x.n > 0, `B2 ${x.lang} 「${x.w}」→ ${x.id}・料理が外れる: ` + JSON.stringify(x)));
    await ctx.close();
}
if (want('B3')){
    const { p, ctx } = await ctxOf({ state: famState('US', 'en', { avoid: ['Zorblax'], allergy: ['Zorblax'] }) }, 'b3');
    await openFam(p);
    const legacy = await p.evaluate(() => { const c = [...document.querySelectorAll('[data-fm=f1] [data-act=fam-allergy]')].find(e => e.dataset.v === 'Zorblax'); return c ? { warn: /⚠/.test(c.textContent) || c.classList.contains('allergy'), text: c.textContent } : null; });
    ok(legacy && !legacy.warn && /判定|judge|check|recogn/i.test(legacy.text), 'B3 前の版で入った判定できない言葉は ⚠ なしの「判定なし」: ' + JSON.stringify(legacy));
    const has = await p.evaluate(() => !!document.querySelector('[data-fm=f1] form[data-form=fam-add-alg] input'));
    ok(has, 'B3 家族のアレルギーに、入力して足す欄がある');
    if (has){
        await p.fill('[data-fm=f1] form[data-form=fam-add-alg] input', 'glutin-ish'); await p.press('[data-fm=f1] form[data-form=fam-add-alg] input', 'Enter'); await p.waitForTimeout(400);
        const r = await p.evaluate(() => { const m = famMembers()[0], bad = document.querySelector('[data-fm=f1] .fam-alg-bad');
            return { allergy: m.allergy.slice(), msg: bad ? bad.textContent : '', btns: bad ? [...bad.querySelectorAll('button')].map(e => e.dataset.v) : [] }; });
        ok(!r.allergy.includes('glutin-ish') && r.msg && r.btns.length > 0, 'B3 判定できない言葉は入れず、知らせと近いボタンを出す: ' + JSON.stringify(r));
        if (r.btns.length){ await p.click('[data-fm=f1] .fam-alg-bad button'); await p.waitForTimeout(300); }
        const r2 = await p.evaluate(() => { famAlgIds.c = null; return { ids: famAlgIds(), n: RECIPES.filter(r => isAvoided(r)).length }; });
        ok(r2.ids.length > 0 && r2.n > 0, 'B3 近いボタンを押すと、料理が外れる: ' + JSON.stringify(r2));
        await p.fill('[data-fm=f1] form[data-form=fam-add-alg] input', 'gluten'); await p.press('[data-fm=f1] form[data-form=fam-add-alg] input', 'Enter'); await p.waitForTimeout(400);
        const r3 = await p.evaluate(() => { famAlgIds.c = null; return { allergy: famMembers()[0].allergy.slice(), ids: famAlgIds(), bad: !!document.querySelector('[data-fm=f1] .fam-alg-bad') }; });
        ok(r3.allergy.includes('gluten') && r3.ids.includes('gluten') && !r3.bad, 'B3 読める言葉（gluten）は入力で入る: ' + JSON.stringify(r3));
    }
    await ctx.close();
}

// ---- C 家族のアレルギーのボタン ----
if (want('C1')){
    const CCS = ['JP', 'US', 'KR', 'TH', 'FR', 'BR', 'CN', 'DE', 'EG', 'ES', 'GB', 'ID', 'IN', 'IT', 'MX', 'PE', 'PH', 'PL', 'TR', 'TW', 'VN'];
    for (const cc of CCS){
        const { p, ctx } = await ctxOf({ state: famState(cc, 'ja') }, 'c1' + cc);
        await openFam(p);
        const r = await p.evaluate(() => { const w = [...document.querySelectorAll('[data-fm=f1] [data-act=fam-alg-w]')].map(e => e.dataset.v), f = [...document.querySelectorAll('[data-fm=f1] [data-act=fam-alg-fam]')].map(e => e.dataset.v);
            const need = ['kiwi', 'buckwheat', 'sesame', 'gluten', 'peanut', 'soy'].filter(id => !w.includes(ALG_WORD[id])), needF = ['egg', 'dairy', 'wheat', 'fish', 'shellfish', 'nuts'].filter(x => !f.includes(x));
            return { need, needF }; });
        ok(!r.need.length && !r.needF.length, `C1 ${cc}: 家族のアレルギーのボタンに主なアレルゲン（乳製品・グルテンを含む穀物・そば・ごま・キウイほか）がそろう: ` + JSON.stringify(r));
        await ctx.close();
    }
}
if (want('C2')){
    for (const cc of ['US', 'PE']){
        const { p, ctx } = await ctxOf({ state: famState(cc, 'ja') }, 'c2' + cc);
        await openFam(p);
        // 大麦（小麦なし）の料理: 小麦のボタンでは外れない／グルテンを含む穀物のボタンで外れる
        const pre = await p.evaluate(() => {
            const barley = RECIPES.filter(r => (r.items || []).some(i => /barley|cebada|beer|cerveza|malt/i.test((i.key || '') + '|' + (i.en || '') + '|' + (i.name || ''))));
            const only = barley.filter(r => !algSelectedHits(r, ['wheat']).length);
            return { barley: barley.map(r => r.id), only: only.map(r => r.id) };
        });
        if (!pre.barley.length){ console.log(`skip C2 ${cc}: 大麦の料理がない`); await ctx.close(); continue; }
        await p.click('[data-fm=f1] [data-act=fam-alg-fam][data-v=wheat]'); await p.waitForTimeout(300);
        const w = await p.evaluate(ids => { famAlgIds.c = null; return ids.filter(id => isAvoided(byId(id))); }, pre.barley);
        await p.click('[data-fm=f1] [data-act=fam-alg-fam][data-v=wheat]'); await p.waitForTimeout(200);
        const gw = await p.evaluate(() => ALG_WORD.gluten);
        await p.click(`[data-fm=f1] [data-act=fam-alg-w][data-v="${gw}"]`); await p.waitForTimeout(300);
        const g = await p.evaluate(ids => { famAlgIds.c = null; return { ids: famAlgIds(), out: ids.filter(id => isAvoided(byId(id))) }; }, pre.barley);
        ok(g.ids.includes('gluten') && g.out.length === pre.barley.length, `C2 ${cc}: グルテンを含む穀物のボタンで、大麦の料理も外れる: ` + JSON.stringify({ pre, g }));
        if (pre.only.length) ok(pre.only.every(id => !w.includes(id)), `C2 ${cc}: 小麦のボタンだけでは大麦の料理は外れない（グルテンと区別できる）: ` + JSON.stringify({ only: pre.only, w }));
        await ctx.close();
    }
}
if (want('C3')){
    const { p, ctx } = await ctxOf({ state: famState('US', 'en') }, 'c3');
    await p.evaluate(() => { session.famOpen = null; setGo('allergy-card'); }); await p.waitForTimeout(500);
    const has = await p.evaluate(() => { const b = document.querySelector('#allergy-card [data-act=alg-jump][data-v=family-profile]'), r = b && b.getBoundingClientRect(); return !!b && r.top >= 0 && r.bottom <= innerHeight; });
    ok(has, 'C3 アレルギー対策を開いたとき、上に「家族のアレルギーへ」が見える');
    if (has){
        await p.click('#allergy-card [data-act=alg-jump][data-v=family-profile]'); await p.waitForTimeout(900);
        const r = await p.evaluate(() => { const e = document.querySelector('#family-profile'), q = e.getBoundingClientRect(); return { top: Math.round(q.top), vh: innerHeight }; });
        ok(r.top >= -2 && r.top < r.vh / 2, 'C3 「家族のアレルギーへ」で家族のプロフィールが画面の上に: ' + JSON.stringify(r));
        await p.evaluate(() => setGo('allergy-card')); await p.waitForTimeout(500);
        await p.click('#allergy-card [data-act=alg-jump][data-v=food]'); await p.waitForTimeout(700);
        const d = await p.evaluate(() => { const e = document.querySelector('#view .set-panel:not([hidden]) .diet-bundles'); const q = e && e.getBoundingClientRect(); return { panel: (document.querySelector('#view .set-panel:not([hidden])') || {}).dataset.t, vis: !!q && q.top < innerHeight && q.bottom > 0 }; });
        ok(d.panel === 'food' && d.vis, 'C3 「食の決まり…へ」でハラール・ベジタリアンのまとめ選びが見える: ' + JSON.stringify(d));
    }
    await ctx.close();
}

await b.close();
if (errs.length) { console.log('ページのエラー:', errs.slice(0, 5)); fails++; }
console.log(`\nsafe40: ${checks - fails}/${checks} ok${fails ? `（${fails} 件 FAIL）` : ''}`);
process.exit(fails ? 1 : 0);
