// ポーランド（pl_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: ふだんの皿は民芸の赤の縁（#a83a2a）の白い平皿、スープ（rosół・żurek・barszcz）は赤の線の白い深皿、
// 煮込み（ビゴス・ゴウォンプキ・グラシュ）も深皿、サラダ（mizeria・surówka）は白い小鉢。
// ボレスワヴィエツ陶器の青い絵付けは描かない。材料は gohancho/packs/pl.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, T: TR } = W;

const RED = '#a83a2a';
const talerz = (p, o = {}) => Q.plate(p, { line: 'none', edge: RED, ...o });
const gleboki = (p, o = {}) => Q.fukazara(p, { line: RED, ...o });
const miska = (p, o = {}) => W.sideBowl(p, { edge: RED, ...o });
const DILL = ['#5a9a3a', '#4a8a2a'], CHIVE = '#4a9a2c', GRAVY = '#6a3418', SMIETANA = '#fbf6e8';
const lemon = (p, x, y, s = 14) => W.lemon(p, x, y, s, { wedge: true });
const dill = (n = 16) => [DILL, n, 1.2];
const mash = (p, x, y, rx, H = 18, seed = 'm') => W.mound(p, x, y, rx, H, '#f6ecc8', seed, SYF) + W.flecks(p, x, y - H * .6, rx * .7, 12, seed + 'f', DILL, { ry: rx * .25, s: 1.2 });
const ing = {
    kielbasa: (p, x, y, s, r, i, liq) => W.sausageCoin(p, x, y, s * .42, { c: '#8a3a1e', inner: '#d07a6a', liq }),
    whiteSausage: (p, x, y, s, r, i, liq) => W.sausageCoin(p, x, y, s * .42, { c: '#d8c8b0', inner: '#f2e8dc', liq }),
    bacon: (p, x, y, s, r, i) => W.baconBit(p, x, y, s * .55, i),
    beefStew: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#8a4a24', soak: '#5a2410', k: .5, sy: .72 }),
    porkStew: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#a8643a', soak: '#6a3418', k: .5, sy: .72 }),
    chickenCream: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#f2e0c0', soak: '#d8b080', k: .35, sy: .72 }),
    potatoBoiled: (p, x, y, s, r, i) => Q.glossLump(p, x, y, s, i, { c: '#f0d690' }),
    fried: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#c8862e', { h: 2.4, top: Q.rg(p, [[0, '#fbe0a0'], [.6, '#e8b058'], [.9, '#c8802a'], [1, '#9a5a1a']], .4, .35, .8) }),
    rootVeg: (p, x, y, s, r, i, liq) => W.dice(p, x, y, s * .8, '#d8d0b0', p.id + 'rv' + i, { h: s * .45, liq, top: Q.rg(p, [[0, '#fbf8ec'], [1, '#ece4cc']], .4, .35, .8) }),
    pickle: (p, x, y, s) => W.coin(p, x, y, s * .38, '#5a7a2a', { h: 1.8, top: Q.rg(p, [[0, '#d8e0a0'], [.7, '#a8b860'], [1, '#5a7a2a']], .4, .35, .8) }),
    pickleWhole: (p, x, y, s, r) => W.pod(p, x, y, s * 1.6, r, { c: '#5a7a2a', w: 9 }),
    kraut: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1], [s / 2, -1], [s / 2, 1], [-s / 2, 1]], 1.2, i % 2 ? '#efe8c0' : '#e0d8a0', { rot: r, line: .25 }),
    whiteCab: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#f2f2dc' : '#e0ecc0', { rot: r, line: .3 }),
    redCab: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1.2], [s / 2, -1.2], [s / 2, 1.2], [-s / 2, 1.2]], 1.6, i % 2 ? '#7a2a5a' : '#9a3a6a', { rot: r, line: .3 }),
    cabLeaf: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * 1.2, r, i % 2 ? '#c8dc98' : '#a8c870', 'cl' + p.id + i, { wave: 3 }),
    pierog: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="M${f(-s * .6)},${f(s * .1)} A${f(s * .6)},${f(s * .45)} 0 0 1 ${f(s * .6)},${f(s * .1)} Q0,${f(s * .25)} ${f(-s * .6)},${f(s * .1)}Z" fill="${Q.lg(p, [[0, '#fbf2d8'], [.7, '#f0dca8'], [1, '#d8b878']], 0, 0, 0, 1)}" stroke="#c8a868" stroke-width=".7"/>${Array.from({ length: 7 }, (_, k) => { const a = Math.PI * (1 - k / 6); return `<path d="M${f(Math.cos(a) * s * .6)},${f(s * .1 - Math.sin(a) * s * .45)} l${f(Math.cos(a) * 2)},${f(-Math.sin(a) * 2)}" stroke="#d8b878" stroke-width="1.6"/>`; }).join('')}</g>`,
    kopytko: (p, x, y, s, r) => Q.prism(p, x, y, [[-s * .5, -s * .25], [s * .3, -s * .25], [s * .5, 0], [s * .3, s * .25], [-s * .5, s * .25]], s * .3, '#f2e4c0', { rot: r, line: .45, top: Q.lg(p, [[0, '#fbf6e4'], [1, '#e8d8b0']], 0, 0, 0, 1) }),
    kluski: (p, x, y, s, r, i) => W.ball(p, x, y - s * .25, s, '#f6f0e0', p.id + 'kl' + i, { hi: .6, edge: '#c8b890' }) + `<ellipse cx="${f(x)}" cy="${f(y - s * .5)}" rx="${f(s * .16)}" ry="${f(s * .1)}" fill="#d8c8a0"/>`,
    lazanka: (p, x, y, s, r) => Q.prism(p, x, y, Q.square(s * .7), 1.6, '#f2dca0', { rot: r, line: .35 }),
    buckwheat: (p, x, y) => `<path d="M${f(x)},${f(y - 1.6)} l1.4,2.6 l-2.8,0Z" fill="#a8743a" stroke="#7a4a1e" stroke-width=".3"/>`,
    barley: (p, x, y) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.6" fill="#efe2c0" stroke="#c8b080" stroke-width=".3"/>`,
    golabek: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><rect x="${f(-s * .6)}" y="${f(-s * .34)}" width="${f(s * 1.2)}" height="${f(s * .68)}" rx="${f(s * .32)}" fill="${Q.lg(p, [[0, '#e8ecc0'], [.5, '#c8d098'], [1, '#98a868']], 0, 0, 0, 1)}" stroke="#7a8a4a" stroke-width=".6"/><path d="M${f(-s * .4)},${f(-s * .1)} q${f(s * .4)},${f(-s * .2)} ${f(s * .8)},0" stroke="#f6f8e0" stroke-width="1" fill="none"/></g>`,
    roulade: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><rect x="${f(-s * .6)}" y="${f(-s * .32)}" width="${f(s * 1.2)}" height="${f(s * .64)}" rx="${f(s * .3)}" fill="${Q.lg(p, [[0, '#a8643a'], [.5, '#7a3a1a'], [1, '#4a2010']], 0, 0, 0, 1)}" stroke="#3a1a0a" stroke-width=".6"/></g>`,
    meatball: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#d8c0a0', p.id + 'mb' + i, { hi: .6, edge: '#a8906a' }),
    liver: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .5, s * .32, '#6a2a1e', p.id + 'lv' + i, { n: 10, jit: .2, hi: .6, edge: '#3a140a' }),
    prune: (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .3)}" ry="${f(s * .22)}" fill="#3a1e1e"/>`,
    driedMush: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * .8, r, '#6a4a2e', 'dm' + p.id + i, { wave: 2 }),
    egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    eggQuarter: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.1, r % 40 - 20),
    eggStuffed: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 30 - 15, { piped: true, yolk: '#f2d070' }),
    radish: (p, x, y, s) => W.coin(p, x, y, s * .4, '#c8283a', { h: 1.2, top: Q.rg(p, [[0, '#ffffff'], [.8, '#f6eeee'], [.9, '#e86a7a'], [1, '#c8283a']], .4, .35, .8) }),
    herring: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="M${f(-s)},0 Q0,${f(-s * .3)} ${f(s)},0 Q0,${f(s * .25)} ${f(-s)},0Z" fill="${Q.lg(p, [[0, '#8a8478'], [.4, '#c8b8a8'], [1, '#f0e0d8']], 0, 0, 0, 1)}" stroke="#6a6458" stroke-width=".6"/></g>`,
    apple: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#c8281e', p.id + 'ap' + i, { h: s * .45, top: Q.rg(p, [[0, '#fffbe8'], [1, '#f2e6c0']], .4, .35, .8) }),
    sorrel: (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#5a7a2a', 'so' + p.id + i, { wave: 1 }),
    beetGreens: (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#4a6a2a', 'bg' + p.id + i, { wave: 1.6 }) + `<path d="M${f(x - s * .4)},${f(y)} l${f(s * .6)},-2" stroke="#a82a48" stroke-width="1.4"/>`,
    asparagus: (p, x, y, s, r) => W.asparagus(p, x, y, s * 1.4, r),
    crouton: (p, x, y, s, r, i) => W.dice(p, x, y, s * .6, '#c8862e', p.id + 'cr' + i, { h: s * .45, top: Q.rg(p, [[0, '#f6d890'], [1, '#d8a050']], .4, .35, .8) }),
    pastaFine: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s)},0 Q${f(-s / 3)},-3 0,0 T${f(s)},0" stroke="#f0d890" stroke-width="1.4" fill="none"/></g>`,
    smokedRib: (p, x, y, s, r, i) => W.rib(p, x, y, s, r, i, { c: '#a86a3a', glaze: '#8a4a24' }),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(talerz, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(gleboki, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}) => M(gleboki, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}) => M(miska, 'bowl', null, items, { minD: 7, ...o });
const plateOf = (draw) => p => { const D = talerz(p), o = D.o; return D.s + W.grow(o.cx, o.cy, 1.3, draw(p, o)); };
const side = (p, o, list) => byDepth(list.map(([k, u, v, s, r = 0], i) => { const [x, y] = at(o, u, v, 4); return [y, () => (ing[k] || W.ING[k])(p, x, y, s, r, i)]; }));
const cutlet = (p, o, { c = ['#f6d080', '#e0a848', '#a8702a'], rx = 48, ry = 26, u = -18, v = -4, inner = '#f8ecdc', butter = false } = {}) => { const [x, y] = at(o, u, v, 4); return W.cutlet(p, x, y, rx, ry, -8, { c, inner, seed: 'ct' }) + (butter ? `<path d="${Q.blob(x + rx * .3, y + 2, 7, 4, 'dvb', { n: 8, jit: .3 })}" fill="#f6dc70"/>` : ''); };
const potatoesDill = (p, o, u = 34, v = 0) => side(p, o, [['potatoBoiled', u, v - 12, 21], ['potatoBoiled', u + 10, v + 6, 21], ['potatoBoiled', u - 6, v + 16, 21]]) + W.flecks(p, ...at(o, u, v, 12), 14, 12, 'pd' + p.id, DILL, { ry: 8, s: 1.2 });
const sauceCup = (p, o, c) => { const [x, y] = at(o, -46, 32); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="12" ry="${f(12 * SYF)}" fill="#f4f0e6" stroke="${RED}" stroke-width=".8"/><ellipse cx="${f(x)}" cy="${f(y - 1)}" rx="9" ry="${f(9 * SYF)}" fill="${c}"/>`; };

export default {
    // ---------- 主菜 ----------
    // コトレット・スハボヴィ（豚のカツ）とじゃがいも、ディル（お好みで）
    pl_schabowy: plateOf((p, o) => cutlet(p, o) + potatoesDill(p, o)),
    // コトレット・ミェローネ（豚ひき肉のハンバーグ）とじゃがいも
    pl_mielone: plateOf((p, o) => side(p, o, [['patty', -26, -8, 38], ['patty', -8, 12, 38]]) + potatoesDill(p, o)),
    // 鱈のフライとじゃがいも、レモン
    pl_dorsz: plateOf((p, o) => cutlet(p, o, { rx: 46, ry: 22, inner: '#fbf8f2' }) + potatoesDill(p, o) + lemon(p, ...at(o, -40, 28), 12)),
    // 鶏ももとじゃがいものロースト
    pl_udka: P([['drum', 4, 22], ['potatoRoast', 8, 15]], { minD: 16, ing: { ...ing, drum: (p, x, y, s, r, i) => W.drumstick(p, x, y, s * 1.6, r, i, { c: '#c8822e', fried: false }) } }),
    // グラシュ（牛肉の煮込み）とそばの実: 牛肉・玉ねぎ、赤ピーマン・ピクルス（お好みで）
    pl_gulasz: plateOf((p, o) => W.mound(p, ...at(o, 32, -10), 28, 12, '#a8743a', 'kg', SYF) + W.flecks(p, ...at(o, 32, -16, 8), 22, 50, 'kgg', ['#c8945a', '#8a5a2a', '#e0b880'], { ry: 8, s: 1.6 }) + W.pool(p, ...at(o, -16, 8), 40, '#7a2e14', 'gz') + side(p, o, [['beefStew', -26, 2, 16], ['beefStew', -8, 10, 16], ['beefStew', -18, 18, 16], ['pepperR', -30, 16, 12, 20], ['pickle', 30, 26, 14]])),
    // ナレシニキ（甘いチーズのクレープ）とサワークリーム
    pl_nalesniki: plateOf((p, o) => side(p, o, [['crepe', -10, -10, 30, -8], ['crepe', 0, 6, 30, -8]]) + W.mound(p, ...at(o, 24, -4, 10), 12, 6, SMIETANA, 'sm', SYF)),
    // ゴウォンプキ（ロールキャベツのトマトソース）、サワークリーム（お好みで）
    pl_golabki: B('#c8401e', [['golabek', 5, 28]], { minD: 16 }),
    // ビゴス（狩人のシチュー）: ザワークラウト・キャベツ・豚・キェウバサ・干しきのこ、プルーン（お好みで）
    pl_bigos: B('#8a5a2a', [['kraut', 20, 14], ['porkStew', 4, 15], ['kielbasa', 5, 15], ['driedMush', 4, 12], ['prune', 3, 12]], { minD: 8 }),
    // プラツキ（じゃがいものパンケーキ）、サワークリーム（お好みで）
    pl_placki: p => { const D = talerz(p), o = D.o; return D.s + W.grow(o.cx, o.cy, 1.2, byDepth([[-24, -8], [8, -14], [-8, 14], [22, 8]].map(([u, v], i) => { const [x, y] = at(o, u, v, 2 + i * 2); return [y, () => W.jeon(p, x, y, 26, i, { c: '#d8a050', h: 4 }) + W.flecks(p, x, y - 2, 20, 20, 'pk' + i, ['#a8641e', '#f6dca0'], { ry: 8, s: 1.6 })]; })) + W.mound(p, ...at(o, 4, -2, 12), 10, 5, SMIETANA, 'pks', SYF)); },
    // ズラズィ（牛肉巻きの煮込み）: 牛肉・ベーコン・ピクルス・玉ねぎ、そばの実（お好みで）
    pl_zrazy: B('#5a2410', [['roulade', 4, 30]], { minD: 20 }),
    // リバ・ポ・グレツク（白身魚のフライに野菜のトマト煮のせ）
    pl_rybagrecku: plateOf((p, o) => side(p, o, [['fishFried', -16, -4, 30], ['fishFried', 14, 8, 30]]) + W.mound(p, ...at(o, 0, 0, 10), 36, 8, '#e8803a', 'rg', SYF) + byDepth(W.spots('rgv', 30, 32, 5).map(([u, v, r], i) => { const [x, y] = at(o, u, v * .6, 16); return [y, () => [W.ING.carrotStick, ing.kraut, W.ING.onion][i % 3](p, x, y, 10, r, i)]; }))),
    // マスの丸焼き、レモン・ハーブ・じゃがいも
    pl_pstrag: p => { const D = talerz(p), o = D.o; return W.fishOn(p, D, { L: 140, skin: '#a8946a', belly: '#f0e4d0', char: .3, on: (x, y) => lemon(p, x - 20, y - 10, 12) + W.flecks(p, x, y - 6, 40, 14, 'pt', DILL, { ry: 6, s: 1.4 }) + side(p, o, [['potatoBoiled', 40, 28, 14], ['potatoBoiled', 30, 34, 14]]) }); },
    // ド・ヴォライユ（バター入りの鶏カツ）とじゃがいも
    pl_devolaille: plateOf((p, o) => cutlet(p, o, { rx: 42, ry: 22, butter: true }) + potatoesDill(p, o)),
    // 豚スペアリブのはちみつ焼き、じゃがいも（お好みで）
    pl_zeberka: P([['rib', 6, 24], ['potatoRoast', 5, 14], ['onion', 3, 12]], { minD: 14, ing: { ...ing, rib: (p, x, y, s, r, i) => W.rib(p, x, y, s, r, i, { c: '#a8542e', glaze: '#c8762e' }) } }),
    // カルクフカ（豚肩ロースの玉ねぎ煮）、そばの実（お好みで）
    pl_karkowka: B('#6a3418', [['porkStew', 8, 20], ['onion', 5, 14]]),
    // 鶏レバーと玉ねぎの炒め、りんご（お好みで）・じゃがいも
    pl_watrobka: plateOf((p, o) => mash(p, ...at(o, 32, -8, 2), 26, 16) + side(p, o, [['liver', -30, -4, 26], ['liver', -12, 6, 26], ['liver', -24, 18, 26], ['onion', -8, -6, 14, 20], ['onion', -32, 10, 14, -20], ['apple', -2, 16, 12]])),
    // 目玉焼きとじゃがいもとほうれん草、ディル（お好みで）
    pl_jajkosadzone: plateOf((p, o) => W.friedEgg(p, ...at(o, -18, -4, 4), 36, 1) + W.friedEgg(p, ...at(o, 0, 10, 4), 36, 2) + mash(p, ...at(o, 32, -12, 2), 22, 14) + W.mound(p, ...at(o, 30, 18), 18, 6, '#4a7a2a', 'js', SYF)),
    // ファソラ・ポ・ブレトンスク（白いんげんとソーセージのトマト煮）
    pl_bretonska: B('#b8401e', [['whiteBean', 18, 14], ['kielbasa', 5, 15], ['bacon', 3, 12]], { minD: 8 }),
    // レチョ（ピーマンとズッキーニの煮込み）、キェウバサ（お好みで）
    pl_leczo: B('#c8401e', [['pepperR', 5, 14], ['pepperY', 4, 14], ['zucchini', 4, 14], ['kielbasa', 3, 14]]),
    // プルペティ（肉団子のディルソース）、じゃがいも（お好みで）
    pl_pulpety: B('#f2ecd4', [['meatball', 8, 22], ['potatoBoiled', 2, 16]], { flecks: [dill(30)] }),
    // クロキェティ（キャベツときのこのクレープのフライ）
    pl_krokiety: P([['krokiet', 4, 28]], { minD: 18, H: 10, ing: { ...ing, krokiet: (p, x, y, s, r) => `<g ${TR(x, y, r)}><rect x="${f(-s * .7)}" y="${f(-s * .26)}" width="${f(s * 1.4)}" height="${f(s * .52)}" rx="${f(s * .1)}" fill="${Q.lg(p, [[0, '#f0c070'], [.5, '#c8862e'], [1, '#8a5a1e']], 0, 0, 0, 1)}" stroke="#7a4a1a" stroke-width=".6"/></g>` + W.flecks(p, x, y - 2, s * .6, 12, 'kk' + x, ['#f6dca0', '#a8641e'], { ry: s * .14, s: 1 }) } }),
    // 卵のコトレット、じゃがいも（お好みで）
    pl_kotletyjajeczne: plateOf((p, o) => side(p, o, [['eggPatty', -26, -8, 36], ['eggPatty', -8, 12, 36]]) + potatoesDill(p, o)),

    // ---------- 麺・ご飯 ----------
    // ピエロギ・ルスキェ（じゃがいもとチーズの餃子）、揚げ玉ねぎ・サワークリーム（お好みで）
    pl_pierogi: P([['pierog', 7, 26]], { minD: 16, H: 8, flecks: [['#b8742a', 30, 2], ['#d8a050', 16, 2]] }),
    // コピトカ（じゃがいものニョッキ）と揚げ玉ねぎ、ベーコン（お好みで）
    pl_kopytka: P([['kopytko', 18, 18], ['bacon', 4, 12]], { minD: 8, flecks: [['#b8742a', 24, 2]] }),
    // ワザンキ（パスタとキャベツとソーセージ）
    pl_lazanki: P([['lazanka', 20, 18], ['whiteCab', 14, 14], ['kielbasa', 6, 14]], { minD: 6 }),
    // ポトラフカ（鶏のクリーム煮とご飯）: 鶏・にんじん・マッシュルーム、グリンピース（お好みで）
    pl_potrawka: plateOf((p, o) => W.riceMound(p, ...at(o, 30, -14), 26, 20, { sy: SYF }) + W.pool(p, ...at(o, -16, 8), 40, '#f4ead0', 'pt') + side(p, o, [['chickenCream', -24, 2, 16], ['chickenCream', -6, 12, 16], ['carrot', -30, 16, 11], ['pea', -14, 22, 12], ['mushroom', -20, -6, 13]])),
    // そばの実ときのこのソース、ディル（お好みで）
    pl_kaszagrzyby: plateOf((p, o) => W.mound(p, ...at(o, 0, 0), 46, 14, '#a8743a', 'kz', SYF) + W.flecks(p, ...at(o, 0, -6, 8), 40, 90, 'kzg', ['#c8945a', '#8a5a2a', '#e0b880'], { ry: 14, s: 1.6 }) + W.pool(p, ...at(o, 4, -4, 14), 26, '#d8b080', 'kzs') + side(p, o, [['mushroom', -4, -8, 13], ['mushroom', 10, -2, 13], ['mushroom', 0, 4, 13]]) + W.flecks(p, ...at(o, 4, -6, 18), 20, 14, 'kzd', DILL, { ry: 6, s: 1.2 })),

    // ---------- 副菜 ----------
    // ミゼリア（きゅうりのサワークリーム和え）、ディル
    pl_mizeria: K([['cucumber', 22, 14]], { minD: 6, base: '#f8f4e8', flecks: [dill(20)] }),
    // にんじんとりんごのサラダ、レモン
    pl_marchewka: K([['carrotStick', 34, 11], ['apple', 5, 11]], { minD: 5, base: '#f0a050' }),
    // 温かいすりおろしビーツ
    pl_buraczki: K([['beetShred', 40, 12]], { minD: 4, base: '#8a1e34', ing: { ...ing, beetShred: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1], [s / 2, -1], [s / 2, 1], [-s / 2, 1]], 1.2, i % 2 ? '#a82a48' : '#8a1e34', { rot: r, line: .25 }) } }),
    // ザワークラウトのサラダ: ザワークラウト・にんじん・りんご・玉ねぎ
    pl_kiszona: K([['kraut', 44, 14], ['carrotStick', 8, 10], ['apple', 4, 11]], { minD: 4 }),
    // いんげんのバターパン粉がけ
    pl_fasolka: P([['greenBean', 20, 10], ['yellowBean', 8, 10]], { flecks: [['#d8a050', 40, 1.8]], ing: { ...ing, yellowBean: (p, x, y, s, r) => W.pod(p, x, y, s * 2, r, { c: '#e8d060' }) } }),
    // トマトと玉ねぎのサラダ、あさつき（お好みで）
    pl_pomidory: P([['tomatoSlice', 8, 22], ['onion', 6, 13]], { minD: 14, H: 8, flecks: [[CHIVE, 20, 1.4]], ing: { ...ing, tomatoSlice: (p, x, y, s) => W.coin(p, x, y, s * .55, '#c8281a', { h: 3, top: Q.rg(p, [[0, '#ff9a7a'], [.5, '#e8503a'], [.85, '#f6c0a0'], [1, '#c8281a']], .4, .35, .8) }) } }),
    // 野菜のマヨネーズサラダ: じゃがいも・にんじん・パースニップ・卵・ピクルス・グリンピース
    pl_salatkajarzynowa: K([['potato', 10, 12], ['carrot', 8, 10], ['rootVeg', 5, 11], ['egg', 2, 13], ['pickle', 5, 11], ['pea', 8, 12]], { base: '#f6ecd0', minD: 6 }),
    // 新キャベツのディル煮、トマト（お好みで）
    pl_mlodakapusta: K([['cabLeaf', 16, 15], ['tomato', 3, 10]], { base: '#e8ecc8', flecks: [dill(20)] }),
    // 赤キャベツのサラダ: 赤キャベツ・りんご
    pl_czerwonakapusta: K([['redCab', 44, 14], ['apple', 4, 12]], { minD: 5 }),
    // セロリアックとりんごのサラダ、レーズン（お好みで）
    pl_seler: K([['celeriacStick', 26, 12], ['apple', 6, 12], ['raisin', 5, 12]], { minD: 5, base: '#f6f0dc', ing: { ...ing, celeriacStick: (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, -1.4], [s / 2, -1.4], [s / 2, 1.4], [-s / 2, 1.4]], 1.8, '#f2ecd8', { rot: r, line: .3 }) } }),
    // ポロねぎのサラダ: ポロねぎ・卵・りんご、コーン（お好みで）
    pl_porowa: K([['leek', 16, 13], ['egg', 3, 13], ['apple', 5, 11], ['corn', 8, 12]], { base: '#f6f0dc' }),
    // チフィクワ（ビーツとホースラディッシュ）
    pl_cwikla: K([], { base: '#8a1e34', H: 14, flecks: [['#a82a48', 40, 2], ['#f6ecd8', 16, 1.6]] }),
    // 浅漬けきゅうり、ディル
    pl_malosolne: K([['pickleWhole', 7, 16], ['dillHead', 3, 14]], { minD: 12, base: '#d8d8a0', ing: { ...ing, dillHead: (p, x, y, s, r) => `<g ${TR(x, y, r)}>${[-5, -2, 1, 4].map((d, k) => `<path d="M0,0 l${d},-8" stroke="#6a9a3a" stroke-width=".8" fill="none"/><circle cx="${d}" cy="-8" r="1.2" fill="#d8c040"/>`).join('')}</g>` } }),
    // にしんの油漬けと玉ねぎ
    pl_sledz: plateOf((p, o) => side(p, o, [['herring', -10, -10, 34, -8], ['herring', 0, 4, 34, -6], ['herring', 8, 18, 34, -4]]) + W.flecks(p, ...at(o, 0, 4, 8), 34, 30, 'sl', ['#efdcae', '#f6ecd0'], { ry: 14, s: 2.2 }) + W.flecks(p, ...at(o, 0, 0, 8), 30, 12, 'slc', [CHIVE], { ry: 12, s: 1.4 })),
    // カリフラワーのバターパン粉がけ、卵（お好みで）
    pl_kalafior: P([['cauliflower', 10, 16]], { minD: 12, flecks: [['#d8a050', 40, 1.8], ['#f6e0a0', 20, 1.6]] }),
    // にんじんとグリンピースのバター煮
    pl_marchewkagroszek: K([['carrot', 16, 13], ['pea', 24, 14]], { minD: 5, after: (o, V, p) => W.butterPat(p, o.cx, o.cy - 26, 8) }),
    // マッシュポテト、ディル（お好みで）
    pl_puree: K([], { base: '#f6e8c0', H: 22, flecks: [dill(14)] }),
    // シロンスクのじゃがいも団子（くぼみつき）
    pl_kluskislaskie: P([['kluski', 8, 22]], { minD: 18, H: 8, after: (o, D, p) => W.pool(p, o.cx, o.cy + 6, 46, GRAVY, 'kl') }),
    // 詰め卵とあさつき
    pl_jajkafaszerowane: P([['eggStuffed', 6, 20]], { minD: 22, H: 6, flecks: [[CHIVE, 20, 1.4]] }),
    // レタスのサワークリーム和え、卵（お好みで）
    pl_salata: K([['lettuce', 14, 16], ['eggQuarter', 2, 12]], { minD: 10, flecks: [[SMIETANA, 16, 2]] }),
    // ズッキーニのにんにく揚げ焼き
    pl_cukinia: P([['zucBatter', 10, 24]], { minD: 16, H: 10, ing: { ...ing, zucBatter: (p, x, y, s) => W.coin(p, x, y, s * .55, '#d8a040', { h: 3, top: Q.rg(p, [[0, '#fff0b0'], [.6, '#f2cc70'], [1, '#d8a040']], .4, .35, .8) }) } }),
    // マッシュルームのマリネ: マッシュルーム・玉ねぎ
    pl_pieczarkimarynowane: K([['mushCap', 18, 16], ['onion', 4, 11]], { minD: 7, base: '#d8c890' }),
    // オピエカネ（焼きじゃがいもと玉ねぎ）、ベーコン・ディル（お好みで）
    pl_opiekane: P([['fried', 22, 18], ['onion', 5, 12], ['bacon', 4, 12]], { flecks: [dill(12)] }),
    // ブロッコリーと卵のサラダ: ブロッコリー・卵・赤玉ねぎ・マヨネーズ
    pl_brokuly: K([['broccoli', 10, 13], ['egg', 3, 13], ['redOnion', 4, 11]], { base: '#f6ecd0' }),
    // ザワークラウトの炒め煮、ベーコン（お好みで）
    pl_kapustazasmazana: K([['kraut', 50, 14], ['bacon', 4, 11]], { minD: 4, base: '#d8c890' }),
    // トヴァロジェク（クワルクとあさつきとラディッシュ）
    pl_twarozek: K([['radish', 8, 14]], { base: '#fbf8f0', H: 14, flecks: [[CHIVE, 30, 1.6]] }),

    // ---------- 汁物 ----------
    // ロスウ（鶏のスープと細麺）: 鶏・にんじん・パースニップ・セロリアック・ポロねぎ、パセリ
    pl_rosol: S('#f0c860', [['pastaFine', 14, 14], ['carrot', 6, 11], ['chicken', 2, 12]], { minD: 8, flecks: [[DILL[0], 10, 1.4]], oil: [14, '#f6d040'] }),
    // トマトのスープとご飯、サワークリーム
    pl_pomidorowa: S('#d8502a', [['rice', 24, 10]], { top: [['tomatoChunk', 3, 15]], minD: 6, cream: SMIETANA, flecks: [[DILL[0], 8, 1.4]] }),
    // オグルコヴァ（ピクルスのスープ）: ピクルス・じゃがいも・にんじん・サワークリーム・ディル
    pl_ogorkowa: S('#e8dcb0', [['pickle', 8, 13], ['potato', 4, 12], ['carrot', 3, 11]], { minD: 8, flecks: [dill(16)] }),
    // ジュレック（ライ麦の酸っぱいスープ）: ソーセージ・ベーコン・じゃがいも・卵
    pl_zurek: S('#efe4c8', [['whiteSausage', 4, 16], ['bacon', 3, 12], ['potato', 3, 12], ['egg', 2, 15]], { minD: 10, flecks: [['#c8a868', 10, 1.2]] }),
    // バルシチ（澄んだビーツのスープ）
    pl_barszcz: S('#a8182e', [], { top: [['beet', 6, 14]], flecks: [['#c8304a', 6, 1.4]] }),
    // クルプニク（大麦と鶏のスープ）: 鶏・大麦・じゃがいも・にんじん・パースニップ・セロリアック
    pl_krupnik: S('#e8d8a8', [['barley', 30, 12], ['chicken', 3, 12], ['potato', 3, 11], ['carrot', 3, 10], ['rootVeg', 2, 10]], { minD: 6, flecks: [[DILL[0], 10, 1.4]] }),
    // グロホフカ（えんどう豆とスモークソーセージのスープ）
    pl_grochowka: S('#d8b040', [['kielbasa', 5, 15], ['bacon', 3, 12], ['potato', 2, 11], ['carrot', 2, 11]], { top: [['pea', 12, 15]], minD: 10 }),
    // カプシニャク（ザワークラウトとスモークリブのスープ）
    pl_kapusniak: S('#e0cc90', [['kraut', 16, 13], ['smokedRib', 3, 16], ['potato', 3, 12], ['carrot', 3, 10]], { minD: 7 }),
    // カリフラワーのスープ、ディル
    pl_kalafiorowa: S('#f0e4c0', [['cauliflower', 4, 12], ['potato', 3, 11], ['carrot', 3, 10]], { minD: 10, flecks: [dill(16)] }),
    // ヤジノヴァ（野菜のスープ）: じゃがいも・にんじん・パースニップ・セロリアック・ポロねぎ・いんげん・グリンピース
    pl_jarzynowa: S('#e8d8a0', [['potato', 3, 11], ['carrot', 4, 10], ['rootVeg', 3, 10], ['leek', 2, 10], ['greenBean', 3, 8], ['pea', 6, 12]], { minD: 8, flecks: [dill(10)] }),
    // ピェチャルコヴァ（マッシュルームのスープ）: マッシュルーム・玉ねぎ・じゃがいも・サワークリーム
    pl_pieczarkowa: S('#e0cc98', [['mushroom', 6, 13], ['potato', 3, 11]], { minD: 10, flecks: [dill(12)] }),
    // ファソロヴァ（白いんげんとソーセージのスープ）
    pl_fasolowa: S('#d8904a', [['whiteBean', 14, 13], ['kielbasa', 4, 14], ['potato', 2, 11], ['carrot', 2, 10]], { top: [['whiteBean', 12, 16]], minD: 7 }),
    // シュチャヴィオヴァ（すかんぽのスープと卵）
    pl_szczawiowa: S('#a8a858', [['sorrel', 6, 13], ['egg', 2, 15], ['potato', 3, 11]], { minD: 10, cream: SMIETANA }),
    // ボトヴィンカ（若いビーツと葉のスープ）、ディル
    pl_botwinka: S('#c8405a', [['beetGreens', 6, 14], ['beet', 4, 11], ['potato', 3, 11]], { minD: 9, flecks: [dill(14)] }),
    // フウォドニク（冷たいビーツとケフィアのスープ）: きゅうり・ラディッシュ・ディル・あさつき・卵
    pl_chlodnik: S('#e890b0', [['egg', 2, 15], ['cucumber', 4, 11], ['radish', 4, 11]], { minD: 10, flecks: [dill(16), [CHIVE, 10, 1.4]] }),
    // カルトフランカ（マジョラムのじゃがいものスープ）、ベーコン（お好みで）
    pl_kartoflanka: S('#ead8a0', [['potato', 6, 13], ['carrot', 3, 11], ['bacon', 3, 11]], { minD: 9, flecks: [['#7a8a4a', 14, 1.2]] }),
    // ブロッコリーのクリームスープ、クルトン（お好みで）
    pl_brokulowa: S('#8aa850', [['crouton', 6, 13]], { top: [['broccoli', 3, 16], ['crouton', 3, 14]], minD: 12, cream: SMIETANA }),
    // かぼちゃのクリームスープ
    pl_dyniowa: S('#f0a030', [], { top: [['pumpkin', 4, 15], ['pumpkinSeed', 6, 14]], cream: SMIETANA }),
    // 赤レンズ豆のスープ、パセリ（お好みで）
    pl_soczewicowa: S('#e0802a', [['carrot', 4, 11]], { top: [['redLentil', 18, 16]], minD: 12, flecks: [[DILL[0], 10, 1.4]] }),
    // コペルコヴァ（ディルのスープ）
    pl_koperkowa: S('#e8e0b8', [['potato', 4, 12], ['carrot', 3, 11]], { minD: 10, flecks: [dill(40)] }),
    // グラショヴァ（グーラッシュスープ）: 牛肉・玉ねぎ・赤ピーマン・じゃがいも・にんじん
    pl_gulaszowa: S('#a8341a', [['beefStew', 5, 15], ['pepperR', 4, 12], ['potato', 3, 12], ['carrot', 2, 11]], { minD: 10, oil: [10, '#e8701e'] }),
    // グジボヴァ（干しきのこのスープ）と細麺
    pl_grzybowa: S('#8a6a3a', [['driedMush', 8, 14], ['pastaFine', 8, 14]], { top: [['driedMush', 5, 16]], minD: 9, cream: SMIETANA }),
    // アスパラガスのスープ、パセリ（お好みで）
    pl_szparagowa: S('#ece6c0', [['asparagus', 4, 12], ['potato', 2, 11]], { top: [['asparagus', 5, 14]], minD: 12, cream: SMIETANA }),
};
// 皿の上に置く具
Object.assign(ing, {
    patty: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .6, s * .42, i, { c: '#b8782e', n: 16, h: 7, rot: r }),
    eggPatty: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .6, s * .42, i, { c: '#d8a848', n: 16, h: 6, rot: r }) + W.flecks(p, x, y - 4, s * .4, 6, 'ep' + i, [CHIVE], { ry: s * .14, s: 1.2 }),
    crepe: (p, x, y, s, r) => `<g ${TR(x, y, r)}><rect x="${f(-s)}" y="${f(-s * .34)}" width="${f(s * 2)}" height="${f(s * .68)}" rx="${f(s * .2)}" fill="${Q.lg(p, [[0, '#fbe8b0'], [.5, '#f0c870'], [1, '#c8902e']], 0, 0, 0, 1)}" stroke="#b8862e" stroke-width=".6"/></g>` + W.flecks(p, x, y - 2, s * .8, 10, 'cr' + x, ['#c8862e'], { ry: s * .2, s: 1.4 }),
});
