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
[ -z "$TIMEOUT" ] && { [ "$MODE" = full ] && TIMEOUT=3600 || TIMEOUT=1500; }
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
for T in resilience fridge-use backup custom-recipe free-vs-pro ics use-soon shop-store allergy allergen-regions stock menu-trust promises dish-alias panel-r3 panel-r3b panel-r4 panel-r4b panel-r4-ui marugoto marugoto-img menu-back upgrade-v36 upgrade-seats wish first-country greet panel-r8 panel-r11 panel-r12 panel-r13 panel-r14 panel-r15 panel-r16 panel-mode panel-all1 panel-r18 panel-b456 panel-r18b country-lang ask-page wish-alg list-alg alg-words alg-lang alg-r105 alg-r110 panel-r21ui plural panel-r21 panel-r21b panel-r22 sale hing panel-r23-menu vote-country panel-b2-ui okayu-all diet-r2 diet-r3 diet-r4 safe-r4 safe-r5 save-remake morning-big narrow-r5 narrow-r6 bfast-r1 narrow-r7 bfast-r29 diet-r5 bfast-r30 webbill-r1 night-r1 salt-r1 curry-r1 tool-r1 tooltab-r1 risk-r1 ui32 hang-r1 kcal-r1 kcal-r2 modebtn-r1 settabs-r1 hang-r2 settabs-r2 upd34 tab35 hang-r3 kcal-r3 tab36 note37 tab37 tab38 ob39 safe40 ob40 dm41 safe41 safe42 dm42 safe43 dm43 safe44 safe45 dm44 safe46 dm45 safe47 safe48 ui49 perf48 ui51 ui52 ui53 perf49 perf50 ui54 offline-lang diet-r6 tab51 ime51 safe51 namesearch dupnames pack-protein r226 r227 r228 r233 r235 prelaunch p100 zoom share-sns owner24 policy-r1 carbweek; do
  # GitHub の点検（CI）だけ、時間のかかる確かめの言語を6つ（ja・ar・de・en・hi・th）にしぼる（60分の上限に近づいた）。手元の点検（CI でないとき）は今までどおり18言語すべて。
  #   11/19: safe43 safe48 ui52 ui53 ui54 namesearch r227 r228（v150〜v153 の PR の点検が4回続けて60分で止まった）
  #   11/20（v157 で約59分）: diet-r3 diet-r2 safe-r4 note37 tab36 okayu-all tool-r1 panel-r21ui settabs-r2 safe45 safe46 も。
  #     safe45・safe46 は、遅い端末の二度押し（A）のくり返しを2回から1回に（REPS=1。間合い4つ × CPU 3段 × 2画面の組み合わせはそのまま）
  #   11/20（run 474 で約59分。GitHub の機械が遅い日）: いちばん長い6言語の確かめ（safe48 r227 safe43 ui52）は、CI では3言語（ja・ar・de。もとの言葉・右から並ぶ・長い語）。namesearch は3言語にしても速くならなかった（353秒）ので6言語のまま
  CI6=" safe43 safe48 ui52 ui53 ui54 namesearch r227 r228 diet-r3 diet-r2 safe-r4 note37 tab36 okayu-all tool-r1 panel-r21ui settabs-r2 safe45 safe46 "
  CI3=" safe48 r227 safe43 ui52 "
  if [ -n "${CI:-}" ] && case "$CI6" in *" $T "*) true;; *) false;; esac; then
    L6="LANGS=ja,ar,de,en,hi,th"; case "$CI3" in *" $T "*) L6="LANGS=ja,ar,de";; esac
    case " safe45 safe46 " in *" $T "*) E="$L6 REPS=1";; *) E="$L6";; esac
    add "t-$T" app "$E" "node tools/tests/$T.mjs"
  elif [ -n "${CI:-}" ] && case " r233 r235 " in *" $T "*) true;; *) false;; esac; then
    # 4言語（ja・en・de・ar）で見ている第55回の安全の確かめは、CI では日本語とアラビア語（右から並ぶ）の2つ。手元では4言語
    add "t-$T" app "LANGS=ja,ar" "node tools/tests/$T.mjs"
  elif [ -n "${CI:-}" ] && case " safe44 marugoto-img allergen-regions list-alg wish-alg hang-r1 " in *" $T "*) true;; *) false;; esac; then
    # 11/20（run 474 で約59分）: 21か国を1つずつ見る確かめは、CI では8か国（日本・米・独・印・タイ・エジプト・韓国・中国。字の種類と地域が分かれるように）。手元では21か国
    add "t-$T" app "CCS=JP,US,DE,IN,TH,EG,KR,CN" "node tools/tests/$T.mjs"
  elif [ -n "${CI:-}" ] && [ "$T" = sale ]; then
    # 特売の日の入口の画面（日付2つ × 時刻3つ × 幅3つ × 文字3段階 × 家族）は、CI では時刻を2つ（4時より前の「前の日」と昼）。手元では3つ
    add "t-$T" app "HOURS=1,12" "node tools/tests/$T.mjs"
  elif [ -n "${CI:-}" ] && [ "$T" = panel-r4b ]; then
    # 置き換えた手順の確かめ（R9X）は、CI ではテストの QUICK（置き換えの多い9か国）。手元では20か国
    add "t-$T" app "QUICK=1" "node tools/tests/$T.mjs"
  else
    add "t-$T" app "" "node tools/tests/$T.mjs"
  fi
done
add "qa-category-audit" app "" "node tools/qa/category-audit.js"   # 仲間はずれの点検（21か国 × 気分・かえる・主食・席・1週間・明日）。1件でもあれば落ちる
add "qa-category-audit-4343" app "SEED=4343" "node tools/qa/category-audit.js"   # 第43回 R208: 乱数 4343 で、トルコのご飯ものの主菜にピラウの副菜が付いた（プランのある日に開く）
add "qa-tray-fit"      app "" "node tools/qa/tray-fit.js"   # CI でも6言語のまま（4言語にしぼると席 1〜7 のうち試せない席が出て落ちる・run 473）
add "qa-tray-fit-morning" app "TZ=Asia/Tokyo CLOCK=2026-10-30T07:00:00+09:00 VPS=390x844:0,360x740:0,360x740:2 LANGS=ja,de" "node tools/qa/tray-fit.js"   # 朝（4:00〜10:59）は朝食の入口が出る。入口が帯をまたがない（回帰）
add "syntax-js"        static "" "node tools/qa/check-syntax.mjs"
add "packs-check"      static "" "node tools/packs/check.mjs"
for L in $LANGS; do add "i18n-$L" static "" "node tools/i18n/extract.mjs --check $L"; done
add "steps-scale"      static "" "node tools/steps/scale-steps.test.mjs"
add "terms"            static "" "node tools/tests/terms.mjs"
add "health-claims"    static "" "node tools/tests/health-claims.mjs"   # 料理の文に健康・体への効き目の言い切りがない（全言語）
add "t-photo-dish"     static "" "node tools/tests/photo-dish.mjs"      # 写真風の絵（Gemini）の取りこみと表示（自分でサーバーを立てる。オフラインも）

match() { local name="$1" list="$2" w; [ -z "$list" ] && return 1; IFS=',' read -ra W <<<"$list"; for w in "${W[@]}"; do case "$name" in *"$w"*) return 0;; esac; done; return 1; }
SEL=()
for it in "${ITEMS[@]}"; do
  name="${it%%|*}"
  [ -n "$ONLY" ] && ! match "$name" "$ONLY" && continue
  match "$name" "$SKIP" && continue
  SEL+=("$it")
done
# 走らせる順: 時間のかかる項目を先に始める（GitHub の4並列で、最後に長い項目が1本だけ残って60分を超えないように）。
# 結果の表は SEL の順のまま。HEAVY は、手元の CI=1 の秒数（11/20 ci158。しぼり込みのあと）の長い順
HEAVY="t-safe45 t-panel-r18b qa-tray-fit t-safe46 t-diet-r3 t-r235 t-allergy t-safe48 t-tooltab-r1 t-sale t-namesearch t-perf49 t-panel-r4b t-ui32 t-resilience t-safe44 t-menu-back t-r233 t-ob39 t-panel-all1 t-safe51 t-marugoto t-tab38 t-panel-r21b t-safe-r4 t-perf48 t-r227 t-diet-r2 t-narrow-r6 t-safe43 t-safe-r5 t-safe40 t-modebtn-r1 t-ui52 t-menu-trust t-r228 t-panel-r4-ui t-ob40 qa-tray-fit-morning qa-category-audit-4343 t-narrow-r7 t-ui54 t-ui53 t-tab36 qa-category-audit t-note37 t-first-country t-tool-r1 t-panel-r22 t-stock t-greet t-marugoto-img t-hang-r1 qa-reroll"
RUN=()
for h in $HEAVY; do for it in "${SEL[@]}"; do [ "${it%%|*}" = "$h" ] && RUN+=("$it"); done; done
for it in "${SEL[@]}"; do case " $HEAVY " in *" ${it%%|*} "*) ;; *) RUN+=("$it");; esac; done
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
  echo "… $(date +%H:%M:%S) 終わり: $name（rc=$rc・$((e - s))秒）"   # 途中で止まっても（GitHub の60分の上限など）、どの項目に時間がかかったか残す
}
PIDS=()
for it in "${RUN[@]}"; do
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
  echo "=== 失敗した項目のログ（落ちた行と、末尾40行）。SEED=$SEED で再現できる ==="
  for it in "${SEL[@]}"; do
    name="${it%%|*}"; read -r rc sec <"$OUT/$name.rc" 2>/dev/null || rc=99
    [ "$rc" = 0 ] && continue
    echo "--- $name (exit $rc) : $(echo "$it" | cut -d'|' -f3) $(echo "$it" | cut -d'|' -f4)"
    # 落ちた確かめ（FAIL・NG・Error の行）を先に出す（末尾40行に入らないことがあった・run 474 の ob40）。そのあと末尾40行
    grep -nE '^(FAIL|NG)|FAIL |Error|Exception' "$OUT/$name.log" | head -n 30 | sed 's/^/[落ちた行] /' | cut -c1-600
    tail -n 40 "$OUT/$name.log"
  done
  echo "合計: 成功 $PASSED / 失敗 $FAILED   ログ: $OUT"
  exit 1
fi
echo "合計: 全 $PASSED 項目 成功   ログ: $OUT"
exit 0
