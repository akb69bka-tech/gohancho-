// アメリカ（us_*）の主菜・副菜・汁物を斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 主菜は白い平皿（dinner plate）、チリ・シチュー類は厚手の陶器のボウル、具だくさんのスープは洋の深皿、なめらかなスープはスープカップ、
// サラダは木のボウル、副菜は白い小鉢（ラムカン）か平皿、ファヒータとコーンブレッドは鋳鉄のスキレット、エンチラーダは角の耐熱皿。青は使わない。
// 材料は gohancho/packs/us.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, K, f, T, rng, smooth, lt, dk, mix, SY, CZ, SYF, SHADE, at, byDepth } = W;

// =========================================================
// アメリカの部品
// =========================================================
const BEEF = '#7a4222', CHED = '#f2a83a', JACK = '#f4e2a8', SOUR = '#fbf8f0', PARS = ['#3f7a2a', '#5a9a3a'];
// 立てたタコス（固いシェル）: 手前のシェルの半円の上に、ひき肉・レタス・チーズ・トマトがのぞく
function taco(p, x, y, w, rot, seed){
    const h = w * .48, R = rng(p.id + 'tc' + seed);
    const shell = (dy, c) => `<path d="M${f(-w / 2)},${f(dy)} A${f(w / 2)},${f(h)} 0 0 0 ${f(w / 2)},${f(dy)}" fill="${c}"/>`;
    let s = `<g ${T(x, y, rot)}>` + Q.cast(p, 4, h * .9, w * .55, 5, .35) + `<path d="M${f(-w / 2 + 2)},-2 A${f(w / 2 - 2)},${f(h)} 0 0 0 ${f(w / 2 - 2)},-2Z" transform="translate(0 -5)" fill="#c8862a"/>`;
    // 中身（奥から）
    let fill = '';
    for (let i = 0; i < 16; i++){ const u = -w * .42 + i * w * .84 / 15; fill += `<circle cx="${f(u)}" cy="${f(-4 - R() * 3)}" r="${f(3 + R() * 1.6)}" fill="${R() < .5 ? BEEF : dk(BEEF, .2)}" stroke="${dk(BEEF, .4)}" stroke-width=".4"/>`; }
    for (let i = 0; i < 9; i++){ const u = -w * .42 + i * w * .84 / 8 + (R() - .5) * 4; fill += `<path d="M${f(u - 4)},${f(-6)} q4,-${f(5 + R() * 4)} 8,0" fill="${R() < .5 ? '#9ccc5a' : '#c8e690'}" stroke="#5a9a30" stroke-width=".6"/>`; }
    for (let i = 0; i < 10; i++){ const u = -w * .4 + R() * w * .8; fill += `<path d="M${f(u)},${f(-8 - R() * 4)} l${f(4 + R() * 3)},${f((R() - .5) * 3)}" stroke="${R() < .5 ? CHED : lt(CHED, .25)}" stroke-width="1.6" stroke-linecap="round"/>`; }
    for (let i = 0; i < 3; i++){ const u = -w * .25 + i * w * .25 + (R() - .5) * 4; fill += `<rect x="${f(u - 2.4)}" y="${f(-10 - R() * 3)}" width="4.8" height="4" rx="1" fill="#e0412e" stroke="#a82a1c" stroke-width=".4"/>`; }
    s += fill;
    // 手前のシェル（焼き色と気泡）
    s += `<path d="M${f(-w / 2)},-3 A${f(w / 2)},${f(h)} 0 0 0 ${f(w / 2)},-3 Z" fill="${Q.lg(p, [[0, '#f8d478'], [.5, '#eeb848'], [1, '#c8862a']], 0, 0, 1, 1)}" stroke="#a86a1e" stroke-width=".8"/>`;
    for (let i = 0; i < 12; i++){ const a = Math.PI * (.12 + R() * .76), r = (w / 2) * (.3 + R() * .62); s += `<ellipse cx="${f(-Math.cos(a) * r)}" cy="${f(-3 + Math.sin(a) * h * (r / (w / 2)))}" rx="${f(1 + R() * 1.4)}" ry="${f(.7 + R() * .7)}" fill="${R() < .5 ? '#c8862a' : '#fbe6a0'}" opacity=".7"/>`; }
    s += `<path d="M${f(-w * .38)},${f(h * .1)} A${f(w * .42)},${f(h * .8)} 0 0 0 ${f(-w * .05)},${f(h * .78)}" stroke="#fff6d0" stroke-width="1.6" fill="none" opacity=".7"/>`;
    return s + '</g>';
}
// バーガー（下のバンズ・具・上のバンズ）。layers は下から順に (y) => svg
function burger(p, x, y, rx, layers, { topH = 26, c = '#d08a3a', sesame = true, seed = 1 } = {}){
    let s = W.bunBottom(p, x, y, rx, 9, c), yy = y;
    for (const L of layers){ const [svg, dh] = L(yy); s += svg; yy -= dh; }
    return s + W.bunTop(p, x, yy, rx, topH, { c, sesame, seed });
}
const pattyL = (p, x, rx, h = 9, c = '#6e3a1e') => y => [W.pattyDisc(p, x, y - h, rx + 2, h, c), h + 1];
const lettuceL = (p, x, rx) => y => [W.lettuceRuffle(p, x, y - 2, rx, x), 3];
const cheeseL = (x, rx) => y => [W.cheeseSlice(x, y - 2, rx, 3), 2];
const tomatoL = (p, x, rx) => y => { const ry = rx * SY * .7; return [`<ellipse cx="${f(x)}" cy="${f(y - 1)}" rx="${f(rx - 4)}" ry="${f(ry - 1)}" fill="#c82a1c"/><ellipse cx="${f(x)}" cy="${f(y - 3)}" rx="${f(rx - 4)}" ry="${f(ry - 1)}" fill="${Q.rg(p, [[0, '#ff7a5a'], [1, '#d8342a']], .4, .35, .8)}" stroke="#a82a1c" stroke-width=".5"/>`, 4]; };
const onionL = (x, rx) => y => [`<ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(rx - 8)}" ry="${f((rx - 8) * SY * .6)}" fill="none" stroke="#c87aa8" stroke-width="2.2"/><ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(rx - 14)}" ry="${f((rx - 14) * SY * .6)}" fill="none" stroke="#e8c4d8" stroke-width="1.6"/>`, 2];
// ピクルスの輪切り
const pickle = (p, x, y, r) => W.coin(p, x, y, r, '#6a8a2a', { h: 1.6, top: Q.rg(p, [[0, '#d8e6a0'], [.7, '#a8c060'], [1, '#5a7a22']], .4, .35, .8) }) + `<circle cx="${f(x - 2)}" cy="${f(y - 2)}" r=".8" fill="#eef4c8"/><circle cx="${f(x + 2)}" cy="${f(y - 1)}" r=".8" fill="#eef4c8"/>`;
// とうもろこし（1本を寝かせる）: 粒の並び
function cob(p, x, y, L, rot, seed, { butter = true } = {}){
    const R = rng(p.id + 'cob' + seed), r = L * .17;
    let s = `<g ${T(x, y, rot)}>` + `<ellipse cx="3" cy="${f(r * .9)}" rx="${f(L / 2)}" ry="${f(r * .5)}" fill="${SHADE}" opacity=".28" ${Q.blur(p, 2)}/>` +
        `<rect x="${f(-L / 2)}" y="${f(-r)}" width="${f(L)}" height="${f(r * 2)}" rx="${f(r)}" fill="${Q.lg(p, [[0, '#fff0a0'], [.45, '#f6c83a'], [1, '#c8901a']], 0, 0, 0, 1)}" stroke="#b8821a" stroke-width=".7"/>`;
    for (let row = 0; row < 5; row++) for (let i = 0; i < Math.round(L / 5.2); i++){ const u = -L / 2 + 4 + i * 5.2 + (row % 2) * 2.6, v = -r * .8 + row * r * .4; if (u > L / 2 - 3) continue; s += `<ellipse cx="${f(u)}" cy="${f(v)}" rx="2.3" ry="${f(r * .17)}" fill="${row < 2 ? '#fde68a' : row < 4 ? '#f6c83a' : '#dca42a'}" stroke="#c8901a" stroke-width=".35"/>`; }
    if (butter) s += `<path d="M${f(-L * .15)},${f(-r * .9)} q6,-2 12,0 q-2,${f(r * .8)} -6,${f(r * 1.2)} q-4,-${f(r * .6)} -6,-${f(r * 1.2)}Z" fill="#fbe27a" opacity=".85"/>`;
    s += `<path d="M${f(-L * .4)},${f(-r * .55)} L${f(L * .35)},${f(-r * .55)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`;
    return s + `<ellipse cx="${f(L / 2 - 1)}" cy="0" rx="${f(r * .35)}" ry="${f(r * .9)}" fill="#e8d8a0" stroke="#b8a060" stroke-width=".5"/></g>`;
}
// パンケーキ1枚（側面の焼き色の帯と上の面）
const pancake = (p, x, y, rx, h, c = '#d89a48') => { const ry = rx * SYF * .62; return `<path d="M${f(x - rx)},${f(y)} L${f(x - rx)},${f(y + h)} A${f(rx)},${f(ry)} 0 0 0 ${f(x + rx)},${f(y + h)} L${f(x + rx)},${f(y)}Z" fill="${Q.lg(p, [[0, '#f4dcb0'], [.6, '#e8c890'], [1, '#c89a5a']])}" stroke="#a8763a" stroke-width=".6"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${Q.rg(p, [[0, '#f0c070'], [.6, c], [1, '#b8742a']], .4, .35, .75)}" stroke="#a8682a" stroke-width=".6"/>`; };
// かぶせ皮のパイ（ポットパイ）: ドームの皮に切れ目、縁のひだ
function pieTop(p, cx, cy, rx, H, seed){
    const ry = rx * SY, R = rng(p.id + 'pie' + seed);
    let s = `<path d="M${f(cx - rx)},${f(cy)} C${f(cx - rx)},${f(cy - H * 1.3)} ${f(cx + rx)},${f(cy - H * 1.3)} ${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx)},${f(cy)}Z" fill="${Q.rg(p, [[0, '#f8d898'], [.5, '#e8b062'], [1, '#b8742e']], .38, .3, .8)}" stroke="#9a5e22" stroke-width=".8"/>`;
    for (let i = 0; i < 26; i++){ const a = i / 26 * 6.283, x = cx + Math.cos(a) * (rx - 1), y = cy + Math.sin(a) * (ry - 1) - (Math.sin(a) < 0 ? 0 : 0); s += `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="${Math.sin(a) > 0 ? '#d8963e' : '#f0c47a'}" stroke="#a8682a" stroke-width=".5"/>`; }
    for (const [u, r] of [[-14, -20], [0, 0], [14, 20]]) s += `<path d="M${f(cx + u - 5)},${f(cy - H * .95 + Math.abs(u) * .2)} l10,0" transform="rotate(${r} ${f(cx + u)} ${f(cy - H * .95)})" stroke="#8a4e1a" stroke-width="1.6" stroke-linecap="round"/>`;
    for (let i = 0; i < 18; i++) s += `<circle cx="${f(cx + (R() - .5) * rx * 1.4)}" cy="${f(cy - H * (.3 + R() * .6))}" r=".8" fill="#c88a3a" opacity=".6"/>`;
    return s + `<path d="M${f(cx - rx * .6)},${f(cy - H * .55)} Q${f(cx - rx * .4)},${f(cy - H * .95)} ${f(cx)},${f(cy - H * 1.02)}" stroke="#fff6dc" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 巻いたトルティーヤ（エンチラーダ）: 横長の円柱を寝かせる
function rolled(p, x, y, L, r, c = '#ecd49a'){
    const ry = r * SY * 1.25;
    return `<g ${T(x, y)}><rect x="${f(-L / 2)}" y="${f(-r)}" width="${f(L)}" height="${f(r * 2)}" rx="${f(r * .6)}" fill="${Q.lg(p, [[0, lt(c, .3)], [.5, c], [1, dk(c, .3)]], 0, 0, 0, 1)}" stroke="${dk(c, .35)}" stroke-width=".6"/><ellipse cx="${f(-L / 2 + 1)}" cy="0" rx="${f(r * .4)}" ry="${f(ry * .7)}" fill="${dk(c, .1)}" stroke="${dk(c, .35)}" stroke-width=".5"/></g>`;
}
// ほぐした豚肉（プルドポーク）: 赤茶の筋の重なり
function pulled(p, cx, cy, rx, ry, n, seed, c = '#9a4a26'){
    const R = rng(p.id + 'pp' + seed); let s = '';
    const it = [];
    for (let i = 0; i < n; i++){ const x = cx + (R() - .5) * 2 * rx, y = cy + (R() - .5) * 2 * ry, L = 6 + R() * 8, r = R() * 180, col = R() < .4 ? lt(c, .2) : R() < .5 ? c : dk(c, .2); it.push([y, `<g ${T(x, y, r)}><path d="M${f(-L / 2)},0 Q0,${f((R() - .5) * 4)} ${f(L / 2)},0" stroke="${dk(col, .35)}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".6"/><path d="M${f(-L / 2)},0 Q0,${f((R() - .5) * 4)} ${f(L / 2)},0" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`]); }
    it.sort((a, b) => a[0] - b[0]);
    return s + it.map(q => q[1]).join('');
}
// 細い千切りの山（コールスロー: キャベツとにんじん）
const slaw = (p, cx, cy, rx, H, seed, n = 220) => Q.shredMound(p, cx, cy, rx, H, ['#fbfbec', '#eef0d4', '#d8e0b0'], seed, { n, w: 1.7 }) + Q.shredMound(p, cx + 2, cy - H * .5 * CZ, rx * .7, 3, ['#f8a050', '#ec7b2d', '#d8641e'], seed + 'c', { n: 30, w: 1.4 });
// クルトン
const crouton = (p, x, y, s, seed) => W.dice(p, x, y, s, '#d89a48', 'cr' + seed, { h: s * .8, top: Q.rg(p, [[0, '#f8d898'], [.6, '#e0a858'], [1, '#b8742a']], .4, .35, .8) });
// ロメインの葉（縦長で中骨が白い）
function romaine(p, x, y, L, rot, seed){
    const c = '#5a9a34';
    return Q.leaf(p, x, y, L, rot, seed % 3 ? c : '#7ab848', 'rm' + seed, { wave: 3.4 }) + `<g transform="translate(${f(x)} ${f(y)}) scale(1 ${SY}) rotate(${f(rot)})"><path d="M${f(-L * .42)},0 Q0,-1.6 ${f(L * .42)},.6" stroke="#eef4d0" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// 皮つきのじゃがいも・さつまいもの角切り（ロースト）
const roastCube = (p, x, y, s, seed, c = '#e8b860', skin = '#a86a3a') => W.dice(p, x, y, s, skin, 'rc' + seed, { h: s * .6, top: Q.rg(p, [[0, lt(c, .3)], [.6, c], [.9, '#c8823a'], [1, '#9a5a22']], .4, .35, .75) });
// スープの具: ひと口の鶏肉（白っぽい）
const chickenBit = (p, x, y, s, seed, c = '#f2e2c4') => Q.lump(p, x, y, s / 2, s * .36, c, p.id + 'cb' + seed, { n: 7, jit: .3, hi: .45 });
// にんじんの輪切り・セロリの小口切り
const carrotCoin = (p, x, y, r = 5, liq = null) => W.coin(p, x, y, r, '#e8782a', { h: 2, liq, top: Q.rg(p, [[0, '#ffb070'], [.6, '#f08a3a'], [1, '#d8641e']], .4, .35, .8) });
const celery = (p, x, y, s, rot) => Q.prism(p, x, y, [[-s / 2, -s * .2], [s / 2, -s * .2], [s * .4, s * .25], [-s * .4, s * .25]], 2.2, '#9ac860', { rot, line: .45, top: Q.lg(p, [[0, '#d8ecb0'], [1, '#8ab850']], 0, 0, 1, 1) });
// 白いんげん・黒豆・赤いんげん
const kidney = (p, x, y, s, rot) => Q.bean(p, x, y, s, rot, '#8a2a24');
const whiteBean = (p, x, y, s, rot) => Q.bean(p, x, y, s, rot, '#efe6d0');
const blackBean = (p, x, y, s, rot) => Q.bean(p, x, y, s, rot, '#4a3028');
// 卵のスクランブル（ふんわりした塊）
function scramble(p, cx, cy, rx, H, seed){
    const R = rng(p.id + 'sc' + seed), it = [];
    for (let i = 0; i < 16; i++){ const a = R() * 6.283, d = Math.sqrt(R()), u = Math.cos(a) * d * rx, v = Math.sin(a) * d * rx; const [x, y] = at({ cx, cy, sy: SYF }, u, v, W.hill(u, v, rx, H)); it.push([y, () => Q.lump(p, x, y, 9 + R() * 5, 6 + R() * 3, R() < .5 ? '#f8d860' : '#f6e08a', p.id + 'sg' + i, { n: 7, jit: .35, hi: .5, edge: '#d8a830' })]); }
    return byDepth(it);
}
// 葉のパセリ・ハーブ（小さな葉の集まり）
const herb = (p, x, y, s, c = '#4f9a34') => [0, 120, 240].map((a, i) => Q.leaf(p, x + Math.cos(a / 57.3) * s * .3, y + Math.sin(a / 57.3) * s * .3 * SY, s * .7, a, c, 'hb' + x + i, { wave: 1, vein: false })).join('');
// タイムの小枝
const thyme = (x, y, L, rot) => `<g ${T(x, y, rot)}><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#6a7a3a" stroke-width="1" />${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${f(-L / 2 + 3 + i * (L - 6) / 5)}" cy="${i % 2 ? -1.6 : 1.6}" rx="1.8" ry="1" fill="#5a8a3a"/>`).join('')}</g>`;
// にんにく（つぶした1片）
const garlic = (p, x, y, s) => Q.lump(p, x, y, s / 2, s * .34, '#f2e4c4', p.id + 'gl' + x, { n: 7, jit: .2, hi: .6, edge: '#c8a870' });
const P = (o, u, v, z = 0) => at(o, u, v, z);
const plate = W.dinnerPlate;

// =========================================================
// 品
// =========================================================
export default {
    // ---------- 主菜 ----------
    // ビーフタコス: 平皿に固いタコスを3つ立てて、ひき肉・レタス・チェダー・トマト、サワークリーム（お好みで）
    us_tacos: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-18, 0, -6, 1], [0, 2, 4, 2], [18, 4, 12, 3]].map(([u, v, r, i]) => { const [x, y] = P(o, u * 2.2, v + (i - 2) * 16); return [y, () => taco(p, x, y + 8, 66, r, i)]; })) + W.dollop(p, ...P(o, 44, 36), 16, SOUR); },
    // ポークチョップ: 骨つきの厚い豚肉をバターで焼き、にんにく・タイム、りんごのソース（お好みで）
    us_porkchops: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -6, -2); const [ax, ay] = P(o, 44, 30);
        const chop = `M${f(x - 52)},${f(y - 8)} C${f(x - 50)},${f(y - 34)} ${f(x + 10)},${f(y - 40)} ${f(x + 42)},${f(y - 22)} C${f(x + 62)},${f(y - 8)} ${f(x + 50)},${f(y + 26)} ${f(x + 10)},${f(y + 26)} C${f(x - 20)},${f(y + 26)} ${f(x - 30)},${f(y + 8)} ${f(x - 52)},${f(y - 8)}Z`;
        let s = D.s + W.pool(p, x + 8, y + 12, 34, '#b8823a', 'pc') + Q.dropOf(p, chop, 2, 9, .35, 1.6);
        for (let i = 5; i >= 1; i--) s += `<path d="${chop}" transform="translate(0 ${f(i * 1.6)})" fill="${i > 2 ? '#c89870' : '#e8c8a0'}"/>`;
        s += `<path d="${chop}" fill="${Q.rg(p, [[0, '#e0a868'], [.55, '#c07a3e'], [.9, '#8a4a20'], [1, '#6a3414']], .4, .35, .8)}" stroke="#5a2c12" stroke-width=".8"/>`;
        s += `<path d="M${f(x - 50)},${f(y - 8)} C${f(x - 48)},${f(y - 30)} ${f(x + 6)},${f(y - 36)} ${f(x + 40)},${f(y - 20)}" stroke="#f2e2c4" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${f(x - 48)},${f(y - 10)} C${f(x - 46)},${f(y - 28)} ${f(x + 4)},${f(y - 33)} ${f(x + 36)},${f(y - 19)}" stroke="#fffaf0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
        s += `<path d="${Q.blob(x + 26, y + 6, 14, 9, 'pcf')}" fill="#f2dcb8" opacity=".7"/>` + [-20, -4, 12].map(u => `<path d="M${f(x + u - 10)},${f(y - 16)} L${f(x + u + 8)},${f(y + 16)}" stroke="#6a3010" stroke-width="2.6" opacity=".5"/>`).join('');
        return s + Q.shine(x - 14, y - 16, 22, -10, .8) + W.butterPat(p, x + 4, y - 6, 10) + garlic(p, x + 40, y + 24, 10) + thyme(x - 26, y + 22, 26, -12) + W.dollop(p, ax, ay, 22, '#e8d0a0'); },
    // チキンパルミジャーナ: パン粉の鶏むね肉にマリナラとモッツァレラ、バジル（お好みで）
    us_chickenparm: p => { const D = plate(p), o = D.o; const [x, y] = P(o, 0, 2);
        return D.s + W.crusty(p, x, y, 60, 40, 1, { c: '#d8963a', n: 50, h: 9 }) + `<path d="${Q.blob(x - 2, y - 4, 44, 27, 'mar', { n: 12, jit: .2 })}" fill="${Q.rg(p, [[0, '#ee5a3a'], [.6, '#c8321e'], [1, '#9a2414']], .4, .35, .8)}"/>` +
            [[-14, -8, 18], [10, -2, 20], [-2, 10, 16], [22, -14, 12]].map(([u, v, s], i) => `<path d="${Q.blob(x + u, y - 4 + v * .7, s * .6, s * .36, 'mz' + i, { n: 9, jit: .35 })}" fill="${Q.rg(p, [[0, '#fffdf0'], [.7, '#f8ecc8'], [1, '#e8c890']], .4, .35, .8)}" stroke="#e0c080" stroke-width=".5"/>`).join('') +
            `<circle cx="${f(x - 6)}" cy="${f(y - 10)}" r="2" fill="#d8902a" opacity=".6"/>` + Q.leaf(p, x + 8, y - 12, 18, 30, '#3f8a2c', 'bs', { wave: 1 }) + Q.shine(x - 20, y - 14, 18, -10, .8); },
    // レモンのサーモン焼き: 鮭の切り身、アスパラ、レモンの輪切り、バター
    us_salmon: p => { const D = plate(p), o = D.o; const [x, y] = P(o, 6, 6);
        let s = D.s + byDepth([-14, -7, 0, 7, 14].map((v, i) => { const [ax, ay] = P(o, -10 + i * 3, -34 + v * .8); return [ay, () => asp(p, ax, ay, i)]; }));
        return s + W.cutSlab(p, x, y, 46, 26, 11, '#f08a5a', 1, { rot: -10, sear: '#c8602a', edgeC: '#f8b890' }) + [-.3, -.1, .1, .3].map(k => `<path d="M${f(x + k * 80 - 4)},${f(y - 18)} Q${f(x + k * 80 + 2)},${f(y - 6)} ${f(x + k * 80 - 2)},${f(y + 10)}" stroke="#fde0c8" stroke-width="1.6" fill="none" opacity=".8"/>`).join('') + flecks(p, x, y - 6, 30, 14, 'dl', PARS) + W.lemon(p, ...P(o, 44, 34), 22) + W.lemon(p, ...P(o, 26, 44), 20) + W.butterPat(p, x - 10, y - 12, 9); },
    // ビーフ＆ブロッコリー: 牛肉の細切りとブロッコリーを醤油だれで、白いご飯（お好みで）
    us_beefbroccoli: p => { const D = plate(p), o = D.o; const [rx, ry] = P(o, -34, -22);
        const it = [];
        W.spots('bb', 14, 52, 15).forEach(([u, v, r], i) => { const [x, y] = P(o, u + 8, v + 6, 4); it.push([y, () => i % 2 ? W.broc(p, x, y - 4, 24, i) : Q.slice3q(p, x, y, 26, r, { c: '#6a3a1e', fat: '#8a5432', seed: i, gloss: .7, char: false }, { sq: .55 })]); });
        return D.s + Q.riceDome(p, rx, ry + 4, 30, 30 * SYF * .7, 22, { n: 260 }) + W.pool(p, 108, 112, 48, '#6a3a18', 'bbs') + byDepth(it) + Q.shine(110, 92, 20, -8, .8); },
    // ビーフチリ: 厚手の陶器のボウルに、ひき肉と赤いんげん・トマト・ピーマンのチリ、チェダーとサワークリーム（お好みで）
    us_chili: p => W.soup(p, W.bowl(p, { outer: '#b8643a', inner: '#f2e6d0' }), { c: '#9a3a1e', drop: 8, glow: .2, oil: 8, oilC: '#e87a2a', items: (pl, S) => [
        ...W.spots('chb', 12, 56, 13).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => kidney(p, x, y, 9, r)]; }),
        ...W.spots('chp', 5, 50, 20).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => W.pepperStrip(p, x, y, 8, r, '#4a8a2a')]; }),
        [1, () => W.crumble(p, S.cx, S.cy + 2, S.rx * .75, S.rx * SY * .7, 70, 'ch', { c: '#7a3a1e' })],
        [S.cy + 4, () => W.cheese(p, S.cx - 6, S.cy - 2, 30, 26, 'chc', { c: CHED })],
        [S.cy + 6, () => W.dollop(p, S.cx + 18, S.cy + 6, 22, SOUR)],
    ] }),
    // ホワイトチキンチリ: 白いんげん・鶏肉・青唐辛子の白いチリ、サワークリームとジャックチーズ（お好みで）
    us_whitechili: p => W.soup(p, W.bowl(p, { outer: '#d8c8a8', inner: '#f6f0e4' }), { c: '#e8dcbc', drop: 8, glow: .3, flecks: [['#5a9a3a', '#8ab84a'], 30, 1.3], items: (pl, S) => [
        ...W.spots('wcb', 16, 58, 12).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => whiteBean(p, x, y, 9, r)]; }),
        ...W.spots('wcc', 7, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => chickenBit(p, x, y, 14, i)]; }),
        [S.cy + 4, () => W.cheese(p, S.cx - 10, S.cy - 4, 22, 14, 'wcj', { c: JACK })],
        [S.cy + 6, () => W.dollop(p, S.cx + 16, S.cy + 4, 20, SOUR)],
    ] }),
    // チキン＆ダンプリング: 鶏肉・にんじん・セロリ・玉ねぎのとろみスープに、ふんわりしたダンプリング、パセリ
    us_chickendumplings: p => W.soup(p, W.bowl(p, { outer: '#e8dcc6', inner: '#f6f0e4', edge: '#c49a42' }), { c: '#e8cc8a', drop: 9, glow: .35, flecks: [PARS, 22, 1.3], items: (pl, S) => [
        ...W.spots('cdd', 5, 46, 30).map(([u, v], i) => { const [x, y] = pl(u, v, 4); return [y + 2, () => W.ball(p, x, y, 26, '#f6eedc', 'd' + i, { hi: .55, edge: '#d8c8a0' })]; }),
        ...W.spots('cdc', 6, 60, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => i % 2 ? carrotCoin(p, x, y, 5, '#e8cc8a') : celery(p, x, y, 8, i * 40)]; }),
        ...W.spots('cdk', 4, 58, 22).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => chickenBit(p, x, y, 13, i)]; }),
    ] }),
    // ミートローフ: ケチャップのたれを塗って焼いた、ひき肉と玉ねぎのローフを2切れ
    us_meatloaf: p => { const D = plate(p), o = D.o;
        const slice = (u, v, r, i) => { const [x, y] = P(o, u, v); const w = 58, d = 32; return [y, () => Q.prism(p, x, y, [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]], 9, '#7a4224', { rot: r, top: Q.rg(p, [[0, '#b87a52'], [.6, '#9a5a38'], [1, '#7a4224']], .4, .35, .8), line: .6 }) +
            `<g ${T(x, y - 9 * CZ, r)}><path d="M${f(-w / 2)},${f(-d / 2 * SY)} L${f(w / 2)},${f(-d / 2 * SY)}" stroke="#b8301e" stroke-width="5" stroke-linecap="round"/><path d="M${f(-w / 2 + 4)},${f(-d / 2 * SY - 1)} L${f(w / 2 - 6)},${f(-d / 2 * SY - 1)}" stroke="#f08a6a" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>` +
            W.flecks(p, x, y - 9 * CZ, 22, 26, 'ml' + i, ['#e8d4a0', '#5a2c14', '#c88a50', '#6a3a1e'], { ry: 7, s: 1.1 })]; };
        return D.s + byDepth([slice(-12, -18, -8, 1), slice(10, 16, -14, 2)]) + W.drizzle([[120, 70], [130, 74], [140, 72]], '#c8341e', 2.6); },
    // ポットロースト: 牛の塊をじゃがいも・にんじん・玉ねぎと煮込み、肉汁のソース、タイム
    us_potroast: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -6, -6);
        const it = [[y, () => Q.lump(p, x, y, 36, 24, '#7a4022', 'prm', { n: 11, jit: .14, hi: .5 }) + W.flecks(p, x, y - 6, 26, 26, 'prf', ['#5a2c14', '#9a5a32'], { ry: 12 }) + Array.from({ length: 5 }, (_, i) => `<path d="M${f(x - 24 + i * 12)},${f(y - 16)} q3,10 -2,22" stroke="#5a2c14" stroke-width="1.2" fill="none" opacity=".6"/>`).join('')]];
        [[-46, 24, 'p'], [-20, 36, 'c'], [12, 38, 'p'], [40, 22, 'c'], [48, -10, 'p'], [30, -34, 'c'], [-48, -16, 'o']].forEach(([u, v, k], i) => { const [xx, yy] = P(o, u, v); it.push([yy, () => k === 'p' ? Q.glossLump(p, xx, yy, 22, i, { c: '#ecc77c' }) : k === 'c' ? Q.rangiri(p, xx, yy, 18, i * 40, '#e8782a', i) : W.onionStrip(xx, yy, 16, 20, '#e8c890')]); });
        return D.s + W.pool(p, 100, 106, 58, '#8a5228', 'prp') + byDepth(it) + thyme(126, 76, 22, 20) + Q.shine(x - 14, y - 14, 18, -10, .8); },
    // サザン・フライドチキン: バターミルクに漬けて衣をつけて揚げた、骨つきのもも・ドラムスティック
    us_friedchicken: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-24, -18, -30, 0], [22, -14, 200, 1], [-14, 22, -150, 2], [26, 24, 20, 3]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => i % 2 ? W.drumstick(p, x, y, 46, r, i) : W.crusty(p, x, y, 26, 18, i, { c: '#c8822e', n: 40, h: 8, rot: r / 6 })]; })); },
    // チキンファヒータ: 鋳鉄のスキレットで鶏肉・色とりどりのピーマン・玉ねぎを焼き、トルティーヤ・ライム・サワークリーム（お好みで）
    us_fajitas: p => { const V = W.skillet(p), o = { cx: V.cx, cy: V.cy + 2 };
        const it = W.spots('fj', 24, 64, 12).map(([u, v, r], i) => { const [x, y] = P(o, u, v * 1.05); return [y, () => i % 3 === 0 ? Q.slice3q(p, x, y, 22, r, { c: '#c88a4a', fat: '#e8b878', seed: i, gloss: .6 }, { sq: .45 }) : i % 3 === 1 ? W.pepperStrip(p, x, y, 22, r, ['#d8302a', '#3f8a2a', '#f2b82a'][i % 9 / 3 | 0]) : W.onionStrip(x, y, 18, r, '#ecd8b0')]; });
        const [tx, ty] = [52, 150];
        return V.s + `<g ${V.inside}>${byDepth(it)}</g>` + W.flecks(p, 100, 100, 50, 18, 'fjc', PARS) + `<g>${[0, 1, 2].map(i => `<ellipse cx="${tx + i * 1.5}" cy="${ty - i * 3}" rx="30" ry="12" fill="${i === 2 ? Q.rg(p, [[0, '#fbf2dc'], [.7, '#f0dcb0'], [1, '#d8b878']], .4, .35, .8) : '#e8d0a0'}" stroke="#c8a870" stroke-width=".6"/>`).join('')}${W.flecks(p, tx + 3, ty - 6, 20, 10, 'tor', ['#c8904a', '#b8783a'], { ry: 6, s: 1.1 })}</g>` + W.lemon(p, 150, 152, 20, { wedge: true, rot: -10, c: '#8ab83a' }) + V.shine(.5); },
    // チーズバーガー: バンズ・レタス・パティ・チェダー・トマト・赤玉ねぎ、ディルピクルス（お好みで）
    us_burgers: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -6, 10);
        return D.s + burger(p, x, y + 8, 44, [lettuceL(p, x, 44), pattyL(p, x, 44, 11), cheeseL(x, 44), tomatoL(p, x, 42), onionL(x, 42)], { topH: 30 }) + pickle(p, ...P(o, 50, 30), 8) + pickle(p, ...P(o, 56, 10), 8) + W.drizzle([[x - 30, y - 4], [x - 22, y - 2], [x - 14, y - 4]], '#d8402a', 2.4); },
    // ステーキ: 厚切りの牛肉をこんがり焼き、にんにくバターとタイムをのせる
    us_steak: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -4, 2);
        return D.s + W.pool(p, x + 6, y + 10, 52, '#9a5a28', 'stp') + W.cutSlab(p, x, y, 54, 34, 12, '#8a4a28', 1, { rot: -8, sear: '#4a2010', grill: 0, edgeC: '#b86a48' }) + `<path d="${Q.blob(x - 30, y + 6, 14, 10, 'stf', { rot: -8 })}" fill="#f2dcc0" opacity=".85"/>` + W.flecks(p, x, y - 6, 34, 30, 'stfk', ['#3a1c0c', '#f4e8d0'], { ry: 18, s: 1 }) + W.butterPat(p, x + 4, y - 10, 13) + garlic(p, x + 36, y + 22, 11) + garlic(p, x - 36, y + 30, 10) + thyme(x + 8, y - 22, 30, -20); },
    // プルドポークのサンド: 長く煮てほぐした豚肉をバーベキューソースで、バンズにはさみ、コールスロー（お好みで）
    us_pulledpork: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -4, 8);
        const fill = yy => [pulled(p, x, yy - 8, 40, 8, 80, 'pp') + Q.shredMound(p, x + 2, yy - 16, 30, 6, ['#fbfbec', '#eef0d4', '#d8e0b0'], 'ppc', { n: 70, w: 1.5 }), 22];
        return D.s + W.pool(p, x + 30, y + 24, 22, '#8a2e16', 'pps') + burger(p, x, y + 6, 44, [fill], { topH: 28, sesame: false, c: '#d89a48' }); },
    // ハニーガーリックのポークテンダーロイン: 焼いたヒレ肉の輪切りを並べ、はちみつとにんにくのたれ
    us_porktenderloin: p => { const D = plate(p), o = D.o;
        const it = [[-40, -20], [-14, -26], [12, -20], [38, -12], [-28, 12], [0, 14], [28, 22]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.coin(p, x, y, 17, '#7a3a18', { h: 6, sy: SYF, top: Q.rg(p, [[0, '#fae8dc'], [.5, '#f0c4b0'], [.78, '#d88a6a'], [.9, '#a8522a'], [1, '#6a2e12']], .45, .4, .7) }) + Q.shine(x - 5, y - 10, 10, -8, .7)]; });
        return D.s + W.pool(p, 104, 112, 30, '#b8742a', 'ptp') + byDepth(it) + flecks(p, 100, 92, 40, 12, 'ptg', ['#f4e8c4', '#5a8a3a']); },
    // シュリンプ＆グリッツ: チーズ入りのやわらかいグリッツに、ベーコンとにんにくで炒めたえび、青ねぎ
    us_shrimpgrits: p => W.soup(p, W.bowl(p, { outer: '#f2ece0', inner: '#f8f4ec', edge: '#c49a42', h: 48, cy: 80 }), { c: '#f2dc9a', drop: 6, glow: .35, rimShade: .2, items: (pl, S) => [
        ...[[-28, -14, 20], [2, -22, -10], [28, -8, 40], [-14, 12, -30], [20, 16, 10]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.shrimp(p, x, y, 24, r, { flip: i % 2 ? -1 : 1 })]; }),
        ...W.spots('sgb', 8, 50, 14).map(([u, v], i) => { const [x, y] = pl(u, v, 3); return [y + 1, () => W.baconBit(p, x, y, 6, i)]; }),
        ...W.spots('sgn', 12, 52, 10).map(([u, v], i) => { const [x, y] = pl(u, v, 4); return [y + 2, () => Q.negi(p, x, y, 5, '#4a9a2c')]; }),
    ], oil: 6, oilC: '#e8902a' }),
    // ブラックンド・ティラピア: スパイスをまぶして焼いた白身魚、バター、レモン、ご飯（お好みで）
    us_tilapia: p => { const D = plate(p), o = D.o; const [rx, ry] = P(o, 36, -28);
        const fish = (u, v, r, i) => { const [x, y] = P(o, u, v); return [y, () => W.cutSlab(p, x, y, 40, 17, 7, '#a8542a', i, { rot: r, sear: '#4a1e0c', edgeC: '#f2e2c8' }) + W.flecks(p, x, y, 32, 40, 'tl' + i, ['#6a2a10', '#c8582a', '#3a1c0c'], { ry: 12, s: 1.1 })]; };
        return D.s + Q.riceDome(p, rx, ry + 6, 26, 26 * SYF * .7, 18, { n: 200 }) + byDepth([fish(-14, -6, -14, 1), fish(-4, 22, -8, 2)]) + W.lemon(p, ...P(o, 44, 30), 22, { wedge: true, rot: -20 }) + W.butterPat(p, ...P(o, -18, -12, 8), 9); },
    // チキンポットパイ: 鶏肉・にんじん・セロリ・玉ねぎ・グリーンピースのクリーム煮に、パイの皮をかぶせて焼く
    us_potpie: p => { const V = W.bowl(p, { outer: '#c87a46', inner: '#f2e6d0', h: 40, cy: 92, rx: 88, fx: 50 }), cx = 100, cy = 90;
        return V.s + `<g ${V.above}>${pieTop(p, cx, cy, 84, 30, 1)}</g>` + `<path d="${Q.blob(126, 78, 12, 6, 'ppf')}" fill="#f2dca0" stroke="#b8823a" stroke-width=".6"/>` + Q.pea(p, 122, 77, 2.6) + Q.pea(p, 130, 79, 2.4) + `<rect x="125" y="74" width="4" height="3" rx="1" fill="#e8782a"/>` + V.shine(.4); },
    // デンバーオムレツ: ハム・ピーマン・玉ねぎ・チェダーを包んだオムレツ
    us_denveromelet: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -4, 6);
        const d = `M${f(x - 56)},${f(y + 4)} C${f(x - 56)},${f(y - 36)} ${f(x + 56)},${f(y - 36)} ${f(x + 56)},${f(y + 4)} Q${f(x)},${f(y + 22)} ${f(x - 56)},${f(y + 4)}Z`;
        let s = D.s + Q.dropOf(p, d, 2, 5, .3) + `<path d="${d}" transform="translate(0 4)" fill="#e0b040"/><path d="${d}" fill="${Q.rg(p, [[0, '#fff2a8'], [.6, '#f8d860'], [1, '#e0b038']], .4, .3, .85)}" stroke="#c89a2a" stroke-width=".8"/>`;
        // 縁からのぞく具
        [[-40, 2, 'h'], [-24, 10, 'g'], [-8, 13, 'h'], [8, 13, 'o'], [24, 11, 'g'], [38, 6, 'h']].forEach(([u, v, k], i) => { const xx = x + u, yy = y + v; s += k === 'h' ? W.hamDice(p, xx, yy, 7, i) : k === 'g' ? W.pepperStrip(p, xx, yy, 8, 30, '#3f8a2a') : W.onionStrip(xx, yy, 8, 0); });
        return s + W.cheese(p, x - 4, y + 12, 30, 12, 'dco', { c: CHED, ry: 3 }) + `<path d="M${f(x - 30)},${f(y - 14)} Q${f(x - 10)},${f(y - 26)} ${f(x + 16)},${f(y - 22)}" stroke="#fffbe0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>` + W.flecks(p, x + 10, y - 10, 30, 10, 'dcp', '#8a6a3a', { ry: 8, s: .7 }); },
    // ブラックビーンバーガー: 黒豆・赤ピーマン・玉ねぎのパティ、レタスとトマト、アボカド（お好みで）
    us_beanburgers: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -4, 8);
        const bean = yy => [W.pattyDisc(p, x, yy - 11, 46, 11, '#5a3a2c') + W.flecks(p, x, yy - 11, 36, 18, 'bbp', ['#d8402a', '#3a2418', '#e8d4a0'], { ry: 9, s: 1.2 }), 12];
        const avo = yy => [[-24, -8, 8, 24].map((u, i) => `<path d="M${f(x + u - 9)},${f(yy - 2)} Q${f(x + u)},${f(yy - 8)} ${f(x + u + 9)},${f(yy - 2)} Q${f(x + u)},${f(yy + 1)} ${f(x + u - 9)},${f(yy - 2)}Z" fill="${Q.lg(p, [[0, '#e8f0a0'], [.7, '#b8d060'], [1, '#5a7a2a']], 0, 0, 0, 1)}" stroke="#4a6a22" stroke-width=".6"/>`).join(''), 4];
        return D.s + burger(p, x, y + 8, 46, [lettuceL(p, x, 46), bean, tomatoL(p, x, 44), avo], { topH: 28 }); },
    // チーズエンチラーダ: 角の耐熱皿にトルティーヤを巻いて並べ、赤いソースとチーズで焼く、玉ねぎ・パクチー・サワークリーム（お好みで）
    us_enchiladas: p => { const V = W.casserole(p, { base: '#c87a46', inner: '#e8d0b0' }), o = V.o;
        const it = [-34, -12, 10, 32].map((v, i) => { const [x, y] = P(o, 0, v); return [y, () => rolled(p, x, y - 4, 150, 12)]; });
        const top = `<g ${V.inside}>${byDepth(it)}<rect x="0" y="0" width="200" height="200" fill="#b8341e" opacity=".55"/>${[[-50, -24], [-10, -30], [34, -18], [-36, 4], [8, 0], [44, 10], [-20, 26], [24, 30]].map(([u, v], i) => { const [x, y] = P(o, u, v); return `<path d="${Q.blob(x, y - 6, 16, 7, 'en' + i, { n: 10, jit: .35 })}" fill="${Q.rg(p, [[0, '#fff2b8'], [.6, '#f6cc60'], [1, '#d89a2a']], .4, .35, .8)}" opacity=".95"/><circle cx="${f(x - 4)}" cy="${f(y - 8)}" r="1.6" fill="#c8702a" opacity=".6"/>`; }).join('')}</g>`;
        return V.s + top + W.flecks(p, 100, 92, 60, 30, 'enc', ['#3f8a2a', '#5aa83a', '#f2ecd8'], { ry: 30, s: 1.3 }) + W.dollop(p, 72, 96, 18, SOUR) + W.dollop(p, 128, 108, 18, SOUR); },
    // オートミール: 牛乳で煮たオーツに、バナナの輪切り・くるみ（お好みで）・シナモン・メープル
    us_oatmeal: p => W.soup(p, W.bowl(p, { outer: '#e6d8bc', inner: '#f6f0e4' }), { c: '#e8d4a8', drop: 8, glow: .3, flecks: [['#c8a46a', '#f4e8c8', '#b08a50'], 70, 1.4], items: (pl, S) => [
        ...[[-30, -6], [-12, -14], [6, -18], [24, -10], [-20, 10], [0, 4]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.coin(p, x, y, 9, '#f2e2a0', { h: 2.6, top: Q.rg(p, [[0, '#fffbe0'], [.6, '#f6eab8'], [1, '#e8d088']], .4, .35, .8) }) + `<circle cx="${f(x)}" cy="${f(y - 2.6 * CZ)}" r="1.4" fill="#d8c080" opacity=".7"/>`]; }),
        ...W.spots('oaw', 5, 44, 16, { cu: 10, cv: 10 }).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.lump(p, x, y, 6, 4.4, '#a8763a', 'wn' + i, { n: 8, jit: .45, hi: .3 })]; }),
    ], after: '', cream: null }) ,
    // グリルドチーズサンド: バターを塗った食パンでチェダーをはさみ、こんがり焼いて三角に切る
    us_grilledcheese: p => { const D = plate(p), o = D.o;
        const half = (u, v, r, i) => { const [x, y] = P(o, u, v); return [y, () => W.bread(p, x, y, 70, r, { tri: true, toast: .75, th: 12 }) + `<path d="M${f(x - 32)},${f(y + 10)} q10,6 22,2 q8,6 18,1" stroke="#f4b03a" stroke-width="3.4" fill="none" stroke-linecap="round"/>` + W.flecks(p, x - 10, y - 14, 18, 12, 'gc' + i, ['#b8742a', '#e8b860'], { ry: 8 })]; };
        return D.s + byDepth([half(-16, -10, -8, 1), half(18, 14, 172, 2)]); },
    // バターミルク風パンケーキ: 3枚重ねにバターとメープルシロップ
    us_pancakes: p => { const D = plate(p), o = D.o; const [x, y] = P(o, 0, 4);
        let s = D.s + Q.cast(p, x + 4, y + 18, 60, 20, .35);
        for (let i = 0; i < 3; i++) s += pancake(p, x + (i % 2 ? 2 : -1), y + 12 - i * 9, 56 - i, 8);
        const ty = y + 12 - 2 * 9;
        return s + `<path d="${Q.blob(x - 2, ty + 2, 34, 15, 'syr', { n: 12, jit: .25 })}" fill="#a8581e" opacity=".75"/><path d="M${f(x + 30)},${f(ty + 4)} q3,10 0,20 M${f(x - 20)},${f(ty + 12)} q2,8 -1,16" stroke="#9a4e18" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".8"/>` + W.butterPat(p, x, ty - 2, 14) + Q.shine(x - 22, ty - 4, 16, -8, .85); },
    // スクランブルエッグとベーコン、トースト
    us_scrambledbacon: p => { const D = plate(p), o = D.o; const [tx, ty] = P(o, 34, -22);
        return D.s + W.bread(p, tx, ty + 4, 50, 14, { toast: .6, th: 6 }) + W.butterPat(p, tx - 2, ty - 6, 10) + scramble(p, 84, 104, 36, 18, 1) + [[38, 34, 14], [50, 14, 20]].map(([u, v, r], i) => W.bacon(p, ...P(o, u, v), 60, r, { seed: i })).join('') + W.flecks(p, 80, 92, 28, 14, 'sbp', '#5a3a20', { ry: 12, s: .7 }); },
    // スロッピージョー: ひき肉・玉ねぎ・ピーマン（お好みで）をケチャップのたれで煮て、バンズにはさむ
    us_sloppyjoes: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -2, 8);
        const fill = yy => [W.crumble(p, x, yy - 8, 46, 9, 120, 'sj', { c: '#9a3e1e', sauce: '#a8361c' }) + `<path d="M${f(x - 40)},${f(yy + 2)} q4,8 10,6 M${f(x + 26)},${f(yy + 3)} q2,7 6,8" stroke="#a8361c" stroke-width="4" fill="none" stroke-linecap="round"/>` + [-20, 6, 26].map((u, i) => W.pepperStrip(p, x + u, yy - 10, 8, 20 * i, '#3f8a2a')).join(''), 14];
        return D.s + burger(p, x, y + 6, 46, [fill], { topH: 28, sesame: false, c: '#d8963e' }); },

    // ---------- 副菜 ----------
    // マッシュポテト: バターと牛乳でなめらかにしたじゃがいも、バターのくぼみ、チャイブ（お好みで）
    us_mashed: p => W.inBowl(p, W.sideBowl(p), { R: 70, H: 30, items: (o, R, H) => [[0, () => W.cream(p, o.cx, o.cy + 4, R * .98, H, '#f6ecc8', 'ms', { ridges: 4 }) + `<path d="${Q.blob(o.cx + 4, o.cy - H * CZ * .9, 16, 7, 'msb')}" fill="#f8d860" opacity=".85"/>` + W.butterPat(p, o.cx + 4, o.cy - H * CZ * .95, 9) + W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'msc', ['#3f8a2a', '#5aa83a'], { ry: 12, s: 1.2 })]] }),
    // ガーリックいんげん: いんげんをバターとにんにくで炒め、レモンを絞る
    us_greenbeans: p => { const D = plate(p), o = D.o; const it = W.spots('gb', 22, 56, 9).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 6 + W.hill(u, v, 56, 12)); return [y, () => W.pod(p, x, y, 34 + (i % 3) * 4, r)]; });
        return D.s + byDepth(it) + W.flecks(p, 100, 96, 44, 22, 'gbg', ['#f4e8c4', '#e8d098'], { ry: 26, s: 1.4 }) + W.lemon(p, ...P(o, 50, 34), 18, { wedge: true, rot: -20 }); },
    // ガーデンサラダ: 木のボウルにロメイン・ミニトマト・きゅうり・にんじん、ランチドレッシング、クルトン（お好みで）
    us_salad: p => W.inBowl(p, W.woodBowl(p), { R: 74, H: 40, base: '#3f7a26', items: (o, R, H) => [
        ...W.onHill(o, 'sl', 20, R, 14, H, (x, y, r, i) => romaine(p, x, y, 32, r, i), { lift: 2 }),
        ...W.onHill(o, 'slt', 4, R * .8, 26, H, (x, y) => W.tomatoBall(p, x, y - 4, 13), { lift: 4 }),
        ...W.onHill(o, 'slc', 5, R * .8, 22, H, (x, y, r) => W.coin(p, x, y, 6.4, '#3f7a2a', { h: 1.4, top: Q.rg(p, [[0, '#eef6d0'], [.7, '#c8e090'], [1, '#5a9a3a']], .4, .35, .8) }), { lift: 3 }),
        ...W.onHill(o, 'slr', 4, R * .8, 20, H, (x, y, r) => [0, 1, 2].map(k => `<path d="M${f(x - 6 + k * 3)},${f(y - 2 + k)} l10,${f(-2 + k)}" stroke="#ec7b2d" stroke-width="1.8" stroke-linecap="round"/>`).join(''), { lift: 4 }),
        ...W.onHill(o, 'slk', 4, R * .7, 22, H, (x, y, r, i) => crouton(p, x, y, 8, i), { lift: 4 }),
        [999, () => W.drizzle([[o.cx - 30, o.cy - H * CZ + 2], [o.cx - 10, o.cy - H * CZ - 4], [o.cx + 8, o.cy - H * CZ + 2], [o.cx + 26, o.cy - H * CZ - 2]], '#f8f4e8', 2.4)],
    ] }),
    // コールスロー: キャベツとにんじんの千切りをマヨネーズと酢で和える
    us_coleslaw: p => W.inBowl(p, W.sideBowl(p), { R: 70, H: 32, items: (o, R, H) => [[0, () => slaw(p, o.cx, o.cy + 4, R, H, 'cs')]] }),
    // コーン・オン・ザ・コブ: ゆでたとうもろこしにバター、塩・こしょう
    us_corn: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-10, -14, -8], [6, 18, -4]].map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => cob(p, x, y, 104, r, i)]; })) + W.flecks(p, 100, 96, 50, 14, 'cnp', '#5a3a20', { ry: 28, s: .7 }); },
    // ローストブロッコリー: オリーブオイルとにんにくで焼き、レモン、パルメザン（お好みで）
    us_broccoli: p => { const D = plate(p), o = D.o; return D.s + byDepth(W.spots('rb', 10, 52, 22).map(([u, v], i) => { const [x, y] = P(o, u, v, 4); return [y, () => W.broc(p, x, y, 32, i, '#3a7a2e', { roast: .4 })]; })) + W.flecks(p, 100, 90, 46, 30, 'rbp', ['#fbf4dc', '#f0e2b8'], { ry: 24, s: 1.1 }) + W.lemon(p, ...P(o, 50, 36), 18, { wedge: true, rot: -14 }); },
    // コーンブレッド: 鋳鉄のスキレットで焼き、くし形に切り分ける、バター
    us_cornbread: p => { const V = W.skillet(p, { rx: 80 }), cx = V.cx, cy = V.cy + 1, rx = V.irx - 2, ry = rx * SY;
        let s = V.s + `<g ${V.inside}><ellipse cx="${cx}" cy="${cy}" rx="${f(rx)}" ry="${f(ry)}" fill="${Q.rg(p, [[0, '#fbe08a'], [.6, '#f0c050'], [.9, '#d8962a'], [1, '#a8661e']], .4, .35, .75)}"/>` + [0, 60, 120].map(a => `<path d="M${f(cx - Math.cos(a / 57.3) * rx)},${f(cy - Math.sin(a / 57.3) * ry)} L${f(cx + Math.cos(a / 57.3) * rx)},${f(cy + Math.sin(a / 57.3) * ry)}" stroke="#b8781e" stroke-width="1.4" opacity=".75"/>`).join('') + W.flecks(p, cx, cy, rx * .9, 60, 'cbf', ['#e8a840', '#fff0a0'], { ry: ry * .9, s: 1 }) + `</g>`;
        return s + W.butterPat(p, cx - 12, cy - 6, 14) + V.shine(.5); },
    // ポテトサラダ: ゆでたじゃがいも・卵・セロリ・赤玉ねぎ・ピクルスをマヨネーズとマスタードで、パプリカをふる
    us_potatosalad: p => W.inBowl(p, W.sideBowl(p), { R: 70, H: 30, base: '#f2e2b0', items: (o, R, H) => [
        ...W.onHill(o, 'ps', 18, R * .92, 15, H, (x, y, r, i) => W.dice(p, x, y, 13, '#f2dc98', 'ps' + i, { h: 8, top: Q.rg(p, [[0, '#fff6d0'], [.6, '#f6e6b0'], [1, '#e0c480']], .4, .35, .8) }) + `<path d="${Q.blob(x, y - 5, 6, 3, 'pm' + i)}" fill="#fbf8ec" opacity=".8"/>`),
        ...W.onHill(o, 'pse', 4, R * .7, 24, H, (x, y, r, i) => W.eggHalf(p, x, y - 2, 13, r % 40 - 20), { lift: 3 }),
        ...W.onHill(o, 'psc', 6, R * .8, 18, H, (x, y, r) => celery(p, x, y, 7, r), { lift: 4 }),
        ...W.onHill(o, 'pso', 4, R * .8, 18, H, (x, y, r) => W.onionStrip(x, y, 8, r, '#d890b8'), { lift: 4 }),
        [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .7, 46, 28, 'psp', ['#c8401c', '#d8582a', '#3f8a2a'], { ry: 14, s: .9 })],
    ] }),
    // デビルドエッグ: ゆで卵の黄身をマヨネーズとマスタードで和えて詰め、パプリカをふる
    us_deviledeggs: p => { const D = Q.ovalPlate(p, { line: 'none', rz: 70, h: 14 }), o = D.o ?? { cx: 100, cy: D.cy, sy: SYF };
        return D.s + byDepth([[-34, -18], [0, -22], [34, -18], [-34, 14], [0, 10], [34, 14]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.eggHalf(p, x, y, 32, 0, { piped: true, paprika: true })]; })); },
    // ベイクドビーンズ: 白いんげんとベーコン・玉ねぎを糖蜜とケチャップで煮込む
    us_bakedbeans: p => W.soup(p, W.bowl(p, { outer: '#9a5a32', inner: '#e8d4b8', h: 50, cy: 80, edge: '#c49a42' }), { c: '#8a3a1a', drop: 7, glow: .25, items: (pl, S) => [
        ...W.spots('bk', 40, 62, 8).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => Q.bean(p, x, y, 8.4, r, '#b8642e')]; }),
        ...W.spots('bkb', 6, 52, 20).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y + 1, () => W.baconBit(p, x, y, 8, i)]; }),
    ], oil: 6, oilC: '#c8702a' }),
    // シーザーサラダ: 木のボウルにロメイン、自家製クルトン、パルメザン、レモン、こしょう
    us_caesar: p => W.inBowl(p, W.woodBowl(p), { R: 74, H: 40, base: '#4a8a2c', items: (o, R, H) => [
        ...W.onHill(o, 'cz', 20, R, 14, H, (x, y, r, i) => romaine(p, x, y, 32, r, i), { lift: 2 }),
        ...W.onHill(o, 'czk', 7, R * .8, 20, H, (x, y, r, i) => crouton(p, x, y, 10, i), { lift: 4 }),
        [998, () => W.drizzle([[o.cx - 34, o.cy - H * CZ + 6], [o.cx - 12, o.cy - H * CZ], [o.cx + 10, o.cy - H * CZ + 4], [o.cx + 32, o.cy - H * CZ]], '#f4ecd0', 2.6)],
        [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .8, 48, 50, 'czp', ['#fbf6e4', '#f0e2b8', '#5a3a20'], { ry: 16, s: 1.3 }) + W.lemon(p, o.cx + 46, o.cy - 4, 18, { wedge: true, rot: -14 })],
    ] }),
    // スリービーン・サラダ: いんげん・赤いんげん豆・ひよこ豆と赤玉ねぎを甘酢で、パセリ
    us_threebean: p => W.inBowl(p, W.sideBowl(p), { R: 70, H: 26, base: '#c8a070', items: (o, R, H) => [
        ...W.onHill(o, 'tb', 46, R * .95, 7, H, (x, y, r, i) => i % 3 === 0 ? W.pod(p, x, y, 14, r) : i % 3 === 1 ? kidney(p, x, y, 9, r) : Q.pea(p, x, y, 4.2, '#e8c890')),
        ...W.onHill(o, 'tbo', 7, R * .8, 18, H, (x, y, r) => W.onionStrip(x, y, 9, r, '#d890b8'), { lift: 3 }),
        [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 44, 24, 'tbp', PARS, { ry: 14, s: 1.2 })],
    ] }),
    // ローデッド・ベイクドポテト: 皮ごと焼いたじゃがいもに、バター・サワークリーム・チェダー・ベーコン（お好みで）・チャイブ
    us_bakedpotato: p => { const D = plate(p), o = D.o; const [x, y] = P(o, 0, 4);
        const d = `M${f(x - 58)},${f(y)} C${f(x - 60)},${f(y - 30)} ${f(x + 60)},${f(y - 30)} ${f(x + 58)},${f(y)} C${f(x + 56)},${f(y + 26)} ${f(x - 56)},${f(y + 26)} ${f(x - 58)},${f(y)}Z`;
        return D.s + Q.dropOf(p, d, 3, 5, .35, 2) + `<path d="${d}" fill="${Q.rg(p, [[0, '#c8946a'], [.6, '#a06a42'], [1, '#6a4024']], .4, .3, .8)}" stroke="#5a3418" stroke-width=".8"/>` + W.flecks(p, x, y, 50, 30, 'bps', ['#5a3418', '#c8a070'], { ry: 16, s: 1 }) +
            `<path d="${Q.blob(x, y - 8, 40, 14, 'bpi', { n: 12, jit: .2 })}" fill="${Q.rg(p, [[0, '#fff6d8'], [.6, '#f6e2a8'], [1, '#e0c078']], .4, .35, .8)}" stroke="#c8a060" stroke-width=".6"/>` + W.butterPat(p, x - 16, y - 12, 11) + W.dollop(p, x + 10, y - 8, 24, SOUR) + W.cheese(p, x - 4, y - 12, 32, 22, 'bpc', { c: CHED, ry: 10 }) + [[-24, -6], [22, -14], [0, -2]].map(([u, v], i) => W.baconBit(p, x + u, y + v, 6, i)).join('') + W.flecks(p, x, y - 14, 32, 20, 'bpg', ['#3f8a2a', '#6ab84a'], { ry: 10, s: 1.3 }); },
    // ローストさつまいも: 角切りにしてオリーブオイル・塩・スモークパプリカで焼く
    us_sweetpotatoes: p => { const D = plate(p), o = D.o; return D.s + byDepth(W.spots('sp', 20, 56, 13).map(([u, v], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u, v, 56, 8)); return [y, () => roastCube(p, x, y, 15, i, '#f2903a', '#9a3e24')]; })) + W.flecks(p, 100, 92, 48, 30, 'spp', ['#b8401c', '#5a3a20'], { ry: 26, s: .8 }); },
    // サザン・コラードグリーン: ハムと玉ねぎでくたっと煮た青菜、煮汁ごと
    us_collards: p => W.heap(p, W.bowl(p, { outer: '#e6dac4', inner: '#f4eee2' }), { c: '#6a7a3a', drop: 12, H: 18, R: 64, items: (pl, S) => [
        ...W.spots('cl', 16, 60, 13).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 30, r, i % 3 ? '#2f6a2a' : '#4a7a30', 'cl' + i, { wave: 3 })]; }),
        ...W.spots('clh', 6, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 3); return [y + 1, () => W.hamDice(p, x, y, 8, i)]; }),
        [999, () => W.flecks(p, S.cx, S.cy - 6, 40, 14, 'clp', '#c8281a', { ry: 14, s: .8 })],
    ] }),
    // クリームドスピナッチ: ほうれん草をクリームとバター・パルメザンで煮る、ナツメグ
    us_creamedspinach: p => W.soup(p, W.sideBowl(p, { h: 44, cy: 80 }), { c: '#5a8a3a', drop: 4, glow: .35, rimShade: .2, items: (pl, S) => [
        ...W.spots('csp', 18, 60, 14).map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.leaf(p, x, y, 22, r, i % 2 ? '#3f7a2e' : '#4f8a34', 'cs' + i, { wave: 2, op: .9 })]; }),
        [999, () => `<g ${S.inside}>${[[-20, -6], [14, 2], [-4, 14], [26, -10]].map(([u, v], i) => { const [x, y] = pl(u, v); return `<path d="${Q.blob(x, y, 12, 5, 'csw' + i, { n: 10, jit: .4 })}" fill="#f6f0dc" opacity=".8"/>`; }).join('')}</g>` + W.flecks(p, S.cx, S.cy, 44, 18, 'csn', ['#a8763a', '#f4e8c4'], { ry: 14, s: .8 })],
    ] }),
    // はちみつのにんじんグラッセ: にんじんの輪切りをバターとはちみつで照りよく煮る、パセリ
    us_glazedcarrots: p => W.inBowl(p, W.sideBowl(p), { R: 68, H: 22, base: '#e8782a', items: (o, R, H) => [
        ...W.onHill(o, 'gc', 26, R * .95, 11, H, (x, y) => W.coin(p, x, y, 8, '#d8641e', { h: 3, top: Q.rg(p, [[0, '#ffc080'], [.5, '#f08a3a'], [1, '#c85a1a']], .4, .35, .8) }) + `<ellipse cx="${f(x - 2)}" cy="${f(y - 4)}" rx="2.4" ry="1" fill="#fff" opacity=".75"/>`),
        [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 44, 22, 'gcp', PARS, { ry: 14, s: 1.3 })],
    ] }),
    // 芽キャベツのロースト、ベーコン: 半分に切って焼き、バルサミコ（またはメープル）
    us_brussels: p => { const D = plate(p), o = D.o;
        const sprout = (x, y, s, i) => Q.lump(p, x, y, s / 2, s * .42, '#3f6e24', 'bs' + i, { n: 9, jit: .12, hi: .35 }) + `<path d="${Q.blob(x - 1, y - 3, s * .38, s * .26, 'bsi' + i)}" fill="${Q.rg(p, [[0, '#e8e8a0'], [.5, '#b8cc68'], [.85, '#8a7a2a'], [1, '#6a5a1e']], .4, .35, .8)}"/><path d="M${f(x - s * .2)},${f(y - 1)} q${f(s * .2)},-3 ${f(s * .4)},0" stroke="#8aa84a" stroke-width=".8" fill="none"/><ellipse cx="${f(x + s * .1)}" cy="${f(y)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#7a5a22" opacity=".55"/>`;
        return D.s + byDepth(W.spots('bsp', 14, 54, 18).map(([u, v], i) => { const [x, y] = P(o, u, v, 4); return [y, () => i % 4 === 3 ? W.baconBit(p, x, y, 10, i) : sprout(x, y, 28, i)]; })) + W.flecks(p, 100, 92, 46, 12, 'bsg', '#6a2a14', { ry: 24, s: 1.2 }); },
    // ズッキーニと黄色いズッキーニのソテー: 半月切りを玉ねぎとバターで、パルメザン（お好みで）
    us_squash: p => { const D = plate(p), o = D.o; return D.s + byDepth(W.spots('sq', 26, 56, 12).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u, v, 56, 8)); return [y, () => i % 5 === 4 ? W.onionStrip(x, y, 12, r) : Q.hangetsu(p, x, y, 13, r, i % 2 ? '#e8a82a' : '#3f7a24', null, { h: 4, top: Q.rg(p, [[0, '#fffae0'], [.55, i % 2 ? '#f6e6a0' : '#e4ecb8'], [.85, i % 2 ? '#e8c450' : '#a8c870'], [1, i % 2 ? '#c88a1a' : '#4a7a2a']], .4, .3, .8) })]; })) + W.flecks(p, 100, 92, 46, 26, 'sqp', ['#fbf4dc', '#6a8a3a'], { ry: 24, s: 1.1 }); },
    // サコタッシュ: コーンとライ豆（枝豆）・赤ピーマン・玉ねぎをバターで炒める
    us_succotash: p => W.inBowl(p, W.sideBowl(p), { R: 70, H: 26, base: '#e8c860', items: (o, R, H) => [
        ...W.onHill(o, 'sc', 60, R * .95, 6, H, (x, y, r, i) => i % 3 === 2 ? Q.bean(p, x, y, 7, r, '#9ac860') : W.kernel(p, x, y, 4.4)),
        ...W.onHill(o, 'scr', 8, R * .85, 16, H, (x, y, r, i) => W.dice(p, x, y, 6, '#d8302a', 'sr' + i, { h: 2.4 }), { lift: 2 }),
        [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 44, 16, 'scp', PARS, { ry: 14, s: 1.2 })],
    ] }),
    // 冷蔵庫ピクルス: きゅうりと玉ねぎを酢・砂糖・ディル・マスタードシードの液に漬ける
    us_fridgepickles: p => W.soup(p, W.sideBowl(p, { outer: '#e8e4d8', inner: '#f4f2ea', h: 44, cy: 80 }), { c: '#e2dca0', drop: 6, glow: .45, rimShade: .15, items: (pl, S) => [
        ...W.spots('fp', 22, 60, 12).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.coin(p, x, y, 8.4, '#4a7a2a', { h: 1.6, top: Q.rg(p, [[0, '#f2f6d0'], [.6, '#d8e8a0'], [.85, '#a8c868'], [1, '#4a7a2a']], .4, .35, .8) }) + `<circle cx="${f(x - 2)}" cy="${f(y - 2)}" r=".9" fill="#f8faea"/><circle cx="${f(x + 2)}" cy="${f(y - 1)}" r=".9" fill="#f8faea"/>`]; }),
        ...W.spots('fpo', 6, 54, 18).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y + .5, () => W.onionStrip(x, y, 10, r, '#f2ecd0')]; }),
        [999, () => W.flecks(p, S.cx, S.cy, 50, 20, 'fps', ['#d8b04a', '#5a8a3a', '#8a6a3a'], { ry: 20, s: 1.1 })],
    ] }),
    // ウォルドーフサラダ: 赤いりんご・セロリ・赤ぶどう・くるみをマヨネーズとヨーグルトで、レタス（お好みで）
    us_waldorf: p => W.inBowl(p, W.sideBowl(p), { R: 70, H: 28, base: '#f2ead0', items: (o, R, H) => [
        ...W.onHill(o, 'wl', 5, R * 1.02, 34, 0, (x, y, r, i) => Q.leaf(p, x, y + 4, 34, r, '#7ab848', 'wll' + i, { wave: 3 })),
        ...W.onHill(o, 'wa', 14, R * .85, 15, H, (x, y, r, i) => W.dice(p, x, y, 12, '#c8281e', 'wa' + i, { h: 8, top: Q.rg(p, [[0, '#fffbe8'], [.7, '#f6eccc'], [1, '#e8d8a8']], .4, .35, .8) }), { lift: 2 }),
        ...W.onHill(o, 'wg', 7, R * .8, 18, H, (x, y) => `<circle cx="${f(x)}" cy="${f(y - 4)}" r="5" fill="${Q.rg(p, [[0, '#d888a8'], [.6, '#a8385a'], [1, '#6a1e34']], .35, .3, .8)}" stroke="#5a1a2a" stroke-width=".5"/><ellipse cx="${f(x - 1.6)}" cy="${f(y - 5.6)}" rx="1.4" ry=".8" fill="#fff" opacity=".8"/>`, { lift: 3 }),
        ...W.onHill(o, 'wc', 7, R * .8, 18, H, (x, y, r) => celery(p, x, y, 8, r), { lift: 3 }),
        ...W.onHill(o, 'ww', 6, R * .7, 18, H, (x, y, r, i) => Q.lump(p, x, y - 2, 6, 4.4, '#a8763a', 'ww' + i, { n: 8, jit: .45, hi: .3 }), { lift: 4 }),
    ] }),
    // ライスピラフ: オルゾ（バーミセリ）と米をバターで炒めてブイヨンで炊く、パセリ
    us_ricepilaf: p => W.inBowl(p, W.sideBowl(p), { R: 70, H: 30, items: (o, R, H) => [[0, () => Q.riceDome(p, o.cx, o.cy + 4, R, R * SY, H, { n: 520, tint: '#f2e2b8', grain: '#d8c090' }) + W.flecks(p, o.cx, o.cy - H * CZ * .55, 48, 30, 'rpo', ['#d8a058', '#c88a40'], { ry: 16, s: 1.6, shape: 'seed' }) + W.flecks(p, o.cx, o.cy - H * CZ * .55, 46, 28, 'rpp', PARS, { ry: 16, s: 1.2 })]] }),
    // ガーリックブレッド: イタリアのパンの切り口ににんにくバターを塗って焼く、パセリ、パルメザン（お好みで）
    us_garlicbread: p => { const D = plate(p), o = D.o;
        const slice = (u, v, r, i) => { const [x, y] = P(o, u, v); return [y, () => Q.prism(p, x, y, Array.from({ length: 12 }, (_, k) => { const a = k / 12 * 6.283; return [Math.cos(a) * 30, Math.sin(a) * 15]; }), 10, '#c8823a', { rot: r, top: Q.rg(p, [[0, '#fff0b8'], [.5, '#f2cc70'], [.85, '#e0a848'], [1, '#b8742a']], .4, .35, .8), line: .6 }) + W.flecks(p, x, y - 10, 22, 22, 'gbf' + i, ['#3f8a2a', '#5aa83a', '#f8f0d0'], { ry: 9, s: 1.1 })]; };
        return D.s + byDepth([[-28, -20, -16, 1], [8, -4, -16, 2], [-12, 24, -16, 3], [36, 22, -16, 4]].map(a => slice(...a))); },
    // マッシュルームのソテー: バターとにんにくで炒め、醤油（またはウスター）、パセリ
    us_mushrooms: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 100, 106, 44, '#8a5a2a', 'mup') + byDepth(W.spots('mu', 18, 54, 14).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 4); return [y, () => i % 3 ? W.mushSlice(p, x, y, 22, r % 60 - 30) : W.mushCap(p, x, y, 18, '#9a6a3a')]; })) + W.flecks(p, 100, 92, 44, 24, 'mupp', PARS, { ry: 24, s: 1.3 }); },
    // マカロニサラダ: エルボマカロニとセロリ・にんじん・赤ピーマン・赤玉ねぎをマヨネーズで、パプリカ
    us_macsalad: p => W.inBowl(p, W.sideBowl(p), { R: 70, H: 28, base: '#f2e4b8', items: (o, R, H) => [
        ...W.onHill(o, 'mc', 34, R * .95, 9, H, (x, y, r) => `<g ${T(x, y, r)}><path d="M-6,2 Q-6,-5 2,-5" stroke="#d8b860" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="M-6,2 Q-6,-5 2,-5" stroke="${Q.lg(p, [[0, '#fff2c0'], [1, '#f0d488']])}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`),
        ...W.onHill(o, 'mcv', 12, R * .85, 14, H, (x, y, r, i) => i % 3 === 0 ? celery(p, x, y, 6, r) : W.dice(p, x, y, 5, i % 3 === 1 ? '#ec7b2d' : '#d8302a', 'mv' + i, { h: 2 }), { lift: 3 }),
        [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 44, 22, 'mcp', '#c8401c', { ry: 14, s: .8 })],
    ] }),
    // フライドオクラ: 輪切りのオクラにバターミルクとコーンミールの衣をつけて揚げる
    us_friedokra: p => { const D = plate(p), o = D.o; return D.s + W.paperLiner(o, 58, 'fo') + byDepth(W.spots('fo', 22, 52, 11).map(([u, v], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u, v, 52, 10)); return [y, () => W.crusty(p, x, y, 8, 6.4, i, { c: '#d8a040', n: 8, h: 5 }) + `<circle cx="${f(x + 1)}" cy="${f(y)}" r="3" fill="#7aa83a" opacity=".55"/><circle cx="${f(x + 1)}" cy="${f(y)}" r="1.2" fill="#e8f0c8"/>`]; })); },

    // ---------- 汁物 ----------
    // チキンヌードルスープ: 鶏肉・幅広の卵麺・にんじん・セロリ・玉ねぎ、パセリ
    us_chickennoodle: p => W.soup(p, W.soupPlate(p), { c: '#ecc870', drop: 5, glow: .4, flecks: [PARS, 26, 1.3], oil: 10, items: (pl, S) => [
        ...W.spots('cnn', 12, 56, 12).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => `<g ${T(x, y, r)}><path d="M-9,0 Q-3,-4 3,0 T12,0" stroke="#d8b050" stroke-width="5.6" fill="none" stroke-linecap="round"/><path d="M-9,0 Q-3,-4 3,0 T12,0" stroke="#f6dc88" stroke-width="4" fill="none" stroke-linecap="round"/></g>`]; }),
        ...W.spots('cnc', 6, 56, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + 1, () => i % 2 ? carrotCoin(p, x, y, 5.4, '#ecc870') : celery(p, x, y, 8, i * 30)]; }),
        ...W.spots('cnk', 5, 52, 20).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + 1, () => chickenBit(p, x, y, 13, i)]; }),
    ] }),
    // トマトスープ: 玉ねぎとトマトを煮てなめらかにし、生クリーム、バジル（お好みで）
    us_tomatosoup: p => W.soup(p, W.soupCup(p), { c: '#d8442a', drop: 6, glow: .3, cream: '#fbf2e4', after: '', items: (pl, S) => [[999, () => Q.leaf(p, S.cx - 18, S.cy - 6, 16, 30, '#3f8a2c', 'tsb', { wave: 1 }) + Q.leaf(p, S.cx - 10, S.cy - 9, 13, 150, '#4f9a34', 'tsb2', { wave: 1 })]] }),
    // ニューイングランド・クラムチャウダー: あさり・ベーコン・じゃがいも・玉ねぎ・セロリのクリームスープ、オイスタークラッカー（お好みで）
    us_clamchowder: p => W.soup(p, W.soupPlate(p), { c: '#f2ead4', drop: 5, glow: .45, flecks: [['#5a3a20', '#5a9a3a'], 20, 1], items: (pl, S) => [
        ...W.spots('ccp', 8, 54, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 11, '#f2e2b0', 'cc' + i, { h: 5, sink: 2, liq: '#f2ead4' })]; }),
        ...W.spots('ccc', 7, 52, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => Q.lump(p, x, y, 5.6, 4, '#e8b890', 'cl' + i, { n: 8, jit: .35, hi: .5 })]; }),
        ...W.spots('ccb', 4, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => W.baconBit(p, x, y, 6, i)]; }),
        ...[[30, -8], [40, 6], [22, 10]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y + 2, () => W.coin(p, x, y, 6, '#e8c890', { h: 2.6, top: Q.rg(p, [[0, '#fff2d0'], [1, '#e0b878']], .4, .35, .8) }) + `<circle cx="${f(x)}" cy="${f(y - 2.6 * CZ)}" r=".8" fill="#c8a060"/>`]; }),
    ] }),
    // コーンチャウダー: コーン・じゃがいも・玉ねぎ・セロリと牛乳のスープ、ベーコン（お好みで）、チャイブ
    us_cornchowder: p => W.soup(p, W.soupPlate(p), { c: '#f6e2a0', drop: 5, glow: .45, flecks: [['#3f8a2a', '#5aa83a'], 30, 1.2], items: (pl, S) => [
        ...W.spots('chk', 40, 60, 7).map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => W.kernel(p, x, y, 4.6)]; }),
        ...W.spots('chp', 6, 54, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => W.dice(p, x, y, 10, '#f2e2b0', 'cp' + i, { h: 4, sink: 1.6, liq: '#f6e2a0' })]; }),
        ...W.spots('chb', 4, 30, 14).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => W.baconBit(p, x, y, 6, i)]; }),
    ] }),
    // ローデッド・ベイクドポテトスープ: じゃがいものとろりとしたスープに、チェダー・ベーコン・サワークリーム・青ねぎ
    us_potatosoup: p => W.soup(p, W.bowl(p, { outer: '#e8dcc6', inner: '#f6f0e4' }), { c: '#f0e2bc', drop: 8, glow: .4, items: (pl, S) => [
        [S.cy - 2, () => W.cheese(p, S.cx - 4, S.cy - 2, 36, 40, 'pc', { c: CHED })],
        ...W.spots('pb', 7, 44, 14).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [S.cy + y * .01, () => W.baconBit(p, x, y, 7, i)]; }),
        [S.cy + 4, () => W.dollop(p, S.cx + 4, S.cy + 4, 22, SOUR)],
        [S.cy + 5, () => W.flecks(p, S.cx, S.cy, 40, 30, 'pg', ['#3f8a2a', '#6ab84a'], { ry: 18, s: 1.4 })],
    ] }),
    // ブロッコリーチェダースープ: ブロッコリー・にんじん・玉ねぎを牛乳とチェダーで煮る
    us_broccolicheddar: p => W.soup(p, W.bowl(p, { outer: '#d8c09a', inner: '#f6f0e4' }), { c: '#f0c050', drop: 7, glow: .35, items: (pl, S) => [
        ...W.spots('bc', 9, 52, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.broc(p, x, y, 18, i)]; }),
        ...W.spots('bcc', 8, 56, 12).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 4.6, '#e8782a', 'bk' + i, { h: 2, sink: 1, liq: '#f0c050' })]; }),
        [999, () => W.cheese(p, S.cx + 10, S.cy - 6, 18, 10, 'bcs', { c: '#e89a2a' })],
    ] }),
    // スプリットピースープ: 乾燥の緑の割り豆とハム・にんじん・セロリ・玉ねぎ
    us_splitpea: p => W.soup(p, W.soupPlate(p), { c: '#a8b04a', drop: 5, glow: .35, flecks: [['#8a9a3a', '#c8c86a'], 50, 1.4], items: (pl, S) => [
        ...W.spots('sh', 9, 54, 16).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.hamDice(p, x, y, 9, i)]; }),
        ...W.spots('sc', 7, 56, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 5, '#e8782a', 'sp' + i, { h: 2, sink: 1, liq: '#a8b04a' })]; }),
    ] }),
    // ビーフバーレースープ: 牛すねの角切り・押し麦・にんじん・セロリ・玉ねぎ、マッシュルーム（お好みで）
    us_beefbarley: p => W.soup(p, W.soupPlate(p), { c: '#a8642e', drop: 5, glow: .3, flecks: [['#f2e6c4', '#e8d8b0'], 80, 1.6], items: (pl, S) => [
        ...W.spots('bb', 7, 52, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.dice(p, x, y, 12, '#6a3a1e', 'bf' + i, { h: 7, top: Q.rg(p, [[0, '#a86a42'], [.6, '#7a4224'], [1, '#5a2c14']], .4, .35, .8) })]; }),
        ...W.spots('bbc', 8, 58, 14).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => i % 2 ? carrotCoin(p, x, y, 5, '#a8642e') : celery(p, x, y, 7, i * 40)]; }),
        ...W.spots('bbm', 3, 50, 22).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.mushSlice(p, x, y, 13, i * 30)]; }),
    ] }),
    // ミネストローネ: トマト・白いんげん・ズッキーニ・にんじん・セロリ・小さなパスタ、ほうれん草とパルメザン（お好みで）
    us_minestrone: p => W.soup(p, W.soupPlate(p), { c: '#c8542e', drop: 5, glow: .3, flecks: [['#fbf4dc', '#3f8a2a'], 26, 1.2], items: (pl, S) => [
        ...W.spots('mi', 22, 60, 9).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 5; return [y, () => k === 0 ? whiteBean(p, x, y, 8, r) : k === 1 ? Q.hangetsu(p, x, y, 6, r, '#5a9a3a', '#c8542e', { h: 2.4, top: Q.lit(p, '#e8f0c0', .3, .1) }) : k === 2 ? carrotCoin(p, x, y, 4.4, '#c8542e') : k === 3 ? W.coin(p, x, y, 3.4, '#f0d690', { h: 2.4, top: `#e8c878` }) + `<circle cx="${f(x)}" cy="${f(y - 2)}" r="1.4" fill="#c8542e"/>` : celery(p, x, y, 6, r)]; }),
        ...W.spots('mis', 4, 50, 22).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.leaf(p, x, y, 16, r, '#2f6a2a', 'ms' + i, { wave: 2 })]; }),
    ] }),
    // フレンチオニオンスープ: あめ色の玉ねぎのスープに、バゲットとグリュイエールをのせて焼く（取っ手つきの陶器）
    us_frenchonion: p => { const V = W.bowl(p, { outer: '#8a4a28', inner: '#e8d4b8', h: 52, cy: 80, rx: 86, fx: 40 }), cx = 100, cy = V.cy;
        const lug = side => `<path d="M${f(cx + side * 84)},${f(cy + 6)} q${side * 14},0 ${side * 14},8 q0,6 ${-side * 14},6Z" fill="${Q.lg(p, [[0, '#a8643a'], [1, '#6a3418']])}" stroke="#5a2c14" stroke-width=".6"/>`;
        const top = `M${f(cx - 80)},${f(cy + 2)} C${f(cx - 84)},${f(cy - 24)} ${f(cx - 30)},${f(cy - 34)} ${f(cx)},${f(cy - 30)} C${f(cx + 36)},${f(cy - 36)} ${f(cx + 86)},${f(cy - 20)} ${f(cx + 80)},${f(cy + 4)} Q${f(cx + 60)},${f(cy + 18)} ${f(cx + 40)},${f(cy + 12)} Q${f(cx + 20)},${f(cy + 26)} ${f(cx)},${f(cy + 14)} Q${f(cx - 24)},${f(cy + 26)} ${f(cx - 46)},${f(cy + 12)} Q${f(cx - 66)},${f(cy + 20)} ${f(cx - 80)},${f(cy + 2)}Z`;
        return lug(-1) + lug(1) + V.s + `<g ${V.above}><path d="${top}" fill="${Q.rg(p, [[0, '#fbe6a0'], [.45, '#f2c060'], [.8, '#d8902e'], [1, '#a8601e']], .4, .3, .8)}" stroke="#9a5a1e" stroke-width=".7"/>${W.flecks(p, cx, cy - 12, 60, 40, 'fo', ['#a8601e', '#c8782a', '#7a3e12'], { ry: 16, s: 1.8 })}<path d="M${f(cx - 50)},${f(cy - 14)} Q${f(cx - 30)},${f(cy - 28)} ${f(cx)},${f(cy - 26)}" stroke="#fff6d0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/></g>` + V.shine(.4); },
    // チキン＆ソーセージのガンボ: 濃い茶色のルウのスープに、鶏肉・スモークソーセージ・ピーマン・セロリ・オクラ（お好みで）、白いご飯
    us_gumbo: p => W.soup(p, W.bowl(p, { outer: '#e6dac4', inner: '#f4eee2' }), { c: '#7a3e1a', drop: 8, glow: .2, oil: 8, oilC: '#c87a2a', flecks: [['#3f8a2a', '#5aa83a'], 16, 1.2], items: (pl, S) => [
        [S.cy - 4, () => Q.riceDome(p, S.cx + 2, S.cy + 2, 26, 26 * SY, 16, { n: 200 })],
        ...[[-44, -6], [-30, 14], [40, -10], [30, 16], [-10, 22]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.sausageCoin(p, x, y, 7, { liq: '#7a3e1a' })]; }),
        ...[[-36, -22], [36, 4], [10, -24]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => chickenBit(p, x, y, 13, i, '#c8945a')]; }),
        ...[[-50, 8], [50, -2], [20, 26]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.coin(p, x, y, 4.4, '#4a8a2a', { h: 2, liq: '#7a3e1a', top: Q.rg(p, [[0, '#e8f0c8'], [.5, '#a8c870'], [1, '#4a8a2a']], .4, .35, .8) })]; }),
        ...[[-20, -16], [44, 18]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.pepperStrip(p, x, y, 9, i * 60, '#3f8a2a')]; }),
    ] }),
    // チキントルティーヤスープ: トマトのスープに鶏肉・黒豆・コーン、トルティーヤチップス・アボカド（お好みで）・ライム・パクチー
    us_tortillasoup: p => W.soup(p, W.bowl(p, { outer: '#c8603a', inner: '#f2e6d0' }), { c: '#c8542a', drop: 8, glow: .3, oil: 6, oilC: '#e87a2a', items: (pl, S) => [
        ...W.spots('tsb', 10, 56, 12).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => blackBean(p, x, y, 7, r)]; }),
        ...W.spots('tsk', 12, 56, 10).map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => W.kernel(p, x, y, 4.4)]; }),
        ...W.spots('tsc', 4, 46, 20).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => chickenBit(p, x, y, 12, i)]; }),
        ...[[-26, -14, -20], [-6, -18, 10], [14, -12, 40]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 6); return [y + 5, () => `<g ${T(x, y, r)}><path d="M-11,6 L0,-9 L11,6Z" fill="${Q.lg(p, [[0, '#fbe08a'], [1, '#d8a040']], 0, 0, 1, 1)}" stroke="#b8822a" stroke-width=".7"/>${W.flecks(p, 0, 1, 6, 5, 'tc' + i, '#c8902a', { ry: 3, s: .8 })}</g>`]; }),
        ...[[24, 8], [34, -4]].map(([u, v], i) => { const [x, y] = pl(u, v, 3); return [y + 5, () => W.dice(p, x, y, 9, '#7aa83a', 'av' + i, { h: 6, top: Q.rg(p, [[0, '#f0f4b0'], [.7, '#c8dc78'], [1, '#7aa83a']], .4, .35, .8) })]; }),
        [999, () => W.flecks(p, S.cx, S.cy, 46, 18, 'tsp', PARS, { ry: 18, s: 1.3 }) + W.lemon(p, S.cx + 48, S.cy + 8, 18, { wedge: true, rot: -20, c: '#8ab83a' })],
    ] }),
    // レンズ豆のスープ: 茶色のレンズ豆・にんじん・セロリ・玉ねぎ・トマト、ほうれん草（お好みで）
    us_lentil: p => W.soup(p, W.soupPlate(p), { c: '#a8642e', drop: 5, glow: .3, items: (pl, S) => [
        ...W.spots('le', 60, 62, 5).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.6" fill="${Q.rg(p, [[0, '#c8945a'], [1, '#7a4a22']], .35, .3, .8)}" stroke="#5a3418" stroke-width=".3"/>`]; }),
        ...W.spots('lec', 8, 56, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => i % 2 ? W.dice(p, x, y, 5.4, '#e8782a', 'lc' + i, { h: 2.4, sink: 1, liq: '#a8642e' }) : celery(p, x, y, 6, i * 50)]; }),
        ...W.spots('les', 4, 50, 22).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => Q.leaf(p, x, y, 16, r, '#2f6a2a', 'ls' + i, { wave: 2 })]; }),
    ] }),
    // バターナッツかぼちゃのスープ: 玉ねぎとかぼちゃを煮てなめらかに、生クリーム（お好みで）、かぼちゃの種（お好みで）
    us_butternut: p => W.soup(p, W.soupCup(p), { c: '#f0a040', drop: 6, glow: .35, cream: '#fbf2e4', items: (pl, S) => [[999, () => W.flecks(p, S.cx - 6, S.cy - 2, 22, 9, 'bns', ['#6a8a3a', '#8aa84a'], { ry: 6, s: 1.4, shape: 'seed' }) + W.flecks(p, S.cx, S.cy, 30, 10, 'bnc', '#a85a20', { ry: 10, s: .7 })]] }),
    // スタッフドペッパー・スープ: ひき肉・ピーマン・トマト・玉ねぎ・ご飯のスープ、チェダー（お好みで）
    us_stuffedpepper: p => W.soup(p, W.bowl(p, { outer: '#e6dac4', inner: '#f4eee2' }), { c: '#b8442a', drop: 8, glow: .3, items: (pl, S) => [
        [1, () => W.crumble(p, S.cx, S.cy + 2, S.rx * .7, S.rx * SY * .6, 46, 'spc', { c: '#7a3a1e' })],
        ...W.spots('spp', 9, 56, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.prism(p, x, y, [[-6, -4], [6, -5], [5, 4], [-5, 4]], 2.6, i % 2 ? '#3f8a2a' : '#d8302a', { rot: r, line: .45 })]; }),
        ...W.spots('spr', 30, 58, 6).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="1.2" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="#fbf6ea" stroke="#d8ccb4" stroke-width=".3"/>`]; }),
        [S.cy + 6, () => W.cheese(p, S.cx + 6, S.cy - 4, 22, 16, 'spch', { c: CHED })],
    ] }),
    // ソーセージ・じゃがいも・ケールのスープ: イタリアンソーセージとじゃがいもを煮てケールと生クリーム、パルメザン（お好みで）
    us_sausagekale: p => W.soup(p, W.soupPlate(p), { c: '#f0e0bc', drop: 5, glow: .4, oil: 8, oilC: '#e8902a', flecks: [['#c8281a', '#fbf4dc'], 16, 1], items: (pl, S) => [
        ...W.spots('skp', 7, 54, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 11, '#f2e2b0', 'sk' + i, { h: 5, sink: 2, liq: '#f0e0bc' })]; }),
        ...W.spots('sks', 8, 56, 16).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.lump(p, x, y, 6, 4.4, '#a8603a', 'ss' + i, { n: 8, jit: .4, hi: .4 })]; }),
        ...W.spots('skk', 7, 56, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y + .5, () => Q.leaf(p, x, y, 20, r, '#2f5a26', 'kk' + i, { wave: 4 })]; }),
    ] }),
    // ブラックビーン・スープ: 黒豆・赤ピーマン・にんじん・玉ねぎをクミンで煮て、サワークリーム（お好みで）・ライム・パクチー
    us_blackbean: p => W.soup(p, W.bowl(p, { outer: '#b8643a', inner: '#f2e6d0' }), { c: '#4a3026', drop: 8, glow: .2, items: (pl, S) => [
        ...W.spots('bk', 30, 60, 8).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => blackBean(p, x, y, 7.4, r)]; }),
        ...W.spots('bkr', 6, 52, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 5, i % 2 ? '#d8302a' : '#e8782a', 'br' + i, { h: 2 })]; }),
        [S.cy + 4, () => W.dollop(p, S.cx + 2, S.cy + 4, 22, SOUR)],
        [999, () => W.flecks(p, S.cx, S.cy, 40, 20, 'bkp', PARS, { ry: 16, s: 1.4 }) + W.lemon(p, S.cx + 48, S.cy + 8, 18, { wedge: true, rot: -20, c: '#8ab83a' })],
    ] }),
    // クリーム・オブ・マッシュルーム: マッシュルームと玉ねぎをバターで炒め、ブイヨンと生クリーム、パセリ
    us_mushroom: p => W.soup(p, W.soupCup(p), { c: '#c8a478', drop: 6, glow: .35, cream: '#f4ead4', items: (pl, S) => [
        ...[[-14, -8, -20], [8, -12, 10], [16, 4, 40]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.mushSlice(p, x, y, 13, r)]; }),
        [999, () => W.flecks(p, S.cx, S.cy, 26, 14, 'mrp', PARS, { ry: 8, s: 1.2 })],
    ] }),
    // イタリアン・ウェディングスープ: 小さな肉団子・アチーニ（オルゾ）・ほうれん草（エスカロール）・にんじんのスープ
    us_wedding: p => W.soup(p, W.soupPlate(p), { c: '#e8c87a', drop: 5, glow: .4, items: (pl, S) => [
        ...W.spots('wm', 9, 54, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.ball(p, x, y, 12, '#9a5a32', 'wm' + i)]; }),
        ...W.spots('wo', 40, 60, 6).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.3" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="#f6e4b0" stroke="#d8c088" stroke-width=".3"/>`]; }),
        ...W.spots('ws', 6, 56, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y + .5, () => Q.leaf(p, x, y, 18, r, '#2f6a2a', 'wsl' + i, { wave: 2 })]; }),
        ...W.spots('wc', 6, 58, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 4.6, '#e8782a', 'wc' + i, { h: 2, sink: 1, liq: '#e8c87a' })]; }),
    ] }),
};
// アスパラ（サーモンの添え物）
function asp(p, x, y, i){ return W.asparagus(p, x, y, 70, -6 + i * 1.5); }
const flecks = W.flecks;
