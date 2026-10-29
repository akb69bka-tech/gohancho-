// ブラジル（br_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: ふだんの皿（prato feito）は淡い砂色の縁（#c8b48a。主食の br_staple にそろえる）の白い平皿、
// 汁物（sopa・caldo・creme）は砂色の線の白い碗、ムケッカ・フェイジョアーダ・ボボ・カルネ・ジ・パネーラは黒い土鍋（panela de barro）、
// グラタン・エスコンジジーニョ・アホス・ジ・フォルノは耐熱ガラス色の角皿、サラダ・豆は白い小鉢。
// 材料は gohancho/packs/br.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, T: TR } = W;

const SAND = '#c8b48a';
const prato = (p, o = {}) => Q.plate(p, { line: 'none', edge: SAND, ...o });
const tigela = (p, o = {}) => Q.shiroBowl(p, { rim: SAND, line: 'none', ...o });
const barro = (p, o = {}) => Q.donabe(p, { stone: true, h: 40, cy: 86, rx: 88, ...o });
const small = (p, o = {}) => W.sideBowl(p, { edge: SAND, ...o });
const deep = (p, o = {}) => Q.fukazara(p, { line: SAND, ...o });
const CV = ['#3f8a2a', '#5aa83a'], FAROFA = ['#e8c888', '#d8b070', '#f2dcb0'];
const lime = (p, x, y, s = 14) => W.lemon(p, x, y, s, { wedge: true, c: '#8ab83a' });
const ing = {
    chickenCream: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#f2c8a0', soak: '#d8804a', k: .4, sy: .72 }),
    chickenRoast: (p, x, y, s, r, i) => W.drumstick(p, x, y, s * 1.6, r, i, { c: '#b8682a', fried: false }),
    chickenBite: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .45, s * .34, i, { c: '#c8822e', n: 12, h: 5, rot: r }),
    beefStew: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#8a4a24', soak: '#5a2410', k: .5, sy: .72 }),
    porkRib: (p, x, y, s, r, i) => W.rib(p, x, y, s, r, i, { c: '#a86a3a', glaze: '#8a4a24' }),
    linguica: (p, x, y, s, r, i, liq) => W.sausageCoin(p, x, y, s * .42, { c: '#8a2e1a', inner: '#c8604a', liq }),
    cassava: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s, '#c8b890', p.id + 'cv' + i, { h: s * .5, liq, sink: liq ? 2 : 0, top: Q.rg(p, [[0, '#fffbf0'], [1, '#f2e8cc']], .4, .35, .8) }),
    cassavaFry: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .8, -s * .2], [s * .8, -s * .24], [s * .8, s * .2], [-s * .8, s * .22]], s * .32, '#d8a050', { rot: r, line: .45, top: Q.lg(p, [[0, '#fff2c8'], [.5, '#f2d890'], [1, '#d8a050']], 0, 0, 0, 1) }),
    polenta: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .7, -s * .2], [s * .7, -s * .2], [s * .7, s * .2], [-s * .7, s * .2]], s * .32, '#d8a040', { rot: r, line: .45, top: Q.lg(p, [[0, '#fff0b0'], [.5, '#f6d070'], [1, '#d8a040']], 0, 0, 0, 1) }),
    couve: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.1], [s / 2, -1.1], [s / 2, 1.1], [-s / 2, 1.1]], 1.4, i % 2 ? '#2e5a1e' : '#3f7a2a', { rot: r, line: .3 }),
    chuchu: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .8, '#a8c880', p.id + 'cc' + i, { h: s * .4, liq, top: Q.rg(p, [[0, '#f6f8e0'], [1, '#d8e8b0']], .4, .35, .8) }),
    palmito: (p, x, y, s, r, i) => W.coin(p, x, y, s * .45, '#e8e0c8', { h: 4, top: Q.rg(p, [[0, '#ffffff'], [.6, '#f6f2e2'], [.8, '#e8e0c8'], [1, '#d8d0b0']], .4, .35, .8) }),
    shoestring: (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, -.8], [s / 2, -.8], [s / 2, .8], [-s / 2, .8]], 1.2, '#e8b048', { rot: r, line: .25 }),
    cod: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .5, s * .32, '#f6f0e2', p.id + 'cd' + i, { n: 10, jit: .2, hi: .6, edge: '#c8b898' }),
    blackEyed: (p, x, y, s, r) => Q.bean(p, x, y, s * .6, r, '#e8dcc0') + `<circle cx="${f(x)}" cy="${f(y - .4)}" r="1" fill="#3a2a22"/>`,
    coalho: (p, x, y, s, r, i) => W.dice(p, x, y, s * .7, '#e8d8a0', p.id + 'cq' + i, { h: s * .4, top: Q.rg(p, [[0, '#fffbe8'], [.7, '#f6ecc8'], [1, '#d8a860']], .4, .35, .8) }),
    capeletti: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#f2dca0', p.id + 'cp' + i, { hi: .6, edge: '#c8a868' }),
    letters: (p, x, y, s, r, i) => `<text x="${f(x)}" y="${f(y)}" font-size="${f(s * .7)}" font-family="sans-serif" font-weight="bold" fill="#e8c070" stroke="#b8904a" stroke-width=".4" transform="rotate(${f(r % 30 - 15)} ${f(x)} ${f(y)})">${'ABCDEFGHIJKLMNOP'[i % 16]}</text>`,
    pasta: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#d8b060" stroke-width="${f(s * .32)}" fill="none" stroke-linecap="round"/><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#f6dc90" stroke-width="${f(s * .18)}" fill="none" stroke-linecap="round"/></g>`,
    salsicha: (p, x, y, s, r, i, liq) => W.sausageCoin(p, x, y, s * .4, { c: '#c8402a', inner: '#e8806a', liq }),
    driedBeef: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .5, -1.6], [s * .5, -1.4], [s * .45, 1.6], [-s * .5, 1.4]], 2.2, '#8a3a24', { rot: r, line: .35 }),
    taro: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s, '#a8907a', p.id + 'ta' + i, { h: s * .5, liq, top: Q.rg(p, [[0, '#fbf6f0'], [1, '#e8dcd0']], .4, .35, .8) }),
    mandioquinha: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s, '#e8c060', p.id + 'mq' + i, { h: s * .5, liq, top: Q.rg(p, [[0, '#fff2b0'], [1, '#f2d070']], .4, .35, .8) }),
    bananaBread: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .8, s * .3, i, { c: '#d89a3a', n: 18, h: 6, rot: r }),
    eggFried: (p, x, y, s, r, i) => W.friedEgg(p, x, y, s * 2.2, i),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(prato, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(tigela, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}, v = barro) => M(v, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}) => M(small, 'bowl', null, items, { minD: 7, ...o });
const cv = (n = 14) => [CV[0], n, 1.6];
const bake = (o) => p => W.bake(p, { base: '#e8e0cc', inner: '#f2ecdc', ...o });
const gratinTop = (p, o, seed) => W.flecks(p, o.cx, o.cy - 4, 70, 70, seed, ['#c8782a', '#a8601e', '#f8e0a0'], { ry: 40, s: 2.6 });

export default {
    // ---------- 主菜 ----------
    // ストロガノフ（鶏）: 鶏・玉ねぎ・トマトソース・生クリーム、マッシュルーム（お好みで）、batata palha
    br_strogonoff: B('#e8a878', [['chickenCream', 8, 18], ['mushroom', 3, 12]], { after: (o, V, p) => byDepth(W.spots('bp' + p.id, 16, 26, 4).map(([u, v, r], i) => [o.cy - 30 + v * .3, () => ing.shoestring(p, o.cx + 40 + u, o.cy - 30 + v * .3, 12, r)])) }, deep),
    // ビーフ・アセボラード（牛肉と玉ねぎ）
    br_bife: P([['beefSlice', 6, 24], ['onion', 12, 16]], { minD: 12, sauce: '#7a3a1a' }),
    // カルネ・モイダ（ひき肉とじゃがいも）: ひき肉・じゃがいも・玉ねぎ・トマト、ピーマン（お好みで）、チェイロ・ヴェルジ
    br_carne_moida: K([['mince', 14, 16], ['potato', 8, 12], ['tomato', 4, 10], ['pepperG', 3, 10]], { base: '#8a4a24', flecks: [cv(14)] }),
    // ムケッカ（魚とココナッツの煮込み）: 魚・トマト・玉ねぎ・ピーマン・ココナッツミルク・香菜・ライム（黒い土鍋）
    br_moqueca: B('#e8902a', [['fish', 5, 22], ['tomato', 4, 13], ['pepperR', 3, 13], ['pepperG', 3, 13], ['onion', 3, 13]], { flecks: [cv(16)] }),
    // ビステッカ（豚の骨つきロースのソテー）、ライム
    br_bisteca: p => { const D = prato(p), o = D.o; return D.s + byDepth([[-18, -6], [20, 8]].map(([u, v], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.cutSlab(p, x, y, 36, 22, 6, '#c8864a', 'bs' + i, { rot: -12 + i * 20, sear: '#8a4a1e', edgeC: '#f2e0c0' })]; })) + lime(p, ...at(o, 50, 32), 15) + W.ING.onion(p, ...at(o, -40, 34), 14, 10); },
    // ハムとチーズのオムレツ: 卵・トマト・玉ねぎ・チーズ、ハム・チェイロ・ヴェルジ（お好みで）
    br_omelete: p => { const D = prato(p); return D.s + `<g transform="translate(100 98)"><path d="M-56,0 A56,${f(56 * SYF * .9)} 0 0 1 56,0 Q0,${f(30 * SYF)} -56,0Z" fill="${Q.rg(p, [[0, '#fff0a0'], [.6, '#f2c84a'], [1, '#d8a030']], .4, .35, .8)}" stroke="#b8862a" stroke-width=".8"/></g>` + W.flecks(p, 100, 90, 40, 24, 'om', ['#e8401e', '#ec9a94', CV[0], '#f6dc80'], { ry: 10, s: 2 }) + `<path d="M60,100 q10,4 20,0 q10,4 20,0" stroke="#fbe8a0" stroke-width="3" fill="none"/>` + Q.shine(80, 84, 20, -8, .7); },
    // フランゴ・アサード（鶏とじゃがいものロースト）、ライム
    br_frango_assado: P([['chickenRoast', 4, 22], ['potatoRoast', 8, 15], ['onion', 3, 12]], { minD: 16, after: (o, D, p) => lime(p, ...at(o, 50, 32), 14) }),
    // フランゴ・ア・パッサリーニョ（鶏の小さな揚げもの、にんにく）、ライム
    br_frango_passarinho: P([['chickenBite', 20, 18]], { minD: 12, flecks: [['#e8b048', 20, 2]], after: (o, D, p) => lime(p, ...at(o, 50, 32), 14) }),
    // フィレ・パルミジャーナ（牛カツのトマトとチーズのせ）
    br_file_parmegiana: p => { const D = prato(p), o = D.o, [x, y] = at(o, -6, 0, 4); return D.s + W.cutlet(p, x, y, 60, 32, -6, { inner: '#c8907a', c: ['#f0c070', '#d8963a', '#a8641e'], cuts: 2 }) + `<path d="${Q.blob(x - 8, y - 4, 44, 20, 'fp2', { n: 14, jit: .12 })}" fill="#c8301a"/><path d="${Q.blob(x - 8, y - 6, 32, 14, 'fp3', { n: 14, jit: .25 })}" fill="${Q.rg(p, [[0, '#fff6d0'], [.6, '#f8e090'], [1, '#e0a840']], .4, .35, .8)}"/>` + W.flecks(p, x - 8, y - 6, 26, 16, 'fpf', ['#d8902a', '#a8601e'], { ry: 10, s: 2 }); },
    // ピカジーニョ（牛肉の角切りの煮込み）: 牛肉・玉ねぎ・トマト、にんじん・じゃがいも（お好みで）
    br_picadinho: B('#7a3a1a', [['beef', 10, 15], ['carrot', 3, 12], ['potato', 3, 13]], { flecks: [cv(14)] }, deep),
    // カルネ・ジ・パネーラ（牛肉とじゃがいもの鍋煮）: 牛肉・玉ねぎ・トマト・じゃがいも、にんじん（お好みで）
    br_carne_panela: B('#6a2a14', [['beefStew', 7, 20], ['potRed', 4, 16], ['carrot', 3, 13]], { ing: { ...ing, potRed: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#f0c878', soak: '#8a4a1e', k: .45, sy: .78 }) } }),
    // アルモンデガス（肉団子のトマトソース）
    br_almondegas: B('#c8401e', [['meatball', 9, 20]], { flecks: [cv(14)] }, deep),
    // パンケッカ・ジ・カルネ（牛ひき肉を巻いたクレープのトマトソース）、チーズ（お好みで）
    br_panqueca_carne: bake({ c: '#c8401e', fl: ['#f8e0a0', '#fff2c0', '#e8b048'], n: 50, top: (o, V, p) => byDepth([-26, 0, 26].map((v, i) => { const [x, y] = at(o, 0, v, 4); return [y, () => `<g transform="translate(${f(x)} ${f(y)})"><rect x="-70" y="-11" width="140" height="22" rx="11" fill="#f2d8a0" stroke="#c8a060" stroke-width=".6"/><path d="M-60,-2 q20,-6 40,0 q20,6 40,0 q20,-6 40,0" stroke="#c8401e" stroke-width="6" fill="none" opacity=".85"/></g>`]; })) }),
    // エスコンジジーニョ（干し肉のキャッサバマッシュ焼き）
    br_escondidinho: bake({ /*fx*/blister: 8, scoop: { layers: [['#e8b048', .12], ['#f6e8c0', .4], ['#a8502a', .48]], dots: [['#7a2e14', 6, 2.4]] }, /*xf*/ c: '#f2d890', top: (o, V) => '' }),
    // フェイジョアーダ（黒豆と豚の煮込み）: 黒豆・スペアリブ・リングイッサ・ベーコン、干し肉（お好みで）（黒い土鍋）
    br_feijoada: B('#2e2018', [['linguica', 5, 16], ['porkRib', 3, 18], ['bacon', 4, 14], ['blackBean', 12, 12], ['driedBeef', 3, 14]], { minD: 10 }),
    // ロンボ・アサード（豚ロースのロースト）、じゃがいも（お好みで）・ライム
    br_lombo_assado: p => { const D = prato(p), o = D.o; return D.s + byDepth([-30, -10, 10, 30].map((u, i) => { const [x, y] = at(o, u - 10, -u * .2, 4); return [y, () => W.coin(p, x, y, 22, '#a86a3a', { h: 7, sy: .5, top: Q.rg(p, [[0, '#fbe8d8'], [.6, '#f0c8b0'], [.85, '#c8864a'], [1, '#8a4a1e']], .4, .35, .8) })]; })) + byDepth([[40, 26], [50, 10], [26, 36]].map(([u, v], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.ING.potatoRoast(p, x, y, 14, 0, i)]; })) + lime(p, ...at(o, -44, 34), 14); },
    // 魚のフライ、ライム
    br_peixe_empanado: P([['fishFried', 4, 30]], { minD: 26, H: 10, after: (o, D, p) => lime(p, ...at(o, 50, 32), 15) }),
    // バカリャオーダ（干しだらとじゃがいものオーブン焼き）: たら・じゃがいも・玉ねぎ・ピーマン・ゆで卵・黒オリーブ
    br_bacalhoada: bake({ base: '#c87a4a', inner: '#e8b088', c: '#f6e8c8', fl: ['#e8c890', '#f2dca0'], n: 30, top: (o, V, p) => byDepth(W.spots('bc', 22, 64, 14, { ry: 40 }).map(([u, v, r], i) => { const [x, y] = at(o, u, v * .6, 4); return [y, () => [ing.cod, W.ING.potatoBoiled, W.ING.onion, W.ING.pepperR, W.ING.pepperG, W.ING.olive, W.ING.egg][i % 7](p, x, y, 16, r, i)]; })) }),
    // ボボ・ジ・カマラォン（えびのキャッサバとココナッツのクリーム）（黒い土鍋）
    br_bobo_camarao: B('#f0c070', [['shrimp', 10, 18]], { flecks: [cv(16), ['#e8701e', 10, 1.6]] }),
    // トゥトゥ・ジ・フェイジョン（豆のペーストとキャッサバ粉）、ベーコン・卵（お好みで）
    br_tutu_feijao: K([['bacon', 6, 14], ['eggFried', 1, 18]], { base: '#6a4a34', H: 14, flecks: [cv(10)] }),
    // クスクス・ノルデスチーノ（とうもろこしの蒸しクスクスと卵）、チーズ（お好みで）
    br_cuscuz_nordestino: p => { const D = prato(p), o = D.o; return D.s + W.mound(p, ...at(o, -10, 0), 46, 30, '#f6d870', 'cz', SYF) + W.flecks(p, ...at(o, -10, -6, 20), 38, 60, 'czf', ['#e8b830', '#fff2a0', '#f0c840'], { ry: 16, s: 1.8 }) + W.butterPat(p, ...at(o, -10, -8, 30), 9) + W.friedEgg(p, ...at(o, 42, 24, 2), 34, 1) + W.cutSlab(p, ...at(o, -46, 32, 4), 14, 8, 6, '#f6ecd0', 'czq', { sear: '#c8862e' }); },
    // なすのパルミジャーナ
    br_berinjela_parmegiana: bake({ /*fx*/blister: 6, scoop: { layers: [['#f6d070', .14], ['#c8401e', .1], ['#5a2a3a', .1], ['#e8c070', .12], ['#c8401e', .1], ['#5a2a3a', .1], ['#e8c070', .12], ['#c8401e', .22]] }, /*xf*/ c: '#c8401e', fl: ['#fff6d0', '#f8e090', '#e0a840', '#a8601e'], n: 110 }),

    // ---------- ご飯・麺 ----------
    // ガリニャーダ（鶏の炊き込みご飯）: 鶏・米・玉ねぎ・トマト・チェイロ・ヴェルジ・ライム、ピーマン・コーン（お好みで）
    br_galinhada: M(deep, 'plate', null, [['chickenCream', 6, 18], ['corn', 8, 12], ['pepperG', 3, 10]], { rice: { cols: ['#f2c860', '#e8b040', '#f8dc90'], edge: '#b88a2a' }, H: 22, R: 48, minD: 10, flecks: [cv(16)] }),
    // アホス・ジ・フォルノ（鶏ご飯のオーブン焼き）: ご飯・鶏・グリンピース・コーン・トマトソース・チーズ
    br_arroz_forno: bake({ /*fx*/blister: 8, scoop: { layers: [['#e8b048', .15], ['#fbf6ea', .85]], dots: [['#f2dcc0', 5, 3], ['#7aa83a', 5, 1.8], ['#f6d040', 5, 1.8]] }, /*xf*/ c: '#f2c860', fl: ['#d8902a', '#c8782a', '#f8e0a0', '#a8601e', '#7aa83a', '#f6d040'], n: 110 }),
    // バイアン・ジ・ドイス（ご飯と黒目豆とチーズ）: 豆・米・ベーコン・玉ねぎ・コアーリョ・香菜
    br_baiao_de_dois: P([['blackEyed', 18, 13], ['bacon', 5, 12], ['coalho', 6, 13]], { rice: { cols: ['#f2e4c8', '#e8d4b0', '#fbf2dc'], edge: '#c8a878' }, H: 24, R: 50, flecks: [cv(14)] }),
    // マカホン・コン・サルシッシャ（ソーセージのトマトパスタ）、コーン・粉チーズ（お好みで）
    br_macarrao_salsicha: p => { const D = prato(p), o = D.o; return D.s + W.noodleMound(p, 100, 104, 52, 18, '#e8803a', 'ms', { w: 2.4, n: 150, len: 34, sy: SYF, edge: '#a8401e' }) + byDepth(W.spots('msv', 12, 40, 10).map(([u, v], i) => { const [x, y] = at(o, u, v, 10 + W.hill(u, v, 52, 18)); return [y, () => ing.salsicha(p, x, y, 14, 0, i)]; })) + W.flecks(p, 100, 92, 34, 30, 'msc', ['#f8f0d0', '#f6d040'], { ry: 12, s: 1.6 }); },
    // ニョッキのトマトソース、粉チーズ
    br_nhoque: B('#c8401e', [['gnocchi', 14, 14]], { flecks: [['#f8f0d0', 30, 1.6]], ing: { ...ing, gnocchi: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .5, s * .36, '#f2dca0', p.id + 'gn' + i, { n: 10, jit: .1, hi: .6, edge: '#c8a868' }) } }, deep),

    // ---------- 副菜 ----------
    // フェイジョン（ふだんの豆）: カリオカ豆・玉ねぎ、ベーコン（お好みで）
    br_feijao: S('#6a4030', [['brownBean', 30, 13], ['bacon', 3, 12]], { top: [['brownBean', 16, 16]], minD: 6 }),
    // ファロッファ（キャッサバ粉の炒め）: キャッサバ粉・玉ねぎ・バター、ベーコン・卵（お好みで）
    br_farofa: K([['bacon', 6, 12], ['scramble', 4, 12]], { base: '#e8c888', H: 14, flecks: [['#d8a858', 50, 1.6], ['#f6e0b0', 30, 1.4]] }),
    // コウヴィ（ケールのにんにく炒め）
    br_couve: P([['couve', 50, 16]], { minD: 5, flecks: [['#f2e0b0', 12, 1.6]] }),
    // ヴィナグレッチ（トマトと玉ねぎの酢のサルサ）: トマト・玉ねぎ・ピーマン・パセリ
    br_vinagrete: K([['tomato', 14, 12], ['onion', 5, 11], ['pepperG', 6, 10], ['herb', 4, 10]], { base: '#e8a080' }),
    // マイオネーズ（ポテトサラダ）: じゃがいも・にんじん・マヨネーズ、グリンピース・卵（お好みで）
    br_maionese: K([['potato', 14, 13], ['carrot', 8, 10], ['pea', 8, 12]], { base: '#f6ecd0' }),
    // シュシュ（ハヤトウリの炒め物）: ハヤトウリ・玉ねぎ、トマト（お好みで）・チェイロ・ヴェルジ
    br_chuchu: P([['chuchu', 20, 15], ['tomato', 3, 10]], { flecks: [cv(14)] }),
    // レタスとトマトのサラダ、玉ねぎ（お好みで）
    br_salada: P([['lettuce', 10, 16], ['tomato', 8, 13], ['onion', 3, 12]], { ing: { ...ing, tomato: (p, x, y, s, r) => W.coin(p, x, y, s * .55, '#c8281a', { h: 3, top: Q.rg(p, [[0, '#ff9a7a'], [.5, '#e8503a'], [.85, '#f6c0a0'], [1, '#c8281a']], .4, .35, .8) }) } }),
    // マンジョッカ・フリッタ（キャッサバのフライ）
    br_mandioca_frita: P([['cassavaFry', 12, 22]], { minD: 12, H: 14 }),
    // ピュレ・ジ・バタタ（マッシュポテト）
    br_pure_batata: K([], { base: '#f8e8a8', H: 22, groove: true, mash: 'potato' }),
    // バタタ・ソテー（小いものバター炒め）、パセリ
    br_batata_saute: P([['potatoBoiled', 14, 18]], { minD: 12, flecks: [cv(16)] }),
    // ブロッコリーのご飯
    br_arroz_brocolis: P([], { rice: { cols: ['#fbf6ea', '#e8f0d0', '#c8dca0', '#6a9a3a'], edge: '#a8b880' }, H: 24, R: 50, flecks: [['#3f7a2a', 40, 2.2], ['#6a9a3a', 30, 1.8]] }),
    // ビーツのサラダ、玉ねぎ・チェイロ・ヴェルジ（お好みで）
    br_salada_beterraba: K([['beet', 16, 13], ['onion', 3, 10]], { flecks: [cv(10)] }),
    // きゅうりのサラダ、玉ねぎ（お好みで）
    br_salada_pepino: K([['cucumber', 18, 13], ['onion', 3, 10]]),
    // にんじんのサラダ（すりおろし）、ライム
    br_cenoura_ralada: K([['carrotStick', 40, 10]], { minD: 5, base: '#f0a050', after: (o, V, p) => lime(p, o.cx + 42, o.cy - 6, 14) }),
    // ズッキーニの炒め物: ズッキーニ・玉ねぎ、トマト（お好みで）
    br_abobrinha_refogada: P([['zucchini', 18, 15], ['onion', 4, 12], ['tomato', 3, 10]], { flecks: [cv(10)] }),
    // オクラの炒め物: オクラ・玉ねぎ、トマト（お好みで）
    br_quiabo_refogado: P([['okra', 28, 15], ['onion', 4, 12], ['tomato', 3, 10]], { minD: 7 }),
    // キャベツの炒め物、トマト・ベーコン（お好みで）
    br_repolho_refogado: P([['couve', 30, 15], ['tomato', 3, 10], ['bacon', 3, 10]], { ing: { ...ing, couve: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#e0ecb8' : '#c8dc98', { rot: r, line: .3 }) } }),
    // パルミット（ヤシの芽）のサラダ: パルミット・トマト、レタス・オリーブ（お好みで）
    br_salada_palmito: P([['palmito', 10, 18], ['tomato', 6, 12], ['lettuce', 3, 14], ['greenOlive', 3, 12]]),
    // キベベ（かぼちゃのマッシュ）
    br_quibebe: K([], { base: '#f0902a', H: 18, groove: true, mash: 'carrot', flecks: [cv(14)] }),
    // 野菜のピクルス: にんじん・カリフラワー・きゅうり・小玉ねぎ
    br_picles_legumes: K([['carrot', 8, 12], ['cauliflower', 4, 12], ['cucumber', 6, 12], ['pearlOnion', 4, 12]], { base: '#e8e0b8', ing: { ...ing, pearlOnion: (p, x, y, s, r, i) => W.ball(p, x, y - 2, s * .7, '#f6f0dc', p.id + 'po' + i, { hi: .7 }) } }),
    // ピラォン（魚のだしとキャッサバ粉のかゆ）: 玉ねぎ・トマト・香菜
    br_pirao: S('#e8c070', [['tomato', 3, 10]], { flecks: [cv(14)] }),
    // ポレンタ・フリッタ（揚げポレンタ）、粉チーズ（お好みで）
    br_polenta_frita: P([['polenta', 12, 22]], { minD: 12, H: 14, flecks: [['#fbf6e0', 20, 1.6]] }),
    // バナナのミラネーザ（バナナのフライ）
    br_banana_milanesa: P([['bananaBread', 5, 28]], { minD: 20, H: 10 }),
    // サルピカォン（鶏のサラダ）: 鶏・にんじん・コーン・マヨネーズ・batata palha、りんご（お好みで）
    br_salpicao: K([['shredC', 16, 14], ['carrotStick', 8, 10], ['corn', 10, 12], ['apple', 3, 11]], { base: '#f6ecd0', ing: { ...ing, shredC: (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, -1.4], [s / 2, -1.4], [s / 2, 1.4], [-s / 2, 1.4]], 1.8, '#f2dcc0', { rot: r, line: .3 }) }, after: (o, V, p) => byDepth(W.spots('sp' + p.id, 14, 24, 4).map(([u, v, r]) => [o.cy - 34 + v * .3, () => ing.shoestring(p, o.cx + u, o.cy - 34 + v * .3, 12, r)])) }),
    // フェイジョン・トロペイロ（豆とキャッサバ粉とベーコン）: 豆・ベーコン・リングイッサ・玉ねぎ・卵・キャッサバ粉、ケール（お好みで）
    br_feijao_tropeiro: P([['brownBean', 14, 12], ['bacon', 5, 12], ['linguica', 5, 13], ['scramble', 4, 12], ['couve', 8, 12]], { base: '#e8c888', H: 16, flecks: [['#d8a858', 40, 1.6]] }),
    // いんげんの炒め物、にんじん（お好みで）
    br_vagem_refogada: P([['greenBean', 20, 9], ['carrotStick', 4, 12], ['onion', 3, 12]]),
    // カリフラワーのグラタン
    br_couve_flor_gratinada: bake({ /*fx*/blister: 10, scoop: { layers: [['#e8b048', .2], ['#f6eedc', .8]], dots: [['#fbf6e4', 5, 5], ['#e8e0c0', 4, 4]] }, /*xf*/ c: '#f6e0a0', fl: ['#d8902a', '#c8782a', '#fff2c0', '#a8601e'], n: 90, top: (o, V, p) => byDepth(W.spots('cf', 8, 56, 26, { ry: 36 }).map(([u, v], i) => { const [x, y] = at(o, u, v * .6, 2); return [y, () => `<path d="${Q.blob(x, y, 14, 9, 'cfb' + i, { n: 10, jit: .25 })}" fill="${Q.rg(p, [[0, '#fff6d8'], [1, '#e8c070']], .4, .35, .8)}" opacity=".9"/>`]; })) }),

    // ---------- 汁物 ----------
    // カルド・ヴェルジ（じゃがいもとケールのスープ）: じゃがいも・ケール・リングイッサ・玉ねぎ
    br_caldo_verde: S('#ece4c0', [['couve', 18, 14], ['linguica', 5, 14]], { minD: 8, oil: [8, '#e8c040'] }),
    // カンジャ（鶏と米のスープ）: 鶏・米・にんじん・玉ねぎ、じゃがいも（お好みで）
    br_canja: S('#f2e4b8', [['chicken', 4, 14], ['carrot', 6, 11], ['rice', 30, 10], ['potato', 2, 11]], { minD: 6, flecks: [cv(12)] }),
    // ソッパ・ジ・フェイジョン（豆とパスタのスープ）、ベーコン・じゃがいも（お好みで）
    br_sopa_feijao: S('#6a4030', [['pasta', 10, 14], ['bacon', 3, 12]], { top: [['brownBean', 10, 16], ['pasta', 3, 14]], minD: 9, flecks: [cv(12)] }),
    // 牛肉と野菜のスープ: 牛すね・じゃがいも・にんじん、ハヤトウリ・ズッキーニ（お好みで）
    br_sopa_legumes: S('#e0b878', [['beef', 4, 14], ['potato', 4, 12], ['carrot', 5, 12], ['chuchu', 3, 12], ['zucchini', 3, 12]], { minD: 10, flecks: [cv(10)] }),
    // キャッサバとひき肉のスープ: キャッサバ・ひき肉・玉ねぎ・トマト
    br_caldo_mandioca: S('#f2e4c0', [['mince', 6, 12], ['tomato', 2, 10]], { top: [['cassava', 5, 15]], cream: '#fbf6e8', flecks: [cv(14)] }),
    // えんどう豆のスープ、リングイッサ・ベーコン（お好みで）
    br_sopa_ervilha: S('#b8b050', [['linguica', 5, 14], ['bacon', 3, 12], ['carrot', 3, 11]], { top: [['pea', 14, 15]], minD: 10 }),
    // レンズ豆のスープ、リングイッサ（お好みで）
    br_sopa_lentilha: S('#8a5a2a', [['lentil', 20, 13], ['linguica', 4, 14], ['carrot', 4, 11], ['couve', 6, 12]], { top: [['lentil', 18, 16]], minD: 6 }),
    // かぼちゃと干し肉のスープ
    br_caldo_abobora: S('#f0a030', [['driedBeef', 8, 14]], { minD: 9, flecks: [cv(14)] }),
    // マンジオキーニャのクリームスープと鶏
    br_creme_mandioquinha: S('#f6d870', [['chicken', 4, 13]], { top: [['mandioquinha', 6, 14]], minD: 12, cream: '#fbf6e8', flecks: [cv(10)] }),
    // カンジキーニャ（とうもろこしのかゆとスペアリブ）: スペアリブ・とうもろこしの粗挽き・玉ねぎ・トマト、ケール（お好みで）
    br_canjiquinha: S('#f2d070', [['porkRib', 4, 18], ['couve', 6, 12]], { minD: 12, porr: { c: '#f6dc80', n: 150 }, flecks: [cv(14)] }),
    // アルファベットのパスタのスープ: パスタ・じゃがいも・にんじん・トマト・玉ねぎ
    br_sopa_letrinhas: S('#e8b070', [['letters', 18, 14], ['carrot', 4, 11], ['potato', 3, 11]], { minD: 8 }),
    // 魚のスープ: 魚・トマト・玉ねぎ・ピーマン・香菜・ライム、じゃがいも（お好みで）
    br_caldo_peixe: S('#e8a050', [['fish', 3, 20], ['tomato', 3, 11], ['pepperG', 3, 11], ['potato', 2, 11]], { minD: 12, flecks: [cv(14)], after: (S, V, p) => lime(p, S.cx + 46, S.cy + 4, 14) }),
    // えびのクリームスープ: えび・じゃがいも・トマト・玉ねぎ・香菜
    br_caldo_camarao: S('#f0b878', [['shrimp', 6, 16], ['potato', 3, 11]], { minD: 12, flecks: [cv(14)] }),
    // コーンのクリームスープ、チーズ（お好みで）
    br_creme_milho: S('#f6dc80', [['corn', 10, 13]], { top: [['corn', 12, 15]], minD: 8, flecks: [cv(10)] }),
    // フバー（とうもろこし粉）のスープとケールと卵、リングイッサ（お好みで）
    br_sopa_fuba: S('#f2d070', [['couve', 12, 13], ['eggRibbon', 3, 14], ['linguica', 3, 13]], { minD: 8 }),
    // 大麦と牛肉のスープ: 大麦・牛肉・にんじん・じゃがいも・トマト
    br_sopa_cevadinha: S('#d8b070', [['grain', 30, 12], ['beef', 4, 13], ['carrot', 4, 11], ['potato', 3, 11]], { minD: 6, flecks: [cv(10)] }),
    // カペレッチの鶏スープ、粉チーズ（お好みで）
    br_sopa_capeletti: S('#f0d080', [['capeletti', 9, 16], ['carrot', 3, 10]], { minD: 12, flecks: [cv(12), ['#fbf6e0', 14, 1.4]] }),
    // 里芋のスープ、ポロねぎ・ベーコン（お好みで）
    br_caldo_inhame: S('#ece0d0', [['bacon', 4, 12], ['leek', 4, 12]], { top: [['taro', 5, 15]], minD: 12, cream: '#fbf6ee', flecks: [cv(10)] }),
    // ブロッコリーのクリームスープ、チーズ（お好みで）
    br_creme_brocolis: S('#9ab860', [['broccoli', 3, 12]], { top: [['broccoli', 4, 16]], minD: 14, cream: '#fbf6e8' }),
    // オニオンスープ: 玉ねぎ・バター・パン・チーズ
    br_sopa_cebola: S('#a8641e', [['onion', 10, 14]], { minD: 8, after: (S, V, p) => `<path d="${Q.blob(S.cx + 4, S.cy - 2, 34, 18, 'sc', { n: 12, jit: .1 })}" fill="${Q.rg(p, [[0, '#fff2c0'], [.6, '#f2c860'], [1, '#c8862e']], .4, .35, .8)}" stroke="#a8641e" stroke-width=".7"/>` + W.flecks(p, S.cx + 4, S.cy - 2, 28, 20, 'scf', ['#c8782a', '#a8601e'], { ry: 12, s: 2 }) }),
    // ひよこ豆とリングイッサのスープ: ひよこ豆・リングイッサ・じゃがいも・玉ねぎ・トマト
    br_sopa_grao_bico: S('#d89050', [['chickpea', 16, 14], ['linguica', 5, 14], ['potato', 3, 11]], { top: [['chickpea', 12, 16]], minD: 7, flecks: [cv(10)] }),
    // にんじんと生姜のクリームスープ
    br_creme_cenoura: S('#f0902a', [], { top: [['carrot', 7, 15]], cream: '#fbf6e8', flecks: [cv(10)] }),
};
