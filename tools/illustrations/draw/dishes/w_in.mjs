// World edition — India (in_) home cooking
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// =========================================================
// local parts (win = world / india)
// =========================================================
const winBlur = (p, s = 2) => `filter="url(#${p.def('winbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;

function winSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('winspots' + seed), out = [];
    for (let t = 0; t < 8000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// polished steel: banded gradient so it reads as metal
function winMetal(p, c1 = '#f3f5f7', c2 = '#9aa2ab'){
    const id = p.def('winmetal' + c1 + c2, id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".3" stop-color="${c2}"/><stop offset=".5" stop-color="${c1}"/><stop offset=".78" stop-color="${dk(c2, .15)}"/><stop offset="1" stop-color="${lt(c2, .3)}"/></linearGradient>`);
    return `url(#${id})`;
}
// stainless steel katori / serving bowl
function winSteel(p, { R = 92, lip = .86 } = {}){
    const r = R * lip;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${winMetal(p)}"/></g>
        <circle cx="100" cy="100" r="${R - 1.5}" fill="none" stroke="#ffffff" stroke-width="1.4" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(r + 2.5)}" fill="none" stroke="#7d858e" stroke-width="1.5" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(r)}" fill="${p.rg('#c9ced4', .25, .35, .62, .64)}"/>
        <circle cx="100" cy="100" r="${f(r * .8)}" fill="none" stroke="#e9ecef" stroke-width="1" opacity=".6"/>`;
}
// big steel thali with a raised rim
function winThali(p, { R = 95 } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${winMetal(p, '#eef1f4', '#a3abb3')}"/></g>
        <circle cx="100" cy="100" r="${R - 1.5}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".85"/>
        <circle cx="100" cy="100" r="${R - 9}" fill="${p.rg('#d4d9de', .2, .2, .4, .36)}"/>
        <circle cx="100" cy="100" r="${R - 9}" fill="none" stroke="#868e97" stroke-width="1.2"/>
        <circle cx="100" cy="100" r="${R - 30}" fill="none" stroke="#e6e9ec" stroke-width=".8" opacity=".7"/>
        <path d="M${100 - R * .7},${100 - R * .44} A${R * .84},${R * .84} 0 0 1 ${100 - R * .24},${100 - R * .8}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// black iron kadai with two loop handles
function winKadai(p, { R = 84 } = {}){
    const h = side => `<g ${T(100 + side * (R + 2), 100)}><path d="M0,-12 Q${side * 14},-12 ${side * 14},0 Q${side * 14},12 0,12" fill="none" stroke="#2c2826" stroke-width="5" stroke-linecap="round"/><path d="M0,-12 Q${side * 14},-12 ${side * 14},0" fill="none" stroke="#6a6360" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`;
    return `<g ${p.sh(1.8)}>${h(-1)}${h(1)}<circle cx="100" cy="100" r="${R}" fill="${p.rg('#3a3533', .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="#6a6360" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(R * .9)}" fill="${p.rg('#282321', .12, .2, .62, .64)}"/>`;
}
// copper handi with a brass lip
function winHandi(p, { R = 92 } = {}){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${winMetal(p, '#e9a476', '#a8552e')}"/></g>
        <circle cx="100" cy="100" r="${R - 6}" fill="none" stroke="${winMetal(p, '#f6dc8e', '#b8862a')}" stroke-width="7"/>
        <circle cx="100" cy="100" r="${R - 10}" fill="${p.rg('#b9bfc6', .2, .35, .62, .64)}"/>`;
}
// terracotta pot (Kerala-style manchatti)
function winClay(p, { R = 92 } = {}){
    return K.bowl(p, { R, glaze: '#9c4a26', inside: '#7a3218', lip: .86 });
}
// glossy curry surface with an oil rim
function winGravy(p, { R = 72, c = '#a8431c', oil = '#d9621e', cx = 100, cy = 100, seed = 1 } = {}){
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg(c, .2, .28, .45, .42)}"/>
        <circle cx="${cx}" cy="${cy}" r="${R - 3}" fill="none" stroke="${oil}" stroke-width="5" opacity=".55"/>
        <path d="M${cx - R * .62},${cy - R * .3} A${R * .72},${R * .72} 0 0 1 ${cx - R * .15},${cy - R * .66}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// oil / ghee droplets
function winOil(p, x, y, s, { n = 10, c = '#e8a33a', seed = 1, op = .7, rmax = 2.6 } = {}){
    const R = rng(p.id + 'oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// coriander leaf sprigs (small 3-lobed leaves)
function winCoriander(p, x, y, s, { n = 8, seed = 1 } = {}){
    const R = rng(p.id + 'cor' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, k = .8 + R() * .5, c = R() < .5 ? '#3f8f2c' : '#56a83a';
        out += `<g ${T(cx, cy, R() * 360, k)}><path d="M0,0 C-4,-1 -6,-5 -3,-7 C-2,-9 2,-9 3,-7 C6,-5 4,-1 0,0Z" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".45"/><path d="M0,0 L0,-6 M0,-3 L-2.5,-5.5 M0,-3 L2.5,-5.5" stroke="${lt(c, .4)}" stroke-width=".5"/></g>`;
    }
    return `<g ${p.sh(.4)}>${out}</g>`;
}
// curry leaf
function winCurryLeaf(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-4,-5 6,-3.2 Q10,-1 10,0 Q10,1 6,3.2 Q-4,5 -10,0Z" fill="${p.g('#2f6a1e', .25, .3)}" stroke="#1c4210" stroke-width=".5"/><path d="M-9,0 L9,0" stroke="#6f9a46" stroke-width=".6"/><path d="M-4,-2.4 Q2,-3.4 6,-2.2" stroke="#fff" stroke-width=".7" fill="none" opacity=".45"/></g>`;
}
// dried red chili
function winRedChili(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 24)}><path d="M-12,0 Q-10,-3.4 0,-3.4 Q8,-3 11,-.6 Q12,0 11,.6 Q8,3 0,3.4 Q-10,3.4 -12,0Z" fill="${p.g('#a8201a', .3, .35)}" stroke="#5e0e0a" stroke-width=".5"/><path d="M-12,0 L-15,-1.2" stroke="#6f7a2a" stroke-width="1.6" stroke-linecap="round"/><path d="M-6,-1.8 Q0,-2.6 6,-1.6" stroke="#ff9a7a" stroke-width=".8" fill="none" opacity=".7"/></g>`;
}
// mustard seeds / cumin seeds
function winSeeds(p, x, y, s, { n = 18, kind = 'mustard', seed = 1 } = {}){
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
function winPeas(p, x, y, s, { n = 14, seed = 1, sz = 5 } = {}){
    const R = rng(p.id + 'pea' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${sz / 2}" fill="${p.rg('#5fa83a', .3, .25, .35, .32)}" stroke="#3a7524" stroke-width=".5"/><circle cx="${f(cx - sz * .15)}" cy="${f(cy - sz * .16)}" r="${f(sz * .13)}" fill="#fff" opacity=".7"/>`; }
    return `<g ${p.sh(.4)}>${out}</g>`;
}
// small rounded dice (carrot, potato, paneer ...)
function winDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${dk(c, .2)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .2)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .6)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// basmati rice: long slim grains
function winBasmati(p, x, y, s, { sy = 1, tint = '#f8f5ec', seed = 1, n = null } = {}){
    const R = rng(p.id + 'bas' + seed + x + y);
    const shape = smooth(ring(s / 2, 14, .07, R, 1, sy));
    const cnt = n || Math.round(s * s / 46);
    let lit = '', dim = '';
    for (let i = 0; i < cnt; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .95, gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy, b = R() * 3.14, hl = 2.9 + R() * .6;
        const seg = `M${f(gx - Math.cos(b) * hl)} ${f(gy - Math.sin(b) * hl)}l${f(Math.cos(b) * hl * 2)} ${f(Math.sin(b) * hl * 2)}`;
        if ((gx + gy) / (s / 2) + (R() - .5) * 1.2 < .2) lit += seg; else dim += seg;
    }
    return `<g ${T(x, y)}><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .06), .15, .2, .38, .34)}"/></g>
        <path d="${dim}" stroke="${dk(tint, .3)}" stroke-width="2.3" stroke-linecap="round" opacity=".45" transform="translate(.5 .7)"/>
        <path d="${dim}" stroke="${dk(tint, .05)}" stroke-width="2" stroke-linecap="round"/>
        <path d="${lit}" stroke="${dk(tint, .3)}" stroke-width="2.3" stroke-linecap="round" opacity=".35" transform="translate(.5 .7)"/>
        <path d="${lit}" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></g>`;
}
// roti / chapati: round, wheat coloured, with brown blisters
function winRoti(p, x, y, s, r = 0, { seed = 1, fold = false } = {}){
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
            <g clip-path="url(#${p.def('winq' + s, id => `<clipPath id="${id}"><path d="${q}"/></clipPath>`)})"><g ${winBlur(p, 1.2)}>${spots}</g>${dots}</g>
            <path d="M3,3 L${f(s * .45)},3" stroke="#f6e2b6" stroke-width="1.2" opacity=".8"/></g>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}>${body}</g><g ${winBlur(p, 1.4)}>${spots}</g>${dots}
        <path d="M${f(-s * .32)},${f(-s * .16)} Q${f(-s * .12)},${f(-s * .36)} ${f(s * .16)},${f(-s * .32)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// chicken curry piece (masala-coated, sometimes with a bone end)
function winChicken(p, x, y, s, r = 0, { c = '#a5481c', seed = 1, bone = false } = {}){
    const R = rng(p.id + 'wch' + seed + x + y);
    const pts = ring(s / 2, 9, .25, R, 1.2, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}>${bone ? `<path d="M${f(s * .4)},-2.2 L${f(s * .74)},-2.6 Q${f(s * .84)},0 ${f(s * .74)},2.6 L${f(s * .4)},2.2Z" fill="#efe2c6" stroke="#b9a37a" stroke-width=".6"/>` : ''}
        <path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .6 - 1, b * .5 - 1]), true, .8)}" fill="${lt(c, .18)}" opacity=".6"/>
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .08)},${f(-s * .34)} ${f(s * .16)},${f(-s * .28)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// boiled egg half in curry (masala-tinged white, yellow yolk)
function winEggHalf(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.8)}><ellipse rx="15" ry="11" fill="${p.rg('#fbf2df', .1, .12)}" stroke="#d9874a" stroke-width="1.6"/></g>
        <circle cx=".8" cy=".8" r="6.6" fill="${p.rg('#f2a91c', .3, .2)}" stroke="#d98a12" stroke-width=".5"/>
        <ellipse cx="-7" cy="-5.4" rx="4" ry="1.6" fill="#fff" opacity=".75"/></g>`;
}
// fish steak: round slice with skin, spine and masala
function winFishSteak(p, x, y, s, r = 0, { seed = 1 } = {}){
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
function winBean(p, x, y, s, r = 0, { c = '#7a1f1c' } = {}){
    return `<g ${T(x, y, r, s / 14)}><path d="M-7,-1 C-7,-5 -2,-5.4 0,-3.6 C2,-5.4 7,-5 7,-1 C7,4 3,5 0,4.4 C-3,5 -7,4 -7,-1Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/><path d="M-4.4,-2.6 Q-2,-3.6 0,-2.4" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// paneer cube (soft, lightly golden)
function winPaneer(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .16)}" fill="${p.g('#fbf4e2', .3, .2)}" stroke="#d8c8a4" stroke-width=".6"/></g>
        <rect x="${f(-s / 2 + 2)}" y="${f(-s / 2 + 2)}" width="${f(s - 4)}" height="${f(s - 4)}" rx="${f(s * .12)}" fill="none" stroke="#e8c98a" stroke-width="1.2" opacity=".5"/>
        <path d="M${f(-s / 2 + 2.5)},${f(-s / 2 + 2.5)} L${f(s / 2 - 3)},${f(-s / 2 + 2.5)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/></g>`;
}
// cauliflower floret (turmeric tinted)
function winCauli(p, x, y, s, r = 0, { c = '#f2d27a' } = {}){
    const R = rng(p.id + 'cau' + x + y);
    let b = '';
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.28, d = i === 0 ? 0 : s * .22; b += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d - s * .05)}" r="${f(s * (.18 + R() * .06))}" fill="${p.g(R() < .5 ? c : lt(c, .15), .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${f(-s * .12)},${f(s * .15)} L${f(-s * .1)},${f(s * .5)} L${f(s * .1)},${f(s * .5)} L${f(s * .12)},${f(s * .15)}Z" fill="#f4e9c4" stroke="#cdb780" stroke-width=".5"/>${b}</g>
        <circle cx="${f(-s * .14)}" cy="${f(-s * .2)}" r="${f(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// okra cut into rounds / short pieces
function winOkraBit(p, x, y, s, r = 0, { side = false } = {}){
    if (side) return `<g ${T(x, y, r)}><rect x="${-s / 2}" y="${f(-s * .3)}" width="${s}" height="${f(s * .6)}" rx="${f(s * .2)}" fill="${p.g('#4f8a2a', .3, .3)}" stroke="#2f5a1a" stroke-width=".5"/><path d="M${f(-s * .4)},${f(-s * .1)} L${f(s * .4)},${f(-s * .1)} M${f(-s * .4)},${f(s * .1)} L${f(s * .4)},${f(s * .1)}" stroke="#2f5a1a" stroke-width=".6" opacity=".6"/><ellipse cx="${f(s * .46)}" cy="0" rx="${f(s * .08)}" ry="${f(s * .26)}" fill="#c9dca0"/></g>`;
    return K.okra(p, x, y, s);
}
// drumstick (moringa) piece
function winDrumstick(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="-3.4" width="${L}" height="6.8" rx="2.4" fill="${p.g('#7a8a3a', .3, .3)}" stroke="#4a5a1e" stroke-width=".6"/><path d="M${-L / 2 + 2},-1.2 L${L / 2 - 2},-1.2 M${-L / 2 + 2},1.4 L${L / 2 - 2},1.4" stroke="#5a6a26" stroke-width=".6"/><ellipse cx="${L / 2 - 1}" cy="0" rx="1.6" ry="3" fill="#d8d29a"/></g>`;
}
// small shallot (sambar onion)
function winShallot(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="${p.rg('#d98a8a', .3, .25, .35, .32)}" stroke="#9a4a4a" stroke-width=".5"/></g><ellipse rx="${f(s * .3)}" ry="${f(s * .24)}" fill="none" stroke="#f2c4c0" stroke-width=".7"/></g>`;
}
// sliced garlic fried golden
function winGarlic(p, x, y, s, { n = 7, seed = 1 } = {}){
    const R = rng(p.id + 'gar' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<ellipse cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" rx="2.6" ry="1.8" transform="rotate(${f(R() * 180)} ${f(x + Math.cos(a) * d)} ${f(y + Math.sin(a) * d)})" fill="${R() < .5 ? '#e6b45a' : '#c98a32'}" stroke="#9a6420" stroke-width=".4"/>`; }
    return out;
}
// dice for salads
function winSaladDice(p, x, y, s, r, kind){
    const h = s / 2;
    if (kind === 'cuc') return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${p.g('#dbeab0', .2, .15)}" stroke="#9fbf6a" stroke-width=".5"/><rect x="${-h}" y="${-h}" width="${s}" height="${f(s * .26)}" rx="${f(s * .12)}" fill="#3f7a2c"/></g>`;
    if (kind === 'oni') return `<g ${T(x, y, r)}><rect x="${-h * .8}" y="${-h * .8}" width="${s * .8}" height="${s * .8}" rx="${f(s * .18)}" fill="${p.g('#f3e2ea', .3, .15)}" stroke="#c99aaa" stroke-width=".5"/><path d="M${f(-h * .6)},${f(-h * .2)} L${f(h * .6)},${f(-h * .2)}" stroke="#b86a8a" stroke-width=".8" opacity=".6"/></g>`;
    return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${p.g('#e23a2a', .3, .25)}" stroke="#a5241a" stroke-width=".5"/><path d="M${f(-h * .4)},${f(-h * .2)} Q0,${f(h * .4)} ${f(h * .5)},${f(-h * .1)}" stroke="#f6c25a" stroke-width="${f(s * .16)}" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// soft sheen on a soup
const winShine = (cx, cy, R, op = .4) => `<path d="M${cx - R * .62},${cy - R * .25} A${R * .7},${R * .7} 0 0 1 ${cx - R * .12},${cy - R * .66}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// =========================================================
export default {
    // roti and rice on a steel thali
    in_staple: p => [
        winThali(p),
        winBasmati(p, 132, 120, 70, { seed: 3, sy: .9 }),
        winRoti(p, 78, 84, 92, 0, { seed: 1 }),
        winRoti(p, 74, 80, 92, 40, { seed: 2 }),
        winRoti(p, 92, 132, 62, 200, { seed: 3, fold: true }),
        winOil(p, 70, 74, 30, { n: 4, c: '#f2c64a', op: .45, rmax: 3 }),
    ].join(''),

    // chicken curry in a copper handi
    in_chickencurry: p => {
        const out = [winHandi(p), winGravy(p, { R: 80, c: '#9a3a16', oil: '#d65a18' })];
        [[76, 76, 30, 20, true], [122, 72, 30, 150, false], [70, 120, 30, -40, false], [116, 120, 32, 60, true], [98, 98, 28, 100, false], [140, 98, 24, -100, false]].forEach(([x, y, s, r, b], i) => out.push(winChicken(p, x, y, s, r, { seed: i, bone: b })));
        out.push(winOil(p, 100, 100, 140, { n: 12, c: '#e0701e', op: .6 }));
        out.push(winCoriander(p, 100, 96, 60, { n: 9 }));
        return out.join('');
    },

    // keema matar in an iron kadai
    in_keemamatar: p => [
        winKadai(p),
        `<circle cx="100" cy="100" r="70" fill="${p.rg('#7a3e1e', .2, .25)}"/>`,
        K.mince(p, 100, 100, 136, { c: '#8a4a26', n: 220, seed: 1 }),
        K.mince(p, 100, 100, 120, { c: '#a85a2a', n: 90, seed: 2 }),
        winPeas(p, 100, 100, 118, { n: 30, sz: 6 }),
        winOil(p, 100, 100, 130, { n: 8, c: '#d8621e', op: .5 }),
        winCoriander(p, 104, 98, 64, { n: 9, seed: 2 }),
    ].join(''),

    // South-style fish curry in a clay pot
    in_fishcurry: p => {
        const out = [winClay(p), winGravy(p, { R: 76, c: '#c1441a', oil: '#e06a22' })];
        out.push(`<path d="${smooth(ring(40, 10, .4, rng('coco'), 1.3, .8))}" transform="translate(96 106)" fill="#e08a4a" opacity=".35"/>`);
        out.push(winFishSteak(p, 76, 82, 40, 20, { seed: 1 }), winFishSteak(p, 124, 86, 38, -30, { seed: 2 }), winFishSteak(p, 96, 126, 42, 10, { seed: 3 }));
        out.push(winOil(p, 100, 100, 130, { n: 10, c: '#e8802a', op: .55 }));
        [[66, 112, 20], [138, 120, -50], [100, 64, 80], [104, 98, 140], [130, 60, 30]].forEach(([x, y, r]) => out.push(winCurryLeaf(p, x, y, 16, r)));
        return out.join('');
    },

    // egg curry: halved eggs in onion-tomato gravy, steel bowl
    in_eggcurry: p => [
        winSteel(p),
        winGravy(p, { R: 76, c: '#b8501c', oil: '#e0681e' }),
        winEggHalf(p, 76, 80, 40, -20), winEggHalf(p, 124, 80, 40, 25), winEggHalf(p, 78, 124, 40, 30), winEggHalf(p, 124, 124, 40, -15),
        winOil(p, 100, 100, 130, { n: 10, c: '#e0701e', op: .55 }),
        winCoriander(p, 100, 102, 40, { n: 6 }),
    ].join(''),

    // rajma: kidney beans in thick gravy, steel bowl
    in_rajma: p => {
        const out = [winSteel(p), winGravy(p, { R: 76, c: '#7e2c16', oil: '#b8481c' })];
        out.push(`<g ${p.sh(.5)}>`);
        winSpots('rajma', 48, 64, 10).forEach(([x, y, r]) => out.push(winBean(p, x, y, 13, r)));
        out.push('</g>');
        out.push(winOil(p, 100, 100, 120, { n: 8, c: '#c8561e', op: .5 }));
        out.push(winCoriander(p, 100, 100, 36, { n: 6, seed: 3 }));
        return out.join('');
    },

    // palak paneer: green spinach gravy, paneer cubes, cream swirl, white bowl
    in_palakpaneer: p => {
        const out = [K.bowl(p, { glaze: '#e9e4da', inside: '#f6f2ea' }), winGravy(p, { R: 76, c: '#3f6a1c', oil: '#7a8a2a' })];
        const R = rng('palak');
        let tex = '';
        for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 64; tex += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d)} d="${smooth(ring(3 + R() * 6, 7, .5, R))}" fill="${R() < .5 ? '#2f5414' : '#5a8a2a'}" opacity=".45"/>`; }
        out.push(tex);
        winSpots('paneer', 9, 52, 22).forEach(([x, y, r]) => out.push(winPaneer(p, x, y, 18, r)));
        out.push(`<path d="M70,108 Q86,96 100,108 T132,104" stroke="#fffaf0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`);
        return out.join('');
    },

    // vegetable pulao on a white plate
    in_pulao: p => {
        const out = [K.plate(p, { rim: '#c7a14a' }), winBasmati(p, 100, 100, 148, { tint: '#f6efdc', seed: 1, sy: .94 })];
        out.push(`<g ${p.sh(.5)}>`);
        winSpots('pul-c', 12, 58, 14).forEach(([x, y, r]) => out.push(winDice(p, x, y, 8, r, '#ee7a2a')));
        winSpots('pul-b', 8, 58, 18).forEach(([x, y, r]) => out.push(K.greenBean(p, x, y, 11, r)));
        out.push('</g>');
        out.push(winPeas(p, 100, 100, 120, { n: 22, sz: 5.5 }));
        // whole spices: bay leaf, cloves, cinnamon
        out.push(`<g ${T(132, 70, 30)}><path d="M-16,0 Q-6,-6 12,-2 Q16,0 12,2 Q-6,6 -16,0Z" fill="${p.g('#7a8a4a', .3, .3)}" stroke="#4a5a2a" stroke-width=".6"/><path d="M-15,0 L13,0" stroke="#a8b47a" stroke-width=".6"/></g>`);
        out.push(`<g ${T(70, 130, -20)}><rect x="-10" y="-2.6" width="20" height="5.2" rx="2.4" fill="${p.g('#9a5a2a', .3, .3)}" stroke="#5a3010" stroke-width=".5"/><path d="M-9,0 L9,0" stroke="#c48a4a" stroke-width=".7"/></g>`);
        [[86, 72], [118, 134], [140, 108]].forEach(([x, y]) => out.push(`<g ${T(x, y, x)}><path d="M-4,0 L3,0" stroke="#4a2a14" stroke-width="1.4" stroke-linecap="round"/><circle cx="4" cy="0" r="1.8" fill="#5a3418"/></g>`));
        out.push(winSeeds(p, 100, 100, 110, { n: 14, kind: 'cumin' }));
        return out.join('');
    },

    // aloo gobi: turmeric potato cubes and cauliflower florets, steel bowl
    in_aloogobi: p => {
        const out = [winSteel(p), `<circle cx="100" cy="100" r="74" fill="${p.rg('#d9a94a', .2, .3)}" opacity=".55"/>`];
        const sp = winSpots('aloogobi', 16, 58, 19);
        sp.forEach(([x, y, r], i) => out.push(i % 2 ? winDice(p, x, y, 17, r, '#e9b43a') : winCauli(p, x, y, 26, r)));
        winSpots('ag-t', 5, 50, 22).forEach(([x, y, r]) => out.push(winDice(p, x, y, 7, r, '#d8402a')));
        out.push(winCoriander(p, 100, 100, 80, { n: 9, seed: 4 }));
        return out.join('');
    },

    // bhindi masala: okra rounds and pieces with onion, steel plate
    in_bhindi: p => {
        const out = [winThali(p, { R: 92 })];
        const R = rng('bhindi');
        out.push(`<path d="${smooth(ring(64, 12, .14, R))}" transform="translate(100 100)" fill="${p.rg('#8a6a2a', .2, .3)}" opacity=".45"/>`);
        out.push(`<g ${p.sh(.5)}>`);
        winSpots('bh-o', 44, 64, 11).forEach(([x, y, r], i) => out.push(i % 3 ? winOkraBit(p, x, y, 13, r) : winOkraBit(p, x, y, 14, r, { side: true })));
        out.push('</g>');
        winSpots('bh-n', 7, 56, 20).forEach(([x, y, r]) => out.push(K.onion(p, x, y, 16, r, { c: '#d8a868' })));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#a8481c', n: 24, r: .8 }));
        return out.join('');
    },

    // cucumber raita: white yogurt, grated cucumber, cumin and chili dust, mint
    in_raita: p => {
        const out = [winSteel(p), `<circle cx="100" cy="100" r="76" fill="${p.rg('#fbf8f0', .2, .1)}"/>`];
        out.push(K.shreds(p, 100, 100, 110, { c: '#9cc46a', n: 40, w: 1.8, len: .14, seed: 2 }));
        out.push(K.shreds(p, 100, 100, 100, { c: '#4f8a2e', n: 12, w: 1.4, len: .1, seed: 3 }));
        out.push(K.sprinkle(p, 104, 98, 46, { c: '#8a5a2a', n: 26, r: .8 }));
        out.push(K.sprinkle(p, 96, 104, 30, { c: '#c8401c', n: 12, r: .8 }));
        out.push(`<g ${p.sh(.5)}>${[[88, 86, -20], [96, 80, 30], [92, 92, 100]].map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-6,0 Q-2,-4 6,0 Q-2,4 -6,0Z" fill="${p.g('#4f9a3a', .3, .25)}" stroke="#2f6a22" stroke-width=".5"/><path d="M-5,0 L5,0" stroke="#8cc86a" stroke-width=".5"/></g>`).join('')}</g>`);
        out.push(winShine(100, 100, 76, .5));
        return out.join('');
    },

    // kachumber: diced cucumber, tomato, red onion, coriander, lemon; white bowl
    in_kachumber: p => {
        const out = [K.bowl(p, { glaze: '#e8e3d8', inside: '#f6f3ec' })];
        out.push(`<g ${p.sh(.5)}>`);
        winSpots('kach', 48, 66, 13.5).forEach(([x, y, r], i) => out.push(winSaladDice(p, x, y, 14, r, ['tom', 'cuc', 'oni', 'cuc', 'tom'][i % 5])));
        out.push('</g>');
        out.push(winCoriander(p, 100, 100, 110, { n: 10, seed: 5 }));
        out.push(K.lemon(p, 142, 140, 30, -40));
        out.push(K.sprinkle(p, 100, 100, 90, { c: '#9a5a3a', n: 16, r: .7 }));
        return out.join('');
    },

    // cabbage poriyal: shredded cabbage with coconut, mustard seeds, curry leaves; steel bowl
    in_poriyal: p => {
        const out = [winSteel(p), `<circle cx="100" cy="100" r="74" fill="${p.rg('#e2e9b8', .2, .2)}"/>`];
        out.push(K.shreds(p, 100, 100, 118, { c: '#c9dc8a', n: 60, w: 2.6, len: .2, seed: 1, curve: .6 }));
        out.push(K.shreds(p, 100, 100, 110, { c: '#e9efc8', n: 40, w: 2.4, len: .18, seed: 2, curve: .6 }));
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#fbf8ee', n: 60, r: 1.4 }));
        out.push(winSeeds(p, 100, 100, 110, { n: 30 }));
        out.push(K.sprinkle(p, 100, 100, 100, { c: '#f2e6c4', n: 10, r: 1.6 }));
        [[74, 80, 30], [128, 76, -40], [118, 126, 120], [80, 122, 60]].forEach(([x, y, r]) => out.push(winCurryLeaf(p, x, y, 18, r)));
        out.push(winRedChili(p, 104, 98, 22, 30));
        return out.join('');
    },

    // baingan bharta: smoky mashed eggplant with tomato and onion; steel bowl
    in_bharta: p => {
        const out = [winSteel(p), `<circle cx="100" cy="100" r="75" fill="${p.rg('#7e6634', .2, .3)}"/>`];
        const R = rng('bharta');
        let mash = '';
        for (let i = 0; i < 30; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 64; mash += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, R() * 360)} d="${smooth(ring(3 + R() * 6, 7, .55, R, 1.4, .7))}" fill="${['#5a4a24', '#9a7c42', '#6e5a2c', '#4a3a1a'][Math.floor(R() * 4)]}" opacity=".6"/>`; }
        out.push(mash);
        winSpots('bh-t', 14, 60, 13).forEach(([x, y, r]) => out.push(winDice(p, x, y, 7, r, '#c8402a')));
        winSpots('bh-on', 8, 58, 16).forEach(([x, y, r]) => out.push(winDice(p, x, y, 6, r, '#e9d9b0')));
        out.push(winOil(p, 100, 100, 120, { n: 9, c: '#d9a02a', op: .5 }));
        out.push(winCoriander(p, 100, 100, 60, { n: 8, seed: 6 }));
        return out.join('');
    },

    // dal tadka: yellow dal with cumin, garlic, red chili tadka and ghee; steel katori
    in_dal: p => [
        winSteel(p),
        K.liquid(p, { R: 76, c: '#e2a72a', op: 1, shine: false }),
        `<path d="${smooth(ring(34, 10, .4, rng('tadka'), 1.2, .9))}" transform="translate(102 98)" fill="#d27a1c" opacity=".55"/>`,
        winOil(p, 102, 98, 70, { n: 14, c: '#f0b83a', op: .7, rmax: 3 }),
        winSeeds(p, 100, 98, 70, { n: 26, kind: 'cumin' }),
        winGarlic(p, 100, 98, 50),
        winRedChili(p, 116, 90, 26, 30), winRedChili(p, 88, 112, 22, -60),
        winCoriander(p, 92, 92, 36, { n: 6, seed: 7 }),
        winShine(100, 100, 76, .4),
    ].join(''),

    // sambar: tamarind lentil stew with drumstick, carrot, eggplant, shallots; steel katori
    in_sambar: p => {
        const out = [winSteel(p), K.liquid(p, { R: 76, c: '#c2661e', op: 1, shine: false })];
        out.push(winDrumstick(p, 78, 84, 34, 30), winDrumstick(p, 128, 114, 32, -20));
        winSpots('sam-c', 6, 58, 20).forEach(([x, y, r]) => out.push(winDice(p, x, y, 12, r, '#ee7a2a', { op: .9 })));
        [[118, 74], [76, 124]].forEach(([x, y], i) => out.push(K.eggplant(p, x, y, 20, i * 70)));
        winSpots('sam-s', 6, 54, 22).forEach(([x, y, r]) => out.push(winShallot(p, x, y, 12, r)));
        out.push(`<circle cx="100" cy="100" r="76" fill="#c2661e" opacity=".18"/>`);
        out.push(winOil(p, 100, 100, 120, { n: 10, c: '#e88a2a', op: .55 }));
        out.push(winSeeds(p, 100, 100, 90, { n: 22 }));
        [[96, 100, 20], [140, 90, -60], [64, 104, 100]].forEach(([x, y, r]) => out.push(winCurryLeaf(p, x, y, 16, r)));
        out.push(winCoriander(p, 104, 112, 30, { n: 4, seed: 8 }));
        out.push(winShine(100, 100, 76, .4));
        return out.join('');
    },

    // rasam: thin tomato-tamarind broth, translucent; steel katori
    in_rasam: p => {
        const out = [winSteel(p), K.liquid(p, { R: 76, c: '#c8421a', op: .72, shine: false })];
        winSpots('ras-t', 9, 56, 18).forEach(([x, y, r]) => out.push(`<g ${T(x, y, r)}><path d="${smooth(ring(5.5, 7, .5, rng('rt' + x), 1.3, .8))}" fill="#e2482a" stroke="#a8241a" stroke-width=".5" opacity=".9"/></g>`));
        out.push(winSeeds(p, 100, 100, 100, { n: 24 }));
        out.push(K.sprinkle(p, 100, 100, 110, { c: '#2a1a12', n: 18, r: .7 }));
        [[90, 86, 20], [120, 110, -60], [76, 118, 100], [124, 76, 160]].forEach(([x, y, r]) => out.push(winCurryLeaf(p, x, y, 16, r)));
        out.push(winCoriander(p, 104, 100, 70, { n: 12, seed: 9 }));
        out.push(winShine(100, 100, 76, .5));
        return out.join('');
    },
};
