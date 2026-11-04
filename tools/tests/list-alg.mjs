#!/usr/bin/env node
// 第23回 R95（安全）: 料理が並ぶ所すべてで、当たる料理に ⚠、「袋の表示を確認」の料理に 🔍 が付くか（Playwright。使い方: node tools/tests/list-alg.mjs [http://localhost:8765/]）
//  L1 特売を使う料理（よく行くスーパーの特売の欄）と条件のシートの特売の行: 全部の国 × 9アレルゲン × 特売の食材（よく使う食材の一覧）。⚠ の料理は出ない・🔍 の料理には 🔍
//  L2 料理が並ぶ所（さがす・材料から・冷蔵庫の食材と今日の献立・記録〔作った記録・最近作った・お気に入り・保存した献立〕・世界のレシピ・一品から・かえる候補・
//     1週間の日の画面・○つけ表・特売）: 国とアレルゲンの組（ヒングの小麦・ランチドレッシングの卵・カレーペーストのえび など）で、出た料理の印を数えて表にする
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ALL_CC = ['JP', 'US', 'KR', 'TH', 'FR', 'BR', 'CN', 'DE', 'EG', 'ES', 'GB', 'ID', 'IN', 'IT', 'MX', 'PE', 'PH', 'PL', 'TR', 'TW', 'VN'];
const CCS = (process.env.CCS || ALL_CC.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const ALGS = ['egg', 'milk', 'wheat', 'soy', 'fish', 'shrimp', 'crustacean', 'sesame', 'peanut'];
const COMBOS = [['IN', 'wheat'], ['US', 'egg'], ['TH', 'crustacean'], ['JP', 'egg'], ['JP', 'wheat'], ['TW', 'soy'], ['CN', 'soy'], ['PH', 'crustacean'], ['DE', 'wheat'], ['KR', 'wheat']].filter(([cc]) => CCS.includes(cc));
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(SEED));
await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', foldOpen: {week: true, sale: true}, settings: {country: 'JP', dishCount: 3, servings: 2}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]})); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);
await p.evaluate(() => { hasPro = () => true; });

// ページの中の関数: 料理のカードを集めて、印を確かめる
await p.evaluate(() => {
    window.__find = id => byId(id) || RECIPES.find(r => r.id === id) || Object.values(BROWSE || {}).flat().find(r => r && r.id === id) || null;
    window.__judge = r => !r || !r.items ? '' : allergyConflict(r) ? 'hit' : algMayHits(r).length ? 'may' : '';
    window.__scan = (root, surf, out, onlyMay) => {
        const el = typeof root === 'string' ? document.querySelector(root) : root; if (!el) return;
        const seen = new Set();
        el.querySelectorAll('.match, .dcard, .item, .recent-card, .wsh-row, .wd-head').forEach(card => {
            const idEl = card.matches('[data-id]') ? card : card.querySelector('[data-id]'), nmEl = card.querySelector('.wsh-nm');
            const id = idEl ? idEl.dataset.id : nmEl ? ((RECIPES.find(x => x.name === nmEl.textContent) || {}).id || '') : ''; if (seen.has(card) || !id) return; seen.add(card);   // 番号のない行（受けとる画面・○つけ表の結果）は料理名で
            if (card.querySelector('.match, .dcard, .item') && !card.matches('.wd-head')) return;   // 入れ子の外側は数えない
            const r = __find(id), j = __judge(r); const s = out[surf] || (out[surf] = {cards: 0, hit: 0, may: 0, hitNo: [], mayNo: []});
            s.cards++; const tx = card.textContent;
            if (j === 'hit' && !onlyMay){ s.hit++; if (!/⚠/.test(tx)) s.hitNo.push(id); }
            if (j === 'may'){ s.may++; if (!/🔍/.test(tx) && !/⚠/.test(tx)) s.mayNo.push(id); }
        });
    };
});

// ---- L1 特売の欄（全部の国 × 9アレルゲン × よく使う食材） ----
const sale = {runs: 0, cards: 0, conflict: 0, may: 0, mayNo: 0, condNo: 0};
for (const cc of CCS){
    const r = await p.evaluate(async ([cc, ALGS]) => {
        if (currentCountry() !== cc) await setCountry(cc);
        const o = {runs: 0, cards: 0, conflict: [], may: 0, mayNo: [], condNo: []}, T = TODAY;
        for (const a of ALGS){ S.settings.allergens = [a];
            for (const q of QUICK){
                S.sale = {stores: [{id: 'st0', name: 'X', pref: '', city: '', zip: '', days: [], note: '', url: ''}], items: [{id: 'i1', s: 'st0', sn: '', k: keyOf(q), n: q, p: '', d: T, u: T}]};
                o.runs++;
                const box = document.createElement('div'); box.innerHTML = saleBodyHtml();
                box.querySelectorAll('.match').forEach(c => { const id = c.querySelector('[data-id]').dataset.id, x = __find(id), j = __judge(x); o.cards++;
                    if (j === 'hit') o.conflict.push(a + '/' + q + ':' + id);
                    if (j === 'may'){ o.may++; if (!/🔍/.test(c.textContent)) o.mayNo.push(a + '/' + q + ':' + id); } });
                const cond = document.createElement('div'); cond.innerHTML = saleCondHtml(); const ct = cond.textContent;
                saleSuggest(2).sugg.forEach(x => { if (__judge(x.r) === 'may' && !ct.includes('🔍 ' + x.r.name)) o.condNo.push(a + '/' + q + ':' + x.r.id); });
            } }
        delete S.sale; S.settings.allergens = []; return o;
    }, [cc, ALGS]);
    sale.runs += r.runs; sale.cards += r.cards; sale.conflict += r.conflict.length; sale.may += r.may; sale.mayNo += r.mayNo.length; sale.condNo += r.condNo.length;
    ok(!r.conflict.length, `L1 ${cc} 特売の欄に当たる料理: ${r.conflict.slice(0, 5).join(' ')}`);
    ok(!r.mayNo.length, `L1 ${cc} 特売の欄で 🔍 の料理に 🔍 がない ${r.mayNo.length}: ${r.mayNo.slice(0, 5).join(' ')}`);
    ok(!r.condNo.length, `L1 ${cc} 条件のシートの特売の行で 🔍 がない ${r.condNo.length}: ${r.condNo.slice(0, 5).join(' ')}`);
}
console.log('L1 特売', JSON.stringify(sale));

// ---- L2 料理が並ぶ所 ----
const tot = {};
for (const [cc, a] of COMBOS){
    const out = await p.evaluate(async ([cc, a]) => {
        if (currentCountry() !== cc) await setCountry(cc);
        S.settings.allergens = [a]; save();
        const out = {};
        const rs = RECIPES.filter(r => !r.isTwist && !isCustomId(r.id));
        const mayRs = rs.filter(r => __judge(r) === 'may').slice(0, 4), hitRs = rs.filter(r => __judge(r) === 'hit').slice(0, 3), tg = [...mayRs, ...hitRs];
        out._targets = tg.map(r => r.id + ':' + __judge(r));
        // さがす
        tg.forEach(r => { const box = document.createElement('div'); box.innerHTML = searchResultsHtml(r.name); __scan(box, 'さがす', out); });
        // 材料から（冷蔵庫の食材から作れる料理）
        S.fridge = [...new Set(tg.flatMap(r => r.items.filter(i => !i.opt).map(i => i.key)))].slice(0, 30); save();
        setTab('fridge'); render(); __scan('#view', '材料から', out);
        // 冷蔵庫の食材と今日の献立（今日の画面）
        setTab('today'); session.menu = null; render(); __scan('#view .fridge-use', '冷蔵庫の食材と今日の献立', out);
        // かえる候補
        (session.menu ? session.menu.items : []).forEach((x, i) => { try{ openSwap(i, true); __scan('#sheet-root', 'かえる候補', out); closeSheet(); }catch(e){} });
        // 一品から
        rs.filter(r => r.main).slice(0, 6).forEach(m => { sheet = {kind: 'one', q: '', pick: {id: m.id}, sugg: null, seen: []}; oneRun(); renderSheet(); __scan('#sheet-root', '一品から', out); closeSheet(); });
        // 記録（作った記録・最近作った・お気に入り・保存した献立）
        S.history = tg.map((r, k) => ({d: addDays(TODAY, -1 - k), id: r.id, slot: slotOf(r), name: r.name}));
        S.favs = tg.map(r => r.id);
        S.savedMenus = [{id: 'sm1', name: 'いつもの', ids: tg.map(r => r.id), slots: tg.map(slotOf), d: TODAY}];
        save(); setTab('log'); render();
        __scan('#view', '記録（作った記録・最近作った・お気に入り）', out);
        { const tx = document.querySelector('#view').textContent, s = out['保存した献立'] = {cards: 0, hit: 0, may: 0, hitNo: [], mayNo: []};
          tg.forEach(r => { const j = __judge(r); s.cards++; if (j === 'hit'){ s.hit++; if (!tx.includes('⚠ ' + r.name)) s.hitNo.push(r.id); } if (j === 'may'){ s.may++; if (!tx.includes('🔍 ' + r.name)) s.mayNo.push(r.id); } }); }
        // 1週間の日の画面・○つけ表
        makeWeek(); tg.slice(0, Math.min(tg.length, S.week.days.length)).forEach((r, k) => { S.week.days[k].id = r.id; delete S.week.days[k].skip; }); save();
        S.week.days.slice(0, tg.length).forEach(x => { sheet = {kind: 'wday', d: x.d}; renderSheet(); __scan('#sheet-root', '1週間の日の画面', out); closeSheet(); });
        setTab('today'); render(); __scan('#view .list.week', '1週間プランの行', out);
        sheet = {kind: 'vote-make', ids: tg.map(r => r.id), on: tg.map(r => r.id)}; renderSheet(); __scan('#sheet-root', '○つけ表をつくる', out); closeSheet();
        // 第24回 R102: 家族から届いた「食べたいもの」（受けとる画面・一覧・上の帯の札）と ○つけ表の結果（当たる料理は「候補に入れません」と止めるので、🔍 を見る）
        const fam0 = S.family; S.family = [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}, {id: 'f1', name: '夫', role: 'adult', avoid: [], allergy: []}];
        sheet = {kind: 'wish-in', p: {k: 'w', key: 'zz1', n: '夫', ids: tg.map(r => r.id), unknown: 0, m: null, t: TODAY}, seen: false}; renderSheet(); __scan('#sheet-root', '届いた食べたいもの（受けとる画面）', out, true); closeSheet();
        S.wants = tg.map((r, k) => ({k: 'zz' + k, n: '夫', id: r.id, m: null, t: TODAY, at: TODAY})); save();
        sheet = {kind: 'wish-list'}; renderSheet(); __scan('#sheet-root', '届いた食べたいもの（一覧）', out, true);
        { const tx = document.querySelector('#sheet-root').textContent, s = out['届いた食べたいもの（前に届いたもの）'] = {cards: 0, hit: 0, may: 0, hitNo: [], mayNo: []};
          tg.filter(r => wishBlockWhy(r)).forEach(r => { s.cards++; const j = __judge(r); if (j === 'hit'){ s.hit++; if (!tx.includes('⚠ ' + r.name) && !tx.includes(r.name + ' ')) s.hitNo.push(r.id); } }); }
        closeSheet();
        { const s = out['上の帯の札（家族リクエスト）'] = {cards: 0, hit: 0, may: 0, hitNo: [], mayNo: []};
          tg.filter(r => __judge(r) === 'may').forEach((r, k) => { S.wants = [{k: 'zy' + k, n: '夫', id: r.id, m: null, t: TODAY, at: TODAY}]; setTab('today'); render(); const el = document.querySelector('.req-btn .rq2'); s.cards++; s.may++; if (!el || !/🔍/.test(el.textContent)) s.mayNo.push(r.id); }); }
        S.wants = [];
        S.votes = [{w: voteWeek(), ids: tg.map(r => r.id), at: TODAY, ans: {'夫': '2'.repeat(tg.length)}}]; save();
        sheet = {kind: 'vote-table', w: voteWeek()}; renderSheet(); __scan('#sheet-root', '○つけ表の結果', out, true); closeSheet(); S.votes = [];
        // 共有の文（今日の献立）
        { const tx = menuShareText({items: tg.map(r => ({r, slot: slotOf(r)}))}), s = out['送る文（今日の献立）'] = {cards: 0, hit: 0, may: 0, hitNo: [], mayNo: []};
          tg.forEach(r => { const j = __judge(r); s.cards++; if (j === 'hit'){ s.hit++; if (!tx.includes('⚠ ' + r.name)) s.hitNo.push(r.id); } if (j === 'may'){ s.may++; if (!tx.includes('🔍 ' + r.name)) s.mayNo.push(r.id); } }); }
        S.family = fam0;
        S.history = []; S.favs = []; S.savedMenus = []; S.fridge = []; S.settings.allergens = []; save();
        return out;
    }, [cc, a]);
    // 世界のレシピ（日本から、その国の料理を見る）
    if (cc !== 'JP'){
        await p.evaluate(async () => { if (currentCountry() !== 'JP') await setCountry('JP'); });
        await p.evaluate(([cc, a]) => { S.settings.allergens = [a]; worldCC = cc; setTab('world'); render(); }, [cc, a]);
        await p.waitForFunction(() => document.querySelectorAll('#view .w4x_wc').length > 0, null, {timeout: 20000}).catch(() => {});
        await p.evaluate(() => { document.querySelectorAll('#view [data-act="world-all"]').forEach(x => x.click()); });
        await p.waitForTimeout(300);
        const w = await p.evaluate(() => { const o = {}; __scan('#view', '世界のレシピ', o); S.settings.allergens = []; return o; });
        Object.assign(out, w);
    }
    const tg = out._targets; delete out._targets;
    for (const [surf, s] of Object.entries(out)){
        const T = tot[surf] || (tot[surf] = {cards: 0, hit: 0, may: 0, hitNo: 0, mayNo: 0});
        T.cards += s.cards; T.hit += s.hit; T.may += s.may; T.hitNo += s.hitNo.length; T.mayNo += s.mayNo.length;
        ok(!s.hitNo.length && !s.mayNo.length, `L2 ${cc}/${a} ${surf}: ⚠ なし ${s.hitNo.join(',')} / 🔍 なし ${s.mayNo.join(',')}`);
    }
    if (process.env.VERBOSE) console.log(cc, a, tg.join(' '));
}
console.log('L2 料理が並ぶ所（カード・当たる料理・🔍 の料理・⚠ なし・🔍 なし）');
for (const [k, v] of Object.entries(tot)) console.log(`| ${k} | ${v.cards} | ${v.hit} | ${v.may} | ${v.hitNo} | ${v.mayNo} |`);
await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
