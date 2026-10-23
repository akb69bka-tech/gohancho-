// Poland (pl) — hand-composed redraw of the everyday dishes (x_pl)
import * as K from '../kit.mjs';
const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// ---------- copied from w_pl (renamed xpl〜) ----------
const xplBlur = (p, s = 2) => `filter="url(#${p.def('plbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;

// 白い皿（細い金の縁）
function xplPlate(p, { rim = '#c9a24a', R = 94 } = {}){
    return K.plate(p, { rim, R }) + `<circle cx="100" cy="100" r="${R - 7}" fill="none" stroke="${rim}" stroke-width=".8" opacity=".7"/>`;
}
// 深い白いスープ皿（talerz głęboki）金の縁
function xplSoupPlate(p, { gold = '#c9a24a' } = {}){
    return K.bowl(p, { glaze: '#f7f3ea', inside: '#fbf8f1', R: 94, lip: .82 }) + `<circle cx="100" cy="100" r="89" fill="none" stroke="${gold}" stroke-width="1.8"/><circle cx="100" cy="100" r="78.5" fill="none" stroke="${dk('#f7f3ea', .1)}" stroke-width="1.2" opacity=".6"/>`;
}
// ボレスワヴィエツ焼き風の鉢（コバルトに孔雀の目の模様）
function xplBoleslawiec(p, { R = 92, lip = .82, inside = '#f4f0e6', n = 16 } = {}){
    const r0 = R * lip, mid = (R + r0) / 2;
    let eyes = '';
    for (let i = 0; i < n; i++){
        const a = i / n * Math.PI * 2, x = 100 + Math.cos(a) * mid, y = 100 + Math.sin(a) * mid;
        eyes += `<circle cx="${f(x)}" cy="${f(y)}" r="4.4" fill="#e9e6da"/><circle cx="${f(x)}" cy="${f(y)}" r="2.8" fill="#4c7cc0"/><circle cx="${f(x)}" cy="${f(y)}" r="1.3" fill="#1b2f63"/>`;
        const b = (i + .5) / n * Math.PI * 2;
        eyes += `<circle cx="${f(100 + Math.cos(b) * mid)}" cy="${f(100 + Math.sin(b) * mid)}" r="1.3" fill="#9fc1ea"/>`;
    }
    return K.bowl(p, { glaze: '#26468a', inside, R, lip }) + eyes + `<circle cx="100" cy="100" r="${f(r0)}" fill="none" stroke="#1b2f63" stroke-width="1.2"/>`;
}
// ゆでたじゃがいも（皮をむいた丸ごと・バターの照り）
function xplPotato(p, x, y, s, r = 0, { seed = 1, c = '#f0d684' } = {}){
    const R = rng(p.id + 'plpo' + seed + x + y);
    const pts = ring(s / 2, 9, .14, R, 1.18, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .28)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .6 - s * .06, b * .55 - s * .06]))}" fill="${lt(c, .3)}" opacity=".7"/>
        <circle cx="${f(s * .18)}" cy="${f(s * .1)}" r="${f(s * .04)}" fill="${dk(c, .25)}" opacity=".5"/>
        <path d="M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .14)},${f(-s * .32)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 刻んだディル（細い羽のような緑）
function xplDill(p, x, y, s, { n = 14, seed = 1, c = '#3f8a2a' } = {}){
    const R = rng(p.id + 'pldl' + seed + x + y);
    let d = '', d2 = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, ang = R() * 6.28, L = 2.5 + R() * 3;
        const seg = `M${f(cx - Math.cos(ang) * L)},${f(cy - Math.sin(ang) * L)}l${f(Math.cos(ang) * L * 2)},${f(Math.sin(ang) * L * 2)}`;
        const br = `M${f(cx)},${f(cy)}l${f(Math.cos(ang + .8) * L * .8)},${f(Math.sin(ang + .8) * L * .8)}M${f(cx)},${f(cy)}l${f(Math.cos(ang - .8) * L * .8)},${f(Math.sin(ang - .8) * L * .8)}`;
        if (R() < .5) d += seg + br; else d2 += seg + br;
    }
    return `<path d="${d}" stroke="${c}" stroke-width=".9" fill="none" stroke-linecap="round"/><path d="${d2}" stroke="${lt(c, .2)}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
}
// パン粉をつけて揚げた平たいカツ（シュニッツェル型の大きな1枚）
function xplCutlet(p, x, y, w, h, r = 0, { c = '#d79a45', seed = 1, jit = .16 } = {}){
    const R = rng(p.id + 'plct' + seed);
    const pts = ring(1, 18, jit, R, w / 2, h / 2);
    let spots = '';
    for (let i = 0; i < 7; i++) spots += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .6)}" rx="${f(w * (.06 + R() * .08))}" ry="${f(h * (.05 + R() * .07))}" fill="${dk(c, .35)}" opacity="${f(.25 + R() * .25)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.rough(2.6, .14)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .42)}" stroke-width="1"/></g></g>
        <g ${p.crumb(.8)}><path d="${smooth(pts.map(([a, b]) => [a * .92, b * .9]))}" fill="${lt(c, .06)}"/></g>
        <g ${xplBlur(p, 1.4)}>${spots}</g>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .74]))}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.2" opacity=".35"/>
        <path d="M${f(-w * .32)},${f(-h * .2)} Q${f(-w * .12)},${f(-h * .38)} ${f(w * .18)},${f(-h * .32)}" stroke="#fff6dc" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// レモンのくし切り（皮の黄と果肉）
function xplLemonWedge(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,0 Q0,-8 10,0 Q0,4.5 -10,0Z" fill="${p.g('#f2cf3a', .3, .2)}" stroke="#c9a114" stroke-width=".6"/></g>
        <path d="M-8.4,-.2 Q0,-6.2 8.4,-.2 Q0,2.4 -8.4,-.2Z" fill="#fbeea0"/>
        ${[-5, -2, 1.6, 5].map(a => `<path d="M${a},${f(-3.6 + Math.abs(a) * .35)} L${f(a * .8)},.8" stroke="#fff8d0" stroke-width=".7"/>`).join('')}</g>`;
}
// ピエロギ（半月形: まっすぐな折り目と、指でつまんだひだのある弧）
function xplPierog(p, x, y, s, r = 0, { c = '#f4e7c6', seed = 1 } = {}){
    const hw = s / 2, b = s * .2, ry = s * .62;
    const shape = `M${-hw},${f(b)} A${hw},${f(ry)} 0 0 1 ${hw},${f(b)} Q0,${f(b + s * .07)} ${-hw},${f(b)}Z`;
    let ticks = '';
    for (let i = 1; i < 14; i++){
        const a = Math.PI + i / 14 * Math.PI, cx = Math.cos(a), cy = Math.sin(a);
        ticks += `M${f(cx * hw * .99)},${f(b + cy * ry * .99)}L${f(cx * hw * .8)},${f(b + cy * ry * .8)}`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${shape}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .32)}" stroke-width=".8"/></g>
        <path d="M${f(-hw * .8)},${f(b)} A${f(hw * .8)},${f(ry * .8)} 0 0 1 ${f(hw * .8)},${f(b)}" fill="none" stroke="${dk(c, .1)}" stroke-width="1" opacity=".7"/>
        <path d="${ticks}" stroke="${dk(c, .22)}" stroke-width=".9" stroke-linecap="round" opacity=".75"/>
        <ellipse cx="${f(-hw * .1)}" cy="${f(b - ry * .3)}" rx="${f(hw * .5)}" ry="${f(ry * .3)}" fill="${lt(c, .4)}" opacity=".6"/>
        <path d="M${f(-hw * .45)},${f(b - ry * .3)} Q${f(-hw * .15)},${f(b - ry * .6)} ${f(hw * .3)},${f(b - ry * .5)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// バターで炒めた玉ねぎのみじん切り（きつね色の小さな角、バターのつや）
function xplFriedOnion(p, x, y, s, { n = 30, seed = 1, sy = .8 } = {}){
    return K.glaze(p, x, y, s * 1.05, '#f0c050', { seed, op: .35 }) + `<g ${p.sh(.35)}>${xplGrains(p, x, y, s, { cols: ['#d99a3c', '#c07a24', '#ebbe6a', '#a8641c'], n, size: 2.1, seed, sy })}</g>`;
}
// サワークリームのひとすくい
function xplDollop(p, x, y, s, { c = '#fbf8ee', seed = 1 } = {}){
    const R = rng(p.id + 'pldo' + seed + x);
    const pts = ring(s / 2, 9, .22, R, 1.1, .9);
    return `<g ${T(x, y)}><g ${p.sh(.7)}><path d="${smooth(pts)}" fill="${p.rg(c, .2, .12, .38, .34)}" stroke="#e2dccb" stroke-width=".7"/></g>
        <path d="M${f(-s * .2)},${f(s * .12)} Q${f(s * .05)},${f(s * .26)} ${f(s * .24)},${f(s * .02)} Q${f(s * .1)},${f(-s * .12)} ${f(-s * .02)},${f(s * .02)}" fill="none" stroke="#e0d9c6" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M${f(-s * .26)},${f(-s * .12)} Q${f(-s * .08)},${f(-s * .3)} ${f(s * .16)},${f(-s * .24)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
}
// 鶏もも（骨つき）のロースト: 太いもも＋細いすね＋骨の先
function xplChickenLeg(p, x, y, L, r = 0, { c = '#c0662a', seed = 1 } = {}){
    const R = rng(p.id + 'plcl' + seed);
    const k = L / 100;
    const body = smooth([[-50, -6], [-44, -24], [-26, -32], [-6, -28], [8, -16], [26, -11], [40, -8], [44, -2], [40, 4], [26, 8], [8, 14], [-6, 26], [-26, 30], [-44, 22], [-52, 8]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]));
    let marks = '';
    for (let i = 0; i < 8; i++) marks += `<ellipse cx="${f(-44 + R() * 80)}" cy="${f(-18 + R() * 32)}" rx="${f(3 + R() * 5)}" ry="${f(2 + R() * 3)}" fill="${dk(c, .45)}" opacity="${f(.2 + R() * .3)}"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1.4)}><path d="${body}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .45)}" stroke-width="1"/>
        <path d="M42,-4 L52,-6 Q58,-9 59,-3 Q61,1 56,3 Q58,7 53,7 Q50,4 42,4Z" fill="${p.g('#efe2c8', .3, .2)}" stroke="#b9a07a" stroke-width=".8"/></g>
        <g ${xplBlur(p, 1.6)}>${marks}<path d="M-40,-12 Q-20,-24 0,-18" stroke="${lt(c, .4)}" stroke-width="6" fill="none" opacity=".5"/></g>
        <path d="M-40,-14 Q-24,-26 -6,-22 M8,-10 Q24,-8 36,-5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M-30,10 Q-14,16 0,10" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}
// くし形のローストポテト
function xplWedge(p, x, y, s, r = 0, { seed = 1 } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-15,4 Q-4,-12 15,-4 Q10,10 -15,4Z" fill="${p.g('#e9b75a', .3, .3)}" stroke="#a8702a" stroke-width=".8"/></g>
        <path d="M-15,4 Q10,10 15,-4 Q9,5 -14,2.4Z" fill="#b87a36"/>
        <path d="M-9,-1 Q0,-6 9,-3" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>
        <circle cx="3" cy="0" r=".8" fill="#9a5a20" opacity=".7"/><circle cx="-5" cy="1" r=".7" fill="#9a5a20" opacity=".7"/></g>`;
}
// 粒をばらまく（そば米・米・具の刻み）。同じ色は1本のpathにまとめる
function xplGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, tri = false } = {}){
    const R = rng(p.id + 'plgr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const rr = size * (.7 + R() * .6), k = Math.floor(R() * cols.length), a0 = R() * 6.28, m = tri ? 3 : 5;
        ds[k] += 'M' + Array.from({ length: m }, (_, j) => { const aa = a0 + j / m * 6.28; return `${f(gx + Math.cos(aa) * rr)},${f(gy + Math.sin(aa) * rr * (tri ? 1 : .7))}`; }).join('L') + 'Z';
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".45" stroke-linejoin="round"/>`).join('');
}
// 煮込んだ牛肉の角切り
function xplBeefChunk(p, x, y, s, r = 0, { c = '#9a5632', seed = 1, k = .7 } = {}){
    const R = rng(p.id + 'plbc' + seed + x + y);
    const pts = ring(s / 2, 6, .28, R, 1.1, .9);
    return `<g ${T(x, y, r)}><g ${p.rough(1.4, .2)}><path d="${smooth(pts, true, k)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f(-s * .3)},${f(-s * .02)} Q${f(-s * .05)},${f(-s * .18)} ${f(s * .26)},${f(-s * .05)} M${f(-s * .2)},${f(s * .2)} Q${f(s * .05)},${f(s * .08)} ${f(s * .26)},${f(s * .18)}" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// きゅうりのピクルス（斜め切り・オリーブ色）
function xplPickle(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s * .65)}" ry="${f(s / 2)}" fill="#4f6420"/></g><ellipse rx="${f(s * .65 - 1.3)}" ry="${f(s / 2 - 1.3)}" fill="${p.rg('#c4c278', .2, .15)}"/>
        <ellipse rx="${f(s * .32)}" ry="${f(s / 4)}" fill="#a9ab5a" opacity=".8"/>
        ${[0, 1, 2, 3].map(i => `<ellipse cx="${f(Math.cos(i * 1.57 + .7) * s * .2)}" cy="${f(Math.sin(i * 1.57 + .7) * s * .15)}" rx="1" ry=".6" fill="#ecebc0"/>`).join('')}
        <path d="M${f(-s * .4)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .38)} ${f(s * .2)},${f(-s * .32)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 揚げた白身魚（パン粉）の切り身
function xplFriedFish(p, x, y, w, h, r = 0, { c = '#d9a048', seed = 1 } = {}){
    const R = rng(p.id + 'plff' + seed);
    const pts = [[-w / 2, -h * .1], [-w * .4, -h * .45], [-w * .1, -h / 2], [w * .25, -h * .44], [w / 2, -h * .2], [w * .48, h * .2], [w * .2, h * .44], [-w * .15, h / 2], [-w * .42, h * .38]].map(([a, b]) => [a + (R() - .5) * 2.5, b + (R() - .5) * 2]);
    let spots = '';
    for (let i = 0; i < 5; i++) spots += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .5)}" rx="${f(w * .08)}" ry="${f(h * .1)}" fill="${dk(c, .35)}" opacity=".3"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2, .16)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .42)}" stroke-width=".9"/></g></g>
        <g ${p.crumb(.85)}><path d="${smooth(pts.map(([a, b]) => [a * .9, b * .86]))}" fill="${lt(c, .05)}"/></g>
        <g ${xplBlur(p, 1.2)}>${spots}</g>
        <path d="M${f(-w * .32)},${f(-h * .2)} Q${f(-w * .05)},${f(-h * .4)} ${f(w * .25)},${f(-h * .28)}" stroke="#fff6dc" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 細切りの山（ビーツ・にんじん・ザワークラウト）: 下地の山の上に千切りを重ねる
function xplShredHeap(p, x, y, s, c, { seed = 1, n = 60, w = 2.2, sy = .85, base = null, len = .32 } = {}){
    const R = rng(p.id + 'plsh' + seed + x);
    const bc = base || dk(c, .15);
    let out = `<g ${p.sh(.9)}><path ${T(x, y)} d="${smooth(ring(s / 2, 11, .14, R, 1, sy))}" fill="${p.rg(bc, .15, .2)}"/></g>`;
    const groups = [dk(c, .22), c, lt(c, .18)];
    const ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .44, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, ang = R() * Math.PI, L = s * len * (.5 + R() * .5), b = (R() - .5) * 5;
        const x1 = cx - Math.cos(ang) * L / 2, y1 = cy - Math.sin(ang) * L / 2;
        const lit = (cx - x) + (cy - y) < -s * .1 ? 2 : (cx - x) + (cy - y) > s * .2 ? 0 : (R() < .5 ? 1 : R() < .5 ? 0 : 2);
        ds[lit] += `M${f(x1)},${f(y1)}q${f(Math.cos(ang) * L / 2 - Math.sin(ang) * b)},${f(Math.sin(ang) * L / 2 + Math.cos(ang) * b)} ${f(Math.cos(ang) * L)},${f(Math.sin(ang) * L)}`;
    }
    out += groups.map((g, i) => `<path d="${ds[i]}" stroke="${dk(g, .25)}" stroke-width="${f(w + .9)}" fill="none" stroke-linecap="round"/><path d="${ds[i]}" stroke="${g}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`).join('');
    return out;
}
// トマトの輪切り（種の部屋が見える断面）
function xplTomatoSlice(p, x, y, s, r = 0){
    const h = s / 2;
    const rooms = [0, 1, 2, 3].map(i => { const a = i * 90 + 45; return `<g transform="rotate(${a})"><path d="M${f(h * .14)},${f(-h * .1)} Q${f(h * .62)},${f(-h * .5)} ${f(h * .68)},0 Q${f(h * .62)},${f(h * .5)} ${f(h * .14)},${f(h * .1)}Z" fill="#f2694c" opacity=".95"/>
        ${[.32, .48].map(t => `<ellipse cx="${f(h * t)}" cy="${f(h * (t - .4) * .5)}" rx="1.2" ry=".8" fill="#f7d36a"/><ellipse cx="${f(h * t)}" cy="${f(-h * (t - .4) * .5 + 2)}" rx="1.2" ry=".8" fill="#f7d36a"/>`).join('')}</g>`; }).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><circle r="${h}" fill="${p.g('#e0352a', .25, .25)}" stroke="#a51f17" stroke-width=".7"/></g>
        <circle r="${f(h * .86)}" fill="#e9483a"/>${rooms}
        <circle r="${f(h * .14)}" fill="#f4a08a"/>
        <path d="M${f(-h * .6)},${f(-h * .4)} Q${f(-h * .2)},${f(-h * .8)} ${f(h * .3)},${f(-h * .7)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 玉ねぎの薄い輪切り（リング）
function xplOnionRing(p, x, y, s, r = 0, { c = '#f2ecf4' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="none" stroke="${dk(c, .12)}" stroke-width="3"/><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="none" stroke="${c}" stroke-width="2"/><ellipse rx="${f(s / 2 - 1)}" ry="${f(s * .42 - 1)}" fill="none" stroke="#c9a6c8" stroke-width=".5" opacity=".7"/></g>`;
}
// 小口切りのあさつき
function xplChives(p, x, y, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'plcv' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2; d += `M${f(x + Math.cos(a) * dd + 1.6)},${f(y + Math.sin(a) * dd)}a1.6,1.6 0 1 0 -3.2,0a1.6,1.6 0 1 0 3.2,0`; }
    return `<path d="${d}" fill="#7fbf4a" stroke="#3f7f22" stroke-width=".7"/>`;
}
// クレープ（4つ折りの扇形）: 焼き色のレース模様
function xplCrepe(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'plcr' + seed);
    const c = '#f0cf86', Rr = s;
    const shape = `M0,0 L${Rr},0 A${Rr},${Rr} 0 0 1 0,${Rr} Z`;
    const cl = p.def('plcrc' + seed, id => `<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
    let spots = '';
    for (let i = 0; i < 26; i++){ const a = R() * 1.57, d = Math.sqrt(R()) * Rr * .95; spots += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(1.5 + R() * 3.5)}" ry="${f(1 + R() * 2.4)}" fill="${R() < .5 ? '#c7853a' : '#b36f2a'}" opacity="${f(.35 + R() * .35)}"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${shape}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>
        <g clip-path="url(#${cl})"><g ${xplBlur(p, .9)}>${spots}</g>
        <path d="M2,2 L${f(Rr * .97)},${f(Rr * .1)}" stroke="${dk(c, .25)}" stroke-width="1.3" opacity=".5"/>
        <path d="M${f(Rr * .97)},2 A${f(Rr * .96)},${f(Rr * .96)} 0 0 1 2,${f(Rr * .97)}" stroke="#f6e2b0" stroke-width="3" fill="none" opacity=".7"/></g>
        <path d="M${f(Rr * .2)},${f(Rr * .7)} Q${f(Rr * .5)},${f(Rr * .55)} ${f(Rr * .7)},${f(Rr * .25)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 粉砂糖
function xplSugar(p, x, y, s, { n = 40, seed = 1 } = {}){
    const R = rng(p.id + 'plsu' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = .5 + R() * .7; d += `M${f(cx + rr)},${f(cy)}a${f(rr)},${f(rr)} 0 1 0 ${f(-2 * rr)},0a${f(rr)},${f(rr)} 0 1 0 ${f(2 * rr)},0`; }
    return `<path d="${d}" fill="#fffdf6" opacity=".95"/>`;
}
// いちご（半分に切った断面と丸ごと）
function xplStrawberry(p, x, y, s, r = 0, { half = false } = {}){
    const k = s / 20;
    const body = 'M0,10 C-7,7 -10,-1 -8,-5 C-6,-9 6,-9 8,-5 C10,-1 7,7 0,10Z';
    if (half) return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${body}" fill="#d8262e" stroke="#9a141c" stroke-width=".6"/></g><path d="M0,8 C-5,6 -7.5,-1 -6,-4 C-4,-7 4,-7 6,-4 C7.5,-1 5,6 0,8Z" fill="#f47a7c"/><path d="M0,6 C-2,3 -2,-2 0,-5 C2,-2 2,3 0,6Z" fill="#fbd0cc"/><path d="M-6,-6 Q0,-9 6,-6" stroke="#4f8a2b" stroke-width="2" fill="none"/></g>`;
    let seeds = '';
    [[-4, -2], [0, -4], [4, -2], [-3, 3], [2, 2], [0, 6], [5, 2], [-5, 1]].forEach(([a, b]) => { seeds += `<ellipse cx="${a}" cy="${b}" rx=".6" ry=".9" fill="#f6d46a"/>`; });
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${body}" fill="${p.g('#de2b31', .3, .25)}" stroke="#9a141c" stroke-width=".6"/></g>${seeds}
        <path d="M-6,-6 L-2,-8 L0,-11 L2,-8 L6,-6 L2,-6.5 L0,-5 L-2,-6.5Z" fill="#4f8a2b" stroke="#2f6a1a" stroke-width=".5"/>
        <path d="M-5,-2 Q-4,-5 -1,-6" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/></g>`;
}
// 細い卵麺（ロソウの麺）: 細い線の渦
function xplThinNoodles(p, x, y, s, { c = '#f1d27a', n = 34, seed = 1, sy = .9 } = {}){
    const R = rng(p.id + 'pltn' + seed);
    const ds = ['', ''];
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.2 + Math.sqrt(R()) * .78), a0 = R() * 6.28, sw = 1 + R() * 2;
        const cx = x + (R() - .5) * s * .16, cy = y + (R() - .5) * s * .16;
        const pts = Array.from({ length: 6 }, (_, j) => { const a = a0 + j / 5 * sw, rj = rr * (1 + (R() - .5) * .2); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        ds[R() < .35 ? 1 : 0] += smooth(pts, false);
    }
    return `<g><path d="${ds[0]}" stroke="${dk(c, .3)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/><path d="${ds[0]}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="${ds[1]}" stroke="${dk(c, .3)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/><path d="${ds[1]}" stroke="${lt(c, .3)}" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
}
// スープの脂の輪（黄金色の小さな丸）
function xplFat(p, x, y, s, { n = 16, seed = 1, c = '#f6c84a', op = .55 } = {}){
    const R = rng(p.id + 'plfa' + seed + x);
    let d = '', h = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = 1 + R() * 3; d += `M${f(cx + rr)},${f(cy)}a${f(rr)},${f(rr)} 0 1 0 ${f(-2 * rr)},0a${f(rr)},${f(rr)} 0 1 0 ${f(2 * rr)},0`; h += `M${f(cx - rr * .5)},${f(cy - rr * .3)}l${f(rr * .4)},${f(-rr * .25)}`; }
    return `<path d="${d}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><path d="${h}" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".7"/>`;
}
// さいの目の具（スープのじゃがいも・にんじん）
function xplDice(p, x, y, s, r = 0, c = '#efdca0', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .2)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
const xplShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 柳のかご（楕円、編み目）
function xplBasket(p, { rx = 92, ry = 76, c = '#c89a5a' } = {}){
    let weave = '';
    for (let k = 0; k < 3; k++){
        const a = rx - 3 - k * 4.2, b = ry - 3 - k * 4.2;
        weave += `<ellipse cx="100" cy="100" rx="${f(a)}" ry="${f(b)}" fill="none" stroke="${k % 2 ? lt(c, .2) : dk(c, .12)}" stroke-width="4" stroke-dasharray="7 3" stroke-dashoffset="${k * 5}"/>`;
    }
    return `<g ${p.sh(1.6)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(c, .25, .3, .38, .32)}"/></g>${weave}
        <ellipse cx="100" cy="100" rx="${rx - 14}" ry="${ry - 14}" fill="${p.rg(dk(c, .25), .1, .25, .6, .6)}"/>
`;
}
// 麻のナプキン（かごに敷いた布）
function xplCloth(p, { c = '#f3ece0', stripe = '#b8323a' } = {}){
    return `<g ${p.sh(.8)}><path d="M30,62 Q60,40 104,46 Q148,40 172,66 Q178,100 168,134 Q140,160 98,156 Q56,162 32,136 Q22,100 30,62Z" fill="${p.rg(c, .2, .12)}" stroke="#d8cdb8" stroke-width=".8"/></g>
        <path d="M34,70 Q62,50 104,54 Q146,50 168,72" stroke="${stripe}" stroke-width="2.2" fill="none" opacity=".8"/><path d="M34,76 Q62,56 104,60 Q146,56 168,78" stroke="${stripe}" stroke-width="1" fill="none" opacity=".7"/>`;
}
// ライ麦まじりのパンの切れ端（ドーム形、濃い皮、灰色がかった生地）
function xplBreadSlice(p, x, y, w, h, r = 0, { crust = '#7a4420', crumb = '#d6bf96', seed = 1 } = {}){
    const R = rng(p.id + 'plbs' + seed);
    const shape = `M${-w / 2},${h / 2 - 3} L${-w / 2},${f(-h * .1)} C${-w / 2},${f(-h * .62)} ${w / 2},${f(-h * .62)} ${w / 2},${f(-h * .1)} L${w / 2},${h / 2 - 3} Q${w / 2},${h / 2} ${w / 2 - 3},${h / 2} L${-w / 2 + 3},${h / 2} Q${-w / 2},${h / 2} ${-w / 2},${h / 2 - 3}Z`;
    const k = (w - 7) / w, kh = (h - 7) / h;
    let holes = '';
    for (let i = 0; i < 22; i++){ const hx = (R() - .5) * w * .72, hy = (R() - .3) * h * .55; holes += `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(.6 + R() * 1.6)}" ry="${f(.5 + R() * 1)}" fill="${dk(crumb, .28)}" opacity=".55"/>`; }
    let seeds = '';
    for (let i = 0; i < 8; i++){ const hx = (R() - .5) * w * .7, hy = (R() - .3) * h * .55; seeds += `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="1.4" ry=".6" transform="rotate(${f(R() * 180)} ${f(hx)} ${f(hy)})" fill="#6a4a2a" opacity=".6"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${shape}" fill="${p.g(crust, .25, .3)}" stroke="${dk(crust, .35)}" stroke-width=".8"/></g>
        <path d="${shape}" transform="translate(0 1) scale(${f(k)} ${f(kh)})" fill="${p.rg(crumb, .25, .15, .4, .4)}"/>
        ${holes}${seeds}
        <path d="M${f(-w * .36)},${f(-h * .38)} Q0,${f(-h * .58)} ${f(w * .3)},${f(-h * .42)}" stroke="${lt(crust, .45)}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// いんげん（緑・黄色）
function xplGreenBean(p, x, y, L, r = 0, { c = '#5aa13a', bend = 2 } = {}){
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q0,${-bend} ${L / 2},0" stroke="${dk(c, .3)}" stroke-width="7.4" fill="none" stroke-linecap="round"/><path d="M${-L / 2},0 Q0,${-bend} ${L / 2},0" stroke="${p.g(c, .3, .2)}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M${f(-L * .38)},-1.1 Q0,${f(-bend - 1.1)} ${f(L * .3)},-1.1" stroke="${lt(c, .45)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>
        ${[-.25, 0, .25].map(t => `<circle cx="${f(L * t)}" cy="${f(-bend * .5 * (1 - 4 * t * t) + .4)}" r=".9" fill="${dk(c, .12)}" opacity=".6"/>`).join('')}</g>`;
}
// 輪切りのきゅうり（薄い・皮をむいた）
function xplCuke(p, x, y, s, r = 0, { peeled = true } = {}){
    const skin = peeled ? '#bcd890' : '#3f7d2e';
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .46)}" fill="${skin}" stroke="${dk(skin, .25)}" stroke-width=".5"/><ellipse rx="${f(s / 2 - 1.2)}" ry="${f(s * .46 - 1.2)}" fill="${p.rg('#e2f0c4', .2, .12)}" opacity=".95"/>
        <ellipse rx="${f(s * .24)}" ry="${f(s * .22)}" fill="#c8e09a" opacity=".85"/>
        ${[0, 1, 2].map(i => `<ellipse cx="${f(Math.cos(i * 2.09 + .5) * s * .13)}" cy="${f(Math.sin(i * 2.09 + .5) * s * .12)}" rx="1" ry=".6" fill="#f6f9e8"/>`).join('')}</g>`;
}

// ---------- new parts for x_pl ----------
// 器: 鋳鉄のフライパン（右上に柄）
function xplSkillet(p, { R = 86 } = {}){
    return `<g ${p.sh(1.8)}><g transform="translate(100 100) rotate(-42)"><rect x="${R - 6}" y="-8" width="34" height="16" rx="7" fill="${p.g('#3d3734', .2, .3)}"/><circle cx="${R + 21}" cy="0" r="3" fill="#1d1918"/></g>
        <circle cx="100" cy="100" r="${R}" fill="${p.rg('#3e3835', .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="#5c5550" stroke-width="1.4" opacity=".8"/>
        <circle cx="100" cy="100" r="${R * .88}" fill="${p.rg('#2b2522', .1, .2, .6, .62)}"/>
        <path d="M${100 - R * .72},${100 - R * .38} A${R * .82},${R * .82} 0 0 1 ${100 - R * .3},${100 - R * .76}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".3"/>`;
}
// 器: 丸い木のまな板
function xplBoard(p, { R = 94, c = '#c99a62' } = {}){
    const R0 = rng('xplboard');
    let grain = '';
    for (let i = 0; i < 9; i++){ const y = 30 + i * 16 + (R0() - .5) * 6; grain += `<path d="M${f(100 - Math.sqrt(Math.max(0, R * R - (y - 100) ** 2)) + 6)},${f(y)} Q100,${f(y + (R0() - .5) * 10)} ${f(100 + Math.sqrt(Math.max(0, R * R - (y - 100) ** 2)) - 6)},${f(y + (R0() - .5) * 4)}" stroke="${dk(c, .2)}" stroke-width="${f(.6 + R0() * .8)}" fill="none" opacity=".45"/>`; }
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .22, .25, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${dk(c, .3)}" stroke-width="1.6" opacity=".6"/>${grain}
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// 器: ほうろうの鉢（白に紺の縁）
function xplEnamel(p, { c = '#f6f3ec', rim = '#22407a', R = 93 } = {}){
    return K.bowl(p, { glaze: c, inside: lt(c, .3), R, lip: .86 }) + `<circle cx="100" cy="100" r="${R - 1.6}" fill="none" stroke="${rim}" stroke-width="3.2"/><circle cx="100" cy="100" r="${f(R * .86)}" fill="none" stroke="${dk(c, .15)}" stroke-width="1" opacity=".6"/>`;
}
// 器: 茶色の陶器（kamionka）。縁にクリームの釉
function xplStoneware(p, { glaze = '#8a5230', inside = '#efe3cc', R = 93, lip = .84 } = {}){
    return K.bowl(p, { glaze, inside, R, lip }) + `<circle cx="100" cy="100" r="${f(R * lip + 3)}" fill="none" stroke="#e9d6b0" stroke-width="2.6" opacity=".9"/>`;
}
// 器: クリスタルガラスの鉢（星形のカット）
function xplGlass(p, { R = 93 } = {}){
    let cut = '';
    for (let i = 0; i < 24; i++){ const a = i / 24 * 6.283, b = (i + .5) / 24 * 6.283; cut += `M${f(100 + Math.cos(a) * R * .86)},${f(100 + Math.sin(a) * R * .86)}L${f(100 + Math.cos(b) * (R - 2))},${f(100 + Math.sin(b) * (R - 2))}L${f(100 + Math.cos(a + 6.283 / 24) * R * .86)},${f(100 + Math.sin(a + 6.283 / 24) * R * .86)}`; }
    return `<g ${p.sh(1.4)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#dfe8ea', .4, .2, .35, .3)}"/></g>
        <path d="${cut}" fill="none" stroke="#ffffff" stroke-width="1.4" opacity=".8"/><path d="${cut}" fill="none" stroke="#a9bcc2" stroke-width=".6" transform="translate(.8 .8)" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(R * .86)}" fill="${p.rg('#eef3f3', .2, .12, .6, .62)}"/>
        <circle cx="100" cy="100" r="${f(R * .86)}" fill="none" stroke="#b8c8cc" stroke-width="1.2"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 器: 取っ手つきのスープカップと受け皿
function xplCup(p, { c = '#fbf8f1', gold = '#c9a24a' } = {}){
    return `<g ${p.sh(1.4)}><circle cx="100" cy="100" r="94" fill="${p.rg('#f8f5ee', .2, .12, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="90" fill="none" stroke="${gold}" stroke-width="1.6"/><circle cx="100" cy="100" r="70" fill="none" stroke="${dk('#f8f5ee', .1)}" stroke-width="2" opacity=".6"/>
        <g ${p.sh(1.4)}><path d="M150,84 C178,78 188,92 186,104 C184,118 170,122 152,116" stroke="${c}" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="96" cy="100" r="68" fill="${p.rg(c, .2, .14, .38, .32)}"/></g>
        <path d="M150,84 C178,78 188,92 186,104 C184,118 170,122 152,116" stroke="#e6dfd0" stroke-width="1" fill="none" transform="translate(0 2)"/>
        <circle cx="96" cy="100" r="66" fill="none" stroke="${gold}" stroke-width="1.6"/>
        <circle cx="96" cy="100" r="61" fill="${p.rg(c, .1, .25, .62, .64)}"/>`;
}

// 汁の面: 色 c、少し濁った明るみ、光
function xplBroth(p, R, c, { cx = 100, cy = 100, glow = .3, gc = null } = {}){
    return K.liquid(p, { R, c, op: 1, cx, cy, shine: false }) + `<circle cx="${cx - 4}" cy="${cy - 5}" r="${f(R * .66)}" fill="${gc || lt(c, .25)}" opacity="${glow}"/>`;
}
// クリームの渦（スープの上のひと回し）
function xplSwirl(p, cx, cy, R, c = '#fbf7ec', { turns = 1.5, w = 3.4, a0 = 0, op = .95 } = {}){
    const pts = Array.from({ length: 22 }, (_, i) => { const t = i / 21, a = a0 + t * turns * 6.283, r = R * (.12 + .88 * t); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * .92]; });
    const d = smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .12)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity="${f(op * .35)}"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// 具の配置（ドーナツ状も可）
function xplSpots(seed, n, rmax, minD, { cx = 100, cy = 100, sy = 1, rmin = 0 } = {}){
    const R = rng('xplspots' + seed), out = [];
    for (let t = 0; t < 8000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(rmin * rmin / (rmax * rmax) + R() * (1 - rmin * rmin / (rmax * rmax))) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// キェウバサ（燻製ソーセージ）の輪切り。half で半月
function xplSaus(p, x, y, s, r = 0, { c = '#9a3f26', inC = '#c8705a', half = false, seed = 1 } = {}){
    const R = rng(p.id + 'xsa' + seed + x + y), h = s / 2;
    let fat = '';
    for (let i = 0; i < 7; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * h * .7, fx = Math.cos(a) * d, fy = half ? -Math.abs(Math.sin(a) * d) * .9 : Math.sin(a) * d; fat += `M${f(fx + .9)},${f(fy)}a.9,.9 0 1 0 -1.8,0a.9,.9 0 1 0 1.8,0`; }
    const outer = half ? `M${-h},0 A${h},${h} 0 0 1 ${h},0Z` : null, inner = half ? `M${f(-h + 1.5)},-.5 A${f(h - 1.5)},${f(h - 1.5)} 0 0 1 ${f(h - 1.5)},-.5Z` : null;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}>${half ? `<path d="${outer}" fill="${p.g(c, .25, .25)}"/>` : `<circle r="${h}" fill="${p.g(c, .25, .25)}"/>`}</g>
        ${half ? `<path d="${inner}" fill="${p.rg(inC, .2, .2)}"/>` : `<circle r="${f(h - 1.5)}" fill="${p.rg(inC, .2, .2)}"/>`}
        <path d="${fat}" fill="${lt(inC, .55)}" opacity=".85"/>
        <path d="M${f(-h * .55)},${f(-h * .35)} Q${f(-h * .2)},${f(-h * .7)} ${f(h * .25)},${f(-h * .62)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 白いんげん豆
function xplBean(p, x, y, s, r = 0, { c = '#efe2c4' } = {}){
    return `<g ${T(x, y, r)}><path d="M${f(-s / 2)},0 C${f(-s / 2)},${f(-s * .36)} ${f(s / 2)},${f(-s * .38)} ${f(s / 2)},0 C${f(s / 2)},${f(s * .34)} ${f(s * .1)},${f(s * .3)} 0,${f(s * .2)} C${f(-s * .1)},${f(s * .3)} ${f(-s / 2)},${f(s * .34)} ${f(-s / 2)},0Z" fill="${p.g(c, .35, .22)}" stroke="${dk(c, .3)}" stroke-width=".5"/>
        <path d="M${f(-s * .28)},${f(-s * .12)} Q0,${f(-s * .26)} ${f(s * .26)},${f(-s * .12)}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// マッシュルームの縦の薄切り（かさ＋軸の断面）
function xplMushSlice(p, x, y, s, r = 0, { c = '#eee3cc', skin = '#b89a74', seed = 1 } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><path d="M-10,1 C-10.5,-6 -5,-9.5 0,-9.5 C5,-9.5 10.5,-6 10,1 Q8,2.4 4,1.8 L3.6,8 Q0,9.6 -3.6,8 L-4,1.8 Q-8,2.4 -10,1Z" fill="${p.g(c, .3, .22)}" stroke="${skin}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M-7.6,.4 Q0,-1.4 7.6,.4" stroke="${dk(c, .25)}" stroke-width=".9" fill="none" opacity=".75"/>
        <path d="M-6,-5 Q-2,-8 3,-7.4" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 丸ごとのマッシュルーム（上から）
function xplMushCap(p, x, y, s, { c = '#efe6d2', seed = 1 } = {}){
    const R = rng(p.id + 'xmc' + seed + x + y);
    return `<g ${T(x, y)}><g ${p.sh(.6)}><path d="${smooth(ring(s / 2, 8, .1, R))}" fill="${p.rg(c, .3, .28, .36, .34)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <ellipse cx="${f(-s * .16)}" cy="${f(-s * .18)}" rx="${f(s * .16)}" ry="${f(s * .09)}" fill="#fff" opacity=".7" transform="rotate(-30 ${f(-s * .16)} ${f(-s * .18)})"/></g>`;
}
// 角切りのクルトン
function xplCrouton(p, x, y, s, r = 0){
    return `<g ${p.crumb(.9)}>${xplDice(p, x, y, s, r, '#dfa850')}</g>`;
}
// 長ねぎの輪切り
function xplLeekRing(p, x, y, s, { c = '#dfe9bc' } = {}){
    return `<g ${T(x, y)}><circle r="${s / 2}" fill="${p.g(c, .3, .15)}" stroke="${dk(c, .25)}" stroke-width=".6"/><circle r="${f(s * .34)}" fill="none" stroke="${lt(c, .4)}" stroke-width="1"/><circle r="${f(s * .18)}" fill="none" stroke="${dk(c, .1)}" stroke-width=".8"/></g>`;
}
// ラディッシュの輪切り
function xplRadish(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="#c91f3a"/><circle r="${f(s / 2 - 2.2)}" fill="${p.rg('#fbf4f2', .1, .1)}"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M0,0 L${f(Math.cos(i * 1.047) * s * .38)},${f(Math.sin(i * 1.047) * s * .38)}" stroke="#f3cfd6" stroke-width=".6"/>`).join('')}<circle r="${f(s / 2 - 1.2)}" fill="none" stroke="#f08aa0" stroke-width="1" opacity=".7"/></g>`;
}
// ディルの花（散形花序）
function xplUmbel(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'xum' + seed + x);
    let d = '', dots = '';
    for (let i = 0; i < 11; i++){ const a = i / 11 * 6.28 + R() * .3, L = s / 2 * (.75 + R() * .25), ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L; d += `M${x},${y}L${f(ex)},${f(ey)}`; for (let j = 0; j < 4; j++) dots += `M${f(ex + (R() - .5) * 4 + .9)},${f(ey + (R() - .5) * 4)}a.9,.9 0 1 0 -1.8,0a.9,.9 0 1 0 1.8,0`; }
    return `<path d="${d}" stroke="#7a9a3a" stroke-width=".8"/><path d="${dots}" fill="#c9c844"/>`;
}
// にんにくの一片
function xplGarlic(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.4)}><path d="M-9,4 C-9,-4 -2,-9 6,-8 C10,-6 10,0 7,5 C3,8 -6,8 -9,4Z" fill="${p.g('#f4ecdc', .3, .2)}" stroke="#cdbfa4" stroke-width=".6"/></g><path d="M-6,3 C-4,-3 1,-6 6,-6" stroke="#e4c6c8" stroke-width="1.2" fill="none" opacity=".8"/></g>`;
}
// ベーコンの角切り（スクファルキ）
function xplBits(p, x, y, s, { n = 14, seed = 1, cols = ['#c2703a', '#a3552a', '#e0a066', '#8a4420'], size = 2.6, sy = 1 } = {}){
    return `<g ${p.sh(.4)}>${xplGrains(p, x, y, s, { cols, n, size, seed, sy })}</g>`;
}
// 玉ねぎの薄切り（炒めたあめ色の細い弧）
function xplOnionStrips(p, x, y, s, { n = 14, seed = 1, c = '#d9a24c', w = 2.2, sy = 1 } = {}){
    const R = rng(p.id + 'xos' + seed + x + y);
    const ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 7 + R() * 8, a0 = R() * 6.28, sw = .7 + R() * .9;
        ds[Math.floor(R() * 3)] += `M${f(cx + Math.cos(a0) * rr)},${f(cy + Math.sin(a0) * rr)}A${f(rr)},${f(rr)} 0 0 1 ${f(cx + Math.cos(a0 + sw) * rr)},${f(cy + Math.sin(a0 + sw) * rr)}`;
    }
    const cols = [lt(c, .25), c, dk(c, .2)];
    return ds.map((d, i) => `<path d="${d}" stroke="${dk(cols[i], .25)}" stroke-width="${w + .8}" fill="none" stroke-linecap="round" opacity=".35"/><path d="${d}" stroke="${cols[i]}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".88"/>`).join('');
}
// りんごの薄切り（皮の赤い縁）
function xplApple(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.4)}><path d="M-10,2 A10,8 0 0 1 10,2 Q0,-1 -10,2Z" fill="#c7442e"/></g><path d="M-8.6,1.6 A8.6,6.4 0 0 1 8.6,1.6 Q0,-.4 -8.6,1.6Z" fill="${p.g('#f6e8b8', .3, .15)}"/></g>`;
}
// 鶏レバー（2つのつやのある葉）
function xplLiver(p, x, y, s, r = 0, { c = '#7a2e22', seed = 1 } = {}){
    const R = rng(p.id + 'xlv' + seed + x + y), k = s / 30;
    const a = smooth(ring(9, 9, .25, R, 1.2, .85).map(([u, v]) => [u - 6, v]));
    const b = smooth(ring(8, 9, .25, R, 1.1, .9).map(([u, v]) => [u + 7, v + 2]));
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${a}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/><path d="${b}" fill="${p.g(dk(c, .08), .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M-13,-3 Q-8,-8 -2,-6 M4,-3 Q8,-6 12,-3" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/><path d="M-1,1 Q1,3 3,1" stroke="${dk(c, .5)}" stroke-width="1" fill="none" opacity=".6"/></g>`;
}
// ゆでた丸い団子（くぼみつき: クルスキ・シロンスキェ）
function xplKluska(p, x, y, s, { c = '#f1e7d0', seed = 1 } = {}){
    const R = rng(p.id + 'xkl' + seed + x + y);
    return `<g ${T(x, y)}><g ${p.sh(.7)}><path d="${smooth(ring(s / 2, 9, .08, R))}" fill="${p.rg(c, .3, .2, .36, .34)}" stroke="${dk(c, .22)}" stroke-width=".7"/></g>
        <circle cx="${f(s * .03)}" cy="${f(s * .04)}" r="${f(s * .17)}" fill="${dk(c, .2)}"/><path d="M${f(-s * .14)},${f(-s * .08)} A${f(s * .17)},${f(s * .17)} 0 0 1 ${f(s * .16)},${f(-s * .06)}" stroke="${dk(c, .4)}" stroke-width="1.2" fill="none" opacity=".6"/>
        <path d="M${f(-s * .34)},${f(-s * .1)} Q${f(-s * .24)},${f(-s * .32)} ${f(-s * .02)},${f(-s * .36)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// コピトカ（斜めに切ったひし形のじゃがいも団子）
function xplKopytko(p, x, y, s, r = 0, { c = '#ecd49a' } = {}){
    const h = s / 2;
    const pts = [[-h, 0], [-h * .4, -h * .42], [h, -h * .42], [h * .4, h * .42], [-h, h * .42]].map(([a, b]) => [a + 3, b]);
    const sh = [[-h * .9, h * .05], [-h * .38, -h * .36], [h * .8, -h * .36], [h * .4, h * .3], [-h * .7, h * .3]];
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth([[-h * 1.05 + 3, h * .3], [-h * .45 + 3, -h * .55], [h * .95 + 3, -h * .55], [h * .45 + 3, h * .55]], true, .5)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .25)}" stroke-width=".7"/></g>
        <path d="${smooth(sh.map(([a, b]) => [a * .7 + 2, b * .6 - 1]), true, .4)}" fill="${lt(c, .3)}" opacity=".7"/>
        <path d="M${f(-h * .3)},${f(-h * .25)} L${f(h * .55)},${f(-h * .25)}" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".7"/></g>`;
}
// ジャガイモのパンケーキ（縁のカリッとした焼き色、すりおろしの筋）
function xplPlacek(p, x, y, s, r = 0, { seed = 1, c = '#d99a3a' } = {}){
    const R = rng(p.id + 'xpk' + seed);
    const pts = ring(s / 2, 16, .14, R, 1.06, .95);
    let st = '';
    for (let i = 0; i < 22; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .4, cx = Math.cos(a) * d, cy = Math.sin(a) * d, an = R() * 6.28, L = 3 + R() * 6; st += `M${f(cx)},${f(cy)}l${f(Math.cos(an) * L)},${f(Math.sin(an) * L)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(3, .2)}><path d="${smooth(pts)}" fill="${dk(c, .3)}"/></g></g>
        <g ${p.crumb(.6)}><path d="${smooth(pts.map(([a, b]) => [a * .88, b * .88]))}" fill="${p.rg(c, .3, .15, .4, .38)}"/></g>
        <path d="${st}" stroke="${dk(c, .3)}" stroke-width="1.2" stroke-linecap="round" opacity=".45"/>
        <path d="${st}" stroke="${lt(c, .4)}" stroke-width=".7" stroke-linecap="round" opacity=".55" transform="translate(-.8 -.8)"/>
        <path d="M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .14)},${f(-s * .32)} ${f(s * .14)},${f(-s * .3)}" stroke="#fff6dc" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 牛肉の巻き（ズラジ）: 濃い茶の筒を上から
function xplRoulade(p, x, y, w, h, r = 0, { c = '#6e3a1e' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(1.6, .12)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .45)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g></g>
        <path d="M${f(-w * .2)},${f(-h * .48)} Q${f(-w * .26)},0 ${f(-w * .2)},${f(h * .48)} M${f(w * .12)},${f(-h * .48)} Q${f(w * .06)},0 ${f(w * .12)},${f(h * .48)}" stroke="${dk(c, .45)}" stroke-width="1.4" fill="none" opacity=".55"/>
        <path d="M${f(-w * .4)},${f(-h * .22)} Q0,${f(-h * .42)} ${f(w * .38)},${f(-h * .22)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// ズラジの断面（肉・ベーコン・ピクルスの渦）
function xplRouladeCut(p, x, y, s, r = 0, { c = '#6e3a1e' } = {}){
    const h = s / 2;
    const sp = Array.from({ length: 18 }, (_, i) => { const t = i / 17, a = t * 2.2 * 6.283, rr = h * (.18 + .7 * t); return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><circle r="${h}" fill="${p.g(c, .25, .3)}"/></g>
        <circle r="${f(h - 2.4)}" fill="${p.rg('#9c6248', .15, .2)}"/>
        <path d="${smooth(sp, false)}" stroke="#e7a4a0" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="${smooth(sp, false)}" stroke="#5c2e18" stroke-width=".7" fill="none" transform="translate(1.6 1.2)" opacity=".7"/>
        <ellipse cx="0" cy="0" rx="${f(h * .26)}" ry="${f(h * .2)}" fill="#7d8a2e" stroke="#4f5a1a" stroke-width=".6"/>
        <path d="M${f(-h * .6)},${f(-h * .5)} Q${f(-h * .2)},${f(-h * .85)} ${f(h * .3)},${f(-h * .75)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 焼いたマス（一尾、横向き。背はオリーブ、腹は銀、ピンクの帯と黒い斑点）
function xplTrout(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtr' + seed), h = L * .2;
    const body = `M${-L / 2},${f(h * .05)} C${f(-L * .42)},${f(-h * .95)} ${f(L * .2)},${f(-h * 1.05)} ${f(L * .36)},${f(-h * .25)} L${f(L / 2)},${f(-h * .85)} Q${f(L * .46)},0 ${f(L / 2)},${f(h * .85)} L${f(L * .36)},${f(h * .25)} C${f(L * .2)},${f(h * .95)} ${f(-L * .42)},${f(h * .9)} ${-L / 2},${f(h * .05)}Z`;
    let spots = '';
    for (let i = 0; i < 26; i++){ const sx = -L * .3 + R() * L * .62, sy = -h * .7 + R() * h * .75; spots += `M${f(sx + .9)},${f(sy)}a.9,.9 0 1 0 -1.8,0a.9,.9 0 1 0 1.8,0`; }
    const cl = p.def('xtrc' + seed, id => `<clipPath id="${id}"><path d="${body}"/></clipPath>`);
    return `<g ${T(x, y, r)}><g ${p.sh(1.3)}><path d="${body}" fill="${p.g('#e9dcc4', .2, .2)}" stroke="#7a6a4a" stroke-width=".9"/></g>
        <g clip-path="url(#${cl})"><rect x="${-L / 2}" y="${f(-h * 1.1)}" width="${L}" height="${f(h * .9)}" fill="${p.g('#8c8a52', .3, .3)}"/>
        <path d="M${-L / 2},${f(-h * .1)} Q0,${f(-h * .35)} ${f(L / 2)},${f(-h * .05)}" stroke="#e98e86" stroke-width="${f(h * .34)}" fill="none" opacity=".75"/>
        <path d="${spots}" fill="#3a3220" opacity=".75"/>
        <path d="M${f(-L * .3)},${f(-h)} L${f(-L * .3)},${f(h)}" stroke="#6a5a38" stroke-width="1" opacity=".6"/>
        <ellipse cx="${f(-L * .1)}" cy="${f(-h * .2)}" rx="${f(L * .3)}" ry="${f(h * .5)}" fill="#d8a050" opacity=".22"/></g>
        <path d="M${f(-L * .3)},${f(-h * .9)} Q${f(-L * .36)},0 ${f(-L * .3)},${f(h * .8)}" stroke="#5a4a2a" stroke-width="1.2" fill="none" opacity=".7"/>
        <circle cx="${f(-L * .41)}" cy="${f(-h * .2)}" r="${f(h * .16)}" fill="#f2ead8" stroke="#3a3a3a" stroke-width=".7"/><circle cx="${f(-L * .41)}" cy="${f(-h * .2)}" r="${f(h * .08)}" fill="#222"/>
        <path d="M${f(-L * .22)},${f(-h * .62)} Q0,${f(-h * .92)} ${f(L * .24)},${f(-h * .52)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// レモンの輪切り
function xplLemonSlice(p, x, y, s){
    return `<g ${T(x, y)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="#efc52c"/></g><circle r="${f(s / 2 - 1.6)}" fill="#fbf0b0"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0,0 L${f(Math.cos(i * .785) * (s / 2 - 2))},${f(Math.sin(i * .785) * (s / 2 - 2))}" stroke="#fffbe2" stroke-width="1"/>`).join('')}<circle r="${f(s * .08)}" fill="#fffbe2"/></g>`;
}
// 楕円のパン粉の揚げ物（デ・ヴォライユ）、片端を切って溶けたバターが見える
function xplDevolaille(p, x, y, w, h, r = 0){
    const c = '#d6953e';
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.rough(2.4, .14)}><path d="M${-w / 2},0 C${-w / 2},${f(-h * .62)} ${f(w * .3)},${f(-h * .6)} ${f(w * .38)},${f(-h * .42)} L${f(w * .4)},${f(h * .42)} C${f(w * .3)},${f(h * .6)} ${-w / 2},${f(h * .62)} ${-w / 2},0Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .42)}" stroke-width="1"/></g></g>
        <g ${p.crumb(.8)}><path d="M${f(-w * .44)},0 C${f(-w * .44)},${f(-h * .5)} ${f(w * .25)},${f(-h * .5)} ${f(w * .32)},${f(-h * .36)} L${f(w * .32)},${f(h * .36)} C${f(w * .25)},${f(h * .5)} ${f(-w * .44)},${f(h * .5)} ${f(-w * .44)},0Z" fill="${lt(c, .06)}"/></g>
        <ellipse cx="${f(w * .4)}" cy="0" rx="${f(w * .07)}" ry="${f(h * .43)}" fill="${dk(c, .2)}"/>
        <ellipse cx="${f(w * .41)}" cy="0" rx="${f(w * .055)}" ry="${f(h * .36)}" fill="${p.rg('#f6eedc', .2, .12)}"/>
        <ellipse cx="${f(w * .42)}" cy="0" rx="${f(w * .028)}" ry="${f(h * .16)}" fill="#f6cf4a"/>
        <path d="M${f(w * .45)},${f(-h * .1)} C${f(w * .55)},${f(-h * .14)} ${f(w * .62)},${f(h * .1)} ${f(w * .56)},${f(h * .26)} C${f(w * .5)},${f(h * .34)} ${f(w * .45)},${f(h * .2)} ${f(w * .45)},${f(h * .1)}Z" fill="${p.g('#f7d65a', .3, .2)}" opacity=".95"/>
        <circle cx="${f(w * .52)}" cy="${f(h * .08)}" r="1" fill="#3f8a2a"/><circle cx="${f(w * .5)}" cy="${f(h * .2)}" r=".9" fill="#3f8a2a"/>
        <path d="M${f(-w * .32)},${f(-h * .2)} Q${f(-w * .1)},${f(-h * .42)} ${f(w * .18)},${f(-h * .34)}" stroke="#fff6dc" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ハチミツで焼いたスペアリブ（骨の先が見える）
function xplRib(p, x, y, L, w, r = 0, { c = '#8e3e18', seed = 1 } = {}){
    const R = rng(p.id + 'xrb' + seed + x + y);
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f(-L * .3 + R() * L * .55)}" cy="${f((R() - .5) * w * .5)}" rx="${f(2 + R() * 3)}" ry="${f(1.2 + R() * 1.4)}" fill="#2e1208" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(L / 2 - 8)}" y="-3.2" width="13" height="6.4" rx="3.2" fill="${p.g('#efe2c6', .3, .2)}" stroke="#b9a07a" stroke-width=".6"/>
        <path d="${smooth([[-L / 2, -w * .4], [-L * .1, -w * .52], [L * .4, -w * .42], [L / 2, -w * .1], [L / 2, w * .12], [L * .4, w * .44], [-L * .1, w * .5], [-L / 2, w * .38]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 1.4]), true, .7)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        ${ch}<path d="M${f(-L * .4)},${f(-w * .18)} Q0,${f(-w * .38)} ${f(L * .36)},${f(-w * .2)}" stroke="#ffd9a0" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-L * .3)},${f(w * .2)} Q0,${f(w * .1)} ${f(L * .2)},${f(w * .22)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}
// 厚切りの豚肩ロース（煮込んで茶色、脂のすじ）
function xplPorkSteak(p, x, y, w, h, r = 0, { c = '#94593a', seed = 1 } = {}){
    const R = rng(p.id + 'xps' + seed + x + y);
    const pts = ring(1, 11, .16, R, w / 2, h / 2);
    let mar = '';
    for (let i = 0; i < 4; i++){ const sx = (R() - .5) * w * .6, sy = (R() - .5) * h * .5; mar += `M${f(sx - w * .15)},${f(sy)}q${f(w * .1)},${f((R() - .5) * h * .3)} ${f(w * .28)},${f((R() - .5) * h * .2)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${smooth(pts)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .42)}" stroke-width=".9"/></g>
        <path d="${mar}" stroke="#d9b088" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .96, b * .94]))}" fill="none" stroke="#e2bc8c" stroke-width="2.2" opacity=".35"/>
        <path d="M${f(-w * .32)},${f(-h * .2)} Q${f(-w * .08)},${f(-h * .4)} ${f(w * .22)},${f(-h * .3)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// ゴウォンプキ（キャベツの葉で包んだ俵）
function xplGolabek(p, x, y, w, h, r = 0, { c = '#d9d49a', seed = 1 } = {}){
    const R = rng(p.id + 'xgo' + seed);
    const pts = ring(1, 12, .08, R, w / 2, h / 2);
    let veins = '';
    for (let i = 0; i < 5; i++){ const vx = -w * .34 + i * w * .17 + (R() - .5) * 3; veins += `M${f(vx)},${f(-h * .44)}Q${f(vx + 4)},0 ${f(vx - 1)},${f(h * .44)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>
        <path d="M${f(w * .1)},${f(-h * .48)} Q${f(w * .28)},${f(-h * .1)} ${f(w * .2)},${f(h * .46)}" stroke="${dk(c, .25)}" stroke-width="1.2" fill="none" opacity=".7"/>
        <path d="${veins}" stroke="${lt(c, .45)}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M${f(-w * .36)},${f(-h * .22)} Q${f(-w * .1)},${f(-h * .44)} ${f(w * .26)},${f(-h * .32)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// クロキェティ（パン粉で揚げたクレープの包み）。cut で断面
function xplKrokiet(p, x, y, w, h, r = 0, { cut = false, seed = 1 } = {}){
    const c = '#cf8f3c';
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2, .16)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .3)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .42)}" stroke-width=".9"/></g></g>
        <g ${p.crumb(.85)}><rect x="${-w / 2 + 2.5}" y="${-h / 2 + 2.5}" width="${w - 5}" height="${h - 5}" rx="${f(h * .26)}" fill="${lt(c, .05)}"/></g>
        ${cut ? `<ellipse cx="${f(w / 2 - 3)}" cy="0" rx="${f(h * .2)}" ry="${f(h * .46)}" fill="#f1dfb0" stroke="${dk(c, .3)}" stroke-width=".8"/><ellipse cx="${f(w / 2 - 2.6)}" cy="0" rx="${f(h * .13)}" ry="${f(h * .34)}" fill="${p.rg('#7a5a34', .2, .3)}"/>${xplGrains(p, w / 2 - 2.6, 0, h * .5, { cols: ['#d6c88a', '#4a3020'], n: 6, size: 1.2, seed, sy: 2 })}` : ''}
        <path d="M${f(-w * .38)},${f(-h * .22)} Q0,${f(-h * .42)} ${f(w * .32)},${f(-h * .24)}" stroke="#fff6dc" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 平たい四角いパスタ（ワザンキ）
function xplSquare(p, x, y, s, r = 0, { c = '#f0d78e' } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)}><path d="M${-h},${-h + 1} Q0,${-h - 1.5} ${h},${-h + .5} Q${h + 1.2},0 ${h - .5},${h} Q0,${h + 1.4} ${-h + .5},${h - .5} Q${-h - 1.2},0 ${-h},${-h + 1}Z" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".7"/><path d="M${f(-h * .6)},${f(-h * .5)} L${f(h * .5)},${f(-h * .55)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7"/></g>`;
}
// カリフラワーの房（クリーム色の粒の集まり）
function xplCauli(p, x, y, s, { c = '#f3e8c8', seed = 1, n = 9 } = {}){
    const R = rng(p.id + 'xcf' + seed + x + y);
    let b = '';
    for (let i = 0; i < n; i++){ const a = i / n * 6.28 + R(), d = i === 0 ? 0 : s * (.2 + R() * .14), rr = s * (.2 + R() * .08); b += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(rr)}" fill="${p.rg(c, .35, .28, .38, .34)}" stroke="${dk(c, .3)}" stroke-width=".7"/>`; }
    return `<g ${p.sh(.7)}>${b}</g>`;
}
// レタスの葉（バターヘッド）
function xplLeaf(p, x, y, s, r = 0, { c = '#9ccc5c', seed = 1 } = {}){
    const R = rng(p.id + 'xlf' + seed + x + y), k = s / 40;
    const pts = ring(18, 26, .2, R, 1.05, .85).map(([a, b], i) => i % 2 ? [a * .9, b * .9] : [a, b]);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${smooth(pts)}" fill="${p.rg(c, .45, .2, .45, .45)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="M-16,4 Q0,0 14,-2 M-6,2 L-10,-8 M2,1 L0,-10 M8,-1 L12,-9 M-4,3 L-6,12 M5,1 L8,11" stroke="${lt(c, .45)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// 詰め物をしたゆで卵（黄色い絞り）
function xplStuffedEgg(p, x, y, s, r = 0){
    const k = s / 30;
    const st = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.283, rr = i % 2 ? 6 : 8.4; return [Math.cos(a) * rr * 1.1, Math.sin(a) * rr]; });
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><ellipse rx="15" ry="11" fill="${p.rg('#fffdf6', .1, .12)}" stroke="#d8d0bf" stroke-width=".7"/></g>
        <g ${p.sh(.5)}><path d="${smooth(st, true, .8)}" fill="${p.g('#f6c84a', .3, .2)}" stroke="#d29a22" stroke-width=".6"/></g>
        <path d="M-6,-1 Q0,-4 6,-1 M-4,3 Q0,1 4,3" stroke="#d29a22" stroke-width=".8" fill="none" opacity=".7"/><ellipse cx="-3" cy="-3" rx="2.4" ry="1.2" fill="#fff" opacity=".6"/></g>`;
}
// ズッキーニの輪切り（fried で衣と焼き色）
function xplZuc(p, x, y, s, r = 0, { fried = false, half = false } = {}){
    const h = s / 2;
    if (half) return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${-h},0 A${h},${h} 0 0 1 ${h},0Z" fill="#3e6e24"/></g><path d="M${f(-h + 1.3)},-.4 A${f(h - 1.3)},${f(h - 1.3)} 0 0 1 ${f(h - 1.3)},-.4Z" fill="${p.g('#e4ecb8', .2, .15)}"/>${[-.3, 0, .3].map(t => `<ellipse cx="${f(h * t)}" cy="${f(-h * .35)}" rx="1" ry=".6" fill="#f6f8de"/>`).join('')}</g>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><circle r="${h}" fill="${fried ? '#4a6a22' : '#3e6e24'}"/></g>
        <circle r="${f(h - 1.6)}" fill="${fried ? p.rg('#dcb052', .25, .2) : p.rg('#e4ecb8', .2, .15)}"/>
        ${fried ? `<g ${p.crumb(.7)}><circle r="${f(h - 2.6)}" fill="#d9a848" opacity=".6"/></g><circle r="${f(h * .45)}" fill="#e8c46a" opacity=".5"/>` : ''}
        ${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${f(Math.cos(i * 1.257) * h * .3)}" cy="${f(Math.sin(i * 1.257) * h * .3)}" rx="1.1" ry=".7" fill="${fried ? '#f3d890' : '#f6f8de'}"/>`).join('')}
        <path d="M${f(-h * .6)},${f(-h * .3)} Q${f(-h * .3)},${f(-h * .7)} ${f(h * .2)},${f(-h * .66)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 焼いたじゃがいもの輪切り（こんがり）
function xplFriedPotato(p, x, y, s, r = 0, { seed = 1, c = '#e2ad52' } = {}){
    const R = rng(p.id + 'xfp' + seed + x + y);
    const pts = ring(s / 2, 8, .16, R, 1.15, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts)}" fill="${p.g(dk(c, .12), .25, .35)}" stroke="${dk(c, .45)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .72 - 1, b * .7 - 1]))}" fill="${p.rg(lt(c, .2), .25, .15)}" opacity=".9"/>
        <ellipse cx="${f(s * .1)}" cy="${f(s * .12)}" rx="${f(s * .16)}" ry="${f(s * .08)}" fill="${dk(c, .4)}" opacity=".35"/>
        <path d="M${f(-s * .26)},${f(-s * .12)} Q${f(-s * .1)},${f(-s * .28)} ${f(s * .12)},${f(-s * .24)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// クリーム煮のほうれん草（つぶれた濃い緑）
function xplSpinach(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'xsp' + seed + x);
    const pts = ring(s / 2, 11, .25, R, 1.1, .85);
    let st = '';
    for (let i = 0; i < 12; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .38, cx = Math.cos(a) * d, cy = Math.sin(a) * d * .8; st += `M${f(cx)},${f(cy)}q${f((R() - .5) * 8)},${f((R() - .5) * 6)} ${f((R() - .5) * 10)},${f((R() - .5) * 6)}`; }
    return `<g ${T(x, y)}><g ${p.sh(.7)}><path d="${smooth(pts)}" fill="${p.rg('#3f6e24', .2, .3)}" stroke="#2a4a16" stroke-width=".6"/></g>
        <path d="${st}" stroke="#6f9a3e" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/><path d="${st}" stroke="#244412" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5" transform="translate(1 1.4)"/>
        <path d="M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .15)},${f(-s * .25)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 丸ごとの小さなきゅうり（漬け物）、half で縦半分の断面
function xplCukeWhole(p, x, y, L, r = 0, { half = false, seed = 1 } = {}){
    const R = rng(p.id + 'xcw' + seed + x + y), w = L * .3;
    let bumps = '';
    for (let i = 0; i < 14; i++) bumps += `M${f(-L * .4 + R() * L * .8 + .8)},${f((R() - .5) * w * .7)}a.8,.8 0 1 0 -1.6,0a.8,.8 0 1 0 1.6,0`;
    if (half) return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-L / 2}" y="${-w / 2}" width="${L}" height="${w}" rx="${f(w / 2)}" fill="#55682a"/></g>
        <rect x="${-L / 2 + 1.6}" y="${-w / 2 + 1.6}" width="${L - 3.2}" height="${w - 3.2}" rx="${f(w / 2 - 1.6)}" fill="${p.rg('#d6d69a', .2, .15)}"/>
        <rect x="${-L * .38}" y="${-w * .17}" width="${f(L * .76)}" height="${f(w * .34)}" rx="${f(w * .17)}" fill="#bfc27a" opacity=".8"/>
        ${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${f(-L * .3 + i * L * .12)}" cy="0" rx="1.4" ry=".8" fill="#eeeccc"/>`).join('')}</g>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${-L / 2}" y="${-w / 2}" width="${L}" height="${w}" rx="${f(w / 2)}" fill="${p.g('#5f7a2c', .3, .3)}" stroke="#3a4a18" stroke-width=".7"/></g>
        <path d="M${f(-L * .4)},${f(-w * .2)} L${f(L * .4)},${f(-w * .2)} M${f(-L * .38)},${f(w * .12)} L${f(L * .38)},${f(w * .12)}" stroke="#8aa04a" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        <path d="${bumps}" fill="#2f3f14" opacity=".55"/>
        <path d="M${f(-L * .34)},${f(-w * .3)} Q0,${f(-w * .42)} ${f(L * .3)},${f(-w * .3)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// ニシンの切り身（銀の皮と淡い身）
function xplHerring(p, x, y, w, h, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .4)}" fill="${p.g('#dcbfae', .25, .25)}" stroke="#9a8070" stroke-width=".7"/></g>
        <rect x="${-w / 2 + .8}" y="${-h / 2 + .8}" width="${w - 1.6}" height="${f(h * .45)}" rx="${f(h * .3)}" fill="${p.g('#a7b4c0', .4, .3)}"/>
        <path d="M${f(-w / 2 + 3)},${f(-h / 2 + 1.6)} L${f(w / 2 - 3)},${f(-h / 2 + 1.6)}" stroke="#4a5868" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        <path d="M${f(-w * .2)},${f(-h * .02)} Q${f(-w * .16)},${f(h * .2)} ${f(-w * .2)},${f(h * .45)} M${f(w * .05)},${f(-h * .02)} Q${f(w * .09)},${f(h * .2)} ${f(w * .05)},${f(h * .45)} M${f(w * .3)},${f(-h * .02)} Q${f(w * .34)},${f(h * .2)} ${f(w * .3)},${f(h * .45)}" stroke="#c09c88" stroke-width=".8" fill="none"/>
        <path d="M${f(-w * .36)},${f(-h * .3)} L${f(w * .3)},${f(-h * .3)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 干しプラム
function xplPrune(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .36)}" fill="${p.g('#3a1e2a', .25, .3)}" stroke="#1a0a12" stroke-width=".5"/><path d="M${f(-s * .3)},0 Q0,${f(-s * .15)} ${f(s * .3)},${f(s * .05)}" stroke="#5a3444" stroke-width=".8" fill="none"/><ellipse cx="${f(-s * .15)}" cy="${f(-s * .14)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".5"/></g>`;
}
// 半熟でない固ゆで卵の刻み（白と黄）
function xplEggBits(p, x, y, s, { n = 18, seed = 1, sy = 1 } = {}){
    return xplGrains(p, x, y, s, { cols: ['#fbf8ee', '#f6f1e2', '#f4c540'], n, size: 2.6, seed, sy });
}
// マッシュポテトの山（渦の筋）
function xplMash(p, x, y, s, { c = '#f4e3b0', seed = 1, sy = .92 } = {}){
    const R = rng(p.id + 'xms' + seed + x);
    let rid = '';
    for (let i = 0; i < 7; i++){ const rr = s * (.12 + i * .055), a0 = R() * 6.28; rid += `M${f(x + Math.cos(a0) * rr)},${f(y + Math.sin(a0) * rr * sy)}A${f(rr)},${f(rr * sy)} 0 0 1 ${f(x + Math.cos(a0 + 2.2) * rr)},${f(y + Math.sin(a0 + 2.2) * rr * sy)}`; }
    return `<g ${p.sh(1)}><path ${T(x, y)} d="${smooth(ring(s / 2, 12, .12, R, 1, sy))}" fill="${p.rg(c, .3, .18, .36, .34)}" stroke="${dk(c, .18)}" stroke-width=".7"/></g>
        <path d="${rid}" stroke="${dk(c, .18)}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/><path d="${rid}" stroke="#fffaf0" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-1 -1.4)"/>`;
}
// バターのかけら（溶けかけ）
function xplButter(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s * .62, 9, .25, rng(p.id + 'xbt' + x), 1.1, .9))}" fill="#f7d659" opacity=".55"/><g ${p.sh(.4)}><rect x="${-s / 2}" y="${-s * .4}" width="${s}" height="${f(s * .8)}" rx="${f(s * .18)}" fill="${p.g('#f8dc6a', .35, .15)}" stroke="#d9b13a" stroke-width=".5"/></g><path d="M${f(-s * .3)},${f(-s * .22)} L${f(s * .2)},${f(-s * .22)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`;
}
// 赤玉ねぎの薄切り（紫の縁）
function xplRedOnion(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${-s / 2},0 Q0,${f(-s * .5)} ${s / 2},0" stroke="#8a2a6a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${-s / 2},0 Q0,${f(-s * .5)} ${s / 2},0" stroke="#f1e2ee" stroke-width="1.5" fill="none" stroke-linecap="round" transform="translate(0 1.4)"/></g>`;
}
// ローリエ
function xplBay(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${-s / 2},0 Q0,${f(-s * .26)} ${s / 2},0 Q0,${f(s * .26)} ${-s / 2},0Z" fill="${p.g('#8a9a4a', .2, .3)}" stroke="#5a6a2a" stroke-width=".6"/><path d="M${f(-s * .45)},0 L${f(s * .45)},0" stroke="#c8d08a" stroke-width=".7"/></g>`;
}
// 汁の上の光る筋
const xplGleam = (cx, cy, R, op = .4) => xplShine(cx, cy, R, op);
// ハチミツで焼いたスペアリブの塊（骨の先が片側に並ぶ）
function xplRack(p, x, y, w, h, r = 0, { n = 5, c = '#93421a', seed = 1 } = {}){
    const R = rng(p.id + 'xrk' + seed);
    const top = Array.from({ length: n * 2 + 1 }, (_, i) => [-w / 2 + i * w / (n * 2), -h / 2 + (i % 2 ? -2 : 1.5) + (R() - .5) * 2]);
    const bot = Array.from({ length: n + 1 }, (_, i) => [w / 2 - i * w / n, h / 2 + (R() - .5) * 4]);
    const body = smooth([...top, ...bot], true, .6);
    let bones = '', grooves = '', ch = '';
    for (let i = 0; i < n; i++){
        const bx = -w / 2 + (i + .5) * w / n;
        bones += `<rect x="${f(bx - 4.2)}" y="${f(-h / 2 - 9)}" width="8.4" height="14" rx="4.2" fill="${p.g('#efe2c6', .3, .25)}" stroke="#b39a74" stroke-width=".6"/>`;
        if (i) grooves += `M${f(bx - w / n / 2)},${f(-h / 2 + 3)}Q${f(bx - w / n / 2 + 2)},0 ${f(bx - w / n / 2)},${f(h / 2 - 3)}`;
    }
    for (let i = 0; i < 6; i++) ch += `<ellipse cx="${f((R() - .5) * w * .8)}" cy="${f((R() - .5) * h * .6)}" rx="${f(3 + R() * 4)}" ry="${f(1.6 + R() * 2)}" fill="#2a0e04" opacity="${f(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.3)}>${bones}<path d="${body}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g>
        <path d="${grooves}" stroke="${dk(c, .5)}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>
        <g ${xplBlur(p, 1.2)}>${ch}</g>
        ${Array.from({ length: n }, (_, i) => { const bx = -w / 2 + (i + .5) * w / n; return `<path d="M${f(bx - 4)},${f(-h * .3)} Q${f(bx)},${f(-h * .38)} ${f(bx + 4)},${f(-h * .28)}" stroke="#ffd890" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`; }).join('')}
        <path d="M${f(-w * .4)},${f(h * .12)} Q0,${f(-h * .02)} ${f(w * .38)},${f(h * .1)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}

// アスパラの穂先
function xplAspTip(p, x, y, s, r = 0, { c = '#7aa64a' } = {}){
    const k = s / 24;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-12,-2.4 L2,-2.6 L2,2.6 L-12,2.4 Q-13,0 -12,-2.4Z" fill="${p.g(lt(c, .2), .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".5"/>
        <path d="M0,-3.2 C5,-3.6 10,-2.4 12.5,0 C10,2.4 5,3.6 0,3.2Z" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/></g>
        <path d="M2,-3 Q5,-1 3.5,1.6 M6,-2.6 Q8.5,-.8 7.4,1.4 M9.4,-1.6 Q11,-.4 10.4,1" stroke="${dk(c, .3)}" stroke-width=".6" fill="none"/>
        <path d="M-6,-2.4 L-4.4,0 M-9,2.4 L-7.4,.4" stroke="${dk(c, .25)}" stroke-width=".5" fill="none"/><path d="M-11,-1.2 L8,-1.6" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".6"/></g>`;
}
// かぼちゃの種
function xplSeed(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .3)}" fill="${p.g('#4e6e2a', .3, .25)}" stroke="#2e4414" stroke-width=".5"/><path d="M${f(-s * .3)},${f(-s * .08)} L${f(s * .25)},${f(-s * .08)}" stroke="#a8c070" stroke-width=".7" stroke-linecap="round"/></g>`;
}
const xplSoups = {
    // ジュレク: 茶色の陶器に、白く濁った酸味のライ麦スープ。ゆで卵の半分、白ソーセージの輪切り、じゃがいも、ベーコン、マジョラム
    pl_zurek: p => [
        xplStoneware(p, { glaze: '#7a4a2a' }),
        xplBroth(p, 75, '#e2d6bc', { glow: .5, gc: '#f3ecdc' }),
        `<g ${p.sh(.5)}>`, ...xplSpots('zur', 12, 60, 20).map(([x, y, r]) => xplDice(p, x, y, 17, r, '#f0e2b2', { op: .95 })), `</g>`,
        xplSaus(p, 64, 72, 30, 10, { c: '#b9a089', inC: '#ead9c6', seed: 1 }), xplSaus(p, 138, 128, 30, 0, { c: '#b9a089', inC: '#ead9c6', seed: 2 }), xplSaus(p, 68, 124, 28, 0, { c: '#a8442a', inC: '#cc7a62', seed: 3 }),
        xplSaus(p, 140, 72, 28, 30, { c: '#a8442a', inC: '#cc7a62', seed: 4, half: true }), xplSaus(p, 102, 154, 26, 200, { c: '#b9a089', inC: '#ead9c6', seed: 5, half: true }),
        K.eggHalf(p, 100, 80, 54, -20), K.eggHalf(p, 108, 120, 52, 25),
        xplBits(p, 140, 102, 26, { n: 8 }), xplBits(p, 56, 100, 22, { n: 6, seed: 2 }),
        xplFatS(p),
        K.sprinkle(p, 100, 100, 130, { c: '#6a7a3a', n: 40, r: .8 }),
        xplShine(100, 100, 75, .45),
    ].join(''),

    // バルシチ: 金縁のカップと受け皿に、澄んだ深いルビー色のビーツのスープ
    pl_barszcz: p => [
        xplCup(p),
        K.liquid(p, { R: 60, c: '#8e1028', op: 1, cx: 96, cy: 100, shine: false }),
        `<circle cx="90" cy="94" r="36" fill="#c0283e" opacity=".35"/>`,
        `<path d="M58,92 A40,40 0 0 1 84,62" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/><path d="M118,138 A44,44 0 0 0 138,116" stroke="#ff9aa8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>`,
        xplFatS(p, { cx: 96, s: 90, n: 10, c: '#e86a6a', op: .3 }),
        xplDill(p, 98, 102, 14, { n: 5 }),
    ].join(''),

    // クルプニク: 金縁の深皿に、黄金色のスープ、白い押し麦、ほぐした鶏肉、角切りのにんじん・じゃがいも、パセリ
    pl_krupnik: p => [
        xplSoupPlate(p),
        xplBroth(p, 76, '#e6bf66', { glow: .3 }),
        xplGrains(p, 100, 100, 136, { cols: ['#f4ead0', '#e8dab4', '#fbf5e4'], n: 150, size: 2.6, seed: 1 }),
        `<g ${p.sh(.5)}>`,
        ...xplSpots('kru', 11, 58, 23).map(([x, y, r], i) => i % 2 ? xplDice(p, x, y, 15, r, '#f08a30') : xplDice(p, x, y, 18, r, '#f0dc9c')),
        K.shreds(p, 100, 100, 110, { c: '#ead2a6', n: 22, w: 4.4, len: .24, seed: 3, curve: .5 }),
        `</g>`,
        xplFatS(p, { n: 18 }),
        K.parsley(p, 92, 96, 10), K.parsley(p, 124, 116, 8), K.parsley(p, 76, 124, 8),
        K.sprinkle(p, 100, 100, 120, { c: '#3f8a2a', n: 30, r: 1 }),
        xplShine(100, 100, 76, .4),
    ].join(''),

    // グロホフカ: 紺の縁のほうろうの鉢に、とろりとした黄色いえんどう豆のスープ、燻製ソーセージ、ベーコン、マジョラム
    pl_grochowka: p => [
        xplEnamel(p),
        xplBroth(p, 79, '#cfae42', { glow: .35, gc: '#e8cc6a' }),
        K.sprinkle(p, 100, 100, 140, { c: '#b8962e', n: 30, r: 3.4 }), K.sprinkle(p, 96, 96, 120, { c: '#e2c460', n: 24, r: 3 }),
        `<g ${p.sh(.5)}>`, ...xplSpots('gro', 5, 56, 26).map(([x, y, r]) => xplDice(p, x, y, 15, r, '#ecd690', { op: .8 })), `</g>`,
        ...[[72, 76, 0], [126, 70, 1], [140, 120, 0], [84, 134, 1], [104, 102, 0], [56, 108, 1], [118, 148, 0]].map(([x, y, h], i) => xplSaus(p, x, y, 31, i * 50, { half: !!h, seed: i })),
        xplBits(p, 110, 80, 30, { n: 8 }), xplBits(p, 110, 136, 26, { n: 6, seed: 2 }),
        xplFatS(p, { n: 12, c: '#e8a83a', op: .5 }),
        K.sprinkle(p, 100, 100, 130, { c: '#5a6a2a', n: 36, r: .8 }),
        xplShine(100, 100, 79, .4),
    ].join(''),

    // カプシニャク: ボレスワヴィエツ焼きの鉢に、オレンジがかったザワークラウトのスープ、豚肉、じゃがいも、にんじん
    pl_kapusniak: p => [
        xplBoleslawiec(p),
        xplBroth(p, 73, '#d79c4e', { glow: .3 }),
        K.shreds(p, 100, 100, 120, { c: '#ecdc98', n: 50, w: 2.6, len: .26, seed: 1, curve: .7 }),
        `<g ${p.sh(.5)}>`,
        ...xplSpots('kap', 13, 56, 22).map(([x, y, r], i) => i % 3 === 0 ? xplBeefChunk(p, x, y, 22, r, { c: '#cf8a4e', seed: i, k: .45 }) : i % 3 === 1 ? xplDice(p, x, y, 17, r, '#f0dc9c') : xplDice(p, x, y, 13, r, '#ef8530')),
        `</g>`,
        K.shreds(p, 100, 100, 90, { c: '#f2e6b0', n: 18, w: 2.4, len: .22, seed: 2, curve: .7 }),
        xplFatS(p, { n: 22, c: '#f0a030', op: .6 }),
        K.parsley(p, 96, 92, 9), K.parsley(p, 120, 120, 8),
        xplShine(100, 100, 73, .4),
    ].join(''),

    // カリフラワーのスープ: 金縁の深皿に、サワークリームで白く濁ったスープ、カリフラワーの小房、じゃがいも、にんじん、ディル
    pl_kalafiorowa: p => [
        xplSoupPlate(p, { gold: '#2c4c7c' }),
        xplBroth(p, 76, '#ebdfbe', { glow: .5, gc: '#f8f2e2' }),
        `<g ${p.sh(.4)}>`, ...xplSpots('kfw', 8, 56, 18, { rmin: 10 }).map(([x, y, r], i) => i % 2 ? xplDice(p, x, y, 13, r, '#ef8530') : xplDice(p, x, y, 14, r, '#f0dc9c')), `</g>`,
        ...[[76, 78, 38], [126, 76, 40], [136, 124, 38], [80, 128, 38], [104, 104, 34], [104, 50, 26], [52, 104, 26], [150, 98, 24], [106, 152, 26]].map(([x, y, s], i) => xplCauli(p, x, y, s, { seed: i })),
        xplDill(p, 100, 100, 130, { n: 34 }),
        xplFatS(p, { n: 10, op: .4 }),
        xplShine(100, 100, 76, .4),
    ].join(''),

    // 野菜のスープ: 緑の釉の鉢に、黄金色のスープ、さいの目の根菜、いんげん、グリンピース、ねぎ
    pl_jarzynowa: p => [
        K.bowl(p, { glaze: '#4f7a5a', inside: '#f2eee2', lip: .85 }),
        xplBroth(p, 76, '#e6c372', { glow: .3 }),
        `<g ${p.sh(.5)}>`,
        ...xplSpots('jar', 20, 62, 17).map(([x, y, r], i) => [xplDice(p, x, y, 15, r, '#ef8530'), xplDice(p, x, y, 17, r, '#f0dc9c'), xplDice(p, x, y, 15, r, '#f2ecd6'), xplGreenBean(p, x, y, 18, r, { c: '#4f9a34' })][i % 4]),
        `</g>`,
        ...xplSpots('jarp', 22, 64, 9, { cx: 101, cy: 99 }).map(([x, y]) => `<g ${p.sh(.3)}><circle cx="${f(x)}" cy="${f(y)}" r="4" fill="${p.rg('#6aa83a', .3, .25)}" stroke="#3f7a22" stroke-width=".5"/></g>`),
        xplLeekRing(p, 82, 110, 17), xplLeekRing(p, 124, 86, 16), xplLeekRing(p, 108, 136, 16), xplLeekRing(p, 70, 74, 15),
        xplFatS(p, { n: 14 }),
        K.sprinkle(p, 100, 100, 120, { c: '#3f8a2a', n: 30, r: 1 }),
        xplShine(100, 100, 76, .4),
    ].join(''),

    // マッシュルームのスープ: 青い縁の深皿に、クリーム色のスープ、薄切りマッシュルームたっぷり、じゃがいも、ディル
    pl_pieczarkowa: p => [
        xplSoupPlate(p, { gold: '#2c4c7c' }),
        xplBroth(p, 76, '#d8c29a', { glow: .4, gc: '#ece0c6' }),
        `<g ${p.sh(.4)}>`, ...xplSpots('pie', 6, 54, 30).map(([x, y, r]) => xplDice(p, x, y, 13, r, '#f0dc9c', { op: .85 })), `</g>`,
        `<g ${p.sh(.6)}>`, ...xplSpots('pim', 15, 58, 24).map(([x, y, r], i) => xplMushSlice(p, x, y, 28, r, { c: '#e6d6b6', skin: '#9a7a52' })), `</g>`,
        xplDill(p, 100, 100, 120, { n: 26 }),
        xplFatS(p, { n: 8, op: .4 }),
        xplShine(100, 100, 76, .4),
    ].join(''),

    // 白いんげん豆のスープ: 茶色の陶器に、トマトとパプリカで赤茶色のとろみのあるスープ、白いんげん、燻製ソーセージ、にんじん
    pl_fasolowa: p => [
        xplStoneware(p, { glaze: '#5e3a24' }),
        xplBroth(p, 75, '#b2643a', { glow: .3, gc: '#c88a5a' }),
        `<g ${p.sh(.5)}>`,
        ...xplSpots('fas', 30, 62, 14).map(([x, y, r]) => xplBean(p, x, y, 17, r, { c: '#ecdcbc' })),
        `</g>`,
        ...[[80, 80], [126, 90], [92, 128], [136, 130], [62, 112]].map(([x, y], i) => xplSaus(p, x, y, 22, i * 70, { half: i % 2 === 1, seed: i })),
        `<g ${p.sh(.4)}>`, xplDice(p, 104, 70, 11, 20, '#ef8530'), xplDice(p, 112, 112, 11, 50, '#ef8530'), xplDice(p, 62, 86, 10, 10, '#ef8530'), `</g>`,
        xplFatS(p, { n: 20, c: '#e8782a', op: .6 }),
        K.parsley(p, 100, 98, 9), K.parsley(p, 140, 108, 8),
        xplShine(100, 100, 75, .4),
    ].join(''),

    // スカンポのスープ: 金縁の深皿に、くすんだオリーブ色のクリーミーなスープ、刻んだスカンポ、ゆで卵、じゃがいも
    pl_szczawiowa: p => [
        xplSoupPlate(p),
        xplBroth(p, 76, '#a9a25a', { glow: .4, gc: '#c9c286' }),
        K.shreds(p, 100, 100, 130, { c: '#5f7026', n: 60, w: 2.8, len: .2, seed: 1, curve: .8 }),
        `<g ${p.sh(.4)}>`, ...xplSpots('szc', 11, 60, 20, { rmin: 22 }).map(([x, y, r]) => xplDice(p, x, y, 17, r, '#ecd690', { op: .9 })), `</g>`,
        K.eggHalf(p, 80, 92, 54, -15), K.eggHalf(p, 122, 112, 54, 20),
        xplDill(p, 100, 100, 100, { n: 14 }),
        xplShine(100, 100, 76, .4),
    ].join(''),

    // ボトヴィンカ: ボレスワヴィエツ焼きの鉢に、ピンク色のスープ、ビーツの葉と赤い茎、角切りのビーツ、じゃがいも、サワークリーム、ディル
    pl_botwinka: p => [
        xplBoleslawiec(p),
        xplBroth(p, 73, '#c8456a', { glow: .3, gc: '#e0708e' }),
        K.shreds(p, 100, 100, 122, { c: '#4f8a2a', n: 40, w: 4, len: .28, seed: 1, curve: .6 }),
        K.shreds(p, 100, 100, 112, { c: '#b02648', n: 22, w: 2.6, len: .26, seed: 2 }),
        `<g ${p.sh(.5)}>`,
        ...xplSpots('bot', 13, 58, 20).map(([x, y, r], i) => [xplDice(p, x, y, 16, r, '#8e1838'), xplDice(p, x, y, 17, r, '#f0dcb0'), xplDice(p, x, y, 13, r, '#ef8530')][i % 3]),
        `</g>`,
        xplDollop(p, 104, 98, 40),
        xplDill(p, 100, 100, 120, { n: 26 }),
        xplShine(100, 100, 73, .4),
    ].join(''),

    // フウォドニク: クリスタルの鉢に、ケフィアとビーツの鮮やかなピンクの冷たいスープ、きゅうり、ラディッシュ、ゆで卵、ディル
    pl_chlodnik: p => [
        xplGlass(p),
        xplBroth(p, 78, '#ee86ad', { glow: .35, gc: '#f8b2cc' }),
        `<g ${p.sh(.4)}>`, ...xplSpots('chl', 16, 64, 15, { rmin: 14 }).map(([x, y, r]) => xplDice(p, x, y, 13, r, '#9fc864')), `</g>`,
        xplRadish(p, 60, 84, 21, 10), xplRadish(p, 142, 84, 20, 40), xplRadish(p, 136, 134, 21, 70), xplRadish(p, 68, 132, 20), xplRadish(p, 102, 56, 19), xplRadish(p, 104, 146, 18),
        K.eggHalf(p, 86, 102, 50, -20), K.eggHalf(p, 124, 102, 48, 30),
        xplDill(p, 100, 100, 130, { n: 36, c: '#2f7a22' }),
        xplChives(p, 100, 100, 110, { n: 14 }),
        xplShine(100, 100, 78, .45),
    ].join(''),

    // カルトフランカ: 赤い縁のほうろうの鉢に、白く濁ったじゃがいものスープ、角切りじゃがいもたっぷり、ベーコン、マジョラム
    pl_kartoflanka: p => [
        xplEnamel(p, { rim: '#a8323a' }),
        xplBroth(p, 79, '#e3cd96', { glow: .45, gc: '#f2e6c4' }),
        `<g ${p.sh(.5)}>`,
        ...xplSpots('kar', 20, 64, 19).map(([x, y, r], i) => i % 5 === 4 ? xplDice(p, x, y, 13, r, '#ef8530') : xplDice(p, x, y, 19, r, '#f2dc98')),
        `</g>`,
        xplBits(p, 100, 100, 110, { n: 16 }),
        xplFatS(p, { n: 12, c: '#f0c050', op: .5 }),
        K.parsley(p, 94, 94, 9), K.parsley(p, 128, 120, 8),
        K.sprinkle(p, 100, 100, 130, { c: '#6a7a3a', n: 30, r: .8 }),
        xplShine(100, 100, 79, .4),
    ].join(''),

    // ブロッコリーのクリームスープ: 白い深皿に、なめらかな緑のスープ、クリームの渦、クルトン
    pl_brokulowa: p => [
        xplSoupPlate(p, { gold: '#2f6b3a' }),
        xplBroth(p, 76, '#7e9c3a', { glow: .3, gc: '#a0bc5a' }),
        xplSwirl(p, 100, 100, 44, '#f6f2e2', { turns: 1.7, w: 3.6, a0: 1 }),
        `<g ${p.sh(.6)}>`, ...[[66, 72], [80, 60], [140, 82], [148, 100], [130, 140], [72, 136], [58, 116], [142, 120]].map(([x, y], i) => xplCrouton(p, x, y, 16, i * 40)), `</g>`,
        K.broccoli(p, 112, 66, 18, 20), K.broccoli(p, 98, 146, 16, -20),
        K.sprinkle(p, 100, 100, 100, { c: '#2a1d14', n: 14, r: .6 }),
        xplShine(100, 100, 76, .45),
    ].join(''),

    // かぼちゃのクリームスープ: 灰青の陶器の鉢に、鮮やかなオレンジのスープ、クリームの渦、かぼちゃの種、こしょう
    pl_dyniowa: p => [
        K.bowl(p, { glaze: '#3d5a6e', inside: '#eef0ec', lip: .85 }),
        xplBroth(p, 76, '#ea8a2a', { glow: .35, gc: '#f6a848' }),
        xplSwirl(p, 100, 100, 46, '#fbf3e2', { turns: 1.6, w: 3.8 }),
        `<g ${p.sh(.4)}>`, ...[[80, 70, 30], [92, 64, -20], [130, 80, 60], [138, 92, 10], [118, 136, -40], [70, 120, 80], [64, 106, 20], [106, 140, 70], [144, 116, -10]].map(([x, y, r]) => xplSeed(p, x, y, 10, r)), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#2a1d14', n: 18, r: .6 }),
        K.parsley(p, 104, 98, 8),
        xplShine(100, 100, 76, .45),
    ].join(''),

    // 赤レンズ豆のスープ: 茶色の陶器に、オレンジ色のとろみのあるスープ、レンズ豆の粒、にんじん、パセリ、レモン
    pl_soczewicowa: p => [
        xplStoneware(p, { glaze: '#a0582c' }),
        xplBroth(p, 75, '#d9732c', { glow: .3, gc: '#ea9244' }),
        xplGrains(p, 100, 100, 140, { cols: ['#f6b066', '#e07a30', '#b8521e'], n: 170, size: 3, seed: 1 }),
        `<g ${p.sh(.4)}>`, ...xplSpots('soc', 9, 56, 24).map(([x, y, r]) => xplDice(p, x, y, 14, r, '#f07a28')), `</g>`,
        xplLemonWedge(p, 136, 72, 44, 40),
        K.parsley(p, 92, 100, 11), K.parsley(p, 112, 120, 9), K.parsley(p, 78, 82, 8),
        K.sprinkle(p, 100, 100, 110, { c: '#3f8a2a', n: 24, r: 1 }),
        xplShine(100, 100, 75, .4),
    ].join(''),

    // ディルのスープ: 緑の縁の深皿に、クリームで白っぽいスープ、ディルがたっぷり、じゃがいも、にんじん
    pl_koperkowa: p => [
        xplSoupPlate(p, { gold: '#2f6b3a' }),
        xplBroth(p, 76, '#e8e0b2', { glow: .45, gc: '#f6f0d4' }),
        `<g ${p.sh(.4)}>`, ...xplSpots('kop', 15, 60, 20).map(([x, y, r], i) => i % 3 === 2 ? xplDice(p, x, y, 13, r, '#ef8530') : xplDice(p, x, y, 18, r, '#f0dc9c')), `</g>`,
        xplDill(p, 100, 100, 140, { n: 60, c: '#3f8a2a' }),
        xplDill(p, 100, 100, 110, { n: 30, c: '#2f7a22', seed: 2 }),
        xplFatS(p, { n: 10, op: .4 }),
        xplShine(100, 100, 76, .45),
    ].join(''),

    // グーラッシュスープ: 濃い陶器の鉢に、パプリカで赤茶色の濃いスープ、牛肉、赤ピーマン、じゃがいも、にんじん
    pl_gulaszowa: p => [
        xplStoneware(p, { glaze: '#4e3426' }),
        xplBroth(p, 75, '#a3401e', { glow: .3, gc: '#c25a30' }),
        `<g ${p.sh(.6)}>`,
        ...xplSpots('gul', 16, 60, 21).map(([x, y, r], i) => [xplBeefChunk(p, x, y, 26, r, { c: '#9a5232', seed: i, k: .35 }), xplDice(p, x, y, 18, r, '#e8a860'), K.pepperPiece(p, x, y, 19, r, { c: '#d43a26' }), xplBeefChunk(p, x, y, 24, r, { c: '#8a4628', seed: i + 9, k: .35 })][i % 4]),
        `</g>`,
        xplFatS(p, { n: 24, c: '#e8582a', op: .55 }),
        K.parsley(p, 100, 98, 9), K.parsley(p, 132, 120, 8),
        xplShine(100, 100, 75, .4),
    ].join(''),

    // きのこのスープ: 金縁の深皿に、乾燥ポルチーニの香る澄んだ茶色のスープ、きのこの薄切り、細い麺、クリーム
    pl_grzybowa: p => [
        xplSoupPlate(p),
        xplBroth(p, 76, '#7e5530', { glow: .3, gc: '#9a7046' }),
        xplThinNoodles(p, 100, 106, 92, { n: 22, c: '#efd48a' }),
        `<g ${p.sh(.6)}>`, ...xplSpots('grz', 11, 58, 26, { rmin: 14 }).map(([x, y, r]) => xplMushSlice(p, x, y, 28, r, { c: '#c8a478', skin: '#5a3a1e' })), `</g>`,
        `<path d="M80,96 C90,88 106,104 120,94" stroke="#efe2c8" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
        K.parsley(p, 100, 100, 10), K.parsley(p, 76, 120, 8), K.parsley(p, 128, 120, 8),
        xplFatS(p, { n: 12, c: '#d8a040', op: .45 }),
        xplShine(100, 100, 76, .45),
    ].join(''),

    // アスパラガスのスープ: 金縁の深皿に、淡いクリーム色のスープ、白と緑のアスパラガスの穂先と切り身、パセリ
    pl_szparagowa: p => [
        xplSoupPlate(p),
        xplBroth(p, 76, '#ece1bb', { glow: .45, gc: '#f8f2dc' }),
        `<g ${p.sh(.4)}>`, ...xplSpots('szpd', 6, 56, 28).map(([x, y, r]) => xplDice(p, x, y, 13, r, '#f0dc9c', { op: .85 })), `</g>`,
        ...xplSpots('szp', 11, 52, 25).map(([x, y, r], i) => xplAspTip(p, x, y, 40, r, { c: i % 2 ? '#7aa64a' : '#e6dcae' })),
        ...[[96, 70], [146, 90], [92, 140], [56, 86], [126, 102]].map(([x, y], i) => `<g ${p.sh(.4)}>${K.greenBean(p, x, y, 10, i * 50, { c: i % 2 ? '#8ab05a' : '#ece4c0' })}</g>`),
        K.parsley(p, 104, 96, 8), K.sprinkle(p, 100, 100, 110, { c: '#3f8a2a', n: 24, r: 1 }),
        xplShine(100, 100, 76, .45),
    ].join(''),
};
// スープの脂の粒（器の中心に合わせて）
function xplFatS(p, { cx = 100, cy = 100, s = 120, n = 14, c = '#f6c84a', op = .5 } = {}){ return xplFat(p, cx, cy, s, { n, c, op }); }

// そば米（カシャ）の山
function xplKasza(p, x, y, s, { seed = 1, n = 150, sy = 1 } = {}){
    return `<g ${p.sh(.9)}><path ${T(x, y)} d="${smooth(ring(s / 2, 11, .12, rng(p.id + 'xks' + seed), 1, sy))}" fill="${p.rg('#9a6a3e', .2, .25)}"/></g>`
        + xplGrains(p, x, y, s * .96, { cols: ['#b8854f', '#9c6a3c', '#cfa06a', '#7e5030'], n, size: 3.3, tri: true, seed, sy });
}
const xplMains = {
    // ゴウォンプキ: 白い楕円の深皿に、トマトソースで煮たキャベツの葉の肉巻き4つ、サワークリーム、パセリ
    pl_golabki: p => [
        K.ovalDish(p, { rx: 96, ry: 82, rim: '#b8323a', deep: true }),
        `<ellipse cx="100" cy="100" rx="80" ry="66" fill="${p.rg('#c4422a', .2, .25)}"/>`,
        xplGolabek(p, 70, 78, 78, 44, -22, { seed: 1, c: '#d6cf8a' }), xplGolabek(p, 134, 80, 76, 44, 18, { seed: 2, c: '#cfc884' }),
        xplGolabek(p, 70, 124, 76, 44, 16, { seed: 3, c: '#d2cb86' }), xplGolabek(p, 132, 124, 78, 44, -20, { seed: 4, c: '#d6cf8a' }),
        K.glaze(p, 82, 84, 40, '#d0442a', { seed: 1, op: .55 }), K.glaze(p, 132, 74, 34, '#d0442a', { seed: 2, op: .5 }),
        K.glaze(p, 76, 126, 34, '#d0442a', { seed: 3, op: .5 }), K.glaze(p, 128, 122, 40, '#d0442a', { seed: 4, op: .55 }),
        xplDollop(p, 104, 102, 28),
        K.parsley(p, 82, 102, 9), K.parsley(p, 124, 98, 8), K.sprinkle(p, 100, 100, 120, { c: '#3f8a2a', n: 22, r: 1 }),
    ].join(''),

    // ビゴス: 茶色の陶器に、じっくり煮込んだ茶色のザワークラウト、キェウバサ、豚肉、きのこ、プルーン
    pl_bigos: p => [
        xplStoneware(p, { glaze: '#6a3e22' }),
        xplShredHeap(p, 100, 100, 150, '#9a6a34', { seed: 1, n: 115, w: 2.4, base: '#6e4520', len: .2 }),
        `<g ${p.sh(.7)}>`,
        ...[[72, 76], [128, 70], [140, 120], [92, 134], [60, 112], [108, 100]].map(([x, y], i) => xplSaus(p, x, y, 22, i * 60, { half: i % 2 === 0, seed: i })),
        xplBeefChunk(p, 98, 66, 20, 20, { c: '#8a5434', seed: 1 }), xplBeefChunk(p, 124, 100, 20, 60, { c: '#8a5434', seed: 2 }), xplBeefChunk(p, 76, 100, 18, 10, { c: '#8a5434', seed: 3 }), xplBeefChunk(p, 116, 142, 18, -20, { c: '#8a5434', seed: 4 }),
        xplPrune(p, 86, 84, 14, 30), xplPrune(p, 146, 96, 13, -20), xplPrune(p, 72, 132, 13, 60), xplPrune(p, 112, 120, 12, 10),
        xplMushSlice(p, 104, 82, 18, 20, { c: '#a98058', skin: '#4a2e18' }), xplMushSlice(p, 132, 138, 16, -30, { c: '#a98058', skin: '#4a2e18' }), xplMushSlice(p, 62, 92, 16, 60, { c: '#a98058', skin: '#4a2e18' }),
        `</g>`,
        xplBay(p, 116, 60, 26, 30),
        K.glaze(p, 100, 100, 110, '#8a4a1e', { seed: 4, op: .18 }),
    ].join(''),

    // プラツキ: 青い縁の皿に、縁がカリッと焼けたじゃがいものパンケーキ3枚、サワークリーム、ディル
    pl_placki: p => [
        xplPlate(p, { rim: '#2c4c7c' }),
        xplPlacek(p, 70, 80, 82, 0, { seed: 1 }),
        xplPlacek(p, 132, 86, 80, 40, { seed: 2, c: '#d4923a' }),
        xplPlacek(p, 98, 132, 84, 80, { seed: 3, c: '#dca044' }),
        xplDollop(p, 104, 112, 38),
        xplDill(p, 104, 110, 30, { n: 10 }),
        xplChives(p, 100, 100, 100, { n: 8 }),
    ].join(''),

    // コピトカ: 緑の縁の皿に、ひし形のじゃがいも団子、バターで炒めた玉ねぎとベーコン、パセリ
    pl_kopytka: p => [
        xplPlate(p, { rim: '#2f6b3a' }),
        `<g>`, ...xplSpots('kop2', 14, 56, 27).map(([x, y, r]) => xplKopytko(p, x, y, 38, r)), `</g>`,
        xplFriedOnion(p, 96, 92, 76, { n: 34, seed: 1 }), xplFriedOnion(p, 118, 128, 44, { n: 14, seed: 2 }),
        xplBits(p, 100, 100, 110, { n: 24, size: 3 }),
        K.parsley(p, 84, 88, 9), K.parsley(p, 126, 112, 8), K.sprinkle(p, 100, 100, 120, { c: '#3f8a2a', n: 26, r: 1 }),
    ].join(''),

    // ズラジ: 金縁の皿に、グレービーで煮た牛肉巻き2本と渦巻きの断面、そば米、ビーツのブラチキ
    pl_zrazy: p => [
        xplPlate(p),
        `<g ${p.sh(.9)}><path d="${smooth(ring(36, 11, .14, rng('xzk'), 1, .95).map(([a, b]) => [a + 60, b + 104]))}" fill="${p.rg('#c09060', .2, .25)}"/></g>`,
        xplGrains(p, 60, 104, 70, { cols: ['#c49058', '#a8743e', '#d8ac72', '#8a5a32'], n: 120, size: 3.6, tri: true, seed: 2, sy: .95 }),
        xplShredHeap(p, 112, 52, 50, '#9a1a3e', { seed: 2, n: 46, w: 2.1, base: '#6e0f2c', len: .2 }),
        K.pool(p, 128, 118, 90, '#6e3818', { seed: 1, sy: .95 }),
        xplRoulade(p, 120, 96, 66, 28, -24, { c: '#7c4424' }),
        xplRoulade(p, 132, 136, 66, 28, -14, { c: '#74401f' }),
        xplRouladeCut(p, 160, 104, 32, 0, { c: '#7c4424' }),
        `<path d="M98,118 q8,-4 16,1 M140,116 q8,-3 14,1" stroke="#4a240c" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
        K.parsley(p, 62, 100, 9), K.parsley(p, 112, 156, 8),
    ].join(''),

    // ギリシャ風の魚: 白い角皿に、揚げた白身魚の上へにんじん・根菜・玉ねぎをトマトで煮たオレンジ色の野菜をたっぷり
    pl_rybagrecku: p => [
        K.squareDish(p, { s: 176, base: '#f6f3ec', rim: '#c9a24a' }),
        xplFriedFish(p, 62, 66, 74, 40, -8, { seed: 1 }), xplFriedFish(p, 140, 70, 72, 38, 10, { seed: 2 }),
        xplFriedFish(p, 62, 136, 72, 40, 8, { seed: 3 }), xplFriedFish(p, 140, 134, 74, 40, -6, { seed: 4 }),
        K.pool(p, 100, 100, 132, '#d8692e', { seed: 2, sy: .9 }),
        xplShredHeap(p, 100, 100, 128, '#ec7a2e', { seed: 1, n: 100, w: 2.3, base: '#d0602a', len: .2, sy: .88 }),
        K.shreds(p, 100, 100, 104, { c: '#f2e6c4', n: 26, w: 2.1, len: .2, seed: 3 }),
        K.shreds(p, 100, 100, 90, { c: '#c83a22', n: 14, w: 2, len: .16, seed: 4 }),
        K.parsley(p, 92, 92, 10), K.parsley(p, 118, 112, 9), K.sprinkle(p, 100, 100, 100, { c: '#3f8a2a', n: 20, r: 1 }),
    ].join(''),

    // マスのオーブン焼き: 長皿に一尾のマス、レモンの輪切りとディル、ディルをかけたゆでじゃがいも
    pl_pstrag: p => [
        K.longPlate(p, { w: 190, h: 128 }),
        xplTrout(p, 96, 86, 164, -4),
        xplLemonSlice(p, 82, 80, 20), xplLemonSlice(p, 108, 78, 20), xplLemonSlice(p, 134, 82, 18),
        xplPotato(p, 70, 134, 30, 10, { seed: 1 }), xplPotato(p, 102, 138, 30, -20, { seed: 2 }), xplPotato(p, 134, 134, 28, 30, { seed: 3 }),
        xplDill(p, 102, 134, 90, { n: 22 }),
        xplDill(p, 110, 82, 70, { n: 14, c: '#2f7a22', seed: 3 }),
        xplLemonW(p),
    ].join(''),

    // 鶏肉のクリーム煮: 白い深皿に、ご飯の上へ鶏肉・にんじん・マッシュルーム・グリンピースの白いクリームソース
    pl_potrawka: p => [
        xplSoupPlate(p, { gold: '#2c4c7c' }),
        K.rice(p, 100, 100, 152, { grains: .14 }),
        `<g ${p.sh(.8)}><path d="${smooth(ring(52, 12, .16, rng('xpot'), 1.1, .95).map(([a, b]) => [a + 104, b + 102]))}" fill="${p.rg('#efe2c2', .25, .18)}" stroke="#d8c8a0" stroke-width=".7"/></g>`,
        `<g ${p.sh(.6)}>`,
        ...[[86, 86], [122, 82], [130, 118], [92, 124], [110, 104], [70, 108]].map(([x, y], i) => K.chickenPiece(p, x, y, 24, i * 50, { c: '#ecd4a8', skin: '#e0b880', seed: i })),
        ...[[104, 70], [146, 100], [78, 92], [114, 134]].map(([x, y], i) => xplMushSlice(p, x, y, 18, i * 70 - 30, { c: '#ece0c6', skin: '#a68a62' })),
        ...[[98, 90], [138, 96], [80, 128], [120, 120], [100, 140]].map(([x, y]) => K.carrotRound(p, x, y, 11)),
        `</g>`,
        ...[[106, 86], [116, 114], [88, 106], [126, 96], [100, 122], [72, 96], [136, 134], [92, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${p.rg('#6aa83a', .3, .25)}" stroke="#3f7a22" stroke-width=".5"/>`),
        K.sprinkle(p, 104, 102, 96, { c: '#3f8a2a', n: 26, r: 1 }),
    ].join(''),

    // コトレット・デ・ヴォライユ: 金縁の皿に、パン粉で揚げた俵形の鶏カツ（断面からディル入りのバターがとろり）、ゆでじゃがいも、ミゼリア
    pl_devolaille: p => [
        xplPlate(p),
        K.liquid(p, { R: 32, c: '#f5f0e0', op: 1, cx: 140, cy: 60, shine: false }),
        ...[[128, 52], [148, 56], [134, 70], [152, 74], [122, 66], [140, 44]].map(([x, y], i) => xplCuke(p, x, y, 16, i * 40)),
        xplDill(p, 140, 62, 44, { n: 9 }),
        xplPotato(p, 132, 136, 34, 20, { seed: 1 }), xplPotato(p, 158, 110, 28, -30, { seed: 2 }), xplPotato(p, 100, 156, 30, 50, { seed: 3 }),
        xplDill(p, 136, 134, 54, { n: 14 }),
        xplDevolaille(p, 80, 100, 124, 62, -30),
    ].join(''),

    // ハチミツのスペアリブ: 丸い木の板に、照りのある骨つきスペアリブの塊2つ、皮つきのローストポテト、焼き玉ねぎ
    pl_zeberka: p => [
        xplBoard(p),
        ...[[52, 74, 0], [150, 128, 2], [60, 134, 3], [104, 162, 4], [148, 64, 5]].map(([x, y, i]) => xplFriedPotato(p, x, y, 34, i * 60, { seed: i, c: '#e6b25a' })),
        K.onion(p, 166, 98, 24, 90, { c: '#c88a3a' }), K.onion(p, 34, 104, 22, -90, { c: '#c88a3a' }),
        xplRack(p, 96, 84, 108, 46, -14, { n: 5, seed: 1 }),
        xplRack(p, 106, 128, 100, 44, -8, { n: 4, seed: 2, c: '#8a3a16' }),
        K.sprinkle(p, 100, 100, 130, { c: '#4a6a2a', n: 20, r: 1 }),
    ].join(''),

    // 豚肩ロースの玉ねぎ煮: 赤茶の鉢に、濃いグレービー、厚切りの豚肉、くたくたの玉ねぎ、パセリ
    pl_karkowka: p => [
        K.bowl(p, { glaze: '#9a3a2a', inside: '#f1e6d4', lip: .86 }),
        K.liquid(p, { R: 76, c: '#7e4a1e', op: 1 }),
        xplPorkSteak(p, 72, 84, 74, 54, -20, { seed: 1, c: '#a8682e' }),
        xplPorkSteak(p, 132, 90, 72, 52, 30, { seed: 2, c: '#9e6028' }),
        xplPorkSteak(p, 98, 136, 76, 52, 5, { seed: 3, c: '#a46630' }),
        xplOnionStrips(p, 100, 100, 130, { n: 40, c: '#e0b066', w: 2.8 }),
        `<path d="M70,110 q8,-4 14,0 M126,124 q8,-3 14,1 M110,74 q6,-3 12,0" stroke="#5a2e10" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
        K.parsley(p, 100, 104, 10), K.parsley(p, 70, 128, 8),
        xplShine(100, 100, 76, .4),
    ].join(''),

    // 鶏レバーの玉ねぎ炒め: 鋳鉄のフライパンに、つやのある鶏レバー、あめ色の玉ねぎ、りんご、マジョラム
    pl_watrobka: p => [
        xplSkillet(p),
        `<circle cx="100" cy="100" r="74" fill="#5a2a14" opacity=".55"/>`,
        xplOnionStrips(p, 100, 100, 140, { n: 46, c: '#c98a3a', w: 2.8 }),
        ...xplSpots('wat', 8, 48, 34).map(([x, y, r], i) => xplLiver(p, x, y, 46, r, { seed: i, c: i % 2 ? '#7e3a22' : '#743420' })),
        xplApple(p, 70, 64, 28, -30), xplApple(p, 142, 120, 28, 40), xplApple(p, 58, 130, 26, 120), xplApple(p, 132, 60, 24, 10),
        xplOnionStrips(p, 100, 100, 110, { n: 16, c: '#dca850', w: 2.6, seed: 2 }),
        K.sprinkle(p, 100, 100, 120, { c: '#5a6a2a', n: 26, r: .9 }),
    ].join(''),

    // 目玉焼きとじゃがいもとほうれん草: 白い皿に、目玉焼き2つ、ディルをかけたゆでじゃがいも、炒めたほうれん草
    pl_jajkosadzone: p => [
        xplPlate(p, { rim: '#2f6b3a' }),
        `<g ${p.sh(.6)}><path d="${smooth(ring(32, 10, .3, rng('xjs'), 1.15, .9).map(([a, b]) => [a + 62, b + 128]))}" fill="#2f5a1c"/></g>`,
        K.greens(p, 62, 128, 70, { c: '#3a7424', n: 22, stems: '#7aa84a', seed: 1 }),
        xplPotato(p, 138, 128, 32, 20, { seed: 1 }), xplPotato(p, 152, 98, 28, -30, { seed: 2 }), xplPotato(p, 112, 154, 30, 50, { seed: 3 }), xplPotato(p, 104, 124, 26, 10, { seed: 4 }),
        xplDill(p, 132, 126, 60, { n: 18 }),
        K.friedEgg(p, 72, 76, 66, 10), K.friedEgg(p, 124, 66, 62, -20),
        K.sprinkle(p, 100, 72, 70, { c: '#2a1d14', n: 10, r: .6 }),
    ].join(''),

    // ファソルカ・ポ・ブレトンスク: ボレスワヴィエツ焼きの鉢に、トマトで煮た白いんげん豆、キェウバサ、ベーコン、マジョラム
    pl_bretonska: p => [
        xplBoleslawiec(p),
        K.liquid(p, { R: 74, c: '#b4402a', op: 1 }),
        `<g ${p.sh(.4)}>`, ...xplSpots('bre', 28, 64, 14.5).map(([x, y, r]) => xplBean(p, x, y, 20, r, { c: '#e8b88c' })), `</g>`,
        K.glaze(p, 100, 100, 120, '#c4462a', { seed: 1, op: .3 }),
        ...[[74, 76], [128, 70], [142, 122], [86, 132], [108, 100], [56, 108]].map(([x, y], i) => xplSaus(p, x, y, 30, i * 50, { half: i % 2 === 0, seed: i })),
        xplBits(p, 100, 100, 110, { n: 14 }),
        K.parsley(p, 104, 86, 9), K.sprinkle(p, 100, 100, 120, { c: '#5a6a2a', n: 28, r: .8 }),
        xplShine(100, 100, 74, .4),
    ].join(''),

    // レチョ: ほうろうの鍋に、赤と黄色のパプリカ、ズッキーニ、キェウバサのトマト煮
    pl_leczo: p => [
        xplEnamel(p, { rim: '#1e1e1e' }),
        K.liquid(p, { R: 78, c: '#c63e26', op: 1 }),
        `<g ${p.sh(.6)}>`,
        ...xplSpots('lec', 24, 62, 17).map(([x, y, r], i) => [K.pepperPiece(p, x, y, 30, r, { c: '#d8321e' }), K.pepperPiece(p, x, y, 30, r, { c: '#f2b818' }), xplZuc(p, x, y, 28, r, { half: true }), xplSaus(p, x, y, 26, r, { seed: i }), K.pepperPiece(p, x, y, 34, r, { c: '#e0401e', strip: true }), K.pepperPiece(p, x, y, 34, r, { c: '#f0c020', strip: true })][i % 6]),
        `</g>`,
        K.onion(p, 86, 104, 22, 30, { c: '#e8c48a' }), K.onion(p, 124, 80, 20, -40, { c: '#e8c48a' }),
        K.glaze(p, 100, 100, 110, '#d84a2a', { seed: 2, op: .2 }),
        K.parsley(p, 100, 100, 9),
        xplShine(100, 100, 78, .4),
    ].join(''),

    // プルペティ: 金縁の深皿に、ディル入りの白いクリームソースで煮た肉団子、ゆでじゃがいも
    pl_pulpety: p => [
        xplSoupPlate(p),
        K.liquid(p, { R: 76, c: '#ece2c2', op: 1 }),
        xplPotato(p, 140, 136, 34, 20, { seed: 1 }), xplPotato(p, 158, 102, 28, -30, { seed: 2 }),
        ...[[72, 74], [112, 64], [146, 70], [60, 112], [100, 102], [84, 142], [126, 112]].map(([x, y], i) => K.meatball(p, x, y, 40 - (i % 3) * 2, { c: '#c4813e' })),
        K.glaze(p, 100, 100, 120, '#f2ead0', { seed: 1, op: .25 }),
        xplDill(p, 100, 100, 140, { n: 60 }),
        xplShine(100, 100, 76, .4),
    ].join(''),

    // ワザンキ: 鋳鉄のフライパンに、四角いパスタ、炒めたキャベツ、キェウバサ、ベーコン、こしょう
    pl_lazanki: p => [
        xplSkillet(p),
        xplShredHeap(p, 100, 100, 150, '#dcca82', { seed: 1, n: 66, w: 2.4, base: '#c8b06a', len: .2 }),
        `<g ${p.sh(.5)}>`, ...xplSpots('laz', 22, 64, 15).map(([x, y, r]) => xplSquare(p, x, y, 18, r)), `</g>`,
        ...[[74, 80], [128, 74], [134, 124], [80, 128], [104, 102], [60, 104], [114, 150], [150, 100]].map(([x, y], i) => xplSaus(p, x, y, 18, i * 50, { half: i % 2 === 0, seed: i })),
        xplBits(p, 100, 100, 120, { n: 16 }),
        K.shreds(p, 100, 100, 110, { c: '#b88a3a', n: 16, w: 2, len: .16, seed: 6 }),
        K.sprinkle(p, 100, 100, 130, { c: '#2a1d14', n: 18, r: .6 }),
    ].join(''),

    // そば米とマッシュルームソース: 白い皿に、そば米の山と、サワークリームのマッシュルームソース、ディル
    pl_kaszagrzyby: p => [
        xplPlate(p, { rim: '#2c4c7c' }),
        `<g ${p.sh(.9)}><path d="${smooth(ring(52, 11, .14, rng('xkg0'), 1, .95).map(([a, b]) => [a + 72, b + 90]))}" fill="${p.rg('#c09060', .2, .25)}"/></g>`,
        xplGrains(p, 72, 90, 100, { cols: ['#c49058', '#a8743e', '#d8ac72', '#8a5a32'], n: 230, size: 3.6, tri: true, seed: 2, sy: .95 }),
        `<g ${p.sh(.8)}><path d="${smooth(ring(48, 12, .2, rng('xkg'), 1, .95).map(([a, b]) => [a + 128, b + 118]))}" fill="${p.rg('#d6bc8c', .25, .2)}" stroke="#b8986a" stroke-width=".6"/></g>`,
        `<g ${p.sh(.5)}>`, ...[[112, 100], [140, 96], [152, 124], [126, 128], [104, 130], [132, 150], [118, 112]].map(([x, y], i) => xplMushSlice(p, x, y, 24, i * 50 - 40, { c: '#e2d0ac', skin: '#8a6a44' })), `</g>`,
        xplDill(p, 128, 120, 74, { n: 20 }), xplDill(p, 70, 86, 40, { n: 6, seed: 2 }),
    ].join(''),

    // クロキェティ: 白い皿に、パン粉で揚げたクレープの包み3本（1本は断面にザワークラウトときのこ）、レタス
    pl_krokiety: p => [
        xplPlate(p, { rim: '#9a1b30' }),
        xplLeaf(p, 140, 60, 50, 30, { seed: 1 }), xplLeaf(p, 60, 146, 44, -150, { seed: 2 }),
        xplKrokiet(p, 92, 70, 104, 34, -28, { seed: 1 }),
        xplKrokiet(p, 100, 104, 108, 34, -28, { seed: 2, cut: true }),
        xplKrokiet(p, 108, 138, 104, 34, -28, { seed: 3 }),
        K.parsley(p, 150, 130, 9),
    ].join(''),

    // 卵のコトレット: 白い皿に、刻んだ卵とパン粉の丸い揚げ焼き3つ、ゆでじゃがいもとディル、きゅうり
    pl_kotletyjajeczne: p => [
        xplPlate(p, { rim: '#c9a24a' }),
        xplPotato(p, 142, 134, 32, 20, { seed: 1 }), xplPotato(p, 158, 104, 26, -30, { seed: 2 }), xplPotato(p, 114, 156, 28, 50, { seed: 3 }),
        xplDill(p, 140, 128, 54, { n: 14 }),
        ...[[134, 58], [154, 72], [122, 72], [144, 44]].map(([x, y], i) => xplCuke(p, x, y, 19, i * 40, { peeled: false })),
        xplCutlet(p, 66, 80, 62, 54, 0, { seed: 1, c: '#cf9440', jit: .08 }), xplCutlet(p, 100, 112, 62, 56, 20, { seed: 2, c: '#d39a44', jit: .08 }), xplCutlet(p, 62, 136, 58, 52, -10, { seed: 3, c: '#c88c3c', jit: .08 }),
        xplGrains(p, 76, 108, 80, { cols: ['#fbf6e2', '#f6d060'], n: 30, size: 1.4, seed: 4 }),
        xplChives(p, 80, 106, 80, { n: 9 }),
    ].join(''),

    // サワトカ・ヤジノヴァ: クリスタルの鉢に、さいの目の根菜・ピクルス・りんご・グリンピース・卵のマヨネーズあえ、卵とパセリの飾り
    pl_salatkajarzynowa: p => [
        xplGlass(p),
        `<g ${p.sh(1)}><path d="${smooth(ring(76, 12, .08, rng('xsj')))}" transform="translate(100 100)" fill="${p.rg('#f1e6b8', .3, .15)}"/></g>`,
        ...xplSpots('sj', 32, 66, 12.5).map(([x, y, r], i) => [xplDice(p, x, y, 12.5, r, '#f2e2a8'), xplDice(p, x, y, 11.5, r, '#f08a34'), xplDice(p, x, y, 11.5, r, '#9a9a4a'), xplDice(p, x, y, 11.5, r, '#f4f0dc'), xplDice(p, x, y, 12.5, r, '#efe2b2')][i % 5]),
        ...xplSpots('sjp', 22, 66, 8, { cx: 102, cy: 101 }).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="3.2" fill="${p.rg('#7ab04a', .3, .25)}" stroke="#4a7a28" stroke-width=".5"/>`),
        K.glaze(p, 100, 100, 130, '#fbf6e0', { seed: 1, op: .35 }),
        K.eggHalf(p, 100, 100, 34, 0), K.eggHalf(p, 72, 78, 28, -30), K.eggHalf(p, 132, 120, 28, 40),
        K.parsley(p, 100, 78, 10), K.parsley(p, 78, 120, 9), K.parsley(p, 132, 86, 9),
    ].join(''),

    // 新キャベツのディル煮: 青い鉢に、淡い緑のやわらかく煮た新キャベツ、ディルたっぷり、トマト
    pl_mlodakapusta: p => [
        K.bowl(p, { glaze: '#3e6a9a', inside: '#f1efe6', lip: .86 }),
        xplShredHeap(p, 100, 100, 152, '#d4e09a', { seed: 1, n: 130, w: 3, base: '#bccb7a', len: .24 }),
        K.glaze(p, 100, 100, 120, '#f2e8a0', { seed: 1, op: .3 }),
        `<g ${p.sh(.4)}>`, ...[[80, 84], [126, 80], [118, 126], [76, 122], [148, 106], [100, 64]].map(([x, y], i) => xplDice(p, x, y, 11, i * 30, '#e04a32')), `</g>`,
        xplDill(p, 100, 100, 140, { n: 50 }),
    ].join(''),

    // 赤キャベツのサラダ: 白い鉢に、細切りの紫キャベツ、すりおろしたりんご、玉ねぎ
    pl_czerwonakapusta: p => [
        K.bowl(p, { glaze: '#f2ede2', inside: '#f8f5ee', lip: .86 }),
        xplShredHeap(p, 100, 100, 150, '#8a2462', { seed: 1, n: 170, w: 2.3, base: '#5e1442', len: .2 }),
        K.shreds(p, 100, 100, 110, { c: '#f4ecd0', n: 22, w: 2, len: .18, seed: 2, curve: .6 }),
        xplGrains(p, 100, 100, 100, { cols: ['#f6eef4', '#e8dcea'], n: 14, size: 2.2, seed: 3 }),
        `<path d="M58,82 Q72,60 96,54" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),

    // セロリアックのサラダ: 青磁の鉢に、すりおろしたセロリアックとりんごのクリームあえ、レーズン、くるみ
    pl_seler: p => [
        K.kobachi(p, { glaze: '#8fb0a0', inside: '#f1f3ea' }),
        xplShredHeap(p, 100, 100, 146, '#f0e8cc', { seed: 1, n: 180, w: 2, base: '#e2d6b0', len: .14 }),
        K.glaze(p, 100, 100, 110, '#fffaf0', { seed: 1, op: .4 }),
        ...xplSpots('sel', 14, 56, 16).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="3.6" ry="2.6" fill="${p.g('#5a2e1e', .25, .3)}" stroke="#2e140a" stroke-width=".5"/><path d="M-2,-.5 Q0,-1.6 2,-.4" stroke="#8a5a40" stroke-width=".7" fill="none"/></g>`),
        ...[[86, 74], [128, 118], [72, 122]].map(([x, y], i) => `<g ${T(x, y, i * 60)}><g ${p.sh(.4)}><path d="${smooth(ring(6, 8, .4, rng('xwal' + i), 1.2, .9))}" fill="${p.g('#c8945a', .3, .3)}" stroke="#8a5a2a" stroke-width=".5"/></g><path d="M-4,0 Q0,-2 4,0 M-3,2 Q0,3 3,2" stroke="#8a5a2a" stroke-width=".6" fill="none"/></g>`),
        K.parsley(p, 112, 80, 9),
    ].join(''),

    // ポロねぎのサラダ: 黄色い鉢に、輪切りのポロねぎ、コーン、刻んだゆで卵のマヨネーズあえ
    pl_porowa: p => [
        K.bowl(p, { glaze: '#d0a43a', inside: '#f6f2e6', lip: .86 }),
        `<g ${p.sh(1)}><path d="${smooth(ring(76, 12, .08, rng('xpr')))}" transform="translate(100 100)" fill="${p.rg('#ece2b4', .3, .15)}"/></g>`,
        ...xplSpots('por', 30, 64, 13).map(([x, y]) => xplLeekRing(p, x, y, 16, { c: '#b8d27a' })),
        xplGrains(p, 100, 100, 130, { cols: ['#fbf8ee', '#f4c540', '#f6d660'], n: 40, size: 3.2, seed: 3 }),
        K.corn(p, 100, 100, 130, { n: 50 }),
        K.glaze(p, 100, 100, 120, '#fffbe8', { seed: 1, op: .25 }),
        K.sprinkle(p, 100, 100, 120, { c: '#2a1d14', n: 14, r: .5 }),
    ].join(''),

    // ćwikła: 生成りの小鉢に、細かくすりおろしたビーツと西洋わさび
    pl_cwikla: p => [
        K.kobachi(p, { glaze: '#d6c8ae', inside: '#f4efe4' }),
        xplShredHeap(p, 100, 100, 146, '#8e1438', { seed: 1, n: 230, w: 1.8, base: '#5e0a26', len: .1 }),
        K.shreds(p, 100, 100, 110, { c: '#f4ecdc', n: 26, w: 1.3, len: .08, seed: 2, curve: .6 }),
        `<path d="M58,84 Q70,62 94,54" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
    ].join(''),

    // オグルキ・マウォソルネ: 白い皿に、軽く漬けた丸ごとの小さなきゅうり（1本は縦半分）、ディルの花、にんにく
    pl_malosolne: p => [
        xplPlate(p, { rim: '#2f6b3a' }),
        xplCukeWhole(p, 70, 74, 76, -30, { seed: 1 }), xplCukeWhole(p, 128, 70, 72, 20, { seed: 2 }),
        xplCukeWhole(p, 104, 106, 80, -10, { seed: 3 }), xplCukeWhole(p, 70, 130, 70, 25, { seed: 4 }),
        xplCukeWhole(p, 138, 132, 70, -35, { half: true, seed: 5 }),
        xplUmbel(p, 150, 96, 30), xplUmbel(p, 52, 102, 26, { seed: 2 }),
        xplDill(p, 100, 100, 110, { n: 18 }),
        xplGarlic(p, 104, 146, 14, 20), xplGarlic(p, 96, 76, 12, -40),
    ].join(''),

    // ニシンの油漬け: 白い長皿に、銀の皮のニシンの切り身、油、玉ねぎの輪、ディル
    pl_sledz: p => [
        K.longPlate(p, { w: 190, h: 136 }),
        K.pool(p, 100, 100, 160, '#e2c460', { seed: 1, sy: .66, op: .55 }),
        ...[[44, 78], [84, 74], [124, 76], [162, 80], [52, 120], [94, 122], [136, 120], [170, 118]].map(([x, y], i) => xplHerring(p, x, y, 44, 28, (i % 2 ? 8 : -6))),
        xplOnionRing(p, 64, 98, 26, 20, { c: '#f6f0e8' }), xplOnionRing(p, 112, 98, 24, -10, { c: '#f6f0e8' }), xplOnionRing(p, 152, 100, 22, 40, { c: '#f6f0e8' }),
        xplOnionRing(p, 114, 142, 18, 10, { c: '#f6f0e8' }), xplOnionRing(p, 72, 142, 18, 0, { c: '#f6f0e8' }),
        xplDill(p, 100, 100, 140, { n: 20 }),
        K.sprinkle(p, 100, 100, 130, { c: '#2a1d14', n: 12, r: .6 }),
    ].join(''),

    // カリフラワーのポーランド風: 青い縁の皿に、丸ごとゆでたカリフラワー、バターで炒めたパン粉、刻んだゆで卵、パセリ
    pl_kalafior: p => [
        xplPlate(p, { rim: '#2c4c7c' }),
        K.pool(p, 100, 102, 140, '#f0d070', { seed: 2, sy: .95, op: .5 }),
        `<g ${p.sh(1.4)}><circle cx="100" cy="102" r="64" fill="${p.rg('#cdb27a', .1, .3)}"/></g>`,
        ...[[66, 82, 42], [134, 80, 42], [64, 122, 42], [136, 122, 42], [100, 62, 42], [100, 142, 42], [46, 102, 32], [154, 100, 32], [100, 100, 48]].map(([x, y, s], i) => xplCauli(p, x, y, s, { seed: i, c: '#f2e2b6', n: 7 })),
        K.glaze(p, 100, 98, 96, '#c8822a', { seed: 5, op: .35 }), xplGrains(p, 100, 100, 100, { cols: ['#a86a22', '#c88a34', '#dca04a'], n: 150, size: 2.3, seed: 7 }),
        xplEggBits(p, 100, 100, 84, { n: 28 }),
        K.sprinkle(p, 100, 100, 100, { c: '#3f8a2a', n: 34, r: 1.1 }),
    ].join(''),

    // にんじんとグリンピースのバター煮: オレンジの鉢に、つやのある角切りにんじんとグリンピース
    pl_marchewkagroszek: p => [
        K.bowl(p, { glaze: '#e08a32', inside: '#f6f0e4', lip: .86 }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#f0c060', .2, .2)}"/>`,
        `<g ${p.sh(.5)}>`, ...xplSpots('mg', 34, 66, 11.5).map(([x, y, r]) => xplDice(p, x, y, 13.5, r, '#f07a24')), `</g>`,
        ...xplSpots('mgp', 44, 68, 8.5, { cx: 101, cy: 101 }).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="${p.rg('#6cae3a', .35, .25)}" stroke="#3f7a22" stroke-width=".6"/>`),
        `<path d="${xplSpots('mgp', 44, 68, 8.5, { cx: 101, cy: 101 }).map(([x, y]) => `M${f(x - .4)},${f(y - 1.4)}a1,1 0 1 0 -2,0a1,1 0 1 0 2,0`).join('')}" fill="#fff" opacity=".7"/>`,
        K.glaze(p, 100, 100, 120, '#f8d870', { seed: 1, op: .25 }),
    ].join(''),

    // マッシュポテト: 水色の鉢に、ふんわりしたマッシュポテト、溶けかけのバター、ディル
    pl_puree: p => [
        K.bowl(p, { glaze: '#7a9ab0', inside: '#f3f1ea', lip: .86 }),
        xplMash(p, 100, 100, 150),
        xplButter(p, 96, 94, 22, 15),
        xplDill(p, 100, 100, 110, { n: 26 }),
    ].join(''),

    // クルスキ・シロンスキェ: 白い皿に、まん中にくぼみのある丸いじゃがいも団子、溶かしバターとスクファルキ
    pl_kluskislaskie: p => [
        xplPlate(p, { rim: '#c9a24a' }),
        ...[[72, 72], [112, 64], [148, 84], [56, 110], [96, 102], [136, 118], [76, 142], [116, 146], [154, 120]].map(([x, y], i) => xplKluska(p, x, y, 38, { seed: i })),
        K.glaze(p, 100, 100, 120, '#f6d050', { seed: 1, op: .3 }),
        xplBits(p, 100, 100, 120, { n: 22, size: 2.6 }),
        K.parsley(p, 98, 100, 8),
    ].join(''),

    // 詰め物をした卵: 白い皿にレタスを敷き、黄身のマヨネーズを絞ったゆで卵6つ、あさつき
    pl_jajkafaszerowane: p => [
        xplPlate(p, { rim: '#c9a24a' }),
        xplLeaf(p, 76, 80, 70, -30, { seed: 1 }), xplLeaf(p, 128, 86, 70, 40, { seed: 2 }), xplLeaf(p, 100, 132, 70, 100, { seed: 3 }),
        ...[[70, 72, -30], [118, 62, 20], [150, 98, 70], [130, 140, -40], [80, 138, 30], [56, 106, 80], [104, 102, 0]].map(([x, y, r]) => xplStuffedEgg(p, x, y, 42, r)),
        xplChives(p, 100, 100, 120, { n: 24 }),
    ].join(''),

    // バターヘッドレタスのサワークリームあえ: ボレスワヴィエツ焼きの鉢に、やわらかいレタス、サワークリーム、ゆで卵、ディル
    pl_salata: p => [
        xplBoleslawiec(p),
        ...xplSpots('sal', 9, 46, 30).map(([x, y, r], i) => xplLeaf(p, x, y, 62, r, { seed: i, c: i % 2 ? '#a8d468' : '#8cc050' })),
        `<path d="M62,92 Q80,80 100,86 M100,124 Q120,112 140,120 M76,118 Q90,110 104,114 M108,70 Q124,64 136,74" stroke="#fbf8ee" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`,
        xplEggBits(p, 100, 100, 90, { n: 22 }),
        xplDill(p, 100, 100, 110, { n: 24 }),
    ].join(''),

    // ズッキーニのフライ: 白い皿に、衣をつけて焼いたズッキーニの輪切り、にんにく、黒こしょう
    pl_cukinia: p => [
        xplPlate(p, { rim: '#2f6b3a' }),
        ...[[66, 70], [104, 60], [140, 74], [54, 108], [92, 98], [130, 106], [158, 112], [70, 142], [108, 136], [142, 144], [100, 166]].map(([x, y], i) => xplZuc(p, x, y, 40, i * 30, { fried: true })),
        xplGrains(p, 100, 104, 110, { cols: ['#f6f0dc'], n: 22, size: 1.4, seed: 2 }),
        K.sprinkle(p, 100, 104, 120, { c: '#2a1d14', n: 30, r: .6 }),
        K.parsley(p, 104, 104, 8),
    ].join(''),

    // マッシュルームのマリネ: 小鉢に、澄んだ漬け汁と丸ごとのマッシュルーム、玉ねぎの輪、粒こしょう、ローリエ
    pl_pieczarkimarynowane: p => [
        K.kobachi(p, { glaze: '#c8a070', inside: '#f3ece0' }),
        K.liquid(p, { R: 74, c: '#e2cc98', op: .75 }),
        ...xplSpots('pmm', 16, 54, 26).map(([x, y, r], i) => i % 3 === 0 ? `<g ${p.sh(.5)}>${xplMushSlice(p, x, y, 30, r, { c: '#e2cca4', skin: '#a8844e' })}</g>` : xplMushCap(p, x, y, 29 - (i % 2) * 3, { c: '#d8b886', seed: i })),
        xplOnionRing(p, 80, 96, 26, 10, { c: '#f4eee2' }), xplOnionRing(p, 124, 112, 22, -20, { c: '#f4eee2' }), xplOnionRing(p, 108, 70, 20, 30, { c: '#f4eee2' }),
        xplBay(p, 132, 74, 30, 30),
        K.sprinkle(p, 100, 100, 120, { c: '#2a1d14', n: 12, r: 1.4 }),
        xplShine(100, 100, 74, .5),
    ].join(''),

    // ジャガイモのソテー: 鋳鉄のフライパンに、こんがり焼けたゆでじゃがいもの輪切り、玉ねぎ、ベーコン、ディル
    pl_opiekane: p => [
        xplSkillet(p),
        ...xplSpots('opi', 14, 54, 24).map(([x, y, r], i) => xplFriedPotato(p, x, y, 34, r, { seed: i })),
        xplOnionStrips(p, 100, 100, 130, { n: 20, c: '#d29a44', w: 2.6 }),
        xplBits(p, 100, 100, 120, { n: 18 }),
        xplDill(p, 100, 100, 120, { n: 22 }),
        K.sprinkle(p, 100, 100, 130, { c: '#b8461e', n: 20, r: .7 }),
    ].join(''),

    // ブロッコリーのサラダ: 紺の鉢に、ゆでたブロッコリー、ゆで卵、赤玉ねぎ、にんにく入りのマヨネーズ
    pl_brokuly: p => [
        K.bowl(p, { glaze: '#2f5a7a', inside: '#f3f1ea', lip: .86 }),
        ...xplSpots('brk', 11, 50, 28).map(([x, y, r], i) => K.broccoli(p, x, y, 38, r)),
        K.eggHalf(p, 86, 92, 30, -20), K.eggHalf(p, 120, 118, 30, 30), K.eggHalf(p, 128, 78, 26, 60),
        xplRedOnion(p, 70, 120, 20, 30), xplRedOnion(p, 104, 140, 18, -20), xplRedOnion(p, 140, 100, 18, 60), xplRedOnion(p, 100, 66, 16, 10),
        `<path d="M70,100 Q84,92 98,100 M108,104 Q120,98 134,104 M84,128 Q94,122 106,126" stroke="#fbf6e2" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".9"/>`,
    ].join(''),

    // キャベツの炒め煮: 深緑の鉢に、あめ色に煮たザワークラウト、ベーコン、玉ねぎ
    pl_kapustazasmazana: p => [
        K.bowl(p, { glaze: '#3a5a3a', inside: '#f1ece0', lip: .86 }),
        xplShredHeap(p, 100, 100, 150, '#d2ac5a', { seed: 1, n: 160, w: 2.4, base: '#a8823a', len: .22 }),
        K.glaze(p, 100, 100, 110, '#e8b450', { seed: 1, op: .25 }),
        xplBits(p, 100, 100, 120, { n: 24, size: 3 }),
        K.sprinkle(p, 100, 100, 120, { c: '#2a1d14', n: 18, r: .6 }),
    ].join(''),

    // トファロジェク: 水色の小鉢に、白いカッテージチーズとサワークリーム、あさつき、ラディッシュの輪切り
    pl_twarozek: p => [
        K.kobachi(p, { glaze: '#7a9ec0', inside: '#f4f4f0' }),
        `<g ${p.sh(1)}><path d="${smooth(ring(72, 12, .1, rng('xtw')))}" transform="translate(100 100)" fill="${p.rg('#f6f2e6', .3, .14)}" stroke="#ddd6c4" stroke-width=".7"/></g>`,
        `<g ${p.sh(.4)}>${xplGrains(p, 100, 100, 136, { cols: ['#ffffff', '#f4f0e4', '#faf7ee'], n: 110, size: 5, seed: 1 })}</g>`,
        ...xplSpots('twr', 9, 54, 28, { rmin: 20 }).map(([x, y, r]) => `<g ${p.sh(.5)}>${xplRadish(p, x, y, 26, r)}</g>`),
        xplChives(p, 100, 100, 130, { n: 50 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a1d14', n: 12, r: .5 }),
    ].join(''),
};
function xplLemonW(p){ return xplLemonWedge(p, 160, 132, 30, -30); }

export default { ...xplSoups, ...xplMains };
