// 作り方の文の中の分量を人数に合わせる（index.html の scaleSteps）のテスト。node tools/steps/scale-steps.test.mjs
// REAL: 実際のレシピ（日本・アメリカ・フランス・韓国・タイ ほか）の手順。人数 1・3・4・6 のときの文（2人分が元）
// SAME: 変えてはいけない文（温度・時間・大きさ・個数・ずつ・each・缶の大きさ など）
import fs from "fs"; import vm from "vm"; import path from "path"; import { fileURLToPath } from "url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../gohancho/");
const html = fs.readFileSync(ROOT + "index.html", "utf8");
const { scaleSteps } = new Function("LANG", "S", html.slice(html.indexOf("const FRAC = {"), html.indexOf("/* ---- 苦手な食材 ---- */")) + ";return {scaleSteps};")("ja", {settings:{servings:2}});
// レシピの手順と材料名を読む（日本のレシピは index.html の R(...)、ほかの国は packs/*.js と packs/i18n/*.js）
const steps = [];
html.split("\n").filter(l => /^R\(/.test(l)).forEach(l => new Function("R", l)((id, n, g, t, m, min, ings, seas, st) => st.split("|").forEach((s, k) => steps.push({lang:"ja", cc:"JP", id, k, s, names: ings.split("|").map(x => x.split(" ")[0])}))));
const ctx = {GOHAN_PACK: p => p.recipes.forEach(r => (r.steps || []).forEach((s, k) => steps.push({lang:p.lang, cc:p.country, id:r.id, k, s, names:(r.ings || []).map(x => x.split("|")[1])}))),
    GOHAN_PACK_TR: (cc, lang, d) => Object.entries(d.recipes || {}).forEach(([id, r]) => (r.steps || []).forEach((s, k) => steps.push({lang, cc, id, k, s, names:(r.ings || []).map(x => Array.isArray(x) ? x[0] : "")})))};
vm.createContext(ctx); ctx.window = ctx;
for (const f of fs.readdirSync(ROOT + "packs").filter(f => f.endsWith(".js"))) vm.runInContext(fs.readFileSync(ROOT + "packs/" + f, "utf8"), ctx);
for (const f of fs.readdirSync(ROOT + "packs/i18n")) vm.runInContext(fs.readFileSync(ROOT + "packs/i18n/" + f, "utf8"), ctx);
const REAL = [
 {
  "lang": "ja",
  "cc": "JP",
  "id": "omurice",
  "k": 2,
  "before": "卵2個と牛乳大さじ1を溶き、残りのバター半量で半熟に焼く。",
  "after": {
   "1": "卵1個と牛乳大さじ1/2を溶き、残りのバター半量で半熟に焼く。",
   "3": "卵3個と牛乳大さじ1と1/2を溶き、残りのバター半量で半熟に焼く。",
   "4": "卵4個と牛乳大さじ2を溶き、残りのバター半量で半熟に焼く。",
   "6": "卵6個と牛乳大さじ3を溶き、残りのバター半量で半熟に焼く。"
  }
 },
 {
  "lang": "ja",
  "cc": "JP",
  "id": "nikuudon",
  "k": 1,
  "before": "小鍋に醤油大さじ1・みりん大さじ1・砂糖で牛肉を甘辛く煮る。",
  "after": {
   "1": "小鍋に醤油大さじ1/2・みりん大さじ1/2・砂糖で牛肉を甘辛く煮る。",
   "3": "小鍋に醤油大さじ1と1/2・みりん大さじ1と1/2・砂糖で牛肉を甘辛く煮る。",
   "4": "小鍋に醤油大さじ2・みりん大さじ2・砂糖で牛肉を甘辛く煮る。",
   "6": "小鍋に醤油大さじ3・みりん大さじ3・砂糖で牛肉を甘辛く煮る。"
  }
 },
 {
  "lang": "ja",
  "cc": "JP",
  "id": "kakuni",
  "k": 2,
  "before": "水600mlと調味料を加え、落としぶたで30分煮る。",
  "after": {
   "1": "水300mlと調味料を加え、落としぶたで30分煮る。",
   "3": "水900mlと調味料を加え、落としぶたで30分煮る。",
   "4": "水1200mlと調味料を加え、落としぶたで30分煮る。",
   "6": "水1800mlと調味料を加え、落としぶたで30分煮る。"
  }
 },
 {
  "lang": "ja",
  "cc": "JP",
  "id": "gyoza",
  "k": 3,
  "before": "油を熱して餃子を並べ、焼き色がついたら水50mlを入れてふたをし、水気がなくなるまで蒸し焼きにする。最後にごま油少々を回してパリッと焼く。",
  "after": {
   "1": "油を熱して餃子を並べ、焼き色がついたら水25mlを入れてふたをし、水気がなくなるまで蒸し焼きにする。最後にごま油少々を回してパリッと焼く。",
   "3": "油を熱して餃子を並べ、焼き色がついたら水75mlを入れてふたをし、水気がなくなるまで蒸し焼きにする。最後にごま油少々を回してパリッと焼く。",
   "4": "油を熱して餃子を並べ、焼き色がついたら水100mlを入れてふたをし、水気がなくなるまで蒸し焼きにする。最後にごま油少々を回してパリッと焼く。",
   "6": "油を熱して餃子を並べ、焼き色がついたら水150mlを入れてふたをし、水気がなくなるまで蒸し焼きにする。最後にごま油少々を回してパリッと焼く。"
  }
 },
 {
  "lang": "ja",
  "cc": "JP",
  "id": "nanban",
  "k": 0,
  "before": "卵1個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。",
  "after": {
   "1": "卵1/2個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。",
   "3": "卵1と1/2個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。",
   "4": "卵2個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。",
   "6": "卵3個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。"
  }
 },
 {
  "lang": "ja",
  "cc": "CN",
  "id": "cn_sigua_huage",
  "k": 0,
  "before": "砂抜きされていないあさりなら、前もって塩水（水1Lに塩大さじ1くらい）に入れ、暗いところに1〜2時間おいて砂をはかせる。こすり洗いする。殻が割れているもの、たたいても閉じないものは捨てる。",
  "after": {
   "1": "砂抜きされていないあさりなら、前もって塩水（水0.5Lに塩大さじ1/2くらい）に入れ、暗いところに1〜2時間おいて砂をはかせる。こすり洗いする。殻が割れているもの、たたいても閉じないものは捨てる。",
   "3": "砂抜きされていないあさりなら、前もって塩水（水1.5Lに塩大さじ1と1/2くらい）に入れ、暗いところに1〜2時間おいて砂をはかせる。こすり洗いする。殻が割れているもの、たたいても閉じないものは捨てる。",
   "4": "砂抜きされていないあさりなら、前もって塩水（水2Lに塩大さじ2くらい）に入れ、暗いところに1〜2時間おいて砂をはかせる。こすり洗いする。殻が割れているもの、たたいても閉じないものは捨てる。",
   "6": "砂抜きされていないあさりなら、前もって塩水（水3Lに塩大さじ3くらい）に入れ、暗いところに1〜2時間おいて砂をはかせる。こすり洗いする。殻が割れているもの、たたいても閉じないものは捨てる。"
  }
 },
 {
  "lang": "ja",
  "cc": "DE",
  "id": "de_semmelknoedel",
  "k": 0,
  "before": "パンを小さな角切りにする。牛乳を温めてパンにかけ、15分置く。玉ねぎ1個をみじん切りにしてバターの半量で炒め、卵、パセリ、塩小さじ1、こしょう、ナツメグとともにパンに加える。よくこね、やわらかすぎて丸められなければパン粉を足す。",
  "after": {
   "1": "パンを小さな角切りにする。牛乳を温めてパンにかけ、15分置く。玉ねぎ1/2個をみじん切りにしてバターの半量で炒め、卵、パセリ、塩小さじ1/2、こしょう、ナツメグとともにパンに加える。よくこね、やわらかすぎて丸められなければパン粉を足す。",
   "3": "パンを小さな角切りにする。牛乳を温めてパンにかけ、15分置く。玉ねぎ1と1/2個をみじん切りにしてバターの半量で炒め、卵、パセリ、塩小さじ1と1/2、こしょう、ナツメグとともにパンに加える。よくこね、やわらかすぎて丸められなければパン粉を足す。",
   "4": "パンを小さな角切りにする。牛乳を温めてパンにかけ、15分置く。玉ねぎ2個をみじん切りにしてバターの半量で炒め、卵、パセリ、塩小さじ2、こしょう、ナツメグとともにパンに加える。よくこね、やわらかすぎて丸められなければパン粉を足す。",
   "6": "パンを小さな角切りにする。牛乳を温めてパンにかけ、15分置く。玉ねぎ3個をみじん切りにしてバターの半量で炒め、卵、パセリ、塩小さじ3、こしょう、ナツメグとともにパンに加える。よくこね、やわらかすぎて丸められなければパン粉を足す。"
  }
 },
 {
  "lang": "ja",
  "cc": "DE",
  "id": "de_spargel",
  "k": 1,
  "before": "幅の広い鍋に湯をわかし、塩小さじ1、砂糖、バター20gを入れる。アスパラガスを入れて12〜15分、太い根元に竹串がすっと通るが形はしっかり残るくらいまでゆでる。",
  "after": {
   "1": "幅の広い鍋に湯をわかし、塩小さじ1/2、砂糖、バター10gを入れる。アスパラガスを入れて12〜15分、太い根元に竹串がすっと通るが形はしっかり残るくらいまでゆでる。",
   "3": "幅の広い鍋に湯をわかし、塩小さじ1と1/2、砂糖、バター30gを入れる。アスパラガスを入れて12〜15分、太い根元に竹串がすっと通るが形はしっかり残るくらいまでゆでる。",
   "4": "幅の広い鍋に湯をわかし、塩小さじ2、砂糖、バター40gを入れる。アスパラガスを入れて12〜15分、太い根元に竹串がすっと通るが形はしっかり残るくらいまでゆでる。",
   "6": "幅の広い鍋に湯をわかし、塩小さじ3、砂糖、バター60gを入れる。アスパラガスを入れて12〜15分、太い根元に竹串がすっと通るが形はしっかり残るくらいまでゆでる。"
  }
 },
 {
  "lang": "ja",
  "cc": "DE",
  "id": "de_spargel",
  "k": 2,
  "before": "その間にバター125gを溶かす。金属のボウルに卵黄と水を入れ、ごく弱く沸いた湯せんにかけて、もったり泡立ち温かくなるまで（約70℃、3〜4分。固まらないように混ぜ続ける）泡立てる。湯せんから外し、温かいバターを最初は1滴ずつ、次に細くたらしながら混ぜ、レモン汁、塩、こしょうで味を調える。",
  "after": {
   "1": "その間にバター65gを溶かす。金属のボウルに卵黄と水を入れ、ごく弱く沸いた湯せんにかけて、もったり泡立ち温かくなるまで（約70℃、3〜4分。固まらないように混ぜ続ける）泡立てる。湯せんから外し、温かいバターを最初は1滴ずつ、次に細くたらしながら混ぜ、レモン汁、塩、こしょうで味を調える。",
   "3": "その間にバター190gを溶かす。金属のボウルに卵黄と水を入れ、ごく弱く沸いた湯せんにかけて、もったり泡立ち温かくなるまで（約70℃、3〜4分。固まらないように混ぜ続ける）泡立てる。湯せんから外し、温かいバターを最初は1滴ずつ、次に細くたらしながら混ぜ、レモン汁、塩、こしょうで味を調える。",
   "4": "その間にバター250gを溶かす。金属のボウルに卵黄と水を入れ、ごく弱く沸いた湯せんにかけて、もったり泡立ち温かくなるまで（約70℃、3〜4分。固まらないように混ぜ続ける）泡立てる。湯せんから外し、温かいバターを最初は1滴ずつ、次に細くたらしながら混ぜ、レモン汁、塩、こしょうで味を調える。",
   "6": "その間にバター380gを溶かす。金属のボウルに卵黄と水を入れ、ごく弱く沸いた湯せんにかけて、もったり泡立ち温かくなるまで（約70℃、3〜4分。固まらないように混ぜ続ける）泡立てる。湯せんから外し、温かいバターを最初は1滴ずつ、次に細くたらしながら混ぜ、レモン汁、塩、こしょうで味を調える。"
  }
 },
 {
  "lang": "ja",
  "cc": "PE",
  "id": "pe_sopa_criolla",
  "k": 1,
  "before": "水800mlを加えて煮立て、5分煮る。",
  "after": {
   "1": "水400mlを加えて煮立て、5分煮る。",
   "3": "水1200mlを加えて煮立て、5分煮る。",
   "4": "水1600mlを加えて煮立て、5分煮る。",
   "6": "水2400mlを加えて煮立て、5分煮る。"
  }
 },
 {
  "lang": "en",
  "cc": "US",
  "id": "us_beefbroccoli",
  "k": 0,
  "before": "Slice the beef thinly against the grain. Toss with 1 tsp cornstarch and 1 tbsp soy sauce. Mix the rest of the soy, sugar, cornstarch and water for the sauce.",
  "after": {
   "1": "Slice the beef thinly against the grain. Toss with 1/2 tsp cornstarch and 1/2 tbsp soy sauce. Mix the rest of the soy, sugar, cornstarch and water for the sauce.",
   "3": "Slice the beef thinly against the grain. Toss with 1 1/2 tsp cornstarch and 1 1/2 tbsp soy sauce. Mix the rest of the soy, sugar, cornstarch and water for the sauce.",
   "4": "Slice the beef thinly against the grain. Toss with 2 tsp cornstarch and 2 tbsp soy sauce. Mix the rest of the soy, sugar, cornstarch and water for the sauce.",
   "6": "Slice the beef thinly against the grain. Toss with 3 tsp cornstarch and 3 tbsp soy sauce. Mix the rest of the soy, sugar, cornstarch and water for the sauce."
  }
 },
 {
  "lang": "en",
  "cc": "US",
  "id": "us_beefbroccoli",
  "k": 1,
  "before": "Heat the oil in a large skillet or wok over high heat. Add the broccoli florets, stir 2 minutes, add 3 tbsp water, cover and steam 2 minutes. Remove.",
  "after": {
   "1": "Heat the oil in a large skillet or wok over high heat. Add the broccoli florets, stir 2 minutes, add 1 1/2 tbsp water, cover and steam 2 minutes. Remove.",
   "3": "Heat the oil in a large skillet or wok over high heat. Add the broccoli florets, stir 2 minutes, add 4 1/2 tbsp water, cover and steam 2 minutes. Remove.",
   "4": "Heat the oil in a large skillet or wok over high heat. Add the broccoli florets, stir 2 minutes, add 6 tbsp water, cover and steam 2 minutes. Remove.",
   "6": "Heat the oil in a large skillet or wok over high heat. Add the broccoli florets, stir 2 minutes, add 9 tbsp water, cover and steam 2 minutes. Remove."
  }
 },
 {
  "lang": "en",
  "cc": "US",
  "id": "us_chickendumplings",
  "k": 2,
  "before": "Meanwhile make the dumplings: mix the rest of the flour, the baking powder and 1/2 tsp salt. Melt the remaining butter, add it with the milk and stir just until a soft, sticky dough forms.",
  "after": {
   "1": "Meanwhile make the dumplings: mix the rest of the flour, the baking powder and 1/4 tsp salt. Melt the remaining butter, add it with the milk and stir just until a soft, sticky dough forms.",
   "3": "Meanwhile make the dumplings: mix the rest of the flour, the baking powder and 3/4 tsp salt. Melt the remaining butter, add it with the milk and stir just until a soft, sticky dough forms.",
   "4": "Meanwhile make the dumplings: mix the rest of the flour, the baking powder and 1 tsp salt. Melt the remaining butter, add it with the milk and stir just until a soft, sticky dough forms.",
   "6": "Meanwhile make the dumplings: mix the rest of the flour, the baking powder and 1 1/2 tsp salt. Melt the remaining butter, add it with the milk and stir just until a soft, sticky dough forms."
  }
 },
 {
  "lang": "en",
  "cc": "US",
  "id": "us_spaghetti",
  "k": 0,
  "before": "Mix the beef, breadcrumbs, egg, half the parmesan, 1 grated garlic clove, 1/2 tsp salt and pepper. Roll into 10 meatballs.",
  "after": {
   "1": "Mix the beef, breadcrumbs, egg, half the parmesan, 1 grated garlic clove, 1/4 tsp salt and pepper. Roll into 10 meatballs.",
   "3": "Mix the beef, breadcrumbs, egg, half the parmesan, 1 grated garlic clove, 3/4 tsp salt and pepper. Roll into 10 meatballs.",
   "4": "Mix the beef, breadcrumbs, egg, half the parmesan, 1 grated garlic clove, 1 tsp salt and pepper. Roll into 10 meatballs.",
   "6": "Mix the beef, breadcrumbs, egg, half the parmesan, 1 grated garlic clove, 1 1/2 tsp salt and pepper. Roll into 10 meatballs."
  }
 },
 {
  "lang": "en",
  "cc": "US",
  "id": "us_tacos",
  "k": 2,
  "before": "Meanwhile warm the taco shells in a 175°C oven for 5 minutes. Shred the lettuce and dice the tomato.",
  "after": {
   "1": "Meanwhile warm the taco shells in a 175°C oven for 5 minutes. Shred the lettuce and dice the tomato.",
   "3": "Meanwhile warm the taco shells in a 175°C oven for 5 minutes. Shred the lettuce and dice the tomato.",
   "4": "Meanwhile warm the taco shells in a 175°C oven for 5 minutes. Shred the lettuce and dice the tomato.",
   "6": "Meanwhile warm the taco shells in a 175°C oven for 5 minutes. Shred the lettuce and dice the tomato."
  }
 },
 {
  "lang": "en",
  "cc": "GB",
  "id": "gb_stew",
  "k": 3,
  "before": "For the dumplings, mix the self-raising flour, suet and a pinch of salt with 5-6 tbsp cold water to a soft dough. Roll into 6 balls.",
  "after": {
   "1": "For the dumplings, mix the self-raising flour, suet and a pinch of salt with 2 1/2-3 tbsp cold water to a soft dough. Roll into 6 balls.",
   "3": "For the dumplings, mix the self-raising flour, suet and a pinch of salt with 7 1/2-9 tbsp cold water to a soft dough. Roll into 6 balls.",
   "4": "For the dumplings, mix the self-raising flour, suet and a pinch of salt with 10-12 tbsp cold water to a soft dough. Roll into 6 balls.",
   "6": "For the dumplings, mix the self-raising flour, suet and a pinch of salt with 15-18 tbsp cold water to a soft dough. Roll into 6 balls."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_couscous",
  "k": 2,
  "before": "Meanwhile put the couscous in a bowl with a pinch of salt and 1 tbsp oil, pour over 300 ml boiling water (or broth from the pot), cover for 5 minutes, then fluff with a fork and the butter.",
  "after": {
   "1": "Meanwhile put the couscous in a bowl with a pinch of salt and 1/2 tbsp oil, pour over 150 ml boiling water (or broth from the pot), cover for 5 minutes, then fluff with a fork and the butter.",
   "3": "Meanwhile put the couscous in a bowl with a pinch of salt and 1 1/2 tbsp oil, pour over 450 ml boiling water (or broth from the pot), cover for 5 minutes, then fluff with a fork and the butter.",
   "4": "Meanwhile put the couscous in a bowl with a pinch of salt and 2 tbsp oil, pour over 600 ml boiling water (or broth from the pot), cover for 5 minutes, then fluff with a fork and the butter.",
   "6": "Meanwhile put the couscous in a bowl with a pinch of salt and 3 tbsp oil, pour over 900 ml boiling water (or broth from the pot), cover for 5 minutes, then fluff with a fork and the butter."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_couscous",
  "k": 2,
  "before": "Pendant ce temps, mettez la semoule dans un saladier avec une pincée de sel et 1 c. à soupe d'huile, versez 30 cl d'eau bouillante (ou de bouillon), couvrez 5 minutes puis égrenez à la fourchette avec le beurre.",
  "after": {
   "1": "Pendant ce temps, mettez la semoule dans un saladier avec une pincée de sel et 1/2 c. à soupe d'huile, versez 15 cl d'eau bouillante (ou de bouillon), couvrez 5 minutes puis égrenez à la fourchette avec le beurre.",
   "3": "Pendant ce temps, mettez la semoule dans un saladier avec une pincée de sel et 1 1/2 c. à soupe d'huile, versez 45 cl d'eau bouillante (ou de bouillon), couvrez 5 minutes puis égrenez à la fourchette avec le beurre.",
   "4": "Pendant ce temps, mettez la semoule dans un saladier avec une pincée de sel et 2 c. à soupe d'huile, versez 60 cl d'eau bouillante (ou de bouillon), couvrez 5 minutes puis égrenez à la fourchette avec le beurre.",
   "6": "Pendant ce temps, mettez la semoule dans un saladier avec une pincée de sel et 3 c. à soupe d'huile, versez 90 cl d'eau bouillante (ou de bouillon), couvrez 5 minutes puis égrenez à la fourchette avec le beurre."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_blanquette",
  "k": 2,
  "before": "Melt the butter, stir in the flour for 1 minute, then whisk in 400 ml of the stock and simmer for 10 minutes, stirring, until smooth and thick.",
  "after": {
   "1": "Melt the butter, stir in the flour for 1 minute, then whisk in 200 ml of the stock and simmer for 10 minutes, stirring, until smooth and thick.",
   "3": "Melt the butter, stir in the flour for 1 minute, then whisk in 600 ml of the stock and simmer for 10 minutes, stirring, until smooth and thick.",
   "4": "Melt the butter, stir in the flour for 1 minute, then whisk in 800 ml of the stock and simmer for 10 minutes, stirring, until smooth and thick.",
   "6": "Melt the butter, stir in the flour for 1 minute, then whisk in 1200 ml of the stock and simmer for 10 minutes, stirring, until smooth and thick."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_blanquette",
  "k": 2,
  "before": "Faites fondre le beurre, ajoutez la farine en remuant 1 minute, puis versez 40 cl de bouillon en fouettant et laissez épaissir 10 minutes en remuant.",
  "after": {
   "1": "Faites fondre le beurre, ajoutez la farine en remuant 1 minute, puis versez 20 cl de bouillon en fouettant et laissez épaissir 10 minutes en remuant.",
   "3": "Faites fondre le beurre, ajoutez la farine en remuant 1 minute, puis versez 60 cl de bouillon en fouettant et laissez épaissir 10 minutes en remuant.",
   "4": "Faites fondre le beurre, ajoutez la farine en remuant 1 minute, puis versez 80 cl de bouillon en fouettant et laissez épaissir 10 minutes en remuant.",
   "6": "Faites fondre le beurre, ajoutez la farine en remuant 1 minute, puis versez 120 cl de bouillon en fouettant et laissez épaissir 10 minutes en remuant."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_vermicelle",
  "k": 1,
  "before": "Add the onion stuck with the clove, the carrots, leek and celery in large pieces, the herbs and 1 tsp salt. Simmer gently, half-covered, for 40 minutes, until the chicken is cooked through and comes away from the bone.",
  "after": {
   "1": "Add the onion stuck with the clove, the carrots, leek and celery in large pieces, the herbs and 1/2 tsp salt. Simmer gently, half-covered, for 40 minutes, until the chicken is cooked through and comes away from the bone.",
   "3": "Add the onion stuck with the clove, the carrots, leek and celery in large pieces, the herbs and 1 1/2 tsp salt. Simmer gently, half-covered, for 40 minutes, until the chicken is cooked through and comes away from the bone.",
   "4": "Add the onion stuck with the clove, the carrots, leek and celery in large pieces, the herbs and 2 tsp salt. Simmer gently, half-covered, for 40 minutes, until the chicken is cooked through and comes away from the bone.",
   "6": "Add the onion stuck with the clove, the carrots, leek and celery in large pieces, the herbs and 3 tsp salt. Simmer gently, half-covered, for 40 minutes, until the chicken is cooked through and comes away from the bone."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_vermicelle",
  "k": 1,
  "before": "Ajoutez l'oignon piqué du clou de girofle, les carottes, le poireau et le céleri en gros morceaux, les herbes et 1 c. à café de sel. Laissez frémir doucement, à demi couvert, 40 minutes, jusqu'à ce que le poulet soit cuit à cœur et se détache de l'os.",
  "after": {
   "1": "Ajoutez l'oignon piqué du clou de girofle, les carottes, le poireau et le céleri en gros morceaux, les herbes et 1/2 c. à café de sel. Laissez frémir doucement, à demi couvert, 40 minutes, jusqu'à ce que le poulet soit cuit à cœur et se détache de l'os.",
   "3": "Ajoutez l'oignon piqué du clou de girofle, les carottes, le poireau et le céleri en gros morceaux, les herbes et 1 1/2 c. à café de sel. Laissez frémir doucement, à demi couvert, 40 minutes, jusqu'à ce que le poulet soit cuit à cœur et se détache de l'os.",
   "4": "Ajoutez l'oignon piqué du clou de girofle, les carottes, le poireau et le céleri en gros morceaux, les herbes et 2 c. à café de sel. Laissez frémir doucement, à demi couvert, 40 minutes, jusqu'à ce que le poulet soit cuit à cœur et se détache de l'os.",
   "6": "Ajoutez l'oignon piqué du clou de girofle, les carottes, le poireau et le céleri en gros morceaux, les herbes et 3 c. à café de sel. Laissez frémir doucement, à demi couvert, 40 minutes, jusqu'à ce que le poulet soit cuit à cœur et se détache de l'os."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_croque",
  "k": 0,
  "before": "Heat the oven to 220°C. Make a thick béchamel: melt 20 g of the butter, stir in the flour for 1 minute, whisk in the milk and simmer for 3 minutes, stirring. Season with salt, pepper and nutmeg and stir in a third of the cheese.",
  "after": {
   "1": "Heat the oven to 220°C. Make a thick béchamel: melt 10 g of the butter, stir in the flour for 1 minute, whisk in the milk and simmer for 3 minutes, stirring. Season with salt, pepper and nutmeg and stir in a third of the cheese.",
   "3": "Heat the oven to 220°C. Make a thick béchamel: melt 30 g of the butter, stir in the flour for 1 minute, whisk in the milk and simmer for 3 minutes, stirring. Season with salt, pepper and nutmeg and stir in a third of the cheese.",
   "4": "Heat the oven to 220°C. Make a thick béchamel: melt 40 g of the butter, stir in the flour for 1 minute, whisk in the milk and simmer for 3 minutes, stirring. Season with salt, pepper and nutmeg and stir in a third of the cheese.",
   "6": "Heat the oven to 220°C. Make a thick béchamel: melt 60 g of the butter, stir in the flour for 1 minute, whisk in the milk and simmer for 3 minutes, stirring. Season with salt, pepper and nutmeg and stir in a third of the cheese."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_croque",
  "k": 0,
  "before": "Préchauffez le four à 220 °C. Préparez une béchamel épaisse : faites fondre 20 g de beurre, ajoutez la farine en remuant 1 minute, versez le lait en fouettant et laissez épaissir 3 minutes. Salez, poivrez, muscadez et ajoutez un tiers du fromage.",
  "after": {
   "1": "Préchauffez le four à 220 °C. Préparez une béchamel épaisse : faites fondre 10 g de beurre, ajoutez la farine en remuant 1 minute, versez le lait en fouettant et laissez épaissir 3 minutes. Salez, poivrez, muscadez et ajoutez un tiers du fromage.",
   "3": "Préchauffez le four à 220 °C. Préparez une béchamel épaisse : faites fondre 30 g de beurre, ajoutez la farine en remuant 1 minute, versez le lait en fouettant et laissez épaissir 3 minutes. Salez, poivrez, muscadez et ajoutez un tiers du fromage.",
   "4": "Préchauffez le four à 220 °C. Préparez une béchamel épaisse : faites fondre 40 g de beurre, ajoutez la farine en remuant 1 minute, versez le lait en fouettant et laissez épaissir 3 minutes. Salez, poivrez, muscadez et ajoutez un tiers du fromage.",
   "6": "Préchauffez le four à 220 °C. Préparez une béchamel épaisse : faites fondre 60 g de beurre, ajoutez la farine en remuant 1 minute, versez le lait en fouettant et laissez épaissir 3 minutes. Salez, poivrez, muscadez et ajoutez un tiers du fromage."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_endives",
  "k": 0,
  "before": "Trim the base of the endives and cut out the small bitter cone. Cook them in a covered pan with 10 g of the butter, the lemon juice, sugar and a pinch of salt for 20-25 minutes over low heat, until tender. Drain well, pressing out the water.",
  "after": {
   "1": "Trim the base of the endives and cut out the small bitter cone. Cook them in a covered pan with 5 g of the butter, the lemon juice, sugar and a pinch of salt for 20-25 minutes over low heat, until tender. Drain well, pressing out the water.",
   "3": "Trim the base of the endives and cut out the small bitter cone. Cook them in a covered pan with 15 g of the butter, the lemon juice, sugar and a pinch of salt for 20-25 minutes over low heat, until tender. Drain well, pressing out the water.",
   "4": "Trim the base of the endives and cut out the small bitter cone. Cook them in a covered pan with 20 g of the butter, the lemon juice, sugar and a pinch of salt for 20-25 minutes over low heat, until tender. Drain well, pressing out the water.",
   "6": "Trim the base of the endives and cut out the small bitter cone. Cook them in a covered pan with 30 g of the butter, the lemon juice, sugar and a pinch of salt for 20-25 minutes over low heat, until tender. Drain well, pressing out the water."
  }
 },
 {
  "lang": "fr",
  "cc": "FR",
  "id": "fr_endives",
  "k": 0,
  "before": "Coupez la base des endives et retirez le petit cône amer. Faites-les cuire à couvert avec 10 g de beurre, le jus de citron, le sucre et une pincée de sel 20 à 25 minutes à feu doux, jusqu'à ce qu'elles soient tendres. Égouttez-les bien en les pressant.",
  "after": {
   "1": "Coupez la base des endives et retirez le petit cône amer. Faites-les cuire à couvert avec 5 g de beurre, le jus de citron, le sucre et une pincée de sel 20 à 25 minutes à feu doux, jusqu'à ce qu'elles soient tendres. Égouttez-les bien en les pressant.",
   "3": "Coupez la base des endives et retirez le petit cône amer. Faites-les cuire à couvert avec 15 g de beurre, le jus de citron, le sucre et une pincée de sel 20 à 25 minutes à feu doux, jusqu'à ce qu'elles soient tendres. Égouttez-les bien en les pressant.",
   "4": "Coupez la base des endives et retirez le petit cône amer. Faites-les cuire à couvert avec 20 g de beurre, le jus de citron, le sucre et une pincée de sel 20 à 25 minutes à feu doux, jusqu'à ce qu'elles soient tendres. Égouttez-les bien en les pressant.",
   "6": "Coupez la base des endives et retirez le petit cône amer. Faites-les cuire à couvert avec 30 g de beurre, le jus de citron, le sucre et une pincée de sel 20 à 25 minutes à feu doux, jusqu'à ce qu'elles soient tendres. Égouttez-les bien en les pressant."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_japchae",
  "k": 0,
  "before": "Soak the noodles in warm water for 30 minutes. Mix the meat and sliced shiitake with 1 tbsp soy sauce, 1 tsp sugar and the garlic.",
  "after": {
   "1": "Soak the noodles in warm water for 30 minutes. Mix the meat and sliced shiitake with 1/2 tbsp soy sauce, 1/2 tsp sugar and the garlic.",
   "3": "Soak the noodles in warm water for 30 minutes. Mix the meat and sliced shiitake with 1 1/2 tbsp soy sauce, 1 1/2 tsp sugar and the garlic.",
   "4": "Soak the noodles in warm water for 30 minutes. Mix the meat and sliced shiitake with 2 tbsp soy sauce, 2 tsp sugar and the garlic.",
   "6": "Soak the noodles in warm water for 30 minutes. Mix the meat and sliced shiitake with 3 tbsp soy sauce, 3 tsp sugar and the garlic."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_japchae",
  "k": 0,
  "before": "당면은 따뜻한 물에 30분 불린다. 고기와 채 썬 표고버섯은 간장 1큰술, 설탕 1작은술, 마늘로 양념한다.",
  "after": {
   "1": "당면은 따뜻한 물에 30분 불린다. 고기와 채 썬 표고버섯은 간장 1/2큰술, 설탕 1/2작은술, 마늘로 양념한다.",
   "3": "당면은 따뜻한 물에 30분 불린다. 고기와 채 썬 표고버섯은 간장 1 1/2큰술, 설탕 1 1/2작은술, 마늘로 양념한다.",
   "4": "당면은 따뜻한 물에 30분 불린다. 고기와 채 썬 표고버섯은 간장 2큰술, 설탕 2작은술, 마늘로 양념한다.",
   "6": "당면은 따뜻한 물에 30분 불린다. 고기와 채 썬 표고버섯은 간장 3큰술, 설탕 3작은술, 마늘로 양념한다."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_japchae",
  "k": 3,
  "before": "Boil the noodles for 6 minutes, drain and cut a few times with scissors. Stir-fry them with the remaining soy sauce and sugar and 1 tbsp sesame oil for 2 minutes until glossy.",
  "after": {
   "1": "Boil the noodles for 6 minutes, drain and cut a few times with scissors. Stir-fry them with the remaining soy sauce and sugar and 1/2 tbsp sesame oil for 2 minutes until glossy.",
   "3": "Boil the noodles for 6 minutes, drain and cut a few times with scissors. Stir-fry them with the remaining soy sauce and sugar and 1 1/2 tbsp sesame oil for 2 minutes until glossy.",
   "4": "Boil the noodles for 6 minutes, drain and cut a few times with scissors. Stir-fry them with the remaining soy sauce and sugar and 2 tbsp sesame oil for 2 minutes until glossy.",
   "6": "Boil the noodles for 6 minutes, drain and cut a few times with scissors. Stir-fry them with the remaining soy sauce and sugar and 3 tbsp sesame oil for 2 minutes until glossy."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_japchae",
  "k": 3,
  "before": "당면은 6분 삶아 건지고 가위로 몇 번 자른다. 남은 간장, 설탕, 참기름 1큰술을 넣어 윤기 나게 2분 볶는다.",
  "after": {
   "1": "당면은 6분 삶아 건지고 가위로 몇 번 자른다. 남은 간장, 설탕, 참기름 1/2큰술을 넣어 윤기 나게 2분 볶는다.",
   "3": "당면은 6분 삶아 건지고 가위로 몇 번 자른다. 남은 간장, 설탕, 참기름 1 1/2큰술을 넣어 윤기 나게 2분 볶는다.",
   "4": "당면은 6분 삶아 건지고 가위로 몇 번 자른다. 남은 간장, 설탕, 참기름 2큰술을 넣어 윤기 나게 2분 볶는다.",
   "6": "당면은 6분 삶아 건지고 가위로 몇 번 자른다. 남은 간장, 설탕, 참기름 3큰술을 넣어 윤기 나게 2분 볶는다."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_bugeoguk",
  "k": 0,
  "before": "Rinse the pollack quickly and soak it in a little water for 5 minutes. Squeeze it out (keep the water), cut into 4 cm pieces and mix with 1/2 tbsp soup soy sauce.",
  "after": {
   "1": "Rinse the pollack quickly and soak it in a little water for 5 minutes. Squeeze it out (keep the water), cut into 4 cm pieces and mix with 1/4 tbsp soup soy sauce.",
   "3": "Rinse the pollack quickly and soak it in a little water for 5 minutes. Squeeze it out (keep the water), cut into 4 cm pieces and mix with 3/4 tbsp soup soy sauce.",
   "4": "Rinse the pollack quickly and soak it in a little water for 5 minutes. Squeeze it out (keep the water), cut into 4 cm pieces and mix with 1 tbsp soup soy sauce.",
   "6": "Rinse the pollack quickly and soak it in a little water for 5 minutes. Squeeze it out (keep the water), cut into 4 cm pieces and mix with 1 1/2 tbsp soup soy sauce."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_bugeoguk",
  "k": 2,
  "before": "Add the soaking water topped up with water to 800 ml and the garlic. Bring to the boil and simmer over medium heat for 10 minutes until the broth turns milky.",
  "after": {
   "1": "Add the soaking water topped up with water to 400 ml and the garlic. Bring to the boil and simmer over medium heat for 10 minutes until the broth turns milky.",
   "3": "Add the soaking water topped up with water to 1200 ml and the garlic. Bring to the boil and simmer over medium heat for 10 minutes until the broth turns milky.",
   "4": "Add the soaking water topped up with water to 1600 ml and the garlic. Bring to the boil and simmer over medium heat for 10 minutes until the broth turns milky.",
   "6": "Add the soaking water topped up with water to 2400 ml and the garlic. Bring to the boil and simmer over medium heat for 10 minutes until the broth turns milky."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_bugeoguk",
  "k": 0,
  "before": "북어채를 재빨리 헹궈 물에 5분 담근다. 물기를 짜고 (불린 물은 남겨 둔다) 4cm로 잘라 국간장 1/2큰술에 무친다.",
  "after": {
   "1": "북어채를 재빨리 헹궈 물에 5분 담근다. 물기를 짜고 (불린 물은 남겨 둔다) 4cm로 잘라 국간장 1/4큰술에 무친다.",
   "3": "북어채를 재빨리 헹궈 물에 5분 담근다. 물기를 짜고 (불린 물은 남겨 둔다) 4cm로 잘라 국간장 3/4큰술에 무친다.",
   "4": "북어채를 재빨리 헹궈 물에 5분 담근다. 물기를 짜고 (불린 물은 남겨 둔다) 4cm로 잘라 국간장 1큰술에 무친다.",
   "6": "북어채를 재빨리 헹궈 물에 5분 담근다. 물기를 짜고 (불린 물은 남겨 둔다) 4cm로 잘라 국간장 1 1/2큰술에 무친다."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_bugeoguk",
  "k": 2,
  "before": "불린 물에 물을 더해 800ml로 맞춰 붓고 마늘을 넣는다. 끓어오르면 중불에서 국물이 뽀얘질 때까지 10분 끓인다.",
  "after": {
   "1": "불린 물에 물을 더해 400ml로 맞춰 붓고 마늘을 넣는다. 끓어오르면 중불에서 국물이 뽀얘질 때까지 10분 끓인다.",
   "3": "불린 물에 물을 더해 1200ml로 맞춰 붓고 마늘을 넣는다. 끓어오르면 중불에서 국물이 뽀얘질 때까지 10분 끓인다.",
   "4": "불린 물에 물을 더해 1600ml로 맞춰 붓고 마늘을 넣는다. 끓어오르면 중불에서 국물이 뽀얘질 때까지 10분 끓인다.",
   "6": "불린 물에 물을 더해 2400ml로 맞춰 붓고 마늘을 넣는다. 끓어오르면 중불에서 국물이 뽀얘질 때까지 10분 끓인다."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_kongbijijjigae",
  "k": 1,
  "before": "Blend the soaked beans with 300 ml of the water for 1–2 minutes until fine and creamy.",
  "after": {
   "1": "Blend the soaked beans with 150 ml of the water for 1–2 minutes until fine and creamy.",
   "3": "Blend the soaked beans with 450 ml of the water for 1–2 minutes until fine and creamy.",
   "4": "Blend the soaked beans with 600 ml of the water for 1–2 minutes until fine and creamy.",
   "6": "Blend the soaked beans with 900 ml of the water for 1–2 minutes until fine and creamy."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_kongbijijjigae",
  "k": 3,
  "before": "Add the remaining 100 ml water and bring to the boil, then pour in the ground beans. Cover and simmer over low heat for 15 minutes, scraping the bottom now and then so it does not scorch, until it smells nutty with no raw-bean taste.",
  "after": {
   "1": "Add the remaining 50 ml water and bring to the boil, then pour in the ground beans. Cover and simmer over low heat for 15 minutes, scraping the bottom now and then so it does not scorch, until it smells nutty with no raw-bean taste.",
   "3": "Add the remaining 150 ml water and bring to the boil, then pour in the ground beans. Cover and simmer over low heat for 15 minutes, scraping the bottom now and then so it does not scorch, until it smells nutty with no raw-bean taste.",
   "4": "Add the remaining 200 ml water and bring to the boil, then pour in the ground beans. Cover and simmer over low heat for 15 minutes, scraping the bottom now and then so it does not scorch, until it smells nutty with no raw-bean taste.",
   "6": "Add the remaining 300 ml water and bring to the boil, then pour in the ground beans. Cover and simmer over low heat for 15 minutes, scraping the bottom now and then so it does not scorch, until it smells nutty with no raw-bean taste."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_kongbijijjigae",
  "k": 1,
  "before": "불린 콩을 물 300ml와 함께 믹서에 1~2분 곱고 부드럽게 간다.",
  "after": {
   "1": "불린 콩을 물 150ml와 함께 믹서에 1~2분 곱고 부드럽게 간다.",
   "3": "불린 콩을 물 450ml와 함께 믹서에 1~2분 곱고 부드럽게 간다.",
   "4": "불린 콩을 물 600ml와 함께 믹서에 1~2분 곱고 부드럽게 간다.",
   "6": "불린 콩을 물 900ml와 함께 믹서에 1~2분 곱고 부드럽게 간다."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_kongbijijjigae",
  "k": 3,
  "before": "나머지 물 100ml를 붓고 끓으면 간 콩을 붓는다. 뚜껑을 덮고 약불에서 15분, 바닥이 눌지 않게 가끔 긁어 가며 날콩 냄새 없이 고소한 냄새가 날 때까지 끓인다.",
  "after": {
   "1": "나머지 물 50ml를 붓고 끓으면 간 콩을 붓는다. 뚜껑을 덮고 약불에서 15분, 바닥이 눌지 않게 가끔 긁어 가며 날콩 냄새 없이 고소한 냄새가 날 때까지 끓인다.",
   "3": "나머지 물 150ml를 붓고 끓으면 간 콩을 붓는다. 뚜껑을 덮고 약불에서 15분, 바닥이 눌지 않게 가끔 긁어 가며 날콩 냄새 없이 고소한 냄새가 날 때까지 끓인다.",
   "4": "나머지 물 200ml를 붓고 끓으면 간 콩을 붓는다. 뚜껑을 덮고 약불에서 15분, 바닥이 눌지 않게 가끔 긁어 가며 날콩 냄새 없이 고소한 냄새가 날 때까지 끓인다.",
   "6": "나머지 물 300ml를 붓고 끓으면 간 콩을 붓는다. 뚜껑을 덮고 약불에서 15분, 바닥이 눌지 않게 가끔 긁어 가며 날콩 냄새 없이 고소한 냄새가 날 때까지 끓인다."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_dakgangjeong",
  "k": 0,
  "before": "Cut the chicken into 3 cm pieces and season with salt, pepper and 1 tsp garlic. Leave for 10 minutes.",
  "after": {
   "1": "Cut the chicken into 3 cm pieces and season with salt, pepper and 1/2 tsp garlic. Leave for 10 minutes.",
   "3": "Cut the chicken into 3 cm pieces and season with salt, pepper and 1 1/2 tsp garlic. Leave for 10 minutes.",
   "4": "Cut the chicken into 3 cm pieces and season with salt, pepper and 2 tsp garlic. Leave for 10 minutes.",
   "6": "Cut the chicken into 3 cm pieces and season with salt, pepper and 3 tsp garlic. Leave for 10 minutes."
  }
 },
 {
  "lang": "ko",
  "cc": "KR",
  "id": "kr_dakgangjeong",
  "k": 0,
  "before": "닭고기는 3cm 크기로 썰고 소금, 후춧가루, 마늘 1작은술로 밑간해 10분 둔다.",
  "after": {
   "1": "닭고기는 3cm 크기로 썰고 소금, 후춧가루, 마늘 1/2작은술로 밑간해 10분 둔다.",
   "3": "닭고기는 3cm 크기로 썰고 소금, 후춧가루, 마늘 1 1/2작은술로 밑간해 10분 둔다.",
   "4": "닭고기는 3cm 크기로 썰고 소금, 후춧가루, 마늘 2작은술로 밑간해 10분 둔다.",
   "6": "닭고기는 3cm 크기로 썰고 소금, 후춧가루, 마늘 3작은술로 밑간해 10분 둔다."
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_panangmoo",
  "k": 0,
  "before": "Heat the oil and 150 ml of the coconut milk in a wok over medium heat for about 3 minutes until the oil separates, then fry the curry paste for 2 minutes.",
  "after": {
   "1": "Heat the oil and 75 ml of the coconut milk in a wok over medium heat for about 3 minutes until the oil separates, then fry the curry paste for 2 minutes.",
   "3": "Heat the oil and 230 ml of the coconut milk in a wok over medium heat for about 3 minutes until the oil separates, then fry the curry paste for 2 minutes.",
   "4": "Heat the oil and 300 ml of the coconut milk in a wok over medium heat for about 3 minutes until the oil separates, then fry the curry paste for 2 minutes.",
   "6": "Heat the oil and 450 ml of the coconut milk in a wok over medium heat for about 3 minutes until the oil separates, then fry the curry paste for 2 minutes."
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_panangmoo",
  "k": 2,
  "before": "Add the rest of the coconut milk (keep 2 tbsp for the top), the fish sauce and palm sugar and simmer gently for 8–10 minutes until thick and the pork is tender.",
  "after": {
   "1": "Add the rest of the coconut milk (keep 1 tbsp for the top), the fish sauce and palm sugar and simmer gently for 8–10 minutes until thick and the pork is tender.",
   "3": "Add the rest of the coconut milk (keep 3 tbsp for the top), the fish sauce and palm sugar and simmer gently for 8–10 minutes until thick and the pork is tender.",
   "4": "Add the rest of the coconut milk (keep 4 tbsp for the top), the fish sauce and palm sugar and simmer gently for 8–10 minutes until thick and the pork is tender.",
   "6": "Add the rest of the coconut milk (keep 6 tbsp for the top), the fish sauce and palm sugar and simmer gently for 8–10 minutes until thick and the pork is tender."
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_panangmoo",
  "k": 0,
  "before": "ตั้งกระทะไฟกลาง ใส่น้ำมันและกะทิ 150 มล. เคี่ยวประมาณ 3 นาทีจนแตกมัน ใส่พริกแกงผัด 2 นาที",
  "after": {
   "1": "ตั้งกระทะไฟกลาง ใส่น้ำมันและกะทิ 75 มล. เคี่ยวประมาณ 3 นาทีจนแตกมัน ใส่พริกแกงผัด 2 นาที",
   "3": "ตั้งกระทะไฟกลาง ใส่น้ำมันและกะทิ 230 มล. เคี่ยวประมาณ 3 นาทีจนแตกมัน ใส่พริกแกงผัด 2 นาที",
   "4": "ตั้งกระทะไฟกลาง ใส่น้ำมันและกะทิ 300 มล. เคี่ยวประมาณ 3 นาทีจนแตกมัน ใส่พริกแกงผัด 2 นาที",
   "6": "ตั้งกระทะไฟกลาง ใส่น้ำมันและกะทิ 450 มล. เคี่ยวประมาณ 3 นาทีจนแตกมัน ใส่พริกแกงผัด 2 นาที"
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_panangmoo",
  "k": 2,
  "before": "ใส่กะทิที่เหลือ (แบ่งไว้ราดหน้า 2 ช้อนโต๊ะ) น้ำปลา และน้ำตาลปี๊บ เคี่ยวไฟอ่อน 8–10 นาทีจนข้นและหมูนุ่ม",
  "after": {
   "1": "ใส่กะทิที่เหลือ (แบ่งไว้ราดหน้า 1 ช้อนโต๊ะ) น้ำปลา และน้ำตาลปี๊บ เคี่ยวไฟอ่อน 8–10 นาทีจนข้นและหมูนุ่ม",
   "3": "ใส่กะทิที่เหลือ (แบ่งไว้ราดหน้า 3 ช้อนโต๊ะ) น้ำปลา และน้ำตาลปี๊บ เคี่ยวไฟอ่อน 8–10 นาทีจนข้นและหมูนุ่ม",
   "4": "ใส่กะทิที่เหลือ (แบ่งไว้ราดหน้า 4 ช้อนโต๊ะ) น้ำปลา และน้ำตาลปี๊บ เคี่ยวไฟอ่อน 8–10 นาทีจนข้นและหมูนุ่ม",
   "6": "ใส่กะทิที่เหลือ (แบ่งไว้ราดหน้า 6 ช้อนโต๊ะ) น้ำปลา และน้ำตาลปี๊บ เคี่ยวไฟอ่อน 8–10 นาทีจนข้นและหมูนุ่ม"
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_huachaitao",
  "k": 1,
  "before": "Bring 1.2 litres of fresh water to the boil with the ribs and the crushed garlic, coriander roots and peppercorns. Simmer covered over low heat for 35–40 minutes until the meat is tender and cooked through.",
  "after": {
   "1": "Bring 0.6 litres of fresh water to the boil with the ribs and the crushed garlic, coriander roots and peppercorns. Simmer covered over low heat for 35–40 minutes until the meat is tender and cooked through.",
   "3": "Bring 1.8 litres of fresh water to the boil with the ribs and the crushed garlic, coriander roots and peppercorns. Simmer covered over low heat for 35–40 minutes until the meat is tender and cooked through.",
   "4": "Bring 2.4 litres of fresh water to the boil with the ribs and the crushed garlic, coriander roots and peppercorns. Simmer covered over low heat for 35–40 minutes until the meat is tender and cooked through.",
   "6": "Bring 3.6 litres of fresh water to the boil with the ribs and the crushed garlic, coriander roots and peppercorns. Simmer covered over low heat for 35–40 minutes until the meat is tender and cooked through."
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_huachaitao",
  "k": 1,
  "before": "ต้มน้ำใหม่ 1.2 ลิตรให้เดือด ใส่ซี่โครง กระเทียม รากผักชี และพริกไทยทุบ ปิดฝาเคี่ยวไฟอ่อน 35–40 นาทีจนเนื้อนุ่มและสุกทั่ว",
  "after": {
   "1": "ต้มน้ำใหม่ 0.6 ลิตรให้เดือด ใส่ซี่โครง กระเทียม รากผักชี และพริกไทยทุบ ปิดฝาเคี่ยวไฟอ่อน 35–40 นาทีจนเนื้อนุ่มและสุกทั่ว",
   "3": "ต้มน้ำใหม่ 1.8 ลิตรให้เดือด ใส่ซี่โครง กระเทียม รากผักชี และพริกไทยทุบ ปิดฝาเคี่ยวไฟอ่อน 35–40 นาทีจนเนื้อนุ่มและสุกทั่ว",
   "4": "ต้มน้ำใหม่ 2.4 ลิตรให้เดือด ใส่ซี่โครง กระเทียม รากผักชี และพริกไทยทุบ ปิดฝาเคี่ยวไฟอ่อน 35–40 นาทีจนเนื้อนุ่มและสุกทั่ว",
   "6": "ต้มน้ำใหม่ 3.6 ลิตรให้เดือด ใส่ซี่โครง กระเทียม รากผักชี และพริกไทยทุบ ปิดฝาเคี่ยวไฟอ่อน 35–40 นาทีจนเนื้อนุ่มและสุกทั่ว"
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_marayatsai",
  "k": 1,
  "before": "Pound the garlic, coriander roots and pepper, and mix into the pork with 1/2 tbsp soy sauce (and the glass noodles and mushrooms). Pack the filling firmly into the rings.",
  "after": {
   "1": "Pound the garlic, coriander roots and pepper, and mix into the pork with 1/4 tbsp soy sauce (and the glass noodles and mushrooms). Pack the filling firmly into the rings.",
   "3": "Pound the garlic, coriander roots and pepper, and mix into the pork with 3/4 tbsp soy sauce (and the glass noodles and mushrooms). Pack the filling firmly into the rings.",
   "4": "Pound the garlic, coriander roots and pepper, and mix into the pork with 1 tbsp soy sauce (and the glass noodles and mushrooms). Pack the filling firmly into the rings.",
   "6": "Pound the garlic, coriander roots and pepper, and mix into the pork with 1 1/2 tbsp soy sauce (and the glass noodles and mushrooms). Pack the filling firmly into the rings."
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_marayatsai",
  "k": 1,
  "before": "โขลกกระเทียม รากผักชี และพริกไทย คลุกกับหมูสับและซีอิ๊วขาว 1/2 ช้อนโต๊ะ (พร้อมวุ้นเส้นและเห็ดหอม) ยัดไส้ลงในมะระให้แน่น",
  "after": {
   "1": "โขลกกระเทียม รากผักชี และพริกไทย คลุกกับหมูสับและซีอิ๊วขาว 1/4 ช้อนโต๊ะ (พร้อมวุ้นเส้นและเห็ดหอม) ยัดไส้ลงในมะระให้แน่น",
   "3": "โขลกกระเทียม รากผักชี และพริกไทย คลุกกับหมูสับและซีอิ๊วขาว 3/4 ช้อนโต๊ะ (พร้อมวุ้นเส้นและเห็ดหอม) ยัดไส้ลงในมะระให้แน่น",
   "4": "โขลกกระเทียม รากผักชี และพริกไทย คลุกกับหมูสับและซีอิ๊วขาว 1 ช้อนโต๊ะ (พร้อมวุ้นเส้นและเห็ดหอม) ยัดไส้ลงในมะระให้แน่น",
   "6": "โขลกกระเทียม รากผักชี และพริกไทย คลุกกับหมูสับและซีอิ๊วขาว 1 1/2 ช้อนโต๊ะ (พร้อมวุ้นเส้นและเห็ดหอม) ยัดไส้ลงในมะระให้แน่น"
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_tomsompla",
  "k": 0,
  "before": "Soak the tamarind in 100 ml warm water for 5 minutes, squeeze and strain to get the juice.",
  "after": {
   "1": "Soak the tamarind in 50 ml warm water for 5 minutes, squeeze and strain to get the juice.",
   "3": "Soak the tamarind in 150 ml warm water for 5 minutes, squeeze and strain to get the juice.",
   "4": "Soak the tamarind in 200 ml warm water for 5 minutes, squeeze and strain to get the juice.",
   "6": "Soak the tamarind in 300 ml warm water for 5 minutes, squeeze and strain to get the juice."
  }
 },
 {
  "lang": "th",
  "cc": "TH",
  "id": "th_tomsompla",
  "k": 0,
  "before": "แช่มะขามเปียกในน้ำอุ่น 100 มล. 5 นาที คั้นและกรองเอาแต่น้ำ",
  "after": {
   "1": "แช่มะขามเปียกในน้ำอุ่น 50 มล. 5 นาที คั้นและกรองเอาแต่น้ำ",
   "3": "แช่มะขามเปียกในน้ำอุ่น 150 มล. 5 นาที คั้นและกรองเอาแต่น้ำ",
   "4": "แช่มะขามเปียกในน้ำอุ่น 200 มล. 5 นาที คั้นและกรองเอาแต่น้ำ",
   "6": "แช่มะขามเปียกในน้ำอุ่น 300 มล. 5 นาที คั้นและกรองเอาแต่น้ำ"
  }
 }
];
const SAME = [
 {
  "lang": "ja",
  "why": "温度・時間・大きさはそのまま",
  "before": "オーブンを200℃に温め、20分焼く。鶏肉は2cm角に切る。",
  "after": null
 },
 {
  "lang": "ja",
  "why": "個数（作る数）はそのまま",
  "before": "肉だねを12個に丸め、4等分にする。",
  "after": null
 },
 {
  "lang": "ja",
  "why": "ずつ はそのまま",
  "before": "ワンタンの皮に小さじ1ずつのせる。",
  "after": null
 },
 {
  "lang": "ja",
  "why": "各〜 はそのまま",
  "before": "各お椀に卵1個を割り入れる。",
  "after": null
 },
 {
  "lang": "ja",
  "why": "1枚に〜 はそのまま",
  "before": "皮1枚に具を大さじ2のせる。",
  "after": null
 },
 {
  "lang": "ja",
  "why": "お玉1杯 はそのまま",
  "before": "ゆで汁をお玉1杯取っておく。",
  "after": null
 },
 {
  "lang": "ja",
  "why": "材料名のすぐあとでない個数はそのまま",
  "before": "もう1個の玉ねぎは薄切りにする。",
  "after": null
 },
 {
  "lang": "en",
  "why": "°F・gas mark・inch",
  "before": "Bake at 350°F (gas mark 4) for 25 minutes in a 9 inch pan.",
  "after": null
 },
 {
  "lang": "en",
  "why": "per",
  "before": "Roast 20 minutes per 500 g plus 20 minutes.",
  "after": null
 },
 {
  "lang": "en",
  "why": "each",
  "before": "Put 1 tsp of oil in each hole of a 12-hole tin.",
  "after": null
 },
 {
  "lang": "en",
  "why": "缶の大きさ",
  "before": "Add 1 (400 g) can of tomatoes.",
  "after": null
 },
 {
  "lang": "en",
  "why": "缶の大きさ",
  "before": "Stir in a 400 g can of chickpeas.",
  "after": null
 },
 {
  "lang": "en",
  "why": "4 x 100 g",
  "before": "Cut into 4 x 100 g portions.",
  "after": null
 },
 {
  "lang": "fr",
  "why": "°C・thermostat・時間",
  "before": "Préchauffez le four à 180 °C (th. 6) et faites cuire 1 h 30.",
  "after": null
 },
 {
  "lang": "ko",
  "why": "温度・大きさ・時間",
  "before": "오븐을 180°C로 예열하고 3cm 크기로 썰어 10분 굽는다.",
  "after": null
 },
 {
  "lang": "th",
  "why": "温度・時間・大きさ",
  "before": "อบที่ 180 °C 20 นาที หั่นชิ้น 2 ซม.",
  "after": null
 },
 {
  "lang": "en",
  "before": "Whisk in 1/2 cup milk and 1 1/2 cups stock, then 8 oz cheese and 1 lb pasta.",
  "after": {
   "1": "Whisk in 1/4 cup milk and 3/4 cup stock, then 4 oz cheese and 1/2 lb pasta.",
   "3": "Whisk in 3/4 cup milk and 2 1/4 cups stock, then 12 oz cheese and 1 1/2 lb pasta.",
   "4": "Whisk in 1 cup milk and 3 cups stock, then 16 oz cheese and 2 lb pasta.",
   "6": "Whisk in 1 1/2 cups milk and 4 1/2 cups stock, then 24 oz cheese and 3 lb pasta."
  }
 },
 {
  "lang": "ja",
  "before": "水カップ1と1/2、酒大さじ1〜2、塩小さじ1/2、200ccの湯。",
  "after": {
   "1": "水カップ3/4、酒大さじ1/2〜1、塩小さじ1/4、100ccの湯。",
   "3": "水カップ2と1/4、酒大さじ1と1/2〜3、塩小さじ3/4、300ccの湯。",
   "4": "水カップ3、酒大さじ2〜4、塩小さじ1、400ccの湯。",
   "6": "水カップ4と1/2、酒大さじ3〜6、塩小さじ1と1/2、600ccの湯。"
  }
 },
 {
  "lang": "fr",
  "before": "Versez 1,5 l d’eau et 2 cuillères à soupe d’huile.",
  "after": {
   "1": "Versez 0,8 l d’eau et 1 cuillère à soupe d’huile.",
   "3": "Versez 2,3 l d’eau et 3 cuillères à soupe d’huile.",
   "4": "Versez 3 l d’eau et 4 cuillères à soupe d’huile.",
   "6": "Versez 4,5 l d’eau et 6 cuillères à soupe d’huile."
  }
 }
];
let fail = 0, n = 0;
const check = (label, got, want) => { n++; if (got !== want){ fail++; console.log("NG " + label + "\n   want: " + want + "\n   got:  " + got); } };
for (const c of REAL){
    const st = steps.find(x => x.lang === c.lang && x.cc === c.cc && x.id === c.id && x.k === c.k && x.s === c.before);
    if (!st || st.s !== c.before){ fail++; console.log("NG レシピの文が変わった: " + c.cc + " " + c.id + " #" + c.k); continue; }
    for (const sv of [1, 3, 4, 6]) check(`${c.lang} ${c.id} #${c.k} ${sv}人`, scaleSteps(c.before, sv / 2, st.names).s, c.after[sv]);
    check(`${c.lang} ${c.id} #${c.k} 2人`, scaleSteps(c.before, 1, st.names).s, c.before);
}
for (const c of SAME) for (const sv of [1, 3, 4, 6]) check(`${c.lang} ${c.why || ""} ${sv}人`, scaleSteps(c.before, sv / 2, ["卵", "玉ねぎ"]).s, c.after ? c.after[sv] : c.before);
// すべての手順で、温度・時間・大きさの数が変わらないこと
const KEEP = /\d+(?:[.,]\d+)?\s*(?:°C|°F|℃|cm|mm|分|秒|時間|minutes?|hours?|นาที|분|ซม)/g;
for (const st of steps) for (const sv of [1, 3, 6]){ const out = scaleSteps(st.s, sv / 2, st.names).s; const a = (st.s.match(KEEP) || []).join("|"), b = (out.match(KEEP) || []).join("|"); if (a !== b) check(`温度・時間・大きさ ${st.cc} ${st.id} #${st.k}`, b, a); }
console.log(`${n - fail}/${n} ok`); process.exit(fail ? 1 : 0);
