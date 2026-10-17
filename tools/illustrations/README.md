# 料理のイラスト（ごはん帖）

## いま入っている絵: 手描きの SVG（全125品）

`draw/` で、125品すべてを1品ずつ描いています（ベクター画像なので、どの大きさでもくっきり表示されます）。

| ファイル | 内容 |
| --- | --- |
| `draw/kit.mjs` | 器（皿・鉢・椀・丼・長皿・小鉢など）と具材の部品。光は左上から、影・照り・揚げ衣の質感つき |
| `draw/dishes/*.mjs` | 料理ごとの盛りつけ（どの器に、どの具を、どこに置くか） |
| `draw/build.mjs` | 絵を `gohancho/img/dish/{id}.svg` に書き出し、`manifest.json` に登録する |

```bash
node tools/illustrations/draw/build.mjs            # 全部作り直す
node tools/illustrations/draw/build.mjs nikujaga   # 1品だけ
```

レシピを追加したら、`draw/dishes/` のどれかに同じ ID で盛りつけを書いて、上のコマンドを実行します。

下の ChatGPT の方法で画像を作ると、その料理は手描きの絵の代わりに ChatGPT の画像が表示されます（手描きの SVG ファイルは残るので、`manifest.json` からその料理を消して `build.mjs` を実行すれば戻せます）。

---

# 料理のイラストを ChatGPT で作る（任意）

ごはん帖の料理の絵（125品: レシピ123品＋白ご飯・お漬物）を、ChatGPT の画像生成（OpenAI）で作ってアプリに入れる手順です。

## しくみ

```
Mac で1回だけ実行 ──▶ ChatGPT（OpenAI）が絵を作る ──▶ gohancho/img/dish/ に保存
                                                        │
アプリ（iPhone・Web）はここにある絵を表示するだけ ◀────────┘
```

- アプリから ChatGPT へは**通信しません**。絵は前もって作り、アプリに同梱します。
  - 理由1: API キー（ChatGPT を使うための合言葉）をアプリに入れると、誰でも取り出して使えてしまい、あなたに請求が来ます。
  - 理由2: 使うたびに作ると、毎回お金と時間がかかり、電波がない台所では絵が出ません。
- 表示の優先順位: わが家で撮った写真 → **ChatGPT の絵** → Wikipedia の写真をイラスト化したもの → アプリが描く絵
- 「ひとひねり」の料理は、元の料理の絵を使います。
- 料理の詳細画面には「イラストは ChatGPT（OpenAI の画像生成）で作成したイメージです」と表示します。

やり方は2つあります。**おすすめは A（自動）** です。

| | A. 自動（OpenAI API） | B. 手作業（ChatGPT アプリ） |
| --- | --- | --- |
| 手間 | コマンド1回（20〜40分ほど放っておく） | 125回 貼りつけて保存 |
| 費用 | 約5米ドル（品質 medium の場合の目安） | ChatGPT の契約の範囲（作れる枚数に上限あり） |
| 絵のそろい方 | そろいやすい | ばらつきやすい |
| 必要なもの | OpenAI の API キー（ChatGPT Plus とは別契約） | ChatGPT アカウント |

---

## A. 自動で作る（おすすめ）

### 手順1: API キーを作る（5分）

1. https://platform.openai.com/ に ChatGPT と同じアカウントでログイン
2. 「Settings」→「Billing」で支払い方法を登録し、**10米ドル**ほどチャージする（API は ChatGPT Plus の月額とは別の、使った分だけの支払い）
3. 「API keys」→「Create new secret key」でキーを作り、表示された `sk-` で始まる文字をコピー（**この画面を閉じると二度と見られません**）
4. 画像生成モデル（gpt-image-1）を使うには、OpenAI の「組織の確認（Verify Organization）」を求められることがあります。エラーに `organization must be verified` と出たら、Settings →「General」から確認手続きをしてください（数分〜で終わります。要確認）

### 手順2: Mac のターミナルで実行（20〜40分）

```bash
cd ~/Documents/toresabi && git pull
export OPENAI_API_KEY='sk-ここに貼る'

# まず、費用の目安と指示文を確認（通信しない・無料）
node tools/illustrations/generate.mjs --dry-run

# 1品だけ試す（約0.04米ドル）
node tools/illustrations/generate.mjs --only nikujaga
open gohancho/img/dish/nikujaga.webp

# 気に入ったら全部作る
node tools/illustrations/generate.mjs
```

- 途中で止まったり失敗した料理があっても、**同じコマンドをもう一度**実行すれば、できていない料理だけを作ります。
- 気に入らない料理だけ作り直す: `node tools/illustrations/generate.mjs --only mapo,karaage --force`
- 品質を変える: `GOHAN_IMAGE_QUALITY=high node tools/illustrations/generate.mjs --only nikujaga --force`（low / medium / high。high は1枚 約0.17米ドル）
- 新しい画像モデルが出たら: `GOHAN_IMAGE_MODEL=モデル名 node tools/illustrations/generate.mjs ...`

### 手順3: 確認してアプリに入れる

```bash
open "gohancho/Macで起動.command"   # ブラウザでアプリを開いて見た目を確認
git add gohancho/img && git commit -m "料理のイラストを ChatGPT で作成" && git push
cd ios-app && npm run sync             # iPhone アプリにも反映
```

---

## B. ChatGPT アプリで手作業で作る（API キーなし）

1. 指示文の一覧を作る（作成済みの `prompts.md` があればそれを使えます）
   ```bash
   node tools/illustrations/generate.mjs --export-prompts
   open tools/illustrations/prompts.md
   ```
2. ChatGPT（アプリでも Web でも可）で新しいチャットを開き、`prompts.md` の指示文を1つずつ貼る
   - 絵がそろうように、**最初の1枚が気に入ったら、同じチャットで続けて**作るのがコツです
   - 背景が白くなったときは「背景を透明にして PNG で」と頼む
3. できた絵を保存し、**`prompts.md` に書いてあるファイル名**（例 `nikujaga.png`）に変えて、1つのフォルダ（例: ダウンロードの中の「ごはん帖」）に集める
4. まとめて取りこむ
   ```bash
   node tools/illustrations/generate.mjs --import ~/Downloads/ごはん帖
   ```
   - ファイル名が料理の ID と一致しないものは無視します
   - Mac では大きな画像（400KB 超）を自動で 640px に縮めます（アプリが重くならないように）
5. A の手順3と同じように確認して push

A と B は混ぜて使えます（例: 全部 A で作り、気に入らない数品だけ B で作り直して取りこむ）。

---

## 費用と注意

- 費用の目安（1024×1024・1枚あたり）: low 約0.011 / medium 約0.042 / high 約0.167 米ドル。125品を medium で約5米ドル。
  - 出典: OpenAI の料金ページ https://platform.openai.com/docs/pricing （料金は変わることがあるので、実行前に必ず確認してください。この数字は作成時点の目安です）
- **API キーは人に見せない・GitHub に上げない**。上のように `export` で入れればファイルに残りません。もし漏れたら、すぐに platform.openai.com の「API keys」で削除してください。
- 使いすぎ防止に、platform.openai.com の「Limits」で月の上限額（例: 20米ドル）を設定しておくと安心です。
- 作った絵の権利: OpenAI の利用規約では、生成物の権利は利用者に帰属するとされています（出典: OpenAI Terms of Use https://openai.com/policies/terms-of-use/ 。販売前に最新の規約を確認してください）。
- AI の絵は、実際の料理と違う形や具が描かれることがあります。全部の絵を一度目で見て、おかしいものは `--only <ID> --force` で作り直してください。

## ファイル

| ファイル | 内容 |
| --- | --- |
| `generate.mjs` | 絵を作る・指示文を書き出す・取りこむ道具（Node.js 18 以上。追加のインストール不要） |
| `prompts.md` | ChatGPT に貼る指示文の一覧（B で使う） |
| `../../gohancho/img/dish/` | 作った絵と、その一覧 `manifest.json`（アプリはこれを読む） |
