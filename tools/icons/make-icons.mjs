#!/usr/bin/env node
// アプリのアイコンと起動画面を作り直す（第21回 R78: 紺色 #22406b をやめ、アプリの色〔生成り・こげ茶・柿色〕と見出しの赤い「膳」の印に合わせた）。
// 使い方: node tools/icons/make-icons.mjs          → gohancho/ の4つと ios-app/assets/ の5つを上書き
//         node tools/icons/make-icons.mjs --out DIR → DIR に書き出す（見比べ用）
// 必要なもの: node 20 以上と playwright（テストと同じ。tools/lib/pw.cjs で探す）。有料の道具は使わない。
// 絵は下の SVG（1024 四方）だけ。Chromium で描いて画素を取り、PNG はこのファイルの中で書く（不透明な物は RGB・透明の角がある物は RGBA）。
// 「膳」の字の形は Noto Serif JP Bold（SIL Open Font License 1.1）から取り出した輪郭（字の書体が入っていない Mac・Linux でも同じ絵になる）。
import { createRequire } from 'node:module';
import { deflateSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, LAUNCH } = require('../lib/pw.cjs');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const oi = process.argv.indexOf('--out');
const OUT = oi > 0 ? path.resolve(process.argv[oi + 1]) : null;

// 色（gohancho/index.html の :root と同じ）
const C = { bg: '#fbf5ec', ink: '#3a2a1f', accent: '#b8521f', press: '#9c4418', line: '#eadccb', steam: '#d8bfa4', rice: '#fffdf8', seal: '#8f2b1f', dark: '#1d1814' };
// 「膳」（Noto Serif JP Bold・1000 単位・y は上向き）
const ZEN = 'M491 5H826V-23H491ZM488 847Q543 838 573.5 820.5Q604 803 614.5 782.0Q625 761 621.0 742.5Q617 724 602.0 712.5Q587 701 566.5 701.0Q546 701 524 718Q523 751 509.5 785.0Q496 819 479 842ZM742 850 880 816Q878 806 869.0 800.5Q860 795 843 795Q819 772 783.0 743.0Q747 714 714 692H698Q710 725 722.5 770.0Q735 815 742 850ZM455 436Q507 424 534.0 405.0Q561 386 569.5 366.0Q578 346 572.0 328.0Q566 310 551.0 300.0Q536 290 516.5 291.5Q497 293 477 311Q480 343 469.5 375.5Q459 408 445 430ZM780 436 911 405Q906 384 874 384Q854 361 822.5 333.5Q791 306 761 283H746Q755 315 764.5 358.5Q774 402 780 436ZM392 702H813L865 766Q865 766 881.0 753.5Q897 741 919.5 723.5Q942 706 961 689Q957 673 934 673H400ZM424 591H789L839 652Q839 652 854.5 640.0Q870 628 891.0 611.0Q912 594 930 578Q928 570 921.0 566.5Q914 563 903 563H432ZM393 474H818L870 538Q870 538 886.0 525.5Q902 513 925.0 495.0Q948 477 966 461Q962 445 939 445H401ZM369 288H837L889 352Q889 352 905.5 339.5Q922 327 944.5 309.0Q967 291 985 275Q981 259 959 259H377ZM603 702H714V280H603ZM437 191V237L557 191H777L829 251L931 174Q927 168 918.5 163.5Q910 159 894 156V-57Q894 -60 868.5 -70.0Q843 -80 800 -80H781V163H546V-65Q546 -70 522.0 -80.0Q498 -90 456 -90H437ZM83 784V794V828L201 784H185V488Q185 422 182.0 347.0Q179 272 166.5 195.0Q154 118 124.0 45.0Q94 -28 41 -90L29 -83Q57 2 68.0 98.5Q79 195 81.0 294.5Q83 394 83 487ZM132 784H312V756H132ZM132 553H310V524H132ZM132 314H310V286H132ZM256 784H247L293 838L393 760Q389 756 380.5 751.0Q372 746 360 743V37Q360 0 352.0 -26.5Q344 -53 317.5 -68.0Q291 -83 236 -89Q234 -64 231.0 -44.0Q228 -24 221 -13Q213 -1 199.5 7.0Q186 15 160 19V34Q160 34 170.0 33.5Q180 33 193.5 32.0Q207 31 220.0 30.5Q233 30 238 30Q249 30 252.5 34.5Q256 39 256 48Z';

// お膳の絵（1024 四方の中の座標）。湯気・柿色のご飯茶わん（生成りの線）・右下に見出しと同じ赤い「膳」の印
function art(){
    const steam = [[392, 262], [512, 228], [632, 262]].map(([x, y]) => `<path d="M${x} ${y + 150}c-30-34 30-62 0-100s30-66 0-96" fill="none" stroke="${C.steam}" stroke-width="36" stroke-linecap="round"/>`).join('');
    // 茶わん: 上の口（ご飯が少し盛り上がる）・胴（半円に近い形）・高台
    const bowl = `
      <path d="M232 492h560c0 170-118 300-280 300S232 662 232 492z" fill="${C.accent}"/>
      <ellipse cx="512" cy="492" rx="280" ry="58" fill="${C.press}"/>
      <path d="M268 488c40-74 150-104 244-104s204 30 244 104c-60 26-150 38-244 38s-184-12-244-38z" fill="${C.rice}"/>
      <path d="M262 590h500" stroke="${C.bg}" stroke-width="22" stroke-linecap="round" opacity=".92"/>
      <path d="M300 642h424" stroke="${C.bg}" stroke-width="10" stroke-linecap="round" opacity=".7"/>
      <rect x="420" y="786" width="184" height="40" rx="18" fill="${C.press}"/>`;
    // 印: 生成りの地・赤い枠と字（見出しの .seal と同じく少し傾ける）
    const seal = `<g transform="translate(770 770) rotate(-4)">
      <rect x="-150" y="-150" width="300" height="300" rx="34" fill="${C.bg}" stroke="${C.seal}" stroke-width="26"/>
      <g transform="translate(-119 89) scale(.234 -.234)"><path d="${ZEN}" fill="${C.seal}"/></g></g>`;
    return steam + bowl + seal;
}
// kind: any（角の丸い四角・外は透明）/ full（四角いっぱい。マスクで切られても大事な所が残るように絵を縮める）/ solid（地の色だけ）
function svg(kind, { scale = 1, bg = C.bg } = {}){
    const s = kind === 'full' ? scale : 1, t = (1 - s) * 512;
    const back = kind === 'any' ? `<rect width="1024" height="1024" rx="200" fill="${bg}"/>` : `<rect width="1024" height="1024" fill="${bg}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${back}${kind === 'solid' ? '' : `<g transform="translate(${t} ${t}) scale(${s})">${art()}</g>`}</svg>`;
}
// 起動画面（2732 四方）: 地の色の真ん中に、角の丸いアイコン（明るい画面は縁に薄い線）
function splash(dark){
    const n = 2732, a = 620, o = (n - a) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}"><rect width="${n}" height="${n}" fill="${dark ? C.dark : C.bg}"/>
      <g transform="translate(${o} ${o}) scale(${a / 1024})"><rect width="1024" height="1024" rx="200" fill="${C.bg}" stroke="${dark ? 'none' : C.line}" stroke-width="${dark ? 0 : 8}"/><g transform="translate(51 51) scale(.9)">${art()}</g></g></svg>`;
}

const FILES = [
    ['gohancho/icon-192.png', 192, svg('any'), true],
    ['gohancho/icon-512.png', 512, svg('any'), true],
    ['gohancho/icon-maskable-512.png', 512, svg('full', { scale: .68 }), false],   // マスク: 中心から 40% の円の中に絵（印の角も）を入れる
    ['gohancho/apple-touch-icon.png', 180, svg('full', { scale: .9 }), false],      // iPhone が角を丸めるので四角いっぱい・不透明
    ['ios-app/assets/icon-only.png', 1024, svg('full', { scale: .9 }), false],      // App Store の 1024 は透明なし
    ['ios-app/assets/icon-foreground.png', 1024, svg('full', { scale: .68 }), false],
    ['ios-app/assets/icon-background.png', 1024, svg('solid'), false],
    ['ios-app/assets/splash.png', 2732, splash(false), false],
    ['ios-app/assets/splash-dark.png', 2732, splash(true), false],
];

// PNG を書く（8bit・RGB か RGBA・フィルタなし）
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data){ const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, rgba, alpha){
    const ch = alpha ? 4 : 3, raw = Buffer.alloc((w * ch + 1) * h);
    for (let y = 0; y < h; y++){ raw[y * (w * ch + 1)] = 0; for (let x = 0; x < w; x++){ const i = (y * w + x) * 4, o = y * (w * ch + 1) + 1 + x * ch; raw[o] = rgba[i]; raw[o + 1] = rgba[i + 1]; raw[o + 2] = rgba[i + 2]; if (alpha) raw[o + 3] = rgba[i + 3]; } }
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2; ihdr[10] = ihdr[11] = ihdr[12] = 0;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const browser = await chromium.launch(LAUNCH);
const page = await browser.newPage();
await page.setContent('<!doctype html><body style="margin:0"></body>');
for (const [rel, size, src, alpha] of FILES){
    // SVG を画像として canvas に描き、画素を取る（画面の拡大率・フォントに左右されない）
    const data = await page.evaluate(async ([src, size]) => {
        const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src); await img.decode();
        const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, size, size);
        const px = g.getImageData(0, 0, size, size).data; let bin = '';
        for (let i = 0; i < px.length; i += 0x8000) bin += String.fromCharCode.apply(null, px.subarray(i, i + 0x8000));
        return btoa(bin);   // 画素を base64 で受け取る（数の配列で渡すと 2732 四方は遅い）
    }, [src, size]);
    const file = OUT ? path.join(OUT, path.basename(rel)) : path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, png(size, size, Buffer.from(data, 'base64'), alpha));
    console.log('書いた', path.relative(process.cwd(), file), size + 'px', alpha ? 'RGBA' : 'RGB');
}
await browser.close();
