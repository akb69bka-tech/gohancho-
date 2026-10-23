// Peru (pe_*) — hand-drawn redraw of the everyday mains, sides and soups (comida criolla casera, chifa, Andean)
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// local helpers (wp = x Peru)
// =========================================================
function xpeSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function xpeOutline(p, c, r = .55){
    const id = p.def('xpeOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const xpeBlur = (p, s = 2) => `filter="url(#${p.def('xpebl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const xpeShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .2)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .64)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// evenly spread spots (no heavy overlaps)
function xpeSpots(seed, n, rx, ry, minD, cx = 100, cy = 100){
    const R = rng('xpespots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()), x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// mound of a smooth sauce / purée
function xpeMound(p, x, y, rx, ry, c, { seed = 1, l = .25, d = .3, jit = .14 } = {}){
    const R = rng(p.id + 'xpemnd' + seed);
    return `<path ${T(x, y)} d="${xpeSm(ring(rx, 12, jit, R, 1, ry / rx), true)}" fill="${p.rg(c, l, d, .4, .38)}"/>`;
}
// rice mound (grains as short strokes) — same drawing as e_rice_noodle / w_us
function xpeRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, hiK = .85 } = {}){
    const R = rng(p.id + 'xpeRice' + seed + x + y);
    const shape = xpeSm(ring(s / 2, 14, .07, R, 1, sy), true);
    const hi = lt(tint, hiK), mid = dk(tint, .02), sd = dk(tint, .3);
    const n = Math.round(s * s / 40 * density);
    const L = [['', '', ''], ['', '', '']];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * s / 2 * .96, gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy;
        const h = grain * (.42 + R() * .14), b = R() * Math.PI, dx = Math.cos(b) * h, dy = Math.sin(b) * h;
        const seg = `M${Math.round(gx - dx)} ${Math.round(gy - dy)}l${f1(dx * 2)} ${f1(dy * 2)}`;
        const l = L[i % 2];
        if ((gx + gy) / (s / 2) + (R() - .5) * 1.4 < .2){ l[0] += seg; if (R() < .4) l[2] += `M${f1(gx - dx * .6 - .55)} ${f1(gy - dy * .6 - .55)}l${f1(dx * .9)} ${f1(dy * .9)}`; } else l[1] += seg;
    }
    const shade = p.def('xpeRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// pasta swirl (spaghetti nest)
function xpePasta(p, x, y, s, { c = '#f0d58e', w = 2.2, n = 40, seed = 1, sy = .92, outline = null, layers = 5 } = {}){
    const R = rng(p.id + 'xpePs' + seed);
    const ol = xpeOutline(p, outline || dk(c, .3), .5);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.18 + Math.sqrt(R()) * .8), a0 = R() * 6.28, sweep = 1.4 + R() * 2.4;
        const cx = x + (R() - .5) * s * .1, cy = y + (R() - .5) * s * .1;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .18); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const m = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2);
        L[i % layers][m < -.4 ? 1 : m > .8 ? 2 : 0] += xpeSm(pts);
    }
    const base = `<path ${T(x, y)} d="${xpeSm(ring(s / 2 * .9, 12, .12, R, 1, sy), true)}" fill="${dk(c, .2)}"/>`;
    const body = L.map(([a, b, d]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${dk(c, .1)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .25)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`).join('');
    return `<g ${p.sh(.9)}>${base}${body}</g>`;
}
// many tiny round things in one path per colour (lentils, quinoa, peas, beans)
function xpeDots(p, x, y, s, { cols = ['#6b4a2e'], n = 60, size = 3, seed = 1, sy = 1, len = .8, hi = .45 } = {}){
    const R = rng(p.id + 'xpedt' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, b = R() * 6.28; ds[Math.floor(R() * cols.length)] += `M${f1(x + Math.cos(a) * d)} ${f1(y + Math.sin(a) * d * sy)}l${f1(Math.cos(b) * len)} ${f1(Math.sin(b) * len)}`; }
    return cols.map((c, i) => `<path d="${ds[i]}" stroke="${dk(c, .3)}" stroke-width="${f1(size + .9)}" stroke-linecap="round" fill="none"/><path d="${ds[i]}" stroke="${c}" stroke-width="${size}" stroke-linecap="round" fill="none"/>`).join('')
        + `<path d="${ds.join('')}" stroke="#fff" stroke-width="${f1(size * .3)}" stroke-linecap="round" fill="none" opacity="${hi}" transform="translate(${f1(-size * .22)} ${f1(-size * .22)})"/>`;
}
// small dice (soup vegetables, potato cubes)
function xpeDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1, skin = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f1(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f1(s * .86)}" height="${f1(s * .86)}" rx="${f1(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f1(h * .45)}" width="${f1(s * .86)}" height="${f1(s * .28)}" rx="1" fill="${skin}"/>` : ''}
        <path d="M${f1(-h + s * .18)},${f1(-h + s * .2)} L${f1(-h + s * .62)},${f1(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// chopped herbs (coriander / parsley)
function xpeHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'], sy = 1 } = {}){
    const R = rng(p.id + 'xpeHb' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 1 + R();
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R(), r2 = rr * (.6 + R() * .6); return `${f1(cx + Math.cos(aa) * r2)},${f1(cy + Math.sin(aa) * r2)}`; });
        ds[i % cols.length] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// coriander leaf: three rounded lobes
function xpeLeaf(p, x, y, s, r = 0, { c = '#3f8a2c' } = {}){
    const d = 'M0,8 C-1,5 -2,3 -3,2 C-7,4 -10,1 -8,-2 C-10,-5 -6,-8 -3,-6 C-3,-10 3,-10 3,-6 C6,-8 10,-5 8,-2 C10,1 7,4 3,2 C2,3 1,5 0,8Z';
    return `<g ${T(x, y, r, s / 20)}><path d="${d}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M0,7 L0,-6 M0,0 L-6,-3 M0,0 L6,-3" stroke="${lt(c, .4)}" stroke-width=".6" fill="none"/></g>`;
}
// lettuce leaf with frilly edge
function xpeLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468' } = {}){
    const R = rng(p.id + 'xpelt' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .08); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .46)},2 Q0,${f1(-s * .04)} ${f1(s * .44)},0" stroke="#eef8d8" stroke-width="${f1(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f1(s * t)},${f1(-s * .01)} q${f1(s * .08)},${f1(i % 2 ? s * .2 : -s * .2)} ${f1(s * .16)},${f1(i % 2 ? s * .24 : -s * .24)}" stroke="#e6f4c8" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}
// red onion: thin sliver (salsa criolla) — white flesh with a purple skin edge, slightly translucent
function xpeSliver(p, x, y, s, r = 0, { span = 1.5, w = null, pale = false } = {}){
    const R0 = s / 2, a0 = -Math.PI / 2 - span / 2, a1 = a0 + span, sw = w || Math.max(2.2, s * .12);
    const d = `M${f1(Math.cos(a0) * R0)},${f1(Math.sin(a0) * R0)}A${f1(R0)},${f1(R0 * .85)} 0 0 1 ${f1(Math.cos(a1) * R0)},${f1(Math.sin(a1) * R0)}`;
    const skin = pale ? '#c58ab0' : '#8e2f6c';
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${skin}" stroke-width="${f1(sw + 1.4)}" fill="none" stroke-linecap="round" opacity=".9"/><path d="${d}" stroke="#f7eef4" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round" opacity=".95"/><path d="${d}" stroke="#fff" stroke-width="${f1(sw * .3)}" fill="none" stroke-linecap="round" opacity=".8" transform="translate(-.3 -.4)"/></g>`;
}
// red onion: thick wedge for lomo saltado (crescent layers, purple rims, lightly cooked)
function xpeRedOnion(p, x, y, s, r = 0, { layers = 2 } = {}){
    const k = s / 20;
    let out = '';
    for (let i = 0; i < layers; i++){
        const o = i * 2.4, R1 = 10 - o, R2 = 7.4 - o;
        out += `<path d="M${-R1},${2 + o * .6} A${R1},${R1 * .82} 0 0 1 ${R1},${2 + o * .6} L${R2},${2.6 + o * .6} A${R2},${R2 * .72} 0 0 0 ${-R2},${2.6 + o * .6}Z" fill="${p.g(i ? '#f2e2ec' : '#e8cfe0', .3, .15)}" stroke="#8e2f6c" stroke-width="1" opacity=".92"/>`;
    }
    return `<g ${T(x, y, r, k)}>${out}<path d="M-7.5,-.5 A8.5,7 0 0 1 -1,-5.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// strip of ají amarillo (yellow-orange, slightly curved) or red pepper
function xpeBand(p, x, y, L, W, r = 0, { c = '#f0a21e', bend = .2, hi = true } = {}){
    const d = `M${f1(-L / 2)},0 Q0,${f1(-L * bend)} ${f1(L / 2)},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#2b1607" stroke-width="${f1(W + 1)}" fill="none" stroke-linecap="round" opacity=".2" transform="translate(1 1.4)"/><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(W + 1.2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${W}" fill="none" stroke-linecap="round"/>
        ${hi ? `<path d="M${f1(-L * .36)},${f1(-W * .22 - L * bend * .28)} Q0,${f1(-L * bend * .5 - W * .25)} ${f1(L * .3)},${f1(-W * .22 - L * bend * .2)}" stroke="${lt(c, .55)}" stroke-width="${f1(Math.max(.8, W * .22))}" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}</g>`;
}
// thin beef strip (seared, glossy)
function xpeBeef(p, x, y, s, r = 0, { c = '#7d4326', seed = 1 } = {}){
    const R = rng(p.id + 'xpeBf' + seed + x + y);
    const folds = Array.from({ length: 3 }, (_, i) => `M${f1(-8 + i * 8 + (R() - .5) * 4)},${f1(-5 + R() * 2)} q${f1((R() - .5) * 5)},5 ${f1((R() - .5) * 3)},${f1(9 + R() * 2)}`).join('');
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.6)}><path d="${xpeSm(ring(14, 15, .3, R, 1.15, .55), true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="${folds}" stroke="${dk(c, .42)}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M2,3 Q7,1.5 11,2.5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// beef chunk for stew (seco): rounded cube, dark braised brown
function xpeBeefChunk(p, x, y, s, r = 0, { c = '#6e3d22', seed = 1 } = {}){
    const R = rng(p.id + 'xpeBc' + seed + x + y);
    const pts = ring(s / 2, 8, .22, R, 1.1, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${xpeSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f1(-s * .3)},${f1(s * .05)} q${f1(s * .12)},${f1(-s * .1)} ${f1(s * .26)},0 t${f1(s * .22)},0 M${f1(-s * .2)},${f1(s * .22)} q${f1(s * .12)},${f1(-s * .08)} ${f1(s * .24)},0" stroke="${dk(c, .45)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M${f1(-s * .3)},${f1(-s * .22)} Q${f1(-s * .05)},${f1(-s * .38)} ${f1(s * .22)},${f1(-s * .26)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".3"/></g>`;
}
// french fries: thick golden sticks (a few, individually)
function xpeFry(p, x, y, L, W, r = 0, { c = '#f0c24a', seed = 1 } = {}){
    const R = rng(p.id + 'xpeFr' + seed + x + y);
    const t1 = -L * .3 + R() * L * .6, t2 = -L * .3 + R() * L * .6;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${L}" height="${W}" rx="${f1(W * .28)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <ellipse cx="${f1(t1)}" cy="${f1(W * .12)}" rx="${f1(2 + R() * 3)}" ry="${f1(W * .3)}" fill="#c98a28" opacity=".45"/><ellipse cx="${f1(t2)}" cy="${f1(-W * .1)}" rx="${f1(1.5 + R() * 2)}" ry="${f1(W * .22)}" fill="#c98a28" opacity=".35"/>
        <path d="M${f1(-L / 2 + 3)},${f1(-W * .22)} L${f1(L / 2 - 4)},${f1(-W * .22)}" stroke="#fff6d0" stroke-width="1.3" stroke-linecap="round" opacity=".75"/></g>`;
}
// slice of boiled yellow potato (peeled, round, waxy yellow)
function xpePotatoRound(p, x, y, s, r = 0, { c = '#f0cf6a', seed = 1 } = {}){
    const R = rng(p.id + 'xpePr' + seed + x + y);
    const pts = ring(s / 2, 9, .1, R, 1, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xpeSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="${xpeSm(pts.map(([a, b]) => [a * .72 - 1, b * .72 - 1]), true)}" fill="${lt(c, .18)}" opacity=".8"/>
        <path d="M${f1(-s * .3)},${f1(-s * .18)} Q${f1(-s * .1)},${f1(-s * .34)} ${f1(s * .14)},${f1(-s * .28)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// black botija olive (whole or half)
function xpeOlive(p, x, y, s, r = 0, { c = '#3a2630' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="${p.rg(c, .3, .25, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        <ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .14)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" fill="#fff" opacity=".7"/></g>`;
}
// green pea
function xpePea(p, x, y, s = 7){
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s / 2)}" fill="${p.rg('#6db043', .3, .25, .35, .32)}" stroke="#3f7a24" stroke-width=".5"/><circle cx="${f1(x - s * .18)}" cy="${f1(y - s * .2)}" r="${f1(s * .12)}" fill="#fff" opacity=".7"/>`;
}
// lime wedge
function xpeLime(p, x, y, s, r = 0, { c = '#5aa02e', flesh = '#c9e48a' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,2 A10,9 0 0 1 10,2 Q0,5 -10,2Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-8.4,2 A8.4,7.2 0 0 1 8.4,2 Q0,4 -8.4,2Z" fill="${flesh}"/>
        ${[-50, -25, 0, 25, 50].map(a => `<path transform="rotate(${a} 0 2)" d="M0,2 L0,-4" stroke="#f2f8d8" stroke-width=".8"/>`).join('')}
        <path d="M-6,-3.5 Q0,-6.5 5,-4.5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// shredded chicken (fibres)
function xpeShred(p, x, y, s, { n = 14, seed = 1, cols = ['#f3e2bf', '#e2c48f'], ol = '#b8915c' } = {}){
    const R = rng(p.id + 'xpeSh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .7, a = R() * Math.PI, L = s * (.25 + R() * .3), b = (R() - .5) * L * .5;
        ds[i % cols.length] += `M${f1(cx - Math.cos(a) * L / 2)},${f1(cy - Math.sin(a) * L / 2)}q${f1(Math.cos(a) * L / 2 - Math.sin(a) * b)},${f1(Math.sin(a) * L / 2 + Math.cos(a) * b)} ${f1(Math.cos(a) * L)},${f1(Math.sin(a) * L)}`;
    }
    return `<g ${p.sh(.5)}><g ${xpeOutline(p, ol, .45)} fill="none" stroke-linecap="round">${cols.map((c, i) => `<path d="${ds[i]}" stroke="${c}" stroke-width="2.6"/>`).join('')}</g></g>`;
}
// chicken drumstick / leg, braised (bone to the right)
function xpeDrumstick(p, x, y, s, r = 0, { c = '#c8863c' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae8c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <ellipse cx="-8" cy="3" rx="5" ry="3" fill="#8a4a16" opacity=".3"/><ellipse cx="2" cy="-4" rx="3.6" ry="2" fill="#8a4a16" opacity=".25"/>
        <path d="M-16,-5 Q-10,-11 -2,-9.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// chunk of chicken (soup), pale cooked
function xpeChickenChunk(p, x, y, s, r = 0, { c = '#e6c48e', seed = 1 } = {}){
    const R = rng(p.id + 'xpeCk' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.2, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xpeSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .3)},0 q${f1(s * .15)},${f1(-s * .08)} ${f1(s * .3)},0 t${f1(s * .25)},0 M${f1(-s * .22)},${f1(s * .16)} q${f1(s * .15)},${f1(-s * .06)} ${f1(s * .3)},0" stroke="${dk(c, .25)}" stroke-width=".6" fill="none" opacity=".55" stroke-linecap="round"/>
        <path d="M${f1(-s * .28)},${f1(-s * .2)} Q${f1(-s * .05)},${f1(-s * .34)} ${f1(s * .2)},${f1(-s * .24)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// white fish piece (sudado): pale flaky flesh, slightly translucent sauce tint
function xpeFish(p, x, y, w, h, r = 0, { seed = 1, c = '#f4e6d0' } = {}){
    const R = rng(p.id + 'xpeFi' + seed);
    const pts = ring(1, 13, .12, R, w / 2, h / 2);
    let fl = '';
    for (let i = 0; i < 5; i++){ const lx = -w * .36 + i * w * .18; fl += `<path d="M${f1(lx)},${f1(-h * .38)} Q${f1(lx + w * .08)},0 ${f1(lx - w * .02)},${f1(h * .38)}" stroke="${dk(c, .18)}" stroke-width="1" fill="none" opacity=".7"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xpeSm(pts, true)}" fill="${p.g(c, .25, .22)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>${fl}
        <path d="M${f1(-w * .34)},${f1(-h * .26)} Q${f1(-w * .1)},${f1(-h * .44)} ${f1(w * .2)},${f1(-h * .34)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// slice of fried ripe plantain: long oval, deep golden, caramelised dark edges and spots
function xpePlantain(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xpePl' + seed);
    const pts = ring(1, 14, .06, R, L / 2, W / 2).map(([a, b]) => [a, b * (1 - Math.abs(a) / L * .25)]);
    let sp = '';
    for (let i = 0; i < 6; i++) sp += `<ellipse cx="${f1((R() - .5) * L * .7)}" cy="${f1((R() - .5) * W * .5)}" rx="${f1(2.5 + R() * 5)}" ry="${f1(1.5 + R() * 2.5)}" fill="#8f4a12" opacity="${f1(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xpeSm(pts, true)}" fill="${p.g('#d97a1c', .3, .35)}" stroke="#7a3a0c" stroke-width=".9"/></g>
        <path d="${xpeSm(pts.map(([a, b]) => [a * .84, b * .78]), true)}" fill="${p.rg('#f0a032', .3, .15, .4, .36)}"/>
        <g ${xpeBlur(p, 1.6)}>${sp}<path d="${xpeSm(pts.map(([a, b]) => [a * .96, b * .92]), true)}" fill="none" stroke="#9a4a10" stroke-width="4" opacity=".7"/></g>
        <path d="M${f1(-L * .36)},${f1(-W * .22)} Q${f1(-L * .1)},${f1(-W * .46)} ${f1(L * .22)},${f1(-W * .3)}" stroke="#fff6d8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// piece of choclo (large pale kernels) — cylinder seen from above, cut ends show the white core
function xpeChoclo(p, x, y, L, W, r = 0){
    const pid = p.def('xpechoclopat', id => `<pattern id="${id}" width="9.4" height="8.6" patternUnits="userSpaceOnUse" patternTransform="translate(0 1)"><rect x=".6" y=".6" width="8.2" height="7.4" rx="2.6" fill="#f3e4a2" stroke="#c9ae5a" stroke-width=".7"/><ellipse cx="3.6" cy="3" rx="2.2" ry="1.4" fill="#fffbe4" opacity=".85"/></pattern>`);
    const gid = p.def('xpechoclograd', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#7a5a08" stop-opacity=".12"/><stop offset="1" stop-color="#6a4a08" stop-opacity=".5"/></linearGradient>`);
    const body = `M${f1(-L / 2)},${f1(-W / 2 + 2)} L${f1(L / 2)},${f1(-W / 2 + 2)} Q${f1(L / 2 + 2)},0 ${f1(L / 2)},${f1(W / 2 - 2)} L${f1(-L / 2)},${f1(W / 2 - 2)} Q${f1(-L / 2 - 2)},0 ${f1(-L / 2)},${f1(-W / 2 + 2)}Z`;
    const end = ex => `<ellipse cx="${f1(ex)}" cy="0" rx="${f1(W * .13)}" ry="${f1(W / 2 - 2.4)}" fill="${p.rg('#f8f0d2', .15, .15)}" stroke="#c9ae5a" stroke-width="1"/><ellipse cx="${f1(ex)}" cy="0" rx="${f1(W * .06)}" ry="${f1(W * .22)}" fill="#e8dcae"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${body}" fill="#e2cf86"/></g><path d="${body}" fill="url(#${pid})"/><path d="${body}" fill="url(#${gid})" stroke="#b8963c" stroke-width=".9"/>
        ${end(-L / 2 + W * .13)}${end(L / 2 - W * .13)}
        <path d="M${f1(-L * .34)},${f1(-W * .3)} L${f1(L * .3)},${f1(-W * .3)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/></g>`;
}
// slab of queso fresco (white, soft, a few small holes)
function xpeQueso(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xpeQs' + seed);
    let holes = '';
    for (let i = 0; i < 5; i++) holes += `<circle cx="${f1((R() - .5) * w * .7)}" cy="${f1((R() - .5) * h * .6)}" r="${f1(.6 + R() * .9)}" fill="#ddd4c0" opacity=".8"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${w}" height="${h}" rx="${f1(Math.min(w, h) * .16)}" fill="${p.g('#fbf8ee', .2, .16)}" stroke="#d2c9b2" stroke-width=".8"/></g>
        <rect x="${f1(-w / 2 + 2)}" y="${f1(h / 2 - 5)}" width="${w - 4}" height="3" rx="1.2" fill="#e8e0cc" opacity=".8"/>${holes}
        <path d="M${f1(-w * .36)},${f1(-h * .3)} L${f1(w * .2)},${f1(-h * .3)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/></g>`;
}
// slice of toasted bread (half, triangle)
function xpeToast(p, x, y, s, r = 0){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}><path d="M-14,-12 Q-15,-15 -12,-15 L13,-15 Q15,-15 15,-12 L15,12 Q15,15 12,15 Z" fill="${p.g('#d9a04a', .3, .3)}" stroke="#9a6224" stroke-width=".9"/></g>
        <path d="M-10,-11 L11,-11 L11,10 Z" fill="${p.rg('#f0d59a', .2, .12, .4, .4)}"/>
        <g ${xpeBlur(p, 1.4)}><ellipse cx="3" cy="-3" rx="6" ry="4" fill="#c27a22" opacity=".45"/><ellipse cx="6" cy="4" rx="3" ry="2.6" fill="#b06818" opacity=".4"/></g>
        <circle cx="-3" cy="-6" r="1" fill="#e0c080" opacity=".8"/><circle cx="4" cy="2" r="1.2" fill="#e0c080" opacity=".8"/></g>`;
}
// poached egg in soup: soft white with a domed yolk
function xpePoached(p, x, y, s, r = 0){
    const R = rng(p.id + 'xpePo' + x);
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.8)}><path d="${smooth(ring(19, 11, .26, R, 1.1, .9))}" fill="${p.rg('#fffdf6', .08, .1)}" stroke="#e5dccb" stroke-width=".9"/></g>
        <circle cx="1" cy="0" r="9" fill="${p.rg('#f6a81c', .3, .18, .35, .32)}" stroke="#d9890f" stroke-width=".8"/>
        <ellipse cx="-2" cy="-3" rx="3.4" ry="2" fill="#fff" opacity=".75"/></g>`;
}
// avocado slice (crescent): dark skin edge, green-yellow flesh
function xpeAvocado(p, x, y, s, r = 0){
    const k = s / 20;
    const gid = p.def('xpeavo', id => `<radialGradient id="${id}" cx=".5" cy=".95" r=".9"><stop offset="0" stop-color="#f3eba0"/><stop offset=".55" stop-color="#d8dc78"/><stop offset="1" stop-color="#8fb43a"/></radialGradient>`);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,4 C-10,-6 -4,-9 0,-9 C4,-9 10,-6 10,4 Q0,6.5 -10,4Z" fill="#2f4a14"/></g>
        <path d="M-9,3.6 C-9,-5 -3.6,-8 0,-8 C3.6,-8 9,-5 9,3.6 Q0,5.6 -9,3.6Z" fill="url(#${gid})"/>
        <path d="M-5.5,-3 Q-1,-6.6 4,-5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// hard-boiled egg slice
function xpeEggSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .44)}" fill="${p.rg('#fffdf6', .1, .12)}" stroke="#d8d0bf" stroke-width=".6"/></g><circle r="${f1(s * .24)}" fill="${p.rg('#f6c23a', .25, .15)}"/><ellipse cx="${f1(-s * .22)}" cy="${f1(-s * .18)}" rx="${f1(s * .1)}" ry="${f1(s * .05)}" fill="#fff" opacity=".7"/></g>`;
}
// dollop of mayonnaise
function xpeMayo(p, x, y, s, seed = 1){
    const R = rng(p.id + 'xpeMy' + seed + x);
    return `<g ${p.sh(.5)}><path ${T(x, y)} d="${smooth(ring(s / 2, 8, .3, R, 1.2, .8))}" fill="${p.rg('#fffbef', .15, .1)}" stroke="#e6dcc4" stroke-width=".5"/></g><path d="M${f1(x - s * .3)},${f1(y - s * .1)} Q${f1(x - s * .05)},${f1(y - s * .34)} ${f1(x + s * .2)},${f1(y - s * .2)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
}

// ---------- vessels ----------
// everyday white Peruvian plate with a coloured line (varied per dish)
const xpePlate = (p, rim = '#2f7a52', o = {}) => K.plate(p, { rim, ...o });
// deep white soup bowl with a coloured band (sopero)
function xpeSoupBowl(p, { band = '#2f7a52', inside = '#fbf8f1' } = {}){
    return K.bowl(p, { glaze: '#f4efe6', inside }) + `<circle cx="100" cy="100" r="83" fill="none" stroke="${band}" stroke-width="1.8" opacity=".85"/><circle cx="100" cy="100" r="88" fill="none" stroke="${band}" stroke-width=".8" opacity=".6"/>`;
}

// =========================================================
// extra helpers for the redraw (xpe)
// =========================================================
// terracotta clay cazuela; optional ring of painted dots on the rim
function xpeClay(p, { R = 93, c = '#b25a30', inside = null, dots = '#f1d9a8' } = {}){
    const r = R * .85;
    let dd = '';
    if (dots) for (let i = 0; i < 30; i++){ const a = i / 30 * 6.28; dd += `<circle cx="${f1(100 + Math.cos(a) * (R - 6.5))}" cy="${f1(100 + Math.sin(a) * (R - 6.5))}" r="1.5" fill="${dots}" opacity=".85"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .22, .3, .35, .3)}"/></g>${dd}
        <circle cx="100" cy="100" r="${f1(r + 1.5)}" fill="none" stroke="${dk(c, .35)}" stroke-width="2.4" opacity=".6"/>
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside || dk(c, .15), .1, .3, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .84)},${f1(R * .84)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .79)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// deep white plate (plato hondo) with a coloured line: wide well with a soft inner shadow
function xpeDeep(p, rim = '#2f5f9a'){
    return K.plate(p, { rim, well: .8 }) + `<circle cx="100" cy="100" r="74" fill="none" stroke="#b9ae98" stroke-width="5" opacity=".18"/>`;
}
// white enamel bowl (enlozado) with a dark blue rim
function xpeEnamel(p, { rim = '#1f4f8f', inside = '#f7f5ef' } = {}){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="93" fill="${p.rg('#f4f2ec', .2, .16, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="91" fill="none" stroke="${rim}" stroke-width="4"/>
        <circle cx="100" cy="100" r="80" fill="${p.rg(inside, .1, .24, .62, .64)}"/>
        <circle cx="100" cy="100" r="80" fill="none" stroke="#c9c4b6" stroke-width="1" opacity=".7"/>
        <path d="M34,62 A78,78 0 0 1 76,26" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// dark seafood pan with two handles (paellera)
function xpePan(p){
    return `<g ${p.sh(1.8)}><rect x="2" y="90" width="22" height="20" rx="8" fill="#2e2a28"/><rect x="176" y="90" width="22" height="20" rx="8" fill="#2e2a28"/><circle cx="100" cy="100" r="86" fill="${p.rg('#3d3836', .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="78" fill="${p.rg('#2a2523', .08, .2, .6, .62)}"/>
        <path d="M36,64 A76,76 0 0 1 72,32" stroke="#8a8480" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// small bowl of sauce (side dip)
function xpeDip(p, x, y, R, c, { rim = '#f2eee6' } = {}){
    return `<g ${p.sh(1)}><circle cx="${x}" cy="${y}" r="${R}" fill="${p.rg(rim, .2, .2, .35, .3)}"/></g><circle cx="${x}" cy="${y}" r="${f1(R * .78)}" fill="${p.rg(c, .25, .25, .4, .38)}"/>
        <path d="M${f1(x - R * .5)},${f1(y - R * .2)} Q${f1(x - R * .3)},${f1(y - R * .55)} ${f1(x + R * .1)},${f1(y - R * .5)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// big choclo kernel (Andean white corn), loose
function xpeKernel(p, x, y, s, r = 0, { c = '#f1e2a0' } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)}><path d="M${f1(-h)},${f1(-h * .6)} Q${f1(-h)},${f1(-h)} ${f1(-h * .5)},${f1(-h)} L${f1(h * .5)},${f1(-h)} Q${f1(h)},${f1(-h)} ${f1(h)},${f1(-h * .6)} L${f1(h * .8)},${f1(h * .7)} Q0,${f1(h * 1.1)} ${f1(-h * .8)},${f1(h * .7)}Z" fill="${p.g(c, .4, .22)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        <ellipse cx="${f1(-h * .25)}" cy="${f1(-h * .35)}" rx="${f1(h * .35)}" ry="${f1(h * .22)}" fill="#fff" opacity=".7"/></g>`;
}
// toasted cancha kernel: golden-brown, split, scorched spots, pale germ tip
function xpeCancha(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xpeCa' + seed + x + y), h = s / 2;
    const c = R() < .5 ? '#d9a240' : '#e3b250';
    return `<g ${T(x, y, r)}><path d="M0,${f1(-h)} C${f1(h * .9)},${f1(-h)} ${f1(h)},${f1(h * .2)} ${f1(h * .45)},${f1(h * .95)} Q0,${f1(h * 1.1)} ${f1(-h * .45)},${f1(h * .95)} C${f1(-h)},${f1(h * .2)} ${f1(-h * .9)},${f1(-h)} 0,${f1(-h)}Z" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .45)}" stroke-width=".6"/>
        <ellipse cx="${f1((R() - .5) * h * .6)}" cy="${f1(h * .2)}" rx="${f1(h * .3)}" ry="${f1(h * .22)}" fill="#7a3e10" opacity="${f1(.3 + R() * .3)}"/>
        <path d="M0,${f1(h * .9)} L0,${f1(h * .35)}" stroke="#f6e7c0" stroke-width="${f1(h * .28)}" stroke-linecap="round"/>
        ${R() < .6 ? `<path d="M${f1(-h * .15)},${f1(-h * .7)} L${f1(h * .1)},${f1(-h * .1)}" stroke="#fbf0d4" stroke-width="1.1" stroke-linecap="round"/>` : ''}
        <ellipse cx="${f1(-h * .35)}" cy="${f1(-h * .45)}" rx="${f1(h * .2)}" ry="${f1(h * .12)}" fill="#fff" opacity=".6"/></g>`;
}
// bean-shaped pulse: fava (green), pallar (large cream lima), canary bean (small yellow)
function xpePulse(p, x, y, s, r = 0, { c = '#8cc35a', eye = '#5f8a2c', flat = .62 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)}><path d="M${f1(-h)},0 C${f1(-h)},${f1(-h * flat * 1.1)} ${f1(h)},${f1(-h * flat * 1.1)} ${f1(h)},0 C${f1(h)},${f1(h * flat)} ${f1(h * .2)},${f1(h * flat)} 0,${f1(h * flat * .55)} C${f1(-h * .2)},${f1(h * flat)} ${f1(-h)},${f1(h * flat)} ${f1(-h)},0Z" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        <path d="M${f1(-h * .15)},${f1(h * flat * .5)} q${f1(h * .15)},${f1(-h * .15)} ${f1(h * .3)},0" stroke="${eye}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>
        <ellipse cx="${f1(-h * .35)}" cy="${f1(-h * flat * .45)}" rx="${f1(h * .3)}" ry="${f1(h * .14)}" fill="#fff" opacity=".65"/></g>`;
}
// fried yuca stick: thick, pale gold with crisp golden ridges
function xpeYuca(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xpeYu' + seed + x + y);
    const pts = [[-L / 2, -W / 2 + 1], [-L / 6, -W / 2 - .5], [L / 6, -W / 2 + .5], [L / 2, -W / 2], [L / 2 + 1, W / 2 - 1], [L / 6, W / 2 + .5], [-L / 6, W / 2], [-L / 2 - 1, W / 2]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 1.5]);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${xpeSm(pts, true)}" fill="${p.g('#efcb72', .35, .3)}" stroke="#b9862c" stroke-width=".8"/></g>
        <path d="M${f1(-L * .4)},${f1(W * .05)} L${f1(L * .38)},${f1(W * .1)}" stroke="#f8e6b0" stroke-width="${f1(W * .32)}" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="${f1((R() - .5) * L * .5)}" cy="${f1(W * .25)}" rx="${f1(L * .15)}" ry="${f1(W * .15)}" fill="#c98a28" opacity=".45"/>
        <path d="M${f1(-L * .38)},${f1(-W * .28)} L${f1(L * .3)},${f1(-W * .3)}" stroke="#fffbe8" stroke-width="1.2" stroke-linecap="round" opacity=".85"/></g>`;
}
// round slice of sweet potato (camote): orange, optionally fried (darker rim)
function xpeCamote(p, x, y, s, r = 0, { fried = false, seed = 1 } = {}){
    const R = rng(p.id + 'xpeCm' + seed + x + y);
    const pts = ring(s / 2, 10, .08, R, 1, .86);
    const c = fried ? '#e9822a' : '#f3963a';
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${xpeSm(pts, true)}" fill="${p.g(c, .3, .3)}" stroke="${fried ? '#9a4a12' : '#c0661e'}" stroke-width="${fried ? 1.6 : .8}"/></g>
        <path d="${xpeSm(pts.map(([a, b]) => [a * .74, b * .74]), true)}" fill="${lt(c, .16)}" opacity=".75"/>
        ${fried ? `<ellipse cx="${f1(s * .1)}" cy="${f1(s * .12)}" rx="${f1(s * .2)}" ry="${f1(s * .1)}" fill="#a8521a" opacity=".3"/>` : ''}
        <path d="M${f1(-s * .3)},${f1(-s * .14)} Q${f1(-s * .12)},${f1(-s * .32)} ${f1(s * .14)},${f1(-s * .27)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// cube of lime-cured fish (ceviche): opaque white, soft edges
function xpeFishCube(p, x, y, s, r = 0, { seed = 1, c = '#f8f3ea' } = {}){
    const R = rng(p.id + 'xpeFc' + seed + x + y);
    const pts = ring(s / 2, 6, .25, R, 1.1, .95, R());
    return `<g ${T(x, y, r)}><path d="${xpeSm(pts, true)}" fill="${p.g(c, .3, .2)}" stroke="#cfc6b6" stroke-width=".7"/>
        <path d="M${f1(-s * .2)},${f1(-s * .3)} q${f1(s * .1)},${f1(s * .3)} 0,${f1(s * .6)}" stroke="#e6dccd" stroke-width=".9" fill="none" opacity=".8"/>
        <path d="M${f1(-s * .3)},${f1(-s * .2)} Q${f1(-s * .1)},${f1(-s * .38)} ${f1(s * .18)},${f1(-s * .3)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// mussel in its half shell (choro): blue-black shell, pearly lip, orange meat
function xpeMussel(p, x, y, s, r = 0, { meat = '#ef9a48', open = true } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-15,0 C-15,-7 -6,-10 4,-9 C11,-8 15,-4 15,0 C15,4 11,8 4,9 C-6,10 -15,7 -15,0Z" fill="${p.g('#2c3446', .3, .25)}" stroke="#151a24" stroke-width=".8"/></g>
        ${open ? `<path d="M-12.5,0 C-12.5,-5.5 -5,-7.6 3.5,-7 C9,-6 12.5,-3 12.5,0 C12.5,3 9,6 3.5,7 C-5,7.6 -12.5,5.5 -12.5,0Z" fill="#c9c6cf"/>
        <path d="M-10.5,0 C-10.5,-4.5 -4,-6.2 3,-5.6 C7.5,-5 10.5,-2.5 10.5,0 C10.5,2.5 7.5,5 3,5.6 C-4,6.2 -10.5,4.5 -10.5,0Z" fill="${p.g(meat, .3, .25)}" stroke="${dk(meat, .3)}" stroke-width=".5"/>
        <path d="M-8,-1 Q0,-3 8,-1" stroke="${dk(meat, .25)}" stroke-width=".8" fill="none" opacity=".6"/>` : `<path d="M-12,-2 Q0,-7 12,-2" stroke="#56607a" stroke-width="1" fill="none"/>`}
        <path d="M-11,-4 Q-4,-8 4,-7.4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// whole cooked shrimp with head (chupe, parihuela)
function xpeShrimp(p, x, y, s, r = 0, { c = '#ea6a3a' } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-6,-12 C4,-14 13,-7 12,3 C11,10 4,13 -2,11 L-2,7 C3,8 7,5 7,1 C7,-5 2,-8 -6,-7Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/>
        <path d="M-6,-12 C-12,-12 -15,-9 -14,-6 C-13,-4 -9,-5 -6,-7Z" fill="${p.g(dk(c, .1), .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="M-2,11 L-7,14 L-5,9 L-8,7 L-2,7Z" fill="${dk(c, .15)}"/></g>
        <path d="M-14,-8 Q-20,-14 -18,-20 M-13,-7 Q-21,-9 -24,-14" stroke="${dk(c, .2)}" stroke-width=".6" fill="none"/>
        <path d="M-1,-11 Q1,-8 -1,-6 M4,-10 Q5,-7 3,-5 M8,-6 Q8,-3 6,-2 M10,1 Q8,2 7,1" stroke="#fde1d3" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <circle cx="-11" cy="-9" r="1" fill="#2a1406"/></g>`;
}
// wonton dumpling in broth: pale wrapper with a frilly skirt and a pink filling knob
function xpeWonton(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xpeWt' + seed + x + y);
    const pts = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.28, rr = s / 2 * (i % 2 ? .82 : 1) * (.9 + R() * .2); return [Math.cos(a) * rr, Math.sin(a) * rr * .8]; });
    return `<g ${T(x, y, r)}><path d="${xpeSm(pts, true)}" fill="#f4ead0" opacity=".82" stroke="#d6c69c" stroke-width=".6"/>
        <path d="${xpeSm(pts.map(([a, b]) => [a * .6, b * .6]), true)}" fill="none" stroke="#e1d2ac" stroke-width=".8" opacity=".8"/>
        <g ${p.sh(.5)}><ellipse cx="0" cy="0" rx="${f1(s * .22)}" ry="${f1(s * .19)}" fill="${p.rg('#e7b8a0', .3, .25, .38, .34)}" stroke="#c9937a" stroke-width=".5"/></g>
        <ellipse cx="${f1(-s * .07)}" cy="${f1(-s * .07)}" rx="${f1(s * .07)}" ry="${f1(s * .04)}" fill="#fff" opacity=".8"/></g>`;
}
// honeycomb tripe piece (mondongo)
function xpeTripe(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xpeTr' + seed + x + y);
    const pid = p.def('xpeTripePat', id => `<pattern id="${id}" width="6" height="5.2" patternUnits="userSpaceOnUse"><path d="M0,2.6 L1.5,0 L4.5,0 L6,2.6 L4.5,5.2 L1.5,5.2Z" fill="none" stroke="#b8a37c" stroke-width=".7"/></pattern>`);
    const pts = ring(1, 9, .2, R, w / 2, h / 2);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xpeSm(pts, true)}" fill="${p.g('#ecdcb8', .3, .22)}" stroke="#a89068" stroke-width=".7"/></g><path d="${xpeSm(pts.map(([a, b]) => [a * .9, b * .86]), true)}" fill="url(#${pid})"/>
        <path d="M${f1(-w * .3)},${f1(-h * .2)} Q0,${f1(-h * .42)} ${f1(w * .25)},${f1(-h * .25)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// mote (big puffed white hominy kernel)
function xpeMote(p, x, y, s, r = 0){
    const h = s / 2;
    return `<g ${T(x, y, r)}><path d="M${f1(-h)},${f1(-h * .1)} C${f1(-h)},${f1(-h * 1.1)} ${f1(h)},${f1(-h * 1.1)} ${f1(h)},${f1(-h * .1)} C${f1(h)},${f1(h * .8)} ${f1(-h)},${f1(h * .8)} ${f1(-h)},${f1(-h * .1)}Z" fill="${p.g('#f8f3e2', .3, .2)}" stroke="#c9bd9a" stroke-width=".6"/>
        <path d="M0,${f1(-h * .6)} L0,${f1(h * .3)}" stroke="#ddd0aa" stroke-width="1" stroke-linecap="round"/><ellipse cx="${f1(-h * .35)}" cy="${f1(-h * .35)}" rx="${f1(h * .22)}" ry="${f1(h * .13)}" fill="#fff"/></g>`;
}
// pork / lamb chunk: rounded chunk with a band of fat (or a little bone)
function xpeMeat(p, x, y, s, r = 0, { c = '#a2552c', fat = '#f0d8a8', bone = false, seed = 1 } = {}){
    const R = rng(p.id + 'xpeMt' + seed + x + y);
    const pts = ring(s / 2, 9, .22, R, 1.12, .88);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${xpeSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        ${fat ? `<path d="${xpeSm(pts.slice(5, 9).map(([a, b]) => [a * .86, b * .86]))}" stroke="${fat}" stroke-width="${f1(s * .1)}" fill="none" stroke-linecap="round" opacity=".9"/>` : ''}
        ${bone ? `<g ${T(s * .34, -s * .1, 20)}><rect x="${f1(-s * .1)}" y="${f1(-s * .11)}" width="${f1(s * .34)}" height="${f1(s * .22)}" rx="${f1(s * .1)}" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae8c" stroke-width=".6"/></g>` : ''}
        <path d="M${f1(-s * .25)},${f1(s * .05)} q${f1(s * .12)},${f1(-s * .08)} ${f1(s * .24)},0 t${f1(s * .2)},0" stroke="${dk(c, .45)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M${f1(-s * .3)},${f1(-s * .2)} Q${f1(-s * .05)},${f1(-s * .38)} ${f1(s * .22)},${f1(-s * .26)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// cream swirl on a soup
function xpeSwirl(cx, cy, R, c = '#fff7ea', { w = 3, op = .9 } = {}){
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i * .55, rr = R * (1 - i / 24); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .9]; });
    return `<path d="${xpeSm(pts)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// fat droplets on a broth
function xpeOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .7, rmax = 3 } = {}){
    const R = rng(p.id + 'xpeOil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// fluffy egg ribbon (egg drop)
function xpeEggCloud(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c' } = {}){
    const R = rng(p.id + 'xpeEc' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)}><g ${p.rough(4, .14)}><path d="${smooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// toasted bread crouton
function xpeCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f1(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f1(-s / 2 + s * .18)}" y="${f1(-s / 2 + s * .18)}" width="${f1(s * .5)}" height="${f1(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
// pak choi half: green leaf with a pale spoon-shaped stem
function xpeBokChoy(p, x, y, s, r = 0, { cooked = true } = {}){
    const k = s / 40, g = cooked ? '#4f9638' : '#5aa63c';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-2,-4 C-12,-16 -6,-20 4,-19 C14,-18 16,-10 8,-2Z" fill="${p.g(g, .3, .3)}" stroke="${dk(g, .3)}" stroke-width=".7"/>
        <path d="M-3,-5 C-6,4 -5,14 0,18 C5,14 7,4 7,-3 Q2,-7 -3,-5Z" fill="${p.g('#e9f2cf', .25, .2)}" stroke="#a8bd84" stroke-width=".7"/></g>
        <path d="M2,-3 L3,-17 M3,-10 L-4,-15 M3,-12 L10,-15" stroke="${lt(g, .35)}" stroke-width=".9" fill="none" opacity=".8"/>
        <path d="M0,-2 Q-1,8 1,15" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// cauliflower floret
function xpeCauli(p, x, y, s, r = 0){
    const R = rng(p.id + 'xpeCf' + x + y), k = s / 20;
    let b = '';
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.28, d = i === 0 ? 0 : 4.5; b += `<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d - 1)}" r="${f1(3.8 + R())}" fill="${i % 2 ? '#f6efd8' : '#efe5c6'}" stroke="#cdbd8f" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-2.5,4 L-3,10 Q0,11.5 3,10 L2.5,4Z" fill="#e2e8c4" stroke="#b8bf8c" stroke-width=".5"/>${b}</g><circle cx="-3" cy="-4" r="1.6" fill="#fff" opacity=".8"/></g>`;
}
// raisin / almond
function xpeRaisin(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="${p.g('#5a2a3a', .25, .2)}" stroke="#2e1420" stroke-width=".5"/><path d="M${f1(-s * .25)},0 q${f1(s * .2)},${f1(-s * .2)} ${f1(s * .45)},0" stroke="#8a4a5a" stroke-width=".7" fill="none"/></g>`;
}
function xpeAlmond(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${f1(-s / 2)},0 C${f1(-s * .3)},${f1(-s * .32)} ${f1(s * .3)},${f1(-s * .3)} ${f1(s / 2)},0 C${f1(s * .3)},${f1(s * .3)} ${f1(-s * .3)},${f1(s * .32)} ${f1(-s / 2)},0Z" fill="${p.g('#e8c88e', .3, .3)}" stroke="#a87a3a" stroke-width=".5"/><path d="M${f1(-s * .3)},${f1(-s * .06)} L${f1(s * .3)},${f1(-s * .06)}" stroke="#fff" stroke-width=".8" opacity=".6"/></g>`;
}
// ají limo / rocoto ring
function xpeChiliRing(p, x, y, s, { c = '#d9301c' } = {}){
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s / 2)}" fill="none" stroke="${dk(c, .25)}" stroke-width="${f1(s * .3)}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s / 2)}" fill="none" stroke="${c}" stroke-width="${f1(s * .22)}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s * .15)}" fill="#f6e3a8"/>`;
}
// breaded / fried cutlet outline with crumb texture
function xpeBreaded(p, x, y, w, h, r = 0, { c = '#d39a44', seed = 1 } = {}){
    const R = rng(p.id + 'xpeBr' + seed);
    const pts = ring(1, 14, .16, R, w / 2, h / 2);
    let spots = '';
    for (let i = 0; i < 7; i++) spots += `<ellipse cx="${f1((R() - .5) * w * .7)}" cy="${f1((R() - .5) * h * .6)}" rx="${f1(3 + R() * 6)}" ry="${f1(2 + R() * 4)}" fill="#9a5a1a" opacity="${f1(.15 + R() * .2)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.crumb(.8)}><path d="${xpeSm(pts, true)}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .4)}" stroke-width=".9"/></g></g>
        <g ${xpeBlur(p, 1.4)}>${spots}</g>
        <path d="M${f1(-w * .32)},${f1(-h * .24)} Q${f1(-w * .05)},${f1(-h * .44)} ${f1(w * .26)},${f1(-h * .3)}" stroke="#fff3d6" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// salsa criolla heap (red onion slivers + ají strips + coriander)
function xpeCriolla(p, x, y, rx, ry, { n = 9, seed = 'c' } = {}){
    const R = rng(p.id + 'xpeCr' + seed);
    return `<g ${p.sh(.5)}>` + xpeSpots(p.id + seed, n, rx, ry, 6, x, y).map(([sx, sy, r], i) => xpeSliver(p, sx, sy, 16 + R() * 6, r, { pale: i % 3 === 0 })).join('') + `</g>`
        + xpeBand(p, x - rx * .3, y, 11, 3, 20, { c: '#f0a21e', bend: .1 }) + xpeBand(p, x + rx * .3, y + ry * .2, 10, 3, -40, { c: '#f0a21e', bend: .1 })
        + xpeHerbs(p, x, y, Math.max(rx, ry) * 1.6, { n: 6 });
}
// noodles drifting under a clear broth (curved strands, slightly translucent)
function xpeBrothNoodles(p, R0, { c = '#f4dc98', w = 3, n = 30, seed = 1 } = {}){
    const R = rng(p.id + 'xpeBn' + seed);
    let nd = '';
    for (let i = 0; i < n; i++){
        const rr = 8 + Math.sqrt(R()) * (R0 - 10), a0 = R() * 6.28, sweep = .9 + R() * 1.8;
        const pts = Array.from({ length: 6 }, (_, j) => { const a = a0 + j / 5 * sweep, rj = rr * (1 + (R() - .5) * .2); return [100 + Math.cos(a) * rj, 100 + Math.sin(a) * rj]; });
        nd += xpeSm(pts);
    }
    return `<path d="${nd}" stroke="${dk(c, .3)}" stroke-width="${f1(w + 1)}" fill="none" stroke-linecap="round" opacity=".45"/><path d="${nd}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".9"/>`;
}

// =========================================================
export default {
    // Pollo al horno: cream oval dish, two chicken legs roasted deep red-brown in ají panca and soy, roast potatoes and sweet potato in the pan juices, lime, parsley
    pe_pollo_horno: p => [
        K.ovalDish(p, { rx: 96, ry: 78, rim: '#b8541f' }),
        K.pool(p, 100, 102, 140, '#8a3414', { op: .85, seed: 1, sy: .76 }),
        `<g ${p.sh(.9)}>`,
        K.potato(p, 46, 92, 34, 20, { c: '#e2ac4e', seed: 1 }), K.potato(p, 60, 128, 32, -30, { c: '#e2ac4e', seed: 2 }), K.potato(p, 150, 70, 32, 40, { c: '#e2ac4e', seed: 3 }), K.potato(p, 158, 112, 30, 0, { c: '#e2ac4e', seed: 4 }),
        xpeCamote(p, 128, 140, 32, 10, { fried: true, seed: 1 }), xpeCamote(p, 62, 62, 28, -10, { fried: true, seed: 2 }),
        `</g>`,
        `<g ${p.sh(1.3)}>`, xpeDrumstick(p, 102, 78, 96, -12, { c: '#a8461c' }), xpeDrumstick(p, 100, 118, 98, 168, { c: '#b04e1e' }), `</g>`,
        `<g ${xpeBlur(p, 1.2)}><ellipse cx="88" cy="80" rx="8" ry="4" fill="#5a1e08" opacity=".35"/><ellipse cx="116" cy="118" rx="9" ry="4" fill="#5a1e08" opacity=".35"/><ellipse cx="104" cy="70" rx="5" ry="3" fill="#5a1e08" opacity=".3"/></g>`,
        K.sprinkle(p, 100, 98, 70, { c: '#5a2a10', n: 18, r: .8 }),
        xpeLime(p, 154, 146, 26, -30),
        xpeHerbs(p, 104, 100, 100, { n: 14 }),
    ].join(''),

    // Arroz chaufa: red-rimmed plate, a moulded dome of soy-browned fried rice with egg pieces, chicken, red pepper and lots of spring onion
    pe_arroz_chaufa: p => [
        xpePlate(p, '#c8392e'),
        xpeRice(p, 100, 100, 152, { tint: '#c38a42', hiK: .45, density: .46, grain: 5, seed: 1 }),
        `<g ${p.sh(.5)}>`,
        ...xpeSpots('chf', 19, 62, 62, 15).map(([x, y, r], i) => { const t = i % 3; return t === 0 ? K.scrambled(p, x, y, 20, { n: 2, seed: i, c: '#f8cf3c' })
 : t === 1 ? xpeChickenChunk(p, x, y, 14, r, { seed: i, c: '#f0d6a8' }) : xpeDice(p, x, y, 6.5, r, '#d8341f'); }),
        `</g>`,
        ...xpeSpots('chs', 22, 64, 64, 10).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="3.2" ry="2" fill="#7fbf4a" stroke="#3f7a24" stroke-width=".7"/><ellipse rx="1.6" ry=".9" fill="#c9e8a0"/></g>`),
        `<path d="M50,88 Q60,56 92,46" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>`,
    ].join(''),

    // Tallarín saltado: plate heaped with soy-tossed egg noodles, seared beef strips, red onion and tomato wedges, ají, spring onion
    pe_tallarin_saltado: p => [
        xpePlate(p, '#2f5f9a'),
        K.pool(p, 100, 104, 140, '#6b3a1c', { op: .5, seed: 2, sy: .9 }),
        xpePasta(p, 100, 102, 146, { c: '#d6a24e', w: 3, n: 40, sy: .92, outline: '#8a5a22' }),
        `<g ${p.sh(.8)}>`,
        xpeBeef(p, 76, 78, 36, 20, { seed: 1 }), xpeBeef(p, 128, 72, 34, -30, { seed: 2 }), xpeBeef(p, 70, 124, 34, 60, { seed: 3 }), xpeBeef(p, 132, 128, 36, 10, { seed: 4 }), xpeBeef(p, 104, 100, 36, -10, { seed: 5 }),
        xpeRedOnion(p, 100, 72, 22, -20), xpeRedOnion(p, 140, 102, 22, 70, { layers: 1 }), xpeRedOnion(p, 92, 132, 20, 200), xpeRedOnion(p, 58, 100, 20, 120),
        K.tomatoWedge(p, 118, 88, 22, 30), K.tomatoWedge(p, 82, 104, 22, -120), K.tomatoWedge(p, 112, 140, 20, 160), K.tomatoWedge(p, 150, 126, 20, 70),
        xpeBand(p, 120, 116, 16, 4, -20), xpeBand(p, 86, 86, 14, 4, 50),
        `</g>`,
        K.glaze(p, 100, 100, 110, '#8a4416', { seed: 3, op: .16 }),
        ...xpeSpots('tss', 16, 56, 52, 10).map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-5" y="-1.6" width="10" height="3.2" rx="1.6" fill="${p.g('#5fa83a', .3, .2)}" stroke="#2f6a1e" stroke-width=".5"/></g>`),
    ].join(''),

    // Tallarines rojos: spaghetti coated in a red tomato and ají panca sauce, a chicken leg braised in it, mushrooms, carrot, grated cheese and parsley
    pe_tallarines_rojos: p => [
        xpePlate(p, '#d9a441'),
        K.pool(p, 100, 104, 140, '#b8321e', { op: .7, seed: 3, sy: .9 }),
        xpePasta(p, 100, 102, 144, { c: '#dc6a3a', w: 2.6, n: 48, sy: .92, outline: '#8e2a14' }),
        `<circle cx="100" cy="102" r="40" fill="#c03a22" opacity=".25"/>`,
        ...xpeSpots('trs', 12, 52, 50, 14).map(([x, y, r], i) => i % 2 ? xpeDice(p, x, y, 7, r, '#ef7f30') : `<g ${T(x, y, r)}><ellipse rx="5" ry="3.6" fill="${p.g('#7a4a2a', .3, .3)}" stroke="#4a2810" stroke-width=".5"/><path d="M-3,0 L3,0" stroke="#c9a07a" stroke-width="1"/></g>`),
        `<g ${p.sh(1.3)}>`, xpeDrumstick(p, 104, 92, 90, -28, { c: '#b8502a' }), `</g>`,
        `<path d="M78,92 Q90,80 106,82" stroke="#e05a32" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>`,
        K.sprinkle(p, 100, 104, 110, { c: '#fbf3dc', n: 40, r: 1.1 }),
        xpeHerbs(p, 100, 104, 100, { n: 12 }),
    ].join(''),

    // Estofado de pollo: deep plate of tomato-red stew with chicken pieces, yellow potato halves, carrot rounds and peas; white rice at the top
    pe_estofado: p => [
        xpeDeep(p, '#2f7a52'),
        K.liquid(p, { R: 70, c: '#c24f22', op: 1, shine: false }),
        `<circle cx="96" cy="96" r="44" fill="#d8683a" opacity=".35"/>`,
        xpeRice(p, 132, 66, 60, { seed: 2 }),
        `<g ${p.sh(1)}>`,
        xpeDrumstick(p, 82, 92, 80, 20, { c: '#c0622a' }),
        xpeChickenChunk(p, 118, 118, 36, 30, { seed: 1, c: '#c87a3a' }),
        xpePotatoRound(p, 62, 128, 30, 0, { seed: 1, c: '#f0c860' }), xpePotatoRound(p, 98, 142, 28, 20, { seed: 2, c: '#f0c860' }), xpePotatoRound(p, 148, 104, 26, 0, { seed: 3, c: '#f0c860' }),
        K.carrotRound(p, 54, 96, 15), K.carrotRound(p, 82, 122, 14), K.carrotRound(p, 138, 136, 15), K.carrotRound(p, 108, 96, 13), K.carrotRound(p, 66, 70, 13),
        `</g>`,
        ...xpeSpots('esp', 12, 58, 56, 11, 96, 106).map(([x, y]) => xpePea(p, x, y, 7)),
        `<path d="M50,96 C56,74 74,60 96,58" stroke="#f08a5a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
        xpeHerbs(p, 96, 108, 90, { n: 12 }),
    ].join(''),

    // Bistec apanado: a large thin breadcrumbed steak, white rice, a lettuce-tomato-onion salad and a lime wedge
    pe_bistec_apanado: p => [
        xpePlate(p, '#2f5f9a'),
        xpeRice(p, 142, 66, 58, { seed: 3, sy: 1.05 }),
        xpeLettuce(p, 150, 120, 60, 80, { seed: 1, c: '#9fd060' }),
        K.tomatoWedge(p, 154, 104, 22, 40), K.tomatoWedge(p, 146, 138, 22, -30),
        `<g ${p.sh(.4)}>`, xpeSliver(p, 158, 124, 18, -10), xpeSliver(p, 148, 116, 16, 60, { pale: true }), `</g>`,
        `<g ${p.sh(.8)}>`, xpeFry(p, 84, 152, 40, 8.5, -6, { seed: 1 }), xpeFry(p, 112, 148, 38, 8.5, -30, { seed: 2 }), xpeFry(p, 70, 140, 36, 8.5, 20, { seed: 3 }), xpeFry(p, 104, 160, 34, 8, 10, { seed: 4 }), `</g>`,
        xpeBreaded(p, 82, 94, 118, 92, -16, { seed: 1, c: '#b46e24' }),
        `<path d="M40,96 C46,74 60,62 80,58 M120,120 C112,132 96,138 80,138" stroke="#a8641e" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".35"/>`,
        xpeLime(p, 132, 158, 22, -20),
    ].join(''),

    // Arroz tapado: a moulded dome of white rice with a wedge cut out to show the savoury mince filling (olive, egg, raisins), a fried egg on top and fried plantain
    pe_arroz_tapado: p => [
        xpePlate(p, '#c8392e'),
        `<g ${p.sh(.9)}>`, xpePlantain(p, 150, 132, 60, 22, -50, { seed: 1 }), xpePlantain(p, 54, 140, 56, 21, 40, { seed: 2 }), `</g>`,
        xpeRice(p, 98, 96, 128, { seed: 4, density: .85, grain: 3.8 }),
        `<path d="M98,96 L162,96 A64,64 0 0 1 130,151Z" fill="${p.g('#6e3b1c', .25, .3)}" stroke="#4a2410" stroke-width=".8"/>`,
        xpeDots(p, 134, 116, 34, { cols: ['#7a4422', '#5e3218', '#8e5630'], n: 40, size: 3, len: .9, seed: 1 }),
        xpeRaisin(p, 128, 108, 6, 20), xpeRaisin(p, 146, 124, 6, -30), xpeOlive(p, 138, 106, 9, 20),
        `<g ${T(124, 126)}><ellipse rx="5" ry="4" fill="#fffdf6" stroke="#d8d0bf" stroke-width=".5"/><circle r="2.2" fill="#f6c23a"/></g>`,
        `<path d="M98,96 L162,96" stroke="#e9e3d4" stroke-width="2.4"/><path d="M98,96 L130,151" stroke="#e9e3d4" stroke-width="2.4"/>`,
        K.friedEgg(p, 78, 80, 56, -10),
        xpeHerbs(p, 92, 106, 30, { n: 4 }),
    ].join(''),

    // Papa rellena: two golden fried potato croquettes, one cut open showing the mince, egg and olive filling, with salsa criolla and lime
    pe_papa_rellena: p => [
        xpePlate(p, '#d9a441'),
        xpeLettuce(p, 152, 64, 60, 40, { seed: 1, c: '#9fd060' }),
        xpeBreaded(p, 76, 76, 108, 74, -30, { c: '#a8621e', seed: 1 }),
        `<g ${T(112, 124, -10)}><g ${p.sh(1.1)}><ellipse rx="52" ry="36" fill="${p.g('#c98634', .3, .3)}" stroke="#8a5420" stroke-width=".9"/></g>
            <ellipse rx="47" ry="31.5" fill="${p.rg('#f6ead0', .2, .12, .4, .38)}"/>
            <path d="M-32,0 C-32,-17 32,-17 32,0 C32,17 -32,17 -32,0Z" fill="${p.g('#7a4422', .25, .3)}"/>
            ${xpeDots(p, 0, 0, 54, { cols: ['#8a5430', '#5e3218', '#9a6436'], n: 44, size: 3, len: .9, seed: 2, sy: .5 })}
            <ellipse cx="-8" cy="-2" rx="7" ry="5.4" fill="#fffdf6" stroke="#d8d0bf" stroke-width=".5"/><circle cx="-8" cy="-2" r="2.8" fill="#f6c23a"/>
            <ellipse cx="10" cy="2" rx="4.6" ry="3.6" fill="#3a2630"/><ellipse cx="9" cy="1" rx="1.4" ry=".8" fill="#fff" opacity=".7"/>
            <path d="M-30,-14 Q-10,-25 16,-22" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`,
        xpeCriolla(p, 150, 70, 20, 18, { n: 10 }),
        xpeLime(p, 50, 134, 24, 30),
    ].join(''),

    // Carapulcra: reddish-brown stew of dried potato with pork chunks and crushed peanuts beside white rice, boiled yuca
    pe_carapulcra: p => [
        xpeDeep(p, '#c8392e'),
        xpeRice(p, 62, 72, 58, { seed: 5 }),
        `<g ${p.sh(1)}>`, xpeYuca(p, 56, 126, 46, 18, 50, { seed: 1 }), `</g>`,
        `<g ${p.sh(1.2)}>`, xpeMound(p, 118, 112, 58, 54, '#9a4a24', { seed: 1, l: .2, d: .3, jit: .14 }), `</g>`,
        xpeDots(p, 118, 112, 100, { cols: ['#b05a2a', '#8a3e1c', '#c4703a'], n: 120, size: 3.4, len: 1, seed: 1, hi: .35 }),
        `<g ${p.sh(.9)}>`,
        xpeMeat(p, 104, 92, 30, 10, { c: '#8a3e1e', fat: '#e8c08a', seed: 1 }), xpeMeat(p, 142, 108, 28, -30, { c: '#8a3e1e', fat: '#e8c08a', seed: 2 }), xpeMeat(p, 112, 136, 28, 40, { c: '#8a3e1e', fat: '#e8c08a', seed: 3 }), xpeMeat(p, 86, 124, 24, 70, { c: '#8a3e1e', fat: '#e8c08a', seed: 4 }), xpeMeat(p, 136, 80, 22, 0, { c: '#8a3e1e', fat: '#e8c08a', seed: 5 }),
        `</g>`,
        K.sprinkle(p, 118, 110, 90, { c: '#e8c48a', n: 26, r: 1.3 }),
        `<path d="M70,108 C78,82 100,68 126,68" stroke="#c87040" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
        xpeHerbs(p, 118, 110, 80, { n: 10 }),
    ].join(''),

    // Adobo de cerdo: clay cazuela of deep red ají panca sauce with big glossy pork chunks, cooked red onion and slices of sweet potato
    pe_adobo: p => [
        xpeClay(p, { c: '#a8502a' }),
        K.liquid(p, { R: 76, c: '#8f2a17', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#b03a1e" opacity=".35"/>`,
        `<g ${p.sh(1)}>`, xpeCamote(p, 146, 136, 34, 10, { seed: 1 }), xpeCamote(p, 60, 140, 30, -20, { seed: 2 }), `</g>`,
        `<g ${p.sh(1)}>`,
        xpeMeat(p, 74, 80, 42, 10, { c: '#b2482a', fat: '#ecb88a', seed: 1 }), xpeMeat(p, 122, 74, 42, -20, { c: '#a8402a', fat: '#ecb88a', seed: 2 }), xpeMeat(p, 98, 116, 44, 40, { c: '#b2482a', fat: '#ecb88a', seed: 3 }), xpeMeat(p, 144, 108, 38, 70, { c: '#a8402a', fat: '#ecb88a', seed: 4 }), xpeMeat(p, 60, 116, 34, -40, { c: '#b2482a', fat: '#ecb88a', seed: 5 }),

        `</g>`,
        K.glaze(p, 100, 100, 120, '#c0401e', { seed: 2, op: .22 }),
        xpeRedOnion(p, 100, 88, 22, 20), xpeRedOnion(p, 126, 132, 20, -40, { layers: 1 }), xpeRedOnion(p, 80, 136, 18, 60), xpeRedOnion(p, 140, 84, 18, 120),
        K.sprinkle(p, 100, 100, 110, { c: '#5a6a2a', n: 18, r: .7 }),
        xpeShine(100, 100, 76, .35),
    ].join(''),

    // Ceviche: deep plate with cubes of lime-cured white fish in milky leche de tigre, red onion slivers, ají limo rings, coriander; sweet potato, choclo and a lettuce leaf at the side
    pe_ceviche: p => [
        xpeDeep(p, '#2f5f9a'),
        xpeLettuce(p, 138, 62, 64, 30, { seed: 1, c: '#9fd060' }),
        K.liquid(p, { R: 68, c: '#efe6c8', op: .95, cx: 96, cy: 106, shine: false }),
        `<g ${p.sh(1)}>`, xpeCamote(p, 148, 120, 40, 10, { seed: 1 }), `</g>`,
        xpeChoclo(p, 116, 156, 48, 26, -6),
        `<g ${p.sh(.7)}>`,
        ...xpeSpots('cvf', 17, 50, 46, 17, 88, 104).map(([x, y, r], i) => xpeFishCube(p, x, y, 20 + (i % 3) * 2, r, { seed: i })),
        `</g>`,
        `<g ${p.sh(.5)}>`,
        ...xpeSpots('cvo', 12, 44, 40, 13, 90, 100).map(([x, y, r], i) => xpeSliver(p, x, y, 24, r, { pale: i % 3 === 0 })),
        `</g>`,
        xpeChiliRing(p, 76, 92, 6), xpeChiliRing(p, 106, 118, 6), xpeChiliRing(p, 96, 80, 5.5, { c: '#f0a21e' }), xpeChiliRing(p, 66, 120, 5.5),
        xpeLeaf(p, 92, 96, 12, -20), xpeLeaf(p, 112, 92, 11, 40), xpeLeaf(p, 80, 114, 11, 100),
        xpeHerbs(p, 90, 104, 90, { n: 14 }),
        xpeShine(96, 106, 68, .3),
    ].join(''),

    // Chicharrón de pescado: a heap of crisp golden fried fish chunks with fried yuca, salsa criolla and lime wedges
    pe_chicharron_pescado: p => [
        xpePlate(p, '#2f7a52'),
        `<g ${p.sh(.9)}>`, xpeYuca(p, 52, 118, 50, 17, 70, { seed: 1 }), xpeYuca(p, 70, 140, 50, 17, 40, { seed: 2 }), xpeYuca(p, 42, 90, 46, 16, 95, { seed: 3 }), `</g>`,
        `<g ${p.sh(1)}>`,
        ...xpeSpots('chp', 10, 40, 38, 24, 110, 92).map(([x, y, r], i) => xpeBreaded(p, x, y, 34 + (i % 3) * 4, 26 + (i % 2) * 4, r, { c: '#c07a28', seed: i })),

        `</g>`,
        xpeCriolla(p, 132, 140, 20, 14, { n: 8 }),
        xpeLime(p, 160, 104, 24, 70), xpeLime(p, 92, 150, 22, 10),
    ].join(''),

    // Escabeche de pescado: long plate, fried fish fillets under a heap of thick red onion strips and ají cooked in vinegar and ají panca, egg halves, botija olives, sweet potato
    pe_escabeche: p => {
        const R = rng(p.id + 'esc');
        const strips = xpeSpots('escO', 26, 62, 34, 8, 100, 98).map(([x, y], i) => xpeBand(p, x, y, 22 + R() * 8, 4.6, (R() - .5) * 70 + (i % 2 ? 180 : 0), { c: i % 4 === 0 ? '#f0a21e' : i % 2 ? '#e8a090' : '#f2c2b0', bend: .14 })).join('');
        return [
            K.longPlate(p, { w: 190, h: 140, base: '#f6f2ea', rim: '#c86a3a' }),
            K.pool(p, 100, 100, 156, '#d0702e', { op: .8, seed: 1, sy: .66 }),
            `<g ${p.sh(1.1)}>`, xpeBreaded(p, 74, 98, 92, 62, -8, { c: '#b8702a', seed: 1 }), xpeBreaded(p, 126, 102, 92, 62, 6, { c: '#b06a28', seed: 2 }), `</g>`,
            `<g ${p.sh(.6)}>`, strips, `</g>`,
            K.glaze(p, 100, 98, 110, '#d8642a', { seed: 2, op: .22 }),
            `<g ${p.sh(.9)}>`, xpeCamote(p, 28, 100, 30, 0, { seed: 1 }), xpeCamote(p, 172, 100, 30, 0, { seed: 2 }), `</g>`,
            K.eggHalf(p, 50, 52, 28, -10), K.eggHalf(p, 150, 148, 28, 10), K.eggHalf(p, 150, 52, 26, 20),
            xpeOlive(p, 120, 54, 13, 20), xpeOlive(p, 62, 148, 13, -30), xpeOlive(p, 84, 146, 12, 60), xpeOlive(p, 50, 146, 12, 10),
            K.sprinkle(p, 100, 98, 100, { c: '#5a6a2a', n: 14, r: .7 }),
        ].join('');
    },

    // Arroz con mariscos: dark pan of orange ají-tinted rice with shrimp, open mussels, squid rings, peas, red pepper strips, coriander and lime
    pe_arroz_mariscos: p => [
        xpePan(p),
        xpeRice(p, 100, 100, 152, { tint: '#e6904a', hiK: .4, density: .5, grain: 4.6, seed: 1 }),
        `<g ${p.sh(.8)}>`,
        xpeMussel(p, 64, 72, 34, -30), xpeMussel(p, 140, 136, 34, 150), xpeMussel(p, 58, 132, 32, 40), xpeMussel(p, 142, 70, 32, -120),
        K.squidRing(p, 104, 132, 18, 20), K.squidRing(p, 82, 104, 16, -20), K.squidRing(p, 124, 84, 17, 60), K.squidRing(p, 150, 104, 15, 0),
        K.shrimp(p, 96, 76, 26, 10, { c: '#ef6a3a' }), K.shrimp(p, 120, 110, 26, 120, { c: '#ef6a3a' }), K.shrimp(p, 74, 128, 24, -70, { c: '#ef6a3a' }), K.shrimp(p, 104, 154, 22, 200, { c: '#ef6a3a' }), K.shrimp(p, 48, 100, 22, -40, { c: '#ef6a3a' }),
        xpeBand(p, 112, 66, 18, 4.6, 30, { c: '#d4301f', bend: .1 }), xpeBand(p, 90, 142, 16, 4.6, -20, { c: '#d4301f', bend: .1 }), xpeBand(p, 154, 120, 14, 4.4, 80, { c: '#d4301f', bend: .1 }),
        `</g>`,
        ...xpeSpots('amp', 12, 64, 64, 12).map(([x, y]) => xpePea(p, x, y, 7)),
        xpeHerbs(p, 100, 100, 130, { n: 22, cols: ['#2f6a22', '#4a8a30'] }),
        xpeLime(p, 104, 100, 26, -20),
    ].join(''),

    // Tortilla de verduras: a big round golden omelette studded with green beans, carrot, tomato and parsley, white rice at the side
    pe_tortilla_verduras: p => {
        const R = rng(p.id + 'tv');
        const pts = ring(64, 14, .08, R, 1, .94);
        let sp = '';
        for (let i = 0; i < 9; i++) sp += `<ellipse cx="${f1(84 + (R() - .5) * 90)}" cy="${f1(98 + (R() - .5) * 86)}" rx="${f1(5 + R() * 9)}" ry="${f1(3 + R() * 6)}" fill="#b8741e" opacity="${f1(.18 + R() * .2)}"/>`;
        return [
            xpePlate(p, '#2f7a52'),
            xpeRice(p, 150, 128, 54, { seed: 2 }),
            `<g ${p.sh(1.3)}><path ${T(84, 96)} d="${xpeSm(pts, true)}" fill="${p.rg('#f2c440', .3, .25, .4, .36)}" stroke="#c48a20" stroke-width="1"/></g>`,
            `<g ${xpeBlur(p, 2)}>${sp}</g>`,
            ...xpeSpots('tvv', 20, 52, 50, 13, 84, 96).map(([x, y, r], i) => { const t = i % 4; return t === 0 ? K.greenBean(p, x, y, 16, r, { c: '#4f9a34' }) : t === 1 ? xpeDice(p, x, y, 7, r, '#ef7f30') : t === 2 ? xpeDice(p, x, y, 7, r, '#d8341f') : K.greenBean(p, x, y, 12, r, { c: '#5aa63c' }); }),
            `<path d="M36,84 C44,58 66,42 92,40" stroke="#fbe38a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
            xpeHerbs(p, 84, 96, 110, { n: 22 }),
            K.tomatoWedge(p, 152, 76, 22, 30), K.tomatoWedge(p, 162, 98, 20, 80),
        ].join('');
    },

    // Arroz a la cubana: a dome of white rice with two fried eggs and long slices of fried ripe plantain, a spoon of tomato salsa
    pe_arroz_cubana: p => [
        xpePlate(p, '#2f5f9a'),
        `<g ${p.sh(.9)}>`, xpePlantain(p, 150, 108, 76, 25, 80, { seed: 1 }), xpePlantain(p, 98, 156, 74, 24, -6, { seed: 2 }), `</g>`,
        xpeRice(p, 84, 92, 112, { seed: 3, density: .8, grain: 3.8 }),
        K.pool(p, 46, 140, 28, '#d23a22', { op: .9, seed: 2 }),
        ...xpeSpots('acs', 5, 9, 8, 5, 46, 140).map(([x, y, r]) => xpeDice(p, x, y, 5, r, '#e85a3a')),
        K.friedEgg(p, 70, 82, 58, -10), K.friedEgg(p, 112, 108, 56, 20),
        xpeHerbs(p, 46, 140, 20, { n: 3 }),
    ].join(''),

    // Tacu tacu: oval dish, a crisp golden-brown pan-fried log of canary beans and rice, a fried egg on top, salsa criolla at the side
    pe_tacu_tacu: p => {
        const R = rng(p.id + 'tt');
        let sp = '';
        for (let i = 0; i < 46; i++){ const a = R() * 6.28, d = Math.sqrt(R()), x = Math.cos(a) * d * 50, y = Math.sin(a) * d * 30; sp += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(1.6 + R() * 1.6)}" ry="${f1(1 + R())}" transform="rotate(${Math.round(R() * 180)} ${f1(x)} ${f1(y)})" fill="${R() < .5 ? '#f4dc9a' : '#8a5222'}" opacity=".75"/>`; }
        return [
            K.ovalDish(p, { rx: 96, ry: 76, rim: '#a8743a' }),
            `<g ${T(90, 98, -8)}><g ${p.sh(1.4)}><g ${p.crumb(.6)}><path d="${xpeSm(ring(1, 14, .06, R, 74, 50), true)}" fill="${p.g('#c08436', .3, .38)}" stroke="#6e3e12" stroke-width="1"/></g></g>
                <path d="${xpeSm(ring(1, 14, .04, rng('ttb'), 70, 46), true)}" fill="none" stroke="#8a4e16" stroke-width="5" opacity=".35"/>
                <g ${xpeBlur(p, 2.4)}><ellipse cx="8" cy="12" rx="52" ry="24" fill="#7a4210" opacity=".35"/><ellipse cx="-16" cy="-12" rx="36" ry="14" fill="#f0c470" opacity=".55"/></g>${sp}
                <path d="M-46,-14 Q-20,-36 20,-34" stroke="#fff3d6" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`,
            K.friedEgg(p, 92, 94, 62, 10),
            xpeCriolla(p, 164, 104, 14, 30, { n: 10 }),
            xpeHerbs(p, 96, 92, 40, { n: 5 }),
        ].join('');
    },

    // Pallares guisados: deep plate of creamy pale-yellow stew of big lima beans with crumbled queso fresco, white rice at the side
    pe_pallares: p => [
        xpeDeep(p, '#d9a441'),
        xpeRice(p, 140, 72, 60, { seed: 1 }),
        `<g ${p.sh(1.1)}>`, xpeMound(p, 92, 110, 66, 60, '#e6bd62', { seed: 1, l: .28, d: .25, jit: .1 }), `</g>`,
        `<g ${p.sh(.5)}>`,
        ...xpeSpots('pll', 24, 56, 50, 15, 92, 110).map(([x, y, r], i) => xpePulse(p, x, y, 22 + (i % 3) * 1.5, r, { c: i % 3 ? '#f2e4b8' : '#eadaa2', eye: '#c8ac6a', flat: .66 })),
        `</g>`,
        K.glaze(p, 90, 110, 96, '#f0cf80', { seed: 2, op: .3 }),
        ...xpeSpots('plc', 6, 34, 30, 14, 92, 110).map(([x, y, r]) => xpeQueso(p, x, y, 11, 9, r, { seed: x })),
        xpeHerbs(p, 90, 110, 90, { n: 12 }),
    ].join(''),

    // Locro de zapallo: deep plate of thick orange pumpkin stew with potato, choclo kernels, peas and slabs of melting queso fresco; white rice
    pe_locro: p => [
        xpeDeep(p, '#2f7a52'),
        xpeRice(p, 62, 66, 56, { seed: 1 }),
        `<g ${p.sh(1.1)}>`, xpeMound(p, 112, 112, 64, 60, '#e8902e', { seed: 1, l: .3, d: .25, jit: .12 }), `</g>`,
        `<circle cx="108" cy="104" r="40" fill="#f4a848" opacity=".4"/>`,
        `<g ${p.sh(.6)}>`,
        K.potato(p, 90, 96, 26, 20, { c: '#f2dc96', seed: 1 }), K.potato(p, 140, 128, 26, -30, { c: '#f2dc96', seed: 2 }), K.potato(p, 104, 146, 22, 60, { c: '#f2dc96', seed: 3 }),
        ...xpeSpots('lcp', 9, 50, 46, 14, 112, 112).map(([x, y, r]) => xpeDice(p, x, y, 12, r, '#f4a238')),
        `</g>`,
        ...xpeSpots('lck', 16, 54, 50, 9, 112, 112).map(([x, y, r]) => xpeKernel(p, x, y, 6.5, r)),
        ...xpeSpots('lce', 8, 54, 50, 11, 112, 112).map(([x, y]) => xpePea(p, x, y, 7)),
        xpeQueso(p, 124, 92, 32, 22, -16, { seed: 1 }), xpeQueso(p, 84, 128, 28, 20, 20, { seed: 2 }),
        xpeHerbs(p, 112, 110, 90, { n: 10 }),
    ].join(''),

    // Olluquito con carne: thin julienned olluco stewed with shredded beef and ají panca, plenty of parsley, white rice at the side
    pe_olluquito: p => [
        xpePlate(p, '#c8392e'),
        xpeRice(p, 146, 102, 58, { sy: 1.3, seed: 1 }),
        `<g ${p.sh(1)}>`, xpeMound(p, 82, 102, 58, 62, '#b8642a', { seed: 1, l: .2, d: .3 }), `</g>`,
        `<g ${p.sh(.4)}>`,
        K.shreds(p, 82, 102, 96, { c: '#e7c457', n: 46, w: 3, len: .28, seed: 1, curve: .3 }),
        K.shreds(p, 82, 102, 90, { c: '#f0d27a', n: 30, w: 2.8, len: .26, seed: 2, curve: .3 }),
        K.shreds(p, 82, 102, 86, { c: '#d9a868', n: 14, w: 2.6, len: .24, seed: 3, curve: .3 }),
        K.shreds(p, 82, 102, 86, { c: '#6e3a1c', n: 18, w: 2.4, len: .2, seed: 4, curve: .5 }),
        `</g>`,
        K.glaze(p, 82, 100, 100, '#c06a2c', { seed: 2, op: .2 }),
        xpeHerbs(p, 82, 102, 100, { n: 30 }),
    ].join(''),

    // Solterito: a bowl of fresh fava beans, cubes of queso fresco, choclo kernels, tomato, red onion, botija olives, rocoto and parsley
    pe_solterito: p => {
        const sp = xpeSpots('sol', 48, 64, 64, 12);
        return [
            K.bowl(p, { glaze: '#d8a441', inside: '#f7f3eb' }),
            xpeMound(p, 100, 100, 72, 72, '#e9e6c4', { seed: 1, l: .2, d: .2, jit: .06 }),
            `<g ${p.sh(.5)}>`,
            sp.map(([x, y, r], i) => { const t = i % 7; return t === 0 || t === 4 ? xpePulse(p, x, y, 17, r, { c: '#8cc35a', eye: '#4f7a2a' }) : t === 1 ? xpeDice(p, x, y, 13, r, '#fbf8ee') : t === 2 ? xpeKernel(p, x, y, 11, r) : t === 3 ? xpeDice(p, x, y, 11, r, '#e0412c') : t === 5 ? xpeSliver(p, x, y, 18, r) : xpeKernel(p, x, y, 11, r); }).join(''),
            `</g>`,
            ...xpeSpots('solo', 6, 54, 54, 26).map(([x, y, r]) => xpeOlive(p, x, y, 12, r)),
            ...xpeSpots('solr', 6, 56, 56, 20).map(([x, y, r]) => xpeDice(p, x, y, 6, r, '#c8241a')),
            xpeHerbs(p, 100, 100, 130, { n: 26 }),
        ].join('');
    },

    // Ocopa arequipeña: boiled potato slices covered in an ochre-green huacatay and peanut sauce, egg halves, botija olives, lettuce
    pe_ocopa: p => [
        xpePlate(p, '#d9a441'),
        xpeLettuce(p, 76, 86, 100, -28, { seed: 1, c: '#9fd060' }), xpeLettuce(p, 128, 114, 96, 24, { seed: 2, c: '#a8d66c' }),
        xpePotatoRound(p, 64, 112, 34, 0, { seed: 1 }), xpePotatoRound(p, 96, 92, 34, 20, { seed: 2 }), xpePotatoRound(p, 126, 80, 32, -10, { seed: 3 }), xpePotatoRound(p, 104, 128, 32, 30, { seed: 4 }), xpePotatoRound(p, 136, 118, 30, 10, { seed: 5 }),
        `<g ${p.sh(1.2)}><path d="${xpeSm([[44, 110], [60, 84], [94, 70], [130, 62], [154, 78], [156, 112], [142, 138], [112, 150], [80, 146], [54, 130]], true)}" fill="${p.rg('#a49a3e', .3, .25, .4, .36)}"/></g>`,
        `<path d="M58,108 C64,92 84,82 104,82 C122,82 136,90 142,98" stroke="#d2c878" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
        K.sprinkle(p, 100, 106, 90, { c: '#6a5a2a', n: 22, r: .9 }),
        K.eggHalf(p, 74, 72, 28, -20), K.eggHalf(p, 146, 142, 26, 30), K.eggHalf(p, 120, 128, 24, 60),
        xpeOlive(p, 106, 104, 14, 20), xpeOlive(p, 82, 120, 13, -40), xpeOlive(p, 138, 92, 12, 60),
        xpeLeaf(p, 96, 116, 13, 30, { c: '#2f6a22' }), xpeLeaf(p, 124, 106, 12, -40, { c: '#2f6a22' }),
    ].join(''),

    // Palta rellena: two avocado halves filled with creamy chicken salad (carrot, peas), on lettuce, parsley
    pe_palta_rellena: p => {
        const half = (x, y, r, seed) => {
            const gid = p.def('xpeAvoF', id => `<radialGradient id="${id}" cx=".45" cy=".55" r=".6"><stop offset="0" stop-color="#f4eea2"/><stop offset=".6" stop-color="#d6dc78"/><stop offset="1" stop-color="#7fa834"/></radialGradient>`);
            const body = 'M0,-34 C14,-34 20,-20 22,-6 C26,14 20,34 0,34 C-20,34 -26,14 -22,-6 C-20,-20 -14,-34 0,-34Z';
            return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><path d="${body}" fill="#2f4a14" stroke="#1e3008" stroke-width="1"/></g><path d="${body}" transform="scale(.9)" fill="url(#${gid})"/>
                <g ${p.sh(.8)}>${xpeMound(p, 0, 6, 18, 20, '#f6edd2', { seed, l: .2, d: .18 })}</g>
                ${xpeShred(p, 0, 4, 26, { seed, n: 8, cols: ['#f6e6c4', '#ecd2a0'], ol: '#c9a46a' })}
                ${xpeDice(p, -7, 14, 5, 20, '#ef7f30')}${xpeDice(p, 8, -6, 5, -20, '#ef7f30')}${xpeDice(p, 6, 18, 5, 40, '#ef7f30')}
                ${xpePea(p, -8, -2, 5.5)}${xpePea(p, 9, 9, 5.5)}${xpePea(p, -2, 22, 5.5)}
                <path d="M-14,-18 Q-8,-28 2,-28" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
        };
        return [
            xpePlate(p, '#2f7a52'),
            xpeLettuce(p, 76, 96, 108, -60, { seed: 1, c: '#9fd060' }), xpeLettuce(p, 128, 104, 104, 60, { seed: 2, c: '#a8d66c' }), xpeLettuce(p, 100, 100, 90, 0, { seed: 3, c: '#8fc552' }),
            half(70, 100, -18, 1), half(132, 100, 18, 2),
            xpeMayo(p, 70, 106, 12, 1), xpeMayo(p, 132, 106, 12, 2),
            xpeHerbs(p, 70, 100, 30, { n: 5 }), xpeHerbs(p, 132, 100, 30, { n: 5 }),
            K.tomatoWedge(p, 100, 52, 20, 0), K.tomatoWedge(p, 100, 150, 20, 180),
        ].join('');
    },

    // Choros a la chalaca: open mussels on the half shell, each topped with a salsa of red onion, tomato, choclo kernels and rocoto; lime wedges in the centre
    pe_choros_chalaca: p => {
        const n = 8, R = rng(p.id + 'cc');
        let out = '';
        for (let i = 0; i < n; i++){
            const a = i / n * 6.28 + .2, x = 100 + Math.cos(a) * 54, y = 100 + Math.sin(a) * 54, rot = a * 57.3;
            out += xpeMussel(p, x, y, 46, rot, { meat: '#ef9a48' });
            out += xpeSpots('ccs' + i, 5, 8, 5, 5, x, y)
.map(([sx, sy, r], j) => { const t = j % 4; return t === 0 ? xpeDice(p, sx, sy, 4.6, r, '#f4e6ee') : t === 1 ? xpeDice(p, sx, sy, 4.6, r, '#e0412c') : t === 2 ? xpeKernel(p, sx, sy, 5, r) : xpeDice(p, sx, sy, 4, r, '#9a2f6c'); }).join('');
            out += `<circle cx="${f1(x + (R() - .5) * 6)}" cy="${f1(y + (R() - .5) * 4)}" r="1.6" fill="#3f8a2c"/>`;
        }
        return [
            xpePlate(p, '#2f5f9a'),
            out,
            xpeLime(p, 92, 92, 26, -30), xpeLime(p, 110, 108, 26, 150),
            xpeHerbs(p, 100, 100, 150, { n: 12 }),
        ].join('');
    },

    // Ensalada de quinua: bowl of fluffy cooked quinoa tossed with tomato, cucumber, red onion, queso fresco and parsley
    pe_ensalada_quinua: p => [
        K.bowl(p, { glaze: '#2f7a52', inside: '#f7f3eb' }),
        `<g ${p.sh(1)}>`, xpeMound(p, 100, 100, 74, 72, '#e8dcb0', { seed: 1, l: .2, d: .22, jit: .06 }), `</g>`,
        xpeDots(p, 100, 100, 144, { cols: ['#f3e8c4', '#dccb96', '#efe0b0'], n: 150, size: 2.8, len: .7, seed: 1, hi: .3 }),
        `<g ${p.sh(.5)}>`,
        ...xpeSpots('eqv', 24, 60, 60, 15).map(([x, y, r], i) => { const t = i % 4; return t === 0 ? xpeDice(p, x, y, 10, r, '#e0412c') : t === 1 ? xpeDice(p, x, y, 10, r, '#d6eab0', { skin: '#3f7d2e' }) : t === 2 ? xpeDice(p, x, y, 11, r, '#fbf8ee') : xpeSliver(p, x, y, 14, r); }),
        `</g>`,
        xpeHerbs(p, 100, 100, 130, { n: 26 }),
        xpeLime(p, 140, 140, 24, -40),
    ].join(''),

    // Ensalada de pallares: bowl of big cream lima beans with red onion slivers, tomato, ají amarillo and coriander, a lime wedge
    pe_ensalada_pallares: p => [
        K.bowl(p, { glaze: '#c8392e', inside: '#f7f3eb' }),
        `<g ${p.sh(.6)}>`,
        ...xpeSpots('epb', 26, 62, 62, 18).map(([x, y, r], i) => xpePulse(p, x, y, 24 + (i % 3), r, { c: i % 2 ? '#f0e6c4' : '#e8dcb2', eye: '#c4ae74', flat: .66 })),
        `</g>`,
        `<g ${p.sh(.5)}>`,
        ...xpeSpots('epo', 14, 58, 58, 14).map(([x, y, r], i) => i % 3 === 2 ? xpeDice(p, x, y, 10, r, '#e0412c') : xpeSliver(p, x, y, 20, r, { pale: i % 3 === 1 })),
        `</g>`,
        xpeBand(p, 82, 92, 18, 4.4, 20), xpeBand(p, 118, 110, 18, 4.4, -40), xpeBand(p, 100, 132, 16, 4.2, 70),
        xpeLeaf(p, 96, 82, 13, -20), xpeLeaf(p, 72, 118, 12, 50), xpeLeaf(p, 128, 86, 12, 100),
        xpeHerbs(p, 100, 100, 130, { n: 18 }),
        xpeLime(p, 142, 138, 24, -40),
    ].join(''),

    // Crema de rocoto: small bowl of smooth orange-red rocoto and fresh cheese cream, a swirl, rocoto bits and a huacatay leaf
    pe_crema_rocoto: p => [
        K.kobachi(p, { glaze: '#2f5f9a', inside: '#f8f6f0' }),
        K.liquid(p, { R: 70, c: '#e0552e', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="46" fill="#ee7448" opacity=".45"/>`,
        xpeSwirl(100, 100, 44, '#f6b49a', { w: 3.4, op: .7 }),
        ...xpeSpots('crr', 7, 46, 46, 16).map(([x, y, r]) => xpeDice(p, x, y, 6, r, '#c8241a')),
        xpeLeaf(p, 110, 92, 18, -20, { c: '#2f6a22' }), xpeLeaf(p, 98, 104, 14, 60, { c: '#3f7a2a' }),
        xpeShine(100, 100, 70, .5),
    ].join(''),

    // Encurtido: glass bowl of vegetables pickled in pale vinegar: carrot sticks and rounds, cauliflower, green beans, red onion, ají
    pe_encurtido: p => {
        const R = rng(p.id + 'enc');
        return [
            K.kobachi(p, { glaze: '#cfdde2', inside: '#eef4f4' }),
            K.liquid(p, { R: 72, c: '#efe8c8', op: .7, shine: false }),
            `<g ${p.sh(.6)}>`,
            ...xpeSpots('enc', 30, 62, 62, 15).map(([x, y, r], i) => { const t = i % 5; return t === 0 ? xpeCauli(p, x, y, 26, r) : t === 1 ? xpeBand(p, x, y, 26, 7, r, { c: '#ef7f30', bend: .02 }) : t === 2 ? xpeBand(p, x, y, 24, 5.5, r, { c: '#5a9a3a', bend: .04 }) : t === 3 ? K.carrotRound(p, x, y, 17) : xpeRedOnion(p, x, y, 24, r, { layers: 2 }); }),
            `</g>`,
            xpeBand(p, 90, 120, 18, 4.4, 30), xpeBand(p, 120, 84, 16, 4.4, -60),
            K.sprinkle(p, 100, 100, 120, { c: '#6a7a3a', n: 12, r: .7 }),
            xpeShine(100, 100, 72, .5),
        ].join('');
    },

    // Saltado de vainitas: diagonal-cut green beans stir-fried with tomato, red onion and ají in a glossy soy glaze
    pe_saltado_vainitas: p => [
        xpePlate(p, '#2f7a52'),
        K.pool(p, 100, 102, 136, '#7a4a1e', { op: .75, seed: 1, sy: .9 }),
        ...xpeSpots('svb', 28, 60, 58, 12).map(([x, y, r], i) => xpeBand(p, x, y, 26 + (i % 3) * 2, 6, r, { c: i % 2 ? '#4f9a34' : '#62a83e', bend: .05 })),
        `<g ${p.sh(.6)}>`,
        K.tomatoWedge(p, 76, 80, 22, 30), K.tomatoWedge(p, 128, 92, 22, -120), K.tomatoWedge(p, 96, 132, 20, 160), K.tomatoWedge(p, 140, 128, 20, 70), K.tomatoWedge(p, 64, 118, 20, -40),
        xpeRedOnion(p, 104, 76, 20, -20), xpeRedOnion(p, 114, 116, 20, 70, { layers: 1 }), xpeRedOnion(p, 78, 104, 18, 200),
        xpeBand(p, 120, 70, 16, 4, -20), xpeBand(p, 90, 116, 14, 4, 50),
        `</g>`,
        K.glaze(p, 100, 100, 110, '#8a5a2a', { seed: 3, op: .2 }),
    ].join(''),

    // Verduras chifa: pak choi halves, broccoli florets and carrot slices stir-fried in a glossy oyster-soy sauce with spring onion and sesame
    pe_verduras_chifa: p => [
        xpePlate(p, '#c8392e'),
        K.pool(p, 100, 102, 140, '#8a5a24', { op: .75, seed: 2, sy: .9 }),
        `<g ${p.sh(.8)}>`,
        xpeBokChoy(p, 64, 82, 72, -50), xpeBokChoy(p, 140, 80, 70, 50), xpeBokChoy(p, 104, 146, 70, 180),
        K.broccoli(p, 100, 96, 30, 0), K.broccoli(p, 62, 128, 30, 20), K.broccoli(p, 142, 126, 28, -10), K.broccoli(p, 112, 58, 26, 0), K.broccoli(p, 84, 60, 24, 0), K.broccoli(p, 124, 112, 24, 30),
        `</g>`,
        ...xpeSpots('vcc', 9, 54, 54, 18).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="8" ry="5" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b8561a" stroke-width=".6"/><ellipse rx="3.4" ry="2" fill="#f6a86a"/></g>`),
        K.glaze(p, 100, 100, 120, '#9a6a2a', { seed: 3, op: .22 }),
        ...xpeSpots('vcs', 14, 60, 60, 10).map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-4" y="-1.5" width="8" height="3" rx="1.5" fill="#5fa83a" stroke="#2f6a1e" stroke-width=".5"/></g>`),
        K.sesame(p, 100, 100, 110, { n: 30 }),
    ].join(''),

    // Cancha serrana: a clay bowl full of toasted, split, golden-brown Andean corn kernels, a few salt flakes
    pe_cancha: p => [
        xpeClay(p, { c: '#9a5a34', dots: null }),
        `<g ${p.sh(.5)}>`,
        ...xpeSpots('can', 44, 70, 70, 16).map(([x, y, r], i) => xpeCancha(p, x, y, 19 + (i % 3) * 1.5, r, { seed: i })),
        `</g>`,
        K.sprinkle(p, 100, 100, 130, { c: '#ffffff', n: 26, r: .8 }),
    ].join(''),

    // Frejoles guisados: small bowl of creamy stewed canary beans, half mashed, with bits of pork belly and an oil sheen
    pe_frejoles: p => [
        K.kobachi(p, { glaze: '#a86a3a', inside: '#f4efe4' }),
        K.liquid(p, { R: 72, c: '#d7b26a', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="48" fill="#e6c684" opacity=".45"/>`,
        `<g ${p.sh(.5)}>`,
        ...xpeSpots('frb', 34, 62, 62, 13).map(([x, y, r], i) => xpePulse(p, x, y, 15 + (i % 3), r, { c: i % 2 ? '#e8c87a' : '#dcb868', eye: '#a8843e', flat: .7 })),
        `</g>`,
        ...xpeSpots('frp', 5, 44, 44, 26).map(([x, y, r]) => xpeMeat(p, x, y, 13, r, { c: '#b46a3a', fat: '#f2dcb0', seed: x })),
        xpeOil(p, 100, 100, 110, { n: 9, c: '#e8a84a' }),
        xpeShine(100, 100, 72, .45),
    ].join(''),

    // Pepián de choclo: small bowl of thick creamy grated corn cooked with ají amarillo, coriander leaves on top
    pe_pepian_choclo: p => [
        K.kobachi(p, { glaze: '#2f7a52', inside: '#f6f3ea' }),
        K.liquid(p, { R: 72, c: '#efcf63', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="48" fill="#f6dc7c" opacity=".5"/>`,
        xpeDots(p, 100, 100, 136, { cols: ['#f6e08a', '#e6c050', '#fbeaa4'], n: 170, size: 3, len: .8, seed: 1, hi: .35 }),
        ...xpeSpots('ppk', 10, 56, 56, 16).map(([x, y, r]) => xpeKernel(p, x, y, 8, r, { c: '#f4d464' })),
        xpeLeaf(p, 98, 94, 18, -20), xpeLeaf(p, 116, 108, 15, 40), xpeLeaf(p, 86, 114, 14, 110),
        xpeHerbs(p, 100, 100, 80, { n: 10 }),
        xpeShine(100, 100, 72, .45),
    ].join(''),

    // Puré de papa: small bowl of smooth pale-yellow mashed potato with spoon ridges, a melting pat of butter and parsley
    pe_pure_papa: p => {
        const ridges = [0, 1, 2, 3].map(i => { const r = 18 + i * 14; return `<path d="M${100 - r},${100 + i * 2} A${r},${r * .9} 0 1 1 ${100 + r * .7},${100 + r * .6}" stroke="#d8c07a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/><path d="M${100 - r + 1},${98 + i * 2} A${r},${r * .9} 0 0 1 ${100 + r * .2},${100 - r * .9}" stroke="#fffbe8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`; }).join('');
        return [
            K.kobachi(p, { glaze: '#d8a441', inside: '#f6f3ea' }),
            `<g ${p.sh(1)}>`, xpeMound(p, 100, 100, 74, 72, '#f4df9a', { seed: 1, l: .35, d: .22, jit: .05 }), `</g>`,
            ridges,
            `<g ${p.sh(.6)}><rect x="92" y="88" width="20" height="16" rx="3" transform="rotate(-12 102 96)" fill="${p.g('#fbe68a', .3, .15)}" stroke="#d8b84a" stroke-width=".6"/></g>`,
            `<ellipse cx="104" cy="100" rx="18" ry="12" fill="#f8d65a" opacity=".45"/>`,
            xpeHerbs(p, 100, 100, 70, { n: 10 }),
            K.sprinkle(p, 100, 100, 100, { c: '#b88a3a', n: 10, r: .6 }),
        ].join('');
    },

    // Arroz árabe: bowl of rice tossed with toasted angel hair, raisins and almonds, parsley
    pe_arroz_arabe: p => {
        const R = rng(p.id + 'aa');
        let nd = '';
        for (let i = 0; i < 60; i++){ const cx = 100 + (R() - .5) * 130, cy = 100 + (R() - .5) * 130, a = R() * 6.28, L = 6 + R() * 8; if (Math.hypot(cx - 100, cy - 100) > 64) continue; nd += `M${f1(cx)},${f1(cy)}q${f1(Math.cos(a + 1) * 4)},${f1(Math.sin(a + 1) * 4)} ${f1(Math.cos(a) * L)},${f1(Math.sin(a) * L)}`; }
        return [
            K.bowl(p, { glaze: '#8a5a2a', inside: '#f7f3eb' }),
            xpeRice(p, 100, 100, 150, { tint: '#efe2c6', density: .55, grain: 4.4, seed: 1 }),
            `<path d="${nd}" stroke="#8a5a22" stroke-width="1.9" fill="none" stroke-linecap="round" opacity=".55"/><path d="${nd}" stroke="#d09a4a" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
            `<g ${p.sh(.5)}>`,
            ...xpeSpots('aar', 18, 60, 60, 12).map(([x, y, r], i) => i % 2 ? xpeRaisin(p, x, y, 8, r) : xpeAlmond(p, x, y, 12, r)),
            `</g>`,
            xpeHerbs(p, 100, 100, 120, { n: 14 }),
        ].join('');
    },

    // Yuca frita: a pile of thick golden fried yuca sticks with a small bowl of huancaína sauce and lime
    pe_yuca_frita: p => [
        xpePlate(p, '#2f5f9a'),
        xpeDip(p, 144, 140, 28, '#f0b43a'),
        `<g ${p.sh(.4)}>`,
        xpeYuca(p, 66, 72, 64, 20, 30, { seed: 1 }), xpeYuca(p, 100, 66, 66, 20, 0, { seed: 2 }), xpeYuca(p, 138, 82, 62, 20, -40, { seed: 3 }),
        xpeYuca(p, 56, 112, 66, 21, 70, { seed: 4 }), xpeYuca(p, 92, 104, 70, 21, 20, { seed: 5 }), xpeYuca(p, 128, 108, 64, 20, -10, { seed: 6 }),
        xpeYuca(p, 82, 140, 64, 20, -20, { seed: 7 }), xpeYuca(p, 106, 84, 60, 19, 60, { seed: 8 }),
        `</g>`,
        K.sprinkle(p, 96, 100, 110, { c: '#ffffff', n: 20, r: .8 }),
        xpeLime(p, 150, 58, 24, 30),
    ].join(''),

    // Camote frito: overlapping rounds of orange sweet potato fried golden at the edges
    pe_camote_frito: p => [
        xpePlate(p, '#d9a441'),
        ...[[66, 74, 46], [114, 64, 46], [150, 104, 44], [52, 120, 44], [100, 108, 48], [136, 144, 44], [88, 150, 44], [96, 84, 40]].map(([x, y, s], i) => xpeCamote(p, x, y, s, i * 37, { fried: true, seed: i })),
        K.sprinkle(p, 100, 100, 120, { c: '#ffffff', n: 18, r: .8 }),
    ].join(''),

    // Torrejas de choclo: golden corn fritters studded with whole kernels and spring onion, a little salsa criolla
    pe_torrejas_choclo: p => {
        const fr = (x, y, s, seed) => {
            const R = rng(p.id + 'tor' + seed);
            return `<g ${T(x, y)}><g ${p.sh(1)}><g ${p.rough(2.6, .1)}><path d="${xpeSm(ring(s / 2, 10, .14, R, 1, .9), true)}" fill="${p.g('#d39a3a', .3, .35)}" stroke="#8a5418" stroke-width=".9"/></g></g>
                <path d="${xpeSm(ring(s / 2 - 6, 10, .14, R, 1, .9), true)}" fill="#e8bb5a" opacity=".55"/>
                ${xpeSpots('tk' + seed, 7, s * .32, s * .3, 6.5, 0, 0).map(([kx, ky, r]) => xpeKernel(p, kx, ky, 5.5, r, { c: '#f6d460' })).join('')}
                ${xpeSpots('ts' + seed, 4, s * .3, s * .28, 7, 0, 0).map(([kx, ky, r]) => `<rect x="${f1(kx - 2.5)}" y="${f1(ky - 1)}" width="5" height="2" rx="1" fill="#5a9a3a" transform="rotate(${r} ${f1(kx)} ${f1(ky)})"/>`).join('')}
                <path d="M${f1(-s * .3)},${f1(-s * .2)} Q${f1(-s * .1)},${f1(-s * .38)} ${f1(s * .18)},${f1(-s * .3)}" stroke="#fff3d6" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
        };
        return [
            xpePlate(p, '#2f7a52'),
            fr(66, 74, 56, 1), fr(126, 66, 54, 2), fr(56, 128, 54, 3), fr(112, 120, 58, 4), fr(150, 112, 44, 5),
            xpeCriolla(p, 106, 160, 18, 10, { n: 6 }),
        ].join('');
    },

    // Pastel de acelga: square dish with a golden pastry-topped chard pie; one corner cut away showing the green chard and egg filling
    pe_pastel_acelga: p => {
        const R = rng(p.id + 'pa');
        let fork = '';
        for (let i = 0; i < 5; i++) fork += `<path d="M${46 + i * 22},50 l8,8 M${50 + i * 22},62 l8,8" stroke="#a8641e" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>`;
        return [
            K.squareDish(p, { s: 176, base: '#f2efe6', rim: '#2f7a52' }),
            `<g ${p.sh(1.4)}><path d="M26,26 H174 V100 H100 V174 H26Z" fill="${p.g('#c8862e', .35, .3)}" stroke="#8a5218" stroke-width="1"/></g>`,
            `<path d="M100,100 H174 V106 H106 V174 H100Z" fill="#4f7f2a"/><path d="M104,104 H174 M104,104 V174" stroke="#7aa848" stroke-width="2" opacity=".8"/>`,
            `<path d="M30,30 H170 V96 H96 V170 H30Z" fill="${p.rg('#d08a30', .3, .25, .4, .4)}"/>`,
            `<path d="M30,30 H170 V96 H96 V170 H30Z" fill="none" stroke="#a8641e" stroke-width="5" opacity=".35"/>`,

            `<g ${xpeBlur(p, 3)}><ellipse cx="62" cy="62" rx="26" ry="16" fill="#fff0c0" opacity=".45"/><ellipse cx="140" cy="62" rx="20" ry="12" fill="#b06a1e" opacity=".3"/><ellipse cx="60" cy="140" rx="20" ry="14" fill="#b06a1e" opacity=".3"/></g>`,
            fork,
            `<path d="M70,90 l10,-10 M60,120 l10,-10 M130,70 l10,-10" stroke="#8a4e16" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,
            `<g ${T(140, 140, -14)}><g ${p.sh(1.2)}><path d="M-32,-30 Q0,-34 32,-30 L32,30 Q0,34 -32,30Z" fill="${p.g('#c8862e', .35, .3)}" stroke="#8a5218" stroke-width="1"/></g>
                <path d="M-32,-22 Q0,-26 32,-22 L32,20 Q0,24 -32,20Z" fill="${p.g('#4f7f2a', .25, .3)}"/>
                ${K.shreds(p, 0, 0, 56, { c: '#7aaa44', n: 14, w: 2.4, len: .5, seed: 1 })}
                ${xpeSpots('pae', 6, 24, 16, 12, 0, 0).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="4.6" ry="3.2" fill="#fbf6e6"/><circle r="2" fill="#f2c23a"/></g>`).join('')}
                <path d="M-26,-27 L24,-27" stroke="#fff3d6" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>`,
        ].join('');
    },

    // Pastel de papa: square dish of baked layered potato and cheese with a browned bubbling top; one piece lifted to show the layers
    pe_pastel_papa: p => {
        const R = rng(p.id + 'pp');
        let bub = '';
        for (let i = 0; i < 22; i++) bub += `<ellipse cx="${f1(32 + R() * 136)}" cy="${f1(32 + R() * 136)}" rx="${f1(5 + R() * 10)}" ry="${f1(3 + R() * 7)}" fill="${R() < .5 ? '#a8561a' : '#c8782a'}" opacity="${f1(.4 + R() * .3)}"/>`;
        let slices = '';
        for (let row = 0; row < 6; row++) for (let i = 0; i < 6; i++){ const x = 40 + i * 24 + (row % 2) * 12, y = 42 + row * 24; if (x > 100 && y > 100) continue; slices += `M${x - 11},${y + 2} a12,10 0 0 1 22,0`; }
        slices = `<path d="${slices}" stroke="#b8782a" stroke-width="1.8" fill="none" opacity=".5"/>`;

        return [
            K.squareDish(p, { s: 176, base: '#f2efe6', rim: '#c8392e' }),
            `<g ${p.sh(1.4)}><rect x="26" y="26" width="148" height="148" rx="10" fill="${p.g('#efc860', .3, .3)}" stroke="#a8742a" stroke-width="1"/></g>`,
            `<g ${xpeBlur(p, 3)}>${bub}</g>`,
            slices,
            `<rect x="104" y="104" width="66" height="66" rx="4" fill="#f4ead2" opacity=".7"/>`,
            `<g ${p.sh(1)}><g ${T(132, 136, -8)}><rect x="-34" y="-30" width="68" height="60" rx="5" fill="${p.g('#f2cf6a', .3, .25)}" stroke="#a8742a" stroke-width="1"/>
                ${[-16, -2, 12].map(y => `<rect x="-34" y="${y}" width="68" height="5" fill="#fbf4dc"/>`).join('')}
                <rect x="-34" y="-30" width="68" height="12" rx="4" fill="${p.g('#d48a2c', .3, .25)}"/>
                <path d="M-28,-26 L22,-26" stroke="#fff3d6" stroke-width="2" stroke-linecap="round" opacity=".7"/></g></g>`,
            `<path d="M36,56 Q60,36 96,40" stroke="#fff3d6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
            xpeHerbs(p, 70, 70, 70, { n: 10 }),
        ].join('');
    },

    // ---------- soups ----------
    // Caldo de gallina: golden clear hen broth with fat droplets, a big piece of hen, thick noodles, yellow potato, boiled egg halves, spring onion; lime
    pe_caldo_gallina: p => [
        xpeSoupBowl(p, { band: '#d9a441' }),
        K.liquid(p, { R: 74, c: '#e6c062', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#f2d888" opacity=".45"/>`,
        xpeBrothNoodles(p, 64, { c: '#f4dc98', w: 3.6, n: 26, seed: 1 }),
        `<g ${p.sh(.9)}>`,
        xpeChickenChunk(p, 86, 86, 54, -20, { seed: 1, c: '#eac48a' }),
        xpeChickenChunk(p, 132, 112, 38, 30, { seed: 2, c: '#e8c088' }),

        K.potato(p, 70, 128, 30, 20, { c: '#f2cf62', seed: 1 }), K.potato(p, 132, 74, 26, -30, { c: '#f2cf62', seed: 2 }),
        `</g>`,
        K.eggHalf(p, 104, 130, 28, 20), K.eggHalf(p, 56, 92, 26, -40),
        xpeOil(p, 100, 100, 130, { n: 16, c: '#f6c84a', rmax: 3.4 }),
        ...xpeSpots('cgs', 18, 60, 60, 9).map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="none" stroke="#5fa03a" stroke-width="1.6"/>`),
        xpeLime(p, 150, 144, 24, -30),
        xpeShine(100, 100, 74, .4),
    ].join(''),

    // Chupe de camarones: deep plate of orange creamy shrimp chowder with whole red shrimp, a poached egg, potato, a piece of choclo, queso fresco cubes, peas, huacatay
    pe_chupe_camarones: p => [
        xpeDeep(p, '#c8392e'),
        K.liquid(p, { R: 72, c: '#e89a52', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="48" fill="#f2b874" opacity=".45"/>`,
        xpeSwirl(100, 100, 52, '#f6dcb8', { w: 3, op: .6 }),
        `<g ${p.sh(.7)}>`,
        xpeChoclo(p, 64, 128, 40, 26, 40),
        K.potato(p, 138, 128, 26, 20, { c: '#f2d27a', seed: 1 }), K.potato(p, 60, 84, 24, -20, { c: '#f2d27a', seed: 2 }),
        `</g>`,
        xpeShrimp(p, 92, 62, 40, -10), xpeShrimp(p, 142, 90, 40, 70), xpeShrimp(p, 104, 144, 38, 170), xpeShrimp(p, 50, 112, 34, 250),
        xpePoached(p, 100, 100, 50, 10),
        xpeQueso(p, 124, 70, 14, 12, 10, { seed: 1 }), xpeQueso(p, 80, 120, 13, 12, -20, { seed: 2 }), xpeQueso(p, 128, 116, 12, 11, 30, { seed: 3 }),
        ...xpeSpots('chpz', 8, 58, 58, 14).map(([x, y]) => xpePea(p, x, y, 7)),
        xpeHerbs(p, 100, 100, 110, { n: 14, cols: ['#3f6a22', '#5a8a30'] }),
        xpeShine(100, 100, 72, .4),
    ].join(''),

    // Menestrón: green basil-tinted minestrone with beef, white beans, macaroni, potato, a slice of choclo, cabbage and carrot, grated cheese
    pe_menestron: p => [
        xpeSoupBowl(p, { band: '#2f7a52' }),
        K.liquid(p, { R: 74, c: '#7f9a40', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#9ab454" opacity=".4"/>`,
        `<g ${p.sh(.6)}>`,
        K.leafPiece(p, 70, 80, 30, 20, { c: '#c8d88a', cooked: true, seed: 1 }), K.leafPiece(p, 136, 126, 28, -30, { c: '#c8d88a', cooked: true, seed: 2 }),
        xpeBeefChunk(p, 104, 84, 30, 10, { seed: 1, c: '#7e4a2a' }), xpeBeefChunk(p, 72, 124, 28, -30, { seed: 2, c: '#7e4a2a' }),
        xpeChoclo(p, 136, 84, 30, 30, 70),
        K.potato(p, 108, 126, 24, 10, { c: '#f0dc9a', seed: 1 }), K.potato(p, 52, 100, 20, 40, { c: '#f0dc9a', seed: 2 }),
        `</g>`,
        ...xpeSpots('mnb', 10, 60, 60, 13).map(([x, y, r]) => xpePulse(p, x, y, 11, r, { c: '#f4ecd6', eye: '#c9b98e' })),
        ...xpeSpots('mnm', 8, 60, 60, 15).map(([x, y, r]) => K.macaroni(p, x, y, 13, r)),
        ...xpeSpots('mnc', 7, 60, 60, 15).map(([x, y, r]) => xpeDice(p, x, y, 8, r, '#ef7f30')),
        K.sprinkle(p, 100, 100, 110, { c: '#fbf3dc', n: 30, r: 1 }),
        xpeShine(100, 100, 74, .4),
    ].join(''),

    // Sancochado: enamel bowl of light beef broth with a big beef shank, potato, sweet potato, yuca, a piece of choclo, a cabbage wedge and carrot
    pe_sancochado: p => [
        xpeEnamel(p, { rim: '#1f4f8f' }),
        K.liquid(p, { R: 76, c: '#d2b57c', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#e2c894" opacity=".45"/>`,
        `<g ${p.sh(1)}>`,
        `<g ${T(130, 124, 30)}><path d="${xpeSm(ring(1, 9, .15, rng('scab'), 34, 26), true)}" fill="${p.g('#c8d890', .3, .25)}" stroke="#7a9a4a" stroke-width=".8"/><path d="M-30,0 Q0,-5 30,0 M-18,-14 Q-6,-2 -16,14 M6,-18 Q14,0 8,18" stroke="#eef4d0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/></g>`,
        xpeMeat(p, 80, 80, 64, -10, { c: '#7e4a2a', fat: '#ecd2a0', bone: true, seed: 1 }),
        K.potato(p, 138, 70, 40, 20, { c: '#f2dc96', seed: 1 }),
        xpeCamote(p, 60, 130, 40, 0, { seed: 1 }),
        xpeYuca(p, 100, 146, 54, 22, -10, { seed: 1 }),
        xpeChoclo(p, 156, 104, 44, 30, 80),
        K.carrotChunk(p, 110, 104, 26, 30), K.carrotChunk(p, 46, 96, 22, -40), K.carrotChunk(p, 100, 58, 20, 80),
        `</g>`,
        xpeOil(p, 100, 100, 130, { n: 8, c: '#f0c860', rmax: 2.4 }),
        xpeHerbs(p, 100, 100, 110, { n: 10 }),
        xpeShine(100, 100, 76, .4),
    ].join(''),

    // Chilcano de pescado: clear pale fish broth with pieces of white fish, spring onion, coriander, ginger, ají limo rings and lime
    pe_chilcano: p => [
        xpeSoupBowl(p, { band: '#2f5f9a' }),
        K.liquid(p, { R: 74, c: '#dccb98', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#e8dcb4" opacity=".5"/>`,
        xpeFish(p, 82, 86, 62, 42, -20, { seed: 1, c: '#fbf6ec' }), xpeFish(p, 126, 120, 58, 40, 25, { seed: 2, c: '#fbf6ec' }), xpeFish(p, 72, 134, 40, 28, 60, { seed: 3, c: '#fbf6ec' }),
        K.shreds(p, 104, 98, 70, { c: '#f2df9c', n: 10, w: 1.4, len: .5, seed: 2 }),
        ...xpeSpots('chls', 16, 62, 62, 10).map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.8" fill="none" stroke="#5fa03a" stroke-width="1.7"/>`),
        xpeChiliRing(p, 118, 82, 6), xpeChiliRing(p, 98, 112, 6), xpeChiliRing(p, 60, 106, 5.5),
        xpeLeaf(p, 104, 76, 15, -20), xpeLeaf(p, 108, 140, 14, 60), xpeLeaf(p, 140, 92, 14, 110), xpeLeaf(p, 58, 70, 13, 30),
        xpeLime(p, 150, 144, 24, -30),
        xpeShine(100, 100, 74, .45),
    ].join(''),

    // Parihuela: clay cazuela of spicy red-orange seafood soup with fish, whole shrimp, squid rings, open mussels, coriander and lime
    pe_parihuela: p => [
        xpeClay(p, { c: '#a8502a' }),
        K.liquid(p, { R: 76, c: '#c8552c', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#dc7040" opacity=".4"/>`,
        xpeFish(p, 96, 100, 52, 36, -10, { seed: 1, c: '#f4e0c8' }),
        xpeMussel(p, 58, 84, 40, -40), xpeMussel(p, 142, 124, 40, 140), xpeMussel(p, 120, 62, 36, 20), xpeMussel(p, 66, 138, 36, 60),
        K.squidRing(p, 140, 92, 18, 0), K.squidRing(p, 98, 140, 18, 30), K.squidRing(p, 52, 112, 16, 0),
        xpeShrimp(p, 110, 116, 36, 40), xpeShrimp(p, 82, 64, 34, -60), xpeShrimp(p, 150, 70, 30, 100),
        xpeOil(p, 100, 100, 130, { n: 10, c: '#e8743a', rmax: 3 }),
        xpeLeaf(p, 92, 92, 14, -20), xpeLeaf(p, 126, 136, 13, 40), xpeLeaf(p, 64, 112, 13, 110),
        xpeHerbs(p, 100, 100, 120, { n: 16 }),
        xpeLime(p, 152, 150, 22, -30),
        xpeShine(100, 100, 76, .35),
    ].join(''),

    // Shambar: clay cazuela of thick brown wheat and bean soup with smoked pork, lots of chopped coriander, toasted cancha on top
    pe_shambar: p => [
        xpeClay(p, { c: '#9a5a34' }),
        K.liquid(p, { R: 76, c: '#946436', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#a87848" opacity=".4"/>`,
        xpeDots(p, 100, 100, 144, { cols: ['#d8b47a', '#c49a5e', '#e2c48c'], n: 110, size: 3.2, len: 1.4, seed: 1, hi: .3 }),
        `<g ${p.sh(.5)}>`,
        ...xpeSpots('shb', 14, 62, 62, 13).map(([x, y, r], i) => i % 3 === 0 ? xpePulse(p, x, y, 11, r, { c: '#9ab85a', eye: '#5a7a2a' }) : xpePulse(p, x, y, 12, r, { c: i % 2 ? '#e2c27a' : '#8a5a3a', eye: '#5a3a1a' })),
        xpeMeat(p, 84, 84, 32, 10, { c: '#9a4e2a', fat: '#f0d6a8', seed: 1 }), xpeMeat(p, 124, 116, 30, -30, { c: '#9a4e2a', fat: '#f0d6a8', seed: 2 }), xpeMeat(p, 70, 128, 26, 50, { c: '#9a4e2a', fat: '#f0d6a8', seed: 3 }),
        `</g>`,
        xpeHerbs(p, 100, 100, 130, { n: 40, cols: ['#2f6a22', '#4a8a30', '#5aa63c'] }),
        `<g ${p.sh(.5)}>`, ...xpeSpots('shc', 6, 26, 22, 11, 128, 80).map(([x, y, r], i) => xpeCancha(p, x, y, 13, r, { seed: i })), `</g>`,
        xpeShine(100, 100, 76, .35),
    ].join(''),

    // Sopa de morón: pale thick cracked-wheat soup with potato and carrot dice, peas, cubes of queso fresco and parsley
    pe_sopa_moron: p => [
        xpeSoupBowl(p, { band: '#c8392e' }),
        K.liquid(p, { R: 74, c: '#d6bc84', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#e6d2a2" opacity=".45"/>`,
        xpeDots(p, 100, 100, 140, { cols: ['#c8a868', '#e8d4a0', '#b8985a'], n: 160, size: 3.2, len: 1.4, seed: 2, hi: .3 }),
        `<g ${p.sh(.6)}>`,
        ...xpeSpots('smv', 18, 58, 58, 16).map(([x, y, r], i) => { const t = i % 3; return t === 0 ? xpeDice(p, x, y, 14, r, '#f2dc96') : t === 1 ? xpeDice(p, x, y, 10, r, '#ef7f30') : xpeDice(p, x, y, 12, r, '#fbf8ee'); }),
        `</g>`,
        ...xpeSpots('smp', 9, 58, 58, 13).map(([x, y]) => xpePea(p, x + 1, y + 2, 7)),
        xpeHerbs(p, 100, 100, 120, { n: 22 }),
        xpeShine(100, 100, 74, .4),
    ].join(''),

    // Crema de zapallo: smooth bright orange pumpkin cream with a swirl of milk, golden croutons, cheese and parsley
    pe_crema_zapallo: p => [
        K.bowl(p, { glaze: '#2f5f9a', inside: '#f7f3eb' }),
        K.liquid(p, { R: 76, c: '#e8902a', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#f4a848" opacity=".45"/>`,
        xpeSwirl(100, 100, 46, '#f8e8d0', { w: 4, op: .9 }),
        xpeCrouton(p, 132, 80, 15, 20), xpeCrouton(p, 70, 120, 14, -15), xpeCrouton(p, 124, 132, 13, 40), xpeCrouton(p, 66, 78, 13, 10), xpeCrouton(p, 146, 112, 12, -30),
        K.sprinkle(p, 100, 100, 70, { c: '#fbf3dc', n: 20, r: 1 }),
        xpeHerbs(p, 100, 100, 50, { n: 10 }),
        xpeShine(100, 100, 76, .5),
    ].join(''),

    // Sopa wantán: chifa bowl of clear chicken broth with plump wontons, pak choi, sliced chicken and red-edged roast pork, spring onion
    pe_sopa_wantan: p => [
        xpeSoupBowl(p, { band: '#c8392e' }),
        K.liquid(p, { R: 74, c: '#e2c886', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#eed8a4" opacity=".45"/>`,
        xpeBokChoy(p, 140, 108, 60, 60), xpeBokChoy(p, 62, 112, 54, -70),
        xpeWonton(p, 82, 78, 42, 10, { seed: 1 }), xpeWonton(p, 120, 74, 40, -20, { seed: 2 }), xpeWonton(p, 100, 116, 44, 30, { seed: 3 }), xpeWonton(p, 70, 140, 34, 0, { seed: 4 }),
        `<g ${p.sh(.6)}>`, K.porkSlice(p, 132, 140, 34, -20, { c: '#c8523a', fat: '#f2c8a8', seed: 1 }), K.porkSlice(p, 52, 84, 30, 60, { c: '#c8523a', fat: '#f2c8a8', seed: 2 }), `</g>`,
        xpeChickenChunk(p, 108, 148, 20, 10, { seed: 1, c: '#f0dcb4' }),
        xpeOil(p, 100, 100, 130, { n: 12, c: '#f2c45a', rmax: 2.6 }),
        ...xpeSpots('wts', 18, 62, 62, 9).map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="none" stroke="#5fa03a" stroke-width="1.6"/>`),
        xpeShine(100, 100, 74, .4),
    ].join(''),

    // Patasca: clay cazuela of ají panca-tinted broth with honeycomb tripe, big white mote kernels, potato and fresh mint
    pe_patasca: p => [
        xpeClay(p, { c: '#b25a30' }),
        K.liquid(p, { R: 76, c: '#c48c50', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#d4a26a" opacity=".4"/>`,
        `<g ${p.sh(.6)}>`,
        xpeTripe(p, 82, 84, 42, 30, -20, { seed: 1 }), xpeTripe(p, 126, 120, 40, 28, 30, { seed: 2 }), xpeTripe(p, 130, 76, 32, 24, 70, { seed: 3 }),
        K.potato(p, 70, 128, 28, 20, { c: '#f2dc96', seed: 1 }),
        `</g>`,
        `<g ${p.sh(.4)}>`, ...xpeSpots('ptm', 22, 64, 64, 12).map(([x, y, r]) => xpeMote(p, x, y, 11, r)), `</g>`,
        xpeOil(p, 100, 100, 130, { n: 12, c: '#e0742a', rmax: 3 }),
        xpeLeaf(p, 100, 100, 16, -20, { c: '#3f8a34' }), xpeLeaf(p, 112, 92, 14, 40, { c: '#4a9a3a' }), xpeLeaf(p, 92, 112, 13, 110, { c: '#3f8a34' }),
        xpeShine(100, 100, 76, .35),
    ].join(''),

    // Chupe de habas: deep plate of pale creamy chowder with bright green fava beans, potato, a poached egg, queso fresco and mint
    pe_chupe_habas: p => [
        xpeDeep(p, '#2f7a52'),
        K.liquid(p, { R: 72, c: '#e6d8ac', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="48" fill="#f2e8c8" opacity=".5"/>`,
        `<g ${p.sh(.6)}>`,
        K.potato(p, 64, 84, 28, 20, { c: '#f2dc96', seed: 1 }), K.potato(p, 138, 124, 28, -30, { c: '#f2dc96', seed: 2 }), K.potato(p, 76, 136, 24, 60, { c: '#f2dc96', seed: 3 }),
        ...xpeSpots('chhb', 18, 60, 60, 14).map(([x, y, r]) => xpePulse(p, x, y, 15, r, { c: '#8cc35a', eye: '#4f7a2a' })),
        `</g>`,
        xpePoached(p, 104, 98, 52, -10),
        xpeQueso(p, 130, 76, 16, 13, 10, { seed: 1 }), xpeQueso(p, 104, 140, 15, 12, -20, { seed: 2 }),
        xpeLeaf(p, 80, 108, 14, -30, { c: '#3f8a34' }), xpeLeaf(p, 150, 96, 13, 60, { c: '#3f8a34' }),
        K.sprinkle(p, 100, 100, 110, { c: '#6a5a3a', n: 14, r: .6 }),
        xpeShine(100, 100, 72, .45),
    ].join(''),

    // Inchicapi: clay cazuela of creamy beige peanut and cornmeal chicken soup with yuca, chopped peanuts and sacha culantro leaves
    pe_inchicapi: p => [
        xpeClay(p, { c: '#8e5a36', dots: '#e8c890' }),
        K.liquid(p, { R: 76, c: '#d4a868', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#e2bc84" opacity=".45"/>`,
        `<g ${p.sh(.7)}>`,
        xpeChickenChunk(p, 82, 84, 44, -20, { seed: 1, c: '#e2b474' }), xpeChickenChunk(p, 126, 118, 40, 30, { seed: 2, c: '#dcaa6a' }), xpeChickenChunk(p, 128, 74, 30, 60, { seed: 3, c: '#e2b474' }),

        xpeYuca(p, 70, 128, 40, 20, 30, { seed: 1 }),
        `</g>`,
        K.sprinkle(p, 100, 100, 120, { c: '#b07a3a', n: 30, r: 1.3 }),
        ...[[100, 100, -30], [112, 140, 20], [56, 100, 80], [150, 104, -60]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="M-16,0 C-10,-6 8,-6 16,0 C8,6 -10,6 -16,0Z" fill="${p.g('#3f8a2c', .3, .25)}" stroke="#2a5f1e" stroke-width=".6"/></g><path d="M-14,0 L14,0" stroke="#8cc86a" stroke-width=".8"/></g>`),
        xpeHerbs(p, 100, 100, 110, { n: 14 }),
        xpeShine(100, 100, 76, .35),
    ].join(''),

    // Sustancia de carne: clear amber beef broth with fine noodles, beef chunks, yellow potato, carrot rounds and parsley
    pe_sustancia: p => [
        xpeSoupBowl(p, { band: '#2f7a52' }),
        K.liquid(p, { R: 74, c: '#c49450', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#d4ac6c" opacity=".4"/>`,
        xpeBrothNoodles(p, 66, { c: '#f2dca0', w: 1.8, n: 40, seed: 2 }),
        `<g ${p.sh(.8)}>`,
        xpeBeefChunk(p, 84, 84, 36, 10, { seed: 1, c: '#7e4a2a' }), xpeBeefChunk(p, 128, 118, 34, -30, { seed: 2, c: '#7e4a2a' }), xpeBeefChunk(p, 70, 132, 28, 40, { seed: 3, c: '#86502e' }),
        K.potato(p, 130, 76, 28, 20, { c: '#f2cf62', seed: 1 }),
        `</g>`,
        K.carrotRound(p, 104, 108, 15), K.carrotRound(p, 58, 100, 14), K.carrotRound(p, 104, 146, 14), K.carrotRound(p, 148, 100, 13),
        xpeOil(p, 100, 100, 130, { n: 14, c: '#e8b04a', rmax: 3 }),
        xpeHerbs(p, 100, 100, 110, { n: 18 }),
        xpeShine(100, 100, 74, .45),
    ].join(''),

    // Crema de espárragos: pale green asparagus cream with a swirl of milk, asparagus tips and black pepper
    pe_crema_esparragos: p => [
        K.bowl(p, { glaze: '#e9e3d7', inside: '#f7f3eb' }),
        K.liquid(p, { R: 76, c: '#b2c06e', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#c6d488" opacity=".45"/>`,
        xpeSwirl(100, 100, 46, '#f4f2e2', { w: 4, op: .9 }),
        ...[[80, 80, -30], [118, 76, 20], [128, 116, 70], [80, 122, -70], [104, 102, 10]].map(([x, y, r]) => `<g ${T(x, y, r, 1.45)}><g ${p.sh(.5)}><rect x="-3.6" y="-4" width="7.2" height="22" rx="3.6" fill="${p.g('#6aa83e', .3, .25)}" stroke="#3a6a1e" stroke-width=".6"/><path d="M0,-14 C5,-12 5,-4 3.6,-2 L-3.6,-2 C-5,-4 -5,-12 0,-14Z" fill="${p.g('#4f8a2e', .3, .25)}" stroke="#2f5a1a" stroke-width=".6"/></g><path d="M-3.4,-8 l3.4,2 l3.4,-2 M-3.4,-4 l3.4,2 l3.4,-2 M-3,6 l3,1.5 M0,12 l3,-1.5" stroke="#2f5a1a" stroke-width=".7" fill="none"/></g>`),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 26, r: .7 }),
        K.sprinkle(p, 100, 100, 60, { c: '#fbf3dc', n: 14, r: 1 }),
        xpeShine(100, 100, 76, .5),
    ].join(''),

    // Caldo verde: clay cazuela of bright green herb broth (parsley, coriander, mint, huacatay) with whole potatoes, poached eggs and queso fresco
    pe_caldo_verde: p => [
        xpeClay(p, { c: '#a8502a' }),
        K.liquid(p, { R: 76, c: '#6f9a3c', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#8ab44e" opacity=".4"/>`,
        `<g ${p.sh(.8)}>`,
        xpePotatoRound(p, 64, 92, 34, 0, { seed: 1, c: '#f2e0a6' }), xpePotatoRound(p, 136, 132, 34, 30, { seed: 2, c: '#f2e0a6' }), xpePotatoRound(p, 140, 70, 30, 0, { seed: 3, c: '#f2e0a6' }),
        `</g>`,
        xpePoached(p, 96, 74, 46, 10), xpePoached(p, 82, 130, 44, -20),
        xpeQueso(p, 122, 104, 28, 20, -16, { seed: 1 }), xpeQueso(p, 56, 120, 18, 14, 30, { seed: 2 }),
        xpeHerbs(p, 100, 100, 140, { n: 46, cols: ['#2f6a22', '#4a8a30', '#5aa63c'] }),
        xpeShine(100, 100, 76, .4),
    ].join(''),

    // Sopa fuchifú: chifa bowl of clear chicken broth with fluffy egg ribbons, egg noodles, shredded chicken, pak choi and spring onion
    pe_fuchifu: p => [
        xpeSoupBowl(p, { band: '#2f5f9a' }),
        K.liquid(p, { R: 74, c: '#e4cc8a', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#f0dca8" opacity=".45"/>`,
        xpeBrothNoodles(p, 64, { c: '#f2d68a', w: 2.6, n: 28, seed: 3 }),
        xpeBokChoy(p, 140, 116, 54, 50),
        xpeEggCloud(p, 84, 78, 66, -20, { seed: 1, c: '#f6c42c' }), xpeEggCloud(p, 120, 96, 60, 30, { seed: 2, c: '#f6c42c' }), xpeEggCloud(p, 76, 124, 58, 10, { seed: 3, c: '#f6c42c' }), xpeEggCloud(p, 118, 144, 42, -10, { seed: 4, c: '#f6c42c' }),
        xpeShred(p, 98, 108, 40, { seed: 1, n: 10, cols: ['#f6e6c4', '#ecd2a0'], ol: '#c99a52' }), xpeShred(p, 66, 98, 26, { seed: 2, n: 6, cols: ['#f6e6c4', '#ecd2a0'], ol: '#c99a52' }),
        ...xpeSpots('fcs', 20, 62, 62, 9).map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="none" stroke="#5fa03a" stroke-width="1.6"/>`),
        xpeOil(p, 100, 100, 130, { n: 8, c: '#f2c45a', rmax: 2.4 }),
        xpeShine(100, 100, 74, .4),
    ].join(''),

    // Caldo de cordero: enamel bowl of lamb broth with fat droplets, lamb pieces on the bone, potato, carrot, cabbage and fresh mint
    pe_caldo_cordero: p => [
        xpeEnamel(p, { rim: '#8a2e1e' }),
        K.liquid(p, { R: 76, c: '#d4b880', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#e2cc98" opacity=".4"/>`,
        `<g ${p.sh(.8)}>`,
        K.leafPiece(p, 134, 132, 32, 20, { c: '#cddc96', cooked: true, seed: 1 }),
        xpeMeat(p, 82, 80, 44, -10, { c: '#9a6440', fat: '#f0dcb4', bone: true, seed: 1 }), xpeMeat(p, 128, 92, 38, 40, { c: '#946040', fat: '#f0dcb4', bone: true, seed: 2 }),
        K.potato(p, 70, 130, 30, 20, { c: '#f2dc96', seed: 1 }), K.potato(p, 104, 140, 24, -30, { c: '#f2dc96', seed: 2 }),
        K.carrotChunk(p, 104, 112, 20, 30), K.carrotChunk(p, 52, 100, 18, -40),
        `</g>`,
        xpeDots(p, 100, 100, 130, { cols: ['#fbf6e6'], n: 30, size: 2.6, len: 1.6, seed: 4, hi: .2 }),
        xpeOil(p, 100, 100, 130, { n: 16, c: '#f2cc6a', rmax: 3 }),
        xpeLeaf(p, 100, 92, 15, -20, { c: '#3f8a34' }), xpeLeaf(p, 116, 70, 13, 40, { c: '#4a9a3a' }), xpeLeaf(p, 148, 112, 12, 110, { c: '#3f8a34' }),
        xpeShine(100, 100, 76, .4),
    ].join(''),

    // Dieta de pollo: light clear chicken broth with chicken, potato, carrot and pumpkin cubes, a little pasta, parsley
    pe_dieta_pollo: p => [
        xpeDeep(p, '#2f7a52'),
        K.liquid(p, { R: 72, c: '#e8d6a0', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="48" fill="#f2e6c2" opacity=".5"/>`,
        xpeBrothNoodles(p, 62, { c: '#f6e6b8', w: 1.6, n: 26, seed: 4 }),
        `<g ${p.sh(.7)}>`,
        xpeChickenChunk(p, 86, 86, 40, -20, { seed: 1, c: '#f2dcb0' }), xpeChickenChunk(p, 124, 120, 34, 30, { seed: 2, c: '#f0d6a8' }),
        ...xpeSpots('dpv', 14, 58, 58, 17).map(([x, y, r], i) => { const t = i % 3; return t === 0 ? xpeDice(p, x, y, 13, r, '#f2e0a6') : t === 1 ? xpeDice(p, x, y, 11, r, '#ef7f30') : xpeDice(p, x, y, 13, r, '#f0a03a'); }),
        `</g>`,
        xpeHerbs(p, 100, 100, 110, { n: 20 }),
        xpeShine(100, 100, 72, .45),
    ].join(''),

    // Lawa de choclo: clay cazuela of thick creamy yellow fresh-corn soup with whole kernels, potato, queso fresco cubes and huacatay
    pe_lawa_choclo: p => [
        xpeClay(p, { c: '#b25a30' }),
        K.liquid(p, { R: 76, c: '#ead07a', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#f4de94" opacity=".5"/>`,
        xpeDots(p, 100, 100, 140, { cols: ['#f6e292', '#e4c25a'], n: 130, size: 3, len: .8, seed: 1, hi: .35 }),
        `<g ${p.sh(.6)}>`,
        K.potato(p, 74, 84, 28, 20, { c: '#f4e2a6', seed: 1 }), K.potato(p, 134, 126, 28, -30, { c: '#f4e2a6', seed: 2 }),
        ...xpeSpots('lwk', 16, 60, 60, 12).map(([x, y, r]) => xpeKernel(p, x, y, 8, r, { c: '#f6d860' })),
        `</g>`,
        xpeQueso(p, 124, 80, 18, 14, 10, { seed: 1 }), xpeQueso(p, 78, 128, 17, 14, -20, { seed: 2 }), xpeQueso(p, 104, 112, 15, 13, 30, { seed: 3 }),
        xpeLeaf(p, 98, 92, 15, -20, { c: '#2f5a22' }), xpeLeaf(p, 146, 100, 13, 60, { c: '#2f5a22' }), xpeLeaf(p, 62, 110, 12, 120, { c: '#2f5a22' }),
        xpeShine(100, 100, 76, .4),
    ].join(''),
};
