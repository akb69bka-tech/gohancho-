// インド（in_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 主食の in_staple にそろえたステンレス。汁物・カレー・ダールは鋼のカトリ（小さな丸い鉢）、
// 汁けのないサブジ・揚げ物・ご飯は鋼のターリー（灰の平皿）、ビリヤニは銅色の鍋（ハンディ）。縁は鋼の灰（#9d9e9a）。
// 材料は gohancho/packs/in.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, dk, lt } = W;

// =========================================================
// インドの器と部品
// =========================================================
const STEEL = '#9d9e9a';
const thali = (p, o = {}) => Q.plate(p, { base: '#d0d1cf', line: 'none', edge: STEEL, ...o });
const ring = (cx, cy, rx, c, w = 1) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(rx * W.SY)}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
const katori = (p, o = {}) => { const V = Q.vessel(p, { cx: 100, cy: 80, rx: 90, h: 48, fx: 50, ft: 4, t: 2.4, outer: '#bbbcba', lip: '#e5e6e4', inner: '#d2d3d0', line: 'none', belly: .55, gloss: .85, rim: STEEL, ...o }); return { ...V, s: V.s + ring(100, o.cy ?? 80, (o.rx ?? 90) - 1.2, STEEL) }; };
const handi = p => W.bowl(p, { outer: '#a8582e', inner: '#c8804a', edge: '#d8a060', h: 44, cy: 84, gloss: .5 });
// 香りの散らし
const CORI = ['#3f8a2a', '#5aa83a', '#2f6a22'], CUMIN = '#7a5a2a', MUSTARD = '#5a3a1e', CHILI = '#c8281a', COCO = '#fbf6ea';
// インドの具（W.ING にないもの）
const ing = {
    curryLeaf: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * .9, r, '#2f6a22', 'cl' + p.id + i, { wave: .4 }),
    tandoori: (p, x, y, s, r, i) => W.drumstick(p, x, y, s * 1.7, r, i, { c: '#c8401e', fried: false }),
    porkRed: (p, x, y, s, r, i) => W.dice(p, x, y, s, '#7a2a14', p.id + 'pr' + i, { h: s * .55, top: Q.rg(p, [[0, '#d8784a'], [.6, '#a8401e'], [1, '#7a2410']], .4, .35, .8) }),
    lambRed: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#a8401e', soak: '#6a1e10', k: .55, sy: .72 }),
    fishCurry: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .8, s * .48, 7, '#f0c088', p.id + 'fc' + i, { rot: r, sear: '#c8601e', edgeC: '#f6e0c0' }),
    fishMasala: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .8, s * .5, 7, '#c8501e', p.id + 'fm' + i, { rot: r, sear: '#8a2a10', edgeC: '#e8a070' }),
    potTurmeric: (p, x, y, s, r, i) => W.dice(p, x, y, s, '#d8a020', p.id + 'pt' + i, { h: s * .55, top: Q.rg(p, [[0, '#fff0a0'], [.6, '#f2c84a'], [1, '#c8941e']], .4, .35, .8) }),
    potRed: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e8a050', soak: '#a8401a', k: .5, sy: .78 }),
    cauliYellow: (p, x, y, s, r, i) => W.broc(p, x, y, s * 1.6, i, '#f2dc90'),
    soya: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .5, s * .38, '#b8783a', p.id + 'so' + i, { n: 10, jit: .3, hi: .6, edge: '#7a4a1e' }),
    kofta: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#c8864a', p.id + 'kf' + i, { hi: .6 }),
    pav: (p, x, y, s, r, i) => W.ball(p, x, y - s * .3, s, '#d8963e', p.id + 'pv' + i, { hi: .6 }),
    shred: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#d8e8a8' : '#c0d888', { rot: r, line: .3 }),
    karela: (p, x, y, s, r, i) => W.coin(p, x, y, s * .42, '#3f5a1e', { h: 2.4, top: Q.rg(p, [[0, '#c8a050'], [.5, '#8a8a2a'], [.85, '#5a6a22'], [1, '#2e4a14']], .4, .35, .8) }),
    begun: (p, x, y, s, r, i) => W.coin(p, x, y, s * .55, '#4a2038', { h: 3, top: Q.rg(p, [[0, '#f0c070'], [.6, '#d8902e'], [.9, '#a8601e'], [1, '#5a2a2a']], .4, .35, .8) }),
    taro: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .5, s * .36, '#c8862e', p.id + 'ta' + i, { n: 10, jit: .2, hi: .55, edge: '#8a5a1e' }),
    boondi: (p, x, y, s, r, i) => W.ball(p, x, y, s * .45, '#e0a040', p.id + 'bd' + i, { hi: .5 }),
    pakora: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .5, s * .4, i, { c: '#d89a3a', n: 14, h: 6, rot: r }),
    lauki: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s, '#8ab060', p.id + 'lk' + i, { h: s * .5, liq, sink: liq ? 2 : 0, top: Q.rg(p, [[0, '#f6f8e0'], [.6, '#dce8b8'], [1, '#a8c880']], .4, .35, .8) }),
    ashGourd: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s, '#c8d8a8', p.id + 'ag' + i, { h: s * .5, liq, sink: liq ? 2 : 0, top: Q.rg(p, [[0, '#ffffff'], [1, '#eef2dc']], .4, .35, .8) }),
    coco: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .6, '#8a5a3a', p.id + 'cc' + i, { h: s * .3, liq, top: Q.rg(p, [[0, '#ffffff'], [1, '#f2ecdc']], .4, .35, .8) }),
    dhokli: (p, x, y, s, r, i, liq) => Q.prism(p, x, y, [[-s * .5, 0], [0, -s * .32], [s * .5, 0], [0, s * .32]], 2.4, '#e8c890', { rot: r, sink: liq ? 1 : 0, liquid: liq, line: .45, top: Q.rg(p, [[0, '#fbe8b8'], [1, '#e0b878']], .4, .35, .8) }),
    moringa: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .7, -1.8], [s * .7, -1.8], [s * .7, 1.8], [-s * .7, 1.8]], 2.6, '#6a8a3a', { rot: r, line: .45 }),
    friedOnion: (p, x, y, s, r) => W.onionStrip(x, y, s, r, '#b8742a'),
    moong: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .26)}" ry="${f(s * .16)}" fill="${Q.rg(p, [[0, '#fff0a0'], [1, '#e8c040']], .35, .3, .8)}" stroke="#c09a2a" stroke-width=".3"/>`,
    banana: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .6, -2], [s * .6, -2], [s * .6, 2], [-s * .6, 2]], 2.6, '#a8b860', { rot: r, line: .4, top: Q.lg(p, [[0, '#f6f2d0'], [1, '#e0dca0']], 0, 0, 0, 1) }),
    urad: (p, x, y, s, r) => Q.bean(p, x, y, s * .6, r, '#4a3028'),
};
// 組み立ての近道: M(器, 盛り方, 汁・ソースの色, 具, ほか)
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const S = (c, items, o = {}) => M(katori, 'soup', c, items, { minD: 12, ...o });           // カトリの汁物・ダール
const B = (c, items, o = {}) => M(katori, 'braise', c, items, { minD: 13, ...o });         // カトリに山高のカレー
const K = (items, o = {}) => M(katori, 'bowl', null, items, { minD: 9, ...o });            // カトリに山盛りの和えもの
const T = (items, o = {}) => M(thali, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o }); // ターリーに山盛り
const cori = (n = 16) => [CORI[0], n, 1.6];

// =========================================================
// 品
// =========================================================
export default {
    // ---------- 主菜 ----------
    // 鶏のカレー（家庭の）: 骨つきの鶏・玉ねぎ・トマト、香菜
    in_chickencurry: B('#a8481e', [['chickenCurry', 10, 18], ['onion', 3, 14], ['tomato', 3, 12]], { flecks: [cori(18)] }),
    // キーマ・マタル: ひき肉・グリンピース・玉ねぎ・トマト・青唐辛子・香菜
    in_keemamatar: K([['mince', 14, 18], ['pea', 16, 14], ['tomato', 4, 12], ['chiliG', 4, 12]], { base: '#8a4a24', flecks: [cori(18)] }),
    // 魚のカレー: 魚の切り身・玉ねぎ・トマト、ココナッツミルク（お好みで）
    in_fishcurry: B('#c8501e', [['fishCurry', 6, 22], ['tomato', 3, 12], ['curryLeaf', 4, 12]], { flecks: [[MUSTARD, 10, 1.2]] }),
    // 卵のカレー: ゆで卵・玉ねぎ・トマト、香菜
    in_eggcurry: B('#b8481e', [['egg', 6, 18], ['onion', 3, 14], ['tomato', 3, 12]], { flecks: [cori(16)] }),
    // ラジマ（赤いんげん豆のカレー）、香菜
    in_rajma: S('#8a2a1e', [['kidney', 34, 14], ['onion', 3, 12]], { top: [['kidney', 14, 16]], minD: 7, flecks: [cori(14)], oil: [10, '#d8701e'] }),
    // パラク・パニール: ほうれん草のペーストにパニール、クリーム（お好みで）
    in_palakpaneer: S('#3f6a22', [['paneer', 9, 17]], { minD: 18, cream: '#f6f0e0' }),
    // バターチキン: 鶏のもも・トマト・バター・生クリーム
    in_butterchicken: B('#d8602a', [['chickenCurry', 11, 18]], { flecks: [['#6a7a3a', 12, 1.2]], after: (o, V, p) => W.butterPat(p, o.cx + 6, o.cy - 34, 10) }),
    // タンドリーチキン: 鶏もも・ヨーグルト・レモン、輪切りの玉ねぎ（お好みで）
    in_tandoori: p => { const D = thali(p), o = D.o; return D.s + byDepth(W.spots('tdo', 10, 50, 12).map(([u, v, r], i) => { const [x, y] = at(o, u, v, 2); return [y - 40, () => W.onionStrip(x, y, 18, r, '#c87aa8')]; })) + byDepth([[-26, -12, -30], [12, -16, 10], [-8, 14, -14]].map(([u, v, r], i) => { const [x, y] = at(o, u, v, 6); return [y, () => W.grow(x, y, 1.7, W.drumstick(p, x, y, 50, r, i, { c: '#c8401e', fried: false }) + W.flecks(p, x, y - 4, 12, 10, 'tdc' + i, ['#5a1a0a', '#3a1206'], { ry: 5, s: 1.4 }))]; })) + W.lemon(p, ...at(o, 48, 30), 18, { wedge: true }) + W.lemon(p, ...at(o, 52, 14), 16, { wedge: true, rot: 30 }) + W.flecks(p, o.cx, o.cy - 10, 40, 14, 'tdh', CORI, { ry: 16, s: 1.6 }); },
    // ローガン・ジョシュ（羊のカシミールカレー）
    in_roganjosh: B('#9a2414', [['lambRed', 11, 18]], { flecks: [['#e8d8a8', 8, 1.2]] }),
    // ポーク・ヴィンダルー: 豚の角切り・玉ねぎ
    in_vindaloo: B('#8a2412', [['porkRed', 10, 17], ['onion', 3, 14]]),
    // 魚のマサラ焼き（タワ・フィッシュ）: 切り身・レモン
    in_fishfry: T([['fishMasala', 4, 30], ['lemon', 2, 16]], { minD: 26, flecks: [cori(10)] }),
    // えびのマサラ: えび・玉ねぎ・トマト、香菜
    in_prawnmasala: B('#b8401a', [['prawn', 9, 16], ['tomato', 2, 12]], { flecks: [cori(14)] }),
    // アンダ・ブルジ（スパイス入りのいり卵）: 卵・玉ねぎ・トマト・青唐辛子・香菜
    in_andabhurji: T([['scramble', 24, 20], ['tomato', 5, 11], ['onion', 4, 12], ['chiliG', 4, 12]], { flecks: [cori(20)] }),
    // チョレ（ひよこ豆のカレー）: ひよこ豆・玉ねぎ・トマト・青唐辛子・香菜
    in_chole: S('#7a3a1a', [['chickpea', 30, 15], ['chiliG', 2, 12], ['onion', 3, 12]], { top: [['chickpea', 12, 16]], minD: 7, flecks: [cori(14)] }),
    // 大豆ミートのカレー: 大豆ミート・玉ねぎ・トマト、じゃがいも（お好みで）、香菜
    in_soyacurry: B('#9a4a1e', [['soya', 11, 16], ['potRed', 3, 14]], { flecks: [cori(14)] }),
    // マタル・パニール: パニール・グリンピース・玉ねぎ・トマト
    in_matarpaneer: S('#c8601e', [['paneer', 8, 16], ['pea', 16, 14]], { minD: 9, oil: [8, '#e8902a'] }),
    // カダイ・パニール: パニール・ピーマン・玉ねぎ・トマト、香菜
    in_kadaipaneer: T([['paneer', 14, 16], ['pepperG', 10, 16], ['onion', 6, 14]], { sauce: '#b8401e', flecks: [cori(14), [CHILI, 10, 1.2]] }),
    // ダム・アルー（小いもの煮込み）: 小さなじゃがいも・ヨーグルト・玉ねぎ・トマト
    in_dumaloo: B('#b8401a', [['potRed', 10, 18]], { flecks: [cori(12)] }),
    // マライ・コフタ: パニールとじゃがいもの団子・トマトとクリームのソース
    in_malaikofta: S('#d8803a', [['kofta', 6, 22]], { minD: 26, cream: '#fbf2e0' }),
    // 南インドの野菜のクルマ: じゃがいも・にんじん・いんげん・グリンピース・ココナッツ
    in_vegkurma: S('#ecd6a4', [['potato', 6, 12], ['carrot', 8, 13], ['greenBean', 4, 8], ['pea', 10, 14], ['curryLeaf', 3, 12]], { minD: 8 }),
    // パヴ・バジ: 野菜をつぶしたバジにバター、パヴ（丸パン）・レモン・玉ねぎ
    in_pavbhaji: p => { const D = thali(p), o = D.o, [mx, my] = at(o, -22, 4); return D.s + W.mound(p, mx, my, 46, 22, '#c8501e', 'pb', o.sy) + W.flecks(p, mx, my - 8, 34, 26, 'pbf', ['#f2e2b0', CORI[0], '#3f8a2a'], { ry: 10, s: 1.5 }) + W.butterPat(p, mx + 4, my - 14, 11) + byDepth([[40, -14], [50, 12]].map(([u, v], i) => { const [x, y] = at(o, u, v, 4); return [y, () => W.ball(p, x, y - 8, 36, '#d8963e', 'pv' + i, { hi: .6 })]; })) + W.lemon(p, ...at(o, -30, 40), 18, { wedge: true }) + W.onionStrip(...at(o, 8, 42), 14, 10) + W.onionStrip(...at(o, 16, 36), 14, -20); },
    // ウプマ（セモリナの塩味のおかゆ）: 玉ねぎ・にんじん・グリンピース・青唐辛子、カシューナッツ（お好みで）
    in_upma: T([['pea', 10, 13], ['carrot', 8, 11], ['nut', 6, 14], ['curryLeaf', 4, 12], ['chiliG', 3, 12]], { base: '#f2dca0', H: 16, flecks: [[MUSTARD, 12, 1.1]] }),
    // アルー・パラーター（じゃがいも入りの焼きパン）とヨーグルト
    in_alooparatha: p => { const D = thali(p), o = D.o, [x, y] = at(o, -10, 0); return D.s + W.jeon(p, x + 6, y + 6, 58, 1, { c: '#e0a858', h: 3 }) + W.jeon(p, x, y, 58, 2, { c: '#e8b468', h: 3 }) + W.flecks(p, x, y - 3, 46, 30, 'apf', ['#a8601e', '#c87a2e', '#8a4a1a'], { ry: 24, s: 2 }) + W.butterPat(p, x - 6, y - 6, 10) + (() => { const [bx, by] = at(o, 48, 34); return `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="20" ry="${f(20 * SYF)}" fill="#bbbcba" stroke="${STEEL}" stroke-width=".8"/><ellipse cx="${f(bx)}" cy="${f(by - 1)}" rx="16.5" ry="${f(16.5 * SYF)}" fill="#fbf8f0"/>` + W.flecks(p, bx, by - 1, 10, 6, 'apy', [CUMIN], { ry: 5, s: .9 }); })(); },

    // ---------- ご飯・麺 ----------
    // 野菜のプラオ: バスマティ・グリンピース・にんじん・玉ねぎ、いんげん（お好みで）
    in_pulao: T([['pea', 14, 14], ['carrot', 10, 12], ['greenBean', 4, 8], ['friedOnion', 4, 12]], { rice: { cols: ['#fbf6ea', '#f4ecd8', '#fffdf6'], edge: '#d8ccb4' }, H: 24, R: 50 }),
    // チキン・ダム・ビリヤニ: サフランの色の混じるバスマティ・鶏・揚げ玉ねぎ・ミント・香菜（銅色の鍋）
    in_chickenbiryani: M(handi, 'bowl', null, [['chickenCurry', 7, 22], ['friedOnion', 8, 14], ['mint', 5, 12]], { minD: 12, base: '#f2dca0', H: 22, flecks: [['#f0a030', 30, 1.8], ['#fbf6ea', 30, 1.8], ['#f6d070', 20, 1.8]] }),
    // 卵チャーハン（インド中華）: 卵・にんじん・ピーマン（お好みで）・青ねぎ
    in_eggfriedrice: T([['scramble', 10, 13], ['carrot', 10, 10], ['pepperG', 6, 10]], { rice: { cols: ['#f4e4b8', '#ecd8a0', '#fbf0d0'], edge: '#c8a058' }, H: 24, R: 50, flecks: [['#4a9a2c', 16, 1.8]] }),
    // ムング豆のキチュリ（米と豆のおかゆ）、グリンピース（お好みで）
    in_khichdi: S('#e8c050', [['pea', 6, 13]], { porr: { c: '#f2d470', n: 150 }, flecks: [[CUMIN, 14, 1.1]], oil: [6, '#f0c040'] }),
    // レモンライス（チトラーンナ）: ピーナッツ・ひよこ豆の割り豆・青唐辛子、香菜（お好みで）
    in_lemonrice: T([['peanut', 16, 16], ['chiliG', 4, 12], ['curryLeaf', 6, 13]], { rice: { cols: ['#f8e070', '#f2d050', '#fff0a0'], edge: '#c8a028' }, H: 24, R: 50, flecks: [[MUSTARD, 14, 1.1], ['#e8c070', 10, 1.6]] }),
    // カンダ・ポハ（平たい米と玉ねぎ・ピーナッツ）: じゃがいも・青唐辛子・レモン
    in_poha: T([['peanut', 12, 16], ['potTurmeric', 6, 10], ['onion', 5, 12], ['curryLeaf', 4, 12], ['chiliG', 3, 11]], { rice: { cols: ['#f6e8a0', '#f2dc80', '#fff4c0'], edge: '#c8a040', n: 360 }, H: 20, R: 50, after: (o, V, p) => W.lemon(p, ...at(o, 46, 34), 16, { wedge: true }) }),
    // カード・ライス（ヨーグルトのご飯）: きゅうり（お好みで）・青唐辛子・香菜（お好みで）
    in_curdrice: S('#f6f2e6', [['cucumber', 5, 12], ['curryLeaf', 4, 12], ['chiliG', 2, 11]], { porr: { c: '#fbf8f0', n: 150 }, flecks: [[MUSTARD, 14, 1.1]] }),
    // 野菜のハッカ・ヌードル: キャベツ・にんじん・ピーマン・青ねぎ
    in_hakkanoodles: T([['shred', 10, 14], ['carrotStick', 10, 13], ['pepperG', 8, 13]], { noodle: { c: '#e8c888', edge: '#a8803a' }, H: 18, R: 50, flecks: [['#4a9a2c', 16, 1.8]] }),

    // ---------- 副菜 ----------
    // アルー・ゴビ（じゃがいもとカリフラワー）、香菜
    in_aloogobi: T([['potTurmeric', 14, 15], ['cauliYellow', 10, 14], ['tomato', 2, 10]], { flecks: [cori(18)] }),
    // ビンディ・マサラ（オクラ）: 玉ねぎ、トマト（お好みで）
    in_bhindi: T([['okra', 30, 15], ['onion', 6, 13], ['tomato', 2, 10]], { minD: 8 }),
    // きゅうりのライタ: ヨーグルト・きゅうり、ミント（お好みで）
    in_raita: S('#f6f2e6', [['cucumber', 9, 12], ['mint', 3, 12]], { flecks: [[CUMIN, 14, 1.1], [CHILI, 6, 1]] }),
    // カチュンバル（刻みサラダ）: きゅうり・トマト・玉ねぎ・レモン・香菜
    in_kachumber: K([['cucumber', 10, 13], ['tomato', 10, 12], ['redOnion', 5, 12], ['herb', 6, 12]], { after: (o, V, p) => W.lemon(p, o.cx + 40, o.cy - 10, 16, { wedge: true }) }),
    // キャベツのポリヤル: キャベツ・ココナッツ、青唐辛子（お好みで）
    in_poriyal: T([['shred', 44, 14], ['curryLeaf', 4, 12]], { minD: 6, flecks: [[COCO, 40, 1.6], [MUSTARD, 14, 1.1], [CHILI, 3, 2]] }),
    // バインガン・バルタ（焼きなすのペースト）: 玉ねぎ・トマト・青唐辛子・香菜
    in_bharta: K([['tomato', 4, 11], ['chiliG', 3, 12], ['onion', 4, 12]], { base: '#8a5a2a', groove: true, crown: [['charEggplant', 1, 22], ['herb', 3, 12]], flecks: [cori(20), ['#f2e2b0', 10, 1.4]] }),
    // ジーラ・アルー（クミンのじゃがいも）: 青唐辛子（お好みで）・香菜
    in_jeeraaloo: T([['potTurmeric', 18, 16], ['chiliG', 3, 11]], { flecks: [[CUMIN, 24, 1.2], cori(16)] }),
    // ブーンディ・ライタ: ヨーグルトに揚げ玉（ブーンディ）
    in_boondiraita: S('#f6f2e6', [['boondi', 22, 14]], { minD: 7, flecks: [[CUMIN, 12, 1.1], [CHILI, 6, 1]] }),
    // ミントと香菜のチャトニ: ミント・香菜・青唐辛子・レモン
    in_pudinachutney: K([], { base: '#4a8a2a', H: 10, groove: true, crown: [['mint', 5, 15], ['chiliG', 1, 13], ['lemonWedge', 1, 16]], flecks: [['#2f6a22', 18, 1.2]] }),
    // ココナッツのチャトニ: ココナッツ・炒りひよこ豆・青唐辛子、マスタードシードとカレーリーフのテンパリング
    in_coconutchutney: K([], { base: '#f4f0e0', H: 10, groove: true, crown: [['coco', 4, 16], ['curryLeaf', 3, 13], ['chiliR', 1, 14]], flecks: [[MUSTARD, 16, 1.2], ['#e8d8b0', 20, 1.2]] }),
    // 南インドのトマトのチャトニ: トマト・玉ねぎ
    in_tomatochutney: K([], { base: '#b8301a', H: 10, groove: true, oilTop: '#e8701e', crown: [['tomatoChunk', 3, 15], ['curryLeaf', 2, 13]], flecks: [[MUSTARD, 14, 1.2]] }),
    // アヴィヤル（ココナッツとヨーグルトの野菜）: 青いバナナ・にんじん・いんげん・ココナッツ
    in_avial: K([['banana', 8, 14], ['carrotStick', 8, 14], ['greenBean', 6, 8], ['moringa', 3, 12], ['curryLeaf', 4, 12]], { base: '#f2e8c8', flecks: [[COCO, 20, 1.4]] }),
    // にんじんと青唐辛子の即席漬け
    in_gajarachar: K([['carrotStick', 18, 16], ['pepperG', 8, 13]], { base: '#c8902a', flecks: [['#c8a040', 24, 1.2]] }),
    // ラウキ・サブジ（ゆうがおの煮物）: ゆうがお・トマト・青唐辛子
    in_laukisabzi: B('#c8a050', [['lauki', 12, 16], ['tomato', 3, 11], ['chiliG', 2, 11]], { flecks: [cori(10)] }),
    // アルー・メティ（じゃがいもとフェヌグリークの葉）
    in_aloomethi: T([['potTurmeric', 14, 15], ['spinach', 14, 10], ['chiliG', 2, 11]]),
    // カレラのフライ（にがうり）: にがうり・玉ねぎ
    in_karelafry: T([['karela', 24, 15], ['friedOnion', 8, 13]], { minD: 8 }),
    // カッタ・ミータ・カドゥ（かぼちゃの甘酢煮）
    in_khattakaddu: B('#c8601e', [['pumpkin', 12, 16]], { flecks: [['#e8d8a0', 8, 1.2]] }),
    // ガジャル・マタル（にんじんとグリンピース）
    in_gajarmatar: T([['carrot', 18, 13], ['pea', 20, 14]], { minD: 8, flecks: [cori(10)] }),
    // コサンバリ（ムング豆のサラダ）: ムング豆・きゅうり・にんじん・ココナッツ・レモン・香菜
    in_kosambari: K([['moong', 40, 12], ['cucumber', 6, 11], ['carrotStick', 8, 10]], { minD: 6, base: '#f2dc80', flecks: [[COCO, 16, 1.4], cori(12)], after: (o, V, p) => W.lemon(p, o.cx + 42, o.cy - 8, 15, { wedge: true }) }),
    // ラッチャ・ピャーズ（スパイスの玉ねぎ）: 赤玉ねぎ・レモン、ミント（お好みで）
    in_lacchapyaz: T([['redOnion', 24, 18], ['mint', 3, 12], ['lemon', 2, 14]], { flecks: [[CHILI, 20, 1.2]] }),
    // ベグン・バジャ（輪切りなすの揚げ焼き）
    in_begunbhaja: T([['begun', 6, 34]], { minD: 30, H: 8 }),
    // ベサン・シムラ・ミルチ（ピーマンのひよこ豆粉炒め）
    in_besanmirch: T([['pepperG', 24, 17]], { flecks: [['#e8c070', 40, 1.8], ['#d8a850', 20, 1.6]] }),
    // ビーツのパチャディ（ヨーグルトの副菜）: ビーツ・ヨーグルト・ココナッツ
    in_beetpachadi: S('#d0507a', [['curryLeaf', 4, 13]], { flecks: [[COCO, 14, 1.4], [MUSTARD, 12, 1.1], ['#a82a48', 14, 1.4]] }),
    // アジュワインのアルビ（さといものカリカリ焼き）、香菜（お好みで）
    in_arbifry: T([['taro', 18, 16]], { flecks: [['#8a6a3a', 20, 1], cori(10)] }),
    // 野菜のサブジ: カリフラワー・にんじん・いんげん・グリンピース・じゃがいも・トマト
    in_mixveg: T([['cauliYellow', 6, 13], ['carrot', 8, 12], ['greenBean', 5, 8], ['pea', 10, 13], ['potTurmeric', 6, 12], ['tomato', 3, 10]], { minD: 8 }),
    // マッシュルームのマサラ: マッシュルーム・玉ねぎ・トマト・香菜
    in_mushroommasala: T([['mushroom', 18, 15], ['onion', 4, 12], ['tomato', 3, 10]], { sauce: '#9a4a1e', flecks: [cori(14)] }),

    // ---------- 汁物 ----------
    // ダール・タルカ: 豆・トマト、にんにくと赤唐辛子とクミンの油、香菜
    in_dal: S('#e8b030', [['garlic', 4, 14], ['chiliR', 2, 14], ['tomato', 2, 10], ['herb', 3, 11]], { top: [['moong', 18, 16]], flecks: [[CUMIN, 16, 1.2]], oil: [12, '#d8901a'] }),
    // サンバル: 豆・小玉ねぎ・トマト・にんじん、なす・ドラムスティック（お好みで）
    in_sambar: S('#b8501e', [['carrot', 6, 12], ['onion', 4, 12], ['eggplant', 3, 11], ['moringa', 3, 12], ['curryLeaf', 4, 12]], { minD: 10 }),
    // トマトのラッサム: トマト・香菜、にんにく
    in_rasam: S('#c8401e', [['tomato', 4, 10], ['garlic', 3, 12], ['curryLeaf', 4, 12], ['herb', 3, 11]], { flecks: [['#5a3a1e', 12, 1]] }),
    // ダール・マカニ: 黒いウラド豆・赤いんげん豆・トマト・バター、生クリーム（お好みで）
    in_dalmakhani: S('#5a2414', [['urad', 12, 12], ['kidney', 6, 13]], { top: [['urad', 12, 16], ['kidney', 4, 16]], minD: 8, cream: '#fbf6ea', after: (o, V, p) => W.butterPat(p, o.cx + 14, o.cy - 4, 9) }),
    // ダール・パラク（豆とほうれん草）: 豆・ほうれん草・トマト・玉ねぎ
    in_dalpalak: S('#b8a030', [['spinach', 8, 12], ['tomato', 2, 10], ['garlic', 2, 12]], { top: [['moong', 10, 16], ['spinach', 3, 14]], flecks: [[CUMIN, 12, 1.1]], oil: [8, '#d8901a'] }),
    // ラウキ・チャナ・ダール: ひよこ豆の割り豆・ゆうがお・トマト・青唐辛子・香菜
    in_laukichana: S('#e0b040', [['lauki', 6, 12], ['grain', 12, 12], ['tomato', 2, 10], ['chiliG', 2, 11]], { top: [['grain', 12, 16]], minD: 8, flecks: [cori(12)] }),
    // パンチメル・ダール（五つの豆）: 豆・トマト、玉ねぎ（お好みで）
    in_panchmel: S('#d0982a', [['lentil', 10, 12], ['redLentil', 10, 12], ['moong', 10, 12], ['tomato', 2, 10]], { top: [['lentil', 8, 16], ['redLentil', 8, 16]], minD: 6, oil: [8, '#d8901a'] }),
    // アムティ（甘酸っぱいダール）: 豆・香菜、ココナッツ（お好みで）
    in_amti: S('#d89a2a', [['herb', 5, 11], ['curryLeaf', 3, 12]], { top: [['moong', 14, 16]], flecks: [[COCO, 12, 1.4], [MUSTARD, 12, 1.1]], oil: [8, '#c8701e'] }),
    // グジャラートのダール: 豆・トマト・青唐辛子、ピーナッツ（お好みで）・香菜
    in_gujaratidal: S('#e8b84a', [['peanut', 10, 14], ['tomato', 3, 10], ['chiliG', 2, 11], ['herb', 3, 11]], { top: [['moong', 14, 16], ['peanut', 4, 15]], minD: 9, flecks: [[MUSTARD, 10, 1.1]] }),
    // ダール・ドクリ（豆の汁に小麦の生地）: 豆・トマト、ピーナッツ（お好みで）・香菜
    in_daldhokli: S('#e0a838', [['dhokli', 9, 18], ['peanut', 6, 14]], { minD: 12, flecks: [cori(10)] }),
    // ダルマ（オディシャの野菜入りダール）: 豆・かぼちゃ・なす・じゃがいも
    in_dalma: S('#d8a83a', [['pumpkin', 5, 12], ['eggplant', 4, 11], ['potato', 4, 11]], { minD: 12, flecks: [[CUMIN, 10, 1.1]] }),
    // チョラール・ダール（ココナッツ入りのベンガルのダール）: ひよこ豆の割り豆・ココナッツ・青唐辛子
    in_cholardal: S('#e8c050', [['coco', 10, 14], ['raisin', 5, 12], ['chiliG', 2, 11]], { top: [['grain', 12, 16], ['coco', 3, 14]], minD: 9, oil: [6, '#e0a030'] }),
    // カディ・パコラ: ヨーグルトとひよこ豆粉の汁に、揚げた玉ねぎのパコラ
    in_kadhipakora: S('#f0c84a', [['pakora', 6, 20]], { minD: 22, flecks: [[CHILI, 10, 1.4], cori(10)] }),
    // グジャラートのカディ: ヨーグルト・ひよこ豆粉・青唐辛子・香菜
    in_gujaratikadhi: S('#f6e6a8', [['curryLeaf', 4, 12], ['chiliG', 2, 11], ['herb', 3, 11]], { flecks: [[MUSTARD, 12, 1.1], [CHILI, 3, 1.6]] }),
    // モール・クランブ（ヨーグルトとココナッツの汁）: とうがん・ココナッツ・青唐辛子
    in_morkuzhambu: S('#f2dc80', [['ashGourd', 8, 14], ['chiliG', 2, 11], ['curryLeaf', 3, 12]], { minD: 12, flecks: [[MUSTARD, 10, 1.1]] }),
    // マトン・ショルバ: 骨つきの羊・玉ねぎ・トマト、じゃがいも（お好みで）・香菜
    in_muttonshorba: S('#a8642a', [['lamb', 5, 15], ['potato', 3, 12], ['tomato', 2, 10]], { minD: 14, flecks: [cori(12)], oil: [10, '#e0a040'] }),
    // チキン・ショルバ: 骨つきの鶏・玉ねぎ・トマト・香菜、ミント（お好みで）
    in_chickenshorba: S('#d8a050', [['chicken', 6, 16], ['mint', 3, 12]], { minD: 14, flecks: [cori(14)], oil: [10, '#f0c040'] }),
    // トマトのショルバ: トマト・玉ねぎ・香菜
    in_tomatoshorba: S('#c8401e', [['herb', 4, 12]], { flecks: [[CUMIN, 10, 1.1]] }),
    // スイートコーンのスープ（インド中華）: コーン・にんじん、いんげん（お好みで）・青ねぎ
    in_sweetcorn: S('#f2dc90', [['corn', 30, 13], ['carrot', 6, 8]], { minD: 6, flecks: [['#4a9a2c', 14, 1.6]] }),
    // 野菜のマンチョウ・スープ: キャベツ・にんじん・ピーマン・青ねぎ、揚げ麺（お好みで）
    in_manchow: S('#6a3418', [['carrot', 6, 8], ['pepperG', 5, 10], ['shred', 5, 10], ['noodleBit', 8, 14]], { minD: 9, flecks: [['#4a9a2c', 12, 1.6]] }),
    // パラク・スープ（ほうれん草のスープ）: ほうれん草・玉ねぎ・牛乳
    in_palaksoup: S('#4a7a2a', [], { top: [['spinach', 5, 16], ['crouton', 4, 14]], cream: '#f6f0e0' }),
    // ケーララの野菜シチュー（イシュトゥ）: じゃがいも・にんじん・いんげん・玉ねぎ・ココナッツミルク
    in_vegishtu: S('#f4ecd8', [['potato', 5, 12], ['carrot', 6, 12], ['greenBean', 4, 8], ['pea', 5, 13], ['curryLeaf', 4, 12], ['chiliG', 2, 11]], { minD: 9 }),
    // 鶏のトゥクパ（ヒマラヤの麺の汁）: 鶏・麺・玉ねぎ・トマト・にんじん・キャベツ・青ねぎ
    in_thukpa: S('#d8a050', [['noodleBit', 12, 16], ['chicken', 5, 14], ['carrotStick', 5, 11], ['cabbage', 3, 10], ['tomato', 2, 10]], { minD: 9, flecks: [['#4a9a2c', 14, 1.6]] }),
};
