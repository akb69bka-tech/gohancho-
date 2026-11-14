# 公開後の管理体制（App Store 公開・GitHub で直せる仕組み）

作成: 2026-11-06（オーナー指示「そろそろアップルストアに出す。管理体制を構築して。GitHub で修正できるように」）。
既存の手順書（`ios-app/申請の完全ガイド.md`・`申請チェックリスト.md`・`アップデートの手順.md`・`サポート体制.md`）が正。ここは「だれが・どの順で・何を確かめてから出すか」を1枚にまとめた管理表。

## 結論
- **出す前にやることは2つだけ**: ①開発の線（claude/int）を main に取り込む（main は 2026-10-24 から止まっていて、802 コミット遅れ）②オーナーの「お金・アカウント」の作業（下の C）。
- **出したあとは GitHub だけで回る**: 声（Issue）→ Claude が直して PR → オーナーが Merge → 「iOS release」を起動 → オーナーが App Store Connect で「審査へ提出」。
- お金が発生すること（Apple Developer 登録、課金の開始・価格）は自動では行わない。オーナーの判断。

## A. 役割（だれが何を持つか）
| 役割 | 担当 | やること |
| --- | --- | --- |
| 最終決定・お金・提出ボタン | オーナー | Merge を押す／App Store Connect で「審査へ提出」／価格・課金の開始 |
| 統括 | 桐生 昇 | 開発の線（claude/int）の統合・QA・版上げ・公開の段取り・毎回の報告 |
| 品質保証 | 八木 千景 | `tools/qa/run-all.sh` 全項目と category-audit を、公開の合格条件にする |
| 安全（アレルギー・食の決まり） | 北条／柊 | 安全に関わる発見は最優先。リリース前に alg-*・diet-r2 を確認 |
| 申請・版上げ | `release-manager`（.claude/agents） | package.json と APP_VERSION を合わせ、metadata を更新、Actions を起動 |
| 声の受付・不具合 | `support-desk`・`voice-of-customer`・`app-fixer` | Issue・メール・レビューを受けて直し、PR を作る |
| 課金の相談 | `billing-support` | 購入・復元・返金の案内（返金は Apple が扱う） |

## B. 枝（ブランチ）の決まり
| 枝 | 役目 | ルール |
| --- | --- | --- |
| `main` | **公開の線**。Pages・タグ・iOS release はここから | PR でだけ変える。QA（GitHub の「QA」）が緑のものだけ Merge |
| `claude/int` | 開発の統合の線 | 統括が QA 全項目を通してから push |
| `claude/<作業名>` | 各担当の作業 | int に取り込む。履歴の書き換え（force push）はしない |
| `hotfix/<名前>` | 公開後の緊急の直し | main から切る → PR → Merge → すぐ版を上げて申請 |

## C. 初回の申請の前に（ゲート）
**C-1 コードの側（統括が行う。お金なし）**
1. claude/int を main に取り込む PR を作る（下書き）。QA が緑であることを確かめる。
2. `ios-app/package.json` の version と `gohancho/index.html` の `APP_VERSION` を同じ値にする（今は 1.1.0）。
3. `python3 ios-app/appstore/check.py`（文字数の上限）を通す。metadata.md の「新機能」を最新に（v100 以降の変更を利用者向けの言葉で）。
4. `gohancho/remote.json` の `billingMode` が `off`（全員無料）であることを確かめる。
5. 公開ページ（privacy.html・support.html）の運営者名・連絡先・公開日が埋まっているか確かめる。

**C-2 オーナーの作業（お金・アカウント。自動ではやらない）**
1. Apple Developer Program 登録（年99米ドル）。
2. App Store Connect の契約・税・口座、Small Business Program の申し込み。
3. GitHub の Secrets 6つ（`APPLE_TEAM_ID`・`ASC_KEY_ID`・`ASC_ISSUER_ID`・`ASC_API_KEY_P8`・`REVENUECAT_API_KEY`・`SUPPORT_EMAIL`）。登録のしかた: `ios-app/アップデートの手順.md` の2。
4. GitHub Settings → Pages の Source を「GitHub Actions」に。
5. 実機（Mac・iPhone）での TestFlight 確認（初回のみ Mac が必要）。**この環境では実機の確認ができていない**（チラシの文字認識も未確認）。
6. 申請文・年齢制限・プライバシー（「Appのプライバシー」）の回答。`ios-app/申請の完全ガイド.md` の手順どおり。

**C-3 出してよいかの合格条件（全部そろってから「審査へ提出」）**
- [ ] GitHub の QA が main で緑
- [ ] `check.py` OK、バージョンが2か所そろっている
- [ ] TestFlight の実機で、起動・献立・お気に入り・買い物メモ・設定・（課金の画面）が動く
- [ ] アレルギー・食の決まりの表示が、日本語と英語で正しい（北条の確認）
- [ ] privacy・support ページが開ける
- [ ] 既知の未確認（チラシ認識・日本語 OCR の対応 iOS）は、審査の説明に書くか機能を隠す

## D. 公開後の運用（GitHub だけで直せる）
1. **声を書く場所**: GitHub の Issue（「ご飯帖の不具合・要望」フォーム、常設の「サポート窓口」Issue）。メール・レビューは本文を貼る。
2. **直す**: Claude が Issue を読み、原因→修正→テスト→PR を作る（`app-fixer`）。PR には `.github/PULL_REQUEST_TEMPLATE.md` の確認項目が付く。
3. **確認**: PR の「QA」が緑であること。安全・課金・プライバシーに触れる変更は、`CODEOWNERS` により北条／オーナーの確認が必要。
4. **出す**: オーナーが Merge → Claude に「バージョン 1.1.1 で申請して」→ 「iOS release」が組み立てて App Store Connect へ → オーナーが「審査へ提出」。緊急なら Expedited Review。
5. **アプリ内のお知らせ・古い版への更新案内**: `gohancho/remote.json`（`minVersion` など）。アプリを出し直さずに変えられるのはここだけ。
6. **週1の点検（2時間ごとの見回りに追加）**: レビュー・Issue の件数、QA の緑、`remote.json`、期限の近い項目（docs/escalations.md）。

## E. 版の付けかた・記録
- 版: 不具合の直し 1.1.x、機能 1.x.0、大きな変更 2.0.0。タグは `gohancho-v<版>`（タグで iOS release が動く）。
- 内部の版（`gohancho-vNN` / `ASSET_V`）は Web 側の更新用で、App Store の版とは別。
- 変更の記録: 改修ノート（Artifact）と `docs/panel/board.md`。App Store の「新機能」は利用者向けの言葉だけ。

## F. リスクと「わかりません」
- main が 802 コミット遅れのため、最初の取り込みは大きい。QA が緑でも、実機でしか出ない不具合はありうる（**わかりません**）。
- Apple の審査の通過・所要時間は **わかりません**（「通常1〜3日」は一次情報を確かめていない）。
- 手数料・消費税の扱い、300円の価格の段階が選べるかは、docs/escalations.md のとおり未確認。
