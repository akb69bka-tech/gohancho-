#!/usr/bin/env node
// 第22回の献立の直しの確かめ（戸川・柊）。Playwright。使い方: node tools/tests/panel-r22.mjs [http://localhost:8999/]
//  R89: 「いちばん簡単」の副菜・汁ものは20分まで（それより長い料理で埋めない）。条件（主菜25分・副菜と汁もの15分）を超える料理には、料理ごとにその分の札。
//       上限の中に料理がなければ席をなしにし、席と知らせに「○○は20分以内の料理がないので、なし」。21か国とも、汁ものは15分以内（各国に10分・手順2つの汁ものを足した）
//  R74 の残り: 「10分以内」の汁ものは21か国とも10分以内でそろう（ゆるめない。15分の札が出ない）
//  新しい料理: 10分・手順2つまで。アレルギーの判定（材料・調味料の言葉）どおりに、選んだアレルゲンの料理は出ない
//  R90: 10分以内・いちばん簡単で、同じ国・同じモードの献立を続けて作ると、主菜は候補をひと回りするまで同じにならない（端末におぼえる。開き直しても続きから）
//  R91: 訳のない言葉の画面でほかの国を見ると: 画面の言葉の訳 → その国の名前（その文字が読める言葉のとき）→ 英語。中国語の画面で日本の漢字だけの料理名（麻婆豆腐など）は漢字のまま
//  環境変数: BASE, SEED, CCS（既定 21か国）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ALL = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = (process.env.CCS || ALL.join(',')).split(',').filter(Boolean);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
let cur = '';
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ' CCS=' + cur + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const open = async (cc, tag, settings = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('r22', cc, tag)));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript((st) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-10-01', settings: Object.assign({uiLang: 'ja', dishCount: 'auto', servings: 2}, st)})); } }, Object.assign({country: cc}, settings));
    await p.goto(URL_); await ready(p);
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; setTab('today'); render(); });
    return {p, ctx};
};

// 第22回で足した料理（写真の一覧と同じ）
const NEW_IDS = `us_tortellinisoup us_rotisseriesoup us_vegnoodlesoup us_butteredpeas us_cuketomato gb_quicksweetcorn gb_quickspinach gb_quickchickennoodle
 fr_petitspois_express fr_concombre_froide fr_bouillon_alphabet de_eierflockensuppe de_buchstabensuppe de_erbsencreme_schnell it_crema_piselli it_crema_zucchine it_crema_ceci
 es_sopa_picadillo es_crema_guisantes es_crema_espinacas pl_groszkowa pl_chlodnik_ogorkowy pl_szpinakowa tr_bezelyecorbasi tr_ayranasi tr_rendedomates tr_yesilsalata tr_haydari
 eg_shorbetsabanekh eg_dora eg_shaariyatamatem in_lemoncoriander in_clearvegsoup in_quickrasam cn_qingcai_doufu_tang cn_xiapi_zicai_tang cn_sigua_dan_tang
 tw_weicheng_tang tw_fanqie_danhua_tang tw_zicai_danhua_tang kr_gimguk kr_sundubuguk kr_beoseotguk th_kaengjuedkhainam th_tomjuedphakruam th_kaengjuedmakhuea
 vn_canhdauhucachua vn_canhcaingot vn_canhnamkimcham id_suptahu id_supayamcepat id_beningsawi id_tumissawi id_tumiskol ph_sardinas_misua ph_sinabawang_pechay ph_cornedbeef_sabaw
 mx_sopa_letras mx_consome_rapido mx_caldo_elote_calabacita br_caldo_feijao_rapido br_sopa_macarrao_ovo br_creme_ervilha_rapido
 pe_sopa_fideos_huevo pe_crema_arvejas pe_crema_espinaca pe_ensalada_palta pe_choclo_mantequilla`.split(/\s+/).filter(Boolean);
// 料理の言葉から見て、当然入っているアレルゲン（アプリの判定がこれを含むこと）
const MUST = {us_tortellinisoup: ['wheat', 'egg', 'milk'], us_butteredpeas: ['milk'], gb_quickchickennoodle: ['wheat', 'egg', 'soy'], fr_concombre_froide: ['milk'],
    de_eierflockensuppe: ['egg'], es_sopa_picadillo: ['wheat', 'egg'], tr_rendedomates: ['wheat', 'milk'], tr_haydari: ['milk'], eg_shorbetsabanekh: ['milk'],
    cn_qingcai_doufu_tang: ['soy', 'sesame'], cn_xiapi_zicai_tang: ['crustacean', 'soy', 'wheat', 'sesame'], cn_sigua_dan_tang: ['egg'], tw_weicheng_tang: ['soy', 'fish'],
    tw_zicai_danhua_tang: ['egg', 'soy', 'wheat', 'sesame'], kr_gimguk: ['egg', 'soy', 'wheat', 'fish', 'sesame'], kr_sundubuguk: ['egg', 'soy', 'fish'], kr_beoseotguk: ['soy', 'fish'],
    th_kaengjuedkhainam: ['egg', 'soy', 'fish'], th_kaengjuedmakhuea: ['fish', 'soy'], vn_canhdauhucachua: ['soy', 'fish'], vn_canhnamkimcham: ['egg', 'fish'],
    id_suptahu: ['egg', 'soy'], id_tumissawi: ['soy', 'mollusc'], id_tumiskol: ['egg', 'soy'], ph_sardinas_misua: ['fish', 'wheat'], mx_sopa_letras: ['wheat'],
    br_sopa_macarrao_ovo: ['wheat', 'egg'], br_creme_ervilha_rapido: ['milk'], pe_sopa_fideos_huevo: ['wheat', 'egg'], pe_crema_arvejas: ['milk'], pe_choclo_mantequilla: ['milk']};

// ---- 新しい料理: 時間・手順・種類・アレルゲン（その国の言葉と日本語の画面で） ----
{
    const bad = [], miss = [], seen = new Set();
    for (const cc of ALL.filter(c => c !== 'JP')){
        cur = cc;
        const {p, ctx} = await open(cc, 'new');
        const r = await p.evaluate(([ids, must]) => ids.map(id => byId(id)).filter(Boolean).map(r => {
            const m = algRecipeMap(r), hits = Object.keys(m).filter(k => m[k].some(x => x.kind !== 4));
            // 手順の文に書いた分の合計（「4〜5分」は大きいほう、「30秒」は0.5分）
            const sum = (r.stepsBase || r.steps).join(' ').split(/(?=\d)/).reduce((a, s) => { const mm = s.match(/^(\d+)(?:\s*[-–]\s*(\d+))?\s*(minutes?|seconds)/); return mm ? a + (mm[3].startsWith('sec') ? 0.5 : +(mm[2] || mm[1])) : a; }, 0);
            return {id: r.id, min: r.min, steps: stepCount(r), slot: slotOf(r), heavy: easyHeavy(r), sum, lack: (must[r.id] || []).filter(a => !hits.includes(a))};
        }), [NEW_IDS, MUST]);
        r.forEach(x => { seen.add(x.id);
            if (x.min > 10 || x.steps > 2 || x.heavy || !['汁物', '副菜'].includes(x.slot) || x.sum > x.min) bad.push(x.id + ' ' + JSON.stringify(x));
            if (x.lack.length) miss.push(x.id + ':' + x.lack.join(',')); });
        await ctx.close();
    }
    ok(seen.size === NEW_IDS.length, `新しい料理 ${seen.size}/${NEW_IDS.length} 品が各国のパックにある: ` + NEW_IDS.filter(x => !seen.has(x)).join(' '));
    ok(!bad.length, '新しい料理は10分以内・手順2つまで・揚げ物とオーブンなし・副菜か汁もの・手順に書いた分の合計が料理の時間以内: ' + bad.slice(0, 4).join(' | '));
    ok(!miss.length, '新しい料理のアレルゲンを、材料・調味料の言葉どおりに判定する: ' + miss.slice(0, 6).join(' | '));
}

// ---- R89・R74 の残り: 21か国 × 10分以内・いちばん簡単 ----
{
    const tot = {menus: 0, dishes: 0, overCap: 0, untagged: 0, soupOver10ten: 0, soupOver15simple: 0, relaxSoupTen: 0, relaxSoupSimple: 0, drop: 0};
    const all = {bad: [], untagged: [], swaps: [], lv: []};
    for (const cc of CCS){
        cur = cc;
        const {p, ctx} = await open(cc, 'r89');
        const r = await p.evaluate(() => {
            const out = {menus: 0, dishes: 0, bad: [], untagged: [], swaps: [], soupOver10ten: 0, soupOver15simple: 0, drop: 0, lv: {}};
            const cap = (mode, slot, f) => f.ids ? Infinity : modeCapMin(mode, slot);
            for (const mode of ['ten', 'simple']){
                session.mood = mode;
                out.lv[mode] = {soup: modeInfo(mode, '汁物').lv, side: modeInfo(mode, '副菜').lv, soupRelax: /汁もの/.test(modeRelaxText())};
                for (const dc of ['auto', 4]){
                    S.settings.dishCount = dc; save();
                    for (let k = 0; k < 2; k++){
                        session.mood = mode; session.rejected.clear(); newMenu(); render(); out.menus++;
                        const spots = [...document.querySelectorAll('#view .tray .spot:not(.rice)')];
                        session.menu.items.forEach((it, i) => {
                            const f = modeInfo(mode, it.slot), sp = spots.find(e => e.querySelector('[data-i="' + i + '"]'));
                            if (!it.r){ if (i > 0 && f.drop) out.drop++; return; }
                            out.dishes++;
                            if (it.r.min > cap(mode, it.slot, f)) out.bad.push(mode + ' ' + it.slot + ':' + it.r.name + '(' + it.r.min + '分)');
                            if (it.slot === '汁物' && mode === 'ten' && it.r.min > 10) out.soupOver10ten++;
                            if (it.slot === '汁物' && mode === 'simple' && it.r.min > 15) out.soupOver15simple++;
                            const over = mode === 'ten' ? it.r.min > 10 : simpleOver(it.r, it.slot);
                            if (over){ const tag = sp && sp.querySelector('.slot .badge.cap'), want = t('{n}分', {n: mode === 'ten' ? tenCap(it.r, it.slot) : it.r.min});
                                if (!tag || tag.textContent !== want) out.untagged.push(mode + ' ' + it.slot + ':' + it.r.name + '(' + it.r.min + '分) 札=' + (tag ? tag.textContent : 'なし')); }
                        });
                        if (k === 0 && dc === 4) session.menu.items.forEach((it, i) => { if (!it.r || i === 0) return; swapCands(i, null).forEach(c => { if (c.min > cap(mode, it.slot, modeInfo(mode, it.slot))) out.swaps.push(mode + ' ' + it.slot + ':' + c.name + '(' + c.min + '分)'); }); });
                    }
                }
            }
            S.settings.dishCount = 'auto'; save();
            return out;
        });
        tot.menus += r.menus; tot.dishes += r.dishes; tot.overCap += r.bad.length; tot.untagged += r.untagged.length; tot.drop += r.drop;
        tot.soupOver10ten += r.soupOver10ten; tot.soupOver15simple += r.soupOver15simple;
        if (r.lv.ten.soupRelax) tot.relaxSoupTen++; if (r.lv.simple.soupRelax && cc !== 'JP') tot.relaxSoupSimple++;
        all.bad.push(...r.bad.map(x => cc + ' ' + x)); all.untagged.push(...r.untagged.map(x => cc + ' ' + x)); all.swaps.push(...r.swaps.map(x => cc + ' ' + x));
        if (r.lv.ten.soup !== 0 || (cc !== 'JP' && r.lv.simple.soup !== 0)) all.lv.push(cc + ' ' + JSON.stringify(r.lv));
        await ctx.close();
    }
    cur = CCS.join(',');
    ok(!all.bad.length, `R89 10分以内（副菜・汁もの15分）・いちばん簡単（副菜・汁もの20分）の上限を超える料理で埋めない（${tot.menus}献立・${tot.dishes}品）: ` + all.bad.slice(0, 5).join(' | '));
    ok(!all.untagged.length, 'R89 条件を超える料理には、料理ごとに分の札（10分以内は上限、いちばん簡単はその料理の分）: ' + all.untagged.slice(0, 5).join(' | '));
    ok(!all.swaps.length, 'R89 「かえる」の候補も上限の中: ' + all.swaps.slice(0, 5).join(' | '));
    ok(tot.soupOver15simple === 0, `R89 いちばん簡単の汁ものは15分以内（${CCS.length}か国。前は25献立中18で20分以上）: ` + tot.soupOver15simple);
    ok(tot.soupOver10ten === 0 && !all.lv.length && !tot.relaxSoupTen, `R74 10分以内の汁ものは${CCS.length}か国とも10分以内で、ゆるめない（前は韓国・タイ 15分、ほかの国は汁ものなし）: ` + JSON.stringify({over10: tot.soupOver10ten, lv: all.lv.slice(0, 4), relax: tot.relaxSoupTen}));
    console.log('    R89・R74 まとめ: ' + JSON.stringify(tot));
}

// ---- R89: 上限の中に汁ものがないときは席をなしにして知らせる（アメリカで20分以内の汁ものを「今は出さない」にした場合） ----
{
    cur = 'US';
    const {p, ctx} = await open('US', 'drop');
    const r = await p.evaluate(() => {
        S.hidden = poolFor('汁物').filter(x => x.type === '汁物' && x.min <= 20).map(x => x.id); save();
        session.mood = 'simple'; const out = [];
        for (let k = 0; k < 3; k++){
            session.rejected.clear(); newMenu(); render();
            const so = session.menu.items.find(x => x.slot === '汁物'), sp = document.querySelector('#view .tray .spot.soup');
            out.push({soup: so ? (so.r ? so.r.name + '(' + so.r.min + '分)' : null) : '(席なし)', txt: sp ? (sp.querySelector('.nm.none') || {}).textContent || '' : '', add: !!(sp && sp.querySelector('[data-act=soup-add]')), relax: modeRelaxText()});
        }
        S.hidden = []; save();
        return out;
    });
    ok(r.every(x => x.soup === null && /20分以内の料理がないので、なし/.test(x.txt) && !x.add && /汁ものは20分以内の料理がないので、なし/.test(x.relax)), 'R89 いちばん簡単で20分以内の汁ものがなければ、席をなしにして、席と知らせに「汁ものは20分以内の料理がないので、なし」（長い汁もので埋めない・足すボタンも出さない）: ' + JSON.stringify(r[0]));
    await ctx.close();
}

// ---- アレルギー: 10分以内・いちばん簡単でも、選んだアレルゲンの料理は出さない（新しい料理を含む） ----
{
    const bad = []; let n = 0, newSeen = 0;
    for (const [cc, alg] of [['KR', ['egg', 'fish']], ['TH', ['egg', 'soy']], ['CN', ['crustacean', 'sesame']], ['US', ['milk', 'wheat']], ['TW', ['fish']], ['ID', ['egg']]]){
        cur = cc;
        const {p, ctx} = await open(cc, 'alg-' + alg.join(), {allergens: alg, dishCount: 4});
        const r = await p.evaluate(([ids]) => { const out = {n: 0, bad: [], newSeen: 0};
            for (const mode of ['ten', 'simple']) for (let k = 0; k < 5; k++){ session.mood = mode; session.rejected.clear(); newMenu();
                session.menu.items.forEach((it, i) => { if (!it.r) return; out.n++; if (ids.includes(it.r.id)) out.newSeen++; if (isAvoided(it.r) || algSelectedHits(it.r).length) out.bad.push(it.r.name); swapCands(i, null).forEach(c => { if (isAvoided(c) || algSelectedHits(c).length) out.bad.push('かえる:' + c.name); }); }); }
            return out; }, [NEW_IDS]);
        n += r.n; newSeen += r.newSeen; bad.push(...r.bad.map(x => cc + ':' + x));
        await ctx.close();
    }
    ok(!bad.length, `アレルギー: 10分以内・いちばん簡単の献立と「かえる」の候補に、選んだアレルゲンの料理はない（${n}品・うち新しい料理 ${newSeen}）: ` + bad.slice(0, 5).join(' | '));
}

// ---- R90: 主菜をひと回りするまで同じにしない（同じ国・同じモードで続けて作る・開き直す） ----
{
    const res = [];
    for (const cc of ['KR', 'TH', 'US', 'FR', 'JP']){
        cur = cc;
        const {p, ctx} = await open(cc, 'r90');
        for (const mode of ['ten', 'simple']){
            const r = await p.evaluate((mode) => {
                session.mood = mode;
                // 候補の数（おぼえを消して40回作り、出た主菜の種類）
                const pool = new Set(); for (let k = 0; k < 40; k++){ S.modeSeen = {}; session.rejected.clear(); newMenu(); pool.add(session.menu.items[0].r.id); }
                S.modeSeen = {}; save();
                const seq = []; for (let k = 0; k < 6; k++){ session.rejected.clear(); newMenu(); render(); seq.push(session.menu.items[0].r.id); }
                return {pool: pool.size, seq, keep: JSON.stringify(S.modeSeen)};
            }, mode);
            // 開き直しても、おぼえた続きから（最後に出した主菜を次にすぐ出さない）
            await p.reload(); await ready(p);
            const after = await p.evaluate((mode) => { if (typeof hasPro === 'function') hasPro = () => true; session.mood = mode; session.rejected.clear(); newMenu(); render(); return {id: session.menu.items[0].r.id, seen: modeSeenList()}; }, mode);
            const distinct = new Set(r.seq).size, rep = r.seq.some((x, i) => i && x === r.seq[i - 1]);
            const want = Math.min(6, r.pool);
            res.push({cc, mode, pool: r.pool, distinct, rep, reopenSame: r.pool > 1 && after.id === r.seq[r.seq.length - 1], kept: after.seen.length > 0});
        }
        await ctx.close();
    }
    cur = 'KR,TH,US,FR,JP';
    const bad = res.filter(x => x.distinct < Math.min(6, x.pool) || (x.pool > 1 && x.rep) || x.reopenSame || !x.kept);
    ok(!bad.length, 'R90 10分以内・いちばん簡単の主菜は、候補をひと回りするまで同じにならない（6回続けて・開き直しても）: ' + JSON.stringify(bad.slice(0, 3)));
    console.log('    R90 まとめ: ' + res.map(x => `${x.cc}/${x.mode} ${x.distinct}種類/候補${x.pool}`).join('  '));
}

// ---- R91: 訳のない言葉の画面の料理名 ----
{
    cur = 'R91';
    const u = await (async () => { const {p, ctx} = await open('JP', 'r91u'); const x = await p.evaluate(() => [
        nameReadable('ไก่ผัดขิง', 'th'), !nameReadable('ไก่ผัดขิง', 'vi'), nameReadable('麻婆豆腐', 'zh-Hans'), nameReadable('滷肉飯', 'zh-Hant'), !nameReadable('肉じゃが', 'zh-Hans'),
        nameReadable('肉じゃが', 'ja'), nameReadable('계란국', 'ko'), !nameReadable('계란국', 'ja'), nameReadable('Phở bò', 'id'), !nameReadable('滷肉飯', 'ko'), nameReadable('شوربة عدس', 'ar')]); await ctx.close(); return x; })();
    ok(u.every(Boolean), 'R91 料理名の文字が読める言葉（タイ文字はタイ語、漢字だけは中国語と日本語、ハングルは韓国語、ラテン文字はどの言葉も）: ' + JSON.stringify(u));
    // 中国語（簡体）の画面で日本: 漢字だけの料理名は漢字のまま（英語は副題と検索に）。かなのある料理名は英語のまま
    {
        const {p, ctx} = await open('JP', 'r91zh', {uiLang: 'zh-Hans'});
        const r = await p.evaluate(async () => { const m = byId('mapo'), n = byId('nikujaga'); openModal('mapo'); await new Promise(r => setTimeout(r, 50));
            const sub = (document.querySelector('#modal-root .sheet') || {}).textContent || ''; return {mapo: m && m.name, mapoAlt: m && m.alt, niku: n && n.name, sub: /Mapo tofu/.test(sub)}; });
        ok(r.mapo === '麻婆豆腐' && Array.isArray(r.mapoAlt) && r.mapoAlt.includes('Mapo tofu') && /^[\x20-\x7e]+$/.test(r.niku || '') && r.sub, 'R91 中国語の画面で日本: 漢字だけの料理名（麻婆豆腐）は漢字のまま・英語は副題に。かなのある料理名は英語: ' + JSON.stringify(r));
        await ctx.close();
    }
    // 中国語（簡体）の画面で台湾: その国の名前（漢字）。ベトナム語の画面でタイ: タイ文字は読めないので英語（その国の名前は副題）
    {
        const {p, ctx} = await open('TW', 'r91tw', {uiLang: 'zh-Hans'});
        const r = await p.evaluate(() => RECIPES.filter(x => x.main).slice(0, 5).map(x => x.name)); await ctx.close();
        ok(r.every(x => /\p{Script=Han}/u.test(x)), 'R91 中国語（簡体）の画面で台湾: 料理名はその国の名前（漢字）: ' + JSON.stringify(r));
        const v = await open('TH', 'r91vi', {uiLang: 'vi'});
        const r2 = await v.p.evaluate(() => RECIPES.filter(x => x.main).slice(0, 5).map(x => ({name: x.name, local: x.nameEn})));
        await v.ctx.close();
        ok(r2.every(x => x.name && !/[฀-๿]/.test(x.name) && /[฀-๿]/.test(x.local)) && r2.some(x => /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(x.name)), 'R91 ベトナム語の画面でタイ: ベトナム語の料理名（第23回の残りで訳を足した。タイの名前は副題に）: ' + JSON.stringify(r2.slice(0, 2)));
    }
}

await b.close();
ok(!errs.length, 'ページのエラーなし: ' + errs.slice(0, 3).join(' | '));
console.log(`\n${checks - fails}/${checks} 通過${fails ? '（失敗 ' + fails + '）' : ''}  SEED=${SEED}`);
process.exit(fails ? 1 : 0);
