// World pack: Philippines (lutong bahay)
import * as K from '../kit.mjs';

const { T, f, rng, ring, lt, dk, mix, smooth } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// Local helpers (ph = Philippines)
// =========================================================
function phSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function phOl(p, c, r = .55){
    const id = p.def('phOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const phShine = (cx, cy, R, op = .35, w = 1.8) => `<path d="M${f(cx - R * .55)},${f(cy + R * .1)} A${f(R * .6)},${f(R * .6)} 0 0 1 ${f(cx - R * .05)},${f(cy - R * .52)}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
const phArc = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// rice mound (grains drawn as short rounded strokes)
function phRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'phRice' + seed + x + y);
    const shape = phSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('phRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
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
function phGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'phGr' + seed + x + y);
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
function phShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'phSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? phOl(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// noodles: all strands in one path (bihon, misua)
function phNoodles(p, x, y, s, { c = '#d9b06a', w = 1.6, n = 60, seed = 1, sy = .9, outline = null, hi = .35 } = {}){
    const R = rng(p.id + 'phNd' + seed);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.15 + R() * .82), a0 = R() * 6.28, sweep = 1 + R() * 2.2;
        const cx = x + (R() - .5) * s * .14, cy = y + (R() - .5) * s * .14;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .3); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = phSm(pts);
        d += one; if (R() < hi) dl += one;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.8)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="${outline || dk(c, .25)}" stroke-width="${f(w + .9)}"/><use href="#${id}" stroke="${c}" stroke-width="${w}"/></g><path d="${dl}" stroke="${lt(c, .4)}" stroke-width="${f(w * .5)}" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// dice (rounded cube seen from above)
function phDice(p, x, y, s, r = 0, c = '#ef7f30', { skin = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f(h * .5)}" width="${s}" height="${f(s * .22)}" rx="${f(s * .1)}" fill="${skin}"/>` : ''}
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// evenly spread positions
function phSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('phspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// a small leaf (bay leaf, kangkong leaf, etc.)
function phLeaf(p, x, y, s, r = 0, { c = '#2f7a2a', w = 7.5 } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,0 Q-4,${-w} 6,${f(-w * .6)} Q10,-2 11,0 Q10,2 6,${f(w * .6)} Q-4,${w} -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 10,0" stroke="${lt(c, .35)}" stroke-width=".8" fill="none"/>
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}

// reuse one drawn part many times (keeps the SVG small): the part is drawn once at (0,0) into <defs>
function phUse(p, key, make, x, y, r = 0, k = 1){
    const id = p.def('phU' + key, id => `<g id="${id}">${make()}</g>`);
    return `<use href="#${id}" ${T(x, y, r, k)}/>`;
}

// ---------- vessels ----------
// white plate with a ring of small flowers on the rim (the classic Filipino everyday plate)
function phFloralPlate(p, { c = '#3f8a4a', c2 = '#e3a33a', R = 94, n = 14 } = {}){
    let fl = '';
    for (let i = 0; i < n; i++){
        const a = i / n * 6.283, x = 100 + Math.cos(a) * (R - 9), y = 100 + Math.sin(a) * (R - 9), deg = a * 57.3;
        fl += `<g ${T(x, y, deg + 90)}><path d="M-6.5,0 Q-3.5,-3 0,0 Q-3.5,3 -6.5,0Z M6.5,0 Q3.5,-3 0,0 Q3.5,3 6.5,0Z" fill="${c}" opacity=".85"/>${[0, 1, 2, 3, 4].map(j => `<circle cx="${f(Math.cos(j * 1.2566) * 1.7)}" cy="${f(Math.sin(j * 1.2566) * 1.7)}" r="1.2" fill="${c2}"/>`).join('')}<circle r=".9" fill="${dk(c2, .3)}"/></g>`;
    }
    return K.plate(p, { R, rim: 'none', well: .74 }) + fl;
}
// plain white bowl with coloured line(s) at the rim (mangkok)
function phBowl(p, { line = '#2f6aa8', R = 92, inside = '#fbf9f3' } = {}){
    return K.bowl(p, { glaze: '#f5f1e8', inside, R }) + `<circle cx="100" cy="100" r="${f(R * .935)}" fill="none" stroke="${line}" stroke-width="2.2" opacity=".9"/><circle cx="100" cy="100" r="${f(R * .895)}" fill="none" stroke="${line}" stroke-width=".7" opacity=".7"/>`;
}
// banana leaf laid across the plate (a strip with parallel veins, cut by the rim)
function phBanana(p, { r = -28, w = 128, R = 88, cx = 100, cy = 100 } = {}){
    const clip = p.uid();
    let veins = '';
    for (let i = -14; i <= 14; i++){ const x = i * 7; veins += `M${x},-4 L${x + 26},${-w / 2} M${x},4 L${x + 26},${w / 2}`; }
    const g = p.def('phBanG', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa24a"/><stop offset=".45" stop-color="#3f8a36"/><stop offset=".55" stop-color="#3a8232"/><stop offset="1" stop-color="#2e6e2a"/></linearGradient>`);
    return `<defs><clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>
        <g clip-path="url(#${clip})"><g ${T(cx, cy, r)}><g ${p.sh(.8)}><path d="M-120,${-w / 2 + 2} Q-40,${-w / 2 - 3} 0,${-w / 2} T120,${-w / 2 + 3} L120,${w / 2 - 2} Q40,${w / 2 + 3} 0,${w / 2} T-120,${w / 2 - 2}Z" fill="url(#${g})"/></g>
        <path d="${veins}" stroke="#6fb85a" stroke-width=".7" opacity=".55" fill="none"/>
        <path d="M-120,0 L120,0" stroke="#b9d98a" stroke-width="4.5"/><path d="M-120,1.6 L120,1.6" stroke="#8fbf5c" stroke-width="1.2"/>
        <path d="M-90,${-w / 2 + 8} Q-40,${-w / 2 + 4} 10,${-w / 2 + 7}" stroke="#fff" stroke-width="2" fill="none" opacity=".3" stroke-linecap="round"/></g></g>`;
}

// ---------- food parts ----------
// chicken drumstick (glossy, dark when braised)
function phDrum(p, x, y, s, r = 0, { c = '#7a3f17' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#e9d6b6', .3, .25)}" stroke="#a88a5c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="M-14,4 Q-6,10 4,7" stroke="${dk(c, .35)}" stroke-width="1.4" fill="none" opacity=".45"/>
        ${phArc('M-16,-5 Q-10,-11 -2,-9.5', 2.2, .8)}${phArc('M2,-6 Q7,-4.5 11,-3', 1.2, .55)}${phArc('M-12,1 Q-8,-1 -4,0', 1, .4)}</g>`;
}
// braised chicken thigh piece (skin side up, glossy)
function phThigh(p, x, y, s, r = 0, { c = '#7e4119', seed = 1 } = {}){
    const R = rng(p.id + 'phTh' + seed + x + y);
    const pts = ring(10, 10, .28, R, 1.25, .85);
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.8)}><path d="${phSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="${phSm(pts.map(([a, b]) => [a * .6 + 1.5, b * .55 + 1.5]), true)}" fill="${dk(c, .2)}" opacity=".4"/>
        <path d="M-7,3 q3,-1.5 6,0 M1,5 q3,-1 5,.5" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".5"/>
        ${phArc('M-8,-3.5 Q-3,-7.5 4,-6.5', 2, .8)}${phArc('M4,-2 Q7,-2 9,0', 1, .5)}</g>`;
}
// garlic clove (peeled, golden when braised)
function phGarlic(p, x, y, s, r = 0, { c = '#e9c47a' } = {}){
    return `<g ${T(x, y, r, s / 10)}><path d="M-5,2 Q-4,-4 1,-4.5 Q5,-4 5,1 Q3,4 -1,4 Q-4,4 -5,2Z" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M-2.5,-2 Q0,-3.4 2.5,-2.6" stroke="#fff" stroke-width=".8" fill="none" opacity=".7"/></g>`;
}
// whole fried tilapia
function phTilapia(p, x, y, L, r = 0, { c = '#b36a2a', seed = 1 } = {}){
    const k = L / 104;
    const R = rng(p.id + 'phTil' + seed);
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
        ${phArc('M-40,-14 Q-24,-23 -2,-22', 2.4, .55)}${phArc('M8,-20 Q18,-17 26,-11', 1.6, .45)}</g>`;
}
// calamansi half
function phCalamansi(p, x, y, s, { cut = true } = {}){
    if (!cut) return `<g ${p.sh(.5)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg('#4f9a33', .3, .3, .35, .32)}" stroke="#2f6a22" stroke-width=".6"/></g><ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .17)}" rx="${f(s * .14)}" ry="${f(s * .08)}" fill="#fff" opacity=".6"/>`;
    return `<g ${T(x, y)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="#3f8a2a"/></g><circle r="${f(s / 2 - 1.3)}" fill="#f1c94a"/><circle r="${f(s / 2 - 2.6)}" fill="${p.rg('#f6b33a', .3, .12)}"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0,0 L${f(Math.cos(i * .785) * (s / 2 - 2.8))},${f(Math.sin(i * .785) * (s / 2 - 2.8))}" stroke="#fde9a8" stroke-width=".8"/>`).join('')}<circle r="1.2" fill="#fde9a8"/>
        <ellipse cx="${f(-s * .16)}" cy="${f(-s * .18)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// small sauce saucer
function phSaucer(p, x, y, R, liq, { op = .9, rim = '#f6f2ea', line = null } = {}){
    return `<g ${p.sh(.9)}><circle cx="${x}" cy="${y}" r="${R}" fill="${p.rg(rim, .2, .15, .35, .3)}"/></g>${line ? `<circle cx="${x}" cy="${y}" r="${f(R - 2)}" fill="none" stroke="${line}" stroke-width="1.2"/>` : ''}
        <circle cx="${x}" cy="${y}" r="${f(R * .74)}" fill="${p.rg(liq, .25, .25, .45, .42)}" opacity="${op}"/>
        <path d="M${f(x - R * .5)},${f(y - R * .2)} A${f(R * .55)},${f(R * .55)} 0 0 1 ${f(x - R * .1)},${f(y - R * .55)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// round tomato slice
function phTomSlice(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><circle r="10" fill="${p.g('#e3392b', .3, .22)}" stroke="#a8221a" stroke-width=".6"/></g>
        <circle r="8.6" fill="#f2604a"/>${[0, 1, 2, 3].map(i => `<path ${T(Math.cos(i * 1.57 + .4) * 4.6, Math.sin(i * 1.57 + .4) * 4.6, i * 90 + 23)} d="M-2.4,0 Q0,-2.4 2.4,0 Q0,2.4 -2.4,0Z" fill="#f7b04a" stroke="#e98a3a" stroke-width=".4"/>`).join('')}
        <circle r="2.2" fill="#f58a6a"/><path d="M-6,-4 Q-2,-7 3,-6.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// eggplant omelette (tortang talong): flattened eggplant fan coated in egg
function phTorta(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'phTor' + seed);
    const pts = [[-L / 2, 0], [-L * .42, -W * .2], [-L * .2, -W * .4], [L * .08, -W * .5], [L * .32, -W * .44], [L * .48, -W * .2], [L * .5, W * .06], [L * .4, W * .34], [L * .16, W * .48], [-L * .14, W * .4], [-L * .38, W * .2]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    let streaks = '';
    for (let i = 0; i < 9; i++){ const bx = (R() - .45) * L * .7, by = (R() - .5) * W * .55; streaks += `<path ${T(bx, by, (R() - .5) * 30)} d="${phSm(ring(4 + R() * 6, 7, .5, R, 1.8, .7), true)}" fill="${R() < .5 ? '#7a6a42' : '#5e4a3a'}" opacity="${f(.3 + R() * .25)}"/>`; }
    let brown = '';
    for (let i = 0; i < 12; i++) brown += `<ellipse cx="${f((R() - .4) * L * .75)}" cy="${f((R() - .5) * W * .7)}" rx="${f(3 + R() * 6)}" ry="${f(2 + R() * 3)}" fill="#b8661c" opacity="${f(.15 + R() * .25)}"/>`;
    const id = p.uid(), shape = phSm(pts, true);
    return `<g ${T(x, y, r)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
        <g ${p.sh(1.2)}><path d="${shape}" fill="${p.rg('#ebb945', .3, .3, .4, .35)}" stroke="#b77a1c" stroke-width=".9"/></g>
        <g clip-path="url(#${id})">${streaks}${brown}</g>
        <g ${T(-L / 2 - 2, 0)}><path d="M2,-6 Q-3,-5 -5,0 Q-3,5 2,6 Q5,0 2,-6Z" fill="${p.g('#5c6a2c', .3, .3)}" stroke="#3a4416" stroke-width=".6"/><path d="M-4,0 L-14,-2" stroke="#6b7a3a" stroke-width="3.2" stroke-linecap="round"/><path d="M-4,0 L-14,-2" stroke="#93a45a" stroke-width="1.2" stroke-linecap="round"/></g>
        ${phArc(`M${f(-L * .3)},${f(-W * .22)} Q${f(-L * .02)},${f(-W * .46)} ${f(L * .3)},${f(-W * .36)}`, 3, .55)}
        ${phArc(`M${f(-L * .1)},${f(-W * .14)} Q${f(L * .05)},${f(-W * .22)} ${f(L * .18)},${f(-W * .2)}`, 1.4, .4)}</g>`;
}
// thin braised beef slice (bistek)
function phBeef(p, x, y, s, r = 0, { c = '#6a3818', seed = 1 } = {}){
    const R = rng(p.id + 'phBf' + seed + x + y);
    const k = s / 30;
    const folds = Array.from({ length: 3 }, (_, i) => { const fx = -8 + i * 8 + (R() - .5) * 4; return `M${f1(fx)},${f1(-6 + R() * 2)} q${f1((R() - .5) * 5)},6 ${f1((R() - .5) * 3)},${f1(11 + R() * 2)}`; }).join('');
    return `<g ${T(x, y, r, k)}><path d="${phSm(ring(14, 16, .32, R, 1.1, .62), true)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="${folds}" stroke="${dk(c, .45)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// onion ring (cooked, translucent)
function phOnionRing(p, x, y, s, r = 0, { c = '#f3e6c4', sy = .82 } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="${dk(c, .3)}" stroke-width="3.6" opacity=".55"/><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="${c}" stroke-width="2.6" opacity=".95"/>
        <ellipse rx="${f(s / 2 - 1.2)}" ry="${f(s / 2 * sy - 1.2)}" fill="none" stroke="#fff" stroke-width=".7" opacity=".7" stroke-dasharray="${f(s * .8)} ${f(s * 2)}"/></g>`;
}
// moringa (malunggay) leaflets: small rounded leaves in loose sprigs
function phMalunggay(p, x, y, s, { n = 7, seed = 1, c = '#3d8a2c' } = {}){
    const R = rng(p.id + 'phMl' + seed + x + y);
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
function phLumpia(p, x, y, L, W, r = 0, { cut = true, c = '#d48f32' } = {}){
    const h = W / 2;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-L / 2}" y="${-h}" width="${L}" height="${W}" rx="${f(h * .9)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>${[-.32, -.12, .1, .3].map((t, i) => `<circle cx="${f(L * t)}" cy="${f(h * (i % 2 ? .35 : -.1))}" r="1.1" fill="${lt(c, .4)}" opacity=".8"/><circle cx="${f(L * t + 4)}" cy="${f(h * (i % 2 ? -.2 : .4))}" r=".8" fill="${dk(c, .3)}" opacity=".5"/>`).join('')}
        <path d="M${f(-L * .3)},${f(-h)} Q${f(-L * .25)},0 ${f(-L * .32)},${f(h)} M${f(L * .05)},${f(-h)} Q${f(L * .1)},0 ${f(L * .04)},${f(h)}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".5"/>
        <path d="M${f(-L / 2 + 3)},${f(-h * .45)} L${f(L / 2 - 4)},${f(-h * .45)}" stroke="#fff3d6" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
        ${cut ? `<ellipse cx="${f(L / 2 - 1)}" cy="0" rx="${f(h * .55)}" ry="${f(h - .3)}" fill="#f0d7a0" stroke="${dk(c, .3)}" stroke-width=".6"/><ellipse cx="${f(L / 2 - .6)}" cy=".2" rx="${f(h * .4)}" ry="${f(h - 1.6)}" fill="${p.g('#b98a6a', .2, .25)}"/><circle cx="${f(L / 2 - 1)}" cy="${f(-h * .3)}" r=".8" fill="#ef8a3a"/><circle cx="${f(L / 2)}" cy="${f(h * .35)}" r=".7" fill="#ef8a3a"/>` : ''}</g>`;
}
// cooked pork belly chunk (sinigang): meat with a fat band and skin
function phPorkChunk(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'phPk' + seed + x + y);
    const pts = [[-11, -7], [0, -8], [11, -7], [12, 0], [11, 7], [0, 8], [-11, 7], [-12, 0]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    const id = p.uid(), shape = phSm(pts, true);
    return `<g ${T(x, y, r, s / 24)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs><g ${p.sh(.7)}><path d="${shape}" fill="#d9a888"/></g>
        <g clip-path="url(#${id})"><rect x="-14" y="-10" width="28" height="5" fill="#e8cfa8"/><rect x="-14" y="-5.4" width="28" height="4.6" fill="${p.g('#d39a7a', .2, .2)}"/><rect x="-14" y="-.8" width="28" height="3.4" fill="#f4e6cc"/><rect x="-14" y="2.6" width="28" height="4.4" fill="${p.g('#cc9070', .2, .2)}"/><rect x="-14" y="7" width="28" height="4" fill="#efdcbc"/></g>
        <path d="${shape}" fill="none" stroke="#9a6448" stroke-width=".7"/>${phArc('M-8,-6.5 Q-1,-8.4 6,-7.4', 1.3, .6)}</g>`;
}
// soft scrambled egg patch (flat, irregular)
function phEggCurd(p, x, y, s, r = 0, { seed = 1, c = '#f6d052' } = {}){
    const R = rng(p.id + 'phEc' + seed + x + y);
    const pts = ring(s / 2, 10, .38, R, 1.2, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${phSm(pts, true)}" fill="${p.g(c, .4, .2)}" stroke="${dk(c, .22)}" stroke-width=".6"/></g>
        <path d="${phSm(pts.map(([a, b]) => [a * .55 - 1, b * .5 - 1]), true)}" fill="${lt(c, .35)}" opacity=".7"/>
        <path d="M${f(-s * .1)},${f(s * .12)} q${f(s * .12)},${f(-s * .06)} ${f(s * .24)},0" stroke="${dk(c, .2)}" stroke-width=".7" fill="none" opacity=".6"/>${phArc(`M${f(-s * .3)},${f(-s * .08)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .12)},${f(-s * .26)}`, 1.2, .7)}</g>`;
}
// bitter melon (ampalaya) half-moon slice: bumpy green rim, pale inner flesh, U-shape
function phAmpalaya(p, x, y, s, r = 0){
    const k = s / 20;
    const out = Array.from({ length: 13 }, (_, i) => { const a = Math.PI + i / 12 * Math.PI, rr = 10 + (i % 2 ? .9 : 0); return [Math.cos(a) * rr, Math.sin(a) * rr * .9 + 3]; });
    const inn = Array.from({ length: 9 }, (_, i) => { const a = 2 * Math.PI - i / 8 * Math.PI; return [Math.cos(a) * 5, Math.sin(a) * 4.2 + 3]; });
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${phSm(out)}L${inn.map(([a, b]) => `${f1(a)},${f1(b)}`).join('L')}Z" fill="${p.g('#5aa13c', .25, .25)}" stroke="#2f6a22" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M-7.6,3 A7.6,7 0 0 1 7.6,3 L5,3 A5,4.2 0 0 0 -5,3Z" fill="#cfe6a6"/>${phArc('M-7,-2 Q-3,-6 2,-6.6', 1, .6)}</g>`;
}
// long green chili (siling haba)
function phGreenChili(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${-L / 2},0 Q${f(-L * .2)},-4.2 ${f(L * .4)},-3 Q${L / 2},-1 ${L / 2 + 1},0 Q${f(L * .3)},3.6 ${-L / 2},1.6Z" fill="${p.g('#5aa33a', .3, .25)}" stroke="#2f6a1e" stroke-width=".6"/></g>
        <path d="M${L / 2},-.5 q4,-1 6,-4" stroke="#6b8a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>${phArc(`M${f(-L * .38)},-1.2 Q0,-3.6 ${f(L * .3)},-2.4`, 1, .6)}</g>`;
}
// kangkong: hollow stem pieces and arrow-shaped leaves
function phKangkongStem(p, x, y, L, r = 0, { c = '#86b84e' } = {}){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="-2.6" width="${L}" height="5.2" rx="2.4" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>
        <ellipse cx="${L / 2 - 1}" cy="0" rx="1.6" ry="2.4" fill="${lt(c, .4)}" stroke="${dk(c, .3)}" stroke-width=".5"/><ellipse cx="${L / 2 - 1}" cy="0" rx=".8" ry="1.3" fill="${dk(c, .4)}"/>
        <path d="M${-L / 2 + 2},-1.2 L${L / 2 - 4},-1.2" stroke="#fff" stroke-width=".8" opacity=".55"/></g>`;
}
function phKangkongLeaf(p, x, y, s, r = 0, { c = '#2f6e24' } = {}){
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.5)}><path d="M-12,0 Q-8,-5.5 2,-5 Q8,-4 12,0 Q8,4 2,5 Q-8,5.5 -12,0Z M-12,0 L-14,-4 L-10,-1.5Z M-12,0 L-14,4 L-10,1.5Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        <path d="M-11,0 Q0,-.6 11,0" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>${phArc('M-6,-3 Q0,-5 6,-3.4', 1, .45)}</g>`;
}
// radish (labanos) round slice
function phRadish(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .46)}" fill="${p.rg('#f3efe4', .2, .15)}" stroke="#d1cab6" stroke-width=".6"/></g><ellipse rx="${f(s * .36)}" ry="${f(s * .32)}" fill="none" stroke="#fffdf6" stroke-width="1" opacity=".8"/>${phArc(`M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .1)},${f(-s * .33)} ${f(s * .14)},${f(-s * .32)}`, 1.2, .6)}</g>`;
}
// soft stewed tomato piece
function phTomPiece(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'phTp' + seed + x + y);
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="${phSm(pts, true)}" fill="${p.g('#e2412c', .3, .25)}" stroke="#a6261a" stroke-width=".6"/></g>
        <path d="${phSm(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true)}" fill="#f37a5c" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>${phArc('M-7,-4 Q-1,-7.5 5,-5.4', 1.2, .6)}</g>`;
}
// chayote wedge (pale green)
function phChayote(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-10,4 Q-7,-6 0,-7 Q7,-6 10,4 Q0,7 -10,4Z" fill="${p.g('#cfe3a0', .3, .2)}" stroke="#8fb05a" stroke-width=".7"/></g>
        <path d="M-10,4 Q0,7 10,4 Q0,5.4 -10,2.6Z" fill="#7fae4a" opacity=".85"/><path d="M-5,1 Q0,-3 5,1" stroke="#f1f7dc" stroke-width="2" fill="none" opacity=".8"/>${phArc('M-6,-3 Q-1,-6.4 5,-4.6', 1.1, .6)}</g>`;
}
// sponge gourd (patola) slice: dark green ridged rim, pale spongy flesh
function phPatola(p, x, y, s, r = 0, { seed = 1 } = {}){
    // peeled patola cut in chunky rolling wedges: soft translucent pale green, green ridge stripes left on
    const R = rng(p.id + 'phPt' + seed + x + y);
    const pts = ring(s / 2, 7, .22, R, 1.25, .8);
    const id = p.uid(), shape = phSm(pts, true);
    return `<g ${T(x, y, r)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs><g ${p.sh(.5)}><path d="${shape}" fill="${p.g('#d4e6a4', .35, .2)}" stroke="#86a95a" stroke-width=".6" opacity=".95"/></g>
        <g clip-path="url(#${id})"><path d="M${f(-s * .6)},${f(-s * .3)} L${f(s * .6)},${f(-s * .42)} M${f(-s * .6)},${f(s * .22)} L${f(s * .6)},${f(s * .1)}" stroke="#4f8a32" stroke-width="${f(s * .1)}" opacity=".85"/>
        <ellipse cx="${f(s * .05)}" cy="${f(-s * .02)}" rx="${f(s * .2)}" ry="${f(s * .12)}" fill="#eef5d2" opacity=".8"/></g>
        ${phArc(`M${f(-s * .3)},${f(-s * .08)} Q${f(-s * .1)},${f(-s * .24)} ${f(s * .14)},${f(-s * .2)}`, 1.1, .6)}</g>`;
}
// eggplant round slice (skin ring + flesh)
function phEggplantRound(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .44)}" fill="#4a2558"/></g><ellipse rx="${f(s / 2 - 1.6)}" ry="${f(s * .44 - 1.6)}" fill="${p.rg('#d9c08a', .2, .2)}"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${f(Math.cos(i * 1.05) * s * .2)}" cy="${f(Math.sin(i * 1.05) * s * .17)}" r=".9" fill="#a8885a"/>`).join('')}</g>`;
}
// carrot cut into a little flower (atchara)
function phCarrotFlower(p, x, y, s, r = 0){
    const pts = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.283, rr = s / 2 * (i % 2 ? .72 : 1); return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="${phSm(pts, true)}" fill="${p.g('#f08a30', .3, .2)}" stroke="#c0601a" stroke-width=".5"/></g><circle r="${f(s * .2)}" fill="#f8b46a"/></g>`;
}
// fried shrimp-paste free sweet-chili: specks
const phSpecks = (p, x, y, s, c, n, seed) => phGrains(p, x, y, s, { cols: [c], n, size: .8, seed });

// =========================================================
export default {
    // Steamed rice: a cup-moulded dome of rice on a banana leaf on a white plate
    ph_staple: p => [
        phFloralPlate(p, { c: '#4f8fbf', c2: '#f2c14a' }),
        phBanana(p, { r: -30, w: 124, R: 70 }),
        phRice(p, 100, 100, 112, { density: 1.6, grain: 3.6 }),
        phArc('M56,86 Q62,62 86,52', 3.4, .55), phArc('M66,94 Q70,80 82,72', 2, .4),
    ].join(''),

    // Chicken adobo: floral plate, dark soy-vinegar sauce, glossy drumsticks and thighs, garlic, bay leaves, peppercorns, egg
    ph_adobo: p => [
        phFloralPlate(p, { c: '#3f8a4a', c2: '#e88a3a' }),
        K.pool(p, 100, 104, 128, '#5e2f10', { op: .95, seed: 1, sy: .86 }),
        `<g ${p.sh(1.1)}>`,
        phThigh(p, 72, 82, 48, -20, { seed: 1 }),
        phThigh(p, 124, 128, 46, 30, { seed: 2, c: '#76391a' }),
        phDrum(p, 128, 80, 66, -40),
        phDrum(p, 76, 128, 64, 150, { c: '#80431a' }),
        phThigh(p, 102, 104, 42, 80, { seed: 3, c: '#834619' }),
        K.eggHalf(p, 148, 108, 26, 20, { stain: '#a8642a' }),
        K.eggHalf(p, 54, 104, 24, -30, { stain: '#a8642a' }),
        `</g>`,
        phGarlic(p, 96, 74, 12, 20), phGarlic(p, 112, 142, 11, -40), phGarlic(p, 60, 146, 10, 70), phGarlic(p, 150, 136, 11, 10),
        phLeaf(p, 118, 98, 26, -30, { c: '#7a7a3a', w: 6.5 }), phLeaf(p, 88, 150, 24, 160, { c: '#80803c', w: 6.5 }),
        phGrains(p, 100, 104, 100, { cols: ['#2a1608'], n: 14, size: 1.2, seed: 3 }),
        `<path d="M70,68 q8,-4 14,0 M112,152 q8,2 14,-3 M44,118 q2,6 6,9" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),

    // Pork giniling: white bowl, reddish tomato-sauced ground pork with diced potato, carrot and peas
    ph_giniling: p => {
        const sp = phSpots('gin', 24, 54, 13);
        return [
            phBowl(p, { line: '#2f6aa8' }),
            K.liquid(p, { R: 70, c: '#9a4220', op: 1, shine: false }),
            `<g ${p.sh(.5)}>`, phGrains(p, 100, 100, 134, { cols: ['#7a3416', '#8e4422', '#6a2a12', '#a4532a'], n: 300, size: 2.8, seed: 1 }), `</g>`,
            `<g ${p.sh(.7)}>`,
            sp.slice(0, 11).map(([x, y, a]) => phDice(p, x, y, 12, a, '#ebc87a')).join(''),
            sp.slice(11, 19).map(([x, y, a]) => phDice(p, x, y, 10, a, '#ec7b2d')).join(''),
            `</g>`,
            sp.slice(19).concat(phSpots('gin2', 7, 50, 15)).map(([x, y]) => `<circle cx="${f(x + 3)}" cy="${f(y - 3)}" r="3.6" fill="${p.rg('#69b043', .35, .2)}" stroke="#3a7524" stroke-width=".5"/>`).join(''),
            `<path d="M56,90 Q60,66 84,54" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".45"/><path d="M118,140 q10,-2 18,-10" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".35"/>`,
        ].join('');
    },

    // Bistek Tagalog: soy-calamansi beef slices topped with translucent onion rings, calamansi halves
    ph_bistek: p => [
        phFloralPlate(p, { c: '#2f6aa8', c2: '#e8c34a' }),
        K.pool(p, 100, 102, 128, '#4e2a10', { op: .95, seed: 2, sy: .86 }),
        `<g ${p.sh(1)}>`,
        phBeef(p, 76, 80, 58, -20, { seed: 1 }), phBeef(p, 124, 80, 56, 30, { seed: 2, c: '#713d1a' }),
        phBeef(p, 70, 122, 56, 40, { seed: 3, c: '#663416' }), phBeef(p, 118, 124, 60, -10, { seed: 4 }),
        phBeef(p, 98, 100, 54, 70, { seed: 5, c: '#74401c' }),
        `</g>`,
        `<g ${p.sh(.6)}>`,
        phOnionRing(p, 86, 92, 30, 10), phOnionRing(p, 112, 104, 26, -20), phOnionRing(p, 76, 120, 22, 30), phOnionRing(p, 124, 80, 22, 0),
        phOnionRing(p, 104, 132, 24, 40), phOnionRing(p, 100, 74, 16, 0), phOnionRing(p, 132, 118, 16, 0), phOnionRing(p, 64, 98, 14, 0),
        `</g>`,
        phCalamansi(p, 150, 142, 20), phCalamansi(p, 134, 156, 18), phCalamansi(p, 160, 122, 16, { cut: false }),
    ].join(''),

    // Fried tilapia: banana leaf, a whole crisp golden-brown tilapia with slashes, tomato slices, vinegar dip
    ph_tilapia: p => [
        phFloralPlate(p, { c: '#3f8a4a', c2: '#e8c34a' }),
        phBanana(p, { r: 18, w: 112, R: 78 }),
        phTilapia(p, 92, 92, 150, -14, { c: '#a8622a' }),
        phTomSlice(p, 70, 146, 24, 0), phTomSlice(p, 92, 152, 22, 30),
        phSaucer(p, 148, 138, 20, '#e9dcae', { line: '#2f6aa8' }),
        phGrains(p, 148, 138, 20, { cols: ['#d42a1c', '#f3ecd2'], n: 10, size: 1.1, seed: 2 }),
        phCalamansi(p, 128, 158, 16),
    ].join(''),

    // Ginisang munggo: bowl of thick olive mung bean stew with malunggay leaves, pork bits and tomato
    ph_munggo: p => [
        phBowl(p, { line: '#3f8a4a' }),
        K.liquid(p, { R: 70, c: '#a0924c', op: 1, shine: false }),
        phGrains(p, 100, 100, 136, { cols: ['#6f7e34', '#c7b462', '#86913f', '#b0a052', '#d8c87a'], n: 320, size: 2.2, seed: 1 }),
        `<g ${p.sh(.6)}>`,
        phSpots('mun', 6, 46, 22).map(([x, y, a]) => phDice(p, x, y, 10, a, '#b07a50', { skin: '#f0dcc0' })).join(''),
        phTomPiece(p, 82, 120, 18, 20, { seed: 1 }), phTomPiece(p, 126, 86, 17, -40, { seed: 2 }),
        `</g>`,
        `<g ${p.sh(.5)}>`, phMalunggay(p, 100, 98, 96, { n: 6 }), `</g>`,
        phShine(100, 100, 68, .35),
    ].join(''),

    // Tortang talong: two egg-coated flattened eggplants with stems, banana ketchup on the side
    ph_tortang_talong: p => [
        phFloralPlate(p, { c: '#d9663a', c2: '#3f8a4a' }),
        phTorta(p, 108, 74, 110, 60, -12, { seed: 1 }),
        phTorta(p, 100, 124, 108, 58, -4, { seed: 2 }),
        phSaucer(p, 154, 150, 17, '#d5362a', { op: 1 }),
    ].join(''),

    // Pancit bihon: tangled thin rice noodles with cabbage, carrot, chicken strips, snow peas, calamansi
    ph_pancit: p => {
        const veg = phSpots('pan', 16, 52, 15);
        return [
            phFloralPlate(p, { c: '#d24a3a', c2: '#f2c14a' }),
            phNoodles(p, 100, 102, 134, { c: '#d9b274', w: 1.3, n: 44, seed: 1, hi: .25 }),
            `<g ${p.sh(.7)}>`,
            veg.slice(0, 7).map(([x, y, a]) => K.leafPiece(p, x, y, 24, a, { c: '#d6e4a0', vein: '#f6f8e6', cooked: true })).join(''),
            `</g>`,
            phNoodles(p, 100, 100, 114, { c: '#d3aa68', w: 1.3, n: 16, seed: 2, hi: .25 }),
            `<g ${p.sh(.6)}>`,
            phShreds(p, 100, 100, 108, { c: '#ef7f30', n: 22, w: 2.2, len: .2, seed: 3 }),
            veg.slice(7, 13).map(([x, y, a]) => `<g ${T(x, y, a)}><rect x="-8" y="-2.4" width="16" height="4.8" rx="2.2" fill="${p.g('#ecd2a6', .3, .2)}" stroke="#bf9e70" stroke-width=".5"/></g>`).join(''),
            veg.slice(13).map(([x, y, a]) => K.leafPiece(p, x, y, 18, a, { c: '#cfe08e', vein: '#f6f8e6', cooked: true })).join(''),
            K.snowPea(p, 78, 84, 20, 30), K.snowPea(p, 122, 120, 20, -40), K.snowPea(p, 108, 78, 18, 100), K.snowPea(p, 82, 124, 18, -10),
            `</g>`,
            phCalamansi(p, 150, 58, 20), phCalamansi(p, 162, 78, 18), phCalamansi(p, 38, 128, 18),
        ].join('');
    },

    // Ensaladang kamatis: small bowl of diced tomato, red onion and salted egg
    ph_ensalada: p => {
        const sp = phSpots('ens', 32, 60, 13);
        return [
            phBowl(p, { line: '#d24a3a' }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, a], i) => phUse(p, 'tp' + (i % 4), () => phTomPiece(p, 0, 0, 25, 0, { seed: i % 4 }), x, y, a)).join(''),
            `</g>`,
            `<g ${p.sh(.4)}>`,
            phSpots('ens2', 14, 54, 12).map(([x, y, a]) => `<g ${T(x, y, a)}><path d="M-5,1 Q0,-3.4 5,1 L4,2.4 Q0,-1.4 -4,2.4Z" fill="#f2e2ee" stroke="#a3407a" stroke-width="1"/></g>`).join(''),
            `</g>`,
            phGrains(p, 106, 94, 40, { cols: ['#fbf6ea', '#ea6a26'], n: 16, size: 3, seed: 3 }),
        ].join('');
    },

    // Atchara: pale shredded green papaya with carrot flowers, red pepper strips, raisins and ginger
    ph_atchara: p => [
        K.kobachi(p, { glaze: '#e9e4d6', inside: '#f6f3ea' }),
        K.liquid(p, { R: 66, c: '#efe4b8', op: .6, shine: false }),
        `<g ${p.sh(.6)}>`,
        phShreds(p, 100, 100, 128, { c: '#efe2a6', n: 150, w: 2.2, len: .3, seed: 1 }),
        `</g>`,
        `<g ${p.sh(.5)}>`,
        phSpots('atc', 9, 50, 20).map(([x, y, a]) => phCarrotFlower(p, x, y, 13, a)).join(''),
        phSpots('atc2', 7, 52, 20).map(([x, y, a]) => K.pepperPiece(p, x, y, 18, a, { c: '#d6302a', strip: true })).join(''),
        phSpots('atc3', 8, 52, 14).map(([x, y, a]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.7" transform="rotate(${a} ${f(x)} ${f(y)})" fill="#5a2a2a" stroke="#3a1412" stroke-width=".4"/>`).join(''),
        `</g>`,
        K.gingerShreds(p, 96, 104, 60),
        phShine(100, 100, 64, .4),
    ].join(''),

    // Adobong kangkong: glossy water spinach stems and leaves with golden garlic
    ph_kangkong: p => {
        const sp = phSpots('kk', 22, 56, 13);
        return [
            phFloralPlate(p, { c: '#2f6aa8', c2: '#f2c14a' }),
            K.pool(p, 100, 102, 122, '#5a3412', { op: .7, seed: 1 }),
            `<g ${p.sh(.7)}>`,
            sp.slice(0, 11).map(([x, y, a]) => phUse(p, 'ks1', () => phKangkongStem(p, 0, 0, 26, 0, { c: '#86b450' }), x, y, a)).join(''),
            sp.slice(11).map(([x, y, a]) => phUse(p, 'kl1', () => phKangkongLeaf(p, 0, 0, 38, 0, { c: '#3a7a2a' }), x, y, a)).join(''),
            phSpots('kk2', 9, 48, 16).map(([x, y, a]) => phUse(p, 'kl2', () => phKangkongLeaf(p, 0, 0, 34, 0, { c: '#2f6e24' }), x, y, a)).join(''),
            phSpots('kk3', 6, 40, 18).map(([x, y, a]) => phUse(p, 'ks2', () => phKangkongStem(p, 0, 0, 24, 0, { c: '#78a644' }), x, y, a)).join(''),
            `</g>`,
            phGrains(p, 100, 100, 104, { cols: ['#e3a84a', '#c98a2a'], n: 30, size: 1.6, seed: 2 }),
        ].join('');
    },

    // Ginisang ampalaya: bitter melon crescents with soft scrambled egg and tomato
    ph_ampalaya: p => {
        const sp = phSpots('amp', 40, 62, 10);
        return [
            phFloralPlate(p, { c: '#3f8a4a', c2: '#e88a3a' }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, a], i) => phUse(p, 'amp' + (i % 3), () => phAmpalaya(p, 0, 0, 22 + (i % 3), 0), x, y, a)).join(''),
            `</g>`,
            phSpots('ampE', 8, 50, 22).map(([x, y, a], i) => phEggCurd(p, x, y, 22 + (i % 3) * 4, a, { seed: i })).join(''),
            `<g ${p.sh(.5)}>`,
            phTomPiece(p, 70, 120, 17, 20, { seed: 1 }), phTomPiece(p, 132, 90, 16, -30, { seed: 2 }), phTomPiece(p, 98, 138, 15, 70, { seed: 3 }), phTomPiece(p, 92, 70, 15, 0, { seed: 4 }),
            `</g>`,
            phGrains(p, 100, 100, 100, { cols: ['#f3e2b4'], n: 10, size: 1.6, seed: 4 }),
        ].join('');
    },

    // Ginataang kalabasa at sitaw: creamy coconut sauce with orange squash cubes, long beans and shrimp
    ph_kalabasa: p => {
        const sp = phSpots('kal', 16, 54, 18);
        return [
            phBowl(p, { line: '#3f8a4a' }),
            K.liquid(p, { R: 70, c: '#f0cf88', op: 1 }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, a]) => phDice(p, x, y, 20, a, '#f2a032', { skin: '#5e7a2a' })).join(''),
            phSpots('kal2', 12, 54, 13).map(([x, y, a]) => K.greenBean(p, x, y, 22, a, { c: '#4f9a34' })).join(''),
            K.shrimp(p, 120, 118, 24, 20), K.shrimp(p, 78, 84, 22, -60), K.shrimp(p, 70, 128, 22, 60),
            `</g>`,
            `<path d="M48,100 q6,-3 12,0 M140,76 q4,4 10,4 M100,154 q6,2 12,-1" stroke="#fbf1d6" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`,
        ].join('');
    },

    // Lumpiang shanghai: a pile of thin golden spring rolls, some halved to show the filling, sweet chili dip
    ph_lumpia: p => {
        const rolls = [];
        for (let i = -4; i <= 4; i++) for (const j of [-1, 0, 1]){
            const u = j * 48 + (i % 2 ? 12 : -12), v = i * 13.5, a = 28 * Math.PI / 180;
            const x = 98 + u * Math.cos(a) - v * Math.sin(a), y = 98 + u * Math.sin(a) + v * Math.cos(a);
            if (Math.hypot(x - 98, y - 98) < 50) rolls.push([x, y, 28 + (i % 3) * 2, (i + j) % 2 !== 0]);
        }
        return [
            phFloralPlate(p, { c: '#d24a3a', c2: '#f2c14a' }),
            rolls.map(([x, y, a, cut]) => phLumpia(p, x, y, 46, 12.5, a, { cut, c: '#cf8a2e' })).join(''),
            phSaucer(p, 154, 150, 19, '#e8582a', { op: .95 }),
            phGrains(p, 154, 150, 16, { cols: ['#b8201a'], n: 12, size: .8, seed: 2 }),
        ].join('');
    },

    // Sinigang na baboy: sour tamarind broth with pork, radish, kangkong, long beans, tomato, eggplant, long chili
    ph_sinigang: p => [
        phBowl(p, { line: '#2f6aa8', R: 93 }),
        K.liquid(p, { R: 72, c: '#d2bd84', op: .95 }),
        `<g ${p.sh(.7)}>`,
        phPorkChunk(p, 76, 82, 32, -10, { seed: 1 }), phPorkChunk(p, 120, 120, 32, 20, { seed: 2 }), phPorkChunk(p, 74, 124, 30, 40, { seed: 3 }), phPorkChunk(p, 128, 84, 28, -30, { seed: 4 }),
        phRadish(p, 102, 64, 22), phRadish(p, 100, 100, 22), phRadish(p, 52, 100, 18), phRadish(p, 148, 104, 18),
        phEggplantRound(p, 96, 140, 20, 0), phEggplantRound(p, 140, 136, 18, 0),
        phTomPiece(p, 70, 60, 18, 30, { seed: 1 }), phTomPiece(p, 152, 80, 16, -40, { seed: 2 }),
        K.greenBean(p, 58, 144, 24, 30), K.greenBean(p, 120, 156, 22, -20), K.greenBean(p, 132, 56, 22, 70),
        phGreenChili(p, 104, 118, 48, -24),
        phKangkongLeaf(p, 86, 104, 40, -30), phKangkongLeaf(p, 140, 116, 36, 70), phKangkongLeaf(p, 92, 70, 34, 10), phKangkongLeaf(p, 58, 120, 30, 100), phKangkongLeaf(p, 118, 142, 32, -10),
        phKangkongStem(p, 54, 76, 22, 60), phKangkongStem(p, 146, 64, 20, 20),
        `</g>`,
        phShine(100, 100, 70, .3),
    ].join(''),

    // Tinolang manok: clear golden ginger broth, chicken pieces, chayote wedges, malunggay leaves, ginger slices
    ph_tinola: p => [
        phBowl(p, { line: '#3f8a4a', R: 93 }),
        K.liquid(p, { R: 72, c: '#e6c672', op: .9 }),
        `<g ${p.sh(.7)}>`,
        phThigh(p, 78, 84, 44, -20, { c: '#e3c088', seed: 1 }),
        phThigh(p, 126, 124, 42, 40, { c: '#e0bb82', seed: 2 }),
        phDrum(p, 74, 128, 58, 140, { c: '#e6c48e' }),
        phDrum(p, 118, 78, 60, -30, { c: '#e2c08a' }),
        phChayote(p, 100, 140, 32, 20), phChayote(p, 148, 96, 30, -60), phChayote(p, 100, 106, 28, 100), phChayote(p, 52, 100, 26, 80),
        phSpots('tin', 5, 54, 20).map(([x, y]) => `<g ${T(x, y)}><ellipse rx="5.4" ry="4.2" fill="${p.g('#f1dc9e', .3, .2)}" stroke="#c9a85a" stroke-width=".5"/><ellipse rx="3.2" ry="2.4" fill="none" stroke="#e4c47a" stroke-width=".5"/></g>`).join(''),
        `</g>`,
        `<g ${p.sh(.4)}>`, phMalunggay(p, 100, 100, 110, { n: 6, seed: 2 }), `</g>`,
    ].join(''),

    // Misua at patola: light broth with thin white misua threads, patola chunks, pork bits, spring onion
    ph_misua: p => [
        phBowl(p, { line: '#d24a3a', R: 93 }),
        K.liquid(p, { R: 72, c: '#e3cf98', op: .9 }),
        phNoodles(p, 100, 100, 132, { c: '#f7f1e2', w: 1.4, n: 46, seed: 3, outline: '#cfc29e', hi: .2 }),
        `<g ${p.sh(.6)}>`,
        phSpots('mis', 9, 52, 22).map(([x, y, a], i) => phUse(p, 'pt' + (i % 3), () => phPatola(p, 0, 0, 26, 0, { seed: i % 3 }), x, y, a)).join(''),
        `</g>`,
        phGrains(p, 100, 100, 124, { cols: ['#8a5a34', '#a06a40'], n: 60, size: 2.4, seed: 4 }),
        K.scallions(p, 100, 100, 104, { n: 20 }),
        phShine(100, 100, 70, .3),
    ].join(''),
};
