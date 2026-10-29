// ドイツ（de_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: ふだんの皿は苔色の縁（#6a7a4a）の白い平皿、汁物・アイントプフは苔色の線の白い深皿、
// グラタン・ケーゼシュペッツレは生成りの耐熱皿、サラダ・付け合わせは白い小鉢、アーベントブロートは木の板。
// 材料は gohancho/packs/de.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, T: TR } = W;

const MOSS = '#6a7a4a';
const teller = (p, o = {}) => Q.plate(p, { line: 'none', edge: MOSS, ...o });
const suppenteller = (p, o = {}) => Q.fukazara(p, { line: MOSS, ...o });
const schale = (p, o = {}) => W.sideBowl(p, { edge: MOSS, ...o });
const PARS = ['#3f8a2a', '#5aa83a'], GRAVY = '#6a3418', CHIVE = '#4a9a2c';
const lemon = (p, x, y, s = 14) => W.lemon(p, x, y, s, { wedge: true });
const mash = (p, x, y, rx, H = 18, seed = 'm') => W.mound(p, x, y, rx, H, '#f6ecc8', seed, SYF) + W.flecks(p, x, y - H * .6, rx * .7, 10, seed + 'f', ['#e8d8a8', '#c8a060'], { ry: rx * .25, s: 1.8 });
const ing = {
    wurst: (p, x, y, s, r, i, liq) => W.sausageCoin(p, x, y, s * .42, { c: '#b8604a', inner: '#e8a090', liq }),
    smoked: (p, x, y, s, r, i, liq) => W.sausageCoin(p, x, y, s * .42, { c: '#8a3a1e', inner: '#c8705a', liq }),
    wurstLong: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * 1.1, s * .3, s * .3, '#b8603a', p.id + 'wl' + i, { rot: r, sear: '#7a3014', jit: .03 }),
    bacon: (p, x, y, s, r, i) => W.baconBit(p, x, y, s * .55, i),
    beefStew: (p, x, y, s, r, i, liq) => Q.soakLump(p, x, y, s, i, { c: '#8a4a24', soak: '#5a2410', k: .5, sy: .72 }),
    porkStew: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#c8946a', soak: '#8a5a2a', k: .45, sy: .72 }),
    chickenCream: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#f2e0c0', soak: '#d8b080', k: .35, sy: .72 }),
    celeriac: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .8, '#d8d0b0', p.id + 'ce' + i, { h: s * .45, liq, top: Q.rg(p, [[0, '#fbf8ec'], [1, '#ece4cc']], .4, .35, .8) }),
    swede: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .8, '#e8a840', p.id + 'sw' + i, { h: s * .45, liq, top: Q.rg(p, [[0, '#ffe8a0'], [1, '#f0c060']], .4, .35, .8) }),
    kohlrabi: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .8, '#c8d8a0', p.id + 'kr' + i, { h: s * .45, liq, top: Q.rg(p, [[0, '#fbfcf0'], [1, '#e8f0d0']], .4, .35, .8) }),
    gherkin: (p, x, y, s) => W.coin(p, x, y, s * .38, '#5a7a2a', { h: 1.8, top: Q.rg(p, [[0, '#d8e0a0'], [.7, '#a8b860'], [1, '#5a7a2a']], .4, .35, .8) }),
    redCab: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#7a2a5a' : '#9a3a6a', { rot: r, line: .3 }),
    whiteCab: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#f2f2dc' : '#e0ecc0', { rot: r, line: .3 }),
    kraut: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1], [s / 2, -1], [s / 2, 1], [-s / 2, 1]], 1.2, i % 2 ? '#efe8c0' : '#e0d8a0', { rot: r, line: .25 }),
    savoy: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.2, r, i % 2 ? '#8ab858' : '#a8c870', 'sv' + p.id + i, { wave: 3.4 }),
    sprout: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s * .9, '#6a9a3a', p.id + 'sp' + i, { hi: .5, edge: '#3f6a22' }),
    spaetzle: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .5)},0 Q0,${f(-s * .25)} ${f(s * .5)},${f(s * .1)}" stroke="#d8b050" stroke-width="${f(s * .3)}" fill="none" stroke-linecap="round"/><path d="M${f(-s * .5)},0 Q0,${f(-s * .25)} ${f(s * .5)},${f(s * .1)}" stroke="#f6e090" stroke-width="${f(s * .18)}" fill="none" stroke-linecap="round"/></g>`,
    schupf: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .6, 0], [-s * .3, -s * .18], [s * .3, -s * .18], [s * .6, 0], [s * .3, s * .18], [-s * .3, s * .18]], s * .3, '#d8a048', { rot: r, line: .45, top: Q.lg(p, [[0, '#fbe0a0'], [1, '#e0b058']], 0, 0, 0, 1) }),
    maultasche: (p, x, y, s, r, i) => Q.prism(p, x, y, Q.square(s), s * .3, '#d8a048', { rot: r, line: .5, top: Q.rg(p, [[0, '#fbe8b0'], [.6, '#f0c870'], [1, '#c8902e']], .4, .35, .8) }),
    noodleRibbon: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .6)},0 Q0,${f(-s * .3)} ${f(s * .6)},${f(s * .1)}" stroke="#e8c060" stroke-width="${f(s * .3)}" fill="none" stroke-linecap="round"/><path d="M${f(-s * .6)},0 Q0,${f(-s * .3)} ${f(s * .6)},${f(s * .1)}" stroke="#fbe8a0" stroke-width="${f(s * .16)}" fill="none" stroke-linecap="round"/></g>`,
    pastaSpiral: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .5)},0 q${f(s * .25)},${f(-s * .3)} ${f(s * .5)},0 t${f(s * .5)},0" stroke="#e0c070" stroke-width="${f(s * .28)}" fill="none" stroke-linecap="round"/></g>`,
    potatoBoiled: (p, x, y, s, r, i) => Q.glossLump(p, x, y, s, i, { c: '#f0d690' }),
    bratkartoffel: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#c8862e', { h: 2.4, top: Q.rg(p, [[0, '#fbe0a0'], [.6, '#e8b058'], [.9, '#c8802a'], [1, '#9a5a1a']], .4, .35, .8) }),
    knoedel: (p, x, y, s, r, i) => W.ball(p, x, y - s * .3, s, '#f2e8d0', p.id + 'kn' + i, { hi: .6, edge: '#c8b890' }),
    breadKnoedel: (p, x, y, s, r, i) => W.ball(p, x, y - s * .3, s, '#e8d0a0', p.id + 'bk' + i, { hi: .6, edge: '#b8945a' }) + W.flecks(p, x, y - s * .4, s * .3, 6, 'bkf' + i, [PARS[0], '#c8a060'], { ry: s * .2, s: 1.2 }),
    meatball: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#d8c0a0', p.id + 'kl' + i, { hi: .6, edge: '#a8906a' }),
    roulade: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><rect x="${f(-s * .6)}" y="${f(-s * .32)}" width="${f(s * 1.2)}" height="${f(s * .64)}" rx="${f(s * .3)}" fill="${Q.lg(p, [[0, '#a8643a'], [.5, '#7a3a1a'], [1, '#4a2010']], 0, 0, 0, 1)}" stroke="#3a1a0a" stroke-width=".6"/><path d="M${f(-s * .2)},${f(-s * .32)} l0,${f(s * .64)} M${f(s * .2)},${f(-s * .32)} l0,${f(s * .64)}" stroke="#e8dcc0" stroke-width="1.2"/></g>`,
    cabbageRoll: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><rect x="${f(-s * .6)}" y="${f(-s * .34)}" width="${f(s * 1.2)}" height="${f(s * .68)}" rx="${f(s * .32)}" fill="${Q.lg(p, [[0, '#e8ecc0'], [.5, '#c8d098'], [1, '#98a868']], 0, 0, 0, 1)}" stroke="#7a8a4a" stroke-width=".6"/><path d="M${f(-s * .4)},${f(-s * .1)} q${f(s * .4)},${f(-s * .2)} ${f(s * .8)},0" stroke="#f6f8e0" stroke-width="1" fill="none"/></g>`,
    stuffedPepper: (p, x, y, s, r, i) => W.ball(p, x, y - s * .3, s, ['#c8281a', '#f2b82a', '#3f8a2a'][i % 3], p.id + 'sp' + i, { hi: .7 }) + W.mound(p, x, y - s * .8, s * .32, 4, '#8a4a24', 'spm' + i, .5),
    egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    eggWhole: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, 0),
    herring: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="M${f(-s)},0 Q0,${f(-s * .3)} ${f(s)},0 Q0,${f(s * .25)} ${f(-s)},0Z" fill="${Q.lg(p, [[0, '#8a8478'], [.4, '#c8b8a8'], [1, '#f0e0d8']], 0, 0, 0, 1)}" stroke="#6a6458" stroke-width=".6"/></g>`,
    asparagusW: (p, x, y, s, r) => `<g ${TR(x, y, r)}><rect x="${f(-s)}" y="-3.4" width="${f(s * 2)}" height="6.8" rx="3.4" fill="${Q.lg(p, [[0, '#fbf8e8'], [.6, '#efe8cc'], [1, '#d8d0a8']], 0, 0, 0, 1)}" stroke="#c8c098" stroke-width=".5"/><path d="M${f(s - 4)},-3 q4,3 0,6" fill="#e8dcb0"/></g>`,
    radish: (p, x, y, s) => W.coin(p, x, y, s * .4, '#c8283a', { h: 1.2, top: Q.rg(p, [[0, '#ffffff'], [.8, '#f6eeee'], [.9, '#e86a7a'], [1, '#c8283a']], .4, .35, .8) }),
    lambLettuce: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * .8, r, i % 2 ? '#3f7a2a' : '#5a9a3a', 'fs' + p.id + i, { wave: .6 }),
    crouton: (p, x, y, s, r, i) => W.dice(p, x, y, s * .6, '#c8862e', p.id + 'cr' + i, { h: s * .45, top: Q.rg(p, [[0, '#f6d890'], [1, '#d8a050']], .4, .35, .8) }),
    pancakeStrip: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .6, -1.6], [s * .6, -1.6], [s * .6, 1.6], [-s * .6, 1.6]], 1.4, '#e8c070', { rot: r, line: .35 }),
    griess: (p, x, y, s, r, i) => Q.lump(p, x, y - s * .2, s * .6, s * .38, '#f2e4b8', p.id + 'gn' + i, { n: 12, jit: .08, hi: .6, edge: '#c8b080' }),
    custard: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .6, '#e8c860', p.id + 'cu' + i, { h: s * .35, liq, top: Q.rg(p, [[0, '#fff2b0'], [1, '#f2d070']], .4, .35, .8) }),
    smokedPork: (p, x, y, s, r, i, liq) => W.cutSlab(p, x, y, s * .6, s * .4, 5, '#e8a090', p.id + 'kp' + i, { rot: r, sear: '#a8503a', edgeC: '#f6e0d0' }),
    barley: (p, x, y) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.6" fill="#efe2c0" stroke="#c8b080" stroke-width=".3"/>`,
    walnut: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .36, s * .28, '#a8743a', p.id + 'wn' + i, { n: 10, jit: .4, hi: .3 }),
    apple: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#c8281e', p.id + 'ap' + i, { h: s * .45, top: Q.rg(p, [[0, '#fffbe8'], [1, '#f2e6c0']], .4, .35, .8) }),
    cucumberBraise: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .8, '#5a8a2a', p.id + 'cb' + i, { h: s * .45, liq, top: Q.rg(p, [[0, '#f0f6d8'], [1, '#c8dca0']], .4, .35, .8) }),
    ham: (p, x, y, s, r, i) => W.hamDice(p, x, y, s * .55, i),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(teller, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(suppenteller, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}) => M(suppenteller, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}) => M(schale, 'bowl', null, items, { minD: 7, ...o });
const pars = (n = 12) => [PARS[0], n, 1.6];
const auflauf = (o) => p => W.bake(p, { base: '#e8dcc0', inner: '#f6efe2', ...o });
// 主のものと付け合わせ・ソースの皿（全体を 1.3 倍に）
const plateOf = (draw) => p => { const D = teller(p), o = D.o; return D.s + W.grow(o.cx, o.cy, 1.3, draw(p, o)); };
const side = (p, o, list) => byDepth(list.map(([k, u, v, s, r = 0], i) => { const [x, y] = at(o, u, v, 4); return [y, () => (ing[k] || W.ING[k])(p, x, y, s, r, i)]; }));

export default {
    // ---------- 主菜 ----------
    // フリカデレ（ドイツのハンバーグ）
    de_frikadellen: P([['patty', 3, 32]], { minD: 32, H: 8, ing: { ...ing, patty: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .6, s * .45, i, { c: '#a8642e', n: 16, h: 7, rot: r }) }, after: (o, D, p) => W.flecks(p, ...at(o, 44, 30), 10, 6, 'fk', ['#e8b020'], { ry: 4, s: 2.4 }) }),
    // シュニッツェル（豚のカツ）、レモン
    de_schnitzel: p => { const D = teller(p), o = D.o, [x, y] = at(o, -8, -2, 4); return D.s + `<path d="${Q.blob(x, y, 60, 32, 'sn', { n: 14, jit: .12 })}" fill="${Q.rg(p, [[0, '#f6d080'], [.6, '#e0a848'], [1, '#a8702a']], .4, .35, .8)}" stroke="#8a5a1e" stroke-width=".8"/>` + W.flecks(p, x, y, 50, 70, 'snf', ['#fbe8a8', '#c88a3a', '#e8b058'], { ry: 26, s: 1.4 }) + lemon(p, ...at(o, 50, 32), 16) + W.ING.herb(p, ...at(o, 40, 36), 14, 10, 1); },
    // 鶏のフリカッセとご飯: 鶏・にんじん・グリンピース・マッシュルーム・クリーム、白アスパラガス（お好みで）
    de_frikassee: plateOf((p, o) => W.riceMound(p, ...at(o, 30, -14), 26, 20, { sy: SYF }) + W.pool(p, ...at(o, -16, 8), 40, '#f6ecd0', 'fr') + side(p, o, [['chickenCream', -24, 2, 16], ['chickenCream', -6, 12, 16], ['carrot', -30, 16, 11], ['pea', -14, 22, 12], ['pea', -2, 0, 12], ['mushroom', -20, -6, 13], ['asparagusW', 4, 18, 8, -20]])),
    // 魚のマスタードソースとじゃがいも、レモン
    de_fisch: plateOf((p, o) => W.pool(p, ...at(o, -12, 6), 38, '#f2d870', 'fs') + side(p, o, [['fish', -14, 2, 30], ['potatoBoiled', 30, -8, 16], ['potatoBoiled', 40, 8, 16], ['potatoBoiled', 26, 18, 16]]) + W.flecks(p, ...at(o, 30, 4, 10), 18, 10, 'fsp', PARS, { ry: 8, s: 1.6 }) + lemon(p, ...at(o, -40, 30), 13)),
    // レンズ豆のアイントプフとウィンナー: レンズ豆・じゃがいも・にんじん・ポロねぎ
    de_linsen: S('#7a4a24', [['lentil', 18, 13], ['wurst', 5, 15], ['potato', 3, 12], ['carrot', 3, 11], ['leek', 2, 11]], { minD: 6 }),
    // カルトッフェルプッファー（じゃがいものパンケーキ）とアップルソース
    de_puffer: p => { const D = teller(p), o = D.o; return D.s + byDepth([[-24, -8], [8, -14], [-8, 14]].map(([u, v], i) => { const [x, y] = at(o, u, v, 2 + i * 2); return [y, () => W.jeon(p, x, y, 30, i, { c: '#d8a050', h: 4 }) + W.flecks(p, x, y - 2, 24, 24, 'pf' + i, ['#a8641e', '#f6dca0'], { ry: 10, s: 1.6 })]; })) + `<ellipse cx="${f(o.cx + 46)}" cy="${f(o.cy + 22)}" rx="18" ry="${f(18 * SYF)}" fill="#f4f0e6" stroke="${MOSS}" stroke-width=".8"/><ellipse cx="${f(o.cx + 46)}" cy="${f(o.cy + 21)}" rx="14" ry="${f(14 * SYF)}" fill="#e8d090"/>`; },
    // ルーラーデン（牛肉巻きの煮込み）: 牛肉・ベーコン・ピクルス・玉ねぎ・にんじん
    de_rouladen: B('#5a2410', [['roulade', 4, 30], ['carrot', 3, 12]], { minD: 20 }),
    // ザウアーブラーテン（牛肉の酢漬けの煮込み）: 牛肉・玉ねぎ・にんじん・セロリアック、レーズン（お好みで）
    de_sauerbraten: plateOf((p, o) => W.pool(p, ...at(o, -6, 6), 44, GRAVY, 'sb') + byDepth([-16, -2, 12].map((v, i) => { const [x, y] = at(o, -10 + i * 4, v, 4); return [y, () => Q.slice3q(p, x, y, 40, -14, { c: '#8a4a2a', fat: '#5a2a14', seed: i, gloss: .7, char: false }, { sq: .5 })]; })) + side(p, o, [['knoedel', 40, 14, 24], ['raisin', -30, 22, 12], ['raisin', -20, 26, 12]])),
    // シュヴァイネブラーテン（皮つき豚のロースト）
    de_schweinebraten: plateOf((p, o) => W.pool(p, ...at(o, -6, 6), 44, GRAVY, 'swb') + byDepth([-14, 2].map((v, i) => { const [x, y] = at(o, -10 + i * 6, v, 4); return [y, () => Q.prism(p, x, y, [[-22, -12], [22, -12], [22, 12], [-22, 12]], 14, '#f2d8c0', { rot: -14, top: Q.lg(p, [[0, '#c8742a'], [.2, '#a8541e'], [.25, '#f6e8d8'], [1, '#e8c0a0']], 0, 0, 0, 1), line: .55 })]; })) + side(p, o, [['knoedel', 40, 14, 24], ['carrot', -36, 24, 12]])),
    // 豚のコトレットと玉ねぎのソース、クリーム（お好みで）
    de_kotelett: plateOf((p, o) => side(p, o, [['chop', -10, 0, 40]]) + W.flecks(p, ...at(o, -10, -4, 8), 26, 16, 'kt', ['#c8864a', '#e8c890'], { ry: 10, s: 2.4 }) + side(p, o, [['bratkartoffel', 36, -6, 16], ['bratkartoffel', 44, 10, 16], ['bratkartoffel', 30, 20, 16]])),
    // ケーニヒスベルガー・クロプセ（肉団子のケイパーソース）、じゃがいもかご飯
    de_klopse: B('#f2e8c8', [['meatball', 8, 22], ['potatoBoiled', 2, 16]], { flecks: [['#6a7a2a', 14, 1.6], pars(8)] }),
    // ロールキャベツ: キャベツ・ひき肉・玉ねぎ、ベーコン（お好みで）
    de_kohlrouladen: B('#8a4a24', [['cabbageRoll', 5, 28]], { minD: 16 }),
    // ピーマンの肉詰めのトマトソース、チーズ（お好みで）
    de_gefuelltepaprika: B('#c8401e', [['stuffedPepper', 4, 30]], { minD: 26 }),
    // カリーヴルスト（カレーケチャップのソーセージ）、パン（お好みで）
    de_currywurst: p => { const D = teller(p), o = D.o; return D.s + byDepth(Array.from({ length: 9 }, (_, i) => { const [x, y] = at(o, -30 + (i % 3) * 26, -20 + Math.floor(i / 3) * 20, 6); return [y, () => ing.wurst(p, x, y, 36, 0, i)]; })) + W.drizzle([[o.cx - 40, o.cy - 8], [o.cx - 16, o.cy - 14], [o.cx + 8, o.cy - 6], [o.cx + 30, o.cy - 12]], '#c8401e', 5) + W.flecks(p, o.cx - 6, o.cy - 10, 30, 30, 'cw', ['#d8a020', '#c88a1e'], { ry: 12, s: 1.2 }) + W.bread(p, ...at(o, 44, 26), 34, -20, { c: '#e8b060', crust: '#b87a3a', toast: .2 }); },
    // 鶏ももとじゃがいものオーブン焼き: 鶏・じゃがいも・玉ねぎ、赤ピーマン（お好みで）
    de_haehnchenschenkel: P([['drum', 4, 22], ['potatoRoast', 8, 15], ['onion', 3, 12], ['pepperR', 3, 12]], { minD: 16, ing: { ...ing, drum: (p, x, y, s, r, i) => W.drumstick(p, x, y, s * 1.6, r, i, { c: '#c8822e', fried: false }) } }),
    // ゲシュネッツェルテス（鶏とマッシュルームのクリーム）、ご飯・シュペッツレ（お好みで）
    de_geschnetzeltes: plateOf((p, o) => W.riceMound(p, ...at(o, 30, -14), 26, 20, { sy: SYF }) + W.pool(p, ...at(o, -16, 8), 40, '#ead4a8', 'gs') + side(p, o, [['chickenStrip', -28, 0, 16, -10], ['chickenStrip', -10, 8, 16, 20], ['chickenStrip', -20, 16, 16, 0], ['mushroom', -2, -4, 14], ['mushroom', -30, 20, 14]]) + W.flecks(p, ...at(o, -16, 4, 8), 26, 10, 'gsp', PARS, { ry: 10, s: 1.6 })),
    // マーチェス（にしんのりんごクリーム）: にしん・りんご・玉ねぎ・ピクルス・サワークリーム、じゃがいも
    de_matjes: plateOf((p, o) => W.pool(p, ...at(o, -12, 6), 38, '#f6f2e4', 'mj') + side(p, o, [['herring', -20, -4, 26, -10], ['herring', -8, 10, 26, -6], ['apple', -28, 20, 12], ['onion', -2, 2, 12, 20], ['gherkin', -34, 6, 13], ['potatoBoiled', 34, -6, 16], ['potatoBoiled', 40, 10, 16]]) + W.flecks(p, ...at(o, 36, 2, 10), 14, 8, 'mjc', [CHIVE], { ry: 6, s: 1.6 })),
    // バックフィッシュ（ビール衣の魚のフライ）とレムラード、レモン
    de_backfisch: plateOf((p, o) => side(p, o, [['fishBatter', -10, 0, 34, -8]]) + `<ellipse cx="${f(o.cx + 40)}" cy="${f(o.cy + 20)}" rx="14" ry="${f(14 * SYF)}" fill="#f4f0e6" stroke="${MOSS}" stroke-width=".8"/><ellipse cx="${f(o.cx + 40)}" cy="${f(o.cy + 19)}" rx="11" ry="${f(11 * SYF)}" fill="#f6f0d0"/>` + W.flecks(p, o.cx + 40, o.cy + 19, 8, 8, 'rm', ['#6a8a2a'], { ry: 3, s: 1 }) + lemon(p, ...at(o, -40, 30), 13)),
    // ゼンフアイアー（ゆで卵のマスタードソース）とじゃがいも
    de_senfeier: plateOf((p, o) => W.pool(p, ...at(o, -10, 6), 42, '#f2d870', 'se') + side(p, o, [['eggWhole', -20, 0, 18], ['eggWhole', -2, 6, 18], ['eggWhole', -14, 16, 18], ['potatoBoiled', 34, -8, 16], ['potatoBoiled', 40, 10, 16]]) + W.flecks(p, ...at(o, -10, 4, 6), 24, 10, 'sep', PARS, { ry: 8, s: 1.6 })),
    // バウエルンフリューシュトゥック（じゃがいもとベーコンと卵の焼きもの）、ピクルス（お好みで）
    de_bauernfruehstueck: P([['bratkartoffel', 16, 18], ['bacon', 6, 13], ['scramble', 8, 16], ['gherkin', 2, 13]], { flecks: [[CHIVE, 14, 1.6]] }),
    // 白アスパラガスとオランデーズソースとじゃがいも、ハム（お好みで）
    de_spargel: plateOf((p, o) => byDepth([-14, -6, 2, 10].map((v, i) => { const [x, y] = at(o, -12, v, 4); return [y, () => ing.asparagusW(p, x, y, 40, -10)]; })) + W.drizzle([[o.cx - 50, o.cy - 2], [o.cx - 30, o.cy - 8], [o.cx - 10, o.cy - 2], [o.cx + 6, o.cy - 8]], '#f2d050', 4) + side(p, o, [['potatoBoiled', 36, 14, 16], ['potatoBoiled', 44, 0, 16], ['hamSlice', -10, 30, 24]]), { }),
    // ペルカルトッフェルン（皮つきじゃがいもとハーブのクワルク）、きゅうり（お好みで）
    de_pellkartoffeln: plateOf((p, o) => side(p, o, [['potatoSkin', -20, -6, 22], ['potatoSkin', -4, 6, 22], ['potatoSkin', -26, 14, 22]]) + W.mound(p, ...at(o, 30, 4), 22, 12, '#fbf8f0', 'qk', SYF) + W.flecks(p, ...at(o, 30, 0, 8), 18, 20, 'qkh', [CHIVE, PARS[0]], { ry: 6, s: 1.4 }) + side(p, o, [['cucumber', 40, 28, 12], ['cucumber', 30, 32, 12]])),
    // ゼンメルクネーデル（パンの団子）とマッシュルームのクリームソース
    de_semmelknoedel: plateOf((p, o) => W.pool(p, ...at(o, 0, 6), 46, '#d8b080', 'sk') + side(p, o, [['breadKnoedel', -16, -4, 30], ['breadKnoedel', 14, 4, 30], ['mushroom', -28, 18, 14], ['mushroom', 26, 22, 14], ['mushroom', 0, 22, 14]]) + W.flecks(p, ...at(o, 0, 4, 10), 34, 14, 'skp', PARS, { ry: 12, s: 1.6 })),
    // アーベントブロート（黒パンとハム・チーズ・野菜の夕食）: パン・バター・ハム・チーズ・トマト・きゅうり、ピクルス・ラディッシュ（お好みで）（木の板）
    de_abendbrot: p => { const cx = 100, cy = 100, w = 176, d = 96; const board = `<g transform="translate(${cx} ${cy}) scale(1 ${SYF})"><rect x="${-w / 2}" y="${-d / 2 + 8}" width="${w}" height="${d}" rx="10" fill="#8a5a2a"/><rect x="${-w / 2}" y="${-d / 2}" width="${w}" height="${d}" rx="10" fill="${Q.lg(p, [[0, '#d8a868'], [1, '#b8844a']], 0, 0, 1, 1)}" stroke="#7a4a1e" stroke-width="1"/></g>`; const o = { cx, cy, sy: SYF }; return board + W.grow(cx, cy, 1.25, side(p, o, [['rye', -40, -10, 40, -6], ['rye', -24, 8, 40, 4], ['hamSlice', 10, -14, 28], ['cheeseSlice', 30, -4, 26], ['tomatoSlice', 52, 4, 18], ['cucumber', 10, 14, 14], ['cucumber', 22, 18, 14], ['radish', 40, 22, 14], ['gherkin', 56, 18, 13]])); },
    // ドイツのパンケーキとアップルソース
    de_pfannkuchen: p => { const D = teller(p), o = D.o; return D.s + W.grow(o.cx, o.cy, 1.2, W.jeon(p, ...at(o, -6, 4), 48, 1, { c: '#e8b858', h: 3 }) + W.jeon(p, ...at(o, -4, 0, 4), 48, 2, { c: '#f0c468', h: 3 }) + W.flecks(p, ...at(o, -4, -2, 6), 36, 30, 'pk', ['#c8802a', '#a8641e'], { ry: 16, s: 2 }) + W.mound(p, ...at(o, 6, -2, 8), 18, 6, '#e8d090', 'pka', SYF)); },

    // ---------- 麺・ご飯 ----------
    // ケーゼシュペッツレ（チーズのシュペッツレと揚げ玉ねぎ）（耐熱皿）
    de_spaetzle: auflauf({ c: '#f2d070', fl: ['#e8b030', '#f8e8a0', '#c8902e'], n: 80, top: (o, V, pp) => byDepth(W.spots('sz', 40, 64, 8, { ry: 36 }).map(([u, v, r], i) => { const [x, y] = at(o, u, v * .6, 2); return [y, () => ing.spaetzle(pp, x, y, 12, r)]; })) + W.flecks(pp, o.cx, o.cy - 4, 40, 40, 'szo', ['#a8641e', '#c8862e', '#7a4a1a'], { ry: 20, s: 2.2 }) + W.flecks(pp, o.cx, o.cy - 4, 40, 10, 'szc', [CHIVE], { ry: 20, s: 1.6 }) }),
    // マウルタッシェン（シュヴァーベンの包みパスタ）の焼きものと玉ねぎと卵、ベーコン（お好みで）
    de_maultaschen: P([['maultasche', 7, 22], ['scramble', 6, 14], ['onion', 4, 12], ['bacon', 3, 12]], { minD: 12, flecks: [[CHIVE, 14, 1.6]] }),
    // シュプフヌーデルン（じゃがいものニョッキ）とザウアークラウト、ベーコン（お好みで）
    de_schupfnudeln: P([['schupf', 16, 18], ['kraut', 16, 14], ['bacon', 4, 12]], { minD: 7 }),
    // シンケンヌーデルン（ハムと卵の焼きそば）、チーズ（お好みで）
    de_schinkennudeln: P([['noodleRibbon', 20, 18], ['ham', 8, 13], ['scramble', 6, 14], ['onion', 3, 12]], { minD: 7, flecks: [[CHIVE, 12, 1.6]] }),

    // ---------- 副菜 ----------
    // シュヴァーベンのポテトサラダ: じゃがいも・玉ねぎ、きゅうり（お好みで）
    de_kartoffelsalat: K([['potatoSlice', 20, 16], ['onion', 4, 11], ['cucumber', 4, 11]], { minD: 6, flecks: [[CHIVE, 14, 1.6]], ing: { ...ing, potatoSlice: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#e8c070', { h: 2.2, top: Q.rg(p, [[0, '#fff4c8'], [.6, '#f6e0a0'], [1, '#d8b060']], .4, .35, .8) }) } }),
    // きゅうりのディルサラダ、サワークリーム（お好みで）
    de_gurkensalat: K([['cucumber', 22, 14]], { minD: 6, base: '#f6f2e0', flecks: [['#5a9a3a', 20, 1.2]] }),
    // 赤キャベツの蒸し煮: 赤キャベツ・りんご・玉ねぎ
    de_rotkohl: K([['redCab', 44, 14], ['apple', 4, 12]], { minD: 5, base: '#7a2a5a' }),
    // クラウトサラダ（キャベツのサラダ）: キャベツ・にんじん、赤ピーマン（お好みで）
    de_krautsalat: K([['whiteCab', 44, 14], ['carrotStick', 8, 10], ['pepperR', 4, 9]], { minD: 5 }),
    // ラームシュピナート（ほうれん草のクリーム煮）
    de_rahmspinat: K([], { base: '#4a7a2a', H: 14, flecks: [['#f6f0dc', 14, 2], ['#6a9a3a', 20, 2]] }),
    // グリンピースとにんじんのバター煮
    de_erbsenmoehren: K([['pea', 26, 14], ['carrot', 14, 12]], { minD: 5, after: (o, V, p) => W.butterPat(p, o.cx, o.cy - 26, 8) }),
    // ザルツカルトッフェルン（パセリのゆでじゃがいも）
    de_salzkartoffeln: P([['potatoBoiled', 10, 20]], { minD: 14, flecks: [pars(20)] }),
    // ブラートカルトッフェルン（玉ねぎとベーコンの焼きじゃがいも）
    de_bratkartoffeln: P([['bratkartoffel', 22, 18], ['onion', 5, 12], ['bacon', 5, 12]], { flecks: [[CHIVE, 12, 1.6]] }),
    // 芽キャベツのバター炒め、ベーコン（お好みで）
    de_rosenkohl: P([['sprout', 16, 18], ['bacon', 5, 12]], { minD: 10 }),
    // マッシュルームのクリーム煮
    de_rahmchampignons: K([['mushroom', 14, 15]], { base: '#ead4a8', flecks: [pars(12)] }),
    // シュペックボーネン（いんげんとベーコン）
    de_speckbohnen: P([['greenBean', 20, 10], ['bacon', 8, 13], ['onion', 3, 12]]),
    // ザウアークラウトとりんごの煮もの、ベーコン（お好みで）
    de_sauerkraut: K([['kraut', 50, 14], ['apple', 3, 11], ['bacon', 3, 11]], { minD: 4, base: '#e8e0b0' }),
    // コールラビのクリーム煮
    de_kohlrabi: B('#f4ecd4', [['kohlrabi', 12, 16]], { flecks: [pars(12)] }),
    // シュモアグルケン（きゅうりのディル煮）: きゅうり・玉ねぎ・サワークリーム、ベーコン（お好みで）
    de_schmorgurken: B('#f0ead0', [['cucumberBraise', 12, 16], ['bacon', 3, 12]], { flecks: [['#5a9a3a', 20, 1.2]] }),
    // マッシュポテト（ナツメグ）
    de_kartoffelpueree: K([], { base: '#f6e8c0', H: 22, after: (o, V, p) => W.flecks(p, o.cx, o.cy - 28, 20, 10, 'kp', ['#c8a060'], { ry: 6, s: 1.2 }) }),
    // カリフラワーのバターパン粉がけ、ゆで卵（お好みで）
    de_blumenkohl: P([['cauliflower', 10, 16]], { minD: 12, flecks: [['#d8a050', 40, 1.8], ['#f6e0a0', 20, 1.6]] }),
    // カルトッフェルクレーセ（じゃがいもの団子）
    de_kartoffelkloesse: P([['knoedel', 4, 30]], { minD: 30, H: 8, after: (o, D, p) => W.pool(p, o.cx, o.cy + 6, 46, GRAVY, 'kk') }),
    // ラームヴィルジング（ちりめんキャベツのクリーム煮）、ベーコン（お好みで）
    de_rahmwirsing: K([['savoy', 14, 16], ['bacon', 4, 11]], { base: '#e8ecc8' }),
    // じゃがいものグラタン
    de_kartoffelgratin: auflauf({ c: '#f2d890', fl: ['#d8902a', '#c8782a', '#fff2c0', '#a8601e'], n: 100, top: (o, V, pp) => byDepth(Array.from({ length: 15 }, (_, i) => { const u = -56 + (i % 5) * 28, v = -26 + Math.floor(i / 5) * 26; const [x, y] = at(o, u, v * .6, 2); return [y, () => `<path d="M${f(x - 14)},${f(y)} q14,-6 28,0" stroke="#e8b058" stroke-width="2" fill="none" opacity=".8"/>`]; })) }),
    // フェルトザラート（マーシュとベーコンとクルトン）: マーシュ・エシャロット、ベーコン・クルトン（お好みで）
    de_feldsalat: K([['lambLettuce', 30, 14], ['bacon', 5, 11], ['crouton', 5, 12]], { minD: 5 }),
    // トマトと玉ねぎのサラダ
    de_tomatensalat: P([['tomatoSlice', 8, 22], ['onion', 6, 13]], { minD: 14, H: 8, flecks: [[CHIVE, 20, 1.4]], ing: { ...ing, tomatoSlice: (p, x, y, s) => W.coin(p, x, y, s * .55, '#c8281a', { h: 3, top: Q.rg(p, [[0, '#ff9a7a'], [.5, '#e8503a'], [.85, '#f6c0a0'], [1, '#c8281a']], .4, .35, .8) }) } }),
    // にんじんとりんごのサラダ、くるみ（お好みで）
    de_moehrenrohkost: K([['carrotStick', 34, 11], ['apple', 5, 11], ['walnut', 4, 12]], { minD: 5, base: '#f0a050' }),
    // ヌーデルザラート（ハム・グリンピース・ピクルスのパスタサラダ）、ゆで卵（お好みで）
    de_nudelsalat: K([['pastaSpiral', 20, 14], ['ham', 6, 12], ['pea', 8, 12], ['gherkin', 4, 11]], { minD: 6, base: '#f6ecd0' }),
    // ビーツのサラダ、りんご（お好みで）
    de_rotebete: K([['beet', 18, 14], ['onion', 3, 10], ['apple', 3, 11]]),
    // コップザラート（バターレタスのクリームドレッシング）
    de_kopfsalat: K([['lettuce', 14, 16]], { minD: 10, flecks: [['#f6f2e4', 16, 2], [CHIVE, 10, 1.4]] }),
    // ラディッシュのサラダとあさつき、きゅうり（お好みで）
    de_radieschensalat: K([['radish', 20, 14], ['cucumber', 6, 12]], { minD: 6, flecks: [[CHIVE, 20, 1.4]] }),
    // ヴァルドルフザラート（セロリアック・りんご・くるみ）
    de_waldorfsalat: K([['celeriacStick', 20, 12], ['apple', 8, 12], ['walnut', 6, 13]], { base: '#f6f0dc', ing: { ...ing, celeriacStick: (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, -1.4], [s / 2, -1.4], [s / 2, 1.4], [-s / 2, 1.4]], 1.8, '#f2ecd8', { rot: r, line: .3 }) } }),

    // ---------- 汁物 ----------
    // じゃがいものスープとウィンナー: じゃがいも・にんじん・ポロねぎ・玉ねぎ
    de_kartoffelsuppe: S('#ecd8a0', [['wurst', 5, 15], ['carrot', 3, 11], ['leek', 3, 11]], { minD: 10, flecks: [pars(10)] }),
    // 鶏の麺スープ: 鶏・にんじん・セロリアック・ポロねぎ・スープ麺
    de_huehnersuppe: S('#f0d898', [['noodleBit', 14, 12], ['chicken', 3, 12], ['carrot', 4, 10], ['celeriac', 3, 10]], { minD: 8, flecks: [pars(10)] }),
    // えんどう豆のアイントプフとソーセージ: 割りえんどう・じゃがいも・にんじん・セロリアック・ポロねぎ、ベーコン（お好みで）
    de_erbsensuppe: S('#c8b040', [['wurst', 5, 15], ['potato', 3, 12], ['carrot', 3, 11], ['bacon', 3, 11]], { minD: 10 }),
    // グーラッシュスープ: 牛肉・玉ねぎ・赤ピーマン・じゃがいも・トマトペースト
    de_gulaschsuppe: S('#a8341a', [['beefStew', 5, 15], ['pepperR', 4, 12], ['potato', 3, 12]], { minD: 10, oil: [10, '#e8701e'] }),
    // かぼちゃのクリームスープ
    de_kuerbissuppe: S('#f0a030', [], { cream: '#fbf6e8', flecks: [['#3a5a1e', 10, 1.6]] }),
    // トマトのスープとご飯、クリーム（お好みで）
    de_tomatensuppe: S('#d0402a', [['rice', 20, 10]], { minD: 6, cream: '#fbf2e8' }),
    // フレードレズッペ（パンケーキの細切りの澄んだスープ）
    de_flaedlesuppe: S('#e8c070', [['pancakeStrip', 16, 16]], { minD: 7, flecks: [[CHIVE, 14, 1.6]] }),
    // グリースノッケル（セモリナの団子のスープ）: にんじん
    de_griessnockerl: S('#e8c070', [['griess', 3, 28], ['carrot', 4, 10]], { minD: 18, flecks: [[CHIVE, 12, 1.6]] }),
    // ケーゼラウフ（チーズとポロねぎとひき肉のスープ）、マッシュルーム（お好みで）
    de_kaeselauch: S('#f0dca0', [['leek', 8, 13], ['mince', 6, 12], ['mushroom', 3, 12]], { minD: 8 }),
    // 白アスパラガスのクリームスープ
    de_spargelcreme: S('#f4ecc8', [['asparagusW', 4, 10]], { minD: 12, cream: '#fbf8ee' }),
    // いんげんのアイントプフとスモークソーセージ: いんげん・じゃがいも・玉ねぎ・にんじん
    de_bohneneintopf: S('#d8c088', [['greenBean', 6, 9], ['smoked', 4, 15], ['potato', 3, 12], ['carrot', 3, 11]], { minD: 9 }),
    // キャベツとひき肉のアイントプフ: キャベツ・ひき肉・じゃがいも・玉ねぎ・にんじん
    de_weisskohleintopf: S('#d8b878', [['cabbage', 4, 14], ['mince', 6, 12], ['potato', 3, 12], ['carrot', 3, 11]], { minD: 9 }),
    // スウィードと豚バラのアイントプフ: スウィード・豚バラ・じゃがいも・にんじん・玉ねぎ
    de_steckruebeneintopf: S('#e8b860', [['swede', 6, 14], ['smokedPork', 3, 18], ['potato', 3, 12], ['carrot', 3, 11]], { minD: 10, flecks: [pars(8)] }),
    // ピッヒェルシュタイナー（肉と野菜の煮込み）: 牛肉・豚肉・じゃがいも・にんじん・セロリアック・ポロねぎ
    de_pichelsteiner: S('#c8904a', [['beefStew', 3, 15], ['porkStew', 3, 15], ['potato', 3, 12], ['carrot', 3, 11], ['celeriac', 2, 11], ['leek', 2, 11]], { minD: 10, flecks: [pars(10)] }),
    // ホッホツァイツズッペ（肉団子と卵の寄せもののスープ）: 肉団子・卵・にんじん、アスパラガス（お好みで）
    de_hochzeitssuppe: S('#e8c070', [['meatballS', 6, 14], ['custard', 6, 13], ['carrot', 3, 10], ['asparagusW', 2, 8]], { minD: 10, flecks: [[CHIVE, 10, 1.6]], ing: { ...ing, meatballS: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#c8a080', p.id + 'mb' + i, { hi: .6 }) } }),
    // 牛肉のスープと野菜: 牛すね・にんじん・セロリアック・ポロねぎ、スープ麺（お好みで）
    de_rindfleischsuppe: S('#d8a858', [['beefStew', 4, 14], ['carrot', 4, 11], ['celeriac', 3, 11], ['leek', 3, 11], ['noodleBit', 6, 12]], { minD: 9, flecks: [pars(10)] }),
    // 大麦と燻製豚のアイントプフ: 大麦・カスラー・じゃがいも・にんじん・セロリアック・ポロねぎ
    de_graupeneintopf: S('#d8c090', [['barley', 30, 12], ['smokedPork', 3, 16], ['potato', 3, 11], ['carrot', 3, 11], ['leek', 2, 11]], { minD: 6, flecks: [pars(8)] }),
    // 白いんげんのアイントプフ: 白いんげん・じゃがいも・にんじん・ポロねぎ・トマト、ベーコン（お好みで）
    de_weissebohnen: S('#c8803a', [['whiteBean', 16, 13], ['potato', 3, 11], ['carrot', 3, 11], ['bacon', 3, 11]], { minD: 7 }),
    // ブロッコリーのクリームスープ、チーズ（お好みで）
    de_brokkolisuppe: S('#8aa850', [['broccoli', 2, 12]], { minD: 14, cream: '#fbf6e8' }),
    // マッシュルームのクリームスープ
    de_champignonsuppe: S('#c8a878', [['mushroom', 3, 12]], { minD: 12, cream: '#fbf6e8', flecks: [pars(8)] }),
    // 北ドイツの魚のスープ: 白身魚・じゃがいも・にんじん・ポロねぎ、クリーム（お好みで）
    de_fischsuppe: S('#ecdcb0', [['fish', 3, 18], ['potato', 3, 12], ['carrot', 3, 11], ['leek', 3, 11]], { minD: 10, flecks: [['#5a9a3a', 14, 1.2]] }),
    // にんじんと生姜のスープ
    de_moehrensuppe: S('#f0902a', [], { cream: '#fbf6e8', flecks: [pars(6)] }),
};
// 皿の上に置く小さな具（plateOf・side 用）
Object.assign(ing, {
    chop: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .8, s * .5, 7, '#c8864a', p.id + 'ch' + i, { rot: -10, sear: '#8a4a1e', edgeC: '#f2e0c0' }),
    chickenStrip: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .5, -2], [s * .5, -2], [s * .45, 2], [-s * .5, 2]], 2.6, '#f2dcc0', { rot: r, line: .35 }),
    fishBatter: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * 1.4, s * .6, 8, '#e8b048', p.id + 'fb' + i, { rot: r, sear: '#c8862e', edgeC: '#f6dca0', jit: .2 }),
    hamSlice: (p, x, y, s, r, i) => `<path d="${Q.blob(x, y, s * .8, s * .45, 'hs' + p.id + i, { n: 12, jit: .15 })}" fill="${Q.rg(p, [[0, '#f8c8c0'], [1, '#e89a94']], .4, .35, .8)}" stroke="#c87a74" stroke-width=".6"/>`,
    cheeseSlice: (p, x, y, s) => Q.prism(p, x, y, Q.square(s), 3, '#f2d070', { rot: -10, line: .45, top: Q.lg(p, [[0, '#fff2b0'], [1, '#f2d070']], 0, 0, 1, 1) }),
    tomatoSlice: (p, x, y, s) => W.coin(p, x, y, s * .55, '#c8281a', { h: 3, top: Q.rg(p, [[0, '#ff9a7a'], [.5, '#e8503a'], [.85, '#f6c0a0'], [1, '#c8281a']], .4, .35, .8) }),
    rye: (p, x, y, s, r) => W.bread(p, x, y, s * 1.2, r, { c: '#8a5a3a', crust: '#4a2e1e', toast: 0 }) + W.flecks(p, x, y - 3, s * .4, 8, 'ry' + x, ['#f2e0a0'], { ry: s * .15, s: 2 }),
    potatoSkin: (p, x, y, s, r, i) => Q.glossLump(p, x, y, s, i, { c: '#c8a070' }) + `<path d="${Q.blob(x + 2, y - s * .4, s * .3, s * .16, 'pk' + i, { n: 8, jit: .2 })}" fill="#f6e0a0"/>`,
});
