# 国ごとのアレルゲンの区分（表示が義務・推奨の品目）

- 調べた日: 2026-10-28（調査部門: 柊 蒼太・森本 葵）
- きっかけ: オーナーの決定（12番）「国ごとのアレルゲンの区分は、その国の決まりに合わせる」。声の掲示板 S7・escalations F-1。
- 使った資料: 無料で読める公的機関のページ・法令の本文・その公式 PDF だけ。有料のデータベース・有料の専門家は使っていない。
- 調べ方の限り: この作業の環境からは各国の公的サイトを直接開けなかった（通信の許可先に入っていない）。そのため、**公的機関のサイトだけに絞った検索で、そのページ・PDF の本文の抜粋を読んで確かめた**。下の出典の URL は、その抜粋が載っていた公的機関のページ・法令の URL。本文を人が開いて照らし合わせることを、公開の前に勧める（とくに「一部だけ」の国）。
- 推しはからない: 公的資料で確かめられなかった国・品目は「わかりません（出典不明）」と書いた。業者の解説サイト・旅行サイト・論文に書いてあるだけの品目は、確かめたことにしていない。
- アプリでの扱い: `gohancho/index.html` の `ALG_G`・`ALG_REGION`・`ALG_OFFICIAL`（表の更新日 `ALG_TABLE_DATE`）。テストは `tools/tests/allergen-regions.mjs`。

## 1. まとめの表

| 国 | 表示が義務 | 表示をすすめる（推奨） | 確かめた度合い | 主な出典 |
|---|---|---|---|---|
| 日本 | 9品目: えび・カシューナッツ・かに・くるみ・小麦・そば・卵・乳・落花生（カシューナッツは 2026-04-01 から義務。経過措置は 2028-03-31 まで） | 20品目: アーモンド・あわび・いか・いくら・オレンジ・キウイフルーツ・牛肉・ごま・さけ・さば・大豆・鶏肉・バナナ・ピスタチオ・豚肉・マカダミアナッツ・もも・やまいも・りんご・ゼラチン（ピスタチオは 2026-04 から） | 確かめた | 厚生労働省 資料 https://www.mhlw.go.jp/content/10905000/001704059.pdf ／ 消費者庁 食物アレルギー表示 https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/ （本文はこの環境から開けず。自治体の案内 https://www.pref.fukushima.lg.jp/sec/21130a/kasyuunattu-hyoji.html でも同じ内容） |
| アメリカ | 9: milk, eggs, fish, Crustacean shellfish, tree nuts, peanuts, wheat, soybeans, sesame（ごまは FASTER Act で 2023-01-01 から） | なし | 確かめた | FDA https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies ・ https://www.fda.gov/food/food-allergies/faster-act-sesame-ninth-major-food-allergen |
| イギリス | 14: celery, cereals containing gluten, crustaceans, eggs, fish, lupin, milk, molluscs, mustard, peanuts, sesame, soybeans, sulphur dioxide and sulphites（10 mg/kg を超えるもの）, tree nuts | なし | 確かめた | FSA https://www.food.gov.uk/business-guidance/allergen-guidance-for-food-businesses ・ https://www.food.gov.uk/safety-hygiene/allergen-information-and-labelling-for-consumers |
| フランス・ドイツ・イタリア・スペイン・ポーランド（EU） | 14: グルテンを含む穀物・甲殻類・卵・魚・落花生・大豆・乳・ナッツ類（木の実）・セロリ・マスタード・ごま・二酸化硫黄と亜硫酸塩（10 mg/kg または 10 mg/L を超えるもの）・ルピナス・軟体動物 | なし | 確かめた | 規則 (EU) No 1169/2011 附属書 II https://eur-lex.europa.eu/eli/reg/2011/1169/oj/eng （統合版 https://eur-lex.europa.eu/eli/reg/2011/1169/2025-04-01/eng ）・欧州委員会 https://food.ec.europa.eu/food-safety/campaign-2026/allergies_en |
| トルコ | 14（EU と同じ品目）: Gluten içeren tahıllar, Kabuklular, Yumurta, Balık, Yer fıstığı, Soya, Süt, Sert kabuklu meyveler, Kereviz, Hardal, Susam tohumu, Kükürt dioksit ve sülfitler, Acı bakla (lupin), Yumuşakçalar | なし | 確かめた | Türk Gıda Kodeksi Gıda Etiketleme ve Tüketicileri Bilgilendirme Yönetmeliği Ek-1 https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=23282&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5 ・官報 https://resmigazete.gov.tr/eskiler/2017/01/20170126M1-6.htm ・農林省 https://guvenilirgida.tarimorman.gov.tr/Haber/Detay/15362 |
| インド | 8区分: cereals containing gluten・crustacean・milk・eggs・fish・peanuts と tree nuts・soy・sulphite（10 mg/kg 以上） | なし | 確かめた | FSSAI Food Safety and Standards (Labelling and Display) Regulations 2020, 5(14) https://www.fssai.gov.in/upload/uploadfiles/files/Comp_Labelling%20Display_Version%20VIII_09_09_2025.pdf ・FAQ https://www.fssai.gov.in/upload/uploadfiles/files/FAQ_Labelling_Display_01_11_2023.pdf |
| 韓国 | 19項目（22種）: 알류(가금류만 해당)・우유・메밀・땅콩・대두・밀・고등어・게・새우・돼지고기・복숭아・토마토・아황산류（10 mg/kg 以上）・호두・닭고기・쇠고기・오징어・조개류(굴, 전복, 홍합 포함)・잣 | なし（混入の注意書きは義務） | 確かめた | 식품등의 표시·광고에 관한 법률 시행규칙 [별표 2] https://www.law.go.kr/flDownload.do?flSeq=76612343 ・食品安全ナラ https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?menu_no=3120&menu_grp=MENU_NEW01&bbs_no=bbs001&ntctxt_no=1091412 |
| 台湾 | 11項: 甲殼類・芒果・花生・牛奶、羊奶・蛋・堅果類・芝麻・含麩質之穀物・大豆・魚類・亞硫酸鹽類（二酸化硫黄 10 mg/kg 以上）（2020-07-01 から） | 建議標示: 頭足類・螺貝類・種子類（葵花籽、瓜子、松子仁など。精製した葵花籽油を除く）・奇異果 | 確かめた | 衛生福利部 https://www.mohw.gov.tw/cp-16-43376-1.html ・食品過敏原標示規定 https://www.mohw.gov.tw/dl-47359-2072160d-edf3-41e8-9b66-17a79aabe367.html ・建議標示事項 https://www.fda.gov.tw/tc/includes/GetFile.ashx?id=f636703601346081500 |
| 中国 | いまは義務なし。**2027-03-16 から8類が義務**（GB 7718-2025） | 8類（GB 7718-2011。いまは推奨）: 含有麸质的谷物及其制品・甲壳纲类动物及其制品・鱼类及其制品・蛋类及其制品・花生及其制品・大豆及其制品・乳及乳制品・坚果及其果仁类制品 | 確かめた | 国家衛生健康委員会 公告（2025年第2号） https://www.nhc.gov.cn/sps/c100088/202503/e8a432507f7d4f08a877e76a9b0578ce.shtml ・GB 7718-2011 問答 https://www.nhc.gov.cn/zwgk/zcjd/201402/544c0539b95d4d35b99ffbc105579071.shtml ・北京市市場監督管理局 https://scjgj.beijing.gov.cn/zwxx/scjgdt/202605/t20260507_4639154.html |
| メキシコ | 確かめられた分: cereales que contienen gluten・crustáceos・huevo・pescado・cacahuate・soya・leche・nueces de árboles・sulfito（10 mg/kg 以上） | なし | 一部（2010年の本文と2020年の改正・手引きの抜粋。改正後の全文の照合はまだ） | NOM-051-SCFI/SSA1-2010 4.2.2.2.3 https://dof.gob.mx/nota_detalle.php?codigo=5137518&fecha=05%2F04%2F2010 ・2020年の改正 https://dof.gob.mx/2020/SEECO/NOM_051.pdf ・手引き https://www.gob.mx/cms/uploads/attachment/file/653733/MANUAL_NOM051_v16.pdf |
| ブラジル | 確かめられた分: trigo, centeio, cevada, aveia e suas estirpes・crustáceos・ovos・peixes・amendoim・soja・leites de todas as espécies de animais mamíferos・ナッツ類（10種。そのうち pinoli（Pinus 属）は確かめた）・látex natural（料理の材料ではないのでアプリでは扱わない）。全部で18（うちナッツ類10） | なし | 一部（ナッツ類10種の1つずつの名前は pinoli 以外を確かめられなかった。亜硫酸塩は対象外と明記） | Anvisa RDC 727/2022（RDC 26/2015 を置きかえ）・Q&A https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/rotulagem-de-alergenicos.pdf/@@display-file/file ・RDC 26/2015 https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2015/rdc0026_26_06_2015.pdf ・見直しの資料 https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2025/dialogo-setorial-virtual-aborda-revisao-da-rotulagem-de-alimentos-alergenicos/Documentodebasesobrerotulagemdealergnicos.pdf |
| インドネシア | 確かめられた分: serealia mengandung gluten・telur・ikan・krustasea・moluska・kacang tanah・kedelai・susu・kacang pohon | なし | 一部（亜硫酸塩が入るかは、わかりません） | PerBPOM 31/2018（PerBPOM 20/2021 で改正）Pasal 49・50 https://peraturan.go.id/id/peraturan-bpom-no-20-tahun-2021 ・BPOM の案内 https://rumahsiripo.pom.go.id/peraturan/label/contoh-label-pangan-olahan/ketentuan |
| タイ | 確かめられた分: ธัญพืชที่มีกลูเตน・สัตว์น้ำที่มีเปลือกแข็ง（ปู กุ้ง กั้ง）・ถั่วลิสง・ถั่วเหลือง・หอย หมึก・ซัลไฟต์（10 mg/kg 以上） | なし | 一部（卵・魚・乳・ナッツ類が入るかは、本文の抜粋で確かめられなかった。告示 474号（2026）で亜硫酸塩を「注意書き」に移す話が出ているが、官報に載ったかはわからない） | 保健省告示 450号（2024-07-19 施行） https://food.fda.moph.go.th/press-release/newslaw450-detail ・FAQ https://food.fda.moph.go.th/faqs/law-label-9-20 ・告示 367号 https://food.fda.moph.go.th/media.php?id=512012217336602624&name=Compi_367.pdf ・474号の案内 https://food.fda.moph.go.th/press-release/law474-no2 |
| ベトナム | **わかりません（出典不明）** | わかりません | 確かめられなかった | 公的資料で品目の一覧を見つけられなかった（Nghị định 43/2017・111/2021 は表示の枠組みだけ。品目を並べているのは業者の解説だけ） |
| フィリピン | **わかりません（出典不明）** | わかりません | 確かめられなかった | FDA Philippines AO 2014-0030 https://www.fda.gov.ph/administrative-order-no-2014-0030-a/ はあるが、アレルゲンの品目の部分を確かめられなかった |
| エジプト | **わかりません（出典不明）** | わかりません | 確かめられなかった | NFSA の決定・規格 ES 1-2/2005 の本文を見つけられなかった（旅行サイトの「8品目」は使わない） |
| ペルー | **わかりません（出典不明）** | わかりません | 確かめられなかった | DIGESA の規則（D.S. 007-98-SA https://www.digesa.minsa.gob.pe/Codex/D.S.007_98_SA.pdf ）・NTP 209.038 は「アレルギーを起こす材料を表示する」とするが、品目の一覧を確かめられなかった |

## 2. わからなかった国・品目

- **ベトナム・フィリピン・エジプト・ペルー**: 表示が義務の品目を、公的資料で確かめられなかった。
- **タイ**: 卵・魚・乳・ナッツ類が義務に入るか（告示 450号の本文の抜粋に出てこなかった）。告示 474号の扱い。
- **インドネシア**: 亜硫酸塩が入るか。
- **メキシコ**: 2020年の改正のあとの、品目の書き方の全文。
- **ブラジル**: ナッツ類10種の1つずつの名前（pinoli 以外）。
- **インド**: 法令のヒンディー語の呼び方（英語の呼び方だけ確かめた）。

## 3. アプリでの扱い（案2: claude/alg-region）

| 国 | 設定の「アレルギー対策」の見出し |
|---|---|
| 日本 | 特定原材料（義務の9品目）＋特定原材料に準ずるもの（推奨の20品目）（いままでと同じ） |
| アメリカ | 米国の主要アレルゲン（9品目）（いままでと同じ） |
| フランス・ドイツ・イタリア・スペイン・ポーランド | EU の主要アレルゲン（14品目）（いままでと同じ） |
| イギリス・トルコ・インド・韓国 | 表示が義務のアレルゲン（その国の品目） |
| 台湾 | 表示が義務のアレルゲン（11）＋表示をすすめるアレルゲン（頭足類・螺貝類・種子類・キウイ） |
| 中国 | 表示をすすめるアレルゲン（2027-03-16から義務）（8類） |
| メキシコ・ブラジル・インドネシア・タイ | 表示が義務のアレルゲン（公的資料で確かめた分）＋主なアレルゲン（各国の表示制度の品目とは限りません）＝前に出していた並び（米国9品目・EU14品目）の残り |
| ベトナム・エジプト | 主なアレルゲン（各国の表示制度の品目とは限りません）＝前の EU14品目 |
| フィリピン・ペルー | 主なアレルゲン（各国の表示制度の品目とは限りません）＝前の米国9品目 |

- 安全側: 確かめられなかった国・品目は、前に出していた品目を引っこめず「各国の表示制度の品目とは限りません」と書いて出す（統括の判断 F-1 と同じ言い方）。原材料表示を確かめる注意は、いままでどおり全部の国に出る。
- 新しく足した品目（判定の言葉もいっしょに足した）: トマト（韓国）・マンゴー（台湾）・松の実（韓国・ブラジル。ナッツ類にも入る）・貝類（韓国の 조개류。かき・あわび・ムール貝など。いか・たこは入れない）・種子類（台湾。ひまわりの種・かぼちゃの種・松の実など）。
  - 迷うものは外す側にした: トマティーヨ・タマリロは「トマトを使う料理」として外す。お好みソース・ウスターソース・カレールウ・ハリッサ・チリソースは「袋の表示を確かめて」の印（トマトが入っていることがある）。
  - タイ語のカシューナッツ（มะม่วงหิมพานต์）は、マンゴー（มะม่วง）に読まない。
- 選択肢の名前: 画面の言語がその国の言葉のときは、法令・公的機関の呼び方で出す（例: 韓国語の画面の韓国で「알류(가금류만 해당)」「조개류(굴, 전복, 홍합 포함)」、台湾で「含麩質之穀物」「牛奶、羊奶」、ドイツで「Schalenfrüchte」）。ほかの言語の画面では、いままでの名前（翻訳）のまま。
- 保存した設定: アレルゲンの id は変えていないので、前の区分で選んだもの（韓国で選んだセロリ・ルピナスなど）は消えず、効き続ける。見出しにない品目は「ほかのアレルゲン」に押した状態で出る（開いた状態）。移し替えは要らない。
- 区分は、法令が変わってもアプリを更新するまでは変わらない（設定の「区分表の更新日」に 2026-10-28 と出す）。
