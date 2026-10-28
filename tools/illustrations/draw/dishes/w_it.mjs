// World edition: Italy (it_) — everyday Italian home cooking
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// helpers for this file (wi = World Italy)
// =========================================================
function wiSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function wiOutline(p, c, r = .55){
    const id = p.def('wiOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
const wiBlur = (p, s = 2) => `filter="url(#${p.def('wibl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const wiShine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// spaghetti twirled into a nest
function wiPasta(p, x, y, s, { c = '#f0d58e', w = 2.2, n = 40, seed = 1, sy = .92, outline = null, layers = 5 } = {}){
    const R = rng(p.id + 'wiPs' + seed);
    const ol = wiOutline(p, outline || dk(c, .3), .5);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.18 + Math.sqrt(R()) * .8), a0 = R() * 6.28, sweep = 1.4 + R() * 2.4;
        const cx = x + (R() - .5) * s * .1, cy = y + (R() - .5) * s * .1;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .18); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const m = Math.cos(a0 + sweep / 2) + Math.sin(a0 + sweep / 2);
        L[i % layers][m < -.4 ? 1 : m > .8 ? 2 : 0] += wiSm(pts);
    }
    const base = `<path ${T(x, y)} d="${wiSm(ring(s / 2 * .9, 12, .12, R, 1, sy), true)}" fill="${dk(c, .2)}"/>`;
    const body = L.map(([a, b, d]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${dk(c, .1)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .25)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>`).join('');
    return `<g ${p.sh(.9)}>${base}${body}</g>`;
}

// plain Italian white plate with a thin gold line
const wiPlate = (p, o = {}) => K.plate(p, { rim: '#c8b27a', ...o });
// soup plate (piatto fondo): wide rim, deep well. returns the well radius ~68
function wiSoupPlate(p, { base = '#fbf9f4', line = '#c8b27a' } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="95" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="91" fill="none" stroke="${line}" stroke-width="1.6" opacity=".85"/>
        <circle cx="100" cy="100" r="72" fill="none" stroke="${dk(base, .14)}" stroke-width="4" opacity=".4"/>
        <circle cx="100" cy="100" r="70" fill="${p.rg(base, .05, .24, .62, .64)}"/>
        <path d="M30,60 A80,80 0 0 1 62,28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// glazed ceramic bowl in Italian colours (side dishes)
const wiBowl = (p, glaze, inside = '#fbf7ee') => K.bowl(p, { glaze, inside });
// olive-wood salad bowl
function wiWoodBowl(p){
    const R = rng(p.id + 'wood');
    let grain = '';
    for (let i = 0; i < 7; i++){ const rr = 84 + R() * 6, a = R() * 6.28, sw = .6 + R() * .8; grain += `<path d="M${f1(100 + Math.cos(a) * rr)},${f1(100 + Math.sin(a) * rr)} A${rr},${rr} 0 0 1 ${f1(100 + Math.cos(a + sw) * rr)},${f1(100 + Math.sin(a + sw) * rr)}" stroke="#6e4524" stroke-width=".8" fill="none" opacity=".45"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="93" fill="${p.rg('#b07a45', .25, .25, .35, .3)}"/></g>${grain}
        <circle cx="100" cy="100" r="80" fill="${p.rg('#d6a56a', .12, .35, .64, .66)}"/>
        <path d="M30,62 A78,78 0 0 1 64,28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// rectangular ovenproof dish (teglia)
function wiBakingDish(p){
    return `<g ${p.sh(1.8)}><rect x="6" y="20" width="188" height="160" rx="26" fill="${p.rg('#f3ede0', .2, .18, .35, .3)}"/></g>
        <rect x="10" y="24" width="180" height="152" rx="23" fill="none" stroke="#b9472f" stroke-width="2.4" opacity=".85"/>
        <rect x="20" y="34" width="160" height="132" rx="16" fill="${p.rg('#e9dcc2', .06, .25, .6, .6)}"/>
        <path d="M16,60 Q16,30 46,28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// wicker bread basket with a red gingham cloth
function wiBasket(p){
    let rings = '';
    for (let i = 0; i < 4; i++){ const rx = 92 - i * 5.2, ry = 82 - i * 5.2; rings += `<ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="none" stroke="${i % 2 ? '#b98445' : '#d8ad6c'}" stroke-width="5.4" stroke-dasharray="7 2.4" stroke-dashoffset="${i * 4.5}"/>`; }
    return `<g ${p.sh(1.8)}><ellipse cx="100" cy="100" rx="95" ry="85" fill="#a8743a"/></g>${rings}
        <ellipse cx="100" cy="100" rx="74" ry="64" fill="${p.rg('#9c6a34', .1, .3, .6, .6)}"/>`;
}
function wiGingham(p, pts){
    const id = p.def('wiGing', id => `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><rect width="9" height="9" fill="#fbf6ee"/><rect width="4.5" height="9" fill="#d23f33" opacity=".5"/><rect width="9" height="4.5" fill="#d23f33" opacity=".5"/></pattern>`);
    const d = wiSm(pts, true);
    return `<g ${p.sh(1)}><path d="${d}" fill="url(#${id})" stroke="#b8392e" stroke-width=".8"/></g><path d="${d}" fill="${p.rg('#ffffff', 0, .35, .4, .4)}" opacity=".25"/>`;
}
// slice of country bread (pane casereccio)
function wiBreadSlice(p, x, y, w, h, r = 0, { seed = 1, crust = '#b46e2c', crumb = '#f2deb2' } = {}){
    const R = rng(p.id + 'wbs' + seed);
    const pts = ring(1, 12, .1, R, w / 2, h / 2).map(([a, b]) => [a, b > 0 ? b * .9 : b * 1.05]);
    let holes = '';
    for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * .7; holes += `<ellipse cx="${f1(Math.cos(a) * d * w / 2)}" cy="${f1(Math.sin(a) * d * h / 2)}" rx="${f1(.8 + R() * 2.2)}" ry="${f1(.6 + R() * 1.4)}" transform="rotate(${f1(R() * 180)} ${f1(Math.cos(a) * d * w / 2)} ${f1(Math.sin(a) * d * h / 2)})" fill="${dk(crumb, .2)}" opacity=".7"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${wiSm(pts, true)}" fill="${p.g(crust, .3, .3)}" stroke="${dk(crust, .35)}" stroke-width=".7"/></g>
        <path d="${wiSm(pts.map(([a, b]) => [a * .86, b * .84]), true)}" fill="${p.rg(crumb, .3, .12, .4, .38)}"/>
        ${holes}
        <path d="M${f1(-w * .3)},${f1(-h * .22)} Q${f1(-w * .1)},${f1(-h * .34)} ${f1(w * .14)},${f1(-h * .3)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// small round bread roll (rosetta-like), seen from above
function wiRoll(p, x, y, s, r = 0){
    const c = '#d08a3a';
    let lobes = '';
    for (let i = 0; i < 5; i++){ const a = i / 5 * 6.28; lobes += `<path d="M0,0 L${f1(Math.cos(a - .5) * s * .46)},${f1(Math.sin(a - .5) * s * .46)} Q${f1(Math.cos(a) * s * .6)},${f1(Math.sin(a) * s * .6)} ${f1(Math.cos(a + .5) * s * .46)},${f1(Math.sin(a + .5) * s * .46)}Z" fill="${p.g(i % 2 ? c : lt(c, .08), .35, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><circle r="${f1(s * .48)}" fill="${dk(c, .1)}"/>${lobes}</g><circle r="${f1(s * .08)}" fill="${lt(c, .3)}"/>
        <path d="M${f1(-s * .3)},${f1(-s * .18)} Q${f1(-s * .15)},${f1(-s * .34)} ${f1(s * .06)},${f1(-s * .34)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// basil leaf (bright, glossy, slightly cupped)
function wiBasil(p, x, y, s, r = 0, { c = '#3f9a34' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,0 Q-6,-8.5 3,-7 Q10,-4 10,0 Q10,4 3,7 Q-6,8.5 -10,0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.6 9,0 M-4,-.3 L0,-4.6 M1,-.2 L4.5,-4 M-4,.3 L0,4.6 M1,.2 L4.5,4" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>
        <path d="M-6,-4 Q-1,-6.8 5,-5" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// round lemon slice
function wiLemonSlice(p, x, y, s, { c = '#f7da4e' } = {}){
    const rr = s / 2;
    const seg = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28; return `M0,0 L${f1(Math.cos(a) * rr * .8)},${f1(Math.sin(a) * rr * .8)}`; }).join('');
    return `<g ${T(x, y)}><g ${p.sh(.6)}><circle r="${rr}" fill="#e8b81e" stroke="#c9960f" stroke-width=".6"/></g><circle r="${f1(rr - 1.8)}" fill="#fbf3c8"/><circle r="${f1(rr * .8)}" fill="${p.rg(c, .3, .1)}"/>
        <path d="${seg}" stroke="#fdf6d2" stroke-width="1.2"/><circle r="${f1(rr * .12)}" fill="#fdf6d2"/>
        <path d="M${f1(-rr * .6)},${f1(-rr * .3)} A${f1(rr * .7)},${f1(rr * .7)} 0 0 1 ${f1(-rr * .1)},${f1(-rr * .68)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/></g>`;
}
// black olive (whole, pitted)
function wiOlive(p, x, y, s, r = 0, { c = '#3a2a32', ring0 = false } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="${p.rg(c, .3, .25, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        ${ring0 ? `<ellipse rx="${f1(s * .16)}" ry="${f1(s * .12)}" fill="${dk(c, .5)}"/>` : ''}
        <ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .14)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" fill="#fff" opacity=".7"/></g>`;
}
function wiCapers(p, pts){
    return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${p.rg('#7d8a3a', .3, .25)}" stroke="#4f5a22" stroke-width=".4"/><circle cx="${x - .8}" cy="${y - .8}" r=".7" fill="#fff" opacity=".6"/>`).join('');
}
// cherry tomato cut in half (cut face up)
function wiTomHalf(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><ellipse rx="10" ry="9" fill="${p.g('#d9301f', .25, .25)}" stroke="#9a1c12" stroke-width=".6"/></g>
        <ellipse rx="8.2" ry="7.3" fill="${p.rg('#ef5a3e', .2, .15)}"/>
        <path d="M0,-7 L0,7 M-7,0 L7,0" stroke="#f58d6a" stroke-width="2" opacity=".8"/>
        <ellipse cx="-3.6" cy="-3.4" rx="2.4" ry="2" fill="#f7b04a" opacity=".85"/><ellipse cx="3.6" cy="-3.4" rx="2.4" ry="2" fill="#f7b04a" opacity=".85"/><ellipse cx="-3.6" cy="3.4" rx="2.4" ry="2" fill="#f7b04a" opacity=".85"/><ellipse cx="3.6" cy="3.4" rx="2.4" ry="2" fill="#f7b04a" opacity=".85"/>
        <circle r="1.6" fill="#fbc2a8"/>
        <path d="M-6,-4.6 Q-2,-7.6 3,-7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// round tomato slice (caprese)
function wiTomSlice(p, x, y, s, r = 0){
    const k = s / 30;
    const ch = [0, 1, 2, 3, 4].map(i => { const a = i / 5 * 6.28 - 1.2; return `<ellipse cx="${f1(Math.cos(a) * 7.6)}" cy="${f1(Math.sin(a) * 7.6)}" rx="4.6" ry="3.2" transform="rotate(${f1(a * 57.3)} ${f1(Math.cos(a) * 7.6)} ${f1(Math.sin(a) * 7.6)})" fill="#f38a5c" stroke="#e25a3a" stroke-width=".5"/><circle cx="${f1(Math.cos(a) * 8.4)}" cy="${f1(Math.sin(a) * 8.4)}" r=".9" fill="#f8d27a"/><circle cx="${f1(Math.cos(a + .25) * 6.8)}" cy="${f1(Math.sin(a + .25) * 6.8)}" r=".9" fill="#f8d27a"/>`; }).join('');
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><circle r="15" fill="${p.g('#d42f1e', .25, .25)}" stroke="#981b10" stroke-width=".6"/></g>
        <circle r="13.6" fill="${p.rg('#e8452c', .15, .15)}"/>${ch}<circle r="2.8" fill="#f6a888"/>
        <path d="M-10,-6 Q-4,-12 4,-12" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function wiMozzSlice(p, x, y, s, r = 0){
    const R = rng(p.id + 'wmz' + x + y);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${wiSm(ring(s / 2, 10, .08, R), true)}" fill="${p.rg('#fdfcf6', .2, .08, .4, .38)}" stroke="#e2dccb" stroke-width=".7"/></g>
        <path d="M${f1(-s * .3)},${f1(-s * .16)} Q${f1(-s * .14)},${f1(-s * .34)} ${f1(s * .12)},${f1(-s * .32)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/>
        <ellipse cx="${f1(s * .1)}" cy="${f1(s * .12)}" rx="${f1(s * .2)}" ry="${f1(s * .12)}" fill="#efe9d8" opacity=".5"/></g>`;
}
// zucchini round (skin ring + pale flesh), browned = golden pan marks
function wiZuc(p, x, y, s, { browned = 0, seed = 1, skin = '#3c6a28' } = {}){
    const R = rng(p.id + 'wzc' + seed + x + y);
    const fl = mix('#eef0c4', '#e6b24a', browned * .7);
    const a0 = R() * 6.28;
    const seeds = [0, 1, 2].map(i => { const a = a0 + i * 2.09; return `M${f1(Math.cos(a) * s * .1)},${f1(Math.sin(a) * s * .1)}l${f1(Math.cos(a) * s * .12)},${f1(Math.sin(a) * s * .12)}`; }).join('');
    return `<g ${T(x, y)}><circle r="${f1(s / 2)}" fill="${skin}"/><circle r="${f1(s / 2 - 2.2)}" fill="#b7cf7a"/><circle r="${f1(s / 2 - 3)}" fill="${p.rg(fl, .25, .15, .4, .38)}"/>
        <path d="${seeds}" stroke="${lt(fl, .5)}" stroke-width="${f1(s * .06)}" stroke-linecap="round"/>
        ${browned ? `<ellipse cx="${f1(s * .08)}" cy="${f1(s * .06)}" rx="${f1(s * .24)}" ry="${f1(s * .18)}" fill="#c98a2c" opacity="${f1(browned * .45)}"/>` : ''}
        <path d="M${f1(-s * .3)},${f1(-s * .1)} A${f1(s * .32)},${f1(s * .32)} 0 0 1 ${f1(-s * .02)},${f1(-s * .3)}" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/></g>`;
}
// curved band (pepper strip, green bean)
function wiBand(p, x, y, L, W, r = 0, { c = '#d8352a', bend = .25, hi = true, tip = false, cap = 'round' } = {}){
    const d = `M${f1(-L / 2)},0 Q0,${f1(-L * bend)} ${f1(L / 2)},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#2b1607" stroke-width="${f1(W + 1)}" fill="none" stroke-linecap="${cap}" opacity=".22" transform="translate(1.2 1.8)"/><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(W + 1.2)}" fill="none" stroke-linecap="${cap}"/><path d="${d}" stroke="${c}" stroke-width="${W}" fill="none" stroke-linecap="${cap}" ${cap === 'butt' ? `stroke-dasharray="${f1(L * 1.1 - 1.2)} 99" stroke-dashoffset="-.6"` : ''}/>
        ${hi ? `<path d="M${f1(-L * .36)},${f1(-W * .22 - L * bend * .28)} Q0,${f1(-L * bend * .5 - W * .25)} ${f1(L * .3)},${f1(-W * .22 - L * bend * .2)}" stroke="${lt(c, .55)}" stroke-width="${f1(Math.max(.8, W * .22))}" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}
        ${tip ? `<path d="M${f1(L / 2)},0 l2.2,-.6" stroke="${dk(c, .2)}" stroke-width="1.2" stroke-linecap="round"/>` : ''}</g>`;
}
// golden garlic slice
function wiGarlic(p, x, y, s, r = 0, { fried = .4 } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .36)}" fill="${mix('#f6ecd2', '#e0a850', fried)}" stroke="${mix('#d8c79e', '#b87a2a', fried)}" stroke-width=".6"/><ellipse rx="${f1(s * .18)}" ry="${f1(s * .1)}" fill="${mix('#efe0b8', '#d29a44', fried)}"/></g>`;
}
// lardon of guanciale: pale fat with a band of pink-brown meat, crisp edges
function wiGuanciale(p, x, y, w, h, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${w}" height="${h}" rx="${f1(h * .3)}" fill="${p.g('#f0c98a', .3, .3)}" stroke="#a8661e" stroke-width=".8"/></g>
        <rect x="${f1(-w / 2 + 1)}" y="${f1(h * .02)}" width="${f1(w - 2)}" height="${f1(h * .42)}" rx="${f1(h * .2)}" fill="${p.g('#b5573a', .25, .3)}"/>
        <rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${w}" height="${h}" rx="${f1(h * .3)}" fill="none" stroke="#d9963c" stroke-width="1.4" opacity=".7"/>
        <path d="M${f1(-w * .32)},${f1(-h * .22)} L${f1(w * .2)},${f1(-h * .22)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".75"/></g>`;
}
// thin floured escalope with golden patches
function wiEscalope(p, x, y, w, h, r = 0, { c = '#ecd09a', brown = '#c4893a', seed = 1, nb = 6 } = {}){
    const R = rng(p.id + 'wes' + seed + x + y);
    const pts = ring(1, 13, .2, R, w / 2, h / 2);
    let spots = '';
    for (let i = 0; i < nb; i++) spots += `<ellipse cx="${f1((R() - .5) * w * .6)}" cy="${f1((R() - .5) * h * .5)}" rx="${f1(w * (.08 + R() * .12))}" ry="${f1(h * (.08 + R() * .1))}" fill="${brown}" opacity="${f1(.35 + R() * .35)}"/>`;
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .15, .15)}" stroke="${dk(c, .4)}" stroke-width=".8"/>
        <g ${wiBlur(p, 1.6)}><path d="${smooth(pts.map(([a, b]) => [a * .93, b * .9]))}" fill="none" stroke="${brown}" stroke-width="3.4" opacity=".6"/>${spots}</g>
        <path d="M${f1(-w * .3)},${f1(-h * .22)} Q${f1(-w * .08)},${f1(-h * .34)} ${f1(w * .16)},${f1(-h * .28)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// white fish fillet (cod) with flakes
function wiCod(p, x, y, w, h, r = 0, { seed = 1, tint = null } = {}){
    const R = rng(p.id + 'wcd' + seed);
    const pts = ring(1, 11, .14, R, w / 2, h / 2);
    let fl = '';
    for (let i = 0; i < 6; i++){ const fx = -w * .38 + i * w * .15 + (R() - .5) * 3; fl += `M${f1(fx)},${f1(-h * (.2 + R() * .15))} Q${f1(fx + w * .06)},${f1((R() - .5) * 4)} ${f1(fx - 1)},${f1(h * (.2 + R() * .15))}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${wiSm(pts, true)}" fill="${p.g('#f8f4ea', .3, .14)}" stroke="#cdbf9e" stroke-width=".9"/></g>
        <path d="${wiSm(pts.map(([a, b]) => [a * .9, b * .86]), true)}" fill="none" stroke="#efe6d2" stroke-width="2.4"/>
        <path d="${fl}" stroke="#d9cdb2" stroke-width="1.4" opacity=".8" fill="none" stroke-linecap="round"/>
        ${tint ? `<path d="${wiSm(pts.map(([a, b]) => [a * .96 + 1, b * .9 + h * .06]), true)}" fill="${tint}" opacity=".18"/>` : ''}
        <path d="M${f1(-w * .32)},${f1(-h * .26)} Q${f1(-w * .05)},${f1(-h * .44)} ${f1(w * .24)},${f1(-h * .3)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// Italian pork sausage cut in half, roasted (one cut end)
function wiSausage(p, x, y, L, W, r = 0, { c = '#a9603a', seed = 1 } = {}){
    const R = rng(p.id + 'wsg' + seed + x);
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f1(-L * .35 + R() * L * .6)}" cy="${f1((R() - .5) * W * .5)}" rx="${f1(2 + R() * 3)}" ry="${f1(1.2 + R() * 1.5)}" fill="${dk(c, .5)}" opacity="${f1(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${L}" height="${W}" rx="${f1(W / 2)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>
        ${ch}<ellipse cx="${f1(L / 2 - W * .22)}" cy="0" rx="${f1(W * .22)}" ry="${f1(W * .42)}" fill="${p.g('#e3a987', .2, .2)}" stroke="${dk(c, .2)}" stroke-width=".5"/>
        <path d="M${f1(-L * .38)},${f1(-W * .22)} L${f1(L * .2)},${f1(-W * .26)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>`;
}
// roast potato chunk: golden faces, crisp darker edges
function wiRoastPotato(p, x, y, s, r = 0, { seed = 1, c = '#e6b04e' } = {}){
    const R = rng(p.id + 'wrp' + seed + x + y);
    const pts = ring(s / 2, 6, .3, R, 1.15, .9, R());
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .45)}" fill="${p.g(c, .3, .35)}" stroke="#9c5f20" stroke-width=".9"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62 - s * .06, b * .62 - s * .06]), true, .45)}" fill="${lt(c, .3)}" opacity=".85"/>
        <g ${wiBlur(p, 1)}><ellipse cx="${f1(s * .18)}" cy="${f1(s * .14)}" rx="${f1(s * .18)}" ry="${f1(s * .1)}" fill="#a8621e" opacity=".45"/></g>
        <path d="M${f1(-s * .26)},${f1(-s * .2)} Q${f1(-s * .1)},${f1(-s * .32)} ${f1(s * .08)},${f1(-s * .28)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// rosemary sprig
function wiRosemary(p, x, y, L, r = 0){
    let nd = '';
    const n = Math.round(L / 3.4);
    for (let i = 0; i < n; i++){ const t = -L / 2 + (i + .5) * L / n, sgn = i % 2 ? 1 : -1, len = 5.5 - Math.abs(t) / L * 3; nd += `M${f1(t)},0 l${f1(len * .55)},${f1(sgn * len)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="M${f1(-L / 2)},0 L${f1(L / 2)},0" stroke="#7a6a44" stroke-width="1.2" stroke-linecap="round"/><path d="${nd}" stroke="#2f5a34" stroke-width="2.1" stroke-linecap="round" fill="none"/></g><path d="${nd}" stroke="#7aa27a" stroke-width=".6" stroke-linecap="round" fill="none" transform="translate(-.3 -.3)"/></g>`;
}
// lettuce leaf with frilly edge
function wiLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468' } = {}){
    const R = rng(p.id + 'wlt' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .08); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .46)},2 Q0,${f1(-s * .04)} ${f1(s * .44)},0" stroke="#eef8d8" stroke-width="${f1(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f1(s * t)},${f1(-s * .01)} q${f1(s * .08)},${f1(i % 2 ? s * .2 : -s * .2)} ${f1(s * .16)},${f1(i % 2 ? s * .24 : -s * .24)}" stroke="#e6f4c8" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}
// small dice (soup vegetables)
function wiDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1, skin = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f1(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f1(s * .86)}" height="${f1(s * .86)}" rx="${f1(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        ${skin ? `<rect x="${-h}" y="${f1(h * .45)}" width="${f1(s * .86)}" height="${f1(s * .28)}" rx="1" fill="${skin}"/>` : ''}
        <path d="M${f1(-h + s * .18)},${f1(-h + s * .2)} L${f1(-h + s * .62)},${f1(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// bean (cannellini white, borlotti speckled)
function wiBean(p, x, y, s, r = 0, { c = '#f1e8d2', speck = null } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,-1 Q-10,-7 -3,-6.4 Q1,-6 4,-6.6 Q10,-7 10,-.5 Q10,6 0,6.4 Q-10,6.4 -10,-1Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        ${speck ? `<path d="M-6,-2 l2,1 M-1,2 l2.4,.6 M4,-2 l1.6,1.4 M-5,3 l1.6,-.4 M2,-4 l2,.2" stroke="${speck}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>` : ''}
        <path d="M-6,-3.6 Q-2,-5.4 2,-4.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// short tube of pasta (ditalini), lying or end-on
function wiDitalino(p, x, y, s, r = 0, { c = '#f1d58c', end = false } = {}){
    return end
        ? `<g ${T(x, y, r)}><circle r="${f1(s / 2)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><circle r="${f1(s * .24)}" fill="${dk(c, .35)}"/></g>`
        : `<g ${T(x, y, r)}><rect x="${f1(-s / 2)}" y="${f1(-s * .32)}" width="${s}" height="${f1(s * .64)}" rx="${f1(s * .12)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><ellipse cx="${f1(s / 2 - s * .1)}" cy="0" rx="${f1(s * .12)}" ry="${f1(s * .27)}" fill="${dk(c, .35)}"/></g>`;
}
// fine grated cheese flakes
const wiCheese = (p, x, y, s, n = 30) => K.sprinkle(p, x, y, s, { c: '#fbf3d2', n, r: 1.1 });
const wiPepper = (p, x, y, s, n = 40) => K.sprinkle(p, x, y, s, { c: '#2a2420', n, r: .75 });
// drops of olive oil on a soup or salad
function wiOil(p, x, y, s, { n = 8, seed = 1, op = .7 } = {}){
    const R = rng(p.id + 'woil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1 + R() * 2.6; out += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="#e6c13a" opacity="${op}" stroke="#c69a1c" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".7"/>`; }
    return out;
}
// chopped parsley
function wiParsley(p, x, y, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'wpa' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${smooth(ring(1 + R() * 1.1, 5, .6, R))}" fill="${R() < .5 ? '#3f8a2c' : '#5aa63c'}"/>`; }
    return out;
}
// spots: evenly scattered positions
function wiSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('wispots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// sauce surface of irregular shape
function wiSauce(p, x, y, s, c, { seed = 1, sy = .9, op = 1 } = {}){
    const R = rng(p.id + 'wsc' + seed);
    return `<path ${T(x, y)} d="${wiSm(ring(s / 2, 11, .14, R, 1, sy), true)}" fill="${p.rg(c, .2, .25, .42, .4)}" opacity="${op}"/>`;
}

// =========================================================
export default {
    // bread: wicker basket, red gingham cloth, slices of country bread and two rolls
    it_staple: p => [
        wiBasket(p),
        wiGingham(p, [[30, 64], [62, 34], [104, 30], [150, 40], [172, 76], [168, 128], [140, 166], [96, 172], [52, 160], [28, 120]]),
        wiBreadSlice(p, 82, 82, 70, 52, -24, { seed: 1 }),
        wiBreadSlice(p, 96, 106, 72, 54, -12, { seed: 2 }),
        wiBreadSlice(p, 112, 128, 70, 52, 4, { seed: 3 }),
        wiRoll(p, 146, 84, 40, 20), wiRoll(p, 62, 136, 36, -30),
    ].join(''),

    // spaghetti al pomodoro: white plate, red spaghetti nest, a spoon of sauce on top, basil and Parmigiano
    it_pomodoro: p => [
        wiPlate(p),
        wiSauce(p, 100, 102, 132, '#c9301c', { seed: 1, op: .95 }),
        wiPasta(p, 100, 100, 124, { c: '#df5a2e', w: 2.4, n: 52 }),
        wiSauce(p, 98, 96, 52, '#c32a18', { seed: 2, sy: .8 }),
        `<path d="M82,90 Q92,80 106,82" stroke="#ff9c80" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`,
        wiCheese(p, 100, 98, 70, 34),
        wiBasil(p, 112, 82, 30, -30), wiBasil(p, 124, 98, 24, 40), wiBasil(p, 104, 70, 20, -100, { c: '#4aa83c' }),
    ].join(''),

    // carbonara: spaghetti in a glossy yolk-yellow cream, crisp guanciale, pecorino, lots of black pepper
    it_carbonara: p => [
        wiPlate(p),
        wiSauce(p, 100, 104, 132, '#ecbc4a', { seed: 1, op: .9 }),
        wiPasta(p, 100, 100, 124, { c: '#f0c556', w: 2.7, n: 34 }),
        K.glaze(p, 98, 100, 92, '#f6cf5a', { op: .4, seed: 2 }),
        ...[[78, 86, 30], [120, 76, -20], [130, 116, 60], [88, 126, -50], [106, 100, 10], [64, 110, 80], [108, 140, -10], [142, 94, 100], [94, 68, 40]].map(([x, y, r]) => wiGuanciale(p, x, y, 21, 12, r)),
        wiCheese(p, 100, 100, 90, 40),
        wiPepper(p, 100, 100, 108, 120),
    ].join(''),

    // lemon chicken escalopes: golden floured escalopes in a glossy lemon-butter sauce, lemon slices, parsley
    it_scaloppine: p => [
        wiPlate(p),
        wiSauce(p, 98, 104, 136, '#efd894', { seed: 1, op: .75 }),
        `<g ${p.sh(1.2)}>`,
        wiEscalope(p, 72, 80, 66, 44, -20, { seed: 1, c: '#e4b366', brown: '#b06a22', nb: 8 }),
        wiEscalope(p, 118, 88, 68, 46, 14, { seed: 2, c: '#e8b96c', brown: '#b06a22', nb: 8 }),
        wiEscalope(p, 92, 128, 70, 46, -6, { seed: 3, c: '#e4b366', brown: '#b06a22', nb: 8 }),
        `</g>`,
        K.glaze(p, 98, 104, 110, '#f5d36a', { op: .28, seed: 3 }),
        K.glaze(p, 120, 88, 40, '#f8e09a', { op: .35, seed: 4 }), K.glaze(p, 74, 80, 36, '#f8e09a', { op: .35, seed: 5 }),
        wiLemonSlice(p, 140, 128, 30), wiLemonSlice(p, 58, 120, 24),
        wiParsley(p, 98, 100, 90, { n: 30 }),
    ].join(''),

    // polpette al sugo: deep ceramic dish with red tomato sauce, 7 meatballs, basil, Parmigiano
    it_polpette: p => {
        const balls = [[100, 100], [70, 84], [128, 76], [136, 116], [104, 136], [66, 122], [98, 64]];
        return [
            wiBowl(p, '#c9573a', '#f6efe2'),
            K.liquid(p, { R: 72, c: '#bf2f1c', op: 1 }),
            `<circle cx="100" cy="100" r="60" fill="#d4482c" opacity=".35"/>`,
            ...balls.map(([x, y], i) => K.meatball(p, x, y, 34 - (i % 3) * 2, { c: '#a0603a', glossy: false }) + `<ellipse cx="${x - 6}" cy="${y - 7}" rx="5" ry="2.6" fill="#fff" opacity=".35" transform="rotate(-30 ${x - 6} ${y - 7})"/>`),
            ...balls.map(([x, y], i) => `<path d="M${x - 14},${y + 6} Q${x},${y + 18} ${x + 14},${y + 6} Q${x + 6},${y + 12} ${x - 14},${y + 6}Z" fill="#c4321e" opacity=".85"/><path d="M${x - 10},${y - 4} Q${x - 2},${y - 2} ${x + 4},${y - 8}" stroke="#c4321e" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`),
            wiCheese(p, 100, 100, 100, 26),
            wiBasil(p, 84, 104, 22, -30), wiBasil(p, 120, 98, 20, 60), wiBasil(p, 112, 58, 18, 160),
        ].join('');
    },

    // merluzzo in umido: oval dish, white cod in a light cherry-tomato sauce with black olives, capers, parsley
    it_merluzzo: p => [
        K.ovalDish(p, { rim: '#2f6f8f' }),
        wiSauce(p, 100, 100, 150, '#d0482a', { seed: 1, sy: .72, op: .9 }),
        wiCod(p, 80, 94, 70, 46, -8, { seed: 1 }),
        wiCod(p, 126, 106, 68, 44, 10, { seed: 2 }),

        `<g>`,
        wiTomHalf(p, 60, 120, 20, 20), wiTomHalf(p, 146, 80, 20, -30), wiTomHalf(p, 100, 132, 18, 70), wiTomHalf(p, 108, 70, 17, 10), wiTomHalf(p, 150, 128, 16, 40), wiTomHalf(p, 50, 92, 16, -60),
        `</g>`,
        wiOlive(p, 72, 66, 13, 20), wiOlive(p, 130, 136, 13, -30), wiOlive(p, 86, 132, 12, 60), wiOlive(p, 140, 64, 12, 10), wiOlive(p, 160, 104, 12, 80),
        wiCapers(p, [[96, 116], [70, 108], [136, 92], [118, 64], [80, 144], [154, 116]]),
        wiParsley(p, 102, 98, 110, { n: 30 }), wiParsley(p, 82, 94, 30, { n: 10, seed: 2 }), wiParsley(p, 126, 106, 30, { n: 10, seed: 3 }),
    ].join(''),

    // frittata di zucchine: white plate, thick golden frittata with zucchini rounds, cut into wedges
    it_frittata: p => {
        const R = rng(p.id + 'fr');
        const zs = wiSpots('frz', 12, 50, 21);
        let brown = '';
        for (let i = 0; i < 9; i++) brown += `<ellipse cx="${f1(100 + (R() - .5) * 110)}" cy="${f1(100 + (R() - .5) * 110)}" rx="${f1(6 + R() * 12)}" ry="${f1(4 + R() * 7)}" fill="#b87420" opacity="${f1(.25 + R() * .25)}"/>`;
        const egg = zs.map(([x, y], i) => `<path ${T(x + 3, y + 3, i * 40)} d="${wiSm(ring(7, 6, .5, R), true)}" fill="#f0c04c" opacity=".85"/>`).join('');
        const a1 = .25, a2 = 1.2, sec = (r0, ox = 0, oy = 0) => `M${100 + ox},${100 + oy} L${f1(100 + ox + Math.cos(a1) * r0)},${f1(100 + oy + Math.sin(a1) * r0)} A${r0},${r0} 0 0 1 ${f1(100 + ox + Math.cos(a2) * r0)},${f1(100 + oy + Math.sin(a2) * r0)}Z`;
        const rest = r0 => `M100,100 L${f1(100 + Math.cos(a2) * r0)},${f1(100 + Math.sin(a2) * r0)} A${r0},${r0} 0 1 1 ${f1(100 + Math.cos(a1) * r0)},${f1(100 + Math.sin(a1) * r0)}Z`;
        const ox = Math.cos((a1 + a2) / 2) * 9, oy = Math.sin((a1 + a2) / 2) * 9;
        const top = [
            `<g ${wiBlur(p, 3)}>${brown}</g>`,
            ...zs.map(([x, y], i) => wiZuc(p, x, y, 18, { browned: .6, seed: i, skin: '#4a7a2e' })),
            egg,
            `<g ${wiBlur(p, 2)}><circle cx="100" cy="100" r="67" fill="none" stroke="#b8781c" stroke-width="5" opacity=".5"/></g>`,
        ].join('');
        const cA = p.def('frA', id => `<clipPath id="${id}"><path d="${rest(72)}"/></clipPath>`), cB = p.def('frB', id => `<clipPath id="${id}"><path d="${sec(72)}"/></clipPath>`);
        const disc = `<circle cx="100" cy="100" r="70" fill="${p.rg('#d8a034', .2, .35, .38, .34)}" stroke="#a86c18" stroke-width="1"/><circle cx="100" cy="100" r="64" fill="${p.rg('#efc04e', .3, .2, .4, .38)}"/>${top}`;
        return [
            wiPlate(p),
            `<g ${p.sh(1.6)}><g clip-path="url(#${cA})">${disc}</g></g>`,
            `<g ${p.sh(1.6)}><g transform="translate(${f1(ox)} ${f1(oy)})"><g clip-path="url(#${cB})">${disc}</g></g></g>`,
            `<path d="M100,100 L${f1(100 + Math.cos(a2) * 66)},${f1(100 + Math.sin(a2) * 66)} M100,100 L${f1(100 + Math.cos(a1) * 66)},${f1(100 + Math.sin(a1) * 66)}" stroke="#f6d470" stroke-width="2.4" stroke-linecap="round"/>`,
            wiShine('M50,78 Q62,46 96,38', 3, .5),
        ].join('');
    },

    // salsiccia e patate al forno: baking dish of golden roast potatoes, browned sausage halves, red onion, rosemary
    it_salsiccia: p => [
        wiBakingDish(p),
        `<rect x="22" y="36" width="156" height="128" rx="14" fill="#c98a3a" opacity=".35"/>`,
        ...[[40, 56, 10], [70, 52, 70], [108, 50, -30], [150, 56, 40], [42, 100, -50], [160, 98, 20], [44, 144, 30], [80, 148, -20], [124, 148, 60], [158, 144, -40], [96, 100, 10], [64, 82, 100], [132, 82, -70], [106, 124, 20]].map(([x, y, r], i) => wiRoastPotato(p, x, y, 26 + (i % 3) * 2, r, { seed: i })),
        K.onion(p, 86, 70, 22, 30, { c: '#b65a86' }), K.onion(p, 140, 120, 22, -150, { c: '#b65a86' }), K.onion(p, 60, 124, 20, 80, { c: '#b65a86' }),
        wiSausage(p, 92, 82, 50, 16, -20, { seed: 1 }), wiSausage(p, 130, 100, 48, 16, 30, { seed: 2 }),
        wiSausage(p, 78, 118, 48, 16, 15, { seed: 3 }), wiSausage(p, 122, 136, 46, 16, -10, { seed: 4 }),
        wiRosemary(p, 52, 72, 34, 50), wiRosemary(p, 150, 74, 30, -30), wiRosemary(p, 100, 108, 30, 80),
    ].join(''),

    // insalata mista: olive-wood bowl, lettuce, tomato wedges, grated carrot
    it_insalata: p => [
        wiWoodBowl(p),
        wiLettuce(p, 76, 80, 74, -30, { seed: 1 }), wiLettuce(p, 126, 84, 70, 40, { seed: 2, c: '#94c95a' }),
        wiLettuce(p, 98, 128, 74, 10, { seed: 3, c: '#b4dc78' }), wiLettuce(p, 62, 122, 54, 70, { seed: 4, c: '#8cc052' }),
        wiLettuce(p, 140, 128, 54, -60, { seed: 5 }),
        `<g ${p.sh(.6)}>`, K.shreds(p, 108, 100, 44, { c: '#ef7f30', n: 26, w: 1.8, len: .5, seed: 2 }), `</g>`,
        K.tomatoWedge(p, 76, 100, 30, -20), K.tomatoWedge(p, 126, 116, 30, 40), K.tomatoWedge(p, 106, 70, 28, 170), K.tomatoWedge(p, 82, 136, 26, 10),
    ].join(''),

    // caprese: white plate, alternating tomato and mozzarella slices in a ring, basil, olive oil, oregano
    it_caprese: p => {
        const n = 8;
        const items = Array.from({ length: n }, (_, i) => { const a = i / n * 6.28 - 1.2; return [100 + Math.cos(a) * 46, 100 + Math.sin(a) * 46, i]; });
        return [
            wiPlate(p, { rim: '#2f6f8f' }),
            ...items.map(([x, y, i]) => i % 2 ? wiMozzSlice(p, x, y, 40, i * 30) : wiTomSlice(p, x, y, 40, i * 20)),
            wiMozzSlice(p, 100, 100, 36, 0),
            ...items.map(([x, y, i]) => wiBasil(p, 100 + (x - 100) * .55, 100 + (y - 100) * .55, 18, i * 45 + 20)).filter((_, i) => i % 2 === 0),
            wiOil(p, 100, 100, 120, { n: 12, op: .6 }),
            K.sprinkle(p, 100, 100, 120, { c: '#5a6a2a', n: 26, r: .7 }),
        ].join('');
    },

    // zucchine trifolate: celadon bowl, golden sauteed zucchini rounds with parsley
    it_zucchine: p => [
        wiBowl(p, '#8fae9a'),
        `<circle cx="100" cy="100" r="66" fill="#c9b060" opacity=".3"/>`,
        ...wiSpots('zt', 20, 54, 20).map(([x, y], i) => wiZuc(p, x, y, 25, { browned: .5 + (i % 3) * .15, seed: i, skin: '#2f6a22' })),
        ...wiSpots('zt2', 7, 40, 26).map(([x, y], i) => wiZuc(p, x + 3, y + 2, 24, { browned: .8, seed: i + 30, skin: '#2f6a22' })),
        wiGarlic(p, 82, 92, 8, 20, { fried: .6 }), wiGarlic(p, 120, 116, 8, -30, { fried: .6 }),
        wiParsley(p, 100, 100, 110, { n: 40 }),
    ].join(''),

    // spinaci saltati: white bowl with a blue line, glossy dark wilted spinach, golden garlic
    it_spinaci: p => [
        wiBowl(p, '#f2eee4'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#2f6f8f" stroke-width="2"/>`,
        `<g ${p.sh(.8)}><path ${T(100, 100)} d="${wiSm(ring(58, 12, .2, rng(p.id + 'sp')), true)}" fill="${p.rg('#24521c', .2, .3)}"/></g>`,
        ...[[76, 80], [122, 78], [70, 118], [126, 122], [100, 100], [98, 64], [100, 136], [62, 98], [140, 100]].map(([x, y], i) => K.greens(p, x, y, 46, { c: i % 2 ? '#2c6420' : '#356f28', stems: '#6f9e42', n: 8, seed: i, sy: .9 })),
        `<path d="M66,84 Q82,66 104,66" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/>`,
        wiGarlic(p, 92, 96, 9, 20, { fried: .5 }), wiGarlic(p, 118, 112, 9, -40, { fried: .5 }), wiGarlic(p, 80, 120, 8, 60, { fried: .5 }),
        K.sprinkle(p, 100, 100, 70, { c: '#c8321e', n: 10, r: .9 }),
    ].join(''),

    // peperonata: blue bowl of soft red and yellow pepper strips with onion in a little tomato
    it_peperonata: p => {
        const strips = wiSpots('pp', 26, 52, 13).map(([x, y, r], i) => wiBand(p, x, y, 38, 7.5, r, { c: i % 3 === 1 ? '#f2bd2a' : i % 3 === 2 ? '#d8402a' : '#c9301f', bend: .14, cap: 'butt' }));
        return [
            wiBowl(p, '#3c6e9a'),
            K.liquid(p, { R: 66, c: '#c2441f', op: .95 }),
            ...strips,
            K.onion(p, 86, 96, 18, 30, { c: '#e9b878', layers: 1 }), K.onion(p, 120, 116, 18, -60, { c: '#e9b878', layers: 1 }), K.onion(p, 110, 78, 16, 160, { c: '#e9b878', layers: 1 }),
            wiBasil(p, 104, 102, 20, -30),
        ].join('');
    },

    // fagiolini: white plate of whole green beans dressed with oil, lemon wedge
    it_fagiolini: p => [
        wiPlate(p),
        ...Array.from({ length: 20 }, (_, i) => { const R = rng('fg' + i); return wiBand(p, 94 + (R() - .5) * 46, 52 + i * 4.8 + (R() - .5) * 4, 62 + R() * 16, 6.6, -30 + (R() - .5) * 50, { c: i % 3 ? '#4f9a34' : '#62ae40', bend: (R() - .5) * .16, tip: true }); }),
        wiOil(p, 96, 104, 80, { n: 10, op: .55 }),
        K.lemon(p, 150, 128, 32, -40),
        wiGarlic(p, 96, 92, 6, 0, { fried: 0 }), wiGarlic(p, 80, 120, 6, 40, { fried: 0 }),
    ].join(''),

    // broccoli ripassati: terracotta bowl of glossy broccoli florets with garlic and chili
    it_broccoli: p => [
        wiBowl(p, '#b5643c', '#f4ead8'),
        ...wiSpots('br', 12, 48, 27).map(([x, y, r], i) => K.broccoli(p, x, y, 40, r, { c: i % 2 ? '#2f7a2a' : '#3a8a30' })),
        wiGarlic(p, 88, 96, 9, 20, { fried: .6 }), wiGarlic(p, 116, 114, 9, -40, { fried: .6 }), wiGarlic(p, 124, 80, 8, 60, { fried: .6 }),
        K.sprinkle(p, 100, 100, 100, { c: '#d42a1c', n: 22, r: 1 }),
        wiOil(p, 100, 100, 100, { n: 8, op: .5 }),
    ].join(''),

    // minestrone: soup plate, golden-orange broth full of diced carrot, zucchini, potato, celery and white beans
    it_minestrone: p => {
        const sp = wiSpots('min', 34, 56, 12);
        const items = sp.map(([x, y, r], i) => {
            const t = i % 7;
            return t === 0 || t === 4 ? wiDice(p, x, y, 11, r, '#ef7d2e')
                : t === 1 ? wiDice(p, x, y, 12, r, '#f2e1a6')
                : t === 2 || t === 5 ? wiDice(p, x, y, 12, r, '#d7e2a0', { skin: '#3c6a28' })
                : t === 3 ? wiBean(p, x, y, 13, r)
                : wiDice(p, x, y, 9, r, '#a9cf6e');
        }).join('');
        return [
            wiSoupPlate(p),
            K.liquid(p, { R: 66, c: '#d68a40', op: 1, shine: false }),
            `<g ${p.sh(.7)}>`, items, `</g>`,
            `<circle cx="100" cy="100" r="66" fill="#d68a40" opacity=".12"/>`,
            wiShine('M50,90 A52,52 0 0 1 80,52', 1.8, .4),
            wiOil(p, 100, 100, 110, { n: 8, op: .55 }),
            wiCheese(p, 100, 100, 60, 26),
            K.sprinkle(p, 100, 100, 70, { c: '#3f8a2c', n: 14, r: .9 }),
        ].join('');
    },

    // pasta e fagioli: soup plate, thick creamy borlotti soup with ditalini, olive oil and black pepper
    it_pastafagioli: p => {
        const sp = wiSpots('pef', 30, 56, 12.5);
        const items = sp.map(([x, y, r], i) => i % 2 ? wiBean(p, x, y, 15, r, { c: '#b88672', speck: '#7a3e34' }) : wiDitalino(p, x, y, 10, r, { end: i % 4 === 0 })).join('');
        return [
            wiSoupPlate(p, { line: '#8a5a3a' }),
            K.liquid(p, { R: 66, c: '#a8684a', op: 1, shine: false }),
            `<g ${p.sh(.6)}>`, items, `</g>`,
            `<circle cx="100" cy="100" r="66" fill="#b07052" opacity=".22"/>`,
            wiOil(p, 100, 100, 90, { n: 12, op: .8 }),
            wiPepper(p, 100, 100, 100, 50),
            wiRosemary(p, 120, 84, 26, -30),
        ].join('');
    },
};
