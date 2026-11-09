#!/usr/bin/env node
// 下のタブ「調理道具」（オーナーの指示 11/09）の回帰テスト（Playwright。使い方: node tools/tests/tooltab-r1.mjs [http://localhost:8814/]）
//  U1 下のタブ: 7つ（日本＋日本語）・6つ（ほかの言語）が、幅 195/260/320/360/390/430 × 文字3段階 × 主要言語で、全部画面に入り 44×44px 以上・横スクロールなし・名前が切れない
//     （17言語は幅 195/360/390 で名前が切れない・短い名前が消えない）
//  U2 3段の絞り込み: 調理法 → 道具 → 料理。調理法だけなら、その調理法の全部の道具の料理。チップは 44px 以上。タブを開いても・選んでも、献立・今日使う道具は変わらない
//  U3 21か国 × 各調理法で、除外（アレルゲン全種・ハラール・ベジ・ヴィーガン・お酒避け）に当たる料理が一覧に出ない
//  U4 「献立に入れる」: 押した料理の欄だけが変わる（主菜・副菜・汁もの。ご飯の欄も動かない）。形のちがう主菜は灰色で押せない。元に戻せる
//  U5 決めた献立は「変えますか？」と確かめる（やめると動かない・変えると押した欄だけ）
//  U6 全主菜（21か国）に道具の印があり、どれかの「調理法×道具」から引ける。R145 の個別（炒めご飯・食い違い・日本の火を使わない料理）
//  U7 料理を押すと作り方が開く。色に青を使わない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const KEY = 'gohancho.v1';
async function open(lang = 'ja', cc = 'JP', w = 390, h = 844, extra = {}){
    const ctx = await b.newContext({viewport: {width: w, height: h}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('tooltab', cc, lang, w)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lang + '/' + cc + ': ' + e.message));
    await p.clock.install({time: new Date('2026-11-09T18:10:00+09:00')});
    await p.addInitScript(([lang, KEY, cc, extra]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem(KEY, JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({country: cc, uiLang: lang, dishCount: 4, servings: 2, avoidSwap: true}, extra)})); } }, [lang, KEY, cc, extra]);
    await p.goto(URL_); await ready(p); await p.clock.runFor(800);
    await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); window.RESET0 = () => { avoidCtxFor.c = avoidCtxFor.g = avoidCtxFor.s = null; }; });
    return {ctx, p};
}
const rnd = n => Math.round(n * 10) / 10;

// ---------- U1 下のタブ ----------
const tabCheck = p => p.evaluate(async ts => {
    if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); TRAY_FIT.key = ''; TRAY_FIT.base = ''; render(); fitTabs(); await __tick();
    const nv = document.querySelector('nav.tabs'), bs = [...nv.querySelectorAll('button[data-tab]:not([hidden])')], bad = [], ico = nv.classList.contains('ico');
    bs.forEach(e => { const q = e.getBoundingClientRect(), k = e.dataset.tab;
        if (q.width < 43.5 || q.height < 43.5) bad.push(`${k} が小さい ${Math.round(q.width)}×${Math.round(q.height)}`);
        if (q.left < -0.5 || q.right > innerWidth + 0.5 || q.bottom > innerHeight + 0.5) bad.push(`${k} が画面の外`);
        const c = (q.left + q.right) / 2, m = (q.top + q.bottom) / 2, hit = document.elementFromPoint(c, m); if (!hit || !(hit === e || e.contains(hit))) bad.push(`${k} の真ん中が当たらない`);
        if (ico){ const s = e.querySelector('.tsn'); if (nv.classList.contains('tsn-off')) bad.push('短い名前が消えた'); else if (!s || !s.textContent.trim() || s.scrollWidth > s.clientWidth + 0.5) bad.push(`${k} の短い名前「${s && s.textContent}」が切れる`); }
        else { const s = e.querySelector('.tl'); if (s.scrollWidth > s.clientWidth + 0.5) bad.push(`${k} の名前「${s.textContent}」がはみ出す`);
            const g = document.createRange(); g.selectNodeContents(s); const lines = new Set([...g.getClientRects()].filter(x => x.width > .5).map(x => Math.round(x.top))).size; if (lines > tabWords(s.textContent).length) bad.push(`${k} の名前「${s.textContent}」が語の途中で折れる`); }
    });
    if (document.documentElement.scrollWidth > innerWidth + 1) bad.push('横スクロール');
    return {bad: [...new Set(bad)], n: bs.length, tools: bs.some(e => e.dataset.tab === 'tools'), rows: new Set(bs.map(e => Math.round(e.getBoundingClientRect().top))).size};
}, 0);
const tabCheckTs = (p, ts) => p.evaluate(async ts => { if (ts) S.settings.textSize = ts; else delete S.settings.textSize; applyTextSize(); render(); fitTabs(); await __tick(); }, ts);
{
    const W = [[195, 422], [260, 560], [320, 640], [360, 740], [390, 844], [430, 900]];
    const bad = [], rows = {};
    for (const lang of ['ja', 'en', 'de', 'fr', 'vi', 'ar', 'th', 'ko']){
        const {ctx, p} = await open(lang);
        for (const [w, h] of W){
            await p.setViewportSize({width: w, height: h});
            for (const ts of [0, 1, 2]){
                await tabCheckTs(p, ts);
                const r = await tabCheck(p);
                const want = lang === 'ja' ? 7 : 6;
                if (r.n !== want || !r.tools) bad.push(`${lang} ${w}: タブ ${r.n}（調理道具=${r.tools}）`);
                r.bad.forEach(x => bad.push(`${lang} ${w}/文字${ts} ${x}`));
                if (lang === 'ja') rows[w + '/' + ts] = r.rows;
            }
        }
        await ctx.close();
    }
    ok(!bad.length, 'U1 7タブ（日本語）・6タブ（ほかの言語）が 195〜430 × 文字3段階で画面に入り 44px 以上・名前が切れない: ' + bad.slice(0, 6).join(' / '));
    ok(rows['195/0'] === 2 && rows['320/0'] === 1 && rows['360/0'] === 1 && rows['430/2'] === 1, 'U1 幅195は2段・320以上は1段: ' + JSON.stringify(rows));
    // 17言語: 幅 195/360/390 × 文字ふつう・最大
    const bad2 = [];
    for (const lang of 'ar de en es fil fr hi id it ko pl pt-BR th tr vi zh-Hans zh-Hant'.split(' ')){
        const {ctx, p} = await open(lang);
        const nm = await p.evaluate(() => ({tl: document.querySelector('nav.tabs [data-tab=tools] .tl').textContent, tsn: document.querySelector('nav.tabs [data-tab=tools] .tsn').textContent}));
        if (/[ぁ-んァ-ヶ]/.test(nm.tl + nm.tsn) && !lang.startsWith('zh')) bad2.push(`${lang} 名前が日本語のまま ${nm.tl}/${nm.tsn}`);
        for (const [w, h] of [[195, 422], [360, 740], [390, 844]]) for (const ts of [0, 2]){
            await p.setViewportSize({width: w, height: h}); await tabCheckTs(p, ts);
            (await tabCheck(p)).bad.forEach(x => bad2.push(`${lang} ${w}/文字${ts} ${x}`));
        }
        await ctx.close();
    }
    ok(!bad2.length, 'U1 17言語で「調理道具」と全タブの名前が切れない・訳がある: ' + bad2.slice(0, 6).join(' / '));
}

// ---------- U2 3段の絞り込み ----------
{
    const {ctx, p} = await open('ja', 'JP', 390, 844);
    const before = await p.evaluate(() => ({ids: menuIds().join(), cook: JSON.stringify(S.cook || null), tool: session.tool}));
    await p.click('nav.tabs [data-tab=tools]'); await p.waitForSelector('#view .tt-cats [data-act=tt-cat]');
    ok(await p.evaluate(() => tab === 'tools' && document.querySelector('nav.tabs [data-tab=tools]').getAttribute('aria-selected') === 'true'), 'U2 下のタブ「調理道具」で開く');
    const cats = await p.$$eval('#view [data-act=tt-cat]', els => els.map(e => e.dataset.v));
    ok(['cold', 'grill', 'stirfry', 'fry', 'boil', 'simmer', 'steam', 'rice'].every(c => cats.includes(c)), 'U2 調理法の大枠8つ（火を使わない・焼く・炒める・揚げる・茹でる・煮る・蒸す・炊く）: ' + cats);
    ok(await p.$$eval('#view .tt-list .item', els => els.length) === 0 && await p.$('#view .tt-hint') !== null, 'U2 調理法を選ぶまでは料理の一覧を出さない');
    const bad = [];
    for (const c of cats){
        await p.click(`#view [data-act=tt-cat][data-v=${c}]`); await p.waitForTimeout(60);
        const r = await p.evaluate(c => {
            const o = {bad: [], tools: [...document.querySelectorAll('#view [data-act=tt-tool]')].map(e => e.dataset.v)};
            const cat = TT_CATS.find(x => x.k === c);
            o.tools.forEach(k => { if (!cat.tools.includes(k)) o.bad.push('道具 ' + k + ' は ' + c + ' にない'); });
            // 調理法だけ: 一覧の料理は、その調理法のどれかの道具（すべて見るを開いて全部）
            session.ttAll = new Set(TT_SLOTS.map(s => s + ':' + c + ':')); render();
            const ids = [...document.querySelectorAll('#view .tt-list [data-act=tt-add]')].map(e => e.dataset.id);
            const want = TT_SLOTS.flatMap(s => ttPool(s)).filter(r => ttIn(r, c)).map(r => r.id);
            if (ids.length !== want.length || want.some(id => !ids.includes(id))) o.bad.push(`${c}: 調理法だけの一覧 ${ids.length} / 期待 ${want.length}`);
            ids.forEach(id => { const r = byId(id); if (!ttCatsOf(r).includes(c) || !cat.tools.some(k => hasTool(r, k))) o.bad.push(c + ' に入らない ' + id); });
            o.union = ids.length;
            return o;
        }, c);
        bad.push(...r.bad);
        let uni = new Set();
        for (const k of r.tools){
            await p.click(`#view [data-act=tt-tool][data-v=${k}]`); await p.waitForTimeout(40);
            const q = await p.evaluate(([c, k]) => { session.ttAll = new Set(TT_SLOTS.map(s => s + ':' + c + ':' + k)); render();
                const ids = [...document.querySelectorAll('#view .tt-list [data-act=tt-add]')].map(e => e.dataset.id), bad = [];
                ids.forEach(id => { const r = byId(id); if (!ttIn(r, c, k)) bad.push(`${c}/${k} に入らない ${id}`); });
                const heads = [...document.querySelectorAll('#view .tt-sh h3')].map(h => h.textContent);
                const pressed = document.querySelector(`#view [data-act=tt-tool][data-v=${k}]`).getAttribute('aria-pressed');
                return {ids, bad, heads, pressed}; }, [c, k]);
            bad.push(...q.bad); q.ids.forEach(id => uni.add(id));
            if (q.pressed !== 'true') bad.push(`${c}/${k} 押した表示にならない`);
            if (!q.ids.length) bad.push(`${c}/${k} 料理が0なのにチップが出る`);
            if (!q.heads.every(h => /^(?:主菜|副菜|汁もの)/.test(h.trim()))) bad.push(`${c}/${k} 見出し ${q.heads}`);
            await p.click(`#view [data-act=tt-tool][data-v=${k}]`); await p.waitForTimeout(40);   // もう一度押すと外れる
        }
        if (uni.size !== r.union) bad.push(`${c}: 道具ごとの和 ${uni.size} ≠ 調理法だけ ${r.union}`);
    }
    ok(!bad.length, 'U2 調理法 → 道具 → 料理 の3段で絞れる（道具はその調理法のものだけ・調理法だけなら全道具の料理・主菜/副菜/汁ものの見出し）: ' + bad.slice(0, 6).join(' / '));
    // 一覧の行: 絵・名前・時間・アレルギーの札
    await p.evaluate(() => { S.settings.allergens = ['egg']; RESET0(); session.ttCat = 'fry'; session.ttTool = null; render(); });
    const rowInfo = await p.evaluate(() => { const rows = [...document.querySelectorAll('#view .tt-list .item')]; return {n: rows.length, th: rows.every(e => e.querySelector('.swap-th')), nm: rows.every(e => e.querySelector('.tt-open b').textContent.trim()), tm: rows.filter(e => e.querySelector('.tm')).length,
        alg: rows.filter(e => allergyBadge(byId(e.querySelector('[data-act=tt-add]').dataset.id))).every(e => e.querySelector('.dc-tags'))}; });
    ok(rowInfo.n > 5 && rowInfo.th && rowInfo.nm && rowInfo.tm >= rowInfo.n * 0.9 && rowInfo.alg, 'U2 一覧の行に絵・名前・おおよその時間・アレルギーの札: ' + JSON.stringify(rowInfo));
    await p.evaluate(() => { S.settings.allergens = []; RESET0(); render(); });
    // チップ・ボタンが 44px 以上・重ならない（幅195と390）
    for (const w of [195, 390]){
        await p.setViewportSize({width: w, height: 800}); await p.evaluate(() => { session.ttCat = 'grill'; session.ttTool = 'pan'; render(); });
        const t2 = await p.evaluate(() => { const els = [...document.querySelectorAll('#view .tt-sec button')].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height, t: e.textContent.trim().slice(0, 6)}; });
            const ov = []; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++){ const a = els[i], c = els[j]; if (a.x < c.x + c.w - 1 && c.x < a.x + a.w - 1 && a.y < c.y + c.h - 1 && c.y < a.y + a.h - 1) ov.push(a.t + '×' + c.t); }
            return {minH: Math.min(...els.map(e => e.h)), minW: Math.min(...els.map(e => e.w)), ov, right: Math.max(...els.map(e => e.x + e.w)), vw: innerWidth, sw: document.documentElement.scrollWidth}; });
        ok(t2.minH >= 43.5 && t2.minW >= 43.5 && !t2.ov.length && t2.right <= t2.vw + 0.5 && t2.sw <= t2.vw + 1, `U2 幅${w}: チップ・ボタンが44px以上・重ならない・はみ出さない: ` + JSON.stringify(Object.assign({}, t2, {ov: t2.ov.slice(0, 3)})));
    }
    const after = await p.evaluate(() => ({ids: menuIds().join(), cook: JSON.stringify(S.cook || null), tool: session.tool}));
    ok(JSON.stringify(after) === JSON.stringify(before), 'U2 タブを開いて選んでも、献立・決めた献立・今日使う道具は変わらない: ' + JSON.stringify([before, after]));
    // U7 料理を押すと作り方
    await p.setViewportSize({width: 390, height: 844});
    await p.evaluate(() => { session.ttCat = 'simmer'; session.ttTool = null; render(); });
    const id0 = await p.$eval('#view .tt-list .tt-open', e => e.dataset.id);
    await p.click('#view .tt-list .tt-open'); await p.waitForTimeout(300);
    ok(await p.evaluate(id0 => modalId === id0 && !!document.querySelector('#modal-root .sheet, #modal-root > *'), id0), 'U7 料理を押すと作り方が開く: ' + id0);
    ok(await p.evaluate(ids => menuIds().join() === ids, before.ids), 'U7 作り方を開いても献立は変わらない');
    await p.evaluate(() => { if (typeof closeModal === 'function') closeModal(); else { modalId = null; document.querySelector('#modal-root').innerHTML = ''; } });
    // 青を使わない（タブ・チップ・一覧の字・背景・枠）
    const blue = await p.evaluate(() => { const out = []; const isBlue = c => { const m = /rgba?\(([\d.]+), ([\d.]+), ([\d.]+)/.exec(c); if (!m) return false; const [r, g, bl] = m.slice(1).map(Number); return bl > r + 40 && bl > g + 20; };
        session.ttCat = 'grill'; session.ttTool = 'pan'; render();
        document.querySelectorAll('#view .tt-sec, #view .tt-sec *, nav.tabs [data-tab=tools], nav.tabs [data-tab=tools] *').forEach(e => { const cs = getComputedStyle(e); ['color', 'backgroundColor', 'borderTopColor', 'stroke', 'fill'].forEach(k => { if (isBlue(cs[k])) out.push(e.className + ':' + k + ':' + cs[k]); }); });
        return out; });
    ok(!blue.length, 'U7 調理道具のタブに青を使わない: ' + blue.slice(0, 3));
    await ctx.close();
}

// ---------- U3 21か国 × 各調理法 × 除外 ----------
{
    const CCS = 'JP US GB FR DE IT ES PL TR EG IN CN TW KR TH VN ID PH MX BR PE'.split(' ');
    const bad = []; let checked = 0, rowsSeen = 0, algs = [];
    for (const cc of CCS){
        const {ctx, p} = await open('ja', cc, 390, 844);
        const r = await p.evaluate(async () => {
            const out = {bad: [], n: 0, rows: 0, algs: Object.keys(ALG_DEF)};
            const sets = [...Object.keys(ALG_DEF).map(a => ({l: 'alg:' + a, al: [a], av: []})), ...['halal', 'vegi', 'vegan'].map(d => ({l: d, al: [], av: dietBundleToggle([], d)})), {l: 'alcohol', al: [], av: ['@alcohol']}];
            for (const set of sets){
                S.settings.allergens = set.al; S.settings.avoid = set.av; RESET0();
                const pool = TT_SLOTS.flatMap(s => ttPool(s));
                pool.forEach(r => { if (isAvoided(r) || allergyConflict(r) || slotOut(r)) out.bad.push(set.l + ':pool:' + r.id); });
                for (const c of TT_CATS){
                    session.ttCat = c.k; session.ttTool = null; session.ttAll = new Set(TT_SLOTS.map(s => s + ':' + c.k + ':'));
                    const html = viewToolsTab(), ids = [...html.matchAll(/data-act="tt-add" data-id="([^"]+)"/g)].map(m => m[1]);
                    out.rows += ids.length; out.n++;
                    ids.forEach(id => { const r = byId(id); if (!r || isAvoided(r) || allergyConflict(r) || S.hidden.includes(r.id)) out.bad.push(set.l + ':' + c.k + ':' + id); });
                    // 押しても入らない（一覧にない料理を強制しても）
                }
                // 除外された料理を tt-add に渡しても入らない
                const hit = (BROWSE[currentCountry()] || RECIPES).concat(RECIPES).find(r => r.main && toolsOf(r).length && (isAvoided(r) || allergyConflict(r)));
                if (hit && session.menu && session.menu.items[0]){ const before = menuIds().join(); const bt = document.createElement('button'); bt.dataset.act = 'tt-add'; bt.dataset.id = hit.id; document.querySelector('#view').appendChild(bt); bt.click(); if (menuIds().join() !== before) out.bad.push(set.l + ':forced:' + hit.id); bt.remove(); }
            }
            S.settings.allergens = []; S.settings.avoid = []; RESET0(); session.ttCat = null; session.ttAll = null;
            return out;
        });
        bad.push(...r.bad.map(x => cc + ':' + x)); checked += r.n; rowsSeen += r.rows; algs = r.algs;
        await ctx.close();
    }
    ok(!bad.length && checked >= 21 * 8 * 14 && rowsSeen > 1000, `U3 21か国×8調理法×除外（アレルゲン${algs.length}種・ハラール・ベジ・ヴィーガン・お酒避け）で、外れる料理が一覧に出ない（${checked}通り・${rowsSeen}行）: ` + bad.slice(0, 6).join(' / '));
}

// ---------- U4・U5 献立に入れる ----------
{
    const {ctx, p} = await open('ja', 'JP', 390, 844, {dishCount: 4});
    const snap = () => p.evaluate(() => JSON.stringify([session.menu.items.map(x => [x.slot, x.r && x.r.id]), (() => { try { const rc = riceRow(session.menu.items.filter(x => x.r)); return rc ? [rc.name, rc.go] : null; } catch (e) { return 'err'; } })()]));
    // 汁ものの欄がある、ふつうの主菜の献立から
    await p.evaluate(() => { for (let i = 0; i < 80; i++){ session.rejected.clear(); newMenu(); const m = session.menu.items; if (m[0].r && !isBowlMain(m[0].r) && m.some(x => x.slot === '汁物' && x.r) && m.some(x => x.slot === '副菜' && x.r)) break; } setTab('tools'); });
    const bad = [];
    for (const [slot, c] of [['主菜', 'grill'], ['副菜', 'boil'], ['汁物', 'simmer'], ['主菜', 'cold'], ['副菜', 'cold']]){
        await p.evaluate(c => { session.ttCat = c; session.ttTool = null; session.ttAll = new Set(TT_SLOTS.map(s => s + ':' + c + ':')); render(); }, c);
        const s0 = JSON.parse(await snap());
        const id = await p.evaluate(slot => { const e = [...document.querySelectorAll(`#view .tt-list[data-slot="${slot}"] [data-act=tt-add]:not([disabled])`)][0]; return e ? e.dataset.id : null; }, slot);
        if (!id){ bad.push(`${slot}/${c}: 押せる料理がない`); continue; }
        const idx = await p.evaluate(id => ttSlotIndex(byId(id)), id);
        await p.click(`#view [data-act=tt-add][data-id="${id}"]`); await p.waitForTimeout(250);
        const s1 = JSON.parse(await snap());
        if (s1[0][idx][1] !== id) bad.push(`${slot}/${c}: ${id} が入らない`);
        s0[0].forEach((x, i) => { if (i !== idx && JSON.stringify(x) !== JSON.stringify(s1[0][i])) bad.push(`${slot}/${c}: ほかの欄 ${i} が動いた ${x}→${s1[0][i]}`); });
        if (slot !== '主菜' && JSON.stringify(s0[1]) !== JSON.stringify(s1[1])) bad.push(`${slot}/${c}: ご飯の欄が動いた`);
        if (slot === '主菜' && JSON.stringify(s0[1]) !== JSON.stringify(s1[1])) bad.push(`${slot}/${c}: ご飯の欄が動いた（同じ形の主菜）`);
        if (!await p.evaluate(() => tab === 'tools')) bad.push('入れたあと、調理道具のタブのまま');
        // 元に戻す
        const u = await p.$('[data-act="toast-undo"]');
        if (!u) bad.push(`${slot}/${c}: 元に戻すが出ない`); else { await u.click(); await p.waitForTimeout(250); if (await snap() !== JSON.stringify(s0)) bad.push(`${slot}/${c}: 元に戻らない`); }
        // 入っている料理は押せない
    }
    ok(!bad.length, 'U4 「献立に入れる」で押した料理の欄だけ変わる（主菜・副菜・汁もの・ご飯の欄は動かない）・元に戻せる: ' + bad.slice(0, 6).join(' / '));
    // 形のちがう主菜は灰色で押せない・強制しても入らない・いまの献立の料理は押せない
    const off = await p.evaluate(() => {
        session.ttCat = 'stirfry'; session.ttTool = null; session.ttAll = new Set(TT_SLOTS.map(s => s + ':stirfry:')); render();
        const rows = [...document.querySelectorAll('#view .tt-list[data-slot="主菜"] .item')], out = {kind: 0, kindOk: 0, forced: [], same: 0, sameOk: 0};
        const cur = session.menu.items[0].r;
        rows.forEach(e => { const bt = e.querySelector('[data-act=tt-add]'), r = byId(bt.dataset.id);
            if (isBowlMain(r) !== isBowlMain(cur)){ out.kind++; if (bt.disabled && e.classList.contains('tool-off') && e.querySelector('.tool-off-note')) out.kindOk++;
                const before = menuIds().join(); const f = document.createElement('button'); f.dataset.act = 'tt-add'; f.dataset.id = r.id; document.querySelector('#view').appendChild(f); f.click(); if (menuIds().join() !== before) out.forced.push(r.id); } });
        session.ttCat = 'grill'; render();
        const mid = menuIds(); document.querySelectorAll('#view [data-act=tt-add]').forEach(bt => { if (mid.includes(bt.dataset.id)){ out.same++; if (bt.disabled) out.sameOk++; } });
        return out; });
    ok(off.kind > 0 && off.kind === off.kindOk && !off.forced.length, 'U4 形のちがう主菜は灰色・押せない・注記・強制しても入らない: ' + JSON.stringify(off));
    ok(off.same === off.sameOk, 'U4 いまの献立に入っている料理は押せない: ' + JSON.stringify(off));
    // 汁ものの欄がない献立では、汁ものは押せない
    const noSoup = await p.evaluate(() => { const m = session.menu, keep = m.items.slice(); m.items = m.items.filter(x => x.slot !== '汁物'); session.ttCat = 'simmer'; render();
        const bts = [...document.querySelectorAll('#view .tt-list[data-slot="汁物"] [data-act=tt-add]')], r = {n: bts.length, dis: bts.filter(b => b.disabled).length}; m.items = keep; render(); return r; });
    ok(noSoup.n > 0 && noSoup.n === noSoup.dis, 'U4 汁ものの欄がない日は、汁ものを入れられない（灰色）: ' + JSON.stringify(noSoup));
    // U5 決めた献立
    await p.evaluate(() => { setTab('today'); }); await p.waitForTimeout(200);
    await p.evaluate(() => { document.querySelector('[data-act=decide]').click(); }); await p.waitForTimeout(600);
    const dec = await p.evaluate(() => ({cook: JSON.stringify(S.cook && S.cook.ids), menu: menuIds().join(), decided: menuIsDecided()}));
    ok(dec.decided, 'U5 献立を決めた');
    await p.click('nav.tabs [data-tab=tools]'); await p.waitForTimeout(200);
    const res = [];
    for (const [slot, c] of [['副菜', 'boil'], ['主菜', 'grill']]){
        await p.evaluate(c => { session.ttCat = c; session.ttTool = null; session.ttAll = new Set(TT_SLOTS.map(s => s + ':' + c + ':')); render(); }, c);
        const id = await p.evaluate(slot => { const e = [...document.querySelectorAll(`#view .tt-list[data-slot="${slot}"] [data-act=tt-add]:not([disabled])`)][0]; return e ? e.dataset.id : null; }, slot);
        if (!id){ res.push(slot + ': 押せる料理がない'); continue; }
        const idx = await p.evaluate(id => ttSlotIndex(byId(id)), id);
        const c0 = await p.evaluate(() => ({cook: JSON.stringify(S.cook.ids), menu: menuIds()}));
        await p.click(`#view [data-act=tt-add][data-id="${id}"]`); await p.waitForTimeout(200);
        if (!await p.$('#sheet-root [data-act=tool-yes]')) res.push(slot + ': 確かめが出ない');
        if (await p.evaluate(c0 => JSON.stringify(S.cook.ids) !== c0.cook || menuIds().join() !== c0.menu.join(), c0)) res.push(slot + ': 確かめる前に動いた');
        await p.click('#sheet-root [data-act=sheet-close]'); await p.waitForTimeout(150);
        if (await p.evaluate(c0 => JSON.stringify(S.cook.ids) !== c0.cook, c0)) res.push(slot + ': やめても動いた');
        await p.click(`#view [data-act=tt-add][data-id="${id}"]`); await p.waitForTimeout(150); await p.click('#sheet-root [data-act=tool-yes]'); await p.waitForTimeout(300);
        const a = await p.evaluate(() => ({cook: S.cook.ids.slice(), menu: menuIds()}));
        const prevIds = JSON.parse(c0.cook), ci = prevIds.indexOf(c0.menu[idx]);
        a.menu.forEach((x, i) => { if (i !== idx && x !== c0.menu[i]) res.push(`${slot}: 画面の献立のほかの欄 ${i} が動いた`); });
        if (a.menu[idx] !== id) res.push(`${slot}: 変えたのに入らない`);
        a.cook.forEach((x, i) => { if (i !== ci && x !== prevIds[i]) res.push(`${slot}: 決めた献立のほかの料理 ${i} が動いた`); });
        if (ci >= 0 && a.cook[ci] !== id) res.push(`${slot}: 決めた献立に入らない`);
    }
    ok(!res.length, 'U5 決めた献立は「変えますか？」と確かめ、やめると動かず、変えると押した欄だけ: ' + res.slice(0, 5).join(' / '));
    await ctx.close();
}

// ---------- U6 全主菜に道具の印・R145 ----------
{
    const {ctx, p} = await open('ja', 'JP', 390, 844);
    const r = await p.evaluate(async () => {
        const all = [...RECIPES]; for (const c of COUNTRIES) if (c.cc !== 'JP'){ await loadBrowse(c.cc); all.push(...(BROWSE[c.cc] || [])); }
        const mains = all.filter(r => r.main), none = mains.filter(r => !toolsOf(r).length).map(r => r.id), unreach = all.filter(r => toolsOf(r).length && !TT_CATS.some(c => c.tools.some(k => ttIn(r, c.k, k)))).map(r => r.id);
        const pan = id => { const r = all.find(x => x.id === id); return r ? toolsOf(r).join() + '|' + ttCatsOf(r).join() : 'なし'; };
        const ids = ['id_nasigoreng', 'vn_comchien', 'vn_comrangduabo', 'kr_kimchibokkeumbap', 'soborodon', 'gb_lambchops', 'tarakopasta', 'chahan'];
        const jpCold = RECIPES.filter(r => ttIn(r, 'cold', 'cold')).map(r => r.id), jpColdMain = RECIPES.filter(r => r.main && ttIn(r, 'cold')).map(r => r.id);
        // 調理法×道具の料理数（日本・全体。主菜・副菜・汁もの。除外なし）
        const table = {}; for (const c of TT_CATS) for (const k of c.tools){ const jp = RECIPES.filter(r => ttIn(r, c.k, k)).length, tot = all.filter(r => ttIn(r, c.k, k)).length; if (tot) table[c.k + '/' + k] = [jp, tot]; }
        return {n: mains.length, none, unreach, tags: Object.fromEntries(ids.map(id => [id, pan(id)])), jpCold, jpColdMain, table};
    });
    ok(r.n >= 1000 && r.none.length === 0, `U6 全主菜（${r.n}品）に道具の印がある: ` + r.none.slice(0, 8));
    ok(r.unreach.length === 0, 'U6 印のある料理はどれも、どこかの「調理法×道具」から引ける: ' + r.unreach.slice(0, 8));
    for (const id of ['id_nasigoreng', 'vn_comchien', 'vn_comrangduabo', 'kr_kimchibokkeumbap', 'chahan']) ok(/(^|,)pan(,|\|)/.test(r.tags[id]) && /stirfry/.test(r.tags[id]) && !/(^|,)pot(,|\|)/.test(r.tags[id]), `U6 R145 炒めご飯 ${id} は「炒める・フライパン」（鍋ではない）: ${r.tags[id]}`);
    for (const id of ['soborodon', 'gb_lambchops']) ok(/(^|,)pan(,|\|)/.test(r.tags[id]), `U6 R145 食い違い ${id} にフライパン: ${r.tags[id]}`);
    ok(/boil/.test(r.tags.tarakopasta), 'U6 R145 たらこスパゲッティは「茹でる・鍋」: ' + r.tags.tarakopasta);
    ok(['tkg', 'nattogohan', 'onigiri_umekonbu'].every(id => r.jpColdMain.includes(id)) && ['hiyayakko'].every(id => r.jpCold.includes(id)) && r.jpCold.length >= 10, `U6 R145 日本の「火を使わない」に卵かけご飯・納豆ごはん・おにぎり・冷奴・サラダ（${r.jpCold.length}品・主菜 ${r.jpColdMain.length}品）: ` + r.jpCold.join());
    console.log('調理法/道具: [日本, 21か国]', JSON.stringify(r.table));
    await ctx.close();
}

ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(fails ? `NG ${fails}` : 'OK tooltab-r1');
process.exit(fails ? 1 : 0);
