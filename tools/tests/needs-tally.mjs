#!/usr/bin/env node
// 「食べられないものの共有カード」と「今週の主菜の内訳」の回帰テスト（Playwright。使い方: node tools/tests/needs-tally.mjs [http://localhost:8794/]）
//  1) 共有の文章: 登録した内容だけ・注意の一文つき・名前は既定で入れない（入れる指定のときだけ入る）・何も登録がなければ作らない
//  2) 画像（canvas）: 17言語すべてで 1080×1350 が描ける・長い一覧でも例外が出ない
//  3) 内訳: 回数が履歴・プランの事実と一致・0回の種類は出さない・無料版で隠れた日は数えない・判断の言葉を出さない
//  4) 副作用: 共有・内訳の表示で S（記録）と今日の献立が1文字も変わらない
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const LANGS = ['ja','en','de','es','fil','fr','hi','id','it','ko','pl','pt-BR','th','tr','vi','zh-Hans','zh-Hant','ar'];
const b = await chromium.launch(LAUNCH);
let fails = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
async function open(lang, store = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(lang + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(lang + ': ' + m.text()); });
    await p.addInitScript(([lang, store]) => { if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({foldOpen:{upg:true,tw:true,week:true}, onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:'JP', dishCount:3, uiLang:lang, avoidDays:10, servings:2, avoid:[]}, ...store})); } }, [lang, store]);
    await p.goto(URL_); await ready(p); await p.evaluate(() => { hasPro = () => true; });
    return { ctx, p };
}
const FAM = [{id:'f1', name:'はな', role:'child', avoid:['卵','えび','ピーマン'], allergy:['卵','えび'], mild:true}, {id:'f2', name:'', role:'adult', avoid:[], allergy:[], mild:false}, {id:'f3', name:'祖母', role:'adult', avoid:[], allergy:[], mild:true}];
// 1) 文章
{
    const { ctx, p } = await open('ja', {family: FAM});
    const r = await p.evaluate(() => ({ a: needsShareText('f1', false), b: needsShareText('f1', true), none: needsShareText('f2', true), mildOnly: needsShareText('f3', false), gone: needsShareText('zzz', true) }));
    ok(r.a.includes('卵') && r.a.includes('えび') && r.a.includes('ピーマン') && r.a.includes('辛いのが苦手'), 'registered items are all listed: ' + r.a);
    ok(r.a.includes('必ず') && r.a.includes('確かめて'), 'notice about checking yourself is present');
    ok(!r.a.includes('はな'), 'name is left out by default');
    ok(r.b.includes('はな'), 'name is included when asked');
    ok(/アレルギー[^\n]*卵/.test(r.a) && !/食べられない食材:[^\n]*卵/.test(r.a), 'allergy items are not repeated in the cannot-eat line');
    ok(r.none === '' && r.gone === '', 'empty or unknown member makes no card');
    ok(/辛いのが苦手/.test(r.mildOnly) && !/アレルギー:|食べられない食材:/.test(r.mildOnly), 'mild-only member: only what was registered');
    // sheet から
    await p.evaluate(() => openNeeds('f1')); await p.waitForTimeout(200);
    const html = await p.evaluate(() => document.querySelector('#share-text') && document.querySelector('#share-text').value);
    ok(html && html.includes('卵'), 'share sheet opens with the card text');
    ok(await p.evaluate(() => !!document.querySelector('[data-act="needs-name"]')), 'name checkbox shows for a named member');
    await p.click('[data-act="needs-name"]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.querySelector('#share-text').value.includes('はな')), 'toggling the checkbox adds the name');
    await ctx.close();
}
// 2) 画像
for (const lang of LANGS){
    const { ctx, p } = await open(lang, {family: FAM});
    const r = await p.evaluate(async () => {
        const out = {};
        const cv = await cardCanvas('needs', {mid:'f1', withName:true}); out.size = cv ? [cv.width, cv.height] : null;
        if (cv){ const d = cv.getContext('2d').getImageData(0, 300, 1080, 600).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 245) n++; out.ink = n; }
        S.family[0].avoid = Array.from({length:40}, (_, i) => 'とても長い名前の食材その' + i); S.family[0].allergy = S.family[0].avoid.slice(0, 12);
        const cv2 = await cardCanvas('needs', {mid:'f1', withName:false}); out.big = cv2 ? [cv2.width, cv2.height] : null;
        out.none = await cardCanvas('needs', {mid:'f2', withName:false});
        return out;
    });
    ok(r.size && r.size[0] === 1080 && r.size[1] === 1350, lang + ' card size');
    ok(r.ink > 5000, lang + ' card has content');
    ok(r.big && r.big[1] === 1350, lang + ' card with a long list');
    ok(r.none === null, lang + ' no card without registered items');
    await ctx.close();
}
// 2b) 共有カード: 長い一覧でも、見出しだけ残って中身が消えない／入らない分は「ほか n 件」と数える
{
    const { ctx, p } = await open('ja');
    for (const n of [4, 14, 30, 90]){
        const r = await p.evaluate(async n => {
            const avoid = Array.from({length:n}, (_, i) => '食材' + String(i).padStart(2, '0')), allergy = avoid.slice(0, Math.min(3, n));
            S.family = [{id:'big', name:'', role:'child', avoid, allergy, mild:true}];
            const drawn = [], orig = CanvasRenderingContext2D.prototype.fillText;
            CanvasRenderingContext2D.prototype.fillText = function(tx, x, y, w){ drawn.push([String(tx), y]); return orig.apply(this, arguments); };
            let cv; try{ cv = await cardCanvas('needs', {mid:'big', withName:false}); } finally { CanvasRenderingContext2D.prototype.fillText = orig; }
            const items = drawn.filter(d => /^食材\d\d$/.test(d[0])).length;
            const heads = drawn.filter(d => /^(⚠ )?(アレルギー|食べられない食材)$/.test(d[0]));
            const more = drawn.map(d => /^ほか(\d+)件/.exec(d[0])).find(Boolean);
            // 見出しの直後(下)に、その見出しの項目が最低1つ描かれているか
            const headOk = heads.every((h, k) => drawn.some(d => /^食材\d\d$/.test(d[0]) && d[1] > h[1] && (!heads[k + 1] || d[1] < heads[k + 1][1])));
            const noteY = Math.min(...drawn.filter(d => /^このメモは/.test(d[0]) || /確かめて/.test(d[0])).map(d => d[1]).concat([9999]));
            const maxItemY = Math.max(...drawn.filter(d => /^食材\d\d$/.test(d[0])).map(d => d[1]));
            const allergyN = Math.min(3, n);
            return { items, heads: heads.length, more: more ? Number(more[1]) : 0, headOk, total: n + (0), size: [cv.width, cv.height], maxItemY, noteY };
        }, n);
        ok(r.headOk, `n=${n}: every heading has at least one chip under it ` + JSON.stringify(r));
        ok(r.items + r.more === r.total + (r.more ? 1 : 0), `n=${n}: every item is drawn or counted as "ほか n 件": ` + JSON.stringify(r));
        if (n <= 14) ok(r.more === 0, `n=${n}: a normal-size list fits entirely: ` + JSON.stringify(r));
        ok(r.maxItemY < 1128 - 36, `n=${n}: chips stay inside the white panel`);
    }
    await ctx.close();
}
// 2c) 主菜の分類: 魚・肉・卵・豆腐が野菜扱いにならない（日本のレシピと全国のパック）
{
    const { ctx, p } = await open('ja');
    const r = await p.evaluate(() => {
        const fam = id => (RECIPES.find(x => x.id === id) || {}).family;
        return { saikyo: fam('saikyoyaki'), kajiki: fam('kajikisaute'), kani: fam('kanitama'), tarako: RECIPES.filter(x => x.ings.some(g => /たらこ/.test(g))).map(x => x.family),
            veg: RECIPES.filter(x => x.type === '主菜' && x.family === '野菜').map(x => x.id),
            unknown: [...new Set(RECIPES.flatMap(x => x.items.filter(i => !i.opt && /^(さわら|かじき|たらこ|しじみ|ちくわ|ちりめんじゃこ|かに風味かまぼこ|おから|油揚げ)$/.test(i.key) && !FAMILY[i.key]).map(i => i.key)))] };
    });
    ok(r.saikyo === '魚' && r.kajiki === '魚' && r.kani === '魚', 'saikyo-yaki / swordfish / kani-tama count as fish: ' + JSON.stringify(r));
    ok(r.tarako.every(f => f === '魚' || f === '卵' || f === '野菜' || f), 'tarako dish has a family');
    ok(r.veg.length === 0, 'no JP main dish is counted as vegetable (fish and meat words missing from FAMILY): ' + r.veg);
    ok(r.unknown.length === 0, 'fish/soy words are in FAMILY: ' + r.unknown);
    await ctx.close();
    // 全国のパック: 主菜(main/rice/noodle)で、必須の材料に魚介・肉・豆腐があるのに protein が veg のものがない
    const fs = await import('node:fs'), vm = await import('node:vm');
    const dir = new URL('../../gohancho/packs/', import.meta.url).pathname;
    const W = /\b(fish|salmon|cod|tuna|mackerel|sardine|tilapia|trout|hake|herring|milkfish|catfish|pomfret|shrimp|prawn|squid|clam|mussel|crab|octopus|scallop|pork|bacon|ham|sausage|chorizo|chicken|turkey|duck|beef|veal|lamb|mutton|goat|mince|steak|tofu|tempeh)\b/i;
    const bad = [];
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))){
        let pk; vm.runInNewContext(fs.readFileSync(dir + f, 'utf8'), { GOHAN_PACK: x => { pk = x; } });
        for (const x of pk.recipes) if (['main', 'rice', 'noodle'].includes(x.type) && x.protein === 'veg'){
            const hit = x.ings.filter(s => !s.endsWith('?')).map(s => s.split('|').slice(0, 2).join(' ')).filter(s => W.test(s) && !/dried|paste|sauce|stock|broth|cube/i.test(s));
            if (hit.length) bad.push(pk.country + ':' + x.id + ' ' + hit.join(';'));
        }
    }
    ok(bad.length === 0, 'pack mains with fish/meat/tofu are not declared veg: ' + bad.join(' | '));
}
// 3) 内訳
{
    const { ctx, p } = await open('ja');
    const r = await p.evaluate(() => {
        const pick = fam => RECIPES.find(x => x.type === '主菜' && x.family === fam) || RECIPES.find(x => x.family === fam);   // 野菜・卵が主役の「主菜」は日本のレシピにはない（魚の分類漏れを直したため）ので、副菜でもよい
        const rs = {豚:pick('豚'), 鶏:pick('鶏'), 魚:pick('魚'), 野菜:pick('野菜'), 卵:pick('卵')};
        const old = RECIPES.find(x => x.type === '主菜' && x.family === '牛');
        S.history = [{d:TODAY, id:rs.豚.id, name:'', slot:'主菜'}, {d:addDays(TODAY, -1), id:rs.鶏.id, name:'', slot:'主菜'}, {d:addDays(TODAY, -2), id:rs.豚.id, name:'', slot:'主菜'},
            {d:addDays(TODAY, -3), id:rs.魚.id, name:'', slot:'主菜'}, {d:addDays(TODAY, -6), id:rs.野菜.id, name:'', slot:'主菜'},
            {d:addDays(TODAY, -7), id:old.id, name:'', slot:'主菜'}, {d:addDays(TODAY, -1), id:rs.卵.id, name:'', slot:'副菜'}];
        const T = mainTally(recentMainRecipes());
        return { n: T.n, kinds: T.kinds, html: tallyHtml('x', recentMainRecipes()) };
    });
    ok(r.n === 5, 'last 7 days counts only main dishes within 7 days: ' + r.n);
    const m = Object.fromEntries(r.kinds);
    ok(m['肉'] === 3 && m['魚'] === 1 && m['野菜'] === 1, 'kind counts match history: ' + JSON.stringify(r.kinds));
    ok(!('卵' in m) && !('牛' in m), 'kinds with zero (or outside the window) are not shown');
    ok(!/足りな|多すぎ|不足|偏りすぎ|バランス|おすすめ|減らし|増やし/.test(r.html), 'no nutrition judgment words');
    // 無料版: 隠れた日は数えない
    const f = await p.evaluate(() => {
        hasPro = () => false; makeWeek();
        const vis = visiblePlanDays().length, all = S.week.days.filter(x => x.d >= TODAY).length;
        render(); return { vis, all, shown: (document.body.innerText.match(/1週間プランの主菜（(\d+)日分）/) || [])[1] };
    });
    ok(f.vis <= f.all && Number(f.shown) === f.vis, 'free plan tally counts only visible days: ' + JSON.stringify(f));
    await ctx.close();
}
// 4) 副作用
{
    const { ctx, p } = await open('ja', {family: FAM});
    const r = await p.evaluate(async () => {
        const before = JSON.stringify(S), menu = JSON.stringify((session.menu || {}).items && session.menu.items.map(x => x.r && x.r.id));
        needsShareText('f1', true); await cardCanvas('needs', {mid:'f1', withName:true}); openNeeds('f1'); mainTally(recentMainRecipes()); tallyHtml('x', recentMainRecipes());
        tab = 'log'; render(); tab = 'today'; render();
        return { same: before === JSON.stringify(S), menuSame: menu === JSON.stringify((session.menu || {}).items && session.menu.items.map(x => x.r && x.r.id)) };
    });
    ok(r.same, 'S is unchanged by sharing and tallying'); ok(r.menuSame, 'today menu is unchanged');
    await ctx.close();
}
await b.close();
if (errs.length){ fails++; console.log('ERRORS', [...new Set(errs)].slice(0, 8)); }
console.log(fails ? 'FAILED ' + fails : 'ALL OK');
process.exit(fails ? 1 : 0);
