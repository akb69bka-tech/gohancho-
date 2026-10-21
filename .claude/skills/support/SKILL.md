---
name: support
description: ご飯帖の不具合・相談の窓口。「/support ＜報告の本文や Issue 番号＞」で、サポートチーム（support-desk → app-fixer / billing-support / release-manager / review-responder）に振り分けて対応する
---
# /support — ご飯帖サポート窓口

引数（$ARGUMENTS）には、利用者からの報告の本文、GitHub Issue の番号、App Store レビューの文、Apple からの差し戻し文のいずれかが入ります。

手順:
1. Issue 番号なら `gh api repos/akb69bka-tech/toresabi/issues/<番号>` で本文を取る。
2. `support-desk` エージェントに本文を渡し、事実・緊急度・担当を決めさせる。
3. 担当エージェントに作業させる:
   - アプリの不具合 → `app-fixer`（直してテスト、ブランチ `claude/fix-<短い名前>` に push、Draft PR）
   - 課金・返金・復元 → `billing-support`（案内文と remote.json 案）
   - Apple の差し戻し → `review-responder`
   - 修正版の申請 → `release-manager`
4. 🔴 緊急なら、修正を待たず先に `gohancho/remote.json` の `notice` 更新を提案する（main への反映は運営者のマージが必要）。
5. Issue が元なら、結果を Issue にコメントする（対応内容・PR のリンク・利用者への返事案）。コメントの最後に Claude Code の署名を付ける。
6. 運営者への報告は `ios-app/サポート体制.md` の型（結論1行 → 根拠 → 例外 → 3行要約 → わからないこと）で書く。

してはいけないこと: 利用者への「返金します」の約束、テストを消して通すこと、運営者の確認なしに main へ直接 push すること。
