#!/usr/bin/env node
// 第39回（オーナー指示「はじめての登録がとても複雑。カスタマイズはあとで。最初は言語・国・どのモードかだけ」）の回帰テスト
//  使い方: node tools/tests/ob39.mjs [http://localhost:9191/]
//  O1 はじめての人: 国と言語（ステップ 1 / 2）→ 使い方（ステップ 2 / 2。ふつうが選ばれている）→「献立を見る」1回で献立。
//     人数2人・品数おまかせ・苦手なし・アレルギーなし・いつも家にある食材なし（日本以外の国も）
//  O2 選んだ使い方が効く（10分以内・いちばん簡単・じっくり → 今日の気分／ダイエット → ダイエットモード）
//  O3 スキップ → ふつうのまま献立へ。もどる → 国の画面 → 同じ国 → 選んだ使い方はそのまま
//  O4 献立の下の小さな案内（アレルギーや苦手な食材…）: お膳の料理・丸い「まるごと入れ替え」に重ならない。「設定」でアレルギー対策が開き、
//     卵を選ぶと、卵を使う料理だけが献立から外れる（ほかの料理は動かない）。設定したあとは案内を出さない。×で閉じると開き直しても出ない
//  O5 前から使っている人（はじめての設定を終えた人・記録がある人）: シートも案内も出ない。設定はそのまま
//  O6 幅 195 / 260 / 390 × 文字3段階: 使い方の画面と案内が画面の中・横にはみ出さない・押せる大きさ
//  O7 18言語: 使い方の画面と案内の字が、どの言語でも画面の外・箱の外にはみ出さない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const CC = {ja: 'JP', en: 'US', fr: 'FR', de: 'DE', it: 'IT', es: 'ES', 'pt-BR': 'BR', pl: 'PL', tr: 'TR', ar: 'EG', hi: 'IN', 'zh-Hans': 'CN', 'zh-Hant': 'TW', ko: 'KR', th: 'TH', vi: 'VN', id: 'ID', fil: 'PH'};
const ctxOf = async (o, tag) => {
    const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, locale: o.locale || 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: !!o.touch });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('ob39', tag)));
    if (o.state) await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, o.state);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, { timeout: 30000 }).catch(() => {});
    await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return { p, ctx };
};
// はじめての人: 国の画面 → 国を選ぶ → 使い方の画面まで
const toMode = async (p, cc) => {
    await p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 });
    await pickCountry(p, cc);
    await p.waitForSelector('#sheet-root [data-act=ob-mode]', { timeout: 30000 }); await p.waitForTimeout(150);
};
const finish = async (p, o = {}) => {
    await p.click('#sheet-root [data-act=ob-done]');
    await p.waitForFunction(() => S.onboarded === true && !sheet && session.menu && document.querySelector('#view .tray'), null, { timeout: 30000 });
    await p.waitForTimeout(400);
    if (o.peek) o.peek.during = await p.evaluate(() => ({ toast: !!document.querySelector('#toast-root .toast'), hint: !!document.querySelector('#view .alg-hint'), ids: session.menu.items.map(x => x.r && x.r.id) }));
    await p.waitForFunction(() => !session.algHintWait, null, { timeout: 20000 }).catch(() => {});   // 「準備ができました」が消えてから案内を出す
    await p.waitForTimeout(200);
};
const modeScreen = p => p.evaluate(() => ({
    prog: (document.querySelector('#sheet-root .ob-count > span') || {}).textContent || '', steps: document.querySelectorAll('#sheet-root .ob-steps li').length,
    modes: [...document.querySelectorAll('#sheet-root [data-act=ob-mode]')].map(e => e.dataset.v), on: [...document.querySelectorAll('#sheet-root [data-act=ob-mode][aria-checked=true]')].map(e => e.dataset.v),
    sv: document.querySelectorAll('#sheet-root [data-act=ob-sv]').length, alg: document.querySelectorAll('#sheet-root [data-act=ob-alg]').length, avoid: document.querySelectorAll('#sheet-root [data-act=ob-avoid]').length,
    count: document.querySelectorAll('#sheet-root [data-act=ob-count]').length, staple: document.querySelectorAll('#sheet-root [data-act=ob-staple]').length,
    done: !!document.querySelector('#sheet-root [data-act=ob-done]'), next: !!document.querySelector('#sheet-root [data-act=ob-next]'), skip: !!document.querySelector('#sheet-root [data-act=ob-skipstep]') }));
const stateOf = p => p.evaluate(() => ({ onb: !!S.onboarded, sv: S.settings.servings, dc: S.settings.dishCount, avoid: S.settings.avoid.length, alg: algIds().length, staples: S.staples.length, mood: session.mood, diet: !!S.settings.diet,
    spots: document.querySelectorAll('#view .tray .spot').length, hint: !!document.querySelector('#view .alg-hint'), sheet: sheet && sheet.kind }));
// 案内の位置: 画面の中・料理と丸いボタンに重ならない・押せる大きさ・横にはみ出さない
const hintGeo = p => p.evaluate(() => {
    const h = document.querySelector('#view .alg-hint'); if (!h) return { none: true };
    const r = h.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    const hit = (a, c) => a.left < c.right - .5 && c.left < a.right - .5 && a.top < c.bottom - .5 && c.top < a.bottom - .5;
    const cover = [...document.querySelectorAll('#view .tray .spot, #view .tray .shuffle, #view .tray [data-act=reroll]')].filter(e => hit(r, e.getBoundingClientRect())).map(e => e.className);
    const btns = [...h.querySelectorAll('button')].map(e => { const q = e.getBoundingClientRect(); return { w: Math.round(q.width), h: Math.round(q.height), out: q.left < -.5 || q.right > vw + .5 }; });
    const tx = h.querySelector('.ah-tx'), txOver = tx.scrollWidth > tx.clientWidth + 1;
    return { cover, btns, out: r.left < -.5 || r.right > vw + .5, sw: document.documentElement.scrollWidth > vw + 1, txOver, inTray: !!h.closest('.tray') };
});

// ---- O1 はじめての人: 2つの画面で献立へ ----
if (want('O1')) for (const [cc, locale] of [['JP', 'ja-JP'], ['US', 'en-US'], ['KR', 'ko-KR']]){
    const { p, ctx } = await ctxOf({ locale }, 'o1' + cc);
    await p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 });
    const c1 = await p.evaluate(() => ({ prog: (document.querySelector('#sheet-root .ob-count > span') || {}).textContent || '', steps: document.querySelectorAll('#sheet-root .ob-steps li').length, lang: !!document.querySelector('#sheet-root select[data-ob=lang]') }));
    ok(c1.steps === 2 && /1/.test(c1.prog) && /2/.test(c1.prog) && c1.lang, `O1 ${cc}: 1つめは国と言語（1/2・言語も選べる）: ` + JSON.stringify(c1));
    await toMode(p, cc);
    const m = await modeScreen(p);
    ok(m.steps === 2 && /2.*2/.test(m.prog), `O1 ${cc}: 2つめは 2/2: ` + JSON.stringify(m));
    ok(['all', 'ten', 'simple', 'slow', 'diet'].every(k => m.modes.includes(k)) && JSON.stringify(m.on) === '["all"]', `O1 ${cc}: 使い方の画面に ふつう・10分以内・いちばん簡単・じっくり・ダイエット。ふつうが選ばれている: ` + JSON.stringify(m));
    ok(!m.sv && !m.alg && !m.avoid && !m.count && !m.staple && m.done && !m.next && m.skip, `O1 ${cc}: 人数・品数・苦手・アレルギー・家にある食材は聞かない。「献立を見る」1つで終わる: ` + JSON.stringify(m));
    const peek = {}; await finish(p, { peek });
    const s = await stateOf(p);
    const ids1 = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
    ok(peek.during && (!peek.during.toast || !peek.during.hint) && JSON.stringify(peek.during.ids) === JSON.stringify(ids1), `O1 ${cc}: 「準備ができました」のあいだは案内を出さず、消えてから出す。そのとき献立は変わらない: ` + JSON.stringify(peek.during));
    ok(s.onb && s.sv === 2 && s.dc === 'auto' && !s.avoid && !s.alg && !s.staples && s.mood === 'all' && !s.diet && s.spots > 0 && !s.sheet, `O1 ${cc}: 献立が出る。人数2人・品数おまかせ・苦手/アレルギー/家にある食材なし・ふつう: ` + JSON.stringify(s));
    ok(s.hint, `O1 ${cc}: 献立の下にアレルギー・苦手の案内が出る`);
    // 開き直しても、はじめての画面は出ない（案内は閉じるまで出る）
    await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, { timeout: 30000 }); await p.waitForTimeout(400);
    const s2 = await stateOf(p);
    ok(!s2.sheet && s2.onb && s2.hint, `O1 ${cc}: 開き直してもはじめての画面は出ず、案内は残る: ` + JSON.stringify(s2));
    await ctx.close();
}

// ---- O2 選んだ使い方が効く ----
if (want('O2')) for (const k of ['ten', 'simple', 'slow', 'diet']){
    const { p, ctx } = await ctxOf({}, 'o2' + k);
    await toMode(p, 'JP');
    await p.click(`#sheet-root [data-act=ob-mode][data-v=${k}]`); await p.waitForTimeout(150);
    const on = await p.evaluate(() => [...document.querySelectorAll('#sheet-root [data-act=ob-mode][aria-checked=true]')].map(e => e.dataset.v));
    ok(JSON.stringify(on) === JSON.stringify([k]), `O2 ${k}: 押した1つだけが選ばれる: ` + on);
    await finish(p);
    const s = await p.evaluate(() => ({ mood: session.mood, diet: !!S.settings.diet, main: session.menu.items[0] && session.menu.items[0].r && session.menu.items[0].r.id,
        fit: session.menu.items.every(x => !x.r || slotMoodOk(x.r, x.slot) || !['ten', 'simple'].includes(session.mood)), draftMood: S.draft && S.draft.mood }));
    if (k === 'diet') ok(s.diet && s.mood === 'all', `O2 ダイエット: ダイエットモードがオン・気分はおまかせのまま: ` + JSON.stringify(s));
    else ok(s.mood === k && !s.diet && s.fit, `O2 ${k}: 今日の気分が ${k} になり、献立がその条件で出る: ` + JSON.stringify(s));
    if (k !== 'diet'){   // 開き直しても、今日は選んだ使い方のまま（下書き）
        await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, { timeout: 30000 }); await p.waitForTimeout(300);
        const m2 = await p.evaluate(() => session.mood);
        ok(m2 === k, `O2 ${k}: 開き直しても今日の気分は ${k}: ` + m2);
    }
    await ctx.close();
}

// ---- O3 スキップ・もどる ----
if (want('O3')){
    {
        const { p, ctx } = await ctxOf({}, 'o3skip');
        await toMode(p, 'JP');
        await p.click('#sheet-root [data-act=ob-mode][data-v=ten]');
        await p.click('#sheet-root [data-act=ob-skipstep]');
        await p.waitForFunction(() => S.onboarded === true && !sheet, null, { timeout: 30000 }); await p.waitForTimeout(300);
        const s = await stateOf(p);
        ok(s.onb && s.mood === 'all' && s.sv === 2 && s.dc === 'auto' && s.spots > 0, 'O3 スキップ: 選びかけた使い方は使わず、ふつうのまま献立へ: ' + JSON.stringify(s));
        await ctx.close();
    }
    {
        const { p, ctx } = await ctxOf({}, 'o3back');
        await toMode(p, 'JP');
        await p.click('#sheet-root [data-act=ob-mode][data-v=simple]');
        await p.click('#sheet-root [data-act=ob-back]'); await p.waitForTimeout(200);
        const k1 = await p.evaluate(() => sheet && sheet.kind);
        ok(k1 === 'country', 'O3 もどる: 国と言語の画面へ: ' + k1);
        await pickCountry(p, 'JP'); await p.waitForSelector('#sheet-root [data-act=ob-mode]'); await p.waitForTimeout(150);
        const on = await p.evaluate(() => [...document.querySelectorAll('#sheet-root [data-act=ob-mode][aria-checked=true]')].map(e => e.dataset.v));
        ok(JSON.stringify(on) === '["simple"]', 'O3 もどって同じ国を選ぶと、選んだ使い方はそのまま: ' + on);
        await finish(p);
        ok(await p.evaluate(() => session.mood) === 'simple', 'O3 もどったあとも、選んだ使い方が効く');
        await ctx.close();
    }
}

// ---- O4 アレルギー・苦手の案内 ----
if (want('O4')){
    {
        const { p, ctx } = await ctxOf({}, 'o4');
        await toMode(p, 'JP'); await finish(p);
        const g = await hintGeo(p);
        ok(!g.none && !g.cover.length && !g.inTray && !g.out && !g.sw && g.btns.every(x => x.h >= 40 && !x.out), 'O4 390px: 案内はお膳の外で、料理・丸いボタンに重ならず、押せる: ' + JSON.stringify(g));
        // 主菜を卵の料理にしておく（ほかの料理は卵を使わない料理に）→ 案内の「設定」→ 卵 → 主菜だけ替わる
        const pre = await p.evaluate(() => {
            const egg = r => { const a0 = S.settings.allergens; S.settings.allergens = ['egg']; try{ return !!allergyConflict(r); } finally { S.settings.allergens = a0; } };
            const it = session.menu.items, m0 = it[0].r;
            const e = RECIPES.find(r => !r.pack && r.type === m0.type && egg(r) && slotOf(r) === slotOf(m0) && r.id !== m0.id);
            if (!e) return null;
            for (let i = 1; i < it.length; i++) if (it[i].r && egg(it[i].r)){ const alt = RECIPES.find(r => !r.pack && slotOf(r) === slotOf(it[i].r) && r.type === it[i].r.type && !egg(r) && !it.some(x => x.r && x.r.id === r.id)); if (alt) it[i].r = alt; }
            it[0].r = e; keepDraft(); render();
            return { main: e.id, others: it.slice(1).map(x => x.r && x.r.id), eggOthers: it.slice(1).filter(x => x.r && egg(x.r)).length };
        });
        ok(pre && !pre.eggOthers, 'O4 前提: 主菜を卵の料理に・ほかは卵なし: ' + JSON.stringify(pre));
        await p.click('#view [data-act=alg-hint-open]');
        await p.waitForFunction(() => tab === 'settings', null, { timeout: 10000 }); await p.waitForTimeout(500);
        const st = await p.evaluate(() => { const c = document.querySelector('#allergy-card'), r = c && c.getBoundingClientRect(); return { tab, card: !!c && r.height > 0 && r.top < innerHeight && r.bottom > 0, setTab: session.setTab, algHint: !!S.algHint }; });
        ok(st.tab === 'settings' && st.card && st.setTab === 'family' && !st.algHint, 'O4 「設定」→ 設定の家族・アレルギーのタブの「アレルギー対策」が見える: ' + JSON.stringify(st));
        await p.click('#allergy-card [data-act=alg-toggle][data-v=egg]'); await p.waitForTimeout(500);
        const after = await p.evaluate(() => ({ alg: algIds(), ids: session.menu.items.map(x => x.r && x.r.id), bad: session.menu.items.filter(x => x.r && allergyConflict(x.r)).map(x => x.r.id) }));
        ok(after.alg.includes('egg') && !after.bad.length && pre && after.ids[0] !== pre.main, 'O4 卵を選ぶと、卵を使う主菜が献立から外れる: ' + JSON.stringify(after));
        ok(pre && JSON.stringify(after.ids.slice(1)) === JSON.stringify(pre.others), 'O4 押していない料理（卵を使わない料理）は動かない: ' + JSON.stringify([pre && pre.others, after.ids.slice(1)]));
        await p.evaluate(() => setTab('today')); await p.waitForTimeout(300);
        ok(!(await p.evaluate(() => !!document.querySelector('#view .alg-hint'))), 'O4 設定したあとは案内を出さない');
        await ctx.close();
    }
    {   // ×で閉じる → 開き直しても出ない。献立は変わらない
        const { p, ctx } = await ctxOf({}, 'o4x');
        await toMode(p, 'JP'); await finish(p);
        const ids0 = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
        await p.click('#view [data-act=alg-hint-close]'); await p.waitForTimeout(300);
        const r = await p.evaluate(() => ({ hint: !!document.querySelector('#view .alg-hint'), ids: session.menu.items.map(x => x.r && x.r.id), tab }));
        ok(!r.hint && r.tab === 'today' && JSON.stringify(r.ids) === JSON.stringify(ids0), 'O4 ×で閉じると案内が消え、献立はそのまま: ' + JSON.stringify(r));
        await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view .tray'), null, { timeout: 30000 }); await p.waitForTimeout(300);
        ok(!(await p.evaluate(() => !!document.querySelector('#view .alg-hint'))), 'O4 閉じた案内は、開き直しても出ない');
        await ctx.close();
    }
}

// ---- O5 前から使っている人 ----
if (want('O5')){
    for (const [label, st] of [
        ['設定を終えた人', { onboarded: true, firstUse: '2026-10-01', settings: { country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3, avoid: ['豚肉'], allergens: ['egg'] }, staples: ['米'] }],
        ['設定を終えた人（アレルギーなし）', { onboarded: true, firstUse: '2026-10-01', settings: { country: 'US', uiLang: 'en', dishCount: 'auto', servings: 2, avoid: [] } }],
        ['記録がある古い人', { onboarded: false, firstUse: '2026-09-01', history: [{ id: 'nikujaga', d: '2026-10-01' }], settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 4, avoid: [] } }],
    ]){
        const { p, ctx } = await ctxOf({ state: st }, 'o5' + label);
        await p.waitForFunction(() => document.querySelector('#view .tray'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(500);
        const s = await p.evaluate(() => ({ sheet: sheet && sheet.kind, hint: !!document.querySelector('#view .alg-hint'), algHint: 'algHint' in S, sv: S.settings.servings, dc: S.settings.dishCount, avoid: S.settings.avoid, alg: algIds(), staples: S.staples, mood: session.mood }));
        ok(!s.sheet && !s.hint && !s.algHint && s.sv === st.settings.servings && s.dc === st.settings.dishCount && JSON.stringify(s.avoid) === JSON.stringify(st.settings.avoid) && JSON.stringify(s.alg) === JSON.stringify(st.settings.allergens || []) && JSON.stringify(s.staples) === JSON.stringify(st.staples || []) && s.mood === 'all',
            `O5 ${label}: はじめての画面も案内も出ない。設定はそのまま: ` + JSON.stringify(s));
        await ctx.close();
    }
    // 設定の「はじめての設定をもう一度」: 選び直さなければ、気分・献立は変えない
    {
        const { p, ctx } = await ctxOf({ state: { onboarded: true, firstUse: '2026-10-01', settings: { country: 'JP', uiLang: 'ja', dishCount: 3, servings: 3, avoid: [] } } }, 'o5again');
        await p.waitForFunction(() => document.querySelector('#view .tray'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(300);
        const r = await p.evaluate(async () => { session.mood = '和'; newMenu(); render(); const ids0 = session.menu.items.map(x => x.r && x.r.id); startOnboard(); await __tick(); const on = [...document.querySelectorAll('#sheet-root [data-act=ob-mode][aria-checked=true]')].map(e => e.dataset.v);
            document.querySelector('#sheet-root [data-act=ob-done]').click(); await __tick(); return { on, mood: session.mood, same: JSON.stringify(ids0) === JSON.stringify(session.menu.items.map(x => x.r && x.r.id)), sv: S.settings.servings, dc: S.settings.dishCount, hint: !!S.algHint }; });
        ok(r.mood === '和' && r.same && r.sv === 3 && r.dc === 3 && !r.hint, 'O5 はじめての設定をもう一度 → そのまま「献立を見る」: 気分・献立・人数・品数は変わらず、案内も出さない: ' + JSON.stringify(r));
        await ctx.close();
    }
}

// ---- O6 幅 × 文字の大きさ ----
if (want('O6')){
    const bad = []; let n = 0;
    for (const w of [195, 260, 390]) for (const ts of [0, 1, 2]){
        const { p, ctx } = await ctxOf({ w, h: w < 300 ? 422 : 844, touch: true }, `o6-${w}-${ts}`);
        await p.waitForSelector('#sheet-root [data-act=cc-choose]', { timeout: 30000 });
        await p.evaluate(ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); }, ts);
        await pickCountry(p, 'JP'); await p.waitForSelector('#sheet-root [data-act=ob-mode]'); await p.waitForTimeout(300);
        const m = await p.evaluate(() => {
            const vw = document.documentElement.clientWidth, sh = document.querySelector('#sheet-root .sheet'), foot = sh.querySelector('.ob-actions').getBoundingClientRect(), out = [];
            const rows = [...sh.querySelectorAll('[data-act=ob-mode]')];
            rows.forEach(e => { const r = e.getBoundingClientRect(); if (r.left < -.5 || r.right > vw + .5) out.push('外:' + e.dataset.v); if (e.scrollWidth > e.clientWidth + 1) out.push('はみ出し:' + e.dataset.v); if (r.height < 44) out.push('低い:' + e.dataset.v); });
            sh.querySelectorAll('.ob-actions .btn, .ob-count > span, .ob-skip, h2').forEach(e => { const r = e.getBoundingClientRect(); if (r.left < -.5 || r.right > vw + .5 || e.scrollWidth > e.clientWidth + 1) out.push('外:' + e.textContent.trim().slice(0, 12)); });
            const r0 = rows[0].getBoundingClientRect(), h2 = sh.querySelector('h2').getBoundingClientRect();
            return { out, firstAbove: r0.bottom <= foot.top + .5 && h2.top >= 0, sw: document.documentElement.scrollWidth > vw + 1 || sh.scrollWidth > sh.clientWidth + 1 };
        });
        n++; if (m.out.length || !m.firstAbove || m.sw) bad.push(`${w}px 文字${ts} 使い方: ` + JSON.stringify(m));
        await finish(p);
        await p.evaluate(() => { const h = document.querySelector('#view .alg-hint'); if (h) h.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200);
        const g = await hintGeo(p);
        n++; if (g.none || g.cover.length || g.inTray || g.out || g.sw || g.txOver || !g.btns.every(x => x.h >= 40 && x.w >= 40 && !x.out)) bad.push(`${w}px 文字${ts} 案内: ` + JSON.stringify(g));
        await ctx.close();
    }
    ok(n === 18 && !bad.length, `O6 幅195/260/390 × 文字3段階（${n}画面）: 使い方の行と下の帯が画面の中・1つめの行が帯より上・案内はお膳に重ならず押せる: ` + bad.slice(0, 3).join(' / '));
}

// ---- O7 18言語 ----
if (want('O7')){
    const bad = []; let n = 0;
    for (const lang of Object.keys(CC)) for (const w of [195, 390]){
        const { p, ctx } = await ctxOf({ w, h: w < 300 ? 422 : 844, state: { onboarded: false, firstUse: '2026-10-01', settings: { country: CC[lang], uiLang: lang, dishCount: 'auto', servings: 2 } } }, `o7-${lang}-${w}`);
        await p.waitForSelector('#sheet-root [data-act=ob-mode]', { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(300);
        const m = await p.evaluate(() => {
            const vw = document.documentElement.clientWidth, sh = document.querySelector('#sheet-root .sheet'); if (!sh) return { none: true };
            const out = [];
            sh.querySelectorAll('[data-act=ob-mode], [data-act=ob-mode] b, [data-act=ob-mode] .om-t > span, .ob-actions .btn, .ob-count > span, .ob-skip, .ob-steps li, h2, p').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.left < -.5 || r.right > vw + .5 || e.scrollWidth > e.clientWidth + 1)) out.push(e.textContent.trim().slice(0, 16)); });
            const jp = /[ぁ-ん]/.test(sh.innerText) && LANG !== 'ja';
            return { out, jp, lang: LANG, n: sh.querySelectorAll('[data-act=ob-mode]').length, sw: document.documentElement.scrollWidth > vw + 1 };
        });
        n++; if (m.none || m.out.length || m.jp || m.n < 5 || m.sw) bad.push(`${lang} ${w}px 使い方: ` + JSON.stringify(m));
        if (!m.none){
            await finish(p).catch(() => {});
            await p.evaluate(() => { const h = document.querySelector('#view .alg-hint'); if (h) h.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200);
            const g = await hintGeo(p);
            const jp = await p.evaluate(() => { const h = document.querySelector('#view .alg-hint'); return !!h && LANG !== 'ja' && /[ぁ-ん]/.test(h.innerText); });
            n++; if (g.none || g.cover.length || g.out || g.sw || g.txOver || jp || !g.btns.every(x => x.h >= 40 && !x.out)) bad.push(`${lang} ${w}px 案内: ` + JSON.stringify({ ...g, jp }));
        }
        await ctx.close();
    }
    ok(n === 72 && !bad.length, `O7 18言語 × 幅195/390（${n}画面）: 使い方の画面と案内の字が訳されていて、画面・箱の外にはみ出さない: ` + bad.slice(0, 4).join(' / '));
}

ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`ob39: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
