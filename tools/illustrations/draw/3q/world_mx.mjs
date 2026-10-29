// メキシコ（mx_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 素焼き（barro）。汁物・ポソレ・豆は素焼きの鉢、煮込み（ティンガ・モレ・ピカディージョ）は素焼きの浅い土鍋（cazuela）、
// 焼き物・揚げ物・タコス・エンチラーダは素焼き色の縁（#b8582e）の白い平皿、サルサは素焼きの小鉢（molcajete は石の灰茶）。
// タラベラ焼きの青い絵付けは描かない。材料は gohancho/packs/mx.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, T: TR, SY } = W;

const BARRO = '#b8582e';
const plato = (p, o = {}) => Q.plate(p, { line: 'none', edge: BARRO, ...o });
const olla = (p, o = {}) => W.bowl(p, { outer: '#a8582e', inner: '#c8784a', edge: '#d89a60', h: 48, gloss: .45, ...o });
const cazuela = (p, o = {}) => Q.fukazara(p, { base: '#c8784a', line: '#8a3a1a', ...o });
const salsera = (p, o = {}) => W.sideBowl(p, { outer: '#b8683a', inner: '#d08a58', edge: '#8a3a1a', ...o });
const molcajete = (p, o = {}) => W.sideBowl(p, { outer: '#6a5e54', inner: '#7a6e62', edge: '#4a4038', h: 32, ...o });
const CIL = ['#3f8a2a', '#5aa83a'], QUESO = '#fbf8ee', CREMA = '#fbf6e8';
const lime = (p, x, y, s = 14) => W.lemon(p, x, y, s, { wedge: true, c: '#8ab83a' });
const crema = (pts) => W.drizzle(pts, CREMA, 2.6);
const queso = n => [QUESO, n, 2.2];
const tortilla = (p, x, y, r, { c = '#f0d898', spots = '#c8964a', seed = 1, fold = false, rot = 0 } = {}) => fold
    ? `<g ${TR(x, y, rot)}><path d="M${f(-r)},0 A${f(r)},${f(r * .55)} 0 0 1 ${f(r)},0Z" fill="${Q.lg(p, [[0, '#f8e8b8'], [1, c]], 0, 0, 0, 1)}" stroke="#b8904a" stroke-width=".7"/></g>` + W.flecks(p, x, y - r * .25, r * .6, 8, 'tf' + seed, [spots], { ry: r * .15, s: 1.6 })
    : W.jeon(p, x, y, r, seed, { c, h: 1.6 }) + W.flecks(p, x, y, r * .7, 10, 'ts' + seed, [spots], { ry: r * .7 * SYF, s: 1.8 });
const ing = {
    shredChicken: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .5, -1.6], [s * .5, -1.4], [s * .45, 1.6], [-s * .5, 1.4]], 2.2, '#c8603a', { rot: r, line: .35, top: Q.lg(p, [[0, '#e8906a'], [1, '#b8502a']], 0, 0, 0, 1) }),
    shredBeef: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .5, -1.4], [s * .5, -1.2], [s * .45, 1.4], [-s * .5, 1.2]], 2, '#8a5a3a', { rot: r, line: .35 }),
    porkGreen: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#d8b080', soak: '#6a8a2a', k: .5, sy: .72 }),
    porkRed: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#d8a070', soak: '#a8301a', k: .5, sy: .72 }),
    chickenMole: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#6a2a1a', soak: '#3a140a', k: .7, sy: .72, hi: .8 }),
    chickenChipotle: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#f0c8a0', soak: '#d8703a', k: .4, sy: .72 }),
    cochinita: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .5, -1.8], [s * .5, -1.6], [s * .45, 1.8], [-s * .5, 1.6]], 2.4, '#c8501e', { rot: r, line: .35, top: Q.lg(p, [[0, '#f08a4a'], [1, '#b8401a']], 0, 0, 0, 1) }),
    hominy: (p, x, y, s, r, i, liq) => Q.lump(p, x, y, s * .4, s * .32, '#f6f0e0', p.id + 'hm' + i, { n: 9, jit: .25, hi: .7, edge: '#c8b898' }),
    radishSlice: (p, x, y, s) => W.coin(p, x, y, s * .4, '#c8283a', { h: 1.2, top: Q.rg(p, [[0, '#ffffff'], [.8, '#f6eeee'], [.9, '#e86a7a'], [1, '#c8283a']], .4, .35, .8) }),
    avocadoSlice: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .7, 0], [-s * .3, -s * .28], [s * .5, -s * .22], [s * .7, 0], [s * .3, s * .22], [-s * .4, s * .2]], 3, '#5a8a2a', { rot: r, line: .45, top: Q.lg(p, [[0, '#f0f4b0'], [.6, '#c8dc78'], [1, '#6a9a2a']], 0, 0, 0, 1) }),
    nopal: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .7, '#3f6a24', p.id + 'np' + i, { h: s * .3, liq, top: Q.rg(p, [[0, '#a8c870'], [.6, '#6a9a3a'], [1, '#3f6a24']], .4, .35, .8) }),
    poblano: (p, x, y, s, r) => W.pepperStrip(p, x, y, s * 1.2, r, '#2e5a1e'),
    jalapeno: (p, x, y, s) => W.chiliRing(x, y, s * .28, '#3f7a2a'),
    tomatillo: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#6a9a3a', p.id + 'tl' + i, { h: s * .4, top: Q.rg(p, [[0, '#e8f0b0'], [1, '#a8c860']], .4, .35, .8) }),
    tostadaStrip: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .6, -1.6], [s * .6, -1.6], [s * .6, 1.6], [-s * .6, 1.6]], 1.8, '#d8a040', { rot: r, line: .4, top: Q.lg(p, [[0, '#f6d890'], [1, '#d8a040']], 0, 0, 0, 1) }),
    chip: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .5, s * .3], [0, -s * .4], [s * .5, s * .3]], 1.8, '#d8a040', { rot: r, line: .45, top: Q.lg(p, [[0, '#f6d890'], [1, '#c89030']], 0, 0, 1, 1) }),
    squashFlower: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.2, r, '#f0a020', 'sf' + p.id + i, { wave: 2.4 }),
    tripe: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#e8d8c0', p.id + 'tr' + i, { h: s * .3, top: Q.rg(p, [[0, '#fbf2e4'], [1, '#e8d8c0']], .4, .35, .8) }) + W.flecks(p, x, y - s * .2, s * .3, 6, 'trf' + i, ['#c8b090'], { ry: s * .2, s: .8 }),
    fava: (p, x, y, s, r) => Q.bean(p, x, y, s * .7, r, '#e8c060'),
    capers: (p, x, y, s) => Q.pea(p, x, y, s * .22, '#7a8a3a'),
    chorizo: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .35, s * .26, '#a8301a', p.id + 'cz' + i, { n: 8, jit: .3, hi: .6, edge: '#6a1a0a' }),
    meatballChipotle: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#8a3a1e', p.id + 'mc' + i, { hi: .7 }),
    blistered: (p, x, y, s, r) => W.pod(p, x, y, s * 1.8, r, { c: '#4a7a2a', w: 6 }) + W.flecks(p, x, y - 2, s * .6, 4, 'bl' + x, ['#2e3a14'], { ry: 2, s: 1.6 }),
    jicama: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .6, -2], [s * .6, -2], [s * .6, 2], [-s * .6, 2]], 3, '#f6f2e6', { rot: r, line: .4, top: Q.lg(p, [[0, '#ffffff'], [1, '#ece6d4']], 0, 0, 0, 1) }),
    cucStick: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .6, -2], [s * .6, -2], [s * .6, 2], [-s * .6, 2]], 3, '#3f7a2a', { rot: r, line: .4, top: Q.lg(p, [[0, '#f0f6d8'], [1, '#c8dca0']], 0, 0, 0, 1) }),
    plantainLong: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -s * .22], [s * .8, -s * .26], [s * .8, s * .2], [-s * .8, s * .24]], 4, '#a8541e', { rot: r, line: .5, top: Q.lg(p, [[0, '#ffd890'], [.5, '#e8902e'], [1, '#a8541e']], 0, 0, 0, 1) }),
    shrimpRed: (p, x, y, s, r, i) => Q.prawn3q(p, x, y, s * 1.2, r, i % 2 ? 1 : -1, { c: '#d8401e' }),
    egg: (p, x, y, s, r, i) => W.friedEgg(p, x, y, s * 2.2, i),
    eggPoached: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#fbf8f0', p.id + 'ep' + i, { hi: .6 }) + `<ellipse cx="${f(x - 1)}" cy="${f(y - s * .45)}" rx="${f(s * .2)}" ry="${f(s * .13)}" fill="#f6c22a"/>`,
    tunaFlake: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .4, s * .28, '#d8b898', p.id + 'tn' + i, { n: 9, jit: .3, hi: .4 }),
    bacon: (p, x, y, s, r, i) => W.baconBit(p, x, y, s * .6, i),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(plato, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(olla, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}) => M(cazuela, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}, v = salsera) => M(v, 'bowl', null, items, { minD: 7, ...o });
const salsa = (c, items, o = {}, v = salsera) => K(items, { base: c, H: 12, ...o }, v);
const withLime = (o = {}) => ({ ...o, after: (S, V, p) => lime(p, S.cx + 46, S.cy + 4, 14) });
// トルティーヤの料理（皿に並べる）
const tortillaDish = (draw) => p => { const D = plato(p); return D.s + draw(p, D.o); };

export default {
    // ---------- 主菜 ----------
    // ティンガ（鶏のチポトレトマト煮）、トスターダ・クレマ（お好みで）
    mx_tinga: tortillaDish((p, o) => byDepth([[-30, -8], [26, -14], [0, 22]].map(([u, v], i) => { const [x, y] = at(o, u, v, 2); return [y, () => W.jeon(p, x, y, 32, i, { c: '#e8b050', h: 2.4 }) + byDepth(W.spots('tg' + i, 14, 22, 5).map(([a, b, r], k) => [y + b * .5, () => ing.shredChicken(p, x + a, y + b * .5 - 3, 12, r, k)])) + crema([[x - 16, y - 4], [x - 4, y - 8], [x + 8, y - 4], [x + 16, y - 6]]) + W.flecks(p, x, y - 4, 16, 6, 'tgq' + i, [QUESO, '#efdcae'], { ry: 6, s: 1.8 })]; }))),
    // ピカディージョ（牛ひき肉と野菜の煮込み）: ひき肉・じゃがいも・にんじん・トマト・玉ねぎ、グリンピース（お好みで）
    mx_picadillo: K([['mince', 14, 16], ['potato', 6, 10], ['carrot', 6, 10], ['pea', 8, 13]], { base: '#a8501e', minD: 8 }, cazuela),
    // ビステック・ア・ラ・メヒカーナ: 牛肉・トマト・玉ねぎ・セラーノ
    mx_bistec: P([['beefSlice', 10, 16], ['tomato', 8, 12], ['onion', 5, 12], ['jalapeno', 5, 12]], { sauce: '#a8401e' }),
    // 豚肉のサルサ・ベルデ煮: 豚・トマティーヨ・セラーノ・玉ねぎ・香菜、じゃがいも（お好みで）
    mx_puerco_verde: B('#6a8a2a', [['porkGreen', 10, 18], ['potato', 3, 13]], { flecks: [[CIL[0], 16, 1.6]] }),
    // ベラクルス風の魚: 白身魚・トマト・玉ねぎ・グリーンオリーブ・ハラペーニョ、ケッパー（お好みで）
    mx_veracruzana: p => { const D = plato(p), o = D.o; return D.s + W.pool(p, o.cx, o.cy + 4, 54, '#d8402a', 'vc') + byDepth([[-16, -6], [18, 6]].map(([u, v], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.cutSlab(p, x, y, 32, 16, 8, '#f6f0e4', 'vf' + i, { rot: -10, sear: '#e8c890', edgeC: '#e0d8c8' })]; })) + byDepth(W.spots('vcv', 16, 46, 9).map(([u, v, r], i) => { const [x, y] = at(o, u, v, 12); return [y, () => [W.ING.greenOlive, W.ING.tomato, W.ING.onion, ing.jalapeno, ing.capers][i % 5](p, x, y, 12, r, i)]; })); },
    // ウエボス・ア・ラ・メヒカーナ（いり卵）: 卵・トマト・玉ねぎ・セラーノ、豆のペースト（お好みで）
    mx_huevos: P([['scramble', 22, 20], ['tomato', 5, 11], ['onion', 4, 12], ['jalapeno', 4, 12]], { after: (o, D, p) => W.mound(p, ...at(o, 44, 30), 18, 6, '#6a3a24', 'hf', SYF) }),
    // エンフリホラーダ（豆のソースのトルティーヤ）: トルティーヤ・豆・ケソフレスコ・クレマ・玉ねぎ
    mx_enfrijoladas: tortillaDish((p, o) => byDepth([-28, 0, 28].map((v, i) => { const [x, y] = at(o, -4, v, 6); return [y, () => `<g ${TR(x, y, -10)}><rect x="-62" y="-12" width="124" height="24" rx="12" fill="${Q.lg(p, [[0, '#7a4a34'], [.5, '#4a2a1e'], [1, '#3a1e14']], 0, 0, 0, 1)}" stroke="#2e1a10" stroke-width=".6"/></g>`]; })) + crema([[60, 92], [80, 86], [100, 92], [120, 86], [140, 92]]) + W.flecks(p, 100, 92, 44, 30, 'efq', [QUESO], { ry: 16, s: 2.4 }) + W.flecks(p, 100, 90, 40, 8, 'efo', ['#e8b8d8'], { ry: 14, s: 2 })),
    // エンチラーダ・ベルデ: 鶏を巻いたトルティーヤに緑のサルサ・クレマ・ケソフレスコ・玉ねぎ・香菜
    mx_enchiladas_verdes: tortillaDish((p, o) => byDepth([-28, 0, 28].map((v, i) => { const [x, y] = at(o, -4, v, 6); return [y, () => `<g ${TR(x, y, -10)}><rect x="-62" y="-12" width="124" height="24" rx="12" fill="${Q.lg(p, [[0, '#a8c860'], [.5, '#6a9a3a'], [1, '#4a7a2a']], 0, 0, 0, 1)}" stroke="#3a5a1e" stroke-width=".6"/></g>`]; })) + crema([[60, 92], [80, 86], [100, 92], [120, 86], [140, 92]]) + W.flecks(p, 100, 92, 44, 30, 'evq', [QUESO], { ry: 16, s: 2.4 }) + W.flecks(p, 100, 90, 40, 14, 'evo', ['#f2e8c8', CIL[0]], { ry: 14, s: 1.8 })),
    // チラキレス（赤）: トルティーヤチップ・赤いソース・クレマ・ケソフレスコ・玉ねぎ、目玉焼き（お好みで）
    mx_chilaquiles: P([['chipRed', 30, 18]], { minD: 7, after: (o, D, p) => crema([[o.cx - 40, o.cy - 14], [o.cx - 20, o.cy - 20], [o.cx, o.cy - 14], [o.cx + 20, o.cy - 22], [o.cx + 40, o.cy - 16]]) + W.flecks(p, o.cx, o.cy - 18, 40, 30, 'chq', [QUESO], { ry: 14, s: 2.4 }) + W.ING.onion(p, o.cx + 10, o.cy - 22, 14, 10) + W.friedEgg(p, o.cx - 18, o.cy - 26, 34, 1), ing: { ...ing, chipRed: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .5, s * .3], [0, -s * .4], [s * .5, s * .3]], 1.8, '#a8301a', { rot: r, line: .45, top: Q.lg(p, [[0, '#e8602a'], [1, '#a8301a']], 0, 0, 1, 1) }) } }),
    // ミラネサ（牛肉のカツ）: ライム、レタス（お好みで）
    mx_milanesa: p => { const D = plato(p), o = D.o, [x, y] = at(o, -10, -2, 4); return D.s + `<path d="${Q.blob(x, y, 56, 30, 'ml', { n: 14, jit: .1 })}" fill="${Q.rg(p, [[0, '#f0c070'], [.6, '#d8963a'], [1, '#a8641e']], .4, .35, .8)}" stroke="#8a5a1e" stroke-width=".8"/>` + W.flecks(p, x, y, 48, 60, 'mlf', ['#f6d890', '#b8782a', '#e8b058'], { ry: 24, s: 1.4 }) + lime(p, ...at(o, 50, 30), 16) + W.ING.lettuce(p, ...at(o, -50, 32), 14, 10, 1); },
    // ポジョ・エン・モレ（鶏のモレ）: 鶏・モレ・玉ねぎ
    mx_pollo_mole: B('#4a1a10', [['chickenMole', 8, 20]], { flecks: [['#f6ecd0', 30, 1.4]] }),
    // コチニータ・ピビル（アチョーテの豚）: 赤玉ねぎの酢漬け・ライム（バナナの葉）
    mx_cochinita: p => { const D = plato(p), o = D.o; return D.s + `<path d="${Q.blob(o.cx, o.cy, 66, 66 * SYF * .9, 'cl', { n: 10, jit: .08 })}" fill="${Q.lg(p, [[0, '#7ab048'], [1, '#3f7a2a']])}" stroke="#2e5a1e" stroke-width=".8"/>` + byDepth(W.onHill(o, 'cc', 40, 44, 5, 16, (x, y, r, i) => ing.cochinita(p, x, y, 14, r, i))) + byDepth(W.spots('cco', 8, 30, 8).map(([u, v, r]) => { const [x, y] = at(o, u, v, 18); return [y, () => W.onionStrip(x, y, 12, r, '#d880b0')]; })) + lime(p, ...at(o, 52, 30), 14); },
    // カルネ・アサーダ（焼いた牛肉）: ライム・トルティーヤ、ねぎ・アボカド（お好みで）
    mx_carne_asada: p => { const D = plato(p), o = D.o; return D.s + tortilla(p, ...at(o, 40, -20), 26, { seed: 1 }) + W.cutSlab(p, ...at(o, -14, 0, 4), 50, 26, 6, '#8a4a24', 'ca', { rot: -12, sear: '#5a2a10', grill: 5 }) + byDepth([[30, 26], [44, 18]].map(([u, v], i) => { const [x, y] = at(o, u, v, 4); return [y, () => ing.avocadoSlice(p, x, y, 18, -20)]; })) + lime(p, ...at(o, -46, 34), 15); },
    // チレ・レジェーノ（チーズ詰めのポブラノの衣揚げ）とトマトソース
    mx_chiles_rellenos: p => { const D = plato(p), o = D.o; return D.s + W.pool(p, o.cx, o.cy + 4, 56, '#d8502a', 'cr') + byDepth([[-6, -8], [6, 14]].map(([u, v], i) => { const [x, y] = at(o, u, v, 4); return [y, () => `<g ${TR(x, y, -12)}><path d="${Q.blob(0, 0, 44, 16, 'crb' + i, { n: 14, jit: .12 })}" fill="${Q.rg(p, [[0, '#fbe8b0'], [.6, '#f0c870'], [1, '#c8903a']], .4, .35, .8)}" stroke="#a8743a" stroke-width=".7"/><path d="M40,-2 q8,-6 10,-12" stroke="#4a6a22" stroke-width="3" fill="none" stroke-linecap="round"/></g>`]; })); },
    // 牛肉団子のチポトレソース: 団子（米入り）・トマト・チポトレ・玉ねぎ
    mx_albondigas_chipotle: B('#a8341a', [['meatballChipotle', 9, 20]], { flecks: [['#f6ecd0', 10, 1.2]] }),
    // カマロネス・ア・ラ・ディアブラ（えびの辛いソース）
    mx_camarones_diabla: B('#b8281a', [['shrimpRed', 10, 17]], { flecks: [['#6a1a10', 10, 1.2]] }),
    // 魚のにんにくバター焼き: 白身魚・にんにく・ライム、グアヒージョの輪（お好みで）
    mx_pescado_ajo: p => { const D = plato(p), o = D.o; return D.s + W.pool(p, o.cx, o.cy + 4, 46, '#f0c860', 'pa') + byDepth([[-14, -4], [18, 8]].map(([u, v], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.cutSlab(p, x, y, 34, 16, 8, '#f6f0e4', 'pf' + i, { rot: -10, sear: '#d8a040', edgeC: '#e8dcc8' })]; })) + W.flecks(p, o.cx, o.cy - 6, 40, 30, 'paf', ['#e8b048', '#f6e0a0', '#a8301a'], { ry: 14, s: 2 }) + lime(p, ...at(o, 50, 32), 15); },
    // ウエボス・ランチェロス: トルティーヤに目玉焼きと赤いサルサ、豆（お好みで）
    mx_huevos_rancheros: tortillaDish((p, o) => byDepth([[-24, -4], [24, 4]].map(([u, v], i) => { const [x, y] = at(o, u, v, 2); return [y, () => tortilla(p, x, y, 36, { seed: i }) + W.pool(p, x, y - 3, 28, '#c8301a', 'hr' + i, SYF) + W.friedEgg(p, x, y - 4, 40, i) + W.flecks(p, x, y - 4, 24, 6, 'hrc' + i, ['#3f8a2a', '#f2e8c8'], { ry: 8, s: 1.6 })]; })) + W.mound(p, ...at(o, 0, 40), 18, 5, '#5a3020', 'hrb', SYF)),
    // タコス・デ・パパ（じゃがいもの揚げタコス）: レタス・クレマ・ケソフレスコ
    mx_tacos_papa: tortillaDish((p, o) => byDepth([-28, -4, 20].map((v, i) => { const [x, y] = at(o, -6, v, 6); return [y, () => `<g ${TR(x, y, -10)}><rect x="-58" y="-10" width="116" height="20" rx="10" fill="${Q.lg(p, [[0, '#f6d890'], [.5, '#d8a040'], [1, '#a8702a']], 0, 0, 0, 1)}" stroke="#8a5a1e" stroke-width=".6"/></g>`]; })) + W.flecks(p, 96, 92, 44, 30, 'tpl', ['#8ac850', '#6ab040'], { ry: 16, s: 2.4 }) + crema([[56, 94], [76, 88], [96, 94], [116, 88], [136, 94]]) + W.flecks(p, 96, 92, 40, 20, 'tpq', [QUESO], { ry: 14, s: 2.2 })),
    // 豚とカボチータの煮込み: 豚・ズッキーニ・コーン・トマト・玉ねぎ
    mx_puerco_calabacitas: B('#c8803a', [['porkRed', 6, 17], ['zucchini', 5, 14], ['corn', 8, 13]], { ing: { ...ing, porkRed: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e0b080', soak: '#a8602a', k: .45, sy: .72 }) } }),
    // 鶏のチポトレクリーム: 鶏・チポトレ・クレマ・玉ねぎ、マッシュルーム（お好みで）
    mx_pollo_chipotle: B('#e8a070', [['chickenChipotle', 8, 20], ['mushroom', 3, 12]]),
    // チョリソとじゃがいも: チョリソ・じゃがいも・玉ねぎ、トルティーヤ（お好みで）
    mx_chorizo_papas: P([['potRed', 18, 15], ['chorizo', 20, 16], ['onion', 4, 12]], { ing: { ...ing, potRed: (p, x, y, s, r, i) => W.dice(p, x, y, s, '#c8501e', p.id + 'pr' + i, { h: s * .55, top: Q.rg(p, [[0, '#f8c890'], [.6, '#e0803a'], [1, '#a8401a']], .4, .35, .8) }) } }),
    // サルピコン（裂いた牛肉のサラダ）: 牛肉・トマト・玉ねぎ・レタス・アボカド・ラディッシュ
    mx_salpicon: P([['shredBeef', 20, 16], ['tomato', 6, 11], ['onion', 4, 11], ['lettuce', 4, 12], ['avocadoSlice', 3, 14], ['radishSlice', 4, 13]]),
    // モジェテ（豆とチーズのパン）、ピコ・デ・ガジョ（お好みで）
    mx_molletes: p => { const D = plato(p), o = D.o; return D.s + byDepth([[-28, -10], [26, -6], [-2, 20]].map(([u, v], i) => { const [x, y] = at(o, u, v, 4); return [y, () => `<g ${TR(x, y, -8)}><path d="${Q.blob(0, 0, 30, 14, 'mb' + i, { n: 12, jit: .05 })}" fill="${Q.lg(p, [[0, '#e8b060'], [1, '#a8682a']], 0, 0, 0, 1)}" transform="translate(0 4)"/><path d="${Q.blob(0, 0, 28, 12, 'mt' + i, { n: 12, jit: .05 })}" fill="#6a3a24"/><path d="${Q.blob(0, -1, 24, 9, 'mc' + i, { n: 12, jit: .2 })}" fill="${Q.rg(p, [[0, '#fff2c0'], [1, '#f2c860']], .4, .35, .8)}"/></g>` + W.flecks(p, x, y - 4, 14, 6, 'mp' + i, ['#d8301e', '#f2e8c8', CIL[0]], { ry: 4, s: 1.6 })]; })); },
    // メキシコ風のツナ: ツナ・トマト・玉ねぎ・セラーノ、トスターダ（お好みで）
    mx_atun_mexicana: P([['tunaFlake', 24, 16], ['tomato', 6, 11], ['onion', 4, 11], ['jalapeno', 4, 12]], { after: (o, D, p) => tortilla(p, ...at(o, -48, 30), 18, { c: '#e8b050', seed: 3 }) }),
    // ケサディーヤ（チーズ）、マッシュルーム（お好みで）
    mx_quesadillas: tortillaDish((p, o) => byDepth([[-24, -6, -8], [26, 4, 10]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => tortilla(p, x, y, 40, { fold: true, rot: r, seed: i }) + `<path d="M${f(x - 30)},${f(y + 1)} q10,6 20,0 q10,6 20,0" stroke="#f6dc80" stroke-width="3" fill="none"/>`]; })) + salsaCup(p, o)),

    // ---------- ご飯・麺 ----------
    // アロス・コン・ポジョ（鶏とトマトご飯）: 鶏・米・トマト・にんじん・グリンピース
    mx_arroz_pollo: M(cazuela, 'plate', null, [['chickenTomato', 6, 18], ['carrot', 6, 10], ['pea', 8, 12]], { rice: { cols: ['#f0a070', '#e8905a', '#f6b888'], edge: '#b8602a' }, H: 22, R: 48, minD: 10, ing: { ...ing, chickenTomato: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e8a070', soak: '#c8401e', k: .5, sy: .72 }) } }),
    // エスパゲティ・ベルデ（ポブラノのクリーム）
    mx_espagueti_verde: p => { const D = plato(p), o = D.o; return D.s + W.noodleMound(p, 100, 104, 52, 20, '#c8d890', 'ev', { w: 2.4, n: 150, len: 34, sy: SYF, edge: '#8aa858' }) + W.flecks(p, 100, 92, 34, 20, 'evc', ['#f6ecc8', CIL[0]], { ry: 12, s: 2 }); },

    // ---------- 副菜 ----------
    // メキシコの赤いご飯: 米・トマト・玉ねぎ、にんじん・グリンピース（お好みで）
    mx_arroz: P([['carrot', 8, 9], ['pea', 10, 12]], { rice: { cols: ['#f0a070', '#e8905a', '#f6b888'], edge: '#b8602a' }, H: 24, R: 50 }),
    // フリホーレス・レフリトス（豆のペースト）、ケソフレスコ（お好みで）
    mx_frijoles: K([], { base: '#5a3020', H: 16, flecks: [queso(20), ['#f2e8c8', 6, 1.4]] }),
    // ノパレスのサラダ: ノパル・トマト・玉ねぎ・香菜・ライム、セラーノ・ケソフレスコ（お好みで）
    mx_nopales: K([['nopal', 14, 14], ['tomato', 8, 12], ['onion', 3, 11], ['herb', 4, 11]], withLime({ flecks: [queso(14)] })),
    // カラバシータス（ズッキーニとコーン）: ズッキーニ・コーン・トマト・玉ねぎ
    mx_calabacitas: P([['zucchini', 14, 14], ['corn', 16, 13], ['tomato', 4, 10]], { flecks: [queso(10)] }),
    // ワカモレ: アボカド・トマト・玉ねぎ・香菜・セラーノ・ライム（石のモルカヘテ）
    mx_guacamole: salsa('#8ab040', [['tomato', 5, 10], ['onion', 3, 10], ['herb', 3, 10]], withLime({ H: 18, flecks: [['#c8dc78', 20, 2]] }), molcajete),
    // ピコ・デ・ガジョ: トマト・白玉ねぎ・香菜・セラーノ・ライム
    mx_pico: K([['tomato', 16, 12], ['onion', 5, 11], ['herb', 5, 10], ['jalapeno', 4, 11]], withLime()),
    // ラハス（ポブラノのクリーム煮）、コーン（お好みで）
    mx_rajas: B('#f2ecd0', [['poblano', 12, 16], ['onion', 3, 13], ['corn', 6, 12]]),
    // サルサ・ベルデ: トマティーヨ・セラーノ・玉ねぎ・香菜
    mx_salsa_verde: salsa('#7a9a3a', [], { flecks: [['#c8d890', 16, 1.4], [CIL[0], 10, 1.4]] }),
    // サルサ・ロハ（焼きトマトのサルサ）
    mx_salsa_roja: salsa('#b8301a', [], { flecks: [['#5a1a0a', 14, 1.4], ['#f2c8a0', 10, 1.2]] }, molcajete),
    // サルサ・デ・アグアカテ（アボカドとトマティーヨ）
    mx_salsa_aguacate: salsa('#a8c060', [], { flecks: [[CIL[0], 14, 1.4]] }),
    // サルサ・マチャ（唐辛子の油）: 唐辛子・ピーナッツ・にんにく
    mx_salsa_macha: salsa('#8a2410', [['peanut', 6, 12]], { flecks: [['#c8401e', 30, 1.4], ['#f2c060', 10, 1.4]] }),
    // 赤玉ねぎのライム漬け、ハバネロ（お好みで）
    mx_cebolla_morada: K([['redOnion', 24, 15]], { base: '#e8a8c8', H: 10, flecks: [['#f0901e', 6, 1.4]] }),
    // ハラペーニョとにんじんの酢漬け: ハラペーニョ・にんじん・玉ねぎ・にんにく
    mx_chiles_escabeche: K([['jalapeno', 14, 14], ['carrot', 10, 13], ['onion', 3, 12], ['garlic', 3, 12]], { base: '#d8c890' }),
    // チレス・トレアドス（焼き唐辛子）、ねぎ（お好みで）・ライム
    mx_chiles_toreados: P([['blistered', 8, 16]], { minD: 14, after: (o, D, p) => lime(p, ...at(o, 48, 30), 15) }),
    // エスキーテ（コーンのカップ）: コーン・マヨネーズ・コティハ・ライム
    mx_esquites: K([['corn', 40, 14]], { minD: 5, base: '#f2d070', flecks: [queso(26), ['#c8401e', 10, 1]], after: (o, V, p) => crema([[o.cx - 20, o.cy - 26], [o.cx, o.cy - 32], [o.cx + 20, o.cy - 26]]) }),
    // フリホーレス・チャロス（ベーコンの豆煮）: 豆・ベーコン・トマト・玉ねぎ・セラーノ・香菜
    mx_frijoles_charros: S('#7a4a2a', [['brownBean', 26, 13], ['bacon', 5, 12], ['tomato', 3, 10], ['jalapeno', 3, 11]], { minD: 7, flecks: [[CIL[0], 14, 1.6]] }),
    // アロス・ベルデ（緑のご飯）: 米・ポブラノ・香菜・玉ねぎ、コーン（お好みで）
    mx_arroz_verde: P([['corn', 12, 12]], { rice: { cols: ['#c8dc98', '#b0c880', '#dce8b0'], edge: '#7a9a4a' }, H: 24, R: 50 }),
    // パパス・ア・ラ・メヒカーナ: じゃがいも・トマト・玉ねぎ・セラーノ
    mx_papas_mexicana: P([['potato', 18, 15], ['tomato', 6, 11], ['onion', 4, 12], ['jalapeno', 4, 12]]),
    // キャベツのサラダ: キャベツ・にんじん・ライム、トマト・香菜（お好みで）
    mx_ensalada_col: K([['shred', 40, 14], ['carrotStick', 8, 10], ['tomato', 3, 10]], withLime({ minD: 5, ing: { ...ing, shred: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#e8f0c8' : '#d0e0a8', { rot: r, line: .3 }) } })),
    // ビーツとにんじんのサラダ: ビーツ・にんじん・ライム、ピーナッツ（お好みで）
    mx_ensalada_betabel: K([['beet', 12, 13], ['carrotStick', 14, 12], ['peanut', 5, 12]], withLime()),
    // メキシコのポテトサラダ: じゃがいも・にんじん・グリンピース・マヨネーズ、ゆで卵（お好みで）
    mx_ensalada_rusa: K([['potato', 14, 13], ['carrot', 8, 10], ['pea', 10, 12], ['egg', 1, 14]], { base: '#f6ecd0', ing: { ...ing, egg: (p, x, y, s, r) => W.eggHalf(p, x, y, s * 1.4, 0) } }),
    // ヒカマときゅうりのチリがけ: ヒカマ・きゅうり・ライム
    mx_jicama: P([['jicama', 14, 18], ['cucStick', 10, 18]], { minD: 10, flecks: [['#c8401e', 30, 1.2]], after: (o, D, p) => lime(p, ...at(o, 48, 30), 15) }),
    // ハヤトウリのクリーム煮: ハヤトウリ・コーン・クレマ・玉ねぎ
    mx_chayotes: B('#f4ecd4', [['chayote', 10, 16], ['corn', 8, 12], ['poblano', 3, 12]]),
    // いんげんのトマト炒め: いんげん・トマト・玉ねぎ
    mx_ejotes: P([['greenBean', 18, 9], ['tomato', 6, 11], ['onion', 3, 12]], { sauce: '#c8401e' }),
    // 揚げバナナ、クレマ・ケソフレスコ（お好みで）
    mx_platanos_fritos: P([['plantainLong', 7, 20]], { minD: 16, H: 10, after: (o, D, p) => crema([[o.cx - 30, o.cy - 10], [o.cx - 10, o.cy - 16], [o.cx + 10, o.cy - 10], [o.cx + 30, o.cy - 16]]) + W.flecks(p, o.cx, o.cy - 12, 30, 14, 'pq', [QUESO], { ry: 10, s: 2 }) }),
    // ノパレスの網焼き: ノパル、ねぎ・パネラ（お好みで）・ライム
    mx_nopales_asados: p => { const D = plato(p), o = D.o; return D.s + byDepth([[-20, -8, -20], [22, 4, 14]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => `<g ${TR(x, y, r)}><path d="${Q.blob(0, 0, 36, 22, 'na' + i, { n: 12, jit: .08 })}" fill="${Q.rg(p, [[0, '#a8c860'], [.6, '#6a9a34'], [1, '#3f6a22']], .4, .35, .8)}" stroke="#2e4a14" stroke-width=".8"/>${[-20, -8, 4, 16].map(d => `<path d="M${d},-14 l6,28" stroke="#3a2a14" stroke-width="2.4" opacity=".6"/>`).join('')}</g>`]; })) + W.cutSlab(p, ...at(o, -10, 34, 4), 18, 10, 6, '#fbf8ee', 'nq', { rot: 10, sear: '#f0d8a0' }) + lime(p, ...at(o, 50, 30), 15); },
    // マッシュルームのにんにくとグアヒージョ炒め
    mx_champinones: P([['mushroom', 20, 15], ['garlic', 4, 12], ['chiliR', 5, 13]], { sauce: '#a8501e' }),
    // フリホーレス・デ・ラ・オジャ（鍋の豆）
    mx_frijoles_olla: S('#5a3020', [['brownBean', 30, 14]], { minD: 6, flecks: [['#4a8a2a', 4, 3]] }),

    // ---------- 汁物 ----------
    // ソパ・デ・フィデオ（トマトの細麺スープ）、ライム・クレマ（お好みで）
    mx_fideo: S('#d8502a', [['noodleBit', 16, 12]], withLime({ minD: 8 })),
    // カルド・デ・ポジョ（鶏と野菜のスープ）: 鶏・にんじん・じゃがいも・ズッキーニ・香菜・ライム
    mx_caldo: S('#e8d098', [['chicken', 4, 15], ['carrot', 5, 13], ['potato', 3, 13], ['zucchini', 3, 13]], withLime({ flecks: [[CIL[0], 14, 1.6]] })),
    // ポソレ・ロホ: 豚・ホミニー・グアヒージョ、キャベツ・ラディッシュ・ライム
    mx_pozole_rojo: S('#b8301a', [['hominy', 16, 14], ['porkRed', 4, 15], ['radishSlice', 4, 13], ['shredG', 6, 12]], withLime({ minD: 8, ing: { ...ing, shredG: (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, '#c8e098', { rot: r, line: .3 }) } })),
    // ポソレ・ベルデ: 鶏・ホミニー・トマティーヨ・かぼちゃの種・セラーノ・香菜、ラディッシュ・ライム
    mx_pozole_verde: S('#6a8a2a', [['hominy', 16, 14], ['chicken', 4, 14], ['radishSlice', 4, 13]], withLime({ minD: 8, flecks: [['#a8c860', 10, 1.6]] })),
    // ソパ・デ・トルティーヤ: トマトとパシーヤの汁に揚げたトルティーヤ・アボカド・ケソ、クレマ（お好みで）
    mx_sopa_tortilla: S('#a8301a', [['tostadaStrip', 12, 16], ['avocado', 4, 13], ['cheese', 3, 12]], { minD: 8, cream: CREMA, ing: { ...ing, cheese: (p, x, y, s, r, i) => W.dice(p, x, y, s * .7, '#f6f2e6', p.id + 'qs' + i, { h: s * .4, top: Q.rg(p, [[0, '#ffffff'], [1, '#ece4d0']], .4, .35, .8) }) } }),
    // 黒豆のスープ、揚げトルティーヤ・ケソ・クレマ（お好みで）
    mx_sopa_frijol: S('#3a2420', [['tostadaStrip', 6, 14]], { cream: CREMA, flecks: [queso(10)] }),
    // レンズ豆のスープ: レンズ豆・トマト・玉ねぎ・にんじん、熟したバナナ（お好みで）
    mx_lentejas: S('#9a5a2a', [['lentil', 20, 13], ['carrot', 5, 12], ['plantain', 3, 14]], { minD: 6 }),
    // アルボンディガス（肉団子のスープ）: 肉団子・トマト・にんじん・ズッキーニ
    mx_albondigas: S('#d8803a', [['meatball', 5, 20], ['carrot', 4, 13], ['zucchini', 3, 13]], withLime({ minD: 14 })),
    // カルド・デ・レス（牛すねと野菜のスープ）: 牛すね・とうもろこし・にんじん・じゃがいも・ハヤトウリ・キャベツ・ズッキーニ
    mx_caldo_res: S('#d8b878', [['beef', 3, 15], ['cornCob', 2, 18], ['carrot', 3, 13], ['potato', 2, 13], ['zucchini', 2, 13], ['cabbage', 1, 14]], withLime({ ing: { ...ing, cornCob: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .55, '#e8b830', { h: s * .5, liq, top: Q.rg(p, [[0, '#fff8d0'], [.3, '#f6e8a0'], [.4, '#f6c83a'], [1, '#d09a1a']], .4, .35, .8) }) } })),
    // カルド・トラルペーニョ（ひよこ豆とチポトレの鶏スープ）: 鶏・ひよこ豆・にんじん、アボカド・チーズ（お好みで）
    mx_tlalpeno: S('#d8803a', [['chicken', 3, 14], ['chickpea', 10, 14], ['carrot', 4, 11], ['avocado', 3, 12]], { minD: 8 }),
    // 魚のスープ: 魚の切り身・トマト・グアヒージョ・にんじん・じゃがいも・香菜・ライム
    mx_caldo_pescado: S('#c84a24', [['fish', 3, 20], ['carrot', 4, 12], ['potato', 3, 12]], withLime({ minD: 12, flecks: [[CIL[0], 12, 1.6]] })),
    // えびのスープ: 殻つきのえび・グアヒージョ・トマト・じゃがいも・にんじん・ライム
    mx_caldo_camaron: S('#c8401e', [['shrimpRed', 5, 16], ['potato', 3, 12], ['carrot', 4, 11]], withLime({ minD: 12 })),
    // コーンのクリームスープ、ポブラノ・ケソ・クレマ（お好みで）
    mx_crema_elote: S('#f2d880', [['corn', 8, 13], ['poblano', 3, 12]], { minD: 8, cream: CREMA }),
    // ポブラノのクリームスープ、パネラ（お好みで）
    mx_crema_poblano: S('#8aa858', [['corn', 6, 12], ['cheese', 3, 12]], { minD: 10, cream: CREMA, ing: { ...ing, cheese: (p, x, y, s, r, i) => W.dice(p, x, y, s * .7, '#f6f2e6', p.id + 'qs' + i, { h: s * .4, top: Q.rg(p, [[0, '#ffffff'], [1, '#ece4d0']], .4, .35, .8) }) } }),
    // かぼちゃの花のスープ: かぼちゃの花・ズッキーニ・コーン・玉ねぎ・トマト
    mx_sopa_flor: S('#e8c070', [['squashFlower', 5, 16], ['zucchini', 4, 12], ['corn', 8, 12]], { minD: 9 }),
    // メヌード（牛の胃袋の赤いスープ）: 胃袋・ホミニー・グアヒージョ・ライム
    mx_menudo: S('#a8281a', [['tripe', 8, 16], ['hominy', 8, 13]], withLime({ minD: 9, flecks: [['#f2e8c8', 8, 1.4]] })),
    // メキシコの野菜スープ: にんじん・じゃがいも・ズッキーニ・いんげん・コーン・トマト
    mx_sopa_verduras: S('#e0a060', [['carrot', 5, 11], ['potato', 4, 11], ['zucchini', 4, 11], ['greenBean', 3, 8], ['corn', 6, 12]], { minD: 8 }),
    // モレ・デ・オジャ（牛肉と野菜の赤いスープ）: 牛すね・とうもろこし・ハヤトウリ・いんげん・ズッキーニ
    mx_mole_olla: S('#a8341a', [['beef', 3, 15], ['cornCob', 2, 17], ['chayote', 3, 12], ['greenBean', 3, 8], ['zucchini', 2, 12]], { minD: 12, ing: { ...ing, cornCob: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .55, '#e8b830', { h: s * .5, liq, top: Q.rg(p, [[0, '#fff8d0'], [.3, '#f6e8a0'], [.4, '#f6c83a'], [1, '#d09a1a']], .4, .35, .8) }) } }),
    // ズッキーニのクリームスープ、ケソフレスコ（お好みで）
    mx_crema_calabacita: S('#c8d890', [], { cream: CREMA, flecks: [queso(10)] }),
    // そら豆のスープ: 黄色いそら豆・トマト・玉ねぎ・香菜、ノパル（お好みで）
    mx_sopa_habas: S('#d8a838', [['fava', 14, 14], ['nopal', 4, 12]], { minD: 8, flecks: [[CIL[0], 12, 1.6]] }),
    // カルド・デ・ウエボ（トマトの汁に落とし卵）: 卵・トマト・玉ねぎ・セラーノ・香菜
    mx_caldo_huevo: S('#c8401e', [['eggPoached', 3, 22], ['jalapeno', 3, 12], ['potato', 3, 11]], { minD: 16, flecks: [[CIL[0], 12, 1.6]] }),
    // マッシュルームのスープ: マッシュルーム・トマト・玉ねぎ、セラーノ（お好みで）
    mx_sopa_champinones: S('#b8501e', [['mushroom', 10, 14], ['jalapeno', 2, 11]], { minD: 9 }),
};
// サルサの小皿（ケサディーヤに添える）
function salsaCup(p, o){ const [x, y] = at(o, 48, 32); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="14" ry="${f(14 * SYF)}" fill="#c8784a" stroke="#8a3a1a" stroke-width=".8"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="11" ry="${f(11 * SYF)}" fill="#b8301a"/>` + W.flecks(p, x, y, 8, 6, 'sc', ['#f2e8c8', '#3f8a2a'], { ry: 3, s: 1 }); }
