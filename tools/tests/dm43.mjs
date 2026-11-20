#!/usr/bin/env node
// dm43（第42回モニター: R198 の残り・R205）の回帰テスト
//  使い方: node tools/tests/dm43.mjs [http://localhost:9331/]   （ONLY=F1,F3 で絞る・CCS=JP,US で国を絞る）
//  F0 データ（ブラウザ不要）: 足した料理が国のパックにあり、日本語と現地語の訳がある。名前は短い（英語・現地語・日本語のかっこの外が40字以内）。
//     docs/dm41-low-carb-recipes.md に載っている
//  F1 R198 の残り（原因1）: 菜食（ベジタリアン向け）＋糖質ひかえめで、条件に合う糖質の多くない主菜がちょうど7品のとき、今日「かえる」で外した主菜（session.rejected）が
//     あっても、1週間プラン（明日から6日）に糖質の多い主菜を入れない（直す前: 1つ「かえる」と1日だけ糖質の多い主菜が入った）
//  F2 R198 の残り（原因2）: 合う主菜がちょうど7品で、そのうち1品を3日前に作った（○日以内に作った料理は出さない、で使えない）ときは、プランに糖質の多い主菜が入るので、
//     1週間プランの下に知らせ（CARB_TX.few）を出す。プランに糖質の多い主菜がないときは出さない。糖質ひかえめがオフなら出さない
//  F3 ヴィーガン＋糖質ひかえめ: ブラジル・フランス・イタリア・メキシコ・ベトナムで、糖質の多くない主菜が7品以上
//  F4 R205 魚なし: ベトナムで主菜 25 品以上・汁もの 8 品以上（魚醤の決まりは変えない: 魚醤を使う料理は魚なしで外れたまま）
//  F5 足した料理: 糖質・カロリーの目安がある・道具の印がある・魚なしで外れない（ベトナム）・ヴィーガン向けの主菜はヴィーガンで外れず、糖質が上限（主菜 20g）以下
//  F6 大豆ミート（textured soy protein・soya granules）は、しょうゆでなく大豆の行で数える
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = process.env.CCS ? process.env.CCS.split(',') : ALL_CC;
// 足した料理（docs/dm41-low-carb-recipes.md の「dm43」の表と同じ）。vegan: ヴィーガン向けの糖質の多くない主菜として足したもの
const NEW = {
    VN: ['vn_galuoc', 'vn_garangmuoi', 'vn_bobittet', 'vn_xaxiu', 'vn_suonxaochuangot', 'vn_tomrangmuoi', 'vn_dauhunhoithit', 'vn_dauhuchiensa', 'vn_carichay', 'vn_boxaobongcai', 'vn_comchienduongchau',
        'vn_bosotvang', 'vn_garoti', 'vn_launamchay', 'vn_tomhapnuocdua', 'vn_canhsuhao', 'vn_canhbau', 'vn_canhcaithaodauhu', 'vn_canhmuopnam', 'vn_canhchuachay', 'vn_canhkhoaitay', 'vn_canhsusu'],
    FR: ['fr_champignonsfarcis', 'fr_auberginesprovencale', 'fr_artichautsbarigoule', 'fr_poischichesblettes', 'fr_piperade', 'fr_fenouilbraise', 'fr_brochetteslegumes'],
    IT: ['it_ciambotta', 'it_melanzanefunghetto', 'it_cavolfioreaffogato', 'it_ziminoceci', 'it_scarolafagioli', 'it_carciofipiselli'],
    MX: ['mx_nopalesenchile', 'mx_picadillosoya', 'mx_champimexicana', 'mx_rajashongos', 'mx_calabacitasverde', 'mx_tingacoliflor'],
    BR: ['br_picadinho_soja', 'br_pimentao_soja', 'br_abobrinha_soja', 'br_tofu_acebolado', 'br_grao_bico_couve', 'br_moqueca_cogumelos', 'br_vagem_tofu'],
};
const VEGAN_LOW = ['vn_dauhuchiensa', 'vn_launamchay', 'fr_champignonsfarcis', 'fr_auberginesprovencale', 'fr_artichautsbarigoule', 'fr_poischichesblettes', 'fr_fenouilbraise', 'fr_brochetteslegumes',
    'it_ciambotta', 'it_melanzanefunghetto', 'it_cavolfioreaffogato', 'it_scarolafagioli', 'it_carciofipiselli', 'mx_nopalesenchile', 'mx_picadillosoya', 'mx_champimexicana', 'mx_rajashongos', 'mx_calabacitasverde', 'mx_tingacoliflor',
    'br_picadinho_soja', 'br_pimentao_soja', 'br_abobrinha_soja', 'br_tofu_acebolado', 'br_moqueca_cogumelos', 'br_vagem_tofu'];
const LANG = {VN: 'vi', FR: 'fr', IT: 'it', MX: 'es', BR: 'pt-BR'};
const FEW = '食の決まり・苦手などの条件と糖質ひかえめの両方に合う主菜が少ないため、ごはん・めん・いもの主菜も出ます';

// ---- F0 データ・訳・名前の長さ ----
if (want('F0')){
    const loadPack = f => { let d = null; vm.runInNewContext(fs.readFileSync(f, 'utf8'), {GOHAN_PACK: p => { d = p; }}); return d; };
    const loadTr = f => { let d = null; vm.runInNewContext(fs.readFileSync(f, 'utf8'), {GOHAN_PACK_TR: (cc, l, x) => { d = x; }}); return d; };
    const miss = [], long = [];
    for (const [cc, ids] of Object.entries(NEW)){
        const pk = loadPack(`${ROOT}/packs/${cc.toLowerCase()}.js`), tr = {ja: loadTr(`${ROOT}/packs/i18n/${cc.toLowerCase()}.ja.js`), [LANG[cc]]: loadTr(`${ROOT}/packs/i18n/${cc.toLowerCase()}.${LANG[cc]}.js`)};
        for (const id of ids){
            const r = pk.recipes.find(x => x.id === id); if (!r){ miss.push(id + ' パックにない'); continue; }
            if ([r.name, r.local].some(s => !s || s.length > 40)) long.push(id + ' ' + r.name + ' / ' + r.local);
            for (const [l, t] of Object.entries(tr)){ const x = (t.recipes || {})[id];
                if (!x || !x.name) { miss.push(`${id} ${l}`); continue; }
                if (l === 'ja' && !/[ぁ-んァ-ヶ一-龥]/.test(x.name)) miss.push(`${id} ja の名前が日本語でない`);
                const base = x.name.replace(/[（(][^）)]*[）)]/g, '').trim(); if (base.length > 40) long.push(`${id} ${l} ${x.name}`); }
        }
    }
    const n = Object.values(NEW).reduce((a, v) => a + v.length, 0);
    ok(!miss.length && n >= 45, `F0a 足した料理 ${n}品が国のパックにあり、日本語と現地語の訳がある: ` + miss.slice(0, 8).join(' / '));
    ok(!long.length, 'F0b 名前は 40 字以内（お膳で切れない）: ' + long.slice(0, 6).join(' / '));
    const doc = fs.readFileSync(path.resolve(ROOT, '../docs/dm41-low-carb-recipes.md'), 'utf8');
    const undoc = Object.values(NEW).flat().filter(id => !doc.includes('`' + id + '`'));
    ok(!undoc.length && doc.includes('## dm43'), 'F0c 足した料理は docs/dm41-low-carb-recipes.md の dm43 の表に載っている: ' + undoc.slice(0, 6).join(' '));
}

const b = await chromium.launch(LAUNCH);
const BASE_ST = {onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2, carb: true, carbNoted: true}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]};
const ctxOf = async (o, tag) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: o.h || 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('dm43', tag)));
    if (o.state) await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, o.state);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return {p, ctx};
};

if (want('F1') || want('F2') || want('F3') || want('F4') || want('F5') || want('F6')){
    const {p, ctx} = await ctxOf({state: BASE_ST}, 'f1');
    await p.waitForSelector('#view .tray', {timeout: 30000}); await p.waitForTimeout(200);
    const F1bad = [], F2bad = [], F3 = {}, F4 = {}, F5bad = [], F6bad = [];
    const ccs = [...new Set([...CCS, ...(want('F3') || want('F4') || want('F5') || want('F6') ? Object.keys(NEW) : [])])];
    for (const cc of ccs){
        const r = await p.evaluate(async ([cc, NEW, VEGAN_LOW, FEW, w]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            S.settings.carb = true; S.settings.avoid = []; S.history = []; S.hidden = []; S.week = null; session.rejected = new Set(); save();
            const out = {f1: [], f2: [], f5: [], f6: [], n: {}};
            const mains = () => poolForMood('主菜', 'all').filter(r => r.main && !isAvoided(r));
            // 菜食で、糖質の多くない主菜をちょうど7品にする（多い国は「今は出さない」で減らす。今日の献立は直す）
            const seven = () => {
                S.settings.avoid = dietBundleToggle([], 'vegi', S.settings); S.hidden = []; S.history = []; S.week = null; session.rejected = new Set();
                const okm = mains().filter(r => !carbHeavy(r)); S.hidden = okm.slice(7).map(r => r.id); save(); reconcileMenu();
                return okm.slice(0, 7);
            };
            if (w.f1){
                for (let k = 0; k < 4; k++){
                    const ok7 = seven(); if (ok7.length < 7){ out.f1.push('7品ない ' + ok7.length); break; }
                    const today = weekTodayMain(), rej = ok7.filter(r => !today || r.id !== today.id)[k % 6];
                    session.rejected = new Set([rej.id]); makeWeek();
                    S.week.days.slice(1).forEach((x, i) => { const r = byId(x.id); if (r && carbHeavy(r)) out.f1.push(`「かえる」で ${rej.id} を外した: ${i + 1}日目 ${r.id}`); });
                }
            }
            if (w.f2){
                const ok7 = seven();
                const noteIn = async () => { S.foldOpen = Object.assign({}, S.foldOpen, {week: true}); render(); await __tick(); const e = document.querySelector('#view .wk-carb-few'); return e ? e.textContent.trim() : ''; };
                makeWeek(); const heavy0 = S.week.days.slice(1).some(x => carbHeavy(byId(x.id))), n0 = await noteIn();
                if (heavy0 || n0) out.f2.push('合う主菜が7品・作った料理なし: ' + JSON.stringify({heavy0, n0}));
                const today = weekTodayMain(), cooked = ok7.find(r => !today || r.id !== today.id);
                S.history = [{d: addDays(TODAY, -3), id: cooked.id, name: cooked.name, slot: '主菜'}]; S.week = null; save(); makeWeek();
                const heavy1 = S.week.days.slice(1).some(x => carbHeavy(byId(x.id))), n1 = await noteIn();
                if (!heavy1 || n1 !== CARB_TX.few()) out.f2.push('3日前に1品作った: ' + JSON.stringify({heavy1, n1}));
                S.settings.carb = false; save(); const n2 = await noteIn(); S.settings.carb = true; save();
                if (n2) out.f2.push('オフでも知らせ: ' + n2);
            }
            S.settings.avoid = []; S.hidden = []; S.history = []; S.week = null; session.rejected = new Set(); save(); reconcileMenu();
            if (w.f3 && NEW[cc]){ S.settings.avoid = dietBundleToggle([], 'vegan', S.settings); out.n.vegan = mains().filter(r => !carbHeavy(r)).length; S.settings.avoid = []; }
            if (w.f4 && cc === 'VN'){ S.settings.avoid = ['fish'];
                out.n.fishMain = mains().length; out.n.fishSoup = poolFor('汁物').filter(r => slotOf(r) === '汁物' && !isAvoided(r)).length;
                out.n.fishSauceStill = ['vn_canhchua', 'vn_thitkhotrung', 'vn_canhcachua'].every(id => isAvoided(byId(id)));
                S.settings.avoid = []; }
            if (w.f5) for (const id of NEW[cc] || []){ const r = byId(id); if (!r){ out.f5.push(id + ' ない'); continue; }
                const c = carbOf(r); if (c.st === 'na') out.f5.push(id + ' 糖質の目安なし');
                if (kcalOf(r).st !== 'ok') out.f5.push(id + ' カロリーの目安なし');
                if (!toolsOf(r).length) out.f5.push(id + ' 道具の印なし');
                if (cc === 'VN'){ S.settings.avoid = ['fish']; if (isAvoided(r)) out.f5.push(id + ' 魚なしで外れる'); S.settings.avoid = []; }
                if (VEGAN_LOW.includes(id)){ S.settings.avoid = dietBundleToggle([], 'vegan', S.settings);
                    if (isAvoided(r)) out.f5.push(id + ' ヴィーガンで外れる'); if (carbHeavy(r) || !(c.st === 'low' || (c.st === 'ok' && c.raw <= 20))) out.f5.push(id + ' 糖質 ' + JSON.stringify(c)); S.settings.avoid = []; }
            }
            if (w.f6){ const ids = {BR: ['br_picadinho_soja'], MX: ['mx_picadillosoya'], IN: ['in_soyakeema']}[cc] || [];
                ids.forEach(id => { const x = byId(id) && kcalRaw(byId(id)); if (!x){ out.f6.push(id + ' ない'); return; } const row = x.rows.find(w => /soy prote|soya gran/i.test(w.txt || '')); if (!row || !row.f || /醤油/.test(row.f)) out.f6.push(id + ' ' + (row ? row.f : '行なし')); }); }
            save();
            return out;
        }, [cc, NEW, VEGAN_LOW, FEW, {f1: want('F1') && CCS.includes(cc), f2: want('F2') && CCS.includes(cc), f3: want('F3'), f4: want('F4'), f5: want('F5'), f6: want('F6')}]);
        if (r.f1.length) F1bad.push(cc + ' ' + r.f1.slice(0, 2).join(' / '));
        if (r.f2.length) F2bad.push(cc + ' ' + r.f2.slice(0, 2).join(' / '));
        if (r.n.vegan != null) F3[cc] = r.n.vegan;
        if (r.n.fishMain != null) Object.assign(F4, r.n);
        if (r.f5.length) F5bad.push(cc + ' ' + r.f5.slice(0, 4).join(' / '));
        if (r.f6.length) F6bad.push(cc + ' ' + r.f6.join(' / '));
    }
    if (want('F6')){ const {p: p2, ctx: c2} = {p, ctx}; const r = await p2.evaluate(async () => { if (currentCountry() !== 'IN') await setCountry('IN'); const x = kcalRaw(byId('in_soyakeema')); const row = x.rows.find(w => /soya gran/i.test(w.txt || '')); return row && row.f; }); if (!r || /醤油/.test(r)) F6bad.push('IN in_soyakeema ' + r); }
    if (want('F1')) ok(!F1bad.length, `F1 ${CCS.length}か国: 菜食＋糖質ひかえめで合う主菜がちょうど7品のとき、「かえる」で外した主菜があっても、1週間プランに糖質の多い主菜を入れない: ` + F1bad.slice(0, 6).join(' || '));
    if (want('F2')) ok(!F2bad.length, `F2 ${CCS.length}か国: 合う主菜が7品でも、○日以内に作ったため足りずプランに糖質の多い主菜が入るときは、プランの下に知らせ。入らないとき・オフでは出さない: ` + F2bad.slice(0, 6).join(' || '));
    if (want('F3')) ok(Object.keys(NEW).every(cc => F3[cc] >= 7), 'F3 ヴィーガン＋糖質ひかえめ: 糖質の多くない主菜が7品以上: ' + JSON.stringify(F3));
    if (want('F4')) ok(F4.fishMain >= 25 && F4.fishSoup >= 8 && F4.fishSauceStill, 'F4 ベトナム・魚なし: 主菜25品以上・汁もの8品以上（魚醤の料理は外れたまま）: ' + JSON.stringify(F4));
    if (want('F5')) ok(!F5bad.length, 'F5 足した料理: 糖質・カロリーの目安・道具の印がある、魚なし・ヴィーガンで外れない、ヴィーガン向けの主菜は糖質 20g 以下: ' + F5bad.slice(0, 6).join(' || '));
    if (want('F6')) ok(!F6bad.length, 'F6 大豆ミートは大豆の行で数える（しょうゆの行でない）: ' + F6bad.join(' || '));
    await ctx.close();
}

await b.close();
if (errs.length) { fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`dm43: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
