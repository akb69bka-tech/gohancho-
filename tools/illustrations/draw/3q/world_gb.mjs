// イギリス（gb_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: ふだんの皿は金の縁（#c8a050。主食の gb_staple にそろえる）の白い平皿、汁物は金の線のスープ皿（深皿）、
// パイ・グラタン（fish pie・cauliflower cheese・shepherd's pie・hotpot）は生成りの陶器の耐熱皿、付け合わせは白い小鉢。
// 肉料理には茶色のグレイビーのたまりを描く。材料は gohancho/packs/gb.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, T: TR } = W;

const GOLD = '#c8a050';
const plate = (p, o = {}) => Q.plate(p, { line: 'none', edge: GOLD, ...o });
const soupPlate = (p, o = {}) => Q.fukazara(p, { line: GOLD, ...o });
const small = (p, o = {}) => W.sideBowl(p, { edge: GOLD, ...o });
const PARS = ['#3f8a2a', '#5aa83a'], GRAVY = '#6a3418';
const lemon = (p, x, y, s = 14) => W.lemon(p, x, y, s, { wedge: true });
const mash = (p, x, y, rx, H = 18, seed = 'm') => W.mound(p, x, y, rx, H, '#f6ecc8', seed, SYF) + W.flecks(p, x, y - H * .6, rx * .7, 10, seed + 'f', ['#e8d8a8'], { ry: rx * .25, s: 2.4 });
const ing = {
    sausage: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * 1.1, s * .32, s * .32, '#a8602e', p.id + 'sg' + i, { rot: r, sear: '#6a3014', jit: .03 }),
    fishcake: (p, x, y, s, r, i) => Q.prism(p, x, y, Array.from({ length: 14 }, (_, k) => { const a = k / 14 * 6.283; return [Math.cos(a) * s * .55, Math.sin(a) * s * .55]; }), s * .4, '#b8742a', { line: .5, top: Q.rg(p, [[0, '#f6d090'], [.6, '#d8a050'], [1, '#a8702a']], .4, .35, .8) }) + W.flecks(p, x, y - s * .4, s * .4, 10, 'fc' + i, ['#f6dca0', '#a8641e'], { ry: s * .2, s: 1.2 }),
    chickenTikka: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e88a4a', soak: '#b8401e', k: .5, sy: .72 }),
    beefStew: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#8a4a24', soak: '#5a2410', k: .5, sy: .72 }),
    dumpling: (p, x, y, s, r, i) => W.ball(p, x, y - s * .25, s, '#f2e0b0', p.id + 'dm' + i, { hi: .6, edge: '#c8a868' }),
    chipsGb: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .7, -s * .16], [s * .7, -s * .16], [s * .7, s * .16], [-s * .7, s * .16]], s * .3, '#e0a848', { rot: r, line: .4, top: Q.lg(p, [[0, '#fff2c0'], [1, '#f0c050']], 0, 0, 0, 1) }),
    swede: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s, '#e8a840', p.id + 'sw' + i, { h: s * .5, liq, top: Q.rg(p, [[0, '#ffe8a0'], [1, '#f0c060']], .4, .35, .8) }),
    parsnip: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -s * .22], [s * .8, -s * .1], [s * .8, s * .1], [-s * .8, s * .22]], 4, '#c8963a', { rot: r, line: .45, top: Q.lg(p, [[0, '#fbe8b0'], [.5, '#e8c070'], [1, '#c08a3a']], 0, 0, 0, 1) }),
    carrotStick: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -s * .2], [s * .8, -s * .1], [s * .8, s * .1], [-s * .8, s * .2]], 4, '#d8641e', { rot: r, line: .45, top: Q.lg(p, [[0, '#ffb070'], [.5, '#f08a3a'], [1, '#c8581e']], 0, 0, 0, 1) }),
    sprout: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s * .9, '#6a9a3a', p.id + 'sp' + i, { hi: .5, edge: '#3f6a22' }) + `<path d="M${f(x - s * .3)},${f(y - s * .3)} q${f(s * .3)},${f(-s * .2)} ${f(s * .6)},0" stroke="#a8c870" stroke-width="1" fill="none"/>`,
    lardon: (p, x, y, s, r, i) => W.baconBit(p, x, y, s * .55, i),
    redCab: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#7a2a5a' : '#9a3a6a', { rot: r, line: .3 }),
    whiteCab: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#f2f2dc' : '#e0ecc0', { rot: r, line: .3 }),
    savoy: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.3, r, i % 2 ? '#6a9a3a' : '#8ab858', 'sv' + p.id + i, { wave: 3.4 }),
    runner: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -1.6], [s * .8, -1.6], [s * .8, 1.6], [-s * .8, 1.6]], 2.4, '#4a8a2a', { rot: r, line: .4 }),
    onionRing: (p, x, y, s, r) => `<g ${TR(x, y, r)}><ellipse rx="${f(s * .55)}" ry="${f(s * .4)}" fill="none" stroke="#a8702a" stroke-width="${f(s * .26)}"/><ellipse rx="${f(s * .55)}" ry="${f(s * .4)}" fill="none" stroke="#f0c060" stroke-width="${f(s * .16)}" transform="translate(-.4 -.6)"/></g>`,
    yorkshire: (p, x, y, s, r, i) => `<path d="${Q.blob(x, y, s * .6, s * .4, 'yk' + p.id + i, { n: 12, jit: .18 })}" fill="${Q.rg(p, [[0, '#f8dc90'], [.6, '#d8a048'], [1, '#a8702a']], .4, .35, .8)}" stroke="#8a5a1e" stroke-width=".6"/><ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(s * .3)}" ry="${f(s * .16)}" fill="#c88a3a"/>`,
    apple: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#c8281e', p.id + 'ap' + i, { h: s * .45, top: Q.rg(p, [[0, '#fffbe8'], [1, '#f2e6c0']], .4, .35, .8) }),
    walnut: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .36, s * .28, '#a8743a', p.id + 'wn' + i, { n: 10, jit: .4, hi: .3 }),
    cornedBeef: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#b8584a', p.id + 'cb' + i, { h: s * .4, top: Q.rg(p, [[0, '#e8a090'], [1, '#b8584a']], .4, .35, .8) }),
    lambChop: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="M${f(-s * .6)},0 C${f(-s * .6)},${f(-s * .5)} ${f(s * .2)},${f(-s * .5)} ${f(s * .25)},0 C${f(s * .2)},${f(s * .4)} ${f(-s * .6)},${f(s * .45)} ${f(-s * .6)},0Z" fill="${Q.rg(p, [[0, '#c8784a'], [.6, '#8a4a24'], [1, '#5a2a14']], .4, .35, .8)}" stroke="#4a1e0a" stroke-width=".6"/><path d="M${f(s * .2)},0 L${f(s * .9)},${f(-s * .1)}" stroke="#f6ecd8" stroke-width="${f(s * .14)}" stroke-linecap="round"/></g>`,
    prune: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .3)}" ry="${f(s * .22)}" fill="#3a1e1e"/>`,
    haddock: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .5, s * .32, '#f2e4b8', p.id + 'hd' + i, { n: 10, jit: .2, hi: .6, edge: '#c8b080' }),
    bean: (p, x, y, s, r) => Q.bean(p, x, y, s * .55, r, '#e8902a'),
    gammon: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .9, s * .55, 5, '#e8a090', p.id + 'gm' + i, { rot: r, sear: '#c8705a', edgeC: '#fbf0e4' }),
    pineappleRing: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .55)}" ry="${f(s * .55 * SYF)}" fill="${Q.rg(p, [[0, '#fff2a0'], [1, '#f0c040']], .4, .35, .8)}" stroke="#c8962a" stroke-width=".6"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .16)}" ry="${f(s * .16 * SYF)}" fill="#f6f2e6"/>`,
    stilton: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .6, '#e8dcb8', p.id + 'st' + i, { h: s * .35, liq, top: Q.rg(p, [[0, '#fbf6e4'], [1, '#e8dcb8']], .4, .35, .8) }),
    barley: (p, x, y) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.6" fill="#efe2c0" stroke="#c8b080" stroke-width=".3"/>`,
    oxtail: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#5a2a14', { h: 6, top: Q.rg(p, [[0, '#f2dcc0'], [.3, '#c89070'], [.5, '#8a4a2a'], [1, '#5a2a14']], .4, .35, .8) }),
    crouton: (p, x, y, s, r, i) => W.dice(p, x, y, s * .6, '#c8862e', p.id + 'cr' + i, { h: s * .45, top: Q.rg(p, [[0, '#f6d890'], [1, '#d8a050']], .4, .35, .8) }),
    egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    eggFried: (p, x, y, s, r, i) => W.friedEgg(p, x, y, s * 2.2, i),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(plate, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(soupPlate, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}) => M(soupPlate, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}) => M(small, 'bowl', null, items, { minD: 7, ...o });
const pars = (n = 12) => [PARS[0], n, 1.6];
const dish = (o) => p => W.bake(p, { base: '#e8dcc0', inner: '#f6efe2', ...o });
// パイ皿（生成りの陶器に、こんがりした生地のふた）
const pie = (p, { fill = '#7a3a1a', dots = [], leaves = false } = {}) => W.bake(p, { base: '#e8dcc0', inner: '#f6efe2', c: '#e0a848', fl: ['#c8862e'], n: 10, dome: { leaves }, scoop: { u0: 22, v0: 6, hf: 32, layers: [['#d8963a', .22], [fill, .78]], dots } });
// 肉とマッシュとグレイビーの皿
const roastPlate = (meat, { veg = [], gravy = true } = {}) => p => { const D = plate(p), o = D.o; return D.s + W.grow(o.cx, o.cy, 1.3, (gravy ? W.pool(p, ...at(o, -10, 8), 40, GRAVY, 'gv') : '') + meat(p, o) + byDepth(veg.map(([k, u, v, s, r], i) => { const [x, y] = at(o, u * .9, v * .85, 4); return [y, () => (ing[k] || W.ING[k])(p, x, y, s, r ?? i * 40, i)]; }))); };

export default {
    // ---------- 主菜 ----------
    // シェパーズパイ（羊ひき肉にマッシュポテトをのせて焼く）、チェダー（お好みで）
    gb_shepherdspie: dish({ /*fx*/blister: 8, scoop: { layers: [['#e8c070', .12], ['#f6e4b0', .38], ['#7a3a1a', .5]], dots: [['#6a9a3a', 5, 1.8], ['#e8742a', 5, 1.8]] }, /*xf*/ c: '#f2d890', fl: ['#d8902a', '#c8782a', '#fbe8b0', '#a8601e'], n: 120, top: (o) => [-40, -20, 0, 20, 40].map(u => `<path d="M${f(o.cx + u - 6)},${f(o.cy - 40)} q4,40 0,80" stroke="#e0b060" stroke-width="2" fill="none" opacity=".6"/>`).join('') }),
    // バンガーズ・アンド・マッシュ（ソーセージとマッシュと玉ねぎのグレイビー）、グリンピース（お好みで）
    gb_bangers: roastPlate((p, o) => mash(p, ...at(o, -20, 0, 2), 36, 18) + byDepth([[14, -12, -20], [20, 2, -14], [10, 14, -24]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 18); return [y, () => ing.sausage(p, x, y, 28, r, i)]; })) + W.flecks(p, ...at(o, 0, 10, 10), 30, 16, 'bo', ['#c8864a', '#a8641e'], { ry: 10, s: 2.2 }), { veg: [['pea', 44, 32, 13], ['pea', 50, 26, 13], ['pea', 38, 38, 13], ['pea', 46, 40, 13]] }),
    // フィッシュケーキ、レモン
    gb_fishcakes: P([['fishcake', 3, 34]], { minD: 34, H: 8, after: (o, D, p) => lemon(p, ...at(o, 50, 32), 15) + W.ING.lettuce(p, ...at(o, -48, 30), 14, 10, 1) }),
    // チキン・ティッカ・マサラ（鶏・トマト・ヨーグルト・クリーム）とバスマティライス
    gb_tikkamasala: p => { const D = plate(p), o = D.o; return D.s + W.riceMound(p, ...at(o, 38, -12), 30, 22, { sy: SYF }) + W.pool(p, ...at(o, -18, 8), 46, '#d8702a', 'tk') + byDepth(W.spots('tkc', 8, 30, 14).map(([u, v, r], i) => { const [x, y] = at(o, u - 18, v + 8, 6); return [y, () => ing.chickenTikka(p, x, y, 18, r, i)]; })) + Q.swirl(...at(o, -18, 8), 16, { c: '#fbf2e0', w: 2 }) + W.flecks(p, ...at(o, -18, 4), 30, 10, 'tkh', PARS, { ry: 10, s: 1.6 }); },
    // ビーフシチューとダンプリング: 牛肉・玉ねぎ・にんじん
    gb_stew: B('#6a2e14', [['beefStew', 6, 18], ['carrot', 4, 13], ['dumpling', 3, 24]]),
    // ジャケットポテト（皮ごと焼いたじゃがいも）にベイクドビーンズとチェダー
    gb_jacket: p => { const D = plate(p), o = D.o, [x, y] = at(o, -4, 0, 4); return D.s + W.grow(x, y, 1.3, `<path d="${Q.blob(x, y, 48, 28, 'jp', { n: 14, jit: .06 })}" fill="${Q.rg(p, [[0, '#c8945a'], [.6, '#a8703a'], [1, '#6a4220']], .4, .35, .8)}" stroke="#5a3418" stroke-width=".8"/><path d="${Q.blob(x, y - 6, 36, 18, 'jpi', { n: 12, jit: .1 })}" fill="#f6e8b8"/>` + W.mound(p, x, y - 10, 30, 8, '#d8601e', 'jb', SYF) + byDepth(W.spots('jbb', 18, 26, 5).map(([u, v, r]) => [y - 14 + v * .3, () => ing.bean(p, x + u, y - 14 + v * .3, 12, r)])) + W.cheese(p, x, y - 20, 22, 30, 'jc', { c: '#f2b030' }) + W.butterPat(p, x - 30, y - 6, 8)); },
    // ローストチキンとグレイビー: 鶏・レモン・玉ねぎ・にんじん
    gb_roastchicken: roastPlate((p, o) => byDepth([[-16, -6, -20], [6, 6, 10]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 6); return [y, () => W.drumstick(p, x, y, 36, r, i, { c: '#c8822e', fried: false })]; })), { veg: [['carrotStick', 40, 24, 16, -10], ['carrotStick', 46, 14, 16, 10], ['potatoRoast', 32, 36, 15], ['lemon', -46, 30, 16, 0]] }),
    // ローストビーフとグレイビー: 牛肉・玉ねぎ・にんじん
    gb_roastbeef: roastPlate((p, o) => byDepth([-20, -6, 8].map((v, i) => { const [x, y] = at(o, -12 + i * 4, v, 4); return [y, () => Q.slice3q(p, x, y, 42, -14, { c: '#c8604a', fat: '#7a3a1e', seed: i, gloss: .6, char: false }, { sq: .5 })]; })), { veg: [['carrotStick', 40, 24, 16, -10], ['carrotStick', 46, 12, 16, 10], ['potatoRoast', 32, 36, 15], ['yorkshire', -40, 34, 26]] }),
    // トード・イン・ザ・ホール（ソーセージのヨークシャープディング焼き）
    gb_toadinhole: dish({ c: '#e8b058', fl: ['#f6d890', '#c8862e', '#a8641e'], n: 40, top: (o, V, pp) => byDepth([[-44, -12], [-14, -16], [16, -12], [46, -16], [-30, 16], [0, 14], [30, 18]].map(([u, v], i) => { const [x, y] = at(o, u, v * .7, 4); return [y, () => ing.sausage(pp, x, y, 26, -10, i)]; })) }),
    // フィッシュパイ（白身魚・燻製ハドック・マッシュポテト）、えび・卵・チェダー（お好みで）
    gb_fishpie: dish({ /*fx*/blister: 8, scoop: { layers: [['#e8c070', .12], ['#f6e4b0', .38], ['#f6f0e0', .5]], dots: [['#fbf6ee', 5, 4], ['#f0a080', 4, 3], ['#e8d090', 3, 3.4]] }, /*xf*/ c: '#f2d890', fl: ['#d8902a', '#c8782a', '#fbe8b0', '#a8601e'], n: 140 }),
    // チキンとポロねぎのパイ
    gb_chickenpie: p => pie(p, { fill: '#f2e4c0', dots: [['#fbf2e0', 6, 4], ['#a8c870', 5, 2.6], ['#c8a878', 3, 3]], leaves: true }),
    // ランカシャー・ホットポット（羊と野菜の煮込みに薄切りじゃがいもを重ねて焼く）
    gb_hotpot: dish({ /*fx*/scoop: { layers: [['#c8862e', .2], ['#7a3a1a', .8]], dots: [['#a8643a', 5, 4], ['#e8742a', 4, 2.4], ['#f2e0a0', 3, 3.4]] }, /*xf*/ base: '#8a5a3a', inner: '#a8784a', c: '#e8c070', fl: ['#c8862e', '#a8641e'], n: 30, top: (o, V, pp) => byDepth(Array.from({ length: 18 }, (_, i) => { const u = -60 + (i % 6) * 24, v = -30 + Math.floor(i / 6) * 28; const [x, y] = at(o, u, v * .6, 2); return [y, () => W.coin(pp, x, y, 16, '#c8862e', { h: 2, sy: .5, top: Q.rg(pp, [[0, '#fbe0a0'], [.6, '#e8b058'], [1, '#a8641e']], .4, .35, .8) })]; })) }),
    // ポークチョップとアップルソース、新じゃが（お好みで）
    gb_porkchops: roastPlate((p, o) => byDepth([[-16, -4, -10], [16, 8, 14]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.cutSlab(p, x, y, 32, 20, 7, '#c8864a', 'pc' + i, { rot: r, sear: '#8a4a1e', edgeC: '#f2e0c0' })]; })) + W.mound(p, ...at(o, 42, -18, 4), 14, 6, '#f2e0a0', 'as', SYF), { gravy: false, veg: [['potatoBoiled', -40, 30, 15], ['potatoBoiled', -26, 36, 15]] }),
    // ガモン・ステーキと目玉焼きとパイナップル、グリンピース（お好みで）
    gb_gammon: p => { const D = plate(p), o = D.o; return D.s + W.grow(o.cx, o.cy, 1.25, ing.gammon(p, ...at(o, -10, 0, 4), 44, -8, 1) + W.friedEgg(p, ...at(o, -14, -4, 8), 40, 1) + ing.pineappleRing(p, ...at(o, 36, -18, 4), 26) + byDepth(W.spots('gp', 10, 14, 6).map(([u, v]) => { const [x, y] = at(o, 40 + u, 24 + v, 4); return [y, () => W.ING.pea(p, x, y, 13)]; }))); },
    // ラムチョップのミントソース、新じゃが（お好みで）
    gb_lambchops: roastPlate((p, o) => byDepth([[-24, -8, -20], [-4, 0, -10], [16, 8, 0]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => ing.lambChop(p, x, y, 50, r, i)]; })), { gravy: false, veg: [['potatoBoiled', 40, 28, 15], ['potatoBoiled', 48, 16, 15], ['mint', -44, 30, 14]] }),
    // チリ・コン・カルネとご飯: ひき肉・赤いんげん豆・トマト・玉ねぎ・赤ピーマン
    gb_chilli: p => { const D = plate(p), o = D.o; return D.s + W.riceMound(p, ...at(o, 36, -12), 30, 22, { sy: SYF }) + W.mound(p, ...at(o, -18, 8), 42, 12, '#9a3a1e', 'ch', SYF) + byDepth(W.spots('chb', 16, 34, 8).map(([u, v, r], i) => { const [x, y] = at(o, u - 18, v + 8, 12); return [y, () => i % 3 ? W.ING.kidney(p, x, y, 13, r) : W.ING.pepperR(p, x, y, 10, r)]; })) + W.flecks(p, ...at(o, -18, 4, 12), 30, 30, 'chm', ['#7a3a1e', '#5a2410'], { ry: 10, s: 2 }); },
    // コンビーフ・ハッシュ: コンビーフ・じゃがいも・玉ねぎ、目玉焼き（お好みで）
    gb_cornedbeefhash: P([['cornedBeef', 14, 15], ['potato', 12, 14], ['onion', 4, 12]], { after: (o, D, p) => W.friedEgg(p, o.cx, o.cy - 24, 40, 1) }),
    // ステーキとエールのパイ
    gb_steakpie: p => pie(p, { fill: '#5a2410', dots: [['#8a4a24', 7, 4.4], ['#a8846a', 3, 3]] }),
    // ミンス・アンド・タティーズ（ひき肉の煮込みとじゃがいも）: ひき肉・玉ねぎ・にんじん、グリンピース（お好みで）
    gb_minceandtatties: p => { const D = plate(p), o = D.o; return D.s + mash(p, ...at(o, 32, -12, 2), 30, 18) + W.mound(p, ...at(o, -18, 8), 42, 12, '#6a3418', 'mt', SYF) + byDepth(W.spots('mtv', 14, 32, 8).map(([u, v, r], i) => { const [x, y] = at(o, u - 18, v + 8, 12); return [y, () => i % 2 ? W.ING.carrot(p, x, y, 12, r) : W.ING.pea(p, x, y, 12)]; })) + W.flecks(p, ...at(o, -18, 4, 12), 30, 30, 'mtm', ['#7a3a1e', '#5a2410'], { ry: 10, s: 2 }); },
    // ウェルシュ・レアビット（チーズトースト）
    gb_rarebit: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-22, -8, -8], [20, 8, 6]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.bread(p, x, y, 66, r, { c: '#e8a840', crust: '#a8641e', toast: .6 }) + W.flecks(p, x, y - 4, 24, 16, 'rb' + i, ['#a8601e', '#c8782a', '#fff2c0'], { ry: 10, s: 2 })]; })); },
    // ベーコンと卵のパイ
    gb_baconeggpie: p => pie(p, { fill: '#f6d870', dots: [['#c8604a', 7, 3.4], ['#fbf6e8', 3, 4], ['#6a9a3a', 4, 1.8]] }),
    // グラモーガン・ソーセージ（チーズとポロねぎ）
    gb_glamorgan: P([['glam', 5, 24]], { minD: 20, H: 10, ing: { ...ing, glam: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .9, s * .34, s * .34, '#d8a050', p.id + 'gl' + i, { rot: r, sear: '#a8702a', jit: .05 }) }, after: (o, D, p) => W.ING.lettuce(p, ...at(o, 46, 30), 14, 0, 1) }),
    // スパイシー・ビーンバーガー: 豆のパテ・バンズ、レタス・トマト（お好みで）
    gb_beanburgers: p => { const D = plate(p), o = D.o, [x, y] = at(o, -6, 4, 4); return D.s + W.bunBottom(p, x, y + 4, 40, 8) + W.lettuceRuffle(p, x, y, 42, 'bb') + W.pattyDisc(p, x, y - 4, 38, 9, '#8a4a24') + W.coin(p, x, y - 10, 30, '#c8281a', { h: 2, top: Q.rg(p, [[0, '#ff8a6a'], [1, '#e0402a']], .4, .35, .8) }) + W.bunTop(p, x, y - 14, 40, 24); },
    // ポリッジ（オートミールのおかゆ）とはちみつとバナナ、りんご（お好みで）
    gb_porridge: M((p) => Q.shiroBowl(p, { rim: GOLD, line: 'none' }), 'soup', '#f2e6c8', [['bananaSlice', 6, 14]], { porr: { c: '#efe0b8', n: 150 }, minD: 12, ing: { ...ing, bananaSlice: (p, x, y, s) => W.coin(p, x, y, s * .45, '#e8d8a0', { h: 2, top: Q.rg(p, [[0, '#fffbe0'], [1, '#f2e6b0']], .4, .35, .8) }) }, after: (S, V, p) => W.drizzle([[S.cx - 30, S.cy + 4], [S.cx - 10, S.cy - 2], [S.cx + 10, S.cy + 4], [S.cx + 30, S.cy - 2]], '#e8a830', 2.4) }),
    // ビーンズ・オン・トースト、チェダー（お好みで）
    gb_beansontoast: p => { const D = plate(p), o = D.o, [x, y] = at(o, -4, 0, 4); return D.s + W.bread(p, x, y, 80, -8, { c: '#e8b058', crust: '#a8641e', toast: .5 }) + W.mound(p, x, y - 6, 34, 8, '#d8601e', 'bt', SYF) + byDepth(W.spots('btb', 22, 30, 5).map(([u, v, r]) => [y - 10 + v * .3, () => ing.bean(p, x + u, y - 10 + v * .3, 12, r)])) + W.cheese(p, x, y - 14, 22, 24, 'btc', { c: '#f2b030' }); },

    // ---------- ご飯・麺 ----------
    // スパゲッティ・ボロネーゼ: 牛ひき肉・トマト・玉ねぎ・にんじん、マッシュルーム・パルメザン（お好みで）
    gb_spagbol: p => { const D = plate(p), o = D.o; return D.s + W.noodleMound(p, 100, 104, 52, 16, '#f0d080', 'sb', { w: 2.4, n: 150, len: 34, sy: SYF, edge: '#c8a050' }) + W.mound(p, 100, 94, 34, 12, '#a8401e', 'sbs', SYF) + W.flecks(p, 100, 86, 26, 40, 'sbm', ['#7a2e14', '#5a2410', '#e8742a'], { ry: 10, s: 2 }) + W.flecks(p, 100, 84, 22, 20, 'sbc', ['#fbf6e0'], { ry: 8, s: 1.4 }) + W.ING.herb(p, 104, 80, 12, 20, 1); },
    // ケジャリー（燻製ハドックとカレーのご飯）: 卵・玉ねぎ・パセリ
    gb_kedgeree: P([['haddock', 8, 16], ['egg', 3, 16]], { rice: { cols: ['#f2d070', '#e8c050', '#f8e090'], edge: '#b8902a' }, H: 22, R: 50, flecks: [pars(16)] }),
    // マカロニ・チーズ、トマト（お好みで）
    gb_macaroni: dish({ /*fx*/blister: 10, scoop: { layers: [['#d8902a', .15], ['#f2c860', .85]], dots: [['#fbe8a0', 14, 3]] }, /*xf*/ c: '#f2c860', fl: ['#d8902a', '#c8782a', '#fff0b0', '#a8601e'], n: 110, top: (o, V, pp) => [[-30, -10], [10, -16], [36, 6]].map(([u, v]) => W.coin(pp, ...at(o, u, v * .6, 2), 12, '#c8281a', { h: 2, sy: .5, top: Q.rg(pp, [[0, '#ff8a6a'], [1, '#d8402a']], .4, .35, .8) })).join('') }),
    // ツナとコーンのパスタベイク
    gb_tunabake: dish({ /*fx*/blister: 8, scoop: { layers: [['#d8902a', .15], ['#f2c860', .85]], dots: [['#fbe8a0', 10, 3], ['#c8a888', 4, 3], ['#f6d040', 5, 1.8]] }, /*xf*/ c: '#f2c860', fl: ['#d8902a', '#c8782a', '#fff0b0', '#f6d040', '#a8601e'], n: 130 }),

    // ---------- 副菜 ----------
    // ミントのグリンピース
    gb_peas: K([['pea', 40, 14], ['mint', 2, 12]], { minD: 5, base: '#7aa040', after: (o, V, p) => W.butterPat(p, o.cx, o.cy - 26, 8) }),
    // カリフラワー・チーズ
    gb_cauliflowercheese: dish({ /*fx*/blister: 10, scoop: { layers: [['#e8b048', .2], ['#f6eedc', .8]], dots: [['#fbf6e4', 5, 5], ['#e8e0c0', 4, 4]] }, /*xf*/ c: '#f6d890', fl: ['#d8902a', '#c8782a', '#fff2c0', '#a8601e'], n: 90, top: (o, V, pp) => byDepth(W.spots('cc', 8, 56, 26, { ry: 36 }).map(([u, v], i) => { const [x, y] = at(o, u, v * .6, 2); return [y, () => `<path d="${Q.blob(x, y, 14, 9, 'ccb' + i, { n: 10, jit: .25 })}" fill="${Q.rg(pp, [[0, '#fff6d8'], [1, '#e8c070']], .4, .35, .8)}" opacity=".9"/>`]; })) }),
    // オーブンで焼いたチップス
    gb_chips: P([['chipsGb', 20, 22]], { minD: 9, H: 16 }),
    // コールスロー: キャベツ・にんじん・マヨネーズ、赤玉ねぎ（お好みで）
    gb_coleslaw: K([['whiteCab', 40, 14], ['carrotStickThin', 12, 12], ['redOnion', 3, 10]], { minD: 5, base: '#f6f0dc', ing: { ...ing, carrotStickThin: (p, x, y, s, r) => W.ING.carrotStick(p, x, y, s, r) } }),
    // にんじんとスウィードのマッシュ
    gb_carrotswede: K([], { base: '#f0a040', H: 20, after: (o, V, p) => W.butterPat(p, o.cx, o.cy - 28, 9) + W.flecks(p, o.cx, o.cy - 22, 24, 10, 'cs', ['#d8802a'], { ry: 8, s: 2 }) }),
    // バターのキャベツ、ベーコン（お好みで）
    gb_cabbage: P([['savoy', 16, 16], ['lardon', 5, 12]]),
    // サイドサラダ: レタス・きゅうり・トマト、青ねぎ（お好みで）
    gb_salad: P([['lettuce', 10, 16], ['cucumber', 6, 13], ['cherryTomato', 5, 13]]),
    // ローストポテト
    gb_roastpotatoes: P([['potatoRoast', 12, 20]], { minD: 14, H: 14 }),
    // ヨークシャー・プディング
    gb_yorkshire: P([['yorkshire', 4, 34]], { minD: 30, H: 6 }),
    // はちみつのパースニップのロースト
    gb_parsnips: P([['parsnip', 12, 22]], { minD: 12, H: 12, flecks: [['#e8a830', 12, 1.6]] }),
    // 芽キャベツとベーコン
    gb_sprouts: P([['sprout', 16, 18], ['lardon', 6, 13]], { minD: 10 }),
    // 赤キャベツの蒸し煮: 赤キャベツ・りんご・赤玉ねぎ
    gb_redcabbage: K([['redCab', 44, 14], ['apple', 4, 12]], { minD: 5, base: '#7a2a5a' }),
    // チャンプ（青ねぎのマッシュ）
    gb_champ: K([], { base: '#f6ecc8', H: 22, flecks: [['#4a9a2c', 30, 1.8]], after: (o, V, p) => W.butterPat(p, o.cx, o.cy - 30, 10) }),
    // バブル・アンド・スクイーク（残りのじゃがいもとキャベツの焼きもの）
    gb_bubble: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-20, -6], [20, 8]].map(([u, v], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.jeon(p, x, y, 34, i, { c: '#d8a050', h: 6 }) + W.flecks(p, x, y - 4, 26, 20, 'bs' + i, ['#6a9a3a', '#f6e0a0', '#a8641e'], { ry: 10, s: 2 })]; })); },
    // マッシーピー（つぶしたえんどう豆）
    gb_mushypeas: K([], { base: '#7a9a3a', H: 16, flecks: [['#a8c060', 20, 2]] }),
    // さやいんげんのバター和え
    gb_runnerbeans: P([['runner', 22, 16]], { after: (o, D, p) => W.butterPat(p, o.cx, o.cy - 20, 8) }),
    // はちみつとバターのにんじん
    gb_carrots: P([['carrot', 22, 15]], { flecks: [pars(10)] }),
    // ポロねぎのホワイトソース、チェダー（お好みで）
    gb_leeks: dish({ c: '#f6eccc', fl: ['#e8d8a8', '#c8a868'], n: 40, top: (o, V, pp) => byDepth(W.spots('lk', 12, 60, 18, { ry: 34 }).map(([u, v], i) => { const [x, y] = at(o, u, v * .6, 2); return [y, () => W.ING.leek(pp, x, y, 18)]; })) }),
    // ビーツの酢漬け、赤玉ねぎ（お好みで）
    gb_beetroot: K([['beet', 18, 14], ['redOnion', 3, 10]]),
    // ウォルドーフサラダ: りんご・セロリ・くるみ・マヨネーズ、レタス（お好みで）
    gb_waldorf: K([['apple', 12, 14], ['celery', 8, 13], ['walnut', 8, 13]], { base: '#f6f0dc' }),
    // トマトと赤玉ねぎのサラダ
    gb_tomatosalad: P([['tomatoSlice', 8, 22], ['redOnion', 6, 14]], { minD: 14, H: 8, flecks: [['#4a9a2c', 20, 1.4]], ing: { ...ing, tomatoSlice: (p, x, y, s) => W.coin(p, x, y, s * .55, '#c8281a', { h: 3, top: Q.rg(p, [[0, '#ff9a7a'], [.5, '#e8503a'], [.85, '#f6c0a0'], [1, '#c8281a']], .4, .35, .8) }) } }),
    // クリームのほうれん草
    gb_spinach: K([], { base: '#4a7a2a', H: 14, flecks: [['#f6f0dc', 14, 2], ['#6a9a3a', 20, 2]] }),
    // 根菜のロースト: にんじん・パースニップ・スウィード・赤玉ねぎ、バターナッツ（お好みで）
    gb_rootveg: P([['carrotStick', 6, 18], ['parsnip', 5, 18], ['swede', 5, 14], ['redOnion', 4, 13], ['pumpkin', 3, 14]], { minD: 10 }),
    // ブロッコリーのにんにくとレモン
    gb_broccoli: P([['broccoli', 12, 15]], { minD: 12, after: (o, D, p) => lemon(p, ...at(o, 50, 32), 14) }),
    // にんにくのマッシュルーム
    gb_garlicmushrooms: P([['mushroom', 20, 16]], { sauce: '#c8a060', flecks: [pars(16)] }),
    // ビール衣のオニオンリング
    gb_onionrings: P([['onionRing', 12, 24]], { minD: 12, H: 14 }),
    // セージと玉ねぎのスタッフィング
    gb_stuffing: P([['stuffBall', 9, 22]], { minD: 16, H: 10, ing: { ...ing, stuffBall: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .5, s * .4, i, { c: '#b8782e', n: 16, h: 6, rot: r }) + W.flecks(p, x, y - 4, s * .3, 4, 'sf' + i, ['#5a7a3a'], { ry: s * .14, s: 1.2 }) } }),

    // ---------- 汁物 ----------
    // ポロねぎとじゃがいものスープ、クリーム（お好みで）
    gb_leekpotato: S('#ece4c0', [['leek', 6, 13]], { top: [['leek', 6, 15]], minD: 12, cream: '#fbf8ee' }),
    // にんじんとコリアンダーのスープ
    gb_carrotcoriander: S('#f0902a', [], { top: [['carrot', 6, 15], ['herb', 3, 14]], flecks: [pars(16)], cream: '#fbf6e8' }),
    // スコッチ・ブロス: 羊・大麦・にんじん・スウィード・ポロねぎ・玉ねぎ、キャベツ（お好みで）
    gb_scotchbroth: S('#e0c890', [['lamb', 4, 14], ['barley', 30, 12], ['carrot', 4, 11], ['swede', 3, 11], ['leek', 3, 11]], { minD: 6 }),
    // コッカ・リーキー（鶏とポロねぎのスープ）: 鶏・ポロねぎ・にんじん、プルーン（お好みで）
    gb_cockaleekie: S('#e8d8a0', [['chicken', 4, 14], ['leek', 6, 13], ['carrot', 3, 11], ['prune', 3, 14]], { minD: 9 }),
    // カレン・スキンク（燻製ハドックのスープ）: ハドック・じゃがいも・玉ねぎ・牛乳
    gb_cullenskink: S('#f2ecd4', [['haddock', 5, 16], ['potato', 4, 12]], { minD: 10, flecks: [pars(10)] }),
    // カウル（ウェールズの羊とポロねぎのスープ）: 羊・じゃがいも・にんじん・スウィード・ポロねぎ
    gb_cawl: S('#d8b878', [['lamb', 4, 15], ['potato', 3, 13], ['carrot', 3, 12], ['swede', 2, 12], ['leek', 4, 12]], { minD: 10 }),
    // えんどう豆とハムのスープ
    gb_peaham: S('#a8a840', [['ham', 8, 13]], { top: [['pea', 12, 15], ['ham', 3, 14]], minD: 10 }),
    // トマトのクリームスープ
    gb_tomato: S('#d8502a', [], { top: [['tomatoChunk', 4, 15], ['basil', 3, 14]], cream: '#fbf2e8' }),
    // マリガトーニー（カレー風味の鶏とレンズ豆のスープ）: 鶏・玉ねぎ・にんじん・りんご・レンズ豆、ご飯（お好みで）
    gb_mulligatawny: S('#d8902a', [['chicken', 4, 13], ['carrot', 4, 11], ['redLentil', 14, 12], ['rice', 14, 10]], { minD: 6 }),
    // ブロッコリーとスティルトンのスープ
    gb_brocstilton: S('#8aa850', [['stilton', 4, 14], ['broccoli', 2, 12]], { top: [['broccoli', 3, 15], ['stilton', 3, 14]], minD: 12 }),
    // バターナッツかぼちゃのロースト・スープ、クリーム（お好みで）
    gb_butternut: S('#f0a030', [], { top: [['pumpkin', 4, 15], ['pumpkinSeed', 6, 14]], cream: '#fbf6e8' }),
    // パースニップのカレースープ
    gb_parsnip: S('#ead098', [['crouton', 5, 13]], { top: [['parsnip', 4, 16]], minD: 12, flecks: [['#c8802a', 10, 1.4]] }),
    // 鶏と野菜のスープ: 鶏・にんじん・ポロねぎ・セロリ・じゃがいも、グリンピース（お好みで）
    gb_chickenveg: S('#ead8a0', [['chicken', 4, 13], ['carrot', 4, 11], ['leek', 3, 11], ['celery', 3, 11], ['potato', 3, 11], ['pea', 4, 12]], { minD: 8 }),
    // オックステール・スープ
    gb_oxtail: S('#6a3418', [['oxtail', 3, 22], ['carrot', 4, 12], ['celery', 3, 11]], { minD: 12 }),
    // スコットランドのレンズ豆のスープ、ベーコン（お好みで）
    gb_lentil: S('#e0902a', [['carrot', 5, 11], ['lardon', 4, 12]], { top: [['redLentil', 18, 16], ['carrot', 2, 13]], minD: 10 }),
    // クレソンのスープ
    gb_watercress: S('#5a8a2a', [['watercress', 3, 12]], { top: [['watercress', 6, 15]], minD: 12, cream: '#fbf6e8', ing: { ...ing, watercress: (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#3f8a2a', 'wc' + p.id + i, { wave: 1 }) } }),
    // マッシュルームのクリームスープ
    gb_mushroom: S('#c8a878', [['mushroom', 3, 12]], { top: [['mushroom', 5, 16]], minD: 12, cream: '#fbf6e8' }),
    // えんどう豆とミントのスープ、クレームフレッシュ（お好みで）
    gb_peamint: S('#8ab048', [['mint', 2, 13]], { top: [['pea', 12, 15], ['mint', 3, 14]], minD: 12, cream: '#fbf6e8' }),
    // セロリのクリームスープ
    gb_celery: S('#d8dca8', [['celery', 3, 11]], { top: [['celery', 5, 15], ['herb', 2, 13]], minD: 12, cream: '#fbf8ee' }),
    // 北アイルランドの野菜のブロス: 牛すね・大麦と豆・にんじん・ポロねぎ・玉ねぎ・パセリ
    gb_vegbroth: S('#d8b878', [['beef', 4, 13], ['barley', 24, 12], ['lentil', 10, 12], ['carrot', 4, 11], ['leek', 3, 11]], { minD: 6, flecks: [pars(10)] }),
    // カリフラワー・チーズのスープ
    gb_caulicheese: S('#f2e4b0', [['cauliflower', 2, 12]], { top: [['cauliflower', 3, 16]], minD: 14, flecks: [['#f2b030', 12, 1.4]] }),
    // 赤ピーマンとトマトのロースト・スープ
    gb_redpepper: S('#d8402a', [], { top: [['pepperRoast', 4, 18], ['tomatoChunk', 2, 14]], flecks: [['#f6e0c0', 6, 1.4], pars(6)] }),
};
