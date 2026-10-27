#!/bin/bash
# ご飯帖 iPhone アプリの準備を一度に行う（Mac で実行。Xcode と Node.js が必要）
#   使い方: cd ~/Documents/gohancho/ios-app && npm run setup
#   --ci を付けると、GitHub Actions 用（Xcode を開かない）
set -euo pipefail
cd "$(dirname "$0")/.."
CI_MODE=0; [ "${1:-}" = "--ci" ] && CI_MODE=1

# 部品の版（メジャー）を固定する。2026年10月にこの構成（Capacitor 8 / RevenueCat 13）で作ったので、それにそろえる。
# 版を付けずに入れると、新しいメジャー版が出た日にビルドが急に壊れることがある。
#   - Capacitor 8 は Node.js 22 以上・Xcode 26 以上が必要。iOS プロジェクトは Swift Package Manager 版（App.xcworkspace は作られない）
#   - 上げるときは、Capacitor の移行ガイドを読んでから、ここの数字と ios-release.yml をまとめて変える
CAP=8; RC=13; CAP_ASSETS=3
echo "1/7 部品（Capacitor $CAP とプラグイン）を入れています…"
npm install "@capacitor/core@^$CAP" "@capacitor/ios@^$CAP" "@capacitor/share@^$CAP" "@capacitor/filesystem@^$CAP" "@capacitor/local-notifications@^$CAP" "@revenuecat/purchases-capacitor@^$RC"
npm install -D "@capacitor/cli@^$CAP" "@capacitor/assets@^$CAP_ASSETS"

echo "2/7 アプリ本体（../gohancho）を取りこんでいます…"
npm run copy-web

echo "3/7 iOS プロジェクトを作っています…"
[ -d ios ] || npx cap add ios

echo "4/7 アイコンと起動画面を作っています…"
npx @capacitor/assets generate --ios

echo "5/7 審査に必要な設定（Info.plist）を書きこんでいます…"
PLIST=ios/App/App/Info.plist
PB=/usr/libexec/PlistBuddy
set_key(){ "$PB" -c "Set :$1 $3" "$PLIST" 2>/dev/null || "$PB" -c "Add :$1 $2 $3" "$PLIST"; }
set_key CFBundleDisplayName string "ご飯帖"
# 開発言語は英語にする: 日本語以外の言語の人には、下の英語の許可文言が出る（日本語の人には ja.lproj の日本語）。
set_key CFBundleDevelopmentRegion string "en"
# 許可の文言（Info.plist の基本＝英語）。押したときだけ使うこと・保存しないことを、本当のとおりに書く（審査 5.1.1(ii)・5.1.2）
set_key NSCameraUsageDescription string "Used only when you choose to take a photo of a dish you cooked. The photo is kept on this device."
set_key NSPhotoLibraryUsageDescription string "Used only when you choose to pick a photo of a dish you cooked. The photo is kept on this device."
# 「声で入力」（材料・料理の検索）に必要。これが無いと iPhone アプリでマイクが使えず、審査でも指摘される
set_key NSMicrophoneUsageDescription string "Used only while you tap the voice-input button, to hear an ingredient or dish name. The app does not save recordings."
set_key NSSpeechRecognitionUsageDescription string "Used to turn your spoken words into text for ingredient and dish names. Speech is processed by Apple's speech recognition."
# 日本語（InfoPlist.strings）。App Store の「Localizations」で言語を足したときも、日本語以外は上の英語になる
mkdir -p ios/App/App/en.lproj ios/App/App/ja.lproj
cat > ios/App/App/en.lproj/InfoPlist.strings <<'STR'
"NSCameraUsageDescription" = "Used only when you choose to take a photo of a dish you cooked. The photo is kept on this device.";
"NSPhotoLibraryUsageDescription" = "Used only when you choose to pick a photo of a dish you cooked. The photo is kept on this device.";
"NSMicrophoneUsageDescription" = "Used only while you tap the voice-input button, to hear an ingredient or dish name. The app does not save recordings.";
"NSSpeechRecognitionUsageDescription" = "Used to turn your spoken words into text for ingredient and dish names. Speech is processed by Apple's speech recognition.";
STR
cat > ios/App/App/ja.lproj/InfoPlist.strings <<'STR'
"NSCameraUsageDescription" = "作った料理の写真を撮るときだけ使います。写真はこの端末の中に保存されます。";
"NSPhotoLibraryUsageDescription" = "作った料理の写真を選ぶときだけ使います。写真はこの端末の中に保存されます。";
"NSMicrophoneUsageDescription" = "「声で入力」を押している間だけ、食材や料理の名前を聞き取るために使います。アプリは録音を保存しません。";
"NSSpeechRecognitionUsageDescription" = "話した言葉を食材や料理の名前の文字にするために使います。音声は Apple の音声認識で処理されます。";
STR
plutil -lint ios/App/App/en.lproj/InfoPlist.strings ios/App/App/ja.lproj/InfoPlist.strings >/dev/null
# InfoPlist.strings を App ターゲットに足す（何度実行しても二重には入らない。失敗しても先へ進む＝英語の基本文言で動く）
ruby -e '
  require "xcodeproj"
  pr = Xcodeproj::Project.open("ios/App/App.xcodeproj")
  t = pr.targets.find { |x| x.name == "App" } or abort("App target not found")
  g = pr.main_group.find_subpath("App", false) or abort("App group not found")
  vg = g.children.find { |c| c.isa == "PBXVariantGroup" && c.name == "InfoPlist.strings" } || g.new_variant_group("InfoPlist.strings")
  %w[en ja].each { |l| p = "#{l}.lproj/InfoPlist.strings"; vg.files.find { |f| f.path == p } || vg.new_reference(p) }
  pr.root_object.known_regions = (pr.root_object.known_regions + %w[en ja]).uniq
  t.add_resources([vg]) unless t.resources_build_phase.files_references.include?(vg)
  pr.save
' 2>&1 || echo "   （InfoPlist.strings の日本語を Xcode に自動で足せませんでした。英語の基本文言で動きます。申請の完全ガイド.md の手順を参照）"
set_key ITSAppUsesNonExemptEncryption bool false
# iPhone 専用にする（iPad 用のスクリーンショットを用意しなくて済む）
PBX=ios/App/App.xcodeproj/project.pbxproj
sed -i '' -e 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' "$PBX" || true

echo "6/7 プライバシー マニフェスト（PrivacyInfo.xcprivacy）を書きこんでいます…"
# App Store の審査で必要。中身は「Appのプライバシー」の回答（appstore/kit/03_共通/04_Appのプライバシー（回答）.txt）とそろえる:
#   トラッキングなし / 集める情報 = 購入履歴・ユーザーID（RevenueCat。本人とは結びつけない・アプリの機能のため）
#   使っている API = UserDefaults（理由 CA92.1: アプリ自身の設定を保存）
cat > ios/App/App/PrivacyInfo.xcprivacy <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSPrivacyTracking</key>
	<false/>
	<key>NSPrivacyTrackingDomains</key>
	<array/>
	<key>NSPrivacyCollectedDataTypes</key>
	<array>
		<dict>
			<key>NSPrivacyCollectedDataType</key>
			<string>NSPrivacyCollectedDataTypePurchaseHistory</string>
			<key>NSPrivacyCollectedDataTypeLinked</key>
			<false/>
			<key>NSPrivacyCollectedDataTypeTracking</key>
			<false/>
			<key>NSPrivacyCollectedDataTypePurposes</key>
			<array>
				<string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
			</array>
		</dict>
		<dict>
			<key>NSPrivacyCollectedDataType</key>
			<string>NSPrivacyCollectedDataTypeUserID</string>
			<key>NSPrivacyCollectedDataTypeLinked</key>
			<false/>
			<key>NSPrivacyCollectedDataTypeTracking</key>
			<false/>
			<key>NSPrivacyCollectedDataTypePurposes</key>
			<array>
				<string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
			</array>
		</dict>
	</array>
	<key>NSPrivacyAccessedAPITypes</key>
	<array>
		<dict>
			<key>NSPrivacyAccessedAPIType</key>
			<string>NSPrivacyAccessedAPICategoryUserDefaults</string>
			<key>NSPrivacyAccessedAPITypeReasons</key>
			<array>
				<string>CA92.1</string>
			</array>
		</dict>
	</array>
</dict>
</plist>
PLIST
plutil -lint ios/App/App/PrivacyInfo.xcprivacy >/dev/null
# ファイルを置くだけでは アプリに入らない。Xcode プロジェクトの App ターゲット（Copy Bundle Resources）に足す。
# Ruby の xcodeproj（CocoaPods と同じ部品）で足す。何度実行しても二重には入らない。
if ! grep -q "PrivacyInfo.xcprivacy in Resources" ios/App/App.xcodeproj/project.pbxproj; then
  gem list -i xcodeproj >/dev/null 2>&1 || gem install --user-install --no-document xcodeproj >/dev/null 2>&1 || true
  ruby -e '
    require "xcodeproj"
    pr = Xcodeproj::Project.open("ios/App/App.xcodeproj")
    t = pr.targets.find { |x| x.name == "App" } or abort("App target not found")
    g = pr.main_group.find_subpath("App", false) or abort("App group not found")
    ref = g.files.find { |f| f.path == "PrivacyInfo.xcprivacy" } || g.new_reference("PrivacyInfo.xcprivacy")
    t.add_resources([ref]) unless t.resources_build_phase.files_references.include?(ref)
    pr.save
  ' 2>&1 || true
fi
if grep -q "PrivacyInfo.xcprivacy in Resources" ios/App/App.xcodeproj/project.pbxproj; then
  echo "   PrivacyInfo.xcprivacy を App ターゲットに入れました"
else
  echo "!! PrivacyInfo.xcprivacy を Xcode プロジェクトに自動で足せませんでした。"
  echo "   Xcode で App → App フォルダに PrivacyInfo.xcprivacy をドラッグし、「Add to targets: App」に印を付けてください"
  echo "   （申請の完全ガイド.md の「プライバシー マニフェスト」の項）。"
  [ "$CI_MODE" = 1 ] && exit 1
fi

if [ "$CI_MODE" = 1 ]; then echo "7/7 同期しています…"; npx cap sync ios; exit 0; fi
echo "7/7 同期して Xcode を開きます…"
npx cap sync ios
npx cap open ios
echo "完了: Xcode で Signing & Capabilities の Team を選び、In-App Purchase を追加してください（申請チェックリスト.md の手順4）。"
