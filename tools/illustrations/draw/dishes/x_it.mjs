// World edition: Italy (it_) — hand-drawn redraw of the template dishes (soups, mains, sides)
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// helpers for this file (xit = redraw Italy). Copied from w_it.mjs / z_soup.mjs and extended
// =========================================================
function xitSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function xitOutline(p, c, r = .55){
    const id = p.def('xitOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const xitBlur = (p, s = 2) => `filter="url(#${p.def('xitbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const xitShine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// soup surface shine arc
const xitArc = (R, op = .4, w = 1.8) => xitShine(`M${f1(100 - R * .74)},${f1(100 - R * .1)} A${R * .8},${R * .8} 0 0 1 ${f1(100 - R * .3)},${f1(100 - R * .72)}`, w, op);

// draw a shape once in <defs> and place copies with <use> (keeps the SVG small)
const xitU = (p, key, mk) => { const id = p.def('u' + key, id => `<g id="${id}">${mk()}</g>`); return (x, y, r = 0, k = 1) => `<use href="#${id}" ${T(f1(x), f1(y), Math.round(r), f1(k * 100) / 100)}/>`; };
// spots: evenly scattered positions
function xitSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xitspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// sauce surface of irregular shape
function xitSauce(p, x, y, s, c, { seed = 1, sy = .9, op = 1, j = .14 } = {}){
    const R = rng(p.id + 'xsc' + seed);
    return `<path ${T(x, y)} d="${xitSm(ring(s / 2, 11, j, R, 1, sy), true)}" fill="${p.rg(c, .2, .25, .42, .4)}" opacity="${op}"/>`;
}

// ---------- vessels ----------
const xitPlate = (p, o = {}) => K.plate(p, { rim: '#c8b27a', ...o });
// soup plate (piatto fondo): wide rim, deep well r=70
function xitSoupPlate(p, { base = '#fbf9f4', line = '#c8b27a' } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="95" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="91" fill="none" stroke="${line}" stroke-width="1.6" opacity=".85"/>
        <circle cx="100" cy="100" r="72" fill="none" stroke="${dk(base, .14)}" stroke-width="4" opacity=".4"/>
        <circle cx="100" cy="100" r="70" fill="${p.rg(base, .05, .24, .62, .64)}"/>
        <path d="M30,60 A80,80 0 0 1 62,28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// glazed ceramic bowl (inner r = 80)
const xitBowl = (p, glaze, inside = '#fbf7ee') => K.bowl(p, { glaze, inside });
// olive-wood bowl (inner r = 80)
function xitWoodBowl(p){
    const R = rng(p.id + 'wood');
    let grain = '';
    for (let i = 0; i < 7; i++){ const rr = 84 + R() * 6, a = R() * 6.28, sw = .6 + R() * .8; grain += `<path d="M${f1(100 + Math.cos(a) * rr)},${f1(100 + Math.sin(a) * rr)} A${rr},${rr} 0 0 1 ${f1(100 + Math.cos(a + sw) * rr)},${f1(100 + Math.sin(a + sw) * rr)}" stroke="#6e4524" stroke-width=".8" fill="none" opacity=".45"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="93" fill="${p.rg('#b07a45', .25, .25, .35, .3)}"/></g>${grain}
        <circle cx="100" cy="100" r="80" fill="${p.rg('#d6a56a', .12, .35, .64, .66)}"/>
        <path d="M30,62 A78,78 0 0 1 64,28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// rectangular ovenproof dish (teglia), inner 160x132
function xitBakingDish(p, { line = '#b9472f', base = '#f3ede0' } = {}){
    return `<g ${p.sh(1.8)}><rect x="6" y="20" width="188" height="160" rx="26" fill="${p.rg(base, .2, .18, .35, .3)}"/></g>
        <rect x="10" y="24" width="180" height="152" rx="23" fill="none" stroke="${line}" stroke-width="2.4" opacity=".85"/>
        <rect x="20" y="34" width="160" height="132" rx="16" fill="${p.rg(dk(base, .06), .06, .25, .6, .6)}"/>
        <path d="M16,60 Q16,30 46,28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// terracotta casserole (coccio) with two lug handles, inner r = 74
function xitCoccio(p, { c = '#b8643a', inside = '#8a4426' } = {}){
    const lug = x => `<rect x="${x - 9}" y="88" width="18" height="24" rx="8" fill="${p.g(c, .2, .3)}" stroke="${dk(c, .3)}" stroke-width=".8"/>`;
    return `<g ${p.sh(1.8)}>${lug(10)}${lug(190)}<circle cx="100" cy="100" r="86" fill="${p.rg(c, .22, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="84" fill="none" stroke="${lt(c, .3)}" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="76" fill="${p.rg(inside, .1, .3, .62, .64)}"/>
        <path d="M32,62 A76,76 0 0 1 64,30" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".45"/>`;
}
// iron / non-stick pan with a short handle (inner r = 76)
function xitPan(p, { c = '#34302e' } = {}){
    return `<g ${p.sh(2)}><rect x="170" y="91" width="30" height="18" rx="7" fill="${p.g('#2a2524', .25, .3)}"/><circle cx="100" cy="100" r="86" fill="${p.rg(c, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#5a5452" stroke-width="1.4" opacity=".8"/>
        <circle cx="100" cy="100" r="77" fill="${p.rg('#26211f', .1, .2, .62, .64)}"/>
        <path d="M30,64 A78,78 0 0 1 64,28" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".3"/>`;
}
// round olive-wood board
function xitBoard(p){
    const R = rng(p.id + 'brd');
    let grain = '';
    for (let i = 0; i < 9; i++){ const y = 24 + i * 17 + (R() - .5) * 6, w = Math.sqrt(Math.max(0, 88 * 88 - (y - 100) ** 2)) * .9; grain += `<path d="M${f1(100 - w)},${f1(y)} Q100,${f1(y + (R() - .5) * 10)} ${f1(100 + w)},${f1(y + (R() - .5) * 4)}" stroke="#8a5a30" stroke-width=".8" fill="none" opacity=".35"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="93" fill="${p.rg('#c99a62', .2, .3, .35, .3)}"/></g>${grain}
        <circle cx="100" cy="100" r="90" fill="none" stroke="#9a6a3a" stroke-width="1.2" opacity=".6"/>
        <path d="M28,62 A80,80 0 0 1 62,26" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".4"/>`;
}

// ---------- pasta ----------
// spaghetti / tagliatelle twirled into a nest
function xitPasta(p, x, y, s, { c = '#f0d58e', w = 2.2, n = 40, seed = 1, sy = .92, outline = null, layers = 5 } = {}){
    const R = rng(p.id + 'xPs' + seed);
    const ol = xitOutline(p, outline || dk(c, .3), .5);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.18 + Math.sqrt(R()) * .8), a0 = R() * 6.28, sweep = 1.4 + R() * 2.4;
        const cx = x + (R() - .5) * s * .1, cy = y + (R() - .5) * s * .1;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .18); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const m = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2);
        L[i % layers][m < -.4 ? 1 : m > .8 ? 2 : 0] += xitSm(pts);
    }
    const base = `<path ${T(x, y)} d="${xitSm(ring(s / 2 * .9, 12, .12, R, 1, sy), true)}" fill="${dk(c, .2)}"/>`;
    const body = L.map(([a, b, d]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${dk(c, .1)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .25)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`).join('');
    return `<g ${p.sh(.9)}>${base}${body}</g>`;
}
// penne / rigatoni: tube seen from the side, slanted (penne) or straight (rigatoni) ends, ridges
function xitTube(p, x, y, L, W, r = 0, o = {}){ return xitU(p, 'tb' + L + W + JSON.stringify(o), () => xitTube0(p, 0, 0, L, W, 0, o))(x, y, r); }
function xitTube0(p, x, y, L, W, r = 0, { c = '#eec774', slant = .5, coat = null } = {}){
    const h = W / 2, s = W * slant;
    const d = `M${f1(-L / 2 + s)},${-h} L${L / 2},${-h} L${f1(L / 2 - s)},${h} L${-L / 2},${h}Z`;
    const deg = f1(Math.atan2(s, W) * 57.3);
    let rid = '';
    for (let i = 1; i < 4; i++) rid += `M${f1(-L / 2 + s * (1 - i / 4) + 2)},${f1(-h + i * W / 4)} L${f1(L / 2 - s * i / 4 - 2)},${f1(-h + i * W / 4)}`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .32)}" stroke-width=".7" stroke-linejoin="round"/>
        <path d="${rid}" stroke="${dk(c, .18)}" stroke-width=".7" opacity=".7"/>
        ${coat ? `<path d="M${f1(-L * .2)},${-h} Q0,${f1(h * .4)} ${f1(L * .25)},${f1(-h * .2)}" stroke="${coat}" stroke-width="${f1(W * .5)}" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}
        <ellipse cx="${f1(L / 2 - s / 2 - .3)}" cy="0" rx="${f1(W * .2)}" ry="${f1(h * .86)}" transform="rotate(${deg} ${f1(L / 2 - s / 2 - .3)} 0)" fill="${dk(c, .45)}"/>
        <path d="M${f1(-L / 2 + s + 1.5)},${f1(-h + 1.3)} L${f1(L / 2 - 3)},${f1(-h + 1.3)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// trofie: short twisted spindle
function xitTrofia(p, x, y, s, r = 0, o = {}){ return xitU(p, 'tf' + s + JSON.stringify(o), () => xitTrofia0(p, 0, 0, s, 0, o))(x, y, r); }
function xitTrofia0(p, x, y, s, r = 0, { c = '#e8cf86' } = {}){
    const a = s / 2, b = s * .17;
    return `<g ${T(x, y, r)}><path d="M${-a},0 Q${f1(-a / 2)},${f1(-b * 1.5)} 0,${-b} Q${f1(a / 2)},${f1(-b * .8)} ${a},0 Q${f1(a / 2)},${f1(b * 1.4)} 0,${b} Q${f1(-a / 2)},${f1(b * .8)} ${-a},0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f1(-a * .5)},${f1(-b * .9)} q2,${f1(b)} -.6,${f1(b * 1.8)} M0,${f1(-b)} q2,${f1(b)} -.6,${f1(b * 2)} M${f1(a * .5)},${f1(-b * .8)} q1.6,${f1(b * .8)} -.4,${f1(b * 1.6)}" stroke="${dk(c, .3)}" stroke-width=".7" fill="none"/></g>`;
}
// potato gnocco: ridged oval
function xitGnocco(p, x, y, s, r = 0, o = {}){ return xitU(p, 'gn' + s + JSON.stringify(o), () => xitGnocco0(p, 0, 0, s, 0, o))(x, y, r); }
function xitGnocco0(p, x, y, s, r = 0, { c = '#f1d898' } = {}){
    const a = s / 2, b = s * .34;
    return `<g ${T(x, y, r)}><ellipse rx="${a}" ry="${f1(b)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        <path d="M${f1(-a * .5)},${f1(-b * .7)} v${f1(b * 1.4)} M0,${f1(-b * .85)} v${f1(b * 1.7)} M${f1(a * .5)},${f1(-b * .7)} v${f1(b * 1.4)}" stroke="${dk(c, .2)}" stroke-width="1" opacity=".75"/>
        <path d="M${f1(-a * .7)},${f1(-b * .3)} Q${f1(-a * .4)},${f1(-b * .8)} 0,${f1(-b * .75)}" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/></g>`;
}
// creamy risotto: blob with glossy rice grains
function xitRisotto(p, x, y, s, { c = '#efdcae', n = 110, seed = 1, sy = .94 } = {}){
    const R = rng(p.id + 'xris' + seed);
    const gL = xitU(p, 'rgL' + c, () => `<ellipse rx="2.9" ry="1.5" fill="${lt(c, .5)}" stroke="${dk(c, .18)}" stroke-width=".45"/>`);
    const gD = xitU(p, 'rgD' + c, () => `<ellipse rx="2.9" ry="1.5" fill="${lt(c, .22)}" stroke="${dk(c, .18)}" stroke-width=".45"/>`);
    let g = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .92, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        g += ((gx - x + gy - y) < 0 ? gL : gD)(gx, gy, Math.round(R() * 180));
    }
    return `<g ${p.sh(.9)}><path ${T(x, y)} d="${xitSm(ring(s / 2, 12, .1, R, 1, sy), true)}" fill="${p.rg(c, .18, .2, .4, .38)}" stroke="${dk(c, .2)}" stroke-width=".8"/></g>${g}`;
}

// ---------- bread, herbs, fruit ----------
function xitBreadSlice(p, x, y, w, h, r = 0, { seed = 1, crust = '#b46e2c', crumb = '#f2deb2', holes: nh = 14 } = {}){
    const R = rng(p.id + 'xbs' + seed);
    const pts = ring(1, 12, .1, R, w / 2, h / 2).map(([a, b]) => [a, b > 0 ? b * .9 : b * 1.05]);
    let holes = '';
    for (let i = 0; i < nh; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * .7, hx = f1(Math.cos(a) * d * w / 2), hy = f1(Math.sin(a) * d * h / 2); holes += `<ellipse cx="${hx}" cy="${hy}" rx="${f1(.8 + R() * 2)}" ry="${f1(.6 + R() * 1.3)}" fill="${dk(crumb, .2)}" opacity=".7"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${xitSm(pts, true)}" fill="${p.g(crust, .3, .3)}" stroke="${dk(crust, .35)}" stroke-width=".7"/></g>
        <path d="${xitSm(pts.map(([a, b]) => [a * .86, b * .84]), true)}" fill="${p.rg(crumb, .3, .12, .4, .38)}"/>
        ${holes}
        <path d="M${f1(-w * .3)},${f1(-h * .22)} Q${f1(-w * .1)},${f1(-h * .34)} ${f1(w * .14)},${f1(-h * .3)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// torn bread chunk (panzanella, ribollita): soft crumb with a bit of crust
function xitBreadChunk(p, x, y, s, r = 0, { seed = 1, crumb = '#f0d9a6', crust = '#a8622a', soaked = 0 } = {}){
    return xitU(p, 'bc' + (seed % 3) + crumb + soaked, () => xitBreadChunk0(p, 0, 0, 22, 0, { seed: seed % 3, crumb, crust, soaked }))(x, y, r, s / 22);
}
function xitBreadChunk0(p, x, y, s, r = 0, { seed = 1, crumb = '#f0d9a6', crust = '#a8622a', soaked = 0 } = {}){
    const R = rng('xbc' + seed);
    const pts = ring(s / 2, 8, .35, R, 1.1, .9);
    const cb = mix(crumb, '#c0503a', soaked);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .5)}" fill="${p.g(cb, .3, .25)}" stroke="${dk(cb, .3)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.slice(1, 5), false, .5)}" stroke="${crust}" stroke-width="${f1(s * .2)}" fill="none" stroke-linecap="round"/>
        <path d="${smooth(pts.slice(1, 5), false, .5)}" stroke="${lt(crust, .25)}" stroke-width="${f1(s * .06)}" fill="none" stroke-linecap="round" transform="translate(-.5 -.5)"/>
        <circle cx="${f1(-s * .12)}" cy="${f1(-s * .05)}" r="${f1(s * .07)}" fill="${dk(cb, .2)}"/><circle cx="${f1(s * .12)}" cy="${f1(-s * .14)}" r="${f1(s * .05)}" fill="${dk(cb, .2)}"/><circle cx="${f1(s * .02)}" cy="${f1(s * .16)}" r="${f1(s * .045)}" fill="${dk(cb, .2)}"/><circle cx="${f1(-s * .22)}" cy="${f1(s * .12)}" r="${f1(s * .035)}" fill="${dk(cb, .2)}"/></g>`;
}
function xitBasil(p, x, y, s, r = 0, { c = '#3f9a34' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,0 Q-6,-8.5 3,-7 Q10,-4 10,0 Q10,4 3,7 Q-6,8.5 -10,0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.6 9,0 M-4,-.3 L0,-4.6 M1,-.2 L4.5,-4 M-4,.3 L0,4.6 M1,.2 L4.5,4" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>
        <path d="M-6,-4 Q-1,-6.8 5,-5" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// rocket (rucola) leaf: dark green, deeply lobed
function xitRocket(p, x, y, s, r = 0, { c = '#4f8a2e' } = {}){
    return xitU(p, 'rk' + c, () => `<g ${p.sh(.4)}><path d="M-10,0 Q-9,-2 -7,-1.4 Q-6.4,-4.6 -4,-2.2 Q-2.6,-5.6 0,-2.4 Q2,-6.2 4.4,-2.6 Q7,-5 8,-2 Q11,-1 10,.6 Q7,3.4 3,2.4 Q1,4.6 -1.4,2.4 Q-4,4.4 -5.6,2 Q-8,3 -10,0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/></g><path d="M-9.6,0 Q0,-.4 9,0" stroke="${lt(c, .4)}" stroke-width=".7" fill="none"/>`)(x, y, r, s / 20).replace(/scale\(([\d.]+)\)/, (m, k) => `scale(${k} ${f1(k * 1.5)})`);
}
// ragù: domed mound of browned mince in tomato
function xitRagu(p, x, y, s, { seed = 1, c = '#8e3220' } = {}){
    const R = rng(p.id + 'xrg' + seed);
    const cols = ['#6a2614', '#7f2e18', '#9a3c22', '#b04c2c', '#5c2412'];
    let cr = '';
    for (let i = 0; i < 110; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .9; cr += `<circle cx="${f1(x + Math.cos(a) * d)}" cy="${f1(y + Math.sin(a) * d * .88)}" r="${f1(1.4 + R() * 2)}" fill="${cols[Math.floor(R() * 5)]}"/>`; }
    return `<g ${p.sh(1)}><path ${T(x, y)} d="${xitSm(ring(s / 2, 11, .3, R, 1, .88), true)}" fill="${p.rg(c, .2, .35, .4, .36)}"/></g>${cr}
        <path d="M${f1(x - s * .3)},${f1(y - s * .1)} Q${f1(x - s * .15)},${f1(y - s * .32)} ${f1(x + s * .1)},${f1(y - s * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// sage leaf: grey-green, velvety, oval
function xitSage(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,0 Q-5,-6 4,-5 Q10,-3 10,0 Q10,3 4,5 Q-5,6 -10,0Z" fill="${p.g('#7f9a6a', .25, .3)}" stroke="#55703f" stroke-width=".6"/></g>
        <path d="M-9,0 L9,0 M-4,0 L-1,-3.6 M1,0 L4,-3.4 M-4,0 L-1,3.6 M1,0 L4,3.4" stroke="#b8c9a4" stroke-width=".6" fill="none"/></g>`;
}
// mint leaf: bright, toothed
function xitMint(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.4)}><path d="M-10,0 L-7,-3 L-5,-5 L-2,-5.6 L1,-6.6 L4,-5.4 L7,-4.4 L9,-2 L10,0 L9,2 L7,4.4 L4,5.4 L1,6.6 L-2,5.6 L-5,5 L-7,3Z" fill="${p.g('#4fae3e', .3, .3)}" stroke="#2f7a28" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M-9,0 L9,0 M-3,0 L0,-4 M3,0 L6,-3.4 M-3,0 L0,4 M3,0 L6,3.4" stroke="#9fdc84" stroke-width=".6" fill="none"/></g>`;
}
// round citrus slice
function xitCitrusSlice(p, x, y, s, { c = '#f7da4e', rind = '#e8b81e', pith = '#fbf3c8' } = {}){
    const rr = s / 2;
    const seg = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28; return `M0,0 L${f1(Math.cos(a) * rr * .8)},${f1(Math.sin(a) * rr * .8)}`; }).join('');
    return `<g ${T(x, y)}><g ${p.sh(.6)}><circle r="${rr}" fill="${rind}" stroke="${dk(rind, .2)}" stroke-width=".6"/></g><circle r="${f1(rr - 1.8)}" fill="${pith}"/><circle r="${f1(rr * .8)}" fill="${p.rg(c, .3, .1)}"/>
        <path d="${seg}" stroke="${lt(c, .6)}" stroke-width="1.2"/><circle r="${f1(rr * .12)}" fill="${lt(c, .6)}"/>
        <path d="M${f1(-rr * .6)},${f1(-rr * .3)} A${f1(rr * .7)},${f1(rr * .7)} 0 0 1 ${f1(-rr * .1)},${f1(-rr * .68)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/></g>`;
}
// lemon wedge seen from above (cut face up)
function xitLemonWedge(p, x, y, s, r = 0){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-15,-3 Q0,-10 15,-3 Q12,6 0,8 Q-12,6 -15,-3Z" fill="${p.g('#f2c62a', .3, .2)}" stroke="#c9960f" stroke-width=".7"/></g>
        <path d="M-12.5,-2.6 Q0,-8.4 12.5,-2.6 Q0,-1 -12.5,-2.6Z" fill="${p.g('#fbe57a', .3, .1)}"/>
        <path d="M-8,-4.2 L-7,-2.2 M-3,-5.6 L-2.6,-2 M2,-5.8 L2,-2 M7,-4.6 L6.4,-2.2" stroke="#fff6c6" stroke-width=".8"/>
        <path d="M-10,1.6 Q0,5.4 10,1.6" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function xitOlive(p, x, y, s, r = 0, { c = '#3a2a32', ring0 = false } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="${p.rg(c, .3, .25, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        ${ring0 ? `<ellipse rx="${f1(s * .16)}" ry="${f1(s * .12)}" fill="${dk(c, .5)}"/>` : ''}
        <ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .14)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" fill="#fff" opacity=".7"/></g>`;
}
function xitCapers(p, pts){
    return pts.map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.4" fill="${p.rg('#7d8a3a', .3, .25)}" stroke="#4f5a22" stroke-width=".4"/><circle cx="${f1(x - .8)}" cy="${f1(y - .8)}" r=".7" fill="#fff" opacity=".6"/>`).join('');
}
// cherry tomato cut in half (cut face up)
function xitTomHalf(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><ellipse rx="10" ry="9" fill="${p.g('#d9301f', .25, .25)}" stroke="#9a1c12" stroke-width=".6"/></g>
        <ellipse rx="8.2" ry="7.3" fill="${p.rg('#ef5a3e', .2, .15)}"/>
        <path d="M0,-7 L0,7 M-7,0 L7,0" stroke="#f58d6a" stroke-width="2" opacity=".8"/>
        <ellipse cx="-3.6" cy="-3.4" rx="2.4" ry="2" fill="#f7b04a" opacity=".85"/><ellipse cx="3.6" cy="-3.4" rx="2.4" ry="2" fill="#f7b04a" opacity=".85"/><ellipse cx="-3.6" cy="3.4" rx="2.4" ry="2" fill="#f7b04a" opacity=".85"/><ellipse cx="3.6" cy="3.4" rx="2.4" ry="2" fill="#f7b04a" opacity=".85"/>
        <circle r="1.6" fill="#fbc2a8"/>
        <path d="M-6,-4.6 Q-2,-7.6 3,-7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// zucchini round (skin ring + pale flesh), browned = golden pan marks
function xitZuc(p, x, y, s, { browned = 0, seed = 1, skin = '#3c6a28' } = {}){
    const R = rng(p.id + 'xzc' + seed + x + y);
    const fl = mix('#eef0c4', '#e6b24a', browned * .7);
    const a0 = R() * 6.28;
    const seeds = [0, 1, 2].map(i => { const a = a0 + i * 2.09; return `M${f1(Math.cos(a) * s * .1)},${f1(Math.sin(a) * s * .1)}l${f1(Math.cos(a) * s * .12)},${f1(Math.sin(a) * s * .12)}`; }).join('');
    return `<g ${T(x, y)}><circle r="${f1(s / 2)}" fill="${skin}"/><circle r="${f1(s / 2 - 2.2)}" fill="#b7cf7a"/><circle r="${f1(s / 2 - 3)}" fill="${p.rg(fl, .25, .15, .4, .38)}"/>
        <path d="${seeds}" stroke="${lt(fl, .5)}" stroke-width="${f1(s * .06)}" stroke-linecap="round"/>
        ${browned ? `<ellipse cx="${f1(s * .08)}" cy="${f1(s * .06)}" rx="${f1(s * .24)}" ry="${f1(s * .18)}" fill="#c98a2c" opacity="${f1(browned * .45)}"/>` : ''}
        <path d="M${f1(-s * .3)},${f1(-s * .1)} A${f1(s * .32)},${f1(s * .32)} 0 0 1 ${f1(-s * .02)},${f1(-s * .3)}" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/></g>`;
}
// curved band (pepper strip, green bean, cuttlefish strip)
function xitBand(p, x, y, L, W, r = 0, { c = '#d8352a', bend = .25, hi = true, tip = false, cap = 'round', sh = true } = {}){
    const d = `M${f1(-L / 2)},0 Q0,${f1(-L * bend)} ${f1(L / 2)},0`;
    return `<g ${T(x, y, r)}>${sh ? `<path d="${d}" stroke="#2b1607" stroke-width="${f1(W + 1)}" fill="none" stroke-linecap="${cap}" opacity=".22" transform="translate(1.2 1.8)"/>` : ''}<path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(W + 1.2)}" fill="none" stroke-linecap="${cap}"/><path d="${d}" stroke="${c}" stroke-width="${W}" fill="none" stroke-linecap="${cap}"/>
        ${hi ? `<path d="M${f1(-L * .36)},${f1(-W * .22 - L * bend * .28)} Q0,${f1(-L * bend * .5 - W * .25)} ${f1(L * .3)},${f1(-W * .22 - L * bend * .2)}" stroke="${lt(c, .55)}" stroke-width="${f1(Math.max(.8, W * .22))}" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}
        ${tip ? `<path d="M${f1(L / 2)},0 l2.2,-.6" stroke="${dk(c, .2)}" stroke-width="1.2" stroke-linecap="round"/>` : ''}</g>`;
}
function xitGarlic(p, x, y, s, r = 0, { fried = .4 } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .36)}" fill="${mix('#f6ecd2', '#e0a850', fried)}" stroke="${mix('#d8c79e', '#b87a2a', fried)}" stroke-width=".6"/><ellipse rx="${f1(s * .18)}" ry="${f1(s * .1)}" fill="${mix('#efe0b8', '#d29a44', fried)}"/></g>`;
}
// unpeeled garlic clove (roasted)
function xitClove(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-9,4 Q-10,-4 -2,-7 Q5,-9 9,-2 Q10,4 4,6 Q-4,8 -9,4Z" fill="${p.g('#f1e2c4', .3, .25)}" stroke="#b89a6a" stroke-width=".7"/></g>
        <path d="M-6,3 Q0,-2 7,-3 M-5,0 Q1,-5 6,-6" stroke="#c9a06a" stroke-width=".7" fill="none" opacity=".8"/><path d="M9,-2 l3,-2" stroke="#a87a4a" stroke-width="1.4" stroke-linecap="round"/></g>`;
}
// lardon of guanciale / pancetta: pale fat with a band of pink-brown meat
function xitGuanciale(p, x, y, w, h, r = 0, { meat = '#b5573a' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${w}" height="${h}" rx="${f1(h * .3)}" fill="${p.g('#f0c98a', .3, .3)}" stroke="#a8661e" stroke-width=".8"/></g>
        <rect x="${f1(-w / 2 + 1)}" y="${f1(h * .02)}" width="${f1(w - 2)}" height="${f1(h * .42)}" rx="${f1(h * .2)}" fill="${p.g(meat, .25, .3)}"/>
        <path d="M${f1(-w * .32)},${f1(-h * .22)} L${f1(w * .2)},${f1(-h * .22)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".75"/></g>`;
}
// Italian pork sausage piece, browned (one cut end)
function xitSausage(p, x, y, L, W, r = 0, { c = '#a9603a', seed = 1, cut = true } = {}){
    const R = rng(p.id + 'xsg' + seed + x);
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f1(-L * .35 + R() * L * .6)}" cy="${f1((R() - .5) * W * .5)}" rx="${f1(2 + R() * 3)}" ry="${f1(1.2 + R() * 1.5)}" fill="${dk(c, .5)}" opacity="${f1(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${L}" height="${W}" rx="${f1(W / 2)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>
        ${ch}${cut ? `<ellipse cx="${f1(L / 2 - W * .22)}" cy="0" rx="${f1(W * .22)}" ry="${f1(W * .42)}" fill="${p.g('#e3a987', .2, .2)}" stroke="${dk(c, .2)}" stroke-width=".5"/>` : ''}
        <path d="M${f1(-L * .38)},${f1(-W * .22)} L${f1(L * .2)},${f1(-W * .26)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>`;
}
// roast potato chunk
function xitRoastPotato(p, x, y, s, r = 0, { seed = 1, c = '#e6b04e' } = {}){
    const R = rng(p.id + 'xrp' + seed + x + y);
    const pts = ring(s / 2, 6, .3, R, 1.15, .9, R());
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .45)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .4)}" stroke-width=".9"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62 - s * .06, b * .62 - s * .06]), true, .45)}" fill="${lt(c, .3)}" opacity=".85"/>
        <ellipse cx="${f1(s * .18)}" cy="${f1(s * .14)}" rx="${f1(s * .18)}" ry="${f1(s * .1)}" fill="${dk(c, .35)}" opacity=".35"/>
        <path d="M${f1(-s * .26)},${f1(-s * .2)} Q${f1(-s * .1)},${f1(-s * .32)} ${f1(s * .08)},${f1(-s * .28)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function xitRosemary(p, x, y, L, r = 0){
    let nd = '';
    const n = Math.round(L / 3.4);
    for (let i = 0; i < n; i++){ const t = -L / 2 + (i + .5) * L / n, sgn = i % 2 ? 1 : -1, len = 5.5 - Math.abs(t) / L * 3; nd += `M${f1(t)},0 l${f1(len * .55)},${f1(sgn * len)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="M${f1(-L / 2)},0 L${f1(L / 2)},0" stroke="#7a6a44" stroke-width="1.2" stroke-linecap="round"/><path d="${nd}" stroke="#2f5a34" stroke-width="2.1" stroke-linecap="round" fill="none"/></g><path d="${nd}" stroke="#7aa27a" stroke-width=".6" stroke-linecap="round" fill="none" transform="translate(-.3 -.3)"/></g>`;
}
// small dice (soup vegetables)
function xitDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1, skin = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f1(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f1(s * .86)}" height="${f1(s * .86)}" rx="${f1(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f1(h * .45)}" width="${f1(s * .86)}" height="${f1(s * .28)}" rx="1" fill="${skin}"/>` : ''}
        <path d="M${f1(-h + s * .18)},${f1(-h + s * .2)} L${f1(-h + s * .62)},${f1(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// bean (cannellini white, borlotti speckled)
function xitBean(p, x, y, s, r = 0, o = {}){ return xitU(p, 'bn' + JSON.stringify(o), () => xitBean0(p, 0, 0, 20, 0, o))(x, y, r, s / 20); }
function xitBean0(p, x, y, s, r = 0, { c = '#f1e8d2', speck = null, sh = true } = {}){
    const k = s / 20, body = `<path d="M-10,-1 Q-10,-7 -3,-6.4 Q1,-6 4,-6.6 Q10,-7 10,-.5 Q10,6 0,6.4 Q-10,6.4 -10,-1Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/>`;
    return `<g ${T(x, y, r, k)}>${sh ? `<g ${p.sh(.5)}>${body}</g>` : body}
        ${speck ? `<path d="M-6,-2 l2,1 M-1,2 l2.4,.6 M4,-2 l1.6,1.4 M-5,3 l1.6,-.4 M2,-4 l2,.2" stroke="${speck}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>` : ''}
        <path d="M-6,-3.6 Q-2,-5.4 2,-4.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// short tube of pasta (ditalini), lying or end-on
function xitDitalino(p, x, y, s, r = 0, { c = '#f1d58c', end = false } = {}){
    return end
        ? `<g ${T(x, y, r)}><circle r="${f1(s / 2)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><circle r="${f1(s * .24)}" fill="${dk(c, .35)}"/></g>`
        : `<g ${T(x, y, r)}><rect x="${f1(-s / 2)}" y="${f1(-s * .32)}" width="${s}" height="${f1(s * .64)}" rx="${f1(s * .12)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><ellipse cx="${f1(s / 2 - s * .1)}" cy="0" rx="${f1(s * .12)}" ry="${f1(s * .27)}" fill="${dk(c, .35)}"/></g>`;
}
const xitCheese = (p, x, y, s, n = 30) => K.sprinkle(p, x, y, s, { c: '#fbf3d2', n, r: 1.1 });
const xitPepper = (p, x, y, s, n = 40) => K.sprinkle(p, x, y, s, { c: '#2a2420', n, r: .75 });
// parmesan shaving: thin pale irregular flake
function xitShaving(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xsv' + seed + x);
    const pts = ring(s / 2, 6, .4, R, 1.3, .6);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .3)}" fill="${p.g('#f8e7b0', .4, .15)}" stroke="#d9be78" stroke-width=".6"/></g><path d="M${f1(-s * .3)},${f1(-s * .06)} L${f1(s * .2)},${f1(-s * .1)}" stroke="#fff" stroke-width="1" opacity=".8"/></g>`;
}
// drops of olive oil
function xitOil(p, x, y, s, { n = 8, seed = 1, op = .7, c = '#e6c13a' } = {}){
    const R = rng(p.id + 'xoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1 + R() * 2.6; out += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".7"/>`; }
    return out;
}
function xitParsley(p, x, y, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'xpa' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.round(R() * 360))} d="${smooth(ring(1 + R() * 1.1, 5, .6, R))}" fill="${R() < .5 ? '#3f8a2c' : '#5aa63c'}"/>`; }
    return out;
}

// ---------- meat & fish ----------
// breaded cutlet (cotoletta): flat irregular slab with crumb texture
function xitCotoletta(p, x, y, w, h, r = 0, { seed = 1, c = '#d08a32' } = {}){
    const R = rng(p.id + 'xct' + seed);
    const pts = ring(1, 12, .14, R, w / 2, h / 2);
    let spots = '';
    for (let i = 0; i < 9; i++) spots += `<ellipse cx="${f1((R() - .5) * w * .7)}" cy="${f1((R() - .5) * h * .6)}" rx="${f1(3 + R() * 6)}" ry="${f1(2 + R() * 4)}" fill="${R() < .55 ? '#a85a1a' : '#f0be5a'}" opacity="${f1(.45 + R() * .35)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.3)}><g ${p.crumb(.7)}><path d="${xitSm(pts, true)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".9"/>${spots}</g></g>
        <g ${xitBlur(p, 2)}><path d="${xitSm(pts.map(([a, b]) => [a * .94, b * .92]), true)}" fill="none" stroke="#9a5418" stroke-width="5" opacity=".45"/></g>
        <path d="M${f1(-w * .32)},${f1(-h * .28)} Q${f1(-w * .1)},${f1(-h * .42)} ${f1(w * .18)},${f1(-h * .34)}" stroke="#fff3d6" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// braised chicken piece: thigh (blob) or drumstick (club with bone knob)
function xitChicken(p, x, y, s, r = 0, { c = '#b8683a', drum = false, seed = 1 } = {}){
    const R = rng(p.id + 'xck' + seed + x + y);
    const k = s / 40;
    const body = drum
        ? `<path d="M-20,-1 Q-20,-12 -6,-12 Q6,-11 10,-4 L17,-2.4 Q20,-4.6 22,-2 Q23.6,0 22,2 Q20,4.6 17,2.4 L10,4 Q6,11 -6,12 Q-20,12 -20,-1Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".9"/><path d="M15,-2.2 Q19,-5.6 22,-2.4 Q24,0 22,2.4 Q19,5.6 15,2.2Z" fill="${p.g('#f1e4cc', .3, .2)}" stroke="#c9b28a" stroke-width=".6"/>`
        : `<path d="${smooth(ring(18, 9, .2, R, 1.1, .85))}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".9"/>`;
    let marks = '';
    for (let i = 0; i < 4; i++) marks += `<ellipse cx="${f1(-12 + R() * 20)}" cy="${f1(-6 + R() * 12)}" rx="${f1(2 + R() * 3)}" ry="${f1(1.2 + R() * 2)}" fill="${dk(c, .45)}" opacity="${f1(.25 + R() * .25)}"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1)}>${body}</g>${marks}
        <path d="M-13,-6 Q-6,-11 2,-9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// stewed beef cube
function xitBeefCube(p, x, y, s, r = 0, { c = '#6e3a22', seed = 1 } = {}){
    const R = rng(p.id + 'xbf' + seed + x + y);
    const pts = ring(s / 2, 6, .22, R, 1.1, .95, R());
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><g ${p.rough(1.4, .2)}><path d="${smooth(pts, true, .4)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g></g>
        <path d="M${f1(-s * .28)},${f1(-s * .02)} Q0,${f1(-s * .14)} ${f1(s * .28)},${f1(-s * .04)} M${f1(-s * .22)},${f1(s * .16)} Q0,${f1(s * .06)} ${f1(s * .24)},${f1(s * .16)}" stroke="${dk(c, .4)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f1(-s * .26)},${f1(-s * .24)} Q${f1(-s * .06)},${f1(-s * .36)} ${f1(s * .14)},${f1(-s * .3)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// mussel in its half shell (open, orange meat)
function xitMussel(p, x, y, s, r = 0, { closed = false } = {}){
    return xitU(p, 'mu' + closed, () => xitMussel0(p, closed))(x, y, r, s / 30);
}
function xitMussel0(p, closed){
    return `<g><g ${p.sh(.7)}><path d="M-15,0 Q-14,-7 -4,-8.5 Q9,-10 15,-3 Q16,0 15,3 Q9,10 -4,8.5 Q-14,7 -15,0Z" fill="${p.g('#3a3646', .3, .3)}" stroke="#1d1a24" stroke-width=".7"/></g>
        ${closed ? `<path d="M-14,0 Q0,-2 15,0" stroke="#6a6a80" stroke-width="1" fill="none"/><path d="M-10,-5 Q0,-8 10,-5" stroke="#8a8aa4" stroke-width="1.2" fill="none" opacity=".6"/>`
        : `<path d="M-13,0 Q-12,-5.6 -4,-6.8 Q8,-8 13,-2.4 Q14,0 13,2.4 Q8,8 -4,6.8 Q-12,5.6 -13,0Z" fill="#a9a8bd"/>
        <path d="M-10,0 Q-9,-4.6 -2,-5 Q8,-5.4 11,-1.4 Q12,0 11,1.4 Q8,5.4 -2,5 Q-9,4.6 -10,0Z" fill="${p.g('#f08a3a', .3, .25)}" stroke="#c0601e" stroke-width=".5"/>
        <path d="M-6,-1 Q0,-3.4 7,-1.2" stroke="#c0601e" stroke-width=".8" fill="none" opacity=".7"/>`}
        <path d="M-9,-4 Q-2,-7.4 6,-6.4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// clam (from z_soup): open shell with meat, or closed
function xitClam(p, x, y, s, r = 0, { seed = 1, meat = '#f0b46c', open = true } = {}){
    return xitU(p, 'cl' + (seed % 3) + meat + open, () => xitClam0(p, 0, 0, 30, 0, { seed, meat, open }))(x, y, r, s / 30);
}
function xitClam0(p, x, y, s, r = 0, { seed = 1, meat = '#f0b46c', open = true } = {}){
    const k = s / 30;
    const outerC = ['#a8957c', '#8f8170', '#b39c80'][seed % 3];
    const shell = `M0,0 C-3,1 -11,4 -12,10 C-12.5,15 -7,18 0,18 C7,18 12.5,15 12,10 C11,4 3,1 0,0Z`;
    if (!open){
        return `<g ${T(x, y, r, k)}><g transform="translate(0 -9)"><g ${p.sh(.6)}><path d="${shell}" fill="${p.g(outerC, .3, .32)}" stroke="${dk(outerC, .4)}" stroke-width=".7"/></g>
            <path d="M-8,8 Q0,5 8,8 M-10,12 Q0,9 10,12 M-11.5,15 Q0,12 11.5,15" stroke="${lt(outerC, .35)}" stroke-width=".7" fill="none" opacity=".8"/>
            <path d="M-5,5 Q-2,2.6 1,3" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g></g>`;
    }
    const valve = a => `<g transform="rotate(${a})"><path d="${shell}" fill="${p.g(outerC, .2, .3)}" stroke="${dk(outerC, .4)}" stroke-width=".7"/>
        <path d="M0,1.6 C-3,2.6 -9.6,5 -10.4,10 C-10.8,14 -6.4,16.4 0,16.4 C6.4,16.4 10.8,14 10.4,10 C9.6,5 3,2.6 0,1.6Z" fill="${p.g('#f1ebed', .3, .14)}"/>
        <path d="M-9,13.6 Q0,18 9,13.6" stroke="#9a86b0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${valve(-62)}${valve(62)}</g>
        <g transform="rotate(-62)"><path d="M-7,9 C-7,3.5 7,3.5 7.4,9 C7.6,14 3,15.6 0,15.4 C-4,15.2 -7,13 -7,9Z" fill="${p.g(meat, .32, .28)}" stroke="${dk(meat, .32)}" stroke-width=".6"/>
        <path d="M-4,7.4 Q0,5.4 3.6,7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".75"/></g></g>`;
}
// whole prawn with shell: curved segmented body, head, tail fan
function xitPrawn(p, x, y, s, r = 0, { c = '#e2552e' } = {}){
    const k = s / 40;
    let seg = '';
    for (let i = 0; i < 5; i++){ const a = -2.6 + i * .5; seg += `M${f1(Math.cos(a) * 7)},${f1(Math.sin(a) * 7)} L${f1(Math.cos(a) * 15)},${f1(Math.sin(a) * 15)}`; }
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}>
        <path d="M-14,6 A15,15 0 1 1 13,7 L9,4 A10,10 0 1 0 -8,4Z" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .35)}" stroke-width=".8"/>
        <path d="M-14,6 L-20,14 L-11,12 L-8,4Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="M13,7 Q22,6 22,14 Q16,16 9,4Z" fill="${p.g(dk(c, .1), .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${seg}" stroke="${dk(c, .3)}" stroke-width=".8" opacity=".7"/>
        <path d="M20,9 Q30,4 34,-6 M19,11 Q32,10 36,2" stroke="${dk(c, .2)}" stroke-width=".7" fill="none"/>
        <circle cx="17" cy="9" r="1.2" fill="#1d1a1a"/>
        <path d="M-10,-6 A12,12 0 0 1 4,-11" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// white fish chunk (soup)
function xitFishChunk(p, x, y, s, r = 0, { seed = 1, tint = '#f6efe0' } = {}){
    const R = rng(p.id + 'xfc' + seed + x + y);
    const pts = ring(s / 2, 8, .2, R, 1.2, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .6)}" fill="${p.g(tint, .3, .18)}" stroke="#cdbf9e" stroke-width=".7"/></g>
        <path d="M${f1(-s * .2)},${f1(-s * .3)} q${f1(s * .08)},${f1(s * .3)} 0,${f1(s * .6)} M${f1(s * .05)},${f1(-s * .32)} q${f1(s * .08)},${f1(s * .3)} 0,${f1(s * .64)} M${f1(s * .3)},${f1(-s * .26)} q${f1(s * .06)},${f1(s * .26)} 0,${f1(s * .5)}" stroke="#d9cdb2" stroke-width="1.1" fill="none" opacity=".8"/>
        <path d="M${f1(-s * .4)},${f1(-s * .1)} Q${f1(-s * .2)},${f1(-s * .32)} ${f1(s * .1)},${f1(-s * .32)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}

// ---------- vegetables ----------
// fried / roasted aubergine cube: dark skin on one side, golden flesh
function xitAubCube(p, x, y, s, r = 0, { flesh = '#d9a656', seed = 1 } = {}){
    return xitU(p, 'ac' + s + flesh + (seed % 2), () => {
        const h = s / 2, w = seed % 2 ? s * 1.1 : s;
        return `<g ${p.sh(.6)}><rect x="${f1(-w / 2)}" y="${-h}" width="${f1(w)}" height="${s}" rx="${f1(s * .22)}" fill="${p.g('#3d1c44', .35, .2)}" stroke="#24102a" stroke-width=".6"/></g>
        <rect x="${f1(-w / 2 + .6)}" y="${f1(-h + s * .3)}" width="${f1(w - 1.2)}" height="${f1(s * .68)}" rx="${f1(s * .18)}" fill="${p.g(flesh, .3, .3)}"/>
        <path d="M${f1(-w * .34)},${f1(-h + 1.6)} L${f1(w * .2)},${f1(-h + 1.6)}" stroke="#a87ab4" stroke-width="1" stroke-linecap="round" opacity=".8"/>
        <circle cx="${f1(-w * .12)}" cy="${f1(s * .12)}" r="${f1(s * .07)}" fill="${dk(flesh, .2)}" opacity=".6"/><circle cx="${f1(w * .16)}" cy="${f1(s * .24)}" r="${f1(s * .06)}" fill="${dk(flesh, .2)}" opacity=".6"/>`;
    })(x, y, r);
}
function xitPea(p, x, y, s, { c = '#6fae3a' } = {}){
    return xitU(p, 'pea' + s + c, () => `<circle r="${f1(s / 2)}" fill="${p.rg(c, .3, .3, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".5"/><circle cx="${f1(-s * .17)}" cy="${f1(-s * .17)}" r="${f1(s * .13)}" fill="#fff" opacity=".7"/>`)(x, y);
}
// sliced champignon (cap + stem silhouette), sauteed
function xitMushSlice(p, x, y, s, r = 0, { c = '#d9b583', cap = '#8a5a30' } = {}){
    return xitU(p, 'ms' + c + cap, () => `<g><g ${p.sh(.5)}><path d="M-10,1 Q-10,-8 0,-8.5 Q10,-8 10,1 Q8,2 4,1.6 L4,7.4 Q0,9 -4,7.4 L-4,1.6 Q-8,2 -10,1Z" fill="${p.g(c, .3, .25)}" stroke="${cap}" stroke-width="1.4" stroke-linejoin="round"/></g>
        <path d="M-7.6,-1 Q-6,-5.6 0,-6 Q6,-5.6 7.6,-1" stroke="${dk(c, .2)}" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M-6,-4 Q-2,-6.6 3,-6" stroke="#fff" stroke-width="1" fill="none" opacity=".6" stroke-linecap="round"/></g>`)(x, y, r, s / 20);
}
// glossy whole baby onion (cipollina) in a dark glaze
function xitCipollina(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .45)}" fill="${p.rg('#b0652a', .35, .35, .35, .32)}" stroke="#6e3412" stroke-width=".8"/></g>
        <ellipse rx="${f1(s * .33)}" ry="${f1(s * .29)}" fill="none" stroke="#d99a56" stroke-width="1" opacity=".6"/><ellipse rx="${f1(s * .16)}" ry="${f1(s * .14)}" fill="none" stroke="#d99a56" stroke-width=".9" opacity=".5"/>
        <circle r="${f1(s * .05)}" fill="#6e3412"/>
        <ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .18)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" transform="rotate(-30 ${f1(-s * .18)} ${f1(-s * .18)})" fill="#fff" opacity=".75"/></g>`;
}
// fennel slice: fan with layered curves
function xitFennel(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M0,10 C-11,7 -11,-6 -6,-10 L6,-10 C11,-6 11,7 0,10Z" fill="${p.g('#eef3d8', .35, .15)}" stroke="#b9c98a" stroke-width=".7"/></g>
        <path d="M0,9 C-7,6 -7,-5 -3.6,-10 M0,9 C7,6 7,-5 3.6,-10 M0,9 C-3,5 -2.6,-4 -1,-10 M0,9 C3,5 2.6,-4 1,-10" stroke="#c9d9a0" stroke-width=".9" fill="none"/>
        <path d="M-6,-10 L6,-10" stroke="#a8c070" stroke-width="1.4"/></g>`;
}
// red onion ring / slice (thin, purple edged)
function xitRedOnion(p, x, y, s, r = 0, { half = false } = {}){
    const rr = s / 2;
    const arc = half ? `M${-rr},0 A${rr},${f1(rr * .8)} 0 0 1 ${rr},0` : null;
    return half
        ? `<g ${T(x, y, r)}><path d="${arc}" stroke="#a8487a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="${arc}" stroke="#f2dbe6" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`
        : `<g ${T(x, y, r)}><ellipse rx="${rr}" ry="${f1(rr * .8)}" fill="none" stroke="#a8487a" stroke-width="2.6"/><ellipse rx="${rr}" ry="${f1(rr * .8)}" fill="none" stroke="#f2dbe6" stroke-width="1.1"/></g>`;
}
// asparagus spear
function xitAsparagus(p, x, y, L, r = 0, { c = '#6aa03a' } = {}){
    const h = L / 2;
    let br = '';
    for (let i = 1; i < 4; i++) br += `<path d="M${f1(-h + L * i * .22)},-2.6 l3,2.6" stroke="#6a7a3a" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${-h},-3 L${f1(h - 9)},-3.4 Q${f1(h - 2)},-4.6 ${h},0 Q${f1(h - 2)},4.6 ${f1(h - 9)},3.4 L${-h},3Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f1(h - 10)},-3.4 Q${f1(h - 2)},-4.6 ${h},0 Q${f1(h - 2)},4.6 ${f1(h - 10)},3.4 L${f1(h - 7)},0Z" fill="#5a6a34"/><path d="M${f1(h - 7)},-2.4 l3,2.4 l-3,2.4" stroke="#8a9a4a" stroke-width=".8" fill="none"/>
        ${br}<path d="M${-h + 2},-1.6 L${f1(h - 12)},-1.8" stroke="#fff" stroke-width=".9" opacity=".6"/></g>`;
}
// artichoke (carciofo alla romana) seen from above: layered petals, stem end in the middle
function xitArtichoke(p, x, y, s, r = 0){
    return xitU(p, 'art', () => {
        let out = '';
        [[9, 22, 13, '#6f7a3a', '#7a4a6a'], [8, 15, 11, '#8a9446', '#8a5a7a'], [7, 8, 9, '#a9b058', '#9a6a84']].forEach(([n, d, w, c, tip], li) => {
            for (let i = 0; i < n; i++){ const a = (i + li * .5) / n * 360; out += `<g transform="rotate(${f1(a)}) translate(0 ${d})"><ellipse rx="${w}" ry="${f1(w * .9)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/><path d="M${f1(-w * .7)},${f1(w * .3)} Q0,${f1(w * 1.1)} ${f1(w * .7)},${f1(w * .3)}" stroke="${tip}" stroke-width="2.4" fill="none" opacity=".7"/></g>`; }
        });
        return `<g ${p.sh(1)}><circle r="34" fill="${dk('#6f7a3a', .2)}"/>${out}</g><circle r="7" fill="${p.g('#c9cf86', .3, .25)}" stroke="#8a9442" stroke-width=".8"/><circle r="4" fill="#e3e3b0"/>
        <path d="M-18,-14 Q-6,-24 8,-22" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".45"/>`;
    })(x, y, r, s / 70);
}
// grilled long slice (aubergine / zucchini) with grill marks
function xitGrilled(p, x, y, w, h, r = 0, { flesh = '#e9d6a0', skin = '#4d2a5c', marks = '#4a2a14' } = {}){
    const cid = p.def('xgr' + w + h, id => `<clipPath id="${id}"><ellipse rx="${w / 2 - 1.5}" ry="${h / 2 - 1.5}"/></clipPath>`);
    let m = '';
    for (let i = -3; i <= 3; i++) m += `M${f1(i * w / 7 - h / 2)},${f1(-h / 2)} l${h},${h}`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${w / 2}" ry="${h / 2}" fill="${skin}"/></g><ellipse rx="${w / 2 - 1.5}" ry="${h / 2 - 1.5}" fill="${p.g(flesh, .25, .25)}"/>
        <g clip-path="url(#${cid})"><path d="${m}" stroke="${marks}" stroke-width="2.6" opacity=".7"/></g>
        <path d="M${f1(-w * .3)},${f1(-h * .24)} Q0,${f1(-h * .36)} ${f1(w * .26)},${f1(-h * .22)}" stroke="#fff" stroke-width="1.1" fill="none" opacity=".6" stroke-linecap="round"/></g>`;
}
// small grain (lentil, barley, farro)
function xitGrains(p, x, y, s, { n = 40, c = '#8a5a30', rx = 2.2, ry = 1.6, line = false, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xgn' + seed + x + y);
    const mk = col => xitU(p, 'gr' + col + rx + ry + line, () => `<ellipse rx="${rx}" ry="${ry}" fill="${col}" stroke="${dk(c, .3)}" stroke-width=".4"/>${line ? `<path d="M${f1(-rx * .6)},0 h${f1(rx * 1.2)}" stroke="${dk(c, .35)}" stroke-width=".6"/>` : ''}`);
    const A = mk(c), B = mk(lt(c, .15));
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += (R() < .5 ? A : B)(x + Math.cos(a) * d, y + Math.sin(a) * d * sy, Math.round(R() * 180)); }
    return out;
}
// chickpea
function xitChickpea(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><circle r="${f1(s / 2)}" fill="${p.rg('#e2b86e', .3, .25, .35, .32)}" stroke="#a87a34" stroke-width=".6"/><path d="M${f1(s * .1)},${f1(-s * .45)} Q${f1(s * .3)},${f1(-s * .2)} ${f1(s * .2)},0" stroke="#b88a44" stroke-width=".8" fill="none"/><circle cx="${f1(-s * .15)}" cy="${f1(-s * .15)}" r="${f1(s * .12)}" fill="#fff" opacity=".6"/></g>`;
}
// fluffy egg ribbons (stracciatella)
function xitEggRag(p, x, y, L, r = 0, { seed = 1, c = '#f6d45e', op = .95 } = {}){
    const R = rng(p.id + 'xer' + seed + x + y);
    const pts = ring(L / 2, 12, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${xitSm(pts, true)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${xitSm(pts.map(([a, b]) => [a * .78, b * .7]), true)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${xitSm(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// tortellino seen from above: a little stuffed ring
function xitTortellino(p, x, y, s, r = 0, { c = '#f0cf7a', broth = '#c99a3c' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-9,2 C-10,-7 -2,-10 4,-9 C10,-7 11,0 8,5 C5,9 -4,10 -7,7 L-3,3 C-1,5 3,4 4,1 C5,-2 2,-4 -1,-3 C-3,-2 -4,0 -4,1Z" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .32)}" stroke-width=".7"/></g>
        <path d="M-7,7 C-9,9 -12,8 -12,5 C-12,3 -10,2 -9,2 L-4,1Z" fill="${p.g(lt(c, .1), .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".6"/>
        <circle cx=".4" cy=".4" r="2.6" fill="${broth}" opacity=".7"/>
        <path d="M-6,-5 Q-1,-8.6 5,-6.6" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// tiny star pasta (stelline)
function xitStars(p, x, y, s, { n = 40, c = '#f2d27a', seed = 1, sz = 2.6 } = {}){
    const R = rng(p.id + 'xst' + seed + x);
    const star = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.28 - 1.57, rr = i % 2 ? sz * .45 : sz; return `${f1(Math.cos(a) * rr)},${f1(Math.sin(a) * rr)}`; }).join(' ');
    const id = p.def('xstar' + sz + c, id => `<polygon id="${id}" points="${star}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".4"/>`);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<use href="#${id}" transform="translate(${f1(x + Math.cos(a) * d)} ${f1(y + Math.sin(a) * d)}) rotate(${Math.round(R() * 72)})"/>`; }
    return out;
}

// slice of roast pork loin: browned rim, pale pink centre
function xitLoin(p, x, y, s, r = 0){
    return xitU(p, 'ln' + s, () => `<g ${p.sh(.8)}><ellipse rx="${s / 2}" ry="${f1(s * .4)}" fill="${p.g('#9a5a26', .3, .3)}" stroke="#6a3a16" stroke-width=".7"/></g>
        <ellipse cx=".5" rx="${f1(s / 2 - 3)}" ry="${f1(s * .4 - 2.8)}" fill="${p.rg('#f6e2d0', .3, .1, .4, .4)}"/>
        <path d="M${f1(-s * .38)},${f1(-s * .18)} Q0,${f1(-s * .34)} ${f1(s * .38)},${f1(-s * .18)}" stroke="#fbf0e2" stroke-width="2" fill="none" opacity=".8"/>
        <ellipse cx="${f1(s * .06)}" cy="${f1(s * .05)}" rx="${f1(s * .2)}" ry="${f1(s * .14)}" fill="#e8b49c" opacity=".7"/>`)(x, y, r);
}
// lamb piece on the bone: browned irregular chunk with a round bone section
function xitLamb(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xlb' + seed + x);
    const c = '#9a5a2e';
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f1((R() - .5) * s * .6)}" cy="${f1((R() - .5) * s * .4)}" rx="${f1(s * (.06 + R() * .08))}" ry="${f1(s * .05)}" fill="#5a2c12" opacity=".4"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(1.6, .14)}><path d="${smooth(ring(s / 2, 9, .25, R, 1.15, .8))}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g></g>
        <ellipse cx="${f1(s * .08)}" cy="${f1(s * .05)}" rx="${f1(s * .3)}" ry="${f1(s * .16)}" fill="#f2e4d0" opacity=".35"/>${ch}
        <path d="M${f1(s * .5)},${f1(-s * .06)} l${f1(s * .2)},${f1(-s * .02)} q${f1(s * .08)},${f1(-s * .1)} ${f1(s * .12)},${f1(s * .04)} q${f1(-s * .02)},${f1(s * .14)} ${f1(-s * .12)},${f1(s * .1)} l${f1(-s * .2)},${f1(-s * .02)}Z" fill="${p.g('#f4ecdc', .3, .2)}" stroke="#bfa47e" stroke-width=".8"/>
        <path d="M${f1(-s * .32)},${f1(-s * .16)} Q${f1(-s * .1)},${f1(-s * .32)} ${f1(s * .1)},${f1(-s * .28)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// whole sea bream (orata): deep oval silver body, golden brow, tail fan
function xitBream(p, x, y, L, r = 0){
    const h = L * .2;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}>
        <path d="M${f1(L * .3)},0 L${f1(L / 2)},${f1(-h * .8)} Q${f1(L * .46)},0 ${f1(L / 2)},${f1(h * .8)}Z" fill="${p.g('#8a949c', .3, .3)}" stroke="#5a646c" stroke-width=".8"/>
        <path d="M${f1(-L / 2)},0 C${f1(-L * .44)},${f1(-h * 1.1)} ${f1(L * .14)},${f1(-h * 1.3)} ${f1(L * .33)},0 C${f1(L * .14)},${f1(h * 1.3)} ${f1(-L * .44)},${f1(h * 1.1)} ${f1(-L / 2)},0Z" fill="${p.g('#c9cfd2', .35, .3)}" stroke="#6a747c" stroke-width=".9"/></g>
        <path d="M${f1(-L * .44)},${f1(-h * .5)} C${f1(-L * .2)},${f1(-h * 1.15)} ${f1(L * .14)},${f1(-h * 1.15)} ${f1(L * .3)},${f1(-h * .1)}" stroke="#7f8a94" stroke-width="${f1(h * .5)}" fill="none" opacity=".45"/>
        <path d="M${f1(-L * .26)},${f1(-h * .8)} Q${f1(-L * .26)},0 ${f1(-L * .27)},${f1(h * .8)}" stroke="#7a848c" stroke-width="1.2" fill="none"/>
        <path d="M${f1(-L * .38)},${f1(-h * .62)} Q${f1(-L * .34)},${f1(-h * .5)} ${f1(-L * .32)},${f1(-h * .66)}" stroke="#e9b62a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <circle cx="${f1(-L * .38)}" cy="${f1(-h * .22)}" r="${f1(h * .2)}" fill="#f4efe2" stroke="#3a3a3a" stroke-width=".8"/><circle cx="${f1(-L * .38)}" cy="${f1(-h * .22)}" r="${f1(h * .09)}" fill="#222"/>
        <path d="M${f1(-L * .1)},${f1(-h * .3)} l${f1(L * .06)},${f1(h * .3)} M${f1(L * .04)},${f1(-h * .3)} l${f1(L * .06)},${f1(h * .3)}" stroke="#8a5a2a" stroke-width="2.2" opacity=".5"/>
        <path d="M${f1(-L * .2)},${f1(-h * .78)} Q${f1(L * .02)},${f1(-h * 1.02)} ${f1(L * .2)},${f1(-h * .5)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// thin potato slice (baked under fish)
function xitPotSlice(p, x, y, s, { browned = .4 } = {}){
    return `<g ${T(x, y)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .42)}" fill="${p.g(mix('#f3dc9a', '#d99a44', browned), .3, .2)}" stroke="#b88a40" stroke-width=".6"/><ellipse cx="2" cy="1" rx="${f1(s * .2)}" ry="${f1(s * .14)}" fill="#c98a3a" opacity="${f1(browned * .6)}"/></g>`;
}
// egg cooked in sauce: white set with sauce lapping the edge, glossy yolk
function xitSauceEgg(p, x, y, s, { seed = 1, sauce = '#b8352a' } = {}){
    const R = rng(p.id + 'xse' + seed + x);
    const pts = ring(s / 2, 11, .3, R, 1.1, .95);
    return `<g ${p.sh(.7)}><path ${T(x, y)} d="${smooth(pts, true)}" fill="${p.rg('#ffffff', .1, .12)}" stroke="#e6ddcc" stroke-width=".7"/></g>
        <path ${T(x, y)} d="${smooth(pts, true)}" fill="none" stroke="${sauce}" stroke-width="3.4" opacity=".55"/>
        <circle cx="${f1(x + 1)}" cy="${f1(y + 1)}" r="${f1(s * .2)}" fill="${p.rg('#f6a01c', .3, .15, .35, .32)}" stroke="#d98510" stroke-width=".7"/>
        <ellipse cx="${f1(x - s * .04)}" cy="${f1(y - s * .06)}" rx="${f1(s * .07)}" ry="${f1(s * .04)}" fill="#fff" opacity=".8"/>`;
}
// melted mozzarella patch, browned in spots
function xitMelt(p, x, y, s, { seed = 1, brown = .5 } = {}){
    const R = rng(p.id + 'xml' + seed + x + y);
    return `<g ${p.sh(.5)}><path ${T(x, y)} d="${smooth(ring(s / 2, 10, .45, R, 1.2, .85))}" fill="${p.rg('#fcf6e2', .2, .12)}" stroke="#e2cf9c" stroke-width=".6"/></g>
        <ellipse cx="${f1(x + s * .1)}" cy="${f1(y + s * .06)}" rx="${f1(s * .2)}" ry="${f1(s * .12)}" fill="#d9963a" opacity="${f1(brown * .7)}"/><ellipse cx="${f1(x - s * .18)}" cy="${f1(y - s * .1)}" rx="${f1(s * .1)}" ry="${f1(s * .06)}" fill="#c9802a" opacity="${f1(brown * .6)}"/>`;
}
// veg stick (crudités)
function xitStick(p, x, y, L, W, r = 0, { c = '#ef7f30', core = null } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${L}" height="${W}" rx="${f1(W * .3)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        ${core ? `<rect x="${f1(-L / 2 + 2)}" y="${f1(-W * .12)}" width="${L - 4}" height="${f1(W * .3)}" rx="1" fill="${core}" opacity=".8"/>` : ''}
        <path d="M${f1(-L / 2 + 3)},${f1(-W / 2 + 1.4)} L${f1(L / 2 - 4)},${f1(-W / 2 + 1.4)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// fennel fronds
function xitFronds(p, x, y, s, r = 0){
    let d = '';
    for (let i = 0; i < 7; i++){ const a = (i - 3) * .35; d += `M0,0 l${f1(Math.cos(a) * s)},${f1(Math.sin(a) * s)}`; for (let j = 1; j < 3; j++){ const t = s * j / 3; d += `M${f1(Math.cos(a) * t)},${f1(Math.sin(a) * t)} l${f1(Math.cos(a - .6) * s * .2)},${f1(Math.sin(a - .6) * s * .2)}`; } }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#5aa03a" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
}

// cauliflower floret (cream white)
function xitCauli(p, x, y, s, r = 0){
    return xitU(p, 'cf', () => {
        const R = rng('xcf');
        let b = '';
        for (let i = 0; i < 8; i++){ const a = i / 8 * 6.28, d = i === 0 ? 0 : 5 + R() * 1.4; b += `<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d - 1)}" r="${f1(4.4 + R() * 1.2)}" fill="${p.rg('#f6efd8', .4, .25, .35, .32)}" stroke="#bfae80" stroke-width=".7"/>`; }
        return `<g ${p.sh(.7)}><path d="M-3,4 L-3.4,11 Q0,12.5 3.4,11 L3,4Z" fill="#e6e8c4" stroke="#b9bd8a" stroke-width=".5"/>${b}</g>`;
    })(x, y, r, s / 24);
}
// mashed potato mound with spoon ridges
function xitMash(p, x, y, s, { seed = 1, c = '#f6e6b4' } = {}){
    const R = rng(p.id + 'xmh' + seed);
    let rid = '';
    for (let i = 0; i < 9; i++){ const rr = s * (.12 + i * .045), a = R() * 6.28, sw = 1.6 + R() * 1.8; rid += `<path d="M${f1(x + Math.cos(a) * rr)},${f1(y + Math.sin(a) * rr)} A${f1(rr)},${f1(rr)} 0 0 1 ${f1(x + Math.cos(a + sw) * rr)},${f1(y + Math.sin(a + sw) * rr)}" stroke="${i % 2 ? '#fffaf0' : dk(c, .14)}" stroke-width="${i % 2 ? 2.2 : 1.6}" fill="none" stroke-linecap="round" opacity="${i % 2 ? .9 : .6}"/>`; }
    return `<g ${p.sh(1)}><path ${T(x, y)} d="${xitSm(ring(s / 2, 12, .12, R), true)}" fill="${p.rg(c, .35, .2, .4, .38)}" stroke="${dk(c, .15)}" stroke-width=".8"/></g>${rid}`;
}
// tomato half (round, cut face up) topped with golden breadcrumbs
function xitTomGratin(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtg' + seed);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><circle r="${s / 2}" fill="${p.g('#c8301e', .25, .3)}" stroke="#8a1a10" stroke-width=".8"/></g>
        <circle r="${f1(s / 2 - 3)}" fill="#d9482a"/>
        <g ${p.crumb(.9)}><path d="${smooth(ring(s / 2 - 4, 10, .25, R))}" fill="${p.g('#d99a3e', .35, .3)}"/></g>
        <path d="${smooth(ring(s * .22, 8, .4, R))}" fill="#b8641e" opacity=".45"/>
        <path d="M${f1(-s * .3)},${f1(-s * .18)} Q${f1(-s * .14)},${f1(-s * .34)} ${f1(s * .1)},${f1(-s * .32)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// chicory / cicoria: dark long wilted leaf with pale rib
function xitChicory(p, x, y, L, r = 0, { c = '#2f5a1e', seed = 1 } = {}){
    return xitU(p, 'ch' + c + (seed % 3), () => {
        const R = rng('xch' + (seed % 3));
        const top = Array.from({ length: 9 }, (_, i) => [-20 + i * 5, -(i === 0 || i === 8 ? 1 : 5 + R() * 4) + (i % 2) * 2]);
        const bot = Array.from({ length: 9 }, (_, i) => [20 - i * 5, (i === 0 || i === 8 ? 1 : 5 + R() * 4) - (i % 2) * 2]);
        return `<g ${p.sh(.5)}><path d="${smooth([...top, ...bot], true, .8)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M-19,0 Q0,${f1((R() - .5) * 3)} 19,0" stroke="#a9c87a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M-8,0 l-3,-4 M2,0 l-3,-4.4 M-6,0 l-3,4 M4,0 l-3,4" stroke="${lt(c, .3)}" stroke-width=".7" fill="none"/>
        <path d="M-12,-3.6 Q-4,-6 6,-4.6" stroke="#fff" stroke-width=".8" fill="none" opacity=".35"/>`;
    })(x, y, r, L / 40);
}

// cream swirl on a velvety soup
function xitSwirl(p, x, y, s, { c = '#fff6e6', w = 3 } = {}){
    const pts = Array.from({ length: 14 }, (_, i) => { const a = i * .62, rr = s * (.06 + i * .032); return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]; });
    return `<path d="${xitSm(pts)}" stroke="${dk(c, .1)}" stroke-width="${w + 1}" fill="none" stroke-linecap="round" opacity=".4"/><path d="${xitSm(pts)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".95"/>`;
}
// olive oil drizzle (thin golden-green ribbon)
function xitOilLine(p, pts, { c = '#c9b42a', w = 2.2 } = {}){
    return `<path d="${xitSm(pts)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".85"/><path d="${xitSm(pts)}" stroke="#fff6b0" stroke-width="${f1(w * .35)}" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-.5 -.5)"/>`;
}
// fat eyes floating on a clear broth
function xitEyes(p, x, y, s, { n = 14, seed = 1, c = '#f2c44a' } = {}){
    const R = rng(p.id + 'xey' + seed);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, rr = 1.2 + R() * 3.4, cx = f1(x + Math.cos(a) * d), cy = f1(y + Math.sin(a) * d); out += `<circle cx="${cx}" cy="${cy}" r="${f1(rr)}" fill="${c}" opacity=".55" stroke="${dk(c, .25)}" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .28)}" fill="#fff" opacity=".7"/>`; }
    return out;
}
// leek ring
function xitLeek(p, x, y, s, r = 0){
    return xitU(p, 'lk' + s, () => `<g ${p.sh(.4)}><ellipse rx="${s / 2}" ry="${f1(s * .44)}" fill="${p.g('#dfeab0', .3, .2)}" stroke="#98b058" stroke-width=".7"/></g><ellipse rx="${f1(s * .34)}" ry="${f1(s * .28)}" fill="none" stroke="#b9cc80" stroke-width=".8"/><ellipse rx="${f1(s * .17)}" ry="${f1(s * .13)}" fill="#f4f6dc" stroke="#c9d898" stroke-width=".6"/>`)(x, y, r);
}
// pumpkin seed
function xitSeed(p, x, y, r = 0){
    return xitU(p, 'sd', () => `<path d="M-4,0 Q-3,-2.4 0,-2.4 Q3.6,-2 4.4,0 Q3.6,2 0,2.4 Q-3,2.4 -4,0Z" fill="${p.g('#5f8a3a', .3, .3)}" stroke="#3a5a22" stroke-width=".4"/>`)(x, y, r);
}
// crouton
function xitCrouton(p, x, y, s, r = 0){
    return xitU(p, 'cr' + s, () => `<g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f1(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f1(-s / 2 + s * .18)}" y="${f1(-s / 2 + s * .18)}" width="${f1(s * .5)}" height="${f1(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/>`)(x, y, r);
}
// small meatball (polpettine)
function xitMiniBall(p, x, y, s){
    return xitU(p, 'mb' + s, () => `<g ${p.sh(.6)}><g ${p.rough(1, .25)}><circle r="${s / 2}" fill="${p.g('#a8643a', .3, .3)}" stroke="#6e3a1c" stroke-width=".6"/></g></g><ellipse cx="${f1(-s * .16)}" cy="${f1(-s * .18)}" rx="${f1(s * .15)}" ry="${f1(s * .08)}" fill="#fff" opacity=".5" transform="rotate(-30 ${f1(-s * .16)} ${f1(-s * .18)})"/>`)(x, y);
}
// cavolo nero strip: very dark blue-green, crinkled
function xitKale(p, x, y, L, r = 0){
    return xitU(p, 'kl', () => `<g ${p.sh(.5)}><path d="M-15,0 Q-13,-4 -9,-3 Q-7,-6 -3,-4 Q0,-6.4 3,-4 Q7,-6 9,-3 Q13,-4 15,0 Q13,4 9,3 Q7,6 3,4 Q0,6.4 -3,4 Q-7,6 -9,3 Q-13,4 -15,0Z" fill="${p.g('#2a4a32', .25, .3)}" stroke="#16281a" stroke-width=".6"/></g><path d="M-14,0 L14,0" stroke="#6a8a5a" stroke-width="1" opacity=".8"/>`)(x, y, r, L / 30);
}

// =========================================================
export default {
    // tagliatelle al ragù: white plate, golden egg tagliatelle nest topped with a generous mound of brown-red meat ragù, Parmigiano
    it_ragu: p => [
        xitPlate(p),
        xitSauce(p, 100, 102, 134, '#9a3a22', { seed: 3, op: .6 }),
        xitPasta(p, 100, 100, 132, { c: '#f0c25a', w: 4.6, n: 30, outline: '#c48a2a' }),
        xitRagu(p, 100, 98, 94),
        xitCheese(p, 98, 96, 64, 34),
    ].join(''),

    // bucatini all'amatriciana: thick red bucatini, crisp guanciale, pecorino, chili
    it_amatriciana: p => [
        xitPlate(p, { rim: '#2f6f8f' }),
        xitSauce(p, 100, 102, 134, '#b7341f', { seed: 1, op: .95 }),
        xitPasta(p, 100, 100, 128, { c: '#d9532e', w: 3.4, n: 40, outline: '#9a2c16' }),
        xitSauce(p, 102, 98, 46, '#b02d1a', { seed: 2, sy: .8 }),
        ...[[74, 84, 30], [122, 74, -20], [132, 118, 60], [88, 128, -50], [104, 98, 10], [66, 112, 80], [112, 138, -10], [144, 96, 100], [94, 66, 40], [80, 102, 140]].map(([x, y, r]) => xitGuanciale(p, x, y, 18, 10, r)),
        xitCheese(p, 100, 100, 96, 50),
        K.sprinkle(p, 100, 100, 100, { c: '#a8180c', n: 16, r: .8 }),
    ].join(''),

    // trofie al pesto: blue Ligurian bowl, twisted trofie coated in bright green pesto, potato cubes, green beans, pine nuts, basil
    it_pesto: p => {
        const sp = xitSpots('tro', 84, 66, 8.4);
        return [
            xitBowl(p, '#2f5f8f'),
            `<circle cx="100" cy="100" r="74" fill="${p.rg('#6a8f2e', .2, .3)}"/>`,
            `<g ${p.sh(.7)}>`, ...sp.map(([x, y, r], i) => xitTrofia(p, x, y, 21, r, { c: i % 3 ? '#a9bd4e' : '#c6c866' })), `</g>`,
            ...sp.filter((_, i) => i % 2 === 0).map(([x, y]) => `<circle cx="${f1(x + 2)}" cy="${f1(y + 1)}" r="3" fill="#4e7e22" opacity=".75"/>`),
            ...[[78, 86], [124, 82], [112, 124], [72, 122], [140, 108], [98, 60]].map(([x, y], i) => xitDice(p, x, y, 13, i * 25, '#f3e2a6')),
            ...[[90, 104, 30], [128, 62, -40], [62, 98, 70], [104, 140, -10], [146, 132, 40]].map(([x, y, r]) => xitBand(p, x, y, 22, 5, r, { c: '#4f9a34', bend: .05 })),
            K.sprinkle(p, 100, 100, 120, { c: '#3a6e1c', n: 40, r: 1.3 }),
            ...[[104, 96], [86, 76], [118, 104], [80, 140], [138, 84], [60, 110]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.8" transform="rotate(${i * 50} ${x} ${y})" fill="#f3e2b4" stroke="#c9ad6a" stroke-width=".5"/>`),
            xitBasil(p, 108, 84, 26, -30), xitBasil(p, 92, 92, 20, 120, { c: '#4aa83c' }),
        ].join('');
    },

    // pasta al tonno: penne in tomato sauce with flakes of tuna, capers and parsley
    it_tonno: p => {
        const sp = xitSpots('ton', 38, 60, 13);
        const R = rng(p.id + 'tt');
        const flake = (x, y, i) => `<g ${p.sh(.5)}><path ${T(x, y, i * 40)} d="${smooth(ring(7 + R() * 2, 8, .5, R, 1.3, .8))}" fill="${p.g('#e2c4a0', .35, .25)}" stroke="#b08a66" stroke-width=".6"/></g><path ${T(x, y, i * 40)} d="M-4,-2 l3,2 M1,-3 l3,2" stroke="#c4a07c" stroke-width=".8" opacity=".8"/>`;
        return [
            xitPlate(p),
            xitSauce(p, 100, 102, 140, '#b9402a', { seed: 1 }),
            `<g ${p.sh(.8)}>`, ...sp.map(([x, y, r]) => xitTube(p, x, y, 26, 9, r, { c: '#efc56c', coat: '#c8452c' })), `</g>`,
            ...[[86, 90], [118, 80], [110, 118], [76, 122], [136, 106], [96, 62], [64, 96], [122, 142], [102, 100], [140, 76], [58, 120], [88, 144], [150, 120], [72, 70]].map(([x, y], i) => flake(x, y, i)),
            xitCapers(p, [[100, 100], [70, 108], [132, 92], [116, 64], [84, 140], [146, 124], [58, 82]]),
            xitParsley(p, 100, 100, 120, { n: 40 }),
        ].join('');
    },

    // spaghetti alle vongole: pale oily spaghetti with lots of open clams, parsley, garlic
    it_vongole: p => [
        xitPlate(p),
        xitSauce(p, 100, 102, 136, '#e6cf8c', { seed: 1, op: .7 }),
        xitPasta(p, 100, 100, 122, { c: '#f2d898', w: 2.8, n: 32 }),
        ...[[66, 80, -20], [104, 66, 30], [142, 84, 80], [148, 124, 140], [110, 140, 200], [68, 128, 250], [52, 102, -60], [96, 104, 10], [124, 106, 120]].map(([x, y, r], i) => xitClam(p, x, y, 32, r, { seed: i, open: i !== 4 })),
        xitOil(p, 100, 100, 110, { n: 8, op: .5 }),
        xitParsley(p, 100, 100, 120, { n: 30 }),
        xitGarlic(p, 86, 92, 6, 20, { fried: .5 }), xitGarlic(p, 118, 120, 6, -30, { fried: .5 }),
    ].join(''),

    // pasta alla norma: rigatoni in tomato with fried aubergine cubes, grated ricotta salata, basil
    it_norma: p => {
        const sp = xitSpots('nor', 26, 58, 16);
        return [
            xitPlate(p, { rim: '#2f6f8f' }),
            xitSauce(p, 100, 102, 140, '#b8392a', { seed: 1 }),
            `<g ${p.sh(.8)}>`, ...sp.map(([x, y, r]) => xitTube(p, x, y, 24, 11, r, { c: '#efc26a', slant: .05, coat: '#c4402a' })), `</g>`,
            ...xitSpots('nora', 11, 52, 22).map(([x, y, r], i) => xitAubCube(p, x, y, 17, r, { seed: i })),
            K.sprinkle(p, 100, 96, 70, { c: '#fbfaf2', n: 60, r: 1.5 }),
            xitBasil(p, 106, 88, 28, -30), xitBasil(p, 92, 104, 22, 140), xitBasil(p, 118, 100, 18, 60, { c: '#4aa83c' }),
        ].join('');
    },

    // gnocchi alla sorrentina: terracotta dish, gnocchi in tomato, melted mozzarella patches lightly browned, basil
    it_gnocchi: p => {
        const sp = xitSpots('gno', 34, 62, 13);
        const R = rng(p.id + 'mz');
        return [
            xitCoccio(p),
            `<circle cx="100" cy="100" r="75" fill="${p.rg('#b8382a', .2, .3)}"/>`,
            `<g ${p.sh(.6)}>`, ...sp.map(([x, y, r]) => xitGnocco(p, x, y, 18, r, { c: '#f0c88a' })), `</g>`,
            ...sp.filter((_, i) => i % 2).map(([x, y]) => `<circle cx="${f1(x + 3)}" cy="${f1(y + 2)}" r="4" fill="#c4392a" opacity=".75"/>`),
            ...[[84, 86, 30], [122, 92, 26], [98, 124, 28], [62, 110, 20], [132, 128, 20]].map(([x, y, s]) => `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(ring(s / 2, 10, .4, R, 1.2, .9))}" fill="${p.rg('#fbf6e6', .2, .12)}" stroke="#e6d6b0" stroke-width=".6"/></g><ellipse cx="${x + 2}" cy="${y + 2}" rx="${f1(s * .2)}" ry="${f1(s * .13)}" fill="#d9a046" opacity=".55"/>`),
            xitBasil(p, 104, 104, 24, -30), xitBasil(p, 114, 78, 20, 40), xitBasil(p, 74, 92, 18, 160),
        ].join('');
    },

    // risotto ai funghi: creamy beige risotto spread on a plate, sauteed mushroom slices, parsley
    it_risottofunghi: p => [
        xitPlate(p),
        xitRisotto(p, 100, 100, 132, { c: '#e6cf9c', n: 100 }),
        ...[[78, 80, -20], [116, 72, 30], [134, 108, 70], [102, 128, -40], [70, 116, 20], [100, 96, 150], [126, 136, -10], [86, 146, 40], [56, 94, 60], [144, 82, -60]].map(([x, y, r], i) => xitMushSlice(p, x, y, 22, r, { c: i % 2 ? '#c99a64' : '#b8865a', cap: '#6e4220' })),
        xitParsley(p, 100, 100, 110, { n: 40 }),
        xitPepper(p, 100, 100, 110, 24),
    ].join(''),

    // risotto alla milanese: bright saffron-yellow risotto, glossy with butter, a few saffron threads, Parmigiano
    it_risottomilanese: p => [
        xitPlate(p, { rim: '#2f6f8f' }),
        xitRisotto(p, 100, 100, 134, { c: '#f2c234', n: 130 }),
        K.glaze(p, 96, 96, 70, '#fbe08a', { op: .3 }),
        ...[[90, 84, 20], [112, 96, -40], [98, 116, 70], [124, 80, 10], [76, 104, -60]].map(([x, y, r]) => `<path ${T(x, y, r)} d="M-4,0 Q0,-1.6 4,0" stroke="#c8381a" stroke-width="1" fill="none" stroke-linecap="round"/>`),
        xitCheese(p, 100, 98, 70, 26),
    ].join(''),

    // cotoletta: large golden breaded cutlet, lemon wedges, a little rocket
    it_cotoletta: p => [
        xitPlate(p),
        ...[[136, 136, 40], [152, 116, -20], [120, 152, 80], [150, 142, 10], [140, 124, 120], [128, 146, -50]].map(([x, y, r]) => xitRocket(p, x, y, 26, r)),
        xitCotoletta(p, 90, 90, 124, 94, -18),
        xitLemonWedge(p, 140, 72, 32, 50), xitLemonWedge(p, 66, 146, 28, -20),
    ].join(''),

    // pollo alla cacciatora: terracotta casserole, braised chicken thighs and drumsticks in tomato with onion, black olives, rosemary
    it_cacciatora: p => [
        xitCoccio(p),
        `<circle cx="100" cy="100" r="75" fill="${p.rg('#a8402a', .2, .3)}"/>`,
        K.onion(p, 66, 72, 24, 30, { c: '#e6b07a' }), K.onion(p, 138, 136, 22, -150, { c: '#e6b07a' }), K.onion(p, 138, 70, 20, 80, { c: '#e6b07a' }),
        xitChicken(p, 74, 98, 60, -20, { drum: true, seed: 1, c: '#c0703c' }),
        xitChicken(p, 126, 94, 58, 10, { seed: 2, c: '#c0703c' }),
        xitChicken(p, 98, 136, 58, 160, { drum: true, seed: 3, c: '#c0703c' }),
        xitChicken(p, 100, 62, 44, 70, { seed: 4, c: '#c0703c' }),
        ...[[60, 108, 26, 5], [136, 104, 28, 6], [84, 148, 24, 7], [116, 52, 20, 8], [112, 132, 22, 9], [88, 80, 18, 10]].map(([x, y, s, sd]) => xitSauce(p, x, y, s, '#a82e1a', { seed: sd, op: .6, j: .6, sy: .6 })),
        xitOlive(p, 58, 126, 13, 20), xitOlive(p, 144, 112, 13, -30), xitOlive(p, 118, 120, 12, 60), xitOlive(p, 72, 58, 12, 10), xitOlive(p, 150, 92, 12, 80), xitOlive(p, 102, 100, 12, 30),
        xitRosemary(p, 110, 108, 30, -30), xitRosemary(p, 64, 112, 24, 60),
    ].join(''),

    // spezzatino: brown glazed bowl of rich brown beef stew with potatoes and carrots, parsley
    it_spezzatino: p => [
        xitBowl(p, '#7a4a2e', '#f2e6d0'),
        K.liquid(p, { R: 72, c: '#8a4628', op: 1, shine: false }),
        ...[[78, 80, 0], [122, 76, 30], [130, 120, 10], [88, 126, -20], [102, 100, 40], [60, 104, 60], [104, 62, 20], [140, 96, -10]].map(([x, y, r], i) => xitBeefCube(p, x, y, 28, r, { seed: i, c: '#8e4e2c' })),
        ...[[100, 140, 20], [66, 130, -30], [146, 132, 60], [70, 64, 10], [120, 100, 80]].map(([x, y, r], i) => xitRoastPotato(p, x, y, 22, r, { seed: i, c: '#e8c27a' })),
        ...[[90, 104], [116, 132], [140, 70], [56, 86], [124, 56]].map(([x, y]) => K.carrotRound(p, x, y, 13, { c: '#e2732a' })),
        `<path d="M70,96 Q90,90 104,98 M112,116 Q126,110 140,116" stroke="#8a4426" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
        xitArc(72, .4),
        xitParsley(p, 100, 100, 110, { n: 36 }),
    ].join(''),
    // carne alla pizzaiola: thin beef slices under tomato sauce with melted mozzarella, oregano and garlic
    it_pizzaiola: p => [
        xitPlate(p, { rim: '#2f6f8f' }),
        xitSauce(p, 100, 102, 140, '#b8361f', { seed: 1, op: .9 }),
        `<g ${p.sh(1)}>`, ...[[78, 84, -20, 1], [124, 88, 20, 2], [98, 128, 5, 3]].map(([x, y, r, sd]) => `<path ${T(x, y, r)} d="${smooth(ring(34, 12, .2, rng(p.id + sd), 1.25, .8))}" fill="${p.g('#8c4a2a', .3, .3)}" stroke="#5a2a14" stroke-width=".8"/>`), `</g>`,
        ...[[76, 80, 30, 1], [126, 86, 32, 2], [98, 126, 32, 3], [110, 104, 20, 4]].map(([x, y, s, sd]) => xitSauce(p, x, y, s, '#c43a22', { seed: sd + 10, j: .5, sy: .7 })),
        xitMelt(p, 82, 90, 36, { seed: 1, brown: .3 }), xitMelt(p, 124, 98, 34, { seed: 2, brown: .3 }), xitMelt(p, 100, 132, 32, { seed: 3, brown: .3 }),
        xitGarlic(p, 70, 120, 7, 20, { fried: .3 }), xitGarlic(p, 134, 76, 7, -30, { fried: .3 }),
        K.sprinkle(p, 100, 100, 120, { c: '#4a6a24', n: 40, r: .8 }),
        xitBasil(p, 140, 132, 20, 30),
    ].join(''),

    // arista al latte: slices of pork loin fanned on a plate, covered with the golden curdled milk sauce, sage and rosemary
    it_maialelatte: p => [
        xitPlate(p),
        xitSauce(p, 100, 104, 140, '#d2a862', { seed: 1, op: .95 }),
        ...[[62, 80, -30], [88, 72, -20], [116, 74, -5], [140, 88, 10], [72, 118, -25], [100, 112, -10], [128, 124, 5]].map(([x, y, r]) => xitLoin(p, x, y, 44, r)),
        xitSauce(p, 100, 132, 90, '#cfa25a', { seed: 3, op: .85, sy: .4, j: .4 }),
        K.sprinkle(p, 100, 120, 120, { c: '#b8863e', n: 40, r: 1.8 }), K.sprinkle(p, 100, 120, 110, { c: '#f2e2b8', n: 30, r: 1.4 }),
        K.glaze(p, 100, 104, 120, '#e8cf94', { op: .3, seed: 2 }),
        xitSage(p, 104, 144, 24, -20), xitSage(p, 124, 150, 20, 30), xitRosemary(p, 142, 56, 32, 40),
        xitPepper(p, 100, 100, 110, 20),
    ].join(''),

    // agnello al forno con patate: baking dish of browned lamb pieces on the bone, roast potatoes, rosemary, garlic, lemon
    it_agnello: p => [
        xitBakingDish(p, { line: '#2f6f8f' }),
        `<rect x="22" y="36" width="156" height="128" rx="14" fill="#b07a3a" opacity=".35"/>`,
        ...[[40, 54, 10], [72, 50, 70], [150, 52, 40], [40, 100, -50], [162, 96, 20], [44, 146, 30], [124, 150, 60], [160, 146, -40], [100, 146, 0], [70, 148, 20]].map(([x, y, r], i) => xitRoastPotato(p, x, y, 26, r, { seed: i })),
        xitLamb(p, 76, 86, 46, -20, { seed: 1 }), xitLamb(p, 126, 74, 44, 30, { seed: 2 }), xitLamb(p, 120, 118, 48, -10, { seed: 3 }), xitLamb(p, 76, 124, 42, 40, { seed: 4 }),
        xitClove(p, 100, 100, 14, 20), xitClove(p, 150, 120, 13, -40), xitClove(p, 56, 70, 12, 60),
        xitRosemary(p, 100, 64, 34, 20), xitRosemary(p, 150, 92, 30, -50), xitRosemary(p, 52, 118, 28, 80),
        xitLemonWedge(p, 104, 150, 26, 10),
    ].join(''),

    // orata al forno: oval baking dish, whole sea bream on sliced potatoes, cherry tomatoes, lemon slices, parsley
    it_orata: p => [
        K.ovalDish(p, { rx: 96, ry: 76, base: '#f3ede0', rim: '#b9472f', deep: true }),
        ...xitSpots('ora', 22, 66, 15, 100, 100, .72).map(([x, y]) => xitPotSlice(p, x, y, 22, { browned: .5 })),
        xitBream(p, 100, 98, 150, -6),
        xitTomHalf(p, 46, 126, 20, 20), xitTomHalf(p, 150, 128, 20, -20), xitTomHalf(p, 126, 140, 18, 40), xitTomHalf(p, 64, 66, 18, 0), xitTomHalf(p, 138, 60, 17, 70),
        xitCitrusSlice(p, 84, 136, 24), xitCitrusSlice(p, 108, 62, 22),
        xitParsley(p, 100, 104, 130, { n: 40 }),
        xitOil(p, 100, 100, 120, { n: 6, op: .5 }),
    ].join(''),

    // seppie con i piselli: cuttlefish strips and lots of peas in a light tomato sauce
    it_seppie: p => {
        const R = rng(p.id + 'pe');
        return [
            xitBowl(p, '#3c6e9a'),
            K.liquid(p, { R: 72, c: '#c0582e', op: 1, shine: false }),
            ...xitSpots('sep', 16, 56, 15).map(([x, y, r]) => xitBand(p, x, y, 30, 8, r, { c: '#f4e6d4', bend: .2 })),
            ...xitSpots('sepp', 70, 64, 7.4).map(([x, y]) => xitPea(p, x, y, 8.4, { c: R() < .5 ? '#6aae36' : '#7cbc44' })),
            xitArc(72, .4),
            xitParsley(p, 100, 100, 110, { n: 30 }),
        ].join('');
    },

    // uova in purgatorio: pan of thick tomato sauce with four eggs, basil, Parmigiano, a slice of bread on the side
    it_purgatorio: p => [
        xitPan(p),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#b8301e', .2, .3)}"/>`,
        ...xitSpots('pur', 14, 64, 14).map(([x, y], i) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${3 + i % 3}" fill="#d0482c" opacity=".6"/>`),
        xitSauceEgg(p, 74, 78, 44, { seed: 1 }), xitSauceEgg(p, 128, 80, 42, { seed: 2 }), xitSauceEgg(p, 72, 128, 42, { seed: 3 }), xitSauceEgg(p, 126, 128, 44, { seed: 4 }),
        xitBasil(p, 100, 100, 24, -30), xitBasil(p, 104, 60, 18, 40), xitBasil(p, 100, 146, 18, 160),
        xitCheese(p, 100, 100, 130, 36), xitPepper(p, 100, 100, 130, 30),
    ].join(''),

    // parmigiana di melanzane: baking dish, bubbling top of tomato, melted mozzarella browned in spots, aubergine edges, basil
    it_parmigiana: p => {
        const R = rng(p.id + 'pm');
        let crust = '', melt = '';
        for (let i = 0; i < 16; i++) crust += `<ellipse cx="${f1(30 + R() * 140)}" cy="${f1(44 + R() * 112)}" rx="${f1(6 + R() * 10)}" ry="${f1(4 + R() * 6)}" fill="${R() < .6 ? '#b8601e' : '#8a3a14'}" opacity="${f1(.35 + R() * .3)}"/>`;
        for (let i = 0; i < 9; i++) melt += `<path ${T(56 + (i % 3) * 46 + R() * 10, 60 + Math.floor(i / 3) * 40 + R() * 10)} d="${smooth(ring(15 + R() * 5, 10, .5, R, 1.3, .9))}" fill="${p.rg('#f0c870', .3, .25)}"/>`;
        const cid = p.def('pmclip', id => `<clipPath id="${id}"><rect x="20" y="34" width="160" height="132" rx="16"/></clipPath>`);
        return [
            xitBakingDish(p),
            `<g clip-path="url(#${cid})">`,
            `<rect x="20" y="34" width="160" height="132" rx="16" fill="${p.rg('#b8331e', .2, .3)}"/>`,
            ...[[28, 70, 80], [172, 120, -80], [70, 160, 0], [140, 40, 180]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-22,4 Q0,-6 22,4" stroke="#3d1c44" stroke-width="5" fill="none" stroke-linecap="round"/></g>`),
            ...[[52, 104, 20], [100, 60, -10], [150, 76, 30], [96, 140, -20], [148, 140, 10], [44, 58, 40]].map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="25" ry="15" fill="#3d1c44"/><ellipse rx="22.6" ry="12.6" fill="${p.g('#b87a3a', .25, .3)}"/><ellipse cx="2" cy="2" rx="10" ry="5" fill="#c4392a" opacity=".6"/></g>`),
            `<g ${p.sh(.6)}>${melt}</g>`,
            `<g ${xitBlur(p, 3)}>${crust}</g>`,
            ...[[54, 66], [112, 60], [150, 98], [86, 110], [136, 140], [44, 136]].map(([x, y], i) => xitSauce(p, x, y, 16 + (i % 3) * 4, '#c03a22', { seed: i + 20, j: .5 })),
            `</g>`,
            `<g ${xitBlur(p, 2)}><rect x="22" y="36" width="156" height="128" rx="14" fill="none" stroke="#6e2a12" stroke-width="5" opacity=".55"/></g>`,
            xitBasil(p, 92, 92, 30, -30), xitBasil(p, 114, 108, 26, 50), xitBasil(p, 104, 76, 20, 160, { c: '#4aa83c' }),
        ].join('');
    },

    // fagioli all'uccelletto con salsiccia: terracotta pan of cannellini in tomato with browned sausages and sage
    it_uccelletto: p => [
        xitCoccio(p),
        `<circle cx="100" cy="100" r="75" fill="${p.rg('#c0582e', .2, .3)}"/>`,
        ...xitSpots('ucc', 56, 66, 10).map(([x, y, r]) => xitBean(p, x, y, 15, r, { c: '#f0dcc0', sh: false })),
        `<circle cx="100" cy="100" r="74" fill="#c0482a" opacity=".22"/>`,
        xitSausage(p, 80, 82, 64, 18, -25, { seed: 1, cut: false, c: '#a8582e' }), xitSausage(p, 124, 112, 62, 18, 20, { seed: 2, cut: false, c: '#a8582e' }), xitSausage(p, 76, 132, 54, 18, 5, { seed: 3, c: '#a8582e' }),
        xitSage(p, 122, 70, 26, -30), xitSage(p, 136, 80, 22, 20), xitSage(p, 100, 104, 22, 70), xitSage(p, 58, 104, 20, -60),
        xitPepper(p, 100, 100, 120, 30), xitOil(p, 100, 100, 120, { n: 6, op: .6 }),
    ].join(''),

    // insalata di finocchi e arance: orange slices, thin fennel slices, black olives, red onion, olive oil, fennel fronds
    it_finocchiarance: p => [
        xitPlate(p, { rim: '#2f6f8f' }),
        ...[[72, 76], [118, 68], [142, 108], [100, 104], [62, 116], [108, 140]].map(([x, y]) => xitCitrusSlice(p, x, y, 40, { c: '#f39a2a', rind: '#e2781a', pith: '#fbe2b8' })),
        ...[[94, 74, 20], [132, 84, -40], [80, 98, 60], [124, 126, 10], [84, 136, -30], [140, 140, 80], [56, 92, 120], [104, 122, 160]].map(([x, y, r]) => xitFennel(p, x, y, 22, r)),
        xitRedOnion(p, 92, 112, 14, 20), xitRedOnion(p, 126, 104, 12, -20), xitRedOnion(p, 70, 136, 12, 40, { half: true }), xitRedOnion(p, 110, 84, 12, 60, { half: true }),
        ...[[86, 88], [120, 96], [100, 128], [66, 102], [138, 124], [114, 58]].map(([x, y], i) => xitOlive(p, x, y, 12, i * 40, { ring0: true })),
        xitOil(p, 100, 100, 110, { n: 8, op: .5 }), xitPepper(p, 100, 100, 110, 20),
        xitFronds(p, 96, 100, 10, -30), xitFronds(p, 130, 70, 9, 40),
    ].join(''),

    // panzanella: olive-wood bowl, soaked torn bread, tomato chunks, cucumber, red onion, basil
    it_panzanella: p => {
        const sp = xitSpots('pzn', 26, 60, 18);
        return [
            xitWoodBowl(p),
            `<circle cx="100" cy="100" r="74" fill="#d4945a" opacity=".5"/>`,
            ...sp.map(([x, y, r], i) => i % 3 === 0 ? xitBreadChunk(p, x, y, 22, r, { seed: i, soaked: .25 })
                : i % 3 === 1 ? K.tomatoWedge(p, x, y, 22, r)
                : xitBreadChunk(p, x, y, 20, r, { seed: i, soaked: .12 })),
            ...xitSpots('pznc', 9, 54, 20).map(([x, y, r]) => K.cucumberChunk(p, x, y, 14, r, { seed: x })),
            xitRedOnion(p, 90, 92, 14, 20, { half: true }), xitRedOnion(p, 120, 116, 14, -40, { half: true }), xitRedOnion(p, 72, 124, 12, 70, { half: true }), xitRedOnion(p, 128, 76, 12, 10, { half: true }),
            xitBasil(p, 100, 100, 26, -30), xitBasil(p, 122, 96, 20, 50), xitBasil(p, 80, 72, 20, 160), xitBasil(p, 92, 134, 18, 100),
            xitOil(p, 100, 100, 110, { n: 8, op: .5 }),
        ].join('');
    },

    // rucola, pomodorini e grana: a heap of rocket, halved cherry tomatoes, Parmigiano shavings, balsamic drops
    it_rucola: p => {
        const R = rng(p.id + 'rk');
        return [
            xitPlate(p),
            `<circle cx="100" cy="100" r="66" fill="#3f6e22" opacity=".9"/>`,
            ...xitSpots('ruc', 48, 66, 9).map(([x, y, r]) => xitRocket(p, x, y, 28, r, { c: R() < .5 ? '#4f8a2e' : '#5e9a36' })),
            ...[[78, 84], [124, 78], [130, 122], [84, 128], [104, 104], [60, 104], [104, 62], [148, 98]].map(([x, y], i) => xitTomHalf(p, x, y, 18, i * 30)),
            ...[[96, 86, 20], [116, 100, -30], [92, 116, 60], [120, 140, 10], [70, 112, -50], [138, 82, 30], [76, 70, 80]].map(([x, y, r], i) => xitShaving(p, x, y, 24, r, { seed: i })),
            ...[[88, 100], [112, 120], [130, 98], [100, 76], [74, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#3a1a12" opacity=".8"/>`),
        ].join('');
    },

    // pinzimonio: olive-wood board, crudités sticks (carrot, celery, fennel, red and yellow pepper, cucumber) around a little bowl of olive oil
    it_pinzimonio: p => {
        const kinds = [['#ef7f30', null, 6], ['#a9cf6e', '#d8eab0', 6], ['#d8352a', null, 7], ['#f2bd2a', null, 7], ['#3f7d2e', '#d6eab0', 7], ['#eef3d6', '#c9d9a0', 9]];
        const out = [];
        for (let i = 0; i < 18; i++){ const a = i / 18 * 6.28 + .1, k = kinds[i % 6], d = 58 + (i % 2) * 6; out.push(xitStick(p, 100 + Math.cos(a) * d, 100 + Math.sin(a) * d, 50, k[2], a * 57.3 + (i % 3 - 1) * 8, { c: k[0], core: k[1] })); }
        return [
            xitBoard(p),
            ...out,
            `<g ${p.sh(1.2)}><circle cx="100" cy="100" r="30" fill="${p.rg('#f6f2ea', .2, .2, .38, .32)}"/></g><circle cx="100" cy="100" r="26" fill="none" stroke="#2f6f8f" stroke-width="1.6"/>`,
            `<circle cx="100" cy="100" r="23" fill="${p.rg('#d9b42a', .3, .2)}"/>`,
            xitShine('M84,92 A18,18 0 0 1 96,80', 1.6, .7),
            K.sprinkle(p, 100, 100, 26, { c: '#fff', n: 10, r: .8 }), xitPepper(p, 100, 100, 26, 10),
        ].join('');
    },
    // insalata di carote: yellow bowl of finely julienned raw carrot, parsley, lemon wedge, oil
    it_carote: p => [
        xitBowl(p, '#e0b23a'),
        `<circle cx="100" cy="100" r="70" fill="#e8742a" opacity=".9"/>`,
        `<g ${p.sh(.5)}>`,
        K.shreds(p, 100, 100, 120, { c: '#ef7f30', n: 60, w: 2.6, len: .32, seed: 1 }),
        K.shreds(p, 100, 100, 100, { c: '#f59a42', n: 40, w: 2.4, len: .3, seed: 2 }),
        `</g>`,
        xitParsley(p, 100, 100, 110, { n: 34 }),
        xitOil(p, 100, 100, 100, { n: 6, op: .45 }),
        xitLemonWedge(p, 138, 128, 34, -40),
    ].join(''),

    // insalata di fagioli e cipolla rossa: speckled borlotti, red onion, tuna flakes, parsley, oil
    it_borlotti: p => {
        const R = rng(p.id + 'bt');
        return [
            xitBowl(p, '#f2eee4'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#b9472f" stroke-width="2"/>`,
            `<circle cx="100" cy="100" r="72" fill="#9a6a5a" opacity=".5"/>`,
            ...xitSpots('brl', 54, 66, 10).map(([x, y, r], i) => xitBean(p, x, y, 16, r, { c: i % 3 ? '#b88272' : '#c79482', speck: '#6a3428', sh: false })),
            ...[[86, 86, 10], [118, 108, -30], [96, 130, 40], [134, 78, 70], [66, 112, -10], [110, 66, 20]].map(([x, y, r], i) => xitRedOnion(p, x, y, 16, r, { half: i % 2 === 0 })),
            ...[[104, 96], [76, 76], [130, 130]].map(([x, y], i) => `<g ${p.sh(.5)}><path ${T(x, y, i * 50)} d="${smooth(ring(8, 8, .5, R, 1.3, .8))}" fill="${p.g('#e2c4a0', .35, .25)}" stroke="#b08a66" stroke-width=".6"/></g>`),
            xitParsley(p, 100, 100, 110, { n: 34 }),
            xitOil(p, 100, 100, 110, { n: 8, op: .5 }), xitPepper(p, 100, 100, 110, 20),
        ].join('');
    },

    // zucchine alla scapece: deep-golden fried zucchini rounds, fresh mint, garlic, vinegar sheen
    it_scapece: p => [
        xitPlate(p, { rim: '#2f6f8f' }),
        ...xitSpots('scp', 24, 58, 19).map(([x, y], i) => xitZuc(p, x, y, 26, { browned: 1.3, seed: i, skin: '#2f5a1e' })),
        ...xitSpots('scp2', 7, 40, 24).map(([x, y], i) => xitZuc(p, x + 4, y + 3, 24, { browned: 1.3, seed: i + 40, skin: '#2f5a1e' })),
        `<g opacity=".55">${K.sprinkle(p, 100, 100, 110, { c: '#9a5a14', n: 24, r: 2.2 })}</g>`,
        xitMint(p, 96, 92, 22, -30), xitMint(p, 122, 112, 20, 40), xitMint(p, 78, 120, 20, 160), xitMint(p, 116, 70, 18, 80), xitMint(p, 70, 80, 16, -60),
        xitGarlic(p, 104, 120, 8, 20, { fried: .3 }), xitGarlic(p, 84, 104, 8, -40, { fried: .3 }), xitGarlic(p, 134, 90, 7, 60, { fried: .3 }),
    ].join(''),

    // cipolline in agrodolce: green-glazed bowl of glossy, caramel-brown baby onions in a dark sweet-sour glaze
    it_cipolline: p => [
        xitBowl(p, '#4f7a4a'),
        K.liquid(p, { R: 72, c: '#6e3416', op: 1, shine: false }),
        ...xitSpots('cip', 17, 54, 25).map(([x, y, r]) => xitCipollina(p, x, y, 28, r)),
        K.glaze(p, 100, 100, 130, '#8a4418', { op: .25 }),
        xitArc(72, .45),
    ].join(''),

    // funghi trifolati: sliced mushrooms sauteed golden-brown with garlic and lots of parsley
    it_funghitrifolati: p => [
        xitBowl(p, '#b5643c', '#f4ead8'),
        `<circle cx="100" cy="100" r="72" fill="#8a5a30" opacity=".6"/>`,
        ...xitSpots('fgt', 34, 62, 14).map(([x, y, r], i) => xitMushSlice(p, x, y, 24, r, { c: i % 3 ? '#c99a64' : '#d8b080', cap: i % 2 ? '#6e4220' : '#5a3418' })),
        xitGarlic(p, 92, 98, 7, 20, { fried: .6 }), xitGarlic(p, 118, 116, 7, -40, { fried: .6 }), xitGarlic(p, 80, 128, 7, 60, { fried: .6 }),
        xitParsley(p, 100, 100, 120, { n: 50 }),
        xitPepper(p, 100, 100, 110, 20),
    ].join(''),

    // cicoria ripassata: dark wilted chicory with golden garlic slivers and dried chili, glossy with oil
    it_cicoria: p => [
        xitPlate(p),
        `<g ${p.sh(.8)}><path ${T(100, 100)} d="${xitSm(ring(62, 12, .2, rng(p.id + 'c')), true)}" fill="${p.rg('#2a4a1a', .2, .3)}"/></g>`,
        ...xitSpots('cic', 26, 54, 14).map(([x, y, r], i) => xitChicory(p, x, y, 48, r, { c: i % 3 ? '#2f5a1e' : '#3a6a26', seed: i })),
        xitGarlic(p, 90, 96, 8, 20, { fried: .7 }), xitGarlic(p, 118, 112, 8, -40, { fried: .7 }), xitGarlic(p, 80, 124, 7, 60, { fried: .7 }), xitGarlic(p, 124, 80, 7, 10, { fried: .7 }),
        xitBand(p, 104, 104, 20, 4.4, 30, { c: '#c8281a', bend: .1 }), xitBand(p, 76, 84, 16, 4, -50, { c: '#c8281a', bend: .1 }), xitBand(p, 130, 132, 16, 4, 70, { c: '#c8281a', bend: .1 }),
        xitOil(p, 100, 100, 110, { n: 8, op: .5 }),
    ].join(''),

    // carciofi alla romana: four whole artichokes stem-up in their oily braising juices, mint and parsley
    it_carciofi: p => [
        xitBowl(p, '#d8c8a0', '#f6efe0'),
        K.liquid(p, { R: 72, c: '#b8a04a', op: .85, shine: false }),
        xitArtichoke(p, 72, 74, 62, 10), xitArtichoke(p, 128, 76, 60, 40), xitArtichoke(p, 72, 128, 60, 70), xitArtichoke(p, 128, 128, 62, -20),
        xitOil(p, 100, 100, 130, { n: 10, op: .6 }),
        xitMint(p, 100, 100, 22, -30), xitMint(p, 100, 64, 16, 40), xitMint(p, 102, 138, 16, 160),
        xitParsley(p, 100, 100, 130, { n: 24 }),
    ].join(''),

    // caponata: aubergine cubes in glossy sweet-sour red-brown sauce, celery, green olives, capers, pine nuts, basil
    it_caponata: p => [
        xitBowl(p, '#e0b23a', '#fbf2dc'),
        K.liquid(p, { R: 72, c: '#8a321e', op: 1, shine: false }),
        ...xitSpots('cap', 26, 60, 15).map(([x, y, r], i) => xitAubCube(p, x, y, 17, r, { seed: i, flesh: '#b8642e' })),
        ...[[84, 80, 20], [124, 100, -30], [96, 130, 60], [140, 130, 10], [62, 116, -60]].map(([x, y, r]) => xitDice(p, x, y, 11, r, '#bcd27a')),
        ...[[100, 96], [76, 100], [126, 74], [112, 140], [148, 104]].map(([x, y], i) => xitOlive(p, x, y, 13, i * 40, { c: '#7f8a2a' })),
        xitCapers(p, [[92, 112], [118, 120], [70, 82], [132, 88], [84, 140]]),
        ...[[104, 80], [88, 124], [134, 114], [70, 132], [116, 102]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.8" transform="rotate(${i * 50} ${x} ${y})" fill="#f3e2b4" stroke="#c9ad6a" stroke-width=".5"/>`),
        K.glaze(p, 100, 100, 120, '#a8401e', { op: .2 }),
        xitBasil(p, 108, 92, 22, -30), xitBasil(p, 90, 82, 16, 120),
    ].join(''),

    // piselli al prosciutto: bright peas with pink diced ham and soft onion
    it_piselli: p => [
        xitBowl(p, '#f2eee4'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#2f6f8f" stroke-width="2"/>`,
        `<circle cx="100" cy="100" r="72" fill="#8aa848" opacity=".7"/>`,
        ...xitSpots('pis', 110, 68, 8).map(([x, y], i) => xitPea(p, x, y, 10, { c: i % 3 ? '#6aae36' : '#7ebe46' })),
        ...xitSpots('pish', 12, 56, 20).map(([x, y, r]) => `<g ${p.sh(.5)}>${xitDice(p, x, y, 12, r, '#eb9a9a')}</g>`),
        K.onion(p, 90, 90, 16, 30, { c: '#f2e2b0', layers: 1 }), K.onion(p, 120, 120, 16, -60, { c: '#f2e2b0', layers: 1 }),
        xitPepper(p, 100, 100, 110, 16),
    ].join(''),

    // verza stufata: soft braised savoy cabbage ribbons with crisp pancetta cubes and black pepper
    it_verza: p => [
        xitPan(p),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#b9c27a', .2, .3)}"/>`,
        ...xitSpots('ver', 22, 60, 17).map(([x, y, r], i) => K.leafPiece(p, x, y, 34, r, { c: i % 3 === 0 ? '#d9dc9a' : i % 3 === 1 ? '#b9cc78' : '#9ab860', vein: '#e2eab0', seed: i % 4, cooked: true })),
        ...xitSpots('verp', 12, 56, 20).map(([x, y, r]) => xitGuanciale(p, x, y, 13, 10, r, { meat: '#c0503a' })),
        K.onion(p, 100, 100, 18, 30, { c: '#f0dca8', layers: 1 }),
        xitPepper(p, 100, 100, 140, 50),
    ].join(''),

    // purè di patate: bowl of creamy mashed potato with spoon swirls, a melting knob of butter and nutmeg
    it_pure: p => [
        xitBowl(p, '#8fae9a'),
        xitMash(p, 100, 100, 150),
        `<g ${p.sh(.6)}><rect x="92" y="88" width="20" height="16" rx="3" fill="${p.g('#f8e08a', .4, .2)}" stroke="#d9b84a" stroke-width=".6" transform="rotate(12 102 96)"/></g>`,
        K.glaze(p, 104, 100, 34, '#f6d25a', { op: .45 }),
        K.sprinkle(p, 100, 100, 100, { c: '#a8742e', n: 20, r: .7 }),
    ].join(''),

    // patate al forno con rosmarino: dark pan of crisp golden potato chunks with rosemary and unpeeled garlic
    it_patatearrosto: p => [
        xitPan(p),
        ...xitSpots('pat', 22, 60, 22).map(([x, y, r], i) => xitRoastPotato(p, x, y, 30 + (i % 3) * 2, r, { seed: i, c: '#e2a640' })),
        xitClove(p, 98, 98, 16, 20), xitClove(p, 140, 120, 14, -40), xitClove(p, 66, 74, 14, 60),
        xitRosemary(p, 84, 112, 40, 30), xitRosemary(p, 124, 80, 36, -40), xitRosemary(p, 104, 138, 30, 10),
        K.sprinkle(p, 100, 100, 130, { c: '#fff', n: 20, r: .9 }),
    ].join(''),

    // verdure grigliate: long platter of grilled aubergine and zucchini slices and charred pepper strips, oil and mint
    it_grigliate: p => [
        K.longPlate(p, { w: 188, h: 140, base: '#f6f3ea', rim: '#2f6f8f' }),
        xitGrilled(p, 52, 72, 54, 26, 20), xitGrilled(p, 64, 118, 56, 26, -15), xitGrilled(p, 104, 94, 54, 26, 70, { skin: '#4d2a5c' }),
        xitGrilled(p, 148, 70, 60, 18, -10, { flesh: '#e6e8b0', skin: '#3c6a28' }), xitGrilled(p, 150, 100, 60, 18, 5, { flesh: '#e6e8b0', skin: '#3c6a28' }), xitGrilled(p, 112, 136, 60, 18, -20, { flesh: '#e6e8b0', skin: '#3c6a28' }),
        xitGrilled(p, 40, 100, 50, 24, 80), xitGrilled(p, 160, 120, 50, 24, -60),
        xitBand(p, 92, 62, 44, 12, -10, { c: '#d42e1e', bend: .12 }), xitBand(p, 128, 108, 40, 12, 40, { c: '#d42e1e', bend: .12 }), xitBand(p, 146, 132, 40, 12, 20, { c: '#f2b51e', bend: .12 }), xitBand(p, 70, 140, 36, 11, 10, { c: '#f2b51e', bend: .1 }),
        `<path d="M80,60 l8,-3 M98,64 l8,-3 M136,130 l8,-3 M150,134 l8,-3" stroke="#3a1a0c" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`,
        xitOil(p, 100, 100, 130, { n: 8, op: .5 }),
        xitMint(p, 96, 112, 18, -30), xitMint(p, 128, 86, 16, 40), xitMint(p, 72, 92, 14, 120),
    ].join(''),

    // pomodori gratinati: baking dish of tomato halves topped with golden herby breadcrumbs
    it_pomodorigratinati: p => [
        xitBakingDish(p, { line: '#2f6f8f' }),
        `<rect x="22" y="36" width="156" height="128" rx="14" fill="#b84a26" opacity=".35"/>`,
        ...[[52, 70], [100, 66], [148, 70], [52, 130], [100, 134], [148, 130]].map(([x, y], i) => xitTomGratin(p, x, y, 50, i * 30, { seed: i })),
        xitParsley(p, 100, 100, 150, { n: 40 }),
        xitOil(p, 100, 100, 150, { n: 8, op: .5 }),
    ].join(''),

    // cavolfiore gratinato: square dish of cauliflower florets under béchamel with a golden Parmigiano crust
    it_cavolfiore: p => {
        const R = rng(p.id + 'cv');
        let crust = '';
        for (let i = 0; i < 12; i++) crust += `<ellipse cx="${f1(40 + R() * 120)}" cy="${f1(40 + R() * 120)}" rx="${f1(5 + R() * 8)}" ry="${f1(4 + R() * 5)}" fill="#d49a3e" opacity="${f1(.4 + R() * .3)}"/>`;
        return [
            K.squareDish(p, { s: 180, base: '#e8e2d6', rim: '#9a6a3a' }),
            `<rect x="20" y="20" width="160" height="160" rx="14" fill="${p.rg('#f2e4bc', .2, .2)}"/>`,
            ...xitSpots('cvf', 18, 60, 26).map(([x, y, r]) => xitCauli(p, x, y, 40, r)),
            `<g ${xitBlur(p, 1.2)}>${crust}</g>`,
            K.glaze(p, 100, 100, 140, '#e8b85a', { op: .22 }),
            `<g ${p.crumb(.9)} opacity=".8">${K.crumbs(p, 100, 100, 130, { n: 50, c: '#d99a46' })}</g>`,
            xitParsley(p, 100, 100, 110, { n: 24 }),
        ].join('');
    },

    // asparagi alla parmigiana: long plate of green asparagus with melted butter and Parmigiano, topped with a fried egg
    it_asparagi: p => [
        K.longPlate(p, { w: 188, h: 136, base: '#f6f3ea', rim: '#c8b27a' }),
        ...Array.from({ length: 12 }, (_, i) => xitAsparagus(p, 96 + (i % 2) * 6, 52 + i * 8.6, 148 - (i % 3) * 6, 0, { c: i % 2 ? '#6aa03a' : '#5f9634' })),
        `<g ${p.crumb(.9)}>${K.sprinkle(p, 86, 100, 100, { c: '#f6e2a0', n: 80, r: 1.5 })}</g>`,
        K.friedEgg(p, 74, 100, 74),
        xitPepper(p, 90, 100, 120, 40),
    ].join(''),
    // stracciatella alla romana: soup plate of golden stock with fluffy ribbons of egg and Parmigiano, parsley
    it_stracciatella: p => [
        xitSoupPlate(p),
        K.liquid(p, { R: 68, c: '#d8a43e', op: 1, shine: false }),
        `<g ${p.sh(.4)}>`, ...xitSpots('str', 9, 50, 26).map(([x, y, r], i) => xitEggRag(p, x, y, 36 + (i % 3) * 6, r, { seed: i, c: '#fbe27a' })), `</g>`,
        xitEggRag(p, 100, 100, 42, 30, { seed: 40, c: '#fce68a' }),
        xitEyes(p, 100, 100, 120, { n: 8 }),
        xitArc(68, .45),
        xitParsley(p, 100, 100, 100, { n: 30 }),
        K.sprinkle(p, 100, 100, 90, { c: '#fbf3d2', n: 24, r: 1 }),
    ].join(''),

    // tortellini in brodo: white bowl with gold line, clear golden broth with little fat eyes, a dozen tortellini, Parmigiano
    it_tortellinibrodo: p => [
        xitBowl(p, '#f4efe4'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#c8a24a" stroke-width="1.8"/>`,
        K.liquid(p, { R: 76, c: '#d9a03e', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="52" fill="#ecc06a" opacity=".35"/>`,
        ...xitSpots('tor', 15, 56, 24).map(([x, y, r]) => xitTortellino(p, x, y, 26, r, { broth: '#c99030' })),
        xitEyes(p, 100, 100, 140, { n: 16 }),
        xitArc(76, .5),
        K.sprinkle(p, 100, 100, 70, { c: '#fbf3d2', n: 20, r: 1 }),
    ].join(''),

    // pastina in brodo: soup plate of golden vegetable broth full of tiny star pasta, a few carrot bits, Parmigiano, parsley
    it_pastinabrodo: p => [
        xitSoupPlate(p),
        K.liquid(p, { R: 68, c: '#e0ac52', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="46" fill="#f0c878" opacity=".35"/>`,
        xitStars(p, 100, 100, 124, { n: 80, c: '#f6dc8a', sz: 4.2 }),
        ...[[84, 88], [116, 110], [100, 70], [70, 116], [130, 80]].map(([x, y], i) => xitDice(p, x, y, 6, i * 30, '#ef7d2e')),
        xitEyes(p, 100, 100, 120, { n: 10 }),
        xitArc(68, .45),
        K.sprinkle(p, 100, 100, 80, { c: '#fbf3d2', n: 24, r: 1 }),
        xitParsley(p, 100, 100, 80, { n: 16 }),
    ].join(''),

    // brodo di pollo: bowl of clear golden chicken broth with pulled chicken, carrot rounds, celery, a little soup pasta, parsley
    it_brodopollo: p => {
        const R = rng(p.id + 'ck');
        return [
            xitBowl(p, '#3c6e9a'),
            K.liquid(p, { R: 76, c: '#d8a040', op: 1, shine: false }),
            `<circle cx="96" cy="94" r="50" fill="#eac070" opacity=".35"/>`,
            ...[[80, 84], [122, 80], [110, 124], [72, 120], [100, 100]].map(([x, y], i) => `<g ${p.sh(.6)}><path ${T(x, y, i * 50)} d="${smooth(ring(11, 9, .4, R, 1.4, .7))}" fill="${p.g('#f2e2c4', .3, .2)}" stroke="#c9ad80" stroke-width=".7"/></g><path ${T(x, y, i * 50)} d="M-9,-1 L8,-2 M-7,3 L7,2" stroke="#d9c49a" stroke-width=".9"/>`),
            ...[[96, 66], [138, 104], [60, 96], [126, 140], [84, 140], [146, 72]].map(([x, y]) => K.carrotRound(p, x, y, 13, { c: '#ec7a2a' })),
            ...[[110, 90], [88, 108], [124, 64], [66, 70], [140, 124]].map(([x, y], i) => xitDice(p, x, y, 8, i * 20, '#b8d27a')),
            ...[[100, 82], [118, 104], [80, 100], [102, 134], [134, 90], [70, 136]].map(([x, y], i) => xitDitalino(p, x, y, 7, i * 30, { end: i % 2 === 0 })),
            xitEyes(p, 100, 100, 140, { n: 12 }),
            xitArc(76, .5),
            xitParsley(p, 100, 100, 110, { n: 26 }),
        ].join('');
    },

    // ribollita: terracotta pot of very thick Tuscan bread soup: cavolo nero, cannellini, carrot, bread, olive oil, pepper
    it_ribollita: p => [
        xitCoccio(p, { c: '#a8582e' }),
        `<circle cx="100" cy="100" r="75" fill="${p.rg('#7e6a3a', .2, .3)}"/>`,
        (() => { const R = rng(p.id + 'rl'); let l = ''; for (let i = 0; i < 24; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 64; l += `<circle cx="${f1(100 + Math.cos(a) * d)}" cy="${f1(100 + Math.sin(a) * d)}" r="${f1(5 + R() * 7)}" fill="${['#a08a52', '#5e6a3a', '#9a6a3a'][i % 3]}" opacity=".7"/>`; } return `<g ${xitBlur(p, 2)}>${l}</g>`; })(),
        ...xitSpots('rib', 26, 62, 14).map(([x, y, r], i) => i % 3 === 0 ? xitBreadChunk(p, x, y, 20, r, { seed: i, soaked: .0, crumb: '#c8a466', crust: '#8a5424' }) : xitBean(p, x, y, 15, r, { c: '#efe2c8', sh: false })),
        ...xitSpots('ribk', 14, 60, 18).map(([x, y, r]) => xitKale(p, x, y, 30, r)),
        ...[[84, 96], [116, 118], [128, 78], [70, 128], [104, 64]].map(([x, y], i) => xitDice(p, x, y, 9, i * 25, '#e2782a')),
        xitOilLine(p, [[56, 92], [80, 76], [110, 84], [134, 72], [150, 90]], { c: '#b8a828', w: 2.6 }),
        xitOilLine(p, [[66, 130], [96, 120], [124, 132]], { c: '#b8a828', w: 2.2 }),
        xitPepper(p, 100, 100, 130, 50),
    ].join(''),

    // pappa al pomodoro: soup plate of thick, rough tomato-and-bread porridge, raw olive oil swirl, basil, pepper
    it_pappapomodoro: p => {
        const R = rng(p.id + 'pp');
        let lumps = '';
        for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 58; lumps += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d)} d="${smooth(ring(5 + R() * 5, 7, .5, R))}" fill="${R() < .5 ? '#d8603a' : '#a8301c'}" opacity=".7"/>`; }
        return [
            xitSoupPlate(p),
            K.liquid(p, { R: 68, c: '#c0402a', op: 1, shine: false }),
            `<g ${xitBlur(p, 1)}>${lumps}</g>`,
            ...xitSpots('ppb', 10, 52, 22).map(([x, y, r], i) => xitBreadChunk(p, x, y, 18, r, { seed: i, soaked: .5, crust: '#a8401e' })),
            xitOilLine(p, [[52, 100], [70, 76], [100, 70], [128, 80], [140, 104], [124, 130], [96, 134], [80, 116], [92, 98], [110, 100]], { c: '#c9b42a', w: 2.8 }),
            xitBasil(p, 106, 92, 28, -30), xitBasil(p, 90, 106, 22, 140), xitBasil(p, 120, 108, 18, 60, { c: '#4aa83c' }),
            xitPepper(p, 100, 100, 110, 30),
        ].join('');
    },

    // passatelli in brodo: bowl of clear golden stock with short, thick, rough passatelli strands, Parmigiano
    it_passatelli: p => [
        xitBowl(p, '#f4efe4'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#b9472f" stroke-width="1.8"/>`,
        K.liquid(p, { R: 76, c: '#d9a644', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#ecc372" opacity=".35"/>`,
        `<g ${p.rough(1.2, .3)}>`, ...xitSpots('pst', 24, 58, 14).map(([x, y, r], i) => xitBand(p, x, y, 30 + (i % 3) * 4, 5.6, r, { c: i % 2 ? '#d9b464' : '#cfa656', bend: (i % 3 - 1) * .18 })), `</g>`,
        `<g ${p.crumb(.9)} opacity=".7">${K.sprinkle(p, 100, 100, 120, { c: '#b88a3a', n: 50, r: 1 })}</g>`,
        xitEyes(p, 100, 100, 140, { n: 12 }),
        xitArc(76, .5),
        K.sprinkle(p, 100, 100, 70, { c: '#fbf3d2', n: 26, r: 1.1 }),
    ].join(''),

    // zuppa di lenticchie: terracotta bowl of brown lentil soup with carrot and celery, olive oil, parsley, a toasted crostino
    it_lenticchie: p => [
        xitBowl(p, '#b5643c', '#f4ead8'),
        K.liquid(p, { R: 74, c: '#6e4a2a', op: 1, shine: false }),
        xitGrains(p, 100, 100, 140, { n: 170, c: '#7a5232', rx: 3, ry: 2.4 }),
        ...[[84, 92], [112, 116], [124, 82], [72, 120], [100, 66], [140, 110], [96, 134]].map(([x, y], i) => xitDice(p, x, y, 9, i * 25, i % 2 ? '#e2782a' : '#a9c46a')),
        xitBreadSlice(p, 132, 132, 50, 34, -30, { seed: 3, crust: '#9a5a22', crumb: '#e6c07e', holes: 8 }),
        xitOil(p, 90, 92, 80, { n: 10, op: .7 }),
        xitArc(74, .35),
        xitParsley(p, 92, 92, 80, { n: 14 }),
    ].join(''),

    // pasta e ceci: soup plate of creamy beige chickpea soup with ditalini, rosemary, a thread of olive oil and pepper
    it_pastaceci: p => [
        xitSoupPlate(p, { line: '#8a5a3a' }),
        K.liquid(p, { R: 68, c: '#d4a464', op: 1, shine: false }),
        `<g ${p.sh(.5)}>`, ...xitSpots('pce', 40, 60, 10.5).map(([x, y, r], i) => i % 2 ? xitChickpea(p, x, y, 12, r) : xitDitalino(p, x, y, 11, r, { c: '#f0d68e', end: i % 4 === 0 })), `</g>`,
        `<circle cx="100" cy="100" r="66" fill="#d8aa6a" opacity=".2"/>`,
        xitOilLine(p, [[62, 110], [84, 92], [110, 96], [134, 84]], { c: '#c9b42a', w: 2.4 }),
        xitRosemary(p, 112, 120, 32, -30),
        xitPepper(p, 100, 100, 110, 40),
    ].join(''),

    // vellutata di zucca: bowl of smooth bright-orange squash soup, cream swirl, croutons, pumpkin seeds, black pepper
    it_vellutatazucca: p => [
        xitBowl(p, '#3c6e9a'),
        K.liquid(p, { R: 76, c: '#e8842a', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="52" fill="#f4a24a" opacity=".45"/>`,
        xitSwirl(p, 96, 98, 110, { c: '#fff3df', w: 3.2 }),
        xitCrouton(p, 128, 126, 14, 20), xitCrouton(p, 142, 108, 13, -20), xitCrouton(p, 116, 142, 13, 40), xitCrouton(p, 64, 74, 12, 10),
        ...[[70, 112, 20], [80, 124, -30], [130, 70, 60], [118, 62, 10], [62, 98, 80], [140, 84, -40]].map(([x, y, r]) => xitSeed(p, x, y, r)),
        xitArc(76, .5),
        xitPepper(p, 100, 100, 110, 34),
    ].join(''),

    // vellutata di patate e porri: pale creamy potato-leek soup, rings of leek, oil, Parmigiano, pepper
    it_patateporri: p => [
        xitBowl(p, '#6f8f5a'),
        K.liquid(p, { R: 76, c: '#e6dbb0', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="52" fill="#f6efd2" opacity=".55"/>`,
        ...[[96, 92], [110, 106], [86, 108], [104, 80], [122, 92], [80, 90], [98, 122]].map(([x, y], i) => xitLeek(p, x, y, 16, i * 30)),
        xitOil(p, 100, 100, 110, { n: 8, op: .7 }),
        xitArc(76, .5),
        K.sprinkle(p, 100, 100, 60, { c: '#fbf3d2', n: 16, r: 1.1 }),
        xitPepper(p, 100, 100, 110, 30),
    ].join(''),

    // zuppa di cozze: terracotta pot heaped with open mussels in a peppery tomato broth, parsley, toasted bread
    it_zuppacozze: p => {
        const sp = xitSpots('coz', 20, 58, 19);
        return [
            xitCoccio(p, { c: '#9a4a2a', inside: '#7a2e1c' }),
            `<circle cx="100" cy="100" r="75" fill="${p.rg('#b4442a', .2, .3)}"/>`,
            ...sp.map(([x, y, r], i) => xitMussel(p, x, y, 36, r, { closed: i % 7 === 3 })),
            xitTomHalf(p, 100, 100, 18, 20), xitTomHalf(p, 70, 128, 16, -10), xitTomHalf(p, 136, 80, 16, 40),
            xitBreadSlice(p, 146, 140, 46, 32, -40, { seed: 2, crust: '#9a5a22', crumb: '#e6c07e', holes: 8 }),
            xitParsley(p, 100, 100, 130, { n: 36 }),
        ].join('');
    },

    // zuppa di pesce: soup plate of red fish stew with white fish chunks, whole prawns, mussels, clams, parsley, crostino
    it_zuppapesce: p => [
        xitSoupPlate(p, { line: '#2f6f8f' }),
        K.liquid(p, { R: 68, c: '#b8482a', op: 1, shine: false }),
        xitFishChunk(p, 84, 92, 28, 20, { seed: 1 }), xitFishChunk(p, 118, 112, 26, -30, { seed: 2 }), xitFishChunk(p, 100, 134, 22, 60, { seed: 3 }),
        xitPrawn(p, 118, 72, 46, -20), xitPrawn(p, 64, 120, 44, 110), xitPrawn(p, 138, 134, 40, 200),
        xitMussel(p, 70, 80, 30, -40), xitMussel(p, 142, 98, 28, 70), xitMussel(p, 96, 106, 26, 10), xitMussel(p, 90, 64, 24, 140),
        xitClam(p, 60, 98, 22, 30, { seed: 1 }), xitClam(p, 122, 146, 20, -40, { seed: 2 }),
        xitParsley(p, 100, 100, 120, { n: 34 }),
        xitOil(p, 100, 100, 110, { n: 6, op: .55 }),
    ].join(''),

    // zuppa d'orzo: bowl of creamy barley soup with speck, potato, carrot and leek
    it_orzo: p => [
        xitBowl(p, '#7a8a5a'),
        K.liquid(p, { R: 76, c: '#d0b688', op: 1, shine: false }),
        xitGrains(p, 100, 100, 142, { n: 150, c: '#ecdcb0', rx: 2.9, ry: 2.1, line: false }),
        ...[[84, 88], [118, 112], [104, 70], [70, 120], [134, 82], [100, 136]].map(([x, y], i) => xitDice(p, x, y, 12, i * 25, '#f0e0a8')),
        ...[[100, 100], [76, 100], [126, 132], [140, 104], [92, 120], [116, 86]].map(([x, y], i) => xitGuanciale(p, x, y, 11, 8, i * 40, { meat: '#a8402a' })),
        ...[[90, 76], [124, 96], [80, 136], [60, 84], [110, 124]].map(([x, y], i) => xitDice(p, x, y, 8, i * 20, '#e2782a')),
        xitLeek(p, 112, 108, 12, 0), xitLeek(p, 70, 70, 12, 0), xitLeek(p, 134, 120, 12, 0),
        xitArc(76, .4),
        xitParsley(p, 100, 100, 90, { n: 16 }),
    ].join(''),

    // pasta e patate: soup plate of thick, creamy potato soup with mixed short pasta, Parmigiano, pepper
    it_pastapatate: p => [
        xitSoupPlate(p),
        K.liquid(p, { R: 68, c: '#e2b862', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="48" fill="#f0cf86" opacity=".4"/>`,
        `<g ${p.sh(.5)}>`, ...xitSpots('pp', 30, 60, 12).map(([x, y, r], i) => i % 3 === 0 ? xitDice(p, x, y, 14, r, '#f3dc98') : i % 3 === 1 ? xitTube(p, x, y, 16, 7, r, { c: '#efce7c' }) : xitDitalino(p, x, y, 11, r, { c: '#f0d080', end: i % 2 === 0 })), `</g>`,
        xitTomHalf(p, 120, 84, 14, 30), xitTomHalf(p, 78, 120, 14, -20),
        `<circle cx="100" cy="100" r="66" fill="#e6bc6a" opacity=".18"/>`,
        xitArc(68, .4),
        K.sprinkle(p, 100, 100, 90, { c: '#fbf3d2', n: 30, r: 1.1 }),
        xitPepper(p, 100, 100, 110, 30),
    ].join(''),

    // zuppa di farro: bowl of brown farro soup with zucchini and carrot, a thread of oil and pepper
    it_farro: p => [
        xitBowl(p, '#c9a050'),
        K.liquid(p, { R: 76, c: '#a8784a', op: 1, shine: false }),
        xitGrains(p, 100, 100, 142, { n: 180, c: '#b88a52', rx: 3, ry: 1.8, line: true }),
        ...[[84, 88], [118, 112], [104, 70], [70, 120], [134, 82], [100, 136], [100, 104]].map(([x, y], i) => xitDice(p, x, y, 11, i * 25, '#e6e8a8', { skin: '#3c6a28' })),
        ...[[96, 78], [124, 96], [80, 106], [116, 134], [60, 96], [140, 120]].map(([x, y], i) => xitDice(p, x, y, 9, i * 20, '#e2782a')),
        xitOilLine(p, [[60, 108], [86, 92], [116, 98], [140, 86]], { c: '#c9b42a', w: 2.2 }),
        xitArc(76, .4),
        xitPepper(p, 100, 100, 120, 34),
    ].join(''),

    // polpettine in brodo: bowl of clear golden broth with tiny meatballs, spinach, small pasta, Parmigiano
    it_polpettinebrodo: p => [
        xitBowl(p, '#f4efe4'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#2f6f8f" stroke-width="1.8"/>`,
        K.liquid(p, { R: 76, c: '#d6a046', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#eac070" opacity=".35"/>`,
        xitStars(p, 100, 100, 130, { n: 50, c: '#f6dc8a', sz: 2.8 }),
        K.greens(p, 84, 112, 40, { c: '#2f6e22', n: 5, seed: 1, stems: '#6f9e42' }), K.greens(p, 124, 84, 36, { c: '#2f6e22', n: 4, seed: 2, stems: '#6f9e42' }), K.greens(p, 118, 132, 30, { c: '#2f6e22', n: 3, seed: 3, stems: '#6f9e42' }),
        ...xitSpots('pol', 15, 56, 22).map(([x, y]) => xitMiniBall(p, x, y, 17)),
        xitEyes(p, 100, 100, 140, { n: 10 }),
        xitArc(76, .5),
        K.sprinkle(p, 100, 100, 70, { c: '#fbf3d2', n: 20, r: 1 }),
    ].join(''),

    // vellutata di funghi: bowl of smooth mushroom-brown cream soup, cream swirl, sauteed mushroom slices, parsley
    it_vellutatafunghi: p => [
        xitBowl(p, '#f2eee4'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#8a5a3a" stroke-width="1.8"/>`,
        K.liquid(p, { R: 76, c: '#a07a52', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#b89268" opacity=".45"/>`,
        xitSwirl(p, 96, 98, 100, { c: '#f2e6d2', w: 3 }),
        xitMushSlice(p, 126, 126, 26, 20, { c: '#c99a64', cap: '#6e4220' }), xitMushSlice(p, 142, 104, 22, -30, { c: '#d8b080', cap: '#5a3418' }), xitMushSlice(p, 112, 144, 22, 60, { c: '#c99a64', cap: '#6e4220' }), xitMushSlice(p, 66, 74, 22, -20, { c: '#d8b080', cap: '#5a3418' }),
        xitArc(76, .45),
        xitParsley(p, 100, 100, 100, { n: 26 }),
        xitPepper(p, 100, 100, 100, 20),
    ].join(''),

    // zuppa pavese: bowl of clear stock with two slices of buttered toast, each topped with a poached egg and Parmigiano
    it_zuppapavese: p => [
        xitBowl(p, '#f4efe4'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#c8a24a" stroke-width="1.8"/>`,
        K.liquid(p, { R: 76, c: '#d8a444', op: 1, shine: false }),
        xitEyes(p, 100, 100, 140, { n: 14 }),
        xitBreadSlice(p, 74, 102, 64, 84, 8, { seed: 1, crust: '#a8622a', crumb: '#e6bc70', holes: 6 }),
        xitBreadSlice(p, 128, 100, 64, 84, -6, { seed: 2, crust: '#a8622a', crumb: '#e6bc70', holes: 6 }),
        `<g ${p.sh(.6)}>`, `<path ${T(74, 102)} d="${smooth(ring(23, 10, .25, rng(p.id + 'e1')))}" fill="${p.rg('#fffdf6', .1, .1)}" stroke="#e6ddcc" stroke-width=".6"/>`, `<path ${T(128, 100)} d="${smooth(ring(23, 10, .25, rng(p.id + 'e2')))}" fill="${p.rg('#fffdf6', .1, .1)}" stroke="#e6ddcc" stroke-width=".6"/>`, `</g>`,
        `<circle cx="76" cy="104" r="11" fill="${p.rg('#f6a51c', .3, .15, .35, .32)}" stroke="#d98510" stroke-width=".7"/><circle cx="130" cy="102" r="11" fill="${p.rg('#f6a51c', .3, .15, .35, .32)}" stroke="#d98510" stroke-width=".7"/>`,
        `<ellipse cx="72" cy="99" rx="3.6" ry="2" fill="#fff" opacity=".8"/><ellipse cx="126" cy="97" rx="3.6" ry="2" fill="#fff" opacity=".8"/>`,
        K.sprinkle(p, 100, 100, 120, { c: '#fbf3d2', n: 40, r: 1.1 }),
        xitArc(76, .45),
    ].join(''),

    // passato di verdure: smooth golden-green vegetable purée, olive oil, Parmigiano, croutons, parsley
    it_passatoverdure: p => [
        xitBowl(p, '#b9472f'),
        K.liquid(p, { R: 76, c: '#c6a242', op: 1, shine: false }),
        `<circle cx="94" cy="92" r="50" fill="#d8b85a" opacity=".45"/>`,
        xitOilLine(p, [[60, 96], [80, 78], [108, 76], [130, 92], [124, 118], [100, 122], [92, 104]], { c: '#a8a020', w: 2.6 }),
        xitCrouton(p, 126, 124, 13, 20), xitCrouton(p, 140, 106, 12, -20), xitCrouton(p, 112, 140, 12, 40),
        K.sprinkle(p, 100, 100, 70, { c: '#fbf3d2', n: 24, r: 1.1 }),
        xitArc(76, .45),
        xitParsley(p, 100, 100, 90, { n: 18 }),
    ].join(''),
};
