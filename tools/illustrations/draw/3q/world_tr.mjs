// トルコ（tr_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: ふだんの皿は銅色の縁（#b8683a）の白い平皿、チョルバは銅色の線の白い碗、煮込み（タスケバブ・クルファスリエ・ヒュンキャール）は銅色の縁の深皿、
// メネメン・スジュクル・ユムルタは両手の銅のサハン（小さな鍋）、ギュヴェチは素焼きの土鍋、オリーブオイル煮（zeytinyağlı）・メゼは白い小鉢。
// イズニック陶器の青い絵付けは描かない。材料は gohancho/packs/tr.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, SY, T: TR } = W;

const COPPER = '#b8683a';
const tabak = (p, o = {}) => Q.plate(p, { line: 'none', edge: COPPER, ...o });
const kase = (p, o = {}) => Q.shiroBowl(p, { rim: COPPER, line: 'none', ...o });
const derin = (p, o = {}) => Q.fukazara(p, { line: COPPER, ...o });
const kucuk = (p, o = {}) => W.sideBowl(p, { edge: COPPER, ...o });
const sahan = (p) => Q.pan(p, { cx: 100, cy: 96, rx: 84, h: 12, outer: '#a8582e', lip: '#d8905a', inner: '#8a4a26', handles: 'loop', handleC: '#a8582e', rim: '#d8905a' });
const guvec = (p, o = {}) => W.bowl(p, { outer: '#a8582e', inner: '#c87a4a', edge: '#e8b078', h: 40, cy: 86, fx: 50, gloss: .5, ...o });
const PARS = ['#3f8a2a', '#5aa83a'], PUL = ['#b8281a', '#d8402a'], DILL = ['#5a9a3a', '#4a8a2a'], MINT = '#4a8a3a';
const lemon = (p, x, y, s = 14) => W.lemon(p, x, y, s, { wedge: true });
const pars = (n = 14) => [PARS, n, 1.6];
const pul = (n = 14) => [PUL, n, 1.2];
const ing = {
    sivri: (p, x, y, s, r) => W.pod(p, x, y, s * 1.6, r, { c: '#6a9a3a', w: 5 }),
    sivriRing: (p, x, y, s) => W.chiliRing(x, y, s * .28, '#5a8a2a'),
    beefStew: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#a8502a', soak: '#6a2410', k: .5, sy: .72 }),
    lambStew: (p, x, y, s, r, i, liq) => Q.soakLump(p, x, y, s, i, { c: '#9a4a28', soak: '#5a2010', k: .5, sy: .72 }),
    lambBoiled: (p, x, y, s, r, i, liq) => Q.soakLump(p, x, y, s, i, { c: '#c8a080', soak: '#8a5a3a', k: .4, sy: .72 }),
    chickenSote: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e0a070', soak: '#b8501e', k: .45, sy: .72 }),
    chickenSkewer: (p, x, y, s, r, i) => Q.lump(p, x, y - 2, s * .4, s * .32, '#d8803a', p.id + 'ts' + i, { n: 9, jit: .2, hi: .6, edge: '#8a3a14' }),
    kofte: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .7, s * .34, s * .32, '#8a4a24', p.id + 'kf' + i, { rot: r, sear: '#5a2410', jit: .06 }),
    meatballSmall: (p, x, y, s, r, i, liq) => W.ball(p, x, y - s * .2, s, '#a8643a', p.id + 'mb' + i, { hi: .6 }),
    sucuk: (p, x, y, s, r, i) => W.sausageCoin(p, x, y, s * .42, { c: '#7a1e10', inner: '#b8402a' }),
    anchovy: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="M${f(-s * .7)},0 Q0,${f(-s * .22)} ${f(s * .6)},0 L${f(s * .75)},${f(-s * .12)} L${f(s * .72)},${f(s * .12)} L${f(s * .6)},0 Q0,${f(s * .22)} ${f(-s * .7)},0Z" fill="${Q.lg(p, [[0, '#e8b048'], [1, '#a8702a']], 0, 0, 0, 1)}" stroke="#7a4a1a" stroke-width=".5"/></g>`,
    liver: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .4, s * .3, i, { c: '#8a3a24', n: 12, h: 4, rot: r }),
    redOnionRing: (p, x, y, s, r) => W.onionStrip(x, y, s, r, '#c87aa8'),
    manti: (p, x, y, s, r, i) => Q.prism(p, x, y, Q.square(s * .6), s * .26, '#e8cc90', { rot: r + 45, line: .45, top: Q.rg(p, [[0, '#fbf2d8'], [1, '#e8cc90']], .4, .35, .8) }) + `<path d="M${f(x - s * .26)},${f(y - s * .3)} L${f(x)},${f(y - s * .55)} L${f(x + s * .26)},${f(y - s * .3)} M${f(x)},${f(y - s * .55)} L${f(x)},${f(y - s * .12)}" stroke="#c8a868" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y - s * .56)}" r="${f(s * .08)}" fill="#f6e6b8" stroke="#c8a868" stroke-width=".5"/>`,
    dolmaPepper: (p, x, y, s, r, i) => W.bellPepper(p, x, y, s * 1.3, i % 2 ? '#5a8a2a' : '#7aa83a', p.id + i, { fill: '#d8b080', grain: '#fbf2dc', cap: true }),
    yaprak: (p, x, y, s, r) => `<g ${TR(x, y, r)}><rect x="${f(-s * .6)}" y="${f(-s * .24)}" width="${f(s * 1.2)}" height="${f(s * .48)}" rx="${f(s * .24)}" fill="${Q.lg(p, [[0, '#a8b060'], [.5, '#6a7a2a'], [1, '#4a5a1e']], 0, 0, 0, 1)}" stroke="#3a4a14" stroke-width=".6"/>${[-.3, 0, .3].map(k => `<path d="M${f(k * s)},${f(-s * .24)} q${f(s * .06)},${f(s * .24)} 0,${f(s * .48)}" stroke="#8a9a4a" stroke-width=".8" fill="none"/>`).join('')}</g>`,
    karniyarik: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="M${f(-s)},0 C${f(-s)},${f(-s * .4)} ${f(s)},${f(-s * .4)} ${f(s)},0 C${f(s)},${f(s * .36)} ${f(-s)},${f(s * .36)} ${f(-s)},0Z" fill="#4a2038"/><path d="M${f(-s * .9)},${f(-s * .05)} C${f(-s * .9)},${f(-s * .3)} ${f(s * .9)},${f(-s * .3)} ${f(s * .9)},${f(-s * .05)}Z" fill="#8a4a24"/><path d="M${f(s * .95)},${f(-s * .05)} q${f(s * .16)},${f(-s * .1)} ${f(s * .22)},${f(-s * .28)}" stroke="#4a6a22" stroke-width="3" stroke-linecap="round" fill="none"/></g>` + W.flecks(p, x, y - s * .2, s * .7, 12, 'kn' + i, ['#c8281a', '#6a9a3a', '#e8401e'], { ry: s * .08, s: 2 }),
    imam: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="M${f(-s)},0 C${f(-s)},${f(-s * .4)} ${f(s)},${f(-s * .4)} ${f(s)},0 C${f(s)},${f(s * .36)} ${f(-s)},${f(s * .36)} ${f(-s)},0Z" fill="#4a2038"/><path d="M${f(-s * .9)},${f(-s * .05)} C${f(-s * .9)},${f(-s * .3)} ${f(s * .9)},${f(-s * .3)} ${f(s * .9)},${f(-s * .05)}Z" fill="#e0a070"/></g>` + W.flecks(p, x, y - s * .2, s * .7, 14, 'im' + i, ['#c8401e', '#efdcae', '#3f8a2a'], { ry: s * .08, s: 2 }),
    leekSlant: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .45, '#9ac860', { h: 3, liq, top: Q.rg(p, [[0, '#f6f8e0'], [.6, '#dce8b0'], [1, '#8ab858']], .4, .35, .8) }),
    artichoke: (p, x, y, s, r, i) => W.coin(p, x, y, s * .55, '#a8b060', { h: 4, top: Q.rg(p, [[0, '#f6f2d0'], [.7, '#e0dca0'], [1, '#a8b060']], .4, .35, .8) }),
    borlotti: (p, x, y, s, r) => Q.bean(p, x, y, s * .8, r, '#c8907a'),
    walnut: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .36, s * .28, '#a8743a', p.id + 'wn' + i, { n: 10, jit: .4, hi: .3 }),
    mucver: (p, x, y, s, r, i) => W.jeon(p, x, y, s * .6, i, { c: '#c8a040', h: 4 }) + W.flecks(p, x, y - 2, s * .4, 10, 'mv' + i, ['#5a8a2a', '#f6ecd0'], { ry: s * .2, s: 1.4 }),
    lentilKofte: (p, x, y, s, r, i) => Q.lump(p, x, y - 3, s * .5, s * .3, '#e8903a', p.id + 'lk' + i, { n: 10, jit: .15, hi: .5, edge: '#a8541e' }) + W.flecks(p, x, y - 6, s * .3, 5, 'lkf' + i, PARS, { ry: s * .12, s: 1.2 }),
    cauliFried: (p, x, y, s, r, i) => W.broc(p, x, y, s * 1.5, i, '#e8c070'),
    purslane: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * .6, r, '#4a8a2a', 'pu' + p.id + i, { wave: .2 }),
    pepperRoast: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -s * .22], [s * .8, -s * .26], [s * .8, s * .2], [-s * .8, s * .24]], 2, '#b8301e', { rot: r, line: .4, top: Q.lg(p, [[0, '#e8603a'], [1, '#a8281a']], 0, 0, 0, 1) }),
    chickenShred: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .5, -1.4], [s * .5, -1.4], [s * .45, 1.4], [-s * .5, 1.4]], 1.8, '#f2e4c8', { rot: r, line: .3 }),
    whiteCheese: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .7, '#f6f2e6', p.id + 'wc' + i, { h: s * .4, liq, top: Q.rg(p, [[0, '#ffffff'], [1, '#ece4d0']], .4, .35, .8) }),
    cabbageBlack: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.2, r, '#2e4a22', 'kl' + p.id + i, { wave: 3.4 }),
    egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    orzo: (p, x, y) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.2" fill="#e0b060" stroke="#a8803a" stroke-width=".3"/>`,
    erişte: (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, -1.4], [s / 2, -1.4], [s / 2, 1.4], [-s / 2, 1.4]], 1.4, '#f0d890', { rot: r, line: .3 }),
    vermicelli: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .5)},0 Q0,-2 ${f(s * .5)},1" stroke="#e8c070" stroke-width="1.2" fill="none"/></g>`,
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(tabak, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(kase, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}, v = derin) => M(v, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}) => M(kucuk, 'bowl', null, items, { minD: 7, ...o });
const withLemon = (o = {}) => ({ ...o, after: (S, V, p) => lemon(p, S.cx + 46, S.cy + 4, 13) });
const yogurt = (p, x, y, rx) => `<path d="${Q.blob(x, y, rx, rx * .5, 'yg' + p.id + x, { n: 12, jit: .1 })}" fill="${Q.rg(p, [[0, '#ffffff'], [.7, '#f6f2e6'], [1, '#e0d8c4']], .4, .35, .8)}" stroke="#d8d0b8" stroke-width=".5"/>`;
// サハン（銅の小鍋）の卵料理
const sahanDish = (inner) => p => { const V = sahan(p), o = { cx: 100, cy: 98, sy: SY }; return V.s + `<g ${V.inside}>${inner(p, o)}</g>` + V.shine(.5); };
const pilavPlate = (p, o, u = 36, v = -12, rx = 28) => W.riceMound(p, ...at(o, u, v), rx, 22, { sy: SYF });
const plateOf = (draw) => p => { const D = tabak(p), o = D.o; return D.s + W.grow(o.cx, o.cy, 1.25, draw(p, o)); };
const side = (p, o, list) => byDepth(list.map(([k, u, v, s, r = 0], i) => { const [x, y] = at(o, u, v, 4); return [y, () => (ing[k] || W.ING[k])(p, x, y, s, r, i)]; }));

export default {
    // ---------- 主菜 ----------
    // クルファスリエ（白いんげんのトマト煮）、シヴリ（お好みで）
    tr_kurufasulye: B('#b8401e', [['whiteBean', 22, 14], ['sivri', 2, 12]], { minD: 7, flecks: [pul(8)] }),
    // カルヌヤルク（なすのひき肉詰め）: なす・ひき肉・玉ねぎ・トマト・シヴリ
    tr_karniyarik: B('#c8401e', [['karniyarik', 3, 34]], { minD: 24 }),
    // タヴク・ソテ（鶏とピーマンの炒め煮）: 鶏・シヴリ・トマト・玉ねぎ、マッシュルーム（お好みで）
    tr_tavuksote: P([['chickenSote', 10, 16], ['sivri', 6, 12], ['tomato', 5, 12], ['mushroom', 3, 12]], { sauce: '#b8401e' }),
    // ハムスィ（片口いわしのとうもろこし粉揚げ）、レモン・赤玉ねぎ・ルッコラ（お好みで）
    tr_hamsi: p => { const D = tabak(p), o = D.o; return D.s + byDepth(Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.283, [x, y] = at(o, Math.cos(a) * 42, Math.sin(a) * 42, 4); return [y, () => ing.anchovy(p, x, y, 38, a * 57.3 + 90, i)]; })) + lemon(p, o.cx, o.cy - 6, 16) + W.flecks(p, o.cx, o.cy - 4, 14, 10, 'hs', ['#c87aa8', '#4a8a2a'], { ry: 6, s: 2 }); },
    // メネメン（トマトとピーマンの卵炒め）、玉ねぎ・白チーズ（お好みで）（サハン）
    tr_menemen: sahanDish((p, o) => `<rect width="200" height="200" fill="#d8502a"/>` + byDepth(W.spots('mn', 22, 64, 10).map(([u, v, r], i) => { const [x, y] = at(o, u, v * .9, 2); return [y, () => [W.ING.scramble, W.ING.scramble, W.ING.tomato, ing.sivriRing, ing.whiteCheese][i % 5](p, x, y, 16, r, i)]; })) + W.flecks(p, 100, 96, 60, 14, 'mnp', PARS, { ry: 28, s: 1.6 })),
    // タス・ケバブ（牛肉のトマト煮）: 牛肉・玉ねぎ・トマト、にんじん・ピーマン（お好みで）とピラウ
    tr_taskebabi: plateOf((p, o) => pilavPlate(p, o) + W.pool(p, ...at(o, -16, 8), 40, '#8a2e14', 'tk') + side(p, o, [['beefStew', -28, 0, 18], ['beefStew', -10, 10, 18], ['beefStew', -22, 18, 18], ['carrot', -4, -4, 12], ['sivri', -34, 14, 12, 20]])),
    // イズミル・キョフテ（肉団子とじゃがいものオーブン焼き）: キョフテ・じゃがいも・シヴリ・トマト（素焼きの耐熱皿）
    tr_izmirkofte: p => W.bake(p, { base: '#a8582e', inner: '#c87a4a', c: '#c8401e', fl: ['#a8301a'], n: 20, top: (o, V, pp) => byDepth(Array.from({ length: 12 }, (_, i) => { const u = -60 + (i % 6) * 24, v = -18 + Math.floor(i / 6) * 34; const [x, y] = at(o, u, v * .6, 4); return [y, () => [ing.kofte, W.ING.potatoRoast, ing.kofte, W.ING.tomato][i % 4](pp, x, y, i % 4 === 1 ? 16 : 22, -10, i)]; })) + byDepth([[-40, 0], [10, -4], [50, 2]].map(([u, v], i) => { const [x, y] = at(o, u, v, 10); return [y, () => ing.sivri(pp, x, y, 16, -14)]; })) }),
    // ビベル・ドルマス（ピーマンの肉と米詰め）: ピーマン・ひき肉・米・玉ねぎ・トマト
    tr_biberdolmasi: B('#c8501e', [['dolmaPepper', 5, 26]], { minD: 28 }),
    // ムサカ（なすとひき肉の重ね煮）: なす・ひき肉・玉ねぎ・トマト・ピーマン
    tr_musakka: p => W.bake(p, { base: '#a8582e', inner: '#c87a4a', c: '#b8401e', fl: ['#7a2410', '#d8603a'], n: 30, top: (o, V, pp) => byDepth(Array.from({ length: 15 }, (_, i) => { const u = -60 + (i % 5) * 28, v = -30 + Math.floor(i / 5) * 28; const [x, y] = at(o, u, v * .6, 3); return [y, () => W.coin(pp, x, y, 13, '#4a2038', { h: 3, sy: .5, top: Q.rg(pp, [[0, '#d8a068'], [.6, '#a8642a'], [.85, '#6a3418'], [1, '#4a2038']], .4, .35, .8) }) + W.flecks(pp, x, y - 3, 7, 6, 'mk' + i, ['#7a3a1a', '#5a2410'], { ry: 3, s: 1.8 })]; })) + byDepth([[-44, -6], [0, 4], [40, -2]].map(([u, v], i) => { const [x, y] = at(o, u, v, 8); return [y, () => W.pod(pp, x, y, 26, -10, { c: '#5a8a2a', w: 5 }) + W.tomatoDice(pp, x + 14, y + 2, 9, i)]; })), scoop: { layers: [['#b8401e', .18], ['#7a3a1a', .3], ['#5a2a3a', .12], ['#d8a068', .4]], dots: [['#4a2038', 4, 2.4]] } }),
    // アルナヴト・ジエリ（レバーのから揚げ）と赤玉ねぎのサラダ、フライドポテト（お好みで）
    tr_cigertava: plateOf((p, o) => side(p, o, [['liver', -26, -8, 28], ['liver', -6, -12, 28], ['liver', -16, 8, 28], ['liver', 4, 2, 28], ['liver', -32, 12, 28], ['redOnionRing', 32, -6, 22, 10], ['redOnionRing', 38, 8, 22, -20], ['redOnionRing', 28, 18, 22, 30]]) + W.flecks(p, ...at(o, 30, 4, 8), 18, 14, 'cg', PARS, { ry: 8, s: 1.6 })),
    // エトリ・ノフット（肉入りひよこ豆の煮込み）
    tr_etlinohut: B('#c8501e', [['chickpea', 18, 14], ['lambStew', 4, 15]], { minD: 7 }),
    // タヴク・シシ（鶏のヨーグルト漬けの串焼き）、玉ねぎ・ピーマン
    tr_tavuksis: p => { const D = tabak(p), o = D.o; return D.s + W.skewers(p, o, 3, (x, y, i) => i % 3 === 2 ? ing.sivri(p, x, y, 8, 0) : ing.chickenSkewer(p, x, y, 22, 0, i), { L: 140, k: 6, gap: 22 }) + W.ING.onion(p, ...at(o, 44, 34), 14, 10); },
    // フルン・タヴク（鶏とじゃがいものオーブン焼き）、ピーマン・にんじん（お好みで）
    tr_firintavuk: P([['drum', 4, 22], ['potatoRoast', 8, 15], ['onion', 3, 12], ['sivri', 3, 12]], { minD: 16, ing: { ...ing, drum: (p, x, y, s, r, i) => W.drumstick(p, x, y, s * 1.6, r, i, { c: '#c8602a', fried: false }) } }),
    // ヒュンキャール・ベーエンディ（焼きなすのピュレに羊の煮込み）
    tr_hunkar: plateOf((p, o) => `<path d="${Q.blob(...at(o, 0, 4), 50, 28, 'hb', { n: 14, jit: .1 })}" fill="${Q.rg(p, [[0, '#fbf2dc'], [.7, '#f0e0c0'], [1, '#d8c098']], .4, .35, .8)}" stroke="#c8b080" stroke-width=".6"/>` + W.flecks(p, ...at(o, 0, 4), 44, 30, 'hbf', ['#c8a070', '#a8845a'], { ry: 20, s: 1.4 }) + W.mound(p, ...at(o, 0, 0, 4), 26, 8, '#8a2e14', 'hbm', SYF) + side(p, o, [['lambStew', -10, -4, 16], ['lambStew', 8, 0, 16], ['lambStew', -2, 8, 16]]) + W.flecks(p, ...at(o, 0, -2, 12), 14, 8, 'hbp', PARS, { ry: 6, s: 1.4 })),
    // クズ・ギュヴェチ（羊と野菜の土鍋焼き）: 羊・じゃがいも・トマト・ピーマン・玉ねぎ、いんげん（お好みで）
    tr_kuzuguvec: B('#a8401e', [['lambStew', 6, 17], ['potato', 4, 14], ['tomato', 3, 12], ['sivri', 2, 12], ['greenBean', 2, 8]], {}, guvec),
    // レヴレク（すずきと野菜のオーブン焼き）: すずき・じゃがいも・トマト・玉ねぎ・レモン
    tr_levrek: p => { const D = tabak(p), o = D.o; return D.s + byDepth(W.spots('lv', 12, 60, 12, { ry: 30 }).map(([u, v, r], i) => { const [x, y] = at(o, u, v * .7, 2); return [y - 30, () => [W.ING.potato, W.ING.tomato, W.ING.onion][i % 3](p, x, y, 16, r, i)]; })) + W.wholeFish(p, o.cx, o.cy - 2, 140, -6, 1, { skin: '#b8b0a0', belly: '#f0e8d8', char: .4 }) + [-30, -6, 18].map(dx => lemon(p, o.cx + dx, o.cy - 10, 10)).join(''); },
    // ブーラマ（魚のトマトとレモン煮）: 魚・トマト・ピーマン・玉ねぎ・レモン
    tr_bugulama: B('#d8603a', [['fish', 4, 24], ['tomato', 4, 12], ['sivri', 2, 12], ['lemonSlice', 2, 14]], { flecks: [pars(12)], ing: { ...ing, lemonSlice: (p, x, y, s) => W.coin(p, x, y, s * .5, '#f2d040', { h: 2, top: Q.rg(p, [[0, '#fffbe0'], [.7, '#f6ec90'], [.85, '#f6e070'], [1, '#e8c020']], .4, .35, .8) }) } }),
    // カリデス・ギュヴェチ（えびとトマトのチーズ焼き）（素焼きの土鍋）
    tr_karidesguvec: B('#c8401e', [['shrimp', 10, 16], ['sivri', 3, 12]], { flecks: [['#f6d070', 40, 2.2], ['#e8b040', 20, 2]] }, guvec),
    // チュルブル（にんにくヨーグルトに落とし卵と唐辛子バター）
    tr_cilbir: plateOf((p, o) => yogurt(p, ...at(o, 0, 4), 50) + side(p, o, [['poached', -16, 0, 32], ['poached', 16, 8, 32]]) + W.drizzle([[o.cx - 40, o.cy - 4], [o.cx - 20, o.cy - 10], [o.cx, o.cy - 2], [o.cx + 20, o.cy - 10], [o.cx + 40, o.cy - 4]], '#d8501e', 3) + W.flecks(p, ...at(o, 0, 0, 8), 34, 12, 'cb', DILL, { ry: 12, s: 1.2 })),
    // テュルリュ（夏野菜の煮込み）: なす・ズッキーニ・じゃがいも・いんげん・ピーマン・トマト・玉ねぎ
    tr_turlu: B('#c8501e', [['eggplant', 3, 14], ['zucchini', 3, 13], ['potato', 3, 13], ['greenBean', 3, 8], ['sivri', 2, 12], ['tomato', 2, 12]]),
    // ほうれん草と米の煮込み、ヨーグルト（お好みで）
    tr_ispanakyemegi: B('#4a6a22', [['spinach', 14, 15], ['rice', 20, 10]], { minD: 8, after: (o, V, p) => yogurt(p, o.cx + 30, o.cy - 26, 14) }),
    // 緑レンズ豆とブルグルの煮込み、にんじん（お好みで）
    tr_yesilmercimek: B('#6a5a2a', [['lentil', 30, 13], ['grain', 20, 12], ['carrot', 3, 11]], { minD: 6, flecks: [pul(8)] }),
    // スジュクル・ユムルタ（スジュクと目玉焼き）（サハン）
    tr_sucukluyumurta: sahanDish((p, o) => `<rect width="200" height="200" fill="#c8862e"/>` + byDepth([[-30, -10], [16, -14], [-6, 12], [34, 10]].map(([u, v], i) => { const [x, y] = at(o, u, v * .9, 2); return [y, () => W.friedEgg(p, x, y, 40, i)]; })) + byDepth(W.spots('sk', 12, 60, 14).map(([u, v], i) => { const [x, y] = at(o, u, v * .9, 3); return [y, () => ing.sucuk(p, x, y, 18, 0, i)]; }))),
    // ベゼリエ（グリンピースと牛肉とにんじん）: グリンピース・牛肉・玉ねぎ・にんじん・じゃがいも
    tr_bezelye: B('#c8701e', [['pea', 24, 14], ['beefStew', 3, 14], ['carrot', 4, 12], ['potato', 3, 12]], { minD: 6 }),

    // ---------- ご飯・麺 ----------
    // マントゥ（トルコの小さな餃子とにんにくヨーグルト）、唐辛子バター
    tr_manti: p => { const D = derin(p), o = { cx: 100, cy: D.cy ?? 100, sy: SYF }; return D.s + yogurt(p, 100, o.cy, 66) + byDepth(W.spots('mt', 20, 54, 15, { ry: 26 }).map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => ing.manti(p, x, y, 26, r % 30, i)]; })) + W.drizzle([[50, o.cy - 4], [76, o.cy - 10], [100, o.cy - 2], [124, o.cy - 10], [150, o.cy - 4]], '#d8501e', 3.4) + W.flecks(p, 100, o.cy - 6, 44, 20, 'mtm', [MINT, '#a8301a'], { ry: 16, s: 1.4 }); },
    // タヴクル・ピラウ（鶏のピラウ）、ひよこ豆（お好みで）
    tr_tavuklupilav: P([['chickenShred', 16, 14], ['chickpea', 8, 13]], { rice: { cols: ['#fbf6ea', '#f4ecd8', '#fffdf6'], edge: '#d8ccb4' }, H: 24, R: 50 }),
    // フルン・マカルナ（ベシャメルのパスタのオーブン焼き）
    tr_firinmakarna: p => W.bake(p, { /*fx*/blister: 10, scoop: { layers: [['#e8c070', .12], ['#f6ecd0', .28], ['#f2c860', .6]], dots: [['#fbe8a0', 10, 3]] }, /*xf*/ base: '#e8dcc0', inner: '#f6efe2', c: '#f2c860', fl: ['#d8902a', '#c8782a', '#fff0b0', '#a8601e'], n: 110 }),

    // ---------- 副菜 ----------
    // チョバン・サラタス（羊飼いのサラダ）: トマト・きゅうり・シヴリ・玉ねぎ・パセリ・レモン
    tr_coban: K([['tomato', 12, 12], ['cucumber', 8, 12], ['sivriRing', 5, 11], ['onion', 3, 10]], { flecks: [pars(16)], after: (o, V, p) => lemon(p, o.cx + 42, o.cy - 6, 13) }),
    // ピラウ（バターのご飯）、オルゾ（お好みで）
    tr_pilav: P([['orzo', 20, 10]], { rice: { cols: ['#fbf6ea', '#f4ecd8', '#fffdf6'], edge: '#d8ccb4' }, H: 26, R: 50 }),
    // ジャジュク（きゅうりのヨーグルト）、ディル・ミント（お好みで）
    tr_cacik: S('#f6f2e6', [['cucumber', 8, 12]], { minD: 10, oil: [8, '#c8b040'], flecks: [[MINT, 14, 1.4], [DILL[0], 10, 1.2]] }),
    // いんげんのオリーブオイル煮: いんげん・玉ねぎ・トマト
    tr_taze: K([['flatBean', 22, 16], ['tomato', 3, 11]], { base: '#d8803a', ing: { ...ing, flatBean: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .6, -2.4], [s * .6, -2.4], [s * .6, 2.4], [-s * .6, 2.4]], 2.4, '#5a8a2a', { rot: r, line: .4, top: Q.lg(p, [[0, '#a8c870'], [1, '#5a8a2a']], 0, 0, 0, 1) }) } }),
    // ミュジヴェル（ズッキーニのお焼き）: ズッキーニ・卵・白チーズ・青ねぎ・ディル
    tr_mucver: P([['mucver', 6, 30]], { minD: 22, H: 8, after: (o, D, p) => yogurt(p, ...at(o, 44, 30), 14) }),
    // トルコのポテトサラダ: じゃがいも・青ねぎ・パセリ・レモン
    tr_patates: K([['potato', 18, 14]], { flecks: [pars(20), ['#4a9a2c', 12, 1.6], pul(6)] }),
    // ズェイティンヤール・ピラサ（ポロねぎのオリーブオイル煮）: ポロねぎ・にんじん・米・レモン
    tr_pirasa: K([['leekSlant', 14, 16], ['carrot', 8, 12], ['rice', 14, 10]], { base: '#e8dca8', after: (o, V, p) => lemon(p, o.cx + 42, o.cy - 6, 13) }),
    // バルブンヤ（うずら豆のオリーブオイル煮）: うずら豆・玉ねぎ・にんじん・じゃがいも・トマト
    tr_barbunya: K([['borlotti', 22, 14], ['carrot', 5, 11], ['potato', 3, 11]], { base: '#c8603a', flecks: [pars(10)] }),
    // エンギナル（アーティチョークのオリーブオイル煮）: アーティチョーク・にんじん・じゃがいも・青ねぎ・レモン・ディル、グリンピース（お好みで）
    tr_enginar: P([['artichoke', 5, 26], ['carrot', 5, 12], ['potato', 3, 12], ['pea', 6, 12]], { minD: 12, flecks: [[DILL, 20, 1.2]] }),
    // クスル（ブルグルのサラダ）: ブルグル・ペースト・青ねぎ・パセリ・トマト・レモン、レタス（お好みで）
    tr_kisir: K([['tomato', 5, 10], ['lettuce', 3, 14]], { base: '#d8803a', H: 16, flecks: [['#c8602a', 60, 1.6], ['#e8a050', 40, 1.4], pars(20), ['#4a9a2c', 10, 1.6]] }),
    // ピヤズ（白いんげんと玉ねぎのサラダ）: 白いんげん・赤玉ねぎ・パセリ、ゆで卵・トマト（お好みで）
    tr_piyaz: K([['whiteBean', 20, 14], ['redOnion', 5, 11], ['egg', 2, 13], ['tomato', 3, 10]], { flecks: [pars(16), pul(6)] }),
    // ギャヴルダー（刻みトマトとくるみのサラダ）: トマト・ピーマン・赤玉ねぎ・くるみ・パセリ
    tr_gavurdagi: K([['tomato', 14, 12], ['sivriRing', 5, 11], ['redOnion', 4, 10], ['walnut', 6, 12]], { flecks: [pars(16)] }),
    // エズメ（辛いトマトとピーマンのペースト）
    tr_ezme: K([], { base: '#c8401e', H: 12, flecks: [['#5a8a2a', 20, 1.6], ['#a8281a', 30, 1.4], pars(10)] }),
    // シャクシュカ（揚げなすのトマトソース）、にんにくヨーグルト（お好みで）
    tr_saksuka: K([['eggplant', 14, 15], ['sivri', 3, 11]], { base: '#c8401e', ing: { ...ing, eggplant: (p, x, y, s, r, i) => W.dice(p, x, y, s, '#4a2038', p.id + 'eg' + i, { h: s * .55, top: Q.rg(p, [[0, '#e8b070'], [.6, '#c8803a'], [1, '#8a4a1e']], .4, .35, .8) }) } }),
    // 焼きなすのサラダ: なす・ピーマン・トマト・パセリ・レモン
    tr_patlicansalatasi: K([['tomato', 5, 10], ['sivriRing', 4, 10]], { base: '#c8a070', H: 12, flecks: [['#8a6a3a', 30, 1.6], pars(14)] }),
    // にんじんの炒め物とにんにくヨーグルト、くるみ（お好みで）
    tr_havuctarator: K([['walnut', 4, 12]], { base: '#f6f0dc', H: 14, flecks: [['#e8742a', 50, 1.8], ['#f08a3a', 30, 1.6], [DILL[0], 10, 1.2]] }),
    // メルジメッキ・キョフテ（赤レンズ豆とブルグルの団子）: レタス・レモン
    tr_mercimekkofte: plateOf((p, o) => side(p, o, [['lettuce', -30, -14, 18, -20], ['lettuce', 30, -14, 18, 20]]) + side(p, o, [['lentilKofte', -24, -6, 26], ['lentilKofte', 0, -10, 26], ['lentilKofte', 24, -4, 26], ['lentilKofte', -12, 10, 26], ['lentilKofte', 12, 12, 26]]) + lemon(p, ...at(o, 44, 30), 13)),
    // ブルグル・ピラウ（トマトのブルグル）、ピーマン（お好みで）
    tr_bulgurpilavi: P([['sivriRing', 5, 11], ['tomato', 3, 10]], { rice: { cols: ['#c8803a', '#b8702a', '#d8944a'], edge: '#8a4a1a', n: 360 }, H: 24, R: 50 }),
    // カルナバハル（カリフラワーの衣揚げ）とにんにくヨーグルト
    tr_karnabahar: P([['cauliFried', 10, 16]], { minD: 12, after: (o, D, p) => yogurt(p, ...at(o, 44, 30), 14) }),
    // スベリヒユのサラダ: スベリヒユ・トマト・青ねぎ・レモン
    tr_semizotu: K([['purslane', 30, 13], ['tomato', 6, 11]], { minD: 5, after: (o, V, p) => lemon(p, o.cx + 42, o.cy - 6, 13) }),
    // ビーツのにんにくサラダ、パセリ・青ねぎ（お好みで）
    tr_pancar: K([['beet', 18, 14]], { flecks: [pars(12)] }),
    // キャベツとにんじんのサラダ: キャベツ・にんじん・レモン
    tr_lahana: K([['shred', 40, 14], ['carrotStick', 10, 10]], { minD: 5, ing: { ...ing, shred: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#f2f2dc' : '#e0ecc0', { rot: r, line: .3 }) }, after: (o, V, p) => lemon(p, o.cx + 42, o.cy - 6, 13) }),
    // 焼き赤ピーマンのにんにく酢がけ
    tr_kozbiber: P([['pepperRoast', 8, 24]], { minD: 12, H: 8, flecks: [pars(14), ['#f2e0b0', 10, 1.4]] }),
    // チェルケズ・タヴウ（鶏のくるみソース）
    tr_cerkez: K([['chickenShred', 16, 14]], { base: '#d8b888', H: 14, after: (o, V, p) => W.drizzle([[o.cx - 30, o.cy - 22], [o.cx - 10, o.cy - 28], [o.cx + 10, o.cy - 22], [o.cx + 30, o.cy - 28]], '#c8401e', 2.4), flecks: [['#a8743a', 30, 1.4]] }),
    // イマム・バユルドゥ（なすのオリーブオイル煮）: なす・玉ねぎ・トマト・ピーマン・パセリ
    tr_imambayildi: P([['imam', 3, 34]], { minD: 26, H: 6 }),
    // ヤプラク・サルマ（ぶどうの葉の米詰め）、レモン
    tr_yaprak: P([['yaprak', 12, 22]], { minD: 12, H: 10, after: (o, D, p) => lemon(p, ...at(o, 44, 30), 15) }),

    // ---------- 汁物 ----------
    // メルジメッキ・チョルバス（赤レンズ豆のスープ）、レモン
    tr_mercimek: S('#e8902a', [], withLemon({ top: [['redLentil', 18, 16]], oil: [10, '#c8401e'], flecks: [pul(10), [MINT, 6, 1.4]] })),
    // ヤイラ・チョルバス（ヨーグルトと米とミントのスープ）
    tr_yayla: S('#f4eedc', [['rice', 30, 10]], { minD: 6, oil: [10, '#c8501e'], flecks: [[MINT, 18, 1.4]] }),
    // トマトのスープ、チーズ（お好みで）
    tr_domates: S('#d0502a', [], { top: [['tomatoChunk', 4, 15]], cream: '#fbf2e0', flecks: [['#f6d070', 12, 1.8]] }),
    // エゾゲリン・チョルバス（赤レンズ豆とブルグルのスープ）
    tr_ezogelin: S('#d8702a', [['grain', 20, 11]], withLemon({ top: [['redLentil', 12, 16], ['grain', 6, 14]], minD: 6, oil: [10, '#c8401e'], flecks: [[MINT, 10, 1.4]] })),
    // タルハナ・チョルバス、チーズ（お好みで）
    tr_tarhana: S('#c8602a', [], { flecks: [['#f6d070', 14, 1.8], [MINT, 6, 1.4]] }),
    // デュン・チョルバス（羊の婚礼のスープ）: 羊・卵黄・レモン
    tr_dugun: S('#f2e4b8', [['lambBoiled', 6, 14]], withLemon({ minD: 10, oil: [10, '#c8401e'], flecks: [pul(8)] })),
    // タヴク・チョルバス（鶏の卵とレモンのスープ）、にんじん（お好みで）
    tr_tavukcorba: S('#f2e4b0', [['chickenShred', 12, 13], ['carrot', 4, 10]], withLemon({ minD: 8, flecks: [pars(10)] })),
    // シェフリイェ・チョルバス（細麺のスープ）、パセリ・レモン（お好みで）
    tr_sehriye: S('#d8702a', [['vermicelli', 20, 12]], withLemon({ minD: 6, flecks: [pars(10)] })),
    // マッシュルームのクリームスープ
    tr_mantarcorba: S('#d8c098', [['mushroom', 3, 12]], { top: [['mushroom', 5, 16]], minD: 12, cream: '#fbf6e8' }),
    // 野菜のスープ: にんじん・じゃがいも・ズッキーニ・玉ねぎ、いんげん（お好みで）
    tr_sebze: S('#e0a050', [['carrot', 4, 11], ['potato', 4, 11], ['zucchini', 4, 11], ['greenBean', 3, 8]], { minD: 9 }),
    // トゥトマチ（緑レンズ豆と麺のヨーグルトスープ）
    tr_tutmac: S('#efe4c8', [['lentil', 14, 12], ['erişte', 10, 13]], { top: [['lentil', 12, 16]], minD: 7, oil: [8, '#c8501e'], flecks: [[MINT, 12, 1.4]] }),
    // ブロッコリーのスープ
    tr_brokoli: S('#8aa850', [['broccoli', 2, 12]], { top: [['broccoli', 4, 16]], minD: 14, cream: '#fbf6e8' }),
    // かぼちゃのスープ
    tr_balkabagi: S('#f0a030', [], { top: [['pumpkin', 4, 15], ['pumpkinSeed', 6, 14]], cream: '#fbf6e8', flecks: [pul(6)] }),
    // エクシリ・キョフテ（酸っぱい肉団子のスープ）: 肉団子・米・にんじん・じゃがいも・卵黄・レモン
    tr_eksilikofte: S('#f0d8a0', [['meatballSmall', 10, 13], ['carrot', 4, 10], ['potato', 3, 11]], withLemon({ minD: 8, flecks: [[MINT, 8, 1.4]] })),
    // ウン・チョルバス（小麦粉を炒ったスープ）
    tr_un: S('#d8803a', [], { flecks: [pul(8), [MINT, 6, 1.4]] }),
    // じゃがいものスープ、チーズ（お好みで）
    tr_patatescorba: S('#efe0b0', [['potato', 5, 12]], { minD: 10, flecks: [['#f6d070', 10, 1.8], pars(6)] }),
    // 魚のスープ（卵とレモン）: 白身魚・じゃがいも・にんじん・玉ねぎ・レモン
    tr_balik: S('#f0e0b0', [['fish', 3, 18], ['potato', 3, 11], ['carrot', 3, 10]], withLemon({ minD: 10, flecks: [pars(10)] })),
    // ほうれん草のヨーグルトスープ: ほうれん草・米・ヨーグルト
    tr_ispanak: S('#9ab060', [['spinach', 6, 12], ['rice', 14, 10]], { top: [['spinach', 5, 15]], minD: 7, cream: '#fbf8ee' }),
    // コーンのクリームスープ
    tr_misir: S('#f2d880', [['corn', 10, 12]], { minD: 8 }),
    // ズッキーニのスープ、ディル（お好みで）
    tr_kabak: S('#c8d090', [], { top: [['zucchini', 5, 16]], cream: '#fbf8ee', flecks: [[DILL, 12, 1.2]] }),
    // にんじんのスープ、ヨーグルト（お好みで）
    tr_havuc: S('#f0902a', [], { top: [['carrot', 7, 15]], cream: '#fbf8ee' }),
    // ハシュラマ（羊と野菜のゆでスープ）: 羊・じゃがいも・にんじん・玉ねぎ、レモン（お好みで）
    tr_haslama: S('#e8d0a0', [['lambBoiled', 4, 16], ['potato', 3, 14], ['carrot', 3, 12]], withLemon({ minD: 12, flecks: [pars(10)] })),
    // カララハナ・チョルバス（黒キャベツと豆のスープ）
    tr_karalahana: S('#8a7a3a', [['cabbageBlack', 6, 13], ['whiteBean', 10, 12]], { top: [['whiteBean', 10, 16]], minD: 8 }),
};
Object.assign(ing, { poached: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#fbf8f0', p.id + 'po' + i, { hi: .6 }) + `<ellipse cx="${f(x - 1)}" cy="${f(y - s * .45)}" rx="${f(s * .2)}" ry="${f(s * .13)}" fill="#f6c22a"/>` });
