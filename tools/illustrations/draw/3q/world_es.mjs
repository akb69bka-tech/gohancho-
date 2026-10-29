// スペイン（es_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: ふだんの皿は柿色の縁（#bf5a2c）の白い平皿、汁物・クレマは柿色の線の白い碗、煮込み（cocido・fabada・lentejas）は柿色の縁の深皿、
// アヒージョ・タパス・煮込みの一部は素焼きのカスエラ（小さな土鍋）、パエリア・フィデウアは取っ手つきの黒い鉄のパエジェーラ、
// カネロニ・アロス・アル・オルノは素焼きの耐熱皿。
// 材料は gohancho/packs/es.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, SY, T: TR } = W;

const KAKI = Q.RIM.kaki;
const plato = (p, o = {}) => Q.plate(p, { line: 'none', edge: KAKI, ...o });
const cuenco = (p, o = {}) => Q.shiroBowl(p, { rim: KAKI, line: 'none', ...o });
const hondo = (p, o = {}) => Q.fukazara(p, { line: KAKI, ...o });
const cazuela = (p, o = {}) => W.bowl(p, { outer: '#a8582e', inner: '#c87a4a', edge: '#e8b078', h: 34, cy: 88, fx: 54, gloss: .5, ...o });
const small = (p, o = {}) => W.sideBowl(p, { edge: KAKI, ...o });
const PARS = ['#3f8a2a', '#5aa83a'], GARLIC = ['#f2e0b0', '#e8c888'];
const lemon = (p, x, y, s = 14) => W.lemon(p, x, y, s, { wedge: true });
const ing = {
    chorizo: (p, x, y, s, r, i, liq) => W.sausageCoin(p, x, y, s * .42, { c: '#8a2010', inner: '#c8402a', liq }),
    morcilla: (p, x, y, s, r, i, liq) => W.sausageCoin(p, x, y, s * .42, { c: '#2e1a14', inner: '#4a2a22', liq }),
    panceta: (p, x, y, s, r, i, liq) => Q.prism(p, x, y, Q.square(s), s * .6, '#e8c8b0', { rot: r, sink: liq ? 2 : 0, liquid: liq, top: Q.lg(p, [[0, '#fbf2ea'], [.4, '#e8b8a8'], [.6, '#fbf0e4'], [1, '#d8a090']], 0, 0, 0, 1), line: .5 }),
    jamon: (p, x, y, s, r, i) => W.hamDice(p, x, y, s * .55, i).replace(/#ec9a94/g, '#b8403a').replace(/#f4b0a8/g, '#d8605a'),
    jamonSlice: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="${Q.blob(0, 0, s * .8, s * .4, 'js' + p.id + i, { n: 10, jit: .25 })}" fill="${Q.lg(p, [[0, '#d8605a'], [.7, '#b8403a'], [.85, '#f6e8e0'], [1, '#e8d0c0']], 0, 0, 0, 1)}" stroke="#8a2a24" stroke-width=".5"/></g>`,
    chickenGarlic: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e8b060', soak: '#a8642a', k: .45, sy: .72 }),
    chickenRoast: (p, x, y, s, r, i) => W.drumstick(p, x, y, s * 1.6, r, i, { c: '#b8682a', fried: false }),
    chickenRed: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e8a070', soak: '#b8401e', k: .5, sy: .72 }),
    beefStew: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#8a4a24', soak: '#5a2410', k: .5, sy: .72 }),
    meatball: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#a8642e', p.id + 'mb' + i, { hi: .6 }),
    tuna: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .8, '#c8907a', p.id + 'tu' + i, { h: s * .5, liq, top: Q.rg(p, [[0, '#f0c8b8'], [1, '#c8907a']], .4, .35, .8) }),
    tunaFlake: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .4, s * .28, '#d8b898', p.id + 'tn' + i, { n: 9, jit: .3, hi: .4 }),
    cod: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .8, s * .5, 8, '#f6f0e4', p.id + 'cd' + i, { rot: r, edgeC: '#e8dcc8' }),
    hake: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .8, s * .5, 8, '#f6f0e4', p.id + 'hk' + i, { rot: r, sear: '#e8d8b0', edgeC: '#e8dcc8' }),
    hakeBatter: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .8, s * .45, 7, '#f0c060', p.id + 'hb' + i, { rot: r, sear: '#d89a3a', edgeC: '#f6dca0' }),
    anchovy: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="M${f(-s * .7)},0 Q0,${f(-s * .22)} ${f(s * .6)},0 L${f(s * .75)},${f(-s * .12)} L${f(s * .72)},${f(s * .12)} L${f(s * .6)},0 Q0,${f(s * .22)} ${f(-s * .7)},0Z" fill="${Q.lg(p, [[0, '#f2d080'], [1, '#c8902e']], 0, 0, 0, 1)}" stroke="#8a5a1e" stroke-width=".5"/></g>`,
    squidRing: (p, x, y, s, r) => `<g ${TR(x, y, r)}><ellipse rx="${f(s * .5)}" ry="${f(s * .34)}" fill="none" stroke="#c8902e" stroke-width="${f(s * .24)}"/><ellipse rx="${f(s * .5)}" ry="${f(s * .34)}" fill="none" stroke="#f2d080" stroke-width="${f(s * .14)}" transform="translate(-.4 -.6)"/></g>`,
    squidInk: (p, x, y, s, r) => `<g ${TR(x, y, r)}><ellipse rx="${f(s * .5)}" ry="${f(s * .36)}" fill="none" stroke="#2e2420" stroke-width="${f(s * .2)}"/></g>`,
    padron: (p, x, y, s, r) => W.pod(p, x, y, s * 1.6, r, { c: '#4a8a2a', w: 7 }) + W.flecks(p, x, y - 2, s * .5, 4, 'pd' + x, ['#2e3a14', '#fbf6e0'], { ry: 2, s: 1.4 }),
    croqueta: (p, x, y, s, r) => `<g ${TR(x, y, r)}><rect x="${f(-s * .6)}" y="${f(-s * .28)}" width="${f(s * 1.2)}" height="${f(s * .56)}" rx="${f(s * .28)}" fill="${Q.lg(p, [[0, '#f0c070'], [.5, '#c8862e'], [1, '#8a5a1e']], 0, 0, 0, 1)}" stroke="#7a4a1a" stroke-width=".6"/></g>` + W.flecks(p, x, y - s * .1, s * .5, 8, 'cq' + x, ['#f6dca0', '#a8641e'], { ry: s * .15, s: 1 }),
    bravas: (p, x, y, s, r, i) => W.dice(p, x, y, s, '#c8862e', p.id + 'bv' + i, { h: s * .55, top: Q.rg(p, [[0, '#fbe0a0'], [.6, '#e8b058'], [1, '#c8802a']], .4, .35, .8) }) + `<path d="${Q.blob(x, y - s * .55, s * .3, s * .14, 'bvs' + i, { n: 8, jit: .3 })}" fill="#c8301a"/>`,
    potatoSlice: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#e8c070', { h: 2.4, top: Q.rg(p, [[0, '#fff2c0'], [.6, '#f6dc90'], [1, '#d8a850']], .4, .35, .8) }),
    chips: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .7, -s * .14], [s * .7, -s * .14], [s * .7, s * .14], [-s * .7, s * .14]], s * .26, '#e8b048', { rot: r, line: .4, top: Q.lg(p, [[0, '#fff2c0'], [1, '#f0c050']], 0, 0, 0, 1) }),
    artichoke: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .5, s * .4, '#a8b060', p.id + 'ar' + i, { n: 10, jit: .15, hi: .6, edge: '#5a6a2a' }) + `<path d="M${f(x - s * .3)},${f(y - s * .1)} q${f(s * .3)},${f(-s * .3)} ${f(s * .6)},0" stroke="#e8e0b0" stroke-width="1.2" fill="none"/>`,
    roastPepper: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -s * .2], [s * .8, -s * .24], [s * .8, s * .2], [-s * .8, s * .22]], 2, '#b8301e', { rot: r, line: .4, top: Q.lg(p, [[0, '#e8603a'], [1, '#a8281a']], 0, 0, 0, 1) }),
    roastAubergine: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -s * .2], [s * .8, -s * .24], [s * .8, s * .2], [-s * .8, s * .22]], 2, '#8a6a3a', { rot: r, line: .4, top: Q.lg(p, [[0, '#c8a070'], [1, '#7a5a30']], 0, 0, 0, 1) }),
    roastOnion: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .7, -s * .18], [s * .7, -s * .2], [s * .7, s * .18], [-s * .7, s * .2]], 2, '#c8a070', { rot: r, line: .4, top: Q.lg(p, [[0, '#f2dcb0'], [1, '#c8a070']], 0, 0, 0, 1) }),
    courgetteBatter: (p, x, y, s, r, i) => W.coin(p, x, y, s * .55, '#d8a040', { h: 3, top: Q.rg(p, [[0, '#fff0b0'], [.6, '#f2cc70'], [1, '#d8a040']], .4, .35, .8) }),
    aubergineFry: (p, x, y, s, r, i) => W.coin(p, x, y, s * .55, '#a8641e', { h: 3, top: Q.rg(p, [[0, '#f0c070'], [.6, '#d8902e'], [1, '#8a4a1e']], .4, .35, .8) }) + `<path d="M${f(x - s * .3)},${f(y - 4)} q${f(s * .3)},-3 ${f(s * .6)},0" stroke="#5a2a10" stroke-width="1.6" fill="none" opacity=".8"/>`,
    eggStuffed: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 30 - 15, { piped: true, yolk: '#f2d070' }),
    egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    eggFried: (p, x, y, s, r, i) => W.friedEgg(p, x, y, s * 2.2, i),
    grape: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .3)}" ry="${f(s * .26)}" fill="${Q.rg(p, [[0, '#f0f4c0'], [1, '#b8c870']], .35, .3, .8)}" stroke="#8a9a4a" stroke-width=".4"/>`,
    breadCube: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .7, '#c8862e', p.id + 'br' + i, { h: s * .5, liq, top: Q.rg(p, [[0, '#f6d890'], [1, '#d8a050']], .4, .35, .8) }),
    pear: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .8, '#c8c060', p.id + 'pe' + i, { h: s * .45, liq, top: Q.rg(p, [[0, '#fffbe0'], [1, '#f2ecc0']], .4, .35, .8) }),
    grelos: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.2, r, i % 2 ? '#2e5a1e' : '#3f7a2a', 'gr' + p.id + i, { wave: 2.4 }),
    bigBean: (p, x, y, s, r) => Q.bean(p, x, y, s * .9, r, '#f2ecd8'),
    redPepper: (p, x, y, s, r) => W.pepperStrip(p, x, y, s * 1.2, r, '#c8281a'),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(plato, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(cuenco, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}, v = hondo) => M(v, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}) => M(small, 'bowl', null, items, { minD: 7, ...o });
const pars = (n = 14) => [PARS[0], n, 1.6];
// パエジェーラ（取っ手つきの浅い鉄鍋）に、ご飯の層と具
const paellera = (p, c, items, { fl = [] } = {}) => { const V = Q.pan(p, { cx: 100, cy: 96, rx: 90, h: 10, outer: '#4e4640', lip: '#6a605a', inner: '#3e3630', handles: 'loop', handleC: '#4e4640', rim: '#6a605a' }), o = { cx: 100, cy: 98, sy: SY };
    const list = []; items.forEach(([k, n, s]) => { for (let j = 0; j < n; j++) list.push([k, s]); });
    const it = W.spots(p.id + 'pa', list.length, V.irx * .8, 13).map(([u, v, r], i) => { const [x, y] = at(o, u, v, 3); const [k, s] = list[i]; return [y, () => (ing[k] || W.ING[k])(p, x, y, s, r, i)]; });
    return V.s + `<g ${V.inside}><rect width="200" height="200" fill="${c}"/>${W.flecks(p, 100, 98, 82, 260, 'par', ['#f6dc90', '#e8c068', '#fbecb8', '#d8a848'], { ry: 44, s: 1.6 })}${byDepth(it)}${fl.map(([col, n, sz], j) => W.flecks(p, 100, 96, 70, n, 'paf' + j, col, { ry: 38, s: sz })).join('')}</g>` + V.shine(.5); };
const horno = (o) => p => W.bake(p, { base: '#a8582e', inner: '#c87a4a', ...o });

export default {
    // ---------- 主菜 ----------
    // トルティージャ・エスパニョーラ（じゃがいものオムレツ）、玉ねぎ（お好みで）
    es_tortilla: p => { const D = plato(p), o = D.o, [x, y] = at(o, 0, 0, 2), r = 50, h = 16; return D.s + `<path d="M${f(x - r)},${f(y - h)} L${f(x - r)},${f(y)} A${r},${f(r * SYF)} 0 0 0 ${f(x + r)},${f(y)} L${f(x + r)},${f(y - h)}Z" fill="${Q.lg(p, [[0, '#e8b048'], [.6, '#c8862e'], [1, '#8a5a1e']])}"/><ellipse cx="${f(x)}" cy="${f(y - h)}" rx="${r}" ry="${f(r * SYF)}" fill="${Q.rg(p, [[0, '#f6d070'], [.7, '#e8b048'], [1, '#c8862e']], .4, .35, .8)}" stroke="#a8702a" stroke-width=".7"/>` + `<path d="M${f(x)},${f(y - h)} L${f(x + r)},${f(y - h)} L${f(x + r)},${f(y)}" fill="none"/>` + `<path d="M${f(x + 8)},${f(y - h + 2)} L${f(x + r - 2)},${f(y - h - 6)} L${f(x + r - 2)},${f(y + 2)} L${f(x + 8)},${f(y + 10)}Z" fill="${Q.lg(p, [[0, '#fff2b0'], [1, '#f2d070']], 0, 0, 1, 0)}" stroke="#c8a040" stroke-width=".5"/>` + W.flecks(p, x + 30, y - 2, 12, 10, 'tl', ['#f8e8c0', '#e8c890'], { ry: 8, s: 2 }) + Q.shine(x - 26, y - h - 8, 20, -8, .7); },
    // レンテハス（チョリソ入りのレンズ豆の煮込み）: レンズ豆・チョリソ・じゃがいも・にんじん・玉ねぎ・ピーマン
    es_lentejas: S('#7a4a24', [['lentil', 20, 13], ['chorizo', 5, 15], ['potato', 3, 12], ['carrot', 4, 11]], { top: [['lentil', 18, 16], ['chorizo', 2, 15]], minD: 6 }),
    // アルボンディガス（肉団子のソース煮）: 合いびき肉・卵・パン・玉ねぎ・にんじん、グリンピース（お好みで）（カスエラ）
    es_albondigas: B('#b8642a', [['meatball', 9, 20], ['carrot', 3, 12], ['pea', 5, 12]], {}, cazuela),
    // メルルーサの衣揚げ、レモン、レタス（お好みで）
    es_merluza: P([['hakeBatter', 4, 26], ['lettuce', 3, 14]], { minD: 22, after: (o, D, p) => lemon(p, ...at(o, 50, 32), 15) }),
    // ポジョ・アル・アヒージョ（鶏のにんにく焼き）、パセリ
    es_pollo: B('#c8903a', [['chickenGarlic', 9, 20], ['garlic', 5, 13]], { flecks: [pars(16)] }, cazuela),
    // ポジョ・アル・オルノ（鶏とじゃがいものロースト）、レモン（お好みで）
    es_pollohorno: P([['chickenRoast', 4, 22], ['potatoRoast', 8, 15], ['onion', 3, 12]], { minD: 16, after: (o, D, p) => lemon(p, ...at(o, 50, 32), 14) }),
    // ペチューガス・エンパナーダス（鶏むねのカツ）、レモン
    es_pechugas: p => { const D = plato(p), o = D.o; return D.s + byDepth([[-16, -10, -10], [16, 10, 8]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.cutlet(p, x, y, 46, 24, r, { inner: '#fbf2e8', seed: 'pc' + i, cuts: 2 })]; })) + lemon(p, ...at(o, 50, 32), 16); },
    // チリンドロン（鶏のピーマンとトマト煮）: 鶏・赤と緑のピーマン・玉ねぎ・トマト、ハム（お好みで）
    es_chilindron: B('#c8401e', [['chickenRed', 7, 18], ['redPepper', 4, 13], ['pepperG', 3, 13], ['jamon', 3, 12]]),
    // ロモ・アドバード（豚ロースのマリネ焼き）とフライドポテト、ピーマン（お好みで）
    es_lomo: P([['porkLoin', 5, 22], ['chips', 10, 18], ['pepperG', 3, 12]], { minD: 12, ing: { ...ing, porkLoin: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .7, s * .45, 5, '#c8501e', p.id + 'pl' + i, { rot: r, sear: '#8a2a10', edgeC: '#f0c8a0' }) } }),
    // コスティージャス（豚スペアリブのオーブン焼き）、じゃがいも・玉ねぎ
    es_costillas: P([['rib', 6, 24], ['potatoRoast', 6, 14], ['onion', 3, 12]], { minD: 14, ing: { ...ing, rib: (p, x, y, s, r, i) => W.rib(p, x, y, s, r, i, { c: '#a8642e', glaze: '#c8862e' }) } }),
    // エストファド（牛肉とじゃがいもの煮込み）: 牛肉・じゃがいも・にんじん・玉ねぎ・ピーマン、グリンピース（お好みで）
    es_estofado: B('#7a3a1a', [['beefStew', 7, 19], ['potato', 4, 14], ['carrot', 4, 12], ['pea', 5, 12]]),
    // フィレテス・ルソス（スペインのハンバーグ）
    es_filetesrusos: P([['patty', 4, 30]], { minD: 30, H: 8, ing: { ...ing, patty: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .6, s * .45, i, { c: '#a8642e', n: 16, h: 6, rot: r }) } }),
    // なすの肉詰め（チーズ焼き）: なす・ひき肉・玉ねぎ・トマト・チーズ
    es_berenjenas: p => { const D = plato(p), o = D.o; return D.s + byDepth([[-18, -6, -10], [20, 8, -6]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => `<g ${TR(x, y, r)}><path d="M-44,0 C-44,-18 44,-18 44,0 C44,16 -44,16 -44,0Z" fill="#4a2038"/><path d="M-40,-2 C-40,-14 40,-14 40,-2 C40,8 -40,8 -40,-2Z" fill="#8a4a24"/><path d="${Q.blob(0, -4, 34, 7, 'bc' + i, { n: 12, jit: .2 })}" fill="${Q.rg(p, [[0, '#fff2c0'], [.6, '#f2c860'], [1, '#c8862e']], .4, .35, .8)}"/><path d="M42,-4 q8,-4 10,-12" stroke="#4a6a22" stroke-width="3" stroke-linecap="round" fill="none"/></g>` + W.flecks(p, x, y - 4, 28, 14, 'bf' + i, ['#c8782a', '#a8601e'], { ry: 5, s: 1.6 })]; })); },
    // バカラオ・コン・トマテ（干しだらのトマト煮）: たら・トマト・玉ねぎ・ピーマン、黒オリーブ（お好みで）（カスエラ）
    es_bacalao: B('#c8401e', [['cod', 4, 24], ['pepperG', 3, 13], ['olive', 4, 12]], {}, cazuela),
    // メルルーサ・エン・サルサ・ベルデ（パセリのソースとあさり）、グリンピース（お好みで）（カスエラ）
    es_merluzaverde: B('#c8d090', [['hake', 4, 24], ['clam', 5, 14], ['pea', 5, 12]], { flecks: [pars(20)] }, cazuela),
    // ボケロネス（片口いわしのフライ）、レモン
    es_boquerones: P([['anchovy', 14, 20]], { minD: 10, H: 12, after: (o, D, p) => lemon(p, ...at(o, 50, 32), 15) }),
    // ドラダ（鯛とじゃがいものオーブン焼き）: 鯛・じゃがいも・玉ねぎ・レモン
    es_dorada: p => { const D = Q.ovalPlate(p, { rim: KAKI, rz: 70, h: 14 }); const o = D.o || { cx: 100, cy: 98, sy: SYF }; return D.s + byDepth(W.spots('dp', 12, 60, 12, { ry: 30 }).map(([u, v, r], i) => { const [x, y] = at(o, u, v * .7, 2); return [y - 30, () => i % 3 ? ing.potatoSlice(p, x, y, 22, r, i) : W.ING.onion(p, x, y, 14, r)]; })) + W.wholeFish(p, 100, o.cy - 2, 140, -6, 1, { skin: '#c8a070', belly: '#f0e0c0', char: .4 }) + [-24, 0, 24].map(dx => `<path d="M${100 + dx - 4},${f(o.cy - 12)} l8,0" stroke="#fff" stroke-width="2.4" opacity=".6"/>`).join('') + lemon(p, 150, o.cy + 18, 14) + W.flecks(p, 100, o.cy - 6, 50, 12, 'df', PARS, { ry: 8, s: 1.6 }); },
    // チピロネス・エン・ス・ティンタ（いかの墨煮と白いご飯）: いか・玉ねぎ・ピーマン・トマト
    es_calamares: p => { const D = plato(p), o = D.o; return D.s + W.riceMound(p, ...at(o, 40, -14), 28, 24, { sy: SYF }) + W.pool(p, ...at(o, -16, 6), 50, '#2e2420', 'ci') + byDepth(W.spots('cis', 12, 38, 12).map(([u, v, r], i) => { const [x, y] = at(o, u - 16, v + 6, 4); return [y, () => ing.squidInk(p, x, y, 18, r)]; })) + W.flecks(p, ...at(o, -16, 0), 30, 8, 'cif', PARS, { ry: 10, s: 1.6 }); },
    // ウエボス・ロトス（ポテトに崩した目玉焼きとハム）
    es_huevosrotos: P([['chips', 22, 18], ['jamonSlice', 4, 18]], { minD: 7, after: (o, D, p) => W.friedEgg(p, o.cx - 8, o.cy - 22, 40, 1) + W.friedEgg(p, o.cx + 16, o.cy - 18, 36, 2) }),
    // メネストラ（春野菜とハム）: アーティチョーク・いんげん・グリンピース・にんじん・じゃがいも、ハム・ゆで卵（お好みで）
    es_menestra: B('#e0c890', [['artichoke', 4, 16], ['greenBean', 4, 8], ['pea', 8, 12], ['carrot', 4, 12], ['potato', 3, 12], ['jamon', 3, 11], ['egg', 1, 14]]),
    // ガンバス・アル・アヒージョ（えびのにんにく油）、パン・パセリ（カスエラ）
    es_gambas: B('#e8a030', [['shrimp', 12, 16], ['garlic', 5, 12], ['chiliR', 3, 12]], { flecks: [pars(12)] }, cazuela),
    // カラマレス・ア・ラ・ロマーナ（いかリングのフライ）、レモン
    es_calamaresromana: P([['squidRing', 16, 20]], { minD: 10, H: 12, after: (o, D, p) => lemon(p, ...at(o, 50, 32), 15) }),

    // ---------- ご飯・麺 ----------
    // パエリア・ミクスタ: 米・鶏・えび・赤ピーマン・トマト・レモン、いか・グリンピース（お好みで）
    es_paella: p => paellera(p, '#e8a838', [['chickenRed', 5, 18], ['prawn', 4, 18], ['squidRing', 3, 14], ['redPepper', 4, 14], ['pea', 6, 12]]) + lemon(p, 150, 120, 16),
    // アロス・コン・ポジョ（鶏のご飯）: 米・鶏・赤ピーマン・トマト、グリンピース（お好みで）
    es_arrozpollo: p => paellera(p, '#e0a040', [['chickenRed', 7, 18], ['redPepper', 5, 14], ['pea', 6, 12]]),
    // アロス・アル・オルノ（バレンシアの米のオーブン焼き）: 米・豚・モルシージャ・ひよこ豆・じゃがいも・トマト（素焼きの耐熱皿）
    es_arrozhorno: p => W.bake(p, { base: '#a8582e', inner: '#c87a4a', c: '#e0a040', fl: ['#f6dc90', '#e8c068', '#fbecb8', '#d8a848'], n: 200, top: (o, V, pp) => byDepth(W.spots('ah', 14, 60, 18, { ry: 34 }).map(([u, v, r], i) => { const [x, y] = at(o, u, v * .6, 3); return [y, () => [ing.morcilla, ing.panceta, W.ING.chickpea, ing.potatoSlice, W.ING.tomato, W.ING.chickpea, W.ING.chickpea][i % 7](pp, x, y, 16, r, i)]; })) }),
    // アロス・ア・ラ・クバーナ（ご飯と目玉焼きとトマトソース）、揚げバナナ（お好みで）
    es_cubana: p => { const D = plato(p), o = D.o; return D.s + W.riceMound(p, ...at(o, -20, -6), 42, 32, { sy: SYF }) + W.pool(p, ...at(o, 30, 16), 30, '#c8301a', 'cb') + W.friedEgg(p, ...at(o, 30, -12, 4), 48, 1) + W.ING.plantain(p, ...at(o, -44, 34), 26) + W.ING.plantain(p, ...at(o, -26, 40), 26); },
    // マカロネス（チョリソとトマトのマカロニ）、粉チーズ（お好みで）
    es_macarrones: B('#c8401e', [['penne', 18, 16], ['chorizo', 6, 15]], { minD: 8, flecks: [['#f8f0d0', 30, 1.6]], ing: { ...ing, penne: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .5, -s * .2], [s * .5, -s * .2], [s * .5, s * .2], [-s * .5, s * .2]], s * .3, '#e8a050', { rot: r, line: .4, top: Q.lg(p, [[0, '#f8d090'], [1, '#d8803a']], 0, 0, 0, 1) }) } }),
    // カネロニ（カタルーニャの肉のカネロニ）: ベシャメル・チーズ（素焼きの耐熱皿）
    es_canelones: horno({ /*fx*/pattern: 'rolls', blister: 8, scoop: { layers: [['#e8c070', .12], ['#f6ecd0', .22], ['#f2dca0', .66]], dots: [['#a8643a', 6, 4]] }, /*xf*/ c: '#fbf2dc', fl: ['#e8b048', '#c8862e', '#c8401e'], n: 100, top: (o, V, pp) => [-28, 0, 28].map(v => { const [x, y] = at(o, 0, v); return `<path d="M${f(x - 66)},${f(y)} Q${f(x)},${f(y - 8)} ${f(x + 66)},${f(y)}" stroke="#e8c890" stroke-width="2" fill="none" opacity=".7"/>`; }).join('') }),
    // フィデウア（魚介のショートパスタのパエリア）: 麺・えび・いか・トマト、アリオリ（お好みで）
    es_fideua: p => paellera(p, '#d8903a', [['prawn', 5, 18], ['squidRing', 5, 14], ['noodleBit', 14, 12]], { fl: [[['#c8782a', '#a8601e'], 30, 1.6]] }) + `<ellipse cx="150" cy="122" rx="12" ry="7" fill="#fbf6e0" stroke="#d8c890" stroke-width=".6"/>`,

    // ---------- 副菜 ----------
    // ミックスサラダ: レタス・トマト・玉ねぎ・ツナ・ゆで卵・グリーンオリーブ、コーン（お好みで）
    es_ensalada: P([['lettuce', 8, 16], ['tomato', 6, 12], ['onion', 3, 12], ['tunaFlake', 4, 14], ['egg', 2, 14], ['greenOlive', 4, 12], ['corn', 6, 12]]),
    // ピミエントス・デ・パドロン（ししとうの素揚げ）
    es_pimientos: P([['padron', 12, 16]], { minD: 12, flecks: [['#fbf8f0', 20, 1.4]] }),
    // チャンピニョネス・アル・アヒージョ（マッシュルームのにんにく炒め）、パセリ（カスエラ）
    es_champinones: B('#c8903a', [['mushroom', 14, 16], ['garlic', 4, 12]], { flecks: [pars(16)] }, cazuela),
    // エンサラディージャ（ポテトサラダ）: じゃがいも・にんじん・卵・ツナ・マヨネーズ、グリンピース・オリーブ（お好みで）
    es_ensaladilla: K([['potato', 12, 13], ['carrot', 6, 10], ['pea', 6, 12], ['greenOlive', 3, 12]], { base: '#f6ecd0' }),
    // ピスト（スペインのラタトゥイユ）: ズッキーニ・ピーマン・玉ねぎ・トマト、目玉焼き（お好みで）
    es_pisto: B('#c8501e', [['zucchini', 6, 14], ['redPepper', 4, 13], ['pepperG', 4, 13], ['eggFried', 1, 20]], {}, cazuela),
    // フディアス・コン・ハモン（いんげんと生ハム）、じゃがいも（お好みで）
    es_judias: P([['greenBean', 20, 10], ['jamon', 8, 12], ['potato', 3, 11]]),
    // エスピナカス・コン・ガルバンソス（ほうれん草とひよこ豆）: ほうれん草・ひよこ豆・パン（カスエラ）
    es_espinacas: B('#6a7a2a', [['spinach', 10, 14], ['chickpea', 12, 14]], { minD: 8 }, cazuela),
    // パタタス・ア・ロ・ポブレ（じゃがいもと玉ねぎとピーマンの揚げ煮）
    es_patataspobre: P([['potatoSlice', 16, 20], ['onion', 6, 14], ['pepperG', 5, 12]]),
    // パタタス・ブラバス、アリオリ（お好みで）
    es_bravas: P([['bravas', 14, 16]], { minD: 12, H: 14, after: (o, D, p) => W.drizzle([[o.cx - 30, o.cy - 14], [o.cx - 10, o.cy - 20], [o.cx + 10, o.cy - 14], [o.cx + 30, o.cy - 20]], '#fbf6e0', 2.4) }),
    // ピピラーナ（アンダルシアの刻みサラダ）: トマト・ピーマン・きゅうり・玉ねぎ、ツナ・ゆで卵（お好みで）
    es_pipirrana: K([['tomato', 12, 12], ['pepperG', 6, 10], ['cucumber', 6, 11], ['onion', 3, 10], ['tunaFlake', 3, 12]]),
    // エスカリバーダ（焼き野菜）: なす・赤ピーマン・玉ねぎ
    es_escalivada: P([['roastPepper', 6, 22], ['roastAubergine', 5, 22], ['roastOnion', 4, 20]], { minD: 12, H: 10 }),
    // アンダルシアのにんじんのマリネ
    es_zanahorias: K([['carrot', 22, 14]], { base: '#f0a050', flecks: [['#a8743a', 14, 1.2], pars(8)] }),
    // アルカチョファス・コン・ハモン（アーティチョークと生ハム）、レモン
    es_alcachofas: P([['artichoke', 10, 18], ['jamon', 8, 12]], { minD: 12, after: (o, D, p) => lemon(p, ...at(o, 50, 32), 14) }),
    // カリフラワーのにんにくとパプリカ炒め
    es_coliflor: P([['cauliflower', 12, 15]], { minD: 12, flecks: [['#c8401e', 30, 1.4], ['#f2e0b0', 10, 1.6]] }),
    // なすの揚げものとサトウキビの蜂蜜
    es_berenjenasmiel: P([['aubergineFry', 10, 24]], { minD: 16, H: 10 }),
    // 野生のアスパラガスの鉄板焼き
    es_esparragos: p => { const D = plato(p), o = D.o; return D.s + byDepth(Array.from({ length: 8 }, (_, i) => { const [x, y] = at(o, -4 + i * 1.5, -24 + i * 7, 4); return [y, () => W.asparagus(p, x, y, 100, -8)]; })) + W.flecks(p, o.cx, o.cy - 4, 40, 16, 'esf', ['#fbf8f0', '#5a3a1e'], { ry: 14, s: 1.2 }); },
    // アセルガス（ふだん草とじゃがいも）
    es_acelgas: B('#c8c080', [['chard', 10, 16], ['potato', 5, 13]], { ing: { ...ing, chard: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.2, r, '#3f7a2a', 'ch' + p.id + i, { wave: 2.4 }) + W.ING.celery(p, x - 4, y + 2, s * .6, r).replace(/#9ac860/g, '#f2ecd8') } }),
    // ギサンテス・コン・ハモン（グリンピースと生ハム）: グリンピース・ハム・玉ねぎ
    es_guisantes: B('#c8c890', [['pea', 30, 13], ['jamon', 8, 12]], { minD: 6 }, cazuela),
    // クロケタス（生ハムのコロッケ）
    es_croquetas: P([['croqueta', 9, 22]], { minD: 16, H: 12 }),
    // パン・コン・トマテ、生ハム（お好みで）
    es_pantumaca: p => { const D = plato(p), o = D.o; return D.s + byDepth([[-24, -10, -10], [22, 10, 6]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.bread(p, x, y, 72, r, { c: '#d8603a', crust: '#a8641e', toast: .5 }) + W.flecks(p, x, y - 4, 20, 10, 'pt' + i, ['#e8401e', '#f6e8a0'], { ry: 8, s: 1.6 }) + (i ? ing.jamonSlice(p, x + 4, y - 6, 26, -10, i) : '')]; })); },
    // オリーブのマリネ: グリーンオリーブ・レモン、玉ねぎ（お好みで）
    es_aceitunas: K([['greenOlive', 30, 16], ['lemonPeel', 3, 12]], { minD: 6, ing: { ...ing, lemonPeel: (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, -1.6], [s / 2, -1.6], [s / 2, 1.6], [-s / 2, 1.6]], 2, '#f2d040', { rot: r, line: .35 }) } }),
    // ひよこ豆のサラダ: ひよこ豆・トマト・ピーマン・玉ねぎ、ツナ・ゆで卵（お好みで）
    es_ensaladagarbanzos: K([['chickpea', 20, 14], ['tomato', 6, 11], ['redPepper', 4, 10], ['pepperG', 4, 10], ['onion', 3, 10]], { minD: 6 }),
    // ポロねぎのヴィネグレット: ポロねぎ・ゆで卵・赤ピーマン・玉ねぎ
    es_puerros: p => { const D = plato(p), o = D.o; return D.s + byDepth([-18, -4, 10, 24].map((v, i) => { const [x, y] = at(o, -4, v, 4); return [y, () => `<g ${TR(x, y, -8)}><rect x="-50" y="-7" width="100" height="14" rx="7" fill="${Q.lg(p, [[0, '#f6f8e0'], [.6, '#dce8b0'], [1, '#a8c070']], 0, 0, 0, 1)}" stroke="#8aa858" stroke-width=".6"/></g>`]; })) + W.flecks(p, o.cx, o.cy - 8, 46, 40, 'pv', ['#f6d040', '#fbf8f0', '#c8281a', '#e8e0b0'], { ry: 16, s: 2 }); },
    // レポージョ（キャベツのにんにく炒め）、じゃがいも・パンセタ（お好みで）
    es_repollo: P([['cab', 30, 15], ['panceta', 3, 10]], { flecks: [['#f2e0b0', 10, 1.6]], ing: { ...ing, cab: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#e0ecb8' : '#c8dc98', { rot: r, line: .3 }) } }),
    // ウエボス・レジェーノス（ツナの詰め卵）
    es_huevosrellenos: P([['eggStuffed', 6, 20]], { minD: 22, H: 6, flecks: [['#c8401e', 10, 1.2]] }),
    // プレ（マッシュポテト）
    es_pure: K([], { base: '#f8e8a8', H: 22, groove: true, mash: 'potato' }),
    // ズッキーニの衣揚げ
    es_calabacin: P([['courgetteBatter', 10, 24]], { minD: 16, H: 10 }),

    // ---------- 汁物 ----------
    // ガスパチョ（冷たいトマトのスープ）: トマト・きゅうり・ピーマン、パン（お好みで）
    es_gazpacho: S('#d8502a', [['cucumber', 4, 11], ['pepperG', 3, 10], ['breadCube', 4, 12]], { minD: 10, oil: [10, '#c8b040'] }),
    // ズッキーニのクリームスープ、チーズ（お好みで）
    es_crema: S('#b8c870', [], { top: [['zucchini', 5, 16]], cream: '#fbf6e8' }),
    // サルモレホ（濃いトマトのクリーム）、ゆで卵・生ハム（お好みで）
    es_salmorejo: S('#e8703a', [['egg', 2, 14], ['jamon', 6, 12]], { minD: 12, oil: [8, '#c8b040'] }),
    // アホブランコ（アーモンドとにんにくの冷たいスープ）、白ぶどう（お好みで）
    es_ajoblanco: S('#f6f2e4', [['grape', 6, 14]], { minD: 12, oil: [8, '#c8b040'] }),
    // ソパ・デ・アホ（にんにくとパンのスープ）: パン・生ハム・卵
    es_sopaajo: S('#c8803a', [['breadCube', 6, 14], ['jamon', 5, 12], ['eggRibbon', 3, 14]], { minD: 10, flecks: [pars(8)] }),
    // ソパ・デ・フィデオス（鶏の細麺スープ）: 鶏・にんじん・ポロねぎ・玉ねぎ・細麺
    es_sopafideos: S('#f0d898', [['noodleBit', 16, 12], ['chicken', 3, 12], ['carrot', 3, 10]], { minD: 8, flecks: [pars(8)] }),
    // コシード・マドリレーニョ（ひよこ豆と肉の煮込み）: ひよこ豆・牛すね・鶏・豚バラ・チョリソ・じゃがいも・にんじん
    es_cocido: B('#d8a050', [['chickpea', 10, 14], ['beefStew', 2, 16], ['chicken', 2, 15], ['panceta', 2, 14], ['chorizo', 3, 15], ['potato', 2, 14], ['carrot', 2, 12], ['cabbage', 1, 14]], { minD: 10 }),
    // ファバダ（アストゥリアスの白いんげんの煮込み）: 豆・チョリソ・モルシージャ・パンセタ（カスエラ）
    es_fabada: B('#c8803a', [['bigBean', 16, 14], ['chorizo', 4, 16], ['morcilla', 3, 16], ['panceta', 3, 14]], { minD: 8 }, cazuela),
    // カルド・ガジェゴ（青菜と豆とじゃがいものスープ）: 白いんげん・スペアリブ・じゃがいも・青菜、チョリソ（お好みで）
    es_caldogallego: S('#e0d0a0', [['grelos', 6, 14], ['whiteBean', 8, 13], ['potato', 4, 13], ['chorizo', 2, 14]], { top: [['whiteBean', 10, 16]], minD: 9 }),
    // ポタヘ（ひよこ豆とほうれん草と干しだらの煮込み）: ひよこ豆・たら・ほうれん草・ゆで卵・玉ねぎ・トマト
    es_potaje: S('#c8903a', [['chickpea', 14, 14], ['spinach', 5, 13], ['cod', 2, 16], ['egg', 2, 14]], { minD: 8 }),
    // マルミタコ（バスクのまぐろとじゃがいもの煮込み）: まぐろ・じゃがいも・玉ねぎ・ピーマン・トマト
    es_marmitako: S('#c8702a', [['tuna', 5, 16], ['potato', 5, 14], ['pepperG', 3, 12]], { minD: 10 }),
    // 魚と魚介のスープ: メルルーサ・えび・パン・トマト、あさり（お好みで）
    es_sopapescado: S('#d8803a', [['hake', 2, 18], ['prawn', 3, 16], ['clam', 4, 13], ['breadCube', 3, 11]], { minD: 10, flecks: [pars(10)] }),
    // ポルサルダ（バスクのポロねぎとじゃがいものスープ）
    es_porrusalda: S('#ece0b0', [['leek', 10, 14], ['potato', 5, 13], ['carrot', 3, 11]], { minD: 8 }),
    // かぼちゃのクリームスープ
    es_cremacalabaza: S('#f0a030', [], { top: [['pumpkin', 4, 15], ['pumpkinSeed', 6, 14]], cream: '#fbf6e8', flecks: [pars(6)] }),
    // ポロねぎのクリームスープ
    es_cremapuerros: S('#e8e4c0', [['leek', 3, 12]], { top: [['leek', 6, 15]], minD: 12, cream: '#fbf8ee' }),
    // マッシュルームのクリームスープ
    es_cremachampi: S('#c8a878', [['mushroom', 3, 12]], { top: [['mushroom', 5, 16]], minD: 12, cream: '#fbf6e8' }),
    // にんじんのクリームスープ、チーズ（お好みで）
    es_cremazanahoria: S('#f0902a', [], { top: [['carrot', 7, 15]], cream: '#fbf6e8' }),
    // 野菜のピュレスープ
    es_purever: S('#d8a850', [], { top: [['carrot', 3, 13], ['potato', 2, 13], ['zucchini', 2, 13], ['greenBean', 2, 9], ['leek', 2, 13]], flecks: [pars(10), ['#f8f0d0', 6, 1.4]] }),
    // パタタス・ア・ラ・リオハナ（チョリソとじゃがいもの煮込み）
    es_riojana: S('#c8401e', [['potato', 7, 15], ['chorizo', 5, 15], ['pepperG', 2, 12]], { minD: 10 }),
    // ガスパチュエロ（マラガの温かい魚のスープとマヨネーズ）: 魚・じゃがいも・マヨネーズ、えび（お好みで）
    es_gazpachuelo: S('#f6ecc8', [['hake', 2, 18], ['potato', 4, 13], ['shrimp', 3, 13]], { minD: 10 }),
    // トマトとパンのスープと卵: トマト・玉ねぎ・ピーマン・パン・卵
    es_sopatomate: S('#d0502a', [['breadCube', 4, 12], ['eggRibbon', 3, 14], ['pepperG', 2, 10]], { minD: 10 }),
    // オジャ・ヒターナ（ひよこ豆とかぼちゃと洋梨の煮込み）: ひよこ豆・かぼちゃ・いんげん・じゃがいも・洋梨・トマト
    es_ollagitana: S('#d8903a', [['chickpea', 10, 14], ['pumpkin', 3, 13], ['greenBean', 3, 8], ['potato', 2, 12], ['pear', 2, 13]], { minD: 9 }),
};
