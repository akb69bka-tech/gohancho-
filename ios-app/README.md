# ごはん帖 iPhone アプリ化と販売の手順

`../gohancho/`（Web 版）をそのまま iPhone アプリに包むための設定です。仕組みは **Capacitor**（Web で作ったアプリを iOS アプリにする無料の道具）を使います。
作業はすべて **MacBook** で行います（iPhone アプリは Mac の Xcode でしか作れません）。

> **申請までの手順は [申請チェックリスト.md](申請チェックリスト.md) にまとめました。** App Store に入力する文章は `appstore/metadata.md`、スクリーンショットは `appstore/screenshots/`、アイコンは `assets/` にあります。Mac では `npm run setup` で準備が一度に終わります。

---

## 全体の流れ

| 段階 | やること | 費用の目安 |
| --- | --- | --- |
| 1. 無料公開（今ここ） | Web 版を GitHub Pages で公開し、家族や知人に使ってもらう | 0円 |
| 2. iPhone で試す | この手順で Xcode から自分の iPhone に入れる | 0円（Apple ID だけで可） |
| 3. App Store に無料で出す | Apple Developer Program に登録して審査に出す | 年 99 米ドル（※） |
| 4. 課金を始める | App 内課金（サブスクリプション）を設定し、`revenueCatApiKey` を入れる（iPhone アプリ版だけ課金が有効になる） | 売上から Apple の手数料（※） |

※ Apple Developer Program は年 99 米ドル（日本の App Store では 12,800円と表示。時期で変わるので登録画面で確認）。
日本の App Store の手数料（2025年12月の「スマホ新法」対応後）は、手数料（コミッション）＋決済手数料5%:
通常 21%＋5%＝26%、Small Business Program 参加者と「1年を超えて続いているサブスクリプション」は 10%＋5%＝15%。詳しくは `申請前の確認と収支試算.md`。
出典: Apple Developer Program（https://developer.apple.com/jp/programs/）、日本における App の配信（https://developer.apple.com/support/app-distribution-in-japan/）、App Store Small Business Program（https://developer.apple.com/jp/app-store/small-business-program/）

---

## 2. 自分の iPhone で試す

準備（1回だけ）:
1. App Store から **Xcode** を入れる（大きいので時間がかかります）
2. **Node.js**（LTS 版）を https://nodejs.org/ から入れる

ターミナルで:

```bash
cd ~/Documents/toresabi/ios-app
npm run setup   # 部品の取りこみ・iOS プロジェクト作成・アイコン・審査用の設定まで自動
```

Xcode が開いたら:
1. 左の「App」→「Signing & Capabilities」→ Team で自分の Apple ID を選ぶ
2. `Info.plist` に次の2つを追加（ないと写真登録で止まり、審査にも落ちます）
   - `NSCameraUsageDescription` = 作った料理の写真を撮るために使います
   - `NSPhotoLibraryUsageDescription` = 作った料理の写真を選ぶために使います
3. iPhone をケーブルでつなぎ、上部で iPhone を選んで ▶ を押す

Web 版（`gohancho/index.html`）を直したら、`npm run sync` でアプリにも反映されます。

**`capacitor.config.json` の `appId`（今は `com.example.gohancho`）は、App Store に出す前に自分だけの名前（例: `jp.<あなたのドメイン>.gohancho`）に変えてください。** 一度出すと変えられません。

---

## 3. App Store に無料で出す

1. Apple Developer Program に登録（個人で可）
2. App Store Connect で新規アプリを作成（名前・説明文・スクリーンショット・年齢区分）
3. **プライバシーポリシーの URL** を登録（`gohancho/privacy.html` の【】を記入して公開したもの）
4. 「App のプライバシー」で「データを収集しない」を選ぶ（このアプリは記録を端末の外に送りません。課金を入れたら購入情報の項目を見直す）
5. Xcode の「Product → Archive」でアップロードし、審査に出す

### 審査で気をつけること
- **ガイドライン 4.2（最低限の機能）**: Web サイトを包んだだけのアプリは却下されることがあります。このアプリは電波なしで動き、カメラも使うので当てはまりにくいはずですが、通知（「今日の献立を決める時間です」）などのアプリならではの機能を足すとより安心です。
- **ガイドライン 3.1.1（App 内課金）**: iPhone アプリの中でデジタルの機能を売るときは、Apple の App 内課金を使う必要があります。アプリの中で Web の決済ページへ誘導してはいけません（`webCheckoutUrl` は Web 版だけで表示されます）。

出典: App Store Review Guidelines（https://developer.apple.com/jp/app-store/review/guidelines/）

---

## 4. 課金を始める（ごはん帖プラス）

アプリ側の準備はできています（`gohancho/index.html` の `const PLAN`）。

| 項目 | 今の値 | 販売時 |
| --- | --- | --- |
| `billingMode` | `'native'`（Web 版は全機能無料。iPhone アプリ版は API キーを入れると課金が有効） | そのまま |
| `prices` / `loyalty` | 月額 380円。年額 3,500円は1年つづいた会員にだけ表示（iPhone アプリ版では App Store の実際の価格を自動で表示） | App Store Connect の価格に合わせる |
| `trialMode` | `'store'`（App Store のお試しオファー「1か月無料」に合わせる。2か月目から月額） | そのまま |
| `freeLimits` | 献立プランは今日の1日分（`PLAN_WEEK_FREE`）・買い足し提案1件・品数4まで・ひとひねり1日3回・写真12枚 | 無料版の範囲 |
| （コード内） | ひと手間の「やってみた」記録はプラスのみ | |
| `earlySupporterBefore` | 空 | 例: `'2027-04-01'` にすると、その日より前から使っている人はずっと無料（初期ユーザーへのお礼） |
| `revenueCatApiKey` | 空 | RevenueCat の公開 API キー |

手順:
1. App Store Connect →「サブスクリプション」で、`gohancho_plus_yearly` と `gohancho_plus_monthly` を作る（ID は `PLAN.prices` と同じにする）
2. **RevenueCat**（https://www.revenuecat.com/）に登録し、アプリと商品をつなぐ。Entitlement 名を `plus` にする
   - RevenueCat は購入の確認（レシートの検証）を代わりにやってくれるサービスです。一定の売上までは無料で使えます（条件は公式で確認）
3. `npm install @revenuecat/purchases-capacitor` → `npx cap sync ios`
4. `PLAN.revenueCatApiKey` にキーを入れて `npm run sync`（iPhone アプリ版だけ課金が有効になる）
5. Xcode で「Signing & Capabilities」→「+ Capability」→「In-App Purchase」を追加
6. Sandbox（テスト用アカウント）で購入・復元を試してから審査に出す

### 大事な注意
- アプリの購入処理（`purchase()`）は RevenueCat の Capacitor 版の使い方に合わせて書いていますが、**実機ではまだ試していません**。手順6のテストで必ず確認してください。
- お試し期間は「アプリを開いた日の数」で数えています（端末の中の記録）。アプリを消して入れ直すと数え直しになります。
- Web 版だけで課金する場合、端末の中の印で判定しているため、知識のある人なら外せてしまいます。本格的に売るなら、iPhone アプリ版の App 内課金（RevenueCat が購入を確認）を使ってください。
- 有料で売る場合、利用規約（今は Apple 標準の規約にリンク）と、Web で販売するなら特定商取引法に基づく表記が必要です。必要に応じて専門家に確認してください。
