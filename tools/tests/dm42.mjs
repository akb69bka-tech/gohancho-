#!/usr/bin/env node
// dm42（第41回モニターの糖質ひかえめの直し: R196・R198・R202・R201・R195）の回帰テスト
//  使い方: node tools/tests/dm42.mjs [http://localhost:9281/]   （ONLY=E1,E3 で絞る・CCS=JP,US で国を絞る）
//  E0 文言（ブラウザ不要）: 知らせの文（CARB_TX.few）が 17 言語にある（日本語が残らない・病名や効き目の言い方がない）。説明の文は「いも・春雨・めんの入った汁ものは後に」のまま
//     足した料理（菜食で糖質の多くない主菜など）に、日本語と現地語の訳がある
//  E1 R196 材料の読み違い: 「egg noodles」「cheese tortellini」は卵・チーズでなく、めん・ギョーザ（主の語）の行で数える。21か国の全料理で、めん・パスタ・皮・パンの語が
//     後ろ（主の語）にあるのに、ほかの食材（卵・チーズ・肉…）の行に当たる材料がない。カロリーの目安も同じ行で数える（チキンヌードルスープの kcal が上がる）
//  E2 R201 説明と動き: いも・春雨・めん・ワンタンなどの入った汁ものは、量によらず糖質の多い料理（後に出す）。春雨スープ・チキンヌードルスープ・ワンタンスープ
//  E3 R198 菜食（ベジタリアン向け）＋糖質ひかえめ: 21か国で糖質の多くない主菜が 7 品以上、1週間プランの主菜に糖質の多い料理が出ない
//     足した料理は、糖質の目安が主菜 20g 以下（目安なしでない）・道具の印がある・ベジタリアン向けで外れない
//     合う主菜が少ない条件（ヴィーガン＋いくつかの苦手）では、お膳の下に知らせが出る。足りている条件では出ない
//  E4 R202 1週間使ったあとの1週間プラン: 糖質の多くない主菜を最近作っていても、その日に出せる（○日以内に作った料理は出さない、に当たらない）ものを先に選ぶ。
//     糖質の多い主菜を1週間プラン（明日から6日）に入れない。○日以内に作った料理も入れない
//  E5 R195 はじめての設定の使い方: 幅 360（文字ふつう）で6つとも帯より上に見える。帯に隠れる行がある画面（幅 320）では「▼ 続きを見る」が出て、押すと6つめが見える。
//     全部見えている画面（幅 390）では出ない
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, seedFor, pickCountry } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } else console.log('ok  ', m.split(': ')[0]); };
const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const ALL_CC = ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'EG', 'IN', 'CN', 'TW', 'KR', 'TH', 'VN', 'ID', 'PH', 'MX', 'BR', 'PE'];
const CCS = process.env.CCS ? process.env.CCS.split(',') : ALL_CC;
// 足した料理（docs/dm41-low-carb-recipes.md の「dm42」の表と同じ）
const NEW = {
    JP: ['nasuatsuagemiso', 'iridofu', 'tofukinokoankake'],
    US: ['us_tofubroccoli', 'us_tofuscramble', 'us_portobello', 'us_cauliflowersteak', 'us_spinachfrittata', 'us_zucchiniboats', 'us_cabbagetofu', 'us_tomatobasilsoup', 'us_cabbagesoup'],
    GB: ['gb_mushroomstroganoff', 'gb_halloumitraybake', 'gb_chickpeacurry', 'gb_tofustirfry', 'gb_auberginebake', 'gb_stuffedpeppers'],
    FR: ['fr_ratatouilleoeufs', 'fr_poeleechampignons', 'fr_tianchevre', 'fr_oeufscocotte', 'fr_gratinchoufleur', 'fr_courgettesfarcies'],
    DE: ['de_pilzzucchinipfanne', 'de_rahmspinatei', 'de_gemuesetofu', 'de_blumenkohlgratin', 'de_gefuelltezucchini', 'de_ruehreipilze', 'de_spitzkohltofu'],
    IT: ['it_zucchineripiene', 'it_involtinimelanzane', 'it_ceciespinaci', 'it_asparagibismarck'],
    ES: ['es_pistohuevo', 'es_revueltosetas', 'es_espinacasgarbanzos', 'es_tortillacalabacin', 'es_berenjenasrellenas', 'es_coliflorajoarriero', 'es_menestraverde'],
    PL: ['pl_gulaszpieczarki', 'pl_kalafiorzapiekany', 'pl_plackicukinia', 'pl_kapustagrzyby', 'pl_pieczarkifaszerowane'],
    TR: ['tr_kabaksinkonta', 'tr_etsizmusakka', 'tr_peynirlikarnabahar', 'tr_yumurtalipazi'],
    EG: ['eg_bamyaseyami', 'eg_tagenkhodar', 'eg_arnabeetsalsa', 'eg_kosabelbeid'],
    IN: ['in_paneertikka', 'in_soyakeema', 'in_bharwanbaingan'],
    CN: ['cn_xianggu_shaodoufu', 'cn_xihongshi_doufu', 'cn_muer_chaodan', 'cn_baicai_dun_doufu'],
    TW: ['tw_sanbei_doufu', 'tw_qingjiao_dougan', 'tw_xingbaogu_doufu'],
    KR: ['kr_dubuduruchigi', 'kr_beoseotjeongol', 'kr_chaeso_doenjangjjigae', 'kr_gajidububokkeum'],
    TH: ['th_pad_het_tofu', 'th_pad_thua_tofu', 'th_khaijiao_phak', 'th_taohu_songkhrueang'],
    VN: ['vn_namkhotieu', 'vn_trungchienhanhla'],
    ID: ['id_osengtempe', 'id_tumistahutauge', 'id_gulaitahu', 'id_tahubalado', 'id_teluradarsayur'],
    PH: ['ph_adobongtokwa', 'ph_ginisangampalaya', 'ph_adobongsitaw', 'ph_ginataangsitawtalong', 'ph_ginisangtoguetokwa'],
    MX: ['mx_calabacitasqueso', 'mx_huevosahogados', 'mx_rajasconcrema', 'mx_chilesrellenosqueso', 'mx_nopalesconhuevo', 'mx_hongosguajillo', 'mx_ejotesconhuevo'],
    BR: ['br_moqueca_ovos', 'br_abobrinha_recheada', 'br_berinjela_recheada', 'br_chuchu_ovos', 'br_fritada_espinafre', 'br_strogonoff_cogumelos', 'br_omelete_legumes'],
    PE: ['pe_tofu_saltado', 'pe_tortilla_espinaca', 'pe_saltado_champinones', 'pe_vainitas_huevo', 'pe_zapallito_relleno', 'pe_coliflor_brocoli_chifa', 'pe_crema_zapallito', 'pe_sopa_champinones'],
};
const FEW = '食の決まり・苦手などの条件と糖質ひかえめの両方に合う主菜が少ないため、ごはん・めん・いもの主菜も出ます';
const MORE = 'オンにすると、献立を選ぶときに、糖質の少ない料理を先に出し、ご飯もの・めん・いもの多い料理や、甘い煮もの・衣の厚い揚げ物、いも・春雨・めんの入った汁ものは後にします（外しはしません。決めた献立は変えません）。主食は小盛りで表示します。';
const DISEASE = /糖尿|血糖|インスリン|diabet|blood sugar|glucose|insulin|glyc[ae]mi|zucker(?:krank|spiegel)|glyc[ée]mie|glucemia|glicemia|cukrzyc|şeker hastal|السكري|मधुमेह|당뇨|혈당|เบาหวาน|tiểu đường|đường huyết|gula darah/i;
const CLAIM = /健康|改善|予防|治療|治る|効果|効く|やせ|痩せ|healthy|health|improv|prevent|cure|weight loss|gesund|santé|salud|saúde|salute|zdrow|sağlık|صحة|स्वास्थ्य|건강|สุขภาพ|sức khỏe|kesehatan|kalusugan/i;

// ---- E0 文言・訳 ----
if (want('E0')){
    const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
    ok(html.includes("t('" + FEW + "')") && html.includes("t('" + MORE + "')"), 'E0a 知らせの文は t() に通している。説明は「いも・春雨・めんの入った汁ものは後に」のまま（R201 は動きを説明に合わせた）');
    ok(!DISEASE.test(FEW) && !CLAIM.test(FEW), 'E0b 知らせの文に病名・効き目の言い方がない');
    const langs = fs.readdirSync(ROOT + '/i18n').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
    const bad = [];
    for (const lg of langs){
        let d = null; const c2 = {GOHAN_I18N: (l, o) => { d = o; }, window: {}}; vm.createContext(c2); vm.runInContext(fs.readFileSync(ROOT + '/i18n/' + lg + '.js', 'utf8'), c2);
        const v = d && d[FEW];
        if (typeof v !== 'string' || !v) bad.push(lg + ' 訳がない'); else { if (/[ぁ-んァ-ヶ]/.test(v)) bad.push(lg + ' 日本語が残る'); if (DISEASE.test(v) || CLAIM.test(v)) bad.push(lg + ' 病名・効き目'); }
    }
    ok(langs.length === 17 && !bad.length, 'E0c 知らせの文が17言語にある: ' + bad.join(' / '));
    // 足した料理の訳（日本語と現地語。英語の国は日本語だけ）
    const miss = [];
    const LANG = {US: 'en', GB: 'en', FR: 'fr', DE: 'de', IT: 'it', ES: 'es', PL: 'pl', TR: 'tr', EG: 'ar', IN: 'hi', CN: 'zh-Hans', TW: 'zh-Hant', KR: 'ko', TH: 'th', VN: 'vi', ID: 'id', PH: 'fil', MX: 'es', BR: 'pt-BR', PE: 'es'};
    const loadTr = f => { let d = null; vm.runInNewContext(fs.readFileSync(f, 'utf8'), {GOHAN_PACK_TR: (cc, l, x) => { d = x; }}); return d; };
    for (const [cc, ids] of Object.entries(NEW)){
        if (cc === 'JP'){ const en = loadTr(ROOT + '/packs/i18n/jp.en.js'); ids.forEach(id => { if (!html.includes("R('" + id + "',")) miss.push(id + ' R()'); if (!(en.recipes || {})[id]) miss.push(id + ' en'); }); continue; }
        const ls = ['ja', LANG[cc]].filter(l => l !== 'en');
        for (const l of ls){ const tr = loadTr(`${ROOT}/packs/i18n/${cc.toLowerCase()}.${l}.js`); ids.forEach(id => { const x = (tr.recipes || {})[id]; if (!x || !x.name) miss.push(`${id} ${l}`); else if (l === 'ja' && !/[ぁ-んァ-ヶ一-龥]/.test(x.name)) miss.push(`${id} ja の名前が日本語でない`); }); }
    }
    const n = Object.values(NEW).reduce((a, v) => a + v.length, 0);
    ok(!miss.length && n >= 100, `E0d 足した料理 ${n}品に、日本語と現地語の訳がある: ` + miss.slice(0, 8).join(' / '));
    const doc = fs.readFileSync(path.resolve(ROOT, '../docs/dm41-low-carb-recipes.md'), 'utf8');
    const undoc = Object.values(NEW).flat().filter(id => !doc.includes('`' + id + '`'));
    ok(!undoc.length, 'E0e 足した料理は docs/dm41-low-carb-recipes.md に載っている: ' + undoc.slice(0, 6).join(' '));
}

const b = await chromium.launch(LAUNCH);
const BASE_ST = {onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', uiLang: 'ja', dishCount: 3, servings: 2, carb: true, carbNoted: true}, family: [{id: 'f0', name: 'ゆうき', role: 'adult', avoid: [], allergy: []}]};
const ctxOf = async (o, tag) => {
    const ctx = await b.newContext({viewport: {width: o.w || 390, height: o.h || 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
    await ctx.addInitScript(seedScript(seedFor('dm42', tag)));
    if (o.state) await ctx.addInitScript(st => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify(st)); } }, o.state);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(URL_);
    await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && typeof GH !== 'undefined' && GH.booted, null, {timeout: 30000}).catch(() => {});
    await p.evaluate(() => { window.__tick = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); });
    return {p, ctx};
};

// ---- E1・E2・E3・E4（国ごと） ----
if (want('E1') || want('E2') || want('E3') || want('E4')){
    const {p, ctx} = await ctxOf({state: BASE_ST}, 'e1');
    await p.waitForSelector('#view .tray', {timeout: 30000}); await p.waitForTimeout(200);
    const E1bad = [], E2bad = [], E3bad = [], E3new = [], E4bad = [], lines = [];
    for (const cc of CCS){
        const r = await p.evaluate(async ([cc, NEW, w1, w2, w3, w4]) => {
            if (currentCountry() !== cc) await setCountry(cc);
            S.settings.carb = true; S.settings.avoid = []; S.history = []; S.hidden = []; S.week = null; save();
            const out = {e1: [], e2: [], e3: [], e3new: [], e4: [], n: {}};
            const all = RECIPES.filter(r => ['主菜', '副菜', '汁物', 'ごはん', '麺'].includes(r.type) || r.main);
            // E1: 主の語（めん・パスタ・ギョーザなどの皮・パン）が後ろにある材料が、ほかの食材の行に当たっていない
            if (w1){
                const HEAD = /(?:egg |wheat |rice |chinese |thin |wide |fresh |dried )?(?:noodles?|pasta|spaghetti|macaroni|tortellini|ravioli|dumplings?|wrappers?|gyoza|wontons?|bread|tortillas?|udon|soba|ramen|vermicelli)$|麺$|めん$|餃子の皮$|ワンタンの皮$/i;
                const STARCH = /noodle|canton|mee|pasta|baguette|french bread|buns?|rolls?|toast|スパゲ|マカロニ|dumpl|mandu|wrapper|皮|bread|pan\b|パン|tortilla|wrap|roti|udon|soba|そうめん|蕎麦|ramen|vermicelli|中華麺|焼きそば|bún|ビーフン|春雨|glass|rice|米|pastry|fresh/i;
                for (const r of all){ let x; try { x = kcalRaw(r); } catch (e) { continue; } if (!x || !x.rows) continue;
                    for (const w of x.rows){ if (w.seas || !w.f || !w.txt) continue; const lab = kcClean(String(w.txt).split('|')[0]); if (!HEAD.test(lab) || /sauce|soup|water|broth|stock|paste|flour|crumbs|seasoning|powder/i.test(lab)) continue; if (!STARCH.test(w.f)) out.e1.push(r.id + ': ' + lab + ' → ' + w.f.slice(0, 18)); } }
                if (cc === 'US'){ const c = carbOf(byId('us_chickennoodle')), t = carbOf(byId('us_tortellinisoup')), k = kcalOf(byId('us_chickennoodle'));
                    if (!(c.raw > 20 && carbHeavy(byId('us_chickennoodle')) && t.raw > 15 && carbHeavy(byId('us_tortellinisoup')) && k.st === 'ok' && k.v >= 380)) out.e1.push('US チキンヌードルスープ・トルテッリーニのスープ ' + JSON.stringify({c, t, k})); }
                if (cc === 'GB'){ const c = carbOf(byId('gb_quickchickennoodle')); if (!(c.raw > 15 && carbHeavy(byId('gb_quickchickennoodle')))) out.e1.push('GB 手早いチキンヌードルスープ ' + JSON.stringify(c)); }
            }
            // E2: いも・春雨・めん・皮の入った汁ものは、量によらず後に
            if (w2){
                const SOUP = /じゃがいも|さつまいも|里芋|春雨|うどん|そうめん|ワンタン|ラーメン|中華麺|マカロニ|パスタ|potato|noodle|vermicelli|pasta|macaroni|tortellini|ravioli|dumpling|wonton|orzo|glass noodle/i;
                poolForMood('汁物', 'all').filter(r => slotOf(r) === '汁物').forEach(r => { const has = (r.items || []).some(i => !i.opt && SOUP.test([i.key, i.en, i.name].join(' ')) && !/starch|片栗粉|leaves/i.test([i.key, i.en, i.name].join(' '))); if (has && !carbHeavy(r)) out.e2.push(r.id + ' ' + r.name); });
                if (cc === 'JP' && !carbHeavy(byId('harusamesoup'))) out.e2.push('JP 春雨スープが先に出る');
            }
            // E3: ベジタリアン向けで、糖質の多くない主菜が 7 品以上・1週間プランの主菜に糖質の多い料理がない・足した料理の点検
            if (w3){
                S.settings.avoid = dietBundleToggle([], 'vegi', S.settings); save(); reconcileMenu();
                const pool = poolForMood('主菜', 'all').filter(r => r.main && !isAvoided(r));
                out.n.vegi = pool.filter(r => !carbHeavy(r)).length;
                if (out.n.vegi < 7) out.e3.push('ベジタリアンで糖質の多くない主菜 ' + out.n.vegi + ' 品');
                for (let k = 0; k < 2; k++){ S.week = null; makeWeek(); S.week.days.slice(1).forEach(x => { const r = byId(x.id); if (r && carbHeavy(r)) out.e3.push('週 ' + r.id); if (r && isAvoided(r)) out.e3.push('週 当たる ' + r.id); }); }
                S.week = null;
                for (const id of NEW[cc] || []){ const r = byId(id); if (!r){ out.e3new.push(id + ' ない'); continue; }
                    const c = carbOf(r), lim = {'主菜': 20, '副菜': 12, '汁物': 12}[slotOf(r)];
                    if (c.st === 'na' || carbHeavy(r) || (c.st === 'ok' && c.raw > lim)) out.e3new.push(id + ' 糖質 ' + JSON.stringify(c));
                    if (!toolsOf(r).length) out.e3new.push(id + ' 道具の印なし');
                    if (kcalOf(r).st !== 'ok') out.e3new.push(id + ' カロリーの目安なし');
                    if (r.main && isAvoided(r) && r.items.every(i => !/egg|卵|cheese|チーズ|milk|cream|yogurt|ricotta|paneer|mozzarella|parmesan|feta|halloumi/i.test(i.key + i.en))) out.e3new.push(id + ' ベジタリアンで外れる'); }
                S.settings.avoid = []; save(); reconcileMenu();
            }
            // E4: 1週間使ったあと（糖質の多くない主菜を 4〜9日前に作った）の1週間プラン。明日から6日に糖質の多い主菜・○日以内に作った料理を入れない
            if (w4){
                const avoid = Number(S.settings.avoidDays) || 10;
                const ok = poolForMood('主菜', 'all').filter(r => r.main && !isAvoided(r) && !carbHeavy(r));
                // 作ってから日のたった料理だけが、プランの後ろの日に出せるようにする: 6品を 9〜4日前、残りは昨日〜3日前に作ったことにする（プランの7日のうちには出せない）
                const hist = []; ok.forEach((r, i) => { const ago = i < 6 ? 9 - i : 1 + (i % 3); hist.push({d: addDays(TODAY, -ago), id: r.id, name: r.name, slot: '主菜'}); });
                S.history = hist; save();
                for (let k = 0; k < 2; k++){ S.week = null; makeWeek();
                    S.week.days.slice(1).forEach((x, j) => { const r = byId(x.id), i = j + 1; if (!r) return; if (carbHeavy(r)) out.e4.push(`${i}日目 糖質の多い主菜 ${r.id}`); if (daysSince(r.id) + i < avoid) out.e4.push(`${i}日目 ${avoid}日以内に作った ${r.id}`); }); }
                S.history = []; S.week = null; save();
            }
            return out;
        }, [cc, NEW, want('E1'), want('E2'), want('E3'), want('E4')]);
        if (r.e1.length) E1bad.push(cc + ' ' + r.e1.slice(0, 3).join(' / '));
        if (r.e2.length) E2bad.push(cc + ' ' + r.e2.slice(0, 3).join(' / '));
        if (r.e3.length) E3bad.push(cc + ' ' + r.e3.slice(0, 3).join(' / '));
        if (r.e3new.length) E3new.push(cc + ' ' + r.e3new.slice(0, 3).join(' / '));
        if (r.e4.length) E4bad.push(cc + ' ' + r.e4.slice(0, 3).join(' / '));
        if (r.n.vegi != null) lines.push(cc + ' ' + r.n.vegi);
    }
    if (lines.length) console.log('   ベジタリアンで糖質の多くない主菜: ' + lines.join(' | '));
    if (want('E1')) ok(!E1bad.length, `E1 ${CCS.length}か国: 「egg noodles」「cheese tortellini」などを、めん・ギョーザの行で数える（糖質・カロリーとも）: ` + E1bad.slice(0, 6).join(' || '));
    if (want('E2')) ok(!E2bad.length, `E2 ${CCS.length}か国: いも・春雨・めん・皮の入った汁ものは後に（説明どおり）: ` + E2bad.slice(0, 6).join(' || '));
    if (want('E3')){
        ok(!E3bad.length, `E3a ${CCS.length}か国: ベジタリアン向け＋糖質ひかえめで、糖質の多くない主菜が7品以上・1週間プランに糖質の多い主菜が出ない: ` + E3bad.slice(0, 6).join(' || '));
        ok(!E3new.length, 'E3b 足した料理: 糖質の目安が上限以下・道具の印・カロリーの目安がある・肉や魚のない主菜はベジタリアン向けで外れない: ' + E3new.slice(0, 6).join(' || '));
    }
    if (want('E4')) ok(!E4bad.length, `E4 ${CCS.length}か国: 1週間使ったあとの1週間プランに、糖質の多い主菜・○日以内に作った主菜が入らない: ` + E4bad.slice(0, 6).join(' || '));
    await ctx.close();
}

// ---- E3c 知らせ（合う主菜が少ないとき） ----
if (want('E3')){
    const {p, ctx} = await ctxOf({state: Object.assign({}, BASE_ST, {settings: Object.assign({}, BASE_ST.settings, {country: 'BR'})})}, 'e3c');
    await p.waitForSelector('#view .tray', {timeout: 30000}); await p.waitForTimeout(200);
    const note = () => p.evaluate(() => [...document.querySelectorAll('#view .carb-few')].filter(e => e.getClientRects().length).map(e => e.textContent.trim()).join('|'));
    const n0 = await note();
    await p.evaluate(async () => { S.settings.avoid = dietBundleToggle([], 'vegan', S.settings); S.settings.avoid.push('mushroom'); save(); reconcileMenu(); render(); await __tick(); });
    const n1 = await note();
    await p.evaluate(async () => { S.settings.avoid = dietBundleToggle([], 'vegi', S.settings); save(); reconcileMenu(); render(); await __tick(); });
    const n2 = await note();
    await p.evaluate(async () => { S.settings.avoid = dietBundleToggle([], 'vegan', S.settings); S.settings.avoid.push('mushroom'); delete S.settings.carb; save(); reconcileMenu(); render(); await __tick(); });
    const n3 = await note();
    ok(!n0 && n1.includes(FEW) && !n2 && !n3, 'E3c 合う主菜が少ない条件（ヴィーガン＋きのこが苦手）だけ、お膳の下に知らせ。ベジタリアン・条件なし・オフでは出ない: ' + JSON.stringify({n0, n1, n2, n3}));
    await ctx.close();
}

// ---- E5 はじめての設定の使い方（幅 360・320・390、文字ふつう） ----
if (want('E5')){
    const res = [];
    for (const [w, h, lg] of [[360, 740, 'ja'], [320, 640, 'ja'], [320, 640, 'de'], [390, 844, 'ja']]){
        const {p, ctx} = await ctxOf({w, h, state: {onboarded: false, firstUse: '2026-10-01', settings: {country: '', uiLang: lg, dishCount: 'auto', servings: 2}}}, 'e5' + w + lg);
        await p.waitForSelector('#sheet-root [data-act=cc-choose]', {timeout: 30000});
        await pickCountry(p, 'JP');
        await p.waitForSelector('#sheet-root [data-act=ob-mode]', {timeout: 30000}); await p.waitForTimeout(600);
        const m = () => p.evaluate(() => { const bar = document.querySelector('#sheet-root .ob-actions').getBoundingClientRect(), rows = [...document.querySelectorAll('#sheet-root [data-act=ob-mode]')];
            const last = rows[rows.length - 1].getBoundingClientRect(), more = document.querySelector('#sheet-root .ob-more');
            return {n: rows.length, carbVis: last.bottom <= bar.top + 1 && last.top >= 0, hint: !!more && !more.hidden && more.getClientRects().length > 0, lastV: rows[rows.length - 1].dataset.v}; });
        const a = await m(); let after = null;
        if (a.hint){ await p.click('#sheet-root .ob-more'); await p.waitForTimeout(300); after = await m(); }
        res.push({w, lg, a, after});
        await ctx.close();
    }
    const r360 = res[0], r320 = res[1], r320de = res[2], r390 = res[3];
    ok(r360.a.n === 6 && r360.a.lastV === 'carb' && r360.a.carbVis && !r360.a.hint, 'E5a 幅360・文字ふつう: 6つめ「糖質ひかえめ」まで帯より上に見える（続きの印は出ない）: ' + JSON.stringify(r360));
    ok([r320, r320de].every(r => r.a.carbVis || (r.a.hint && r.after && r.after.carbVis && !r.after.hint)), 'E5b 幅320: 隠れる行があるあいだは「▼ 続きを見る」。押すと6つめが見え、印は消える: ' + JSON.stringify([r320, r320de]));
    ok(r390.a.carbVis && !r390.a.hint, 'E5c 幅390: 6つとも見えて、続きの印は出ない: ' + JSON.stringify(r390));
}

await b.close();
if (errs.length) { fails++; console.log('FAIL ページのエラー: ' + errs.slice(0, 5).join(' / ')); }
console.log(`dm42: ${checks - fails}/${checks} ok` + (fails ? `  NG ${fails}` : ''));
process.exit(fails ? 1 : 0);
