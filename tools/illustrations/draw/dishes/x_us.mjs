// World edition: United States — hand-drawn redraw of the newer us_* dishes (soups, mains, sides)
import * as K from '../kit.mjs';

const { T, f, rng, ring, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;
// kit smooth() with 1-decimal output (smaller files)
function smooth(pts, closed = true, k = 1){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6 * k)},${f1(p1[1] + (p2[1] - p0[1]) / 6 * k)} ${f1(p2[0] - (p3[0] - p1[0]) / 6 * k)},${f1(p2[1] - (p3[1] - p1[1]) / 6 * k)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}

// =========================================================
// local helpers (xus = United States, redraw set) — copied from w_us / w_mx / z_soup
// =========================================================
function xusSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const xusBlur = (p, s = 2) => `filter="url(#${p.def('xusbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
function xusOutline(p, c, r = .55){
    const id = p.def('xusOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const xusPts = (R, n, cx, cy, rx, ry) => Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()); return [cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry]; });
function xusSpots(seed, n, rx, ry, minD, cx = 100, cy = 100){
    const R = rng('xusspots' + seed), out = [];
    for (let t = 0; t < 8000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()), x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
function xusQ(x, y, L, w, ang, c, R, { bend = .4, outline = null } = {}){
    const rad = ang * Math.PI / 180, dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2, b = (R() - .5) * L * bend;
    const d = `M${f1(x - dx)},${f1(y - dy)}q${f1(dx - dy * b / L * 2)},${f1(dy + dx * b / L * 2)} ${f1(dx * 2)},${f1(dy * 2)}`;
    return (outline ? `<path d="${d}" stroke="${outline}" stroke-width="${f(w + 1)}" fill="none" stroke-linecap="round"/>` : '') + `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
function xusMound(p, x, y, rx, ry, c, { seed = 1, l = .25, d = .3, jit = .14 } = {}){
    const R = rng(p.id + 'mnd' + seed);
    return `<path ${T(x, y)} d="${xusSm(ring(rx, 12, jit, R, 1, ry / rx), true)}" fill="${p.rg(c, l, d, .4, .38)}"/>`;
}
const xusShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .2)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .64)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function xusParsley(p, x, y, s, { n = 16, seed = 1, c1 = '#3f8a2c', c2 = '#5aa63c', sz = 1 } = {}){
    return xusGrains(p, x, y, s / 2, s / 2, [c1, c2], { n, size: 1.5 * sz, seed: 'pa' + seed });
}
function xusBasil(p, x, y, s, r = 0, { c = '#3f8f34' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.4)}><path d="M-10,0 Q-5,-7.5 4,-6 Q10,-3 10,0 Q10,3 4,6 Q-5,7.5 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.6 9,0 M-3,0 L-6,-3.6 M2,0 L-1,-4.4 M-3,0 L-6,3.6 M2,0 L-1,4.4" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/></g>`;
}
function xusWedge(p, x, y, s, r = 0, { c = '#5aa02e', flesh = '#c9e48a' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,2 A10,9 0 0 1 10,2 Q0,5 -10,2Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-8.4,2 A8.4,7.2 0 0 1 8.4,2 Q0,4 -8.4,2Z" fill="${flesh}"/>
        ${[-50, -25, 0, 25, 50].map(a => `<path transform="rotate(${a} 0 2)" d="M0,2 L0,-4" stroke="#f2f8d8" stroke-width=".8"/>`).join('')}
        <path d="M-6,-3.5 Q0,-6.5 5,-4.5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function xusGrains(p, x, y, rx, ry, cols, { n = 40, size = 1.6, seed = 1 } = {}){
    const R = rng(p.id + 'xusGr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()), gx = x + Math.cos(a) * d * rx, gy = y + Math.sin(a) * d * ry;
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        ds[k] += 'M' + Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; }).join('L') + 'Z';
    }
    return cols.map((c, i) => ds[i] ? `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>` : '').join('');
}
// sprinkle (pepper, paprika, cheese) as one path
function xusSpr(p, x, y, s, { c = '#2a2420', n = 20, r = .7 } = {}){
    const R = rng(p.id + 'xspk' + x + y + c);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = f1(r * (.6 + R() * .7)); d += `M${f1(cx - rr)},${f1(cy)}a${rr},${rr} 0 1 0 ${f1(rr * 2)},0a${rr},${rr} 0 1 0 ${f1(-rr * 2)},0`; }
    return `<path d="${d}" fill="${c}"/>`;
}
// strands grouped by colour: items = [[x, y, L, ang, colourIndex]]
function xusStrands(R, items, cols, w, outline, { bend = .4 } = {}){
    const ds = cols.map(() => '');
    let all = '';
    for (const [x, y, L, ang, k] of items){
        const rad = ang * Math.PI / 180, dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2, b = (R() - .5) * L * bend;
        const d = `M${f1(x - dx)},${f1(y - dy)}q${f1(dx - dy * b / L * 2)},${f1(dy + dx * b / L * 2)} ${f1(dx * 2)},${f1(dy * 2)}`;
        ds[k] += d; all += d;
    }
    return `<g fill="none" stroke-linecap="round">${outline ? `<path d="${all}" stroke="${outline}" stroke-width="${f(w + 1)}"/>` : ''}${cols.map((c, i) => ds[i] ? `<path d="${ds[i]}" stroke="${c}" stroke-width="${w}"/>` : '').join('')}</g>`;
}
// many small round things as one path per colour (beans, lentils, peas)
function xusDots(pts, r, c, { stroke = null, sy = 1 } = {}){
    const d = pts.map(([x, y]) => `M${f1(x - r)},${f1(y)}a${r},${f1(r * sy)} 0 1 0 ${f1(r * 2)},0a${r},${f1(r * sy)} 0 1 0 ${f1(-r * 2)},0`).join('');
    return `<path d="${d}" fill="${c}"${stroke ? ` stroke="${stroke}" stroke-width=".6"` : ''}/>`;
}
const xusHi = (pts, r) => `<path d="${pts.map(([x, y]) => `M${f1(x - r * .55)},${f1(y - r * .25)}q${f1(r * .3)},${f1(-r * .4)} ${f1(r * .7)},${f1(-r * .35)}`).join('')}" stroke="#fff" stroke-width="${f1(Math.max(.6, r * .3))}" fill="none" stroke-linecap="round" opacity=".75"/>`;

// ---------- vessels ----------
function xusSkillet(p, { R = 78, cx = 92, cy = 100 } = {}){
    return `<g ${p.sh(2)}><path d="M${cx + R - 6},${cy - 9} L${cx + R + 22},${cy - 7} Q${cx + R + 28},${cy} ${cx + R + 22},${cy + 7} L${cx + R - 6},${cy + 9}Z" fill="${p.g('#3a3532', .2, .3)}"/>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg('#3d3735', .2, .3, .35, .3)}"/></g>
        <circle cx="${cx + R + 19}" cy="${cy}" r="2.6" fill="#1d1918"/>
        <circle cx="${cx}" cy="${cy}" r="${R - 7}" fill="${p.rg('#24201f', .12, .2, .62, .64)}"/>
        <path d="M${cx - R * .72},${cy - R * .42} A${R * .84},${R * .84} 0 0 1 ${cx - R * .26},${cy - R * .8}" stroke="#8a8380" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
function xusBakingDish(p, { w = 172, h = 136, c = '#f6f2ea', rim = '#d8cfc0' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.8)}><rect x="${x - 10}" y="${100 - 18}" width="${w + 20}" height="36" rx="12" fill="${p.g(c, .15, .18)}"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${p.rg(c, .2, .14, .35, .3)}"/></g>
        <rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="17" fill="none" stroke="${rim}" stroke-width="1.4"/>
        <path d="M${x + 12},${y + 34} Q${x + 12},${y + 12} ${x + 36},${y + 12}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
function xusWoodBowl(p, { R = 92 } = {}){
    const c = '#a8703c';
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .2, .3, .35, .3)}"/></g>
        ${[.97, .93].map(k => `<circle cx="100" cy="100" r="${f(R * k)}" fill="none" stroke="${dk(c, .25)}" stroke-width=".7" opacity=".5"/>`).join('')}
        <circle cx="100" cy="100" r="${f(R * .86)}" fill="${p.rg('#c9935a', .12, .3, .62, .64)}"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".35"/>`;
}
// wooden cutting board (rounded rectangle, grain lines)
function xusBoard(p, { w = 184, h = 150, c = '#c8935a', round = false } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    const shape = round ? `<circle cx="100" cy="100" r="${w / 2}"` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"`;
    const R = rng(p.id + 'board');
    let grain = '';
    for (let i = 0; i < 9; i++){ const gy = y + 10 + i * (h - 20) / 8 + (R() - .5) * 4; grain += `M${f1(x + 10)},${f1(gy)} Q${f1(100)},${f1(gy + (R() - .5) * 8)} ${f1(x + w - 10)},${f1(gy + (R() - .5) * 4)}`; }
    const cid = p.def('xusbdclip' + w + h + round, id => `<clipPath id="${id}">${shape}/></clipPath>`);
    return `<g ${p.sh(1.8)}>${shape} fill="${p.g(c, .22, .25)}"/></g>
        <g clip-path="url(#${cid})"><path d="${grain}" stroke="${dk(c, .18)}" stroke-width=".8" fill="none" opacity=".45"/></g>
        ${round ? `<circle cx="100" cy="100" r="${w / 2 - 3}" fill="none" stroke="${lt(c, .25)}" stroke-width="1.2" opacity=".6"/>` : `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="12" fill="none" stroke="${lt(c, .25)}" stroke-width="1.2" opacity=".6"/>`}`;
}
// soup bowl: kit bowl, optional coloured band, and the soup surface
function xusSoup(p, { glaze = '#f4efe4', inside = '#fbf8f1', band = null, broth = '#e6b54a', R = 74, op = 1, cloud = 0 } = {}){
    return [
        K.bowl(p, { glaze, inside }),
        band ? `<circle cx="100" cy="100" r="81" fill="none" stroke="${band}" stroke-width="1.6" opacity=".85"/>` : '',
        K.liquid(p, { R, c: broth, op, shine: false }),
        cloud ? `<g ${xusBlur(p, 5)}><ellipse cx="88" cy="88" rx="40" ry="30" fill="${lt(broth, .3)}" opacity="${cloud}"/><ellipse cx="118" cy="120" rx="30" ry="22" fill="${dk(broth, .12)}" opacity="${cloud * .8}"/></g>` : '',
    ].join('');
}
const xusVeil = (c, op, R = 74) => `<circle cx="100" cy="100" r="${R}" fill="${c}" opacity="${op}"/>`;

// ---------- food parts ----------
function xusDice(p, x, y, s, r = 0, c = '#ef7f30', { skin = null, op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f(h * .5)}" width="${s}" height="${f(s * .22)}" rx="${f(s * .1)}" fill="${skin}"/>` : ''}
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
function xusCilantro(p, x, y, s, r = 0, { c = '#3f8a2c' } = {}){
    const d = 'M0,8 C-1,5 -2,3 -3,2 C-7,4 -10,1 -8,-2 C-10,-5 -6,-8 -3,-6 C-3,-10 3,-10 3,-6 C6,-8 10,-5 8,-2 C10,1 7,4 3,2 C2,3 1,5 0,8Z';
    return `<g ${T(x, y, r, s / 20)}><path d="${d}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M0,7 L0,-6 M0,0 L-6,-3 M0,0 L6,-3" stroke="${lt(c, .4)}" stroke-width=".6" fill="none"/></g>`;
}
// kidney-shaped bean
function xusBean(p, x, y, s, r = 0, { c = '#7e2a24' } = {}){
    return `<g ${T(x, y, r, s / 12)}><path d="M-6,0 C-6,-4 -2.4,-4.4 0,-3 C2.4,-4.4 6,-4 6,0 C6,3.6 3,4.4 0,4.4 C-3,4.4 -6,3.6 -6,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/><path d="M-3.6,-1.4 Q-1,-2.6 2,-1.8" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// sausage coin (andouille / smoked sausage)
function xusCoin(p, x, y, s, { c = '#8e3a22', inner = '#c77a58', seed = 1 } = {}){
    const R = rng(p.id + 'coin' + seed + x + y);
    let sp = '';
    for (let i = 0; i < 6; i++) sp += `<circle cx="${f1((R() - .5) * s * .55)}" cy="${f1((R() - .5) * s * .55)}" r="${f1(.6 + R() * s * .05)}" fill="${R() < .5 ? '#f2d2b8' : dk(inner, .3)}" opacity=".85"/>`;
    return `<g ${T(x, y)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g><circle r="${f(s / 2 - 1.6)}" fill="${p.rg(inner, .15, .2)}"/>${sp}<path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .12)},${f(-s * .32)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// crisp bacon bit
function xusBacon(p, x, y, s, r = 0, { seed = 1 } = {}){
    return xusGrains(p, x, y, s * .5, s * .38, ['#a8482a', '#c26a46', '#7a2e18', '#e2aa86'], { n: 9, size: s * .19, seed });
}
// sour cream dollop
function xusDollop(p, x, y, s, { c = '#fbf8f0', seed = 1 } = {}){
    const R = rng(p.id + 'dol' + seed + x);
    return `<g ${T(x, y)}><g ${p.sh(.6)}><path d="${xusSm(ring(s / 2, 9, .25, R, 1.1, .95), true)}" fill="${p.rg(c, .2, .1)}" stroke="${dk(c, .1)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .26)},${f(s * .08)} Q${f(-s * .1)},${f(-s * .2)} ${f(s * .14)},${f(-s * .06)} Q${f(s * .2)},${f(s * .14)} ${f(-s * .02)},${f(s * .1)}" stroke="${dk(c, .12)}" stroke-width="1" fill="none" stroke-linecap="round"/>
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .14)},${f(-s * .32)} ${f(s * .1)},${f(-s * .3)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`;
}
// shredded cheddar
function xusCheddar(p, cx, cy, rx, ry, n, { seed = 1, c = '#f4a62a', c2 = '#fbc94a', w = 2 } = {}){
    const R = rng(p.id + 'chd' + seed + cx);
    const items = xusPts(R, n, cx, cy, rx, ry).map(([x, y]) => [x, y, 6 + R() * 6, R() * 180, R() < .5 ? 0 : 1]);
    return `<g ${p.sh(.35)}>${xusStrands(R, items, [c, c2], w, dk(c, .25))}</g>`;
}
function xusChives(p, cx, cy, rad, n, { seed = 1, c = '#3f8f2c' } = {}){
    const R = rng(p.id + 'chv' + seed + cx);
    let d = '', d2 = '';
    for (const [x, y] of xusPts(R, n, cx, cy, rad, rad)){ const a = R() * 6.28, L = 2.2 + R() * 1.4, seg = `M${f1(x - Math.cos(a) * L)},${f1(y - Math.sin(a) * L)}l${f1(Math.cos(a) * L * 2)},${f1(Math.sin(a) * L * 2)}`; if (R() < .6) d += seg; else d2 += seg; }
    return `<path d="${d}" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/><path d="${d2}" stroke="${lt(c, .25)}" stroke-width="1.7" stroke-linecap="round"/>`;
}
// corn kernels
function xusKernels(p, cx, cy, rx, ry, n, { seed = 1, s = 4.4, c = '#f6c838' } = {}){
    const R = rng(p.id + 'krn' + seed + cx + cy);
    const P = xusPts(R, n, cx, cy, rx, ry), A = P.filter((_, i) => i % 3), B = P.filter((_, i) => !(i % 3));
    return `<g ${p.sh(.3)}>${xusDots(A, s / 2, c, { stroke: dk(c, .3), sy: .82 })}${xusDots(B, s / 2, lt(c, .2), { stroke: dk(c, .3), sy: .82 })}</g>${xusHi(P.slice(0, Math.round(n * .6)), s / 2)}`;
}
function xusCracker(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(ring(s / 2, 6, .08, rng('ck' + x), 1, .92), true, .7)}" fill="${p.g('#ecc985', .35, .3)}" stroke="#b88a42" stroke-width=".5"/></g><circle r="${f(s * .22)}" fill="#f6e2b0" opacity=".9"/><circle cx="${f(s * .12)}" cy="${f(s * .1)}" r=".5" fill="#a8783a"/></g>`;
}
function xusShred(p, x, y, s, r = 0, { seed = 1, c = '#efd6a8' } = {}){
    const R = rng(p.id + 'xsh' + seed + x + y);
    const pts = ring(s / 2, 9, .4, R, 1.05, .8);
    return `<g ${T(x, y, r)}><g ${p.rough(1.8, .3)}><path d="${xusSm(pts, true)}" fill="${p.g(c, .4, .3)}" stroke="${dk(c, .28)}" stroke-width=".5"/></g><path d="M${f(-s * .2)},${f(-s * .1)} l${f(s * .3)},${f(s * .04)} M${f(-s * .1)},${f(s * .12)} l${f(s * .24)},${f(-s * .02)}" stroke="${dk(c, .18)}" stroke-width=".6" fill="none" stroke-linecap="round"/><path d="M${f(-s * .26)},${f(-s * .2)} q${f(s * .14)},${f(-s * .08)} ${f(s * .3)},${f(-s * .05)}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function xusCelery(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 14)}><path d="M-7,2 Q-7,-6 0,-6.4 Q7,-6 7,2 L4.4,2.2 Q4,-3 0,-3.2 Q-4,-3 -4.4,2.2Z" fill="${p.g('#a9d07a', .3, .2)}" stroke="#6f9a44" stroke-width=".6"/><path d="M-5.4,0 Q-5,-4.6 0,-5" stroke="#e2f2c4" stroke-width=".8" fill="none"/></g>`;
}
// mushroom slice (cross-section: cap + stem)
function xusMushSlice(p, x, y, s, r = 0, { c = '#9a6a42', flesh = '#ead8b6' } = {}){
    const d = 'M-10,2 C-10,-6 -5,-9 0,-9 C5,-9 10,-6 10,2 C8,3 6,3 4,2.6 L4,9 Q0,10 -4,9 L-4,2.6 C-6,3 -8,3 -10,2Z';
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.4)}><path d="${d}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g><path d="${d}" transform="scale(.8) translate(0 .6)" fill="${p.g(flesh, .2, .2)}"/><path d="M-5,-5 Q0,-7.4 5,-5.4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// leafy green with frilly edge (kale, collards, spinach)
function xusLeafy(p, x, y, s, r = 0, { c = '#2f6a2c', seed = 1, frill = true } = {}){
    const R = rng(p.id + 'lfy' + seed + x + y);
    const pts = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 6.28, rr = (frill ? (i % 2 ? .82 : 1.05) : 1) * (1 - R() * .16); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><path d="${xusSm(pts, true)}" fill="${p.g(c, .28, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M${f(-s * .44)},.6 Q0,${f(-s * .05)} ${f(s * .42)},0" stroke="${lt(c, .4)}" stroke-width="${f(Math.max(.8, s * .05))}" fill="none" stroke-linecap="round"/><path d="M${f(-s * .2)},0 l${f(s * .08)},${f(-s * .14)} M${f(s * .06)},0 l${f(s * .08)},${f(s * .14)}" stroke="${lt(c, .3)}" stroke-width=".6" fill="none"/></g>`;
}
// curly kale piece: ragged, crinkled dark blue-green
function xusKale(p, x, y, s, r = 0, { c = '#2f5a34', seed = 1 } = {}){
    const R = rng(p.id + 'kale' + seed + x + y);
    let out = '';
    for (let i = 0; i < 4; i++){ const a = i / 4 * 6.28 + R(), d = s * .2; out += `<path ${T(Math.cos(a) * d * 1.2, Math.sin(a) * d * .7)} d="${xusSm(ring(s * .26, 9, .45, R, 1, .85), true)}" fill="${p.g(i % 2 ? c : lt(c, .1), .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r)}><g ${p.rough(3, .22)}>${out}</g><path d="M${f(-s * .42)},.5 Q0,${f(-s * .06)} ${f(s * .4)},0" stroke="${lt(c, .45)}" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>`;
}
// fluffy drop dumpling / biscuit
function xusDumpling(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'dmp' + seed + x + y);
    const sh = xusSm(ring(s / 2, 9, .28, R, 1.12, .95), true);
    return `<g ${T(x, y)}><g ${p.sh(.9)}><path d="${sh}" fill="${p.rg('#f3e2b8', .4, .28, .36, .32)}" stroke="#c4a266" stroke-width=".6"/></g>
        <g ${xusBlur(p, 1.6)}><ellipse cx="${f(s * .14)}" cy="${f(s * .16)}" rx="${f(s * .2)}" ry="${f(s * .12)}" fill="#c9a060" opacity=".45"/><ellipse cx="${f(-s * .2)}" cy="${f(s * .1)}" rx="${f(s * .08)}" ry="${f(s * .12)}" fill="#d6b070" opacity=".35"/></g>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .18)}" rx="${f(s * .16)}" ry="${f(s * .08)}" fill="#fff" opacity=".6" transform="rotate(-20 ${f(-s * .14)} ${f(-s * .18)})"/></g>`;
}
function xusTortStrip(p, x, y, L, r = 0, { c = '#e8b04a' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${-L / 2},-2.4 Q0,-4 ${L / 2},-2 L${L / 2 - 1},2.6 Q0,1.4 ${-L / 2 + 1},2.6Z" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/></g><path d="M${-L / 2 + 2},-1.6 Q0,-2.8 ${L / 2 - 3},-1.2" stroke="#fff3cc" stroke-width=".8" fill="none" opacity=".8"/></g>`;
}
// crushed tortilla chip (rough triangle)
function xusChip(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'chip' + seed + x);
    const pts = [[-s / 2, s * .3], [s * .05, -s / 2], [s / 2, s * .32]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><g ${p.crumb(.9)}><path d="${smooth(pts, true, .25)}" fill="${p.g('#eab64e', .35, .3)}" stroke="#b07a26" stroke-width=".6"/></g></g><path d="M${f(-s * .28)},${f(s * .14)} L${f(s * .02)},${f(-s * .28)}" stroke="#fff3cc" stroke-width="1" stroke-linecap="round" opacity=".7"/></g>`;
}
function xusOil(p, cx, cy, rad, n, { c = '#e8742a', seed = 1, op = .55 } = {}){
    const R = rng(p.id + 'xoil' + seed);
    let out = '';
    for (const [x, y] of xusPts(R, n, cx, cy, rad, rad)){ const rr = 1 + R() * 2.6; out += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr)}" fill="${c}" opacity="${op}"/><circle cx="${f1(x - rr * .3)}" cy="${f1(y - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".6"/>`; }
    return out;
}
// small tube pasta (ditalini)
function xusTube(p, x, y, s, r = 0, { c = '#efd290' } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-s / 2)}" y="${f(-s * .32)}" width="${s}" height="${f(s * .64)}" rx="${f(s * .28)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><ellipse cx="${f(s * .32)}" cy="0" rx="${f(s * .14)}" ry="${f(s * .22)}" fill="${dk(c, .35)}"/></g>`;
}
// grains as short strokes (barley, rice in soup, acini pasta)
function xusGrainLines(p, cx, cy, rx, ry, n, { c = '#efe2c0', len = 3.4, w = 2.6, seed = 1 } = {}){
    const R = rng(p.id + 'gl' + seed + cx);
    let d = '';
    for (const [x, y] of xusPts(R, n, cx, cy, rx, ry)){ const a = R() * 3.14, dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2; d += `M${f1(x - dx)},${f1(y - dy)}l${f1(dx * 2)},${f1(dy * 2)}`; }
    return `<g stroke-linecap="round"><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${w + .9}" transform="translate(.4 .6)" opacity=".7"/><path d="${d}" stroke="${c}" stroke-width="${w}"/><path d="${d}" stroke="#fff" stroke-width="${f(w * .3)}" transform="translate(-.4 -.5)" opacity=".7"/></g>`;
}
function xusRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4 } = {}){
    const R = rng(p.id + 'xusRice' + seed + x + y);
    const shape = xusSm(ring(s / 2, 14, .07, R, 1, sy), true);
    const hi = lt(tint, .85), mid = dk(tint, .02), sd = dk(tint, .3);
    const n = Math.round(s * s / 40 * density);
    const L = [['', '', ''], ['', '', '']];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * s / 2 * .96, gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy;
        const h = grain * (.42 + R() * .14), b = R() * Math.PI, dx = Math.cos(b) * h, dy = Math.sin(b) * h;
        const seg = `M${Math.round(gx - dx)} ${Math.round(gy - dy)}l${f1(dx * 2)} ${f1(dy * 2)}`;
        const l = L[i % 2];
        if ((gx + gy) / (s / 2) + (R() - .5) * 1.4 < .2){ l[0] += seg; if (R() < .4) l[2] += `M${f1(gx - dx * .6 - .55)} ${f1(gy - dy * .6 - .55)}l${f1(dx * .9)} ${f1(dy * .9)}`; } else l[1] += seg;
    }
    const shade = p.def('xusRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
function xusButter(p, x, y, s, r = 0){
    return `<path ${T(x + 2, y + 2)} d="${smooth(ring(s * .78, 9, .3, rng(p.id + 'btr' + x)))}" fill="#f7d75e" opacity=".45"/>
        <g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${f(s * .86)}" rx="${f(s * .24)}" fill="${p.g('#f8de72', .35, .2)}" stroke="#d9b23a" stroke-width=".6"/></g>
        <path d="M${f(-s * .3)},${f(-s * .26)} L${f(s * .2)},${f(-s * .26)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".85"/></g>`;
}
function xusSauce(p, x, y, rx, ry, { c = '#c3311c', seed = 1, bits = 14 } = {}){
    const R = rng(p.id + 'xss' + seed);
    let b = '';
    for (let i = 0; i < bits; i++){ const [bx, by] = xusPts(R, 1, 0, 0, rx * .8, ry * .8)[0]; b += `<path ${T(bx, by, R() * 360)} d="${smooth(ring(1.6 + R() * 2, 5, .5, R))}" fill="${R() < .5 ? dk(c, .2) : lt(c, .15)}" opacity=".8"/>`; }
    return `<g ${T(x, y)}><path d="${xusSm(ring(rx, 11, .22, R, 1, ry / rx), true)}" fill="${p.rg(c, .2, .25, .4, .36)}"/>${b}
        <path d="M${f(-rx * .5)},${f(-ry * .3)} Q${f(-rx * .2)},${f(-ry * .6)} ${f(rx * .2)},${f(-ry * .55)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
function xusOnionStrip(p, x, y, s, r = 0, { c = '#f6e2ae', op = .62 } = {}){
    const d = `M${-s / 2},${f(s * .14)} Q0,${f(-s * .34)} ${s / 2},${f(s * .14)} L${f(s / 2 - 2)},${f(s * .16)} Q0,${f(-s * .2)} ${f(-s / 2 + 2)},${f(s * .16)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${c}" opacity="${op}" stroke="${lt(c, .4)}" stroke-width=".9" stroke-linejoin="round"/></g>`;
}
// ---------- main-dish parts ----------
function xusPasta(p, x, y, s, { c = '#f0d58e', w = 2.2, n = 40, seed = 1, sy = .92, outline = null, layers = 5 } = {}){
    const R = rng(p.id + 'xusPs' + seed);
    const ol = xusOutline(p, outline || dk(c, .3), .5);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.18 + Math.sqrt(R()) * .8), a0 = R() * 6.28, sweep = 1.4 + R() * 2.4;
        const cx = x + (R() - .5) * s * .1, cy = y + (R() - .5) * s * .1;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .18); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const m = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2);
        L[i % layers][m < -.4 ? 1 : m > .8 ? 2 : 0] += xusSm(pts);
    }
    const base = `<path ${T(x, y)} d="${xusSm(ring(s / 2 * .9, 12, .12, R, 1, sy), true)}" fill="${dk(c, .2)}"/>`;
    const body = L.map(([a, b, d]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${dk(c, .1)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .25)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`).join('');
    return `<g ${p.sh(.9)}>${base}${body}</g>`;
}
function xusElbow(p, x, y, s, r = 0, { c = '#f4c24e' } = {}){
    return `<g ${T(x, y, r, s / 12)}><path d="M-5,2 A5,5 0 0 1 5,2" stroke="${dk(c, .3)}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-5,2 A5,5 0 0 1 5,2" stroke="${c}" stroke-width="3.8" fill="none" stroke-linecap="round"/><path d="M-4,0 A4.4,4.4 0 0 1 0,-2.6" stroke="#fff3c8" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
function xusGBean(p, x, y, L, r = 0, { c = '#4f9a34', bend = 2 } = {}){
    const d = `M${-L / 2},0 Q0,${bend * 2} ${L / 2},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .35)}" stroke-width="6.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="5.4" fill="none" stroke-linecap="round"/>
        <path d="M${-L / 2 + 3},-.8 Q0,${bend * 2 - 1.2} ${L / 2 - 4},-.8" stroke="${lt(c, .45)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
function xusFloret(p, x, y, s, r = 0, { seed = 1, c = '#4a9238' } = {}){
    const R = rng(p.id + 'flo' + seed + x + y);
    let head = '';
    for (let i = 0; i < 8; i++){ const a = -1.4 + i / 7 * 2.8, d = 5 + R() * 2.4; head += `<circle cx="${f1(4 + Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d * 1.1)}" r="${f1(3.6 + R() * 1.4)}" fill="${R() < .5 ? c : lt(c, .14)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`; }
    head += `<circle cx="3" cy="0" r="5" fill="${c}"/>`;
    return `<g ${T(x, y, r, s / 26)}><g ${p.sh(.6)}><path d="M-14,-2.6 Q-6,-4 2,-6 L2,6 Q-6,4 -14,2.6 Q-15.4,0 -14,-2.6Z" fill="${p.g('#b7d68a', .3, .25)}" stroke="#7e9e52" stroke-width=".6"/>${head}</g>
        ${Array.from({ length: 8 }, () => `<circle cx="${f1(2 + R() * 9)}" cy="${f1(-6 + R() * 12)}" r=".7" fill="${lt(c, .45)}"/>`).join('')}</g>`;
}
function xusLeaf(p, x, y, s, r = 0, { seed = 1, c = '#8cc551' } = {}){
    const R = rng(p.id + 'xlf' + seed + x + y);
    const pts = Array.from({ length: 20 }, (_, i) => { const a = i / 20 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .1); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .34]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xusSm(pts, true)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .46)},1.5 Q0,${f(-s * .03)} ${f(s * .44)},0" stroke="#eef8d8" stroke-width="${f(s * .07)}" fill="none" stroke-linecap="round"/>
        ${[-.28, -.06, .16].map((t, i) => `<path d="M${f(s * t)},0 q${f(s * .08)},${f(i % 2 ? s * .18 : -s * .18)} ${f(s * .16)},${f(i % 2 ? s * .22 : -s * .22)}" stroke="#e6f4c8" stroke-width=".9" fill="none" opacity=".8"/>`).join('')}</g>`;
}
function xusTomHalf(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><circle r="10" fill="${p.g('#e23a2a', .3, .25)}" stroke="#a6221a" stroke-width=".6"/></g><circle r="8.2" fill="#f2604a"/>
        <path d="M0,-6 L0,6 M-6,0 L6,0" stroke="#f9a08c" stroke-width="1.4"/>${[[-3.6, -3.6], [3.6, -3.6], [-3.6, 3.6], [3.6, 3.6]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="2" ry="1.4" fill="#f8d36b" opacity=".85"/>`).join('')}</g>`;
}
function xusCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f(-s * .32)}" y="${f(-s * .32)}" width="${f(s * .5)}" height="${f(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
function xusGarlic(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 14)}><g ${p.sh(.4)}><path d="M-7,2 Q-6,-5 0,-6 Q7,-5 7,2 Q0,5 -7,2Z" fill="${p.g('#efd59a', .3, .25)}" stroke="#b88c40" stroke-width=".6"/></g><path d="M-4,-1 Q0,-4 4,-2" stroke="#fff" stroke-width=".9" fill="none" opacity=".7"/></g>`;
}
function xusThyme(p, x, y, L, r = 0, { c = '#4f7a34' } = {}){
    let lv = '';
    for (let i = 0; i < 7; i++){ const t = -L / 2 + 4 + i * (L - 8) / 6; lv += `<ellipse cx="${f(t)}" cy="${i % 2 ? 2 : -2}" rx="2.4" ry="1.2" transform="rotate(${i % 2 ? 30 : -30} ${f(t)} ${i % 2 ? 2 : -2})" fill="${c}"/>`; }
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q0,-2 ${L / 2},0" stroke="#7a6a3a" stroke-width="1" fill="none"/>${lv}</g>`;
}
function xusRosemary(p, x, y, L, r = 0){
    let lv = '';
    for (let i = 0; i < 12; i++){ const t = -L / 2 + 3 + i * (L - 6) / 11, sgn = i % 2 ? 1 : -1; lv += `<path d="M${f(t)},0 l${f(3)},${f(sgn * 5)}" stroke="#3f6a3a" stroke-width="1.6" stroke-linecap="round"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="M${-L / 2},0 L${L / 2},0" stroke="#6a5a3a" stroke-width="1.2"/>${lv}</g></g>`;
}
function xusLemonRound(p, x, y, s, { c = '#f4cf3a', flesh = '#fbe98e' } = {}){
    return `<g ${T(x, y)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".5"/></g><circle r="${f(s / 2 - 1.8)}" fill="#fffbe6"/><circle r="${f(s / 2 - 2.6)}" fill="${flesh}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0,0 L${f(Math.cos(i * .785) * (s / 2 - 2.8))},${f(Math.sin(i * .785) * (s / 2 - 2.8))}" stroke="#fffbe0" stroke-width="1.1"/>`).join('')}</g>`;
}
// burger bun, top (dome)
function xusBun(p, x, y, R, { seeds = true, c = '#c98436', seed = 1 } = {}){
    const Rr = rng(p.id + 'bun' + seed);
    let sd = '';
    if (seeds) for (const [sx, sy] of xusPts(Rr, 26, 0, 0, R * .78, R * .76)) sd += `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="1.8" ry="1" transform="rotate(${f1(Rr() * 180)} ${f1(sx)} ${f1(sy)})" fill="#fbf0d2" stroke="#c9a874" stroke-width=".3"/>`;
    return `<g ${T(x, y)}><g ${p.sh(1.2)}><path d="${xusSm(ring(R, 14, .05, Rr), true)}" fill="${p.rg(c, .35, .3, .36, .32)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>
        <ellipse cx="${f(-R * .22)}" cy="${f(-R * .26)}" rx="${f(R * .4)}" ry="${f(R * .26)}" fill="#f2c27a" opacity=".45" transform="rotate(-30 ${f(-R * .22)} ${f(-R * .26)})"/>${sd}
        <path d="M${f(-R * .6)},${f(-R * .3)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(-R * .1)},${f(-R * .66)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// cut face of a toasted bun (open sandwich)
function xusBunCut(p, x, y, R, { seed = 1 } = {}){
    const Rr = rng(p.id + 'bcut' + seed);
    return `<g ${T(x, y)}><g ${p.sh(1)}><path d="${xusSm(ring(R, 14, .06, Rr), true)}" fill="${p.g('#b8742e', .2, .3)}"/></g><g ${p.crumb(.8)}><path d="${xusSm(ring(R - 3, 14, .06, Rr), true)}" fill="${p.rg('#ecc890', .2, .2)}"/></g><g ${xusBlur(p, 3)}><circle r="${f(R * .6)}" fill="#d9a050" opacity=".4"/></g></g>`;
}
function xusPickle(p, x, y, s, r = 0){
    const pts = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.28, rr = s / 2 * (i % 2 ? .95 : 1); return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${xusSm(pts, true)}" fill="#4a6e24" stroke="#2f4a14" stroke-width=".5"/></g><circle r="${f(s / 2 - 1.8)}" fill="${p.rg('#b8c46a', .2, .15)}"/>
        ${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${f(Math.cos(i * 1.047) * s * .2)}" cy="${f(Math.sin(i * 1.047) * s * .2)}" rx="1.5" ry=".9" transform="rotate(${f(i * 60)} ${f(Math.cos(i * 1.047) * s * .2)} ${f(Math.sin(i * 1.047) * s * .2)})" fill="#e8ecb0"/>`).join('')}
        <path d="M${f(-s * .28)},${f(-s * .14)} Q${f(-s * .12)},${f(-s * .32)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1" fill="none" opacity=".55"/></g>`;
}
function xusAvoSlice(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${-L / 2},0 Q${-L / 4},${f(-L * .26)} ${L / 2},${f(-L * .1)} Q${L / 4},${f(L * .14)} ${-L / 2},0Z" fill="#3f6a24"/></g><path d="M${f(-L / 2 + 2)},-.4 Q${-L / 4},${f(-L * .22)} ${f(L / 2 - 2)},${f(-L * .1)} Q${L / 4},${f(L * .1)} ${f(-L / 2 + 2)},-.4Z" fill="${p.g('#c9df7a', .3, .2)}"/><path d="M${f(-L * .3)},${f(-L * .08)} Q0,${f(-L * .18)} ${f(L * .3)},${f(-L * .1)}" stroke="#fff" stroke-width=".9" fill="none" opacity=".6"/></g>`;
}
// grilled chicken breast slice / strip
function xusChickStrip(p, x, y, L, W, r = 0, { c = '#e2b072', grill = true, seed = 1 } = {}){
    const R = rng(p.id + 'cks' + seed + x);
    const d = xusSm([[-L / 2, -W * .3], [-L * .2, -W / 2], [L * .3, -W * .45], [L / 2, -W * .1], [L * .45, W * .4], [0, W / 2], [-L * .45, W * .35]], true);
    let g = '';
    if (grill) for (let i = 0; i < 3; i++){ const gx = -L * .3 + i * L * .28 + (R() - .5) * 2; g += `M${f1(gx)},${f1(-W * .4)} l${f1(W * .4)},${f1(W * .8)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${d}" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g><path d="${d}" fill="none" stroke="${dk(c, .15)}" stroke-width="2" opacity=".35" transform="scale(.85)"/>${g ? `<path d="${g}" stroke="#7a4a20" stroke-width="2" stroke-linecap="round" opacity=".7"/>` : ''}<path d="M${f(-L * .32)},${f(-W * .22)} Q0,${f(-W * .42)} ${f(L * .3)},${f(-W * .28)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// fried chicken drumstick
function xusDrum(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'drm' + seed + x);
    const k = L / 60;
    const body = 'M-30,0 C-30,-14 -16,-17 -4,-12 C6,-8 14,-5 20,-3.4 L22,3.4 C14,5 6,8 -4,12 C-16,17 -30,14 -30,0Z';
    let lumps = '';
    for (let i = 0; i < 10; i++){ const lx = -26 + R() * 40, ly = (R() - .5) * 18 * (1 - (lx + 26) / 60); lumps += `<path ${T(lx, ly)} d="${smooth(ring(3.6 + R() * 2.4, 7, .4, R))}" fill="${p.g('#cf8a34', .38, .32)}"/>`; }
    return `<g ${T(x, y, r, k)}><g ${p.sh(1)}><g ${p.rough(2.2, .2)}><path d="${body}" fill="${p.g('#b06a22', .3, .38)}" stroke="#6a3a0c" stroke-width=".8"/>${lumps}</g></g>
        <g ${p.crumb(.7)}><path d="${body}" fill="#d08a34" opacity=".3"/></g>
        <path d="M20,-2.6 L29,-2.4 Q33,-6 35,-3 Q37,0 35,3 Q33,6 29,2.4 L20,2.6Z" fill="${p.g('#f2e6cc', .3, .25)}" stroke="#bfa880" stroke-width=".6"/>
        <path d="M-22,-8 Q-12,-13 0,-9" stroke="#fff3d8" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// fried chicken thigh (lumpy rounded piece)
function xusThigh(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'thg' + seed + x);
    let lumps = '';
    for (let i = 0; i < 12; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; lumps += `<path ${T(Math.cos(a) * d * 1.1, Math.sin(a) * d * .85)} d="${smooth(ring(s * (.07 + R() * .05), 7, .4, R))}" fill="${p.g('#cf8a34', .38, .32)}"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2.4, .18)}><path d="${xusSm(ring(s / 2, 11, .2, R, 1.15, .88), true)}" fill="${p.g('#b06a22', .3, .38)}" stroke="#6a3a0c" stroke-width=".8"/>${lumps}</g></g>
        <g ${p.crumb(.7)}><path d="${xusSm(ring(s / 2 - 2, 11, .2, rng(p.id + 'thg' + seed + x), 1.15, .88), true)}" fill="#d08a34" opacity=".3"/></g>
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .12)},${f(-s * .32)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff3d8" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// jumbo pasta shell filled with ricotta
function xusShell(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'shl' + seed + x);
    const k = s / 30;
    let ridges = '';
    for (let i = 0; i < 7; i++){ const t = -11 + i * 3.6; ridges += `M${f(t)},-9.6 Q${f(t * 1.15)},0 ${f(t)},9.6`; }
    let fl = '';
    for (let i = 0; i < 8; i++) fl += `<circle cx="${f1((R() - .5) * 12)}" cy="${f1((R() - .5) * 7)}" r="${f1(.8 + R())}" fill="${R() < .7 ? '#3f7a2c' : '#2f5a22'}"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="M-15,0 C-15,-9 -6,-11 2,-10.6 C10,-10 15,-6 15,0 C15,6 10,10 2,10.6 C-6,11 -15,9 -15,0Z" fill="${p.g('#f0d48a', .3, .3)}" stroke="#b8923a" stroke-width=".7"/></g>
        <path d="${ridges}" stroke="#d8b464" stroke-width=".8" fill="none" opacity=".8"/>
        <path d="M-11,0 C-11,-5 -4,-6.4 2,-6 C8,-5.6 11,-3 11,0 C11,3.4 7,6 1,6 C-6,6 -11,4.4 -11,0Z" fill="${p.rg('#fbf6ea', .2, .12)}" stroke="#e2d8c0" stroke-width=".5"/>${fl}
        <path d="M-12,-5 Q-4,-10 6,-8" stroke="#fff6d6" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// bubbling browned cheese layer with blisters
function xusMelt(p, clipId, spots, { c = '#f6dc8a', brown = '#c06a1c' } = {}){
    return `<g clip-path="url(#${clipId})"><g ${xusBlur(p, 2.6)}>${spots.map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="${brown}" opacity=".5"/>`).join('')}</g><g ${xusBlur(p, 1)}>${spots.map(([x, y, a, b]) => `<ellipse cx="${x + 1}" cy="${y + 1}" rx="${f(a * .4)}" ry="${f(b * .4)}" fill="${dk(brown, .3)}" opacity=".45"/>`).join('')}</g></g>`;
}
// ---------- side-dish parts ----------
function xusDeviled(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'dev' + seed + x);
    let ros = '';
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.28, d = s * .1; ros += `<circle cx="${f1(Math.cos(a) * d * 1.3)}" cy="${f1(Math.sin(a) * d)}" r="${f1(s * .12)}" fill="${p.rg('#f8cf4a', .3, .2)}" stroke="#d9a42a" stroke-width=".5"/>`; }
    let pap = '';
    for (let i = 0; i < 8; i++) pap += `<circle cx="${f1((R() - .5) * s * .4)}" cy="${f1((R() - .5) * s * .3)}" r="${f1(.5 + R() * .6)}" fill="#c8341a" opacity=".85"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${f(s / 2)}" ry="${f(s * .36)}" fill="${p.rg('#fffdf6', .1, .12)}" stroke="#d8d0bf" stroke-width=".6"/></g>${ros}<circle r="${f(s * .1)}" fill="#fad85e"/>${pap}
        <path d="M${f(-s * .4)},${f(-s * .14)} Q${f(-s * .3)},${f(-s * .3)} ${f(-s * .1)},${f(-s * .33)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
function xusSprout(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'spt' + seed + x);
    const out = 'M-12,1 C-12,-8 -6,-12 0,-12 C6,-12 12,-8 12,1 C12,8 7,11 0,11 C-7,11 -12,8 -12,1Z';
    if (seed % 3 === 0) return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.6)}><path d="${out}" fill="${p.g('#5a9a34', .3, .3)}" stroke="#2f5a18" stroke-width=".6"/></g>
        <path d="M-10,4 C-6,-6 4,-8 10,-2 M-8,8 C-2,2 6,2 9,6 M-4,-10 C2,-6 4,0 2,10" stroke="#3a6a1e" stroke-width="1" fill="none" opacity=".8"/>
        <g ${xusBlur(p, 1.6)}><ellipse cx="5" cy="5" rx="5" ry="3.4" fill="#6a4410" opacity=".6"/></g>
        <path d="M-7,-5 Q-3,-9 3,-9" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.6)}><path d="${out}" fill="${p.g('#4a8a2c', .25, .3)}" stroke="#244a12" stroke-width=".6"/></g>
        <path d="M-10,1 C-10,-6.6 -5,-10 0,-10 C5,-10 10,-6.6 10,1 C10,6.6 5.6,9 0,9 C-5.6,9 -10,6.6 -10,1Z" fill="${p.rg('#e2e6a6', .2, .15)}"/>
        <path d="M-8,4 C-8,-3 -4,-7 0,-7.4 C4,-7 8,-3 8,4 M-5,5 C-5,-1 -2.4,-4 0,-4.4 C2.4,-4 5,-1 5,5" stroke="#a8c060" stroke-width=".9" fill="none"/>
        <path d="M0,9 L0,0" stroke="#f0eec0" stroke-width="2.4" stroke-linecap="round"/>
        <g ${xusBlur(p, 2)}><ellipse cx="${f1(3 + R() * 2)}" cy="${f1(2 + R() * 3)}" rx="6" ry="4.6" fill="#7a4a10" opacity=".7"/></g>
        <path d="M-7,-5 Q-3,-8.6 2,-8.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function xusSquash(p, x, y, s, r = 0, { yellow = false, seed = 1 } = {}){
    const R = rng(p.id + 'sq' + seed + x);
    const rim = yellow ? '#e8b81e' : '#3f7a2c', flesh = yellow ? '#fbefb6' : '#e6efc0';
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="${rim}" stroke="${dk(rim, .3)}" stroke-width=".5"/></g><circle r="${f(s / 2 - 1.6)}" fill="${p.rg(flesh, .2, .15)}"/>
        ${xusDots([0, 1, 2, 3, 4].map(i => [Math.cos(i * 1.257) * s * .18, Math.sin(i * 1.257) * s * .18]), 1.1, dk(flesh, .14))}
        <g ${xusBlur(p, 1.6)}><ellipse cx="${f1((R() - .5) * s * .3)}" cy="${f1((R() - .5) * s * .3)}" rx="${f(s * .22)}" ry="${f(s * .16)}" fill="#c8862a" opacity=".55"/></g></g>`;
}
// fried okra coin with cornmeal crust
function xusFriedOkra(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'fok' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${xusSm(ring(s / 2, 9, .2, R, 1.1, .95), true)}" fill="${p.g('#d49a40', .35, .35)}" stroke="#94601e" stroke-width=".5"/>
        <path d="${smooth(Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.28, rr = i % 2 ? s * .12 : s * .2; return [Math.cos(a) * rr, Math.sin(a) * rr]; }), true, .3)}" fill="#a8a848" stroke="#6e7424" stroke-width=".5" opacity=".85"/></g>`;
}
// place drawers on spots in turn
const xusMix = (spots, fns) => spots.map(([x, y, r], i) => fns[i % fns.length](x, y, r, i)).join('');

// =========================================================
export default {
    // ---------------- soups ----------------
    // New England clam chowder: thick white chowder, potato dice, chopped clams, a few shells, bacon, parsley, oyster crackers
    us_clamchowder: p => {
        const R = rng(p.id + 'cc');
        const sp = xusSpots('cc', 22, 58, 58, 16);
        return [
            xusSoup(p, { glaze: '#2f5f8a', inside: '#f6f2ea', broth: '#f1e9d6', cloud: .5 }),
            `<g ${p.sh(.5)}>`, xusMix(sp, [
                (x, y, r) => xusDice(p, x, y, 15, r, '#f0dca6'),
                (x, y, r, i) => `<path ${T(x, y, r)} d="${smooth(ring(5.8, 6, .5, R, 1.3, .8))}" fill="${p.g('#d9b48e', .3, .3)}" stroke="#a07a5a" stroke-width=".5"/>`,
                (x, y, r) => xusDice(p, x, y, 14, r, '#f3e2b4'),
                (x, y, r) => xusCelery(p, x, y, 11, r),
            ]), `</g>`,
            xusVeil('#f3ecdc', .35),
            K.clam(p, 74, 118, 24, -20), K.clam(p, 130, 70, 22, 30),
            `<g ${p.sh(.5)}>`, xusBacon(p, 104, 92, 15, 20), xusBacon(p, 86, 74, 13, -30), xusBacon(p, 124, 116, 14, 60), xusBacon(p, 80, 136, 12, 10), `</g>`,
            xusCracker(p, 142, 98, 17, 10), xusCracker(p, 134, 82, 16, 40), xusCracker(p, 60, 90, 16, -10),
            xusParsley(p, 100, 100, 100, { n: 26 }),
            xusSpr(p, 100, 100, 110, { c: '#3a2e26', n: 18, r: .55 }),
            xusShine(100, 100, 74, .5),
        ].join('');
    },

    // Beef chili with beans: deep red chili, kidney beans, beef, cheddar, sour cream, green onion
    us_chili: p => {
        const sp = xusSpots('chl', 30, 58, 58, 13);
        return [
            xusSoup(p, { glaze: '#e3d6bc', inside: '#f6f1e6', broth: '#8e3218' }),
            xusGrains(p, 100, 100, 62, 62, ['#6a2a14', '#9a4426', '#7a3418'], { n: 120, size: 2.6, seed: 1 }),
            `<g ${p.sh(.5)}>`, xusMix(sp, [
                (x, y, r) => xusBean(p, x, y, 17, r),
                (x, y, r) => xusBean(p, x, y, 16, r, { c: '#8e3226' }),
                (x, y, r) => xusDice(p, x, y, 9, r, '#c0402a'),
                (x, y, r) => xusDice(p, x, y, 8, r, '#5f8f34'),
            ]), `</g>`,
            xusOil(p, 100, 100, 58, 14, { c: '#d9642a' }),
            xusCheddar(p, 92, 92, 26, 22, 30, { seed: 1 }),
            xusDollop(p, 114, 112, 26),
            K.scallions(p, 100, 102, 64, { n: 18, c: '#4f9a34' }),
            xusShine(100, 100, 74, .4),
        ].join('');
    },

    // White chicken chili: creamy pale broth, white beans, shredded chicken, green chiles, jack cheese, lime, cilantro
    us_whitechili: p => {
        const R = rng(p.id + 'wc');
        const sp = xusSpots('wc', 32, 60, 60, 12);
        return [
            xusSoup(p, { glaze: '#3f7a5a', inside: '#f6f2ea', broth: '#e8dcc0', cloud: .4 }),
            `<g ${p.sh(.5)}>`, xusMix(sp, [
                (x, y, r) => xusBean(p, x, y, 16, r, { c: '#f2e8d2' }),
                (x, y, r, i) => xusShred(p, x, y, 18, r, { seed: i }),
                (x, y, r) => xusBean(p, x, y, 15, r, { c: '#efe2c6' }),
                (x, y, r) => xusDice(p, x, y, 8, r, '#7aa63c'),
                (x, y, r) => xusBean(p, x, y, 16, r, { c: '#f4ecd8' }),
            ]), `</g>`,
            xusCheddar(p, 96, 96, 22, 18, 18, { seed: 2, c: '#f6ecc4', c2: '#fbf4da' }),
            xusWedge(p, 140, 128, 30, 35),
            xusCilantro(p, 88, 84, 16, -20), xusCilantro(p, 104, 110, 14, 40), xusCilantro(p, 70, 112, 13, 10), xusCilantro(p, 120, 76, 13, 70),
            xusShine(100, 100, 74, .45),
        ].join('');
    },

    // Corn chowder: pale yellow chowder, lots of corn, potato dice, bacon, chives
    us_cornchowder: p => [
        xusSoup(p, { glaze: '#d9a33a', inside: '#f7f2e6', broth: '#f1dc9c', cloud: .45 }),
        `<g ${p.sh(.4)}>`, ...xusSpots('ccp', 12, 56, 56, 19).map(([x, y, r]) => xusDice(p, x, y, 15, r, '#f3e3b0')), `</g>`,
        xusKernels(p, 100, 100, 60, 60, 80, { seed: 1, s: 6 }),
        xusVeil('#f3e2a8', .25),
        xusKernels(p, 98, 96, 50, 50, 30, { seed: 2, s: 6.6 }),
        `<g ${p.sh(.5)}>`, xusBacon(p, 96, 90, 16, 10), xusBacon(p, 114, 106, 14, -40), xusBacon(p, 86, 110, 13, 60), `</g>`,
        xusChives(p, 100, 98, 30, 24),
        xusSpr(p, 100, 100, 110, { c: '#3a2e26', n: 16, r: .55 }),
        xusShine(100, 100, 74, .5),
    ].join(''),

    // Loaded baked potato soup: creamy potato soup piled with cheddar, bacon, sour cream and green onion
    us_potatosoup: p => [
        xusSoup(p, { glaze: '#8a5a3a', inside: '#f6f1e6', broth: '#efe3c8', cloud: .45 }),
        `<g ${p.sh(.4)}>`, ...xusSpots('pts', 14, 58, 58, 19).map(([x, y, r]) => xusDice(p, x, y, 15, r, '#f2e0ac')), `</g>`,
        xusVeil('#efe3c8', .4),
        xusCheddar(p, 96, 96, 40, 36, 44, { seed: 1 }),
        xusDollop(p, 104, 98, 30),
        `<g ${p.sh(.5)}>`, ...[[76, 82, 30], [126, 84, -20], [80, 120, 70], [124, 124, 10], [100, 70, 40], [62, 104, -50], [138, 104, 80]].map(([x, y, r]) => xusBacon(p, x, y, 15, r)), `</g>`,
        K.scallions(p, 100, 100, 90, { n: 24, c: '#4f9a34' }),
        xusShine(100, 100, 74, .45),
    ].join(''),

    // Broccoli cheddar soup: thick golden cheddar soup, small broccoli florets, shredded carrot, extra cheddar
    us_broccolicheddar: p => {
        const R = rng(p.id + 'bc');
        return [
            xusSoup(p, { glaze: '#2f6a5a', inside: '#f7f2e6', broth: '#eab040', cloud: .4 }),
            `<g ${p.sh(.5)}>`, ...xusSpots('bcb', 12, 56, 56, 23).map(([x, y, r]) => K.broccoli(p, x, y, 25 + R() * 5, r, { c: R() < .5 ? '#3f8a34' : '#4f9a3a' })), `</g>`,
            K.shreds(p, 100, 100, 100, { c: '#ef7f30', n: 16, w: 1.6, len: .14, seed: 2 }),
            xusVeil('#eab040', .22),
            xusCheddar(p, 104, 96, 22, 18, 16, { seed: 3, c: '#f39a1e', c2: '#f8b838' }),
            xusSpr(p, 100, 100, 110, { c: '#3a2e26', n: 14, r: .55 }),
            xusShine(100, 100, 74, .5),
        ].join('');
    },

    // Split pea soup with ham: thick olive-green purée, diced ham, carrot, pepper
    us_splitpea: p => [
        xusSoup(p, { glaze: '#6e4b33', inside: '#f3ecdf', broth: '#9aa646', cloud: .4 }),
        `<g ${xusBlur(p, 1.2)}>${xusDots(xusPts(rng('sp1'), 60, 100, 100, 64, 64), 2.6, '#aab656')}${xusDots(xusPts(rng('sp2'), 40, 100, 100, 64, 64), 2.2, '#86923a')}</g>`,
        `<g ${p.sh(.5)}>`, ...xusSpots('spp', 16, 52, 52, 16).map(([x, y, r], i) => i % 3 === 2 ? xusDice(p, x, y, 10, r, '#ef7f30') : xusDice(p, x, y, 15, r, '#e9968c')), `</g>`,
        xusSpr(p, 100, 100, 120, { c: '#2a2420', n: 30, r: .6 }),
        xusParsley(p, 104, 98, 40, { n: 8 }),
        xusShine(100, 100, 74, .45),
    ].join(''),

    // Beef barley soup: brown beef broth, beef cubes, plump barley, carrot, celery, mushroom slices
    us_beefbarley: p => {
        const sp = xusSpots('bb', 22, 56, 56, 14);
        return [
            xusSoup(p, { glaze: '#3d3a38', inside: '#efe7da', broth: '#7a4a26' }),
            xusGrainLines(p, 100, 100, 62, 62, 110, { c: '#ead9ae', len: 3.6, w: 3 }),
            `<g ${p.sh(.6)}>`, xusMix(sp, [
                (x, y, r) => xusDice(p, x, y, 15, r, '#7a4226'),
                (x, y, r) => K.carrotRound(p, x, y, 11),
                (x, y, r) => xusMushSlice(p, x, y, 15, r, { c: '#8a5a36', flesh: '#c9a77a' }),
                (x, y, r) => xusDice(p, x, y, 14, r, '#82482a'),
                (x, y, r) => xusCelery(p, x, y, 9, r),
            ]), `</g>`,
            xusVeil('#7a4a26', .18),
            xusParsley(p, 100, 100, 90, { n: 18 }),
            xusShine(100, 100, 74, .45),
        ].join('');
    },

    // Minestrone: tomato broth with ditalini, cannellini beans, zucchini, carrot, celery, spinach, parmesan
    us_minestrone: p => {
        const R = rng(p.id + 'mn');
        const sp = xusSpots('mn', 28, 58, 58, 14);
        return [
            xusSoup(p, { glaze: '#c8452f', inside: '#f6f1e6', broth: '#c4532e' }),
            `<g ${p.sh(.5)}>`, xusMix(sp, [
                (x, y, r) => xusTube(p, x, y, 16, r),
                (x, y, r) => xusBean(p, x, y, 17, r, { c: '#f2e8d2' }),
                (x, y, r) => `<g ${T(x, y, r, 1.5)}><path d="M-6,1 A6,6 0 0 1 6,1Z" fill="#3f7a2c"/><path d="M-4.8,1 A4.8,4.6 0 0 1 4.8,1Z" fill="#e2ecb0"/></g>`,
                (x, y, r) => xusDice(p, x, y, 11, r, '#ef7f30'),
                (x, y, r) => xusLeafy(p, x, y, 22, r, { c: '#2f6a2c', frill: false }),
                (x, y, r) => xusCelery(p, x, y, 11, r),
                (x, y, r) => xusTube(p, x, y, 13, r),
            ]), `</g>`,
            xusOil(p, 100, 100, 56, 10, { c: '#f0a040', op: .5 }),
            xusSpr(p, 100, 96, 60, { c: '#fbf3dc', n: 30, r: 1 }),
            xusBasil(p, 108, 92, 16, -30),
            xusShine(100, 100, 74, .45),
        ].join('');
    },

    // French onion soup: brown crock with lug handles, molten broiled Gruyère over the toast, dripping down the side
    us_frenchonion: p => {
        const R = rng(p.id + 'fo');
        const crock = '#7a4426';
        let blis = '';
        for (const [x, y] of xusPts(R, 16, 98, 96, 46, 44)) blis += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(4 + R() * 7)}" ry="${f1(3 + R() * 5)}" fill="${R() < .5 ? '#b8661c' : '#8e4612'}" opacity="${f1(.4 + R() * .4)}"/>`;
        const top = xusSm(ring(64, 16, .14, R, 1, .96), true);
        return [
            `<g ${p.sh(1.8)}><rect x="2" y="88" width="196" height="24" rx="10" fill="${p.g(crock, .2, .3)}"/><circle cx="100" cy="100" r="88" fill="${p.rg(crock, .25, .3, .35, .3)}"/></g>`,
            `<circle cx="100" cy="100" r="84" fill="none" stroke="${lt(crock, .3)}" stroke-width="1.4" opacity=".6"/>`,
            `<circle cx="100" cy="100" r="76" fill="${p.rg('#5a2e14', .15, .3, .6, .62)}"/>`,
            K.liquid(p, { R: 74, c: '#7a4418', shine: false }),
            ...[[44, 150, 20], [154, 56, -30], [158, 140, 40]].map(([x, y, r]) => xusOnionStrip(p, x, y, 16, r, { c: '#c98a40', op: .8 })),
            `<g ${p.sh(1.2)}><path ${T(100, 98)} d="${top}" fill="${p.rg('#f2cf72', .25, .3, .4, .36)}"/></g>`,
            `<path d="M146,128 Q156,146 150,160 Q146,166 142,158 Q140,142 134,134Z" fill="${p.g('#efc860', .2, .3)}"/>`,
            `<path d="M52,70 Q38,60 34,72 Q34,80 44,82Z" fill="${p.g('#f2cf72', .2, .3)}"/>`,
            `<g ${xusBlur(p, 2.4)}>${blis}</g>`,
            `<g ${p.crumb(.4)}><path ${T(100, 98)} d="${top}" fill="#e8b450" opacity=".35"/></g>`,
            `<path d="M66,72 Q86,52 120,58" stroke="#fff6d0" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`,
            xusSpr(p, 110, 104, 50, { c: '#4f8a34', n: 10, r: .9 }),
        ].join('');
    },

    // Chicken and sausage gumbo: dark roux gumbo over a scoop of white rice, andouille, chicken, okra, green pepper, green onion
    us_gumbo: p => {
        const sp = xusSpots('gb', 26, 60, 60, 15).filter(([x, y]) => Math.hypot(x - 100, y - 100) > 34);
        return [
            xusSoup(p, { glaze: '#e8e0d0', inside: '#f6f1e6', band: '#2c4c7c', broth: '#6a3a1a' }),
            `<g ${p.sh(.6)}>`, xusMix(sp, [
                (x, y, r, i) => xusCoin(p, x, y, 15, { c: '#6e2c18', inner: '#a85a3a', seed: i }),
                (x, y, r, i) => xusShred(p, x, y, 18, r, { seed: i, c: '#c9925a' }),
                (x, y) => K.okra(p, x, y, 12),
                (x, y, r) => K.pepperPiece(p, x, y, 11, r, { c: '#4a8a2c' }),
                (x, y, r, i) => xusCoin(p, x, y, 14, { c: '#6e2c18', inner: '#a85a3a', seed: i }),
                (x, y, r) => xusCelery(p, x, y, 9, r),
            ]), `</g>`,
            xusOil(p, 100, 100, 60, 12, { c: '#c8642a', op: .5 }),
            xusRice(p, 100, 100, 60, { seed: 1 }),
            K.scallions(p, 100, 100, 110, { n: 26, c: '#4f9a34' }),
            xusShine(100, 100, 74, .35),
        ].join('');
    },

    // Chicken tortilla soup: brick-red broth, crisp tortilla strips, avocado, chicken, corn, black beans, lime, cilantro
    us_tortillasoup: p => {
        const R = rng(p.id + 'ts');
        const sp = xusSpots('ts', 22, 58, 58, 15);
        return [
            xusSoup(p, { glaze: '#e0a23a', inside: '#f7f2e6', broth: '#c2502a' }),
            `<g ${p.sh(.5)}>`, xusMix(sp, [
                (x, y, r, i) => xusShred(p, x, y, 24, r, { seed: i }),
                (x, y, r) => xusBean(p, x, y, 13, r, { c: '#2e2420' }),
                (x, y, r) => xusDice(p, x, y, 10, r, '#d9402a'),
            ]), `</g>`,
            xusKernels(p, 100, 100, 56, 56, 22, { s: 5.6 }),
            `<g ${p.sh(.5)}>`, ...[[118, 96], [104, 116], [126, 114], [112, 82]].map(([x, y], i) => xusDice(p, x, y, 15, i * 20, '#a9cf5a')), `</g>`,
            ...[[78, 80, -30], [92, 68, 20], [66, 98, 70], [94, 88, -60], [80, 104, 10], [64, 78, -10]].map(([x, y, r], i) => i % 2 ? xusChip(p, x, y, 24, r, { seed: i }) : xusTortStrip(p, x, y, 28, r)),
            xusWedge(p, 140, 136, 28, 30),
            xusCilantro(p, 112, 100, 15, 20), xusCilantro(p, 74, 124, 14, -30), xusCilantro(p, 128, 72, 13, 60),
            xusShine(100, 100, 74, .4),
        ].join('');
    },

    // Lentil soup: earthy brown lentil soup, carrot, celery, tomato, wilted spinach, parsley
    us_lentil: p => {
        const P1 = xusPts(rng('le1'), 150, 100, 100, 64, 64), P2 = xusPts(rng('le2'), 90, 100, 100, 64, 64);
        return [
            xusSoup(p, { glaze: '#c9bfae', inside: '#f3ecdf', broth: '#8b5a2b' }),
            xusDots(P1, 2.6, '#7a4a22', { stroke: '#5a3416', sy: .8 }), xusDots(P2, 2.6, '#a06a38', { stroke: '#6e4420', sy: .8 }),
            xusHi(P2.slice(0, 50), 2.6),
            `<g ${p.sh(.5)}>`, ...xusSpots('lec', 14, 54, 54, 18).map(([x, y, r], i) => i % 3 === 1 ? xusCelery(p, x, y, 9, r) : xusDice(p, x, y, 8, r, i % 3 ? '#c8402a' : '#ef7f30')), `</g>`,
            `<g ${p.sh(.5)}>`, ...xusSpots('les', 6, 46, 46, 26).map(([x, y, r], i) => xusLeafy(p, x, y, 24, r, { c: '#2f6a2c', frill: false, seed: i })), `</g>`,
            xusVeil('#8b5a2b', .12),
            xusParsley(p, 100, 100, 70, { n: 14 }),
            xusShine(100, 100, 74, .4),
        ].join('');
    },

    // Butternut squash soup: velvety orange soup, cream drizzle, toasted pepitas, sage, black pepper
    us_butternut: p => [
        xusSoup(p, { glaze: '#5a7a5a', inside: '#f6f1e6', broth: '#e5862a' }),
        `<circle cx="94" cy="92" r="52" fill="#f2a248" opacity=".35"/>`,
        `<path d="M64,112 C70,80 108,70 128,86 C144,100 128,124 104,122 C88,120 86,104 100,100 C110,97 116,106 110,110" stroke="#e8c4a0" stroke-width="4.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
        `<path d="M64,112 C70,80 108,70 128,86 C144,100 128,124 104,122 C88,120 86,104 100,100 C110,97 116,106 110,110" stroke="#fdf6ec" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        ...[[118, 64, 20], [126, 70, 80], [112, 70, -40], [70, 128, 30], [78, 134, -20], [62, 136, 70], [138, 116, 10], [132, 126, 60]].map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="4" ry="2.2" fill="#5a8a3a" stroke="#3a5a24" stroke-width=".5"/><ellipse cx="-.8" cy="-.6" rx="1.8" ry=".7" fill="#a8cc7a"/></g>`),
        xusBasil(p, 120, 80, 18, -40, { c: '#6a8a5a' }), xusBasil(p, 134, 90, 15, 30, { c: '#5f8050' }),
        xusSpr(p, 100, 100, 110, { c: '#2a2420', n: 22, r: .6 }),
        xusShine(100, 100, 74, .5),
    ].join(''),

    // Stuffed pepper soup: tomato broth with ground beef, green and red bell pepper, rice, cheddar
    us_stuffedpepper: p => {
        const sp = xusSpots('spe', 24, 58, 58, 14);
        return [
            xusSoup(p, { glaze: '#e3d6bc', inside: '#f6f1e6', broth: '#b8442a' }),
            xusGrainLines(p, 100, 100, 62, 62, 60, { c: '#f4eedc', len: 3.6, w: 2.2 }),
            xusGrains(p, 100, 100, 60, 60, ['#6a3418', '#8a4a26'], { n: 70, size: 2.4 }),
            `<g ${p.sh(.5)}>`, xusMix(sp, [
                (x, y, r) => K.pepperPiece(p, x, y, 17, r, { c: '#3f8f2f' }),
                (x, y, r) => K.pepperPiece(p, x, y, 17, r, { c: '#d9342a' }),
                (x, y, r) => xusDice(p, x, y, 10, r, '#c8402a'),
            ]), `</g>`,
            xusCheddar(p, 100, 98, 24, 20, 20),
            xusParsley(p, 100, 100, 80, { n: 14 }),
            xusShine(100, 100, 74, .4),
        ].join('');
    },

    // Sausage, potato and kale soup (Zuppa Toscana style): creamy broth, sausage crumbles, potato slices, kale, parmesan
    us_sausagekale: p => {
        const R = rng(p.id + 'sk');
        return [
            xusSoup(p, { glaze: '#4a4440', inside: '#f3ede2', broth: '#eadfca', cloud: .35 }),
            `<g ${p.sh(.4)}>`, ...xusSpots('skp', 10, 54, 54, 22).map(([x, y, r]) => `<g ${T(x, y, r, 1.3)}><ellipse rx="10" ry="7" fill="${p.g('#f0dca6', .3, .2)}" stroke="#c9ad6a" stroke-width=".6"/><path d="M-6,-3 Q0,-5.6 5,-3.6" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/></g>`), `</g>`,
            xusVeil('#eadfca', .2),
            `<g ${p.sh(.5)}>`, ...xusSpots('skk', 9, 52, 52, 25).map(([x, y, r], i) => xusKale(p, x, y, 32, r, { seed: i })), `</g>`,
            `<g ${p.sh(.5)}><g ${p.rough(2.4, .35)}>`, ...xusSpots('sks', 22, 58, 58, 12).map(([x, y]) => `<path ${T(x, y, R() * 360)} d="${smooth(ring(3.6 + R() * 1.8, 8, .6, R, 1.2, .9))}" fill="${p.g(R() < .5 ? '#a0583a' : '#8a4a2e', .3, .3)}" stroke="#5e2e16" stroke-width=".5"/>`), `</g></g>`,
            xusSpr(p, 100, 100, 100, { c: '#fbf3dc', n: 24, r: .9 }),
            xusSpr(p, 100, 100, 110, { c: '#c4401c', n: 12, r: .6 }),
            xusShine(100, 100, 74, .45),
        ].join('');
    },

    // Black bean soup: dark velvety black bean soup with whole beans, sour cream, red pepper, cilantro, lime
    us_blackbean: p => {
        const P = xusPts(rng('bk1'), 44, 100, 100, 62, 62);
        return [
            xusSoup(p, { glaze: '#d9a33a', inside: '#f7f2e6', broth: '#3e2a24' }),
            `<circle cx="92" cy="90" r="46" fill="#5a3e32" opacity=".35"/>`,
            `<g ${p.sh(.4)}>`, ...P.map(([x, y], i) => xusBean(p, x, y, 10, i * 37, { c: i % 2 ? '#2a1e1c' : '#3a2a26' })), `</g>`,
            xusDollop(p, 100, 98, 32),
            `<g ${p.sh(.4)}>`, ...[[76, 76], [128, 82], [80, 126], [124, 128], [66, 102], [138, 106], [104, 66]].map(([x, y], i) => xusDice(p, x, y, 7, i * 30, '#d9342a')), `</g>`,
            xusWedge(p, 146, 134, 26, 30),
            xusCilantro(p, 96, 92, 16, -20), xusCilantro(p, 112, 104, 14, 40), xusCilantro(p, 70, 118, 13, 10),
            xusShine(100, 100, 74, .4),
        ].join('');
    },

    // Cream of mushroom soup: silky beige soup, cream swirl, sautéed mushroom slices, parsley
    us_mushroom: p => [
        xusSoup(p, { glaze: '#6e4b33', inside: '#f3ecdf', broth: '#c9b08c', cloud: .4 }),
        `<g ${xusBlur(p, 1)}>${xusDots(xusPts(rng('mu1'), 40, 100, 100, 62, 62), 2.4, '#a88a64')}</g>`,
        `<path d="M58,120 C60,86 110,66 136,90 C152,110 130,132 104,128" stroke="#f6eee2" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`,
        `<g ${p.sh(.5)}>`, ...[[84, 78, 20], [118, 80, -30], [98, 104, 60], [66, 108, -10], [130, 112, 30], [102, 136, -60], [70, 140, 40], [138, 142, 0], [108, 56, 80], [52, 84, -40], [148, 80, 50]].map(([x, y, r]) => xusMushSlice(p, x, y, 27, r, { c: '#8a5a36', flesh: '#e0c9a2' })), `</g>`,
        xusParsley(p, 100, 100, 70, { n: 22 }),
        xusSpr(p, 100, 100, 110, { c: '#2a2420', n: 14, r: .55 }),
        xusShine(100, 100, 74, .45),
    ].join(''),

    // Chicken and dumplings: creamy chicken stew with fluffy drop dumplings, chicken, carrot, celery, parsley
    us_chickendumplings: p => {
        const sp = xusSpots('cd', 18, 58, 58, 13);
        return [
            xusSoup(p, { glaze: '#4f7aa0', inside: '#f6f2ea', broth: '#e9cf94', cloud: .35 }),
            `<g ${p.sh(.5)}>`, xusMix(sp, [
                (x, y, r, i) => xusShred(p, x, y, 22, r, { seed: i }),
                (x, y) => K.carrotRound(p, x, y, 13),
                (x, y, r) => xusCelery(p, x, y, 9, r),
            ]), `</g>`,
            ...[[82, 80, 34], [124, 84, 32], [100, 118, 36], [70, 118, 28], [134, 122, 26]].map(([x, y, s], i) => xusDumpling(p, x, y, s, { seed: i })),
            xusParsley(p, 100, 100, 110, { n: 30 }),
            xusSpr(p, 100, 100, 110, { c: '#2a2420', n: 12, r: .55 }),
            xusShine(100, 100, 74, .4),
        ].join('');
    },

    // Italian wedding soup: clear golden broth, tiny meatballs, acini di pepe, spinach, carrot, parmesan
    us_wedding: p => {
        const sp = xusSpots('wd', 22, 58, 58, 15);
        return [
            xusSoup(p, { glaze: '#f4efe4', inside: '#fbf8f1', band: '#3f7a5a', broth: '#e2b860', op: .92 }),
            `<g ${xusBlur(p, .4)}>${xusDots(xusPts(rng('wd1'), 110, 100, 100, 64, 64), 1.4, '#f6dc96', { stroke: '#c9a250' })}</g>`,
            `<g ${p.sh(.5)}>`, ...xusSpots('wds', 8, 56, 56, 24).map(([x, y, r], i) => xusLeafy(p, x, y, 22, r, { c: '#2f7a30', frill: false, seed: i })), `</g>`,
            ...sp.map(([x, y, r], i) => i % 3 === 2 ? xusDice(p, x, y, 6, r, '#ef7f30') : K.meatball(p, x, y, 15, { c: '#9a5a32' })).join(''),
            `<circle cx="100" cy="100" r="70" fill="#f2cc70" opacity=".08"/>`,
            xusSpr(p, 100, 100, 100, { c: '#fbf3dc', n: 20, r: .9 }),
            xusShine(100, 100, 74, .5),
        ].join('');
    },
    // ---------------- mains ----------------
    // Meatloaf: three thick slices with a glossy ketchup glaze, mashed potatoes with butter, green beans
    us_meatloaf: p => {
        const slice = (x, y, r, seed) => {
            const R = rng(p.id + 'ml' + seed);
            const pts = [[-30, -19], [0, -21], [30, -19], [31, 0], [30, 19], [0, 20], [-30, 19], [-31, 0]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
            return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${smooth(pts, true, .5)}" fill="${p.g('#8a5232', .25, .3)}" stroke="#5a3018" stroke-width=".8"/></g>
                ${xusGrains(p, 0, 4, 24, 12, ['#a86e48', '#6a381c', '#caa070'], { n: 30, size: 1.3, seed })}
                <path d="M-30,-15 Q0,-22 30,-15" stroke="#9a2414" stroke-width="9" fill="none" stroke-linecap="round"/>
                <path d="M-30,-15 Q0,-22 30,-15" stroke="${p.g('#d23a22', .3, .2)}" stroke-width="6.6" fill="none" stroke-linecap="round"/>
                <path d="M-22,-17.4 Q-6,-21 10,-19.6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
                <path d="M-27,17 Q0,20 27,17" stroke="#4a2410" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
        };
        const R = rng(p.id + 'mlb');
        return [
            K.plate(p, { rim: '#9a2a24' }),
            `<g ${p.sh(1.1)}>`, xusMound(p, 60, 126, 38, 34, '#f6e7bd', { seed: 2, l: .35, d: .22 }), `</g>`,
            `<path d="M42,128 C44,110 70,104 82,116 C90,126 80,140 66,136 C58,134 58,124 66,122" stroke="#e2cc94" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
            xusButter(p, 66, 124, 14, 10),
            `<g ${p.sh(.7)}>`, ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => xusGBean(p, 104 + i * 5.4, 150 - i * 4.4 + (i % 2) * 3, 46 + R() * 8, -60 + (R() - .5) * 26, { c: i % 2 ? '#4f9a34' : '#5aa63a', bend: (R() - .5) * 5 })), `</g>`,
            slice(134, 70, -18, 3), slice(106, 82, -18, 2), slice(78, 94, -18, 1),
            xusParsley(p, 64, 126, 30, { n: 10 }),
            xusSpr(p, 140, 120, 40, { c: '#2a2420', n: 10, r: .55 }),
        ].join('');
    },

    // Pot roast: deep oval dish of fork-tender pulled beef, potatoes, carrots and onion in brown gravy, thyme
    us_potroast: p => {
        const chunk = (x, y, s, r, seed) => {
            const R = rng(p.id + 'prc' + seed);
            let a = '', b = '';
            for (let i = 0; i < 7; i++){ const yy = -s * .3 + i * s * .1, x0 = -s * .45 + R() * 4, L = s * (.6 + R() * .3); const d = `M${f1(x0)},${f1(yy)} q${f1(L / 2)},${f1((R() - .5) * 4)} ${f1(L)},${f1((R() - .5) * 3)}`; if (i % 2) a += d; else b += d; }
            return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2.6, .16)}><path d="${xusSm(ring(s / 2, 11, .22, R, 1.2, .78), true)}" fill="${p.g('#7a4426', .3, .32)}" stroke="#4a2410" stroke-width=".7"/></g></g>
                <path d="${a}" stroke="#4e2610" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/><path d="${b}" stroke="#a8683e" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".8"/>
                <path d="M${f(-s * .34)},${f(-s * .24)} Q${f(-s * .1)},${f(-s * .38)} ${f(s * .2)},${f(-s * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
        };
        return [
            K.ovalDish(p, { rx: 94, ry: 78, base: '#f3ece0', rim: '#8a5226', deep: true }),
            K.pool(p, 100, 100, 142, '#7a4a26', { op: .9, seed: 1, sy: .8 }),
            chunk(84, 82, 48, -10, 1), chunk(122, 108, 46, 20, 2), chunk(86, 122, 40, 40, 3),
            `<g ${p.sh(.8)}>`,
            K.potato(p, 130, 72, 32, 10, { c: '#e9c46a' }), K.potato(p, 54, 100, 30, 40, { c: '#e9c46a' }), K.potato(p, 112, 140, 28, -20, { c: '#e9c46a' }), K.potato(p, 148, 102, 26, 60, { c: '#e9c46a' }),
            K.carrotChunk(p, 62, 76, 22, 20), K.carrotChunk(p, 106, 64, 22, -40), K.carrotChunk(p, 150, 128, 20, 70), K.carrotChunk(p, 62, 128, 22, -10), K.carrotChunk(p, 104, 102, 20, 30),
            K.onion(p, 140, 84, 22, 30), K.onion(p, 82, 144, 20, -30),
            `</g>`,
            K.glaze(p, 100, 100, 110, '#8a5226', { seed: 2, op: .2 }),
            xusThyme(p, 108, 92, 34, -30), xusThyme(p, 70, 110, 28, 40),
            xusSpr(p, 100, 100, 120, { c: '#2a2420', n: 18, r: .6 }),
        ].join('');
    },

    // Southern fried chicken: craggy golden buttermilk-fried drumsticks and thighs piled on a plate
    us_friedchicken: p => [
        K.plate(p, { rim: '#b8341e' }),
        xusThigh(p, 76, 80, 62, -20, { seed: 1 }),
        xusThigh(p, 126, 126, 64, 30, { seed: 2 }),
        xusDrum(p, 128, 70, 82, -40, { seed: 3 }),
        xusDrum(p, 70, 128, 80, 150, { seed: 4 }),
        xusDrum(p, 104, 100, 76, 60, { seed: 5 }),
        xusSpr(p, 100, 100, 110, { c: '#fff8e6', n: 16, r: .6 }),
    ].join(''),

    // Chicken fajitas: sizzling cast-iron skillet of grilled chicken strips with red, yellow and green peppers and onion, lime, cilantro
    us_fajitas: p => {
        const R = rng(p.id + 'fj');
        const sp = xusSpots('fj', 48, 62, 62, 9, 92, 100);
        const cols = ['#d9342a', '#f2c230', '#3f8f2f'];
        return [
            xusSkillet(p, { R: 82, cx: 92, cy: 100 }),
            `<g ${p.sh(.7)}>`, xusMix(sp, [
                (x, y, r, i) => xusChickStrip(p, x, y, 32, 12, r, { seed: i, c: '#d9a464' }),
                (x, y, r, i) => K.pepperPiece(p, x, y, 30, r, { c: cols[i % 3], strip: true }),
                (x, y, r, i) => K.pepperPiece(p, x, y, 28, r, { c: cols[(i + 1) % 3], strip: true }),
                (x, y, r) => xusOnionStrip(p, x, y, 22, r, { c: '#f2e2c0', op: .95 }),
                (x, y, r, i) => K.pepperPiece(p, x, y, 30, r, { c: cols[(i + 2) % 3], strip: true }),
            ]), `</g>`,
            `<g ${xusBlur(p, 1.2)}>${xusPts(R, 12, 92, 100, 56, 56).map(([x, y]) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="3" ry="1.6" fill="#3a1c0a" opacity=".45"/>`).join('')}</g>`,
            xusWedge(p, 130, 140, 30, -30),
            xusCilantro(p, 82, 88, 15, 10), xusCilantro(p, 108, 118, 14, -40), xusCilantro(p, 70, 120, 13, 60), xusCilantro(p, 110, 74, 13, 20),
        ].join('');
    },

    // Cheeseburgers: sesame bun over melted cheddar, lettuce and tomato, on a board with dill pickle chips and red onion
    us_burgers: p => {
        const R = rng(p.id + 'bg');
        const frill = Array.from({ length: 30 }, (_, i) => { const a = i / 30 * 6.28, rr = (i % 2 ? 60 : 66) - R() * 3; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
        return [
            xusBoard(p, { w: 186, h: 176 }),
            `<g ${p.sh(1)}><path ${T(92, 94)} d="${xusSm(frill, true)}" fill="${p.g('#7cbf48', .3, .3)}" stroke="#4a8a2a" stroke-width=".7"/></g>`,
            `<circle cx="92" cy="94" r="58" fill="#d9342a" stroke="#9a2018" stroke-width=".8"/>`,
            `<g ${p.sh(.6)}><path ${T(92, 94, 18)} d="M-44,-44 L44,-44 L44,40 Q46,52 40,50 Q36,46 34,44 L-44,44Z" fill="${p.g('#f5b42e', .3, .25)}" stroke="#c9861a" stroke-width=".7"/></g>`,
            `<path ${T(92, 94, 18)} d="M44,-20 Q50,-14 48,-6 Q46,-2 44,-6Z" fill="#f5b42e"/>`,
            `<g ${p.sh(.8)}><circle cx="92" cy="94" r="54" fill="#5a2e18"/></g>`,
            xusBun(p, 91, 93, 53, { seed: 1 }),
            xusPickle(p, 156, 150, 22, 0), xusPickle(p, 172, 128, 20, 30), xusPickle(p, 142, 168, 18, 10),
            ...[[40, 160], [22, 140]].map(([x, y]) => `<g ${T(x, y)}><circle r="11" fill="none" stroke="#9a3a6a" stroke-width="3"/><circle r="11" fill="none" stroke="#f0d8ea" stroke-width="1.6"/><circle r="7" fill="none" stroke="#b85a8a" stroke-width="1.6"/></g>`),
        ].join('');
    },

    // Pan-seared steak with garlic butter: sliced ribeye (pink centre, dark crust) on a board, melting garlic-herb butter, rosemary, garlic
    us_steak: p => {
        const R = rng(p.id + 'stk');
        const gid = p.def('xusstkg', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6a54"/><stop offset=".18" stop-color="#d06a6e"/><stop offset=".5" stop-color="#e07a7a"/><stop offset=".82" stop-color="#d06a6e"/><stop offset="1" stop-color="#9a6a54"/></linearGradient>`);
        const sl = (x, y, r, w, h) => `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="5" fill="#4a2410"/></g>
            <rect x="${-w / 2 + 2.4}" y="${-h / 2 + 2.6}" width="${w - 4.8}" height="${h - 5.2}" rx="4" fill="url(#${gid})"/>
            <path d="M${-w / 2 + 5},${-h / 2 + 7} L${-w / 2 + 5},${h / 2 - 9}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>
            <path d="M${-w / 2 + 3},${-h / 2 + 4} L${w / 2 - 3},${-h / 2 + 4}" stroke="#f2e2c8" stroke-width="2.4" stroke-linecap="round" opacity=".7"/></g>`;
        const whole = 'M-40,-6 C-40,-26 -18,-34 4,-32 C26,-30 40,-18 40,0 C40,20 24,30 2,30 C-22,30 -40,16 -40,-6Z';
        return [
            xusBoard(p, { w: 188, h: 166, c: '#b8834e' }),
            `<g ${T(64, 98, -14, 1.05)}><g ${p.sh(1.3)}><path d="${whole}" fill="${p.g('#8a4a22', .3, .4)}" stroke="#3a1a08" stroke-width=".9"/></g>
                <path d="M-40,-6 C-40,-26 -18,-34 4,-32" stroke="#e8d0a8" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
                <g ${xusBlur(p, 2.4)}>${Array.from({ length: 6 }, () => `<ellipse cx="${f1((R() - .5) * 56)}" cy="${f1((R() - .5) * 40)}" rx="${f1(5 + R() * 7)}" ry="${f1(3 + R() * 4)}" fill="#2e1406" opacity=".5"/>`).join('')}</g>
                <path d="M-26,-14 Q0,-26 24,-18" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".45"/></g>`,
            ...[0, 1, 2, 3, 4, 5].map(i => sl(112 + i * 12, 102 + i * 3, 14, 20, 62 - Math.abs(i - 2.5) * 4)),
            xusButter(p, 64, 94, 24, 10),
            xusParsley(p, 64, 94, 24, { n: 10, sz: .9 }), xusGarlic(p, 74, 102, 8, 20),
            K.glaze(p, 144, 108, 70, '#f2c050', { seed: 1, op: .25 }),
            xusRosemary(p, 96, 158, 72, -6), xusRosemary(p, 110, 36, 64, 4),
            xusGarlic(p, 30, 152, 16, 30), xusGarlic(p, 172, 40, 15, -20), xusGarlic(p, 176, 156, 15, 50),
            xusSpr(p, 140, 104, 70, { c: '#2a2420', n: 20, r: .65 }), xusSpr(p, 140, 104, 70, { c: '#ffffff', n: 14, r: .75 }),
        ].join('');
    },


    // Pulled pork sandwiches: toasted bun heaped with saucy BBQ pulled pork and creamy coleslaw, top bun alongside, pickles
    us_pulledpork: p => {
        const R = rng(p.id + 'pp');
        let pork = '';
        const cols = ['#8a4a26', '#a8643a', '#6e3418', '#b8784a', '#93502c'];
        pork += `<path ${T(84, 108)} d="${xusSm(ring(46, 12, .2, R, 1, .95), true)}" fill="#6e3018"/>`;
        pork += xusStrands(R, xusPts(R, 110, 84, 108, 44, 42).map(([x, y]) => [x, y, 8 + R() * 10, R() * 180, Math.floor(R() * 5)]), cols, 2.4, '#4a1c0a', { bend: 1.2 });
        let slaw = '';
        const sc = ['#f8f9ea', '#e6efc6', '#d4e6a6', '#fbfcf2'];
        slaw += xusStrands(R, xusPts(R, 40, 98, 92, 24, 19).map(([x, y]) => [x, y, 9 + R() * 6, R() * 180, Math.floor(R() * 4)]), sc, 2.6, '#bcc69a');
        slaw += xusStrands(R, xusPts(R, 7, 98, 92, 18, 14).map(([x, y]) => [x, y, 9, R() * 180, 0]), ['#ee7d2c'], 1.8, '#c45a1a');
        return [
            xusBoard(p, { w: 188, h: 172 }),
            xusBunCut(p, 84, 108, 58),
            `<g ${p.sh(.8)}>${pork}</g>`,
            K.glaze(p, 84, 108, 86, '#9a2c14', { seed: 1, op: .35 }),
            `<g ${p.sh(.8)}><path ${T(98, 92)} d="${xusSm(ring(28, 10, .25, R, 1, .8), true)}" fill="#eef0d8"/>${slaw}</g>`,
            xusBun(p, 158, 50, 30, { seed: 2 }),
            xusPickle(p, 160, 150, 22, 0), xusPickle(p, 168, 124, 20, 20),
        ].join('');
    },

    // Honey garlic pork tenderloin: oval platter of rosy medallions with an amber honey-garlic glaze, thyme
    us_porktenderloin: p => {
        const med = (x, y, s, seed) => {
            const R = rng(p.id + 'md' + seed);
            const sh = xusSm(ring(s / 2, 11, .08, R, 1.05, 1), true);
            return `<g ${T(x, y, (R() - .5) * 30)}><g ${p.sh(.9)}><path d="${sh}" fill="${p.g('#9a5420', .3, .35)}" stroke="#5e2e10" stroke-width=".7"/></g>
                <path d="${sh}" transform="scale(.8)" fill="${p.rg('#f2cbb0', .25, .15, .45, .45)}"/>
                <circle r="${f(s * .16)}" fill="#e9a894" opacity=".55"/>
                <path d="M${f(-s * .36)},${f(-s * .16)} A${f(s * .4)},${f(s * .4)} 0 0 1 ${f(-s * .04)},${f(-s * .42)}" stroke="#fff6d0" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
        };
        const row = (y, x0, n, s, dx, seed) => Array.from({ length: n }, (_, i) => med(x0 + i * dx, y + (i % 2) * 3, s, seed + i)).join('');
        return [
            K.ovalDish(p, { rx: 94, ry: 74, rim: '#c98a3a' }),
            K.pool(p, 100, 100, 150, '#b8702a', { op: .7, seed: 1, sy: .7 }),
            row(80, 46, 6, 40, 22, 1),
            row(120, 54, 5, 40, 23, 10),
            K.glaze(p, 100, 100, 130, '#d08a30', { seed: 2, op: .25 }),
            xusGarlic(p, 160, 98, 12, 20), xusGarlic(p, 40, 104, 12, -30),
            xusThyme(p, 100, 100, 40, -10), xusThyme(p, 140, 60, 30, 20), xusThyme(p, 62, 142, 30, 30),
            xusSpr(p, 100, 100, 130, { c: '#2a2420', n: 16, r: .55 }),
        ].join('');
    },

    // Shrimp and grits: creamy cheddar grits, seared shrimp in a smoky pan sauce, bacon, green onion
    us_shrimpgrits: p => {
        const R = rng(p.id + 'sg');
        const P = xusPts(R, 70, 100, 100, 66, 66);
        return [
            K.bowl(p, { glaze: '#d0703a', inside: '#f7f2e6' }),
            K.liquid(p, { R: 76, c: '#f2e2a8', shine: false }),
            `<g ${xusBlur(p, .6)}>${xusDots(P, 1.6, '#f8ecc4')}${xusDots(P.slice(0, 30).map(([x, y]) => [x + 2, y + 2]), 1.3, '#e2c880')}</g>`,
            `<path d="M48,92 C58,64 102,56 124,70" stroke="#fffaf0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
            K.pool(p, 100, 102, 116, '#c8642a', { op: .55, seed: 2 }),
            `<g ${p.sh(.9)}>`, ...[[76, 76, -20], [116, 68, 40], [140, 102, 90], [122, 136, 150], [82, 134, 200], [60, 106, 250], [102, 102, 10]].map(([x, y, r]) => K.shrimp(p, x, y, 38, r, { c: '#f07a4e' })), `</g>`,
            `<g ${xusBlur(p, 1)}>${xusPts(R, 14, 104, 104, 44, 44).map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.6" fill="#a83a1a" opacity=".5"/>`).join('')}</g>`,
            `<g ${p.sh(.5)}>`, xusBacon(p, 98, 88, 16, 10), xusBacon(p, 132, 82, 13, 0, { seed: 2 }), xusBacon(p, 104, 124, 14, 0, { seed: 3 }), xusBacon(p, 66, 124, 12, 0, { seed: 4 }), `</g>`,
            K.scallions(p, 100, 100, 110, { n: 26, c: '#4f9a34' }),
            xusSpr(p, 100, 100, 100, { c: '#c4401c', n: 14, r: .6 }),
        ].join('');
    },

    // Blackened tilapia: two spice-crusted fillets over white rice, lemon wedges, parsley
    us_tilapia: p => {
        const fil = (x, y, L, W, r, seed) => {
            const R = rng(p.id + 'tf' + seed);
            const d = `M${-L / 2},${-W * .1} C${-L * .46},${-W * .5} ${-L * .1},${-W * .56} ${L * .14},${-W * .4} C${L * .3},${-W * .3} ${L * .44},${-W * .12} ${L / 2},${-W * .04} L${L / 2},${W * .06} C${L * .4},${W * .14} ${L * .26},${W * .3} ${L * .08},${W * .42} C${-L * .14},${W * .54} ${-L * .44},${W * .5} ${-L / 2},${W * .12}Z`;
            let sp = '';
            for (let i = 0; i < 40; i++) sp += `<circle cx="${f1((R() - .5) * L * .85)}" cy="${f1((R() - .5) * W * .75)}" r="${f1(.5 + R() * 1.1)}" fill="${R() < .5 ? '#3a1408' : '#c8341a'}" opacity=".8"/>`;
            return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${d}" fill="${p.g('#c06a32', .25, .4)}" stroke="#5a2410" stroke-width=".8"/></g>
                <g ${xusBlur(p, 2.2)}>${Array.from({ length: 6 }, () => `<ellipse cx="${f1((R() - .5) * L * .7)}" cy="${f1((R() - .5) * W * .5)}" rx="${f1(5 + R() * 8)}" ry="${f1(3 + R() * 4)}" fill="#3a1206" opacity=".55"/>`).join('')}</g>${sp}
                <path d="M${f(-L * .34)},${f(-W * .24)} Q0,${f(-W * .42)} ${f(L * .3)},${f(-W * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
        };
        return [
            K.plate(p, { rim: '#2f9aa0' }),
            xusRice(p, 92, 112, 112, { sy: .9, seed: 1 }),
            fil(106, 80, 112, 56, -16, 1),
            fil(98, 128, 108, 54, -6, 2),
            K.glaze(p, 104, 102, 70, '#f2c050', { seed: 1, op: .2 }),
            K.lemon(p, 46, 70, 30, -50), K.lemon(p, 158, 136, 30, 130),
            xusParsley(p, 104, 102, 80, { n: 20 }),
        ].join('');
    },

    // Tuna noodle casserole: egg noodles in creamy mushroom sauce with tuna and peas, golden crumb and cheddar crust
    us_tunacasserole: p => {
        const R = rng(p.id + 'tc');
        const cid = p.def('xustcclip', id => `<clipPath id="${id}"><rect x="24" y="42" width="152" height="116" rx="14"/></clipPath>`);
        let nd = '';
        nd = xusStrands(R, xusPts(R, 46, 100, 100, 74, 56).map(([x, y]) => [x, y, 16 + R() * 12, R() * 180, R() < .5 ? 0 : 1]), ['#f2d488', '#f6e0a0'], 6, '#c49a48', { bend: .7 });
        const peas = xusPts(R, 26, 100, 100, 70, 52);
        return [
            xusBakingDish(p, { w: 168, h: 132, c: '#eef0f2', rim: '#c9ccd2' }),
            `<g clip-path="url(#${cid})">`,
            `<rect x="20" y="40" width="160" height="120" fill="${p.rg('#ecdcb0', .2, .2)}"/>`,
            `<g ${p.sh(.4)}>${nd}</g>`,
            `<g ${p.sh(.4)}>`, ...xusPts(R, 16, 100, 100, 66, 50).map(([x, y]) => `<path ${T(x, y, R() * 360)} d="${smooth(ring(4 + R() * 2, 7, .5, R, 1.3, .8))}" fill="${p.g('#dcbc98', .3, .25)}" stroke="#a88a68" stroke-width=".4"/>`), `</g>`,
            `<g ${p.sh(.3)}>${xusDots(peas, 3, '#6aae3a', { stroke: '#3f7a24' })}</g>`, xusHi(peas, 3),
            `<g ${xusBlur(p, 3)}>`, ...[[60, 70, 24, 14], [130, 64, 26, 12], [150, 120, 20, 16], [80, 132, 26, 14], [104, 96, 18, 12]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#e9a640" opacity=".6"/>`), `</g>`,
            K.crumbs(p, 100, 100, 150, { n: 70, c: '#d9973c' }),
            `</g>`,
            `<rect x="24" y="42" width="152" height="116" rx="14" fill="none" stroke="#a87a3a" stroke-width="1" opacity=".5"/>`,
            xusParsley(p, 100, 100, 110, { n: 16 }),
        ].join('');
    },

    // Chicken pot pie: golden crimped crust with steam slits and creamy filling bubbling through
    us_potpie: p => {
        const R = rng(p.id + 'pie');
        const crimp = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * 6.28, rr = i % 2 ? 80 : 85; return [100 + Math.cos(a) * rr, 100 + Math.sin(a) * rr]; });
        const slit = (a) => { const c = Math.cos(a), s = Math.sin(a); return `<g ${T(100 + c * 30, 100 + s * 30, a * 57.3)}><path d="M-12,0 Q0,-5 12,0 Q0,5 -12,0Z" fill="#efdcae" stroke="#9a5a1c" stroke-width="1"/><circle cx="-3" cy="0" r="1.8" fill="#6aae3a"/><circle cx="4" cy=".4" r="1.6" fill="#ef7f30"/></g>`; };
        return [
            `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="94" fill="${p.rg('#e6e0d6', .2, .2, .35, .3)}"/></g>`,
            `<circle cx="100" cy="100" r="90" fill="none" stroke="#3f6a9a" stroke-width="2.4"/>`,
            `<g ${p.sh(1)}><path d="${xusSm(crimp, true)}" fill="${p.g('#c98a3a', .3, .3)}" stroke="#8a5218" stroke-width=".8"/></g>`,
            `<path d="${Array.from({ length: 24 }, (_, i) => { const a = (i + .5) / 24 * 6.28; return `M${f1(100 + Math.cos(a) * 70)},${f1(100 + Math.sin(a) * 70)} L${f1(100 + Math.cos(a) * 82)},${f1(100 + Math.sin(a) * 82)}`; }).join('')}" stroke="#9a5a1c" stroke-width="1.4" opacity=".6"/>`,
            `<g ${p.crumb(.35)}><circle cx="100" cy="100" r="72" fill="${p.rg('#e6ae52', .3, .3, .4, .38)}"/></g>`,
            `<g ${xusBlur(p, 5)}><circle cx="100" cy="100" r="66" fill="none" stroke="#b8701e" stroke-width="8" opacity=".5"/><ellipse cx="118" cy="120" rx="30" ry="22" fill="#c47a26" opacity=".35"/></g>`,
            ...[0, 1, 2, 3].map(i => slit(i * 1.571 + .785)),
            `<circle cx="100" cy="100" r="5" fill="#efdcae" stroke="#9a5a1c" stroke-width="1"/>`,
            `<path d="M146,148 Q154,154 150,160 Q144,160 142,152Z" fill="#efdcae" opacity=".9"/>`,
            `<path d="M54,62 Q76,40 108,40" stroke="#fff3c8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
            xusSpr(p, 100, 100, 120, { c: '#f8e2a0', n: 24, r: .7 }),
        ].join('');
    },

    // Chicken and sausage jambalaya: red enamel pot of tomato-red rice with andouille, chicken, peppers, celery, green onion
    us_jambalaya: p => {
        const sp = xusSpots('jb', 22, 60, 60, 15);
        return [
            K.bowl(p, { glaze: '#c8452f', inside: '#f6efe2' }),
            xusRice(p, 100, 100, 152, { tint: '#e2924e', seed: 1, density: .6, grain: 3.8 }),
            `<g ${p.sh(.7)}>`, xusMix(sp, [
                (x, y, r, i) => xusCoin(p, x, y, 18, { c: '#6e2c18', inner: '#b0603e', seed: i }),
                (x, y, r, i) => K.chickenPiece(p, x, y, 20, r, { c: '#d9985a', skin: '#b8642e' }),
                (x, y, r) => K.pepperPiece(p, x, y, 13, r, { c: '#3f8f2f' }),
                (x, y, r, i) => xusCoin(p, x, y, 17, { c: '#6e2c18', inner: '#b0603e', seed: i }),
                (x, y, r) => xusDice(p, x, y, 9, r, '#d9402a'),
                (x, y, r) => xusCelery(p, x, y, 11, r),
            ]), `</g>`,
            K.scallions(p, 100, 100, 120, { n: 30, c: '#4f9a34' }),
            xusSpr(p, 100, 100, 120, { c: '#8a1a0a', n: 18, r: .6 }),
        ].join('');
    },

    // Red beans and rice: creamy red bean stew with smoked sausage around a scoop of white rice, green onion
    us_redbeans: p => {
        const R = rng(p.id + 'rb');
        const beans = xusPts(R, 46, 100, 100, 64, 64).filter(([x, y]) => Math.hypot(x - 100, y - 96) > 26);
        return [
            K.bowl(p, { glaze: '#2f5f8a', inside: '#f6f1e6' }),
            K.liquid(p, { R: 76, c: '#7a3526', shine: false }),
            `<g ${xusBlur(p, 1.4)}>${xusDots(xusPts(R, 40, 100, 100, 66, 66), 3, '#9a4a38')}</g>`,
            `<g ${p.sh(.5)}>`, ...beans.map(([x, y], i) => xusBean(p, x, y, 15, i * 41, { c: i % 3 ? '#8a2e26' : '#a03a2c' })), `</g>`,
            `<g ${p.sh(.6)}>`, ...[[60, 86], [140, 92], [112, 142], [72, 132], [138, 128], [96, 56]].map(([x, y], i) => xusCoin(p, x, y, 20, { c: '#7a2e1a', inner: '#c0705a', seed: i })), `</g>`,
            xusRice(p, 100, 96, 62, { seed: 1 }),
            K.scallions(p, 100, 100, 120, { n: 28, c: '#4f9a34' }),
            xusShine(100, 100, 76, .35),
        ].join('');
    },

    // Denver omelet: golden folded omelet bursting with ham, green pepper, onion and cheddar, buttered toast
    us_denveromelet: p => {
        const R = rng(p.id + 'do');
        const om = 'M-62,10 C-62,-30 -30,-50 6,-50 C40,-50 62,-28 62,10 Q0,18 -62,10Z';
        let fill = '';
        for (let i = 0; i < 18; i++){ const x = -56 + i * 6.6 + (R() - .5) * 3, y = 12 + (R() - .5) * 3; fill += i % 3 === 0 ? xusDice(p, x, y, 7, R() * 40, '#e9968c') : i % 3 === 1 ? xusDice(p, x, y, 6, R() * 40, '#3f8f2f') : `<path ${T(x, y, R() * 90)} d="M-3,-1.5 L3,-1.5 L3,1.5 L-3,1.5Z" fill="#f4ecd8"/>`; }
        return [
            K.plate(p, { rim: '#2c4c7c' }),
            `<g ${T(98, 90, -14, 1.2)}>`,
            `<path d="M-60,10 Q0,26 60,10 Q40,22 0,24 Q-40,22 -60,10Z" fill="#f5b42e"/>`, fill,
            `<g ${p.sh(1.1)}><path d="${om}" fill="${p.g('#f6d064', .35, .25)}" stroke="#d09a2a" stroke-width=".9"/></g>`,
            `<g ${xusBlur(p, 3)}>${Array.from({ length: 6 }, () => `<ellipse cx="${f1(-40 + R() * 80)}" cy="${f1(-36 + R() * 36)}" rx="${f1(6 + R() * 8)}" ry="${f1(4 + R() * 5)}" fill="#e0a040" opacity=".45"/>`).join('')}</g>`,
            `<path d="M-40,-30 Q-10,-48 24,-44" stroke="#fff8d8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`,
            `</g>`,
            ...[[60, 154, -20], [96, 166, 10]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="M-22,-16 L22,-16 L0,18Z" fill="${p.g('#c98a3a', .3, .3)}" stroke="#8a5218" stroke-width=".6" stroke-linejoin="round"/></g><g ${p.crumb(.9)}><path d="M-17,-12.6 L17,-12.6 L0,12Z" fill="${p.rg('#f0cf8a', .2, .15)}"/></g></g>`),
            xusButter(p, 66, 150, 10, 20),
            xusChives(p, 96, 84, 30, 18),
            xusSpr(p, 96, 84, 70, { c: '#2a2420', n: 14, r: .55 }),
        ].join('');
    },

    // Spinach and ricotta stuffed shells: jumbo shells filled with ricotta and spinach, baked in marinara with mozzarella, basil
    us_stuffedshells: p => {
        const cid = p.def('xusssclip', id => `<clipPath id="${id}"><rect x="24" y="42" width="152" height="116" rx="14"/></clipPath>`);
        const pos = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) pos.push([46 + c * 36 + (r % 2) * 6, 64 + r * 36, (r * 4 + c) % 2 ? 8 : -8]);
        return [
            xusBakingDish(p, { w: 168, h: 132, c: '#f4efe6' }),
            `<g clip-path="url(#${cid})">`,
            `<rect x="20" y="40" width="160" height="120" fill="${p.rg('#b8301c', .2, .25)}"/>`,
            xusSauce(p, 100, 100, 76, 58, { c: '#c2321c', seed: 1, bits: 30 }),
            ...pos.map(([x, y, r], i) => xusShell(p, x, y, 42, r, { seed: i })),
            `<g opacity=".8">`, ...[[64, 84, 16, 9], [116, 72, 14, 8], [132, 124, 16, 9], [80, 130, 14, 8]].map(([x, y, a, b], i) => `<path ${T(x, y)} d="${smooth(ring(a, 9, .35, rng('mz' + i), 1, b / a))}" fill="#fbf2d6" opacity=".85"/>`), `</g>`,
            `<g ${xusBlur(p, 1.8)}>`, ...[[64, 84, 6, 4], [118, 72, 5, 3], [132, 124, 6, 4], [82, 130, 5, 3]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#d08a3c" opacity=".7"/>`), `</g>`,
            `</g>`,
            xusBasil(p, 98, 96, 20, -30), xusBasil(p, 110, 104, 16, 40, { c: '#4a9a3a' }), xusBasil(p, 150, 74, 16, 10),
            xusSpr(p, 100, 100, 130, { c: '#fbf3dc', n: 30, r: .9 }),
        ].join('');
    },

    // Chicken fettuccine Alfredo: creamy fettuccine, sliced grilled chicken breast, broccoli florets, parsley and black pepper
    us_alfredo: p => {
        const R = rng(p.id + 'al');
        return [
            K.plate(p, { rim: '#c9bfae' }),
            xusPasta(p, 100, 102, 144, { c: '#f1e2b6', w: 4.4, n: 46, sy: .92 }),
            K.glaze(p, 100, 100, 120, '#fbf4e2', { seed: 1, op: .4 }),
            `<g ${p.sh(.8)}>`, ...[0, 1, 2, 3, 4].map(i => xusChickStrip(p, 82 + i * 10, 84 + i * 6, 40, 15, -64, { seed: i, c: '#e6bc84' })), `</g>`,
            `<g ${p.sh(.8)}>`, xusFloret(p, 56, 112, 36, 160), xusFloret(p, 146, 96, 36, -20), xusFloret(p, 110, 146, 34, 80, { c: '#3f8a32' }), xusFloret(p, 70, 70, 32, 200, { c: '#3f8a32' }), `</g>`,
            xusParsley(p, 100, 100, 110, { n: 30 }),
            xusSpr(p, 100, 100, 120, { c: '#2a2420', n: 26, r: .6 }),
            xusSpr(p, 100, 100, 100, { c: '#fffaf0', n: 20, r: .9 }),
        ].join('');
    },

    // Black bean burgers: open-faced bun with a speckled black bean patty, avocado and tomato; the top bun beside
    us_beanburgers: p => {
        const R = rng(p.id + 'bb');
        const fl = [];
        for (const [x, y] of xusPts(R, 26, 0, 0, 36, 34)) fl.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1 + R() * 1.2)}" fill="${['#d9342a', '#f2c230', '#2a1c18', '#6a4a3a'][Math.floor(R() * 4)]}"/>`);
        return [
            xusBoard(p, { w: 186, h: 176, c: '#c99a64' }),
            xusLeaf(p, 72, 112, 112, -20, { c: '#8cc551' }),
            xusBunCut(p, 80, 108, 54),
            `<g ${T(80, 108)}><g ${p.sh(1)}><g ${p.rough(2.4, .14)}><circle r="44" fill="${p.rg('#4a3028', .2, .3, .38, .34)}" stroke="#2a1810" stroke-width=".8"/></g></g>${fl.join('')}<path d="M-30,-18 Q-14,-34 10,-34" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/></g>`,
            `<g ${T(80, 108)}><g ${p.sh(.6)}><circle cx="16" cy="18" r="20" fill="#d9342a"/></g><circle cx="16" cy="18" r="17" fill="#f2604a"/><path d="M16,4 L16,32 M2,18 L30,18" stroke="#f9a08c" stroke-width="1.6"/></g>`,
            ...[[66, 92, -30], [74, 104, -20], [82, 116, -10], [62, 118, -30]].map(([x, y, r]) => xusAvoSlice(p, x, y, 40, r)),
            xusBun(p, 158, 56, 32, { seeds: false, c: '#b8742e', seed: 3 }),
            xusSpr(p, 158, 56, 40, { c: '#efe0b8', n: 18, r: 1.1 }),
            K.cherryTomato(p, 164, 140, 18), K.cherryTomato(p, 150, 158, 16),
        ].join('');
    },

    // Cheese enchiladas: rolled corn tortillas under red chile sauce and melted cheese, sour cream, onion, cilantro, jalapeño
    us_enchiladas: p => {
        const R = rng(p.id + 'en');
        const cid = p.def('xusenclip', id => `<clipPath id="${id}"><rect x="24" y="42" width="152" height="116" rx="14"/></clipPath>`);
        const roll = y => `<g ${p.sh(.8)}><rect x="28" y="${y - 13}" width="144" height="26" rx="12" fill="${p.g('#b8381e', .25, .3)}"/></g><rect x="30" y="${y - 11}" width="140" height="10" rx="5" fill="#d0502e" opacity=".7"/>`;
        return [
            xusBakingDish(p, { w: 168, h: 132, c: '#d98a4a', rim: '#a85a2a' }),
            `<g clip-path="url(#${cid})">`,
            `<rect x="20" y="40" width="160" height="120" fill="${p.rg('#9a2a16', .2, .2)}"/>`,
            roll(58), roll(86), roll(114), roll(142),
            ...[58, 86, 114, 142].map((y, i) => `<path ${T(100, y)} d="${smooth(ring(1, 14, .3, rng('ench' + i), 50, 9))}" fill="#f6d27a" opacity=".95"/>`),
            `<g ${xusBlur(p, 2)}>${xusPts(R, 14, 100, 100, 60, 46).map(([x, y]) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(4 + R() * 5)}" ry="3" fill="#c87a2a" opacity=".6"/>`).join('')}</g>`,
            `</g>`,
            K.drizzle(p, 100, 100, 120, 70, { c: '#fbf8f0', width: 2.4, n: 7, r: -6 }),
            `<g ${p.sh(.3)}>`, ...xusPts(R, 22, 100, 100, 60, 46).map(([x, y]) => `<rect ${T(x, y, R() * 90)} x="-2" y="-2" width="4" height="4" rx="1" fill="#f6f2e6" stroke="#d6d0bc" stroke-width=".4"/>`), `</g>`,
            ...[[62, 72], [138, 128], [124, 66], [70, 132]].map(([x, y]) => `<g ${T(x, y)}><circle r="5.4" fill="#3f8a2c"/><circle r="4" fill="#cfe6a0"/><circle r="1" cx="-1.4" cy="-.6" fill="#f6f8e0"/><circle r="1" cx="1.4" cy=".8" fill="#f6f8e0"/></g>`),
            xusCilantro(p, 92, 96, 16, 20), xusCilantro(p, 112, 112, 14, -30), xusCilantro(p, 140, 90, 13, 50), xusCilantro(p, 64, 110, 13, -10),
        ].join('');
    },

    // Lasagna: baking dish with ruffled noodle edges, bubbling browned mozzarella over meat sauce, cut into squares, basil
    us_lasagna: p => {
        const R = rng(p.id + 'la');
        const cid = p.def('xuslaclip', id => `<clipPath id="${id}"><rect x="24" y="42" width="152" height="116" rx="14"/></clipPath>`);
        const wav = x => `M${x},40 ${Array.from({ length: 13 }, (_, i) => `Q${x + (i % 2 ? 6 : -6)},${45 + i * 9.4} ${x},${49.4 + i * 9.4}`).join(' ')}`;
        let smear = '';
        for (const [x, y] of xusSpots('lasm', 16, 62, 48, 20)) smear += `<path ${T(x, y, R() * 360)} d="${xusSm(ring(5 + R() * 5, 9, .55, R, 1.4, .8), true)}" fill="${R() < .5 ? '#b8301a' : '#c8401f'}"/>`;
        return [
            xusBakingDish(p, { w: 168, h: 132, c: '#e9eef2', rim: '#c4ccd4' }),
            `<g clip-path="url(#${cid})">`,
            `<rect x="20" y="40" width="160" height="120" fill="${p.rg('#a82c18', .2, .25)}"/>`,
            `<g ${p.rough(4, .08)}><rect x="34" y="48" width="132" height="104" rx="6" fill="${p.rg('#f4d47c', .25, .2)}"/></g>`,
            `<path d="${wav(34)}" stroke="#d6a640" stroke-width="10" fill="none"/><path d="${wav(34)}" stroke="#f2d080" stroke-width="7" fill="none"/>`,
            `<path d="${wav(166)}" stroke="#d6a640" stroke-width="10" fill="none"/><path d="${wav(166)}" stroke="#f2d080" stroke-width="7" fill="none"/>`,
            `<g ${xusBlur(p, 1.6)} opacity=".6">${smear}</g><g ${p.rough(3, .2)}>${smear}</g>`,
            xusMelt(p, cid, [[64, 70, 16, 10], [112, 62, 18, 10], [146, 100, 14, 12], [84, 120, 18, 12], [124, 136, 16, 9], [104, 96, 12, 9], [56, 134, 12, 8], [150, 140, 10, 8]]),
            xusSpr(p, 100, 100, 140, { c: '#fff6dc', n: 30, r: 1.2 }),
            `<path d="M78,42 L78,158 M122,42 L122,158 M24,100 L176,100" stroke="#6a2410" stroke-width="2.6" opacity=".55"/>`,
            `</g>`,
            xusBasil(p, 100, 74, 22, -30), xusBasil(p, 114, 82, 17, 40, { c: '#4a9a3a' }), xusBasil(p, 56, 126, 17, 20), xusBasil(p, 146, 128, 16, -50),
            xusSpr(p, 100, 100, 120, { c: '#3f7a2c', n: 14, r: .7 }),
        ].join('');
    },


    // ---------------- sides ----------------
    // Potato salad: creamy red-skin potato chunks, chopped egg, celery, red onion, pickle, paprika and dill
    us_potatosalad: p => {
        const R = rng(p.id + 'ps');
        const sp = xusSpots('ps', 30, 62, 60, 15);
        return [
            K.bowl(p, { glaze: '#4a6e9a', inside: '#f6f1e6' }),
            `<g ${p.sh(1.2)}>`, xusMound(p, 100, 100, 72, 70, '#f1e4bc', { seed: 3, l: .3, d: .2 }), `</g>`,
            `<g ${p.sh(.6)}>`, xusMix(sp, [
                (x, y, r) => xusDice(p, x, y, 21, r, '#efd690', { skin: '#a84a3e' }),
                (x, y, r) => xusDice(p, x, y, 20, r, '#f2dc9c'),
                (x, y, r) => `<g ${T(x, y, r)}><path d="M-8,-5 L8,-6 L7,6 L-7,5Z" fill="${p.g('#fffdf6', .1, .15)}" stroke="#ddd4c0" stroke-width=".5"/><circle cx="1" cy="0" r="3.6" fill="#f6c43a"/></g>`,
                (x, y, r) => xusDice(p, x, y, 18, r, '#efd89a', { skin: '#a84a3a' }),
            ]), `</g>`,
            K.glaze(p, 100, 100, 120, '#fffaf0', { seed: 1, op: .35 }),
            `<g ${p.sh(.3)}>`, ...xusPts(R, 12, 100, 100, 56, 54).map(([x, y], i) => i % 3 === 0 ? xusCelery(p, x, y, 8, R() * 360) : i % 3 === 1 ? xusDice(p, x, y, 5, R() * 90, '#8a3a7a') : xusDice(p, x, y, 5, R() * 90, '#6a8a2a')), `</g>`,
            xusSpr(p, 100, 100, 110, { c: '#c8341a', n: 40, r: .7 }),
            K.shreds(p, 100, 100, 90, { c: '#4f8a34', n: 14, w: .9, len: .12, seed: 3 }),
        ].join('');
    },

    // Deviled eggs: platter of egg halves with piped golden filling, paprika and chives
    us_deviledeggs: p => [
        K.plate(p, { rim: '#4f8a5a' }),
        ...[0, 1, 2, 3, 4, 5, 6].map(i => { const a = i / 7 * 6.283 - 1.57; return xusDeviled(p, 100 + Math.cos(a) * 50, 100 + Math.sin(a) * 50, 44, a * 57.3 + 90, { seed: i }); }),
        xusDeviled(p, 100, 100, 46, 20, { seed: 9 }),
        xusChives(p, 100, 100, 64, 30, { c: '#3f8a2c' }),
    ].join(''),

    // Baked beans: stoneware crock of glossy molasses beans with strips of baked bacon
    us_bakedbeans: p => {
        const R = rng(p.id + 'bk');
        const B1 = xusPts(R, 80, 100, 100, 68, 68), B2 = xusPts(R, 44, 100, 100, 62, 62);
        return [
            K.bowl(p, { glaze: '#7a4a2a', inside: '#4a2410' }),
            `<circle cx="100" cy="100" r="88" fill="none" stroke="#e8d6b0" stroke-width="3" opacity=".5"/>`,
            K.liquid(p, { R: 76, c: '#7a3416', shine: false }),
            xusDots(B1, 5, '#a8582a', { stroke: '#5a2a10', sy: .72 }), xusHi(B1.slice(0, 60), 4.6),
            xusDots(B2, 5, '#bc6a30', { stroke: '#5a2a10', sy: .72 }), xusHi(B2, 4.6),
            K.glaze(p, 100, 100, 130, '#8a3a14', { seed: 1, op: .3 }),
            `<g ${p.sh(.8)}>`, ...[[88, 78, 18], [116, 100, -10], [84, 124, 25]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-30,-6 Q-15,-11 0,-6 T30,-6 L30,6 Q15,1 0,6 T-30,6Z" fill="${p.g('#8a3418', .25, .4)}" stroke="#4a1808" stroke-width=".6"/><path d="M-28,0 Q-14,-4 0,0 T28,0" stroke="#d89a6a" stroke-width="2.4" fill="none"/><path d="M-24,-4 Q-12,-8 0,-4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".5"/></g>`), `</g>`,
            xusShine(100, 100, 76, .5),
        ].join('');
    },

    // Caesar salad: chopped romaine in creamy dressing, big garlic croutons, shaved parmesan, black pepper, lemon
    us_caesar: p => {
        const R = rng(p.id + 'cs');
        const leaves = xusSpots('csl', 16, 58, 56, 15).map(([x, y, r], i) => xusLeaf(p, x, y, 46 + R() * 10, r, { seed: i, c: ['#6eae3c', '#8cc551', '#5c9e34', '#a6d468'][i % 4] })).join('');
        return [
            xusWoodBowl(p),
            leaves,
            K.glaze(p, 100, 100, 110, '#fbf6e2', { seed: 2, op: .25 }),
            ...xusSpots('csc', 8, 50, 48, 22).map(([x, y, r]) => xusCrouton(p, x, y, 15, r)),
            `<g ${p.sh(.4)}>`, ...xusPts(R, 12, 100, 100, 56, 54).map(([x, y]) => `<path ${T(x, y, R() * 180)} d="M-7,-2 Q0,-4 7,-2 L6,2 Q0,0 -6,2Z" fill="#f8f0d0" stroke="#d8c890" stroke-width=".5"/>`), `</g>`,
            xusSpr(p, 100, 100, 120, { c: '#2a2420', n: 30, r: .6 }),
            K.lemon(p, 148, 134, 26, 140),
        ].join('');
    },

    // Three-bean salad: glass bowl of green beans, kidney beans and chickpeas with red onion in a sweet vinaigrette
    us_threebean: p => {
        const R = rng(p.id + 'tb');
        const sp = xusSpots('tb', 44, 60, 60, 11);
        return [
            K.kobachi(p, { glaze: '#cfe2e2', inside: '#f2f6f2' }),
            `<circle cx="100" cy="100" r="78" fill="#e8dca0" opacity=".45"/>`,
            `<g ${p.sh(.5)}>`, xusMix(sp, [
                (x, y, r) => xusGBean(p, x, y, 22, r, { c: '#5a9a34', bend: 0 }),
                (x, y, r) => xusBean(p, x, y, 16, r, { c: '#8a2e2e' }),
                (x, y, r) => `<g ${T(x, y, r)}><circle r="6.4" fill="${p.rg('#e8c88a', .3, .25)}" stroke="#b8904a" stroke-width=".5"/><path d="M-2,-6 Q0,-2 2,-6" stroke="#b8904a" stroke-width=".8" fill="none"/></g>`,
                (x, y, r) => xusGBean(p, x, y, 20, r, { c: '#4f9a34', bend: 0 }),
                (x, y, r) => xusBean(p, x, y, 15, r, { c: '#9a3a34' }),
                (x, y, r) => `<g ${T(x, y, r)}><circle r="6.2" fill="${p.rg('#ecd09a', .3, .25)}" stroke="#b8904a" stroke-width=".5"/></g>`,
            ]), `</g>`,
            ...xusPts(R, 7, 100, 100, 52, 52).map(([x, y]) => xusOnionStrip(p, x, y, 20, R() * 360, { c: '#b85a8a', op: .9 })),
            K.glaze(p, 100, 100, 130, '#f0e2a0', { seed: 1, op: .2 }),
            xusParsley(p, 100, 100, 110, { n: 24 }),
        ].join('');
    },

    // Loaded baked potatoes: two split russets filled with butter, sour cream, cheddar, bacon and green onion
    us_bakedpotato: p => {
        const spud = (x, y, r, seed) => {
            const R = rng(p.id + 'sp' + seed);
            const sk = 'M-56,0 C-56,-22 -30,-30 0,-30 C30,-30 56,-22 56,0 C56,22 30,30 0,30 C-30,30 -56,22 -56,0Z';
            return `<g ${T(x, y, r)}><g ${p.sh(1.3)}><path d="${sk}" fill="${p.g('#9a6236', .25, .35)}" stroke="#5a3418" stroke-width=".8"/></g>
                ${Array.from({ length: 12 }, () => `<circle cx="${f1((R() - .5) * 100)}" cy="${f1((R() - .5) * 46)}" r="${f1(.6 + R() * .8)}" fill="${R() < .5 ? '#fff' : '#5a3418'}" opacity=".7"/>`).join('')}
                <path d="${xusSm(ring(1, 12, .2, R, 42, 19), true)}" fill="${p.rg('#f8ecc8', .25, .2)}"/>
                ${xusGrains(p, 0, 0, 34, 14, ['#fff8e4', '#efe0b8'], { n: 30, size: 2, seed })}</g>`;
        };
        const R = rng(p.id + 'bp');
        return [
            K.plate(p, { rim: '#5a4a3a' }),
            spud(100, 66, -8, 1), spud(100, 134, -8, 2),
            ...[[96, 66], [104, 134]].map(([x, y], i) => [
                xusCheddar(p, x, y, 30, 14, 18, { seed: i }),
                xusButter(p, x - 22, y - 2, 12, 10),
                xusDollop(p, x + 4, y, 24, { seed: i }),
                `<g ${p.sh(.4)}>`, xusBacon(p, x - 8, y + 8, 14, 0, { seed: i }), xusBacon(p, x + 22, y - 6, 12, 0, { seed: i + 5 }), `</g>`,
                K.scallions(p, x, y, 50, { n: 12, seed: i, c: '#4f9a34' }),
            ].join('')),
            xusSpr(p, 100, 100, 120, { c: '#2a2420', n: 18, r: .55 }),
        ].join('');
    },

    // Roasted sweet potatoes: caramelized orange cubes with crisp edges, rosemary and flaky salt
    us_sweetpotatoes: p => {
        const R = rng(p.id + 'swp');
        const sp = xusSpots('swp', 30, 62, 62, 18);
        return [
            K.plate(p, { rim: '#d07a2a' }),
            `<g ${p.sh(.8)}><g ${p.rough(1.8, .18)}>`, ...sp.map(([x, y, r]) => `${xusDice(p, x, y, 22, r, R() < .5 ? '#e57a22' : '#ee8a2a', { skin: R() < .3 ? '#7a2e24' : null })}`), `</g></g>`,
            `<g ${xusBlur(p, 1.4)}>`, ...sp.map(([x, y]) => `<ellipse cx="${f1(x + 4)}" cy="${f1(y + 3)}" rx="${f1(4 + R() * 4)}" ry="${f1(3 + R() * 2)}" fill="#6a2a06" opacity=".6"/>`), `</g>`,
            K.glaze(p, 100, 100, 120, '#f4a040', { seed: 1, op: .2 }),
            xusRosemary(p, 92, 92, 36, -30), xusRosemary(p, 124, 128, 30, 40),
            xusSpr(p, 100, 100, 120, { c: '#ffffff', n: 24, r: .8 }), xusSpr(p, 100, 100, 120, { c: '#2a2420', n: 14, r: .55 }),
        ].join('');
    },

    // Southern collard greens: slow-braised collards in pot likker with smoked ham and chili flakes
    us_collards: p => {
        const R = rng(p.id + 'cl');
        const sp = xusSpots('cl', 22, 58, 58, 15);
        return [
            K.bowl(p, { glaze: '#e3d6bc', inside: '#f6f1e6' }),
            K.liquid(p, { R: 76, c: '#5a6224', shine: false }),
            `<g ${p.sh(.6)}>`, ...sp.map(([x, y, r], i) => xusLeafy(p, x, y, 34 + R() * 8, r, { c: i % 2 ? '#3a5a26' : '#4a6a2c', frill: false, seed: i })), `</g>`,
            `<g ${p.sh(.6)}>`, ...xusSpots('clh', 9, 50, 50, 22).map(([x, y, r]) => xusDice(p, x, y, 13, r, '#c87a6a')), `</g>`,
            `<circle cx="100" cy="100" r="76" fill="#6a6a28" opacity=".12"/>`,
            xusSpr(p, 100, 100, 120, { c: '#c8341a', n: 26, r: .8 }),
            xusShine(100, 100, 76, .4),
        ].join('');
    },

    // Creamed spinach: ramekin of spinach folded into a creamy parmesan sauce, nutmeg and pepper
    us_creamedspinach: p => {
        const R = rng(p.id + 'csp');
        return [
            K.kobachi(p, { glaze: '#f2eee6', inside: '#faf8f2' }),
            `<circle cx="100" cy="100" r="77" fill="${p.rg('#6a8e4a', .25, .3)}"/>`,
            `<g ${p.sh(.4)}>`, ...xusSpots('csp', 24, 62, 62, 13).map(([x, y, r], i) => xusLeafy(p, x, y, 28 + R() * 6, r, { c: i % 2 ? '#3a6a2a' : '#4a7a32', frill: false, seed: i })), `</g>`,
            `<g ${xusBlur(p, 2.4)}>`, ...xusPts(R, 20, 100, 100, 60, 60).map(([x, y]) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(6 + R() * 7)}" ry="${f1(4 + R() * 4)}" fill="#f6f2e0" opacity=".6"/>`), `</g>`,
            xusSpr(p, 100, 100, 110, { c: '#fbf3dc', n: 24, r: 1 }),
            xusSpr(p, 100, 100, 110, { c: '#7a4a2a', n: 16, r: .6 }),
            xusShine(100, 100, 77, .4),
        ].join('');
    },

    // Honey-glazed carrots: shiny carrot coins in a buttery honey glaze, parsley
    us_glazedcarrots: p => {
        const R = rng(p.id + 'gc');
        return [
            K.kobachi(p, { glaze: '#5a7aa0', inside: '#eef2f4' }),
            `<circle cx="100" cy="100" r="74" fill="#f0a840" opacity=".35"/>`,
            `<g ${p.sh(.6)}>`, ...xusSpots('gc', 34, 62, 62, 14).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="${f1(10 + R() * 2)}" ry="9" fill="${p.g('#ee7a26', .3, .25)}" stroke="#b8501a" stroke-width=".6"/><ellipse rx="4.4" ry="4" fill="#f8a85a"/><path d="M-6,-4 Q-2,-7 3,-6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/></g>`), `</g>`,
            K.glaze(p, 100, 100, 130, '#f6b84a', { seed: 1, op: .3 }),
            xusParsley(p, 100, 100, 110, { n: 30 }),
        ].join('');
    },

    // Roasted Brussels sprouts with bacon: halved sprouts with deeply browned cut sides, crisp bacon, balsamic drizzle
    us_brussels: p => {
        const R = rng(p.id + 'br');
        return [
            xusSkillet(p, { R: 82, cx: 92, cy: 100 }),
            `<g ${p.sh(.6)}>`, ...xusSpots('br', 20, 62, 62, 19, 92, 100).map(([x, y, r], i) => xusSprout(p, x, y, 28 + R() * 4, r, { seed: i })), `</g>`,
            `<g ${p.sh(.5)}>`, ...xusSpots('brb', 12, 56, 56, 16, 92, 100).map(([x, y, r], i) => xusBacon(p, x, y, 18, r, { seed: i })), `</g>`,
            `<path d="M58,84 Q76,70 92,88 T126,90 M64,124 Q84,110 100,128 T130,122" stroke="#3a1a20" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`,
            xusSpr(p, 92, 100, 120, { c: '#ffffff', n: 14, r: .7 }),
        ].join('');
    },

    // Sautéed zucchini and yellow squash: golden-browned rounds with onion, parmesan and herbs
    us_squash: p => {
        const R = rng(p.id + 'zq');
        return [
            K.plate(p, { rim: '#e0b030' }),
            `<g ${p.sh(.6)}>`, ...xusSpots('zq', 30, 64, 64, 15).map(([x, y, r], i) => xusSquash(p, x, y, 24 + R() * 3, r, { yellow: i % 2 === 0, seed: i })), `</g>`,
            ...xusPts(R, 6, 100, 100, 50, 50).map(([x, y]) => xusOnionStrip(p, x, y, 22, R() * 360, { c: '#f0d8a0', op: .9 })),
            xusSpr(p, 100, 100, 110, { c: '#fbf3dc', n: 30, r: 1.1 }),
            xusParsley(p, 100, 100, 110, { n: 20 }),
            xusSpr(p, 100, 100, 110, { c: '#2a2420', n: 14, r: .55 }),
        ].join('');
    },

    // Succotash: buttery sweet corn with lima beans, red bell pepper and onion, herbs
    us_succotash: p => {
        const R = rng(p.id + 'sc');
        return [
            K.bowl(p, { glaze: '#c8452f', inside: '#f6f1e6' }),
            `<circle cx="100" cy="100" r="76" fill="${p.rg('#f0d070', .2, .25)}"/>`,
            xusKernels(p, 100, 100, 68, 68, 220, { s: 6.6, seed: 1 }),
            `<g ${p.sh(.5)}>`, ...xusSpots('scl', 24, 62, 62, 13).map(([x, y, r], i) => i % 4 === 3 ? xusDice(p, x, y, 10, r, '#d9342a') : xusBean(p, x, y, 18, r, { c: '#a8c86a' })), `</g>`,
            ...xusPts(R, 6, 100, 100, 50, 50).map(([x, y]) => xusDice(p, x, y, 8, R() * 90, '#d9342a')),
            K.glaze(p, 100, 100, 120, '#f8e08a', { seed: 1, op: .25 }),
            xusParsley(p, 100, 100, 100, { n: 20 }),
        ].join('');
    },

    // Refrigerator pickles: open glass jar of crisp cucumber chips and onion in brine with dill, garlic and peppercorns
    us_fridgepickles: p => {
        const R = rng(p.id + 'fp');
        return [
            `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="88" fill="${p.rg('#dfe8e6', .3, .2, .35, .3)}"/></g>`,
            `<circle cx="100" cy="100" r="84" fill="none" stroke="#9fb4b4" stroke-width="3"/><circle cx="100" cy="100" r="79" fill="none" stroke="#c4d4d2" stroke-width="2"/>`,
            `<circle cx="100" cy="100" r="76" fill="${p.rg('#d6d8a0', .25, .2)}"/>`,
            ...(() => { const sp = xusSpots('fp', 26, 62, 62, 15); return [`<g ${p.sh(.5)}>`, ...sp.map(([x, y], i) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="13" ry="12" fill="${p.rg('#d8e6a8', .3, .15)}" stroke="${i % 3 ? '#5a8a2c' : '#4a7a24'}" stroke-width="2.4" stroke-dasharray="3 1"/>`), `</g>`, xusDots(sp.flatMap(([x, y]) => [0, 1, 2, 3, 4, 5].map(j => [x + Math.cos(j * 1.047) * 4.8, y + Math.sin(j * 1.047) * 4.4])), 1.1, '#f0f4d0')]; })(),
            ...xusPts(R, 5, 100, 100, 50, 50).map(([x, y]) => `<g ${T(x, y)}><circle r="9" fill="none" stroke="#f4f0e2" stroke-width="2.4" opacity=".9"/><circle r="5.6" fill="none" stroke="#eae6d2" stroke-width="1.6" opacity=".9"/></g>`),
            K.shreds(p, 100, 100, 110, { c: '#3f7a2c', n: 22, w: .9, len: .2, seed: 4, curve: .8 }),
            xusGarlic(p, 70, 80, 13, 20), xusGarlic(p, 130, 124, 13, -40),
            xusSpr(p, 100, 100, 110, { c: '#2a2420', n: 12, r: 1.2 }), xusSpr(p, 100, 100, 110, { c: '#e8c860', n: 16, r: .9 }),
            `<path d="M44,74 A62,62 0 0 1 82,40" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
        ].join('');
    },

    // Waldorf salad: lettuce cup with red apple chunks, celery, red grapes and walnuts in a creamy dressing
    us_waldorf: p => {
        const R = rng(p.id + 'wd');
        const sp = xusSpots('wf', 30, 56, 54, 14);
        return [
            K.bowl(p, { glaze: '#e8e2d4', inside: '#fbf8f1' }),
            ...[[60, 70, -40], [140, 70, 40], [60, 132, 220], [140, 132, 140], [100, 56, 0], [100, 146, 180], [48, 100, 270], [152, 100, 90]].map(([x, y, r], i) => xusLeaf(p, x, y, 54, r + 90, { seed: i, c: i % 2 ? '#8cc551' : '#a6d468' })),
            `<g ${p.sh(1)}>`, xusMound(p, 100, 100, 58, 56, '#f6efda', { seed: 2, l: .3, d: .15 }), `</g>`,
            `<g ${p.sh(.5)}>`, xusMix(sp, [
                (x, y, r) => xusDice(p, x, y, 17, r, '#f6eccc', { skin: '#c8282a' }),
                (x, y, r) => `<g ${T(x, y, r)}><ellipse rx="7.4" ry="6" fill="${p.rg('#8a2a4a', .3, .25, .35, .32)}" stroke="#5a1a2a" stroke-width=".5"/><ellipse rx="4" ry="3" fill="#b8506a" opacity=".6"/><ellipse cx="-2.4" cy="-2.2" rx="1.6" ry=".9" fill="#fff" opacity=".7"/></g>`,
                (x, y, r) => xusCelery(p, x, y, 13, r),
                (x, y, r) => `<g ${T(x, y, r)}><path d="M-7,0 C-7,-6 -2,-5 0,-3 C2,-5 7,-6 7,0 C7,5 2,6 0,3 C-2,6 -7,5 -7,0Z" fill="${p.g('#a8723a', .3, .3)}" stroke="#6a4218" stroke-width=".6"/><path d="M-4,-1 Q-2,1 -4,3 M4,-1 Q2,1 4,3 M0,-3 L0,3" stroke="#6a4218" stroke-width=".7" fill="none"/></g>`,
                (x, y, r) => xusDice(p, x, y, 16, r, '#f4e8c4', { skin: '#b82024' }),
            ]), `</g>`,
            K.glaze(p, 100, 100, 110, '#fffbf0', { seed: 1, op: .3 }),
        ].join('');
    },

    // Rice pilaf: fluffy long-grain rice with toasted orzo/vermicelli, onion and parsley
    us_ricepilaf: p => [
        K.bowl(p, { glaze: '#b8862a', inside: '#f6f1e6' }),
        xusRice(p, 100, 100, 152, { tint: '#f2e6c4', seed: 1, density: .7, grain: 3.8 }),
        xusGrainLines(p, 100, 100, 66, 66, 60, { c: '#c8843a', len: 6, w: 2.6, seed: 2 }),
        xusGrainLines(p, 100, 100, 64, 64, 30, { c: '#a8642a', len: 5, w: 2.4, seed: 3 }),
        xusParsley(p, 100, 100, 120, { n: 36 }),
        xusSpr(p, 100, 100, 120, { c: '#2a2420', n: 14, r: .55 }),
    ].join(''),

    // Garlic bread: toasted baguette slices with golden garlic-parmesan butter and parsley on a board
    us_garlicbread: p => {
        const R = rng(p.id + 'gb');
        const sl = (x, y, r, seed) => `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xusSm(ring(1, 12, .06, rng('gbs' + seed), 30, 20), true)}" fill="${p.g('#b8742a', .3, .35)}" stroke="#7a4410" stroke-width=".7"/></g>
            <g ${p.crumb(.7)}><path d="${xusSm(ring(1, 12, .06, rng('gbs' + seed), 26, 16.5), true)}" fill="${p.rg('#f2c66a', .25, .3)}"/></g>
            <g ${xusBlur(p, 2)}><ellipse cx="6" cy="4" rx="12" ry="7" fill="#c8862a" opacity=".55"/></g>
            ${xusParsley(p, x - x, 0, 40, { n: 12, seed, sz: .9 })}
            <path d="M-18,-8 Q-6,-14 8,-12" stroke="#fff8d8" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
        return [
            xusBoard(p, { w: 188, h: 166, c: '#c99a64' }),
            sl(58, 66, -20, 1), sl(124, 54, 10, 2), sl(152, 104, -30, 3), sl(90, 108, 15, 4), sl(52, 144, 10, 5), sl(124, 150, -10, 6),
            xusSpr(p, 100, 100, 150, { c: '#fbf3dc', n: 30, r: .9 }),
            xusGarlic(p, 22, 104, 14, 30),
        ].join('');
    },

    // Sautéed mushrooms: skillet of golden-browned cremini halves in garlic butter with parsley
    us_mushrooms: p => {
        const R = rng(p.id + 'ms');
        return [
            xusSkillet(p, { R: 82, cx: 92, cy: 100 }),
            `<g ${p.sh(.7)}>`, ...xusSpots('ms', 22, 62, 62, 18, 92, 100).map(([x, y, r], i) => i % 3 === 0
                ? `<g ${T(x, y, r)}><circle r="12" fill="${p.rg('#9a6a42', .3, .35, .35, .32)}" stroke="#5a3418" stroke-width=".6"/><ellipse cx="-4" cy="-4" rx="4" ry="2" fill="#fff" opacity=".35"/></g>`
                : xusMushSlice(p, x, y, 28 + R() * 4, r, { c: '#7a4e2c', flesh: '#d9b47e' })), `</g>`,
            K.glaze(p, 92, 100, 130, '#e8b850', { seed: 1, op: .22 }),
            xusParsley(p, 92, 100, 120, { n: 34 }),
            xusSpr(p, 92, 100, 110, { c: '#2a2420', n: 14, r: .55 }),
        ].join('');
    },

    // Macaroni salad: creamy elbow macaroni with carrot, red bell pepper, celery and red onion, paprika
    us_macsalad: p => {
        const R = rng(p.id + 'mcs');
        return [
            K.bowl(p, { glaze: '#3f97a0', inside: '#f6f1e6' }),
            `<g ${p.sh(1)}>`, xusMound(p, 100, 100, 74, 72, '#f2e2b0', { seed: 2, l: .3, d: .18 }), `</g>`,
            `<g ${p.sh(.4)}>`, ...xusSpots('mcs', 44, 64, 64, 12).map(([x, y, r]) => xusElbow(p, x, y, 23, r, { c: R() < .5 ? '#f2d080' : '#efc874' })), `</g>`,
            K.glaze(p, 100, 100, 130, '#fffbf0', { seed: 1, op: .3 }),
            ...xusPts(R, 16, 100, 100, 60, 60).map(([x, y], i) => i % 4 === 0 ? xusCelery(p, x, y, 8, R() * 360) : xusDice(p, x, y, 6, R() * 90, ['#ef7f30', '#d9342a', '#8a3a7a', '#ef7f30'][i % 4])),
            xusSpr(p, 100, 100, 110, { c: '#d04a1a', n: 30, r: .7 }),
        ].join('');
    },

    // Fried okra: cornmeal-crusted okra coins on a paper-lined plate with a creamy dipping sauce
    us_friedokra: p => {
        const R = rng(p.id + 'fo');
        return [
            K.plate(p, { rim: '#b8341e' }),
            `<g ${p.sh(.6)}><rect ${T(100, 100, 12)} x="-60" y="-60" width="120" height="120" rx="3" fill="#fbf6ea"/></g>`,
            `<path ${T(100, 100, 12)} d="M-60,-30 H60 M-60,0 H60 M-60,30 H60 M-30,-60 V60 M0,-60 V60 M30,-60 V60" stroke="#d64a3a" stroke-width="7" opacity=".28"/>`,
            `<g ${p.sh(.7)}><g ${p.rough(1.6, .3)}><g ${p.crumb(.9)}>`, ...xusSpots('fo', 32, 60, 60, 15.5).filter(([x, y]) => Math.hypot(x - 146, y - 146) > 26).map(([x, y, r], i) => xusFriedOkra(p, x, y, 20 + R() * 4, r, { seed: i })), `</g></g></g>`,
            `<g ${p.sh(.8)}><circle cx="148" cy="146" r="20" fill="${p.rg('#ffffff', .1, .15)}" stroke="#ddd6c8"/></g>`,
            `<circle cx="148" cy="146" r="15.5" fill="${p.rg('#f0d8b0', .25, .2)}"/>`,
            xusSpr(p, 148, 146, 22, { c: '#c8341a', n: 8, r: .6 }),
            xusSpr(p, 92, 92, 110, { c: '#ffffff', n: 16, r: .7 }),
        ].join('');
    },

};
