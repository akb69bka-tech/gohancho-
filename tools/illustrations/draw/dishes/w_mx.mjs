// World pack: Mexico (comida casera) — mx_ ids
import * as K from '../kit.mjs';

const { T, f, rng, ring, lt, dk, mix, smooth } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// Local helpers (mx = Mexico)
// =========================================================
function mxSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function mxOl(p, c, r = .55){
    const id = p.def('mxOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const mxBlur = (p, s = 2) => `filter="url(#${p.def('mxbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const mxShine = (cx, cy, R, op = .35, w = 1.8) => `<path d="M${f(cx - R * .55)},${f(cy + R * .1)} A${f(R * .6)},${f(R * .6)} 0 0 1 ${f(cx - R * .05)},${f(cy - R * .52)}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
const mxArc = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// rice mound (grains as short strokes) — arroz rojo uses an orange tint
function mxRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'mxRice' + seed + x + y);
    const shape = mxSm(ring(s / 2, 14, .07, R, 1, sy), true);
    const hi = lt(tint, hiK), mid = dk(tint, .02), sd = dk(tint, .3);
    const n = Math.round(s * s / 40 * density);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * s / 2 * .96;
        const gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy;
        const h = grain * (.42 + R() * .14), b = R() * Math.PI, dx = Math.cos(b) * h, dy = Math.sin(b) * h;
        const seg = `M${Math.round(gx - dx)} ${Math.round(gy - dy)}l${f1(dx * 2)} ${f1(dy * 2)}`;
        const lit = (gx + gy) / (s / 2) + (R() - .5) * 1.4 < .2;
        const l = L[i % layers];
        if (lit){ l[0] += seg; if (R() < .4) l[2] += `M${f1(gx - dx * .6 - .55)} ${f1(gy - dy * .6 - .55)}l${f1(dx * .9)} ${f1(dy * .9)}`; } else l[1] += seg;
    }
    const shade = p.def('mxRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    const base = `<path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/>`;
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}>${base}</g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// many small irregular grains, one path per colour (mince, crumbled cheese, chopped things)
function mxGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'mxGr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; });
        ds[k] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`).join('');
}
// thin shreds grouped by colour (shredded chicken)
function mxShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'mxSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? mxOl(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// thin noodles (fideo) in one path
function mxNoodles(p, x, y, s, { c = '#d9b06a', w = 1.6, n = 60, seed = 1, sy = .9, outline = null, hi = .35 } = {}){
    const R = rng(p.id + 'mxNd' + seed);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.15 + R() * .82), a0 = R() * 6.28, sweep = 1 + R() * 2.2;
        const cx = x + (R() - .5) * s * .14, cy = y + (R() - .5) * s * .14;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .3); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = mxSm(pts);
        d += one; if (R() < hi) dl += one;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.8)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="${outline || dk(c, .25)}" stroke-width="${f(w + .9)}"/><use href="#${id}" stroke="${c}" stroke-width="${w}"/></g><path d="${dl}" stroke="${lt(c, .4)}" stroke-width="${f(w * .5)}" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// dice (rounded cube from above), optional skin band
function mxDice(p, x, y, s, r = 0, c = '#ef7f30', { skin = null, op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f(h * .5)}" width="${s}" height="${f(s * .22)}" rx="${f(s * .1)}" fill="${skin}"/>` : ''}
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// evenly spread positions
function mxSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('mxspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// cilantro leaf (3-lobed, scalloped)
function mxCilantro(p, x, y, s, r = 0, { c = '#3f8a2c' } = {}){
    const d = 'M0,8 C-1,5 -2,3 -3,2 C-7,4 -10,1 -8,-2 C-10,-5 -6,-8 -3,-6 C-3,-10 3,-10 3,-6 C6,-8 10,-5 8,-2 C10,1 7,4 3,2 C2,3 1,5 0,8Z';
    return `<g ${T(x, y, r, s / 20)}><path d="${d}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M0,7 L0,-6 M0,0 L-6,-3 M0,0 L6,-3" stroke="${lt(c, .4)}" stroke-width=".6" fill="none"/></g>`;
}
// chopped cilantro / onion bits scattered
function mxBits(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'], sy = 1 } = {}){
    const R = rng(p.id + 'mxBt' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 1 + R();
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R(), r2 = rr * (.6 + R() * .6); return `${f1(cx + Math.cos(aa) * r2)},${f1(cy + Math.sin(aa) * r2)}`; });
        ds[i % cols.length] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// crumbled queso fresco (white crumbs with a soft grey outline)
function mxQueso(p, x, y, s, { n = 24, seed = 1, size = 2.2, sy = 1 } = {}){
    return `<g ${mxOl(p, '#cdbfa4', .5)}>${mxGrains(p, x, y, s, { cols: ['#fdfbf4', '#f3ecdc'], n, size, seed, sy })}</g>`;
}
// small green rings (sliced serrano / scallion)
function mxRings(p, x, y, s, { n = 10, seed = 1, c = '#4f9a2c', rr = 1.9 } = {}){
    const R = rng(p.id + 'mxRg' + seed + x + y);
    let d = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd; const seg = `M${f1(cx - rr)},${f1(cy)}a${rr},${f1(rr * .9)} 0 1 0 ${f1(rr * 2)},0a${rr},${f1(rr * .9)} 0 1 0 -${f1(rr * 2)},0`; if (R() < .6) d += seg; else d2 += seg; }
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.3"/><path d="${d2}" fill="none" stroke="${lt(c, .3)}" stroke-width="1.3"/>`;
}
// translucent onion sliver (raw white or cooked gold)
function mxSliver(p, x, y, s, r = 0, { c = '#f3ecdc', span = 1.6, w = null } = {}){
    const R0 = s / 2, a0 = -Math.PI / 2 - span / 2, a1 = a0 + span, sw = w || s * .13;
    const d = `M${f1(Math.cos(a0) * R0)},${f1(Math.sin(a0) * R0)}A${f1(R0)},${f1(R0 * .85)} 0 0 1 ${f1(Math.cos(a1) * R0)},${f1(Math.sin(a1) * R0)}`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(sw + .8)}" fill="none" stroke-linecap="round" opacity=".5"/><path d="${d}" stroke="${c}" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round" opacity=".92"/><path d="${d}" stroke="#fff" stroke-width="${f1(sw * .3)}" fill="none" stroke-linecap="round" opacity=".8" transform="translate(-.3 -.4)"/></g>`;
}
// raw onion ring (thin, white with a purple-grey edge)
function mxOnionRing(p, x, y, s, r = 0, { c = '#f6f0e6', edge = '#b9a4a6' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .4)}" fill="none" stroke="${edge}" stroke-width="3"/><ellipse rx="${f1(s / 2)}" ry="${f1(s * .4)}" fill="none" stroke="${c}" stroke-width="1.8"/></g>`;
}
// lime wedge (green rind, pale green flesh)
const mxLime = (p, x, y, s, r = 0) => K.lemon(p, x, y, s, r, { c: '#c6e27c', rind: '#3f8f2b' });
// corn tortilla seen from above: pale corn-yellow disc with toasted blisters
function mxTortilla(p, x, y, s, r = 0, { seed = 1, c = '#edd48e', edge = '#b98a3c', crisp = false } = {}){
    const R = rng(p.id + 'mxTt' + seed + x + y);
    const pts = ring(s / 2, 16, crisp ? .09 : .05, R);
    let spots = '';
    for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .44; spots += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(s * (.03 + R() * .06))}" ry="${f(s * (.02 + R() * .04))}" transform="rotate(${f(R() * 180)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="${R() < .4 ? '#8a4a1a' : '#c08030'}" opacity="${f(.35 + R() * .4)}"/>`; }
    let dots = '';
    for (let i = 0; i < 10; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .42; dots += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(.5 + R() * .7)}" fill="#6a3410" opacity=".55"/>`; }
    const body = `<path d="${smooth(pts)}" fill="${p.rg(c, .22, .22, .4, .36)}" stroke="${edge}" stroke-width=".7"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}>${crisp ? `<g ${p.crumb(.7)}>${body}</g>` : body}</g><g ${mxBlur(p, 1.3)}>${spots}</g>${dots}
        <path d="M${f(-s * .32)},${f(-s * .16)} Q${f(-s * .12)},${f(-s * .36)} ${f(s * .16)},${f(-s * .32)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// tortilla chip (totopo): triangle with toasted patches and salt
function mxTotopo(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'mxTp' + seed + x + y);
    const d = `M${f(-s / 2)},${f(s * .36)} Q0,${f(s * .44)} ${f(s / 2)},${f(s * .36)} Q${f(s * .1)},${f(-s * .1)} ${f(s * .06)},${f(-s * .5)} Q0,${f(-s * .56)} ${f(-s * .06)},${f(-s * .5)} Q${f(-s * .1)},${f(-s * .1)} ${f(-s / 2)},${f(s * .36)}Z`;
    let sp = '';
    for (let i = 0; i < 4; i++) sp += `<ellipse cx="${f((R() - .5) * s * .4)}" cy="${f((R() - .4) * s * .5)}" rx="${f(1.4 + R() * 2.6)}" ry="${f(1 + R() * 1.4)}" fill="#b8742a" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.g('#f0c95e', .3, .3)}" stroke="#b07a26" stroke-width=".7"/></g><g ${mxBlur(p, .9)}>${sp}</g>
        <path d="M${f(-s * .3)},${f(s * .2)} L${f(-s * .02)},${f(-s * .3)}" stroke="#fff6d6" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>
        <circle cx="${f(s * .12)}" cy="${f(s * .1)}" r=".7" fill="#fff"/><circle cx="${f(-s * .14)}" cy="${f(s * .22)}" r=".6" fill="#fff"/></g>`;
}
// tortilla folded in quarters and coated in sauce (enfrijolada)
function mxFold(p, x, y, s, r = 0, { c = '#7a5244', edge = '#ecd286' } = {}){
    const q = `M0,0 L${f(s / 2)},0 A${f(s / 2)},${f(s / 2)} 0 0 1 0,${f(s / 2)}Z`;
    const arc = k => `M${f(s / 2 * k)},0 A${f(s / 2 * k)},${f(s / 2 * k)} 0 0 1 0,${f(s / 2 * k)}`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${q}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="${arc(.97)}" stroke="${edge}" stroke-width="2.4" fill="none" opacity=".9"/><path d="${arc(.88)}" stroke="${edge}" stroke-width="1.2" fill="none" opacity=".55"/>
        <path d="M2.4,2.4 L${f(s * .42)},2.4 M2.4,2.4 L2.4,${f(s * .42)}" stroke="${lt(c, .3)}" stroke-width="1" fill="none" opacity=".5"/>
        <path d="M${f(s * .14)},${f(s * .12)} Q${f(s * .3)},${f(s * .1)} ${f(s * .38)},${f(s * .2)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// chicken drumstick, bone to the right
function mxDrum(p, x, y, s, r = 0, { c = '#d9a95c' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#efe2c6', .3, .25)}" stroke="#b39a6c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="M-14,4 Q-6,10 4,7" stroke="${dk(c, .35)}" stroke-width="1.4" fill="none" opacity=".4"/>
        ${mxArc('M-16,-5 Q-10,-11 -2,-9.5', 2.2, .75)}${mxArc('M2,-6 Q7,-4.5 11,-3', 1.2, .5)}</g>`;
}
// browned meat chunk (pork cubes, beef pieces) with optional sauce film
function mxChunk(p, x, y, s, r = 0, { c = '#a06a3c', sauce = null, seed = 1, sy = .85 } = {}){
    const R = rng(p.id + 'mxCk' + seed + x + y);
    const pts = ring(s / 2, 7, .34, R, 1.15, sy);
    let marks = '';
    for (let i = 0; i < 3; i++) marks += `<ellipse cx="${f((R() - .5) * s * .5)}" cy="${f((R() - .5) * s * .4)}" rx="${f(s * .08 + R() * s * .1)}" ry="${f(s * .05 + R() * s * .05)}" fill="${dk(c, .5)}" opacity="${f(.22 + R() * .22)}"/>`;
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .6)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .38)}" stroke-width=".7"/>${marks}
        ${sauce ? `<path d="${smooth(pts.map(([a, b]) => [a * .9 + s * .05, b * .86 + s * .08]), true, .6)}" fill="${sauce}" opacity=".55"/>` : ''}
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .05)},${f(-s * .38)} ${f(s * .2)},${f(-s * .28)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// thin beef steak strip, seared (bistec)
function mxBeef(p, x, y, s, r = 0, { c = '#6e3a1c', seed = 1 } = {}){
    const R = rng(p.id + 'mxBf' + seed + x + y);
    const k = s / 30;
    const folds = Array.from({ length: 3 }, (_, i) => { const fx = -8 + i * 8 + (R() - .5) * 4; return `M${f1(fx)},${f1(-6 + R() * 2)} q${f1((R() - .5) * 5)},6 ${f1((R() - .5) * 3)},${f1(11 + R() * 2)}`; }).join('');
    return `<g ${T(x, y, r, k)}><path d="${mxSm(ring(14, 16, .32, R, 1.1, .62), true)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="${folds}" stroke="${dk(c, .45)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// cooked tomato piece (chunky, in sauce)
function mxTomPiece(p, x, y, s, r = 0, { seed = 1, c = '#e2412c' } = {}){
    const R = rng(p.id + 'mxTm' + seed + x + y);
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="${mxSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="${mxSm(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true)}" fill="${lt(c, .25)}" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>${mxArc('M-7,-4 Q-1,-7.5 5,-5.4', 1.2, .6)}</g>`;
}
// fresh tomato dice with a seed face showing
function mxTomDice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${f(s * .92)}" rx="${f(s * .22)}" fill="${p.g('#e4392b', .3, .25)}" stroke="#a8221a" stroke-width=".55"/>
        <ellipse cx="0" cy="${f(-s * .04)}" rx="${f(s * .24)}" ry="${f(s * .17)}" fill="#f7b24a" opacity=".85"/>
        <path d="M${f(-s * .3)},${f(-s * .3)} L${f(s * .16)},${f(-s * .3)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".7"/></g>`;
}
// green olive stuffed with pimiento
function mxOlive(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .4)}" fill="${p.rg('#8fa23a', .3, .3, .35, .32)}" stroke="#5a6a1c" stroke-width=".5"/></g>
        <ellipse rx="${f(s * .18)}" ry="${f(s * .14)}" fill="#c93a24"/><ellipse cx="${f(-s * .18)}" cy="${f(-s * .14)}" rx="${f(s * .13)}" ry="${f(s * .06)}" fill="#fff" opacity=".7"/></g>`;
}
// slim chili pod: serrano (green) or guero (pale yellow), stem to the left
function mxChili(p, x, y, L, r = 0, { c = '#3f8a2c', bend = 3 } = {}){
    const d = `M${f(-L / 2)},0 Q0,${-bend} ${f(L / 2)},${f(bend * .4)}`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .35)}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/><path d="${d}" stroke="${p.g(c, .3, .25)}" stroke-width="5.6" fill="none" stroke-linecap="round"/>
        <path d="M${f(-L / 2)},0 l-4,-1.2" stroke="#6a8a3a" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="${f(-L / 2 + 1)}" cy="0" rx="2.4" ry="3.2" fill="#5a8a30"/>
        <path d="M${f(-L * .34)},-1.6 Q0,${f(-bend - 1.6)} ${f(L * .3)},-1" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// white fish fillet with flake lines
function mxFillet(p, x, y, w, h, r = 0, { seed = 1, c = '#f3e7d3' } = {}){
    const R = rng(p.id + 'mxFl' + seed);
    const pts = ring(1, 12, .1, R, w / 2, h / 2).map(([a, b]) => [a, a > 0 ? b * .8 : b]);
    const fl = [-.28, -.08, .12, .32].map(t => `M${f(w * t)},${f(-h * .34)} q${f(w * .06)},${f(h * .3)} ${f(-w * .02)},${f(h * .66)}`).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${mxSm(pts, true)}" fill="${p.g(c, .25, .2)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="${fl}" stroke="${dk(c, .18)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f(-w * .34)},${f(-h * .22)} Q${f(-w * .1)},${f(-h * .4)} ${f(w * .18)},${f(-h * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// nopal strip (olive green, soft, slightly glossy)
function mxNopal(p, x, y, L, W, r = 0, { c = '#6f8f3a' } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-W / 2)}" width="${L}" height="${W}" rx="${f(W * .4)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f(-L * .36)},${f(-W * .12)} L${f(L * .24)},${f(-W * .14)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/></g>`;
}
// strip of roasted poblano (dark green, glossy, blistered)
function mxRaja(p, x, y, L, W, r = 0, { c = '#3c6b2c', bend = .18 } = {}){
    const d = `M${f1(-L / 2)},0 Q0,${f1(-L * bend)} ${f1(L / 2)},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .4)}" stroke-width="${f1(W + 1.2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${p.g(c, .28, .22)}" stroke-width="${W}" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-L * .3)},${f1(-L * bend * .55 - W * .18)} Q0,${f1(-L * bend * .9 - W * .2)} ${f1(L * .26)},${f1(-L * bend * .5 - W * .16)}" stroke="${lt(c, .5)}" stroke-width="${f1(Math.max(.9, W * .22))}" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// green peas
function mxPeas(p, x, y, s, { n = 12, seed = 1, sz = 2.6 } = {}){
    const R = rng(p.id + 'mxPe' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${sz}" fill="${p.rg('#6db043', .3, .3, .35, .32)}" stroke="#3f7a24" stroke-width=".5"/><circle cx="${f(cx - sz * .3)}" cy="${f(cy - sz * .3)}" r="${f(sz * .3)}" fill="#fff" opacity=".6"/>`; }
    return out;
}
// white crema zigzag
const mxCrema = (p, x, y, w, h, r = 0, n = 5) => K.drizzle(p, x, y, w, h, { c: '#fbf8ee', width: 2.2, n, r });

// ---------- Mexican vessels ----------
// Talavera-style plate: white with a cobalt blue rim pattern and small yellow dots
function mxTalavera(p, { R = 94, blue = '#1f4e9c', accent = '#e8b73a', base = '#fbfaf6' } = {}){
    const n = 20;
    let pet = '', dot = '';
    for (let i = 0; i < n; i++){
        const a = i / n * 6.28, cx = 100 + Math.cos(a) * (R - 11), cy = 100 + Math.sin(a) * (R - 11);
        pet += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="4.2" ry="2.3" transform="rotate(${f(a * 57.3)} ${f(cx)} ${f(cy)})" fill="${blue}"/>`;
        const b = a + 3.14 / n, dx = 100 + Math.cos(b) * (R - 11), dy = 100 + Math.sin(b) * (R - 11);
        dot += `<circle cx="${f(dx)}" cy="${f(dy)}" r="1.6" fill="${accent}"/>`;
    }
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${blue}" stroke-width="2.6"/>
        <circle cx="100" cy="100" r="${R - 6.5}" fill="none" stroke="${blue}" stroke-width=".7" opacity=".7"/>
        ${pet}${dot}
        <circle cx="100" cy="100" r="${R - 16}" fill="none" stroke="${blue}" stroke-width="1.2"/>
        <circle cx="100" cy="100" r="${R - 17.5}" fill="none" stroke="${blue}" stroke-width=".5" opacity=".6"/>
        <circle cx="100" cy="100" r="${f(R * .74)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// Talavera-style bowl: blue outside, white inside with a ring of petals under the lip
function mxTalaveraBowl(p, { R = 92, blue = '#2b5aa6', accent = '#e8b73a', inside = '#fbf9f3' } = {}){
    const n = 18, r0 = R * .87 - 4;
    let pet = '';
    for (let i = 0; i < n; i++){ const a = i / n * 6.28, cx = 100 + Math.cos(a) * r0, cy = 100 + Math.sin(a) * r0; pet += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="3.2" ry="1.7" transform="rotate(${f(a * 57.3)} ${f(cx)} ${f(cy)})" fill="${blue}"/>`; const b = a + 3.14 / n; pet += `<circle cx="${f(100 + Math.cos(b) * r0)}" cy="${f(100 + Math.sin(b) * r0)}" r="1.2" fill="${accent}"/>`; }
    return K.bowl(p, { R, glaze: blue, inside }) + pet + `<circle cx="100" cy="100" r="${f(r0 - 5)}" fill="none" stroke="${blue}" stroke-width=".8" opacity=".6"/>`;
}
// clay cazuela de barro: terracotta with two lugs, glossy brown glaze inside
function mxCazuela(p, { R = 84, glaze = '#6e3d18', clay = '#b96a3c' } = {}){
    const lug = x => `<rect x="${x - 9}" y="88" width="18" height="24" rx="8" fill="${p.g(clay, .2, .3)}" stroke="${dk(clay, .3)}" stroke-width=".8"/>`;
    return `<g ${p.sh(1.8)}>${lug(100 - R - 2)}${lug(100 + R + 2)}<circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${lt(clay, .3)}" stroke-width="1.4" opacity=".7"/>
        <circle cx="100" cy="100" r="${R - 8}" fill="${p.rg(glaze, .15, .35, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .36} A${R * .8},${R * .8} 0 0 1 ${100 - R * .28},${100 - R * .76}" stroke="#ffe2c8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// flat clay plate (plato de barro)
function mxClayPlate(p, { R = 92, clay = '#bd6d3c', glaze = '#8e4a22' } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R * .8}" fill="${p.rg(glaze, .16, .3, .62, .64)}"/>
        <circle cx="100" cy="100" r="${R * .8}" fill="none" stroke="${dk(clay, .25)}" stroke-width="1.2" opacity=".6"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#ffe2c8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// molcajete: dark volcanic stone mortar, pitted
function mxMolcajete(p, { R = 92 } = {}){
    const c = '#4d4a47';
    return `<g ${p.sh(2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .2, .3, .35, .3)}"/></g>
        <g ${p.crumb(.75)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .18, .28, .35, .3)}" opacity=".9"/></g>
        ${K.sprinkle(p, 100, 100, 2 * R - 6, { c: '#7a7672', n: 70, r: .9 })}${K.sprinkle(p, 100, 100, 2 * R - 6, { c: '#2b2927', n: 50, r: .8 })}
        <circle cx="100" cy="100" r="${f(R * .75)}" fill="${p.rg('#3a3735', .1, .22, .6, .62)}"/>
        <circle cx="100" cy="100" r="${f(R * .75)}" fill="none" stroke="#262422" stroke-width="1.2" opacity=".7"/>
        <path d="M${100 - R * .66},${100 - R * .44} A${R * .8},${R * .8} 0 0 1 ${100 - R * .3},${100 - R * .72}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".3"/>`;
}
// woven palm tortilla basket (tortillero)
function mxBasket(p, { R = 95 } = {}){
    let rings = '';
    for (let i = 0; i < 4; i++){ const rr = R - 3 - i * 5.2; rings += `<circle cx="100" cy="100" r="${rr}" fill="none" stroke="${i % 2 ? '#c49a56' : '#e0bd7c'}" stroke-width="5.4" stroke-dasharray="7 2.4" stroke-dashoffset="${i * 4.5}"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="#b48748"/></g>${rings}
        <circle cx="100" cy="100" r="${R - 21}" fill="${p.rg('#a67a40', .1, .3, .6, .6)}"/>
        <path d="M${100 - R * .7},${100 - R * .36} A${R * .8},${R * .8} 0 0 1 ${100 - R * .3},${100 - R * .72}" stroke="#fff3d8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>`;
}

// =========================================================
export default {
    // Corn tortillas: palm tortillero with an embroidered white cloth and a stack of warm tortillas, one folded
    mx_staple: p => [
        mxBasket(p),
        `<g ${p.sh(1)}><path d="${mxSm([[32, 78], [60, 38], [122, 30], [166, 58], [172, 118], [146, 164], [84, 172], [36, 136]], true)}" fill="${p.rg('#fbf8f0', .1, .12)}" stroke="#d9d0bc" stroke-width=".8"/></g>`,
        `<path d="M44,70 q8,-4 16,0 t16,0 t16,0 M150,124 q-4,8 -10,12" stroke="#c8392e" stroke-width="1.2" fill="none" opacity=".55"/><path d="M46,66 l3,-3 l3,3 l-3,3Z M62,66 l3,-3 l3,3 l-3,3Z M78,66 l3,-3 l3,3 l-3,3Z" fill="#2f7a4a" opacity=".7"/>`,
        // stack: lower tortillas offset so the pile reads as thick
        `<g ${p.sh(1.2)}>`,
        ...[5, 4, 3, 2, 1].map(i => `<circle cx="${100 + i * 1.6}" cy="${98 + i * 2.2}" r="52" fill="${i % 2 ? '#e3c57c' : '#d8b86c'}" stroke="#b48a3c" stroke-width=".8"/>`),
        `</g>`,
        mxTortilla(p, 100, 98, 104, 0, { seed: 1 }),
        // one tortilla folded in half, leaning on the stack
        `<g ${p.sh(1.2)}><path d="M128,116 A42,42 0 0 1 150,166 Q122,156 112,136 Q116,122 128,116Z" fill="${p.g('#ecd28a', .25, .25)}" stroke="#b98a3c" stroke-width=".8"/></g>`,
        `<path d="M128,116 Q122,146 150,166" stroke="#f6e8b6" stroke-width="1.6" fill="none" opacity=".8"/>`,
        `<g ${mxBlur(p, 1.2)}><ellipse cx="136" cy="140" rx="4" ry="2.6" fill="#b06a24" opacity=".6"/><ellipse cx="128" cy="150" rx="3" ry="2" fill="#8a4a1a" opacity=".5"/><ellipse cx="142" cy="156" rx="2.6" ry="1.8" fill="#b06a24" opacity=".5"/></g>`,
    ].join(''),

    // Tinga de pollo: Talavera plate, three tostadas piled with smoky red shredded chicken, crema, queso fresco and onion
    mx_tinga: p => {
        const tos = [[70, 78, 1], [128, 86, 2], [96, 132, 3]];
        return [
            mxTalavera(p),
            ...tos.map(([x, y, s]) => mxTortilla(p, x, y, 66, s * 40, { seed: s, c: '#e9c25a', edge: '#a8762a', crisp: true })),
            ...tos.map(([x, y, s]) => `<g ${p.sh(.9)}><path ${T(x, y)} d="${mxSm(ring(25, 11, .18, rng(p.id + 'tg' + s), 1.05, .9), true)}" fill="${p.rg('#a84a26', .2, .3)}"/></g>`),
            ...tos.map(([x, y, s]) => mxShreds(p, x, y, 50, { c: '#c0582c', n: 20, w: 2.2, len: .4, seed: s, curve: .5 })),
            ...tos.map(([x, y, s]) => mxShreds(p, x, y, 40, { c: '#d98a52', n: 10, w: 1.8, len: .3, seed: s + 7, curve: .5 })),
            ...tos.map(([x, y, s]) => mxCrema(p, x, y, 34, 14, s * 30 - 40, 4)),
            ...tos.map(([x, y, s]) => mxQueso(p, x, y, 44, { n: 14, seed: s })),
            mxSliver(p, 66, 70, 18, 20), mxSliver(p, 80, 86, 16, -60), mxSliver(p, 134, 80, 18, 50), mxSliver(p, 122, 96, 16, -20), mxSliver(p, 100, 124, 18, 80), mxSliver(p, 92, 140, 15, 10),
            mxCilantro(p, 82, 74, 10, 20), mxCilantro(p, 132, 92, 10, -40), mxCilantro(p, 102, 136, 10, 60),
        ].join('');
    },

    // Picadillo: clay cazuela, tomato-red ground beef with potato and carrot dice and peas
    mx_picadillo: p => {
        const sp = mxSpots('pic', 20, 54, 14);
        return [
            mxCazuela(p, { R: 86 }),
            K.liquid(p, { R: 74, c: '#a04a26', op: 1, shine: false }),
            `<g ${p.sh(.6)}><g ${p.rough(3, .12)}><path d="${mxSm(ring(66, 14, .12, rng(p.id + 'mass'), 1, 1), true)}" transform="translate(100 100)" fill="${p.rg('#8a4426', .15, .25)}"/></g></g>`,
            mxGrains(p, 100, 100, 132, { cols: ['#6e3a1f', '#93573a', '#5a2e17', '#a8623c'], n: 170, size: 3, seed: 1 }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => i % 3 === 2 ? mxDice(p, x, y, 11, r, '#ef8a34') : mxDice(p, x, y, 15, r, '#ecc86e')).join(''),
            `</g>`,
            mxGrains(p, 100, 100, 124, { cols: ['#d8442c'], n: 16, size: 2.4, seed: 3 }),
            mxPeas(p, 100, 100, 118, { n: 16, seed: 1 }),
            mxShine(100, 100, 72, .3),
        ].join('');
    },

    // Bistec a la mexicana: clay plate, seared beef strips in a chunky tomato, onion and serrano sauce
    mx_bistec: p => {
        const sp = mxSpots('bis', 11, 50, 20);
        return [
            mxClayPlate(p, { glaze: '#7a3e1c' }),
            K.pool(p, 100, 102, 140, '#b8452a', { op: .95, seed: 2, sy: .96 }),
            `<circle cx="96" cy="94" r="44" fill="#d0583a" opacity=".3"/>`,
            `<g ${p.sh(.9)}>`,
            sp.map(([x, y, r], i) => mxBeef(p, x, y, 40 - (i % 3) * 3, r, { seed: i, c: i % 2 ? '#6e3a1c' : '#7c4422' })).join(''),
            mxTomPiece(p, 76, 70, 20, 10, { seed: 1 }), mxTomPiece(p, 136, 92, 20, -30, { seed: 2 }), mxTomPiece(p, 92, 134, 19, 40, { seed: 3 }), mxTomPiece(p, 122, 128, 18, 80, { seed: 4 }), mxTomPiece(p, 60, 108, 18, -60, { seed: 5 }), mxTomPiece(p, 108, 66, 17, 120, { seed: 6 }),
            `</g>`,
            mxSliver(p, 100, 100, 20, 30, { c: '#f0dfb0' }), mxSliver(p, 80, 92, 18, -40, { c: '#f0dfb0' }), mxSliver(p, 124, 110, 18, 100, { c: '#f0dfb0' }), mxSliver(p, 70, 128, 16, 60, { c: '#f0dfb0' }), mxSliver(p, 130, 70, 16, -10, { c: '#f0dfb0' }), mxSliver(p, 106, 146, 16, 20, { c: '#f0dfb0' }),
            mxRings(p, 100, 100, 110, { n: 14, seed: 2, c: '#4f9a2c', rr: 2.2 }),
            mxBits(p, 100, 100, 112, { n: 14, seed: 3 }),
        ].join('');
    },

    // Carne de puerco en salsa verde: cazuela, browned pork cubes and potato in bright tomatillo salsa, cilantro
    mx_puerco_verde: p => {
        const sp = mxSpots('pv', 9, 50, 24);
        return [
            mxCazuela(p, { R: 86, glaze: '#5e3214' }),
            K.liquid(p, { R: 74, c: '#7a9a2e', op: 1, shine: false }),
            `<circle cx="96" cy="94" r="48" fill="#9ab84a" opacity=".3"/>`,
            mxGrains(p, 100, 100, 130, { cols: ['#5f7f22', '#8aa83c'], n: 60, size: 1.8, seed: 2 }),
            `<g ${p.sh(.9)}>`,
            sp.map(([x, y, r], i) => mxChunk(p, x, y, 27 - (i % 3) * 2, r, { c: i % 2 ? '#94582e' : '#a5683a', seed: i })).join(''),
            K.potato(p, 70, 126, 21, 20, { c: '#e9cf86', seed: 1 }), K.potato(p, 132, 76, 21, -40, { c: '#e9cf86', seed: 2 }), K.potato(p, 110, 138, 19, 70, { c: '#e9cf86', seed: 3 }),
            `</g>`,
            `<path d="M70,90 q10,6 20,0 M112,74 q8,6 18,2 M104,124 q10,6 22,0" stroke="#86a438" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`,
            mxSliver(p, 88, 86, 16, 30, { c: '#f3ecdc' }), mxSliver(p, 124, 112, 15, -50, { c: '#f3ecdc' }),
            mxRings(p, 100, 100, 100, { n: 8, seed: 4, c: '#3f8a2c', rr: 2 }),
            mxCilantro(p, 100, 100, 13, 20), mxCilantro(p, 72, 80, 12, -50), mxCilantro(p, 130, 130, 12, 70), mxCilantro(p, 126, 84, 11, 120), mxCilantro(p, 78, 134, 11, -10), mxCilantro(p, 100, 62, 10, 40), mxCilantro(p, 56, 104, 10, 90),
            mxShine(100, 100, 72, .35),
        ].join('');
    },

    // Pescado a la veracruzana: white oval dish, fish fillets under a chunky tomato sauce with green olives, capers, guero chilies and bay
    mx_veracruzana: p => [
        K.ovalDish(p, { rim: '#1f4e9c' }),
        `<path d="${mxSm([[32, 96], [56, 52], [108, 42], [158, 58], [172, 104], [150, 146], [100, 158], [50, 146], [30, 120]], true)}" fill="${p.rg('#c9452a', .18, .3, .42, .4)}"/>`,
        mxGrains(p, 100, 100, 150, { cols: ['#b23a22', '#e0603e'], n: 50, size: 2.4, seed: 5, sy: .75 }),
        mxFillet(p, 78, 86, 92, 50, -14, { seed: 1 }),
        mxFillet(p, 122, 116, 94, 50, -14, { seed: 2 }),
        `<path d="${mxSm([[60, 92], [80, 80], [100, 88], [96, 100], [72, 104]], true)}" fill="#c9452a" opacity=".85"/><path d="${mxSm([[108, 116], [130, 106], [146, 116], [132, 128], [112, 128]], true)}" fill="#c9452a" opacity=".85"/>`,
        `<g ${p.sh(.6)}>`,
        mxTomPiece(p, 70, 90, 18, 20, { seed: 1, c: '#d9432c' }), mxTomPiece(p, 130, 92, 18, -40, { seed: 2, c: '#d9432c' }), mxTomPiece(p, 100, 130, 17, 60, { seed: 3, c: '#d9432c' }), mxTomPiece(p, 110, 76, 16, 100, { seed: 4, c: '#d9432c' }),
        `</g>`,
        mxSliver(p, 90, 104, 18, 20, { c: '#f1e2c0' }), mxSliver(p, 126, 120, 16, -60, { c: '#f1e2c0' }), mxSliver(p, 66, 118, 15, 70, { c: '#f1e2c0' }), mxSliver(p, 112, 96, 14, 120, { c: '#f1e2c0' }),
        mxOlive(p, 84, 80, 13, 20), mxOlive(p, 118, 110, 13, -30), mxOlive(p, 96, 112, 12, 60), mxOlive(p, 138, 128, 12, 10), mxOlive(p, 64, 104, 12, -70), mxOlive(p, 128, 76, 11, 40), mxOlive(p, 104, 142, 11, 90), mxOlive(p, 76, 136, 11, 0),
        mxGrains(p, 100, 104, 100, { cols: ['#4f6a28', '#6a8a34'], n: 12, size: 1.5, seed: 6 }),
        mxChili(p, 146, 100, 22, -70, { c: '#d9d06a', bend: 3 }), mxChili(p, 58, 84, 20, 30, { c: '#d9d06a', bend: 3 }),
        `<g ${p.sh(.5)}><path ${T(114, 130, -25)} d="M-15,0 Q0,-7 15,0 Q0,7 -15,0Z" fill="${p.g('#5b6b2c', .25, .25)}" stroke="#3a4718" stroke-width=".6"/></g><path ${T(114, 130, -25)} d="M-13,0 L13,0" stroke="#8a9a52" stroke-width=".7"/>`,
        mxShine(100, 104, 60, .3),
    ].join(''),

    // Huevos a la mexicana: Talavera plate, soft scrambled eggs flecked with tomato, onion and serrano, refried beans with queso fresco beside
    mx_huevos: p => {
        const R = rng(p.id + 'hv');
        const curds = Array.from({ length: 16 }, (_, i) => { const a = R() * 6.28, d = Math.sqrt(R()) * 34; return [78 + Math.cos(a) * d, 96 + Math.sin(a) * d * .95, R() * 360, 16 + R() * 10, i]; });
        return [
            mxTalavera(p),
            // beans
            `<g ${p.sh(1)}><path ${T(140, 108)} d="${mxSm(ring(27, 10, .14, R, 1, 1.1), true)}" fill="${p.rg('#6b4028', .2, .3, .4, .36)}" stroke="#4a2a18" stroke-width=".6"/></g>`,
            `<path d="M126,96 Q140,88 152,98 M128,114 Q142,106 154,116" stroke="#8a5a3c" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`,
            mxQueso(p, 140, 108, 36, { n: 14, seed: 2 }),
            // eggs
            `<g ${p.sh(.9)}><path ${T(78, 96)} d="${mxSm(ring(40, 12, .14, R, 1, 1), true)}" fill="${p.rg('#f2c43c', .25, .25, .4, .36)}"/></g>`,
            `<g ${p.sh(.6)}>`,
            curds.map(([x, y, r, s, i]) => `<path ${T(x, y, r)} d="${mxSm(ring(s / 2, 8, .42, rng(p.id + 'cd' + i), 1.2, .85), true)}" fill="${p.g(i % 3 ? '#f8d34c' : '#fbe27a', .35, .18)}" stroke="#d8a42a" stroke-width=".5"/>`).join(''),
            `</g>`,
            mxTomDice(p, 66, 82, 8, 20), mxTomDice(p, 92, 90, 8, -30), mxTomDice(p, 74, 112, 8, 60), mxTomDice(p, 100, 116, 7, 10), mxTomDice(p, 56, 100, 7, 80), mxTomDice(p, 86, 68, 7, -60), mxTomDice(p, 108, 100, 7, 40),
            mxBits(p, 78, 96, 70, { n: 12, seed: 2, cols: ['#f7f1e2', '#f1ead8'] }),
            mxRings(p, 78, 96, 66, { n: 9, seed: 5, c: '#3f8a2c', rr: 1.8 }),
            mxCilantro(p, 96, 76, 9, 30), mxCilantro(p, 62, 118, 9, -50),
            `<path d="M52,88 Q58,72 74,66" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".5"/>`,
        ].join('');
    },

    // Enfrijoladas: plate with a green rim, four tortillas folded in quarters bathed in dark bean sauce, crema, queso fresco and onion rings
    mx_enfrijoladas: p => [
        mxTalavera(p, { blue: '#2f7a4a', accent: '#d8a03a' }),
        K.pool(p, 100, 104, 136, '#5a3a36', { op: .95, seed: 3, sy: .92 }),
        `<g ${p.sh(.7)}>`,
        mxFold(p, 50, 62, 104, 12), mxFold(p, 146, 60, 104, 100),
        `</g>`,
        mxFold(p, 72, 96, 100, 18, { c: '#835a4a' }), mxFold(p, 140, 112, 96, 112, { c: '#7e5648' }),
        `<path d="M72,96 Q90,80 108,96 M94,118 Q108,104 128,112" stroke="#4a2e2a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`,
        `<g ${p.sh(.5)}><path d="M74,92 C84,84 96,96 108,88 C118,82 126,90 128,96" stroke="#fbf8ee" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M82,116 C92,108 104,120 118,112" stroke="#fbf8ee" stroke-width="3.6" fill="none" stroke-linecap="round"/></g>`,
        mxQueso(p, 100, 100, 96, { n: 22, seed: 1, size: 2.6 }),
        mxSliver(p, 86, 82, 18, 10), mxSliver(p, 120, 108, 16, -30), mxSliver(p, 96, 128, 15, 40), mxSliver(p, 124, 78, 14, 70),
        mxCilantro(p, 112, 94, 10, 20), mxCilantro(p, 78, 112, 10, -60),
    ].join(''),

    // Arroz rojo: Talavera bowl, orange-red tomato rice with peas and carrot dice, a whole serrano on top
    mx_arroz: p => [
        mxTalaveraBowl(p),
        mxRice(p, 100, 100, 150, { tint: '#e49040', density: .95, grain: 3.8, hiK: .45 }),
        `<g ${p.sh(.5)}>`,
        ...mxSpots('ar', 12, 58, 14).map(([x, y, r]) => mxDice(p, x, y, 8, r, '#ef8a34')),
        `</g>`,
        mxPeas(p, 100, 100, 124, { n: 22, seed: 2, sz: 2.8 }),
        mxChili(p, 100, 92, 40, -30, { c: '#3f8a2c', bend: 5 }),
        `<path d="M50,84 Q58,60 84,50" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".4"/>`,
    ].join(''),

    // Frijoles refritos: small cazuela, creamy mashed beans swirled flat, queso fresco and totopos tucked in
    mx_frijoles: p => {
        const R = rng(p.id + 'fr');
        let swirl = '';
        for (let i = 0; i < 5; i++){ const rr = 16 + i * 10; swirl += `<path d="M${f(100 - rr)},${f(102 + (R() - .5) * 4)} A${rr},${f(rr * .9)} 0 0 1 ${f(100 + rr * .7)},${f(102 - rr * .6)}" stroke="#9a6a4a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/><path d="M${f(100 - rr * .9)},${f(104 + (R() - .5) * 4)} A${rr},${f(rr * .9)} 0 0 1 ${f(100 + rr * .6)},${f(104 - rr * .6)}" stroke="#4e2e1c" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".4" transform="translate(1.2 1.6)"/>`; }
        return [
            mxCazuela(p, { R: 86, glaze: '#5e3214' }),
            `<g ${p.sh(1)}><path ${T(100, 101)} d="${mxSm(ring(70, 14, .08, R, 1, 1), true)}" fill="${p.rg('#74462c', .22, .3, .4, .36)}" stroke="#4a2a18" stroke-width=".6"/></g>`,
            swirl,
            `<circle cx="92" cy="92" r="38" fill="#8a5a3c" opacity=".25"/>`,
            `<g ${p.sh(1)}>`, mxTotopo(p, 134, 66, 32, 40, { seed: 1 }), mxTotopo(p, 150, 92, 30, 80, { seed: 2 }), mxTotopo(p, 62, 134, 30, -140, { seed: 3 }), `</g>`,
            mxQueso(p, 96, 104, 100, { n: 40, seed: 3, size: 2.6 }),
            mxBits(p, 100, 100, 100, { n: 8, seed: 6 }),
            mxShine(100, 100, 66, .35),
        ].join('');
    },

    // Ensalada de nopales: Talavera bowl, olive-green nopal strips with tomato, white onion, cilantro, queso fresco, a lime wedge
    mx_nopales: p => {
        const sp = mxSpots('nop', 28, 60, 12);
        return [
            mxTalaveraBowl(p, { blue: '#1f4e9c' }),
            `<circle cx="100" cy="100" r="72" fill="#c9d8a0" opacity=".5"/>`,
            `<g ${p.sh(.6)}>`,
            sp.map(([x, y, r], i) => mxNopal(p, x, y, 20 + (i % 3) * 3, 7, r, { c: i % 2 ? '#6f8f3a' : '#7f9c44' })).join(''),
            sp.slice(0, 12).map(([x, y, r]) => mxTomDice(p, x + 3, y + 3, 9, r + 40)).join(''),
            sp.slice(12, 24).map(([x, y, r]) => mxDice(p, x - 3, y + 2, 7, r + 20, '#f6f0e2')).join(''),
            `</g>`,
            mxBits(p, 100, 100, 120, { n: 24, seed: 2 }),
            mxQueso(p, 100, 100, 110, { n: 20, seed: 4 }),
            mxLime(p, 146, 74, 24, -30),
        ].join('');
    },

    // Calabacitas a la mexicana: cazuela, soft zucchini dice with corn, tomato and cubes of queso fresco
    mx_calabacitas: p => {
        const sp = mxSpots('cal', 40, 62, 10.5);
        return [
            mxCazuela(p, { R: 86 }),
            K.liquid(p, { R: 74, c: '#c4b06a', op: .95, shine: false }),
            `<g ${p.sh(.6)}>`,
            sp.map(([x, y, r], i) => i % 4 === 3 ? mxTomDice(p, x, y, 9, r) : i % 4 === 2 ? mxDice(p, x, y, 10, r, '#f6f0e2') : mxDice(p, x, y, 12, r, '#d8dc98', { skin: '#4a7a2e' })).join(''),
            `</g>`,
            K.corn(p, 100, 100, 118, { n: 28 }),
            mxSliver(p, 84, 90, 14, 20, { c: '#efe2b8' }), mxSliver(p, 120, 116, 14, -60, { c: '#efe2b8' }),
            mxRings(p, 100, 100, 100, { n: 6, seed: 3, c: '#3f8a2c', rr: 1.8 }),
            mxShine(100, 100, 72, .3),
        ].join('');
    },

    // Guacamole: molcajete, chunky green guacamole with tomato, onion and cilantro, lime wedge and totopos
    mx_guacamole: p => {
        const R = rng(p.id + 'gu');
        return [
            mxMolcajete(p),
            `<g ${p.sh(.9)}><path ${T(100, 100)} d="${mxSm(ring(64, 14, .1, R, 1, 1), true)}" fill="${p.rg('#8fb04a', .22, .3, .4, .36)}" stroke="#5a7a28" stroke-width=".6"/></g>`,
            mxGrains(p, 100, 100, 120, { cols: ['#a9c45c', '#7a9a38', '#c0d47a', '#6a8a2e'], n: 80, size: 3.8, seed: 1 }),
            `<path d="M66,96 Q80,84 98,92 M80,118 Q96,110 116,118 M104,74 Q118,72 128,84" stroke="#dce89c" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
            `<g ${p.sh(.5)}>`,
            ...mxSpots('gt', 10, 50, 16).map(([x, y, r]) => mxTomDice(p, x, y, 8, r)),
            ...mxSpots('go', 10, 52, 14, 104, 96).map(([x, y, r]) => mxDice(p, x, y, 6, r, '#f6f0e2')),
            `</g>`,
            mxBits(p, 100, 100, 110, { n: 20, seed: 3 }),
            mxCilantro(p, 92, 88, 11, 20), mxCilantro(p, 116, 112, 11, -50), mxCilantro(p, 76, 118, 10, 70),
            `<g ${p.sh(1)}>`, mxTotopo(p, 144, 72, 32, 50, { seed: 1 }), mxTotopo(p, 156, 100, 30, 95, { seed: 2 }), `</g>`,
            mxLime(p, 60, 136, 24, 150),
            mxShine(100, 100, 60, .3),
        ].join('');
    },

    // Pico de gallo: green-patterned Talavera bowl, diced tomato and white onion with serrano, cilantro and a lime wedge
    mx_pico: p => {
        const sp = mxSpots('pg', 48, 64, 10.4);
        return [
            mxTalaveraBowl(p, { blue: '#2f7a4a', accent: '#d8a03a' }),
            `<circle cx="100" cy="100" r="74" fill="#efc2a8" opacity=".6"/>`,
            `<g ${p.sh(.5)}>`,
            sp.map(([x, y, r], i) => i % 3 === 1 ? mxDice(p, x, y, 8.5, r, '#f7f2e6') : i % 6 === 5 ? mxDice(p, x, y, 7.5, r, '#4f9a34') : mxTomDice(p, x, y, 10, r)).join(''),
            `</g>`,
            mxBits(p, 100, 100, 128, { n: 34, seed: 2 }),
            mxLime(p, 144, 128, 24, 20),
            mxShine(100, 100, 70, .4),
        ].join('');
    },

    // Rajas con crema: cazuela, dark roasted poblano strips and onion in ivory cream with corn and melting cheese
    mx_rajas: p => {
        const sp = mxSpots('raj', 18, 56, 15);
        return [
            mxCazuela(p, { R: 86, glaze: '#6e3d18' }),
            K.liquid(p, { R: 74, c: '#ece0bc', op: 1, shine: false }),
            `<circle cx="96" cy="94" r="50" fill="#f6eed6" opacity=".5"/>`,
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => mxRaja(p, x, y, 32 + (i % 3) * 4, 8, r, { c: i % 2 ? '#3c6b2c' : '#466f30' })).join(''),
            `</g>`,
            mxSliver(p, 90, 90, 20, 30, { c: '#f0dfb0' }), mxSliver(p, 118, 112, 18, -50, { c: '#f0dfb0' }), mxSliver(p, 72, 118, 16, 80, { c: '#f0dfb0' }), mxSliver(p, 126, 76, 16, 10, { c: '#f0dfb0' }), mxSliver(p, 104, 134, 15, 120, { c: '#f0dfb0' }),
            K.corn(p, 100, 100, 110, { n: 18 }),
            `<path d="M70,80 Q86,70 100,84 Q112,96 130,88" stroke="#f8f2dc" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".85"/><path d="M78,124 Q96,112 118,126" stroke="#f8f2dc" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`,
            mxShine(100, 100, 72, .4),
        ].join('');
    },

    // Sopa de fideo: Talavera bowl, red tomato broth full of thin toasted noodles, lime wedge and cilantro
    mx_fideo: p => [
        mxTalaveraBowl(p),
        K.liquid(p, { R: 74, c: '#d4552c', op: 1 }),
        `<circle cx="94" cy="92" r="46" fill="#e8734a" opacity=".35"/>`,
        mxNoodles(p, 100, 100, 130, { c: '#e2b060', w: 1.5, n: 48, seed: 1, outline: '#a86a2a', hi: .3 }),
        mxNoodles(p, 100, 102, 100, { c: '#e8bc6c', w: 1.5, n: 16, seed: 2, outline: '#a86a2a', hi: .3 }),
        `<circle cx="100" cy="100" r="72" fill="#c8482a" opacity=".16"/>`,
        mxBits(p, 100, 100, 100, { n: 10, seed: 4 }),
        mxLime(p, 142, 72, 24, -40),
        mxShine(100, 100, 72, .4),
    ].join(''),

    // Caldo de pollo: big clay bowl, clear golden broth with a drumstick, carrot, potato and zucchini, cilantro and lime
    mx_caldo: p => [
        K.bowl(p, { R: 94, glaze: '#b4663a', inside: '#f3e8d2' }),
        K.liquid(p, { R: 76, c: '#e6c25c', op: .96 }),
        `<circle cx="94" cy="92" r="48" fill="#f4dc86" opacity=".4"/>`,
        `<g ${p.sh(.8)}>`,
        K.potato(p, 68, 84, 32, 20, { c: '#ecd08a', seed: 1 }), K.potato(p, 124, 134, 30, -30, { c: '#ecd08a', seed: 2 }),
        K.carrotRound(p, 134, 80, 18), K.carrotRound(p, 72, 128, 17), K.carrotRound(p, 104, 142, 15), K.carrotRound(p, 146, 110, 14),
        mxDice(p, 94, 70, 18, 20, '#d8dc98', { skin: '#4a7a2e' }), mxDice(p, 60, 108, 17, -30, '#d8dc98', { skin: '#4a7a2e' }), mxDice(p, 118, 106, 16, 60, '#d8dc98', { skin: '#4a7a2e' }),
        mxDrum(p, 100, 104, 84, -20, { c: '#d8a456' }),
        `</g>`,
        `<circle cx="100" cy="100" r="74" fill="#e6c25c" opacity=".14"/>`,
        mxBits(p, 100, 100, 110, { n: 10, seed: 5, cols: ['#f7f1e2'] }),
        mxCilantro(p, 80, 100, 13, 30), mxCilantro(p, 126, 90, 12, -40), mxCilantro(p, 108, 124, 11, 80), mxCilantro(p, 88, 140, 10, 10),
        mxLime(p, 150, 136, 24, 40),
        mxShine(100, 100, 74, .4),
    ].join(''),
};
