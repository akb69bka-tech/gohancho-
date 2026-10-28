#!/usr/bin/env node
// 「材料から探す」「検索」「ひとひねり」「世界のレシピ」の回帰テスト（Playwright。使い方: node tools/tests/fridge-search-twist.mjs [http://localhost:8765/]）
//  ・材料の読み取り（ひらがな・全角半角・助詞・数量・別名・「絹さや」の「や」・調味料を食材にしない）
//  ・冷蔵庫の見出しの振り分けが材料どおり（作れる＝必須材料がすべてある／あと1〜2品＝足りないのが1〜2個）
//  ・読み取れない名前の案内と「もしかして」で直す／調味料の案内
//  ・検索の言い方（炒飯・ギョーザ・卵焼き・豚カツ・どんぶり・魚）／語を並べた英語／打ちまちがいの「もしかして」
//  ・ひとひねり: 主役を替えたら名前も替わる／元の調味料がないのに「半量に」と言わない／足した調味料で種類が変わらない／
//    無料版の回数（残りの表示・回数がないとき条件も案も変えない・元の料理の選び直しや『これをひとひねり』も1回に数える）／主菜にするで押していない枠が動かない
//  ・世界のレシピ: 国を変えても、お気に入りにしても、今日の献立は変わらない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const open = async (cc = 'JP', ui = 'auto', extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([cc, ui, extra]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(Object.assign({onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, uiLang:ui, dishCount:4}}, extra))); } }, [cc, ui, extra]);
    await p.goto(URL_); await p.waitForTimeout(2500); return {ctx, p, errs};
};

// ---- 1. 材料の読み取り（日本）
{
    const {ctx, p, errs} = await open('JP', 'ja');
    const T = [
        ['豚肉と玉ねぎとキャベツ', ['豚肉', '玉ねぎ', 'キャベツ']], ['ぶたにく たまねぎ', ['豚肉', '玉ねぎ']], ['ﾀﾏﾈｷﾞ　ｷｬﾍﾞﾂ', ['玉ねぎ', 'キャベツ']],
        ['にんじん2本、じゃがいも3個', ['にんじん', 'じゃがいも']], ['卵を2個', ['卵']], ['玉ねぎ1/2個', ['玉ねぎ']], ['冷蔵庫に鶏肉と卵', ['鶏肉', '卵']],
        ['とりむね', ['鶏肉']], ['トリもも', ['鶏肉']], ['油あげ', ['油揚げ']], ['絹さや', ['さやえんどう']], ['きぬさや', ['さやえんどう']], ['ポテト', ['じゃがいも']],
        ['たまご', ['卵']], ['玉子', ['卵']], ['茄子', ['なす']], ['ホウレンソウ', ['ほうれん草']], ['豚肉とか玉ねぎとか', ['玉ねぎ', '豚肉']],
    ];
    for (const [text, want] of T){
        const got = await p.evaluate(t => extractIngredients(t), text);
        ok(want.length === got.length && want.every(w => got.includes(w)), '読み取り ' + text + ' → ' + got + ' (want ' + want + ')');
    }
    // 鶏ガラスープの素は鶏肉ではない（冷蔵庫に入れない）
    const r = await p.evaluate(() => { S.fridge = []; addIngredients('鶏ガラスープの素'); const a = S.fridge.slice(); addIngredients('コンソメ、玉ねぎ'); return [a, S.fridge.slice()]; });
    ok(r[0].length === 0 && r[1].length === 1 && r[1][0] === '玉ねぎ', 'スープの素を食材にしない ' + JSON.stringify(r));
    ok(errs.length === 0, 'errs ' + errs); await ctx.close();
}

// ---- 2. 冷蔵庫の振り分けが材料どおり（日本・アメリカ・韓国）
for (const [cc, ui, sets] of [['JP', 'ja', [['豚肉', 'キャベツ', '卵'], ['鶏肉', '玉ねぎ'], ['豆腐', 'わかめ'], ['卵']]], ['US', 'en', [['chicken', 'onion', 'egg'], ['ground beef', 'cheese']]], ['KR', 'ko', [['달걀', '양파', '대파']]]]){
    const {ctx, p, errs} = await open(cc, ui);
    for (const set of sets){
        const r = await p.evaluate(set => {
            S.fridge = set.slice(); S.staples = []; S.fridgeMeta = {}; save(); setTab('fridge');
            const have = fridgeKeys(), bad = [];
            const exp = {ready: new Set(), sub: new Set(), near: new Set()};
            RECIPES.filter(r => !isAvoided(r)).forEach(r => {
                const req = r.items.filter(i => !i.opt && !PANTRY.has(i.key)); let got = 0, subs = 0, miss = 0;
                req.forEach(i => { if (have.has(i.key)) got++; else if ((SUBS[i.key] || []).some(k => have.has(k))) subs++; else miss++; });
                const used = got + subs + r.items.filter(i => i.opt && have.has(i.key)).length;
                if (!(used > 0 && got + subs > 0)) return;
                const ratio = req.length ? (got + subs * 0.6) / req.length : 0;
                if (!miss && !subs) exp.ready.add(r.id); else if (!miss) exp.sub.add(r.id); else if (miss <= 2 && ratio >= 0.4) exp.near.add(r.id);
            });
            const shown = {ready: new Set(), sub: new Set(), near: new Set()};
            const secs = document.querySelector('#fridge-results');
            const titles = {[t('今ある材料で作れる')]: 'ready', [t('代わりの食材で作れる')]: 'sub', [t('あと1〜2品あれば作れる')]: 'near'};
            // 「すべて見る」で全部出す
            ['fr-ready', 'fr-sub', 'fr-near'].forEach(k => moreOpen.add(k)); render();
            const s2 = document.querySelector('#fridge-results');
            [...s2.children].forEach((el, k, all) => {
                if (!el.classList.contains('sec-head')) return; const h = el.querySelector('h3'); const kind = h && titles[h.textContent.trim()]; if (!kind) return;
                const list = all[k + 1]; list.querySelectorAll('.match [data-act="open"][data-id]').forEach(e => shown[kind].add(e.dataset.id));
            });
            const eq = (a, b2) => a.size === b2.size && [...a].every(x => b2.has(x));
            ['ready', 'sub', 'near'].forEach(kind => { const e = exp[kind], g = shown[kind]; const nearCut = kind === 'near' ? 12 : 1e9;
                if (kind === 'near'){ if (g.size > Math.min(e.size, nearCut) || [...g].some(x => !e.has(x))) bad.push(kind + ' 余計 ' + [...g].filter(x => !e.has(x))); }
                else if (!eq(e, g)) bad.push(kind + ' 不一致 exp=' + e.size + ' got=' + g.size + ' 余計=' + [...g].filter(x => !e.has(x)).slice(0, 3) + ' 不足=' + [...e].filter(x => !g.has(x)).slice(0, 3)); });
            ['fr-ready', 'fr-sub', 'fr-near'].forEach(k => moreOpen.delete(k));
            return bad;
        }, set);
        ok(r.length === 0, cc + ' 振り分け ' + set + ' ' + JSON.stringify(r));
    }
    ok(errs.length === 0, cc + ' errs ' + errs); await ctx.close();
}

// ---- 3. 読み取れない名前の案内・もしかして・調味料
{
    const {ctx, p, errs} = await open('JP', 'ja');
    await p.evaluate(() => { setTab('fridge'); S.fridge = []; save(); render(); });
    await p.fill('#ing-input', 'ぶたにく、ばなな、醤油、ほうれんそ'); await p.click('form[data-form="add-ing"] button[type=submit]'); await p.waitForTimeout(200);
    let txt = await p.evaluate(() => document.querySelector('#view').innerText);
    ok(/「ばなな」を使う料理は見つかっていません/.test(txt), '読み取れない名前の案内');
    ok(/醤油 は調味料なので/.test(txt), '調味料の案内');
    ok(!/「豚肉」を使う料理は見つかっていません/.test(txt), '読み取れた名前には案内を出さない');
    const sugg = await p.evaluate(() => [...document.querySelectorAll('[data-act="fridge-fix"]')].map(e => e.dataset.v + '→' + e.dataset.name));
    ok(sugg.some(x => /ほうれん/.test(x.split('→')[1])), 'もしかして ' + sugg);
    await p.evaluate(() => document.querySelector('[data-act="fridge-fix"]').click()); await p.waitForTimeout(200);
    const fr = await p.evaluate(() => S.fridge.map(keyOf));
    ok(fr.includes('ほうれん草') && !fr.includes('ほうれんそ'), 'もしかして で直る ' + fr);
    ok(errs.length === 0, 'errs ' + errs); await ctx.close();
}
{   // 画面の言語を変えても落ちない・案内が出る
    const {ctx, p, errs} = await open('US', 'en');
    await p.evaluate(() => { setTab('fridge'); S.fridge = []; save(); render(); });
    await p.fill('#ing-input', 'chicken, zzzfruit, salt'); await p.click('form[data-form="add-ing"] button[type=submit]'); await p.waitForTimeout(200);
    const txt = await p.evaluate(() => document.querySelector('#view').innerText);
    ok(/No dishes using "Zzzfruit" were found/.test(txt), 'US 案内 ' + txt.slice(0, 0));
    ok(!/No dishes using "Chicken"/.test(txt), 'US 読み取れた名前には出さない');
    ok(errs.length === 0, 'US errs ' + errs); await ctx.close();
}

// ---- 4. 検索
{
    const {ctx, p, errs} = await open('JP', 'ja');
    const top = q => p.evaluate(q => { const s = searchRecipes(q); return s.hits.map(r => r.id); }, q);
    const T = [['炒飯', 'chahan'], ['ギョーザ', 'gyoza'], ['卵焼き', 'dashimaki'], ['玉子焼き', 'dashimaki'], ['豚カツ', 'tonkatsu'], ['とんかつ', 'tonkatsu'], ['麻婆', 'mapo'], ['にくじゃが', 'nikujaga'], ['ﾅｽ', null], ['みそしる', 'misoshiru']];
    for (const [q, want] of T){ const ids = await top(q); ok(want ? ids.slice(0, 3).includes(want) : ids.length > 0, '検索 ' + q + ' → ' + ids.slice(0, 5)); }
    const don = await p.evaluate(() => { const s = searchRecipes('どんぶり').hits; return {n: s.length, names: s.map(r => r.name), btn: searchResultsHtml('どんぶり').includes('search-to-fridge')}; });
    ok(don.n >= 4 && don.names.every(n => /丼/.test(n)) && !don.btn, 'どんぶり ' + don.names);
    const fish = await p.evaluate(() => searchRecipes('魚').hits.map(r => r.family)); ok(fish.length >= 20 && fish.slice(0, 15).every(f => f === '魚' || f === '魚介'), '魚 ' + fish.slice(0, 15));
    const meat = await p.evaluate(() => searchRecipes('お肉').hits.length); ok(meat >= 40, 'お肉 ' + meat);
    ok(errs.length === 0, 'errs ' + errs); await ctx.close();
}
{
    const {ctx, p, errs} = await open('US', 'en');
    const r = await p.evaluate(() => ({ cs: searchRecipes('Chicken Soup').hits.slice(0, 4).map(r => r.name), none: searchRecipes('qqqq').hits.length, typo: searchResultsHtml('chiken') }));
    ok(r.cs.some(n => /Chicken noodle soup/i.test(n)), '語を並べた英語 ' + r.cs);
    ok(r.typo.includes('data-act="search-sugg"') && /Chicken/.test(r.typo), '打ちまちがいの もしかして');
    await p.evaluate(() => { setTab('fridge'); }); await p.fill('#search-input', 'chiken'); await p.waitForTimeout(500);
    await p.click('[data-act="search-sugg"]'); await p.waitForTimeout(300);
    const v = await p.evaluate(() => [$('#search-input').value, document.querySelectorAll('#search-results .match').length]);
    ok(v[0] === 'Chicken' && v[1] > 3, 'もしかして で検索し直す ' + v);
    ok(errs.length === 0, 'errs ' + errs); await ctx.close();
}

// ---- 5. ひとひねり
{
    const {ctx, p, errs} = await open('JP', 'ja');
    const r = await p.evaluate(() => {
        const bad = [];
        const tw = (id, fl, fo, sw) => buildTwist(twistId(id, fl, fo, sw));
        // 主役を替えたら料理名も替わる
        const n1 = tw('nasumiso', '', '', '豚:0'); if (!/鶏肉/.test(n1.name) || /豚/.test(n1.name.replace(/（.*）/, ''))) bad.push('名前 ' + n1.name);
        const n2 = tw('shogayaki', '', '', '豚:1'); if (!/^厚揚げの生姜焼き/.test(n2.name)) bad.push('名前2 ' + n2.name);
        const n3 = tw('karaage', '', '', '鶏:0'); if (!/^豚の唐揚げ/.test(n3.name)) bad.push('名前3 ' + n3.name);
        // 主役を言いかえた手順は変えたところ（黄色）になる
        const n4 = tw('shogayaki', '', '', '豚:0'); const chg = n4.steps.filter((s, k) => s.t !== RECIPES.find(r => r.id === 'shogayaki').steps[k]);
        if (!chg.length || chg.some(s => !s.add)) bad.push('言いかえた手順が黄色でない');
        // 元の料理に醤油・砂糖がないのに「醤油・砂糖はいつもの半量」と言わない
        let falseSay = 0, total = 0;
        RECIPES.filter(r => r.type !== '汁物').forEach(base => twistOptions(base).flavors.forEach(fl => {
            const x = buildTwist(twistId(base.id, fl, '', '')); const uses = (base.seas || '') + ' ' + base.items.map(i => i.name).join(' '); total++;
            const st = x.steps.filter(s => s.add).map(s => s.t).join('');
            if (fl === 'kr' && /醤油・砂糖|醤油|砂糖/.test(st.split('コチュジャン')[0]) && !/醤油|砂糖/.test(uses)) falseSay++;
            if (fl === 'kr' && /砂糖/.test(st.split('コチュジャン')[0]) && !uses.includes('砂糖')) falseSay++;
            if (fl === 'kr' && /醤油/.test(st.split('コチュジャン')[0]) && !uses.includes('醤油')) falseSay++;
            if (fl === 'it' && /半量/.test(st) && !/醤油|味噌/.test(uses)) falseSay++;
            if (fl === 'cn' && /置きかえ/.test(st) && !/醤油|みりん/.test(uses)) falseSay++;
            if (fl === 'et' && /置きかえ/.test(st) && !/醤油/.test(uses)) falseSay++;
            if (fl === 'wa' && /半量/.test(st) && !/ソース|ケチャップ|マヨ|コンソメ|ウスター|オイスター|バター|豆板醤/.test(uses)) falseSay++;
            if (fl === 'ume' && /醤油を控えめ/.test(st) && !/醤油/.test(uses)) falseSay++;
        }));
        if (falseSay) bad.push('元にない調味料に触れる手順 ' + falseSay + '/' + total);
        // 足した調味料（鶏ガラスープの素）で、豚の料理が鶏の料理にならない
        const c = tw('shogayaki', 'cn', '', ''); if (c.family !== '豚' || c.protein !== '豚肉') bad.push('中華風で種類が変わった ' + c.family);
        const v = tw('coleslaw', 'cn', '', ''); if (v.family !== '野菜') bad.push('野菜の料理が ' + v.family);
        // 案を作り続けても落ちない・案が空にならない
        for (let k = 0; k < 40; k++){ const s = suggestTwist(); if (!s || !s.name) { bad.push('suggestTwist が空'); break; } }
        return bad;
    });
    ok(r.length === 0, 'ひとひねり ' + JSON.stringify(r));
    // 同じ案ばかりにならない（おまかせで20回）
    const d = await p.evaluate(() => { const names = new Set(), bases = new Set(); for (let k = 0; k < 20; k++){ const s = generateTwists({level: 2, count: 3}); s.forEach(x => { names.add(x.id); bases.add(x.base.id); }); } return [names.size, bases.size]; });
    ok(d[0] >= 30 && d[1] >= 15, '案の幅 ' + d);
    ok(errs.length === 0, 'errs ' + errs); await ctx.close();
}
{   // 無料版の回数
    const {ctx, p, errs} = await open('JP', 'ja');
    const r = await p.evaluate(() => {
        const bad = [], click = (act, o = {}) => { const e = document.createElement('button'); e.dataset.act = act; Object.entries(o).forEach(([k, v]) => e.dataset[k] = v); document.body.appendChild(e); e.click(); e.remove(); };
        const paywalls = []; openPaywall = reason => { paywalls.push(reason); sheet = null; };
        PLAN.billingMode = 'all'; PLAN.freeTier = true; S.pro = null; S.firstUse = TODAY; S.usage = {};
        setTab('twist'); const txt0 = document.querySelector('#view').innerText;
        if (!txt0.includes('今日はあと3回です')) bad.push('残りの表示 ' + txt0.slice(-80));
        click('tw-run'); click('tw-set', {key: 'level', v: 3}); click('tw-set', {key: 'flavor', v: 'kr'});
        if (!document.querySelector('#view').innerText.includes('今日はあと0回です')) bad.push('3回使ったあとの表示');
        const before = JSON.stringify({s: twistState.results.map(x => x.id), f: twistState.flavor, l: twistState.level, b: twistState.baseId});
        click('tw-run'); click('tw-set', {key: 'flavor', v: 'cn'}); click('tw-set', {key: 'form', v: 'don'});
        const sel = document.querySelector('#tw-base'); sel.value = 'karaage'; sel.dispatchEvent(new Event('change', {bubbles: true}));
        const after = JSON.stringify({s: twistState.results.map(x => x.id), f: twistState.flavor, l: twistState.level, b: twistState.baseId});
        if (before !== after) bad.push('回数がないのに条件か案が変わった ' + before + ' → ' + after);
        if (paywalls.length < 3) bad.push('購入画面が出ない ' + paywalls);
        const sel2 = document.querySelector('#tw-base'); if (sel2.value !== '') bad.push('元の料理の選択が戻らない ' + sel2.value);
        // 「これをひとひねり」も回数がないときは新しい案を作らない
        const ids = twistState.results.map(x => x.id).join(); click('twist-this', {id: 'nikujaga'}); if (twistState.baseId === 'nikujaga' || twistState.results.map(x => x.id).join() !== ids) bad.push('これをひとひねり が回数を無視');
        // 次の日は戻る
        S.usage = {twistDay: '2000-01-01', twistN: 3}; setTab('today'); setTab('twist'); if (!document.querySelector('#view').innerText.includes('今日はあと3回です')) bad.push('翌日に戻らない');
        // プラスでは表示しない
        S.pro = {active: true}; render(); if (document.querySelector('#view').innerText.includes('無料版は1日')) bad.push('プラスなのに回数を表示');
        return bad;
    });
    ok(r.length === 0, '無料版の回数 ' + JSON.stringify(r));
    ok(errs.length === 0, 'errs ' + errs); await ctx.close();
}
{   // 主菜にするで、押していない枠が動かない（6品: 主菜2つ・副菜・汁もの）
    const {ctx, p, errs} = await open('JP', 'ja');
    const r = await p.evaluate(() => {
        const bad = []; S.settings.dishCount = 6; session.countSalt = 3; ensureMenu(); newMenu();
        const click = (act) => { const e = document.createElement('button'); e.dataset.act = act; document.body.appendChild(e); e.click(); e.remove(); };
        for (let k = 0; k < 30; k++){
            newMenu(); const m = session.menu; if (m.items.length < 5) continue;
            const second = m.items.find((x, j) => j && x.r && x.slot === '主菜'); if (!second) continue;
            // 2つ目の主菜と同じ種類（肉・魚）のひとひねり案を主菜にする
            const tw = generateTwists({level: 2, count: 12}).find(x => x.family === second.r.family && x.family !== '野菜'); if (!tw) continue;
            const before = m.items.map(x => x.slot + ':' + (x.r ? x.r.id : '-')); session.twist = tw; click('twist-main');
            const after = session.menu.items.map(x => x.slot + ':' + (x.r ? x.r.id : '-'));
            after.forEach((a, j) => { if (j && a !== before[j]) bad.push('枠' + j + ' ' + before[j] + ' → ' + a); });
            if (after[0] !== '主菜:' + tw.id) bad.push('主菜が替わらない');
        }
        return bad;
    });
    ok(r.length === 0, '主菜にする ' + JSON.stringify(r.slice(0, 3)));
    ok(errs.length === 0, 'errs ' + errs); await ctx.close();
}

// ---- 6. 世界のレシピ: 国を変える・お気に入りで、今日の献立は変わらない
for (const [cc, ui] of [['JP', 'ja'], ['US', 'en']]){
    const {ctx, p, errs} = await open(cc, ui);
    const SNAP = () => JSON.stringify({menu: session.menu ? session.menu.items.map(x => x.slot + ':' + (x.r && x.r.id)) : null, week: S.week && S.week.days.map(d => d.id), cook: S.cook, country: S.settings.country, mix: S.settings.mix || {}, hist: S.history.length, hidden: S.hidden});
    const s0 = await p.evaluate(`(${SNAP})()`);
    await p.evaluate(() => setTab('world')); await p.waitForTimeout(1200);
    const ccs = await p.evaluate(() => [...document.querySelectorAll('[data-act="world-cc"]')].map(e => e.dataset.cc));
    ok(ccs.length >= 15 && !ccs.includes(cc), cc + ' 国一覧 ' + ccs.length);
    for (const c of ccs.slice(0, 5)){
        await p.evaluate(c => { worldCC = c; render(); }, c); await p.waitForFunction(c => worldCC === c && document.querySelectorAll('.world-list .match').length > 0, c, {timeout: 8000}).catch(() => {});
        const n = await p.evaluate(() => document.querySelectorAll('.world-list .match').length); ok(n > 5, cc + ' ' + c + ' 一覧 ' + n);
    }
    await p.waitForSelector('.world-list .match', {timeout: 10000});
    await p.evaluate(() => document.querySelector('.world-list .match').click()); await p.waitForSelector('.sheet [data-act="fav"]', {timeout: 5000});
    await p.evaluate(() => document.querySelector('.sheet [data-act="fav"]').click()); await p.evaluate(() => closeModal());
    const s1 = await p.evaluate(`(${SNAP})()`);
    ok(s0 === s1, cc + ' 世界のレシピで献立が変わった');
    ok(await p.evaluate(() => S.favs.length === 1), cc + ' お気に入り');
    ok(errs.length === 0, cc + ' errs ' + errs); await ctx.close();
}
// ---- 7. ひとひねりの手順の順番（全部の組み合わせ）・さがすの読みの言いかえ・料理でない言葉
{
    const {ctx, p, errs} = await open('JP', 'ja');
    const r = await p.evaluate(() => {
        const bad = {first: [], fin: [], reAdd: [], broth: []}; let n = 0;
        const FIN = /^(?:最後に|火を止めてから|仕上げに)/;
        RECIPES.forEach(base => { const o = twistOptions(base), combos = [];
            o.flavors.forEach(f => combos.push([f, '', ''])); o.forms.forEach(m => combos.push(['', m, ''])); o.flavors.forEach(f => o.forms.forEach(m => combos.push([f, m, '']))); o.swaps.forEach(s => combos.push(['', '', s]));
            combos.forEach(([f, m, s]) => { const id = twistId(base.id, f, m, s), tw = buildTwist(id); if (!tw) return; n++;
                const st = tw.steps.map(x => x.t), core = st.slice(0, st.length - (m ? FORMS[m].steps.length : 0) - (f && FLAVORS[f].garnish ? 1 : 0));
                // 「はじめに」は火を使う最初の手順より前
                const fi = core.findIndex(x => /^はじめに/.test(x)), hi = core.findIndex(x => TW_HEAT.test(x) && !/^はじめに/.test(x));
                if (fi >= 0 && hi >= 0 && fi > hi) bad.first.push(id);
                // 「最後に／火を止めてから／仕上げに」のあとに、火を使う手順が来ない
                const fn = core.findIndex((x, i) => FIN.test(x) && tw.steps[i].add);
                if (fn >= 0 && core.slice(fn + 1).some(x => TW_HEAT.test(x) && !TW_SERVE.test(x))) bad.fin.push(id);
                // 置きかえた・減らした調味料を、あとの手順で（変えたことを書かずに）また加えない
                const F = FLAVORS[f]; if (F && F.need){ const ti = tw.steps.findIndex(x => x.add && /置きかえ|半量/.test(x.t)); if (ti >= 0 && tw.steps.some((x, i) => i > ti && !x.add && F.need.test(x.t))) bad.reAdd.push(id); }
                // 鶏ガラスープの素を「鶏肉」として並べない
                if (tw.items.some(i => i.added && /スープの素/.test(i.name) && i.label !== i.name)) bad.broth.push(id);
            }); });
        return {n, first: bad.first.slice(0, 3), fin: bad.fin.slice(0, 3), reAdd: bad.reAdd.slice(0, 3), broth: bad.broth.slice(0, 3),
            kayu: ['おかゆ', 'がゆ', '粥', 'お粥'].map(q => searchRecipes(q).hits.length),
            addBtn: ['離乳食', '作り置き', 'なす'].map(q => /search-to-fridge/.test(searchResultsHtml(q)))};
    });
    ok(r.n > 1000, 'ひとひねりの組み合わせ ' + r.n);
    ok(!r.first.length, '「はじめに」が途中に来る ' + r.first);
    ok(!r.fin.length, '「仕上げ」のあとに火を使う ' + r.fin);
    ok(!r.reAdd.length, '置きかえた調味料をあとでまた加える ' + r.reAdd);
    ok(!r.broth.length, '鶏ガラスープの素が鶏肉になる ' + r.broth);
    ok(r.kayu[0] > 2 && r.kayu.every(x => x === r.kayu[0]), 'おかゆ・がゆ・粥・お粥で同じ件数 ' + r.kayu);
    ok(!r.addBtn[0] && !r.addBtn[1] && r.addBtn[2], '料理でない言葉に「冷蔵庫に追加」を出さない ' + r.addBtn);
    ok(errs.length === 0, 'errs ' + errs); await ctx.close();
}
await b.close();
console.log(fails ? `FAIL ${fails}/${checks}` : `OK ${checks}`); process.exit(fails ? 1 : 0);
