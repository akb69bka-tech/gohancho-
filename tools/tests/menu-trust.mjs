#!/usr/bin/env node
// 「今日の献立」を信頼できるかの回帰テスト（Playwright。使い方: node tools/tests/menu-trust.mjs [http://localhost:8765/]）
// モニター第1回（佐々木・田村）の指摘と、鷹野の quickfix H1〜H8 の再発を防ぐ:
//  1) 設定を変える → 今日の献立を見ずに開き直す: 苦手・アレルギーに当たる下書きが戻らない（はじめての設定の「アレルギー対策へ」・設定の苦手）
//  2) 決めたあとにアレルゲンを足す: 決めた献立は黙って替わらない（今日・作り方の両方で同じ）。合わない料理に［かえる］［このまま］が出て、
//     ［かえる］はその1品だけ替える（ほかの料理・記録の整合）。開き直しても同じ
//  3) まだ決めていない案にアレルゲンを足す: 当たった枠だけ替わり、何を替えたかを知らせる
//  4) 決めたあとに気分（おかゆの日）・品数・まるごと入れ替え: 確認なしに作り直さない。やめると元のまま、作り直すと「元に戻す」で戻せる
//     案2: 気分・品数は［今日の一膳を作り直す］［明日から］を選ぶ。明日からは S.day[明日].mood / S.settings.pending に入り、知らせの「元に戻す」・［取り消す］で戻せる
//  4b) 明日からにした品数・気分は午前4時に効く（applyPending）。決定を取り消して今日の品数を変えたら、前の pending は残らない
//  4c) 明日の一膳を先に決めてあれば、今日の操作では変わらず、次の日にそのまま今日の決めた献立になる
//  5) 入れない材料（ちらし寿司のむきえび）は、作り方の文からも外す
//  6) ちくわ・ワンタンの皮など卵が入っていることがある加工品: 料理は外さず、詳細に注意を出す
//  7) 家族のアレルギーは1回押すだけで登録される（以前の「食べられない食材 → ⚠」も使える）
//  8) 「卵」を卵アレルギーでさがして0件のとき、理由を出す
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, rngScript, seedFor } = require('../lib/pw.cjs'); let seedN = 0;   // 乱数は SEED から（失敗したら表示の SEED=… を付けて実行すると同じ献立で再現する）
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
// 古い版のアプリをキャッシュから出さないように、Service Worker は止める（ここで確かめたいのは配信中の index.html）
async function open(store, fresh = false){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', serviceWorkers: 'block' });
    await ctx.addInitScript(rngScript(seedFor('menu-trust', String(++seedN))));
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    if (!fresh) await p.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: {country: 'JP', dishCount: 3}}, st))); } }, store || {});
    await p.goto(URL_);
    if (!fresh) await booted(p);
    return { ctx, p };
}
const booted = p => p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && !!session.menu, null, { timeout: 30000 });
const openMood = p => p.evaluate(() => { if (typeof openCondSheet === 'function') openCondSheet(); document.querySelectorAll('details').forEach(d => { if (d.querySelector('[data-act="mood"]')) d.open = true; }); });   // 案2: 気分は条件シートの中
// 固定の待ち時間ではなく、画面・状態がそうなるまで待つ（負荷が高くても遅れるだけで落ちない）。待ちきれなくても続け、あとの ok() で判定する
const until = (p, fn, arg) => p.waitForFunction(fn, arg, { timeout: 15000 }).then(() => true, () => false);
// 「決める」のあと 350ms は次のタップを受けつけない（tapGuard）。それが明けるまで待つ（速いマシンで次のクリックが捨てられないように）
const afterDecide = p => until(p, () => !!(S.cook && S.cook.d === TODAY) && Date.now() >= tapGuard);
// いまの献立の枠のうち、アレルゲン al を足したら当たる枠の番号（設定は元に戻す）。献立はランダムなので、主菜以外が当たることもある
const hitSlots = (p, al) => p.evaluate(al => { const a0 = S.settings.allergens; S.settings.allergens = [...(a0 || []), al]; const h = session.menu.items.map((x, i) => x.r && isAvoidedCore(x.r) ? i : -1).filter(i => i >= 0); S.settings.allergens = a0; return h; }, al);

// ---------- 1) 設定を変える → 開き直す ----------
for (const k of [0, 1, 2]){
    // はじめての設定で えび → 「アレルギー対策へ」（設定のタブへ移る）→ 開き直す
    const { ctx, p } = await open(null, true);
    await p.waitForSelector('[data-act="pick-country"][data-cc="JP"]', { timeout: 30000 });
    await p.click('[data-act="pick-country"][data-cc="JP"]');
    // 苦手な食材の画面が出るまで「次へ」（はじめての流れの段の数が変わっても動くように）
    await p.waitForSelector('[data-act="ob-next"]');
    for (let s = 0; s < 4 && !(await p.$('[data-act="ob-avoid"][data-v="えび"]')); s++){ const nx = await p.$('[data-act="ob-next"]'); if (!nx) break; const st = await p.evaluate(() => sheet && sheet.step); await p.click('[data-act="ob-next"]'); /* 手に持った要素は描き直しで外れることがあるので、押すときに探し直す */ await until(p, st => !sheet || sheet.step !== st, st); }
    await p.evaluate(() => { session.menu.items[0].r = byId('ebifry'); keepDraft(); });   // 設定の後ろの案（と下書き）がえびフライ
    await p.click('[data-act="ob-avoid"][data-v="えび"]');
    await p.click('[data-act="ob-allergy"]'); await until(p, () => tab === 'settings' && !sheet);
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
    // 主菜がえびの料理の献立に決める。ほかの枠はえびに当たらない料理にしておく（献立はランダムで、汁ものにトムヤムクンなどが来ると「その1品だけ」の確かめにならない）
    await p.evaluate(() => { const m = session.menu; m.items[0].r = byId('ebifry'); const a0 = S.settings.allergens; S.settings.allergens = [...(a0 || []), 'shrimp'];
        m.items.forEach((x, i) => { if (i > 0 && x.r && isAvoidedCore(x.r)) x.r = suggestOrAny(x.slot, m.items.filter((_, k) => k !== i), m.items[0].r); });
        S.settings.allergens = a0; render(); });
    await p.click('[data-act="decide"]'); await afterDecide(p);
    const decided = await p.evaluate(() => S.cook.ids.slice());
    await p.evaluate(() => setTab('settings'));
    await p.click('#allergy-card .chip[data-v="shrimp"]'); await until(p, () => algIds().includes('shrimp'));
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
    await p.click('.cook-warn [data-act="cook-swap"][data-id="ebifry"]'); await until(p, () => !S.cook.ids.includes('ebifry'));
    const r3 = await p.evaluate(() => ({ ids: menuIds(), cook: S.cook.ids.slice(), hist: S.history.filter(h => h.d === TODAY).map(h => h.id), bad: S.cook.ids.filter(id => isAvoidedCore(byId(id))), warn: !!document.querySelector('.cook-warn') }));
    ok(r3.cook[0] !== 'ebifry' && JSON.stringify(r3.cook.slice(1)) === JSON.stringify(decided.slice(1)), '［かえる］: 当たった1品だけ替わる ' + JSON.stringify(r3.cook));
    ok(JSON.stringify(r3.ids) === JSON.stringify(r3.cook) && !r3.bad.length && !r3.warn, '［かえる］: 今日の画面と決めた献立がそろい、知らせが消える');
    ok(!r3.hist.includes('ebifry') && r3.hist.includes(r3.cook[0]), '［かえる］: 記録も替えた料理になる ' + JSON.stringify(r3.hist));
    // ［このまま］: 知らせを消す（料理はそのまま）。決めた料理のどれかに当たるアレルゲンを選ぶ（まず卵。献立はランダムなので、当たらなければ次のアレルゲン）。
    // 以前は卵に当たる料理がないとこの点検を飛ばしていて、実行ごとに点検の数が 96 と 97 で揺れていた
    const hit = await p.evaluate(() => { for (const a of ['egg', ...Object.keys(ALG_DEF)]){ S.settings.allergens = [a]; const id = S.cook.ids.find(id => isAvoidedCore(byId(id))); if (id){ save(); setTab('today'); return { a, id }; } } return null; });
    ok(!!hit, '［このまま］: 決めた料理に当たるアレルゲンがある（点検の前提） ' + JSON.stringify(hit));
    if (hit){
        await p.click(`.cook-warn [data-act="cook-keep"][data-id="${hit.id}"]`); await until(p, id => (S.cook.keep || []).includes(id), hit.id);
        const r4 = await p.evaluate(id => ({ still: S.cook.ids.includes(id), warn: !!document.querySelector(`.cook-warn [data-id="${id}"]`) }), hit.id);
        ok(r4.still && !r4.warn, '［このまま］: 料理は替えず、知らせを消す ' + JSON.stringify(Object.assign(r4, hit)));
    }
    await ctx.close();
}
{
    // まだ決めていない案: 当たった枠だけ替わり、何を替えたかを知らせる
    const { ctx, p } = await open({});
    // 献立はランダムなので、主菜のえびフライのほかに汁もの（トムヤムクンなど）も当たることがある。当たる枠は足す前に数えておき、その枠だけが替わることを確かめる。
    // 空の枠（汁けの多い主菜のときの汁もの）は null のまま。下書きは枠ごとに持つので、null も含めて比べる（menuIds() は空の枠を詰めるので比べられない）
    await p.evaluate(() => { setTab('today'); session.menu.items[0].r = byId('ebifry'); keepDraft(); render(); });
    const before = await p.evaluate(() => session.menu.items.map(x => ({ id: x.r ? x.r.id : null, name: x.r ? x.r.name : '' })));
    const hits = await hitSlots(p, 'shrimp');
    await p.evaluate(() => setTab('settings'));
    await p.click('#allergy-card .chip[data-v="shrimp"]'); await until(p, () => algIds().includes('shrimp') && !!document.querySelector('#toast-root .toast'));
    const r = await p.evaluate(() => ({ slots: session.menu.items.map(x => x.r ? x.r.id : null), bad: session.menu.items.filter(x => x.r && isAvoidedCore(x.r)).map(x => x.r.id), toast: (document.querySelector('#toast-root') || {}).innerText || '', draft: S.draft.ids }));
    ok(hits.includes(0) && r.slots[0] !== 'ebifry' && !r.bad.length && r.slots.every((id, i) => hits.includes(i) ? id !== before[i].id : id === before[i].id),
        'まだ決めていない案: 当たった枠だけ替わる ' + JSON.stringify(before.map(x => x.id)) + ' 当たる枠 ' + JSON.stringify(hits) + ' → ' + JSON.stringify(r.slots));
    ok(hits.every(i => r.toast.includes(before[i].name)), 'まだ決めていない案: 何を替えたかを知らせる: ' + r.toast);
    ok(JSON.stringify(r.draft) === JSON.stringify(r.slots), 'まだ決めていない案: 下書きもその場で書き直す ' + JSON.stringify(r.draft) + ' / ' + JSON.stringify(r.slots));
    await ctx.close();
}

// ---------- 4) 決めたあとに気分・品数・まるごと入れ替え ----------
{
    const { ctx, p } = await open({});
    await p.evaluate(() => setTab('today'));
    await p.click('[data-act="decide"]'); await afterDecide(p);
    await p.evaluate(() => setTab('today'));
    const decided = await p.evaluate(() => S.cook.ids.slice());
    // 案2（設計書 §7-1・北条）: 決めた一膳があるときの気分・品数は、黙って明日に回さない。［今日の一膳を作り直す］［明日から］を本人が選ぶ
    for (const [name, sel, kind] of [['気分（おかゆの日）', '[data-act="mood"][data-k="okayu"]', 'mood'], ['品数', '[data-act="count"][data-v="4"]', 'count']]){
        const st = () => p.evaluate(() => { const r = S.day[addDays(TODAY, 1)] || {}; return { ids: menuIds(), cook: S.cook ? S.cook.ids.slice() : null, mood: session.mood, dc: S.settings.dishCount, tmood: r.mood || null, pending: S.settings.pending || null, sheet: sheet && sheet.kind }; });
        const press = async () => { await openMood(p); const btn = p.locator(sel).first(); await btn.evaluate(e => e.scrollIntoView({block: 'center'})); await btn.click({timeout: 5000}).catch(() => btn.evaluate(e => e.click()));   /* 時計を止めているので、重いときにシートが「動いている」と見られて押せないことがある。そのときは要素を直接押す */ await until(p, () => !!document.querySelector('[data-act="later-today"]')); };
        const same = (r, m) => JSON.stringify(r.ids) === JSON.stringify(decided) && JSON.stringify(r.cook) === JSON.stringify(decided) && r.mood !== 'okayu' && String(r.dc) === '3' && (m || (!r.tmood && !r.pending));
        // 押すと確かめる（まだ何も変えない）
        await press();
        const ask = await p.evaluate(() => ({ today: !!document.querySelector('[data-act="later-today"]'), later: !!document.querySelector('[data-act="later-tomorrow"]'), close: !!document.querySelector('.sheet [data-act="sheet-close"]'), txt: (document.querySelector('.sheet') || {}).innerText || '' }));
        const a = await st();
        ok(ask.today && ask.later && ask.close && /今日|明日/.test(ask.txt) && same(a), name + ': 決めた一膳があるときは［今日の一膳を作り直す］［明日から］を聞き、まだ何も変えない ' + JSON.stringify(Object.assign(a, ask, { txt: ask.txt.slice(0, 40) })));
        // やめる: 今日も明日も元のまま
        await p.click('.sheet [data-act="sheet-close"]'); await until(p, () => !sheet);
        const k = await st();
        ok(same(k) && !k.sheet, name + ': 「やめる」で今日も明日も元のまま ' + JSON.stringify(k));
        // 明日から: 今日の決めた一膳はそのまま。明日の分だけが入る（気分は S.day[明日].mood、品数は S.settings.pending）。知らせに「元に戻す」
        await press(); await p.click('[data-act="later-tomorrow"]'); await until(p, () => !sheet && !!document.querySelector('#toast-root [data-act="toast-undo"]'));
        const l = await st(), msg = await p.evaluate(() => document.querySelector('#toast-root').textContent);
        const tom = await p.evaluate(() => addDays(TODAY, 1));
        ok(same(l, true) && /明日/.test(msg) && /元に戻す/.test(msg), name + ': 明日から: 今日の決めた一膳はそのまま、知らせに「元に戻す」 ' + JSON.stringify(l) + ' ' + msg);
        if (kind === 'mood') ok(l.tmood === 'okayu' && !l.pending, name + ': 明日から: 明日の気分（S.day[明日].mood）だけが入り、品数は変えない ' + JSON.stringify(l));
        else ok(l.pending && l.pending.d === tom && String(l.pending.dishCount) === '4' && !l.tmood, name + ': 明日から: S.settings.pending に明日の日付と品数だけが入り、気分は変えない ' + JSON.stringify(l));
        // 知らせの「元に戻す」で明日からも取り消す
        await p.click('#toast-root [data-act="toast-undo"]'); await until(p, () => !toast.undo);
        const u = await st();
        ok(same(u), name + ': 明日からの知らせの「元に戻す」で、明日の分も取り消す ' + JSON.stringify(u));
        // もう一度明日からにすると、画面の品数・気分は今日のまま、条件シート（品数は設定にも）に明日の分が1行で出る。［取り消す］で明日からをやめる
        await press(); await p.click('[data-act="later-tomorrow"]'); await until(p, () => !sheet);
        await openMood(p); await until(p, () => !!document.querySelector('.sheet .pending-note'));
        const note = await p.evaluate(kind => { const c = document.querySelector(`.sheet .pending-note[data-pending="${kind}"]`), cond = c ? c.textContent : ''; closeSheet(); setTab('settings');
            const n = document.querySelector('#view .pending-note[data-pending="count"]'); for (let d = n; d; d = d.parentElement) if (d.tagName === 'DETAILS') d.open = true;
            const on = [...document.querySelectorAll('#view [data-act="count"][aria-pressed="true"]')].map(x => x.dataset.v); return { cond, set: n ? n.textContent : '', on }; }, kind);
        // 画面の品数は、ご飯の席も1品と数える（基準書 7章 4A）。値 4（おかず4）は、ご飯のある日本では「5品」と出る
        const want4 = await p.evaluate(() => shapeName(4));
        if (kind === 'count') ok(note.set.includes('明日から' + want4) && note.cond.includes('明日から' + want4) && JSON.stringify(note.on) === '["3"]', name + ': 設定と条件シートに「明日から' + want4 + '」と出る（いまの品数は3のまま） ' + JSON.stringify(note));
        else ok(/おかゆの日/.test(note.cond) && !note.set, name + ': 条件シートに明日の気分が出る ' + JSON.stringify(note));
        if (kind === 'count') await p.click('#view .pending-note [data-act="pending-cancel"]');
        else { await p.evaluate(() => setTab('today')); await openMood(p); await p.click('.sheet .pending-note [data-act="pending-cancel"]'); }
        await until(p, () => !S.settings.pending && !(S.day[addDays(TODAY, 1)] || {}).mood);
        await p.evaluate(() => { closeSheet(); setTab('today'); });
        const c2 = await st();
        ok(same(c2), name + ': ［取り消す］で明日からをやめる ' + JSON.stringify(c2));
        // 今日の一膳を作り直す: 案が替わり、決めた献立は「作り方」に残り、「元に戻す」で決めた献立に戻る
        await press(); await p.click('[data-act="later-today"]'); await until(p, () => !sheet && !!document.querySelector('#toast-root [data-act="toast-undo"]'));
        const d = await st();
        ok(JSON.stringify(d.ids) !== JSON.stringify(decided) && JSON.stringify(d.cook) === JSON.stringify(decided) && (kind === 'mood' ? d.mood === 'okayu' : String(d.dc) === '4') && !d.tmood && !d.pending, name + ': 今日の一膳を作り直す: 今日の案が替わり、決めた献立は残る ' + JSON.stringify(d));
        await p.click('#toast-root [data-act="toast-undo"]'); await until(p, () => !toast.undo);
        const b2 = await st();
        ok(same(b2), name + ': 作り直す→「元に戻す」で決めた献立・気分・品数に戻る ' + JSON.stringify(b2));
        await p.evaluate(() => closeSheet());
    }
    for (const [name, sel] of [['まるごと入れ替え', '#sheet-root [data-act="new-menu"]']]){   // 条件シートの中のボタン（お膳の真ん中の丸はシートの下）
        await openMood(p);
        const btn = p.locator(sel).first(); await btn.evaluate(e => e.scrollIntoView({block: 'center'})); await btn.click({timeout: 5000}).catch(() => btn.evaluate(e => e.click()));   /* 時計を止めているので、重いときにシートが「動いている」と見られて押せないことがある。そのときは要素を直接押す */ await until(p, () => !!document.querySelector('[data-act="redo-yes"]'));
        const ask = await p.evaluate(() => ({ sheet: !!document.querySelector('[data-act="redo-yes"]'), ids: menuIds(), mood: session.mood, dc: S.settings.dishCount }));
        ok(ask.sheet && JSON.stringify(ask.ids) === JSON.stringify(decided), name + ': 決めた献立があるときは確認を出し、まだ替えない ' + JSON.stringify(ask));
        await p.click('[data-act="sheet-close"]'); await until(p, () => !sheet && !document.querySelector('[data-act="redo-yes"]'));
        const kept = await p.evaluate(() => ({ ids: menuIds(), mood: session.mood, dc: S.settings.dishCount }));
        ok(JSON.stringify(kept.ids) === JSON.stringify(decided) && kept.mood !== 'okayu' && String(kept.dc) === '3', name + ': 「やめる」で元のまま ' + JSON.stringify(kept));
        await openMood(p);
        await p.locator(sel).first().click(); await until(p, () => !!document.querySelector('[data-act="redo-yes"]'));
        await p.click('[data-act="redo-yes"]'); await until(p, () => !sheet && !!document.querySelector('#toast-root [data-act="toast-undo"]'));
        const done = await p.evaluate(() => ({ ids: menuIds(), cook: S.cook.ids.slice(), undo: !!document.querySelector('#toast-root [data-act="toast-undo"]') }));
        ok(JSON.stringify(done.ids) !== JSON.stringify(decided) && JSON.stringify(done.cook) === JSON.stringify(decided) && done.undo, name + ': 作り直すと案が替わり、決めた献立は残り、「元に戻す」が出る ' + JSON.stringify(done));
        await p.click('#toast-root [data-act="toast-undo"]'); await until(p, () => !toast.undo && !document.querySelector('#toast-root [data-act="toast-undo"]'));
        const back = await p.evaluate(() => ({ ids: menuIds(), mood: session.mood, dc: S.settings.dishCount }));
        ok(JSON.stringify(back.ids) === JSON.stringify(decided) && String(back.dc) === '3', name + ': 「元に戻す」で決めた献立に戻る ' + JSON.stringify(back));
    }
    // 決めていないときは、今までどおり確認なしで作り直す
    await p.evaluate(() => { S.cook = null; save(); render(); });
    await openMood(p);
    await p.click('[data-act="mood"][data-k="okayu"]'); await until(p, () => session.mood === 'okayu' || !!document.querySelector('[data-act="redo-yes"]'));
    const free = await p.evaluate(() => ({ sheet: !!document.querySelector('[data-act="redo-yes"]'), mood: session.mood }));
    ok(!free.sheet && free.mood === 'okayu', '決めていないときは確認なしで気分を変える ' + JSON.stringify(free));
    await ctx.close();
}

// ---------- 4b) 明日からにした気分・品数は、日付が替わったとき（午前4時）に本当に効く ----------
// 端末の時計を東京の 2026-10-28 20:00 にして開き、3:59（まだ前の日）と 4:01（次の日）に進めて、開いたまま日付が替わったとき（refreshToday）を確かめる
async function openAt(iso, store){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.addInitScript(rngScript(seedFor('menu-trust', String(++seedN))));
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({ time: new Date(iso) });
    await p.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-10-01', settings: {country: 'JP', dishCount: 3}}, st))); } }, store || {});
    await p.goto(URL_); await booted(p);
    return { ctx, p };
}
// 時計を進めて、画面に戻ってきたとき（focus）と同じく日付を確かめさせる
const goTime = async (p, iso) => { await p.clock.setSystemTime(new Date(iso)); await p.evaluate(() => window.dispatchEvent(new Event('focus'))); };
const later = async (p, sel) => { await openMood(p); const btn = p.locator(sel).first(); await btn.evaluate(e => e.scrollIntoView({block: 'center'})); await btn.click({timeout: 5000}).catch(() => btn.evaluate(e => e.click()));   /* 時計を止めているので、重いときにシートが「動いている」と見られて押せないことがある。そのときは要素を直接押す */ await until(p, () => !!document.querySelector('[data-act="later-tomorrow"]')); await p.click('[data-act="later-tomorrow"]'); await until(p, () => !sheet); };
{
    const { ctx, p } = await openAt('2026-10-28T11:00:00Z');   // 東京 20:00
    await p.evaluate(() => setTab('today'));
    await p.click('[data-act="decide"]'); await afterDecide(p);
    const decided = await p.evaluate(() => S.cook.ids.slice());
    await later(p, '[data-act="count"][data-v="2"]');
    await later(p, '[data-act="mood"][data-k="okayu"]');
    const r0 = await p.evaluate(() => ({ today: TODAY, dc: S.settings.dishCount, pending: S.settings.pending, tmood: (S.day['2026-10-29'] || {}).mood, ids: menuIds(), mood: session.mood }));
    ok(r0.today === '2026-10-28' && String(r0.dc) === '3' && r0.pending && r0.pending.d === '2026-10-29' && r0.tmood === 'okayu' && JSON.stringify(r0.ids) === JSON.stringify(decided) && r0.mood !== 'okayu', '午前4時: 明日からにした品数・気分は、その日のうちは効かない ' + JSON.stringify(r0));
    await goTime(p, '2026-10-28T18:59:00Z');   // 東京 3:59（まだ 10/28）
    const r1 = await p.evaluate(() => ({ today: TODAY, dc: S.settings.dishCount, pending: !!S.settings.pending, ids: menuIds() }));
    ok(r1.today === '2026-10-28' && String(r1.dc) === '3' && r1.pending && JSON.stringify(r1.ids) === JSON.stringify(decided), '午前4時: 3:59 はまだ前の日（品数3・決めた一膳のまま） ' + JSON.stringify(r1));
    await goTime(p, '2026-10-28T19:01:00Z');   // 東京 4:01（10/29）
    await until(p, () => TODAY === '2026-10-29' && !!session.menu);
    const r2 = await p.evaluate(() => { setTab('today'); return { today: TODAY, dc: S.settings.dishCount, pending: S.settings.pending || null, mood: session.mood, n: session.menu && session.menu.n, cnt: menuCount(), okayu: !!(session.menu && session.menu.items[0].r && okayuDayOk(session.menu.items[0].r)), decided: decidedToday(), note: (() => { setTab('settings'); const x = !!document.querySelector('.pending-note'); setTab('today'); return x; })() }; });
    ok(r2.today === '2026-10-29' && String(r2.dc) === '2' && !r2.pending, '午前4時: 4:01 に applyPending で品数が2になり、pending は消える ' + JSON.stringify(r2));
    ok(r2.n === 2 && r2.cnt === 2 && !r2.decided && !r2.note, '午前4時: 次の日の案は2品で作られ、「明日から」の1行は消える ' + JSON.stringify(r2));
    ok(r2.mood === 'okayu' && r2.okayu, '午前4時: 次の日は明日からにした気分（おかゆの日）で作られる ' + JSON.stringify(r2));
    // 開き直しても同じ（もう一度効かせ直さない）
    await p.reload(); await booted(p);
    const r3 = await p.evaluate(() => ({ today: TODAY, dc: S.settings.dishCount, pending: S.settings.pending || null, mood: session.mood }));
    ok(r3.today === '2026-10-29' && String(r3.dc) === '2' && !r3.pending && r3.mood === 'okayu', '午前4時: 開き直しても品数2・おかゆの日のまま ' + JSON.stringify(r3));
    await ctx.close();
}
{
    // 決めた一膳を取り消してから今日の品数を変えたら、前に明日からにした品数は残らない（明日もう一度上書きしない）
    const { ctx, p } = await openAt('2026-10-28T11:00:00Z');
    await p.evaluate(() => setTab('today'));
    await p.click('[data-act="decide"]'); await afterDecide(p);
    await later(p, '[data-act="count"][data-v="2"]');
    await p.evaluate(() => { closeSheet(); setTab('cook'); });
    await p.click('[data-act="undo-decide"]'); await until(p, () => !S.cook);
    await openMood(p);
    await p.locator('[data-act="count"][data-v="4"]').first().click(); await until(p, () => String(S.settings.dishCount) === '4');
    const r = await p.evaluate(() => ({ dc: S.settings.dishCount, pending: S.settings.pending || null, sheet: sheet && sheet.kind }));
    ok(String(r.dc) === '4' && !r.pending, '取り消し→今日の品数を4に: 前に明日からにした2品は残らない ' + JSON.stringify(r));
    await p.evaluate(() => closeSheet());
    await goTime(p, '2026-10-28T19:01:00Z'); await until(p, () => TODAY === '2026-10-29' && !!session.menu);
    const r2 = await p.evaluate(() => ({ today: TODAY, dc: S.settings.dishCount, n: session.menu && session.menu.n, want: dishesFor(4) }));   // 品数の値は席の数（ご飯の席も1品）
    ok(r2.today === '2026-10-29' && String(r2.dc) === '4' && r2.n === r2.want, '取り消し→今日の品数を4に: 次の日も4品のまま ' + JSON.stringify(r2));
    await ctx.close();
}

// ---------- 4c) 明日の一膳を先に決めてあるとき、今日の操作で明日の決めた献立は変わらない ----------
{
    const { ctx, p } = await openAt('2026-10-28T11:00:00Z');
    await p.evaluate(() => setTab('today'));
    await p.click('[data-act="decide"]'); await afterDecide(p);
    // 明日の一膳を先に決めておく。汁けの多い主菜（寄せ鍋）で汁ものなしの2品にする（品数3の組み立てにも、明日からの2品＝主菜＋汁ものにも合わない形。合わなくても決めたとおりに出すことを確かめる）
    const tom = await p.evaluate(() => { const r = dayObj('2026-10-29'); Object.assign(r, {state: 'decided', items: [{slot: '主菜', id: 'yosenabe'}, {slot: '副菜', id: 'satoimonikkorogashi'}]}); save(); return JSON.parse(JSON.stringify(r)); });
    const tomIds = tom.items.map(x => x.id);
    const same = () => p.evaluate(t0 => { const r = S.day['2026-10-29']; return !!r && r.state === 'decided' && JSON.stringify(r.items) === JSON.stringify(t0.items); }, tom);
    ok(await p.evaluate(ids => ids.every(id => !!byId(id)), tomIds), '明日の決めた一膳（点検の前提: 料理がある） ' + JSON.stringify(tomIds));
    // 気分: 確かめのシートに「明日の決めた一膳は変わりません」。明日からにしても、明日の決めた献立は変わらない
    await openMood(p); await p.locator('[data-act="mood"][data-k="okayu"]').first().click(); await until(p, () => !!document.querySelector('[data-act="later-tomorrow"]'));
    const askTxt = await p.evaluate(() => document.querySelector('.sheet').innerText);
    ok(/明日の献立も決めてあります/.test(askTxt), '明日も決めてあるとき: 確かめのシートにそのことを出す ' + askTxt.slice(0, 80));
    await p.click('[data-act="later-tomorrow"]'); await until(p, () => !sheet && !!document.querySelector('#toast-root .toast'));
    const msg = await p.evaluate(() => document.querySelector('#toast-root').textContent);
    ok(await same() && /明日の献立も決めてある/.test(msg), '明日も決めてあるとき: 気分を明日からにしても、明日の決めた献立は変わらない ' + msg);
    await later(p, '[data-act="count"][data-v="2"]');
    ok(await same(), '明日も決めてあるとき: 品数を明日からにしても、明日の決めた献立は変わらない');
    // 今日を作り直す→元に戻す・まるごと入れ替え・明日の一膳を見る（別の案にするは出さない）
    await openMood(p); await p.locator('[data-act="count"][data-v="4"]').first().click(); await until(p, () => !!document.querySelector('[data-act="later-today"]'));
    await p.click('[data-act="later-today"]'); await until(p, () => !!document.querySelector('#toast-root [data-act="toast-undo"]'));
    ok(await same(), '明日も決めてあるとき: 今日の一膳を作り直しても、明日の決めた献立は変わらない');
    await p.click('#toast-root [data-act="toast-undo"]'); await until(p, () => !toast.undo);
    await openMood(p); await p.locator('#sheet-root [data-act="new-menu"]').first().click(); await until(p, () => !!document.querySelector('[data-act="redo-yes"]'));
    await p.click('[data-act="redo-yes"]'); await until(p, () => !sheet);
    const tsheet = await p.evaluate(() => { sheet = {kind: 'tomorrow'}; renderSheet(); const o = { newBtn: !!document.querySelector('[data-act="tomorrow-new"]'), txt: document.querySelector('.sheet').innerText }; closeSheet(); return o; });
    ok(await same() && !tsheet.newBtn && /もう決めてあります/.test(tsheet.txt), '明日も決めてあるとき: まるごと入れ替え・明日の一膳を見るでも変わらず、［別の案にする］は出さない ' + JSON.stringify(tsheet).slice(0, 120));
    // 決めた一膳を取り消して今日の品数・気分を変えても変わらない
    await p.evaluate(() => setTab('cook')); await p.click('[data-act="undo-decide"]'); await until(p, () => !S.cook);
    await p.evaluate(() => setTab('today')); await openMood(p);
    await p.locator('[data-act="count"][data-v="5"]').first().click(); await p.locator('[data-act="mood"][data-k="fish"]').first().click(); await until(p, () => session.mood === 'fish');
    await p.evaluate(() => closeSheet());
    ok(await same(), '明日も決めてあるとき: 今日の決定を取り消して品数・気分を変えても、明日の決めた献立は変わらない');
    // 午前4時を過ぎると、先に決めた一膳がそのまま今日の決めた献立になる（品数が2に変わっても作り直さない）。開き直しても同じ
    await goTime(p, '2026-10-28T19:01:00Z'); await until(p, () => TODAY === '2026-10-29' && !!session.menu);
    const r = await p.evaluate(() => { setTab('today'); return { today: TODAY, cook: S.cook && S.cook.d === TODAY ? S.cook.ids.slice() : null, ids: menuIds(), st: dayStateNow(), rec: S.day[TODAY] && S.day[TODAY].state, dc: S.settings.dishCount }; });
    ok(r.today === '2026-10-29' && JSON.stringify(r.cook) === JSON.stringify(tomIds) && JSON.stringify(r.ids) === JSON.stringify(tomIds) && r.st === 'decided' && r.rec === 'decided', '明日も決めてあるとき: 次の日、先に決めた一膳がそのまま今日の決めた献立になる ' + JSON.stringify(r) + ' / ' + JSON.stringify(tomIds));
    await p.reload(); await booted(p);
    const r2 = await p.evaluate(() => ({ cook: S.cook && S.cook.d === TODAY ? S.cook.ids.slice() : null, ids: menuIds(), st: dayStateNow() }));
    ok(JSON.stringify(r2.cook) === JSON.stringify(tomIds) && JSON.stringify(r2.ids) === JSON.stringify(tomIds) && r2.st === 'decided', '明日も決めてあるとき: 次の日に開き直しても、先に決めた一膳のまま ' + JSON.stringify(r2));
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
    await p.click('[data-act="fam-add"]'); await until(p, () => !!document.querySelector('#family-profile .fam-member[open] [data-act="fam-alg-fam"][data-v="egg"]'));
    await p.locator('#family-profile .fam-member[open] [data-act="fam-alg-fam"][data-v="egg"]').click(); await until(p, () => S.family[0].allergy.includes('@egg'));
    const r = await p.evaluate(() => ({ avoid: S.family[0].avoid, allergy: S.family[0].allergy, menuEgg: session.menu.items.filter(x => x.r && allergyConflict(x.r)).length }));
    ok(r.allergy.includes('@egg') && r.avoid.includes('@egg') && r.menuEgg === 0, '家族のアレルギー: 1回押すだけで登録され、献立に卵の料理が残らない ' + JSON.stringify(r));
    await p.locator('#family-profile .fam-member[open] [data-act="fam-alg-fam"][data-v="egg"]').click(); await until(p, () => !S.family[0].allergy.length);
    const off = await p.evaluate(() => ({ avoid: S.family[0].avoid, allergy: S.family[0].allergy }));
    ok(!off.allergy.length && !off.avoid.length, '家族のアレルギー: もう一度押すと外れる ' + JSON.stringify(off));
    // 以前の方法（食べられない食材 → ⚠）も使える
    await p.evaluate(() => { const e = document.querySelector('#family-profile .fam-member[open] [data-act="fam-avoid"][data-v="なす"]'); const d = e && e.closest('details.avoid-more'); if (d && !d.open) d.querySelector('summary').click(); });
    await p.click('#family-profile .fam-member[open] [data-act="fam-avoid"][data-v="なす"]'); await until(p, () => S.family[0].avoid.includes('なす') && !!document.querySelector('#family-profile .fam-member[open] [data-act="fam-allergy"][data-v="なす"]'));
    await p.click('#family-profile .fam-member[open] [data-act="fam-allergy"][data-v="なす"]'); await until(p, () => S.family[0].allergy.includes('なす'));
    const old = await p.evaluate(() => S.family[0].allergy);
    ok(old.includes('なす'), '家族: 食べられない食材 → ⚠ でアレルギーにする方法も残る ' + JSON.stringify(old));
    await ctx.close();
}
// ---------- 9) 家族のアレルギーも、全体と同じ判定（モニター第2回 P06: ⚠ 小麦の子に醤油の筑前煮が出た） ----------
for (const v of ['@wheat', '小麦', '小麦粉']){
    const { ctx, p } = await open({ family: [{ id: 's', name: '長男', role: 'child', avoid: [v], allergy: [v], mild: false }] });
    const r = await p.evaluate(() => {
        const out = { chikuzen: isAvoidedCore(byId('chikuzen')) };
        modalId = 'chikuzen'; renderModal(); out.box = (document.querySelector('#allergen-box li.mine') || {}).innerText || ''; closeModal();
        S.settings.allergenFerm = false; out.fermOff = isAvoidedCore(byId('chikuzen')); S.settings.allergenFerm = true;   // 全体のスイッチ（発酵調味料も除く）に家族も従う
        out.menu = 0; for (let k = 0; k < 15; k++){ session.menu = null; ensureMenu(); out.menu += session.menu.items.filter(x => x.r && x.r.items && x.r.items.concat(seasItems(x.r)).some(i => /醤油|しょうゆ|小麦/.test(i.name))).length; }
        return out;
    });
    ok(r.chikuzen === true, '家族の小麦アレルギー（' + v + '）: 醤油を使う筑前煮を出さない');
    ok(/⚠/.test(r.box) && /小麦/.test(r.box), '家族の小麦アレルギー（' + v + '）: 料理の詳細の小麦の行に ⚠: ' + r.box);
    ok(r.fermOff === false, '家族の小麦アレルギー（' + v + '）: 「発酵調味料も除く」をオフにすると、全体と同じく醤油だけでは外さない');
    ok(r.menu === 0, '家族の小麦アレルギー（' + v + '）: 15回作った献立に、醤油・小麦の料理が0 (' + r.menu + ')');
    await ctx.close();
}
{
    // 家族の卵: マヨネーズ（よく含まれる加工品）の料理も、全体と同じく外す
    const { ctx, p } = await open({ family: [{ id: 's', name: '夫', role: 'adult', avoid: ['@egg'], allergy: ['@egg'], mild: false }] });
    const r = await p.evaluate(() => ({ potesala: isAvoidedCore(byId('potesala')) }));
    ok(r.potesala === true, '家族の卵アレルギー: マヨネーズの料理（ポテトサラダ）を出さない');
    await ctx.close();
}
// ---------- 10) 主食（パン・トースト）も判定に通す（モニター第2回 P06・P07） ----------
for (const [name, store, blocked] of [
    ['小麦（全体）', { settings: { country: 'JP', dishCount: 3, allergens: ['wheat'], stapleBy: { JP: 'toast' } } }, true],
    ['乳（全体・パンは乳が入っていることも多い）', { settings: { country: 'JP', dishCount: 3, allergens: ['milk'], stapleBy: { JP: 'toast' } } }, true],
    ['卵（家族）', { settings: { country: 'JP', dishCount: 3, stapleBy: { JP: 'toast' } }, family: [{ id: 's', name: '夫', role: 'adult', avoid: ['卵'], allergy: ['卵'], mild: false }] }, true],
    ['小麦（家族）', { settings: { country: 'JP', dishCount: 3, stapleBy: { JP: 'toast' } }, family: [{ id: 's', name: '長男', role: 'child', avoid: ['@wheat'], allergy: ['@wheat'], mild: false }] }, true],
    ['アレルギーなし', { settings: { country: 'JP', dishCount: 3, stapleBy: { JP: 'toast' } } }, false],
    ['ご飯は小麦でも出る', { settings: { country: 'JP', dishCount: 3, allergens: ['wheat'], stapleBy: { JP: 'rice' } } }, false]]){
    const { ctx, p } = await open(store);
    const r = await p.evaluate(() => {
        session.menu.items[0].r = byId('hamburg'); setTab('today'); render();
        const spot = document.querySelector('.tray .spot.rice'), view = document.querySelector('#view').innerText;
        return { st: stapleSpot(), spot: spot ? spot.innerText : '', note: /主食の「.*」は、アレルギー/.test(view) };
    });
    if (blocked){
        ok(!r.st && !/トースト/.test(r.spot) && r.note, '主食 ' + name + ': トーストを出さず、理由を出す ' + JSON.stringify(r));
        // 主食を選ぶのは「条件を変える」の中（空の主食の席はお膳に出さない。基準書 7章 5A）。当たる主食は選べない（押せない）。選べる主食を押すと、その主食になる
        const nx = await p.evaluate(() => { const before = currentStapleOpt().k; openCondSheet();
            const chips = [...document.querySelectorAll('#sheet-root [data-act="staple-set"]')], optOf = c => stapleOptions().find(o => o.k === c.dataset.v);
            const disOk = chips.length > 1 && chips.filter(c => c.dataset.v !== 'none' && stapleBlocked(optOf(c))).every(c => c.disabled);
            const pick = chips.find(c => !c.disabled && c.dataset.v !== 'none' && c.dataset.v !== before); if (pick) pick.click();
            const o = { before, after: currentStapleOpt().k, blocked: stapleBlocked(currentStapleOpt()), disOk, picked: !!pick }; closeSheet(); return o; });
        ok(!nx.blocked && nx.disOk && nx.picked, '主食 ' + name + ': 当たる主食は選べず、選べる主食にかえられる ' + JSON.stringify(nx));
    } else ok(!!r.st && !r.note, '主食 ' + name + ': 出す ' + JSON.stringify(r));
    await ctx.close();
}
for (const cc of ['DE', 'FR']){
    // 各国のパンの主食も、小麦なら出さない
    const { ctx, p } = await open({ settings: { country: cc, dishCount: 3, allergens: ['wheat'] } });
    const r = await p.evaluate(() => ({ st: stapleSpot(), o: currentStapleOpt().k }));
    ok(!r.st, cc + ' のパンの主食: 小麦アレルギーでは出さない ' + JSON.stringify(r));
    await ctx.close();
}
// ---------- 11) 家族の食べられない食材も、手順の文から外す（モニター第2回 C: のっぺい汁のこんにゃく） ----------
{
    const { ctx, p } = await open({ family: [{ id: 'm', name: '母', role: 'adult', avoid: ['ごぼう', 'たこ', 'こんにゃく'], allergy: [], mild: false }] });
    const r = await p.evaluate(() => { const w = swappedRecipe(byId('noppeijiru')); return { omit: w.swapped ? w.swapped.omit.map(i => i.name) : [], items: w.items.map(i => i.name).join('、'), steps: w.steps.map(s => typeof s === 'string' ? s : s.t).join(' / ') }; });
    ok(r.omit.includes('こんにゃく') && !/こんにゃく/.test(r.items), '家族の苦手: のっぺい汁の材料からこんにゃくを外す');
    ok(!/こんにゃく/.test(r.steps), '家族の苦手: のっぺい汁の手順にもこんにゃくが残らない: ' + r.steps.slice(0, 200));
    ok(/鍋にだし・野菜を入れて/.test(r.steps) && /しいたけは薄切りにする。/.test(r.steps), '家族の苦手: ほかの文はそのまま残る');
    await ctx.close();
}
// ---------- 12) 家族の ⚠ は、全体のアレルギー対策と同じ料理を外す（モニター第2回 アレルギー層 P15: そば→ざるそば・牛乳と大豆→31品・魚→かつお節） ----------
for (const [name, fam, ids, must] of [['そば・ピーナッツ', ['そば', 'ピーナッツ'], ['buckwheat', 'peanut'], 'zarusoba'], ['牛乳・大豆', ['牛乳', '大豆'], ['milk', 'soy'], 'hiyayakko'], ['魚', ['@fish'], ['fish'], 'hiyayakko'], ['卵', ['@egg'], ['egg'], 'potesala']]){
    const { ctx, p } = await open({ family: [{ id: 'c', name: '👧', role: 'child', avoid: fam, allergy: fam, mild: false }] });
    const r = await p.evaluate(([ids, must]) => {
        const famOut = new Set(RECIPES.filter(r => isAvoidedCore(r)).map(r => r.id));
        const fam = S.family; S.family = []; S.settings.allergens = ids; const glob = new Set(RECIPES.filter(r => isAvoidedCore(r)).map(r => r.id)); S.family = fam; S.settings.allergens = [];
        return { missing: [...glob].filter(id => !famOut.has(id)), extra: [...famOut].filter(id => !glob.has(id)), must: famOut.has(must), glob: glob.size };
    }, [ids, must]);
    ok(!r.missing.length && r.must, '家族の ⚠ ' + name + ': 全体のアレルギー対策で外れる料理（' + r.glob + '品）は家族でも外れる。漏れ: ' + r.missing.slice(0, 5).join(','));
    ok(!r.extra.length || name === '卵' || name === '魚', '家族の ⚠ ' + name + ': 名前だけで別の料理（焼きそばなど）まで外さない: ' + r.extra.slice(0, 5).join(','));
    await ctx.close();
}
// ---------- 13) ひと手間も、アレルギー・苦手の判定に通す（モニター第2回 アレルギー層: ごま→白ごま・乳→バター・かに→かにかま・りんご→りんご） ----------
for (const [al, re] of [['sesame', /ごま/], ['milk', /バター|チーズ|牛乳|生クリーム/], ['crab', /かに/], ['apple', /りんご/], ['egg', /卵|マヨ/], ['fish', /かつお節|ツナ|魚/]]){
    const { ctx, p } = await open({ settings: { country: 'JP', dishCount: 3, allergens: [al] } });
    const r = await p.evaluate(src => { const re = new RegExp(src); const bad = [];
        RECIPES.forEach(r => { const u = upgradeOf(r); if (u && re.test(u.add)) bad.push(r.id + ':' + u.add); });
        const kofuki = byId('kofukiimo'); modalId = kofuki.id; renderModal(); const txt = (document.querySelector('.modal') || {}).innerText || ''; closeModal();
        return { bad, modal: re.test((txt.split('ひと手間でスキルアップ')[1] || '').split('やってみた')[0] || '') }; }, re.source);
    ok(!r.bad.length && !r.modal, 'ひと手間 ' + al + ': 当たる食材をすすめない: ' + r.bad.slice(0, 4).join(' ; '));
    await ctx.close();
}
// ---------- 14) 1週間プラン: アレルギーを続けて足しても、プランと買い物メモに残らない（モニター第2回 アレルギー層 P01: 卵→小麦→乳） ----------
for (let run = 0; run < 6; run++){
    const { ctx, p } = await open({});
    await p.evaluate(() => { hasPro = () => true; makeWeek(); S.settings.weekSides = true; ensureWeekExtras(); save(); setTab('settings'); });
    for (const v of ['egg', 'wheat', 'milk']){ await p.click(`#allergy-card .chip[data-v="${v}"]`); await until(p, v => algIds().includes(v), v); }
    const r = await p.evaluate(() => { const days = S.week.days.filter(x => x.d >= TODAY && !x.skip);
        return { main: days.map(x => byId(x.id)).filter(r => r && allergyConflict(r)).map(r => r.id), extra: days.flatMap(x => x.extra ? [x.extra.side, x.extra.soup] : []).map(byId).filter(r => r && allergyConflict(r)).map(r => r.id),
            shop: shoppingList().filter(e => algItemHit(algIds(), { key: keyOf(e.label), name: e.label, label: e.label, en: e.en || '' })).map(e => e.label) }; });
    ok(!r.main.length && !r.extra.length && !r.shop.length, '1週間プラン: 卵→小麦→乳と足しても、当たる料理・材料が残らない（' + run + '）' + JSON.stringify(r));
    await ctx.close();
}
// ---------- 15) 置き換え・抜いたあと、タグ・手順・アレルゲン欄に元の食材が残らない（モニター第2回 アレルギー層 P03・P04） ----------
{
    const { ctx, p } = await open({ settings: { country: 'JP', dishCount: 3, avoid: ['@pork'] } });
    const r = await p.evaluate(() => ({ potesalaMeta: metaLine(byId('potesala')), potesalaSteps: swappedRecipe(byId('potesala')).steps.map(s => typeof s === 'string' ? s : s.t).join(' '), rebanira: isAvoidedCore(byId('rebanira')), rebaniraSwapped: !!swappedRecipe(byId('rebanira')).swapped }));
    ok(!/ハム/.test(r.potesalaMeta) && !/ハム/.test(r.potesalaSteps), 'ハムを入れないポテトサラダ: タグ・手順にハムが残らない: ' + r.potesalaMeta);
    ok(r.rebanira && !r.rebaniraSwapped, 'レバニラ（豚が苦手）: レバーは鶏肉に置き換えず、出さない');
    await ctx.close();
}
{
    const { ctx, p } = await open({ settings: { country: 'JP', dishCount: 3, avoid: ['えび', 'うずらの卵', '卵'] } });
    const r = await p.evaluate(() => { const st = id => swappedRecipe(byId(id)).steps.map(s => typeof s === 'string' ? s : s.t).join(' / '); return { ankake: st('ankakeyakisoba'), ramen: st('ramen') }; });
    ok(!/えび|うずら/.test(r.ankake), 'あんかけ焼きそば: えび・うずらの卵が手順に残らない: ' + r.ankake.slice(0, 120));
    ok(!/卵/.test(r.ramen.replace(/卵（入れない）/g, '')), 'ラーメン: 卵が手順にそのまま残らない（残るときは「（入れない）」）: ' + r.ramen.slice(0, 80));
    await ctx.close();
}
{
    const { ctx, p } = await open({ settings: { country: 'JP', dishCount: 3, avoid: ['@chicken'] } });
    const r = await p.evaluate(() => { modalId = 'wantansoup'; renderModal(); const box = (document.querySelector('#allergen-box') || {}).innerText || ''; closeModal(); return box; });
    ok(!/鶏ガラ/.test(r), '鶏が苦手のワンタンスープ: 置き換えた鶏ガラスープの素がアレルゲン欄に残らない: ' + r.slice(0, 120));
    await ctx.close();
}
// ---------- 16) モニター第3回 安全（S1・S2・S3・S7） ----------
// S1: 決めた献立にあとからアレルゲンを足す → 決めた献立は替わらないが、「入れていません」と出さない。当たる料理のカードに ⚠、知らせに［かえる］
{
    const { ctx, p } = await open({ settings: { country: 'JP', dishCount: 4 } });   // 副菜のある品数（品数は席の数。4 = 主菜・副菜・汁もの・ご飯）
    await p.evaluate(() => { setTab('today'); const m = session.menu; const i = m.items.findIndex(x => x.slot === '副菜'); if (i >= 0) m.items[i].r = byId('chawanmushi');
        m.items.forEach((x, k) => { if (x.r && x.r.id !== 'chawanmushi'){ const a0 = S.settings.allergens; S.settings.allergens = ['shrimp']; if (isAvoidedCore(x.r)) x.r = suggestOrAny(x.slot, m.items.filter((_, j) => j !== k), m.items[0].r); S.settings.allergens = a0; } });
        render(); });
    await p.click('[data-act="decide"]'); await afterDecide(p);
    await p.evaluate(() => setTab('settings'));
    await p.click('#allergy-card .chip[data-v="shrimp"]'); await until(p, () => algIds().includes('shrimp'));
    const r = await p.evaluate(() => { setTab('today'); if (typeof session.stage !== 'undefined'){ session.stage = 'decide'; render(); }
        const v = document.querySelector('#view').innerText;
        const card = [...document.querySelectorAll('#view .spot')].find(s => /茶碗蒸し/.test(s.innerText));
        return { cook: S.cook.ids.includes('chawanmushi'), none: /えび）を使う料理は入れていません/.test(v), line: (v.match(/[^\n]*えび[^\n]*使う料理が[^\n]*/) || [''])[0],
            mark: !!(card && card.querySelector('.alg-tag')) && /⚠/.test(card.innerText), swap: !!document.querySelector('.cook-warn [data-act="cook-swap"][data-id="chawanmushi"]') }; });
    ok(r.cook, 'S1 決めたあとにえび: 決めた茶碗蒸しは黙って替わらない');
    ok(!r.none, 'S1 決めたあとにえび: 茶碗蒸しが残っているのに「えびを使う料理は入れていません」と出さない');
    ok(!!r.line, 'S1 決めたあとにえび: 「えびを使う料理が1品あります」のように知らせる');
    ok(r.mark, 'S1 決めたあとにえび: 茶碗蒸しのカードに ⚠');
    ok(r.swap, 'S1 決めたあとにえび: ［かえる］が出る');
    await ctx.close();
}
// S2: 苦手のえびを鶏肉に置き換えた天丼: 手順に「殻と背わた」が残らない。分量は元のえびの量（4尾≒80g）に合わせ、「2枚（500g）」にしない
{
    const { ctx, p } = await open({ settings: { country: 'JP', dishCount: 3, avoid: ['えび'] } });
    const r = await p.evaluate(() => { const out = { bad: [], qty: '' };
        const tn = swappedRecipe(byId('tendon')); const it = tn.items.find(i => i.changed); out.qty = it ? it.name + ' ' + it.qty : '(置き換えなし)';
        RECIPES.forEach(r0 => { const s = swappedRecipe(r0); if (!s || !s.swapped || !s.swapped.swaps.some(x => inFam('shellfish', x.from))) return;
            const st = s.steps.map(x => typeof x === 'string' ? x : x.t).join(' '); if (/背わた|殻を|殻と/.test(st)) out.bad.push(r0.id + ': ' + st.slice(0, 50)); });
        return out; });
    ok(!r.bad.length, 'S2 えびを置き換えた料理の手順に「殻・背わた」が残らない: ' + r.bad.slice(0, 3).join(' | '));
    const g = Number((r.qty.match(/(\d+)\s*g/) || [])[1] || 0);
    ok(/鶏/.test(r.qty) && g >= 40 && g <= 200 && !/枚/.test(r.qty), 'S2 天丼の置き換えの分量はえびの量に合わせる（4尾≒80g）: ' + r.qty);
    await ctx.close();
}
// S3: 家族の名前を打った直後（入力欄から離れる前）に押した卵⚠が、1回目で登録される
// S7: 家族のアレルギーを1つ押しても一覧が畳まれず、続けて押せる。そば・大豆・ごま・落花生などもチップで選べる
{
    const { ctx, p } = await open({});
    await p.evaluate(() => setTab('settings'));
    await p.evaluate(() => { const b = document.querySelector('[data-act="fam-add"]'); b.scrollIntoView(); });
    await p.click('[data-act="fam-add"]'); await until(p, () => famMembers().length === 1 && !!document.querySelector('[data-act="fam-name"]'));
    await p.click('[data-act="fam-name"]'); await p.keyboard.type('長女');
    await p.click('[data-fm] [data-act="fam-alg-fam"][data-v="egg"]'); await p.waitForTimeout(200);
    const r3 = await p.evaluate(() => ({ name: famMembers()[0].name, al: famMembers()[0].allergy.slice() }));
    ok(r3.name === '長女' && r3.al.includes('@egg'), 'S3 名前を打った直後の卵⚠が1回目で登録される: ' + JSON.stringify(r3));
    await p.click('[data-fm] [data-act="fam-alg-fam"][data-v="dairy"]'); await p.waitForTimeout(150);
    const vis = await p.evaluate(() => { const b = document.querySelector('[data-fm] [data-act="fam-alg-fam"][data-v="wheat"]'); return !!b && !b.closest('details:not([open]):not(.fam-member)'); });
    ok(vis, 'S7 アレルギーを押しても、ほかのアレルギーのチップが畳まれない');
    const ids = await p.evaluate(() => [...document.querySelectorAll('[data-fm] [data-act="fam-alg-w"]')].map(b => b.dataset.v));
    for (const w of ['そば', '落花生', '大豆', 'ごま']) ok(ids.includes(w), 'S7 家族のアレルギーに「' + w + '」のチップ: ' + ids.join(','));
    for (const w of ['そば', '大豆']){ const sel = `[data-fm] [data-act="fam-alg-w"][data-v="${w}"]`; if (!(await p.$(sel))) continue;
        await p.evaluate(s => { const b = document.querySelector(s); const d = b.closest('details:not(.fam-member)'); if (d) d.open = true; }, sel); await p.click(sel); await p.waitForTimeout(150); }
    const r7 = await p.evaluate(() => ({ al: famMembers()[0].allergy.slice(), eff: algIdsEff().slice().sort(), dbl: [...document.querySelectorAll('[data-fm] .chip')].filter(b => /^\s*✓/.test(b.textContent)).length }));
    ok(['egg', 'milk', 'buckwheat', 'soy'].every(x => r7.eff.includes(x)), 'S7 続けて押したアレルギーがすべて効く: ' + JSON.stringify(r7));
    ok(r7.dbl === 0, 'S7 チップに ✓ が二重に並ばない');
    await ctx.close();
}
// ---------- 17) 安全第4回: えび以外の魚介（貝・いか・たこ・魚の切り身）の置き換え ----------
// 置き換えた料理・主役を替えた案（ひとひねり）の手順に、元の食材の名前と、魚介だけの下ごしらえ（殻が開いたら身と蒸し汁に分ける・砂抜き・うろこ…）が残らない。
// 分量は元の重さ（尾・切れ・缶・杯のまま肉にしない）。各国の料理は手順の言語が多く直しきれないので、魚介は置き換えない（出さない）
{
    const SEA_CHECK = () => {
        const sea = i => inFam('shellfish', i) || inFam('fish', i);
        const JA = /殻|砂抜|背わた|うろこ|内臓|軟骨|墨|吸盤|開いたら|開くまで|開かない|蒸し汁|中骨|小骨|腹側|身の側/, EN = /\b(?:shells?|devein\w*|veins?|tails?|belly|scales?|gills?|ink|tentacles?|beards?|grit)\b/i;
        const strip = x => String(x || '').replace(/[（(][^）)]*[）)]/g, '').trim();
        const jaRe = w => new RegExp((/^[ぁ-ん]/.test(w) ? '(?<!(?![とのはをにでやもがへ])[ぁ-ん])' : '') + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const left = (steps, from, to) => {
            const out = [];
            steps.forEach(txt => {
                const ja = /[ぁ-ん]/.test(txt), toN = [to.name, to.label, to.jp].filter(Boolean).map(x => strip(x).toLowerCase());
                const fw = ja ? [from.jp, from.name, from.label].map(strip).filter(w => /[ぁ-ん一-龠ァ-ヶ]/.test(w) && w.length >= 2) : strip(from.label).toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3 && !/^(?:fillets?|fresh|raw|peeled|large|small|whole|frozen|manila|with|and)$/.test(w));
                fw.filter(w => !toN.some(n => n.includes(w.toLowerCase()))).forEach(w => { if ((ja ? jaRe(w) : new RegExp('\\b' + w.replace(/s$/, '') + '(?:e?s)?\\b', 'i')).test(txt)) out.push('「' + w + '」が残る: ' + txt.slice(0, 60)); });
                if (!sea(to)) txt.split(ja ? '。' : /\.\s/).forEach(se => { if (toN.some(n => se.toLowerCase().includes(n)) && (ja ? JA : EN).test(se)) out.push('下ごしらえが残る: ' + se.slice(0, 60)); });
            });
            return out;
        };
        const bad = [], seen = new Set(); let n = 0;
        RECIPES.forEach(r => (r.items || []).filter(i => sea(i) && !i.opt).forEach(i => {
            for (const av of [[i.name], [i.key], ['@fish'], ['@shellfish']]){
                S.settings.avoid = av; const s = swappedRecipe(r); if (!s || s === r || !s.swapped) continue;
                const sw = s.swapped.swaps.filter(x => sea(x.from)); if (!sw.length) continue;
                const k = r.id + '|' + sw.map(x => x.from.name + '>' + x.to.name).join(); if (seen.has(k)) continue; seen.add(k); n++;
                if (r.pack){ bad.push(r.id + ': 各国の料理の魚介を置き換えている（' + sw.map(x => x.from.label + '→' + x.to.label).join('、') + '）'); continue; }
                const steps = s.steps.map(x => typeof x === 'string' ? x : x.t);
                sw.forEach(x => left(steps, x.from, x.to).forEach(m => bad.push(r.id + ': ' + m)));
                s.items.filter(x => x.changed && sea({key: x.key, en: x.en}) === false && sw.some(y => y.from.name === x.from)).forEach(x => { if (!/\d\s*g$/.test(String(x.qty))) bad.push(r.id + ': 分量が重さでない（' + x.label + ' ' + x.qty + '）'); });
            }
        }));
        S.settings.avoid = [];
        // ひとひねりの「主役を替える」案（日本の料理だけ）
        const tw = [];
        if (currentCountry() === 'JP' && LANG === 'ja') RECIPES.filter(r => ['魚', '魚介'].includes(r.family)).forEach(r => twistOptions(r).swaps.forEach(k => {
            const t0 = buildTwist(twistId(r.id, '', '', k)); if (!t0) return;
            const from = r.items.find(i => i.key === r.protein), to = t0.items.find(i => i.changed); if (!from || !to) return;
            left(t0.steps.map(x => x.t), from, to).forEach(m => tw.push(r.id + '(' + k + '): ' + m));
            if (!sea(parseIng(to.name)) && !/\d\s*g$/.test(String(to.qty))) tw.push(r.id + '(' + k + '): 分量が重さでない（' + to.name + ' ' + to.qty + '）');
        }));
        return { n, bad, tw };
    };
    for (const [cc, ui] of [['JP', 'ja'], ['JP', 'en'], ['KR', 'ja'], ['KR', 'ko'], ['IT', 'it'], ['ES', 'ja'], ['ES', 'es'], ['PE', 'es'], ['EG', 'ar'], ['VN', 'vi'], ['TH', 'th'], ['ID', 'id'], ['GB', 'en'], ['PH', 'fil'], ['CN', 'zh-Hans'], ['US', 'en'], ['FR', 'fr']]){
        const { ctx, p } = await open({ settings: { country: cc, dishCount: 3, uiLang: ui } });
        await until(p, () => !!(PACK || currentCountry() === 'JP'));
        const r = await p.evaluate(SEA_CHECK);
        ok(!r.bad.length, `魚介の置き換え（${cc}/${ui}・${r.n}件）: 手順に元の食材・下ごしらえを残さない・分量は重さ: ` + r.bad.slice(0, 4).join(' | '));
        ok(!r.tw.length, `ひとひねりの主役替え（${cc}/${ui}）: 手順に元の食材・下ごしらえを残さない・分量は重さ: ` + r.tw.slice(0, 4).join(' | '));
        await ctx.close();
    }
    // クラムチャウダー（あさり → 鶏肉）: 「殻が開いたら身と蒸し汁に分ける」が残らない。分量はあさりの重さ（200g）。料理の詳しい画面でも
    const { ctx, p } = await open({ settings: { country: 'JP', dishCount: 3, avoid: ['あさり'] } });
    const c = await p.evaluate(() => { const s = swappedRecipe(byId('clamchowder')); const it = s.items.find(i => i.changed);
        openModal('clamchowder'); const m = document.querySelector('#modal-root'); return { qty: it ? it.name + ' ' + it.qty : '(置き換えなし)', steps: s.steps.map(x => typeof x === 'string' ? x : x.t).join(' '), modal: m ? m.innerText : '' }; });
    ok(/鶏/.test(c.qty) && /200\s*g/.test(c.qty), 'クラムチャウダーの置き換えの分量はあさりの重さ（200g）: ' + c.qty);
    ok(!/殻|蒸し汁/.test(c.steps) && !/殻|蒸し汁/.test(c.modal), 'クラムチャウダーの手順に「殻が開いたら身と蒸し汁」が残らない: ' + c.steps.slice(0, 80));
    await ctx.close();
}
await b.close();
ok(errs.length === 0, 'ページのエラー: ' + errs.slice(0, 3).join(' | '));
console.log(fails ? `NG ${fails}/${checks}` : `ALL OK ${checks} checks`);
process.exit(fails ? 1 : 0);
