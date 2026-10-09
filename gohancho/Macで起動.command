#!/bin/bash
# わが家のごはん帖を Mac で起動する（ダブルクリックで実行）
cd "$(dirname "$0")" || exit 1
PORT=8765
URL="http://localhost:$PORT/"

if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "すでに起動しています。ブラウザで開きます: $URL"
  open "$URL"
  exit 0
fi

if /usr/bin/xcode-select -p >/dev/null 2>&1 && command -v python3 >/dev/null 2>&1; then
  echo "わが家のごはん帖を起動しました: $URL"
  echo "終わるときは、このウィンドウを閉じるか Control + C を押してください。"
  (sleep 1; open "$URL") &
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
else
  echo "python3 が使えないため、ファイルを直接開きます（オフライン機能とアプリ追加は使えません）。"
  echo "python3 を使えるようにするには、ターミナルで  xcode-select --install  を実行してください。"
  open index.html
fi
