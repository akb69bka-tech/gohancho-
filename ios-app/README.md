# ごはん帖 iPhone アプリ化と販売の手順

`../gohancho/`（Web 版）をそのまま iPhone アプリに包むための設定です。仕組みは **Capacitor**（Web で作ったアプリを iOS アプリにする無料の道具）を使います。
作業はすべて **MacBook** で行います（iPhone アプリは Mac の Xcode でしか作れません）。

---

## 全体の流れ

| 段階 | やること | 費用の目安 |
| --- | --- | --- |
| 1. 無料公開（今ここ） | Web 版を GitHub Pages で公開し、家族や知人に使ってもらう | 0円 |
| 2. iPhone で試す | この手順で Xcode から自分の iPhone に入れる | 0円（Apple ID だけで可） |
| 3. App Store に無料で出す | Apple Developer Program に登録して審査に出す | 年 99 米ドル（※） |
| 4. 課金を始める | App 内課金（サブスクリプション）を設定し、アプリ側の `billingEnabled` を `true` にする | 売上から Apple の手数料（※） |

※ Apple Developer Program は年 99 米ドル（日本円の金額は時期で変わるので公式ページで確認）。手数料は通常 30%、年間売上 100 万米ドル以下の「App Store Small Business Program」に申し込むと 15%。
出典: Apple Developer Program（https://developer.apple.com/jp/programs/）、App Store Small Business Program（https://developer.apple.com/jp/app-store/small-business-program/）

---

## 2. 自分の iPhone で試す

準備（1回だけ）:
1. App Store から **Xcode** を入れる（大きいので時間がかかります）
2. **Node.js**（LTS 版）を https://nodejs.org/ から入れる

ターミナルで:

```bash
cd ~/Documents/toresabi/ios-app
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap add ios
npm run ios
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
| `billingEnabled` | `false`（全機能無料） | `true` |
| `prices` | 年額 2,400円・月額 300円（仮） | App Store Connect の価格に合わせる |
| `freeLimits` | 品数4まで・ひとひねり1日3回・写真12枚 | 無料版の範囲を決める |
| `earlySupporterBefore` | 空 | 例: `'2027-04-01'` にすると、その日より前から使っている人はずっと無料（初期ユーザーへのお礼） |
| `revenueCatApiKey` | 空 | RevenueCat の公開 API キー |

手順:
1. App Store Connect →「サブスクリプション」で、`gohancho_plus_yearly` と `gohancho_plus_monthly` を作る（ID は `PLAN.prices` と同じにする）
2. **RevenueCat**（https://www.revenuecat.com/）に登録し、アプリと商品をつなぐ。Entitlement 名を `plus` にする
   - RevenueCat は購入の確認（レシートの検証）を代わりにやってくれるサービスです。一定の売上までは無料で使えます（条件は公式で確認）
3. `npm install @revenuecat/purchases-capacitor` → `npx cap sync ios`
4. `PLAN.revenueCatApiKey` にキーを入れ、`billingEnabled: true` にして `npm run sync`
5. Xcode で「Signing & Capabilities」→「+ Capability」→「In-App Purchase」を追加
6. Sandbox（テスト用アカウント）で購入・復元を試してから審査に出す

### 大事な注意
- アプリの購入処理（`purchase()`）は RevenueCat の Capacitor 版の使い方に合わせて書いていますが、**実機ではまだ試していません**。手順6のテストで必ず確認してください。
- Web 版だけで課金する場合、端末の中の印で判定しているため、知識のある人なら外せてしまいます。本格的に売るなら、iPhone アプリ版の App 内課金（RevenueCat が購入を確認）を使ってください。
- 有料で売る場合、利用規約（今は Apple 標準の規約にリンク）と、Web で販売するなら特定商取引法に基づく表記が必要です。必要に応じて専門家に確認してください。
