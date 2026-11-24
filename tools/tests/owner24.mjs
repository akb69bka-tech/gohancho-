#!/usr/bin/env node
// オーナー回答（11/24・docs/owner-answers-20261124.md）の確かめ
//  使い方: node tools/tests/owner24.mjs [http://localhost:9331/]   （ONLY=W,SV,ST,TL,NT,A2,KO,SC でしぼる）
//  W  88A: 決める帯（今日の献立のすぐ下）に「1週間」。最初の画面（下のタブより上）に見える（390・360・320 × 文字0・2。決める帯がお膳の下に回る 320×568 は決めるボタンと同じ行・幅300px未満は出さない。
//          出すと決めるボタンの字が折り返して帯が高くなる大きい文字では出さない＝お膳の大きさを変えない。標準の文字では必ず出す）。押すと、プランがなければ作り、
//          「1週間の主菜」を開いてそこへ。今日の献立は変わらない。プランがあれば作り直さない
//  SV 89A: 設定を開くと、いちばん上（家族・アレルギーのタブの先頭）が「何人分つくるか」
//  ST 90A: 設定の「かんたん表示」: ふつうは今の8つ（日本＋日本語）。かんたんでは 今日・作る・材料・料理名から の4つだけ。ほかのタブにいたら今日へ。開き直しても残る。ふつうに戻すと8つ
//  TL 41A: 条件の「今日使う道具」と、道具のタブで選んだ道具は、開き直しても選んだまま。今日使う道具を選んでも、いまの献立は変わらない
//  NT 45A: うちにない道具（揚げ物鍋・オーブン「ない」）を設定すると、新しく作る献立（60回）・1週間プランに、その道具が要る料理が出ない。設定しても、いまの献立は変わらない
//  A2 49A: iPhone の Safari（ホーム画面に追加していない）では、記録のあと1回だけ「ホーム画面に追加すると…」。2回目の記録では出ない。ホーム画面から開いた・ほかのブラウザでは出ない
//  KO 65A: 食の決まりに「コーシャ向け」。押すと、21か国のどの料理でも、出してよい料理に豚・えび・かに・いか・たこ・貝（アレルゲンの判定も）がなく、
//          1つの料理に肉と乳製品がそろわない（置き換えたあとも）。新しく作る献立（各国20回）で、肉の料理と乳製品の料理が同じ献立に入らない（取りこぼしの点検）
//  SC 70A: 台湾・ベジタリアン向けで、沙茶醬の料理（沙茶空心菜）は出して、🔍（袋の表示を確認）が付く
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_ } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else console.log('ok  ', m.split(': ')[0]); };
const b = await chromium.launch(LAUNCH);
const open = async (o = {}) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: o.h || 844}, serviceWorkers: 'block', userAgent: o.ua, hasTouch: !!o.ua});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me|revenuecat|jsdelivr/, r => r.abort());
    await ctx.addInitScript(([st, stand]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } if (stand) Object.defineProperty(navigator, 'standalone', {value: true}); },
        [Object.assign({onboarded: true, firstUse: '2026-11-01', settings: Object.assign({country: o.cc || 'JP', uiLang: o.lang || 'ja', dishCount: 3, servings: 2}, o.ts ? {textSize: o.ts} : {}, o.set || {})}, o.st || {}), !!o.standalone]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_);
    await p.waitForFunction(cc => typeof GH !== 'undefined' && GH.booted && currentCountry() === cc && document.querySelector('#view .tray'), o.cc || 'JP', {timeout: 40000});
    await p.waitForTimeout(300);
    return {p, ctx};
};

if (want('W')){
    const bad = [];
    for (const [w, h] of [[390, 844], [360, 740], [320, 568], [195, 422]]) for (const ts of [0, 2]){
        const {p, ctx} = await open({w, h, ts});
        const r = await p.evaluate(() => { const bt0 = document.querySelector('#view .decide-bar [data-act="week-quick"]'), bt = bt0 && bt0.getClientRects().length ? bt0 : null, nav = document.querySelector('nav.tabs').getBoundingClientRect(); if (!bt) return {none: true};
            const q = bt.getBoundingClientRect(), dec = document.querySelector('#view .decide-bar .big-decide').getBoundingClientRect(), tr = document.querySelector('#view .tray').getBoundingClientRect();
            return {vis: q.width >= 40 && q.height >= 44 && q.top >= 0 && q.bottom <= nav.top + .5 && q.top >= tr.bottom - 1, sameRow: Math.abs(q.top - dec.top) < 2 || q.top >= dec.bottom - 1, aria: bt.getAttribute('aria-label'), w: Math.round(q.width), h: Math.round(q.height), top: Math.round(q.top), navTop: Math.round(nav.top)}; });
        // 幅300px未満は出さない（「この献立に決定」が細くなりすぎる）。決める帯がお膳の下に回る画面（bar-static: 320×568 など）は、決めるボタンと同じ行
        const st = await p.evaluate(() => document.body.classList.contains('bar-static'));
        // 出すと決めるボタンの字が折り返して帯が高くなるとき（文字の大きさ・言葉による）は出さない（wq-off）。出しているときは、帯の高さが出さないときと同じ
        const hh = await p.evaluate(() => { const bar = document.querySelector('#view .decide-bar'); const off0 = bar.classList.contains('wq-off'); bar.classList.add('wq-off'); const h0 = bar.getBoundingClientRect().height; bar.classList.remove('wq-off'); const h1 = bar.getBoundingClientRect().height; if (off0) bar.classList.add('wq-off'); return {off: off0, same: Math.abs(h1 - h0) < .5}; });
        if (w < 300){ if (!r.none && r.w > 0) bad.push(`${w} 文字${ts} 出ている ${JSON.stringify(r)}`); }
        else if (hh.off){ if (ts === 0) bad.push(`${w} 文字${ts} 標準の文字で出ない ${JSON.stringify(r)}`); else if (hh.same) bad.push(`${w} 文字${ts} 帯が高くならないのに出さない`); }
        else if (r.none || !hh.same || !(r.vis || (st && r.sameRow && r.h <= 90)) || r.aria !== '1週間分を考える') bad.push(`${w} 文字${ts} ${JSON.stringify(r)} ${JSON.stringify(hh)}`);
        await ctx.close();
    }
    const {p, ctx} = await open({});
    const t1 = await p.evaluate(async () => { const tick = n => new Promise(r => setTimeout(r, n)); const m0 = JSON.stringify(menuIds()), w0 = !!S.week;
        document.querySelector('#view [data-act="week-quick"]').click(); await tick(500);
        const fd = document.querySelector('details.fold[data-fold="week"]'), q = fd && fd.getBoundingClientRect();
        const r = {m0, m1: JSON.stringify(menuIds()), w0, w1: !!(S.week && S.week.days.length), open: !!(fd && fd.open), inView: !!q && q.top < innerHeight * .5 && q.bottom > 0, days: S.week ? JSON.stringify(S.week.days.map(x => x.id)) : ''};
        window.scrollTo(0, 0); await tick(200); document.querySelector('#view [data-act="week-quick"]').click(); await tick(400);
        r.days2 = S.week ? JSON.stringify(S.week.days.map(x => x.id)) : ''; r.m2 = JSON.stringify(menuIds()); return r; });
    ok(!bad.length && !t1.w0 && t1.w1 && t1.open && t1.inView && t1.m0 === t1.m1 && t1.m1 === t1.m2 && t1.days === t1.days2, 'W 88A 決める帯の「1週間」が最初の画面に見え、押すと1週間プランを作って開く（今日の献立は変わらない・2回目は作り直さない）: ' + JSON.stringify({bad: bad.slice(0, 4), t1}));
    await ctx.close();
}
if (want('SV')){
    const {p, ctx} = await open({});
    const r = await p.evaluate(async () => { setTab('settings'); await new Promise(r => setTimeout(r, 200)); const pn = document.querySelector('#view .set-panel:not([hidden])'), g = pn && pn.querySelector('.set-body > *'); return {tab: pn && pn.dataset.t, first: g && g.id, txt: g && g.textContent.slice(0, 20)}; });
    ok(r.tab === 'family' && r.first === 'sv-card' && /何人分/.test(r.txt), 'SV 89A 設定のいちばん上が「何人分つくるか」: ' + JSON.stringify(r));
    await ctx.close();
}
if (want('ST')){
    const {p, ctx} = await open({});
    const vis = () => p.evaluate(() => [...document.querySelectorAll('nav.tabs button[data-tab]')].filter(b => !b.hidden && b.getClientRects().length).map(b => b.dataset.tab));
    const v0 = await vis();
    await p.evaluate(() => setTab('world')); await p.waitForTimeout(200);
    await p.evaluate(async () => { setTab('settings'); await new Promise(r => setTimeout(r, 150)); setTabShow('display'); await new Promise(r => setTimeout(r, 150)); });
    const chips = await p.evaluate(() => [...document.querySelectorAll('#view [data-act="simple-tabs"]')].map(e => e.textContent + ':' + e.getAttribute('aria-pressed')));
    await p.evaluate(() => { tab = 'world'; document.querySelector('#view [data-act="simple-tabs"][data-v="1"]').click(); }); await p.waitForTimeout(300);
    const v1 = await vis(), cur = await p.evaluate(() => tab);
    await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view'), null, {timeout: 30000}); await p.waitForTimeout(300);
    const v2 = await vis();
    const wid = await p.evaluate(() => { const n = document.querySelector('nav.tabs'), bs = [...n.querySelectorAll('button[data-tab]:not([hidden])')]; return {cols: getComputedStyle(n.querySelector('.in')).gridTemplateColumns.split(' ').length, over: bs.some(x => x.getBoundingClientRect().right > innerWidth + .5)}; });
    await p.evaluate(async () => { setTab('settings'); await new Promise(r => setTimeout(r, 150)); setTabShow('display'); await new Promise(r => setTimeout(r, 150)); document.querySelector('#view [data-act="simple-tabs"][data-v="0"]').click(); }); await p.waitForTimeout(300);
    const v3 = await vis();
    ok(v0.length === 8 && JSON.stringify(v1) === '["today","cook","fridge","name"]' && cur !== 'world' && JSON.stringify(v2) === JSON.stringify(v1) && wid.cols === 4 && !wid.over && v3.length === 8 && chips.length === 2, 'ST 90A かんたん表示: ふつう8つ → かんたん4つ（今日・作る・材料・料理名から）・開き直しても残る・ふつうに戻すと8つ: ' + JSON.stringify({v0, chips, v1, cur, v2, wid, v3}));
    await ctx.close();
}
if (want('TL')){
    const {p, ctx} = await open({});
    const r = await p.evaluate(async () => { const tick = n => new Promise(r => setTimeout(r, n)); const m0 = JSON.stringify(menuIds()); openCondSheet(); await tick(200);
        const c = document.querySelector('#sheet-root [data-act="tool-set"]'); const k = c && c.dataset.k; if (c) c.click(); await tick(200); closeSheet();
        setTab('tools'); await tick(300); const cat = document.querySelector('#view [data-act="tt-cat"]'); const ck = cat && cat.dataset.v; if (cat) cat.click(); await tick(300);
        const tl = document.querySelector('#view [data-act="tt-tool"]'); const tk = tl && tl.dataset.v; if (tl) tl.click(); await tick(200);
        return {k, ck, tk, m0, m1: JSON.stringify(menuIds())}; });
    await p.reload(); await p.waitForFunction(() => typeof GH !== 'undefined' && GH.booted && document.querySelector('#view'), null, {timeout: 30000}); await p.waitForTimeout(300);
    const r2 = await p.evaluate(() => ({tool: session.tool, c: session.ttCat, t: session.ttTool}));
    ok(r.k && r.ck && r2.tool === r.k && r2.c === r.ck && r2.t === (r.tk || null) && r.m0 === r.m1, 'TL 41A 選んだ道具（今日使う道具・道具のタブ）は開き直しても選んだまま。選んでも献立は変わらない: ' + JSON.stringify({r, r2}));
    await ctx.close();
}
if (want('NT')){
    const {p, ctx} = await open({});
    const r = await p.evaluate(async () => { const tick = n => new Promise(r => setTimeout(r, n));
        const m0 = JSON.stringify(menuIds()); setTab('settings'); await tick(150); setTabShow('menu'); await tick(150);
        const chip = document.querySelector('#view [data-act="kitchen-notool"][data-v="deepfry"]'); if (chip) chip.click(); await tick(150);
        const ov = document.querySelector('#view [data-act="kitchen"][data-k="oven"][data-v="0"]'); if (ov) ov.click(); await tick(150);
        setTab('today'); await tick(200); const m1 = JSON.stringify(menuIds());
        const need = r => noToolOut(r), bad = [], seen = new Set(); let n = 0;
        for (let i = 0; i < 60; i++){ session.rejected.clear(); newMenu(); (session.menu.items || []).forEach(x => { if (x.r){ seen.add(x.r.id); n++; if (toolsOf(x.r).some(k => k === 'deepfry' || k === 'oven') && need(x.r)) bad.push(x.r.id); } }); }
        S.week = null; makeWeek(); const wk = S.week.days.map(x => byId(x.id)).filter(r => r && need(r)).map(r => r.id);
        const pool = RECIPES.filter(r => toolsOf(r).includes('deepfry') || toolsOf(r).includes('oven')).length;
        return {chip: !!chip, ov: !!ov, kitchen: S.settings.kitchen, m0, m1, bad: [...new Set(bad)], wk, n, uniq: seen.size, pool}; });
    ok(r.chip && r.ov && r.kitchen.noTools.includes('deepfry') && r.kitchen.oven === false && r.m0 === r.m1 && !r.bad.length && !r.wk.length && r.pool > 0 && r.n > 100, 'NT 45A うちにない道具（揚げ物鍋・オーブン）の料理は、新しく作る献立60回・1週間プランに出ない。設定してもいまの献立は変わらない: ' + JSON.stringify(r));
    await ctx.close();
}
if (want('A2')){
    const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
    const CRIOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1';
    const run = async o => { const {p, ctx} = await open(o); const r = await p.evaluate(async () => { const tick = n => new Promise(r => setTimeout(r, n)); const ids = menuIds().filter(Boolean);
        record(ids[0], '主菜'); render(); await tick(900); const a = sheet && sheet.kind; const txt = document.querySelector('#sheet-root') ? document.querySelector('#sheet-root').innerText.slice(0, 40) : ''; if (sheet) closeSheet(); await tick(100);
        record(ids[1] || ids[0], '副菜', addDays(TODAY, -1)); render(); await tick(900); return {first: a, txt, second: sheet && sheet.kind, tip: S.settings.a2hsTip}; }); await ctx.close(); return r; };
    const ios = await run({ua: IOS}), cri = await run({ua: CRIOS}), sta = await run({ua: IOS, standalone: true}), pc = await run({});
    ok(ios.first === 'a2hs' && /ホーム画面/.test(ios.txt) && !ios.second && ios.tip && !cri.first && !sta.first && !pc.first, 'A2 49A iPhone の Safari だけ、記録のあと1回だけ「ホーム画面に追加すると…」（Chrome・ホーム画面から・パソコンでは出ない）: ' + JSON.stringify({ios, cri, sta, pc}));
}
if (want('KO')){
    const CCS = (process.env.CCS || 'JP,US,GB,FR,DE,IT,ES,PL,TR,EG,IN,CN,TW,KR,TH,VN,ID,PH,MX,BR,PE').split(',');
    const bad = [], sum = [];
    for (const cc of CCS){
        const {p, ctx} = await open({cc, lang: cc === 'JP' ? 'ja' : 'en'});
        const r = await p.evaluate(async () => { const tick = n => new Promise(r => setTimeout(r, n));
            setTab('settings'); await tick(150); setTabShow('food'); await tick(150);
            const chip = document.querySelector('#view .diet-bundle[data-v="kosher"]'); if (!chip) return {nochip: true};
            chip.click(); await tick(300); setTab('today'); await tick(200);
            const SHELL = ['crustacean', 'mollusc', 'shrimp', 'crab', 'squid', 'abalone', 'shellfish'].filter(id => ALG_DEF[id]);
            const out = [], mix = []; let shown = 0;
            for (const r0 of RECIPES){ if (isAvoided(r0)) continue; shown++; const r = swappedRecipe(r0) || r0; const its = (r.items || []).concat(seasItems(r)).filter(i => !i.opt);
                const MUSH = /mushroom|きのこ|茸|버섯|เห็ด|nấm|jamur|kabute|grzyb|mantar|champi|pilz|fungh|cogumelo|hongo|蘑菇|菇|मशरूम|فطر|setas?\b/i;   // ひらたけ（oyster mushroom）は貝ではない
                const hit = its.filter(i => !MUSH.test(algTok(i).t) && (inFam('pork', i) || inFam('shellfish', i) || SHELL.some(id => [1, 2, 3].includes(algKind(id, i))) || (ALG_DEF.pork && [1, 2, 3].includes(algKind('pork', i)))));
                if (hit.length) out.push(r.id + ':' + hit.map(i => i.name).join('/'));
                if (kosherMix(r0)) mix.push(r.id); }
            const pair = []; let menus = 0;
            for (let i = 0; i < 20; i++){ session.rejected.clear(); newMenu(); const rs = (session.menu.items || []).map(x => x.r).filter(Boolean); menus++;
                for (let a = 0; a < rs.length; a++) for (let c = a + 1; c < rs.length; c++) if (kosherClash(rs[a], rs[c])) pair.push(rs[a].id + '+' + rs[c].id); }
            return {on: kosherOn(), shown, total: RECIPES.length, out: out.slice(0, 5), nOut: out.length, mix: mix.slice(0, 5), pair: [...new Set(pair)].slice(0, 5), menus}; });
        if (r.nochip || r.on !== true || r.nOut || r.mix.length || r.pair.length || !r.shown) bad.push(`${cc} ${JSON.stringify(r)}`);
        sum.push(`${cc}:${r.shown}/${r.total}`);
        await ctx.close();
    }
    console.log('    コーシャで出せる料理: ' + sum.join(' '));
    ok(!bad.length, `KO 65A コーシャ向け（${CCS.length}か国）: 出してよい料理に豚・えび・かに・いか・たこ・貝がなく、肉と乳製品の料理もなく、献立に肉の料理と乳製品の料理が同居しない（各国20回）: ` + bad.slice(0, 4).join(' || '));
}
if (want('SC')){
    const {p, ctx} = await open({cc: 'TW', lang: 'zh-Hant', set: {avoid: ['@pork', '@chicken', '@beef', '@fish', '@shellfish']}});
    const r = await p.evaluate(() => { const r = byId('tw_shacha_kongxincai'); return {av: r ? isAvoided(r) : null, may: r ? dietMayHits(r) : null}; });
    ok(r.av === false && r.may && r.may.length > 0, 'SC 70A 台湾・ベジタリアンで、沙茶醬の料理は出して 🔍（袋の表示を確認）: ' + JSON.stringify(r));
    await ctx.close();
}
ok(errs.length === 0, '例外なし: ' + errs.slice(0, 3).join(' / '));
await b.close();
console.log(`\nowner24: ${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
