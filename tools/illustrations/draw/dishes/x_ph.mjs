// Philippines: hand-drawn dishes (soups, mains, sides)
import * as K from '../kit.mjs';

const { T, f, rng, ring, lt, dk, mix, smooth } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// Local helpers (ph = Philippines)
// =========================================================
function xphSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function xphOl(p, c, r = .55){
    const id = p.def('xphOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const xphShine = (cx, cy, R, op = .35, w = 1.8) => `<path d="M${f(cx - R * .55)},${f(cy + R * .1)} A${f(R * .6)},${f(R * .6)} 0 0 1 ${f(cx - R * .05)},${f(cy - R * .52)}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
const xphArc = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// rice mound (grains drawn as short rounded strokes)
function xphRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xphRice' + seed + x + y);
    const shape = xphSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('xphRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    const base = `<path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/>`;
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}>${base}</g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// small irregular bits, one path per colour
function xphGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xphGr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; });
        ds[k] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`).join('');
}
// thin shreds grouped by colour
function xphShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'xphSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? xphOl(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// noodles: all strands in one path (bihon, misua)
function xphNoodles(p, x, y, s, { c = '#d9b06a', w = 1.6, n = 60, seed = 1, sy = .9, outline = null, hi = .35 } = {}){
    const R = rng(p.id + 'xphNd' + seed);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.15 + R() * .82), a0 = R() * 6.28, sweep = 1 + R() * 2.2;
        const cx = x + (R() - .5) * s * .14, cy = y + (R() - .5) * s * .14;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .3); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = xphSm(pts);
        d += one; if (R() < hi) dl += one;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.8)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="${outline || dk(c, .25)}" stroke-width="${f(w + .9)}"/><use href="#${id}" stroke="${c}" stroke-width="${w}"/></g><path d="${dl}" stroke="${lt(c, .4)}" stroke-width="${f(w * .5)}" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// dice (rounded cube seen from above)
function xphDice(p, x, y, s, r = 0, c = '#ef7f30', { skin = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f(h * .5)}" width="${s}" height="${f(s * .22)}" rx="${f(s * .1)}" fill="${skin}"/>` : ''}
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// evenly spread positions
function xphSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xphspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// a small leaf (bay leaf, kangkong leaf, etc.)
function xphLeaf(p, x, y, s, r = 0, { c = '#2f7a2a', w = 7.5 } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,0 Q-4,${-w} 6,${f(-w * .6)} Q10,-2 11,0 Q10,2 6,${f(w * .6)} Q-4,${w} -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 10,0" stroke="${lt(c, .35)}" stroke-width=".8" fill="none"/>
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}

// reuse one drawn part many times (keeps the SVG small): the part is drawn once at (0,0) into <defs>
function xphUse(p, key, make, x, y, r = 0, k = 1){
    const id = p.def('xphU' + key, id => `<g id="${id}">${make()}</g>`);
    return `<use href="#${id}" ${T(x, y, r, k)}/>`;
}

// ---------- vessels ----------
// white plate with a ring of small flowers on the rim (the classic Filipino everyday plate)
function xphFloralPlate(p, { c = '#3f8a4a', c2 = '#e3a33a', R = 94, n = 14 } = {}){
    let fl = '';
    for (let i = 0; i < n; i++){
        const a = i / n * 6.283, x = 100 + Math.cos(a) * (R - 9), y = 100 + Math.sin(a) * (R - 9), deg = a * 57.3;
        fl += xphUse(p, 'fl' + c + c2, () => `<path d="M-6.5,0 Q-3.5,-3 0,0 Q-3.5,3 -6.5,0Z M6.5,0 Q3.5,-3 0,0 Q3.5,3 6.5,0Z" fill="${c}" opacity=".85"/>${[0, 1, 2, 3, 4].map(j => `<circle cx="${f(Math.cos(j * 1.2566) * 1.7)}" cy="${f(Math.sin(j * 1.2566) * 1.7)}" r="1.2" fill="${c2}"/>`).join('')}<circle r=".9" fill="${dk(c2, .3)}"/>`, x, y, deg + 90);
    }
    return K.plate(p, { R, rim: 'none', well: .74 }) + fl;
}
// plain white bowl with coloured line(s) at the rim (mangkok)
function xphBowl(p, { line = '#2f6aa8', R = 92, inside = '#fbf9f3' } = {}){
    return K.bowl(p, { glaze: '#f5f1e8', inside, R }) + `<circle cx="100" cy="100" r="${f(R * .935)}" fill="none" stroke="${line}" stroke-width="2.2" opacity=".9"/><circle cx="100" cy="100" r="${f(R * .895)}" fill="none" stroke="${line}" stroke-width=".7" opacity=".7"/>`;
}
// banana leaf laid across the plate (a strip with parallel veins, cut by the rim)
function xphBanana(p, { r = -28, w = 128, R = 88, cx = 100, cy = 100 } = {}){
    const clip = p.uid();
    let veins = '';
    for (let i = -14; i <= 14; i++){ const x = i * 7; veins += `M${x},-4 L${x + 26},${-w / 2} M${x},4 L${x + 26},${w / 2}`; }
    const g = p.def('xphBanG', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa24a"/><stop offset=".45" stop-color="#3f8a36"/><stop offset=".55" stop-color="#3a8232"/><stop offset="1" stop-color="#2e6e2a"/></linearGradient>`);
    return `<defs><clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>
        <g clip-path="url(#${clip})"><g ${T(cx, cy, r)}><g ${p.sh(.8)}><path d="M-120,${-w / 2 + 2} Q-40,${-w / 2 - 3} 0,${-w / 2} T120,${-w / 2 + 3} L120,${w / 2 - 2} Q40,${w / 2 + 3} 0,${w / 2} T-120,${w / 2 - 2}Z" fill="url(#${g})"/></g>
        <path d="${veins}" stroke="#6fb85a" stroke-width=".7" opacity=".55" fill="none"/>
        <path d="M-120,0 L120,0" stroke="#b9d98a" stroke-width="4.5"/><path d="M-120,1.6 L120,1.6" stroke="#8fbf5c" stroke-width="1.2"/>
        <path d="M-90,${-w / 2 + 8} Q-40,${-w / 2 + 4} 10,${-w / 2 + 7}" stroke="#fff" stroke-width="2" fill="none" opacity=".3" stroke-linecap="round"/></g></g>`;
}

// ---------- food parts ----------
// chicken drumstick (glossy, dark when braised)
function xphDrum(p, x, y, s, r = 0, { c = '#7a3f17' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#e9d6b6', .3, .25)}" stroke="#a88a5c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="M-14,4 Q-6,10 4,7" stroke="${dk(c, .35)}" stroke-width="1.4" fill="none" opacity=".45"/>
        ${xphArc('M-16,-5 Q-10,-11 -2,-9.5', 2.2, .8)}${xphArc('M2,-6 Q7,-4.5 11,-3', 1.2, .55)}${xphArc('M-12,1 Q-8,-1 -4,0', 1, .4)}</g>`;
}
// braised chicken thigh piece (skin side up, glossy)
function xphThigh(p, x, y, s, r = 0, { c = '#7e4119', seed = 1 } = {}){
    const R = rng(p.id + 'xphTh' + seed + x + y);
    const pts = ring(10, 10, .28, R, 1.25, .85);
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.8)}><path d="${xphSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="${xphSm(pts.map(([a, b]) => [a * .6 + 1.5, b * .55 + 1.5]), true)}" fill="${dk(c, .2)}" opacity=".4"/>
        <path d="M-7,3 q3,-1.5 6,0 M1,5 q3,-1 5,.5" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".5"/>
        ${xphArc('M-8,-3.5 Q-3,-7.5 4,-6.5', 2, .8)}${xphArc('M4,-2 Q7,-2 9,0', 1, .5)}</g>`;
}
// garlic clove (peeled, golden when braised)
function xphGarlic(p, x, y, s, r = 0, { c = '#e9c47a' } = {}){
    return `<g ${T(x, y, r, s / 10)}><path d="M-5,2 Q-4,-4 1,-4.5 Q5,-4 5,1 Q3,4 -1,4 Q-4,4 -5,2Z" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M-2.5,-2 Q0,-3.4 2.5,-2.6" stroke="#fff" stroke-width=".8" fill="none" opacity=".7"/></g>`;
}
// whole fried tilapia
function xphTilapia(p, x, y, L, r = 0, { c = '#b36a2a', seed = 1 } = {}){
    const k = L / 104;
    const R = rng(p.id + 'xphTil' + seed);
    let spots = '';
    for (let i = 0; i < 14; i++) spots += `<ellipse cx="${f(-30 + R() * 60)}" cy="${f(-14 + R() * 28)}" rx="${f(2 + R() * 4)}" ry="${f(1.2 + R() * 2)}" fill="${R() < .6 ? dk(c, .4) : lt(c, .3)}" opacity="${f(.15 + R() * .2)}"/>`;
    const body = 'M-50,2 C-49,-13 -32,-24 -8,-25 C14,-25 28,-15 35,-5 L36,5 C28,15 14,23 -8,23 C-32,23 -49,16 -50,2Z';
    const slash = xx => `<path d="M${xx},-20 Q${xx + 7},0 ${xx},18" stroke="${dk(c, .5)}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M${xx + .8},-17 Q${xx + 6.6},0 ${xx + .8},15" stroke="#f2dcae" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1.1)}>
        <path d="M-24,-22 L-20,-32 L-14,-25 L-8,-33 L-2,-26 L4,-33 L10,-25 L16,-31 L20,-22 L28,-24 L33,-10 L30,-6 Z" fill="${p.g(dk(c, .25), .2, .3)}" stroke="${dk(c, .55)}" stroke-width=".7" stroke-linejoin="round"/>
        <path d="M2,21 L8,30 L14,25 L20,29 L24,20 L32,16 L30,6 Z" fill="${p.g(dk(c, .25), .2, .3)}" stroke="${dk(c, .55)}" stroke-width=".7" stroke-linejoin="round"/>
        <path d="M33,-5 L54,-18 Q49,0 54,17 L33,5 Z" fill="${p.g(dk(c, .15), .25, .35)}" stroke="${dk(c, .55)}" stroke-width=".8" stroke-linejoin="round"/>
        <path d="${body}" fill="${p.g(c, .32, .38)}" stroke="${dk(c, .55)}" stroke-width=".9"/></g>
        <path d="M37,-9 L51,-15 M37,-3 L51,-6 M37,3 L51,6 M37,8 L51,14" stroke="${dk(c, .5)}" stroke-width=".8" opacity=".6"/>
        <path d="M-46,-4 C-40,-18 -20,-22 0,-22 C14,-22 26,-14 32,-6 C20,-12 0,-14 -20,-12 C-34,-10 -42,-6 -46,-4Z" fill="${dk(c, .3)}" opacity=".5"/>
        ${spots}
        ${slash(-10)}${slash(4)}${slash(18)}
        <path d="M-27,-18 Q-20,0 -27,17" stroke="${dk(c, .5)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M-22,4 Q-14,8 -10,14 Q-18,14 -22,4Z" fill="${dk(c, .3)}" stroke="${dk(c, .5)}" stroke-width=".6"/>
        <circle cx="-38" cy="-6" r="4.8" fill="#efe6d2" stroke="${dk(c, .5)}" stroke-width="1"/><circle cx="-38" cy="-6" r="2.2" fill="#8a7a66"/>
        <path d="M-49,4 Q-46,6 -42,5" stroke="${dk(c, .55)}" stroke-width="1" fill="none"/>
        ${xphArc('M-40,-14 Q-24,-23 -2,-22', 2.4, .55)}${xphArc('M8,-20 Q18,-17 26,-11', 1.6, .45)}</g>`;
}
// calamansi half
function xphCalamansi(p, x, y, s, { cut = true } = {}){
    if (!cut) return `<g ${p.sh(.5)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg('#4f9a33', .3, .3, .35, .32)}" stroke="#2f6a22" stroke-width=".6"/></g><ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .17)}" rx="${f(s * .14)}" ry="${f(s * .08)}" fill="#fff" opacity=".6"/>`;
    return `<g ${T(x, y)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="#3f8a2a"/></g><circle r="${f(s / 2 - 1.3)}" fill="#f1c94a"/><circle r="${f(s / 2 - 2.6)}" fill="${p.rg('#f6b33a', .3, .12)}"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0,0 L${f(Math.cos(i * .785) * (s / 2 - 2.8))},${f(Math.sin(i * .785) * (s / 2 - 2.8))}" stroke="#fde9a8" stroke-width=".8"/>`).join('')}<circle r="1.2" fill="#fde9a8"/>
        <ellipse cx="${f(-s * .16)}" cy="${f(-s * .18)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// small sauce saucer
function xphSaucer(p, x, y, R, liq, { op = .9, rim = '#f6f2ea', line = null } = {}){
    return `<g ${p.sh(.9)}><circle cx="${x}" cy="${y}" r="${R}" fill="${p.rg(rim, .2, .15, .35, .3)}"/></g>${line ? `<circle cx="${x}" cy="${y}" r="${f(R - 2)}" fill="none" stroke="${line}" stroke-width="1.2"/>` : ''}
        <circle cx="${x}" cy="${y}" r="${f(R * .74)}" fill="${p.rg(liq, .25, .25, .45, .42)}" opacity="${op}"/>
        <path d="M${f(x - R * .5)},${f(y - R * .2)} A${f(R * .55)},${f(R * .55)} 0 0 1 ${f(x - R * .1)},${f(y - R * .55)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// round tomato slice
function xphTomSlice(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><circle r="10" fill="${p.g('#e3392b', .3, .22)}" stroke="#a8221a" stroke-width=".6"/></g>
        <circle r="8.6" fill="#f2604a"/>${[0, 1, 2, 3].map(i => `<path ${T(Math.cos(i * 1.57 + .4) * 4.6, Math.sin(i * 1.57 + .4) * 4.6, i * 90 + 23)} d="M-2.4,0 Q0,-2.4 2.4,0 Q0,2.4 -2.4,0Z" fill="#f7b04a" stroke="#e98a3a" stroke-width=".4"/>`).join('')}
        <circle r="2.2" fill="#f58a6a"/><path d="M-6,-4 Q-2,-7 3,-6.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// eggplant omelette (tortang talong): flattened eggplant fan coated in egg
function xphTorta(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xphTor' + seed);
    const pts = [[-L / 2, 0], [-L * .42, -W * .2], [-L * .2, -W * .4], [L * .08, -W * .5], [L * .32, -W * .44], [L * .48, -W * .2], [L * .5, W * .06], [L * .4, W * .34], [L * .16, W * .48], [-L * .14, W * .4], [-L * .38, W * .2]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    let streaks = '';
    for (let i = 0; i < 9; i++){ const bx = (R() - .45) * L * .7, by = (R() - .5) * W * .55; streaks += `<path ${T(bx, by, (R() - .5) * 30)} d="${xphSm(ring(4 + R() * 6, 7, .5, R, 1.8, .7), true)}" fill="${R() < .5 ? '#7a6a42' : '#5e4a3a'}" opacity="${f(.3 + R() * .25)}"/>`; }
    let brown = '';
    for (let i = 0; i < 12; i++) brown += `<ellipse cx="${f((R() - .4) * L * .75)}" cy="${f((R() - .5) * W * .7)}" rx="${f(3 + R() * 6)}" ry="${f(2 + R() * 3)}" fill="#b8661c" opacity="${f(.15 + R() * .25)}"/>`;
    const id = p.uid(), shape = xphSm(pts, true);
    return `<g ${T(x, y, r)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
        <g ${p.sh(1.2)}><path d="${shape}" fill="${p.rg('#ebb945', .3, .3, .4, .35)}" stroke="#b77a1c" stroke-width=".9"/></g>
        <g clip-path="url(#${id})">${streaks}${brown}</g>
        <g ${T(-L / 2 - 2, 0)}><path d="M2,-6 Q-3,-5 -5,0 Q-3,5 2,6 Q5,0 2,-6Z" fill="${p.g('#5c6a2c', .3, .3)}" stroke="#3a4416" stroke-width=".6"/><path d="M-4,0 L-14,-2" stroke="#6b7a3a" stroke-width="3.2" stroke-linecap="round"/><path d="M-4,0 L-14,-2" stroke="#93a45a" stroke-width="1.2" stroke-linecap="round"/></g>
        ${xphArc(`M${f(-L * .3)},${f(-W * .22)} Q${f(-L * .02)},${f(-W * .46)} ${f(L * .3)},${f(-W * .36)}`, 3, .55)}
        ${xphArc(`M${f(-L * .1)},${f(-W * .14)} Q${f(L * .05)},${f(-W * .22)} ${f(L * .18)},${f(-W * .2)}`, 1.4, .4)}</g>`;
}
// thin braised beef slice (bistek)
function xphBeef(p, x, y, s, r = 0, { c = '#6a3818', seed = 1 } = {}){
    const R = rng(p.id + 'xphBf' + seed + x + y);
    const k = s / 30;
    const folds = Array.from({ length: 3 }, (_, i) => { const fx = -8 + i * 8 + (R() - .5) * 4; return `M${f1(fx)},${f1(-6 + R() * 2)} q${f1((R() - .5) * 5)},6 ${f1((R() - .5) * 3)},${f1(11 + R() * 2)}`; }).join('');
    return `<g ${T(x, y, r, k)}><path d="${xphSm(ring(14, 16, .32, R, 1.1, .62), true)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="${folds}" stroke="${dk(c, .45)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// onion ring (cooked, translucent)
function xphOnionRing(p, x, y, s, r = 0, { c = '#f3e6c4', sy = .82 } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="${dk(c, .3)}" stroke-width="3.6" opacity=".55"/><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="${c}" stroke-width="2.6" opacity=".95"/>
        <ellipse rx="${f(s / 2 - 1.2)}" ry="${f(s / 2 * sy - 1.2)}" fill="none" stroke="#fff" stroke-width=".7" opacity=".7" stroke-dasharray="${f(s * .8)} ${f(s * 2)}"/></g>`;
}
// moringa (malunggay) leaflets: small rounded leaves in loose sprigs
function xphMalunggay(p, x, y, s, { n = 7, seed = 1, c = '#3d8a2c' } = {}){
    const R = rng(p.id + 'xphMl' + seed + x + y);
    let st = '', lv = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, ang = R() * 360, rad = ang / 57.3;
        st += `M${f1(cx - Math.cos(rad) * 9)} ${f1(cy - Math.sin(rad) * 9)}L${f1(cx + Math.cos(rad) * 9)} ${f1(cy + Math.sin(rad) * 9)}`;
        const leaf = (u, v, rot) => { const px = cx + Math.cos(rad) * u - Math.sin(rad) * v, py = cy + Math.sin(rad) * u + Math.cos(rad) * v; const col = R() < .5 ? c : lt(c, .14); lv += `<ellipse cx="${f1(px)}" cy="${f1(py)}" rx="3.3" ry="2.2" transform="rotate(${f1(ang + rot)} ${f1(px)} ${f1(py)})" fill="${col}" stroke="${dk(c, .35)}" stroke-width=".5"/>`; };
        for (const u of [-6, 0, 6]){ leaf(u, -3.6, -35); leaf(u, 3.6, 35); }
        leaf(11, 0, 0);
    }
    return `<path d="${st}" stroke="#7aa848" stroke-width=".8" fill="none"/>${lv}`;
}
// fried spring roll (lumpiang shanghai); cut=true shows the filling at one end
function xphLumpia(p, x, y, L, W, r = 0, { cut = true, c = '#d48f32' } = {}){
    const h = W / 2;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-L / 2}" y="${-h}" width="${L}" height="${W}" rx="${f(h * .9)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>${[-.32, -.12, .1, .3].map((t, i) => `<circle cx="${f(L * t)}" cy="${f(h * (i % 2 ? .35 : -.1))}" r="1.1" fill="${lt(c, .4)}" opacity=".8"/><circle cx="${f(L * t + 4)}" cy="${f(h * (i % 2 ? -.2 : .4))}" r=".8" fill="${dk(c, .3)}" opacity=".5"/>`).join('')}
        <path d="M${f(-L * .3)},${f(-h)} Q${f(-L * .25)},0 ${f(-L * .32)},${f(h)} M${f(L * .05)},${f(-h)} Q${f(L * .1)},0 ${f(L * .04)},${f(h)}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".5"/>
        <path d="M${f(-L / 2 + 3)},${f(-h * .45)} L${f(L / 2 - 4)},${f(-h * .45)}" stroke="#fff3d6" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
        ${cut ? `<ellipse cx="${f(L / 2 - 1)}" cy="0" rx="${f(h * .55)}" ry="${f(h - .3)}" fill="#f0d7a0" stroke="${dk(c, .3)}" stroke-width=".6"/><ellipse cx="${f(L / 2 - .6)}" cy=".2" rx="${f(h * .4)}" ry="${f(h - 1.6)}" fill="${p.g('#b98a6a', .2, .25)}"/><circle cx="${f(L / 2 - 1)}" cy="${f(-h * .3)}" r=".8" fill="#ef8a3a"/><circle cx="${f(L / 2)}" cy="${f(h * .35)}" r=".7" fill="#ef8a3a"/>` : ''}</g>`;
}
// cooked pork belly chunk (sinigang): meat with a fat band and skin
function xphPorkChunk(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xphPk' + seed + x + y);
    const pts = [[-11, -7], [0, -8], [11, -7], [12, 0], [11, 7], [0, 8], [-11, 7], [-12, 0]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    const id = p.uid(), shape = xphSm(pts, true);
    return `<g ${T(x, y, r, s / 24)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs><g ${p.sh(.7)}><path d="${shape}" fill="#d9a888"/></g>
        <g clip-path="url(#${id})"><rect x="-14" y="-10" width="28" height="5" fill="#e8cfa8"/><rect x="-14" y="-5.4" width="28" height="4.6" fill="${p.g('#d39a7a', .2, .2)}"/><rect x="-14" y="-.8" width="28" height="3.4" fill="#f4e6cc"/><rect x="-14" y="2.6" width="28" height="4.4" fill="${p.g('#cc9070', .2, .2)}"/><rect x="-14" y="7" width="28" height="4" fill="#efdcbc"/></g>
        <path d="${shape}" fill="none" stroke="#9a6448" stroke-width=".7"/>${xphArc('M-8,-6.5 Q-1,-8.4 6,-7.4', 1.3, .6)}</g>`;
}
// soft scrambled egg patch (flat, irregular)
function xphEggCurd(p, x, y, s, r = 0, { seed = 1, c = '#f6d052' } = {}){
    const R = rng(p.id + 'xphEc' + seed + x + y);
    const pts = ring(s / 2, 10, .38, R, 1.2, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xphSm(pts, true)}" fill="${p.g(c, .4, .2)}" stroke="${dk(c, .22)}" stroke-width=".6"/></g>
        <path d="${xphSm(pts.map(([a, b]) => [a * .55 - 1, b * .5 - 1]), true)}" fill="${lt(c, .35)}" opacity=".7"/>
        <path d="M${f(-s * .1)},${f(s * .12)} q${f(s * .12)},${f(-s * .06)} ${f(s * .24)},0" stroke="${dk(c, .2)}" stroke-width=".7" fill="none" opacity=".6"/>${xphArc(`M${f(-s * .3)},${f(-s * .08)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .12)},${f(-s * .26)}`, 1.2, .7)}</g>`;
}
// bitter melon (ampalaya) half-moon slice: bumpy green rim, pale inner flesh, U-shape
function xphAmpalaya(p, x, y, s, r = 0){
    const k = s / 20;
    const out = Array.from({ length: 13 }, (_, i) => { const a = Math.PI + i / 12 * Math.PI, rr = 10 + (i % 2 ? .9 : 0); return [Math.cos(a) * rr, Math.sin(a) * rr * .9 + 3]; });
    const inn = Array.from({ length: 9 }, (_, i) => { const a = 2 * Math.PI - i / 8 * Math.PI; return [Math.cos(a) * 5, Math.sin(a) * 4.2 + 3]; });
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${xphSm(out)}L${inn.map(([a, b]) => `${f1(a)},${f1(b)}`).join('L')}Z" fill="${p.g('#5aa13c', .25, .25)}" stroke="#2f6a22" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M-7.6,3 A7.6,7 0 0 1 7.6,3 L5,3 A5,4.2 0 0 0 -5,3Z" fill="#cfe6a6"/>${xphArc('M-7,-2 Q-3,-6 2,-6.6', 1, .6)}</g>`;
}
// long green chili (siling haba)
function xphGreenChili(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${-L / 2},0 Q${f(-L * .2)},-4.2 ${f(L * .4)},-3 Q${L / 2},-1 ${L / 2 + 1},0 Q${f(L * .3)},3.6 ${-L / 2},1.6Z" fill="${p.g('#5aa33a', .3, .25)}" stroke="#2f6a1e" stroke-width=".6"/></g>
        <path d="M${L / 2},-.5 q4,-1 6,-4" stroke="#6b8a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>${xphArc(`M${f(-L * .38)},-1.2 Q0,-3.6 ${f(L * .3)},-2.4`, 1, .6)}</g>`;
}
// kangkong: hollow stem pieces and arrow-shaped leaves
function xphKangkongStem(p, x, y, L, r = 0, { c = '#86b84e' } = {}){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="-2.6" width="${L}" height="5.2" rx="2.4" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>
        <ellipse cx="${L / 2 - 1}" cy="0" rx="1.6" ry="2.4" fill="${lt(c, .4)}" stroke="${dk(c, .3)}" stroke-width=".5"/><ellipse cx="${L / 2 - 1}" cy="0" rx=".8" ry="1.3" fill="${dk(c, .4)}"/>
        <path d="M${-L / 2 + 2},-1.2 L${L / 2 - 4},-1.2" stroke="#fff" stroke-width=".8" opacity=".55"/></g>`;
}
function xphKangkongLeaf(p, x, y, s, r = 0, { c = '#2f6e24' } = {}){
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.5)}><path d="M-12,0 Q-8,-5.5 2,-5 Q8,-4 12,0 Q8,4 2,5 Q-8,5.5 -12,0Z M-12,0 L-14,-4 L-10,-1.5Z M-12,0 L-14,4 L-10,1.5Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        <path d="M-11,0 Q0,-.6 11,0" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>${xphArc('M-6,-3 Q0,-5 6,-3.4', 1, .45)}</g>`;
}
// radish (labanos) round slice
function xphRadish(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.rg('#f3efe4', .2, .15)}" stroke="#d1cab6" stroke-width=".6"/></g><ellipse rx="${f(s * .36)}" ry="${f(s * .32)}" fill="none" stroke="#fffdf6" stroke-width="1" opacity=".8"/>${xphArc(`M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .1)},${f(-s * .33)} ${f(s * .14)},${f(-s * .32)}`, 1.2, .6)}</g>`;
}
// soft stewed tomato piece
function xphTomPiece(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xphTp' + seed + x + y);
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="${xphSm(pts, true)}" fill="${p.g('#e2412c', .3, .25)}" stroke="#a6261a" stroke-width=".6"/></g>
        <path d="${xphSm(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true)}" fill="#f37a5c" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>${xphArc('M-7,-4 Q-1,-7.5 5,-5.4', 1.2, .6)}</g>`;
}
// chayote wedge (pale green)
function xphChayote(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-10,4 Q-7,-6 0,-7 Q7,-6 10,4 Q0,7 -10,4Z" fill="${p.g('#cfe3a0', .3, .2)}" stroke="#8fb05a" stroke-width=".7"/></g>
        <path d="M-10,4 Q0,7 10,4 Q0,5.4 -10,2.6Z" fill="#7fae4a" opacity=".85"/><path d="M-5,1 Q0,-3 5,1" stroke="#f1f7dc" stroke-width="2" fill="none" opacity=".8"/>${xphArc('M-6,-3 Q-1,-6.4 5,-4.6', 1.1, .6)}</g>`;
}
// sponge gourd (patola) slice: dark green ridged rim, pale spongy flesh
function xphPatola(p, x, y, s, r = 0, { seed = 1 } = {}){
    // peeled patola cut in chunky rolling wedges: soft translucent pale green, green ridge stripes left on
    const R = rng(p.id + 'xphPt' + seed + x + y);
    const pts = ring(s / 2, 7, .22, R, 1.25, .8);
    const id = p.uid(), shape = xphSm(pts, true);
    return `<g ${T(x, y, r)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs><g ${p.sh(.5)}><path d="${shape}" fill="${p.g('#d4e6a4', .35, .2)}" stroke="#86a95a" stroke-width=".6" opacity=".95"/></g>
        <g clip-path="url(#${id})"><path d="M${f(-s * .6)},${f(-s * .3)} L${f(s * .6)},${f(-s * .42)} M${f(-s * .6)},${f(s * .22)} L${f(s * .6)},${f(s * .1)}" stroke="#4f8a32" stroke-width="${f(s * .1)}" opacity=".85"/>
        <ellipse cx="${f(s * .05)}" cy="${f(-s * .02)}" rx="${f(s * .2)}" ry="${f(s * .12)}" fill="#eef5d2" opacity=".8"/></g>
        ${xphArc(`M${f(-s * .3)},${f(-s * .08)} Q${f(-s * .1)},${f(-s * .24)} ${f(s * .14)},${f(-s * .2)}`, 1.1, .6)}</g>`;
}
// eggplant round slice (skin ring + flesh)
function xphEggplantRound(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .44)}" fill="#4a2558"/></g><ellipse rx="${f(s / 2 - 1.6)}" ry="${f(s * .44 - 1.6)}" fill="${p.rg('#d9c08a', .2, .2)}"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${f(Math.cos(i * 1.05) * s * .2)}" cy="${f(Math.sin(i * 1.05) * s * .17)}" r=".9" fill="#a8885a"/>`).join('')}</g>`;
}
// carrot cut into a little flower (atchara)
function xphCarrotFlower(p, x, y, s, r = 0){
    const pts = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.283, rr = s / 2 * (i % 2 ? .72 : 1); return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="${xphSm(pts, true)}" fill="${p.g('#f08a30', .3, .2)}" stroke="#c0601a" stroke-width=".5"/></g><circle r="${f(s * .2)}" fill="#f8b46a"/></g>`;
}
// fried shrimp-paste free sweet-chili: specks
const xphSpecks = (p, x, y, s, c, n, seed) => xphGrains(p, x, y, s, { cols: [c], n, size: .8, seed });

// =========================================================

// =========================================================
// More local helpers for the x_ph set
// =========================================================
// palayok (unglazed clay pot): terracotta rim, darker inside
function xphClayPot(p, { R = 93, c = '#a85a32' } = {}){
    return `<g ${p.sh(1.9)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .22, .32, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${f(R * .955)}" fill="none" stroke="${lt(c, .3)}" stroke-width="2.4" opacity=".55"/>
        <circle cx="100" cy="100" r="${f(R * .87)}" fill="${dk(c, .45)}"/>
        <circle cx="100" cy="100" r="${f(R * .84)}" fill="${p.rg(dk(c, .25), .1, .3, .62, .64)}"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .38)} A${f(R * .84)},${f(R * .84)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#ffe2c8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".45"/>`;
}
// white enamel basin with a dark blue rim (kaserola / palanggana style)
function xphEnamel(p, { R = 93, rim = '#2b4f8a', inside = '#fbfaf5' } = {}){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${rim}"/></g>
        <circle cx="100" cy="100" r="${f(R - 3.2)}" fill="${p.rg('#f7f6f0', .2, .14, .38, .32)}"/>
        <circle cx="100" cy="100" r="${f(R * .84)}" fill="${p.rg(inside, .1, .22, .62, .64)}"/>
        <path d="M${f(100 - R * .72)},${f(100 - R * .42)} A${f(R * .84)},${f(R * .84)} 0 0 1 ${f(100 - R * .26)},${f(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// coloured glazed ceramic bowl (glaze outside, cream inside)
const xphGlazed = (p, glaze, inside = '#f4ecdc', R = 92) => K.bowl(p, { glaze, inside, R });
// round wooden chopping board (sangkalan)
function xphBoard(p, { R = 94, c = '#a8703e' } = {}){
    const R2 = rng(p.id + 'brd');
    let gr = '';
    for (let i = 0; i < 9; i++){ const y = 100 - R * .8 + i * R * .2 + (R2() - .5) * 4; gr += `M${f(100 - R)},${f(y)} Q100,${f(y + (R2() - .5) * 10)} ${f(100 + R)},${f(y + (R2() - .5) * 6)}`; }
    const cl = p.uid();
    return `<defs><clipPath id="${cl}"><circle cx="100" cy="100" r="${R - 4}"/></clipPath></defs>
        <g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(dk(c, .15), .15, .25, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 4}" fill="${p.rg(c, .2, .18, .4, .36)}"/>
        <path clip-path="url(#${cl})" d="${gr}" stroke="${dk(c, .25)}" stroke-width=".9" fill="none" opacity=".45"/>
        <circle cx="100" cy="100" r="${f(R * .3)}" fill="none" stroke="${dk(c, .2)}" stroke-width=".8" opacity=".35"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .38)} A${f(R * .84)},${f(R * .84)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#fff3e0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`;
}
// bilao: round woven bamboo tray (lined with banana leaf on top by the caller)
function xphBilao(p, { R = 95, c = '#d6b274' } = {}){
    const cl = p.uid();
    let w = '';
    for (let i = -12; i <= 12; i++){ const o = i * 8; w += `M${100 + o - 100},0 L${100 + o + 100},200 M${100 + o + 100},0 L${100 + o - 100},200 `; }
    return `<defs><clipPath id="${cl}"><circle cx="100" cy="100" r="${R - 6}"/></clipPath></defs>
        <g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(dk(c, .1), .2, .25, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${f(R - 3)}" fill="none" stroke="${dk(c, .3)}" stroke-width="5"/>
        <circle cx="100" cy="100" r="${f(R - 3)}" fill="none" stroke="${lt(c, .2)}" stroke-width="2" stroke-dasharray="3 2"/>
        <circle cx="100" cy="100" r="${R - 6}" fill="${p.rg(c, .2, .2, .4, .36)}"/>
        <path clip-path="url(#${cl})" d="${w}" stroke="${dk(c, .22)}" stroke-width="1.6" fill="none" opacity=".45"/>`;
}

// stewed beef chunk (fibres + gloss)
function xphBeefChunk(p, x, y, s, r = 0, { c = '#6e3418', seed = 1, fat = null } = {}){
    const R = rng(p.id + 'xBc' + seed + x + y);
    const pts = ring(10, 8, .26, R, 1.15, .9, R());
    return `<g ${T(x, y, r, s / 22)}><path d="${xphSm(pts, true)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .45)}" stroke-width=".7"/>
        ${fat ? `<path d="${xphSm(pts.slice(0, 4).map(([a, b]) => [a * .85, b * .85]))}" stroke="${fat}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".85"/>` : ''}
        <path d="M-7,-1 q3,-2 6,0 t6,0 M-6,3.5 q3,-2 6,0 t5,0" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".55"/>
        ${xphArc('M-7,-4.5 Q-2,-7.5 4,-6', 1.6, .7)}</g>`;
}
// beef shank / oxtail cross-section: meat ring around a bone with marrow
function xphShank(p, x, y, s, r = 0, { c = '#8a4a28', seed = 1, marrow = true } = {}){
    const R = rng(p.id + 'xSh' + seed + x);
    const pts = ring(10, 10, .2, R, 1.1, .95);
    return `<g ${T(x, y, r, s / 22)}><g ${p.sh(.8)}><path d="${xphSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="${xphSm(pts.map(([a, b]) => [a * .85, b * .85]), true)}" fill="none" stroke="${lt(c, .3)}" stroke-width=".8" opacity=".5"/>
        <path d="M-6,4 q-2,-5 1,-8 M5,5 q3,-3 2,-8" stroke="${dk(c, .4)}" stroke-width=".8" fill="none" opacity=".5"/>
        <ellipse cx="1" cy=".5" rx="4.6" ry="4" fill="${p.g('#f2ead6', .2, .25)}" stroke="#bfae8a" stroke-width=".5"/>
        ${marrow ? `<ellipse cx="1.3" cy=".8" rx="2.6" ry="2.2" fill="${p.rg('#cf9a6a', .3, .25)}"/>` : `<circle cx="1.3" cy=".8" r="1.4" fill="#d9c7a0"/>`}
        ${xphArc('M-7,-4.5 Q-2,-8 4,-7', 1.4, .6)}</g>`;
}
// crispy pork belly piece (lechon kawali): blistered skin band, fat, meat
function xphLechon(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xLe' + seed);
    const id = p.uid();
    const sk = h * .48, ft = h * .1;
    let bub = '';
    for (let i = 0; i < 16; i++) bub += `<circle cx="${f((R() - .5) * w * .9)}" cy="${f(-h / 2 + 1.5 + R() * (sk - 3))}" r="${f(.7 + R() * 1.3)}" fill="${R() < .6 ? '#f0b860' : '#6a2a0a'}" opacity=".85"/>`;
    return `<g ${T(x, y, r)}><defs><clipPath id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .22)}"/></clipPath></defs>
        <g ${p.sh(1)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .22)}" fill="#b87440"/></g>
        <g clip-path="url(#${id})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${sk}" fill="${p.g('#b4561a', .4, .35)}"/>
        <g ${p.crumb(.9)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${sk}" fill="#c2641e" opacity=".8"/></g>${bub}
        <rect x="${-w / 2}" y="${f(-h / 2 + sk)}" width="${w}" height="${f(ft)}" fill="#f2dcae"/>
        <rect x="${-w / 2}" y="${f(-h / 2 + sk + ft)}" width="${w}" height="${f(h)}" fill="${p.g('#c88a52', .3, .35)}"/>
                <path d="M${f(-w * .3)},${f(h * .05)} l0,${f(h * .35)} M${f(w * .05)},${f(h * .05)} l0,${f(h * .35)} M${f(w * .3)},${f(h * .08)} l0,${f(h * .3)}" stroke="#b07a52" stroke-width=".6" opacity=".55"/></g>
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${f(h * .22)}" fill="none" stroke="#8a4a1e" stroke-width=".7"/>
        ${xphArc(`M${f(-w / 2 + 3)},${f(-h / 2 + 2.4)} L${f(w / 2 - 4)},${f(-h / 2 + 2.4)}`, 1.4, .75)}</g>`;
}
// head-on whole shrimp seen from above (pointing left), length s
function xphPrawn(p, x, y, s, r = 0, { c = '#ea6a3a' } = {}){
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.6)}>
        <path d="M14,-2 L22,-7 Q20,0 22,7 L14,2Z" fill="${p.g(dk(c, .1), .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M-7,-5.6 C2,-7 9,-5.6 15,-2.6 L15,2.6 C9,5.6 2,7 -7,5.6Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M-7,-5.6 C-13,-7 -20,-4 -23,0 C-20,4 -13,7 -7,5.6 Q-5,0 -7,-5.6Z" fill="${p.g(dk(c, .05), .25, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M-2,-6.4 Q0,0 -2,6.4 M3,-6.4 Q5,0 3,6.4 M8,-5.2 Q10,0 8,5.2 M12,-3.6 Q13.4,0 12,3.6" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".75"/>
        <path d="M-22,-1 L-30,-2 M-21,-2 Q-30,-10 -38,-7 M-21,2 Q-30,10 -38,8" stroke="${dk(c, .2)}" stroke-width=".7" fill="none" stroke-linecap="round"/>
        <circle cx="-17" cy="-3.2" r="1.3" fill="#2a1406"/><circle cx="-17" cy="3.2" r="1.3" fill="#2a1406"/>
        ${xphArc('M-4,-4 Q4,-5.4 11,-3', 1.4, .7)}${xphArc('M-19,-2 Q-14,-4.4 -9,-4', 1, .55)}</g>`;
}
// mussel (tahong) on the half shell with orange meat
function xphMussel(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.7)}><path d="M-15,0 Q-13,-7 0,-8.6 Q12,-8.4 15,-1 Q13,8 0,8.4 Q-12,7.6 -15,0Z" fill="${p.g('#2e3446', .35, .2)}" stroke="#151a26" stroke-width=".7"/></g>
        <path d="M-13,0 Q-11,-5.6 0,-6.8 Q10,-6.6 12.6,-1 Q11,6.2 0,6.6 Q-10.4,6 -13,0Z" fill="#cfd0d8"/>
        <path d="M-11,.2 Q-9,-4.4 0,-5.2 Q8.6,-5 10.6,-.6 Q9,4.8 0,5 Q-8.6,4.6 -11,.2Z" fill="${p.g('#f2994a', .3, .25)}" stroke="#c96a26" stroke-width=".5"/>
        <path d="M-9,1 Q-2,4 9,-.4" stroke="#8a3a12" stroke-width="1.1" fill="none" opacity=".55"/>
        ${xphArc('M-7,-3 Q-1,-5 5,-4', 1.1, .7)}</g>`;
}
// corn on the cob section lying on its side (rows of kernels)
function xphCob(p, x, y, L, W, r = 0){
    let k = '';
    const nc = Math.max(3, Math.round(L / 5.2)), nr = Math.max(3, Math.round(W / 4.6));
    for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++){
        const kx = -L / 2 + (i + .5) * L / nc, ky = -W / 2 + (j + .5) * W / nr, sq = 1 - Math.abs(ky) / W;
        k += `<rect x="${f(kx - L / nc / 2 + .4)}" y="${f(ky - W / nr / 2 + .4)}" width="${f(L / nc - .8)}" height="${f(W / nr * sq - .6)}" rx="1.2"/>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${f(W * .3)}" fill="#d9a62a"/></g>
        <g fill="${p.g('#f6cf46', .35, .2)}" stroke="#c99316" stroke-width=".4">${k}</g>
        ${xphArc(`M${f(-L / 2 + 3)},${f(-W * .3)} L${f(L / 2 - 3)},${f(-W * .3)}`, 1.4, .6)}</g>`;
}
// bok choy / pechay leaf: white spoon stem and dark green blade (length s, stem to the right)
function xphPechay(p, x, y, s, r = 0, { c = '#3f8a2e', cooked = true } = {}){
    const col = cooked ? mix(c, '#4a6a1a', .2) : c;
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.6)}>
        <path d="M-4,-4.6 Q8,-6 21,-4.4 Q23,0 21,4.4 Q8,6 -4,4.6Z" fill="${p.g('#eef4d6', .3, .2)}" stroke="#a8c07a" stroke-width=".6"/>
        <path d="M-22,0 Q-21,-8 -10,-8.6 Q0,-9 4,-4.4 Q6,0 4,4.4 Q0,9 -10,8.6 Q-21,8 -22,0Z" fill="${p.g(col, .25, .25)}" stroke="${dk(col, .35)}" stroke-width=".6"/></g>
        <path d="M-20,0 L8,0" stroke="${lt(col, .5)}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M-14,0 L-17,-5 M-8,0 L-10,-6.6 M-2,0 L-3,-6.4 M-14,0 L-17,5 M-8,0 L-10,6.6 M-2,0 L-3,6.4" stroke="${lt(col, .3)}" stroke-width=".7" fill="none"/>
        <path d="M6,-2 L20,-2.4 M6,2 L20,2.4" stroke="#d2e2a8" stroke-width=".7"/>
        ${xphArc('M-17,-4.6 Q-10,-8 -2,-7', 1.2, .5)}${xphArc('M2,-3 Q10,-4.4 19,-3', 1, .6)}</g>`;
}
// cabbage wedge (nilaga)
function xphCabWedge(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.7)}><path d="M-15,7 Q-17,-7 -2,-12 Q13,-12 16,2 Q8,11 -15,7Z" fill="${p.g('#dfeab2', .3, .2)}" stroke="#9cb86a" stroke-width=".6"/></g>
        <path d="M-15,7 Q-17,-7 -2,-12 Q13,-12 16,2" stroke="#8fbf5a" stroke-width="2.4" fill="none" opacity=".85"/>
        <path d="M-11,6 Q-12,-4 -1,-8 Q9,-8 12,1 M-7,6 Q-7,-1 0,-4 Q6,-4 8,2 M-3,6 Q-2,1 2,0" stroke="#f6f9e6" stroke-width="1.1" fill="none" opacity=".9"/>
        <path d="M-14,7 Q0,9 15,2" stroke="#e9e5c0" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`;
}
// saba banana slice (thick, diagonal)
function xphSaba(p, x, y, s, r = 0, { c = '#e9b65a' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .34)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <ellipse rx="${f(s * .3)}" ry="${f(s * .18)}" fill="${lt(c, .2)}" opacity=".8"/><path d="M${f(-s * .2)},0 L${f(s * .2)},0" stroke="${dk(c, .2)}" stroke-width=".8" stroke-dasharray="1.2 1.6"/>
        ${xphArc(`M${f(-s * .3)},${f(-s * .16)} Q0,${f(-s * .3)} ${f(s * .26)},${f(-s * .2)}`, 1.1, .6)}</g>`;
}
// fish steak cross-section (bangus / dalag): silver skin rim, white flesh, backbone
function xphFishSteak(p, x, y, s, r = 0, { skin = '#9aa4b0', flesh = '#f1ead9', belly = false } = {}){
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.7)}>${belly
        ? `<path d="M-15,-3 Q-13,-10 0,-10 Q13,-10 15,-3 Q12,9 0,9 Q-12,9 -15,-3Z" fill="${p.g(skin, .35, .25)}" stroke="${dk(skin, .35)}" stroke-width=".6"/>`
        : `<ellipse rx="15" ry="10.5" fill="${p.g(skin, .35, .25)}" stroke="${dk(skin, .35)}" stroke-width=".6"/>`}</g>
        <ellipse cx=".3" cy=".3" rx="14" ry="9.5" fill="${p.rg(flesh, .15, .15)}"/><path d="M-12,-5 Q0,-10.4 12,-5" stroke="${lt(skin, .4)}" stroke-width=".8" fill="none" opacity=".8"/>
        <path d="M-11,0 Q0,-2 11,0 M-8,-5 Q-4,0 -8,5 M8,-5 Q4,0 8,5" stroke="${dk(flesh, .15)}" stroke-width=".7" fill="none" opacity=".7"/>
        ${belly ? '' : `<circle cx="0" cy="-.5" r="2.2" fill="#e6dcc2" stroke="#b8a88a" stroke-width=".5"/>`}
        ${xphArc('M-9,-6 Q0,-9.6 9,-6.6', 1.5, .65)}</g>`;
}
// ring of sliced long green chili (siling haba)
function xphChiliRing(p, x, y, s, r = 0, { c = '#4f9a30' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .4)}" fill="${lt(c, .55)}" stroke="${c}" stroke-width="${f(s * .16)}"/>
        <circle cx="${f(s * .08)}" cy="0" r="${f(s * .08)}" fill="#f4f1c8"/><circle cx="${f(-s * .1)}" cy="${f(s * .06)}" r="${f(s * .06)}" fill="#f4f1c8"/></g>`;
}
// small red bird's-eye chili (labuyo)
function xphLabuyo(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-6,-3 6,-2 Q9,0 6,2 Q-6,3 -10,0Z" fill="${p.g('#d8261c', .3, .25)}" stroke="#8e1410" stroke-width=".5"/><path d="M6,-1 q3,-1 5,-3" stroke="#4f8a2b" stroke-width="1.4" fill="none" stroke-linecap="round"/>${xphArc('M-6,-1.2 Q0,-2.6 4,-1.6', .8, .7)}</g>`;
}
// green olive with pimiento
function xphOlive(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .4)}" fill="${p.rg('#8a9a3a', .3, .3, .35, .32)}" stroke="#4f5a1a" stroke-width=".5"/></g><ellipse cx="${f(s * .1)}" rx="${f(s * .16)}" ry="${f(s * .13)}" fill="#c8301e"/><ellipse cx="${f(-s * .2)}" cy="${f(-s * .16)}" rx="${f(s * .1)}" ry="${f(s * .05)}" fill="#fff" opacity=".7"/></g>`;
}
// pineapple chunk (wedge with fibre lines)
function xphPineapple(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.6)}><path d="M-10,6 L-7,-7 Q0,-9 8,-6 L10,6 Q0,8.4 -10,6Z" fill="${p.g('#f7d348', .35, .2)}" stroke="#c99a14" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M-6,5 L-4,-5 M-1,6 L0,-6 M4,6 L4,-6" stroke="#e8b828" stroke-width=".8" opacity=".8"/><path d="M-7,-7 Q0,-9 8,-6 L7,-4 Q0,-6.4 -6.5,-5Z" fill="#fbe68a"/></g>`;
}
// small soft cubes reused through <use> (keeps file size down)
const xphCubes = (p, key, pts, s, c, opt = {}) => pts.map(([x, y, a]) => xphUse(p, key, () => xphDice(p, 0, 0, s, 0, c, opt), x, y, a)).join('');
// translucent sauce wash over the food so it reads "coated"
const xphWash = (c, R = 60, op = .18, cx = 100, cy = 100) => `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${c}" opacity="${op}"/>`;
// glossy sauce highlights (short white strokes)
function xphGloss(p, seed, n = 6, rmax = 56, op = .55){
    return xphSpots('gl' + seed + p.id, n, rmax, 18).map(([x, y, a]) => `<path ${T(x, y, a)} d="M-4,0 Q0,-2 4,0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`).join('');
}
// dark peppercorns
const xphPepper = (p, x, y, s, n = 10, seed = 1) => xphGrains(p, x, y, s, { cols: ['#2e2216', '#4a3a26'], n, size: 1.4, seed });
// fried garlic bits
const xphFriedGarlic = (p, x, y, s, n = 24, seed = 1) => xphGrains(p, x, y, s, { cols: ['#d89a3a', '#b8742a', '#e8b860'], n, size: 1.5, seed });
// a bowl of tinted broth with a gentle shine and tiny oil droplets
function xphBroth(p, c, { R = 72, op = .95, oil = 0, oilC = '#f2b23a', seed = 1, cx = 100, cy = 100 } = {}){
    let d = '';
    if (oil){ const Rr = rng(p.id + 'oil' + seed); for (let i = 0; i < oil; i++){ const a = Rr() * 6.28, dd = Math.sqrt(Rr()) * R * .9, rr = 1 + Rr() * 3; d += `<circle cx="${f(cx + Math.cos(a) * dd)}" cy="${f(cy + Math.sin(a) * dd)}" r="${f(rr)}" fill="${oilC}" opacity=".45"/><circle cx="${f(cx + Math.cos(a) * dd - rr * .3)}" cy="${f(cy + Math.sin(a) * dd - rr * .3)}" r="${f(rr * .3)}" fill="#fff" opacity=".6"/>`; } }
    return K.liquid(p, { R, c, op, cx, cy, shine: false }) + d;
}
// sprig of small paired leaflets (tamarind leaves, malunggay) with leaf size control
function xphSprig(p, x, y, s, { n = 6, seed = 1, c = '#4f9a30', lw = 2.4, pairs = 5 } = {}){
    const R = rng(p.id + 'xSp' + seed + x + y);
    let st = '', lv = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, ang = R() * 360, rad = ang / 57.3, half = pairs * lw;
        st += `M${f1(cx - Math.cos(rad) * half)} ${f1(cy - Math.sin(rad) * half)}L${f1(cx + Math.cos(rad) * half)} ${f1(cy + Math.sin(rad) * half)}`;
        for (let j = 0; j < pairs; j++){ const u = -half + lw + j * lw * 2;
            for (const sgn of [-1, 1]){ const v = sgn * lw * 1.1, px = cx + Math.cos(rad) * u - Math.sin(rad) * v, py = cy + Math.sin(rad) * u + Math.cos(rad) * v; lv += `<ellipse cx="${f1(px)}" cy="${f1(py)}" rx="${f1(lw * 1.25)}" ry="${f1(lw * .7)}" transform="rotate(${f1(ang + sgn * 50)} ${f1(px)} ${f1(py)})"/>`; } }
    }
    return `<g ${p.sh(.4)}><path d="${st}" stroke="${dk(c, .1)}" stroke-width=".7" fill="none"/><g fill="${c}" stroke="${dk(c, .35)}" stroke-width=".4">${lv}</g></g>`;
}
// wonton (molo): filling bump with a soft translucent wrapper skirt
function xphWonton(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xWt' + seed + x);
    const sk = ring(13, 12, .45, R, 1.25, .9);
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.6)}><path d="${xphSm(sk, true)}" fill="#f6eedc" stroke="#d9c8a6" stroke-width=".6" opacity=".9"/></g>
        <path d="M-10,3 Q-4,0 0,4 M4,6 Q8,3 12,5" stroke="#e2d2b2" stroke-width=".8" fill="none"/>
        <ellipse cx="-2" cy="-1" rx="7.4" ry="6.4" fill="${p.rg('#ecd3b4', .3, .22, .35, .32)}" stroke="#c9a682" stroke-width=".6"/>
        <ellipse cx="-4.5" cy="-3.4" rx="2.4" ry="1.3" fill="#fff" opacity=".7"/></g>`;
}
// lacy crisp fritter (okoy) with shrimp on top
function xphOkoy(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xOk' + seed + x);
    const pts = ring(s / 2, 12, .3, R, 1, .92);
    let sh = '';
    for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = s * (.32 + R() * .2), L = 5 + R() * 6, b = a + (R() - .5) * 1.2; sh += `M${f1(Math.cos(a) * d)} ${f1(Math.sin(a) * d)}l${f1(Math.cos(b) * L)} ${f1(Math.sin(b) * L)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${sh}" stroke="#c97a22" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <g ${p.rough(3, .12)}><path d="${xphSm(pts, true)}" fill="${p.g('#d99436', .35, .35)}" stroke="#9a5a16" stroke-width=".7"/></g></g>
        <g ${p.crumb(.6)}><path d="${xphSm(pts.map(([a, b]) => [a * .8, b * .8]), true)}" fill="#e2a447" opacity=".8"/></g>
        ${xphShreds(p, 0, 0, s * .8, { c: '#e8902a', n: 10, w: 1.8, len: .3, seed, outline: false })}
        ${K.shrimp(p, f(-s * .12), f(-s * .1), s * .3, 30 + seed * 40, { c: '#ec6a3c' })}${K.shrimp(p, f(s * .16), f(s * .14), s * .26, -50 + seed * 30, { c: '#e8643a' })}
        <path d="M${f(-s * .32)},${f(-s * .18)} Q${f(-s * .12)},${f(-s * .38)} ${f(s * .12)},${f(-s * .34)}" stroke="#fff3d6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// butterflied fried milkfish (daing na bangus), flesh side up, head split on the left
function xphDaing(p, x, y, L, r = 0){
    const k = L / 140;
    let ribs = '';
    for (let i = 0; i < 9; i++){ const sx = -40 + i * 10; ribs += `M${sx},-3 Q${sx + 6},-16 ${sx + 4},-30 M${sx},3 Q${sx + 6},16 ${sx + 4},30 `; }
    const body = 'M-56,-6 C-54,-30 -32,-40 -6,-40 C22,-39 42,-26 52,-6 L70,-24 Q63,0 70,24 L52,6 C42,26 22,39 -6,40 C-32,40 -54,30 -56,6 Q-60,0 -56,-6Z';
    return `<g ${T(x, y, r, k)}><g ${p.sh(1.2)}><path d="${body}" fill="${p.g('#c98a3e', .3, .35)}" stroke="#7a4214" stroke-width="1"/></g>
        <g ${p.crumb(.7)}><path d="M-50,-5 C-48,-26 -30,-35 -6,-35 C20,-34 38,-23 47,-5 L47,5 C38,23 20,34 -6,35 C-30,35 -48,26 -50,5Z" fill="#d9a050" opacity=".7"/></g>
        <path d="${ribs}" stroke="#b06a24" stroke-width="1.2" fill="none" opacity=".55"/>
        <path d="M-52,0 L50,0" stroke="#8a4a18" stroke-width="3.4" stroke-linecap="round" opacity=".75"/><path d="M-50,-1 L48,-1" stroke="#e9c27a" stroke-width="1" opacity=".7"/>
        <path d="M54,-6 L67,-20 M54,6 L67,20 M55,-2 L66,-8 M55,2 L66,8" stroke="#7a4214" stroke-width=".8" opacity=".6"/>
        <path d="M-56,-6 C-55,-14 -50,-22 -42,-24 L-40,-4Z M-56,6 C-55,14 -50,22 -42,24 L-40,4Z" fill="#9a5a20" opacity=".8"/>
        <circle cx="-50" cy="-13" r="3.2" fill="#efe2c6" stroke="#5a2e0e" stroke-width=".7"/><circle cx="-50" cy="-13" r="1.4" fill="#4a3a2a"/>
        <circle cx="-50" cy="13" r="3.2" fill="#efe2c6" stroke="#5a2e0e" stroke-width=".7"/><circle cx="-50" cy="13" r="1.4" fill="#4a3a2a"/>
        ${[[-20, -24, 9], [10, -20, 8], [28, 18, 7], [-14, 22, 8], [36, -12, 6]].map(([a, b, rr]) => `<ellipse cx="${a}" cy="${b}" rx="${rr}" ry="${f(rr * .5)}" fill="#8a4a14" opacity=".28"/>`).join('')}
        ${xphArc('M-40,-26 Q-18,-36 10,-33', 2.6, .5)}${xphArc('M-30,10 Q-10,14 8,12', 1.4, .35)}</g>`;
}
// squid tube (adobong pusit) with tentacles, pointing right
function xphSquid(p, x, y, s, r = 0, { c = '#7a6070' } = {}){
    return `<g ${T(x, y, r, s / 40)}>
        <path d="M-12,-2 Q-20,-6 -26,-3 M-12,0 Q-21,0 -27,2 M-12,2 Q-19,7 -25,7 M-12,-1 Q-18,-10 -23,-9" stroke="${dk(c, .2)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <g ${p.sh(.7)}><path d="M-12,-5 Q-14,0 -12,5 L10,5.4 Q18,4 20,0 Q18,-4 10,-5.4Z" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .4)}" stroke-width=".6"/>
        <path d="M12,-4.6 L22,-9 L21,0 L22,9 L12,4.6Z" fill="${p.g(dk(c, .08), .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/></g>
        <ellipse cx="-12" cy="0" rx="2.6" ry="4.6" fill="${dk(c, .35)}"/>
        ${xphArc('M-8,-3 Q2,-4.8 12,-3.4', 1.4, .75)}</g>`;
}
// slice of young jackfruit (langka): pale wedge with fibrous core
function xphLangka(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.6)}><path d="M-10,5 L-6,-7 Q2,-9 9,-5 L8,6 Q0,8 -10,5Z" fill="${p.g('#e6d6a2', .35, .2)}" stroke="#b5a066" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M-6,4 Q-3,-1 -4,-6 M-2,5 Q0,0 -1,-7 M2,5 Q4,0 3,-7 M6,5 Q7,0 6,-5" stroke="#cdb878" stroke-width=".7" fill="none"/>
        <path d="M6,-5 L8,6 L5,6 L4,-5Z" fill="#9aa860" opacity=".75"/>${xphArc('M-5,-5 Q0,-7 5,-6', 1, .6)}</g>`;
}
// green mango strip / wedge (pale yellow-green, skin edge optional)
function xphMango(p, x, y, L, W, r = 0, { c = '#e3e6a0', skin = null } = {}){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${f(W * .4)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .3)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-L / 2}" y="${f(W / 2 - W * .28)}" width="${L}" height="${f(W * .28)}" rx="${f(W * .14)}" fill="${skin}"/>` : ''}
        <path d="M${f(-L / 2 + 2)},${f(-W * .2)} L${f(L / 2 - 2)},${f(-W * .2)}" stroke="#fff" stroke-width="${f(Math.min(1.2, W * .25))}" stroke-linecap="round" opacity=".7"/></g>`;
}
// bagoong (shrimp paste) dollop
function xphBagoong(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'xBg' + seed + x);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${xphSm(ring(s / 2, 9, .35, R, 1.1, .85), true)}" fill="${p.rg('#9a4f56', .25, .25)}" stroke="#6a2a30" stroke-width=".6"/></g>${xphGrains(p, x, y, s * .8, { cols: ['#c27a7a', '#6e2a32'], n: 14, size: .9, seed })}<ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .17)}" rx="${f(s * .14)}" ry="${f(s * .06)}" fill="#fff" opacity=".55"/>`;
}

// bean sprouts drawn as one stroked path (outline + body + yellow heads)
function xphSprouts(p, x, y, s, { n = 60, seed = 1, sy = .9 } = {}){
    const R = rng(p.id + 'xSpr' + seed + x);
    let d = '', h = '';
    for (let i = 0; i < n; i++){
        const a0 = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a0) * dd, cy = y + Math.sin(a0) * dd * sy, a = R() * Math.PI, L = 10 + R() * 10, b = (R() - .5) * 6;
        const x1 = cx - Math.cos(a) * L / 2, y1 = cy - Math.sin(a) * L / 2, x2 = cx + Math.cos(a) * L / 2, y2 = cy + Math.sin(a) * L / 2;
        d += `M${f1(x1)} ${f1(y1)}Q${f1(cx + b)} ${f1(cy - b)} ${f1(x2)} ${f1(y2)}`;
        if (R() < .7) h += `M${f1(x2)} ${f1(y2)}l.1 0`;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.5)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="#c9c09a" stroke-width="3.2"/><use href="#${id}" stroke="#f8f5e6" stroke-width="2.2"/></g><path d="${h}" stroke="#e2c84a" stroke-width="3.4" stroke-linecap="round" fill="none"/>`;
}

// whole okra pod (stem cap on the left, pointed tip on the right)
function xphOkraPod(p, x, y, s, r = 0, { c = '#5aa03a' } = {}){
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.6)}><path d="M-15,-6.4 L17,-1.2 Q19,0 17,1.2 L-15,6.4 Q-17,0 -15,-6.4Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M-15,-6.4 Q-17,0 -15,6.4 L-18,5.4 Q-21,3 -19,0 Q-21,-3 -18,-5.4Z" fill="#9ab85a" stroke="#4a6a2a" stroke-width=".5"/><path d="M-19,0 L-25,-.6" stroke="#a8b86a" stroke-width="2.4" stroke-linecap="round"/></g>
        <path d="M-15,-3.4 L16,-.6 M-15,0 L17,0 M-15,3.4 L16,.6" stroke="${dk(c, .25)}" stroke-width=".7" fill="none" opacity=".7"/>
        ${xphArc('M-12,-4 Q0,-5.6 10,-2.6', 1.2, .6)}</g>`;
}

// half coconut shell bowl (binakol): hairy brown shell, white meat rim
function xphCoconut(p, { R = 92 } = {}){
    const Rr = rng(p.id + 'coco');
    let hair = '';
    for (let i = 0; i < 70; i++){ const a = Rr() * 6.28, d = R * (.9 + Rr() * .1), L = 3 + Rr() * 4, b = a + (Rr() - .5) * 1.4; hair += `M${f1(100 + Math.cos(a) * d)} ${f1(100 + Math.sin(a) * d)}l${f1(Math.cos(b) * L)} ${f1(Math.sin(b) * L)}`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#7a4a26', .2, .35, .35, .3)}"/></g>
        <path d="${hair}" stroke="#a8784a" stroke-width=".9" fill="none" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(R * .86)}" fill="${p.rg('#fbf8ee', .1, .12, .4, .36)}" stroke="#5a3418" stroke-width="1.2"/>
        <circle cx="100" cy="100" r="${f(R * .79)}" fill="${p.rg('#efe8d6', .1, .25, .62, .64)}"/>
        <path d="M${f(100 - R * .7)},${f(100 - R * .42)} A${f(R * .82)},${f(R * .82)} 0 0 1 ${f(100 - R * .25)},${f(100 - R * .78)}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// mustard green (mustasa) leaf: big frilly light-green leaf with pale midrib
function xphMustasa(p, x, y, s, r = 0, { seed = 1, c = '#5aa040' } = {}){
    const R = rng(p.id + 'xMu' + seed + x + y);
    const pts = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.283, rr = (i % 2 ? 8.4 : 10) * (1 + (R() - .5) * .2); return [Math.cos(a) * rr * 1.4, Math.sin(a) * rr * .8]; });
    return `<g ${T(x, y, r, s / 28)}><g ${p.sh(.5)}><path d="${xphSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-13,0 L14,0" stroke="${lt(c, .55)}" stroke-width="2.2" stroke-linecap="round"/><path d="M-6,0 L-9,-5 M0,0 L-2,-6 M6,0 L4,-5 M-6,0 L-9,5 M0,0 L-2,6 M6,0 L4,5" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/></g>`;
}
// chicken pieces poached in broth (pale), simple irregular chunks with skin
const xphPoached = (p, x, y, s, r, seed, c = '#eed6a8') => xphThigh(p, x, y, s, r, { c, seed });
// shredded chicken (pale strands)
const xphChickShreds = (p, x, y, s, n = 16, seed = 1) => xphShreds(p, x, y, s, { c: '#eedcb6', n, w: 3, len: .22, seed, curve: .5 });

// enlarge a group of food about the centre (to fill the vessel more)
const xphZoom = (k, ...parts) => `<g transform="translate(100 100) scale(${k}) translate(-100 -100)">${parts.join('')}</g>`;

// =========================================================
export default {
    // Menudo: small pork and liver cubes with diced potato, carrot, red pepper and raisins in tomato sauce
    ph_menudo: p => {
        const sp = xphSpots('menudo', 38, 60, 14.2);
        return [
            xphFloralPlate(p, { c: '#c8502e', c2: '#f2c14a' }),
            K.pool(p, 100, 101, 140, '#b0402a', { seed: 1, sy: .94 }),
            xphGrains(p, 100, 101, 128, { cols: ['#9a321e', '#c4502e'], n: 60, size: 2.4, seed: 1 }),
            `<g ${p.sh(.7)}>`,
            xphCubes(p, 'pk', sp.slice(0, 13), 16, '#a65a36', { skin: '#ecd0a6' }),
            xphCubes(p, 'lv', sp.slice(13, 19), 14, '#5c2218'),
            xphCubes(p, 'po', sp.slice(19, 28), 16, '#e9bf6c'),
            xphCubes(p, 'ca', sp.slice(28, 34), 13, '#ea762a'),
            sp.slice(34).map(([x, y, a]) => K.pepperPiece(p, x, y, 16, a, { c: '#d8302a' })).join(''),
            K.pepperPiece(p, 70, 74, 13, 30, { c: '#d8302a' }), K.pepperPiece(p, 132, 128, 13, -20, { c: '#d8302a' }),
            `</g>`,
            xphWash('#b8452e', 66, .16),
            xphSpots('menR', 12, 52, 14).map(([x, y, a]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.8" ry="1.9" transform="rotate(${a} ${f(x)} ${f(y)})" fill="#4a2420" stroke="#2a1008" stroke-width=".4"/>`).join(''),
            xphGloss(p, 1, 8, 56),
        ].join('');
    },

    // Kalderetang baka: big beef chunks in a thick red-brown liver-tomato sauce, potato, carrot, green and red peppers, green olives
    ph_kaldereta: p => [
        xphEnamel(p, { rim: '#7a2a1e' }),
        K.liquid(p, { R: 76, c: '#94361e', op: 1, shine: false }),
        xphGrains(p, 100, 100, 140, { cols: ['#7a2814', '#a8442a'], n: 50, size: 2.4, seed: 2 }),
        `<g ${p.sh(1)}>`,
        xphBeefChunk(p, 76, 78, 34, -10, { c: '#6a2c16', seed: 1 }), xphBeefChunk(p, 124, 74, 32, 30, { c: '#70301a', seed: 2 }),
        xphBeefChunk(p, 100, 106, 34, 70, { c: '#662a14', seed: 3 }), xphBeefChunk(p, 66, 122, 30, 20, { c: '#6c2e18', seed: 4 }),
        xphBeefChunk(p, 130, 122, 32, -40, { c: '#6a2c16', seed: 5 }), xphBeefChunk(p, 100, 146, 26, 10, { c: '#70301a', seed: 6 }),
        K.potato(p, 52, 96, 26, 20, { c: '#e2a864' }), K.potato(p, 150, 98, 26, -10, { c: '#e0a660' }), K.potato(p, 98, 66, 24, 40, { c: '#e4ac68' }),
        K.carrotChunk(p, 84, 136, 20, 30, { c: '#e2662a' }), K.carrotChunk(p, 142, 146, 18, -30, { c: '#e2662a' }), K.carrotChunk(p, 122, 96, 18, 60, { c: '#e2662a' }),
        K.pepperPiece(p, 72, 98, 20, 20, { c: '#3f8f2f' }), K.pepperPiece(p, 136, 58, 18, -30, { c: '#3f8f2f' }), K.pepperPiece(p, 58, 144, 16, 40, { c: '#d22a22' }),
        K.pepperPiece(p, 152, 128, 16, 0, { c: '#d22a22' }), K.pepperPiece(p, 104, 126, 15, -60, { c: '#3f8f2f' }),
        `</g>`,
        xphWash('#9a3a22', 72, .14),
        xphOlive(p, 86, 92, 11, 20), xphOlive(p, 116, 136, 11, -30), xphOlive(p, 62, 76, 10, 60), xphOlive(p, 144, 82, 10, 0), xphOlive(p, 118, 106, 10, 80),
        xphGloss(p, 2, 9, 62, .5),
    ].join(''),

    // Chicken afritada: chicken pieces in bright tomato sauce with potato, carrot, red and green pepper and green peas
    ph_afritada: p => [
        xphBowl(p, { line: '#d24a3a' }),
        K.liquid(p, { R: 72, c: '#c24e2c', op: 1, shine: false }),
        `<g ${p.sh(1)}>`,
        xphThigh(p, 78, 80, 46, -20, { c: '#b45a30', seed: 1 }),
        xphDrum(p, 122, 120, 60, 40, { c: '#b65c30' }),
        xphThigh(p, 126, 78, 40, 30, { c: '#ad542c', seed: 2 }),
        xphThigh(p, 76, 126, 40, 70, { c: '#b25a30', seed: 3 }),
        K.potato(p, 100, 100, 28, 10, { c: '#eebd6c' }), K.potato(p, 52, 102, 24, 40, { c: '#ecb868' }), K.potato(p, 100, 150, 24, -20, { c: '#eebd6c' }), K.potato(p, 150, 96, 22, 60, { c: '#ecb868' }),
        K.carrotChunk(p, 100, 62, 22, 20), K.carrotChunk(p, 62, 148, 20, -40), K.carrotChunk(p, 148, 148, 20, 30), K.potato(p, 56, 70, 22, 10, { c: '#ecb868' }), K.potato(p, 146, 64, 20, 50, { c: '#eebd6c' }), K.carrotChunk(p, 160, 120, 18, 0),
        K.pepperPiece(p, 98, 124, 18, 30, { c: '#d22a22', strip: true }), K.pepperPiece(p, 58, 72, 18, 70, { c: '#3f8f2f', strip: true }), K.pepperPiece(p, 142, 60, 18, -20, { c: '#d22a22', strip: true }),
        K.pepperPiece(p, 124, 100, 18, 100, { c: '#3f8f2f', strip: true }),
        `</g>`,
        xphWash('#c8502e', 70, .12),
        xphSpots('afrP', 14, 60, 9).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="3.3" fill="${p.rg('#6fb444', .35, .2)}" stroke="#3a7524" stroke-width=".5"/>`).join(''),
        xphGloss(p, 3, 7, 62),
    ].join(''),

    // Lechon kawali: chopped crisp pork belly on a wooden board, liver sauce and spiced vinegar with onion and chili
    ph_lechon_kawali: p => [
        xphBoard(p),
        xphLechon(p, 74, 60, 46, 30, -14, { seed: 1 }), xphLechon(p, 124, 58, 44, 30, 12, { seed: 2 }),
        xphLechon(p, 46, 102, 42, 30, 76, { seed: 3 }), xphLechon(p, 92, 96, 48, 32, -6, { seed: 4 }), xphLechon(p, 144, 98, 44, 30, 28, { seed: 5 }),
        xphLechon(p, 70, 138, 46, 30, 14, { seed: 6 }), xphLechon(p, 116, 132, 42, 30, -24, { seed: 7 }),
        xphSaucer(p, 152, 140, 20, '#8a5226', { line: '#2f6aa8' }),
        xphGrains(p, 152, 140, 18, { cols: ['#6a3a18'], n: 8, size: .9, seed: 3 }),
        xphSaucer(p, 116, 164, 15, '#efe2b4', { line: '#2f6aa8' }),
        `<g ${T(116, 164)}>`, [[-4, -2, 20], [3, 2, -30], [-1, 4, 80]].map(([a, b, r]) => `<g ${T(a, b, r)}><path d="M-3,1 Q0,-2.4 3,1 L2.4,2 Q0,-.6 -2.4,2Z" fill="#e8c6dc" stroke="#9a3a72" stroke-width=".6"/></g>`).join(''), `</g>`,
        xphLabuyo(p, 120, 160, 8, 30),
    ].join(''),

    // Kare-kare: oxtail and vegetables in thick orange peanut sauce in a clay pot, bagoong on the side
    ph_kare_kare: p => [
        xphClayPot(p),
        K.liquid(p, { R: 78, c: '#cf7c2c', op: 1, shine: false }),
        xphGrains(p, 100, 100, 146, { cols: ['#b8641e', '#e09a46', '#a85a1a'], n: 80, size: 1.6, seed: 1 }),
        `<g ${p.sh(1)}>`,
        xphShank(p, 76, 80, 40, 10, { c: '#86482a', seed: 1 }), xphShank(p, 122, 72, 36, -20, { c: '#8a4a2a', seed: 2 }), xphShank(p, 104, 112, 40, 40, { c: '#7e4226', seed: 3 }),
        xphEggplantRound(p, 60, 120, 24, 0), xphEggplantRound(p, 146, 104, 22, 0), xphEggplantRound(p, 82, 148, 20, 0),
        `</g>`,
        xphWash('#d08a36', 74, .22),
        `<g ${p.sh(.8)}>`,
        xphPechay(p, 132, 136, 62, -40, { cooked: false, c: '#3a8a2a' }), xphPechay(p, 60, 78, 58, 130, { cooked: false, c: '#3f8f2e' }), xphPechay(p, 150, 70, 46, -110, { cooked: false, c: '#438f30' }),
        [[100, 60, 8], [92, 70, -6], [140, 108, 70], [134, 116, 64], [58, 100, -60], [66, 104, -54], [116, 150, 10]].map(([x, y, a]) => K.greenBean(p, x, y, 26, a, { c: '#4a9a30' })).join(''),
        `</g>`,
        xphGrains(p, 100, 100, 120, { cols: ['#f2d49a', '#c98a46'], n: 18, size: 1.8, seed: 5 }),
        xphGloss(p, 4, 7, 62, .45),
        xphSaucer(p, 160, 160, 17, '#f0e8dc', { line: '#8a4a2a', op: 0 }), xphBagoong(p, 160, 160, 20),
    ].join(''),

    // Bicol express: pork strips in thick coconut cream, heaped with sliced long green chilies
    ph_bicol_express: p => [
        xphBowl(p, { line: '#d24a3a' }),
        K.liquid(p, { R: 72, c: '#dcbf8a', op: 1, shine: false }),
        `<g ${p.sh(.8)}>`,
        xphSpots('bic', 14, 54, 19).map(([x, y, a], i) => xphUse(p, 'pk' + (i % 3), () => K.porkSlice(p, 0, 0, 30, 0, { c: '#b88052', fat: '#f4e4c4', seed: i % 3, char: false, gloss: .4 }), x, y, a)).join(''),
        `</g>`,
        xphWash('#efdcb0', 70, .3),
        `<path d="M58,112 q14,-6 26,2 M118,62 q12,4 20,14 M110,138 q14,-2 24,-12" stroke="#e8a24a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/>`,
        `<g ${p.sh(.5)}>`,
        xphSpots('bicC', 30, 60, 11).map(([x, y, a], i) => xphUse(p, 'cr' + (i % 2), () => xphChiliRing(p, 0, 0, 9 + (i % 2) * 2, 0, { c: i % 2 ? '#4f9a30' : '#3f8a28' }), x, y, a)).join(''),
        xphLabuyo(p, 82, 92, 12, 30), xphLabuyo(p, 124, 116, 12, -40), xphLabuyo(p, 104, 70, 11, 10),
        `</g>`,
        xphGloss(p, 5, 7, 60, .6),
    ].join(''),

    // Pininyahang manok: chicken in creamy milk-pineapple sauce with pineapple chunks, carrot, potato and bell peppers
    ph_pininyahang_manok: p => [
        xphFloralPlate(p, { c: '#e8a03a', c2: '#3f8a4a' }),
        K.pool(p, 100, 101, 138, '#efd49c', { seed: 2, sy: .94 }),
        `<g ${p.sh(1)}>`,
        xphThigh(p, 78, 82, 46, -20, { c: '#d9a462', seed: 1 }),
        xphDrum(p, 122, 120, 60, 40, { c: '#d6a060' }),
        xphThigh(p, 126, 78, 40, 30, { c: '#d29a5a', seed: 2 }),
        xphThigh(p, 76, 126, 40, 70, { c: '#d8a262', seed: 3 }),
        K.potato(p, 52, 100, 22, 40, { c: '#f0d088' }), K.potato(p, 150, 96, 22, 60, { c: '#f0d088' }),
        K.carrotChunk(p, 100, 60, 20, 20), K.carrotChunk(p, 100, 150, 18, -40),
        xphPineapple(p, 100, 100, 24, 10), xphPineapple(p, 60, 72, 20, -30), xphPineapple(p, 146, 136, 20, 40), xphPineapple(p, 92, 140, 18, 80), xphPineapple(p, 150, 70, 18, -10), xphPineapple(p, 50, 130, 18, 20),
        K.pepperPiece(p, 116, 98, 18, 100, { c: '#d22a22', strip: true }), K.pepperPiece(p, 78, 104, 18, 30, { c: '#3f8f2f', strip: true }), K.pepperPiece(p, 124, 150, 16, 0, { c: '#d22a22', strip: true }),
        `</g>`,
        xphWash('#f4e2b4', 66, .2),
        xphGloss(p, 6, 7, 60),
    ].join(''),

    // Daing na bangus: butterflied milkfish fried golden, tomato and salted egg, garlic-vinegar dip
    ph_daing_bangus: p => [
        K.longPlate(p, { base: '#fbfaf5', rim: '#2f6aa8' }),
        xphDaing(p, 88, 100, 132, -6),
        xphTomSlice(p, 150, 66, 22, 10), xphTomSlice(p, 166, 82, 20, 40),
        xphSaucer(p, 158, 130, 18, '#ecdcae', { line: '#2f6aa8' }),
        xphFriedGarlic(p, 158, 130, 18, 10, 2), xphLabuyo(p, 160, 128, 9, -20),
    ].join(''),

    // Escabeche: whole fried fish under a glossy sweet-sour sauce with julienned peppers, carrot, onion and ginger
    ph_escabeche: p => [
        K.ovalDish(p, { rx: 96, ry: 78, rim: '#3f8a4a' }),
        K.pool(p, 100, 102, 168, '#e07a2a', { seed: 3, sy: .74 }),
        xphTilapia(p, 98, 100, 156, -8, { c: '#b06a2a' }),
        K.glaze(p, 96, 98, 110, '#e8822e', { op: .4, seed: 2 }),
        `<g ${p.sh(.5)}>`,
        xphShreds(p, 96, 96, 96, { c: '#d8302a', n: 12, w: 2.6, len: .4, seed: 1, sy: .6 }),
        xphShreds(p, 100, 100, 96, { c: '#3f8f2f', n: 10, w: 2.6, len: .4, seed: 2, sy: .6 }),
        xphShreds(p, 92, 100, 96, { c: '#f08a30', n: 14, w: 2, len: .36, seed: 3, sy: .6 }),
        xphShreds(p, 104, 96, 80, { c: '#f2df9c', n: 8, w: 1.4, len: .3, seed: 4, sy: .6 }),
        [[70, 92, 10], [118, 108, -30], [92, 116, 40]].map(([x, y, a]) => xphOnionRing(p, x, y, 16, a, { c: '#f1e2c8' })).join(''),
        `</g>`,
        xphGloss(p, 7, 8, 56, .6),
        K.scallions(p, 100, 98, 60, { n: 8 }),
    ].join(''),

    // Paksiw na isda: small whole fish simmered in vinegar and ginger in a clay pot with eggplant, bitter melon and long chili
    ph_paksiw_isda: p => [
        xphClayPot(p, { c: '#9c5430' }),
        K.liquid(p, { R: 78, c: '#cdb886', op: .95, shine: false }),
        `<g ${p.sh(.9)}>`,
        K.wholeFish(p, 96, 74, 104, -14, { skin: '#5e6e7e', belly: '#d9d2c2', char: .1 }),
        K.wholeFish(p, 104, 104, 108, -14, { skin: '#566676', belly: '#d6cfbe', char: .1 }),
        K.wholeFish(p, 100, 134, 100, -14, { skin: '#5e6e7e', belly: '#dad3c3', char: .1 }),
        `</g>`,
        xphWash('#d6c49a', 76, .26),
        `<g ${p.sh(.6)}>`,
        K.eggplant(p, 48, 104, 24, 70), K.eggplant(p, 150, 92, 24, 60), K.eggplant(p, 140, 146, 22, 20),
        xphAmpalaya(p, 60, 136, 20, 30), xphAmpalaya(p, 146, 120, 20, -40), xphAmpalaya(p, 70, 60, 18, 0),
        xphGreenChili(p, 120, 118, 50, -40), xphGreenChili(p, 82, 92, 44, 20),
        [[118, 60], [62, 84], [92, 150]].map(([x, y]) => `<g ${T(x, y)}><ellipse rx="5.6" ry="4.4" fill="${p.g('#f1dc9e', .3, .2)}" stroke="#c9a85a" stroke-width=".5"/><ellipse rx="3.2" ry="2.4" fill="none" stroke="#e4c47a" stroke-width=".5"/></g>`).join(''),
        `</g>`,
        xphPepper(p, 100, 100, 110, 10, 3),
        xphShine(100, 100, 74, .3),
    ].join(''),

    // Ginataang hipon: whole head-on shrimp in coconut milk with chili, pechay and long chili
    ph_ginataang_hipon: p => [
        xphGlazed(p, '#2f5f86', '#f3ecdc'),
        K.liquid(p, { R: 76, c: '#ecd29e', op: 1, shine: false }),
        `<path d="M50,110 q14,-8 30,0 M112,56 q14,4 22,16 M104,146 q16,0 28,-12 M60,70 q6,-8 16,-8" stroke="#e8973e" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
        `<g ${p.sh(.7)}>`,
        xphPechay(p, 60, 132, 50, 140), xphPechay(p, 146, 78, 46, -40),
        `</g>`,
        `<g ${p.sh(.9)}>`,
        [[100, 66, 10], [138, 100, 80], [124, 140, 140], [80, 146, 200], [56, 100, 260], [70, 66, 320], [102, 104, 30]].map(([x, y, a], i) => xphPrawn(p, x, y, i === 6 ? 48 : 50, a, { c: i % 2 ? '#e8603a' : '#ef7040' })).join(''),
        `</g>`,
        xphWash('#f0dcb0', 74, .14),
        `<g ${p.sh(.5)}>`, xphSpots('ghC', 9, 58, 16).map(([x, y, a]) => xphChiliRing(p, x, y, 10, a)).join(''), xphGreenChili(p, 118, 120, 40, 60), xphLabuyo(p, 84, 112, 12, -30), `</g>`,
        xphGloss(p, 8, 7, 62),
    ].join(''),

    // Adobong pusit: small squid braised in black ink-vinegar sauce with tomato and onion
    ph_adobong_pusit: p => [
        xphFloralPlate(p, { c: '#2f6aa8', c2: '#e8c34a' }),
        K.pool(p, 100, 101, 140, '#2a2426', { seed: 4, sy: .94 }),
        xphGrains(p, 100, 101, 124, { cols: ['#3a3236', '#1e1a1c'], n: 24, size: 2.2, seed: 4 }),
        `<g ${p.sh(.9)}>`,
        [[80, 70, -30], [128, 76, 20], [72, 112, 60], [120, 116, -10], [96, 140, 30], [100, 94, 80], [146, 104, 110]].map(([x, y, a], i) => xphSquid(p, x, y, 52, a, { c: i % 2 ? '#6a5662' : '#76626c' })).join(''),
        [[58, 90, 30], [140, 136, -20], [60, 132, 0], [116, 56, 60]].map(([x, y, a]) => K.squidRing(p, x, y, 15, a)).join(''),
        xphTomPiece(p, 82, 92, 18, 20, { seed: 1 }), xphTomPiece(p, 134, 56, 16, -30, { seed: 2 }), xphTomPiece(p, 74, 148, 16, 60, { seed: 3 }), xphTomPiece(p, 152, 124, 15, 0, { seed: 4 }),
        `</g>`,
        xphWash('#2e2a2a', 64, .25),
        [[110, 76, 0], [64, 106, 40], [120, 134, -30]].map(([x, y, a]) => K.onion(p, x, y, 16, a, { c: '#c9b8a0' })).join(''),
        xphGloss(p, 9, 9, 60, .6),
    ].join(''),

    // Tortang patatas: thick golden potato omelette with scallion, banana ketchup on the side
    ph_tortang_patatas: p => {
        const R = rng(p.id + 'tp');
        const pts = ring(64, 14, .08, R, 1, .96);
        const cl = p.uid();
        let spots = '';
        for (let i = 0; i < 16; i++) spots += `<ellipse cx="${f(100 + (R() - .5) * 104)}" cy="${f(98 + (R() - .5) * 100)}" rx="${f(5 + R() * 9)}" ry="${f(3 + R() * 6)}" fill="#b8661c" opacity="${f(.15 + R() * .22)}"/>`;
        const pot = xphSpots('tpp', 14, 50, 20).map(([x, y, a]) => `<g ${T(x, y, a)}><path d="${xphSm(ring(7, 7, .3, R, 1.2, .9), true)}" fill="${p.g('#f8e8b4', .4, .15)}" stroke="#c99a4a" stroke-width=".8"/></g>`).join('');
        return [
            xphFloralPlate(p, { c: '#3f8a4a', c2: '#e8c34a' }),
            `<defs><clipPath id="${cl}"><path ${T(100, 98)} d="${xphSm(pts, true)}"/></clipPath></defs>`,
            `<g ${p.sh(1.3)}><path ${T(100, 98)} d="${xphSm(pts, true)}" fill="${p.rg('#ecbc44', .3, .3, .4, .36)}" stroke="#b77a1c" stroke-width=".9"/></g>`,
            `<g clip-path="url(#${cl})">${spots}${pot}</g>`,
            K.scallions(p, 100, 98, 100, { n: 16 }),
            xphArc('M52,78 Q66,48 102,40', 3.4, .5), xphArc('M66,84 Q76,64 96,58', 1.8, .35),
            xphSaucer(p, 156, 156, 18, '#d5362a', { op: 1, line: '#3f8a4a' }),
        ].join('');
    },

    // Tokwa't baboy: fried tofu cubes and boiled pork belly in soy-vinegar with red onion, chili and scallion
    ph_tokwat_baboy: p => {
        const sp = xphSpots('tkw', 13, 54, 24);
        return [
            xphGlazed(p, '#7a5638', '#f3ead8'),
            K.liquid(p, { R: 72, c: '#6b4a2e', op: .95, shine: false }),
            `<g ${p.sh(.9)}>`,
            sp.slice(0, 8).map(([x, y, a], i) => xphUse(p, 'tf', () => K.atsuage(p, 0, 0, 24, 0), x, y, a)).join(''),
            sp.slice(8).map(([x, y, a], i) => xphPorkChunk(p, x, y, 28, a, { seed: i })).join(''),
            `</g>`,
            xphWash('#6b4a2e', 70, .12),
            `<g ${p.sh(.4)}>`,
            xphSpots('tkw2', 14, 56, 12).map(([x, y, a]) => `<g ${T(x, y, a)}><path d="M-5,1 Q0,-3.4 5,1 L4,2.4 Q0,-1.4 -4,2.4Z" fill="#efe0e6" stroke="#9a4a6e" stroke-width=".8" opacity=".85"/></g>`).join(''),
            xphSpots('tkw3', 8, 54, 14).map(([x, y, a]) => xphChiliRing(p, x, y, 7, a, { c: '#d02a1c' })).join(''),
            `</g>`,
            K.scallions(p, 100, 100, 100, { n: 14 }),
            xphGloss(p, 10, 6, 60),
        ].join('');
    },

    // Pinakbet: squash, eggplant, okra, bitter melon, long beans and tomato in bagoong sauce, topped with crisp pork
    ph_pinakbet: p => [
        xphGlazed(p, '#6a4a32', '#f1e6d2'),
        K.liquid(p, { R: 72, c: '#9a7040', op: 1, shine: false }),
        `<g ${p.sh(.8)}>`,
        xphCubes(p, 'sq', xphSpots('pkS', 8, 56, 25), 24, '#f0a030', { skin: '#5e7a2a' }),
        [[62, 84, 30], [132, 128, -20], [100, 60, 80], [86, 136, 10], [146, 90, 50]].map(([x, y, a]) => K.eggplant(p, x, y, 32, a)).join(''),
        [[110, 92, 20], [70, 120, -40], [144, 64, 60], [54, 104, 90]].map(([x, y, a]) => xphAmpalaya(p, x, y, 28, a)).join(''),
        [[126, 64, 30], [56, 106, 70], [146, 104, -10], [102, 150, 40], [80, 64, -60]].map(([x, y, a]) => `<g ${T(x, y, a)}><rect x="-14" y="-4.4" width="28" height="8.8" rx="4" fill="${p.g('#4e9a34', .3, .25)}" stroke="#2f6a22" stroke-width=".5"/><path d="M-10,0 L10,0" stroke="#7cc35a" stroke-width=".8"/></g>`).join(''),
        [[88, 100], [120, 112], [64, 140], [112, 136]].map(([x, y]) => K.okra(p, x, y, 16)).join(''),
        [[100, 120, 90], [138, 146, 40], [52, 70, 10]].map(([x, y, a]) => K.greenBean(p, x, y, 26, a)).join(''),
        xphTomPiece(p, 118, 76, 17, 0, { seed: 1 }), xphTomPiece(p, 76, 150, 15, 40, { seed: 2 }),
        xphLechon(p, 96, 92, 30, 20, -20, { seed: 1 }), xphLechon(p, 124, 104, 28, 19, 30, { seed: 2 }), xphLechon(p, 80, 120, 26, 18, 70, { seed: 3 }),
        `</g>`,
        xphWash('#a77a45', 70, .1),
        xphGloss(p, 11, 6, 60),
    ].join(''),

    // Laing: shredded taro leaves stewed down in thick coconut cream with chili and pork bits
    ph_laing: p => [
        xphGlazed(p, '#4f6e46', '#efe8d6'),
        K.liquid(p, { R: 74, c: '#4e5a32', op: 1, shine: false }),
        `<g ${p.sh(.5)}>`,
        xphShreds(p, 100, 100, 140, { c: '#55663a', n: 120, w: 3.4, len: .2, seed: 1, curve: .8 }),
        xphShreds(p, 100, 100, 130, { c: '#6f7a40', n: 60, w: 2.6, len: .16, seed: 2, curve: .8 }),
        `</g>`,
        xphSpots('lai', 10, 58, 16).map(([x, y, a]) => `<path ${T(x, y, a)} d="${xphSm(ring(7, 8, .5, rng('lai' + x), 1.4, .8), true)}" fill="#f1e8cc" opacity=".4"/>`).join(''),
        `<path d="M48,98 Q70,86 92,96 M110,132 Q130,124 148,128 M100,62 q14,4 24,0" stroke="#efe4c4" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
        `<g ${p.sh(.6)}>`,
        [[80, 80], [124, 70], [112, 116], [70, 126], [146, 108]].map(([x, y], i) => xphDice(p, x, y, 11, i * 30, '#b48058', { skin: '#efd9b6' })).join(''),
        [[92, 102, 30], [130, 92, -40], [74, 104, 80], [108, 138, 10], [62, 70, 50], [140, 136, -20]].map(([x, y, a]) => xphLabuyo(p, x, y, 18, a)).join(''),
        `</g>`,
        xphGloss(p, 12, 7, 60, .45),
    ].join(''),

    // Sinangag: garlic fried rice heaped on the plate with crisp garlic bits and a sunny-side-up egg
    ph_sinangag: p => [
        xphFloralPlate(p, { c: '#2f6aa8', c2: '#f2c14a' }),
        xphRice(p, 100, 100, 134, { tint: '#efdcaa', density: 1.05, grain: 3.6, hiK: .55 }),
        xphFriedGarlic(p, 96, 100, 120, 70, 1),
        K.scallions(p, 92, 104, 100, { n: 10 }),
        K.friedEgg(p, 126, 90, 70, -20),
        xphTomSlice(p, 64, 136, 24, 0), xphTomSlice(p, 84, 148, 22, 40),
    ].join(''),

    // Arroz caldo: ginger chicken rice porridge with fried garlic, scallions, egg, safflower and calamansi
    ph_arroz_caldo: p => [
        xphBowl(p, { line: '#e8a03a' }),
        K.liquid(p, { R: 74, c: '#ecd496', op: 1, shine: false }),
        xphGrains(p, 100, 100, 144, { cols: ['#f8efd2', '#efe0b0', '#fbf6e4'], n: 170, size: 2.6, seed: 1 }),
        `<g ${p.sh(.8)}>`,
        xphThigh(p, 72, 80, 42, -20, { c: '#e6c286', seed: 1 }), xphThigh(p, 130, 124, 40, 30, { c: '#e2bc80', seed: 2 }), xphThigh(p, 72, 128, 36, 60, { c: '#e6c286', seed: 3 }),
        K.eggHalf(p, 128, 76, 30, 20), K.eggHalf(p, 104, 106, 28, -20),
        `</g>`,
        xphFriedGarlic(p, 96, 96, 54, 50, 2),
        K.scallions(p, 100, 100, 110, { n: 26 }),
        xphShreds(p, 112, 92, 30, { c: '#e2481c', n: 8, w: .9, len: .6, seed: 3, outline: false }),
        xphCalamansi(p, 152, 148, 20), xphCalamansi(p, 136, 158, 18),
        xphShine(100, 100, 70, .3),
    ].join(''),

    // Pancit canton: stir-fried egg noodles with pork, shrimp, cabbage, carrot and snow peas on a banana leaf-lined bilao
    ph_pancit_canton: p => {
        const veg = xphSpots('pcc', 18, 54, 14);
        return [
            xphBilao(p),
            xphBanana(p, { r: -24, w: 150, R: 86 }),
            `<g ${p.sh(1)}><path ${T(100, 101)} d="${xphSm(ring(66, 14, .12, rng(p.id + 'pcb'), 1, .95), true)}" fill="#a8742c"/></g>`,
            xphNoodles(p, 100, 102, 140, { c: '#c99038', w: 3.4, n: 27, seed: 1, hi: .25 }),
            `<g ${p.sh(.7)}>`,
            veg.slice(0, 6).map(([x, y, a], i) => xphUse(p, 'lf' + (i % 2), () => K.leafPiece(p, 0, 0, 26, 0, { c: '#cfe08e', vein: '#f6f8e6', cooked: true, seed: i % 2 }), x, y, a)).join(''),
            `</g>`,
            xphNoodles(p, 100, 100, 120, { c: '#c48a32', w: 2.8, n: 12, seed: 2, hi: .3 }),
            `<g ${p.sh(.7)}>`,
            xphShreds(p, 100, 100, 110, { c: '#ef7f30', n: 18, w: 2.4, len: .22, seed: 3 }),
            veg.slice(6, 11).map(([x, y, a], i) => xphUse(p, 'pk' + (i % 2), () => K.porkSlice(p, 0, 0, 22, 0, { c: '#a8683a', seed: i % 2, char: false }), x, y, a)).join(''),
            veg.slice(11, 15).map(([x, y, a]) => K.shrimp(p, x, y, 20, a)).join(''),
            veg.slice(15).map(([x, y, a]) => K.snowPea(p, x, y, 20, a)).join(''),
            K.snowPea(p, 74, 96, 18, 40), K.snowPea(p, 128, 110, 18, -30),
            `</g>`,
            xphCalamansi(p, 150, 154, 20), xphCalamansi(p, 166, 136, 18), xphCalamansi(p, 40, 70, 18),
        ].join('');
    },

    // Filipino spaghetti: sweet red sauce with ground meat and hotdog slices, grated cheese on top
    ph_spaghetti: p => [
        K.plate(p, { rim: '#c8302a' }),
        xphNoodles(p, 100, 100, 138, { c: '#f1d088', w: 2.4, n: 50, seed: 1, hi: .3 }),
        K.pool(p, 100, 98, 104, '#cc3e26', { seed: 5, sy: .9 }),
        xphGrains(p, 100, 98, 96, { cols: ['#8a3a1e', '#a8482a', '#6e2a14'], n: 90, size: 2.2, seed: 2 }),
        `<g ${p.sh(.6)}>`,
        xphSpots('spg', 9, 44, 15).map(([x, y]) => `<g ${T(x, y)}><ellipse rx="7" ry="6.2" fill="${p.g('#de4a36', .3, .25)}" stroke="#9a2a1a" stroke-width=".6"/><ellipse rx="4.6" ry="4" fill="#ec8a72" opacity=".8"/><ellipse cx="-2" cy="-2" rx="2" ry="1" fill="#fff" opacity=".6"/></g>`).join(''),
        `</g>`,
        `<g ${p.sh(.4)}>`, xphShreds(p, 100, 96, 66, { c: '#f2b632', n: 30, w: 2.2, len: .28, seed: 4 }), `</g>`,
        xphGloss(p, 13, 5, 40),
    ].join(''),

    // Chopsuey: mixed vegetables in light glossy sauce with quail eggs and shrimp
    ph_chopsuey: p => {
        const sp = xphSpots('chs', 24, 58, 19);
        return [
            xphFloralPlate(p, { c: '#2f6aa8', c2: '#e88a3a' }),
            K.pool(p, 100, 101, 136, '#c8995a', { seed: 6, sy: .94, op: .8 }),
            `<g ${p.sh(.8)}>`,
            sp.slice(0, 5).map(([x, y, a], i) => xphUse(p, 'lf' + (i % 2), () => K.leafPiece(p, 0, 0, 32, 0, { c: '#cfe08e', vein: '#f6f8e6', cooked: true, seed: i % 2 }), x, y, a)).join(''),
            sp.slice(5, 8).map(([x, y, a]) => xphUse(p, 'br', () => K.broccoli(p, 0, 0, 28, 0), x, y, a)).join(''),
            sp.slice(8, 11).map(([x, y, a]) => xphUse(p, 'cf', () => K.broccoli(p, 0, 0, 28, 0, { c: '#eee4c6' }), x, y, a)).join(''),
            sp.slice(11, 15).map(([x, y, a]) => xphUse(p, 'cfl', () => xphCarrotFlower(p, 0, 0, 18, 0), x, y, a)).join(''),
            sp.slice(15, 18).map(([x, y, a]) => K.snowPea(p, x, y, 26, a)).join(''),
            sp.slice(18, 20).map(([x, y, a]) => K.pepperPiece(p, x, y, 22, a, { c: '#d8302a' })).join(''),
            sp.slice(20, 22).map(([x, y, a]) => xphCob(p, x, y, 24, 8, a)).join(''),
            sp.slice(22).map(([x, y, a]) => K.shrimp(p, x, y, 24, a)).join(''),
            K.quailEgg(p, 96, 100, 15, 20), K.quailEgg(p, 124, 132, 14, -30), K.quailEgg(p, 70, 84, 14, 60),
            `</g>`,
            K.glaze(p, 100, 100, 120, '#d8a860', { op: .22, seed: 3 }),
            xphGloss(p, 14, 7, 58),
        ].join('');
    },

    // Adobong sitaw: long beans braised in soy-vinegar with pork bits and garlic
    ph_adobong_sitaw: p => {
        const sp = xphSpots('ads', 44, 60, 9);
        return [
            K.kobachi(p, { glaze: '#c9a46a', inside: '#f3ecdc' }),
            K.liquid(p, { R: 70, c: '#5a3e24', op: .95, shine: false }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, a], i) => xphUse(p, 'sb' + (i % 2), () => `<rect x="-17" y="-4" width="34" height="8" rx="3.8" fill="${p.g(i % 2 ? '#4a7a2a' : '#557f2e', .3, .3)}" stroke="#2a4a16" stroke-width=".6"/><path d="M-12,-1.2 L12,-1.2" stroke="#9cc46a" stroke-width="1" stroke-linecap="round" opacity=".7"/><path d="M-6,1.6 L-6,1.6 M0,1.6 L0,1.6 M6,1.6 L6,1.6" stroke="#3a5a1a" stroke-width="2" stroke-linecap="round" opacity=".5"/>`, x, y, a)).join(''),
            [[86, 92, 20], [118, 112, -30], [100, 136, 60], [70, 120, 10], [126, 74, 40]].map(([x, y, a], i) => xphDice(p, x, y, 12, a, '#9a5a32', { skin: '#e8cba0' })).join(''),
            `</g>`,
            xphWash('#5a3e24', 66, .14),
            xphFriedGarlic(p, 100, 100, 100, 26, 3),
            xphGloss(p, 15, 7, 58, .6),
        ].join('');
    },

    // Ginisang sayote: chayote strips sauteed with tomato, onion and garlic in a little broth
    ph_ginisang_sayote: p => {
        const sp = xphSpots('gsy', 40, 60, 11.5);
        return [
            K.kobachi(p, { glaze: '#8fb0c8', inside: '#f1f4f2' }),
            K.liquid(p, { R: 70, c: '#d8c69a', op: .9, shine: false }),
            `<g ${p.sh(.6)}>`,
            sp.slice(0, 33).map(([x, y, a], i) => xphUse(p, 'sy' + (i % 2), () => `<rect x="-15" y="-4.4" width="30" height="8.8" rx="2.4" fill="${p.g(i % 2 ? '#d6e8a8' : '#cde29c', .35, .2)}" stroke="#8fae5a" stroke-width=".6"/><path d="M-13,2.6 L13,2.6" stroke="#7fae4a" stroke-width="1.6" opacity=".7"/><path d="M-10,-1.4 L10,-1.4" stroke="#fff" stroke-width=".9" opacity=".6"/>`, x, y, a)).join(''),
            sp.slice(33).map(([x, y, a], i) => xphUse(p, 'tp' + (i % 2), () => xphTomPiece(p, 0, 0, 19, 0, { seed: i % 2 }), x, y, a)).join(''),
            `</g>`,
            [[84, 84, 20], [124, 120, -40], [70, 124, 70]].map(([x, y, a]) => K.onion(p, x, y, 16, a)).join(''),
            xphFriedGarlic(p, 100, 100, 90, 14, 4),
            xphShine(100, 100, 66, .3),
        ].join('');
    },

    // Ginisang upo: soft pale bottle gourd slices with tomato, onion and small shrimp in a light broth
    ph_ginisang_upo: p => {
        const sp = xphSpots('gup', 34, 60, 13.5);
        return [
            xphBowl(p, { line: '#3f8a4a' }),
            K.liquid(p, { R: 72, c: '#e2d6b0', op: .95, shine: false }),
            `<g ${p.sh(.6)}>`,
            sp.slice(0, 27).map(([x, y, a], i) => xphUse(p, 'up' + (i % 2), () => `<path d="M-14,4 A14,12 0 0 1 14,4 Z" fill="${p.g('#eef0d0', .3, .15)}" stroke="#b8c48a" stroke-width=".6" opacity=".95"/><path d="M-14,4 A14,12 0 0 1 14,4" fill="none" stroke="#a8c070" stroke-width="1.6"/><path d="M-5,2 Q0,-3 5,2" stroke="#fbfdf0" stroke-width="1.6" fill="none"/>`, x, y, a)).join(''),
            sp.slice(27, 30).map(([x, y, a], i) => xphTomPiece(p, x, y, 18, a, { seed: i })).join(''),
            sp.slice(30).map(([x, y, a]) => K.shrimp(p, x, y, 20, a)).join(''),
            K.shrimp(p, 100, 100, 18, 40),
            `</g>`,
            [[82, 86, 20], [120, 120, -40]].map(([x, y, a]) => K.onion(p, x, y, 16, a)).join(''),
            xphShine(100, 100, 68, .3),
        ].join('');
    },

    // Ginisang togue: bean sprouts stir-fried with carrot strips and fried tofu
    ph_ginisang_togue: p => [
        xphFloralPlate(p, { c: '#3f8a4a', c2: '#e8c34a' }),
        `<g ${p.sh(.5)}><path ${T(100, 100)} d="${xphSm(ring(64, 12, .14, rng(p.id + 'tg'), 1, .95), true)}" fill="#d9cc98"/></g>`,
        xphSprouts(p, 100, 100, 128, { n: 110, seed: 1 }),
        xphShreds(p, 100, 100, 110, { c: '#ef7f30', n: 18, w: 2.2, len: .26, seed: 2 }),
        `<g ${p.sh(.7)}>`, [[78, 80, 10], [126, 90, -20], [96, 128, 30], [136, 126, 60], [64, 118, -10]].map(([x, y, a]) => K.atsuage(p, x, y, 15, a)).join(''), `</g>`,
        xphSprouts(p, 100, 100, 112, { n: 40, seed: 2 }),
        K.scallions(p, 100, 100, 100, { n: 14 }),
    ].join(''),

    // Ginisang repolyo: sauteed cabbage with carrot strips and onion
    ph_ginisang_repolyo: p => {
        const sp = xphSpots('grp', 18, 56, 16);
        return [
            xphFloralPlate(p, { c: '#d24a3a', c2: '#f2c14a' }),
            K.pool(p, 100, 101, 130, '#e2d6a8', { seed: 7, op: .7 }),
            `<g ${p.sh(.6)}>`,
            sp.map(([x, y, a], i) => xphUse(p, 'cb' + (i % 3), () => K.leafPiece(p, 0, 0, 34, 0, { c: ['#d6e6a2', '#c8de90', '#e6efc4'][i % 3], vein: '#f8faea', cooked: true, seed: i % 3 }), x, y, a)).join(''),
            xphShreds(p, 100, 100, 112, { c: '#ef7f30', n: 20, w: 2.2, len: .28, seed: 1 }),
            `</g>`,
            [[84, 86, 20], [120, 118, -40], [72, 124, 70], [128, 80, 10]].map(([x, y, a]) => K.onion(p, x, y, 16, a)).join(''),
            xphPepper(p, 100, 100, 100, 10, 2),
        ].join('');
    },

    // Ensaladang talong: grilled, peeled eggplant flesh with tomato and red onion, bagoong on top
    ph_ensaladang_talong: p => {
        const pts = xphSpots('etl', 9, 50, 24);
        return [
            xphFloralPlate(p, { c: '#7a3f8a', c2: '#f2c14a' }),
            `<g ${p.sh(.8)}>`,
            pts.map(([x, y, a], i) => `<g ${T(x, y, a)}><path d="${xphSm(ring(14, 9, .3, rng(p.id + 'e' + i), 1.4, .8), true)}" fill="${p.g(i % 2 ? '#a88a58' : '#9a7a4a', .3, .35)}" stroke="#5a4426" stroke-width=".6"/><path d="M-12,0 Q0,-3 12,0 M-8,4 Q0,2 8,4" stroke="#6a5030" stroke-width="1" fill="none" opacity=".6"/><path d="M-14,-2 Q-12,-6 -6,-7" stroke="#3a2a3a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`).join(''),
            `</g>`,
            `<g ${p.sh(.6)}>`,
            xphSpots('etl2', 16, 58, 13).map(([x, y, a], i) => xphUse(p, 'tp' + (i % 3), () => xphTomPiece(p, 0, 0, 18, 0, { seed: i % 3 }), x, y, a)).join(''),
            `</g>`,
            xphSpots('etl3', 14, 56, 12).map(([x, y, a]) => `<g ${T(x, y, a)}><path d="M-5,1 Q0,-3.4 5,1 L4,2.4 Q0,-1.4 -4,2.4Z" fill="#efe0ea" stroke="#9a3a72" stroke-width=".8"/></g>`).join(''),
            xphBagoong(p, 104, 98, 20),
        ].join('');
    },

    // Ensaladang mangga: julienned green mango with tomato and red onion, topped with bagoong
    ph_ensaladang_mangga: p => [
        K.kobachi(p, { glaze: '#d9c48a', inside: '#f6f2e6' }),
        `<g ${p.sh(.6)}>`,
        xphSpots('emg', 56, 62, 7.5).map(([x, y, a], i) => xphUse(p, 'mg' + (i % 2), () => xphMango(p, 0, 0, 30, 6.4, 0, { c: i % 2 ? '#ece48a' : '#e0dc7a' }), x, y, a)).join(''),
        xphSpots('emg2', 10, 56, 16).map(([x, y, a], i) => xphUse(p, 'tp' + (i % 2), () => xphTomPiece(p, 0, 0, 16, 0, { seed: i % 2 }), x, y, a)).join(''),
        `</g>`,
        xphSpots('emg3', 10, 54, 14).map(([x, y, a]) => `<g ${T(x, y, a)}><path d="M-5,1 Q0,-3.4 5,1 L4,2.4 Q0,-1.4 -4,2.4Z" fill="#efe0ea" stroke="#9a3a72" stroke-width=".8"/></g>`).join(''),
        xphBagoong(p, 100, 98, 34),
    ].join(''),

    // Ensaladang pipino: thin cucumber slices with red onion in sweet vinegar
    ph_ensaladang_pipino: p => [
        K.kobachi(p, { glaze: '#3f6a9a', inside: '#f3f4f2' }),
        K.liquid(p, { R: 70, c: '#ece6c8', op: .7, shine: false }),
        `<g ${p.sh(.5)}>`,
        xphSpots('epp', 28, 58, 15).map(([x, y, a]) => xphUse(p, 'cu', () => K.cucumberSlice(p, 0, 0, 20, 0, { oval: 1.15 }), x, y, a)).join(''),
        xphSpots('epp2', 14, 54, 14).map(([x, y, a]) => xphUse(p, 'cu2', () => K.cucumberSlice(p, 0, 0, 18, 0, { oval: 1.2 }), x, y, a)).join(''),
        `</g>`,
        xphSpots('epp3', 12, 56, 14).map(([x, y, a]) => xphOnionRing(p, x, y, 13, a, { c: '#e8c8de' })).join(''),
        xphPepper(p, 100, 100, 100, 8, 3),
        xphShine(100, 100, 66, .4),
    ].join(''),

    // Ensaladang talbos ng kamote: blanched sweet potato tops with tomato, red onion and salted egg
    ph_talbos_kamote: p => [
        K.kobachi(p, { glaze: '#7a9a5a', inside: '#f2f2e8' }),
        `<g ${p.sh(.6)}>`,
        xphSpots('tbk', 26, 58, 14).map(([x, y, a], i) => xphUse(p, 'kl' + (i % 2), () => `<path transform="scale(1.25)" d="M-12,0 Q-10,-8 0,-9 Q6,-9 8,-5 L12,-6 L9,0 L12,6 L8,5 Q6,9 0,9 Q-10,8 -12,0Z" fill="${p.g(i % 2 ? '#3f7a2a' : '#4a8a30', .3, .3)}" stroke="#244a16" stroke-width=".6"/><path d="M-12,0 L11,0" stroke="#8ab85a" stroke-width=".9"/>`, x, y, a)).join(''),
        xphSpots('tbk2', 8, 54, 16).map(([x, y, a]) => `<g ${T(x, y, a)}><rect x="-10" y="-1.4" width="20" height="2.8" rx="1.4" fill="#7aa848" stroke="#4a7a2a" stroke-width=".4"/></g>`).join(''),
        xphSpots('tbk3', 9, 54, 16).map(([x, y, a], i) => xphUse(p, 'tp' + (i % 2), () => xphTomPiece(p, 0, 0, 16, 0, { seed: i % 2 }), x, y, a)).join(''),
        `</g>`,
        xphSpots('tbk4', 8, 50, 14).map(([x, y, a]) => `<g ${T(x, y, a)}><path d="M-5,1 Q0,-3.4 5,1 L4,2.4 Q0,-1.4 -4,2.4Z" fill="#efe0ea" stroke="#9a3a72" stroke-width=".8"/></g>`).join(''),
        `<g ${p.sh(.6)}>`, [[96, 96, 0], [118, 112, 40], [80, 118, -30]].map(([x, y, a]) => `<g ${T(x, y, a)}><path d="M-7,-5 L7,-6 L6,6 L-6,5Z" fill="${p.g('#f6f0e2', .3, .15)}" stroke="#d6cdb5" stroke-width=".5"/><circle r="3.6" fill="#e8742a"/></g>`).join(''), `</g>`,
    ].join(''),

    // Kinilaw: raw fish cubes cured in vinegar with red onion, ginger, cucumber and chili
    ph_kinilaw: p => [
        xphBowl(p, { line: '#2f6aa8' }),
        K.liquid(p, { R: 72, c: '#ece4c8', op: .85, shine: false }),
        `<g ${p.sh(.6)}>`,
        xphSpots('knl', 30, 58, 15).map(([x, y, a], i) => xphUse(p, 'fi' + (i % 2), () => `<rect x="-9.5" y="-8.5" width="19" height="17" rx="3.8" fill="${p.g(i % 2 ? '#f6f2ea' : '#efe8dc', .3, .18)}" stroke="#cfc2ac" stroke-width=".6"/><path d="M-6,-2 Q0,-4 6,-2 M-6,3 Q0,1 6,3" stroke="#e0d4c0" stroke-width=".8" fill="none"/><path d="M-5,-5 L4,-5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`, x, y, a)).join(''),
        xphSpots('knl2', 8, 56, 16).map(([x, y, a]) => xphUse(p, 'cu', () => K.cucumberSlice(p, 0, 0, 14, 0), x, y, a)).join(''),
        `</g>`,
        xphSpots('knl3', 16, 58, 12).map(([x, y, a]) => `<g ${T(x, y, a)}><path d="M-5,1 Q0,-3.4 5,1 L4,2.4 Q0,-1.4 -4,2.4Z" fill="#efe0ea" stroke="#9a3a72" stroke-width=".8"/></g>`).join(''),
        xphShreds(p, 100, 100, 100, { c: '#f2df9c', n: 14, w: 1.6, len: .2, seed: 2 }),
        xphSpots('knl4', 8, 54, 16).map(([x, y, a]) => xphChiliRing(p, x, y, 7, a, { c: '#d02a1c' })).join(''),
        xphLabuyo(p, 118, 88, 14, 30),
        xphCalamansi(p, 150, 150, 18),
        xphShine(100, 100, 68, .35),
    ].join(''),

    // Burong mangga: pale yellow-green pickled mango strips in clear brine
    ph_burong_mangga: p => [
        K.kobachi(p, { glaze: '#e6e0c8', inside: '#f7f5ec' }),
        K.liquid(p, { R: 70, c: '#ece6b8', op: .6, shine: false }),
        `<g ${p.sh(.6)}>`,
        xphSpots('bmg', 24, 56, 13).map(([x, y, a], i) => xphUse(p, 'bm' + (i % 3), () => `<path transform="scale(1.25 1.5)" d="M-16,-4 Q0,-7 16,-3 Q18,0 16,3 Q0,6 -16,4 Q-18,0 -16,-4Z" fill="${p.g(['#e9dc84', '#e2d878', '#efe39a'][i % 3], .4, .2)}" stroke="#b8aa48" stroke-width=".6" opacity=".95"/><path d="M-13,-2 Q0,-4.4 13,-1.6" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/><path d="M-14,2.4 Q0,4.6 14,2" stroke="#a8b84a" stroke-width="1" fill="none" opacity=".6"/>`, x, y, a)).join(''),
        `</g>`,
        K.liquid(p, { R: 70, c: '#f2ecc0', op: .22, shine: true }),
    ].join(''),

    // Ginataang langka: young jackfruit simmered in coconut milk with shrimp and chili
    ph_ginataang_langka: p => [
        xphGlazed(p, '#a8643a', '#f3ead8'),
        K.liquid(p, { R: 72, c: '#ecdcb2', op: 1, shine: false }),
        `<g ${p.sh(.7)}>`,
        xphSpots('lgk', 20, 56, 15).map(([x, y, a], i) => xphUse(p, 'lg' + (i % 2), () => xphLangka(p, 0, 0, 24 + (i % 2) * 3, 0), x, y, a)).join(''),
        [[96, 92, 30], [126, 128, -40], [70, 124, 80], [130, 76, 10]].map(([x, y, a]) => K.shrimp(p, x, y, 22, a)).join(''),
        `</g>`,
        xphWash('#f0e4c4', 70, .3),
        `<path d="M54,104 q14,-6 26,0 M112,58 q12,4 20,14 M108,148 q14,0 24,-10" stroke="#e8a24a" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".45"/>`,
        `<g ${p.sh(.5)}>`, xphSpots('lgk2', 8, 56, 16).map(([x, y, a]) => xphChiliRing(p, x, y, 9, a)).join(''), xphGreenChili(p, 110, 110, 40, -30), `</g>`,
        xphGloss(p, 16, 6, 60),
    ].join(''),

    // Adobong talong: eggplant slices braised in dark soy-vinegar with lots of garlic
    ph_adobong_talong: p => [
        K.kobachi(p, { glaze: '#c8b89a', inside: '#f4efe4' }),
        K.liquid(p, { R: 70, c: '#4a3220', op: .95, shine: false }),
        `<g ${p.sh(.8)}>`,
        xphSpots('adt', 13, 52, 25).map(([x, y, a], i) => xphUse(p, 'eg' + (i % 2), () => `<path transform="scale(1.5 1.3)" d="M-16,0 Q-14,-8 0,-8.6 Q14,-8 16,0 Q14,8 0,8.6 Q-14,8 -16,0Z" fill="${p.g('#3e2234', .3, .2)}" stroke="#1e0e1a" stroke-width=".6"/><path transform="scale(1.5 1.3)" d="M-14.4,-.3 Q-12.6,-7 0,-7.4 Q12.6,-7 14.4,-.3 Q12.6,6.6 0,7 Q-12.6,6.6 -14.4,-.3Z" fill="${p.g(i % 2 ? '#8a5e30' : '#7e542a', .35, .3)}"/>${[-6, -2, 2, 6].map(u => `<circle cx="${u}" cy="${u % 4 ? 1 : -1}" r=".9" fill="#6a4420"/>`).join('')}<path d="M-9,-3.6 Q0,-5.6 9,-3.6" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/>`, x, y, a)).join(''),
        `</g>`,
        xphWash('#4a3220', 66, .14),
        [[84, 80, 20], [118, 116, -30], [70, 120, 60], [128, 84, 0], [100, 140, 40], [104, 100, -60]].map(([x, y, a]) => xphGarlic(p, x, y, 11, a, { c: '#d9a860' })).join(''),
        xphGloss(p, 17, 8, 58, .6),
    ].join(''),

    // Lumpiang gulay: thick fried vegetable spring rolls (sweet potato, sprouts, beans) with spiced vinegar
    ph_lumpiang_gulay: p => {
        const roll = (x, y, a, cut) => `<g ${T(x, y, a)}><g ${p.sh(.9)}><g ${p.crumb(.8)}><rect x="-26" y="-10" width="52" height="20" rx="9.4" fill="${p.g('#cc8a30', .35, .35)}" stroke="#8a5018" stroke-width=".7"/></g></g>
            <path d="M-14,-10 Q-12,0 -15,10 M6,-10 Q8,0 5,10" stroke="#a86a28" stroke-width=".8" fill="none" opacity=".5"/>
            ${cut ? `<ellipse cx="25" cy="0" rx="5" ry="9.6" fill="#f0d8a0" stroke="#9a6020" stroke-width=".6"/><ellipse cx="25.4" cy="0" rx="3.6" ry="8" fill="#e8a040"/><path d="M24,-5 L27,-3 M23,1 L27,2 M24,5 L27,6" stroke="#5a9a34" stroke-width="1.4" stroke-linecap="round"/><path d="M23,-2 L27,-1" stroke="#f6f0d8" stroke-width="1.2" stroke-linecap="round"/>` : ''}
            ${xphArc('M-22,-5 L18,-5', 1.8, .6)}</g>`;
        return [
            xphFloralPlate(p, { c: '#3f8a4a', c2: '#e8c34a' }),
            K.leafPiece(p, 64, 66, 54, -30, { c: '#8cc45a', vein: '#d8eeb0' }), K.leafPiece(p, 140, 136, 48, 30, { c: '#7ab84a', vein: '#d8eeb0' }),
            roll(78, 80, -30, true), roll(120, 70, -30, false), roll(64, 116, -30, false), roll(106, 108, -30, true), roll(94, 144, -30, false), roll(146, 100, -30, true),
            xphSaucer(p, 150, 150, 18, '#ece0b4', { line: '#3f8a4a' }),
            xphFriedGarlic(p, 150, 150, 18, 8, 3), xphLabuyo(p, 152, 148, 9, -20),
        ].join('');
    },

    // Okoy: lacy crisp shrimp and sweet potato fritters with spiced vinegar
    ph_okoy: p => [
        xphFloralPlate(p, { c: '#d24a3a', c2: '#f2c14a' }),
        xphOkoy(p, 74, 78, 64, 0, { seed: 1 }), xphOkoy(p, 128, 86, 60, 40, { seed: 2 }), xphOkoy(p, 92, 128, 64, -20, { seed: 3 }),
        xphSaucer(p, 150, 142, 19, '#ece0b4', { line: '#d24a3a' }),
        xphFriedGarlic(p, 150, 142, 18, 8, 4), xphLabuyo(p, 152, 140, 9, -20),
        K.scallions(p, 98, 100, 90, { n: 14 }),
    ].join(''),

    // Macaroni salad: creamy elbow macaroni with carrot, cheese cubes, raisins, pineapple and chicken
    ph_macaroni_salad: p => [
        xphBowl(p, { line: '#e8a03a' }),
        `<g ${p.sh(.6)}><path ${T(100, 100)} d="${xphSm(ring(68, 14, .08, rng(p.id + 'mc'), 1, .97), true)}" fill="${p.rg('#f6eedc', .2, .12)}"/></g>`,
        `<g ${p.sh(.4)}>`,
        xphSpots('mac', 54, 62, 9).map(([x, y, a]) => xphUse(p, 'mc', () => K.macaroni(p, 0, 0, 16, 0, { c: '#f2dc9a' }), x, y, a)).join(''),
        xphCubes(p, 'ch', xphSpots('mac2', 9, 54, 16), 9, '#f2c040'),
        xphCubes(p, 'ca', xphSpots('mac3', 9, 54, 16), 7, '#ec7b2d'),
        xphSpots('mac4', 6, 50, 18).map(([x, y, a]) => xphPineapple(p, x, y, 10, a)).join(''),
        `</g>`,
        xphSpots('mac5', 10, 56, 14).map(([x, y, a]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.8" transform="rotate(${a} ${f(x)} ${f(y)})" fill="#4a2420" stroke="#2a1008" stroke-width=".4"/>`).join(''),
        xphShreds(p, 100, 100, 100, { c: '#f2e6cc', n: 12, w: 2.6, len: .2, seed: 5 }),
        K.parsley(p, 100, 96, 12),
        xphGloss(p, 18, 6, 56, .7),
    ].join(''),

    // Nilagang okra: boiled whole okra pods with tomato, bagoong and calamansi
    ph_nilagang_okra: p => [
        xphFloralPlate(p, { c: '#3f8a4a', c2: '#e8c34a' }),
        `<g ${p.sh(.8)}>`,
        [[70, 70, 30], [100, 62, 20], [130, 70, 25], [58, 102, 35], [90, 96, 30], [122, 100, 28], [72, 132, 32], [104, 128, 24], [138, 126, 30], [150, 92, 15]].map(([x, y, a], i) => xphUse(p, 'ok' + (i % 2), () => xphOkraPod(p, 0, 0, 46, 0, { c: i % 2 ? '#78b44a' : '#6aa840' }), x, y, a)).join(''),
        `</g>`,
        xphTomSlice(p, 60, 150, 20, 0), xphTomSlice(p, 80, 158, 18, 40),
        xphSaucer(p, 150, 150, 18, '#f0e8dc', { line: '#3f8a4a', op: 0 }), xphBagoong(p, 150, 150, 22),
        xphCalamansi(p, 126, 160, 15), xphCalamansi(p, 46, 128, 15),
    ].join(''),

    // Ginisang pechay: pechay sauteed with garlic in a glossy light brown sauce
    ph_ginisang_pechay: p => [
        xphFloralPlate(p, { c: '#2f6aa8', c2: '#f2c14a' }),
        K.pool(p, 100, 101, 132, '#8a6a3a', { seed: 8, op: .85 }),
        `<g ${p.sh(.8)}>`,
        [[76, 74, 30], [126, 70, 150], [60, 110, -20], [140, 112, 200], [92, 136, 60], [128, 140, 120], [100, 92, 100], [80, 108, 10], [112, 116, 170]].map(([x, y, a], i) => xphPechay(p, x, y, 56, a, { c: i % 2 ? '#3f8a2e' : '#4a9234', cooked: true })).join(''),
        `</g>`,
        xphWash('#9a7a44', 66, .12),
        xphFriedGarlic(p, 100, 100, 100, 30, 5),
        xphGloss(p, 19, 7, 56, .55),
    ].join(''),

    // Buttered vegetables: corn kernels, carrot cubes and green beans glossy with butter
    ph_buttered_veg: p => [
        K.kobachi(p, { glaze: '#e2b84a', inside: '#f6f2e6' }),
        `<g ${p.sh(.5)}><path ${T(100, 100)} d="${xphSm(ring(66, 12, .1, rng(p.id + 'bv'), 1, .96), true)}" fill="${p.rg('#f2d27a', .2, .15)}"/></g>`,
        xphSpots('bvk', 110, 64, 5.4).map(([x, y, a]) => xphUse(p, 'kn', () => `<rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.6" fill="${p.g('#f6cf3a', .35, .2)}" stroke="#c99a12" stroke-width=".4"/>`, x, y, a)).join(''),
        `<g ${p.sh(.6)}>`,
        xphCubes(p, 'ca', xphSpots('bvc', 16, 58, 15), 11, '#ec7b2d'),
        xphSpots('bvg', 14, 58, 16).map(([x, y, a]) => xphUse(p, 'gb', () => K.greenBean(p, 0, 0, 16, 0, { c: '#4f9a34' }), x, y, a)).join(''),
        `</g>`,
        K.parsley(p, 100, 98, 12),
        xphSpots('bvs', 12, 56, 14).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="#fff" opacity=".7"/>`).join(''),
        xphShine(100, 100, 64, .45),
    ].join(''),

    // Sinigang na hipon: sour tamarind broth with head-on shrimp, radish, okra, tomato, kangkong and long chili
    ph_sinigang_hipon: p => [
        xphBowl(p, { line: '#2f6aa8', R: 93 }),
        xphBroth(p, '#d6bd88', { R: 74 }),
        `<g ${p.sh(.7)}>`,
        xphRadish(p, 100, 62, 22), xphRadish(p, 54, 112, 20), xphRadish(p, 146, 100, 20),
        K.okra(p, 118, 98, 14), K.okra(p, 76, 92, 13), K.okra(p, 128, 140, 13),
        xphTomPiece(p, 64, 72, 18, 30, { seed: 1 }), xphTomPiece(p, 140, 128, 17, -40, { seed: 2 }),
        xphKangkongLeaf(p, 88, 132, 40, -20), xphKangkongLeaf(p, 128, 66, 36, 30), xphKangkongLeaf(p, 54, 138, 30, 70), xphKangkongStem(p, 152, 74, 22, 60),
        [[80, 72, 20], [124, 112, 160], [92, 108, 60], [62, 116, 250], [112, 146, 300]].map(([x, y, a], i) => xphPrawn(p, x, y, 46, a, { c: i % 2 ? '#e8603a' : '#ef7040' })).join(''),
        xphGreenChili(p, 104, 86, 46, -30),
        `</g>`,
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Sinigang na bangus: sour broth with milkfish steaks and belly, radish, tomato, kangkong, okra and long chili
    ph_sinigang_bangus: p => [
        xphBowl(p, { line: '#3f8a4a', R: 93 }),
        xphBroth(p, '#d9c290', { R: 74 }),
        xphZoom(1.1, `<g ${p.sh(.8)}>`,
        xphRadish(p, 60, 84, 20), xphRadish(p, 140, 136, 20), xphRadish(p, 104, 62, 18),
        xphTomPiece(p, 140, 76, 18, 30, { seed: 1 }), xphTomPiece(p, 64, 132, 17, -40, { seed: 2 }),
        xphFishSteak(p, 80, 104, 52, -15, { skin: '#5e6a7a' }), xphFishSteak(p, 126, 104, 50, 20, { belly: true, skin: '#5e6a7a' }), xphFishSteak(p, 100, 140, 46, 5, { skin: '#5e6a7a' }),
        xphKangkongLeaf(p, 100, 78, 40, 10), xphKangkongLeaf(p, 54, 108, 32, 80), xphKangkongLeaf(p, 148, 104, 32, -80), xphKangkongStem(p, 76, 62, 22, 30),
        K.okra(p, 128, 64, 13), K.okra(p, 76, 150, 13),
        xphGreenChili(p, 112, 124, 44, -50),
        `</g>`, xphKangkongLeaf(p, 128, 150, 30, 30), xphRadish(p, 80, 60, 16)),
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Sinigang na baka: sour broth in a clay pot with beef chunks, taro, radish, long beans, kangkong and tomato
    ph_sinigang_baka: p => [
        xphClayPot(p, { c: '#a0562f' }),
        xphBroth(p, '#c9a66c', { R: 77 }),
        xphZoom(1.14, `<g ${p.sh(.8)}>`,
        xphBeefChunk(p, 78, 78, 30, -10, { c: '#7a4a2c', seed: 1, fat: '#efd9b0' }), xphBeefChunk(p, 124, 116, 30, 40, { c: '#74442a', seed: 2, fat: '#efd9b0' }),
        xphBeefChunk(p, 80, 124, 28, 70, { c: '#7a4a2c', seed: 3 }), xphBeefChunk(p, 126, 74, 26, 20, { c: '#704228', seed: 4, fat: '#efd9b0' }),
        K.satoimo(p, 102, 100, 22, 20, { c: '#ddd2c4' }), K.satoimo(p, 54, 100, 20, -20, { c: '#d9cec0' }),
        xphRadish(p, 104, 62, 20), xphRadish(p, 150, 96, 18),
        xphTomPiece(p, 104, 144, 17, 20, { seed: 1 }),
        K.greenBean(p, 60, 140, 26, 30), K.greenBean(p, 144, 140, 24, -30), K.greenBean(p, 66, 64, 24, -50),
        xphKangkongLeaf(p, 96, 122, 38, -20), xphKangkongLeaf(p, 140, 120, 32, 60), xphKangkongLeaf(p, 102, 82, 32, 160),
        xphGreenChili(p, 58, 112, 40, 60),
        `</g>`),
        xphShine(100, 100, 74, .3),
    ].join(''),

    // Sinigang sa miso: cloudy miso-tamarind broth with salmon belly, mustard greens, radish, tomato and long chili
    ph_sinigang_miso: p => [
        xphGlazed(p, '#6a4a32', '#f1e8d8', 93),
        xphBroth(p, '#bf9a62', { R: 76, oil: 10, oilC: '#e8a040', seed: 2 }),
        `<path d="M50,96 Q66,76 92,84 T130,70 M62,132 Q84,120 108,130 T150,120" stroke="#d9be8a" stroke-width="6" fill="none" stroke-linecap="round" opacity=".45"/>`,
        xphZoom(1.12, `<g ${p.sh(.8)}>`,
        xphMustasa(p, 74, 78, 62, -30, { seed: 1 }), xphMustasa(p, 132, 126, 58, 40, { seed: 2 }), xphMustasa(p, 132, 70, 48, -60, { seed: 3, c: '#4f9636' }),
        xphRadish(p, 60, 120, 20), xphRadish(p, 104, 150, 18),
        xphTomPiece(p, 150, 98, 17, 30, { seed: 1 }), xphTomPiece(p, 80, 146, 16, -40, { seed: 2 }),
        K.salmon(p, 98, 104, 44, -20), K.salmon(p, 104, 70, 36, 15),
        xphGreenChili(p, 72, 108, 42, 70),
        `</g>`, xphMustasa(p, 70, 128, 40, 60, { seed: 4 })),
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Nilagang baka: clear beef broth with shank pieces, corn on the cob, potato, cabbage wedge, pechay and peppercorns
    ph_nilagang_baka: p => [
        xphBowl(p, { line: '#2f6aa8', R: 93 }),
        xphBroth(p, '#d9b97e', { R: 74, oil: 8, oilC: '#f0c060', seed: 3 }),
        xphZoom(1.1, `<g ${p.sh(.8)}>`,
        xphCabWedge(p, 70, 80, 50, -20),
        xphCob(p, 132, 70, 34, 22, 30), xphCob(p, 60, 128, 32, 21, -40),
        xphShank(p, 106, 104, 40, 10, { c: '#86502e', seed: 1 }), xphBeefChunk(p, 138, 120, 32, -30, { c: '#80502e', seed: 2, fat: '#efd9b0' }), xphBeefChunk(p, 92, 138, 32, 60, { c: '#84522e', seed: 3, fat: '#efd9b0' }),
        K.potato(p, 106, 70, 24, 20, { c: '#efd296' }), K.potato(p, 64, 100, 22, -20, { c: '#efd296' }),
        xphPechay(p, 136, 148, 48, -150, { c: '#3f8a2e' }), xphPechay(p, 150, 96, 40, -80, { c: '#4a9234' }),
        `</g>`),
        xphPepper(p, 100, 100, 120, 14, 4),
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Nilagang baboy: clear pork broth with pork belly, saba banana, potato, cabbage wedge, pechay and peppercorns
    ph_nilagang_baboy: p => [
        xphBowl(p, { line: '#d24a3a', R: 93 }),
        xphBroth(p, '#dfc996', { R: 74, oil: 6, oilC: '#f0c060', seed: 4 }),
        xphZoom(1.1, `<g ${p.sh(.8)}>`,
        xphCabWedge(p, 128, 72, 50, 20),
        xphPorkChunk(p, 78, 84, 34, -10, { seed: 1 }), xphPorkChunk(p, 112, 110, 34, 30, { seed: 2 }), xphPorkChunk(p, 76, 124, 30, 60, { seed: 3 }),
        xphSaba(p, 140, 116, 28, 40), xphSaba(p, 108, 146, 26, -10),
        K.potato(p, 100, 72, 24, 20, { c: '#efd296' }), K.potato(p, 54, 104, 22, -20, { c: '#efd296' }),
        xphPechay(p, 60, 140, 46, 140, { c: '#3f8a2e' }), xphPechay(p, 150, 140, 40, -130, { c: '#4a9234' }),
        `</g>`),
        xphPepper(p, 100, 100, 120, 14, 5),
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Bulalo: beef shank with the marrow bone, corn on the cob, pechay and cabbage in a rich clear broth
    ph_bulalo: p => [
        xphClayPot(p, { c: '#8a4a2a' }),
        xphBroth(p, '#d0a663', { R: 77, oil: 18, oilC: '#f2b84a', seed: 5 }),
        `<g ${p.sh(1)}>`,
        xphCob(p, 62, 82, 36, 22, -40), xphCob(p, 146, 110, 34, 22, 70),
        xphCabWedge(p, 136, 70, 44, 30),
        xphShank(p, 98, 106, 76, 10, { c: '#8a5232', seed: 1 }),
        xphPechay(p, 74, 138, 56, 150, { c: '#3a8a2a' }), xphPechay(p, 126, 146, 48, -120, { c: '#438f30' }),
        `</g>`,
        xphPepper(p, 100, 100, 130, 12, 6),
        K.scallions(p, 70, 110, 30, { n: 6 }),
        xphShine(100, 100, 74, .3),
    ].join(''),

    // Pochero: pork, fried saba, chickpeas, potato, pechay and cabbage in a tomato broth
    ph_pochero: p => [
        xphEnamel(p, { rim: '#2f6a4a' }),
        xphBroth(p, '#b9532e', { R: 77, oil: 12, oilC: '#e8902a', seed: 6 }),
        xphZoom(1.1, `<g ${p.sh(.8)}>`,
        xphCabWedge(p, 136, 76, 44, 30),
        xphPorkChunk(p, 76, 82, 32, -10, { seed: 1 }), xphPorkChunk(p, 112, 112, 32, 30, { seed: 2 }), xphPorkChunk(p, 72, 126, 28, 60, { seed: 3 }),
        xphSaba(p, 110, 72, 28, -20, { c: '#e0a040' }), xphSaba(p, 146, 120, 26, 40, { c: '#dc9a3a' }), xphSaba(p, 52, 104, 24, 70, { c: '#e0a040' }),
        K.potato(p, 104, 146, 22, 20, { c: '#e8b46c' }),
        xphPechay(p, 136, 150, 44, -150, { c: '#3f8a2e' }),
        xphSpots('pchC', 12, 56, 11).map(([x, y]) => `<g ${p.sh(.4)}><circle cx="${f(x)}" cy="${f(y)}" r="4.2" fill="${p.rg('#e6c88a', .3, .25, .35, .32)}" stroke="#b08a4a" stroke-width=".5"/></g><path d="M${f(x + 1)},${f(y - 3)} q2,1 1.6,3" stroke="#b08a4a" stroke-width=".6" fill="none"/>`).join(''),
        `</g>`, xphPechay(p, 64, 66, 40, 140, { c: '#4a9234' })),
        xphWash('#b9532e', 72, .1),
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Sopas: creamy milky macaroni soup with chicken, hotdog slices, carrot and cabbage
    ph_sopas: p => [
        xphBowl(p, { line: '#e8a03a', R: 93 }),
        xphBroth(p, '#f1e2c2', { R: 74, oil: 8, oilC: '#f2c060', seed: 7 }),
        `<g ${p.sh(.5)}>`,
        xphSpots('sps', 40, 62, 10).map(([x, y, a]) => xphUse(p, 'mc', () => K.macaroni(p, 0, 0, 17, 0, { c: '#f2d898' }), x, y, a)).join(''),
        xphChickShreds(p, 100, 100, 110, 14, 1),
        xphSpots('sps2', 8, 54, 18).map(([x, y]) => `<g ${T(x, y)}><ellipse rx="6.4" ry="5.8" fill="${p.g('#de4a36', .3, .25)}" stroke="#9a2a1a" stroke-width=".6"/><ellipse rx="4.2" ry="3.8" fill="#ec8a72" opacity=".8"/></g>`).join(''),
        xphCubes(p, 'ca', xphSpots('sps3', 9, 56, 16), 8, '#ec7b2d'),
        xphShreds(p, 100, 100, 110, { c: '#dfe9b4', n: 12, w: 2.4, len: .22, seed: 4 }),
        `</g>`,
        K.scallions(p, 100, 100, 100, { n: 16 }),
        xphShine(100, 100, 72, .4),
    ].join(''),

    // Pancit molo: pork wontons in clear chicken broth with shredded chicken, fried garlic and scallions
    ph_molo: p => [
        xphBowl(p, { line: '#2f6aa8', R: 93 }),
        xphBroth(p, '#e2c690', { R: 74, oil: 10, oilC: '#f0b850', seed: 8 }),
        xphZoom(1.08, `<g ${p.sh(.6)}>`,
        [[76, 76, 20], [124, 72, -40], [62, 116, 60], [102, 104, 0], [140, 112, 100], [90, 142, -20], [130, 146, 40]].map(([x, y, a], i) => xphWonton(p, x, y, 46, a, { seed: i })).join(''),
        xphChickShreds(p, 100, 100, 100, 10, 2),
        `</g>`),
        xphCubes(p, 'ca', [[110, 80, 0], [80, 100, 20], [118, 126, 40], [70, 140, 10]], 6, '#ec7b2d'),
        xphFriedGarlic(p, 100, 96, 70, 30, 6),
        K.scallions(p, 100, 100, 110, { n: 22 }),
        xphShine(100, 100, 72, .35),
    ].join(''),

    // Sotanghon soup: glass noodles in an annatto-orange chicken broth with chicken, carrot, cabbage, egg and scallions
    ph_sotanghon: p => [
        xphBowl(p, { line: '#d24a3a', R: 93 }),
        xphBroth(p, '#df9548', { R: 74, oil: 14, oilC: '#f07a2a', seed: 9 }),
        xphNoodles(p, 100, 100, 136, { c: '#f4d8a8', w: 1.4, n: 50, seed: 3, outline: '#d49a5a', hi: .25 }),
        `<g ${p.sh(.6)}>`,
        xphChickShreds(p, 100, 100, 110, 16, 3),
        xphShreds(p, 100, 100, 110, { c: '#ef7f30', n: 14, w: 2.2, len: .24, seed: 5 }),
        [[82, 120, 20], [126, 84, -40], [70, 80, 60]].map(([x, y, a]) => K.leafPiece(p, x, y, 22, a, { c: '#d6e4a0', vein: '#f6f8e6', cooked: true })).join(''),
        K.eggHalf(p, 124, 122, 30, 20), K.eggHalf(p, 92, 92, 28, -30),
        `</g>`,
        xphFriedGarlic(p, 100, 100, 70, 24, 7),
        K.scallions(p, 100, 100, 110, { n: 22 }),
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Tinolang tahong: mussels in a ginger broth with malunggay and chili leaves
    ph_tinolang_tahong: p => [
        xphGlazed(p, '#4f7a5a', '#f1efe2', 93),
        xphBroth(p, '#e0cd9c', { R: 76 }),
        `<g ${p.sh(.8)}>`,
        [[76, 72, -30], [118, 66, 20], [148, 98, 80], [56, 108, 100], [96, 100, -10], [134, 132, 40], [74, 138, 150], [108, 146, 0], [114, 112, 110]].map(([x, y, a]) => xphUse(p, 'mu', () => xphMussel(p, 0, 0, 44, 0), x, y, a)).join(''),
        [[86, 120], [128, 90], [62, 84]].map(([x, y]) => `<g ${T(x, y)}><ellipse rx="5.6" ry="4.4" fill="${p.g('#f1dc9e', .3, .2)}" stroke="#c9a85a" stroke-width=".5"/><ellipse rx="3.2" ry="2.4" fill="none" stroke="#e4c47a" stroke-width=".5"/></g>`).join(''),
        `</g>`,
        `<g ${p.sh(.4)}>`, xphMalunggay(p, 100, 100, 110, { n: 5, seed: 3 }), `</g>`,
        xphGreenChili(p, 128, 76, 36, -40),
        xphShine(100, 100, 74, .3),
    ].join(''),

    // Sinabawang mais: creamy corn soup with malunggay leaves and small shrimp
    ph_sinabawang_mais: p => [
        xphBowl(p, { line: '#3f8a4a', R: 93 }),
        xphBroth(p, '#efd27a', { R: 74 }),
        xphSpots('smk', 90, 66, 6).map(([x, y, a]) => xphUse(p, 'kn', () => `<rect x="-2.8" y="-2.4" width="5.6" height="4.8" rx="1.8" fill="${p.g('#f6cf3a', .35, .2)}" stroke="#c99a12" stroke-width=".4"/>`, x, y, a)).join(''),
        `<path d="M48,96 q20,-10 40,0 M110,140 q16,-8 34,-2" stroke="#fbeab0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
        `<g ${p.sh(.6)}>`, [[86, 84, 30], [124, 118, -40], [74, 128, 80], [130, 74, 10]].map(([x, y, a]) => K.shrimp(p, x, y, 22, a)).join(''), `</g>`,
        `<g ${p.sh(.4)}>`, xphMalunggay(p, 100, 100, 112, { n: 6, seed: 4 }), `</g>`,
        xphShine(100, 100, 72, .35),
    ].join(''),

    // Pesang isda: fish slices in a clear ginger broth with pechay, cabbage, potato and scallions; miso sauce on the side
    ph_pesang_isda: p => [
        xphBowl(p, { line: '#2f6aa8', R: 93 }),
        xphBroth(p, '#e8dcbc', { R: 74 }),
        xphZoom(1.14, `<g ${p.sh(.8)}>`,
        xphCabWedge(p, 136, 76, 44, 30),
        xphFishSteak(p, 82, 86, 52, -20, { skin: '#4a4a3e', flesh: '#f6f2e8' }), xphFishSteak(p, 112, 120, 54, 15, { skin: '#4a4a3e', flesh: '#f6f2e8' }),
        K.potato(p, 60, 120, 22, 20, { c: '#f0d8a0' }), K.potato(p, 140, 118, 20, -20, { c: '#f0d8a0' }),
        xphPechay(p, 80, 144, 48, 160, { c: '#3f8a2e' }), xphPechay(p, 108, 66, 44, -20, { c: '#4a9234' }),
        [[124, 96], [64, 92], [100, 96]].map(([x, y]) => `<g ${T(x, y)}><ellipse rx="5.6" ry="4.4" fill="${p.g('#f1dc9e', .3, .2)}" stroke="#c9a85a" stroke-width=".5"/><ellipse rx="3.2" ry="2.4" fill="none" stroke="#e4c47a" stroke-width=".5"/></g>`).join(''),
        `</g>`, xphPechay(p, 150, 110, 36, -100, { c: '#3f8a2e' })),
        K.scallions(p, 100, 100, 100, { n: 16 }), xphPepper(p, 100, 100, 100, 8, 7),
        xphShine(100, 100, 72, .35),
        xphSaucer(p, 160, 160, 18, '#b0844a', { line: '#2f6aa8' }), xphGrains(p, 160, 160, 18, { cols: ['#d8302a', '#8a5a2a'], n: 8, size: 1.2, seed: 8 }),
    ].join(''),

    // Picadillo: ground beef soup with diced potato and carrot in a tomato-tinted broth with greens
    ph_picadillo: p => [
        xphBowl(p, { line: '#d24a3a', R: 93 }),
        xphBroth(p, '#c27a48', { R: 74, oil: 12, oilC: '#e8902a', seed: 10 }),
        xphGrains(p, 100, 100, 134, { cols: ['#7a4426', '#8e5430', '#6a3a20'], n: 150, size: 2.4, seed: 2 }),
        `<g ${p.sh(.6)}>`,
        xphCubes(p, 'po', xphSpots('pcd', 16, 56, 16), 14, '#ecc77c'),
        xphCubes(p, 'ca', xphSpots('pcd2', 10, 56, 16), 10, '#ec7b2d'),
        `</g>`,
        `<g ${p.sh(.4)}>`, xphMalunggay(p, 100, 100, 104, { n: 4, seed: 5 }), xphPechay(p, 132, 130, 40, -140, { c: '#3f8a2e' }), `</g>`,
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Bulanglang: vegetables in a cloudy rice-washing broth: squash, okra, long beans, eggplant, malunggay and tomato
    ph_bulanglang: p => [
        xphGlazed(p, '#3f6a8a', '#f2efe6', 93),
        xphBroth(p, '#e6d6b0', { R: 76 }),
        xphZoom(1.14, `<g ${p.sh(.7)}>`,
        xphCubes(p, 'sq', xphSpots('blg', 8, 54, 22), 20, '#f0a030', { skin: '#5e7a2a' }),
        [[122, 70, 20], [70, 132, -30]].map(([x, y, a]) => xphOkraPod(p, x, y, 40, a, { c: '#6aa840' })).join(''),
        [[60, 90, 60], [140, 130, -20], [104, 140, 10], [96, 64, -40]].map(([x, y, a]) => K.greenBean(p, x, y, 28, a)).join(''),
        xphEggplantRound(p, 112, 106, 22, 0), xphEggplantRound(p, 76, 104, 20, 0),
        xphTomPiece(p, 136, 100, 17, 20, { seed: 1 }), xphTomPiece(p, 86, 74, 16, -30, { seed: 2 }),
        `</g>`, xphCubes(p, 'sq2', [[100, 100, 20], [130, 150, 40]], 18, '#f0a030', { skin: '#5e7a2a' })),
        `<g ${p.sh(.4)}>`, xphMalunggay(p, 100, 100, 110, { n: 5, seed: 6 }), `</g>`,
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Binakol: chicken soup in coconut water, served in a coconut shell, with young coconut strips, lemongrass, chayote and malunggay
    ph_binakol: p => [
        xphCoconut(p),
        xphBroth(p, '#ece2c6', { R: 70 }),
        xphZoom(1.12, `<g ${p.sh(.8)}>`,
        xphPoached(p, 80, 82, 40, -20, 1), xphPoached(p, 122, 118, 40, 40, 2), xphPoached(p, 78, 124, 34, 70, 3, '#e8cc98'),
        xphChayote(p, 124, 80, 28, -40), xphChayote(p, 104, 100, 26, 60), xphChayote(p, 100, 140, 24, 10),
        `</g>`),
        `<g ${p.sh(.5)}>`,
        xphSpots('bnk', 12, 54, 13).map(([x, y, a]) => `<g ${T(x, y, a)}><rect x="-10" y="-2.4" width="20" height="4.8" rx="2.2" fill="${p.g('#fbf9f0', .2, .12)}" stroke="#d6d0bc" stroke-width=".6"/></g>`).join(''),
        `<g ${T(60, 96, -30)}><path d="M-14,0 L14,0" stroke="#c8c878" stroke-width="5" stroke-linecap="round"/><path d="M-14,0 L14,0" stroke="#e6e8a8" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="2" cy="0" rx="5" ry="4" fill="none" stroke="#c8c878" stroke-width="2.2"/></g>`,
        `</g>`,
        `<g ${p.sh(.4)}>`, xphMalunggay(p, 100, 100, 100, { n: 5, seed: 7 }), `</g>`,
        xphShine(100, 100, 66, .3),
    ].join(''),

    // Pancit lomi: thick egg noodles in a thick starchy brown broth with pork, liver, egg ribbons, cabbage and carrot
    ph_lomi: p => [
        xphEnamel(p, { rim: '#c8302a' }),
        xphBroth(p, '#a8763e', { R: 77 }),
        xphNoodles(p, 100, 100, 140, { c: '#ecc86a', w: 4.6, n: 26, seed: 4, outline: '#a87a2a', hi: .3 }),
        K.liquid(p, { R: 74, c: '#9a6a36', op: .3, shine: false }),
        `<g ${p.sh(.6)}>`,
        [[80, 80, 20], [124, 112, -30], [100, 136, 60]].map(([x, y, a], i) => K.porkSlice(p, x, y, 22, a, { c: '#b07a4a', seed: i, char: false })).join(''),
        [[120, 74, 30], [70, 118, -20]].map(([x, y, a]) => `<g ${T(x, y, a)}><path d="M-9,-4 Q0,-6 9,-3 Q10,2 7,4 Q0,6 -8,4 Q-10,0 -9,-4Z" fill="${p.g('#5a2a1e', .3, .3)}" stroke="#3a140c" stroke-width=".5"/></g>`).join(''),
        `<g opacity=".6">${K.eggRibbons(p, 100, 100, 90, { n: 6 })}</g>`,
        xphShreds(p, 100, 100, 110, { c: '#dfe9b4', n: 10, w: 2.4, len: .22, seed: 6 }),
        xphShreds(p, 100, 100, 100, { c: '#ef7f30', n: 10, w: 2, len: .2, seed: 7 }),
        `</g>`,
        K.crumbs(p, 112, 92, 40, { n: 14, c: '#d89a4a' }),
        K.scallions(p, 100, 100, 100, { n: 20 }),
        xphFriedGarlic(p, 100, 100, 70, 20, 8),
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Sinampalukang manok: chicken in a sour broth with young tamarind leaves, tomato, long beans and chili
    ph_sinampalukang_manok: p => [
        xphBowl(p, { line: '#3f8a4a', R: 93 }),
        xphBroth(p, '#d4a862', { R: 74 }),
        `<g ${p.sh(.8)}>`,
        xphPoached(p, 78, 82, 42, -20, 1, '#e6c088'), xphPoached(p, 124, 122, 42, 40, 2, '#e2bc84'), xphDrum(p, 80, 128, 54, 140, { c: '#e2c08a' }), xphPoached(p, 126, 78, 36, 20, 3, '#e6c088'),
        xphTomPiece(p, 104, 104, 18, 20, { seed: 1 }), xphTomPiece(p, 150, 100, 16, -30, { seed: 2 }), xphTomPiece(p, 102, 64, 15, 40, { seed: 3 }),
        [[56, 100, 60], [104, 150, 10], [144, 136, -40]].map(([x, y, a]) => K.greenBean(p, x, y, 28, a)).join(''),
        xphGreenChili(p, 100, 124, 40, -20),
        `</g>`,
        xphSprig(p, 100, 100, 120, { n: 8, seed: 2, c: '#8cbc3a', lw: 1.7, pairs: 7 }),
        xphShine(100, 100, 72, .3),
    ].join(''),

    // Sinabawang halaan: clams in a light ginger broth with malunggay and tomato
    ph_halaan: p => [
        xphGlazed(p, '#2f5f86', '#f1efe8', 93),
        xphBroth(p, '#e6dbbd', { R: 76 }),
        `<g ${p.sh(.7)}>`,
        xphSpots('hal', 14, 58, 20).map(([x, y, a], i) => xphUse(p, 'cl' + (i % 2), () => K.clam(p, 0, 0, 24, 0, { open: !!(i % 2) }), x, y, a)).join(''),
        xphTomPiece(p, 100, 100, 16, 20, { seed: 1 }), xphTomPiece(p, 138, 126, 15, -30, { seed: 2 }),
        `</g>`,
        xphShreds(p, 100, 100, 100, { c: '#f2df9c', n: 12, w: 1.6, len: .22, seed: 3 }),
        `<g ${p.sh(.4)}>`, xphMalunggay(p, 100, 100, 110, { n: 5, seed: 8 }), `</g>`,
        xphShine(100, 100, 74, .35),
    ].join(''),
};
