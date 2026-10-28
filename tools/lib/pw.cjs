// テスト共通: Playwright の場所・Chromium の場所・アプリの URL・乱数シード
//   PLAYWRIGHT_DIR  playwright の場所（既定: このリポジトリ / NODE_PATH / npm のグローバル の順に探す）
//   CHROME          Chromium の実行ファイル（既定: /opt/pw-browsers の chromium があればそれ、なければ Playwright 標準）
//   BASE            アプリの URL（run-all.sh が静的サーバーを立てて設定する。既定 http://localhost:8765/）
//   SEED            乱数のシード（整数。省略時は毎回ランダムに決めて、失敗時に表示する）
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_DIR, 'playwright', path.join(__dirname, '../../node_modules/playwright')];
  for (const t of tries) { if (!t) continue; try { return require(t); } catch (e) {} }
  return require(execSync('npm root -g').toString().trim() + '/playwright');
}
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  try {
    const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
    const d = fs.readdirSync(root).filter(x => /^chromium-\d+$/.test(x)).sort().pop();
    const p = d && path.join(root, d, 'chrome-linux/chrome');
    if (p && fs.existsSync(p)) return p;
  } catch (e) {}
  return undefined;
}
const { chromium } = loadPlaywright();
const exe = findChrome();
const LAUNCH = exe ? { executablePath: exe } : {};
const BASE = process.env.BASE || 'http://localhost:8765/';
// 乱数シード: SEED があればそれ、なければ今回限りの値。失敗時に表示するので同じ値で再現できる
const SEED = process.env.SEED != null && process.env.SEED !== '' ? (Number(process.env.SEED) >>> 0) : ((Math.random() * 2 ** 32) >>> 0);
// ページの Math.random を seed から作る決まった乱数に置き換える init script（context.addInitScript に渡す）
const seedScript = (seed) => `(() => { let a = ${seed >>> 0}; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;
// 国・件ごとのシード（SEED と国と通し番号から決まる）
const seedFor = (...parts) => { let h = SEED >>> 0; for (const c of parts.join('|')) h = Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0; return h; };
// アプリが起動して今日の献立が描かれるまで待つ（固定の待ち時間ではなく条件待ち。負荷が高くても落ちない）
async function ready(p, timeout = 30000) {
  try { await p.waitForFunction(() => typeof S !== 'undefined' && typeof session !== 'undefined' && typeof RECIPES !== 'undefined' && RECIPES.length > 0 && document.readyState === 'complete' && !!document.querySelector('#view > *'), null, { timeout }); } catch (e) {}
  await p.waitForTimeout(100);
}
module.exports = { chromium, LAUNCH, BASE, SEED, seedScript, seedFor, ready };
