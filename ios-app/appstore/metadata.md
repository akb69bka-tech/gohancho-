# App Store Connect に入力する内容（日本語）

各項目は App Store Connect の同じ名前の欄にそのまま貼りつけて使えます。文字数は Apple の上限以内に収めてあります（`appstore/check.py` で確認できます）。

---

## アプリ情報

| 項目 | 入力する内容 |
| --- | --- |
| 名前（30文字まで） | わが家のご飯帖 献立と買い物リスト |
| サブタイトル（30文字まで） | 主菜・副菜・汁もの、毎日おまかせで決まる |
| プライマリ言語 | 日本語 |
| カテゴリ | フード/ドリンク（セカンダリ: ライフスタイル） |
| バンドル ID | io.github.akb69bka.gohancho（`capacitor.config.json` の appId と同じ） |
| SKU | gohancho-ios-001 |
| 価格 | 無料（App 内課金あり） |
| 年齢制限 | 4+（質問にはすべて「なし」と回答） |
| 著作権 | 2026 【運営者名】 |
| サポート URL | https://akb69bka-tech.github.io/gohancho-/support.html |
| マーケティング URL | https://akb69bka-tech.github.io/gohancho-/ |
| プライバシーポリシー URL | https://akb69bka-tech.github.io/gohancho-/privacy.html |

※ URL は GitHub Pages を有効にしてから使えます。【】の部分は記入してください。

---

## プロモーション用テキスト（170文字まで）

```
今夜の献立、もう迷いません。主菜・副菜・汁ものをお膳ごと提案し、作った記録から同じ料理が続かないように選びます。苦手な食材は置き換え、冷蔵庫の残りものからも探せて、1週間の献立と売り場ごとの買い物リストも自動で。最初の1か月は無料、その後は月額300円（自動更新・いつでも解約可）。
```

## 説明（4000文字まで）

```
毎日の「今日のごはん、何にしよう」を、ボタンひとつで終わらせる献立アプリです。主菜・副菜・汁ものをお膳ごと提案し、1週間の予定と買い物リストまでまとめて作ります。

■ お膳ごと、おまかせで決まる
主菜・副菜・汁ものを、お膳の形で並べて提案します。品数は2〜6品から選べて、「おまかせ」なら平日は3〜4品、週末は4〜6品と曜日に合わせて変わります。気に入らない料理は「かえる」で1品ずつ入れかえられます。

■ 同じ料理が続かない
作った献立を記録すると、決めた日数のあいだは同じ料理を出さず、前の日と同じ肉・魚やジャンルも続かないように選びます。

■ 1週間の献立と、売り場ごとの買い物リスト
7日分の主菜をまとめて決め、冷蔵庫や家にいつもある食材を除いた買い物リストを、野菜・肉・魚などの売り場ごとに分けて作ります。お店でチェックしながら使えます。

■ 冷蔵庫の材料から探せる
冷蔵庫にあるものを入れると、「今ある材料で作れる」「代わりの食材で作れる」「あと1〜2品で作れる」に分けて表示します。買い足すと作れる料理が増える食材もわかります。

■ 苦手な食材は、置き換えて提案
苦手な食材を登録すると、ほかの食材で作れる料理は置き換えて提案します（例: 豚肉→鶏肉）。置き換えられない料理は献立に出しません。材料と調味料の分量は、人数に合わせて自動で計算します。

■ 家族に送って、「おいしかった！」を集める
今日の献立も、1週間の予定と買い物リストも、ボタンひとつで LINE などに送れます。食卓で、おいしかった人が「おいしかった！」を押すと、いちばん多かった料理が「今月のわが家の料理自慢」になります。

■ 作りながら使えるタイマー
作り方の「8分煮る」のような時間をタップすると、そのままタイマーが始まります。

■ いつもの定番を、ひとひねり
定番料理の味（韓国風・イタリアン風など）、かたち（丼・グラタン・春巻きなど）、主役の食材を入れかえて、新しい一品と作り方を考えます。

■ 世界の家庭料理を、お膳の中で組み合わせ
肉じゃが、生姜焼き、さばの味噌煮、けんちん汁など日本の家庭料理180品以上に加えて、アメリカ・イギリス・フランス・ドイツ・イタリア・スペイン・ポーランド・トルコ・エジプト・インド・中国・台湾・韓国・タイ・ベトナム・インドネシア・フィリピン・メキシコ・ブラジル・ペルーの家庭料理を収録（21の国と地域、あわせて1,700品以上）。「国を組み合わせる」で、主菜は中華・副菜は和食・汁ものは韓国のように、1品ごとに国を選べます。

■ 台所の毎日を応援
料理のコツ「ひと手間」、作った記録のふりかえり、続けるほど上がる称号。決まった時間に献立のお知らせも届けられます。

■ 電波がなくても使える・登録不要
献立・レシピ・記録はすべて端末の中で動くので、電波の弱い場所でも使えます。アカウント登録は不要。記録や写真は端末の中だけに保存され、外部には送信しません。

■ ご利用には「ご飯帖プラス」が必要です
献立の提案をはじめとするアプリの機能は、自動更新のサブスクリプション「ご飯帖プラス」でお使いいただけます。
・プランは月額300円（税込）と年額3,000円（税込）の2つから選べます（年額は月額の12か月分 3,600円より600円お得）
・はじめての方は、どちらのプランでも最初の1か月を無料でお試しいただけます（Apple の無料お試し。対象となる方のみ。お試しはおひとり1回）
・無料期間のあとは、選んだプランの料金で自動更新されます
・無料期間が終わる24時間前までに解約すれば、料金はかかりません
・いつでも解約できます（解約すると、次の更新から止まります）

【お支払いについて】
お支払いは購入の確定時に Apple アカウントに請求されます。サブスクリプションは、期間終了日の24時間前までに自動更新をオフにしない限り自動で更新されます。更新料金は期間終了前の24時間以内に請求されます。購入後は App Store のアカウント設定からサブスクリプションの管理と解約ができます。無料期間の未使用分は、サブスクリプションを購入した時点で失効します。

利用規約: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
プライバシーポリシー: https://akb69bka-tech.github.io/gohancho-/privacy.html

料理の絵は、1品ずつ描いたオリジナルのイラストです。アレルギーがある場合は、調味料や加工品の原材料も必ずご自身でお確かめください。
```

## キーワード（100文字まで、カンマ区切り・空白なし）

```
こんだて,レシピ,夕飯,晩ごはん,夜ごはん,おかず,メニュー,1週間,作り置き,まとめ買い,冷蔵庫,残り物,食材,一汁三菜,和食,家庭料理,自炊,時短,節約,家族,共有,料理,世界,中華,韓国
```

App Store Connect がキーワードを「100バイト」で数えて入りきらない場合は、こちらの短い版を使ってください（39文字・97バイト）:

```
こんだて,レシピ,夕飯,おかず,冷蔵庫,作り置き,節約,家族,料理,時短,自炊
```

## このバージョンの新機能

```
・苦手な食材の置き換え：置き換えられる料理は、別の食材に替えて提案します（例: 豚肉→鶏肉）
・国を組み合わせる：主菜・副菜・汁ものごとに国を選べます（例: 主菜は中華、副菜は和食、汁ものは韓国）
・言語を固定：表示する言語は最初に選んだままになり、国を変えても変わりません（設定から変更できます）
・購入画面をわかりやすく：料金・無料期間・自動更新の説明を見やすくしました
・そのほか、多数の不具合を修正し、使いやすくしました
```

---

## サブスクリプション（App 内課金）

**サブスクリプショングループ名**: ご飯帖プラス

> **オーナー決定（2026-10-31）**: 月額300円・年額3,000円。年額は最初から誰でも選べる（以前の「1年つづいた会員だけ・3,500円」はやめた）。どちらも最初の1か月は無料。課金が始まるのは、App Store に出してオーナーが App Store Connect で価格を設定してから（それまで `billingMode: 'off'`）。

| 項目 | 月額 | 年額 |
| --- | --- | --- |
| 製品 ID | gohancho_plus_monthly | gohancho_plus_yearly |
| 参照名 | ご飯帖プラス 月額 | ご飯帖プラス 年額 |
| 期間 | 1か月 | 1年 |
| 価格（日本） | **300円**（クラシル プレミアム 480円より安く） | **3,000円**（月額300円×12か月＝3,600円より600円お得） |
| お試しオファー | **1か月 無料**（新規の利用者。配信するすべての国） | **1か月 無料**（同じ。お試しはグループで1人1回: Apple の決まり） |
| 表示名 | ご飯帖プラス 月額 | ご飯帖プラス 年額 |
| 説明（45文字まで） | 献立・買い物メモ・世界のレシピが使えます | 1年分をまとめて。月額の12か月分よりお得です |
| 誰に見せるか | 全員 | 全員 |

- 審査用スクリーンショット: アプリの「ご飯帖プラス」画面（設定 → プラスの内容）を撮って添付
- 製品 ID はアプリの `PLAN.prices` と同じにしてあります。変える場合は両方を変えてください
- RevenueCat の Entitlement 名は `plus`、Offering は「current」に月額（`$rc_monthly`）と年額（`$rc_annual`）の2つを入れる
- 無料期間は App Store Connect のお試しオファー（1か月無料）です。アプリは RevenueCat から実際の長さを取って「最初の1か月は無料」と表示します（`PLAN.trialMode: 'store'`）。1か月が終わると、解約していなければ選んだプランの料金（月額300円か年額3,000円）が自動で始まります
- 年額のお得の文は、アプリが App Store の実際の価格から計算します（月額×12 − 年額。お得でない国では出さない）
- 価格は国ごとに App Store Connect で設定します（`世界配信の計画と収支試算.md` の表）。アプリは登録した価格を自動で表示します

---

## App のプライバシー

- 開発者（あなた）は、記録・写真・設定を収集しません（端末の中だけに保存）
- **RevenueCat を使う場合**、購入の確認のために「購入履歴」と「ユーザ ID（匿名）」が RevenueCat に送られます。回答は RevenueCat の案内（https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy ）に従ってください（**要確認**）
- 起動時に GitHub 上の小さな設定ファイル（お知らせ・設定の切りかえ）を読みます。利用者を特定する情報は送りません
- 料理の絵はアプリに同梱しているため、通常は外部に通信しません（同梱の絵が読み込めないときだけ Wikipedia に料理名を問い合わせます。利用者を特定する情報は送りません）

---

## 審査メモ（App Review Information → Notes。審査担当者向けなので英語）

```
Gohancho is a meal-planning app for everyday home cooking. On first launch the user picks one of 21 countries/regions (Japan, US, UK, France, Germany, Italy, Spain, Poland, Turkey, Egypt, India, China, Taiwan, Korea, Thailand, Vietnam, Indonesia, Philippines, Mexico, Brazil, Peru) and the app plans meals from that country's everyday home dishes. The UI is available in 18 languages including Japanese (the first screen is in English; the language follows the chosen country and can be changed in Settings).

Content and offline use: all app files (HTML/JS/CSS, 1,700+ original recipes, translations and 1,743 original dish illustrations) are bundled in the app binary. The app does not load a remote website and works fully offline. No account or login is required; meal history, photos and settings are stored on the device only.

Main features:
- Daily menu (main dish, side dishes, soup; 2-6 dishes) and a 7-day plan that avoid repeating recently cooked dishes, meats and cuisines.
- Shopping list grouped by store section, excluding ingredients the user already has.
- Ingredient search ("what can I cook with what's in my fridge"), servings scaling, and disliked ingredients: when possible the disliked ingredient is swapped for another one (e.g. pork -> chicken); otherwise the dish is not suggested.

Native iOS features used (all optional; none is needed to use the app, and each permission is requested only at the moment the user taps the related button):
- Local notifications: daily reminder (Settings > Daily reminder) and cooking timers (tap a time such as "8 min" in a recipe's steps). The notification permission is requested only when the user turns on a reminder or starts a timer, never at launch. No push notifications, no server.
- Share sheet / messenger links: send the menu or shopping list to family. Nothing is uploaded to our servers.
- Camera / photo library: optionally add a photo of a cooked dish. Photos stay on the device.
- Microphone / speech recognition: (1) the "Speak" button on the ingredient and dish search screens, to say an ingredient or dish name; (2) "Hands-free" in a recipe's Cook tab (off by default), which reads the step aloud and listens for "next". Both are requested only when the user taps them. The app does not save recordings; on iPhone the speech is processed by Apple's speech recognition. If permission is declined, typing works the same.
- Read aloud: the device's built-in speech synthesis (AVSpeechSynthesizer via the web view). No network, no permission.
- StoreKit in-app purchase, handled through the RevenueCat SDK.

Other notes for review:
- No account, no sign-in, no tracking and no ads (App Tracking Transparency is not used). Because there is no account, there is no account to delete; "Settings > Erase all data" removes all data on the device.
- No user-generated content is shared with other users. Recipes or photos a user adds are stored only on that user's device.
- The app gives cooking suggestions only. It makes no medical, nutrition or health claims. Allergy notices say to check ingredient labels yourself.
- Tapping "Find a video" or "Search for photos" in a recipe opens a web search (YouTube / Google) in the browser for the dish name. There is no link to any outside payment page.

In-app purchase: "Gohancho Plus", two auto-renewable subscriptions in one subscription group: monthly (product ID gohancho_plus_monthly, JPY 300/month in Japan) and yearly (product ID gohancho_plus_yearly, JPY 3,000/year in Japan). Both are shown to every user, and both have a 1-month free introductory offer for eligible new subscribers (one introductory offer per subscription group). After choosing a country and the short setup, the app shows the subscription screen with the App Store price, the free-trial note (only for users eligible for the introductory offer), the auto-renewal terms, links to the Terms of Use (Apple standard EULA) and the Privacy Policy, and "Restore purchases". The app's features are available once the trial or subscription is active.

How to review the subscription: run the app on a device signed in with a Sandbox Apple Account (Settings > App Store > Sandbox Account). Choose any country (e.g. Japan or US), finish the short setup, then tap the monthly or the yearly plan on the subscription screen and confirm the Sandbox purchase. The meal plan opens right away. "Restore purchases" is on the same screen and in Settings. Sandbox renewals are accelerated (1 month = 5 minutes, 1 year = 1 hour).
```

---

## スクリーンショット

`appstore/screenshots/` に用意してあります。

| ファイル | サイズ | 使う欄 |
| --- | --- | --- |
| `6.9inch-01.png`〜`06.png` | 1320 × 2868 | iPhone 6.9 インチ ディスプレイ |
| `6.5inch-01.png`〜`06.png` | 1284 × 2778 | iPhone 6.5 インチ ディスプレイ（求められた場合） |

画面はアプリの実際の表示です。文字の書体は撮影環境の都合で端末と少し異なります。気になる場合は、Xcode のシミュレーター（iPhone 16 Pro Max）で撮り直してください。

---

## English (App Store Connect → English (U.S.) localization)

英語の欄にはこちらを貼ります。ほかの言語の欄は、まずこの英語を使い、余裕があれば `gohancho/i18n/` の訳語を参考に各国語版を作ります。

| Field | Text |
| --- | --- |
| Name (30) | Gohancho – Family Meal Planner |
| Subtitle (30) | Dinner ideas & grocery list |
| Keywords (100) | recipe,weekly,plan,shopping,fridge,ingredient,leftover,what,to,eat,cook,home,budget,menu,supper |
| Support URL | https://akb69bka-tech.github.io/gohancho-/support-en.html |
| Privacy Policy URL | https://akb69bka-tech.github.io/gohancho-/privacy-en.html |

### Promotional text (170)

```
Dinner, decided. Gohancho plans a full meal (main, sides, soup) from home cooking, avoids repeats, swaps foods you skip and builds your grocery list. First month free.
```

### Description (4000)

```
"What's for dinner tonight?" Gohancho answers it in one tap: a complete meal of main dish, sides and soup, a 7-day plan and a grocery list sorted by store section.

■ A whole meal, decided for you
Gohancho lays out a main dish, sides and soup as one meal. Pick 2 to 6 dishes, or let "Auto" choose: fewer on weekdays, more on weekends. Don't like one dish? Swap just that dish with one tap.

■ Never the same dish too soon
Log what you cooked and Gohancho remembers it: recently cooked dishes, yesterday's meat or fish and the same cuisine two days in a row are all avoided.

■ A week planned, grocery list done
Plan 7 days of mains at once. Gohancho builds a grocery list of what you don't already have in your fridge and pantry, grouped by store section and ready to tick off.

■ Cook with what you have
Type what's in your fridge and see what you can cook right now, what works with a substitute, what needs one or two more ingredients, and which ingredient would unlock the most dishes.

■ Foods you avoid, swapped
Tell Gohancho what you don't eat. Dishes that work with a substitute are suggested with it (e.g. pork → chicken); dishes that don't are left out. Quantities scale to your household.

■ Share it, then tap "Delicious!"
Send today's meal or the week's plan and grocery list in one tap with WhatsApp, LINE, Messenger and more. At the table, everyone who loved a dish taps "Delicious!", and the top dish becomes your family's dish of the month.

■ Timers inside the recipe
Tap a time in the steps, like "simmer 8 minutes", and the timer starts right there.

■ Home cooking from 21 countries, mixed your way
1,700+ everyday home-cooked recipes from Japan, US, UK, France, Germany, Italy, Spain, Poland, Turkey, Egypt, India, China, Taiwan, Korea, Thailand, Vietnam, Indonesia, Philippines, Mexico, Brazil and Peru, each with an original illustration. Choose your country for meals you know, or use "Mix countries" to pick a country for each dish: say, a Chinese main, a Japanese side and a Korean soup. Recipes are shown in your language when a translation is available, otherwise in English.

■ Works offline, stays private
Everything runs on your phone. No account needed. Your history, photos and settings never leave your device.

■ Gohancho Plus subscription required
The app's features, including meal planning, are part of Gohancho Plus, an auto-renewable subscription. Choose monthly or yearly; the yearly plan costs less than 12 months of the monthly plan.
- New subscribers can try either plan free for the first month (Apple free trial, for eligible users; one free trial per person)
- After the trial, it renews at the price of the plan you chose, as shown in the App Store for your country
- Cancel at least 24 hours before the trial ends and you won't be charged
- Cancel anytime; your plan stops at the next renewal

Payment is charged to your Apple Account when you confirm the purchase. Any unused portion of a free trial is forfeited when you purchase a subscription. Subscriptions renew automatically unless auto-renew is turned off at least 24 hours before the end of the current period. Your account is charged for renewal within 24 hours before the end of the period. You can manage or cancel your subscription in your App Store account settings after purchase.

Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://akb69bka-tech.github.io/gohancho-/privacy-en.html

If you have allergies, always check the ingredients of seasonings and processed foods yourself.
```

### What's New

```
- Swap foods you avoid: dishes that work with a substitute are now suggested with it (e.g. pork → chicken)
- Mix countries: choose a country for each part of the meal (e.g. Chinese main, Japanese side, Korean soup)
- Language stays put: the app language no longer changes when you switch countries (change it anytime in Settings)
- Clearer subscription screen: price, free trial and auto-renewal are easier to read
- Many bug fixes and usability improvements
```

### Screenshots

`appstore/screenshots-en/` に英語の画面（6.9インチ・6.5インチ）があります。

---

## 配信する国と言語

- **配信する国**: App Store Connect →「価格および配信状況」で、**中国本土を外して**ほかはすべて選ぶ（中国本土での配信には ICP 備案が必要。オーナー決定 2026-10-31: 対応21か国・地域のうち中国本土を除く20か国に出す。手順は `申請の完全ガイド.md` の 4-4）
- **アプリの対応言語（Xcode の Localizations に追加）**: 英語・日本語・フランス語・ドイツ語・イタリア語・スペイン語・ポルトガル語（ブラジル）・ポーランド語・トルコ語・アラビア語・ヒンディー語・インドネシア語・フィリピン語・タイ語・中国語（簡体）・中国語（繁体）・韓国語・ベトナム語
- **国ごとの価格**: 基準の国を日本（月額300円・年額3,000円）にして Apple の自動の価格を使う。出た金額は `世界配信の計画と収支試算.md` の表（今は「要確認」）に書き写す
