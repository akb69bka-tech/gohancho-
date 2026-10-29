// エジプト（eg_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: ふだんの皿は土色の縁（#a8723a。主食の eg_staple のパンかごにそろえる）の白い平皿、スープは土色の線の白い碗、
// 煮込み（バミヤ・ロビア・ガンバリ）は土色の縁の深皿、タゲン・トルリ・ロズ・メアンマルは素焼きのタゲン（浅い土鍋）、
// マカロナ・ベシャメルは素焼きの耐熱皿、ディップ（タヒーナ・ババガヌーグ・フムス）・フール・トルシは小鉢。
// 材料は gohancho/packs/eg.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, SY, T: TR } = W;

const EARTH = '#a8723a';
const tabaq = (p, o = {}) => Q.plate(p, { line: 'none', edge: EARTH, ...o });
const sahn = (p, o = {}) => Q.shiroBowl(p, { rim: EARTH, line: 'none', ...o });
const ghawit = (p, o = {}) => Q.fukazara(p, { line: EARTH, ...o });
const small = (p, o = {}) => W.sideBowl(p, { edge: EARTH, ...o });
const clay = (p, o = {}) => W.sideBowl(p, { outer: '#a8582e', inner: '#c87a4a', edge: '#e8b078', ...o });
const tagen = (p, o = {}) => W.bowl(p, { outer: '#a8582e', inner: '#c87a4a', edge: '#e8b078', h: 34, cy: 88, fx: 54, gloss: .5, ...o });
const PARS = ['#3f8a2a', '#5aa83a'], CORI = ['#4a9a2c', '#3f8a2a'], DILL = ['#5a9a3a', '#4a8a2a'];
const lemon = (p, x, y, s = 14) => W.lemon(p, x, y, s, { wedge: true });
const pars = (n = 14) => [PARS, n, 1.6];
const ing = {
    beefStew: (p, x, y, s, r, i, liq) => Q.soakLump(p, x, y, s, i, { c: '#a8502a', soak: '#6a2410', k: .5, sy: .72 }),
    beefBoiled: (p, x, y, s, r, i, liq) => Q.soakLump(p, x, y, s, i, { c: '#a87a5a', soak: '#6a4a2a', k: .4, sy: .72 }),
    chickenRoast: (p, x, y, s, r, i) => W.drumstick(p, x, y, s * 1.6, r, i, { c: '#c8822e', fried: false }),
    chickenBoiled: (p, x, y, s, r, i, liq) => Q.soakLump(p, x, y, s, i, { c: '#f0d8b0', soak: '#c8a070', k: .35, sy: .72 }),
    kofta: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .7, s * .3, s * .3, '#8a4a24', p.id + 'kf' + i, { rot: r, sear: '#5a2410', jit: .06 }),
    okra: (p, x, y, s, r, i, liq) => W.pod(p, x, y, s * 1.1, r, { c: '#4a8a2a', w: 5 }),
    zucchiniStuffed: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><rect x="${f(-s * .7)}" y="${f(-s * .24)}" width="${f(s * 1.4)}" height="${f(s * .48)}" rx="${f(s * .24)}" fill="${Q.lg(p, [[0, '#d8e0a0'], [.5, '#a8b868'], [1, '#6a7a3a']], 0, 0, 0, 1)}" stroke="#5a6a2a" stroke-width=".6"/><ellipse cx="${f(s * .68)}" cy="0" rx="${f(s * .12)}" ry="${f(s * .2)}" fill="#e8d8b0"/></g>`,
    taameya: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#6a7a2a', p.id + 'tm' + i, { hi: .4, edge: '#3a4a14' }) + W.flecks(p, x, y - s * .4, s * .3, 6, 'tmf' + i, ['#f2e0b0'], { ry: s * .2, s: 1.4 }),
    fava: (p, x, y, s, r) => Q.bean(p, x, y, s * .7, r, '#8a5a2a'),
    favaSprout: (p, x, y, s, r) => Q.bean(p, x, y, s * .7, r, '#c8a868') + `<path d="M${f(x + s * .2)},${f(y)} q3,-2 5,0" stroke="#f6f2d8" stroke-width="1.4" fill="none"/>`,
    blackEyed: (p, x, y, s, r) => Q.bean(p, x, y, s * .6, r, '#e8dcc0') + `<circle cx="${f(x)}" cy="${f(y - .4)}" r="1" fill="#3a2a22"/>`,
    orzo: (p, x, y) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.2" fill="#e8c070" stroke="#b8904a" stroke-width=".3"/>`,
    vermicelli: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .5)},0 Q0,-2 ${f(s * .5)},1" stroke="#c8903a" stroke-width="1.4" fill="none"/></g>`,
    freekeh: (p, x, y) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2" ry="1.4" fill="#8a8a3a" stroke="#5a5a1e" stroke-width=".3"/>`,
    trotter: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#c8a888', { h: 6, top: Q.rg(p, [[0, '#f6ece0'], [.5, '#e8d4c0'], [1, '#c8a888']], .4, .35, .8) }),
    molokhia: (p, x, y) => '',
    mallow: (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#3a6a22', 'ml' + p.id + i, { wave: 1.6 }),
    squidRing: (p, x, y, s, r) => `<g ${TR(x, y, r)}><ellipse rx="${f(s * .5)}" ry="${f(s * .34)}" fill="none" stroke="#f6ece0" stroke-width="${f(s * .2)}"/></g>`,
    liver: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .5, -1.8], [s * .5, -1.6], [s * .45, 1.8], [-s * .5, 1.6]], 2.4, '#6a2a1e', { rot: r, line: .35, top: Q.lg(p, [[0, '#9a4a3a'], [1, '#5a1e14']], 0, 0, 0, 1) }),
    sogo: (p, x, y, s, r, i) => W.sausageCoin(p, x, y, s * .42, { c: '#7a2a14', inner: '#b8503a' }),
    lambChop: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="M${f(-s * .6)},0 C${f(-s * .6)},${f(-s * .5)} ${f(s * .2)},${f(-s * .5)} ${f(s * .25)},0 C${f(s * .2)},${f(s * .4)} ${f(-s * .6)},${f(s * .45)} ${f(-s * .6)},0Z" fill="${Q.rg(p, [[0, '#c8784a'], [.6, '#8a4a24'], [1, '#5a2a14']], .4, .35, .8)}" stroke="#4a1e0a" stroke-width=".6"/><path d="M${f(s * .2)},0 L${f(s * .9)},${f(-s * .1)}" stroke="#f6ecd8" stroke-width="${f(s * .14)}" stroke-linecap="round"/></g>`,
    chickenSkewer: (p, x, y, s, r, i) => Q.lump(p, x, y - 2, s * .4, s * .32, '#e8b070', p.id + 'ts' + i, { n: 9, jit: .2, hi: .6, edge: '#a8641e' }),
    pickledEggplant: (p, x, y, s, r, i) => W.pod(p, x, y, s * 1.4, r, { c: '#4a2038', w: 9 }) + W.flecks(p, x, y - 2, s * .4, 6, 'pe' + i, ['#c8281a', '#4a8a2a'], { ry: 2, s: 1.6 }),
    whiteCheese: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#f6f2e6', p.id + 'wc' + i, { h: s * .45, top: Q.rg(p, [[0, '#ffffff'], [1, '#ece4d0']], .4, .35, .8) }),
    nut: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .26, s * .18, '#e8c890', p.id + 'nt' + i, { n: 8, jit: .2, hi: .6 }),
    egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    pastaShort: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .5, -s * .2], [s * .5, -s * .2], [s * .5, s * .2], [-s * .5, s * .2]], s * .3, '#e8c070', { rot: r, line: .4, top: Q.lg(p, [[0, '#fbe8b0'], [1, '#e0b060']], 0, 0, 0, 1) }),
    pastaRed: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .5, -s * .2], [s * .5, -s * .2], [s * .5, s * .2], [-s * .5, s * .2]], s * .3, '#d8602a', { rot: r, line: .4, top: Q.lg(p, [[0, '#f0905a'], [1, '#c8501e']], 0, 0, 0, 1) }),
    arnabeet: (p, x, y, s, r, i) => W.broc(p, x, y, s * 1.5, i, '#e0b060'),
    cherryTomato: (p, x, y, s) => W.tomatoBall(p, x, y - s * .3, s * .8),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(tabaq, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(sahn, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}, v = ghawit) => M(v, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}, v = small) => M(v, 'bowl', null, items, { minD: 7, ...o });
const withLemon = (o = {}) => ({ ...o, after: (S, V, p) => lemon(p, S.cx + 46, S.cy + 4, 13) });
const plateOf = (draw) => p => { const D = tabaq(p), o = D.o; return D.s + W.grow(o.cx, o.cy, 1.25, draw(p, o)); };
const side = (p, o, list) => byDepth(list.map(([k, u, v, s, r = 0], i) => { const [x, y] = at(o, u, v, 4); return [y, () => (ing[k] || W.ING[k])(p, x, y, s, r, i)]; }));
const oven = (o) => p => W.bake(p, { base: '#a8582e', inner: '#c87a4a', ...o });
// ディップの小鉢: 表面に油の輪とパセリ
const dip = (c, fl = [], o = {}) => K([], { base: c, H: 10, flecks: [['#c8b040', 10, 2], ...fl], ...o });
// 白いご飯（バスマティでなくエジプト米）の皿に、上に主のもの
const riceWith = (cols, draw, o = {}) => p => { const D = tabaq(p), oo = D.o; return D.s + W.friedRice(p, oo.cx, oo.cy + 4, 56, 24, p.id + 'rw', { cols, edge: o.edge ?? '#c8b090', sy: SYF }) + draw(p, oo); };

export default {
    // ---------- 主菜 ----------
    // 鶏とじゃがいものオーブン焼き: 鶏・じゃがいも・玉ねぎ・トマト・レモン、ピーマン（お好みで）
    eg_firakh: P([['chickenRoast', 4, 22], ['potatoRoast', 8, 15], ['tomato', 3, 12], ['onion', 3, 12]], { minD: 16, after: (o, D, p) => lemon(p, ...at(o, 50, 32), 14) }),
    // コフタのトレー焼き: コフタ・じゃがいも・トマト、ピーマン（お好みで）（素焼きの耐熱皿）
    eg_kofta: oven({ c: '#c8401e', fl: ['#a8301a'], n: 20, top: (o, V, pp) => byDepth(Array.from({ length: 12 }, (_, i) => { const u = -60 + (i % 6) * 24, v = -18 + Math.floor(i / 6) * 34; const [x, y] = at(o, u, v * .6, 4); return [y, () => [ing.kofta, W.ING.potatoRoast, ing.kofta, W.ING.tomato][i % 4](pp, x, y, i % 4 === 1 ? 16 : 24, -10, i)]; })) + W.flecks(pp, o.cx, o.cy - 6, 60, 20, 'kfp', PARS, { ry: 30, s: 1.6 }) }),
    // サマク・マクリ（ティラピアの丸揚げ）、レモン・パセリ（お好みで）
    eg_samak: p => W.fishOn(p, tabaq(p), { skin: '#a8682a', belly: '#d8a860', char: .5, on: (x, y) => lemon(p, x + 50, y + 24, 15) + lemon(p, x - 50, y + 22, 13) + W.flecks(p, x, y + 20, 30, 10, 'sm', PARS, { ry: 6, s: 1.6 }) }),
    // バミヤ（オクラと牛肉のトマト煮）
    eg_bamya: B('#b8401e', [['okra', 14, 14], ['beefStew', 4, 15]], { minD: 8 }),
    // マハシ（ズッキーニの米詰め）: ズッキーニ・米・トマト・玉ねぎ・パセリ・ディル
    eg_mahshi: B('#c8501e', [['zucchiniStuffed', 7, 26]], { minD: 14, flecks: [[DILL, 10, 1.2]] }),
    // ハワウシ（スパイスのひき肉を詰めて焼いたパン）
    eg_hawawshi: p => { const D = tabaq(p), o = D.o; return D.s + W.grow(o.cx, o.cy, 1.2, byDepth([[-22, -8, -10], [8, -12, 10], [-6, 10, -4], [24, 6, 20]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => `<g ${TR(x, y, r)}><path d="M-22,4 A22,14 0 0 1 22,4Z" fill="${Q.lg(p, [[0, '#e8b868'], [.6, '#c8863a'], [1, '#8a5a1e']], 0, 0, 0, 1)}" stroke="#7a4a1a" stroke-width=".6"/><path d="M-22,4 L22,4 L18,8 L-18,8Z" fill="#7a3a1e"/></g>`]; }))) + W.flecks(p, o.cx, o.cy, 50, 20, 'hw', ['#f2d0a0', '#8a5a2a'], { ry: 20, s: 1.4 }); },
    // メサアア（揚げなすのトマト煮）: なす・ピーマン・トマト・玉ねぎ
    eg_mesaqaa: B('#c8401e', [['eggplantFry', 8, 18], ['pepperG', 4, 13]], { ing: { ...ing, eggplantFry: (p, x, y, s, r, i) => W.coin(p, x, y, s * .55, '#4a2038', { h: 3, top: Q.rg(p, [[0, '#e8b070'], [.6, '#c8803a'], [1, '#8a4a1e']], .4, .35, .8) }) } }),
    // パネ（鶏のカツ）、レモン
    eg_pane: p => { const D = tabaq(p), o = D.o; return D.s + byDepth([[-16, -8, -10], [14, 10, 8]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => `<g ${TR(x, y, r)}><path d="${Q.blob(0, 0, 42, 22, 'pn' + i, { n: 12, jit: .1 })}" fill="${Q.rg(p, [[0, '#f0c070'], [.6, '#d8963a'], [1, '#a8641e']], .4, .35, .8)}" stroke="#8a5a1e" stroke-width=".8"/></g>` + W.flecks(p, x, y, 34, 30, 'pnf' + i, ['#f6d890', '#b8782a'], { ry: 14, s: 1.4 })]; })) + lemon(p, ...at(o, 50, 32), 15); },
    // カブダ・エスカンダラーニ（アレキサンドリアのレバー炒め）: レバー・ピーマン・青唐辛子・レモン
    eg_kebda: P([['liver', 22, 16], ['pepperG', 8, 13], ['chiliG', 4, 12]], { after: (o, D, p) => lemon(p, ...at(o, 50, 32), 14) }),
    // トルリ（牛肉と野菜のオーブン焼き）: 牛肉・じゃがいも・ズッキーニ・にんじん・ピーマン・トマト（素焼きのタゲン）
    eg_torly: B('#c8501e', [['beefStew', 4, 15], ['potato', 4, 14], ['zucchini', 4, 13], ['carrot', 4, 12], ['pea', 6, 12]], {}, tagen),
    // カバーブ・ハッラ（牛肉と玉ねぎの煮込み）
    eg_kababhalla: B('#7a3a1a', [['beefStew', 9, 19], ['onion', 6, 14]]),
    // ズッキーニとひき肉のベシャメル焼き（素焼きの耐熱皿）
    eg_kosabechamel: oven({ c: '#f2d890', fl: ['#d8902a', '#c8782a', '#fbe8b0', '#a8601e'], n: 110, top: (o, V, pp) => [[-40, -6], [0, -10], [40, -4]].map(([u, v]) => W.coin(pp, ...at(o, u, v * .6, 2), 12, '#6a8a3a', { h: 1.4, sy: .5, top: Q.rg(pp, [[0, '#e8f0c0'], [1, '#a8c070']], .4, .35, .8) })).join('') }),
    // シシ・タウーク（鶏の串焼き）: 鶏・ピーマン・玉ねぎ、ミニトマト（お好みで）
    eg_shishtawook: p => { const D = tabaq(p), o = D.o; return D.s + W.skewers(p, o, 3, (x, y, i) => i % 3 === 2 ? W.ING.pepperG(p, x, y, 8, 0) : ing.chickenSkewer(p, x, y, 22, 0, i), { L: 140, k: 6, gap: 22 }) + lemon(p, ...at(o, 46, 34), 13) + ing.cherryTomato(p, ...at(o, -46, 34), 14); },
    // タゲン・サマク（魚のトマトのタゲン焼き）: 魚・トマト・玉ねぎ・ピーマン・レモン、じゃがいも（お好みで）
    eg_tagensamak: B('#c8401e', [['fish', 4, 24], ['tomato', 3, 12], ['pepperG', 3, 12], ['potato', 3, 12]], { flecks: [pars(10)] }, tagen),
    // ガンバリ（えびの辛いトマトソース）: えび・トマト・玉ねぎ・ピーマン、香菜（お好みで）
    eg_gambari: B('#c8401e', [['shrimp', 10, 17], ['pepperG', 3, 12]], { flecks: [[CORI, 12, 1.6]] }),
    // エッガ（ハーブのオムレツ）: 卵・玉ねぎ・パセリ、ディル・トマト（お好みで）
    eg_eggah: p => { const D = tabaq(p); return D.s + W.jeon(p, 100, 100, 56, 1, { c: '#d8a840', h: 9 }) + W.flecks(p, 100, 96, 44, 60, 'eg', ['#4a9a2c', '#3f8a2a', '#efdcae', '#d8402a'], { ry: 24, s: 2 }) + Q.shine(80, 84, 20, -8, .7); },
    // シャクシューカ（トマトとピーマンの卵煮）（深皿）
    eg_shakshouka: p => { const V = ghawit(p), o = { cx: 100, cy: V.cy ?? 100, sy: SYF }; return W.make(p, { v: ghawit, mode: 'soup', c: '#c8401e', items: [['eggFried', 3, 20], ['pepperG', 4, 12], ['onion', 3, 12]], ing: { ...ing, eggFried: (pp, x, y, s, r, i) => W.friedEgg(pp, x, y, s * 2, i) }, minD: 18, flecks: [[CORI, 8, 1.4]] }); },
    // ロビア（黒目豆のトマト煮）、牛肉（お好みで）
    eg_lobia: B('#b8401e', [['blackEyed', 24, 14], ['beefStew', 3, 14]], { minD: 7 }),
    // ベサーラ（そら豆とハーブのピュレ）、揚げ玉ねぎ
    eg_bessara: K([], { base: '#6a8a2a', H: 12, flecks: [['#a8641e', 30, 2.2], ['#c8862e', 16, 1.8]] }, (p) => W.sideBowl(p, { edge: EARTH, rx: 92 })),
    // ソゴ（アレキサンドリアのスパイスソーセージとピーマン）: ソゴ・ピーマン・トマト・玉ねぎ、青唐辛子（お好みで）
    eg_sogo: P([['sogo', 16, 16], ['pepperG', 8, 13], ['tomato', 4, 11], ['onion', 3, 12]], { sauce: '#a8401e' }),
    // ラヤシュ（羊のチョップの網焼き）: 玉ねぎ・レモン、ヨーグルト（お好みで）
    eg_reyash: plateOf((p, o) => side(p, o, [['lambChop', -24, -8, 48, -20], ['lambChop', -4, 2, 48, -10], ['lambChop', 14, 12, 48, 0]]) + side(p, o, [['onion', 40, -14, 16, 10], ['onion', 46, -4, 16, -20]]) + lemon(p, ...at(o, -40, 30), 13)),

    // ---------- ご飯・麺 ----------
    // コシャリ: レンズ豆・米・マカロニ・ひよこ豆・揚げ玉ねぎ・トマトソース、細麺（お好みで）
    eg_koshari: p => { const V = ghawit(p), o = { cx: 100, cy: 100, sy: SYF }; return V.s + W.mound(p, 100, 104, 62, 18, '#c8a070', 'ks', SYF) + byDepth(W.spots('ksp', 40, 54, 7).map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4 + W.hill(u, v, 56, 18)); return [y, () => [ing.pastaShort, W.ING.lentil, W.ING.chickpea, ing.pastaShort, W.ING.rice][i % 5](p, x, y, 14, r, i)]; })) + W.mound(p, 100, 92, 26, 6, '#c8301a', 'kss', SYF) + W.flecks(p, 100, 84, 22, 40, 'ksf', ['#8a4a1a', '#a8641e', '#6a3010'], { ry: 8, s: 2.2 }); },
    // マカロナ・ベシャメル（ひき肉とベシャメルのペンネ焼き）（素焼きの耐熱皿）
    eg_macarona: oven({ c: '#f2c860', fl: ['#d8902a', '#c8782a', '#fff0b0', '#a8601e'], n: 120 }),
    // ファッタ（牛肉とご飯とパンのにんにく酢トマト）
    eg_fatta: p => { const D = ghawit(p), o = { cx: 100, cy: 100, sy: SYF }; return D.s + W.friedRice(p, 100, 104, 60, 16, 'ft', { cols: ['#fbf6ea', '#f4ecd8', '#fffdf6'], edge: '#d8ccb4', sy: SYF }) + W.flecks(p, 100, 98, 50, 30, 'ftb', ['#d8a050', '#c8863a'], { ry: 18, s: 2.6 }) + W.pool(p, 92, 96, 26, '#c8401e', 'fts', SYF) + byDepth(W.spots('ftm', 7, 34, 16).map(([u, v, r], i) => { const [x, y] = at(o, u, v, 14); return [y, () => ing.beefBoiled(p, x, y, 18, r, i)]; })); },
    // サヤデイヤ（魚と茶色い玉ねぎご飯）: 魚・米・玉ねぎ・レモン、トマト（お好みで）
    eg_sayadeya: riceWith(['#a8743a', '#8a5a2a', '#c8945a'], (p, o) => side(p, o, [['fishFried', -12, -8, 44, -10], ['fishFried', 16, 10, 44, 10]]) + lemon(p, ...at(o, 48, 30), 14), { edge: '#6a4220' }),
    // ロズ・メアンマル（クリームのご飯と鶏の焼きもの）（素焼きのタゲン）
    eg_rozmeammar: oven({ c: '#f6ecd0', fl: ['#e8c890', '#d8a050', '#f2dca0'], n: 90, top: (o, V, pp) => byDepth([[-30, -6], [26, -8], [0, 14]].map(([u, v], i) => { const [x, y] = at(o, u, v * .6, 4); return [y, () => ing.chickenRoast(pp, x, y, 30, -20 + i * 30, i)]; })) }),
    // マカロナ・サルサ（トマトソースのマカロニ）、ルーミーチーズ（お好みで）
    eg_salsamacarona: B('#c8401e', [['pastaRed', 22, 16], ['pepperG', 3, 11]], { minD: 7, flecks: [['#f6e0a0', 20, 1.6]] }),

    // ---------- 副菜 ----------
    // サラタ・バラディ（刻みサラダ）: トマト・きゅうり・玉ねぎ・パセリ・レモン、青唐辛子（お好みで）
    eg_salata: K([['tomato', 12, 12], ['cucumber', 8, 11], ['onion', 4, 10], ['chiliG', 3, 10]], { flecks: [pars(16)], after: (o, V, p) => lemon(p, o.cx + 42, o.cy - 6, 13) }),
    // タヒーナ（ごまのディップ）、パセリ（お好みで）
    eg_tahina: dip('#e8d8b0', [pars(8)]),
    // ババガヌーグ（焼きなすとごまのディップ）、トマト・パセリ（お好みで）
    eg_babaghanoug: dip('#c8a878', [['#8a6a3a', 20, 1.4], ['#c8281a', 6, 1.6], pars(8)]),
    // ターメイヤ（そら豆のファラフェル）
    eg_taameya: P([['taameya', 9, 22]], { minD: 16, H: 12, after: (o, D, p) => `<ellipse cx="${f(o.cx + 46)}" cy="${f(o.cy + 26)}" rx="14" ry="${f(14 * SYF)}" fill="#f4f0e6" stroke="${EARTH}" stroke-width=".8"/><ellipse cx="${f(o.cx + 46)}" cy="${f(o.cy + 25)}" rx="11" ry="${f(11 * SYF)}" fill="#e8d8b0"/>` }),
    // フール・メダミス（そら豆の煮込み）: レモン、トマト・パセリ（お好みで）（素焼きの鉢）
    eg_ful: K([['fava', 26, 14], ['tomato', 3, 10]], { base: '#7a4a24', minD: 6, flecks: [['#c8b040', 10, 2], pars(8)] }, clay),
    // ロズ・ビル・シャアレイヤ（細麺入りのご飯）
    eg_rozshaariya: P([['vermicelli', 24, 12]], { rice: { cols: ['#fbf6ea', '#f4ecd8', '#fffdf6'], edge: '#d8ccb4' }, H: 26, R: 50, minD: 6 }),
    // トルシ（野菜のピクルス）: にんじん・カリフラワー・きゅうり・青唐辛子・レモン
    eg_torshi: K([['carrot', 8, 12], ['cauliflower', 4, 12], ['cucumber', 6, 12], ['chiliG', 3, 12], ['lemonSlice', 2, 13]], { base: '#e8d8a0', ing: { ...ing, lemonSlice: (p, x, y, s) => W.coin(p, x, y, s * .5, '#f2d040', { h: 2, top: Q.rg(p, [[0, '#fffbe0'], [.7, '#f6ec90'], [1, '#e8c020']], .4, .35, .8) }) } }),
    // なすの詰めもののピクルス: 小なす・ピーマン・青唐辛子
    eg_betenganmekhalel: P([['pickledEggplant', 7, 18]], { minD: 14, H: 8 }),
    // きゅうりのヨーグルトサラダ、ディル（お好みで）
    eg_salatazabadi: S('#f6f2e6', [['cucumber', 8, 12]], { minD: 10, flecks: [[DILL, 14, 1.2]] }),
    // エジプトのポテトサラダ: じゃがいも・パセリ・レモン、赤玉ねぎ・ピーマン（お好みで）
    eg_salatabatates: K([['potato', 16, 14], ['redOnion', 3, 10], ['pepperG', 3, 10]], { flecks: [pars(20)] }),
    // ルッコラのサラダ: ルッコラ・トマト・赤玉ねぎ・レモン
    eg_gargir: K([['rocket', 18, 15], ['tomato', 5, 11], ['redOnion', 3, 10]], { minD: 7, after: (o, V, p) => lemon(p, o.cx + 42, o.cy - 6, 13), ing: { ...ing, rocket: (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, i % 2 ? '#3f7a2a' : '#5a9a3a', 'rk' + p.id + i, { wave: 3.4 }) } }),
    // じゃがいものにんにくと香菜炒め、ピーマン（お好みで）
    eg_batatessotee: P([['potato', 20, 15], ['pepperG', 3, 12]], { flecks: [[CORI, 20, 1.6], ['#f2e0b0', 10, 1.4]] }),
    // ズッキーニの炒め物: ズッキーニ・玉ねぎ、にんじん・トマト（お好みで）
    eg_kosasotee: P([['zucchini', 18, 15], ['onion', 4, 12], ['carrot', 4, 11]]),
    // ファソレヤ（いんげんのトマト煮）、にんじん（お好みで）
    eg_fasoleya: B('#c8401e', [['greenBean', 16, 9], ['carrot', 4, 12]], { minD: 8 }),
    // グリンピースとにんじんのトマト煮
    eg_besellagazar: B('#c8501e', [['pea', 22, 14], ['carrot', 8, 12]], { minD: 6 }),
    // ほうれん草のにんにくと香菜煮、米（お好みで）
    eg_sabanekh: B('#4a6a22', [['spinach', 14, 15], ['rice', 12, 10]], { minD: 8, flecks: [[CORI, 10, 1.6]] }),
    // カリフラワーのフライ、レモン（お好みで）
    eg_arnabeet: P([['arnabeet', 10, 16]], { minD: 12, after: (o, D, p) => lemon(p, ...at(o, 50, 32), 14) }),
    // フムス、パセリ（お好みで）
    eg_hummus: dip('#e8d4a8', [['#c8401e', 8, 1.4], pars(8), ['#e8c890', 6, 3]]),
    // 白チーズとトマト、青唐辛子・ねぎ（お好みで）
    eg_gebnatamatem: K([['whiteCheese', 10, 15], ['tomato', 8, 12], ['chiliG', 3, 11]], { minD: 7, flecks: [['#c8b040', 10, 2]] }),
    // ビーツのサラダ、玉ねぎ（お好みで）・レモン
    eg_banger: K([['beet', 18, 14], ['onion', 3, 10]], { after: (o, V, p) => lemon(p, o.cx + 42, o.cy - 6, 13) }),
    // キャベツのサラダ: キャベツ・にんじん・レモン、ピーマン（お好みで）
    eg_koronb: K([['shred', 40, 14], ['carrotStick', 10, 10], ['pepperG', 3, 9]], { minD: 5, ing: { ...ing, shred: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 3 === 0 ? '#9a3a6a' : i % 2 ? '#f2f2dc' : '#e0ecc0', { rot: r, line: .3 }) }, after: (o, V, p) => lemon(p, o.cx + 42, o.cy - 6, 13) }),
    // 焼きピーマンのサラダ: ピーマン・トマト・レモン
    eg_felfel: K([['pepperRoast', 14, 16], ['tomato', 5, 11]], { ing: { ...ing, pepperRoast: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .7, -s * .2], [s * .7, -s * .24], [s * .7, s * .2], [-s * .7, s * .22]], 2, i % 2 ? '#4a7a2a' : '#b8301e', { rot: r, line: .4 }) } }),
    // ロズ・ビル・ハルタ（レバーとナッツのご飯）: 米・鶏レバー・アーモンド・カシューナッツ・レーズン・玉ねぎ
    eg_rozbelkhalta: P([['liver', 8, 12], ['nut', 12, 14], ['raisin', 10, 12]], { rice: { cols: ['#c8945a', '#b8844a', '#d8a868'], edge: '#7a4a1e' }, H: 24, R: 50 }),
    // トマトのにんにくと唐辛子焼き
    eg_tamatemmeqaleya: P([['tomatoHalf', 7, 22], ['chiliG', 4, 12]], { minD: 16, H: 8, ing: { ...ing, tomatoHalf: (p, x, y, s) => W.coin(p, x, y, s * .5, '#c8281a', { h: 4, top: Q.rg(p, [[0, '#ff9a6a'], [.5, '#e0502a'], [.85, '#a8301a'], [1, '#c8281a']], .4, .35, .8) }) }, flecks: [['#f2e0b0', 14, 1.6]] }),
    // マッシュポテト
    eg_pure: K([], { base: '#f6e8c0', H: 22, after: (o, V, p) => W.butterPat(p, o.cx, o.cy - 30, 9) }),
    // マカロニのサラダ: パスタ・ピーマン・きゅうり、にんじん・チーズ（お好みで）
    eg_salatamakarona: K([['pastaShort', 20, 14], ['pepperG', 4, 10], ['pepperR', 4, 10], ['cucumber', 4, 11], ['whiteCheese', 4, 11]], { minD: 6 }),

    // ---------- 汁物 ----------
    // アッツ（赤レンズ豆のスープ）、レモン
    eg_ads: S('#e8902a', [['crouton', 6, 12]], withLemon({ minD: 12, ing: { ...ing, crouton: (p, x, y, s, r, i) => W.dice(p, x, y, s * .6, '#c8862e', p.id + 'cr' + i, { h: s * .45, top: Q.rg(p, [[0, '#f6d890'], [1, '#d8a050']], .4, .35, .8) }) }, flecks: [['#a8743a', 10, 1.2]] })),
    // モロヘイヤのスープ（鶏のだし）
    eg_molokhia: S('#3f6a22', [], { flecks: [['#5a8a2a', 30, 1.6], ['#2e5a1e', 20, 1.4]], oil: [8, '#a8a040'] }),
    // ルサーン・アスフール（オルゾの鶏スープ）、レモン（お好みで）
    eg_lesanasfour: S('#f0d898', [['orzo', 30, 10], ['chickenBoiled', 3, 13]], withLemon({ minD: 6, flecks: [pars(8)] })),
    // 野菜のスープ: にんじん・じゃがいも・ズッキーニ・玉ねぎ・トマト、グリンピース（お好みで）
    eg_khodar: S('#d8902a', [['carrot', 4, 11], ['potato', 4, 11], ['zucchini', 4, 11], ['pea', 5, 12]], { minD: 8 }),
    // 牛肉のスープと細麺、レモン（お好みで）
    eg_shaariya: S('#d8b070', [['beefBoiled', 4, 14], ['vermicelli', 16, 12]], withLemon({ minD: 7 })),
    // フリーケのスープと鶏、レモン（お好みで）
    eg_freekeh: S('#c8a860', [['freekeh', 40, 10], ['chickenBoiled', 3, 13]], withLemon({ minD: 5 })),
    // カワレア（牛の足のスープ）、ひよこ豆（お好みで）・レモン
    eg_kawarea: S('#ece0c0', [['trotter', 3, 22], ['chickpea', 8, 13]], withLemon({ minD: 10 })),
    // アレキサンドリアの魚のスープ: 白身魚・玉ねぎ・トマト・レモン、香菜（お好みで）
    eg_shorbetsamak: S('#d8802a', [['fish', 3, 18], ['tomato', 3, 10]], withLemon({ minD: 10, flecks: [[CORI, 12, 1.6]] })),
    // 茶色いレンズ豆のスープ、米（お好みで）・レモン
    eg_adsbigebba: S('#8a5a2a', [['lentil', 24, 12], ['rice', 10, 10]], withLemon({ minD: 5 })),
    // トマトのスープとご飯、パセリ（お好みで）
    eg_tamatem: S('#d0402a', [['rice', 24, 10]], { minD: 6, flecks: [pars(8)] }),
    // ズッキーニのクリームスープ
    eg_kosa: S('#c8d090', [], { cream: '#fbf8ee' }),
    // オートミールと鶏のスープ: 鶏・オーツ・玉ねぎ・にんじん、トマト（お好みで）
    eg_shoofan: S('#efe0b8', [['chickenBoiled', 3, 13], ['carrot', 4, 10], ['oat', 30, 10]], { minD: 6, ing: { ...ing, oat: (p, x, y) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.8" fill="#f2e6c8" stroke="#c8b080" stroke-width=".3"/>` } }),
    // ホンモス・エル・シャーム（スパイスのひよこ豆の汁）: ひよこ豆・トマト・レモン、青唐辛子・パセリ（お好みで）
    eg_hommosesham: S('#d8a050', [['chickpea', 18, 14], ['tomato', 3, 10], ['chiliG', 2, 11]], withLemon({ minD: 7, flecks: [pars(10)] })),
    // フール・ナビト（芽を出したそら豆のスープ）、レモン・香菜（お好みで）
    eg_fulnabit: S('#e0c890', [['favaSprout', 16, 14]], withLemon({ minD: 7, flecks: [[CORI, 10, 1.6]] })),
    // キシュク（温かいヨーグルトのスープと鶏）
    eg_kishk: S('#f2ecd8', [['chickenBoiled', 3, 13]], { minD: 12, flecks: [['#a8641e', 20, 2]] }),
    // 鶏のクリームスープ、マッシュルーム（お好みで）
    eg_kremafirakh: S('#f4ecd4', [['chickenBoiled', 3, 12], ['mushroom', 3, 12]], { minD: 10, cream: '#fbf8ee' }),
    // マッシュルームのクリームスープ
    eg_mashroom: S('#d8c098', [['mushroom', 3, 12]], { minD: 12, cream: '#fbf6e8' }),
    // かぼちゃのスープ
    eg_qar3: S('#f0a030', [], { cream: '#fbf6e8' }),
    // ホベイザ（ゼニアオイの葉のスープ）: 葉・米・玉ねぎ・香菜
    eg_khobeiza: S('#4a7a2a', [['mallow', 8, 14], ['rice', 12, 10]], { minD: 7, flecks: [[CORI, 10, 1.6]] }),
    // 魚介のクリームスープ: えび・いか・玉ねぎ・牛乳・レモン、白身魚（お好みで）
    eg_seafood: S('#f2e4c8', [['shrimp', 5, 15], ['squidRing', 5, 14], ['fish', 2, 15]], withLemon({ minD: 10, flecks: [pars(8)] })),
    // ブロッコリーのクリームスープ、チーズ（お好みで）
    eg_broccoli: S('#8aa850', [['broccoli', 2, 12]], { minD: 14, cream: '#fbf6e8' }),
    // 牛肉と野菜のスープ: 牛肉・じゃがいも・にんじん・ズッキーニ・玉ねぎ・トマト
    eg_lahmakhodar: S('#c8802a', [['beefStew', 4, 14], ['potato', 3, 12], ['carrot', 3, 11], ['zucchini', 3, 11]], { minD: 9 }),
    // グリンピースのスープ、にんじん（お好みで）
    eg_besella: S('#8ab048', [['pea', 8, 12], ['carrot', 3, 10]], { minD: 8, cream: '#fbf6e8' }),
};
