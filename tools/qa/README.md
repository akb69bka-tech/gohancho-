# 自動テスト

## まず: 全部を1本で実行する

```
tools/qa/run-all.sh            # 短縮モード（--quick。GitHub Actions の QA と同じ。数分）
tools/qa/run-all.sh --full     # 全部（linkage-all・layout-shift・sw-offline・dates・memo-size なども。30分以上）
tools/qa/run-all.sh --only shopping,i18n --jobs 2     # 名前に含む語で絞る / 並列度を下げる
tools/qa/run-all.sh --list     # 項目の一覧だけ
```

- 静的サーバーは空いているポートで自動で立てて、終わりに止めます（`--base URL` ですでに動いているものを使う、`--port N` で固定もできる）。ポートや自分専用のパスは決め打ちしていません。
- 項目ごとの結果（PASS / FAIL / TIMEOUT・秒数）を表で出し、失敗した項目のログ末尾を続けて出します。1つでも失敗すれば終了コード 1。ログは `/tmp/gohancho-qa.*/` に残ります。
- 重くて落ちるときは `--jobs 1` にする。待ちは「アプリの起動と描画を待つ」条件待ち（`tools/lib/pw.cjs` の `ready`）なので、並列度を上げても固定の待ち時間で落ちることはありません。
- 必要なもの: Node 20 以上・playwright（グローバルでも `node_modules` でも可。`PLAYWRIGHT_DIR` で場所を指定可）・Chromium（`CHROME` で指定可。`/opt/pw-browsers` にあれば自動で使う）・python3。
- 短縮モードに入るもの: JS 構文（`check-syntax.mjs`）・packs 検査・17言語の翻訳（0 missing / 0 mismatch）・手順の人数換算・規約文・「かえる」「設定変更」の連動なし（国と回数を減らした版）・買い物メモ・冷蔵庫に入れる・手に入りにくい食材と保存献立・1週間プラン・落ちない／バックアップ／自作レシピ／無料版とPro／.ics／早めに使う／店内メモ／冷蔵庫。`--full` はこれに加えて全国・全回数の版と、linkage-all・layout-shift・sw-offline・polish・dates・memo-size・needs-tally。

## 乱数と再現（SEED）

アプリは `Math.random` で料理を選びます。テストは `tools/lib/pw.cjs` の `seedScript` で、ページの `Math.random` を **SEED と国と回から決まる固定の列**に置き換えています。同じ SEED なら同じ状況になります。

- 既定の SEED は `20261027`（run-all の `--seed N`）。`--seed random` で毎回変えて、別の乱数でも通るかを探せる。
- 失敗の行に **国・回・SEED・直前までの操作列** が出ます（例: `再現: SEED=20261027 CC=KR rep=2 操作列=avoid-days>make-week`、`[再現: SEED=... CCS=US]`）。
  そのまま `SEED=20261027 CCS=US node tools/tests/shop-to-fridge.mjs` のように実行すると、その国だけ同じ状況で再現できる（BASE は `BASE=http://localhost:PORT/`）。
- 「時々失敗する」が本物の不具合かテストの不備かは、SEED を固定して再現し、(1) アプリの状態（`session.menu` など）が仕様に反していれば不具合、(2) テストが関係のない食材を選んでいる・待ちが足りないなら不備、で判断する。

## 各テスト

どれも Playwright (Node) で動きます。`BASE` でアプリの URL を指定できます（run-all が自動で設定）。`tools/tests/*.mjs` は第1引数でも URL を渡せます。
環境変数 `QUICK=1`（reroll-sideeffects・menu-stable の回数を減らす）、`REPS`、`CCS`（国を絞る）などがあります。

- `reroll-sideeffects.js`: 6か国・品数2〜6とおまかせで「かえる」を1,700回ほど押し、押した料理（とご飯の欄）以外が変わらないことを確かめる。`bad 0` が合格。
- `menu-stable.js`: 苦手な食材・置き換え・出さない日数・1週間分・同じ国の選び直し・国の組み合わせ・言語の変更を繰り返し、押していない料理が変わらないことを確かめる。`ok:` だけが並べば合格（`BAD` が出たら、変わった理由を確かめる）。

- `linkage-all.js`: 「ある料理を変えると、ほかの料理（とくに汁もの）が連動して変わる」不具合の総点検。全21か国×品数×全ボタン（主菜・副菜・汁もの・主食）、汁もの専用、国の組み合わせ、気分、あと1品、保存した献立、家族のアレルギー、苦手食材、決定後、1週間プラン、言語切替で、押した枠以外の料理ID・材料・お膳の各枠の表示・主食・プラン・買い物リスト・履歴・お気に入り・決定済み・保存献立・設定が一致することを確かめる。`BAD 0` が合格（`ONLY=mix,one` `CCS=JP,KR` `REPS=2` `JOBS=3` `LOG=file` で絞れる。全部で30分ほど）。
- `sw-offline.js`: Service Worker（`gohancho/sw.js`）の確認。自分で小さなサーバーを立てて、オフライン起動・オフラインで国切替（保存した国は切り替わり、保存していない国は切り替わらず画面は生きている）・ネットが3秒で返らないときは保存した画面で開き裏で新しい版を保存・版を上げた直後（古い保存の整理、前の版の国のデータの引き継ぎ、開いている画面への通知、オフラインでの起動）・壊れた保存（途中で切れた画面、途中で切れた国のレシピ、js の場所に返ってきた HTML）からの復帰を確かめる。`ALL OK` が合格。`sw.js` の `VERSION` と `index.html` の `window.ASSET_V` が同じ値かも確かめる（版を上げるときは両方）。BASE は使わない。

- `layout-shift.js`: 料理の入れ替え・画像の読み込みで、画面がガタつかないことを確かめる。「かえる」「主食」「気分」「まるごと入れ替え」「保存献立を適用」「1週間プランの別の案」「作り方タブの切り替え」「料理の詳細（絵あり・なし・遅い・失敗）」「言語切替」「世界タブ」ごとに、前後で全要素の位置・大きさ（getBoundingClientRect）を比べ、押した料理の中身以外が0.5px以上動いたら違反とする（画面の下の遠くは別に数える）。PerformanceObserver の layout-shift（CLS）も合わせて出す。「違反」0 が合格。
  - 使い方: `BASE=http://localhost:8791/ node tools/qa/layout-shift.js [--quick] [--jobs 4] [--json out.json]`（`--quick` は 4か国・390pxだけ。`--jobs` は国ごとに分けて並列に走らせる）
  - 環境変数: `CCS=JP,US` 国を絞る / `WIDTHS=320,390` 幅 / `SCALES=1,1.25` 文字の拡大 / `IMG=ok,fail,slow` 絵の状態（読めた・失敗・遅い）
  - 注意: 画面を作り直す（innerHTML）ので、PerformanceObserver の CLS は 0 になりやすい。ずれの本体は、位置・大きさの比較（「画面内の最大ずれpx」）で見る。
- `viewport.js`: iPad・横向き・分割表示・極小画面・キーボード・回転の総点検。幅（768×1024, 820×1180, 1024×1366, 844×390, 932×430, 375×667, 320×568, 320×400 ほか）×言語（ja/en/de/ar）×全タブで、横にはみ出さない・下のタブが高すぎない（横向きは高さの16%まで）、購入・共有・1品追加のシートが画面に収まる、キーボード（画面が縮む端末と visualViewport だけ縮む端末）で食費・材料・自由入力・シートの欄が見える位置に来て下のタブが隠れる、回転・分割幅の変更でタブ・入力途中の文字・献立が変わらない、safe-area（env(safe-area-inset-*)）が本文・下のタブ・シートに効いている、を確かめる。`NG 0` が合格。`BASE=http://localhost:8791/ node tools/qa/viewport.js [--quick]`（`VPS=390x844,844x390` `LANGS=ja,ar` で絞れる）
- `narrow-ui.js`: 320px・文字「もっと大きい」で、文字が切れない・折れ方がバラバラにならないことを全17言語で確かめる（まるごと入れ替えの丸ボタンの文字・お膳の枠名・条件の要約・作り方のコツ・買い物(大)・週プランの各日ボタン・入力例・fil/fr/es/pt-BRの訳）。`BASE=http://localhost:8798/ node tools/qa/narrow-ui.js [--quick]`、`NG 0` が合格。
