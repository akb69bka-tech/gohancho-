#!/usr/bin/env node
// アレルギー対策（設定の「アレルギー対策」カード）の回帰テスト（Playwright。使い方: node tools/tests/allergy.mjs [http://localhost:8765/]）
//  1) 各アレルゲン × 代表の材料: 「含むべきものが全部含む判定」「含まないものを誤って含む判定にしない」（日本語・英語・各国の言葉・加工品・調味料）
//  2) 全21か国・約1,700品の機械チェック: 各アレルゲンを選んだとき、(a) 明らかにそのアレルゲンの言葉が材料・調味料にある料理は必ず出ない（判定漏れ0）
//     (b) 出ない料理には、必ず材料か調味料に根拠がある（誤って除外しすぎない）。根拠なしの除外は0
//  3) 厳格さ: 置き換えで「安全」に見せない（苦手の置き換え先にアレルゲンを選ばない・アレルゲンの料理は置き換えず出さない）
//  4) 全経路: 献立・かえる・1週間プラン・買い物メモ・保存献立の警告・お気に入り・あと1品・ひとひねり・世界のレシピで同じ判定
//  5) 連動なし: アレルゲンを足しても、当たっていない枠は動かない（当たった枠だけ選び直す）
//  6) 表示: 詳細に「この料理に含まれる主なアレルゲン」・設定の「アレルギー対策」カード（日本=9+20、米国系=9、ほか=14）・免責
//  乱数: ページの Math.random は SEED から決まる（開くページごとに seedFor('allergy', 通し番号)）。失敗したら表示された SEED=… を付けて実行すると同じ献立で再現する
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const { SEED, rngScript, seedFor } = require('../lib/pw.cjs');
const URL_ = process.argv[2] || process.env.BASE || 'http://localhost:8765/';
const CCS = ['JP','TW','CN','KR','US','TH','VN','FR','DE','IN','MX','BR','GB','IT','ES','TR','EG','PE','PL','PH','ID'];
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0, opened = 0; const errs = [];
const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m, ' [再現: SEED=' + SEED + ']'); } };
async function open(cc = 'JP', settings = {}, store = {}){
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/google|gstatic|wikipedia|wikimedia|githubusercontent/, r => r.abort());
    await ctx.addInitScript(rngScript(seedFor('allergy', String(++opened))));   // 同じ SEED なら、同じ順に開いたページは同じ献立になる
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(cc + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(cc + ': ' + m.text()); });
    await p.addInitScript(([cc, settings, store]) => { window.__swapDirect = true; if (!sessionStorage.getItem('s')){ sessionStorage.setItem('s', 1); localStorage.setItem('gohancho.v1', JSON.stringify({foldOpen:{upg:true,tw:true,week:true}, onboarded:true, firstUse:new Date().toISOString().slice(0,10), settings:{country:cc, dishCount:3, ...settings}, ...store})); } }, [cc, settings, store]);
    await p.goto(URL_); await p.waitForTimeout(900); await p.evaluate(() => { hasPro = () => true; });
    return { ctx, p };
}

// ---------- 1) 材料の判定 ----------
// [アレルゲン, 含むべき材料の名前（日本語・英語・各国）, 含まない材料の名前]
const CASES = {
    shrimp: [['えび','むきえび','干しえび','Shrimp','king prawns','shrimp paste','terasi','kapi','サクラエビ'], ['えびす','Eggplant','Celery']],
    crab: [['かに','カニ','ずわいがに','crab meat','Crab','かにの身'], ['かぼちゃ','Crabapple jelly'.replace('Crabapple','Pumpkin')]],
    walnut: [['くるみ','walnuts','Walnut oil','nueces','Walnuss'], ['ナツメグ','nutmeg','butternut squash','Coconut']],
    wheat: [['小麦粉','薄力粉','パン粉','うどん','スパゲッティ','餃子の皮','wheat flour','Bread crumbs','spaghetti','flour tortillas','Noodles','couscous'], ['米粉','rice flour','Rice noodles','コーンスターチ','buckwheat flour','Glass noodles']],
    buckwheat: [['そば粉','ざるそば','Soba noodles','buckwheat flour','Buckwheat groats','そばの実'], ['焼きそば','焼きそば麺','Yakisoba','中華そば','Rice noodles']],
    egg: [['卵','ゆで卵','うずらの卵','Egg','2 eggs','Egg yolk','マヨネーズ','Mayonnaise','タルタルソース','卵麺','Egg noodles','Hollandaise'], ['Eggplant','なす','Aubergine','Egg-free pasta'.replace('Egg-free pasta','Rice')]],
    milk: [['牛乳','バター','チーズ','生クリーム','ヨーグルト','Milk','Butter','Cheddar cheese','Sour cream','Ghee','Paneer','シチュールウ','カレールウ'], ['豆乳','Soy milk','Coconut milk','Peanut butter','Butternut squash','Almond milk','Cocoa butter','ココナッツミルク']],
    peanut: [['ピーナッツ','落花生','ピーナッツバター','Peanuts','Peanut butter','Groundnuts','cacahuetes','Satay sauce','mole'], ['Coconut','Almonds','Walnuts','ごま']],
    abalone: [['あわび','アワビ','Abalone'], ['Apple','あさり']],
    squid: [['いか','するめいか','Squid','Calamari','イカ墨','squid ink'], ['Fish','たこ','Crab']],
    ikura: [['いくら','イクラ','筋子','Salmon roe','Ikura'], ['さけ','Salmon']],
    orange: [['オレンジ','オレンジ果汁','Orange juice','Orange zest','Oranges','みかん','Mandarin'], ['こぶみかん','Orange bell pepper','さつまいも（オレンジ色のもの）','Lemon','Lime']],
    cashew: [['カシューナッツ','Cashews','cashew nuts','Cashew butter'], ['Walnuts','Peanuts','Coconut']],
    kiwi: [['キウイ','キウイフルーツ','Kiwi fruit','Kiwi'], ['Banana','りんご']],
    beef: [['牛肉','牛ひき肉','牛バラ肉','Ground beef','Beef stock','Veal','Sirloin steak','Oxtail','ビーフブイヨン','合いびき肉','カレールウ'], ['ごぼう','牛乳','ビーフン','Chicken breast','Pork belly','Beefsteak tomato']],
    sesame: [['ごま','白ごま','すりごま','ごま油','練りごま','Sesame seeds','Sesame oil','Tahini','hummus','ふりかけ'], ['えごまの葉','Perilla leaves','ごぼう','Sunflower seeds','Olive oil']],
    salmon: [['鮭','生鮭','サーモン','Salmon fillet','Smoked salmon','さけ'], ['さくら','Mackerel','Salmon roe'.replace('Salmon roe','Tuna')]],
    mackerel: [['さば','塩さば','鯖','Mackerel','Short mackerel (pla tu)'], ['キャッサバ','Cassava','料理用バナナ（サバ）','Tuna']],
    soy: [['大豆','豆腐','油揚げ','厚揚げ','納豆','きなこ','豆乳','Tofu','Edamame','Soy milk','Tempeh','Soy sauce','醤油','味噌','Miso','Gochujang','kecap manis','Doenjang'], ['Tamarind paste','Annatto powder','Chickpeas','Green beans','Rice vinegar']],
    chicken: [['鶏肉','鶏むね肉','鶏もも肉','ささみ','Chicken breast','Chicken thighs','Chicken stock','鶏ガラスープの素','チキンブイヨン','コンソメ'], ['ひよこ豆','Chickpeas','Chicken of the woods'.replace('Chicken of the woods','Mushrooms'),'野菜ブイヨン','Vegetable stock','ビーフブイヨン']],
    banana: [['バナナ','Bananas','料理用バナナ','plátano','Plantains','Ripe plantain'], ['Banana leaf','バナナの葉','Banana pepper','Apple']],
    pork: [['豚肉','豚バラ肉','豚ひき肉','ベーコン','ハム','ウインナー','Pork belly','Bacon','Ham','Chorizo','Pork sausage','Lard','ラード','合いびき肉','Spare ribs'.replace('Spare ribs','Pork ribs')], ['Beef sausage','Turkey sausage','Chicken','Plant-based sausage','牛肉']],
    pistachio: [['ピスタチオ','Pistachios','pistachio nuts','pistacho','Pistazien'], ['Peanuts','Walnuts','Coconut','Pumpkin seeds']],
    macadamia: [['マカダミアナッツ','Macadamia nuts','Macadamias'], ['Almonds','Walnuts']],
    peach: [['桃','もも','Peaches','Peach','Nectarine'], ['鶏もも肉','豚もも肉','Chicken thighs','Thigh']],
    yamaimo: [['やまいも','山芋','長いも','とろろ','自然薯','Nagaimo','Mountain yam'], ['さつまいも','さといも','Sweet potato','Potato','Taro']],
    apple: [['りんご','Apples','Apple','Applesauce','Apple juice','manzana'], ['Pineapple','パイナップル','Apple cider vinegar','Custard apple','Potato','Pomegranate']],
    gelatin: [['ゼラチン','粉ゼラチン','Gelatin','Gelatine','Marshmallows','gummy bears'], ['寒天','Agar','Vegetable gelatin']],
    almond: [['アーモンド','アーモンドプードル','Almonds','Almond flour','Marzipan','almendras','Sliced almonds'], ['Walnuts','Peanuts','Coconut','Almond milk free'.replace('Almond milk free','Rice')]],
    gluten: [['小麦粉','パン粉','うどん','Bread','Spaghetti','Rye bread','Barley','Oats','Beer','Couscous','Bulgur','ライ麦','大麦','Malt vinegar','ポン酢'], ['米粉','Rice noodles','Corn tortillas','Potatoes','Rice','Buckwheat flour'.replace('Buckwheat flour','Cornmeal')]],
    crustacean: [['えび','かに','Shrimp','Prawns','Crab','Lobster','Crayfish','Langoustines','shrimp paste','ロブスター','伊勢えび'], ['Eggplant','あさり','Clams','Squid','Fish']],
    fish: [['鮭','さば','ぶり','たら','あじ','いわし','ツナ','Salmon','Tuna','Cod fillets','Anchovies','Fish sauce','ナンプラー','かつお節','和風だしの素','ちくわ','かまぼこ','Worcestershire sauce','白身魚'], ['Fish-free'.replace('Fish-free','Tofu'),'ちりめんキャベツ','Jellyfish'.replace('Jellyfish','Squid'),'Oyster sauce','Crayfish'.replace('Crayfish','Clams'),'Shellfish'.replace('Shellfish','Clams')]],
    treenut: [['アーモンド','くるみ','カシューナッツ','ピスタチオ','松の実','ヘーゼルナッツ','Hazelnuts','Pecans','Pistachios','Pine nuts','Mixed nuts','Pesto','Nutella','マカダミアナッツ','Almonds','Walnuts'], ['ピーナッツ','Peanuts','Peanut butter','ナツメグ','Nutmeg','Coconut','Butternut squash','Doughnuts','Water chestnuts','Pumpkin seeds']],
    celery: [['セロリ','Celery','Celery leaves','Celeriac','セロリアック','Celery salt','apio'], ['Parsley','パセリ','Fennel']],
    mustard: [['からし','練りからし','粒マスタード','Mustard','Dijon mustard','Mustard seeds','Mustard oil','Piccalilli'], ['唐辛子','赤唐辛子','Chili','Mustard greens','からし菜','Mizuna']],
    sulphite: [['White wine','Red wine vinegar','Raisins','Dried apricots','Sherry','ワイン','Balsamic vinegar','Sauerkraut','Sulphites'], ['Rice wine','Shaoxing wine','みりん','Rice vinegar','Fresh grapes'.replace('Fresh grapes','Apple')]],
    lupin: [['Lupin flour','Lupini beans','ルピナス','Lupine'], ['Chickpeas','Lentils']],
    mollusc: [['あさり','しじみ','ほたて','牡蠣','たこ','いか','Clams','Mussels','Oysters','Scallops','Octopus','Squid','Oyster sauce','オイスターソース','Escargots','蛤'], ['Oyster mushrooms','ひらたけ（オイスターマッシュルーム）','Oyster crackers','Scallions','Shrimp','Crab','貝割れ大根']],
};
{
    const { ctx, p } = await open('JP');
    const r = await p.evaluate(CASES => {
        const out = [];
        const mk = n => { const j = /[぀-ヿ㐀-鿿]/.test(n); const it = parseIng(n.replace(/\s+/g, ' ')); if (!j){ it.en = n; it.key = n.toLowerCase(); } return it; };
        for (const [id, [must, not]] of Object.entries(CASES)){
            for (const n of must){ const k = algKind(id, mk(n)); const hit = k && (k !== 3 || algFerm()); if (!hit) out.push(['MISS', id, n]); }
            for (const n of not){ const k = algKind(id, mk(n)); if (k) out.push(['OVER', id, n, k]); }
        }
        return { out, ids: Object.keys(CASES).sort(), all: [...ALG_ALL].sort() };
    }, CASES);
    r.out.forEach(x => ok(false, '材料の判定 ' + x.join(' / ')));
    ok(JSON.stringify(r.ids) === JSON.stringify(r.all), '全アレルゲンにケースがある: ' + r.all.filter(x => !r.ids.includes(x)).join());
    // 代表レシピ: 材料の欄に1つだけ入っている・なくても可の材料・調味料の欄にだけ入っている、のどれでも出さない。含まない材料だけの料理は出す
    const rr = await p.evaluate(CASES => {
        const out = [];
        const rec = (ings, seas, pack) => { const r = { id: 'tst', name: 'テスト', ings, seas: seas || '', seasBase: seas || '', steps: [], type: '主菜', main: true, min: 10, pack }; r.items = ings.map(n => { const it = parseIng(n.replace(/ /g, '\u00a0')); if (pack){ it.en = n.replace(/\u00a0/g, ' '); it.key = it.en.toLowerCase(); } return it; }); return r; };
        for (const [id, [must, not]] of Object.entries(CASES)){
            S.settings.allergens = [id]; S.settings.allergenFerm = true;
            const m = must.find(n => { const k = algKind(id, parseIng(n.replace(/ /g, '\u00a0'))); return k === 1 || k === 2; });
            if (!m){ out.push(['NOMUST', id]); continue; }
            const jp = /[぀-ヿ㐀-鿿]/.test(m);
            const mk = (ings, seas) => rec(ings, seas, jp ? undefined : 'XX');
            const base = jp ? ['玉ねぎ', 'にんじん'] : ['Onion', 'Carrot'];
            if (!isAvoidedCore(mk([...base, m]))) out.push(['ITEM', id, m]);
            if (!isAvoidedCore(mk([...base, m + '?']))) out.push(['OPT', id, m]);
            if (!isAvoidedCore(mk(base, jp ? '砂糖・' + m + ' 大さじ1' : '1 tsp salt · 1 tbsp ' + m))) out.push(['SEAS', id, m]);
            const safe = not.filter(n => !algKind(id, parseIng(n.replace(/ /g, '\u00a0')))).slice(0, 2);
            if (safe.length && isAvoidedCore(mk([...base, ...safe.filter(n => /[぀-ヿ㐀-鿿]/.test(n) === jp)]))) out.push(['SAFE', id, safe.join()]);
        }
        S.settings.allergens = [];
        return out;
    }, CASES);
    rr.forEach(x => ok(false, '代表レシピ ' + x.join(' / ')));
    console.log('1b) 代表レシピ（材料・なくても可・調味料の欄）:', Object.keys(CASES).length, 'アレルゲン');
    console.log('1) 材料の判定:', r.ids.length, 'アレルゲン');
    await ctx.close();
}

// ---------- 2) 全21か国・約1,700品の機械チェック ----------
// 「明らかなその言葉」だけの独立した表（判定の表とは別に書く）。含む料理は必ず出ない
const OBVIOUS = {
    shrimp: /えび|海老|\bshrimp|\bprawn/i, crab: /蟹|\bcrab/i, walnut: /くるみ|\bwalnut/i, wheat: /小麦粉|薄力粉|強力粉|パン粉|\bwheat flour|\bflour tortilla|\bbread\b|\bspaghetti|うどん|スパゲッティ|餃子の皮/i,
    buckwheat: /そば粉|\bbuckwheat|\bsoba\b/i, egg: /卵|\beggs?\b|\begg yolk|マヨネーズ|\bmayonnaise/i, milk: /牛乳|バター|チーズ|\bmilk\b|\bbutter\b|\bcheese\b|\bcream\b|\bghee\b|ヨーグルト|\byogh?urt/i,
    peanut: /ピーナッツ|落花生|\bpeanut/i, abalone: /あわび|\babalone/i, squid: /\bsquid\b|\bcalamari|いか(?!り)/i, ikura: /いくら|イクラ|salmon roe/i, orange: /オレンジ|\borange (juice|zest)|\boranges?\b/i,
    cashew: /カシュー|\bcashew/i, kiwi: /キウイ|\bkiwi/i, beef: /牛肉|牛ひき|\bbeef\b|\bveal\b/i, sesame: /ごま油|白ごま|すりごま|練りごま|\bsesame (seed|oil)|\btahini/i, salmon: /鮭|サーモン|\bsalmon\b/i,
    mackerel: /\bmackerel\b|鯖|塩さば/i, soy: /豆腐|納豆|\btofu\b|\btempeh\b|\bedamame|大豆|油揚げ|厚揚げ/i, chicken: /鶏肉|鶏もも|鶏むね|\bchicken\b/i, banana: /バナナ|\bbananas?\b/i, pork: /豚肉|豚ひき|豚バラ|\bpork\b|\bbacon\b/i,
    macadamia: /マカダミア|\bmacadamia/i, pistachio: /ピスタチオ|\bpistach|\bpistaz/i, peach: /桃|\bpeach/i, yamaimo: /長いも|山芋|やまいも|とろろ|自然薯/i, apple: /りんご|\bapples?\b/i, gelatin: /ゼラチン|\bgelatin/i, almond: /アーモンド|\balmond/i,
    gluten: /小麦粉|薄力粉|強力粉|パン粉|\bwheat flour|\bbread\b|\bspaghetti|うどん|\brye\b|\bbarley|ライ麦|大麦/i, crustacean: /えび|海老|蟹|\bshrimp|\bprawn|\bcrab|\blobster/i,
    fish: /鮭|サーモン|\bsalmon\b|\btuna\b|\bcod\b|\bmackerel\b|\banchov|ツナ|\bfish\b|鯖|かつお節|さんま|いわし/i, treenut: /アーモンド|くるみ|カシュー|ピスタチオ|\balmond|\bwalnut|\bcashew|\bhazelnut|\bpecan|\bpistachio/i,
    celery: /セロリ|\bcelery\b/i, mustard: /粒マスタード|練りからし|\bmustard\b/i, sulphite: /\bwine\b|ワイン|\braisins?\b/i, lupin: /\blupin/i, mollusc: /あさり|しじみ|ほたて|牡蠣|\bclams?\b|\bmussels?\b|\boysters?\b|\bscallops\b|\boctopus\b|\bsquid\b/i,
};
// 除外の根拠になりうる言葉（広め）。オイスターソース（小麦・大豆）・コチュジャン・甜麺醤（小麦）・めんつゆ（魚）は安全第4回b N1、塩昆布・納豆付属のたれ（醤油と同じ）・ラー油（ごま）はモニター第3回c NEW2 で判定に入れた。除外された料理に、この言葉が材料か調味料に1つもなければ「誤って除外」
const LOOSE = {
    shrimp: /えび|海老|shrimp|prawn|krill|terasi|belacan|kapi|bagoong|saeujeot|xo/i, crab: /かに|蟹|crab|kani|surimi/i, walnut: /くるみ|walnut|nuez|noix|nueces/i,
    wheat: /塩昆布|納豆付属のたれ|コチュジャン|gochujang|고추장|甜麺醤|甜面酱|オイスター|oyster|タルハナ|tarhana|スープの素|発酵|小麦|粉|flour|パン|bread|麺|noodle|pasta|うどん|スパゲ|マカロニ|皮|wrapper|tortilla|bun|ルウ|roux|ソース|sauce|couscous|bulgur|semolina|farro|seitan|crumb|cracker|dough|pastry|pie|biscuit|醤油|soy|ポン酢|めんつゆ|てりやき|teriyaki|kecap|hoisin|コンソメ|ワンタン|餃子|春巻|焼売|ラーメン|ビール|beer|malt|orzo|ニョッキ|gnocchi|tempura|天ぷら|天かす|pav|roti|chapati|naan|paratha|puri|atta|maida|suji|rava|sooji|toast|baguette|croissant|pita|lavash|cake|カステラ|ケーキ|ホットケーキ|パンケーキ|pancake|waffle|wafer|crepe|クレープ|bagel|muffin|biscuit|cookie|pretzel|dumpling|manti|mandu|samosa|empanada|pizza|ピザ|burger|sandwich|lasagn|ravioli|tortellini|cannelloni|spaetzle|spätzle|knödel|schupfnudel|maultasche|bread|brötchen|semmel|brioche|focaccia|ciabatta|panko|breadcrumbs|batter|衣|フライ|揚げ|breaded|crusted|coated|schnitzel|katsu|カツ|コロッケ|croquette|ハンバーグ|つくね|肉団子|meatball|meatloaf|fritter|bhaji|pakora|vada|dosa|idli|uttapam|appam|paniyaram|thepla|poori|bhature|kulcha|dalia|daliya|vermicelli|seviyan|sewai|jalebi|gulab|halwa|kheer|payasam/i,
    buckwheat: /そば|蕎麦|soba|buckwheat|sarrasin|kasha|カーシャ|ガレット|galette/i, egg: /卵|たまご|玉子|egg|yolk|mayo|マヨ|aioli|alioli|hollandaise|meringue|brioche|tagliatelle|tortellini|ravioli|pasta|noodle|麺|ワンタン|wonton|タルタル|tartar|カステラ|cake|ケーキ|custard|pancake|crepe|batter|パン|bread|bun|tempura|天ぷら|mochi|ピータン|蛋|egg-?fried|carbonara|カルボナーラ|gnocchi|ニョッキ|spaetzle|spätzle|fresh/i,
    milk: /乳|milk|ミルク|cream|クリーム|butter|バター|cheese|チーズ|yogh?urt|ヨーグルト|ghee|ギー|paneer|パニール|queso|quark|クワルク|ricotta|mozzarella|parmesan|パルメ|パルミ|pecorino|ペコリ|cheddar|feta|crema|crème|creme|lait|leche|latte|burro|panna|roux|ルウ|デミ|demi|white sauce|ホワイト|béchamel|bechamel|brioche|croissant|custard|cajeta|dulce|kaymak|labneh|ayran|raita|tzatziki|khoa|mawa|chocolate|チョコ|ice|アイス|whey|casein|kefir|skyr|curd|cottage|mascarpone|gouda|brie|camembert|gruy|emmental|raclette|halloumi|requeij|cuajada|coalho|coalhada|queijo|manteiga|natilla|crema|nata|kaymak|süt|peynir|tereyağ|yoğurt|mleko|ser|śmietan|masło|twaróg|serek|kefir|jogurt|maślank|susu|keju|mentega|gatas|keso|mantikilya|우유|치즈|버터|牛奶|奶酪|黄油|นม|เนย|sữa|phô mai|bơ|दूध|दही|घी|पनीर|مثل|حليب|جبن|زبدة|لبن|قشطة|سمن/i,
    peanut: /ピーナッツ|ぴーなっつ|落花生|南京豆|peanut|groundnut|cacahu|mani\b|maní|arachide|amendoim|satay|saté|gado|pecel|kare|mole|땅콩|花生|ถั่วลิสง|đậu phộng|kacang|yerfıstığı|orzeszk|मूंगफली|mani/i,
    pistachio: /ピスタチオ|ぴすたちお|pistach|pistaz|pistacj|피스타치오|开心果|antep|पिस्ता/i, abalone: /あわび|鮑|abalone|鲍/i, squid: /いか|烏賊|squid|calamar|calmar|kalmar|sepia|cuttlefish|sotong|오징어|鱿|หมึก|mực|kałamarn|pusit|するめ|ika/i, ikura: /いくら|イクラ|筋子|すじこ|roe|ikura|caviar/i,
    orange: /オレンジ|みかん|蜜柑|orange|naranja|arancia|laranja|tangerine|mandarin|clementine|柑橘|pomelo|satsuma|橙/i, cashew: /カシュー|cashew|cajou|anacardo|caju|캐슈|腰果|kaju|nerkow|काजू/i, kiwi: /キウイ|kiwi|奇异果|猕猴桃/i,
    beef: /牛|ビーフ|beef|veal|oxtail|suet|brisket|sirloin|rib|steak|bresaola|pastrami|ternera|boeuf|bœuf|rindfleisch|manzo|vitello|carne|소고기|쇠고기|wagyu|ひき肉|びき肉|mince|ground|ルウ|roux|デミ|demi|ブイヨン|コンソメ|bouillon|stock|broth|hamburger|ハンバーグ|burger|meatball|meatloaf|kofta|köfte|kebab|bolognese|ragu|ragù|chili con|tacos?|picadillo|empanada|samosa|keema|kheema|kima|dolma|sarma|lasagn|cannelloni|stew|goulash|gulasch|rouladen|sauerbraten|bulgogi|galbi|kalbi|bibimbap|yukgaejang|seolleongtang|gomtang|tteokgalbi|churrasco|feijoada|rendang|rawon|soto|bakso|sate|satay|lomo|ropa vieja|bistec|bife|milanesa|asado|cecina|tasajo|barbacoa|carnitas|machaca|birria|pozole|menudo|mondongo|sancocho|ajiaco|arroz|cachupa|stroganoff|carbonnade|waterzooi|pot-au-feu|bourguignon|daube|blanquette|cassoulet|hachis|parmentier|tartare|carpaccio|bresaola|ossobuco|brasato|bollito|stracotto|peposo|spezzatino|polpett|cotoletta|saltimbocca|vitello tonnato/i,
    sesame: /ラー油|辣油|chili oil|ごま|胡麻|芝麻|sesame|tahini|tahina|gomashio|sésamo|sésame|sesam|gergelim|참깨|참기름|깨|wijen|susam|sezam|तिल|hummus|za.?atar|dukkah|furikake|ふりかけ|halva|halwa|helva|baba|麻/i,
    salmon: /鮭|さけ|サーモン|salmon|saumon|lachs|somon|łosoś|연어|三文鱼|แซลมอน|cá hồi/i, mackerel: /鯖|さば|mackerel|caballa|maquereau|makrele|sgombro|cavala|고등어|鲭|ปลาทู|cá thu|makarel|makrela|サバ/i,
    soy: /塩昆布|オイスター|oyster|焼肉のたれ|甜麺醤|甜面酱|ソース|お好み|大豆|豆腐|とうふ|油揚げ|厚揚げ|納豆|きなこ|豆乳|おから|枝豆|湯葉|soy|soya|soja|tofu|edamame|tempeh|tempe|natto|tahu|두부|콩|豆浆|腐竹|เต้าหู้|đậu nành|đậu phụ|yuba|miso|味噌|みそ|醤油|しょうゆ|shoyu|tamari|kecap|ketjap|doenjang|ganjang|gochujang|된장|간장|고추장|酱油|豆瓣|豆豉|doubanjiang|めんつゆ|ポン酢|てりやき|teriyaki|hoisin|豆|taho|tokwa|bean curd|tvp|textured/i,
    chicken: /鶏|とり|ささみ|チキン|chicken|poultry|pollo|poulet|hähnchen|huhn|pollame|frango|닭|鸡|ไก่|gà|ayam|tavuk|kurczak|मुर्ग|चिकन|manok|turkey|ブイヨン|コンソメ|ガラ|bouillon|stock|broth|cube|中華だし|カレー|curry|ルウ|roux|ビリヤニ|biryani|plov|pilaf|pulao|paella|kebab|shawarma|tikka|tandoori|butter chicken|korma|jalfrezi|karahi|handi|dhansak|xacuti|cafreal|piri.?piri|peri.?peri|jerk|adobo|tinola|lechon manok|inasal|sinigang|nilaga|afritada|menudo|caldereta|kare.?kare|opor|soto ayam|rendang ayam|gulai ayam|ayam goreng|ayam bakar|nasi/i,
    banana: /バナナ|banana|plátano|platano|banane|banan|바나나|香蕉|กล้วย|chuối|pisang|muz|banany|केला|saging|plantain|sabá|saba/i, macadamia: /マカダミア|macadamia|마카다미아|夏威夷果/i,
    peach: /桃|もも|peach|nectarine|melocot|durazno|pêche|peche|pfirsich|pesca|pêssego|복숭아|พีช|đào|persik|şeftali|brzoskwini|आड़ू/i,
    yamaimo: /やまいも|山芋|山いも|長いも|長芋|ながいも|自然薯|とろろ|nagaimo|yamaimo|jinenjo|yam|山药|참마|dioscorea/i, apple: /りんご|林檎|apple|manzana|pomme|apfel|äpfel|mela|maçã|사과|苹果|แอปเปิ้ล|táo|apel|elma|jabłk|सेब|mansanas/i,
    gelatin: /ゼラチン|gelatin|gelatina|젤라틴|明胶|吉利丁|เจลาติน|żelatyn|marshmallow|マシュマロ|gummy|グミ|jello|jelly|ゼリー|aspic|panna cotta|mousse|bavarois|bavarian/i, almond: /アーモンド|almond|almendra|amande|mandel|mandorl|amêndoa|아몬드|杏仁|巴旦木|อัลมอนด์|hạnh nhân|badem|migdał|बादाम|badam|marzipan|マジパン|frangipane|amaretti|orgeat|horchata/i,
    gluten: /塩昆布|納豆付属のたれ|コチュジャン|gochujang|고추장|甜麺醤|甜面酱|オイスター|oyster|マウルタッシェン|タルハナ|tarhana|スープの素|発酵|小麦|麦|粉|flour|パン|bread|麺|noodle|pasta|うどん|スパゲ|マカロニ|皮|wrapper|tortilla|bun|ルウ|roux|ソース|sauce|couscous|bulgur|semolina|farro|seitan|crumb|cracker|dough|pastry|pie|biscuit|醤油|soy|ポン酢|めんつゆ|てりやき|teriyaki|kecap|hoisin|コンソメ|ワンタン|餃子|春巻|焼売|ビール|beer|malt|rye|barley|oat|spelt|kamut|freekeh|orzo|ニョッキ|gnocchi|tempura|天ぷら|天かす|pav|roti|chapati|naan|paratha|puri|atta|maida|suji|rava|sooji|toast|baguette|croissant|pita|lavash|cake|カステラ|ケーキ|pancake|waffle|crepe|クレープ|bagel|muffin|cookie|pretzel|dumpling|manti|mandu|samosa|empanada|pizza|burger|sandwich|lasagn|ravioli|tortellini|cannelloni|spaetzle|spätzle|knödel|schnitzel|katsu|カツ|コロッケ|croquette|ハンバーグ|つくね|meatball|meatloaf|fritter|bhaji|pakora|vada|dosa|idli|appam|thepla|poori|kulcha|dalia|vermicelli|seviyan|sewai|jalebi|batter|衣|フライ|揚げ|breaded|crusted|coated|gluten|brioche|focaccia|ciabatta|panko|brötchen|semmel|bread|trigo|blé|weizen|frumento|centeno|seigle|roggen|segale|cebada|orge|gerste|avena|avoine|hafer|aveia|buğday|arpa|yulaf|pšenic|żyto|jęczmień|owies|보리|호밀|귀리|燕麦|黑麦|gandum|jelai|gândum|गेहूं|जौ/i,
    crustacean: /えび|海老|蟹|かに|shrimp|prawn|krill|crab|lobster|crayfish|langoustine|scampi|terasi|belacan|kapi|bagoong|saeujeot|xo|surimi|camar|gamba|crevette|garnele|gambero|krewetk|udang|karides|hipon|새우|虾|กุ้ง|tôm|झींगा|cangrejo|jaiba|crabe|krabbe|granchio|caranguejo|kepiting|yengeç|krab|alimango|ロブスター|ざりがに|しゃこ|mariscos|shellfish/i,
    fish: /めんつゆ|つゆ|mentsuyu|さば|あじ|ぶり|たら|さけ|ふぐ|はも|きす|ほっけ|あゆ|こい|ます|たい|オイスター|魚|さかな|鮭|鯖|鯵|鰯|鰤|鱈|鯛|鰹|鮪|鰻|穴子|さんま|いわし|かつお|まぐろ|ひらめ|かれい|さわら|かじき|たらこ|めんたい|明太子|しらす|ししゃも|わかさぎ|ちりめんじゃこ|じゃこ|ちくわ|かまぼこ|はんぺん|さつま揚げ|ひもの|干物|煮干|にぼし|いりこ|あんこう|うなぎ|あなご|いくら|筋子|すじこ|つな|ツナ|fish|anchov|tuna|salmon|mackerel|herring|pollack|pollock|hairtail|cod|haddock|bream|whitebait|croaker|sardine|tilapia|trout|hake|milkfish|bangus|catfish|pomfret|snapper|bonito|katsuobushi|bass|halibut|swordfish|plaice|sole|mullet|carp|eel|perch|pike|turbot|monkfish|grouper|sturgeon|caviar|kipper|sprat|pilchard|barramundi|pangasius|basa|dorado|mahi|marlin|kingfish|pescado|bacalao|atún|salmón|sardina|poisson|thon|saumon|morue|fisch|lachs|thunfisch|pesce|tonno|salmone|merluzzo|peixe|atum|bacalhau|salmão|생선|어묵|멸치|참치|연어|고등어|鱼|鳕|ปลา|cá|ikan|balık|ryba|rybn|मछली|isda|bagoong|daing|tinapa|dashi|だし|ダシ|worcestershire|ウスター|caesar|シーザー|魚醤|nam ?pla|nuoc|patis|ナンプラー|アンチョビ|garum|surimi|furikake|ふりかけ|narutomaki|なると/i,
    treenut: /ナッツ|nut|アーモンド|くるみ|カシュー|ピスタチオ|ヘーゼル|ペカン|ピーカン|松の実|ぎんなん|銀杏|almond|walnut|cashew|hazelnut|filbert|pecan|pistachio|pine|pinoli|piñones|pignoli|nutella|praline|gianduja|pesto|nougat|avellana|noisette|haselnuss|nocciola|avelã|pistache|pistacho|pistazie|pekan|헤이즐넛|피스타치오|잣|榛子|开心果|碧根果|松子|fındık|fistik|antep|pistacja|orzech|पिस्ता|pili|candle|kemiri|kola|hickory|ginkgo|mole|satay|gado|pecel|ヌガー|プラリネ|ヌテラ|frangipane|baklava|kunafa|maamoul|romesco|marzipan|macadamia|マカダミア/i,
    celery: /セロリ|celery|celeriac|céleri|apio|sellerie|sedano|aipo|selleri|seler|kereviz|selderij|kintsay|芹菜|西芹|셀러리|เซเลอรี่|cần tây|seledri|mirepoix/i, mustard: /からし|辛子|芥子|マスタード|mustard|moutarde|senf|senape|mostarda|mostaza|musztard|hardal|겨자|芥末|มัสตาร์ด|mù tạt|mustar|सरसों|sarson|dijon|kasundi|piccalilli/i,
    sulphite: /sulphite|sulfite|sulphur|sulfur|亜硫酸|wine|ワイン|わいん|sherry|シェリー|vermouth|marsala|madeira|port|vinegar|酢|raisin|sultana|dried fruit|dried apricot|dried fig|ドライフルーツ|干しぶどう|レーズン|vin\b|vino|vinho|wein|balsamic|バルサミコ|cider|sauerkraut|ザワークラウト|ザウアークラウト|pickl|ピクルス|漬物|jam|ジャム/i, lupin: /lupin|ルピナス|羽扇豆|tremoço|tarwi|chocho|termos/i,
    mollusc: /オイスター|おいすたー|あさり|しじみ|はまぐり|蛤|ほたて|帆立|牡蠣|つぶ貝|さざえ|貝|蛸|たこ|いか|烏賊|するめ|clam|mussel|oyster|scallop|octopus|cockle|whelk|snail|escargot|periwinkle|limpet|conch|geoduck|pulpo|poulpe|krake|polpo|polvo|almeja|mejill|ostra|vieira|berberecho|chirla|palourde|moule|huître|coquille|vongole|cozze|ostrica|muschel|auster|midye|kerang|tiram|remis|조개|굴|낙지|문어|蛤蜊|牡蛎|蚝|扇贝|章鱼|หอย|nghêu|sò|hàu|tahong|talaba|sea urchin|squid|calamar|calmar|kalmar|sepia|cuttlefish|sotong|오징어|鱿|หมึก|mực|kałamarn|pusit|abalone|鮑|鲍|전복/i,
};
// 料理1品の材料・調味料の言葉（材料のキー・英語名・名前・画面の名前＋調味料の欄）
// 判定の表が「そのアレルゲンではない」と決めている言い方（ココナッツミルク・バナナの葉・料理酒・からし菜・りんご酢など）は、明らかな言葉の検査から外す
const STRIP = /coconut (?:milk|cream)|soy ?milk|almond milk|oat milk|rice milk|peanut butter|banana leaf|banana leaves|バナナの葉|rice wine|shaoxing|紹興|mustard (?:greens?|leaf|leaves)|からし菜|高菜|apple cider vinegar|cider vinegar|細長いもの|oyster mushroom|oyster crackers|ひらたけ|ビーフン|water chestnut|cooking wine|chinese (?:rice )?wine|huangjiu|mijiu|orange.?fleshed|orange sweet potato|オレンジ色|eggs? \(chicken|鶏卵/gi;
const TXT = `(r => [...(r.items || []).map(i => [i.key, i.en, i.name, i.label].join(' | ')), String(r.seasBase != null ? r.seasBase : r.seas || ''), r.name, r.nameEn || ''].join(' || '))`;
{
    const { ctx, p } = await open('JP');
    const total = { n: 0, ex: 0 };
    const res = await p.evaluate(async ([CCS, OB, LO, TXTSRC, STRIPSRC]) => {
        const txt = eval(TXTSRC); const STRIP = new RegExp(STRIPSRC[0], 'i');
        const O = {}, L = {};
        Object.entries(OB).forEach(([k, v]) => O[k] = new RegExp(v[0], v[1])); Object.entries(LO).forEach(([k, v]) => L[k] = new RegExp(v[0], v[1]));
        const all = [...RECIPES];
        for (const cc of CCS.filter(c => c !== 'JP')){ await loadBrowse(cc); all.push(...(BROWSE[cc] || [])); }
        const miss = [], over = [], stat = {};
        const prev = S.settings.allergens;
        for (const id of ALG_ALL){
            S.settings.allergens = [id]; let ex = 0;
            for (const r of all){
                const out = isAvoidedCore(r), t = txt(r);
                // (a) 明らかな言葉がある（「なくても可」でも）なら、必ず出ない。ただし判定の表が「含まない」と決めた言い方（no）は例外なので、材料1つずつ見て確かめる
                const obvious = O[id] && (r.items || []).concat(seasItems(r)).some(i => { const tx = [i.key, i.en, i.name, i.label].join(' | '); return !STRIP.test(tx) && O[id].test(tx); });
                if (obvious && !out) miss.push(id + ' ' + r.id + ' ' + r.name.slice(0, 30));
                if (out){ ex++; if (!(L[id] || /./).test(t)) over.push(id + ' ' + r.id + ' ' + r.name.slice(0, 30)); }
            }
            stat[id] = ex;
        }
        S.settings.allergens = prev;
        return { n: all.length, miss, over, stat, ccs: [...new Set(all.map(r => r.pack || 'JP'))].length };
    }, [CCS, Object.fromEntries(Object.entries(OBVIOUS).map(([k, v]) => [k, [v.source, v.flags]])), Object.fromEntries(Object.entries(LOOSE).map(([k, v]) => [k, [v.source, v.flags]])), TXT, [STRIP.source, STRIP.flags]]);
    console.log('2) 機械チェック:', res.n, '品 /', res.ccs, 'か国');
    console.log('   アレルゲンごとの除外数:', Object.entries(res.stat).map(([k, v]) => k + ':' + v).join(' '));
    res.miss.forEach(x => ok(false, '判定漏れ ' + x)); res.over.forEach(x => ok(false, '根拠なしの除外 ' + x));
    ok(res.n >= 1600, '料理が1,600品以上ある: ' + res.n); ok(res.ccs === 21, '21か国: ' + res.ccs);
    await ctx.close();
}

// ---------- 3) 厳格さ: 置き換えで安全に見せない ----------
{
    const { ctx, p } = await open('JP', { avoidSwap: true, allergens: [] });
    const r = await p.evaluate(() => {
        const out = {};
        // 豚肉をアレルゲンにする: 豚肉の料理は、鶏肉などに置き換えず、出さない
        S.settings.allergens = ['pork']; S.settings.avoid = []; render();
        const porky = RECIPES.filter(r => r.items.some(i => /豚/.test(i.key)));
        out.porkN = porky.length; out.porkShown = porky.filter(r => !isAvoided(r)).length; out.porkSwapped = porky.filter(r => swappedRecipe(r) !== r).length;
        // 苦手（鶏肉）＋アレルゲン（豚肉）: 豚肉の料理を鶏肉に置き換えて出すことはしない。鶏肉の料理を豚肉に置き換えることもしない
        S.settings.avoid = ['鶏肉']; S.settings.allergens = ['pork'];
        const bad = [];
        RECIPES.forEach(r => { if (isAvoided(r)) return; const w = swappedRecipe(r); (w.items || []).forEach(i => { if (algItemHit(['pork'], i)) bad.push(r.id + ':' + i.name); }); });
        out.swapIntoAllergen = bad;
        // 苦手の置き換えで調味料に別の食材を足す（オイスターソース→醤油）: 大豆が苦手でなくアレルゲンなら、替えない
        S.settings.avoid = ['@shellfish']; S.settings.allergens = ['soy'];
        const oy = RECIPES.filter(r => /オイスターソース/.test(r.seas || '') && !isAvoidedCore(r)).slice(0, 1);
        out.oysterShown = oy.length;
        return out;
    });
    ok(r.porkN > 5, '豚肉の料理がある'); ok(r.porkShown === 0, '豚肉アレルギー: 豚肉を使う料理は1品も出ない（' + r.porkShown + '）'); ok(r.porkSwapped === 0, '豚肉アレルギー: 置き換えた料理が0');
    ok(!r.swapIntoAllergen.length, '置き換えでアレルゲンに替えない: ' + r.swapIntoAllergen.slice(0, 3).join(','));
    ok(r.oysterShown === 0, '大豆アレルギー: 貝が苦手でも、オイスターソースを醤油に替えて出さない');
    await ctx.close();
}

// ---------- 4) 全経路で同じ判定・5) 連動なし ----------
for (const cc of ['JP', 'US', 'FR', 'KR']){
    const { ctx, p } = await open(cc, {}, {});
    const r = await p.evaluate(() => {
        const out = { menuBad: 0, menus: 0, rerollBad: 0, weekBad: 0, shopBad: 0, linked: [], twistBad: 0, searchBad: 0, oneBad: 0, fridgeBad: 0, savedWarn: false, savedApplyBad: 0, cookWarn: false, worldBad: 0, worldHidden: 0, favBad: 0, detail: '', detailMine: '', settings: {} };
        const pickAlg = ['egg', 'milk', 'wheat'];
        S.settings.allergens = pickAlg; save();
        const conflict = r => allergyConflict(r);
        // 献立を何回も作る
        for (let k = 0; k < 40; k++){ session.menu = null; ensureMenu(); out.menus++; if (session.menu.items.some(x => x.r && conflict(x.r))) out.menuBad++; }
        // 「かえる」を押す（全枠）
        for (let k = 0; k < 6; k++){ session.menu = null; setTab('today'); render(); for (let i = 0; i < session.menu.items.length; i++){ const bt = document.querySelector(`[data-act="reroll"][data-i="${i}"]`); if (bt) bt.click(); if (session.menu.items.some(x => x.r && conflict(x.r))) out.rerollBad++; } }
        // 1週間プラン・買い物メモ
        for (let k = 0; k < 5; k++){ makeWeek(); if (S.week.days.some(x => !x.skip && conflict(byId(x.id)))) out.weekBad++; S.settings.weekSides = true; ensureWeekExtras(); if (S.week.days.some(x => x.extra && [x.extra.side, x.extra.soup].some(id => id && byId(id) && conflict(byId(id))))) out.weekBad++;
            const list = shoppingList(); S.staples = []; S.fridge = []; const bad = list.filter(e => algItemHit(pickAlg.filter(a => a !== 'wheat'), {key: keyOf(e.label), name: e.label, label: e.label, en: e.en || ''})); if (bad.length) out.shopBad += bad.length; }
        // 手で選ぶ: 材料から・検索・ひとひねり・あと1品
        out.searchBad = (searchRecipes('卵').hits.concat(searchRecipes('egg').hits)).filter(conflict).length;
        for (let k = 0; k < 6; k++){ try{ generateTwists({count: 6}).forEach(tw => { if (conflict(tw)) out.twistBad++; }); }catch(e){} }
        out.oneBad = RECIPES.filter(r => conflict(r) && oneCanAdd(r)).length;
        // 世界のレシピ
        const wcc = ['JP', 'US'].includes(currentCountry()) ? 'FR' : 'JP';
        return out;
    });
    ok(r.menuBad === 0, cc + ' 献立: アレルゲンの料理が0 (' + r.menuBad + '/' + r.menus + ')');
    ok(r.rerollBad === 0, cc + ' かえる: アレルゲンの料理が0 (' + r.rerollBad + ')');
    ok(r.weekBad === 0, cc + ' 1週間プラン: アレルゲンの料理が0 (' + r.weekBad + ')');
    ok(r.shopBad === 0, cc + ' 買い物メモ: アレルゲンの材料が0 (' + r.shopBad + ')');
    ok(r.searchBad === 0, cc + ' 検索: アレルゲンの料理が0 (' + r.searchBad + ')');
    ok(r.twistBad === 0, cc + ' ひとひねり: アレルゲンの料理が0 (' + r.twistBad + ')');
    ok(r.oneBad === 0, cc + ' あと1品: アレルゲンの料理を入れられない (' + r.oneBad + ')');
    await ctx.close();
}

// 5) 連動なし: アレルゲンを足しても、当たっていない枠は動かない
for (const cc of ['JP', 'US', 'DE']){
    const { ctx, p } = await open(cc, { dishCount: 4 });
    const r = await p.evaluate(() => {
        const out = { same: 0, changedOk: 0, bad: [] };
        const ids = ['egg', 'milk', 'pork', 'chicken', 'beef', 'fish', 'wheat', 'soy', 'sesame', 'shrimp', 'peanut', 'treenut', 'gluten'];
        for (let rep = 0; rep < 12; rep++){
            S.settings.allergens = []; session.menu = null; ensureMenu();
            const before = session.menu.items.map(x => x.r && x.r.id);
            const id = ids[rep % ids.length];
            const hit = session.menu.items.map(x => x.r && (() => { S.settings.allergens = [id]; const h = allergyConflict(x.r); S.settings.allergens = []; return h; })());
            S.settings.allergens = [id]; save(); reconcileMenu(); refreshWeek();
            const after = session.menu.items.map(x => x.r && x.r.id);
            after.forEach((a, i) => { if (!hit[i] && a !== before[i]) out.bad.push(id + ' slot' + i + ' ' + before[i] + '→' + a); if (hit[i] && a === before[i]) out.bad.push(id + ' slot' + i + ' 残った ' + a); if (!hit[i] && a === before[i]) out.same++; else if (hit[i]) out.changedOk++; });
            if (session.menu.items.some(x => x.r && allergyConflict(x.r))) out.bad.push(id + ' 献立に残った');
            // 解除しても動かない
            const mid = session.menu.items.map(x => x.r && x.r.id);
            S.settings.allergens = []; save(); reconcileMenu();
            if (JSON.stringify(session.menu.items.map(x => x.r && x.r.id)) !== JSON.stringify(mid)) out.bad.push(id + ' 解除で動いた');
        }
        return out;
    });
    ok(!r.bad.length, cc + ' 連動なし: ' + r.bad.slice(0, 4).join(' ; ')); console.log('5)', cc, '当たらない枠は不動:', r.same, '枠 / 選び直し:', r.changedOk, '枠');
    await ctx.close();
}
// 5b) 主菜と汁ものの両方に当たり、主菜の選び直し先が汁けの多い主菜（鍋・おでん・うどんなど）になったとき: 汁ものの替わりは出せないが、アレルゲンの汁ものは残さず枠を空ける
//     （ランダムでは約0.4%でしか起きないので、主菜の選び直し先を決めて必ず通す。run-all で1回だけ「milk slot3 残った kabochapotage」になった件）
{
    const { ctx, p } = await open('JP', { dishCount: 4 });
    const r = await p.evaluate(() => {
        const out = { n: 0, bad: [], kept: [] };
        const origMain = suggestMain;
        for (const id of ALG_ALL){
            S.settings.allergens = [id];
            const mains = RECIPES.filter(r => r.main && !soupyMain(r) && allergyConflict(r));
            const soups = RECIPES.filter(r => r.type === '汁物' && allergyConflict(r));
            const soupy = RECIPES.filter(r => r.main && soupyMain(r) && !isAvoided(r));
            const sides = RECIPES.filter(r => r.type === '副菜' && !isAvoided(r));
            S.settings.allergens = [];
            if (!mains.length || !soups.length || !soupy.length) continue;
            for (const sp of soupy.slice(0, 3)){
                session.menu = null; ensureMenu(); const m = session.menu; const si = m.items.findIndex(x => x.slot === '汁物');
                m.items[0].r = mains[0]; m.items[si].r = id === 'milk' && soups.some(s => s.id === 'kabochapotage') ? byId('kabochapotage') : soups[0];
                m.items.forEach((x, k) => { if (k && k !== si) x.r = sides[k]; });
                const sideIds = m.items.map((x, k) => k && k !== si ? x.r.id : null);
                suggestMain = () => sp;
                try{ S.settings.allergens = [id]; save(); reconcileMenu(); } finally { suggestMain = origMain; }
                out.n++;
                const left = m.items.filter(x => x.r && allergyConflict(x.r)).map(x => x.r.id);
                if (left.length) out.bad.push(id + ' 主菜=' + sp.id + ' 残った ' + left.join(','));
                if (m.items[si].r) out.bad.push(id + ' 主菜=' + sp.id + ' 汁ものの枠に ' + m.items[si].r.id);
                m.items.forEach((x, k) => { if (sideIds[k] && (!x.r || x.r.id !== sideIds[k])) out.kept.push(id + ' slot' + k); });
                S.settings.allergens = []; save();
            }
        }
        return out;
    });
    ok(r.n > 20 && !r.bad.length, '5b) 汁けの多い主菜に替わっても、アレルゲンの汁ものが残らない（' + r.n + '通り）: ' + r.bad.slice(0, 4).join(' ; '));
    ok(!r.kept.length, '5b) 当たっていない副菜は動かない: ' + r.kept.slice(0, 4).join(' ; '));
    console.log('5b) 汁けの多い主菜に替わるとき:', r.n, '通り');
    await ctx.close();
}
// 5c) 替わりがない（null）ときも、当たる料理を残さない: 全経路（かえる・まるごと入れ替え・気分・品数・冷蔵庫から・1週間プラン・保存献立・
//     家族のアレルギー・苦手・品薄・国の切り替え・プランの主菜を献立に・ひとひねり案を主菜に・案2の明日の一膳）。主菜も残さず空けて「この条件で出せる主菜がありません」
{
    const { ctx, p } = await open('JP', { dishCount: 3 });
    const r = await p.evaluate(async () => {
        const bad = [], note = [];
        const slotOut = r => !!r && (isAvoided(r) || S.hidden.includes(r.id));   // 献立に残してはいけない料理（アプリの判定をそのまま使う）
        const left = (tag) => (session.menu ? session.menu.items : []).forEach((x, i) => { if (x.r && slotOut(x.r)) bad.push(tag + ' slot' + i + ' ' + x.r.id); });
        const click = (act, ds = {}) => { const b = document.createElement('button'); b.dataset.act = act; Object.assign(b.dataset, ds); document.body.appendChild(b); b.click(); b.remove(); };
        const reset = () => { S.settings.allergens = []; S.settings.avoid = []; S.settings.scarce = []; S.family = []; S.eaters = null; S.cook = null; S.hidden = []; session.mood = 'all'; session.useFridge = false; save(); };
        const orig = { main: suggestMain, any: suggestOrAny };
        const noRepl = run => { suggestMain = () => null; suggestOrAny = () => null; try{ run(); } finally { suggestMain = orig.main; suggestOrAny = orig.any; } };
        const mainMsg = () => { render(); const nm = document.querySelector('.tray .spot.main .nm'); return nm ? nm.textContent : ''; };
        // (a) 出せる主菜が1つもない（全アレルゲン）: 設定変更の照合で、当たる主菜を残さず空ける・知らせる・決められない
        reset(); session.menu = null; setTab('today'); ensureMenu();
        S.settings.allergens = [...ALG_ALL]; save(); reconcileMenu(); left('照合(全アレルゲン)');
        if (session.menu.items[0].r) bad.push('照合: 主菜が空いていない ' + session.menu.items[0].r.id);
        if (!/この条件で出せる主菜がありません/.test(mainMsg())) bad.push('照合: 主菜の枠の知らせ: ' + mainMsg());
        if (!/外しました/.test(((document.querySelector('#toast-root') || {}).textContent || '') + ((document.querySelector('.avoid-note') || {}).textContent || ''))) bad.push('照合: 外したことを知らせていない');   // 決める段では段の上の知らせ（モニター第3回c: お知らせと2回出さない）
        if (!document.querySelector('[data-act="decide"][disabled]')) bad.push('照合: 主菜がないのに決められる');
        // 同じ条件で: まるごと入れ替え・気分・品数・冷蔵庫から・かえる・保存献立
        click('new-menu'); left('まるごと入れ替え');
        for (const k of ['quick', 'easy', 'fish', 'meat', 'okayu', 'bento', 'all']){ click('mood', { k }); left('気分 ' + k); }
        for (const v of ['2', '4', '3']){ click('count', { v }); render(); left('品数 ' + v); }
        const uf = document.createElement('input'); uf.type = 'checkbox'; uf.dataset.act = 'use-fridge'; document.body.appendChild(uf); uf.click(); uf.remove(); left('冷蔵庫から');
        for (let i = 0; i < session.menu.items.length; i++){ click('reroll', { i: String(i) }); left('かえる slot' + i); }
        S.settings.allergens = []; save(); session.menu = null; ensureMenu(); saveMenu(); const sm = S.savedMenus[0];
        S.settings.allergens = [...ALG_ALL]; save(); reconcileMenu(); applySavedMenu(sm.id); left('保存献立');   // 設定の画面と同じく照合してから（保存献立は使えなければ今日の献立を変えない）
        // 1週間プラン: 作り直しても当たる主菜で埋めない（作ってあったプランの当たる日は「作らない日」）
        S.settings.allergens = []; makeWeek(); S.settings.allergens = [...ALG_ALL]; save(); refreshWeek(); makeWeek();
        S.week.days.filter(x => !x.skip && byId(x.id) && isAvoided(byId(x.id))).forEach(x => bad.push('1週間プラン ' + x.d + ' ' + x.id));
        S.week = null; makeWeek(); if (S.week && S.week.days.some(x => !x.skip && isAvoided(byId(x.id)))) bad.push('1週間プラン: 当たる主菜でプランを作った');
        // (b) 替わりがない（候補の関数が null）とき: アレルゲン・家族のアレルギー・苦手・品薄のどれでも枠を空ける（主菜も）
        const keyOfDish = r => (r.items.find(i => !i.opt && FAMILY[i.key]) || r.items.find(i => !i.opt) || {}).key;
        const cases = [
            ['アレルゲン', r => { const a = ALG_ALL.find(id => { S.settings.allergens = [id]; const h = allergyConflict(r); S.settings.allergens = []; return h; }); if (!a) return false; S.settings.allergens = [a]; return isAvoided(r); }],
            ['家族のアレルギー', r => { const k = keyOfDish(r); if (!k) return false; S.family = [{ id: 'a', name: '長女', role: 'child', avoid: [], allergy: [k], mild: false }]; return isAvoided(r); }],
            ['苦手', r => { const k = keyOfDish(r); if (!k) return false; S.settings.avoid = [k]; S.settings.avoidSwap = false; return isAvoided(r); }],
            ['品薄', r => { const k = keyOfDish(r); if (!k) return false; S.settings.scarce = [k]; return isAvoided(r); }],
        ];
        let n = 0;
        for (const [tag, set] of cases) for (let slot = 0; slot < 3; slot++) for (let rep = 0; rep < 3; rep++){
            reset(); session.menu = null; ensureMenu(); const m = session.menu, it = m.items[slot]; if (!it || !it.r) continue;
            if (!set(it.r)){ reset(); continue; } save(); n++;
            // 設定変更の照合（家族のアレルギーの追加・苦手・品薄・アレルゲンのどれも、ここを通る）
            noRepl(() => reconcileMenu()); left('照合・替わりなし ' + tag);
            // 決めた献立にあとから当たったときの「かえる」（替わりがない）
            reset(); session.menu = null; ensureMenu(); const m2 = session.menu, it2 = m2.items[slot]; if (!it2.r) continue;
            S.cook = {d: TODAY, ids: menuIds(), slots: m2.items.filter(x => x.r).map(x => x.slot)};
            if (!set(it2.r)) continue; save(); render();
            noRepl(() => click('reroll', { i: String(slot), ok: '1' }));   // ok: 決めた一膳でも確かめずに（案2の確かめるシートを飛ばす）
            if (it2.r && slotOut(it2.r)) bad.push('かえる・替わりなし ' + tag + ' slot' + slot + ' 残った ' + it2.r.id);
        }
        // (c) 案内を出したあとに当たるようになった「1週間プランの主菜を献立にする」・ひとひねり案の「主菜にする」
        reset(); session.menu = null; ensureMenu(); makeWeek(); const wt = weekToday();
        if (wt){ const a = ALG_ALL.find(id => { S.settings.allergens = [id]; const h = isAvoided(wt); S.settings.allergens = []; return h; }); if (a){ S.settings.allergens = [a]; save(); click('use-plan'); if (session.menu.items[0].r && session.menu.items[0].r.id === wt.id) bad.push('プランの主菜を献立に: 当たる主菜を入れた ' + wt.id); } else note.push('プランの主菜に当たるアレルゲンなし'); }
        reset(); S.week = null; session.menu = null; ensureMenu();
        let tw = null, ta = null; for (let k = 0; k < 20 && !ta; k++){ tw = suggestTwist(); ta = tw && ALG_ALL.find(id => { S.settings.allergens = [id]; const h = twistAvoided(tw); S.settings.allergens = []; return h; }); }
        if (ta){ session.twist = tw; S.settings.allergens = [ta]; save(); reconcileMenu(); if (session.twist && twistAvoided(session.twist)) bad.push('ひとひねり案: 当たる案が残った ' + tw.id);
            session.twist = tw; click('twist-main'); const r0 = session.menu.items[0].r; if (r0 && r0.isTwist && twistAvoided(r0)) bad.push('ひとひねり案を主菜に: 当たる案を入れた ' + tw.id); }
        else note.push('ひとひねり案: 当たる案が作れなかった');
        // (e) 案2: 明日の一膳を見たあとにアレルギー・苦手を足しても、明日の案に当たる料理を残さない（当たる枠だけ選び直す。出せる主菜がなければ空けて知らせる）
        reset(); session.menu = null; ensureMenu(); render(); if (S.day) delete S.day[addDays(TODAY, 1)];
        const t1 = tomorrowDraft(); const tm = byId(t1[0].id);
        const ta2 = ALG_ALL.find(id => { S.settings.allergens = [id]; const h = allergyConflict(tm); S.settings.allergens = []; return h; });
        if (ta2){
            const hitIds = t1.filter(x => { S.settings.allergens = [ta2]; const h = isAvoided(byId(x.id)); S.settings.allergens = []; return h; }).map(x => x.id);
            S.settings.allergens = [ta2]; save(); reconcileMenu();
            const t2 = tomorrowDraft(); t2.forEach(x => { if (slotOut(byId(x.id))) bad.push('明日の一膳 ' + ta2 + ' ' + x.id); });
            t1.forEach(x => { if (!hitIds.includes(x.id) && !t2.some(y => y.id === x.id)) bad.push('明日の一膳: 当たっていない料理まで替えた ' + x.id); });
            sheet = {kind: 'tomorrow'}; renderSheet(); const st = (document.querySelector('#sheet-root') || document.body).textContent;
            t2.forEach(x => { if (!st.includes(byId(x.id).name)) bad.push('明日の一膳の画面に出ていない ' + x.id); }); closeSheet();
        } else note.push('明日の主菜に当たるアレルゲンなし');
        S.settings.allergens = [...ALG_ALL]; save(); reconcileMenu(); const t3 = tomorrowDraft();
        t3.forEach(x => { if (slotOut(byId(x.id))) bad.push('明日の一膳(全アレルゲン) ' + x.id); });
        if (t3.length && t3[0].slot === '主菜') bad.push('明日の一膳(全アレルゲン): 主菜が空いていない');
        sheet = {kind: 'tomorrow'}; renderSheet(); if (!/この条件で出せる主菜がありません/.test(document.body.textContent)) bad.push('明日の一膳: 主菜がないことを知らせていない'); closeSheet();
        // (d) 国の切り替え: 切り替えた国の献立にも、当たる料理を出さない（出せる主菜がない国では主菜の枠を空ける）
        reset(); S.settings.allergens = [...ALG_ALL]; save();
        for (const cc of ['US', 'KR', 'JP']){ await setCountry(cc); session.menu = null; setTab('today'); render(); left('国 ' + cc); }
        reset();
        return { bad, note, n };
    });
    ok(!r.bad.length, '5c) 替わりがないときも当たる料理を残さない: ' + r.bad.slice(0, 6).join(' ; '));
    ok(r.n >= 20, '5c) 替わりなしの組み合わせを試した: ' + r.n);
    console.log('5c) 替わりがないとき:', r.n, '通り', r.note.join(' / '));
    await ctx.close();
}

// 保存献立・決定済み・お気に入り・世界のレシピ・詳細の表示・設定カード
{
    const { ctx, p } = await open('JP', { dishCount: 3 });
    const r = await p.evaluate(async () => {
        const out = {};
        S.settings.allergens = []; session.menu = null; ensureMenu();
        const egg = RECIPES.find(r => r.type === '主菜' && r.items.some(i => i.key === '卵') && !isAvoided(r));
        // 保存した献立に、あとから卵のアレルギー: 警告が出て、今日にするときは卵の枠だけ選び直す
        session.menu.items[0].r = egg; const other = session.menu.items.slice(1).map(x => x.r && x.r.id);
        saveMenu(); const sm = S.savedMenus[0];
        S.settings.allergens = ['egg']; save(); setTab('log'); render();
        out.savedWarn = /アレルゲン/.test(document.querySelector('#saved-menus').textContent) && /選び直します/.test(document.querySelector('#saved-menus').textContent);
        applySavedMenu(sm.id); out.savedApplyBad = session.menu.items.filter(x => x.r && allergyConflict(x.r)).length;
        out.savedOthersKept = session.menu.items.slice(1).every((x, i) => !other[i] || x.r.id === other[i] || allergyConflict(byId(other[i])));
        // 決めた献立に、あとから該当が残ったら警告
        S.settings.allergens = []; S.cook = {d: TODAY, ids: [egg.id], slots: ['主菜']}; S.settings.allergens = ['egg'];
        out.cookWarn = /cook-warn/.test(cookWarnHtml());
        S.cook = null;
        // お気に入りの印
        S.favs = [egg.id]; setTab('log'); render(); out.favBadge = [...document.querySelectorAll('.badge.allergy')].length > 0;
        // 詳細の表示（アレルゲンの料理でも、お気に入りなどから開けて、含まれるアレルゲンを示す）
        modalId = egg.id; renderModal(); const box = document.querySelector('#allergen-box');
        out.detail = box ? box.innerText : ''; out.detailMine = box ? (box.querySelector('li.mine') || {}).innerText || '' : '';
        closeModal();
        // 詳細は、選んでいなくても出る（全料理）
        S.settings.allergens = []; const sample = RECIPES.filter((r, i) => i % 9 === 0); let miss = 0;
        for (const r of sample){ modalId = r.id; renderModal(); if (!document.querySelector('#allergen-box')) miss++; }
        out.detailMissing = miss; out.detailN = sample.length; closeModal();
        return out;
    });
    ok(r.savedWarn, '保存した献立に警告が出る'); ok(r.savedApplyBad === 0, '保存献立を今日にしても、アレルゲンの料理が残らない'); ok(r.savedOthersKept, '保存献立: 当たっていない枠は動かない');
    ok(r.cookWarn, '決めた献立に、あとから該当が残ったら警告'); ok(r.favBadge, 'お気に入りに、アレルゲンの印');
    ok(/卵/.test(r.detail) && /原材料表示を必ず確認/.test(r.detail), '詳細: 卵と注意書き: ' + r.detail.slice(0, 80)); ok(/⚠/.test(r.detailMine), '詳細: 選んだアレルゲンに⚠');
    ok(r.detailMissing === 0, '全料理の詳細に「この料理に含まれる主なアレルゲン」（' + r.detailN + '品）');
    await ctx.close();
}
// 世界のレシピ・設定カード・ひとひねり・並び
for (const [cc, style, n] of [['JP', 'jp', 29], ['US', 'us', 9], ['FR', 'eu', 14], ['IN', 'eu', 14], ['MX', 'us', 9]]){
    const { ctx, p } = await open(cc);
    await p.evaluate(() => { setTab('settings'); });
    const r = await p.evaluate(() => {
        const card = document.querySelector('#allergy-card'); if (!card) return null;
        const chips = [...card.querySelectorAll('.chip[data-act="alg-toggle"]')];
        const main = [...card.querySelectorAll('.avoid-grp .chip[data-act="alg-toggle"]')];
        return { title: card.querySelector('.set-title').innerText, disclaimer: t('アプリの判定は参考です。重度のアレルギーの方は、必ず原材料表示・医師の指示に従ってください。'), chips: chips.length, main: main.length, text: card.innerText, order: main.map(c => c.dataset.v).join(), style: algStyle(), first: card.getBoundingClientRect().top < document.querySelector('.set-group:not(.allergy-card)').getBoundingClientRect().top };
    });
    ok(!!r, cc + ' 設定に「アレルギー対策」カード');
    if (r){
        ok(r.style === style, cc + ' 並び: ' + r.style); ok(r.main === n, cc + ' 主な品目の数 ' + n + ': ' + r.main); ok(r.chips === 38 || r.chips > r.main, cc + ' ほかのアレルゲンも選べる: ' + r.chips);
        ok(r.text.includes(r.disclaimer) && (/[\u3040-\u30ff]/.test(r.disclaimer) === (cc === 'JP')), cc + ' 免責: ' + r.disclaimer); ok(r.first, cc + ' カードがいちばん上');
        if (style === 'jp') ok(r.order.startsWith('shrimp,cashew,crab,walnut,wheat,buckwheat,egg,milk,peanut,abalone,squid'), 'JP の並び: ' + r.order);
        if (style === 'eu') ok(r.order.startsWith('gluten,crustacean,egg,fish,peanut,soy,milk,treenut,celery,mustard,sesame,sulphite,lupin,mollusc'), 'EU の並び: ' + r.order);
        if (style === 'us') ok(r.order === 'milk,egg,fish,crustacean,treenut,peanut,wheat,soy,sesame', 'US の並び: ' + r.order);
    }
    // チップを押す: 設定に入り、献立の当たった枠だけ変わる
    const before = await p.evaluate(() => { session.menu = null; ensureMenu(); return session.menu.items.map(x => x.r && x.r.id); });
    const target = await p.evaluate(() => { const r = session.menu.items[0].r; for (const id of ['egg', 'milk', 'wheat', 'pork', 'chicken', 'beef', 'fish', 'soy', 'shrimp']){ S.settings.allergens = [id]; if (allergyConflict(r)){ S.settings.allergens = []; return id; } } S.settings.allergens = []; return null; });
    await p.evaluate(() => { S.settings.allergens = []; save(); setTab('settings'); });
    if (target){
        // その国の主なアレルゲンでないもの（米国の豚肉・欧州の小麦など）は「ほかのアレルゲン」に畳まれている。人と同じく、開いてから押す
        if (await p.evaluate(id => { const d = document.querySelector(`#allergy-card .chip[data-v="${id}"]`).closest('details'); return !!d && !d.open; }, target)){
            await p.click('#allergy-card details.alg-more > summary'); await p.waitForTimeout(100);
        }
        await p.click(`#allergy-card .chip[data-v="${target}"]`); await p.waitForTimeout(200);
        const after = await p.evaluate(() => ({ al: S.settings.allergens, ids: session.menu.items.map(x => x.r && x.r.id), bad: session.menu.items.filter(x => x.r && allergyConflict(x.r)).length, pressed: document.querySelector(`#allergy-card .chip[aria-pressed="true"]`) !== null }));
        ok(JSON.stringify(after.al) === JSON.stringify([target]) && after.bad === 0 && after.pressed, cc + ' チップで選ぶ: ' + JSON.stringify(after.al));
        ok(after.ids[0] !== before[0], cc + ' 当たった主菜は選び直される');
    }
    await ctx.close();
}
// おかゆ（具を変えた9品）: 卵・さけ・小麦などを選んだら、その具のおかゆは提案にも献立にも出ない
{
    const { ctx, p } = await open('JP');
    const r = await p.evaluate(() => {
        const out = { bad: [], n: 0, shown: 0 };
        for (const id of ['egg', 'salmon', 'sesame', 'soy', 'chicken', 'milk', 'wheat']){
            S.settings.allergens = [id]; S.settings.allergenFerm = true;
            for (let k = 0; k < 4; k++){ generateTwists({baseId: 'okayu', count: 9}).forEach(tw => { out.n++; if (allergyConflict(tw)) out.bad.push(id + ' ' + tw.id); }); }
            for (let k = 0; k < 6; k++){ session.mood = 'okayu'; session.menu = null; ensureMenu(); session.menu.items.forEach(x => { if (x.r && allergyConflict(x.r)) out.bad.push(id + ' menu ' + x.r.id); }); }
            OKAYU_IDS.forEach(oid => { const rr = RECIPES.find(x => x.id === oid); if (rr && !allergyConflict(rr)) out.shown++; });
        }
        session.mood = null; S.settings.allergens = [];
        return out;
    });
    ok(!r.bad.length, 'おかゆ: アレルゲンの具が出ない: ' + r.bad.slice(0, 3).join(',')); ok(r.shown > 0, 'おかゆ: 当たらない具は残る');
    await ctx.close();
}
// 世界のレシピ: アレルゲンの料理は出さない
{
    const { ctx, p } = await open('JP');
    const r = await p.evaluate(async () => {
        await loadBrowse('FR'); S.settings.allergens = ['egg', 'milk']; save(); worldCC = 'FR'; setTab('world'); render();
        const names = [...document.querySelectorAll('#view .world-list .match')].length;
        const hidden = (document.querySelector('.alg-hidden') || {}).innerText || '';
        const leak = BROWSE.FR.filter(allergyConflict).filter(r => document.querySelector(`#view .match[data-id="${CSS.escape(r.id)}"]`)).length;
        return { names, hidden, leak };
    });
    ok(r.names > 0 && r.leak === 0, '世界のレシピ: アレルゲンの料理を出さない（出ている' + r.leak + '）'); ok(/⚠/.test(r.hidden), '世界のレシピ: 隠した品数を示す: ' + r.hidden);
    await ctx.close();
}
// 家族のアレルギー・今日食べる人との整合、データの検証
{
    const { ctx, p } = await open('JP', {}, { family: [{ id: 'a', name: '長女', role: 'child', avoid: ['卵'], allergy: ['卵'], mild: false }, { id: 'b', name: '父', role: 'adult', avoid: [], allergy: [], mild: false }], eaters: ['b'] });
    const r = await p.evaluate(() => {
        const egg = RECIPES.find(r => r.items.some(i => i.key === '卵'));
        const out = {};
        out.fatherOnly = isAvoidedCore(egg);   // 食べるのは父だけ: 卵の家族アレルギーは効かない
        S.eaters = null; out.all = isAvoidedCore(egg);   // 全員: 卵が出ない
        S.eaters = ['b']; S.settings.allergens = ['egg']; out.globalStill = isAvoidedCore(egg);   // 全員共通のアレルゲンは、食べる人に関係なく効く
        S.settings.allergens = ['xx', 'egg', 5, 'egg']; const n = normalizeState({ settings: { allergens: ['xx', 'egg', 5, 'egg'], allergenFerm: 'no' } }); out.norm = JSON.stringify(n.settings.allergens) + (n.settings.allergenFerm === undefined);
        out.ids = JSON.stringify(algIds());
        return out;
    });
    ok(r.fatherOnly === false && r.all === true, '今日食べる人: 家族のアレルギーは、食べる人に合わせて効く'); ok(r.globalStill === true, '全員共通のアレルゲンは、食べる人に関係なく効く');
    ok(r.norm === '["egg"]true' || r.norm === '["xx","egg"]true', '保存データの正規化: ' + r.norm); ok(r.ids === '["egg"]', '使えない id は無視: ' + r.ids);
    await ctx.close();
}
// モニター第3回 S5: 家族の1人に乳製品⚠のあと、手入力の大豆⚠を足す → すぐ照らし直す（再読み込みしなくても）。当たる料理があるあいだ「食べられるお膳です」と出さない
{
    const { ctx, p } = await open('JP', {}, { family: [{ id: 'a', name: '', role: 'adult', avoid: ['@dairy'], allergy: ['@dairy'], mild: false }] });
    const r = await p.evaluate(() => {
        const out = { left: [], label: [], tries: 0, warm: 0 };
        const m = famMembers()[0];
        for (let k = 0; k < 8; k++){
            m.avoid = ['@dairy']; m.allergy = ['@dairy']; session.menu = null; ensureMenu();
            const soy0 = session.menu.items.filter(x => x.r && algSelectedHits(x.r, ['soy']).length).length; if (!soy0) continue;
            out.tries++; session.menu.items.forEach(x => { if (x.r && isAvoidedCore(x.r)) out.warm++; });   // 乳製品だけの判定を一度使っておく（画面を描いたのと同じ状態）
            m.avoid.push('大豆'); m.allergy.push('大豆'); reconcileMenu();
            session.menu.items.forEach(x => { if (x.r && algSelectedHits(x.r).includes('soy')) out.left.push(x.r.name); });
            // 照らし直したあとに当たる料理を戻しても、「食べられるお膳です」は出さない
            const soyDish = RECIPES.find(r0 => r0.type === '汁物' && algSelectedHits(r0).includes('soy')); const i = session.menu.items.findIndex(x => x.slot === '汁物');
            if (soyDish && i >= 0){ const keep = session.menu.items[i].r; session.menu.items[i].r = soyDish; if (/食べられるお膳/.test(eatersLine())) out.label.push(soyDish.name); session.menu.items[i].r = keep; }
        }
        return out;
    });
    ok(r.tries > 0, 'S5 前提: 大豆を使う料理が献立にあった（' + r.tries + '回）');
    ok(!r.left.length, 'S5 家族に乳製品⚠のあと大豆⚠を足すと、すぐ照らし直す（残った料理: ' + r.left.slice(0, 3).join('、') + '）');
    ok(!r.label.length, 'S5 当たる料理があるあいだは「食べられるお膳です」と出さない: ' + r.label.slice(0, 2).join('、'));
    await ctx.close();
}
// モニター第3回 S6: えびアレルギーで「エビチリ（鶏むね肉で）」のように、外した食材の名前を先頭にした料理名を出さない（手順にも背わたを残さない）
{
    const { ctx, p } = await open('JP', { allergens: ['shrimp'] });
    const r = await p.evaluate(() => {
        const out = { bad: [], steps: [], n: 0, name: '' };
        const tw = buildTwist('a~ebichili~~~魚介:0'); out.name = tw ? tw.name : '';
        if (tw && tw.steps.some(s => /背わた/.test(s.t))) out.steps.push(tw.name);
        for (let k = 0; k < 6; k++) generateTwists({ level: 2, count: 30 }).concat(generateTwists({ baseId: 'ebichili', count: 6 })).forEach(x => { out.n++; if (/^(?:[^ ]+ )?(?:えび|エビ|海老)/.test(x.name)) out.bad.push(x.name); if (x.steps.some(s => /背わた/.test(s.t))) out.steps.push(x.name); });
        return out;
    });
    ok(!/^(?:えび|エビ|海老)/.test(r.name), 'S6 エビチリの主役を鶏むね肉にした名前は、えびで始めない: ' + r.name);
    ok(!r.bad.length, 'S6 えびアレルギーで、えびで始まる名前の案を出さない: ' + [...new Set(r.bad)].slice(0, 3).join('、'));
    ok(!r.steps.length, 'S6 置き換えた案の手順に「背わた」が残らない: ' + [...new Set(r.steps)].slice(0, 3).join('、'));
    await ctx.close();
}
// 安全第4回: 短い言い方が長い言葉の一部に当たる取り違え（ルピナス→なす・牛乳→牛（牛肉）・鱿鱼→鱼（魚）など）
//  (a) 決まった言葉が、別の食材のキーに読みかわらない（全か国の辞書と、日本語の画面でほかの国を使うときに足す日本の言い方の両方）
//  (b) 辞書全体を機械的に洗う: 苦手・アレルギーに入れうる言葉（チップ・アレルゲン・食材の表・各国の辞書）のうち、読みかえた食材がそのアレルゲンを含まない（見落とし）ものは、
//      調べて理由がわかっているもの（KNOWN）だけ
{
    const NOT = {'ルピナス': /^(?:なす|eggplant)$/, 'キャッサバ': /^(?:さば|mackerel)$/, 'マジパン': /^(?:食パン|bread)$/, 'ビーフン': /^(?:牛肉|beef)$/, 'たらばがに': /^(?:たら|fish|fish fillet|white fish)$/,
        'いかそうめん': /^(?:そうめん|wheat noodles|mianxian)$/, '鶏卵': /^(?:鶏肉|chicken)$/, '牛乳': /^(?:牛肉|beef|coconut milk)$/, '牛奶': /^(?:牛肉|beef|coconut milk)$/, 'ぎゅうにゅう': /^(?:牛肉|beef|coconut milk)$/,
        'ミルク': /^coconut milk$/, 'ライムギ': /^lime$/, 'たこ': /^taco shell$/, 'さば': /^cassava leaves$/, 'ぶり': /^pastry$/, '鱿鱼': /^fish$/, '鲍鱼': /^fish$/, '章鱼': /^fish$/, 'ข้าวสาลี': /^rice$/, 'ข้าวโอ๊ต': /^rice$/};
    const KNOWN = new Set(['いかそうめん', 'シーチキン', 'ココナッツ', 'ココナッツウォーター', 'ココナッツミルク', '若いココナッツの果肉', 'バターナッツかぼちゃ', '杏鮑菇', '蟹味菇', '魷魚', 'ปลาหมึก', '鸡子', 'ไข่ไก่', 'เต้าหู้ไข่',
        'दूधी', 'नारियल का दूध', 'नारियल दूध', 'جبنة بيضا', 'あいびき', '合いびき', '合いびき肉', 'ぴーなっつ', 'カシューナッツ', 'マカダミアナッツ', '땅콩', '아몬드', '三文鱼', '鲑鱼', '鲭鱼', '콩나물']);
    const all = [];
    for (const [cc, ui] of [['JP', 'ja'], ['JP', 'en'], ['TW', 'zh-Hant'], ['CN', 'zh-Hans'], ['KR', 'ko'], ['TH', 'th'], ['IN', 'hi'], ['EG', 'ar'], ['KR', 'ja'], ['CN', 'ja'], ['TW', 'ja'], ['TH', 'ja'], ['VN', 'ja'], ['US', 'ja'], ['FR', 'ja'], ['IT', 'ja'], ['ID', 'ja'], ['PH', 'ja']]){
        const { ctx, p } = await open(cc, { uiLang: ui });
        await p.waitForFunction(cc => currentCountry() === cc && (cc === 'JP' || !!PACK), cc);
        const r = await p.evaluate(([NOTs, KNOWN]) => {
            const bad = [], miss = [];
            Object.entries(NOTs).forEach(([w, src]) => { const c = canonOf(w); if (c && new RegExp(src).test(String(c))) bad.push(w + '→' + c); const f = avoidFamOf(w), FN = {'牛乳': 'beef', '牛奶': 'beef', 'ぎゅうにゅう': 'beef', '鶏卵': 'chicken', 'ビーフン': 'beef', '鱿鱼': 'fish', '鲍鱼': 'fish', '章鱼': 'fish'}; if (f && FN[w] === f) bad.push(w + '→なかま ' + f); });
            const words = new Set(), add = w => { w = String(w || '').replace(/[（(][^）)]*[）)]/g, '').trim(); if (w && w.length <= 20 && !/または|或|나 |이나 | or | หรือ |أو|या/.test(w) && !LATIN_RE.test(w.normalize('NFKC').toLowerCase())) words.add(w); };
            Object.values(ALG_DEF).forEach(d => ['re', 'eq'].forEach(k => { const src = d[k] ? (Array.isArray(d[k]) ? d[k].join('|') : d[k].source) : ''; src.split('|').forEach(t => { if (/^[ぁ-んァ-ヶー一-龠가-힣฀-๿ऀ-ॿ؀-ۿ]+$/.test(t)) add(t); }); }));
            Object.values(ALG_WORD).forEach(add); AVOID_QUICK.forEach(add); AVOID_CON.forEach(c => { conWords(c).forEach(add); c[0].forEach(add); }); CANON.forEach(([c, vs]) => vs.forEach(add));
            const cls = it => ALG_ALL.filter(id => algKind(id, it) === 1);
            words.forEach(w => { const c = canonOf(w); if (!c || KNOWN.includes(w)) return; const lab = PACK_NAMES[c] || c;
                const a = cls({name: w, label: w, key: w.toLowerCase(), en: ''}), k = cls({name: lab, label: lab, key: String(c).toLowerCase(), en: /[a-z]/.test(c) ? c : ''});
                const m = a.filter(z => !k.includes(z)); if (m.length) miss.push(w + '→' + c + '（' + m.join(',') + ' を見落とす）'); });
            return { bad, miss, n: words.size };
        }, [Object.fromEntries(Object.entries(NOT).map(([k, v]) => [k, v.source])), [...KNOWN]]);
        ok(!r.bad.length, `取り違え（${cc}/${ui}）: 別の食材に読みかえない: ` + r.bad.join('、'));
        ok(!r.miss.length, `辞書の機械チェック（${cc}/${ui}・${r.n}語）: 読みかえた食材でアレルゲンを見落とす言葉がない: ` + r.miss.slice(0, 6).join('、'));
        // モニター第3回c NEW1: 打ち込む経路（全員共通・家族のアレルギー・苦手・冷蔵庫・声・検索の候補はどれも extractIngredients）でも、同じ表で取り違えない
        const r2 = await p.evaluate(([NOTs, KNOWN]) => {
            const bad = [], miss = [];
            const ex = w => extractIngredients(w).map(o => ({o, c: canonOf(o)})).filter(x => x.c);
            Object.entries(NOTs).forEach(([w, src]) => ex(w).forEach(({c}) => { if (new RegExp(src).test(String(c))) bad.push(w + '→' + c); }));
            ['牛奶', 'ビーフン', 'ルピナス', 'キャッサバ'].forEach(w => ex(w).forEach(({c}) => { if (/^(?:牛肉|beef|なす|eggplant|さば|mackerel)$/.test(String(c))) bad.push(w + '→' + c); }));
            const words = new Set(), add = w => { w = String(w || '').replace(/[（(][^）)]*[）)]/g, '').trim(); if (w && w.length <= 20 && !/または|或|나 |이나 | or | หรือ |أو|या/.test(w) && !LATIN_RE.test(w.normalize('NFKC').toLowerCase())) words.add(w); };
            Object.values(ALG_DEF).forEach(d => ['re', 'eq'].forEach(k => { const src = d[k] ? (Array.isArray(d[k]) ? d[k].join('|') : d[k].source) : ''; src.split('|').forEach(t => { if (/^[ぁ-んァ-ヶー一-龠가-힣฀-๿ऀ-ॿ؀-ۿ]+$/.test(t)) add(t); }); }));
            Object.values(ALG_WORD).forEach(add); AVOID_QUICK.forEach(add); AVOID_CON.forEach(c => { conWords(c).forEach(add); c[0].forEach(add); }); CANON.forEach(([c, vs]) => vs.forEach(add));
            const cls = it => ALG_ALL.filter(id => algKind(id, it) === 1);
            words.forEach(w => { if (KNOWN.includes(w)) return; const a = cls({name: w, label: w, key: w.toLowerCase(), en: ''}); if (!a.length) return;
                const outs = extractIngredients(w); if (!outs.length) return;
                // 打った言葉が分かれたときは、分かれたどれかがそのアレルゲンに当たればよい（取り違えて別の食材だけになるのがだめ）
                const got = new Set(outs.flatMap(o => { const c = canonOf(o), lab = c ? (PACK_NAMES[c] || c) : o; return cls({name: lab, label: lab, key: String(c || o).toLowerCase(), en: /[a-z]/.test(c || '') ? c : ''}).concat(c ? [] : cls({name: o, label: o, key: String(o).toLowerCase(), en: ''})); }));
                const m = a.filter(z => !got.has(z)); if (m.length) miss.push(w + '→' + outs.join('+') + '（' + m.join(',') + ' を見落とす）'); });
            return { bad, miss, n: words.size };
        }, [Object.fromEntries(Object.entries(NOT).map(([k, v]) => [k, v.source])), [...KNOWN]]);
        ok(!r2.bad.length, `NEW1 打ち込む経路の取り違え（${cc}/${ui}）: ` + r2.bad.join('、'));
        ok(!r2.miss.length, `NEW1 打ち込む経路の辞書の機械チェック（${cc}/${ui}・${r2.n}語）: ` + r2.miss.slice(0, 6).join('、'));
        await ctx.close();
    }
    // モニター第3回c NEW1: 画面の入力欄から（中国語の家族の欄に「牛奶」→ ⚠ → 乳として効く。日本語の自分の欄に「ビーフン」「ルピナス」→ 牛肉・なすにしない）
    {
        const { ctx, p } = await open('JP', { uiLang: 'zh-Hans' }, { family: [{ id: 'a', name: '', role: 'adult', avoid: [], allergy: [], mild: false }] });
        const r = await p.evaluate(async () => {
            setTab('settings'); session.famOpen = 'a'; render(); document.querySelectorAll('[data-fm] details').forEach(d => d.open = true);
            const f = document.querySelector('[data-form="fam-add-avoid"]'); f.querySelector('input').value = '牛奶'; f.requestSubmit(); await new Promise(r => setTimeout(r, 300));
            const toastText = (document.querySelector('#toast-root') || {}).innerText || '';
            document.querySelectorAll('[data-fm] details').forEach(d => d.open = true);
            const chip = document.querySelector('[data-fm] [data-act=fam-allergy]'); const chipText = chip ? chip.innerText : ''; if (chip) chip.click(); await new Promise(r => setTimeout(r, 300));
            const m = famMembers()[0];
            return { toastText, chipText, allergy: m.allergy, eff: algIdsEff(), dairy: RECIPES.filter(r => r.items.some(i => i.key === '牛乳') && !isAvoided(r)).map(r => r.id).slice(0, 3) };
        });
        ok(!/beef/i.test(r.toastText) && !/牛肉/.test(r.chipText), 'NEW1 中国語の家族の欄の「牛奶」を牛肉（beef）にしない: ' + JSON.stringify(r));
        ok(r.eff.includes('milk') && !r.eff.includes('beef'), 'NEW1 「牛奶」の ⚠ を押すと乳として効く: ' + JSON.stringify(r.eff));
        ok(!r.dairy.length, 'NEW1 「牛奶」の ⚠ で牛乳を使う料理を出さない: ' + r.dairy.join(','));
        await ctx.close();
    }
    for (const [w, bad] of [['ビーフン', '牛肉'], ['ルピナス', 'なす'], ['キャッサバ', 'さば']]){
        const { ctx, p } = await open('JP');
        const r = await p.evaluate(async w => { setTab('settings'); render(); document.querySelectorAll('#view details').forEach(d => d.open = true);
            const inp = document.getElementById('avoid-input'); inp.value = w; inp.closest('form').requestSubmit(); await new Promise(r => setTimeout(r, 200));
            return { avoid: S.settings.avoid.map(keyOf), toast: (document.querySelector('#toast-root') || {}).innerText || '' }; }, w);
        ok(!r.avoid.includes(bad), `NEW1 自分の苦手の欄の「${w}」を${bad}にしない: ` + JSON.stringify(r));
        await ctx.close();
    }
    // 苦手に「ルピナス」→ なすの料理を外さない。家族のアレルギー「ルピナス」はルピナスとして効き、なすの料理は外さない
    const { ctx, p } = await open('JP', { avoid: ['ルピナス'] }, { family: [{ id: 'a', name: '', role: 'adult', avoid: ['ルピナス'], allergy: ['ルピナス'], mild: false }] });
    const r = await p.evaluate(() => ({ nasu: RECIPES.filter(r => r.items.some(i => i.key === 'なす') && isAvoided(r)).map(r => r.name), lupin: algIdsEff().includes('lupin'), name: avoidName('ルピナス') }));
    ok(!r.nasu.length, '苦手・家族のアレルギーの「ルピナス」で、なすの料理を外さない: ' + r.nasu.slice(0, 3).join('、'));
    ok(r.lupin, '家族のアレルギーの「ルピナス」はルピナス（lupin）として効く');
    await ctx.close();
}
// 安全第4回: 判定の結果を覚えておく所（ラクの日・お弁当の候補・世界の料理）の鍵に、家族の苦手・辛さなども入っている（入れないと、家族の苦手を足しても前の候補が残る）
{
    const { ctx, p } = await open('JP');
    const r = await p.evaluate(() => {
        const out = [];
        const same = (name, f, clear) => { const a = JSON.stringify(f(), (k, v) => v instanceof Set ? [...v].sort() : v); clear(); const b0 = JSON.stringify(f(), (k, v) => v instanceof Set ? [...v].sort() : v); if (a !== b0) out.push(name + ': ' + a.slice(0, 60) + ' ≠ ' + b0.slice(0, 60)); };
        const ez = () => easyInfo('主菜'), bt = () => bentoCount('主菜'), clr = () => { easyMemo.clear(); bentoMemo.clear(); };
        ez(); bt();
        S.family = [{ id: 'a', name: '', role: 'adult', avoid: ['@chicken', '@pork', '@beef'], allergy: [], mild: false }, { id: 'b', name: '', role: 'child', avoid: [], allergy: [], mild: true }]; S.eaters = null;
        same('家族の苦手を足したあとのラクの日の候補', ez, clr); same('家族の苦手を足したあとのお弁当の候補の数', bt, clr);
        const list = RECIPES, wl = () => { const w = worldLists(list); return { bad: [...w.bad].map(r => r.id).sort(), alg: [...w.alg].map(r => r.id).sort() }; };
        wl(); S.family[0].mild = true;   // 2人とも辛いのが苦手（allMild）になると、少し辛い料理も出さない
        same('全員が辛いのが苦手になったあとの世界の料理', wl, () => { worldMemo = null; });
        ez(); S.family[0].avoid = ['@fish']; same('家族の苦手を替えたあとのラクの日の候補', ez, clr);
        return out;
    });
    ok(!r.length, '判定を覚えておく所の鍵に家族の苦手・辛さが入っている: ' + r.join(' | '));
    await ctx.close();
}
// 安全第4回b N1: 商品によって原材料がちがう調味料（オイスターソース・ソース・コンソメ・顆粒だし・ルウ・たれなど）を、小麦・大豆・乳・卵・ごま・魚の判定にそろえる
//  （ウスターソース・中濃ソース・コンソメの小麦は、前から「よく含まれる」= 2 で料理を出さない。安全側なのでそのまま）
//  判定の表（どれも、選んだアレルゲンに当たる「種類」= 1 その食材 / 2 よく含まれる加工品・調味料（料理を出さない） / 3 しょうゆ・みそなどの発酵調味料（設定のスイッチに従う） / 4 入っていることがある（料理は出すが袋の表示を確認と出す））
{
    const TABLE = [
        ['オイスターソース', 'wheat', 2], ['オイスターソース', 'soy', 3], ['Oyster sauce', 'wheat', 2], ['Oyster sauce', 'soy', 3],
        ['焼肉のたれ', 'wheat', 3], ['焼肉のたれ', 'soy', 3], ['焼肉のたれ', 'sesame', 4], ['コチュジャン', 'wheat', 2], ['甜麺醤', 'wheat', 2], ['甜麺醤', 'soy', 3],
        ['豆板醤', 'soy', 4], ['豆板醤', 'wheat', 4], ['ウスターソース', 'wheat', 2], ['ウスターソース', 'soy', 4], ['中濃ソース', 'wheat', 2], ['中濃ソース', 'soy', 4], ['とんかつソース', 'soy', 4],
        ['Worcestershire sauce', 'wheat', 4], ['コンソメ', 'wheat', 2], ['コンソメ', 'milk', 4], ['コンソメ', 'soy', 4], ['Bouillon cube', 'wheat', 4],
        ['鶏ガラスープの素', 'wheat', 4], ['鶏ガラスープの素', 'milk', 4], ['鶏ガラスープの素', 'soy', 4], ['鶏ガラスープの素', 'sesame', 4],
        ['和風だしの素', 'wheat', 4], ['和風だしの素', 'soy', 4], ['カレールウ', 'soy', 4], ['めんつゆ', 'fish', 2], ['ポン酢', 'fish', 4],
    ];
    const { ctx, p } = await open('JP');
    const r = await p.evaluate(T => {
        const mk = n => { const j = /[぀-ヿ㐀-鿿]/.test(n); const it = parseIng(n); if (!j){ it.en = n; it.key = n.toLowerCase(); } return it; };
        return T.filter(([n, id, k]) => algKind(id, mk(n)) !== k).map(([n, id, k]) => n + '/' + id + ' = ' + algKind(id, mk(n)) + '（' + k + ' のはず）');
    }, TABLE);
    ok(!r.length, 'N1 調味料の判定の表: ' + r.join('、'));
    // ケチャップ・マヨネーズの大豆（大豆油は表示の対象外）・みりん・酢は当てない（外しすぎない）
    const r2 = await p.evaluate(() => { const mk = n => parseIng(n); return [['ケチャップ', ['wheat', 'soy', 'milk', 'egg']], ['みりん', ['wheat', 'soy']], ['酢', ['wheat', 'soy']], ['マヨネーズ', ['soy', 'wheat']]].flatMap(([n, ids]) => ids.filter(id => algKind(id, mk(n))).map(id => n + '/' + id)); });
    ok(!r2.length, 'N1 当てない調味料: ' + r2.join('、'));
    await ctx.close();
    // ガパオライス（醤油を使わず、オイスターソース）: 小麦・大豆のアレルギーで出さない。家族（乳製品＋大豆）でも出さない
    for (const [settings, store, label] of [[{ allergens: ['wheat', 'soy'] }, {}, '全員共通 小麦・大豆'], [{}, { family: [{ id: 'a', name: '次男', role: 'child', avoid: ['@dairy', '大豆'], allergy: ['@dairy', '大豆'], mild: false }] }, '家族 乳製品＋大豆']]){
        const { ctx, p } = await open('JP', settings, store);
        const g = await p.evaluate(() => ({ av: isAvoidedCore(byId('gapao')), hits: algSelectedHits(byId('gapao')) }));
        ok(g.av, `N1 ガパオライス（オイスターソース）は ${label} で出さない: ` + JSON.stringify(g));
        await ctx.close();
    }
}
// 安全第4回b N2: 「入っていることがある」加工品（ワンタンの皮の卵など）を使う料理: カードに「袋の表示を確認」の印。「食べられるお膳です」と言い切らない
{
    const { ctx, p } = await open('JP', {}, { family: [{ id: 'a', name: '息子', role: 'child', avoid: ['@dairy', '@egg'], allergy: ['@dairy', '@egg'], mild: false }] });
    const r = await p.evaluate(() => {
        setTab('today'); const m = session.menu; const i = m.items.findIndex(x => x.slot === '汁物'); if (i < 0) return { skip: true };
        m.items[i].r = byId('wantansoup'); render();
        const sp = [...document.querySelectorAll('.tray .spot')].find(s => /ワンタン/.test(s.innerText));
        return { aria: sp && sp.querySelector('.alg-tag') ? sp.querySelector('.alg-tag').getAttribute('aria-label') || '' : '', tag: sp && sp.querySelector('.alg-tag') ? sp.querySelector('.alg-tag').innerText : '', line: eatersLine(), may: algSelectedHits(byId('wantansoup')) };
    });
    ok(!r.skip, 'N2 前提: 汁ものの枠がある');
    ok(/袋の表示/.test(r.tag) && /卵/.test(r.tag + r.aria), 'N2 ワンタンスープのカードに「⚠ 袋の表示を確認: 卵（ワンタンの皮）」: ' + r.tag);
    ok(!/^息子も食べられるお膳です$/.test(r.line.split('\n')[0]) && /袋の表示/.test(r.line), 'N2 「食べられるお膳です」と言い切らない: ' + r.line);
    await ctx.close();
}
// モニター第3回c NEW2: 入っていることがある加工品・調味料を洗い直す（料理を出さない = 2 / 醤油と同じ = 3 / 袋の表示を確認 = 4）
{
    const TABLE = [
        ['白菜キムチ', 'shrimp', 4], ['白菜キムチ', 'crab', 4], ['白菜キムチ', 'crustacean', 4], ['Kimchi', 'shrimp', 4], ['ちりめんじゃこ', 'shrimp', 4], ['ちりめんじゃこ', 'crab', 4], ['しらす', 'crustacean', 4],
        ['納豆付属のたれ', 'wheat', 3], ['納豆付属のたれ', 'gluten', 3], ['塩昆布', 'wheat', 3], ['塩昆布', 'soy', 3], ['コチュジャン', 'soy', 3],
        ['お好みソース', 'soy', 4], ['お好みソース', 'wheat', 2], ['お好みソース/マヨネーズ/かつお節/青のり', 'soy', 4], ['ウスターソース', 'soy', 4],
        ['お好みソース', 'apple', 4], ['お好みソース', 'peach', 4], ['とんかつソース', 'apple', 4], ['中濃ソース', 'peach', 4], ['ウスターソース', 'apple', 4], ['カレールウ', 'apple', 4], ['カレールウ', 'peach', 4], ['焼肉のたれ', 'apple', 4],
        ['だし', 'fish', 2], ['（天つゆ）だし', 'fish', 2], ['だし汁', 'fish', 2], ['Dashi', 'fish', 2], ['ラー油', 'sesame', 2], ['トムヤムペースト', 'shrimp', 2],
        ['ハム', 'milk', 4], ['ハム', 'soy', 4], ['ウインナー', 'wheat', 4], ['ちくわ', 'wheat', 4], ['ちくわ', 'soy', 4], ['天かす', 'egg', 4], ['パン粉', 'milk', 4],
        // 当てない（外しすぎない）
        ['昆布だし', 'fish', 0], ['顆粒昆布だし', 'fish', 0], ['Kombu dashi', 'fish', 0], ['ちりめんキャベツ', 'shrimp', 0], ['ケチャップ', 'apple', 0], ['マヨネーズ', 'soy', 0], ['だし巻き卵', 'fish', 0],
    ];
    const { ctx, p } = await open('JP');
    const r = await p.evaluate(T => {
        const mk = n => { const j = /[぀-ヿ㐀-鿿]/.test(n); const it = parseIng(n); if (!j){ it.en = n; it.key = n.toLowerCase(); } return it; };
        return T.filter(([n, id, k]) => algKind(id, mk(n)) !== k).map(([n, id, k]) => n + '/' + id + ' = ' + algKind(id, mk(n)) + '（' + k + ' のはず）');
    }, TABLE);
    ok(!r.length, 'NEW2 加工品・調味料の判定の表: ' + r.join('、'));
    await ctx.close();
    // 料理で: えび・かにで豚キムチ炒め・じゃこの炒めに「袋の表示を確認（白菜キムチ）」。小麦で ねぎ納豆・塩昆布和えを出さない（醤油と同じ）。大豆でお好み焼きに印。りんごでとんかつ・カレーに印
    const CASES2 = [[['shrimp', 'crab'], 'butakimu', 'may', /白菜キムチ/], [['shrimp', 'crab'], 'jakopiman', 'may', /じゃこ/], [['wheat', 'milk', 'egg'], 'natto', 'out'], [['wheat', 'soy'], 'shiokombu', 'out'],
        [['soy'], 'okonomi', 'may', /お好みソース/], [['apple', 'peach'], 'tonkatsu', 'may', /ソース/], [['apple'], 'curry', 'may', /カレールウ/]];
    for (const [ids, id, want, re] of CASES2){
        const { ctx, p } = await open('JP', { allergens: ids });
        const g = await p.evaluate(id => { const r = byId(id); return { av: isAvoided(r), may: algMayHits(r), tag: (d => (d.innerHTML = algTagHtml(r), d.innerText))(document.createElement('div')) }; }, id);
        if (want === 'out') ok(g.av, `NEW2 ${ids.join('・')} で ${id} を出さない: ` + JSON.stringify(g));
        else ok(!g.av && g.may.length && re.test(g.tag) && /袋の表示を確認/.test(g.tag), `NEW2 ${ids.join('・')} で ${id} のカードに「⚠ …（${re.source}の袋の表示を確認）」: ` + JSON.stringify(g));
        await ctx.close();
    }
    // 魚のアレルギー（家族）: だしの料理は昆布だしにして出す（調味料・作り方・カードの一言・詳細の一言）。めんつゆ・かつお節の料理は出さない。英語の画面でも同じ
    for (const ui of ['ja', 'en']){
        const { ctx, p } = await open('JP', { uiLang: ui }, { family: [{ id: 'a', name: '', role: 'adult', avoid: ['@fish'], allergy: ['@fish'], mild: false }] });
        const g = await p.evaluate(() => { const r = byId('nikujaga'), m = byId('misoshiru'); const d = document.createElement('div'); d.innerHTML = allergenDetailHtml(r);
            const dashi = RECIPES.filter(x => !x.pack && /(?<!和風|昆布)だし(?!の素|巻)/.test(String(x.seasBase != null ? x.seasBase : x.seas)));
            return { eff: algIdsEff(), av: isAvoided(r) || isAvoided(m), seas: seasFor(r), steps: stepTextsOf(r, 1).join(' '), tag: swapTagHtml(r), note: d.innerText,
                hits: algSelectedHits(r).concat(algSelectedHits(m)), bad: dashi.filter(x => !isAvoided(x) && /(?:^|[^布])だし(?!の素|巻)|(?<!kombu |Kombu )\bdashi\b/i.test(seasFor(x) + stepTextsOf(x, 1).join(' ').replace(/だし巻き/g, ''))).map(x => x.id),
                tsuyu: ['zarusoba', 'somen', 'nasubitashi'].filter(id => byId(id) && !isAvoided(byId(id))) }; });
        ok(g.eff.includes('fish') && !g.av && !g.hits.length, `NEW2 魚のアレルギー（${ui}）: 肉じゃが・味噌汁は昆布だしにして出す: ` + JSON.stringify(g).slice(0, 300));
        ok(/昆布だし|kombu dashi/i.test(g.seas) && /昆布だし|kombu dashi/i.test(g.steps), `NEW2 魚のアレルギー（${ui}）: 調味料と作り方を昆布だしに: ` + g.seas);
        ok(/🔁/.test(g.tag) && /昆布|kombu/i.test(g.note), `NEW2 魚のアレルギー（${ui}）: カードと詳細に置き換えの一言: ` + g.tag + ' / ' + g.note.slice(0, 200));
        ok(!g.bad.length, `NEW2 魚のアレルギー（${ui}）: 出す料理の調味料・作り方に、置き換えていない「だし」が残らない: ` + g.bad.join(','));
        ok(!g.tsuyu.length, `NEW2 魚のアレルギー（${ui}）: めんつゆの料理は出さない: ` + g.tsuyu.join(','));
        await ctx.close();
    }
    // 昆布だしがほかの選んだアレルゲンに当たるとき（ここでは判定を差しかえて確かめる）は置き換えず、だしの料理を出さない
    {
        const { ctx, p } = await open('JP', { allergens: ['fish'] });
        const g = await p.evaluate(() => { const keep = seasToOk; seasToOk = () => false; algDashiSwap.c = null; const r = byId('nikujaga'); r._seas = undefined; const out = { av: isAvoided(r), seas: seasFor(r) }; seasToOk = keep; algDashiSwap.c = null; return out; });
        ok(g.av && !/昆布だし/.test(g.seas), 'NEW2 昆布だしに置き換えられないときは、だしの料理を出さない: ' + JSON.stringify(g));
        await ctx.close();
    }
}
// モニター第3回d NEW3: 魚のアレルギーで、味噌（だし入りのことが多い）に「袋の表示を確認」。だし入り味噌・白だし・だし醤油・あごは出さない（だしそのものと同じ扱い）
{
    const TABLE = [['味噌', 'fish', 4], ['合わせ味噌', 'fish', 4], ['白味噌', 'fish', 4], ['Miso', 'fish', 4], ['だし入り味噌', 'fish', 2], ['だし入りみそ', 'fish', 2], ['白だし', 'fish', 2], ['だし醤油', 'fish', 2], ['あご', 'fish', 1], ['焼きあご', 'fish', 2],
        ['味噌', 'soy', 3], ['かにみそ', 'fish', 0], ['昆布だし', 'fish', 0], ['醤油', 'fish', 0]];
    const { ctx, p } = await open('JP');
    const r = await p.evaluate(T => {
        const mk = n => { const j = /[぀-ヿ㐀-鿿]/.test(n); const it = parseIng(n); if (!j){ it.en = n; it.key = n.toLowerCase(); } return it; };
        return T.filter(([n, id, k]) => algKind(id, mk(n)) !== k).map(([n, id, k]) => n + '/' + id + ' = ' + algKind(id, mk(n)) + '（' + k + ' のはず）');
    }, TABLE);
    ok(!r.length, 'NEW3 味噌・だし入り味噌・白だし・あごの判定の表: ' + r.join('、'));
    await ctx.close();
    for (const ui of ['ja', 'en']){
        const { ctx, p } = await open('JP', { uiLang: ui }, { family: [{ id: 'a', name: '夫', role: 'adult', avoid: ['@fish'], allergy: ['@fish'], mild: false }] });
        const g = await p.evaluate(() => { setTab('today'); const m = session.menu; const i = m.items.findIndex(x => x.slot === '汁物'); m.items[i >= 0 ? i : 2] = Object.assign({}, m.items[i >= 0 ? i : 2], { r: byId('misoshiru') }); render();
            const r = byId('misoshiru'), d = document.createElement('div'); d.innerHTML = allergenDetailHtml(r);
            const tagEl = [...document.querySelectorAll('.alg-tag')].find(x => /味噌|miso/i.test(x.innerText + x.getAttribute('aria-label')));
            return { av: isAvoided(r), may: algMayHits(r), note: d.innerText, line: eatersLine(), tag: tagEl ? tagEl.getAttribute('aria-label') : '',
                miso16: RECIPES.filter(x => !x.pack && !isAvoided(x) && /味噌/.test(String(x.seasBase != null ? x.seasBase : x.seas)) && !algMayHits(x).some(h => h.id === 'fish')).map(x => x.id) }; });
        ok(!g.av && g.may.some(x => x.id === 'fish' && x.names.some(n => /味噌|miso/i.test(n))), `NEW3 魚のアレルギー（${ui}）: 味噌汁は出すが、味噌に「袋の表示を確認（魚）」: ` + JSON.stringify(g.may));
        ok(/味噌|miso/i.test(g.tag) && /袋の表示を確認|package|label/i.test(g.tag), `NEW3 魚のアレルギー（${ui}）: カードの印に「魚（味噌の袋の表示を確認）」: ` + g.tag);
        ok(/だし入りの味噌も|miso with dashi/i.test(g.note), `NEW3 魚のアレルギー（${ui}）: 昆布だしの一言に「だし入りの味噌も袋の表示を確かめて」: ` + g.note.slice(0, 300));
        ok(!/^夫も食べられるお膳です$/m.test(g.line) && (ui !== 'ja' || /食べられそう/.test(g.line)), `NEW3 魚のアレルギー（${ui}）: 「夫も食べられるお膳です」と言い切らない: ` + g.line);
        ok(!g.miso16.length, `NEW3 魚のアレルギー（${ui}）: 味噌を使って出す料理には、すべて魚の「袋の表示を確認」: ` + g.miso16.join(','));
        await ctx.close();
    }
}
// モニター第3回d: 苦手で魚を外した人（菜食など）にも、だしは昆布だしにして出す（魚のアレルギーと同じ置き換え）
for (const store of [{ avoid: ['@pork', '@chicken', '@beef', '@fish', '@shellfish'] }, null]){
    const { ctx, p } = await open('JP', store || {}, store ? {} : { family: [{ id: 'a', name: '', role: 'adult', avoid: ['@fish'], allergy: [], mild: false }] });
    const g = await p.evaluate(() => { const m = byId('misoshiru'); const d = document.createElement('div'); d.innerHTML = allergenDetailHtml(m);
        const dashi = RECIPES.filter(x => !x.pack && /(?<!和風|昆布|白)だし(?!の素|巻)/.test(String(x.seasBase != null ? x.seasBase : x.seas)));
        return { av: isAvoided(m), seas: seasFor(m), steps: stepTextsOf(m, 1).join(' '), tag: swapTagHtml(m), note: d.innerText,
            bad: dashi.filter(x => !isAvoided(x) && /(?:^|[^布])だし(?!の素|巻)/.test(seasFor(x) + stepTextsOf(x, 1).join(' ').replace(/だし巻き/g, ''))).map(x => x.id) }; });
    const who = store ? '全員の苦手' : '家族の苦手';
    ok(!g.av && /昆布だし/.test(g.seas) && /昆布だし/.test(g.steps), `veg ${who}で魚を外す: 味噌汁を昆布だしで出す: ` + JSON.stringify(g).slice(0, 300));
    ok(/🔁/.test(g.tag) && /昆布だし/.test(g.note) && !/魚のアレルギー/.test(g.note), `veg ${who}で魚を外す: カードと詳細に置き換えの一言（アレルギーとは言わない）: ` + g.tag + ' / ' + g.note.slice(0, 200));
    ok(!g.bad.length, `veg ${who}で魚を外す: 出す料理に、置き換えていない「だし」が残らない: ` + g.bad.join(','));
    await ctx.close();
}
// モニター第3回d（デザイン）: 「袋の表示を確認」の印は、当たる印（赤い ⚠）と色・形で見分ける。カードではアレルゲンの名前を先に、2行まで出す。「ほか2品」と言わない
{
    const { ctx, p } = await open('JP', { allergens: ['sesame', 'soy', 'egg'] });
    const g = await p.evaluate(() => { setTab('today'); const m = session.menu; m.items[0] = Object.assign({}, m.items[0], { r: byId('chawanmushi') }); const i = m.items.findIndex(x => x.slot === '汁物'); m.items[i >= 0 ? i : 2] = Object.assign({}, m.items[i >= 0 ? i : 2], { r: byId('tomyumkung') }); render();
        const spotOf = n => [...document.querySelectorAll('.spot')].find(x => (x.querySelector('.nm') || {}).textContent === n) || document, may = spotOf('トムヤムクン').querySelector('.alg-tag.may'), hit = spotOf('茶碗蒸し').querySelector('.alg-tag:not(.may)'), cs = e => e ? getComputedStyle(e) : {};
        return { mayText: may ? may.innerText : '', hitText: hit ? hit.innerText : '', mayColor: cs(may).color, hitColor: cs(hit).color, clamp: cs(may).webkitLineClamp, ws: cs(may).whiteSpace,
            names: algMayNames([byId('tomyumkung'), byId('consomme'), byId('tonkatsu')]).join('') }; });
    ok(g.mayText && g.hitText, 'design 茶碗蒸し（卵）とトムヤムクン（ごま・大豆の袋）のカードに印: ' + JSON.stringify(g));
    ok(g.mayColor !== g.hitColor && !/^⚠/.test(g.mayText) && /^⚠/.test(g.hitText), 'design 「袋の表示を確認」は赤い ⚠ と色・記号で見分ける: ' + JSON.stringify(g));
    ok(/^\S*\s*(?:ごま・大豆|大豆・ごま)/.test(g.mayText), 'design カードの印はアレルゲンの名前を先に（2つ目も見える）: ' + g.mayText);
    ok(g.clamp === '2', 'design カードの印は2行まで出す: ' + g.clamp + ' ' + g.ws);
    ok(!/ほか\d+品/.test(g.names), 'design 加工品の数を「ほか○品」と言わない（料理の数と取り違える）: ' + g.names);
    await ctx.close();
}
// モニター第3回c: 「袋の表示を確認」の文・カード・買い物メモに、どの加工品の袋を見ればよいかを書く。「入れていません」と「○品は」のあいだに「。」
{
    const { ctx, p } = await open('JP', { allergens: ['sesame', 'soy'] });
    const g = await p.evaluate(() => { setTab('today'); const m = session.menu; m.items[0].r = byId('tonkatsu'); const sp = m.items.findIndex(x => x.slot === '汁物'); if (sp >= 0) m.items[sp].r = byId('consomme') || m.items[sp].r; render();
        const tag = [...document.querySelectorAll('.alg-tag.may')].map(x => x.innerText); return { line: algLine(), tag }; });
    ok(/入れていません。\d品は、袋の表示を確かめてください（[^）]*(?:ソース|コンソメ)/.test(g.line), '「入れていません。」で文を切り、袋を見る加工品の名前を書く: ' + g.line);
    ok(g.tag.some(x => /大豆（[^）]*ソース[^）]*の袋の表示を確認）/.test(x)), 'カードに「⚠ 大豆（中濃ソースの袋の表示を確認）」: ' + g.tag.join(' | '));
    await ctx.close();
    // 家族の文も同じ
    const o2 = await open('JP', {}, { family: [{ id: 'a', name: '息子', role: 'child', avoid: ['@dairy', '@egg'], allergy: ['@dairy', '@egg'], mild: false }] });
    const g2 = await o2.p.evaluate(() => { setTab('today'); const m = session.menu; const i = m.items.findIndex(x => x.slot === '汁物'); if (i < 0) return { skip: true }; m.items[i].r = byId('wantansoup'); render(); return { line: eatersLine() }; });
    ok(g2.skip || /食べられそうなお膳です。\d品は袋の表示を確かめてください（[^）]*(?:ワンタンの皮|鶏ガラ)/.test(g2.line), '家族の文に袋を見る加工品の名前: ' + g2.line);
    await o2.ctx.close();
    // 買い物メモ: ハムの行に「⚠ 大豆（袋の表示を確認）」。調味料は行がないので、袋を見るものの一覧に名前を出す
    const o3 = await open('JP', { allergens: ['soy'] });
    const g3 = await o3.p.evaluate(() => { const ids = RECIPES.filter(r => !isAvoided(r) && r.items.some(i => i.key === 'ハム' && !i.opt)).map(r => r.id); if (!ids.length) return { skip: true };
        makeWeek(); S.week.days.forEach((d, k) => { d.id = k === 0 ? ids[0] : d.id; d.skip = k !== 0; }); save(); setTab('today'); render();
        const row = [...document.querySelectorAll('.shop-row')].find(x => /ハム/.test(x.innerText)); const hint = (document.querySelector('.alg-shop') || {}).innerText || '';
        return { row: row ? row.innerText : '', hint, id: ids[0] }; });
    ok(g3.skip || (/袋の表示を確認/.test(g3.row) && /大豆/.test(g3.row)), '買い物メモのハムの行に「⚠ 大豆（袋の表示を確認）」: ' + JSON.stringify(g3));
    ok(g3.skip || /袋の表示を確かめるもの[^：]*：.*ハム（大豆）/.test(g3.hint), '買い物メモに、袋を見るものの一覧: ' + JSON.stringify(g3));
    await o3.ctx.close();
}
// モニター第3回c（案2）: 買う段の行と、畳んだ調味料の欄にも「袋の表示を確認」を出す（どの調味料かが分かる）
{
    const { ctx, p } = await open('JP', { allergens: ['sesame', 'soy'] });
    const g = await p.evaluate(() => {
        const ids = ['tonkatsu', 'consomme'].filter(id => byId(id) && !isAvoided(byId(id)));
        const ham = RECIPES.find(r => !isAvoided(r) && r.items.some(i => i.key === 'ハム' && !i.opt)); if (ham) ids.push(ham.id);
        S.cook = {d: TODAY, ids, slots: ids.map(id => byId(id).type || '主菜'), done: {}, adj: true, salt: 0}; save(); session.stage = 'shop'; setTab('today'); render();
        const rows = [...document.querySelectorAll('.stage-shop .buy-row')].map(x => x.innerText.replace(/\s+/g, ' '));
        const fold = document.querySelector('.buy-fold[data-bf="seas"] summary'); const seasRows = [...document.querySelectorAll('.buy-fold[data-bf="seas"] .buy-row')].map(x => x.textContent.replace(/\s+/g, ' '));
        return { ids, rows, fold: fold ? fold.innerText.replace(/\s+/g, ' ') : '', seasRows, ham: ham ? ham.id : '' };
    });
    ok(g.fold && /袋の表示を確かめるもの/.test(g.fold) && /(?:ソース|コンソメ)（大豆）/.test(g.fold), '案2 買う段: 畳んだ調味料の欄の見出しに、袋を見る調味料の名前: ' + JSON.stringify(g).slice(0, 400));
    ok(g.seasRows.some(x => /(?:ソース|コンソメ).*🔍 大豆（袋の表示を確認）/.test(x)), '案2 買う段: 調味料の行に「🔍 大豆（袋の表示を確認）」: ' + g.seasRows.join(' | '));
    ok(!g.ham || g.rows.concat(g.seasRows).some(x => /ハム.*🔍 [^（]*大豆[^（]*（袋の表示を確認）/.test(x)), '案2 買う段: ハムの行に「🔍 大豆（袋の表示を確認）」: ' + g.rows.join(' | '));
    await ctx.close();
}
// モニター第3回c（案2）: 設定で家族のアレルギーを足して決める段にもどると、「献立をかえました」は段の上の知らせだけ（お知らせを重ねて2回出さない）
{
    const { ctx, p } = await open('JP');
    await p.evaluate(() => { setTab('today'); render(); });
    const before = await p.evaluate(() => session.menu.items.map(x => x.r && x.r.id));
    await p.evaluate(() => { setTab('settings'); if (!Array.isArray(S.family)) S.family = []; S.family.push({id: 'k', name: '息子', role: 'child', avoid: ['@dairy', '@egg', '@wheat', '@pork', '@chicken', '@beef', '@fish'], allergy: ['@dairy', '@egg', '@wheat', '@pork', '@chicken', '@beef', '@fish'], mild: false}); save(); reconcileMenu(); render(); });
    const inSettings = await p.evaluate(() => ({ toast: (document.querySelector('#toast-root') || {}).innerText || '', note: !!session.avoidNote }));
    await p.click('[data-act=settings-back]'); await p.waitForTimeout(300);
    const back = await p.evaluate(() => { const vis = e => !!e && e.getBoundingClientRect().height > 0; const n = document.querySelector('.avoid-note'), tr = document.querySelector('#toast-root .toast'); return { note: vis(n) ? n.innerText : '', toast: vis(tr) ? tr.innerText : '' }; });
    ok(!inSettings.note || /献立をかえました/.test(inSettings.toast), '案2 設定の画面では「献立をかえました」をお知らせで出す: ' + JSON.stringify(inSettings) + ' ' + before.join());
    ok(!inSettings.note || (/献立をかえました/.test(back.note) && !/献立をかえました/.test(back.toast)), '案2 決める段にもどると、段の上の知らせだけ（お知らせを重ねない）: ' + JSON.stringify(back));
    await ctx.close();
}
// モニター第3回c A20: 「ねぎ」とだけ打った人（五葷）には、長ねぎを玉ねぎなど、ねぎのなかまに置き換えない
{
    const { ctx, p } = await open('JP');
    const g = await p.evaluate(async () => { setTab('settings'); render(); document.querySelectorAll('#view details').forEach(d => d.open = true);
        const inp = document.getElementById('avoid-input'); inp.value = 'ねぎ'; inp.closest('form').requestSubmit(); await new Promise(r => setTimeout(r, 200));
        const bad = RECIPES.filter(r => !isAvoided(r)).map(r => swappedRecipe(r)).filter(r => r && r.swapped && r.swapped.swaps.some(x => ALLIUM_RE.test(x.to.name + '|' + x.to.key))).map(r => r.id);
        const leek = RECIPES.filter(r => !isAvoided(r) && (swappedRecipe(r) || r).items.some(i => !i.opt && i.key === '長ねぎ')).map(r => r.id);
        S.settings.avoid = ['長ねぎ']; save(); const plain = RECIPES.filter(r => !isAvoided(r)).map(r => swappedRecipe(r)).filter(r => r && r.swapped && r.swapped.swaps.some(x => x.to.key === '玉ねぎ')).length;
        return { avoid: S.settings.avoid, bad, leek, plain }; });
    ok(!g.bad.length, '「ねぎ」を避ける人に、ねぎのなかま（玉ねぎなど）で置き換えた料理を出さない: ' + g.bad.join(','));
    ok(!g.leek.length, '「ねぎ」を避ける人に、長ねぎを使う料理を出さない: ' + g.leek.join(','));
    ok(g.plain > 0, '「長ねぎ」を選んだ人には、今までどおり玉ねぎで置き換える（' + g.plain + '品）');
    await ctx.close();
}
// 安全第4回b S6 の残り: ひとひねりの「元にする料理」に、アレルゲンで案が作れない料理（えびアレルギーのエビチリなど）を並べない。並んだ料理は、選ぶと案が作れる
{
    const { ctx, p } = await open('JP', { allergens: ['shrimp', 'egg'] });
    const r = await p.evaluate(() => { setTab('twist'); render();
        const ids = [...document.querySelectorAll('#tw-base option')].map(o => o.value).filter(Boolean);
        // 画面で選んだときと同じ（いまの「ひねり具合」などの条件で runTwist）。案が0件なら行き止まり
        const dead = ids.filter(id => { twistState.baseId = id; runTwist(); return !twistState.results.length; }); twistState.baseId = ''; twistState.results = null;
        const ebi = ids.includes('ebichili') ? (twistState.baseId = 'ebichili', runTwist(), twistState.results.map(x => x.name)) : [];
        return { n: ids.length, dead, ebi, bad: ids.filter(id => ['ebifry', 'chawanmushi', 'dashimaki'].includes(id)) }; });
    ok(r.n > 20, 'S6 元にする料理が並ぶ（' + r.n + '品）');
    ok(!r.bad.length, 'S6 えび・卵アレルギーで、案が作れないえびフライ・茶碗蒸し・だし巻き卵を元にする料理に並べない: ' + r.bad.join(','));
    ok(r.ebi.every(n => !/^(?:[^ ]+ )?(?:えび|エビ|海老)/.test(n)), 'S6 エビチリは主役を鶏肉に替えた案だけ作る: ' + r.ebi.join('、'));
    ok(r.ebi.every(n => !/えび|エビ|海老/.test(n)), 'S6 エビチリの案の名前（かっこの中も）に、えびの言葉を出さない（モニター第3回d）: ' + r.ebi.join('、'));
    ok(!r.dead.length, 'S6 並べた料理は、選ぶと案が作れる（行き止まりにしない）: ' + r.dead.slice(0, 5).join(','));
    await ctx.close();
}
await b.close();
console.log(errs.length ? 'ページのエラー: ' + errs.slice(0, 5).join(' | ') : 'ページのエラーなし');
ok(errs.length === 0, 'ページのエラー');
console.log((fails ? `NG ${fails}` : 'ALL OK') + `  SEED=${SEED}`);
process.exit(fails ? 1 : 0);
