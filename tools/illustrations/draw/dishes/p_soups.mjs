// 汁もの（スープ・汁・シチュー）の絵を、短い設定（器・スープの色・具）から描く
// 設定は tools/illustrations/specs/soups-<cc>.json（国ごと）に、料理 ID ごとに書く:
// { "fr_soupe_oignon": { "vessel": "crock", "broth": "#9a5a2a", "body": "clear", "top": [["cheese",1],["bread",1]], "garnish": "parsley" } }
//   vessel: wan（汁椀）| bowl（深皿）| deep（白い深皿）| pot（両手鍋）| crock（耐熱の器）| clay（土鍋）| stone（石鍋）| metal（金属の器）| mug（取っ手つきカップ）| gourd（ひょうたん型の椀）
//   vesselColor / inside: 器の色（任意）
//   broth: スープの色。body: clear（澄んだ）| cream（とろり・ポタージュ）| chunky（具だくさんで汁が少なく見える）| stew（シチュー・煮込み）
//   oil: true でスープの表面に油の粒。swirl: "#hex" でクリームのうず
//   top: [[種類, 数], …]（下の KINDS）。garnish: herbs | parsley | scallion | chili | sesame | pepper | dill | cilantro | none
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk } = K;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SPECS = path.resolve(HERE, '../../specs');

// ---------- 器 ----------
function vessel(p, kind, { vesselColor, inside } = {}){
    switch (kind){
        case 'wan': return K.wan(p, Object.assign({}, vesselColor ? { outer: vesselColor } : {}, inside ? { inner: inside } : {}));
        case 'deep': return K.bowl(p, { glaze: vesselColor || '#f1ede4', inside: inside || '#faf8f2' });
        case 'pot': {
            const c = vesselColor || '#b9bbbd';
            return `<g ${p.sh(1.6)}><rect x="2" y="88" width="24" height="24" rx="8" fill="${dk(c, .2)}"/><rect x="174" y="88" width="24" height="24" rx="8" fill="${dk(c, .2)}"/></g>` + K.bowl(p, { R: 86, glaze: c, inside: inside || dk(c, .35) });
        }
        case 'crock': return K.bowl(p, { glaze: vesselColor || '#8a4a2a', inside: inside || '#f0e2cc' });
        case 'clay': return K.bowl(p, { glaze: vesselColor || '#5a3a2c', inside: inside || '#3a2620' });
        case 'stone': return K.bowl(p, { glaze: vesselColor || '#3c3a38', inside: inside || '#2a2826' });
        case 'metal': return K.bowl(p, { glaze: vesselColor || '#c7cacd', inside: inside || '#e3e6e8' });
        case 'mug': {
            const c = vesselColor || '#e9e3d6';
            return `<g ${p.sh(1.6)}><path d="M176,80 q22,20 0,40" stroke="${dk(c, .15)}" stroke-width="10" fill="none" stroke-linecap="round"/></g>` + K.bowl(p, { R: 84, glaze: c, inside: inside || lt(c, .5) });
        }
        case 'gourd': return K.bowl(p, { glaze: vesselColor || '#9a7a4a', inside: inside || '#efe2c4' });
        default: return K.bowl(p, { glaze: vesselColor || '#6e4b33', inside: inside || '#efe5d3' });
    }
}

// ---------- 具（スープの上に散らす） ----------
const KINDS = {
    tofu: (p, x, y, s, r) => K.tofu(p, x, y, s * .5, s * .5, r),
    wakame: (p, x, y, s, r, i) => K.wakame(p, x, y, s * .9, r, { seed: i }),
    egg: (p, x, y, s, r, i) => K.eggRibbons(p, x, y, s * 1.4, { seed: i }),
    eggHalf: (p, x, y, s, r) => K.eggHalf(p, x, y, s * .9, r),
    poached: (p, x, y, s, r) => K.friedEgg(p, x, y, s * 1.1, r),
    shiitake: (p, x, y, s, r) => K.shiitake(p, x, y, s * .7, r),
    mushroom: (p, x, y, s, r) => K.shiitake(p, x, y, s * .6, r, { cross: false }),
    shimeji: (p, x, y, s, r) => K.shimeji(p, x, y, s * .8, r),
    carrot: (p, x, y, s, r) => K.carrotRound(p, x, y, s * .45, { r }),
    leek: (p, x, y, s, r) => K.negiPiece(p, x, y, s * .45, r),
    scallion: (p, x, y, s, r, i) => K.scallions(p, x, y, s * .9, { n: 6, seed: i }),
    chicken: (p, x, y, s, r, i) => K.chickenPiece(p, x, y, s * .75, r, { seed: i, c: '#e3c9a2', skin: '#d9b07a' }),
    pork: (p, x, y, s, r, i) => K.porkSlice(p, x, y, s * .9, r, { seed: i, char: false, gloss: .3 }),
    beef: (p, x, y, s, r, i) => K.beefSlice(p, x, y, s * .85, r, { seed: i }),
    beefChunk: (p, x, y, s, r, i) => K.chickenPiece(p, x, y, s * .7, r, { seed: i, c: '#7b4527', skin: '#5e321b' }),
    meatball: (p, x, y, s) => K.meatball(p, x, y, s * .5),
    sausage: (p, x, y, s, r) => K.sausage(p, x, y, s * .7, r),
    bacon: (p, x, y, s, r) => K.bacon(p, x, y, s * .6, s * .3, r),
    ham: (p, x, y, s, r) => K.ham(p, x, y, s * .4, s * .3, r),
    shrimp: (p, x, y, s, r) => K.shrimp(p, x, y, s * .7, r),
    clam: (p, x, y, s, r) => K.clam(p, x, y, s * .6, r),
    mussel: (p, x, y, s, r) => `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${-s * .4},0 Q0,${-s * .28} ${s * .4},0 Q0,${s * .28} ${-s * .4},0Z" fill="${p.g('#2a2a40', .3, .2)}"/></g><path d="M${-s * .3},0 Q0,${-s * .16} ${s * .3},0" stroke="#f0a060" stroke-width="${s * .1}" fill="none"/></g>`,
    fish: (p, x, y, s, r) => K.tofu(p, x, y, s * .55, s * .42, r, { c: '#f4ece0' }),
    squid: (p, x, y, s, r) => K.squidRing(p, x, y, s * .5, r),
    crab: (p, x, y, s, r) => K.shreds(p, x, y, s * .8, { c: '#ef7a52', n: 8, w: 2, len: .6, seed: Math.round(x) }),
    potato: (p, x, y, s, r, i) => K.potato(p, x, y, s * .55, r, { seed: i }),
    sweetpotato: (p, x, y, s, r) => K.sweetPotato(p, x, y, s * .5, r),
    daikon: (p, x, y, s, r) => K.daikon(p, x, y, s * .5, r, { simmered: true }),
    onion: (p, x, y, s, r) => K.onion(p, x, y, s * .6, r),
    tomato: (p, x, y, s, r) => K.tomatoWedge(p, x, y, s * .55, r),
    cabbage: (p, x, y, s, r, i) => K.leafPiece(p, x, y, s * .8, r, { seed: i, cooked: true }),
    greens: (p, x, y, s, r, i) => K.greens(p, x, y, s * .8, { seed: i, n: 6 }),
    spinach: (p, x, y, s, r, i) => K.greens(p, x, y, s * .8, { seed: i, n: 6, c: '#2f6a24' }),
    corn: (p, x, y, s) => K.corn(p, x, y, s * .6, { n: 6 }),
    peas: (p, x, y, s, r, i) => K.sprinkle(p, x, y, s * .7, { c: '#6aa83a', n: 6, r: 2.4 }),
    beans: (p, x, y, s, r, i) => { const R = rng(p.id + 'bn' + i); let o = ''; for (let k = 0; k < 5; k++){ const a = R() * 6.28, d = R() * s * .35; o += `<ellipse cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" rx="${f(s * .1)}" ry="${f(s * .065)}" transform="rotate(${f(R() * 180)} ${f(x + Math.cos(a) * d)} ${f(y + Math.sin(a) * d)})" fill="${p.g('#8a4a32', .25, .2)}"/>`; } return o; },
    whitebeans: (p, x, y, s, r, i) => { const R = rng(p.id + 'wb' + i); let o = ''; for (let k = 0; k < 5; k++){ const a = R() * 6.28, d = R() * s * .35; o += `<ellipse cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" rx="${f(s * .1)}" ry="${f(s * .07)}" fill="${p.g('#f1e8d2', .25, .2)}" stroke="#d8ccb0" stroke-width=".5"/>`; } return o; },
    chickpeas: (p, x, y, s, r, i) => { const R = rng(p.id + 'cp' + i); let o = ''; for (let k = 0; k < 5; k++){ const a = R() * 6.28, d = R() * s * .35; o += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(s * .09)}" fill="${p.rg('#e2b86a', .25, .2)}"/>`; } return o; },
    lentils: (p, x, y, s, r, i) => K.sprinkle(p, x, y, s * .8, { c: '#a8622c', n: 14, r: 1.6 }),
    rice: (p, x, y, s) => K.rice(p, x, y, s * .6, { grains: .5 }),
    noodles: (p, x, y, s, r, i) => K.noodles(p, 100, 100, 110, { seed: i, n: 30 }),
    vermicelli: (p, x, y, s, r, i) => K.noodles(p, 100, 100, 100, { seed: i, n: 26, w: 1.3, c: '#efe4c8' }),
    pasta: (p, x, y, s, r) => K.macaroni(p, x, y, s * .45, r),
    dumpling: (p, x, y, s, r) => `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${-s * .4},${s * .1} Q${-s * .35},${-s * .38} 0,${-s * .4} Q${s * .35},${-s * .38} ${s * .4},${s * .1} Q0,${s * .3} ${-s * .4},${s * .1}Z" fill="${p.rg('#f6efe0', .25, .15)}" stroke="#ddd0b4" stroke-width=".7"/></g><path d="M${-s * .25},${-s * .2} q${s * .08},${s * .06} ${s * .16},0 q${s * .08},${s * .06} ${s * .16},0" stroke="#d8c8a8" stroke-width=".8" fill="none"/></g>`,
    pumpkin: (p, x, y, s, r) => K.kabocha(p, x, y, s * .5, r),
    zucchini: (p, x, y, s, r) => K.cucumberSlice(p, x, y, s * .45, r, { oval: 1 }),
    pepper: (p, x, y, s, r) => K.pepperPiece(p, x, y, s * .55, r),
    redpepper: (p, x, y, s, r) => K.pepperPiece(p, x, y, s * .55, r, { c: '#d8352a' }),
    okra: (p, x, y, s) => K.okra(p, x, y, s * .5),
    bamboo: (p, x, y, s, r) => K.bamboo(p, x, y, s * .5, r),
    lotus: (p, x, y, s, r) => K.lotus(p, x, y, s * .5, r),
    kimchi: (p, x, y, s, r, i) => K.kimchi(p, x, y, s * .8, r, { seed: i }),
    lemon: (p, x, y, s, r) => K.lemon(p, x, y, s * .55, r),
    lime: (p, x, y, s, r) => K.lemon(p, x, y, s * .5, r, { c: '#b8d86a', rind: '#4f8f2f' }),
    chili: (p, x, y, s, r) => `<g ${T(x, y, r)}><path d="M${-s * .3},0 Q0,${-s * .12} ${s * .3},0" stroke="#d42a1c" stroke-width="${s * .1}" fill="none" stroke-linecap="round"/></g>`,
    cheese: (p, x, y, s, r, i) => K.cheese(p, x, y, s * .9, { seed: i }),
    bread: (p, x, y, s, r) => `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-s * .4}" y="${-s * .3}" width="${s * .8}" height="${s * .6}" rx="${s * .14}" fill="${p.rg('#e2a656', .3, .25)}"/></g><rect x="${-s * .3}" y="${-s * .2}" width="${s * .6}" height="${s * .4}" rx="${s * .1}" fill="#f2cf8c" opacity=".8"/></g>`,
    croutons: (p, x, y, s) => K.crumbs(p, x, y, s * .8, { n: 7, c: '#e2a656' }),
    cream: (p, x, y, s) => `<path ${T(x, y)} d="${smooth(ring(s * .28, 7, .2, rng(p.id + 'cr' + x)))}" fill="#fbf7ee" opacity=".95"/>`,
    herbsprig: (p, x, y, s, r) => K.parsley(p, x, y, s * .5),
    seaweed: (p, x, y, s, r, i) => K.wakame(p, x, y, s * .8, r, { seed: i }),
    nori: (p, x, y, s) => K.noriStrips(p, x, y, s * .7, { n: 5 }),
    bokchoy: (p, x, y, s, r, i) => K.leafPiece(p, x, y, s * .8, r, { seed: i, c: '#5fa03a', vein: '#d9ecc0' }),
    sprouts: (p, x, y, s, r, i) => K.sprouts(p, x, y, s * .8, { n: 8, seed: i }),
    tripe: (p, x, y, s, r) => K.tofu(p, x, y, s * .5, s * .35, r, { c: '#efe0c4' }),
    plantain: (p, x, y, s, r) => K.carrotRound(p, x, y, s * .45, { c: '#f0c860', r }),
    avocado: (p, x, y, s, r) => `<g ${T(x, y, r)}><path d="M${-s * .3},0 Q0,${-s * .25} ${s * .3},0 Q0,${s * .2} ${-s * .3},0Z" fill="${p.g('#a8c86a', .3, .2)}" stroke="#4f7a2a" stroke-width="${s * .04}"/></g>`,
    tortilla: (p, x, y, s, r) => `<g ${T(x, y, r)}><path d="M${-s * .3},${s * .1} L0,${-s * .3} L${s * .3},${s * .1}Z" fill="${p.g('#e9b85a', .3, .2)}"/></g>`,
};

// ---------- 薬味（表面に細かく） ----------
function garnish(p, kind, R){
    switch (kind){
        case 'herbs': case 'parsley': return K.sprinkle(p, 100, 100, R * 1.6, { c: '#3f8a2c', n: 26, r: 1 });
        case 'dill': return K.sprinkle(p, 100, 100, R * 1.6, { c: '#5f9a3a', n: 30, r: .8 });
        case 'cilantro': return K.parsley(p, 100 + R * .25, 100 - R * .2, R * .5) + K.parsley(p, 100 - R * .3, 100 + R * .25, R * .4);
        case 'scallion': return K.scallions(p, 100, 100, R * 1.4, { n: 16, seed: 9 });
        case 'chili': return K.sprinkle(p, 100, 100, R * 1.5, { c: '#d42a1c', n: 18, r: .9 });
        case 'sesame': return K.sesame(p, 100, 100, R * 1.4, { n: 20 });
        case 'pepper': return K.sprinkle(p, 100, 100, R * 1.5, { c: '#3a2a20', n: 30, r: .6 });
        default: return '';
    }
}

// 具を置く位置（重なりすぎない）
function spots(seed, n, rmax, minD){
    const R = rng('psoup' + seed), out = [];
    for (let t = 0; t < 4000 && out.length < n; t++){
        const a = R() * 6.283, d = Math.sqrt(R()) * rmax, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d;
        if (out.every(([u, v]) => (u - x) ** 2 + (v - y) ** 2 >= minD * minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}

function drawSoup(p, sp){
    const R = sp.vessel === 'wan' ? 72 : sp.vessel === 'pot' ? 66 : 70;
    const body = sp.body || 'clear';
    let s = vessel(p, sp.vessel || 'bowl', sp);
    const brothOp = body === 'clear' ? .82 : 1;
    s += K.liquid(p, { R, c: sp.broth || '#c99a5a', op: brothOp });
    if (body === 'cream') s += `<circle cx="100" cy="100" r="${R * .8}" fill="${lt(sp.broth || '#e0b060', .18)}" opacity=".45"/>`;
    if (body === 'stew' || body === 'chunky') s += `<g ${p.rough(3, .1)}><circle cx="100" cy="100" r="${R * .86}" fill="${dk(sp.broth || '#a0603a', .12)}" opacity=".35"/></g>`;
    if (sp.swirl) s += `<path d="M${100 - R * .45},${100 + R * .1} C${100 - R * .3},${100 - R * .45} ${100 + R * .4},${100 - R * .4} ${100 + R * .3},${100 + R * .05} C${100 + R * .2},${100 + R * .35} ${100 - R * .15},${100 + R * .3} ${100 - R * .05},${100 + R * .05}" stroke="${sp.swirl}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`;
    // 具
    const tops = (sp.top || []).flatMap(([k, n]) => Array.from({ length: Math.max(0, Math.min(12, n || 1)) }, () => k)).filter(k => KINDS[k]);
    const size = tops.length <= 3 ? 66 : tops.length <= 6 ? 54 : tops.length <= 10 ? 44 : 38;
    const pos = spots(p.id, tops.length, R * .58, size * .55);
    s += `<g ${p.sh(.6)}>`;
    tops.forEach((k, i) => { const q = pos[i] || [100, 100, 0]; s += KINDS[k](p, q[0], q[1], size, q[2], i + 1); });
    s += `</g>`;
    if (sp.oil) s += K.sprinkle(p, 100, 100, R * 1.6, { c: '#f2b23a', n: 22, r: 1.6 });
    s += garnish(p, sp.garnish, R);
    return s;
}

// specs/soups-*.json をすべて読む
const out = {};
if (fs.existsSync(SPECS)){
    for (const file of fs.readdirSync(SPECS).filter(x => /^soups-.*\.json$/.test(x)).sort()){
        const specs = JSON.parse(fs.readFileSync(path.join(SPECS, file), 'utf8'));
        for (const [id, sp] of Object.entries(specs)) out[id] = p => drawSoup(p, sp);
    }
}
export const SOUP_KINDS = Object.keys(KINDS);
export default out;
