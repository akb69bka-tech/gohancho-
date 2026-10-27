// 作り方の文の中の分量を人数に合わせる（index.html の scaleSteps）のテスト。node tools/steps/scale-steps.test.mjs
// REAL: 実際のレシピ（日本・アメリカ・フランス・韓国・タイ ほか）の手順。人数 1・3・4・6 のときの文（2人分が元）
// SAME: 変えてはいけない文（温度・時間・大きさ・個数・ずつ・each・缶の大きさ など）
import fs from "fs"; import vm from "vm"; import path from "path"; import { fileURLToPath } from "url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../gohancho/");
const html = fs.readFileSync(ROOT + "index.html", "utf8");
const { scaleSteps, stepHasAmount } = new Function("LANG", "S", html.slice(html.indexOf("const FRAC = {"), html.indexOf("/* ---- 苦手な食材 ---- */")) + ";return {scaleSteps, stepHasAmount};")("ja", {settings:{servings:2}});
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
 },
 {
  "lang": "ja",
  "cc": "JP",
  "id": "takikomi",
  "k": 2,
  "before": "炊飯器に米と調味料を入れ、だしを2合の目盛りまで注ぐ。",
  "after": {
   "1": "炊飯器に米と調味料を入れ、だしを1合の目盛りまで注ぐ。",
   "3": "炊飯器に米と調味料を入れ、だしを3合の目盛りまで注ぐ。",
   "4": "炊飯器に米と調味料を入れ、だしを4合の目盛りまで注ぐ。",
   "6": "炊飯器に米と調味料を入れ、だしを6合の目盛りまで注ぐ。"
  }
 },
{
  "lang": "en",
  "cc": "JP",
  "id": "takikomi",
  "k": 2,
  "before": "Put the rice and seasonings in the rice cooker and add dashi up to the 2-go line.",
  "after": {
   "1": "Put the rice and seasonings in the rice cooker and add dashi up to the 1-go line.",
   "3": "Put the rice and seasonings in the rice cooker and add dashi up to the 3-go line.",
   "4": "Put the rice and seasonings in the rice cooker and add dashi up to the 4-go line.",
   "6": "Put the rice and seasonings in the rice cooker and add dashi up to the 6-go line."
  }
 },
{
  "lang": "ja",
  "cc": "JP",
  "id": "katsudon",
  "k": 0,
  "before": "豚肉は筋を切って塩こしょうをふり、小麦粉→溶き卵（1個分）→パン粉をつけて170℃の油で5〜6分揚げ、食べやすく切る。",
  "after": {
   "1": "豚肉は筋を切って塩こしょうをふり、小麦粉→溶き卵（1個分）→パン粉をつけて170℃の油で5〜6分揚げ、食べやすく切る。",
   "3": "豚肉は筋を切って塩こしょうをふり、小麦粉→溶き卵（2個分）→パン粉をつけて170℃の油で5〜6分揚げ、食べやすく切る。",
   "4": "豚肉は筋を切って塩こしょうをふり、小麦粉→溶き卵（2個分）→パン粉をつけて170℃の油で5〜6分揚げ、食べやすく切る。",
   "6": "豚肉は筋を切って塩こしょうをふり、小麦粉→溶き卵（3個分）→パン粉をつけて170℃の油で5〜6分揚げ、食べやすく切る。"
  }
 },
{
  "lang": "ja",
  "cc": "JP",
  "id": "katsudon",
  "k": 2,
  "before": "1人分ずつ、かつをのせて溶き卵1個分を回し入れ、ふたをして半熟になるまで1分煮る（小さな子どもや妊娠中の人の分は2分煮て卵に火を通す）。",
  "after": {
   "1": "1人分ずつ、かつをのせて溶き卵1個分を回し入れ、ふたをして半熟になるまで1分煮る（小さな子どもや妊娠中の人の分は2分煮て卵に火を通す）。",
   "3": "1人分ずつ、かつをのせて溶き卵1個分を回し入れ、ふたをして半熟になるまで1分煮る（小さな子どもや妊娠中の人の分は2分煮て卵に火を通す）。",
   "4": "1人分ずつ、かつをのせて溶き卵1個分を回し入れ、ふたをして半熟になるまで1分煮る（小さな子どもや妊娠中の人の分は2分煮て卵に火を通す）。",
   "6": "1人分ずつ、かつをのせて溶き卵1個分を回し入れ、ふたをして半熟になるまで1分煮る（小さな子どもや妊娠中の人の分は2分煮て卵に火を通す）。"
  }
 },
{
  "lang": "en",
  "cc": "JP",
  "id": "katsudon",
  "k": 0,
  "before": "Cut the sinew of the pork, season, coat with flour, beaten egg (1 egg) and panko, fry at 170°C for 5–6 minutes and cut into strips.",
  "after": {
   "1": "Cut the sinew of the pork, season, coat with flour, beaten egg (1 egg) and panko, fry at 170°C for 5–6 minutes and cut into strips.",
   "3": "Cut the sinew of the pork, season, coat with flour, beaten egg (2 eggs) and panko, fry at 170°C for 5–6 minutes and cut into strips.",
   "4": "Cut the sinew of the pork, season, coat with flour, beaten egg (2 eggs) and panko, fry at 170°C for 5–6 minutes and cut into strips.",
   "6": "Cut the sinew of the pork, season, coat with flour, beaten egg (3 eggs) and panko, fry at 170°C for 5–6 minutes and cut into strips."
  }
 },
{
  "lang": "en",
  "cc": "JP",
  "id": "katsudon",
  "k": 2,
  "before": "For each serving, add a cutlet, pour over 1 beaten egg, cover and cook 1 minute until just set (2 minutes, until the egg is fully set, for small children and during pregnancy).",
  "after": {
   "1": "For each serving, add a cutlet, pour over 1 beaten egg, cover and cook 1 minute until just set (2 minutes, until the egg is fully set, for small children and during pregnancy).",
   "3": "For each serving, add a cutlet, pour over 1 beaten egg, cover and cook 1 minute until just set (2 minutes, until the egg is fully set, for small children and during pregnancy).",
   "4": "For each serving, add a cutlet, pour over 1 beaten egg, cover and cook 1 minute until just set (2 minutes, until the egg is fully set, for small children and during pregnancy).",
   "6": "For each serving, add a cutlet, pour over 1 beaten egg, cover and cook 1 minute until just set (2 minutes, until the egg is fully set, for small children and during pregnancy)."
  }
 },
{
  "lang": "ja",
  "cc": "JP",
  "id": "omurice",
  "k": 2,
  "before": "1人分ずつ、卵2個と牛乳大さじ1を溶き、残りのバターを人数分に分けて半熟に焼く。",
  "after": {
   "1": "1人分ずつ、卵2個と牛乳大さじ1を溶き、残りのバターを人数分に分けて半熟に焼く。",
   "3": "1人分ずつ、卵2個と牛乳大さじ1を溶き、残りのバターを人数分に分けて半熟に焼く。",
   "4": "1人分ずつ、卵2個と牛乳大さじ1を溶き、残りのバターを人数分に分けて半熟に焼く。",
   "6": "1人分ずつ、卵2個と牛乳大さじ1を溶き、残りのバターを人数分に分けて半熟に焼く。"
  }
 },
{
  "lang": "ja",
  "cc": "JP",
  "id": "omurice",
  "k": 3,
  "before": "ケチャップライスを人数分に等分し、1人分ずつのせて包み、皿に返す。残りも同様に作り、ケチャップをかける。",
  "after": {
   "1": "ケチャップライスを人数分に等分し、1人分ずつのせて包み、皿に返す。残りも同様に作り、ケチャップをかける。",
   "3": "ケチャップライスを人数分に等分し、1人分ずつのせて包み、皿に返す。残りも同様に作り、ケチャップをかける。",
   "4": "ケチャップライスを人数分に等分し、1人分ずつのせて包み、皿に返す。残りも同様に作り、ケチャップをかける。",
   "6": "ケチャップライスを人数分に等分し、1人分ずつのせて包み、皿に返す。残りも同様に作り、ケチャップをかける。"
  }
 },
{
  "lang": "en",
  "cc": "JP",
  "id": "omurice",
  "k": 2,
  "before": "For each serving, beat 2 eggs with 1 tbsp milk and cook until half-set in an equal share of the remaining butter.",
  "after": {
   "1": "For each serving, beat 2 eggs with 1 tbsp milk and cook until half-set in an equal share of the remaining butter.",
   "3": "For each serving, beat 2 eggs with 1 tbsp milk and cook until half-set in an equal share of the remaining butter.",
   "4": "For each serving, beat 2 eggs with 1 tbsp milk and cook until half-set in an equal share of the remaining butter.",
   "6": "For each serving, beat 2 eggs with 1 tbsp milk and cook until half-set in an equal share of the remaining butter."
  }
 },
{
  "lang": "en",
  "cc": "JP",
  "id": "omurice",
  "k": 3,
  "before": "Divide the ketchup rice equally, place one portion on each omelet, fold it over and turn out onto a plate. Make the rest the same way and top with ketchup.",
  "after": {
   "1": "Divide the ketchup rice equally, place one portion on each omelet, fold it over and turn out onto a plate. Make the rest the same way and top with ketchup.",
   "3": "Divide the ketchup rice equally, place one portion on each omelet, fold it over and turn out onto a plate. Make the rest the same way and top with ketchup.",
   "4": "Divide the ketchup rice equally, place one portion on each omelet, fold it over and turn out onto a plate. Make the rest the same way and top with ketchup.",
   "6": "Divide the ketchup rice equally, place one portion on each omelet, fold it over and turn out onto a plate. Make the rest the same way and top with ketchup."
  }
 },
{
  "lang": "ja",
  "cc": "JP",
  "id": "nanban",
  "k": 0,
  "before": "卵1個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。",
  "after": {
   "1": "卵1個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。",
   "3": "卵2個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。",
   "4": "卵2個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。",
   "6": "卵3個はゆで卵にして刻み、玉ねぎのみじん切り・マヨネーズと混ぜてタルタルソースを作る。"
  }
 },
{
  "lang": "en",
  "cc": "JP",
  "id": "nanban",
  "k": 0,
  "before": "Hard-boil 1 egg, then chop and mix with minced onion and mayonnaise to make tartar sauce.",
  "after": {
   "1": "Hard-boil 1 egg, then chop and mix with minced onion and mayonnaise to make tartar sauce.",
   "3": "Hard-boil 2 eggs, then chop and mix with minced onion and mayonnaise to make tartar sauce.",
   "4": "Hard-boil 2 eggs, then chop and mix with minced onion and mayonnaise to make tartar sauce.",
   "6": "Hard-boil 3 eggs, then chop and mix with minced onion and mayonnaise to make tartar sauce."
  }
 },
{
  "lang": "ar",
  "cc": "EG",
  "id": "eg_sayadeya",
  "k": 1,
  "before": "Fry the sliced onions in 4 tbsp oil slowly until very dark brown but not burnt, about 15 minutes. Add 600 ml water, the bay leaf and salt, boil 5 minutes and strain; this brown stock colours the rice.",
  "after": {
   "1": "Fry the sliced onions in 2 tbsp oil slowly until very dark brown but not burnt, about 15 minutes. Add 300 ml water, the bay leaf and salt, boil 5 minutes and strain; this brown stock colours the rice.",
   "3": "Fry the sliced onions in 6 tbsp oil slowly until very dark brown but not burnt, about 15 minutes. Add 900 ml water, the bay leaf and salt, boil 5 minutes and strain; this brown stock colours the rice.",
   "4": "Fry the sliced onions in 8 tbsp oil slowly until very dark brown but not burnt, about 15 minutes. Add 1200 ml water, the bay leaf and salt, boil 5 minutes and strain; this brown stock colours the rice.",
   "6": "Fry the sliced onions in 12 tbsp oil slowly until very dark brown but not burnt, about 15 minutes. Add 1800 ml water, the bay leaf and salt, boil 5 minutes and strain; this brown stock colours the rice."
  }
 },
{
  "lang": "ar",
  "cc": "EG",
  "id": "eg_sayadeya",
  "k": 1,
  "before": "حمّري البصل الشرايح في 4 ملاعق زيت على مهل لحد ما يبقى بني غامق من غير ما يتحرق، حوالي 15 دقيقة. ضيفي 600 مل ميه والورقة والملح، وسيبيه يغلي 5 دقايق وصفّيه؛ المرقة البني دي هي اللي بتلوّن الرز.",
  "after": {
   "1": "حمّري البصل الشرايح في 2 ملعقة زيت على مهل لحد ما يبقى بني غامق من غير ما يتحرق، حوالي 15 دقيقة. ضيفي 300 مل ميه والورقة والملح، وسيبيه يغلي 5 دقايق وصفّيه؛ المرقة البني دي هي اللي بتلوّن الرز.",
   "3": "حمّري البصل الشرايح في 6 ملاعق زيت على مهل لحد ما يبقى بني غامق من غير ما يتحرق، حوالي 15 دقيقة. ضيفي 900 مل ميه والورقة والملح، وسيبيه يغلي 5 دقايق وصفّيه؛ المرقة البني دي هي اللي بتلوّن الرز.",
   "4": "حمّري البصل الشرايح في 8 ملاعق زيت على مهل لحد ما يبقى بني غامق من غير ما يتحرق، حوالي 15 دقيقة. ضيفي 1200 مل ميه والورقة والملح، وسيبيه يغلي 5 دقايق وصفّيه؛ المرقة البني دي هي اللي بتلوّن الرز.",
   "6": "حمّري البصل الشرايح في 12 ملعقة زيت على مهل لحد ما يبقى بني غامق من غير ما يتحرق، حوالي 15 دقيقة. ضيفي 1800 مل ميه والورقة والملح، وسيبيه يغلي 5 دقايق وصفّيه؛ المرقة البني دي هي اللي بتلوّن الرز."
  }
 },
{
  "lang": "ar",
  "cc": "EG",
  "id": "eg_sayadeya",
  "k": 2,
  "before": "Fry the rinsed rice in 1 tbsp oil for 2 minutes, add 375 ml of the onion stock, cover and cook on the lowest heat for 15 minutes.",
  "after": {
   "1": "Fry the rinsed rice in 1/2 tbsp oil for 2 minutes, add 190 ml of the onion stock, cover and cook on the lowest heat for 15 minutes.",
   "3": "Fry the rinsed rice in 1 1/2 tbsp oil for 2 minutes, add 560 ml of the onion stock, cover and cook on the lowest heat for 15 minutes.",
   "4": "Fry the rinsed rice in 2 tbsp oil for 2 minutes, add 750 ml of the onion stock, cover and cook on the lowest heat for 15 minutes.",
   "6": "Fry the rinsed rice in 3 tbsp oil for 2 minutes, add 1130 ml of the onion stock, cover and cook on the lowest heat for 15 minutes."
  }
 },
{
  "lang": "ar",
  "cc": "EG",
  "id": "eg_sayadeya",
  "k": 2,
  "before": "شوّحي الرز المغسول في 1 ملعقة زيت دقيقتين، وضيفي 375 مل من مرقة البصل، وغطّيه على أهدى نار 15 دقيقة.",
  "after": {
   "1": "شوّحي الرز المغسول في 1/2 ملعقة زيت دقيقتين، وضيفي 190 مل من مرقة البصل، وغطّيه على أهدى نار 15 دقيقة.",
   "3": "شوّحي الرز المغسول في 1 1/2 ملعقة زيت دقيقتين، وضيفي 560 مل من مرقة البصل، وغطّيه على أهدى نار 15 دقيقة.",
   "4": "شوّحي الرز المغسول في 2 ملعقة زيت دقيقتين، وضيفي 750 مل من مرقة البصل، وغطّيه على أهدى نار 15 دقيقة.",
   "6": "شوّحي الرز المغسول في 3 ملاعق زيت دقيقتين، وضيفي 1130 مل من مرقة البصل، وغطّيه على أهدى نار 15 دقيقة."
  }
 },
{
  "lang": "ja",
  "cc": "EG",
  "id": "eg_sayadeya",
  "k": 1,
  "before": "薄切りの玉ねぎを油大さじ4で約15分、焦がさないように濃い茶色になるまでじっくり炒める。水600ml、ローリエ、塩を加えて5分煮立て、こす。この茶色いスープでご飯に色をつける。",
  "after": {
   "1": "薄切りの玉ねぎを油大さじ2で約15分、焦がさないように濃い茶色になるまでじっくり炒める。水300ml、ローリエ、塩を加えて5分煮立て、こす。この茶色いスープでご飯に色をつける。",
   "3": "薄切りの玉ねぎを油大さじ6で約15分、焦がさないように濃い茶色になるまでじっくり炒める。水900ml、ローリエ、塩を加えて5分煮立て、こす。この茶色いスープでご飯に色をつける。",
   "4": "薄切りの玉ねぎを油大さじ8で約15分、焦がさないように濃い茶色になるまでじっくり炒める。水1200ml、ローリエ、塩を加えて5分煮立て、こす。この茶色いスープでご飯に色をつける。",
   "6": "薄切りの玉ねぎを油大さじ12で約15分、焦がさないように濃い茶色になるまでじっくり炒める。水1800ml、ローリエ、塩を加えて5分煮立て、こす。この茶色いスープでご飯に色をつける。"
  }
 },
{
  "lang": "ar",
  "cc": "EG",
  "id": "eg_koshari",
  "k": 1,
  "before": "Slice the onions thinly and fry them in oil, in batches, until deep brown and crisp. Drain on paper and keep 2 tbsp of the onion oil.",
  "after": {
   "1": "Slice the onions thinly and fry them in oil, in batches, until deep brown and crisp. Drain on paper and keep 1 tbsp of the onion oil.",
   "3": "Slice the onions thinly and fry them in oil, in batches, until deep brown and crisp. Drain on paper and keep 3 tbsp of the onion oil.",
   "4": "Slice the onions thinly and fry them in oil, in batches, until deep brown and crisp. Drain on paper and keep 4 tbsp of the onion oil.",
   "6": "Slice the onions thinly and fry them in oil, in batches, until deep brown and crisp. Drain on paper and keep 6 tbsp of the onion oil."
  }
 },
{
  "lang": "ar",
  "cc": "EG",
  "id": "eg_koshari",
  "k": 1,
  "before": "قطّعي البصل شرائح رفيعة واقليه في الزيت على دفعات حتى يصبح بنيًّا غامقًا ومقرمشًا. صفّيه على ورق مطبخ واحتفظي بـ 2 ملعقة كبيرة من زيت البصل.",
  "after": {
   "1": "قطّعي البصل شرائح رفيعة واقليه في الزيت على دفعات حتى يصبح بنيًّا غامقًا ومقرمشًا. صفّيه على ورق مطبخ واحتفظي بـ 1 ملعقة كبيرة من زيت البصل.",
   "3": "قطّعي البصل شرائح رفيعة واقليه في الزيت على دفعات حتى يصبح بنيًّا غامقًا ومقرمشًا. صفّيه على ورق مطبخ واحتفظي بـ 3 ملاعق كبيرة من زيت البصل.",
   "4": "قطّعي البصل شرائح رفيعة واقليه في الزيت على دفعات حتى يصبح بنيًّا غامقًا ومقرمشًا. صفّيه على ورق مطبخ واحتفظي بـ 4 ملاعق كبيرة من زيت البصل.",
   "6": "قطّعي البصل شرائح رفيعة واقليه في الزيت على دفعات حتى يصبح بنيًّا غامقًا ومقرمشًا. صفّيه على ورق مطبخ واحتفظي بـ 6 ملاعق كبيرة من زيت البصل."
  }
 },
{
  "lang": "ar",
  "cc": "EG",
  "id": "eg_koshari",
  "k": 4,
  "before": "For the sauce, fry half the garlic in a little oil, add grated tomatoes, tomato paste, cumin, chili and salt and simmer 10 minutes; stir in 1 tbsp vinegar. Mix the rest of the garlic with 2 tbsp vinegar, a pinch of cumin and 2 tbsp water for the da'a.",
  "after": {
   "1": "For the sauce, fry half the garlic in a little oil, add grated tomatoes, tomato paste, cumin, chili and salt and simmer 10 minutes; stir in 1/2 tbsp vinegar. Mix the rest of the garlic with 1 tbsp vinegar, a pinch of cumin and 1 tbsp water for the da'a.",
   "3": "For the sauce, fry half the garlic in a little oil, add grated tomatoes, tomato paste, cumin, chili and salt and simmer 10 minutes; stir in 1 1/2 tbsp vinegar. Mix the rest of the garlic with 3 tbsp vinegar, a pinch of cumin and 3 tbsp water for the da'a.",
   "4": "For the sauce, fry half the garlic in a little oil, add grated tomatoes, tomato paste, cumin, chili and salt and simmer 10 minutes; stir in 2 tbsp vinegar. Mix the rest of the garlic with 4 tbsp vinegar, a pinch of cumin and 4 tbsp water for the da'a.",
   "6": "For the sauce, fry half the garlic in a little oil, add grated tomatoes, tomato paste, cumin, chili and salt and simmer 10 minutes; stir in 3 tbsp vinegar. Mix the rest of the garlic with 6 tbsp vinegar, a pinch of cumin and 6 tbsp water for the da'a."
  }
 },
{
  "lang": "ar",
  "cc": "EG",
  "id": "eg_koshari",
  "k": 4,
  "before": "للصلصة: حمّري نصف الثوم في قليل من الزيت، وأضيفي الطماطم المبشورة ومعجون الطماطم والكمون والشطة والملح، واتركيها على النار 10 دقائق، ثم أضيفي 1 ملعقة كبيرة من الخل. اخلطي بقية الثوم مع 2 ملعقة كبيرة من الخل وقليل من الكمون و2 ملعقة كبيرة من الماء لتحصلي على الدقة.",
  "after": {
   "1": "للصلصة: حمّري نصف الثوم في قليل من الزيت، وأضيفي الطماطم المبشورة ومعجون الطماطم والكمون والشطة والملح، واتركيها على النار 10 دقائق، ثم أضيفي 1/2 ملعقة كبيرة من الخل. اخلطي بقية الثوم مع 1 ملعقة كبيرة من الخل وقليل من الكمون و1 ملعقة كبيرة من الماء لتحصلي على الدقة.",
   "3": "للصلصة: حمّري نصف الثوم في قليل من الزيت، وأضيفي الطماطم المبشورة ومعجون الطماطم والكمون والشطة والملح، واتركيها على النار 10 دقائق، ثم أضيفي 1 1/2 ملعقة كبيرة من الخل. اخلطي بقية الثوم مع 3 ملاعق كبيرة من الخل وقليل من الكمون و3 ملاعق كبيرة من الماء لتحصلي على الدقة.",
   "4": "للصلصة: حمّري نصف الثوم في قليل من الزيت، وأضيفي الطماطم المبشورة ومعجون الطماطم والكمون والشطة والملح، واتركيها على النار 10 دقائق، ثم أضيفي 2 ملعقة كبيرة من الخل. اخلطي بقية الثوم مع 4 ملاعق كبيرة من الخل وقليل من الكمون و4 ملاعق كبيرة من الماء لتحصلي على الدقة.",
   "6": "للصلصة: حمّري نصف الثوم في قليل من الزيت، وأضيفي الطماطم المبشورة ومعجون الطماطم والكمون والشطة والملح، واتركيها على النار 10 دقائق، ثم أضيفي 3 ملاعق كبيرة من الخل. اخلطي بقية الثوم مع 6 ملاعق كبيرة من الخل وقليل من الكمون و6 ملاعق كبيرة من الماء لتحصلي على الدقة."
  }
 },
{
  "lang": "hi",
  "cc": "IN",
  "id": "in_chickencurry",
  "k": 3,
  "before": "Stir in the yogurt and 250 ml hot water, cover and simmer 20–25 minutes until the chicken is cooked through and tender.",
  "after": {
   "1": "Stir in the yogurt and 130 ml hot water, cover and simmer 20–25 minutes until the chicken is cooked through and tender.",
   "3": "Stir in the yogurt and 380 ml hot water, cover and simmer 20–25 minutes until the chicken is cooked through and tender.",
   "4": "Stir in the yogurt and 500 ml hot water, cover and simmer 20–25 minutes until the chicken is cooked through and tender.",
   "6": "Stir in the yogurt and 750 ml hot water, cover and simmer 20–25 minutes until the chicken is cooked through and tender."
  }
 },
{
  "lang": "hi",
  "cc": "IN",
  "id": "in_chickencurry",
  "k": 3,
  "before": "दही और 250 मि.ली. गरम पानी डालकर ढक दें और 20–25 मिनट पकाएँ, जब तक चिकन पूरी तरह पककर नरम न हो जाए।",
  "after": {
   "1": "दही और 130 मि.ली. गरम पानी डालकर ढक दें और 20–25 मिनट पकाएँ, जब तक चिकन पूरी तरह पककर नरम न हो जाए।",
   "3": "दही और 380 मि.ली. गरम पानी डालकर ढक दें और 20–25 मिनट पकाएँ, जब तक चिकन पूरी तरह पककर नरम न हो जाए।",
   "4": "दही और 500 मि.ली. गरम पानी डालकर ढक दें और 20–25 मिनट पकाएँ, जब तक चिकन पूरी तरह पककर नरम न हो जाए।",
   "6": "दही और 750 मि.ली. गरम पानी डालकर ढक दें और 20–25 मिनट पकाएँ, जब तक चिकन पूरी तरह पककर नरम न हो जाए।"
  }
 },
{
  "lang": "hi",
  "cc": "IN",
  "id": "in_dalmakhani",
  "k": 2,
  "before": "In a heavy pan heat the ghee and 1 tbsp of the butter, crackle the cumin seeds, then fry the ginger-garlic paste for 1 minute. Add the tomato purée and chili powder and cook 8–10 minutes until thick and the fat separates at the edges.",
  "after": {
   "1": "In a heavy pan heat the ghee and 1/2 tbsp of the butter, crackle the cumin seeds, then fry the ginger-garlic paste for 1 minute. Add the tomato purée and chili powder and cook 8–10 minutes until thick and the fat separates at the edges.",
   "3": "In a heavy pan heat the ghee and 1 1/2 tbsp of the butter, crackle the cumin seeds, then fry the ginger-garlic paste for 1 minute. Add the tomato purée and chili powder and cook 8–10 minutes until thick and the fat separates at the edges.",
   "4": "In a heavy pan heat the ghee and 2 tbsp of the butter, crackle the cumin seeds, then fry the ginger-garlic paste for 1 minute. Add the tomato purée and chili powder and cook 8–10 minutes until thick and the fat separates at the edges.",
   "6": "In a heavy pan heat the ghee and 3 tbsp of the butter, crackle the cumin seeds, then fry the ginger-garlic paste for 1 minute. Add the tomato purée and chili powder and cook 8–10 minutes until thick and the fat separates at the edges."
  }
 },
{
  "lang": "hi",
  "cc": "IN",
  "id": "in_dalmakhani",
  "k": 2,
  "before": "भारी तले के बर्तन में घी और 1 बड़ा चम्मच मक्खन गरम करें, जीरा चटकाएँ और अदरक-लहसुन पेस्ट 1 मिनट भूनें। टमाटर प्यूरी और मिर्च पाउडर डालकर 8–10 मिनट पकाएँ जब तक मसाला गाढ़ा होकर किनारों से घी न छोड़ दे।",
  "after": {
   "1": "भारी तले के बर्तन में घी और 1/2 बड़ा चम्मच मक्खन गरम करें, जीरा चटकाएँ और अदरक-लहसुन पेस्ट 1 मिनट भूनें। टमाटर प्यूरी और मिर्च पाउडर डालकर 8–10 मिनट पकाएँ जब तक मसाला गाढ़ा होकर किनारों से घी न छोड़ दे।",
   "3": "भारी तले के बर्तन में घी और 1 1/2 बड़े चम्मच मक्खन गरम करें, जीरा चटकाएँ और अदरक-लहसुन पेस्ट 1 मिनट भूनें। टमाटर प्यूरी और मिर्च पाउडर डालकर 8–10 मिनट पकाएँ जब तक मसाला गाढ़ा होकर किनारों से घी न छोड़ दे।",
   "4": "भारी तले के बर्तन में घी और 2 बड़े चम्मच मक्खन गरम करें, जीरा चटकाएँ और अदरक-लहसुन पेस्ट 1 मिनट भूनें। टमाटर प्यूरी और मिर्च पाउडर डालकर 8–10 मिनट पकाएँ जब तक मसाला गाढ़ा होकर किनारों से घी न छोड़ दे।",
   "6": "भारी तले के बर्तन में घी और 3 बड़े चम्मच मक्खन गरम करें, जीरा चटकाएँ और अदरक-लहसुन पेस्ट 1 मिनट भूनें। टमाटर प्यूरी और मिर्च पाउडर डालकर 8–10 मिनट पकाएँ जब तक मसाला गाढ़ा होकर किनारों से घी न छोड़ दे।"
  }
 },
{
  "lang": "hi",
  "cc": "IN",
  "id": "in_eggcurry",
  "k": 1,
  "before": "Fry the eggs in 1 tbsp oil with a pinch of turmeric and chili for 2 minutes until lightly golden; set aside.",
  "after": {
   "1": "Fry the eggs in 1/2 tbsp oil with a pinch of turmeric and chili for 2 minutes until lightly golden; set aside.",
   "3": "Fry the eggs in 1 1/2 tbsp oil with a pinch of turmeric and chili for 2 minutes until lightly golden; set aside.",
   "4": "Fry the eggs in 2 tbsp oil with a pinch of turmeric and chili for 2 minutes until lightly golden; set aside.",
   "6": "Fry the eggs in 3 tbsp oil with a pinch of turmeric and chili for 2 minutes until lightly golden; set aside."
  }
 },
{
  "lang": "hi",
  "cc": "IN",
  "id": "in_eggcurry",
  "k": 1,
  "before": "1 बड़े चम्मच तेल में चुटकी भर हल्दी और लाल मिर्च डालकर अंडों को 2 मिनट हल्का सुनहरा होने तक तलें; अलग रख दें।",
  "after": {
   "1": "1/2 बड़ा चम्मच तेल में चुटकी भर हल्दी और लाल मिर्च डालकर अंडों को 2 मिनट हल्का सुनहरा होने तक तलें; अलग रख दें।",
   "3": "1 1/2 बड़े चम्मच तेल में चुटकी भर हल्दी और लाल मिर्च डालकर अंडों को 2 मिनट हल्का सुनहरा होने तक तलें; अलग रख दें।",
   "4": "2 बड़े चम्मच तेल में चुटकी भर हल्दी और लाल मिर्च डालकर अंडों को 2 मिनट हल्का सुनहरा होने तक तलें; अलग रख दें।",
   "6": "3 बड़े चम्मच तेल में चुटकी भर हल्दी और लाल मिर्च डालकर अंडों को 2 मिनट हल्का सुनहरा होने तक तलें; अलग रख दें।"
  }
 },
{
  "lang": "zh-Hans",
  "cc": "CN",
  "id": "cn_fanqie_chaodan",
  "k": 1,
  "before": "Heat 1.5 tbsp oil in a wok until hot, pour in the eggs and push them around gently. Take them out as soon as they form large soft curds.",
  "after": {
   "1": "Heat 3/4 tbsp oil in a wok until hot, pour in the eggs and push them around gently. Take them out as soon as they form large soft curds.",
   "3": "Heat 2 1/4 tbsp oil in a wok until hot, pour in the eggs and push them around gently. Take them out as soon as they form large soft curds.",
   "4": "Heat 3 tbsp oil in a wok until hot, pour in the eggs and push them around gently. Take them out as soon as they form large soft curds.",
   "6": "Heat 4 1/2 tbsp oil in a wok until hot, pour in the eggs and push them around gently. Take them out as soon as they form large soft curds."
  }
 },
{
  "lang": "zh-Hans",
  "cc": "CN",
  "id": "cn_fanqie_chaodan",
  "k": 1,
  "before": "锅里放1.5大勺油烧热，倒入蛋液，轻轻推动，刚凝成大块的嫩蛋就盛出来。",
  "after": {
   "1": "锅里放3/4大勺油烧热，倒入蛋液，轻轻推动，刚凝成大块的嫩蛋就盛出来。",
   "3": "锅里放2 1/4大勺油烧热，倒入蛋液，轻轻推动，刚凝成大块的嫩蛋就盛出来。",
   "4": "锅里放3大勺油烧热，倒入蛋液，轻轻推动，刚凝成大块的嫩蛋就盛出来。",
   "6": "锅里放4 1/2大勺油烧热，倒入蛋液，轻轻推动，刚凝成大块的嫩蛋就盛出来。"
  }
 },
{
  "lang": "zh-Hans",
  "cc": "CN",
  "id": "cn_suanlatang",
  "k": 0,
  "before": "Soak the wood ear (and the shiitake, if dried) in warm water for 30 minutes, then cut into thin strips. Cut the tofu, bamboo shoots and shiitake into thin strips. Mix the pork with 1 tsp of the soy sauce and 1 tsp of the cornstarch.",
  "after": {
   "1": "Soak the wood ear (and the shiitake, if dried) in warm water for 30 minutes, then cut into thin strips. Cut the tofu, bamboo shoots and shiitake into thin strips. Mix the pork with 1/2 tsp of the soy sauce and 1/2 tsp of the cornstarch.",
   "3": "Soak the wood ear (and the shiitake, if dried) in warm water for 30 minutes, then cut into thin strips. Cut the tofu, bamboo shoots and shiitake into thin strips. Mix the pork with 1 1/2 tsp of the soy sauce and 1 1/2 tsp of the cornstarch.",
   "4": "Soak the wood ear (and the shiitake, if dried) in warm water for 30 minutes, then cut into thin strips. Cut the tofu, bamboo shoots and shiitake into thin strips. Mix the pork with 2 tsp of the soy sauce and 2 tsp of the cornstarch.",
   "6": "Soak the wood ear (and the shiitake, if dried) in warm water for 30 minutes, then cut into thin strips. Cut the tofu, bamboo shoots and shiitake into thin strips. Mix the pork with 3 tsp of the soy sauce and 3 tsp of the cornstarch."
  }
 },
{
  "lang": "zh-Hans",
  "cc": "CN",
  "id": "cn_suanlatang",
  "k": 0,
  "before": "木耳（干香菇也一样）用温水泡30分钟，切细丝。豆腐、笋和香菇也切细丝。肉丝用1小勺生抽和1小勺淀粉抓匀。",
  "after": {
   "1": "木耳（干香菇也一样）用温水泡30分钟，切细丝。豆腐、笋和香菇也切细丝。肉丝用1/2小勺生抽和1/2小勺淀粉抓匀。",
   "3": "木耳（干香菇也一样）用温水泡30分钟，切细丝。豆腐、笋和香菇也切细丝。肉丝用1 1/2小勺生抽和1 1/2小勺淀粉抓匀。",
   "4": "木耳（干香菇也一样）用温水泡30分钟，切细丝。豆腐、笋和香菇也切细丝。肉丝用2小勺生抽和2小勺淀粉抓匀。",
   "6": "木耳（干香菇也一样）用温水泡30分钟，切细丝。豆腐、笋和香菇也切细丝。肉丝用3小勺生抽和3小勺淀粉抓匀。"
  }
 },
{
  "lang": "id",
  "cc": "ID",
  "id": "id_nasigoreng",
  "k": 1,
  "before": "Heat 2 tbsp oil and fry the paste for 2 minutes until fragrant. Add the chicken and cook until no longer pink.",
  "after": {
   "1": "Heat 1 tbsp oil and fry the paste for 2 minutes until fragrant. Add the chicken and cook until no longer pink.",
   "3": "Heat 3 tbsp oil and fry the paste for 2 minutes until fragrant. Add the chicken and cook until no longer pink.",
   "4": "Heat 4 tbsp oil and fry the paste for 2 minutes until fragrant. Add the chicken and cook until no longer pink.",
   "6": "Heat 6 tbsp oil and fry the paste for 2 minutes until fragrant. Add the chicken and cook until no longer pink."
  }
 },
{
  "lang": "id",
  "cc": "ID",
  "id": "id_nasigoreng",
  "k": 1,
  "before": "Panaskan 2 sdm minyak dan tumis bumbu 2 menit sampai harum. Masukkan ayam dan masak sampai tidak merah lagi.",
  "after": {
   "1": "Panaskan 1 sdm minyak dan tumis bumbu 2 menit sampai harum. Masukkan ayam dan masak sampai tidak merah lagi.",
   "3": "Panaskan 3 sdm minyak dan tumis bumbu 2 menit sampai harum. Masukkan ayam dan masak sampai tidak merah lagi.",
   "4": "Panaskan 4 sdm minyak dan tumis bumbu 2 menit sampai harum. Masukkan ayam dan masak sampai tidak merah lagi.",
   "6": "Panaskan 6 sdm minyak dan tumis bumbu 2 menit sampai harum. Masukkan ayam dan masak sampai tidak merah lagi."
  }
 },
{
  "lang": "pl",
  "cc": "PL",
  "id": "pl_barszcz",
  "k": 1,
  "before": "Put all the vegetables, the mushrooms, bay leaf and allspice into 1.2 litres of cold water. Bring to the boil, then cover and simmer on low heat for 40 minutes.",
  "after": {
   "1": "Put all the vegetables, the mushrooms, bay leaf and allspice into 0.6 litres of cold water. Bring to the boil, then cover and simmer on low heat for 40 minutes.",
   "3": "Put all the vegetables, the mushrooms, bay leaf and allspice into 1.8 litres of cold water. Bring to the boil, then cover and simmer on low heat for 40 minutes.",
   "4": "Put all the vegetables, the mushrooms, bay leaf and allspice into 2.4 litres of cold water. Bring to the boil, then cover and simmer on low heat for 40 minutes.",
   "6": "Put all the vegetables, the mushrooms, bay leaf and allspice into 3.6 litres of cold water. Bring to the boil, then cover and simmer on low heat for 40 minutes."
  }
 },
{
  "lang": "pl",
  "cc": "PL",
  "id": "pl_barszcz",
  "k": 1,
  "before": "Włóż wszystkie warzywa, grzyby, liść laurowy i ziele angielskie do 1,2 litra zimnej wody. Zagotuj, przykryj i gotuj na małym ogniu 40 minut.",
  "after": {
   "1": "Włóż wszystkie warzywa, grzyby, liść laurowy i ziele angielskie do 0,6 litra zimnej wody. Zagotuj, przykryj i gotuj na małym ogniu 40 minut.",
   "3": "Włóż wszystkie warzywa, grzyby, liść laurowy i ziele angielskie do 1,8 litra zimnej wody. Zagotuj, przykryj i gotuj na małym ogniu 40 minut.",
   "4": "Włóż wszystkie warzywa, grzyby, liść laurowy i ziele angielskie do 2,4 litra zimnej wody. Zagotuj, przykryj i gotuj na małym ogniu 40 minut.",
   "6": "Włóż wszystkie warzywa, grzyby, liść laurowy i ziele angielskie do 3,6 litra zimnej wody. Zagotuj, przykryj i gotuj na małym ogniu 40 minut."
  }
 },
{
  "lang": "fil",
  "cc": "PH",
  "id": "ph_munggo",
  "k": 0,
  "before": "Rinse the mung beans and boil them in 1 litre of water for 30 to 40 minutes until soft and starting to split. Keep the liquid.",
  "after": {
   "1": "Rinse the mung beans and boil them in 0.5 litre of water for 30 to 40 minutes until soft and starting to split. Keep the liquid.",
   "3": "Rinse the mung beans and boil them in 1.5 litres of water for 30 to 40 minutes until soft and starting to split. Keep the liquid.",
   "4": "Rinse the mung beans and boil them in 2 litres of water for 30 to 40 minutes until soft and starting to split. Keep the liquid.",
   "6": "Rinse the mung beans and boil them in 3 litres of water for 30 to 40 minutes until soft and starting to split. Keep the liquid."
  }
 },
{
  "lang": "fil",
  "cc": "PH",
  "id": "ph_munggo",
  "k": 0,
  "before": "Hugasan ang munggo at pakuluan sa 1 litrong tubig ng 30 hanggang 40 minuto hanggang malambot at magsimulang pumutok. Itabi ang sabaw.",
  "after": {
   "1": "Hugasan ang munggo at pakuluan sa 0.5 litrong tubig ng 30 hanggang 40 minuto hanggang malambot at magsimulang pumutok. Itabi ang sabaw.",
   "3": "Hugasan ang munggo at pakuluan sa 1.5 litrong tubig ng 30 hanggang 40 minuto hanggang malambot at magsimulang pumutok. Itabi ang sabaw.",
   "4": "Hugasan ang munggo at pakuluan sa 2 litrong tubig ng 30 hanggang 40 minuto hanggang malambot at magsimulang pumutok. Itabi ang sabaw.",
   "6": "Hugasan ang munggo at pakuluan sa 3 litrong tubig ng 30 hanggang 40 minuto hanggang malambot at magsimulang pumutok. Itabi ang sabaw."
  }
 },
{
  "lang": "en",
  "cc": "US",
  "id": "us_potatosoup",
  "k": 0,
  "before": "Cook the bacon in a pot over medium heat for 6-7 minutes until crisp. Lift out, crumble, and pour off all but 1 tbsp of the fat.",
  "after": {
   "1": "Cook the bacon in a pot over medium heat for 6-7 minutes until crisp. Lift out, crumble, and pour off all but 1 tbsp of the fat.",
   "3": "Cook the bacon in a pot over medium heat for 6-7 minutes until crisp. Lift out, crumble, and pour off all but 1 tbsp of the fat.",
   "4": "Cook the bacon in a pot over medium heat for 6-7 minutes until crisp. Lift out, crumble, and pour off all but 1 tbsp of the fat.",
   "6": "Cook the bacon in a pot over medium heat for 6-7 minutes until crisp. Lift out, crumble, and pour off all but 1 tbsp of the fat."
  }
 },
{
  "lang": "en",
  "cc": "US",
  "id": "us_sausagekale",
  "k": 1,
  "before": "Heat the oil in a pot over medium-high heat and cook the sausage, breaking it into small pieces, for 6-8 minutes until browned with no pink left. Pour off all but 1 tbsp of fat. Add the onion for 4 minutes, then the garlic and pepper flakes for 30 seconds.",
  "after": {
   "1": "Heat the oil in a pot over medium-high heat and cook the sausage, breaking it into small pieces, for 6-8 minutes until browned with no pink left. Pour off all but 1 tbsp of fat. Add the onion for 4 minutes, then the garlic and pepper flakes for 30 seconds.",
   "3": "Heat the oil in a pot over medium-high heat and cook the sausage, breaking it into small pieces, for 6-8 minutes until browned with no pink left. Pour off all but 1 tbsp of fat. Add the onion for 4 minutes, then the garlic and pepper flakes for 30 seconds.",
   "4": "Heat the oil in a pot over medium-high heat and cook the sausage, breaking it into small pieces, for 6-8 minutes until browned with no pink left. Pour off all but 1 tbsp of fat. Add the onion for 4 minutes, then the garlic and pepper flakes for 30 seconds.",
   "6": "Heat the oil in a pot over medium-high heat and cook the sausage, breaking it into small pieces, for 6-8 minutes until browned with no pink left. Pour off all but 1 tbsp of fat. Add the onion for 4 minutes, then the garlic and pepper flakes for 30 seconds."
  }
 },
{
  "lang": "es",
  "cc": "MX",
  "id": "mx_sopa_tortilla",
  "k": 2,
  "before": "Blend the tomatoes, onion and garlic. Pour off all but 1 tbsp of oil and fry the purée over medium heat for 5 minutes, until it darkens.",
  "after": {
   "1": "Blend the tomatoes, onion and garlic. Pour off all but 1 tbsp of oil and fry the purée over medium heat for 5 minutes, until it darkens.",
   "3": "Blend the tomatoes, onion and garlic. Pour off all but 1 tbsp of oil and fry the purée over medium heat for 5 minutes, until it darkens.",
   "4": "Blend the tomatoes, onion and garlic. Pour off all but 1 tbsp of oil and fry the purée over medium heat for 5 minutes, until it darkens.",
   "6": "Blend the tomatoes, onion and garlic. Pour off all but 1 tbsp of oil and fry the purée over medium heat for 5 minutes, until it darkens."
  }
 },
{
  "lang": "es",
  "cc": "MX",
  "id": "mx_sopa_tortilla",
  "k": 2,
  "before": "Licúa los jitomates, la cebolla y el ajo. Deja solo 1 cucharada de aceite en la olla y fríe el licuado a fuego medio 5 minutos, hasta que se oscurezca.",
  "after": {
   "1": "Licúa los jitomates, la cebolla y el ajo. Deja solo 1 cucharada de aceite en la olla y fríe el licuado a fuego medio 5 minutos, hasta que se oscurezca.",
   "3": "Licúa los jitomates, la cebolla y el ajo. Deja solo 1 cucharada de aceite en la olla y fríe el licuado a fuego medio 5 minutos, hasta que se oscurezca.",
   "4": "Licúa los jitomates, la cebolla y el ajo. Deja solo 1 cucharada de aceite en la olla y fríe el licuado a fuego medio 5 minutos, hasta que se oscurezca.",
   "6": "Licúa los jitomates, la cebolla y el ajo. Deja solo 1 cucharada de aceite en la olla y fríe el licuado a fuego medio 5 minutos, hasta que se oscurezca."
  }
 },
{
  "lang": "vi",
  "cc": "VN",
  "id": "vn_thitrangchay",
  "k": 2,
  "before": "When the edges turn golden and slightly curled, pour off excess fat, leaving 1 tbsp.",
  "after": {
   "1": "When the edges turn golden and slightly curled, pour off excess fat, leaving 1 tbsp.",
   "3": "When the edges turn golden and slightly curled, pour off excess fat, leaving 1 tbsp.",
   "4": "When the edges turn golden and slightly curled, pour off excess fat, leaving 1 tbsp.",
   "6": "When the edges turn golden and slightly curled, pour off excess fat, leaving 1 tbsp."
  }
 },
{
  "lang": "vi",
  "cc": "VN",
  "id": "vn_thitrangchay",
  "k": 2,
  "before": "Khi mép thịt vàng và hơi xém cong lại, chắt bớt mỡ, chỉ để lại 1 muỗng canh.",
  "after": {
   "1": "Khi mép thịt vàng và hơi xém cong lại, chắt bớt mỡ, chỉ để lại 1 muỗng canh.",
   "3": "Khi mép thịt vàng và hơi xém cong lại, chắt bớt mỡ, chỉ để lại 1 muỗng canh.",
   "4": "Khi mép thịt vàng và hơi xém cong lại, chắt bớt mỡ, chỉ để lại 1 muỗng canh.",
   "6": "Khi mép thịt vàng và hơi xém cong lại, chắt bớt mỡ, chỉ để lại 1 muỗng canh."
  }
 },
{
  "lang": "ja",
  "cc": "VN",
  "id": "vn_gachiennuocmam",
  "k": 2,
  "before": "油を大さじ1残して捨て、みじん切りのにんにくと唐辛子をきつね色に炒める。",
  "after": {
   "1": "油を大さじ1残して捨て、みじん切りのにんにくと唐辛子をきつね色に炒める。",
   "3": "油を大さじ1残して捨て、みじん切りのにんにくと唐辛子をきつね色に炒める。",
   "4": "油を大さじ1残して捨て、みじん切りのにんにくと唐辛子をきつね色に炒める。",
   "6": "油を大さじ1残して捨て、みじん切りのにんにくと唐辛子をきつね色に炒める。"
  }
 },
{
  "lang": "ja",
  "cc": "US",
  "id": "us_sausagekale",
  "k": 1,
  "before": "鍋に油を中火より強めで熱し、ソーセージの中身を細かくほぐしながら6〜8分、焼き色がつきピンク色がなくなるまで炒める。脂は大さじ1を残して捨てる。玉ねぎを加えて4分、にんにくとペッパーフレークを加えて30秒炒める。",
  "after": {
   "1": "鍋に油を中火より強めで熱し、ソーセージの中身を細かくほぐしながら6〜8分、焼き色がつきピンク色がなくなるまで炒める。脂は大さじ1を残して捨てる。玉ねぎを加えて4分、にんにくとペッパーフレークを加えて30秒炒める。",
   "3": "鍋に油を中火より強めで熱し、ソーセージの中身を細かくほぐしながら6〜8分、焼き色がつきピンク色がなくなるまで炒める。脂は大さじ1を残して捨てる。玉ねぎを加えて4分、にんにくとペッパーフレークを加えて30秒炒める。",
   "4": "鍋に油を中火より強めで熱し、ソーセージの中身を細かくほぐしながら6〜8分、焼き色がつきピンク色がなくなるまで炒める。脂は大さじ1を残して捨てる。玉ねぎを加えて4分、にんにくとペッパーフレークを加えて30秒炒める。",
   "6": "鍋に油を中火より強めで熱し、ソーセージの中身を細かくほぐしながら6〜8分、焼き色がつきピンク色がなくなるまで炒める。脂は大さじ1を残して捨てる。玉ねぎを加えて4分、にんにくとペッパーフレークを加えて30秒炒める。"
  }
 },
{
  "lang": "de",
  "cc": "DE",
  "id": "de_rouladen",
  "k": 0,
  "before": "Lay the beef slices flat, season with salt and pepper and spread each with 1 tsp mustard. Top with a bacon slice, a few onion strips (from 1 onion) and a gherkin quarter, roll up tightly from the short side and close with toothpicks or kitchen string.",
  "after": {
   "1": "Lay the beef slices flat, season with salt and pepper and spread each with 1 tsp mustard. Top with a bacon slice, a few onion strips (from 1 onion) and a gherkin quarter, roll up tightly from the short side and close with toothpicks or kitchen string.",
   "3": "Lay the beef slices flat, season with salt and pepper and spread each with 1 tsp mustard. Top with a bacon slice, a few onion strips (from 1 onion) and a gherkin quarter, roll up tightly from the short side and close with toothpicks or kitchen string.",
   "4": "Lay the beef slices flat, season with salt and pepper and spread each with 1 tsp mustard. Top with a bacon slice, a few onion strips (from 1 onion) and a gherkin quarter, roll up tightly from the short side and close with toothpicks or kitchen string.",
   "6": "Lay the beef slices flat, season with salt and pepper and spread each with 1 tsp mustard. Top with a bacon slice, a few onion strips (from 1 onion) and a gherkin quarter, roll up tightly from the short side and close with toothpicks or kitchen string."
  }
 },
{
  "lang": "de",
  "cc": "DE",
  "id": "de_rouladen",
  "k": 0,
  "before": "Die Rouladen ausbreiten, salzen, pfeffern und jeweils mit 1 TL Senf bestreichen. Mit einer Scheibe Speck, einigen Zwiebelstreifen (von 1 Zwiebel) und einem Gurkenviertel belegen, von der schmalen Seite her fest aufrollen und mit Rouladennadeln oder Küchengarn verschließen.",
  "after": {
   "1": "Die Rouladen ausbreiten, salzen, pfeffern und jeweils mit 1 TL Senf bestreichen. Mit einer Scheibe Speck, einigen Zwiebelstreifen (von 1 Zwiebel) und einem Gurkenviertel belegen, von der schmalen Seite her fest aufrollen und mit Rouladennadeln oder Küchengarn verschließen.",
   "3": "Die Rouladen ausbreiten, salzen, pfeffern und jeweils mit 1 TL Senf bestreichen. Mit einer Scheibe Speck, einigen Zwiebelstreifen (von 1 Zwiebel) und einem Gurkenviertel belegen, von der schmalen Seite her fest aufrollen und mit Rouladennadeln oder Küchengarn verschließen.",
   "4": "Die Rouladen ausbreiten, salzen, pfeffern und jeweils mit 1 TL Senf bestreichen. Mit einer Scheibe Speck, einigen Zwiebelstreifen (von 1 Zwiebel) und einem Gurkenviertel belegen, von der schmalen Seite her fest aufrollen und mit Rouladennadeln oder Küchengarn verschließen.",
   "6": "Die Rouladen ausbreiten, salzen, pfeffern und jeweils mit 1 TL Senf bestreichen. Mit einer Scheibe Speck, einigen Zwiebelstreifen (von 1 Zwiebel) und einem Gurkenviertel belegen, von der schmalen Seite her fest aufrollen und mit Rouladennadeln oder Küchengarn verschließen."
  }
 },
{
  "lang": "fil",
  "cc": "PH",
  "id": "ph_molo",
  "k": 2,
  "before": "Put 1 tsp of filling in the centre of each wrapper, wet the edges, fold into a triangle and press out the air to seal.",
  "after": {
   "1": "Put 1 tsp of filling in the centre of each wrapper, wet the edges, fold into a triangle and press out the air to seal.",
   "3": "Put 1 tsp of filling in the centre of each wrapper, wet the edges, fold into a triangle and press out the air to seal.",
   "4": "Put 1 tsp of filling in the centre of each wrapper, wet the edges, fold into a triangle and press out the air to seal.",
   "6": "Put 1 tsp of filling in the centre of each wrapper, wet the edges, fold into a triangle and press out the air to seal."
  }
 },
{
  "lang": "fil",
  "cc": "PH",
  "id": "ph_molo",
  "k": 2,
  "before": "Maglagay ng 1 kutsaritang palaman sa gitna ng bawat balat, basain ang gilid, itiklop nang pa-tatsulok at diinan para lumabas ang hangin at sumara.",
  "after": {
   "1": "Maglagay ng 1 kutsaritang palaman sa gitna ng bawat balat, basain ang gilid, itiklop nang pa-tatsulok at diinan para lumabas ang hangin at sumara.",
   "3": "Maglagay ng 1 kutsaritang palaman sa gitna ng bawat balat, basain ang gilid, itiklop nang pa-tatsulok at diinan para lumabas ang hangin at sumara.",
   "4": "Maglagay ng 1 kutsaritang palaman sa gitna ng bawat balat, basain ang gilid, itiklop nang pa-tatsulok at diinan para lumabas ang hangin at sumara.",
   "6": "Maglagay ng 1 kutsaritang palaman sa gitna ng bawat balat, basain ang gilid, itiklop nang pa-tatsulok at diinan para lumabas ang hangin at sumara."
  }
 },
{
  "lang": "fil",
  "cc": "PH",
  "id": "ph_lumpiang_gulay",
  "k": 2,
  "before": "Put 2 tbsp of filling on each wrapper, fold in the sides and roll up tightly, sealing with a dab of water.",
  "after": {
   "1": "Put 2 tbsp of filling on each wrapper, fold in the sides and roll up tightly, sealing with a dab of water.",
   "3": "Put 2 tbsp of filling on each wrapper, fold in the sides and roll up tightly, sealing with a dab of water.",
   "4": "Put 2 tbsp of filling on each wrapper, fold in the sides and roll up tightly, sealing with a dab of water.",
   "6": "Put 2 tbsp of filling on each wrapper, fold in the sides and roll up tightly, sealing with a dab of water."
  }
 },
{
  "lang": "fil",
  "cc": "PH",
  "id": "ph_lumpiang_gulay",
  "k": 2,
  "before": "Maglagay ng 2 kutsarang palaman sa bawat balat, itupi ang gilid at irolyo nang mahigpit, idikit ng kaunting tubig.",
  "after": {
   "1": "Maglagay ng 2 kutsarang palaman sa bawat balat, itupi ang gilid at irolyo nang mahigpit, idikit ng kaunting tubig.",
   "3": "Maglagay ng 2 kutsarang palaman sa bawat balat, itupi ang gilid at irolyo nang mahigpit, idikit ng kaunting tubig.",
   "4": "Maglagay ng 2 kutsarang palaman sa bawat balat, itupi ang gilid at irolyo nang mahigpit, idikit ng kaunting tubig.",
   "6": "Maglagay ng 2 kutsarang palaman sa bawat balat, itupi ang gilid at irolyo nang mahigpit, idikit ng kaunting tubig."
  }
 },
{
  "lang": "pl",
  "cc": "PL",
  "id": "pl_krokiety",
  "k": 2,
  "before": "Put 2 tbsp filling on each pancake, fold in the sides and roll into a tight parcel.",
  "after": {
   "1": "Put 2 tbsp filling on each pancake, fold in the sides and roll into a tight parcel.",
   "3": "Put 2 tbsp filling on each pancake, fold in the sides and roll into a tight parcel.",
   "4": "Put 2 tbsp filling on each pancake, fold in the sides and roll into a tight parcel.",
   "6": "Put 2 tbsp filling on each pancake, fold in the sides and roll into a tight parcel."
  }
 },
{
  "lang": "pl",
  "cc": "PL",
  "id": "pl_krokiety",
  "k": 2,
  "before": "Na każdy naleśnik nałóż 2 łyżki farszu, załóż boki i ciasno zwiń w kopertę.",
  "after": {
   "1": "Na każdy naleśnik nałóż 2 łyżki farszu, załóż boki i ciasno zwiń w kopertę.",
   "3": "Na każdy naleśnik nałóż 2 łyżki farszu, załóż boki i ciasno zwiń w kopertę.",
   "4": "Na każdy naleśnik nałóż 2 łyżki farszu, załóż boki i ciasno zwiń w kopertę.",
   "6": "Na każdy naleśnik nałóż 2 łyżki farszu, załóż boki i ciasno zwiń w kopertę."
  }
 },
{
  "lang": "zh-Hans",
  "cc": "CN",
  "id": "cn_sigua_huage",
  "k": 0,
  "before": "If the clams are not sold purged, leave them beforehand in salted water (about 1 tbsp salt per litre) in a dark place for 1-2 hours so they spit out sand. Scrub and rinse them. Throw away any with broken shells or that stay open when tapped.",
  "after": {
   "1": "If the clams are not sold purged, leave them beforehand in salted water (about 1 tbsp salt per litre) in a dark place for 1-2 hours so they spit out sand. Scrub and rinse them. Throw away any with broken shells or that stay open when tapped.",
   "3": "If the clams are not sold purged, leave them beforehand in salted water (about 1 tbsp salt per litre) in a dark place for 1-2 hours so they spit out sand. Scrub and rinse them. Throw away any with broken shells or that stay open when tapped.",
   "4": "If the clams are not sold purged, leave them beforehand in salted water (about 1 tbsp salt per litre) in a dark place for 1-2 hours so they spit out sand. Scrub and rinse them. Throw away any with broken shells or that stay open when tapped.",
   "6": "If the clams are not sold purged, leave them beforehand in salted water (about 1 tbsp salt per litre) in a dark place for 1-2 hours so they spit out sand. Scrub and rinse them. Throw away any with broken shells or that stay open when tapped."
  }
 },
{
  "lang": "zh-Hans",
  "cc": "CN",
  "id": "cn_sigua_huage",
  "k": 0,
  "before": "如果买的花蛤没有吐过沙，提前把它泡在淡盐水里（每升水约1大勺盐），放在暗处1-2小时让它吐沙，再搓洗干净。壳破的、敲一敲也不合上的都扔掉。",
  "after": {
   "1": "如果买的花蛤没有吐过沙，提前把它泡在淡盐水里（每升水约1大勺盐），放在暗处1-2小时让它吐沙，再搓洗干净。壳破的、敲一敲也不合上的都扔掉。",
   "3": "如果买的花蛤没有吐过沙，提前把它泡在淡盐水里（每升水约1大勺盐），放在暗处1-2小时让它吐沙，再搓洗干净。壳破的、敲一敲也不合上的都扔掉。",
   "4": "如果买的花蛤没有吐过沙，提前把它泡在淡盐水里（每升水约1大勺盐），放在暗处1-2小时让它吐沙，再搓洗干净。壳破的、敲一敲也不合上的都扔掉。",
   "6": "如果买的花蛤没有吐过沙，提前把它泡在淡盐水里（每升水约1大勺盐），放在暗处1-2小时让它吐沙，再搓洗干净。壳破的、敲一敲也不合上的都扔掉。"
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
  "lang": "en",
  "cc": "GB",
  "id": "gb_baconeggpie",
  "k": 2,
  "before": "Crack 5 eggs over the top, keeping the yolks whole. Beat the last egg with the milk, parsley and pepper and pour into the gaps, keeping a little back for glazing.",
  "after": {
   "1": "Crack 5 eggs over the top, keeping the yolks whole. Beat the last egg with the milk, parsley and pepper and pour into the gaps, keeping a little back for glazing.",
   "3": "Crack 5 eggs over the top, keeping the yolks whole. Beat the last egg with the milk, parsley and pepper and pour into the gaps, keeping a little back for glazing.",
   "4": "Crack 5 eggs over the top, keeping the yolks whole. Beat the last egg with the milk, parsley and pepper and pour into the gaps, keeping a little back for glazing.",
   "6": "Crack 5 eggs over the top, keeping the yolks whole. Beat the last egg with the milk, parsley and pepper and pour into the gaps, keeping a little back for glazing."
  }
 },
{
  "lang": "en",
  "cc": "GB",
  "id": "gb_glamorgan",
  "k": 1,
  "before": "Mix 100 g of the breadcrumbs with the grated cheese, leek, parsley, thyme, mustard, 1 egg yolk, salt and pepper; add a little milk if needed to bring it together.",
  "after": {
   "1": "Mix 50 g of the breadcrumbs with the grated cheese, leek, parsley, thyme, mustard, 1 egg yolk, salt and pepper; add a little milk if needed to bring it together.",
   "3": "Mix 150 g of the breadcrumbs with the grated cheese, leek, parsley, thyme, mustard, 2 egg yolks, salt and pepper; add a little milk if needed to bring it together.",
   "4": "Mix 200 g of the breadcrumbs with the grated cheese, leek, parsley, thyme, mustard, 2 egg yolks, salt and pepper; add a little milk if needed to bring it together.",
   "6": "Mix 300 g of the breadcrumbs with the grated cheese, leek, parsley, thyme, mustard, 3 egg yolks, salt and pepper; add a little milk if needed to bring it together."
  }
 },
{
  "lang": "th",
  "cc": "TH",
  "id": "th_khaiyatsai",
  "k": 1,
  "before": "Beat the eggs with the fish sauce. For each omelette, heat a little oil in a wide pan over medium heat and swirl in the beaten egg from 2 eggs to make a thin round.",
  "after": {
   "1": "Beat the eggs with the fish sauce. For each omelette, heat a little oil in a wide pan over medium heat and swirl in the beaten egg from 2 eggs to make a thin round.",
   "3": "Beat the eggs with the fish sauce. For each omelette, heat a little oil in a wide pan over medium heat and swirl in the beaten egg from 2 eggs to make a thin round.",
   "4": "Beat the eggs with the fish sauce. For each omelette, heat a little oil in a wide pan over medium heat and swirl in the beaten egg from 2 eggs to make a thin round.",
   "6": "Beat the eggs with the fish sauce. For each omelette, heat a little oil in a wide pan over medium heat and swirl in the beaten egg from 2 eggs to make a thin round."
  }
 },
{
  "lang": "th",
  "cc": "TH",
  "id": "th_khaiyatsai",
  "k": 1,
  "before": "ตีไข่กับน้ำปลา ทำทีละแผ่น ตั้งกระทะใบกว้างไฟกลาง ใส่น้ำมันเล็กน้อย เทไข่ที่ตีแล้วประมาณ 2 ฟองต่อแผ่น แล้วเอียงกระทะให้เป็นแผ่นบาง",
  "after": {
   "1": "ตีไข่กับน้ำปลา ทำทีละแผ่น ตั้งกระทะใบกว้างไฟกลาง ใส่น้ำมันเล็กน้อย เทไข่ที่ตีแล้วประมาณ 2 ฟองต่อแผ่น แล้วเอียงกระทะให้เป็นแผ่นบาง",
   "3": "ตีไข่กับน้ำปลา ทำทีละแผ่น ตั้งกระทะใบกว้างไฟกลาง ใส่น้ำมันเล็กน้อย เทไข่ที่ตีแล้วประมาณ 2 ฟองต่อแผ่น แล้วเอียงกระทะให้เป็นแผ่นบาง",
   "4": "ตีไข่กับน้ำปลา ทำทีละแผ่น ตั้งกระทะใบกว้างไฟกลาง ใส่น้ำมันเล็กน้อย เทไข่ที่ตีแล้วประมาณ 2 ฟองต่อแผ่น แล้วเอียงกระทะให้เป็นแผ่นบาง",
   "6": "ตีไข่กับน้ำปลา ทำทีละแผ่น ตั้งกระทะใบกว้างไฟกลาง ใส่น้ำมันเล็กน้อย เทไข่ที่ตีแล้วประมาณ 2 ฟองต่อแผ่น แล้วเอียงกระทะให้เป็นแผ่นบาง"
  }
 },
{
  "lang": "ja",
  "cc": "TH",
  "id": "th_khaiyatsai",
  "k": 1,
  "before": "卵をナンプラーと溶く。1枚ずつ、広いフライパンを中火で熱して油を少しひき、卵液を卵2個分ずつ流して回し広げ、薄い円形にする。",
  "after": {
   "1": "卵をナンプラーと溶く。1枚ずつ、広いフライパンを中火で熱して油を少しひき、卵液を卵2個分ずつ流して回し広げ、薄い円形にする。",
   "3": "卵をナンプラーと溶く。1枚ずつ、広いフライパンを中火で熱して油を少しひき、卵液を卵2個分ずつ流して回し広げ、薄い円形にする。",
   "4": "卵をナンプラーと溶く。1枚ずつ、広いフライパンを中火で熱して油を少しひき、卵液を卵2個分ずつ流して回し広げ、薄い円形にする。",
   "6": "卵をナンプラーと溶く。1枚ずつ、広いフライパンを中火で熱して油を少しひき、卵液を卵2個分ずつ流して回し広げ、薄い円形にする。"
  }
 },
{
  "lang": "hi",
  "cc": "IN",
  "id": "in_thukpa",
  "k": 0,
  "before": "Boil the noodles as the packet says (about 4–5 minutes) until just tender, drain, rinse and divide between the serving bowls.",
  "after": {
   "1": "Boil the noodles as the packet says (about 4–5 minutes) until just tender, drain, rinse and divide between the serving bowls.",
   "3": "Boil the noodles as the packet says (about 4–5 minutes) until just tender, drain, rinse and divide between the serving bowls.",
   "4": "Boil the noodles as the packet says (about 4–5 minutes) until just tender, drain, rinse and divide between the serving bowls.",
   "6": "Boil the noodles as the packet says (about 4–5 minutes) until just tender, drain, rinse and divide between the serving bowls."
  }
 },
{
  "lang": "hi",
  "cc": "IN",
  "id": "in_thukpa",
  "k": 0,
  "before": "नूडल्स पैकेट के अनुसार (लगभग 4–5 मिनट) उबालें जब तक बस नरम न हो जाएँ, पानी निकालें, धोएँ और परोसने के कटोरों में बाँट दें।",
  "after": {
   "1": "नूडल्स पैकेट के अनुसार (लगभग 4–5 मिनट) उबालें जब तक बस नरम न हो जाएँ, पानी निकालें, धोएँ और परोसने के कटोरों में बाँट दें।",
   "3": "नूडल्स पैकेट के अनुसार (लगभग 4–5 मिनट) उबालें जब तक बस नरम न हो जाएँ, पानी निकालें, धोएँ और परोसने के कटोरों में बाँट दें।",
   "4": "नूडल्स पैकेट के अनुसार (लगभग 4–5 मिनट) उबालें जब तक बस नरम न हो जाएँ, पानी निकालें, धोएँ और परोसने के कटोरों में बाँट दें।",
   "6": "नूडल्स पैकेट के अनुसार (लगभग 4–5 मिनट) उबालें जब तक बस नरम न हो जाएँ, पानी निकालें, धोएँ और परोसने के कटोरों में बाँट दें।"
  }
 },
{
  "lang": "tr",
  "cc": "TR",
  "id": "tr_cilbir",
  "k": 0,
  "before": "Mix the yogurt with the crushed garlic and a little salt and spread it on the serving plates. It should be at room temperature.",
  "after": {
   "1": "Mix the yogurt with the crushed garlic and a little salt and spread it on the serving plates. It should be at room temperature.",
   "3": "Mix the yogurt with the crushed garlic and a little salt and spread it on the serving plates. It should be at room temperature.",
   "4": "Mix the yogurt with the crushed garlic and a little salt and spread it on the serving plates. It should be at room temperature.",
   "6": "Mix the yogurt with the crushed garlic and a little salt and spread it on the serving plates. It should be at room temperature."
  }
 },
{
  "lang": "tr",
  "cc": "TR",
  "id": "tr_cilbir",
  "k": 0,
  "before": "Yoğurdu ezilmiş sarımsak ve biraz tuzla karıştırıp servis tabaklarına yayın. Oda sıcaklığında olmalı.",
  "after": {
   "1": "Yoğurdu ezilmiş sarımsak ve biraz tuzla karıştırıp servis tabaklarına yayın. Oda sıcaklığında olmalı.",
   "3": "Yoğurdu ezilmiş sarımsak ve biraz tuzla karıştırıp servis tabaklarına yayın. Oda sıcaklığında olmalı.",
   "4": "Yoğurdu ezilmiş sarımsak ve biraz tuzla karıştırıp servis tabaklarına yayın. Oda sıcaklığında olmalı.",
   "6": "Yoğurdu ezilmiş sarımsak ve biraz tuzla karıştırıp servis tabaklarına yayın. Oda sıcaklığında olmalı."
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
 },
 {
  "lang": "en",
  "why": "残す量（all but 1 tbsp）はそのまま",
  "before": "Cook the bacon until crisp. Lift out, crumble, and pour off all but 1 tbsp of the fat.",
  "after": null
 },
{
  "lang": "en",
  "why": "残す量（leaving 1 tbsp）はそのまま",
  "before": "When the edges turn golden, pour off excess fat, leaving 1 tbsp.",
  "after": null
 },
{
  "lang": "es",
  "why": "残す量（Deja solo 1 cucharada）はそのまま",
  "before": "Licúa los jitomates. Deja solo 1 cucharada de aceite en la olla y fríe el licuado 5 minutos.",
  "after": null
 },
{
  "lang": "ja",
  "why": "残す量（大さじ1だけ残して）はそのまま",
  "before": "ベーコンを焼き、取り出して砕き、脂は大さじ1だけ残して捨てる。",
  "after": null
 },
{
  "lang": "ja",
  "why": "残す量（大さじ1を残して）はそのまま",
  "before": "油を大さじ1残して捨て、にんにくを炒める。",
  "after": null
 },
{
  "lang": "ja",
  "why": "1人分ずつ の文の分量はそのまま",
  "before": "1人分ずつ、卵2個と牛乳大さじ1を溶き、半熟に焼く。",
  "after": null
 },
{
  "lang": "ja",
  "why": "1人分ずつ の文の「溶き卵1個分」はそのまま",
  "before": "1人分ずつ、かつをのせて溶き卵1個分を回し入れ、ふたをして1分煮る。",
  "after": null
 },
{
  "lang": "en",
  "why": "For each serving の文の分量はそのまま",
  "before": "For each serving, beat 2 eggs with 1 tbsp milk and cook until half-set.",
  "after": null
 },
{
  "lang": "en",
  "why": "each with 〜 の分量（1つ分）はそのまま",
  "before": "Lay the beef flat, season and spread each with 1 tsp mustard.",
  "after": null
 },
{
  "lang": "de",
  "why": "jeweils の分量（1つ分）はそのまま",
  "before": "Die Rouladen ausbreiten und jeweils mit 1 TL Senf bestreichen.",
  "after": null
 },
{
  "lang": "pl",
  "why": "każdy の分量（1つ分）はそのまま",
  "before": "Na każdy naleśnik nałóż 2 łyżki farszu i zwiń.",
  "after": null
 },
{
  "lang": "en",
  "why": "of each wrapper（1つ分）はそのまま",
  "before": "Put 1 tsp of filling in the centre of each wrapper, wet the edges and fold.",
  "after": null
 },
{
  "lang": "en",
  "why": "per litre（水1Lあたり）はそのまま",
  "before": "Soak the clams in salted water (about 1 tbsp salt per litre) for 1 hour.",
  "after": null
 },
{
  "lang": "en",
  "why": "For each omelette, 〜（1枚ぶん）はそのまま",
  "before": "Beat the eggs. For each omelette, heat a little oil and swirl in the beaten egg from 2 eggs.",
  "after": null
 },
{
  "lang": "en",
  "why": "1 (400 g) can など缶の大きさはそのまま",
  "before": "Add 1 (400 g) can of tomatoes and a 2 x 400 g can of beans.",
  "after": null
 },
{
  "lang": "en",
  "why": "on each side（片面ずつ）の言葉があっても、油の量は人数に合わせる",
  "before": "Heat 2 tbsp oil and fry the chops 4 minutes on each side.",
  "after": {
   "1": "Heat 1 tbsp oil and fry the chops 4 minutes on each side.",
   "3": "Heat 3 tbsp oil and fry the chops 4 minutes on each side.",
   "4": "Heat 4 tbsp oil and fry the chops 4 minutes on each side.",
   "6": "Heat 6 tbsp oil and fry the chops 4 minutes on each side."
  }
 },
{
  "lang": "ja",
  "why": "片面2分ずつ があっても、油の量は人数に合わせる",
  "before": "フライパンに油大さじ1を熱して片面2分ずつ焼く。",
  "after": {
   "1": "フライパンに油大さじ1/2を熱して片面2分ずつ焼く。",
   "3": "フライパンに油大さじ1と1/2を熱して片面2分ずつ焼く。",
   "4": "フライパンに油大さじ2を熱して片面2分ずつ焼く。",
   "6": "フライパンに油大さじ3を熱して片面2分ずつ焼く。"
  }
 },
{
  "lang": "ja",
  "why": "少しずつ（回数の言葉）があっても、分量は人数に合わせる",
  "before": "小麦粉に水大さじ2を少しずつ加えて混ぜる。",
  "after": {
   "1": "小麦粉に水大さじ1を少しずつ加えて混ぜる。",
   "3": "小麦粉に水大さじ3を少しずつ加えて混ぜる。",
   "4": "小麦粉に水大さじ4を少しずつ加えて混ぜる。",
   "6": "小麦粉に水大さじ6を少しずつ加えて混ぜる。"
  }
 },
{
  "lang": "ja",
  "why": "合（炊飯器の目盛り）は人数に合わせる",
  "before": "炊飯器に米と調味料を入れ、だしを2合の目盛りまで注ぐ。",
  "after": {
   "1": "炊飯器に米と調味料を入れ、だしを1合の目盛りまで注ぐ。",
   "3": "炊飯器に米と調味料を入れ、だしを3合の目盛りまで注ぐ。",
   "4": "炊飯器に米と調味料を入れ、だしを4合の目盛りまで注ぐ。",
   "6": "炊飯器に米と調味料を入れ、だしを6合の目盛りまで注ぐ。"
  }
 },
{
  "lang": "ja",
  "why": "「合わせる」は単位ではない",
  "before": "調味料を2合わせにして混ぜ合わせる。",
  "after": null
 },
{
  "lang": "ja",
  "why": "卵は半分にできないので個数は切り上げる",
  "before": "卵1個はゆで卵にして刻む。",
  "after": {
   "1": "卵1個はゆで卵にして刻む。",
   "3": "卵2個はゆで卵にして刻む。",
   "4": "卵2個はゆで卵にして刻む。",
   "6": "卵3個はゆで卵にして刻む。"
  }
 },
{
  "lang": "ja",
  "why": "玉ねぎは半分でもよい",
  "before": "玉ねぎ1個をみじん切りにする。",
  "after": {
   "1": "玉ねぎ1/2個をみじん切りにする。",
   "3": "玉ねぎ1と1/2個をみじん切りにする。",
   "4": "玉ねぎ2個をみじん切りにする。",
   "6": "玉ねぎ3個をみじん切りにする。"
  }
 },
{
  "lang": "ar",
  "why": "ml・ملاعق・لتر はすべて人数に合わせる",
  "before": "ضيفي 600 مل ميه و4 ملاعق زيت و1.2 لتر مرقة.",
  "after": {
   "1": "ضيفي 300 مل ميه و2 ملعقة زيت و0.6 لتر مرقة.",
   "3": "ضيفي 900 مل ميه و6 ملاعق زيت و1.8 لتر مرقة.",
   "4": "ضيفي 1200 مل ميه و8 ملاعق زيت و2.4 لتر مرقة.",
   "6": "ضيفي 1800 مل ميه و12 ملعقة زيت و3.6 لتر مرقة."
  }
 },
{
  "lang": "ar",
  "why": "ملح の「مل」は ml と間違えない",
  "before": "اخلطي الملح مع 300 ملح.",
  "after": null
 },
{
  "lang": "hi",
  "why": "मि.ली.・बड़े चम्मच・छोटा चम्मच は人数に合わせる",
  "before": "250 मि.ली. पानी, 1 बड़े चम्मच तेल और 1 छोटा चम्मच जीरा।",
  "after": {
   "1": "130 मि.ली. पानी, 1/2 बड़ा चम्मच तेल और 1/2 छोटा चम्मच जीरा।",
   "3": "380 मि.ली. पानी, 1 1/2 बड़े चम्मच तेल और 1 1/2 छोटे चम्मच जीरा।",
   "4": "500 मि.ली. पानी, 2 बड़े चम्मच तेल और 2 छोटे चम्मच जीरा।",
   "6": "750 मि.ली. पानी, 3 बड़े चम्मच तेल और 3 छोटे चम्मच जीरा।"
  }
 },
{
  "lang": "hi",
  "why": "मिनट（分）は मि.ली. ではない",
  "before": "10 मिनट पकाएँ और 5 मिनट रखें।",
  "after": null
 },
{
  "lang": "zh-Hans",
  "why": "大勺・小勺 は人数に合わせる",
  "before": "锅里放1.5大勺油，加1小勺盐和200毫升水。",
  "after": {
   "1": "锅里放3/4大勺油，加1/2小勺盐和100毫升水。",
   "3": "锅里放2 1/4大勺油，加1 1/2小勺盐和300毫升水。",
   "4": "锅里放3大勺油，加2小勺盐和400毫升水。",
   "6": "锅里放4 1/2大勺油，加3小勺盐和600毫升水。"
  }
 },
{
  "lang": "id",
  "why": "sdm・sdt は人数に合わせる",
  "before": "Tumis dengan 2 sdm minyak dan 1/2 sdt garam.",
  "after": {
   "1": "Tumis dengan 1 sdm minyak dan 1/4 sdt garam.",
   "3": "Tumis dengan 3 sdm minyak dan 3/4 sdt garam.",
   "4": "Tumis dengan 4 sdm minyak dan 1 sdt garam.",
   "6": "Tumis dengan 6 sdm minyak dan 1 1/2 sdt garam."
  }
 },
{
  "lang": "pl",
  "why": "litr（ポーランド語）は数に合わせて形を変える",
  "before": "Wlej 1 litr wody i 1,2 litra bulionu.",
  "after": {
   "1": "Wlej 0,5 litra wody i 0,6 litra bulionu.",
   "3": "Wlej 1,5 litra wody i 1,8 litra bulionu.",
   "4": "Wlej 2 litry wody i 2,4 litra bulionu.",
   "6": "Wlej 3 litry wody i 3,6 litra bulionu."
  }
 },
{
  "lang": "en",
  "why": "英語の卵の個数（2 eggs・1 egg yolk）は切り上げ",
  "before": "Beat 2 eggs and 1 egg yolk with the milk.",
  "after": {
   "1": "Beat 1 egg and 1 egg yolk with the milk.",
   "3": "Beat 3 eggs and 2 egg yolks with the milk.",
   "4": "Beat 4 eggs and 2 egg yolks with the milk.",
   "6": "Beat 6 eggs and 3 egg yolks with the milk."
  }
 },
{
  "lang": "en",
  "why": "the last egg があるときは卵の個数をそのまま（1個残す書き方）",
  "before": "Crack 5 eggs over the top. Beat the last egg with the milk.",
  "after": null
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
for (const c of SAME) for (const sv of [1, 3, 4, 6]) check(`${c.lang} ${c.why || ""} ${sv}人`, scaleSteps(c.before, sv / 2, /egg/i.test(c.before) ? ["Eggs", "卵"] : ["卵", "玉ねぎ"]).s, c.after ? c.after[sv] : c.before);
// すべての手順で、温度・時間・大きさの数が変わらないこと
const KEEP = /\d+(?:[.,]\d+)?\s*(?:°C|°F|℃|cm|mm|分|秒|時間|minutes?|hours?|นาที|분|ซม)/g;
for (const st of steps) for (const sv of [1, 3, 6]){ const out = scaleSteps(st.s, sv / 2, st.names).s; const a = (st.s.match(KEEP) || []).join("|"), b = (out.match(KEEP) || []).join("|"); if (a !== b) check(`温度・時間・大きさ ${st.cc} ${st.id} #${st.k}`, b, a); }
// 作り方の文の分量: 数を直した数(n)と、文が変わったかどうかが一致すること（「直したのに注記が出ない」「直していないのに出る」を防ぐ）
for (const st of steps) for (const sv of [1, 3, 4, 6]){ const x = scaleSteps(st.s, sv / 2, st.names); if ((x.s !== st.s) !== (x.n > 0)) check(`n と文の変化 ${st.cc} ${st.id} #${st.k} ${sv}人`, String(x.n), x.s !== st.s ? "1以上" : "0"); }
// 直した文には、直す前の分量（stepHasAmount）があること
for (const st of steps){ const x = scaleSteps(st.s, 2, st.names); if (x.n > 0 && !stepHasAmount(st.s)) check(`分量ありの判定 ${st.cc} ${st.id} #${st.k}`, "なし", "あり"); }
// 「分量の注記」を出すかどうかの判定（stepHasAmount）: 時間・温度・大きさ・「4等分」だけなら分量なし
for (const [t, want] of [["中火で10分煮る。4等分に切る。", false], ["170℃の油で2〜3分揚げる。4cm長さに切る。", false], ["Bake 20-25 minutes at 200°C. Cut into 3 cm cubes.", false], ["Cook 1 h 15 until soft.", false],
    ["卵2個を溶く。", true], ["水600mlを加える。", true], ["Add 2 tbsp oil.", true], ["12個に丸める。", true], ["Make 4 hollows and crack in the eggs.", true], ["油大さじ1を熱す。", true]]) check(`stepHasAmount ${t}`, String(stepHasAmount(t)), String(want));
console.log(`${n - fail}/${n} ok`); process.exit(fail ? 1 : 0);
