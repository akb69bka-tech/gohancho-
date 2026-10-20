// World edition: Peru (pe_*) — everyday Peruvian home cooking (comida criolla casera)
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// local helpers (wp = World Peru)
// =========================================================
function wpSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function wpOutline(p, c, r = .55){
    const id = p.def('wpOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const wpBlur = (p, s = 2) => `filter="url(#${p.def('wpbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const wpShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .2)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .64)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// evenly spread spots (no heavy overlaps)
function wpSpots(seed, n, rx, ry, minD, cx = 100, cy = 100){
    const R = rng('wpspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()), x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// mound of a smooth sauce / purée
function wpMound(p, x, y, rx, ry, c, { seed = 1, l = .25, d = .3, jit = .14 } = {}){
    const R = rng(p.id + 'wpmnd' + seed);
    return `<path ${T(x, y)} d="${wpSm(ring(rx, 12, jit, R, 1, ry / rx), true)}" fill="${p.rg(c, l, d, .4, .38)}"/>`;
}
// rice mound (grains as short strokes) — same drawing as e_rice_noodle / w_us
function wpRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, hiK = .85 } = {}){
    const R = rng(p.id + 'wpRice' + seed + x + y);
    const shape = wpSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('wpRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// pasta swirl (spaghetti nest)
function wpPasta(p, x, y, s, { c = '#f0d58e', w = 2.2, n = 40, seed = 1, sy = .92, outline = null, layers = 5 } = {}){
    const R = rng(p.id + 'wpPs' + seed);
    const ol = wpOutline(p, outline || dk(c, .3), .5);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.18 + Math.sqrt(R()) * .8), a0 = R() * 6.28, sweep = 1.4 + R() * 2.4;
        const cx = x + (R() - .5) * s * .1, cy = y + (R() - .5) * s * .1;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .18); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const m = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2);
        L[i % layers][m < -.4 ? 1 : m > .8 ? 2 : 0] += wpSm(pts);
    }
    const base = `<path ${T(x, y)} d="${wpSm(ring(s / 2 * .9, 12, .12, R, 1, sy), true)}" fill="${dk(c, .2)}"/>`;
    const body = L.map(([a, b, d]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${dk(c, .1)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .25)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`).join('');
    return `<g ${p.sh(.9)}>${base}${body}</g>`;
}
// many tiny round things in one path per colour (lentils, quinoa, peas, beans)
function wpDots(p, x, y, s, { cols = ['#6b4a2e'], n = 60, size = 3, seed = 1, sy = 1, len = .8, hi = .45 } = {}){
    const R = rng(p.id + 'wpdt' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, b = R() * 6.28; ds[Math.floor(R() * cols.length)] += `M${f1(x + Math.cos(a) * d)} ${f1(y + Math.sin(a) * d * sy)}l${f1(Math.cos(b) * len)} ${f1(Math.sin(b) * len)}`; }
    return cols.map((c, i) => `<path d="${ds[i]}" stroke="${dk(c, .3)}" stroke-width="${f1(size + .9)}" stroke-linecap="round" fill="none"/><path d="${ds[i]}" stroke="${c}" stroke-width="${size}" stroke-linecap="round" fill="none"/>`).join('')
        + `<path d="${ds.join('')}" stroke="#fff" stroke-width="${f1(size * .3)}" stroke-linecap="round" fill="none" opacity="${hi}" transform="translate(${f1(-size * .22)} ${f1(-size * .22)})"/>`;
}
// small dice (soup vegetables, potato cubes)
function wpDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1, skin = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f1(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f1(s * .86)}" height="${f1(s * .86)}" rx="${f1(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f1(h * .45)}" width="${f1(s * .86)}" height="${f1(s * .28)}" rx="1" fill="${skin}"/>` : ''}
        <path d="M${f1(-h + s * .18)},${f1(-h + s * .2)} L${f1(-h + s * .62)},${f1(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// chopped herbs (coriander / parsley)
function wpHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'], sy = 1 } = {}){
    const R = rng(p.id + 'wpHb' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 1 + R();
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R(), r2 = rr * (.6 + R() * .6); return `${f1(cx + Math.cos(aa) * r2)},${f1(cy + Math.sin(aa) * r2)}`; });
        ds[i % cols.length] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// coriander leaf: three rounded lobes
function wpLeaf(p, x, y, s, r = 0, { c = '#3f8a2c' } = {}){
    const d = 'M0,8 C-1,5 -2,3 -3,2 C-7,4 -10,1 -8,-2 C-10,-5 -6,-8 -3,-6 C-3,-10 3,-10 3,-6 C6,-8 10,-5 8,-2 C10,1 7,4 3,2 C2,3 1,5 0,8Z';
    return `<g ${T(x, y, r, s / 20)}><path d="${d}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M0,7 L0,-6 M0,0 L-6,-3 M0,0 L6,-3" stroke="${lt(c, .4)}" stroke-width=".6" fill="none"/></g>`;
}
// lettuce leaf with frilly edge
function wpLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468' } = {}){
    const R = rng(p.id + 'wplt' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .08); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .46)},2 Q0,${f1(-s * .04)} ${f1(s * .44)},0" stroke="#eef8d8" stroke-width="${f1(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f1(s * t)},${f1(-s * .01)} q${f1(s * .08)},${f1(i % 2 ? s * .2 : -s * .2)} ${f1(s * .16)},${f1(i % 2 ? s * .24 : -s * .24)}" stroke="#e6f4c8" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}
// red onion: thin sliver (salsa criolla) — white flesh with a purple skin edge, slightly translucent
function wpSliver(p, x, y, s, r = 0, { span = 1.5, w = null, pale = false } = {}){
    const R0 = s / 2, a0 = -Math.PI / 2 - span / 2, a1 = a0 + span, sw = w || Math.max(2.2, s * .12);
    const d = `M${f1(Math.cos(a0) * R0)},${f1(Math.sin(a0) * R0)}A${f1(R0)},${f1(R0 * .85)} 0 0 1 ${f1(Math.cos(a1) * R0)},${f1(Math.sin(a1) * R0)}`;
    const skin = pale ? '#c58ab0' : '#8e2f6c';
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${skin}" stroke-width="${f1(sw + 1.4)}" fill="none" stroke-linecap="round" opacity=".9"/><path d="${d}" stroke="#f7eef4" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round" opacity=".95"/><path d="${d}" stroke="#fff" stroke-width="${f1(sw * .3)}" fill="none" stroke-linecap="round" opacity=".8" transform="translate(-.3 -.4)"/></g>`;
}
// red onion: thick wedge for lomo saltado (crescent layers, purple rims, lightly cooked)
function wpRedOnion(p, x, y, s, r = 0, { layers = 2 } = {}){
    const k = s / 20;
    let out = '';
    for (let i = 0; i < layers; i++){
        const o = i * 2.4, R1 = 10 - o, R2 = 7.4 - o;
        out += `<path d="M${-R1},${2 + o * .6} A${R1},${R1 * .82} 0 0 1 ${R1},${2 + o * .6} L${R2},${2.6 + o * .6} A${R2},${R2 * .72} 0 0 0 ${-R2},${2.6 + o * .6}Z" fill="${p.g(i ? '#f2e2ec' : '#e8cfe0', .3, .15)}" stroke="#8e2f6c" stroke-width="1" opacity=".92"/>`;
    }
    return `<g ${T(x, y, r, k)}>${out}<path d="M-7.5,-.5 A8.5,7 0 0 1 -1,-5.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// strip of ají amarillo (yellow-orange, slightly curved) or red pepper
function wpBand(p, x, y, L, W, r = 0, { c = '#f0a21e', bend = .2, hi = true } = {}){
    const d = `M${f1(-L / 2)},0 Q0,${f1(-L * bend)} ${f1(L / 2)},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#2b1607" stroke-width="${f1(W + 1)}" fill="none" stroke-linecap="round" opacity=".2" transform="translate(1 1.4)"/><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(W + 1.2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${W}" fill="none" stroke-linecap="round"/>
        ${hi ? `<path d="M${f1(-L * .36)},${f1(-W * .22 - L * bend * .28)} Q0,${f1(-L * bend * .5 - W * .25)} ${f1(L * .3)},${f1(-W * .22 - L * bend * .2)}" stroke="${lt(c, .55)}" stroke-width="${f1(Math.max(.8, W * .22))}" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}</g>`;
}
// thin beef strip (seared, glossy)
function wpBeef(p, x, y, s, r = 0, { c = '#7d4326', seed = 1 } = {}){
    const R = rng(p.id + 'wpBf' + seed + x + y);
    const folds = Array.from({ length: 3 }, (_, i) => `M${f1(-8 + i * 8 + (R() - .5) * 4)},${f1(-5 + R() * 2)} q${f1((R() - .5) * 5)},5 ${f1((R() - .5) * 3)},${f1(9 + R() * 2)}`).join('');
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.6)}><path d="${wpSm(ring(14, 15, .3, R, 1.15, .55), true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="${folds}" stroke="${dk(c, .42)}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M2,3 Q7,1.5 11,2.5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// beef chunk for stew (seco): rounded cube, dark braised brown
function wpBeefChunk(p, x, y, s, r = 0, { c = '#6e3d22', seed = 1 } = {}){
    const R = rng(p.id + 'wpBc' + seed + x + y);
    const pts = ring(s / 2, 8, .22, R, 1.1, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${wpSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f1(-s * .3)},${f1(s * .05)} q${f1(s * .12)},${f1(-s * .1)} ${f1(s * .26)},0 t${f1(s * .22)},0 M${f1(-s * .2)},${f1(s * .22)} q${f1(s * .12)},${f1(-s * .08)} ${f1(s * .24)},0" stroke="${dk(c, .45)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M${f1(-s * .3)},${f1(-s * .22)} Q${f1(-s * .05)},${f1(-s * .38)} ${f1(s * .22)},${f1(-s * .26)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".3"/></g>`;
}
// french fries: thick golden sticks (a few, individually)
function wpFry(p, x, y, L, W, r = 0, { c = '#f0c24a', seed = 1 } = {}){
    const R = rng(p.id + 'wpFr' + seed + x + y);
    const t1 = -L * .3 + R() * L * .6, t2 = -L * .3 + R() * L * .6;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${L}" height="${W}" rx="${f1(W * .28)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <ellipse cx="${f1(t1)}" cy="${f1(W * .12)}" rx="${f1(2 + R() * 3)}" ry="${f1(W * .3)}" fill="#c98a28" opacity=".45"/><ellipse cx="${f1(t2)}" cy="${f1(-W * .1)}" rx="${f1(1.5 + R() * 2)}" ry="${f1(W * .22)}" fill="#c98a28" opacity=".35"/>
        <path d="M${f1(-L / 2 + 3)},${f1(-W * .22)} L${f1(L / 2 - 4)},${f1(-W * .22)}" stroke="#fff6d0" stroke-width="1.3" stroke-linecap="round" opacity=".75"/></g>`;
}
// slice of boiled yellow potato (peeled, round, waxy yellow)
function wpPotatoRound(p, x, y, s, r = 0, { c = '#f0cf6a', seed = 1 } = {}){
    const R = rng(p.id + 'wpPr' + seed + x + y);
    const pts = ring(s / 2, 9, .1, R, 1, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${wpSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="${wpSm(pts.map(([a, b]) => [a * .72 - 1, b * .72 - 1]), true)}" fill="${lt(c, .18)}" opacity=".8"/>
        <path d="M${f1(-s * .3)},${f1(-s * .18)} Q${f1(-s * .1)},${f1(-s * .34)} ${f1(s * .14)},${f1(-s * .28)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// black botija olive (whole or half)
function wpOlive(p, x, y, s, r = 0, { c = '#3a2630' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="${p.rg(c, .3, .25, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        <ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .14)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" fill="#fff" opacity=".7"/></g>`;
}
// green pea
function wpPea(p, x, y, s = 7){
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s / 2)}" fill="${p.rg('#6db043', .3, .25, .35, .32)}" stroke="#3f7a24" stroke-width=".5"/><circle cx="${f1(x - s * .18)}" cy="${f1(y - s * .2)}" r="${f1(s * .12)}" fill="#fff" opacity=".7"/>`;
}
// lime wedge
function wpLime(p, x, y, s, r = 0, { c = '#5aa02e', flesh = '#c9e48a' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,2 A10,9 0 0 1 10,2 Q0,5 -10,2Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-8.4,2 A8.4,7.2 0 0 1 8.4,2 Q0,4 -8.4,2Z" fill="${flesh}"/>
        ${[-50, -25, 0, 25, 50].map(a => `<path transform="rotate(${a} 0 2)" d="M0,2 L0,-4" stroke="#f2f8d8" stroke-width=".8"/>`).join('')}
        <path d="M-6,-3.5 Q0,-6.5 5,-4.5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// shredded chicken (fibres)
function wpShred(p, x, y, s, { n = 14, seed = 1, cols = ['#f3e2bf', '#e2c48f'], ol = '#b8915c' } = {}){
    const R = rng(p.id + 'wpSh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .7, a = R() * Math.PI, L = s * (.25 + R() * .3), b = (R() - .5) * L * .5;
        ds[i % cols.length] += `M${f1(cx - Math.cos(a) * L / 2)},${f1(cy - Math.sin(a) * L / 2)}q${f1(Math.cos(a) * L / 2 - Math.sin(a) * b)},${f1(Math.sin(a) * L / 2 + Math.cos(a) * b)} ${f1(Math.cos(a) * L)},${f1(Math.sin(a) * L)}`;
    }
    return `<g ${p.sh(.5)}><g ${wpOutline(p, ol, .45)} fill="none" stroke-linecap="round">${cols.map((c, i) => `<path d="${ds[i]}" stroke="${c}" stroke-width="2.6"/>`).join('')}</g></g>`;
}
// chicken drumstick / leg, braised (bone to the right)
function wpDrumstick(p, x, y, s, r = 0, { c = '#c8863c' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae8c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <ellipse cx="-8" cy="3" rx="5" ry="3" fill="#8a4a16" opacity=".3"/><ellipse cx="2" cy="-4" rx="3.6" ry="2" fill="#8a4a16" opacity=".25"/>
        <path d="M-16,-5 Q-10,-11 -2,-9.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// chunk of chicken (soup), pale cooked
function wpChickenChunk(p, x, y, s, r = 0, { c = '#e6c48e', seed = 1 } = {}){
    const R = rng(p.id + 'wpCk' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.2, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${wpSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .3)},0 q${f1(s * .15)},${f1(-s * .08)} ${f1(s * .3)},0 t${f1(s * .25)},0 M${f1(-s * .22)},${f1(s * .16)} q${f1(s * .15)},${f1(-s * .06)} ${f1(s * .3)},0" stroke="${dk(c, .25)}" stroke-width=".6" fill="none" opacity=".55" stroke-linecap="round"/>
        <path d="M${f1(-s * .28)},${f1(-s * .2)} Q${f1(-s * .05)},${f1(-s * .34)} ${f1(s * .2)},${f1(-s * .24)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// white fish piece (sudado): pale flaky flesh, slightly translucent sauce tint
function wpFish(p, x, y, w, h, r = 0, { seed = 1, c = '#f4e6d0' } = {}){
    const R = rng(p.id + 'wpFi' + seed);
    const pts = ring(1, 13, .12, R, w / 2, h / 2);
    let fl = '';
    for (let i = 0; i < 5; i++){ const lx = -w * .36 + i * w * .18; fl += `<path d="M${f1(lx)},${f1(-h * .38)} Q${f1(lx + w * .08)},0 ${f1(lx - w * .02)},${f1(h * .38)}" stroke="${dk(c, .18)}" stroke-width="1" fill="none" opacity=".7"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${wpSm(pts, true)}" fill="${p.g(c, .25, .22)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>${fl}
        <path d="M${f1(-w * .34)},${f1(-h * .26)} Q${f1(-w * .1)},${f1(-h * .44)} ${f1(w * .2)},${f1(-h * .34)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// slice of fried ripe plantain: long oval, deep golden, caramelised dark edges and spots
function wpPlantain(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wpPl' + seed);
    const pts = ring(1, 14, .06, R, L / 2, W / 2).map(([a, b]) => [a, b * (1 - Math.abs(a) / L * .25)]);
    let sp = '';
    for (let i = 0; i < 6; i++) sp += `<ellipse cx="${f1((R() - .5) * L * .7)}" cy="${f1((R() - .5) * W * .5)}" rx="${f1(2.5 + R() * 5)}" ry="${f1(1.5 + R() * 2.5)}" fill="#8f4a12" opacity="${f1(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${wpSm(pts, true)}" fill="${p.g('#d97a1c', .3, .35)}" stroke="#7a3a0c" stroke-width=".9"/></g>
        <path d="${wpSm(pts.map(([a, b]) => [a * .84, b * .78]), true)}" fill="${p.rg('#f0a032', .3, .15, .4, .36)}"/>
        <g ${wpBlur(p, 1.6)}>${sp}<path d="${wpSm(pts.map(([a, b]) => [a * .96, b * .92]), true)}" fill="none" stroke="#9a4a10" stroke-width="4" opacity=".7"/></g>
        <path d="M${f1(-L * .36)},${f1(-W * .22)} Q${f1(-L * .1)},${f1(-W * .46)} ${f1(L * .22)},${f1(-W * .3)}" stroke="#fff6d8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// piece of choclo (large pale kernels) — cylinder seen from above, cut ends show the white core
function wpChoclo(p, x, y, L, W, r = 0){
    const pid = p.def('wpchoclopat', id => `<pattern id="${id}" width="9.4" height="8.6" patternUnits="userSpaceOnUse" patternTransform="translate(0 1)"><rect x=".6" y=".6" width="8.2" height="7.4" rx="2.6" fill="#f3e4a2" stroke="#c9ae5a" stroke-width=".7"/><ellipse cx="3.6" cy="3" rx="2.2" ry="1.4" fill="#fffbe4" opacity=".85"/></pattern>`);
    const gid = p.def('wpchoclograd', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#7a5a08" stop-opacity=".12"/><stop offset="1" stop-color="#6a4a08" stop-opacity=".5"/></linearGradient>`);
    const body = `M${f1(-L / 2)},${f1(-W / 2 + 2)} L${f1(L / 2)},${f1(-W / 2 + 2)} Q${f1(L / 2 + 2)},0 ${f1(L / 2)},${f1(W / 2 - 2)} L${f1(-L / 2)},${f1(W / 2 - 2)} Q${f1(-L / 2 - 2)},0 ${f1(-L / 2)},${f1(-W / 2 + 2)}Z`;
    const end = ex => `<ellipse cx="${f1(ex)}" cy="0" rx="${f1(W * .13)}" ry="${f1(W / 2 - 2.4)}" fill="${p.rg('#f8f0d2', .15, .15)}" stroke="#c9ae5a" stroke-width="1"/><ellipse cx="${f1(ex)}" cy="0" rx="${f1(W * .06)}" ry="${f1(W * .22)}" fill="#e8dcae"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${body}" fill="#e2cf86"/></g><path d="${body}" fill="url(#${pid})"/><path d="${body}" fill="url(#${gid})" stroke="#b8963c" stroke-width=".9"/>
        ${end(-L / 2 + W * .13)}${end(L / 2 - W * .13)}
        <path d="M${f1(-L * .34)},${f1(-W * .3)} L${f1(L * .3)},${f1(-W * .3)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/></g>`;
}
// slab of queso fresco (white, soft, a few small holes)
function wpQueso(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wpQs' + seed);
    let holes = '';
    for (let i = 0; i < 5; i++) holes += `<circle cx="${f1((R() - .5) * w * .7)}" cy="${f1((R() - .5) * h * .6)}" r="${f1(.6 + R() * .9)}" fill="#ddd4c0" opacity=".8"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${w}" height="${h}" rx="${f1(Math.min(w, h) * .16)}" fill="${p.g('#fbf8ee', .2, .16)}" stroke="#d2c9b2" stroke-width=".8"/></g>
        <rect x="${f1(-w / 2 + 2)}" y="${f1(h / 2 - 5)}" width="${w - 4}" height="3" rx="1.2" fill="#e8e0cc" opacity=".8"/>${holes}
        <path d="M${f1(-w * .36)},${f1(-h * .3)} L${f1(w * .2)},${f1(-h * .3)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/></g>`;
}
// slice of toasted bread (half, triangle)
function wpToast(p, x, y, s, r = 0){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}><path d="M-14,-12 Q-15,-15 -12,-15 L13,-15 Q15,-15 15,-12 L15,12 Q15,15 12,15 Z" fill="${p.g('#d9a04a', .3, .3)}" stroke="#9a6224" stroke-width=".9"/></g>
        <path d="M-10,-11 L11,-11 L11,10 Z" fill="${p.rg('#f0d59a', .2, .12, .4, .4)}"/>
        <g ${wpBlur(p, 1.4)}><ellipse cx="3" cy="-3" rx="6" ry="4" fill="#c27a22" opacity=".45"/><ellipse cx="6" cy="4" rx="3" ry="2.6" fill="#b06818" opacity=".4"/></g>
        <circle cx="-3" cy="-6" r="1" fill="#e0c080" opacity=".8"/><circle cx="4" cy="2" r="1.2" fill="#e0c080" opacity=".8"/></g>`;
}
// poached egg in soup: soft white with a domed yolk
function wpPoached(p, x, y, s, r = 0){
    const R = rng(p.id + 'wpPo' + x);
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.8)}><path d="${smooth(ring(19, 11, .26, R, 1.1, .9))}" fill="${p.rg('#fffdf6', .08, .1)}" stroke="#e5dccb" stroke-width=".9"/></g>
        <circle cx="1" cy="0" r="9" fill="${p.rg('#f6a81c', .3, .18, .35, .32)}" stroke="#d9890f" stroke-width=".8"/>
        <ellipse cx="-2" cy="-3" rx="3.4" ry="2" fill="#fff" opacity=".75"/></g>`;
}
// avocado slice (crescent): dark skin edge, green-yellow flesh
function wpAvocado(p, x, y, s, r = 0){
    const k = s / 20;
    const gid = p.def('wpavo', id => `<radialGradient id="${id}" cx=".5" cy=".95" r=".9"><stop offset="0" stop-color="#f3eba0"/><stop offset=".55" stop-color="#d8dc78"/><stop offset="1" stop-color="#8fb43a"/></radialGradient>`);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,4 C-10,-6 -4,-9 0,-9 C4,-9 10,-6 10,4 Q0,6.5 -10,4Z" fill="#2f4a14"/></g>
        <path d="M-9,3.6 C-9,-5 -3.6,-8 0,-8 C3.6,-8 9,-5 9,3.6 Q0,5.6 -9,3.6Z" fill="url(#${gid})"/>
        <path d="M-5.5,-3 Q-1,-6.6 4,-5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// hard-boiled egg slice
function wpEggSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .44)}" fill="${p.rg('#fffdf6', .1, .12)}" stroke="#d8d0bf" stroke-width=".6"/></g><circle r="${f1(s * .24)}" fill="${p.rg('#f6c23a', .25, .15)}"/><ellipse cx="${f1(-s * .22)}" cy="${f1(-s * .18)}" rx="${f1(s * .1)}" ry="${f1(s * .05)}" fill="#fff" opacity=".7"/></g>`;
}
// dollop of mayonnaise
function wpMayo(p, x, y, s, seed = 1){
    const R = rng(p.id + 'wpMy' + seed + x);
    return `<g ${p.sh(.5)}><path ${T(x, y)} d="${smooth(ring(s / 2, 8, .3, R, 1.2, .8))}" fill="${p.rg('#fffbef', .15, .1)}" stroke="#e6dcc4" stroke-width=".5"/></g><path d="M${f1(x - s * .3)},${f1(y - s * .1)} Q${f1(x - s * .05)},${f1(y - s * .34)} ${f1(x + s * .2)},${f1(y - s * .2)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
}

// ---------- vessels ----------
// everyday white Peruvian plate with a coloured line (varied per dish)
const wpPlate = (p, rim = '#2f7a52', o = {}) => K.plate(p, { rim, ...o });
// deep white soup bowl with a coloured band (sopero)
function wpSoupBowl(p, { band = '#2f7a52', inside = '#fbf8f1' } = {}){
    return K.bowl(p, { glaze: '#f4efe6', inside }) + `<circle cx="100" cy="100" r="83" fill="none" stroke="${band}" stroke-width="1.8" opacity=".85"/><circle cx="100" cy="100" r="88" fill="none" stroke="${band}" stroke-width=".8" opacity=".6"/>`;
}

// =========================================================
export default {
    // Arroz blanco: white plate with a thin red line, a moulded dome of fluffy white rice (loose grains)
    pe_staple: p => [
        wpPlate(p, '#c8392e'),
        wpRice(p, 100, 100, 118, { density: 1.3, grain: 4, tint: '#f6f3ea' }),
        `<path d="M62,86 Q68,64 90,54" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
    ].join(''),

    // Lomo saltado: white plate, rice at the left; at the right seared beef strips with red onion and tomato wedges, golden fries tossed through, pan juices, coriander
    pe_lomo_saltado: p => [
        wpPlate(p, '#2f5f9a'),
        wpRice(p, 58, 100, 64, { sy: 1.3, seed: 1 }),
        K.pool(p, 122, 104, 96, '#8a4a1c', { op: .55, seed: 1, sy: 1.1 }),
        `<g ${p.sh(.8)}>`,
        wpFry(p, 128, 66, 36, 8, -20, { seed: 1 }), wpFry(p, 146, 128, 34, 8, 60, { seed: 2 }), wpFry(p, 96, 140, 34, 8, -30, { seed: 3 }),
        wpBeef(p, 112, 80, 40, 20, { seed: 1 }), wpBeef(p, 146, 94, 38, -40, { seed: 2 }), wpBeef(p, 108, 118, 40, 70, { seed: 3 }), wpBeef(p, 138, 136, 36, 10, { seed: 4 }), wpBeef(p, 124, 100, 36, -15, { seed: 5 }), wpBeef(p, 150, 70, 32, 60, { seed: 6 }),
        wpRedOnion(p, 100, 96, 24, -30), wpRedOnion(p, 136, 116, 24, 150, { layers: 1 }), wpRedOnion(p, 120, 64, 20, 40), wpRedOnion(p, 114, 136, 20, 200),
        K.tomatoWedge(p, 134, 84, 24, 20), K.tomatoWedge(p, 104, 110, 24, -120), K.tomatoWedge(p, 152, 116, 22, 70),
        wpFry(p, 118, 92, 38, 8.5, 15, { seed: 4 }), wpFry(p, 140, 112, 36, 8.5, -60, { seed: 5 }), wpFry(p, 108, 128, 34, 8, 40, { seed: 6 }),
        wpBand(p, 128, 128, 16, 4, -20, { c: '#f0a21e', bend: .15 }), wpBand(p, 112, 72, 14, 4, 50, { c: '#f0a21e', bend: .15 }),
        `</g>`,
        K.glaze(p, 126, 104, 60, '#8a4416', { seed: 3, op: .18 }),
        wpHerbs(p, 126, 104, 80, { n: 18 }),
    ].join(''),

    // Ají de gallina: white plate, rice at the right; at the left yellow creamy ají sauce with shredded chicken over slices of boiled yellow potato, half a boiled egg and a black olive, parmesan
    pe_aji_gallina: p => [
        wpPlate(p, '#d9a441'),
        wpRice(p, 146, 102, 58, { sy: 1.3, seed: 2 }),
        wpPotatoRound(p, 50, 100, 28, 0, { seed: 1 }), wpPotatoRound(p, 78, 60, 26, 20, { seed: 2 }), wpPotatoRound(p, 108, 134, 26, -10, { seed: 3 }), wpPotatoRound(p, 74, 140, 24, 30, { seed: 4 }),
        `<g ${p.sh(1.2)}>`, wpMound(p, 84, 100, 48, 42, '#eaa832', { seed: 1, l: .32, d: .26, jit: .18 }), `</g>`,
        `<circle cx="78" cy="92" r="26" fill="#f4bf52" opacity=".45"/>`,
        wpShred(p, 70, 86, 30, { seed: 1, n: 10, cols: ['#f6e6c4', '#ecd2a0'], ol: '#c99a52' }), wpShred(p, 100, 100, 30, { seed: 2, n: 10, cols: ['#f6e6c4', '#ecd2a0'], ol: '#c99a52' }), wpShred(p, 82, 118, 28, { seed: 3, n: 9, cols: ['#f6e6c4', '#ecd2a0'], ol: '#c99a52' }), wpShred(p, 60, 106, 24, { seed: 4, n: 7, cols: ['#f6e6c4', '#ecd2a0'], ol: '#c99a52' }),
        `<path d="M50,96 C62,74 86,66 112,74" stroke="#f8d078" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
        wpHerbs(p, 84, 100, 70, { n: 10, cols: ['#8a5a1a', '#b07a2a'] }),
        K.eggHalf(p, 118, 76, 26, 20),
        wpOlive(p, 104, 118, 13, -30), wpOlive(p, 62, 128, 12, 40),
        K.sprinkle(p, 84, 100, 76, { c: '#fbf3dc', n: 24, r: .9 }),
        wpHerbs(p, 90, 96, 60, { n: 8 }),
    ].join(''),

    // Arroz con pollo: deep plate heaped with coriander-green rice studded with peas, carrot, corn and red pepper, a braised chicken leg on top, salsa criolla at the side
    pe_arroz_pollo: p => [
        K.ovalDish(p, { rx: 95, ry: 80, rim: '#2f7a52' }),
        wpRice(p, 98, 102, 134, { sy: .86, tint: '#9fb14a', density: .9, grain: 3.8, hiK: .32, seed: 3 }),
        `<g ${p.sh(.5)}>`,
        ...wpSpots('apv', 22, 58, 44, 11, 98, 102).map(([x, y, r], i) => i % 4 === 0 ? wpDice(p, x, y, 8, r, '#ef8a3a') : i % 4 === 1 ? wpPea(p, x, y, 7.5) : i % 4 === 2 ? `<rect x="${f1(x - 2.2)}" y="${f1(y - 2)}" width="4.4" height="4" rx="1.3" fill="${p.g('#f6cf3a', .3, .2)}" stroke="#c99a12" stroke-width=".4"/>` : wpBand(p, x, y, 16, 4.6, r, { c: '#d4301f', bend: .08 })),
        `</g>`,
        `<g ${p.sh(1.3)}>`, wpDrumstick(p, 96, 94, 92, -22, { c: '#c17a2e' }), `</g>`,
        `<ellipse cx="88" cy="88" rx="22" ry="10" transform="rotate(-22 88 88)" fill="#8a4a16" opacity=".18"/>`,
        wpHerbs(p, 98, 104, 120, { n: 24, cols: ['#2f6a22', '#4a8a30'] }),
        `<g ${p.sh(.4)}>`, wpSliver(p, 150, 128, 20, -30), wpSliver(p, 158, 136, 18, 20), wpSliver(p, 148, 142, 18, 110), wpSliver(p, 160, 124, 15, 70), `</g>`,
        wpBand(p, 154, 134, 12, 3, 30, { c: '#f0a21e', bend: .1 }),
    ].join(''),

    // Tallarines verdes: white plate, a nest of spaghetti coated in bright spinach-basil cream sauce, grated parmesan, a basil leaf
    pe_tallarines_verdes: p => [
        wpPlate(p, '#2f5f9a'),
        K.pool(p, 100, 104, 128, '#6f9a34', { op: .55, seed: 2, sy: .9 }),
        wpPasta(p, 100, 102, 134, { c: '#86b23e', w: 2.6, n: 44, sy: .9, outline: '#3f6a1c' }),
        `<path d="M62,94 C72,70 100,62 126,72 M70,124 C86,138 114,138 130,124" stroke="#a8cc62" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`,
        K.sprinkle(p, 100, 102, 96, { c: '#fbf3dc', n: 46, r: 1.1 }),
        wpLeaf(p, 108, 92, 18, -20, { c: '#2f7a26' }), wpLeaf(p, 92, 108, 16, 40, { c: '#3f8a2c' }),
    ].join(''),

    // Sudado de pescado: deep bowl, white fish pieces steamed in a tomato-ají broth, heaped with red onion slivers and tomato wedges, ají strips, coriander, lime
    pe_sudado: p => [
        K.bowl(p, { glaze: '#3f97a0', inside: '#f6f2e8' }),
        K.liquid(p, { R: 74, c: '#d9683a', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="48" fill="#e88a56" opacity=".35"/>`,
        wpFish(p, 82, 92, 66, 44, -18, { seed: 1 }),
        wpFish(p, 122, 114, 60, 42, 20, { seed: 2 }),
        K.tomatoWedge(p, 70, 126, 26, 30), K.tomatoWedge(p, 134, 76, 26, -140), K.tomatoWedge(p, 110, 140, 24, 160), K.tomatoWedge(p, 56, 92, 22, -60),
        `<g ${p.sh(.5)}>`,
        wpSliver(p, 100, 84, 32, -20, { pale: true }), wpSliver(p, 118, 100, 30, 40, { pale: true }), wpSliver(p, 84, 108, 30, 120, { pale: true }), wpSliver(p, 108, 76, 26, 80, { pale: true }), wpSliver(p, 130, 120, 26, -50, { pale: true }), wpSliver(p, 72, 76, 24, 20, { pale: true }), wpSliver(p, 96, 126, 26, 160, { pale: true }), wpSliver(p, 140, 98, 22, 100, { pale: true }),
        `</g>`,
        wpBand(p, 92, 100, 22, 5, 30), wpBand(p, 124, 90, 20, 5, -30), wpBand(p, 76, 118, 18, 4.6, 70),
        wpLeaf(p, 110, 110, 14, 20), wpLeaf(p, 88, 72, 13, -40), wpLeaf(p, 134, 134, 13, 80), wpLeaf(p, 64, 110, 12, 110),
        wpLime(p, 146, 136, 24, -30),
        wpShine(100, 100, 74, .35),
    ].join(''),

    // Lentejas: white plate, brown lentil stew at the left, white rice at the right, a fried egg on top and a little salsa criolla
    pe_lentejas: p => [
        wpPlate(p, '#c8392e'),
        wpRice(p, 136, 108, 70, { sy: 1.2, seed: 4 }),
        `<g ${p.sh(1)}>`, wpMound(p, 74, 104, 50, 48, '#7a4a28', { seed: 2, l: .18, d: .28, jit: .12 }), `</g>`,
        wpDots(p, 74, 104, 92, { cols: ['#7d5634', '#5f432a', '#8e6a3e', '#6b4424'], n: 200, size: 3.8, len: 1.2, seed: 1, sy: .96 }),
        `<circle cx="70" cy="98" r="40" fill="#6b3e1e" opacity=".14"/>`,
        wpDice(p, 60, 86, 7, 20, '#ef8a3a'), wpDice(p, 92, 122, 7, -20, '#ef8a3a'), wpDice(p, 50, 118, 6, 40, '#ef8a3a'),
        K.friedEgg(p, 104, 76, 50, 10),
        `<g ${p.sh(.4)}>`, wpSliver(p, 114, 144, 18, -20), wpSliver(p, 124, 150, 16, 30), wpSliver(p, 108, 152, 16, 100), `</g>`,
        wpBand(p, 118, 148, 10, 3, 20, { c: '#f0a21e', bend: .1 }),
        wpHerbs(p, 76, 106, 70, { n: 10 }),
    ].join(''),

    // Seco de res: white plate, beef chunks in a green coriander sauce with potato, carrot and peas at the right; white rice and canary beans at the left
    pe_seco: p => [
        wpPlate(p, '#2f7a52'),
        wpRice(p, 58, 78, 60, { sy: 1.05, seed: 5 }),
        `<g ${p.sh(.8)}>`, wpMound(p, 62, 134, 30, 24, '#c99a5a', { seed: 3, l: .2, d: .3 }), `</g>`,
        wpDots(p, 62, 134, 52, { cols: ['#e4bd78', '#d2a65e', '#c3924a'], n: 60, size: 4.2, len: 1.6, seed: 2, sy: .8 }),
        `<g ${p.sh(1.2)}>`, wpMound(p, 124, 104, 52, 52, '#6e9a36', { seed: 4, l: .28, d: .3, jit: .16 }), `</g>`,
        `<circle cx="118" cy="96" r="30" fill="#8ab44a" opacity=".4"/>`,
        `<g ${p.sh(.9)}>`,
        wpBeefChunk(p, 108, 84, 36, 10, { seed: 1, c: '#8a5230' }), wpBeefChunk(p, 144, 98, 34, -30, { seed: 2, c: '#7e4a2a' }), wpBeefChunk(p, 114, 124, 36, 50, { seed: 3, c: '#8a5230' }), wpBeefChunk(p, 144, 134, 30, 20, { seed: 4, c: '#7e4a2a' }),
        K.potato(p, 128, 70, 24, 20, { c: '#eed07a', seed: 1 }), K.potato(p, 96, 108, 22, -40, { c: '#eed07a', seed: 2 }),
        K.carrotChunk(p, 150, 118, 16, 30), K.carrotChunk(p, 98, 134, 15, -60),
        `</g>`,
        ...wpSpots('secp', 9, 40, 40, 11, 124, 104).map(([x, y]) => wpPea(p, x, y, 7)),
        `<path d="M86,100 C92,80 110,70 132,74" stroke="#a8cc62" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
        wpHerbs(p, 124, 104, 80, { n: 14, cols: ['#2f6a22', '#4a8a30'] }),
    ].join(''),

    // Papa a la huancaína: white plate, lettuce leaves, slices of boiled yellow potato covered in thick ají-cheese sauce, boiled egg halves and black olives
    pe_huancaina: p => [
        wpPlate(p, '#2f7a52'),
        wpLettuce(p, 76, 86, 100, -28, { seed: 1, c: '#9fd060' }), wpLettuce(p, 128, 112, 96, 24, { seed: 2, c: '#a8d66c' }), wpLettuce(p, 86, 134, 76, 64, { seed: 3, c: '#8fc552' }),
        wpPotatoRound(p, 64, 112, 34, 0, { seed: 1 }), wpPotatoRound(p, 94, 94, 34, 20, { seed: 2 }), wpPotatoRound(p, 124, 80, 32, -10, { seed: 3 }), wpPotatoRound(p, 100, 128, 32, 30, { seed: 4 }), wpPotatoRound(p, 134, 118, 30, 10, { seed: 5 }),
        `<g ${p.sh(1.2)}><path d="${wpSm([[46, 108], [62, 86], [94, 72], [128, 64], [150, 78], [152, 110], [140, 134], [112, 146], [82, 142], [56, 128]], true)}" fill="${p.rg('#f0b43a', .32, .22, .4, .36)}"/></g>`,
        `<path d="M58,110 C64,94 84,84 104,84 C122,84 134,92 140,100" stroke="#f8d078" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>`,
        `<path d="M70,128 C86,136 110,136 128,126" stroke="#d98a22" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35"/>`,
        K.eggHalf(p, 74, 72, 28, -20), K.eggHalf(p, 146, 140, 26, 30),
        wpOlive(p, 112, 112, 14, 20), wpOlive(p, 88, 118, 13, -40), wpOlive(p, 130, 96, 12, 60),
        wpHerbs(p, 100, 106, 80, { n: 8 }),
    ].join(''),

    // Salsa criolla: small blue-rimmed bowl heaped with thin red onion slivers, ají strips, coriander and a lime wedge
    pe_salsa_criolla: p => {
        const R = rng(p.id + 'sc');
        const sl = wpSpots('scr', 34, 50, 46, 9).map(([x, y, r], i) => wpSliver(p, x, y, 22 + R() * 12, r, { pale: i % 3 === 0, span: 1.3 + R() * .6 })).join('');
        return [
            K.kobachi(p, { glaze: '#2f5f9a', inside: '#f8f6f0' }),
            `<g ${p.sh(.8)}>`, wpMound(p, 100, 102, 54, 50, '#f1e4ea', { seed: 5, l: .2, d: .18 }), `</g>`,
            `<g ${p.sh(.5)}>`, sl, `</g>`,
            wpBand(p, 86, 90, 20, 4.4, 20), wpBand(p, 116, 108, 20, 4.4, -40), wpBand(p, 98, 124, 18, 4.2, 70), wpBand(p, 120, 80, 16, 4, 110),
            wpLeaf(p, 104, 96, 13, -20), wpLeaf(p, 80, 112, 12, 50), wpLeaf(p, 126, 122, 12, 100),
            wpHerbs(p, 100, 102, 90, { n: 14 }),
            wpLime(p, 136, 136, 22, -30),
        ].join('');
    },

    // Causa limeña: white plate, a round causa of smooth yellow ají potato with tuna inside, topped with mayonnaise, an egg slice, olives and parsley; avocado slices at the side
    pe_causa: p => [
        wpPlate(p, '#c8392e'),
        wpLettuce(p, 92, 100, 118, -20, { seed: 1, c: '#9fd060' }),
        `<g ${p.sh(1.8)}><circle cx="92" cy="100" r="46" fill="#c7962a"/></g>`,
        `<circle cx="92" cy="100" r="46" fill="none" stroke="#f2e2a4" stroke-width="2" opacity=".5"/>`,
        `<circle cx="92" cy="100" r="44" fill="${p.rg('#f0c644', .3, .2, .38, .34)}"/>`,
        `<circle cx="92" cy="100" r="36" fill="#f5d260" opacity=".45"/>`,
        `<path d="M58,92 A36,36 0 0 1 82,66" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
        `<path d="M64,120 A34,34 0 0 0 104,134" stroke="#c7962a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
        wpMayo(p, 92, 100, 26, 1),
        wpEggSlice(p, 94, 90, 22, 0),
        wpOlive(p, 78, 110, 13, 30), wpOlive(p, 106, 112, 12, -20),
        wpHerbs(p, 92, 100, 50, { n: 8 }),
        `<g ${p.sh(.7)}>`, wpAvocado(p, 152, 86, 30, 75), wpAvocado(p, 158, 108, 30, 90), wpAvocado(p, 152, 130, 28, 105), `</g>`,
    ].join(''),

    // Ensalada rusa: white bowl, pink beetroot-stained potato salad with dark beet cubes, orange carrot, peas and a sheen of mayonnaise
    pe_ensalada_rusa: p => {
        const sp = wpSpots('eru', 44, 60, 56, 11);
        return [
            K.bowl(p, { glaze: '#e9e3d7', inside: '#f7f3eb' }),
            `<g ${p.sh(1.2)}>`, wpMound(p, 100, 102, 66, 62, '#e6a7bd', { seed: 6, l: .25, d: .22, jit: .1 }), `</g>`,
            `<g ${p.sh(.5)}>`,
            sp.map(([x, y, r], i) => { const t = i % 5; return t === 0 ? wpDice(p, x, y, 11, r, '#9b1f52') : t === 1 ? wpDice(p, x, y, 11, r, '#f3cfd9') : t === 2 ? wpDice(p, x, y, 10, r, '#ef8a3a') : t === 3 ? wpDice(p, x, y, 11, r, '#b23468') : wpDice(p, x, y, 10, r, '#f0d6dc'); }).join(''),
            `</g>`,
            ...wpSpots('erp', 12, 52, 48, 12).map(([x, y]) => wpPea(p, x + 2, y + 3, 7)),
            K.glaze(p, 98, 100, 110, '#fff4f6', { seed: 2, op: .26 }),
            wpHerbs(p, 100, 102, 100, { n: 10 }),
        ].join('');
    },

    // Plátano frito: cream oval dish with long diagonal slices of fried ripe plantain, caramelised and golden
    pe_platano: p => [
        K.ovalDish(p, { rx: 95, ry: 74, rim: '#d9a441' }),
        `<g ${p.sh(.9)}>`,
        wpPlantain(p, 72, 74, 84, 26, -18, { seed: 1 }),
        wpPlantain(p, 128, 72, 80, 25, 14, { seed: 2 }),
        wpPlantain(p, 66, 118, 82, 26, 12, { seed: 3 }),
        wpPlantain(p, 132, 122, 84, 26, -16, { seed: 4 }),
        wpPlantain(p, 100, 98, 78, 25, -4, { seed: 5 }),
        `</g>`,
        K.sprinkle(p, 104, 100, 130, { c: '#ffffff', n: 12, r: .7 }),
    ].join(''),

    // Choclo con queso: white plate, three pieces of large-kernel Andean corn and thick slabs of queso fresco
    pe_choclo: p => [
        wpPlate(p, '#2f7a52'),
        wpChoclo(p, 74, 74, 68, 36, -24),
        wpChoclo(p, 86, 128, 66, 36, -8),
        wpChoclo(p, 134, 108, 62, 36, 60),
        wpQueso(p, 134, 56, 40, 28, -14, { seed: 1 }),
        wpQueso(p, 140, 150, 38, 26, 12, { seed: 2 }),
    ].join(''),

    // Aguadito de pollo: deep bowl of thick green coriander broth with rice, chicken pieces, peas, carrot and potato, a lime wedge on the rim
    pe_aguadito: p => {
        const R = rng(p.id + 'ag');
        let g = '';
        for (let i = 0; i < 130; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 66, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d, b = R() * 3.14; g += `M${f1(x - Math.cos(b) * 1.6)},${f1(y - Math.sin(b) * 1.6)}l${f1(Math.cos(b) * 3.2)},${f1(Math.sin(b) * 3.2)}`; }
        return [
            wpSoupBowl(p, { band: '#2f7a52' }),
            K.liquid(p, { R: 73, c: '#7f9f3a', op: 1, shine: false }),
            `<circle cx="96" cy="94" r="48" fill="#9ab84e" opacity=".4"/>`,
            `<g ${wpOutline(p, '#9fb064', .5)}><path d="${g}" stroke="#faf6ea" stroke-width="3.2" stroke-linecap="round" fill="none"/></g>`,
            `<g ${p.sh(.6)}>`,
            wpChickenChunk(p, 84, 88, 30, -20, { seed: 1 }), wpChickenChunk(p, 118, 112, 28, 30, { seed: 2 }), wpChickenChunk(p, 122, 78, 22, 70, { seed: 3 }),
            K.potato(p, 76, 120, 20, 20, { c: '#eed07a', seed: 1 }),
            wpDice(p, 102, 72, 9, 20, '#ef8a3a'), wpDice(p, 136, 100, 9, -30, '#ef8a3a'), wpDice(p, 98, 134, 8, 40, '#ef8a3a'), wpDice(p, 62, 98, 8, 10, '#ef8a3a'),
            `</g>`,
            ...wpSpots('agp', 11, 56, 56, 12).map(([x, y]) => wpPea(p, x, y, 7)),
            wpHerbs(p, 100, 100, 120, { n: 28, cols: ['#2f6a22', '#4a8a30'] }),
            wpLime(p, 140, 138, 24, -30),
            wpShine(100, 100, 73, .4),
        ].join('');
    },

    // Sopa de quinua: deep bowl of pale creamy broth thick with quinoa, potato and carrot dice, peas, cubes of queso fresco and parsley
    pe_sopa_quinua: p => [
        wpSoupBowl(p, { band: '#c8392e' }),
        K.liquid(p, { R: 73, c: '#e2d3a2', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#efe3b8" opacity=".5"/>`,
        wpDots(p, 100, 100, 136, { cols: ['#f3e6bc', '#dcc88e', '#f8f0d4'], n: 170, size: 2.4, len: .6, seed: 3, hi: .3 }),
        `<g ${p.sh(.6)}>`,
        ...wpSpots('sqv', 20, 56, 56, 15).map(([x, y, r], i) => { const t = i % 4; return t === 0 ? wpDice(p, x, y, 14, r, '#f0dc9a') : t === 1 ? wpDice(p, x, y, 10, r, '#ef8a3a') : t === 2 ? wpDice(p, x, y, 11, r, '#fbf8ee') : wpDice(p, x, y, 13, r, '#f0dc9a'); }),
        `</g>`,
        ...wpSpots('sqp', 10, 56, 56, 12).map(([x, y]) => wpPea(p, x + 1, y + 2, 7)),
        wpHerbs(p, 100, 100, 120, { n: 22 }),
        wpShine(100, 100, 73, .45),
    ].join(''),

    // Sopa criolla: deep bowl of orange-red creamy broth with angel-hair noodles and beef strips, a poached egg in the centre, oregano, a piece of toast on the rim
    pe_sopa_criolla: p => {
        const R = rng(p.id + 'scn');
        let nd = '';
        for (let i = 0; i < 36; i++){
            const rr = 8 + Math.sqrt(R()) * 58, a0 = R() * 6.28, sweep = 1 + R() * 2;
            const pts = Array.from({ length: 6 }, (_, j) => { const a = a0 + j / 5 * sweep, rj = rr * (1 + (R() - .5) * .2); return [100 + Math.cos(a) * rj, 100 + Math.sin(a) * rj]; });
            nd += wpSm(pts);
        }
        return [
            wpSoupBowl(p, { band: '#d9a441' }),
            K.liquid(p, { R: 73, c: '#d8703a', op: 1, shine: false }),
            `<circle cx="96" cy="94" r="50" fill="#e98a58" opacity=".4"/>`,
            `<path d="${nd}" stroke="#b86a3a" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/><path d="${nd}" stroke="#f6dca6" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".95"/>`,
            `<g ${p.sh(.6)}>`,
            wpBeef(p, 66, 92, 38, 20, { seed: 1, c: '#9a5a36' }), wpBeef(p, 134, 82, 38, -40, { seed: 2, c: '#9a5a36' }), wpBeef(p, 74, 130, 36, 70, { seed: 3, c: '#9a5a36' }), wpBeef(p, 110, 146, 34, -10, { seed: 4, c: '#9a5a36' }),
            `</g>`,
            wpPoached(p, 100, 98, 54, 10),
            K.sprinkle(p, 100, 100, 120, { c: '#5a6a2a', n: 26, r: .7 }),
            wpToast(p, 142, 134, 34, 20),
            wpShine(100, 100, 73, .4),
        ].join('');
    },
};
