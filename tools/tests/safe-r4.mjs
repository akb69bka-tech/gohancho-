#!/usr/bin/env node
// 食の決まり・アレルギー（第3回 安全 R117・R118・R119）の回帰テスト（Playwright。使い方: node tools/tests/safe-r4.mjs [http://localhost:8765/]）
//  1) R117: ベジタリアン/ヴィーガン/ハラール等で外した材料が、手順の文に別の言い方（五花肉・Speck・saure Sahne・la nata・leche y queso・baboy）で残らない
//     （材料の名前が「Saure Sahne oder Joghurt」「Geräucherte Speckwürfel」のように長くても、手順の短い言い方まで外す）
//  2) R117: 料理の名前が、なくても可の材料（Speck・Wurst・ham・clams・egg）を名乗る料理は、その材料を外した人に出さない（Feldsalat mit Speck など）
//  3) R118: 卵のアレルギーで、食べ方の一言（ovo frito・huevo frito・huevos）が残らない
//  4) R119: ハラール（豚・お酒）にフランス「Tomates farcies」（Sausage meat か牛ひき肉）が出ない。「sausage meat」は豚のなかま
//  5) 全21か国・全料理: 手順の数を変えない・空の手順がない・外すだけの料理は材料の欄を変えない・独立の言葉リストで見た禁止語が手順に残らない
//  6) 判定は画面の言語に依らない（18言語で出す料理が同じ）
//  7) 守る言い方: スープの素・魚醤・ココナッツミルク・ワインビネガーの言葉は外さない／「eggplant」「creamy」は外さない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const { SEED, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
const LANGS = ['ja','en','ar','de','es','fil','fr','hi','id','it','ko','pl','pt-BR','th','tr','vi','zh-Hans','zh-Hant'];
const FAM = { halal: ['pork', 'alcohol'], vegi: ['pork', 'chicken', 'beef', 'fish', 'shellfish'], vegan: ['pork', 'chicken', 'beef', 'fish', 'shellfish', 'egg', 'dairy'], pork: ['pork'] };
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let fails = 0, opened = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
async function open(cc = 'JP', settings = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('safe-r4', String(++opened))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(([cc, settings]) => { window.__swapDirect = true; if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({ foldOpen: {}, onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: { country: cc, dishCount: 'auto', servings: 2, avoidSwap: true, ...settings } })); } }, [cc, settings]);
    await p.goto(URL_); await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(150);
    return { ctx, p };
}
// 手順の文・料理の名前を返す（その設定で出る料理だけ）。fams=苦手のなかま、alg=アレルゲン
const shown = (p, id, fams, alg) => p.evaluate(([id, fams, alg]) => { S.settings.avoid = fams.map(f => '@' + f); S.settings.allergens = alg;
    const x = RECIPES.find(r => r.id === id); if (!x) return { missing: true };
    if (isAvoided(x) || allergyConflict(x)) return { avoided: true };
    const sw = swappedRecipe(x) || x; return { steps: (sw.steps || []).map(s => typeof s === 'string' ? s : s.t) }; }, [id, fams, alg]);

// ---------- 1) R117 手順の文 ----------
{
    const cases = [
        ['CN', 'cn_jiachang_doufu', FAM.vegan, [], /五花肉/], ['CN', 'cn_ganbian_doujiao', FAM.vegan, [], /肉末/], ['CN', 'cn_shousi_baocai', FAM.vegan, [], /五花肉/], ['CN', 'cn_baicai_dun_fentiao', FAM.vegan, [], /五花肉/],
        ['CN', 'cn_baizhou', FAM.vegan, [], /鸡蛋/],
        ['DE', 'de_weissebohnen', FAM.vegan, [], /Speck/], ['DE', 'de_maultaschen', FAM.vegi, [], /Speck/], ['DE', 'de_rosenkohl', FAM.vegi, [], /Speck/], ['DE', 'de_schmorgurken', FAM.vegi, [], /Speck/], ['DE', 'de_rahmwirsing', FAM.vegi, [], /Speck/],
        ['DE', 'de_gurkensalat', FAM.vegan, [], /saure Sahne/i], ['DE', 'de_radieschensalat', FAM.vegan, [], /Joghurt/],
        ['ES', 'es_cremacalabaza', FAM.vegan, [], /\bnata\b/i], ['ES', 'es_cremazanahoria', FAM.vegan, [], /\bqueso\b/i], ['ES', 'es_pisto', FAM.vegan, [], /huevo/i],
        ['PE', 'pe_sopa_quinua', FAM.vegan, [], /leche|queso/i], ['PE', 'pe_pallares', FAM.vegan, [], /leche|queso/i], ['PE', 'pe_tacu_tacu', FAM.vegan, [], /huevo/i],
        ['PE', 'pe_arroz_pollo', FAM.halal, [], /cerveza/i],
        ['MX', 'mx_chiles_toreados', FAM.vegi, [], /carne asada/i], ['MX', 'mx_salsa_aguacate', FAM.vegi, [], /carne asada/i],
        ['PH', 'ph_adobong_sitaw', FAM.vegan, [], /baboy/i], ['PH', 'ph_laing', FAM.halal, [], /baboy/i],
        ['PL', 'pl_leczo', FAM.vegan, [], /kiełbas/i], ['IT', 'it_verza', FAM.vegan, [], /pancetta/i], ['TW', 'tw_lu_sungan', FAM.vegan, [], /五花肉/],
        ['JP', 'harusamesoup', FAM.vegan, [], /ひき肉/], ['JP', 'tofusteak', FAM.vegan, [], /ひき肉/],
    ];
    for (const cc of [...new Set(cases.map(c => c[0]))]){
        const { ctx, p } = await open(cc);
        for (const [c, id, fams, alg, re] of cases.filter(x => x[0] === cc)){
            const r = await shown(p, id, fams, alg);
            if (r.missing){ ok(false, `${id}: 料理が見つからない`); continue; }
            if (r.avoided) continue;   // 出さないのは安全側なのでよい
            ok(!r.steps.some(s => re.test(s)), `${c} ${id}: 外した材料が手順に残る ${r.steps.find(s => re.test(s))}`);
        }
        await ctx.close();
    }
    // 具体の文: 外したあとの文が、残す動作（塩をふる・パセリを添える）まで落とさない
    {
        const { ctx, p } = await open('PE');
        const r = await shown(p, 'pe_sopa_quinua', FAM.vegan, []);
        ok(r.steps && /orégano/.test(r.steps[3] || '') && /perejil/.test(r.steps[3] || ''), `pe_sopa_quinua: 外した材料のあとの動作（orégano・perejil）が残る: ${r.steps && r.steps[3]}`);
        await ctx.close();
        const o = await open('ES'); const e = await shown(o.p, 'es_cremacalabaza', FAM.vegan, []);
        ok(e.steps && /Tritura hasta que quede fina/.test(e.steps[3] || '') && /sirve caliente/.test(e.steps[3] || ''), `es_cremacalabaza: 「Tritura」の動作は残る: ${e.steps && e.steps[3]}`); await o.ctx.close();
    }
}

// ---------- 2) R117 料理の名前 ----------
{
    const names = [['DE', 'de_feldsalat', FAM.vegi], ['DE', 'de_bratkartoffeln', FAM.vegi], ['DE', 'de_kartoffelsuppe', FAM.vegi], ['DE', 'de_feldsalat', FAM.halal], ['BR', 'br_omelete', FAM.vegi], ['IT', 'it_uccelletto', FAM.vegan], ['ES', 'es_menestra', FAM.vegi], ['ES', 'es_merluzaverde', ['shellfish']]];
    for (const cc of [...new Set(names.map(c => c[0]))]){
        const { ctx, p } = await open(cc);
        for (const [c, id, fams] of names.filter(x => x[0] === cc)){
            const r = await shown(p, id, fams, []);
            ok(r.avoided === true, `${c} ${id} (${fams}): 名前が外した材料を名乗る料理は出さない`);
        }
        // 名前に当たらない料理は出す（過剰に外さない）: 苦手なしで出る料理は、同じ国で豚を外してもほとんど残る
        const keep = await p.evaluate(() => { S.settings.avoid = []; S.settings.allergens = []; const a = RECIPES.filter(r => r.items && !r.isTwist && !isCustomId(r.id) && !isAvoided(r)).length; S.settings.avoid = ['@pork']; const n = RECIPES.filter(r => r.items && !r.isTwist && !isCustomId(r.id) && !isAvoided(r)).length; return [a, n]; });
        ok(keep[1] > keep[0] * 0.5, `${cc}: 豚を外しても半分以上の料理が残る（${keep}）`);
        await ctx.close();
    }
}

// ---------- 3) R118 卵のアレルギー ----------
{
    const eg = [['BR', 'br_picadinho', /\bovos?\b/i], ['PE', 'pe_lentejas', /huevo/i], ['MX', 'mx_salsa_macha', /huevo/i]];
    for (const [cc, id, re] of eg){
        const { ctx, p } = await open(cc);
        const r = await shown(p, id, [], ['egg']);
        if (r.avoided) { await ctx.close(); continue; }
        ok(r.steps && !r.steps.some(s => re.test(s)), `${id}: 卵のアレルギーで食べ方の一言に卵が残る ${r.steps && r.steps.find(s => re.test(s))}`);
        ok(r.steps && r.steps.every(s => String(s).trim()), `${id}: 空の手順がない`);
        await ctx.close();
    }
}

// ---------- 4) R119 ハラールとフランス Tomates farcies ----------
{
    const { ctx, p } = await open('FR');
    const r = await shown(p, 'fr_tomatesfarcies', FAM.halal, []);
    ok(r.avoided === true, 'ハラール（豚・お酒）に Tomates farcies（Sausage meat か牛ひき肉）が出る');
    const r2 = await shown(p, 'fr_tomatesfarcies', ['beef'], []);
    ok(r2.avoided === true, '牛を外した人にも出さない（既存）');
    const r3 = await shown(p, 'fr_tomatesfarcies', [], []);
    ok(!r3.avoided, '苦手がなければ出る');
    await ctx.close();
}

// ---------- 5) 全21か国の全料理 ----------
{
    // 独立の禁止語（実装の言葉リストとは別に書く）。外した人に出す料理の手順に残ってはいけない言葉
    const BAN = {
        pork: /五花肉|\bSpeck\b|\bbaboy\b|\bpanceta\b|\blardons?\b|\bjamón\b|kiełbas|\blongganisa\b|\bpancetta\b|\bbacon\b|\bBauchspeck\b|\bpork belly\b/i,
        egg: /\bovo frito\b|\bhuevo (?:frito|duro)\b|\bfried egg\b|\bSpiegelei\b|鸡蛋|雞蛋|目玉焼き/i,
        dairy: /saure Sahne|\bsour cream\b|\bcrème fraîche\b|\bqueso\b|\bfromage\b|\bcheese\b|\bKäse\b/i,
        beef: /\bcarne asada\b|\bBeef\b|牛肉/,
    };
    let seen = 0;
    for (const cc of CCS){
        const { ctx, p } = await open(cc);
        const r = await p.evaluate(([FAM, BAN]) => { const out = { bad: [], n: 0, lens: [] }; const rx = {}; for (const k in BAN) rx[k] = new RegExp(BAN[k].src, BAN[k].fl);
            const sets = [['vegan', FAM.vegan, []], ['vegi', FAM.vegi, []], ['halal', FAM.halal, []], ['egg', [], ['egg']], ['milk', [], ['milk']]];
            for (const [sn, fams, alg] of sets){ S.settings.avoid = fams.map(f => '@' + f); S.settings.allergens = alg;
                const ban = sn === 'vegan' ? ['pork', 'egg', 'dairy', 'beef'] : sn === 'vegi' ? ['pork', 'beef'] : sn === 'halal' ? ['pork'] : sn === 'egg' ? ['egg'] : ['dairy'];
                RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id)).forEach(x => { if (isAvoided(x) || allergyConflict(x)) return; out.n++;
                    const sw = swappedRecipe(x) || x, tx = (sw.steps || []).map(s => typeof s === 'string' ? s : s.t);
                    if (tx.length !== (x.steps || []).length) out.bad.push(sn + ' ' + x.id + ' 手順の数が変わった');
                    tx.forEach((s, i) => { if (!String(s).trim()) out.bad.push(sn + ' ' + x.id + ' 空の手順 #' + (i + 1)); ban.forEach(k => { const keptItems = (sw.items || []).map(j => [j.name, j.label, j.key, j.en].join('|')).join('||'); if (rx[k].test(s) && !rx[k].test(keptItems)) out.bad.push(sn + ' ' + x.id + ' #' + (i + 1) + ' ' + k + ' ' + String(s).slice(0, 60)); }); });
                    if (!sw.swapped && sw !== x && sw.items !== x.items) out.bad.push(sn + ' ' + x.id + ' 外すだけの料理の材料の欄が変わった');
                    if (sw !== x && !sw.swapped && JSON.stringify(sw.items) !== JSON.stringify(x.items)) out.bad.push(sn + ' ' + x.id + ' 材料の欄が変わった');
                }); }
            return out; }, [FAM, Object.fromEntries(Object.entries(BAN).map(([k, v]) => [k, { src: v.source, fl: v.flags }]))]);
        seen += r.n;
        ok(r.bad.length === 0, `${cc}: ${r.bad.length}件 ${r.bad.slice(0, 4).join(' / ')}`);
        await ctx.close();
    }
    console.log(`全21か国: 見た料理（のべ）${seen}`);
    ok(seen > 5000, `料理を十分に見ている: ${seen}`);
}

// ---------- 6) 画面の言語に依らない ----------
{
    for (const cc of ['DE', 'FR', 'BR']){
        let base = null;
        for (const lang of LANGS){
            const { ctx, p } = await open(cc, { uiLang: lang, avoidSwap: false });   // 置き換えを切って比べる（置き換えの候補は画面の言語で決まる既存のしくみ。判定は材料のキー・元の言葉だけ）
            const r = await p.evaluate(FAM => { S.settings.allergens = []; const o = {}; for (const [k, fs] of Object.entries(FAM)){ S.settings.avoid = fs.map(f => '@' + f); o[k] = RECIPES.filter(x => x.items && !x.isTwist && !isCustomId(x.id) && !isAvoided(x)).map(x => x.id).join(','); } return o; }, FAM);
            if (!base) base = r; else for (const k of Object.keys(FAM)) ok(r[k] === base[k], `${cc} ${lang}: ${k} の出す料理が ${LANGS[0]} と違う`);
            await ctx.close();
        }
    }
}

// ---------- 7) 外さない言い方 ----------
{
    const { ctx, p } = await open('JP');
    const r = await p.evaluate(() => { const t = (s) => OMIT_PROTECT.test(s) ? (OMIT_PROTECT.lastIndex = 0, true) : false; OMIT_PROTECT.lastIndex = 0;
        const keep = ['chicken stock', 'caldo de pollo', 'Hühnerbrühe', 'fish sauce', 'nam pla', 'oyster sauce', '蚝油', 'coconut milk', 'leche de coco', 'peanut butter', 'eggplant', 'wine vinegar', 'vinagre de vino', 'Rotweinessig'];
        return keep.filter(k => !t(k)); });
    ok(r.length === 0, `外さない言い方が守られない: ${r}`);
    const lex = await p.evaluate(() => { const f = (fam, s, orph) => new RegExp(omitLexSrc(fam, orph), 'iu').test(s); return { a: f('egg', 'Add the eggplant'), b: f('dairy', 'until creamy'), c: f('dairy', 'cream the butter'), d: f('pork', 'Speckwürfel'), e: f('fish', '魷魚'), f: f('dairy', 'thick cream', true) }; });
    ok(!lex.a, '「eggplant」は卵の言葉に当たらない'); ok(!lex.b, '「creamy」は乳の言葉に当たらない'); ok(lex.c, '「cream」は乳の言葉'); ok(lex.d, '「Speckwürfel」は豚の言葉（語尾がつながる）'); ok(!lex.e, '「魷魚」（いか）は魚の言葉に当たらない'); ok(!lex.f, '材料の欄にない言葉では「cream」の濃さの言い方は見ない');
    await ctx.close();
}

console.log(errs.length ? '実行時エラー ' + errs.slice(0, 5).join(' | ') : '実行時エラーなし');
ok(errs.length === 0, '実行時エラー');
await b.close();
console.log(fails ? `NG ${fails}件` : 'OK safe-r4');
process.exit(fails ? 1 : 0);
