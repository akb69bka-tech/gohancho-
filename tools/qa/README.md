# 自動テスト（押していない料理が変わらないことの確認）

どちらも Playwright (Node) で動きます。アプリを `cd gohancho && python3 -m http.server 8765` で動かしてから実行します。

- `reroll-sideeffects.js`: 6か国・品数2〜6とおまかせで「かえる」を1,700回ほど押し、押した料理（とご飯の欄）以外が変わらないことを確かめる。`bad 0` が合格。
- `menu-stable.js`: 苦手な食材・置き換え・出さない日数・1週間分・同じ国の選び直し・国の組み合わせ・言語の変更を繰り返し、押していない料理が変わらないことを確かめる。`ok:` だけが並べば合格（`BAD` が出たら、変わった理由を確かめる）。

環境変数 `BASE` でアプリのURLを変えられます（例: `BASE=http://localhost:8791/`）。
- `layout-shift.js`: 料理の入れ替え・画像の読み込みで、画面がガタつかないことを確かめる。「かえる」「主食」「気分」「まるごと入れ替え」「保存献立を適用」「1週間プランの別の案」「作り方タブの切り替え」「料理の詳細（絵あり・なし・遅い・失敗）」「言語切替」「世界タブ」ごとに、前後で全要素の位置・大きさ（getBoundingClientRect）を比べ、押した料理の中身以外が0.5px以上動いたら違反とする（画面の下の遠くは別に数える）。PerformanceObserver の layout-shift（CLS）も合わせて出す。「違反」0 が合格。
  - 使い方: `BASE=http://localhost:8791/ node tools/qa/layout-shift.js [--quick] [--jobs 4] [--json out.json]`（`--quick` は 4か国・390pxだけ。`--jobs` は国ごとに分けて並列に走らせる）
  - 環境変数: `CCS=JP,US` 国を絞る / `WIDTHS=320,390` 幅 / `SCALES=1,1.25` 文字の拡大 / `IMG=ok,fail,slow` 絵の状態（読めた・失敗・遅い）
  - 注意: 画面を作り直す（innerHTML）ので、PerformanceObserver の CLS は 0 になりやすい。ずれの本体は、位置・大きさの比較（「画面内の最大ずれpx」）で見る。
