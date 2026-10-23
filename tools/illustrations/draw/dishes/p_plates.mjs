// 主菜・副菜・ごはんもの・麺の絵を、短い設定（器・下に敷くもの・ソース・具）から描く（汁ものは p_soups.mjs）
// 設定は tools/illustrations/specs/dishes-<cc>.json に、料理 ID ごとに書く:
// { "fr_poulet_roti": { "vessel": "oval", "bed": "mash", "sauce": "#b8742e", "items": [["chickenleg",2],["carrot",4]], "glaze": "#c98a3a", "garnish": "parsley" } }
//   vessel: plate | oval | long | square | bowl | deep | kobachi | donburi | skillet | leaf | clay | metal | board
//     vesselColor / inside / rim: 器の色（任意）
//   bed: 下に敷くもの（任意）rice | noodles | pasta | greens | lettuce | mash | couscous | bulgur | cabbage | flatbread | tortilla
//   sauce: 皿に広がるソースの色（任意）。glaze: 具にかかるつやの色（任意）
//   items: [[種類, 個数], …] または [[種類, 個数, 大きさの倍率]]。種類は汁ものと同じ一覧（p_soups.mjs の KINDS）に、下の PLATE_KINDS を足したもの
//   garnish: herbs | parsley | scallion | chili | sesame | pepper | dill | cilantro | none
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as K from '../kit.mjs';
import { KINDS as SOUP_ITEMS, garnish, spots } from './p_soups.mjs';

const { T, f, smooth, ring, rng, lt, dk } = K;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SPECS = path.resolve(HERE, '../../specs');

// ---------- 器（R は具を置ける半径） ----------
function vessel(p, sp){
    const c = sp.vesselColor, ins = sp.inside, rim = sp.rim;
    switch (sp.vessel){
        case 'oval': return [K.ovalDish(p, Object.assign({}, c ? { base: c } : {}, rim ? { rim } : {})), 58];
        case 'long': return [K.longPlate(p, Object.assign({}, c ? { base: c } : {}, rim ? { rim } : {})), 52];
        case 'square': return [K.squareDish(p, Object.assign({}, c ? { base: c } : {}, rim ? { rim } : {})), 58];
        case 'bowl': return [K.bowl(p, { glaze: c || '#6e4b33', inside: ins || '#efe5d3' }), 62];
        case 'deep': return [K.bowl(p, { glaze: c || '#f1ede4', inside: ins || '#faf8f2' }), 64];
        case 'kobachi': return [K.kobachi(p, Object.assign({}, c ? { glaze: c } : {}, ins ? { inside: ins } : {})), 60];
        case 'donburi': return [K.donburi(p), 64];
        case 'clay': return [K.bowl(p, { glaze: c || '#8a4a2a', inside: ins || '#5a2e1a' }), 62];
        case 'metal': return [K.bowl(p, { glaze: c || '#c7cacd', inside: ins || '#dfe2e5', lip: .9 }), 66];
        case 'skillet': {
            const col = c || '#2c2a28';
            return [`<g ${p.sh(1.6)}><rect x="170" y="92" width="30" height="16" rx="6" fill="${dk(col, .1)}"/></g>` + K.bowl(p, { R: 86, glaze: col, inside: ins || lt(col, .12), lip: .9 }), 62];
        }
        case 'leaf': return [`<g ${p.sh(1.6)}><path d="M14,104 Q40,24 120,22 Q186,30 188,96 Q170,176 96,180 Q22,170 14,104Z" fill="${p.rg(c || '#3f8a3a', .2, .25)}"/></g><path d="M24,110 Q100,96 180,92" stroke="${lt(c || '#3f8a3a', .3)}" stroke-width="2" fill="none" opacity=".7"/>`, 60];
        case 'board': {
            const col = c || '#c89458';
            return [`<g ${p.sh(1.6)}><rect x="12" y="34" width="176" height="132" rx="14" fill="${p.rg(col, .25, .2, .35, .3)}"/></g>` + Array.from({ length: 6 }, (_, i) => `<path d="M20,${f(34 + (i + 1) * 132 / 7)} Q100,${f(34 + (i + 1) * 132 / 7 + (i % 2 ? 5 : -5))} 180,${f(34 + (i + 1) * 132 / 7)}" stroke="${dk(col, .25)}" stroke-width=".8" fill="none" opacity=".4"/>`).join(''), 56];
        }
        default: return [K.plate(p, Object.assign({}, c ? { base: c } : {}, rim ? { rim } : {})), 58];
    }
}

// ---------- 下に敷くもの ----------
function bed(p, kind, R){
    const s = R * 2;
    switch (kind){
        case 'rice': return K.rice(p, 100, 100, s * .95, { grains: .55 });
        case 'noodles': return K.noodles(p, 100, 100, s * .95, { n: 34, seed: 3 });
        case 'pasta': return K.noodles(p, 100, 100, s * .9, { n: 30, seed: 4, c: '#efcf7a', w: 2.8 });
        case 'greens': return K.greens(p, 100, 100, s * .9, { n: 14, seed: 5 });
        case 'lettuce': return [0, 1, 2, 3, 4, 5].map(i => K.leafPiece(p, 100 + Math.cos(i) * R * .45, 100 + Math.sin(i * 1.3) * R * .4, R * .8, i * 60, { seed: i, c: '#a9d27a' })).join('');
        case 'mash': return `<g ${p.sh(.7)}><path d="${smooth(ring(R * .8, 12, .1, rng(p.id + 'mash')))}" transform="translate(100 100)" fill="${p.rg('#f3e2b4', .25, .15)}"/></g><path d="M${100 - R * .4},100 q${R * .2},-${R * .15} ${R * .4},0 t${R * .4},0" stroke="#fff6dc" stroke-width="3" fill="none" opacity=".7"/>`;
        case 'couscous': return K.sprinkle(p, 100, 100, s * .9, { c: '#e8c77a', n: 220, r: 1.3 }) + `<circle cx="100" cy="100" r="${R * .85}" fill="#ecd08c" opacity=".35"/>`;
        case 'bulgur': return K.sprinkle(p, 100, 100, s * .9, { c: '#c98a42', n: 220, r: 1.3 }) + `<circle cx="100" cy="100" r="${R * .85}" fill="#d39a52" opacity=".35"/>`;
        case 'cabbage': return K.cabbageShreds(p, 100, 100, s * .9, { seed: 6 });
        case 'flatbread': return `<g ${p.sh(.8)}><circle cx="100" cy="100" r="${R * .9}" fill="${p.rg('#e7c88f', .25, .2)}"/></g>` + K.sprinkle(p, 100, 100, s * .8, { c: '#a8692c', n: 18, r: 2.4 });
        case 'tortilla': return `<g ${p.sh(.8)}><circle cx="100" cy="100" r="${R * .9}" fill="${p.rg('#ead39a', .25, .2)}"/></g>` + K.sprinkle(p, 100, 100, s * .8, { c: '#b88a4a', n: 14, r: 2 });
        default: return '';
    }
}

// ---------- 主菜・副菜の具（汁ものの具に足す） ----------
const PLATE_KINDS = {
    cutlet: (p, x, y, s, r) => K.cutletSlice(p, x, y, s * 1.1, s * .55, r),
    fillet: (p, x, y, s, r) => K.fishFillet(p, x, y, s * 1.4, s * .7, r),
    salmon: (p, x, y, s, r) => K.salmon(p, x, y, s * 1.1, r),
    wholefish: (p, x, y, s, r) => K.wholeFish(p, x, y, s * 2.2, r),
    karaage: (p, x, y, s, r, i) => K.karaage(p, x, y, s * .7, r, { seed: i }),
    patty: (p, x, y, s, r) => K.patty(p, x, y, s * 1.1, s * .8, r),
    steak: (p, x, y, s, r, i) => K.teriyakiSlab(p, x, y, s * 1.3, s * .8, r, { seed: i, c: '#6e3a1c' }),
    teriyaki: (p, x, y, s, r, i) => K.teriyakiSlab(p, x, y, s * 1.2, s * .7, r, { seed: i }),
    chickenleg: (p, x, y, s, r, i) => K.chickenPiece(p, x, y, s * 1.2, r, { seed: i, glazeIt: true }),
    roast: (p, x, y, s, r, i) => K.chickenPiece(p, x, y, s * 1.1, r, { seed: i, c: '#d39a52', skin: '#b8732e' }),
    skewer: (p, x, y, s, r, i) => `<g ${T(x, y, r)}><path d="M${-s * .9},0 L${s * .9},0" stroke="#c9a46a" stroke-width="2"/></g>` + [-.45, 0, .45].map(k => K.chickenPiece(p, x + Math.cos(r * Math.PI / 180) * s * k, y + Math.sin(r * Math.PI / 180) * s * k, s * .45, r, { seed: i + k * 10, c: '#b8652a', skin: '#8a4a1c' })).join(''),
    springroll: (p, x, y, s, r) => `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-s * .55}" y="${-s * .18}" width="${s * 1.1}" height="${s * .36}" rx="${s * .18}" fill="${p.g('#d9963c', .3, .25)}"/></g><path d="M${-s * .3},${-s * .1} l${s * .1},${s * .2} M0,${-s * .1} l${s * .1},${s * .2} M${s * .3},${-s * .1} l${s * .1},${s * .2}" stroke="#b8732e" stroke-width="1" opacity=".6"/></g>`,
    omelette: (p, x, y, s, r) => `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="M${-s * .9},${s * .1} Q${-s * .8},${-s * .5} 0,${-s * .5} Q${s * .8},${-s * .5} ${s * .9},${s * .1} Q0,${s * .4} ${-s * .9},${s * .1}Z" fill="${p.rg('#f6cf4a', .3, .2)}"/></g></g>`,
    friedegg: (p, x, y, s, r) => K.friedEgg(p, x, y, s * 1.2, r),
    scrambled: (p, x, y, s, r, i) => K.scrambled(p, x, y, s * 1.2, { seed: i }),
    broccoli: (p, x, y, s, r) => K.broccoli(p, x, y, s * .7, r),
    eggplant: (p, x, y, s, r) => K.eggplant(p, x, y, s * .7, r),
    greenbean: (p, x, y, s, r) => K.greenBean(p, x, y, s * .9, r),
    cucumber: (p, x, y, s, r) => K.cucumberSlice(p, x, y, s * .5, r),
    lettuce: (p, x, y, s, r, i) => K.leafPiece(p, x, y, s * .9, r, { seed: i, c: '#a9d27a' }),
    cabbageshreds: (p, x, y, s, r, i) => K.cabbageShreds(p, x, y, s * 1.1, { seed: i }),
    olive: (p, x, y, s) => `<g ${p.sh(.5)}><ellipse cx="${x}" cy="${y}" rx="${s * .14}" ry="${s * .1}" fill="${p.g('#3a3a2a', .3, .2)}"/></g>`,
    feta: (p, x, y, s, r) => K.tofu(p, x, y, s * .4, s * .4, r, { c: '#fbf8ef' }),
    paneer: (p, x, y, s, r) => K.tofu(p, x, y, s * .45, s * .45, r, { c: '#f4e7c8' }),
    sauceDot: (p, x, y, s, r, i) => K.pool(p, x, y, s * .6, '#d8402a', { seed: i, op: .9 }),
    nuts: (p, x, y, s) => K.sprinkle(p, x, y, s * .8, { c: '#c98a42', n: 8, r: 2 }),
    sesameSeeds: (p, x, y, s) => K.sesame(p, x, y, s * .9),
    grilledVeg: (p, x, y, s, r) => `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${-s * .45}" y="${-s * .2}" width="${s * .9}" height="${s * .4}" rx="${s * .12}" fill="${p.g('#e0a03a', .3, .2)}"/></g><path d="M${-s * .3},${-s * .2} l${s * .1},${s * .4} M0,${-s * .2} l${s * .1},${s * .4} M${s * .3},${-s * .2} l${s * .1},${s * .4}" stroke="#5a3a1a" stroke-width="2" opacity=".7"/></g>`,
};
const ITEMS = Object.assign({}, SOUP_ITEMS, PLATE_KINDS);

function drawPlate(p, sp){
    let [s, R] = vessel(p, sp);
    if (sp.sauce) s += K.pool(p, 100, 102, R * 1.9, sp.sauce, { seed: 2, op: .95, sy: .85 });
    if (sp.bed) s += bed(p, sp.bed, R);
    const list = (sp.items || []).flatMap(([k, n, sc]) => Array.from({ length: Math.max(0, Math.min(14, n || 1)) }, () => [k, sc || 1])).filter(([k]) => ITEMS[k]);
    const size = list.length <= 2 ? 80 : list.length <= 4 ? 64 : list.length <= 8 ? 50 : 40;
    const pos = spots(p.id, list.length, R * .62, size * .5);
    s += `<g ${p.sh(.7)}>`;
    list.forEach(([k, sc], i) => { const q = pos[i] || [100, 100, 0]; s += ITEMS[k](p, q[0], q[1], size * sc, q[2], i + 1); });
    s += `</g>`;
    if (sp.glaze) s += K.glaze(p, 100, 100, R * 1.4, sp.glaze, { seed: 3, op: .4 });
    s += garnish(p, sp.garnish, R);
    return s;
}

const out = {};
if (fs.existsSync(SPECS)){
    for (const file of fs.readdirSync(SPECS).filter(x => /^dishes-.*\.json$/.test(x)).sort()){
        const specs = JSON.parse(fs.readFileSync(path.join(SPECS, file), 'utf8'));
        for (const [id, sp] of Object.entries(specs)) out[id] = p => drawPlate(p, sp);
    }
}
export const PLATE_ITEM_KINDS = Object.keys(ITEMS);
export const PLATE_BEDS = ['rice', 'noodles', 'pasta', 'greens', 'lettuce', 'mash', 'couscous', 'bulgur', 'cabbage', 'flatbread', 'tortilla'];
export default out;
