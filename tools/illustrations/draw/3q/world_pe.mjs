// ペルー（pe_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 皿で食べる国。主菜・炒め物（saltado）・揚げ物・ご飯・麺は朱の縁（#c0392b。主食の pe_staple にそろえる）の白い平皿、
// 汁物（sopa・caldo・chupe）は朱の線の白い大きな碗、煮込み（seco・estofado・ají de gallina・locro）は朱の縁の深皿、
// セビーチェ・サルサ・前菜は白い小鉢・平皿。
// 材料は gohancho/packs/pe.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, T: TR } = W;

const RED = '#c0392b';
const plato = (p, o = {}) => Q.plate(p, { line: 'none', edge: RED, ...o });
const tazon = (p, o = {}) => Q.shiroBowl(p, { rim: RED, line: 'none', ...o });
const deep = (p, o = {}) => Q.fukazara(p, { line: RED, ...o });
const small = (p, o = {}) => W.sideBowl(p, { edge: RED, ...o });
const CIL = ['#3f8a2a', '#5aa83a'], AJI = '#f0b020';
const lime = (p, x, y, s = 14) => W.lemon(p, x, y, s, { wedge: true, c: '#8ab83a' });
const ing = {
    yellowPotato: (p, x, y, s, r, i) => Q.glossLump(p, x, y, s, i, { c: '#f2d060' }),
    potSlice: (p, x, y, s, r, i) => W.coin(p, x, y, s * .6, '#d8b048', { h: 5, top: Q.rg(p, [[0, '#fff2b0'], [1, '#f2d060']], .4, .35, .8) }),
    friesPe: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .7, -s * .14], [s * .7, -s * .14], [s * .7, s * .14], [-s * .7, s * .14]], s * .26, '#e8b048', { rot: r, line: .4, top: Q.lg(p, [[0, '#fff2c0'], [1, '#f0c050']], 0, 0, 0, 1) }),
    sweetPotSlice: (p, x, y, s, r, i) => W.coin(p, x, y, s * .6, '#c8601e', { h: 4, top: Q.rg(p, [[0, '#ffc070'], [.7, '#f0903a'], [1, '#c8661e']], .4, .35, .8) }),
    choclo: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .32)}" ry="${f(s * .26)}" fill="${Q.rg(p, [[0, '#fffbe0'], [.6, '#f2e0a0'], [1, '#d8c070']], .35, .3, .8)}" stroke="#c8b060" stroke-width=".4"/>`,
    chocloCob: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .55, '#e8d080', { h: s * .5, liq, top: Q.rg(p, [[0, '#fffbe0'], [.3, '#f6ecb0'], [.4, '#f0dc90'], [1, '#d8c070']], .4, .35, .8) }),
    cancha: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .3, s * .24, '#d8902a', p.id + 'cn' + i, { n: 8, jit: .2, hi: .6, edge: '#8a5a1a' }),
    olive: (p, x, y, s) => W.ING.olive(p, x, y, s * .8),
    fishCeviche: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#e8e2d6', p.id + 'fc' + i, { h: s * .45, top: Q.rg(p, [[0, '#ffffff'], [1, '#f2ece0']], .4, .35, .8) }),
    fishFriedBite: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .45, s * .34, i, { c: '#d8a048', n: 12, h: 5, rot: r }),
    chickenAji: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .5, -1.6], [s * .5, -1.4], [s * .45, 1.6], [-s * .5, 1.4]], 2.2, '#f0d090', { rot: r, line: .35 }),
    chickenGreen: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#c8b070', soak: '#4a6a22', k: .5, sy: .72 }),
    chickenRoast: (p, x, y, s, r, i) => W.drumstick(p, x, y, s * 1.6, r, i, { c: '#a85a24', fried: false }),
    chickenStew: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e8a070', soak: '#b8401e', k: .5, sy: .72 }),
    beefGreen: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#8a5a2a', soak: '#3f5a1e', k: .55, sy: .72 }),
    porkAdobo: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#a8401e', soak: '#6a1a0a', k: .55, sy: .72 }),
    beefStrip: (p, x, y, s, r, i) => Q.slice3q(p, x, y, s * 1.3, r, { c: '#7a3a1a', fat: '#a8603a', seed: i, gloss: .8, char: false }, { sq: .5 }),
    pallar: (p, x, y, s, r) => Q.bean(p, x, y, s * .9, r, '#f2ecd4'),
    canary: (p, x, y, s, r) => Q.bean(p, x, y, s * .7, r, '#e8d090'),
    fava: (p, x, y, s, r) => Q.bean(p, x, y, s * .8, r, '#9ab858'),
    quinoa: (p, x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.1" fill="#f2e6c0" stroke="#c8b480" stroke-width=".3"/>`,
    olluco: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .5, -1.6], [s * .5, -1.6], [s * .5, 1.6], [-s * .5, 1.6]], 2.4, '#e8c060', { rot: r, line: .35, top: Q.lg(p, [[0, '#fff0b0'], [1, '#e0b850']], 0, 0, 0, 1) }),
    papaSeca: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .3, s * .22, '#c8946a', p.id + 'ps' + i, { n: 8, jit: .3, hi: .4 }),
    yucaFry: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -s * .2], [s * .8, -s * .24], [s * .8, s * .2], [-s * .8, s * .22]], s * .32, '#d8a050', { rot: r, line: .45, top: Q.lg(p, [[0, '#fff2c8'], [.5, '#f2d890'], [1, '#d8a050']], 0, 0, 0, 1) }),
    plantainLong: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -s * .22], [s * .8, -s * .26], [s * .8, s * .2], [-s * .8, s * .24]], 4, '#a8541e', { rot: r, line: .5, top: Q.lg(p, [[0, '#ffd890'], [.5, '#e8902e'], [1, '#a8541e']], 0, 0, 0, 1) }),
    hominy: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .4, s * .32, '#f6f0e0', p.id + 'hm' + i, { n: 9, jit: .25, hi: .7, edge: '#c8b898' }),
    tripe: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#e8d8c0', p.id + 'tr' + i, { h: s * .3, top: Q.rg(p, [[0, '#fbf2e4'], [1, '#e8d8c0']], .4, .35, .8) }),
    wonton: (p, x, y, s, r, i) => `<path d="${Q.blob(x, y, s * .6, s * .38, p.id + 'wt' + i, { n: 10, jit: .3 })}" fill="${Q.rg(p, [[0, '#fbf6e8'], [1, '#e8dcc0']], .4, .35, .8)}" stroke="#c8b890" stroke-width=".5"/>` + W.ball(p, x, y - 2, s * .4, '#d8b0a0', p.id + 'wb' + i, { hi: .5 }),
    pakchoi: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.4, r, i % 2 ? '#3f8a2a' : '#5aa83a', 'pc' + p.id + i, { wave: 1.6 }),
    egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    eggPoached: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#fbf8f0', p.id + 'ep' + i, { hi: .6 }) + `<ellipse cx="${f(x - 1)}" cy="${f(y - s * .45)}" rx="${f(s * .2)}" ry="${f(s * .13)}" fill="#f6c22a"/>`,
    queso: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .7, '#f2ecd8', p.id + 'qs' + i, { h: s * .4, liq, top: Q.rg(p, [[0, '#ffffff'], [1, '#f0ead8']], .4, .35, .8) }),
    pasta: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#d8b060" stroke-width="${f(s * .32)}" fill="none" stroke-linecap="round"/><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#f6dc90" stroke-width="${f(s * .18)}" fill="none" stroke-linecap="round"/></g>`,
    angelHair: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s)},0 Q${f(-s / 3)},-3 0,0 T${f(s)},0" stroke="#f0dca0" stroke-width="1" fill="none"/></g>`,
    rocoto: (p, x, y, s) => W.chiliRing(x, y, s * .28, '#c8281a'),
    ajiRing: (p, x, y, s) => W.chiliRing(x, y, s * .28, '#e8a020'),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(plato, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(tazon, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}) => M(deep, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}) => M(small, 'bowl', null, items, { minD: 7, ...o });
const cil = (n = 14) => [CIL[0], n, 1.6];
const withLime = (o = {}) => ({ ...o, after: (S, V, p) => lime(p, S.cx + 46, S.cy + 4, 14) });
// 平皿に、主のもの（main(o)）と白いご飯の丸い山を添える
const withRice = (draw) => p => { const D = plato(p), o = D.o; return D.s + W.riceMound(p, ...at(o, 44, -16), 30, 26, { sy: SYF }) + draw(p, o); };
const sauceOn = (p, x, y, rx, c, seed) => `<path d="${Q.blob(x, y, rx, rx * .5, seed, { n: 12, jit: .2 })}" fill="${Q.rg(p, [[0, W.lt(c, .3)], [.7, c], [1, W.dk(c, .15)]], .4, .35, .8)}" stroke="${W.dk(c, .2)}" stroke-width=".5"/>` + Q.shine(x - rx * .4, y - rx * .3, rx * .4, -8, .6);

export default {
    // ---------- 主菜 ----------
    // ロモ・サルタード（牛肉とポテトの炒め物）: 牛肉・赤玉ねぎ・トマト・フライドポテト・香菜、アヒ・アマリージョ（お好みで）
    pe_lomo_saltado: withRice((p, o) => byDepth(W.spots('ls', 40, 46, 8).map(([u, v, r], i) => { const [x, y] = at(o, u - 16, v + 8, 4 + W.hill(u, v, 46, 18)); return [y, () => W.grow(x, y, 1.35, [ing.beefStrip, ing.friesPe, W.ING.redOnion, W.ING.tomato, ing.friesPe][i % 5](p, x, y, 14, r, i))]; })) + W.flecks(p, ...at(o, -14, 0, 14), 34, 14, 'lsc', CIL, { ry: 12, s: 1.8 })),
    // アヒ・デ・ガジーナ（鶏のアヒ・アマリージョのクリーム煮）: 鶏・パン・エバミルク・チーズ、黄色いじゃがいも・卵・オリーブ
    pe_aji_gallina: withRice((p, o) => { const [x, y] = at(o, -18, 6, 2); return sauceOn(p, x, y, 56, '#f0c040', 'ag') + byDepth(W.spots('agc', 20, 38, 6).map(([u, v, r], i) => [y + v * .4, () => ing.chickenAji(p, x + u, y + v * .4 - 4, 14, r, i)])) + ing.egg(p, x - 10, y - 6, 16, 0, 1) + ing.olive(p, x + 16, y - 4, 12) + byDepth([[-50, 30], [-30, 40]].map(([u, v], i) => { const [xx, yy] = at(o, u, v, 2); return [yy, () => ing.potSlice(p, xx, yy, 18, 0, i)]; })); }),
    // スダード（白身魚のトマトと玉ねぎ蒸し煮）: 白身魚・赤玉ねぎ・トマト・アヒ・香菜
    pe_sudado: B('#e8902a', [['fish', 3, 26], ['redOnion', 5, 14], ['tomato', 4, 13], ['ajiRing', 3, 12]], { minD: 14, flecks: [cil(16)] }),
    // レンズ豆の煮込み: レンズ豆・玉ねぎ・トマト、にんじん・香菜（お好みで）
    pe_lentejas: withRice((p, o) => { const [x, y] = at(o, -18, 6, 2); return sauceOn(p, x, y, 56, '#8a5a2a', 'lt') + W.flecks(p, x, y - 2, 36, 60, 'ltl', ['#a8743a', '#6a4220', '#c8945a'], { ry: 16, s: 2 }) + W.flecks(p, x, y - 4, 30, 8, 'ltc', ['#e8742a', CIL[0]], { ry: 12, s: 2 }); }),
    // セコ（牛肉の香菜煮込み）: 牛肉・香菜・玉ねぎ・アヒ・グリンピース・にんじん・黄色いじゃがいも
    pe_seco: B('#4a6a22', [['beefGreen', 7, 20], ['yellowPotato', 3, 16], ['carrot', 3, 12], ['pea', 6, 12]]),
    // ポジョ・アル・オルノ（鶏とじゃがいものロースト）、ライム、さつまいも（お好みで）
    pe_pollo_horno: P([['chickenRoast', 4, 22], ['potatoRoast', 6, 15], ['sweetPotSlice', 3, 18]], { minD: 16, after: (o, D, p) => lime(p, ...at(o, 50, 32), 14) }),
    // エストファド（鶏と野菜の煮込み）: 鶏・トマト・玉ねぎ・にんじん・黄色いじゃがいも・グリンピース
    pe_estofado: B('#c8401e', [['chickenStew', 6, 18], ['yellowPotato', 3, 15], ['carrot', 4, 12], ['pea', 6, 12]]),
    // ビステック・アパナード（牛肉の薄いカツ）、ライム
    pe_bistec_apanado: p => { const D = plato(p), o = D.o, [x, y] = at(o, -10, -2, 4); return D.s + W.cutlet(p, x, y, 62, 34, -6, { inner: '#c8907a', c: ['#f0c070', '#d8963a', '#a8641e'] }) + lime(p, ...at(o, 50, 32), 18); },
    // パパ・レジェーナ（ひき肉を詰めたじゃがいものコロッケ）
    pe_papa_rellena: P([['papaRellena', 3, 30]], { minD: 34, H: 8, ing: { ...ing, papaRellena: (p, x, y, s, r, i) => Q.lump(p, x, y - 6, s * .7, s * .42, '#c8822e', p.id + 'pr' + i, { n: 14, jit: .06, hi: .7, edge: '#8a5a1e' }) }, after: (o, D, p) => W.flecks(p, ...at(o, 44, 30), 14, 14, 'prs', ['#d880b0', '#c87aa8', CIL[0]], { ry: 6, s: 2 }) }),
    // カラプルクラ（乾燥じゃがいもと豚の煮込み）: 乾燥じゃがいも・豚・ピーナッツ・玉ねぎ
    pe_carapulcra: B('#b8803a', [['porkAdobo', 5, 16], ['papaSeca', 14, 16], ['peanut', 6, 12]], { ing: { ...ing, porkAdobo: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#c8946a', soak: '#8a4a1e', k: .45, sy: .72 }) } }),
    // アドボ（豚のチチャとアヒ・パンカ煮）: 豚・赤玉ねぎ、さつまいも（お好みで）
    pe_adobo: B('#7a1e10', [['porkAdobo', 9, 20], ['redOnion', 3, 14], ['sweetPotSlice', 2, 18]]),
    // セビーチェ: 白身魚・ライム・赤玉ねぎ・アヒ・香菜、さつまいも・とうもろこし（お好みで）
    pe_ceviche: p => { const D = plato(p), o = D.o; return D.s + W.pool(p, o.cx, o.cy + 4, 44, '#f6f0dc', 'cv') + byDepth(W.spots('cvf', 22, 36, 9).map(([u, v, r], i) => { const [x, y] = at(o, u - 6, v, 4 + W.hill(u, v, 36, 12)); return [y, () => W.grow(x, y, 1.2, i % 4 === 3 ? W.ING.redOnion(p, x, y, 13, r) : ing.fishCeviche(p, x, y, 15, r, i))]; })) + W.flecks(p, o.cx - 6, o.cy - 8, 30, 14, 'cvc', [CIL[0], '#e8a020'], { ry: 10, s: 1.8 }) + ing.sweetPotSlice(p, ...at(o, 48, 26, 2), 22, 0, 1) + ing.chocloCob(p, ...at(o, -48, 30, 2), 22, 0, 1) + lime(p, ...at(o, 44, -24), 14); },
    // チチャロン・デ・ペスカード（魚の揚げもの）、ライム、ユカ・サルサ・クリオージャ（お好みで）
    pe_chicharron_pescado: P([['fishFriedBite', 18, 18], ['yucaFry', 3, 16]], { minD: 12, after: (o, D, p) => lime(p, ...at(o, 50, 32), 14) + W.flecks(p, ...at(o, -46, 32), 12, 10, 'chs', ['#c87aa8', CIL[0]], { ry: 5, s: 2 }) }),
    // エスカベチェ（揚げ魚の酢玉ねぎがけ）: 魚・赤玉ねぎ・アヒ・卵・オリーブ・さつまいも
    pe_escabeche: P([['fishFried', 3, 28], ['redOnion', 10, 16], ['ajiRing', 3, 12], ['egg', 1, 16], ['olive', 2, 12], ['sweetPotSlice', 1, 18]], { minD: 12 }),
    // トルティージャ・デ・ベルドゥーラス（野菜のオムレツ）: 卵・いんげん・にんじん・玉ねぎ・トマト
    pe_tortilla_verduras: p => { const D = plato(p); return D.s + W.jeon(p, 100, 100, 56, 1, { c: '#e8b440', h: 8 }) + W.flecks(p, 100, 96, 44, 50, 'tv', ['#4a9a2c', '#e8742a', '#efdcae', '#d8402a'], { ry: 24, s: 2 }) + Q.shine(80, 84, 20, -8, .7); },
    // タク・タク（豆とご飯の焼きもの）、目玉焼き（お好みで）
    pe_tacu_tacu: p => { const D = plato(p), o = D.o, [x, y] = at(o, -6, 2, 4); return D.s + `<g transform="translate(${f(x)} ${f(y)}) rotate(-6)"><path d="M-52,0 Q-52,-22 0,-22 Q52,-22 52,0 Q52,14 0,14 Q-52,14 -52,0Z" fill="#8a5a2a" transform="translate(0 6)"/><path d="M-52,0 Q-52,-22 0,-22 Q52,-22 52,0 Q52,14 0,14 Q-52,14 -52,0Z" fill="${Q.rg(p, [[0, '#e8c070'], [.6, '#c8902e'], [1, '#8a5a1e']], .4, .35, .8)}" stroke="#7a4a1a" stroke-width=".8"/></g>` + W.flecks(p, x, y - 4, 44, 50, 'tt', ['#f6e0a0', '#a8702a', '#e8c890'], { ry: 14, s: 1.8 }) + W.friedEgg(p, x + 10, y - 12, 38, 1); },
    // パジャーレス（ライマ豆の煮込み）: ライマ豆・玉ねぎ・トマト・アヒ
    pe_pallares: withRice((p, o) => { const [x, y] = at(o, -18, 6, 2); return sauceOn(p, x, y, 56, '#f0d890', 'pl') + byDepth(W.spots('plb', 22, 40, 8).map(([u, v, r], i) => [y + v * .4, () => ing.pallar(p, x + u, y + v * .4 - 3, 14, r)])) + W.flecks(p, x, y - 4, 30, 10, 'plc', [CIL[0], '#e8a020'], { ry: 10, s: 1.8 }); }),
    // ロクロ（かぼちゃの煮込み）: かぼちゃ・じゃがいも・とうもろこし・グリンピース・チーズ・エバミルク
    pe_locro: withRice((p, o) => { const [x, y] = at(o, -18, 6, 2); return sauceOn(p, x, y, 56, '#f0a030', 'lc') + byDepth(W.spots('lcv', 18, 40, 10).map(([u, v, r], i) => [y + v * .4, () => [W.ING.potato, ing.choclo, W.ING.pea, ing.queso][i % 4](p, x + u, y + v * .4 - 3, 14, r, i)])); }),
    // オユキート（オユコと牛肉）: オユコ・牛肉・玉ねぎ・パセリ
    pe_olluquito: withRice((p, o) => byDepth(W.spots('ol', 56, 46, 6).map(([u, v, r], i) => { const [x, y] = at(o, u - 18, v + 8, 4 + W.hill(u, v, 46, 16)); return [y, () => i % 5 === 4 ? ing.beefStrip(p, x, y, 10, r, i) : ing.olluco(p, x, y, 14, r)]; })) + W.flecks(p, ...at(o, -16, 4, 14), 34, 16, 'olc', CIL, { ry: 12, s: 1.6 })),

    // ---------- ご飯・麺 ----------
    // アロス・コン・ポジョ（香菜ご飯と鶏）: 鶏・米・香菜・グリンピース・にんじん・赤ピーマン
    pe_arroz_pollo: P([['chickenRoast', 2, 22], ['pea', 10, 12], ['carrot', 8, 10], ['pepperR', 4, 10]], { rice: { cols: ['#8ab050', '#7aa040', '#a8c868'], edge: '#4a6a22' }, H: 24, R: 50, minD: 10 }),
    // アロス・チャウファ（ペルー中華のチャーハン）: 鶏・卵・青ねぎ・生姜、赤ピーマン（お好みで）
    pe_arroz_chaufa: P([['chicken', 6, 12], ['scramble', 6, 12], ['pepperR', 3, 10]], { rice: { cols: ['#c8864a', '#b8743a', '#d89a5a'], edge: '#7a4a1e' }, H: 24, R: 50, flecks: [['#4a9a2c', 24, 1.8]] }),
    // アロス・タパード（ひき肉を挟んだご飯の型抜き）: ご飯・ひき肉・玉ねぎ・トマト・卵、オリーブ・レーズン（お好みで）
    pe_arroz_tapado: p => { const D = plato(p), o = D.o, [x, y] = at(o, -4, 0, 2); return D.s + `<path d="M${f(x - 40)},${f(y - 10)} L${f(x - 40)},${f(y + 8)} A40,${f(40 * SYF)} 0 0 0 ${f(x + 40)},${f(y + 8)} L${f(x + 40)},${f(y - 10)}Z" fill="${Q.lg(p, [[0, '#fbf6ea'], [.45, '#f2ecdc'], [.5, '#8a4a24'], [.56, '#f2ecdc'], [1, '#e0d8c4']])}" stroke="#c8bca0" stroke-width=".6"/><ellipse cx="${f(x)}" cy="${f(y - 10)}" rx="40" ry="${f(40 * SYF)}" fill="${Q.rg(p, [[0, '#ffffff'], [1, '#efe8d8']], .4, .35, .8)}" stroke="#c8bca0" stroke-width=".6"/>` + W.flecks(p, x, y - 10, 30, 30, 'atr', ['#e8e0cc'], { ry: 14, s: 1.2 }) + W.flecks(p, x, y - 12, 12, 4, 'atp', [CIL[0]], { ry: 4, s: 2 }); },
    // アロス・コン・マリスコス（魚介のご飯）: えび・いか・玉ねぎ・赤ピーマン・グリンピース、ムール貝（お好みで）
    pe_arroz_mariscos: P([['shrimp', 6, 15], ['squid', 6, 14], ['mussel', 3, 14], ['pepperR', 4, 10], ['pea', 8, 12]], { rice: { cols: ['#f0a050', '#e8903a', '#f6b878'], edge: '#b8602a' }, H: 22, R: 50, minD: 10, flecks: [cil(12)] }),
    // アロス・ア・ラ・クバーナ（ご飯と目玉焼きと揚げバナナ）、トマト（お好みで）
    pe_arroz_cubana: p => { const D = plato(p), o = D.o; return D.s + W.riceMound(p, ...at(o, -20, -6), 30, 24, { sy: SYF }) + W.friedEgg(p, ...at(o, -20, -6, 24), 34, 1) + byDepth([[30, -4, -20], [36, 16, -10]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => ing.plantainLong(p, x, y, 26, r)]; })) + W.tomatoBall(p, ...at(o, -40, 34), 14); },
    // タジャリネス・ベルデス（ほうれん草とバジルのソースのスパゲッティ）
    pe_tallarines_verdes: p => { const D = plato(p); return D.s + W.noodleMound(p, 100, 104, 52, 20, '#7aa040', 'tv', { w: 2.4, n: 150, len: 34, sy: SYF, edge: '#4a6a22' }) + W.flecks(p, 100, 90, 34, 20, 'tvq', ['#f6f0dc'], { ry: 12, s: 2.2 }); },
    // タジャリン・サルタード（牛肉の焼きそば）: 卵麺・牛肉・赤玉ねぎ・トマト・青ねぎ
    pe_tallarin_saltado: P([['beefStrip', 6, 14], ['redOnion', 5, 12], ['tomato', 4, 11], ['pepperR', 2, 10]], { noodle: { c: '#c8904a', edge: '#8a5a24' }, H: 18, R: 50, flecks: [['#4a9a2c', 16, 1.8]] }),
    // タジャリネス・ロホス（トマトソースのスパゲッティと鶏）、粉チーズ（お好みで）
    pe_tallarines_rojos: p => { const D = plato(p), o = D.o; return D.s + W.noodleMound(p, 100, 104, 52, 18, '#e0703a', 'tr', { w: 2.4, n: 150, len: 34, sy: SYF, edge: '#a8401e' }) + ing.chickenRoast(p, ...at(o, 10, -4, 18), 22, -20, 1) + W.flecks(p, 100, 92, 34, 24, 'trc', ['#f8f0d0'], { ry: 12, s: 1.6 }); },

    // ---------- 副菜 ----------
    // パパ・ア・ラ・ワンカイーナ（じゃがいものチーズとアヒのソース）: 黄色いじゃがいも・卵・オリーブ、レタス（お好みで）
    pe_huancaina: p => { const D = plato(p), o = D.o; return D.s + W.ING.lettuce(p, ...at(o, -40, -18), 18, -20, 1) + byDepth([[-24, -6], [0, -12], [24, -4], [-12, 14], [14, 16]].map(([u, v], i) => { const [x, y] = at(o, u, v, 2); return [y, () => ing.potSlice(p, x, y, 30, 0, i)]; })) + sauceOn(p, ...at(o, -4, 0, 12), 34, '#f6d040', 'hc') + ing.egg(p, ...at(o, -10, -2, 14), 16, 0, 1) + ing.olive(p, ...at(o, 14, 0, 14), 12); },
    // サルサ・クリオージャ（赤玉ねぎの薬味）: 赤玉ねぎ・アヒ・香菜・ライム
    pe_salsa_criolla: K([['redOnion', 24, 15], ['ajiRing', 4, 12]], withLime({ flecks: [cil(14)] })),
    // カウサ（じゃがいもとツナの重ね）: アヒのじゃがいも・ツナ・アボカド、卵・オリーブ（お好みで）
    pe_causa: p => { const D = plato(p), o = D.o, [x, y] = at(o, 0, 0, 2); const layer = (y0, h, c, c2) => `<path d="M${f(x - 34)},${f(y0)} L${f(x - 34)},${f(y0 + h)} A34,${f(34 * SYF)} 0 0 0 ${f(x + 34)},${f(y0 + h)} L${f(x + 34)},${f(y0)}Z" fill="${Q.lg(p, [[0, W.lt(c, .1)], [.6, c], [1, W.dk(c, .15)]])}"/>`; return D.s + layer(y - 6, 12, '#f2d040') + layer(y - 14, 8, '#7aa040') + layer(y - 20, 6, '#f6ecd0') + layer(y - 32, 12, '#f2d040') + `<ellipse cx="${f(x)}" cy="${f(y - 32)}" rx="34" ry="${f(34 * SYF)}" fill="${Q.rg(p, [[0, '#fff6b0'], [1, '#f2d040']], .4, .35, .8)}" stroke="#c8a020" stroke-width=".6"/>` + ing.egg(p, x - 6, y - 36, 14, 0, 1) + ing.olive(p, x + 12, y - 34, 10) + W.flecks(p, x, y - 34, 24, 6, 'csp', [CIL[0]], { ry: 8, s: 1.6 }); },
    // ビーツとじゃがいものサラダ: ビーツ・じゃがいも・にんじん・グリンピース・ライム、マヨネーズ（お好みで）
    pe_ensalada_rusa: K([['beet', 12, 13], ['potato', 8, 12], ['carrot', 6, 10], ['pea', 8, 12]], { base: '#d0507a' }),
    // 揚げバナナ（熟した）
    pe_platano: P([['plantainLong', 7, 20]], { minD: 16, H: 10 }),
    // チョクロ（大粒のとうもろこし）とケソ・フレスコ
    pe_choclo: p => { const D = plato(p), o = D.o; return D.s + byDepth([[-16, -6, -14], [14, 10, -8]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => `<g transform="translate(${f(x)} ${f(y)}) rotate(${r})"><rect x="-48" y="-14" width="96" height="28" rx="14" fill="#d8c070"/>${Array.from({ length: 11 }, (_, a) => Array.from({ length: 3 }, (_, b) => `<ellipse cx="${-40 + a * 8}" cy="${-8 + b * 8}" rx="3.8" ry="3.4" fill="${Q.rg(p, [[0, '#fffbe0'], [.7, '#f2e0a0'], [1, '#d8c070']], .35, .3, .8)}"/>`).join('')).join('')}</g>`]; })) + W.cutSlab(p, ...at(o, 44, 30, 4), 18, 10, 7, '#f6f2e6', 'cq', { rot: 10, edgeC: '#ece4d0' }); },
    // ソルテリート（そら豆とチーズのサラダ）: そら豆・チーズ・とうもろこし・トマト・赤玉ねぎ・オリーブ・パセリ
    pe_solterito: K([['fava', 12, 13], ['queso', 6, 13], ['choclo', 10, 13], ['tomato', 5, 11], ['redOnion', 4, 11], ['olive', 3, 12]], { minD: 6, flecks: [cil(12)] }),
    // オコパ（じゃがいものピーナッツとワカタイのソース）: じゃがいも・ピーナッツ・アヒ・チーズ、卵・オリーブ（お好みで）
    pe_ocopa: p => { const D = plato(p), o = D.o; return D.s + byDepth([[-24, -6], [0, -12], [24, -4], [-12, 14], [14, 16]].map(([u, v], i) => { const [x, y] = at(o, u, v, 2); return [y, () => ing.potSlice(p, x, y, 30, 0, i)]; })) + sauceOn(p, ...at(o, -4, 0, 12), 34, '#a8a040', 'oc') + ing.egg(p, ...at(o, -10, -2, 14), 16, 0, 1) + ing.olive(p, ...at(o, 14, 0, 14), 12); },
    // パルタ・レジェーナ（鶏のサラダを詰めたアボカド）: アボカド・鶏・にんじん・グリンピース・マヨネーズ・ライム
    pe_palta_rellena: p => { const D = plato(p), o = D.o; return D.s + W.ING.lettuce(p, ...at(o, -10, 10), 30, 10, 1) + byDepth([[-22, -4], [22, 4]].map(([u, v], i) => { const [x, y] = at(o, u, v, 6); return [y, () => `<path d="${Q.blob(x, y, 30, 18, 'pa' + i, { n: 12, jit: .05 })}" fill="#3a5a1e"/><path d="${Q.blob(x, y - 2, 27, 15, 'pi' + i, { n: 12, jit: .05 })}" fill="${Q.rg(p, [[0, '#f0f4b0'], [.6, '#c8dc78'], [1, '#7aa83a']], .4, .35, .8)}"/>` + W.mound(p, x, y - 2, 18, 8, '#f6ecd0', 'pm' + i, .5) + W.flecks(p, x, y - 8, 14, 8, 'pf' + i, ['#e8742a', '#7ab048'], { ry: 5, s: 1.8 })]; })) + lime(p, ...at(o, 50, 32), 13); },
    // チョロス・ア・ラ・チャラカ（ムール貝ととうもろこしのサルサ）: ムール貝・赤玉ねぎ・トマト・とうもろこし・ロコト・ライム・香菜
    pe_choros_chalaca: P([['musselTop', 6, 30]], { minD: 30, H: 8, ing: { ...ing, musselTop: (p, x, y, s, r, i) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r % 40 - 20)})"><path d="M0,${f(-s * .6)} C${f(s * .4)},${f(-s * .5)} ${f(s * .4)},${f(s * .4)} 0,${f(s * .5)} C${f(-s * .4)},${f(s * .4)} ${f(-s * .4)},${f(-s * .5)} 0,${f(-s * .6)}Z" fill="#3e3226" stroke="#1e1610" stroke-width=".6" transform="scale(1 .6)"/></g>` + W.flecks(p, x, y - 3, s * .34, 26, 'mt' + i, ['#c87aa8', '#d8402a', '#f2e0a0', CIL[0]], { ry: s * .14, s: 2.2 }) }, after: (o, D, p) => lime(p, ...at(o, 50, 32), 14) }),
    // キヌアのサラダ: キヌア・トマト・きゅうり・赤玉ねぎ・ライム・パセリ、チーズ（お好みで）
    pe_ensalada_quinua: K([['quinoa', 60, 10], ['tomato', 6, 11], ['cucumber', 5, 11], ['redOnion', 3, 11], ['queso', 3, 12]], withLime({ minD: 4, base: '#f2e6c0', flecks: [cil(14)] })),
    // ライマ豆のサラダ: ライマ豆・赤玉ねぎ・トマト・アヒ・香菜・ライム
    pe_ensalada_pallares: K([['pallar', 16, 14], ['redOnion', 4, 11], ['tomato', 5, 11], ['ajiRing', 3, 11]], withLime({ flecks: [cil(12)] })),
    // ロコトのクリームソース
    pe_crema_rocoto: K([], { base: '#e8502a', H: 12, groove: true, crown: [['rocoto', 3, 16], ['queso', 2, 13]], flecks: [['#f6e0c0', 12, 1.4], [CIL[0], 6, 1.4]] }),
    // エンクルティード（野菜のピクルス）: にんじん・カリフラワー・いんげん・赤玉ねぎ
    pe_encurtido: K([['carrot', 8, 12], ['cauliflower', 4, 12], ['greenBean', 5, 8], ['redOnion', 5, 11], ['rocoto', 2, 12]], { base: '#f0e8c0' }),
    // いんげんのトマト炒め: いんげん・赤玉ねぎ・トマト
    pe_saltado_vainitas: P([['greenBean', 18, 9], ['redOnion', 5, 12], ['tomato', 5, 11]], { sauce: '#8a3a1a' }),
    // チーファの野菜炒め: チンゲン菜・ブロッコリー・にんじん・生姜・青ねぎ
    pe_verduras_chifa: P([['pakchoi', 8, 14], ['broccoli', 6, 12], ['carrot', 8, 12]], { sauce: '#a8743a' }),
    // カンチャ（いりとうもろこし）
    pe_cancha: K([['cancha', 50, 14]], { minD: 4, base: '#c8862e', H: 10 }),
    // フレホーレス（カナリオ豆の煮もの）、豚バラ（お好みで）
    pe_frejoles: K([['canary', 30, 13]], { minD: 5, base: '#d8b878' }),
    // ペピアン・デ・チョクロ（すりおろしとうもろこしの煮もの）
    pe_pepian_choclo: K([], { base: '#f2d070', H: 14, groove: true, crown: [['choclo', 8, 16]], flecks: [['#f6e8a0', 30, 1.8], cil(10)] }),
    // ピュレ・デ・パパ（マッシュポテト）
    pe_pure_papa: K([], { base: '#f8e4a0', H: 22, groove: true, mash: 'potato' }),
    // アロス・アラベ（エンジェルヘアとレーズンとアーモンドのご飯）
    pe_arroz_arabe: P([['angelHair', 10, 14], ['raisin', 14, 13], ['nut', 6, 12]], { rice: { cols: ['#f2dcb0', '#e8c890', '#fbecc8'], edge: '#b8945a' }, H: 24, R: 50 }),
    // ユカ・フリタ（キャッサバのフライ）
    pe_yuca_frita: P([['yucaFry', 12, 22]], { minD: 12, H: 14 }),
    // カモテ・フリト（さつまいものフライ）
    pe_camote_frito: P([['sweetPotSlice', 10, 24]], { minD: 18, H: 10 }),
    // トレハス・デ・チョクロ（とうもろこしのかき揚げ）
    pe_torrejas_choclo: P([['torreja', 6, 26]], { minD: 22, H: 10, ing: { ...ing, torreja: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .6, s * .42, i, { c: '#e0a840', n: 18, h: 5, rot: r }) + W.flecks(p, x, y - 4, s * .4, 8, 'tj' + i, ['#fff0a0', '#4a9a2c'], { ry: s * .2, s: 1.6 }) } }),
    // パステル・デ・アセルガ（ふだん草のパイ）
    pe_pastel_acelga: p => W.bake(p, { base: '#e8dcc0', inner: '#f6efe2', c: '#e0a848', fl: ['#c8862e'], n: 10, dome: {}, scoop: { u0: 22, v0: 6, hf: 32, layers: [['#d8963a', .22], ['#4a7a2a', .78]], dots: [['#f6ecd8', 6, 3], ['#5a2a2a', 3, 1.8]] } }),
    // パステル・デ・パパ（じゃがいもとチーズのオーブン焼き）
    pe_pastel_papa: p => W.bake(p, { /*fx*/blister: 8, scoop: { layers: [['#c8862e', .1], ['#f6e4a8', .2], ['#fbf2d8', .1], ['#f6e4a8', .2], ['#fbf2d8', .1], ['#f6e4a8', .3]] }, /*xf*/ c: '#f2d070', fl: ['#d8902a', '#c8782a', '#fff2c0', '#a8601e'], n: 90 }),

    // ---------- 汁物 ----------
    // アグアディート（香菜の鶏と米のスープ）: 鶏・米・香菜・グリンピース・にんじん、じゃがいも（お好みで）
    pe_aguadito: S('#6a9a3a', [['chicken', 4, 15], ['pea', 8, 12], ['carrot', 5, 11], ['rice', 20, 10], ['yellowPotato', 2, 13]], { minD: 7, flecks: [cil(12)], after: (S, V, p) => lime(p, S.cx + 46, S.cy + 4, 13) }),
    // キヌアと野菜のスープ: キヌア・じゃがいも・にんじん・グリンピース、チーズ（お好みで）
    pe_sopa_quinua: S('#f0dca0', [['quinoa', 50, 10], ['potato', 4, 12], ['carrot', 4, 11], ['pea', 6, 12], ['queso', 2, 12]], { minD: 5 }),
    // ソパ・クリオージャ（牛肉と細麺のミルクスープ）: 牛肉・細麺・エバミルク・卵・トマト
    pe_sopa_criolla: S('#f0c890', [['beefStrip', 4, 12], ['angelHair', 8, 14], ['eggPoached', 1, 22]], { minD: 10, oil: [10, '#e8701e'] }),
    // カルド・デ・ガジーナ（めんどりのスープ）: 鶏・太麺・じゃがいも・卵・生姜・青ねぎ、ライム（お好みで）
    pe_caldo_gallina: S('#f2dca0', [['chicken', 3, 16], ['noodleBit', 8, 16], ['yellowPotato', 2, 14], ['egg', 1, 15]], withLime({ minD: 9, flecks: [['#4a9a2c', 14, 1.6]], oil: [10, '#f0c040'] })),
    // チュペ・デ・カマロネス（えびのチャウダー）: えび・黄色いじゃがいも・とうもろこし・米・グリンピース・卵・エバミルク・チーズ
    pe_chupe_camarones: S('#e8903a', [['shrimp', 4, 16], ['yellowPotato', 2, 14], ['chocloCob', 1, 18], ['eggPoached', 1, 18], ['queso', 2, 12], ['pea', 4, 12]], { minD: 10 }),
    // メネストロン（バジルのミネストローネ）: 牛肉・白いんげん・マカロニ・じゃがいも・キャベツ・にんじん・バジル・ほうれん草・チーズ
    pe_menestron: S('#7a9a3a', [['beef', 3, 13], ['whiteBean', 6, 13], ['pasta', 6, 13], ['potato', 3, 11], ['carrot', 3, 11], ['chocloCob', 1, 16]], { minD: 8 }),
    // サンコチャード（牛肉と野菜のゆでもの）: 牛肉・じゃがいも・さつまいも・ユカ・とうもろこし・キャベツ・にんじん・ポロねぎ・セロリ
    pe_sancochado: S('#e0c890', [['beef', 3, 16], ['potato', 2, 15], ['sweetPotato', 2, 14], ['cassava', 2, 14], ['chocloCob', 1, 18], ['cabbage', 1, 14], ['carrot', 2, 12], ['leek', 2, 12]], { minD: 12 }),
    // チルカーノ（魚のアラのスープ）: 魚・生姜・青ねぎ・香菜・ライム
    pe_chilcano: S('#ece4c8', [['fish', 3, 20]], withLime({ minD: 14, flecks: [['#4a9a2c', 14, 1.6], cil(10)] })),
    // パリウエラ（辛い魚介のスープ）: 魚・えび・いか・ムール貝・トマト・アヒ・香菜
    pe_parihuela: S('#c8401e', [['fish', 2, 18], ['shrimp', 3, 15], ['squid', 4, 14], ['mussel', 3, 14]], withLime({ minD: 10, flecks: [cil(12)] })),
    // シャンバル（麦と豆の月曜のスープ）: 麦・豆・そら豆・えんどう豆・燻製豚・香菜
    pe_shambar: S('#a8743a', [['grain', 20, 12], ['canary', 8, 12], ['fava', 6, 12], ['bacon', 4, 13]], { top: [['canary', 8, 16], ['fava', 5, 16]], minD: 6, flecks: [cil(12)] }),
    // ソパ・デ・モロン（ひき割り麦のスープ）: 麦・じゃがいも・にんじん、グリンピース・チーズ（お好みで）
    pe_sopa_moron: S('#e8d0a0', [['grain', 30, 11], ['potato', 4, 12], ['carrot', 4, 11], ['pea', 5, 12]], { minD: 6 }),
    // かぼちゃのクリームスープ、パンのクルトン（お好みで）
    pe_crema_zapallo: S('#f0a030', [['crouton', 6, 13]], { top: [['pumpkin', 4, 15], ['pumpkinSeed', 6, 14]], minD: 12, cream: '#fbf6e8', ing: { ...ing, crouton: (p, x, y, s, r, i) => W.dice(p, x, y, s * .7, '#c8862e', p.id + 'cr' + i, { h: s * .5, top: Q.rg(p, [[0, '#f6d890'], [1, '#d8a050']], .4, .35, .8) }) } }),
    // ソパ・ワンタン: ワンタン・鶏・チンゲン菜・青ねぎ・生姜、えび（お好みで）
    pe_sopa_wantan: S('#ecd8a8', [['wonton', 5, 22], ['pakchoi', 3, 12], ['shrimp', 2, 13]], { minD: 14, flecks: [['#4a9a2c', 12, 1.6]] }),
    // パタスカ（胃袋とモテのスープ）: 胃袋・モテ・じゃがいも・ミント
    pe_patasca: S('#e0c890', [['tripe', 6, 16], ['hominy', 10, 14], ['potato', 2, 12], ['mint', 3, 12]], { minD: 8 }),
    // チュペ・デ・アバス（そら豆のチャウダー）: そら豆・じゃがいも・米・卵・エバミルク・チーズ
    pe_chupe_habas: S('#e8dcaa', [['fava', 14, 14], ['potato', 3, 12], ['eggPoached', 1, 18], ['queso', 3, 12]], { minD: 8 }),
    // インチカピ（アマゾンの鶏とピーナッツのスープ）: 鶏・ピーナッツ・ユカ・とうもろこし粉・香菜
    pe_inchicapi: S('#e8c890', [['chicken', 4, 15], ['cassava', 3, 13], ['peanut', 8, 13]], { minD: 9, flecks: [cil(14)] }),
    // スタンシア（牛肉のだしと麺）: 牛すね・細麺・じゃがいも・にんじん・セロリ・ポロねぎ
    pe_sustancia: S('#d8b070', [['beef', 3, 14], ['noodleBit', 8, 15], ['yellowPotato', 2, 13], ['carrot', 3, 11], ['leek', 3, 11]], { minD: 9 }),
    // アスパラガスのクリームスープ、粉チーズ（お好みで）
    pe_crema_esparragos: S('#b8c870', [['asparagusTip', 4, 14]], { top: [['asparagusTip', 5, 16]], minD: 12, cream: '#fbf6e8', ing: { ...ing, asparagusTip: (p, x, y, s, r) => W.asparagus(p, x, y, s * 1.4, r) } }),
    // カルド・ベルデ（香草のスープとじゃがいもと卵）: じゃがいも・卵・チーズ・パセリ・香菜・ミント
    pe_caldo_verde: S('#6a9a3a', [['potato', 4, 14], ['eggPoached', 2, 18], ['queso', 3, 13]], { minD: 12, flecks: [cil(16)] }),
    // フチフ（ペルー中華の鶏そばと卵）: 鶏・中華麺・卵・青ねぎ・生姜、チンゲン菜（お好みで）
    pe_fuchifu: S('#f0d090', [['noodleBit', 10, 16], ['chicken', 3, 13], ['eggRibbon', 4, 14], ['pakchoi', 2, 12]], { minD: 9, flecks: [['#4a9a2c', 14, 1.6]] }),
    // アンデスの羊のスープ: 羊・じゃがいも・にんじん・青ねぎ・ミント、米・キャベツ（お好みで）
    pe_caldo_cordero: S('#e8d0a0', [['lamb', 4, 15], ['potato', 3, 13], ['carrot', 3, 11], ['mint', 3, 12]], { minD: 10, flecks: [['#4a9a2c', 12, 1.6]] }),
    // ディエタ・デ・ポジョ（やさしい鶏と野菜のスープ）: 鶏・じゃがいも・にんじん・かぼちゃ・セロリ・生姜
    pe_dieta_pollo: S('#f0e0b0', [['chicken', 3, 14], ['potato', 3, 12], ['carrot', 3, 11], ['pumpkin', 3, 12], ['celery', 3, 11]], { minD: 10 }),
    // ラワ・デ・チョクロ（とうもろこしとチーズのスープ）: とうもろこし・じゃがいも・チーズ
    pe_lawa_choclo: S('#f2e0a0', [['choclo', 16, 14], ['potato', 3, 12], ['queso', 4, 12]], { minD: 7, flecks: [cil(8)] }),
};
