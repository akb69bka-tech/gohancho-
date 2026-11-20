#!/usr/bin/env node
// 2つのタブ（前の版のタブも）で使うときの回帰テスト（第38回 利用者モニター R173〜R176。使い方: node tools/tests/tab38.mjs [http://localhost:8795/]）
//  R173 同じタブで家族の人にアレルギーを足し、そのあと同じタブでその人を消した。別のタブが3分以内に保存しても「別のタブで…消されたため」は出ない（このタブで消した）
//  R174 前の版のタブ（変えた時刻・しるしを書かない）がほぼ同時に別の献立を決め、決めた献立はこちら・下書きはあちら、のまま保存された。
//       どちらのタブでも・開き直しても、作り方（決めた献立）と今日（下書き）は同じ献立になる。決めた献立は変えない（下書きを決めた献立にそろえる）
//       汁けの多い主菜で汁ものの席を空けた献立は、前の版は下書きがないと出せない。そろえるときは、このタブの同じ料理の下書きを使う（読み直しても）
//  R176 とても古い版のタブ（消した印・しるしなし。上書きする）が料理を入れかえて保存し、決めた献立が消えた。黙って消さず「一部が消えました［消えた分を戻す］」を出し、戻せる
//  （R175 の知らせの大きさは note37.mjs で見る）
//  前の版のタブ: 保存の中身を、前の版が書くとおりに（しるしを足さずに）直接書いて試す。git の履歴がある所では、前の版（v127・v132）の本体を同じ場所（同じ origin）で開いても試す
import { createRequire } from 'node:module';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = (u => u.endsWith('/') ? u : u + '/')(process.argv[2] || process.env.BASE || BASE_);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0;
const ONLY = process.env.T38_ONLY || '';   // r173・r174・r176 のどれかだけを試すとき
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: got ${JSON.stringify(a)} expected ${JSON.stringify(e)}`);
const isReady = () => typeof S !== 'undefined' && typeof session !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *') && (typeof GH === 'undefined' || GH.booted !== false);
const ready = p => p.waitForFunction(isReady, null, { timeout: 30000 });
const watch = p => { p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) p.errs.push(m.text()); }); const ev0 = p.evaluate.bind(p); p.evaluate = async (...a) => { for (let i = 0; ; i++){ try{ return await ev0(...a); }catch(e){ if (i >= 4 || !/context was destroyed|navigation/i.test(e.message)) throw e; await p.waitForLoadState('load').catch(() => {}); await p.waitForFunction(() => typeof S !== 'undefined' && document.querySelector('#app, body'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(300); } } }; return p; };
const origin = p => p.evaluate(() => performance.timeOrigin).catch(() => 0);
const saved = async p => { for (let i = 0; ; i++){ try{ return await p.evaluate(() => JSON.parse(localStorage.getItem('gohancho.v1'))); }catch(e){ if (i >= 4 || !/context was destroyed|navigation/i.test(e.message)) throw e; await p.waitForLoadState('load').catch(() => {}); await p.waitForTimeout(300); } } };
const ev = (p, f, a) => p.evaluate(f, a).catch(async e => { if (!/context was destroyed|navigation/i.test(e.message)) throw e; await ready(p); return null; });
const setHidden = (p, h) => ev(p, h => { sessionStorage.setItem('hid', h ? '1' : '0'); document.dispatchEvent(new Event('visibilitychange')); if (!h) window.dispatchEvent(new Event('focus')); }, h);
const noteOf = (p, id) => p.evaluate(id => { const n = document.getElementById('gh-note-' + id); return n ? n.innerText : null; }, id).catch(() => null);

// 前の版の本体（git の履歴から。同じ origin の old-<版>/ で出す）
const OLD = {v127: '6a27c51d', v132: 'd3dc1032'};
const hasRev = rev => { try{ execFileSync('git', ['-C', ROOT, 'cat-file', '-e', rev + ':gohancho/index.html'], {stdio: 'ignore'}); return true; }catch(e){ return false; } };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const oldCache = new Map();
async function oldRoute(ctx){
    await ctx.route(u => /\/old-v\d+\//.test(u.pathname), async r => {
        const u = new URL(r.request().url()), m = /\/old-(v\d+)\/(.*)$/.exec(u.pathname), rev = OLD[m[1]];
        let rel = decodeURIComponent(m[2]) || 'index.html';
        const k = rev + ':' + rel;
        if (!oldCache.has(k)){ try{ oldCache.set(k, execFileSync('git', ['-C', ROOT, 'show', `${rev}:gohancho/${rel}`], {maxBuffer: 1 << 28})); }catch(e){ oldCache.set(k, null); } }
        const body = oldCache.get(k);
        if (!body) return r.fulfill({status: 404, body: 'nf'});
        r.fulfill({status: 200, headers: {'content-type': MIME[path.extname(rel)] || 'application/octet-stream'}, body});
    });
}

async function pair(seed, bUrl){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo', locale: 'ja-JP', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|revenuecat/, r => r.abort());
    await oldRoute(ctx);
    await ctx.addInitScript(s => {
        if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3}}, s || {})));
        Object.defineProperty(document, 'hidden', { get: () => sessionStorage.getItem('hid') === '1' });
        Object.defineProperty(document, 'visibilityState', { get: () => sessionStorage.getItem('hid') === '1' ? 'hidden' : 'visible' });
    }, seed || null);
    await ctx.addInitScript(`window.otherDraft = ${otherDraft.toString()};`);
    const A = watch(await ctx.newPage()); await A.goto(URL_); await ready(A);
    const B = watch(await ctx.newPage()); await B.goto(bUrl || URL_); await ready(B);
    await settle(A, B);
    return { ctx, A, B };
}
async function settle(A, B){
    for (let i = 0, last = ''; i < 20; i++){ await A.waitForTimeout(500); const k = JSON.stringify(await Promise.all([A, B].map(origin))); if (k === last) break; last = k; }
    await ready(A); await ready(B);
    for (const p of [A, B]) await p.evaluate(() => sessionStorage.removeItem('gohanOther'));
}
// 作り方（決めた献立）・今日（下書き・いま出ている献立）
const view = p => p.evaluate(() => { ensureMenu(); return {cook: S.cook && S.cook.d === TODAY ? S.cook.ids.join() : '', draft: S.draft && S.draft.d === TODAY ? S.draft.ids.filter(Boolean).join() : '', menu: menuIds().join(), dec: menuIsDecided()}; });
const one = v => !!v && !!v.cook && (v.draft === '' || v.draft === v.cook) && v.cook === v.menu && v.dec;
const savedOne = s => !!(s && s.cook && s.cook.ids.length && (!s.draft || s.draft.ids.filter(Boolean).join() === s.cook.ids.join()));
const decide = () => { setTab('today'); document.querySelector('[data-act=decide]').click(); return menuIds().join(); };
// ほかの主菜に替えた下書き（前の版のタブが、別の献立を決めた・料理を入れかえたときの形）
const otherDraft = () => { const d = JSON.parse(JSON.stringify(S.draft)); const r = RECIPES.find(x => slotOf(x) === '主菜' && !d.ids.includes(x.id) && !slotOut(x) && !allergyConflict(x)); d.ids[0] = r.id; return d; };   // ページの中で使う（pair で入れる）

// ================= R173: このタブで足して、このタブで消した人 =================
if (!ONLY || ONLY === 'r173'){
    const FAM = [{id: 'f1', name: 'たろう', role: 'child', avoid: [], allergy: [], mild: false, sometimes: false, me: false}, {id: 'f2', name: '父', role: 'adult', avoid: [], allergy: [], mild: false, sometimes: false, me: false}];
    let bad = 0;
    const N = 4;
    for (let round = 0; round < N; round++){
        const { ctx, A, B } = await pair({ family: FAM });
        await ev(A, () => { const m = S.family.find(x => x.id === 'f1'); m.avoid.push('そば'); m.allergy.push('そば'); save(); saveNow(); });
        await A.waitForTimeout(400);
        await ev(A, () => { S.family = S.family.filter(m => m.id !== 'f1'); save(); saveNow(); });
        await A.waitForTimeout(600);
        // B が3分以内に何かを保存する（入力中・ふつう・手が空いたとき・まだ書いていない変更があるとき）
        if (round === 0) await ev(B, () => { S.fridge.push('にんじん'); save(); saveNow(); });
        else if (round === 1) await ev(B, () => { const m = S.family.find(x => x.id === 'f2'); if (m){ m.allergy.push('くるみ'); m.avoid.push('くるみ'); } save(); saveNow(); });
        else if (round === 2){ await ev(A, () => { S.fridge.push('たまねぎ'); save(); }); await ev(B, () => { S.fridge.push('ねぎ'); save(); saveNow(); }); }
        else { await setHidden(A, true); await ev(B, () => { S.staples = [...(S.staples || []), 'みそ']; save(); saveNow(); }); await A.waitForTimeout(500); await setHidden(A, false); }
        await A.waitForTimeout(1500);
        await settle(A, B);
        const n = await noteOf(A, 'famgone') || await noteOf(B, 'famgone');
        const s = await saved(A);
        if (n){ bad++; console.log('  R173', round, JSON.stringify(n)); }
        ok(!s.family.some(m => m.id === 'f1'), `R173(${round}) 消した人は消えたまま`);
        eq([...A.errs, ...B.errs], [], `R173(${round}) 例外なし`);
        await ctx.close();
    }
    eq(bad, 0, `R173 このタブで足して、このタブで消した人のことで「別のタブで…消されたため」と出ない（${N}回）`);
}

// ================= R174: 前の版が書いた、決めた献立と下書きの食い違い =================
if (!ONLY || ONLY === 'r174'){
    // (a) 前の版のタブが、こちらの決めた献立と、あちらの下書き（別の献立）を書いた（しるしは前のまま）
    let bad = [];
    for (let round = 0; round < 3; round++){
        const { ctx, A, B } = await pair();
        await ev(A, () => setTab('today')); await ev(B, () => setTab('today'));
        await settle(A, B);
        const ia = await ev(A, decide);
        await A.waitForTimeout(900);
        await settle(A, B);
        // 前の版の書いたもの: 決めた献立はこちらのまま、下書きだけ別の献立。変えた時刻・しるしは足さない（round 2 は、しるしもないとても古いデータ）
        await ev(B, round => { const d = JSON.parse(localStorage.getItem('gohancho.v1')); d.draft = otherDraft(); if (round === 2){ delete d.mt; delete d.wh; } localStorage.setItem('gohancho.v1', JSON.stringify(d)); }, round);
        await A.waitForTimeout(1500);
        await settle(A, B);
        const va = await view(A), s = await saved(A);
        if (!one(va) || va.cook !== ia || !savedOne(s) || s.cook.ids.join() !== ia) bad.push(`(${round}) A ${JSON.stringify(va)} 決めた ${ia} saved ${s.cook && s.cook.ids.join()}/${s.draft && s.draft.ids.filter(Boolean).join()}`);
        for (const p of [A, B]){ await p.reload(); await ready(p); }
        await settle(A, B);
        const ra = await view(A), rb = await view(B), s2 = await saved(A);
        if (!one(ra) || !one(rb) || ra.cook !== ia || rb.cook !== ia || !savedOne(s2)) bad.push(`(${round}) 開き直し A ${JSON.stringify(ra)} B ${JSON.stringify(rb)} 決めた ${ia}`);
        eq([...A.errs, ...B.errs], [], `R174a(${round}) 例外なし`);
        await ctx.close();
    }
    eq(bad, [], 'R174a 前の版が書いた食い違い（決めた献立はこちら・下書きはあちら）: 今日も作り方も決めた献立。開き直しても同じ。決めた献立は変わらない（3回）');
    // (b) 開いたとき: 保存がすでに食い違っている（前の版が書いた）。決めた献立はそのまま、今日も決めた献立
    {
        const { ctx, A, B } = await pair();
        await ev(A, () => setTab('today'));
        const ia = await ev(A, decide);
        await A.waitForTimeout(900); await settle(A, B);
        const d = await ev(A, () => { const d = JSON.parse(localStorage.getItem('gohancho.v1')); d.draft = otherDraft(); return JSON.stringify(d); });
        await A.close(); await B.close();
        // 閉じているあいだに前の版が書いた中身で、開く
        const P = watch(await ctx.newPage()); await P.goto(URL_ + 'about-blank-404').catch(() => {});
        await P.evaluate(d => localStorage.setItem('gohancho.v1', d), d);
        await P.goto(URL_); await ready(P); await P.waitForTimeout(1200);
        const v = await view(P), s = await saved(P);
        ok(one(v) && v.cook === ia, `R174b 開いたときに食い違っていても、今日も作り方も決めた献立 ${JSON.stringify(v)} 決めた ${ia}`);
        ok(savedOne(s) && s.cook.ids.join() === ia, `R174b 保存も、決めた献立にそろう ${s.cook && s.cook.ids.join()}/${s.draft && s.draft.ids.filter(Boolean).join()}`);
        eq(P.errs, [], 'R174b 例外なし');
        await ctx.close();
    }
    // (c) こちらの版で、決めたあとに今日の案だけ作り直した（決めた献立は作り方に残す）ときは、開き直しても作り直した案のまま（そろえない）
    {
        const { ctx, A, B } = await pair();
        await ev(A, () => setTab('today'));
        const ia = await ev(A, decide);
        await A.waitForTimeout(900);
        const id2 = await ev(A, () => { const d = otherDraft(); S.draft = d; save(); saveNow(); return d.ids.filter(Boolean).join(); });
        await A.waitForTimeout(900); await settle(A, B);
        await A.reload(); await ready(A); await settle(A, B);
        const s = await saved(A);
        eq([s.cook.ids.join(), s.draft.ids.filter(Boolean).join()], [ia, id2], 'R174c この版で作り直した今日の案は、開き直してもそのまま（決めた献立も）');
        eq([...A.errs, ...B.errs], [], 'R174c 例外なし');
        await ctx.close();
    }
    // (d) 本物の前の版（v132）のタブが、0〜0.05秒あとに別の献立を決める
    if (hasRev(OLD.v132)){
        const bad = [];
        for (let round = 0; round < 3; round++){
            const { ctx, A, B } = await pair(null, URL_ + 'old-v132/');
            await ev(A, () => setTab('today')); await ev(B, () => setTab('today'));
            await settle(A, B);
            const decB = () => { setTab('today'); const a = menuIds().join(); for (let i = 0; i < 30 && menuIds().join() === a; i++) newMenu(); keepDraft(); render(); document.querySelector('[data-act=decide]').click(); return menuIds().join(); };
            // round 0・2 は、汁けの多い主菜（うどん・鍋など）で汁ものの席を空けた献立を決める（前の版は、この形の決めた献立を下書きなしでは出せず、新しい案を出していた）
            if (round !== 1){ await ev(A, () => { for (let i = 0; i < 300; i++){ newMenu(); if (session.menu.items.some(x => !x.r)) break; } keepDraft(); render(); saveNow(); }); await A.waitForTimeout(800); await settle(A, B); }
            const [ia, ib] = await Promise.all([ev(A, decide), B.waitForTimeout(round * 25).then(() => ev(B, decB))]);
            await A.waitForTimeout(1500);
            await settle(A, B);
            const va = await view(A), vb = await view(B), s = await saved(A);
            if (!one(va) || !one(vb) || va.cook !== vb.cook || !savedOne(s) || ![ia, ib].includes(va.cook)) bad.push(`(${round}) A ${JSON.stringify(va)} B ${JSON.stringify(vb)} saved ${s.cook && s.cook.ids.join()}/${s.draft && s.draft.ids.filter(Boolean).join()} 決めた ${ia} / ${ib}`);
            for (const p of [A, B]){ await p.reload(); await ready(p); }
            await settle(A, B);
            const ra = await view(A), rb = await view(B);
            if (!one(ra) || !one(rb) || ra.cook !== rb.cook) bad.push(`(${round}) 開き直し A ${JSON.stringify(ra)} B ${JSON.stringify(rb)}`);
            eq(A.errs, [], `R174d(${round}) 例外なし`);
            await ctx.close();
        }
        eq(bad, [], 'R174d 前の版（v132）のタブとほぼ同時に決めても、両方のタブ・開き直しても、作り方と今日が同じ献立（3回）');
    } else console.log('  R174d: git の履歴に v132 がないので、本物の前の版では試さない');
}

// ================= R176: とても古い版のタブの上書きで、決めた献立が消えた =================
if (!ONLY || ONLY === 'r176'){
    const run = async (tag, oldWriter, bUrl) => {
        const { ctx, A, B } = await pair(null, bUrl);
        await ev(A, () => setTab('today')); if (bUrl) await ev(B, () => setTab('today'));
        await settle(A, B);
        const pre = await saved(A);   // 古い版のタブが読んだときの中身（決める前）
        if (pre.draft) pre.draft = await ev(A, () => otherDraft());   // 古い版のタブで、料理を1つ入れかえた
        if (!bUrl){ await B.goto(URL_ + 'about-blank-404').catch(() => {}); B.errs.length = 0; }   // 書くのは古い版のタブだけ（この版のタブとしては開いていない）
        const ia = await ev(A, decide);
        await A.waitForTimeout(900);
        const t0 = await origin(A);
        await oldWriter(B, pre);
        await A.waitForTimeout(2500);
        await settle(A, bUrl ? B : A);
        const n = await noteOf(A, 'lost');
        ok(n && /消えました/.test(n), `R176 ${tag}: 決めた献立が消えたことを知らせる（黙って消さない） ${JSON.stringify(n)} 読み直し ${await origin(A) !== t0}`);
        if (n){
            await A.click('#gh-note-lost [data-gh="lostundo"]');
            await A.waitForTimeout(1500); await ready(A);
            const s = await saved(A);
            eq(s.cook && s.cook.ids.join(), ia, `R176 ${tag}: 「消えた分を戻す」で、決めた献立が戻る`);
        }
        eq(A.errs, [], `R176 ${tag} 例外なし`);
        await ctx.close();
    };
    // 古い版の書き方: 読んだときの中身（決めた献立なし）で、料理を1つ入れかえて上書きする。しるしは読んだときのまま
    const write = strip => async (B, pre) => { await B.evaluate(([pre, strip]) => { const d = JSON.parse(JSON.stringify(pre)); if (strip){ delete d.wh; delete d.mt; delete d.dels; delete d.mk; } localStorage.setItem('gohancho.v1', JSON.stringify(d)); }, [pre, strip]); };
    await run('しるしを読んだまま書く古い版', write(false));
    await run('しるしのない古い版', write(true));
    if (hasRev(OLD.v127)){
        await run('本物の v127', async B => { await ev(B, () => { window.__swapDirect = true; setTab('today'); const btn = document.querySelector('[data-act="reroll"][data-i="1"]') || document.querySelector('[data-act="reroll"]'); btn.click(); saveNow(); }); }, URL_ + 'old-v127/');
    } else console.log('  R176: git の履歴に v127 がないので、本物の前の版では試さない');
}

await b.close();
console.log(`tab38: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
