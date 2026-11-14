// 各国の「あって当たり前」の家庭料理の追加分（お粥・朝食・日常のおかず）。kit.mjs の部品で描いた手描きの絵
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk } = K;

// ---- このファイル専用の部品（yg で始まる） ----
// おかゆ・粥・オートミールの面
function ygPorridge(p, { tint = '#f6f2e6', n = 70, seed = 1, R = 76, rim = '#e6dfc9', gr = true } = {}){
    const rd = rng(p.id + 'pg' + seed);
    let g = '';
    for (let i = 0; i < (gr ? n : 0); i++){
        const a = rd() * 6.28, d = Math.sqrt(rd()) * R * .92, gx = Math.cos(a) * d, gy = Math.sin(a) * d;
        const light = (gx + gy) < 0;
        g += `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="${f(2.9 + rd())}" ry="${f(1.5 + rd() * .3)}" transform="rotate(${f(rd() * 180)} ${f(gx)} ${f(gy)})" fill="${light ? lt(tint, .6) : dk(tint, .07)}" stroke="${dk(tint, .12)}" stroke-width=".4" opacity=".92"/>`;
    }
    return `<circle cx="100" cy="100" r="${R + 2}" fill="${rim}" opacity=".6"/>
        <circle cx="100" cy="100" r="${R}" fill="${p.rg(tint, .3, .16, .4, .36)}"/>
        <g ${T(100, 100)}>${g}</g>
        <path d="M${f(100 - R * .7)},${f(100 - R * .35)} A${f(R * .8)},${f(R * .8)} 0 0 1 ${f(100 - R * .2)},${f(100 - R * .76)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
function ygDots(p, cx, cy, R, { n = 20, c = '#9a2f2a', rx = 3.4, ry = 2.6, seed = 1, cols = null, sh = true } = {}){
    const rd = rng(p.id + 'dot' + seed);
    let o = '';
    for (let i = 0; i < n; i++){
        const a = rd() * 6.28, d = Math.sqrt(rd()) * R, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, col = cols ? cols[Math.floor(rd() * cols.length)] : c;
        o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx * (.85 + rd() * .3))}" ry="${f(ry * (.85 + rd() * .3))}" transform="rotate(${f(rd() * 180)} ${f(x)} ${f(y)})" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .3)}" stroke-width=".5"/>`;
    }
    return sh ? `<g ${p.sh(.5)}>${o}</g>` : o;
}
function ygFlakes(p, cx, cy, R, { n = 10, c = '#f1dcbf', seed = 1, w = 11, h = 5 } = {}){
    const rd = rng(p.id + 'fl' + seed);
    let o = '';
    for (let i = 0; i < n; i++){
        const a = rd() * 6.28, d = Math.sqrt(rd()) * R, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, ww = w * (.7 + rd() * .6), hh = h * (.7 + rd() * .6);
        o += `<g ${T(x, y, rd() * 180)}><path d="M${f(-ww / 2)},0 Q${f(-ww / 4)},${f(-hh)} ${f(ww / 2)},${f(-hh / 3)} Q${f(ww / 3)},${f(hh)} ${f(-ww / 3)},${f(hh * .7)}Z" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".5"/></g>`;
    }
    return `<g ${p.sh(.5)}>${o}</g>`;
}
const steam = () => `<path d="M88,34 c-5,-7 5,-12 0,-19 M104,32 c-5,-7 5,-12 0,-19 M120,34 c-5,-7 5,-12 0,-19" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;
// 角の丸い板状のもの（トースト・チーズ・パンケーキの断面など）
function ygSlab(p, x, y, w, h, r, c, { rx = 6, stroke = null, sh = .6 } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(sh)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${rx}" fill="${p.g(c, .3, .22)}" stroke="${stroke || dk(c, .3)}" stroke-width=".7"/></g></g>`;
}
// 円盤（パンケーキ・トルティーヤ・パラーター・バンズ）
function ygDisc(p, x, y, R, c, { sy = 1, spots = 0, seed = 1, edge = null } = {}){
    const rd = rng(p.id + 'dc' + seed + x);
    let s = '';
    for (let i = 0; i < spots; i++){ const a = rd() * 6.28, d = Math.sqrt(rd()) * R * .8; s += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d * sy)}" rx="${f(R * (.08 + rd() * .1))}" ry="${f(R * (.06 + rd() * .08) * sy)}" fill="${dk(c, .35)}" opacity=".55"/>`; }
    return `<g ${T(x, y)}><g ${p.sh(.8)}><ellipse rx="${R}" ry="${f(R * sy)}" fill="${p.rg(c, .28, .2)}" stroke="${edge || dk(c, .3)}" stroke-width=".8"/></g>${s}<path d="M${f(-R * .6)},${f(-R * .3 * sy)} A${f(R * .7)},${f(R * .7 * sy)} 0 0 1 ${f(-R * .15)},${f(-R * .62 * sy)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 串（竹串）
const skewer = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c9a56b" stroke-width="2.2" stroke-linecap="round"/>`;
// 汁だまり・ソースのくぼみ
const sauce = (p, x, y, s, c, seed = 1) => K.pool(p, x, y, s, c, { seed, op: .96 });

export default {
    // ---------- 韓国 ----------
    // 鶏粥: ほぐした鶏、にんじん・エホバクの粒、ねぎ、ごま油の照り
    kr_dakjuk: p => [
        K.bowl(p, { glaze: '#8a6a50', inside: '#efe5d3' }),
        ygPorridge(p, { tint: '#f6efd8', n: 70, seed: 11 }),
        K.shreds(p, 100, 100, 100, { c: '#f1dcbf', n: 22, w: 3, len: .45, seed: 3, curve: .5 }),
        ygDots(p, 100, 100, 54, { n: 12, cols: ['#ec7b2d', '#8fc065'], rx: 2.8, ry: 2.4, seed: 4 }),
        K.scallions(p, 100, 100, 96, { n: 18, c: '#4f9a34' }),
        K.sesame(p, 100, 100, 80, { n: 12, seed: 2 }),
        steam(),
    ].join(''),
    // 牛肉と野菜のお粥: 細かい牛肉、野菜の粒、ごま油
    kr_soegogiyachaejuk: p => [
        K.bowl(p, { glaze: '#8a6a50', inside: '#efe5d3' }),
        ygPorridge(p, { tint: '#efe0c4', n: 60, seed: 12 }),
        ygDots(p, 100, 100, 58, { n: 18, cols: ['#8a5238', '#7b4a2c'], rx: 3, ry: 2.4, seed: 5 }),
        ygDots(p, 100, 100, 58, { n: 20, cols: ['#ec7b2d', '#8fc065', '#6b4a38'], rx: 2.8, ry: 2.4, seed: 6 }),
        K.sesame(p, 100, 100, 80, { n: 10, seed: 3 }),
        steam(),
    ].join(''),
    // トッポッキ: 赤いたれ、棒状の餅、さつま揚げ、ゆで卵、ねぎ
    kr_tteokbokki: p => [
        K.plate(p, { rim: '#9a3a2a' }),
        K.liquid(p, { R: 66, c: '#c23a1c' }),
        ...[[70, 82, 20], [92, 70, -10], [118, 78, 40], [132, 100, 80], [74, 108, 70], [100, 98, 10], [122, 124, 30], [92, 126, 60], [66, 130, 0], [110, 112, 100]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="-12" y="-4.6" width="24" height="9.2" rx="4.6" fill="${p.g('#f6e6cc', .35, .22)}" stroke="#c9a77a" stroke-width=".6"/></g><path d="M-8,-1.8 L8,-1.8" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`),
        ...[[84, 94, 20], [112, 90, -40], [100, 118, 60]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M-11,6 L11,6 L0,-9 Z" fill="${p.g('#d8a85c', .3, .25)}" stroke="#a87a38" stroke-width=".6"/></g></g>`),
        K.eggHalf(p, 124, 112, 26, 20), K.eggHalf(p, 78, 118, 24, -30),
        K.scallions(p, 100, 100, 100, { n: 12, c: '#4f9a34' }),
    ].join(''),
    // 韓国かぼちゃの炒めもの: 半月切り、ねぎ、ごま
    kr_aehobakbokkeum: p => [
        K.kobachi(p),
        ...Array.from({ length: 22 }, (_, i) => { const a = i * 2.4, d = 14 + (i % 7) * 7.5; return `<g ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d * .85, (i * 47) % 180)}><g ${p.sh(.4)}><path d="M-9,0 A9,9 0 0 1 9,0Z" fill="${p.g('#a5cf6a', .35, .22)}" stroke="#5f8f33" stroke-width=".6"/><path d="M-9,0 L9,0" stroke="#e8f2c4" stroke-width="1.6"/></g></g>`; }),
        K.shreds(p, 100, 100, 80, { c: '#f1e6c0', n: 8, w: 1.4, len: .5, seed: 2, curve: .4 }),
        K.sesame(p, 100, 100, 80, { n: 14, seed: 4 }),
    ].join(''),
    // 目玉焼き: 2つ、しょうゆとごま油、ねぎ
    kr_gyeranfry: p => [
        K.plate(p),
        K.friedEgg(p, 80, 96, 66, 10), K.friedEgg(p, 124, 108, 62, -20),
        `<path d="M70,90 q6,-4 12,2 M118,102 q6,-4 12,2" stroke="#4a2a14" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>`,
        K.scallions(p, 100, 100, 110, { n: 10, c: '#4f9a34' }), K.sesame(p, 100, 100, 100, { n: 12, seed: 3 }),
    ].join(''),

    // ---------- 中国 ----------
    // 白粥: 器に白いお粥だけ、ザーサイを少し
    cn_baizhou: p => [
        K.chawan(p),
        ygPorridge(p, { n: 100, seed: 21 }),
        K.shreds(p, 128, 118, 28, { c: '#b7a45a', n: 6, w: 2, len: .5, seed: 2, curve: .3 }),
        steam(),
    ].join(''),
    // ピータン瘦肉粥: ピータンの角切り（飴色）、ほぐした豚肉、ねぎ、しょうが
    cn_pidan_shourou_zhou: p => [
        K.chawan(p),
        ygPorridge(p, { tint: '#f1ead6', n: 60, seed: 22 }),
        ...[[78, 86], [112, 80], [96, 112], [126, 108], [76, 120]].map(([x, y], i) => `<g ${T(x, y, i * 31)}><g ${p.sh(.5)}><rect x="-6" y="-5" width="12" height="10" rx="2.5" fill="${p.g('#4b3a22', .3, .15)}" stroke="#2b2010" stroke-width=".6"/></g><rect x="-3" y="-2.5" width="6" height="5" rx="2" fill="#d79b3c" opacity=".8"/></g>`),
        K.shreds(p, 100, 100, 90, { c: '#e9c9a4', n: 16, w: 2.6, len: .4, seed: 3, curve: .5 }),
        K.gingerShreds(p, 100, 100, 70),
        K.scallions(p, 100, 100, 100, { n: 18, c: '#4f9a34' }),
        steam(),
    ].join(''),
    // 回鍋肉: 反った豚バラ薄切り、青ピーマン、赤い油
    cn_huiguo_rou: p => [
        K.plate(p, { rim: '#9a3a2a' }),
        sauce(p, 100, 104, 120, '#c4472a', 3),
        ...[[70, 84, 20], [100, 76, -15], [128, 90, 35], [82, 116, 60], [118, 122, -20], [102, 102, 80], [68, 108, 10], [134, 114, 70]].map(([x, y, r], i) => K.porkSlice(p, x, y, 38, r, { c: '#a8582c', seed: i + 1, bend: .012 })),
        ...[[88, 96, 20], [112, 100, -30], [96, 130, 10], [128, 134, 50], [74, 94, 0]].map(([x, y, r], i) => K.pepperPiece(p, x, y, 26, r, { c: '#3f8f2f' })),
        K.negiPiece(p, 110, 118, 20, 30), K.negiPiece(p, 84, 134, 18, -30),
    ].join(''),
    // 魚香茄子: とろりと光るたれ、なすの棒切り、ひき肉、ねぎ
    cn_yuxiang_qiezi: p => [
        K.ovalDish(p, { rx: 94, ry: 76, rim: '#9a3a2a' }),
        sauce(p, 100, 100, 130, '#8e2f1d', 5),
        ...Array.from({ length: 13 }, (_, i) => { const a = i * 0.9, d = 14 + (i % 5) * 14; return K.eggplant(p, 100 + Math.cos(a) * d, 100 + Math.sin(a) * d * .75, 32, (i * 53) % 180); }),
        K.mince(p, 100, 100, 100, { c: '#5a3018', n: 26, seed: 4 }),
        K.scallions(p, 100, 100, 100, { n: 14, c: '#4f9a34' }),
    ].join(''),
    // トマトと卵の麺: 赤いスープ、麺、ふんわり卵、トマト、ねぎ
    cn_fanqie_jidan_mian: p => [
        K.donburi(p),
        K.liquid(p, { R: 66, c: '#d9532b' }),
        K.noodles(p, 100, 104, 100, { c: '#f2dc9a', w: 2.6, n: 22, seed: 4, sy: .8 }),
        K.scrambled(p, 90, 86, 78, { n: 7, seed: 2 }), K.scrambled(p, 118, 112, 60, { n: 5, seed: 6 }),
        K.tomatoWedge(p, 76, 118, 26, 20), K.tomatoWedge(p, 124, 80, 24, -40),
        K.scallions(p, 100, 100, 90, { n: 14, c: '#4f9a34' }),
        steam(),
    ].join(''),

    // ---------- 台湾 ----------
    // 地瓜粥: 黄色いさつまいもの角切り
    tw_digua_zhou: p => [
        K.chawan(p),
        ygPorridge(p, { tint: '#f7ecc8', n: 70, seed: 31 }),
        ...[[78, 86, 20], [118, 82, -30], [96, 114, 70], [126, 118, 10], [72, 122, -40], [104, 74, 50], [138, 98, 80]].map(([x, y, r]) => K.sweetPotato(p, x, y, 30, r)),
        steam(),
    ].join(''),
    // 鹹粥: しいたけ、豚肉、干しえび、揚げ赤玉ねぎ、ねぎ
    tw_xian_zhou: p => [
        K.chawan(p),
        ygPorridge(p, { tint: '#f0e2c4', n: 60, seed: 32 }),
        K.shiitake(p, 80, 90, 26, 20, {}), K.shiitake(p, 122, 84, 24, 60, {}), K.shiitake(p, 106, 122, 24, -20, {}),
        ygFlakes(p, 100, 100, 50, { n: 10, c: '#e8c6a0', seed: 2, w: 12, h: 5 }),
        ygDots(p, 100, 100, 56, { n: 14, c: '#e87a52', rx: 2.6, ry: 2, seed: 3 }),
        ygDots(p, 100, 100, 60, { n: 22, c: '#b5772d', rx: 2.2, ry: 1.6, seed: 4 }),
        K.scallions(p, 100, 100, 90, { n: 14, c: '#4f9a34' }),
        steam(),
    ].join(''),
    // 蔥花蛋: 青ねぎ入りの厚いオムレツを三角に切って
    tw_conghua_dan: p => [
        K.plate(p),
        ...[[68, 74, 0], [132, 74, 180], [68, 128, 180], [132, 128, 0]].map(([x, y, r]) => `<g ${T(x, y, r, 1)}><g ${p.sh(.7)}><path d="M-26,22 L26,22 Q30,22 26,16 L6,-24 Q0,-30 -6,-24 L-26,16 Q-30,22 -26,22Z" fill="${p.g('#f6cf52', .35, .18)}" stroke="#c99a22" stroke-width=".7"/></g><path d="M-18,14 L0,-18 L18,14" fill="none" stroke="#e8a92a" stroke-width="2" opacity=".5"/></g>`),
        K.sprinkle(p, 100, 100, 110, { c: '#3f8f2f', n: 40, r: 1.5 }),
    ].join(''),
    // 蛋餅: 巻いた卵クレープを切り分けて、たれ
    tw_dan_bing: p => [
        K.longPlate(p, { w: 184, h: 122 }),
        ...[0, 1, 2, 3].map(i => `<g ${T(48 + i * 34 + (i % 2) * 2, 100 + (i % 2 ? 5 : -5), 90)}><g ${p.sh(.7)}><rect x="-26" y="-14" width="52" height="28" rx="14" fill="${p.g('#f2dfae', .3, .2)}" stroke="#c9a458" stroke-width=".7"/></g><ellipse cx="0" cy="0" rx="16" ry="8" fill="#f8d46a"/><path d="M-12,-1 q4,-5 8,0 q4,5 8,0" stroke="#e0a82a" stroke-width="1.6" fill="none"/><circle cx="-6" cy="-3" r="1.6" fill="#4f9a34"/><circle cx="5" cy="3" r="1.6" fill="#4f9a34"/></g>`),
        K.pool(p, 158, 130, 24, '#5a2a16', { seed: 2 }),
        K.scallions(p, 100, 100, 70, { n: 6, c: '#4f9a34' }),
    ].join(''),

    // ---------- タイ ----------
    // ジョーク: 肉団子、しょうが、卵、ねぎ、パクチー
    th_jokmoo: p => [
        K.bowl(p, { glaze: '#d9d2bf', inside: '#f1ead6' }),
        ygPorridge(p, { tint: '#f1ebd8', n: 30, seed: 41, gr: false }),
        K.meatball(p, 82, 92, 22, { c: '#c9906a', glossy: false }), K.meatball(p, 118, 88, 22, { c: '#c9906a', glossy: false }), K.meatball(p, 100, 120, 22, { c: '#c9906a', glossy: false }),
        K.gingerShreds(p, 100, 100, 80),
        K.eggHalf(p, 124, 118, 22, 20, {}),
        K.scallions(p, 100, 100, 100, { n: 18, c: '#4f9a34' }),
        K.greens(p, 78, 120, 28, { n: 5, seed: 3, c: '#3d8a2c' }),
        K.sprinkle(p, 100, 100, 100, { c: '#2a2118', n: 12, r: .8 }),
        steam(),
    ].join(''),
    // ムーピン: 竹串の焼き豚、もち米
    th_mooping: p => [
        K.longPlate(p, { w: 188, h: 124 }),
        ...[0, 1, 2].map(i => `${skewer(26, 62 + i * 22, 170, 62 + i * 22 + (i - 1) * 3)}${[0, 1, 2, 3].map(k => K.porkSlice(p, 60 + k * 22, 62 + i * 22 + (i - 1) * 1.5, 26, 8 * (k % 2 ? -1 : 1), { c: '#a8582c', seed: i * 4 + k, bend: .01 })).join('')}`),
        K.rice(p, 154, 132, 30, { sy: .8 }),
    ].join(''),
    // 甘酢炒め: トマト、パイナップル、きゅうり、玉ねぎ、肉
    th_padpriewan: p => [
        K.plate(p),
        sauce(p, 100, 102, 112, '#d4572d', 2),
        ...[[72, 90], [98, 76], [126, 94], [84, 122], [112, 124]].map(([x, y], i) => K.porkSlice(p, x, y, 28, i * 40, { c: '#c68a4c', seed: i, char: false })),
        K.tomatoWedge(p, 108, 100, 26, 20), K.tomatoWedge(p, 78, 106, 24, -50), K.tomatoWedge(p, 130, 118, 24, 80),
        ...[[92, 98], [120, 82], [70, 122], [118, 134]].map(([x, y], i) => `<g ${T(x, y, i * 50)}><g ${p.sh(.5)}><path d="M-9,5 L9,5 L9,-5 Q0,-9 -9,-5Z" fill="${p.g('#f2cf4a', .35, .22)}" stroke="#bf9a20" stroke-width=".6"/></g></g>`),
        K.cucumberSlice(p, 96, 126, 20, 0), K.cucumberSlice(p, 66, 100, 18, 0), K.cucumberSlice(p, 134, 104, 18, 0),
        K.onion(p, 112, 76, 20, 20), K.onion(p, 86, 140, 20, -20),
        K.scallions(p, 100, 100, 100, { n: 8, c: '#4f9a34' }),
    ].join(''),

    // ---------- アメリカ ----------
    // オートミール: クリーム色の面、バナナ、くるみ、シロップ
    us_oatmeal: p => [
        K.bowl(p, { glaze: '#8aa6b8', inside: '#eef2f4' }),
        ygPorridge(p, { tint: '#e9d9b8', n: 40, seed: 51, gr: false }),
        ygDots(p, 100, 100, 62, { n: 70, cols: ['#d8c08c', '#e6d3a4', '#cdb27a'], rx: 3.4, ry: 1.8, seed: 7, sh: false }),
        ...[[84, 82], [112, 78], [126, 100], [112, 124], [84, 120], [70, 100], [98, 100]].map(([x, y], i) => `<g ${T(x, y, i * 30)}><g ${p.sh(.5)}><ellipse rx="10" ry="9" fill="${p.rg('#f6e08a', .3, .2)}" stroke="#c9a840" stroke-width=".7"/></g><circle r="2.4" fill="#8a6a2a" opacity=".6"/></g>`),
        ygDots(p, 100, 100, 50, { n: 6, c: '#8a5a30', rx: 4.4, ry: 3.6, seed: 8 }),
        `<path d="M70,96 q12,-10 26,2 t26,-2" stroke="#b87a22" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
        steam(),
    ].join(''),
    // グリルドチーズ: 焼き色のパン2つ、チーズがはみ出る
    us_grilledcheese: p => [
        K.plate(p),
        `<g ${T(84, 110, -12)}><g ${p.sh(.9)}><path d="M-42,-30 L42,30 L-42,30Z" fill="${p.g('#d6a04a', .3, .25)}" stroke="#a87226" stroke-width=".8"/></g><path d="M-36,-18 L30,22 L-36,22Z" fill="${p.g('#e9b95e', .3, .2)}"/></g>`,
        `<g ${T(118, 82, 16)}><g ${p.sh(.9)}><path d="M-40,-28 L40,28 L-40,28Z" fill="${p.g('#d6a04a', .3, .25)}" stroke="#a87226" stroke-width=".8"/></g><path d="M-30,10 L34,24 L-30,24Z" fill="#f6c94a" stroke="#d9a62a" stroke-width="1"/><path d="M-28,22 q10,8 22,2 t24,0" fill="#f6c94a" stroke="#d9a62a" stroke-width="1"/></g>`,
    ].join(''),
    // パンケーキ: 3枚重ね、バター、シロップ
    us_pancakes: p => [
        K.plate(p),
        ygDisc(p, 100, 120, 54, '#d9a458', { sy: .5, seed: 1 }), ygDisc(p, 100, 108, 52, '#e3b268', { sy: .5, seed: 2 }), ygDisc(p, 100, 96, 50, '#e8bc74', { sy: .5, spots: 4, seed: 3 }),
        `<path d="M62,98 q6,16 14,6 q8,14 16,2 q10,16 20,4 q8,12 16,0 q8,10 14,-4" fill="#a3591a" opacity=".85"/>`,
        `<g ${T(100, 84)}><g ${p.sh(.5)}><rect x="-9" y="-6" width="18" height="12" rx="2" fill="${p.g('#fbe58a', .4, .18)}" stroke="#d9b64a" stroke-width=".6"/></g></g>`,
    ].join(''),
    // スクランブルエッグ・ベーコン・トースト
    us_scrambledbacon: p => [
        K.plate(p),
        K.scrambled(p, 82, 92, 84, { n: 8, seed: 1 }), K.scrambled(p, 98, 108, 56, { n: 5, seed: 4 }),
        K.bacon(p, 128, 76, 54, 12, 20), K.bacon(p, 134, 96, 54, 12, 14), K.bacon(p, 128, 116, 52, 12, 25),
        ygSlab(p, 90, 142, 46, 24, 8, '#d9a458', { rx: 8 }),
        K.sprinkle(p, 84, 92, 60, { c: '#3f8f2f', n: 8, r: 1.2 }),
    ].join(''),
    // スロッピージョー: バンズ、ひき肉ソース
    us_sloppyjoes: p => [
        K.plate(p),
        ygDisc(p, 100, 116, 56, '#e9b75a', { sy: .45, seed: 1 }),
        `<path d="M54,108 Q100,76 146,108 Q150,124 100,128 Q50,124 54,108Z" fill="${p.rg('#9e3a1c', .25, .3)}"/>`,
        K.mince(p, 100, 102, 76, { c: '#7a2e14', n: 36, seed: 3 }),
        `<path d="M58,92 Q100,44 142,92 Q140,100 100,98 Q60,100 58,92Z" fill="${p.g('#e6ad4c', .35, .2)}" stroke="#b87c2a" stroke-width=".8"/>`,
        K.sesame(p, 100, 80, 40, { n: 12, seed: 5 }),
        K.pool(p, 148, 140, 18, '#9e3a1c', { seed: 3 }),
    ].join(''),

    // ---------- インド ----------
    // ポーハー: 黄色いフレーク、ピーナッツ、青唐辛子、パクチー、レモン
    in_poha: p => [
        K.plate(p, { rim: '#c9892a' }),
        `<circle cx="100" cy="100" r="62" fill="${p.rg('#f4d34e', .25, .2)}"/>`,
        ygDots(p, 100, 100, 58, { n: 90, cols: ['#f6dc66', '#e8c038', '#fbe88a'], rx: 4.6, ry: 2, seed: 9, sh: false }),
        ygDots(p, 100, 100, 54, { n: 14, c: '#c98a4a', rx: 3.2, ry: 2.8, seed: 10 }),
        K.onion(p, 80, 84, 14, 20), K.onion(p, 124, 112, 14, 40),
        K.shreds(p, 100, 100, 70, { c: '#4a9a34', n: 5, w: 2.4, len: .35, seed: 4 }),
        K.lemon(p, 148, 146, 26, 20), K.greens(p, 100, 100, 70, { n: 5, seed: 6, c: '#3d8a2c' }),
        steam(),
    ].join(''),
    // ウプマ: ほろほろのセモリナ、にんじん、グリーンピース、カシュー、カレーリーフ
    in_upma: p => [
        K.bowl(p, { glaze: '#c2813a', inside: '#f2e6c8' }),
        `<circle cx="100" cy="100" r="68" fill="${p.rg('#ebd6a0', .3, .2)}"/>`,
        ygDots(p, 100, 100, 62, { n: 90, cols: ['#f1dfae', '#e0c88a', '#f6e8c0'], rx: 2.4, ry: 1.8, seed: 11, sh: false }),
        ygDots(p, 100, 100, 58, { n: 14, c: '#ec7b2d', rx: 3.2, ry: 2.8, seed: 12 }),
        ygDots(p, 100, 100, 58, { n: 14, c: '#6bb04a', rx: 2.6, ry: 2.6, seed: 13 }),
        ygDots(p, 100, 100, 50, { n: 6, c: '#d8a85c', rx: 4, ry: 3, seed: 14 }),
        K.greens(p, 100, 100, 70, { n: 4, seed: 7, c: '#2f7a2a' }),
        steam(),
    ].join(''),
    // カード・ライス: 白いヨーグルトご飯、マスタードシードのテンパリング、赤いざくろ
    in_curdrice: p => [
        K.bowl(p, { glaze: '#d9d2bf', inside: '#f6f2e6' }),
        ygPorridge(p, { tint: '#fbf8ee', n: 80, seed: 61, R: 70 }),
        ygDots(p, 100, 100, 50, { n: 40, c: '#3b2a1a', rx: 1.4, ry: 1.4, seed: 15, sh: false }),
        ygDots(p, 100, 100, 54, { n: 12, c: '#b0243a', rx: 2.6, ry: 2.6, seed: 16 }),
        K.cucumberSlice(p, 80, 88, 14), K.cucumberSlice(p, 122, 112, 14),
        K.greens(p, 100, 100, 70, { n: 5, seed: 8, c: '#3d8a2c' }), K.shreds(p, 100, 100, 60, { c: '#4a9a34', n: 3, w: 2.2, len: .4, seed: 5 }),
    ].join(''),
    // アールー・パラーター: 焼き色のついた丸い生地2枚、ヨーグルト、バター
    in_alooparatha: p => [
        K.plate(p, { rim: '#c9892a' }),
        ygDisc(p, 92, 112, 50, '#d9a458', { sy: .85, spots: 10, seed: 1 }),
        ygDisc(p, 104, 90, 52, '#e2b068', { sy: .85, spots: 12, seed: 2 }),
        `<g ${T(104, 88)}><g ${p.sh(.5)}><rect x="-8" y="-5" width="16" height="10" rx="2" fill="${p.g('#fbe58a', .4, .18)}" stroke="#d9b64a" stroke-width=".6"/></g></g>`,
        `<g ${T(152, 146)}><circle r="22" fill="${p.rg('#d9d2bf', .2, .2)}"/><circle r="17" fill="${p.rg('#fdfbf4', .1, .15)}"/><circle cx="-3" cy="-3" r="6" fill="#fff" opacity=".6"/></g>`,
    ].join(''),

    // ---------- イギリス ----------
    // ポリッジ: クリーム色、はちみつ、りんごの薄切り
    gb_porridge: p => [
        K.bowl(p, { glaze: '#6f8aa6', inside: '#eef2f4' }),
        ygPorridge(p, { tint: '#efe3c8', n: 30, seed: 71, gr: false }),
        ygDots(p, 100, 100, 62, { n: 60, cols: ['#e0cfa4', '#d4bf8c'], rx: 3, ry: 1.8, seed: 17, sh: false }),
        ...[0, 1, 2, 3, 4, 5].map(i => { const a = i * 1.05 + .3; return `<g ${T(100 + Math.cos(a) * 34, 100 + Math.sin(a) * 34, a * 57.3)}><g ${p.sh(.5)}><path d="M-10,4 A12,12 0 0 1 10,4 Z" fill="${p.g('#f2e6a4', .3, .2)}" stroke="#c0a850" stroke-width=".6"/><path d="M-10,4 A12,12 0 0 1 -6,-3" stroke="#d6483a" stroke-width="1.6" fill="none"/></g></g>`; }),
        `<path d="M72,96 q10,-12 24,0 t24,2 t14,-8" stroke="#c98a1c" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
        steam(),
    ].join(''),
    // ビーンズ・オン・トースト: 厚いトースト、トマトソースの豆、チーズ
    gb_beansontoast: p => [
        K.plate(p),
        ygSlab(p, 100, 100, 116, 92, 0, '#d9a458', { rx: 10 }),
        `<rect x="48" y="58" width="104" height="80" rx="8" fill="${p.g('#e8bf78', .3, .15)}"/>`,
        `<path d="M54,70 Q100,52 148,70 Q158,100 146,132 Q100,146 56,132 Q44,100 54,70Z" fill="${p.rg('#c24a1c', .25, .25)}"/>`,
        ...Array.from({ length: 26 }, (_, i) => { const a = i * 2.39, d = 10 + (i % 6) * 9; return `<g ${T(100 + Math.cos(a) * d * 1.05, 100 + Math.sin(a) * d * .7, (i * 41) % 180)}><g ${p.sh(.3)}><ellipse rx="5.6" ry="3.6" fill="${p.g('#f6e6c4', .3, .22)}" stroke="#c9a77a" stroke-width=".5"/></g></g>`; }),
        K.cheese(p, 100, 100, 70, { seed: 2, browned: .6 }),
    ].join(''),

    // ---------- メキシコ ----------
    // ケサディーヤ: 半月に折った焼きたてトルティーヤ、とろけたチーズ、サルサ
    mx_quesadillas: p => [
        K.plate(p),
        `<g ${T(90, 112, -10)}><g ${p.sh(.9)}><path d="M-52,18 A52,52 0 0 1 52,18 Z" fill="${p.rg('#e8c27a', .3, .2)}" stroke="#b88a3a" stroke-width=".8"/></g>${[[-30, 4], [-6, -14], [20, -6], [34, 8], [-14, 10], [8, 6]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${6 + i % 3}" ry="${3 + i % 2}" fill="#b8742a" opacity=".45"/>`).join('')}<path d="M-46,16 q10,-8 20,2 t22,-2 t22,2" stroke="#f6c94a" stroke-width="4" fill="none" stroke-linecap="round"/></g>`,
        `<g ${T(116, 80, 150)}><g ${p.sh(.7)}><path d="M-44,14 A44,44 0 0 1 44,14 Z" fill="${p.rg('#e8c27a', .3, .2)}" stroke="#b88a3a" stroke-width=".8"/></g><path d="M-38,12 q10,-6 18,2 t20,-2 t18,2" stroke="#f6c94a" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>`,
        K.pool(p, 150, 142, 26, '#c23a1c', { seed: 2 }),
        K.greens(p, 150, 142, 16, { n: 3, seed: 2, c: '#3d8a2c' }),
    ].join(''),
    // フリホーレス・デ・ラ・オージャ: 土鍋風の深い鉢に豆とスープ、玉ねぎ、パクチー、ライム
    mx_frijoles_olla: p => [
        K.bowl(p, { glaze: '#a9582f', inside: '#e9d6b4' }),
        K.liquid(p, { R: 66, c: '#5a3a24' }),
        ...Array.from({ length: 36 }, (_, i) => { const a = i * 2.39, d = Math.sqrt(i / 36) * 56; return `<g ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, (i * 41) % 180)}><g ${p.sh(.3)}><ellipse rx="6.6" ry="4.4" fill="${p.g('#7a4a2c', .3, .25)}" stroke="#3c2210" stroke-width=".5"/></g><path d="M-3,-1 L3,-1" stroke="#c9a77a" stroke-width=".8" opacity=".6"/></g>`; }),
        K.onion(p, 82, 84, 14, 30), K.greens(p, 118, 84, 24, { n: 4, seed: 4, c: '#3d8a2c' }),
        K.lemon(p, 140, 134, 26, 40, { c: '#8ec04a', rind: '#5f9a2a' }),
        steam(),
    ].join(''),

    // ---------- フランス ----------
    // ステーク・アシェ: 焼き色のついた肉2枚、バター、サラダ
    fr_steakhache: p => [
        K.plate(p),
        K.patty(p, 82, 94, 62, 46, -8, { c: '#6b3b1f' }), K.patty(p, 120, 112, 58, 44, 10, { c: '#6b3b1f' }),
        `<g ${T(120, 108)}><g ${p.sh(.4)}><rect x="-8" y="-5" width="16" height="10" rx="2" fill="${p.g('#fbe58a', .4, .18)}" stroke="#d9b64a" stroke-width=".6"/></g></g>`,
        K.greens(p, 62, 134, 36, { n: 5, seed: 2, c: '#4a9a34' }), K.shreds(p, 70, 144, 30, { c: '#f1e6c0', n: 4, w: 1.4, len: .4, seed: 3 }),
        K.parsley(p, 100, 142, 14),
    ].join(''),
    // ポトフ: 牛肉の塊、にんじん、ポワロ、かぶ、じゃがいも、スープ
    fr_potaufeu: p => [
        K.donburi(p),
        K.liquid(p, { R: 68, c: '#d9a458' }),
        K.beefSlice(p, 92, 84, 52, 10), K.beefSlice(p, 112, 100, 48, -14),
        K.carrotChunk(p, 70, 112, 26, 30), K.carrotChunk(p, 128, 70, 24, 70),
        K.potato(p, 76, 84, 24, 10), K.potato(p, 132, 116, 26, -20),
        K.daikon(p, 100, 130, 22, 0, { c: '#f4efe0' }), K.daikon(p, 66, 138, 18, 0, { c: '#f4efe0' }),
        K.negiPiece(p, 118, 138, 26, 20), K.negiPiece(p, 84, 62, 24, -20),
        K.parsley(p, 104, 62, 12),
        steam(),
    ].join(''),

    // ---------- イタリア ----------
    // アーリオ・オーリオ: スパゲッティ、にんにく薄切り、唐辛子、パセリ、オイルの光
    it_aglioolio: p => [
        K.plate(p),
        K.noodles(p, 100, 100, 112, { c: '#f2d890', w: 2.6, n: 30, seed: 3, sy: .85 }),
        `<ellipse cx="100" cy="100" rx="50" ry="42" fill="#f3cf5a" opacity=".16"/>`,
        ygDots(p, 100, 100, 50, { n: 12, c: '#f0e2a8', rx: 4.4, ry: 2.6, seed: 18 }),
        ygDots(p, 100, 100, 54, { n: 8, c: '#c42a1c', rx: 3, ry: 1.4, seed: 19 }),
        K.sprinkle(p, 100, 100, 100, { c: '#3d8a2c', n: 40, r: 1.2 }),
    ].join(''),
    // カーチョ・エ・ペペ: 白っぽいクリームのパスタに黒こしょう、ペコリーノ
    it_cacioepepe: p => [
        K.plate(p),
        K.noodles(p, 100, 100, 112, { c: '#f6e8b8', w: 2.8, n: 30, seed: 5, sy: .85 }),
        `<ellipse cx="100" cy="104" rx="52" ry="40" fill="#fff6d8" opacity=".35"/>`,
        K.sprinkle(p, 100, 100, 100, { c: '#2a2118', n: 70, r: 1.1 }),
        K.sprinkle(p, 100, 96, 70, { c: '#fbf1cc', n: 20, r: 1.4 }),
    ].join(''),

    // ---------- ドイツ ----------
    // アーベントブロート: ライ麦パン、ハム、チーズ、トマト、きゅうり、ラディッシュ、ガーキン
    de_abendbrot: p => [
        K.longPlate(p, { w: 188, h: 130 }),
        ygSlab(p, 50, 64, 44, 32, -8, '#8a5a30', { rx: 8 }), ygSlab(p, 54, 98, 44, 32, 6, '#8a5a30', { rx: 8 }),
        K.ham(p, 100, 64, 40, 26, -6), K.ham(p, 106, 74, 40, 26, 6),
        ygSlab(p, 100, 104, 38, 30, 4, '#f2c84a', { rx: 3 }), ygSlab(p, 108, 116, 38, 30, -6, '#f2c84a', { rx: 3 }),
        K.tomatoWedge(p, 148, 62, 28, 20), K.tomatoWedge(p, 164, 80, 26, -40),
        K.cucumberSlice(p, 150, 108, 22), K.cucumberSlice(p, 168, 116, 22), K.cucumberSlice(p, 154, 130, 22),
        `<g ${T(60, 138, 20)}><g ${p.sh(.4)}><rect x="-14" y="-5" width="28" height="10" rx="5" fill="${p.g('#7a9a3a', .3, .25)}" stroke="#4a6a20" stroke-width=".6"/></g></g>`,
        `<g ${T(96, 140)}><g ${p.sh(.4)}><circle r="6" fill="${p.g('#d63a52', .3, .25)}"/><path d="M0,-6 L0,-9" stroke="#3d8a2c" stroke-width="1.4"/></g></g>`,
        K.sprinkle(p, 108, 110, 40, { c: '#3d8a2c', n: 10, r: 1 }),
    ].join(''),
    // ドイツ風クレープ: 巻いてアプフェルムースとシナモンシュガー
    de_pfannkuchen: p => [
        K.plate(p),
        ...[0, 1].map(i => `<g ${T(100 + (i ? 6 : -4), 84 + i * 36, i ? -4 : 3)}><g ${p.sh(.8)}><rect x="-52" y="-15" width="104" height="30" rx="15" fill="${p.g('#e9c27a', .3, .22)}" stroke="#b88a3a" stroke-width=".8"/></g><path d="M-44,-4 Q-20,-9 0,-4 T44,-4" stroke="#c98a3a" stroke-width="1.6" fill="none" opacity=".6"/><ellipse cx="52" cy="0" rx="4" ry="12" fill="#f4d9a0" stroke="#b88a3a" stroke-width=".6"/></g>`),
        K.sprinkle(p, 100, 100, 100, { c: '#a8631f', n: 40, r: 1.3 }),
        K.pool(p, 150, 140, 28, '#d9c47a', { seed: 3 }),
    ].join(''),

    // ---------- スペイン ----------
    // ガンバス・アル・アヒージョ: 土鍋風の浅い器に、オイルとえび、にんにく、唐辛子、パセリ
    es_gambas: p => [
        K.stonePot(p),
        `<circle cx="100" cy="100" r="62" fill="${p.rg('#d8a63a', .25, .3)}" opacity=".9"/>`,
        ...[0, 1, 2, 3, 4, 5, 6].map(i => { const a = i * .9; return K.shrimp(p, 100 + Math.cos(a) * 36, 100 + Math.sin(a) * 34, 34, a * 57.3 + 90, { c: '#ef7a52' }); }),
        ygDots(p, 100, 100, 52, { n: 14, c: '#f0e2a8', rx: 4, ry: 2.6, seed: 20 }),
        ygDots(p, 100, 100, 54, { n: 6, c: '#c42a1c', rx: 3, ry: 1.4, seed: 21 }),
        K.sprinkle(p, 100, 100, 100, { c: '#3d8a2c', n: 24, r: 1.2 }),
    ].join(''),
    // イカのフライ: きつね色の輪、レモン
    es_calamaresromana: p => [
        K.plate(p),
        ...Array.from({ length: 12 }, (_, i) => { const a = i * 2.2, d = 14 + (i % 4) * 14; return `<g ${T(88 + Math.cos(a) * d, 100 + Math.sin(a) * d * .85, 0)}><g ${p.sh(.6)}><circle r="12" fill="${p.g('#e2a84e', .3, .25)}" stroke="#a87226" stroke-width=".7"/></g><circle r="5" fill="#f6efdc" stroke="#d6c9a0" stroke-width=".6"/></g>`; }),
        K.lemon(p, 148, 142, 32, 20), K.lemon(p, 156, 70, 26, -30),
        K.parsley(p, 66, 144, 14),
    ].join(''),
};
