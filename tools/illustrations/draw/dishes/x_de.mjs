// Germany (de) — hand-composed redraw of soups, mains and sides (x_de)
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// =========================================================
// このファイル専用の部品（xde〜）。w_de.mjs から写したものと、新しく描いたもの
// =========================================================
const xdeBlur = (p, s = 2) => `filter="url(#${p.def('xdebl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const xdeShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .22)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .66)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;

function xdeSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xdespots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// 小さな粒をまとめて（色ごとに1本のpath）
function xdeGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, rx = 2, ry = 1.4, seed = 1, sy = 1, hi = 0, jitter = .3, stroke = .35 } = {}){
    const R = rng(p.id + 'xdg' + seed + x + y);
    const ds = cols.map(() => ''); let hs = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const ax = rx * (1 - jitter / 2 + R() * jitter), ay = ry * (1 - jitter / 2 + R() * jitter);
        ds[Math.floor(R() * cols.length)] += `M${f(gx - ax)},${f(gy)}a${f(ax)},${f(ay)} 0 1 0 ${f(ax * 2)},0a${f(ax)},${f(ay)} 0 1 0 ${f(-ax * 2)},0Z`;
        if (hi && R() < hi) hs += `M${f(gx - ax * .5)},${f(gy - ay * .35)}l${f(ax * .6)},${f(-ay * .2)}`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .3)}" stroke-width="${stroke}"/>`).join('') + (hs ? `<path d="${hs}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".8"/>` : '');
}
// 米粒（細長い粒、向きばらばら）
function xdeRiceGrains(p, x, y, s, { n = 40, seed = 1, cols = ['#fbf8ee', '#efe8d4'], sy = 1 } = {}){
    const R = rng(p.id + 'xdrg' + seed + x);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy, ang = R() * 3.14, L = 2.6;
        ds[i % cols.length] += `M${f(gx - Math.cos(ang) * L)},${f(gy - Math.sin(ang) * L)}L${f(gx + Math.cos(ang) * L)},${f(gy + Math.sin(ang) * L)}`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" stroke="${dk(c, .25)}" stroke-width="3.2" stroke-linecap="round"/><path d="${ds[i]}" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`).join('');
}
// さいの目
function xdeDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .3, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/></g>`;
}
// 刻みパセリ
function xdeHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'], sy = 1 } = {}){
    const R = rng(p.id + 'xdh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 1 + R(); ds[i % cols.length] += `M${f(cx - rr)},${f(cy)}l${f(rr)},${f(-rr * .8)}l${f(rr)},${f(rr * .8)}l${f(-rr * .6)},${f(rr)}Z`; }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// 小口切りのシュニットラウフ
function xdeChives(p, x, y, s, { n = 14, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xdc' + seed + x + y);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy; const seg = `M${f(cx - 1.6)},${f(cy)}a1.6,1.4 0 1 0 3.2,0a1.6,1.4 0 1 0 -3.2,0Z`; if (R() < .6) d1 += seg; else d2 += seg; }
    return `<path d="${d1}" fill="none" stroke="#4f9a34" stroke-width="1.1"/><path d="${d2}" fill="none" stroke="#7ab850" stroke-width="1.1"/>`;
}
// ディル
function xdeDill(p, x, y, L, r = 0){
    let d = `M${-L / 2},0 Q0,${f(-L * .06)} ${L / 2},0`;
    for (let i = 0; i < 7; i++){ const t = -L / 2 + (i + .7) * L / 8; d += `M${f(t)},${f(-L * .02)} l${f(L * .1)},${f(-L * .16)} M${f(t)},${f(-L * .02)} l${f(L * .1)},${f(L * .14)}`; }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#3f7f2a" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`;
}
// ローリエ
function xdeBay(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-2,-6 10,0 Q-2,6 -10,0Z" fill="${p.g('#6f8a43', .25, .25)}" stroke="#4a5f2a" stroke-width=".6"/><path d="M-9,0 L9,0" stroke="#a8bb7a" stroke-width=".7"/></g>`;
}
// クリームのうず
function xdeSwirl(p, x, y, R, { turns = 1.6, c = '#fffaf0', w = 4, op = .9, start = 0 } = {}){
    const pts = [];
    for (let i = 0; i <= 26; i++){ const t = i / 26, a = start + t * turns * 6.28, rr = R * (.12 + t * .88); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]); }
    const d = smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .12)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity="${f(op * .4)}" transform="translate(.6 .9)"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// ソーセージの輪切り
function xdeWurstSlice(p, x, y, s, r = 0, { skin = '#b8583a', meat = '#eaa294' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.g(skin, .2, .25)}" stroke="${dk(skin, .3)}" stroke-width=".6"/></g>
        <ellipse rx="${f(s / 2 - 1.5)}" ry="${f(s * .46 - 1.5)}" fill="${p.rg(meat, .15, .15)}"/>
        <path d="M${f(-s * .26)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .28)} ${f(s * .12)},${f(-s * .26)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 半月切りのポロねぎ
function xdeLeek(p, x, y, s, r = 0, { c = '#e4eec0', edge = '#8fb05a' } = {}){
    return `<g ${T(x, y, r)}><path d="M${-s / 2},0 A${s / 2},${f(s * .44)} 0 0 1 ${s / 2},0 Z" fill="${p.g(c, .2, .2)}" stroke="${edge}" stroke-width=".9"/>
        <path d="M${f(-s * .32)},0 A${f(s * .32)},${f(s * .28)} 0 0 1 ${f(s * .32)},0 M${f(-s * .16)},0 A${f(s * .16)},${f(s * .14)} 0 0 1 ${f(s * .16)},0" fill="none" stroke="${lt(edge, .2)}" stroke-width=".8"/></g>`;
}
// 輪切りのポロねぎ（リング）
function xdeLeekRing(p, x, y, s, { c = '#dfeab4', edge = '#7fa64a' } = {}){
    return `<g ${T(x, y)}><circle r="${s / 2}" fill="${p.g(c, .25, .2)}" stroke="${edge}" stroke-width="1"/><circle r="${f(s * .32)}" fill="none" stroke="${lt(edge, .25)}" stroke-width=".9"/><circle r="${f(s * .15)}" fill="${lt(c, .3)}" stroke="${lt(edge, .35)}" stroke-width=".7"/></g>`;
}
// マッシュルームの薄切り
function xdeMush(p, x, y, s, r = 0, { c = '#e3d2b4' } = {}){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-10,-8 0,-9 Q10,-8 10,0 Q6,1 3,1 L3,8 Q0,9.4 -3,8 L-3,1 Q-6,1 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M-8,-1 Q-7,-6 0,-7 Q7,-6 8,-1" stroke="${lt(c, .35)}" stroke-width="1" fill="none"/></g>`;
}
// ゆでた皮むきじゃがいも
function xdePotato(p, x, y, s, r = 0, { c = '#f0d080', seed = 1, sy = .76 } = {}){
    const R = rng(p.id + 'xdp' + seed + x + y);
    const pts = ring(s / 2, 9, .14, R, 1, sy);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.rg(c, .3, .28, .36, .32)}" stroke="${dk(c, .28)}" stroke-width=".7"/></g>
        <circle cx="${f(s * .18)}" cy="${f(s * .08)}" r="1" fill="${dk(c, .3)}" opacity=".5"/><circle cx="${f(-s * .1)}" cy="${f(s * .18)}" r=".8" fill="${dk(c, .3)}" opacity=".4"/>
        <path d="M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .12)},${f(-s * .3)} ${f(s * .14)},${f(-s * .27)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// じゃがいもの薄い輪切り（brown で縁から焼き色）
function xdePotSlice(p, x, y, s, r = 0, { c = '#f0d58a', seed = 1, brown = 0 } = {}){
    const R = rng(p.id + 'xdps' + seed + x + y);
    const sh = smooth(ring(s / 2, 7, .08, R, 1, .78));
    if (brown){
        const a = R() * 6.28;
        return `<g ${T(x, y, r)}><path d="${sh}" fill="${p.g(c, .3, .25)}" stroke="${mix('#b8661e', c, .3 - brown * .3)}" stroke-width="${f(1 + brown * 1.4)}"/>
        <ellipse cx="${f(Math.cos(a) * s * .22)}" cy="${f(Math.sin(a) * s * .15)}" rx="${f(s * .2)}" ry="${f(s * .12)}" fill="#b8661e" opacity="${f(brown * .4)}" ${xdeBlur(p, 1.6)}/>
        <path d="M${f(-s * .26)},${f(-s * .12)} Q${f(-s * .05)},${f(-s * .26)} ${f(s * .18)},${f(-s * .2)}" stroke="#fff6d8" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${sh}" fill="${p.rg(c, .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="${smooth(ring(s * .36, 8, .1, R, 1, .7))}" fill="none" stroke="${lt(c, .3)}" stroke-width=".8" opacity=".7"/>
        <path d="M${f(-s * .26)},${f(-s * .1)} Q${f(-s * .05)},${f(-s * .26)} ${f(s * .18)},${f(-s * .2)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// 白い皿（縁に色の線）
function xdePlate(p, rim = '#4a6a52'){ return K.plate(p, { rim }); }
// 白い深皿（内側に色の線）
function xdeSoupPlate(p, line = '#4a6a52', { glaze = '#f3efe6', inside = '#fbf8f1' } = {}){
    return K.bowl(p, { glaze, inside }) + `<circle cx="100" cy="100" r="80" fill="none" stroke="${line}" stroke-width="1.8" opacity=".85"/>`;
}
// ヴェスターヴァルト焼き風の灰色の器
function xdeStoneBowl(p, { R = 93 } = {}){
    const dots = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28; return `<circle cx="${f(100 + Math.cos(a) * (R - 6))}" cy="${f(100 + Math.sin(a) * (R - 6))}" r="1.8" fill="#2f4f8f" opacity=".85"/>`; }).join('');
    return K.bowl(p, { glaze: '#a9aca6', inside: '#efece4', R, lip: .84 }) + `<circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="#2f4f8f" stroke-width="2" opacity=".9"/>${dots}<circle cx="100" cy="100" r="${f(R * .84 + 1.5)}" fill="none" stroke="#2f4f8f" stroke-width="1.6" opacity=".8"/>`;
}
// ガラスの鉢
function xdeGlassBowl(p){
    return `<g ${p.sh(1.4)}><circle cx="100" cy="100" r="93" fill="${p.rg('#e4eef0', .3, .12, .35, .3)}" opacity=".95"/></g>
        <circle cx="100" cy="100" r="91" fill="none" stroke="#c5d6da" stroke-width="2"/>
        <circle cx="100" cy="100" r="80" fill="${p.rg('#f2f7f7', .1, .1, .6, .62)}"/>
        <circle cx="100" cy="100" r="80" fill="none" stroke="#d2e0e3" stroke-width="1.2"/>
        <path d="M30,64 A82,82 0 0 1 64,28" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 鉄のフライパン（右に柄）
function xdeSkillet(p, { c = '#3b3533' } = {}){
    return `<g ${p.sh(1.6)}><rect x="160" y="92" width="40" height="16" rx="6" fill="${p.g(c, .2, .3)}"/><circle cx="100" cy="100" r="88" fill="${p.rg(c, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="78" fill="${p.rg(dk(c, .25), .08, .2, .62, .64)}"/>
        <path d="M30,66 A80,80 0 0 1 66,30" stroke="#8a827c" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// ほうろうの両手鍋（左右に取っ手）
function xdePot(p, { c = '#b8352a', inside = '#f1ebe0' } = {}){
    return `<g ${p.sh(1.6)}><rect x="0" y="88" width="28" height="24" rx="9" fill="${p.g(c, .25, .3)}"/><rect x="172" y="88" width="28" height="24" rx="9" fill="${p.g(c, .25, .3)}"/><circle cx="100" cy="100" r="86" fill="${p.rg(c, .25, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#2a2420" stroke-width="2" opacity=".55"/>
        <circle cx="100" cy="100" r="78" fill="${p.rg(inside, .1, .3, .62, .64)}"/>
        <path d="M32,62 A80,80 0 0 1 62,32" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// 角のグラタン皿（耐熱の白／クリーム）
function xdeBaker(p, { w = 176, h = 140, c = '#f1ede4', rim = '#c8b896' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.6)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${p.rg(c, .2, .14, .35, .3)}"/></g>
        <rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="19" fill="none" stroke="${rim}" stroke-width="1.4" opacity=".7"/>
        <rect x="${x + 11}" y="${y + 11}" width="${w - 22}" height="${h - 22}" rx="14" fill="${p.rg(dk(c, .06), .06, .2, .6, .6)}"/>
        <path d="M${x + 12},${y + 34} Q${x + 12},${y + 10} ${x + 36},${y + 10}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// レモンの輪切り
function xdeLemonWheel(p, x, y, s){
    const seg = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28; return `<path d="M0,0 L${f(Math.cos(a) * s * .38)},${f(Math.sin(a) * s * .38)}" stroke="#fffbe0" stroke-width="1.2"/>`; }).join('');
    return `<g ${T(x, y)}><g ${p.sh(.6)}><circle r="${s / 2}" fill="#eec22a"/></g><circle r="${f(s / 2 - 1.8)}" fill="#fbf2c4"/><circle r="${f(s / 2 - 3.2)}" fill="${p.rg('#f8e070', .3, .1)}"/>${seg}<circle r="${f(s * .06)}" fill="#fff8d8"/></g>`;
}
// パセリの小枝
function xdeParsleySprig(p, x, y, s){
    return `<g ${p.sh(.5)}><path d="M${x},${y} l${f(s * .4)},${f(s * .5)}" stroke="#4f8a2c" stroke-width="1.4"/>${[0, 1, 2, 3, 4].map(i => { const a = -2.4 + i * .55; return `<circle cx="${f(x + Math.cos(a) * s * .3)}" cy="${f(y + Math.sin(a) * s * .3)}" r="${f(s * .2)}" fill="${i % 2 ? '#3d8a2c' : '#4fa03a'}"/>`; }).join('')}<circle cx="${x}" cy="${y}" r="${f(s * .2)}" fill="#45952f"/></g>`;
}
// フライドポテト
function xdeFries(p, x, y, s, { n = 11, seed = 1, dir = 30 } = {}){
    const R = rng(p.id + 'xdfr' + seed);
    let out = '';
    for (let i = 0; i < n; i++){ const L = s * (.5 + R() * .45), cx = x + (R() - .5) * s * .5, cy = y + (R() - .5) * s * .5, a = dir + (R() - .5) * 70; out += `<g ${T(cx, cy, a)}><rect x="${f(-L / 2)}" y="-3" width="${f(L)}" height="6" rx="1.6" fill="${p.g('#efc25a', .3, .25)}" stroke="#b9852a" stroke-width=".6"/><path d="M${f(-L / 2 + 2)},-1.4 L${f(L / 2 - 3)},-1.4" stroke="#fff4c8" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`; }
    return `<g ${p.sh(.8)}>${out}</g>`;
}
// ひと盛り（マスタード・クワルク・レムラード）
function xdeDollop(p, x, y, s, { c = '#d9a420', seed = 1, sy = .9 } = {}){
    const R = rng(p.id + 'xdmu' + x + y + seed);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(ring(s / 2, 9, .28, R, 1.15, sy))}" fill="${p.rg(c, .3, .22)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path ${T(x, y)} d="M${f(-s * .1)},${f(s * .05)} q${f(s * .12)},${f(-s * .2)} ${f(s * .24)},${f(-s * .02)}" stroke="${dk(c, .15)}" stroke-width="1" fill="none" opacity=".5"/>
        <ellipse cx="${f(x - s * .17)}" cy="${f(y - s * .16)}" rx="${f(s * .16)}" ry="${f(s * .08)}" fill="#fff" opacity=".75"/>`;
}
// 細切りの具をまとめて
function xdeShreds(p, x, y, s, { cols = ['#f1f4dc'], n = 60, w = 2, len = 12, seed = 1, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'xdsh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, ang = R() * 3.14, L = len * (.6 + R() * .7), b = (R() - .5) * L * .5;
        ds[Math.floor(R() * cols.length)] += `M${f(cx - Math.cos(ang) * L / 2)},${f(cy - Math.sin(ang) * L / 2)} q${f(Math.cos(ang) * L / 2 - Math.sin(ang) * b)},${f(Math.sin(ang) * L / 2 + Math.cos(ang) * b)} ${f(Math.cos(ang) * L)},${f(Math.sin(ang) * L)}`;
    }
    return cols.map((c, i) => (outline ? `<path d="${ds[i]}" stroke="${dk(c, .3)}" stroke-width="${w + .9}" fill="none" stroke-linecap="round"/>` : '') + `<path d="${ds[i]}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`).join('');
}
// 浮いた油の粒
function xdeOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'xdoil' + seed + x);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        a1 += `M${f(cx - rr)},${f(cy)}a${f(rr)},${f(rr)} 0 1 0 ${f(rr * 2)},0a${f(rr)},${f(rr)} 0 1 0 ${f(-rr * 2)},0Z`;
        a2 += `M${f(cx - rr * .55)},${f(cy - rr * .35)}a${f(rr * .3)},${f(rr * .3)} 0 1 0 ${f(rr * .6)},0a${f(rr * .3)},${f(rr * .3)} 0 1 0 ${f(-rr * .6)},0Z`;
    }
    return `<path d="${a1}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><path d="${a2}" fill="#fff" opacity=".7"/>`;
}
// クルトン
function xdeCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g>
        <rect x="${f(-s / 2 + s * .18)}" y="${f(-s / 2 + s * .18)}" width="${f(s * .5)}" height="${f(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
// ベーコンの角切り（赤身と脂の層）
function xdeSpeck(p, x, y, s, r = 0, { c = '#c0583e', fat = '#f3dcc4', brown = 0 } = {}){
    const col = brown ? mix(c, '#8a3a1a', brown) : c;
    return `<g ${T(x, y, r)}><rect x="${f(-s / 2)}" y="${f(-s * .38)}" width="${s}" height="${f(s * .76)}" rx="${f(s * .16)}" fill="${p.g(col, .25, .25)}" stroke="${dk(col, .35)}" stroke-width=".5"/>
        <rect x="${f(-s / 2 + .8)}" y="${f(-s * .06)}" width="${f(s - 1.6)}" height="${f(s * .2)}" rx="1" fill="${fat}" opacity=".95"/></g>`;
}
// 粗挽きの黒こしょう・ナツメグ・パプリカの粉
const xdeDust = (p, x, y, s, c, n = 16, r = .6) => K.sprinkle(p, x, y, s, { c, n, r });


// ひき肉のそぼろ（粒をまとめた軽いpath）
const xdeMince = (p, x, y, s, { c = '#7a4a2a', n = 40, seed = 1 } = {}) => xdeGrains(p, x, y, s, { cols: [c, dk(c, .25), lt(c, .12)], n, rx: 2, ry: 1.6, seed, jitter: .7, stroke: .2 });
// 麺（同じ線を <use> で縁と中身の2回描き、SVG を軽くする）
function xdeNoodles(p, x, y, s, { c = '#f2d27a', w = 5, n = 30, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xdnd' + seed);
    const ds = ['', ''];
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.2 + R() * .78), a0 = R() * 6.28, sweep = 1.2 + R() * 2.2;
        const cx = x + (R() - .5) * s * .12, cy = y + (R() - .5) * s * .12;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .25); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        ds[i % 2] += smooth(pts, false);
    }
    const id = p.uid();
    return `<g ${p.sh(.8)}>${ds.map((d, i) => `<path id="${id}${i}" d="${d}"/>`).join('').replace(/^/, '<defs>') + '</defs>'}${ds.map((d, i) => `<use href="#${id}${i}" stroke="${dk(c, .28)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round"/><use href="#${id}${i}" stroke="${i ? lt(c, .15) : c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
}
// フェルトザラートのロゼットをまとめて（葉は色ごとに1本のpath）
function xdeRosettes(p, spots, { c = '#2f6a22' } = {}){
    const ds = ['', ''], rib = [];
    spots.forEach(([x, y, r, s], k) => {
        for (let i = 0; i < 6; i++){
            const a = (i * 60 + r) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
            const P = (u, v) => `${f(x + u * ca - v * sa)},${f(y + u * sa + v * ca)}`;
            ds[(i + k) % 2] += `M${P(0, 0)}Q${P(s * .1, -s * .06)} ${P(s * .22, -s * .1)}Q${P(s * .48, -s * .2)} ${P(s * .5, 0)}Q${P(s * .48, s * .2)} ${P(s * .22, s * .1)}Q${P(s * .1, s * .06)} ${P(0, 0)}Z`;
            rib.push(`M${P(s * .06, 0)}L${P(s * .42, 0)}`);
        }
    });
    return `<g ${p.sh(.6)}><path d="${ds[0]}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".5"/><path d="${ds[1]}" fill="${p.g(lt(c, .14), .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".5"/></g><path d="${rib.join('')}" stroke="${lt(c, .35)}" stroke-width=".7"/>`;
}

// ---- 肉 ----
// 煮込んだ牛肉の薄切り（ザウアーブラーテン）: 外側に濃い焼き色、中は赤茶の繊維
function xdeRoastSlice(p, x, y, w, h, r = 0, { c = '#9c5c3e', crust = '#4c2414', seed = 1 } = {}){
    const R = rng(p.id + 'xrs' + seed + x + y);
    const pts = ring(1, 12, .1, R, w / 2, h / 2);
    let fib = '';
    for (let i = 0; i < 5; i++){ const yy = -h * .3 + i * h * .15; fib += `M${f(-w * .36)},${f(yy)} q${f(w * .18)},${f((R() - .5) * 4)} ${f(w * .36)},${f((R() - .5) * 2)} t${f(w * .34)},${f((R() - .5) * 3)}`; }
    return `<g ${T(x, y, r)}><path d="${smooth(pts)}" fill="${p.g(crust, .18, .3)}" stroke="${dk(crust, .35)}" stroke-width=".8"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .84, b * .78]))}" fill="${p.g(c, .22, .25)}"/>
        <path d="${fib}" stroke="${dk(c, .3)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M${f(-w * .3)},${f(-h * .28)} Q${f(-w * .05)},${f(-h * .4)} ${f(w * .22)},${f(-h * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 皮つき豚肩ローストの切り身（上の縁に格子に切れ目を入れたカリカリの皮、脂の層、淡い肉）
function xdeCrackleSlice(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcs' + seed + x);
    const cr = h * .32, n = 7;
    const top = Array.from({ length: n }, (_, i) => [-w / 2 + i * w / (n - 1), -h / 2 + (i === 0 || i === n - 1 ? 3 : 0) + (R() - .5) * 2.4]);
    const bot = [[w / 2 - 1, h * .1], [w / 2 - 4, h / 2 - 1], [w * .1, h / 2 + 1], [-w / 2 + 4, h / 2 - 2], [-w / 2 + 1, h * .1]];
    const body = smooth([...top, ...bot], true, .8);
    const crust = smooth([...top, ...top.slice().reverse().map(([a, b]) => [a * .97, b + cr])], true, .6);
    const fat = smooth(top.map(([a, b]) => [a * .97, b + cr + 1.6]), false);
    let sc = '';
    for (let i = 1; i < 7; i++){ const xx = -w / 2 + i * w / 7; sc += `M${f(xx - 2)},${f(-h / 2 + 2)} l3,${f(cr - 3)}`; }
    let bub = '';
    for (let i = 0; i < 8; i++) bub += `<ellipse cx="${f(-w / 2 + 5 + R() * (w - 10))}" cy="${f(-h / 2 + 3 + R() * (cr - 5))}" rx="${f(1.2 + R() * 1.4)}" ry="${f(.9 + R() * .8)}" fill="#f8dc9a" opacity=".85"/>`;
    let fib = '';
    for (let i = 0; i < 3; i++){ const yy = -h / 2 + cr + 6 + i * (h - cr - 10) / 3; fib += `M${f(-w * .4)},${f(yy)} q${f(w * .2)},${f((R() - .5) * 3)} ${f(w * .4)},0 t${f(w * .36)},0`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${body}" fill="${p.g('#dcae8a', .25, .25)}" stroke="#9a6644" stroke-width=".8"/></g>
        <path d="${fib}" stroke="#b07a58" stroke-width=".8" fill="none" opacity=".55"/>
        <path d="${fat}" stroke="#f6e6c4" stroke-width="3.6" fill="none" stroke-linecap="round"/>
        <g ${p.crumb(.55)}><path d="${crust}" fill="${p.g('#c07428', .35, .38)}" stroke="#7a3e12" stroke-width=".7"/></g>
        <path d="${sc}" stroke="#6a3410" stroke-width="1.1" opacity=".7"/>${bub}
        <path d="M${f(-w * .36)},${f(-h / 2 + 3)} L${f(w * .1)},${f(-h / 2 + 2)}" stroke="#fff3d0" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        <path d="M${f(-w * .3)},${f(h * .18)} Q0,${f(h * .1)} ${f(w * .24)},${f(h * .2)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".4"/></g>`;
}
// 牛肉のルラーデ（ひもで巻いた円筒、濃い焼き色）
function xdeRoulade(p, x, y, L, W, r = 0, { c = '#6e3818', seed = 1 } = {}){
    const R = rng(p.id + 'xrl' + seed + x);
    let sp = '';
    for (let i = 0; i < 5; i++) sp += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * W * .5)}" rx="${f(L * (.06 + R() * .07))}" ry="${f(W * (.1 + R() * .1))}" fill="${dk(c, .45)}" opacity=".55"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${W / 2}" fill="${p.g(c, .28, .35)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <g ${xdeBlur(p, 1.8)}>${sp}</g>
        <path d="M${f(-L * .4)},${f(-W * .1)} Q0,${f(-W * .2)} ${f(L * .4)},${f(-W * .08)} M${f(-L * .36)},${f(W * .18)} Q0,${f(W * .1)} ${f(L * .38)},${f(W * .2)}" stroke="${dk(c, .35)}" stroke-width=".8" fill="none" opacity=".5"/>
        ${[-.2, .2].map(t => `<path d="M${f(L * t - 2)},${f(-W / 2 + .5)} Q${f(L * t + 1.5)},0 ${f(L * t - 1)},${f(W / 2 - .5)}" stroke="${dk('#efe2c6', .3)}" stroke-width="2.4" fill="none"/><path d="M${f(L * t - 2)},${f(-W / 2 + .5)} Q${f(L * t + 1.5)},0 ${f(L * t - 1)},${f(W / 2 - .5)}" stroke="#f4ead2" stroke-width="1.4" fill="none"/>`).join('')}
        <path d="M${f(-L * .36)},${f(-W * .3)} Q0,${f(-W * .46)} ${f(L * .3)},${f(-W * .3)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// ルラーデの断面（うずまきに、ベーコン・きゅうりのピクルス・マスタード）
function xdeRouladeCut(p, x, y, s, r = 0){
    const sp = [];
    for (let i = 0; i <= 30; i++){ const t = i / 30, a = t * 2.4 * 6.28, rr = s * .44 * (.14 + t * .86); sp.push([Math.cos(a) * rr, Math.sin(a) * rr * .9]); }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.g('#5e2c12', .25, .3)}" stroke="#3a1a08" stroke-width=".8"/></g>
        <ellipse rx="${f(s * .44)}" ry="${f(s * .4)}" fill="${p.rg('#a45a3a', .2, .25)}"/>
        <path d="${smooth(sp, false)}" stroke="#d98a8a" stroke-width="2.2" fill="none" opacity=".75"/>
        <path d="${smooth(sp.map(([a, b]) => [a * 1.08, b * 1.08]), false)}" stroke="#5a2a12" stroke-width="1.4" fill="none" opacity=".8"/>
        <path d="${smooth(sp.map(([a, b]) => [a * .9, b * .9]), false)}" stroke="#d8a830" stroke-width=".9" fill="none" opacity=".8"/>
        <ellipse cx="1" cy="0" rx="${f(s * .12)}" ry="${f(s * .09)}" fill="#6a8a2a" stroke="#3f5a16" stroke-width=".6"/><ellipse cx="1" cy="0" rx="${f(s * .06)}" ry="${f(s * .04)}" fill="#c8d488"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .14)},${f(-s * .32)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 骨つきポークチョップ（脂の縁、焼き色、白い骨）
function xdeChop(p, x, y, s, r = 0, { c = '#c07a40', seed = 1 } = {}){
    const R = rng(p.id + 'xch' + seed + x);
    const u = [[-.95, -.05], [-.72, -.55], [-.15, -.72], [.45, -.6], [.88, -.18], [.86, .3], [.45, .58], [-.08, .5], [-.5, .62], [-.86, .36]];
    const pts = u.map(([a, b]) => [a * s / 2, b * s / 2 * .8]);
    let sp = '';
    for (let i = 0; i < 6; i++) sp += `<ellipse cx="${f((R() - .4) * s * .6)}" cy="${f((R() - .5) * s * .35)}" rx="${f(s * (.06 + R() * .07))}" ry="${f(s * (.04 + R() * .05))}" fill="${dk(c, .5)}" opacity=".5"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${smooth(pts)}" fill="${p.g('#efd49a', .2, .25)}" stroke="#b9904a" stroke-width=".8"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .86 + s * .03, b * .8 + s * .03]))}" fill="${p.g(c, .28, .32)}"/>
        <g ${xdeBlur(p, 2)}>${sp}</g>
        <path d="M${f(-s * .44)},${f(-s * .02)} q${f(s * .1)},${f(-s * .08)} ${f(s * .2)},${f(-s * .02)}" stroke="#f3ead6" stroke-width="${f(s * .1)}" stroke-linecap="round" fill="none"/>
        <path d="M${f(-s * .44)},${f(-s * .02)} q${f(s * .1)},${f(-s * .08)} ${f(s * .2)},${f(-s * .02)}" stroke="#cdbb98" stroke-width=".6" fill="none" transform="translate(0 ${f(s * .04)})"/>
        <path d="M${f(-s * .1)},${f(-s * .22)} Q${f(s * .1)},${f(-s * .32)} ${f(s * .3)},${f(-s * .22)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 鶏もも（骨つき1本: もも＋すね、皮はパプリカでこんがり）
function xdeChickenLeg(p, x, y, s, r = 0, { c = '#c7702c', seed = 1 } = {}){
    const R = rng(p.id + 'xcl' + seed + x);
    const k = s / 60;
    const body = 'M-28,-4 C-30,-18 -14,-24 -2,-20 C8,-17 14,-10 14,-4 C18,-3 26,-5 30,-6 C34,-7 36,-2 34,2 C36,5 33,9 29,7 C24,6 18,5 14,6 C12,14 2,20 -10,19 C-22,18 -28,10 -28,-4Z';
    let bl = '';
    for (let i = 0; i < 7; i++) bl += `<ellipse cx="${f(-24 + R() * 34)}" cy="${f(-14 + R() * 26)}" rx="${f(2 + R() * 3)}" ry="${f(1.4 + R() * 2)}" fill="${R() < .5 ? dk(c, .45) : lt(c, .35)}" opacity=".55"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1.1)}><path d="${body}" fill="${p.g(c, .3, .36)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g>
        <g ${xdeBlur(p, 1.5)}>${bl}</g>
        <path d="M29,-6.5 C34,-8 37,-2 34,2 C37,5 33,10 28.5,7.5" fill="#f2e6cc" stroke="#c6b08a" stroke-width=".8"/>
        <path d="M-20,-14 Q-8,-21 6,-14" stroke="#fff4dc" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M14,-2 Q20,-3.6 26,-3" stroke="#fff4dc" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// キャベツロール（葉の筋、焼き色、ひも）
function xdeCabbageRoll(p, x, y, L, W, r = 0, { c = '#cbbf72', seed = 1 } = {}){
    const R = rng(p.id + 'xcr' + seed + x);
    let br = '';
    for (let i = 0; i < 5; i++) br += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * W * .5)}" rx="${f(L * (.07 + R() * .08))}" ry="${f(W * (.12 + R() * .1))}" fill="#9a6420" opacity=".6"/>`;
    let veins = '';
    for (let i = 0; i < 5; i++){ const xx = -L * .38 + i * L * .19; veins += `M${f(xx)},${f(-W * .42)} Q${f(xx + L * .08)},0 ${f(xx + L * .02)},${f(W * .42)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${f(W * .46)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>
        <g ${xdeBlur(p, 2)}>${br}</g>
        <path d="${veins}" stroke="${lt(c, .5)}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${f(-L * .44)},${f(-W * .1)} Q${f(-L * .3)},${f(W * .3)} ${f(-L * .1)},${f(W * .44)}" stroke="${dk(c, .3)}" stroke-width=".9" fill="none" opacity=".6"/>
        <path d="M2,${f(-W / 2 + .5)} Q5,0 1,${f(W / 2 - .5)}" stroke="#f4ead2" stroke-width="1.5" fill="none"/>
        <path d="M${f(-L * .34)},${f(-W * .28)} Q0,${f(-W * .44)} ${f(L * .3)},${f(-W * .3)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 肉詰めパプリカ（上から: 4つのふくらみ、切り口からひき肉とご飯、とろけたチーズ）
function xdeStuffedPepper(p, x, y, s, r = 0, { c = '#d8301e', seed = 1, cheese = true } = {}){
    const R = rng(p.id + 'xsp' + seed + x);
    const pts = Array.from({ length: 24 }, (_, i) => { const a = i / 24 * 6.28, rr = s / 2 * (1 + .07 * Math.cos(a * 4) + (R() - .5) * .04); return [Math.cos(a) * rr, Math.sin(a) * rr * .94]; });
    const o = s * .3;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".9"/></g>
        ${[0, 1, 2, 3].map(i => { const a = i * 1.57 + .785; return `<path d="M${f(Math.cos(a) * o)},${f(Math.sin(a) * o)} L${f(Math.cos(a) * s * .48)},${f(Math.sin(a) * s * .45)}" stroke="${dk(c, .3)}" stroke-width="1.2" opacity=".45"/>`; }).join('')}
        <path d="M${f(-s * .36)},${f(-s * .1)} Q${f(-s * .3)},${f(-s * .34)} ${f(-s * .08)},${f(-s * .4)}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".65"/>
        <ellipse rx="${f(o + 2)}" ry="${f(o * .94 + 2)}" fill="${lt(c, .2)}" stroke="${dk(c, .2)}" stroke-width=".8"/>
        <ellipse rx="${f(o)}" ry="${f(o * .94)}" fill="${p.rg('#8a4a2a', .2, .3)}"/>
        ${xdeMince(p, 0, 0, o * 1.7, { c: '#7a4226', n: 22, seed })}
        ${xdeRiceGrains(p, 0, 0, o * 1.6, { n: 8, seed })}
        ${cheese ? `<path d="${smooth(ring(o * .8, 9, .35, R, 1, .9))}" fill="${p.rg('#f6d470', .2, .15)}" opacity=".95"/><ellipse cx="${f(-o * .25)}" cy="${f(-o * .25)}" rx="${f(o * .25)}" ry="${f(o * .12)}" fill="#fff" opacity=".6"/>` : ''}</g>`;
}
// ブラートヴルストのぶつ切り（焼き色の皮、切り口は淡い）
function xdeWurstChunk(p, x, y, L, W, r = 0){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${f(W * .3)}" fill="${p.g('#b4673a', .3, .3)}" stroke="#7a3a1a" stroke-width=".6"/>
        <ellipse cx="${f(-L / 2 + 1.6)}" cy="0" rx="2" ry="${f(W / 2 - 1)}" fill="#ecc8a8"/><ellipse cx="${f(L / 2 - 1.6)}" cy="0" rx="2" ry="${f(W / 2 - 1)}" fill="#e2b898"/>
        <path d="M${f(-L * .3)},${f(-W * .22)} L${f(L * .3)},${f(-W * .22)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".55"/></g>`;
}
// 白身魚の衣揚げ（ビール衣でふくらんだ、こぶのある金色）
function xdeBattered(p, x, y, L, W, r = 0, { c = '#dca24a', seed = 1 } = {}){
    const R = rng(p.id + 'xbt' + seed + x);
    const pts = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.28, taper = Math.cos(a) > 0 ? 1 - .25 * Math.abs(Math.sin(a)) * 0 : 1; return [Math.cos(a) * L / 2 * (1 + (R() - .5) * .1), Math.sin(a) * W / 2 * (1 + (R() - .5) * .16) * (Math.cos(a) > .3 ? .8 : 1) * taper]; });
    let bub = '';
    for (let i = 0; i < 8; i++) bub += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * W * .55)}" rx="${f(L * (.05 + R() * .05))}" ry="${f(W * (.08 + R() * .08))}" fill="${lt(c, .4)}" opacity=".75"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.rough(3, .08)}><path d="${smooth(pts)}" fill="${p.g(c, .32, .34)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g></g>
        <g ${p.crumb(.6)}><path d="${smooth(pts.map(([a, b]) => [a * .92, b * .9]))}" fill="${c}" opacity=".5"/></g>
        <g ${xdeBlur(p, 1.6)}>${bub}</g>
        <path d="M${f(-L * .32)},${f(-W * .22)} Q${f(-L * .05)},${f(-W * .4)} ${f(L * .22)},${f(-W * .3)}" stroke="#fff6dc" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// マチェスの切り身（銀青の皮、ピンクがかった身）
function xdeHerring(p, x, y, L, W, r = 0){
    const body = `M${-L / 2},0 C${f(-L * .36)},${f(-W * .6)} ${f(L * .2)},${f(-W * .62)} ${L / 2},${f(-W * .08)} C${f(L * .2)},${f(W * .5)} ${f(-L * .36)},${f(W * .55)} ${-L / 2},0Z`;
    const skin = `M${-L / 2},0 C${f(-L * .36)},${f(-W * .6)} ${f(L * .2)},${f(-W * .62)} ${L / 2},${f(-W * .08)} C${f(L * .2)},${f(W * .05)} ${f(-L * .3)},${f(W * .12)} ${-L / 2},0Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${body}" fill="${p.g('#d9a69a', .25, .25)}" stroke="#a87268" stroke-width=".7"/></g>
        <path d="${skin}" fill="${p.g('#8ea0b4', .4, .35)}"/>
        <path d="M${f(-L * .44)},${f(-W * .02)} C${f(-L * .2)},${f(W * .1)} ${f(L * .2)},${f(W * .04)} ${f(L * .46)},${f(-W * .08)}" stroke="#c9b4c4" stroke-width="1.6" fill="none" opacity=".9"/>
        <path d="M${f(-L * .36)},${f(-W * .22)} C${f(-L * .1)},${f(-W * .42)} ${f(L * .2)},${f(-W * .4)} ${f(L * .36)},${f(-W * .18)}" stroke="#eef4fa" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M${f(-L * .3)},${f(-W * .12)} C${f(-L * .05)},${f(-W * .26)} ${f(L * .2)},${f(-W * .24)} ${f(L * .32)},${f(-W * .1)}" stroke="#5e7088" stroke-width=".8" fill="none" opacity=".6"/></g>`;
}
// 白アスパラ1本
function xdeAsparagus(p, x, y, L, w, r = 0, { c = '#f1e8c8', tip = '#e6d6a6' } = {}){
    const R = rng(p.id + 'xas' + x + y);
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="${-w / 2}" width="${L - w * .6}" height="${w}" rx="${f(w / 2)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/>
        <path d="M${f(L / 2 - w * 1.8)},${f(-w / 2)} Q${f(L / 2)},${f(-w * .3)} ${L / 2},0 Q${f(L / 2)},${f(w * .3)} ${f(L / 2 - w * 1.8)},${f(w / 2)}Z" fill="${p.g(tip, .25, .25)}" stroke="${dk(tip, .3)}" stroke-width=".6"/>
        <path d="M${f(L / 2 - w * 1.4)},${f(-w * .4)} l${f(w * .6)},${f(w * .3)} M${f(L / 2 - w * 1.4)},${f(w * .4)} l${f(w * .6)},${f(-w * .3)} M${f(L / 2 - w * 2.4)},${f(-w * .45)} l${f(w * .5)},${f(w * .25)}" stroke="${dk(tip, .3)}" stroke-width=".6" fill="none" opacity=".7"/>
        <path d="M${f(-L / 2 + w * .6)},${f(-w * .2)} L${f(L / 2 - w * 2.4)},${f(-w * .2)}" stroke="#fff" stroke-width="${f(w * .22)}" stroke-linecap="round" opacity=".7"/>
        <path d="M${f(-L * .1 + R() * 6)},${f(w * .25)} l4,0 M${f(L * .15)},${f(-w * .05)} l3,0" stroke="${dk(c, .2)}" stroke-width=".6" opacity=".5"/></g>`;
}
// 皮つきの丸ごとじゃがいも（半分に割ったものは黄色い断面）
function xdeJacket(p, x, y, s, r = 0, { half = false, seed = 1 } = {}){
    const R = rng(p.id + 'xjk' + seed + x + y);
    const pts = ring(s / 2, 10, .12, R, 1, .78);
    let eyes = '';
    for (let i = 0; i < 3; i++) eyes += `<ellipse cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .4)}" rx="1.4" ry=".8" fill="#7a5028" opacity=".6"/>`;
    return half
        ? `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.g('#a8743e', .2, .3)}" stroke="#6a4420" stroke-width=".8"/></g>
            <path d="${smooth(pts.map(([a, b]) => [a * .88, b * .86]))}" fill="${p.rg('#f6dc8a', .3, .15)}"/>
            <path d="${smooth(pts.map(([a, b]) => [a * .55, b * .5]))}" fill="none" stroke="#fbe9b4" stroke-width="1" opacity=".8"/></g>`
        : `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.g('#c08a50', .3, .32)}" stroke="#7a5028" stroke-width=".8"/></g>${eyes}
            <path d="M${f(-s * .28)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .32)} ${f(s * .14)},${f(-s * .28)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>
            <path d="M${f(s * .1)},${f(s * .1)} q${f(s * .1)},${f(-s * .04)} ${f(s * .2)},${f(s * .02)}" stroke="#e8c890" stroke-width="1.2" fill="none" opacity=".7"/></g>`;
}
// 大きな丸いクネーデル（パン=粗い、じゃがいも=なめらか）
function xdeKnoedel(p, x, y, s, { bread = true, c = null, seed = 1 } = {}){
    const R = rng(p.id + 'xkn' + seed + x + y);
    const col = c || (bread ? '#ecd9a8' : '#efe6cc');
    let tex = '';
    if (bread){
        for (let i = 0; i < 9; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .38; tex += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 90)} d="M-3,-2.4 L3,-2.6 L3.2,2.4 L-2.8,2.6Z" fill="none" stroke="${dk(col, .2)}" stroke-width=".8" opacity=".55"/>`; }
        tex += xdeHerbs(p, x, y, s * .8, { n: 14, seed: seed + 3 });
    } else {
        for (let i = 0; i < 10; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .38; tex += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(.5 + R() * .7)}" fill="${dk(col, .25)}" opacity=".45"/>`; }
    }
    return `<g ${p.sh(1.2)}><g ${p.rough(bread ? 3 : 1.4, bread ? .14 : .1)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg(col, .3, .3, .36, .32)}" stroke="${dk(col, .3)}" stroke-width=".8"/></g></g>
        ${tex}
        <ellipse cx="${f(x - s * .17)}" cy="${f(y - s * .2)}" rx="${f(s * .17)}" ry="${f(s * .09)}" fill="#fff" opacity="${bread ? .5 : .7}" transform="rotate(-30 ${f(x - s * .17)} ${f(y - s * .2)})"/>`;
}
// マウルタッシェの切り身（パスタの縁と、ほうれん草入りの肉の詰め物）
function xdeMaultasche(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xmt' + seed + x);
    let fl = '';
    for (let i = 0; i < 6; i++) fl += `<circle cx="${f((R() - .5) * w * .6)}" cy="${f((R() - .5) * h * .3)}" r="${f(.6 + R() * .8)}" fill="${R() < .6 ? '#3f7a2a' : '#6a4a2a'}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .3)}" fill="${p.g('#e6b85a', .3, .3)}" stroke="#a8742a" stroke-width=".8"/></g>
        <rect x="${f(-w / 2 + 3)}" y="${f(-h * .22)}" width="${f(w - 6)}" height="${f(h * .44)}" rx="2" fill="${p.g('#b08a68', .2, .2)}"/>${fl}
        <g ${xdeBlur(p, 1.4)}><ellipse cx="${f(w * .15)}" cy="${f(-h * .34)}" rx="${f(w * .22)}" ry="${f(h * .08)}" fill="#a8641c" opacity=".5"/><ellipse cx="${f(-w * .2)}" cy="${f(h * .36)}" rx="${f(w * .2)}" ry="${f(h * .07)}" fill="#a8641c" opacity=".5"/></g>
        <path d="M${f(-w * .38)},${f(-h * .36)} L${f(w * .1)},${f(-h * .38)}" stroke="#fff4d0" stroke-width="1.3" stroke-linecap="round" opacity=".7"/></g>`;
}
// シュプフヌーデル（指の形のじゃがいも麺、焼き色）
function xdeSchupf(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xsn' + seed + x + y), w = L * .26;
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q${f(-L * .38)},${f(-w * .55)} 0,${f(-w * .5)} Q${f(L * .38)},${f(-w * .55)} ${L / 2},0 Q${f(L * .38)},${f(w * .55)} 0,${f(w * .5)} Q${f(-L * .38)},${f(w * .55)} ${-L / 2},0Z" fill="${p.g('#ecc466', .3, .32)}" stroke="#a07a2a" stroke-width=".6"/>
        <ellipse cx="${f((R() - .5) * L * .3)}" cy="${f(w * .12)}" rx="${f(L * .22)}" ry="${f(w * .26)}" fill="#b8681e" opacity=".6"/>
        <path d="M${f(-L * .26)},${f(-w * .2)} Q0,${f(-w * .36)} ${f(L * .22)},${f(-w * .22)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 芽キャベツ（丸ごと／半割り）
function xdeSprout(p, x, y, s, r = 0, { half = false } = {}){
    return half
        ? `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${s / 2}" ry="${f(s * .44)}" fill="${p.g('#5e9a34', .25, .3)}" stroke="#3a6a1e" stroke-width=".7"/></g>
            <ellipse cx="${f(s * .02)}" cy="${f(s * .02)}" rx="${f(s * .4)}" ry="${f(s * .34)}" fill="${p.rg('#e8eeb0', .2, .15)}"/>
            <path d="M${f(-s * .3)},${f(s * .04)} Q0,${f(-s * .3)} ${f(s * .3)},${f(s * .04)} M${f(-s * .18)},${f(s * .06)} Q0,${f(-s * .14)} ${f(s * .18)},${f(s * .06)}" stroke="#a6c46a" stroke-width="1" fill="none"/>
            <path d="M${f(-s * .38)},${f(s * .1)} L${f(s * .38)},${f(s * .1)}" stroke="#c8d88a" stroke-width="1.4" opacity=".6"/></g>`
        : `<g ${T(x, y, r)}><g ${p.sh(.8)}><circle r="${s / 2}" fill="${p.rg('#6aa63a', .25, .3, .36, .32)}" stroke="#3a6a1e" stroke-width=".7"/></g>
            <path d="M${f(-s * .44)},${f(-s * .05)} Q${f(-s * .1)},${f(-s * .5)} ${f(s * .38)},${f(-s * .2)} M${f(-s * .3)},${f(s * .3)} Q${f(s * .1)},${f(s * .1)} ${f(s * .42)},${f(s * .16)} M${f(-s * .2)},${f(-s * .2)} Q${f(s * .05)},${f(-s * .05)} ${f(s * .1)},${f(s * .3)}" stroke="#3f7a22" stroke-width="1" fill="none" opacity=".7"/>
            <ellipse cx="${f(-s * .16)}" cy="${f(-s * .2)}" rx="${f(s * .14)}" ry="${f(s * .07)}" fill="#fff" opacity=".55"/></g>`;
}
// ラディッシュの薄切り（赤い縁、白い中）
function xdeRadish(p, x, y, s){
    return `<g ${T(x, y)}><circle r="${s / 2}" fill="#d0243e" stroke="#9a1428" stroke-width=".5"/><circle r="${f(s / 2 - 1.3)}" fill="${p.rg('#fbf4f2', .1, .1)}"/><circle r="${f(s * .3)}" fill="none" stroke="#f2d8dc" stroke-width=".6"/></g>`;
}
// トマトの輪切り
function xdeTomatoSlice(p, x, y, s, r = 0){
    const loc = [0, 1, 2, 3].map(i => { const a = i * 1.57 + .4; return `<path ${T(Math.cos(a) * s * .25, Math.sin(a) * s * .25, a * 57.3)} d="M${f(-s * .13)},0 a${f(s * .13)},${f(s * .08)} 0 1 0 ${f(s * .26)},0 a${f(s * .13)},${f(s * .08)} 0 1 0 ${f(-s * .26)},0Z" fill="#f08a62"/>${''}`; }).join('');
    const seeds = [0, 1, 2, 3].map(i => { const a = i * 1.57 + .4; return `<circle cx="${f(Math.cos(a) * s * .25)}" cy="${f(Math.sin(a) * s * .25)}" r="${f(s * .035)}" fill="#f8d66a"/>`; }).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><circle r="${s / 2}" fill="${p.rg('#e3392a', .25, .2)}" stroke="#a8221a" stroke-width=".6"/></g>
        <circle r="${f(s * .42)}" fill="#f25a42"/>${loc}${seeds}<circle r="${f(s * .1)}" fill="#f7a08a"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .38)} ${f(s * .14)},${f(-s * .34)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 玉ねぎの輪（生）
function xdeOnionRings(p, x, y, s, { n = 3, seed = 1, c = '#efe6f0', edge = '#b88aa8' } = {}){
    const R = rng(p.id + 'xor' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .7, rr = 4 + R() * 6; d += `M${f(cx - rr)},${f(cy)}a${f(rr)},${f(rr * .86)} 0 1 0 ${f(rr * 2)},0a${f(rr)},${f(rr * .86)} 0 1 0 ${f(-rr * 2)},0Z`; }
    return `<path d="${d}" fill="none" stroke="${edge}" stroke-width="2.6" opacity=".7"/><path d="${d}" fill="none" stroke="${c}" stroke-width="1.6"/>`;
}
// くるみ（半分）
function xdeWalnut(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-9,-1 C-10,-7 -4,-9 0,-6 C4,-9 10,-7 9,-1 C10,5 4,9 0,6 C-4,9 -10,5 -9,-1Z" fill="${p.g('#b07a40', .3, .3)}" stroke="#6e4620" stroke-width=".7"/></g>
        <path d="M0,-6 L0,6 M-6,-4 Q-3,-1 -6,2 M6,-4 Q3,-1 6,2 M-3,3 Q-5,5 -3,6 M3,3 Q5,5 3,6" stroke="#7a4e24" stroke-width=".9" fill="none" opacity=".75"/>
        <path d="M-7,-4 Q-5,-6.5 -2,-5.5" stroke="#f0d2a0" stroke-width="1" fill="none" opacity=".8"/></g>`;
}
// 葉もの（フェルトザラート: スプーン形の濃い緑の葉のロゼット）
function xdeRosette(p, x, y, s, r = 0, { c = '#2f6a22' } = {}){
    const R = rng(p.id + 'xro' + x + y);
    let out = '';
    for (let i = 0; i < 6; i++){ const a = i * 60 + r + (R() - .5) * 20; out += `<g transform="rotate(${f(a)})"><path d="M0,0 Q${f(s * .1)},${f(-s * .06)} ${f(s * .22)},${f(-s * .1)} Q${f(s * .48)},${f(-s * .2)} ${f(s * .5)},0 Q${f(s * .48)},${f(s * .2)} ${f(s * .22)},${f(s * .1)} Q${f(s * .1)},${f(s * .06)} 0,0Z" fill="${p.g(i % 2 ? c : lt(c, .12), .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".5"/><path d="M${f(s * .06)},0 L${f(s * .42)},0" stroke="${lt(c, .35)}" stroke-width=".7"/></g>`; }
    return `<g ${T(x, y)}>${out}<circle r="${f(s * .06)}" fill="#c8d88a"/></g>`;
}
// 大きな葉（キャベツ・レタスの一片、縮れたふち）
function xdeLeaf(p, x, y, s, r = 0, { c = '#a6cf6a', vein = '#eef6cc', seed = 1, ruffle = .22 } = {}){
    const R = rng(p.id + 'xlf' + seed + x + y);
    const pts = ring(s / 2, 12, ruffle, R, 1.15, .85);
    return `<g ${T(x, y, r)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .25)}" stroke-width=".6"/>
        <path d="M${f(-s * .5)},${f(s * .05)} Q0,${f(-s * .05)} ${f(s * .5)},0 M${f(-s * .1)},0 L${f(-s * .26)},${f(-s * .24)} M${f(s * .12)},0 L${f(s * .02)},${f(-s * .26)} M${f(s * .1)},0 L${f(s * .26)},${f(s * .22)} M${f(-s * .2)},${f(s * .02)} L${f(-s * .3)},${f(s * .22)}" stroke="${vein}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// カリフラワー（クリーム色の小房の集まり）
function xdeCauli(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'xcf' + seed + x);
    let b = '';
    const pts = xdeSpots('cf' + p.id + seed, 40, s * .42, s * .085, x, y);
    for (const [cx, cy] of pts){ const rr = s * (.065 + R() * .03); b += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${p.rg('#f6eed6', .3, .18, .35, .32)}" stroke="#d4c49a" stroke-width=".6"/>`; }
    return `<g ${p.sh(1)}><circle cx="${x}" cy="${y}" r="${f(s / 2)}" fill="${p.rg('#ece0bc', .2, .2)}"/>${b}</g>`;
}

// ---------- 料理 ----------
const xdeDishes = {
    // ルラーデ: 白い楕円皿（緑の線）に、ひもで巻いた牛のルラーデ2本と断面の半分、濃い褐色のソース、ゆでじゃがいも、赤キャベツ
    de_rouladen: p => [
        K.ovalDish(p, { rx: 96, ry: 78, rim: '#4a6a52' }),
        K.pool(p, 92, 104, 128, '#5e2c14', { op: 1, seed: 1, sy: .72 }),
        `<g ${p.sh(.5)}>`, xdeShreds(p, 150, 74, 40, { cols: ['#7a2452', '#93306a', '#5e1a40'], n: 40, w: 2.4, len: 12, seed: 3 }), `</g>`,
        xdePotato(p, 148, 122, 34, 30, { seed: 1 }), xdePotato(p, 126, 146, 32, -20, { seed: 2 }), xdePotato(p, 160, 98, 26, 70, { seed: 3 }),
        xdeHerbs(p, 144, 128, 40, { n: 12 }),
        xdeRoulade(p, 74, 82, 74, 34, -18, { seed: 1 }),
        xdeRoulade(p, 84, 120, 72, 34, -8, { seed: 2, c: '#723c1a' }),
        xdeRouladeCut(p, 116, 98, 36, 0),
        K.glaze(p, 82, 104, 78, '#7a3a18', { seed: 2, op: .5 }),
    ].join(''),

    // ザウアーブラーテン: 白い皿に、濃い焼き色の牛肉の薄切り3枚、甘酸っぱい濃い茶色のソース（レーズン）、じゃがいものクネーデル、赤キャベツ
    de_sauerbraten: p => [
        xdePlate(p, '#7a2a2a'),
        K.pool(p, 84, 96, 120, '#4e2210', { op: 1, seed: 1, sy: .9 }),
        xdeRoastSlice(p, 70, 74, 66, 40, -14, { seed: 1 }),
        xdeRoastSlice(p, 84, 104, 66, 40, -8, { seed: 2, c: '#a0603e' }),
        xdeRoastSlice(p, 72, 134, 62, 38, 4, { seed: 3 }),
        K.glaze(p, 78, 104, 80, '#6a2e14', { seed: 3, op: .5 }),
        ...[[66, 92], [94, 118], [80, 150], [58, 116], [100, 86]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.8" fill="#3a1a10" stroke="#24100a" stroke-width=".4"/>`),
        `<g ${p.sh(.5)}>`, xdeShreds(p, 146, 140, 42, { cols: ['#7a2452', '#93306a', '#5e1a40'], n: 40, w: 2.4, len: 12, seed: 3 }), `</g>`,
        xdeKnoedel(p, 140, 76, 50, { bread: false, seed: 1 }),
        xdeKnoedel(p, 160, 108, 36, { bread: false, seed: 2 }),
    ].join(''),

    // 皮つきローストポーク: 白い皿に、カリカリの皮のついた豚肩ローストの厚切り2枚、黒ビールのソース、クネーデル、ザウアークラウト
    de_schweinebraten: p => [
        xdePlate(p, '#2c4c7c'),
        K.pool(p, 82, 104, 112, '#6a3a1a', { op: 1, seed: 1, sy: .95 }),
        xdeCrackleSlice(p, 72, 82, 76, 52, -12, { seed: 1 }),
        xdeCrackleSlice(p, 86, 128, 76, 50, 8, { seed: 2 }),
        K.glaze(p, 90, 138, 50, '#7a4220', { seed: 2, op: .55 }),
        `<g ${p.sh(.5)}>`, xdeShreds(p, 144, 140, 44, { cols: ['#f1e7b0', '#e6d690', '#f6efc8'], n: 46, w: 2, len: 13, seed: 4 }), `</g>`,
        xdeKnoedel(p, 142, 78, 52, { bread: false, seed: 1 }),
        xdeHerbs(p, 140, 72, 22, { n: 6 }),
    ].join(''),

    // ポークチョップのオニオンソース: 白い皿に、骨つきのチョップ2枚、玉ねぎのブラウンソース、いんげん
    de_kotelett: p => [
        xdePlate(p, '#8a6a4a'),
        `<path d="${smooth(ring(62, 12, .16, rng('xdekotp'), 1, .9).map(([a, b]) => [a + 90, b + 108]))}" fill="${p.rg('#6a3a18', .2, .25)}"/>`,
        xdeChop(p, 82, 80, 86, -16, { seed: 1, c: '#cf8c44' }),
        xdeChop(p, 92, 126, 84, 10, { seed: 2, c: '#c8823e' }),
        `<g ${p.sh(.5)}>`, ...[[54, 110, 20], [120, 108, -30], [70, 156, 60], [116, 156, 10], [44, 132, 90], [132, 136, 40]].map(([x, y, r]) => K.onion(p, x, y, 18, r, { c: '#b8762e' })), `</g>`,
        K.glaze(p, 88, 140, 60, '#7a4218', { seed: 2, op: .5 }),
        `<g ${p.sh(.6)}>`, ...[[146, 64, 70], [152, 70, 66], [140, 70, 74], [158, 78, 62], [146, 78, 68], [164, 90, 58], [154, 88, 64], [140, 84, 72]].map(([x, y, r]) => K.greenBean(p, x, y, 30, r)), `</g>`,
        xdeHerbs(p, 92, 108, 80, { n: 12 }),
    ].join(''),

    // ケーニヒスベルガー・クロプセ: 深皿に、ゆでた白っぽい肉団子、ケッパー入りのクリーム色のソース、じゃがいも
    de_klopse: p => [
        K.bowl(p, { glaze: '#f2eee4', inside: '#fbf8f0' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#3e5f86" stroke-width="1.8" opacity=".8"/>`,
        K.liquid(p, { R: 74, c: '#efe3c4', op: 1, shine: false }),
        xdePotato(p, 138, 136, 36, 30, { seed: 1, c: '#f2d68a' }), xdePotato(p, 156, 106, 30, -40, { seed: 2, c: '#f2d68a' }),
        ...[[78, 76, 44], [120, 74, 42], [70, 120, 42], [108, 112, 46], [92, 146, 34]].map(([x, y, s]) => K.meatball(p, x, y, s, { c: '#b39272', glossy: false })),
        K.glaze(p, 96, 104, 112, '#f6ecd0', { seed: 1, op: .45 }),
        ...[[86, 86], [110, 96], [128, 88], [84, 132], [100, 124], [60, 98], [118, 130], [96, 70], [76, 104], [138, 70]].map(([x, y]) => `<g ${p.sh(.3)}><circle cx="${x}" cy="${y}" r="2.6" fill="${p.rg('#6a7a2a', .3, .25, .35, .32)}" stroke="#3f4a16" stroke-width=".5"/></g>`),
        xdeHerbs(p, 104, 104, 100, { n: 16 }),
        xdeShine(100, 100, 74, .4),
    ].join(''),

    // キャベツロール: 深皿に、ひもで巻いて焼き色をつけたキャベツロール2つ、褐色のソース、じゃがいも
    de_kohlrouladen: p => [
        K.bowl(p, { glaze: '#5a7a4a', inside: '#f1ece0' }),
        K.liquid(p, { R: 76, c: '#94582e', op: 1, shine: false }),
        xdeCabbageRoll(p, 82, 82, 82, 46, -20, { seed: 1 }),
        xdeCabbageRoll(p, 92, 128, 80, 44, -6, { seed: 2, c: '#c4b866' }),
        xdePotato(p, 144, 74, 32, 30, { seed: 1 }), xdePotato(p, 152, 112, 30, -20, { seed: 2 }),
        K.glaze(p, 100, 110, 120, '#a8642a', { seed: 1, op: .3 }),
        xdeGrains(p, 100, 104, 120, { cols: ['#4a2a12'], n: 14, rx: 1.4, ry: .6, seed: 3, stroke: 0 }),
        xdeHerbs(p, 104, 104, 110, { n: 18 }),
        xdeShine(100, 100, 76, .35),
    ].join(''),

    // 肉詰めパプリカ: 深い鉢に、赤と黄と緑のパプリカ、トマトソース、とろけたチーズ
    de_gefuelltepaprika: p => [
        K.bowl(p, { glaze: '#e9e2d4', inside: '#f6f1e6' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#b03a2a" stroke-width="1.6" opacity=".8"/>`,
        K.liquid(p, { R: 76, c: '#c43c24', op: 1, shine: false }),
        xdeGrains(p, 100, 100, 146, { cols: ['#a82e1a', '#d8583a'], n: 40, rx: 2, ry: 1.4, seed: 2, stroke: 0 }),
        xdeStuffedPepper(p, 74, 78, 62, 10, { seed: 1, c: '#d8301e' }),
        xdeStuffedPepper(p, 126, 84, 58, -20, { seed: 2, c: '#f0b81e' }),
        xdeStuffedPepper(p, 98, 130, 60, 30, { seed: 3, c: '#4a9a2a' }),
        xdeHerbs(p, 100, 100, 130, { n: 18 }),
        xdeShine(100, 100, 76, .4),
    ].join(''),

    // カリーヴルスト: 白い長皿に、ぶつ切りの焼きソーセージ、たっぷりのカレーケチャップ、カレー粉、フライドポテト、木の小さなフォーク
    de_currywurst: p => {
        const ch = [[48, 80, 20], [74, 74, 12], [100, 80, 24], [44, 106, 6], [70, 100, 16], [96, 106, 22], [54, 128, 10], [80, 126, 18], [106, 130, 26]];
        return [
            K.longPlate(p, { w: 188, h: 132, base: '#f6f3ec', rim: '#c9c2b4' }),
            xdeFries(p, 152, 100, 62, { n: 15, dir: 90, seed: 1 }),
            `<path d="${smooth(ring(56, 12, .12, rng('xdecw'), 1, .78).map(([a, b]) => [a + 76, b + 104]))}" fill="${p.rg('#a82a16', .2, .25)}"/>`,
            `<g ${p.sh(.8)}>`, ...ch.map(([x, y, r]) => xdeWurstChunk(p, x, y, 26, 18, r)), `</g>`,
            ...ch.map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-12" y="-8" width="24" height="16" rx="6" fill="#c4321a" opacity=".62"/><path d="M-8,-4 Q0,-6.5 7,-4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`),
            K.drizzle(p, 76, 104, 72, 36, { c: '#c4381a', width: 4.4, n: 6, r: -10 }),
            xdeDust(p, 76, 104, 86, '#e2a820', 44, 1),
            xdeDust(p, 76, 104, 70, '#c8781a', 22, .8),
            `<g ${T(152, 138, -24)}><rect x="-2" y="-16" width="4" height="30" rx="1.5" fill="#d8b47a" stroke="#a8844a" stroke-width=".5"/><path d="M-2,-16 l0,-6 M0,-16 l0,-6 M2,-16 l0,-6" stroke="#d8b47a" stroke-width="1.2"/></g>`,
        ].join('');
    },

    // 鶏ももとじゃがいものオーブン焼き: 黒い天板に、パプリカでこんがり焼けた骨つきもも3本、くし切りのじゃがいもと玉ねぎ、タイム
    de_haehnchenschenkel: p => [
        `<g ${p.sh(1.6)}><rect x="6" y="18" width="188" height="164" rx="22" fill="${p.g('#3b3533', .2, .3)}"/></g>`,
        `<rect x="16" y="28" width="168" height="144" rx="16" fill="${p.rg('#2a2422', .08, .2, .6, .6)}"/>`,
        `<path d="M20,60 Q20,32 46,32" stroke="#8a827c" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
        `<rect x="22" y="34" width="156" height="132" rx="12" fill="#a8622a" opacity=".5"/>`,
        `<g ${p.sh(.7)}>`, ...[[38, 50, 30], [162, 52, -40], [40, 150, 60], [160, 148, 10], [100, 50, 80], [100, 154, -10], [34, 100, 100], [168, 100, 20], [128, 104, 50], [70, 104, -30]].map(([x, y, r], i) => K.potato(p, x, y, 26, r, { c: '#e6b25a', seed: i })), `</g>`,
        `<g ${p.sh(.5)}>`, ...[[66, 44, 30], [136, 158, -60], [150, 80, 120], [52, 128, 200], [120, 46, 0]].map(([x, y, r]) => K.onion(p, x, y, 22, r, { c: '#b45a78', layers: 2 })), `</g>`,
        xdeChickenLeg(p, 82, 70, 84, -6, { seed: 1 }),
        xdeChickenLeg(p, 124, 112, 84, 174, { seed: 2, c: '#c06a28' }),
        xdeChickenLeg(p, 72, 128, 80, 12, { seed: 3, c: '#c87430' }),
        xdeHerbs(p, 100, 100, 150, { n: 20, cols: ['#4a6a2a', '#6a8a3a'] }),
    ].join(''),

    // 鶏肉のクリーム煮: 白い皿に、ご飯と、クリームソースの細切り鶏肉とマッシュルーム、パプリカ粉、パセリ
    de_geschnetzeltes: p => [
        xdePlate(p, '#6a7f9a'),
        K.rice(p, 150, 100, 70, { sy: 1.5, grains: .55 }),
        K.pool(p, 82, 100, 116, '#dcb880', { op: 1, seed: 1, sy: 1.15 }),
        `<g ${p.sh(.6)}>`,
        ...[[72, 66, 30], [96, 78, -20], [60, 96, 70], [86, 106, 10], [108, 100, 60], [68, 128, -40], [96, 136, 20], [80, 150, 80], [110, 124, -60]].map(([x, y, r], i) => K.chickenPiece(p, x, y, 24, r, { c: '#e2b070', skin: '#b87a38', seed: i })),
        ...[[84, 86, 20], [112, 80, -30], [62, 112, 40], [100, 120, 70], [76, 140, -20], [118, 144, 10]].map(([x, y, r]) => xdeMush(p, x, y, 16, r, { c: '#d8c09a' })),
        `</g>`,
        K.glaze(p, 84, 104, 96, '#f0dcae', { seed: 2, op: .4 }),
        xdeDust(p, 86, 104, 80, '#c8501e', 14, .7),
        xdeHerbs(p, 86, 104, 86, { n: 18 }),
    ].join(''),

    // マチェスの主婦風: 白い深皿に、銀青の皮のニシンの切り身、りんごと玉ねぎとピクルス入りのサワークリーム、ディル、皮つきじゃがいも
    de_matjes: p => [
        K.bowl(p, { glaze: '#3e5f86', inside: '#f3efe6' }),
        K.liquid(p, { R: 76, c: '#f4eedc', op: 1, shine: false }),
        xdeJacket(p, 142, 136, 34, 20, { half: true, seed: 1 }), xdeJacket(p, 158, 106, 30, -30, { seed: 2 }),
        xdeHerring(p, 88, 70, 104, 30, -14),
        xdeHerring(p, 92, 102, 108, 30, -8),
        xdeHerring(p, 82, 134, 96, 28, -2),
        ...[[60, 88], [118, 90], [104, 120], [62, 116], [124, 150], [74, 152]].map(([x, y], i) => xdeDice(p, x, y, 8, i * 30, i % 2 ? '#f2eabc' : '#e8e0a0')),
        ...[[128, 66, 18], [70, 152, 40]].map(([x, y, r]) => K.cucumberSlice(p, x, y, 13, r, { oval: 1 })),
        xdeOnionRings(p, 104, 92, 60, { n: 3, seed: 1 }),
        xdeDill(p, 74, 96, 22, -20), xdeDill(p, 110, 114, 20, 30), xdeDill(p, 96, 64, 18, 60),
        K.sprinkle(p, 96, 104, 90, { c: '#2a2420', n: 14, r: .5 }),
    ].join(''),

    // バックフィッシュ: 白い楕円皿に、ビール衣でふくらんだ白身魚のフライ2切れ、レムラードソース、レモン、ポテトサラダ
    de_backfisch: p => [
        K.ovalDish(p, { rx: 96, ry: 78, rim: '#3c6a9a' }),
        `<g ${p.sh(.5)}>`, ...xdeSpots('bfps', 9, 22, 12, 152, 108).map(([x, y, r], i) => xdePotSlice(p, x, y, 20, r, { seed: i })), `</g>`,
        xdeChives(p, 152, 108, 40, { n: 8 }),
        xdeBattered(p, 82, 78, 110, 46, -12, { seed: 1 }),
        xdeBattered(p, 84, 124, 104, 44, 6, { seed: 2, c: '#d89a42' }),
        xdeDollop(p, 140, 66, 28, { c: '#f4ecc8', seed: 1 }),
        xdeHerbs(p, 140, 66, 18, { n: 7 }),
        xdeGrains(p, 140, 66, 16, { cols: ['#8aa04a'], n: 5, rx: 1.4, ry: 1, seed: 5 }),
        K.lemon(p, 132, 150, 26, 20),
    ].join(''),

    // ゼンフアイアー: 白い深皿に、からしのクリームソース、半分に切ったゆで卵、ゆでじゃがいも、シュニットラウフ
    de_senfeier: p => [
        K.bowl(p, { glaze: '#f2eee4', inside: '#fbf8f0' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#c8a24a" stroke-width="1.8" opacity=".85"/>`,
        K.liquid(p, { R: 76, c: '#e6c450', op: 1, shine: false }),
        xdeGrains(p, 100, 100, 140, { cols: ['#a87a1a'], n: 30, rx: .9, ry: .8, seed: 3, stroke: 0 }),
        xdePotato(p, 140, 138, 38, 30, { seed: 1, c: '#f4dc90' }), xdePotato(p, 158, 104, 32, -40, { seed: 2, c: '#f4dc90' }),
        ...[[70, 74, -20], [112, 70, 15], [62, 116, 40], [104, 110, -10], [84, 148, 20], [138, 82, 60]].map(([x, y, r]) => K.eggHalf(p, x, y, 40, r, { yolk: '#f6b020' })),
        K.glaze(p, 96, 100, 120, '#f0d060', { seed: 1, op: .22 }),
        xdeChives(p, 98, 102, 120, { n: 26 }),
        xdeShine(100, 100, 76, .4),
    ].join(''),

    // バウエルンフリューシュトゥック: 黒いフライパンに、焼いたじゃがいもの輪切り、ベーコン、玉ねぎを卵でとじて、シュニットラウフ、ピクルス
    de_bauernfruehstueck: p => [
        xdeSkillet(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#f2cf62', .1, .2)}"/>`,
        ...xdeSpots('bf', 17, 60, 20).map(([x, y, r], i) => xdePotSlice(p, x, y, 31, r, { seed: i, c: '#f0c870', brown: .8 })),
        K.scrambled(p, 80, 84, 54, { c: '#f8d65a', seed: 1, n: 6 }),
        K.scrambled(p, 124, 116, 50, { c: '#f8d65a', seed: 2, n: 6 }),
        K.scrambled(p, 74, 130, 36, { c: '#fae07a', seed: 3, n: 4 }),
        ...[[100, 74, 10], [130, 82, -30], [64, 104, 40], [100, 136, 0], [138, 140, 60], [92, 104, 80]].map(([x, y, r]) => xdeSpeck(p, x, y, 11, r, { brown: .3 })),
        ...[[126, 64, 40], [56, 80, -20]].map(([x, y, r]) => K.onion(p, x, y, 16, r, { c: '#e2b060' })),
        `<g ${p.sh(.7)}>`, `<g ${T(148, 96, 60)}><ellipse rx="16" ry="7" fill="${p.g('#6a7a28', .3, .3)}" stroke="#3f4a16" stroke-width=".7"/><path d="M-12,-1 L12,-1" stroke="#a8b860" stroke-width="1" opacity=".7"/></g>`, `</g>`,
        xdeChives(p, 100, 100, 130, { n: 34 }),
        xdeDust(p, 100, 100, 120, '#2a2420', 14, .5),
    ].join(''),

    // 白アスパラガスのオランデーズ: 白い長皿に、白アスパラの束、たっぷりのオランデーズソース、小さなゆでじゃがいも、ハム
    de_spargel: p => [
        K.longPlate(p, { w: 188, h: 140, base: '#f6f3ec', rim: '#a8b898' }),
        `<g ${p.sh(.8)}>`,
        ...[[54, 72, -14, 1], [44, 100, 10, 2]].map(([x, y, r, k]) => { const R = rng('xdeham' + k); const pts = ring(1, 12, .22, R, 30, 17); return `<g ${T(x, y, r)}><path d="${smooth(pts)}" fill="${p.g('#e89aa0', .3, .22)}" stroke="#b8606a" stroke-width=".7"/><path d="${smooth(pts.map(([u, v]) => [u * .96, v * .92]))}" fill="none" stroke="#f6dcd8" stroke-width="2.2" opacity=".8"/><path d="M-20,-2 Q-6,6 8,-3 T24,2" stroke="#c8707a" stroke-width="1" fill="none" opacity=".6"/><path d="M-16,-8 Q-4,-12 10,-9" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`; }),
        `</g>`,
        xdePotato(p, 50, 134, 30, 20, { seed: 1, c: '#f2d888' }), xdePotato(p, 74, 148, 26, -30, { seed: 2, c: '#f2d888' }), xdePotato(p, 36, 116, 22, 50, { seed: 3, c: '#f2d888' }),
        xdeHerbs(p, 54, 138, 40, { n: 12 }),
        `<g ${p.sh(.8)}>`, ...[[60, 0], [70, 1], [80, -1], [90, 1], [100, 0], [110, -1], [120, 1], [130, 0], [140, -1]].map(([y, r], i) => xdeAsparagus(p, 126, y + 2, 104 - (i % 3) * 4, 11, r - 4)), `</g>`,
        `<path d="M104,68 C118,60 140,64 146,78 C150,92 142,104 146,118 C150,132 136,144 118,140 C104,138 98,124 100,110 C102,96 92,80 104,68Z" fill="${p.rg('#f4d462', .25, .18)}" opacity=".96"/>`,
        `<path d="M108,76 C120,68 136,72 140,82" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/>`,
        xdeChives(p, 124, 104, 30, { n: 8 }),
    ].join(''),

    // ペルカルトッフェルン: 白い皿に、皮つきのゆでじゃがいも（丸ごとと半分）、ハーブ入りのクワルクをたっぷり、シュニットラウフ
    de_pellkartoffeln: p => [
        xdePlate(p, '#4a6a52'),
        `<g ${p.sh(1)}><path d="${smooth(ring(40, 14, .14, rng('xdepkq'), 1, .9).map(([a, b]) => [a + 72, b + 100]))}" fill="${p.rg('#fbf8f0', .1, .12)}" stroke="#d8d2c2" stroke-width=".8"/></g>`,
        `<path d="M50,92 Q62,80 78,84 M56,112 Q72,100 90,108" stroke="#e8e2d2" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
        xdeHerbs(p, 72, 100, 70, { n: 34, cols: ['#3f8a2c', '#5aa63c', '#2f6a22'] }),
        xdeChives(p, 72, 100, 60, { n: 12 }),
        `<path d="M50,82 Q58,74 70,76" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`,
        xdeJacket(p, 136, 64, 44, 30, { seed: 1 }),
        xdeJacket(p, 150, 104, 42, -60, { half: true, seed: 2 }),
        xdeJacket(p, 124, 138, 46, 10, { seed: 3 }),
        xdeJacket(p, 118, 100, 34, 80, { half: true, seed: 4 }),
        xdeJacket(p, 84, 152, 34, -20, { seed: 5 }),
        K.sprinkle(p, 140, 104, 40, { c: '#fbf6ec', n: 12, r: .9 }),
    ].join(''),

    // ゼンメルクネーデルとクリームきのこ: 深皿に、パンのクネーデル2つ、マッシュルームのクリームソース、パセリ
    de_semmelknoedel: p => [
        K.bowl(p, { glaze: '#7a6a52', inside: '#f1e9dc' }),
        K.liquid(p, { R: 76, c: '#c8a474', op: 1, shine: false }),
        `<g ${p.sh(.5)}>`, ...xdeSpots('smk', 20, 64, 14).map(([x, y, r], i) => xdeMush(p, x, y, 18, r, { c: i % 3 ? '#d8c09a' : '#b89a72' })), `</g>`,
        xdeKnoedel(p, 80, 84, 66, { bread: true, seed: 1, c: '#e8cc8a' }),
        xdeKnoedel(p, 124, 122, 64, { bread: true, seed: 2, c: '#e4c482' }),
        K.glaze(p, 128, 70, 50, '#e6d0a4', { seed: 1, op: .35 }),
        xdeHerbs(p, 100, 100, 140, { n: 30 }),
        xdeShine(100, 100, 76, .4),
    ].join(''),

    // 焼きマウルタッシェ: 黒いフライパンに、切って焼いたマウルタッシェ、炒め玉ねぎ、ふんわり卵、シュニットラウフ
    de_maultaschen: p => [
        xdeSkillet(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#e2b660', .1, .25)}"/>`,
        ...[[70, 66, -20], [106, 62, 10], [138, 78, 40], [60, 102, 70], [96, 98, -10], [134, 116, -30], [72, 138, 20], [108, 136, 60], [42, 82, 80]].map(([x, y, r], i) => xdeMaultasche(p, x, y, 40, 26, r, { seed: i })),
        K.scrambled(p, 88, 118, 40, { c: '#f8d65a', seed: 1, n: 5 }),
        K.scrambled(p, 124, 92, 36, { c: '#f8d65a', seed: 2, n: 5 }),
        K.scrambled(p, 56, 84, 26, { c: '#fae07a', seed: 3, n: 3 }),
        `<g ${p.sh(.4)}>`, ...[[84, 82, 0], [118, 70, 40], [60, 122, -30], [126, 146, 80], [148, 100, 20], [100, 154, -60]].map(([x, y, r]) => K.onion(p, x, y, 16, r, { c: '#c88a38' })), `</g>`,
        xdeChives(p, 100, 100, 130, { n: 30 }),
    ].join(''),

    // シュプフヌーデルとザウアークラウト: 黒いフライパンに、こんがり焼いた指の形のじゃがいも麺、ザウアークラウト、ベーコン
    de_schupfnudeln: p => [
        xdeSkillet(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#d8c47a', .1, .25)}"/>`,
        `<g ${p.sh(.4)}>`, xdeShreds(p, 100, 100, 140, { cols: ['#efe2a0', '#e2d080', '#f6eec0'], n: 80, w: 2, len: 14, seed: 1 }), `</g>`,
        `<g ${p.sh(.7)}>`, ...xdeSpots('sn', 20, 60, 19).map(([x, y, r], i) => xdeSchupf(p, x, y, 36, r, { seed: i })), `</g>`,
        ...[[86, 80, 10], [124, 98, -30], [76, 124, 40], [110, 140, 0], [140, 70, 60]].map(([x, y, r]) => xdeSpeck(p, x, y, 10, r, { brown: .35 })),
        xdeGrains(p, 100, 100, 120, { cols: ['#5a3a1e'], n: 18, rx: 1.4, ry: .6, seed: 3, stroke: 0 }),
        xdeChives(p, 100, 100, 120, { n: 20 }),
    ].join(''),

    // シンケンヌーデル: 黒いフライパンに、焼いた平たい卵麺、角切りハム、卵、シュニットラウフ
    de_schinkennudeln: p => [
        xdeSkillet(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#ecc666', .1, .25)}"/>`,
        xdeNoodles(p, 100, 100, 116, { c: '#f2d27a', w: 5, n: 34, seed: 1 }),
        `<g ${xdeBlur(p, 2)}>`, ...[[80, 90, 10], [124, 114, 9], [96, 136, 8], [120, 74, 7]].map(([x, y, s]) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#c8862a" opacity=".45"/>`), `</g>`,
        K.scrambled(p, 82, 116, 40, { c: '#f8d65a', seed: 1, n: 5 }),
        K.scrambled(p, 122, 86, 36, { c: '#f8d65a', seed: 2, n: 4 }),
        `<g ${p.sh(.5)}>`, ...xdeSpots('sk', 16, 60, 15).map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-5.5" y="-4.5" width="11" height="9" rx="2" fill="${p.g('#eda0a0', .25, .22)}" stroke="#c07070" stroke-width=".5"/><path d="M-5,-2.5 L5,-2.5" stroke="#f9d8d0" stroke-width="1" opacity=".8"/></g>`), `</g>`,
        xdeChives(p, 100, 100, 126, { n: 30 }),
    ].join(''),

    // ブラートカルトッフェルン: 黒いフライパンに、こんがり焼いたじゃがいもの輪切り、玉ねぎ、ベーコン、パセリ
    de_bratkartoffeln: p => [
        xdeSkillet(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#d8a040', .1, .25)}"/>`,
        ...xdeSpots('bk', 21, 60, 18).map(([x, y, r], i) => xdePotSlice(p, x, y, 32, r, { seed: i, c: i % 3 ? '#efc566' : '#e8b858', brown: 1 })),
        `<g ${p.sh(.4)}>`, ...[[86, 74, 20], [126, 92, -30], [72, 118, 60], [112, 134, 10], [140, 120, 80], [60, 88, -40]].map(([x, y, r]) => K.onion(p, x, y, 16, r, { c: '#c88a38' })), `</g>`,
        ...[[100, 92, 10], [128, 70, -30], [80, 136, 40], [140, 140, 0], [62, 106, 60], [104, 120, 20]].map(([x, y, r]) => xdeSpeck(p, x, y, 10, r, { brown: .35 })),
        xdeHerbs(p, 100, 100, 130, { n: 30 }),
        xdeDust(p, 100, 100, 120, '#2a2420', 12, .5),
    ].join(''),

    // じゃがいものグラタン: 白い角の耐熱皿に、クリームで焼いた薄切りじゃがいもの重なり、こんがりチーズ、タイム
    de_kartoffelgratin: p => {
        const R = rng('xdegr'), out = [];
        for (let row = 0; row < 5; row++) for (let i = 0; i < 6; i++){ const x = 48 + i * 21 + (row % 2) * 9 + (R() - .5) * 4, y = 52 + row * 24 + (R() - .5) * 3; if (x < 166) out.push([x, y, (R() - .5) * 30]); }
        return [
            xdeBaker(p),
            `<rect x="28" y="28" width="144" height="144" rx="14" fill="${p.rg('#ecd090', .1, .25)}"/>`,
            ...out.map(([x, y, r], i) => xdePotSlice(p, x, y, 32, r, { seed: i, c: '#f0d48a', brown: .5 })),
            `<g opacity=".85">`, K.cheese(p, 100, 100, 130, { seed: 1, browned: .9 }), `</g>`,
            `<g ${xdeBlur(p, 3)}>`, ...[[60, 60, 12], [138, 70, 10], [100, 112, 14], [64, 140, 11], [140, 144, 12]].map(([x, y, s]) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#a85a18" opacity=".5"/>`), `</g>`,
            xdeHerbs(p, 100, 100, 120, { n: 14, cols: ['#4a6a2a', '#6a8a3a'] }),
            `<path d="M44,40 Q70,34 96,38" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`,
        ].join('');
    },

    // じゃがいものクレース: 深い鉢に、まんまるのじゃがいもの団子3つ、褐色のソース、パンのクルトン、パセリ
    de_kartoffelkloesse: p => [
        K.bowl(p, { glaze: '#8a5a3a', inside: '#f1e6d4' }),
        K.liquid(p, { R: 76, c: '#7a4422', op: 1, shine: false }),
        xdeKnoedel(p, 76, 80, 66, { bread: false, seed: 1 }),
        xdeKnoedel(p, 128, 90, 64, { bread: false, seed: 2, c: '#ede2c4' }),
        xdeKnoedel(p, 96, 136, 62, { bread: false, seed: 3 }),
        ...[[78, 80, 20], [128, 90, -10], [96, 136, 40]].map(([x, y, r]) => xdeCrouton(p, x + 2, y + 2, 9, r)),
        K.glaze(p, 112, 140, 60, '#9a5a2a', { seed: 1, op: .45 }),
        xdeHerbs(p, 100, 100, 130, { n: 22 }),
        xdeShine(100, 100, 76, .3),
    ].join(''),

    // マッシュポテト: 白い鉢に、ふんわりしたじゃがいものピュレ、へらの筋、まんなかに溶けたバター、ナツメグ、パセリ
    de_kartoffelpueree: p => [
        K.bowl(p, { glaze: '#3e5f86', inside: '#f3efe6' }),
        `<g ${p.sh(.9)}><path d="${smooth(ring(74, 16, .06, rng('xdepu')).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#f6e6b4', .3, .16)}"/></g>`,
        ...[0, 1, 2, 3, 4].map(i => { const rr = 18 + i * 12; return `<path d="M${f(100 - rr)},${f(100 + i * 2)} A${rr},${f(rr * .92)} 0 1 1 ${f(100 + rr * .7)},${f(100 + rr * .7)}" stroke="#e2cc8a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><path d="M${f(100 - rr)},${f(98 + i * 2)} A${rr},${f(rr * .92)} 0 1 1 ${f(100 + rr * .7)},${f(98 + rr * .7)}" stroke="#fff8e4" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`; }),
        `<path d="${smooth(ring(16, 9, .2, rng('xdepub')).map(([a, b]) => [a + 98, b + 98]))}" fill="${p.rg('#f6c838', .3, .15)}" opacity=".95"/>`,
        `<rect x="90" y="90" width="14" height="11" rx="2.4" fill="${p.g('#fae79a', .3, .2)}" stroke="#d8b850" stroke-width=".6" transform="rotate(-14 97 95)"/>`,
        `<ellipse cx="93" cy="92" rx="3" ry="1.4" fill="#fff" opacity=".8"/>`,
        xdeDust(p, 104, 104, 100, '#a8682a', 16, .6),
        xdeHerbs(p, 112, 108, 70, { n: 14 }),
    ].join(''),

    // フェルトザラート: ガラスの鉢に、小さなロゼットのフェルトザラート、カリカリのベーコン、クルトン、エシャロット
    de_feldsalat: p => [
        xdeGlassBowl(p),
        xdeRosettes(p, xdeSpots('fs', 20, 60, 24).map(([x, y, r], i) => [x, y, r, 36 + (i % 3) * 3])),
        `<g ${p.sh(.5)}>`, ...[[84, 84, 10], [120, 100, -30], [96, 126, 40], [70, 112, 0], [126, 70, 60], [140, 128, 20]].map(([x, y, r]) => xdeSpeck(p, x, y, 10, r, { brown: .45 })), `</g>`,
        `<g ${p.sh(.5)}>`, ...[[104, 88, 10], [76, 136, 30], [132, 116, -20], [62, 86, 50], [110, 146, 0], [146, 88, 40]].map(([x, y, r]) => xdeCrouton(p, x, y, 11, r)), `</g>`,
        xdeGrains(p, 100, 100, 110, { cols: ['#e8d0e0'], n: 14, rx: 1.6, ry: 1.1, seed: 4 }),
        K.glaze(p, 100, 100, 120, '#f6eec0', { seed: 1, op: .12 }),
    ].join(''),

    // トマトサラダ: 白い皿に、輪切りのトマトを並べて、玉ねぎのみじん切り、シュニットラウフ、黒こしょう
    de_tomatensalat: p => [
        xdePlate(p, '#b03a2a'),
        ...[[100, 100, 0], [66, 80, 30], [100, 64, 60], [136, 80, 10], [138, 120, 40], [100, 138, 80], [62, 122, 20], [80, 104, 50], [120, 100, 70], [48, 100, 10], [152, 100, 50], [82, 146, 0], [120, 146, 20], [80, 56, 40], [122, 56, 70]].reverse().map(([x, y, r]) => xdeTomatoSlice(p, x, y, 38, r)),
        K.glaze(p, 100, 100, 120, '#f6e6a0', { seed: 1, op: .14 }),
        xdeGrains(p, 100, 100, 110, { cols: ['#f6f0f2', '#e8d8e6'], n: 34, rx: 1.6, ry: 1.2, seed: 2 }),
        xdeChives(p, 100, 100, 120, { n: 30 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 22, r: .55 }),
    ].join(''),

    // にんじんとりんごのサラダ: 白い鉢に、細かくすりおろしたにんじん、りんご、くるみ
    de_moehrenrohkost: p => [
        K.bowl(p, { glaze: '#4a6a52', inside: '#f1ece0' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#ee8a32', .2, .22)}"/></g>`,
        xdeShreds(p, 100, 100, 136, { cols: ['#f08a2a', '#f6a04a', '#e2721e', '#f8b462'], n: 170, w: 2.2, len: 11, seed: 1 }),
        xdeShreds(p, 100, 100, 110, { cols: ['#f6f0cc', '#efe4b0'], n: 30, w: 2.2, len: 10, seed: 2 }),
        `<g ${p.sh(.5)}>`, ...[[86, 82, 20], [122, 96, -40], [96, 124, 70], [130, 128, 10], [68, 112, -10]].map(([x, y, r]) => xdeWalnut(p, x, y, 18, r)), `</g>`,
        K.glaze(p, 100, 100, 120, '#fbe0a0', { seed: 1, op: .15 }),
        xdeHerbs(p, 104, 92, 30, { n: 6 }),
    ].join(''),

    // ヌーデルザラート: 白い鉢に、マヨネーズであえたらせんパスタ、ハム、グリンピース、ピクルス、ゆで卵
    de_nudelsalat: p => [
        K.bowl(p, { glaze: '#c45a2a', inside: '#f6f0e4' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#f2e2b0', .2, .2)}"/></g>`,
        `<g ${p.sh(.5)}>`, ...xdeSpots('nu', 28, 60, 15).map(([x, y, r]) => `<g ${T(x, y, r, 1.45)}><path d="M-7,-3 Q-4,-6 -1,-3 T5,-3 Q8,0 5,3 Q2,6 -1,3 T-7,3 Q-10,0 -7,-3Z" fill="${p.g('#f2dc96', .3, .2)}" stroke="#c8a85a" stroke-width=".6"/><path d="M-3,-4.4 L-1,4.4 M3,-4.4 L5,4.4" stroke="#d8bc70" stroke-width=".8"/></g>`), `</g>`,
        K.glaze(p, 100, 100, 130, '#fbf4dc', { seed: 1, op: .35 }),
        `<g ${p.sh(.5)}>`, ...xdeSpots('nuh', 10, 56, 22).map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-8" y="-2.6" width="16" height="5.2" rx="1.2" fill="${p.g('#eea0a0', .25, .2)}" stroke="#c07070" stroke-width=".5"/></g>`), `</g>`,
        ...xdeSpots('nug', 8, 56, 22).map(([x, y, r]) => xdeDice(p, x, y, 7, r, '#7a8a2a')),
        xdeGrains(p, 100, 100, 120, { cols: ['#6fb43c', '#5ea232'], n: 24, rx: 3, ry: 2.9, hi: .6, seed: 3, jitter: .1 }),
        K.eggHalf(p, 124, 80, 24, 20), K.eggHalf(p, 78, 126, 24, -30),
        xdeChives(p, 100, 100, 110, { n: 18 }),
    ].join(''),

    // ローテ・ベーテ・サラダ: 白い鉢に、深い赤紫のビーツの角切り、玉ねぎ、りんご、キャラウェイ
    de_rotebete: p => [
        K.bowl(p, { glaze: '#f2eee4', inside: '#fbf8f0' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#8a1e4a" stroke-width="1.6" opacity=".75"/>`,
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#6a1030', .2, .25)}"/></g>`,
        ...xdeSpots('rb', 34, 60, 13).map(([x, y, r], i) => xdeDice(p, x, y, 14, r, i % 3 ? '#9a1a44' : '#b02a56')),
        K.glaze(p, 100, 100, 120, '#c03a6a', { seed: 1, op: .22 }),
        ...[[86, 84, 10], [118, 112, -20], [74, 124, 30]].map(([x, y, r]) => xdeDice(p, x, y, 9, r, '#f6f0d8')),
        xdeGrains(p, 100, 100, 110, { cols: ['#f4e8f0', '#e6c6d6'], n: 20, rx: 1.6, ry: 1.2, seed: 2 }),
        xdeGrains(p, 100, 100, 110, { cols: ['#4a2a16'], n: 18, rx: 1.4, ry: .55, seed: 3, stroke: 0 }),
        xdeHerbs(p, 104, 96, 50, { n: 8 }),
        xdeShine(100, 100, 70, .4),
    ].join(''),

    // コップザラート: ガラスの鉢に、やわらかいバターヘッドレタスの葉、クリームのドレッシング、ディルとシュニットラウフ
    de_kopfsalat: p => [
        xdeGlassBowl(p),
        `<g ${p.sh(.6)}>`,
        ...[[72, 76, 20, 64, '#9ccc62'], [128, 78, -30, 62, '#a6d26c'], [70, 124, 60, 62, '#94c45a'], [130, 124, -60, 62, '#a0ce66'], [100, 60, 80, 54, '#b8dc80'], [100, 140, 0, 54, '#acd474'], [100, 100, 40, 58, '#c4e292'], [58, 100, 90, 44, '#b0d878'], [142, 100, 90, 44, '#b4da7c']].map(([x, y, r, s, c], i) => xdeLeaf(p, x, y, s, r, { c, seed: i, ruffle: .26 })),
        `</g>`,
        `<g opacity=".85">`, ...[[86, 92, 30], [118, 110, 26], [100, 130, 22], [114, 80, 20]].map(([x, y, s], i) => K.pool(p, x, y, s, '#fbf6e8', { seed: i + 1, sy: .7, op: .85 })), `</g>`,
        xdeDill(p, 92, 98, 24, -20), xdeDill(p, 120, 118, 20, 40), xdeDill(p, 74, 120, 18, 80),
        xdeChives(p, 100, 100, 100, { n: 14 }),
    ].join(''),

    // ラディッシュのサラダ: 白い鉢に、薄切りのラディッシュ、きゅうり、たっぷりのシュニットラウフ
    de_radieschensalat: p => [
        K.bowl(p, { glaze: '#5a7a9a', inside: '#f3efe6' }),
        `<g ${p.sh(.5)}>`, ...xdeSpots('rd', 40, 62, 11.5).map(([x, y], i) => i % 6 === 5 ? K.cucumberSlice(p, x, y, 18, i * 20, { oval: 1 }) : xdeRadish(p, x, y, 19)), `</g>`,
        K.glaze(p, 100, 100, 120, '#f6eecc', { seed: 1, op: .15 }),
        xdeChives(p, 100, 100, 130, { n: 46 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 14, r: .5 }),
    ].join(''),

    // ヴァルドルフサラダ: 白い鉢に、セロリアックとりんごの細切りのマヨネーズあえ、くるみ、赤い皮のりんご
    de_waldorfsalat: p => [
        K.bowl(p, { glaze: '#7a8a5a', inside: '#f3efe6' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#f2ead0', .2, .15)}"/></g>`,
        xdeShreds(p, 100, 100, 134, { cols: ['#f4ecd0', '#e8dcb4', '#f8f2de', '#e0d2a4'], n: 120, w: 3.2, len: 14, seed: 1 }),
        K.glaze(p, 100, 100, 120, '#fbf6e2', { seed: 1, op: .4 }),
        `<g ${p.sh(.5)}>`, ...[[80, 76, 30], [126, 94, -20], [92, 130, 60], [64, 112, -40], [134, 134, 10]].map(([x, y, r]) => `<g ${T(x, y, r, 1.4)}><path d="M-10,3 A10,8 0 0 1 10,3 Z" fill="#c42a2a"/><path d="M-9,3 A9,6.6 0 0 1 9,3 Z" fill="${p.g('#f6f0cc', .2, .15)}"/></g>`), `</g>`,
        `<g ${p.sh(.5)}>`, ...[[100, 88, 20], [72, 110, -30], [128, 124, 60], [110, 70, 10], [104, 112, -60]].map(([x, y, r]) => xdeWalnut(p, x, y, 20, r)), `</g>`,
        `<g ${p.sh(.4)}>`, xdeLeaf(p, 140, 70, 30, -30, { c: '#a6cf6a', seed: 9 }), `</g>`,
    ].join(''),

    // 芽キャベツのバター煮: 白い鉢に、丸ごとと半割りの芽キャベツ、溶かしバター、ベーコン、ナツメグ
    de_rosenkohl: p => [
        K.bowl(p, { glaze: '#a88a5a', inside: '#f1e9dc' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#c8b86a', .15, .25)}"/></g>`,
        ...xdeSpots('rk', 20, 58, 25).map(([x, y, r], i) => xdeSprout(p, x, y, 28, r, { half: i % 3 === 0 })),
        K.glaze(p, 100, 100, 120, '#f6dc7a', { seed: 1, op: .22 }),
        ...[[86, 90, 10], [120, 108, -30], [96, 130, 40], [130, 76, 60]].map(([x, y, r]) => xdeSpeck(p, x, y, 9, r, { brown: .4 })),
        xdeDust(p, 100, 100, 110, '#8a5a2a', 14, .6),
    ].join(''),

    // マッシュルームのクリーム煮: 白い鉢に、薄切りのマッシュルーム、クリームソース、たっぷりのパセリ
    de_rahmchampignons: p => [
        K.bowl(p, { glaze: '#6a4a3a', inside: '#f1e6d6' }),
        K.liquid(p, { R: 72, c: '#e0cca2', op: 1, shine: false }),
        `<g ${p.sh(.6)}>`, ...xdeSpots('rc', 30, 60, 15).map(([x, y, r], i) => xdeMush(p, x, y, 24, r, { c: i % 3 ? '#dcc6a0' : '#bfa07a' })), `</g>`,
        K.glaze(p, 100, 100, 120, '#f2e2bc', { seed: 1, op: .35 }),
        xdeHerbs(p, 100, 100, 130, { n: 40 }),
        xdeShine(100, 100, 72, .35),
    ].join(''),

    // シュペックボーネン: 白い楕円皿に、いんげんの束をベーコンで巻いたものと、ベーコンと玉ねぎで炒めたいんげん
    de_speckbohnen: p => [
        K.ovalDish(p, { rx: 96, ry: 78, rim: '#6a8a4a' }),
        `<g ${p.sh(.6)}>`, ...Array.from({ length: 90 }, (_, i) => { const R = rng('xdesb' + i); return [28 + R() * 144, 44 + R() * 112, (R() - .5) * 60 + (i % 2 ? 20 : -10)]; }).filter(([x, y]) => ((x - 100) / 70) ** 2 + ((y - 100) / 52) ** 2 < 1).map(([x, y, r], i) => K.greenBean(p, x, y, 34, r, { c: i % 3 ? '#4f9a34' : '#5aa63c' })), `</g>`,
        ...[[74, 84, -10], [118, 116, 20]].map(([x, y, r]) => `<g ${p.sh(.9)}><g ${T(x, y, r)}>${[-5, -2, 1, 4, 7].map((d, i) => K.greenBean(p, 0, d - 1, 46, (i - 2) * 3, { c: '#3f8a2c' })).join('')}<rect x="-8" y="-9" width="16" height="18" rx="2" fill="${p.g('#c0583e', .25, .25)}" stroke="#8c3727" stroke-width=".6"/><path d="M-7,-3 L7,-3 M-7,3 L7,3" stroke="#f3d9c0" stroke-width="2"/></g></g>`),
        ...[[100, 70, 10], [64, 120, -30], [140, 84, 40], [96, 140, 0], [128, 64, 60], [56, 96, 20]].map(([x, y, r]) => xdeSpeck(p, x, y, 10, r, { brown: .4 })),
        K.glaze(p, 100, 100, 130, '#f6e08a', { seed: 1, op: .15 }),
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 14, r: .5 }),
    ].join(''),

    // ザウアークラウト: ヴェスターヴァルト焼きの鉢に、淡い黄色の発酵キャベツ、りんご、ローリエ、ねずの実、ベーコン
    de_sauerkraut: p => [
        xdeStoneBowl(p),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#e2d48a', .2, .2)}"/></g>`,
        `<g ${p.sh(.4)}>`, xdeShreds(p, 100, 100, 134, { cols: ['#efe4a8', '#e6d68e', '#f6efc6', '#dcc878'], n: 160, w: 2.2, len: 18, seed: 1 }), `</g>`,
        K.glaze(p, 100, 100, 120, '#f6eab0', { seed: 1, op: .2 }),
        ...[[84, 82, 10], [124, 116, -20]].map(([x, y, r]) => xdeDice(p, x, y, 10, r, '#f6eccc')),
        ...[[118, 80, 20], [80, 124, -30], [100, 100, 0]].map(([x, y, r]) => xdeSpeck(p, x, y, 10, r, { brown: .3 })),
        `<g ${p.sh(.5)}>`, xdeBay(p, 130, 96, 30, -40), `</g>`,
        ...[[96, 76], [108, 124], [72, 100], [138, 128]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${p.rg('#3a2a4a', .3, .2, .35, .32)}"/><circle cx="${x - 1}" cy="${y - 1}" r=".9" fill="#fff" opacity=".6"/>`),
        xdeGrains(p, 100, 100, 110, { cols: ['#6a4a1e'], n: 16, rx: 1.4, ry: .55, seed: 3, stroke: 0 }),
    ].join(''),

    // コールラビのクリーム煮: 白い鉢に、淡い緑白のコールラビの拍子木切り、白いソース、パセリ
    de_kohlrabi: p => [
        K.bowl(p, { glaze: '#8aa86a', inside: '#f3f0e4' }),
        K.liquid(p, { R: 72, c: '#ece2c0', op: 1, shine: false }),
        `<g ${p.sh(.6)}>`, ...xdeSpots('kr', 28, 60, 15).map(([x, y, r], i) => `<g ${T(x, y, r)}><rect x="-11" y="-4.4" width="22" height="8.8" rx="2" fill="${p.g(i % 3 ? '#e2ecb4' : '#d2e29c', .3, .25)}" stroke="#8aa858" stroke-width=".6"/><path d="M-9,-2 L8,-2" stroke="#fff" stroke-width="1" opacity=".7"/></g>`), `</g>`,
        K.glaze(p, 100, 100, 120, '#f8f4e2', { seed: 1, op: .4 }),
        xdeHerbs(p, 100, 100, 120, { n: 34 }),
        xdeShine(100, 100, 72, .35),
    ].join(''),

    // シュモアグルケン: 白い鉢に、皮をむいて煮た太いきゅうり（半透明の淡い緑）、サワークリームのソース、ベーコン、ディル
    de_schmorgurken: p => [
        K.bowl(p, { glaze: '#3e5f86', inside: '#f3efe6' }),
        K.liquid(p, { R: 72, c: '#ece8cc', op: 1, shine: false }),
        `<g ${p.sh(.6)}>`, ...xdeSpots('sg', 16, 56, 25).map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-14,4 A14,12 0 0 1 14,4 Q0,7 -14,4Z" fill="${p.g('#cfe0a0', .3, .22)}" stroke="#94b060" stroke-width=".7"/><path d="M-8,2 A8,6 0 0 1 8,2" fill="#e8eec4" opacity=".9"/>${[-4, 0, 4].map(d => `<ellipse cx="${d}" cy="1" rx="1.3" ry=".8" fill="#f6f6e0"/>`).join('')}<path d="M-9,-4 Q-3,-8 4,-7" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/></g>`), `</g>`,
        ...[[84, 90, 10], [122, 108, -20], [98, 128, 30]].map(([x, y, r]) => xdeSpeck(p, x, y, 9, r, { brown: .3 })),
        K.glaze(p, 100, 100, 120, '#f8f6e4', { seed: 1, op: .35 }),
        xdeDill(p, 84, 96, 26, -20), xdeDill(p, 118, 120, 24, 40), xdeDill(p, 112, 74, 22, -60), xdeDill(p, 72, 126, 20, 70),
        xdeShine(100, 100, 72, .35),
    ].join(''),

    // バター粉のカリフラワー: 白い鉢に、丸ごとゆでたカリフラワー、きつね色のバターパン粉、刻んだゆで卵、パセリ
    de_blumenkohl: p => [
        K.bowl(p, { glaze: '#4a6a52', inside: '#f1ece0' }),
        `<g ${p.sh(.6)}>`, xdeLeaf(p, 46, 128, 40, 40, { c: '#8ab85a', seed: 1 }), xdeLeaf(p, 152, 70, 40, -140, { c: '#8ab85a', seed: 2 }), `</g>`,
        xdeCauli(p, 100, 100, 138, { seed: 1 }),
        `<g ${p.sh(.4)}>`, xdeGrains(p, 104, 96, 90, { cols: ['#d89a3a', '#e8b458', '#c07a22'], n: 120, rx: 1.5, ry: 1.2, seed: 2, stroke: .2 }), `</g>`,
        K.glaze(p, 100, 96, 80, '#f6d06a', { seed: 1, op: .25 }),
        xdeGrains(p, 100, 100, 70, { cols: ['#fbf8ee', '#f6c840'], n: 14, rx: 2, ry: 1.6, seed: 3 }),
        xdeHerbs(p, 100, 100, 90, { n: 18 }),
    ].join(''),

    // ちりめんキャベツのクリーム煮: 白い鉢に、縮れた淡い緑のちりめんキャベツ、クリーム、ベーコン、ナツメグ
    de_rahmwirsing: p => [
        K.bowl(p, { glaze: '#7a6a52', inside: '#f1e9dc' }),
        K.liquid(p, { R: 72, c: '#e4e4bc', op: 1, shine: false }),
        `<g ${p.sh(.5)}>`, ...xdeSpots('rw', 18, 60, 20).map(([x, y, r], i) => xdeLeaf(p, x, y, 30, r, { c: i % 3 ? '#a8c868' : '#8ab250', vein: '#e8f0c4', seed: i, ruffle: .35 })), `</g>`,
        `<g ${p.sh(.3)}>`, xdeShreds(p, 100, 100, 120, { cols: ['#c8dc94', '#e6eebc'], n: 30, w: 2.4, len: 14, seed: 2 }), `</g>`,
        K.glaze(p, 100, 100, 124, '#f6f2d8', { seed: 1, op: .45 }),
        ...[[86, 90, 10], [120, 110, -30], [100, 132, 40], [128, 78, 60]].map(([x, y, r]) => xdeSpeck(p, x, y, 9, r, { brown: .4 })),
        xdeDust(p, 100, 100, 110, '#8a5a2a', 14, .6),
        xdeShine(100, 100, 72, .35),
    ].join(''),

    // ---------------- スープ・アイントプフ ----------------
    // エルプセンアイントプフ: 白いスープ皿に、とろりとした黄緑の割りえんどう豆、ソーセージの輪切り、じゃがいも・にんじん、ベーコン、パセリ
    de_erbsensuppe: p => [
        xdeSoupPlate(p, '#4a6a52'),
        K.liquid(p, { R: 74, c: '#b4a43a', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#cbbc5a" opacity=".45"/>`,
        xdeGrains(p, 100, 100, 140, { cols: ['#a8983a', '#c2b450'], n: 70, rx: 3, ry: 2.4, seed: 1, stroke: 0, jitter: .5 }),
        `<g ${p.sh(.6)}>`, ...xdeSpots('es', 14, 56, 16).map(([x, y, r], i) => i % 2 ? xdeDice(p, x, y, 12, r, '#ecd08a') : xdeDice(p, x, y, 9, r, '#ef7d2e')), `</g>`,
        ...[[84, 84, 10], [124, 98, -20], [96, 126, 30], [132, 132, 0], [64, 114, 40], [110, 70, 20]].map(([x, y, r]) => xdeWurstSlice(p, x, y, 22, r)),
        ...[[104, 100, 10], [76, 140, -20], [146, 80, 40]].map(([x, y, r]) => xdeSpeck(p, x, y, 9, r, { brown: .3 })),
        xdeHerbs(p, 100, 100, 110, { n: 22 }),
        xdeShine(100, 100, 74, .4),
    ].join(''),

    // グラーシュズッペ: 茶色の土の鉢に、パプリカで真っ赤な牛肉のスープ、角切りの牛肉・じゃがいも・赤パプリカ、浮いた赤い油、サワークリーム
    de_gulaschsuppe: p => [
        K.bowl(p, { glaze: '#7a4a2a', inside: '#efe4d0', lip: .86 }),
        `<circle cx="100" cy="100" r="88" fill="none" stroke="#a8724a" stroke-width="1.4" opacity=".8"/>`,
        K.liquid(p, { R: 74, c: '#9a3018', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="48" fill="#b8401e" opacity=".4"/>`,
        `<g ${p.sh(.7)}>`, ...xdeSpots('gs', 18, 58, 18).map(([x, y, r], i) => i % 3 === 0 ? xdeDice(p, x, y, 18, r, '#6a2e16') : i % 3 === 1 ? xdeDice(p, x, y, 14, r, '#e8c070') : K.pepperPiece(p, x, y, 13, r, { c: '#d8301e' })), `</g>`,
        K.glaze(p, 100, 100, 120, '#b8401e', { seed: 1, op: .25 }),
        xdeOil(p, 100, 100, 130, { n: 18, c: '#e8602a', op: .7, rmax: 3 }),
        xdeDollop(p, 104, 98, 26, { c: '#fbf6ec', seed: 1 }),
        xdeHerbs(p, 104, 98, 40, { n: 10 }),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // かぼちゃのスープ: 白いスープ皿に、なめらかなオレンジのポタージュ、クリームのうず、かぼちゃの種、パンプキンシードオイル
    de_kuerbissuppe: p => [
        xdeSoupPlate(p, '#c87a2a'),
        K.liquid(p, { R: 74, c: '#e88a26', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#f2a440" opacity=".45"/>`,
        xdeSwirl(p, 100, 100, 44, { turns: 1.7, c: '#fbf2e0', w: 5, op: .92 }),
        ...[[96, 98], [106, 94], [100, 106], [114, 104], [90, 108]].map(([x, y], i) => `<g ${T(x, y, i * 50)}><ellipse rx="4.2" ry="2.2" fill="${p.g('#4a6a2a', .3, .2)}" stroke="#2a3f16" stroke-width=".4"/></g>`),
        `<path d="M70,128 q8,-6 16,0 t16,0 M120,72 q8,-6 16,0" stroke="#2f3f1a" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".75"/>`,
        xdeHerbs(p, 100, 100, 70, { n: 10 }),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // ご飯入りトマトスープ: 白いスープ皿に、赤いトマトスープ、米粒、生クリームのひと筋、バジル
    de_tomatensuppe: p => [
        xdeSoupPlate(p, '#b03a2a'),
        K.liquid(p, { R: 74, c: '#c63a22', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#d8502e" opacity=".45"/>`,
        xdeRiceGrains(p, 100, 100, 136, { n: 90, cols: ['#f6dcc8', '#f0c8b0'] }),
        xdeSwirl(p, 100, 100, 36, { turns: 1.4, c: '#fbf6ec', w: 4.4, op: .92 }),
        ...[[118, 84, -20], [128, 92, 40]].map(([x, y, r]) => `<g ${p.sh(.4)}><g ${T(x, y, r)}><path d="M-8,0 Q-2,-6 8,0 Q-2,6 -8,0Z" fill="${p.g('#3f8a2c', .3, .25)}" stroke="#2a5f1c" stroke-width=".5"/><path d="M-7,0 L7,0" stroke="#7ab850" stroke-width=".6"/></g></g>`),
        xdeDust(p, 100, 100, 100, '#2a2420', 10, .5),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // フレードレズッペ: 白いスープ皿に、澄んだ牛のブイヨン、細く切った黄色いクレープ、シュニットラウフ
    de_flaedlesuppe: p => [
        xdeSoupPlate(p, '#c8a24a'),
        K.liquid(p, { R: 74, c: '#c8862e', op: .92, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#dca248" opacity=".35"/>`,
        `<g ${p.sh(.5)}>`, xdeShreds(p, 100, 100, 108, { cols: ['#f2d47a', '#ecc664', '#f6de90'], n: 44, w: 5.6, len: 26, seed: 1 }), `</g>`,
        xdeGrains(p, 100, 100, 120, { cols: ['#c88a3a'], n: 30, rx: 1.6, ry: .9, seed: 2, stroke: 0 }),
        xdeOil(p, 100, 100, 130, { n: 12, c: '#f2c45a', op: .7, rmax: 2.4 }),
        xdeChives(p, 100, 100, 120, { n: 36 }),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // グリースノッケルズッペ: 白いスープ皿に、澄んだブイヨン、卵形のセモリナの団子3つ、にんじんの輪切り、シュニットラウフ
    de_griessnockerl: p => [
        xdeSoupPlate(p, '#2c4c7c'),
        K.liquid(p, { R: 74, c: '#cc9238', op: .92, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#e0ac52" opacity=".35"/>`,
        ...[[76, 82, -20], [126, 88, 30], [98, 130, 80]].map(([x, y, r]) => `<g ${p.sh(1)}><g ${T(x, y, r, 1.2)}><path d="M-22,0 C-20,-12 18,-14 22,0 C18,14 -20,12 -22,0Z" fill="${p.rg('#f4e4b4', .3, .2, .36, .32)}" stroke="#d2bc80" stroke-width=".8"/><path d="M-14,-4 C-8,-10 8,-10 14,-5" stroke="#e6d29a" stroke-width="1.2" fill="none"/>${''}<path d="M-12,-6 Q-4,-11 6,-9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".75"/></g></g>`),
        ...[[110, 104], [64, 116], [134, 124], [86, 108], [122, 62]].map(([x, y]) => K.carrotRound(p, x, y, 12, {})),
        xdeOil(p, 100, 100, 130, { n: 12, c: '#f2c45a', op: .7, rmax: 2.4 }),
        xdeChives(p, 100, 100, 120, { n: 30 }),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // チーズとポロねぎのスープ: 白いスープ皿に、溶けたチーズのクリーム色のスープ、ポロねぎの輪切り、炒めたひき肉、マッシュルーム
    de_kaeselauch: p => [
        xdeSoupPlate(p, '#6a8a4a'),
        K.liquid(p, { R: 74, c: '#e8d090', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#f2e0a8" opacity=".45"/>`,
        xdeMince(p, 100, 100, 130, { c: '#8a5a34', n: 70, seed: 1 }),
        `<g ${p.sh(.5)}>`, ...xdeSpots('kl', 16, 58, 18).map(([x, y]) => xdeLeekRing(p, x, y, 16)), `</g>`,
        `<g ${p.sh(.4)}>`, ...[[90, 110, 20], [124, 80, -30], [70, 80, 60]].map(([x, y, r]) => xdeMush(p, x, y, 16, r)), `</g>`,
        K.glaze(p, 100, 100, 120, '#f6e6b0', { seed: 1, op: .3 }),
        xdeHerbs(p, 100, 100, 90, { n: 12 }),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // 白アスパラのクリームスープ: 白いスープ皿に、象牙色のなめらかなスープ、アスパラの穂先、クリーム、シュニットラウフ
    de_spargelcreme: p => [
        xdeSoupPlate(p, '#8a9a6a'),
        K.liquid(p, { R: 74, c: '#e6d6a4', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#f2e6c0" opacity=".5"/>`,
        xdeSwirl(p, 100, 100, 32, { turns: 1.3, c: '#fffcf2', w: 4, op: .85 }),
        `<g ${p.sh(.6)}>`, ...[[74, 78, 20], [126, 82, -30], [130, 124, 60], [76, 126, -60], [100, 66, 90], [104, 138, 10]].map(([x, y, r]) => xdeAsparagus(p, x, y, 40, 10, r, { c: '#f6f0d8', tip: '#d8cc8a' })), `</g>`,
        xdeChives(p, 100, 100, 90, { n: 22 }),
        xdeDust(p, 100, 100, 60, '#c8a46a', 8, .5),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // いんげんのアイントプフ: 赤いほうろう鍋に、いんげん、じゃがいも、にんじん、燻製ソーセージ、セイボリー
    de_bohneneintopf: p => [
        xdePot(p, { c: '#b8352a' }),
        K.liquid(p, { R: 74, c: '#b49a5a', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="48" fill="#c8b070" opacity=".4"/>`,
        `<g ${p.sh(.6)}>`, ...xdeSpots('be', 24, 60, 14).map(([x, y, r], i) => i % 3 === 2 ? xdeDice(p, x, y, 14, r, '#ecd08a') : i % 5 === 0 ? xdeDice(p, x, y, 9, r, '#ef7d2e') : K.greenBean(p, x, y, 22, r, { c: '#5a9a34' })), `</g>`,
        ...[[84, 84, 10], [124, 100, -20], [96, 128, 30], [134, 134, 0], [66, 116, 40]].map(([x, y, r]) => xdeWurstSlice(p, x, y, 22, r, { skin: '#9a3a22', meat: '#d88a70' })),
        xdeOil(p, 100, 100, 120, { n: 8, c: '#e8b84a', op: .6, rmax: 2.4 }),
        xdeHerbs(p, 100, 100, 110, { n: 22 }),
        xdeShine(100, 100, 74, .4),
    ].join(''),

    // 白キャベツとひき肉のアイントプフ: 白いスープ皿に、ざく切りのキャベツ、ひき肉、じゃがいも、にんじん、キャラウェイ、パセリ
    de_weisskohleintopf: p => [
        xdeSoupPlate(p, '#a87a3a'),
        K.liquid(p, { R: 74, c: '#b88a48', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="48" fill="#c8a060" opacity=".35"/>`,
        `<g ${p.sh(.5)}>`, ...xdeSpots('wk', 16, 58, 20).map(([x, y, r], i) => K.leafPiece(p, x, y, 26, r, { c: i % 2 ? '#e2e8b8' : '#d4e0a0', vein: '#f6f8e4', seed: i, cooked: true })), `</g>`,
        xdeMince(p, 100, 100, 120, { c: '#7a4a2a', n: 60, seed: 1 }),
        `<g ${p.sh(.5)}>`, ...xdeSpots('wk2', 12, 56, 18).map(([x, y, r], i) => i % 2 ? xdeDice(p, x, y, 12, r, '#ecd08a') : xdeDice(p, x, y, 9, r, '#ef7d2e')), `</g>`,
        xdeGrains(p, 100, 100, 110, { cols: ['#4a2a12'], n: 14, rx: 1.4, ry: .55, seed: 3, stroke: 0 }),
        xdeHerbs(p, 100, 100, 110, { n: 20 }),
        xdeShine(100, 100, 74, .4),
    ].join(''),

    // シュテックリューベンアイントプフ: 黒いほうろう鍋に、黄色いスウェーデンかぶの角切り、豚ばら肉の薄切り、にんじん、パセリ
    de_steckruebeneintopf: p => [
        xdePot(p, { c: '#2f3a44' }),
        K.liquid(p, { R: 74, c: '#d8a24a', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="48" fill="#e8bc62" opacity=".4"/>`,
        `<g ${p.sh(.6)}>`, ...xdeSpots('st', 22, 60, 15).map(([x, y, r], i) => i % 4 === 3 ? xdeDice(p, x, y, 11, r, '#ef7d2e') : xdeDice(p, x, y, 15, r, i % 2 ? '#f2b84a' : '#f0c45e')), `</g>`,
        `<g ${p.sh(.8)}>`, ...[[86, 80, -20], [122, 116, 30], [72, 126, 10]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-17" y="-11" width="34" height="22" rx="4" fill="${p.g('#d8a48a', .25, .22)}" stroke="#a8705a" stroke-width=".7"/><path d="M-16,-4 Q0,-6 16,-3.4 M-16,4.6 Q0,2.6 16,5" stroke="#f6ecd8" stroke-width="3.2" fill="none"/><rect x="-17" y="-11" width="34" height="4" rx="2" fill="#b8784a" opacity=".8"/><path d="M-12,-7 L8,-7.6" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".6"/></g>`), `</g>`,
        xdeHerbs(p, 100, 100, 120, { n: 26 }),
        xdeShine(100, 100, 74, .4),
    ].join(''),

    // ピッヒェルシュタイナー: 鉄の両手鍋に、牛肉と豚肉の角切り、じゃがいも、にんじん、セロリアック、ポロねぎ、たっぷりのパセリ
    de_pichelsteiner: p => [
        xdePot(p, { c: '#3b3533', inside: '#e8e0d4' }),
        K.liquid(p, { R: 74, c: '#8a5a2c', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="48" fill="#a06a36" opacity=".4"/>`,
        `<g ${p.sh(.6)}>`, ...xdeSpots('pi', 26, 60, 14).map(([x, y, r], i) => [xdeDice(p, x, y, 16, r, '#6a3a1e'), xdeDice(p, x, y, 15, r, '#ecd08a'), xdeDice(p, x, y, 10, r, '#ef7d2e'), xdeLeek(p, x, y, 15, r), xdeDice(p, x, y, 15, r, '#9a6a4a'), xdeDice(p, x, y, 11, r, '#f2eedc')][i % 6]), `</g>`,
        K.glaze(p, 100, 100, 120, '#a0682e', { seed: 1, op: .2 }),
        xdeHerbs(p, 100, 100, 130, { n: 46 }),
        xdeShine(100, 100, 74, .4),
    ].join(''),

    // ホッホツァイツズッペ: 白いスープ皿（金の線）に、澄んだブイヨン、小さな肉団子、卵豆腐（アイアーシュティッヒ）の菱形、アスパラ、にんじん、シュニットラウフ
    de_hochzeitssuppe: p => [
        xdeSoupPlate(p, '#c8a24a'),
        `<circle cx="100" cy="100" r="84" fill="none" stroke="#c8a24a" stroke-width="1" opacity=".7"/>`,
        K.liquid(p, { R: 74, c: '#cc9640', op: .92, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#e0b058" opacity=".35"/>`,
        ...[[80, 80], [120, 76], [134, 110], [70, 118], [104, 104], [96, 138]].map(([x, y]) => K.meatball(p, x, y, 18, { c: '#a8805a' })),
        `<g ${p.sh(.5)}>`, ...[[100, 74, 20], [64, 98, -10], [124, 132, 40], [82, 140, 0], [144, 90, 10], [114, 120, 30]].map(([x, y, r]) => `<g ${T(x, y, r + 45)}><rect x="-6" y="-6" width="12" height="12" rx="1.5" fill="${p.g('#f8dc6a', .35, .2)}" stroke="#d8b040" stroke-width=".6"/></g>`), `</g>`,
        `<g ${p.sh(.4)}>`, ...[[88, 98, 30], [118, 94, -40], [86, 124, 70]].map(([x, y, r]) => xdeAsparagus(p, x, y, 22, 6, r, { c: '#eee4c0' })), `</g>`,
        ...[[112, 60], [56, 106], [146, 126], [126, 150]].map(([x, y]) => K.carrotRound(p, x, y, 10, {})),
        xdeOil(p, 100, 100, 130, { n: 10, c: '#f2c45a', op: .7, rmax: 2.2 }),
        xdeChives(p, 100, 100, 120, { n: 30 }),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // 牛肉のスープ: 白いスープ皿に、澄んだ琥珀色のブイヨン、ほぐした牛すね肉、にんじん、セロリアック、ポロねぎ、細いスープ麺、パセリ
    de_rindfleischsuppe: p => [
        xdeSoupPlate(p, '#7a2a2a'),
        K.liquid(p, { R: 74, c: '#b8782c', op: .92, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#d0943e" opacity=".35"/>`,
        xdeShreds(p, 100, 100, 124, { cols: ['#f4dc90', '#ecd07a'], n: 40, w: 2, len: 22, seed: 1 }),
        `<g ${p.sh(.6)}>`, ...[[82, 82, 10, 1], [124, 100, -30, 2], [92, 126, 50, 3], [62, 106, 20, 4]].map(([x, y, r, k]) => K.beefSlice(p, x, y, 26, r, { c: '#8a5a3a', seed: k })), `</g>`,
        `<g ${p.sh(.4)}>`, ...[[108, 70], [140, 128], [72, 136], [114, 116], [146, 92]].map(([x, y]) => K.carrotRound(p, x, y, 12, {})), ...[[104, 92, 10], [128, 70, -20], [76, 62, 30]].map(([x, y, r]) => xdeDice(p, x, y, 8, r, '#f4efdc')), ...[[140, 108, 20], [96, 146, -20], [56, 86, 40]].map(([x, y, r]) => xdeLeek(p, x, y, 13, r)), `</g>`,
        xdeOil(p, 100, 100, 130, { n: 12, c: '#f2c45a', op: .7, rmax: 2.6 }),
        xdeHerbs(p, 100, 100, 110, { n: 24 }),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // グラウペンアイントプフ: 白いスープ皿に、ふっくらした丸麦、燻製豚（カスラー）の角切り、じゃがいも、にんじん、ポロねぎ、パセリ
    de_graupeneintopf: p => [
        xdeSoupPlate(p, '#5a6a8a'),
        K.liquid(p, { R: 74, c: '#c8ae78', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="48" fill="#d8c08a" opacity=".4"/>`,
        xdeGrains(p, 100, 100, 140, { cols: ['#efe4c4', '#e4d6b0', '#f6eed6'], n: 150, rx: 2.8, ry: 2.2, seed: 1, hi: .3 }),
        `<g ${p.sh(.6)}>`, ...xdeSpots('gr', 18, 58, 16).map(([x, y, r], i) => [xdeDice(p, x, y, 14, r, '#e89a8a'), xdeDice(p, x, y, 13, r, '#ecd08a'), xdeDice(p, x, y, 9, r, '#ef7d2e'), xdeLeek(p, x, y, 13, r)][i % 4]), `</g>`,
        xdeHerbs(p, 100, 100, 110, { n: 22 }),
        xdeShine(100, 100, 74, .4),
    ].join(''),

    // 白いんげん豆のアイントプフ: 緑のほうろう鍋に、トマトで赤みのある煮汁、白いんげん豆、ベーコン、じゃがいも、にんじん、パセリ
    de_weissebohnen: p => [
        xdePot(p, { c: '#4a6a4a' }),
        K.liquid(p, { R: 74, c: '#c47a4a', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="48" fill="#d4905a" opacity=".4"/>`,
        `<g ${p.sh(.4)}>`, xdeGrains(p, 100, 100, 140, { cols: ['#f6eedc', '#ece0c6', '#f2e6d0'], n: 60, rx: 6.4, ry: 4.4, seed: 1, hi: .7, jitter: .15 }), `</g>`,
        `<g ${p.sh(.6)}>`, ...xdeSpots('wb', 12, 56, 20).map(([x, y, r], i) => [xdeDice(p, x, y, 13, r, '#ecd08a'), xdeDice(p, x, y, 9, r, '#ef7d2e'), xdeSpeck(p, x, y, 11, r, { brown: .2 })][i % 3]), `</g>`,
        K.glaze(p, 100, 100, 120, '#d0703a', { seed: 1, op: .15 }),
        xdeHerbs(p, 100, 100, 110, { n: 22 }),
        xdeShine(100, 100, 74, .4),
    ].join(''),

    // ブロッコリーのクリームスープ: 白いスープ皿に、淡い緑のなめらかなスープ、小房のブロッコリー、クリームのうず、チーズ
    de_brokkolisuppe: p => [
        xdeSoupPlate(p, '#4a6a52'),
        K.liquid(p, { R: 74, c: '#86a446', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#9ab85a" opacity=".45"/>`,
        xdeSwirl(p, 100, 100, 40, { turns: 1.5, c: '#f8f4e6', w: 4.4, op: .88 }),
        ...[[70, 80, 20], [132, 86, -30], [86, 132, 40], [128, 128, 0], [100, 62, 10], [60, 112, -20], [142, 108, 30]].map(([x, y, r]) => K.broccoli(p, x, y, 26, r, { c: '#3a7a2a' })),
        xdeGrains(p, 100, 100, 40, { cols: ['#f6dc7a'], n: 10, rx: 1.8, ry: .9, seed: 2, stroke: .2 }),
        xdeDust(p, 100, 100, 100, '#2a2420', 10, .5),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // マッシュルームのクリームスープ: 白いスープ皿に、ベージュのなめらかなスープ、薄切りのマッシュルーム、クルトン、パセリ
    de_champignonsuppe: p => [
        xdeSoupPlate(p, '#6a4a3a'),
        K.liquid(p, { R: 74, c: '#c8b08a', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#d8c4a0" opacity=".45"/>`,
        xdeSwirl(p, 100, 100, 30, { turns: 1.2, c: '#f8f0e0', w: 3.6, op: .8 }),
        `<g ${p.sh(.5)}>`, ...[[74, 78, 20], [126, 80, -30], [136, 122, 60], [74, 124, -60], [104, 64, 90], [102, 138, 10]].map(([x, y, r]) => xdeMush(p, x, y, 24, r, { c: '#d6c09c' })), `</g>`,
        `<g ${p.sh(.5)}>`, ...[[96, 98, 10], [112, 108, 30], [88, 116, -20], [116, 88, 50]].map(([x, y, r]) => xdeCrouton(p, x, y, 11, r)), `</g>`,
        xdeHerbs(p, 100, 100, 110, { n: 22 }),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // 北ドイツの魚のスープ: 白いスープ皿（青い線）に、クリーム入りのスープ、白身魚の大きな切り身、じゃがいも、にんじん、ポロねぎ、ディル
    de_fischsuppe: p => [
        xdeSoupPlate(p, '#3c6a9a'),
        K.liquid(p, { R: 74, c: '#e2cf98', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#eee0b4" opacity=".45"/>`,
        ...[[80, 80, -20], [124, 100, 30], [86, 128, 10]].map(([x, y, r], i) => `<g ${p.sh(.8)}><g ${T(x, y, r)}><path d="${smooth(ring(1, 8, .3, rng('xdefs' + i), 22, 16), true, .6)}" fill="${p.g('#f6efdc', .2, .2)}" stroke="#d6caae" stroke-width=".7"/><path d="M-10,-9 Q-7,0 -10,9 M-3,-11 Q0,0 -3,11 M4,-11 Q7,0 4,11 M11,-8 Q13,0 11,8" stroke="#e2d6bc" stroke-width="1" fill="none"/><path d="M-12,-6 Q-4,-11 6,-10" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g></g>`),
        `<g ${p.sh(.5)}>`, ...xdeSpots('fsu', 12, 60, 18).filter(([x, y]) => Math.hypot(x - 80, y - 80) > 20 && Math.hypot(x - 124, y - 100) > 20 && Math.hypot(x - 86, y - 128) > 20).map(([x, y, r], i) => [xdeDice(p, x, y, 12, r, '#ecd08a'), K.carrotRound(p, x, y, 11, {}), xdeLeekRing(p, x, y, 13)][i % 3]), `</g>`,
        xdeDill(p, 96, 100, 26, -30), xdeDill(p, 118, 128, 22, 40), xdeDill(p, 66, 104, 20, 80), xdeDill(p, 130, 72, 20, -10),
        xdeShine(100, 100, 74, .45),
    ].join(''),

    // にんじんとしょうがのスープ: 白いスープ皿に、鮮やかなオレンジのポタージュ、クリームのうず、刻んだハーブ、唐辛子
    de_moehrensuppe: p => [
        xdeSoupPlate(p, '#e0782a', { glaze: '#f3efe6' }),
        K.liquid(p, { R: 74, c: '#ec7a22', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#f6963a" opacity=".45"/>`,
        xdeDollop(p, 102, 100, 34, { c: '#fbf6ea', seed: 2 }),
        `<path d="M80,86 Q92,70 112,78" stroke="#fbf2e0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
        xdeHerbs(p, 104, 98, 46, { n: 14 }),
        ...[[118, 112, 30], [86, 112, -20], [112, 82, 60]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-3,0 Q0,-2 3,0 Q0,2 -3,0Z" fill="#c42a1a"/></g>`),
        xdeDust(p, 100, 100, 110, '#8a3a12', 12, .55),
        xdeShine(100, 100, 74, .45),
    ].join(''),
};

// 余分な空白を詰めて SVG を軽くする
export default Object.fromEntries(Object.entries(xdeDishes).map(([k, fn]) => [k, p => fn(p).replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ')]));
