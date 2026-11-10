# カロリーの目安 — 食材の表の出典と換算のきまり

アプリの「約 ◯◯ kcal（1人分・目安）」は、`gohancho/index.html` の `KC_FOODS`（食材ごとの 100g あたり kcal）と `kcalCalc()`（量の換算）で出しています。
表はアプリの中に持ち、外へは通信しません（有料の API も使いません）。

## 出典

| 印 | 出典 | 使い方 |
|---|---|---|
| 八訂 (`s: 'M'`) | 文部科学省 科学技術・学術審議会 資源調査分科会「日本食品標準成分表（八訂）2020年版」エネルギー（kcal/100g、可食部） | 日本の食材・調味料と、日本でも同じ物（肉・魚・野菜・油・砂糖など） |
| USDA (`s: 'U'`) | U.S. Department of Agriculture, Agricultural Research Service, FoodData Central（SR Legacy / Foundation Foods）Energy (kcal/100g) | 日本の成分表にない、ほかの国の食材（豆の缶詰・トルティーヤ・チーズの種類など） |
| — (`s: 'X'` / `'-'`) | 決まった出典なし（水・だしなど 0 に近い物、ケルアックなど情報の少ない物） | |

### 出典未確認（大事）

- この版を作った作業環境からは、`mext.go.jp`・`fooddb.mext.go.jp`・`fdc.nal.usda.gov`・`api.nal.usda.gov` に**つながりませんでした**（ネットワークの許可外）。
- そのため、表の値は**作り手の知識による値で、すべて「出典未確認」**です。上の「印」は「どの表の値にそろえるつもりか」を表すもので、照らし合わせ済みという意味ではありません。
- 値は目安として丸めています（例: 鶏もも皮つき 190、豚ばら 366、精白米 342、めし 156、調合油 886、上白糖 391、こいくち醤油 77、全卵 142 など）。
- 一つの行に似た食材をまとめているので（例: 「白身魚」= たら・たい・すずき・ティラピアなど 90）、個々の食材とは差があります。

### 確かめるとき（手順）

1. 文部科学省「食品成分データベース」（https://fooddb.mext.go.jp/）または FoodData Central（https://fdc.nal.usda.gov/）で、下の表の食材を引く。
2. 値が 1 割以上ちがえば `KC_FOODS` の数を直し、この表の行も直す。確かめた行は「出典未確認」を外して、版と食品番号を書く。
3. `node tools/tests/kcal-r1.mjs` と `docs/kcal-check.md` の表を流し直す。

## 量の換算

| 書き方 | 換算 |
|---|---|
| g・kg・ml・l・cl・dl・oz・lb | そのまま（ml は食材ごとの重さ `d` g/ml。なければ 1.0） |
| 大さじ・tbsp | 15ml × d |
| 小さじ・tsp | 5ml × d |
| カップ（日本） | 200ml × d |
| cup | 240ml × d |
| 1合 | 180ml（米は 150g） |
| かっこの中のグラム「2 medium (300 g)」「1腹（80g）」 | かっこの中のグラムを使う。`each`（1つあたり）は数を掛ける。「2 x 145 g」も掛ける |
| 個・本・枚・切れ・尾・玉・丁・株・数だけ（「2」） | 食材ごとの標準の重さ `p`、数え方ごとの重さ `u`（例: キャベツ 1個 1200g・1枚 50g、大根 1cm 30g） |
| clove・head・bunch・handful・sprig・slice・can など | 食材の `u` → なければ決まった重さ（clove 5g・bunch 80g・handful 30g・sprig 2g・slice 25g・can 400g など） |
| small / large（小・大） | ×0.7 / ×1.4 |
| 1/2・1 1/2・1と1/2・½・2-3（→ 2.5） | 数として読む |
| 少々・適量・to taste・pinch・a little・量なし | 0（数えない） |
| to serve・お好みで（添えるだけで量なし） | 数えない |

### そのほかのきまり

- **何人分か**: アプリのレシピは2人分が基準（自作レシピも2人分に直して持つ）なので、合計を2で割る。
  ただし、材料が2人分としては多すぎるレシピ（1人分の重さが 主菜 400g・主食の入った主菜/ご飯もの/麺 650g・副菜 200g・汁ものの具 300g を超えるもの）は、その重さになる人数で割る。
  乾いた米（×2.3）・乾麺・パスタ（×2.4〜3）・乾いた豆（×2.5）などは、炊いた・ゆでた重さに直して見る。
- **当て違いを防ぐ順番（R154）**: スイスチャード（swiss chard・acelga・チャード）はチーズより前の葉物の行（22 kcal/100g）。青ねぎ・わけぎ・spring onion・scallion・green onion は玉ねぎより前の行で 1本 10〜15g（玉ねぎ1個 200g にしない）。daepa（韓国の太いねぎ）は長ねぎの行。
- **豆（R154）**: 乾いた豆の行に当たっても、canned・tinned・cooked・boiled・drained・缶・水煮 などとあれば、ゆでた豆の値（豆 110・ひよこ豆 139・大豆 124）にする。dried・乾燥・soaked とあれば乾物のまま。
- **小玉ねぎ・豚の肩（R164）**: 小玉ねぎ（pearl onions・baby onions・small white onions〔複数〕・petits oignons・ペコロスなど）は玉ねぎより前の行で 1個 約18g（玉ねぎ1個 200g にしない。「1 small onion」はふつうの玉ねぎの小さめのまま）。pork shoulder・pork butt・pork collar・pork neck は豚バラ（belly）より前の行で、ふつうの豚肉の値（237）。「Pork shoulder or belly」が belly に当たっていた。値は出典未確認。
  缶のグラム（「400 g tin」「2 cans (800 g)」）は中身全体の重さなので、汁を切った重さとして 6 割にする（drained と書いてあればそのまま）。生・冷凍のそら豆などは 102、mung bean sprouts はもやし。値はどれも**出典未確認**。
- **なくても可（?）の材料**は入れない。
- **骨・殻つき**（手羽元・スペアリブ・あさりなど）は食べられる割合 `e`（0.4〜0.7）を掛ける。
- **調味料・油**も入れる（調味料の欄も読む）。
- **揚げ物の吸油**: 揚げ油の量はそのまま足さない。揚げる材料（ご飯・麺・パンは除く）の重さ × 吸油率の油（886 kcal/100g）を足す。
  吸油率: パン粉・天ぷらの衣 13%、粉をまぶす（唐揚げなど）7%、素揚げ 5%。
  目安は、日本食品標準成分表（八訂）の揚げ物の脂質の増え方や、調理の一般的な資料（素揚げ 3〜8%、から揚げ 6〜8%、天ぷら・フライ 10〜20% 程度）による。**出典未確認**。
  「oil for frying」「揚げ油」のほか、1回に 100g 以上（揚げ物なら 60g 以上）の油も揚げ油とみる。
- **水・だし・スープ**はほぼ 0 kcal（だし・スープ 5 kcal/100g）。重さの割合にも数えない。

## 出せないとき

- 重さを推せた割合が **7 割未満**（わからない食材・わからない量の物が重さの 3 割を超える。水・だしは数えない）のときは、数字を出さずに「カロリーの目安を出せません」。
  わからない食材の重さは、グラムが書いてあればそのグラム、なければ 1つ 80g とみて割合だけに使う。
- **1人分が上限を超えるとき（R154）**: レシピのデータには「何人分か」の欄がなく、2人分として割っている。パイ・キッシュ（型1台分）など、1回に作る量で書かれた料理は 1人分が大きすぎる数になるので、
  主菜 1100・ご飯もの/麺 1200・副菜 600・汁もの 800 kcal を超えたら、数字を出さずに「カロリーの目安を出せません（1回に作る量が多く、何人分かわからないため）」（21か国で 21 品）。ダイエットモードでは、この料理は「重め」とみる。
  確かめ: `node tools/qa/kcal-scan.mjs 後.json 前.json`（全料理の値と、前とのちがい）。
  R164: 理由を分ける。1回に作る量で書かれた料理（材料が2人分には多すぎて、もっと多い人数で割った料理・名前がパイ・キッシュ・タルトなど型1台分の料理）は今の文のまま。
  2人分の量なのに上限を超える料理（揚げピーナッツ・滷花生・滷肉飯など。読みとりの誤りか本当に高いかを確かめられない）は「カロリーの目安を出せません（材料の量から出した数が、1人分としては多すぎるため）」。
- 1人分が 30 kcal 未満の料理は、数字ではなく「30 kcal 未満（1人分・目安）」と出す。
- お膳の合計は、出せない料理が 1 つでもあれば「お膳の合計の目安は出せません（「料理名」の目安を出せないため）」（R164。主食の目安がないときは「主食の目安がないため」）。

## 主食の席（お膳の合計に入れる）

| 主食 | 1人分 | 中身 |
|---|---|---|
| 白ご飯（各国のご飯の主食も） | 234 | めし 150g × 156 |
| 玄米ご飯・雑穀ご飯・赤米 | 228〜230 | 150g |
| もち米（カオニャオ） | 282 | 150g × 188 |
| おかゆ（白がゆ） | 163 | 250g × 65 |
| パン（トースト）| 184 | 食パン 60g ＋ バター 5g |
| パン・バゲット・ロールパンなど | 159〜210 | 60〜70g |
| ゆでじゃがいも | 154 | 200g |
| トルティーヤ（とうもろこし／小麦粉） | 183 / 274 | 3枚 / 2枚 |
| そのほか（ポレンタ・カーシャ・ピラウ・ロティ・マントウなど） | 138〜310 | `KCAL_STAPLE` を参照 |

お漬物・福神漬けなどの香の物は、量が少ないので入れていない。

## 食材の表（`KC_FOODS`。上から順に見て最初に当たった行。値はすべて出典未確認）

| 食材（代表の言葉） | kcal/100g | 合わせる表 | 1つの重さ・数え方 | g/ml |
|---|---|---|---|---|
| 冷水・お湯・熱湯・water・ice・ice cubes | 0 | — |  |  |
| だし・出汁・stock・broth・bouillon | 5 | 八訂 |  |  |
| お茶・緑茶・煎茶・tea・tea bags・instant coffee | 1 | 八訂 |  |  |
| 鶏ガラスープの素・中華だし・顆粒・stock cubes・bouillon powder・cubes | 230 | 八訂 | 5g・cube 5g・個 5g | 0.6 |
| トムヤムペースト・カレーペースト・curry paste・curry base・tikka masala paste | 200 | USDA |  | 1 |
| カレー・シチュー・ハヤシルウ・roux | 474 | 八訂 | 箱 180g |  |
| デミグラス | 82 | 八訂 | 缶 290g |  |
| cream of mushroom・condensed .soup | 70 | USDA | can 300g |  |
| 揚げ油・for deep・shallow・panfrying | 886 | 八訂 |  | 0.92 |
| ラー油・chili oil・chilli oil | 887 | 八訂 |  | 0.92 |
| ごま油・オリーブオイル・サラダ油・olive・vegetable・sunflower | 886 | 八訂 |  | 0.92 |
| バター・牛脂・ghee・butter・lard | 700 | 八訂 | stick 113g・knob 15g・個 10g | 0.85 |
| マヨネーズ・タルタル・mayonnaise・aioli・allioli | 668 | 八訂 |  | 0.85 |
| はちみつ・蜂蜜・honey | 329 | 八訂 |  | 1.4 |
| メープル・maple syrup・golden syrup・molasses | 266 | 八訂 |  | 1.3 |
| みりん・mirin | 241 | 八訂 |  | 1.2 |
| 砂糖・sugar・palm sugar・jaggery | 390 | 八訂 |  | 0.6 |
| ジャム・jam・marmalade | 250 | 八訂 |  | 1.3 |
| チョコ・chocolate | 550 | 八訂 |  |  |
| 薄口醤油・うすくち | 60 | 八訂 |  | 1.2 |
| 醤油・しょうゆ・soy・soya・shoyu | 77 | 八訂 |  | 1.2 |
| 白味噌 | 217 | 八訂 |  | 1.15 |
| 味噌・みそ・豆板醤・miso・cheonggukjang・doenjang | 182 | 八訂 |  | 1.15 |
| コチュジャン・gochujang | 247 | 八訂 |  | 1.15 |
| 甜麺醤・hoisin・sweet bean sauce・sacha | 249 | 八訂 |  | 1.15 |
| オイスターソース・oyster sauce・mushroom stir-fry sauce・vegetarian oyster | 105 | 八訂 |  | 1.2 |
| ナンプラー・fish sauce・nam pla・patis | 47 | 八訂 |  | 1.2 |
| ケチャップ・ketchup | 104 | 八訂 |  | 1.1 |
| ポン酢・ぽん酢 | 59 | 八訂 |  | 1.1 |
| めんつゆ | 98 | 八訂 |  | 1.1 |
| 中濃ソース・とんかつソース・お好みソース・worcestershire・brown sauce・bbq sauce | 129 | 八訂 |  | 1.2 |
| スイートチリ・sweet chili sauce・chili jam・nam prik pao | 230 | USDA |  | 1.2 |
| hot・chili・chilli | 40 | USDA |  | 1 |
| tomato sauce・tomate frito・pasta sauce | 60 | USDA |  | 1.05 |
| 練りごま・ごまだれ・tahini・sesame paste | 646 | 八訂 |  | 1 |
| peanut butter・peanut sauce・satay sauce | 588 | USDA |  | 1 |
| からし・マスタード・mustard | 175 | 八訂 |  | 1 |
| pomegranate molasses・tamarind paste・pulp | 240 | USDA |  | 1.1 |
| tamarind water・tamarind mix・sinigang | 330 | USDA | sachet 22g |  |
| トマトペースト・tomato paste・tomato pure・pepper paste | 82 | USDA |  | 1.1 |
| vinegar・vinagre | 25 | 八訂 |  | 1 |
| 料理酒・赤ワイン・白ワイン・wine・sherry・port | 100 | 八訂 |  | 1 |
| 酒粕 | 215 | 八訂 |  |  |
| レモン汁・レモン果汁・ライム汁・lemon juice・lime juice・juice of | 26 | 八訂 | 1つ 15g | 1 |
| 水溶き片栗粉 | 113 | 八訂 |  | 1 |
| 片栗粉・でん粉・starch・cornstarch・corn starch | 338 | 八訂 |  | 0.6 |
| パン粉・breadcrumbs・bread crumbs・panko | 369 | 八訂 |  | 0.25 |
| 天かす・揚げ玉 | 589 | 八訂 |  | 0.35 |
| ホットケーキミックス・pancake mix・buchim garu・tempura mix | 360 | 八訂 |  | 0.55 |
| 小麦粉・薄力粉・強力粉・flour・atta・besan | 350 | 八訂 |  | 0.55 |
| ベーキング・イースト・baking powder・baking soda・bicarbonate | 150 | USDA |  | 0.8 |
| カレー粉・curry powder・garam masala・chaat masala | 330 | 八訂 |  | 0.5 |
| こしょう・胡椒・ナツメグ・black・white・ground | 300 | USDA | 0.5g・cm 1g・piece 2g・stick 3g | 0.5 |
| 粗塩・あら塩・salt・sea salt・black salt | 0 | 八訂 |  | 1.2 |
| うずらの卵・quail eggs | 157 | 八訂 | 10g |  |
| salted duck eggs・century eggs・pidan | 190 | USDA | 60g |  |
| ゆで卵・たまご・eggs・egg yolks・egg whites | 142 | 八訂 | 50g・yolk 17g・white 33g |  |
| ピザ用チーズ・シュレッド | 340 | 八訂 |  | 0.45 |
| 粉チーズ・parmesan・parmigiano・grana padano | 445 | 八訂 |  | 0.4 |
| クリームチーズ・cream cheese・requeijo・catupiry | 313 | 八訂 |  | 1 |
| ricotta・cottage cheese・quark | 150 | USDA |  | 1 |
| mozzarella・burrata・bocconcini | 280 | 八訂 |  | 0.45 |
| チーズ・cheese・cheddar・gruyre | 390 | 八訂 | slice 20g・枚 18g | 0.45 |
| 生クリーム・heavy cream・double cream・whipping cream | 404 | 八訂 |  | 1 |
| sour cream・smetana・śmietana | 200 | USDA |  | 1 |
| evaporated milk・condensed milk | 134 | USDA |  | 1.05 |
| ヨーグルト・yoghurt・kefir・ayran | 56 | 八訂 |  | 1.05 |
| coconut cream・kara・santan kental | 330 | USDA |  | 1 |
| ココナッツミルク・coconut milk・santan・gata | 157 | 八訂 |  | 1 |
| coconut water | 19 | USDA |  | 1 |
| 牛乳・ミルク・milk・leite・leche | 61 | 八訂 |  | 1.03 |
| 絹ごし豆腐・silken tofu・soft tofu・sundubu | 56 | 八訂 | 300g・丁 300g・tube 350g・pack 350g |  |
| 厚揚げ・fried tofu・tofu puffs・tahu goreng | 143 | 八訂 | 150g・枚 150g |  |
| 油揚げ・aburaage・inari | 377 | 八訂 | 30g・枚 30g |  |
| 高野豆腐 | 496 | 八訂 | 17g・枚 17g |  |
| pressed tofu・dried tofu・dougan | 200 | USDA | 40g・piece 40g・pieces 40g |  |
| 木綿豆腐・豆腐・tofu・tahu・đậu phụ | 73 | 八訂 | 300g・丁 300g・block 400g |  |
| 納豆.たれ・付属のたれ・添付のたれ | 100 | 八訂 | 6g・袋 6g |  |
| 納豆・natto | 190 | 八訂 | 45g・パック 45g |  |
| おから | 88 | 八訂 |  |  |
| tempeh・tempe | 192 | USDA |  |  |
| 大豆（水煮）・大豆の水煮・枝豆・cooked soybeans・edamame | 124 | 八訂 |  | 0.65 |
| 大豆・soybeans・soya chunks | 372 | 八訂 |  | 0.65 |
| ベーコン・bacon・lardons・pancetta | 400 | 八訂 | 17g・枚 17g・slice 17g・slices 17g |  |
| ハム・ham・gammon・prosciutto | 200 | 八訂 | 15g・枚 12g・slice 20g・slices 20g |  |
| ウインナー・ソーセージ・sausages・wieners・frankfurt | 320 | 八訂 | 60g・本 20g |  |
| corned beef・carne seca・dried beef | 250 | USDA |  |  |
| レバー・liver・livers・chicken livers | 120 | 八訂 |  |  |
| tripe・mondongo・trotters | 230 | USDA |  |  |
| meatballs・bakso・gongwan | 180 | USDA | 15g・ball 15g・balls 15g |  |
| dumplings・mandu・gyoza | 230 | USDA | 25g |  |
| 鶏手羽・手羽元・手羽先・chicken wings・drumsticks・bone-in chicken | 200 | 八訂 | 60g・本 60g |  |
| 鶏むね・ささみ・chicken breast・breast fillet | 133 | 八訂 | 250g・枚 250g |  |
| 鶏もも・chicken thigh・boneless chicken | 190 | 八訂 | 250g・枚 250g |  |
| 鶏ひき・ground chicken・minced chicken・chicken mince | 171 | 八訂 |  |  |
| 鶏肉・chicken・turkey・pollo | 190 | 八訂 | 250g |  |
| 豚バラ・pork belly・samgyeopsal・panceta | 366 | 八訂 | 枚 20g |  |
| 豚ひき・合いびき・ground pork・minced pork・pork mince | 230 | 八訂 |  |  |
| pork ribs・spare ribs・baby back | 290 | USDA |  |  |
| 豚ヒレ・pork tenderloin・pork fillet | 118 | 八訂 | 400g |  |
| 豚もも・豚ロース・pork loin・pork chops・pork escalopes | 200 | 八訂 | 150g・枚 120g |  |
| pork・cerdo・porco | 237 | 八訂 | 150g |  |
| 牛ひき・ground beef・minced beef・beef mince | 251 | 八訂 |  |  |
| 牛バラ・牛カルビ・beef brisket・brisket・flanken | 338 | 八訂 |  |  |
| 牛もも・beef topside・round・sirloin | 160 | 八訂 | 200g |  |
| beef・steak・chuck | 230 | 八訂 | 200g |  |
| ラム・lamb・mutton・goat | 250 | USDA | 100g |  |
| duck・goose | 300 | USDA | 250g |  |
| rabbit・venison・game | 140 | USDA |  |  |
| ツナ.水煮・tuna in water・tuna in brine | 70 | 八訂 | 70g・缶 70g・can 140g・tin 140g |  |
| ツナ・canned tuna・tinned tuna・tuna in olive oil | 265 | 八訂 | 70g・缶 70g・can 140g・tin 140g |  |
| canned sardines・fish・mackerel | 180 | USDA | 155g・can 155g・tin 120g |  |
| かに風味・カニカマ・crab sticks・imitation crab・surimi | 89 | 八訂 | 12g・本 12g |  |
| ちくわ | 119 | 八訂 | 30g・本 30g |  |
| かまぼこ・fish cakes・eomuk・odeng | 100 | 八訂 | 12g・切れ 12g・sheet 50g・sheets 50g |  |
| たらこ・明太子・辛子明太子・roe・mentaiko | 131 | 八訂 | 40g |  |
| ちりめんじゃこ・しらす・whitebait・dried small anchov・teri | 200 | 八訂 |  | 0.4 |
| サーモン・salmon・trout・truta | 160 | 八訂 | 80g・切れ 80g・fillet 150g・fillets 150g |  |
| さば・mackerel・saba・caballa | 211 | 八訂 | 80g・切れ 80g |  |
| ぶり・yellowtail・amberjack | 222 | 八訂 | 80g・切れ 80g |  |
| さんま・pacific saury | 287 | 八訂 | 100g・尾 100g |  |
| いわし・sardines・sardinas・sardinha | 156 | 八訂 | 50g・尾 50g |  |
| あじ・horse mackerel・scad | 112 | 八訂 | 60g・尾 60g・枚 60g・尾分 60g |  |
| まぐろ・かつお・tuna・bonito・katsuo | 115 | 八訂 | 100g |  |
| かじき・swordfish | 139 | 八訂 | 80g・切れ 80g |  |
| さわら・spanish mackerel・tenggiri | 161 | 八訂 | 80g・切れ 80g |  |
| milkfish・bangus・hairtail | 150 | USDA | 150g |  |
| たら・だら・かれい・white fish・whitefish・fish fillets | 90 | 八訂 | 100g・切れ 80g・fillet 150g・fillets 150g |  |
| むきえび・えび・海老・shrimps・prawns・camarn | 80 | 八訂 | 20g・尾 20g・尾分 20g |  |
| いか・squid・cuttlefish・calamari | 80 | 八訂 | 200g・杯 200g |  |
| たこ・だこ・octopus・pulpo・polvo | 91 | 八訂 |  |  |
| あさり・しじみ・はまぐり・clams・mussels・cockles | 60 | 八訂 | 20g |  |
| 牡蠣・かき・ほたて・oysters・ostras・scallops | 80 | 八訂 |  |  |
| 雑穀ご飯・ご飯・ごはん・cooked white・jasmine・brown | 156 | 八訂 | 杯 150g・杯分 150g・茶碗 150g | 0.65 |
| もち米・glutinous rice・sticky rice・sweet rice | 343 | 八訂 | 合 150g | 0.85 |
| 切り餅・rice cakes・tteok・nian gao | 223 | 八訂 | 50g・個 50g |  |
| rice・arroz・basmati | 342 | 八訂 | 合 150g | 0.85 |
| toasted rice powder・khao khua・rice flour | 366 | USDA |  | 0.55 |
| rice paper・wrappers・bánh tráng | 330 | USDA | 9g・sheet 9g・sheets 9g・枚 9g |  |
| gnocchi・schupfnudeln・spätzle | 160 | USDA |  |  |
| fresh wide・thin rice noodles・sen yai | 150 | USDA |  |  |
| ビーフン・rice noodles・vermicelli・sticks | 360 | USDA |  |  |
| 春雨・glass noodles・cellophane・dangmyeon | 344 | 八訂 |  |  |
| ゆでうどん・うどん | 95 | 八訂 | 200g・玉 200g |  |
| 焼きそば麺・蒸し中華 | 162 | 八訂 | 150g・玉 150g |  |
| 中華麺 | 249 | 八訂 | 120g・玉 120g |  |
| そうめん・素麺・蕎麦・somyeon・misua・mianxian | 340 | 八訂 | 50g・束 50g・bundle 50g |  |
| instant ramen・noodles・ramen | 440 | USDA | 100g・pack 100g |  |
| taco shells | 468 | USDA | 13g |  |
| tostadas・tortilla chips・totopos | 480 | USDA | 13g |  |
| corn tortillas | 218 | USDA | 28g |  |
| tortillas・wraps・flatbread | 300 | USDA | 45g |  |
| egg noodles・canton・pancit | 370 | USDA | nest 50g |  |
| スパゲッティ・マカロニ・パスタ・pasta・spaghetti・macaroni | 370 | 八訂 | 10g・sheet 20g・sheets 20g |  |
| fresh pasta・pasta fresca | 290 | USDA |  |  |
| 餃子の皮・ワンタンの皮・wonton wrappers・dumpling wrappers・gyoza wrappers | 275 | 八訂 | 6g・枚 6g |  |
| puff pastry・pie crust・shortcrust | 500 | USDA | sheet 300g |  |
| 食パン | 248 | 八訂 | 60g・枚 60g |  |
| フランスパン・baguette・french bread・crusty bread | 289 | 八訂 | 250g・slice 20g・slices 20g・loaf 250g |  |
| buns・rolls・bolillo | 280 | USDA | 60g |  |
| パン・bread・pan・pão | 265 | USDA | 30g・slice 30g・slices 30g・loaf 400g |  |
| crackers・krupuk・kerupuk | 450 | USDA | 8g・handful 15g |  |
| croissant | 406 | USDA | 50g |  |
| capers・alcaparras・kapern | 23 | USDA |  | 0.6 |
| olives・aceitunas・azeitonas | 145 | USDA | 4g・cup 135g | 0.6 |
| cola・soda・soft drink | 42 | USDA |  | 1 |
| zakwas・sour rye starter・żur | 30 | — |  | 1 |
| boondi・sev・namkeen | 530 | — |  | 0.4 |
| galettes・crpes・pancakes | 220 | USDA | 60g |  |
| オートミール・oats・oatmeal・porridge oats | 380 | 八訂 |  | 0.4 |
| bulgur・bulghur・burghul | 350 | USDA |  | 0.8 |
| cooked hominy・hominy・maíz pozolero | 120 | USDA |  |  |
| canned・tinned・cooked | 139 | USDA | can 240g・tin 240g・cans 480g |  |
| canned・tinned・cooked | 110 | USDA | can 240g・tin 240g・cans 480g |  |
| ひよこ豆・chickpeas・garbanzos・nohut | 378 | USDA |  | 0.8 |
| 小豆・ささげ・lentils・lentejas・mercimek | 340 | 八訂 |  | 0.8 |
| ごま・胡麻・sesame seeds・sesame・perilla seeds | 605 | 八訂 |  | 0.6 |
| ピーナッツ・peanuts・groundnuts・kacang tanah | 585 | 八訂 |  | 0.6 |
| くるみ・walnuts・cashews・almonds | 600 | USDA | 1つ 4g | 0.55 |
| raisins・sultanas・currants | 290 | USDA | 8g | 0.6 |
| chestnuts・chtaignes・marrons | 167 | 八訂 | 10g |  |
| coconut・kerisik・kelapa parut | 354 | USDA |  | 0.35 |
| じゃがいも・新じゃが | 59 | 八訂 | 150g |  |
| potatoes・papas・patatas | 77 | 八訂 | 150g |  |
| potato sticks・batata palha・potato chips | 540 | USDA |  | 0.25 |
| さつまいも・sweet potatoes・kamote・camote | 126 | 八訂 | 250g |  |
| 里芋・taro・gabi・arbi | 53 | 八訂 | 50g |  |
| 長いも・山芋・やまいも・chinese yam | 64 | 八訂 | cm 20g |  |
| cassava・yuca・mandioca | 160 | USDA | 400g |  |
| cassava flour・farinha de mandioca・farofa | 360 | USDA |  | 0.6 |
| plantains・plátano・platano | 122 | USDA | 180g |  |
| かぼちゃ・pumpkin・butternut・squash | 60 | 八訂 | 1200g |  |
| 玉ねぎ・たまねぎ・onions・cebollas・cebola | 33 | 八訂 | 200g |  |
| にんにく・ニンニク・garlic・ajo・alho | 129 | 八訂 | 5g・片 5g・clove 5g・cloves 5g |  |
| 生姜・しょうが・ginger・jengibre・gengibre | 30 | 八訂 | 15g・かけ 15g・thumb 15g・piece 15g |  |
| ginger-garlic paste・garlic paste・ginger paste | 100 | USDA |  | 1 |
| fried shallots・fried garlic・bawang goreng | 550 | USDA |  | 0.4 |
| shallots・eschalot・échalote | 72 | USDA | 25g |  |
| にんじん・人参・carrots・zanahorias・cenoura | 35 | 八訂 | 150g |  |
| 大根おろし・大根・daikon・white radish・korean radish | 15 | 八訂 | 800g・本 1000g・cm 30g・cm分 30g |  |
| かぶの葉 | 20 | 八訂 |  |  |
| かぶ・turnips・navets・rüben | 25 | 八訂 | 100g |  |
| radishes・rábano・rabanete | 16 | USDA | 15g・bunch 150g・bunches 150g |  |
| beetroots・beets・beet greens | 43 | USDA | 150g |  |
| celeriac・knollensellerie・selera | 42 | USDA | 500g |  |
| parsnips・pastinaken・pasternak | 75 | USDA | 120g |  |
| ごぼう・burdock | 58 | 八訂 | 150g |  |
| れんこん・蓮根・lotus root・stems・ngó sen | 66 | 八訂 | 200g |  |
| たけのこ・bamboo shoots・rebung・măng | 22 | 八訂 | 200g |  |
| dried bamboo | 270 | USDA |  |  |
| キャベツ・cabbage・coleslaw・repollo | 21 | 八訂 | 1200g・枚 50g・leaf 50g・leaves 50g |  |
| 白菜・napa・chinese cabbage・baechu | 13 | 八訂 | 2000g・枚 80g・head 800g・heads 800g |  |
| キムチ・kimchi・김치 | 27 | 八訂 |  |  |
| 榨菜・sauerkraut・kiszona・choucroute | 20 | USDA | 40g |  |
| 梅干し・umeboshi | 33 | 八訂 | 10g・個 10g |  |
| 紅しょうが・甘酢しょうが・ガリ | 20 | 八訂 |  |  |
| 福神漬・らっきょう・たくあん | 100 | 八訂 |  |  |
| ブロッコリー・broccoli・brcoli・brokkoli | 37 | 八訂 | 250g・株 250g・head 300g |  |
| カリフラワー・cauliflower・coliflor・couve-flor | 28 | 八訂 | 600g・head 700g |  |
| brussels sprouts・rosenkohl・coles de bruselas | 43 | USDA | 15g |  |
| ほうれん草・七草・spinach・espinacas・espinafre | 22 | 八訂 | 30g・束 200g・bunch 250g・bunches 250g |  |
| 小松菜・チンゲン菜・bok choy・pak choi・pak choy | 13 | 八訂 | 100g・束 250g・株 100g・bunch 250g |  |
| 春菊・水菜・三つ葉・crown daisy・chrysanthemum greens・ssukgat | 22 | 八訂 | 100g・束 150g・bunch 100g・handful 30g |  |
| もやし・bean sprouts・soybean sprouts・sukju | 15 | 八訂 | 200g・袋 200g・handful 40g・cup 70g |  |
| レタス・サンチュ・lettuce・lechuga・alface | 13 | 八訂 | 300g・枚 25g・leaf 20g・leaves 20g |  |
| きゅうり・胡瓜・cucumbers・pepinos・gurken | 14 | 八訂 | 100g |  |
| ミニトマト・cherry tomatoes・grape tomatoes・tomates cherry | 30 | 八訂 | 12g |  |
| トマト缶・canned tomato・tinned chopped tomato・chopped tomatoes | 21 | 八訂 | 缶 400g・can 400g・tin 400g | 1.05 |
| トマト・tomatoes・tomates・tomaten | 20 | 八訂 | 150g |  |
| なす・茄子・eggplants・aubergines・berenjenas | 20 | 八訂 | 200g・本 80g |  |
| ズッキーニ・zucchini・courgettes・calabacn | 18 | 八訂 | 200g |  |
| ゴーヤ・bitter melon・gourd・ampalaya | 15 | 八訂 | 250g |  |
| winter melon・ash gourd・white pumpkin | 15 | USDA | 400g |  |
| ピーマン・ししとう・green peppers・sivri・çarliston | 20 | 八訂 | 30g・本 5g |  |
| パプリカ・bell peppers・capsicums・paprika red | 28 | 八訂 | 150g |  |
| chile・lies・s de árbol | 320 | USDA | 5g |  |
| 唐辛子・ají・aji・aji amarillo | 40 | 八訂 | 8g・本 1g |  |
| セロリ・celery・apio・aipo | 12 | 八訂 | 40g・本 100g・stalk 40g・stalks 40g |  |
| 長ねぎの青い部分 | 30 | 八訂 | 30g・本 30g |  |
| 長ねぎ・白ねぎ・leeks・puerros・alho-poró | 35 | 八訂 | 120g・本 100g・cm 3g |  |
| 万能ねぎ・小ねぎ・青ねぎ・scallions・green onions・spring onions | 30 | 八訂 | 15g・本 10g・bunch 100g・bunches 200g |  |
| アスパラ・asparagus・esprragos・aspargos | 21 | 八訂 | 20g・本 20g・bunch 250g |  |
| オクラ・okra・bhindi・quiabo | 26 | 八訂 | 10g・袋 100g・本 10g |  |
| さやいんげん・いんげん・絹さや・green beans・french beans・runner beans | 25 | 八訂 | 8g・本 7g・handful 50g |  |
| グリーンピース・green peas・peas・garden peas | 80 | 八訂 |  | 0.6 |
| コーン缶（クリーム）・creamed・-style corn | 84 | 八訂 | 缶 190g |  |
| コーン・とうもろこし・corn・sweetcorn・sweet corn | 89 | 八訂 | 175g・本 175g・ear 175g・ears 175g | 0.65 |
| しいたけ（乾燥）・干ししいたけ・きくらげ・dried shiitake・dried mushrooms・dried porcini | 200 | 八訂 | 3g・枚 3g・piece 3g・pieces 3g |  |
| しいたけ・椎茸・shiitake・shitake | 25 | 八訂 | 15g・枚 15g |  |
| しめじ・えのき・まいたけ・mushrooms・champignons・setas | 22 | 八訂 | 15g・パック 100g・袋 100g・株 100g |  |
| アボカド・avocados・aguacates・abacate | 176 | 八訂 | 150g |  |
| わかめ・ひじき・昆布・seaweed・laver・gim | 150 | 八訂 | 3g・枚 3g・sheet 3g・sheets 3g |  |
| かつお節・削り節・bonito flakes・katsuobushi | 332 | 八訂 | 2g・パック 2g |  |
| こんにゃく・しらたき・konjac・konnyaku・shirataki | 6 | 八訂 | 200g・枚 250g・袋 200g |  |
| acorn jelly・dotorimuk・mung bean jelly | 43 | USDA | block 400g |  |
| young jackfruit・jackfruit・nangka | 50 | USDA |  |  |
| hearts of palm・palmito | 28 | USDA | jar 300g |  |
| artichokes・alcachofas・carciofi | 47 | USDA | 120g |  |
| fennel・finocchio・fenchel | 31 | USDA | 250g |  |
| nopales・cactus | 16 | USDA | 60g |  |
| green papaya・papaya・lechosa | 40 | USDA | 400g |  |
| green mangoes・mangoes・mangga | 60 | USDA | 250g |  |
| squash blossoms・flor de calabaza | 15 | USDA | 5g・bunch 100g |  |
| レモン・すだち・ゆず・lemons・limes・calamansi | 30 | 八訂 | 60g・wedge 8g・wedges 8g・slice 5g |  |
| バナナ・bananas・plátano maduro・pisang | 93 | 八訂 | 100g・本 100g |  |
| りんご・apples・manzanas・maçãs | 53 | 八訂 | 250g |  |
| pears・peras・birnen | 55 | USDA | 200g |  |
| oranges・naranjas・laranjas | 42 | 八訂 | 180g |  |
| pineapples・piñas・abacaxi | 50 | USDA | 80g・ring 40g・rings 40g・can 440g |  |
| grapes・uvas・winogrona | 69 | USDA | 5g | 0.6 |
| strawberr・blueberr・raspberr | 45 | USDA | 12g | 0.6 |
| guavas・guayaba・goiaba | 68 | USDA | 100g |  |
| pomegranate・granada・nar | 83 | USDA |  | 0.6 |
| star fruit・carambola・kamias | 31 | USDA | 50g |  |
| figs・higos・figos | 74 | USDA | 50g |  |
| melon・watermelon・sandía | 35 | USDA | 1000g |  |
| keluak・kluwek・pangium | 270 | — | 15g |  |
| 大葉・しそ・紫蘇・perilla・kkaennip・shiso | 40 | 八訂 | 1g・bunch 30g・bunches 60g・small bunch 20g |  |