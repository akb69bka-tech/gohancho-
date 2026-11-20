// India (in_) — hand-drawn mains, sides and soups (redraw of the template set)
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// ---- helpers copied from w_in.mjs (prefix xin) ----
const xinBlur = (p, s = 2) => `filter="url(#${p.def('xinbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;

function xinSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xinspots' + seed), out = [];
    for (let t = 0; t < 8000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// polished steel: banded gradient so it reads as metal
function xinMetal(p, c1 = '#f3f5f7', c2 = '#9aa2ab'){
    const id = p.def('xinmetal' + c1 + c2, id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".3" stop-color="${c2}"/><stop offset=".5" stop-color="${c1}"/><stop offset=".78" stop-color="${dk(c2, .15)}"/><stop offset="1" stop-color="${lt(c2, .3)}"/></linearGradient>`);
    return `url(#${id})`;
}
// stainless steel katori / serving bowl
function xinSteel(p, { R = 92, lip = .86, c1 = '#f3f5f7', c2 = '#9aa2ab' } = {}){
    const r = R * lip;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${xinMetal(p, c1, c2)}"/></g>
        <circle cx="100" cy="100" r="${R - 1.5}" fill="none" stroke="#ffffff" stroke-width="1.4" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(r + 2.5)}" fill="none" stroke="#7d858e" stroke-width="1.5" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(r)}" fill="${p.rg('#c9ced4', .25, .35, .62, .64)}"/>
        <circle cx="100" cy="100" r="${f(r * .8)}" fill="none" stroke="#e9ecef" stroke-width="1" opacity=".6"/>`;
}
// big steel thali with a raised rim
function xinThali(p, { R = 95 } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${xinMetal(p, '#eef1f4', '#a3abb3')}"/></g>
        <circle cx="100" cy="100" r="${R - 1.5}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".85"/>
        <circle cx="100" cy="100" r="${R - 9}" fill="${p.rg('#d4d9de', .2, .2, .4, .36)}"/>
        <circle cx="100" cy="100" r="${R - 9}" fill="none" stroke="#868e97" stroke-width="1.2"/>
        <circle cx="100" cy="100" r="${R - 30}" fill="none" stroke="#e6e9ec" stroke-width=".8" opacity=".7"/>
        <path d="M${100 - R * .7},${100 - R * .44} A${R * .84},${R * .84} 0 0 1 ${100 - R * .24},${100 - R * .8}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// black iron kadai with two loop handles
function xinKadai(p, { R = 84 } = {}){
    const h = side => `<g ${T(100 + side * (R + 2), 100)}><path d="M0,-12 Q${side * 14},-12 ${side * 14},0 Q${side * 14},12 0,12" fill="none" stroke="#2c2826" stroke-width="5" stroke-linecap="round"/><path d="M0,-12 Q${side * 14},-12 ${side * 14},0" fill="none" stroke="#6a6360" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`;
    return `<g ${p.sh(1.8)}>${h(-1)}${h(1)}<circle cx="100" cy="100" r="${R}" fill="${p.rg('#3a3533', .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="#6a6360" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(R * .9)}" fill="${p.rg('#282321', .12, .2, .62, .64)}"/>`;
}
// copper handi with a brass lip
function xinHandi(p, { R = 92 } = {}){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${xinMetal(p, '#e9a476', '#a8552e')}"/></g>
        <circle cx="100" cy="100" r="${R - 6}" fill="none" stroke="${xinMetal(p, '#f6dc8e', '#b8862a')}" stroke-width="7"/>
        <circle cx="100" cy="100" r="${R - 10}" fill="${p.rg('#b9bfc6', .2, .35, .62, .64)}"/>`;
}
// terracotta pot (Kerala-style manchatti)
function xinClay(p, { R = 92 } = {}){
    return K.bowl(p, { R, glaze: '#9c4a26', inside: '#7a3218', lip: .86 });
}
// glossy curry surface with an oil rim
function xinGravy(p, { R = 72, c = '#a8431c', oil = '#d9621e', cx = 100, cy = 100, seed = 1 } = {}){
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg(c, .2, .28, .45, .42)}"/>
        <circle cx="${cx}" cy="${cy}" r="${R - 3}" fill="none" stroke="${oil}" stroke-width="5" opacity=".55"/>
        <path d="M${cx - R * .62},${cy - R * .3} A${R * .72},${R * .72} 0 0 1 ${cx - R * .15},${cy - R * .66}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// oil / ghee droplets
function xinOil(p, x, y, s, { n = 10, c = '#e8a33a', seed = 1, op = .7, rmax = 2.6 } = {}){
    const R = rng(p.id + 'oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// coriander leaf sprigs (small 3-lobed leaves)
function xinCoriander(p, x, y, s, { n = 8, seed = 1 } = {}){
    const R = rng(p.id + 'cor' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, k = .8 + R() * .5, c = R() < .5 ? '#3f8f2c' : '#56a83a';
        out += `<g ${T(cx, cy, R() * 360, k)}><path d="M0,0 C-4,-1 -6,-5 -3,-7 C-2,-9 2,-9 3,-7 C6,-5 4,-1 0,0Z" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".45"/><path d="M0,0 L0,-6 M0,-3 L-2.5,-5.5 M0,-3 L2.5,-5.5" stroke="${lt(c, .4)}" stroke-width=".5"/></g>`;
    }
    return `<g ${p.sh(.4)}>${out}</g>`;
}
// curry leaf
function xinCurryLeaf(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-4,-5 6,-3.2 Q10,-1 10,0 Q10,1 6,3.2 Q-4,5 -10,0Z" fill="${p.g('#2f6a1e', .25, .3)}" stroke="#1c4210" stroke-width=".5"/><path d="M-9,0 L9,0" stroke="#6f9a46" stroke-width=".6"/><path d="M-4,-2.4 Q2,-3.4 6,-2.2" stroke="#fff" stroke-width=".7" fill="none" opacity=".45"/></g>`;
}
// dried red chili
function xinRedChili(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 24)}><path d="M-12,0 Q-10,-3.4 0,-3.4 Q8,-3 11,-.6 Q12,0 11,.6 Q8,3 0,3.4 Q-10,3.4 -12,0Z" fill="${p.g('#a8201a', .3, .35)}" stroke="#5e0e0a" stroke-width=".5"/><path d="M-12,0 L-15,-1.2" stroke="#6f7a2a" stroke-width="1.6" stroke-linecap="round"/><path d="M-6,-1.8 Q0,-2.6 6,-1.6" stroke="#ff9a7a" stroke-width=".8" fill="none" opacity=".7"/></g>`;
}
// mustard seeds / cumin seeds
function xinSeeds(p, x, y, s, { n = 18, kind = 'mustard', seed = 1 } = {}){
    const R = rng(p.id + 'sd' + kind + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d;
        out += kind === 'mustard' ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(.9 + R() * .4)}" fill="${R() < .5 ? '#2a1a12' : '#4a2a1a'}"/>`
            : `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="1.9" ry=".7" transform="rotate(${f(R() * 180)} ${f(cx)} ${f(cy)})" fill="${R() < .5 ? '#5a3a1a' : '#7a5228'}"/>`;
    }
    return out;
}
// green peas
function xinPeas(p, x, y, s, { n = 14, seed = 1, sz = 5 } = {}){
    const R = rng(p.id + 'pea' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${sz / 2}" fill="${p.rg('#5fa83a', .3, .25, .35, .32)}" stroke="#3a7524" stroke-width=".5"/><circle cx="${f(cx - sz * .15)}" cy="${f(cy - sz * .16)}" r="${f(sz * .13)}" fill="#fff" opacity=".7"/>`; }
    return `<g ${p.sh(.4)}>${out}</g>`;
}
// small rounded dice (carrot, potato, paneer ...)
function xinDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .2)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// basmati rice: long slim grains
function xinBasmati(p, x, y, s, { sy = 1, tint = '#f8f5ec', seed = 1, n = null, base = true } = {}){
    const R = rng(p.id + 'bas' + seed + x + y);
    const shape = smooth(ring(s / 2, 14, .07, R, 1, sy));
    const cnt = n || Math.round(s * s / 46);
    let lit = '', dim = '';
    for (let i = 0; i < cnt; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .95, gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy, b = R() * 3.14, hl = 2.9 + R() * .6;
        const seg = `M${f(gx - Math.cos(b) * hl)} ${f(gy - Math.sin(b) * hl)}l${f(Math.cos(b) * hl * 2)} ${f(Math.sin(b) * hl * 2)}`;
        if ((gx + gy) / (s / 2) + (R() - .5) * 1.2 < .2) lit += seg; else dim += seg;
    }
    return `<g ${T(x, y)}>${base ? `<g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .06), .15, .2, .38, .34)}"/></g>` : ''}
        <path d="${dim}" stroke="${dk(tint, .3)}" stroke-width="2.3" stroke-linecap="round" opacity=".45" transform="translate(.5 .7)"/>
        <path d="${dim}" stroke="${dk(tint, .05)}" stroke-width="2" stroke-linecap="round"/>
        <path d="${lit}" stroke="${dk(tint, .3)}" stroke-width="2.3" stroke-linecap="round" opacity=".35" transform="translate(.5 .7)"/>
        <path d="${lit}" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></g>`;
}
// roti / chapati: round, wheat coloured, with brown blisters
function xinRoti(p, x, y, s, r = 0, { seed = 1, fold = false } = {}){
    const R = rng(p.id + 'roti' + seed + x + y);
    const pts = ring(s / 2, 14, .05, R);
    let spots = '';
    for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .42; spots += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(s * (.03 + R() * .05))}" ry="${f(s * (.02 + R() * .04))}" fill="${R() < .4 ? '#8a4a1a' : '#b8742e'}" opacity="${f(.4 + R() * .4)}"/>`; }
    let dots = '';
    for (let i = 0; i < 10; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .4; dots += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(.6 + R() * .8)}" fill="#5a2a0a" opacity=".6"/>`; }
    const body = `<path d="${smooth(pts)}" fill="${p.rg('#e9c98e', .25, .22, .4, .36)}" stroke="#b8894a" stroke-width=".7"/>`;
    if (fold){
        // folded in quarters: a quarter-circle with a soft curved edge
        const q = `M0,0 L${s / 2},0 A${s / 2},${s / 2} 0 0 1 0,${s / 2}Z`;
        return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${q}" fill="${p.g('#e6c286', .25, .25)}" stroke="#b8894a" stroke-width=".8"/></g>
            <g clip-path="url(#${p.def('xinq' + s, id => `<clipPath id="${id}"><path d="${q}"/></clipPath>`)})"><g ${xinBlur(p, 1.2)}>${spots}</g>${dots}</g>
            <path d="M3,3 L${f(s * .45)},3" stroke="#f6e2b6" stroke-width="1.2" opacity=".8"/></g>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}>${body}</g><g ${xinBlur(p, 1.4)}>${spots}</g>${dots}
        <path d="M${f(-s * .32)},${f(-s * .16)} Q${f(-s * .12)},${f(-s * .36)} ${f(s * .16)},${f(-s * .32)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// chicken curry piece (masala-coated, sometimes with a bone end)
function xinChicken(p, x, y, s, r = 0, { c = '#a5481c', seed = 1, bone = false } = {}){
    const R = rng(p.id + 'wch' + seed + x + y);
    const pts = ring(s / 2, 9, .25, R, 1.2, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}>${bone ? `<path d="M${f(s * .4)},-2.2 L${f(s * .74)},-2.6 Q${f(s * .84)},0 ${f(s * .74)},2.6 L${f(s * .4)},2.2Z" fill="#efe2c6" stroke="#b9a37a" stroke-width=".6"/>` : ''}
        <path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .6 - 1, b * .5 - 1]), true, .8)}" fill="${lt(c, .18)}" opacity=".6"/>
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .08)},${f(-s * .34)} ${f(s * .16)},${f(-s * .28)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// boiled egg half in curry (masala-tinged white, yellow yolk)
function xinEggHalf(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.8)}><ellipse rx="15" ry="11" fill="${p.rg('#fbf2df', .1, .12)}" stroke="#d9874a" stroke-width="1.6"/></g>
        <circle cx=".8" cy=".8" r="6.6" fill="${p.rg('#f2a91c', .3, .2)}" stroke="#d98a12" stroke-width=".5"/>
        <ellipse cx="-7" cy="-5.4" rx="4" ry="1.6" fill="#fff" opacity=".75"/></g>`;
}
// fish steak: round slice with skin, spine and masala
function xinFishSteak(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'fst' + seed + x);
    const pts = ring(s / 2, 10, .1, R, 1.25, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.g('#8f9aa2', .3, .3)}" stroke="#5a646c" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .88, b * .84]))}" fill="${p.g('#f1d6b0', .25, .2)}"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .88, b * .84]))}" fill="#d0602a" opacity=".45"/>
        <path d="M${f(-s * .5)},0 Q0,${f(-s * .05)} ${f(s * .5)},0 M0,${f(-s * .34)} L0,${f(s * .34)}" stroke="#f6e9d4" stroke-width="1" fill="none" opacity=".7"/>
        <circle r="${f(s * .08)}" fill="#f4ecdc" stroke="#c9b48c" stroke-width=".6"/>
        <path d="M${f(-s * .36)},${f(-s * .18)} Q${f(-s * .12)},${f(-s * .34)} ${f(s * .14)},${f(-s * .3)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// kidney bean
function xinBean(p, x, y, s, r = 0, { c = '#7a1f1c' } = {}){
    return `<g ${T(x, y, r, s / 14)}><path d="M-7,-1 C-7,-5 -2,-5.4 0,-3.6 C2,-5.4 7,-5 7,-1 C7,4 3,5 0,4.4 C-3,5 -7,4 -7,-1Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/><path d="M-4.4,-2.6 Q-2,-3.6 0,-2.4" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// paneer cube (soft, lightly golden)
function xinPaneer(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .16)}" fill="${p.g('#fbf4e2', .3, .2)}" stroke="#d8c8a4" stroke-width=".6"/></g>
        <rect x="${f(-s / 2 + 2)}" y="${f(-s / 2 + 2)}" width="${f(s - 4)}" height="${f(s - 4)}" rx="${f(s * .12)}" fill="none" stroke="#e8c98a" stroke-width="1.2" opacity=".5"/>
        <path d="M${f(-s / 2 + 2.5)},${f(-s / 2 + 2.5)} L${f(s / 2 - 3)},${f(-s / 2 + 2.5)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/></g>`;
}
// cauliflower floret (turmeric tinted)
function xinCauli(p, x, y, s, r = 0, { c = '#f2d27a' } = {}){
    const R = rng(p.id + 'cau' + x + y);
    let b = '';
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.28, d = i === 0 ? 0 : s * .22; b += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d - s * .05)}" r="${f(s * (.18 + R() * .06))}" fill="${p.g(R() < .5 ? c : lt(c, .15), .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${f(-s * .12)},${f(s * .15)} L${f(-s * .1)},${f(s * .5)} L${f(s * .1)},${f(s * .5)} L${f(s * .12)},${f(s * .15)}Z" fill="#f4e9c4" stroke="#cdb780" stroke-width=".5"/>${b}</g>
        <circle cx="${f(-s * .14)}" cy="${f(-s * .2)}" r="${f(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// okra cut into rounds / short pieces
function xinOkraBit(p, x, y, s, r = 0, { side = false } = {}){
    if (side) return `<g ${T(x, y, r)}><rect x="${-s / 2}" y="${f(-s * .3)}" width="${s}" height="${f(s * .6)}" rx="${f(s * .2)}" fill="${p.g('#4f8a2a', .3, .3)}" stroke="#2f5a1a" stroke-width=".5"/><path d="M${f(-s * .4)},${f(-s * .1)} L${f(s * .4)},${f(-s * .1)} M${f(-s * .4)},${f(s * .1)} L${f(s * .4)},${f(s * .1)}" stroke="#2f5a1a" stroke-width=".6" opacity=".6"/><ellipse cx="${f(s * .46)}" cy="0" rx="${f(s * .08)}" ry="${f(s * .26)}" fill="#c9dca0"/></g>`;
    return K.okra(p, x, y, s);
}
// drumstick (moringa) piece
function xinDrumstick(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="-3.4" width="${L}" height="6.8" rx="2.4" fill="${p.g('#7a8a3a', .3, .3)}" stroke="#4a5a1e" stroke-width=".6"/><path d="M${-L / 2 + 2},-1.2 L${L / 2 - 2},-1.2 M${-L / 2 + 2},1.4 L${L / 2 - 2},1.4" stroke="#5a6a26" stroke-width=".6"/><ellipse cx="${L / 2 - 1}" cy="0" rx="1.6" ry="3" fill="#d8d29a"/></g>`;
}
// small shallot (sambar onion)
function xinShallot(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="${p.rg('#d98a8a', .3, .25, .35, .32)}" stroke="#9a4a4a" stroke-width=".5"/></g><ellipse rx="${f(s * .3)}" ry="${f(s * .24)}" fill="none" stroke="#f2c4c0" stroke-width=".7"/></g>`;
}
// sliced garlic fried golden
function xinGarlic(p, x, y, s, { n = 7, seed = 1 } = {}){
    const R = rng(p.id + 'gar' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<ellipse cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" rx="2.6" ry="1.8" transform="rotate(${f(R() * 180)} ${f(x + Math.cos(a) * d)} ${f(y + Math.sin(a) * d)})" fill="${R() < .5 ? '#e6b45a' : '#c98a32'}" stroke="#9a6420" stroke-width=".4"/>`; }
    return out;
}
// dice for salads
function xinSaladDice(p, x, y, s, r, kind){
    const h = s / 2;
    if (kind === 'cuc') return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${p.g('#dbeab0', .2, .15)}" stroke="#9fbf6a" stroke-width=".5"/><rect x="${-h}" y="${-h}" width="${s}" height="${f(s * .26)}" rx="${f(s * .12)}" fill="#3f7a2c"/></g>`;
    if (kind === 'oni') return `<g ${T(x, y, r)}><rect x="${-h * .8}" y="${-h * .8}" width="${s * .8}" height="${s * .8}" rx="${f(s * .18)}" fill="${p.g('#f3e2ea', .3, .15)}" stroke="#c99aaa" stroke-width=".5"/><path d="M${f(-h * .6)},${f(-h * .2)} L${f(h * .6)},${f(-h * .2)}" stroke="#b86a8a" stroke-width=".8" opacity=".6"/></g>`;
    return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${p.g('#e23a2a', .3, .25)}" stroke="#a5241a" stroke-width=".5"/><path d="M${f(-h * .4)},${f(-h * .2)} Q0,${f(h * .4)} ${f(h * .5)},${f(-h * .1)}" stroke="#f6c25a" stroke-width="${f(s * .16)}" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// soft sheen on a soup
const xinShine = (cx, cy, R, op = .4) => `<path d="M${cx - R * .62},${cy - R * .25} A${R * .7},${R * .7} 0 0 1 ${cx - R * .12},${cy - R * .66}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// ---- new parts for this file ----
// soft blobs that give a gravy / dal / mash its texture
function xinTex(p, cx, cy, R, cols, n, seed, smin = 4, smax = 10, op = .45, blur = 0, sy = 1){
    const Rn = rng(p.id + 'tex' + seed);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = Rn() * 6.28, d = Math.sqrt(Rn()) * Math.max(0, R - smax), s = smin + Rn() * (smax - smin);
        out += `<path ${T(cx + Math.cos(a) * d, cy + Math.sin(a) * d * sy, Rn() * 360)} d="${smooth(ring(s, 7, .5, Rn, 1.3, .8))}" fill="${cols[Math.floor(Rn() * cols.length)]}"/>`;
    }
    return `<g opacity="${op}" ${blur ? xinBlur(p, blur) : ''}>${out}</g>`;
}
// cream swirl (spiral)
function xinSwirl(p, x, y, s, { c = '#fffaf0', w = 3, turns = 1.7, r = 0, op = .92 } = {}){
    const pts = [];
    for (let i = 0; i <= 24; i++){ const t = i / 24, a = t * turns * 6.28 + r, rr = 2 + t * s / 2; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .85]); }
    const d = smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .2)}" stroke-width="${w + 1}" fill="none" stroke-linecap="round" opacity=".3" transform="translate(.6 .8)"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// a pat of butter, melting at the edge
function xinButter(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s * .7, 8, .3, rng(p.id + 'bt' + x + y), 1.15, .9))}" fill="#f8d870" opacity=".55"/><g ${p.sh(.5)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${s}" rx="${f(s * .24)}" fill="${p.g('#fde9a4', .4, .14)}" stroke="#dcb85a" stroke-width=".6"/></g><path d="M${f(-s * .3)},${f(-s * .3)} L${f(s * .18)},${f(-s * .3)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/></g>`;
}
// fresh green chili (whole or slit)
function xinGreenChili(p, x, y, s, r = 0, { slit = false, c = '#4f9a2c' } = {}){
    return `<g ${T(x, y, r, s / 24)}><path d="M-12,0 Q-10,-3.2 0,-3.2 Q8,-2.8 12,.4 Q8,2.8 0,3.2 Q-10,3.2 -12,0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/><path d="M-12,0 Q-14,-1 -15,-3" stroke="#6f8a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>${slit ? `<path d="M-7,.3 L8,.6" stroke="#dcedb6" stroke-width="1.3" stroke-linecap="round"/>` : ''}<path d="M-6,-1.9 Q0,-2.6 6,-1.6" stroke="#fff" stroke-width=".8" fill="none" opacity=".6"/></g>`;
}
// green chili rounds
function xinChiliRings(p, x, y, s, { n = 8, seed = 1 } = {}){
    const R = rng(p.id + 'chr' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="2.3" fill="#d8eab0" stroke="#3f8a26" stroke-width="1.1"/><circle cx="${f(cx)}" cy="${f(cy)}" r=".7" fill="#f4f8e0"/>`; }
    return out;
}
// irregular glossy chunk (meat, soya, taro ...)
function xinChunk(p, x, y, s, r = 0, c = '#7a3a1a', { seed = 1, sx = 1.15, sy = .9, jit = .3, n = 9, gloss = .55, inner = .16 } = {}){
    const R = rng(p.id + 'ck' + seed + x + y);
    const pts = ring(s / 2, n, jit, R, sx, sy);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .28, .32)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .55 - s * .06, b * .5 - s * .06]), true, .8)}" fill="${lt(c, inner)}" opacity=".55"/>
        <path d="M${f(-s * .28)},${f(-s * .14)} Q${f(-s * .08)},${f(-s * .32)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="${gloss}"/></g>`;
}
// charred boneless tikka piece
function xinTikka(p, x, y, s, r = 0, { seed = 1, c = '#c4562a' } = {}){
    const R = rng(p.id + 'tk' + seed + x + y);
    let ch = '';
    for (let i = 0; i < 2; i++){ const cx = (R() - .5) * s * .5, cy = (R() - .2) * s * .4; ch += `<path d="M${f(cx - s * .16)},${f(cy)} Q${f(cx)},${f(cy - s * .06)} ${f(cx + s * .16)},${f(cy + s * .02)}" stroke="#6a2008" stroke-width="${f(s * .08)}" fill="none" stroke-linecap="round" opacity=".45"/>`; }
    return `<g ${T(x, y, r)}>${xinChunk(p, 0, 0, s, 0, c, { seed: seed + 'x' + x })}${ch}</g>`;
}
// bone end sticking out of a piece of meat
function xinBone(x, y, L, r = 0){
    return `<g ${T(x, y, r)}><rect x="0" y="-2.3" width="${L}" height="4.6" rx="2" fill="#efe4cc" stroke="#b9a37a" stroke-width=".5"/><circle cx="${L}" cy="-1.9" r="2.6" fill="#f4ead6" stroke="#b9a37a" stroke-width=".5"/><circle cx="${L}" cy="1.9" r="2.6" fill="#f4ead6" stroke="#b9a37a" stroke-width=".5"/></g>`;
}
// bone-in mutton piece (dark, with a fat edge)
function xinMutton(p, x, y, s, r = 0, { c = '#6a2414', seed = 1, bone = false, fat = '#c98a6a' } = {}){
    const R = rng(p.id + 'mt' + seed + x + y);
    const pts = ring(s / 2, 9, .32, R, 1.2, .88);
    return `<g ${T(x, y, r)}>${bone ? xinBone(s * .42, 0, s * .32) : ''}<path d="${smooth(pts, true, .8)}" fill="${p.g(c, .26, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="${smooth(pts.slice(1, 4).map(([a, b]) => [a * .86, b * .86]), false)}" stroke="${fat}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-s * .3)},${f(s * .02)} Q${f(-s * .05)},${f(-s * .1)} ${f(s * .28)},${f(s * .04)} M${f(-s * .24)},${f(s * .18)} Q${f(0)},${f(s * .08)} ${f(s * .22)},${f(s * .2)}" stroke="${dk(c, .35)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .14)},${f(-s * .26)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// pork cube with a band of fat (vindaloo)
function xinPorkCube(p, x, y, s, r = 0, { c = '#7c2c16' } = {}){
    const h = s / 2;
    const pts = [[-h, -h * .9], [0, -h], [h, -h * .9], [h * 1.05, 0], [h, h * .85], [0, h * .95], [-h, h * .85], [-h * 1.05, 0]].map(([u, v], i) => [u * (.9 + ((i * 37 + x) % 10) / 50), v * (.9 + ((i * 53 + y) % 10) / 50)]);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .26, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="M${f(-h + 2)},${f(-h * .9 + 3.2)} Q0,${f(-h * .9 + 1.6)} ${f(h - 2)},${f(-h * .9 + 3.4)}" stroke="#d99a72" stroke-width="${f(s * .16)}" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M${f(-h * .5)},${f(h * .1)} Q0,${f(-h * .1)} ${f(h * .5)},${f(h * .05)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// tandoori chicken leg: bulb, slashes, char, bone tip
function xinLeg(p, x, y, L, r = 0, { c = '#cc4626', seed = 1 } = {}){
    const R = rng(p.id + 'leg' + seed + x + y);
    const h = L * .25;
    const body = `M${f(-L * .5)},0 C${f(-L * .5)},${f(-h * 1.2)} ${f(-L * .1)},${f(-h * 1.2)} ${f(L * .12)},${f(-h * .48)} L${f(L * .3)},${f(-h * .28)} L${f(L * .3)},${f(h * .28)} L${f(L * .12)},${f(h * .48)} C${f(-L * .1)},${f(h * 1.2)} ${f(-L * .5)},${f(h * 1.2)} ${f(-L * .5)},0Z`;
    let sl = '';
    [-.34, -.2, -.06].forEach(t => { const sx = L * t; sl += `<path d="M${f(sx - 2)},${f(-h * .78)} Q${f(sx + 3)},0 ${f(sx - 1)},${f(h * .78)}" stroke="#6e1a0a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/><path d="M${f(sx - .6)},${f(-h * .6)} Q${f(sx + 3.6)},0 ${f(sx + .4)},${f(h * .6)}" stroke="#f0a070" stroke-width=".8" fill="none" opacity=".75"/>`; });
    let ch = '';
    for (let i = 0; i < 6; i++) ch += `<ellipse cx="${f(-L * .45 + R() * L * .55)}" cy="${f((R() - .5) * h * 1.4)}" rx="${f(1.6 + R() * 3)}" ry="${f(1 + R() * 1.6)}" fill="#3a1206" opacity="${f(.3 + R() * .4)}"/>`;
    const ro = `transform="rotate(${f(r)})"`;
    return `<g ${T(x, y)}><g ${p.sh(1.1)}><g ${ro}>${xinBone(L * .26, 0, L * .2)}</g><g ${p.crumb(.5)}><path ${ro} d="${body}" fill="${p.g(c, .28, .35)}" stroke="#7a1c0c" stroke-width=".8"/></g></g>
        <g ${ro}>${sl}${ch}<path d="M${f(-L * .4)},${f(-h * .6)} Q${f(-L * .2)},${f(-h * 1.05)} ${f(0)},${f(-h * .62)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g></g>`;
}
// masala-coated fried fish steak
function xinFryFish(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'ff' + seed + x + y);
    const pts = ring(s / 2, 11, .12, R, 1.28, .84);
    let ch = '';
    for (let i = 0; i < 6; i++) ch += `<ellipse cx="${f((R() - .5) * s * .9)}" cy="${f((R() - .5) * s * .6)}" rx="${f(1.6 + R() * 3)}" ry="${f(1 + R() * 1.6)}" fill="#4a1406" opacity="${f(.3 + R() * .35)}"/>`;
    const ro = `transform="rotate(${f(r)})"`;
    return `<g ${T(x, y)}><g ${p.sh(1)}><g ${p.crumb(.6)}><path ${ro} d="${smooth(pts)}" fill="${p.g('#a8361a', .3, .35)}" stroke="#5e1a08" stroke-width=".8"/></g></g>
        <g ${p.crumb(.8)}><path ${ro} d="${smooth(pts.map(([a, b]) => [a * .8, b * .76]))}" fill="${p.g('#d0622a', .3, .25)}"/></g><g ${ro}>
        <path d="M${f(-s * .5)},0 Q0,${f(-s * .04)} ${f(s * .5)},0 M0,${f(-s * .3)} L0,${f(s * .3)}" stroke="#7a2410" stroke-width="1" opacity=".5" fill="none"/>
        <circle r="${f(s * .07)}" fill="#f2dfc4" stroke="#a87a50" stroke-width=".5"/>${ch}
        <path d="M${f(-s * .4)},${f(-s * .18)} Q${f(-s * .14)},${f(-s * .34)} ${f(s * .14)},${f(-s * .3)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".5"/></g></g>`;
}
// chickpea
function xinChana(p, x, y, s, r = 0, { c = '#c9974e' } = {}){
    return `<g ${T(x, y, r)}><circle r="${f(s / 2)}" fill="${p.rg(c, .3, .3, .35, .32)}" stroke="${dk(c, .35)}" stroke-width=".5"/><path d="M${f(s * .14)},${f(-s * .42)} Q${f(s * .42)},${f(-s * .32)} ${f(s * .42)},${f(-s * .06)}" stroke="${dk(c, .35)}" stroke-width=".7" fill="none"/><circle cx="${f(-s * .16)}" cy="${f(-s * .18)}" r="${f(s * .12)}" fill="#fff" opacity=".55"/></g>`;
}
// raw onion ring (red onion)
function xinRing(p, x, y, s, r = 0, { c = '#b8507e', sy = .82, w = 1.8 } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="${c}" stroke-width="${f(w + 1.2)}"/><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="#faeef4" stroke-width="${f(w * .6)}" transform="translate(-.3 .3)"/></g>`;
}
// mint leaf
function xinMint(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 14)}><path d="M-7,0 Q-3,-5 6,-1 Q7,0 6,1 Q-3,5 -7,0Z" fill="${p.g('#4f9a3a', .3, .25)}" stroke="#2f6a22" stroke-width=".5"/><path d="M-6,0 L6,0 M-2,0 L0,-2.6 M2,0 L4,-1.8 M-2,0 L0,2.6 M2,0 L4,1.8" stroke="#8cc86a" stroke-width=".45"/></g>`;
}
// black frying pan with a handle
function xinPan(p, { R = 80 } = {}){
    return `<g ${p.sh(1.8)}><g transform="rotate(40 100 100)"><rect x="${100 + R - 8}" y="93" width="36" height="14" rx="6" fill="${p.g('#3a3432', .2, .2)}"/><rect x="${100 + R + 14}" y="97" width="10" height="6" rx="3" fill="#1e1a19"/></g><circle cx="100" cy="100" r="${R}" fill="${p.rg('#3a3533', .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="#6a6360" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(R * .9)}" fill="${p.rg('#2a2523', .12, .2, .62, .64)}"/>`;
}
// fried onions (birista)
function xinBirista(p, x, y, s, { n = 22, seed = 1 } = {}){
    return `<g ${p.sh(.4)}>${K.shreds(p, x, y, s, { c: '#9a5220', n, w: 1.7, len: .12, seed, curve: 1.2 })}</g>`;
}
// fresh banana leaf (food is served on it)
function xinLeaf(p){
    const R = rng(p.id + 'leaf');
    let veins = '';
    for (let i = 0; i < 22; i++){ const x = 14 + i * 8.2; veins += `M${f(x)},38 L${f(x + 18)},176 `; }
    const leaf = `M6,40 Q100,22 194,34 L196,170 Q100,184 4,176Z`;
    const cid = p.def('xinleafclip', id => `<clipPath id="${id}"><path d="${leaf}"/></clipPath>`);
    return `<g ${p.sh(1.6)}><path d="${leaf}" fill="${p.g('#4f9a34', .25, .3)}" stroke="#2f6a22" stroke-width="1"/></g>
        <g clip-path="url(#${cid})"><path d="${veins}" stroke="#7cbc56" stroke-width=".8" opacity=".55"/><path d="M0,34 Q100,18 200,30 L200,44 Q100,32 0,48Z" fill="#a8d07a" opacity=".85"/>
        <path d="M30,60 Q60,52 90,56" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".35"/>${R() > 2 ? '' : ''}</g>`;
}
// ceramic soup cup with a handle
function xinMug(p, { R = 74, c = '#f4efe6', rim = '#c43a2a' } = {}){
    return `<g ${p.sh(1.8)}><path d="M${100 + R - 6},84 Q${100 + R + 18},84 ${100 + R + 18},100 Q${100 + R + 18},116 ${100 + R - 6},116" fill="none" stroke="${dk(c, .1)}" stroke-width="9" stroke-linecap="round"/><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .2, .16, .35, .3)}"/></g>
        <path d="M${100 + R - 6},84 Q${100 + R + 18},84 ${100 + R + 18},100" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${rim}" stroke-width="2.4"/>
        <circle cx="100" cy="100" r="${R - 7}" fill="${p.rg(c, .1, .22, .62, .64)}"/>`;
}
// peanut (skinned or with red skin)
function xinPeanut(p, x, y, s, r = 0, { c = '#e2b66a' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .36)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M0,${f(-s * .34)} L0,${f(s * .34)}" stroke="${dk(c, .25)}" stroke-width=".6"/><ellipse cx="${f(-s * .2)}" cy="${f(-s * .14)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// split chana / moong dal grains
function xinDalGrains(p, x, y, s, { n = 30, c = '#e8b83a', seed = 1, sz = 3 } = {}){
    const R = rng(p.id + 'dg' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, k = sz * (.8 + R() * .4); const w = R() < .5; out += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(w ? k : k * .78)}" ry="${f(w ? k * .78 : k)}" fill="${R() < .5 ? c : lt(c, .15)}" stroke="${dk(c, .25)}" stroke-width=".4"/>`; }
    return out;
}
// grated / small pieces of fresh coconut
function xinCoconut(p, x, y, s, { n = 20, seed = 1, sz = 1.6 } = {}){
    const R = rng(p.id + 'cc' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${smooth(ring(sz * (.7 + R() * .6), 5, .5, R, 1.6, .7))}" fill="#fdfbf3" stroke="#d9d0b8" stroke-width=".35"/>`; }
    return out;
}
// small leaves of methi (fenugreek)
function xinMethi(p, x, y, s, { n = 14, seed = 1 } = {}){
    const R = rng(p.id + 'me' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, c = R() < .5 ? '#2f6a1e' : '#3f7a26'; out += `<g ${T(cx, cy, R() * 360, .8 + R() * .5)}>${[-40, 40, 180].map(b => `<ellipse transform="rotate(${b}) translate(0 -4)" rx="2.6" ry="3.6" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".4"/>`).join('')}</g>`; }
    return `<g ${p.sh(.4)}>${out}</g>`;
}
// golden fried lump (pakora / kofta) with crumb
function xinPakora(p, x, y, s, r = 0, { c = '#c0782e', seed = 1 } = {}){
    const R = rng(p.id + 'pk' + seed + x + y);
    let lumps = '';
    for (let i = 0; i < 5; i++){ const a = R() * 6.28, d = s * .18; lumps += `<path ${T(Math.cos(a) * d, Math.sin(a) * d)} d="${smooth(ring(s * (.18 + R() * .08), 7, .4, R))}" fill="${p.g(lt(c, .1), .35, .25)}"/>`; }
    return `<g ${T(x, y)}><g ${p.crumb(.7)}><g transform="rotate(${f(r)})"><path d="${smooth(ring(s / 2, 11, .25, R, 1.1, .95))}" fill="${p.g(c, .25, .35)}" stroke="${dk(c, .4)}" stroke-width=".7"/>${lumps}</g></g>
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .1)},${f(-s * .34)} ${f(s * .14)},${f(-s * .28)}" stroke="#fff3d8" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// cashew
function xinCashew(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 14)}><path d="M-6,-3 Q-1,-7 5,-4 Q8,-1 6,3 Q4,5 2,3 Q2,0 -1,-1 Q-4,-1 -5,1 Q-8,0 -6,-3Z" fill="${p.g('#f0d8a0', .3, .25)}" stroke="#c4a060" stroke-width=".5"/></g>`;
}
// green cardamom pod / clove / bay leaf
function xinCardamom(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .3)}" fill="${p.g('#8aa84a', .3, .3)}" stroke="#55702a" stroke-width=".5"/><path d="M${f(-s * .4)},0 L${f(s * .4)},0" stroke="#5f7a30" stroke-width=".5"/></g>`;
}
function xinClove(x, y, r = 0){
    return `<g ${T(x, y, r)}><path d="M-4,0 L3,0" stroke="#4a2a14" stroke-width="1.4" stroke-linecap="round"/><circle cx="4" cy="0" r="1.8" fill="#5a3418"/></g>`;
}
function xinBay(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 30)}><path d="M-16,0 Q-6,-6 12,-2 Q16,0 12,2 Q-6,6 -16,0Z" fill="${p.g('#8a8a4a', .3, .3)}" stroke="#5a5a2a" stroke-width=".6"/><path d="M-15,0 L13,0" stroke="#b4b47a" stroke-width=".6"/></g>`;
}
// kokum (dried, dark purple)
function xinKokum(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 7, .35, rng(p.id + 'kk' + x + y), 1.3, .8))}" fill="${p.g('#5a1a2e', .2, .3)}" stroke="#2e0a16" stroke-width=".5"/></g>`;
}
// soya chunk: spongy nugget with pores
function xinSoya(p, x, y, s, r = 0, { c = '#a8642e' } = {}){
    const R = rng(p.id + 'sy' + x + y);
    let pores = '';
    for (let i = 0; i < 5; i++) pores += `<circle cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .5)}" r="${f(.6 + R() * .8)}" fill="${dk(c, .45)}" opacity=".7"/>`;
    return `<g ${T(x, y, r)}><g ${p.rough(1.4, .25)}>${xinChunk(p, 0, 0, s, 0, c, { seed: 'sy' + x + y, sx: 1.1, sy: .95, jit: .4, n: 8, gloss: .4, inner: .2 })}</g>${pores}</g>`;
}
// paneer with a light masala coat
function xinPaneerT(p, x, y, s, r = 0, tint = '#e8904a', op = .35){
    return `<g ${T(x, y, r)}>${xinPaneer(p, 0, 0, s, 0)}<rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${s}" rx="${f(s * .16)}" fill="${tint}" opacity="${op}"/><path d="M${f(-s / 2 + 2.5)},${f(-s / 2 + 2.5)} L${f(s / 2 - 3)},${f(-s / 2 + 2.5)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".8"/></g>`;
}
// pav: two soft buttered bread rolls baked together
function xinPav(p, x, y, s, r = 0){
    const roll = dx => `<rect x="${f(dx - s / 2)}" y="${f(-s / 2)}" width="${s}" height="${s}" rx="${f(s * .3)}" fill="${p.rg('#e8a24e', .3, .3, .4, .38)}" stroke="#a8601e" stroke-width=".8"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}>${roll(-s / 2)}${roll(s / 2)}</g>
        <path d="M0,${f(-s / 2 + 3)} L0,${f(s / 2 - 3)}" stroke="#f2d6a0" stroke-width="2" opacity=".8"/>
        <ellipse cx="${f(-s * .6)}" cy="${f(-s * .14)}" rx="${f(s * .18)}" ry="${f(s * .1)}" fill="#fff4cc" opacity=".55"/><ellipse cx="${f(s * .4)}" cy="${f(-s * .14)}" rx="${f(s * .18)}" ry="${f(s * .1)}" fill="#fff4cc" opacity=".55"/></g>`;
}
// vegetable baton (avial, pickle): L long, w wide
function xinBaton(p, x, y, L, w, r = 0, c = '#ee7a2a', { edge = null } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="${f(w * .35)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/>${edge ? `<rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${f(w * .3)}" rx="${f(w * .15)}" fill="${edge}"/>` : ''}<path d="M${f(-L / 2 + 2)},${f(-w * .18)} L${f(L / 2 - 3)},${f(-w * .18)}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".55"/></g>`;
}
// boondi: tiny fried gram-flour pearls
function xinBoondi(p, x, y, s, { n = 30, seed = 1, sz = 3.4 } = {}){
    const R = rng(p.id + 'bd' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, k = sz * (.85 + R() * .3); out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(k)}" fill="${p.rg(R() < .5 ? '#e8b456' : '#dca044', .3, .3, .35, .32)}" stroke="#9a5a1a" stroke-width=".4"/>`; }
    return `<g ${p.sh(.4)}>${out}</g>`;
}
// fried bitter gourd round
function xinKarela(p, x, y, s, r = 0){
    const R = rng(p.id + 'kr' + x + y);
    let seeds = '';
    for (let i = 0; i < 3; i++){ const a = i * 2.1 + R(); seeds += `<ellipse cx="${f(Math.cos(a) * s * .14)}" cy="${f(Math.sin(a) * s * .14)}" rx="${f(s * .1)}" ry="${f(s * .06)}" transform="rotate(${f(a * 57)} ${f(Math.cos(a) * s * .14)} ${f(Math.sin(a) * s * .14)})" fill="#d8b47a" stroke="#8a6a3a" stroke-width=".4"/>`; }
    return `<g ${T(x, y, r)}><g ${p.rough(2, .35)}><circle r="${f(s / 2)}" fill="${p.g('#3f5a1a', .2, .3)}"/></g><circle r="${f(s * .36)}" fill="${p.g('#8a8a32', .25, .3)}"/><circle r="${f(s * .36)}" fill="#8a5a1a" opacity=".35"/>${seeds}
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .32)} ${f(s * .14)},${f(-s * .28)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// fried round eggplant slice: purple skin rim, golden face
function xinBegun(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'bg' + seed + x + y);
    let sd = '', ch = '';
    for (let i = 0; i < 10; i++){ const a = i / 10 * 6.28 + R() * .3; sd += `<ellipse cx="${f(Math.cos(a) * s * .2)}" cy="${f(Math.sin(a) * s * .2)}" rx="1.2" ry=".8" fill="#8a5a1a" opacity=".6"/>`; }
    for (let i = 0; i < 5; i++) ch += `<ellipse cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .6)}" rx="${f(2 + R() * 3)}" ry="${f(1.2 + R() * 2)}" fill="#7a3a0e" opacity="${f(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y)}><g ${p.sh(.9)}><ellipse rx="${f(s / 2)}" ry="${f(s * .46)}" transform="rotate(${f(r)})" fill="${p.g('#4a1e46', .2, .3)}" stroke="#2a0e26" stroke-width=".6"/></g>
        <g ${p.crumb(.7)}><ellipse rx="${f(s * .44)}" ry="${f(s * .4)}" transform="rotate(${f(r)})" fill="${p.g('#dc9a34', .3, .3)}"/></g>${sd}${ch}
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .14)},${f(-s * .26)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// quartered button mushroom (cut face up)
function xinMushroom(p, x, y, s, r = 0, { tint = '#a8501e', op = .4 } = {}){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,2 Q-10,-9 0,-9 Q10,-9 10,2 Q6,3.4 4,3.4 L3,9 Q0,10 -3,9 L-4,3.4 Q-6,3.4 -10,2Z" fill="${p.g('#eedcbc', .3, .2)}" stroke="#7a4a22" stroke-width=".6"/>
        <path d="M-10,2 Q-10,-9 0,-9 Q10,-9 10,2" stroke="#8a5a30" stroke-width="2.4" fill="none"/>
        <path d="M-10,2 Q-10,-9 0,-9 Q10,-9 10,2 Q6,3.4 4,3.4 L3,9 Q0,10 -3,9 L-4,3.4 Q-6,3.4 -10,2Z" fill="${tint}" opacity="${op}"/>
        <path d="M-6,-4 Q-2,-7 3,-6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// soup surface: coloured liquid plus soft texture
function xinSoup(p, { R = 77, c = '#e0a93a', op = 1, tex = null, n = 14, seed = 's', smin = 6, smax = 14, top = .4, blur = 3 } = {}){
    return K.liquid(p, { R, c, op, shine: false }) + (tex ? xinTex(p, 100, 100, R - 2, tex, n, seed, smin, smax, top, blur) : '');
}
// dhokli: diamond-cut wheat dumpling
function xinDhokli(p, x, y, s, r = 0){
    const h = s / 2;
    return `<g ${T(x, y, r)}><path d="M0,${-h} L${f(h * .78)},0 L0,${h} L${f(-h * .78)},0Z" fill="${p.g('#efd08a', .3, .25)}" stroke="#b8904a" stroke-width="1.2" stroke-linejoin="round"/><circle cx="${f(-h * .2)}" cy="${f(-h * .1)}" r=".7" fill="#a8401c"/><circle cx="${f(h * .2)}" cy="${f(h * .2)}" r=".7" fill="#7a5a2a"/><path d="M${f(-h * .3)},${f(-h * .3)} L${f(h * .1)},${f(-h * .6)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// raisin
function xinRaisin(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .32)}" fill="${p.g('#7a3a1a', .25, .3)}" stroke="#4a1e0a" stroke-width=".4"/><path d="M${f(-s * .3)},0 Q0,${f(-s * .1)} ${f(s * .3)},0" stroke="#3a1606" stroke-width=".5" fill="none"/></g>`;
}
// tiny diced bit (one element, keeps the file small)
function xinBit(p, x, y, s, r = 0, c = '#ee7a2a', op = 1){
    return `<rect x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${s}" height="${s}" rx="${f(s * .25)}" transform="rotate(${Math.round(r)} ${f(x)} ${f(y)})" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".5"${op < 1 ? ` opacity="${op}"` : ''}/>`;
}
// noodles drawn as three combined paths (outline, body, highlights) to keep the file small
function xinNoodles(p, x, y, s, { c = '#f2d48a', w = 2.4, n = 26, seed = 1, sy = .9 } = {}){
    const R = rng(p.id + 'xnd' + seed);
    let all = '', hi = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.25 + R() * .72), a0 = R() * 6.28, sweep = 1.2 + R() * 2.2;
        const cx = x + (R() - .5) * s * .12, cy = y + (R() - .5) * s * .12;
        const d = smooth(Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .25); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; }), false);
        all += d; if (R() < .3) hi += d;
    }
    return `<g ${p.sh(.8)}><path d="${all}" stroke="${dk(c, .25)}" stroke-width="${f(w + 1)}" fill="none" stroke-linecap="round"/><path d="${all}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${hi}" stroke="${lt(c, .25)}" stroke-width="${f(w * .5)}" fill="none" stroke-linecap="round"/></g>`;
}

// =========================================================
// mains
// =========================================================
const D1 = {
    // butter chicken: charred tikka in a creamy orange makhani gravy, cream swirl, butter, kasuri methi; copper handi
    in_butterchicken: p => {
        const o = [xinHandi(p), xinGravy(p, { R: 81, c: '#d8682c', oil: '#ee8a34' })];
        o.push(xinTex(p, 100, 100, 78, ['#ee9a52', '#c4561e'], 10, 'bc', 6, 14, .35, 3));
        o.push(`<g ${p.sh(.8)}>`);
        xinSpots('bc', 10, 56, 25).forEach(([x, y, r], i) => o.push(xinTikka(p, x, y, 25, r, { seed: i, c: '#d86a2c' })));
        o.push('</g>');
        o.push(xinTex(p, 100, 100, 74, ['#de7434', '#e8803a'], 10, 'bc2', 3, 6, .6));
        o.push(xinSwirl(p, 98, 102, 54, { c: '#fff6e6', w: 3.4 }));
        o.push(xinButter(p, 108, 92, 15, 18));
        o.push(K.sprinkle(p, 100, 100, 130, { c: '#5a6a2a', n: 30, r: .9 }));
        o.push(xinCoriander(p, 92, 106, 50, { n: 6 }));
        return o.join('');
    },

    // chicken dum biryani: long basmati, white and saffron-orange, bone-in chicken, egg, birista, mint; brass handi
    in_chickenbiryani: p => {
        const o = [xinHandi(p)];
        o.push(xinBasmati(p, 100, 100, 162, { seed: 1, tint: '#f8f2e2', n: 140 }));
        [[70, 76, 62, '#f0a030'], [132, 122, 64, '#e8782a'], [130, 70, 50, '#f4c444'], [72, 132, 54, '#ec8a2c'], [104, 104, 50, '#f2b83a'], [100, 152, 36, '#f4c444'], [150, 92, 30, '#ec8a2c']].forEach(([x, y, s, t], i) => o.push(`<path ${T(x, y)} d="${smooth(ring(s / 2, 9, .4, rng('bp' + i)))}" fill="${t}" opacity=".85" ${xinBlur(p, 3)}/>`, xinBasmati(p, x, y, s, { seed: 10 + i, tint: t, base: false, n: Math.round(s * s / 110) })));
        o.push(`<g ${p.sh(1)}>`);
        o.push(xinChicken(p, 74, 100, 40, 200, { c: '#a8481c', seed: 1, bone: true }));
        o.push(xinChicken(p, 122, 86, 40, -30, { c: '#b0501e', seed: 2, bone: true }));
        o.push(xinChicken(p, 106, 134, 36, 80, { c: '#9c4018', seed: 3 }));
        o.push('</g>');
        o.push(xinEggHalf(p, 84, 64, 34, -20), xinEggHalf(p, 140, 120, 32, 30));
        o.push(xinBirista(p, 100, 100, 130, { n: 24 }));
        [[60, 120, 20], [96, 76, -40], [134, 64, 70], [126, 146, 10], [92, 110, 140]].forEach(([x, y, r]) => o.push(xinMint(p, x, y, 13, r)));
        o.push(xinCoriander(p, 110, 96, 50, { n: 4, seed: 2 }));
        return o.join('');
    },

    // tandoori chicken legs on onion rings with lemon wedges; white plate
    in_tandoori: p => {
        const o = [K.plate(p, { rim: '#b8862a', well: .78 })];
        o.push(`<g ${p.sh(.4)}>`);
        xinSpots('td-o', 18, 62, 15).forEach(([x, y, r]) => o.push(xinRing(p, x, y, 22 + (r % 10), r, { c: '#c06090', w: 1.6 })));
        o.push('</g>');
        o.push(xinLeg(p, 76, 74, 92, 40, { seed: 1 }));
        o.push(xinLeg(p, 130, 92, 92, 160, { seed: 2 }));
        o.push(xinLeg(p, 88, 130, 90, -70, { seed: 3, c: '#c63e22' }));
        o.push(K.lemon(p, 148, 136, 26, -40), K.lemon(p, 50, 112, 24, 100));
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#6a2a10', n: 24, r: .8 }));
        o.push(xinCoriander(p, 104, 104, 40, { n: 5 }));
        return o.join('');
    },

    // rogan josh: deep red Kashmiri gravy with a layer of red oil, bone-in mutton; white ceramic bowl
    in_roganjosh: p => {
        const o = [K.bowl(p, { glaze: '#efe9de', inside: '#f7f3ea' }), xinGravy(p, { R: 78, c: '#8a2416', oil: '#c4301a' })];
        o.push(xinTex(p, 100, 100, 74, ['#c23a1c', '#6a1a0e'], 14, 'rj', 6, 14, .4, 3));
        o.push(`<g ${p.sh(1)}>`);
        xinSpots('rj', 8, 52, 28).forEach(([x, y, r], i) => o.push(xinMutton(p, x, y, 31, r, { seed: i, bone: i % 3 === 0, c: '#94401f' })));
        o.push('</g>');
        o.push(xinOil(p, 100, 100, 140, { n: 14, c: '#d8361a', op: .65, rmax: 3.4 }));
        o.push(xinCardamom(p, 70, 128, 10, 30), xinBay(p, 134, 132, 26, -30), xinClove(126, 66, 40));
        o.push(xinShine(100, 100, 78, .5));
        return o.join('');
    },

    // pork vindaloo: dark chili-vinegar gravy, fatty pork cubes, onion, garlic, dried chilies; clay pot
    in_vindaloo: p => {
        const o = [xinClay(p), xinGravy(p, { R: 77, c: '#8c2c16', oil: '#c4421c' })];
        o.push(xinTex(p, 100, 100, 72, ['#a83a1a', '#5e1a0c'], 14, 'vd', 6, 12, .45, 2.5));
        o.push(`<g ${p.sh(.9)}>`);
        xinSpots('vd', 11, 56, 23).forEach(([x, y, r]) => o.push(xinPorkCube(p, x, y, 22, r)));
        o.push('</g>');
        xinSpots('vd-o', 6, 58, 20).forEach(([x, y, r]) => o.push(K.onion(p, x, y, 15, r, { c: '#c9804a' })));
        o.push(xinGarlic(p, 100, 100, 90, { n: 6 }));
        o.push(xinRedChili(p, 128, 76, 26, 30), xinRedChili(p, 70, 120, 24, -50));
        o.push(xinOil(p, 100, 100, 140, { n: 10, c: '#d8461c', op: .6 }));
        o.push(xinShine(100, 100, 77, .4));
        return o.join('');
    },

    // tawa fish fry: masala-crusted fish steaks, lemon, onion rings, curry leaves; plate with a green rim
    in_fishfry: p => {
        const o = [K.plate(p, { rim: '#3f7a3a', well: .78 })];
        o.push(`<g ${p.sh(.4)}>`);
        [[60, 132, 24, 0], [144, 70, 22, 40]].forEach(([x, y, s, r]) => o.push(xinRing(p, x, y, s, r, { c: '#c06090' }), xinRing(p, x + 3, y + 2, s * .7, r, { c: '#c06090' })));
        o.push('</g>');
        o.push(xinFryFish(p, 78, 80, 58, 20, { seed: 1 }));
        o.push(xinFryFish(p, 126, 104, 60, -25, { seed: 2 }));
        o.push(xinFryFish(p, 88, 132, 54, 10, { seed: 3 }));
        o.push(K.lemon(p, 140, 140, 28, -30), K.lemon(p, 52, 92, 24, 110));
        [[110, 66, 20], [60, 64, -40], [146, 112, 70]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 16, r)));
        return o.join('');
    },

    // prawn masala: curled prawns in thick onion-tomato masala, curry leaves; iron kadai
    in_prawnmasala: p => {
        const o = [xinKadai(p), xinGravy(p, { R: 74, c: '#b4441c', oil: '#dc6424' })];
        o.push(xinTex(p, 100, 100, 72, ['#c8582a', '#8e2e12', '#d87a3a'], 22, 'pm', 4, 9, .55, 1.5));
        o.push(`<g ${p.sh(.8)}>`);
        xinSpots('pm', 12, 54, 20).forEach(([x, y, r]) => o.push(K.shrimp(p, x, y, 25, r, { c: '#ea7444' })));
        o.push('</g>');
        o.push(xinTex(p, 100, 100, 66, ['#b4441c'], 10, 'pm2', 2, 5, .55));
        o.push(xinOil(p, 100, 100, 130, { n: 9, c: '#e46a22', op: .55 }));
        [[96, 96, 20], [64, 84, -40], [136, 112, 70]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 15, r)));
        o.push(xinCoriander(p, 110, 110, 60, { n: 6 }));
        return o.join('');
    },

    // anda bhurji: turmeric scrambled eggs with onion, tomato, green chili, coriander; black pan
    in_andabhurji: p => {
        const o = [xinPan(p)];
        o.push(`<g ${p.sh(.8)}><path d="${smooth(ring(64, 18, .16, rng('ab')))}" transform="translate(100 100)" fill="${p.rg('#e8b438', .2, .2)}"/></g>`);
        { const R = rng('abc'), cols = ['#f8d65e', '#f4c640', '#fbe796', '#d9a028', '#fff2c0']; let g = '';
          for (let i = 0; i < 110; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 60, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; g += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2.6 + R() * 2.6)}" ry="${f(1.8 + R() * 1.6)}" transform="rotate(${Math.round(R() * 180)} ${f(x)} ${f(y)})" fill="${cols[Math.floor(R() * 5)]}"/>`; }
          o.push(g); }
        xinSpots('ab-t', 12, 56, 15).forEach(([x, y, r]) => o.push(xinBit(p, x, y, 6.5, r, '#d8402a')));
        xinSpots('ab-o', 10, 56, 15).forEach(([x, y, r]) => o.push(xinSaladDice(p, x, y, 6, r, 'oni')));
        o.push(xinChiliRings(p, 100, 100, 100, { n: 7 }));
        o.push(K.sprinkle(p, 100, 100, 110, { c: '#b8401c', n: 20, r: .7 }));
        o.push(xinCoriander(p, 100, 100, 100, { n: 10, seed: 3 }));
        return o.join('');
    },

    // Indo-Chinese egg fried rice: lightly soy-tinted basmati, egg, carrot, capsicum, spring onion; white plate
    in_eggfriedrice: p => {
        const o = [K.plate(p, { rim: '#c43a2a', well: .78 })];
        o.push(xinBasmati(p, 100, 100, 150, { seed: 2, tint: '#ecd6a6', n: 170 }));
        o.push(`<g ${p.sh(.5)}>`);
        xinSpots('efr-e', 11, 58, 20).forEach(([x, y], i) => o.push(K.scrambled(p, x, y, 13, { c: i % 2 ? '#f6cf4a' : '#fbe8a8', seed: i, n: 3 })));
        xinSpots('efr-c', 14, 60, 14).forEach(([x, y, r]) => o.push(xinBit(p, x, y, 6.5, r, '#ee7a2a')));
        xinSpots('efr-p', 12, 60, 14).forEach(([x, y, r]) => o.push(xinBit(p, x, y, 7, r, '#4c9a2e')));
        o.push('</g>');
        o.push(K.scallions(p, 100, 100, 120, { n: 26, c: '#5aa83a' }));
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#2a1a12', n: 20, r: .6 }));
        return o.join('');
    },

    // chole: chickpeas in dark spiced gravy, raw onion rings, slit green chili, ginger, coriander; brass katori
    in_chole: p => {
        const o = [xinSteel(p, { c1: '#f8e4a4', c2: '#b88a2e' }), xinGravy(p, { R: 77, c: '#6e3416', oil: '#a8501c' })];
        o.push(xinTex(p, 100, 100, 72, ['#8a4a20', '#4e2210'], 12, 'ch', 6, 12, .4, 2.5));
        o.push(`<g ${p.sh(.6)}>`);
        xinSpots('chole', 32, 64, 14).forEach(([x, y, r]) => o.push(xinChana(p, x, y, 15, r, { c: r % 3 ? '#c4904a' : '#d2a660' })));
        o.push('</g>');
        o.push(`<g ${p.sh(.4)}>${xinRing(p, 92, 92, 30, 20, { c: '#c06090' })}${xinRing(p, 96, 94, 20, 20, { c: '#c06090' })}</g>`);
        o.push(xinGreenChili(p, 124, 110, 28, -30, { slit: true }));
        o.push(K.gingerShreds(p, 102, 106, 30));
        o.push(xinCoriander(p, 84, 112, 40, { n: 6 }));
        return o.join('');
    },
};

const D2 = {
    // soya chunks curry with potato in a red-brown gravy; ochre ceramic bowl
    in_soyacurry: p => {
        const o = [K.bowl(p, { glaze: '#c08a3a', inside: '#f4ede0' }), xinGravy(p, { R: 78, c: '#9c461c', oil: '#c8601e' })];
        o.push(xinTex(p, 100, 100, 74, ['#b4582a', '#7a3412'], 12, 'sy', 6, 12, .4, 2.5));
        o.push(`<g ${p.sh(.8)}>`);
        const sp = xinSpots('soya', 17, 60, 18.5);
        sp.forEach(([x, y, r], i) => o.push(i % 4 === 3 ? xinDice(p, x, y, 16, r, '#e8b24a') : xinSoya(p, x, y, 21, r)));
        o.push('</g>');
        o.push(xinOil(p, 100, 100, 140, { n: 9, c: '#d8641e', op: .55 }));
        o.push(xinCoriander(p, 100, 100, 60, { n: 7 }));
        return o.join('');
    },

    // moong dal khichdi: soft yellow rice-lentil porridge, ghee pool, peas, cumin; blue-glazed bowl
    in_khichdi: p => {
        const o = [K.bowl(p, { glaze: '#3d6b8c', inside: '#f4efe4' }), K.liquid(p, { R: 78, c: '#e6bc4c', op: 1, shine: false })];
        o.push(xinTex(p, 100, 100, 76, ['#f6dc84', '#d8a432', '#f0cc66'], 26, 'kh', 4, 9, .6, 1.2));
        const R = rng('khg');
        let g = '';
        for (let i = 0; i < 70; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 70, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; g += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.5" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="${R() < .5 ? '#fbeeb8' : '#f4d880'}" opacity=".9"/>`; }
        o.push(g);
        o.push(`<path d="${smooth(ring(30, 10, .35, rng('ghee'), 1.3, .85))}" transform="translate(98 96)" fill="#f8c838" opacity=".45"/><path d="M76,90 Q86,80 100,82" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`);
        o.push(xinOil(p, 98, 96, 70, { n: 10, c: '#f6c238', op: .7, rmax: 2.6 }));
        o.push(xinPeas(p, 100, 100, 130, { n: 18, sz: 5.5 }));
        xinSpots('kh-t', 6, 60, 20).forEach(([x, y, r]) => o.push(xinDice(p, x, y, 6, r, '#d8402a', { op: .85 })));
        o.push(xinSeeds(p, 98, 96, 60, { n: 18, kind: 'cumin' }));
        o.push(xinCoriander(p, 114, 112, 40, { n: 4 }));
        return o.join('');
    },

    // matar paneer: paneer cubes and green peas in tomato-onion gravy, cream; steel katori
    in_matarpaneer: p => {
        const o = [xinSteel(p), xinGravy(p, { R: 77, c: '#c4542a', oil: '#e2702a' })];
        o.push(xinTex(p, 100, 100, 72, ['#d86a34', '#a8401c'], 10, 'mp', 6, 12, .4, 2.5));
        xinSpots('mp', 9, 54, 25).forEach(([x, y, r]) => o.push(xinPaneerT(p, x, y, 20, r, '#e8904a', .3)));
        o.push(xinPeas(p, 100, 100, 140, { n: 34, sz: 6.5 }));
        o.push(xinSwirl(p, 100, 100, 36, { c: '#fff6ea', w: 2.4, turns: 1.3 }));
        o.push(xinOil(p, 100, 100, 140, { n: 8, c: '#e2702a', op: .5 }));
        o.push(xinCoriander(p, 96, 104, 50, { n: 5 }));
        return o.join('');
    },

    // kadai paneer: semi-dry masala with paneer, capsicum and onion squares, crushed chili; iron kadai
    in_kadaipaneer: p => {
        const o = [xinKadai(p), xinGravy(p, { R: 73, c: '#a8401c', oil: '#c8521e' })];
        o.push(xinTex(p, 100, 100, 70, ['#c0582a', '#7a2a10', '#d0702e'], 18, 'kp', 4, 9, .55, 1.4));
        o.push(`<g ${p.sh(.7)}>`);
        const sp = xinSpots('kp', 20, 56, 17);
        sp.forEach(([x, y, r], i) => o.push(i % 2 === 0 ? xinPaneerT(p, x, y, 18, r, '#d8702a', .4)
            : i % 4 === 1 ? K.pepperPiece(p, x, y, 18, r, { c: '#3f8a2a' })
                : `<g ${T(x, y, r)}><rect x="-7" y="-7" width="14" height="14" rx="3" fill="${p.g('#efdcc0', .3, .2)}" stroke="#c8a888" stroke-width=".6"/><path d="M-5,-2 L5,-2" stroke="#fff" stroke-width=".8" opacity=".7"/></g>`));
        o.push('</g>');
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#8a1a10', n: 30, r: 1 }));
        o.push(xinCoriander(p, 100, 100, 70, { n: 7 }));
        return o.join('');
    },

    // dum aloo: whole baby potatoes in a deep red yogurt gravy; steel katori
    in_dumaloo: p => {
        const o = [xinSteel(p), xinGravy(p, { R: 77, c: '#b03c1c', oil: '#d8521e' })];
        o.push(xinTex(p, 100, 100, 72, ['#c8502a', '#7e2410'], 10, 'da', 6, 12, .4, 2.5));
        o.push(`<g ${p.sh(1)}>`);
        xinSpots('dumaloo', 9, 52, 30).forEach(([x, y, r]) => o.push(`<g ${T(x, y, r)}><ellipse rx="15" ry="13" fill="${p.rg('#d27a38', .3, .3, .36, .34)}" stroke="#8a3412" stroke-width=".7"/><ellipse cx="3" cy="4" rx="11" ry="8" fill="#b03c1c" opacity=".45"/><circle cx="-2" cy="-3" r=".9" fill="#7a2a10"/><circle cx="4" cy="-5" r=".9" fill="#7a2a10"/><circle cx="-6" cy="2" r=".9" fill="#7a2a10"/><ellipse cx="-6" cy="-6" rx="4" ry="2" fill="#fff" opacity=".55" transform="rotate(-30 -6 -6)"/></g>`));
        o.push('</g>');
        o.push(xinOil(p, 100, 100, 140, { n: 10, c: '#e05a1e', op: .6 }));
        o.push(xinCoriander(p, 100, 100, 50, { n: 5 }));
        return o.join('');
    },

    // malai kofta: golden paneer-potato koftas in a creamy cashew gravy, cream, cashews; white deep bowl
    in_malaikofta: p => {
        const o = [K.bowl(p, { glaze: '#dcd2c2', inside: '#f6f2ea' }), xinGravy(p, { R: 78, c: '#e48a46', oil: '#f0a050' })];
        o.push(xinTex(p, 100, 100, 74, ['#f2a868', '#d0702e'], 10, 'mk', 6, 12, .35, 3));
        o.push(`<g ${p.sh(1)}>`);
        [[72, 80], [120, 68], [136, 112], [100, 136], [62, 122], [100, 102]].forEach(([x, y], i) => o.push(K.meatball(p, x, y, 36, { c: '#c27a2e' }), `<path d="M${x - 9},${y + 4} Q${x},${y + 12} ${x + 10},${y + 3}" stroke="#e48a46" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`));
        o.push('</g>');
        o.push(xinSwirl(p, 100, 100, 130, { c: '#fff8ee', w: 2.4, turns: 1.05, r: 1, op: .8 }));
        o.push(xinCashew(p, 100, 64, 12, 20), xinCashew(p, 140, 100, 12, 110), xinCashew(p, 62, 102, 12, -40));
        o.push(xinCoriander(p, 100, 138, 30, { n: 4 }));
        return o.join('');
    },

    // South Indian veg kurma: pale coconut gravy with carrot, potato, beans, peas, cauliflower; green-glazed bowl
    in_vegkurma: p => {
        const o = [K.bowl(p, { glaze: '#5f8a5a', inside: '#f0f0e6' }), xinGravy(p, { R: 78, c: '#e8cf92', oil: '#ecc070' })];
        o.push(xinTex(p, 100, 100, 74, ['#f4e2b4', '#d6b46a'], 10, 'vk', 6, 12, .4, 2.5));
        o.push(`<g ${p.sh(.6)}>`);
        const sp = xinSpots('vk', 34, 64, 13.5);
        sp.forEach(([x, y, r], i) => o.push([xinDice(p, x, y, 12, r, '#ee7a2a'), xinDice(p, x, y, 14, r, '#f0d48a'), K.greenBean(p, x, y, 17, r), xinCauli(p, x, y, 19, r, { c: '#f4e6b4' })][i % 4]));
        o.push('</g>');
        o.push(xinPeas(p, 100, 100, 130, { n: 18, sz: 5.5 }));
        [[80, 90, 20], [126, 112, -50], [104, 70, 100]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 16, r)));
        return o.join('');
    },

    // pav bhaji: buttery red vegetable mash with butter, onion, coriander, lemon, and buttered pav; steel thali
    in_pavbhaji: p => {
        const o = [xinThali(p)];
        o.push(`<g ${p.sh(.8)}><path d="${smooth(ring(60, 12, .12, rng('pb'), 1.1, .95))}" transform="translate(82 88)" fill="${p.rg('#c2441e', .2, .25)}"/></g>`);
        o.push(xinTex(p, 82, 88, 58, ['#d85a2a', '#9a2e12', '#e0703a'], 24, 'pb', 4, 9, .6, 1.2));
        o.push(xinOil(p, 82, 88, 96, { n: 9, c: '#e8601e', op: .55 }));
        o.push(xinButter(p, 86, 80, 22, 12));
        xinSpots('pb-o', 14, 18, 8, 58, 112).forEach(([x, y, r]) => o.push(xinSaladDice(p, x, y, 7, r, 'oni')));
        o.push(xinCoriander(p, 92, 106, 40, { n: 6 }), xinCoriander(p, 66, 72, 30, { n: 4, seed: 2 }));
        o.push(xinPav(p, 136, 140, 38, -30));
        o.push(K.lemon(p, 146, 78, 32, 40));
        return o.join('');
    },

    // lemon rice: turmeric-yellow rice with peanuts, chana dal, mustard seeds, curry leaves, chilies; banana leaf
    in_lemonrice: p => {
        const o = [xinLeaf(p)];
        o.push(xinBasmati(p, 98, 106, 156, { seed: 3, tint: '#f4d24a', n: 240, sy: .8 }));
        o.push(`<g ${p.sh(.5)}>`);
        xinSpots('lr-p', 14, 54, 14, 98, 106, .82).forEach(([x, y, r]) => o.push(xinPeanut(p, x, y, 9, r, { c: r % 2 ? '#d8a45a' : '#a85a36' })));
        o.push('</g>');
        o.push(xinDalGrains(p, 98, 106, 100, { n: 18, c: '#e8a83a', sz: 2.4 }));
        o.push(xinSeeds(p, 98, 106, 110, { n: 30 }));
        [[72, 94, 20], [120, 90, -40], [110, 128, 100], [80, 122, 160], [96, 80, 60]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 17, r)));
        o.push(xinRedChili(p, 128, 112, 24, 30), xinGreenChili(p, 76, 110, 24, -30, { slit: true }));
        o.push(K.lemon(p, 160, 150, 30, -30));
        o.push(xinCoriander(p, 104, 104, 40, { n: 4 }));
        return o.join('');
    },

    // veg hakka noodles: soy-tinted noodles with cabbage, carrot, capsicum and spring onion; red Chinese bowl
    in_hakkanoodles: p => {
        const o = [K.bowl(p, { glaze: '#b8322a', inside: '#f6f2ea' })];
        o.push(xinNoodles(p, 100, 100, 146, { c: '#d8a65e', w: 3.6, n: 40, seed: 2, sy: .95 }));
        o.push(`<g ${p.sh(.4)}>`);
        o.push(K.shreds(p, 100, 100, 110, { c: '#d6e8a8', n: 18, w: 3.4, len: .24, seed: 3, curve: .5 }));
        o.push(K.shreds(p, 100, 100, 110, { c: '#ee7a2a', n: 16, w: 2.8, len: .22, seed: 4 }));
        o.push(K.shreds(p, 100, 100, 110, { c: '#3f8a2a', n: 12, w: 3, len: .22, seed: 5 }));
        o.push('</g>');
        o.push(K.scallions(p, 100, 100, 100, { n: 18, c: '#5aa83a' }));
        o.push(K.sprinkle(p, 100, 100, 110, { c: '#2a1a12', n: 16, r: .6 }));
        return o.join('');
    },

    // jeera aloo: turmeric potato cubes tossed with cumin seeds, chili, coriander; steel plate
    in_jeeraaloo: p => {
        const o = [xinThali(p, { R: 93 })];
        o.push(`<path d="${smooth(ring(66, 12, .12, rng('ja')))}" transform="translate(100 100)" fill="#d9a63a" opacity=".35"/>`);
        o.push(`<g ${p.sh(.7)}>`);
        xinSpots('jeera', 24, 58, 17.5).forEach(([x, y, r], i) => o.push(xinDice(p, x, y, 19, r, i % 3 ? '#efc04a' : '#e6ae38')));
        o.push('</g>');
        o.push(xinSeeds(p, 100, 100, 130, { n: 50, kind: 'cumin' }));
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#b8401c', n: 20, r: .7 }));
        o.push(xinChiliRings(p, 100, 100, 100, { n: 6 }));
        o.push(xinCoriander(p, 100, 100, 110, { n: 10 }));
        return o.join('');
    },
};

// =========================================================
// sides
// =========================================================
const D3 = {
    // boondi raita: chilled yogurt with fried boondi, roasted cumin and chili powder, mint; steel katori
    in_boondiraita: p => {
        const o = [xinSteel(p), `<circle cx="100" cy="100" r="77" fill="${p.rg('#fbf8f0', .2, .1)}"/>`];
        o.push(xinTex(p, 100, 100, 74, ['#efe8d8', '#ffffff'], 10, 'br', 8, 16, .5, 3));
        o.push(xinBoondi(p, 100, 100, 140, { n: 130, sz: 3.3 }));
        o.push(K.sprinkle(p, 106, 96, 50, { c: '#7a4a22', n: 30, r: .9 }));
        o.push(K.sprinkle(p, 90, 108, 34, { c: '#c8301c', n: 14, r: .8 }));
        [[92, 88, -20], [100, 82, 30], [96, 96, 110]].forEach(([x, y, r]) => o.push(xinMint(p, x, y, 13, r)));
        o.push(xinShine(100, 100, 77, .5));
        return o.join('');
    },

    // mint-coriander green chutney: bright green, lightly coarse; cream ceramic bowl
    in_pudinachutney: p => {
        const o = [K.kobachi(p, { glaze: '#d9cfc0', inside: '#f4efe6' }), K.liquid(p, { R: 76, c: '#3f8e2a', op: 1, shine: false })];
        o.push(xinTex(p, 100, 100, 74, ['#2c6e1c', '#6ab248', '#4fa034'], 30, 'pc', 2.5, 6, .55, .6));
        o.push(K.sprinkle(p, 100, 100, 140, { c: '#1e4a12', n: 30, r: .8 }));
        o.push(`<g ${p.sh(.5)}>${[[108, 92, -20], [118, 98, 40], [112, 106, 120]].map(([x, y, r]) => xinMint(p, x, y, 18, r)).join('')}</g>`);
        o.push(K.lemon(p, 78, 116, 26, -30));
        o.push(xinShine(100, 100, 76, .55));
        return o.join('');
    },

    // coconut chutney with a mustard-seed, curry-leaf, red-chili tadka; steel katori
    in_coconutchutney: p => {
        const o = [xinSteel(p), `<circle cx="100" cy="100" r="77" fill="${p.rg('#f6f2e2', .2, .12)}"/>`];
        o.push(xinTex(p, 100, 100, 74, ['#e8e0c8', '#ffffff'], 26, 'cc', 3, 7, .6, .8));
        o.push(xinCoconut(p, 100, 100, 140, { n: 30 }));
        o.push(`<path d="${smooth(ring(40, 10, .4, rng('cct'), 1.2, .9))}" transform="translate(102 98)" fill="#e8b84a" opacity=".4"/>`);
        o.push(xinSeeds(p, 102, 98, 84, { n: 44 }));
        o.push(xinDalGrains(p, 102, 98, 70, { n: 12, c: '#f2e6c8', sz: 2 }));
        [[86, 88, 20], [116, 88, -60], [100, 116, 100], [124, 112, 160], [78, 110, 60]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 20, r)));
        o.push(xinRedChili(p, 104, 98, 26, 30));
        return o.join('');
    },

    // South Indian tomato chutney: thick red-orange with an oil sheen and tadka; white ceramic bowl
    in_tomatochutney: p => {
        const o = [K.bowl(p, { glaze: '#efe9de', inside: '#f7f3ea' }), K.liquid(p, { R: 78, c: '#a82e18', op: 1, shine: false })];
        o.push(xinTex(p, 100, 100, 76, ['#c8481e', '#7e1e0c', '#d0582a'], 34, 'tc', 3, 6, .6, .6));
        o.push(K.sprinkle(p, 100, 100, 146, { c: '#6a1408', n: 60, r: .9 }));
        o.push(K.sprinkle(p, 100, 100, 146, { c: '#e8804a', n: 40, r: 1.1 }));
        o.push(xinOil(p, 100, 100, 130, { n: 5, c: '#e8702a', op: .45 }));
        o.push(xinSeeds(p, 100, 98, 60, { n: 28 }));
        [[90, 90, 20], [112, 94, -60], [100, 112, 100]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 18, r)));
        o.push(xinRedChili(p, 106, 102, 24, -30));
        o.push(xinShine(100, 100, 78, .3));
        return o.join('');
    },

    // avial: vegetable batons in a thick coconut-yogurt coat, curry leaves, coconut oil; banana leaf
    in_avial: p => {
        const o = [xinLeaf(p)];
        o.push(`<g ${p.sh(.8)}><path d="${smooth(ring(64, 12, .14, rng('av'), 1.18, .86))}" transform="translate(100 104)" fill="${p.rg('#f0e4bc', .2, .2)}"/></g>`);
        o.push(`<g ${p.sh(.5)}>`);
        xinSpots('avial', 34, 62, 12, 100, 104, .8).forEach(([x, y, r], i) => o.push([
            xinBaton(p, x, y, 26, 7, r, '#e8e4b4', { edge: '#5a8a2a' }),
            xinBaton(p, x, y, 24, 6, r, '#ee7a2a'),
            xinBaton(p, x, y, 26, 5, r, '#4f9a34'),
            xinDrumstick(p, x, y, 24, r),
            xinBaton(p, x, y, 24, 7, r, '#f4ecd4')][i % 5]));
        o.push('</g>');
        o.push(xinTex(p, 100, 104, 62, ['#f2e6c0', '#fbf6e4'], 22, 'av2', 4, 8, .5, 0, .82));
        o.push(xinCoconut(p, 100, 104, 110, { n: 24 }));
        [[80, 92, 20], [122, 96, -50], [104, 120, 100], [96, 78, 150]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 18, r)));
        o.push(xinOil(p, 100, 104, 100, { n: 6, c: '#f4e08a', op: .55 }));
        return o.join('');
    },

    // instant gajar mirch achar: carrot sticks and fat green chilies in mustard masala and oil; glazed pickle bowl
    in_gajarachar: p => {
        const o = [K.kobachi(p, { glaze: '#c9a46a', inside: '#f2ead8' }), K.liquid(p, { R: 76, c: '#d49a2a', op: 1, shine: false })];
        o.push(xinTex(p, 100, 100, 74, ['#e8b43a', '#b87a1a'], 14, 'ga', 5, 10, .5, 2));
        o.push(`<g ${p.sh(.6)}>`);
        xinSpots('gajar', 22, 60, 15).forEach(([x, y, r], i) => o.push(i % 3 === 2 ? xinGreenChili(p, x, y, 30, r, { slit: true, c: '#6aa83a' }) : xinBaton(p, x, y, 30, 7.5, r, '#ec7428')));
        o.push('</g>');
        o.push(K.sprinkle(p, 100, 100, 140, { c: '#f2d060', n: 40, r: 1.2 }));
        o.push(K.sprinkle(p, 100, 100, 140, { c: '#8a1a10', n: 20, r: .8 }));
        o.push(xinOil(p, 100, 100, 140, { n: 10, c: '#e8b030', op: .55 }));
        return o.join('');
    },

    // lauki sabzi: soft pale-green bottle gourd cubes with tomato in a light turmeric gravy; steel katori
    in_laukisabzi: p => {
        const o = [xinSteel(p), xinGravy(p, { R: 77, c: '#d6ae48', oil: '#e4a432' })];
        o.push(`<g ${p.sh(.6)}>`);
        xinSpots('lauki', 22, 60, 16).forEach(([x, y, r]) => o.push(xinDice(p, x, y, 17, r, '#d4e2a0')));
        o.push('</g>');
        xinSpots('lk-t', 8, 58, 18).forEach(([x, y, r]) => o.push(`<path ${T(x, y, r)} d="${smooth(ring(5, 7, .5, rng('lkt' + x), 1.3, .8))}" fill="#d8402a" stroke="#a5241a" stroke-width=".5"/>`));
        o.push(xinSeeds(p, 100, 100, 120, { n: 26, kind: 'cumin' }));
        o.push(xinGreenChili(p, 120, 84, 26, 30, { slit: true }));
        o.push(xinCoriander(p, 96, 104, 80, { n: 9 }));
        return o.join('');
    },

    // aloo methi: potato cubes tossed with lots of fenugreek leaves; steel katori
    in_aloomethi: p => {
        const o = [xinSteel(p, { c1: '#f8e4a4', c2: '#b88a2e' }), `<circle cx="100" cy="100" r="76" fill="${p.rg('#d0a440', .2, .3)}" opacity=".7"/>`];
        o.push(`<g ${p.sh(.7)}>`);
        xinSpots('am', 16, 56, 20).forEach(([x, y, r]) => o.push(xinDice(p, x, y, 18, r, '#e8b840')));
        o.push('</g>');
        o.push(xinMethi(p, 100, 100, 140, { n: 34 }));
        o.push(xinSeeds(p, 100, 100, 120, { n: 20, kind: 'cumin' }));
        o.push(xinGarlic(p, 100, 100, 100, { n: 5 }));
        return o.join('');
    },

    // karela fry: crisp fried bitter gourd rounds with browned onions; white plate
    in_karelafry: p => {
        const o = [K.plate(p, { rim: '#2c4c7c', well: .78 })];
        o.push(`<g ${p.sh(.5)}>`);
        xinSpots('kr-o', 12, 60, 18).forEach(([x, y, r]) => o.push(K.onion(p, x, y, 18, r, { c: '#b87a3a' })));
        xinSpots('karela', 25, 62, 17.5).forEach(([x, y, r]) => o.push(xinKarela(p, x, y, 23, r)));
        o.push('</g>');
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#8a2a10', n: 24, r: .8 }));
        return o.join('');
    },

    // khatta meetha kaddu: glossy sweet-sour pumpkin with skin, fenugreek seeds, chili; steel katori
    in_khattakaddu: p => {
        const o = [xinSteel(p), xinGravy(p, { R: 76, c: '#d6801e', oil: '#e8962a' })];
        o.push(xinTex(p, 100, 100, 72, ['#f0a640', '#b8641a'], 14, 'kk', 5, 10, .5, 2));
        o.push(`<g ${p.sh(.7)}>`);
        xinSpots('kaddu', 16, 58, 21).forEach(([x, y, r]) => o.push(K.kabocha(p, x, y, 25, r)));
        o.push('</g>');
        o.push(xinOil(p, 100, 100, 130, { n: 10, c: '#f0a030', op: .55 }));
        o.push(xinSeeds(p, 100, 100, 110, { n: 18, kind: 'cumin' }));
        o.push(xinRedChili(p, 118, 86, 22, 40));
        o.push(xinCoriander(p, 92, 108, 60, { n: 6 }));
        return o.join('');
    },
};

const D4 = {
    // gajar matar: diced carrots and green peas with cumin and coriander; blue-glazed bowl
    in_gajarmatar: p => {
        const o = [K.bowl(p, { glaze: '#2f6a8a', inside: '#f4f0e6' }), `<circle cx="100" cy="100" r="78" fill="${p.rg('#d89a3a', .2, .3)}" opacity=".5"/>`];
        o.push(`<g ${p.sh(.6)}>`);
        xinSpots('gm', 34, 64, 12.5).forEach(([x, y, r]) => o.push(xinDice(p, x, y, 13, r, '#ec7428')));
        o.push('</g>');
        o.push(xinPeas(p, 100, 100, 140, { n: 46, sz: 7 }));
        o.push(xinSeeds(p, 100, 100, 120, { n: 22, kind: 'cumin' }));
        o.push(xinCoriander(p, 100, 100, 80, { n: 7 }));
        return o.join('');
    },

    // kosambari: soaked yellow moong dal, cucumber, grated carrot, coconut, coriander, mustard tadka; steel katori
    in_kosambari: p => {
        const o = [xinSteel(p), `<circle cx="100" cy="100" r="77" fill="${p.rg('#f2dc8a', .2, .2)}"/>`];
        o.push(xinDalGrains(p, 100, 100, 146, { n: 100, c: '#f0cc50', sz: 3 }));
        o.push(`<g ${p.sh(.4)}>`);
        xinSpots('kos', 16, 62, 16).forEach(([x, y, r]) => o.push(xinSaladDice(p, x, y, 10, r, 'cuc')));
        o.push(K.shreds(p, 100, 100, 130, { c: '#ef7a2a', n: 30, w: 1.6, len: .1, seed: 2, curve: .6 }));
        o.push('</g>');
        o.push(xinCoconut(p, 100, 100, 130, { n: 22 }));
        o.push(xinSeeds(p, 100, 100, 100, { n: 20 }));
        [[86, 88, 20], [118, 112, -50]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 16, r)));
        o.push(xinCoriander(p, 100, 100, 90, { n: 8 }));
        return o.join('');
    },

    // laccha pyaz: thin red-onion rings with chili and chaat masala, mint, lemon; white plate
    in_lacchapyaz: p => {
        const o = [K.plate(p, { rim: '#c43a2a', well: .78 })];
        o.push(`<g ${p.sh(.4)}>`);
        xinSpots('lp', 34, 60, 11).forEach(([x, y, r], i) => o.push(xinRing(p, x, y, 16 + (i % 5) * 4, r, { c: i % 3 ? '#b8507e' : '#a03a6a', w: 1.6 })));
        o.push('</g>');
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#c8301c', n: 70, r: 1.1 }));
        o.push(K.sprinkle(p, 100, 100, 110, { c: '#7a4a2a', n: 20, r: .7 }));
        [[90, 96, 20], [104, 92, -40], [96, 106, 100]].forEach(([x, y, r]) => o.push(xinMint(p, x, y, 16, r)));
        o.push(K.lemon(p, 140, 136, 30, -40), K.lemon(p, 58, 70, 26, 130));
        o.push(xinGreenChili(p, 136, 70, 30, 40));
        return o.join('');
    },

    // begun bhaja: round eggplant slices fried golden in mustard oil; white plate
    in_begunbhaja: p => {
        const o = [K.plate(p, { rim: '#b8862a', well: .78 })];
        [[70, 72, 60, 10], [130, 76, 60, -30], [68, 128, 58, 60], [130, 128, 60, 120], [100, 100, 60, 200]].forEach(([x, y, s, r], i) => o.push(xinBegun(p, x, y, s, r, { seed: i })));
        o.push(xinOil(p, 100, 100, 150, { n: 6, c: '#e8b030', op: .4 }));
        return o.join('');
    },

    // besan shimla mirch: capsicum strips coated in toasted gram-flour crumble; steel katori
    in_besanmirch: p => {
        const o = [xinSteel(p), `<circle cx="100" cy="100" r="77" fill="${p.rg('#d8b050', .2, .3)}" opacity=".7"/>`];
        o.push(`<g ${p.sh(.5)}>`);
        xinSpots('bm', 24, 60, 16).forEach(([x, y, r], i) => o.push(i % 2 ? K.pepperPiece(p, x, y, 19, r, { c: i % 5 ? '#4a962e' : '#3a7a24' }) : `<g ${T(x, y, r)}><path d="M-13,-3 Q0,-6 13,-3 L13,3 Q0,0 -13,3Z" fill="${p.g('#4a962e', .35, .2)}" stroke="#2c6a1a" stroke-width=".6"/><path d="M-11,-3 Q0,-5 11,-3" stroke="#fff" stroke-width=".8" fill="none" opacity=".6"/></g>`));
        o.push('</g>');
        { const R = rng('bmc'); let g = ''; for (let i = 0; i < 120; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 70; g += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" r="${f(1.2 + R() * 2)}" fill="${['#e8c060', '#d4a040', '#f2d880'][Math.floor(R() * 3)]}"/>`; } o.push(g); }
        o.push(xinSeeds(p, 100, 100, 110, { n: 20, kind: 'cumin' }));
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#b8401c', n: 18, r: .7 }));
        return o.join('');
    },

    // beetroot pachadi: magenta yogurt with grated beet and coconut, mustard-curry-leaf tadka; celadon bowl
    in_beetpachadi: p => {
        const o = [K.kobachi(p, { glaze: '#9fbfae', inside: '#eef2ea' }), K.liquid(p, { R: 76, c: '#c43a72', op: 1, shine: false })];
        o.push(xinTex(p, 100, 100, 74, ['#e06a9a', '#9a1e50'], 22, 'bp', 3, 7, .5, .8));
        o.push(K.shreds(p, 100, 100, 120, { c: '#8a1440', n: 30, w: 1.6, len: .12, seed: 3, curve: .5 }));
        o.push(xinCoconut(p, 100, 100, 120, { n: 14, sz: 1.3 }));
        o.push(xinSeeds(p, 100, 98, 60, { n: 24 }));
        [[90, 92, 20], [112, 94, -60], [102, 112, 100]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 18, r)));
        o.push(xinRedChili(p, 104, 100, 24, 30));
        o.push(xinShine(100, 100, 76, .5));
        return o.join('');
    },

    // ajwaini arbi: crisp spiced taro pieces with carom seeds, coriander, lemon; white plate
    in_arbifry: p => {
        const o = [K.plate(p, { rim: '#d0702a', well: .78 })];
        o.push(`<g ${p.sh(.8)}>`);
        xinSpots('arbi', 21, 60, 20).forEach(([x, y, r], i) => o.push(`<g ${p.crumb(.6)}>${xinChunk(p, x, y, 26, r, i % 2 ? '#b8682a' : '#c87a32', { seed: i, sx: 1.25, sy: .8, jit: .25, gloss: .35 })}</g>`));
        o.push('</g>');
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#8a2a10', n: 26, r: .9 }));
        o.push(xinSeeds(p, 100, 100, 120, { n: 26, kind: 'cumin' }));
        o.push(xinCoriander(p, 100, 100, 100, { n: 9 }));
        o.push(K.lemon(p, 146, 140, 26, -40));
        return o.join('');
    },

    // mixed veg sabzi: cauliflower, carrot, beans, peas, potato in a light masala; copper handi
    in_mixveg: p => {
        const o = [xinHandi(p), `<circle cx="100" cy="100" r="81" fill="${p.rg('#c8862e', .2, .3)}"/>`];
        o.push(xinTex(p, 100, 100, 78, ['#d89a3a', '#a8601e'], 12, 'mv', 6, 12, .45, 2));
        o.push(`<g ${p.sh(.6)}>`);
        xinSpots('mixveg', 36, 64, 13.5).forEach(([x, y, r], i) => o.push([xinCauli(p, x, y, 22, r, { c: '#f2d27a' }), xinDice(p, x, y, 12, r, '#ec7428'), K.greenBean(p, x, y, 18, r), xinDice(p, x, y, 14, r, '#ecc050')][i % 4]));
        o.push('</g>');
        o.push(xinPeas(p, 100, 100, 130, { n: 20, sz: 6 }));
        o.push(xinCoriander(p, 100, 100, 80, { n: 7 }));
        return o.join('');
    },

    // dry mushroom masala: quartered mushrooms in a thick onion-tomato masala; dark brown ceramic bowl
    in_mushroommasala: p => {
        const o = [K.bowl(p, { glaze: '#4a3a30', inside: '#efe6d8' }), xinGravy(p, { R: 78, c: '#8a4a22', oil: '#b0602a' })];
        o.push(xinTex(p, 100, 100, 74, ['#a85a2a', '#6a3416', '#b8702e'], 18, 'mm', 4, 9, .55, 1.4));
        o.push(`<g ${p.sh(.7)}>`);
        xinSpots('mush', 18, 60, 18).forEach(([x, y, r]) => o.push(xinMushroom(p, x, y, 22, r)));
        o.push('</g>');
        xinSpots('mm-o', 6, 58, 20).forEach(([x, y, r]) => o.push(K.onion(p, x, y, 14, r, { c: '#d09a5a' })));
        o.push(xinOil(p, 100, 100, 140, { n: 8, c: '#c8642a', op: .5 }));
        o.push(xinCoriander(p, 100, 100, 90, { n: 8 }));
        return o.join('');
    },
};

// =========================================================
// soups (dals, kadhis, shorbas)
// =========================================================
const D5 = {
    // dal makhani: dark creamy black-lentil dal with a few rajma, cream swirl and butter; clay pot
    in_dalmakhani: p => {
        const o = [xinClay(p), xinSoup(p, { R: 78, c: '#5e2c1c', tex: ['#7a3e26', '#3e1a10'], n: 14, seed: 'dm' })];
        { const R = rng('dmg'); let g = ''; for (let i = 0; i < 80; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 72, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; g += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.6" transform="rotate(${Math.round(R() * 180)} ${f(x)} ${f(y)})" fill="${R() < .5 ? '#2a1410' : '#4a2418'}" stroke="#8a5a40" stroke-width=".3"/>`; } o.push(g); }
        o.push(`<g ${p.sh(.4)}>`);
        xinSpots('dm-b', 8, 60, 18).forEach(([x, y, r]) => o.push(xinBean(p, x, y, 12, r, { c: '#6a1e18' })));
        o.push('</g>');
        o.push(xinSwirl(p, 100, 100, 64, { c: '#fbf2e2', w: 3.6, turns: 1.6 }));
        o.push(xinButter(p, 112, 90, 16, 20));
        o.push(xinCoriander(p, 84, 112, 30, { n: 4 }));
        o.push(xinShine(100, 100, 78, .4));
        return o.join('');
    },

    // dal palak: green-yellow dal with spinach, garlic-chili tadka; steel katori
    in_dalpalak: p => {
        const o = [xinSteel(p), xinSoup(p, { R: 77, c: '#9a9a36', tex: ['#c0b04a', '#6a7a24'], n: 14, seed: 'dp' })];
        o.push(xinTex(p, 100, 100, 72, ['#2f6a1e', '#3f7e26', '#4f8e2e'], 30, 'dp2', 3, 8, .85, 0));
        o.push(`<path d="${smooth(ring(30, 10, .4, rng('dpt'), 1.2, .9))}" transform="translate(102 96)" fill="#d8961c" opacity=".5"/>`);
        o.push(xinOil(p, 102, 96, 70, { n: 10, c: '#f0b83a', op: .7, rmax: 3 }));
        o.push(xinGarlic(p, 102, 96, 50, { n: 8 }));
        o.push(xinSeeds(p, 102, 96, 60, { n: 20, kind: 'cumin' }));
        o.push(xinRedChili(p, 116, 88, 26, 30), xinRedChili(p, 90, 108, 22, -50));
        xinSpots('dp-t', 5, 50, 20).forEach(([x, y, r]) => o.push(xinDice(p, x, y, 6, r, '#d8402a', { op: .9 })));
        o.push(xinShine(100, 100, 77, .4));
        return o.join('');
    },

    // lauki chana dal: yellow chana dal with bottle-gourd cubes, tomato, green chili; white bowl
    in_laukichana: p => {
        const o = [K.bowl(p, { glaze: '#e9e4da', inside: '#f6f2ea' }), xinSoup(p, { R: 78, c: '#d8a43a', tex: ['#e8bc52', '#b8822a'], n: 14, seed: 'lc' })];
        o.push(xinDalGrains(p, 100, 100, 146, { n: 60, c: '#f0c040', sz: 2.8 }));
        o.push(`<g ${p.sh(.6)}>`);
        xinSpots('lc', 13, 58, 20).forEach(([x, y, r]) => o.push(xinDice(p, x, y, 16, r, '#cfe09a', { op: .95 })));
        o.push('</g>');
        xinSpots('lc-t', 6, 56, 20).forEach(([x, y, r]) => o.push(xinDice(p, x, y, 7, r, '#d8402a', { op: .9 })));
        o.push(xinGreenChili(p, 122, 84, 26, 30, { slit: true }));
        o.push(xinOil(p, 100, 100, 130, { n: 8, c: '#f0b030', op: .6 }));
        o.push(xinCoriander(p, 96, 104, 70, { n: 7 }));
        o.push(xinShine(100, 100, 78, .4));
        return o.join('');
    },

    // panchmel dal: thick golden five-lentil dal, ghee, cloves, dried chilies, bay leaf; brass katori
    in_panchmel: p => {
        const o = [xinSteel(p, { c1: '#f8e4a4', c2: '#b88a2e' }), xinSoup(p, { R: 77, c: '#c48a2c', tex: ['#d8a240', '#9a6a1e'], n: 16, seed: 'pm' })];
        o.push(xinDalGrains(p, 100, 100, 146, { n: 40, c: '#f0c040', sz: 2.6, seed: 1 }));
        o.push(xinDalGrains(p, 100, 100, 146, { n: 30, c: '#e8823a', sz: 2.2, seed: 2 }));
        { const R = rng('pmu'); let g = ''; for (let i = 0; i < 22; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 70, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; g += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.6" transform="rotate(${Math.round(R() * 180)} ${f(x)} ${f(y)})" fill="#efe6cc" stroke="#5a4a3a" stroke-width=".5"/>`; } o.push(g); }
        o.push(`<path d="${smooth(ring(26, 9, .35, rng('pmg'), 1.2, .9))}" transform="translate(98 96)" fill="#f2b42a" opacity=".7"/>`);
        o.push(xinOil(p, 98, 96, 60, { n: 8, c: '#f6c040', op: .7 }));
        o.push(xinRedChili(p, 114, 90, 26, 20), xinRedChili(p, 86, 106, 24, -60));
        o.push(xinClove(100, 112, 30), xinClove(124, 108, -40), xinBay(p, 76, 84, 28, 40));
        o.push(xinCoriander(p, 120, 124, 26, { n: 3 }));
        o.push(xinShine(100, 100, 77, .4));
        return o.join('');
    },

    // amti: thin sweet-sour Maharashtrian dal with kokum, coconut, coriander, mustard and curry leaf; steel katori
    in_amti: p => {
        const o = [xinSteel(p), xinSoup(p, { R: 77, c: '#c8702a', op: .92, tex: ['#d8843a', '#a8521c'], n: 10, seed: 'am' })];
        o.push(xinOil(p, 100, 100, 140, { n: 14, c: '#e88a2a', op: .6 }));
        xinSpots('am-k', 4, 52, 30).forEach(([x, y, r]) => o.push(xinKokum(p, x, y, 16, r)));
        o.push(xinCoconut(p, 100, 100, 120, { n: 24 }));
        o.push(xinSeeds(p, 100, 100, 110, { n: 30 }));
        [[90, 88, 20], [118, 108, -60], [76, 116, 100], [122, 78, 160]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 16, r)));
        o.push(xinCoriander(p, 102, 100, 70, { n: 10 }));
        o.push(xinShine(100, 100, 77, .5));
        return o.join('');
    },

    // dal dhokli: diamond wheat dumplings simmered in sweet-sour dal, peanuts, coriander; terracotta-glazed bowl
    in_daldhokli: p => {
        const o = [K.bowl(p, { glaze: '#a8582a', inside: '#f4ede0' }), xinSoup(p, { R: 78, c: '#d49a35', tex: ['#e6b04a', '#b07a22'], n: 14, seed: 'dd' })];
        o.push(`<g ${p.sh(.7)}>`);
        xinSpots('dd', 13, 58, 22).forEach(([x, y, r]) => o.push(xinDhokli(p, x, y, 26, r)));
        xinSpots('dd-p', 8, 62, 16).forEach(([x, y, r]) => o.push(xinPeanut(p, x, y, 9, r, { c: '#c88a5a' })));
        o.push('</g>');
        o.push(xinOil(p, 100, 100, 140, { n: 10, c: '#e8a030', op: .6 }));
        o.push(xinSeeds(p, 100, 100, 100, { n: 16 }));
        o.push(xinCoriander(p, 100, 100, 90, { n: 9 }));
        o.push(xinShine(100, 100, 78, .4));
        return o.join('');
    },

    // dalma: thick Odia dal with pumpkin, potato, raw banana, eggplant and coconut; clay pot
    in_dalma: p => {
        const o = [xinClay(p), xinSoup(p, { R: 78, c: '#d8a84c', tex: ['#ecc060', '#b88a32'], n: 14, seed: 'da' })];
        o.push(`<g ${p.sh(.7)}>`);
        xinSpots('dalma', 16, 58, 19).forEach(([x, y, r], i) => o.push([K.kabocha(p, x, y, 20, r), xinDice(p, x, y, 15, r, '#f0d48a'), xinDice(p, x, y, 14, r, '#dcdcae'), xinBaton(p, x, y, 16, 13, r, '#d2b878', { edge: '#4e2450' })][i % 4]));
        o.push('</g>');
        o.push(xinCoconut(p, 100, 100, 120, { n: 22 }));
        o.push(xinSeeds(p, 100, 98, 60, { n: 18, kind: 'cumin' }));
        o.push(xinRedChili(p, 106, 96, 24, 30));
        o.push(xinShine(100, 100, 78, .4));
        return o.join('');
    },

    // cholar dal: Bengali chana dal with coconut pieces, raisins, bay leaf, red chilies; white bowl with indigo rim
    in_cholardal: p => {
        const o = [K.bowl(p, { glaze: '#2c4c7c', inside: '#f6f2ea' }), xinSoup(p, { R: 78, c: '#e2b23c', tex: ['#f2c850', '#c08a28'], n: 14, seed: 'cd' })];
        o.push(xinDalGrains(p, 100, 100, 148, { n: 80, c: '#f2c440', sz: 3 }));
        o.push(`<g ${p.sh(.5)}>`);
        xinSpots('cd-c', 12, 60, 17).forEach(([x, y, r]) => o.push(`<g ${T(x, y, r)}><path d="M-5,-4 L5,-4 L4,4 L-5,3Z" fill="${p.g('#fdfaf0', .2, .15)}" stroke="#a88a6a" stroke-width=".6"/><path d="M-5,-4 L5,-4" stroke="#6a4a2a" stroke-width="1.4"/></g>`));
        xinSpots('cd-r', 7, 56, 20).forEach(([x, y, r]) => o.push(xinRaisin(p, x, y, 8, r)));
        o.push('</g>');
        o.push(xinOil(p, 100, 100, 120, { n: 8, c: '#f0b030', op: .6 }));
        o.push(xinBay(p, 82, 86, 30, 30), xinRedChili(p, 118, 110, 24, -30), xinRedChili(p, 112, 82, 20, 60));
        o.push(xinShine(100, 100, 78, .4));
        return o.join('');
    },

    // Punjabi kadhi pakora: thick yellow yogurt-besan kadhi with soft onion pakoras and red chili tadka; dark bowl
    in_kadhipakora: p => {
        const o = [K.bowl(p, { glaze: '#5a3a2a', inside: '#f2eadc' }), xinSoup(p, { R: 78, c: '#eac04a', tex: ['#f6d870', '#d0a034'], n: 14, seed: 'kp' })];
        o.push(`<g ${p.sh(1)}>`);
        [[74, 76], [126, 74], [134, 120], [100, 136], [66, 120], [100, 100]].forEach(([x, y], i) => o.push(xinPakora(p, x, y, 32, i * 60, { c: '#c08a34', seed: i })));
        o.push('</g>');
        o.push(xinTex(p, 100, 100, 76, ['#eac04a', '#f0cc5a'], 14, 'kp2', 5, 9, .55));
        o.push(`<path d="M68,100 Q84,88 100,96 T132,94" stroke="#d8401a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`);
        o.push(xinOil(p, 100, 100, 130, { n: 10, c: '#d8401a', op: .6 }));
        o.push(xinRedChili(p, 112, 112, 22, 30));
        o.push(xinCoriander(p, 96, 100, 80, { n: 8 }));
        return o.join('');
    },
};

const D6 = {
    // Gujarati kadhi: thin, pale sweet-sour yogurt kadhi with mustard, cumin, curry leaves, chili, cloves; steel katori
    in_gujaratikadhi: p => {
        const o = [xinSteel(p), xinSoup(p, { R: 77, c: '#f0e2b8', tex: ['#f8eed0', '#e0cc96'], n: 12, seed: 'gk' })];
        o.push(xinOil(p, 100, 100, 130, { n: 12, c: '#f0c050', op: .6 }));
        o.push(xinSeeds(p, 100, 98, 80, { n: 30 }));
        o.push(xinSeeds(p, 100, 98, 70, { n: 14, kind: 'cumin' }));
        [[88, 90, 20], [114, 92, -60], [98, 112, 100], [124, 116, 160], [76, 110, 60]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 18, r)));
        o.push(xinRedChili(p, 106, 100, 24, 30), xinClove(84, 80, 20), xinClove(126, 84, -40));
        o.push(xinCoriander(p, 100, 100, 100, { n: 9 }));
        o.push(xinShine(100, 100, 77, .55));
        return o.join('');
    },

    // mor kuzhambu: pale yellow yogurt-coconut curry with ash gourd, curry leaves, mustard, red chili; brass bowl
    in_morkuzhambu: p => {
        const o = [xinSteel(p, { c1: '#f8e4a4', c2: '#b88a2e' }), xinSoup(p, { R: 77, c: '#f0d47a', tex: ['#f8e4a0', '#d8b44e'], n: 12, seed: 'mk' })];
        o.push(`<g ${p.sh(.5)}>`);
        xinSpots('mk', 12, 58, 21).forEach(([x, y, r]) => o.push(xinDice(p, x, y, 18, r, '#e6ecc8', { op: .9 })));
        o.push('</g>');
        o.push(xinOil(p, 100, 100, 130, { n: 8, c: '#f0c040', op: .55 }));
        o.push(xinSeeds(p, 100, 100, 100, { n: 26 }));
        [[90, 90, 20], [116, 96, -60], [100, 114, 100], [72, 104, 150]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 18, r)));
        o.push(xinRedChili(p, 106, 102, 24, 30));
        o.push(xinShine(100, 100, 77, .5));
        return o.join('');
    },

    // mutton shorba: clear brown spiced broth with bone-in mutton and potato, oil, pepper, coriander; dark bowl
    in_muttonshorba: p => {
        const o = [K.bowl(p, { glaze: '#3a302c', inside: '#efe6d8' }), xinSoup(p, { R: 78, c: '#8a4a22', op: .94, tex: ['#a05a2a', '#6a3416'], n: 8, seed: 'ms' })];
        o.push(`<g ${p.sh(.9)}>`);
        [[76, 82, 30, 20, true], [124, 78, 30, 150, false], [118, 124, 30, -40, true], [78, 124, 26, 60, false]].forEach(([x, y, s, r, b], i) => o.push(xinMutton(p, x, y, s, r, { seed: i, bone: b, c: '#7a3a1e' })));
        [[100, 100], [100, 66], [140, 102], [100, 140]].forEach(([x, y], i) => o.push(xinDice(p, x, y, 15, i * 20, '#e8c070')));
        o.push('</g>');
        o.push(xinOil(p, 100, 100, 140, { n: 18, c: '#d8902a', op: .65, rmax: 3.4 }));
        o.push(K.sprinkle(p, 100, 100, 130, { c: '#1e120c', n: 24, r: .8 }));
        o.push(xinCoriander(p, 100, 100, 100, { n: 8 }));
        o.push(xinShine(100, 100, 78, .5));
        return o.join('');
    },

    // chicken shorba: golden clear broth with chicken pieces, mint, coriander, pepper; white bowl
    in_chickenshorba: p => {
        const o = [K.bowl(p, { glaze: '#e9e4da', inside: '#f6f2ea' }), xinSoup(p, { R: 78, c: '#c8903c', op: .9, tex: ['#d8a24a', '#a8701e'], n: 8, seed: 'cs' })];
        o.push(`<g ${p.sh(.9)}>`);
        [[78, 82, 30, 20, true], [124, 84, 28, 150, false], [104, 124, 30, -40, true], [70, 122, 22, 70, false], [134, 120, 22, 10, false]].forEach(([x, y, s, r, b], i) => o.push(xinChicken(p, x, y, s, r, { c: '#d8a868', seed: i, bone: b })));
        o.push('</g>');
        o.push(xinOil(p, 100, 100, 140, { n: 18, c: '#e8b040', op: .65, rmax: 3.2 }));
        o.push(K.sprinkle(p, 100, 100, 130, { c: '#1e120c', n: 22, r: .8 }));
        [[100, 96, 20], [110, 104, -50], [90, 104, 120]].forEach(([x, y, r]) => o.push(xinMint(p, x, y, 13, r)));
        o.push(xinCoriander(p, 100, 100, 110, { n: 9 }));
        o.push(xinShine(100, 100, 78, .5));
        return o.join('');
    },

    // tomato shorba: smooth spiced tomato soup with a cream swirl, coriander and pepper; soup cup
    in_tomatoshorba: p => {
        const o = [xinMug(p, { R: 72, rim: '#c43a2a' }), `<circle cx="100" cy="100" r="64" fill="${p.rg('#c63e24', .22, .28, .45, .42)}"/>`];
        o.push(`<circle cx="100" cy="100" r="62" fill="none" stroke="#e05a30" stroke-width="4" opacity=".4"/>`);
        o.push(xinSwirl(p, 100, 100, 70, { c: '#fff4e8', w: 3.4, turns: 1.8 }));
        o.push(K.sprinkle(p, 100, 100, 110, { c: '#1e120c', n: 20, r: .8 }));
        o.push(xinCoriander(p, 106, 94, 40, { n: 6 }));
        o.push(xinShine(100, 100, 64, .5));
        return o.join('');
    },

    // Indo-Chinese sweet corn soup: thick golden soup with corn, carrot, beans, spring onion; blue-and-white bowl
    in_sweetcorn: p => {
        const o = [K.donburi(p), xinSoup(p, { R: 78, c: '#f0d06a', op: .95, tex: ['#f8e290', '#e0b84a'], n: 12, seed: 'sc' })];
        { const R = rng('scc'); let g = ''; for (let i = 0; i < 80; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 72, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; g += `<rect x="${f(x - 2.3)}" y="${f(y - 2)}" width="4.6" height="4" rx="1.6" fill="${p.g(R() < .5 ? '#f8cf32' : '#f2c020', .35, .2)}" stroke="#c99a12" stroke-width=".4"/>`; } o.push(`<g ${p.sh(.3)}>${g}</g>`); }
        xinSpots('sc-c', 12, 64, 13).forEach(([x, y, r]) => o.push(xinBit(p, x, y, 5.5, r, '#ee7a2a')));
        xinSpots('sc-b', 10, 64, 13).forEach(([x, y, r]) => o.push(xinBit(p, x, y, 5, r, '#4f9a34')));
        o.push(K.scallions(p, 100, 100, 70, { n: 14, c: '#4fa034' }));
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#2a1a12', n: 14, r: .6 }));
        o.push(xinShine(100, 100, 78, .55));
        return o.join('');
    },

    // veg manchow soup: dark soy-garlic soup with chopped vegetables, topped with crispy fried noodles; black bowl
    in_manchow: p => {
        const o = [K.bowl(p, { glaze: '#2e2a28', inside: '#e8e0d4' }), xinSoup(p, { R: 78, c: '#5a361e', op: .96, tex: ['#7a4a2a', '#3e2412'], n: 12, seed: 'mc' })];
        xinSpots('mc-v', 30, 68, 11).forEach(([x, y, r], i) => o.push(xinBit(p, x, y, 5.5, r, ['#7ab04a', '#ee7a2a', '#3f8a2a', '#d6e2a8'][i % 4], .9)));
        o.push(xinNoodles(p, 100, 98, 84, { c: '#e2a850', w: 2.4, n: 26, seed: 7, sy: .9 }));
        o.push(K.scallions(p, 100, 100, 120, { n: 20, c: '#5aa83a' }));
        o.push(xinCoriander(p, 128, 128, 30, { n: 4 }));
        o.push(xinShine(100, 100, 78, .4));
        return o.join('');
    },

    // palak soup: smooth bright green spinach soup with cream swirl, croutons and pepper; white bowl
    in_palaksoup: p => {
        const o = [K.bowl(p, { glaze: '#f0ebe2', inside: '#f8f5ee' }), xinSoup(p, { R: 78, c: '#4a8a2a', tex: ['#5aa034', '#3a7020'], n: 12, seed: 'ps' })];
        o.push(xinSwirl(p, 100, 100, 66, { c: '#fbf6ea', w: 3.4, turns: 1.6 }));
        o.push(`<g ${p.sh(.7)}>`);
        [[128, 80], [74, 122], [124, 124], [72, 80], [140, 102]].forEach(([x, y], i) => o.push(`<g ${p.crumb(.7)}>${xinDice(p, x, y, 13, i * 25, '#e2a84a')}</g>`));
        o.push('</g>');
        o.push(K.sprinkle(p, 100, 100, 120, { c: '#1e120c', n: 24, r: .8 }));
        o.push(xinShine(100, 100, 78, .55));
        return o.join('');
    },

    // Kerala vegetable stew (ishtu): white coconut milk with potato, carrot, peas, beans, onion, chili, curry leaves; wooden-brown bowl
    in_vegishtu: p => {
        const o = [K.bowl(p, { glaze: '#7a5232', inside: '#f2eadc' }), xinSoup(p, { R: 78, c: '#f4ecd6', tex: ['#fbf6e8', '#e2d6b4'], n: 12, seed: 'vi' })];
        o.push(`<g ${p.sh(.6)}>`);
        xinSpots('vi', 22, 60, 15.5).forEach(([x, y, r], i) => o.push([xinDice(p, x, y, 16, r, '#f0dc9a'), xinDice(p, x, y, 11, r, '#ee7a2a'), K.greenBean(p, x, y, 16, r), K.onion(p, x, y, 16, r, { c: '#f2e8d0' })][i % 4]));
        o.push('</g>');
        o.push(xinPeas(p, 100, 100, 130, { n: 14, sz: 5.5 }));
        o.push(xinGreenChili(p, 120, 84, 28, 30, { slit: true }), xinGreenChili(p, 80, 118, 26, -60, { slit: true }));
        [[90, 90, 20], [114, 112, -60], [70, 96, 150]].forEach(([x, y, r]) => o.push(xinCurryLeaf(p, x, y, 17, r)));
        o.push(xinCardamom(p, 128, 128, 9, 40), xinClove(96, 128, 30));
        o.push(xinOil(p, 100, 100, 130, { n: 6, c: '#f6ecb0', op: .6 }));
        o.push(xinShine(100, 100, 78, .5));
        return o.join('');
    },

    // chicken thukpa: wheat noodles in a light spiced broth with chicken strips, carrot, greens, spring onion; blue bowl
    in_thukpa: p => {
        const o = [K.bowl(p, { glaze: '#3a5a7a', inside: '#f2ede4' }), xinSoup(p, { R: 78, c: '#c48a48', op: .9, tex: ['#d8a05a', '#a06a2a'], n: 8, seed: 'th' })];
        o.push(xinNoodles(p, 100, 104, 120, { c: '#f2d898', w: 3.4, n: 24, seed: 4, sy: .9 }));
        o.push(`<g ${p.sh(.6)}>`);
        [[76, 76, 20], [92, 70, -10], [134, 108, 70], [124, 124, 50]].forEach(([x, y, r], i) => o.push(xinBaton(p, x, y, 26, 8, r, '#dcae78')));
        o.push(K.shreds(p, 118, 76, 30, { c: '#ee7a2a', n: 7, w: 2, len: .7, seed: 3 }));
        o.push(K.greens(p, 72, 120, 40, { c: '#3d8a2a', n: 6, seed: 2 }));
        o.push('</g>');
        o.push(K.tomatoWedge(p, 136, 84, 18, 30));
        o.push(xinOil(p, 100, 100, 140, { n: 10, c: '#e8a040', op: .6 }));
        o.push(K.scallions(p, 100, 100, 110, { n: 22, c: '#5aa83a' }));
        o.push(K.sprinkle(p, 100, 100, 110, { c: '#b8301c', n: 14, r: .8 }));
        return o.join('');
    },
};

// trim coordinates to one decimal and fold the template whitespace so each SVG stays small
const xinShrink = s => s.replace(/(\d+\.\d)\d+/g, '$1').replace(/\s*\n\s*/g, ' ');
export default Object.fromEntries(Object.entries({ ...D1,...D2,...D3,...D4,...D5,...D6 }).map(([k, fn]) => [k, p => xinShrink(fn(p))]));
