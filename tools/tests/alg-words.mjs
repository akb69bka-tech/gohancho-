#!/usr/bin/env node
// 第23回 R96（安全）: 調味料・加工品の名前の読み落とし（Playwright。使い方: node tools/tests/alg-words.mjs [http://localhost:8765/]）
//  W1 名指しの料理（台湾の醬油膏・剝皮辣椒・醬鳳梨・醬瓜・豆豉、中国の light soy、フィリピンの bagoong、ドイツのレープクーヘン、アメリカのクルトン、韓国のテンジャン）に印が付く
//  W2 言葉ごとの判定（醬油膏・soy paste・light soy・douchi・bagoong・Lebkuchen・croutons・doenjang・kerupuk など。似た言葉には付けない）
//  W3 利用者モニター第23回と同じ照らし合わせ: アプリとは別の言葉の表（KW。モニターの audit.cjs と同じ）で全部の国の全部の料理 × 9アレルゲンを照らし、
//     ⚠ も 🔍 も付かないものを、下の「読みちがい」の決まり（FP）で説明できないものが 0 件
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH, BASE: BASE_, SEED, seedScript, ready } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || BASE_;
const ALL_CC = ['JP', 'US', 'KR', 'TH', 'FR', 'BR', 'CN', 'DE', 'EG', 'ES', 'GB', 'ID', 'IN', 'IT', 'MX', 'PE', 'PH', 'PL', 'TR', 'TW', 'VN'];
const CCS = (process.env.CCS || ALL_CC.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const KW = {
 egg: "卵|たまご|玉子|\\beggs?\\b|yolk|まよ|マヨ|mayo|tartar|タルタル|aioli|alioli|meringue|caesar|しーざー|シーザー|ranch|天かす|揚げ玉|かまぼこ|ちくわ|はんぺん|wonton|ワンタン|fresh pasta|egg noodle|ホットケーキ|pancake mix|天ぷら粉|tempura|brioche|hollandaise|custard|계란|달걀|ไข่|trứng|huevo|œuf|oeuf|\\buov|\\bovo|jaj|yumurta|telur|بيض|अंड|蛋",
 milk: "牛乳|ミルク|\\bmilk|butter|バター|cheese|チーズ|cream|クリーム|yog|ヨーグルト|ghee|ギー|paneer|\\bcurd|dahi|ricotta|mozzarella|parmesan|parmigiano|pecorino|feta|labneh|whey|ルウ|ルー\\b|roux|pesto|caesar|シーザー|ranch|margarine|マーガリン|panko|パン粉|bread ?crumb|condensed|evaporated|kefir|crème|crema|nata\\b|leche|\\blait|latte|queso|fromage|formaggio|queij|\\bser\\b|peynir|süt|\\bsusu|sữa|นม|เนย|ชีส|우유|버터|치즈|牛奶|奶|جبن|حليب|زبدة|لبن|दूध|घी|मक्खन|पनीर|दही|chocolate|チョコ",
 wheat: "小麦|薄力粉|強力粉|flour|\\bpan\\b|パン|bread|panko|pasta|spaghett|noodle|麺|うどん|そうめん|ラーメン|餃子|ぎょうざ|wrapper|\\bwrap|tortilla|naan|\\broti|chapat|paratha|puri|couscous|bulgur|semolina|seitan|麩|soy sauce|醤油|しょうゆ|めんつゆ|ぽん酢|ポン酢|オイスター|oyster sauce|hoisin|teriyaki|worcester|ウスター|ソース|gochujang|コチュジャン|doenjang|味噌|みそ|miso|甜麺醤|curry roux|ルウ|asaf|hing|हींग|malt|beer|ビール|天ぷら粉|cracker|biscuit|cake|crouton|dumpling|pita|lavash|yufka|börek|phyllo|filo|pastry|\\bpie|\\bbao|mantou|\\bbun|burger|そば|soba|bột mì|แป้ง|밀가루|면|面|麵|饺|मैदा|आटा|सूजी|tepung|\\bmì|harina|farine|farina|mehl|mąk|un\\b|بقسماط|خبز|عيش|ekmek|makarna|pain\\b|baguette|brot|pane\\b|pão|chleb|bulka|gnocchi|ravioli|lasagn|macaroni|penne|vermicelli|fideo|\\budon|ramen|焼きそば|中華麺|片栗粉|コンソメ|consomm|bouillon|stock cube|ブイヨン|ルー|カレールウ|シチュー",
 fish: "魚|さかな|鮭|さけ|しゃけ|さば|鯖|ぶり|たら|鱈|あじ|鯵|いわし|かつお|鰹|ツナ|まぐろ|ちくわ|かまぼこ|はんぺん|しらす|じゃこ|煮干|だし|出汁|めんつゆ|ナンプラー|fish|anchov|tuna|salmon|\\bcod\\b|mackerel|sardin|bonito|dashi|katsuo|worcester|ウスター|caesar|シーザー|kimchi|キムチ|nam pla|patis|bagoong|nuoc mam|nước mắm|mắm|terasi|belacan|\\bkapi|curry paste|カレーペースト|tom yum|トムヤム|\\bxo\\b|생선|멸치|액젓|ปลา|น้ำปลา|\\bcá\\b|ikan|balık|ryb|peix|pescad|poisson|pesce|bacalh|fisch|سمك|मछली|鱼|鰯|ほっけ|さんま|鯛|かれい|白身|whitefish|haddock|tilapia|pollock|trout|halibut|sea bream|herring|dried shrimp|oyster sauce|オイスター",
 crustacean: "えび|海老|エビ|かに|蟹|カニ|shrimp|prawn|crab|lobster|langost|krill|\\bxo\\b|shacha|sacha|terasi|belacan|\\bkapi|bagoong|shrimp paste|桜えび|干しえび|kimchi|キムチ|curry paste|カレーペースト|tom ?yum|トムヤム|nam prik|새우|\\b게\\b|꽃게|กุ้ง|ปู|tôm|\\bcua\\b|udang|kepiting|karides|yengeç|krewet|camar|crevette|gamber|garnel|झींगा|虾|蝦|seafood|シーフード|海鮮|mắm",
 soy: "大豆|豆腐|油揚|厚揚|がんも|納豆|醤油|しょうゆ|味噌|みそ|豆乳|湯葉|おから|きな粉|枝豆|\\bsoy|tofu|miso|natto|edamame|tempeh|tamari|teriyaki|hoisin|oyster sauce|オイスター|worcester|ウスター|gochujang|コチュジャン|doenjang|ssamjang|甜麺醤|豆板醤|豆瓣|豆豉|black bean|kecap|tauco|tương|đậu phụ|đậu nành|เต้าหู้|ซีอิ๊ว|เต้าเจี้ยว|ซอส|된장|간장|두부|고추장|酱|醬|curry roux|ルウ|margarine|マーガリン|めんつゆ|ポン酢|ぽん酢|焼肉のたれ|consomm|コンソメ|bouillon|stock cube|chocolate|soja|shoyu|焼きそばソース|ソース",
 sesame: "ごま|胡麻|ゴマ|sesame|tahin|ラー油|chili oil|chil+i crisp|七味|furikake|ふりかけ|hoisin|za.?atar|halva|helva|참기름|\\b깨|งา|vừng|\\bmè\\b|wijen|susam|sezam|sésam|sesamo|gergelim|芝麻|香油|麻油|طحين|سمسم|तिल|焼肉のたれ|ドレッシング|dressing|dukkah|simit",
 peanut: "ピーナッツ|ピーナツ|落花生|peanut|groundnut|satay|サテ|massaman|マッサマン|gado|kacang|pecel|mafe|chil+i crisp|man[ií]\\b|cacahu|amendoim|erdnuss|arachid|땅콩|ถั่วลิสง|đậu phộng|\\blạc\\b|fıstı|orzesz|花生|فول سوداني|मूंगफली|kare-kare|担々|坦々|宮保|kung pao|pad thai|パッタイ|ผัดไทย",
 buckwheat: "そば|蕎麦|soba|buckwheat|kasha|gryka|galette|sarrasin|메밀|grano saraceno|kuttu|कुट्टू|荞麦",
};
// 読みちがい（言葉の表には当たるが、そのアレルゲンは入らない）: [アレルゲン（* はどれでも）, 当たった言葉, 前後の文に当てる正規表現, 理由]
const FP = [
    ['*', null, null, '言葉の途中に当たった（pieces の pie、broth の brot、aceitunas の tuna、bœuf の œuf、annatto の natto など）'],
    ['fish', /^(oyster sauce|オイスター)$/i, null, 'オイスターソースはかき（貝）。魚ではない（小麦・大豆は別に判定）'],
    ['fish', /^だし$/, /昆布だし/, '魚のアレルギーでは、だしを昆布だしに置き換える'],
    ['fish', /^(dried shrimp|terasi)$/i, null, 'えびの加工品（甲殻類で判定）'],
    ['crustacean', /^mắm$/i, /nước mắm/i, '魚醤（魚で判定）'],
    ['fish', /^魚$/, /魷魚|鱿鱼/, 'いか（魚ではない）'],
    ['milk', /^(milk|दूध)$/i, /coconut milk|नारियल का दूध/i, 'ココナッツミルク'],
    ['milk', /^butter$/i, /peanut butter|butternut|butterfl/i, 'ピーナッツバター・バターナッツ・開き（落花生は別に判定）'],
    ['milk', /^cream$/i, /creamed corn/i, 'クリームコーン（第25回 R108 で 🔍 にしたので、ふつうはここに来ない）'],
    ['soy', /^tamari$/i, /tamarind/i, 'タマリンド'],
    ['soy', /^black bean$/i, /(?<!fermented )black beans?(?! sauce)/i, '黒いんげん豆（大豆ではない）'],
    ['soy', /^(酱|ซอส|ソース)$/, /玉米酱|ซอสมะเขือเทศ|タルタルソース/, 'コーンペースト・トマトソース・タルタルソース'],
    ['wheat', /^(味噌|miso)$/i, null, '米みそ・麦みそ（大麦）・豆みそ。小麦は入らない（韓国のテンジャンは 🔍）'],
    ['wheat', /^flour$/i, /(corn|rice|cassava|chickpea|tapioca|potato) ?flour|cornflour|besan|farinha de mandioca/i, '小麦ではない粉'],
    ['wheat', /^(tortilla)$/i, /corn tortillas|tortillas de ma[ií]z|tostadas o tortillas/i, 'とうもろこしのトルティーヤ'],
    ['wheat', /^(noodle|vermicelli)$/i, /glass noodles|rice noodles|rice vermicelli|thin rice noodles/i, '春雨・米の麺'],
    ['wheat', /^tepung$/i, /tepung (tapioka|beras|maizena|sagu)/i, 'タピオカ粉・米粉'],
    ['wheat', /^आटा$/, /चावल का आटा|बेसन/, '米粉・ひよこ豆の粉'],
    ['wheat', /^un$/i, null, 'スペイン語・イタリア語・フランス語の un（トルコ語の小麦粉 un ではない。トルコでは数えない）'],
    ['wheat', /^(malt|beer)$/i, null, '大麦（グルテン。小麦ではない）'],
    ['buckwheat', /^そば$/, /焼きそば|中華麺/, '焼きそば・中華麺（そば粉ではない）'],
    ['peanut', /^kacang$/i, /kacang (panjang|hijau|merah)/i, 'ささげ・緑豆・小豆'],
    ['sesame', /^dressing$/i, /ranch dressing/i, 'ランチドレッシング（ごまは入らない）'],
    ['crustacean', /^sacha$/i, /sacha culantro/i, '香草のサチャ・クラントロ'],
    ['egg', /^بيض$/, /أبيض|بيضا|بيضاء/, 'アラビア語の「白い」（أبيض）。卵ではない'],
    ['crustacean', /^蟹$/, /蟹味菇|蟹味茸/, 'ぶなしめじ（蟹味菇）。かにではない'],
    ['wheat', /^pasta$/i, /pasta de (aj[ií]|achiote|tomate|chile|chipotle)/i, 'スペイン語の pasta（ペースト）'],
];
const latin = c => /[a-zà-ɏœ]/i.test(c || '');
// 当たった言葉が、もっと長い1語の途中か（複数形の s・es は同じ語とみなす）
const embedded = m => { if (!latin(m.hit[0])) return false; const L = /[a-zà-ɏœ]/i, t = m.ctx, i = 40 - Math.max(0, 40 - m.i) ; let s = i, e = i + m.hit.length; while (s > 0 && L.test(t[s - 1])) s--; while (e < t.length && L.test(t[e])) e++; const w = t.slice(s, e).toLowerCase(), h = m.hit.toLowerCase(); return w !== h && w !== h + 's' && w !== h + 'es'; };
const b = await chromium.launch(LAUNCH);
let fails = 0, checks = 0; const errs = [];
const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } else if (process.env.VERBOSE) console.log('ok  ', m); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent|line\.me/, r => r.abort());
await ctx.addInitScript(seedScript(SEED));
await ctx.addInitScript(() => { if (!localStorage.getItem('gohancho.v1')) localStorage.setItem('gohancho.v1', JSON.stringify({onboarded: true, firstUse: '2026-01-01', settings: {country: 'JP', dishCount: 3, servings: 2}})); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push('app: ' + e.message));
await p.goto(URL_); await ready(p);

// ---- W2 言葉ごと ----
{
    const W = [['醬油膏', ['soy', 'wheat']], ['1 tbsp soy paste', ['soy', 'wheat']], ['Marinade: 1 tsp light soy', ['soy', 'wheat']], ['dark soy', ['soy', 'wheat']], ['醬油', ['soy', 'wheat']],
        ['fermented black beans (douchi)', ['soy']], ['Peeled green chilies in soy (jarred)', ['soy', 'wheat']], ['剝皮辣椒', ['soy', 'wheat']], ['Fermented pineapple (jarred)', ['soy']], ['醬鳳梨', ['soy']], ['醬瓜', ['soy']], ['huagua', ['soy']],
        ['salted or soy-braised egg', ['soy', 'wheat']], ['滷蛋', ['soy']],
        ['1 tsp bagoong', ['crustacean']], ['bagoong alamang', ['crustacean']], ['bagoong (shrimp or fish paste)', ['crustacean', 'fish']],
        ['1 crumbled gingerbread biscuit (Printen or Lebkuchen)', ['wheat']], ['Lebkuchen', ['wheat']], ['croutons (optional)', ['wheat']], ['Croûtons', ['wheat']],
        ['2 tbsp doenjang', ['wheat', 'soy']], ['된장', ['wheat', 'soy']], ['kerupuk', ['crustacean', 'wheat']], ['schupfnudeln', ['wheat']], ['pancake mix', ['egg', 'wheat']],
        // 第24回 R104: 紹興酒（小麦の麹）。R101: 加工肉の卵・乳・大豆は英語ほかでも
        ['1 tbsp Shaoxing wine', ['wheat']], ['紹興酒', ['wheat']], ['绍兴酒', ['wheat']], ['黄酒', ['wheat']], ['花雕酒', ['wheat']], ['料酒', ['wheat']], ['Chinese cooking wine', ['wheat']],
        ['4 slices bacon', ['egg', 'milk', 'soy']], ['smoked sausage', ['egg', 'milk', 'soy', 'wheat']], ['ham', ['egg', 'milk', 'soy']], ['hot dogs', ['egg', 'milk', 'soy']], ['Morcilla', ['egg', 'milk', 'soy', 'wheat']], ['kiełbasa', ['egg', 'milk', 'soy']]];
    const NOT = [['rice wine', 'wheat'], ['hamburger buns', 'egg'], ['soy milk', 'wheat'], ['soybeans', 'wheat'], ['pickled cucumber', 'soy'], ['cucumber', 'soy'], ['carrots', 'wheat'], ['black beans', 'soy'], ['bread crumbs', 'soy']];
    const r = await p.evaluate(([W, NOT]) => {
        const it = n => /[ぁ-んァ-ヶ一-龯가-힣]/.test(n) ? parseIng(n) : Object.assign(parseIng(n), {en: n.toLowerCase(), key: n.toLowerCase()});
        return {miss: W.flatMap(([n, as]) => as.filter(a => !algKind(a, it(n))).map(a => n + '→' + a)), extra: NOT.filter(([n, a]) => algKind(a, it(n))).map(([n, a]) => n + '→' + a + '=' + algKind(a, it(n)))};
    }, [W, NOT]);
    ok(!r.miss.length, 'W2 判定がない: ' + r.miss.join(' ; '));
    ok(!r.extra.length, 'W2 似た言葉に付いた: ' + r.extra.join(' ; '));
}

// ---- W1 名指しの料理・W3 全部の料理 ----
const NAMED = {TW: [['tw_tang_qiukui', 'soy'], ['tw_fanqie_qiepan', 'soy'], ['tw_tang_qingcai', 'soy'], ['tw_tang_qiukui', 'wheat'], ['tw_fanqie_qiepan', 'wheat'], ['tw_tang_qingcai', 'wheat'], ['tw_bopi_lajiao_ji', 'soy'], ['tw_bopi_lajiao_ji', 'wheat'], ['tw_fengli_kugua_ji', 'soy'], ['tw_digua_zhou', 'soy'], ['tw_chao_shansu', 'soy']],
    CN: [['cn_gongbao_jiding', 'soy'], ['cn_gongbao_jiding', 'wheat'], ...['cn_donggua_paigu', 'cn_lianou_paigu', 'cn_jiyu_doufu', 'cn_xianggu_jitang', 'cn_yanduxian', 'cn_luobo_yangrou', 'cn_suancaiyu', 'cn_xiaren_chaodan'].map(id => [id, 'wheat'])], PH: [['ph_ensalada', 'crustacean'], ['ph_ensaladang_talong', 'crustacean'], ['ph_talbos_kamote', 'crustacean']],
    DE: [['de_sauerbraten', 'wheat']], US: [['us_salad', 'wheat']], KR: [['kr_doenjangjjigae', 'wheat'], ['kr_sigeumchidoenjangguk', 'wheat'], ['kr_cheonggukjangjjigae', 'wheat']]};
let tot = {recipes: 0, kwHit: 0, flagged: 0, fp: 0, miss: 0}; const fpBy = {};
for (const cc of CCS){
    const r = await p.evaluate(async ([cc, KW, named]) => {
        if (currentCountry() !== cc) await setCountry(cc);
        const out = {n: RECIPES.length, kwHit: 0, flagged: 0, miss: [], named: []}, S0 = JSON.stringify(S.settings.allergens || []);
        const txt = r => { let s = ''; try{ s += JSON.stringify(r.items || []); }catch(e){} try{ s += ' ' + seasItems(r).map(i => i.name + '|' + (i.en || '') + '|' + (i.raw || '')).join(' '); }catch(e){} s += ' ' + (r.seasBase || r.seas || ''); return s.toLowerCase(); };
        for (const a of Object.keys(KW)){ S.settings.allergens = [a]; const re = new RegExp(KW[a], 'i');
            for (const rc of RECIPES){ const t = txt(rc), m = t.match(re); if (!m) continue; out.kwHit++;
                if (allergyConflict(rc) || algMayHits(rc).length){ out.flagged++; continue; }
                out.miss.push({a, id: rc.id, hit: m[0], i: m.index, ctx: t.slice(Math.max(0, m.index - 40), m.index + 40), pre: t[m.index - 1] || '', post: t[m.index + m[0].length] || '', post2: t.slice(m.index + m[0].length, m.index + m[0].length + 2)}); } }
        for (const [id, a] of named){ S.settings.allergens = [a]; const rc = recipeById(id); out.named.push([id, a, !!rc && (allergyConflict(rc) || algMayHits(rc).length > 0)]); }
        S.settings.allergens = JSON.parse(S0); return out;
    }, [cc, KW, NAMED[cc] || []]);
    r.named.forEach(([id, a, f]) => ok(f, `W1 ${cc} ${id} に ${a} の印（⚠ か 🔍）`));
    const real = r.miss.filter(m => {
        const rule = FP.find(([a, hit, cx], k) => (a === '*' || a === m.a) && (k === 0 ? embedded(m) : (!hit || hit.test(m.hit)) && (!cx || cx.test(m.ctx)) && !(m.a === 'wheat' && /^un$/i.test(m.hit) && cc === 'TR')));
        if (rule){ fpBy[rule[3]] = (fpBy[rule[3]] || 0) + 1; return false; }
        return true;
    });
    tot.recipes += r.n; tot.kwHit += r.kwHit; tot.flagged += r.flagged; tot.fp += r.miss.length - real.length; tot.miss += real.length;
    ok(!real.length, `W3 ${cc} 印のない読み落とし ${real.length}: ` + real.slice(0, 8).map(m => `${m.a}/${m.id}「${m.hit}」…${m.ctx.replace(/\s+/g, ' ').slice(20, 70)}`).join(' ; '));
}
console.log('W3', JSON.stringify(tot));
console.log('W3 読みちがい（決まりごとの件数）'); Object.entries(fpBy).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${v}  ${k}`));
await b.close();
if (errs.length){ fails++; console.log('FAIL ページのエラー:', [...new Set(errs)].slice(0, 5).join(' / ')); }
console.log(fails ? `FAIL ${fails}/${checks}  [再現: SEED=${SEED}]` : `OK ${checks}`);
process.exit(fails ? 1 : 0);
