// World edition: Germany (de) — everyday German home cooking
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// ---------- このファイル専用の部品（wd〜） ----------
const wdBlur = (p, s = 2) => `filter="url(#${p.def('wdbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const wdShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .22)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .66)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;

function wdSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('wdspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}

// 小さな粒をまとめて（色ごとに1本のpath）
function wdGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, rx = 2, ry = 1.4, seed = 1, sy = 1, hi = 0, jitter = .3, stroke = .35 } = {}){
    const R = rng(p.id + 'wdg' + seed + x + y);
    const ds = cols.map(() => ''); let hs = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const ax = rx * (1 - jitter / 2 + R() * jitter), ay = ry * (1 - jitter / 2 + R() * jitter);
        ds[Math.floor(R() * cols.length)] += `M${f(gx - ax)},${f(gy)}a${f(ax)},${f(ay)} 0 1 0 ${f(ax * 2)},0a${f(ax)},${f(ay)} 0 1 0 ${f(-ax * 2)},0Z`;
        if (hi && R() < hi) hs += `M${f(gx - ax * .5)},${f(gy - ay * .35)}l${f(ax * .6)},${f(-ay * .2)}`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .3)}" stroke-width="${stroke}"/>`).join('') + (hs ? `<path d="${hs}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".8"/>` : '');
}

// さいの目
function wdDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .3, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/></g>`;
}

// 刻みパセリ
function wdHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'] } = {}){
    const R = rng(p.id + 'wdh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1 + R(); ds[i % cols.length] += `M${f(cx - rr)},${f(cy)}l${f(rr)},${f(-rr * .8)}l${f(rr)},${f(rr * .8)}l${f(-rr * .6)},${f(rr)}Z`; }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// 小口切りの細ねぎ（シュニットラウフ）
function wdChives(p, x, y, s, { n = 14, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'wdc' + seed + x);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy; const seg = `M${f(cx - 1.6)},${f(cy)}a1.6,1.4 0 1 0 3.2,0a1.6,1.4 0 1 0 -3.2,0Z`; if (R() < .6) d1 += seg; else d2 += seg; }
    return `<path d="${d1}" fill="none" stroke="#4f9a34" stroke-width="1.1"/><path d="${d2}" fill="none" stroke="#7ab850" stroke-width="1.1"/>`;
}
// ディル
function wdDill(p, x, y, L, r = 0){
    let d = `M${-L / 2},0 Q0,${f(-L * .06)} ${L / 2},0`;
    for (let i = 0; i < 7; i++){ const t = -L / 2 + (i + .7) * L / 8; d += `M${f(t)},${f(-L * .02)} l${f(L * .1)},${f(-L * .16)} M${f(t)},${f(-L * .02)} l${f(L * .1)},${f(L * .14)}`; }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#3f7f2a" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`;
}
// ローリエ
function wdBay(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-2,-6 10,0 Q-2,6 -10,0Z" fill="${p.g('#6f8a43', .25, .25)}" stroke="#4a5f2a" stroke-width=".6"/><path d="M-9,0 L9,0" stroke="#a8bb7a" stroke-width=".7"/></g>`;
}
// クリームのうず
function wdSwirl(p, x, y, R, { turns = 1.6, c = '#fffaf0', w = 4, op = .9, start = 0 } = {}){
    const pts = [];
    for (let i = 0; i <= 26; i++){ const t = i / 26, a = start + t * turns * 6.28, rr = R * (.12 + t * .88); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]); }
    const d = smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .12)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity="${f(op * .4)}" transform="translate(.6 .9)"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// ソーセージの輪切り（ヴィーナー: 赤みのある皮、ピンクの断面）
function wdWurstSlice(p, x, y, s, r = 0, { skin = '#b8583a', meat = '#eaa294' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.g(skin, .2, .25)}" stroke="${dk(skin, .3)}" stroke-width=".6"/></g>
        <ellipse rx="${f(s / 2 - 1.5)}" ry="${f(s * .46 - 1.5)}" fill="${p.rg(meat, .15, .15)}"/>
        <path d="M${f(-s * .26)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .28)} ${f(s * .12)},${f(-s * .26)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 半月切りの長ねぎ（ポロねぎ）
function wdLeek(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${-s / 2},0 A${s / 2},${f(s * .44)} 0 0 1 ${s / 2},0 Z" fill="${p.g('#e4eec0', .2, .2)}" stroke="#8fb05a" stroke-width=".9"/>
        <path d="M${f(-s * .32)},0 A${f(s * .32)},${f(s * .28)} 0 0 1 ${f(s * .32)},0 M${f(-s * .16)},0 A${f(s * .16)},${f(s * .14)} 0 0 1 ${f(s * .16)},0" fill="none" stroke="#a9c47a" stroke-width=".8"/></g>`;
}
// マッシュルームの薄切り
function wdMush(p, x, y, s, r = 0, { c = '#e3d2b4' } = {}){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-10,-8 0,-9 Q10,-8 10,0 Q6,1 3,1 L3,8 Q0,9.4 -3,8 L-3,1 Q-6,1 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M-8,-1 Q-7,-6 0,-7 Q7,-6 8,-1" stroke="${lt(c, .35)}" stroke-width="1" fill="none"/></g>`;
}
// ゆでた皮むきじゃがいも（丸ごと・半割り）
function wdPotato(p, x, y, s, r = 0, { c = '#f0d080', seed = 1, sy = .76 } = {}){
    const R = rng(p.id + 'wdp' + seed + x + y);
    const pts = ring(s / 2, 9, .14, R, 1, sy);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.rg(c, .3, .28, .36, .32)}" stroke="${dk(c, .28)}" stroke-width=".7"/></g>
        <circle cx="${f(s * .18)}" cy="${f(s * .08)}" r="1" fill="${dk(c, .3)}" opacity=".5"/><circle cx="${f(-s * .1)}" cy="${f(s * .18)}" r=".8" fill="${dk(c, .3)}" opacity=".4"/>
        <path d="M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .12)},${f(-s * .3)} ${f(s * .14)},${f(-s * .27)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// じゃがいもの薄い輪切り（ポテトサラダ）
function wdPotSlice(p, x, y, s, r = 0, { c = '#f0d58a', seed = 1 } = {}){
    const R = rng(p.id + 'wdps' + seed + x + y);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(ring(s / 2, 9, .1, R, 1, .78))}" fill="${p.rg(c, .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="${smooth(ring(s * .36, 8, .1, R, 1, .7))}" fill="none" stroke="${lt(c, .3)}" stroke-width=".8" opacity=".7"/>
        <path d="M${f(-s * .26)},${f(-s * .1)} Q${f(-s * .05)},${f(-s * .26)} ${f(s * .18)},${f(-s * .2)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// 白い深皿（縁に色の線）
function wdPlate(p, rim = '#4a6a52'){ return K.plate(p, { rim }); }
// ヴェスターヴァルト焼き風の灰色の器（コバルトの帯と点）
function wdStoneBowl(p, { R = 93 } = {}){
    const dots = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28; return `<circle cx="${f(100 + Math.cos(a) * (R - 6))}" cy="${f(100 + Math.sin(a) * (R - 6))}" r="1.8" fill="#2f4f8f" opacity=".85"/>`; }).join('');
    return K.bowl(p, { glaze: '#a9aca6', inside: '#efece4', R, lip: .84 }) + `<circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="#2f4f8f" stroke-width="2" opacity=".9"/>${dots}<circle cx="100" cy="100" r="${f(R * .84 + 1.5)}" fill="none" stroke="#2f4f8f" stroke-width="1.6" opacity=".8"/>`;
}
// ガラスの鉢（サラダ）
function wdGlassBowl(p){
    return `<g ${p.sh(1.4)}><circle cx="100" cy="100" r="93" fill="${p.rg('#e4eef0', .3, .12, .35, .3)}" opacity=".95"/></g>
        <circle cx="100" cy="100" r="91" fill="none" stroke="#c5d6da" stroke-width="2"/>
        <circle cx="100" cy="100" r="80" fill="${p.rg('#f2f7f7', .1, .1, .6, .62)}"/>
        <circle cx="100" cy="100" r="80" fill="none" stroke="#d2e0e3" stroke-width="1.2"/>
        <path d="M30,64 A82,82 0 0 1 64,28" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
}

// シュニッツェル（衣が波打って浮いた、薄い大判のカツ）
function wdSchnitzel(p, x, y, w, h, r = 0, { c = '#d9a044', seed = 1 } = {}){
    const R = rng(p.id + 'wdsz' + seed);
    const pts = ring(1, 16, .16, R, w / 2, h / 2);
    let bub = '', val = '';
    for (let i = 0; i < 9; i++){ bub += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .6)}" rx="${f(w * (.06 + R() * .07))}" ry="${f(h * (.06 + R() * .08))}" fill="${lt(c, .35)}" opacity=".7"/>`; }
    for (let i = 0; i < 7; i++){ const x0 = (R() - .5) * w * .7, y0 = (R() - .5) * h * .6; val += `<path d="M${f(x0)},${f(y0)} q${f((R() - .5) * 18)},${f((R() - .5) * 10)} ${f((R() - .5) * 26)},${f((R() - .5) * 14)}" stroke="${dk(c, .35)}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.3)}><g ${p.rough(3, .05)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .45)}" stroke-width="1"/></g></g>
        <g ${wdBlur(p, 2.6)}>${val}${bub}</g>
        <g ${p.crumb(.7)}><path d="${smooth(pts.map(([a, b]) => [a * .96, b * .95]))}" fill="${c}" opacity=".45"/></g>
        <path d="M${f(-w * .32)},${f(-h * .22)} Q${f(-w * .1)},${f(-h * .38)} ${f(w * .18)},${f(-h * .32)}" stroke="#fff3d6" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// レモンの輪切り（真上から）
function wdLemonWheel(p, x, y, s){
    const seg = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28; return `<path d="M0,0 L${f(Math.cos(a) * s * .38)},${f(Math.sin(a) * s * .38)}" stroke="#fffbe0" stroke-width="1.2"/>`; }).join('');
    return `<g ${T(x, y)}><g ${p.sh(.6)}><circle r="${s / 2}" fill="#eec22a"/></g><circle r="${f(s / 2 - 1.8)}" fill="#fbf2c4"/><circle r="${f(s / 2 - 3.2)}" fill="${p.rg('#f8e070', .3, .1)}"/>${seg}<circle r="${f(s * .06)}" fill="#fff8d8"/></g>`;
}
// パセリの小枝
function wdParsleySprig(p, x, y, s){
    return `<g ${p.sh(.5)}><path d="M${x},${y} l${f(s * .4)},${f(s * .5)}" stroke="#4f8a2c" stroke-width="1.4"/>${[0, 1, 2, 3, 4].map(i => { const a = -2.4 + i * .55; return `<circle cx="${f(x + Math.cos(a) * s * .3)}" cy="${f(y + Math.sin(a) * s * .3)}" r="${f(s * .2)}" fill="${i % 2 ? '#3d8a2c' : '#4fa03a'}"/>`; }).join('')}<circle cx="${x}" cy="${y}" r="${f(s * .2)}" fill="#45952f"/></g>`;
}
// フライドポテト
function wdFries(p, x, y, s, { n = 11, seed = 1, dir = 30 } = {}){
    const R = rng(p.id + 'wdfr' + seed);
    let out = '';
    for (let i = 0; i < n; i++){ const L = s * (.5 + R() * .45), cx = x + (R() - .5) * s * .5, cy = y + (R() - .5) * s * .5, a = dir + (R() - .5) * 70; out += `<g ${T(cx, cy, a)}><rect x="${f(-L / 2)}" y="-3" width="${f(L)}" height="6" rx="1.6" fill="${p.g('#efc25a', .3, .25)}" stroke="#b9852a" stroke-width=".6"/><path d="M${f(-L / 2 + 2)},-1.4 L${f(L / 2 - 3)},-1.4" stroke="#fff4c8" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`; }
    return `<g ${p.sh(.8)}>${out}</g>`;
}
// からし（マスタード）のひと盛り
function wdMustard(p, x, y, s, { c = '#d9a420' } = {}){
    const R = rng(p.id + 'wdmu' + x);
    return `<g ${p.sh(.5)}><path ${T(x, y)} d="${smooth(ring(s / 2, 8, .3, R, 1.2, .9))}" fill="${p.rg(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g><ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .14)}" rx="${f(s * .16)}" ry="${f(s * .08)}" fill="#fff" opacity=".7"/>`;
}
// 白身魚の切り身（バターで焼いた）
function wdFish(p, x, y, L, W, r = 0, { c = '#f0dcb4', brown = '#c98a42', seed = 1 } = {}){
    const R = rng(p.id + 'wdfi' + seed);
    const body = `M${-L / 2},${f(-W * .1)} C${f(-L * .4)},${f(-W * .55)} ${f(L * .2)},${f(-W * .6)} ${f(L * .42)},${f(-W * .28)} Q${L / 2},0 ${f(L * .44)},${f(W * .22)} C${f(L * .2)},${f(W * .52)} ${f(-L * .36)},${f(W * .48)} ${-L / 2},${f(W * .1)} Q${f(-L * .53)},0 ${-L / 2},${f(-W * .1)}Z`;
    let flakes = '';
    for (let i = 0; i < 6; i++){ const fx = -L * .34 + i * L * .14; flakes += `<path d="M${f(fx)},${f(-W * .36)} Q${f(fx + L * .05)},0 ${f(fx - L * .01)},${f(W * .34)}" stroke="${dk(c, .18)}" stroke-width="1" fill="none" opacity=".55"/>`; }
    let sp = '';
    for (let i = 0; i < 6; i++) sp += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * W * .5)}" rx="${f(L * (.06 + R() * .07))}" ry="${f(W * (.08 + R() * .08))}" fill="${brown}" opacity="${f(.35 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${body}" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>
        <g ${wdBlur(p, 2.4)}><path d="${body}" fill="none" stroke="${brown}" stroke-width="5" opacity=".6"/>${sp}</g>${flakes}
        <path d="M${f(-L * .3)},${f(-W * .22)} Q${f(-L * .05)},${f(-W * .42)} ${f(L * .22)},${f(-W * .3)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// シュペッツレ（不揃いな短い卵麺）
function wdSpaetzle(p, x, y, s, { n = 70, seed = 1, c = '#f0cc62', sy = 1 } = {}){
    const R = rng(p.id + 'wdsp' + seed);
    const L = [['', ''], ['', ''], ['', '']];
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, ang = R() * 6.28, len = 7 + R() * 7, b = (R() - .5) * 6;
        const x1 = cx - Math.cos(ang) * len / 2, y1 = cy - Math.sin(ang) * len / 2, x2 = cx + Math.cos(ang) * len / 2, y2 = cy + Math.sin(ang) * len / 2;
        const seg = `M${f(x1)},${f(y1)} Q${f(cx - Math.sin(ang) * b)},${f(cy + Math.cos(ang) * b)} ${f(x2)},${f(y2)}`;
        L[i % 3][(x1 + y1) < 2 * 100 - 20 ? 1 : 0] += seg;
    }
    return `<g ${p.sh(.7)}>${L.map(([a, b]) => `<path d="${a}" stroke="${dk(c, .3)}" stroke-width="5.6" fill="none" stroke-linecap="round"/><path d="${a}" stroke="${c}" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${dk(c, .3)}" stroke-width="5.6" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .2)}" stroke-width="4.2" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
}
// カリカリの揚げ玉ねぎ（茶色の細い輪）
function wdCrispOnion(p, x, y, s, { n = 20, seed = 1 } = {}){
    const R = rng(p.id + 'wdco' + seed);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 4 + R() * 4, a0 = R() * 6.28, sw = 2 + R() * 2.4; const seg = `M${f(cx + Math.cos(a0) * rr)},${f(cy + Math.sin(a0) * rr)} A${f(rr)},${f(rr * .8)} 0 0 1 ${f(cx + Math.cos(a0 + sw) * rr)},${f(cy + Math.sin(a0 + sw) * rr)}`; if (R() < .5) d1 += seg; else d2 += seg; }
    return `<g ${p.sh(.5)}><path d="${d1}" stroke="#8a4a16" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="${d2}" stroke="#b46a22" stroke-width="2.6" fill="none" stroke-linecap="round"/></g><path d="${d2}" stroke="#e2a050" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// カルトッフェルプッファー（すりおろしたじゃがいもを焼いた薄い円盤。ふちがカリッと）
function wdPuffer(p, x, y, s, r = 0, { seed = 1, c = '#cf8a32' } = {}){
    const R = rng(p.id + 'wdpf' + seed);
    const pts = ring(s / 2, 14, .14, R, 1, .9);
    let sh1 = '', sh2 = '';
    for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .4, cx = Math.cos(a) * d, cy = Math.sin(a) * d * .9, ang = R() * 3.14, L = 5 + R() * 7; const seg = `M${f(cx - Math.cos(ang) * L / 2)},${f(cy - Math.sin(ang) * L / 2)} l${f(Math.cos(ang) * L)},${f(Math.sin(ang) * L)}`; if (R() < .5) sh1 += seg; else sh2 += seg; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><g ${p.rough(3.6, .14)}><path d="${smooth(pts)}" fill="${p.g(dk(c, .1), .25, .35)}" stroke="${dk(c, .5)}" stroke-width=".9"/></g></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .8, b * .8]))}" fill="${lt(c, .15)}" opacity=".5"/>
        <path d="${sh1}" stroke="${lt(c, .4)}" stroke-width="1.8" stroke-linecap="round" opacity=".85"/><path d="${sh2}" stroke="${dk(c, .35)}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-s * .28)},${f(-s * .16)} Q${f(-s * .08)},${f(-s * .32)} ${f(s * .16)},${f(-s * .28)}" stroke="#fff4d8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 細切りの具をまとめて（キャベツ・紫キャベツ）: 色ごとに1本のpath
function wdShreds(p, x, y, s, { cols = ['#f1f4dc'], n = 60, w = 2, len = 12, seed = 1, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'wdsh' + seed + x);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, ang = R() * 3.14, L = len * (.6 + R() * .7), b = (R() - .5) * L * .5;
        ds[Math.floor(R() * cols.length)] += `M${f(cx - Math.cos(ang) * L / 2)},${f(cy - Math.sin(ang) * L / 2)} q${f(Math.cos(ang) * L / 2 - Math.sin(ang) * b)},${f(Math.sin(ang) * L / 2 + Math.cos(ang) * b)} ${f(Math.cos(ang) * L)},${f(Math.sin(ang) * L)}`;
    }
    return cols.map((c, i) => (outline ? `<path d="${ds[i]}" stroke="${dk(c, .3)}" stroke-width="${w + .9}" fill="none" stroke-linecap="round"/>` : '') + `<path d="${ds[i]}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`).join('');
}
// 木のパン板（丸）
function wdBoard(p, { R = 94, c = '#c49460' } = {}){
    const Rn = rng(p.id + 'wdbd');
    let grain = '';
    for (let i = 0; i < 9; i++){ const yy = 100 - R + 14 + i * (2 * R - 28) / 8, hw = Math.sqrt(Math.max(0, R * R - (yy - 100) ** 2)) - 8; grain += `<path d="M${f(100 - hw)},${f(yy)} Q${f(100 - hw / 3)},${f(yy + (Rn() - .5) * 6)} 100,${f(yy + (Rn() - .5) * 3)} T${f(100 + hw)},${f(yy + (Rn() - .5) * 4)}" stroke="${dk(c, .18)}" stroke-width="${f(.6 + Rn() * .7)}" fill="none" opacity=".45"/>`; }
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.g(c, .25, .2)}" stroke="${dk(c, .3)}" stroke-width="1"/></g>${grain}<circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.4" opacity=".7"/>`;
}
// 田舎パン（丸い大きなパン、粉と割れ目）
function wdLoaf(p, x, y, w, h, r = 0){
    const R = rng(p.id + 'wdlf');
    const pts = ring(1, 14, .06, R, w / 2, h / 2);
    let cracks = '';
    for (let i = 0; i < 9; i++){ const cx = (R() - .5) * w * .6, cy = (R() - .5) * h * .6; cracks += `<path d="M${f(cx)},${f(cy)} l${f((R() - .5) * 14)},${f((R() - .5) * 10)} l${f((R() - .5) * 10)},${f((R() - .5) * 10)}" stroke="#d9b07a" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.4)}><path d="${smooth(pts)}" fill="${p.g('#8a5226', .25, .35)}" stroke="#5a3214" stroke-width="1"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .8 - 3, b * .78 - 3]))}" fill="#a86a34" opacity=".55"/>
        ${cracks}
        <g ${wdBlur(p, 3)}><ellipse cx="${f(-w * .08)}" cy="${f(-h * .08)}" rx="${f(w * .3)}" ry="${f(h * .24)}" fill="#f4ead8" opacity=".55"/></g>
        ${K.sprinkle(p, -w * .06, -h * .06, w * .6, { c: '#fbf6ec', n: 30, r: .9 })}</g>`;
}
// 混合パンのスライス（茶色い皮、灰茶色のクラム）
function wdBreadSlice(p, x, y, w, h, r = 0){
    const R = rng(p.id + 'wdbs' + x + y);
    const shape = `M${-w / 2},${f(-h * .2)} Q${-w / 2},${-h / 2} ${f(-w * .3)},${-h / 2} L${f(w * .3)},${-h / 2} Q${w / 2},${-h / 2} ${w / 2},${f(-h * .2)} L${w / 2},${f(h * .3)} Q${w / 2},${h / 2} ${f(w * .35)},${h / 2} L${f(-w * .35)},${h / 2} Q${-w / 2},${h / 2} ${-w / 2},${f(h * .3)}Z`;
    let holes = '';
    for (let i = 0; i < 10; i++) holes += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .7)}" rx="${f(.8 + R() * 1.4)}" ry="${f(.6 + R() * 1)}" fill="#9a7c56" opacity=".7"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${shape}" fill="${p.g('#7a4620', .2, .3)}" stroke="#4e2a10" stroke-width=".7"/></g>
        <g transform="scale(.88 .86)"><path d="${shape}" fill="${p.rg('#cfb48a', .25, .15)}"/></g>${holes}</g>`;
}

// ---------- 料理 ----------
export default {
    // 毎日のパン: 丸い木のパン板に、粉をふった田舎パンと、切った混合パン3枚
    de_staple: p => [
        wdBoard(p),
        wdLoaf(p, 84, 80, 112, 92, -10),
        wdBreadSlice(p, 118, 138, 54, 46, -14), wdBreadSlice(p, 136, 124, 54, 46, 6), wdBreadSlice(p, 150, 108, 52, 44, 22),
    ].join(''),

    // フリカデレ: 白い皿（緑の線）に、こんがり焼いたひき肉のパティ3つ、マスタード、ポテトサラダ、パセリ
    de_frikadellen: p => [
        wdPlate(p),
        `<g ${p.sh(.6)}>`, ...[[136, 62, 18], [152, 82, -30], [128, 84, 60], [146, 104, 10], [160, 62, 40], [120, 66, -50]].map(([x, y, r], i) => wdPotSlice(p, x, y, 22, r, { seed: i })), `</g>`,
        wdChives(p, 140, 80, 40, { n: 12 }),
        K.patty(p, 72, 90, 58, 54, 10, { c: '#7d4521' }),
        K.patty(p, 112, 128, 58, 54, -20, { c: '#84491f' }),
        K.patty(p, 66, 138, 54, 50, 30, { c: '#7a4320' }),
        wdMustard(p, 150, 136, 20),
        wdParsleySprig(p, 96, 98, 14),
    ].join(''),

    // シュニッツェル: 大きな白い皿に、波打った衣の豚のシュニッツェル、レモンの輪切りとパセリ、フライドポテト
    de_schnitzel: p => [
        wdPlate(p, '#8a8a84'),
        wdFries(p, 142, 140, 52, { n: 12, dir: 60 }),
        wdSchnitzel(p, 88, 90, 140, 100, -20),
        wdLemonWheel(p, 98, 86, 30),
        wdParsleySprig(p, 104, 82, 14),
        K.lemon(p, 156, 70, 28, 40),
    ].join(''),

    // 鶏肉のフリカッセ: 白い皿に、ご飯と、白いクリームソースの鶏肉・グリンピース・にんじん・マッシュルーム・アスパラ
    de_frikassee: p => [
        wdPlate(p, '#6a7f9a'),
        K.rice(p, 64, 98, 76, { sy: 1.3 }),
        K.pool(p, 124, 104, 100, '#f3e6c4', { op: 1, seed: 1, sy: 1.1 }),
        `<g ${p.sh(.7)}>`,
        ...[[118, 76, 20], [140, 104, -30], [112, 120, 60], [132, 138, 120], [104, 96, 160]].map(([x, y, r], i) => K.chickenPiece(p, x, y, 28, r, { c: '#efdcb4', skin: '#e6cc9c', seed: i })),
        ...[[148, 76, 20], [122, 144, -40], [96, 132, 70]].map(([x, y, r]) => wdMush(p, x, y, 16, r)),
        ...[[156, 120, 70], [134, 66, -20]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-9" y="-3.4" width="18" height="6.8" rx="3.4" fill="${p.g('#efe6c4', .3, .2)}" stroke="#c9b98a" stroke-width=".6"/><path d="M5,-3.4 Q11,0 5,3.4" fill="#e2d7a0"/></g>`),
        `</g>`,
        K.glaze(p, 126, 104, 76, '#fbf2d8', { seed: 4, op: .45 }),
        ...[[128, 90], [146, 122], [110, 108], [136, 132], [118, 136], [152, 96], [100, 116], [132, 116], [124, 72], [144, 140]].map(([x, y]) => `<g ${p.sh(.4)}><circle cx="${x}" cy="${y}" r="3.4" fill="${p.rg('#6fb43c', .3, .25, .35, .32)}" stroke="#3f7a22" stroke-width=".5"/></g>`),
        ...[[106, 84, 0], [150, 108, 30], [120, 128, -20], [138, 92, 60], [114, 148, 10]].map(([x, y, r]) => wdDice(p, x, y, 8, r, '#ef7f30')),
        wdHerbs(p, 124, 104, 60, { n: 12 }),
    ].join(''),

    // 白身魚のマスタードソース: 白い皿に、焼いた魚の切り身、なめらかなマスタードソース、ゆでじゃがいも、ディル、レモン
    de_fisch: p => [
        wdPlate(p, '#3c6a9a'),
        K.pool(p, 88, 104, 126, '#ecc75a', { op: .95, seed: 2, sy: .8 }),
        wdFish(p, 84, 98, 112, 56, -12),
        K.glaze(p, 86, 110, 70, '#f3d36a', { seed: 1, op: .5 }),
        wdGrains(p, 88, 114, 70, { cols: ['#b8872a'], n: 22, rx: .9, ry: .8, seed: 3, sy: .5 }),
        wdDill(p, 76, 92, 26, -30), wdDill(p, 96, 102, 22, 20),
        wdPotato(p, 148, 76, 36, 20, { seed: 1 }), wdPotato(p, 152, 114, 36, -30, { seed: 2 }), wdPotato(p, 124, 144, 34, 50, { seed: 3 }),
        wdHerbs(p, 144, 106, 70, { n: 18 }),
        K.lemon(p, 64, 146, 28, 20),
    ].join(''),

    // ケーゼシュペッツレ: 黒い鉄のフライパンに、チーズのとろけたシュペッツレ、カリカリの揚げ玉ねぎ、小口ねぎ
    de_spaetzle: p => [
        `<g ${p.sh(1.6)}><rect x="160" y="91" width="40" height="18" rx="7" fill="${p.g('#3a3432', .2, .3)}"/><circle cx="100" cy="100" r="88" fill="${p.rg('#3b3533', .2, .3, .35, .3)}"/></g>`,
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#2a2422', .08, .2, .62, .64)}"/>`,
        `<path d="M30,66 A80,80 0 0 1 66,30" stroke="#8a827c" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
        `<circle cx="100" cy="100" r="72" fill="${p.rg('#e8b850', .1, .25)}"/>`,
        wdSpaetzle(p, 100, 100, 136, { n: 90 }),
        `<g opacity=".9">`, ...[[84, 88, 40], [120, 112, 42], [96, 128, 30], [126, 76, 28], [66, 118, 26]].map(([x, y, s], i) => K.pool(p, x, y, s, '#f6dc7a', { seed: i + 2, sy: .7, op: .75 })), `</g>`,
        `<g ${wdBlur(p, 2.5)}>`, ...[[96, 96, 10], [128, 120, 8], [72, 110, 7]].map(([x, y, s]) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#c98a2a" opacity=".5"/>`), `</g>`,
        wdCrispOnion(p, 104, 98, 70, { n: 26 }),
        wdChives(p, 100, 100, 90, { n: 16 }),
    ].join(''),

    // レンズ豆のアイントプフ: 白い深皿（緑の線）に、茶色のレンズ豆の煮込み、じゃがいも・にんじん・ポロねぎ、ソーセージの輪切り、パセリ
    de_linsen: p => [
        K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#4a6a52" stroke-width="1.8" opacity=".85"/>`,
        K.liquid(p, { R: 73, c: '#8a5c34', op: 1, shine: false }),
        wdGrains(p, 100, 100, 140, { cols: ['#7a5232', '#94683e', '#6a4428'], n: 210, rx: 2.4, ry: 1.9, hi: .3, seed: 1 }),
        `<g ${p.sh(.6)}>`,
        ...wdSpots('lin', 16, 58, 18).map(([x, y, r], i) => i % 3 === 0 ? wdDice(p, x, y, 14, r, '#ecd08a') : i % 3 === 1 ? wdDice(p, x, y, 10, r, '#ef7d2e') : wdLeek(p, x, y, 13, r)),
        `</g>`,
        ...[[84, 84, 10], [124, 96, -20], [96, 124, 30], [136, 130, 0], [66, 118, 40]].map(([x, y, r]) => wdWurstSlice(p, x, y, 22, r)),
        wdHerbs(p, 100, 100, 110, { n: 20 }),
        wdShine(100, 100, 73, .35),
    ].join(''),

    // カルトッフェルプッファーとりんごのムース: 白い皿に、カリッと焼いたじゃがいものパンケーキ3枚、アップルムース
    de_puffer: p => [
        wdPlate(p, '#8a6a4a'),
        wdPuffer(p, 74, 78, 70, 10, { seed: 1 }),
        wdPuffer(p, 64, 128, 68, -30, { seed: 2, c: '#c98430' }),
        wdPuffer(p, 112, 112, 72, 60, { seed: 3 }),
        `<g ${p.sh(.9)}><path d="${smooth(ring(26, 11, .18, rng('wdapf')).map(([a, b]) => [a + 146, b * .9 + 74]))}" fill="${p.rg('#f0d898', .3, .2)}" stroke="#cfb06a" stroke-width=".7"/></g>`,
        wdGrains(p, 146, 74, 42, { cols: ['#e6c47a', '#f8e8b8'], n: 24, rx: 1.6, ry: 1.1, seed: 4, sy: .9, stroke: 0 }),
        `<path d="M132,66 Q140,58 152,60" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`,
        K.sprinkle(p, 146, 74, 30, { c: '#a0602a', n: 6, r: .7 }),
    ].join(''),

    // シュヴァーベン風ポテトサラダ: 白い鉢に、だしと酢でしっとりしたじゃがいもの薄切り、玉ねぎのみじん切り、シュニットラウフ
    de_kartoffelsalat: p => [
        K.bowl(p, { glaze: '#f2eee4', inside: '#fbf8f0' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#4a6a52" stroke-width="1.6" opacity=".85"/>`,
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#e6c06a', .2, .2)}"/></g>`,
        ...wdSpots('ks', 30, 58, 14).map(([x, y, r], i) => wdPotSlice(p, x, y, 26 + (i % 3) * 2, r, { seed: i, c: i % 4 ? '#f0d28a' : '#ecc87a' })),
        K.glaze(p, 100, 100, 120, '#f6dc8a', { seed: 1, op: .25 }),
        wdGrains(p, 100, 100, 120, { cols: ['#f6f0dc', '#ece0c0'], n: 30, rx: 1.5, ry: 1.1, seed: 2 }),
        wdChives(p, 100, 100, 120, { n: 36 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 18, r: .5 }),
    ].join(''),

    // きゅうりのサラダ: ガラスの鉢に、薄切りのきゅうり、ディル、サワークリームのドレッシング
    de_gurkensalat: p => [
        wdGlassBowl(p),
        `<g ${p.sh(.5)}>`, ...wdSpots('gk', 34, 60, 12).map(([x, y, r]) => K.cucumberSlice(p, x, y, 22, r, { oval: 1.05 })), `</g>`,
        `<g opacity=".75">`, ...[[84, 90, 30], [122, 112, 28], [100, 132, 22], [118, 76, 20]].map(([x, y, s], i) => K.pool(p, x, y, s, '#fbf8ee', { seed: i + 1, sy: .7, op: .7 })), `</g>`,
        wdDill(p, 92, 98, 28, -20), wdDill(p, 118, 120, 24, 40), wdDill(p, 70, 120, 22, 80), wdDill(p, 128, 82, 22, -60), wdDill(p, 100, 66, 20, 10),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 16, r: .5 }),
    ].join(''),

    // 赤キャベツの煮込み: 白い鉢に、つやのある紫の千切りキャベツ、りんご、ローリエ、クローブ
    de_rotkohl: p => [
        K.bowl(p, { glaze: '#f2eee4', inside: '#fbf8f0' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#8a3a5a" stroke-width="1.6" opacity=".7"/>`,
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="70" fill="${p.rg('#6a1f48', .15, .25)}"/></g>`,
        `<g ${p.sh(.4)}>`, wdShreds(p, 100, 100, 132, { cols: ['#7a2452', '#93306a', '#5e1a40', '#a8487a'], n: 130, w: 2.6, len: 15, seed: 1 }), `</g>`,
        K.glaze(p, 98, 98, 110, '#c0407a', { seed: 1, op: .18 }),
        K.sprinkle(p, 100, 100, 110, { c: '#ffffff', n: 22, r: .9 }),
        `<g ${p.sh(.5)}>`, wdBay(p, 128, 120, 28, -30), `</g>`,
        ...[[84, 82], [112, 92], [90, 120]].map(([x, y]) => `<g ${T(x, y)}><circle r="2" fill="#4a2a16"/><path d="M0,0 l0,6" stroke="#4a2a16" stroke-width="1.2"/></g>`),
    ].join(''),

    // キャベツのサラダ: 青い鉢に、細く刻んだ白キャベツ、にんじん、赤パプリカ、キャラウェイ
    de_krautsalat: p => [
        K.bowl(p, { glaze: '#3e5f86', inside: '#f3efe6' }),
        `<g ${p.sh(.8)}><circle cx="100" cy="100" r="68" fill="${p.rg('#e3ecc4', .2, .15)}"/></g>`,
        `<g ${p.sh(.4)}>`, wdShreds(p, 100, 100, 130, { cols: ['#f6f8e4', '#e6efc4', '#d4e4a4', '#eef3d8'], n: 150, w: 2, len: 16, seed: 1 }), `</g>`,
        wdShreds(p, 100, 100, 110, { cols: ['#ef8a30', '#f39d48'], n: 28, w: 1.6, len: 12, seed: 2 }),
        ...wdSpots('kr', 8, 54, 20).map(([x, y, r]) => wdDice(p, x, y, 6, r, '#d8302a')),
        wdGrains(p, 100, 100, 110, { cols: ['#5a3a1e'], n: 26, rx: 1.4, ry: .6, seed: 3, stroke: 0 }),
        K.glaze(p, 100, 100, 110, '#f4f0c8', { seed: 2, op: .15 }),
    ].join(''),

    // ほうれん草のクリーム煮: 白い鉢に、なめらかな深緑のほうれん草、生クリームのひと筋、ナツメグ
    de_rahmspinat: p => [
        K.bowl(p, { glaze: '#7a6a52', inside: '#f1e9dc' }),
        `<g ${p.sh(.8)}><path d="${smooth(ring(68, 14, .08, rng('wdrs')).map(([a, b]) => [a + 100, b + 100]))}" fill="${p.rg('#3f6a26', .2, .3)}"/></g>`,
        wdGrains(p, 100, 100, 128, { cols: ['#2f5a1c', '#4f7f30', '#5f8f3a'], n: 160, rx: 3, ry: 2, seed: 1, stroke: 0, jitter: .6 }),
        wdSwirl(p, 100, 100, 34, { turns: 1.2, c: '#f2f0dc', w: 3.4, op: .8 }),
        K.glaze(p, 98, 96, 100, '#9ac06a', { seed: 1, op: .22 }),
        K.sprinkle(p, 100, 100, 90, { c: '#8a5a2a', n: 12, r: .6 }),
        wdShine(100, 100, 68, .45),
    ].join(''),

    // にんじんとグリンピースのバター煮: 白い鉢に、つやのあるグリンピースと角切りにんじん、パセリ
    de_erbsenmoehren: p => [
        K.bowl(p, { glaze: '#4a6a52', inside: '#f1ece0' }),
        `<g ${p.sh(.7)}><circle cx="100" cy="100" r="68" fill="${p.rg('#8ab84a', .15, .3)}"/></g>`,
        `<g ${p.sh(.4)}>`,
        wdGrains(p, 100, 100, 132, { cols: ['#6fb43c', '#5ea232', '#82c44a'], n: 120, rx: 3.8, ry: 3.6, hi: .7, seed: 1, jitter: .15 }),
        ...wdSpots('em', 24, 58, 13).map(([x, y, r]) => wdDice(p, x, y, 10, r, '#ef7d2a')),
        `</g>`,
        K.glaze(p, 98, 98, 110, '#f6e08a', { seed: 1, op: .2 }),
        wdHerbs(p, 100, 100, 100, { n: 18 }),
    ].join(''),

    // パセリポテト: 白い鉢に、皮をむいてゆでたじゃがいも、溶かしバター、刻みパセリ
    de_salzkartoffeln: p => [
        K.bowl(p, { glaze: '#3e5f86', inside: '#f3efe6' }),
        wdPotato(p, 74, 78, 50, 20, { seed: 1 }), wdPotato(p, 124, 70, 48, -30, { seed: 2 }), wdPotato(p, 136, 118, 50, 60, { seed: 3 }),
        wdPotato(p, 84, 128, 50, -10, { seed: 4 }), wdPotato(p, 108, 100, 52, 80, { seed: 5 }), wdPotato(p, 58, 108, 34, 40, { seed: 6 }), wdPotato(p, 116, 146, 32, 0, { seed: 7 }),
        K.glaze(p, 100, 100, 110, '#f8e08a', { seed: 1, op: .22 }),
        wdHerbs(p, 100, 100, 120, { n: 46 }),
    ].join(''),

    // じゃがいものスープ: 灰色にコバルトのヴェスターヴァルト焼きの器に、とろりとしたじゃがいものスープ、角切りの野菜、ポロねぎ、ソーセージ、パセリ
    de_kartoffelsuppe: p => [
        wdStoneBowl(p),
        K.liquid(p, { R: 72, c: '#e6cf8e', op: 1 }),
        `<circle cx="96" cy="94" r="48" fill="#f2e2ae" opacity=".5"/>`,
        `<g ${p.sh(.6)}>`,
        ...wdSpots('kss', 18, 56, 16).map(([x, y, r], i) => i % 3 === 2 ? wdDice(p, x, y, 10, r, '#ef7d2e') : i % 3 === 1 ? wdLeek(p, x, y, 14, r) : wdDice(p, x, y, 15, r, '#f0d888')),
        `</g>`,
        `<circle cx="100" cy="100" r="68" fill="#efdca0" opacity=".2"/>`,
        ...[[86, 88, 10], [122, 104, -20], [100, 128, 30], [70, 118, 0]].map(([x, y, r]) => wdWurstSlice(p, x, y, 22, r)),
        wdHerbs(p, 100, 100, 100, { n: 24 }),
        wdShine(100, 100, 72, .45),
    ].join(''),

    // チキンヌードルスープ: 白いスープ皿に、澄んだ金色のスープ、細い卵麺、にんじん・セロリアック・鶏肉、パセリ
    de_huehnersuppe: p => [
        K.bowl(p, { glaze: '#f3efe6', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#c8a24a" stroke-width="1.8"/>`,
        K.liquid(p, { R: 73, c: '#e0aa48', op: .92 }),
        `<circle cx="96" cy="94" r="48" fill="#eec474" opacity=".3"/>`,
        wdShreds(p, 100, 100, 124, { cols: ['#f6dc8a', '#f0d070'], n: 40, w: 2.6, len: 22, seed: 1 }),
        `<g ${p.sh(.6)}>`,
        ...[[82, 84, 20], [120, 120, -40], [128, 80, 70], [80, 124, 120]].map(([x, y, r], i) => K.chickenPiece(p, x, y, 22, r, { c: '#f2e2c2', skin: '#eadabb', seed: i })),
        ...[[102, 70], [140, 102], [100, 136], [64, 104], [112, 100]].map(([x, y]) => K.carrotRound(p, x, y, 11, {})),
        ...[[92, 104, 10], [130, 136, 40], [70, 76, -20], [148, 82, 20]].map(([x, y, r]) => wdDice(p, x, y, 8, r, '#f4efdc')),
        `</g>`,
        ...[[94, 90, 3], [122, 96, 2.4], [80, 112, 2], [114, 128, 2.6], [136, 116, 2], [104, 80, 1.8], [72, 94, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6cc5a" opacity=".75" stroke="#d9a63a" stroke-width=".4"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .3}" fill="#fff" opacity=".7"/>`),
        wdHerbs(p, 100, 100, 100, { n: 22 }),
        wdShine(100, 100, 73, .45),
    ].join(''),
};
