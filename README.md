# わが家のご飯帖（Gohancho）

お膳ごと、おまかせ献立。主菜・副菜・ご飯・汁ものを「お膳」の形で毎日提案する献立アプリです。21の国・地域の家庭料理と17言語に対応し、アカウント不要・データは端末の中だけに保存します。

- iPhone アプリ（App Store に申請予定）と、ブラウザで使える Web 版（PWA）があります
- Web 版・プライバシーポリシー・サポート: https://akb69bka-tech.github.io/gohancho-/
- 不具合・要望・相談: [Issues](../../issues/new/choose)（迷ったら [サポート窓口](../../issues/1)）

## このリポジトリの中身

| フォルダ・ファイル | 中身 |
| --- | --- |
| `gohancho/` | アプリ本体（`index.html` 1枚）、17言語の辞書 `i18n/`、20か国のレシピ `packs/`、料理の絵 `img/dish/`、プライバシーポリシー・サポートのページ、審査なしで変えられる設定 `remote.json` |
| `ios-app/` | iPhone アプリ（Capacitor）の設定、App Store 申請の一式（`appstore/`）、申請・アップデート・サポート体制・譲渡の準備などの手順書 |
| `tools/illustrations/` | 料理の絵を描くプログラム（すべて自作の SVG） |
| `tools/i18n/` | 翻訳の辞書のチェック |
| `.github/workflows/ios-release.yml` | iPhone アプリを組み立てて App Store Connect に送る |
| `.github/workflows/pages.yml` | 公開ページ（Web 版）を GitHub Pages に出す |
| `.github/ISSUE_TEMPLATE/` | 不具合・課金・相談の受付フォーム |
| `.claude/` | サポートチーム（Claude のエージェント）と `/support` 窓口の手順 |

## はじめに読む

1. 申請のしかた: [ios-app/申請の完全ガイド.md](ios-app/申請の完全ガイド.md)
2. 公開後の直し方とアップデート: [ios-app/アップデートの手順.md](ios-app/アップデートの手順.md)
3. 困ったとき・お客様の声: [ios-app/サポート体制.md](ios-app/サポート体制.md)
4. 権利と将来の譲渡: [ios-app/事業譲渡と権利の準備.md](ios-app/事業譲渡と権利の準備.md)、[ios-app/独自性の記録.md](ios-app/独自性の記録.md)

## 履歴について

2026年9月29日に別のリポジトリ（akb69bka-tech/toresabi）の中で作りはじめ、2026年10月23日にご飯帖だけを変更履歴ごとこのリポジトリに移しました。移す前のコミットとの対応は `ios-app/権利の記録/コミット対応表.txt` にあります。
