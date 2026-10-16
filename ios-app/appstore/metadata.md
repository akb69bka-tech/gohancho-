# App Store Connect に入力する内容（日本語）

各項目は App Store Connect の同じ名前の欄にそのまま貼りつけて使えます。文字数は Apple の上限以内に収めてあります（`appstore/check.py` で確認できます）。

---

## アプリ情報

| 項目 | 入力する内容 |
| --- | --- |
| 名前（30文字まで） | ごはん帖 献立と買い物メモ |
| サブタイトル（30文字まで） | おまかせ献立・冷蔵庫の材料から |
| プライマリ言語 | 日本語 |
| カテゴリ | フード/ドリンク（セカンダリ: ライフスタイル） |
| バンドル ID | io.github.akb69bka.gohancho（`capacitor.config.json` の appId と同じ） |
| SKU | gohancho-ios-001 |
| 価格 | 無料（App 内課金あり） |
| 年齢制限 | 4+（質問にはすべて「なし」と回答） |
| 著作権 | 2026 【運営者名】 |
| サポート URL | https://akb69bka-tech.github.io/toresabi/gohancho/support.html |
| マーケティング URL | https://akb69bka-tech.github.io/toresabi/gohancho/ |
| プライバシーポリシー URL | https://akb69bka-tech.github.io/toresabi/gohancho/privacy.html |

※ URL は GitHub Pages を有効にしてから使えます。【】の部分は記入してください。

---

## プロモーション用テキスト（170文字まで）

```
今日の献立、もう悩まない。主菜・副菜・汁ものをお膳ごとおまかせで提案し、作った記録から同じ料理が続かないように選びます。1週間の献立と買い物メモをLINEで家族に送れて、まとめ買いもラクに。
```

## 説明（4000文字まで）

```
「今日のごはん、何にしよう」を毎日いっしょに考える、献立のアプリです。

■ お膳ごと、おまかせで提案
主菜・副菜・汁ものを、お膳の形で並べて提案します。品数は2〜6品から選べて、「おまかせ」なら平日は3〜4品、週末は4〜6品のように曜日で変わります。気に入らない料理は「かえる」で1品ずつ入れかえられます。

■ 同じ料理が続かない
「この献立に決定」で記録すると、決めた日数のあいだは同じ料理を出さず、前の日と同じ肉・魚やジャンルも続かないように選びます。

■ 1週間の献立と買い物メモ
7日分の主菜をまとめて考え、冷蔵庫や家にいつもある食材を除いた「買い物メモ」を作ります。お店でチェックしながら使えます。

■ LINE で家族に送る
今日の献立も、1週間の予定と買い物メモも、ボタンひとつで LINE などに送れます。

■ 冷蔵庫の材料から探せる
冷蔵庫にあるものを入れると、「今ある材料で作れる」「代わりの食材で作れる」「あと1〜2品で作れる」に分けて表示します。「これを買い足すと作れる料理が増える」食材もわかります。

■ 家族に合わせて
人数に合わせて材料と調味料の分量を自動で計算します。苦手な食材を使う料理は献立に出しません。

■ いつもの定番を、ひとひねり
定番料理の味（韓国風・イタリアン風など）、かたち（丼・グラタン・春巻きなど）、主役の食材を入れかえて、新しい一品と作り方を考えます。

■ 台所の毎日を応援
料理のコツ「ひと手間」、作った記録のふりかえり、続けるほど上がる称号で、毎日のごはん作りを応援します。決まった時間に献立のお知らせも届けられます。

■ 電波がなくても使える
献立・レシピ・記録はすべて端末の中で動くので、電波の弱い場所でも使えます。記録や写真は端末の中だけに保存され、外部には送信しません。

■ 収録レシピ
肉じゃが、生姜焼き、唐揚げ、さばの味噌煮、筑前煮、とんかつ、ビビンバ、けんちん汁など、家庭の定番料理123品（2人分を基準に人数で換算）。

■ ごはん帖プラス（App 内課金）
・1週間分の献立プランと買い物メモ（無料版は今日の1日分）
・5品・6品の献立
・ひとひねり案、わが家の写真を無制限に
・ひと手間の「やってみた」記録と称号
月額300円・年額3,000円。最初の7日間は無料でお試しいただけます。無料期間中に解約すれば料金はかかりません。

【お支払いについて】
お支払いは購入の確定時に Apple ID に請求されます。サブスクリプションは、期間終了日の24時間前までに自動更新をオフにしない限り自動で更新されます。更新料金は期間終了前の24時間以内に請求されます。購入後は App Store のアカウント設定からサブスクリプションの管理と解約ができます。無料期間の未使用分は、サブスクリプションを購入した時点で失効します。

利用規約: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
プライバシーポリシー: https://akb69bka-tech.github.io/toresabi/gohancho/privacy.html

料理の絵は、色鉛筆で描いたような手描きのイラストです。一部の料理は Wikipedia / Wikimedia Commons の写真をもとに鉛筆画風に加工し、撮影者とライセンスを表示しています。アレルギーがある場合は、調味料や加工品の原材料も必ずご自身でお確かめください。
```

## キーワード（100文字まで、カンマ区切り・空白なし）

```
献立,こんだて,レシピ,夕飯,晩ごはん,作り置き,買い物リスト,まとめ買い,冷蔵庫,一汁三菜,主菜,副菜,時短,節約,家族,料理
```

## このバージョンの新機能

```
最初のバージョンです。毎日の献立づくりに、ぜひお役立てください。
```

---

## サブスクリプション（App 内課金）

**サブスクリプショングループ名**: ごはん帖プラス

| 項目 | 月額 | 年額 |
| --- | --- | --- |
| 製品 ID | gohancho_plus_monthly | gohancho_plus_yearly |
| 参照名 | ごはん帖プラス 月額 | ごはん帖プラス 年額 |
| 期間 | 1か月 | 1年 |
| 価格（日本） | 300円 | 3,000円 |
| お試しオファー | 1週間 無料（新規の利用者） | 1週間 無料（新規の利用者） |
| 表示名 | ごはん帖プラス（月額） | ごはん帖プラス（年額） |
| 説明（45文字まで） | 1週間の献立と買い物メモなどが使えます | 1週間の献立と買い物メモなどが1年使えます |

- 審査用スクリーンショット: アプリの「ごはん帖プラス」画面（設定 → プラスの内容）を撮って添付
- 製品 ID はアプリの `PLAN.prices` と同じにしてあります。変える場合は両方を変えてください
- RevenueCat の Entitlement 名は `plus`、Offering は「current」に月額・年額の2つを入れる

---

## App のプライバシー

- 開発者（あなた）は、記録・写真・設定を収集しません（端末の中だけに保存）
- **RevenueCat を使う場合**、購入の確認のために「購入履歴」と「ユーザ ID（匿名）」が RevenueCat に送られます。回答は RevenueCat の案内（https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy ）に従ってください（**要確認**）
- 料理写真の読み込みで Wikipedia に料理名が送られますが、利用者を特定する情報は送りません

---

## 審査メモ（App Review Information → Notes。審査担当者向けなので英語）

```
Gohancho is a meal-planning app for Japanese home cooking. All app files (HTML/JS/CSS, 123 original recipes, and illustrations) are bundled in the app; it does not load a remote website and works fully offline.

Main features:
- Generates a daily menu (main dish, side dishes, soup; 2-6 dishes) and a 7-day plan that avoids repeating recent dishes, meats and cuisines based on the user's cooking history.
- Builds a shopping list from the plan, excluding ingredients the user already has.
- Shares the menu and shopping list via the iOS share sheet / LINE.
- Ingredient-based search ("what can I cook with what's in my fridge"), servings scaling and disliked-ingredient filtering.
- Optional daily local notification reminder (Settings > 毎日のお知らせ).
- Users can photograph their own dishes (stored on device only).

No account or login is required. Dish images are colored-pencil style illustrations drawn in code; some are pencil-sketch renderings of Wikimedia Commons photos, shown with author and license attribution and a note that they were modified.

In-app purchase: "ごはん帖プラス" auto-renewable subscription (monthly / yearly) with a 1-week free introductory offer. To view the paywall: tap the gear icon (top right) > "ごはん帖プラスを見る", or tap a locked day in "1週間の主菜". "購入を復元" (Restore Purchases) is on the same screen.
```

---

## スクリーンショット

`appstore/screenshots/` に用意してあります。

| ファイル | サイズ | 使う欄 |
| --- | --- | --- |
| `6.9inch-01.png`〜`06.png` | 1320 × 2868 | iPhone 6.9 インチ ディスプレイ |
| `6.5inch-01.png`〜`06.png` | 1284 × 2778 | iPhone 6.5 インチ ディスプレイ（求められた場合） |

画面はアプリの実際の表示です。文字の書体は撮影環境の都合で端末と少し異なります。気になる場合は、Xcode のシミュレーター（iPhone 16 Pro Max）で撮り直してください。
