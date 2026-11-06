#!/usr/bin/env node
// 食の決まり（第2班 第1回 R2-01〜R2-05・R2-20）の回帰テスト（Playwright。使い方: node tools/tests/diet-r2.mjs [http://localhost:8765/]）
//  1) 判定表: 酒・みりん・ワイン／羊・鴨／魚醤・かつお節・肉のだし／はちみつ・マヨネーズ を、材料のキーと元の言葉の名前で見分ける（酢・酒粕・lamb's lettuce は外さない）
//  2) 全21か国の全料理: 「お酒」「ベジタリアン（豚・鶏・牛・魚・貝）」「ヴィーガン（＋卵・乳）」で出る料理に、はっきり避けるものが 0 品。
//     コンソメ・ブイヨン・ウスターソースなど「かもしれない」ものを使う料理には必ず 🔍（dietMayHits）が付く
//  3) 打った言葉: 「酒」「料理酒」「みりん」「赤ワイン」「wine」は「お酒」のなかまに読みかわり、酒粕は外さない
//  4) 画面の言語18種: 同じ設定なら、どの言語でも出す料理が同じ（置き換えを切って比べる＝材料のキー・元の言葉だけで決まる）
//  5) 主菜の数: 21か国のどこでも、ヴィーガンの主菜 5品以上・ベジタリアンの主菜 8品以上・ヴィーガンの副菜 5品以上・汁もの 2品以上
//  6) 主菜が0品になる条件: 「決定」は押せないが、理由と次にすること（設定を開く）が画面に出る（行き止まりにしない）
//  7) 言葉: 宗教や専門機関の判断を言う言葉（ハラール認証・戒律・認定 など）を、新しい文言に使わない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const { SEED, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
const LANGS = ['ja','en','ar','de','es','fil','fr','hi','id','it','ko','pl','pt-BR','th','tr','vi','zh-Hans','zh-Hant'];
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let fails = 0, opened = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
async function open(cc = 'JP', settings = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('diet-r2', String(++opened))));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message));
    await p.addInitScript(([cc, settings]) => { window.__swapDirect = true; if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({ foldOpen: {upg: true, tw: true, week: true}, onboarded: true, firstUse: new Date().toISOString().slice(0, 10), settings: { country: cc, dishCount: 'auto', servings: 2, ...settings } })); } }, [cc, settings]);
    await p.goto(URL_); await p.waitForFunction(() => typeof S !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(150);
    await p.evaluate(() => { hasPro = () => true; });
    return { ctx, p };
}
const PROF = {
    halal: ['@pork', '@alcohol'],
    vegi: ['@pork', '@chicken', '@beef', '@fish', '@shellfish'],
    vegan: ['@pork', '@chicken', '@beef', '@fish', '@shellfish', '@egg', '@dairy'],
};

// ---------- 1) 判定表 ----------
{
    const { ctx, p } = await open('JP');
    // [設定, 材料の名前（キー）, 英語の名前, 期待: 'x'=外す / '?'=🔍 / '-'=外さない]
    const T = [
        ['halal', '酒', '', 'x'], ['halal', '料理酒', '', 'x'], ['halal', 'みりん', '', 'x'], ['halal', '赤ワイン', '', 'x'], ['halal', '白ワイン', '', 'x'], ['halal', 'ビール', '', 'x'],
        ['halal', 'shaoxing wine', 'Shaoxing wine', 'x'], ['halal', 'vin rouge', 'Red wine', 'x'], ['halal', 'Weißwein', 'White wine', 'x'], ['halal', 'sake', 'Sake', 'x'], ['halal', 'mirin', 'Mirin', 'x'], ['halal', 'cerveza', 'Beer', 'x'], ['halal', '紹興酒', '', 'x'], ['halal', '미림', '', 'x'], ['halal', '料酒', '', 'x'], ['halal', 'rượu', '', 'x'],
        ['halal', '酒粕', '', '-'], ['halal', 'ワインビネガー', '', '-'], ['halal', 'red wine vinegar', 'Red wine vinegar', '-'], ['halal', 'vinagre de vino', 'Wine vinegar', '-'], ['halal', 'aceto di vino rosso', 'Red wine vinegar', '-'], ['halal', 'rice vinegar', '', '-'], ['halal', 'しょうゆ', '', '-'], ['halal', 'Gin', '', 'x'], ['halal', 'ginger', 'Ginger', '-'], ['halal', 'Port Salut', '', '-'],
        ['vegi', '羊肉', '', 'x'], ['vegi', 'ラムチョップ', 'Lamb chops', 'x'], ['vegi', 'duck', 'Duck breast', 'x'], ['vegi', 'agneau', 'Lamb', 'x'], ['vegi', 'canard', 'Duck', 'x'], ['vegi', 'Lammfleisch', '', 'x'], ['vegi', 'goose', 'Goose', 'x'], ['vegi', 'turkey', 'Turkey breast', 'x'], ['vegi', '양고기', '', 'x'], ['vegi', '羊肉', '', 'x'],
        ['vegi', "lamb's lettuce", "Lamb's lettuce", '-'], ['vegi', 'lambs lettuce', 'Lambs lettuce', '-'], ['vegi', 'goat cheese', 'Goat cheese', '-'], ['vegi', 'ごま', '', '-'],
        ['vegi', 'ナンプラー', '', 'x'], ['vegi', 'オイスターソース', '', 'x'], ['vegi', 'fish sauce', 'Fish sauce', 'x'], ['vegi', 'oyster sauce', 'Oyster sauce', 'x'], ['vegi', 'น้ำปลา', 'Fish sauce', 'x'], ['vegi', 'nước mắm', '', 'x'], ['vegi', 'shrimp paste', 'Shrimp paste', 'x'], ['vegi', 'terasi', 'Terasi', 'x'], ['vegi', 'bagoong', 'Bagoong', 'x'], ['vegi', 'かつお節', '', 'x'], ['vegi', '煮干し', '', 'x'], ['vegi', 'ほんだし', '', 'x'], ['vegi', '和風だしの素', '', 'x'], ['vegi', 'chicken stock', 'Chicken stock', 'x'], ['vegi', 'beef bouillon cube', 'Beef bouillon', 'x'], ['vegi', 'caldo de pollo', 'Chicken stock', 'x'], ['vegi', 'ゼラチン', '', 'x'], ['vegi', 'gelatin', 'Gelatin', 'x'],
        ['vegi', '昆布だし', '', '-'], ['vegi', 'kombu dashi', 'Kombu dashi', '-'], ['vegi', 'vegetable stock', 'Vegetable stock', '-'], ['vegi', 'しいたけ', '', '-'], ['vegi', 'oyster mushroom', 'Oyster mushrooms', '-'],
        ['vegi', 'コンソメ', '', '?'], ['vegi', 'ブイヨン', '', '?'], ['vegi', 'stock cube', 'Stock cube', '?'], ['vegi', 'bouillon', 'Bouillon', '?'], ['vegi', 'consommé', 'Consommé', '?'], ['vegi', 'Worcestershire sauce', 'Worcestershire sauce', '?'], ['vegi', 'ウスターソース', '', '?'], ['vegi', 'kimchi', 'Kimchi', '?'], ['vegi', 'vegetable bouillon', 'Vegetable bouillon', '-'],
        ['vegan', 'はちみつ', '', 'x'], ['vegan', 'honey', 'Honey', 'x'], ['vegan', 'miel', 'Honey', 'x'], ['vegan', 'น้ำผึ้ง', '', 'x'], ['vegan', 'mật ong', '', 'x'], ['vegan', 'マヨネーズ', '', 'x'], ['vegan', 'mayonnaise', 'Mayonnaise', 'x'], ['vegan', 'mayonesa', '', 'x'], ['vegan', 'aioli', 'Aioli', 'x'], ['vegan', 'maple syrup', 'Maple syrup', '-'], ['vegan', 'ココナッツミルク', '', '-'],
        ['vegi-nohoney', 'はちみつ', '', '-'], ['vegi-nohoney', 'honey', 'Honey', '-'], ['egg', 'マヨネーズ', '', 'x'], ['egg', 'mayonnaise', 'Mayonnaise', 'x'],
    ];
    const PRF = { halal: PROF.halal, vegi: PROF.vegi, 'vegi-nohoney': PROF.vegi, vegan: PROF.vegan, egg: ['@egg'] };
    const res = await p.evaluate(([T, PRF]) => {
        S.settings.allergens = []; S.settings.avoidSwap = false; const bad = [];
        for (const [pf, key, en, want] of T){
            S.settings.avoid = PRF[pf]; const c = avoidCtx();
            const it = {name: key, label: key, key: keyOf(key), en, ...(en ? {} : {})};
            const strict = itemAvoided(it, c), may = dietMayItem(c, it);
            const got = strict ? 'x' : may ? '?' : '-';
            if (got !== want) bad.push(pf + ' ' + key + ' (' + en + ') 期待' + want + ' 実際' + got);
        }
        return bad; }, [T, PRF]);
    ok(res.length === 0, '判定表: ' + res.join(' / '));
    // 食の決まりになる条件: 豚・鶏・牛・魚・貝の5つ（ベジタリアン）／＋卵・乳（ヴィーガン）。4つだけでは自動で足さない
    const c4 = await p.evaluate(() => { S.settings.avoid = ['@pork', '@chicken', '@beef', '@fish']; const c = avoidCtx(); return {diet: c.diet, fams: c.fams}; });
    ok(c4.diet.length === 0 && !c4.fams.includes('othermeat'), `4つ（貝なし）はベジタリアンとみなさない: ${JSON.stringify(c4)}`);
    const c5 = await p.evaluate(() => { S.settings.avoid = ['@pork', '@chicken', '@beef', '@fish', '@shellfish']; const c = avoidCtx(); return {diet: c.diet, fams: c.fams}; });
    ok(c5.diet.includes('vegi') && !c5.diet.includes('vegan') && c5.fams.includes('othermeat'), `5つ = ベジタリアン: ${JSON.stringify(c5)}`);
    const chips = await p.evaluate(() => { S.settings.avoid = ['@pork']; return avoidChipsHtml(S.settings.avoid, 'avoid', 'avoid-fam', true); });
    ok(/data-v="alcohol"/.test(chips) && /data-v="othermeat"/.test(chips), '苦手のチップに「お酒」「羊・鴨など」がある');
    ok(/avoid-hint/.test(chips), '豚だけ外したときの一言（お酒は外れない）が出る');
    await ctx.close();
}

// ---------- 2) 全21か国の全料理 ----------
const STRICT = {
    alc: /みりん|味醂|料理酒|日本酒|清酒|酒(?![粕かす糟])|ワイン|ビール|ブランデー|ラム酒|紹興酒|焼酎|\b(?:white |red |dry |cooking |rice |sweet )?wine\b|\bbeer\b|\bsake\b|\bmirin\b|\bbrandy\b|\brum\b|\bliqueur\b|\bvodka\b|\bwhisk(?:e)?y\b|shaoxing|\bsherry\b|marsala|tequila|pisco|cacha[cç]a|\bvin (?:blanc|rouge)\b|\bvino (?:bianco|rosso|blanco|tinto|branco)\b|wei[sß]wein|rotwein|\bpiwo\b|\bwino\b|\bcerveza\b|\bcerveja\b|와인|맥주|소주|미림|料酒|黄酒|米酒|rượu/i,
    alcFP: /vinegar|vinagre|vinaigre|aceto|essig|ocet|ビネガー|酢|식초|醋|น้ำส้มสายชู/i,
    othermeat: /\blamb\b(?!['’]?s? ?lettuce)|\bmutton\b|\bduck\b|\bgoose\b|\bturkey\b|\brabbit\b|\bvenison\b|羊肉|ラム肉|マトン|合鴨|鴨肉|ダック|agneau|cordero|lammfleisch|agnello|cordeiro/i,
    animal: /魚醤|ナンプラー|オイスターソース(?!の代わり)|アンチョビ|fish sauce|oyster sauce|\banchov|nam pla|nước mắm|\bpatis\b|kecap ikan|\bterasi\b|\bbelacan\b|bagoong|shrimp paste|dầu hào|น้ำปลา|กะปิ|ซอสหอยนางรม|蠔油|蚝油|虾酱|蝦醬|魚露|액젓|새우젓|멸치|かつお節|かつおぶし|削り節|煮干し|ほんだし|だしの素|ゼラチン|\bgelatin|鶏ガラ|鶏がら|ガラスープ|(?:chicken|beef|pork|meat|bone) (?:stock|broth|bouillon)\b/i,
    honey: /はちみつ|蜂蜜|\bhoney\b|\bmiel\b|\bmiele\b|\bhonig\b|\bmiód\b|\bmadu\b|mật ong|น้ำผึ้ง|꿀/i,
    mayo: /マヨ|mayonnaise|mayonesa|maionese|majonez|mayonez|aioli|مايونيز/i,
};
const MAY = /コンソメ|ブイヨン|consomm[eé]|\bbouillon\b|stock cube|worcestershire|ウスター|めんつゆ|kimchi|キムチ|김치|sambal/i;
{
    const stat = {};
    for (const cc of CCS){
        const { ctx, p } = await open(cc);
        const r = await p.evaluate(([PROF, STRICT, MAY]) => {
            const R = {}; S.settings.allergens = [];
            const re = Object.fromEntries(Object.entries(STRICT).map(([k, v]) => [k, new RegExp(v[0], v[1])]));
            const mayRe = new RegExp(MAY[0], MAY[1]);
            for (const [pf, av] of Object.entries(PROF)){
                S.settings.avoid = av; try { save(); } catch (e) {}
                const o = {total: 0, okN: 0, bad: [], mayNo: [], mayN: 0, mains: 0, sides: 0, soups: 0};
                RECIPES.filter(r => r.items && !r.isTwist && !isCustomId(r.id)).forEach(r => { o.total++; if (isAvoided(r) || allergyConflict(r)) return; o.okN++;
                    const sw = swappedRecipe(r) || r, nm = i => [i.name, i.label, i.en, i.key].filter(Boolean).join(' '), seas = typeof seasSwapText === 'function' ? seasSwapText(String(sw.seasBase != null ? sw.seasBase : (sw.seas || '')), sw) : '';
                    const txt = [(sw.items || []).map(nm).join(' | '), seas].join(' | ');
                    const hit = (k, rx) => { const m = txt.match(rx); return m ? txt.slice(Math.max(0, m.index - 24), m.index + 30) : null; };
                    const chk = [];
                    if (pf === 'halal'){ const m = txt.replace(/[^|]*?(?:vinegar|vinagre|vinaigre|aceto|essig|ocet|ビネガー|酢)[^|]*/gi, ' ').match(re.alc); if (m) chk.push('alc:' + m[0]); }
                    if (pf !== 'halal'){
                        const t2 = txt.replace(/lamb['’]?s? lettuce/gi, ' '); const m1 = t2.match(re.othermeat); if (m1) chk.push('othermeat:' + m1[0]);
                        const m2 = txt.match(re.animal); if (m2) chk.push('animal:' + m2[0]);
                    }
                    if (pf === 'vegan'){ const m3 = txt.match(re.honey); if (m3) chk.push('honey:' + m3[0]); }
                    if (pf === 'vegan' || false){ const m4 = txt.match(re.mayo); if (m4) chk.push('mayo:' + m4[0]); }
                    if (chk.length) o.bad.push(r.id + ' ' + chk.join(','));
                    if (pf !== 'halal' && txt.split(/[|·・]/).some(seg => mayRe.test(seg) && !/vegetable|vegan|veg |mushroom|kombu|野菜|昆布|椎茸/i.test(seg) && !re.animal.test(seg))){ o.mayN++; if (!dietMayHits(r).length) o.mayNo.push(r.id); }
                    if (r.main) o.mains++; else if (slotOf(r) === '副菜') o.sides++; else if (slotOf(r) === '汁物') o.soups++; });
                R[pf] = o; }
            return R; }, [PROF, Object.fromEntries(Object.entries(STRICT).map(([k, v]) => [k, [v.source, v.flags]])), [MAY.source, MAY.flags]]);
        for (const pf of Object.keys(PROF)){
            const o = r[pf]; stat[pf] = stat[pf] || {total: 0, okN: 0, bad: 0, mayN: 0};
            stat[pf].total += o.total; stat[pf].okN += o.okN; stat[pf].bad += o.bad.length; stat[pf].mayN += o.mayN;
            ok(o.bad.length === 0, `${cc} ${pf}: はっきり避けるものが残っている ${o.bad.length}品 ${o.bad.slice(0, 4).join(' / ')}`);
            ok(o.mayNo.length === 0, `${cc} ${pf}: コンソメ等の 🔍 が付かない料理 ${o.mayNo.join(' ')}`);
            if (pf === 'vegi') { ok(o.mains >= 8, `${cc} ベジタリアンの主菜が ${o.mains}品（8品以上）`); }
            if (pf === 'vegan') { ok(o.mains >= 5, `${cc} ヴィーガンの主菜が ${o.mains}品（5品以上）`); ok(o.sides >= 5, `${cc} ヴィーガンの副菜が ${o.sides}品（5品以上）`); ok(o.soups >= 2, `${cc} ヴィーガンの汁ものが ${o.soups}品（2品以上）`); }
        }
        await ctx.close();
    }
    console.log('全21か国の集計:', JSON.stringify(stat));
}

// ---------- 3) 打った言葉 ----------
{
    const { ctx, p } = await open('JP');
    const r = await p.evaluate(() => {
        const o = {}; S.settings.allergens = []; S.settings.avoidSwap = false;
        for (const w of ['酒', '料理酒', 'みりん', '赤ワイン', 'wine', 'お酒', 'alcohol']){
            const typed = avoidWords(w); S.settings.avoid = typed.length ? typed : [w];
            const rs = RECIPES.filter(r => r.items && !isCustomId(r.id)), left = rs.filter(r => !isAvoided(r) && /みりん|ワイン|料理酒|^酒|[・\s]酒\s/.test(r.items.map(i => i.key).join('|') + ' ' + String(r.seasBase || '')));
            o[w] = { fam: avoidFamOf(S.settings.avoid[0]), typed: typed.length, n: rs.filter(r => isAvoided(r)).length, left: left.map(r => r.id).slice(0, 3), kasu: (() => { const k = rs.find(r => r.items.some(i => /酒粕|さけかす/.test(i.key))); return k ? !isAvoided(k) : null; })() };
        }
        return o; });
    for (const [w, v] of Object.entries(r)){
        ok(v.typed === 1, `「${w}」が食材の言葉として読み取れない`);
        ok(v.fam === 'alcohol', `「${w}」が「お酒」のなかまに読みかわらない: ${JSON.stringify(v)}`);
        ok(v.n > 40, `「${w}」で外れる料理が少なすぎる: ${v.n}`);
        ok(v.left.length === 0, `「${w}」を入れたのにお酒入りの料理が残る: ${v.left}`);
        ok(v.kasu !== false, `「${w}」で酒粕の料理まで外れた`);
    }
    const n酒 = r['酒'].n, n料理酒 = r['料理酒'].n; ok(n酒 === n料理酒, `「酒」と「料理酒」で外れる品数が違う: ${n酒} / ${n料理酒}`);
    await ctx.close();
}

// ---------- 4) 画面の言語18種で同じ ----------
{
    const PR = { alc: PROF.halal, typed: ['酒'], vegi: PROF.vegi, vegan: PROF.vegan, egg: ['卵'], lamb: ['@othermeat'] };
    for (const cc of ['JP', 'FR', 'TH']){
        const base = {};
        for (const lang of LANGS){
            const { ctx, p } = await open(cc, { uiLang: lang, avoidSwap: false });
            const r = await p.evaluate(PR => { const o = {}; S.settings.allergens = []; for (const [k, av] of Object.entries(PR)){ S.settings.avoid = av; const rs = RECIPES.filter(r => r.items && !r.isTwist && !isCustomId(r.id)); o[k] = rs.filter(r => !isAvoided(r)).map(r => r.id).join(','); o[k + '_may'] = rs.filter(r => !isAvoided(r) && dietMayHits(r).length).map(r => r.id).join(','); } return o; }, PR);
            if (lang === LANGS[0]) Object.assign(base, r);
            else for (const k of Object.keys(r)) ok(r[k] === base[k], `${cc} ${lang}: ${k} の判定が ${LANGS[0]} と違う`);
            await ctx.close();
        }
    }
}

// ---------- 6) 主菜が0品 ----------
{
    const { ctx, p } = await open('US');
    await p.evaluate(() => { S.settings.avoid = ['rice', 'beans', 'lentils', 'potato', 'tomato', 'onion', 'corn', 'pasta', 'bread', 'spinach', 'broccoli', 'zucchini', 'cabbage', '@pork', '@chicken', '@beef', '@fish', '@shellfish', '@egg', '@dairy', '@wheat', '@nuts']; S.settings.allergens = ['soy', 'sesame']; S.cook = null; session.menu = null; save(); });
    await p.evaluate(() => { ensureMenu(); render(); });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({ mains: RECIPES.filter(r => r.main && !isAvoided(r) && !allergyConflict(r)).length, note: !!document.querySelector('#view .no-main'), btn: (document.querySelector('#view [data-act="settings"]') || {}).textContent || '', dis: !!document.querySelector('#view [data-act="decide"][disabled]'), txt: ((document.querySelector('#view .no-main') || {}).textContent || '') }));
    ok(r.mains === 0, '主菜0品の条件になっていない: ' + r.mains);
    ok(r.dis, '主菜0品: 「決定」が押せなくなっている（これまでどおり）');
    ok(r.note && /設定|Settings/.test(r.txt + r.btn), `主菜0品: 理由と次にすること（設定）の案内が出ない: ${JSON.stringify(r)}`);
    await ctx.close();
}

// ---------- 7) 言葉 ----------
{
    const src = fs.readFileSync(new URL('../../gohancho/index.html', import.meta.url), 'utf8');
    const blk = src.slice(src.indexOf('/* ---- 食の決まり（豚なし'), src.indexOf('// 食材のなかま。豚肉を選んだら'));
    const strs = (blk.match(/t\('[^']*'\)/g) || []).join(' ') + (src.match(/t\('[^']*(?:食の決まり|お酒)[^']*'\)/g) || []).join(' ');
    ok(!/ハラール|ハラル|halal|戒律|認証|認定|イスラム|宗教|教義/i.test(strs), '新しい文言に宗教・認証の言葉がある: ' + (strs.match(/ハラール|ハラル|halal|戒律|認証|認定|イスラム|宗教|教義/i) || [''])[0]);
}

console.log(errs.length ? '実行時エラー ' + errs.slice(0, 5).join(' | ') : '実行時エラーなし');
ok(errs.length === 0, '実行時エラー');
await b.close();
console.log(fails ? `NG ${fails}件` : 'OK diet-r2');
process.exit(fails ? 1 : 0);
