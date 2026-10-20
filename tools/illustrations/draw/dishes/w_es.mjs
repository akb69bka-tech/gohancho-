// World edition: Spain (es_) — everyday Spanish home cooking
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// helpers for this file (ws = World Spain)
// =========================================================
function wsSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function wsOutline(p, c, r = .55){
    const id = p.def('wsOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const wsBlur = (p, s = 2) => `filter="url(#${p.def('wsbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const wsShine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// spaghetti twirled into a nest

// plain Italian white plate with a thin gold line
const wsPlate = (p, o = {}) => K.plate(p, { rim: '#c8b27a', ...o });
// soup plate (piatto fondo): wide rim, deep well. returns the well radius ~68
function wsSoupPlate(p, { base = '#fbf9f4', line = '#c8b27a' } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="95" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="91" fill="none" stroke="${line}" stroke-width="1.6" opacity=".85"/>
        <circle cx="100" cy="100" r="72" fill="none" stroke="${dk(base, .14)}" stroke-width="4" opacity=".4"/>
        <circle cx="100" cy="100" r="70" fill="${p.rg(base, .05, .24, .62, .64)}"/>
        <path d="M30,60 A80,80 0 0 1 62,28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// glazed ceramic bowl in Italian colours (side dishes)
const wsBowl = (p, glaze, inside = '#fbf7ee') => K.bowl(p, { glaze, inside });
// olive-wood salad bowl
// rectangular ovenproof dish (teglia)
// wicker bread basket with a red gingham cloth
function wsBasket(p){
    let rings = '';
    for (let i = 0; i < 4; i++){ const rx = 92 - i * 5.2, ry = 82 - i * 5.2; rings += `<ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="none" stroke="${i % 2 ? '#b98445' : '#d8ad6c'}" stroke-width="5.4" stroke-dasharray="7 2.4" stroke-dashoffset="${i * 4.5}"/>`; }
    return `<g ${p.sh(1.8)}><ellipse cx="100" cy="100" rx="95" ry="85" fill="#a8743a"/></g>${rings}
        <ellipse cx="100" cy="100" rx="74" ry="64" fill="${p.rg('#9c6a34', .1, .3, .6, .6)}"/>`;
}
// slice of country bread (pane casereccio)
function wsBreadSlice(p, x, y, w, h, r = 0, { seed = 1, crust = '#b46e2c', crumb = '#f2deb2' } = {}){
    const R = rng(p.id + 'wbs' + seed);
    const pts = ring(1, 12, .1, R, w / 2, h / 2).map(([a, b]) => [a, b > 0 ? b * .9 : b * 1.05]);
    let holes = '';
    for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * .7; holes += `<ellipse cx="${f1(Math.cos(a) * d * w / 2)}" cy="${f1(Math.sin(a) * d * h / 2)}" rx="${f1(.8 + R() * 2.2)}" ry="${f1(.6 + R() * 1.4)}" transform="rotate(${f1(R() * 180)} ${f1(Math.cos(a) * d * w / 2)} ${f1(Math.sin(a) * d * h / 2)})" fill="${dk(crumb, .2)}" opacity=".7"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${wsSm(pts, true)}" fill="${p.g(crust, .3, .3)}" stroke="${dk(crust, .35)}" stroke-width=".7"/></g>
        <path d="${wsSm(pts.map(([a, b]) => [a * .86, b * .84]), true)}" fill="${p.rg(crumb, .3, .12, .4, .38)}"/>
        ${holes}
        <path d="M${f1(-w * .3)},${f1(-h * .22)} Q${f1(-w * .1)},${f1(-h * .34)} ${f1(w * .14)},${f1(-h * .3)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// small round bread roll (rosetta-like), seen from above
// basil leaf (bright, glossy, slightly cupped)
// round lemon slice
function wsLemonSlice(p, x, y, s, { c = '#f7da4e' } = {}){
    const rr = s / 2;
    const seg = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28; return `M0,0 L${f1(Math.cos(a) * rr * .8)},${f1(Math.sin(a) * rr * .8)}`; }).join('');
    return `<g ${T(x, y)}><g ${p.sh(.6)}><circle r="${rr}" fill="#e8b81e" stroke="#c9960f" stroke-width=".6"/></g><circle r="${f1(rr - 1.8)}" fill="#fbf3c8"/><circle r="${f1(rr * .8)}" fill="${p.rg(c, .3, .1)}"/>
        <path d="${seg}" stroke="#fdf6d2" stroke-width="1.2"/><circle r="${f1(rr * .12)}" fill="#fdf6d2"/>
        <path d="M${f1(-rr * .6)},${f1(-rr * .3)} A${f1(rr * .7)},${f1(rr * .7)} 0 0 1 ${f1(-rr * .1)},${f1(-rr * .68)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/></g>`;
}
// black olive (whole, pitted)
function wsOlive(p, x, y, s, r = 0, { c = '#3a2a32', ring0 = false } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="${p.rg(c, .3, .25, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        ${ring0 ? `<ellipse rx="${f1(s * .16)}" ry="${f1(s * .12)}" fill="${dk(c, .5)}"/>` : ''}
        <ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .14)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" fill="#fff" opacity=".7"/></g>`;
}
// cherry tomato cut in half (cut face up)
// round tomato slice (caprese)
// zucchini round (skin ring + pale flesh), browned = golden pan marks
// curved band (pepper strip, green bean)
function wsBand(p, x, y, L, W, r = 0, { c = '#d8352a', bend = .25, hi = true, tip = false, cap = 'round' } = {}){
    const d = `M${f1(-L / 2)},0 Q0,${f1(-L * bend)} ${f1(L / 2)},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#2b1607" stroke-width="${f1(W + 1)}" fill="none" stroke-linecap="${cap}" opacity=".22" transform="translate(1.2 1.8)"/><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(W + 1.2)}" fill="none" stroke-linecap="${cap}"/><path d="${d}" stroke="${c}" stroke-width="${W}" fill="none" stroke-linecap="${cap}" ${cap === 'butt' ? `stroke-dasharray="${f1(L * 1.1 - 1.2)} 99" stroke-dashoffset="-.6"` : ''}/>
        ${hi ? `<path d="M${f1(-L * .36)},${f1(-W * .22 - L * bend * .28)} Q0,${f1(-L * bend * .5 - W * .25)} ${f1(L * .3)},${f1(-W * .22 - L * bend * .2)}" stroke="${lt(c, .55)}" stroke-width="${f1(Math.max(.8, W * .22))}" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}
        ${tip ? `<path d="M${f1(L / 2)},0 l2.2,-.6" stroke="${dk(c, .2)}" stroke-width="1.2" stroke-linecap="round"/>` : ''}</g>`;
}
// golden garlic slice
function wsGarlic(p, x, y, s, r = 0, { fried = .4 } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .36)}" fill="${mix('#f6ecd2', '#e0a850', fried)}" stroke="${mix('#d8c79e', '#b87a2a', fried)}" stroke-width=".6"/><ellipse rx="${f1(s * .18)}" ry="${f1(s * .1)}" fill="${mix('#efe0b8', '#d29a44', fried)}"/></g>`;
}
// lardon of guanciale: pale fat with a band of pink-brown meat, crisp edges
// thin floured escalope with golden patches
// white fish fillet (cod) with flakes
// Italian pork sausage cut in half, roasted (one cut end)
// roast potato chunk: golden faces, crisp darker edges
// rosemary sprig
// lettuce leaf with frilly edge
function wsLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468' } = {}){
    const R = rng(p.id + 'wlt' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .08); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .46)},2 Q0,${f1(-s * .04)} ${f1(s * .44)},0" stroke="#eef8d8" stroke-width="${f1(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f1(s * t)},${f1(-s * .01)} q${f1(s * .08)},${f1(i % 2 ? s * .2 : -s * .2)} ${f1(s * .16)},${f1(i % 2 ? s * .24 : -s * .24)}" stroke="#e6f4c8" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}
// small dice (soup vegetables)
function wsDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1, skin = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f1(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f1(s * .86)}" height="${f1(s * .86)}" rx="${f1(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f1(h * .45)}" width="${f1(s * .86)}" height="${f1(s * .28)}" rx="1" fill="${skin}"/>` : ''}
        <path d="M${f1(-h + s * .18)},${f1(-h + s * .2)} L${f1(-h + s * .62)},${f1(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// bean (cannellini white, borlotti speckled)
// short tube of pasta (ditalini), lying or end-on
// fine grated cheese flakes
const wsCheese = (p, x, y, s, n = 30) => K.sprinkle(p, x, y, s, { c: '#fbf3d2', n, r: 1.1 });
const wsPepper = (p, x, y, s, n = 40) => K.sprinkle(p, x, y, s, { c: '#2a2420', n, r: .75 });
// drops of olive oil on a soup or salad
function wsOil(p, x, y, s, { n = 8, seed = 1, op = .7 } = {}){
    const R = rng(p.id + 'woil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1 + R() * 2.6; out += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="#e6c13a" opacity="${op}" stroke="#c69a1c" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".7"/>`; }
    return out;
}
// chopped parsley
function wsParsley(p, x, y, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'wpa' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${smooth(ring(1 + R() * 1.1, 5, .6, R))}" fill="${R() < .5 ? '#3f8a2c' : '#5aa63c'}"/>`; }
    return out;
}
// spots: evenly scattered positions
function wsSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('wsspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// sauce surface of irregular shape
function wsSauce(p, x, y, s, c, { seed = 1, sy = .9, op = 1 } = {}){
    const R = rng(p.id + 'wsc' + seed);
    return `<path ${T(x, y)} d="${wsSm(ring(s / 2, 11, .14, R, 1, sy), true)}" fill="${p.rg(c, .2, .25, .42, .4)}" opacity="${op}"/>`;
}


// ---------- Spanish vessels and parts ----------
// clay cazuela de barro: matte terracotta outside with two small lugs, glossy brown glaze inside
function wsCazuela(p, { R = 84, glaze = '#8a3f1c', clay = '#c0703e' } = {}){
    const lug = x => `<rect x="${x - 9}" y="88" width="18" height="24" rx="8" fill="${p.g(clay, .2, .3)}" stroke="${dk(clay, .3)}" stroke-width=".8"/>`;
    return `<g ${p.sh(1.8)}>${lug(100 - R - 2)}${lug(100 + R + 2)}<circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${lt(clay, .3)}" stroke-width="1.4" opacity=".7"/>
        <circle cx="100" cy="100" r="${R - 8}" fill="${p.rg(glaze, .15, .35, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .36} A${R * .8},${R * .8} 0 0 1 ${100 - R * .28},${100 - R * .76}" stroke="#ffe2c8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// small flat clay plate (for tapas-like sides)
function wsClayPlate(p, { R = 92, clay = '#c26f3c', glaze = '#a24f24' } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R * .8}" fill="${p.rg(glaze, .16, .3, .62, .64)}"/>
        <circle cx="100" cy="100" r="${R * .8}" fill="none" stroke="${dk(clay, .25)}" stroke-width="1.2" opacity=".6"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#ffe2c8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// paella pan: polished steel with two red handles
function wsPaellaPan(p){
    const h = x => `<path d="M${x - 9},88 Q${x - 9},80 ${x},80 Q${x + 9},80 ${x + 9},88 L${x + 9},112 Q${x + 9},120 ${x},120 Q${x - 9},120 ${x - 9},112Z" fill="none" stroke="#b5281e" stroke-width="5"/><path d="M${x - 9},92 L${x - 9},108 M${x + 9},92 L${x + 9},108" stroke="#e8564a" stroke-width="1.4" opacity=".7"/>`;
    return `<g ${p.sh(1.8)}>${h(9)}${h(191)}<circle cx="100" cy="100" r="86" fill="${p.rg('#9ea2a4', .3, .35, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#d9dcdd" stroke-width="1.6" opacity=".9"/>
        <circle cx="100" cy="100" r="79" fill="${p.rg('#55595c', .1, .25, .6, .6)}"/>
        <path d="M30,62 A80,80 0 0 1 62,28" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// a lot of short grains drawn as a few paths (paella rice). c is the cooked colour
function wsGrains(p, x, y, R0, { c = '#e8b23e', n = 380, seed = 1, grain = 3.4, sy = 1 } = {}){
    const R = rng(p.id + 'wsgr' + seed);
    const ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * R0, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const h = grain * (.36 + R() * .14), b = R() * Math.PI;
        const lit = (gx - x + gy - y) / R0 + (R() - .5) * 1.4 < 0;
        ds[lit ? 0 : R() < .3 ? 2 : 1] += `M${f1(gx - Math.cos(b) * h)} ${f1(gy - Math.sin(b) * h)}l${f1(Math.cos(b) * h * 2)} ${f1(Math.sin(b) * h * 2)}`;
    }
    const cols = [lt(c, .35), c, dk(c, .18)];
    return `<g stroke-linecap="round" stroke-width="${grain}" fill="none"><path d="${ds[1] + ds[2]}" stroke="${dk(c, .35)}" opacity=".5" transform="translate(.5 .7)"/>${ds.map((d, i) => `<path d="${d}" stroke="${cols[i]}"/>`).join('')}</g>`;
}
// many tiny round things in one path per colour (lentils, peas, salt)
function wsDots(p, x, y, s, { cols = ['#6b4a2e'], n = 60, size = 3, seed = 1, sy = 1, len = .8 } = {}){
    const R = rng(p.id + 'wsdt' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, b = R() * 6.28; ds[Math.floor(R() * cols.length)] += `M${f1(x + Math.cos(a) * d)} ${f1(y + Math.sin(a) * d * sy)}l${f1(Math.cos(b) * len)} ${f1(Math.sin(b) * len)}`; }
    return cols.map((c, i) => `<path d="${ds[i]}" stroke="${dk(c, .3)}" stroke-width="${f1(size + .9)}" stroke-linecap="round" fill="none"/><path d="${ds[i]}" stroke="${c}" stroke-width="${size}" stroke-linecap="round" fill="none"/>`).join('')
        + `<path d="${ds.join('')}" stroke="#fff" stroke-width="${f1(size * .3)}" stroke-linecap="round" fill="none" opacity=".45" transform="translate(${f1(-size * .22)} ${f1(-size * .22)})"/>`;
}
// whole prawn seen from above, head left
function wsPrawn(p, x, y, s, r = 0, { c = '#e8603a' } = {}){
    const k = s / 40;
    let seg = '';
    for (let i = 0; i < 5; i++){ const sx = -2 + i * 4.4, w = 6.4 - i * .7; seg += `<ellipse cx="${f1(sx)}" cy="0" rx="2.8" ry="${f1(w)}" fill="${p.g(i % 2 ? c : lt(c, .1), .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r, k)}><path d="M-12,-3 Q-30,-16 -34,-30 M-12,3 Q-30,16 -34,30" stroke="${dk(c, .1)}" stroke-width=".9" fill="none" stroke-linecap="round"/>
        <g ${p.sh(.7)}><path d="M18,0 L26,-6 Q29,0 26,6Z" fill="${p.g(dk(c, .05), .2, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>${seg}
        <path d="M-20,0 Q-19,-8 -10,-7.6 L-1,-6.4 Q2,0 -1,6.4 L-10,7.6 Q-19,8 -20,0Z" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .32)}" stroke-width=".6"/></g>
        <path d="M-20,0 L-25,-1.4 L-20,-2.4" fill="${dk(c, .1)}"/>
        <circle cx="-16" cy="-5.6" r="1.6" fill="#2a1a14"/><circle cx="-16" cy="5.6" r="1.6" fill="#2a1a14"/>
        <path d="M-14,-3 Q-8,-5 -3,-3.6 M0,-4.2 L16,-3" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// golden chicken piece (thigh) with browned skin
function wsChicken(p, x, y, s, r = 0, { c = '#d39a4a', seed = 1 } = {}){
    const R = rng(p.id + 'wsck' + seed + x + y);
    const pts = ring(10, 10, .3, R, 1.2, .85);
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f1((R() - .5) * 12)}" cy="${f1((R() - .5) * 8)}" rx="${f1(1.8 + R() * 2.4)}" ry="${f1(1 + R() * 1.4)}" fill="#8a4a16" opacity="${f1(.25 + R() * .25)}"/>`;
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.8)}><path d="${wsSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .38)}" stroke-width=".7"/></g>${ch}
        <path d="M-6,4 q4,-1.5 8,0 M-7,0.5 q4,-1.5 7,-.5" stroke="${dk(c, .3)}" stroke-width=".6" fill="none" opacity=".5" stroke-linecap="round"/>
        <path d="M-7,-4.5 Q-2,-7.4 4,-6.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// drumstick, browned (bone to the right)
function wsDrumstick(p, x, y, s, r = 0, { c = '#c8863c' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae8c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <ellipse cx="-8" cy="3" rx="5" ry="3" fill="#8a4a16" opacity=".3"/><ellipse cx="2" cy="-4" rx="3.6" ry="2" fill="#8a4a16" opacity=".25"/>
        <path d="M-16,-5 Q-10,-11 -2,-9.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// slice of chorizo (red, with fat specks and a darker casing)
function wsChorizo(p, x, y, s, { half = false, r = 0 } = {}){
    const R = rng(p.id + 'wsch' + x + y);
    let sp = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; sp += `<ellipse cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d * (half ? .5 : 1) - (half ? s * .12 : 0))}" rx="${f1(.8 + R() * 1)}" ry="${f1(.6 + R() * .6)}" fill="#f2c08a" opacity=".85"/>`; }
    const shape = half ? `<path d="M${-s / 2},0 A${s / 2},${s / 2} 0 0 1 ${s / 2},0Z"` : `<circle r="${s / 2}"`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}>${shape} fill="#7c1c12"/></g>${half ? `<path d="M${f1(-s / 2 + 1.4)},0 A${f1(s / 2 - 1.4)},${f1(s / 2 - 1.4)} 0 0 1 ${f1(s / 2 - 1.4)},0Z"` : `<circle r="${f1(s / 2 - 1.4)}"`} fill="${p.rg('#c23a22', .2, .2)}"/>${sp}
        <path d="M${f1(-s * .28)},${f1(-s * .14)} Q${f1(-s * .12)},${f1(-s * .3)} ${f1(s * .1)},${f1(-s * .3)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// whole garlic clove in its skin, fried golden
function wsClove(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-10,2 Q-9,-7 0,-7 Q7,-7 10,-1 Q9,5 0,6 Q-8,6.5 -10,2Z" fill="${p.g('#f0dcb4', .3, .25)}" stroke="#b8925a" stroke-width=".6"/></g>
        <path d="M-7,3 Q0,4.6 8,0 M-6,-2 Q1,-1 8,-3" stroke="#c48ea0" stroke-width=".9" fill="none" opacity=".7"/>
        <path d="M10,-1 L13,-2" stroke="#b8925a" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="2" cy="1" rx="5" ry="3" fill="#d9a050" opacity=".35"/>
        <path d="M-6,-3.6 Q-1,-6 4,-5" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function wsBay(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 30)}><path d="M-15,0 Q-4,-7 15,0 Q-4,7 -15,0Z" fill="${p.g('#7d8c3c', .25, .25)}" stroke="#4f5a22" stroke-width=".6"/><path d="M-14,0 L14,0" stroke="#b6c27a" stroke-width=".7"/></g>`;
}
// Padrón pepper: small wrinkled green pepper with blisters and a stem
function wsPadron(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wspd' + seed + x + y);
    const k = s / 34;
    const top = Array.from({ length: 6 }, (_, i) => { const xx = -14 + i * 6; return [xx, -(6.5 - Math.abs(xx + 3) * .22) + (R() - .5) * 1.6]; });
    const bot = Array.from({ length: 6 }, (_, i) => { const xx = 16 - i * 6; return [xx, (6 - Math.abs(xx + 3) * .2) + (R() - .5) * 1.6]; });
    const pts = [[-17, 0], ...top, [19, 0], ...bot];
    let bl = '';
    for (let i = 0; i < 4; i++) bl += `<ellipse cx="${f1(-10 + R() * 22)}" cy="${f1((R() - .5) * 6)}" rx="${f1(1.6 + R() * 2.4)}" ry="${f1(1 + R() * 1.4)}" fill="#6a5a1e" opacity="${f1(.35 + R() * .3)}"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${wsSm(pts, true)}" fill="${p.g('#4f9a2c', .3, .3)}" stroke="#2c5f1a" stroke-width=".7"/></g>
        <path d="M-10,-1 Q0,2 12,-1 M-6,3 Q2,4.5 10,2.6" stroke="#2f6a1e" stroke-width=".8" fill="none" opacity=".6"/>${bl}
        <path d="M-17,0 Q-20,-1 -22,-4" stroke="#6c8a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="-16" cy="0" rx="2.6" ry="4" fill="#5a8a30"/>
        <path d="M-10,-3.4 Q0,-6 12,-3.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// button mushroom cut in half (cut face up) or cap
function wsMushroom(p, x, y, s, r = 0, { cut = true, tan = .5 } = {}){
    const k = s / 20, c = mix('#efe4cc', '#c8904a', tan);
    return cut
        ? `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-10,0 Q-10,-9 0,-9 Q10,-9 10,0 Q10,2 6,2 L4,2 L4,8 Q0,9.5 -4,8 L-4,2 L-6,2 Q-10,2 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
            <path d="M-8,0 Q-8,-6.5 0,-6.5 Q8,-6.5 8,0" stroke="${dk(c, .2)}" stroke-width=".8" fill="none" opacity=".6"/>
            <path d="M-6,-5 Q-1,-8 5,-6.6" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`
        : `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><circle r="9.5" fill="${p.rg(c, .3, .3, .35, .32)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g><ellipse cx="-3" cy="-3.4" rx="3.4" ry="1.8" fill="#fff" opacity=".5"/></g>`;
}
// hard-boiled egg slice / quarter
function wsEggSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .42)}" fill="${p.rg('#fffdf6', .1, .12)}" stroke="#d8d0bf" stroke-width=".6"/></g><circle r="${f1(s * .22)}" fill="${p.rg('#f6c23a', .25, .15)}"/></g>`;
}
// canned tuna flakes
function wsTuna(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'wstn' + seed + x + y);
    let out = '';
    for (let i = 0; i < 4; i++){ const c = R() < .5 ? '#d8b58c' : '#c99e72'; out += `<path ${T(x + (R() - .5) * s * .5, y + (R() - .5) * s * .4, R() * 180)} d="${wsSm(ring(s * (.2 + R() * .12), 7, .45, R, 1.3, .8), true)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`; }
    return `<g ${p.sh(.6)}><g ${p.rough(1.4, .3)}>${out}</g></g>`;
}
// onion ring (raw)
function wsOnionRing(p, x, y, s, r = 0, { c = '#f4ecf2', edge = '#b98aa8' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .42)}" fill="none" stroke="${edge}" stroke-width="3.2"/><ellipse rx="${f1(s / 2)}" ry="${f1(s * .42)}" fill="none" stroke="${c}" stroke-width="2"/></g>`;
}
// diced serrano ham
function wsHam(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f1(-s / 2)}" y="${f1(-s / 2)}" width="${s}" height="${f1(s * .8)}" rx="${f1(s * .2)}" fill="${p.g('#b8404a', .25, .25)}" stroke="#7a2230" stroke-width=".5"/></g><rect x="${f1(-s / 2 + .6)}" y="${f1(s * .1)}" width="${f1(s - 1.2)}" height="${f1(s * .2)}" rx="1" fill="#f3e2d0"/></g>`;
}
// chickpea
function wsChickpea(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${wsSm(ring(s / 2, 7, .12, rng(p.id + 'cp' + x + y)), true)}" fill="${p.rg('#e2c08a', .3, .25, .35, .32)}" stroke="#a8844a" stroke-width=".6"/></g>
        <path d="M${f1(s * .1)},${f1(-s * .45)} q${f1(s * .14)},${f1(s * .2)} 0,${f1(s * .34)}" stroke="#b8945a" stroke-width=".7" fill="none"/><circle cx="${f1(-s * .16)}" cy="${f1(-s * .16)}" r="${f1(s * .1)}" fill="#fff" opacity=".6"/></g>`;
}
// crouton
function wsCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f1(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f1(-s / 2 + s * .18)}" y="${f1(-s / 2 + s * .18)}" width="${f1(s * .5)}" height="${f1(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
// piece of barra (Spanish baguette): golden crust with diagonal scores, cut end shows the crumb
function wsBarra(p, x, y, L, W, r = 0, { cutL = false, cutR = true } = {}){
    const c = '#d6923e';
    let sc = '';
    for (let i = 0; i < Math.floor(L / 22); i++){ const sx = -L / 2 + 16 + i * 22; sc += `<path d="M${f1(sx - 6)},${f1(W * .28)} Q${f1(sx)},0 ${f1(sx + 7)},${f1(-W * .3)}" stroke="#f6dca0" stroke-width="${f1(W * .2)}" fill="none" stroke-linecap="round"/><path d="M${f1(sx - 6)},${f1(W * .28)} Q${f1(sx)},0 ${f1(sx + 7)},${f1(-W * .3)}" stroke="#b06e24" stroke-width=".8" fill="none" transform="translate(1.4 1)" opacity=".7"/>`; }
    const end = (ex, sgn) => `<ellipse cx="${f1(ex)}" cy="0" rx="${f1(W * .2)}" ry="${f1(W / 2 - 1.2)}" fill="${p.rg('#f4e2b8', .2, .1)}" stroke="#b8762c" stroke-width="1.6"/><circle cx="${f1(ex + sgn * 1)}" cy="-3" r="1" fill="#d8bf8a"/><circle cx="${f1(ex)}" cy="3" r="1.2" fill="#d8bf8a"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${L}" height="${W}" rx="${f1(W * .45)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>
        ${sc}${cutR ? end(L / 2 - W * .2, 1) : ''}${cutL ? end(-L / 2 + W * .2, -1) : ''}
        <path d="M${f1(-L * .4)},${f1(-W * .3)} L${f1(L * .3)},${f1(-W * .34)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/></g>`;
}
// golden egg-and-flour battered fillet (a la romana)
function wsBattered(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wsbt' + seed);
    const pts = ring(1, 11, .16, R, w / 2, h / 2);
    let sp = '';
    for (let i = 0; i < 7; i++) sp += `<ellipse cx="${f1((R() - .5) * w * .7)}" cy="${f1((R() - .5) * h * .6)}" rx="${f1(2 + R() * 5)}" ry="${f1(1.4 + R() * 3)}" fill="#c4802a" opacity="${f1(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><g ${p.rough(2.4, .14)}><path d="${wsSm(pts, true)}" fill="${p.g('#eebc52', .35, .32)}" stroke="#b07a24" stroke-width=".9"/></g></g>
        <g ${p.crumb(.5)}><path d="${wsSm(pts.map(([a, b]) => [a * .86, b * .82]), true)}" fill="#f4cc66" opacity=".7"/></g>${sp}
        <path d="M${f1(-w * .32)},${f1(-h * .24)} Q${f1(-w * .06)},${f1(-h * .42)} ${f1(w * .24)},${f1(-h * .3)}" stroke="#fff6dc" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// fried egg with a lacy golden edge (for pisto)
function wsFriedEgg(p, x, y, s, r = 0){
    const R = rng(p.id + 'wsfe' + x);
    const pts = ring(19, 14, .24, R);
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.9)}><path d="${wsSm(pts.map(([a, b]) => [a * 1.06, b * 1.06]), true)}" fill="#c9843a" ${p.rough(2.5, .25)}/></g>
        <path d="${wsSm(pts, true)}" fill="${p.rg('#fffdf8', .1, .08)}" stroke="#e7c79a" stroke-width="1.2"/>
        <circle cx="2" cy="1" r="8.2" fill="${p.rg('#f39a17', .35, .18, .35, .32)}" stroke="#d07d10" stroke-width=".8"/>
        <ellipse cx="-.8" cy="-2.2" rx="3.2" ry="1.9" fill="#fff" opacity=".8"/></g>`;
}
// macaroni tube (lying), coated
function wsMacaroni(p, x, y, L, W, r = 0, { c = '#e0703a' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${L}" height="${W}" rx="${f1(W * .3)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .32)}" stroke-width=".6"/></g>
        <ellipse cx="${f1(L / 2 - W * .16)}" cy="0" rx="${f1(W * .16)}" ry="${f1(W * .36)}" fill="${dk(c, .45)}"/>
        <path d="M${f1(-L / 2 + 2)},${f1(-W * .22)} L${f1(L / 2 - 4)},${f1(-W * .22)}" stroke="${lt(c, .45)}" stroke-width="1.1" stroke-linecap="round" opacity=".8"/></g>`;
}

// =========================================================
export default {
    // bread: basket with a white cloth, pieces of barra and a few slices
    es_staple: p => [
        wsBasket(p),
        `<g ${p.sh(1)}><path d="${wsSm([[34, 70], [70, 34], [128, 32], [168, 64], [170, 124], [138, 166], [80, 170], [34, 132]], true)}" fill="${p.rg('#fbf8f0', .1, .12)}" stroke="#d9d0bc" stroke-width=".8"/></g>`,
        `<path d="M44,84 L156,84 M44,116 L156,116" stroke="#c8392e" stroke-width="2" opacity=".5"/>`,
        wsBarra(p, 92, 82, 118, 32, -24, { cutR: true }),
        wsBarra(p, 104, 118, 104, 30, -18, { cutR: true, cutL: false }),
        wsBreadSlice(p, 150, 128, 34, 26, 30, { seed: 1, crust: '#c8822e', crumb: '#f4e4bc' }),
        wsBreadSlice(p, 58, 140, 34, 26, -20, { seed: 2, crust: '#c8822e', crumb: '#f4e4bc' }),
    ].join(''),

    // tortilla de patatas: white plate, thick golden tortilla with a wedge cut out
    es_tortilla: p => {
        const R = rng(p.id + 'tt');
        let brown = '';
        for (let i = 0; i < 12; i++) brown += `<ellipse cx="${f1(100 + (R() - .5) * 110)}" cy="${f1(100 + (R() - .5) * 110)}" rx="${f1(6 + R() * 12)}" ry="${f1(4 + R() * 8)}" fill="#b06a1c" opacity="${f1(.25 + R() * .3)}"/>`;
        let bumps = '';
        for (let i = 0; i < 10; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 50; bumps += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, R() * 180)} d="M-8,1 Q0,-4 8,1" stroke="#fbe08a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`; }
        const a1 = .3, a2 = 1.25;
        const rest = `M100,100 L${f1(100 + Math.cos(a2) * 74)},${f1(100 + Math.sin(a2) * 74)} A74,74 0 1 1 ${f1(100 + Math.cos(a1) * 74)},${f1(100 + Math.sin(a1) * 74)}Z`;
        const sec = `M100,100 L${f1(100 + Math.cos(a1) * 74)},${f1(100 + Math.sin(a1) * 74)} A74,74 0 0 1 ${f1(100 + Math.cos(a2) * 74)},${f1(100 + Math.sin(a2) * 74)}Z`;
        const cA = p.def('ttA', id => `<clipPath id="${id}"><path d="${rest}"/></clipPath>`), cB = p.def('ttB', id => `<clipPath id="${id}"><path d="${sec}"/></clipPath>`);
        const disc = `<circle cx="100" cy="100" r="72" fill="${p.rg('#c98a2c', .2, .4, .4, .36)}" stroke="#94581a" stroke-width="1"/><circle cx="100" cy="100" r="62" fill="${p.rg('#ecba4a', .3, .2, .4, .38)}"/><g ${wsBlur(p, 3.4)}>${brown}<circle cx="100" cy="100" r="66" fill="none" stroke="#b8741e" stroke-width="7" opacity=".6"/></g>${bumps}`;
        const ox = Math.cos((a1 + a2) / 2) * 10, oy = Math.sin((a1 + a2) / 2) * 10;
        // inside of the tortilla, seen on the cut faces: pale yellow with potato layers
        const face = (a, sgn) => `<path d="M100,100 L${f1(100 + Math.cos(a) * 70)},${f1(100 + Math.sin(a) * 70)}" stroke="#f8dc7c" stroke-width="5" stroke-linecap="round"/><path d="M${f1(100 + Math.cos(a) * 14)},${f1(100 + Math.sin(a) * 14)} L${f1(100 + Math.cos(a) * 64)},${f1(100 + Math.sin(a) * 64)}" stroke="#f3eccc" stroke-width="1.4" stroke-dasharray="6 3" opacity=".9"/>`;
        return [
            wsPlate(p, { rim: '#2f5f9a' }),
            `<g ${p.sh(1.6)}><g clip-path="url(#${cA})">${disc}</g></g>`,
            face(a2), face(a1),
            `<g ${p.sh(1.6)}><g transform="translate(${f1(ox)} ${f1(oy)})"><g clip-path="url(#${cB})">${disc}</g></g></g>`,
            wsShine('M48,80 Q58,46 94,36', 3, .55),
        ].join('');
    },

    // lentejas: clay cazuela, brown lentil stew with chorizo slices, carrot rounds and potato
    es_lentejas: p => [
        wsCazuela(p),
        K.liquid(p, { R: 74, c: '#7e4a26', op: 1, shine: false }),
        wsDots(p, 100, 100, 144, { cols: ['#7a5432', '#5f4a2a', '#8c6238', '#6a3f22'], n: 420, size: 3.6, len: 1.2, seed: 1 }),
        K.potato(p, 76, 120, 22, 20, { c: '#e6c27a', seed: 1 }), K.potato(p, 128, 76, 22, -40, { c: '#e6c27a', seed: 2 }), K.potato(p, 124, 128, 20, 70, { c: '#e6c27a', seed: 3 }),
        K.carrotRound(p, 92, 70, 14), K.carrotRound(p, 140, 108, 13), K.carrotRound(p, 64, 92, 13), K.carrotRound(p, 104, 138, 12), K.carrotRound(p, 108, 104, 12),
        wsChorizo(p, 100, 90, 22), wsChorizo(p, 72, 74, 20), wsChorizo(p, 136, 92, 19), wsChorizo(p, 90, 124, 20), wsChorizo(p, 58, 112, 18), wsChorizo(p, 118, 112, 18),
        `<path d="M40,84 A62,62 0 0 1 70,46" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35"/>`,
        wsBay(p, 118, 60, 26, -20),
    ].join(''),

    // paella mixta: steel paella pan, saffron rice, chicken, whole prawns, squid rings, red pepper, peas, lemon
    es_paella: p => [
        wsPaellaPan(p),
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#e2a63a', .2, .3, .45, .45)}"/>`,
        `<g ${wsBlur(p, 3)}><circle cx="100" cy="100" r="74" fill="none" stroke="#a8641c" stroke-width="7" opacity=".6"/></g>`,
        wsGrains(p, 100, 100, 75, { c: '#eab040', n: 520, grain: 3.6 }),
        wsChicken(p, 70, 74, 30, 20, { seed: 1 }), wsChicken(p, 132, 120, 30, -30, { seed: 2 }), wsChicken(p, 74, 128, 28, 70, { seed: 3 }), wsChicken(p, 128, 72, 26, 10, { seed: 4 }),
        K.squidRing(p, 100, 112, 14, 0), K.squidRing(p, 150, 92, 13, 0), K.squidRing(p, 52, 100, 13, 0), K.squidRing(p, 104, 58, 12, 0),
        wsBand(p, 100, 132, 30, 6, 10, { c: '#d4301f', bend: .1, cap: 'butt' }), wsBand(p, 56, 82, 26, 6, 60, { c: '#d4301f', bend: .1, cap: 'butt' }), wsBand(p, 146, 64, 26, 6, -50, { c: '#d4301f', bend: .1, cap: 'butt' }), wsBand(p, 108, 84, 24, 6, -20, { c: '#d4301f', bend: .1, cap: 'butt' }),
        wsDots(p, 100, 100, 130, { cols: ['#5fa83a', '#4f9a2c'], n: 26, size: 4.4, len: .1, seed: 2 }),
        wsPrawn(p, 100, 92, 44, 30), wsPrawn(p, 140, 146, 40, -150), wsPrawn(p, 50, 136, 40, 120), wsPrawn(p, 150, 56, 38, -110),
        K.lemon(p, 96, 152, 30, 180), K.lemon(p, 44, 64, 26, -60),
    ].join(''),

    // albondigas: clay cazuela, meatballs in a golden-brown sauce with peas, carrot and parsley
    es_albondigas: p => {
        const balls = [[100, 98], [70, 80], [128, 74], [138, 112], [106, 134], [68, 118], [98, 62]];
        return [
            wsCazuela(p, { glaze: '#7a3a1a' }),
            K.liquid(p, { R: 74, c: '#b4743a', op: 1 }),
            `<circle cx="100" cy="100" r="64" fill="#c48448" opacity=".35"/>`,
            ...balls.map(([x, y], i) => K.meatball(p, x, y, 34 - (i % 3) * 2, { c: '#8e5430', glossy: false })),
            ...balls.map(([x, y]) => `<path d="M${x - 15},${y + 5} Q${x},${y + 19} ${x + 15},${y + 5} Q${x + 6},${y + 12} ${x - 15},${y + 5}Z" fill="#b4743a" opacity=".9"/><ellipse cx="${x - 6}" cy="${y - 7}" rx="5" ry="2.6" fill="#fff" opacity=".4" transform="rotate(-30 ${x - 6} ${y - 7})"/>`),
            wsDots(p, 100, 100, 130, { cols: ['#5fa83a', '#4f9a2c'], n: 20, size: 4.6, len: .1, seed: 3 }),
            K.carrotRound(p, 86, 104, 10), K.carrotRound(p, 120, 94, 10), K.carrotRound(p, 52, 100, 9), K.carrotRound(p, 146, 90, 9),
            wsParsley(p, 100, 100, 110, { n: 30 }),
        ].join('');
    },

    // merluza a la romana: white plate, three golden battered hake pieces, lemon wedges, lettuce and tomato
    es_merluza: p => [
        wsPlate(p, { rim: '#2f5f9a' }),
        wsLettuce(p, 138, 62, 58, -30, { seed: 1 }), wsLettuce(p, 154, 98, 46, 70, { seed: 2, c: '#9bcc5c' }),
        K.tomatoWedge(p, 146, 126, 26, -40),
        wsBattered(p, 74, 78, 60, 40, -24, { seed: 1 }),
        wsBattered(p, 102, 108, 64, 42, 10, { seed: 2 }),
        wsBattered(p, 70, 134, 58, 38, -6, { seed: 3 }),
        K.lemon(p, 120, 148, 30, -20), K.lemon(p, 116, 64, 26, 150),
    ].join(''),

    // pollo al ajillo: clay cazuela, golden chicken pieces and drumsticks with whole garlic cloves, bay leaf, parsley
    es_pollo: p => [
        wsCazuela(p, { glaze: '#6e3418' }),
        K.liquid(p, { R: 72, c: '#c08a3a', op: .9, shine: false }),
        wsDrumstick(p, 80, 78, 66, -30), wsDrumstick(p, 124, 128, 64, 150),
        wsChicken(p, 130, 80, 40, 20, { seed: 1, c: '#cf9244' }), wsChicken(p, 72, 124, 40, -40, { seed: 2, c: '#cf9244' }), wsChicken(p, 104, 102, 36, 60, { seed: 3, c: '#d39a4a' }),
        wsClove(p, 100, 66, 18, 20), wsClove(p, 148, 106, 17, -40), wsClove(p, 56, 100, 17, 80), wsClove(p, 100, 140, 17, 10), wsClove(p, 92, 116, 15, -60), wsClove(p, 140, 64, 15, 120), wsClove(p, 62, 142, 15, 40),
        wsBay(p, 116, 80, 28, 30),
        wsOil(p, 100, 100, 130, { n: 10, op: .5 }),
        wsParsley(p, 100, 100, 120, { n: 36 }),
    ].join(''),

    // macarrones con chorizo: white plate, macaroni in tomato sauce with chorizo half-moons, grated cheese and oregano
    es_macarrones: p => {
        const sp = wsSpots('mac', 44, 58, 10.5, 100, 100);
        return [
            wsPlate(p),
            wsSauce(p, 100, 102, 138, '#c9441f', { seed: 1 }),
            ...sp.map(([x, y, r], i) => wsMacaroni(p, x, y, 22, 8.4, r, { c: i % 3 ? '#e07038' : '#d8642e' })),
            ...sp.slice(0, 10).map(([x, y, r]) => wsMacaroni(p, x + 5, y + 4, 21, 8.4, r + 60, { c: '#e57a3e' })),
            wsChorizo(p, 84, 88, 20, { half: true, r: 20 }), wsChorizo(p, 122, 82, 20, { half: true, r: -40 }), wsChorizo(p, 124, 122, 20, { half: true, r: 110 }), wsChorizo(p, 80, 126, 19, { half: true, r: 200 }), wsChorizo(p, 104, 104, 19, { half: true, r: 60 }), wsChorizo(p, 148, 104, 17, { half: true, r: -10 }), wsChorizo(p, 100, 66, 17, { half: true, r: 150 }), wsChorizo(p, 58, 104, 17, { half: true, r: 90 }),
            K.sprinkle(p, 100, 100, 100, { c: '#f8e7a8', n: 50, r: 1.4 }),
            K.sprinkle(p, 100, 100, 100, { c: '#4f6a2a', n: 20, r: .7 }),
        ].join('');
    },

    // ensalada mixta: large plate, lettuce, tomato wedges, onion rings, tuna, egg quarters, green olives, sweetcorn
    es_ensalada: p => [
        wsPlate(p, { rim: '#2f5f9a' }),
        wsLettuce(p, 76, 78, 76, -30, { seed: 1 }), wsLettuce(p, 128, 80, 72, 40, { seed: 2, c: '#94c95a' }),
        wsLettuce(p, 100, 128, 80, 10, { seed: 3, c: '#b4dc78' }), wsLettuce(p, 60, 120, 56, 70, { seed: 4, c: '#8cc052' }), wsLettuce(p, 144, 124, 56, -60, { seed: 5 }),
        K.tomatoWedge(p, 66, 98, 30, -40), K.tomatoWedge(p, 136, 108, 30, 50), K.tomatoWedge(p, 112, 58, 28, 170), K.tomatoWedge(p, 88, 142, 28, 20),
        wsOnionRing(p, 100, 82, 22, 20), wsOnionRing(p, 116, 128, 20, -30), wsOnionRing(p, 70, 120, 18, 60),
        wsTuna(p, 102, 102, 34, { seed: 1 }),
        K.eggHalf(p, 132, 80, 26, 30), K.eggHalf(p, 70, 70, 24, -20), K.eggHalf(p, 132, 140, 24, 60),
        wsOlive(p, 84, 104, 12, 20, { c: '#8a9a34' }), wsOlive(p, 116, 98, 12, -30, { c: '#8a9a34' }), wsOlive(p, 100, 148, 12, 60, { c: '#8a9a34' }), wsOlive(p, 150, 92, 12, 0, { c: '#8a9a34' }), wsOlive(p, 54, 108, 11, 80, { c: '#8a9a34' }),
        K.corn(p, 92, 120, 30, { n: 12 }), K.corn(p, 120, 70, 24, { n: 8 }),
    ].join(''),

    // pimientos de padron: clay plate heaped with blistered green peppers and coarse salt
    es_pimientos: p => {
        const R = rng('pad');
        const pp = Array.from({ length: 13 }, (_, i) => [100 + (R() - .5) * 90, 100 + (R() - .5) * 90, R() * 360, 40 + R() * 10]);
        return [
            wsClayPlate(p),
            ...pp.map(([x, y, r, s], i) => wsPadron(p, x, y, s, r, { seed: i })),
            K.sprinkle(p, 100, 100, 110, { c: '#ffffff', n: 50, r: 1.2 }),
            wsOil(p, 100, 100, 120, { n: 6, op: .5 }),
        ].join('');
    },

    // champinones al ajillo: small cazuela, mushroom halves in golden garlic oil, garlic slices, chili, parsley
    es_champinones: p => [
        wsCazuela(p, { R: 82, glaze: '#7a3a1a' }),
        K.liquid(p, { R: 70, c: '#c8902e', op: .85 }),
        ...wsSpots('mu', 13, 52, 24).map(([x, y, r], i) => wsMushroom(p, x, y, 30, r, { cut: i % 3 !== 0, tan: .35 + (i % 4) * .1 })),
        wsGarlic(p, 88, 94, 9, 20, { fried: .6 }), wsGarlic(p, 118, 112, 9, -40, { fried: .6 }), wsGarlic(p, 120, 80, 8, 60, { fried: .6 }), wsGarlic(p, 78, 124, 8, 10, { fried: .6 }),
        wsBand(p, 132, 130, 18, 3.4, 30, { c: '#b8261a', bend: .1 }),
        wsParsley(p, 100, 100, 120, { n: 40 }),
    ].join(''),

    // ensaladilla rusa: plate, a smooth mound of creamy potato salad topped with mayonnaise, egg slices, olives and red pepper strips
    es_ensaladilla: p => {
        const R = rng(p.id + 'ens');
        let ridges = '';
        for (let i = 0; i < 6; i++){ const yy = 62 + i * 15; ridges += `<path d="M${f1(50 + R() * 6)},${f1(yy)} Q100,${f1(yy - 6 + R() * 4)} ${f1(150 - R() * 6)},${f1(yy)}" stroke="#e8d498" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`; }
        return [
            wsPlate(p, { rim: '#2f5f9a' }),
            `<g ${p.sh(1.6)}><path ${T(100, 100)} d="${wsSm(ring(66, 12, .08, R, 1, .92), true)}" fill="${p.rg('#f6e7b0', .35, .2, .4, .36)}" stroke="#dcc382" stroke-width=".8"/></g>`,
            ridges,
            wsBand(p, 80, 94, 70, 6, 40, { c: '#c8322a', bend: 0, cap: 'butt' }), wsBand(p, 120, 94, 70, 6, -40, { c: '#c8322a', bend: 0, cap: 'butt' }),
            wsEggSlice(p, 100, 74, 22), wsEggSlice(p, 70, 110, 20, 20), wsEggSlice(p, 130, 110, 20, -20), wsEggSlice(p, 100, 132, 20, 0),
            wsOlive(p, 100, 104, 13, 0, { c: '#8a9a34' }), wsOlive(p, 76, 76, 12, 30, { c: '#8a9a34' }), wsOlive(p, 124, 76, 12, -30, { c: '#8a9a34' }), wsOlive(p, 76, 140, 11, 60, { c: '#8a9a34' }), wsOlive(p, 126, 140, 11, -60, { c: '#8a9a34' }),
            wsParsley(p, 100, 100, 100, { n: 18 }),
        ].join('');
    },

    // pisto: clay cazuela of soft diced zucchini, peppers and onion in tomato, a fried egg on top
    es_pisto: p => {
        const sp = wsSpots('pis', 46, 62, 10);
        const items = sp.map(([x, y, r], i) => { const t = i % 5; return t === 0 ? wsDice(p, x, y, 10, r, '#d9df9c', { skin: '#3c6a28' }) : t === 1 ? wsDice(p, x, y, 10, r, '#4f9a2c') : t === 2 ? wsDice(p, x, y, 10, r, '#d63a24') : t === 3 ? wsDice(p, x, y, 9, r, '#efd59a') : wsDice(p, x, y, 10, r, '#d9df9c', { skin: '#3c6a28' }); }).join('');
        return [
            wsCazuela(p),
            K.liquid(p, { R: 74, c: '#c2441f', op: 1, shine: false }),
            `<g opacity=".92">${items}</g>`,
            `<circle cx="100" cy="100" r="74" fill="#c84a24" opacity=".25"/>`,
            wsFriedEgg(p, 104, 100, 76, 10),
        ].join('');
    },

    // judias verdes con jamon: plate of flat green beans with potato cubes, diced serrano ham and garlic
    es_judias: p => {
        const sp = wsSpots('jud', 30, 58, 13);
        return [
            wsPlate(p),
            ...sp.map(([x, y, r], i) => wsBand(p, x, y, 26, 9, r, { c: i % 3 ? '#79b44a' : '#6aa63e', bend: .04, cap: 'butt' })),
            ...sp.slice(0, 8).map(([x, y, r]) => `<path ${T(x, y, r)} d="M-11,0 L11,0" stroke="#4f8a2a" stroke-width=".8" opacity=".7"/>`),
            K.potato(p, 80, 88, 20, 10, { c: '#efd08a', seed: 1 }), K.potato(p, 124, 116, 20, 40, { c: '#efd08a', seed: 2 }), K.potato(p, 92, 132, 18, -30, { c: '#efd08a', seed: 3 }), K.potato(p, 130, 76, 18, 70, { c: '#efd08a', seed: 4 }),
            wsHam(p, 100, 100, 11, 20), wsHam(p, 70, 112, 10, -30), wsHam(p, 116, 90, 10, 60), wsHam(p, 140, 100, 10, 10), wsHam(p, 110, 126, 10, -50), wsHam(p, 84, 70, 10, 40), wsHam(p, 60, 90, 9, 70), wsHam(p, 128, 140, 9, 0),
            wsGarlic(p, 94, 112, 8, 20, { fried: .6 }), wsGarlic(p, 120, 100, 8, -40, { fried: .6 }),
        ].join('');
    },

    // espinacas con garbanzos: small cazuela, spinach and chickpeas in a rust-coloured cumin and pimenton sauce
    es_espinacas: p => [
        wsCazuela(p, { R: 82 }),
        K.liquid(p, { R: 70, c: '#9a5a26', op: 1, shine: false }),
        ...[[76, 80], [122, 78], [70, 118], [126, 122], [100, 100], [98, 64], [100, 136]].map(([x, y], i) => K.greens(p, x, y, 40, { c: i % 2 ? '#2c6420' : '#356f28', stems: '#6f9e42', n: 6, seed: i, sy: .9 })),
        ...wsSpots('gar', 24, 58, 13).map(([x, y, r]) => wsChickpea(p, x, y, 12, r)),
        wsOil(p, 100, 100, 110, { n: 8, op: .45 }),
    ].join(''),

    // gazpacho: white bowl, smooth orange-pink gazpacho with diced cucumber, pepper, croutons and olive oil
    es_gazpacho: p => [
        wsBowl(p, '#f4f0e6', '#fbf9f3'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#2f5f9a" stroke-width="2"/>`,
        K.liquid(p, { R: 72, c: '#e0603a', op: 1 }),
        `<circle cx="100" cy="100" r="58" fill="#ea7c52" opacity=".35"/>`,
        `<g ${p.sh(.6)}>`,
        ...wsSpots('gz', 12, 26, 8, 104, 98).map(([x, y, r], i) => wsDice(p, x, y, 7.5, r, i % 3 === 0 ? '#e9efc0' : i % 3 === 1 ? '#5aa03a' : '#e2c48a', { skin: i % 3 === 0 ? '#3c7a2a' : null })),
        wsCrouton(p, 120, 108, 9, 20), wsCrouton(p, 96, 86, 9, -10), wsCrouton(p, 108, 120, 8, 40),
        `</g>`,
        wsOil(p, 100, 100, 110, { n: 10, op: .75 }),
        wsShine('M44,88 A58,58 0 0 1 76,46', 2, .45),
    ].join(''),

    // crema de calabacin: white bowl, pale green creamy soup with a swirl of oil, croutons and black pepper
    es_crema: p => [
        wsBowl(p, '#3e7a5a', '#f6f3ea'),
        K.liquid(p, { R: 72, c: '#b8c876', op: 1 }),
        `<circle cx="100" cy="100" r="56" fill="#c8d488" opacity=".4"/>`,
        `<path d="M78,100 Q78,80 100,80 Q122,80 122,100 Q122,116 104,116 Q90,116 90,102 Q90,92 100,92" stroke="#efe6b0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`,
        `<path d="M78,100 Q78,80 100,80 Q122,80 122,100 Q122,116 104,116 Q90,116 90,102 Q90,92 100,92" stroke="#d9b83a" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>`,
        wsCrouton(p, 132, 118, 10, 20), wsCrouton(p, 124, 132, 9, -10), wsCrouton(p, 142, 102, 9, 40), wsCrouton(p, 66, 74, 9, 30),
        K.sprinkle(p, 100, 100, 90, { c: '#2a2420', n: 30, r: .7 }),
        wsShine('M44,88 A58,58 0 0 1 76,46', 2, .45),
    ].join(''),
};
