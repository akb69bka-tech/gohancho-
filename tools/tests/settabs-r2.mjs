#!/usr/bin/env node
// 設定のタブ 第33回（R156・R157・R158）の回帰テスト（Playwright。使い方: node tools/tests/settabs-r2.mjs [http://localhost:8765/]）
//  C 幅195px × 文字3段階 × 18言語 × 8タブ: タブの列が横にはみ出すとき、まだタブがある側に ‹ ›（ぼかし .set-tabs-cue）が出る・ない側には出ない・
//    隣のタブが少しのぞく・選んだタブは列の中に全部見えて ‹ › の丸がかからない・中身が横にはみ出さない。› を押すと列が送られる。
//    ぼかしはページの地の色（--bg）・青を使わない。幅390pxも（のぞき・‹ ›）
//  K キーボード: role=tablist／tab・aria-selected・aria-controls。Tab で入れるのは選んだタブだけ（roving tabindex）。
//    → ← で隣のタブを開いて移る（端から反対の端へ回る）・Home／End・アラビア語（右から）は ← が次
//  S 外からの導線: 条件のシートの「設定」は、最後に開いたタブでなく「苦手・食の決まり」。主菜が出せないときの「設定」→ 苦手・食の決まり、
//    特売の入口 → スーパー、アレルギー対策の「家族に登録」→ 家族・アレルギー。‹ › はタブを変えない
//  G ドイツ語・幅195px・文字「大きい」「もっと大きい」: モードの夜勤明けの説明・データのタブが右へはみ出さない。文字は小さくしない（英語と同じ大きさ）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const KEY = 'gohancho.v1';
const BASE_STATE = {onboarded: true, firstUse: '2026-10-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]};
const TABS = ['family', 'food', 'menu', 'mode', 'store', 'display', 'data', 'plan'];
const LANGS = (process.env.LANGS || 'ja,en,de,es,fr,it,pt-BR,pl,tr,id,fil,vi,th,hi,ar,ko,zh-Hans,zh-Hant').split(',');
const until = (p, fn, arg) => p.waitForFunction(fn, arg, {timeout: 15000}).then(() => true, () => false);
const open = async ({w = 390, h = 760, state = BASE_STATE, setTab: st = null} = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(SEED));
    await ctx.addInitScript(([s, KEY, st]) => { if (!localStorage.getItem(KEY)){ localStorage.setItem(KEY, JSON.stringify(s)); if (st) localStorage.setItem('gohancho.setTab', st); } }, [state, KEY, st]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    return {p, ctx};
};
const lang = async (p, L) => { await p.evaluate(async L => { if (LANG !== L){ const n = ++uiLangSeq; await switchLang(L, n); } setTab('settings'); }, L); await until(p, L => LANG === L, L); };
const textSize = (p, ts) => p.evaluate(ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); render(); }, ts);
const cur = p => p.evaluate(() => { const v = [...document.querySelectorAll('#view .set-panel')].filter(x => !x.hidden).map(x => x.dataset.t); return v.length === 1 ? v[0] : v.join(','); });
// タブの列のようす
const rowState = p => p.evaluate(() => {
    const sc = document.querySelector('#view .set-tabs'), a = sc.getBoundingClientRect(), bs = [...sc.querySelectorAll('.set-tab')];
    const over = sc.scrollWidth > sc.clientWidth + 1, s = Math.abs(sc.scrollLeft), more = sc.scrollWidth - sc.clientWidth;
    const cue = d => { const c = document.querySelector(`#view .set-tabs-cue[data-dir="${d}"]`); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; };
    const vis = bs.map(x => { const r = x.getBoundingClientRect(); return Math.max(0, Math.min(r.right, a.right) - Math.max(r.left, a.left)) / r.width; });
    const act = sc.querySelector('[aria-selected="true"]'), ar = act.getBoundingClientRect();
    let cover = 0; document.querySelectorAll('#view .set-tabs-cue').forEach(c => { if (c.hidden) return; const i = c.querySelector('i').getBoundingClientRect(); cover = Math.max(cover, Math.min(i.right, ar.right) - Math.max(i.left, ar.left)); });
    // 中身がページの右・左へはみ出さない（横に送る列 .scroll の中は除く）
    const iw = innerWidth, out = [];
    document.querySelectorAll('#view .set-panel:not([hidden]) *').forEach(e => { const r = e.getBoundingClientRect(); if (!r.width || e.closest('.scroll')) return; if (r.right > iw + 0.5 || r.left < -0.5) out.push(`${e.tagName.toLowerCase()} ${Math.round(r.left)}〜${Math.round(r.right)}「${(e.textContent || '').trim().slice(0, 24)}」`); });
    return {over, startMore: s > 1, endMore: s < more - 1, prev: cue('prev'), next: cue('next'), partial: vis.filter(v => v > 0.02 && v < 0.98).length,
        actSeen: ar.left >= a.left - 1 && ar.right <= a.right + 1, cover, sw: document.documentElement.scrollWidth, iw, out};
});

// ---- C 幅195px: ‹ › とのぞき ----
{
    const {p, ctx} = await open({w: 195});
    let n = 0;
    for (const L of LANGS){
        await lang(p, L);
        for (const ts of [0, 1, 2]){
            await textSize(p, ts);
            for (const k of TABS){
                await p.evaluate(k => setGo(k), k); await p.waitForTimeout(20);
                const r = await rowState(p), tag = `${L} 195px 文字${ts} ${k}`; n++;
                ok(r.over, `C1 ${tag}: 8つのタブは幅195pxでは列に入りきらない（横に送る）`);
                ok(r.prev === r.startMore && r.next === r.endMore, `C2 ${tag}: ‹ › はまだタブがある側だけ（前${r.startMore}/${r.prev} 後${r.endMore}/${r.next}）`);
                ok(r.prev || r.next, `C3 ${tag}: ‹ › のどちらかが出る`);
                ok(r.partial >= 1, `C4 ${tag}: 隣のタブが少しのぞく`);
                ok(r.actSeen && r.cover <= 0.5, `C5 ${tag}: 選んだタブが列の中に見えて ‹ › がかからない（${Math.round(r.cover)}px）`);
                ok(r.sw <= r.iw && r.out.length === 0, `C6 ${tag}: 中身が横にはみ出さない ${r.sw}>${r.iw} ${r.out.slice(0, 2).join(' / ')}`);
            }
        }
    }
    ok(n === LANGS.length * 3 * TABS.length, 'C 組み合わせの数 ' + n);
    // › を押すと列が送られる（タブは変わらない）・‹ で戻る。アラビア語でも
    for (const L of ['ja', 'ar']){
        await lang(p, L); await textSize(p, 0);
        await p.evaluate(() => setGo('family')); await p.waitForTimeout(50);
        const s0 = await p.evaluate(() => Math.abs(document.querySelector('#view .set-tabs').scrollLeft));
        await p.click('#view .set-tabs-cue[data-dir="next"]'); await p.waitForTimeout(700);
        const s1 = await p.evaluate(() => Math.abs(document.querySelector('#view .set-tabs').scrollLeft));
        ok(s1 > s0 + 40 && await cur(p) === 'family', `C7 ${L}: › で列が送られる（${Math.round(s0)}→${Math.round(s1)}）・タブはそのまま: ` + await cur(p));
        const r = await rowState(p); ok(r.prev, `C7 ${L}: 送ったあとは ‹ が出る`);
        await p.click('#view .set-tabs-cue[data-dir="prev"]'); await p.waitForTimeout(700);
        const s2 = await p.evaluate(() => Math.abs(document.querySelector('#view .set-tabs').scrollLeft));
        ok(s2 < s1 - 40, `C7 ${L}: ‹ で戻る（${Math.round(s1)}→${Math.round(s2)}）`);
        // 指でスクロールしても ‹ › が合う（列の終わりまで送ると › が消える）
        await p.evaluate(() => { const sc = document.querySelector('#view .set-tabs'); sc.scrollLeft = getComputedStyle(sc).direction === 'rtl' ? -sc.scrollWidth : sc.scrollWidth; });
        await p.waitForTimeout(100);
        const e = await rowState(p); ok(!e.next && e.prev, `C8 ${L}: 列の終わりでは › が消えて ‹ だけ`);
    }
    // ぼかしの色はページの地の色・青を使わない
    const col = await p.evaluate(() => {
        const c = document.querySelector('#view .set-tabs-cue:not([hidden])'), cs = getComputedStyle(c), bg = getComputedStyle(document.body).backgroundColor;
        const page = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        const i = getComputedStyle(c.querySelector('i'));
        return {img: cs.backgroundImage, bg, page, colors: [cs.color, i.backgroundColor, i.borderTopColor]};
    });
    ok(/gradient/.test(col.img), 'C9 ‹ › はぼかし（グラデーション）: ' + col.img.slice(0, 60));
    const blue = col.colors.concat((col.img.match(/rgba?\([^)]*\)/g) || [])).filter(c => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return false; const [R, G, B] = m.map(Number); return B > R + 40 && B > G + 20; });
    ok(blue.length === 0, 'C9 青を使わない: ' + blue.join(' '));
    // 幅390px: 列がはみ出すときは ‹ › とのぞき
    for (const L of LANGS){
        await lang(p, L);
        for (const ts of [0, 1, 2]){
            await textSize(p, ts); await p.setViewportSize({width: 390, height: 760});
            for (const k of TABS){
                await p.evaluate(k => setGo(k), k); await p.waitForTimeout(20);
                const r = await rowState(p), tag = `${L} 390px 文字${ts} ${k}`;
                if (!r.over){ ok(!r.prev && !r.next, `C10 ${tag}: 列に入りきるときは ‹ › を出さない`); continue; }
                ok(r.prev === r.startMore && r.next === r.endMore && r.partial >= 1, `C10 ${tag}: ‹ ›・のぞき（前${r.startMore}/${r.prev} 後${r.endMore}/${r.next} のぞき${r.partial}）`);
            }
            await p.setViewportSize({width: 195, height: 760});
        }
    }
    // C11（ui50）: 字形が違う機械（GitHub など）でタブの幅が少し変わっても、のぞきが0にならない。タブの字の間を -0.6〜+0.9px 揺らして、
    // 列の端がタブとタブのすき間に来る場合も作る。18言語 × 390・360px × 文字0〜2 × 字の間7通り × タブ8（第46回: ko 390px 文字0 plan でのぞき0）
    {
        let n = 0; const bad = [];
        for (const L of LANGS){
            await lang(p, L);
            for (const w of [390, 360]) for (const ts of [0, 1, 2]){
                await textSize(p, ts); await p.setViewportSize({width: w, height: 760});
                const r = await p.evaluate(TABS => {
                    const st = document.head.appendChild(document.createElement('style')), out = [];
                    for (const ls of [-0.6, -0.35, -0.1, 0.15, 0.4, 0.65, 0.9]){
                        st.textContent = `#view .set-tab{letter-spacing:${ls}px}`;
                        for (const k of TABS){
                            setGo(k);
                            const sc = document.querySelector('#view .set-tabs'), a = sc.getBoundingClientRect(), bs = [...sc.querySelectorAll('.set-tab')];
                            const over = sc.scrollWidth > sc.clientWidth + 1, s = Math.abs(sc.scrollLeft), more = sc.scrollWidth - sc.clientWidth;
                            const cue = d => { const c = document.querySelector(`#view .set-tabs-cue[data-dir="${d}"]`); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; };
                            const partial = bs.map(x => { const q = x.getBoundingClientRect(); return Math.max(0, Math.min(q.right, a.right) - Math.max(q.left, a.left)) / q.width; }).filter(v => v > 0.02 && v < 0.98).length;
                            const ar = sc.querySelector('[aria-selected="true"]').getBoundingClientRect();
                            const good = !over || (cue('prev') === (s > 1) && cue('next') === (s < more - 1) && partial >= 1);
                            out.push({ls, k, good: good && ar.left >= a.left - 1 && ar.right <= a.right + 1, partial});
                        }
                    }
                    st.remove(); render(); return out;
                }, TABS);
                r.forEach(x => { n++; if (!x.good) bad.push(`${L} ${w}px 文字${ts} 字の間${x.ls} ${x.k} のぞき${x.partial}`); });
            }
        }
        ok(!bad.length && n === LANGS.length * 2 * 3 * 7 * TABS.length, `C11 タブの幅が少し変わっても ‹ ›・のぞき・選んだタブが見える（${n}通り）: ` + bad.slice(0, 6).join(' / '));
        await p.setViewportSize({width: 195, height: 760});
    }
    await ctx.close();
}

// ---- K キーボード ----
for (const L of ['ja', 'ar']){
    const {p, ctx} = await open({w: 320, setTab: 'family'});
    await lang(p, L); await p.evaluate(() => setGo('family'));
    const aria = await p.evaluate(() => {
        const tl = document.querySelector('#view .set-tabs'), bs = [...tl.querySelectorAll('.set-tab')];
        return {role: tl.getAttribute('role'), tabs: bs.every(x => x.getAttribute('role') === 'tab' && document.getElementById(x.getAttribute('aria-controls'))?.getAttribute('role') === 'tabpanel'),
            sel: bs.filter(x => x.getAttribute('aria-selected') === 'true').map(x => x.dataset.k), tab0: bs.filter(x => x.tabIndex === 0).map(x => x.dataset.k),
            cueHidden: [...document.querySelectorAll('#view .set-tabs-cue')].every(c => c.getAttribute('aria-hidden') === 'true' && c.tabIndex === -1)};
    });
    ok(aria.role === 'tablist' && aria.tabs, `K1 ${L}: role=tablist／tab／tabpanel`);
    ok(aria.sel.join() === 'family' && aria.tab0.join() === 'family', `K2 ${L}: 選んだタブだけ aria-selected・tabindex=0: ${aria.sel} / ${aria.tab0}`);
    ok(aria.cueHidden, `K3 ${L}: ‹ › は読み上げ・Tab キーから外す`);
    // 戻るボタンから Tab で、選んだタブに入る
    await p.focus('#view [data-act="settings-back"]'); await p.keyboard.press('Tab');
    ok(await p.evaluate(() => document.activeElement && document.activeElement.dataset.k) === 'family', `K4 ${L}: Tab で選んだタブに入る`);
    const nextKey = L === 'ar' ? 'ArrowLeft' : 'ArrowRight', prevKey = L === 'ar' ? 'ArrowRight' : 'ArrowLeft';
    const st = () => p.evaluate(() => ({f: document.activeElement && document.activeElement.dataset.k, t0: [...document.querySelectorAll('#view .set-tab')].filter(x => x.tabIndex === 0).map(x => x.dataset.k).join(), sel: document.querySelector('#view .set-tab[aria-selected="true"]').dataset.k}));
    const step = async (key, want, m) => { await p.keyboard.press(key); await p.waitForTimeout(30); const s = await st(), c = await cur(p);
        ok(s.f === want && s.t0 === want && s.sel === want && c === want, `K5 ${L}: ${m} → ${want}（フォーカス ${s.f}・tabindex0 ${s.t0}・選択 ${s.sel}・中身 ${c}）`); };
    await step(nextKey, 'food', nextKey);
    await step(nextKey, 'menu', nextKey);
    await step(prevKey, 'food', prevKey);
    await step('End', 'plan', 'End');
    await step(nextKey, 'family', '端から ' + nextKey + '（先頭へ回る）');
    await step(prevKey, 'plan', '先頭から ' + prevKey + '（末尾へ回る）');
    await step('Home', 'family', 'Home');
    // 移った先のタブは列の中に見える
    await step('End', 'plan', 'End');
    ok((await rowState(p)).actSeen, `K6 ${L}: キーで移ったタブが列の中に見える`);
    ok(await p.evaluate(() => localStorage.getItem('gohancho.setTab')) === 'plan', `K7 ${L}: キーで開いたタブも覚える`);
    // Tab で中身へ出る（タブの列の中で止まらない）
    await p.keyboard.press('Tab');
    ok(await p.evaluate(() => !!document.activeElement.closest('#setp-plan')), `K8 ${L}: タブから Tab で中身へ`);
    await ctx.close();
}

// ---- S 外からの導線 ----
{
    const {p, ctx} = await open({w: 390, setTab: 'data'});
    await p.evaluate(() => setTab('settings'));
    ok(await cur(p) === 'data', 'S0 最後に開いたタブ（データ）で開く: ' + await cur(p));
    await p.evaluate(() => { setTab('today'); openCondSheet(); });
    await p.waitForSelector('[data-act="cond-settings"]'); await p.click('[data-act="cond-settings"]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => tab === 'settings' && !sheet) && await cur(p) === 'food', 'S1 条件のシートの「設定」→ 苦手・食の決まり: ' + await cur(p));
    ok(await p.evaluate(() => { const r = document.querySelector('#view .set-tab[data-k="food"]').getBoundingClientRect(), a = document.querySelector('#view .set-tabs').getBoundingClientRect(); return r.left >= a.left - 1 && r.right <= a.right + 1; }), 'S1 苦手・食の決まりのタブが列の中に見える');
    // ほかの入口も、その欄のあるタブ
    await p.evaluate(() => setTabShow('plan'));
    await p.evaluate(() => { setTab('today'); const d = document.createElement('div'); d.innerHTML = '<button class="btn sm" data-act="settings" data-to="food" id="tst-nomain">x</button>'; document.getElementById('view').appendChild(d); });
    await p.click('#tst-nomain'); await p.waitForTimeout(300);
    ok(await cur(p) === 'food', 'S2 主菜が出せないときの「設定」（data-to=food）→ 苦手・食の決まり: ' + await cur(p));
    await p.evaluate(() => setTabShow('plan'));
    await p.evaluate(() => { setTab('today'); saleSetup(); }); await p.waitForTimeout(300);
    ok(await cur(p) === 'store', 'S3 特売の入口 → スーパー: ' + await cur(p));
    await p.evaluate(() => setTabShow('food'));
    await p.click('#view .set-tab[data-k="family"]'); await p.click('#view [data-act="alg-family"]'); await p.waitForTimeout(300);
    ok(await cur(p) === 'family', 'S4 アレルギー対策の「家族に登録」→ 家族・アレルギー: ' + await cur(p));
    // 歯車（入口の指定なし）は最後に開いたタブのまま
    await p.evaluate(() => setTabShow('display')); await p.evaluate(() => setTab('today'));
    await p.click('header [data-act="settings"], .gear[data-act="settings"]'); await p.waitForTimeout(200);
    ok(await cur(p) === 'display', 'S5 歯車 → 最後に開いたタブ（表示）: ' + await cur(p));
    await ctx.close();
}

// ---- G ドイツ語・幅195px・大きい文字 ----
{
    const {p, ctx} = await open({w: 195});
    const fs = {};
    for (const L of ['en', 'de']){
        await lang(p, L);
        for (const ts of [1, 2]){
            await textSize(p, ts);
            for (const k of ['mode', 'data']){
                await p.evaluate(k => setGo(k), k); await p.waitForTimeout(20);
                if (k === 'data') await p.evaluate(() => document.querySelectorAll('#view #setp-data details').forEach(d => { d.open = true; }));
                const r = await rowState(p), tag = `${L} 195px 文字${ts} ${k}`;
                ok(r.sw <= r.iw && r.out.length === 0, `G1 ${tag}: 右へはみ出さない ${r.sw}>${r.iw} ${r.out.slice(0, 3).join(' / ')}`);
                if (k === 'mode'){
                    const n = await p.evaluate(() => { const s = document.querySelector('#view [data-act="night-shift"]').closest('label').querySelector('span'), r = s.getBoundingClientRect(), c = s.closest('.set-group,.box,.field').getBoundingClientRect();
                        return {right: r.right, box: c.right, fs: parseFloat(getComputedStyle(s).fontSize), sw: s.scrollWidth, cw: s.clientWidth}; });
                    ok(n.right <= n.box + 0.5 && n.sw <= n.cw + 1, `G2 ${tag}: 夜勤明けの説明が枠の中で折り返す（${Math.round(n.right)}≦${Math.round(n.box)}）`);
                    fs[L + ts] = n.fs;
                }
            }
        }
    }
    ok(fs.de1 === fs.en1 && fs.de2 === fs.en2 && fs.de2 > fs.de1, 'G3 文字は小さくしない（英語と同じ大きさ）: ' + JSON.stringify(fs));
    await ctx.close();
}

if (errs.length){ fails++; console.log('FAIL ページのエラー: ' + [...new Set(errs)].slice(0, 5).join(' | ')); }
await b.close();
console.log(fails ? `settabs-r2: FAIL ${fails}` : 'settabs-r2: 全部 OK');
process.exit(fails ? 1 : 0);
