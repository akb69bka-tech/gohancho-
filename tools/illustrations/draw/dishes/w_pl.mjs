// World edition: Poland (pl)
import * as K from '../kit.mjs';
const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// ---------- この国のファイル専用の部品（pl〜） ----------
const plBlur = (p, s = 2) => `filter="url(#${p.def('plbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;

// 白い皿（細い金の縁）
function plPlate(p, { rim = '#c9a24a', R = 94 } = {}){
    return K.plate(p, { rim, R }) + `<circle cx="100" cy="100" r="${R - 7}" fill="none" stroke="${rim}" stroke-width=".8" opacity=".7"/>`;
}
// 深い白いスープ皿（talerz głęboki）金の縁
function plSoupPlate(p, { gold = '#c9a24a' } = {}){
    return K.bowl(p, { glaze: '#f7f3ea', inside: '#fbf8f1', R: 94, lip: .82 }) + `<circle cx="100" cy="100" r="89" fill="none" stroke="${gold}" stroke-width="1.8"/><circle cx="100" cy="100" r="78.5" fill="none" stroke="${dk('#f7f3ea', .1)}" stroke-width="1.2" opacity=".6"/>`;
}
// ボレスワヴィエツ焼き風の鉢（コバルトに孔雀の目の模様）
function plBoleslawiec(p, { R = 92, lip = .82, inside = '#f4f0e6', n = 16 } = {}){
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
function plPotato(p, x, y, s, r = 0, { seed = 1, c = '#f0d684' } = {}){
    const R = rng(p.id + 'plpo' + seed + x + y);
    const pts = ring(s / 2, 9, .14, R, 1.18, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .28)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .6 - s * .06, b * .55 - s * .06]))}" fill="${lt(c, .3)}" opacity=".7"/>
        <circle cx="${f(s * .18)}" cy="${f(s * .1)}" r="${f(s * .04)}" fill="${dk(c, .25)}" opacity=".5"/>
        <path d="M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .14)},${f(-s * .32)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 刻んだディル（細い羽のような緑）
function plDill(p, x, y, s, { n = 14, seed = 1, c = '#3f8a2a' } = {}){
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
function plCutlet(p, x, y, w, h, r = 0, { c = '#d79a45', seed = 1, jit = .16 } = {}){
    const R = rng(p.id + 'plct' + seed);
    const pts = ring(1, 18, jit, R, w / 2, h / 2);
    let spots = '';
    for (let i = 0; i < 7; i++) spots += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .6)}" rx="${f(w * (.06 + R() * .08))}" ry="${f(h * (.05 + R() * .07))}" fill="${dk(c, .35)}" opacity="${f(.25 + R() * .25)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.rough(2.6, .14)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .42)}" stroke-width="1"/></g></g>
        <g ${p.crumb(.8)}><path d="${smooth(pts.map(([a, b]) => [a * .92, b * .9]))}" fill="${lt(c, .06)}"/></g>
        <g ${plBlur(p, 1.4)}>${spots}</g>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .74]))}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.2" opacity=".35"/>
        <path d="M${f(-w * .32)},${f(-h * .2)} Q${f(-w * .12)},${f(-h * .38)} ${f(w * .18)},${f(-h * .32)}" stroke="#fff6dc" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// レモンのくし切り（皮の黄と果肉）
function plLemonWedge(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,0 Q0,-8 10,0 Q0,4.5 -10,0Z" fill="${p.g('#f2cf3a', .3, .2)}" stroke="#c9a114" stroke-width=".6"/></g>
        <path d="M-8.4,-.2 Q0,-6.2 8.4,-.2 Q0,2.4 -8.4,-.2Z" fill="#fbeea0"/>
        ${[-5, -2, 1.6, 5].map(a => `<path d="M${a},${f(-3.6 + Math.abs(a) * .35)} L${f(a * .8)},.8" stroke="#fff8d0" stroke-width=".7"/>`).join('')}</g>`;
}
// ピエロギ（半月形: まっすぐな折り目と、指でつまんだひだのある弧）
function plPierog(p, x, y, s, r = 0, { c = '#f4e7c6', seed = 1 } = {}){
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
function plFriedOnion(p, x, y, s, { n = 30, seed = 1, sy = .8 } = {}){
    return K.glaze(p, x, y, s * 1.05, '#f0c050', { seed, op: .35 }) + `<g ${p.sh(.35)}>${plGrains(p, x, y, s, { cols: ['#d99a3c', '#c07a24', '#ebbe6a', '#a8641c'], n, size: 2.1, seed, sy })}</g>`;
}
// サワークリームのひとすくい
function plDollop(p, x, y, s, { c = '#fbf8ee', seed = 1 } = {}){
    const R = rng(p.id + 'pldo' + seed + x);
    const pts = ring(s / 2, 9, .22, R, 1.1, .9);
    return `<g ${T(x, y)}><g ${p.sh(.7)}><path d="${smooth(pts)}" fill="${p.rg(c, .2, .12, .38, .34)}" stroke="#e2dccb" stroke-width=".7"/></g>
        <path d="M${f(-s * .2)},${f(s * .12)} Q${f(s * .05)},${f(s * .26)} ${f(s * .24)},${f(s * .02)} Q${f(s * .1)},${f(-s * .12)} ${f(-s * .02)},${f(s * .02)}" fill="none" stroke="#e0d9c6" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M${f(-s * .26)},${f(-s * .12)} Q${f(-s * .08)},${f(-s * .3)} ${f(s * .16)},${f(-s * .24)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
}
// 鶏もも（骨つき）のロースト: 太いもも＋細いすね＋骨の先
function plChickenLeg(p, x, y, L, r = 0, { c = '#c0662a', seed = 1 } = {}){
    const R = rng(p.id + 'plcl' + seed);
    const k = L / 100;
    const body = smooth([[-50, -6], [-44, -24], [-26, -32], [-6, -28], [8, -16], [26, -11], [40, -8], [44, -2], [40, 4], [26, 8], [8, 14], [-6, 26], [-26, 30], [-44, 22], [-52, 8]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]));
    let marks = '';
    for (let i = 0; i < 8; i++) marks += `<ellipse cx="${f(-44 + R() * 80)}" cy="${f(-18 + R() * 32)}" rx="${f(3 + R() * 5)}" ry="${f(2 + R() * 3)}" fill="${dk(c, .45)}" opacity="${f(.2 + R() * .3)}"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1.4)}><path d="${body}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .45)}" stroke-width="1"/>
        <path d="M42,-4 L52,-6 Q58,-9 59,-3 Q61,1 56,3 Q58,7 53,7 Q50,4 42,4Z" fill="${p.g('#efe2c8', .3, .2)}" stroke="#b9a07a" stroke-width=".8"/></g>
        <g ${plBlur(p, 1.6)}>${marks}<path d="M-40,-12 Q-20,-24 0,-18" stroke="${lt(c, .4)}" stroke-width="6" fill="none" opacity=".5"/></g>
        <path d="M-40,-14 Q-24,-26 -6,-22 M8,-10 Q24,-8 36,-5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M-30,10 Q-14,16 0,10" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}
// くし形のローストポテト
function plWedge(p, x, y, s, r = 0, { seed = 1 } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-15,4 Q-4,-12 15,-4 Q10,10 -15,4Z" fill="${p.g('#e9b75a', .3, .3)}" stroke="#a8702a" stroke-width=".8"/></g>
        <path d="M-15,4 Q10,10 15,-4 Q9,5 -14,2.4Z" fill="#b87a36"/>
        <path d="M-9,-1 Q0,-6 9,-3" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>
        <circle cx="3" cy="0" r=".8" fill="#9a5a20" opacity=".7"/><circle cx="-5" cy="1" r=".7" fill="#9a5a20" opacity=".7"/></g>`;
}
// 粒をばらまく（そば米・米・具の刻み）。同じ色は1本のpathにまとめる
function plGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, tri = false } = {}){
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
function plBeefChunk(p, x, y, s, r = 0, { c = '#9a5632', seed = 1 } = {}){
    const R = rng(p.id + 'plbc' + seed + x + y);
    const pts = ring(s / 2, 6, .28, R, 1.1, .9);
    return `<g ${T(x, y, r)}><g ${p.rough(1.4, .2)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f(-s * .3)},${f(-s * .02)} Q${f(-s * .05)},${f(-s * .18)} ${f(s * .26)},${f(-s * .05)} M${f(-s * .2)},${f(s * .2)} Q${f(s * .05)},${f(s * .08)} ${f(s * .26)},${f(s * .18)}" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// きゅうりのピクルス（斜め切り・オリーブ色）
function plPickle(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s * .65)}" ry="${f(s / 2)}" fill="#4f6420"/></g><ellipse rx="${f(s * .65 - 1.3)}" ry="${f(s / 2 - 1.3)}" fill="${p.rg('#c4c278', .2, .15)}"/>
        <ellipse rx="${f(s * .32)}" ry="${f(s / 4)}" fill="#a9ab5a" opacity=".8"/>
        ${[0, 1, 2, 3].map(i => `<ellipse cx="${f(Math.cos(i * 1.57 + .7) * s * .2)}" cy="${f(Math.sin(i * 1.57 + .7) * s * .15)}" rx="1" ry=".6" fill="#ecebc0"/>`).join('')}
        <path d="M${f(-s * .4)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .38)} ${f(s * .2)},${f(-s * .32)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 揚げた白身魚（パン粉）の切り身
function plFriedFish(p, x, y, w, h, r = 0, { c = '#d9a048', seed = 1 } = {}){
    const R = rng(p.id + 'plff' + seed);
    const pts = [[-w / 2, -h * .1], [-w * .4, -h * .45], [-w * .1, -h / 2], [w * .25, -h * .44], [w / 2, -h * .2], [w * .48, h * .2], [w * .2, h * .44], [-w * .15, h / 2], [-w * .42, h * .38]].map(([a, b]) => [a + (R() - .5) * 2.5, b + (R() - .5) * 2]);
    let spots = '';
    for (let i = 0; i < 5; i++) spots += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .5)}" rx="${f(w * .08)}" ry="${f(h * .1)}" fill="${dk(c, .35)}" opacity=".3"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2, .16)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .42)}" stroke-width=".9"/></g></g>
        <g ${p.crumb(.85)}><path d="${smooth(pts.map(([a, b]) => [a * .9, b * .86]))}" fill="${lt(c, .05)}"/></g>
        <g ${plBlur(p, 1.2)}>${spots}</g>
        <path d="M${f(-w * .32)},${f(-h * .2)} Q${f(-w * .05)},${f(-h * .4)} ${f(w * .25)},${f(-h * .28)}" stroke="#fff6dc" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 細切りの山（ビーツ・にんじん・ザワークラウト）: 下地の山の上に千切りを重ねる
function plShredHeap(p, x, y, s, c, { seed = 1, n = 60, w = 2.2, sy = .85, base = null, len = .32 } = {}){
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
function plTomatoSlice(p, x, y, s, r = 0){
    const h = s / 2;
    const rooms = [0, 1, 2, 3].map(i => { const a = i * 90 + 45; return `<g transform="rotate(${a})"><path d="M${f(h * .14)},${f(-h * .1)} Q${f(h * .62)},${f(-h * .5)} ${f(h * .68)},0 Q${f(h * .62)},${f(h * .5)} ${f(h * .14)},${f(h * .1)}Z" fill="#f2694c" opacity=".95"/>
        ${[.32, .48].map(t => `<ellipse cx="${f(h * t)}" cy="${f(h * (t - .4) * .5)}" rx="1.2" ry=".8" fill="#f7d36a"/><ellipse cx="${f(h * t)}" cy="${f(-h * (t - .4) * .5 + 2)}" rx="1.2" ry=".8" fill="#f7d36a"/>`).join('')}</g>`; }).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><circle r="${h}" fill="${p.g('#e0352a', .25, .25)}" stroke="#a51f17" stroke-width=".7"/></g>
        <circle r="${f(h * .86)}" fill="#e9483a"/>${rooms}
        <circle r="${f(h * .14)}" fill="#f4a08a"/>
        <path d="M${f(-h * .6)},${f(-h * .4)} Q${f(-h * .2)},${f(-h * .8)} ${f(h * .3)},${f(-h * .7)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 玉ねぎの薄い輪切り（リング）
function plOnionRing(p, x, y, s, r = 0, { c = '#f2ecf4' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="none" stroke="${dk(c, .12)}" stroke-width="3"/><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="none" stroke="${c}" stroke-width="2"/><ellipse rx="${f(s / 2 - 1)}" ry="${f(s * .42 - 1)}" fill="none" stroke="#c9a6c8" stroke-width=".5" opacity=".7"/></g>`;
}
// 小口切りのあさつき
function plChives(p, x, y, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'plcv' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2; d += `M${f(x + Math.cos(a) * dd + 1.6)},${f(y + Math.sin(a) * dd)}a1.6,1.6 0 1 0 -3.2,0a1.6,1.6 0 1 0 3.2,0`; }
    return `<path d="${d}" fill="#7fbf4a" stroke="#3f7f22" stroke-width=".7"/>`;
}
// クレープ（4つ折りの扇形）: 焼き色のレース模様
function plCrepe(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'plcr' + seed);
    const c = '#f0cf86', Rr = s;
    const shape = `M0,0 L${Rr},0 A${Rr},${Rr} 0 0 1 0,${Rr} Z`;
    const cl = p.def('plcrc' + seed, id => `<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
    let spots = '';
    for (let i = 0; i < 26; i++){ const a = R() * 1.57, d = Math.sqrt(R()) * Rr * .95; spots += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(1.5 + R() * 3.5)}" ry="${f(1 + R() * 2.4)}" fill="${R() < .5 ? '#c7853a' : '#b36f2a'}" opacity="${f(.35 + R() * .35)}"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${shape}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>
        <g clip-path="url(#${cl})"><g ${plBlur(p, .9)}>${spots}</g>
        <path d="M2,2 L${f(Rr * .97)},${f(Rr * .1)}" stroke="${dk(c, .25)}" stroke-width="1.3" opacity=".5"/>
        <path d="M${f(Rr * .97)},2 A${f(Rr * .96)},${f(Rr * .96)} 0 0 1 2,${f(Rr * .97)}" stroke="#f6e2b0" stroke-width="3" fill="none" opacity=".7"/></g>
        <path d="M${f(Rr * .2)},${f(Rr * .7)} Q${f(Rr * .5)},${f(Rr * .55)} ${f(Rr * .7)},${f(Rr * .25)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 粉砂糖
function plSugar(p, x, y, s, { n = 40, seed = 1 } = {}){
    const R = rng(p.id + 'plsu' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = .5 + R() * .7; d += `M${f(cx + rr)},${f(cy)}a${f(rr)},${f(rr)} 0 1 0 ${f(-2 * rr)},0a${f(rr)},${f(rr)} 0 1 0 ${f(2 * rr)},0`; }
    return `<path d="${d}" fill="#fffdf6" opacity=".95"/>`;
}
// いちご（半分に切った断面と丸ごと）
function plStrawberry(p, x, y, s, r = 0, { half = false } = {}){
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
function plThinNoodles(p, x, y, s, { c = '#f1d27a', n = 34, seed = 1, sy = .9 } = {}){
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
function plFat(p, x, y, s, { n = 16, seed = 1, c = '#f6c84a', op = .55 } = {}){
    const R = rng(p.id + 'plfa' + seed + x);
    let d = '', h = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = 1 + R() * 3; d += `M${f(cx + rr)},${f(cy)}a${f(rr)},${f(rr)} 0 1 0 ${f(-2 * rr)},0a${f(rr)},${f(rr)} 0 1 0 ${f(2 * rr)},0`; h += `M${f(cx - rr * .5)},${f(cy - rr * .3)}l${f(rr * .4)},${f(-rr * .25)}`; }
    return `<path d="${d}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><path d="${h}" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".7"/>`;
}
// さいの目の具（スープのじゃがいも・にんじん）
function plDice(p, x, y, s, r = 0, c = '#efdca0', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .2)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 具の配置（重なりすぎない）
function plSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('plspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
const plShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 柳のかご（楕円、編み目）
function plBasket(p, { rx = 92, ry = 76, c = '#c89a5a' } = {}){
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
function plCloth(p, { c = '#f3ece0', stripe = '#b8323a' } = {}){
    return `<g ${p.sh(.8)}><path d="M30,62 Q60,40 104,46 Q148,40 172,66 Q178,100 168,134 Q140,160 98,156 Q56,162 32,136 Q22,100 30,62Z" fill="${p.rg(c, .2, .12)}" stroke="#d8cdb8" stroke-width=".8"/></g>
        <path d="M34,70 Q62,50 104,54 Q146,50 168,72" stroke="${stripe}" stroke-width="2.2" fill="none" opacity=".8"/><path d="M34,76 Q62,56 104,60 Q146,56 168,78" stroke="${stripe}" stroke-width="1" fill="none" opacity=".7"/>`;
}
// ライ麦まじりのパンの切れ端（ドーム形、濃い皮、灰色がかった生地）
function plBreadSlice(p, x, y, w, h, r = 0, { crust = '#7a4420', crumb = '#d6bf96', seed = 1 } = {}){
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
function plBean(p, x, y, L, r = 0, { c = '#5aa13a', bend = 2 } = {}){
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q0,${-bend} ${L / 2},0" stroke="${dk(c, .3)}" stroke-width="7.4" fill="none" stroke-linecap="round"/><path d="M${-L / 2},0 Q0,${-bend} ${L / 2},0" stroke="${p.g(c, .3, .2)}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M${f(-L * .38)},-1.1 Q0,${f(-bend - 1.1)} ${f(L * .3)},-1.1" stroke="${lt(c, .45)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>
        ${[-.25, 0, .25].map(t => `<circle cx="${f(L * t)}" cy="${f(-bend * .5 * (1 - 4 * t * t) + .4)}" r=".9" fill="${dk(c, .12)}" opacity=".6"/>`).join('')}</g>`;
}
// 輪切りのきゅうり（薄い・皮をむいた）
function plCuke(p, x, y, s, r = 0, { peeled = true } = {}){
    const skin = peeled ? '#bcd890' : '#3f7d2e';
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .46)}" fill="${skin}" stroke="${dk(skin, .25)}" stroke-width=".5"/><ellipse rx="${f(s / 2 - 1.2)}" ry="${f(s * .46 - 1.2)}" fill="${p.rg('#e2f0c4', .2, .12)}" opacity=".95"/>
        <ellipse rx="${f(s * .24)}" ry="${f(s * .22)}" fill="#c8e09a" opacity=".85"/>
        ${[0, 1, 2].map(i => `<ellipse cx="${f(Math.cos(i * 2.09 + .5) * s * .13)}" cy="${f(Math.sin(i * 2.09 + .5) * s * .12)}" rx="1" ry=".6" fill="#f6f9e8"/>`).join('')}</g>`;
}

// ---------- 料理 ----------
export default {
    // 主食: 柳のかごに麻のナプキン、ライ麦まじりの黒っぽい田舎パンの薄切り4枚
    pl_staple: p => [
        plBasket(p),
        plCloth(p),
        plBreadSlice(p, 70, 92, 54, 60, -18, { seed: 1 }),
        plBreadSlice(p, 98, 102, 56, 62, -6, { seed: 2 }),
        plBreadSlice(p, 126, 108, 54, 60, 8, { seed: 3, crumb: '#cfb68a' }),
        plBreadSlice(p, 140, 84, 46, 50, 24, { seed: 4, crust: '#6a3a1a', crumb: '#c9ad80' }),
    ].join(''),

    // 豚カツ（コトレット・スハボヴィ）: 金縁の白い皿に皿からはみ出しそうな大きな薄いカツ、ディルをかけたゆでじゃがいも、レモン
    pl_schabowy: p => [
        plPlate(p),
        plCutlet(p, 86, 92, 112, 80, -14, { seed: 3 }),
        `<g>`,
        plPotato(p, 132, 138, 30, 20, { seed: 1 }), plPotato(p, 150, 112, 28, -30, { seed: 2 }), plPotato(p, 106, 148, 26, 50, { seed: 3 }),
        `</g>`,
        plDill(p, 132, 130, 50, { n: 18 }),
        plLemonWedge(p, 146, 70, 40, 40),
    ].join(''),

    // ひき肉のコトレット（コトレット・ミェロネ）: パン粉の俵形3個、ゆでじゃがいもとディル、ビーツのブラチキ
    pl_mielone: p => [
        plPlate(p, { rim: '#2f6b3a' }),
        plShredHeap(p, 134, 66, 52, '#9a1a3e', { seed: 2, n: 46, w: 2.2, base: '#6e0f2c' }),
        plPotato(p, 140, 130, 30, 10, { seed: 1 }), plPotato(p, 116, 150, 26, 60, { seed: 2 }), plPotato(p, 158, 108, 24, -20, { seed: 3 }),
        plDill(p, 140, 128, 44, { n: 14 }),
        plCutlet(p, 70, 120, 50, 36, -30, { seed: 1, c: '#b8742e', jit: .1 }),
        plCutlet(p, 82, 82, 50, 36, -10, { seed: 2, c: '#b0702c', jit: .1 }),
        plCutlet(p, 108, 112, 48, 34, 30, { seed: 4, c: '#bc7830', jit: .1 }),
    ].join(''),

    // ピエロギ・ルスキェ: 白い皿にひだのついた半月形のゆでたピエロギ8個、きつね色の炒め玉ねぎ、サワークリーム
    pl_pierogi: p => [
        plPlate(p),
        plPierog(p, 70, 70, 50, -30, { seed: 1 }), plPierog(p, 116, 60, 50, 10, { seed: 2 }), plPierog(p, 148, 92, 46, 70, { seed: 3 }),
        plPierog(p, 58, 112, 48, -80, { seed: 4 }), plPierog(p, 98, 98, 52, 20, { seed: 5 }), plPierog(p, 82, 140, 48, -20, { seed: 6 }),
        plPierog(p, 122, 132, 48, 40, { seed: 7 }),
        plFriedOnion(p, 92, 92, 70, { n: 40, seed: 1 }), plFriedOnion(p, 112, 126, 40, { n: 16, seed: 2 }), plFriedOnion(p, 70, 120, 30, { n: 10, seed: 3 }),
        plDollop(p, 148, 136, 30),
        plDill(p, 150, 134, 16, { n: 5 }),
    ].join(''),

    // 揚げたタラ: パン粉のタラ2切れ、ゆでじゃがいも、ザワークラウトのサラダ、レモン
    pl_dorsz: p => [
        plPlate(p, { rim: '#2c4c7c' }),
        plShredHeap(p, 136, 64, 50, '#efe6b4', { seed: 3, n: 44, w: 1.8, base: '#e2d79e' }),
        K.shreds(p, 136, 64, 34, { c: '#ef8a34', n: 8, w: 1.6, len: .6, seed: 4 }),
        plPotato(p, 144, 128, 28, 20, { seed: 1 }), plPotato(p, 124, 152, 26, -30, { seed: 2 }), plPotato(p, 162, 106, 22, 60, { seed: 3 }),
        `<g>`,
        plFriedFish(p, 76, 86, 80, 36, -24, { seed: 1 }),
        plFriedFish(p, 86, 128, 78, 34, -8, { seed: 2, c: '#d39a44' }),
        `</g>`,
        plLemonWedge(p, 118, 98, 26, 70), plLemonWedge(p, 50, 114, 22, -100),
        plDill(p, 142, 128, 40, { n: 12 }),
    ].join(''),

    // 鶏もものオーブン焼き: 白い楕円のオーブン皿に、パプリカ色にこんがり焼けた骨つきもも2本とくし形ポテト
    pl_udka: p => [
        K.ovalDish(p, { rx: 96, ry: 80, rim: '#c9a24a', deep: true }),
        `<ellipse cx="100" cy="102" rx="78" ry="64" fill="#c88a3a" opacity=".22"/>`,
        plWedge(p, 50, 84, 40, 60, { seed: 1 }), plWedge(p, 56, 128, 40, -30, { seed: 2 }), plWedge(p, 148, 70, 40, 20, { seed: 3 }), plWedge(p, 150, 136, 40, -60, { seed: 4 }),
        plWedge(p, 100, 154, 38, 10, { seed: 5 }), plWedge(p, 96, 48, 38, -10, { seed: 6 }), plWedge(p, 170, 104, 34, 90, { seed: 7 }),
        plChickenLeg(p, 98, 82, 104, -12, { seed: 1 }),
        plChickenLeg(p, 102, 122, 100, 172, { seed: 2, c: '#b95e26' }),
        K.sprinkle(p, 100, 100, 120, { c: '#7a9a3a', n: 16, r: .9 }),
    ].join(''),

    // 牛肉のグーラッシュとそば米: 白い皿に、粒のそば米（茶）と、パプリカ色のソースで煮込んだ牛肉、ピクルス
    pl_gulasz: p => [
        plPlate(p),
        `<g ${p.sh(.9)}><path d="${smooth(ring(34, 11, .12, rng('plgk'), 1.05, 1).map(([a, b]) => [a + 66, b + 98]))}" fill="${p.rg('#9a6a3e', .2, .25)}"/></g>`,
        plGrains(p, 66, 98, 66, { cols: ['#b8854f', '#9c6a3c', '#cfa06a', '#7e5030'], n: 190, size: 3.3, tri: true }),
        K.sprinkle(p, 60, 90, 50, { c: '#f2d2a0', n: 20, r: .7 }),
        K.pool(p, 124, 106, 92, '#9a3a1e', { seed: 1, sy: 1 }),
        `<g ${p.sh(.9)}>`,
        plBeefChunk(p, 112, 84, 28, 10, { seed: 1 }), plBeefChunk(p, 140, 92, 28, -20, { seed: 2 }), plBeefChunk(p, 118, 114, 30, 60, { seed: 3 }),
        plBeefChunk(p, 148, 122, 26, 30, { seed: 4 }), plBeefChunk(p, 122, 142, 26, -40, { seed: 5 }), plBeefChunk(p, 98, 136, 24, 80, { seed: 6 }),
        K.pepperPiece(p, 130, 76, 14, 30, { c: '#d43a26', strip: true }), K.pepperPiece(p, 152, 104, 13, -60, { c: '#d43a26', strip: true }),
        K.onion(p, 132, 130, 14, 40, { c: '#c47a3a', layers: 1 }),
        `</g>`,
        `<path d="M108,100 q8,-4 14,1 M132,108 q6,-5 12,0 M106,124 q6,3 12,-1" stroke="#7a2a12" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`,
        plPickle(p, 116, 52, 20, -20), plPickle(p, 140, 58, 18, 20), plPickle(p, 158, 72, 16, 50),
        K.parsley(p, 124, 104, 10),
    ].join(''),

    // クレープのチーズ包み: 4つ折りにした焼き色のクレープ3枚、粉砂糖、サワークリーム、いちご
    pl_nalesniki: p => [
        plPlate(p, { rim: '#2c4c7c' }),
        plCrepe(p, 46, 50, 74, 0, { seed: 1 }),
        plCrepe(p, 150, 52, 74, 90, { seed: 2 }),
        plCrepe(p, 66, 154, 70, -64, { seed: 3 }),
        `<path d="M54,58 Q62,92 52,118" stroke="#f8f2df" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`,
        plSugar(p, 82, 86, 60, { n: 50 }), plSugar(p, 122, 92, 50, { n: 30, seed: 2 }), plSugar(p, 92, 134, 40, { n: 26, seed: 3 }),
        plDollop(p, 140, 136, 30),
        plStrawberry(p, 156, 112, 22, 30, { half: true }), plStrawberry(p, 124, 156, 22, -20),
    ].join(''),

    // ミゼリア: ボレスワヴィエツ焼きの鉢に、サワークリームであえた薄切りきゅうり、ディル
    pl_mizeria: p => [
        plBoleslawiec(p),
        K.liquid(p, { R: 70, c: '#f5f1e2', op: 1 }),
        `<g ${p.sh(.4)}>`,
        ...plSpots('miz', 22, 54, 15).map(([x, y, r]) => plCuke(p, x, y, 19, r)),
        `</g>`,
        `<path d="M56,90 Q80,76 104,84 M100,128 Q118,118 140,124 M70,116 Q84,108 96,112" stroke="#fbf8ee" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`,
        plDill(p, 100, 100, 110, { n: 30 }),
        plShine(100, 100, 70, .4),
    ].join(''),

    // にんじんとりんごのサラダ: 青磁色の鉢に細くすりおろしたにんじん、りんごの白い千切り
    pl_marchewka: p => [
        K.kobachi(p, { glaze: '#7fae9a', inside: '#f1f3ea' }),
        plShredHeap(p, 100, 100, 128, '#f08a2c', { seed: 1, n: 200, w: 1.9, base: '#e6782a', len: .13 }),
        K.shreds(p, 100, 100, 96, { c: '#f6efcf', n: 26, w: 2.2, len: .16, seed: 2, curve: .6 }),
    ].join(''),

    // ビーツのブラチキ: 白い鉢にすりおろして炒めた深紅のビーツ、バターの照り
    pl_buraczki: p => [
        K.bowl(p, { glaze: '#f2ede2', inside: '#f8f5ee' }),
        plShredHeap(p, 100, 100, 130, '#a01a44', { seed: 1, n: 210, w: 2.1, base: '#6c0c2c', len: .12 }),
        `<path d="M58,82 Q72,60 96,54" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
        K.sprinkle(p, 100, 100, 90, { c: '#e04a7a', n: 18, r: .9 }),
    ].join(''),

    // ザワークラウトのサラダ: ボレスワヴィエツ焼きの鉢に、淡い黄色の発酵キャベツ、にんじんの千切り、玉ねぎ
    pl_kiszona: p => [
        plBoleslawiec(p),
        plShredHeap(p, 100, 100, 124, '#eee2a8', { seed: 1, n: 110, w: 2, base: '#ddcf8a', len: .3 }),
        K.shreds(p, 100, 100, 90, { c: '#ef8a34', n: 18, w: 1.7, len: .36, seed: 2 }),
        plGrains(p, 100, 100, 80, { cols: ['#f8f4e6', '#efe9d2'], n: 16, size: 2.2, seed: 3 }),
        K.sprinkle(p, 100, 100, 90, { c: '#3d3024', n: 14, r: .6 }),
    ].join(''),

    // いんげんのバターパン粉がけ: 白い楕円皿に緑と黄色のいんげん、きつね色のバターパン粉
    pl_fasolka: p => {
        const R = rng('plfas');
        const beans = Array.from({ length: 40 }, (_, i) => { const x = 44 + R() * 112, y = 62 + R() * 76, r = -30 + R() * 50; return plBean(p, x, y, 34 + R() * 10, r, { c: i % 3 === 0 ? '#e6cf52' : '#5aa13a', bend: (R() - .5) * 6 }); });
        return [
            K.ovalDish(p, { rx: 96, ry: 76, rim: null }),
            `<ellipse cx="100" cy="100" rx="88" ry="68" fill="none" stroke="#2f6b3a" stroke-width="1.6"/>`,
            `<g ${p.sh(.8)}>`, beans.join(''), `</g>`,
            K.crumbs(p, 100, 96, 90, { n: 60, c: '#d99a3e' }),
            K.crumbs(p, 96, 104, 60, { n: 30, c: '#e8b45a' }),
        ].join('');
    },

    // トマトと玉ねぎのサラダ: 白い皿にトマトの輪切りを並べ、紫がかった玉ねぎの輪、あさつき、こしょう
    pl_pomidory: p => [
        plPlate(p, { rim: '#2f6b3a' }),
        ...[[70, 72, 48], [116, 64, 46], [148, 100, 44], [58, 116, 46], [102, 108, 50], [132, 142, 46], [86, 148, 44]].map(([x, y, s], i) => plTomatoSlice(p, x, y, s, i * 37)),
        plOnionRing(p, 90, 92, 30, 20), plOnionRing(p, 126, 112, 26, -30), plOnionRing(p, 76, 132, 22, 60), plOnionRing(p, 130, 80, 20, 10), plOnionRing(p, 108, 140, 18, 40),
        plChives(p, 104, 104, 100, { n: 26 }),
        K.sprinkle(p, 104, 104, 100, { c: '#2a1d14', n: 22, r: .6 }),
    ].join(''),

    // ロソウ: 金縁の深いスープ皿に、澄んだ黄金色のコンソメ、細い卵麺、にんじんの輪切り、パセリ
    pl_rosol: p => [
        plSoupPlate(p),
        K.liquid(p, { R: 76, c: '#e8b440', op: .9 }),
        `<circle cx="98" cy="96" r="50" fill="#f6d06a" opacity=".22"/>`,
        plThinNoodles(p, 100, 104, 104, { n: 30 }),
        `<circle cx="100" cy="102" r="56" fill="#e8b440" opacity=".18"/>`,
        `<g ${p.sh(.5)}>`,
        ...[[70, 76], [126, 72], [140, 116], [86, 132], [112, 92], [62, 110], [120, 140]].map(([x, y]) => K.carrotRound(p, x, y, 14)),
        `</g>`,
        plFat(p, 100, 100, 130, { n: 22 }),
        K.parsley(p, 98, 112, 10), K.parsley(p, 132, 94, 8), K.parsley(p, 82, 92, 8),
        plShine(100, 100, 76, .45),
    ].join(''),

    // トマトスープ（ご飯入り）: 深いスープ皿に、サワークリームでまろやかなオレンジ色のスープ、ご飯の粒、パセリ
    pl_pomidorowa: p => [
        plSoupPlate(p),
        K.liquid(p, { R: 76, c: '#e25e2e', op: 1 }),
        `<circle cx="96" cy="94" r="54" fill="#f08a52" opacity=".35"/>`,
        `<path d="M70,108 C84,96 104,116 124,102 C134,96 142,104 138,112" stroke="#f6c2a0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
        plGrains(p, 104, 106, 104, { cols: ['#fbf3e4', '#f4e0c8', '#fde9d8'], n: 70, size: 2.4, seed: 1, sy: .9 }),
        K.parsley(p, 92, 92, 10), K.parsley(p, 120, 110, 9), K.parsley(p, 80, 120, 8),
        plDill(p, 104, 100, 50, { n: 6, c: '#2f7a22' }),
        plShine(100, 100, 76, .4),
    ].join(''),

    // オグルコヴァ: ボレスワヴィエツ焼きの鉢に、淡い緑がかったクリーム色のスープ、角切りじゃがいも、すりおろしたピクルスとにんじん、ディル
    pl_ogorkowa: p => [
        plBoleslawiec(p, { inside: '#f3efe4' }),
        K.liquid(p, { R: 70, c: '#e5dcae', op: 1 }),
        `<circle cx="98" cy="96" r="46" fill="#f3ecd0" opacity=".45"/>`,
        `<g ${p.sh(.5)}>`,
        ...plSpots('ogo', 12, 50, 18).map(([x, y, r]) => plDice(p, x, y, 13, r, '#f0dc9c')),
        `</g>`,
        K.shreds(p, 100, 100, 100, { c: '#8fa04a', n: 26, w: 2.2, len: .14, seed: 2 }),
        K.shreds(p, 100, 100, 90, { c: '#ef8a34', n: 12, w: 1.6, len: .12, seed: 3 }),
        plDill(p, 100, 100, 104, { n: 30 }),
        plFat(p, 100, 100, 110, { n: 10, c: '#f1d66a', op: .5 }),
        plShine(100, 100, 70, .4),
    ].join(''),
};
