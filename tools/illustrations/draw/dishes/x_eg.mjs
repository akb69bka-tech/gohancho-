// World edition — Egypt (eg_) home cooking, hand-composed redraw of the later dishes
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// =========================================================
// local parts (xeg = redraw / egypt). Some copied from w_eg.mjs
// =========================================================
const xegBlur = (p, s = 2) => `filter="url(#${p.def('xegbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;

// evenly spread positions in a circle (or ellipse)
function xegSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xegspots' + seed), out = [];
    for (let t = 0; t < 9000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// spots inside a rectangle
function xegSpotsRect(seed, n, x0, y0, w, h, minD){
    const R = rng('xegsr' + seed), out = [];
    for (let t = 0; t < 9000 && out.length < n; t++){
        const x = x0 + R() * w, y = y0 + R() * h;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}

// ---------- vessels ----------
// round aluminium oven tray (saniya)
function xegSaniya(p, { R = 94 } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#c6cacf', .35, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="#f1f3f5" stroke-width="1.6" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(R * .88)}" fill="${p.rg('#aeb3b9', .2, .25, .62, .64)}"/>
        <circle cx="100" cy="100" r="${f(R * .88)}" fill="none" stroke="#868c93" stroke-width="1.2"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .42)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .25)},${f(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// rectangular / square glass oven dish (Pyrex) with handles
function xegPyrex(p, { w = 176, h = 132 } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.4)}><rect x="${x - 8}" y="${y + h * .3}" width="${w + 16}" height="${h * .4}" rx="10" fill="#d9e4e4" opacity=".85"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${p.rg('#e3ecec', .3, .18, .35, .3)}" opacity=".95"/></g>
        <rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="14" fill="none" stroke="#ffffff" stroke-width="1.8" opacity=".9"/>
        <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="10" fill="#cfdcdb"/>
        <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="10" fill="none" stroke="#a9bcbb" stroke-width="1"/>`;
}
// round wooden serving board
function xegBoard(p, { R = 93, c = '#c99a62' } = {}){
    const Rn = rng(p.id + 'board');
    let grain = '';
    for (let i = 0; i < 9; i++){ const y = 100 - R * .8 + i * R * .2 + (Rn() - .5) * 4; grain += `<path d="M${f(100 - R * .9)},${f(y)} Q100,${f(y + (Rn() - .5) * 10)} ${f(100 + R * .9)},${f(y + (Rn() - .5) * 6)}" stroke="${dk(c, .25)}" stroke-width="${f(.6 + Rn() * .8)}" fill="none" opacity=".35"/>`; }
    const clip = p.uid();
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .25, .25, .38, .34)}"/></g>
        <clipPath id="${clip}"><circle cx="100" cy="100" r="${R - 3}"/></clipPath><g clip-path="url(#${clip})">${grain}</g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${dk(c, .3)}" stroke-width="1.4" opacity=".6"/>
        <path d="M${f(100 - R * .72)},${f(100 - R * .4)} A${f(R * .84)},${f(R * .84)} 0 0 1 ${f(100 - R * .22)},${f(100 - R * .8)}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".35"/>`;
}
// shallow two-eared pan (tasa / iron pan). Returns the inner radius area at r = R*.9
function xegTasa(p, { R = 82, c = '#b7bcc2', inner = null, ears = true } = {}){
    const inn = inner || dk(c, .12);
    const ear = x => `<g ${p.sh(1)}><rect x="${x - 9}" y="92" width="18" height="16" rx="7" fill="none" stroke="${dk(c, .15)}" stroke-width="5"/></g><rect x="${x - 9}" y="92" width="18" height="16" rx="7" fill="none" stroke="${lt(c, .2)}" stroke-width="1.4" opacity=".7"/>`;
    return `${ears ? ear(100 - R - 4) + ear(100 + R + 4) : ''}<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .3, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${lt(c, .4)}" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(R * .9)}" fill="${p.rg(inn, .1, .3, .62, .64)}"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .42)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .25)},${f(100 - R * .8)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// unglazed clay tagen / bram (terracotta)
function xegTagen(p, { R = 93, c = '#b5643a' } = {}){
    const Rn = rng(p.id + 'tagen');
    let spk = '';
    for (let i = 0; i < 26; i++){ const a = Rn() * 6.28, d = R * (.86 + Rn() * .12); spk += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" r="${f(.5 + Rn() * .8)}" fill="${Rn() < .5 ? dk(c, .35) : lt(c, .3)}" opacity=".6"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .2, .3, .35, .3)}"/></g>${spk}
        <circle cx="100" cy="100" r="${f(R * .86)}" fill="none" stroke="${dk(c, .35)}" stroke-width="2" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(R * .85)}" fill="${p.rg(dk(c, .15), .1, .3, .62, .64)}"/>
        <path d="M${f(100 - R * .76)},${f(100 - R * .4)} A${f(R * .9)},${f(R * .9)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .84)}" stroke="#ffd9bf" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`;
}
// white soup bowl with a thin coloured line
function xegSoupBowl(p, line = '#c7a14a', { glaze = '#fbfaf6' } = {}){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="92" fill="${p.rg(glaze, .2, .16, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="88" fill="none" stroke="${line}" stroke-width="2"/>
        <circle cx="100" cy="100" r="78" fill="${p.rg('#f2eee4', .1, .25, .62, .64)}"/>`;
}
// glass tea-glass / cup seen from above (hommos el sham is sold in cups)
function xegGlass(p){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="86" fill="${p.rg('#e9eeee', .3, .2, .35, .3)}" opacity=".95"/></g>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#ffffff" stroke-width="2.4" opacity=".9"/>
        <circle cx="100" cy="100" r="78" fill="none" stroke="#b9c6c6" stroke-width="1.2"/>`;
}

// ---------- surfaces ----------
const xegShine = (cx, cy, R, op = .4) => `<path d="M${cx - R * .62},${cy - R * .25} A${R * .7},${R * .7} 0 0 1 ${cx - R * .12},${cy - R * .66}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function xegSwirl(cx, cy, R, c, w = 2.2, op = .5, turns = 1.6){
    const pts = [];
    for (let i = 0; i <= 40; i++){ const t = i / 40, a = t * 6.28 * turns, rr = R * (.18 + t * .82); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .92]); }
    return `<path d="${smooth(pts, false)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
function xegOil(p, x, y, s, { n = 10, c = '#e8b93a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// mottled sauce texture (darker/lighter blobs, blurred)
function xegMottle(p, x, y, s, c, { n = 14, seed = 1, op = .35, sy = 1 } = {}){
    const R = rng(p.id + 'mot' + seed + x);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy; const dd = smooth(ring(3 + R() * 7, 7, .5, R, 1.3, .8).map(([u, v]) => [u + cx, v + cy])); if (R() < .5) a1 += dd; else a2 += dd; }
    return `<g ${xegBlur(p, 1.6)} opacity="${op}"><path d="${a1}" fill="${dk(c, .25)}"/><path d="${a2}" fill="${lt(c, .2)}"/></g>`;
}
// long-ish rice grains on a mound
function xegRice(p, x, y, s, { sy = 1, tint = '#f7f2e4', seed = 1, n = null } = {}){
    const R = rng(p.id + 'xrice' + seed + x + y);
    const shape = smooth(ring(s / 2, 14, .07, R, 1, sy));
    const cnt = n || Math.round(s * s / 34);
    let lit = '', dim = '';
    for (let i = 0; i < cnt; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .95, gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy, b = R() * 3.14, hl = 1.6;
        const seg = `M${f(gx - Math.cos(b) * hl)} ${f(gy - Math.sin(b) * hl)}l${f(Math.cos(b) * hl * 2)} ${f(Math.sin(b) * hl * 2)}`;
        if ((gx + gy) / (s / 2) + (R() - .5) * 1.2 < .2) lit += seg; else dim += seg;
    }
    return `<g ${T(x, y)}><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .06), .15, .2, .38, .34)}"/></g>
        <path d="${dim}" stroke="${dk(tint, .3)}" stroke-width="3.1" stroke-linecap="round" opacity=".45" transform="translate(.5 .7)"/>
        <path d="${dim}" stroke="${dk(tint, .05)}" stroke-width="2.8" stroke-linecap="round"/>
        <path d="${lit}" stroke="${dk(tint, .3)}" stroke-width="3.1" stroke-linecap="round" opacity=".35" transform="translate(.5 .7)"/>
        <path d="${lit}" stroke="${lt(tint, .6)}" stroke-width="2.8" stroke-linecap="round"/></g>`;
}
// loose grains floating in soup
function xegGrains(p, x, y, s, { n = 40, c = '#f6efd8', seed = 1, L = 3, w = 2.2 } = {}){
    const R = rng(p.id + 'grn' + seed + x);
    let a1 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, b = R() * 3.14; a1 += `M${f(cx - Math.cos(b) * L / 2)} ${f(cy - Math.sin(b) * L / 2)}l${f(Math.cos(b) * L)} ${f(Math.sin(b) * L)}`; }
    return `<path d="${a1}" stroke="${dk(c, .3)}" stroke-width="${w + .7}" stroke-linecap="round" opacity=".6"/><path d="${a1}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
}

// ---------- garnish ----------
function xegHerb(p, x, y, s, { n = 18, seed = 1, c = '#3d8a2c', sz = 1 } = {}){
    const R = rng(p.id + 'herb' + seed + x + y);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, t = R() * 6.28, L = (1 + R() * 1.2) * sz; const dd = `M${f(cx)} ${f(cy)}l${f(Math.cos(t) * L)} ${f(Math.sin(t) * L)}l${f(Math.cos(t + 2) * L)} ${f(Math.sin(t + 2) * L)}`; if (R() < .5) a1 += dd; else a2 += dd; }
    return `<path d="${a1}" stroke="${c}" stroke-width="${f(2.2 * sz)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${a2}" stroke="${lt(c, .18)}" stroke-width="${f(2.2 * sz)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
}
// coriander / parsley leaf sprig (flat, lobed)
function xegSprig(p, x, y, s, r = 0, { c = '#3f8f2e' } = {}){
    const k = s / 20;
    const leaf = (a, d) => `<path transform="rotate(${a}) translate(0 ${-d})" d="M0,0 C-5,-1 -6,-6 -3,-8 C-2,-10 2,-10 3,-8 C6,-6 5,-1 0,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}><path d="M0,10 L0,-2" stroke="${lt(c, .3)}" stroke-width="1.2"/>${leaf(-55, 1)}${leaf(0, 2)}${leaf(55, 1)}</g></g>`;
}
function xegCrispy(p, x, y, s, { n = 34, seed = 1, sy = .85 } = {}){
    const R = rng(p.id + 'crsp' + seed + x);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, L = 6 + R() * 7, b = R() * 3.14;
        const seg = `M${f(cx - Math.cos(b) * L / 2)},${f(cy - Math.sin(b) * L / 2)}q${f(Math.cos(b + 1.4) * 3)},${f(Math.sin(b + 1.4) * 3)} ${f(Math.cos(b) * L)},${f(Math.sin(b) * L)}`;
        if (R() < .55) a1 += seg; else a2 += seg;
    }
    return `<g ${p.sh(.5)}><path d="${a1}" stroke="#6e3610" stroke-width="3" fill="none" stroke-linecap="round"/><path d="${a2}" stroke="#a65a1c" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="${a1}" stroke="#c98638" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-.4 -.5)"/></g>`;
}
// garlic bits (golden fried)
function xegGarlic(p, x, y, s, { n = 18, seed = 1, c = '#e8c060' } = {}){
    const R = rng(p.id + 'gar' + seed + x + y);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, t = R() * 6.28, L = .5 + R() * .8; const dd = `M${f(cx)} ${f(cy)}l${f(Math.cos(t) * L)} ${f(Math.sin(t) * L)}`; if (R() < .5) a1 += dd; else a2 += dd; }
    return `<path d="${a1}" stroke="${c}" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="${a2}" stroke="${dk(c, .2)}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
}

// ---------- vegetables ----------
function xegDiceRaw(p, x, y, s, r, kind){
    const h = s / 2;
    if (kind === 'cuc') return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${p.g('#dbeab0', .2, .15)}" stroke="#9fbf6a" stroke-width=".5"/><rect x="${-h}" y="${-h}" width="${s}" height="${f(s * .26)}" rx="${f(s * .12)}" fill="#3f7a2c"/><circle cx="${f(s * .1)}" cy="${f(s * .15)}" r="${f(s * .1)}" fill="#f3f6dc"/></g>`;
    if (kind === 'oni') return `<g ${T(x, y, r)}><rect x="${-h * .8}" y="${-h * .8}" width="${s * .8}" height="${s * .8}" rx="${f(s * .18)}" fill="${p.g('#f5efe0', .3, .15)}" stroke="#dcccaa" stroke-width=".5" opacity=".95"/></g>`;
    if (kind === 'red') return `<g ${T(x, y, r)}><rect x="${-h * .85}" y="${-h * .85}" width="${s * .85}" height="${s * .85}" rx="${f(s * .18)}" fill="${p.g('#b7598a', .3, .2)}" stroke="#7e2e5a" stroke-width=".5"/><path d="M${f(-h * .6)},${f(-h * .1)} L${f(h * .5)},${f(-h * .1)}" stroke="#f1d6e6" stroke-width="1" opacity=".8"/></g>`;
    return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${p.g('#e23a2a', .3, .25)}" stroke="#a5241a" stroke-width=".5"/><path d="M${f(-h * .4)},${f(-h * .2)} Q0,${f(h * .4)} ${f(h * .5)},${f(-h * .1)}" stroke="#f6c25a" stroke-width="${f(s * .16)}" fill="none" stroke-linecap="round" opacity=".8"/><path d="M${f(-h * .6)},${f(-h * .6)} L${f(h * .2)},${f(-h * .6)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".7"/></g>`;
}
// generic soft cube (carrot, potato, beet, cheese ...)
function xegCubeRaw(p, x, y, s, r = 0, c = '#ef7f30', { op = 1, seed = 1 } = {}){
    const R = rng(p.id + 'cube' + seed + x + y);
    const h = s / 2, j = () => (R() - .5) * s * .14;
    const pts = [[-h + j(), -h + j()], [h + j(), -h + j()], [h + j(), h + j()], [-h + j(), h + j()]];
    return `<g ${T(x, y, r)} opacity="${op}"><path d="${smooth(pts, true, .35)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .3)}" stroke-width=".55"/>
        <path d="M${f(-h * .6)},${f(-h * .5)} L${f(h * .4)},${f(-h * .55)}" stroke="${lt(c, .55)}" stroke-width="${f(Math.max(.8, s * .09))}" stroke-linecap="round" opacity=".75"/></g>`;
}
function xegTomChunkRaw(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#e2412c', .3, .25)}" stroke="#a6261a" stroke-width=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="#f37a5c" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function xegTomSlice(p, x, y, s, r = 0, { cooked = false } = {}){
    const c1 = cooked ? '#c4321f' : '#d8392a', c2 = cooked ? '#de5a3a' : '#ea6a4a';
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="${p.g(c1, .25, .25)}" stroke="#9e2418" stroke-width=".6"/><circle r="${f(s * .36)}" fill="${c2}"/>
        ${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${f(Math.cos(i * 1.257) * s * .2)}" cy="${f(Math.sin(i * 1.257) * s * .2)}" rx="${f(s * .08)}" ry="${f(s * .05)}" transform="rotate(${f(i * 72)} ${f(Math.cos(i * 1.257) * s * .2)} ${f(Math.sin(i * 1.257) * s * .2)})" fill="#f4c35c"/>`).join('')}
        <circle r="${f(s * .08)}" fill="#f19a6a"/><path d="M${f(-s * .34)},${f(-s * .16)} Q${f(-s * .2)},${f(-s * .36)} 0,${f(-s * .4)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function xegPepRing(p, x, y, s, r = 0, { c = '#5c9a32' } = {}){
    const R = rng(p.id + 'ppr' + x + y);
    const pts = ring(s / 2, 8, .18, R);
    return `<g ${T(x, y, r)}><path d="${smooth(pts)}" fill="none" stroke="${dk(c, .3)}" stroke-width="${f(s * .16 + 1)}"/><path d="${smooth(pts)}" fill="none" stroke="${c}" stroke-width="${f(s * .16)}"/></g>`;
}
// long green chili (whole)
function xegChili(p, x, y, L, r = 0, { c = '#4f9a2c' } = {}){
    const w = L * .16;
    return `<g ${T(x, y, r)}><path d="M${f(-L / 2)},0 C${f(-L * .3)},${f(-w)} ${f(L * .3)},${f(-w * 1.1)} ${f(L * .45)},${f(-w * .2)} Q${f(L * .52)},${f(w * .6)} ${f(L * .3)},${f(w * .5)} C${f(L * .1)},${f(w * .7)} ${f(-L * .3)},${f(w * .5)} ${f(-L / 2)},0Z" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .32)}" stroke-width=".6"/>
        <path d="M${f(-L / 2)},0 q${f(-L * .06)},${f(-w * .2)} ${f(-L * .1)},${f(-w * .9)}" stroke="#6f8a3a" stroke-width="${f(Math.max(1.4, w * .45))}" fill="none" stroke-linecap="round"/>
        <path d="M${f(-L * .3)},${f(-w * .4)} Q0,${f(-w * .8)} ${f(L * .3)},${f(-w * .5)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// zucchini round (or half-moon)
function xegZucRaw(p, x, y, s, r = 0, { half = false, cooked = false } = {}){
    const skin = cooked ? '#5d8a34' : '#3f7a2c', fl = cooked ? '#e3e2a8' : '#eef2cc';
    if (half) return `<g ${T(x, y, r)}><path d="M${-s / 2},0 A${s / 2},${s / 2} 0 0 1 ${s / 2},0Z" fill="${skin}"/><path d="M${f(-s / 2 + 1.4)},0 A${f(s / 2 - 1.4)},${f(s / 2 - 1.4)} 0 0 1 ${f(s / 2 - 1.4)},0Z" fill="${p.g(fl, .2, .15)}"/>
        <path d="M${f(-s * .22)},0 A${f(s * .22)},${f(s * .22)} 0 0 1 ${f(s * .22)},0" stroke="#c9d58a" stroke-width="1" fill="none"/></g>`;
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="${skin}"/><circle r="${f(s / 2 - 1.4)}" fill="${p.rg(fl, .2, .15)}"/>
        <circle r="${f(s * .22)}" fill="none" stroke="#c9d58a" stroke-width="1"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="${f(Math.cos(i * 1.26) * s * .22)}" cy="${f(Math.sin(i * 1.26) * s * .22)}" r=".7" fill="#f8f8e2"/>`).join('')}</g>`;
}
function xegPeaRaw(p, x, y, s, { c = '#6fae34' } = {}){
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="${p.rg(c, .3, .25, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".5"/><circle cx="${f(x - s * .15)}" cy="${f(y - s * .17)}" r="${f(s * .13)}" fill="#fff" opacity=".7"/>`;
}
function xegChickpeaRaw(p, x, y, s){
    return `<g ${T(x, y)}><circle r="${s / 2}" fill="${p.rg('#e3be7c', .3, .25, .35, .32)}" stroke="#a9813f" stroke-width=".5"/><path d="M${f(-s * .1)},${f(-s * .45)} Q${f(s * .1)},${f(-s * .1)} ${f(-s * .05)},${f(s * .1)}" stroke="#b8904c" stroke-width=".6" fill="none"/><circle cx="${f(-s * .16)}" cy="${f(-s * .18)}" r="${f(s * .1)}" fill="#fff" opacity=".6"/></g>`;
}
function xegLentils(p, x, y, s, { n = 40, seed = 1, c = '#7a5230', sy = 1 } = {}){
    const R = rng(p.id + 'len' + seed + x);
    let a = '', b = '';
    for (let i = 0; i < n; i++){ const an = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(an) * d, cy = y + Math.sin(an) * d * sy, t = R() * 3.14; const e = `M${f(cx - Math.cos(t) * .4)} ${f(cy - Math.sin(t) * .4)}l${f(Math.cos(t) * .8)} ${f(Math.sin(t) * .8)}`; if (R() < .5) a += e; else b += e; }
    return `<path d="${a}${b}" stroke="${dk(c, .3)}" stroke-width="3.8" stroke-linecap="round"/><path d="${a}" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .15)}" stroke-width="3" stroke-linecap="round"/>`;
}
function xegPenneRaw(p, x, y, s, r = 0, { c = '#f0d28a' } = {}){
    const w = s * .36;
    return `<g ${T(x, y, r)}><path d="M${f(-s / 2 + w * .3)},${f(-w / 2)} L${f(s / 2)},${f(-w / 2)} L${f(s / 2 - w * .3)},${f(w / 2)} L${f(-s / 2)},${f(w / 2)}Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M${f(-s / 2 + w * .5)},${f(-w * .2)} L${f(s / 2 - w * .4)},${f(-w * .2)}" stroke="${dk(c, .12)}" stroke-width=".6"/><path d="M${f(-s * .3)},${f(-w * .32)} L${f(s * .2)},${f(-w * .32)}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".7"/></g>`;
}
function xegPotSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .44)}" fill="${p.rg('#ebc778', .25, .25)}" stroke="#b98a3a" stroke-width=".7"/><ellipse rx="${f(s * .36)}" ry="${f(s * .3)}" fill="none" stroke="#f6dfa0" stroke-width="1" opacity=".8"/></g>`;
}
function xegFul(p, x, y, s, r = 0, { c = '#8a5a32' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .36)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/><path d="M${f(s * .3)},${f(-s * .14)} Q${f(s * .42)},0 ${f(s * .3)},${f(s * .14)}" stroke="#3e220c" stroke-width="1.1" fill="none"/><ellipse cx="${f(-s * .14)}" cy="${f(-s * .12)}" rx="${f(s * .14)}" ry="${f(s * .06)}" fill="#fff" opacity=".5"/></g>`;
}
function xegVermicelli(p, x, y, s, { n = 40, seed = 1, sy = 1, c1 = '#a8601f', c2 = '#c98a3c' } = {}){
    const R = rng(p.id + 'verm' + seed + x);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, L = 5 + R() * 6, b = R() * 3.14; const seg = `M${f(cx - Math.cos(b) * L / 2)},${f(cy - Math.sin(b) * L / 2)}q${f(Math.cos(b + 1.5) * 1.5)},${f(Math.sin(b + 1.5) * 1.5)} ${f(Math.cos(b) * L)},${f(Math.sin(b) * L)}`; if (R() < .5) a1 += seg; else a2 += seg; }
    return `<path d="${a1}" stroke="${c1}" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="${a2}" stroke="${c2}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
}
function xegMushSlice(p, x, y, s, r = 0, { c = '#e9d9bd', edge = '#a07a52' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><path d="M-10,0 C-10,-7 -5,-9 0,-9 C5,-9 10,-7 10,0 C10,2 7,2 4,1.5 L3.5,8 Q0,9.5 -3.5,8 L-4,1.5 C-7,2 -10,2 -10,0Z" fill="${p.g(c, .25, .2)}" stroke="${edge}" stroke-width="1.1"/>
        <path d="M-8,-.5 C-7,-5 -3,-7 0,-7 C3,-7 7,-5 8,-.5" stroke="${dk(c, .18)}" stroke-width=".8" fill="none" opacity=".7"/>
        <path d="M-5,-5 Q-1,-7.4 3,-6.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function xegCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f(-s / 2 + s * .18)}" y="${f(-s / 2 + s * .18)}" width="${f(s * .5)}" height="${f(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
// shredded chicken (fibrous strips)
function xegShred(p, x, y, s, r = 0, { c = '#f1dfbf', seed = 1 } = {}){
    const R = rng(p.id + 'shrd' + seed + x + y);
    const pts = ring(s / 2, 9, .35, R, 1.2, .62);
    let fib = '';
    for (let j = 0; j < 4; j++){ const o = (j - 1.5) * s * .1, L = s * (.5 + R() * .35); fib += `M${f(-L / 2)},${f(o)} q${f(L / 2)},${f((R() - .5) * 2.4)} ${f(L)},${f((R() - .5) * 1.6)}`; }
    return `<g ${T(x, y, r)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .25)}" stroke-width=".6"/><path d="${fib}" stroke="${dk(c, .2)}" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${f(-s * .3)},${f(-s * .14)} Q0,${f(-s * .26)} ${f(s * .26)},${f(-s * .16)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function xegBeef(p, x, y, s, r = 0, { c = '#6e3a1e', seed = 1 } = {}){
    const R = rng(p.id + 'bf' + seed + x + y);
    const pts = ring(s / 2, 5, .2, R, 1.1, .9, .6);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .35)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .3)},${f(-s * .05)} Q0,${f(-s * .15)} ${f(s * .3)},${f(s * .02)}" stroke="${dk(c, .35)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f(-s * .26)},${f(-s * .22)} Q${f(-s * .05)},${f(-s * .34)} ${f(s * .14)},${f(-s * .26)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// fried fish (golden crust, scored), copied from w_eg
function xegFish(p, x, y, L, r = 0, { c = '#b8722e' } = {}){
    const h = L * .23;
    const body = `M${-L * .5},0 C${-L * .42},${-h * .95} ${L * .12},${-h * 1.1} ${L * .32},${-h * .35} L${L * .5},${-h * .95} Q${L * .46},0 ${L * .5},${h * .95} L${L * .32},${h * .35} C${L * .12},${h * 1.1} ${-L * .42},${h * .95} ${-L * .5},0Z`;
    let cuts = '';
    for (let i = 0; i < 3; i++){ const cx = -L * .16 + i * L * .14; cuts += `<path d="M${f(cx + h * .25)},${f(-h * .62)} Q${f(cx - h * .05)},0 ${f(cx + h * .25)},${f(h * .62)}" stroke="#5e3010" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${f(cx + h * .32)},${f(-h * .55)} Q${f(cx + h * .03)},0 ${f(cx + h * .32)},${f(h * .55)}" stroke="#f0c27a" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}>
        <g ${p.crumb(.7)}><path d="${body}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g></g>
        <path d="M${L * .32},${-h * .35} L${L * .5},${-h * .95} Q${L * .46},0 ${L * .5},${h * .95} L${L * .32},${h * .35}Z" fill="${dk(c, .3)}" opacity=".5"/>
        <path d="M${-L * .3},${-h * .78} Q${-L * .27},0 ${-L * .3},${h * .78}" stroke="${dk(c, .45)}" stroke-width="1.2" fill="none" opacity=".7"/>
        ${cuts}
        <circle cx="${f(-L * .4)}" cy="${f(-h * .18)}" r="${f(h * .17)}" fill="#efe2c8" stroke="#5e3010" stroke-width=".7"/><circle cx="${f(-L * .4)}" cy="${f(-h * .18)}" r="${f(h * .08)}" fill="#2a1406"/>
        <path d="M${-L * .25},${-h * .68} Q0,${-h * .95} ${L * .22},${-h * .5}" stroke="#ffe6b8" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// white fish chunk / steak in sauce (flaky)
function xegFishChunk(p, x, y, s, r = 0, { c = '#f3eadb', skin = null, seed = 1 } = {}){
    const R = rng(p.id + 'fch' + seed + x + y);
    const pts = ring(s / 2, 9, .22, R, 1.2, .85);
    let flakes = '';
    for (let i = 0; i < 4; i++){ const xx = -s * .32 + i * s * .2; flakes += `M${f(xx)},${f(-s * .3)} q${f(s * .08)},${f(s * .3)} 0,${f(s * .6)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        ${skin ? `<path d="${smooth(pts.slice(0, 5).concat([[pts[4][0] * .8, pts[4][1] * .8], [pts[0][0] * .8, pts[0][1] * .8]]), true, .6)}" fill="${skin}" opacity=".8"/>` : ''}
        <path d="${flakes}" stroke="${dk(c, .18)}" stroke-width=".8" fill="none" opacity=".7"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .05)},${f(-s * .36)} ${f(s * .2)},${f(-s * .28)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// nuts / raisins for rice toppings
function xegNutRaw(p, x, y, s, r = 0, kind = 'almond'){
    if (kind === 'almond') return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .3)}" fill="${p.g('#f0d8a8', .3, .3)}" stroke="#b88a4a" stroke-width=".5"/><ellipse rx="${f(s * .3)}" ry="${f(s * .12)}" fill="#e2b874" opacity=".7"/></g>`;
    if (kind === 'cashew') return `<g ${T(x, y, r, s / 14)}><path d="M-6,-2 C-6,-6 2,-7 5,-3 C7,0 6,5 3,5 C1,5 1,2 -1,1 C-3,0 -6,2 -6,-2Z" fill="${p.g('#efcc8a', .3, .3)}" stroke="#b5874a" stroke-width=".5"/></g>`;
    if (kind === 'pine') return `<g ${T(x, y, r)}><ellipse rx="${f(s * .3)}" ry="${f(s * .5)}" fill="${p.g('#f2dca4', .3, .25)}" stroke="#c09a58" stroke-width=".4"/></g>`;
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 6, .35, rng(p.id + 'rai' + x + y), 1.2, .8))}" fill="${p.g('#5a2a24', .3, .25)}" stroke="#2e120e" stroke-width=".4"/><circle cx="${f(-s * .12)}" cy="${f(-s * .1)}" r="${f(s * .1)}" fill="#fff" opacity=".4"/></g>`;
}


// pie wedge of a cut round loaf (hawawshi): crusty top, meat layer along the cut edges
function xegLoafWedge(p, R0, a0, a1, ex, { seed = 1 } = {}){
    const R = rng(p.id + 'lw' + seed);
    const am = (a0 + a1) / 2, ox = 100 + Math.cos(am) * ex, oy = 100 + Math.sin(am) * ex;
    const P = (a, r) => [ox + Math.cos(a) * r, oy + Math.sin(a) * r];
    const [x0, y0] = P(a0, R0), [x1, y1] = P(a1, R0);
    const d = `M${f(ox)},${f(oy)} L${f(x0)},${f(y0)} A${R0},${R0} 0 0 1 ${f(x1)},${f(y1)}Z`;
    const clip = p.uid();
    let blis = '', bran = '';
    for (let i = 0; i < 6; i++){ const a = a0 + R() * (a1 - a0), r = R0 * (.3 + R() * .6), [bx, by] = P(a, r); blis += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(4 + R() * 6)}" ry="${f(3 + R() * 4)}" fill="#7a3f14" opacity="${f(.35 + R() * .3)}"/>`; }
    for (let i = 0; i < 16; i++){ const a = a0 + R() * (a1 - a0), r = R0 * (.15 + R() * .8), [bx, by] = P(a, r); bran += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(.5 + R() * .7)}" fill="${R() < .5 ? '#8a5020' : '#f1d6a6'}" opacity=".85"/>`; }
    const edge = `M${f(x0)},${f(y0)} L${f(ox)},${f(oy)} L${f(x1)},${f(y1)}`;
    return `<g ${p.sh(1)}><path d="${d}" fill="${p.rg('#b8722e', .3, .35, .4, .36)}" stroke="#6a3812" stroke-width=".8" stroke-linejoin="round"/></g>
        <clipPath id="${clip}"><path d="${d}"/></clipPath><g clip-path="url(#${clip})"><g ${xegBlur(p, 2)}>${blis}</g>${bran}
        <path d="${edge}" stroke="#ecc994" stroke-width="15" fill="none" stroke-linejoin="round"/>
        <path d="${edge}" stroke="#6e2e14" stroke-width="9" fill="none" stroke-linejoin="round"/>
        <path d="${edge}" stroke="#a85a2e" stroke-width="2" fill="none" stroke-linejoin="round" stroke-dasharray="2 3"/>
        <path d="${edge}" stroke="#3f8a2c" stroke-width="1.6" fill="none" stroke-dasharray="1 5" stroke-linecap="round"/></g>
        <path d="M${f(P(am - .25, R0 * .78)[0])},${f(P(am - .25, R0 * .78)[1])} A${f(R0 * .78)},${f(R0 * .78)} 0 0 1 ${f(P(am + .1, R0 * .78)[0])},${f(P(am + .1, R0 * .78)[1])}" stroke="#ffe6bc" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// fried eggplant round (purple skin rim, golden flesh)
function xegEggRoundRaw(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'egr' + seed + x + y);
    const pts = ring(s / 2, 10, .1, R, 1.08, .94);
    let seeds = '';
    for (let i = 0; i < 9; i++){ const a = i / 9 * 6.28 + R(), d = s * (.12 + R() * .16); seeds += `M${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)}l${f(Math.cos(a) * .8)} ${f(Math.sin(a) * .8)}`; }
    seeds = `<path d="${seeds}" stroke="#6e4218" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts)}" fill="#3f1d48" stroke="#22102a" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .86, b * .86]))}" fill="${p.rg('#c98a3e', .25, .3, .4, .36)}"/>
        <ellipse cx="${f(s * .08)}" cy="${f(s * .05)}" rx="${f(s * .22)}" ry="${f(s * .16)}" fill="#9a5a22" opacity=".45"/>${seeds}
        <path d="M${f(-s * .28)},${f(-s * .14)} Q${f(-s * .14)},${f(-s * .32)} ${f(s * .1)},${f(-s * .32)}" stroke="#fff3d6" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// breaded flattened chicken cutlet
function xegCutlet(p, x, y, w, h, r = 0, { seed = 1, c = '#d6923c' } = {}){
    const R = rng(p.id + 'cut' + seed);
    const pts = ring(1, 12, .14, R, w / 2, h / 2);
    let spots = '';
    for (let i = 0; i < 8; i++) spots += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .6)}" rx="${f(3 + R() * 6)}" ry="${f(2 + R() * 4)}" fill="#a85e1c" opacity="${f(.25 + R() * .25)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><g ${p.rough(2.2, .14)}><g ${p.crumb(.85)}><path d="${smooth(pts)}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .4)}" stroke-width=".9"/></g></g></g>
        <g ${xegBlur(p, 1.4)}>${spots}</g>
        <path d="M${f(-w * .32)},${f(-h * .18)} Q${f(-w * .1)},${f(-h * .38)} ${f(w * .2)},${f(-h * .32)}" stroke="#ffe7b8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// liver strip (glossy dark red-brown)
function xegLiverRaw(p, x, y, L, r = 0, { seed = 1, c = '#6e2c1e' } = {}){
    const R = rng(p.id + 'liv' + seed + x + y);
    const pts = ring(1, 9, .22, R, L / 2, L * .24);
    return `<g ${T(x, y, r)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".6"/>
        <ellipse cx="${f(L * .05)}" cy="${f(L * .03)}" rx="${f(L * .25)}" ry="${f(L * .07)}" fill="${dk(c, .35)}" opacity=".35"/>
        <path d="M${f(-L * .3)},${f(-L * .07)} Q0,${f(-L * .15)} ${f(L * .26)},${f(-L * .08)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// grilled marinated chicken cube (shish tawook)
function xegTawook(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'taw' + seed + x + y);
    const pts = ring(s / 2, 7, .2, R, 1.05, .95, .4);
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .6)}" rx="${f(s * (.08 + R() * .1))}" ry="${f(s * (.05 + R() * .06))}" fill="#5a2a0c" opacity="${f(.4 + R() * .3)}"/>`;
    ch = `<g ${xegBlur(p, .7)}>${ch}</g>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .45)}" fill="${p.g('#e3a245', .3, .32)}" stroke="#9a5a1c" stroke-width=".6"/></g>${ch}
        <ellipse cx="${f(s * .1)}" cy="${f(s * .12)}" rx="${f(s * .28)}" ry="${f(s * .18)}" fill="#b8641c" opacity=".35"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .16)},${f(-s * .3)}" stroke="#fff3d0" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}

// roasted chicken leg quarter (copied from w_eg)
function xegLeg(p, x, y, s, r = 0, { c = '#c77a2e' } = {}){
    const k = s / 60;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1)}>
        <path d="M14,-4 L27,-2 Q31,-4 32,0 Q31,4 27,2 L14,5Z" fill="#f2e6cc" stroke="#c8b48c" stroke-width=".8"/>
        <path d="M-26,-6 C-28,-18 -12,-24 0,-18 C8,-15 12,-9 16,-5 L16,6 C12,10 6,16 -4,18 C-18,20 -30,10 -26,-6Z" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .4)}" stroke-width=".9"/></g>
        <path d="M-20,-8 C-18,-14 -8,-17 0,-14" stroke="#fff3d6" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="-8" cy="4" rx="9" ry="6" fill="${dk(c, .35)}" opacity=".35"/><ellipse cx="6" cy="-6" rx="5" ry="3" fill="${dk(c, .45)}" opacity=".35"/>
        <path d="M-14,8 Q-6,12 4,9" stroke="${dk(c, .4)}" stroke-width="1" fill="none" opacity=".5"/></g>`;
}
// black-eyed pea
function xegBlackEyeRaw(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .36)}" fill="${p.g('#efe0bc', .3, .28)}" stroke="#b39a68" stroke-width=".5"/><ellipse cx="${f(s * .06)}" cy="${f(s * .04)}" rx="${f(s * .15)}" ry="${f(s * .1)}" fill="#2a1a12"/><ellipse cx="${f(s * .06)}" cy="${f(s * .04)}" rx="${f(s * .06)}" ry="${f(s * .03)}" fill="#e9dcc0"/><ellipse cx="${f(-s * .2)}" cy="${f(-s * .14)}" rx="${f(s * .12)}" ry="${f(s * .05)}" fill="#fff" opacity=".6"/></g>`;
}
// sogo sausage coin (cut, with fat specks)
function xegSogoRaw(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'sogo' + seed + x + y);
    let sp = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = R() * s * .3; sp += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(.6 + R() * .8)}" fill="#e8b6a0" opacity=".8"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .44)}" fill="#5a1e12"/></g><ellipse rx="${f(s / 2 - 1.6)}" ry="${f(s * .44 - 1.6)}" fill="${p.rg('#9a3a24', .25, .3)}"/>${sp}
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .12)},${f(-s * .32)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// grilled lamb chop: bone handle + eye of meat with fat rim and grill marks
function xegChop(p, x, y, s, r = 0, { seed = 1 } = {}){
    const k = s / 40;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1)}>
        <path d="M6,-3 L30,-2.4 Q34,-2.6 34,0 Q34,2.6 30,2.4 L6,3Z" fill="${p.g('#f3e8d2', .2, .2)}" stroke="#bfa98a" stroke-width=".8"/>
        <path d="M-18,-4 C-20,-15 -6,-18 4,-12 C10,-8 12,-2 10,4 C8,12 -4,15 -12,12 C-18,10 -17,4 -18,-4Z" fill="#e9cfa2" stroke="#9a6a3a" stroke-width=".8"/></g>
        <path d="M-14,-4 C-15,-12 -5,-14 2,-9 C7,-6 8,-1 6,3 C4,9 -4,11 -9,9 C-13,7 -13,2 -14,-4Z" fill="${p.g('#8a4a26', .3, .3)}" stroke="#5a2a10" stroke-width=".6"/>
        <path d="M-14,-6 L-2,-12 M-14,0 L4,-9 M-12,6 L6,-3 M-6,9 L6,3" stroke="#3a1a08" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
        <path d="M-15,-9 Q-10,-15 -2,-14" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}

// cauliflower floret (raw/pickled cream, or fried golden)
function xegCauli(p, x, y, s, r = 0, { c = '#f1e6c4', fried = false, seed = 1 } = {}){
    const R = rng(p.id + 'cau' + seed + x + y);
    const k = s / 20;
    let b = '';
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.28, d = i === 0 ? 0 : 4.6 + R() * 1.4; b += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d - 1.5)}" r="${f(3.6 + R() * 1.2)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .25)}" stroke-width=".5"/>`; }
    const stem = `<path d="M-3,3 L-3.5,10 Q0,11.5 3.5,10 L3,3Z" fill="${fried ? dk(c, .05) : '#e7e9c4'}" stroke="${dk(c, .25)}" stroke-width=".5"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${fried ? `<g ${p.crumb(.8)}><g ${p.rough(1.2, .25)}>${stem}${b}</g></g>` : stem + b}</g>
        <path d="M-6,-6 Q-2,-9 2,-8" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// finger eggplant, slit and stuffed (pickled)
function xegFingerEgg(p, x, y, L, r = 0){
    const w = L * .3;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="M${f(-L / 2)},0 C${f(-L / 2)},${f(-w * .6)} ${f(-L * .1)},${f(-w * .55)} ${f(L * .32)},${f(-w * .45)} Q${f(L * .5)},0 ${f(L * .32)},${f(w * .45)} C${f(-L * .1)},${f(w * .55)} ${f(-L / 2)},${f(w * .6)} ${f(-L / 2)},0Z" fill="${p.g('#4a2a5a', .3, .25)}" stroke="#24102c" stroke-width=".7"/></g>
        <path d="M${f(-L * .38)},${f(-w * .05)} Q0,${f(-w * .32)} ${f(L * .3)},${f(-w * .05)} Q0,${f(w * .22)} ${f(-L * .38)},${f(-w * .05)}Z" fill="#c9b07a"/>
        <path d="M${f(-L * .32)},${f(-w * .08)} Q0,${f(-w * .22)} ${f(L * .24)},${f(-w * .08)}" stroke="#c4321f" stroke-width="${f(w * .2)}" fill="none" stroke-linecap="round" stroke-dasharray="3 2"/>
        <path d="M${f(-L * .3)},${f(-w * .02)} Q0,${f(-w * .14)} ${f(L * .22)},${f(-w * .02)}" stroke="#3f8a2c" stroke-width="${f(w * .12)}" fill="none" stroke-linecap="round" stroke-dasharray="2 3"/>
        <path d="M${f(L * .3)},${f(-w * .5)} Q${f(L * .4)},${f(-w * .2)} ${f(L * .44)},0 Q${f(L * .4)},${f(w * .2)} ${f(L * .3)},${f(w * .5)} L${f(L * .38)},${f(w * .2)} L${f(L * .58)},${f(w * .1)} L${f(L * .58)},${f(-w * .1)} L${f(L * .38)},${f(-w * .2)}Z" fill="${p.g('#6f8a3a', .25, .3)}" stroke="#3e5220" stroke-width=".6"/>
        <path d="M${f(-L * .36)},${f(-w * .4)} Q${f(-L * .1)},${f(-w * .52)} ${f(L * .18)},${f(-w * .42)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// rocket (gargir) leaf: long, deeply lobed
function xegRocketRaw(p, x, y, s, r = 0, { c = '#3f7f2a' } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><path d="M-15,0 C-13,-3 -10,-2 -9,-5 C-8,-8 -5,-6 -3,-4 C-2,-8 1,-9 3,-6 C4,-9 8,-9 9,-6 C12,-7 15,-4 15,0 C15,4 12,6 9,5 C8,8 4,8 3,5 C1,8 -2,7 -3,4 C-5,6 -8,7 -9,4 C-10,2 -13,3 -15,0Z" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        <path d="M-15,0 L14,0" stroke="${lt(c, .45)}" stroke-width="1" fill="none"/></g>`;
}
// roasted pepper strip (charred, soft)
function xegRoastStripRaw(p, x, y, L, r = 0, { c = '#4f8a2c', seed = 1 } = {}){
    const R = rng(p.id + 'rst' + seed + x + y);
    const w = L * .42;
    const pts = [[-L / 2, -w * .3], [-L * .2, -w * .5], [L * .2, -w * .45], [L / 2, -w * .2], [L / 2, w * .2], [L * .2, w * .5], [-L * .2, w * .45], [-L / 2, w * .3]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    let ch = '';
    for (let i = 0; i < 3; i++) ch += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * w * .4)}" rx="${f(2 + R() * 4)}" ry="${f(1.2 + R() * 1.6)}" fill="#2a1406" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/>${ch}
        <path d="M${f(-L * .35)},${f(-w * .2)} Q0,${f(-w * .4)} ${f(L * .3)},${f(-w * .2)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// crumbled white cheese
function xegCrumbleRaw(p, x, y, s, r = 0, { seed = 1, c = '#fbf8ee' } = {}){
    const R = rng(p.id + 'crb' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 7, .45, R, 1.1, .9), true, .5)}" fill="${p.g(c, .2, .12)}" stroke="#ddd6c2" stroke-width=".5"/><circle cx="${f(s * .1)}" cy="${f(s * .05)}" r=".7" fill="#e6dfca"/></g>`;
}
// cut green bean (thicker than kit's)
function xegBeanRaw(p, x, y, L, r = 0, { c = '#4f9a34' } = {}){
    const w = L * .24;
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${f(w)}" rx="${f(w / 2)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .32)}" stroke-width=".55"/>
        <path d="M${f(-L * .4)},${f(w * .15)} L${f(L * .4)},${f(w * .15)}" stroke="${dk(c, .2)}" stroke-width=".6" opacity=".7"/><path d="M${f(-L * .35)},${f(-w * .22)} L${f(L * .3)},${f(-w * .22)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".55"/></g>`;
}
// dill frond (feathery)
function xegDill(p, x, y, s, r = 0, { c = '#4f8a3a' } = {}){
    let d = `M0,${f(s / 2)} L0,${f(-s / 2)}`;
    for (let i = 0; i < 5; i++){ const yy = -s / 2 + i * s / 5 + 2; d += ` M0,${f(yy)} l${f(-s * .22)},${f(-s * .12)} M0,${f(yy)} l${f(s * .22)},${f(-s * .12)}`; }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${c}" stroke-width="1" fill="none" stroke-linecap="round"/></g>`;
}

// sprouted fava bean (ful nabit): pale skin, little white sprout
function xegFulNabit(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${f(s * .42)},${f(-s * .05)} q${f(s * .2)},${f(-s * .05)} ${f(s * .32)},${f(-s * .25)}" stroke="#f6f0dc" stroke-width="${f(s * .12)}" fill="none" stroke-linecap="round"/>
        <ellipse rx="${s / 2}" ry="${f(s * .36)}" fill="${p.g('#c9b27a', .28, .3)}" stroke="#8a7440" stroke-width=".5"/><path d="M${f(s * .32)},${f(-s * .14)} Q${f(s * .44)},0 ${f(s * .32)},${f(s * .14)}" stroke="#6a5226" stroke-width="1" fill="none"/>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .12)}" rx="${f(s * .16)}" ry="${f(s * .06)}" fill="#fff" opacity=".55"/></g>`;
}
// gelatinous trotter meat piece (pale, glossy, with skin)
function xegTrotter(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'trot' + seed + x + y);
    const pts = ring(s / 2, 10, .45, R, 1.3, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g('#e2c592', .3, .28)}" stroke="#a8845a" stroke-width=".6" opacity=".95"/></g>
        <path d="${smooth(pts.slice(0, 5).map(([a, b]) => [a * .9, b * .9]), false)}" stroke="#9a7048" stroke-width="${f(s * .14)}" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .45 + 2, b * .45 + 1]), true, .8)}" fill="#f4e6c6" opacity=".7"/>
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .1)},${f(-s * .34)} ${f(s * .2)},${f(-s * .26)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// oat flakes floating
function xegOats(p, x, y, s, { n = 40, seed = 1 } = {}){
    const R = rng(p.id + 'oat' + seed + x);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, t = R() * 3.14, L = 1 + R() * 1.4; const e = `M${f(cx - Math.cos(t) * L)} ${f(cy - Math.sin(t) * L)}l${f(Math.cos(t) * L * 2)} ${f(Math.sin(t) * L * 2)}`; if (R() < .5) a1 += e; else a2 += e; }
    return `<path d="${a1}${a2}" stroke="#b89a62" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="${a1}" stroke="#ecdcb2" stroke-width="3.2" stroke-linecap="round"/><path d="${a2}" stroke="#dcc490" stroke-width="3.2" stroke-linecap="round"/>`;
}

// ---------- reuse: identical small parts are defined once and placed with <use> (keeps the SVG small) ----------
function xegUse(p, key, make, x, y, r = 0, k = 1, extra = ''){
    const id = p.def('use' + key, id => `<g id="${id}">${make()}</g>`);
    return `<use href="#${id}" ${T(x, y, r, k)}${extra}/>`;
}
const xegPea = (p, x, y, s, { c = '#6fae34' } = {}) => xegUse(p, 'pea' + c, () => xegPeaRaw(p, 0, 0, 10, { c }), x, y, 0, s / 10);
const xegChickpea = (p, x, y, s) => xegUse(p, 'chk', () => xegChickpeaRaw(p, 0, 0, 10), x, y, 0, s / 10);
const xegBlackEye = (p, x, y, s, r = 0) => xegUse(p, 'be', () => xegBlackEyeRaw(p, 0, 0, 10, 0), x, y, r, s / 10);
const xegDice = (p, x, y, s, r, kind) => xegUse(p, 'dice' + kind, () => xegDiceRaw(p, 0, 0, 10, 0, kind), x, y, r, s / 10);
const xegCube = (p, x, y, s, r = 0, c = '#ef7f30', { op = 1, seed = 1 } = {}) => xegUse(p, 'cube' + c + (seed % 3), () => xegCubeRaw(p, 0, 0, 10, 0, c, { seed: seed % 3 }), x, y, r, s / 10, op < 1 ? ` opacity="${op}"` : '');
const xegPenne = (p, x, y, s, r = 0, { c = '#f0d28a' } = {}) => xegUse(p, 'pen' + c, () => xegPenneRaw(p, 0, 0, 20, 0, { c }), x, y, r, s / 20);
const xegZuc = (p, x, y, s, r = 0, { half = false, cooked = false } = {}) => xegUse(p, 'zuc' + half + cooked, () => xegZucRaw(p, 0, 0, 20, 0, { half, cooked }), x, y, r, s / 20);
const xegBean = (p, x, y, L, r = 0, { c = '#4f9a34' } = {}) => xegUse(p, 'bean' + c, () => xegBeanRaw(p, 0, 0, 26, 0, { c }), x, y, r, L / 26);
const xegRocket = (p, x, y, s, r = 0, { c = '#3f7f2a' } = {}) => xegUse(p, 'rk' + c, () => xegRocketRaw(p, 0, 0, 30, 0, { c }), x, y, r, s / 30);
const xegSogo = (p, x, y, s, r = 0, { seed = 1 } = {}) => xegUse(p, 'sogo' + (seed % 3), () => xegSogoRaw(p, 0, 0, 20, 0, { seed: seed % 3 }), x, y, r, s / 20);
const xegPep = (p, x, y, s, r = 0, { c = '#3f8f2f', strip = false } = {}) => xegUse(p, 'pep' + c + strip, () => K.pepperPiece(p, 0, 0, 20, 0, { c, strip }), x, y, r, s / 20);
const xegOnion = (p, x, y, s, r = 0, { c = '#ead39c' } = {}) => xegUse(p, 'oni' + c, () => K.onion(p, 0, 0, 20, 0, { c }), x, y, r, s / 20);
const xegMac = (p, x, y, s, r = 0, { c = '#f1d58c' } = {}) => xegUse(p, 'mac' + c, () => K.macaroni(p, 0, 0, 12, 0, { c }), x, y, r, s / 12);
const xegEggRound = (p, x, y, s, r = 0, { seed = 1 } = {}) => xegUse(p, 'egr' + (seed % 4), () => xegEggRoundRaw(p, 0, 0, 34, 0, { seed: seed % 4 }), x, y, r, s / 34);
const xegTomChunk = (p, x, y, s, r = 0, { seed = 1 } = {}) => xegUse(p, 'tmc' + (seed % 3), () => xegTomChunkRaw(p, 0, 0, 20, 0, { seed: seed % 3 }), x, y, r, s / 20);
const xegLiver = (p, x, y, L, r = 0, { seed = 1, c = '#6e2c1e' } = {}) => xegUse(p, 'liv' + c + (seed % 3), () => xegLiverRaw(p, 0, 0, 32, 0, { seed: seed % 3, c }), x, y, r, L / 32);
const xegCrumble = (p, x, y, s, r = 0, { seed = 1, c = '#fbf8ee' } = {}) => xegUse(p, 'crb' + c + (seed % 4), () => xegCrumbleRaw(p, 0, 0, 16, 0, { seed: seed % 4, c }), x, y, r, s / 16);
const xegRoastStrip = (p, x, y, L, r = 0, { c = '#4f8a2c', seed = 1 } = {}) => xegUse(p, 'rst' + c + (seed % 2), () => xegRoastStripRaw(p, 0, 0, 44, 0, { c, seed: seed % 2 }), x, y, r, L / 44);
const xegNut = (p, x, y, s, r = 0, kind = 'almond') => xegUse(p, 'nut' + kind, () => xegNutRaw(p, 0, 0, 10, 0, kind), x, y, r, s / 10);
// shredded cabbage mound, strands merged by colour
function xegCabbage(p, x, y, s, { seed = 1, n = 200 } = {}){
    const R = rng(p.id + 'xcab' + seed);
    const cols = ['#fbfdf2', '#e2efc0', '#c9e09a', '#a8cf72'], d = ['', '', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, dd = Math.sqrt(R()) * s * .46, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, ang = R() * Math.PI, L = 7 + R() * 10;
        const x1 = cx - Math.cos(ang) * L / 2, y1 = cy - Math.sin(ang) * L / 2;
        d[Math.floor(R() * 4)] += `M${f(x1)},${f(y1)}q${f(Math.cos(ang + 1.3) * 2.4)},${f(Math.sin(ang + 1.3) * 2.4)} ${f(Math.cos(ang) * L)},${f(Math.sin(ang) * L)}`;
    }
    return `<g ${p.sh(.6)}><circle cx="${x}" cy="${y}" r="${f(s * .49)}" fill="${p.rg('#e6f0cc', .3, .12)}"/>${d.map((dd, i) => `<path d="${dd}" stroke="${dk(cols[i], .14)}" stroke-width="2.3" fill="none" stroke-linecap="round" opacity=".5"/><path d="${dd}" stroke="${cols[i]}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
}

// =========================================================
export default {
    // hawawshi: round baladi loaf stuffed with spiced mince, baked crisp and cut in wedges; pickles and chilies
    eg_hawawshi: p => {
        const out = [xegBoard(p)];
        const n = 6;
        for (let i = 0; i < n; i++) out.push(xegLoafWedge(p, 72, i / n * 6.28 - 1.2, (i + 1) / n * 6.28 - 1.2 - .05, 6, { seed: i }));
        out.push(xegChili(p, 118, 70, 46, 30), xegChili(p, 76, 128, 42, -150, { c: '#5aa232' }));
        out.push(`<g ${p.sh(.5)}>`, K.carrotRound(p, 132, 120, 14), K.carrotRound(p, 142, 108, 12), K.cucumberSlice(p, 128, 134, 12, 20, { oval: 1.1 }), '</g>');
        out.push(xegSprig(p, 62, 76, 22, -30));
        return out.join('');
    },

    // fatta: crisp bread under rice, garlicky red tomato sauce and boiled beef chunks on top
    eg_fatta: p => {
        const out = [K.bowl(p, { glaze: '#d9a24a', inside: '#f6efe0' })];
        out.push(`<g ${p.sh(.6)}>`);
        [[40, 98, 20], [56, 52, -30], [150, 60, 40], [160, 112, 10], [118, 160, -20], [56, 146, 30]].forEach(([x, y, r]) => out.push(`<g ${T(x, y, r)}><g ${p.crumb(.8)}><path d="${smooth(ring(12, 7, .35, rng(p.id + x), 1.3, .8), true, .5)}" fill="${p.g('#d99a48', .3, .3)}" stroke="#94581e" stroke-width=".6"/></g></g>`));
        out.push('</g>');
        out.push(xegRice(p, 100, 100, 136, { tint: '#f8f2e2', seed: 1, n: 190 }));
        out.push(K.pool(p, 102, 102, 104, '#c43f26', { seed: 3, sy: .9, op: .96 }));
        out.push(xegMottle(p, 102, 102, 80, '#c43f26', { n: 10, op: .4 }));
        out.push(xegGarlic(p, 102, 100, 84, { n: 22, c: '#f0d48a' }));
        out.push(`<g ${p.sh(.5)}>`);
        [[82, 82, 26], [118, 80, 28], [134, 106, 24], [104, 124, 28], [76, 112, 24], [102, 100, 22]].forEach(([x, y, s], i) => out.push(xegBeef(p, x, y, s, i * 50, { c: '#94603e', seed: i })));
        out.push('</g>');
        out.push(xegOil(p, 102, 100, 90, { n: 7, c: '#e5703a', op: .55, rmax: 2 }));
        out.push(xegHerb(p, 100, 100, 110, { n: 18, seed: 2 }));
        return out.join('');
    },

    // mesaqaa: fried eggplant rounds and green pepper baked in a garlicky tomato sauce
    eg_mesaqaa: p => {
        const out = [xegSaniya(p), `<circle cx="100" cy="100" r="80" fill="${p.rg('#b8402a', .2, .3)}"/>`];
        const sp = xegSpots('mesa', 15, 54, 24);
        out.push(...sp.map(([x, y, r], i) => xegEggRound(p, x, y, 34, r, { seed: i })));
        const R = rng('mesasauce');
        let sauce = '';
        for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 66; sauce += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, R() * 180)} d="${smooth(ring(5 + R() * 8, 8, .5, R, 1.4, .8))}" fill="${R() < .5 ? '#c4452c' : '#a8321e'}"/>`; }
        out.push(`<g opacity=".82">${sauce}</g>`);
        out.push(`<g ${p.sh(.5)}>`, xegPep(p, 70, 74, 18, 20, { c: '#4f8f2f' }), xegPep(p, 128, 128, 18, -40, { c: '#4f8f2f' }), xegPep(p, 136, 72, 16, 60, { c: '#4f8f2f' }), xegPep(p, 66, 128, 16, -10, { c: '#4f8f2f' }), xegPep(p, 102, 100, 16, 80, { c: '#4f8f2f' }), '</g>');
        out.push(xegGarlic(p, 100, 100, 110, { n: 16, c: '#f1d58c' }));
        out.push(xegOil(p, 100, 100, 130, { n: 10, c: '#e0652e', op: .5, rmax: 2.2 }));
        return out.join('');
    },

    // chicken pane: big flat breadcrumbed cutlets, lemon, lettuce and tomato
    eg_pane: p => [
        K.plate(p, { rim: '#2f6f6a' }),
        `<g ${p.sh(.5)}>`, K.leafPiece(p, 146, 146, 36, 30, { c: '#8fc45a' }), K.leafPiece(p, 156, 120, 30, 80, { c: '#a6d070' }), K.leafPiece(p, 52, 54, 32, -40, { c: '#8fc45a' }), '</g>',
        xegCutlet(p, 86, 80, 112, 70, -24, { seed: 1 }),
        xegCutlet(p, 110, 122, 110, 66, -10, { seed: 2, c: '#d08a36' }),
        xegTomSlice(p, 150, 146, 26, 10), xegTomSlice(p, 46, 70, 22),
        K.lemon(p, 146, 64, 30, 40), K.lemon(p, 58, 150, 28, -140),
    ].join(''),

    // Alexandrian liver: strips of liver stir-fried with green pepper, chili and garlic, lemon
    eg_kebda: p => {
        const out = [xegTasa(p, { c: '#3d3836', inner: '#2a2422' })];
        out.push(`<circle cx="100" cy="100" r="72" fill="${p.rg('#6a3a1e', .15, .3)}" opacity=".9"/>`);
        out.push(`<g ${p.sh(.6)}>`);
        xegSpots('kebda', 17, 56, 19).forEach(([x, y, r], i) => out.push(xegLiver(p, x, y, 32 + (i % 3) * 4, r, { seed: i, c: i % 2 ? '#6a3a24' : '#7a4428' })));
        out.push('</g>');
        xegSpots('kebda-p', 10, 58, 18).forEach(([x, y, r], i) => out.push(xegPep(p, x, y, 22, r, { c: i % 3 ? '#4f9a32' : '#6cae3a', strip: true })));
        [[90, 70], [128, 96], [74, 118], [112, 132]].forEach(([x, y]) => out.push(xegPepRing(p, x, y, 8, 0, { c: '#3f8a2a' })));
        out.push(xegGarlic(p, 100, 100, 110, { n: 22, c: '#f0d080' }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#5a2a10', n: 16, r: .7 }));
        out.push(K.lemon(p, 136, 132, 28, -30));
        return out.join('');
    },

    // sayadeya: brown caramelised-onion rice, fried fish pieces, fried onions and toasted nuts, lemon
    eg_sayadeya: p => {
        const out = [K.plate(p, { rim: '#2c5c7c' })];
        out.push(xegRice(p, 100, 102, 150, { tint: '#c4925a', seed: 2, n: 260 }));
        out.push(xegCrispy(p, 100, 100, 120, { n: 26 }));
        out.push(`<g ${p.sh(.8)}>`);
        out.push(xegFish(p, 98, 82, 112, -14), xegFish(p, 104, 124, 106, -6, { c: '#b06a28' }));
        out.push('</g>');
        [[64, 108, 'almond'], [140, 128, 'pine'], [118, 66, 'almond'], [66, 74, 'pine'], [144, 70, 'almond'], [116, 140, 'pine'], [60, 128, 'almond'], [134, 112, 'pine']].forEach(([x, y, k], i) => out.push(xegNut(p, x, y, k === 'pine' ? 6 : 9, i * 40, k)));
        out.push(xegHerb(p, 100, 100, 110, { n: 14, seed: 3 }));
        out.push(K.lemon(p, 150, 150, 26, -40));
        return out.join('');
    },

    // torly: mixed vegetables and beef baked in tomato sauce on a round tray, browned on top
    eg_torly: p => {
        const out = [xegSaniya(p), `<circle cx="100" cy="100" r="80" fill="${p.rg('#c9542e', .2, .3)}"/>`];
        const sp = xegSpots('torly', 44, 64, 13.5);
        out.push(`<g ${p.sh(.6)}>`);
        sp.forEach(([x, y, r], i) => {
            const t = i % 7;
            out.push(t === 0 || t === 4 ? xegCube(p, x, y, 16, r, '#e8b45a', { seed: i })
                : t === 1 || t === 5 ? xegZuc(p, x, y, 17, r, { cooked: true })
                : t === 2 ? K.carrotRound(p, x, y, 14, { c: '#e8752c' })
                : t === 3 ? xegBeef(p, x, y, 18, r, { c: '#7a4024', seed: i })
                : xegPep(p, x, y, 15, r, { c: '#4f8f2f' }));
        });
        out.push('</g>');
        xegSpots('torly-pea', 16, 64, 8).forEach(([x, y]) => out.push(xegPea(p, x, y, 6)));
        const R = rng('torlych');
        let ch = '';
        for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 64; ch += `<ellipse cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" rx="${f(3 + R() * 5)}" ry="${f(2 + R() * 3)}" fill="#6a2a10" opacity=".3"/>`; }
        out.push(`<g ${xegBlur(p, 1.5)}>${ch}</g>`);
        out.push(xegOil(p, 100, 100, 140, { n: 10, c: '#e8743a', op: .5, rmax: 2 }));
        return out.join('');
    },

    // kabab halla: beef chunks braised in a thick, glossy brown onion sauce
    eg_kababhalla: p => {
        const out = [K.bowl(p, { glaze: '#7a4a22', inside: '#efe2cc' }), K.liquid(p, { R: 74, c: '#8a5228', op: 1, shine: false })];
        out.push(xegMottle(p, 100, 100, 130, '#8a5228', { n: 16, op: .45 }));
        out.push(`<g opacity=".55">`);
        xegSpots('halla-o', 18, 64, 14).forEach(([x, y, r]) => out.push(xegOnion(p, x, y, 18, r, { c: '#b07a3a' })));
        out.push('</g>');
        out.push(`<g ${p.sh(.7)}>`);
        xegSpots('halla-b', 9, 54, 31).forEach(([x, y, r], i) => out.push(xegBeef(p, x, y, 33, r, { c: '#6a3418', seed: i })));
        out.push('</g>');
        out.push(`<g ${T(132, 74, -30)}><path d="M-14,0 Q0,-7 14,0 Q0,7 -14,0Z" fill="${p.g('#6f7a3a', .25, .3)}" stroke="#4a5226" stroke-width=".6"/><path d="M-13,0 L13,0" stroke="#9aa060" stroke-width=".7"/></g>`);
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#2a1406', n: 18, r: .8 }));
        out.push(xegOil(p, 100, 100, 130, { n: 8, c: '#c9802e', op: .5, rmax: 2 }));
        out.push(xegShine(100, 100, 74, .4));
        return out.join('');
    },

    // kosa bechamel: zucchini and mince layered under a browned bechamel in a square glass dish
    eg_kosabechamel: p => {
        const R = rng(p.id + 'spots');
        let spots = '', bub = '';
        for (let i = 0; i < 40; i++){ const x = 30 + R() * 140, y = 30 + R() * 140; spots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(5 + R() * 8)}" ry="${f(4 + R() * 6)}" fill="${R() < .5 ? '#bf7a26' : '#a65e18'}" opacity="${f(.55 + R() * .4)}"/>`; }
        for (let i = 0; i < 14; i++){ const x = 30 + R() * 140, y = 30 + R() * 140; bub += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + R() * 1.4)}" fill="#fff8dc" opacity=".75"/>`; }
        const clip = p.uid();
        let face = `<rect x="112" y="112" width="64" height="9" fill="#f6e6bc"/><rect x="112" y="112" width="9" height="64" fill="#f6e6bc"/>`;
        for (let x = 126; x < 176; x += 10) face += `<ellipse cx="${x}" cy="125" rx="4.6" ry="2.2" fill="#e6ecc0" stroke="#3f7a2c" stroke-width="1.2"/>`;
        for (let y = 126; y < 176; y += 10) face += `<ellipse cx="116" cy="${y}" rx="2.2" ry="4.6" fill="#e6ecc0" stroke="#3f7a2c" stroke-width="1.2"/>`;
        face += `<path d="M121,130 L176,130 M121,130 L121,176" stroke="#7a4524" stroke-width="3.2" stroke-dasharray="3 1.5"/>`;
        return [
            xegPyrex(p, { w: 168, h: 168 }),
            `<path ${T(148, 148)} d="${smooth(ring(14, 8, .5, rng('ksm'), 1.2, .9))}" fill="#e9d7a8" opacity=".75"/>`,
            `<clipPath id="${clip}"><path d="M24,24 L176,24 L176,112 L112,112 L112,176 L24,176Z"/></clipPath>`,
            `<g clip-path="url(#${clip})"><rect x="24" y="24" width="152" height="152" rx="10" fill="${p.g('#eabf62', .3, .2)}"/>`,
            `<g ${xegBlur(p, 3.2)}>${spots}</g>${bub}`,
            `<path d="M36,46 Q70,34 110,40" stroke="#fffaf0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/></g>`,
            face,
            xegHerb(p, 70, 80, 70, { n: 10, seed: 2 }),
        ].join('');
    },

    // shish tawook: yogurt-marinated chicken cubes grilled on skewers with pepper and onion, garlic sauce
    eg_shishtawook: p => {
        const out = [K.longPlate(p, { base: '#f6f2ea', rim: '#d98a3a' })];
        out.push(K.leafPiece(p, 166, 136, 26, 20, { c: '#9fcd6a' }), K.leafPiece(p, 34, 64, 24, -20, { c: '#9fcd6a' }));
        [[70, -5], [100, -2], [130, 3]].forEach(([y, rot], k) => {
            out.push(`<g ${T(100, y, rot)}>`);
            out.push(`<path d="M-82,0 L82,0" stroke="#8c9399" stroke-width="2.2" stroke-linecap="round"/><path d="M-82,-.6 L82,-.6" stroke="#e6e9ec" stroke-width=".8"/>`);
            const xs = [-64, -39, -13, 13, 39, 64];
            xs.forEach((x, i) => {
                if (i === 2 && k !== 1) out.push(xegPep(p, x, 0, 18, 90, { c: '#4f9a32' }));
                else if (i === 4 && k === 1) out.push(xegOnion(p, x, 0, 20, 0, { c: '#e8c99a' }));
                else out.push(xegTawook(p, x, 0, 27, i * 23 + k * 17, { seed: i + k * 7 }));
            });
            out.push('</g>');
        });
        out.push(`<g ${p.sh(.6)}><path d="${smooth(ring(9, 8, .2, rng('toum'), 1.2, .9))}" transform="translate(170 72)" fill="${p.rg('#fbf8ee', .2, .12)}"/></g>`);
        out.push(xegHerb(p, 100, 100, 130, { n: 14, seed: 4 }));
        out.push(K.lemon(p, 32, 134, 22, -30));
        return out.join('');
    },

    // roz meammar: creamy baked rice in a clay bram, blistered golden crust, chicken on top
    eg_rozmeammar: p => {
        const R = rng(p.id + 'crust');
        let sp = '', bub = '';
        for (let i = 0; i < 30; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 70; sp += `<ellipse cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" rx="${f(4 + R() * 7)}" ry="${f(3 + R() * 5)}" fill="${R() < .5 ? '#c07a2a' : '#9a561a'}" opacity="${f(.5 + R() * .4)}"/>`; }
        for (let i = 0; i < 18; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 70; bub += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" r="${f(1 + R() * 1.6)}" fill="#fff6d8" opacity=".8"/>`; }
        return [
            xegTagen(p, { c: '#a85a34' }),
            `<circle cx="100" cy="100" r="78" fill="${p.rg('#e9bd68', .25, .25)}"/>`,
            `<circle cx="100" cy="100" r="78" fill="none" stroke="#8a4a1a" stroke-width="3" opacity=".55"/>`,
            `<g ${xegBlur(p, 3)}>${sp}</g>`,
            xegGrains(p, 100, 100, 140, { n: 50, c: '#f6e3b0', L: 3.2, w: 2 }),
            bub,
            K.pool(p, 92, 96, 40, '#f6dc8a', { op: .55, seed: 2 }),
            xegLeg(p, 86, 84, 76, 25, { c: '#c47a2e' }), xegLeg(p, 118, 120, 76, 205, { c: '#bd7028' }),
            K.sprinkle(p, 100, 100, 130, { c: '#5a2a10', n: 10, r: .7 }),
        ].join('');
    },

    // fish tagen: fish steaks baked in a clay tagen on potato slices under tomato sauce, tomato and pepper rings, lemon
    eg_tagensamak: p => {
        const out = [xegTagen(p, { c: '#b5643a' }), `<circle cx="100" cy="100" r="78" fill="${p.rg('#c4452c', .2, .3)}"/>`];
        out.push(`<g ${p.sh(.5)}>`);
        [[40, 100], [52, 64], [84, 42], [122, 44], [154, 66], [162, 104], [150, 140], [118, 158], [80, 158], [50, 136]].forEach(([x, y], i) => out.push(xegPotSlice(p, x, y, 22, i * 33)));
        out.push('</g>');
        out.push(xegMottle(p, 100, 100, 140, '#c4452c', { n: 14, op: .5 }));
        out.push(xegFishChunk(p, 74, 84, 56, -20, { c: '#f6ead6', seed: 1 }), xegFishChunk(p, 126, 82, 54, 25, { c: '#f8ecda', seed: 2 }), xegFishChunk(p, 100, 128, 58, 5, { c: '#f6ead6', seed: 3 }));
        out.push(xegTomSlice(p, 70, 120, 22, 0, { cooked: true }), xegTomSlice(p, 132, 116, 22, 30, { cooked: true }), xegTomSlice(p, 100, 64, 20, 10, { cooked: true }));
        out.push(xegPepRing(p, 56, 92, 16, 0, { c: '#4f8f2f' }), xegPepRing(p, 146, 96, 15, 0, { c: '#4f8f2f' }), xegPepRing(p, 116, 150, 14, 0, { c: '#4f8f2f' }));
        out.push(K.lemon(p, 140, 140, 22, -30), K.lemon(p, 60, 62, 20, 150));
        out.push(xegSprig(p, 98, 96, 18, 20), xegSprig(p, 84, 148, 16, -40), xegHerb(p, 100, 100, 120, { n: 10, seed: 6 }));
        return out.join('');
    },

    // gambari: plump shrimp in a spicy tomato sauce with pepper, chili and coriander, copper pan
    eg_gambari: p => {
        const out = [xegTasa(p, { c: '#c27a44', inner: '#9a5a30' }), `<circle cx="100" cy="100" r="72" fill="${p.rg('#c4452c', .2, .3)}"/>`];
        out.push(xegMottle(p, 100, 100, 130, '#c4452c', { n: 14, op: .5 }));
        out.push(`<g ${p.sh(.7)}>`);
        xegSpots('gamb', 14, 54, 24).forEach(([x, y, r]) => out.push(K.shrimp(p, x, y, 30, r, { c: '#f07a50' })));
        out.push('</g>');
        xegSpots('gamb-p', 8, 58, 20).forEach(([x, y, r]) => out.push(xegPep(p, x, y, 13, r, { c: '#4f9a32' })));
        [[86, 72], [120, 128], [70, 118], [132, 82]].forEach(([x, y]) => out.push(xegPepRing(p, x, y, 7, 0, { c: '#d43a22' })));
        out.push(xegGarlic(p, 100, 100, 110, { n: 14, c: '#f1d58c' }));
        out.push(xegHerb(p, 100, 100, 120, { n: 24, seed: 3, c: '#3f8f2e' }));
        out.push(xegOil(p, 100, 100, 130, { n: 9, c: '#e0652e', op: .5, rmax: 2 }));
        return out.join('');
    },

    // eggah: thick round herb omelette (parsley, dill, onion), cut in wedges, tomato slices
    eg_eggah: p => {
        const R = rng(p.id + 'egg');
        const shape = smooth(ring(70, 16, .04, R));
        let brown = '';
        for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = 30 + R() * 38; brown += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(5 + R() * 8)}" ry="${f(3 + R() * 5)}" fill="#b8742a" opacity="${f(.35 + R() * .3)}"/>`; }
        let cuts = '';
        for (let i = 0; i < 6; i++){ const a = i / 6 * 6.28 + .3; cuts += `<path d="M0,0 L${f(Math.cos(a) * 72)},${f(Math.sin(a) * 72)}" stroke="#7a5a1e" stroke-width="2.2" opacity=".7"/><path d="M1,1 L${f(Math.cos(a) * 72 + 1)},${f(Math.sin(a) * 72 + 1)}" stroke="#fff4c8" stroke-width=".8" opacity=".6"/>`; }
        return [
            K.plate(p, { rim: '#c7a14a' }),
            `<g ${T(100, 100)}><g ${p.sh(1)}><path d="${shape}" fill="${p.rg('#cfc04a', .2, .3)}" stroke="#8a822a" stroke-width="1"/></g>`,
            `<g ${xegBlur(p, 2.5)}>${brown}</g></g>`,
            xegHerb(p, 100, 100, 132, { n: 120, seed: 1, c: '#4a8a2a', sz: .9 }),
            xegHerb(p, 100, 100, 120, { n: 20, seed: 2, c: '#7aa83a', sz: .8 }),
            xegGarlic(p, 100, 100, 120, { n: 16, c: '#f6ecc8' }),
            `<g ${T(100, 100)}>${cuts}</g>`,
            xegTomSlice(p, 160, 150, 26, 10), xegTomSlice(p, 140, 166, 22, 40),
            xegSprig(p, 44, 44, 22, -40),
        ].join('');
    },

    // Egyptian shakshuka: eggs set in tomato, pepper and chili sauce, served in the pan
    eg_shakshouka: p => {
        const out = [xegTasa(p), `<circle cx="100" cy="100" r="72" fill="${p.rg('#c9412a', .2, .3)}"/>`];
        out.push(xegMottle(p, 100, 100, 130, '#c9412a', { n: 16, op: .5 }));
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('shak-t', 12, 60, 18).forEach(([x, y, r], i) => out.push(xegTomChunk(p, x, y, 15, r, { seed: i })));
        xegSpots('shak-p', 10, 62, 18).forEach(([x, y, r]) => out.push(xegPep(p, x, y, 14, r, { c: '#4f9a32' })));
        out.push('</g>');
        out.push(K.friedEgg(p, 74, 76, 50, 10), K.friedEgg(p, 128, 78, 48, -20), K.friedEgg(p, 76, 126, 48, 40), K.friedEgg(p, 128, 126, 50, 80));
        [[100, 100], [100, 58], [58, 100], [146, 102], [102, 146]].forEach(([x, y]) => out.push(xegPepRing(p, x, y, 7, 0, { c: '#3f8a2a' })));
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#2a1406', n: 14, r: .7 }));
        out.push(xegHerb(p, 100, 100, 110, { n: 14, seed: 4 }));
        return out.join('');
    },

    // lobia: black-eyed peas stewed in tomato sauce with a little beef
    eg_lobia: p => {
        const out = [K.bowl(p, { glaze: '#3f6a8a', inside: '#f3eee4' }), K.liquid(p, { R: 74, c: '#b8452c', op: 1, shine: false })];
        out.push(xegMottle(p, 100, 100, 130, '#b8452c', { n: 12, op: .45 }));
        out.push(`<g ${p.sh(.6)}>`);
        [[78, 82], [126, 92], [96, 128]].forEach(([x, y], i) => out.push(xegBeef(p, x, y, 22, i * 60, { c: '#7a4024', seed: i })));
        xegSpots('lobia', 62, 66, 9.6).forEach(([x, y, r]) => { if (![[78, 82], [126, 92], [96, 128]].some(([u, v]) => Math.hypot(u - x, v - y) < 13)) out.push(xegBlackEye(p, x, y, 12, r)); });
        out.push('</g>');
        out.push(`<g opacity=".35">${K.pool(p, 100, 100, 110, '#c4452c', { seed: 2, op: .5 })}</g>`);
        out.push(xegHerb(p, 100, 100, 110, { n: 18, seed: 2, c: '#3f8f2e' }));
        out.push(xegShine(100, 100, 74, .4));
        return out.join('');
    },

    // bessara: thick green fava and herb purée, crisp fried onions and garlic, chili and oil
    eg_bessara: p => {
        const out = [K.bowl(p, { glaze: '#c9a46a', inside: '#f3ecdc' })];
        out.push(`<g ${p.sh(.6)}><path d="${smooth(ring(74, 16, .05, rng('bes'), 1, .97))}" transform="translate(100 100)" fill="${p.rg('#6f9a38', .25, .25)}"/></g>`);
        out.push(xegMottle(p, 100, 100, 130, '#6f9a38', { n: 18, op: .45 }));
        out.push(xegSwirl(100, 100, 62, '#4f7a24', 3.4, .55), xegSwirl(98, 98, 62, '#a6c86a', 1.4, .7));
        out.push(K.pool(p, 104, 104, 54, '#d9b23a', { op: .55, seed: 3 }));
        out.push(xegCrispy(p, 100, 98, 92, { n: 64 }));
        out.push(xegGarlic(p, 100, 100, 70, { n: 14, c: '#e8b85a' }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#b8321a', n: 18, r: .8 }));
        return out.join('');
    },

    // macarona salsa: penne tossed in red tomato sauce, grated rumi cheese, parsley
    eg_salsamacarona: p => {
        const out = [K.bowl(p, { glaze: '#f2ede2', inside: '#fbf8f1' }), `<circle cx="100" cy="100" r="80" fill="none" stroke="#2c4c7c" stroke-width="1.6" opacity=".8"/>`];
        out.push(`<circle cx="100" cy="100" r="72" fill="${p.rg('#c4452c', .2, .3)}"/>`);
        out.push(`<g ${p.sh(.6)}>`);
        xegSpots('salsa', 58, 64, 11).forEach(([x, y, r], i) => out.push(xegPenne(p, x, y, 25, r, { c: i % 3 ? '#e8954e' : '#efb068' })));
        out.push('</g>');
        out.push(xegMottle(p, 100, 100, 130, '#c4452c', { n: 22, op: .6 }));
        const R = rng('salsach');
        let ch = '';
        for (let i = 0; i < 40; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 30, x = 100 + Math.cos(a) * d, y = 98 + Math.sin(a) * d, b = R() * 180; ch += `<rect ${T(x, y, b)} x="-3" y="-.8" width="6" height="1.6" rx=".8" fill="${R() < .5 ? '#fbf3d2' : '#f2dc98'}"/>`; }
        out.push(`<g ${p.sh(.4)}>${ch}</g>`);
        out.push(xegHerb(p, 100, 100, 110, { n: 14, seed: 2 }));
        return out.join('');
    },

    // Alexandrian sogo: spiced sausage slices fried with green peppers, tomato and onion in an iron pan
    eg_sogo: p => {
        const out = [xegTasa(p, { c: '#3d3836', inner: '#2a2422' }), `<circle cx="100" cy="100" r="72" fill="${p.rg('#a8402a', .15, .3)}" opacity=".9"/>`];
        out.push(`<g opacity=".9">`);
        xegSpots('sogo-o', 10, 60, 18).forEach(([x, y, r]) => out.push(xegOnion(p, x, y, 18, r, { c: '#e6c08a' })));
        out.push('</g>');
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('sogo-t', 8, 60, 22).forEach(([x, y, r], i) => out.push(xegTomChunk(p, x, y, 16, r, { seed: i })));
        out.push('</g>');
        xegSpots('sogo', 22, 58, 18).forEach(([x, y, r], i) => out.push(xegSogo(p, x, y, 20, r, { seed: i })));
        xegSpots('sogo-p', 11, 60, 18).forEach(([x, y, r], i) => out.push(xegPep(p, x, y, 22, r, { c: i % 2 ? '#4f9a32' : '#6cae3a', strip: true })));
        out.push(xegPepRing(p, 112, 66, 8, 0, { c: '#3f8a2a' }), xegPepRing(p, 72, 128, 8, 0, { c: '#3f8a2a' }));
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#7a3a10', n: 16, r: .8 }));
        return out.join('');
    },

    // reyash: grilled lamb chops on a board with onion rings, lemon and parsley
    eg_reyash: p => [
        xegBoard(p),
        `<g ${p.sh(.5)}>`, K.leafPiece(p, 146, 140, 40, 30, { c: '#9cc46a' }), K.leafPiece(p, 60, 58, 30, -30, { c: '#9cc46a' }), '</g>',
        xegChop(p, 64, 72, 76, -35), xegChop(p, 98, 100, 78, -35), xegChop(p, 52, 114, 76, -35), xegChop(p, 86, 144, 76, -35),
        xegPepRing(p, 148, 126, 18, 0, { c: '#d9c3e0' }), xegPepRing(p, 134, 148, 16, 0, { c: '#d9c3e0' }), xegPepRing(p, 160, 146, 14, 0, { c: '#e8d8ea' }),
        K.lemon(p, 134, 166, 24, -20), K.lemon(p, 150, 60, 24, 60),
        K.parsley(p, 160, 96, 20),
    ].join(''),

    // torshi: mixed pickles in brine — carrot, cauliflower, small cucumbers, green chilies, lemon
    eg_torshi: p => {
        const out = [K.kobachi(p, { glaze: '#7fa58f', inside: '#eef2ea' }), `<circle cx="100" cy="100" r="74" fill="${p.rg('#e8d98a', .2, .25)}" opacity=".55"/>`];
        out.push(`<g ${p.sh(.6)}>`);
        xegSpots('torshi', 20, 60, 21).map(([x, y], i) => [x, y, [0, 1, 2, 0, 2][i % 5]]).forEach(([x, y, t], i) => {
            if (t === 0) out.push(xegCauli(p, x, y, 32, i * 40, { c: '#f2e2a8', seed: i }));
            else if (t === 1) out.push(`<g ${T(x, y, i * 50)}><ellipse rx="20" ry="8" fill="${p.g('#8a9a3a', .3, .3)}" stroke="#55621e" stroke-width=".6"/><ellipse rx="15" ry="4.4" fill="#c9cf84"/>${[-10, -4, 2, 8].map(a => `<circle cx="${a}" cy="0" r="1.2" fill="#eef0c2"/>`).join('')}</g>`);
            else out.push(K.carrotRound(p, x, y, 16, { c: '#e8752c' }));
        });
        [[88, 66, 30], [112, 118, -60], [70, 142, 10], [140, 70, 80], [52, 88, -80]].forEach(([x, y, r]) => out.push(`<g ${T(x, y, r)}><rect x="-14" y="-3.6" width="28" height="7.2" rx="2.4" fill="${p.g('#ee7f30', .3, .25)}" stroke="#b5521a" stroke-width=".5"/></g>`));
        out.push('</g>');
        out.push(xegChili(p, 116, 90, 50, 120, { c: '#7a9a36' }), xegChili(p, 74, 112, 46, -30, { c: '#8aa83e' }), xegChili(p, 96, 60, 44, 10, { c: '#7a9a36' }));
        out.push(`<g ${T(132, 150, 20)}><circle r="11" fill="#e8c43a"/><circle r="9.4" fill="#f6e78a"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M0,0 L${f(Math.cos(i * 1.047) * 8.6)},${f(Math.sin(i * 1.047) * 8.6)}" stroke="#fff8cc" stroke-width=".8"/>`).join('')}</g>`);
        out.push(xegShine(100, 100, 74, .35));
        return out.join('');
    },

    // betingan mekhalel: small eggplants slit and stuffed with garlic, pepper, chili and parsley
    eg_betenganmekhalel: p => [
        K.plate(p, { rim: '#7a3f8a' }),
        xegFingerEgg(p, 96, 52, 92, -8), xegFingerEgg(p, 100, 82, 96, -4), xegFingerEgg(p, 96, 114, 96, 4), xegFingerEgg(p, 102, 146, 88, 8),
        xegHerb(p, 100, 100, 110, { n: 12, seed: 2 }),
        xegChili(p, 150, 62, 34, 60), xegPepRing(p, 44, 120, 12, 0, { c: '#c4321f' }),
    ].join(''),

    // salata zabadi: thick yogurt with cucumber, dill, dried mint and olive oil
    eg_salatazabadi: p => {
        const out = [K.bowl(p, { glaze: '#5d7f9a', inside: '#f5f2ea' })];
        out.push(`<g ${p.sh(.6)}><path d="${smooth(ring(74, 16, .05, rng('zab'), 1, .97))}" transform="translate(100 100)" fill="${p.rg('#f8f6ee', .3, .12)}"/></g>`);
        out.push(xegSwirl(100, 100, 60, '#dcd8c8', 3, .7));
        out.push(`<g ${p.sh(.35)}>`);
        xegSpots('zab', 34, 64, 13).forEach(([x, y, r]) => out.push(xegDice(p, x, y, 11, r, 'cuc')));
        out.push('</g>');
        out.push(`<g opacity=".5">${K.pool(p, 100, 100, 130, '#fbf9f0', { seed: 2, op: .7 })}</g>`);
        out.push(K.pool(p, 98, 96, 30, '#cdb83a', { op: .7, seed: 3 }));
        [[80, 70, 30], [124, 80, -40], [70, 120, 60], [120, 128, 10], [100, 104, -70]].forEach(([x, y, r]) => out.push(xegDill(p, x, y, 18, r)));
        out.push(K.sprinkle(p, 100, 100, 100, { c: '#5f7a3a', n: 24, r: .8 }));
        return out.join('');
    },

    // potato salad: boiled potato cubes with red onion, green pepper, parsley and a lemon-cumin dressing
    eg_salatabatates: p => {
        const out = [K.bowl(p, { glaze: '#c9a24a', inside: '#f6f1e6' })];
        out.push(`<g ${p.sh(.6)}>`);
        xegSpots('batsal', 40, 66, 14).forEach(([x, y, r], i) => out.push(i % 6 === 5 ? xegDice(p, x, y, 10, r, 'red') : xegCube(p, x, y, 17, r, i % 2 ? '#f1d68e' : '#eccb78', { seed: i })));
        out.push('</g>');
        xegSpots('batsal-p', 10, 64, 18).forEach(([x, y, r]) => out.push(xegPep(p, x, y, 10, r, { c: '#4f9a32' })));
        xegSpots('batsal-o', 8, 64, 18).forEach(([x, y, r]) => out.push(xegDice(p, x, y, 8, r, 'red')));
        out.push(xegHerb(p, 100, 100, 130, { n: 46, seed: 2 }));
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#8a4a1a', n: 16, r: .7 }));
        out.push(xegOil(p, 100, 100, 120, { n: 8, c: '#e8cc5a', op: .45, rmax: 2 }));
        return out.join('');
    },

    // gargir salad: peppery rocket leaves with tomato, red onion and lemon
    eg_gargir: p => {
        const out = [K.plate(p, { rim: '#2f6f6a' })];
        out.push(`<g ${p.sh(.6)}>`);
        xegSpots('garg', 26, 62, 15).forEach(([x, y, r], i) => out.push(xegRocket(p, x, y, 42 + (i % 3) * 4, r, { c: i % 3 ? '#3f7f2a' : '#4f9434' })));
        out.push('</g>');
        out.push(`<g ${p.sh(.4)}>`);
        xegSpots('garg-t', 12, 56, 18).forEach(([x, y, r]) => out.push(xegDice(p, x, y, 12, r, 'tom')));
        out.push('</g>');
        [[84, 84], [122, 104], [94, 132], [132, 70]].forEach(([x, y], i) => out.push(xegPepRing(p, x, y, 14, 0, { c: i % 2 ? '#c9a0d0' : '#b884c0' })));
        out.push(K.lemon(p, 150, 150, 28, -40));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#8a4a1a', n: 10, r: .6 }));
        return out.join('');
    },

    // batates sotee: golden sautéed potato cubes with garlic, lots of coriander, a little green pepper
    eg_batatessotee: p => {
        const out = [xegTasa(p, { c: '#3d3836', inner: '#2a2422' })];
        out.push(`<g ${p.sh(.7)}>`);
        xegSpots('sotee', 34, 60, 15).forEach(([x, y, r], i) => out.push(xegCube(p, x, y, 19, r, i % 3 ? '#e4a845' : '#d99634', { seed: i })));
        out.push('</g>');
        const R = rng('soteech');
        let ch = '';
        for (let i = 0; i < 20; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 62; ch += `<ellipse cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" rx="${f(2 + R() * 3)}" ry="${f(1.5 + R() * 2)}" fill="#8a4a14" opacity=".4"/>`; }
        out.push(`<g ${xegBlur(p, .8)}>${ch}</g>`);
        xegSpots('sotee-p', 8, 60, 20).forEach(([x, y, r]) => out.push(xegPep(p, x, y, 10, r, { c: '#4f9a32' })));
        out.push(xegGarlic(p, 100, 100, 120, { n: 22, c: '#f1d080' }));
        out.push(xegHerb(p, 100, 100, 130, { n: 60, seed: 3, c: '#3f8f2e' }));
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#b8461a', n: 14, r: .7 }));
        return out.join('');
    },

    // kosa sotee: zucchini half-moons sautéed with onion and carrot, a little tomato
    eg_kosasotee: p => {
        const out = [K.ovalDish(p, { rx: 94, ry: 84, rim: '#c9a24a' })];
        out.push(`<ellipse cx="100" cy="100" rx="72" ry="62" fill="${p.rg('#d9c27a', .2, .25)}" opacity=".7"/>`);
        out.push(`<g ${p.sh(.6)}>`);
        xegSpots('ksot', 54, 66, 12.5, 100, 100, .86).forEach(([x, y, r], i) => {
            const t = i % 6;
            out.push(t === 4 ? K.carrotRound(p, x, y, 16, { c: '#ec7b2d', half: true, r }) : t === 5 ? xegOnion(p, x, y, 22, r, { c: '#e9c98a' }) : xegZuc(p, x, y, 28, r, { half: true, cooked: true }));
        });
        out.push('</g>');
        const R = rng('ksotch');
        let ch = '';
        for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 60; ch += `<ellipse cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d * .88)}" rx="${f(2 + R() * 3)}" ry="${f(1.5 + R() * 1.5)}" fill="#8a5a1a" opacity=".35"/>`; }
        out.push(`<g ${xegBlur(p, .8)}>${ch}</g>`);
        xegSpots('ksot-t', 7, 56, 20).forEach(([x, y, r]) => out.push(xegDice(p, x, y, 9, r, 'tom')));
        out.push(xegHerb(p, 100, 100, 120, { n: 14, seed: 4, c: '#5a8a3a' }));
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#2a1406', n: 14, r: .6 }));
        return out.join('');
    },

    // fasoleya: cut green beans and carrot stewed in tomato sauce
    eg_fasoleya: p => {
        const out = [K.bowl(p, { glaze: '#8a4a2a', inside: '#efe2cc' }), K.liquid(p, { R: 74, c: '#c4452c', op: 1, shine: false })];
        out.push(xegMottle(p, 100, 100, 130, '#c4452c', { n: 12, op: .45 }));
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('faso', 44, 62, 12).forEach(([x, y, r], i) => out.push(i % 5 === 4 ? xegCube(p, x, y, 12, r, '#ee7f30', { seed: i }) : xegBean(p, x, y, 26, r, { c: i % 2 ? '#5a9a34' : '#4a8a2c' })));
        out.push('</g>');
        out.push(`<g opacity=".3">${K.pool(p, 100, 100, 120, '#c4452c', { seed: 3, op: .6 })}</g>`);
        out.push(xegShine(100, 100, 74, .4));
        return out.join('');
    },

    // besella bel gazar: peas and carrot cubes in tomato sauce
    eg_besellagazar: p => {
        const out = [K.bowl(p, { glaze: '#e8e2d6', inside: '#f6f2ea' }), K.liquid(p, { R: 74, c: '#c9552e', op: 1, shine: false })];
        out.push(xegMottle(p, 100, 100, 130, '#c9552e', { n: 12, op: .45 }));
        out.push(`<g ${p.sh(.4)}>`);
        xegSpots('bes-c', 22, 64, 17).forEach(([x, y, r], i) => out.push(xegCube(p, x, y, 12, r, '#ef7f30', { seed: i })));
        const cs = xegSpots('bes-c', 22, 64, 17);
        xegSpots('bes-p', 140, 68, 7.6).forEach(([x, y]) => { if (cs.every(([u, v]) => Math.hypot(u - x, v - y) > 9)) out.push(xegPea(p, x, y, 8.4)); });
        out.push('</g>');
        out.push(`<g opacity=".25">${K.pool(p, 100, 100, 120, '#c9552e', { seed: 3, op: .6 })}</g>`);
        out.push(xegShine(100, 100, 74, .4));
        return out.join('');
    },

    // sabanekh: stewed chopped spinach with garlic, coriander and ghee
    eg_sabanekh: p => {
        const out = [K.bowl(p, { glaze: '#b9a27a', inside: '#f1ebdc' }), K.liquid(p, { R: 74, c: '#2f4a1a', op: 1, shine: false })];
        const R = rng('sabl');
        const lv = ['', '', '', ''];
        for (let i = 0; i < 60; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 66, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; lv[i % 4] += smooth(ring(4 + R() * 5, 7, .55, R, 1.4, .7).map(([u, v]) => [u + x, v + y])); }
        out.push(lv.map((d, i) => `<path d="${d}" fill="${['#3d5e20', '#4a7026', '#2a4416', '#56802c'][i]}" stroke="#1f3410" stroke-width=".4"/>`).join(''));
        for (let i = 0; i < 12; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 60; out.push(`<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, R() * 180)} d="M-5,0 L5,0" stroke="#8ab05a" stroke-width="1.6" stroke-linecap="round"/>`); }
        out.push(xegGarlic(p, 100, 100, 90, { n: 26, c: '#e8c060' }));
        out.push(xegOil(p, 100, 100, 120, { n: 9, c: '#e0b83a', op: .55, rmax: 2.2 }));
        out.push(xegShine(100, 100, 74, .4));
        return out.join('');
    },

    // arnabeet: battered, fried cauliflower florets with lemon and a little tahina
    eg_arnabeet: p => {
        const out = [K.plate(p, { rim: '#c7a14a' })];
        out.push(`<g ${T(138, 140)}><g ${p.sh(1)}><circle r="22" fill="${p.rg('#f4f1ea', .2, .15)}"/></g><circle r="17" fill="${p.rg('#e6d3a6', .25, .2)}"/>${xegSwirl(0, 0, 14, '#c9b07a', 1.4, .7)}</g>`);
        [[70, 66], [108, 56], [142, 84], [56, 104], [94, 94], [128, 112], [72, 140], [104, 134], [44, 76], [150, 54]].forEach(([x, y], i) => out.push(xegCauli(p, x, y, 40, i * 37, { c: i % 2 ? '#cf8a34' : '#dc9a40', fried: true, seed: i })));
        out.push(K.lemon(p, 160, 104, 26, 80), K.lemon(p, 44, 136, 24, -110));
        out.push(xegHerb(p, 100, 100, 100, { n: 10, seed: 4 }));
        return out.join('');
    },

    // hummus: smooth chickpea and tahini spread with a swirled well, olive oil, paprika, whole chickpeas, parsley
    eg_hummus: p => {
        const out = [K.plate(p, { R: 92, well: .8, rim: '#2c5c7c' })];
        out.push(`<g ${p.sh(.6)}><path d="${smooth(ring(72, 16, .05, rng('hum'), 1, .97))}" transform="translate(100 100)" fill="${p.rg('#e6cf9c', .3, .2)}"/></g>`);
        out.push(xegSwirl(100, 100, 64, '#c2a066', 4, .7, 1.4), xegSwirl(98, 98, 64, '#f6e8c4', 1.6, .85, 1.4));
        out.push(K.pool(p, 100, 100, 58, '#c9a028', { op: .7, seed: 3 }));
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#c4381a', n: 50, r: 1 }));
        out.push(`<g ${p.sh(.5)}>`);
        [[96, 92], [108, 98], [90, 106], [102, 110], [112, 86], [84, 94]].forEach(([x, y]) => out.push(xegChickpea(p, x, y, 11)));
        out.push('</g>');
        out.push(xegHerb(p, 100, 100, 60, { n: 16, seed: 5 }));
        return out.join('');
    },

    // gebna bel tamatem: crumbled white domiati cheese with diced tomato, chili, onion and olive oil
    eg_gebnatamatem: p => {
        const out = [K.kobachi(p, { glaze: '#c9b04a', inside: '#f3f0e6' })];
        out.push(`<circle cx="100" cy="100" r="72" fill="${p.rg('#ece2c4', .2, .2)}"/>`);
        out.push(`<g ${p.sh(.5)}>`);
        const gs = xegSpots('gebna', 48, 64, 11);
        gs.forEach(([x, y, r], i) => { if (i % 3 !== 1) out.push(xegCrumble(p, x, y, 17, r, { seed: i, c: '#f3ecd6' })); });
        gs.forEach(([x, y, r], i) => { if (i % 3 === 1) out.push(xegDice(p, x, y, 12, r, 'tom')); });
        out.push('</g>');
        xegSpots('gebna-o', 8, 60, 18).forEach(([x, y, r]) => out.push(xegDice(p, x, y, 8, r, 'oni')));
        [[86, 80], [120, 106], [92, 126], [126, 76], [68, 106]].forEach(([x, y]) => out.push(xegPepRing(p, x, y, 8, 0, { c: '#3f8a2a' })));
        out.push(xegOil(p, 100, 100, 120, { n: 12, c: '#d9c03a', op: .65, rmax: 2.4 }));
        out.push(K.sprinkle(p, 100, 100, 100, { c: '#6a7a3a', n: 18, r: .7 }));
        return out.join('');
    },

    // banger: cubed beetroot with sliced onion, lemon, garlic and cumin
    eg_banger: p => {
        const out = [K.bowl(p, { glaze: '#e8e2d6', inside: '#f8f4ec' })];
        out.push(`<circle cx="100" cy="100" r="72" fill="${p.rg('#8a1f3a', .15, .3)}" opacity=".6"/>`);
        out.push(`<g ${p.sh(.6)}>`);
        xegSpots('banger', 38, 64, 14.5).forEach(([x, y, r], i) => out.push(xegCube(p, x, y, 17, r, i % 2 ? '#9a1f48' : '#86163c', { seed: i })));
        out.push('</g>');
        xegSpots('banger-o', 10, 58, 18).forEach(([x, y, r]) => out.push(xegOnion(p, x, y, 16, r, { c: '#f2d6e2' })));
        out.push(xegHerb(p, 100, 100, 110, { n: 16, seed: 2 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#8a4a1a', n: 12, r: .6 }));
        return out.join('');
    },

    // koronb salad: finely shredded cabbage with grated carrot and green pepper, lemon dressing
    eg_koronb: p => [
        K.bowl(p, { glaze: '#4f7a5a', inside: '#f3f2ea' }),
        xegCabbage(p, 100, 100, 148, { seed: 1, n: 175 }),
        `<g ${p.sh(.4)}>${K.shreds(p, 100, 100, 160, { c: '#f0802e', n: 40, w: 1.8, len: .14, seed: 3 })}</g>`,
        `<g ${p.sh(.4)}>${K.shreds(p, 100, 100, 160, { c: '#4f9a32', n: 16, w: 2.2, len: .12, seed: 5 })}</g>`,
        K.sprinkle(p, 100, 100, 100, { c: '#8a4a1a', n: 10, r: .6 }),
        K.lemon(p, 140, 142, 26, -30),
    ].join(''),

    // salatet felfel: roasted, peeled pepper strips (green and red) with tomato and garlic
    eg_felfel: p => {
        const out = [K.plate(p, { rim: '#a0522d' })];
        out.push(`<g ${p.sh(.7)}>`);
        xegSpots('felfel', 16, 56, 22).forEach(([x, y, r], i) => out.push(xegRoastStrip(p, x, y, 44, r, { c: i % 3 === 2 ? '#c4321f' : i % 3 ? '#4f8a2c' : '#7a9a3a', seed: i })));
        out.push('</g>');
        out.push(`<g ${p.sh(.4)}>`);
        xegSpots('felfel-t', 12, 56, 18).forEach(([x, y, r]) => out.push(xegDice(p, x, y, 10, r, 'tom')));
        out.push('</g>');
        out.push(xegGarlic(p, 100, 100, 110, { n: 18, c: '#f1e2b0' }));
        out.push(xegOil(p, 100, 100, 120, { n: 10, c: '#d9c03a', op: .5, rmax: 2.2 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#8a4a1a', n: 12, r: .6 }));
        return out.join('');
    },

    // roz bel khalta: spiced rice with liver and mince, topped with toasted almonds, cashews and raisins
    eg_rozbelkhalta: p => {
        const out = [K.plate(p, { rim: '#c7a14a' })];
        out.push(xegRice(p, 100, 102, 150, { tint: '#e2c896', seed: 3, n: 210 }));
        out.push(xegGarlic(p, 100, 100, 130, { n: 50, c: '#7a4a2a', seed: 2 }));
        xegSpots('khalta-l', 8, 58, 22).forEach(([x, y, r], i) => out.push(xegLiver(p, x, y, 14, r, { seed: i, c: '#6a3020' })));
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('khalta-n', 34, 44, 10.5).forEach(([x, y, r], i) => out.push(xegNut(p, x, y, i % 4 === 3 ? 7 : 12, r, ['almond', 'cashew', 'almond', 'raisin'][i % 4])));
        out.push('</g>');
        out.push(xegHerb(p, 100, 100, 130, { n: 10, seed: 3 }));
        return out.join('');
    },

    // tamatem meqaleya: thick tomato slices fried until soft and charred with garlic and chili
    eg_tamatemmeqaleya: p => {
        const out = [xegTasa(p, { c: '#3d3836', inner: '#2a2422' }), `<circle cx="100" cy="100" r="72" fill="${p.rg('#9a2a1a', .15, .3)}" opacity=".9"/>`];
        const sp = [[70, 72], [112, 62], [146, 94], [58, 112], [100, 102], [138, 134], [86, 142]];
        out.push(`<g ${p.sh(.8)}>`);
        sp.forEach(([x, y], i) => out.push(xegTomSlice(p, x, y, 46, i * 40, { cooked: true })));
        out.push('</g>');
        const R = rng('tmch');
        let ch = '';
        for (let i = 0; i < 30; i++){ const [x, y] = sp[i % sp.length]; ch += `<ellipse cx="${f(x + (R() - .5) * 34)}" cy="${f(y + (R() - .5) * 34)}" rx="${f(2 + R() * 5)}" ry="${f(1.5 + R() * 2.5)}" fill="#2a1406" opacity=".55"/>`; }
        out.push(`<g ${xegBlur(p, 1)}>${ch}</g>`);
        out.push(xegGarlic(p, 100, 100, 110, { n: 22, c: '#f0d080' }));
        [[90, 86], [124, 116], [70, 132], [130, 76], [104, 150]].forEach(([x, y]) => out.push(xegPepRing(p, x, y, 8, 0, { c: '#3f8a2a' })));
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#5a2a10', n: 14, r: .7 }));
        out.push(xegOil(p, 100, 100, 130, { n: 8, c: '#e8743a', op: .5, rmax: 2 }));
        return out.join('');
    },

    // pure: smooth mashed potato with spoon swirls, melting butter, black pepper
    eg_pure: p => {
        const out = [K.bowl(p, { glaze: '#5d7f9a', inside: '#f6f2ea' })];
        out.push(`<g ${p.sh(.8)}><path d="${smooth(ring(74, 16, .06, rng('pure'), 1, .97))}" transform="translate(100 100)" fill="${p.rg('#f6e2a8', .3, .18)}"/></g>`);
        out.push(xegSwirl(100, 100, 64, '#d9b86a', 4.4, .6, 2), xegSwirl(98, 97, 64, '#fff6da', 2, .8, 2));
        out.push(`<g ${T(104, 98, 12)}><rect x="-11" y="-9" width="22" height="18" rx="3" fill="${p.g('#f8d860', .3, .2)}" stroke="#d9b02a" stroke-width=".6"/></g>`);
        out.push(K.pool(p, 108, 104, 36, '#f6cc4a', { op: .55, seed: 2 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#2a1406', n: 26, r: .7 }));
        out.push(xegSprig(p, 70, 74, 20, -20));
        return out.join('');
    },

    // macaroni salad: elbow pasta in mayonnaise with diced peppers, cucumber, carrot and white cheese
    eg_salatamakarona: p => {
        const out = [K.bowl(p, { glaze: '#d98a3a', inside: '#f8f4ec' })];
        out.push(`<circle cx="100" cy="100" r="72" fill="${p.rg('#f6ecd0', .2, .15)}"/>`);
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('msal', 46, 64, 11.5).forEach(([x, y, r]) => out.push(xegMac(p, x, y, 20, r, { c: '#f2dc9c' })));
        out.push('</g>');
        out.push(`<g ${p.sh(.4)}>`);
        xegSpots('msal-d', 30, 64, 12).forEach(([x, y, r], i) => {
            const t = i % 5;
            out.push(t === 0 ? xegCube(p, x, y, 8, r, '#d8322a', { seed: i }) : t === 1 ? xegCube(p, x, y, 8, r, '#4f9a32', { seed: i }) : t === 2 ? xegDice(p, x, y, 9, r, 'cuc') : t === 3 ? xegCube(p, x, y, 7, r, '#ef7f30', { seed: i }) : xegCube(p, x, y, 9, r, '#fbf8ee', { seed: i }));
        });
        out.push('</g>');
        out.push(xegHerb(p, 100, 100, 110, { n: 14, seed: 3 }));
        return out.join('');
    },

    // shorbet khodar: orange tomato-vegetable soup with carrot, potato, zucchini and peas
    eg_khodar: p => {
        const out = [K.bowl(p, { glaze: '#6e4b33', inside: '#efe5d3' }), K.liquid(p, { R: 74, c: '#d9783a', op: 1, shine: false })];
        out.push(`<g ${p.sh(.6)}>`);
        xegSpots('khodar', 30, 60, 15).forEach(([x, y, r], i) => {
            const t = i % 4;
            out.push(t === 0 ? xegCube(p, x, y, 14, r, '#ef7f30', { seed: i }) : t === 1 ? xegCube(p, x, y, 16, r, '#efd38e', { seed: i, op: .95 }) : t === 2 ? xegZuc(p, x, y, 17, r, { cooked: true }) : xegCube(p, x, y, 11, r, '#f2e6c0', { seed: i, op: .8 }));
        });
        out.push('</g>');
        xegSpots('khodar-p', 18, 62, 9).forEach(([x, y]) => out.push(xegPea(p, x, y, 7)));
        out.push(xegOil(p, 100, 100, 120, { n: 10, c: '#f0a040', op: .55, rmax: 2 }));
        out.push(xegHerb(p, 100, 100, 110, { n: 18, seed: 2 }));
        out.push(xegShine(100, 100, 74, .4));
        return out.join('');
    },

    // shorbet shaariya: clear golden beef broth with toasted vermicelli and small pieces of beef, lemon
    eg_shaariya: p => {
        const out = [xegSoupBowl(p, '#8a5a2e'), K.liquid(p, { R: 76, c: '#d6a24c', op: .95, shine: false })];
        out.push(`<circle cx="96" cy="94" r="50" fill="#ebc070" opacity=".35"/>`);
        out.push(xegVermicelli(p, 100, 100, 136, { n: 130, seed: 1, c1: '#b8742c', c2: '#d89a48' }));
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('shaar-b', 11, 56, 20).forEach(([x, y, r], i) => out.push(xegBeef(p, x, y, 16, r, { c: '#8e5c3a', seed: i })));
        out.push('</g>');
        out.push(xegOil(p, 100, 100, 130, { n: 14, c: '#f2c64a', op: .65, rmax: 2.6 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#2a1406', n: 14, r: .6 }));
        out.push(K.lemon(p, 138, 142, 28, -30));
        out.push(xegShine(100, 100, 76, .45));
        return out.join('');
    },

    // shorbet freekeh: cloudy broth thick with smoky green-brown cracked freekeh, shredded chicken, lemon
    eg_freekeh: p => {
        const out = [K.bowl(p, { glaze: '#7a5a3a', inside: '#efe5d3' }), K.liquid(p, { R: 74, c: '#a8854f', op: 1, shine: false })];
        out.push(xegGrains(p, 100, 100, 142, { n: 170, c: '#8a904a', L: 2.6, w: 2.3, seed: 1 }));
        out.push(xegGrains(p, 100, 100, 142, { n: 100, c: '#b39a58', L: 2.4, w: 2.3, seed: 2 }));
        out.push(`<g ${p.sh(.4)}>`);
        xegSpots('frk', 7, 48, 24).forEach(([x, y, r], i) => out.push(xegShred(p, x, y, 18, r, { seed: i })));
        out.push('</g>');
        out.push(xegOil(p, 100, 100, 120, { n: 8, c: '#e8b84a', op: .55, rmax: 2 }));
        out.push(xegHerb(p, 100, 100, 100, { n: 14, seed: 3 }));
        out.push(K.lemon(p, 136, 140, 26, -30));
        out.push(xegShine(100, 100, 74, .35));
        return out.join('');
    },

    // kawarea: rich, pale, gelatinous trotter broth with soft meat pieces and chickpeas, lemon on the side
    eg_kawarea: p => {
        const out = [K.bowl(p, { glaze: '#a7adb4', inside: '#8d939a', lip: .9 }), K.liquid(p, { R: 76, c: '#e0d2ae', op: 1, shine: false })];
        out.push(`<circle cx="94" cy="92" r="50" fill="#f2e8cc" opacity=".45"/>`);
        out.push(xegTrotter(p, 80, 82, 34, -20, { seed: 1 }), xegTrotter(p, 124, 86, 30, 30, { seed: 2 }), xegTrotter(p, 100, 124, 34, 10, { seed: 3 }), xegTrotter(p, 66, 118, 26, 60, { seed: 4 }));
        out.push(`<g ${p.sh(.4)}>`);
        xegSpots('kaw-c', 16, 62, 11).forEach(([x, y]) => { if ([[80, 82], [124, 86], [100, 124], [66, 118]].every(([u, v]) => Math.hypot(u - x, v - y) > 18)) out.push(xegChickpea(p, x, y, 10)); });
        out.push('</g>');
        out.push(xegOil(p, 100, 100, 130, { n: 16, c: '#f2d27a', op: .7, rmax: 3 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#2a1406', n: 16, r: .6 }));
        out.push(K.lemon(p, 140, 136, 26, -30));
        out.push(xegShine(100, 100, 76, .5));
        return out.join('');
    },

    // Alexandrian fish soup: spiced tomato-onion broth with chunks of white fish, coriander and lemon, clay bowl
    eg_shorbetsamak: p => {
        const out = [xegTagen(p, { c: '#a85a34' }), K.liquid(p, { R: 76, c: '#b4582e', op: 1, shine: false })];
        out.push(xegMottle(p, 100, 100, 130, '#b4582e', { n: 12, op: .4 }));
        out.push(`<g opacity=".8">`);
        xegSpots('fsoup-o', 8, 60, 20).forEach(([x, y, r]) => out.push(xegOnion(p, x, y, 16, r, { c: '#e8b880' })));
        out.push('</g>');
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('fsoup-t', 8, 60, 20).forEach(([x, y, r], i) => out.push(xegTomChunk(p, x, y, 13, r, { seed: i })));
        out.push('</g>');
        out.push(xegFishChunk(p, 78, 84, 36, -20, { c: '#f6ecdc', seed: 1 }), xegFishChunk(p, 122, 80, 34, 30, { c: '#f6ecdc', seed: 2 }), xegFishChunk(p, 112, 122, 36, 10, { c: '#f6ecdc', seed: 3 }), xegFishChunk(p, 74, 124, 30, 70, { c: '#f6ecdc', seed: 4 }));
        out.push(xegOil(p, 100, 100, 130, { n: 10, c: '#e8823a', op: .55, rmax: 2.4 }));
        out.push(xegSprig(p, 100, 100, 18, 20), xegSprig(p, 140, 104, 16, -30), xegHerb(p, 100, 100, 110, { n: 16, seed: 3, c: '#3f8f2e' }));
        out.push(K.lemon(p, 64, 66, 22, 150));
        out.push(xegShine(100, 100, 76, .4));
        return out.join('');
    },

    // ads bigebba: thick brown-lentil soup, whole lentils, fried onion on top, lemon
    eg_adsbigebba: p => {
        const out = [K.bowl(p, { glaze: '#3f6f8f', inside: '#f3eee4' }), K.liquid(p, { R: 74, c: '#7a5232', op: 1, shine: false })];
        out.push(xegMottle(p, 100, 100, 130, '#7a5232', { n: 14, op: .45 }));
        out.push(xegLentils(p, 100, 100, 140, { n: 190, seed: 1, c: '#6a4426' }));
        out.push(xegCrispy(p, 96, 94, 54, { n: 26 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#a8501a', n: 14, r: .7 }));
        out.push(xegOil(p, 100, 100, 120, { n: 8, c: '#d9a43a', op: .5, rmax: 2 }));
        out.push(K.lemon(p, 136, 140, 28, -30));
        out.push(xegShine(100, 100, 74, .4));
        return out.join('');
    },

    // shorbet tamatem: red tomato soup with soft rice and parsley
    eg_tamatem: p => {
        const out = [xegSoupBowl(p, '#b8321e'), K.liquid(p, { R: 76, c: '#c9412a', op: 1, shine: false })];
        out.push(`<circle cx="96" cy="94" r="52" fill="#dc5a3a" opacity=".35"/>`);
        out.push(xegGrains(p, 100, 100, 138, { n: 110, c: '#f6ead2', L: 3.4, w: 2.4, seed: 1 }));
        out.push(xegOil(p, 100, 100, 120, { n: 10, c: '#e8603a', op: .55, rmax: 2.2 }));
        out.push(xegHerb(p, 100, 98, 80, { n: 34, seed: 2 }));
        out.push(xegShine(100, 100, 76, .45));
        return out.join('');
    },

    // kosa soup: pale green blended zucchini soup with milk swirl, a few zucchini slices
    eg_kosa: p => {
        const out = [K.bowl(p, { glaze: '#e9e4d6', inside: '#f8f4ec' }), `<circle cx="100" cy="100" r="80" fill="none" stroke="#6f8a3a" stroke-width="1.6" opacity=".8"/>`, K.liquid(p, { R: 74, c: '#bcc87e', op: 1, shine: false })];
        out.push(xegSwirl(100, 100, 52, '#f6f4e4', 4, .9));
        out.push(`<g ${p.sh(.5)}>`, xegZuc(p, 130, 76, 22, 0), xegZuc(p, 146, 96, 20, 0), xegZuc(p, 124, 94, 18, 0), xegZuc(p, 66, 118, 18, 0), xegZuc(p, 78, 134, 16, 0), '</g>');
        out.push(K.sprinkle(p, 100, 100, 100, { c: '#2a1406', n: 20, r: .6 }));
        out.push(xegHerb(p, 70, 120, 26, { n: 8, seed: 2 }));
        out.push(xegShine(100, 100, 74, .45));
        return out.join('');
    },

    // shorbet shoofan: oat soup thickened with rolled oats, chicken, carrot and tomato
    eg_shoofan: p => {
        const out = [xegSoupBowl(p, '#c7a14a'), K.liquid(p, { R: 76, c: '#d6b07a', op: 1, shine: false })];
        out.push(xegOats(p, 100, 100, 140, { n: 120 }));
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('shoof', 16, 58, 18).forEach(([x, y, r], i) => out.push(i % 2 ? xegCube(p, x, y, 10, r, '#ef7f30', { seed: i }) : xegShred(p, x, y, 18, r, { seed: i })));
        out.push('</g>');
        xegSpots('shoof-t', 6, 56, 18).forEach(([x, y, r]) => out.push(xegDice(p, x, y, 8, r, 'tom')));
        out.push(xegHerb(p, 100, 100, 100, { n: 16, seed: 3 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#9a4a1a', n: 12, r: .6 }));
        out.push(xegShine(100, 100, 76, .4));
        return out.join('');
    },

    // hommos el sham: hot chickpeas in their spiced broth, served in a glass with tomato, chili, parsley and lemon
    eg_hommosesham: p => {
        const out = [xegGlass(p), K.liquid(p, { R: 76, c: '#d6b878', op: .95, shine: false })];
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('hsham', 46, 66, 10.5).forEach(([x, y]) => out.push(xegChickpea(p, x, y, 13)));
        out.push('</g>');
        out.push(`<g ${p.sh(.3)}>`);
        xegSpots('hsham-t', 18, 46, 10).forEach(([x, y, r]) => out.push(xegDice(p, x, y, 8, r, 'tom')));
        out.push('</g>');
        [[92, 96], [112, 108], [104, 84], [84, 114]].forEach(([x, y]) => out.push(xegPepRing(p, x, y, 7, 0, { c: '#3f8a2a' })));
        out.push(xegHerb(p, 100, 100, 70, { n: 22, seed: 3 }));
        out.push(K.sprinkle(p, 100, 100, 80, { c: '#9a4a1a', n: 16, r: .7 }));
        out.push(K.lemon(p, 136, 136, 24, -30));
        out.push(xegShine(100, 100, 76, .5));
        return out.join('');
    },

    // shorbet ful nabit: light broth full of sprouted fava beans, coriander and lemon
    eg_fulnabit: p => {
        const out = [K.bowl(p, { glaze: '#b5bac0', inside: '#9aa0a6', lip: .9 }), K.liquid(p, { R: 76, c: '#c9b47e', op: 1, shine: false })];
        out.push(`<circle cx="94" cy="92" r="50" fill="#ddc994" opacity=".4"/>`);
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('fnab', 26, 62, 17).forEach(([x, y, r]) => out.push(xegFulNabit(p, x, y, 18, r)));
        out.push('</g>');
        out.push(xegOil(p, 100, 100, 120, { n: 8, c: '#e8c44a', op: .55, rmax: 2 }));
        out.push(xegHerb(p, 100, 100, 110, { n: 24, seed: 2, c: '#3f8f2e' }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#9a4a1a', n: 12, r: .6 }));
        out.push(K.lemon(p, 138, 140, 26, -30));
        out.push(xegShine(100, 100, 76, .4));
        return out.join('');
    },

    // kishk: thick warm yogurt soup, topped with shredded chicken and crispy fried onions
    eg_kishk: p => {
        const out = [K.bowl(p, { glaze: '#8a5a3a', inside: '#f3ebdc' }), K.liquid(p, { R: 74, c: '#efe6cf', op: 1, shine: false })];
        out.push(xegMottle(p, 100, 100, 130, '#e6dabc', { n: 14, op: .4 }));
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('kishk', 9, 46, 22).forEach(([x, y, r], i) => out.push(xegShred(p, x, y, 20, r, { seed: i, c: '#efd8b0' })));
        out.push('</g>');
        out.push(xegCrispy(p, 100, 100, 100, { n: 60 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#2a1406', n: 10, r: .5 }));
        out.push(xegShine(100, 100, 74, .45));
        return out.join('');
    },

    // cream of chicken: ivory cream soup with chicken pieces, mushroom slices, croutons and parsley
    eg_kremafirakh: p => {
        const out = [xegSoupBowl(p, '#2c4c7c'), K.liquid(p, { R: 76, c: '#efe3c4', op: 1, shine: false })];
        out.push(xegSwirl(100, 100, 56, '#fbf6ea', 4, .9));
        out.push(`<g ${p.sh(.5)}>`);
        [[78, 80], [120, 82], [86, 120], [124, 118], [100, 100]].forEach(([x, y], i) => out.push(xegShred(p, x, y, 22, i * 40, { seed: i, c: '#efd6ae' })));
        out.push(xegMushSlice(p, 100, 66, 20, 10), xegMushSlice(p, 140, 102, 18, 60), xegMushSlice(p, 62, 104, 18, -30));
        out.push(xegCrouton(p, 104, 136, 12, 20), xegCrouton(p, 70, 138, 11, -10), xegCrouton(p, 138, 132, 11, 35));
        out.push('</g>');
        out.push(xegHerb(p, 100, 100, 100, { n: 20, seed: 4 }));
        out.push(K.sprinkle(p, 100, 100, 100, { c: '#5a4a3a', n: 10, r: .5 }));
        out.push(xegShine(100, 100, 76, .5));
        return out.join('');
    },

    // cream of mushroom: beige-brown creamy soup full of sliced mushrooms, cream swirl
    eg_mashroom: p => {
        const out = [K.bowl(p, { glaze: '#5a3a26', inside: '#efe5d3' }), K.liquid(p, { R: 74, c: '#b8987a', op: 1, shine: false })];
        out.push(xegSwirl(100, 100, 50, '#f3ebdc', 3.6, .85));
        out.push(`<g ${p.sh(.5)}>`);
        xegSpots('mush', 14, 60, 20).forEach(([x, y, r]) => out.push(xegMushSlice(p, x, y, 22, r, { c: '#e6d2b0', edge: '#8a6a48' })));
        out.push('</g>');
        out.push(xegHerb(p, 100, 100, 90, { n: 16, seed: 4 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#2a1406', n: 14, r: .5 }));
        out.push(xegShine(100, 100, 74, .45));
        return out.join('');
    },

    // pumpkin soup: smooth orange cream with a white swirl, pumpkin seeds and pepper
    eg_qar3: p => {
        const out = [K.bowl(p, { glaze: '#2f4a5a', inside: '#f3eee4' }), K.liquid(p, { R: 74, c: '#e0892c', op: 1, shine: false })];
        out.push(`<circle cx="96" cy="94" r="48" fill="#f0a446" opacity=".4"/>`);
        out.push(xegSwirl(100, 100, 46, '#fbf1df', 4.4, .95, 1.4));
        [[92, 92, 30], [108, 102, -20], [102, 88, 80], [94, 108, 140], [112, 92, 10]].forEach(([x, y, r]) => out.push(`<g ${T(x, y, r)}><ellipse rx="3.6" ry="2" fill="${p.g('#6f8a3a', .3, .25)}" stroke="#46601e" stroke-width=".4"/></g>`));
        out.push(K.sprinkle(p, 100, 100, 100, { c: '#2a1406', n: 18, r: .6 }));
        out.push(xegShine(100, 100, 74, .45));
        return out.join('');
    },

    // khobeiza: dark green mallow-leaf soup with rice, sizzled garlic and coriander in ghee, clay bowl
    eg_khobeiza: p => {
        const out = [xegTagen(p, { c: '#9a5232' }), K.liquid(p, { R: 76, c: '#4a6a26', op: 1, shine: false })];
        const R = rng('khob');
        const lv = ['', '', ''];
        for (let i = 0; i < 40; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 66, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; lv[i % 3] += smooth(ring(3 + R() * 4, 7, .55, R, 1.3, .8).map(([u, v]) => [u + x, v + y])); }
        out.push(lv.map((d, i) => `<path d="${d}" fill="${['#3a5a1c', '#5a7e2a', '#2f4a16'][i]}" opacity=".9"/>`).join(''));
        out.push(xegGrains(p, 100, 100, 130, { n: 50, c: '#e6e2c0', L: 3, w: 2, seed: 2 }));
        out.push(xegGarlic(p, 98, 96, 70, { n: 30, c: '#e0a83a' }));
        out.push(xegOil(p, 100, 100, 120, { n: 12, c: '#e6b83a', op: .6, rmax: 2.4 }));
        out.push(xegShine(100, 100, 76, .45));
        return out.join('');
    },

    // creamy seafood soup: blush-pink cream with shrimp, squid rings and white fish, parsley and lemon
    eg_seafood: p => {
        const out = [K.bowl(p, { glaze: '#2f6f6a', inside: '#f3eee4' }), K.liquid(p, { R: 74, c: '#ebbd92', op: 1, shine: false })];
        out.push(xegSwirl(100, 100, 50, '#f8e2c8', 3, .7));
        out.push(`<g ${p.sh(.6)}>`);
        [[78, 76, 20], [126, 84, -60], [104, 126, 140], [70, 116, 80], [136, 122, 30]].forEach(([x, y, r]) => out.push(K.shrimp(p, x, y, 26, r, { c: '#f07a50' })));
        [[102, 66], [100, 98], [140, 100], [80, 140], [62, 92]].forEach(([x, y], i) => out.push(K.squidRing(p, x, y, 15, i * 40)));
        out.push(xegFishChunk(p, 118, 106, 22, 20, { c: '#f8f0e2', seed: 1 }), xegFishChunk(p, 86, 98, 20, -30, { c: '#f8f0e2', seed: 2 }));
        out.push('</g>');
        out.push(xegHerb(p, 100, 100, 110, { n: 18, seed: 3 }));
        out.push(K.lemon(p, 60, 62, 22, 150));
        out.push(xegShine(100, 100, 74, .45));
        return out.join('');
    },

    // cream of broccoli: green blended soup with small florets, cream and grated cheese
    eg_broccoli: p => {
        const out = [xegSoupBowl(p, '#4f7a3a'), K.liquid(p, { R: 76, c: '#7f9a3e', op: 1, shine: false })];
        out.push(xegSwirl(100, 100, 48, '#f2efdc', 3.4, .85));
        out.push(K.broccoli(p, 80, 78, 22, -10), K.broccoli(p, 124, 80, 20, 20), K.broccoli(p, 132, 120, 22, 40), K.broccoli(p, 76, 124, 20, -30));
        const R = rng('brch');
        let ch = '';
        for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 22, x = 102 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; ch += `<rect ${T(x, y, R() * 180)} x="-2.6" y="-.7" width="5.2" height="1.4" rx=".7" fill="${R() < .5 ? '#f6d672' : '#f2c24a'}"/>`; }
        out.push(ch);
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#2a1406', n: 12, r: .5 }));
        out.push(xegShine(100, 100, 76, .45));
        return out.join('');
    },

    // beef and vegetable soup: tomato-tinted broth with beef cubes, potato, carrot and zucchini, metal pot
    eg_lahmakhodar: p => {
        const out = [K.bowl(p, { glaze: '#a7adb4', inside: '#8d939a', lip: .9 }), K.liquid(p, { R: 76, c: '#c8763a', op: 1, shine: false })];
        out.push(`<g ${p.sh(.6)}>`);
        xegSpots('lkh', 26, 60, 16).forEach(([x, y, r], i) => {
            const t = i % 4;
            out.push(t === 0 ? xegBeef(p, x, y, 18, r, { c: '#7a4024', seed: i }) : t === 1 ? xegCube(p, x, y, 15, r, '#efd38e', { seed: i }) : t === 2 ? xegCube(p, x, y, 13, r, '#ef7f30', { seed: i }) : xegZuc(p, x, y, 17, r, { cooked: true }));
        });
        out.push('</g>');
        out.push(xegOil(p, 100, 100, 130, { n: 14, c: '#e8a040', op: .6, rmax: 2.4 }));
        out.push(xegHerb(p, 100, 100, 100, { n: 14, seed: 2 }));
        out.push(xegShine(100, 100, 76, .4));
        return out.join('');
    },

    // green pea soup: bright pea-green cream with croutons, a few whole peas and mint
    eg_besella: p => {
        const out = [K.bowl(p, { glaze: '#c9a46a', inside: '#f6f2ea' }), K.liquid(p, { R: 74, c: '#8fb03c', op: 1, shine: false })];
        out.push(xegSwirl(100, 100, 46, '#f3f0dd', 3.4, .85));
        out.push(xegCrouton(p, 96, 92, 14, 15), xegCrouton(p, 116, 104, 13, -20), xegCrouton(p, 88, 114, 13, 35), xegCrouton(p, 112, 82, 12, 5), xegCrouton(p, 128, 92, 12, 40), xegCrouton(p, 102, 120, 12, -10));
        [[70, 80], [74, 90], [66, 92], [136, 128], [130, 136], [140, 120]].forEach(([x, y]) => out.push(xegPea(p, x, y, 8, { c: '#7aba3a' })));
        out.push(xegSprig(p, 64, 128, 18, -20, { c: '#3f9a4a' }));
        out.push(xegShine(100, 100, 74, .45));
        return out.join('');
    },
};
