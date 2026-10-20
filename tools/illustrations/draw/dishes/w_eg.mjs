// World edition — Egypt (eg_) home cooking
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// =========================================================
// local parts (weg = world / egypt)
// =========================================================
const wegBlur = (p, s = 2) => `filter="url(#${p.def('wegbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;

// evenly spread positions in a circle
function wegSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('wegspots' + seed), out = [];
    for (let t = 0; t < 8000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// round aluminium oven tray (saniya)
function wegSaniya(p, { R = 94 } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#c6cacf', .35, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="#f1f3f5" stroke-width="1.6" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(R * .88)}" fill="${p.rg('#aeb3b9', .2, .25, .62, .64)}"/>
        <circle cx="100" cy="100" r="${f(R * .88)}" fill="none" stroke="#868c93" stroke-width="1.2"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .42)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .25)},${f(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// rectangular glass oven dish (Pyrex) with handles
function wegPyrex(p, { w = 176, h = 132 } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.4)}><rect x="${x - 8}" y="${y + h * .3}" width="${w + 16}" height="${h * .4}" rx="10" fill="#d9e4e4" opacity=".85"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${p.rg('#e3ecec', .3, .18, .35, .3)}" opacity=".95"/></g>
        <rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="14" fill="none" stroke="#ffffff" stroke-width="1.8" opacity=".9"/>
        <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="10" fill="#cfdcdb"/>
        <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="10" fill="none" stroke="#a9bcbb" stroke-width="1"/>`;
}
// woven bread basket
function wegBasket(p, { R = 94 } = {}){
    let weave = '';
    for (let i = 0; i < 4; i++){
        const rr = R - 4 - i * 4.2;
        weave += `<circle cx="100" cy="100" r="${f(rr)}" fill="none" stroke="${i % 2 ? '#a9773f' : '#c99a5c'}" stroke-width="3.4" stroke-dasharray="7 3" stroke-dashoffset="${i * 5}"/>`;
    }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#c4924f', .25, .3, .35, .3)}"/></g>${weave}
        <circle cx="100" cy="100" r="${R - 19}" fill="${p.rg('#b88447', .1, .35, .62, .64)}"/>
        <circle cx="100" cy="100" r="${R - 19}" fill="none" stroke="#8a5a28" stroke-width="1.2"/>`;
}
// aish baladi loaf (round, puffy, bran-dusted)
function wegAish(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'aish' + seed + x);
    const pts = ring(s / 2, 12, .07, R);
    let bran = '';
    for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .44; bran += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(.5 + R() * .7)}" fill="${R() < .5 ? '#9a6430' : '#f1dcb3'}" opacity=".85"/>`; }
    let blis = '';
    for (let i = 0; i < 5; i++){ const a = R() * 6.28, d = R() * s * .3; blis += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(s * (.05 + R() * .06))}" ry="${f(s * (.03 + R() * .04))}" fill="#8f5524" opacity=".35"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${smooth(pts)}" fill="${p.rg('#cf9455', .3, .3, .4, .36)}" stroke="#9a6430" stroke-width=".8"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .84 - 1, b * .84 - 1]))}" fill="${lt('#d9a466', .15)}" opacity=".7"/>
        <g ${wegBlur(p, 1.2)}>${blis}</g>${bran}
        <path d="M${f(-s * .3)},${f(-s * .16)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .18)},${f(-s * .3)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// small dice (tomato / cucumber / onion)
function wegDice(p, x, y, s, r, kind){
    const h = s / 2;
    if (kind === 'cuc') return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${p.g('#dbeab0', .2, .15)}" stroke="#9fbf6a" stroke-width=".5"/><rect x="${-h}" y="${-h}" width="${s}" height="${f(s * .26)}" rx="${f(s * .12)}" fill="#3f7a2c"/><circle cx="${f(s * .1)}" cy="${f(s * .15)}" r="${f(s * .1)}" fill="#f3f6dc"/></g>`;
    if (kind === 'oni') return `<g ${T(x, y, r)}><rect x="${-h * .8}" y="${-h * .8}" width="${s * .8}" height="${s * .8}" rx="${f(s * .18)}" fill="${p.g('#f5efe0', .3, .15)}" stroke="#dcccaa" stroke-width=".5" opacity=".95"/></g>`;
    return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .22)}" fill="${p.g('#e23a2a', .3, .25)}" stroke="#a5241a" stroke-width=".5"/><path d="M${f(-h * .4)},${f(-h * .2)} Q0,${f(h * .4)} ${f(h * .5)},${f(-h * .1)}" stroke="#f6c25a" stroke-width="${f(s * .16)}" fill="none" stroke-linecap="round" opacity=".8"/><path d="M${f(-h * .6)},${f(-h * .6)} L${f(h * .2)},${f(-h * .6)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".7"/></g>`;
}
// chopped parsley / herbs (tiny green flecks)
function wegHerb(p, x, y, s, { n = 18, seed = 1, c = '#3d8a2c' } = {}){
    const R = rng(p.id + 'herb' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${smooth(ring(1.4 + R() * 1.3, 5, .6, R))}" fill="${R() < .5 ? c : lt(c, .18)}"/>`; }
    return out;
}
// crispy fried onion strands
function wegCrispy(p, x, y, s, { n = 34, seed = 1 } = {}){
    const R = rng(p.id + 'crsp' + seed + x);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .85, L = 6 + R() * 7, b = R() * 3.14;
        const seg = `M${f(cx - Math.cos(b) * L / 2)},${f(cy - Math.sin(b) * L / 2)}q${f(Math.cos(b + 1.4) * 3)},${f(Math.sin(b + 1.4) * 3)} ${f(Math.cos(b) * L)},${f(Math.sin(b) * L)}`;
        if (R() < .55) a1 += seg; else a2 += seg;
    }
    return `<g ${p.sh(.5)}><path d="${a1}" stroke="#6e3610" stroke-width="3" fill="none" stroke-linecap="round"/><path d="${a2}" stroke="#a65a1c" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="${a1}" stroke="#c98638" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-.4 -.5)"/></g>`;
}
// chickpea
function wegChickpea(p, x, y, s){
    return `<g ${T(x, y)}><circle r="${s / 2}" fill="${p.rg('#e3be7c', .3, .25, .35, .32)}" stroke="#a9813f" stroke-width=".5"/><path d="M${f(-s * .1)},${f(-s * .45)} Q${f(s * .1)},${f(-s * .1)} ${f(-s * .05)},${f(s * .1)}" stroke="#b8904c" stroke-width=".6" fill="none"/><circle cx="${f(-s * .16)}" cy="${f(-s * .18)}" r="${f(s * .1)}" fill="#fff" opacity=".6"/></g>`;
}
// lentil scatter (small brown discs)
function wegLentils(p, x, y, s, { n = 40, seed = 1, c = '#7a5230', sy = 1 } = {}){
    const R = rng(p.id + 'len' + seed + x);
    let a = '', b = '';
    for (let i = 0; i < n; i++){ const an = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(an) * d, cy = y + Math.sin(an) * d * sy; const e = `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="1.9" ry="1.5" transform="rotate(${f(R() * 180)} ${f(cx)} ${f(cy)})"/>`; if (R() < .5) a += e; else b += e; }
    return `<g fill="${c}" stroke="${dk(c, .3)}" stroke-width=".4">${a}</g><g fill="${lt(c, .15)}" stroke="${dk(c, .3)}" stroke-width=".4">${b}</g>`;
}
// short macaroni / penne tube seen from above
function wegPenne(p, x, y, s, r = 0, { c = '#f0d28a' } = {}){
    const w = s * .36;
    return `<g ${T(x, y, r)}><path d="M${f(-s / 2 + w * .3)},${f(-w / 2)} L${f(s / 2)},${f(-w / 2)} L${f(s / 2 - w * .3)},${f(w / 2)} L${f(-s / 2)},${f(w / 2)}Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M${f(-s / 2 + w * .5)},${f(-w * .2)} L${f(s / 2 - w * .4)},${f(-w * .2)}" stroke="${dk(c, .12)}" stroke-width=".6"/><path d="M${f(-s * .3)},${f(-w * .32)} L${f(s * .2)},${f(-w * .32)}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".7"/></g>`;
}
// kofta finger (minced meat log)
function wegKofta(p, x, y, L, r = 0, { c = '#8a4a24', seed = 1 } = {}){
    const R = rng(p.id + 'kft' + seed + x + y);
    const w = L * .36;
    const pts = [];
    for (let i = 0; i < 8; i++){ const t = i / 7; pts.push([-L / 2 + t * L, -w / 2 * (i === 0 || i === 7 ? .55 : 1) + (R() - .5) * 1.6]); }
    for (let i = 7; i >= 0; i--){ const t = i / 7; pts.push([-L / 2 + t * L, w / 2 * (i === 0 || i === 7 ? .55 : 1) + (R() - .5) * 1.6]); }
    let char = '';
    for (let i = 0; i < 5; i++) char += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * w * .5)}" rx="${f(w * (.2 + R() * .2))}" ry="${f(w * .14)}" fill="${dk(c, .4)}" opacity=".4"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><g ${p.rough(1.4, .25)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g></g>
        <g ${p.crumb(.9)}><path d="${smooth(pts.map(([a, b]) => [a * .86, b * .6]), true, .8)}" fill="${lt(c, .1)}" opacity=".7"/></g>${char}
        <path d="M${f(-L * .34)},${f(-w * .22)} Q0,${f(-w * .42)} ${f(L * .3)},${f(-w * .24)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// roasted chicken leg quarter (thigh + drumstick)
function wegLeg(p, x, y, s, r = 0, { c = '#c77a2e' } = {}){
    const k = s / 60;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1)}>
        <path d="M14,-4 L27,-2 Q31,-4 32,0 Q31,4 27,2 L14,5Z" fill="#f2e6cc" stroke="#c8b48c" stroke-width=".8"/>
        <path d="M-26,-6 C-28,-18 -12,-24 0,-18 C8,-15 12,-9 16,-5 L16,6 C12,10 6,16 -4,18 C-18,20 -30,10 -26,-6Z" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .4)}" stroke-width=".9"/></g>
        <path d="M-20,-8 C-18,-14 -8,-17 0,-14" stroke="#fff3d6" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="-8" cy="4" rx="9" ry="6" fill="${dk(c, .35)}" opacity=".35"/><ellipse cx="6" cy="-6" rx="5" ry="3" fill="${dk(c, .45)}" opacity=".35"/>
        <path d="M-14,8 Q-6,12 4,9" stroke="${dk(c, .4)}" stroke-width="1" fill="none" opacity=".5"/>
        ${[[-16, -2], [-4, -8], [-10, 12], [4, 2]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r=".9" fill="#7a2e12" opacity=".7"/>`).join('')}</g>`;
}
// roasted potato wedge
function wegWedge(p, x, y, s, r = 0, { c = '#e9b35a' } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-15,3 Q-12,-7 0,-8 Q12,-8 15,1 L13,5 Q0,9 -13,6Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M-13,6 Q0,9 13,5 L14,3 Q0,6.5 -14,4Z" fill="#b7782f" opacity=".85"/>
        <ellipse cx="2" cy="-2" rx="6" ry="2.4" fill="${dk(c, .25)}" opacity=".3"/>
        <path d="M-9,-3 Q-2,-7 6,-5.5" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// round potato slice (baked in sauce)
function wegPotSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .44)}" fill="${p.rg('#ebc778', .25, .25)}" stroke="#b98a3a" stroke-width=".7"/><ellipse rx="${f(s * .36)}" ry="${f(s * .3)}" fill="none" stroke="#f6dfa0" stroke-width="1" opacity=".8"/></g>`;
}
// tomato slice (baked)
function wegTomSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="${p.g('#d8392a', .25, .25)}" stroke="#9e2418" stroke-width=".6"/><circle r="${f(s * .36)}" fill="#ea6a4a"/>
        ${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${f(Math.cos(i * 1.257) * s * .2)}" cy="${f(Math.sin(i * 1.257) * s * .2)}" rx="${f(s * .08)}" ry="${f(s * .05)}" transform="rotate(${f(i * 72)} ${f(Math.cos(i * 1.257) * s * .2)} ${f(Math.sin(i * 1.257) * s * .2)})" fill="#f4c35c"/>`).join('')}
        <circle r="${f(s * .08)}" fill="#f19a6a"/></g>`;
}
// green pepper ring
function wegPepRing(p, x, y, s, r = 0, { c = '#5c9a32' } = {}){
    const R = rng(p.id + 'ppr' + x + y);
    const pts = ring(s / 2, 8, .18, R);
    return `<g ${T(x, y, r)}><path d="${smooth(pts)}" fill="none" stroke="${dk(c, .3)}" stroke-width="${f(s * .16 + 1)}"/><path d="${smooth(pts)}" fill="none" stroke="${c}" stroke-width="${f(s * .16)}"/></g>`;
}
// whole okra pod (cooked, small)
function wegOkra(p, x, y, s, r = 0, { c = '#6f8a2e' } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><path d="M-15,-1.2 L-11,-1.6 L-11,1.6 L-15,1.2Z" fill="#a8925a" stroke="#6e5a2a" stroke-width=".5"/>
        <path d="M-11,0 Q-11,-6 -6,-6 Q6,-5.6 12,-2.2 Q15,0 12,2.2 Q6,5.6 -6,6 Q-11,6 -11,0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="M-9,-3 Q2,-3.6 12,-1 M-9,0 L13,0 M-9,3 Q2,3.6 12,1" stroke="${dk(c, .28)}" stroke-width=".8" fill="none" opacity=".8"/>
        <path d="M-6,-4.2 Q3,-4.4 9,-2.6" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// stew beef cube
function wegBeef(p, x, y, s, r = 0, { c = '#6e3a1e', seed = 1 } = {}){
    const R = rng(p.id + 'bf' + seed + x + y);
    const pts = ring(s / 2, 5, .2, R, 1.1, .9, .6);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .35)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .3)},${f(-s * .05)} Q0,${f(-s * .15)} ${f(s * .3)},${f(s * .02)}" stroke="${dk(c, .35)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f(-s * .26)},${f(-s * .22)} Q${f(-s * .05)},${f(-s * .34)} ${f(s * .14)},${f(-s * .26)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// stuffed zucchini standing up, seen from the top
function wegKoosa(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'koosa' + seed + x);
    let rice = '';
    for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .26; rice += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="1.9" ry="1" transform="rotate(${f(R() * 180)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="${R() < .5 ? '#f6e7c4' : '#e9c08a'}"/>`; }
    let herb = '';
    for (let i = 0; i < 5; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .24; herb += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r=".9" fill="#3f8a2c"/>`; }
    let spk = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28; spk += `<circle cx="${f(Math.cos(a) * s * .45)}" cy="${f(Math.sin(a) * s * .45)}" r=".9" fill="#e6efc8" opacity=".9"/>`; }
    return `<g ${T(x, y)}><g ${p.sh(1)}><circle r="${s / 2}" fill="${p.rg('#8fb35a', .25, .3, .38, .34)}" stroke="#4f7a2a" stroke-width=".8"/></g>${spk}
        <circle r="${f(s * .37)}" fill="${p.rg('#e6edc4', .2, .15)}"/>
        <circle r="${f(s * .3)}" fill="${p.rg('#d98a52', .25, .25)}"/>${rice}${herb}
        <path d="M${f(-s * .34)},${f(-s * .2)} A${f(s * .42)},${f(s * .42)} 0 0 1 ${f(-s * .05)},${f(-s * .42)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// ta'ameya disc (dark crust, sesame); broken=true shows the green inside
function wegTaameya(p, x, y, s, r = 0, { seed = 1, broken = false } = {}){
    const R = rng(p.id + 'tam' + seed + x + y);
    const pts = ring(s / 2, 11, .12, R);
    let ses = '';
    for (let i = 0; i < 9; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .38, cx = Math.cos(a) * d, cy = Math.sin(a) * d; ses += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="1.5" ry=".8" transform="rotate(${f(R() * 180)} ${f(cx)} ${f(cy)})" fill="#f6e6bf" stroke="#c9a66a" stroke-width=".25"/>`; }
    const body = `<g ${p.sh(.9)}><g ${p.rough(1.6, .2)}><path d="${smooth(pts)}" fill="${p.g('#8a4c1a', .3, .3)}" stroke="#4a2509" stroke-width=".7"/></g></g>
        <g ${p.crumb(.8)}><path d="${smooth(pts.map(([a, b]) => [a * .8, b * .8]))}" fill="#8f5420" opacity=".8"/></g>`;
    if (!broken) return `<g ${T(x, y, r)}>${body}${ses}<path d="M${f(-s * .28)},${f(-s * .18)} Q${f(-s * .08)},${f(-s * .34)} ${f(s * .14)},${f(-s * .28)}" stroke="#ffe2b0" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
    const cut = `M${f(-s / 2)},${f(s * .05)} L${f(s / 2)},${f(-s * .05)}`;
    let green = '';
    for (let i = 0; i < 22; i++) green += `<circle cx="${f((R() - .5) * s * .66)}" cy="${f(-s * .02 + R() * s * .26)}" r="${f(.8 + R() * 1.2)}" fill="${R() < .5 ? '#3f7a26' : '#9cc46a'}"/>`;
    return `<g ${T(x, y, r)}>${body}${ses}
        <path d="M${f(-s * .46)},${f(-s * .06)} Q0,${f(s * .5)} ${f(s * .46)},${f(-s * .06)} Q0,${f(-s * .02)} ${f(-s * .46)},${f(-s * .06)}Z" fill="${p.g('#6fa043', .25, .25)}" stroke="#4e7a2a" stroke-width=".6"/>${green}</g>`;
}
// fried whole fish (golden crust, scored)
function wegFish(p, x, y, L, r = 0, { c = '#b8722e', seed = 1 } = {}){
    const h = L * .23;
    const body = `M${-L * .5},0 C${-L * .42},${-h * .95} ${L * .12},${-h * 1.1} ${L * .32},${-h * .35} L${L * .5},${-h * .95} Q${L * .46},0 ${L * .5},${h * .95} L${L * .32},${h * .35} C${L * .12},${h * 1.1} ${-L * .42},${h * .95} ${-L * .5},0Z`;
    let cuts = '';
    for (let i = 0; i < 3; i++){ const cx = -L * .16 + i * L * .14; cuts += `<path d="M${f(cx + h * .25)},${f(-h * .62)} Q${f(cx - h * .05)},0 ${f(cx + h * .25)},${f(h * .62)}" stroke="#5e3010" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${f(cx + h * .32)},${f(-h * .55)} Q${f(cx + h * .03)},0 ${f(cx + h * .32)},${f(h * .55)}" stroke="#f0c27a" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}>
        <path d="M${-L * .1},${-h * .8} Q${L * .02},${-h * 1.45} ${L * .2},${-h * .7}Z" fill="${dk(c, .2)}" stroke="${dk(c, .45)}" stroke-width=".6"/>
        <path d="M${-L * .05},${h * .8} Q${L * .06},${h * 1.35} ${L * .2},${h * .7}Z" fill="${dk(c, .2)}" stroke="${dk(c, .45)}" stroke-width=".6"/>
        <g ${p.crumb(.7)}><path d="${body}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g></g>
        <path d="M${L * .32},${-h * .35} L${L * .5},${-h * .95} Q${L * .46},0 ${L * .5},${h * .95} L${L * .32},${h * .35}Z" fill="${dk(c, .3)}" opacity=".5"/>
        <path d="M${L * .36},${-h * .45} L${L * .46},${-h * .2} M${L * .36},${h * .45} L${L * .46},${h * .2} M${L * .37},0 L${L * .47},0" stroke="${dk(c, .5)}" stroke-width=".7" opacity=".6"/>
        <path d="M${-L * .3},${-h * .78} Q${-L * .27},0 ${-L * .3},${h * .78}" stroke="${dk(c, .45)}" stroke-width="1.2" fill="none" opacity=".7"/>
        ${cuts}
        <circle cx="${f(-L * .4)}" cy="${f(-h * .18)}" r="${f(h * .17)}" fill="#efe2c8" stroke="#5e3010" stroke-width=".7"/><circle cx="${f(-L * .4)}" cy="${f(-h * .18)}" r="${f(h * .08)}" fill="#2a1406"/>
        <path d="M${-L * .25},${-h * .68} Q0,${-h * .95} ${L * .22},${-h * .5}" stroke="#ffe6b8" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// lemon wedge seen from top (half-moon with segments)
function wegLemonWedge(p, x, y, s, r = 0){ return K.lemon(p, x, y, s, r); }
// swirl on a dip (spiral groove)
function wegSwirl(cx, cy, R, c, w = 2.2, op = .5){
    const pts = [];
    for (let i = 0; i <= 40; i++){ const t = i / 40, a = t * 6.28 * 1.6, rr = R * (.18 + t * .82); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .92]); }
    return `<path d="${smooth(pts, false)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// oil drops on a surface
function wegOil(p, x, y, s, { n = 10, c = '#e8b93a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// whole fava bean (ful)
function wegFul(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .36)}" fill="${p.g('#8a5a32', .25, .3)}" stroke="#5a3418" stroke-width=".5"/><path d="M${f(s * .3)},${f(-s * .14)} Q${f(s * .42)},0 ${f(s * .3)},${f(s * .14)}" stroke="#3e220c" stroke-width="1.1" fill="none"/><ellipse cx="${f(-s * .14)}" cy="${f(-s * .12)}" rx="${f(s * .14)}" ry="${f(s * .06)}" fill="#fff" opacity=".5"/></g>`;
}
// short toasted vermicelli bits
function wegVermicelli(p, x, y, s, { n = 40, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'verm' + seed + x);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, L = 5 + R() * 6, b = R() * 3.14; const seg = `M${f(cx - Math.cos(b) * L / 2)},${f(cy - Math.sin(b) * L / 2)}q${f(Math.cos(b + 1.5) * 1.5)},${f(Math.sin(b + 1.5) * 1.5)} ${f(Math.cos(b) * L)},${f(Math.sin(b) * L)}`; if (R() < .5) a1 += seg; else a2 += seg; }
    return `<path d="${a1}" stroke="#a8601f" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="${a2}" stroke="#c98a3c" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
}
// long-ish rice grains on a mound (Egyptian short grain: plump)
function wegRice(p, x, y, s, { sy = 1, tint = '#f7f2e4', seed = 1, n = null } = {}){
    const R = rng(p.id + 'wrice' + seed + x + y);
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
        <path d="${lit}" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/></g>`;
}
// soup shine
const wegShine = (cx, cy, R, op = .4) => `<path d="M${cx - R * .62},${cy - R * .25} A${R * .7},${R * .7} 0 0 1 ${cx - R * .12},${cy - R * .66}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// white soup bowl with a thin coloured line
function wegSoupBowl(p, line = '#c7a14a'){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="92" fill="${p.rg('#fbfaf6', .2, .16, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="88" fill="none" stroke="${line}" stroke-width="2"/>
        <circle cx="100" cy="100" r="78" fill="${p.rg('#f2eee4', .1, .25, .62, .64)}"/>`;
}

// =========================================================
export default {
    // aish baladi in a woven basket
    eg_staple: p => [
        wegBasket(p),
        wegAish(p, 80, 84, 92, 0, { seed: 1 }),
        wegAish(p, 124, 112, 86, 30, { seed: 2 }),
        wegAish(p, 84, 128, 66, 60, { seed: 3 }),
    ].join(''),

    // koshari: rice & lentils, macaroni, chickpeas, red sauce, crispy onions
    eg_koshari: p => {
        const out = [K.bowl(p, { glaze: '#e8e2d6', inside: '#f6f2ea' })];
        out.push(wegRice(p, 100, 100, 150, { tint: '#e9d8b4', seed: 1, n: 100 }));
        out.push(wegLentils(p, 100, 100, 144, { n: 60, seed: 1 }));
        out.push(`<g ${p.sh(.6)}>`);
        wegSpots('kosh-mac', 28, 60, 14).forEach(([x, y, r], i) => { if (Math.hypot(x - 100, y - 100) > 30) out.push(K.macaroni(p, x, y, 17, r, { c: '#f1cf80' })); });
        out.push('</g>');
        wegSpots('kosh-chk', 14, 62, 13).forEach(([x, y]) => { if (Math.hypot(x - 100, y - 100) > 34) out.push(wegChickpea(p, x, y, 10)); });
        out.push(K.pool(p, 100, 100, 74, '#b8381a', { seed: 2, sy: .9 }));
        out.push(wegOil(p, 100, 100, 60, { n: 7, c: '#d9531f', op: .6, rmax: 2 }));
        out.push(wegCrispy(p, 102, 98, 60, { n: 60 }));
        return out.join('');
    },

    // macarona bechamel in a Pyrex dish: golden spotted top, one portion cut out showing penne and meat layers
    eg_macarona: p => {
        const R = rng(p.id + 'spots');
        let spots = '';
        for (let i = 0; i < 34; i++){ const x = 24 + R() * 152, y = 44 + R() * 110; spots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(6 + R() * 10)}" ry="${f(4 + R() * 7)}" fill="${R() < .5 ? '#c8822e' : '#b06a22'}" opacity="${f(.5 + R() * .4)}"/>`; }
        let dark = '', bub = '';
        for (let i = 0; i < 18; i++){ const x = 30 + R() * 140, y = 50 + R() * 100; dark += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2 + R() * 3)}" ry="${f(1.5 + R() * 2)}" fill="#7a3f12" opacity=".6"/>`; }
        for (let i = 0; i < 16; i++){ const x = 30 + R() * 140, y = 50 + R() * 100; bub += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + R() * 1.4)}" fill="#fff4cc" opacity=".7"/>`; }
        const clip = p.uid();
        // the cut face: penne ends and a mince band
        let face = `<rect x="122" y="104" width="58" height="11" fill="#f3dfae"/><rect x="122" y="104" width="11" height="54" fill="#f3dfae"/>`;
        for (let x = 133; x < 178; x += 9) face += `<ellipse cx="${x}" cy="108" rx="3.6" ry="2.6" fill="#f0cf82" stroke="#b98a3a" stroke-width=".6"/><ellipse cx="${x}" cy="108" rx="1.6" ry="1.1" fill="#9a6a2a"/>`;
        for (let y = 116; y < 156; y += 9) face += `<ellipse cx="126" cy="${y}" rx="2.6" ry="3.6" fill="#f0cf82" stroke="#b98a3a" stroke-width=".6"/><ellipse cx="126" cy="${y}" rx="1.1" ry="1.6" fill="#9a6a2a"/>`;
        face += `<path d="M131,113 L180,113 M131,113 L131,158" stroke="#7a4524" stroke-width="3" stroke-dasharray="3 1.5"/>`;
        return [
            wegPyrex(p),
            // the empty corner: glass bottom with a smear of sauce

            `<path ${T(150, 132)} d="${smooth(ring(14, 8, .5, rng('smear'), 1.4, .7))}" fill="#e9d7a8" opacity=".75"/>`,
            `<clipPath id="${clip}"><path d="M20,42 L180,42 L180,104 L122,104 L122,158 L20,158Z"/></clipPath>`,
            `<g clip-path="url(#${clip})"><rect x="20" y="42" width="160" height="116" rx="10" fill="${p.g('#eebd5c', .3, .2)}"/>`,
            `<g ${wegBlur(p, 3.4)}>${spots}</g><g ${wegBlur(p, .8)}>${dark}</g>${bub}`,
            `<path d="M34,60 Q70,50 110,56" stroke="#fff6d8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/></g>`,
            face,
            `<path d="M133,115 L180,115 M133,115 L133,158" stroke="#5a3418" stroke-width="1.6" opacity=".35"/>`,
        ].join('');
    },

    // oven chicken with potatoes on a round aluminium tray
    eg_firakh: p => [
        wegSaniya(p),
        K.pool(p, 100, 104, 140, '#c2702e', { seed: 1, op: .55, sy: .9 }),
        `<g ${p.sh(.8)}>`,
        wegWedge(p, 52, 80, 32, -60), wegWedge(p, 60, 128, 32, 40), wegWedge(p, 100, 152, 30, 0), wegWedge(p, 146, 136, 32, -40), wegWedge(p, 152, 86, 30, 70), wegWedge(p, 104, 50, 30, 10),
        K.onion(p, 76, 104, 18, 30, { c: '#e2b86e' }), K.onion(p, 128, 64, 16, -60, { c: '#e2b86e' }), K.onion(p, 136, 118, 16, 140, { c: '#e2b86e' }),
        `</g>`,
        K.pepperPiece(p, 120, 146, 16, 20, { c: '#5c9a32' }), K.pepperPiece(p, 70, 60, 15, -30, { c: '#5c9a32' }),
        wegLeg(p, 84, 78, 80, 20), wegLeg(p, 126, 104, 82, 160), wegLeg(p, 82, 126, 76, -10),
        wegTomSlice(p, 154, 112, 18, 0), wegTomSlice(p, 60, 102, 16, 0),
    ].join(''),

    // kofta bel saniya: kofta fingers on potato slices in tomato sauce, clay oval dish
    eg_kofta: p => {
        const out = [K.ovalDish(p, { rx: 94, ry: 80, base: '#b5683a', rim: null, deep: true })];
        out.push(`<ellipse cx="100" cy="100" rx="78" ry="64" fill="${p.rg('#c4472a', .2, .3)}"/>`);
        out.push(`<g ${p.sh(.6)}>`);
        [[50, 78], [70, 64], [96, 56], [124, 58], [148, 72], [154, 100], [148, 126], [124, 140], [96, 144], [68, 136], [48, 118], [44, 96]].forEach(([x, y], i) => out.push(wegPotSlice(p, x, y, 22, i * 30)));
        out.push('</g>');
        out.push(wegKofta(p, 70, 76, 44, -14, { seed: 1 }), wegKofta(p, 116, 70, 44, 6, { seed: 2 }), wegKofta(p, 66, 104, 44, 4, { seed: 3 }),
            wegKofta(p, 134, 100, 44, -8, { seed: 4 }), wegKofta(p, 86, 132, 44, 10, { seed: 5 }), wegKofta(p, 130, 130, 42, -16, { seed: 6 }));
        out.push(wegTomSlice(p, 100, 100, 20), wegTomSlice(p, 94, 60, 15), wegTomSlice(p, 108, 144, 15));
        out.push(wegPepRing(p, 48, 90, 12), wegPepRing(p, 156, 116, 12));
        out.push(`<path d="M40,80 Q60,52 100,46" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35"/>`);
        return out.join('');
    },

    // fried tilapia: two whole fish, lemon, parsley
    eg_samak: p => [
        K.plate(p, { rim: '#2f6f6a' }),
        wegFish(p, 98, 76, 132, -8, { seed: 1 }),
        wegFish(p, 102, 124, 128, -4, { c: '#b06a28', seed: 2 }),
        K.lemon(p, 150, 158, 26, -30), K.lemon(p, 46, 40, 22, 140),
        K.parsley(p, 60, 158, 20),
    ].join(''),

    // bamya: okra and beef in red tomato stew, earthenware bowl
    eg_bamya: p => {
        const out = [K.bowl(p, { glaze: '#7a3e22', inside: '#a85a32' }), K.liquid(p, { R: 72, c: '#b8401e', op: .97 })];
        out.push(`<g ${p.sh(.6)}>`);
        wegSpots('bamya-b', 6, 50, 30).forEach(([x, y, r], i) => out.push(wegBeef(p, x, y, 24, r, { seed: i, c: '#7e4528' })));
        wegSpots('bamya-o', 20, 60, 16).forEach(([x, y, r]) => out.push(wegOkra(p, x, y, 24, r)));
        out.push('</g>');
        out.push(wegOil(p, 100, 100, 120, { n: 12, c: '#e0652e', op: .55, rmax: 2.4 }));
        out.push(wegShine(100, 100, 72, .35));
        return out.join('');
    },

    // mahshi koosa: stuffed zucchini standing in tomato broth, aluminium pot
    eg_mahshi: p => {
        const out = [K.bowl(p, { glaze: '#a7adb4', inside: '#8d939a', lip: .9 }), K.liquid(p, { R: 76, c: '#c2532c', op: .95 })];
        const pos = [[100, 100]];
        for (let i = 0; i < 6; i++){ const a = i / 6 * 6.28 + .3; pos.push([100 + Math.cos(a) * 46, 100 + Math.sin(a) * 46]); }
        pos.forEach(([x, y], i) => out.push(wegKoosa(p, x, y, 40, { seed: i })));
        out.push(wegHerb(p, 100, 100, 120, { n: 10, seed: 3 }));
        return out.join('');
    },

    // salata baladi: diced tomato, cucumber, onion, parsley
    eg_salata: p => {
        const out = [K.bowl(p, { glaze: '#3f6f8f', inside: '#f5f2ea' })];
        const R = rng('salata');
        out.push(`<g ${p.sh(.5)}>`);
        wegSpots('salata', 48, 66, 13.5).forEach(([x, y, r], i) => out.push(wegDice(p, x, y, 15, r, ['tom', 'cuc', 'tom', 'oni', 'cuc'][i % 5])));
        out.push('</g>');
        out.push(wegHerb(p, 100, 100, 120, { n: 30, seed: 2 }));
        out.push(K.lemon(p, 140, 62, 30, 30));
        return out.join('');
    },

    // tahina: pale smooth dip with swirl, oil, parsley, cumin
    eg_tahina: p => [
        K.plate(p, { R: 92, well: .8, rim: '#c7a14a' }),
        `<g ${p.sh(.6)}><path d="${smooth(ring(68, 14, .06, rng('tah'), 1, .96))}" transform="translate(100 100)" fill="${p.rg('#ead9b2', .3, .18)}"/></g>`,
        wegSwirl(100, 100, 60, '#b89a66', 3.6, .75),
        wegSwirl(98, 98, 60, '#fffaf0', 1.6, .85),
        K.pool(p, 100, 100, 40, '#d9a628', { op: .8, seed: 3 }),
        wegHerb(p, 100, 100, 70, { n: 22, seed: 4 }),
        K.sprinkle(p, 108, 92, 30, { c: '#9a4a1a', n: 14, r: .8 }),
    ].join(''),

    // baba ghanoug: smoky eggplant dip, oil pool, tomato, parsley
    eg_babaghanoug: p => {
        const R = rng('bg');
        let flecks = '';
        for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 58; flecks += `<ellipse cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" rx="${f(1 + R() * 2)}" ry="${f(.6 + R())}" fill="${R() < .5 ? '#5a4a3a' : '#7e6a4e'}" opacity=".6" transform="rotate(${f(R() * 180)} ${f(100 + Math.cos(a) * d)} ${f(100 + Math.sin(a) * d)})"/>`; }
        const out = [K.plate(p, { R: 92, well: .8, rim: '#2f6f6a' }),
            `<path d="${smooth(ring(64, 14, .08, rng('bgs'), 1, .96))}" transform="translate(100 100)" fill="${p.rg('#b39a78', .25, .2)}"/>`,
            flecks,
            wegSwirl(100, 100, 54, '#8e7656', 3.2, .55),
            K.pool(p, 98, 100, 40, '#c9a02a', { op: .75, seed: 2 }),
        ];
        out.push(`<g ${p.sh(.4)}>`);
        wegSpots('bg-t', 8, 26, 10).forEach(([x, y, r]) => out.push(wegDice(p, x, y, 7, r, 'tom')));
        out.push('</g>');
        out.push(wegHerb(p, 100, 100, 64, { n: 18, seed: 5 }));
        return out.join('');
    },

    // ta'ameya: dark green-inside falafel discs with sesame, tomato and parsley
    eg_taameya: p => [
        K.plate(p, { rim: '#c7a14a' }),
        K.parsley(p, 146, 148, 26), K.tomatoWedge(p, 152, 120, 26, -70), K.tomatoWedge(p, 128, 156, 24, 20),
        wegTaameya(p, 70, 70, 44, 0, { seed: 1 }), wegTaameya(p, 118, 64, 42, 30, { seed: 2 }), wegTaameya(p, 148, 92, 38, 60, { seed: 3 }),
        wegTaameya(p, 58, 114, 42, 10, { seed: 4 }), wegTaameya(p, 100, 104, 44, 80, { seed: 5 }),
        wegTaameya(p, 90, 146, 44, 160, { seed: 6, broken: true }),
    ].join(''),

    // ful medames: mashed fava beans in a small metal bowl, oil, cumin, tomato, parsley
    eg_ful: p => {
        const out = [K.bowl(p, { glaze: '#b5bac0', inside: '#9aa0a6', lip: .9 }),
            `<circle cx="100" cy="100" r="76" fill="${p.rg('#8f6236', .2, .3)}"/>`];
        const R = rng('fulmash');
        let mash = '';
        for (let i = 0; i < 22; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 64; mash += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d)} d="${smooth(ring(4 + R() * 5, 7, .5, R))}" fill="${R() < .5 ? '#a0703e' : '#7a4f2a'}" opacity=".7"/>`; }
        out.push(mash);
        wegSpots('ful-b', 28, 66, 14).forEach(([x, y, r]) => out.push(wegFul(p, x, y, 14, r)));
        out.push(K.pool(p, 98, 98, 70, '#e8b828', { op: .42, seed: 4, sy: .85 }));
        out.push(wegOil(p, 98, 98, 60, { n: 8, c: '#f2c838', op: .7, rmax: 2.6, seed: 3 }));
        out.push(K.sprinkle(p, 100, 100, 50, { c: '#8a3a12', n: 16, r: .9 }));
        out.push(`<g ${p.sh(.4)}>`);
        [[86, 88], [110, 92], [98, 110], [114, 108], [90, 104]].forEach(([x, y], i) => out.push(wegDice(p, x, y, 8, i * 25, 'tom')));
        out.push('</g>');
        out.push(wegHerb(p, 100, 100, 46, { n: 12, seed: 6 }));
        return out.join('');
    },

    // vermicelli rice
    eg_rozshaariya: p => [
        K.bowl(p, { glaze: '#c9b48a', inside: '#f6f1e6' }),
        wegRice(p, 100, 100, 146, { tint: '#f6f1e4', seed: 2, n: 420 }),
        wegVermicelli(p, 100, 100, 130, { n: 60, seed: 1 }),
    ].join(''),

    // red lentil soup: smooth orange-yellow, cumin, lemon, toasted bread
    eg_ads: p => {
        const out = [wegSoupBowl(p, '#c7a14a'), K.liquid(p, { R: 76, c: '#e59a32', op: 1, shine: false })];
        out.push(wegSwirl(100, 100, 40, '#f2c066', 2, .6));
        out.push(K.sprinkle(p, 96, 96, 50, { c: '#9a4a1a', n: 22, r: .8 }));
        out.push(wegOil(p, 100, 100, 90, { n: 8, c: '#f0b23a', op: .6, rmax: 2.2 }));
        out.push(`<g ${p.sh(.6)}>`);
        [[128, 120, 10], [140, 104, -20], [120, 138, 30], [142, 128, 5]].forEach(([x, y, r]) => out.push(`<g ${T(x, y, r)}><rect x="-6" y="-5.5" width="12" height="11" rx="2.4" fill="${p.g('#d39a4e', .3, .3)}" stroke="#8f5a22" stroke-width=".6"/><rect x="-4" y="-3.5" width="7" height="6" rx="1.5" fill="#efd6a2"/></g>`));
        out.push('</g>');
        out.push(wegHerb(p, 86, 88, 30, { n: 8, seed: 7 }));
        out.push(K.lemon(p, 64, 136, 30, 30));
        out.push(wegShine(100, 100, 76, .35));
        return out.join('');
    },

    // molokhia: dark green, glossy, with golden garlic flecks
    eg_molokhia: p => {
        const R = rng('molo');
        let tex = '';
        for (let i = 0; i < 18; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 64, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; tex += `<path ${T(x, y)} d="${smooth(ring(4 + R() * 8, 8, .5, R, 1.4, .7))}" fill="${R() < .5 ? '#6a8a28' : '#2f4512'}" opacity=".35"/>`; }
        let garlic = '';
        for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 52; garlic += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" r="${f(.8 + R() * 1.2)}" fill="${R() < .5 ? '#e0b04a' : '#c98a2a'}"/>`; }
        return [wegSoupBowl(p, '#3f7a3a'), K.liquid(p, { R: 76, c: '#46641c', op: 1, shine: false }), tex, garlic,
            wegOil(p, 100, 100, 100, { n: 9, c: '#d9b23a', op: .55, rmax: 2.6 }), wegShine(100, 100, 76, .5)].join('');
    },

    // orzo chicken soup: golden broth, orzo, shredded chicken, parsley
    eg_lesanasfour: p => {
        const R = rng('orzo');
        let orzo = '';
        for (let i = 0; i < 70; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 66, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; orzo += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3" ry="1.4" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="${R() < .6 ? '#f6e3b0' : '#e8c884'}" stroke="#c9a258" stroke-width=".4"/>`; }
        let chick = '';
        for (let i = 0; i < 7; i++){
            const a = R() * 6.28, d = Math.sqrt(R()) * 46, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d, b = R() * 3.14;
            let fib = '';
            for (let j = 0; j < 4; j++){ const o = (j - 1.5) * 2.6, L = 9 + R() * 6; fib += `M${f(-L / 2)},${f(o + (R() - .5))} q${f(L / 2)},${f((R() - .5) * 3)} ${f(L)},${f((R() - .5) * 2)}`; }
            chick += `<g ${T(x, y, b * 57)}><path d="${fib}" stroke="#c9a77a" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="${fib}" stroke="#f1dfbf" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>`;
        }
        return [wegSoupBowl(p, '#c7a14a'), K.liquid(p, { R: 76, c: '#e2b452', op: .95, shine: false }), orzo, `<g ${p.sh(.4)}>${chick}</g>`,
            wegOil(p, 100, 100, 110, { n: 10, c: '#f2c64a', op: .6, rmax: 2.4 }), wegHerb(p, 100, 100, 70, { n: 16, seed: 8 }),
            K.lemon(p, 138, 140, 26, -30), wegShine(100, 100, 76, .4)].join('');
    },
};
