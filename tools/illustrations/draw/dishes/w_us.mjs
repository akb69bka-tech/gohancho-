// World edition: United States (us_*) — everyday American home cooking
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// local helpers (us = United States)
// =========================================================
function usSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const usBlur = (p, s = 2) => `filter="url(#${p.def('usbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
function usOutline(p, c, r = .55){
    const id = p.def('usOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const usPts = (R, n, cx, cy, rx, ry) => Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()); return [cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry]; });
// evenly spread spots (no heavy overlaps)
function usSpots(seed, n, rx, ry, minD, cx = 100, cy = 100){
    const R = rng('usspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()), x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
function usQ(x, y, L, w, ang, c, R, { bend = .4, outline = null } = {}){
    const rad = ang * Math.PI / 180, dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2, b = (R() - .5) * L * bend;
    const d = `M${f1(x - dx)},${f1(y - dy)}q${f1(dx - dy * b / L * 2)},${f1(dy + dx * b / L * 2)} ${f1(dx * 2)},${f1(dy * 2)}`;
    return (outline ? `<path d="${d}" stroke="${outline}" stroke-width="${f(w + 1)}" fill="none" stroke-linecap="round"/>` : '') + `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
function usMound(p, x, y, rx, ry, c, { seed = 1, l = .25, d = .3, jit = .14 } = {}){
    const R = rng(p.id + 'mnd' + seed);
    return `<path ${T(x, y)} d="${usSm(ring(rx, 12, jit, R, 1, ry / rx), true)}" fill="${p.rg(c, l, d, .4, .38)}"/>`;
}
const usShine = (cx, cy, R, op = .4) => `<path d="M${f(cx - R * .62)},${f(cy - R * .2)} A${f(R * .7)},${f(R * .7)} 0 0 1 ${f(cx - R * .12)},${f(cy - R * .64)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function usParsley(p, x, y, s, { n = 16, seed = 1, c1 = '#3f8a2c', c2 = '#5aa63c' } = {}){
    const R = rng(p.id + 'upa' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${smooth(ring(1 + R(), 5, .6, R))}" fill="${R() < .5 ? c1 : c2}"/>`; }
    return out;
}
function usBasil(p, x, y, s, r = 0, { c = '#3f8f34' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.4)}><path d="M-10,0 Q-5,-7.5 4,-6 Q10,-3 10,0 Q10,3 4,6 Q-5,7.5 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.6 9,0 M-3,0 L-6,-3.6 M2,0 L-1,-4.4 M-3,0 L-6,3.6 M2,0 L-1,4.4" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>
        <path d="M-6,-3 Q-1,-6 4,-4.6" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// lemon / lime slice (round) and wedge
function usCitrusRound(p, x, y, s, { c = '#f4cf3a', flesh = '#fbe98e' } = {}){
    return `<g ${T(x, y)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".5"/></g><circle r="${f(s / 2 - 1.8)}" fill="#fffbe6"/><circle r="${f(s / 2 - 2.6)}" fill="${flesh}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0,0 L${f(Math.cos(i * .785) * (s / 2 - 2.8))},${f(Math.sin(i * .785) * (s / 2 - 2.8))}" stroke="#fffbe0" stroke-width="1.1"/>`).join('')}<circle r="1.6" fill="#fffbe0"/></g>`;
}
function usWedge(p, x, y, s, r = 0, { c = '#5aa02e', flesh = '#c9e48a' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,2 A10,9 0 0 1 10,2 Q0,5 -10,2Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-8.4,2 A8.4,7.2 0 0 1 8.4,2 Q0,4 -8.4,2Z" fill="${flesh}"/>
        ${[-50, -25, 0, 25, 50].map(a => `<path transform="rotate(${a} 0 2)" d="M0,2 L0,-4" stroke="#f2f8d8" stroke-width=".8"/>`).join('')}
        <path d="M-6,-3.5 Q0,-6.5 5,-4.5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}

// small irregular grains in one path per colour (mince, crumbs)
function usGrains(p, x, y, rx, ry, cols, { n = 40, size = 1.6, seed = 1 } = {}){
    const R = rng(p.id + 'usGr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()), gx = x + Math.cos(a) * d * rx, gy = y + Math.sin(a) * d * ry;
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        ds[k] += 'M' + Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; }).join('L') + 'Z';
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`).join('');
}

// ---------- vessels ----------
// cast-iron skillet (round, with handle to the right)
function usSkillet(p, { R = 78, cx = 92, cy = 100 } = {}){
    return `<g ${p.sh(2)}><path d="M${cx + R - 6},${cy - 9} L${cx + R + 22},${cy - 7} Q${cx + R + 28},${cy} ${cx + R + 22},${cy + 7} L${cx + R - 6},${cy + 9}Z" fill="${p.g('#3a3532', .2, .3)}"/>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg('#3d3735', .2, .3, .35, .3)}"/></g>
        <circle cx="${cx + R + 19}" cy="${cy}" r="2.6" fill="#1d1918"/>
        <circle cx="${cx}" cy="${cy}" r="${R - 7}" fill="${p.rg('#24201f', .12, .2, .62, .64)}"/>
        <path d="M${cx - R * .72},${cy - R * .42} A${R * .84},${R * .84} 0 0 1 ${cx - R * .26},${cy - R * .8}" stroke="#8a8380" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// rectangular baking dish with side handles
function usBakingDish(p, { w = 172, h = 136, c = '#f6f2ea', rim = '#d8cfc0' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.8)}><rect x="${x - 10}" y="${100 - 18}" width="${w + 20}" height="36" rx="12" fill="${p.g(c, .15, .18)}"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${p.rg(c, .2, .14, .35, .3)}"/></g>
        <rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="17" fill="none" stroke="${rim}" stroke-width="1.4"/>
        <path d="M${x + 12},${y + 34} Q${x + 12},${y + 12} ${x + 36},${y + 12}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// wooden salad bowl
function usWoodBowl(p, { R = 92 } = {}){
    const c = '#a8703c';
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .2, .3, .35, .3)}"/></g>
        ${[.97, .93].map(k => `<circle cx="100" cy="100" r="${f(R * k)}" fill="none" stroke="${dk(c, .25)}" stroke-width=".7" opacity=".5"/>`).join('')}
        <circle cx="100" cy="100" r="${f(R * .86)}" fill="${p.rg('#c9935a', .12, .3, .62, .64)}"/>
        ${[.7, .55, .4].map((k, i) => `<ellipse cx="${100 + i * 3}" cy="${100 - i * 2}" rx="${f(R * k)}" ry="${f(R * k * .92)}" fill="none" stroke="#a8743f" stroke-width=".8" opacity=".35"/>`).join('')}
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".35"/>`;
}

// ---------- food parts ----------
// hard taco shell seen from above, filled (beef, lettuce, cheese, tomato)
function usTaco(p, x, y, L, W, r, { seed = 1, cream = false } = {}){
    const R = rng(p.id + 'tac' + seed);
    const lens = (l, w, n = 16) => Array.from({ length: n }, (_, i) => { const a = i / n * 6.283, c = Math.cos(a); return [Math.sign(c) * Math.abs(c) ** .75 * l / 2, Math.sin(a) * w / 2]; });
    const outer = usSm(lens(L, W), true), inner = usSm(lens(L * .9, W * .56), true);
    const iid = p.def('ustacin' + seed, id => `<path id="${id}" d="${inner}"/>`);
    const cid = p.def('ustac' + seed, id => `<clipPath id="${id}"><use href="#${iid}"/></clipPath>`);
    let spk = '';
    for (let i = 0; i < 8; i++){ const sx = (R() - .5) * L * .8, sy = (R() < .5 ? -1 : 1) * W * (.3 + R() * .14); spk += `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(1.4 + R() * 2.4)}" ry="${f1(.8 + R())}" fill="#b8742a" opacity="${f1(.25 + R() * .3)}"/>`; }
    let fill = `<use href="#${iid}" fill="#6a3a1c"/>` + usGrains(p, 0, 0, L * .44, W * .3, ['#8a522a', '#a0643a', '#5a2e14'], { n: 36, size: 2.6, seed });
    const cols = ['#b9e07e', '#94c95a', '#e2f3c0', '#7ab44a'];
    for (let i = 0; i < 14; i++) fill += usQ(-L * .42 + R() * L * .84, (R() - .5) * W * .5, 9 + R() * 8, 2.6, (R() - .5) * 60, cols[Math.floor(R() * 4)], R);
    for (let i = 0; i < 10; i++) fill += usQ(-L * .4 + R() * L * .8, (R() - .5) * W * .48, 7 + R() * 6, 1.7, R() * 180, R() < .5 ? '#f2a42a' : '#fbc84a', R);
    for (let i = 0; i < 7; i++){ const tx = -L * .36 + R() * L * .72, ty = (R() - .5) * W * .36; fill += `<rect ${T(tx, ty, R() * 90)} x="-2.6" y="-2.3" width="5.2" height="4.6" rx="1.2" fill="${p.g('#de3d2c', .3, .25)}" stroke="#a3231a" stroke-width=".4"/>`; }
    const sc = cream ? `<g ${p.sh(.5)}><path ${T(L * .08, 0)} d="${smooth(ring(7, 9, .3, R, 1.3, .8))}" fill="${p.rg('#fbf8f0', .2, .1)}" stroke="#e6dfcf" stroke-width=".5"/></g><path d="M${f(L * .08 - 5)},-2 Q${f(L * .08)},-4.6 ${f(L * .08 + 4)},-3" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round"/>` : '';
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${outer}" fill="${p.g('#efc05c', .32, .3)}" stroke="#b37a26" stroke-width=".8"/></g>
        ${spk}
        <g clip-path="url(#${cid})">${fill}</g>
        <use href="#${iid}" fill="none" stroke="#f9e2a2" stroke-width="1.6"/>
        <use href="#${iid}" fill="none" stroke="#8a5a1e" stroke-width=".6" opacity=".7"/>
        ${sc}
        <path d="M${f(-L * .34)},${f(-W * .4)} Q0,${f(-W * .5)} ${f(L * .3)},${f(-W * .42)}" stroke="#fff6d6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// pasta swirl (copied pattern from e_rice_noodle)
function usPasta(p, x, y, s, { c = '#f0d58e', w = 2.2, n = 40, seed = 1, sy = .92, outline = null, layers = 5 } = {}){
    const R = rng(p.id + 'usPs' + seed);
    const ol = usOutline(p, outline || dk(c, .3), .5);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.18 + Math.sqrt(R()) * .8), a0 = R() * 6.28, sweep = 1.4 + R() * 2.4;
        const cx = x + (R() - .5) * s * .1, cy = y + (R() - .5) * s * .1;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .18); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const m = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2);
        L[i % layers][m < -.4 ? 1 : m > .8 ? 2 : 0] += usSm(pts);
    }
    const base = `<path ${T(x, y)} d="${usSm(ring(s / 2 * .9, 12, .12, R, 1, sy), true)}" fill="${dk(c, .2)}"/>`;
    const body = L.map(([a, b, d]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${dk(c, .1)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .25)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`).join('');
    return `<g ${p.sh(.9)}>${base}${body}</g>`;
}
// sauce blob with chunky tomato texture
function usSauce(p, x, y, rx, ry, { c = '#c3311c', seed = 1, bits = 14 } = {}){
    const R = rng(p.id + 'uss' + seed);
    let b = '';
    for (let i = 0; i < bits; i++){ const [bx, by] = usPts(R, 1, 0, 0, rx * .8, ry * .8)[0]; b += `<path ${T(bx, by, R() * 360)} d="${smooth(ring(1.6 + R() * 2, 5, .5, R))}" fill="${R() < .5 ? dk(c, .2) : lt(c, .15)}" opacity=".8"/>`; }
    return `<g ${T(x, y)}><path d="${usSm(ring(rx, 11, .22, R, 1, ry / rx), true)}" fill="${p.rg(c, .2, .25, .4, .36)}"/>${b}
        <path d="M${f(-rx * .5)},${f(-ry * .3)} Q${f(-rx * .2)},${f(-ry * .6)} ${f(rx * .2)},${f(-ry * .55)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// bone-in pork chop, pan seared
function usChop(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'chop' + seed);
    const body = 'M-44,-14 C-30,-25 0,-30 20,-28 C38,-26 46,-10 44,6 C42,22 26,30 6,30 C-14,30 -30,20 -40,6 C-46,-2 -48,-10 -44,-14Z';
    let marks = '';
    for (let i = 0; i < 7; i++) marks += `<ellipse cx="${f1(-26 + R() * 56)}" cy="${f1(-16 + R() * 34)}" rx="${f1(4 + R() * 7)}" ry="${f1(2.5 + R() * 3)}" fill="#5e2c0c" opacity="${f1(.2 + R() * .25)}"/>`;
    return `<g ${T(x, y, r, s / 90)}><g ${p.sh(1)}><path d="${body}" fill="${p.g('#d9a254', .25, .3)}" stroke="#8a5420" stroke-width=".9"/></g>
        <path d="${body}" transform="translate(-3 -3.5) scale(.86)" fill="${p.g('#b56d32', .28, .32)}"/>
        <g ${usBlur(p, 2.2)}>${marks}</g>
        <path d="M-52,-14 C-36,-25 -6,-31 16,-29" stroke="#a88456" stroke-width="6.4" fill="none" stroke-linecap="round"/>
        <path d="M-52,-14 C-36,-25 -6,-31 16,-29" stroke="#efe0c2" stroke-width="4.6" fill="none" stroke-linecap="round"/>
        <path d="M-44,-15.6 C-30,-24 -8,-28.6 8,-28" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M-10,16 C10,26 30,18 38,4" stroke="#f0cf8a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-26,-10 Q-4,-20 22,-16" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M2,8 Q14,4 26,6" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}
function usGarlic(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 14)}><g ${p.sh(.4)}><path d="M-7,2 Q-6,-5 0,-6 Q7,-5 7,2 Q0,5 -7,2Z" fill="${p.g('#efd59a', .3, .25)}" stroke="#b88c40" stroke-width=".6"/></g><path d="M-4,-1 Q0,-4 4,-2" stroke="#fff" stroke-width=".9" fill="none" opacity=".7"/></g>`;
}
function usThyme(p, x, y, L, r = 0){
    let lv = '';
    for (let i = 0; i < 7; i++){ const t = -L / 2 + 4 + i * (L - 8) / 6; lv += `<ellipse cx="${f(t)}" cy="${i % 2 ? 2 : -2}" rx="2.2" ry="1.2" transform="rotate(${i % 2 ? 30 : -30} ${f(t)} ${i % 2 ? 2 : -2})" fill="#4f7a34"/>`; }
    return `<g ${T(x, y, r)}><path d="M${-L / 2},0 Q0,-2 ${L / 2},0" stroke="#7a6a3a" stroke-width="1" fill="none"/>${lv}</g>`;
}
// breaded chicken cutlet topped with marinara and melted mozzarella
function usParm(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'parm' + seed);
    const shape = usSm(ring(1, 14, .14, R, w / 2, h / 2), true);
    const moz = usSm(ring(1, 13, .34, R, w * .3, h * .3), true);
    let spots = '';
    for (let i = 0; i < 6; i++) spots += `<ellipse cx="${f1((R() - .5) * w * .4)}" cy="${f1((R() - .5) * h * .38)}" rx="${f1(2.5 + R() * 4)}" ry="${f1(2 + R() * 3)}" fill="${R() < .5 ? '#d08a3c' : '#b56e28'}" opacity=".75"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><g ${p.crumb(.8)}><path d="${shape}" fill="${p.g('#d3913c', .3, .32)}" stroke="#94581c" stroke-width=".9"/></g></g>
        ${usSauce(p, 0, 0, w * .38, h * .38, { c: '#c2301b', seed: seed + 20, bits: 10 })}
        <g ${p.sh(.4)}><path d="${moz}" fill="${p.rg('#fbf2d6', .2, .12)}" stroke="#e8d6a8" stroke-width=".6"/></g>
        <g ${usBlur(p, 1.4)}>${spots}</g>
        <path d="M${f(-w * .2)},${f(-h * .12)} Q${f(-w * .05)},${f(-h * .24)} ${f(w * .12)},${f(-h * .2)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// salmon fillet (skin side down), roasted top
function usSalmon(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'sal' + seed);
    const pts = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 6.283, cx = Math.cos(a), cy = Math.sin(a), j = 1 + (R() - .5) * .06; return [Math.sign(cx) * Math.abs(cx) ** .55 * w / 2 * j, Math.sign(cy) * Math.abs(cy) ** .6 * h / 2 * j * (cx > 0 ? 1 - cx * .18 : 1)]; });
    const shape = usSm(pts, true);
    const cid = p.def('ussal' + seed, id => `<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
    let lines = '';
    for (let i = 0; i < 6; i++){ const lx = -w * .4 + i * w * .16; lines += `<path d="M${f(lx)},${f(-h / 2)} Q${f(lx + w * .1)},0 ${f(lx - w * .02)},${f(h / 2)}" stroke="#fde3cf" stroke-width="1.8" fill="none" opacity=".85"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${shape}" fill="${p.g('#f28a58', .25, .3)}" stroke="#c0582c" stroke-width=".8"/></g>
        <g clip-path="url(#${cid})">${lines}<g ${usBlur(p, 2.4)}><path d="${shape}" fill="none" stroke="#c4612a" stroke-width="6" opacity=".6"/><ellipse cx="${f(-w * .1)}" cy="${f(-h * .1)}" rx="${f(w * .25)}" ry="${f(h * .2)}" fill="#d97a3c" opacity=".4"/></g></g>
        <path d="M${f(-w * .36)},${f(-h * .28)} Q${f(-w * .1)},${f(-h * .44)} ${f(w * .2)},${f(-h * .36)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function usAsparagus(p, x, y, L, r = 0, { char = .3 } = {}){
    const c = '#5d9b3a';
    let sc = '';
    for (let i = 0; i < 4; i++) sc += `<path d="M${f(-L / 2 + 10 + i * (L - 26) / 3)},-2.4 l3,2.4 l-3,2.4" stroke="#3f7428" stroke-width=".8" fill="none" opacity=".7"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${-L / 2}" y="-2.8" width="${L - 7}" height="5.6" rx="2.8" fill="${p.g(c, .3, .25)}" stroke="#3a6a24" stroke-width=".5"/>
        <path d="M${L / 2 - 10},-3.6 Q${L / 2 - 2},-3.4 ${L / 2},0 Q${L / 2 - 2},3.4 ${L / 2 - 10},3.6Z" fill="${p.g('#4a7f2e', .3, .3)}" stroke="#2f5a1c" stroke-width=".5"/></g>
        <path d="M${L / 2 - 8},-3 l3,3 l-3,3 M${L / 2 - 4},-2 l2.5,2 l-2.5,2" stroke="#2f5a1c" stroke-width=".7" fill="none"/>
        ${sc}<rect x="${-L / 2}" y="-2.8" width="8" height="5.6" rx="2" fill="#c9d9a0" opacity=".7"/>
        <ellipse cx="${f(L * .05)}" cy="1" rx="${f(L * .12)}" ry="1.6" fill="#6b4a1e" opacity="${char}"/>
        <path d="M${-L / 2 + 4},-1.4 L${L / 2 - 14},-1.4" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".5"/></g>`;
}
// elbow macaroni
function usElbow(p, x, y, s, r = 0, { c = '#f4c24e' } = {}){
    return `<g ${T(x, y, r, s / 12)}><path d="M-5,2 A5,5 0 0 1 5,2" stroke="${dk(c, .3)}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-5,2 A5,5 0 0 1 5,2" stroke="${c}" stroke-width="3.8" fill="none" stroke-linecap="round"/><path d="M-4,0 A4.4,4.4 0 0 1 0,-2.6" stroke="#fff3c8" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// thin beef slice (stir-fried, glossy)
function usBeef(p, x, y, s, r = 0, { c = '#83482a', seed = 1 } = {}){
    const R = rng(p.id + 'usBf' + seed + x + y);
    const folds = Array.from({ length: 3 }, (_, i) => `M${f1(-8 + i * 8 + (R() - .5) * 4)},${f1(-5 + R() * 2)} q${f1((R() - .5) * 5)},5 ${f1((R() - .5) * 3)},${f1(9 + R() * 2)}`).join('');
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.6)}><path d="${usSm(ring(14, 15, .34, R, 1.1, .6), true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="${folds}" stroke="${dk(c, .42)}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M2,3 Q7,1.5 11,2.5" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// rice mound (grains as short strokes)
function usRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4 } = {}){
    const R = rng(p.id + 'usRice' + seed + x + y);
    const shape = usSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('usRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// butter pat melting
function usButter(p, x, y, s, r = 0){
    return `<path ${T(x + 2, y + 2)} d="${smooth(ring(s * .78, 9, .3, rng(p.id + 'btr' + x)))}" fill="#f7d75e" opacity=".45"/>
        <g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${f(s * .86)}" rx="${f(s * .24)}" fill="${p.g('#f8de72', .35, .2)}" stroke="#d9b23a" stroke-width=".6"/></g>
        <path d="M${f(-s * .3)},${f(-s * .26)} L${f(s * .2)},${f(-s * .26)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".85"/></g>`;
}
// green bean (slightly curved, tapered)
function usBean(p, x, y, L, r = 0, { c = '#4f9a34', bend = 2 } = {}){
    const d = `M${-L / 2},0 Q0,${bend * 2} ${L / 2},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .35)}" stroke-width="6.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="5.4" fill="none" stroke-linecap="round"/>
        <path d="M${-L / 2 + 3},-.8 Q0,${bend * 2 - 1.2} ${L / 2 - 4},-.8" stroke="${lt(c, .45)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${L / 2},0 l2.6,-.6" stroke="${dk(c, .2)}" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
// corn on the cob (kernel pattern clipped to a cylinder)
function usCob(p, x, y, L, W, r = 0){
    const pid = p.def('uscornpat', id => `<pattern id="${id}" width="6.2" height="5.6" patternUnits="userSpaceOnUse" patternTransform="translate(0 1)"><rect x=".5" y=".5" width="5.2" height="4.6" rx="1.8" fill="#f6cf48" stroke="#d6a420" stroke-width=".6"/><ellipse cx="2.4" cy="2" rx="1.4" ry=".9" fill="#fff4b8" opacity=".85"/></pattern>`);
    const gid = p.def('uscorngrad', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#7a4a08" stop-opacity=".12"/><stop offset="1" stop-color="#7a4a08" stop-opacity=".5"/></linearGradient>`);
    const body = `M${-L / 2 + W * .4},${-W / 2} L${L / 2 - W * .5},${-W / 2 + 1} Q${L / 2},${-W * .32} ${L / 2},0 Q${L / 2},${W * .32} ${L / 2 - W * .5},${W / 2 - 1} L${-L / 2 + W * .4},${W / 2} Q${-L / 2},${W * .4} ${-L / 2},0 Q${-L / 2},${-W * .4} ${-L / 2 + W * .4},${-W / 2}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${body}" fill="#e9b830"/></g><path d="${body}" fill="url(#${pid})"/><path d="${body}" fill="url(#${gid})" stroke="#c48e18" stroke-width=".8"/>
        <path d="M${-L / 2 - 6},${-W * .2} Q${-L / 2 - 9},0 ${-L / 2 - 6},${W * .2} L${-L / 2 + 2},${W * .26} L${-L / 2 + 2},${-W * .26}Z" fill="${p.g('#d8d39a', .3, .3)}" stroke="#a8a060" stroke-width=".6"/>
        <path d="M${-L / 2 + W * .4},${-W * .3} L${L / 2 - W * .5},${-W * .3}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/></g>`;
}
// roasted broccoli floret lying on its side (stem + head), browned edges
function usFloret(p, x, y, s, r = 0, { seed = 1, c = '#4a9238' } = {}){
    const R = rng(p.id + 'flo' + seed + x + y);
    let head = '';
    for (let i = 0; i < 8; i++){ const a = -1.4 + i / 7 * 2.8, d = 5 + R() * 2.4; head += `<circle cx="${f1(4 + Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d * 1.1)}" r="${f1(3.6 + R() * 1.4)}" fill="${R() < .5 ? c : lt(c, .14)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`; }
    head += `<circle cx="3" cy="0" r="5" fill="${c}"/>`;
    let ch = '';
    for (let i = 0; i < 4; i++){ const a = -1.2 + R() * 2.4; ch += `<circle cx="${f1(4 + Math.cos(a) * 8.5)}" cy="${f1(Math.sin(a) * 9)}" r="${f1(1.8 + R() * 1.6)}" fill="#5a3a12" opacity=".6"/>`; }
    return `<g ${T(x, y, r, s / 26)}><g ${p.sh(.6)}><path d="M-14,-2.6 Q-6,-4 2,-6 L2,6 Q-6,4 -14,2.6 Q-15.4,0 -14,-2.6Z" fill="${p.g('#b7d68a', .3, .25)}" stroke="#7e9e52" stroke-width=".6"/>${head}</g>
        <ellipse cx="-7" cy="1" rx="4" ry="1.6" fill="#9a6a2a" opacity=".45"/>${ch}
        ${Array.from({ length: 8 }, () => `<circle cx="${f1(2 + R() * 9)}" cy="${f1(-6 + R() * 12)}" r=".7" fill="${lt(c, .45)}"/>`).join('')}</g>`;
}
// romaine / leaf lettuce piece
function usLeaf(p, x, y, s, r = 0, { seed = 1, c = '#8cc551' } = {}){
    const R = rng(p.id + 'ulf' + seed + x + y);
    const pts = Array.from({ length: 20 }, (_, i) => { const a = i / 20 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .1); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .34]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${usSm(pts, true)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .46)},1.5 Q0,${f(-s * .03)} ${f(s * .44)},0" stroke="#eef8d8" stroke-width="${f(s * .07)}" fill="none" stroke-linecap="round"/>
        ${[-.28, -.06, .16].map((t, i) => `<path d="M${f(s * t)},0 q${f(s * .08)},${f(i % 2 ? s * .18 : -s * .18)} ${f(s * .16)},${f(i % 2 ? s * .22 : -s * .22)}" stroke="#e6f4c8" stroke-width=".9" fill="none" opacity=".8"/>`).join('')}</g>`;
}
function usTomHalf(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><circle r="10" fill="${p.g('#e23a2a', .3, .25)}" stroke="#a6221a" stroke-width=".6"/></g><circle r="8.2" fill="#f2604a"/>
        <path d="M0,-6 L0,6 M-6,0 L6,0" stroke="#f9a08c" stroke-width="1.4"/>${[[-3.6, -3.6], [3.6, -3.6], [-3.6, 3.6], [3.6, 3.6]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="2" ry="1.4" fill="#f8d36b" opacity=".85"/>`).join('')}
        <path d="M-6,-5 Q-2,-8 3,-7.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function usCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f(-s * .32)}" y="${f(-s * .32)}" width="${f(s * .5)}" height="${f(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
// wide egg-noodle ribbon in soup
function usRibbon(p, x, y, L, w, r, R){
    const pts = [0, 1, 2, 3].map(i => [-L / 2 + i * L / 3, (R() - .5) * w * .9]);
    const d = usSm(pts);
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#d6aa4e" stroke-width="${f(w + 1.2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#f6dc8e" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fff6d2" stroke-width="${f(w * .25)}" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-.6 -1)"/></g>`;
}
function usCelery(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 14)}><path d="M-7,2 Q-7,-6 0,-6.4 Q7,-6 7,2 L4.4,2.2 Q4,-3 0,-3.2 Q-4,-3 -4.4,2.2Z" fill="${p.g('#a9d07a', .3, .2)}" stroke="#6f9a44" stroke-width=".6"/><path d="M-5.4,0 Q-5,-4.6 0,-5" stroke="#e2f2c4" stroke-width=".8" fill="none"/></g>`;
}
// shredded cooked chicken
function usShred(p, x, y, s, r = 0, { seed = 1, c = '#ecc890' } = {}){
    const R = rng(p.id + 'ush' + seed + x + y);
    const pts = ring(s / 2, 8, .35, R, 1.6, .55);
    return `<g ${T(x, y, r)}><path d="${usSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M${f(-s * .5)},0 L${f(s * .5)},0 M${f(-s * .4)},${f(s * .12)} L${f(s * .3)},${f(s * .14)}" stroke="${dk(c, .2)}" stroke-width=".5" opacity=".6"/></g>`;
}

// =========================================================
export default {
    // Beef tacos: white plate with a turquoise rim, three crisp shells filled with seasoned beef, lettuce, cheddar, tomato, sour cream, lime
    us_tacos: p => [
        K.plate(p, { rim: '#2f9aa0' }),
        usTaco(p, 79, 66, 118, 42, -30, { seed: 1 }),
        usTaco(p, 100, 102, 122, 44, -30, { seed: 2, cream: true }),
        usTaco(p, 121, 138, 116, 42, -30, { seed: 3 }),
        usWedge(p, 152, 56, 26, 30),
    ].join(''),

    // Spaghetti and meatballs: spaghetti nest, chunky marinara, five meatballs, parmesan and basil
    us_spaghetti: p => [
        K.plate(p, { rim: '#b9442c' }),
        usPasta(p, 100, 102, 136, { c: '#f0d48a', w: 2.5, n: 44, sy: .9 }),
        usSauce(p, 100, 98, 48, 40, { c: '#c2321c', seed: 1, bits: 18 }),
        `<g ${p.sh(1)}>`,
        ...[[86, 84, 30], [116, 86, 29], [100, 112, 31], [76, 114, 26], [126, 116, 26]].map(([x, y, s]) => K.meatball(p, x, y, s, { c: '#9a5a30' })),
        `</g>`,
        usSauce(p, 96, 80, 8, 5, { c: '#b72c18', seed: 2, bits: 1 }), usSauce(p, 102, 106, 8, 5, { c: '#b72c18', seed: 3, bits: 1 }),
        K.sprinkle(p, 100, 100, 80, { c: '#fbf3dc', n: 40, r: 1 }),
        usBasil(p, 92, 98, 20, -30), usBasil(p, 108, 92, 18, 40, { c: '#4a9a3a' }),
    ].join(''),

    // Pork chops: two pan-seared bone-in chops, butter-basted garlic and thyme, applesauce
    us_porkchops: p => [
        K.plate(p, { rim: '#c9bfae' }),
        K.pool(p, 94, 112, 104, '#9a5a24', { op: .45, seed: 1, sy: .8 }),
        usChop(p, 84, 84, 104, -12, { seed: 1 }),
        usChop(p, 100, 126, 100, 8, { seed: 2 }),
        `<g ${p.sh(.6)}><circle cx="150" cy="58" r="20" fill="${p.rg('#ffffff', .1, .15)}" stroke="#ddd6c8" stroke-width="1"/></g>`,
        `<circle cx="150" cy="58" r="15.5" fill="${p.rg('#e8cf8e', .25, .2)}"/>`,
        K.sprinkle(p, 150, 58, 26, { c: '#c9a050', n: 16, r: 1.1 }), K.sprinkle(p, 152, 60, 14, { c: '#8a4a1a', n: 6, r: .6 }),
        usGarlic(p, 146, 104, 13, 30), usGarlic(p, 50, 112, 12, -20), usGarlic(p, 140, 150, 11, 60),
        usThyme(p, 112, 102, 34, -20), usThyme(p, 70, 152, 26, 30),
    ].join(''),

    // Chicken parmesan: two golden breaded cutlets with marinara and bubbling mozzarella, basil
    us_chickenparm: p => [
        K.plate(p, { rim: '#2c4c7c' }),
        usParm(p, 82, 84, 100, 70, -24, { seed: 1 }),
        usParm(p, 118, 124, 100, 68, -16, { seed: 2 }),
        usBasil(p, 80, 82, 22, -40), usBasil(p, 90, 76, 18, 20, { c: '#4a9a3a' }),
        usBasil(p, 120, 124, 22, 30), usBasil(p, 110, 116, 16, -60, { c: '#4a9a3a' }),
        K.sprinkle(p, 100, 104, 90, { c: '#fbf3dc', n: 20, r: .9 }),
    ].join(''),

    // Baked lemon salmon: two roasted fillets with lemon slices and dill, a bundle of roasted asparagus
    us_salmon: p => [
        K.plate(p, { rim: '#c9bfae' }),
        `<g>`, ...[0, 1, 2, 3, 4, 5, 6].map(i => usAsparagus(p, 106 + i * 2, 140 - i * 7 + (i % 2) * 2, 92 - (i % 3) * 4, -12 + (i % 2) * 4, { char: .2 + (i % 3) * .1 })), `</g>`,
        usSalmon(p, 76, 92, 74, 44, -20, { seed: 1 }),
        usSalmon(p, 128, 82, 70, 42, 14, { seed: 2 }),
        K.glaze(p, 78, 90, 50, '#f7d36a', { seed: 1, op: .3 }), K.glaze(p, 126, 82, 48, '#f7d36a', { seed: 2, op: .3 }),
        usCitrusRound(p, 72, 90, 20), usCitrusRound(p, 132, 80, 19),
        usParsley(p, 78, 92, 44, { n: 9, c1: '#3f7a2c', c2: '#5a9a3c' }), usParsley(p, 128, 82, 40, { n: 8, c1: '#3f7a2c', c2: '#5a9a3c' }),
        K.sprinkle(p, 100, 88, 100, { c: '#2a2420', n: 22, r: .6 }),
    ].join(''),

    // Baked mac and cheese: white baking dish, elbow macaroni in orange cheese sauce, browned cheesy top, crumbs and paprika
    us_macncheese: p => {
        const R = rng(p.id + 'mac');
        const cid = p.def('usmacclip', id => `<clipPath id="${id}"><rect x="24" y="42" width="152" height="116" rx="14"/></clipPath>`);
        let el = '';
        for (const [x, y, r] of usSpots('macel', 46, 76, 58, 13.5)){ el += usElbow(p, x, y, 23 + R() * 3, r, { c: R() < .4 ? '#f8ca50' : '#f3b43a' }); }
        return [
            usBakingDish(p, { w: 168, h: 132 }),
            `<g clip-path="url(#${cid})">`,
            `<rect x="20" y="40" width="160" height="120" fill="${p.rg('#ef9f2c', .2, .25)}"/>`,
            `<g ${p.sh(.4)}>${el}</g>`,
            `<g opacity=".55">`, ...usSpots('macs', 10, 66, 50, 26).map(([x, y], i) => K.pool(p, x, y, 22, '#f0a42a', { seed: 30 + i, op: .9 })), `</g>`,
            `<g ${usBlur(p, 3.2)}>`, ...[[64, 74, 18, 12], [110, 66, 20, 11], [146, 92, 16, 13], [84, 118, 22, 13], [130, 134, 18, 10], [50, 136, 14, 10], [100, 96, 14, 10]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#c06a1c" opacity=".55"/>`), `</g>`,
            `<g ${usBlur(p, 1.2)}>`, ...[[66, 74, 7, 4], [112, 66, 8, 4], [146, 94, 6, 5], [86, 118, 9, 5], [130, 134, 7, 4]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#8a4210" opacity=".55"/>`), `</g>`,
            K.crumbs(p, 100, 100, 140, { n: 40, c: '#d9973c' }),
            K.sprinkle(p, 100, 100, 130, { c: '#c4401c', n: 40, r: .7 }),
            `</g>`,
            `<rect x="24" y="42" width="152" height="116" rx="14" fill="none" stroke="#a87a3a" stroke-width="1" opacity=".5"/>`,
        ].join('');
    },

    // Beef and broccoli: white rice beside glossy soy-glazed beef strips and broccoli, sesame
    us_beefbroccoli: p => [
        K.plate(p, { rim: '#9a2a24' }),
        usRice(p, 66, 100, 76, { sy: 1.2, seed: 1 }),
        K.pool(p, 126, 102, 80, '#7a3a14', { op: .45, seed: 2, sy: 1.3 }),
        `<g ${p.sh(.8)}>`,
        ...[[116, 72, 40, 30], [144, 92, 38, -40], [110, 128, 40, 70], [142, 140, 36, 10], [112, 100, 38, -15], [150, 64, 30, 60], [128, 120, 34, 120]].map(([x, y, sz, r], i) => usBeef(p, x, y, sz, r, { seed: i + 1 })),
        K.broccoli(p, 134, 66, 30, 20, { c: '#3a8a30' }), K.broccoli(p, 152, 116, 30, -30, { c: '#3a8a30' }), K.broccoli(p, 120, 150, 28, 60, { c: '#3a8a30' }), K.broccoli(p, 126, 108, 28, 0, { c: '#3a8a30' }), K.broccoli(p, 104, 80, 24, -40, { c: '#3a8a30' }),
        `</g>`,
        K.glaze(p, 128, 104, 70, '#8a4416', { seed: 3, op: .22 }),
        K.sesame(p, 126, 104, 60, { n: 16 }),
    ].join(''),

    // Mashed potatoes: turquoise stoneware bowl, creamy swirled mash, melting butter, chives, pepper
    us_mashed: p => [
        K.bowl(p, { glaze: '#3f97a0', inside: '#f6f2e8' }),
        `<g ${p.sh(1.3)}>`, usMound(p, 100, 102, 66, 62, '#f6e7bd', { seed: 2, l: .35, d: .22 }), `</g>`,
        `<path d="M58,104 C60,74 92,58 118,68 C140,78 140,108 118,118 C100,126 82,114 88,98 C92,88 108,86 112,96" stroke="#e2cc94" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".8"/>`,
        `<path d="M58,102 C60,72 92,56 118,66 C140,76 140,106 118,116 C100,124 82,112 88,96 C92,86 108,84 112,94" stroke="#fffaf0" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>`,
        `<path d="M70,140 Q100,154 136,134" stroke="#e2cc94" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
        usButter(p, 104, 98, 22, 12),
        K.scallions(p, 100, 104, 90, { n: 22, c: '#3f8f2c' }),
        K.sprinkle(p, 100, 104, 96, { c: '#3a2e26', n: 22, r: .55 }),
    ].join(''),

    // Garlic green beans: mustard stoneware bowl, glossy green beans with golden garlic slices
    us_greenbeans: p => {
        const R = rng(p.id + 'gb');
        const beans = usSpots('gbn', 30, 54, 52, 9.5).map(([x, y]) => usBean(p, x, y, 44 + R() * 10, -30 + (R() - .5) * 80, { c: R() < .5 ? '#4f9a34' : '#5aa63a', bend: (R() - .5) * 6 })).join('');
        return [
            K.bowl(p, { glaze: '#d9a33a', inside: '#f7f2e6' }),
            `<g ${p.sh(.8)}>`, beans, `</g>`,
            ...usSpots('gbg', 9, 44, 40, 14).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="4.4" ry="3" fill="#f3dfa6" stroke="#c9963a" stroke-width=".9"/><ellipse cx="-1" cy="-.8" rx="1.6" ry=".8" fill="#fff" opacity=".7"/></g>`),
            K.glaze(p, 98, 98, 90, '#f8e08a', { seed: 1, op: .22 }),
            K.sprinkle(p, 100, 100, 90, { c: '#2a2420', n: 16, r: .55 }),
        ].join('');
    },

    // Garden salad: wooden salad bowl, romaine, cherry tomato halves, cucumber, shredded carrot, croutons, ranch
    us_salad: p => {
        const R = rng(p.id + 'sal');
        const leaves = usSpots('sl', 15, 56, 54, 16).map(([x, y, r], i) => usLeaf(p, x, y, 52 + R() * 12, r, { seed: i, c: ['#8cc551', '#6eae3c', '#a6d468', '#5c9e34'][i % 4] })).join('');
        return [
            usWoodBowl(p),
            leaves,
            K.cucumberSlice(p, 78, 74, 20, 10, { oval: 1.1 }), K.cucumberSlice(p, 128, 120, 20, -20, { oval: 1.1 }), K.cucumberSlice(p, 70, 126, 18, 40, { oval: 1.1 }), K.cucumberSlice(p, 132, 70, 18, 0, { oval: 1.1 }),
            `<g ${p.sh(.5)}>`, K.shreds(p, 100, 100, 70, { c: '#ef8030', n: 16, w: 2, len: .3, seed: 3 }), `</g>`,
            usTomHalf(p, 104, 74, 22, 20), usTomHalf(p, 146, 100, 20, -30), usTomHalf(p, 92, 132, 21, 60), usTomHalf(p, 60, 100, 20, 10), usTomHalf(p, 118, 144, 18, 40),
            usCrouton(p, 112, 106, 12, 20), usCrouton(p, 84, 100, 11, -10), usCrouton(p, 124, 90, 10, 40),
            `<path d="M70,96 C84,84 96,110 110,94 C122,82 130,104 142,94" stroke="#e8e2cc" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M70,96 C84,84 96,110 110,94 C122,82 130,104 142,94" stroke="#fdfbf2" stroke-width="3" fill="none" stroke-linecap="round"/>`,
            K.sprinkle(p, 106, 96, 60, { c: '#3f7a2c', n: 14, r: .7 }),
        ].join('');
    },

    // Coleslaw: red stoneware bowl, creamy shredded cabbage with carrot
    us_coleslaw: p => {
        const R = rng(p.id + 'cs');
        let sh = '';
        const cols = ['#f8f9ea', '#e6efc6', '#d4e6a6', '#fbfcf2', '#eef5d6', '#f2f2dc'];
        for (const [x, y] of usPts(R, 80, 100, 100, 56, 52)) sh += usQ(x, y, 12 + R() * 8, 3, R() * 180, cols[Math.floor(R() * cols.length)], R, { outline: '#c9cfa6' });
        for (const [x, y] of usPts(R, 22, 100, 100, 52, 48)) sh += usQ(x, y, 12 + R() * 6, 2.2, R() * 180, '#ee7d2c', R, { outline: '#c45a1a' });
        return [
            K.bowl(p, { glaze: '#c8452f', inside: '#f6f1e6' }),
            `<g ${p.sh(1.2)}>`, usMound(p, 100, 100, 64, 60, '#f1efd6', { seed: 4, l: .3, d: .2 }), `</g>`,
            `<g ${p.sh(.4)}>`, sh, `</g>`,
            K.glaze(p, 98, 98, 96, '#fffdf2', { seed: 1, op: .3 }),
            K.sprinkle(p, 100, 100, 92, { c: '#4a3f36', n: 14, r: .55 }),
        ].join('');
    },

    // Corn on the cob: white oval platter, two buttered ears, salt and pepper
    us_corn: p => [
        K.ovalDish(p, { rx: 94, ry: 72, rim: '#2f9aa0' }),
        usCob(p, 104, 78, 126, 40, -8),
        usCob(p, 96, 124, 126, 40, -8),
        usButter(p, 110, 74, 18, 10),
        `<path d="M70,120 Q100,112 130,118" stroke="#f9e07a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>`,
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 24, r: .6 }),
        K.sprinkle(p, 100, 100, 110, { c: '#ffffff', n: 16, r: .6 }),
    ].join(''),

    // Roasted broccoli: cream oval dish, florets with browned crispy edges, lemon wedge, parmesan
    us_broccoli: p => {
        const sp = usSpots('rb', 11, 50, 40, 26);
        const R = rng(p.id + 'rb');
        return [
            K.ovalDish(p, { rx: 94, ry: 76, rim: null, base: '#f1ebe0', deep: true }),
            `<g ${p.sh(.9)}>`,
            ...sp.map(([x, y, r], i) => usFloret(p, x, y, 44 + R() * 8, r, { seed: i, c: R() < .5 ? '#4a9238' : '#3f8a32' })),
            `</g>`,
            K.lemon(p, 156, 126, 28, -40),
            K.sprinkle(p, 100, 100, 110, { c: '#fbf3dc', n: 30, r: 1.1 }),
            K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 14, r: .6 }),
        ].join('');
    },

    // Skillet cornbread: cast-iron skillet, golden cornbread cut in wedges, melting butter
    us_cornbread: p => {
        const cx = 94, cy = 100, Rb = 68;
        const cuts = [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * 6.283 + .3; return `M${cx},${cy} L${f(cx + Math.cos(a) * Rb)},${f(cy + Math.sin(a) * Rb)}`; }).join('');
        return [
            usSkillet(p, { R: 80, cx, cy }),
            `<g ${p.sh(.8)}><circle cx="${cx}" cy="${cy}" r="${Rb + 2}" fill="#9a5a1c"/></g>`,
            `<g ${p.crumb(.35)}><circle cx="${cx}" cy="${cy}" r="${Rb}" fill="${p.rg('#e8b04a', .3, .3, .4, .38)}"/></g>`,
            `<g ${usBlur(p, 4)}><circle cx="${cx}" cy="${cy}" r="${Rb - 4}" fill="none" stroke="#b8701e" stroke-width="8" opacity=".6"/><ellipse cx="${cx + 14}" cy="${cy + 12}" rx="26" ry="20" fill="#c8842a" opacity=".35"/></g>`,
            `<path d="${cuts}" stroke="#8a5216" stroke-width="2.6"/><path d="${cuts}" stroke="#f6d488" stroke-width=".9" transform="translate(-1 -1)" opacity=".8"/>`,
            usButter(p, cx - 4, cy - 2, 20, 18),
            `<path d="M${cx - 50},${cy - 26} Q${cx - 38},${cy - 50} ${cx - 10},${cy - 56}" stroke="#fff3c8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
        ].join('');
    },

    // Chicken noodle soup: white soup bowl, golden broth, wide egg noodles, carrot, celery, shredded chicken, parsley
    us_chickennoodle: p => {
        const R = rng(p.id + 'cn');
        const sp = usSpots('cn', 32, 58, 58, 12);
        const items = sp.map(([x, y, r], i) => {
            const t = i % 6;
            return t === 0 || t === 3 ? usRibbon(p, x, y, 26, 7, r, R)
                : t === 1 ? K.carrotRound(p, x, y, 12, { c: '#ef7f30' })
                : t === 2 ? usCelery(p, x, y, 12, r)
                : t === 4 ? usShred(p, x, y, 20, r, { seed: i })
                : usRibbon(p, x, y, 22, 6.4, r, R);
        }).join('');
        return [
            K.bowl(p, { glaze: '#f4efe4', inside: '#fbf8f1' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#2c4c7c" stroke-width="1.4" opacity=".8"/>`,
            K.liquid(p, { R: 73, c: '#e6b54a', op: .92, shine: false }),
            `<g ${p.sh(.5)}>`, items, `</g>`,
            `<circle cx="100" cy="100" r="68" fill="#eebd58" opacity=".14"/>`,
            K.sprinkle(p, 100, 100, 120, { c: '#f8d878', n: 14, r: 1.8 }),
            usShine(100, 100, 73, .4),
            usParsley(p, 100, 100, 96, { n: 20 }),
        ].join('');
    },

    // Tomato soup: cream bowl, velvety tomato soup, cream swirl, basil, croutons, black pepper
    us_tomatosoup: p => [
        K.bowl(p, { glaze: '#c8452f', inside: '#f6f1e6' }),
        K.liquid(p, { R: 74, c: '#d9482a', op: 1, shine: false }),
        `<circle cx="96" cy="94" r="50" fill="#ec6a3c" opacity=".35"/>`,
        `<path d="M100,100 m-6,0 a6,6 0 1 1 12,0 a12,12 0 1 1 -24,0 a18,18 0 1 1 36,0 a24,24 0 1 1 -48,0" stroke="#e8b9a0" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`,
        `<path d="M100,100 m-6,0 a6,6 0 1 1 12,0 a12,12 0 1 1 -24,0 a18,18 0 1 1 36,0 a24,24 0 1 1 -48,0" stroke="#fdf3ea" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
        usCrouton(p, 140, 84, 13, 15), usCrouton(p, 132, 130, 12, -20), usCrouton(p, 60, 126, 12, 35),
        usBasil(p, 118, 60, 22, -30), usBasil(p, 132, 70, 18, 40, { c: '#4a9a3a' }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 22, r: .6 }),
        usShine(100, 100, 74, .45),
    ].join(''),
};
