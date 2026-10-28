# 料理イラストの基準「斜め上35度」（イラスト部 部長 白石）

真上から見た平面の絵を、少し斜め上から見た立体のある絵に描き直す。3D にはしない。手で組む SVG のまま、器の形と明暗で奥行きを出す。
部品は `tools/illustrations/draw/kit3q.mjs`、見本は `tools/illustrations/draw/3q/_mihon.mjs`（器ごとに1品）。

## 1. 守ること

1. **視点は水平から約35度。** 水平な円は縦 `SY = 0.56` 倍の楕円にする。高さ z は画面で `CZ = 0.82` 倍だけ上に上がる。面の座標から画面へは `at(o, u, v, z)` を使う。
2. **光は左上。**
   - 器の外の側面は、左が明るく右が暗い。
   - 内壁はその逆で、左の内壁が陰、右に光が当たる。
   - 具は上の面を明るく、側面を暗くする。
   - 影は右下に落とす。
3. **器には次の5つを必ず描く。**
   - 楕円の口
   - 口の厚み（上面）
   - 側面（高さ）
   - 高台（平らな底の器はなし）
   - 接地の影（`ground`）
4. **中身の高さを分ける。**
   - 汁・煮汁は口より下の面にする（`surface`）。手前は器の口に隠れる。
   - 具は中心ほど高く盛る。手前の口より上だけを見せるには `V.above` で切る。
5. **奥から手前へ描く。** `byDepth([[y, () => svg], ...])` で並べ替えてから描く。
6. **色は今の絵のまま。**
   - 黒は使わない。いちばん暗い色も焦げ茶（`SHADE = #3a2212`）にする。
   - 漆の内側は焦げ茶、鉄・石の鍋は灰か焦げ茶の石にする。
7. **材料どおりに描く。** `index.html` の R(...) 行（各国料理は packs/*.js）の ings と seas にないものは描かない。
   - 「?」の付いた材料（お好みで）は描いてもよい。
   - 飾りの葉、ミニトマト、レモンなども、材料になければ描かない。
8. **外の素材・フォントは使わない。** SVG を手で組む。

## 2. 縁の藍（今の絵とそろえる）

| 器 | 藍 | 部品 |
|---|---|---|
| 白い器（平皿・茶碗・どんぶり・白い鉢・楕円皿・長皿） | 口の内側に藍の線（2.2）。茶碗は胴に帯2本、どんぶりは口に藍の点と胴に帯1本 | `plate` `chawan` `donburi` `shiroBowl` `ovalPlate` `slabPlate` |
| 漆の椀・鋼の鍋・土鍋・石鍋 | 口に細い藍の線1本（1.2） | `wan` `pan` `donabe`（`stone: true` で石鍋） |
| 肉じゃがなどの茶の深鉢・青磁の小鉢 | 線なし（今の絵が線なしのため） | `hachi` `kobachi` |

器の色を変えるときは、`hachi(p, { outer, lip, inner })` のように上書きする。藍の有無は表のとおりにする。

## 3. 大きさと置き場所

- **器の幅は 200 の約92%**（口の半径 rx = 92、幅 184）。鍋は持ち手を含めて 96% まで、ご飯の茶碗は 86 とする。
- 楕円の中心は器ごとに決めてあり、部品の初期値のまま使う。縦の空きが上下でそろうように下げてある。

| 部品 | 口の中心 cy | 深さ h |
|---|---|---|
| `hachi`（深鉢） | 76 | 58 |
| `wan`（汁椀） | 72 | 64 |
| `chawan`（茶碗） | 96 | 52 |
| `donburi`（どんぶり） | 80 | 62 |
| `kobachi`（小鉢） | 84 | 44 |
| `plate`（平皿） | 106 | 12 |
| `donabe`（土鍋） | 80 | 54 |
| `pan`（鍋） | 100 | 13 |

- **測った結果**（`render3q.mjs` が出す表。96px での値）。

| 器 | 幅 | 縦 | 塗り | いまの絵 |
|---|---|---|---|---|
| 鉢・椀・どんぶり | 88px | 72〜75px | 50% 前後 | 88×88px・67% |
| 平皿 | 88px | 52px | 38% | — |

  幅は今の絵と同じなので、48px・96px の一覧では同じくらいの大きさに見える。縦が短いのは斜め上からの宿命である。平皿の料理は具を高く盛り（キャベツの山・重ねた肉）、縦の広がりをかせぐ。
- 湯気は器の上の空きに描いてよい。上に 30px 以上は伸ばさない。

## 4. 部品（kit3q.mjs）

- **器**: `vessel`（共通形）、`hachi` `wan` `chawan` `donburi` `kobachi` `shiroBowl` `plate` `ovalPlate` `slabPlate` `pan` `donabe`
  - 鉢・椀などは `{ s, cx, cy, irx, iry, inside, above, shine() }` を返す。`inside` は口の形で切る。`above` は手前の口より上だけを見せる。`shine()` は口の左上の光。
  - 皿は `{ s, o }` を返す（o は見込みの面の中心）。
- **汁の面**（江口の描き方）: `surface(p, V, { drop, c, glow })`。中心が明るく縁が濃い面に、縁の陰と左上の照りをつける。`depthVeil` は奥を淡く、手前を濃くする。
- **角切り・豆・葉**（花森の描き方）
  - `prism`: 面の多角形を立ち上げ、手前の側面だけ描く。
  - `cube`: さいの目。汁に浮かせるときは `sink`。
  - `rangiri`: 乱切り。
  - `pea` `bean`: 豆。
  - `leaf`: 波打つ葉を面につぶしたもの。
  - `greensMound`: 葉物の山。
- **その他**
  - `lump`: 丸い具。
  - `slab`: 薄切り肉・切り身のような、厚みのある平たい具。
  - `shredMound`: 千切りの山。
  - `riceDome`: ご飯の山。輪郭は淡い影の線で締める。
  - `grainsPlane`: 平らな粒の面。
  - `negi` `steam` `shine` `cast` `dropOf` `blob` `byDepth` `at`
- 部品が足りないときは、まず自分の盛りつけファイルの中に作る。2人以上が使うものだけを部長に言って kit3q.mjs に入れる。kit3q.mjs を直接書きかえない（3人で同じブランチを使うため）。

## 5. 作業の決まり（日本の料理 223品）

- **ブランチと作業場所**: `claude/illust3q`（作業場所 `/home/user/gh-illust3q`）。
- **書くファイル**: 各自 `tools/illustrations/draw/3q/<名前>.mjs`（shiraishi / hanamori / eguchi）だけを書く。形は dishes/*.mjs と同じ `export default { id: p => svg本文 }`。読み込みは `import * as Q from '../kit3q.mjs'`。
- **確かめ方**: `node tools/illustrations/draw/render3q.mjs tools/illustrations/draw/3q/<名前>.mjs <出力フォルダ> [id ...]`。いまの絵と並べた 192 / 96 / 48px（暗い背景も）と、大きさの表が出る。小さい表示は 96px と 48px で判定する。
- **本体への書き出し**: 本体（`gohancho/img/dish/` と manifest・小さい絵）への書き出しは部長がまとめて行う。各自は本体に触れない。
- 担当（統括の決定と部長の割り振り）:
  - **江口**: 汁もの37品（洋・中・韓を含む）、主菜の煮22品、副菜の煮14品
  - **花森**: 和え物、揚げ物、副菜の炒め・焼き、主菜の炒め物
  - **白石**: 主菜の焼き物、ごはん全部（煮・炒・炊・和え・焼・揚）、麺全部
  - 迷う品は部長が決める。品名の一覧は下の表。

### 白石（77品）

- **主菜・焼**（27）: 豚の生姜焼き（`shogayaki`）、照り焼きチキン（`teriyaki`）、ハンバーグ（`hamburg`）、焼き餃子（`gyoza`）、鮭のムニエル（`meuniere`）、ぶりの照り焼き（`buriteri`）、鮭のちゃんちゃん焼き（`chanchan`）、マカロニグラタン（`gratin`）、鶏むね肉のねぎ塩焼き（`negishio`）、お好み焼き（`okonomi`）、さばの塩焼き（`sabashio`）、さんまの塩焼き（`sanma`）、鮭のホイル焼き（`hoilyaki`）、鶏むね肉のピカタ（`piccata`）、豆腐ハンバーグ（`tofuhamburg`）、ピーマンの肉詰め（`pimannikuzume`）、さわらの西京焼き（`saikyoyaki`）、かじきのバター醤油ソテー（`kajikisaute`）、かに玉（`kanitama`）、豆腐ステーキ（`tofusteak`）、豚肉のアスパラ巻き（`asparamaki`）、鶏つくね（`tsukune`）、タンドリーチキン（`tandoori`）、鮭の塩焼き（`shakeshio`）、あじの開き（干物）（`ajihimono`）、ハムエッグ（`hamuegg`）、焼肉（`yakiniku`）
- **ごはん・煮**（7）: カレーライス（`curry`）、親子丼（`oyakodon`）、牛丼（`gyudon`）、ハヤシライス（`hayashi`）、かつ丼（`katsudon`）、いなり寿司（`inarizushi`）、卵雑炊（`zosui`）
- **ごはん・炒**（7）: オムライス（`omurice`）、ガパオライス（`gapao`）、タコライス（`tacorice`）、チャーハン（`chahan`）、鶏そぼろ丼（`soborodon`）、中華丼（`chukadon`）、ドライカレー（`drycurry`）
- **ごはん・炊**（14）: きのこの炊き込みご飯（`takikomi`）、ちらし寿司（`chirashi`）、おかゆ（白がゆ）（`okayu`）、卵がゆ（`tamagogayu`）、梅がゆ（`umegayu`）、鮭がゆ（`shakegayu`）、七草がゆ（`nanakusagayu`）、中華がゆ（鶏と生姜）（`chukagayu`）、さつまいもがゆ（`satsumaimogayu`）、かぼちゃがゆ（`kabochagayu`）、小豆がゆ（`azukigayu`）、きのこがゆ（`kinokogayu`）、赤飯（`sekihan`）、五目炊き込みご飯（`gomokutakikomi`）
- **麺・炒**（8）: ナポリタン（`napolitan`）、ソース焼きそば（`yakisoba`）、カルボナーラ（`carbonara`）、きのこの和風パスタ（`kinokopasta`）、焼きうどん（`yakiudon`）、ツナとトマトのパスタ（`tunatomatopasta`）、たらこスパゲッティ（`tarakopasta`）、あんかけ焼きそば（`ankakeyakisoba`）
- **麺・煮**（6）: 肉うどん（`nikuudon`）、鮭とほうれん草のクリームパスタ（`salmoncreampasta`）、ミートソーススパゲッティ（`meatsauce`）、きつねうどん（`kitsuneudon`）、カレーうどん（`curryudon`）、醤油ラーメン（`ramen`）
- **ごはん・和え**（3）: ビビンバ（`bibimbap`）、おにぎり（鮭・梅・おかか）（`onigiri`）、卵かけご飯（`tkg`）
- **麺・和え**（3）: 冷やし中華（`hiyashichuka`）、そうめん（`somen`）、ざるそば（`zarusoba`）
- **ごはん・揚**（1）: 天丼（`tendon`）
- **ごはん・焼**（1）: 鮭茶漬け（`ochazuke`）

### 花森（73品）

- **主菜・揚**（12）: 鶏の唐揚げ（`karaage`）、チキン南蛮（`nanban`）、酢豚（`subuta`）、とんかつ（`tonkatsu`）、あじフライ（`ajifry`）、白身魚の甘酢あんかけ（`amazu_sakana`）、油淋鶏（`yurinchi`）、肉団子の甘酢あん（`nikudango`）、コロッケ（`korokke`）、あじの南蛮漬け（`ajinanbanzuke`）、えびフライ（`ebifry`）、天ぷら（`tempura`）
- **主菜・炒**（15）: 麻婆豆腐（`mapo`）、回鍋肉（`hoikoro`）、青椒肉絲（`chinjao`）、豚キムチ炒め（`butakimu`）、チャプチェ（`japchae`）、エビチリ（`ebichili`）、八宝菜（`happosai`）、ゴーヤチャンプルー（`champuru`）、厚揚げと豚肉の味噌炒め（`atsuage`）、麻婆なす（`mabonasu`）、なすと豚肉の味噌炒め（`nasumiso`）、プルコギ（`bulgogi`）、タッカルビ（`dakgalbi`）、レバニラ炒め（`rebanira`）、野菜炒め（`yasaiitame`）
- **主菜・和え**（2）: 冷しゃぶサラダ（`reishabu`）、棒棒鶏（`banbanji`）
- **副菜・和え**（26）: ほうれん草のおひたし（`ohitashi`）、ポテトサラダ（`potesala`）、たたききゅうり（`tatakikyuri`）、もやしのナムル（`namul`）、コールスロー（`coleslaw`）、冷ややっこ（`hiyayakko`）、きゅうりとわかめの酢の物（`sunomono`）、ほうれん草の胡麻和え（`gomaae`）、オクラのおかか和え（`okraokaka`）、春雨サラダ（`harusamesalad`）、マカロニサラダ（`macaronisalad`）、かぼちゃサラダ（`kabochasalad`）、白菜の浅漬け（`hakusaiasazuke`）、ブロッコリーのごまマヨ和え（`broccoligoma`）、長いもの梅和え（`nagaimoume`）、ごぼうサラダ（`gobosalad`）、たこときゅうりの酢の物（`takosunomono`）、かぶの甘酢漬け（`kabuamazu`）、白和え（`shiraae`）、キャベツの塩昆布和え（`shiokombu`）、大根サラダ（`daikonsalad`）、トマトのマリネ（`tomatomarine`）、菜の花のからし和え（`karashiae`）、ねぎ納豆（`natto`）、きゅうりの浅漬け（`kyuriasazuke`）、グリーンサラダ（和風ドレッシング）（`greensalad`）
- **副菜・炒**（10）: きんぴらごぼう（`kinpira`）、トマトと卵の炒め物（`tomatotamago`）、チンゲン菜のにんにく炒め（`chingensai`）、きのこのバター醤油炒め（`kinokobutter`）、ほうれん草とベーコンのソテー（`spinachbacon`）、ジャーマンポテト（`germanpotato`）、にんじんしりしり（`shirishiri`）、ニラ玉（`niratama`）、ピーマンとじゃこの炒め（`jakopiman`）、こんにゃくのピリ辛炒め（`konnyakuitame`）
- **副菜・焼**（4）: だし巻き卵（`dashimaki`）、なす田楽（`nasudengaku`）、ニラチヂミ（`chijimi`）、焼きなす（`yakinasu`）
- **副菜・揚**（4）: なすの揚げびたし（`nasubitashi`）、大学芋（`daigakuimo`）、ちくわの磯辺揚げ（`isobeage`）、揚げ出し豆腐（`agedashidofu`）

### 江口（73品）

- **主菜・煮**（22）: 肉じゃが（`nikujaga`）、クリームシチュー（`stew`）、さばの味噌煮（`sabamiso`）、ロールキャベツ（`rollcabbage`）、筑前煮（`chikuzen`）、ぶり大根（`buridaikon`）、いわしの梅煮（`iwashiume`）、かれいの煮付け（`kareini`）、手羽元のさっぱり煮（`tebasappari`）、豚バラ大根（`butadaikon`）、豚の角煮（`kakuni`）、牛肉とごぼうのしぐれ煮（`shigureni`）、肉豆腐（`nikudofu`）、鶏肉のトマト煮（`torinotomatoni`）、いかと里芋の煮物（`ikasatoimo`）、厚揚げのそぼろあんかけ（`atsuagesoboro`）、すき焼き（`sukiyaki`）、ビーフシチュー（`beefstew`）、おでん（`oden`）、湯豆腐（`yudofu`）、豚しゃぶ鍋（`shabushabu`）、寄せ鍋（`yosenabe`）
- **副菜・煮**（14）: ひじきの煮物（`hijiki`）、かぼちゃの煮物（`kabocha`）、小松菜と油揚げの煮びたし（`komatsuna`）、あさりの酒蒸し（`sakamushi`）、切り干し大根の煮物（`kiriboshi`）、里芋の煮っころがし（`satoimonikkorogashi`）、卯の花（`unohana`）、五目豆（`gomokumame`）、ふろふき大根（`furofuki`）、高野豆腐の含め煮（`koyadofu`）、粉ふきいも（`kofukiimo`）、にんじんのグラッセ（`glace`）、たけのこの土佐煮（`tosani`）、茶碗蒸し（`chawanmushi`）
- **汁物・汁**（37）: 豆腐とわかめの味噌汁（`misoshiru`）、豚汁（`tonjiru`）、ミネストローネ（`minestrone`）、中華風卵スープ（`tamagosoup`）、玉ねぎのコンソメスープ（`consomme`）、韓国風わかめスープ（`wakamesoup`）、スンドゥブチゲ（`sundubu`）、けんちん汁（`kenchinjiru`）、なめこと豆腐の味噌汁（`namekomiso`）、あさりの味噌汁（`asarimiso`）、コーンスープ（`cornsoup`）、クラムチャウダー（`clamchowder`）、酸辣湯（`sanratan`）、トマトと卵のスープ（`tomatoeggsoup`）、豆腐と三つ葉のすまし汁（`sumashijiru`）、鮭の粕汁（`kasujiru`）、のっぺい汁（`noppeijiru`）、さつま汁（`satsumajiru`）、かき玉汁（`kakitamajiru`）、石狩汁（`ishikarijiru`）、沢煮椀（`sawaniwan`）、船場汁（`senbajiru`）、呉汁（`gojiru`）、だんご汁（`dangojiru`）、しじみの味噌汁（`shijimimiso`）、芋煮（`imoni`）、大根と油揚げの味噌汁（`daikonmiso`）、お雑煮（関東風）（`zoni`）、かぼちゃのポタージュ（`kabochapotage`）、ポトフ（`potofu`）、ワンタンスープ（`wantansoup`）、春雨スープ（`harusamesoup`）、キムチチゲ（`kimchichige`）、トムヤムクン（`tomyumkung`）、じゃがいもと玉ねぎの味噌汁（`jagaimomiso`）、なすと油揚げの味噌汁（`nasuagemiso`）、キャベツと油揚げの味噌汁（`cabbagemiso`）
