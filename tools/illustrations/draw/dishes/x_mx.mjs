// Mexico, hand-drawn set 2 (mains, sides, soups) — helpers copied from w_mx.mjs with the xmx prefix
import * as K from '../kit.mjs';

const { T, f, rng, ring, lt, dk, mix, smooth } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// Local helpers (mx = Mexico)
// =========================================================
function xmxSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function xmxOl(p, c, r = .55){
    const id = p.def('xmxOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const xmxBlur = (p, s = 2) => `filter="url(#${p.def('mxbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const xmxShine = (cx, cy, R, op = .35, w = 1.8) => `<path d="M${f(cx - R * .55)},${f(cy + R * .1)} A${f(R * .6)},${f(R * .6)} 0 0 1 ${f(cx - R * .05)},${f(cy - R * .52)}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
const xmxArc = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// rice mound (grains as short strokes) — arroz rojo uses an orange tint
function xmxRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xmxRice' + seed + x + y);
    const shape = xmxSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('xmxRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
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
function xmxGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xmxGr' + seed + x + y);
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
function xmxShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'xmxSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? xmxOl(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// thin noodles (fideo) in one path
function xmxNoodles(p, x, y, s, { c = '#d9b06a', w = 1.6, n = 60, seed = 1, sy = .9, outline = null, hi = .35 } = {}){
    const R = rng(p.id + 'xmxNd' + seed);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.15 + R() * .82), a0 = R() * 6.28, sweep = 1 + R() * 2.2;
        const cx = x + (R() - .5) * s * .14, cy = y + (R() - .5) * s * .14;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .3); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = xmxSm(pts);
        d += one; if (R() < hi) dl += one;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.8)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="${outline || dk(c, .25)}" stroke-width="${f(w + .9)}"/><use href="#${id}" stroke="${c}" stroke-width="${w}"/></g><path d="${dl}" stroke="${lt(c, .4)}" stroke-width="${f(w * .5)}" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// dice (rounded cube from above), optional skin band
function xmxDice(p, x, y, s, r = 0, c = '#ef7f30', { skin = null, op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f(h * .5)}" width="${s}" height="${f(s * .22)}" rx="${f(s * .1)}" fill="${skin}"/>` : ''}
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// evenly spread positions
function xmxSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xmxspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// cilantro leaf (3-lobed, scalloped)
function xmxCilantro(p, x, y, s, r = 0, { c = '#3f8a2c' } = {}){
    const d = 'M0,8 C-1,5 -2,3 -3,2 C-7,4 -10,1 -8,-2 C-10,-5 -6,-8 -3,-6 C-3,-10 3,-10 3,-6 C6,-8 10,-5 8,-2 C10,1 7,4 3,2 C2,3 1,5 0,8Z';
    return `<g ${T(x, y, r, s / 20)}><path d="${d}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M0,7 L0,-6 M0,0 L-6,-3 M0,0 L6,-3" stroke="${lt(c, .4)}" stroke-width=".6" fill="none"/></g>`;
}
// chopped cilantro / onion bits scattered
function xmxBits(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'], sy = 1 } = {}){
    const R = rng(p.id + 'xmxBt' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 1 + R();
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R(), r2 = rr * (.6 + R() * .6); return `${f1(cx + Math.cos(aa) * r2)},${f1(cy + Math.sin(aa) * r2)}`; });
        ds[i % cols.length] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// crumbled queso fresco (white crumbs with a soft grey outline)
function xmxQueso(p, x, y, s, { n = 24, seed = 1, size = 2.2, sy = 1 } = {}){
    return `<g ${xmxOl(p, '#cdbfa4', .5)}>${xmxGrains(p, x, y, s, { cols: ['#fdfbf4', '#f3ecdc'], n, size, seed, sy })}</g>`;
}
// small green rings (sliced serrano / scallion)
function xmxRings(p, x, y, s, { n = 10, seed = 1, c = '#4f9a2c', rr = 1.9 } = {}){
    const R = rng(p.id + 'xmxRg' + seed + x + y);
    let d = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd; const seg = `M${f1(cx - rr)},${f1(cy)}a${rr},${f1(rr * .9)} 0 1 0 ${f1(rr * 2)},0a${rr},${f1(rr * .9)} 0 1 0 -${f1(rr * 2)},0`; if (R() < .6) d += seg; else d2 += seg; }
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.3"/><path d="${d2}" fill="none" stroke="${lt(c, .3)}" stroke-width="1.3"/>`;
}
// translucent onion sliver (raw white or cooked gold)
function xmxSliver(p, x, y, s, r = 0, { c = '#f3ecdc', span = 1.6, w = null } = {}){
    const R0 = s / 2, a0 = -Math.PI / 2 - span / 2, a1 = a0 + span, sw = w || s * .13;
    const d = `M${f1(Math.cos(a0) * R0)},${f1(Math.sin(a0) * R0)}A${f1(R0)},${f1(R0 * .85)} 0 0 1 ${f1(Math.cos(a1) * R0)},${f1(Math.sin(a1) * R0)}`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(sw + .8)}" fill="none" stroke-linecap="round" opacity=".5"/><path d="${d}" stroke="${c}" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round" opacity=".92"/><path d="${d}" stroke="#fff" stroke-width="${f1(sw * .3)}" fill="none" stroke-linecap="round" opacity=".8" transform="translate(-.3 -.4)"/></g>`;
}
// raw onion ring (thin, white with a purple-grey edge)
function xmxOnionRing(p, x, y, s, r = 0, { c = '#f6f0e6', edge = '#b9a4a6' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .4)}" fill="none" stroke="${edge}" stroke-width="3"/><ellipse rx="${f1(s / 2)}" ry="${f1(s * .4)}" fill="none" stroke="${c}" stroke-width="1.8"/></g>`;
}
// lime wedge (green rind, pale green flesh)
const xmxLime = (p, x, y, s, r = 0) => K.lemon(p, x, y, s, r, { c: '#c6e27c', rind: '#3f8f2b' });
// corn tortilla seen from above: pale corn-yellow disc with toasted blisters
function xmxTortilla(p, x, y, s, r = 0, { seed = 1, c = '#edd48e', edge = '#b98a3c', crisp = false } = {}){
    const R = rng(p.id + 'xmxTt' + seed + x + y);
    const pts = ring(s / 2, 16, crisp ? .09 : .05, R);
    let spots = '';
    for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .44; spots += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(s * (.03 + R() * .06))}" ry="${f(s * (.02 + R() * .04))}" transform="rotate(${f(R() * 180)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="${R() < .4 ? '#8a4a1a' : '#c08030'}" opacity="${f(.35 + R() * .4)}"/>`; }
    let dots = '';
    for (let i = 0; i < 10; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .42; dots += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(.5 + R() * .7)}" fill="#6a3410" opacity=".55"/>`; }
    const body = `<path d="${smooth(pts)}" fill="${p.rg(c, .22, .22, .4, .36)}" stroke="${edge}" stroke-width=".7"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}>${crisp ? `<g ${p.crumb(.7)}>${body}</g>` : body}</g><g ${xmxBlur(p, 1.3)}>${spots}</g>${dots}
        <path d="M${f(-s * .32)},${f(-s * .16)} Q${f(-s * .12)},${f(-s * .36)} ${f(s * .16)},${f(-s * .32)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// tortilla chip (totopo): triangle with toasted patches and salt
function xmxTotopo(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xmxTp' + seed + x + y);
    const d = `M${f(-s / 2)},${f(s * .36)} Q0,${f(s * .44)} ${f(s / 2)},${f(s * .36)} Q${f(s * .1)},${f(-s * .1)} ${f(s * .06)},${f(-s * .5)} Q0,${f(-s * .56)} ${f(-s * .06)},${f(-s * .5)} Q${f(-s * .1)},${f(-s * .1)} ${f(-s / 2)},${f(s * .36)}Z`;
    let sp = '';
    for (let i = 0; i < 4; i++) sp += `<ellipse cx="${f((R() - .5) * s * .4)}" cy="${f((R() - .4) * s * .5)}" rx="${f(1.4 + R() * 2.6)}" ry="${f(1 + R() * 1.4)}" fill="#b8742a" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.g('#f0c95e', .3, .3)}" stroke="#b07a26" stroke-width=".7"/></g><g ${xmxBlur(p, .9)}>${sp}</g>
        <path d="M${f(-s * .3)},${f(s * .2)} L${f(-s * .02)},${f(-s * .3)}" stroke="#fff6d6" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>
        <circle cx="${f(s * .12)}" cy="${f(s * .1)}" r=".7" fill="#fff"/><circle cx="${f(-s * .14)}" cy="${f(s * .22)}" r=".6" fill="#fff"/></g>`;
}
// tortilla folded in quarters and coated in sauce (enfrijolada)
function xmxFold(p, x, y, s, r = 0, { c = '#7a5244', edge = '#ecd286' } = {}){
    const q = `M0,0 L${f(s / 2)},0 A${f(s / 2)},${f(s / 2)} 0 0 1 0,${f(s / 2)}Z`;
    const arc = k => `M${f(s / 2 * k)},0 A${f(s / 2 * k)},${f(s / 2 * k)} 0 0 1 0,${f(s / 2 * k)}`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${q}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="${arc(.97)}" stroke="${edge}" stroke-width="2.4" fill="none" opacity=".9"/><path d="${arc(.88)}" stroke="${edge}" stroke-width="1.2" fill="none" opacity=".55"/>
        <path d="M2.4,2.4 L${f(s * .42)},2.4 M2.4,2.4 L2.4,${f(s * .42)}" stroke="${lt(c, .3)}" stroke-width="1" fill="none" opacity=".5"/>
        <path d="M${f(s * .14)},${f(s * .12)} Q${f(s * .3)},${f(s * .1)} ${f(s * .38)},${f(s * .2)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// chicken drumstick, bone to the right
function xmxDrum(p, x, y, s, r = 0, { c = '#d9a95c' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#efe2c6', .3, .25)}" stroke="#b39a6c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="M-14,4 Q-6,10 4,7" stroke="${dk(c, .35)}" stroke-width="1.4" fill="none" opacity=".4"/>
        ${xmxArc('M-16,-5 Q-10,-11 -2,-9.5', 2.2, .75)}${xmxArc('M2,-6 Q7,-4.5 11,-3', 1.2, .5)}</g>`;
}
// browned meat chunk (pork cubes, beef pieces) with optional sauce film
function xmxChunk(p, x, y, s, r = 0, { c = '#a06a3c', sauce = null, seed = 1, sy = .85 } = {}){
    const R = rng(p.id + 'xmxCk' + seed + x + y);
    const pts = ring(s / 2, 7, .34, R, 1.15, sy);
    let marks = '';
    for (let i = 0; i < 3; i++) marks += `<ellipse cx="${f((R() - .5) * s * .5)}" cy="${f((R() - .5) * s * .4)}" rx="${f(s * .08 + R() * s * .1)}" ry="${f(s * .05 + R() * s * .05)}" fill="${dk(c, .5)}" opacity="${f(.22 + R() * .22)}"/>`;
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .6)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .38)}" stroke-width=".7"/>${marks}
        ${sauce ? `<path d="${smooth(pts.map(([a, b]) => [a * .9 + s * .05, b * .86 + s * .08]), true, .6)}" fill="${sauce}" opacity=".55"/>` : ''}
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .05)},${f(-s * .38)} ${f(s * .2)},${f(-s * .28)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// thin beef steak strip, seared (bistec)
function xmxBeef(p, x, y, s, r = 0, { c = '#6e3a1c', seed = 1 } = {}){
    const R = rng(p.id + 'xmxBf' + seed + x + y);
    const k = s / 30;
    const folds = Array.from({ length: 3 }, (_, i) => { const fx = -8 + i * 8 + (R() - .5) * 4; return `M${f1(fx)},${f1(-6 + R() * 2)} q${f1((R() - .5) * 5)},6 ${f1((R() - .5) * 3)},${f1(11 + R() * 2)}`; }).join('');
    return `<g ${T(x, y, r, k)}><path d="${xmxSm(ring(14, 16, .32, R, 1.1, .62), true)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="${folds}" stroke="${dk(c, .45)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// cooked tomato piece (chunky, in sauce)
function xmxTomPiece(p, x, y, s, r = 0, { seed = 1, c = '#e2412c' } = {}){
    const R = rng(p.id + 'xmxTm' + seed + x + y);
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="${xmxSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="${xmxSm(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true)}" fill="${lt(c, .25)}" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>${xmxArc('M-7,-4 Q-1,-7.5 5,-5.4', 1.2, .6)}</g>`;
}
// fresh tomato dice with a seed face showing
function xmxTomDice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${f(s * .92)}" rx="${f(s * .22)}" fill="${p.g('#e4392b', .3, .25)}" stroke="#a8221a" stroke-width=".55"/>
        <ellipse cx="0" cy="${f(-s * .04)}" rx="${f(s * .24)}" ry="${f(s * .17)}" fill="#f7b24a" opacity=".85"/>
        <path d="M${f(-s * .3)},${f(-s * .3)} L${f(s * .16)},${f(-s * .3)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".7"/></g>`;
}
// green olive stuffed with pimiento
function xmxOlive(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .4)}" fill="${p.rg('#8fa23a', .3, .3, .35, .32)}" stroke="#5a6a1c" stroke-width=".5"/></g>
        <ellipse rx="${f(s * .18)}" ry="${f(s * .14)}" fill="#c93a24"/><ellipse cx="${f(-s * .18)}" cy="${f(-s * .14)}" rx="${f(s * .13)}" ry="${f(s * .06)}" fill="#fff" opacity=".7"/></g>`;
}
// slim chili pod: serrano (green) or guero (pale yellow), stem to the left
function xmxChili(p, x, y, L, r = 0, { c = '#3f8a2c', bend = 3 } = {}){
    const d = `M${f(-L / 2)},0 Q0,${-bend} ${f(L / 2)},${f(bend * .4)}`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .35)}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/><path d="${d}" stroke="${p.g(c, .3, .25)}" stroke-width="5.6" fill="none" stroke-linecap="round"/>
        <path d="M${f(-L / 2)},0 l-4,-1.2" stroke="#6a8a3a" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="${f(-L / 2 + 1)}" cy="0" rx="2.4" ry="3.2" fill="#5a8a30"/>
        <path d="M${f(-L * .34)},-1.6 Q0,${f(-bend - 1.6)} ${f(L * .3)},-1" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// white fish fillet with flake lines
function xmxFillet(p, x, y, w, h, r = 0, { seed = 1, c = '#f3e7d3' } = {}){
    const R = rng(p.id + 'xmxFl' + seed);
    const pts = ring(1, 12, .1, R, w / 2, h / 2).map(([a, b]) => [a, a > 0 ? b * .8 : b]);
    const fl = [-.28, -.08, .12, .32].map(t => `M${f(w * t)},${f(-h * .34)} q${f(w * .06)},${f(h * .3)} ${f(-w * .02)},${f(h * .66)}`).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xmxSm(pts, true)}" fill="${p.g(c, .25, .2)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="${fl}" stroke="${dk(c, .18)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f(-w * .34)},${f(-h * .22)} Q${f(-w * .1)},${f(-h * .4)} ${f(w * .18)},${f(-h * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// nopal strip (olive green, soft, slightly glossy)
function xmxNopal(p, x, y, L, W, r = 0, { c = '#6f8f3a' } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-W / 2)}" width="${L}" height="${W}" rx="${f(W * .4)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f(-L * .36)},${f(-W * .12)} L${f(L * .24)},${f(-W * .14)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/></g>`;
}
// strip of roasted poblano (dark green, glossy, blistered)
function xmxRaja(p, x, y, L, W, r = 0, { c = '#3c6b2c', bend = .18 } = {}){
    const d = `M${f1(-L / 2)},0 Q0,${f1(-L * bend)} ${f1(L / 2)},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .4)}" stroke-width="${f1(W + 1.2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${p.g(c, .28, .22)}" stroke-width="${W}" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-L * .3)},${f1(-L * bend * .55 - W * .18)} Q0,${f1(-L * bend * .9 - W * .2)} ${f1(L * .26)},${f1(-L * bend * .5 - W * .16)}" stroke="${lt(c, .5)}" stroke-width="${f1(Math.max(.9, W * .22))}" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// green peas
function xmxPeas(p, x, y, s, { n = 12, seed = 1, sz = 2.6 } = {}){
    const R = rng(p.id + 'xmxPe' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${sz}" fill="${p.rg('#6db043', .3, .3, .35, .32)}" stroke="#3f7a24" stroke-width=".5"/><circle cx="${f(cx - sz * .3)}" cy="${f(cy - sz * .3)}" r="${f(sz * .3)}" fill="#fff" opacity=".6"/>`; }
    return out;
}
// white crema zigzag
const xmxCrema = (p, x, y, w, h, r = 0, n = 5) => K.drizzle(p, x, y, w, h, { c: '#fbf8ee', width: 2.2, n, r });

// ---------- Mexican vessels ----------
// Talavera-style plate: white with a cobalt blue rim pattern and small yellow dots
function xmxTalavera(p, { R = 94, blue = '#1f4e9c', accent = '#e8b73a', base = '#fbfaf6' } = {}){
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
function xmxTalaveraBowl(p, { R = 92, blue = '#2b5aa6', accent = '#e8b73a', inside = '#fbf9f3' } = {}){
    const n = 18, r0 = R * .87 - 4;
    let pet = '';
    for (let i = 0; i < n; i++){ const a = i / n * 6.28, cx = 100 + Math.cos(a) * r0, cy = 100 + Math.sin(a) * r0; pet += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="3.2" ry="1.7" transform="rotate(${f(a * 57.3)} ${f(cx)} ${f(cy)})" fill="${blue}"/>`; const b = a + 3.14 / n; pet += `<circle cx="${f(100 + Math.cos(b) * r0)}" cy="${f(100 + Math.sin(b) * r0)}" r="1.2" fill="${accent}"/>`; }
    return K.bowl(p, { R, glaze: blue, inside }) + pet + `<circle cx="100" cy="100" r="${f(r0 - 5)}" fill="none" stroke="${blue}" stroke-width=".8" opacity=".6"/>`;
}
// clay cazuela de barro: terracotta with two lugs, glossy brown glaze inside
function xmxCazuela(p, { R = 84, glaze = '#6e3d18', clay = '#b96a3c' } = {}){
    const lug = x => `<rect x="${x - 9}" y="88" width="18" height="24" rx="8" fill="${p.g(clay, .2, .3)}" stroke="${dk(clay, .3)}" stroke-width=".8"/>`;
    return `<g ${p.sh(1.8)}>${lug(100 - R - 2)}${lug(100 + R + 2)}<circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${lt(clay, .3)}" stroke-width="1.4" opacity=".7"/>
        <circle cx="100" cy="100" r="${R - 8}" fill="${p.rg(glaze, .15, .35, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .36} A${R * .8},${R * .8} 0 0 1 ${100 - R * .28},${100 - R * .76}" stroke="#ffe2c8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// flat clay plate (plato de barro)
function xmxClayPlate(p, { R = 92, clay = '#bd6d3c', glaze = '#8e4a22' } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R * .8}" fill="${p.rg(glaze, .16, .3, .62, .64)}"/>
        <circle cx="100" cy="100" r="${R * .8}" fill="none" stroke="${dk(clay, .25)}" stroke-width="1.2" opacity=".6"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#ffe2c8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// molcajete: dark volcanic stone mortar, pitted
function xmxMolcajete(p, { R = 92 } = {}){
    const c = '#4d4a47';
    return `<g ${p.sh(2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .2, .3, .35, .3)}"/></g>
        <g ${p.crumb(.75)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .18, .28, .35, .3)}" opacity=".9"/></g>
        ${K.sprinkle(p, 100, 100, 2 * R - 6, { c: '#7a7672', n: 70, r: .9 })}${K.sprinkle(p, 100, 100, 2 * R - 6, { c: '#2b2927', n: 50, r: .8 })}
        <circle cx="100" cy="100" r="${f(R * .75)}" fill="${p.rg('#3a3735', .1, .22, .6, .62)}"/>
        <circle cx="100" cy="100" r="${f(R * .75)}" fill="none" stroke="#262422" stroke-width="1.2" opacity=".7"/>
        <path d="M${100 - R * .66},${100 - R * .44} A${R * .8},${R * .8} 0 0 1 ${100 - R * .3},${100 - R * .72}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".3"/>`;
}
// woven palm tortilla basket (tortillero)
function xmxBasket(p, { R = 95 } = {}){
    let rings = '';
    for (let i = 0; i < 4; i++){ const rr = R - 3 - i * 5.2; rings += `<circle cx="100" cy="100" r="${rr}" fill="none" stroke="${i % 2 ? '#c49a56' : '#e0bd7c'}" stroke-width="5.4" stroke-dasharray="7 2.4" stroke-dashoffset="${i * 4.5}"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="#b48748"/></g>${rings}
        <circle cx="100" cy="100" r="${R - 21}" fill="${p.rg('#a67a40', .1, .3, .6, .6)}"/>
        <path d="M${100 - R * .7},${100 - R * .36} A${R * .8},${R * .8} 0 0 1 ${100 - R * .3},${100 - R * .72}" stroke="#fff3d8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>`;
}


// =========================================================
// Extra helpers for this set (xmx)
// =========================================================
// enamel (peltre) plate: white with a dark rolled rim — the everyday Mexican kitchen plate
function xmxPeltre(p, { R = 94, rim = '#1d3f7a', base = '#f9f8f3', well = .76 } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 1.6}" fill="none" stroke="${rim}" stroke-width="3.4"/>
        <circle cx="100" cy="100" r="${f(R * well + 2)}" fill="none" stroke="${dk(base, .1)}" stroke-width="2.6" opacity=".5"/>
        <circle cx="100" cy="100" r="${f(R * well)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        ${xmxArc(`M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}`, 3, .85)}`;
}
// enamel (peltre) bowl: coloured outside, white inside, dark rim line
function xmxPeltreBowl(p, { R = 92, out = '#2f6fb0', rim = '#1d3f7a', inside = '#f8f7f2' } = {}){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(out, .25, .25, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 1.4}" fill="none" stroke="${rim}" stroke-width="2.6"/>
        <circle cx="100" cy="100" r="${f(R * .88)}" fill="${p.rg(inside, .12, .28, .64, .66)}"/>
        <circle cx="100" cy="100" r="${f(R * .88)}" fill="none" stroke="${dk(inside, .2)}" stroke-width="1" opacity=".6"/>
        ${xmxArc(`M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}`, 3, .55)}`;
}
// painted barro bowl (Tonalá style): terracotta outside with cream brush dots and leaves, glazed inside
function xmxBarro(p, { R = 92, clay = '#b5612f', inside = '#7a3a18', paint = '#f3e2be' } = {}){
    const n = 16, r0 = R - 7;
    let deco = '';
    for (let i = 0; i < n; i++){ const a = i / n * 6.28, cx = 100 + Math.cos(a) * r0, cy = 100 + Math.sin(a) * r0; deco += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="3.6" ry="1.4" transform="rotate(${f(a * 57.3 + 90)} ${f(cx)} ${f(cy)})" fill="${paint}" opacity=".9"/><circle cx="${f(100 + Math.cos(a + .2) * r0)}" cy="${f(100 + Math.sin(a + .2) * r0)}" r="1" fill="${paint}" opacity=".85"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .2, .3, .35, .3)}"/></g>${deco}
        <circle cx="100" cy="100" r="${f(R * .84)}" fill="${p.rg(inside, .15, .35, .62, .64)}"/>
        <circle cx="100" cy="100" r="${f(R * .84)}" fill="none" stroke="${dk(clay, .35)}" stroke-width="1.2" opacity=".7"/>
        ${xmxArc(`M${100 - R * .7},${100 - R * .4} A${R * .8},${R * .8} 0 0 1 ${100 - R * .3},${100 - R * .74}`, 2.4, .45)}`;
}
// round wooden board
function xmxBoard(p, { R = 94, c = '#c08a52' } = {}){
    const R0 = rng(p.id + 'brd');
    let grain = '';
    for (let i = 0; i < 9; i++){ const y = 26 + i * 18 + (R0() - .5) * 6; grain += `M${f(10 + R0() * 10)},${f(y)} C60,${f(y - 6 + R0() * 12)} 140,${f(y - 6 + R0() * 12)} ${f(190 - R0() * 10)},${f(y + (R0() - .5) * 4)}`; }
    const cid = p.def('xmxBoardClip', id => `<clipPath id="${id}"><circle cx="100" cy="100" r="${R - 3}"/></clipPath>`);
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .2, .28, .38, .32)}" stroke="${dk(c, .3)}" stroke-width="1.2"/></g>
        <path d="${grain}" stroke="${dk(c, .25)}" stroke-width="1" fill="none" opacity=".45" clip-path="url(#${cid})"/>
        <circle cx="100" cy="100" r="${R - 4}" fill="none" stroke="${lt(c, .3)}" stroke-width="1.2" opacity=".6"/>
        ${xmxArc(`M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}`, 2.6, .45)}`;
}
// cast-iron skillet (sartén) with a handle to the lower right
function xmxSkillet(p, { R = 78, cx = 92, cy = 92 } = {}){
    return `<g ${p.sh(2)}><path d="M${cx + R * .6},${cy + R * .72} L${f(cx + R * 1.18)},${f(cy + R * 1.28)} Q${f(cx + R * 1.26)},${f(cy + R * 1.36)} ${f(cx + R * 1.34)},${f(cy + R * 1.26)} L${f(cx + R * .78)},${f(cy + R * .56)}Z" fill="#2e2a28"/>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg('#3d3836', .18, .3, .35, .3)}"/></g>
        <circle cx="${cx}" cy="${cy}" r="${R - 2}" fill="none" stroke="#5a5450" stroke-width="1.4"/>
        <circle cx="${cx}" cy="${cy}" r="${f(R * .9)}" fill="${p.rg('#2a2624', .12, .2, .62, .64)}"/>
        ${xmxArc(`M${cx - R * .72},${cy - R * .4} A${R * .86},${R * .86} 0 0 1 ${cx - R * .2},${cy - R * .8}`, 2.4, .3)}`;
}
// soup surface: broth disc + a lighter centre + optional cloudiness
function xmxBroth(p, R, c, { cx = 100, cy = 100, glow = .35, cloud = 0 } = {}){
    return K.liquid(p, { R, c, op: 1, cx, cy, shine: false }) +
        `<circle cx="${cx - 5}" cy="${cy - 7}" r="${f(R * .62)}" fill="${lt(c, .2)}" opacity="${glow}"/>` +
        (cloud ? `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${lt(c, .5)}" opacity="${cloud}"/>` : '');
}
// veil of broth over sunken things
const xmxVeil = (R, c, op = .2, cx = 100, cy = 100) => `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${c}" opacity="${op}"/>`;
// floating fat dots (chile oil on red broths)
function xmxOil(p, x, y, s, { n = 12, c = '#e8822e', seed = 1, op = .7, rmax = 2.6 } = {}){
    const R = rng(p.id + 'xoil' + seed + x);
    let d = '', h = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = 1 + R() * rmax;
        d += `M${f1(cx - rr)},${f1(cy)}a${f1(rr)},${f1(rr)} 0 1 0 ${f1(rr * 2)},0a${f1(rr)},${f1(rr)} 0 1 0 -${f1(rr * 2)},0`;
        h += `M${f1(cx - rr * .5)},${f1(cy - rr * .35)}h.1`;
    }
    return `<path d="${d}" fill="${c}" opacity="${op}" stroke="${dk(c, .25)}" stroke-width=".4"/><path d="${h}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`;
}
// crema swirl drawn on a soup
function xmxSwirl(x, y, R, { c = '#fbf6ea', w = 3.6, turns = 1.6 } = {}){
    const pts = [];
    for (let i = 0; i <= 26; i++){ const t = i / 26, a = t * turns * 6.28, rr = R * (.15 + .85 * t); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]); }
    const d = xmxSm(pts);
    return `<path d="${d}" stroke="${dk(c, .18)}" stroke-width="${w + 1}" fill="none" stroke-linecap="round" opacity=".5"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
// hominy kernel (maíz pozolero): puffed, opened like a flower
function xmxHominy(p, x, y, s, r = 0, { tint = null } = {}){
    const c = tint ? mix('#f4ecd6', tint, .18) : '#f4ecd6';
    return `<g ${T(x, y, r, s / 14)}><path d="M-6,1 C-7.5,-4 -3.5,-7.5 0,-6 C3.5,-7.5 7.5,-4 6,1 C6.5,5 3,7.2 0,6.4 C-3,7.2 -6.5,5 -6,1Z" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .28)}" stroke-width=".6"/>
        <path d="M0,-5.4 L0,-1.5 M-3.2,-.4 L0,-1.5 L3.2,-.4" stroke="${dk(c, .22)}" stroke-width=".8" fill="none" stroke-linecap="round"/><ellipse cx="-2.6" cy="-3" rx="1.6" ry=".9" fill="#fff" opacity=".8"/></g>`;
}
// radish slice
function xmxRadish(p, x, y, s){
    return `<g ${T(x, y)}><circle r="${f(s / 2)}" fill="#d23a4e" stroke="#9a1f30" stroke-width=".5"/><circle r="${f(s / 2 - 1.3)}" fill="${p.rg('#fbf6f6', .1, .1)}"/><circle r="${f(s * .3)}" fill="none" stroke="#f1d6dc" stroke-width=".7"/><circle cx="${f(-s * .14)}" cy="${f(-s * .14)}" r="${f(s * .08)}" fill="#fff" opacity=".9"/></g>`;
}
// avocado: diced cube or a slice (crescent with dark skin edge)
function xmxAvo(p, x, y, s, r = 0, { slice = false } = {}){
    if (slice) return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.6)}><path d="M-15,4 C-15,-6 -4,-10 6,-9 C12,-8 16,-4 15,0 C10,-1 4,0 -2,3 C-7,5 -11,7 -15,4Z" fill="#2f4f1c"/><path d="M-13.4,3.4 C-13,-4.6 -4,-8 5.4,-7.6 C10.4,-7 13.6,-4 13.4,-1.4 C9,-1.6 3,-.6 -2.4,2 C-7,4 -10.6,5.6 -13.4,3.4Z" fill="${p.g('#c6da7c', .35, .25)}"/><path d="M-12.6,2.6 C-12,-3.6 -4,-7 5,-6.6" stroke="#8fb04a" stroke-width="1.6" fill="none" opacity=".6"/></g><path d="M-8,-2 C-4,-5 2,-6 7,-5" stroke="#f4f9d6" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
    return `<g ${T(x, y, r)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${f(s * .92)}" rx="${f(s * .26)}" fill="${p.g('#b5cf6a', .35, .25)}" stroke="#6f8a32" stroke-width=".55"/><path d="M${f(-s * .26)},${f(-s * .26)} L${f(s * .12)},${f(-s * .28)}" stroke="#f2f7cc" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`;
}
// fried tortilla strip
function xmxStrip(p, x, y, L, W, r = 0, { c = '#e7a640', bend = .12 } = {}){
    const d = `M${f1(-L / 2)},0 Q0,${f1(-L * bend)} ${f1(L / 2)},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .35)}" stroke-width="${f1(W + 1.2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${W}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${lt(c, .45)}" stroke-width="${f1(W * .3)}" fill="none" stroke-linecap="round" transform="translate(-.5 -${f1(W * .2)})" opacity=".8"/></g>`;
}
// rolled enchilada bathed in sauce: rounded roll, tortilla ends showing
function xmxEnchilada(p, x, y, L, W, r = 0, { sauce = '#7f9a3a', tort = '#ecd28c' } = {}){
    const h = W / 2;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-L / 2)}" y="${f(-h)}" width="${L}" height="${W}" rx="${f(h)}" fill="${p.g(tort, .2, .3)}" stroke="${dk(tort, .35)}" stroke-width=".7"/></g>
        <path d="M${f(-L / 2 + 3)},${f(-h + 3)} Q${f(-L / 2 + h * .9)},0 ${f(-L / 2 + 3)},${f(h - 3)}" stroke="${dk(tort, .3)}" stroke-width="1" fill="none"/>
        <rect x="${f(-L / 2 + h * .7)}" y="${f(-h - .5)}" width="${f(L - h * 1.4)}" height="${W + 1}" rx="${f(h * .6)}" fill="${p.g(sauce, .25, .25)}"/>
        <path d="M${f(-L / 2 + h * .9)},${f(-h * .45)} L${f(L / 2 - h * 1.2)},${f(-h * .5)}" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".45"/></g>`;
}
// taco dorado: crisp rolled tortilla, golden with blisters
function xmxTaco(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtc' + seed + x), h = W / 2;
    let sp = '';
    for (let i = 0; i < 6; i++) sp += `<ellipse cx="${f((R() - .5) * L * .8)}" cy="${f((R() - .5) * W * .6)}" rx="${f(1.5 + R() * 2.5)}" ry="${f(1 + R() * 1.2)}" fill="#9a5418" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.crumb(.8)}><rect x="${f(-L / 2)}" y="${f(-h)}" width="${L}" height="${W}" rx="${f(h)}" fill="${p.g('#e9b04c', .3, .3)}" stroke="#a86c22" stroke-width=".7"/></g></g>
        <g ${xmxBlur(p, .9)}>${sp}</g>
        <path d="M${f(-L / 2 + h * .5)},${f(-h + 1.6)} Q${f(-L / 2 + h * 1.4)},0 ${f(-L / 2 + h * .5)},${f(h - 1.6)}" stroke="#a86c22" stroke-width="1" fill="none"/>
        <ellipse cx="${f(-L / 2 + h * .45)}" cy="0" rx="${f(h * .35)}" ry="${f(h * .6)}" fill="#f0e2c0"/>
        <path d="M${f(-L / 2 + h * 1.2)},${f(-h * .5)} L${f(L / 2 - h)},${f(-h * .55)}" stroke="#fff3d0" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>`;
}
// big shrimp with tail fan (peeled or shell-on)
function xmxShrimp(p, x, y, s, r = 0, { c = '#ee7a4c', shell = false, sauce = null } = {}){
    const col = shell ? '#e8683a' : c;
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.7)}><path d="M-9,6 C-12,-3 -5,-11 3,-10.5 C10,-10 13,-3 11,3 C9,8 3,8 2,4 C1,0 -3,0 -3,4 C-3,7 -6,9 -9,6Z" fill="${p.g(col, .32, .25)}" stroke="${dk(col, .35)}" stroke-width=".7"/>
        <path d="M-9,6 L-14,4 L-13,9 L-9,11 L-6,8Z" fill="${dk(col, .12)}" stroke="${dk(col, .35)}" stroke-width=".5"/></g>
        <path d="M-6,-5 Q-3.5,-2 -6.5,.5 M-1,-8.5 Q.5,-4.5 -2.8,-2 M4.5,-8.6 Q4.5,-4 1.2,-2 M9,-4.6 Q6.5,-1.2 3.4,0" stroke="${shell ? '#b8401c' : '#fde1d3'}" stroke-width="${shell ? 1 : 1.3}" fill="none" stroke-linecap="round" opacity=".9"/>
        ${sauce ? `<path d="M-9,6 C-12,-3 -5,-11 3,-10.5 C10,-10 13,-3 11,3 C9,8 3,8 2,4 C1,0 -3,0 -3,4 C-3,7 -6,9 -9,6Z" fill="${sauce}" opacity=".35"/>` : ''}
        ${xmxArc('M-6,-7 Q0,-10.5 6,-8', 1.3, .65)}</g>`;
}
// corn on the cob piece lying on its side
function xmxCob(p, x, y, L, W, r = 0, { c = '#f3cd4a' } = {}){
    let k = '';
    const rows = 4, cols = Math.round(L / 4.4);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++){ const kx = -L / 2 + 2.6 + j * (L - 5) / (cols - 1 || 1) - 2, ky = -W / 2 + 2 + i * (W - 4) / rows; k += `M${f1(kx)},${f1(ky)}h3.6v${f1((W - 4) / rows - .8)}h-3.6Z`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${f(-L / 2)}" y="${f(-W / 2)}" width="${L}" height="${W}" rx="${f(W * .4)}" fill="${dk(c, .25)}"/></g><path d="${k}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".3"/>
        <rect x="${f(-L / 2)}" y="${f(-W / 2)}" width="${L}" height="${W}" rx="${f(W * .4)}" fill="url(#${p.def('xmxCobSh', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a3a0a" stop-opacity=".35"/></linearGradient>`)})"/></g>`;
}
// honeycomb tripe piece (pancita)
function xmxTripe(p, x, y, s, r = 0, { seed = 1, c = '#efdcb6' } = {}){
    const R = rng(p.id + 'xtr' + seed + x);
    const pid = p.def('xmxHoney', id => `<pattern id="${id}" width="5" height="4.4" patternUnits="userSpaceOnUse"><path d="M0,2.2 L1.25,0 L3.75,0 L5,2.2 L3.75,4.4 L1.25,4.4Z" fill="none" stroke="#a0763e" stroke-width=".7" opacity=".55"/></pattern>`);
    const d = xmxSm(ring(s / 2, 8, .35, R, 1.2, .8), true);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${d}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g><path d="${d}" fill="url(#${pid})"/>${xmxArc(`M${f(-s * .28)},${f(-s * .14)} Q0,${f(-s * .32)} ${f(s * .2)},${f(-s * .22)}`, 1.2, .6)}</g>`;
}
// squash blossom (flor de calabaza)
function xmxBlossom(p, x, y, s, r = 0){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>
        <path d="M-2,0 C-6,-8 -2,-15 4,-15 C8,-12 10,-8 15,-9 C12,-4 14,0 15,4 C9,3 7,8 3,12 C-1,8 -4,4 -2,0Z" fill="${p.g('#f5a623', .3, .2)}" stroke="#c46f12" stroke-width=".7"/>
        <path d="M-15,1 C-10,-3 -6,-2 -2,0 C-6,3 -10,4 -15,1Z" fill="${p.g('#6f9a3a', .25, .25)}" stroke="#3f6a22" stroke-width=".6"/></g>
        <path d="M0,-1 C4,-6 8,-8 13,-8 M0,0 C5,0 10,2 14,3 M0,1 C2,5 3,8 3,11" stroke="#ffd56a" stroke-width="1.1" fill="none" stroke-linecap="round"/>
        <path d="M2,-11 Q6,-13 9,-10" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// fried ripe plantain slice: golden centre, caramelised edge
function xmxPlantain(p, x, y, L, W, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><ellipse rx="${f(L / 2)}" ry="${f(W / 2)}" fill="${p.g('#a8541a', .2, .3)}" stroke="#6e3210" stroke-width=".7"/></g>
        <ellipse cx="-.6" cy="-.6" rx="${f(L / 2 - 3)}" ry="${f(W / 2 - 2.6)}" fill="${p.rg('#eaa83e', .2, .25, .4, .38)}"/>
        <ellipse cx="${f(L * .1)}" cy="${f(W * .08)}" rx="${f(L * .2)}" ry="${f(W * .16)}" fill="#c87a26" opacity=".45"/>
        <path d="M${f(-L * .32)},${f(-W * .18)} Q${f(-L * .1)},${f(-W * .38)} ${f(L * .18)},${f(-W * .3)}" stroke="#fff3cc" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// mushroom slice (cap and stem profile)
function xmxMush(p, x, y, s, r = 0, { c = '#e9dcc4', edge = '#a07a52', cooked = .3 } = {}){
    const col = mix(c, '#b98a58', cooked);
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,0 C-10,-7 -5,-9 0,-9 C5,-9 10,-7 10,0 C10,1.6 8,2 4,1.6 L3.4,8 Q0,9.6 -3.4,8 L-4,1.6 C-8,2 -10,1.6 -10,0Z" fill="${p.g(col, .3, .25)}" stroke="${edge}" stroke-width=".9"/></g>
        <path d="M-8.5,-1 C-8,-5.6 -4,-7.4 0,-7.4 C4,-7.4 8,-5.6 8.5,-1" stroke="${dk(col, .25)}" stroke-width=".8" fill="none" opacity=".7"/>
        <path d="M-6,-5.4 Q-2,-7.6 3,-7" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// golden garlic slices
function xmxGarlic(p, x, y, s, { n = 10, seed = 1, c = '#efc46a' } = {}){
    const R = rng(p.id + 'xga' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rx = 3.4 + R() * 1.4, ry = 2.3 + R() * .7, rot = R() * 3.14; d += `M${f1(cx + Math.cos(rot) * rx)},${f1(cy + Math.sin(rot) * rx)}A${f1(rx)},${f1(ry)} ${f1(rot * 57.3)} 1 0 ${f1(cx - Math.cos(rot) * rx)},${f1(cy - Math.sin(rot) * rx)}A${f1(rx)},${f1(ry)} ${f1(rot * 57.3)} 1 0 ${f1(cx + Math.cos(rot) * rx)},${f1(cy + Math.sin(rot) * rx)}Z`; }
    return `<path d="${d}" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".6"/>`;
}
// guajillo / árbol chili rings (dark red)
function xmxChiliRings(p, x, y, s, { n = 8, seed = 1, c = '#9a1f12', rr = 2.6 } = {}){
    const R = rng(p.id + 'xcr' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd; d += `M${f1(cx - rr)},${f1(cy)}a${rr},${f1(rr * .8)} 0 1 0 ${f1(rr * 2)},0a${rr},${f1(rr * .8)} 0 1 0 -${f1(rr * 2)},0`; }
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.8"/><path d="${d}" fill="none" stroke="${lt(c, .3)}" stroke-width=".5" transform="translate(-.4 -.5)"/>`;
}
// beans (pinto / black / fava), one path per colour
function xmxBeans(p, x, y, s, { n = 30, cols = ['#b07a52', '#9a6440'], speck = '#6a3a1e', size = 3.6, seed = 1, sy = 1, gloss = true } = {}){
    const R = rng(p.id + 'xbn' + seed + x + y);
    const ds = cols.map(() => ''); let sp = '', hl = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd * sy, rot = R() * 3.14, rx = size * (.9 + R() * .2), ry = rx * .62;
        const ex = Math.cos(rot) * rx, ey = Math.sin(rot) * rx;
        ds[i % cols.length] += `M${f1(cx + ex)},${f1(cy + ey)}A${f1(rx)},${f1(ry)} ${f1(rot * 57.3)} 1 0 ${f1(cx - ex)},${f1(cy - ey)}A${f1(rx)},${f1(ry)} ${f1(rot * 57.3)} 1 0 ${f1(cx + ex)},${f1(cy + ey)}Z`;
        if (speck && R() < .7) sp += `M${f1(cx + (R() - .5) * rx)},${f1(cy + (R() - .5) * ry)}h.1`;
        if (gloss) hl += `M${f1(cx - rx * .35)},${f1(cy - ry * .4)}h${f1(rx * .4)}`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".6"/>`).join('') + (sp ? `<path d="${sp}" stroke="${speck}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>` : '') + (hl ? `<path d="${hl}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".6"/>` : '');
}
// spring onion (cebollita), grilled: white bulb with green tops
function xmxCebollita(p, x, y, L, r = 0, { charred = true } = {}){
    const k = L / 60;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}>
        <path d="M2,-3 C12,-6 24,-7 30,-6 L30,-2 C22,-1 12,0 2,1Z M2,1 C12,2 22,4 29,6 L28,9 C20,7 10,5 2,4Z" fill="${p.g('#5f9a34', .25, .3)}" stroke="#3a6a1e" stroke-width=".6"/>
        <ellipse cx="-14" cy="0" rx="16" ry="9" fill="${p.g('#f6f2e6', .2, .2)}" stroke="#c9c0a6" stroke-width=".7"/></g>
        <path d="M-28,0 l-3,-2 M-28,1 l-3,2 M-28,0 h-4" stroke="#d9cfb2" stroke-width=".8"/>
        ${charred ? '<path d="M-22,-6 l4,12 M-12,-8 l4,15 M-2,-6 l3,11 M10,-5 l2,9 M20,-5 l2,9" stroke="#3a2412" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>' : ''}
        ${xmxArc('M-24,-3 Q-16,-8 -6,-6', 1.6, .7)}</g>`;
}
// grill marks across a shape (clip to a path d in the same coordinate system)
function xmxGrill(p, d, x0, y0, x1, y1, { n = 5, ang = 30, c = '#3a1c0a', op = .55, w = 3 } = {}){
    const id = p.uid();
    let m = '';
    for (let i = 0; i < n; i++){ const t = (i + .5) / n, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t; m += `M${f1(cx - 80 * Math.cos(ang / 57.3))},${f1(cy - 80 * Math.sin(ang / 57.3))}l${f1(160 * Math.cos(ang / 57.3))},${f1(160 * Math.sin(ang / 57.3))}`; }
    return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${m}" stroke="${c}" stroke-width="${w}" opacity="${op}" clip-path="url(#${id})" stroke-linecap="round"/>`;
}
// red chile powder dust (tajín / chile piquín)
const xmxChilePowder = (p, x, y, s, n = 40, seed = 1) => xmxGrains(p, x, y, s, { cols: ['#c0391c', '#a82a14'], n, size: .9, seed });
// whole charred chili (toreado) — glossy with black blisters
function xmxToreado(p, x, y, L, r = 0, { c = '#4f8a2a', seed = 1 } = {}){
    const R = rng(p.id + 'xtor' + seed + x);
    let bl = '';
    for (let i = 0; i < 5; i++) bl += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * 3)}" rx="${f(1.6 + R() * 2.4)}" ry="${f(1.2 + R() * 1.2)}" fill="#24180c" opacity="${f(.45 + R() * .35)}"/>`;
    const d = `M${f(-L / 2)},-1 C${f(-L * .3)},-6.5 ${f(L * .2)},-6.5 ${f(L / 2)},0 C${f(L * .2)},5 ${f(-L * .3)},5.5 ${f(-L / 2)},1Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${d}" fill="${p.g(c, .32, .25)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f(-L / 2)},0 l-5,-1.6" stroke="#6a8a3a" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="${f(-L / 2 + 1)}" cy="0" rx="2.4" ry="3.6" fill="#5a8a30"/>
        <g ${xmxBlur(p, .5)}>${bl}</g>${xmxArc(`M${f(-L * .3)},-3.4 Q0,-5.4 ${f(L * .26)},-3`, 1.4, .75)}</g>`;
}
// totopo bathed in salsa (chilaquiles): sauce-coloured triangle, crisp golden edges peeking
function xmxSaucedChip(p, x, y, s, r = 0, { sauce = '#c23a22', seed = 1 } = {}){
    const R = rng(p.id + 'xsc' + seed + x + y);
    const d = `M${f(-s / 2)},${f(s * .36)} Q0,${f(s * .44)} ${f(s / 2)},${f(s * .36)} Q${f(s * .1)},${f(-s * .1)} ${f(s * .06)},${f(-s * .5)} Q0,${f(-s * .56)} ${f(-s * .06)},${f(-s * .5)} Q${f(-s * .1)},${f(-s * .1)} ${f(-s / 2)},${f(s * .36)}Z`;
    const k = .55 + R() * .3;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${p.g('#eab04c', .3, .3)}" stroke="#9a5a1c" stroke-width=".7"/>
        <path d="${d}" transform="scale(${f(k)}) translate(${f((R() - .5) * 4)} ${f(1 + R() * 3)})" fill="${p.g(sauce, .25, .25)}" opacity=".95"/>
        <path d="M${f(-s * .26)},${f(s * .18)} L${f(-s * .04)},${f(-s * .24)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".45"/></g>`;
}
// breaded thin cutlet (milanesa)
function xmxMilanesa(p, x, y, w, h, r = 0, { seed = 1, c = '#d39440' } = {}){
    const R = rng(p.id + 'xml' + seed);
    const d = xmxSm(ring(1, 14, .16, R).map(([a, b]) => [a * w / 2, b * h / 2]), true);
    return `<g ${T(x, y, r)}><g ${p.sh(1.3)}><g ${p.crumb(.6)}><g ${p.rough(2.2, .14)}><path d="${d}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .4)}" stroke-width="1"/></g></g></g>
        ${xmxGrains(p, 0, 0, Math.min(w, h) * .9, { cols: ['#e8b45c', '#b06a24'], n: 50, size: 1, seed: 3, sy: h / w })}
        <path d="M${f(-w * .32)},${f(-h * .2)} Q${f(-w * .08)},${f(-h * .38)} ${f(w * .2)},${f(-h * .32)}" stroke="#fff3d0" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// batter-coated chile relleno: puffy golden egg batter in a chile shape, green stem
function xmxRelleno(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xrl' + seed + x);
    const pts = [[-L / 2, 0], [-L * .4, -W * .45], [-L * .1, -W * .52], [L * .2, -W * .44], [L * .4, -W * .24], [L / 2, W * .04], [L * .38, W * .26], [L * .1, W * .48], [-L * .2, W * .5], [-L * .42, W * .36]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    const d = xmxSm(pts, true);
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><g ${p.rough(2.6, .1)}><path d="${d}" fill="${p.g('#e9b552', .35, .3)}" stroke="#b07a26" stroke-width=".8"/></g></g>
        <g ${p.crumb(.4)}><path d="${xmxSm(pts.map(([a, b]) => [a * .78, b * .7 - 1]), true)}" fill="#f2cc72" opacity=".75"/></g>
        <g ${xmxBlur(p, 1.4)}><ellipse cx="${f(L * .12)}" cy="${f(W * .1)}" rx="${f(L * .14)}" ry="${f(W * .16)}" fill="#c27a26" opacity=".5"/><ellipse cx="${f(-L * .2)}" cy="${f(-W * .14)}" rx="${f(L * .1)}" ry="${f(W * .1)}" fill="#c27a26" opacity=".35"/></g>
        <path d="M${f(L / 2 - 3)},0 q8,-2 12,-8" stroke="#4f6e24" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M${f(L / 2 - 3)},0 q8,-2 12,-8" stroke="#7aa040" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M${f(-L * .34)},${f(-W * .22)} Q${f(-L * .1)},${f(-W * .4)} ${f(L * .2)},${f(-W * .3)}" stroke="#fff6d8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// banana leaf lining (cochinita)
function xmxLeaf(p, x, y, w, h, r = 0){
    let v = '';
    for (let i = -6; i <= 6; i++) v += `M${f(i * w / 13)},${f(-h / 2 + 4)}L${f(i * w / 13 + 6)},${f(h / 2 - 4)}`;
    const id = p.uid();
    return `<g ${T(x, y, r)}><clipPath id="${id}"><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(h * .3)}"/></clipPath><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(h * .3)}" fill="${p.g('#4f8a34', .25, .3)}" stroke="#2f5a1e" stroke-width=".8"/>
        <path d="${v}" stroke="#7fb05a" stroke-width=".8" opacity=".6" clip-path="url(#${id})"/></g>`;
}
// pickled red onion slivers (bright pink-magenta)
function xmxPinkOnion(p, x, y, s, { n = 10, seed = 1 } = {}){
    const sp = xmxSpots('po' + seed + x + y, n, s / 2, s / 6, x, y);
    return sp.map(([a, b, r], i) => xmxSliver(p, a, b, 15 + (i % 3) * 3, r, { c: i % 2 ? '#e46a9e' : '#cc3f7e', w: 3 })).join('');
}
// seared beef strip with grill marks (carne asada)
function xmxAsada(p, x, y, L, W, r = 0, { seed = 1, c = '#7a3e1e' } = {}){
    const R = rng(p.id + 'xas' + seed + x);
    const d = xmxSm([[-L / 2, -W * .3], [-L * .2, -W / 2], [L * .25, -W * .46], [L / 2, -W * .2], [L * .46, W * .3], [L * .1, W / 2], [-L * .3, W * .44], [-L / 2, W * .2]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]), true);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${d}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        ${xmxGrill(p, d, -L / 2, 0, L / 2, 0, { n: Math.round(L / 12), ang: 70, w: 2.6, op: .6 })}
        <path d="M${f(-L * .3)},${f(-W * .22)} Q0,${f(-W * .4)} ${f(L * .3)},${f(-W * .22)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// golden pan-fried white fish fillet
function xmxGoldFillet(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xgf' + seed);
    const pts = ring(1, 12, .1, R, w / 2, h / 2).map(([a, b]) => [a, a > 0 ? b * .78 : b]);
    const d = xmxSm(pts, true);
    let br = '';
    for (let i = 0; i < 5; i++) br += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .5)}" rx="${f(w * (.08 + R() * .08))}" ry="${f(h * (.08 + R() * .08))}" fill="#c27a2a" opacity="${f(.35 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${d}" fill="${p.g('#ecc47c', .3, .28)}" stroke="#a8742e" stroke-width=".8"/></g><g ${xmxBlur(p, 2.2)}>${br}</g>
        <path d="${[-.28, -.08, .12, .32].map(t => `M${f(w * t)},${f(-h * .34)} q${f(w * .06)},${f(h * .3)} ${f(-w * .02)},${f(h * .66)}`).join('')}" stroke="#c99a58" stroke-width=".8" fill="none" opacity=".55"/>
        <path d="M${f(-w * .34)},${f(-h * .22)} Q${f(-w * .1)},${f(-h * .4)} ${f(w * .18)},${f(-h * .3)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// french fries
function xmxFries(p, x, y, s, { n = 10, seed = 1 } = {}){
    const sp = xmxSpots('fr' + seed + x, n, s / 2, 6, x, y);
    return `<g ${p.sh(.8)}>${sp.map(([a, b, r], i) => `<g ${T(a, b, r)}><rect x="-12" y="-2.8" width="${22 + (i % 3) * 3}" height="5.6" rx="1.6" fill="${p.g('#efc25a', .3, .3)}" stroke="#b07a22" stroke-width=".6"/><path d="M-10,-1.4 h14" stroke="#fff3c8" stroke-width="1" stroke-linecap="round" opacity=".7"/></g>`).join('')}</g>`;
}

// bolillo half for molletes: golden crust ring, refried beans and melted cheese on top
function xmxMollete(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xmo' + seed + x);
    const ch = xmxSm(ring(1, 11, .22, R).map(([a, b]) => [a * w * .38, b * h * .34]), true);
    let br = '';
    for (let i = 0; i < 5; i++) br += `<ellipse cx="${f((R() - .5) * w * .5)}" cy="${f((R() - .5) * h * .4)}" rx="${f(2 + R() * 4)}" ry="${f(1.5 + R() * 2.5)}" fill="#c7782a" opacity="${f(.35 + R() * .35)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><ellipse rx="${f(w / 2)}" ry="${f(h / 2)}" fill="${p.g('#c88a3c', .3, .3)}" stroke="#8a5420" stroke-width=".8"/></g>
        <ellipse rx="${f(w / 2 - 3.5)}" ry="${f(h / 2 - 3.5)}" fill="#5a3422"/>
        <path d="${ch}" fill="${p.g('#f6d677', .35, .2)}" stroke="#d9a63a" stroke-width=".6"/><g ${xmxBlur(p, 1.4)}>${br}</g>
        <path d="M${f(-w * .3)},${f(-h * .3)} Q0,${f(-h * .48)} ${f(w * .28)},${f(-h * .32)}" stroke="#fff3cc" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// chicken breast fillet (seared)
function xmxBreast(p, x, y, w, h, r = 0, { seed = 1, c = '#e2b77a' } = {}){
    const R = rng(p.id + 'xbr' + seed + x);
    const d = xmxSm(ring(1, 10, .14, R).map(([a, b]) => [a * w / 2 * (a > 0 ? .9 : 1), b * h / 2 * (a > 0 ? .78 : 1)]), true);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${d}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>
        <path d="M${f(-w * .3)},${f(h * .1)} Q0,${f(h * .2)} ${f(w * .3)},${f(h * .05)}" stroke="${dk(c, .3)}" stroke-width="1" fill="none" opacity=".4"/></g>`;
}

// jalapeño: whole pod (plump) or a ring slice with seeds
function xmxJalapeno(p, x, y, s, r = 0, { c = '#5a7a2a', ring: isRing = false } = {}){
    if (isRing) return `<g ${T(x, y, r)}><circle r="${f(s / 2)}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/><circle r="${f(s / 2 - 2)}" fill="#c9cf8a"/><circle r="${f(s * .18)}" fill="#e8e2b0"/>${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${f(Math.cos(i * 1.257) * s * .2)}" cy="${f(Math.sin(i * 1.257) * s * .2)}" rx="1.1" ry=".8" fill="#f6f0d0" stroke="#b8b07a" stroke-width=".3"/>`).join('')}</g>`;
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.7)}><path d="M-16,-6 C-6,-10 10,-9 18,-2 C20,2 16,5 12,5 C2,7 -8,7 -16,5 C-19,3 -19,-4 -16,-6Z" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M-16,-1 l-6,-2 l-1,3" stroke="#7a8a3a" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="-16" cy="-.5" rx="2.4" ry="5" fill="#6a7a2a"/>
        ${xmxArc('M-12,-5 C-2,-8 8,-7 14,-3', 1.6, .6)}</g>`;
}
// garlic clove (whole, pale)
const xmxClove = (p, x, y, s, r = 0) => `<g ${T(x, y, r, s / 14)}><g ${p.sh(.5)}><path d="M-6,4 C-7,-2 -2,-7 2,-7 C5,-5 6,0 4,4 C1,6 -3,6 -6,4Z" fill="${p.g('#f4ecd6', .3, .2)}" stroke="#c9b88e" stroke-width=".6"/></g><path d="M-1,-5 Q-3,0 -2,4" stroke="#e0d0a8" stroke-width=".7" fill="none"/></g>`;
// bay leaf
const xmxBay = (p, x, y, L, r = 0) => `<g ${p.sh(.5)}><path ${T(x, y, r)} d="M${-L / 2},0 Q0,${-L * .24} ${L / 2},0 Q0,${L * .24} ${-L / 2},0Z" fill="${p.g('#6b7a3a', .25, .25)}" stroke="#3f4a1c" stroke-width=".6"/></g><path ${T(x, y, r)} d="M${-L * .44},0 L${L * .44},0" stroke="#9aa86a" stroke-width=".7"/>`;

// whole grilled nopal paddle
function xmxPaddle(p, x, y, L, W, r = 0, { seed = 1, c = '#5f8a32' } = {}){
    const R = rng(p.id + 'xpd' + seed + x);
    const d = xmxSm(ring(1, 12, .08, R).map(([a, b]) => [a * L / 2 * (a > 0 ? 1 : .9), b * W / 2 * (a > 0 ? 1 : .8)]), true);
    let ar = '';
    for (let i = 0; i < 16; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * .8; ar += `M${f1(Math.cos(a) * dd * L / 2)},${f1(Math.sin(a) * dd * W / 2)}h.1`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${d}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".9"/></g>
        <path d="${ar}" stroke="#d6e2a0" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        ${xmxGrill(p, d, -L / 2, 0, L / 2, 0, { n: 5, ang: 62, w: 3.2, op: .5, c: '#2a2a10' })}
        <path d="M${f(-L * .3)},${f(-W * .22)} Q0,${f(-W * .38)} ${f(L * .3)},${f(-W * .22)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// grilled panela slice
function xmxPanela(p, x, y, w, h, r = 0){
    const d = `M${-w / 2},${-h / 2 + 4}Q${-w / 2},${-h / 2} ${-w / 2 + 4},${-h / 2}H${w / 2 - 4}Q${w / 2},${-h / 2} ${w / 2},${-h / 2 + 4}V${h / 2 - 4}Q${w / 2},${h / 2} ${w / 2 - 4},${h / 2}H${-w / 2 + 4}Q${-w / 2},${h / 2} ${-w / 2},${h / 2 - 4}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.g('#fbf6e8', .3, .15)}" stroke="#d9cfb2" stroke-width=".7"/></g>${xmxGrill(p, d, -w / 2, 0, w / 2, 0, { n: 3, ang: 60, w: 3, op: .45, c: '#6a4a20' })}</g>`;
}
// stick (jicama / cucumber spear)
function xmxStick(p, x, y, L, W, r = 0, { c = '#f8f4e8', skin = '#b88a5a', sk = .22 } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="${f(-L / 2)}" y="${f(-W / 2)}" width="${L}" height="${W}" rx="1.6" fill="${p.g(c, .25, .15)}" stroke="${dk(c, .2)}" stroke-width=".5"/></g><rect x="${f(-L / 2)}" y="${f(W / 2 - W * sk)}" width="${L}" height="${f(W * sk)}" rx="1" fill="${skin}"/><path d="M${f(-L / 2 + 2)},${f(-W / 2 + 1.4)} H${f(L / 2 - 4)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`;
}

// poached egg in broth
function xmxPoached(p, x, y, s, r = 0, { seed = 1, tint = '#f6efe2' } = {}){
    const R = rng(p.id + 'xpe' + seed + x);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xmxSm(ring(s / 2, 11, .3, R, 1.15, .9), true)}" fill="${p.rg(tint, .3, .12)}" stroke="#dcd2bc" stroke-width=".6" opacity=".88"/></g>
        <circle cx="2" cy="1" r="${f(s * .22)}" fill="${p.rg('#f2a82a', .35, .15, .35, .32)}" stroke="#d48a18" stroke-width=".6"/>
        <path d="${xmxSm(ring(s * .27, 8, .3, R), true)}" transform="translate(2 1)" fill="#fff" opacity=".35"/>
        <ellipse cx="${f(-s * .05)}" cy="${f(-s * .06)}" rx="${f(s * .07)}" ry="${f(s * .04)}" fill="#fff" opacity=".8"/></g>`;
}
// cross-cut fish steak (round of white flesh with skin rim and backbone)
function xmxFishSteak(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.8)}><path d="M-14,-2 C-14,-11 -4,-14 2,-13 C10,-12 15,-6 15,1 C15,8 9,13 0,13 C-8,13 -14,7 -14,-2Z" fill="${p.g('#f3ebdc', .3, .2)}" stroke="#7a7a7a" stroke-width="1.6"/></g>
        <path d="M0,-12 L0,-2 M-12,1 C-6,-1 6,-1 13,1 M-10,-7 Q-4,-4 0,-3 Q4,-4 10,-7 M-9,8 Q-4,4 0,3 Q4,4 9,8" stroke="#d8cbb0" stroke-width=".9" fill="none"/>
        <circle cx="0" cy="-1" r="2.4" fill="#e8ded0" stroke="#b0a48c" stroke-width=".6"/>${xmxArc('M-10,-6 Q-4,-11 3,-10.5', 1.3, .7)}</g>`;
}
// beef shank with a round marrow bone
function xmxShank(p, x, y, s, r = 0, { c = '#8a5432' } = {}){
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(1)}><path d="${xmxSm(ring(18, 10, .2, rng(p.id + 'shk' + x), 1.15, .9), true)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="M-12,4 Q-4,0 4,6 M-8,-6 Q0,-8 8,-4" stroke="${dk(c, .4)}" stroke-width="1" fill="none" opacity=".5"/>
        <circle cx="8" cy="2" r="7.6" fill="${p.g('#f1e6cc', .3, .2)}" stroke="#b9a684" stroke-width=".8"/><circle cx="8" cy="2" r="4.4" fill="${p.rg('#c98a5a', .25, .25)}"/>
        ${xmxArc('M-14,-6 Q-6,-14 4,-12', 1.6, .55)}</g>`;
}
// chickpeas
function xmxChickpeas(p, x, y, s, { n = 14, seed = 1, sz = 3.4 } = {}){
    const R = rng(p.id + 'xcp' + seed + x + y);
    let d = '', h = '', nb = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd; d += `M${f1(cx - sz)},${f1(cy)}a${sz},${sz} 0 1 0 ${f1(sz * 2)},0a${sz},${sz} 0 1 0 -${f1(sz * 2)},0`; h += `M${f1(cx - sz * .4)},${f1(cy - sz * .4)}h.1`; nb += `M${f1(cx + sz * .3)},${f1(cy + sz * .2)}q1,1 ${f1(sz * .5)},${f1(sz * .2)}`; }
    return `<path d="${d}" fill="${p.rg('#e2c084', .3, .25, .35, .32)}" stroke="#a87e3e" stroke-width=".6"/><path d="${nb}" stroke="#a87e3e" stroke-width=".7" fill="none"/><path d="${h}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
}
// small chunk of cheese (panela / queso fresco) cube
const xmxCheeseCube = (p, x, y, s, r = 0) => xmxDice(p, x, y, s, r, '#fbf7ea');
// oregano flakes
const xmxOregano = (p, x, y, s, n = 24, seed = 1) => xmxGrains(p, x, y, s, { cols: ['#5f6e2c', '#7a8a3a'], n, size: .9, seed });

// =========================================================
export default {
    // Enchiladas verdes: Talavera plate, three rolled tortillas filled with chicken, bathed in tomatillo salsa, crema, queso fresco, onion and cilantro
    mx_enchiladas_verdes: p => [
        xmxTalavera(p),
        K.pool(p, 100, 100, 150, '#7d9a34', { op: .97, seed: 1, sy: .92 }),
        `<circle cx="94" cy="92" r="50" fill="#9db84c" opacity=".3"/>`,
        xmxEnchilada(p, 100, 70, 112, 34, -16, { sauce: '#86a33a' }),
        xmxEnchilada(p, 102, 102, 120, 35, -16, { sauce: '#7f9c36' }),
        xmxEnchilada(p, 104, 134, 108, 34, -16, { sauce: '#86a33a' }),
        xmxGrains(p, 100, 102, 120, { cols: ['#6a8a2a', '#a6c050'], n: 40, size: 1.5, seed: 4 }),
        `<g ${p.sh(.5)}><path d="M48,92 C66,72 88,98 108,76 C124,62 140,78 152,66" stroke="#fbf8ee" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M52,126 C70,108 92,132 112,112 C128,98 142,114 154,102" stroke="#fbf8ee" stroke-width="4" fill="none" stroke-linecap="round"/></g>`,
        xmxQueso(p, 100, 102, 120, { n: 34, seed: 2, size: 2.6 }),
        xmxOnionRing(p, 74, 80, 18, 20), xmxOnionRing(p, 128, 98, 16, -30), xmxOnionRing(p, 92, 132, 17, 60), xmxOnionRing(p, 140, 128, 14, 10),
        xmxCilantro(p, 112, 86, 12, 20), xmxCilantro(p, 70, 112, 11, -50), xmxCilantro(p, 124, 140, 10, 70), xmxCilantro(p, 86, 62, 10, 120),
    ].join(''),

    // Chilaquiles rojos: enamel plate heaped with totopos in red guajillo salsa, a fried egg, crema, queso fresco, onion rings, cilantro
    mx_chilaquiles: p => {
        const sp = xmxSpots('chq', 26, 60, 14);
        return [
            xmxPeltre(p, { rim: '#9a2a1c' }),
            K.pool(p, 100, 100, 146, '#b5361f', { op: .97, seed: 2, sy: .95 }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => xmxSaucedChip(p, x, y, 30 + (i % 3) * 3, r, { seed: i, sauce: i % 2 ? '#bf3a22' : '#a82e1a' })).join(''),
            `</g>`,
            K.friedEgg(p, 106, 96, 62, 10),
            `<g ${p.sh(.5)}><path d="M44,120 C60,104 76,126 92,112" stroke="#fbf8ee" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M128,140 C140,126 152,138 160,124" stroke="#fbf8ee" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M54,66 C64,58 74,66 84,58" stroke="#fbf8ee" stroke-width="3.2" fill="none" stroke-linecap="round"/></g>`,
            xmxQueso(p, 82, 120, 70, { n: 18, seed: 1, size: 2.4 }), xmxQueso(p, 140, 76, 46, { n: 10, seed: 3, size: 2.4 }),
            xmxOnionRing(p, 60, 96, 18, 20), xmxOnionRing(p, 138, 128, 16, -40), xmxOnionRing(p, 112, 146, 15, 70), xmxOnionRing(p, 100, 56, 16, 0),
            xmxCilantro(p, 74, 74, 11, 20), xmxCilantro(p, 146, 102, 11, -40), xmxCilantro(p, 86, 146, 10, 80),
        ].join('');
    },

    // Milanesa de res: enamel plate, a big thin breaded beef cutlet, fries, shredded lettuce and lime wedges
    mx_milanesa: p => [
        xmxPeltre(p, { rim: '#1d3f7a' }),
        `<g ${p.sh(.6)}><path ${T(134, 140)} d="${xmxSm(ring(26, 10, .2, rng(p.id + 'lt'), 1.2, .8), true)}" fill="#cfe59a"/>${xmxShreds(p, 134, 140, 50, { c: '#9cc85a', n: 26, w: 2.2, len: .4, seed: 1, sy: .7, outline: false })}${xmxShreds(p, 134, 140, 44, { c: '#e6f2c4', n: 18, w: 2, len: .4, seed: 2, sy: .7, outline: false })}</g>`,
        xmxFries(p, 66, 142, 46, { n: 9, seed: 1 }),
        xmxMilanesa(p, 96, 88, 136, 98, -12, { seed: 1, c: '#c98632' }),
        xmxLime(p, 156, 98, 28, 80), xmxLime(p, 150, 66, 26, 40),
        K.cherryTomato(p, 108, 152, 13),
    ].join(''),

    // Pollo en mole: clay plate, chicken thigh and drumstick under glossy dark mole poblano with toasted sesame, arroz rojo alongside
    mx_pollo_mole: p => {
        const mole = '#4a2016';
        return [
            xmxClayPlate(p, { clay: '#c27440', glaze: '#8e4a22' }),
            xmxRice(p, 142, 128, 58, { tint: '#e49040', density: .9, grain: 3.4, hiK: .45 }),
            `<g ${p.sh(1)}><path d="${xmxSm([[34, 92], [52, 50], [100, 36], [146, 52], [160, 92], [138, 118], [112, 150], [70, 156], [40, 132]], true)}" fill="${p.rg(mole, .25, .3, .4, .36)}"/></g>`,
            `<g ${p.sh(1.1)}>`,
            `<path ${T(82, 84)} d="${xmxSm(ring(32, 10, .18, rng(p.id + 'th'), 1.15, .85), true)}" fill="${p.g('#5a2a1a', .25, .3)}" stroke="#2e120a" stroke-width=".8"/>`,
            xmxDrum(p, 104, 124, 84, -24, { c: '#5a2818' }),
            `</g>`,
            `<path d="M60,74 Q80,62 102,70 M64,96 Q84,90 104,98 M80,118 Q100,112 120,118" stroke="#6e3624" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
            xmxArc('M58,80 Q74,62 98,64', 2.6, .5), xmxArc('M82,116 Q96,108 114,110', 2, .45), xmxArc('M126,58 Q140,62 148,76', 1.6, .35),
            K.sesame(p, 90, 98, 90, { n: 34, c: '#f3e2b8', seed: 1 }),
            xmxSliver(p, 128, 70, 14, 20, { c: '#f3ecdc' }),
        ].join('');
    },

    // Cochinita pibil: cazuela lined with banana leaf, achiote-orange shredded pork in its juices, pickled red onion and habanero
    mx_cochinita: p => [
        xmxCazuela(p, { R: 86, glaze: '#5e3214' }),
        xmxLeaf(p, 100, 100, 150, 112, -20),
        xmxLeaf(p, 100, 100, 134, 104, 50),
        K.pool(p, 100, 102, 124, '#c2501f', { op: .95, seed: 1, sy: .92 }),
        `<g ${p.sh(.9)}><path ${T(100, 100)} d="${xmxSm(ring(54, 13, .18, rng(p.id + 'mass'), 1, .92), true)}" fill="${p.rg('#c45a26', .2, .25)}"/></g>`,
        xmxShreds(p, 100, 100, 108, { c: '#b84e22', n: 70, w: 4.2, len: .16, seed: 1, curve: .6 }),
        xmxShreds(p, 100, 100, 96, { c: '#d8743a', n: 40, w: 3.4, len: .15, seed: 2, curve: .6 }),
        xmxShreds(p, 100, 100, 100, { c: '#9a3a18', n: 26, w: 3, len: .14, seed: 3, curve: .6 }),
        `<circle cx="100" cy="100" r="56" fill="#c2501f" opacity=".18"/>`,
        xmxPinkOnion(p, 104, 94, 70, { n: 14, seed: 1 }),
        xmxGrains(p, 104, 96, 50, { cols: ['#f28a1c', '#f6b02a'], n: 10, size: 1.4, seed: 4 }),
        xmxShine(100, 100, 60, .35),
    ].join(''),

    // Carne asada: wooden board, sliced grilled arrachera, charred cebollitas, avocado slices, lime wedges and warm tortillas
    mx_carne_asada: p => [
        xmxBoard(p),
        xmxTortilla(p, 58, 64, 66, 0, { seed: 1 }),
        xmxTortilla(p, 66, 72, 66, 0, { seed: 2 }),
        xmxCebollita(p, 150, 128, 64, -60), xmxCebollita(p, 162, 112, 58, -70),
        xmxAsada(p, 100, 92, 118, 66, -24, { seed: 1, c: '#7c3f1c' }),
        ...[[78, 134], [96, 140], [114, 142], [132, 138]].map(([x, y], i) => `<g ${T(x, y, 14 + i * 4)}><g ${p.sh(.8)}><rect x="-8" y="-17" width="16" height="34" rx="3" fill="${p.g('#6e3818', .25, .3)}" stroke="#3e1e0c" stroke-width=".7"/></g><rect x="-6.4" y="-15" width="5" height="30" rx="2" fill="${p.g('#c0644e', .25, .2)}"/><path d="M2,-12 l3,4 M2,-2 l3,4 M2,8 l3,4" stroke="#2a1206" stroke-width="2" stroke-linecap="round" opacity=".55"/></g>`),
        xmxAvo(p, 150, 62, 44, 20, { slice: true }), xmxAvo(p, 156, 82, 42, 30, { slice: true }),
        xmxLime(p, 50, 118, 26, -60), xmxLime(p, 56, 142, 24, 200),
        xmxBits(p, 98, 104, 60, { n: 10, seed: 3 }),
    ].join(''),

    // Chiles rellenos: clay plate, two egg-battered poblanos stuffed with cheese, in a light tomato caldillo
    mx_chiles_rellenos: p => [
        xmxClayPlate(p, { clay: '#c27440', glaze: '#8e4a22' }),
        K.pool(p, 100, 100, 148, '#cf4f2c', { op: .97, seed: 2, sy: .94 }),
        `<circle cx="94" cy="94" r="50" fill="#e47450" opacity=".35"/>`,
        xmxGrains(p, 100, 100, 140, { cols: ['#b8361e', '#e8784e'], n: 40, size: 2, seed: 3 }),
        xmxRelleno(p, 96, 76, 120, 46, -8, { seed: 1 }),
        xmxRelleno(p, 104, 126, 118, 44, 172, { seed: 2 }),
        `<g ${p.sh(.4)}><path d="M142,112 q8,4 6,12 q-6,2 -10,-4Z" fill="#fbf2d4" stroke="#d9c690" stroke-width=".6"/><path d="M50,88 q-8,4 -4,10 q6,0 8,-6Z" fill="#fbf2d4" stroke="#d9c690" stroke-width=".6"/></g>`,
        `<path d="M70,100 Q100,96 132,104" stroke="#cf4f2c" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`,
        xmxSliver(p, 60, 104, 14, 40, { c: '#f1e2c0' }), xmxSliver(p, 146, 96, 13, -30, { c: '#f1e2c0' }),
    ].join(''),

    // Albóndigas en chipotle: cazuela of meatballs (rice inside) in smoky orange-red chipotle tomato sauce, cilantro
    mx_albondigas_chipotle: p => {
        const sp = [[100, 100], [70, 78], [126, 72], [146, 106], [124, 138], [84, 140], [56, 112], [100, 62]];
        return [
            xmxCazuela(p, { R: 86, glaze: '#6e3d18' }),
            K.liquid(p, { R: 74, c: '#b8461f', op: 1, shine: false }),
            `<circle cx="96" cy="94" r="50" fill="#d26a3a" opacity=".35"/>`,
            sp.map(([x, y], i) => K.meatball(p, x, y, 32 + (i % 2) * 2, { c: '#a0603a' })).join(''),
            sp.map(([x, y], i) => `<path d="M${x - 14},${y + 6} Q${x},${y + 15} ${x + 14},${y + 6} Q${x + 8},${y + 2} ${x},${y + 4} Q${x - 8},${y + 2} ${x - 14},${y + 6}Z" fill="#b8461f" opacity=".75"/>` + xmxGrains(p, x - 2, y - 2, 22, { cols: ['#f3ead6'], n: 4, size: 1, seed: i })).join(''),
            xmxGrains(p, 100, 100, 140, { cols: ['#8a2a14', '#d0602e'], n: 30, size: 1.6, seed: 2 }),
            xmxCilantro(p, 86, 92, 11, 20), xmxCilantro(p, 112, 120, 11, -40), xmxCilantro(p, 140, 84, 10, 70), xmxCilantro(p, 70, 128, 10, 110),
            xmxShine(100, 100, 72, .35),
        ].join('');
    },

    // Camarones a la diabla: painted barro bowl, shrimp glossy with fiery deep-red chile sauce, onion and parsley
    mx_camarones_diabla: p => {
        const sp = xmxSpots('cd', 11, 50, 25);
        return [
            xmxBarro(p),
            K.liquid(p, { R: 76, c: '#a82a18', op: 1, shine: false }),
            `<circle cx="96" cy="94" r="50" fill="#c84028" opacity=".35"/>`,
            sp.map(([x, y, r], i) => xmxShrimp(p, x, y, 36 + (i % 3) * 2, r, { c: '#e8643a', sauce: '#a82a18' })).join(''),
            xmxGrains(p, 100, 100, 140, { cols: ['#7a1a0c', '#c43a20'], n: 30, size: 1.4, seed: 2 }),
            xmxSliver(p, 92, 96, 16, 30, { c: '#f1e2c0' }), xmxSliver(p, 124, 120, 15, -40, { c: '#f1e2c0' }), xmxSliver(p, 72, 124, 14, 80, { c: '#f1e2c0' }),
            K.parsley(p, 104, 110, 10), K.parsley(p, 80, 80, 9), K.parsley(p, 132, 82, 9),
            xmxShine(100, 100, 72, .4),
        ].join('');
    },

    // Pescado al mojo de ajo: long white platter, two golden fillets in garlic butter with toasted garlic, guajillo rings, parsley and lime
    mx_pescado_ajo: p => [
        K.longPlate(p, { w: 188, h: 130 }),
        `<path d="${xmxSm([[24, 100], [44, 56], [100, 50], [160, 58], [178, 100], [158, 144], [100, 150], [40, 144]], true)}" fill="${p.rg('#ecc66a', .2, .2)}" opacity=".75"/>`,
        xmxGoldFillet(p, 76, 92, 96, 50, -10, { seed: 1 }),
        xmxGoldFillet(p, 122, 112, 98, 50, -10, { seed: 2 }),
        xmxGarlic(p, 76, 92, 66, { n: 14, seed: 1, c: '#e8b04a' }), xmxGarlic(p, 122, 112, 66, { n: 14, seed: 2, c: '#e8b04a' }),
        xmxGrains(p, 100, 102, 120, { cols: ['#d89a34'], n: 14, size: 1.6, seed: 5, sy: .6 }),
        xmxChiliRings(p, 100, 102, 110, { n: 10, seed: 1 }),
        K.parsley(p, 66, 86, 10), K.parsley(p, 128, 110, 10), K.parsley(p, 100, 98, 8),
        xmxLime(p, 162, 82, 26, 60), xmxLime(p, 38, 122, 24, -110),
    ].join(''),
    // Huevos rancheros: green Talavera plate, two fried eggs on corn tortillas under chunky salsa ranchera, refried beans with queso
    mx_huevos_rancheros: p => [
        xmxTalavera(p, { blue: '#2f7a4a', accent: '#e07a2a' }),
        `<g ${p.sh(1)}><path ${T(144, 136)} d="${xmxSm(ring(26, 10, .14, rng(p.id + 'bn'), 1.1, .9), true)}" fill="${p.rg('#6b4028', .2, .3, .4, .36)}" stroke="#4a2a18" stroke-width=".6"/></g>`,
        `<path d="M128,128 Q142,120 156,130 M130,144 Q144,136 158,146" stroke="#8a5a3c" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`,
        xmxQueso(p, 144, 134, 34, { n: 10, seed: 2 }),
        xmxTortilla(p, 74, 84, 82, 10, { seed: 1 }),
        xmxTortilla(p, 112, 106, 82, 40, { seed: 2 }),
        K.friedEgg(p, 74, 84, 66, 0), K.friedEgg(p, 112, 106, 66, 50),
        ...[[74, 84, 1], [112, 106, 2]].map(([x, y, s]) => `<g ${p.sh(.6)}><path ${T(x, y)} d="${xmxSm(ring(30, 12, .3, rng(p.id + 'sr' + s), 1, 1), true)}" fill="${p.rg('#c63a22', .2, .25)}" opacity=".95" mask="url(#${p.def('xmxRanchMask' + s, id => `<mask id="${id}"><rect x="-60" y="-60" width="120" height="120" fill="#fff"/><circle cx="${s === 1 ? 2 : -2}" cy="${s === 1 ? 1 : 3}" r="11" fill="#000"/></mask>`)})"/></g>` + xmxGrains(p, x, y, 52, { cols: ['#e8603e', '#9a2a14', '#f1e2c0'], n: 18, size: 2.2, seed: s }) + xmxRings(p, x, y, 46, { n: 4, seed: s, c: '#3f8a2c', rr: 2 })),
        xmxCilantro(p, 92, 70, 11, 20), xmxCilantro(p, 132, 92, 10, -40), xmxCilantro(p, 56, 106, 10, 60),
    ].join(''),

    // Tacos dorados de papa: enamel plate, four crisp rolled potato tacos with shredded lettuce, crema, queso fresco and red salsa
    mx_tacos_papa: p => [
        xmxPeltre(p, { rim: '#1d3f7a' }),
        ...[[100, 58], [100, 86], [100, 114], [100, 142]].map(([x, y], i) => xmxTaco(p, x, y, 130 - Math.abs(i - 1.5) * 18, 26, -6, { seed: i })),
        `<g ${p.sh(.6)}>${xmxShreds(p, 102, 100, 100, { c: '#9cc85a', n: 34, w: 2.4, len: .22, seed: 1, sy: .9, outline: false })}${xmxShreds(p, 102, 100, 92, { c: '#e2f0c0', n: 30, w: 2.2, len: .22, seed: 2, sy: .9, outline: false })}</g>`,
        `<g ${p.sh(.4)}><path d="M78,52 C90,62 82,76 96,84 C110,92 98,108 112,116 C124,124 112,140 124,150" stroke="#fbf8ee" stroke-width="4" fill="none" stroke-linecap="round"/></g>`,
        xmxQueso(p, 100, 100, 96, { n: 22, seed: 3, size: 2.4 }),
        `<path d="M58,70 C70,78 64,92 74,100 C84,108 76,124 86,134 M132,58 C140,70 132,82 142,92 C150,102 142,116 150,128" stroke="#b8301c" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".9"/>`,
    ].join(''),

    // Calabacitas con puerco: cazuela, browned pork cubes with zucchini, corn and tomato in a light tomato broth
    mx_puerco_calabacitas: p => {
        const sp = xmxSpots('pc', 23, 58, 14);
        return [
            xmxCazuela(p, { R: 86 }),
            K.liquid(p, { R: 74, c: '#c8642e', op: 1, shine: false }),
            `<circle cx="96" cy="94" r="50" fill="#e08a50" opacity=".3"/>`,
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => i % 3 === 0 ? xmxChunk(p, x, y, 25, r, { c: '#b86e38', seed: i, sauce: '#c8642e' }) : i % 3 === 1 ? xmxDice(p, x, y, 15, r, '#d8dc98', { skin: '#4a7a2e' }) : xmxTomPiece(p, x, y, 15, r, { seed: i })).join(''),
            `</g>`,
            K.corn(p, 100, 100, 120, { n: 18 }),
            xmxRings(p, 100, 100, 100, { n: 6, seed: 2, c: '#3f8a2c', rr: 2 }),
            xmxShine(100, 100, 72, .35),
        ].join('');
    },

    // Arroz con pollo: cazuela of tomato rice with browned chicken pieces, peas, carrot and green pepper
    mx_arroz_pollo: p => [
        xmxCazuela(p, { R: 86, glaze: '#6e3d18' }),
        xmxRice(p, 100, 100, 150, { tint: '#e8a050', density: .78, grain: 3.6, hiK: .45 }),
        `<g ${p.sh(.5)}>`,
        ...xmxSpots('ap', 12, 60, 14).map(([x, y, r], i) => i % 2 ? xmxDice(p, x, y, 8, r, '#ef8a34') : xmxDice(p, x, y, 8, r, '#5a9a34')),
        `</g>`,
        xmxPeas(p, 100, 100, 128, { n: 18, seed: 2, sz: 2.8 }),
        `<g ${p.sh(1)}>`,
        xmxDrum(p, 76, 80, 70, 30, { c: '#c8843e' }),
        `<path ${T(130, 92)} d="${xmxSm(ring(20, 9, .2, rng(p.id + 't1'), 1.2, .85), true)}" fill="${p.g('#c8843e', .3, .3)}" stroke="#7a4a1c" stroke-width=".8"/>`,
        `<path ${T(100, 130)} d="${xmxSm(ring(19, 9, .2, rng(p.id + 't2'), 1.2, .85), true)}" fill="${p.g('#c07a36', .3, .3)}" stroke="#7a4a1c" stroke-width=".8"/>`,
        `</g>`,
        xmxArc('M118,82 Q128,76 140,80', 1.6, .6), xmxArc('M88,122 Q98,116 110,120', 1.6, .6),
        xmxCilantro(p, 112, 106, 11, 30), xmxCilantro(p, 64, 116, 10, -40),
    ].join(''),

    // Espagueti verde: white plate, spaghetti in creamy poblano-cilantro sauce, grated cheese, cilantro
    mx_espagueti_verde: p => [
        K.plate(p, { rim: '#2f7a4a' }),
        `<g ${p.sh(.8)}><path ${T(100, 100)} d="${xmxSm(ring(66, 14, .1, rng(p.id + 'b')), true)}" fill="${p.rg('#a9bc62', .2, .25)}"/></g>`,
        xmxNoodles(p, 100, 100, 130, { c: '#c6d27e', w: 2.8, n: 56, seed: 1, outline: '#7f9a3a', hi: .4 }),
        xmxNoodles(p, 100, 98, 92, { c: '#d2dc8c', w: 2.8, n: 20, seed: 2, outline: '#7f9a3a', hi: .4 }),
        `<path d="M74,86 Q92,76 110,86 M86,116 Q104,108 122,118" stroke="#9cb24c" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>`,
        xmxGrains(p, 100, 96, 70, { cols: ['#fbf1c8', '#f3dc8a'], n: 40, size: 1.4, seed: 3 }),
        xmxCilantro(p, 100, 92, 14, 20), xmxCilantro(p, 112, 102, 11, -40),
        xmxRaja(p, 70, 120, 26, 6, 30), xmxRaja(p, 134, 82, 24, 6, -50),
    ].join(''),

    // Pechugas en crema de chipotle: Talavera plate, seared chicken breast fillets in a creamy orange chipotle sauce with mushrooms and onion
    mx_pollo_chipotle: p => [
        xmxTalavera(p, { blue: '#1f4e9c', accent: '#e07a2a' }),
        K.pool(p, 100, 100, 148, '#d9874a', { op: .97, seed: 1, sy: .92 }),
        `<circle cx="94" cy="92" r="48" fill="#eaa66c" opacity=".35"/>`,
        xmxBreast(p, 84, 86, 104, 58, -20, { seed: 1, c: '#d8a062' }),
        xmxBreast(p, 116, 120, 100, 56, -20, { seed: 2, c: '#d8a062' }),
        `<g ${xmxBlur(p, 2)}><ellipse cx="70" cy="84" rx="12" ry="7" fill="#a8622a" opacity=".45"/><ellipse cx="128" cy="124" rx="12" ry="7" fill="#a8622a" opacity=".45"/></g>`,
        `<path ${T(96, 92, -20)} d="${xmxSm(ring(1, 10, .3, rng(p.id + 'c1'), 34, 16), true)}" fill="${p.g('#e0864a', .3, .2)}" opacity=".92"/><path ${T(110, 118, -20)} d="${xmxSm(ring(1, 10, .3, rng(p.id + 'c2'), 30, 15), true)}" fill="${p.g('#e0864a', .3, .2)}" opacity=".92"/>`,
        xmxArc('M76,90 C86,82 100,82 112,84', 1.8, .55), xmxArc('M92,116 C100,110 112,110 124,112', 1.6, .5),
        `<g ${p.sh(.6)}>`,
        xmxMush(p, 70, 74, 20, 20), xmxMush(p, 132, 70, 19, -30), xmxMush(p, 148, 112, 18, 60), xmxMush(p, 84, 140, 19, -10), xmxMush(p, 104, 100, 18, 40), xmxMush(p, 58, 116, 17, 80),
        `</g>`,
        xmxSliver(p, 92, 80, 16, 20, { c: '#f0dfb0' }), xmxSliver(p, 128, 128, 15, -30, { c: '#f0dfb0' }), xmxSliver(p, 122, 92, 14, 60, { c: '#f0dfb0' }),
        K.parsley(p, 98, 116, 9), K.parsley(p, 76, 96, 8),
    ].join(''),

    // Papas con chorizo: cast-iron skillet, golden potato dice tossed with crumbly red chorizo, onion and cilantro
    mx_chorizo_papas: p => {
        const sp = xmxSpots('chp', 30, 56, 12, 92, 92);
        return [
            xmxSkillet(p),
            `<circle cx="92" cy="92" r="66" fill="${p.rg('#a8401c', .2, .3)}"/>`,
            xmxGrains(p, 92, 92, 128, { cols: ['#9a3216', '#c04a22', '#7a2410'], n: 80, size: 3, seed: 1 }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => xmxDice(p, x, y, 13, r, i % 3 ? '#e9b45a' : '#d89a3e')).join(''),
            `</g>`,
            xmxGrains(p, 92, 92, 120, { cols: ['#b8401c', '#8a2a12'], n: 50, size: 2.2, seed: 2 }),
            xmxOil(p, 92, 92, 120, { n: 10, c: '#e86a2a', seed: 1, op: .6, rmax: 1.6 }),
            xmxBits(p, 92, 92, 100, { n: 10, seed: 3, cols: ['#f3e6c8'] }),
            xmxCilantro(p, 92, 84, 11, 20), xmxCilantro(p, 116, 108, 10, -40), xmxCilantro(p, 66, 104, 10, 70),
        ].join('');
    },

    // Salpicón de res: plate with a lettuce border, shredded beef tossed with tomato, onion, avocado and radish, a tostada alongside
    mx_salpicon: p => {
        const sp = xmxSpots('sal', 18, 46, 14, 96, 100);
        return [
            K.plate(p, { rim: '#1f4e9c' }),
            `<g ${p.sh(.7)}><path ${T(100, 100)} d="${xmxSm(ring(70, 16, .14, rng(p.id + 'lt')), true)}" fill="${p.g('#a8cf6a', .3, .25)}" stroke="#6f9a3a" stroke-width=".8"/></g>`,
            xmxShreds(p, 100, 100, 136, { c: '#b9da7c', n: 30, w: 2.2, len: .2, seed: 4, outline: false }),
            `<g ${p.sh(.8)}><path ${T(96, 100)} d="${xmxSm(ring(54, 13, .14, rng(p.id + 'm')), true)}" fill="#b98a5c"/></g>`,
            xmxShreds(p, 96, 100, 104, { c: '#a87448', n: 70, w: 2.4, len: .22, seed: 1, curve: .4 }),
            xmxShreds(p, 96, 100, 96, { c: '#c99a6a', n: 30, w: 2, len: .2, seed: 2, curve: .4 }),
            `<g ${p.sh(.5)}>`,
            sp.map(([x, y, r], i) => i % 3 === 0 ? xmxTomDice(p, x, y, 10, r) : i % 3 === 1 ? xmxAvo(p, x, y, 11, r) : xmxDice(p, x, y, 8, r, '#f6f0e2')).join(''),
            `</g>`,
            xmxRadish(p, 76, 86, 13), xmxRadish(p, 118, 116, 13), xmxRadish(p, 108, 74, 12),
            xmxCilantro(p, 92, 104, 10, 20), xmxCilantro(p, 124, 92, 10, -40),
            xmxTotopo(p, 154, 138, 34, -40, { seed: 1 }),
        ].join('');
    },

    // Molletes: wooden board, four toasted bolillo halves with refried beans and melted cheese, topped with pico de gallo
    mx_molletes: p => {
        const pos = [[66, 72, -20], [134, 70, 20], [66, 130, 20], [134, 128, -20]];
        return [
            xmxBoard(p, { c: '#b88048' }),
            ...pos.map(([x, y, r], i) => xmxMollete(p, x, y, 74, 52, r, { seed: i })),
            ...pos.map(([x, y], i) => `<g ${p.sh(.4)}>` + xmxSpots('mp' + i, 7, 13, 7, x, y).map(([a, b, r], j) => j % 3 === 1 ? xmxDice(p, a, b, 6, r, '#f7f2e6') : xmxTomDice(p, a, b, 7, r)).join('') + `</g>` + xmxBits(p, x, y, 26, { n: 6, seed: i })),
        ].join('');
    },

    // Atún a la mexicana: blue enamel bowl, flaked tuna sautéed with tomato, onion and serrano, a tostada tucked in
    mx_atun_mexicana: p => {
        const sp = xmxSpots('atn', 16, 56, 15);
        return [
            xmxPeltreBowl(p, { out: '#2f6fb0' }),
            `<circle cx="100" cy="100" r="72" fill="${p.rg('#c8946a', .2, .25)}"/>`,
            `<g ${p.sh(.6)}>${xmxGrains(p, 100, 100, 132, { cols: ['#dcae8a', '#c48e68', '#ecc8a8'], n: 30, size: 8.4, seed: 1 })}</g>`,
            xmxGrains(p, 100, 100, 128, { cols: ['#f6dcc0'], n: 26, size: 2.4, seed: 5 }),
            xmxGrains(p, 100, 100, 130, { cols: ['#9a6038'], n: 26, size: 1.4, seed: 4 }),
            `<g ${p.sh(.5)}>`,
            sp.map(([x, y, r], i) => i % 3 === 2 ? xmxDice(p, x, y, 8, r, '#f6f0e2') : xmxTomPiece(p, x, y, 13, r, { seed: i })).join(''),
            `</g>`,
            xmxRings(p, 100, 100, 110, { n: 12, seed: 2, c: '#3f8a2c', rr: 2 }),
            xmxCilantro(p, 92, 92, 11, 20), xmxCilantro(p, 118, 118, 10, -40),
            `<g ${p.sh(1)}>${xmxTortilla(p, 150, 62, 54, 0, { seed: 1, c: '#e9c25a', edge: '#a8762a', crisp: true })}</g>`,
        ].join('');
    },
    // Salsa verde: painted barro cajete full of bright tomatillo salsa with seeds, chopped onion and cilantro, a serrano on the rim
    mx_salsa_verde: p => [
        xmxBarro(p),
        K.liquid(p, { R: 76, c: '#6f9a2e', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="52" fill="#9cc04a" opacity=".35"/>`,
        xmxGrains(p, 100, 100, 144, { cols: ['#557a1e', '#a8c862', '#4a6a18'], n: 110, size: 1.8, seed: 1 }),
        xmxGrains(p, 100, 100, 130, { cols: ['#eef0c8'], n: 40, size: 1, seed: 2 }),
        xmxBits(p, 104, 98, 60, { n: 14, seed: 3, cols: ['#f6f2e4', '#efe8d4'] }),
        xmxCilantro(p, 96, 92, 15, 20), xmxCilantro(p, 112, 106, 12, -50),
        xmxChili(p, 138, 136, 42, -40, { c: '#3f8a2c', bend: 4 }),
        xmxShine(100, 100, 72, .5),
    ].join(''),

    // Salsa roja asada: molcajete of chunky fire-roasted tomato salsa with charred skins, seeds and toasted chiles de árbol
    mx_salsa_roja: p => [
        xmxMolcajete(p),
        `<g ${p.sh(.8)}><path ${T(100, 100)} d="${xmxSm(ring(66, 14, .08, rng(p.id + 's')), true)}" fill="${p.rg('#c4361e', .2, .3, .4, .36)}"/></g>`,
        xmxGrains(p, 100, 100, 126, { cols: ['#a82814', '#e05a36', '#8a1e0e'], n: 90, size: 2.4, seed: 1 }),
        xmxGrains(p, 100, 100, 120, { cols: ['#3a1e10'], n: 22, size: 1.6, seed: 2 }),
        xmxGrains(p, 100, 100, 120, { cols: ['#f6d08a'], n: 26, size: .9, seed: 3 }),
        `<g ${p.sh(.6)}>`, xmxTomPiece(p, 84, 88, 20, 20, { seed: 1, c: '#c8361e' }), xmxTomPiece(p, 118, 112, 18, -60, { seed: 2, c: '#c8361e' }), `</g>`,
        xmxBits(p, 104, 100, 50, { n: 8, seed: 4, cols: ['#f3ead6'] }),
        xmxChili(p, 130, 70, 36, 30, { c: '#9a1c10', bend: 3 }), xmxChili(p, 72, 128, 34, -150, { c: '#a8200f', bend: 3 }),
        xmxShine(100, 100, 62, .4),
    ].join(''),

    // Salsa de aguacate: blue Talavera bowl, smooth pale-green creamy avocado-tomatillo salsa, cilantro
    mx_salsa_aguacate: p => [
        xmxTalaveraBowl(p),
        K.liquid(p, { R: 74, c: '#9cbf55', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="52" fill="#c4dc84" opacity=".45"/>`,
        `<path d="M58,108 C72,84 104,80 122,92 C136,102 132,122 112,124 C96,126 92,110 104,104" stroke="#b9d474" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/><path d="M60,112 C74,90 104,86 120,96" stroke="#7fa23c" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5" transform="translate(1 3)"/>`,
        xmxGrains(p, 100, 100, 130, { cols: ['#6f9a30'], n: 24, size: .9, seed: 2 }),
        xmxCilantro(p, 108, 96, 22, 20), xmxCilantro(p, 90, 110, 17, -60), xmxCilantro(p, 120, 116, 14, 80),
        xmxChili(p, 136, 136, 34, -40, { c: '#3f8a2c', bend: 3 }),
        xmxShine(100, 100, 70, .55),
    ].join(''),

    // Salsa macha: red enamel bowl of dark brick-red chile oil thick with crunchy chile flakes, peanuts, garlic and sesame
    mx_salsa_macha: p => [
        xmxPeltreBowl(p, { out: '#c8392e', rim: '#7a1a12' }),
        K.liquid(p, { R: 74, c: '#7a1e0e', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#b8341a" opacity=".45"/>`,
        xmxGrains(p, 100, 100, 136, { cols: ['#5a1408', '#9a2a12', '#3a0c04'], n: 110, size: 2.4, seed: 1 }),
        `<g ${p.sh(.5)}>`,
        ...xmxSpots('mac', 14, 54, 15).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="6" ry="4.2" fill="${p.g('#d8a050', .3, .3)}" stroke="#8a5a20" stroke-width=".5"/><path d="M0,-4 L0,4" stroke="#a8743a" stroke-width=".6"/></g>`),
        `</g>`,
        xmxGarlic(p, 100, 100, 100, { n: 6, seed: 2, c: '#d8983a' }),
        K.sesame(p, 100, 100, 110, { n: 30, c: '#f3e2b8', seed: 1 }),
        xmxOil(p, 100, 100, 120, { n: 14, c: '#d8401c', seed: 2, op: .55 }),
        xmxShine(100, 100, 70, .55),
    ].join(''),

    // Cebolla morada encurtida: green Talavera bowl heaped with lime-pickled magenta red onion, habanero bits and oregano
    mx_cebolla_morada: p => {
        const sp = xmxSpots('cm', 34, 60, 12);
        return [
            xmxTalaveraBowl(p, { blue: '#2f7a4a', accent: '#d8a03a' }),
            `<circle cx="100" cy="100" r="72" fill="#d886b0"/>`,
            `<g ${p.sh(.5)}>`,
            sp.map(([x, y, r], i) => { const L = 30 + (i % 3) * 6, c = i % 3 === 0 ? '#f4c2da' : i % 3 === 1 ? '#de5c98' : '#c03a78'; return `<path ${T(x, y, r)} d="M${-L / 2},0 Q0,${-L * .3} ${L / 2},0" stroke="${dk(c, .3)}" stroke-width="6.4" fill="none" stroke-linecap="round"/><path ${T(x, y, r)} d="M${-L / 2},0 Q0,${-L * .3} ${L / 2},0" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>`; }).join(''),
            `</g>`,
            `<path d="${sp.slice(0, 18).map(([x, y, r]) => { const L = 26, a = r / 57.3; return `M${f1(x - Math.cos(a) * L * .3)},${f1(y - Math.sin(a) * L * .3 - 2.4)}l${f1(Math.cos(a) * L * .5)},${f1(Math.sin(a) * L * .5)}`; }).join('')}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>`,
            xmxGrains(p, 100, 100, 100, { cols: ['#f28a1c', '#f6b42a'], n: 18, size: 1.6, seed: 2 }),
            xmxGrains(p, 100, 100, 120, { cols: ['#5a6a2a'], n: 20, size: .8, seed: 3 }),
            xmxLime(p, 146, 132, 24, 30),
        ].join('');
    },

    // Chiles en escabeche: clay bowl of pickled jalapeños with carrot rounds, onion petals, garlic cloves and bay leaf in their vinegar
    mx_chiles_escabeche: p => [
        K.bowl(p, { R: 92, glaze: '#a85a2e', inside: '#f1e6cf' }),
        K.liquid(p, { R: 76, c: '#d6c47a', op: .85, shine: false }),
        `<g ${p.sh(.6)}>`,
        ...xmxSpots('esc', 16, 60, 17).map(([x, y], i) => K.carrotRound(p, x, y, 17 + (i % 3))),
        `</g>`,
        xmxSliver(p, 78, 120, 24, 30, { c: '#f3ecd8', w: 4 }), xmxSliver(p, 124, 80, 22, -40, { c: '#f3ecd8', w: 4 }), xmxSliver(p, 100, 140, 20, 100, { c: '#f3ecd8', w: 4 }),
        xmxJalapeno(p, 88, 80, 58, -20), xmxJalapeno(p, 114, 114, 60, 160, { c: '#4f6e24' }), xmxJalapeno(p, 68, 106, 52, 70, { c: '#62822e' }), xmxJalapeno(p, 136, 84, 48, 110, { c: '#56762a' }),
        xmxJalapeno(p, 134, 104, 16, 0, { ring: true }), xmxJalapeno(p, 96, 62, 15, 0, { ring: true }), xmxJalapeno(p, 120, 138, 15, 0, { ring: true }),
        xmxClove(p, 108, 92, 13, 30), xmxClove(p, 60, 84, 12, -40),
        xmxBay(p, 140, 76, 26, -30),
        xmxShine(100, 100, 72, .5),
    ].join(''),

    // Chiles toreados: clay plate of blistered, oil-glossed serranos with charred cebollitas, lime halves and coarse salt
    mx_chiles_toreados: p => [
        xmxClayPlate(p, { clay: '#c27440', glaze: '#9a5428' }),
        xmxCebollita(p, 92, 146, 86, -8), xmxCebollita(p, 100, 132, 82, -2),
        ...[[76, 62, -20], [118, 58, -8], [64, 90, 14], [104, 82, -28], [142, 84, 50], [86, 110, -6], [128, 108, 24]].map(([x, y, r], i) => xmxToreado(p, x, y, 60, r, { c: i % 3 === 2 ? '#6a9a34' : '#4f8a2a', seed: i })),
        `<g ${p.sh(.6)}><circle cx="148" cy="130" r="13" fill="#3f8f2b"/><circle cx="148" cy="130" r="11" fill="${p.rg('#d8eb98', .2, .15)}"/></g>`,
        `<path d="M148,120 L148,140 M138,130 L158,130 M141,123 L155,137 M155,123 L141,137" stroke="#f6fbe2" stroke-width=".8"/>`,
        xmxGrains(p, 100, 96, 100, { cols: ['#ffffff'], n: 18, size: .8, seed: 2 }),
        xmxArc('M60,74 Q80,60 104,58', 1.6, .5),
    ].join(''),

    // Esquites: clay cup heaped with tender corn kernels, mayonnaise, crumbled cotija, chile powder, lime and epazote
    mx_esquites: p => {
        const R = rng(p.id + 'k');
        let k = '';
        for (let i = 0; i < 150; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 66, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; k += `M${f1(x - 2.6)},${f1(y - 2.2)}h5.2v4.4h-5.2Z`; }
        return [
            K.bowl(p, { R: 90, glaze: '#c4683a', inside: '#f3e6cc' }),
            `<circle cx="100" cy="100" r="74" fill="${p.rg('#e8b83a', .2, .3)}"/>`,
            `<g ${p.sh(.4)}><path d="${k}" fill="${p.g('#f6d24a', .35, .2)}" stroke="#c8961a" stroke-width=".5" stroke-linejoin="round"/></g>`,
            `<g ${p.sh(.4)}><path d="M64,86 C80,74 96,94 112,82 C124,74 134,82 140,90 M66,116 C84,104 100,124 118,112 C128,106 136,112 140,118" stroke="#fbf6e2" stroke-width="5" fill="none" stroke-linecap="round"/></g>`,
            xmxQueso(p, 100, 100, 110, { n: 34, seed: 2, size: 2.6 }),
            xmxChilePowder(p, 100, 100, 110, 60, 1),
            K.greens(p, 84, 120, 22, { c: '#3f7a2a', n: 3, seed: 2 }),
            xmxLime(p, 140, 66, 28, 30),
        ].join('');
    },

    // Frijoles charros: painted barro bowl, pinto beans in their smoky broth with bacon, chorizo, tomato, serrano and cilantro
    mx_frijoles_charros: p => [
        xmxBarro(p, { clay: '#a8562a', inside: '#5e2c12' }),
        K.liquid(p, { R: 76, c: '#7a4426', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#9a5a34" opacity=".35"/>`,
        xmxBeans(p, 100, 100, 138, { n: 64, cols: ['#b8845a', '#a87048', '#c8946a'], speck: '#6a3a1e', size: 4.2, seed: 1 }),
        `<g ${p.sh(.6)}>`,
        K.bacon(p, 76, 80, 20, 9, 30), K.bacon(p, 126, 90, 20, 9, -20), K.bacon(p, 98, 128, 20, 9, 60), K.bacon(p, 136, 124, 18, 8, 10),
        `</g>`,
        xmxGrains(p, 100, 100, 110, { cols: ['#a8361a', '#c84a22'], n: 22, size: 2.6, seed: 2 }),
        xmxTomPiece(p, 104, 92, 14, 20, { seed: 1 }), xmxTomPiece(p, 70, 116, 13, -40, { seed: 2 }),
        xmxRings(p, 100, 100, 100, { n: 6, seed: 3, c: '#3f8a2c', rr: 2 }),
        xmxBits(p, 100, 100, 110, { n: 18, seed: 4 }),
        xmxCilantro(p, 118, 110, 12, 30), xmxCilantro(p, 84, 98, 11, -40),
        xmxShine(100, 100, 72, .45),
    ].join(''),

    // Arroz verde: blue Talavera bowl of green poblano-cilantro rice with corn kernels and a cilantro sprig
    mx_arroz_verde: p => [
        xmxTalaveraBowl(p),
        xmxRice(p, 100, 100, 148, { tint: '#9cbf5a', density: .85, grain: 3.8, hiK: .45 }),
        K.corn(p, 100, 100, 110, { n: 24 }),
        xmxCilantro(p, 108, 92, 16, 20), xmxCilantro(p, 94, 104, 13, -40), xmxCilantro(p, 116, 108, 11, 70),
        `<path d="M50,84 Q58,60 84,50" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".4"/>`,
    ].join(''),
    // Papas a la mexicana: enamel plate, golden sautéed potato dice with tomato, onion and serrano
    mx_papas_mexicana: p => {
        const sp = xmxSpots('pm', 34, 60, 12);
        return [
            xmxPeltre(p, { rim: '#2f6a3a' }),
            `<g ${p.sh(.8)}><path ${T(100, 100)} d="${xmxSm(ring(68, 14, .1, rng(p.id + 'b')), true)}" fill="${p.rg('#d9a050', .2, .25)}"/></g>`,
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => i % 4 === 3 ? xmxTomPiece(p, x, y, 14, r, { seed: i }) : xmxDice(p, x, y, 15, r, i % 2 ? '#ecc062' : '#e0a848')).join(''),
            `</g>`,
            xmxBits(p, 100, 100, 120, { n: 18, seed: 2, cols: ['#f6f0e0', '#efe6cc'] }),
            xmxRings(p, 100, 100, 112, { n: 10, seed: 3, c: '#3f8a2c', rr: 2 }),
            xmxCilantro(p, 96, 92, 11, 20), xmxCilantro(p, 124, 116, 10, -50),
        ].join('');
    },

    // Ensalada de col: blue Talavera bowl, finely shredded cabbage with grated carrot, diced tomato, cilantro and lime
    mx_ensalada_col: p => [
        xmxTalaveraBowl(p),
        `<circle cx="100" cy="100" r="72" fill="#e6efc8"/>`,
        `<g ${p.sh(.5)}>`,
        xmxShreds(p, 100, 100, 144, { c: '#cfe39e', n: 90, w: 2.8, len: .2, seed: 1, outline: false }),
        xmxShreds(p, 100, 100, 140, { c: '#f6f9ea', n: 80, w: 2.6, len: .2, seed: 2, outline: false }),
        xmxShreds(p, 100, 100, 120, { c: '#ef8a34', n: 34, w: 1.8, len: .16, seed: 3, outline: false }),
        ...xmxSpots('ec', 12, 56, 15).map(([x, y, r]) => xmxTomDice(p, x, y, 10, r)),
        `</g>`,
        xmxBits(p, 100, 100, 120, { n: 22, seed: 4 }),
        xmxLime(p, 146, 130, 26, 20),
    ].join(''),

    // Ensalada de betabel: white bowl, ruby beet dice in their juice with grated carrot, orange-lime dressing and chopped peanuts
    mx_ensalada_betabel: p => {
        const sp = xmxSpots('bt', 30, 60, 12);
        return [
            K.bowl(p, { R: 92, glaze: '#e9e3d6', inside: '#faf7f0' }),
            `<circle cx="100" cy="100" r="72" fill="${p.rg('#8e1a3e', .2, .3)}"/>`,
            `<g ${p.sh(.6)}>`,
            sp.map(([x, y, r], i) => xmxDice(p, x, y, 14, r, i % 2 ? '#a3204a' : '#8a1a3c')).join(''),
            `</g>`,
            xmxShreds(p, 100, 100, 110, { c: '#f08a30', n: 30, w: 2, len: .2, seed: 1 }),
            xmxGrains(p, 100, 100, 110, { cols: ['#e8c48a', '#d4a868'], n: 34, size: 2.2, seed: 2 }),
            K.parsley(p, 104, 96, 11),
            xmxShine(100, 100, 70, .5),
        ].join('');
    },

    // Ensalada rusa: green Talavera bowl, creamy potato, carrot and pea salad in mayonnaise, topped with boiled egg and parsley
    mx_ensalada_rusa: p => {
        const sp = xmxSpots('er', 28, 60, 13);
        return [
            xmxTalaveraBowl(p, { blue: '#2f7a4a', accent: '#d8a03a' }),
            `<g ${p.sh(.8)}><path ${T(100, 100)} d="${xmxSm(ring(70, 14, .08, rng(p.id + 'b')), true)}" fill="${p.rg('#f3e8c8', .2, .2)}"/></g>`,
            `<g ${p.sh(.4)}>`,
            sp.map(([x, y, r], i) => i % 4 === 3 ? xmxDice(p, x, y, 10, r, '#f08a3c') : xmxDice(p, x, y, 14, r, '#f2e4b4')).join(''),
            `</g>`,
            `<g opacity=".55">${sp.map(([x, y]) => `<circle cx="${f(x + 4)}" cy="${f(y + 3)}" r="6" fill="#fbf6e4"/>`).join('')}</g>`,
            xmxPeas(p, 100, 100, 124, { n: 22, seed: 2, sz: 2.8 }),
            K.eggHalf(p, 92, 92, 30, -20), K.eggHalf(p, 116, 110, 28, 30),
            K.parsley(p, 104, 98, 9), K.parsley(p, 72, 124, 8),
        ].join('');
    },

    // Jícama y pepino con chile: plate with crisp jicama and cucumber sticks dusted with chile-lime powder, lime halves
    mx_jicama: p => {
        const sticks = [];
        for (let i = 0; i < 12; i++){ const a = -60 + i * 10; sticks.push([100 + Math.cos(a / 57.3) * 4 + (i - 6) * 9, 98 + (i % 2) * 6, 80 + (i % 3) * 6 - 3, i]); }
        return [
            K.plate(p, { rim: '#c8392e' }),
            ...sticks.map(([x, y, r, i]) => i % 2 ? xmxStick(p, x, y, 104, 12, r, { c: '#f8f4e6', skin: '#c49a68', sk: .16 }) : xmxStick(p, x, y, 100, 12, r, { c: '#d8eab0', skin: '#3f7a2a', sk: .26 })),
            xmxChilePowder(p, 100, 92, 100, 90, 1),
            `<g ${p.sh(.6)}><circle cx="150" cy="140" r="14" fill="#3f8f2b"/><circle cx="150" cy="140" r="12" fill="${p.rg('#d8eb98', .2, .15)}"/><circle cx="52" cy="62" r="13" fill="#3f8f2b"/><circle cx="52" cy="62" r="11" fill="${p.rg('#d8eb98', .2, .15)}"/></g>`,
            `<path d="M150,129 v22 M139,140 h22 M142,132 l16,16 M158,132 l-16,16 M52,52 v20 M42,62 h20 M45,55 l14,14 M59,55 l-14,14" stroke="#f6fbe2" stroke-width=".8"/>`,
        ].join('');
    },

    // Chayotes con crema: cazuela, pale-green chayote pieces in cream with corn, roasted poblano strips and queso fresco
    mx_chayotes: p => {
        const sp = xmxSpots('chy', 18, 56, 18);
        return [
            xmxCazuela(p, { R: 86, glaze: '#6e3d18' }),
            K.liquid(p, { R: 74, c: '#efe4c4', op: 1, shine: false }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => `<g ${T(x, y, r)}><path d="M-11,-6 Q0,-11 11,-6 Q12,4 6,8 Q0,10 -6,8 Q-12,4 -11,-6Z" fill="${p.g(i % 2 ? '#c9dc94' : '#bcd486', .3, .2)}" stroke="#7f9a4a" stroke-width=".6"/><path d="M-9,-5 Q0,-9 9,-5" stroke="#6f9a3a" stroke-width="1.6" fill="none" opacity=".6"/><ellipse cx="0" cy="1" rx="3" ry="2" fill="#eef4d6" opacity=".7"/></g>`).join(''),
            `</g>`,
            xmxRaja(p, 82, 92, 34, 7, 30), xmxRaja(p, 124, 112, 32, 7, -40), xmxRaja(p, 104, 70, 28, 6, 80), xmxRaja(p, 74, 128, 28, 6, -10),
            K.corn(p, 100, 100, 120, { n: 22 }),
            `<path d="M66,84 C80,74 94,90 110,80 M80,118 C96,108 108,124 128,116" stroke="#fbf6e6" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".85"/>`,
            xmxQueso(p, 100, 100, 100, { n: 18, seed: 3 }),
            xmxShine(100, 100, 72, .4),
        ].join('');
    },

    // Ejotes a la mexicana: enamel plate, green bean pieces sautéed with tomato, onion and serrano
    mx_ejotes: p => {
        const sp = xmxSpots('ej', 40, 62, 10);
        return [
            xmxPeltre(p, { rim: '#1d3f7a' }),
            `<g ${p.sh(.8)}><path ${T(100, 100)} d="${xmxSm(ring(68, 14, .1, rng(p.id + 'b')), true)}" fill="${p.rg('#cf6a3a', .2, .25)}"/></g>`,
            `<g ${p.sh(.6)}>`,
            sp.map(([x, y, r], i) => i % 5 === 4 ? xmxTomPiece(p, x, y, 13, r, { seed: i }) : `<g ${T(x, y, r)}><rect x="-13" y="-2.8" width="26" height="5.6" rx="2.8" fill="${p.g(i % 2 ? '#4f9a34' : '#5aa63c', .3, .25)}" stroke="#2f6a1e" stroke-width=".5"/><path d="M-10,-1.2 h16" stroke="#c8e8a0" stroke-width=".9" stroke-linecap="round" opacity=".7"/></g>`).join(''),
            `</g>`,
            xmxBits(p, 100, 100, 120, { n: 14, seed: 2, cols: ['#f6f0e0'] }),
            xmxRings(p, 100, 100, 110, { n: 6, seed: 3, c: '#2f7a22', rr: 2 }),
        ].join('');
    },

    // Plátanos fritos: Talavera plate, caramelised ripe plantain slices with a drizzle of crema and crumbled queso fresco
    mx_platanos_fritos: p => [
        xmxTalavera(p, { blue: '#1f4e9c', accent: '#e07a2a' }),
        ...[[70, 70, 30], [118, 64, 20], [150, 98, 60], [62, 108, -10], [104, 100, 30], [140, 136, -20], [84, 140, 40], [116, 126, 10]].map(([x, y, r]) => xmxPlantain(p, x, y, 52, 30, r)),
        `<g ${p.sh(.5)}><path d="M56,90 C74,76 90,104 112,86 C128,72 142,92 156,80" stroke="#fbf8ee" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60,126 C80,112 98,138 120,120 C134,110 144,124 152,116" stroke="#fbf8ee" stroke-width="3.6" fill="none" stroke-linecap="round"/></g>`,
        xmxQueso(p, 104, 104, 110, { n: 22, seed: 2, size: 2.4 }),
    ].join(''),

    // Nopales asados: enamel plate, two whole grilled nopal paddles with grilled panela, cebollitas and lime
    mx_nopales_asados: p => [
        xmxPeltre(p, { rim: '#2f6a3a' }),
        xmxPaddle(p, 88, 76, 112, 66, -20, { seed: 1 }),
        xmxPaddle(p, 112, 118, 108, 62, 15, { seed: 2, c: '#6a9238' }),
        xmxPanela(p, 66, 132, 40, 28, -15), xmxPanela(p, 144, 76, 36, 26, 30),
        xmxCebollita(p, 140, 148, 54, -30),
        xmxLime(p, 52, 92, 24, -80),
        xmxGrains(p, 100, 100, 110, { cols: ['#ffffff'], n: 14, size: .8, seed: 1 }),
    ].join(''),

    // Champiñones al ajillo: small cazuela of sliced mushrooms sautéed with golden garlic, guajillo rings and epazote
    mx_champinones: p => {
        const sp = xmxSpots('chm', 22, 58, 16);
        return [
            xmxCazuela(p, { R: 86, glaze: '#5e3214' }),
            K.liquid(p, { R: 74, c: '#a8682e', op: 1, shine: false }),
            `<circle cx="96" cy="94" r="50" fill="#c88a48" opacity=".35"/>`,
            sp.map(([x, y, r], i) => xmxMush(p, x, y, 26 + (i % 3) * 2, r, { cooked: .7 + (i % 3) * .1, edge: '#7a5230' })).join(''),
            xmxGarlic(p, 100, 100, 120, { n: 14, seed: 1, c: '#e8b04a' }),
            xmxChiliRings(p, 100, 100, 120, { n: 10, seed: 2 }),
            K.greens(p, 100, 100, 70, { c: '#3f7a2a', n: 5, seed: 3 }),
            xmxShine(100, 100, 72, .45),
        ].join('');
    },
    // Pozole rojo: painted barro bowl, deep red guajillo broth with puffed hominy and pork, topped with shredded cabbage, radish, onion, oregano and lime
    mx_pozole_rojo: p => {
        const hom = xmxSpots('pzr', 20, 62, 15);
        return [
            xmxBarro(p),
            xmxBroth(p, 76, '#b5361f', { glow: .3 }),
            `<g ${p.sh(.8)}>`,
            xmxChunk(p, 70, 84, 30, 20, { c: '#b8794a', seed: 1, sauce: '#b5361f' }), xmxChunk(p, 128, 118, 30, -30, { c: '#b8794a', seed: 2, sauce: '#b5361f' }), xmxChunk(p, 86, 132, 26, 70, { c: '#c08452', seed: 3, sauce: '#b5361f' }),
            `</g>`,
            `<g ${p.sh(.5)}>${hom.map(([x, y, r], i) => xmxHominy(p, x, y, 18 + (i % 3) * 1.5, r, { tint: '#d8603a' })).join('')}</g>`,
            xmxVeil(76, '#b5361f', .12),
            xmxOil(p, 100, 100, 140, { n: 14, c: '#e8602a', seed: 1, op: .6 }),
            `<g ${p.sh(.6)}><path ${T(118, 78)} d="${xmxSm(ring(20, 10, .25, rng(p.id + 'cb'), 1.2, .8), true)}" fill="#dcebb4"/></g>`,
            xmxShreds(p, 118, 78, 44, { c: '#cfe39e', n: 26, w: 2.2, len: .3, seed: 1, outline: false, sy: .7 }),
            xmxShreds(p, 118, 78, 40, { c: '#f6f9ea', n: 18, w: 2, len: .3, seed: 2, outline: false, sy: .7 }),
            xmxRadish(p, 96, 98, 16), xmxRadish(p, 110, 102, 15), xmxRadish(p, 140, 94, 14),
            xmxBits(p, 98, 112, 30, { n: 12, seed: 3, cols: ['#f6f2e4'] }),
            xmxOregano(p, 104, 100, 50, 18, 1),
            xmxLime(p, 64, 116, 26, -120),
            xmxShine(100, 100, 74, .45),
        ].join('');
    },

    // Pozole verde de pollo: green Talavera bowl, pumpkin-seed and tomatillo green broth with hominy and shredded chicken, radish, avocado and lime
    mx_pozole_verde: p => {
        const hom = xmxSpots('pzv', 20, 62, 15);
        return [
            xmxTalaveraBowl(p, { blue: '#2f7a4a', accent: '#d8a03a' }),
            xmxBroth(p, 74, '#7f9a3a', { glow: .35, cloud: .1 }),
            `<g ${p.sh(.5)}>${hom.map(([x, y, r], i) => xmxHominy(p, x, y, 18 + (i % 3) * 1.5, r, { tint: '#8aa040' })).join('')}</g>`,
            xmxVeil(74, '#7f9a3a', .15),
            `<g ${p.sh(.7)}><path ${T(96, 104)} d="${xmxSm(ring(26, 10, .25, rng(p.id + 'ch'), 1.1, .9), true)}" fill="#e8d4ae"/>${xmxShreds(p, 96, 104, 54, { c: '#e9d2a8', n: 36, w: 2.6, len: .3, seed: 1, curve: .5 })}</g>`,
            xmxRadish(p, 120, 80, 16), xmxRadish(p, 132, 96, 15), xmxRadish(p, 70, 82, 15),
            xmxAvo(p, 128, 128, 40, -30, { slice: true }),
            xmxGrains(p, 100, 100, 120, { cols: ['#5f7a24'], n: 16, size: 1.6, seed: 2 }),
            xmxCilantro(p, 92, 92, 12, 20), xmxCilantro(p, 112, 112, 10, -40),
            xmxLime(p, 64, 128, 26, -120),
            xmxShine(100, 100, 72, .45),
        ].join('');
    },

    // Sopa de tortilla: clay bowl, brick-red tomato-pasilla broth crowned with crisp tortilla strips, avocado, cheese cubes, crema and fried pasilla
    mx_sopa_tortilla: p => {
        const sp = xmxSpots('st', 22, 36, 6);
        return [
            K.bowl(p, { R: 92, glaze: '#9a4a24', inside: '#f1e3cc' }),
            xmxBroth(p, 76, '#b8461f', { glow: .3 }),
            xmxOil(p, 100, 100, 140, { n: 12, c: '#e8722a', seed: 1, op: .55 }),
            `<g ${p.sh(.8)}>`,
            sp.map(([x, y, r], i) => xmxStrip(p, x, y, 34 + (i % 3) * 4, 6.4, r, { c: i % 2 ? '#eab04a' : '#e09a38' })).join(''),
            `</g>`,
            `<g ${p.sh(.5)}>`, xmxAvo(p, 62, 96, 13, 20), xmxAvo(p, 70, 120, 12, -30), xmxAvo(p, 140, 106, 13, 10), xmxAvo(p, 132, 130, 12, 40), xmxAvo(p, 116, 60, 12, -20),
            xmxCheeseCube(p, 78, 66, 11, 20), xmxCheeseCube(p, 144, 82, 11, -20), xmxCheeseCube(p, 96, 142, 11, 40), `</g>`,
            xmxStrip(p, 126, 146, 22, 5, -30, { c: '#4a2418', bend: .2 }), xmxStrip(p, 56, 76, 20, 5, 60, { c: '#4a2418', bend: .2 }),
            `<path d="M84,90 C96,80 112,92 104,104 C98,112 86,106 92,98" stroke="#fbf6ea" stroke-width="4" fill="none" stroke-linecap="round"/>`,
            xmxShine(100, 100, 74, .4),
        ].join('');
    },

    // Sopa de frijol: cazuela of smooth black bean soup with a crema swirl, fried tortilla strips, queso fresco and cilantro
    mx_sopa_frijol: p => [
        xmxCazuela(p, { R: 86, glaze: '#5e3214' }),
        xmxBroth(p, 75, '#3e2a24', { glow: .25 }),
        xmxSwirl(98, 100, 46, { c: '#f6efe0', w: 3.6, turns: 1.4 }),
        `<g ${p.sh(.7)}>`, ...[[116, 70, 30], [132, 84, -20], [124, 92, 80], [142, 70, 60], [110, 84, -50], [62, 120, 10], [76, 132, -40], [70, 112, 70], [84, 140, 20]].map(([x, y, r], i) => xmxStrip(p, x, y, 38, 7, r, { c: i % 2 ? '#eab04a' : '#e09a38' })), `</g>`,
        xmxQueso(p, 98, 102, 90, { n: 24, seed: 1, size: 3 }),
        xmxStrip(p, 64, 80, 20, 5, 40, { c: '#4a2418', bend: .2 }),
        xmxCilantro(p, 84, 84, 12, 20), xmxCilantro(p, 112, 118, 11, -50),
        xmxShine(100, 100, 72, .4),
    ].join(''),

    // Sopa de lentejas: blue Talavera bowl, thick brown lentil soup with carrot, tomato and slices of sweet fried plantain, cilantro
    mx_lentejas: p => [
        xmxTalaveraBowl(p),
        xmxBroth(p, 74, '#8a4f2a', { glow: .3 }),
        xmxBeans(p, 100, 100, 142, { n: 150, cols: ['#8a5a2e', '#a06a38', '#6e4422'], speck: null, size: 2.6, seed: 1, gloss: false }),
        `<g ${p.sh(.5)}>`, ...xmxSpots('le', 9, 58, 18).map(([x, y, r]) => xmxDice(p, x, y, 10, r, '#ef8a34')), `</g>`,
        xmxVeil(74, '#8a4f2a', .12),
        `<g ${p.sh(.7)}>`, ...[[80, 84], [118, 76], [128, 116], [86, 124]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${p.g('#b8682a', .25, .3)}" stroke="#7a3e14" stroke-width=".7"/><circle cx="${x - .6}" cy="${y - .6}" r="8" fill="${p.rg('#f0b44a', .25, .2)}"/><circle cx="${x}" cy="${y}" r="2" fill="#c8862e" opacity=".6"/>`), `</g>`,
        xmxCilantro(p, 102, 100, 13, 20), xmxCilantro(p, 64, 104, 10, -40),
        xmxShine(100, 100, 72, .4),
    ].join(''),

    // Caldo de albóndigas: big clay bowl of light tomato-chipotle broth with meatballs (rice inside), carrot rounds and zucchini, mint
    mx_albondigas: p => [
        K.bowl(p, { R: 94, glaze: '#b4663a', inside: '#f3e8d2' }),
        xmxBroth(p, 78, '#c4552c', { glow: .32 }),
        `<g ${p.sh(.6)}>`,
        K.carrotRound(p, 66, 74, 17), K.carrotRound(p, 138, 128, 16), K.carrotRound(p, 104, 146, 15), K.carrotRound(p, 148, 86, 15), K.carrotRound(p, 56, 120, 14),
        xmxDice(p, 118, 64, 17, 20, '#d8dc98', { skin: '#4a7a2e' }), xmxDice(p, 72, 142, 17, -30, '#d8dc98', { skin: '#4a7a2e' }), xmxDice(p, 150, 108, 15, 60, '#d8dc98', { skin: '#4a7a2e' }),
        `</g>`,
        xmxVeil(78, '#c4552c', .12),
        K.meatball(p, 84, 92, 38, { c: '#a0603a' }), K.meatball(p, 122, 100, 38, { c: '#9a5a34' }), K.meatball(p, 100, 128, 36, { c: '#a0603a' }), K.meatball(p, 96, 62, 30, { c: '#9a5a34' }),
        xmxGrains(p, 100, 98, 70, { cols: ['#f3ead6'], n: 14, size: 1, seed: 1 }),
        xmxOil(p, 100, 100, 140, { n: 10, c: '#e8722a', seed: 2, op: .55 }),
        K.mitsuba(p, 72, 108, 16, -30), K.mitsuba(p, 136, 70, 14, 40),
        xmxShine(100, 100, 76, .4),
    ].join(''),

    // Caldo de res: painted barro bowl of clear golden beef broth with a marrow-bone shank, corn on the cob, carrot, potato, cabbage wedge and zucchini
    mx_caldo_res: p => [
        xmxBarro(p, { R: 94 }),
        xmxBroth(p, 78, '#c99a55', { glow: .35 }),
        `<g ${p.sh(.8)}>`,
        K.leafPiece(p, 66, 128, 58, 30, { c: '#b9d68a', vein: '#eef6dc', seed: 1, cooked: true }),
        xmxCob(p, 134, 72, 58, 28, 30),
        K.potato(p, 142, 122, 38, 10, { c: '#ecd08a', seed: 1 }),
        K.carrotChunk(p, 70, 74, 28, 20), K.carrotChunk(p, 108, 148, 26, -40),
        xmxDice(p, 60, 104, 17, 20, '#d8dc98', { skin: '#4a7a2e' }), xmxDice(p, 118, 132, 16, -20, '#d8dc98', { skin: '#4a7a2e' }),
        xmxShank(p, 98, 100, 70, -10),
        `</g>`,
        xmxVeil(78, '#c99a55', .1),
        xmxOil(p, 100, 100, 140, { n: 10, c: '#f2c45a', seed: 1, op: .6 }),
        xmxCilantro(p, 86, 120, 11, 30), xmxCilantro(p, 112, 70, 10, -40),
        xmxLime(p, 150, 150, 24, 40),
        xmxShine(100, 100, 76, .45),
    ].join(''),

    // Caldo tlalpeño: blue Talavera bowl, smoky chipotle broth with shredded chicken, chickpeas, carrot, green beans, avocado and panela
    mx_tlalpeno: p => [
        xmxTalaveraBowl(p),
        xmxBroth(p, 74, '#b9562c', { glow: .3 }),
        `<g ${p.sh(.5)}>`, ...xmxSpots('tl', 8, 58, 18).map(([x, y, r], i) => i % 2 ? xmxDice(p, x, y, 11, r, '#ef8a34') : K.greenBean(p, x, y, 18, r)), `</g>`,
        xmxChickpeas(p, 100, 100, 130, { n: 22, seed: 1, sz: 4.2 }),
        xmxVeil(74, '#b9562c', .12),
        `<g ${p.sh(.7)}><path ${T(88, 92)} d="${xmxSm(ring(24, 10, .25, rng(p.id + 'ch'), 1.1, .9), true)}" fill="#e8d0a6"/>${xmxShreds(p, 88, 92, 50, { c: '#e9d0a2', n: 32, w: 2.6, len: .3, seed: 1, curve: .5 })}</g>`,
        xmxAvo(p, 126, 112, 42, -20, { slice: true }), xmxAvo(p, 118, 128, 40, -10, { slice: true }),
        `<g ${p.sh(.5)}>`, xmxCheeseCube(p, 72, 124, 12, 20), xmxCheeseCube(p, 124, 74, 12, -20), `</g>`,
        `<g ${p.sh(.5)}><path ${T(100, 120, 30)} d="M-8,-4 Q0,-8 8,-3 Q9,3 2,5 Q-6,6 -8,-4Z" fill="${p.g('#6a2414', .3, .3)}" stroke="#3a1008" stroke-width=".6"/></g>`,
        xmxOil(p, 100, 100, 140, { n: 10, c: '#e8722a', seed: 2, op: .55 }),
        xmxShine(100, 100, 72, .4),
    ].join(''),

    // Caldo de pescado: blue enamel bowl, red guajillo-tomato broth with cross-cut white fish steaks, carrot and potato, cilantro and lime
    mx_caldo_pescado: p => [
        xmxPeltreBowl(p, { out: '#2f6fb0' }),
        xmxBroth(p, 78, '#c4552c', { glow: .3 }),
        `<g ${p.sh(.6)}>`,
        K.carrotRound(p, 64, 92, 16), K.carrotRound(p, 140, 72, 15), K.carrotRound(p, 120, 146, 15), K.carrotRound(p, 72, 136, 14),
        xmxDice(p, 92, 150, 15, 20, '#ecd08a'), xmxDice(p, 150, 104, 15, -20, '#ecd08a'), xmxDice(p, 56, 116, 14, 40, '#ecd08a'),
        `</g>`,
        xmxVeil(78, '#c4552c', .12),
        xmxFishSteak(p, 86, 80, 46, 20), xmxFishSteak(p, 124, 112, 48, -30), xmxFishSteak(p, 88, 124, 38, 70),
        xmxOil(p, 100, 100, 144, { n: 12, c: '#e8722a', seed: 1, op: .55 }),
        xmxBits(p, 104, 98, 100, { n: 14, seed: 2 }),
        xmxCilantro(p, 112, 82, 12, 20), xmxCilantro(p, 62, 104, 10, -40),
        xmxLime(p, 146, 140, 24, 40),
        xmxShine(100, 100, 76, .4),
    ].join(''),

    // Caldo de camarón: clay bowl, spicy red broth with whole shell-on shrimp, potato and carrot dice, cilantro and lime
    mx_caldo_camaron: p => [
        K.bowl(p, { R: 92, glaze: '#8a4424', inside: '#f1e3cc' }),
        xmxBroth(p, 76, '#c2401f', { glow: .3 }),
        `<g ${p.sh(.5)}>`, ...xmxSpots('cc', 12, 60, 17).map(([x, y, r], i) => i % 2 ? xmxDice(p, x, y, 12, r, '#ef8a34') : xmxDice(p, x, y, 14, r, '#ecd08a')), `</g>`,
        xmxVeil(76, '#c2401f', .12),
        ...[[78, 76, 20], [126, 72, 120], [140, 118, 200], [100, 140, 280], [58, 116, 60], [102, 104, 160]].map(([x, y, r]) => xmxShrimp(p, x, y, 50, r, { shell: true })),
        xmxOil(p, 100, 100, 140, { n: 12, c: '#e8722a', seed: 1, op: .55 }),
        xmxBits(p, 100, 100, 100, { n: 12, seed: 2 }),
        xmxLime(p, 146, 144, 24, 40),
        xmxShine(100, 100, 74, .4),
    ].join(''),
    // Crema de elote: blue Talavera bowl, velvety pale-yellow corn soup with a crema swirl, toasted kernels, poblano strips and queso fresco
    mx_crema_elote: p => [
        xmxTalaveraBowl(p),
        xmxBroth(p, 74, '#efcf6e', { glow: .4 }),
        xmxSwirl(96, 100, 44, { c: '#fbf6ea', w: 3.4, turns: 1.5 }),
        `<g ${p.sh(.6)}>`, K.corn(p, 108, 98, 70, { n: 44 }), `</g>`,
        xmxRaja(p, 104, 80, 34, 7, 20), xmxRaja(p, 130, 104, 30, 7, -40), xmxRaja(p, 92, 118, 28, 6, 60),
        xmxQueso(p, 108, 98, 56, { n: 14, seed: 1, size: 2.8 }),
        xmxCilantro(p, 118, 90, 12, 20),
        xmxGrains(p, 100, 100, 120, { cols: ['#c0391c'], n: 14, size: .8, seed: 2 }),
        xmxShine(100, 100, 72, .5),
    ].join(''),

    // Crema de poblano: painted barro bowl, smooth jade-green poblano cream soup with crema swirl, corn, panela cubes and a roasted poblano strip
    mx_crema_poblano: p => [
        xmxBarro(p),
        xmxBroth(p, 76, '#8fa45a', { glow: .35 }),
        xmxSwirl(98, 100, 44, { c: '#fbf6ea', w: 3.4, turns: 1.5 }),
        `<g ${p.sh(.6)}>`, K.corn(p, 110, 96, 40, { n: 18 }), xmxCheeseCube(p, 96, 92, 12, 20), xmxCheeseCube(p, 116, 112, 12, -20), xmxCheeseCube(p, 124, 86, 11, 40), `</g>`,
        xmxRaja(p, 82, 114, 32, 7, -30), xmxRaja(p, 104, 120, 26, 6, 20),
        xmxShine(100, 100, 74, .5),
    ].join(''),

    // Sopa de flor de calabaza: white enamel bowl, light golden tomato broth with whole squash blossoms, zucchini, corn and queso fresco
    mx_sopa_flor: p => [
        xmxPeltreBowl(p, { out: '#f1eee6', rim: '#1d3f7a' }),
        xmxBroth(p, 78, '#d9a43a', { glow: .35 }),
        `<g ${p.sh(.5)}>`, ...xmxSpots('sf', 14, 62, 15).map(([x, y, r], i) => xmxDice(p, x, y, 13, r, '#d8dc98', { skin: '#4a7a2e' })), `</g>`,
        K.corn(p, 100, 100, 130, { n: 26 }),
        xmxVeil(78, '#d9a43a', .12),
        xmxBlossom(p, 80, 82, 60, 30), xmxBlossom(p, 124, 90, 56, 150), xmxBlossom(p, 100, 128, 58, -80),
        `<g ${p.sh(.5)}>`, xmxCheeseCube(p, 100, 98, 13, 20), xmxCheeseCube(p, 70, 120, 12, -10), xmxCheeseCube(p, 136, 122, 12, 30), `</g>`,
        K.greens(p, 130, 66, 22, { c: '#3f7a2a', n: 3, seed: 2 }),
        xmxShine(100, 100, 76, .45),
    ].join(''),

    // Menudo rojo: big clay bowl, red guajillo-ancho broth with honeycomb tripe and hominy, chopped onion, oregano, chile flakes and lime
    mx_menudo: p => {
        const hom = xmxSpots('mn', 12, 62, 18);
        return [
            K.bowl(p, { R: 94, glaze: '#7a3a1a', inside: '#efe0c8' }),
            xmxBroth(p, 80, '#a8321c', { glow: .3 }),
            `<g ${p.sh(.5)}>${hom.map(([x, y, r], i) => xmxHominy(p, x, y, 17 + (i % 3) * 1.5, r, { tint: '#d8603a' })).join('')}</g>`,
            xmxVeil(80, '#a8321c', .1),
            ...[[78, 80, 20], [124, 76, -30], [136, 116, 60], [96, 132, 10], [64, 116, -50], [104, 100, 40]].map(([x, y, r], i) => xmxTripe(p, x, y, 32 + (i % 2) * 4, r, { seed: i })),
            xmxOil(p, 100, 100, 148, { n: 14, c: '#e8602a', seed: 1, op: .6 }),
            xmxBits(p, 112, 96, 36, { n: 16, seed: 2, cols: ['#f6f2e4', '#efe8d4'] }),
            xmxOregano(p, 108, 100, 60, 20, 1),
            xmxGrains(p, 100, 100, 100, { cols: ['#7a1a0c'], n: 14, size: 1, seed: 3 }),
            xmxLime(p, 152, 146, 24, 40),
            xmxShine(100, 100, 78, .4),
        ].join('');
    },

    // Sopa de verduras: green Talavera bowl, light tomato broth full of diced carrot, potato, zucchini, chayote, green beans and corn
    mx_sopa_verduras: p => {
        const sp = xmxSpots('sv', 30, 62, 12.5);
        return [
            xmxTalaveraBowl(p, { blue: '#2f7a4a', accent: '#d8a03a' }),
            xmxBroth(p, 74, '#d0723a', { glow: .3 }),
            `<g ${p.sh(.5)}>`,
            sp.map(([x, y, r], i) => [() => xmxDice(p, x, y, 11, r, '#ef8a34'), () => xmxDice(p, x, y, 13, r, '#ecd08a'), () => xmxDice(p, x, y, 12, r, '#d8dc98', { skin: '#4a7a2e' }), () => K.greenBean(p, x, y, 17, r), () => xmxDice(p, x, y, 12, r, '#cfe0a0')][i % 5]()).join(''),
            `</g>`,
            K.corn(p, 100, 100, 120, { n: 18 }),
            xmxVeil(74, '#d0723a', .1),
            xmxCilantro(p, 100, 96, 12, 20), xmxCilantro(p, 120, 118, 10, -40),
            xmxShine(100, 100, 72, .45),
        ].join('');
    },

    // Mole de olla: cazuela, dark brick-red chile broth with beef shank, corn on the cob, zucchini, chayote, green beans and potato
    mx_mole_olla: p => [
        xmxCazuela(p, { R: 88, glaze: '#5e3214' }),
        xmxBroth(p, 76, '#8e2a18', { glow: .25 }),
        `<g ${p.sh(.8)}>`,
        xmxCob(p, 64, 84, 62, 28, -50),
        K.potato(p, 140, 128, 38, 10, { c: '#e2c27c', seed: 1 }),
        xmxDice(p, 138, 78, 22, 20, '#d8dc98', { skin: '#4a7a2e' }), xmxDice(p, 68, 130, 22, -30, '#d8dc98', { skin: '#4a7a2e' }),
        `<path ${T(104, 148, 10)} d="M-17,-7 Q0,-12 17,-7 Q19,5 10,10 Q0,12 -10,10 Q-19,5 -17,-7Z" fill="${p.g('#c6d890', .3, .2)}" stroke="#7f9a4a" stroke-width=".6"/>`,
        K.greenBean(p, 112, 62, 24, 20), K.greenBean(p, 58, 106, 22, 80), K.greenBean(p, 148, 104, 22, -60),
        xmxShank(p, 104, 102, 76, 20, { c: '#7a4228' }),
        `</g>`,
        xmxVeil(76, '#8e2a18', .14),
        xmxOil(p, 100, 100, 144, { n: 14, c: '#d8501c', seed: 1, op: .6 }),
        xmxShine(100, 100, 74, .4),
    ].join(''),

    // Crema de calabacita: red-rimmed white enamel bowl, pale-green zucchini cream soup with crema swirl, queso fresco, croutons and black pepper
    mx_crema_calabacita: p => [
        xmxPeltreBowl(p, { out: '#f1eee6', rim: '#b8301c' }),
        xmxBroth(p, 78, '#b8c77a', { glow: .4 }),
        xmxSwirl(98, 100, 46, { c: '#fbf6ea', w: 3.4, turns: 1.5 }),
        `<g ${p.sh(.6)}>`, ...[[112, 86, 20], [128, 100, -10], [116, 116, 40], [82, 118, 10], [96, 82, -30], [70, 98, 25], [100, 128, -15], [136, 82, 50]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.crumb(.9)}><rect x="-7" y="-7" width="14" height="14" rx="2.6" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>`), `</g>`,
        xmxQueso(p, 100, 100, 70, { n: 16, seed: 1, size: 3 }),
        K.sprinkle(p, 100, 100, 90, { c: '#3a2a20', n: 26, r: .6 }),
        xmxShine(100, 100, 76, .5),
    ].join(''),

    // Sopa de habas（凪案）: 金色のそら豆ピューレを明るく、ノパルの角切りを大きな緑に、トマトの赤をアクセントに、揚げたパシージャの黒い帯とコリアンダー
    mx_sopa_habas: p => [
        xmxBarro(p, { clay: '#b0562a' }),
        xmxBroth(p, 76, '#dcb458', { glow: .4 }),
        `<path d="M62,92 C78,80 94,96 110,86 C124,78 136,86 142,96" stroke="#f4d870" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/><path d="M60,118 C80,108 96,124 116,114" stroke="#f4d870" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`,
        `<g ${p.edge('#2a4a14', .7, .55)}><g ${p.sh(.5)}>`, ...xmxSpots('hb', 10, 52, 24).map(([x, y, r], i) => xmxDice(p, x, y, 18, r, i % 2 ? '#5f9a34' : '#6fac3e')), `</g></g>`,
        `<g ${p.edge('#6a1408', .6, .5)}>`, ...[[88, 100, 10], [122, 124, 40], [108, 70, 70], [66, 80, 0]].map(([x, y, r]) => xmxDice(p, x, y, 11, r, '#e63a22')), `</g>`,
        xmxStrip(p, 112, 100, 38, 8, 30, { c: '#3a1810', bend: .2 }), xmxStrip(p, 90, 118, 32, 8, -40, { c: '#3a1810', bend: .2 }), xmxStrip(p, 126, 112, 26, 7, 80, { c: '#4a2014', bend: .2 }),
        xmxCilantro(p, 92, 90, 15, 20), xmxCilantro(p, 112, 128, 13, -50), xmxCilantro(p, 140, 84, 12, 100),
        xmxShine(100, 100, 74, .45),
    ].join(''),

    // Caldo de huevo: clay bowl, tomato-serrano broth with two softly poached eggs, potato dice, a whole serrano and cilantro
    mx_caldo_huevo: p => [
        K.bowl(p, { R: 92, glaze: '#c0703c', inside: '#f3e6cc' }),
        xmxBroth(p, 76, '#c8502a', { glow: .3 }),
        `<g ${p.sh(.5)}>`, ...xmxSpots('ch', 12, 60, 16).map(([x, y, r]) => xmxDice(p, x, y, 13, r, '#ecd08a')), `</g>`,
        xmxGrains(p, 100, 100, 130, { cols: ['#e8603e', '#a8341a'], n: 24, size: 2, seed: 2 }),
        xmxVeil(76, '#c8502a', .12),
        xmxPoached(p, 82, 90, 50, 20, { seed: 1 }), xmxPoached(p, 120, 114, 48, -30, { seed: 2 }),
        xmxChili(p, 128, 70, 40, 30, { c: '#3f8a2c', bend: 4 }),
        xmxCilantro(p, 74, 126, 12, 20), xmxCilantro(p, 112, 82, 10, -40), xmxCilantro(p, 100, 140, 10, 60),
        xmxShine(100, 100, 74, .4),
    ].join(''),

    // Sopa de champiñones: blue Talavera bowl, tomato-epazote broth with plenty of sliced mushrooms, serrano rings and onion
    mx_sopa_champinones: p => {
        const sp = xmxSpots('sc', 16, 56, 18);
        return [
            xmxTalaveraBowl(p),
            xmxBroth(p, 74, '#b05c30', { glow: .3 }),
            `<g ${p.sh(.4)}>`, xmxSliver(p, 80, 120, 18, 30, { c: '#f0dfb0' }), xmxSliver(p, 124, 80, 16, -30, { c: '#f0dfb0' }), `</g>`,
            sp.map(([x, y, r], i) => xmxMush(p, x, y, 24 + (i % 3) * 2, r, { cooked: .45 + (i % 3) * .1, edge: '#8a6440' })).join(''),
            xmxVeil(74, '#b05c30', .1),
            xmxRings(p, 100, 100, 110, { n: 8, seed: 2, c: '#3f8a2c', rr: 2.2 }),
            K.greens(p, 100, 100, 60, { c: '#3f7a2a', n: 5, seed: 3 }),
            xmxShine(100, 100, 72, .45),
        ].join('');
    },
};
