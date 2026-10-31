// Spain (es_) — hand-composed redraw of the newer dishes (mains, sides, soups)
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// helpers (xes = x-series Spain). Copied / adapted from w_es.mjs
// =========================================================
function xesSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const xesBlur = (p, s = 2) => `filter="url(#${p.def('xesbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const xesShine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
const xesHi = (s, op = .6, w = 1.2) => `<path d="M${f1(-s * .28)},${f1(-s * .14)} Q${f1(-s * .1)},${f1(-s * .3)} ${f1(s * .14)},${f1(-s * .26)}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
const xesSh = (p, k, body) => `<g ${p.sh(k)}>${body}</g>`;

// ---------- vessels ----------
const xesPlate = (p, rim = '#2f5f9a', o = {}) => K.plate(p, { rim, ...o });
// Talavera-style plate: white with a blue and ochre painted rim
function xesTalavera(p, { blue = '#2a4f9a', ochre = '#e09a2a' } = {}){
    let m = '';
    for (let i = 0; i < 16; i++){
        const a = i / 16 * 6.283, x = 100 + Math.cos(a) * 84, y = 100 + Math.sin(a) * 84, deg = a * 57.3 + 90;
        m += `<path ${T(x, y, deg)} d="M0,-5 Q3.4,0 0,5 Q-3.4,0 0,-5Z" fill="${blue}" opacity=".85"/>`;
        const b = a + .196; m += `<circle cx="${f1(100 + Math.cos(b) * 84)}" cy="${f1(100 + Math.sin(b) * 84)}" r="2" fill="${ochre}"/>`;
    }
    return `${K.plate(p, { rim: blue, well: .72 })}${m}<circle cx="100" cy="100" r="77" fill="none" stroke="${blue}" stroke-width="1.2" opacity=".8"/>`;
}
// soup plate (plato hondo)
function xesSoupPlate(p, { base = '#fbf9f4', line = '#2f5f9a' } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="95" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="91" fill="none" stroke="${line}" stroke-width="1.8" opacity=".85"/>
        <circle cx="100" cy="100" r="72" fill="none" stroke="${dk(base, .14)}" stroke-width="4" opacity=".4"/>
        <circle cx="100" cy="100" r="70" fill="${p.rg(base, .05, .24, .62, .64)}"/>
        <path d="M30,60 A80,80 0 0 1 62,28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// glazed bowl (cuenco)
const xesBowl = (p, glaze, inside = '#fbf7ee', o = {}) => K.bowl(p, { glaze, inside, ...o });
// clay cazuela de barro with two lugs
function xesCazuela(p, { R = 84, glaze = '#8a3f1c', clay = '#c0703e' } = {}){
    const lug = x => `<rect x="${x - 9}" y="88" width="18" height="24" rx="8" fill="${p.g(clay, .2, .3)}" stroke="${dk(clay, .3)}" stroke-width=".8"/>`;
    return `<g ${p.sh(1.8)}>${lug(100 - R - 2)}${lug(100 + R + 2)}<circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${lt(clay, .3)}" stroke-width="1.4" opacity=".7"/>
        <circle cx="100" cy="100" r="${R - 8}" fill="${p.rg(glaze, .15, .35, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .36} A${R * .8},${R * .8} 0 0 1 ${100 - R * .28},${100 - R * .76}" stroke="#ffe2c8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// flat clay plate (tapas)
function xesClayPlate(p, { R = 92, clay = '#c26f3c', glaze = '#a24f24' } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R * .8}" fill="${p.rg(glaze, .16, .3, .62, .64)}"/>
        <circle cx="100" cy="100" r="${R * .8}" fill="none" stroke="${dk(clay, .25)}" stroke-width="1.2" opacity=".6"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#ffe2c8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// clay pot (olla) with two loop handles and a thick rim
function xesOlla(p, { R = 80, clay = '#b8653a', glaze = '#7a3418' } = {}){
    const h = sgn => `<path d="M${100 + sgn * (R - 6)},78 Q${100 + sgn * (R + 18)},78 ${100 + sgn * (R + 18)},100 Q${100 + sgn * (R + 18)},122 ${100 + sgn * (R - 6)},122" stroke="${clay}" stroke-width="7" fill="none"/>`;
    return `<g ${p.sh(1.8)}>${h(-1)}${h(1)}<circle cx="100" cy="100" r="${R}" fill="${p.rg(clay, .25, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${lt(clay, .35)}" stroke-width="2" opacity=".6"/>
        <circle cx="100" cy="100" r="${R - 10}" fill="${dk(glaze, .3)}"/>
        <circle cx="100" cy="100" r="${R - 12}" fill="${p.rg(glaze, .15, .35, .62, .64)}"/>
        <path d="M${100 - R * .74},${100 - R * .36} A${R * .82},${R * .82} 0 0 1 ${100 - R * .3},${100 - R * .78}" stroke="#ffe2c8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// paella pan
function xesPaellaPan(p){
    const h = x => `<path d="M${x - 9},88 Q${x - 9},80 ${x},80 Q${x + 9},80 ${x + 9},88 L${x + 9},112 Q${x + 9},120 ${x},120 Q${x - 9},120 ${x - 9},112Z" fill="none" stroke="#b5281e" stroke-width="5"/>`;
    return `<g ${p.sh(1.8)}>${h(9)}${h(191)}<circle cx="100" cy="100" r="86" fill="${p.rg('#9ea2a4', .3, .35, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#d9dcdd" stroke-width="1.6" opacity=".9"/>
        <circle cx="100" cy="100" r="79" fill="${p.rg('#55595c', .1, .25, .6, .6)}"/>
        <path d="M30,62 A80,80 0 0 1 62,28" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// black iron frying pan with a short handle stub at the right
function xesSarten(p, { R = 80 } = {}){
    return `<g ${p.sh(1.8)}><rect x="${100 + R - 4}" y="92" width="${30}" height="16" rx="6" fill="${p.g('#3a3432', .2, .3)}"/><circle cx="100" cy="100" r="${R}" fill="${p.rg('#46403d', .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="#6e6662" stroke-width="1.4" opacity=".8"/>
        <circle cx="100" cy="100" r="${R - 7}" fill="${p.rg('#2a2523', .1, .2, .6, .6)}"/>
        <path d="M${100 - R * .74},${100 - R * .36} A${R * .82},${R * .82} 0 0 1 ${100 - R * .3},${100 - R * .78}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35"/>`;
}
// rectangular oven dish (fuente). clay or white porcelain
function xesFuente(p, { w = 184, h = 140, base = '#c0703e', inner = '#8a3f1c', rim = null } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.8)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${p.rg(base, .2, .25, .35, .3)}"/></g>
        ${rim ? `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="19" fill="none" stroke="${rim}" stroke-width="1.4" opacity=".8"/>` : ''}
        <rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" rx="15" fill="${p.rg(inner, .12, .3, .6, .6)}"/>
        <path d="M${x + 14},${y + 34} Q${x + 14},${y + 14} ${x + 36},${y + 14}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// wooden board
function xesBoard(p){
    let g = '';
    for (let i = 0; i < 7; i++){ const y = 36 + i * 21; g += `<path d="M14,${y} Q70,${y + (i % 2 ? 4 : -4)} 120,${y} T186,${y + 2}" stroke="#a8743e" stroke-width="1" fill="none" opacity=".5"/>`; }
    return `<g ${p.sh(1.8)}><rect x="8" y="22" width="184" height="156" rx="14" fill="${p.g('#d6a868', .2, .25)}" stroke="#a8743e" stroke-width="1"/></g>${g}
        <path d="M18,40 Q18,30 30,30" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}

// ---------- surfaces ----------
function xesSauce(p, x, y, s, c, { seed = 1, sy = .9, op = 1 } = {}){
    const R = rng(p.id + 'xsc' + seed);
    return `<path ${T(x, y)} d="${xesSm(ring(s / 2, 11, .14, R, 1, sy), true)}" fill="${p.rg(c, .2, .25, .42, .4)}" opacity="${op}"/>`;
}
function xesSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xesspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
function xesGrains(p, x, y, R0, { c = '#e8b23e', n = 380, seed = 1, grain = 3.4, sy = 1, len = 1 } = {}){
    const R = rng(p.id + 'xgr' + seed);
    const ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * R0, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const h = grain * (.36 + R() * .14) * len, b = R() * Math.PI;
        const lit = (gx - x + gy - y) / R0 + (R() - .5) * 1.4 < 0;
        ds[lit ? 0 : R() < .3 ? 2 : 1] += `M${f1(gx - Math.cos(b) * h)} ${f1(gy - Math.sin(b) * h)}l${f1(Math.cos(b) * h * 2)} ${f1(Math.sin(b) * h * 2)}`;
    }
    const cols = [lt(c, .35), c, dk(c, .18)];
    return `<g stroke-linecap="round" stroke-width="${grain}" fill="none"><path d="${ds[1] + ds[2]}" stroke="${dk(c, .35)}" opacity=".5" transform="translate(.5 .7)"/>${ds.map((d, i) => `<path d="${d}" stroke="${cols[i]}"/>`).join('')}</g>`;
}
function xesDots(p, x, y, s, { cols = ['#6b4a2e'], n = 60, size = 3, seed = 1, sy = 1, len = .8 } = {}){
    const R = rng(p.id + 'xdt' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, b = R() * 6.28; ds[Math.floor(R() * cols.length)] += `M${f1(x + Math.cos(a) * d)} ${f1(y + Math.sin(a) * d * sy)}l${f1(Math.cos(b) * len)} ${f1(Math.sin(b) * len)}`; }
    return cols.map((c, i) => `<path d="${ds[i]}" stroke="${dk(c, .3)}" stroke-width="${f1(size + .9)}" stroke-linecap="round" fill="none"/><path d="${ds[i]}" stroke="${c}" stroke-width="${size}" stroke-linecap="round" fill="none"/>`).join('')
        + `<path d="${ds.join('')}" stroke="#fff" stroke-width="${f1(size * .3)}" stroke-linecap="round" fill="none" opacity=".45" transform="translate(${f1(-size * .22)} ${f1(-size * .22)})"/>`;
}
function xesOil(p, x, y, s, { n = 8, seed = 1, op = .7, c = '#e6c13a' } = {}){
    const R = rng(p.id + 'xoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1 + R() * 2.6; out += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".7"/>`; }
    return out;
}
function xesParsley(p, x, y, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'xpa' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${xesSm(ring(1 + R() * 1.1, 5, .6, R))}" fill="${R() < .5 ? '#3f8a2c' : '#5aa63c'}"/>`; }
    return out;
}
const xesPepper = (p, x, y, s, n = 30) => K.sprinkle(p, x, y, s, { c: '#2a2420', n, r: .7 });
const xesPimenton = (p, x, y, s, n = 40) => K.sprinkle(p, x, y, s, { c: '#c0321a', n, r: .9 });
// cream swirl on a soup
function xesSwirl(p, cx, cy, R, c = '#fbf3e0', w = 3.4){
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i * .55, r = R * (1 - i / 26); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
    const d = xesSm(pts);
    return `<path d="${d}" stroke="${dk(c, .12)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity=".5"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}

// ---------- parts ----------
function xesChunk(p, x, y, s, r = 0, c = '#7a3a22', { seed = 1, sy = .85, n = 7, j = .3, k = .6, hi = .55 } = {}){
    const R = rng(p.id + 'xck' + seed + x + y);
    const pts = ring(s / 2, n, j, R, 1, sy);
    return `<g ${T(x, y, r)}><path d="${xesSm(pts, true, k)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .32)}" stroke-width=".7"/>${xesHi(s, hi, Math.max(1, s * .06))}</g>`;
}
function xesBand(p, x, y, L, W, r = 0, { c = '#d8352a', bend = .25, hi = true, cap = 'round' } = {}){
    const d = `M${f1(-L / 2)},0 Q0,${f1(-L * bend)} ${f1(L / 2)},0`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#2b1607" stroke-width="${f1(W + 1)}" fill="none" stroke-linecap="${cap}" opacity=".22" transform="translate(1.2 1.8)"/><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(W + 1.2)}" fill="none" stroke-linecap="${cap}"/><path d="${d}" stroke="${c}" stroke-width="${W}" fill="none" stroke-linecap="${cap}"/>
        ${hi ? `<path d="M${f1(-L * .36)},${f1(-W * .22 - L * bend * .28)} Q0,${f1(-L * bend * .5 - W * .25)} ${f1(L * .3)},${f1(-W * .22 - L * bend * .2)}" stroke="${lt(c, .55)}" stroke-width="${f1(Math.max(.8, W * .22))}" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}</g>`;
}
function xesDice(p, x, y, s, r = 0, c = '#ef7f30', { skin = null } = {}){
    const h = f1(s / 2);
    return `<g ${T(f1(x), f1(y), Math.round(r))}><rect x="${-h}" y="${-h}" width="${f1(s)}" height="${f1(s)}" rx="${f1(s * .2)}" fill="${p.g(c, .32, .2)}" stroke="${dk(c, .3)}" stroke-width=".6"/>${skin ? `<rect x="${-h}" y="${f1(h * .4)}" width="${f1(s)}" height="${f1(s * .3)}" rx="1" fill="${skin}"/>` : ''}${s > 13 ? `<path d="M${f1(-h * .6)},${f1(-h * .55)}h${f1(s * .45)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/>` : ''}</g>`;
}
function xesLemonSlice(p, x, y, s, { c = '#f7da4e' } = {}){
    const rr = s / 2;
    const seg = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28; return `M0,0 L${f1(Math.cos(a) * rr * .8)},${f1(Math.sin(a) * rr * .8)}`; }).join('');
    return `<g ${T(x, y)}><g ${p.sh(.6)}><circle r="${rr}" fill="#e8b81e" stroke="#c9960f" stroke-width=".6"/></g><circle r="${f1(rr - 1.8)}" fill="#fbf3c8"/><circle r="${f1(rr * .8)}" fill="${p.rg(c, .3, .1)}"/>
        <path d="${seg}" stroke="#fdf6d2" stroke-width="1.2"/><circle r="${f1(rr * .12)}" fill="#fdf6d2"/></g>`;
}
function xesOlive(p, x, y, s, r = 0, { c = '#3a2a32', pit = false } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="${p.rg(c, .3, .25, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        ${pit ? `<ellipse rx="${f1(s * .16)}" ry="${f1(s * .12)}" fill="${dk(c, .5)}"/>` : ''}
        <ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .14)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" fill="#fff" opacity=".7"/></g>`;
}
function xesGarlic(p, x, y, s, r = 0, { fried = .4 } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .36)}" fill="${mix('#f6ecd2', '#e0a850', fried)}" stroke="${mix('#d8c79e', '#b87a2a', fried)}" stroke-width=".6"/><ellipse rx="${f1(s * .18)}" ry="${f1(s * .1)}" fill="${mix('#efe0b8', '#d29a44', fried)}"/></g>`;
}
function xesLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468' } = {}){
    const R = rng(p.id + 'xlt' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .08); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xesSm(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .46)},2 Q0,${f1(-s * .04)} ${f1(s * .44)},0" stroke="#eef8d8" stroke-width="${f1(s * .06)}" fill="none" stroke-linecap="round"/></g>`;
}
function xesChicken(p, x, y, s, r = 0, { c = '#d39a4a', seed = 1, ch = .3 } = {}){
    const R = rng(p.id + 'xck2' + seed + x + y);
    const pts = ring(10, 10, .3, R, 1.2, .85);
    let m = '';
    for (let i = 0; i < 4; i++) m += `<ellipse cx="${f1((R() - .5) * 12)}" cy="${f1((R() - .5) * 8)}" rx="${f1(1.8 + R() * 2.4)}" ry="${f1(1 + R() * 1.4)}" fill="#7a3a10" opacity="${f1(ch + R() * .25)}"/>`;
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.8)}><path d="${xesSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .38)}" stroke-width=".7"/></g>${m}
        <path d="M-7,-4.5 Q-2,-7.4 4,-6.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function xesDrumstick(p, x, y, s, r = 0, { c = '#c8863c' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae8c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <ellipse cx="-8" cy="3" rx="5" ry="3" fill="#7a3a10" opacity=".35"/><ellipse cx="2" cy="-4" rx="3.6" ry="2" fill="#7a3a10" opacity=".28"/>
        <path d="M-16,-5 Q-10,-11 -2,-9.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// roast chicken thigh: big rounded piece with crisp, blistered skin
function xesThigh(p, x, y, s, r = 0, { c = '#c9822e', seed = 1 } = {}){
    const R = rng(p.id + 'xth' + seed + x);
    const pts = ring(s / 2, 9, .22, R, 1.15, .9);
    let bl = '';
    for (let i = 0; i < 6; i++) bl += `<ellipse cx="${f1((R() - .5) * s * .6)}" cy="${f1((R() - .5) * s * .5)}" rx="${f1(s * (.05 + R() * .07))}" ry="${f1(s * (.03 + R() * .04))}" fill="${R() < .5 ? '#8a4210' : '#f0b860'}" opacity=".55"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xesSm(pts, true)}" fill="${p.g(c, .32, .38)}" stroke="${dk(c, .42)}" stroke-width=".8"/></g>${bl}
        <path d="M${f1(-s * .3)},${f1(-s * .12)} Q${f1(-s * .1)},${f1(-s * .32)} ${f1(s * .18)},${f1(-s * .26)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
function xesChorizo(p, x, y, s, { half = false, r = 0 } = {}){
    const R = rng(p.id + 'xch' + x + y);
    let sp = '';
    for (let i = 0; i < 5; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; sp += `<ellipse cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d * (half ? .5 : 1) - (half ? s * .12 : 0))}" rx="${f1(.8 + R() * 1)}" ry="${f1(.6 + R() * .6)}" fill="#f2c08a" opacity=".85"/>`; }
    const shape = half ? `<path d="M${-s / 2},0 A${s / 2},${s / 2} 0 0 1 ${s / 2},0Z"` : `<circle r="${s / 2}"`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}>${shape} fill="#7c1c12"/></g>${half ? `<path d="M${f1(-s / 2 + 1.4)},0 A${f1(s / 2 - 1.4)},${f1(s / 2 - 1.4)} 0 0 1 ${f1(s / 2 - 1.4)},0Z"` : `<circle r="${f1(s / 2 - 1.4)}"`} fill="${p.rg('#c23a22', .2, .2)}"/>${sp}
        <path d="M${f1(-s * .28)},${f1(-s * .14)} Q${f1(-s * .12)},${f1(-s * .3)} ${f1(s * .1)},${f1(-s * .3)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// morcilla slice: very dark with pale rice/onion specks
function xesMorcilla(p, x, y, s, r = 0){
    const R = rng(p.id + 'xmo' + x + y);
    let sp = '';
    for (let i = 0; i < 7; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; sp += `<ellipse cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d)}" rx="${f1(.7 + R() * .6)}" ry=".5" fill="#c9a48a" opacity=".8"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><circle r="${s / 2}" fill="#1f0e10"/></g><circle r="${f1(s / 2 - 1.3)}" fill="${p.rg('#4a1e22', .15, .3)}"/>${sp}${xesHi(s, .45, 1)}</g>`;
}
function xesBay(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 30)}><path d="M-15,0 Q-4,-7 15,0 Q-4,7 -15,0Z" fill="${p.g('#7d8c3c', .25, .25)}" stroke="#4f5a22" stroke-width=".6"/><path d="M-14,0 L14,0" stroke="#b6c27a" stroke-width=".7"/></g>`;
}
function xesClove(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-10,2 Q-9,-7 0,-7 Q7,-7 10,-1 Q9,5 0,6 Q-8,6.5 -10,2Z" fill="${p.g('#f0dcb4', .3, .25)}" stroke="#b8925a" stroke-width=".6"/></g>
        <path d="M-7,3 Q0,4.6 8,0 M-6,-2 Q1,-1 8,-3" stroke="#c48ea0" stroke-width=".9" fill="none" opacity=".7"/>
        <ellipse cx="2" cy="1" rx="5" ry="3" fill="#d9a050" opacity=".35"/></g>`;
}
function xesMushroom(p, x, y, s, r = 0, { cut = true, tan = .5 } = {}){
    const k = s / 20, c = mix('#efe4cc', '#c8904a', tan);
    return cut
        ? `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-10,0 Q-10,-9 0,-9 Q10,-9 10,0 Q10,2 6,2 L4,2 L4,8 Q0,9.5 -4,8 L-4,2 L-6,2 Q-10,2 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
            <path d="M-8,0 Q-8,-6.5 0,-6.5 Q8,-6.5 8,0" stroke="${dk(c, .2)}" stroke-width=".8" fill="none" opacity=".6"/></g>`
        : `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><circle r="9.5" fill="${p.rg(c, .3, .3, .35, .32)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g><ellipse cx="-3" cy="-3.4" rx="3.4" ry="1.8" fill="#fff" opacity=".5"/></g>`;
}
function xesEggSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .42)}" fill="${p.rg('#fffdf6', .1, .12)}" stroke="#d8d0bf" stroke-width=".6"/></g><circle r="${f1(s * .22)}" fill="${p.rg('#f6c23a', .25, .15)}"/></g>`;
}
function xesTuna(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'xtn' + seed + x + y);
    let out = '';
    for (let i = 0; i < 4; i++){ const c = R() < .5 ? '#d8b58c' : '#c99e72'; out += `<path ${T(x + (R() - .5) * s * .5, y + (R() - .5) * s * .4, R() * 180)} d="${xesSm(ring(s * (.2 + R() * .12), 7, .45, R, 1.3, .8), true)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`; }
    return `<g ${p.sh(.6)}><g ${p.rough(1.4, .3)}>${out}</g></g>`;
}
function xesHam(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f1(-s / 2)}" y="${f1(-s / 2)}" width="${s}" height="${f1(s * .8)}" rx="${f1(s * .2)}" fill="${p.g('#b8404a', .25, .25)}" stroke="#7a2230" stroke-width=".5"/></g><rect x="${f1(-s / 2 + .6)}" y="${f1(s * .1)}" width="${f1(s - 1.2)}" height="${f1(s * .2)}" rx="1" fill="#f3e2d0"/></g>`;
}
// thin slice of serrano ham, draped: deep red with a white fat edge and marbling
function xesJamon(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xjm' + seed + x);
    const pts = ring(1, 12, .22, R, w / 2, h / 2);
    const fat = xesSm(pts.slice(1, 6));
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xesSm(pts, true)}" fill="${p.g('#b3303c', .3, .3)}" stroke="#7a1a26" stroke-width=".6"/></g>
        <path d="${fat}" stroke="#f6e6da" stroke-width="${f1(h * .14)}" fill="none" stroke-linecap="round" opacity=".95"/>
        <path d="M${f1(-w * .3)},${f1(-h * .05)} q${f1(w * .15)},${f1(-h * .12)} ${f1(w * .3)},0 M${f1(-w * .1)},${f1(h * .2)} q${f1(w * .12)},${f1(-h * .1)} ${f1(w * .26)},0" stroke="#efc6c0" stroke-width=".9" fill="none" opacity=".7"/>
        <path d="M${f1(-w * .32)},${f1(-h * .24)} Q${f1(-w * .1)},${f1(-h * .36)} ${f1(w * .16)},${f1(-h * .3)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
function xesChickpea(p, x, y, s, r = 0){
    const h = f1(s / 2);
    return `<g ${T(f1(x), f1(y), Math.round(r))}><ellipse rx="${h}" ry="${f1(s * .46)}" fill="${p.rg('#e2c08a', .3, .25, .35, .32)}" stroke="#a8844a" stroke-width=".6"/><path d="M${f1(s * .1)},${-h}q${f1(s * .14)},${f1(s * .2)} 0,${f1(s * .34)}" stroke="#b8945a" stroke-width=".7" fill="none"/></g>`;
}
function xesCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f1(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f1(-s / 2 + s * .18)}" y="${f1(-s / 2 + s * .18)}" width="${f1(s * .5)}" height="${f1(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
function xesBattered(p, x, y, w, h, r = 0, { seed = 1, c = '#eebc52' } = {}){
    const R = rng(p.id + 'xbt' + seed);
    const pts = ring(1, 11, .16, R, w / 2, h / 2);
    let sp = '';
    for (let i = 0; i < 3; i++) sp += `<ellipse cx="${f1((R() - .5) * w * .7)}" cy="${f1((R() - .5) * h * .6)}" rx="${f1(2 + R() * 4)}" ry="${f1(1.4 + R() * 2.4)}" fill="#c4802a" opacity="${f1(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><g ${p.rough(2.4, .14)}><path d="${xesSm(pts, true)}" fill="${p.g(c, .35, .32)}" stroke="#b07a24" stroke-width=".9"/></g></g>
        <g ${p.crumb(.5)}><path d="${xesSm(pts.map(([a, b]) => [a * .86, b * .82]), true)}" fill="${lt(c, .15)}" opacity=".7"/></g>${sp}
        <path d="M${f1(-w * .32)},${f1(-h * .24)} Q${f1(-w * .06)},${f1(-h * .42)} ${f1(w * .24)},${f1(-h * .3)}" stroke="#fff6dc" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// breaded (pan rallado) cutlet: irregular thin fillet, crumb texture
function xesBreaded(p, x, y, w, h, r = 0, { seed = 1, c = '#d99a3e' } = {}){
    const R = rng(p.id + 'xbr' + seed);
    const pts = ring(1, 10, .2, R, w / 2, h / 2);
    let sp = '';
    for (let i = 0; i < 5; i++) sp += `<ellipse cx="${f1((R() - .5) * w * .7)}" cy="${f1((R() - .5) * h * .6)}" rx="${f1(3 + R() * 5)}" ry="${f1(2 + R() * 3)}" fill="#a85e1c" opacity="${f1(.18 + R() * .2)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><g ${p.crumb(.85)}><path d="${xesSm(pts, true)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .4)}" stroke-width=".9"/></g></g>${sp}
        ${K.crumbs(p, x * 0, 0, Math.min(w, h) * .9, { n: 14, c: '#f0c46a' })}
        <path d="M${f1(-w * .3)},${f1(-h * .22)} Q${f1(-w * .06)},${f1(-h * .4)} ${f1(w * .22)},${f1(-h * .3)}" stroke="#fff4d8" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function xesFriedEgg(p, x, y, s, r = 0, { broken = false } = {}){
    const R = rng(p.id + 'xfe' + x);
    const pts = ring(19, 14, .24, R);
    const yolk = broken
        ? `<path d="${xesSm(ring(9, 8, .5, R, 1.3, 1), true)}" fill="${p.rg('#f39a17', .3, .15)}" stroke="#d07d10" stroke-width=".6" transform="translate(3 3)"/><circle cx="1" cy="0" r="5" fill="#f6a820"/>`
        : `<circle cx="2" cy="1" r="8.2" fill="${p.rg('#f39a17', .35, .18, .35, .32)}" stroke="#d07d10" stroke-width=".8"/><ellipse cx="-.8" cy="-2.2" rx="3.2" ry="1.9" fill="#fff" opacity=".8"/>`;
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.9)}><path d="${xesSm(pts.map(([a, b]) => [a * 1.06, b * 1.06]), true)}" fill="#c9843a" ${p.rough(2.5, .25)}/></g>
        <path d="${xesSm(pts, true)}" fill="${p.rg('#fffdf8', .1, .08)}" stroke="#e7c79a" stroke-width="1.2"/>${yolk}</g>`;
}
// fried potato: chunk (bravas), stick (chips) or round slice
function xesFry(p, x, y, w, h, r = 0, { c = '#e8ac4a', seed = 1, crisp = true } = {}){
    const R = rng(p.id + 'xfr' + seed + x + y);
    const pts = [[-w / 2, -h / 2], [0, -h / 2], [w / 2, -h / 2], [w / 2, 0], [w / 2, h / 2], [0, h / 2], [-w / 2, h / 2], [-w / 2, 0]].map(([a, b]) => [a + (R() - .5) * w * .1, b + (R() - .5) * h * .1]);
    return `<g ${T(x, y, r)}><path d="${xesSm(pts, true, .35)}" fill="${p.g(c, .35, .4)}" stroke="${dk(c, .42)}" stroke-width=".7"/>
        <path d="${xesSm(pts.map(([a, b]) => [a * .66 - w * .07, b * .62 - h * .08]), true, .35)}" fill="${lt(c, .32)}" opacity=".8"/>
</g>`;
}
// soft potato slice (a lo pobre, under baked fish)
function xesPotSlice(p, x, y, s, r = 0, { c = '#f0cf78', seed = 1, brown = .5 } = {}){
    const R = rng(p.id + 'xps' + seed + x + y);
    let sp = '';
    for (let i = 0; i < 2; i++) sp += `<ellipse cx="${f1((R() - .5) * s * .5)}" cy="${f1((R() - .5) * s * .3)}" rx="${f1(s * .12)}" ry="${f1(s * .07)}" fill="#b8721e" opacity="${f1(brown * (.3 + R() * .4))}"/>`;
    const rx = f1(s / 2 * (.94 + R() * .1)), ry = f1(s * .4 * (.92 + R() * .1));
    return `<g ${T(f1(x), f1(y), Math.round(r))}><ellipse rx="${rx}" ry="${ry}" fill="${p.rg(c, .3, .22)}" stroke="${dk(c, .32)}" stroke-width=".6"/><ellipse rx="${f1(rx * .84)}" ry="${f1(ry * .8)}" fill="none" stroke="${lt(c, .3)}" stroke-width="1" opacity=".7"/>${sp}</g>`;
}
// roast potato chunk: golden faces, crisp darker edges
function xesRoastPot(p, x, y, s, r = 0, { seed = 1, c = '#e2a94e' } = {}){
    return K.potato(p, x, y, s, r, { c, seed });
}
// pork rib piece: glazed meat with a bone end
function xesRib(p, x, y, L, W, r = 0, { c = '#8a3e1c' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f1(L / 2 - 6)}" y="${f1(-W * .18)}" width="10" height="${f1(W * .36)}" rx="${f1(W * .18)}" fill="${p.g('#efe2c8', .3, .2)}" stroke="#bba882" stroke-width=".6"/>
        <rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${f1(L - 2)}" height="${W}" rx="${f1(W * .42)}" fill="${p.g(c, .3, .38)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        <path d="M${f1(-L * .3)},${f1(W * .12)} L${f1(L * .28)},${f1(W * .12)}" stroke="${dk(c, .5)}" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>
        <path d="M${f1(-L * .34)},${f1(-W * .2)} Q0,${f1(-W * .34)} ${f1(L * .3)},${f1(-W * .2)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// rack of pork ribs: one glazed slab, grooves between ribs, bone ends along the top edge
function xesRack(p, x, y, w, h, r = 0, { c = '#94401a', n = 6 } = {}){
    const R = rng(p.id + 'xrk');
    const pts = [[-w / 2, -h / 2 + 4], [-w / 4, -h / 2], [0, -h / 2 + 2], [w / 4, -h / 2], [w / 2, -h / 2 + 6], [w / 2 + 2, 0], [w / 2 - 4, h / 2 - 4], [w / 4, h / 2], [0, h / 2 - 2], [-w / 4, h / 2 + 1], [-w / 2 + 2, h / 2 - 6], [-w / 2 - 2, 0]].map(([a, b]) => [a + (R() - .5) * 4, b + (R() - .5) * 4]);
    let bones = '', grooves = '', ch = '';
    for (let i = 0; i < n; i++){ const bx = -w / 2 + (i + .5) * w / n; bones += `<rect x="${f1(bx - 4)}" y="${f1(-h / 2 - 9)}" width="8" height="16" rx="4" fill="${p.g('#efe2c6', .3, .25)}" stroke="#b8a27a" stroke-width=".6"/>`; if (i) grooves += `<path d="M${f1(bx - w / n / 2)},${f1(-h / 2 + 6)} Q${f1(bx - w / n / 2 + 3)},0 ${f1(bx - w / n / 2 - 1)},${f1(h / 2 - 6)}" stroke="${dk(c, .55)}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`; }
    for (let i = 0; i < 8; i++) ch += `<ellipse cx="${f1((R() - .5) * w * .8)}" cy="${f1((R() - .5) * h * .7)}" rx="${f1(3 + R() * 5)}" ry="${f1(2 + R() * 3)}" fill="#3a1606" opacity="${f1(.2 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.3)}>${bones}<path d="${xesSm(pts, true)}" fill="${p.g(c, .3, .4)}" stroke="${dk(c, .5)}" stroke-width=".9"/></g>${ch}${grooves}
        ${[-.3, .05, .35].map(t => `<path d="M${f1(w * t - 8)},${f1(-h * .3)} Q${f1(w * t)},${f1(-h * .36)} ${f1(w * t + 10)},${f1(-h * .28)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`).join('')}
        <path d="M${f1(-w * .4)},${f1(h * .1)} Q0,${f1(-h * .04)} ${f1(w * .4)},${f1(h * .12)}" stroke="#d07a3a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}
// fried fresh anchovy: slim floured fish, golden, with a forked tail
function xesAnchovy(p, x, y, L, r = 0, { c = '#dca24c' } = {}){
    const h = L * .16;
    const body = `M${f1(-L / 2)},0 C${f1(-L * .4)},${f1(-h)} ${f1(L * .2)},${f1(-h * 1.05)} ${f1(L * .36)},${f1(-h * .25)} L${f1(L / 2)},${f1(-h * 1.1)} L${f1(L * .44)},0 L${f1(L / 2)},${f1(h * 1.1)} L${f1(L * .36)},${f1(h * .25)} C${f1(L * .2)},${f1(h * 1.05)} ${f1(-L * .4)},${f1(h)} ${f1(-L / 2)},0Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${body}" fill="${p.g(c, .35, .35)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="M${f1(-L * .3)},${f1(h * .1)} L${f1(L * .32)},${f1(h * .05)}" stroke="${dk(c, .25)}" stroke-width="1" opacity=".5"/>
        ${[.1, -.05, .2, -.18, .3].map((t, i) => `<circle cx="${f1(L * t)}" cy="${f1((i % 2 ? .4 : -.4) * h)}" r=".9" fill="#f8e2a8"/>`).join('')}
        <path d="M${f1(-L * .3)},${f1(-h * .6)} L${f1(-L * .3)},${f1(h * .6)}" stroke="${dk(c, .3)}" stroke-width=".8" opacity=".6"/>
        <circle cx="${f1(-L * .4)}" cy="${f1(-h * .15)}" r="${f1(h * .2)}" fill="#3a2414"/>
        <path d="M${f1(-L * .25)},${f1(-h * .5)} Q0,${f1(-h * .85)} ${f1(L * .22)},${f1(-h * .5)}" stroke="#fff4d8" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// whole sea bream seen from above-side: silver body, golden band on the head, slashes
function xesBream(p, x, y, L, r = 0){
    const h = L * .34;
    const body = `M${f1(-L / 2)},2 C${f1(-L * .44)},${f1(-h * .8)} ${f1(-L * .1)},${f1(-h * 1.05)} ${f1(L * .14)},${f1(-h * .8)} C${f1(L * .3)},${f1(-h * .6)} ${f1(L * .34)},${f1(-h * .2)} ${f1(L * .38)},${f1(-h * .1)} L${f1(L / 2)},${f1(-h * .62)} Q${f1(L * .47)},0 ${f1(L / 2)},${f1(h * .62)} L${f1(L * .38)},${f1(h * .1)} C${f1(L * .34)},${f1(h * .2)} ${f1(L * .3)},${f1(h * .6)} ${f1(L * .14)},${f1(h * .8)} C${f1(-L * .1)},${f1(h * 1.05)} ${f1(-L * .44)},${f1(h * .7)} ${f1(-L / 2)},2Z`;
    const slash = t => `<path d="M${f1(L * t)},${f1(-h * .55)} Q${f1(L * t + 6)},0 ${f1(L * t)},${f1(h * .55)}" stroke="#7a6a58" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.4)}><path d="${body}" fill="${p.g('#b4b8b6', .35, .35)}" stroke="#5e6262" stroke-width=".9"/></g>
        <path d="M${f1(-L * .44)},${f1(-h * .5)} C${f1(-L * .2)},${f1(-h * .95)} ${f1(L * .2)},${f1(-h * .8)} ${f1(L * .36)},${f1(-h * .2)}" stroke="#6e7476" stroke-width="${f1(h * .25)}" fill="none" stroke-linecap="round" opacity=".45"/>
        <path d="M${f1(-L * .43)},${f1(h * .1)} C${f1(-L * .2)},${f1(h * .7)} ${f1(L * .2)},${f1(h * .72)} ${f1(L * .34)},${f1(h * .2)}" stroke="#f2ece0" stroke-width="${f1(h * .18)}" fill="none" stroke-linecap="round" opacity=".5"/>
        ${[-.12, .04, .2].map(slash).join('')}
        <path d="M${f1(-L * .3)},${f1(-h * .62)} Q${f1(-L * .27)},0 ${f1(-L * .3)},${f1(h * .62)}" stroke="#585c5c" stroke-width="1.2" fill="none" opacity=".7"/>
        <path d="M${f1(-L * .37)},${f1(-h * .5)} Q${f1(-L * .35)},0 ${f1(-L * .37)},${f1(h * .5)}" stroke="#e8b83a" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <circle cx="${f1(-L * .43)}" cy="${f1(-h * .12)}" r="${f1(h * .12)}" fill="#f2efe4" stroke="#4a4a4a" stroke-width=".7"/><circle cx="${f1(-L * .43)}" cy="${f1(-h * .12)}" r="${f1(h * .06)}" fill="#1e1e1e"/>
        <path d="M${f1(-L * .22)},${f1(-h * .62)} Q0,${f1(-h * .86)} ${f1(L * .2)},${f1(-h * .6)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// hake steak (rodaja): white flesh, thin grey skin, the spine in the middle
function xesHake(p, x, y, s, r = 0, { c = '#f8f2e4', seed = 1 } = {}){
    const R = rng(p.id + 'xhk' + seed + x);
    const pts = ring(s / 2, 10, .1, R, 1.1, .82).map(([a, b]) => [a, b < 0 ? b : b * 1.05]);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xesSm(pts, true)}" fill="#7e8486"/></g>
        <path d="${xesSm(pts.map(([a, b]) => [a * .92, b * .9]), true)}" fill="${p.rg(c, .2, .15)}"/>
        <path d="M0,${f1(-s * .36)} L0,${f1(s * .3)}" stroke="${dk(c, .12)}" stroke-width="1" opacity=".7"/>
        ${[-.3, -.15, .15, .3].map(t => `<path d="M${f1(s * t)},${f1(-s * .3)} Q${f1(s * t * 1.3)},0 ${f1(s * t)},${f1(s * .28)}" stroke="${dk(c, .1)}" stroke-width=".8" fill="none" opacity=".8"/>`).join('')}
        <circle cx="0" cy="${f1(-s * .04)}" r="${f1(s * .08)}" fill="#e8dcc6" stroke="#b8a888" stroke-width=".8"/>
        ${xesHi(s, .7, 1.6)}</g>`;
}
// open clam with the meat showing
function xesClam(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.6)}><path d="M-12,-2 C-12,-12 -4,-15 0,-15 C4,-15 12,-12 12,-2 Q0,1 -12,-2Z" fill="${p.g('#c8b498', .3, .3)}" stroke="#6b5a48" stroke-width=".7"/><path d="M-12,2 C-12,12 -4,15 0,15 C4,15 12,12 12,2 Q0,-1 -12,2Z" fill="${p.g('#b9a690', .3, .3)}" stroke="#6b5a48" stroke-width=".7"/></g>
        <path d="M-8,-4 Q-6,-11 0,-13 M0,-2 L0,-13 M8,-4 Q6,-11 0,-13 M-8,4 Q-6,11 0,13 M0,2 L0,13 M8,4 Q6,11 0,13" stroke="#8a7660" stroke-width=".7" fill="none" opacity=".7"/>
        <ellipse cx="0" cy="-5" rx="6" ry="3.6" fill="#efc08a" stroke="#c48a52" stroke-width=".5"/><ellipse cx="0" cy="5" rx="6" ry="3.6" fill="#e9b47a" stroke="#c48a52" stroke-width=".5"/></g>`;
}
// artichoke heart cut in half: green outer leaves, pale fan of inner leaves, browned
function xesArtichoke(p, x, y, s, r = 0, { brown = .4, seed = 1 } = {}){
    const k = s / 26;
    const tips = 'M0,13 C-9,13 -13,6 -13,-1 L-12,-6 L-9,-5 L-8,-11 L-4,-8 L0,-14 L4,-8 L8,-11 L9,-5 L12,-6 L13,-1 C13,6 9,13 0,13Z';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${tips}" fill="${p.g('#7e8a36', .3, .3)}" stroke="#4a5218" stroke-width=".7" stroke-linejoin="round"/></g>
        <path d="M-10,-2 L-8,-7 M10,-2 L8,-7 M-6,-4 L-4,-9 M6,-4 L4,-9" stroke="#8a4a5a" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
        <path d="M0,11 C-7,11 -9.5,4 -9,-1 Q-5,-6 0,-9 Q5,-6 9,-1 C9.5,4 7,11 0,11Z" fill="${p.g('#e6dc9a', .3, .2)}"/>
        <path d="M0,10 Q-6,0 -4,-6 M0,10 Q-2,0 0,-8 M0,10 Q2,0 4,-6 M0,10 Q-8,4 -8,-1 M0,10 Q8,4 8,-1" stroke="#b4ad62" stroke-width=".8" fill="none" opacity=".9"/>
        <path d="M-4,4 Q0,-2 4,4 Q2,8 0,8 Q-2,8 -4,4Z" fill="#f4eecc"/>
        <path d="M0,13 L0,18" stroke="#8a9a46" stroke-width="3.4" stroke-linecap="round"/>
        <ellipse cx="4" cy="-3" rx="5" ry="3" fill="#a8641c" opacity="${brown}"/><ellipse cx="-5" cy="5" rx="4" ry="3" fill="#a8641c" opacity="${f1(brown * .8)}"/>
        <path d="M-9,-1 Q-6,-7 -1,-9" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// squid piece in ink (ring or strip, greyish lilac, coated)
function xesSquidInk(p, x, y, s, r = 0, { ringy = true } = {}){
    return ringy
        ? `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .4)}" fill="none" stroke="#1a1418" stroke-width="${f1(s * .26)}"/><ellipse rx="${f1(s / 2)}" ry="${f1(s * .4)}" fill="none" stroke="${p.g('#9c8a96', .3, .3)}" stroke-width="${f1(s * .18)}"/><path d="M${f1(-s * .4)},${f1(-s * .2)} Q${f1(-s * .2)},${f1(-s * .42)} ${f1(s * .1)},${f1(-s * .4)}" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/></g>`
        : `<g ${T(x, y, r)}><rect x="${f1(-s / 2)}" y="${f1(-s * .18)}" width="${s}" height="${f1(s * .36)}" rx="${f1(s * .14)}" fill="${p.g('#8a7884', .3, .3)}" stroke="#1a1418" stroke-width="1.2"/><path d="M${f1(-s * .3)},${f1(-s * .06)} L${f1(s * .3)},${f1(-s * .06)}" stroke="#fff" stroke-width="1" opacity=".5"/></g>`;
}
// whole prawn seen from above, head left (from w_es)
function xesPrawn(p, x, y, s, r = 0, { c = '#e8603a' } = {}){
    const k = s / 40;
    let seg = '';
    for (let i = 0; i < 5; i++){ const sx = -2 + i * 4.4, w = 6.4 - i * .7; seg += `<ellipse cx="${f1(sx)}" cy="0" rx="2.8" ry="${f1(w)}" fill="${p.g(i % 2 ? c : lt(c, .1), .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r, k)}><path d="M-12,-3 Q-30,-16 -34,-30 M-12,3 Q-30,16 -34,30" stroke="${dk(c, .1)}" stroke-width=".9" fill="none" stroke-linecap="round"/>
        <g ${p.sh(.7)}><path d="M18,0 L26,-6 Q29,0 26,6Z" fill="${p.g(dk(c, .05), .2, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>${seg}
        <path d="M-20,0 Q-19,-8 -10,-7.6 L-1,-6.4 Q2,0 -1,6.4 L-10,7.6 Q-19,8 -20,0Z" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .32)}" stroke-width=".6"/></g>
        <circle cx="-16" cy="-5.6" r="1.6" fill="#2a1a14"/><circle cx="-16" cy="5.6" r="1.6" fill="#2a1a14"/>
        <path d="M-14,-3 Q-8,-5 -3,-3.6 M0,-4.2 L16,-3" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// cauliflower floret: cluster of cream curds over a pale stem
function xesCauli(p, x, y, s, r = 0, { seed = 1, c = '#f0e2c0' } = {}){
    const R = rng(p.id + 'xcf' + seed + x);
    const bumps = Array.from({ length: 9 }, (_, i) => { const a = i / 8 * 6.28 + R() * .4, d = i === 8 ? 0 : s * (.24 + R() * .06); return [Math.cos(a) * d, Math.sin(a) * d, s * (.16 + R() * .06)]; });
    const shade = p.def('xcfsh', id => `<radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6a4a1a" stop-opacity=".35"/></radialGradient>`);
    let dots = '';
    for (let i = 0; i < 14; i++) dots += `<circle cx="${f1((R() - .5) * s * .7)}" cy="${f1((R() - .5) * s * .7)}" r="${f1(s * .035)}" fill="${R() < .5 ? '#fffaf0' : dk(c, .15)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}>${bumps.map(([a, b, rr]) => `<circle cx="${f1(a)}" cy="${f1(b)}" r="${f1(rr + .9)}" fill="${dk(c, .3)}"/>`).join('')}</g>
        ${bumps.map(([a, b, rr]) => `<circle cx="${f1(a)}" cy="${f1(b)}" r="${f1(rr)}" fill="${c}"/>`).join('')}
        <circle r="${f1(s * .46)}" fill="url(#${shade})"/>${dots}</g>`;
}
// Swiss chard: dark green crinkled leaf with a broad white rib
function xesChard(p, x, y, s, r = 0, { seed = 1, c = '#3a7a2a' } = {}){
    const R = rng(p.id + 'xcd' + seed + x);
    const pts = ring(s / 2, 12, .3, R, 1.1, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xesSm(pts, true, .8)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .5)},0 Q0,${f1(-s * .06)} ${f1(s * .4)},${f1(s * .02)}" stroke="#eef0d8" stroke-width="${f1(s * .1)}" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-s * .1)},0 l${f1(-s * .1)},${f1(-s * .2)} M${f1(s * .1)},0 l${f1(s * .04)},${f1(-s * .22)} M0,0 l${f1(s * .02)},${f1(s * .22)}" stroke="${lt(c, .3)}" stroke-width=".8" fill="none"/></g>`;
}
// thin green asparagus spear lying flat, tip at the left, griddle marks
function xesAsparagus(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xas' + seed);
    let marks = '';
    for (let i = 0; i < 3; i++){ const mx = -L * .25 + i * L * .22 + R() * 6; marks += `<path d="M${f1(mx - 2)},${f1(-W / 2)} L${f1(mx + 2)},${f1(W / 2)}" stroke="#2a2a10" stroke-width="2" opacity=".55"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f1(-L / 2 + 8)}" y="${f1(-W / 2)}" width="${f1(L - 8)}" height="${W}" rx="${f1(W / 2)}" fill="${p.g('#5a9a34', .3, .3)}" stroke="#2f6a1e" stroke-width=".6"/>
        <path d="M${f1(-L / 2 + 12)},${f1(-W / 2 - .6)} Q${f1(-L / 2 - 2)},0 ${f1(-L / 2 + 12)},${f1(W / 2 + .6)}Z" fill="${p.g('#4a7a2a', .25, .3)}" stroke="#2f5a1a" stroke-width=".6"/></g>
        <path d="M${f1(-L / 2 + 6)},-1 l3,-1.4 M${f1(-L / 2 + 6)},1 l3,1.4 M${f1(-L * .1)},${f1(-W / 2)} l2,1.6 M${f1(L * .2)},${f1(-W / 2)} l2,1.6" stroke="#2f5a1a" stroke-width=".8"/>
        <rect x="${f1(L / 2 - 14)}" y="${f1(-W / 2 + .4)}" width="14" height="${f1(W - .8)}" rx="${f1(W / 2)}" fill="#c8d89a" opacity=".6"/>
        ${marks}<path d="M${f1(-L * .4)},${f1(-W * .2)} L${f1(L * .4)},${f1(-W * .2)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".5"/></g>`;
}
// croqueta: breaded capsule; cut = halved to show the creamy bechamel with ham
function xesCroqueta(p, x, y, L, W, r = 0, { seed = 1, cut = false } = {}){
    const c = '#c98634';
    const body = cut
        ? `<path d="M${f1(-L / 2 + W / 2)},${f1(-W / 2)} L${f1(L / 2)},${f1(-W / 2)} L${f1(L / 2)},${f1(W / 2)} L${f1(-L / 2 + W / 2)},${f1(W / 2)} A${f1(W / 2)},${f1(W / 2)} 0 0 1 ${f1(-L / 2 + W / 2)},${f1(-W / 2)}Z" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .4)}" stroke-width=".8"/>`
        : `<rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${L}" height="${W}" rx="${f1(W / 2)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .4)}" stroke-width=".8"/>`;
    const face = cut ? `<ellipse cx="${f1(L / 2 - 2)}" cy="0" rx="${f1(W * .3)}" ry="${f1(W / 2 - 1.4)}" fill="${p.rg('#f6e8c4', .3, .12)}" stroke="#c98634" stroke-width="1.6"/><circle cx="${f1(L / 2 - 3)}" cy="-3" r="1.2" fill="#d27a7a"/><circle cx="${f1(L / 2)}" cy="3" r="1.1" fill="#c86a6a"/><circle cx="${f1(L / 2 - 4)}" cy="4" r=".9" fill="#d27a7a"/>` : '';
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.crumb(.9)}>${body}</g></g>
        ${K.crumbs(p, 0, 0, L * .7, { n: 10, c: '#e8b45a' })}${face}
        <path d="M${f1(-L * .3)},${f1(-W * .26)} L${f1(L * .2)},${f1(-W * .28)}" stroke="#fff3d6" stroke-width="2" stroke-linecap="round" opacity=".55"/></g>`;
}
// toasted bread slice rubbed with tomato
function xesToast(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xto' + seed);
    const pts = ring(1, 12, .1, R, w / 2, h / 2);
    let holes = '';
    for (let i = 0; i < 10; i++) holes += `<ellipse cx="${f1((R() - .5) * w * .6)}" cy="${f1((R() - .5) * h * .5)}" rx="${f1(1 + R() * 2)}" ry="${f1(.8 + R() * 1.2)}" fill="#a83a1c" opacity=".5"/>`;
    let seeds = '';
    for (let i = 0; i < 8; i++) seeds += `<ellipse cx="${f1((R() - .5) * w * .6)}" cy="${f1((R() - .5) * h * .5)}" rx="1.3" ry=".8" fill="#f2d070"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xesSm(pts, true)}" fill="${p.g('#b06a2a', .3, .3)}" stroke="#7a4214" stroke-width=".7"/></g>
        <path d="${xesSm(pts.map(([a, b]) => [a * .86, b * .82]), true)}" fill="${p.rg('#ecc890', .3, .15)}"/>
        <path ${T(0, 0)} d="${xesSm(ring(1, 11, .3, R, w * .4, h * .36), true)}" fill="#d8402a" opacity=".72"/>
        ${holes}${seeds}
        <path d="M${f1(-w * .3)},${f1(-h * .22)} Q${f1(-w * .1)},${f1(-h * .34)} ${f1(w * .14)},${f1(-h * .3)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// cooked leek lying flat: white base to pale green top, fine lengthwise lines
function xesLeek(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const gid = p.def('xleek', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4f2dc"/><stop offset=".5" stop-color="#dfe8b0"/><stop offset="1" stop-color="#7aa64a"/></linearGradient>`);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${f1(-L / 2)}" y="${f1(-W / 2)}" width="${L}" height="${W}" rx="${f1(W / 2)}" fill="url(#${gid})" stroke="#a8b47a" stroke-width=".7"/></g>
        <path d="M${f1(-L * .42)},${f1(-W * .14)} L${f1(L * .44)},${f1(-W * .16)} M${f1(-L * .4)},${f1(W * .18)} L${f1(L * .44)},${f1(W * .16)}" stroke="#c8d0a0" stroke-width=".8" opacity=".9"/>
        <path d="M${f1(-L * .4)},${f1(-W * .3)} L${f1(L * .3)},${f1(-W * .32)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".75"/></g>`;
}
// egg half stuffed with tuna, tomato and mayonnaise
function xesStuffedEgg(p, x, y, s, r = 0, { seed = 1 } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .36)}" fill="${p.rg('#fffdf6', .1, .14)}" stroke="#d8d0bf" stroke-width=".7"/></g>
        <g ${p.rough(1.8, .25)}><ellipse rx="${f1(s * .38)}" ry="${f1(s * .26)}" fill="${p.g('#e8a272', .3, .3)}"/></g>
        <g ${p.crumb(.8)}><ellipse rx="${f1(s * .32)}" ry="${f1(s * .2)}" fill="#eeb084" opacity=".8"/></g>
        <ellipse cx="${f1(s * .04)}" cy="${f1(-s * .02)}" rx="${f1(s * .12)}" ry="${f1(s * .08)}" fill="${p.rg('#fdf6dc', .2, .1)}" stroke="#e6dcb8" stroke-width=".5"/>
        <circle cx="${f1(-s * .18)}" cy="${f1(s * .08)}" r=".8" fill="#c0321a"/><circle cx="${f1(s * .2)}" cy="${f1(s * .1)}" r=".8" fill="#c0321a"/>
        <ellipse cx="${f1(-s * .32)}" cy="${f1(-s * .2)}" rx="${f1(s * .08)}" ry="${f1(s * .03)}" fill="#fff" opacity=".9"/></g>`;
}
// battered courgette round: golden coating, green skin ring and pale flesh peeking
function xesCourgette(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcz' + seed + x);
    const pts = ring(s / 2, 11, .14, R);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(1.8, .2)}><path d="${xesSm(pts, true)}" fill="${p.g('#e8b44c', .35, .32)}" stroke="#b07a24" stroke-width=".8"/></g></g>
        <circle r="${f1(s * .34)}" fill="none" stroke="#5a8a2e" stroke-width="2.4" opacity=".65"/>
        <circle r="${f1(s * .28)}" fill="#e6dc9a" opacity=".55"/>
        <g ${p.crumb(.6)}><path d="${xesSm(pts.map(([a, b]) => [a * .9, b * .9]), true)}" fill="#f2c45e" opacity=".45"/></g>
        <path d="M${f1(-s * .3)},${f1(-s * .14)} Q${f1(-s * .1)},${f1(-s * .32)} ${f1(s * .14)},${f1(-s * .28)}" stroke="#fff6dc" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// slice of bread soaked in broth (soft, tinted)
function xesSoakedBread(p, x, y, w, h, r = 0, { seed = 1, c = '#e0a868' } = {}){
    const R = rng(p.id + 'xsb' + seed);
    const pts = ring(1, 11, .12, R, w / 2, h / 2);
    let holes = '';
    for (let i = 0; i < 6; i++) holes += `<ellipse cx="${f1((R() - .5) * w * .6)}" cy="${f1((R() - .5) * h * .5)}" rx="${f1(1 + R() * 1.8)}" ry="${f1(.8 + R())}" fill="${dk(c, .25)}" opacity=".6"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xesSm(pts, true)}" fill="${p.g('#c07a36', .2, .3)}" stroke="#7a4214" stroke-width=".8"/></g>
        <path d="${xesSm(pts.map(([a, b]) => [a * .88, b * .84]), true)}" fill="${p.rg(c, .35, .12)}"/>${holes}</g>`;
}
// poached egg floating: white irregular blob with a pale yellow dome under it
function xesPoached(p, x, y, s){
    const R = rng(p.id + 'xpo' + x);
    return `<g ${T(x, y)}><g ${p.sh(1)}><path d="${xesSm(ring(s / 2, 12, .22, R), true)}" fill="${p.rg('#fbf8ee', .2, .12)}" stroke="#e2d8c2" stroke-width=".8"/></g>
        <circle cx="2" cy="1" r="${f1(s * .22)}" fill="${p.rg('#f6c048', .35, .15, .35, .32)}" opacity=".9"/><circle cx="2" cy="1" r="${f1(s * .22)}" fill="#fffaf0" opacity=".3"/>
        <ellipse cx="${f1(-s * .02)}" cy="${f1(-s * .06)}" rx="${f1(s * .08)}" ry="${f1(s * .045)}" fill="#fff" opacity=".85"/></g>`;
}
// fine noodles (fideos) swirling in broth
function xesFideos(p, x, y, R0, { n = 30, c = '#f2d690', seed = 1 } = {}){
    const R = rng(p.id + 'xfd' + seed);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * R0 * .85, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, b = R() * 6.28, L = 10 + R() * 12; d += `M${f1(cx - Math.cos(b) * L / 2)},${f1(cy - Math.sin(b) * L / 2)}q${f1(Math.cos(b + 1.4) * 4)},${f1(Math.sin(b + 1.4) * 4)} ${f1(Math.cos(b) * L)},${f1(Math.sin(b) * L)}`; }
    return `<path d="${d}" stroke="${dk(c, .25)}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/><path d="${d}" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
}
// chunk of cooked tuna / bonito: pinkish beige with flake lines
function xesTunaChunk(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtc' + seed + x);
    const pts = [[-s / 2, -s * .36], [s / 2, -s * .4], [s * .52, s * .36], [-s * .48, s * .4]].map(([a, b]) => [a + (R() - .5) * 4, b + (R() - .5) * 4]);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${xesSm(pts, true, .4)}" fill="${p.g('#d8a888', .3, .3)}" stroke="#9a6a50" stroke-width=".7"/></g>
        <path d="M${f1(-s * .4)},${f1(-s * .1)} Q0,${f1(-s * .2)} ${f1(s * .4)},${f1(-s * .12)} M${f1(-s * .4)},${f1(s * .14)} Q0,${f1(s * .04)} ${f1(s * .42)},${f1(s * .14)}" stroke="#b08a6e" stroke-width=".9" fill="none"/>
        <path d="M${f1(-s * .36)},${f1(-s * .26)} L${f1(s * .2)},${f1(-s * .3)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".6"/></g>`;
}
// big white bean (fabe / alubia)
function xesBean(p, x, y, s, r = 0, { c = '#f1e6cc' } = {}){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 C-10,-8 -4,-8.4 0,-7 C4,-8.4 10,-8 10,0 C10,7 4,8 0,6 C-4,8 -10,7 -10,0Z" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .32)}" stroke-width=".7"/><path d="M-6,-2.6 Q-3,-4.4 1,-3.2" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// flaky white fish chunk with a strip of grey skin
function xesFishChunk(p, x, y, s, r = 0, { c = '#f6f0e2', skin = '#8a8e92', seed = 1 } = {}){
    const R = rng(p.id + 'xfc' + seed + x + y);
    const pts = ring(s / 2, 8, .2, R, 1.2, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${xesSm(pts, true, .7)}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .5)},${f1(s * .22)} Q0,${f1(s * .46)} ${f1(s * .52)},${f1(s * .18)}" stroke="${skin}" stroke-width="${f1(s * .12)}" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-s * .2)},${f1(-s * .3)} q${f1(s * .08)},${f1(s * .2)} 0,${f1(s * .45)} M${f1(s * .08)},${f1(-s * .32)} q${f1(s * .08)},${f1(s * .2)} 0,${f1(s * .45)} M${f1(s * .34)},${f1(-s * .22)} q${f1(s * .06)},${f1(s * .16)} 0,${f1(s * .36)}" stroke="${dk(c, .18)}" stroke-width=".8" fill="none" opacity=".8"/>
        ${xesHi(s, .7, 1.4)}</g>`;
}
// leek round (concentric rings, white to pale green)
function xesLeekRound(p, x, y, s, { c = '#e4ecc4' } = {}){
    return `<g ${T(x, y)}><circle r="${s / 2}" fill="${p.rg(c, .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".6"/><circle r="${f1(s * .34)}" fill="none" stroke="${dk(c, .15)}" stroke-width=".8"/><circle r="${f1(s * .18)}" fill="${lt(c, .2)}" stroke="${dk(c, .15)}" stroke-width=".7"/></g>`;
}
// gratinated cheese / bechamel top: pale gold layer with browned blisters
function xesGratin(p, cx, cy, w, h, { seed = 1, c = '#f4d27a', brown = .8, n = 12 } = {}){
    const R = rng(p.id + 'xgt' + seed);
    let b = '';
    for (let i = 0; i < n; i++) b += `<ellipse cx="${f1(cx + (R() - .5) * w * .8)}" cy="${f1(cy + (R() - .5) * h * .7)}" rx="${f1(2 + R() * w * .05)}" ry="${f1(1.5 + R() * h * .07)}" fill="${R() < .5 ? '#c9822c' : '#a8601c'}" opacity="${f1(brown * (.4 + R() * .5))}"/>`;
    return `<path ${T(cx, cy)} d="${xesSm(ring(1, 12, .12, R, w / 2, h / 2), true)}" fill="${p.rg(c, .25, .2)}" opacity=".95"/><g ${xesBlur(p, 1)}>${b}</g>`;
}
// stew surface with soft blotches
function xesStew(p, R, c, { seed = 1, op = .3, cx = 100, cy = 100 } = {}){
    const Rn = rng(p.id + 'xst' + seed);
    let bl = '';
    for (let i = 0; i < 6; i++){ const a = Rn() * 6.28, d = Math.sqrt(Rn()) * R * .7; bl += `<circle cx="${f1(cx + Math.cos(a) * d)}" cy="${f1(cy + Math.sin(a) * d)}" r="${f1(R * (.15 + Rn() * .15))}" fill="${Rn() < .5 ? lt(c, .2) : dk(c, .2)}" opacity="${op}"/>`; }
    return `${K.liquid(p, { R, c, op: 1, cx, cy, shine: false })}<g ${xesBlur(p, 4)}>${bl}</g>`;
}

// =========================================================
export default {
    // pollo asado: clay oven dish, roast thighs and drumsticks with crisp skin, potatoes, onion, lemon halves, rosemary
    es_pollohorno: p => [
        xesFuente(p, { w: 186, h: 150, base: '#c27a44', inner: '#7a3a18' }),
        xesSauce(p, 100, 100, 156, '#a8601e', { seed: 1, sy: .76 }),
        `<g ${p.sh(.8)}>`,
        ...[[30, 70], [168, 66], [28, 132], [170, 134], [100, 44], [100, 156], [62, 156], [140, 44]].map(([x, y], i) => xesRoastPot(p, x, y, 28, i * 50, { seed: i, c: '#e3a644' })),
        K.onion(p, 56, 44, 22, 20, { c: '#c98a3c' }), K.onion(p, 146, 156, 22, 200, { c: '#c98a3c' }),
        `</g>`,
        xesThigh(p, 70, 86, 60, -10, { seed: 1, c: '#c47426' }), xesThigh(p, 132, 110, 60, 20, { seed: 2, c: '#c47426' }),
        xesDrumstick(p, 128, 70, 70, -15, { c: '#c47e2e' }), xesDrumstick(p, 74, 128, 70, 165, { c: '#c47e2e' }),
        xesLemonSlice(p, 170, 100, 24), xesLemonSlice(p, 30, 101, 22),
        K.sprinkle(p, 100, 100, 140, { c: '#4f6a2a', n: 30, r: 1 }),
    ].join(''),

    // filetes de pechuga empanados: plate, two big thin breaded fillets, lemon wedges, lettuce and tomato
    es_pechugas: p => [
        xesPlate(p, '#2f5f9a'),
        xesLettuce(p, 140, 132, 54, -40, { seed: 1 }), xesLettuce(p, 154, 98, 40, 80, { seed: 2, c: '#94c95a' }),
        K.tomatoWedge(p, 136, 150, 24, -20), K.tomatoWedge(p, 158, 120, 22, 60),
        xesBreaded(p, 86, 76, 104, 58, -18, { seed: 1 }),
        xesBreaded(p, 84, 124, 96, 54, 12, { seed: 2, c: '#d59236' }),
        K.lemon(p, 148, 66, 28, 140), K.lemon(p, 46, 152, 22, 30),
    ].join(''),

    // pollo al chilindron: cazuela, chicken in a thick red pepper and tomato sauce with pepper strips and ham
    es_chilindron: p => [
        xesCazuela(p, { glaze: '#7a3418' }),
        xesStew(p, 74, '#b8321e', { seed: 1 }),
        `<g ${p.sh(.6)}>`,
        ...xesSpots('chl', 12, 60, 16).map(([x, y, r], i) => xesBand(p, x, y, 26, 9, r, { c: i % 3 === 2 ? '#4f8f2c' : '#d8301e', bend: .08, cap: 'butt' })),
        `</g>`,
        xesChicken(p, 72, 78, 52, 20, { seed: 1, c: '#c8803c', ch: .15 }), xesChicken(p, 130, 76, 50, -30, { seed: 2, c: '#c8803c', ch: .15 }), xesChicken(p, 130, 128, 52, 60, { seed: 3, c: '#c8803c', ch: .15 }), xesChicken(p, 72, 126, 48, -60, { seed: 4, c: '#c8803c', ch: .15 }),
        ...[[100, 100], [100, 60], [100, 142], [54, 102], [148, 100]].map(([x, y], i) => xesBand(p, x, y, 30, 9, i * 47, { c: i === 3 ? '#4f8f2c' : '#de3a22', bend: .06, cap: 'butt' })),
        `<path d="M78,98 Q100,90 124,100 M80,58 Q96,52 114,60" stroke="#e05a3a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
        xesHam(p, 112, 96, 9, 20), xesHam(p, 88, 108, 9, -30), xesHam(p, 60, 84, 8, 10), xesHam(p, 144, 118, 8, 50), xesHam(p, 104, 132, 8, 0),
        xesParsley(p, 100, 100, 110, { n: 14 }),
    ].join(''),

    // arroz con pollo: black frying pan, moist saffron rice with chicken pieces, red pepper strips and peas
    es_arrozpollo: p => [
        xesSarten(p),
        `<circle cx="100" cy="100" r="72" fill="${p.rg('#e0a43a', .2, .25)}"/>`,
        xesGrains(p, 100, 100, 70, { c: '#eaae44', n: 460, grain: 3.6, seed: 2 }),
        `<circle cx="100" cy="100" r="70" fill="#d89a30" opacity=".15"/>`,
        xesChicken(p, 76, 76, 34, 20, { seed: 1, c: '#c8863a' }), xesChicken(p, 128, 82, 32, -30, { seed: 2, c: '#c8863a' }), xesChicken(p, 120, 128, 34, 60, { seed: 3, c: '#c8863a' }), xesChicken(p, 72, 124, 30, -60, { seed: 4, c: '#c8863a' }), xesChicken(p, 100, 102, 28, 10, { seed: 5, c: '#c8863a' }),
        ...[[100, 66, 0], [148, 104, 70], [96, 142, -10], [52, 100, 100], [140, 64, -50]].map(([x, y, r]) => xesBand(p, x, y, 24, 6, r, { c: '#d4301f', bend: .1, cap: 'butt' })),
        xesDots(p, 100, 100, 128, { cols: ['#5fa83a', '#4f9a2c'], n: 26, size: 4.6, len: .1, seed: 3 }),
        xesParsley(p, 100, 100, 100, { n: 14 }),
    ].join(''),

    // lomo adobado: plate, orange-red marinated pork loin slices, chips and fried green peppers
    es_lomo: p => {
        const loin = (x, y, s, r) => { const R = rng(p.id + 'lm' + x); const pts = ring(s / 2, 9, .14, R, 1.15, .9);
            return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xesSm(pts, true)}" fill="${p.g('#c25a2a', .28, .38)}" stroke="#7a2c12" stroke-width=".8"/></g>
                <path d="${xesSm(pts.slice(5, 9))}" stroke="#f0caa0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>
                ${[-1, 0, 1].map(i => `<path d="M${f1(-s * .3)},${f1(i * s * .2 - 3)} L${f1(s * .3)},${f1(i * s * .2 + 3)}" stroke="#5a1e0a" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>`).join('')}
                ${K.sprinkle(p, 0, 0, s * .7, { c: '#8a2a10', n: 12, r: .8 })}
                ${xesHi(s, .55, 1.8)}</g>`; };
        return [
            xesPlate(p, '#2f5f9a'),
            `<g ${p.sh(.8)}>`,
            ...xesSpots('lmf', 26, 30, 7, 130, 118).map(([x, y, r], i) => xesFry(p, x, y, 34, 9, r, { seed: i, c: i % 3 ? '#eaae48' : '#e0a03c' })),
            `</g>`,
            loin(66, 92, 52, -10), loin(98, 66, 50, 20), loin(84, 128, 48, 40),
            xesBand(p, 146, 66, 52, 12, -30, { c: '#5a9a2e', bend: .12 }), xesBand(p, 52, 146, 46, 11, 60, { c: '#4f8f28', bend: .14 }),
            `<ellipse cx="128" cy="54" rx="4" ry="2.6" fill="#7aa03a"/>`,
            K.sprinkle(p, 136, 116, 60, { c: '#ffffff', n: 16, r: .9 }),
        ].join('');
    },

    // costillas al horno: oven tray, glazed ribs with bones, roast potatoes, onion
    es_costillas: p => [
        xesFuente(p, { w: 188, h: 140, base: '#6e6a66', inner: '#3e3936' }),
        xesSauce(p, 100, 100, 160, '#7a3612', { seed: 2, sy: .7 }),
        ...[[24, 74], [26, 128], [178, 76], [176, 128], [52, 152], [148, 150], [56, 46], [148, 48]].map(([x, y], i) => xesRoastPot(p, x, y, 26, i * 40, { seed: i, c: '#dea24a' })),
        K.onion(p, 100, 152, 22, 10, { c: '#c07a34' }), K.onion(p, 100, 46, 20, 190, { c: '#c07a34' }),
        xesRack(p, 100, 100, 118, 92, -8),
        K.sprinkle(p, 100, 100, 120, { c: '#4f6a2a', n: 20, r: .9 }),
    ].join(''),

    // arroz al horno: clay cazuela, rice under fanned potato slices, a tomato half and garlic head in the centre, morcilla, ribs, chickpeas
    es_arrozhorno: p => {
        const pots = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.283 + .2; return xesPotSlice(p, 100 + Math.cos(a) * 48, 100 + Math.sin(a) * 48, 30, a * 57.3 + 90, { seed: i, c: '#eec06a', brown: .8 }); }).join('');
        return [
            xesCazuela(p, { glaze: '#8a3f1c' }),
            `<circle cx="100" cy="100" r="74" fill="${p.rg('#d0873a', .2, .3)}"/>`,
            xesGrains(p, 100, 100, 72, { c: '#d9924a', n: 300, grain: 3.8 }),
            `<g ${p.sh(.8)}>${pots}</g>`,
            xesMorcilla(p, 72, 104, 18), xesMorcilla(p, 126, 74, 18), xesMorcilla(p, 118, 132, 17),
            xesChunk(p, 76, 70, 20, 20, '#9a5226', { seed: 1 }), xesChunk(p, 134, 108, 20, -30, '#9a5226', { seed: 2 }), xesChunk(p, 84, 136, 18, 60, '#9a5226', { seed: 3 }),
            ...[[100, 70], [70, 86], [140, 92], [96, 134], [60, 122], [132, 120], [108, 58]].map(([x, y]) => xesChickpea(p, x, y, 10, x)),
            // tomato half and the head of garlic in the middle
            `<g ${p.sh(1)}><circle cx="100" cy="100" r="16" fill="${p.rg('#e9d6b0', .3, .3)}" stroke="#a8875a" stroke-width=".8"/></g>`,
            ...[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * 6.283; return `<ellipse cx="${f1(100 + Math.cos(a) * 8)}" cy="${f1(100 + Math.sin(a) * 8)}" rx="6" ry="4.4" transform="rotate(${f1(a * 57.3)} ${f1(100 + Math.cos(a) * 8)} ${f1(100 + Math.sin(a) * 8)})" fill="${p.g('#f2e2bc', .3, .25)}" stroke="#b8925a" stroke-width=".6"/>`; }),
            `<circle cx="100" cy="100" r="4" fill="#d9b47a"/>`,
            ...[[64, 70, -30], [140, 136, 150]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.8)}><circle r="13" fill="${p.rg('#d6402a', .25, .25)}" stroke="#9a2216" stroke-width=".7"/></g><circle r="9" fill="#e85c3c"/><path d="M0,-8 L0,8 M-8,0 L8,0 M-5.6,-5.6 L5.6,5.6 M5.6,-5.6 L-5.6,5.6" stroke="#f6a080" stroke-width="1.2"/></g>`),
        ].join('');
    },

    // estofado de ternera: cazuela, glossy dark brown gravy, beef chunks, potatoes, carrot, peas
    es_estofado: p => [
        xesCazuela(p, { glaze: '#6e3418', clay: '#b8683a' }),
        xesStew(p, 74, '#5a2810', { seed: 1, op: .3 }),
        ...[[74, 78], [128, 74], [132, 124], [72, 124], [100, 100], [102, 60], [100, 142]].map(([x, y], i) => xesChunk(p, x, y, 32, i * 40, i % 2 ? '#94502c' : '#a45a32', { seed: i, n: 6, k: .45, hi: .7 })),
        K.potato(p, 52, 100, 26, 10, { c: '#e2b46a', seed: 1 }), K.potato(p, 148, 100, 26, 60, { c: '#e2b46a', seed: 2 }), K.potato(p, 102, 122, 22, -30, { c: '#e2b46a', seed: 3 }),
        K.carrotChunk(p, 92, 80, 18, 20), K.carrotChunk(p, 120, 102, 18, -40), K.carrotChunk(p, 84, 146, 16, 60), K.carrotChunk(p, 140, 146, 16, 10), K.carrotChunk(p, 64, 56, 16, -20),
        xesDots(p, 100, 100, 130, { cols: ['#5fa83a', '#4f9a2c'], n: 18, size: 4.6, len: .1, seed: 2 }),
        xesShine('M42,86 A62,62 0 0 1 70,48', 2, .4),
        xesParsley(p, 100, 100, 100, { n: 16 }),
    ].join(''),

    // filetes rusos: plate, three golden flattened meat patties, chips and tomato sauce
    es_filetesrusos: p => {
        const pat = (x, y, w, h, r) => `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2.2, .12)}><ellipse rx="${w / 2}" ry="${h / 2}" fill="${p.g('#b06a2c', .3, .35)}" stroke="#6a3410" stroke-width=".8"/></g></g>
            <g ${p.crumb(.6)}><ellipse rx="${w / 2 - 4}" ry="${h / 2 - 4}" fill="#c27e3a" opacity=".8"/></g>
            <path d="M${-w * .3},${-h * .2} Q${-w * .08},${-h * .4} ${w * .2},${-h * .34}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
        return [
            xesPlate(p, '#2f5f9a'),
            K.pool(p, 108, 120, 92, '#c43a24', { seed: 1, sy: .7 }),
            `<g ${p.sh(.8)}>`,
            ...xesSpots('frr', 24, 28, 7, 128, 76).map(([x, y, r], i) => xesFry(p, x, y, 34, 9, r, { seed: i, c: i % 3 ? '#eaae48' : '#e0a03c' })),
            `</g>`,
            pat(66, 82, 62, 46, -20), pat(70, 132, 62, 46, 15), pat(122, 126, 60, 44, 40),
            xesParsley(p, 80, 100, 50, { n: 8 }),
        ].join('');
    },

    // berenjenas rellenas: white oven dish, two aubergine halves (purple rim) stuffed with meat and tomato, gratinated cheese
    es_berenjenas: p => {
        const half = (x, y, r) => `<g ${T(x, y, r)}><g ${p.sh(1.2)}><path d="M-74,0 C-74,-26 -40,-30 0,-28 C40,-27 76,-22 78,0 C76,22 40,27 0,28 C-40,30 -74,26 -74,0Z" fill="${p.g('#4a2050', .3, .2)}" stroke="#2a1030" stroke-width=".8"/></g>
            <path d="M-68,0 C-68,-21 -38,-24 0,-22.5 C38,-22 70,-18 72,0 C70,18 38,22 0,22.5 C-38,24 -68,21 -68,0Z" fill="#a0442a"/>
            ${xesDots(p, 0, 0, 136, { cols: ['#8a3a1e', '#b8502a', '#6e2e18'], n: 90, size: 4, sy: .3, seed: x })}
            ${xesGratin(p, -2, 0, 116, 30, { seed: y, n: 16 })}
            <path d="M-80,-4 Q-90,-2 -94,4" stroke="#5a7a2a" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M-56,-14 Q-20,-24 30,-20" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
        return [
            xesFuente(p, { w: 188, h: 156, base: '#f4f1ea', inner: '#ece6d8', rim: '#c9c2b4' }),
            half(104, 68, 0), half(100, 132, 180),
            xesParsley(p, 100, 100, 130, { n: 14 }),
        ].join('');
    },
    // bacalao con tomate: cazuela, thick tomato sauce, big white cod chunks with skin, onion, green pepper, black olives
    es_bacalao: p => [
        xesCazuela(p, { glaze: '#7a3418' }),
        xesStew(p, 74, '#c0381e', { seed: 2, op: .3 }),
        ...[[100, 58, 20], [62, 112, -40], [142, 112, 60], [96, 140, 0]].map(([x, y, r], i) => xesBand(p, x, y, 24, 7, r, { c: '#5a9a32', bend: .1, cap: 'butt' })),
        ...[[64, 74, 30], [136, 70, -40], [100, 104, 80]].map(([x, y, r]) => K.onion(p, x, y, 20, r, { c: '#f0d8a8' })),
        xesFishChunk(p, 72, 84, 56, -20, { seed: 1 }), xesFishChunk(p, 130, 80, 54, 30, { seed: 2 }), xesFishChunk(p, 76, 130, 54, 15, { seed: 3 }), xesFishChunk(p, 130, 128, 52, -25, { seed: 4 }),
        ...[[100, 58], [54, 106], [148, 104], [102, 104], [100, 146], [56, 66]].map(([x, y], i) => xesOlive(p, x, y, 13, i * 40, { c: '#2a1e24', pit: true })),
        xesParsley(p, 100, 100, 110, { n: 18 }),
    ].join(''),

    // merluza en salsa verde: cazuela, pale green parsley sauce, hake steaks, open clams, peas
    es_merluzaverde: p => [
        xesCazuela(p, { glaze: '#7a3a1a' }),
        xesStew(p, 74, '#c2c482', { seed: 3, op: .3 }),
        xesHake(p, 76, 80, 52, -20, { seed: 1 }), xesHake(p, 130, 92, 52, 40, { seed: 2 }), xesHake(p, 92, 132, 50, 10, { seed: 3 }),
        ...[[50, 112, 20], [142, 136, -30], [100, 56, 60], [150, 62, -70], [56, 64, 110], [124, 128, 160]].map(([x, y, r]) => xesClam(p, x, y, 24, r)),
        xesDots(p, 100, 100, 132, { cols: ['#6aaa3e', '#58a032'], n: 18, size: 4.6, len: .1, seed: 4 }),
        xesParsley(p, 100, 100, 140, { n: 60 }),
    ].join(''),

    // boquerones fritos: plate, a fan of small floured fried anchovies, lemon wedges
    es_boquerones: p => {
        const pile = xesSpots('boq3', 24, 42, 10).map(([x, y, r], i) => xesAnchovy(p, x, y, 70 - (i % 3) * 5, r));
        return [
            xesPlate(p, '#2f5f9a'),
            ...pile,
            K.lemon(p, 148, 142, 30, -45), K.lemon(p, 56, 58, 26, 135),
            xesParsley(p, 150, 70, 20, { n: 8 }),
        ].join('');
    },

    // dorada al horno: clay oven dish, whole sea bream on sliced potatoes and onion, lemon slices in the slashes
    es_dorada: p => [
        xesFuente(p, { w: 190, h: 150, base: '#c27a44', inner: '#8a4420' }),
        `<g ${p.sh(.7)}>`,
        ...xesSpots('dor', 16, 74, 22, 100, 100, .82).map(([x, y, r], i) => xesPotSlice(p, x, y, 38, r, { seed: i, c: '#efc472', brown: .7 })),
        ...[[40, 60, 20], [160, 140, -30], [150, 50, 70], [44, 140, -60]].map(([x, y, r]) => K.onion(p, x, y, 22, r, { c: '#e8c88a' })),
        `</g>`,
        xesBream(p, 102, 100, 164, -6),
        xesLemonSlice(p, 92, 94, 18), xesLemonSlice(p, 118, 92, 17),
        xesParsley(p, 100, 100, 150, { n: 24 }),
        xesOil(p, 100, 120, 100, { n: 6, op: .5 }),
    ].join(''),

    // fideua: paella pan, short golden noodles standing up, prawns, squid rings, allioli, lemon
    es_fideua: p => [
        xesPaellaPan(p),
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#d58a3a', .2, .3, .45, .45)}"/>`,
        `<g ${xesBlur(p, 3)}><circle cx="100" cy="100" r="74" fill="none" stroke="#8a4a1c" stroke-width="7" opacity=".6"/></g>`,
        xesGrains(p, 100, 100, 76, { c: '#e09a48', n: 300, grain: 3.4, len: 3 }),
        xesGrains(p, 100, 100, 70, { c: '#eeb060', n: 120, grain: 3.4, len: 1.1, seed: 2 }),
        K.squidRing(p, 104, 118, 15, 0), K.squidRing(p, 146, 96, 14, 0), K.squidRing(p, 56, 102, 14, 0), K.squidRing(p, 106, 62, 13, 0), K.squidRing(p, 74, 136, 13, 0),
        xesPrawn(p, 100, 92, 46, 30), xesPrawn(p, 140, 146, 42, -150), xesPrawn(p, 50, 136, 42, 120), xesPrawn(p, 150, 56, 40, -110),
        `<g ${p.sh(.8)}><path ${T(66, 70)} d="${xesSm(ring(14, 9, .35, rng('ali'), 1.2, .8), true)}" fill="${p.rg('#f6e7b4', .3, .12)}" stroke="#d8c084" stroke-width=".6"/></g><path d="M58,66 Q64,60 72,64" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8"/>`,
        K.lemon(p, 140, 114, 28, 20),
        xesParsley(p, 100, 100, 110, { n: 14 }),
    ].join(''),

    // calamares en su tinta: plate, a moulded white rice dome beside glossy black ink sauce with squid
    es_calamares: p => [
        xesPlate(p, '#2f5f9a'),
        xesSauce(p, 116, 104, 120, '#2a2426', { seed: 1, sy: .92 }),
        `<path d="M86,70 Q120,56 156,78" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".35"/>`,
        ...xesSpots('cal', 13, 44, 15, 124, 104).map(([x, y, r], i) => xesSquidInk(p, x, y, i % 3 ? 17 : 22, r, { ringy: i % 3 !== 0 })),
        `<path d="M98,110 Q118,104 140,112 M110,136 Q128,130 146,138" stroke="#5a5054" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`,
        K.rice(p, 66, 92, 74, { sy: .95, grains: .55 }),
        xesParsley(p, 66, 74, 18, { n: 8 }),
    ].join(''),

    // huevos rotos: oval clay dish, a heap of chips, two fried eggs broken over them, thin slices of serrano ham
    es_huevosrotos: p => [
        xesClayPlate(p, { R: 94, clay: '#b8683a', glaze: '#8a4420' }),
        `<g ${p.sh(.8)}>`,
        ...xesSpots('hr', 26, 62, 10.5).map(([x, y, r], i) => xesFry(p, x, y, 38, 10, r, { seed: i, c: i % 3 ? '#eab04c' : '#e2a03c' })),
        `</g>`,
        xesFriedEgg(p, 86, 96, 74, 10, { broken: true }), xesFriedEgg(p, 124, 116, 62, -30, { broken: true }),
        `<path d="M96,108 Q104,124 98,136" stroke="#f6a820" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`,
        xesJamon(p, 64, 66, 46, 22, -30, { seed: 1 }), xesJamon(p, 140, 76, 44, 22, 40, { seed: 2 }), xesJamon(p, 70, 140, 44, 20, 20, { seed: 3 }), xesJamon(p, 146, 140, 38, 18, -50, { seed: 4 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 22, r: .7 }),
    ].join(''),

    // arroz a la cubana: plate, moulded white rice, a fried egg, tomate frito and fried banana halves
    es_cubana: p => {
        const banana = (x, y, r, k = 1) => `<g ${T(x, y, r, k)}><g ${p.sh(.9)}><path d="M-32,-4 C-22,8 22,8 32,-4 C30,4 24,16 0,16 C-24,16 -30,4 -32,-4Z" fill="${p.g('#e2a440', .3, .35)}" stroke="#9a5a14" stroke-width=".8"/></g>
            <path d="M-24,4 C-12,12 12,12 24,4" stroke="#f6dc94" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
            <ellipse cx="-8" cy="9" rx="9" ry="3" fill="#8a4a12" opacity=".4"/><ellipse cx="14" cy="8" rx="6" ry="2.4" fill="#8a4a12" opacity=".35"/></g>`;
        return [
            xesPlate(p, '#2f5f9a'),
            K.pool(p, 100, 138, 110, '#c8341e', { seed: 2, sy: .55 }),
            K.rice(p, 80, 92, 96, { sy: .95, grains: .45 }),
            xesFriedEgg(p, 104, 108, 72, 20),
            banana(134, 58, 20, 1.15), banana(152, 114, 80, 1.15),
        ].join('');
    },

    // menestra de verduras: soup plate, artichoke hearts, green beans, peas, carrot, potato, ham dice and egg quarters
    es_menestra: p => [
        xesSoupPlate(p, { line: '#2f7a5a' }),
        `<circle cx="100" cy="100" r="68" fill="${p.rg('#d6c98a', .2, .25)}"/>`,
        ...xesSpots('mnb', 16, 58, 11).map(([x, y, r], i) => xesBand(p, x, y, 24, 6, r, { c: i % 2 ? '#5a9e36' : '#4e922e', bend: .04 })),
        ...[[100, 100], [72, 74], [130, 76], [66, 124], [134, 126]].map(([x, y], i) => xesArtichoke(p, x, y, 30, i * 70, { seed: i, brown: .2 })),
        K.carrotRound(p, 100, 64, 12), K.carrotRound(p, 108, 128, 12), K.carrotRound(p, 52, 98, 11), K.carrotRound(p, 148, 104, 11), K.carrotRound(p, 86, 90, 10),
        xesDice(p, 120, 100, 12, 20, '#efd28a'), xesDice(p, 88, 146, 11, -20, '#efd28a'), xesDice(p, 144, 82, 11, 10, '#efd28a'),
        xesDots(p, 100, 100, 120, { cols: ['#7ab84a', '#62a63a'], n: 28, size: 4.6, len: .1, seed: 5 }),
        xesHam(p, 110, 84, 9, 10), xesHam(p, 80, 110, 9, -20), xesHam(p, 126, 140, 8, 40), xesHam(p, 60, 84, 8, 0), xesHam(p, 146, 120, 8, 20),
        K.eggHalf(p, 116, 112, 22, -20), K.eggHalf(p, 82, 62, 20, 30),
    ].join(''),

    // patatas a lo pobre: clay plate of soft, slowly fried potato slices with onion and green pepper
    es_patataspobre: p => [
        xesClayPlate(p, { R: 94 }),
        `<g ${p.sh(.7)}>`,
        ...xesSpots('pob', 22, 58, 14).map(([x, y, r], i) => xesPotSlice(p, x, y, 36, r, { seed: i, c: i % 3 ? '#f2cd72' : '#ecc062', brown: .7 })),
        `</g>`,
        ...xesSpots('pbo', 8, 56, 18, 100, 100).map(([x, y, r], i) => K.onion(p, x, y, 18, r, { c: '#efd49a' })),
        ...xesSpots('pbp', 7, 56, 22, 100, 100).map(([x, y, r]) => xesBand(p, x, y, 26, 6, r, { c: '#4f962c', bend: .2 })),
        xesParsley(p, 100, 100, 100, { n: 12 }),
    ].join(''),

    // patatas bravas: white plate with a red rim, crisp potato cubes, spicy red brava sauce and allioli
    es_bravas: p => {
        const R = rng(p.id + 'brs');
        const line = (c, w, pts) => `<path d="${xesSm(pts)}" stroke="${dk(c, .2)}" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round" opacity=".7"/><path d="${xesSm(pts)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
        return [
            xesPlate(p, '#b8322a'),
            `<g ${p.sh(.9)}>`,
            ...xesSpots('brv', 26, 58, 16.5).map(([x, y, r], i) => xesChunk(p, x, y, 24, r, i % 3 ? '#e4a03e' : '#d8902e', { seed: i, n: 6, j: .25, k: .3, sy: .9, hi: .75 })),
            `</g>`,
            line('#d0381e', 5.5, [[48, 70], [80, 60], [100, 84], [128, 64], [152, 86], [130, 112], [100, 104], [70, 120], [56, 100]]),
            line('#d0381e', 5, [[60, 140], [90, 128], [118, 146], [146, 128]]),
            line('#fbf3dc', 3.4, [[54, 86], [80, 96], [104, 120], [132, 100], [146, 112], [122, 132], [92, 144], [70, 132]]),
        ].join('');
    },

    // pipirrana: green-glazed bowl of finely diced tomato, green pepper, cucumber and onion with tuna, egg and olive oil
    es_pipirrana: p => [
        xesBowl(p, '#3e7a3a', '#f6f1e2'),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#b8402a', .1, .3)}"/>`,
        ...xesSpots('pip', 90, 70, 8.6).map(([x, y, r], i) => { const t = i % 7; return t < 3 ? xesDice(p, x, y, 12.5, r, '#e0412c') : t === 3 ? xesDice(p, x, y, 11.5, r, '#5aa034') : t === 4 ? xesDice(p, x, y, 12, r, '#e8f0c4', { skin: '#3e7a2a' }) : t === 5 ? xesDice(p, x, y, 11, r, '#f4eee2') : xesDice(p, x, y, 12.5, r, '#d63a26'); }),
        xesTuna(p, 86, 92, 30, { seed: 1 }), xesTuna(p, 122, 116, 26, { seed: 2 }),
        xesEggSlice(p, 118, 80, 18, 20), xesEggSlice(p, 80, 124, 18, -20),
        xesOil(p, 100, 100, 110, { n: 9, op: .6 }),
    ].join(''),

    // escalivada: long plate, wide glossy strips of roasted red pepper and aubergine with soft onion, olive oil
    es_escalivada: p => {
        const strip = (x, y, L, W, r, c, edge, seed, char = 0) => { const R = rng(p.id + 'esc' + seed); const pts = ring(1, 12, .16, R, L / 2, W / 2);
            let ch = ''; for (let i = 0; i < 3 * char; i++) ch += `<ellipse cx="${f1((R() - .5) * L * .7)}" cy="${f1((R() - .5) * W * .5)}" rx="${f1(2 + R() * 3)}" ry="${f1(1 + R() * 1.4)}" fill="#2a0e08" opacity=".45"/>`;
            return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${xesSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${edge}" stroke-width="${edge === '#3a1a40' ? 2.6 : 1}"/></g>${ch}
            <path d="M${f1(-L * .36)},${f1(-W * .16)} Q0,${f1(-W * .34)} ${f1(L * .32)},${f1(-W * .14)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`; };
        return [
            K.longPlate(p, { w: 190, h: 150 }),
            ...[0, 1, 2].map(i => strip(64, 52 + i * 21, 92, 24, -12 + i * 4, '#9a6a3c', '#3a1a40', 10 + i)),
            ...[0, 1, 2].map(i => strip(136, 56 + i * 22, 86, 24, 10 - i * 4, i % 2 ? '#c8281c' : '#d8361e', '#8a1810', i, 1)),
            ...[0, 1].map(i => strip(66, 120 + i * 20, 92, 22, 6 - i * 6, i ? '#d8301c' : '#c42418', '#8a1810', 20 + i, 1)),
            ...[0, 1].map(i => strip(138, 124 + i * 20, 84, 20, -6 + i * 8, '#a8743e', '#3a1a40', 30 + i)),
            ...[[100, 96], [104, 150], [98, 52]].map(([x, y], i) => K.onion(p, x, y, 24, i * 60 + 90, { c: '#dcb26a' })),
            xesOil(p, 100, 100, 130, { n: 10, op: .5 }),
            K.sprinkle(p, 100, 100, 130, { c: '#fff', n: 16, r: .9 }),
            xesParsley(p, 100, 100, 120, { n: 10 }),
        ].join('');
    },

    // zanahorias alinadas: honey-glazed bowl of boiled carrot rounds with garlic, cumin, oregano and pimenton
    es_zanahorias: p => [
        xesBowl(p, '#c58a2c', '#f8f0dc'),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#e2a050', .2, .3)}"/>`,
        `<g ${p.sh(.6)}>${xesSpots('zan', 30, 64, 14.5).map(([x, y]) => K.carrotRound(p, x, y, 22, { c: '#ef7e2c' })).join('')}</g>`,
        ...xesSpots('zan2', 14, 58, 18).map(([x, y]) => K.carrotRound(p, x, y, 21, { c: '#f28a36' })),
        ...[[90, 90], [118, 112], [74, 122], [124, 74]].map(([x, y], i) => xesGarlic(p, x, y, 7, i * 40, { fried: 0 })),
        K.sprinkle(p, 100, 100, 120, { c: '#5a7a2a', n: 30, r: .8 }),
        xesPimenton(p, 100, 100, 110, 30),
        xesOil(p, 100, 100, 100, { n: 7, op: .5 }),
    ].join(''),

    // alcachofas salteadas con jamon: clay plate, golden sauteed artichoke halves with diced ham and lemon
    es_alcachofas: p => [
        xesClayPlate(p, { R: 94, clay: '#c8784a', glaze: '#9a4a22' }),
        ...xesSpots('alc', 11, 50, 30).map(([x, y, r], i) => xesArtichoke(p, x, y, 48, r, { seed: i, brown: .7 })),
        ...xesSpots('alh', 12, 60, 14, 100, 100).map(([x, y, r]) => xesHam(p, x, y, 9, r)),
        K.lemon(p, 148, 142, 28, -40),
        xesParsley(p, 100, 100, 110, { n: 14 }),
    ].join(''),

    // coliflor al ajoarriero: celadon bowl, cauliflower florets in orange garlic and pimenton oil, golden garlic
    es_coliflor: p => [
        K.kobachi(p, { glaze: '#4e7a8a', inside: '#f4f0e6' }),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#b8622a', .2, .3)}"/>`,
        ...[[100, 100], ...[0, 1, 2, 3, 4, 5].map(i => [100 + Math.cos(i * 1.047 + .3) * 42, 100 + Math.sin(i * 1.047 + .3) * 42])].map(([x, y], i) => xesCauli(p, x, y, 46, i * 50, { seed: i, c: i % 2 ? '#f0dcb4' : '#f2e4c4' })),
        `<g ${xesBlur(p, 3)}>${xesSpots('colo', 10, 54, 18).map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="#e0701a" opacity=".35"/>`).join('')}</g>`,
        ...xesSpots('cog', 10, 56, 14).map(([x, y, r]) => xesGarlic(p, x, y, 8, r, { fried: .7 })),
        xesPimenton(p, 100, 100, 110, 60),
        xesOil(p, 100, 100, 110, { n: 12, op: .6, c: '#e8802a' }),
        xesParsley(p, 100, 100, 100, { n: 12 }),
    ].join(''),

    // berenjenas con miel: white plate, crisp battered aubergine sticks drizzled with dark cane honey
    es_berenjenasmiel: p => {
        const drz = pts => `<path d="${xesSm(pts)}" stroke="#3a1a08" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/><path d="${xesSm(pts)}" stroke="#7a3a12" stroke-width="2" fill="none" stroke-linecap="round"/>`;
        return [
            xesPlate(p, '#2f5f9a'),
            ...xesSpots('bm', 15, 44, 15).map(([x, y, r], i) => xesBattered(p, x, y, 48, 17, r, { seed: i, c: '#e8b44c' })),
            drz([[48, 80], [76, 62], [100, 90], [130, 60], [152, 88], [126, 112], [96, 104], [70, 128], [52, 110]]),
            drz([[66, 146], [96, 132], [124, 150], [150, 128]]),
            K.sprinkle(p, 100, 100, 110, { c: '#fff', n: 14, r: 1 }),
        ].join('');
    },

    // esparragos trigueros a la plancha: long plate, thin griddled green asparagus with char marks, coarse salt, lemon
    es_esparragos: p => [
        K.longPlate(p, { w: 190, h: 140, base: '#f4f1ea' }),
        ...Array.from({ length: 13 }, (_, i) => xesAsparagus(p, 94, 48 + i * 8.6, 150, i % 2 ? 7 : 6.4, -6 + (i % 3) * 2, { seed: i })),
        xesLemonSlice(p, 164, 138, 26),
        K.sprinkle(p, 96, 100, 130, { c: '#fff', n: 30, r: 1.2 }),
        xesOil(p, 96, 100, 110, { n: 6, op: .45 }),
    ].join(''),

    // acelgas con patatas: soup plate, Swiss chard leaves with white stalks, potato chunks, garlic and pimenton oil
    es_acelgas: p => [
        xesSoupPlate(p, { line: '#c5862c' }),
        `<circle cx="100" cy="100" r="68" fill="${p.rg('#4a6a26', .2, .3)}"/>`,
        ...xesSpots('acg', 14, 50, 20).map(([x, y, r], i) => xesChard(p, x, y, 42, r, { seed: i, c: i % 2 ? '#2f6a22' : '#3a7a2a' })),
        ...[[70, 74], [130, 82], [104, 130], [62, 118], [138, 124], [100, 96]].map(([x, y], i) => K.potato(p, x, y, 22, i * 50, { c: '#ecc77c', seed: i })),
        ...xesSpots('acs', 10, 56, 18).map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-8" y="-3" width="16" height="6" rx="2" fill="${p.g('#f2f0dc', .3, .2)}" stroke="#c8c8a0" stroke-width=".5"/></g>`),
        ...[[96, 74], [120, 110], [76, 102]].map(([x, y], i) => xesGarlic(p, x, y, 8, i * 50, { fried: .6 })),
        xesOil(p, 100, 100, 110, { n: 9, op: .6, c: '#e0802a' }),
    ].join(''),

    // guisantes con jamon: small cazuela packed with bright peas, diced serrano ham and soft onion
    es_guisantes: p => [
        xesCazuela(p, { R: 84, glaze: '#7a3a1a' }),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#6a8a2a', .2, .3)}"/>`,
        xesDots(p, 100, 100, 146, { cols: ['#6cb43e', '#5aa232', '#7cc24a'], n: 220, size: 7.6, len: .1, seed: 1 }),
        ...xesSpots('gso', 8, 58, 18).map(([x, y, r]) => K.onion(p, x, y, 16, r, { c: '#efe0a8' })),
        ...xesSpots('gsh', 13, 60, 16).map(([x, y, r]) => xesHam(p, x, y, 12, r)),
        xesShine('M42,86 A62,62 0 0 1 70,48', 2, .4),
    ].join(''),

    // croquetas de jamon: plate of golden breaded croquettes, one cut open to the creamy bechamel with ham
    es_croquetas: p => [
        xesPlate(p, '#2f5f9a'),
        ...[[68, 62, -20], [114, 56, 15], [152, 100, 80], [54, 104, 70], [98, 94, -10], [64, 146, 20], [112, 136, -30], [86, 122, 60]].map(([x, y, r], i) => xesCroqueta(p, x, y, 52, 27, r, { seed: i })),
        xesCroqueta(p, 146, 58, 34, 27, 100, { seed: 9, cut: true }),
        `<g ${T(152, 148, 30)}>${K.mitsuba(p, 0, 0, 24)}</g>`,
    ].join(''),

    // pan con tomate: wooden board, toasted bread slices rubbed with ripe tomato and olive oil, some with serrano ham
    es_pantumaca: p => [
        xesBoard(p),
        xesToast(p, 62, 66, 84, 56, -8, { seed: 1 }), xesToast(p, 140, 72, 80, 54, 10, { seed: 2 }),
        xesToast(p, 60, 134, 82, 56, 8, { seed: 3 }), xesToast(p, 138, 136, 84, 56, -6, { seed: 4 }),
        xesJamon(p, 134, 70, 58, 30, -10, { seed: 1 }), xesJamon(p, 62, 136, 56, 30, 14, { seed: 2 }),
        `<g ${T(100, 104)}><g ${p.sh(1)}><circle r="14" fill="${p.rg('#d8402a', .25, .25)}" stroke="#9a2216" stroke-width=".7"/></g><circle r="10.4" fill="#e85c3c"/><path d="M0,-9 L0,9 M-9,0 L9,0 M-6,-6 L6,6 M6,-6 L-6,6" stroke="#f6a080" stroke-width="1.2"/></g>`,
        K.sprinkle(p, 100, 100, 150, { c: '#fff', n: 18, r: 1 }),
    ].join(''),

    // aceitunas alinadas: ochre clay bowl of green olives with garlic, lemon, onion, red pepper and herbs
    es_aceitunas: p => [
        xesBowl(p, '#c9973e', '#f2e6c8'),
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#8a8a3a', .2, .3)}"/>`,
        ...xesSpots('ace', 34, 64, 15).map(([x, y, r], i) => xesOlive(p, x, y, 24, r, { c: i % 4 === 0 ? '#9aa43e' : i % 4 === 1 ? '#7f8e2e' : '#8e9a36' })),
        ...[[86, 92, 20], [124, 120, -30], [70, 132, 60], [130, 70, 10]].map(([x, y, r]) => xesClove(p, x, y, 16, r)),
        xesLemonSlice(p, 112, 96, 24), xesLemonSlice(p, 66, 72, 20),
        ...[[100, 140, 20], [146, 100, -60]].map(([x, y, r]) => xesBand(p, x, y, 22, 5, r, { c: '#d4301f', bend: .1 })),
        ...[[96, 120, 30], [140, 132, -40], [58, 104, 80]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-12,0 L12,0" stroke="#6a7a3a" stroke-width="1" />${[-8, -4, 0, 4, 8].map(t => `<ellipse cx="${t}" cy="-2" rx="2" ry="1.2" fill="#5a7a34"/><ellipse cx="${t + 2}" cy="2" rx="2" ry="1.2" fill="#6a8a3a"/>`).join('')}</g>`),
        xesOil(p, 100, 100, 110, { n: 8, op: .5 }),
    ].join(''),

    // ensalada de garbanzos: Talavera-blue bowl, chickpeas with diced tomato, peppers, onion, tuna and egg
    es_ensaladagarbanzos: p => [
        xesBowl(p, '#2a4f8c', '#f6f1e6'),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#c8a466', .2, .3)}"/>`,
        ...xesSpots('egc', 44, 68, 13).map(([x, y, r]) => xesChickpea(p, x, y, 14.5, r)),
        ...xesSpots('egd', 30, 64, 13, 100, 100).map(([x, y, r], i) => { const t = i % 5; return xesDice(p, x, y, 9.6, r, t < 2 ? '#e0412c' : t === 2 ? '#5aa034' : t === 3 ? '#d4301f' : '#efe6f0'); }),
        xesTuna(p, 102, 100, 30, { seed: 2 }),
        K.eggHalf(p, 72, 76, 26, 30), K.eggHalf(p, 132, 128, 26, -20),
        xesParsley(p, 100, 100, 120, { n: 20 }),
        xesOil(p, 100, 100, 100, { n: 6, op: .5 }),
    ].join(''),

    // puerros a la vinagreta: long plate, tender whole leeks under a vinaigrette of chopped egg, red pepper and onion
    es_puerros: p => [
        K.longPlate(p, { w: 190, h: 140 }),
        ...[0, 1, 2, 3, 4].map(i => xesLeek(p, 98, 52 + i * 24, 156, 21, -3 + i * 1.5, { seed: i })),
        `<g ${xesBlur(p, 2)}><path d="M30,100 Q100,80 170,104" stroke="#e8d070" stroke-width="18" fill="none" opacity=".35"/></g>`,
        ...xesSpots('pud', 34, 66, 7, 100, 100, .65).map(([x, y, r], i) => { const t = i % 4; return xesDice(p, x, y, t === 0 ? 6 : 5.4, r, t === 0 ? '#fffbe8' : t === 1 ? '#f6c23a' : t === 2 ? '#d4301f' : '#f0eaf0'); }),
        xesParsley(p, 100, 100, 120, { n: 20 }),
        xesOil(p, 100, 100, 120, { n: 6, op: .45 }),
    ].join(''),

    // repollo rehogado: plate of soft sauteed cabbage with potato, bacon pieces, golden garlic and pimenton
    es_repollo: p => [
        xesPlate(p, '#2f5f9a'),
        ...xesSpots('rep', 22, 56, 15).map(([x, y, r], i) => K.leafPiece(p, x, y, 32, r, { c: i % 2 ? '#b8d88a' : '#a8cc78', vein: '#eef4d4', seed: i, cooked: true })),
        ...[[72, 80], [128, 76], [100, 122], [66, 126], [138, 124]].map(([x, y], i) => K.potato(p, x, y, 22, i * 60, { c: '#ecc77c', seed: i })),
        ...xesSpots('rpb', 8, 54, 22).map(([x, y, r]) => K.bacon(p, x, y, 16, 9, r)),
        ...xesSpots('rpg', 8, 56, 16).map(([x, y, r]) => xesGarlic(p, x, y, 8, r, { fried: .7 })),
        xesPimenton(p, 100, 100, 110, 30),
    ].join(''),

    // huevos rellenos: Talavera plate on lettuce, stuffed egg halves with tuna filling, mayonnaise and olive slices
    es_huevosrellenos: p => [
        xesTalavera(p),
        xesLettuce(p, 100, 100, 120, 10, { seed: 1, c: '#a6d468' }),
        xesLettuce(p, 96, 104, 96, 70, { seed: 2, c: '#94c95a' }),
        ...[[70, 74, -20], [114, 66, 10], [148, 98, 80], [62, 118, 70], [106, 108, 0], [92, 146, -10], [136, 138, 30]].map(([x, y, r], i) => xesStuffedEgg(p, x, y, 42, r, { seed: i })),
        ...[[92, 90], [128, 120], [80, 132], [140, 70]].map(([x, y], i) => xesOlive(p, x, y, 11, i * 40, { c: '#2a1e24', pit: true })),
    ].join(''),

    // pure de patatas: cream bowl, smooth mashed potato with spoon swirls, a little olive oil, pepper and parsley
    es_pure: p => [
        xesBowl(p, '#e0d6c0', '#f8f3e8'),
        `<g ${p.sh(1)}><circle cx="100" cy="100" r="76" fill="${p.rg('#f6e2a6', .4, .2, .38, .36)}"/></g>`,
        xesSwirl(p, 100, 100, 60, '#fcefc4', 5),
        `<path d="M50,90 Q60,70 84,62 M118,140 Q140,132 150,112" stroke="#e8cc84" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
        `<g ${xesBlur(p, 1.5)}><ellipse cx="104" cy="96" rx="14" ry="10" fill="#f0c430" opacity=".55"/></g>`,
        xesOil(p, 104, 96, 30, { n: 4, op: .6 }),
        xesPepper(p, 100, 100, 110, 30),
        xesParsley(p, 104, 98, 30, { n: 8 }),
    ].join(''),

    // calabacin rebozado: plate of golden battered courgette rounds with green rims, lemon
    es_calabacin: p => [
        xesPlate(p, '#2f5f9a'),
        ...xesSpots('cbz', 14, 50, 24).map(([x, y, r], i) => xesCourgette(p, x, y, 34, r, { seed: i })),
        K.lemon(p, 150, 146, 30, -40),
        K.sprinkle(p, 100, 100, 110, { c: '#fff', n: 14, r: 1 }),
    ].join(''),

    // salmorejo: white bowl, thick matte orange-pink tomato cream topped with chopped egg, serrano ham and a thread of olive oil
    es_salmorejo: p => [
        xesBowl(p, '#f4f0e6', '#fbf9f3'), `<circle cx="100" cy="100" r="86" fill="none" stroke="#2f5f9a" stroke-width="2"/>`,
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#e2683a', .25, .25)}"/>`,
        `<g ${xesBlur(p, 3)}><circle cx="86" cy="84" r="34" fill="#f08a5a" opacity=".45"/></g>`,
        `<path d="M44,98 Q70,80 100,96 T156,92 M52,124 Q80,110 110,124 T150,118" stroke="#d0582c" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>`,
        `<g ${p.sh(.6)}>`,
        ...xesSpots('slh', 30, 46, 10, 100, 104, .8).map(([x, y, r], i) => i % 2 ? xesHam(p, x, y, 13, r) : xesDice(p, x, y, 12, r, i % 4 === 0 ? '#f6c23a' : '#fbf8ee')),
        `</g>`,
        `<path d="M50,72 Q80,60 100,70 T150,76" stroke="#e6c13a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`,
        xesOil(p, 100, 100, 120, { n: 6, op: .7 }),
        xesShine('M44,88 A58,58 0 0 1 76,46', 2, .4),
    ].join(''),

    // ajoblanco: cobalt bowl, milky white almond and garlic soup with green grape halves, almond slivers and olive oil
    es_ajoblanco: p => [
        xesBowl(p, '#2a4f8c', '#f6f2e8'),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#f2ede0', .3, .14)}"/>`,
        ...xesSpots('ajg', 9, 40, 20, 106, 104).map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="9" ry="7.6" fill="${p.rg('#b8d06a', .3, .2)}" stroke="#7a9a34" stroke-width=".7"/></g><ellipse rx="5" ry="3.6" fill="#dcebaa" opacity=".8"/><ellipse cx="-3" cy="-3" rx="2.4" ry="1.2" fill="#fff" opacity=".8"/></g>`),
        ...xesSpots('aja', 8, 50, 14).map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-5" y="-1.6" width="10" height="3.2" rx="1.4" fill="#f2e2c0" stroke="#c8a878" stroke-width=".5"/></g>`),
        xesOil(p, 100, 100, 120, { n: 12, op: .75 }),
        xesShine('M44,88 A58,58 0 0 1 76,46', 2, .4),
    ].join(''),

    // sopa castellana: clay cazuelita, brick-red paprika and garlic broth with soaked bread, a poached egg, ham and parsley
    es_sopaajo: p => [
        xesCazuela(p, { R: 84, glaze: '#7a3418' }),
        xesStew(p, 74, '#b8542a', { seed: 5, op: .3 }),
        ...[[66, 72, -20], [136, 74, 30], [62, 128, 20], [136, 128, -30], [100, 56, 0], [100, 146, 10]].map(([x, y, r], i) => xesSoakedBread(p, x, y, 46, 30, r, { seed: i, c: '#e8b070' })),
        xesPoached(p, 100, 100, 46),
        ...xesSpots('saj', 10, 60, 14).map(([x, y, r]) => xesHam(p, x, y, 9, r)),
        ...[[84, 82], [122, 116], [76, 112]].map(([x, y], i) => xesGarlic(p, x, y, 8, i * 50, { fried: .8 })),
        xesOil(p, 100, 100, 130, { n: 8, op: .55, c: '#d8742a' }),
        xesParsley(p, 100, 100, 120, { n: 18 }),
    ].join(''),

    // sopa de fideos: soup plate, clear golden chicken broth with fine noodles, shredded chicken, carrot and parsley
    es_sopafideos: p => [
        xesSoupPlate(p),
        K.liquid(p, { R: 68, c: '#e2b45a', op: .95 }),
        `<circle cx="100" cy="100" r="68" fill="#f0c96a" opacity=".25"/>`,
        xesFideos(p, 100, 100, 58, { n: 34 }),
        ...xesSpots('sfc', 9, 50, 16).map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M-9,-2.4 Q0,-4 9,-1.6 L8,2.6 Q0,4 -9,2Z" fill="${p.g('#f2e2c2', .3, .25)}" stroke="#c8a87a" stroke-width=".5"/></g><path d="M-6,-1 L6,0 M-5,1.4 L5,1.6" stroke="#d8c09a" stroke-width=".6"/></g>`),
        ...xesSpots('sfd', 10, 54, 14).map(([x, y, r]) => xesDice(p, x, y, 7, r, '#ef7f30')),
        xesOil(p, 100, 100, 110, { n: 10, op: .5 }),
        xesParsley(p, 100, 100, 110, { n: 22 }),
    ].join(''),

    // cocido madrileno: clay olla, golden broth with chickpeas, beef, chorizo, tocino, potato, carrot and cabbage
    es_cocido: p => [
        xesOlla(p),
        K.liquid(p, { R: 68, c: '#d9a85a', op: 1, shine: false }),
        ...xesSpots('cch', 38, 62, 11.5).map(([x, y, r]) => xesChickpea(p, x, y, 13, r)),
        K.leafPiece(p, 70, 70, 34, 20, { c: '#b8d488', cooked: true, seed: 1 }), K.leafPiece(p, 132, 134, 30, -40, { c: '#b8d488', cooked: true, seed: 2 }),
        xesChunk(p, 108, 76, 34, 20, '#8a5434', { seed: 1, n: 6, hi: .6 }), xesChunk(p, 72, 118, 30, -40, '#8a5434', { seed: 2, n: 6, hi: .6 }),
        `<g ${T(134, 98, 20)}><g ${p.sh(.9)}><rect x="-14" y="-9" width="28" height="18" rx="4" fill="${p.g('#f6ece0', .3, .2)}" stroke="#c8b49a" stroke-width=".6"/></g><rect x="-13" y="2" width="26" height="5" rx="2" fill="#d88a7a"/></g>`,
        xesChorizo(p, 100, 104, 22), xesChorizo(p, 146, 70, 20), xesChorizo(p, 104, 140, 20), xesMorcilla(p, 62, 88, 18),
        K.potato(p, 64, 146, 24, 20, { c: '#ecc77c', seed: 2 }), K.potato(p, 150, 128, 22, -20, { c: '#ecc77c', seed: 3 }),
        K.carrotChunk(p, 82, 64, 18, 30), K.carrotChunk(p, 128, 120, 18, -30), K.carrotChunk(p, 50, 112, 16, 70),
        xesOil(p, 100, 100, 120, { n: 8, op: .45 }),
    ].join(''),

    // fabada asturiana: cazuela, creamy orange broth with big white fabes, chorizo, morcilla and panceta
    es_fabada: p => [
        xesCazuela(p, { glaze: '#7a3418' }),
        xesStew(p, 74, '#c8642a', { seed: 6, op: .25 }),
        ...xesSpots('fab', 46, 68, 14).map(([x, y, r], i) => xesBean(p, x, y, 21, r, { c: i % 3 ? '#f0dcb6' : '#e8d0a4' })),
        `<g ${xesBlur(p, 3)}><circle cx="100" cy="100" r="66" fill="none" stroke="#d26a2a" stroke-width="14" opacity=".35"/></g>`,
        xesChorizo(p, 78, 84, 30), xesChorizo(p, 124, 122, 28), xesMorcilla(p, 126, 78, 30), xesMorcilla(p, 76, 128, 26),
        `<g ${T(102, 104, -15)}><g ${p.sh(1)}><rect x="-17" y="-11" width="34" height="22" rx="5" fill="${p.g('#f2dccc', .3, .2)}" stroke="#c09a82" stroke-width=".6"/></g><rect x="-16" y="-3" width="32" height="5" rx="2" fill="#c86a5a"/><rect x="-16" y="5" width="32" height="3" rx="1" fill="#d88a7a"/></g>`,
        xesOil(p, 100, 100, 130, { n: 10, op: .6, c: '#e0702a' }),
    ].join(''),

    // caldo gallego: brown clay cunca, pale broth with turnip greens, potatoes, white beans and a little chorizo
    es_caldogallego: p => [
        xesBowl(p, '#8a5a2e', '#efe2c8'),
        K.liquid(p, { R: 76, c: '#d0b880', op: 1 }),
        `<circle cx="100" cy="100" r="66" fill="#c8b074" opacity=".3"/>`,
        ...xesSpots('cgg', 8, 54, 24).map(([x, y, r], i) => K.greens(p, x, y, 40, { c: i % 2 ? '#2f6a22' : '#3a7a2a', stems: '#8ab05a', n: 5, seed: i, sy: .9 })),
        ...[[100, 100], [70, 70], [130, 126], [62, 128], [136, 70]].map(([x, y], i) => K.potato(p, x, y, 26, i * 50, { c: '#ecd08e', seed: i })),
        ...xesSpots('cgb', 14, 60, 13).map(([x, y, r]) => xesBean(p, x, y, 14, r)),
        xesChorizo(p, 100, 64, 22, { half: true, r: 20 }), xesChorizo(p, 96, 140, 22, { half: true, r: -30 }), xesChorizo(p, 150, 100, 20, { half: true, r: 80 }),
        xesOil(p, 100, 100, 110, { n: 8, op: .5 }),
    ].join(''),

    // potaje de vigilia: clay cazuela, ochre chickpea stew with spinach, flakes of salt cod and hard-boiled egg
    es_potaje: p => [
        xesCazuela(p, { glaze: '#6e3418', clay: '#b0603a' }),
        xesStew(p, 74, '#b87a34', { seed: 7, op: .3 }),
        ...xesSpots('ptg', 10, 56, 22).map(([x, y], i) => K.greens(p, x, y, 36, { c: '#2c6420', stems: '#5a8a32', n: 5, seed: i, sy: .9 })),
        ...xesSpots('ptc', 36, 64, 11.5).map(([x, y, r]) => xesChickpea(p, x, y, 13, r)),
        xesFishChunk(p, 78, 84, 30, 20, { seed: 1, skin: '#b8b0a0' }), xesFishChunk(p, 126, 120, 28, -30, { seed: 2, skin: '#b8b0a0' }), xesFishChunk(p, 128, 74, 26, 50, { seed: 3, skin: '#b8b0a0' }),
        K.eggHalf(p, 98, 108, 30, 20), K.eggHalf(p, 70, 130, 26, -30),
        xesOil(p, 100, 100, 120, { n: 8, op: .5, c: '#d8902a' }),
    ].join(''),

    // marmitako: clay olla, red-orange pepper and tomato broth with chunks of bonito, cracked potatoes, green pepper
    es_marmitako: p => [
        xesOlla(p, { clay: '#a85a34' }),
        xesStew(p, 68, '#c4602a', { seed: 8, op: .3 }),
        ...[[72, 74], [130, 76], [100, 110], [62, 122], [140, 122], [100, 62]].map(([x, y], i) => K.potato(p, x, y, 30, i * 50, { c: '#e8b664', seed: i })),
        ...[[100, 82, 20], [76, 100, -40], [124, 102, 60], [96, 136, 10]].map(([x, y, r], i) => xesTunaChunk(p, x, y, 32, r, { seed: i })),
        ...xesSpots('mmp', 8, 54, 16).map(([x, y, r]) => xesBand(p, x, y, 16, 5, r, { c: '#4f962c', bend: .1, cap: 'butt' })),
        xesOil(p, 100, 100, 110, { n: 8, op: .5, c: '#e0802a' }),
        xesParsley(p, 100, 100, 110, { n: 20 }),
    ].join(''),

    // sopa de pescado y marisco: soup plate, orange broth with prawns, clams, chunks of hake and parsley
    es_sopapescado: p => [
        xesSoupPlate(p, { line: '#2f5f9a' }),
        K.liquid(p, { R: 68, c: '#d4773a', op: 1 }),
        `<circle cx="100" cy="100" r="58" fill="#e08a4a" opacity=".3"/>`,
        xesFishChunk(p, 80, 88, 30, 20, { seed: 1 }), xesFishChunk(p, 122, 120, 28, -30, { seed: 2 }), xesFishChunk(p, 98, 122, 24, 60, { seed: 3 }),
        ...[[64, 120, 20], [138, 86, -40], [100, 60, 80], [60, 82, 140], [140, 128, 10]].map(([x, y, r]) => xesClam(p, x, y, 22, r)),
        xesPrawn(p, 110, 86, 42, 30), xesPrawn(p, 84, 136, 40, 160), xesPrawn(p, 140, 62, 36, -120),
        xesOil(p, 100, 100, 110, { n: 8, op: .55 }),
        xesParsley(p, 100, 100, 110, { n: 22 }),
    ].join(''),

    // porrusalda: soup plate, light golden broth packed with leek rounds, potato chunks and carrot
    es_porrusalda: p => [
        xesSoupPlate(p, { line: '#2f7a5a' }),
        K.liquid(p, { R: 68, c: '#dcc68a', op: 1 }),
        ...[[72, 76], [130, 80], [104, 128], [64, 124], [140, 124], [100, 92]].map(([x, y], i) => K.potato(p, x, y, 26, i * 50, { c: '#efd48e', seed: i })),
        `<g ${p.sh(.6)}>${xesSpots('prl', 22, 58, 13).map(([x, y]) => xesLeekRound(p, x, y, 15, { c: '#dfe8b8' })).join('')}</g>`,
        ...xesSpots('prc', 8, 56, 18).map(([x, y]) => K.carrotRound(p, x, y, 13)),
        xesOil(p, 100, 100, 110, { n: 8, op: .5 }),
    ].join(''),

    // crema de calabaza: terracotta bowl, velvety orange pumpkin cream with a swirl of cream, croutons, pumpkin seeds, pepper
    es_cremacalabaza: p => [
        xesBowl(p, '#a8542a', '#f8f0e0'),
        K.liquid(p, { R: 76, c: '#e8922c', op: 1 }),
        `<circle cx="100" cy="100" r="60" fill="#f2a440" opacity=".35"/>`,
        xesSwirl(p, 100, 100, 40, '#f8eed8', 4),
        xesCrouton(p, 136, 124, 15, 20), xesCrouton(p, 120, 142, 14, -10), xesCrouton(p, 150, 104, 13, 40), xesCrouton(p, 62, 72, 14, 30), xesCrouton(p, 78, 56, 13, -20),
        ...[[60, 120, 20], [70, 132, -30], [52, 104, 60], [140, 70, 10], [128, 62, -40]].map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="4.6" ry="2.4" fill="#5a8a3a" stroke="#3a6a24" stroke-width=".5"/><ellipse cx="-1" cy="-.6" rx="2" ry=".8" fill="#9ac46a"/></g>`),
        xesPepper(p, 100, 100, 100, 30),
        xesShine('M40,90 A62,62 0 0 1 74,44', 2, .4),
    ].join(''),

    // crema de puerros: green-glazed bowl, pale celadon leek cream, swirl of cream, crisp fried leek strands, pepper
    es_cremapuerros: p => [
        xesBowl(p, '#4e7a5a', '#f6f3ea'),
        K.liquid(p, { R: 76, c: '#e2e0b2', op: 1 }),
        `<circle cx="100" cy="100" r="58" fill="#ecebc4" opacity=".4"/>`,
        xesSwirl(p, 100, 100, 44, '#fdfaf0', 3.6),
        `<g ${p.sh(.6)}>${K.shreds(p, 104, 98, 40, { c: '#d8a040', n: 22, w: 1.6, len: .8, seed: 3, curve: .8 })}</g>`,
        ...[[70, 70], [136, 130], [64, 128]].map(([x, y]) => xesLeekRound(p, x, y, 12, { c: '#cfe0a0' })),
        xesPepper(p, 100, 100, 110, 28),
        xesShine('M40,90 A62,62 0 0 1 74,44', 2, .45),
    ].join(''),

    // crema de champinones: dark brown bowl, beige mushroom cream, cream drizzle, sliced sauteed mushrooms and parsley
    es_cremachampi: p => [
        xesBowl(p, '#5a3a24', '#f4ece0'),
        K.liquid(p, { R: 76, c: '#bf9e78', op: 1 }),
        `<circle cx="100" cy="100" r="60" fill="#cdb08c" opacity=".35"/>`,
        xesSwirl(p, 100, 100, 50, '#f2e8d8', 3),
        ...[[94, 92, -20], [120, 108, 30], [88, 120, 160], [114, 80, 60], [68, 100, -60], [130, 136, 20]].map(([x, y, r], i) => xesMushroom(p, x, y, 30, r, { cut: true, tan: .55 + (i % 3) * .08 })),
        xesParsley(p, 100, 100, 100, { n: 20 }),
        xesPepper(p, 100, 100, 110, 16),
        xesShine('M40,90 A62,62 0 0 1 74,44', 2, .4),
    ].join(''),

    // crema de zanahoria: white soup plate, bright orange carrot cream, olive oil, croutons, pepper
    es_cremazanahoria: p => [
        xesSoupPlate(p, { line: '#e09a2a' }),
        K.liquid(p, { R: 68, c: '#f08a2a', op: 1 }),
        `<circle cx="100" cy="100" r="54" fill="#f8a040" opacity=".35"/>`,
        `<path d="M64,96 Q84,80 104,96 T144,100" stroke="#fbe6c0" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".85"/>`,
        xesCrouton(p, 112, 112, 15, 20), xesCrouton(p, 94, 124, 14, -10), xesCrouton(p, 128, 128, 14, 40), xesCrouton(p, 110, 138, 13, 10), xesCrouton(p, 80, 108, 13, 30),
        xesOil(p, 100, 100, 110, { n: 12, op: .8 }),
        xesPepper(p, 100, 100, 100, 26),
        xesParsley(p, 80, 76, 16, { n: 6 }),
    ].join(''),

    // patatas a la riojana: cazuela, brick-red pimenton broth, broken potato chunks, chorizo slices, green pepper, parsley
    es_riojana: p => [
        xesCazuela(p, { glaze: '#7a3418' }),
        xesStew(p, 74, '#b8401e', { seed: 9, op: .3 }),
        ...[[70, 76], [128, 70], [136, 122], [70, 126], [100, 100], [100, 56], [100, 146], [54, 100], [150, 96]].map(([x, y], i) => xesChunk(p, x, y, 30, i * 40, i % 2 ? '#e6a656' : '#eab060', { seed: i, n: 6, j: .35, k: .4, hi: .65 })),
        xesChorizo(p, 98, 78, 24), xesChorizo(p, 72, 102, 24), xesChorizo(p, 124, 100, 24), xesChorizo(p, 104, 124, 22), xesChorizo(p, 136, 146, 20), xesChorizo(p, 60, 146, 20),
        ...xesSpots('rjp', 7, 56, 18).map(([x, y, r]) => xesBand(p, x, y, 16, 5, r, { c: '#4f962c', bend: .1, cap: 'butt' })),
        xesOil(p, 100, 100, 130, { n: 10, op: .55, c: '#d8602a' }),
        xesParsley(p, 100, 100, 120, { n: 18 }),
    ].join(''),

    // gazpachuelo: soup plate, pale creamy yellow mayonnaise broth with white fish, potato and peeled prawns
    es_gazpachuelo: p => [
        xesSoupPlate(p, { line: '#2f5f9a' }),
        K.liquid(p, { R: 68, c: '#f0e2b4', op: 1 }),
        `<circle cx="100" cy="100" r="56" fill="#f6ebc6" opacity=".4"/>`,
        ...[[72, 80], [130, 124], [66, 124], [124, 72]].map(([x, y], i) => K.potato(p, x, y, 24, i * 60, { c: '#f2dc96', seed: i })),
        xesFishChunk(p, 100, 100, 32, 20, { seed: 1 }), xesFishChunk(p, 100, 140, 28, -20, { seed: 2 }), xesFishChunk(p, 100, 60, 26, 10, { seed: 3 }),
        K.shrimp(p, 144, 96, 22, 20), K.shrimp(p, 56, 100, 22, 200), K.shrimp(p, 84, 116, 18, 60),
        xesParsley(p, 100, 100, 110, { n: 20 }),
    ].join(''),

    // sopa de tomate: clay bowl, bright red tomato soup with soaked bread slices, a poached egg and green pepper
    es_sopatomate: p => [
        xesBowl(p, '#9a4a24', '#f2e2cc'),
        xesStew(p, 76, '#d0402a', { seed: 10, op: .25 }),
        ...[[66, 74, -20], [134, 76, 30], [66, 128, 20], [134, 128, -30]].map(([x, y, r], i) => xesSoakedBread(p, x, y, 46, 30, r, { seed: i, c: '#eeb47a' })),
        xesPoached(p, 100, 100, 46),
        ...xesSpots('stp', 9, 60, 16).map(([x, y, r]) => xesBand(p, x, y, 18, 6, r, { c: '#4f962c', bend: .1, cap: 'butt' })),
        ...[[100, 56, 0], [100, 146, 40]].map(([x, y, r]) => K.onion(p, x, y, 18, r, { c: '#f0c8a0' })),
        xesOil(p, 100, 100, 130, { n: 8, op: .55 }),
        xesParsley(p, 100, 100, 120, { n: 14 }),
    ].join(''),

    // olla gitana: cazuela, golden chickpea stew with pumpkin, green beans, potato, pear and mint
    es_ollagitana: p => [
        xesCazuela(p, { glaze: '#7a3a1a' }),
        xesStew(p, 74, '#c88a3a', { seed: 11, op: .3 }),
        ...xesSpots('ogc', 40, 64, 11).map(([x, y, r]) => xesChickpea(p, x, y, 12, r)),
        ...[[74, 74], [128, 120], [110, 68], [64, 120], [140, 86]].map(([x, y], i) => xesDice(p, x, y, 20, i * 30, '#f0962a')),
        ...[[100, 100], [90, 140]].map(([x, y], i) => K.potato(p, x, y, 24, i * 40, { c: '#ecc77c', seed: i })),
        ...[[124, 146, 30], [52, 92, -40]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="M-12,4 Q-12,-8 0,-9 Q12,-8 12,4 Q0,9 -12,4Z" fill="${p.g('#f2e8c4', .3, .2)}" stroke="#bfae7a" stroke-width=".6"/></g><path d="M-11,4 Q0,9 11,4" stroke="#c8c050" stroke-width="2.4" fill="none"/></g>`),
        ...xesSpots('ogb', 9, 58, 16).map(([x, y, r]) => xesBand(p, x, y, 22, 6, r, { c: '#5a9e36', bend: .04 })),
        ...[[96, 82, 20], [116, 98, -60], [82, 106, 120]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-8,0 Q-2,-6 8,0 Q-2,6 -8,0Z" fill="${p.g('#4e9a3a', .3, .25)}" stroke="#2f6a22" stroke-width=".5"/><path d="M-7,0 L7,0" stroke="#8ac46a" stroke-width=".6"/></g>`),
        xesOil(p, 100, 100, 120, { n: 8, op: .5 }),
    ].join(''),

};
