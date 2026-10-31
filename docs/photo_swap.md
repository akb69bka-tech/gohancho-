# 料理の絵を Gemini の写真風の画像に入れ替える手順

オーナーが Gemini で作った料理の画像（zip）を受け取ってから、アプリに入れて公開するまでの手順です。

## しくみ

```
Gemini の画像（<ID>.png・1品1枚） ──▶ import-photos.mjs ──▶ gohancho/img/dish/<ID>.webp（512px）
                                                          gohancho/img/dish/t/<ID>.webp（192px・一覧用）
                                                          manifest.json の <ID> を via:'photo' に
```

- ファイル名の `<ID>` は、指示文の一覧（xlsx）の C 列「画像ID」です。D 列の「<ID>.png」のまま保存してもらいます。
- 入っていない料理は、いままでの手描きの SVG のままです。何回かに分けて入れ替えられます（1か国ずつなど）。
- 手描きの SVG（`<ID>.svg`）は消しません。manifest を戻せば元の絵に戻ります。
- アプリは、写真を生成りの背景ごと丸く切って、お皿のように出します（お膳・詳しい画面・一覧。暗い表示でも四角が浮かない）。
- 詳しい画面には「写真風の絵は Gemini（Google の画像生成）で作成したイメージです。実際の料理・盛りつけとは異なります。」と出ます（17言語の訳あり）。
- 画像の変換は手元の Chromium（Playwright）で行います。外へは通信しません。

## 必要なもの

- Node 20 以上と Playwright（`npm i -g playwright && npx playwright install chromium`。テストと同じもの）

## 手順

### 1. zip を開く

zip は、中身を確かめるまで作業用の空のフォルダに開きます（リポジトリの中には開かない）。

```bash
mkdir -p ~/gemini_in/2026-11-01 && unzip -q ~/Downloads/gohancho_gemini.zip -d ~/gemini_in/2026-11-01
```

- 下のフォルダ（国ごとなど）に分かれていても、そのまま読めます。`__MACOSX` と隠しファイルは見ません。
- 使える形式は `.png` / `.jpg` / `.jpeg` / `.webp` です。

### 2. 何枚入るか確かめる（何も書きません）

```bash
cd ~/gohancho-
node tools/illustrations/import-photos.mjs ~/gemini_in/2026-11-01 --dry-run
```

「一覧にない名前のため飛ばした画像」が出たら、ファイル名が C 列の画像ID と違っています。名前を直してからやり直します。

### 3. 取りこむ

```bash
node tools/illustrations/import-photos.mjs ~/gemini_in/2026-11-01
```

- 真ん中を正方形に切り、512×512 の WebP（品質 0.8）と、192×192 の一覧用の WebP を作ります。
- 40KB を超えるものは、品質を少しずつ下げて 40KB 以内にします（下げても超えたものは名前が出ます）。
  変えたいときは `--quality 0.8` `--max-kb 40` を付けます。
- 同じ料理をもう一度取りこむと、新しい画像で上書きします（作り直した画像の差しかえも同じコマンド）。
- 最後に「写真の絵: ○品 / 全 1822品」と、残りの数が出ます。

### 4. 確かめる

```bash
node tools/tests/photo-dish.mjs              # 取りこみ・お膳・詳しい画面・一覧・暗い表示・オフライン
tools/qa/run-all.sh --full                   # 公開する前は全部（30分以上）
python3 -m http.server 8765 --directory gohancho   # 画面で見る: http://localhost:8765/
```

画面では、お膳・料理の詳しい画面・「材料から」の料理をさがす一覧で、写真が丸く出ていること、明るい表示と暗い表示の両方で、器のまわりが変に見えないことを見ます。

### 5. コミットする

```bash
git add gohancho/img/dish/manifest.json gohancho/img/dish/*.webp gohancho/img/dish/t/*.webp
git commit -m "料理の絵を Gemini の写真風の画像に（○品）"
```

zip と元の PNG はコミットしません（1枚 1MB ほどあり、アプリは WebP しか使いません）。

### 6. 公開する

- いつもの公開の手順どおり、`gohancho/sw.js` の `VERSION` と `gohancho/index.html` の `ASSET_V` を同じ値に上げます
  （絵の一覧 manifest.json を、使っている人の端末に早く届けるため。絵そのものは `?v=` の印が変わるので、上げなくても新しいものに替わります）。
- 一度見た絵は、端末に保存され、電波がなくても出ます（sw.js の画像の保存。何も変えなくてよい）。

### 7. 試用アプリ（claude.ai の Artifact）を作り直す

```bash
python3 artifact-build5.py <リポジトリ> <出力先>/pub
```

- 写真の絵は `image/webp` の data URL で、国ごとの `bundle-<国>.json` に埋めこまれます（SVG の絵の出力は前と同じ）。
- 大きさの見込み（1,822品すべてを写真にしたとき）:

  | | いま（SVG） | 写真（1枚 平均 約28KB のとき） | 写真（全部 40KB のとき） |
  | --- | --- | --- | --- |
  | 絵の合計（img/dish/） | 約 89MB | 約 78MB | 約 107MB |
  | いちばん大きいファイル（bundle-jp.json、223品） | 約 13.0MB | 約 9.6MB | 約 13.1MB |

  1ファイル 16MB の上限には入ります。1回の公開は 64MB までなので、いまと同じく、何回かに分けて同じ URL に公開します。
  平均 約28KB は、写真らしい粒のある仮の画像での値です。本物の画像で取りこんだあと、道具が出す平均の大きさで見直してください。

## 元の手描きの絵に戻すとき

```bash
# 1品だけ（例: nikujaga）。<前のコミット> は写真を入れる前のコミット
git checkout <前のコミット> -- gohancho/img/dish/t/nikujaga.webp
git rm gohancho/img/dish/nikujaga.webp
# manifest.json の "nikujaga" を、前のコミットの内容（file: nikujaga.svg・via: svg …）に戻す
```

全部戻すときは、`gohancho/img/dish/manifest.json` と `gohancho/img/dish/t/` を前のコミットに戻し、`gohancho/img/dish/*.webp` を消します。

## 注意

- `tools/illustrations/draw/build.mjs`（手描きの絵を作り直す）は、写真にした料理の manifest を書きかえません。
- `tools/illustrations/draw/thumbs.mjs` を実行しても、写真の一覧用の絵はそのままです（作り直す必要はありません）。
- 料理のデータ・アレルギーの判定・献立の選び方は、絵の入れ替えでは変わりません。
