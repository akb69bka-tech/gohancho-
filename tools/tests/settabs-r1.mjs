#!/usr/bin/env node
// 設定のタブ分け（オーナー指示 11/09「設定の中の画面を、すべて各項目でタブ分けして表示する」）の回帰テスト
// （Playwright。使い方: node tools/tests/settabs-r1.mjs [http://localhost:8765/]）
//  T1 全項目がどこか1つのタブに1回だけ出る（漏れ・重複 0）。決めた分け方（SET_TABS）どおりの置き場所。まとまり（section）は1つのタブにだけ
//  T2 タブの切り替え: 押したタブの中身だけが出る（ほかは hidden）・選んだ印（aria-selected）・最後に開いたタブを覚える（開き直しても同じ）
//  T3 外からの導線: はじめての設定の「アレルギー対策へ」・アレルギー対策の「家族に登録」・主菜が出せないときの「設定」・特売の入口（saleSetup）・
//     条件のシートの「設定」・前の目次のキー（notify など）・session.setOpen の頼み → 正しいタブが開き、その欄が画面に見える（上のタブの列に隠れない）
//  T4 狭い幅（195〜430px）× 文字3段階 × 18言語（日本語＋17言語）: 横にはみ出さない・タブは 44px 以上・1行（語の途中で折れない・切れない）・重ならない・
//     アラビア語は右から並ぶ。青を使わない
//  T5 設定の値・保存の形が変わらない: タブを全部押しても S は同じ。古い版の保存データ（v125 の形）をそのまま読んで、各タブの欄に出る
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const KEY = 'gohancho.v1';
const BASE_STATE = {onboarded: true, firstUse: '2026-10-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]};
const until = (p, fn, arg) => p.waitForFunction(fn, arg, {timeout: 15000}).then(() => true, () => false);
const open = async ({w = 390, h = 844, state = BASE_STATE, setTab: st = null, onboard = false} = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(SEED));
    if (!onboard) await ctx.addInitScript(([s, KEY, st]) => { if (!localStorage.getItem(KEY)){ localStorage.setItem(KEY, JSON.stringify(s)); if (st) localStorage.setItem('gohancho.setTab', st); } }, [state, KEY, st]);
    else if (st) await ctx.addInitScript(st => { if (!sessionStorage.getItem('st0')){ sessionStorage.setItem('st0', '1'); localStorage.setItem('gohancho.setTab', st); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    return {p, ctx};
};
const goSettings = p => p.evaluate(() => { setTab('settings'); });
const cur = p => p.evaluate(() => { const v = [...document.querySelectorAll('#view .set-panel')].filter(x => !x.hidden).map(x => x.dataset.t); return v.length === 1 ? v[0] : v.join(','); });
// 欄が画面に見えている（上に残るタブの列の下〜画面の下の帯の上のあいだに、欄の頭がある）
const inView = (p, sel) => p.evaluate(sel => {
    const e = document.querySelector(sel); if (!e) return 'なし';
    if (e.closest('[hidden]')) return '隠れたタブの中';
    const r = e.getBoundingClientRect(), bar = document.querySelector('#view .set-tabs-bar').getBoundingClientRect(), nav = document.querySelector('nav.tabs');
    const bottom = nav ? nav.getBoundingClientRect().top : innerHeight;
    return r.top >= bar.bottom - 2 && r.top < bottom - 20 ? true : `top=${Math.round(r.top)} bar=${Math.round(bar.bottom)} bottom=${Math.round(bottom)}`;
}, sel);
// 少し待つ（スクロールのなめらかな動きが終わるまで）
const settle = p => p.waitForTimeout(700);

// 決めた分け方: タブ → まとまり（section）／代表の欄
const TABS = {
    family: {secs: ['family'], items: ['#allergy-card', '[data-act="alg-toggle"]', '[data-act="alg-family"]', '#family-profile', '[data-act="fam-add"]', '[data-act="wish-open"]', '[data-act="ask-open"]', '[data-act="servings"]']},
    food: {secs: ['food'], items: ['[data-act="toggle-avoid"]', '[data-act="toggle-avoid-fam"][data-v="alcohol"]', '[data-act="toggle-avoid-diet"][data-v="halal"]', '[data-act="toggle-avoid-diet"][data-v="vegi"]', '#avoid-input', '[data-act="avoid-swap"]', '#scarce-field', '#scarce-input']},
    menu: {secs: ['menu'], items: ['[data-act="country"]', '[data-act="staple-set"]', '[data-act="count"]', '#avoid-days', '#kitchen-card', '#kitchen-rice', '#seas-card']},
    mode: {secs: ['mode'], items: ['#salt-card', '[data-act="low-salt"]', '[data-act="night-shift"]', '#diet-card', '[data-act="diet-mode"]']},
    store: {secs: ['store'], items: ['[data-act="sale-new"]', '#cheap-set', '[data-act="cheap-tog"]']},
    display: {secs: ['display'], items: ['[data-act="ui-lang"]', '[data-act="text-size"]', '[data-act="open-at"]']},
    data: {secs: ['data'], items: ['#backup-card', '#backup-move', '#backup-text', '[data-act="export"]', '[data-act="import"]', '[data-act="import-file"]', '#backup-file', '[data-act="reset"]']},
    plan: {secs: ['plan', 'notify', 'help'], items: ['[data-act="paywall"]', '[data-act="timer-alert-set"]', '[data-act="ob-again"]', '#set-help a.btn, #set-help button.btn[data-doc], #set-help [data-act="doc"]']},
};

// ---- T1 漏れ・重複 ----
{
    const {p, ctx} = await open();
    await goSettings(p);
    const r = await p.evaluate(TABS => {
        const v = document.querySelector('#view .settings'), panels = [...v.querySelectorAll('.set-panel')];
        const out = {tabs: [...v.querySelectorAll('.set-tab')].map(x => x.dataset.k), panels: panels.map(x => x.dataset.t), outside: [], multi: [], secs: {}, items: {}, empty: []};
        // 押せるもの・入力・欄（id）は、タブの列ともどるボタン以外、どれも1つのタブの中にだけある
        v.querySelectorAll('[data-act],input,select,textarea,a[href],form,[id]').forEach(e => {
            if (e.closest('.set-tabs-bar,.settings-head')) return;
            const ps = panels.filter(x => x.contains(e));
            if (ps.length === 0 && !e.classList.contains('set-panel')) out.outside.push(e.outerHTML.slice(0, 80));
            if (ps.length > 1) out.multi.push(e.outerHTML.slice(0, 80));
        });
        // id の重複（同じ欄が2回出ていない）
        const ids = {}; v.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; }); out.dupIds = Object.entries(ids).filter(([, n]) => n > 1).map(([k]) => k);
        v.querySelectorAll('section.set-sec').forEach(s => { out.secs[s.id] = panels.filter(x => x.contains(s)).map(x => x.dataset.t); });
        for (const [tk, d] of Object.entries(TABS)) for (const sel of d.items){ const es = [...v.querySelectorAll(sel)]; out.items[sel] = {want: tk, got: [...new Set(es.map(e => (e.closest('.set-panel') || {}).dataset?.t || '-'))]}; }
        panels.forEach(x => { if (!x.querySelector('section.set-sec')) out.empty.push(x.dataset.t); });
        return out;
    }, TABS);
    ok(JSON.stringify(r.tabs) === JSON.stringify(Object.keys(TABS)), 'T1a タブの並び: ' + r.tabs.join(','));
    ok(JSON.stringify(r.panels) === JSON.stringify(Object.keys(TABS)), 'T1b タブの中身の並び: ' + r.panels.join(','));
    ok(r.outside.length === 0, 'T1c どのタブにも入っていない項目: ' + r.outside.slice(0, 5).join(' | '));
    ok(r.multi.length === 0, 'T1d 2つ以上のタブに入っている項目: ' + r.multi.slice(0, 5).join(' | '));
    ok(r.dupIds.length === 0, 'T1e 同じ欄（id）が2回出ている: ' + r.dupIds.join(','));
    ok(r.empty.length === 0, 'T1f 中身のないタブ: ' + r.empty.join(','));
    for (const [tk, d] of Object.entries(TABS)) for (const s of d.secs) ok(JSON.stringify(r.secs['set-' + s]) === JSON.stringify([tk]), `T1g まとまり set-${s} は ${tk} のタブだけ: ${JSON.stringify(r.secs['set-' + s])}`);
    ok(Object.keys(r.secs).length === Object.values(TABS).reduce((n, d) => n + d.secs.length, 0), 'T1h まとまりの数: ' + Object.keys(r.secs).join(','));
    for (const [sel, x] of Object.entries(r.items)) ok(x.got.length === 1 && x.got[0] === x.want, `T1i ${sel} は「${x.want}」のタブ: ${x.got.join(',') || 'なし'}`);
    await ctx.close();
}

// ---- T2 切り替え・覚える ----
{
    const {p, ctx} = await open();
    await goSettings(p);
    ok(await cur(p) === 'family', 'T2a はじめは「家族・アレルギー」: ' + await cur(p));
    const s0 = await p.evaluate(KEY => localStorage.getItem(KEY), KEY);
    for (const k of Object.keys(TABS)){
        await p.click(`#view .set-tab[data-k="${k}"]`);
        const r = await p.evaluate(k => ({
            vis: [...document.querySelectorAll('#view .set-panel')].filter(x => !x.hidden).map(x => x.dataset.t),
            sel: [...document.querySelectorAll('#view .set-tab[aria-selected="true"]')].map(x => x.dataset.k),
            secVis: [...document.querySelectorAll('#view section.set-sec')].filter(x => x.offsetParent !== null).map(x => x.id),
            mem: localStorage.getItem('gohancho.setTab'),
            ctl: document.querySelector(`#view .set-tab[data-k="${k}"]`).getAttribute('aria-controls'),
        }), k);
        ok(JSON.stringify(r.vis) === JSON.stringify([k]), `T2b ${k}: 出ている中身 ${r.vis.join(',')}`);
        ok(JSON.stringify(r.sel) === JSON.stringify([k]), `T2c ${k}: 選んだ印 ${r.sel.join(',')}`);
        ok(JSON.stringify(r.secVis) === JSON.stringify(TABS[k].secs.map(s => 'set-' + s)), `T2d ${k}: 見えているまとまり ${r.secVis.join(',')}`);
        ok(r.mem === k, `T2e ${k}: 覚えたタブ ${r.mem}`);
        ok(r.ctl === 'setp-' + k, `T2f ${k}: aria-controls ${r.ctl}`);
    }
    // 描き直し（タブの中で値を変える）でも、選んだタブのまま
    await p.click('#view .set-tab[data-k="mode"]');
    await p.click('#view [data-act="low-salt"]');
    ok(await cur(p) === 'mode', 'T2g 中で押して描き直しても同じタブ: ' + await cur(p));
    await p.click('#view [data-act="low-salt"]');
    const s0b = await p.evaluate(() => JSON.stringify({settings: S.settings}));   // 減塩を入れて切ると lowSalt:false が残る（前からの形）。ここから先はタブの切り替えだけ
    // 下まで読んでからタブを押すと、新しいタブの先頭へ（タブの列は上に残る）
    await p.click('#view .set-tab[data-k="family"]');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const stick = await p.evaluate(() => Math.round(document.querySelector('#view .set-tabs-bar').getBoundingClientRect().top));
    ok(stick >= -1 && stick <= 2, 'T2h 下までスクロールしても、タブの列は上に残る: top=' + stick);
    await p.click('#view .set-tab[data-k="data"]');
    ok(await inView(p, '#set-data') === true, 'T2i 下で押したタブの先頭が見える: ' + await inView(p, '#set-data'));
    // 開き直しても、最後に開いたタブ
    await p.reload(); await ready(p); await goSettings(p);
    ok(await cur(p) === 'data', 'T2j 開き直しても最後のタブ: ' + await cur(p));
    // 設定から出て戻っても同じ
    await p.click('#view [data-act="settings-back"]'); await p.click('header.top [data-act="settings"]');
    ok(await cur(p) === 'data', 'T2k もどる → 歯車でも最後のタブ: ' + await cur(p));
    // 保存データ（S）はタブの切り替えでは変わらない
    const s1 = await p.evaluate(() => JSON.stringify({settings: S.settings}));
    ok(JSON.parse(s1).settings && JSON.stringify(JSON.parse(s1).settings) === JSON.stringify(JSON.parse(s0b).settings), 'T2l 切り替えで S.settings が変わらない: ' + JSON.stringify(JSON.parse(s0b).settings) + ' → ' + JSON.stringify(JSON.parse(s1).settings));
    ok(Object.keys(JSON.parse(s0).settings).every(k => k in JSON.parse(s1).settings), 'T2l2 はじめにあった設定の値が消えない');
    // 覚えた値がこわれていても、先頭のタブで開く
    await p.evaluate(() => { localStorage.setItem('gohancho.setTab', 'xxx'); session.setTab = null; render(); });
    ok(await cur(p) === 'family', 'T2m 覚えた値がこわれていたら先頭: ' + await cur(p));
    await ctx.close();
}

// ---- T3 外からの導線 ----
{
    // はじめての設定 →「アレルギー対策へ」（覚えたタブが「データ」でも、アレルギー対策の欄へ）
    const {p, ctx} = await open({onboard: true, setTab: 'data'});
    await pickCountry(p, 'JP');
    await p.waitForSelector('[data-act="ob-next"]');
    for (let s = 0; s < 6 && !(await p.$('[data-act="ob-allergy"]')); s++){ const nx = await p.$('[data-act="ob-next"]'); if (!nx) break; await p.click('[data-act="ob-next"]'); await p.waitForTimeout(150); }
    const has = !!(await p.$('[data-act="ob-allergy"]'));
    ok(has, 'T3a はじめての設定に「アレルギー対策へ」がある');
    if (has){
        await p.click('[data-act="ob-allergy"]'); await until(p, () => tab === 'settings' && !sheet); await settle(p);
        ok(await cur(p) === 'family', 'T3a アレルギー対策へ → 家族・アレルギーのタブ: ' + await cur(p));
        ok(await inView(p, '#allergy-card') === true, 'T3a アレルギー対策の欄が見える: ' + await inView(p, '#allergy-card'));
    }
    await ctx.close();
}
{
    const {p, ctx} = await open({setTab: 'data'});
    // 主菜が出せないときの「設定」→ 苦手・食の決まり
    await p.evaluate(() => { const d = document.createElement('div'); d.id = 'nm-test'; d.innerHTML = noMainHelpHtml(); d.style.cssText = 'position:fixed;top:0;left:0;z-index:999;background:#fff'; document.body.append(d); });   // 描き直しで消えないように #view の外に置く（押したときの動きは同じ）
    await p.click('#nm-test [data-act="settings"]'); await p.evaluate(() => document.getElementById('nm-test').remove()); await settle(p);
    ok(await cur(p) === 'food', 'T3b 主菜が出せない →「設定」→ 苦手・食の決まりのタブ: ' + await cur(p));
    ok(await inView(p, '#set-food') === true, 'T3b 苦手な食材の欄が見える: ' + await inView(p, '#set-food'));
    // アレルギー対策の「家族に登録」→ 家族の欄（同じタブ）。ほかのタブを開いていても
    await p.evaluate(() => { setTabShow('display'); });
    await p.evaluate(() => { setTab('today'); });
    await p.evaluate(() => { setTab('settings'); setTabShow('family'); });
    await p.click('#view [data-act="alg-family"]'); await settle(p);
    ok(await cur(p) === 'family', 'T3c 家族に登録 → 家族・アレルギーのタブ: ' + await cur(p));
    ok(await inView(p, '#family-profile') === true, 'T3c 家族の欄が見える: ' + await inView(p, '#family-profile'));
    // 家族を足す → 足した人の欄が開く（タブはそのまま）
    const n0 = await p.evaluate(() => famMembers().length);
    await p.click('#view [data-act="fam-add"]');
    ok(await p.evaluate(() => famMembers().length) === n0 + 1 && await cur(p) === 'family', 'T3d 家族を追加 → 家族・アレルギーのタブのまま: ' + await cur(p));
    // 特売の入口（今日の画面の「よく行くスーパーを登録」など）→ スーパー
    await p.evaluate(() => { setTab('today'); saleSetup(); }); await settle(p);
    ok(await cur(p) === 'store', 'T3e 特売の入口 → スーパーのタブ: ' + await cur(p));
    ok(await inView(p, '#set-store') === true, 'T3e スーパーの欄が見える: ' + await inView(p, '#set-store'));
    // 条件のシートの「設定」→ 設定（最後に開いたタブ）
    await p.evaluate(() => { setTab('today'); openCondSheet(); });
    await p.waitForSelector('[data-act="cond-settings"]');
    await p.click('[data-act="cond-settings"]');
    ok(await p.evaluate(() => tab === 'settings' && !sheet) && await cur(p) === 'store', 'T3f 条件のシートの「設定」→ 設定（最後のタブ）: ' + await cur(p));
    // 前の目次のキー: まとまりのキー（notify・help）なら、そのまとまりのあるタブを開いてそこへ
    for (const [k, want] of [['notify', 'plan'], ['help', 'plan'], ['data', 'data'], ['display', 'display'], ['store', 'store']]){
        await p.evaluate(() => setTabShow('family'));
        await p.evaluate(k => setGo(k), k); await settle(p);
        ok(await cur(p) === want, `T3g setGo('${k}') → ${want}: ` + await cur(p));
        ok(await inView(p, '#set-' + k) === true, `T3g set-${k} が見える: ` + await inView(p, '#set-' + k));
    }
    // 欄の id でも（kitchen-card・diet-card・backup-card・scarce-field）
    for (const [id, want] of [['kitchen-card', 'menu'], ['diet-card', 'mode'], ['backup-card', 'data'], ['scarce-field', 'food'], ['seas-card', 'menu']]){
        await p.evaluate(() => { setTab('today'); });
        await p.evaluate(id => setGo(id), id); await settle(p);
        ok(await cur(p) === want, `T3h setGo('${id}') → ${want}: ` + await cur(p));
        ok(await inView(p, '#' + id) === true, `T3h #${id} が見える: ` + await inView(p, '#' + id));
    }
    // 前の形の頼み（session.setOpen = {まとまり: true}）も、そのタブを開く（テスト・特売の入口が使う）
    for (const [k, want] of [['store', 'store'], ['notify', 'plan'], ['menu', 'menu']]){
        await p.evaluate(k => { setTab('settings'); session.setOpen = {[k]: true}; render(); }, k);
        ok(await cur(p) === want, `T3i session.setOpen.${k} → ${want}: ` + await cur(p));
    }
    // 外から開いたタブも、覚えるタブになる
    ok(await p.evaluate(() => localStorage.getItem('gohancho.setTab')) === 'menu', 'T3j 外から開いたタブを覚える');
    await ctx.close();
}

// ---- T4 狭い幅 × 文字3段階 × 18言語・RTL・色 ----
{
    const LANGS = (process.env.LANGS || 'ja,en,de,es,fr,it,pt-BR,pl,tr,id,fil,vi,th,hi,ar,ko,zh-Hans,zh-Hant').split(',');
    const WS = [195, 240, 320, 360, 390, 430];
    const {p, ctx} = await open({w: 390});
    for (const L of LANGS){
        await p.evaluate(async L => { if (LANG !== L){ const n = ++uiLangSeq; await switchLang(L, n); } setTab('settings'); }, L);
        await until(p, L => LANG === L, L);
        for (const ts of [0, 1, 2]){
            await p.evaluate(ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); render(); }, ts);
            for (const w of WS){
                await p.setViewportSize({width: w, height: 760});
                for (const k of (w === 195 || w === 390 ? Object.keys(TABS) : ['family', 'plan'])){
                    await p.evaluate(k => setTabShow(k), k);
                    const r = await p.evaluate(() => {
                        const de = document.documentElement, sc = document.querySelector('#view .set-tabs'), bs = [...sc.querySelectorAll('.set-tab')];
                        const lh = parseFloat(getComputedStyle(bs[0]).lineHeight) || parseFloat(getComputedStyle(bs[0]).fontSize) * 1.2;
                        const bad = [];
                        bs.forEach((x, i) => {
                            const r = x.getBoundingClientRect(), sp = x.querySelector('span'), sr = sp.getBoundingClientRect();
                            if (r.height < 44 || r.width < 44) bad.push(`${x.dataset.k} 小さい ${Math.round(r.width)}x${Math.round(r.height)}`);
                            // 名前は1行。列の幅より長いときだけ2行まで。折れるのは語の切れ目（空白・「・」・&・/ のあと）だけ（タイ語は語の区切りを辞書で決めるので行の数だけ見る）
                            const lines = sr.height / lh;
                            if (lines > 2.3) bad.push(`${x.dataset.k} 3行以上 ${Math.round(sr.height)}`);
                            if (lines > 1.4 && r.width < sc.clientWidth - 8) bad.push(`${x.dataset.k} 列に余裕があるのに2行`);
                            if (lines > 1.4 && !/^th/.test(document.documentElement.lang)){
                                const tn = sp.firstChild, txt = tn.textContent, rg = document.createRange(); let prevTop = null;
                                for (let j = 0; j < txt.length; j++){ rg.setStart(tn, j); rg.setEnd(tn, j + 1); const rc = rg.getClientRects()[0]; if (!rc || !rc.width) continue;
                                    if (prevTop !== null && rc.top > prevTop + lh * 0.5 && !/[\s・·&/、,\-]/.test(txt[j - 1]) && !/[\s・·]/.test(txt[j])) bad.push(`${x.dataset.k} 語の途中で折れる「${txt.slice(0, j)}|${txt.slice(j)}」`);
                                    prevTop = rc.top; }
                            }
                            if (sp.scrollWidth > sp.clientWidth + 1) bad.push(`${x.dataset.k} 文字が切れる ${sp.scrollWidth}>${sp.clientWidth}`);
                            if (r.width > sc.clientWidth + 1) bad.push(`${x.dataset.k} 列より広い ${Math.round(r.width)}>${sc.clientWidth}`);
                            const n = bs[i + 1]; if (n){ const q = n.getBoundingClientRect(); if (Math.min(r.right, q.right) - Math.max(r.left, q.left) > 0.5) bad.push(`${x.dataset.k} と ${n.dataset.k} が重なる`); }
                            const cs = getComputedStyle(x); for (const c of [cs.backgroundColor, cs.color, cs.borderTopColor]){ const m = c.match(/\d+(\.\d+)?/g); if (m){ const [R, G, B] = m.map(Number); if (B > R + 40 && B > G + 20) bad.push(`${x.dataset.k} 青い色 ${c}`); } }
                        });
                        const rtl = getComputedStyle(sc).direction === 'rtl';
                        const order = bs.length > 1 ? (rtl ? bs[0].getBoundingClientRect().right > bs[1].getBoundingClientRect().right : bs[0].getBoundingClientRect().left < bs[1].getBoundingClientRect().left) : true;
                        const sel = sc.querySelector('[aria-selected="true"]').getBoundingClientRect(), a = sc.getBoundingClientRect();
                        const seen = sel.left >= a.left - 1 && sel.right <= a.right + 1;
                        // まとまりの見出しもはみ出さない（欄の中の小見出し .set-title は前からのもの。幅195px・文字もっと大きいのドイツ語の「Allergieschutz」は前から入りきらない）
                        const over = [...document.querySelectorAll('#view .set-panel:not([hidden]) .set-sec-h')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.slice(0, 20));
                        return {sw: de.scrollWidth, iw: innerWidth, bad, rtl, order, seen, over};
                    });
                    const tag = `${L} ${w}px 文字${ts} ${k}`;
                    ok(r.sw <= r.iw, `T4a ${tag}: 横にはみ出す ${r.sw}>${r.iw}`);
                    ok(r.bad.length === 0, `T4b ${tag}: ${r.bad.slice(0, 4).join(' / ')}`);
                    ok(r.order, `T4c ${tag}: 並びの向き（${r.rtl ? '右から' : '左から'}）`);
                    ok(L !== 'ar' || r.rtl, `T4d ${tag}: アラビア語は右から`);
                    ok(r.seen, `T4e ${tag}: 選んだタブが列の中に見える`);
                    ok(r.over.length === 0, `T4f ${tag}: 見出しがはみ出す ${r.over.join(' / ')}`);
                }
            }
        }
    }
    await ctx.close();
}

// ---- T5 古い版の保存データ（v125 の形）をそのまま読む・値を変えない ----
{
    const OLD = {onboarded: true, firstUse: '2026-09-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 4, servings: 3, avoid: ['なす', '@pork'], allergens: ['egg'], scarce: ['しらたき'], lowSalt: true, diet: true, nightShift: true, textSize: 1, openAt: 'decide', avoidDays: 10, kitchen: {burners: '1', oven: false, riceMin: 50}},
        family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: ['ピーマン'], allergy: []}, {id: 'f1', name: 'はな', role: 'child', avoid: ['えび'], allergy: ['えび']}]};
    const {p, ctx} = await open({state: OLD});
    const before = await p.evaluate(() => JSON.stringify(S.settings));
    await goSettings(p);
    const r = {};
    for (const k of Object.keys(TABS)){
        await p.click(`#view .set-tab[data-k="${k}"]`);
        r[k] = await p.evaluate(() => {
            const P = document.querySelector('#view .set-panel:not([hidden])'), q = s => P.querySelector(s);
            const on = s => { const e = q(s); return !!e && (e.checked === true || e.getAttribute('aria-pressed') === 'true'); };
            return {
                egg: on('[data-act="alg-toggle"][data-v="egg"]'), sv3: on('[data-act="servings"][data-v="3"]'), fam2: P.querySelectorAll('#family-profile [data-act="fam-name"]').length,
                nasu: on('[data-act="toggle-avoid"][data-v="なす"]'), pork: on('[data-act="toggle-avoid-fam"][data-v="pork"]'), scarce: !!q('[data-act="scarce-del"][data-v="しらたき"]'),
                c4: on('[data-act="count"][data-v="4"]'), d10: q('#avoid-days') ? q('#avoid-days').value : null, burn1: on('[data-act="kitchen"][data-k="burners"][data-v="1"]'), rice: q('#kitchen-rice') ? q('#kitchen-rice').value : null,
                salt: on('[data-act="low-salt"]'), diet: on('[data-act="diet-mode"]'), night: on('[data-act="night-shift"]'),
                ts1: on('[data-act="text-size"][data-v="1"]'), dec: on('[data-act="open-at"][data-v="decide"]'),
            };
        });
    }
    ok(r.family.egg && r.family.sv3 && r.family.fam2 >= 1, 'T5a 家族・アレルギー: 卵・3人・家族 ' + JSON.stringify(r.family));
    ok(r.food.nasu && r.food.pork && r.food.scarce, 'T5b 苦手・食の決まり: なす・豚肉のなかま・しらたき ' + JSON.stringify(r.food));
    ok(r.menu.c4 && r.menu.d10 === '10' && r.menu.burn1 && r.menu.rice === '50', 'T5c 献立: 4品・10日・コンロ1つ・50分 ' + JSON.stringify(r.menu));
    ok(r.mode.salt && r.mode.diet && r.mode.night, 'T5d モード: 減塩・ダイエット・夜勤明け ' + JSON.stringify(r.mode));
    ok(r.display.ts1 && r.display.dec, 'T5e 表示と言語: 文字「大きい」・いつも「決める」から ' + JSON.stringify(r.display));
    const after = await p.evaluate(() => JSON.stringify(S.settings));
    ok(before === after, 'T5f タブを全部押しても S.settings は同じ');
    const saved = await p.evaluate(KEY => Object.keys(JSON.parse(localStorage.getItem(KEY))).sort().join(','), KEY);
    ok(!/setTab/.test(saved), 'T5g 覚えたタブは保存データ（S）に入れない: ' + saved);
    // モードのタブでスイッチを切る → 保存の形は前と同じ（lowSalt を消す）
    await p.click('#view .set-tab[data-k="mode"]'); await p.click('#view [data-act="low-salt"]');
    ok(await p.evaluate(() => S.settings.lowSalt) !== true && await cur(p) === 'mode', 'T5h 減塩を切る（モードのタブのまま）');
    await ctx.close();
}

if (errs.length){ fails++; console.log('FAIL ページのエラー: ' + [...new Set(errs)].slice(0, 5).join(' | ')); }
await b.close();
console.log(fails ? `settabs-r1: FAIL ${fails}` : 'settabs-r1: 全部 OK');
process.exit(fails ? 1 : 0);
