# 名前がまったく同じ別の料理（22組）と、名前を変える案

献立班が 11/17 に作った案です。まだ何も変えていません。統括に決めてもらうための資料です。

## どうして困るか

- 同じ週の献立に、同じ名前の料理が2回出ることがあります。
  - 例: フランスで、火曜の主菜が「Gratin de chou-fleur」、日曜の副菜も「Gratin de chou-fleur」。
- 買い物メモの料理名も同じになるので、どの日の料理の材料かがわかりません。
- 多くは、ベジ版・ヴィーガン版・主菜版をあとから足したときに、元の料理と同じ名前を付けたものです（ID の終わりが `_v` などのもの）。

## どの言語に出るか（いまのしくみ）

料理名がどれで出るかは、次の順で決まります。

1. 画面の言葉の訳があるときは、その訳。
   - 訳があるのは、その国の言葉と日本語だけです（`packs/i18n/<国>.<言葉>.js`）。
2. 訳がないときは、その国の言葉の名前（パックの `local`）。
   - ただし、`local` が読めない文字のときは英語の名前（パックの `name`）。
   - ラテン文字だけの名前は、どの言語の画面でも「読める」と見なします（`nameReadable`）。

このため、ぶつかり方は2通りです。

- **ラテン文字の国**（DE・ES・FR・GB・ID・IT・PE・PH・TR・VN）
  - `local` が同じだと、日本語以外の17言語すべてで同じ名前になります。
  - 日本語の画面では、日本語の訳（`<国>.ja.js`）の名前が出ます。ぶつかっているのはフランスの1組だけです。
- **ラテン文字でない国**（CN の中国語、EG のアラビア語）
  - その国の言葉の画面だけでぶつかります。
  - ほかの言語では英語の名前が出て、英語の名前はちがうので、ぶつかりません。

## 変えるところ（18言語のうち、どこまで）

変えるのは、各組のうち**あとから足した料理（変える側）の名前だけ**です。もう一方（元の料理）の名前は変えません。

1. パックの `local`（その国の言葉の名前）。
   - ラテン文字の国では、これを変えるだけで、日本語以外の17言語の表示が分かれます。
2. その国の言葉の訳ファイルの `name`。
   - 例: `fr.fr.js`、`es.es.js`、`id.id.js`、`it.it.js`、`pe.es.js`、`ph.fil.js`、`tr.tr.js`、`vi.vi.js`、`de.de.js`、`cn.zh-Hans.js`、`eg.ar.js`
3. 英語の名前（パックの `name`）。
   - 英語の名前もぶつかっている3組だけ変えます（ES espinacas、GB bubble、PH kalabasa）。
4. 日本語の訳（`<国>.ja.js`）。
   - ぶつかっているのは FR の1組だけです。ほかの21組は、日本語ではもう分かれているので変えません。
5. ほかの言語の訳ファイル。
   - 料理名の訳はないので、変えるものはありません。

合わせて、1組あたりの変更は1〜3か所です。調理の手順・材料・ID は変えません。

## 一覧と案

表の見方:
- 「変える側」が名前を変える料理です。そのほかの料理名は変えません。
- 案は「その国の言葉 ／ 英語 ／ 日本語」の順です。「（そのまま）」は変えません。
- ほとんど同じ料理の組には、名前を変える代わりに「片方を候補から外す」案も書きました（★）。外すときも、保存した献立・記録にある分は開けるようにします。

| # | 国 | 元の料理 | 変える側 | いまの名前（その国の言葉） | ぶつかる言語 | 案（その国の言葉 ／ 英語 ／ 日本語） |
|---|---|---|---|---|---|---|
| 1 | CN | cn_disanxian（副菜・炒め煮） | cn_di_san_xian（主菜・揚げ炒め） | 地三鲜 | 中国語（簡体字） | 炸地三鲜 ／（そのまま）／（そのまま） |
| 2 | DE | de_weissebohnen（汁もの） | de_weisse_bohnen_eintopf（主菜・セロリアック入り） | Weiße-Bohnen-Eintopf | 日本語以外の17言語 | Weiße-Bohnen-Eintopf mit Gemüse ／（そのまま）／（そのまま） |
| 3 | EG | eg_ful（副菜・レモン） | eg_ful_medames_v（主菜・トマトとパセリ、パン添え） | فول مدمس | アラビア語 | فول مدمس بالطماطم ／ Ful medames with tomato and parsley ／（そのまま） |
| 4 | ES | es_espinacas（副菜・パン入り） | es_espinacasgarbanzos（主菜・トマト入り） | Espinacas con garbanzos | 日本語以外の17言語（英語の名前も同じ） | Espinacas con garbanzos y tomate ／ Spinach and chickpeas with tomato ／（そのまま） |
| 5 | ES | es_menestra（主菜・生ハム入り） | es_menestraverde（主菜・アスパラとフダンソウ、ハムなし） | Menestra de verduras | 日本語以外の17言語 | Menestra de espárragos y acelgas ／（そのまま）／（そのまま） |
| 6 | ES | es_coliflor（副菜） | es_coliflorajoarriero（主菜・卵入り） | Coliflor al ajoarriero | 日本語以外の17言語 | Coliflor al ajoarriero con huevo ／（そのまま）／（そのまま） |
| 7 | FR | fr_choufleurgratin（副菜） | fr_gratinchoufleur（主菜・材料は同じで量が多い）★ | Gratin de chou-fleur | 18言語すべて（日本語も） | Gratin de chou-fleur en plat principal ／（そのまま）／ カリフラワーのグラタン（主菜） |
| 8 | GB | gb_bubble（副菜・バター） | gb_bubbleandsqueak（主菜・バターなし） | Bubble and squeak | 日本語以外の17言語（英語の名前も同じ） | Vegan bubble and squeak ／ Vegan bubble and squeak ／（そのまま） |
| 9 | ID | id_tempeorek（副菜・赤唐辛子） | id_tempe_orek（主菜・青唐辛子とエシャロット） | Tempe orek | 日本語以外の17言語 | Tempe orek cabai hijau ／（そのまま）／（そのまま） |
| 10 | ID | id_sayurlodeh（汁もの） | id_sayur_lodeh_v（主菜・豆腐とテンペ） | Sayur lodeh | 日本語以外の17言語 | Sayur lodeh tahu tempe ／（そのまま）／（そのまま） |
| 11 | ID | id_gadogado（主菜・卵入り） | id_gado_gado_vegan（主菜・卵なし） | Gado-gado | 日本語以外の17言語 | Gado-gado tanpa telur ／（そのまま）／（そのまま） |
| 12 | IT | it_pastafagioli（汁もの） | it_pasta_fagioli_v（麺・トマト入り） | Pasta e fagioli | 日本語以外の17言語 | Pasta e fagioli al pomodoro ／（そのまま）／（そのまま） |
| 13 | IT | it_pappapomodoro（汁もの） | it_pappa_pomodoro（ごはんの席・かゆ） | Pappa al pomodoro | 日本語以外の17言語 | Pappa al pomodoro densa ／（そのまま）／（そのまま） |
| 14 | IT | it_pastaceci（汁もの） | it_pasta_ceci（麺・トマト入り） | Pasta e ceci | 日本語以外の17言語 | Pasta e ceci al pomodoro ／（そのまま）／（そのまま） |
| 15 | PE | pe_sudado（主菜） | pe_sudado_pescado（主菜・材料が同じ）★ | Sudado de pescado | 日本語以外の17言語 | Sudado de pescado en caldo ／（そのまま）／（そのまま） |
| 16 | PE | pe_sopa_quinua（汁もの・グリーンピース入り） | pe_sopa_quinua_v（汁もの・グリーンピースなし）★ | Sopa de quinua | 日本語以外の17言語 | Sopa de quinua sencilla ／（そのまま）／（そのまま） |
| 17 | PH | ph_munggo（主菜） | ph_ginisang_munggo_v（主菜・野菜だけ） | Ginisang munggo | 日本語以外の17言語 | Ginisang munggo na gulay lang ／（そのまま）／（そのまま） |
| 18 | PH | ph_kalabasa（副菜） | ph_ginataang_kalabasa_v（主菜・材料が同じ）★ | Ginataang kalabasa at sitaw | 日本語以外の17言語（英語の名前も同じ） | Ginataang kalabasa at sitaw (ulam) ／ Squash and long beans in coconut milk (main) ／（そのまま） |
| 19 | PH | ph_lumpiang_gulay（副菜・さつまいも） | ph_lumpiang_gulay_v（主菜・豆腐入り） | Lumpiang gulay | 日本語以外の17言語 | Lumpiang gulay na may tokwa ／（そのまま）／（そのまま） |
| 20 | TR | tr_ezogelin（汁もの・米入り） | tr_ezogelin_v（汁もの・米なし、ミント） | Ezogelin çorbası | 日本語以外の17言語 | Naneli ezogelin çorbası ／（そのまま）／（そのまま） |
| 21 | TR | tr_imambayildi（副菜） | tr_imam_bayildi（主菜・材料が同じ）★ | İmam bayıldı | 日本語以外の17言語 | İmam bayıldı (ana yemek) ／（そのまま）／（そのまま） |
| 22 | VN | vn_dauhusaot（主菜） | vn_dauhuchiensa（主菜・材料が同じ）★ | Đậu hũ chiên sả ớt | 日本語以外の17言語 | Đậu hũ áp chảo sả ớt ／（そのまま）／（そのまま） |

## わからないこと・決めてほしいこと

- ★の6組（7・15・16・18・21・22。材料がほとんど同じ）は、名前を変えるか、片方を候補から外すか、決めてください。
  - 片方を外すと、献立の候補が減ります。
  - ハラールなどの食の決まりの日に出せる品数が減るかは、確かめていません。
- 案の言葉は献立班の訳です。その国の言葉として自然かどうかは、わかりません。とくに次の4つは、ネイティブの確認がほしいです。
  - アラビア語（#3）、フィリピン語（#17・#18）、トルコ語（#20・#21）、ベトナム語（#22）
- 名前を変えると、すでに記録・お気に入り・保存した献立にある料理も新しい名前で出ます。ID は変えないので、開けなくなることはありません。
- パックのデータを変えると、すでに入れている人の端末に新しい名前がいつ届くかは、版の上げ方しだいです。どうなるかはわかりません。
- 確かめ方: `node` で全パックと訳を読み、言語ごとに同じ名前を数えました。表の22組がすべてで、日本の料理（JP）にはありませんでした。

## 決まったこと（統括の判断 11/17）と、変えた名前

- 22組すべて、あとから足した料理の名前を変えました。片方を候補から外すことはしません（食の決まりの日に出せる品が減らないように）。
- 短く、やさしい言葉を足す形にしました。かっこは使っていません（検索では、かっこの中を外して比べるため）。手順・材料・ID は変えていません。
- テスト tools/tests/dupnames.mjs（run-all に入っています）: 18言語 × 21か国で、ちがう料理が同じ名前で出ないことを確かめます。

| # | 変える側 | 新しい名前（その国の言葉） | 英語の名前 | 日本語の名前 |
|---|---|---|---|---|
| 1 | cn_di_san_xian | 炸地三鲜 | （そのまま） | （そのまま） |
| 2 | de_weisse_bohnen_eintopf | Weiße-Bohnen-Eintopf mit Gemüse | （そのまま） | （そのまま） |
| 3 | eg_ful_medames_v | فول مدمس بالطماطم | （そのまま） | （そのまま） |
| 4 | es_espinacasgarbanzos | Espinacas con garbanzos y tomate | Spinach with chickpeas and tomato | （そのまま） |
| 5 | es_menestraverde | Menestra de verduras con espárragos | （そのまま） | （そのまま） |
| 6 | es_coliflorajoarriero | Coliflor al ajoarriero con huevo | （そのまま） | （そのまま） |
| 7 | fr_gratinchoufleur | Gratin de chou-fleur au fromage | （そのまま・Cauliflower cheese gratin） | カリフラワーのチーズグラタン |
| 8 | gb_bubbleandsqueak | Vegan bubble and squeak | Vegan bubble and squeak | （そのまま） |
| 9 | id_tempe_orek | Tempe orek cabai hijau | （そのまま） | （そのまま） |
| 10 | id_sayur_lodeh_v | Sayur lodeh tahu tempe | （そのまま） | （そのまま） |
| 11 | id_gado_gado_vegan | Gado-gado vegan | （そのまま） | （そのまま） |
| 12 | it_pasta_fagioli_v | Pasta e fagioli con pomodoro | （そのまま） | （そのまま） |
| 13 | it_pappa_pomodoro | Pappa al pomodoro densa | （そのまま） | （そのまま） |
| 14 | it_pasta_ceci | Pasta e ceci con pomodoro | （そのまま） | （そのまま） |
| 15 | pe_sudado_pescado | Sudado de pescado con caldo | （そのまま） | （そのまま） |
| 16 | pe_sopa_quinua_v | Sopa de quinua sin arvejas | （そのまま） | （そのまま） |
| 17 | ph_ginisang_munggo_v | Ginisang munggo vegan | （そのまま） | （そのまま） |
| 18 | ph_ginataang_kalabasa_v | Ginataang kalabasa at sitaw na ulam | Squash and long beans in coconut milk, main dish | （そのまま） |
| 19 | ph_lumpiang_gulay_v | Lumpiang gulay na may tokwa | （そのまま） | （そのまま） |
| 20 | tr_ezogelin_v | Pirinçsiz ezogelin çorbası | （そのまま） | （そのまま） |
| 21 | tr_imam_bayildi | Ana yemek imam bayıldı | （そのまま） | （そのまま） |
| 22 | vn_dauhuchiensa | Đậu hũ áp chảo sả ớt | （そのまま） | （そのまま） |

「〜なし」の言い方（without butter・sin jamón・tanpa telur・walang karne）は、料理名の言葉でアレルゲン・食の決まりを見分けるしくみに当たってしまう（bfast-r29 で「バター」と読まれた）ので、中身の言葉か vegan に変えました（#5・8・11・17）。

アラビア語（#3）・フィリピン語（#17〜19）・トルコ語（#20・21）・ベトナム語（#22）が自然な言い方かどうかは、わかりません。
