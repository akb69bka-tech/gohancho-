#!/bin/bash
# ご飯帖 iPhone アプリの準備を一度に行う（Mac で実行。Xcode と Node.js が必要）
#   使い方: cd ~/Documents/toresabi/ios-app && npm run setup
#   --ci を付けると、GitHub Actions 用（Xcode を開かない）
set -euo pipefail
cd "$(dirname "$0")/.."
CI_MODE=0; [ "${1:-}" = "--ci" ] && CI_MODE=1

echo "1/6 部品（Capacitor とプラグイン）を入れています…"
npm install @capacitor/core @capacitor/ios @capacitor/share @capacitor/local-notifications @revenuecat/purchases-capacitor
npm install -D @capacitor/cli @capacitor/assets

echo "2/6 アプリ本体（../gohancho）を取りこんでいます…"
npm run copy-web

echo "3/6 iOS プロジェクトを作っています…"
[ -d ios ] || npx cap add ios

echo "4/6 アイコンと起動画面を作っています…"
npx @capacitor/assets generate --ios

echo "5/6 審査に必要な設定（Info.plist）を書きこんでいます…"
PLIST=ios/App/App/Info.plist
PB=/usr/libexec/PlistBuddy
set_key(){ "$PB" -c "Set :$1 $3" "$PLIST" 2>/dev/null || "$PB" -c "Add :$1 $2 $3" "$PLIST"; }
set_key CFBundleDisplayName string "ご飯帖"
set_key CFBundleDevelopmentRegion string "ja"
set_key NSCameraUsageDescription string "作った料理の写真を撮るために使います"
set_key NSPhotoLibraryUsageDescription string "作った料理の写真を選ぶために使います"
set_key ITSAppUsesNonExemptEncryption bool false
# iPhone 専用にする（iPad 用のスクリーンショットを用意しなくて済む）
PBX=ios/App/App.xcodeproj/project.pbxproj
sed -i '' -e 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' "$PBX" || true

if [ "$CI_MODE" = 1 ]; then echo "6/6 同期しています…"; npx cap sync ios; exit 0; fi
echo "6/6 同期して Xcode を開きます…"
npx cap sync ios
npx cap open ios
echo "完了: Xcode で Signing & Capabilities の Team を選び、In-App Purchase を追加してください（申請チェックリスト.md の手順4）。"
