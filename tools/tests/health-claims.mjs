#!/usr/bin/env node
// 料理の文（ひと手間のコツ・説明・手順）に、健康や体への効き目を言い切る言い方が入っていないかを見る（ブラウザ不要）
//  - 日本の料理（index.html の R(...) と UPGRADES）、各国の料理（packs/*.js）、その訳（packs/i18n/*.js）の全言語
//  - 「体が温まる」「風邪のときに」「二日酔い」「たんぱく質が足せる」「ビタミンの吸収」「体を冷やす」「滋養」などを見つけたら落とす
//  - 味・香り・食感・手間の話に言いかえる（例: 「香りが立って、味が締まります」）。安全の注意（生卵・生のえび・生焼けの豆）はそのまま残す
//  使い方: node tools/tests/health-claims.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../gohancho');
// 言語ごとの言い方。料理の動き（温める・冷ます）や安全の注意（消化しにくい・体調をくずす）では落ちないよう、効き目の言い方だけにする
const CLAIM = {
    ja: /体が温ま|体を温め|体の温まる|疲労回復|免疫|健康に|ダイエット|デトックス|血行|美肌|栄養|ヘルシー|代謝|胃にやさし|胃腸|風邪|整腸|ビタミン|ミネラル|鉄分|貧血|抗酸化|スタミナ|滋養|むくみ|冷え性|コレステロール|血糖|体にい|体に良|体によ|薬膳|効能|夏バテ|二日酔|のどにやさし|喉にやさし|美容|たんぱく質(?:が|も|と)(?:足|加|増|プラス)|体調のすぐれない人のため|体を冷や|体を目覚め|消化(?:が|も)よ/,
    en: /warms? (?:you|the body)\b|warms you up|warming (?:soup|aroma)|immun(?:e|ity) (?:boost|system)|boosts? (?:your )?immun|\bhealthy\b|\bhealthier\b|good for (?:you|your)\b|detox|\bdiet\b|\bnutrition|nutritious|nourishing|vitamin|antioxid|easier to digest|aids? digestion|metabolism|cholesterol|have a cold|for a cold(?!\s+\w)|hangover|(?:when you are|anyone who is|someone who is) unwell|gentle on the stomach|soothing for|(?:adds?|more|extra|a little|and) protein|absorb the iron|thought of as cooling|the cooling,|superfood|stamina/i,
    'zh-Hans': /暖身|暖胃|温补|滋补|养生|营养|免疫|排毒|减肥|养颜|润肺|润喉|清热|去火|降火|祛湿|补血|补气|驱寒|解酒|醒酒|蛋白质|维生素/,
    'zh-Hant': /暖身|暖胃|溫補|滋補|養生|營養|免疫|排毒|減肥|養顏|潤肺|潤喉|清熱|去火|降火|祛濕|補血|補氣|驅寒|解酒|醒酒|蛋白質|維生素/,
    ko: /몸을 따뜻|몸이 따뜻|몸보신|보양|건강에|영양|면역|해장|숙취|감기|단백질|비타민|피로 회복|다이어트|디톡스|술 마신 다음/,
    th: /สุขภาพ|เป็นหวัด|โปรตีน(?!จับ)|วิตามิน|บำรุง|เมาค้าง|ฤทธิ์เย็น|ฤทธิ์ร้อน/,
    vi: /sức khỏe|ấm người|làm ấm cơ thể|miễn dịch|bị cảm|dễ tiêu|chất đạm|thêm đạm|vitamin|bổ dưỡng|bồi bổ|giải rượu|thanh nhiệt|giải nhiệt|tính hàn|tính mát/i,
    de: /gesund|wärmt (?:dich|den körper)|immun|erkält|verdaulich|vitamin|nährstoff|\bkater\b/i,
    fr: /santé|réchauffe le corps|vous réchauffe|immun|rhume|plus digeste|digestion|protéine|vitamine|nutriti|gueule de bois/i,
    es: /\bsalud\b|calienta el cuerpo|te calienta|inmun|resfriad|digesti|proteína|vitamina|nutriti|resaca|para el estómago|cuando uno está mal/i,
    'pt-BR': /saúde|aquece o corpo|imun|resfriad|digest|proteína|vitamina|nutriti|ressaca/i,
    it: /salute|riscalda (?:il corpo|te)|immun|raffreddor|digeribil|digestion|protein|vitamin|nutrient|\bferro\b|chi non sta bene/i,
    pl: /zdrow|rozgrzewa|odporn|przezięb|lekkostrawn|trawieni|witamin|odżywcz|\bkac\b|organizm/i,
    tr: /sağlık|vücudu ısıt|bağışıklık|soğuk algınlığı|sindirim|protein|vitamin|besleyici/i,
    ar: /صحة|(?<![\u0600-\u06FF])صحي(?![\u0600-\u06FF])|يدفئ|تدفّي|تدفي|مناعة|زكام|هضم|بروتين|فيتامين|مغذي/,
    hi: /सेहत|स्वास्थ्य|शरीर में गर्मी|प्रतिरक्षा|इम्यून|ज़ुकाम|जुकाम|पाचन|प्रोटीन|विटामिन|पौष्टिक/,
    id: /kesehatan|menyehatkan|menghangatkan tubuh|daya tahan|masuk angin|pencernaan|protein|vitamin|bergizi|\bgizi\b/i,
    fil: /kalusugan|pampainit ng katawan|resistensya|sipon|trangkaso|panunaw|protina|bitamina|sustansya/i,
};

// 1) 各国の料理と訳を読む
const PACKS = {}, TR = {};
const ctx = { window: {} };
ctx.GOHAN_PACK = ctx.window.GOHAN_PACK = p => { PACKS[p.country] = p; };
ctx.GOHAN_PACK_TR = ctx.window.GOHAN_PACK_TR = (cc, lang, d) => { TR[cc + '.' + lang] = d; };
vm.createContext(ctx);
for (const f of fs.readdirSync(ROOT + '/packs').filter(f => f.endsWith('.js'))) vm.runInContext(fs.readFileSync(ROOT + '/packs/' + f, 'utf8'), ctx);
for (const f of fs.readdirSync(ROOT + '/packs/i18n').filter(f => f.endsWith('.js'))) vm.runInContext(fs.readFileSync(ROOT + '/packs/i18n/' + f, 'utf8'), ctx);

const texts = [];   // [どこ, 言語, 文]
const put = (where, lang, v) => { if (typeof v === 'string' && v) texts.push([where, lang, v]); };
const recipeTexts = (where, lang, r) => {
    const tp = r.tip; if (typeof tp === 'string') put(where + ' tip', lang, tp); else if (tp) ['add', 'why', 'skill', 'how'].forEach(k => put(where + ' tip.' + k, lang, tp[k]));
    (r.steps || []).forEach((s, k) => put(where + ' steps.' + k, lang, typeof s === 'string' ? s : s && s.t));
};
for (const [cc, p] of Object.entries(PACKS)) for (const r of p.recipes || []) recipeTexts(cc + ' ' + r.id, PACKS[cc].tipLang || 'en', r);
for (const [key, d] of Object.entries(TR)){ const [cc, lang] = key.split('.'); for (const [id, r] of Object.entries(d.recipes || {})) recipeTexts(cc + ' ' + id + ' (' + key + ')', lang, r); }
// 2) 日本の料理（index.html）: R(...) の行（手順）と UPGRADES・tip の行（ひと手間）
const html = fs.readFileSync(ROOT + '/index.html', 'utf8').split('\n');
html.forEach((line, k) => { if (/^R\('|^\s+\w+:\{add:'|tip:\s*\{\s*add:/.test(line)) put('index.html:' + (k + 1), 'ja', line); });

let fails = 0; const byLang = {};
for (const [where, lang, t] of texts){
    byLang[lang] = (byLang[lang] || 0) + 1;
    const re = CLAIM[lang]; if (!re) { console.log('FAIL 言語の言い方がない: ' + lang + ' ' + where); fails++; continue; }
    const m = t.match(re);
    if (m){ fails++; console.log('FAIL 健康・体への効き目の言い方: ' + where + ' [' + lang + '] 「' + m[0] + '」 ' + t.slice(0, 120)); }
}
// 3) 言い方の表そのものの確かめ（直した言い方は落ちず、元の言い方は落ちる）
const SELF = [['ja', '仕上げにほんの少し。体が温まります', true], ['ja', '仕上げにほんの少し。香りが立って、味が締まります', false], ['ja', '生の大豆は消化しにくい', false], ['ja', 'すり身をたたきつけると魚のたんぱく質がつながり', false],
    ['en', 'Pepper and garlic warm you up', true], ['en', 'A clean heat that makes it a famous hangover soup', true], ['en', 'It adds protein and keeps you full', true], ['en', 'Raw soybeans are hard to digest', false], ['en', 'The classic heat for a cold morning', false], ['en', 'Drink a cup when you have a cold', true],
    ['ar', 'والحمص الصحيح', false], ['ar', 'أكل صحي', true], ['ja', '生のえびなので、体調のすぐれない人は食べない', false], ['en', 'Warming the yogurt slowly keeps it smooth', false],
    ['ko', '해장국으로도 그만이에요', true], ['zh-Hant', '冷天時變成暖身的湯麵線', true], ['vi', 'Cải cúc có tính mát', true], ['es', 'Calienta el aceite en una sartén', false], ['th', 'การตีเนื้อปลากับชามทำให้โปรตีนจับตัว', false]];
for (const [lang, t, bad] of SELF) if (CLAIM[lang].test(t) !== bad){ fails++; console.log('FAIL 言い方の表: [' + lang + '] ' + t + ' は' + (bad ? '落ちるはず' : '落ちないはず')); }

console.log('見た文: ' + texts.length + '（' + Object.entries(byLang).map(([l, n]) => l + ':' + n).join(' ') + '）');
console.log(fails ? `NG ${fails}` : 'OK 健康・体への効き目の言い切りなし');
process.exit(fails ? 1 : 0);
