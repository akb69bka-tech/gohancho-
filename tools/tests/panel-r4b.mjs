#!/usr/bin/env node
// 利用者モニター第4回の残り（R4 をほかの国に・置き換えた手順を各国の料理に）の回帰テスト（Playwright。使い方: node tools/tests/panel-r4b.mjs [http://localhost:8883/]）
//  R4X 21か国: 朝食の料理（Menemen・Porridge・Poha・Chilaquiles・ハムエッグなど）を、おまかせの夕食の主菜・1週間プランに出さない（さがす・自分で選ぶでは出す）。
//      イギリス（主食が最初「なし」）: どの献立にも主食になる物（じゃがいも・パン・米・パイ生地・麺）がある。主食を選んでいる日は副菜を主食に寄せない
//  R9X 各国の料理: 肉を豆腐などに置き換えた料理の手順に、肉だけの言い方（no longer pink・changes colour・1枚ずつ など）や元の肉の名前が残らない
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const want = k => !ONLY.length || ONLY.includes(k);
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(':')[0]); };
const LANG_OF = {JP: 'ja', US: 'en', GB: 'en'};
const open = async (settings = {}, opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: opt.locale || 'en-US', timezoneId: 'Asia/Tokyo' });
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('panel-r4b', JSON.stringify(settings))));
    await ctx.addInitScript(([st]) => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: Object.assign({country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2}, st)})); }, [settings]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL_); await ready(p);
    const cc = settings.country || 'JP';
    if (cc !== 'JP') await p.waitForFunction(cc => typeof PACK !== 'undefined' && PACK && PACK.country === cc, cc, {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { if (typeof hasPro === 'function') hasPro = () => true; });
    return {p, ctx};
};

// ---- R4X 朝食の料理を夕食の主菜にしない（21か国）・イギリスの主食 ----
// 朝食の印を付けた料理（この料理が、おまかせの主菜に出ないこと。一覧には残ること）
const BF = {
    JP: ['hamuegg'], US: ['us_pancakes', 'us_oatmeal', 'us_scrambledbacon', 'us_denveromelet'], GB: ['gb_porridge', 'gb_beansontoast'],
    CN: ['cn_baizhou', 'cn_pidan_shourou_zhou'], IN: ['in_poha', 'in_upma', 'in_alooparatha'], KR: ['kr_dakjuk', 'kr_soegogiyachaejuk'],
    MX: ['mx_huevos', 'mx_huevos_rancheros', 'mx_chilaquiles'], PH: ['ph_sinangag', 'ph_arroz_caldo'], TH: ['th_jokmoo'],
    TR: ['tr_menemen', 'tr_sucukluyumurta', 'tr_cilbir'], TW: ['tw_dan_bing'],
};
const ALL = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
if (want('R4X')){
    for (const cc of ALL){
        const {p, ctx} = await open({country: cc, uiLang: LANG_OF[cc] || 'en'});
        const r = await p.evaluate(ids => {
            const keep = session.menu, seen = new Set();
            for (let i = 0; i < 150; i++){ session.rejected.clear(); newMenu(); session.menu.items.filter(x => x.r && x.slot === '主菜').forEach(x => seen.add(x.r.id)); }
            makeWeek(); (S.week.days || []).forEach(x => seen.add(x.id));
            session.menu = keep;
            const bf = RECIPES.filter(r => r.meal === 'breakfast').map(r => r.id);
            return {hit: [...seen].filter(id => ids.includes(id) || bf.includes(id)), marked: bf, missing: ids.filter(id => !RECIPES.some(r => r.id === id)), mains: seen.size};
        }, BF[cc] || []);
        ok(!r.hit.length, `R4X-1 ${cc}: 朝食の料理がおまかせの主菜・1週間プランに出ない（主菜 ${r.mains}種）: ` + r.hit.join());
        ok(!r.missing.length && (BF[cc] || []).every(id => r.marked.includes(id) || cc === 'JP'), `R4X-2 ${cc}: 朝食の料理は一覧に残り、印が付いている: ` + r.missing.join() + ' / ' + r.marked.join());
        await ctx.close();
    }
    for (const n of [3, 4, 2]){
        const {p, ctx} = await open({country: 'GB', uiLang: 'en', dishCount: n});
        const r = await p.evaluate(() => {
            const keep = session.menu; let no = 0, ex = '';
            for (let i = 0; i < 200; i++){ session.rejected.clear(); newMenu(); const it = session.menu.items; if (!it.some(x => x.r && x.r.starch)){ no++; ex = ex || it.map(x => x.r && x.r.name).join(' / '); } }
            session.menu = keep; return {no, ex, spot: !!stapleSpot()};
        });
        ok(!r.spot && r.no === 0, `R4X-3 GB ${n}品: 主食「なし」の日も、どの献立にも主食になる物がある: ${r.no}/200 ` + r.ex);
        await ctx.close();
    }
    {
        const {p, ctx} = await open({country: 'GB', uiLang: 'en', dishCount: 3, stapleBy: {GB: 'bread'}});
        const r = await p.evaluate(() => { let st = 0, n = 0; for (let i = 0; i < 150; i++){ session.rejected.clear(); newMenu(); const x = session.menu.items.find(x => x.slot === '副菜' && x.r); if (x){ n++; if (x.r.starch) st++; } } return {spot: !!stapleSpot(), rate: st / Math.max(1, n)}; });
        ok(r.spot && r.rate < 0.8, 'R4X-4 GB: 主食（パンとバター）を選んでいる日は、副菜を主食に寄せない: ' + JSON.stringify(r));
        await ctx.close();
    }
    // 画面: イギリスで副菜を続けて「かえる」しても、ほかの料理は変わらず、主食がなくならない
    {
        const {p, ctx} = await open({country: 'GB', uiLang: 'en', dishCount: 3});
        let bad = '';
        for (let k = 0; k < 6; k++){
            const before = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
            const si = await p.evaluate(() => session.menu.items.findIndex((x, j) => j > 0 && x.slot === '副菜' && document.querySelector(`.tray [data-act="reroll"][data-i="${j}"]`)));
            if (si < 0){ bad = 'かえるボタンがない'; break; }
            await p.evaluate(j => document.querySelector(`.tray [data-act="reroll"][data-i="${j}"]`).click(), si); await p.waitForTimeout(250);
            const after = await p.evaluate(() => session.menu.items.map(x => ({id: x.r && x.r.id, st: !!(x.r && x.r.starch)})));
            if (after.some((x, j) => j !== si && x.id !== before[j])){ bad = 'ほかの料理が変わった'; break; }
            if (!after.some(x => x.st)){ bad = '主食のない献立になった ' + after.map(x => x.id).join(); break; }
        }
        ok(!bad, 'R4X-5 GB: 副菜を続けて「かえる」しても、ほかの料理は変わらず、主食がなくならない: ' + bad);
        await ctx.close();
    }
}

// ---- R9X 各国の料理で肉を置き換えた手順 ----
if (want('R9X')){
    const LANGS = {US: 'en', GB: 'en', FR: 'fr', DE: 'de', IT: 'it', ES: 'es', PL: 'pl', TR: 'tr', EG: 'ar', IN: 'hi', CN: 'zh-Hans', TW: 'zh-Hant', KR: 'ko', TH: 'th', VN: 'vi', ID: 'id', PH: 'fil', MX: 'es', BR: 'pt-BR', PE: 'es'};
    // 置き換えが多い国（豆腐への置き換えがある国を先に）。QUICK=1 のときはこの国だけ、ふだんは20か国
    const ccs = process.env.QUICK ? ['PH', 'TW', 'ID', 'KR', 'VN', 'CN', 'DE', 'ES', 'PL'] : ['PH', 'TW', 'ID', 'KR', 'VN', 'CN', 'DE', 'ES', 'PL', 'US', 'GB', 'FR', 'IT', 'TR', 'EG', 'IN', 'TH', 'MX', 'BR', 'PE'];
    let total = 0, tofuN = 0;
    for (const cc of ccs) for (const lang of [LANGS[cc], 'en', 'ja'].filter((v, i, a) => a.indexOf(v) === i)){
        const bad = [];
        for (const avoid of [['pork'], ['chicken'], ['beef'], ['pork', 'chicken', 'beef']]){
            const {p, ctx} = await open({country: cc, uiLang: lang, avoid});
            await p.waitForTimeout(300);
            const r = await p.evaluate(() => {
                const NOTE = /代わり|replaces|ipinalit|menggantikan|대신|thay cho|代替|แทน|ersetzt|remplace|sostituisce|sustituye|substitui|zastępuje|yerine|بدل|जगह/;
                const COLOR = /pink|\brosa|rosad|różow|pembe|وردي|गुलाबी|kulay-rosas|pumula|merah muda|붉은|粉紅|粉红|赤み|赤い|ピンク|色が変わ|變色|变色|hồng|สีชมพู/i;
                const out = {n: 0, tofu: 0, bad: []};
                RECIPES.forEach(r0 => {
                    const r = swappedRecipe(r0); if (!r.swapped || !r.swapped.swaps.length) return; out.n++;
                    const fams = [...new Set(r.swapped.swaps.map(x => meatFamOf(x.from)).filter(Boolean))].filter(f => !r.items.some(i => meatFamOf(i) === f));
                    const tofu = r.swapped.swaps.filter(x => x.tip === 'tofu'); if (tofu.length) out.tofu++;
                    const tw = [PACK_MEAT[stepLangOf(r)] && PACK_MEAT[stepLangOf(r)].tofu, ...tofu.map(x => String(shortLabel(x.to)))].filter(Boolean).map(s => s.toLowerCase());
                    r.steps.forEach((s, k) => String(typeof s === 'string' ? s : s.t).split(/(?<=[.!?。！？;；])\s*/).forEach(sn => {
                        if (NOTE.test(sn)) return;
                        const f = fams.find(f => NAME_FAM[f].test(sn.replace(/牛乳|牛脂/g, '')) && !/stock|broth|bouillon|caldo|brühe|bouillon|kaldu|sabaw|육수|高汤|高湯|ガラ/i.test(sn));
                        if (f) out.bad.push(r0.id + '#' + k + ' 元の肉(' + f + '): ' + sn);
                        if (tofu.length && tw.some(w => sn.toLowerCase().includes(w)) && COLOR.test(sn)) out.bad.push(r0.id + '#' + k + ' 豆腐に肉の色の目安: ' + sn);
                    }));
                });
                return out;
            });
            total += r.n; tofuN += r.tofu; bad.push(...r.bad.map(x => avoid.join('+') + ' ' + x));
            await ctx.close();
        }
        ok(!bad.length, `R9X-1 ${cc} ${lang}: 置き換えた手順に元の肉の言い方・肉の色の目安が残らない: ` + bad.slice(0, 3).join(' | '));
    }
    ok(total >= 30 && tofuN >= 5, `R9X-2 置き換えた料理を見た数: ${total}（豆腐 ${tofuN}）`);
    // 画面: フィリピンで肉を外した人がパンシットの作り方を開く
    {
        const {p, ctx} = await open({country: 'PH', uiLang: 'fil', avoid: ['pork', 'chicken', 'beef']});
        await p.evaluate(() => openModal('ph_pancit')); await p.waitForTimeout(400);
        const txt = await p.evaluate(() => document.querySelector('#modal-root').innerText);
        await p.screenshot({path: (process.env.SHOT_DIR || '/tmp') + '/R9X_pancit.png'}).catch(() => {});
        ok(/ilagay ang tokwa/.test(txt) && /Ang tokwa ang ipinalit sa/.test(txt) && !/ilagay ang manok|Ibalik ang manok/.test(txt), 'R9X-3 パンシット（フィリピン語）の手順が豆腐の文と説明になる: ' + (txt.match(/[^\n]*tokwa[^\n]*/) || [''])[0].slice(0, 160));
        await ctx.close();
    }
}

// ---- R10 料理の国・種類に合わないひと手間（洋風・中華・韓国のスープに「だしパック」など。北条の報告） ----
if (want('R10')){
    const JA = /だし|かつお節|七味|油揚げ/, EN = /\bdashi\b|bonito|shichimi|aburaage|fried tofu pouch/i;
    for (const [lang, locale, re] of [['ja', 'ja-JP', JA], ['en', 'en-US', EN]]){
        const {p, ctx} = await open({country: 'JP', uiLang: lang}, {locale});
        await p.waitForTimeout(400);
        const r = await p.evaluate(src => {
            const re = new RegExp(src[0], src[1]), out = {bad: [], wa: 0, n: 0};
            RECIPES.forEach(r => { const u = upgradeOf(r); if (!u) return; const txt = [u.add, u.why, u.skill, u.how].join(' ');
                if (r.genre !== '和'){ out.n++; if (re.test(txt)) out.bad.push(r.id + '(' + r.genre + '/' + r.method + '): ' + txt); }
                else if (r.method === '汁' && re.test(txt)) out.wa++; });
            const mine = RECIPES.find(x => x.id === 'minestrone'), mu = upgradeOf(mine);
            return Object.assign(out, {mine: mu ? [mu.add, mu.skill, mu.how].join(' / ') : ''});
        }, [re.source, re.flags]);
        ok(r.n > 20 && !r.bad.length, `R10-1 ${lang}: 洋・中・韓・エスニックの料理（${r.n}品）のひと手間に、だし・かつお節・七味・油揚げが出ない: ` + r.bad.slice(0, 3).join(' | '));
        ok(r.wa > 0, `R10-2 ${lang}: 和食の汁ものには、今までどおりだしのひと手間が出る: ${r.wa}品`);
        ok(r.mine && !re.test(r.mine), `R10-3 ${lang}: ミネストローネのひと手間: ` + r.mine);
        if (lang === 'ja'){
            const JA = /だし|かつお節|七味|油揚げ/;
            await p.evaluate(() => openModal('minestrone')); await p.waitForTimeout(400);
            const txt = await p.evaluate(() => (document.querySelector('#modal-root .skill') || {}).innerText || '');
            ok(txt && !JA.test(txt), 'R10-4 画面: ミネストローネの詳細のひと手間にだしパックが出ない: ' + txt.replace(/\n/g, ' / '));
        }
        await ctx.close();
    }
    for (const cc of ['US', 'IT', 'KR', 'CN']){
        const {p, ctx} = await open({country: cc, uiLang: 'ja'}, {locale: 'ja-JP'});
        const bad = await p.evaluate(src => { const re = new RegExp(src); return RECIPES.filter(r => { const u = upgradeOf(r); return u && re.test([u.add, u.why, u.skill, u.how].join(' ')) && /だしパック|七味/.test([u.add, u.how].join(' ')); }).map(r => r.id); }, JA.source);
        ok(!bad.length, `R10-5 ${cc}: 各国の料理に日本のだしパック・七味のひと手間が出ない: ` + bad.join());
        await ctx.close();
    }
}

await b.close();
if (errs.length){ console.log('ページのエラー:', [...new Set(errs)].slice(0, 5)); }
console.log(`panel-r4b: ${checks - fails}/${checks} 成功`);
process.exit(fails || errs.length ? 1 : 0);
