// cm.html を録画して動画にする（Playwright → webm → ffmpeg で mp4）
// 使い方: node record.js [出力フォルダ] [ffmpeg のパス]
//   縦 886×1920（App Store の App プレビュー用）と 横 1920×1080（YouTube・SNS 用）を、日本語と英語で作る
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const OUT = process.argv[2] || __dirname, FFMPEG = process.argv[3] || 'ffmpeg';
const BASE = process.env.CM_URL || 'http://localhost:8766/ios-app/appstore/promo/cm.html';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  for (const lang of ['ja', 'en']) for (const [name, width, height] of [['portrait', 886, 1920], ['landscape', 1920, 1080]]) {
    const dir = fs.mkdtempSync(path.join(OUT, 'rec-'));
    const ctx = await b.newContext({ viewport: { width, height }, recordVideo: { dir, size: { width, height } } });
    const p = await ctx.newPage(); await p.goto(`${BASE}?lang=${lang}`);
    await p.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 60000 });
    const total = await p.evaluate(() => window.CM_TOTAL);
    const video = p.video(); await ctx.close();
    const webm = await video.path(), out = path.join(OUT, `cm-${lang}-${name}.mp4`);
    // 録画の先頭には読みこみ中の空白が入る。画面の下の黄色い進みぐあいの帯（幅 = 経過/全体）を12秒の時点で測り、空白の長さを求めて切る
    const probe = execFileSync(FFMPEG, ['-loglevel', 'error', '-ss', '12', '-i', webm, '-frames:v', '1', '-vf', 'crop=iw:4:0:ih-4,scale=200:1:flags=area', '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const frac = [...probe].filter(v => v > 110).length / probe.length;
    const lead = Math.max(0, 12 - frac * total / 1000);
    console.log(`${lang} ${name}: bar ${(frac * 100).toFixed(0)}% at 12s, lead ${lead.toFixed(2)}s`);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', lead.toFixed(2), '-i', webm, '-t', (total / 1000 + 0.6).toFixed(2), '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'medium', '-movflags', '+faststart', '-an', out]);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('wrote', out);
  }
  await b.close();
})();
