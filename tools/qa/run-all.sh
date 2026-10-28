#!/usr/bin/env bash
# ご飯帖のテストを1本にまとめて実行する。結果の表と終了コード（全部通れば 0）を出す。
#
#   tools/qa/run-all.sh                 短縮モード（--quick。CI と同じ。数分）
#   tools/qa/run-all.sh --full          全部（linkage-all・layout-shift・sw-offline・dates・memo-size なども。30分以上）
#   オプション:
#     --jobs N       並列度（既定 3。重くて落ちるときは減らす）
#     --base URL     すでに動いている静的サーバーを使う（省略時は空いているポートで自動で起動して終わりに止める）
#     --port N       自動で起動するときのポート（既定は空きポートを自動選択）
#     --seed N|random  乱数のシード（既定 20261027。random で毎回変える。失敗時に再現用の SEED が出る）
#     --only 語      名前に「語」を含む項目だけ実行（カンマ区切り可。例: --only shopping,i18n）
#     --skip 語      名前に「語」を含む項目を飛ばす
#     --timeout 秒   1項目あたりの上限（既定 quick=900 / full=3600）
#     --list         項目の一覧だけ出す
#   環境変数: CHROME（Chromium の場所）, PLAYWRIGHT_DIR（playwright の場所）
#   必要なもの: node 20 以上, playwright（グローバルでも node_modules でも可）, python3（静的サーバー用）
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"

MODE=quick; JOBS=3; BASE_ARG=""; PORT=0; SEED_ARG=20261027; ONLY=""; SKIP=""; TIMEOUT=""; LIST=0
while [ $# -gt 0 ]; do
  case "$1" in
    --quick) MODE=quick;; --full) MODE=full;;
    --jobs) JOBS="$2"; shift;; --base) BASE_ARG="$2"; shift;; --port) PORT="$2"; shift;;
    --seed) SEED_ARG="$2"; shift;; --only) ONLY="$2"; shift;; --skip) SKIP="$2"; shift;;
    --timeout) TIMEOUT="$2"; shift;; --list) LIST=1;;
    -h|--help) sed -n '2,17p' "$0"; exit 0;;
    *) echo "不明なオプション: $1" >&2; exit 2;;
  esac; shift
done
[ -z "$TIMEOUT" ] && { [ "$MODE" = full ] && TIMEOUT=3600 || TIMEOUT=900; }
if [ "$SEED_ARG" = random ]; then SEED_ARG=$(( (RANDOM * 32768 + RANDOM) % 4294967295 )); fi

# ---- 項目の一覧: 名前 | 種類(static=ブラウザ不要 / app=BASE が要る) | 環境変数 | コマンド ----
ITEMS=()
add() { ITEMS+=("$1|$2|$3|$4"); }
LANGS="ar de en es fil fr hi id it ko pl pt-BR th tr vi zh-Hans zh-Hant"
# 時間のかかる項目を先に並べる（並列で走らせたときの待ちが短くなる）
if [ "$MODE" = quick ]; then
  add "qa-reroll"        app "QUICK=1" "node tools/qa/reroll-sideeffects.js"
  add "qa-menu-stable"   app "QUICK=1" "node tools/qa/menu-stable.js"
  add "t-shopping"       app "N=3" "node tools/tests/shopping.mjs"
  add "t-shop-to-fridge" app "CCS=JP,US,KR,FR,IN" "node tools/tests/shop-to-fridge.mjs"
  add "t-scarce-savedmix" app "CCS=JP,US,KR" "node tools/tests/scarce-savedmix.mjs"
  add "t-week-skip"      app "N=2 CCS=JP,US LAYOUT_LANGS=ja,ar" "node tools/tests/week-skip.mjs"
else
  add "qa-linkage-all"   app "REPS=2 JOBS=1" "node tools/qa/linkage-all.js"
  add "t-memo-size"      app "" "node tools/tests/memo-size.mjs"
  add "qa-layout-shift"  app "" "node tools/qa/layout-shift.js --quick"
  add "t-dates"          app "" "node tools/tests/dates.mjs"
  add "qa-reroll"        app "" "node tools/qa/reroll-sideeffects.js"
  add "qa-menu-stable"   app "" "node tools/qa/menu-stable.js"
  add "qa-polish"        app "" "node tools/qa/polish.js"
  add "qa-sw-offline"    static "" "node tools/qa/sw-offline.js"
  add "t-shopping"       app "" "node tools/tests/shopping.mjs"
  add "t-shop-to-fridge" app "" "node tools/tests/shop-to-fridge.mjs"
  add "t-scarce-savedmix" app "" "node tools/tests/scarce-savedmix.mjs"
  add "t-week-skip"      app "" "node tools/tests/week-skip.mjs"
  add "t-needs-tally"    app "" "node tools/tests/needs-tally.mjs"
fi
for T in resilience fridge-use backup custom-recipe free-vs-pro ics use-soon shop-store stock; do
  add "t-$T" app "" "node tools/tests/$T.mjs"
done
add "syntax-js"        static "" "node tools/qa/check-syntax.mjs"
add "packs-check"      static "" "node tools/packs/check.mjs"
for L in $LANGS; do add "i18n-$L" static "" "node tools/i18n/extract.mjs --check $L"; done
add "steps-scale"      static "" "node tools/steps/scale-steps.test.mjs"
add "terms"            static "" "node tools/tests/terms.mjs"

match() { local name="$1" list="$2" w; [ -z "$list" ] && return 1; IFS=',' read -ra W <<<"$list"; for w in "${W[@]}"; do case "$name" in *"$w"*) return 0;; esac; done; return 1; }
SEL=()
for it in "${ITEMS[@]}"; do
  name="${it%%|*}"
  [ -n "$ONLY" ] && ! match "$name" "$ONLY" && continue
  match "$name" "$SKIP" && continue
  SEL+=("$it")
done
if [ "$LIST" = 1 ]; then for it in "${SEL[@]}"; do echo "${it%%|*}	$(echo "$it" | cut -d'|' -f4)"; done; exit 0; fi
[ "${#SEL[@]}" -eq 0 ] && { echo "実行する項目がありません"; exit 2; }

# ---- 静的サーバー ----
OUT="$(mktemp -d "${TMPDIR:-/tmp}/gohancho-qa.XXXXXX")"
SERVER_PID=""
cleanup() { [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null; kill $(jobs -p) 2>/dev/null; true; }
trap cleanup EXIT INT TERM
NEED_APP=0; for it in "${SEL[@]}"; do [ "$(echo "$it" | cut -d'|' -f2)" = app ] && NEED_APP=1; done
if [ -n "$BASE_ARG" ]; then BASE="$BASE_ARG"
elif [ "$NEED_APP" = 1 ]; then
  if [ "$PORT" = 0 ]; then PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()'); fi
  python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT/gohancho" >"$OUT/server.log" 2>&1 &
  SERVER_PID=$!
  BASE="http://localhost:$PORT/"
  for _ in $(seq 1 50); do curl -fs -o /dev/null "$BASE" && break; sleep 0.2; done
  curl -fs -o /dev/null "$BASE" || { echo "静的サーバーが起動できません: $BASE"; exit 2; }
else BASE="http://localhost:8765/"; fi
export BASE SEED="$SEED_ARG"

echo "モード: $MODE / 並列: $JOBS / BASE: $BASE / SEED: $SEED / ログ: $OUT"
echo "項目: ${#SEL[@]}"

# ---- 実行（並列度 JOBS） ----
run_one() {
  local it="$1" name envs cmd s e rc
  name="$(echo "$it" | cut -d'|' -f1)"; envs="$(echo "$it" | cut -d'|' -f3)"; cmd="$(echo "$it" | cut -d'|' -f4)"
  s=$(date +%s)
  # shellcheck disable=SC2086
  env $envs timeout "$TIMEOUT" bash -c "$cmd" >"$OUT/$name.log" 2>&1; rc=$?
  e=$(date +%s)
  echo "$rc $((e - s))" >"$OUT/$name.rc"
}
PIDS=()
for it in "${SEL[@]}"; do
  while [ "$(jobs -rp | grep -vc "^${SERVER_PID:-x}$")" -ge "$JOBS" ]; do sleep 0.3; done
  run_one "$it" &
  PIDS+=($!)
done
wait "${PIDS[@]}"   # 静的サーバー（これも子プロセス）は待たない

# ---- 結果の表 ----
FAILED=0; PASSED=0
printf '\n%-22s %-8s %6s  %s\n' 項目 結果 秒 最後の行
printf '%-22s %-8s %6s  %s\n' ---------------------- -------- ------ ----------
for it in "${SEL[@]}"; do
  name="${it%%|*}"
  read -r rc sec <"$OUT/$name.rc" 2>/dev/null || { rc=99; sec=0; }
  last="$(grep -v '^[[:space:]]*$' "$OUT/$name.log" | tail -n 1 | cut -c1-90)"
  if [ "$rc" = 0 ]; then st=PASS; PASSED=$((PASSED + 1)); else st=FAIL; FAILED=$((FAILED + 1)); [ "$rc" = 124 ] && st=TIMEOUT; fi
  printf '%-22s %-8s %6s  %s\n' "$name" "$st" "$sec" "$last"
done
echo
if [ "$FAILED" -gt 0 ]; then
  echo "=== 失敗した項目のログ（末尾40行）。SEED=$SEED で再現できる ==="
  for it in "${SEL[@]}"; do
    name="${it%%|*}"; read -r rc sec <"$OUT/$name.rc" 2>/dev/null || rc=99
    [ "$rc" = 0 ] && continue
    echo "--- $name (exit $rc) : $(echo "$it" | cut -d'|' -f3) $(echo "$it" | cut -d'|' -f4)"; tail -n 40 "$OUT/$name.log"
  done
  echo "合計: 成功 $PASSED / 失敗 $FAILED   ログ: $OUT"
  exit 1
fi
echo "合計: 全 $PASSED 項目 成功   ログ: $OUT"
exit 0
