// フランス（fr_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 主菜は金の縁の白い平皿、煮込み・具だくさんのスープはスープ皿（assiette creuse＝洋の深皿）、なめらかなポタージュはスープカップ、
// グラタンは楕円・角の耐熱皿、オニオングラタンスープは取っ手つきの陶器、ムール貝は鋳物の鍋（ココット）、副菜のサラダは白い小鉢。青は使わない。
// 材料は gohancho/packs/fr.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, T, rng, smooth, lt, dk, mix, SY, CZ, SYF, SHADE, at, byDepth } = W;

// =========================================================
// フランスの器と部品
// =========================================================
const GOLD = '#c49a42', CREAM = '#f4ead0';
const P = (o, u, v, z = 0) => at(o, u, v, z);
const plate = (p, o = {}) => Q.plate(p, { line: 'none', edge: GOLD, ...o });
const creuse = (p, o = {}) => Q.fukazara(p, { line: GOLD, ...o });
const cup = (p, o = {}) => W.soupCup(p, o);
const smallBowl = (p, o = {}) => W.sideBowl(p, { outer: '#f4f1ea', inner: '#fbf9f4', edge: GOLD, ...o });
const gratinDish = (p, o = {}) => W.casserole(p, { base: '#efe6d4', inner: '#f8f2e4', ...o });
const cocotte = (p, o = {}) => Q.vessel(p, { cy: 82, rx: 90, h: 52, fx: 52, ft: 0, t: 5, outer: '#c8502a', lip: '#d8683a', inner: '#efe6d4', line: 'none', belly: .7, gloss: .5, ...o });
const parsley = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'pz' + seed, ['#3f7a2a', '#5a9a3a'], { ry: rx * .45, s: 1.3 });
const chives = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'cv' + seed, ['#3f8a2a', '#6ab048'], { ry: rx * .45, s: 1.5 });
const pepper = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'pp' + seed, ['#3a2414', '#5a3a20'], { ry: rx * .45, s: .8 });
const cheese = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'ch' + seed, ['#f8e8b0', '#f2d890', '#e8c870'], { ry: rx * .45, s: 1.6 });
const thyme = (x, y, L, r) => `<g ${T(x, y, r)}><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#6a7a3a" stroke-width="1"/>${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${f(-L / 2 + 3 + i * (L - 6) / 5)}" cy="${i % 2 ? -1.6 : 1.6}" rx="1.8" ry="1" fill="#5a8a3a"/>`).join('')}</g>`;
const lardon = (p, x, y, s, i) => W.baconBit(p, x, y, s, i);
const carrotCoin = (p, x, y, r = 5, liq = null) => W.coin(p, x, y, r, '#e8742a', { h: 2, liq, top: Q.rg(p, [[0, '#ffb070'], [.6, '#f08a3a'], [1, '#d8641e']], .4, .35, .8) });
const potatoDice = (p, x, y, s, i, liq = null) => W.dice(p, x, y, s, '#f2e2b0', 'pd' + i, { h: s * .5, sink: liq ? 2 : 0, liq });
const roastPotato = (p, x, y, s, i) => W.dice(p, x, y, s, '#c8862e', 'rp' + i, { h: s * .6, top: Q.rg(p, [[0, '#fbe0a0'], [.6, '#e8b058'], [.9, '#c8802a'], [1, '#9a5a1a']], .4, .35, .75) });
const leekRing = (p, x, y, r = 5) => W.coin(p, x, y, r, '#9ac860', { h: 1.6, top: Q.rg(p, [[0, '#f6f8e0'], [.6, '#dce8b0'], [1, '#8ab858']], .4, .35, .8) }) + `<ellipse cx="${f(x)}" cy="${f(y - 1.4)}" rx="${f(r * .5)}" ry="${f(r * .3)}" fill="none" stroke="#b8d080" stroke-width=".6"/>`;
const zucchiniRound = (p, x, y, r, liq = null) => W.coin(p, x, y, r, '#3f7a2a', { h: 2.2, liq, top: Q.rg(p, [[0, '#f8f6d8'], [.75, '#e4ecb8'], [.9, '#a8c870'], [1, '#3f7a2a']], .4, .35, .8) });
const eggplantRound = (p, x, y, r) => W.coin(p, x, y, r, '#5a2a4a', { h: 2.4, top: Q.rg(p, [[0, '#f2e4b8'], [.75, '#e0c890'], [.9, '#a8783a'], [1, '#5a2a4a']], .4, .35, .8) });
const tomatoRound = (p, x, y, r) => W.coin(p, x, y, r, '#c8281a', { h: 2.4, top: Q.rg(p, [[0, '#ff9a7a'], [.5, '#e8503a'], [.7, '#f6c050'], [1, '#c8301e']], .45, .4, .7) });
const olive = (p, x, y, s, c = '#4a3028') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s / 2)}" ry="${f(s * .38)}" fill="${Q.rg(p, [[0, lt(c, .35)], [.6, c], [1, dk(c, .3)]], .35, .3, .8)}" stroke="${dk(c, .4)}" stroke-width=".5"/><ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .12)}" rx="${f(s * .12)}" ry="${f(s * .07)}" fill="#fff" opacity=".7"/>`;
const mussel = (p, x, y, s, r) => `<g ${T(x, y, r)}>${Q.cast(p, 0, s * .2, s * .5, s * .15, .3)}<path d="M${f(-s / 2)},0 Q${f(-s * .2)},${f(-s * .38)} ${f(s / 2)},${f(-s * .1)} Q${f(s * .1)},${f(s * .34)} ${f(-s / 2)},0Z" fill="${Q.lg(p, [[0, '#5a4a40'], [1, '#2e2420']], 0, 0, 0, 1)}" stroke="#2a1e18" stroke-width=".6"/><path d="M${f(-s * .38)},${f(-s * .02)} Q${f(-s * .1)},${f(-s * .26)} ${f(s * .38)},${f(-s * .08)} Q${f(s * .02)},${f(s * .16)} ${f(-s * .38)},${f(-s * .02)}Z" fill="${Q.rg(p, [[0, '#f8b080'], [1, '#d8703a']], .4, .35, .8)}"/></g>`;
const sausage = (p, x, y, L, r, i, c = '#a8502a') => W.cutSlab(p, x, y, L / 2, 6, 7, c, 's' + i, { rot: r, sear: dk(c, .4), jit: .04 });
const croutonB = (p, x, y, s, i) => W.dice(p, x, y, s, '#d89a48', 'cr' + i, { h: s * .7, top: Q.rg(p, [[0, '#f8d898'], [.6, '#e0a858'], [1, '#b8742a']], .4, .35, .8) });
// タルト（キッシュ）: 菊型の縁の生地と、焼けた卵の面
function tart(p, cx, cy, rx, { fill = '#f2cc60', seed = 1, top = () => '' } = {}){
    const ry = rx * SYF, h = 10;
    let s = Q.ground(p, cx, cy + h + ry * .3, rx * .9, { k: SYF });
    s += `<path d="M${f(cx - rx)},${f(cy)} L${f(cx - rx + 2)},${f(cy + h)} A${f(rx - 2)},${f(ry - 1)} 0 0 0 ${f(cx + rx - 2)},${f(cy + h)} L${f(cx + rx)},${f(cy)}Z" fill="${Q.lg(p, [[0, '#f0c070'], [.6, '#d89a48'], [1, '#a8682a']])}" stroke="#8a5420" stroke-width=".6"/>`;
    for (let i = 0; i < 28; i++){ const a = i / 28 * 6.283; s += `<path d="M${f(cx + Math.cos(a) * rx)},${f(cy + Math.sin(a) * ry)} l0,${f(h * .9)}" stroke="#b8783a" stroke-width=".8" opacity="${Math.sin(a) > 0 ? .8 : 0}"/>`; }
    s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="#e8b060" stroke="#a8682a" stroke-width=".6"/><ellipse cx="${f(cx)}" cy="${f(cy + 1)}" rx="${f(rx - 6)}" ry="${f(ry - 5)}" fill="${Q.rg(p, [[0, lt(fill, .35)], [.6, fill], [.9, '#d8902a'], [1, '#b8742a']], .4, .35, .8)}"/>`;
    return s + W.flecks(p, cx, cy, rx - 10, 30, 'tt' + seed, ['#d8902a', '#c8782a'], { ry: ry - 8, s: 2 }) + top(cx, cy, rx - 8, ry - 7);
}
// 鶏の丸焼き（こんがりした胴ともも）
function roastChicken(p, x, y, s){
    const body = Q.lump(p, x, y, s / 2, s * .34, '#c8803a', 'rcb', { n: 12, jit: .06, hi: .7, edge: '#8a4a1a' });
    const leg = side => Q.lump(p, x + side * s * .36, y + s * .12, s * .18, s * .14, '#b8702a', 'rcl' + side, { n: 9, jit: .1, hi: .6 }) + `<path d="M${f(x + side * s * .44)},${f(y + s * .2)} l${f(side * 8)},4" stroke="#f2e4c4" stroke-width="3.4" stroke-linecap="round"/>`;
    return leg(-1) + body + leg(1) + Q.shine(x - s * .15, y - s * .2, s * .3, -10, .9);
}
// ---------- 組み立て ----------
const plateHeap = (p, D, seed, n, R, minD, H, draw, { sauce = null, sauceR = 34 } = {}) => { R *= .92; H += 5; return D.s + (sauce ? W.pool(p, D.o.cx + 4, D.o.cy + 8, sauceR, sauce, seed) : '') + byDepth(W.spots(seed, Math.round(n * 1.3), R, minD * .85).map(([u, v, r], i) => { const [x, y] = P(D.o, u, v, 4 + W.hill(u, v, R, H)); return [y, () => draw(x, y, r, i)]; })); };
const heapBowl = (p, V, seed, n, minD, H, draw, { base = null, R = 64, after = () => '' } = {}) => W.inBowl(p, V, { R, H, base, items: (o, RR, HH) => [...W.onHill(o, seed, n, RR * .95, minD, HH, draw), [999, () => after(o, HH)]] });
const braise = (p, V, c, seed, n, minD, H, draw, { srx = 54, R = 52 } = {}) => W.heap(p, V, { c, drop: 4, H, R, srx, items: (pl) => [...W.spots(seed, n, R - 4, minD), ...W.spots(seed + '2', Math.round(n / 3), R * .5, minD).map(([u, v, r]) => [u, v, r, H * .35])].map(([u, v, r, z = 0], i) => { const [x, y] = pl(u, v, z); return [y, () => draw(x, y, r, i)]; }) });
const soupe = (p, c, items, o = {}) => W.soup(p, creuse(p), { c, drop: 4, glow: .35, gl: .5, items, ...o });
const potage = (p, c, items = () => [], o = {}) => W.soup(p, cup(p), { c, drop: 6, glow: .35, items, ...o });
const baked = (p, fill, top = () => '', o = {}) => { const V = gratinDish(p, o); return V.s + `<g ${V.inside}>${fill(V.o, V)}</g>` + top(V.o, V); };
const gratin = (p, c = '#f2c860', seed = 'gr') => `<rect width="200" height="200" fill="${c}"/>` + W.flecks(p, 100, 96, 80, 90, seed, ['#d8902a', '#c8782a', '#f8e0a0', '#a8601e'], { ry: 46, s: 2.4 });

// =========================================================
// 品
// =========================================================
export default {
    // ---------- 主菜 ----------
    // バスク風チキン（プーレ・バスケーズ）: 骨つきの鶏ももをパプリカ・トマト・玉ねぎと煮込む、ご飯（お好みで）（スープ皿）
    fr_basquaise: p => braise(p, creuse(p), '#c8401e', 'bq', 16, 12, 24, (x, y, r, i) => i % 4 === 0 ? Q.soakLump(p, x, y, 24, i, { c: '#c8783a', soak: '#a8341e', k: .5, sy: .72 }) : W.pepperStrip(p, x, y, 18, r, i % 2 ? '#d8302a' : '#3f8a2a')) + W.riceMound(p, 136, 70, 18, 10),
    // アッシ・パルマンティエ: 牛ひき肉と玉ねぎの上にマッシュポテトをのせ、エメンタールで焼く（耐熱皿）
    fr_hachis: p => baked(p, () => gratin(p, '#f2d488', 'hc'), (o) => Q.shine(70, 80, 30, -8, .5)),
    // キッシュ・ロレーヌ: 練り込み生地に、ベーコン・卵・生クリーム・エメンタール（お好みで）
    fr_quiche: p => { const D = plate(p); return D.s + tart(p, 100, 98, 66, { top: (cx, cy, rx, ry) => W.spots('qc', 12, rx * .8, 14, { ry: ry * .8 }).map(([u, v], i) => W.baconBit(p, cx + u, cy + v, 6, i)).join('') }); },
    // 鮭のポワレ、レモンバター: 皮目からカリッと焼き、レモンとバター、いんげん（お好みで）
    fr_saumon: p => { const D = plate(p), o = D.o; const [x, y] = P(o, 4, 2);
        return D.s + byDepth([-14, -7, 0, 7, 14].map((v, i) => { const [ax, ay] = P(o, -14 + i * 2, -32 + v * .8); return [ay, () => W.pod(p, ax, ay, 60, -8 + i)]; })) + W.pool(p, x + 6, y + 10, 30, '#f2d070', 'sm') + W.cutSlab(p, x, y, 42, 24, 11, '#f08a5a', 1, { rot: -10, sear: '#a8501e', edgeC: '#f8b890' }) + [-.3, -.1, .1, .3].map(k => `<path d="M${f(x + k * 76 - 4)},${f(y - 16)} Q${f(x + k * 76 + 2)},${f(y - 4)} ${f(x + k * 76 - 2)},${f(y + 10)}" stroke="#fde0c8" stroke-width="1.6" fill="none" opacity=".8"/>`).join('') + W.lemon(p, ...P(o, 44, 34), 22, { wedge: true, rot: -16 }) + W.flecks(p, x, y - 8, 26, 12, 'smd', ['#5a8a3a'], { ry: 10, s: 1.3 }); },
    // ソーセージと緑レンズ豆の煮込み（スープ皿）: 燻製ソーセージ・ル・ピュイのレンズ豆・にんじん・玉ねぎ、ベーコン（お好みで）
    fr_lentilles: p => W.soup(p, creuse(p), { c: '#5a4a2a', drop: 4, glow: .25, items: (pl, S) => [
        ...W.spots('lt', 70, 56, 4).map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="1.5" fill="${Q.rg(p, [[0, '#8a8a5a'], [1, '#4a4a2a']], .35, .3, .8)}"/>`]; }),
        ...[[-24, -6, -20], [20, -2, 10], [-2, 18, -6]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 3); return [y + 4, () => sausage(p, x, y, 44, r, i, '#9a4a2a')]; }),
        ...W.spots('ltc', 6, 52, 14).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => carrotCoin(p, x, y, 5)]; }),
        ...W.spots('ltl', 4, 50, 16).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => lardon(p, x, y, 6, i)]; }),
    ] }),
    // 豚肉のマスタードソース: 豚ロースを焼いて、ディジョンと粒マスタードとクリームのソース、マッシュルーム（お好みで）
    fr_porcmoutarde: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 104, 110, 50, '#e8c870', 'pm') + byDepth([[-14, -6, -8, 1], [14, 14, -4, 2]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => W.cutSlab(p, x, y, 30, 18, 7, '#d8a070', i, { rot: r, sear: '#8a4a1a', edgeC: '#f0d8b8' })]; })) + W.flecks(p, 100, 98, 40, 40, 'pmg', ['#a8782a', '#c8a048'], { ry: 26, s: 1 }) + [[36, -16], [-36, 24], [40, 30]].map(([u, v], i) => W.mushSlice(p, ...P(o, u, v, 2), 13, i * 30)).join(''); },
    // ブフ・ブルギニョン: 牛肉を赤ワインで煮込み、にんじん・玉ねぎ・ベーコン、マッシュルーム（お好みで）（スープ皿）
    fr_bourguignon: p => braise(p, creuse(p), '#5a1e1a', 'bb', 14, 14, 26, (x, y, r, i) => { const k = i % 5; return k < 2 ? W.dice(p, x, y, 15, '#4a1e14', 'bb' + i, { h: 10, top: Q.rg(p, [[0, '#8a4a3a'], [.6, '#5a2a1e'], [1, '#3a1a10']], .4, .35, .8) }) : k === 2 ? carrotCoin(p, x, y, 6) : k === 3 ? W.mushCap(p, x, y, 12, '#c8a478') : lardon(p, x, y, 7, i); }) + parsley(p, 100, 80, 40, 20, 'bb'),
    // ブランケット・ド・ヴォー: 子牛肉・にんじん・玉ねぎ・マッシュルームを白いクリームソースで、ご飯（お好みで）（スープ皿）
    fr_blanquette: p => braise(p, creuse(p), '#f4ead0', 'bl', 14, 14, 22, (x, y, r, i) => { const k = i % 4; return k < 2 ? Q.lump(p, x, y, 10, 7, '#efe2c8', 'bl' + i, { n: 9, jit: .2, hi: .5 }) : k === 2 ? carrotCoin(p, x, y, 6) : W.mushCap(p, x, y, 12, '#e8dcc0'); }) + W.riceMound(p, 138, 70, 18, 10),
    // 鶏の丸焼きとじゃがいも（プーレ・ロティ）: にんにく・タイム、玉ねぎ、レモン（お好みで）
    fr_pouletroti: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -2, -2); return D.s + W.pool(p, 104, 110, 52, '#c8903a', 'pr') + byDepth([[-48, 20], [-30, 36], [0, 40], [30, 36], [48, 18], [-44, -18], [44, -20]].map(([u, v], i) => { const [xx, yy] = P(o, u, v); return [yy, () => roastPotato(p, xx, yy, 14, i)]; }).concat([[y, () => roastChicken(p, x, y - 6, 70)]])) + thyme(140, 72, 22, 20) + W.lemon(p, 58, 70, 16, { wedge: true, rot: 10 }); },
    // 豚のロースト、じゃがいも: 玉ねぎ・にんじん（お好みで）、にんにくとタイム
    fr_rotiporc: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 104, 110, 46, '#b8823a', 'rp') + byDepth([-30, -12, 6, 24].map((u, i) => { const [x, y] = P(o, u, -u * .3 - 8); return [y, () => W.coin(p, x, y, 17, '#c8946a', { h: 7, sy: SYF, top: Q.rg(p, [[0, '#fbf0e4'], [.6, '#f0d8c0'], [.85, '#d8a878'], [1, '#9a6a3a']], .45, .4, .7) })]; }).concat([[-40, 30], [-14, 38], [14, 36], [42, 26]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => i % 2 ? roastPotato(p, x, y, 14, i) : W.coin(p, x, y, 6, '#e8742a', { h: 3 })]; }))) + thyme(140, 70, 22, 20); },
    // タルティフレット: じゃがいも・ルブロション・ベーコン・玉ねぎを焼く、生クリーム（お好みで）（耐熱皿）
    fr_tartiflette: p => baked(p, (o) => `<rect width="200" height="200" fill="#f2d488"/>` + byDepth(W.spots('tf', 20, 74, 12, { ry: 44 }).map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => i % 3 ? potatoDice(p, x, y, 13, i) : lardon(p, x, y, 8, i)]; })) + [[-30, -10], [20, 0], [-4, 18]].map(([u, v], i) => { const [x, y] = P(o, u, v); return `<path d="${Q.blob(x, y - 6, 28, 12, 'rb' + i, { n: 12, jit: .3 })}" fill="${Q.rg(p, [[0, '#fff6d8'], [.6, '#f6dc90'], [.9, '#d8a048'], [1, '#b8782a']], .4, .35, .8)}"/>`; }).join(''), (o) => pepper(p, 100, 92, 60, 30, 'tf'), { base: '#c87a46', inner: '#e8c8a0' }),
    // トマトの肉詰め: ソーセージの肉（牛ひき肉）・玉ねぎ・パン・卵を詰めて焼く、まわりにご飯（お好みで）（耐熱皿）
    fr_tomatesfarcies: p => baked(p, (o) => W.riceMound(p, 100, 104, 90, 4, { n: 500 }) + byDepth([[-44, -12], [0, -16], [44, -12], [-22, 18], [22, 18]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.coin(p, x, y, 18, '#c8281a', { h: 18, sy: SYF, top: Q.rg(p, [[0, '#c87a4a'], [.7, '#9a4a2a'], [1, '#c8281a']], .4, .35, .8) }) + W.coin(p, x - 2, y - 22, 10, '#c8281a', { h: 3, sy: SYF, top: Q.rg(p, [[0, '#ff8a6a'], [1, '#c8281a']], .4, .35, .8) }) + `<path d="M${f(x - 4)},${f(y - 25)} l4,-4 l4,4" stroke="#3f7a2a" stroke-width="1.6" fill="none"/>`]; })), () => '', { base: '#c87a46', inner: '#e8c8a0' }),
    // クロックムッシュ: 食パンにハムとチーズ、ベシャメルをのせて焼く
    fr_croque: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-14, -8, -10, 1], [16, 14, 8, 2]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => W.bread(p, x, y, 58, r, { toast: .4, th: 14 }) + `<path d="${Q.blob(x, y - 15, 22, 15, 'cq' + i, { n: 12, jit: .25, rot: r })}" fill="${Q.rg(p, [[0, '#fff2c0'], [.6, '#f2c860'], [.9, '#c8822a'], [1, '#a8601e']], .4, .35, .8)}"/>` + `<path d="M${f(x - 26)},${f(y + 2)} l52,0" stroke="#e89a94" stroke-width="2.4"/>`]; })) + W.flecks(p, 100, 92, 40, 20, 'cqp', '#a8601e', { ry: 20, s: 1.6 }); },
    // シュークルート: 塩漬けキャベツに、ストラスブールとモンベリアールのソーセージ・燻製豚・じゃがいも
    fr_choucroute: p => { const D = plate(p), o = D.o; return D.s + W.strands(p, 100, 104, 56, 18, ['#f2e8b0', '#e8dc98', '#fbf4d0'], 'cc', { n: 160, L: 16, w: 2 }) + byDepth([[-30, -18, -20, 'f'], [8, -24, 10, 'm'], [30, 0, -10, 'f'], [-20, 14, 0, 'p'], [10, 22, 10, 'p'], [-40, 30, 0, 'p'], [40, 28, 0, 's']].map(([u, v, r, k], i) => { const [x, y] = P(o, u, v, 12); return [y, () => k === 'f' ? sausage(p, x, y, 50, r, i, '#e8b890') : k === 'm' ? sausage(p, x, y, 44, r, i, '#9a3a1e') : k === 'p' ? Q.glossLump(p, x, y, 18, i, { c: '#f0d690' }) : W.dice(p, x, y, 18, '#e8a890', 'sp' + i, { h: 9, top: Q.lg(p, [[0, '#fbe4d4'], [.4, '#d88a7a'], [.6, '#f6ecdc'], [1, '#c87a6a']], 0, 0, 0, 1) })]; })); },
    // 田舎風オムレツ: じゃがいも・ベーコン・玉ねぎ、チーズ（お好みで）、パセリ
    fr_omelette: p => { const D = plate(p); return D.s + W.jeon(p, 100, 100, 58, 1, { c: '#f2c440', h: 7 }) + byDepth(W.spots('om', 14, 44, 13, { ry: 28 }).map(([u, v], i) => [100 + v, () => i % 2 ? potatoDice(p, 100 + u, 96 + v * SYF, 8, i) : lardon(p, 100 + u, 96 + v * SYF, 6, i)])) + parsley(p, 100, 94, 44, 26, 'om') + Q.shine(76, 84, 22, -8, .7); },
    // そば粉のガレット: ハム・目玉焼き・エメンタールを包んで四角に折る、有塩バター
    fr_galette: p => { const D = plate(p), o = D.o, x = 100, y = 98, s = 46;
        const sq = `M${f(x - s)},${f(y)} L${f(x)},${f(y - s * SYF)} L${f(x + s)},${f(y)} L${f(x)},${f(y + s * SYF)}Z`;
        return D.s + W.jeon(p, x, y + 2, 64, 1, { c: '#8a5a2a', h: 2 }) + `<path d="${sq}" fill="#e8c890" opacity=".9"/><path d="${Q.blob(x, y, 28, 18, 'gh')}" fill="#e89a94"/>` + cheese(p, x, y, 26, 40, 'gc') + W.friedEgg(p, x, y - 2, 30, 1, { sy: SYF }) + `<path d="${sq}" fill="none" stroke="#6a3a14" stroke-width="2.4"/>` + [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([a, b]) => `<path d="M${f(x + a * s)},${f(y + b * s * SYF)} L${f(x + a * s * .6 + b * s * .4)},${f(y + b * s * SYF * .6 + a * s * SYF * .4)}" stroke="#a8743a" stroke-width="1" opacity=".0"/>`).join(''); },
    // タラのパピヨット: 紙包みでタラ・ズッキーニ・にんじん・ミニトマト・レモンを蒸し焼き、タイム
    fr_papillote: p => { const D = plate(p), o = D.o, x = 100, y = 100;
        const paper = `M${f(x - 70)},${f(y + 6)} C${f(x - 72)},${f(y - 30)} ${f(x + 72)},${f(y - 30)} ${f(x + 70)},${f(y + 6)} C${f(x + 60)},${f(y + 34)} ${f(x - 60)},${f(y + 34)} ${f(x - 70)},${f(y + 6)}Z`;
        const it = [[y, () => W.cutSlab(p, x - 4, y - 4, 26, 12, 6, '#f6f2e8', 1, { rot: -6, edgeC: '#e0d8c8' })], ...[[-34, 0], [32, -2], [-20, 14], [24, 14]].map(([u, v], i) => [y + v, () => i % 2 ? zucchiniRound(p, x + u, y + v, 6) : carrotCoin(p, x + u, y + v, 5)]), ...[[-40, 10], [40, 8]].map(([u, v]) => [y + v + 1, () => W.tomatoBall(p, x + u, y + v - 4, 10)]), [y + 20, () => W.lemon(p, x + 6, y - 10, 16) + thyme(x - 10, y - 14, 20, 20)]];
        return D.s + Q.dropOf(p, paper, 2, 4, .3) + `<path d="${paper}" fill="${Q.lg(p, [[0, '#fbf6e8'], [1, '#e8dcc0']], 0, 0, 1, 1)}" stroke="#c8b898" stroke-width=".8"/><path d="${Q.blob(x, y + 2, 56, 18, 'pi')}" fill="#f4ead0"/>` + byDepth(it) + `<path d="M${f(x - 70)},${f(y + 6)} C${f(x - 60)},${f(y + 34)} ${f(x + 60)},${f(y + 34)} ${f(x + 70)},${f(y + 6)}" fill="none" stroke="#c8b898" stroke-width="3" stroke-dasharray="3 2"/>`; },
    // サラダ・ニソワーズ: ツナ・卵・トマト・黒オリーブ・レタス、いんげん・小さなじゃがいも（お好みで）
    fr_nicoise: p => { const D = plate(p), o = D.o; return plateHeap(p, D, 'nc', 14, 50, 14, 10, (x, y, r, i) => Q.leaf(p, x, y, 28, r, i % 2 ? '#7ab848' : '#5a9a34', 'nl' + i, { wave: 3.4 })) + byDepth([[-30, -12, 'e'], [24, -16, 'e'], [0, 2, 't'], [-24, 20, 'm'], [30, 16, 'm'], [-6, -22, 'b'], [10, 24, 'p']].map(([u, v, k], i) => { const [x, y] = P(o, u, v, 16); return [y, () => k === 'e' ? W.eggHalf(p, x, y, 22, i * 10) : k === 't' ? Q.lump(p, x, y, 12, 8, '#e8c8a8', 'tu', { n: 9, jit: .35, hi: .4 }) : k === 'm' ? W.tomatoDice(p, x, y, 12, i) : k === 'b' ? W.pod(p, x, y, 22, 20) : Q.glossLump(p, x, y, 14, i, { c: '#f0d690' })]; })) + [[-12, 10], [18, 0], [-36, 0], [4, 30]].map(([u, v]) => olive(p, ...P(o, u, v, 18), 7)).join(''); },
    // ムール・マリニエール: ムール貝をエシャロットと白ワインで、生クリーム（お好みで）、パセリ（鋳物の鍋）
    fr_moules: p => { const V = cocotte(p), o = { cx: 100, cy: V.cy + 6 }, H = 26;
        return V.s + `<g ${V.above}>${W.mound(p, o.cx, o.cy, 80, H * .7, '#3a2e28', 'ml')}${byDepth(W.onHill(o, 'ml', 30, 76, 13, H, (x, y, r) => mussel(p, x, y, 22, r), { lift: 2 }))}${parsley(p, o.cx, o.cy - H * CZ * .6, 50, 30, 'ml')}</g>` + V.shine(.5); },
    // 子羊のもものロースト: にんにくを差して焼き、ローズマリーとタイム、じゃがいも・玉ねぎ（お好みで）
    fr_gigot: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 104, 110, 46, '#9a5a2a', 'gg') + byDepth([-30, -12, 6, 24].map((u, i) => { const [x, y] = P(o, u, -u * .3 - 8); return [y, () => W.coin(p, x, y, 17, '#8a4a28', { h: 7, sy: SYF, top: Q.rg(p, [[0, '#f0b8a8'], [.5, '#d88a7a'], [.8, '#a8604a'], [1, '#6a3418']], .45, .4, .7) })]; }).concat([[-40, 30], [-14, 38], [14, 36], [42, 26]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => roastPotato(p, x, y, 14, i)]; }))) + thyme(140, 70, 22, 20); },
    // カスレ（家庭風）: 白いんげん・鴨のコンフィ・トゥールーズソーセージ・豚肉をトマトで煮込み、焼く（土鍋のカソール）
    fr_cassoulet: p => { const V = W.bowl(p, { outer: '#a85a32', inner: '#e8c8a0', h: 46, cy: 86, rx: 90, fx: 50 }), o = { cx: 100, cy: V.cy + 4 };
        return V.s + `<g ${V.above}><ellipse cx="100" cy="${f(o.cy)}" rx="84" ry="${f(84 * SY)}" fill="#d8a058"/>${byDepth(W.spots('cs', 40, 74, 8, { ry: 74 }).map(([u, v, r]) => { const [x, y] = P(o, u, v); return [y, () => Q.bean(p, x, y, 8, r, '#efe2c8')]; }).concat([[-30, -6, -10, 's'], [20, -12, 10, 'd'], [26, 16, -6, 's'], [-14, 18, 0, 'p']].map(([u, v, r, k], i) => { const [x, y] = P(o, u, v, 4); return [y + 2, () => k === 's' ? sausage(p, x, y, 40, r, i) : k === 'd' ? Q.lump(p, x, y, 16, 11, '#c8803a', 'dk', { hi: .6 }) : W.dice(p, x, y, 14, '#c8946a', 'cp', { h: 7 })]; })))}${W.flecks(p, 100, o.cy, 70, 60, 'csc', ['#c8782a', '#a8601e', '#e8b868'], { ry: 34, s: 2 })}</g>` + V.shine(.4); },
    // チコリとハムのグラタン: ベルギーチコリをハムで巻き、ベシャメルとエメンタールで焼く（耐熱皿）
    fr_endives: p => baked(p, (o) => `<rect width="200" height="200" fill="#f6e2a8"/>` + byDepth([-30, -6, 18, 42].map((v, i) => { const [x, y] = P(o, 0, v - 6); return [y, () => `<g ${T(x, y)}><rect x="-62" y="-10" width="124" height="20" rx="10" fill="${Q.lg(p, [[0, '#f2b0a8'], [.5, '#e89a94'], [1, '#c87a74']], 0, 0, 0, 1)}" stroke="#a86a64" stroke-width=".6"/>${[-40, -10, 20, 50].map(u => `<path d="M${u},-9 q4,9 0,18" stroke="#c8807a" stroke-width=".8" fill="none"/>`).join('')}</g>`]; })) + `<rect width="200" height="200" fill="#f6dc90" opacity=".55"/>` + W.flecks(p, 100, 96, 80, 70, 'enc', ['#d8902a', '#c8782a', '#f8e0a0'], { ry: 46, s: 2.2 })),
    // ポロねぎのタルト: 練り込み生地に、ポロねぎ・卵・生クリーム、グリュイエール（お好みで）
    fr_tartepoireaux: p => { const D = plate(p); return D.s + tart(p, 100, 98, 66, { fill: '#f0d070', top: (cx, cy, rx, ry) => W.spots('tp', 14, rx * .8, 13, { ry: ry * .8 }).map(([u, v]) => `<ellipse cx="${f(cx + u)}" cy="${f(cy + v)}" rx="5" ry="3" fill="none" stroke="#7ab050" stroke-width="1.6"/>`).join('') }); },
    // 野菜のクスクス、ひよこ豆: クスクスに、にんじん・ズッキーニ・かぶ・玉ねぎ・トマトのスープ煮、メルゲーズ（お好みで）（スープ皿）
    fr_couscous: p => { const V = creuse(p), o = { cx: 100, cy: V.cy + 2, sy: SYF }, H = 22;
        return V.s + `<g ${V.above}>${W.friedRice(p, o.cx, o.cy, 54, H, 'cs', { cols: ['#f2dca0', '#e8cc88', '#fbecc0'], edge: '#c8a860', n: 600, sy: SYF })}${byDepth(W.spots('csv', 16, 44, 12).map(([u, v, r], i) => { const [x, y] = P(o, u, v, W.hill(u, v, 54, H) + 3); const k = i % 5; return [y, () => k === 0 ? Q.rangiri(p, x, y, 12, r, '#e8742a', i) : k === 1 ? zucchiniRound(p, x, y, 6) : k === 2 ? Q.pea(p, x, y, 4, '#e8c890') : k === 3 ? W.dice(p, x, y, 9, '#f2ecd8', 'tn' + i, { h: 5 }) : sausage(p, x, y, 26, r, i, '#a8401e')]; }))}</g>` + V.shine(.5); },
    // 自家製ステーキ・アシェ、エシャロット: 牛ひき肉を丸く焼き、エシャロットとバターのソース、グリーンサラダ（お好みで）
    fr_steakhache: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -12, 4); return D.s + W.cutSlab(p, x, y, 34, 26, 10, '#6e3a1e', 1, { sear: '#3a1a0a', jit: .05 }) + W.flecks(p, x, y - 4, 22, 20, 'sh', ['#d8a8a8', '#a8784a'], { ry: 12, s: 2 }) + W.butterPat(p, x, y - 10, 10) + byDepth(W.spots('shs', 6, 20, 14, { cu: 40, cv: -10 }).map(([u, v, r], i) => { const [xx, yy] = P(o, u, v, 4); return [yy, () => Q.leaf(p, xx, yy, 22, r, i % 2 ? '#7ab848' : '#5a9a34', 'shl' + i, { wave: 3 })]; })); },
    // ポトフ: 牛肉・にんじん・ポロねぎ・かぶ・じゃがいも・クローブを刺した玉ねぎ（スープ皿）
    fr_potaufeu: p => soupe(p, '#e8c880', (pl, S) => [
        ...[[-20, -6], [18, -10]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.dice(p, x, y, 22, '#8a5a3a', 'pb' + i, { h: 12, top: Q.rg(p, [[0, '#c89a7a'], [.6, '#9a6a4a'], [1, '#6a3a22']], .4, .35, .8) })]; }),
        ...[[-42, 10, 'c'], [40, 10, 'c'], [-10, 20, 'l'], [24, 22, 't'], [0, -22, 'p'], [-34, -18, 'l']].map(([u, v, k], i) => { const [x, y] = pl(u, v, 1); return [y, () => k === 'c' ? Q.rangiri(p, x, y, 16, i * 40, '#e8742a', i) : k === 'l' ? W.pod(p, x, y, 28, 20, { c: '#b8d880', w: 7 }) : k === 't' ? Q.glossLump(p, x, y, 16, i, { c: '#f2ece0' }) : Q.glossLump(p, x, y, 17, i, { c: '#f0d690' })]; }),
    ], { oil: 8, oilC: '#f0c040' }),

    // ---------- 副菜 ----------
    // にんじんラペ: せん切りのにんじんをレモンとマスタードで（白い小鉢）
    fr_carottes: p => W.inBowl(p, smallBowl(p), { R: 64, H: 28, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#f08a3a', '#e8742a', '#f8a858'], 'cr', { n: 160, L: 14, w: 2 })], [999, () => parsley(p, o.cx, o.cy - H * CZ * .6, 40, 16, 'cr')]] }),
    // トマトのサラダ: 輪切りのトマトにエシャロットとヴィネグレット、シブレット
    fr_tomates: p => { const D = plate(p), o = D.o; const it = []; for (let i = 0; i < 10; i++){ const a = i / 10 * 6.283, [x, y] = P(o, Math.cos(a) * 38, Math.sin(a) * 38, 2); it.push([y, () => tomatoRound(p, x, y, 15)]); } return D.s + byDepth(it) + tomatoRound(p, 100, 98, 15) + W.flecks(p, 100, 96, 46, 20, 'tms', ['#e8c4d8', '#c87aa8'], { ry: 28, s: 1.3 }) + chives(p, 100, 96, 46, 24, 'tm'); },
    // グリーンサラダのヴィネグレット（白い小鉢）
    fr_salade: p => heapBowl(p, smallBowl(p), 'sl', 22, 13, 32, (x, y, r, i) => i % 2 ? W.standLeaf(p, x, y, 26, 18, r % 50 - 25, '#86c050', i) : Q.leaf(p, x, y, 26, r, '#6aa83a', 'sl' + i, { wave: 4 }), { base: '#4a8a2c', after: (o, H) => W.drizzle([[o.cx - 26, o.cy - H * CZ], [o.cx, o.cy - H * CZ - 4], [o.cx + 24, o.cy - H * CZ]], '#e8c060', 1.6) }),
    // いんげんのにんにくとパセリ炒め
    fr_haricots: p => plateHeap(p, plate(p), 'hc', 22, 50, 9, 12, (x, y, r) => W.pod(p, x, y, 34, r)) + parsley(p, 100, 92, 42, 30, 'hc'),
    // ラタトゥイユ: ズッキーニ・なす・赤パプリカ・トマト・玉ねぎの煮込み（白い小鉢）
    fr_ratatouille: p => heapBowl(p, smallBowl(p), 'ra', 30, 10, 24, (x, y, r, i) => { const k = i % 4; return k === 0 ? W.dice(p, x, y, 10, '#3f7a2a', 'rz' + i, { h: 6, top: Q.rg(p, [[0, '#f0f0c0'], [1, '#c8d890']], .4, .35, .8) }) : k === 1 ? W.dice(p, x, y, 10, '#5a2a4a', 're' + i, { h: 6, top: Q.rg(p, [[0, '#e8c890'], [1, '#b8884a']], .4, .35, .8) }) : k === 2 ? W.dice(p, x, y, 9, '#c8281a', 'rp' + i, { h: 3 }) : W.tomatoDice(p, x, y, 9, i); }, { base: '#b8401e' }),
    // ピュレ（マッシュポテト）、バター、ナツメグ（白い小鉢）
    fr_puree: p => W.inBowl(p, smallBowl(p), { R: 66, H: 30, items: (o, R, H) => [[0, () => W.cream(p, o.cx, o.cy + 4, R * .98, H, '#f6ecc8', 'pu', { ridges: 4 }) + W.butterPat(p, o.cx + 4, o.cy - H * CZ * .95, 9)]] }),
    // クスクスのタブレ: クスクス・トマト・きゅうり・レモン・ミント・パセリ（白い小鉢）
    fr_taboule: p => W.inBowl(p, smallBowl(p), { R: 64, H: 26, items: (o, R, H) => [[0, () => W.friedRice(p, o.cx, o.cy + 4, R, H, 'tb', { cols: ['#f2dca0', '#e8cc88', '#fbecc0'], edge: '#c8a860', n: 520 })], ...W.onHill(o, 'tbv', 18, R * .85, 11, H, (x, y, r, i) => i % 3 === 0 ? W.tomatoDice(p, x, y, 6, i) : i % 3 === 1 ? W.dice(p, x, y, 5, '#5a9a3a', 'tc' + i, { h: 2 }) : Q.leaf(p, x, y, 9, r, '#3f8a2a', 'tm' + i, { wave: .8 }), { lift: 2 }), [999, () => W.lemon(p, o.cx + 46, o.cy - 2, 16, { wedge: true, rot: -14 })]] }),
    // セロリアックのレムラード: 根セロリのせん切りをマヨネーズとマスタードで（白い小鉢）
    fr_celeri: p => W.inBowl(p, smallBowl(p), { R: 64, H: 28, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#f6f0dc', '#ece2c4', '#fbf8ec'], 'ce', { n: 160, L: 14, w: 2.2 })], [999, () => parsley(p, o.cx, o.cy - H * CZ * .6, 40, 16, 'ce')]] }),
    // きゅうりのクリーム和え、シブレット（ディル）（白い小鉢）
    fr_concombre: p => heapBowl(p, smallBowl(p), 'cc', 24, 12, 22, (x, y) => W.coin(p, x, y, 8, '#3f7a2a', { h: 1.6, top: Q.rg(p, [[0, '#f8faea'], [.6, '#e8f0d0'], [.85, '#c8dca0'], [1, '#3f7a2a']], .4, .35, .8) }), { base: '#f6f2e2', after: (o, H) => chives(p, o.cx, o.cy - H * CZ * .6, 40, 24, 'cc') }),
    // レンズ豆のサラダ: 緑レンズ豆・エシャロット・にんじん、ベーコン・ゆで卵（お好みで）（白い小鉢）
    fr_saladelentilles: p => heapBowl(p, smallBowl(p), 'sl', 80, 5, 22, (x, y, r, i) => i % 9 === 4 ? lardon(p, x, y, 6, i) : i % 7 === 2 ? W.dice(p, x, y, 4, '#e8742a', 'sc' + i, { h: 2 }) : `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.6" fill="${Q.rg(p, [[0, '#8a8a5a'], [1, '#4a4a2a']], .35, .3, .8)}"/>`, { base: '#5a5a32', after: (o, H) => W.eggHalf(p, o.cx + 18, o.cy - H * CZ - 2, 22, -10) + parsley(p, o.cx, o.cy - H * CZ * .6, 40, 16, 'sl') }),
    // ビーツのサラダ、エシャロット、シブレット（白い小鉢）
    fr_betteraves: p => heapBowl(p, smallBowl(p), 'bt', 26, 10, 24, (x, y, r, i) => W.dice(p, x, y, 11, '#7a1a34', 'bt' + i, { h: 7, top: Q.rg(p, [[0, '#d8506a'], [.6, '#a82a48'], [1, '#6a1428']], .4, .35, .8) }), { base: '#7a1a34', after: (o, H) => chives(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'bt') }),
    // ピエモンテーズ: じゃがいも・卵・ハム・トマト・コルニション・マヨネーズのサラダ（白い小鉢）
    fr_piemontaise: p => W.inBowl(p, smallBowl(p), { R: 66, H: 28, base: '#f2e2b0', items: (o, R, H) => [...W.onHill(o, 'pm', 26, R * .92, 11, H, (x, y, r, i) => { const k = i % 5; return k < 2 ? potatoDice(p, x, y, 12, i) : k === 2 ? W.hamDice(p, x, y, 8, i) : k === 3 ? W.tomatoDice(p, x, y, 8, i) : W.coin(p, x, y, 4.4, '#4a6a2a', { h: 2, top: Q.rg(p, [[0, '#c8d890'], [1, '#5a7a2a']], .4, .35, .8) }); }), ...W.onHill(o, 'pme', 3, R * .6, 24, H, (x, y, r) => W.eggHalf(p, x, y - 2, 14, r % 30), { lift: 3 }), [999, () => parsley(p, o.cx, o.cy - H * CZ * .6, 40, 16, 'pm')]] }),
    // ウフ・ミモザ: ゆで卵の黄身をマヨネーズで詰め、シブレット、パプリカ（お好みで）、レタス（お好みで）
    fr_oeufsmimosa: p => { const D = plate(p), o = D.o; return D.s + byDepth(W.spots('omz', 5, 40, 30).map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y - 30, () => Q.leaf(p, x, y, 34, r, '#7ab848', 'oml' + i, { wave: 3 })]; }).concat([[-34, -16], [0, -20], [34, -16], [-18, 14], [18, 14]].map(([u, v], i) => { const [x, y] = P(o, u, v, 4); return [y, () => W.eggHalf(p, x, y, 30, 0, { piped: true, paprika: i % 2 === 0 }) + chives(p, x, y - 6, 8, 5, 'om' + i)]; }))); },
    // ポロねぎのヴィネグレット、エシャロット、ゆで卵（お好みで）
    fr_poireauxvin: p => { const D = plate(p), o = D.o; return D.s + byDepth([-20, -6, 8, 22].map((v, i) => { const [x, y] = P(o, -4, v); return [y, () => `<g ${T(x, y, -6)}><g transform="scale(1 ${f(SY * 1.4)})"><rect x="-56" y="-6" width="112" height="12" rx="6" transform="translate(1.4 2.4)" fill="${SHADE}" opacity=".25"/><rect x="-56" y="-6" width="112" height="12" rx="6" fill="${Q.lg(p, [[0, '#f6f8e4'], [.5, '#d8e8b0'], [1, '#a8c870']], 1, 0, 0, 0)}" stroke="#7a9a4a" stroke-width=".6"/></g></g>`]; })) + W.drizzle([[60, 84], [90, 80], [120, 86], [144, 82]], '#e8c060', 2) + W.flecks(p, 100, 92, 46, 30, 'pvm', ['#f6eccc', '#e8c4d8', '#3f7a2a'], { ry: 20, s: 1.4 }); },
    // グラタン・ドフィノワ: じゃがいもの薄切りを牛乳・生クリーム・にんにくで焼く（耐熱皿）
    fr_dauphinois: p => baked(p, (o) => `<rect width="200" height="200" fill="#f2dca0"/>` + byDepth(W.spots('dp', 30, 76, 11, { ry: 46 }).map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.coin(p, x, y, 11, '#e8c878', { h: 1.6, top: Q.rg(p, [[0, '#fbecc0'], [.6, '#f2d488'], [.9, '#d8a048'], [1, '#b8782a']], .4, .35, .8) })]; })) + W.flecks(p, 100, 96, 80, 40, 'dpc', ['#c8782a', '#a8601e'], { ry: 46, s: 2 })),
    // カリフラワーのグラタン: ベシャメルとエメンタール（耐熱皿）
    fr_choufleurgratin: p => baked(p, (o) => `<rect width="200" height="200" fill="#f2dca0"/>` + byDepth(W.spots('cf', 14, 72, 18, { ry: 42 }).map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.broc(p, x, y, 24, i, '#f2e8c8', { roast: .5 })]; })) + W.flecks(p, 100, 96, 80, 80, 'cfc', ['#d8902a', '#c8782a', '#f8e0a0'], { ry: 46, s: 2 })),
    // プロヴァンスのティアン: ズッキーニ・なす・トマト・玉ねぎの輪切りを並べて焼く、タイム（耐熱皿）
    fr_tian: p => baked(p, (o) => { const it = []; for (let row = 0; row < 4; row++) for (let k = 0; k < 9; k++){ const [x, y] = P(o, -64 + k * 16, -36 + row * 24); it.push([y, () => [zucchiniRound, eggplantRound, tomatoRound][(k + row) % 3](p, x, y, 10)]); } return `<rect width="200" height="200" fill="#c8601e" opacity=".6"/>` + byDepth(it); }, (o) => [[-30, -10], [24, 10]].map(([u, v], i) => thyme(...P(o, u, v, 4), 22, i * 60)).join('')),
    // サルラ風ポテト: じゃがいもを鴨の脂で焼き、にんにくとパセリ、セップ（お好みで）
    fr_sarladaises: p => plateHeap(p, plate(p), 'sr', 24, 50, 11, 12, (x, y, r, i) => i % 6 === 5 ? W.mushSlice(p, x, y, 14, r) : W.coin(p, x, y, 9, '#c8862e', { h: 2, top: Q.rg(p, [[0, '#fbe0a0'], [.6, '#e8b058'], [.9, '#c8802a'], [1, '#9a5a1a']], .4, .35, .75) })) + parsley(p, 100, 90, 42, 30, 'sr') + W.flecks(p, 100, 90, 40, 12, 'srg', '#f6eccc', { ry: 20, s: 1.5 }),
    // ズッキーニのにんにく炒め、バジル（タイム）
    fr_courgettes: p => plateHeap(p, plate(p), 'cg', 24, 50, 11, 12, (x, y) => zucchiniRound(p, x, y, 8)) + W.flecks(p, 100, 90, 40, 14, 'cgg', '#f6eccc', { ry: 20, s: 1.5 }),
    // ほうれん草のクリーム煮（白い小鉢）
    fr_epinards: p => W.soup(p, smallBowl(p, { h: 44, cy: 80 }), { c: '#4a7a30', drop: 4, glow: .35, rimShade: .2, items: (pl, S) => [...W.spots('ep', 18, 60, 14).map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.leaf(p, x, y, 22, r, i % 2 ? '#3f7a2e' : '#4f8a34', 'ep' + i, { wave: 2, op: .9 })]; }), [999, () => `<g ${S.inside}>${[[-20, -6], [14, 2], [-4, 14]].map(([u, v], i) => { const [x, y] = pl(u, v); return `<path d="${Q.blob(x, y, 12, 5, 'epw' + i, { n: 10, jit: .4 })}" fill="#f6f0dc" opacity=".8"/>`; }).join('')}</g>`]] }),
    // プチポワ・ア・ラ・フランセーズ: グリーンピース・レタス・小玉ねぎ、にんじん・ベーコン（お好みで）（白い小鉢）
    fr_petitspois: p => heapBowl(p, smallBowl(p), 'pp', 70, 6, 24, (x, y, r, i) => i % 11 === 5 ? lardon(p, x, y, 6, i) : i % 9 === 3 ? Q.glossLump(p, x, y, 9, i, { c: '#f2ecd8' }) : i % 13 === 7 ? Q.leaf(p, x, y, 14, r, '#9ac860', 'pl' + i, { wave: 2 }) : Q.pea(p, x, y, 3.4), { base: '#6a9a3a' }),
    // ヴィシー風にんじんのグラッセ、パセリ（白い小鉢）
    fr_vichy: p => heapBowl(p, smallBowl(p), 'vc', 26, 11, 22, (x, y) => W.coin(p, x, y, 8, '#d8641e', { h: 3, top: Q.rg(p, [[0, '#ffc080'], [.5, '#f08a3a'], [1, '#c85a1a']], .4, .35, .8) }) + `<ellipse cx="${f(x - 2)}" cy="${f(y - 4)}" rx="2.4" ry="1" fill="#fff" opacity=".75"/>`, { base: '#e8782a', after: (o, H) => parsley(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'vc') }),
    // フラジョレ豆: エシャロット・にんにく・タイムで煮る、パセリ（白い小鉢）
    fr_flageolets: p => heapBowl(p, smallBowl(p), 'fl', 60, 6, 22, (x, y, r) => Q.bean(p, x, y, 8.4, r, '#c8d8a0'), { base: '#a8b878', after: (o, H) => parsley(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'fl') + thyme(o.cx + 16, o.cy - H * CZ, 20, -20) }),
    // マッシュルームのア・ラ・グレック: 小さなマッシュルームと玉ねぎをトマトとレモンで煮る（白い小鉢）
    fr_champignonsgrecque: p => heapBowl(p, smallBowl(p), 'cg', 22, 12, 22, (x, y, r, i) => i % 5 === 4 ? Q.glossLump(p, x, y, 10, i, { c: '#f2ecd8' }) : W.mushCap(p, x, y, 14, '#e0c8a0'), { base: '#c8783a', after: (o, H) => W.lemon(p, o.cx + 44, o.cy - 2, 16, { wedge: true, rot: -14 }) }),
    // 紫キャベツとりんごの蒸し煮（白い小鉢）
    fr_chourouge: p => W.inBowl(p, smallBowl(p), { R: 64, H: 28, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#7a2a5a', '#9a3a6a', '#5a1e44'], 'cr', { n: 140, L: 16, w: 2.6 })], ...W.onHill(o, 'cra', 8, R * .8, 16, H, (x, y, r, i) => W.dice(p, x, y, 8, '#f2e2b0', 'ap' + i, { h: 4, top: Q.rg(p, [[0, '#fbf2d0'], [1, '#e0c890']], .4, .35, .8) }), { lift: 2 })] }),
    // 自家製フリット: じゃがいもを2度揚げして塩
    fr_frites: p => { const D = plate(p), o = D.o; return D.s + byDepth(W.spots('fr', 34, 50, 7).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u, v, 50, 14)); return [y, () => Q.prism(p, x, y, [[-14, -2.6], [14, -2.6], [14, 2.6], [-14, 2.6]], 5, '#e8b048', { rot: r, top: Q.lg(p, [[0, '#fff0b0'], [.5, '#f6cc60'], [1, '#d8902a']], 0, 0, 0, 1), line: .4 })]; })) + W.flecks(p, 100, 90, 40, 30, 'frs', '#fbfaf2', { ry: 20, s: .8 }); },
    // ライスピラフ: 米を玉ねぎとバターで炒めてブイヨンで炊く、ローリエ（白い小鉢）
    fr_rizpilaf: p => W.inBowl(p, smallBowl(p), { R: 66, H: 28, items: (o, R, H) => [[0, () => Q.riceDome(p, o.cx, o.cy + 4, R, R * SY, H, { n: 520, tint: '#f2e2b8', grain: '#d8c090' }) + Q.leaf(p, o.cx + 10, o.cy - H * CZ + 2, 22, 30, '#5a7a3a', 'bay', { wave: .6 })]] }),

    // ---------- 汁物 ----------
    // ポロねぎとじゃがいものポタージュ、にんじん・生クリーム（お好みで）（スープ皿）
    fr_poireaux: p => soupe(p, '#e8e0b8', (pl, S) => [...W.spots('pr', 14, 56, 12).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => i % 3 ? leekRing(p, x, y, 5) : potatoDice(p, x, y, 8, i, '#e8e0b8')]; })], { cream: '#fbf6ea' }),
    // かぼちゃのポタージュ、生クリーム（スープカップ）
    fr_potiron: p => potage(p, '#f0a040', () => [], { cream: '#fbf2e4' }),
    // オニオングラタンスープ: あめ色の玉ねぎのスープに、バゲットとコンテ（エメンタール）をのせて焼く（取っ手つきの陶器）
    fr_oignon: p => { const V = W.bowl(p, { outer: '#7a4228', inner: '#e8d4b8', h: 52, cy: 80, rx: 86, fx: 40 }), cx = 100, cy = V.cy;
        const lug = side => `<path d="M${f(cx + side * 84)},${f(cy + 6)} q${side * 14},0 ${side * 14},8 q0,6 ${-side * 14},6Z" fill="${Q.lg(p, [[0, '#a8643a'], [1, '#6a3418']])}" stroke="#5a2c14" stroke-width=".6"/>`;
        const top = `M${f(cx - 80)},${f(cy + 2)} C${f(cx - 84)},${f(cy - 24)} ${f(cx - 30)},${f(cy - 34)} ${f(cx)},${f(cy - 30)} C${f(cx + 36)},${f(cy - 36)} ${f(cx + 86)},${f(cy - 20)} ${f(cx + 80)},${f(cy + 4)} Q${f(cx + 40)},${f(cy + 20)} ${f(cx)},${f(cy + 14)} Q${f(cx - 40)},${f(cy + 22)} ${f(cx - 80)},${f(cy + 2)}Z`;
        return lug(-1) + lug(1) + V.s + `<g ${V.above}><path d="${top}" fill="${Q.rg(p, [[0, '#fbe6a0'], [.45, '#f2c060'], [.8, '#d8902e'], [1, '#a8601e']], .4, .3, .8)}" stroke="#9a5a1e" stroke-width=".7"/>${W.flecks(p, cx, cy - 12, 60, 50, 'fo', ['#a8601e', '#c8782a', '#7a3e12'], { ry: 16, s: 2 })}</g>` + V.shine(.4); },
    // スープ・オ・ピストゥ: 白いんげん・ズッキーニ・いんげん・じゃがいも・トマト・小さなパスタ、バジルのピストゥ（スープ皿）
    fr_pistou: p => soupe(p, '#d8b860', (pl, S) => [...W.spots('pi', 24, 58, 9).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 5; return [y, () => k === 0 ? Q.bean(p, x, y, 8, r, '#efe6d0') : k === 1 ? zucchiniRound(p, x, y, 5) : k === 2 ? W.pod(p, x, y, 12, r, { w: 3 }) : k === 3 ? potatoDice(p, x, y, 7, i) : W.tomatoDice(p, x, y, 7, i)]; }), [999, () => `<path d="${Q.blob(S.cx + 4, S.cy, 14, 6, 'pst')}" fill="${Q.rg(p, [[0, '#8ac050'], [1, '#3f7a2a']], .4, .35, .8)}"/>`]]),
    // ガルビュール: 白いんげん・キャベツ・生ハムのかかと（燻製豚バラ）・じゃがいも・にんじんのスープ（スープ皿）
    fr_garbure: p => soupe(p, '#d8c088', (pl, S) => [...W.spots('gb', 22, 58, 9).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 5; return [y, () => k === 0 ? Q.leaf(p, x, y, 18, r, '#a8c870', 'gb' + i, { wave: 3 }) : k === 1 ? Q.bean(p, x, y, 8, r, '#efe6d0') : k === 2 ? potatoDice(p, x, y, 8, i) : k === 3 ? carrotCoin(p, x, y, 5) : W.hamDice(p, x, y, 8, i)]; })]),
    // クレソンのポタージュ、生クリーム（お好みで）（スープカップ）
    fr_cresson: p => potage(p, '#7aa840', (pl, S) => [[999, () => Q.leaf(p, S.cx - 6, S.cy - 4, 12, 30, '#3f8a2a', 'cs', { wave: 1 })]], { cream: '#f6f2e2' }),
    // ポタージュ・クレシー（にんじん）、チャービル（パセリ）（スープカップ）
    fr_crecy: p => potage(p, '#f08a3a', (pl, S) => [[999, () => parsley(p, S.cx, S.cy, 20, 10, 'cr')]]),
    // 緑の割り豆のポタージュ、ベーコン・クルトン（お好みで）（スープ皿）
    fr_poiscasses: p => soupe(p, '#a8b04a', (pl, S) => [...W.spots('pc', 7, 50, 15).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => i % 2 ? lardon(p, x, y, 7, i) : croutonB(p, x, y, 8, i)]; })]),
    // マッシュルームのポタージュ（スープカップ）
    fr_champignons: p => potage(p, '#c8a478', (pl, S) => [...[[-12, -4, -20], [10, -8, 10]].map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => W.mushSlice(p, x, y, 12, r)]; })], { cream: '#f4ead4' }),
    // トマトのポタージュ、バジル・生クリーム（お好みで）（スープカップ）
    fr_tomate: p => potage(p, '#d8442a', (pl, S) => [[999, () => Q.leaf(p, S.cx - 12, S.cy - 4, 14, 30, '#3f8a2c', 'tb', { wave: 1 })]], { cream: '#fbf2e4' }),
    // ズッキーニとやわらかいチーズのポタージュ（スープカップ）
    fr_courgette: p => potage(p, '#b8c870', (pl, S) => [[999, () => `<path d="${Q.blob(S.cx + 2, S.cy, 10, 4, 'cgc')}" fill="#fbfaf2"/>` + W.flecks(p, S.cx, S.cy, 20, 8, 'cgp', '#3a2414', { ry: 6, s: .8 })]]),
    // キャベツとベーコンのスープ: キャベツ・ベーコン（塩豚）・じゃがいも・にんじん・玉ねぎ、燻製ソーセージ（お好みで）（スープ皿）
    fr_chou: p => soupe(p, '#e0d098', (pl, S) => [...W.spots('ch', 20, 58, 10).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 5; return [y, () => k === 0 ? Q.leaf(p, x, y, 18, r, '#c8dc90', 'ch' + i, { wave: 3 }) : k === 1 ? lardon(p, x, y, 7, i) : k === 2 ? potatoDice(p, x, y, 8, i) : k === 3 ? carrotCoin(p, x, y, 5) : W.sausageCoin(p, x, y, 6)]; })]),
    // 野菜のスープ: ポロねぎ・にんじん・じゃがいも・かぶ、セロリ・ズッキーニ（お好みで）（スープ皿）
    fr_legumes: p => soupe(p, '#e8cc80', (pl, S) => [...W.spots('lg', 22, 58, 9).map(([u, v], i) => { const [x, y] = pl(u, v); const k = i % 5; return [y, () => k === 0 ? leekRing(p, x, y, 4.6) : k === 1 ? carrotCoin(p, x, y, 4.6) : k === 2 ? potatoDice(p, x, y, 7, i) : k === 3 ? W.dice(p, x, y, 7, '#f2ecd8', 'tn' + i, { h: 3 }) : zucchiniRound(p, x, y, 4.6)]; })]),
    // 赤レンズ豆とにんじんのポタージュ、生クリーム（ココナッツミルク）（お好みで）（スープカップ）
    fr_lentcorail: p => potage(p, '#e88a3a', () => [], { cream: '#fbf2e4' }),
    // プロヴァンスの魚のスープ、ルイユ: 白身魚・トマト・玉ねぎ・ポロねぎ・フェンネル・じゃがいも、ルイユをのせたクルトン（スープ皿）
    fr_poisson: p => soupe(p, '#d8642a', (pl, S) => [...[[-20, -6], [16, 10]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.prism(p, x, y, [[-12, -7], [12, -6], [11, 7], [-11, 6]], 6, '#f2ece0', { rot: i * 20, sink: 2, liquid: '#d8642a', top: Q.lit(p, '#fbf8f0', .2, .08), line: .5 })]; }), ...W.spots('psv', 8, 56, 13).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => i % 2 ? potatoDice(p, x, y, 7, i) : leekRing(p, x, y, 4.4)]; }), ...[[30, -16], [-34, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 3); return [y + 2, () => W.bread(p, x, y, 22, i * 20, { toast: .5, th: 4 }) + `<path d="${Q.blob(x, y - 5, 6, 3, 'rl' + i)}" fill="#e8903a"/>`]; })]),
    // 鶏のブイヨン、極細のヴェルミセル: 骨つきの鶏もも・にんじん・ポロねぎ・玉ねぎ（スープ皿）
    fr_vermicelle: p => soupe(p, '#ecc870', (pl, S) => [[S.cy - 1, () => W.noodleMound(p, S.cx, S.cy + 2, S.rx * .8, 0, '#f6e4a8', 'vm', { w: 1, n: 90, len: 20, sy: SYF, flat: true, edge: '#d8c080' })], ...W.spots('vmv', 10, 56, 13).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => i % 3 === 0 ? Q.lump(p, x, y, 6, 4, '#efe2c8', 'vc' + i, { hi: .5 }) : i % 3 === 1 ? carrotCoin(p, x, y, 4.4) : leekRing(p, x, y, 4.4)]; })], { oil: 8, oilC: '#f0c040' }),
    // 栗のポタージュ、燻製ベーコン（お好みで）（スープカップ）
    fr_chataigne: p => potage(p, '#b8885a', (pl, S) => [...[[-10, -4], [8, -6], [2, 4]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => lardon(p, x, y, 5, i)]; })], { cream: '#f6ecd8' }),
    // カリフラワーのポタージュ、コンテ（お好みで）（スープカップ）
    fr_choufleur: p => potage(p, '#f2ead0', (pl, S) => [[999, () => cheese(p, S.cx, S.cy, 20, 16, 'cf') + W.flecks(p, S.cx, S.cy, 20, 8, 'cfp', '#5a4a3a', { ry: 6, s: .7 })]]),
    // トゥーラン（にんにくのスープ）: にんにく・卵・田舎パン（スープ皿）
    fr_tourin: p => soupe(p, '#f0e0a8', (pl, S) => [...[[-16, -4], [18, 6]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.bread(p, x, y, 30, i * 20, { toast: .5, th: 5 })]; }), ...[[-22, 14], [26, -12]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => Q.eggRibbon(p, x, y, 22, i)]; }), ...W.spots('tg', 5, 50, 14).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.coin(p, x, y, 3, '#f2e8c8', { h: 1 })]; })]),
    // アスパラのポタージュ（スープカップ）
    fr_asperges: p => potage(p, '#c8d090', (pl, S) => [[999, () => W.asparagus(p, S.cx - 4, S.cy - 2, 20, -10)]], { cream: '#fbf6ea' }),
    // ブロッコリーのポタージュ、チーズ（お好みで）（スープカップ）
    fr_brocolis: p => potage(p, '#7aa040', (pl, S) => [[999, () => W.broc(p, S.cx - 6, S.cy - 2, 12, 1) + cheese(p, S.cx + 8, S.cy, 10, 8, 'bc')]]),
    // パースニップのポタージュ、りんご（お好みで）（スープカップ）
    fr_panais: p => potage(p, '#ecdcb0', (pl, S) => [[999, () => W.flecks(p, S.cx, S.cy, 20, 8, 'pnn', '#a8763a', { ry: 6, s: .8 })]], { cream: '#fbf6ea' }),

    // ---------- 麺・ご飯もの ----------
    // コキエット・ジャンボン・フロマージュ: 小さなマカロニにハムとエメンタール、生クリーム（お好みで）（スープ皿）
    fr_coquillettes: p => { const V = creuse(p), o = { cx: 100, cy: V.cy + 2, sy: SYF }, H = 20;
        return V.s + W.mound(p, o.cx, o.cy, 50, H, '#f0d080', 'cq', SYF) + byDepth(W.spots('cqm', 60, 50, 6).map(([u, v, r], i) => { const [x, y] = P(o, u, v, W.hill(u, v, 50, H) + 2); return [y, () => i % 8 === 3 ? W.hamDice(p, x, y, 7, i) : `<g ${T(x, y, r)}><path d="M-5,2 Q-5,-4 2,-4" stroke="#c8902a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-5,2 Q-5,-4 2,-4" stroke="#f6d070" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>`]; })) + cheese(p, o.cx, o.cy - H * CZ * .6, 34, 40, 'cq'); },
    // サーモンとクリームのタリアテッレ、エシャロット・レモン（スープ皿）
    fr_tagliatelles: p => { const V = creuse(p), o = { cx: 100, cy: V.cy + 2 }, H = 20;
        return V.s + W.noodleMound(p, o.cx, o.cy, 52, H, '#f4e2b0', 'tg', { w: 4, n: 110, len: 36, sy: SYF, edge: '#d8bc80' }) + `<path d="${Q.blob(o.cx, o.cy - 14, 40, 18, 'tgs', { n: 12, jit: .3 })}" fill="#fbf4e0" opacity=".55"/>` + byDepth(W.spots('tgs', 8, 34, 13).map(([u, v, r], i) => { const [x, y] = P({ ...o, sy: SYF }, u, v, W.hill(u, v, 52, H) + 3); return [y, () => W.dice(p, x, y, 9, '#f08a5a', 'sl' + i, { h: 5, top: Q.rg(p, [[0, '#ffc8a8'], [1, '#e8784a']], .4, .35, .8) })]; })) + pepper(p, o.cx, o.cy - 14, 34, 30, 'tg') + W.lemon(p, 150, 128, 16, { wedge: true, rot: -14 }); },
    // プーレ・オ・リ（鶏とご飯のシュプレームソース）: 鶏もも・にんじん・ポロねぎ・玉ねぎを煮て、ご飯にクリームのソース（スープ皿）
    fr_pouleriz: p => { const V = creuse(p), o = { cx: 100, cy: V.cy + 2, sy: SYF };
        return V.s + Q.riceDome(p, o.cx - 18, o.cy + 2, 32, 32 * SYF * .7, 22, { n: 260 }) + W.pool(p, 120, o.cy + 6, 30, '#f4ead0', 'pr') + byDepth([[18, -4], [32, 10]].map(([u, v], i) => { const [x, y] = P(o, u, v, 2); return [y, () => Q.soakLump(p, x, y, 26, i, { c: '#f2e2c4', soak: '#e8d4a8', k: .3, sy: .72 })]; }).concat([[0, 24], [40, -16]].map(([u, v], i) => { const [x, y] = P(o, u, v, 2); return [y, () => carrotCoin(p, x, y, 5.4)]; }))) + parsley(p, 110, o.cy - 6, 40, 16, 'pr'); },
};
