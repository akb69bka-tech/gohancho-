# イラスト部の計画（第1回の取りまとめと第2回の進め方）

リーダー: 白石 凪（第1回 競作の結果による。docs/team.md『第1回 競作の結果』）
作成日: 2026-10-28。本体 claude/avoid-swap への取りこみは、オーナーに絵を見てもらってから。

## 1. 第1回の取りまとめ（ブランチ claude/w10）

採用された10品を、本体にそのまま入れられる形で1つのブランチにまとめた。

| 料理 | 採用案 | 盛りつけのファイル |
| --- | --- | --- |
| subuta, kr_yangpajangajji, us_beefbroccoli, in_fishcurry, fr_bourguignon | 白石 | 元のファイル（d_main_chuka / x_kr / w_us / w_in / x_fr）の中で書きかえ |
| sanratan, eg_ful, tr_balik | 江口 | `dishes/zz_hinata_r1.mjs`（採用3品と、その3品が使う部品だけを残した） |
| mx_sopa_habas, cn_lianou_paigu | 花森 | `dishes/yuzu_r1.mjs`（採用2品だけを残した）と kit.mjs の `yz*` 部品 |
| th_yamplakrapong, it_spinaci | 現行 | 現行の盛りつけのまま（変更なし） |

- ID の重複: 採用されなかった版は消し、1つの ID につき盛りつけが1つになるようにした（build.mjs は重複があると止まる）。
- 器の縁: 10品とも藍（#2c4c7c）にそろえた。赤（酸辣湯・ビーフブロッコリー）、青緑（バルク）、薄い青（フール）、青磁（玉ねぎ漬け）、赤いホーロー（ブルギニヨン）を藍に変えた。土鍋・素焼き（カレー・ソパ・排骨湯）は器の色を残し、縁に藍の線を1本入れた。
- 材料: 審査の指摘を受けて、材料にない具を外した。ビーフブロッコリーのごま、ブルギニヨンの小玉ねぎ（材料は薄切りの玉ねぎ）とパセリ。
- 台帳: `build.mjs` と `thumbs.mjs` で SVG・一覧用の小さい絵（t/*.webp）・manifest.json を更新した。変わったのはこの10品だけ（全1,791品を作り直して確認）。
- kit.mjs に足した部品:
  - `Pic.edge()`: 主役の具の外形に細い暗色の縁をつけ、192px でも形が潰れないようにする。
  - 花森案の `yz*` 部品: 葉・豆・角切りなど。第2回でも使える。

## 2. 画風の基準見本

### 基準見本12品（新しく描く絵・描き直す絵は、必ずこの12品と並べて見る）

| 区分 | 料理 ID |
| --- | --- |
| 第1回で採用（藍の縁にそろえ済み） | subuta, us_beefbroccoli, kr_yangpajangajji, sanratan, tr_balik |
| 現行で判別しやすく、藍の縁のもの | oyakodon, cn_gongbao_jiding, gb_gammon, th_plaraadprik, pe_ceviche, vn_bapcailuoc, eg_sayadeya |

### 基準（守ること）

1. 構図: 200×200、器の中心 (100,100)、真上から。器は画面の 8〜96% に収める。
2. 光と影: 光は左上から。具は「明るい面 → 地の色 → 暗い面（右下）」で塗り、白い照りをつける。影は kit の `p.sh()`（焦げ茶・不透明度 .36）を使い、黒は使わない。
3. 器の縁は藍 #2c4c7c。
   - 白い皿・鉢: 藍の線（kit の `plate` は初期値で藍）。
   - 土鍋・素焼き・ホーロー・金属: 器の色はそのままにし、縁に藍の線を1本入れる。
   - 赤・緑・青緑・灰の飾り線は使わない。
4. 材料どおり: 描く具は、レシピの材料（index.html の `R(...)` 行、または packs/*.js の `ings`）と調味料（`seas`）に書かれたものだけ。飾りのねぎ・ごま・パセリも、書かれていなければ描かない。tip（ひとひねり）の具は描かない。
5. 192px で読める:
   - 主役の具は 1つ 30px 以上（200 基準）。数は少なめにし、具どうしの間に余白を残す。
   - 隣り合う具は色相か明るさで分ける。
   - 暗い汁に暗い具、淡い汁に淡い具を重ねない。必要なら `p.edge()` で縁をつける。
6. 文化・宗教: 国の料理として自然な器と盛り方にする。
   - tr / eg / id のレシピには、豚と酒を描かない（レシピにも無い）。
   - 豚・牛・内臓を描く絵は、肉の種類が誤解されない描き方にする。
7. 禁止: 黒の太い輪郭、写真風の質感、文字・ロゴ、`<image>` の埋め込み、他人の写真や作品を参考にして描くこと。
8. 仕上げの確認:
   - `build.mjs <id>` → `thumbs.mjs` を実行する。
   - 512px と 192px の両方で、基準見本と並べて見る。
   - 変えた ID 以外の SVG が変わっていないことを `git status` で確かめる。

### 縁が基準から外れている現行の絵（第2回とは別に直す）

第1回の現行採用2品（th_yamplakrapong は緑、it_spinaci は青緑）と、見本候補のうち hayashi・th_kaprao・in_hakkanoodles・st_ricebeans が藍以外の縁になっている。これは見た範囲の話で、全体の数は数えていない。縁の色だけを機械的に洗い出す作業は、リーダー（白石）が別に行う。

## 3. 第2回の進め方（優先50品）

対象は scratchpad/meeting/illustration.md の 3-2 の優先50品。

### 分担

それぞれの持ち味で「主担当」を決め、1品につき2名が案を出す。主担当1名と副担当1名で、第1回より1人あたりの量を抑える。

| 組 | 主担当 / 副担当 | 品数 | 料理 ID |
| --- | --- | --- | --- |
| A 葉物・せん切り・切り身の誤読 | 花森（食材の描き分け） / 白石 | 17 | id_tumisjamur, id_karedok, fr_saumon, pl_cukinia, pl_seler, fr_celeri, it_carote, it_spinaci, it_cicoria, tr_ispanak, tr_karalahana, us_collards, kr_godeungeo, br_vinagrete, es_canelones, eg_molokhia, es_ajoblanco |
| B ピューレ・マッシュ・粥 | 白石（シルエットと色で区別） / 江口 | 16 | it_pure, pe_pure_papa, br_pure_batata, it_patateporri, de_kartoffelpueree, es_pure, es_purever, fr_puree, pl_puree, us_mashed, eg_pure, br_pirao, okayu, kabochapotage, tr_yayla, in_gujaratidal |
| C クリームスープ・ポタージュ | 江口（とろみ・照り・器） / 花森 | 17 | gb_leekpotato, es_crema, fr_poireaux, tr_un, fr_choufleur, br_creme_mandioquinha, tr_patatescorba, fr_crecy, gb_parsnip, de_champignonsuppe, de_spargelcreme, tr_kabak, mx_crema_calabacita, es_cremapuerros, it_passatoverdure, pl_pomidorowa, gb_lentil |

- 1人あたり: 主担当16〜17品と副担当16〜17品で、約33品。
- illustration.md の (c)「自動指標だけで選んだ、まだ目で見ていない15品」の扱い:
  - 描く前に主担当が 3-1 の採点表で点をつける。
  - 3点以下なら描き直しの対象から外し、同じ指標の次の候補と入れかえる（入れかえは表に記録する）。
- ピューレ・スープは「色の円」になりやすい。国ごとの器、焼き目、具、油のたらし方で区別をつける。材料にない具は足さない。

### 作業の決まり

- 各自、自分のブランチで描く。盛りつけは `dishes/<名前>_r2.mjs` にまとめて書き、元のファイルの同じ ID は採用が決まるまで消さない。
- 試しの build は `--no-manifest` で行う。
- 提出物:
  - 置き場所: scratchpad/meeting/illust_r2/<名前>/
  - `<id>.svg`、`<id>.png`（512px）、`<id>_s.png`（192px）
  - `notes.md`（1品1〜2行で「何を直したか」と「材料の照合」）
- 提出前に、2章の「基準（守ること）」の1〜8を自分で確かめる。
- 他の人の案は、審査が終わるまで見ない。

### 審査（第1回と同じ）

- 作者名を伏せて並べる。その品の2案に現行の絵を混ぜた3枚を、3名の別の審査役が項目別に採点する。
- 採点の観点:
  - 何の料理か分かるか（192px と 64px）
  - 食材の描き分け
  - 画風の統一（真上・左上の光・藍の縁）
  - おいしそうか
  - 文化的・宗教的に不適切でないか
- 1品ごとに最高点の絵を採用する。現行が最高点なら現行のまま。

### 審査のあと

- 採用された絵は、リーダーが claude/w10 と同じ手順でまとめる。
  - 採用されなかった版を消して、ID の重複をなくす。
  - 縁の藍と材料を最終確認する。
  - build → thumbs → manifest を更新する。
- オーナーに見てもらってから本体に入れる。
- 進め方は3組を同時に進め、組ごとに審査する。期限は統括（桐生）がオーナーと決める。
