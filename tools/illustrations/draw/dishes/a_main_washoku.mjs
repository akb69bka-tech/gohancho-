// 主菜（和食の煮物・焼き物・揚げ物）
import * as K from '../kit.mjs';

export default {
    // 肉じゃが: 茶の鉢に、煮汁・しらたき・玉ねぎ・豚肉・じゃがいも・にんじん、絹さやを添える
    nikujaga: p => [
        K.bowl(p, { glaze: '#6e4b33', inside: '#efe5d3' }),
        K.liquid(p, { R: 66, c: '#b9853f', op: .9 }),
        `<g ${p.sh()}>`,
        K.threads(p, 112, 118, 70, { c: '#f1ecdf', n: 14, w: 1.6 }),
        K.onion(p, 78, 120, 26, 20, { c: '#e3c07e' }), K.onion(p, 126, 74, 24, -140, { c: '#e3c07e' }), K.onion(p, 132, 128, 22, 160, { c: '#e3c07e' }),
        K.porkSlice(p, 100, 100, 46, -20, { c: '#a87250', fat: '#e8cfa2', char: false, seed: 1, gloss: .4 }),
        K.porkSlice(p, 72, 86, 40, 50, { c: '#a87250', fat: '#e8cfa2', char: false, seed: 2, gloss: .4 }),
        K.porkSlice(p, 122, 124, 38, 120, { c: '#a87250', fat: '#e8cfa2', char: false, seed: 3, gloss: .4 }),
        K.potato(p, 82, 72, 32, 10, { c: '#e7bd6a', seed: 1 }), K.potato(p, 122, 96, 34, 70, { c: '#e7bd6a', seed: 2 }),
        K.potato(p, 92, 126, 32, -30, { c: '#e7bd6a', seed: 3 }), K.potato(p, 64, 108, 28, 40, { c: '#e7bd6a', seed: 4 }),
        K.potato(p, 108, 66, 26, 120, { c: '#e7bd6a', seed: 5 }),
        K.carrotChunk(p, 104, 100, 20, 30), K.carrotChunk(p, 140, 108, 20, -60), K.carrotChunk(p, 70, 130, 18, 100), K.carrotChunk(p, 96, 78, 16, -10),
        K.snowPea(p, 112, 112, 22, -30), K.snowPea(p, 86, 104, 20, 40),
        `</g>`,
    ].join(''),

    // 鶏の唐揚げ: 白い皿に唐揚げ6個、千切りキャベツ、レモン、ミニトマト
    karaage: p => [
        K.plate(p),
        K.cabbageShreds(p, 128, 70, 62, { seed: 2 }),
        `<g ${p.sh(1.2)}>`,
        K.karaage(p, 70, 80, 44, 10, { seed: 1 }), K.karaage(p, 68, 124, 42, -30, { seed: 3 }), K.karaage(p, 104, 98, 46, 70, { seed: 2 }),
        K.karaage(p, 108, 138, 42, 100, { seed: 6 }), K.karaage(p, 140, 112, 42, 40, { seed: 5 }),
        `</g>`,
        K.lemon(p, 150, 80, 28, -60),
        K.cherryTomato(p, 122, 52, 18),
    ].join(''),

    // 豚の生姜焼き: 焼き目と照りの豚ロース、玉ねぎ、千切りキャベツとミニトマト
    shogayaki: p => [
        K.plate(p),
        K.cabbageShreds(p, 136, 70, 58, { seed: 3 }),
        K.cherryTomato(p, 152, 104, 17),
        K.pool(p, 88, 114, 100, '#8f531f', { op: .8, seed: 1 }),
        `<g ${p.sh(1.2)}>`,
        K.porkSlice(p, 88, 142, 74, -14, { c: '#c0803a', seed: 1 }),
        K.porkSlice(p, 92, 120, 80, -4, { c: '#b9783a', seed: 2 }),
        K.porkSlice(p, 84, 98, 78, 8, { c: '#c4843e', seed: 3 }),
        K.porkSlice(p, 80, 74, 70, 16, { c: '#bd7c38', seed: 4 }),
        K.onion(p, 120, 132, 24, 20, { c: '#d9a75a' }), K.onion(p, 56, 112, 22, -40, { c: '#d9a75a' }), K.onion(p, 112, 90, 18, 160, { c: '#d9a75a' }),
        `</g>`,
        K.gingerShreds(p, 92, 104, 20),
    ].join(''),
};
