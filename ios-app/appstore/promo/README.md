# 公開前のデモ PR 動画（CM）

アプリの実際の画面を使った約28秒の紹介動画です。App Store の「App プレビュー」と、YouTube・SNS・プレスリリースに使えます。

## できあがりのファイル

| ファイル | サイズ | 用途 |
| --- | --- | --- |
| `cm-ja-portrait.mp4` | 886 × 1920（縦） | App Store の App プレビュー（日本語ストア）。30fps・H.264・音なし |
| `cm-en-portrait.mp4` | 886 × 1920（縦） | 同上（英語ストア） |
| `cm-ja-landscape.mp4` | 1920 × 1080（横） | YouTube・X・Instagram・プレスリリース（日本語） |
| `cm-en-landscape.mp4` | 1920 × 1080（横） | 同上（英語） |

- App プレビューは **15〜30秒・最大500MB**。縦 886 × 1920 は iPhone 6.5/6.7/6.9 インチ用の受け付けサイズです（出典: Apple「App プレビューの仕様」 https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications/ 。申請時に最新の表で確認してください）。
- App プレビューは **アプリの実際の画面だけ**を使う決まりです（ガイドライン 2.3.4）。この動画は実機の画面を端末の枠に入れ、キャッチコピーを添えた形なので、審査で「枠やコピーを外して」と言われる可能性があります（**わかりません**）。その場合は `cm.html` の `.copy` と `.phone` の枠を消して撮り直してください。YouTube・SNS 用にはそのまま使えます。
- **ナレーション（女性の声）入り**です。日本語は **VOICEVOX「春日部つむぎ」**（VOICEVOX CORE で合成。**クレジット表記「VOICEVOX:春日部つむぎ」が必須**。動画の中には入れていないので、YouTube・SNS・App Store の説明文に必ず「VOICEVOX:春日部つむぎ」と書いてください。利用規約: https://tsumugi-official.studio.site/rule ・ VOICEVOX 音声モデル利用規約 https://github.com/VOICEVOX/voicevox_vvm ）。英語は Piper の女性の声「amy」（sherpa-onnx 経由。MIT / 音声モデルは Piper のライセンスに従う）。VOICEVOX が使えない環境では Open JTalk ＋ tohoku-f01（CC BY 4.0）に自動で切りかわります。合成音声なので、人の声にしたい場合はナレーターに `voice/lines.json` の文を読んでもらい、`voice/narration-ja.wav` を差しかえてから録画し直してください。
- 音楽は入っていません。SNS 用に BGM を付ける場合は、商用利用できる音源を使ってください。

## 作り方（撮り直すとき）

1. `cm.html` が動画の設計図です。`?lang=ja` / `?lang=en` で言葉が変わり、画面の縦横で配置が変わります。文言は各要素の `data-ja` / `data-en` を直します。
2. 画面の素材は `shots/` にあります（Playwright でアプリを 390 × 844・3倍で撮ったもの）。アプリの見た目を変えたら撮り直してください（セッションの `promo-shots.js` 相当。国・献立・冷蔵庫・世界のレシピ・レシピ・購入画面）。
3. ナレーションを変えるとき: `voice/lines.json` の文を直し、`python3 voice/make-voice.py <声のモデルのフォルダ> <ffmpeg>` で（春日部つむぎを使うには、同じフォルダに `voicevox/`（`pip install voicevox_core` の wheel、`voicevox_onnxruntime` の lib、`voicevox_vvm` の vvms。入手先は `make-voice.py` の先頭）を置く） `voice/narration-ja.wav` / `narration-en.wav` を作り直す（声のモデルの入手先は `make-voice.py` の先頭に書いてあります。長すぎる文は自動で少し速く読まれ、ログに「次の場面にかかる」と出ます）
4. 録画: リポジトリのルートで `python3 -m http.server 8766` を動かしてから

   ```sh
   node ios-app/appstore/promo/record.js ios-app/appstore/promo /path/to/ffmpeg
   ```

   Playwright（`npm i -g playwright`）と ffmpeg が必要です。Mac なら `brew install ffmpeg`。4本の mp4 を作り直し、`voice/` のナレーションを自動で付けます。

## 中身（場面の順）

| 秒 | 場面 | コピー（日本語） |
| --- | --- | --- |
| 0–3 | ロゴ | 今日のお膳、できました。 |
| 3–7 | 国を選ぶ画面＋21の国旗 | 国を選ぶだけ。 |
| 7–10 | 今日の献立（お膳までスクロール） | お膳ごと、おまかせ。 |
| 10–14 | レシピ | 作り方は、シンプルに。 |
| 14–18 | 1週間の献立と買い物メモ | 1週間の献立と、買い物メモ。 |
| 18–21 | 冷蔵庫の材料から | 冷蔵庫の材料から。 |
| 21–24 | 世界のレシピ | 世界の家庭料理も。 |
| 24–28 | ロゴ・「最初の1か月 無料」・2か月目から月額380円（英語版は $2.99） | App Store で近日公開 |

日本語版は月額380円、英語版は $2.99/month（アメリカの価格案）。無料お試しは App Store のお試しオファー（1か月）です。変えるときは `cm.html` の最後の場面の `data-ja` / `data-en` を直してください。
