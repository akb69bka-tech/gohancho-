// 台湾（tw_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 炒め物・焼き物・揚げ物は錆の縁の白い平皿（主食の器の台湾＝錆にそろえる）、煮込み・あんの料理は深皿、
// 汁物とスープ麺は錆の線の大きな碗、ルーローハン・鶏肉飯は飯碗、かゆは白い碗、蒸し魚は楕円皿、冷菜は白い小鉢。青は使わない。
// 材料は gohancho/packs/tw.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, T, rng, smooth, lt, dk, mix, SY, CZ, SYF, SHADE, at, byDepth } = W;

// =========================================================
// 台湾の器と部品
// =========================================================
const SABI = Q.RIM.sabi, SOY = '#7a3a16', BRAISE = '#7a3414', BSES = '#5a3a1e', SESOIL = '#e8b040';
const P = (o, u, v, z = 0) => at(o, u, v, z);
const plate = (p, o = {}) => Q.plate(p, { line: 'none', edge: SABI, ...o });
const oval = (p, o = {}) => Q.ovalPlate(p, { rim: SABI, rz: 70, h: 14, ...o });
const deep = (p, o = {}) => Q.fukazara(p, { line: SABI, ...o });
const bowl = (p, o = {}) => Q.shiroBowl(p, { rim: SABI, ...o });
const riceBowl = (p, o = {}) => Q.chawan(p, { rim: SABI, ...o });
const smallBowl = (p, o = {}) => W.sideBowl(p, { outer: '#f4f1ea', inner: '#fbf9f4', edge: SABI, ...o });
const shred = (p, x, y, L, rot, c, w = 2.4) => Q.prism(p, x, y, [[-L / 2, -w / 2], [L / 2, -w / 2], [L / 2, w / 2], [-L / 2, w / 2]], w * .8, c, { rot, line: .35, top: Q.lg(p, [[0, lt(c, .35)], [1, dk(c, .1)]], 0, 0, 0, 1) });
const meat = (p, x, y, s, r, i, c = '#b0703e', fat = '#eac8a0') => Q.slice3q(p, x, y, s, r, { c, fat, seed: i, gloss: .7, char: false }, { sq: .5 });
const negis = (pl, seed, n, R, c = '#4a9a2c') => W.spots(seed, n, R, 8).map(([u, v]) => { const [x, y] = pl(u, v); return [y + .1, () => Q.negi(null, x, y, 5, c)]; });
const chicken = (p, x, y, s, i, c = '#e8c890', soak = '#a8783a') => Q.soakLump(p, x, y, s, i, { c, soak, k: .5, sy: .72 });
const eggplant = (p, x, y, L, r, i, c = '#c8945a') => `<g ${T(x, y, r)}><g transform="scale(1 ${f(SY * 1.4)})"><rect x="${f(-L / 2)}" y="-4" width="${f(L)}" height="8" rx="4" transform="translate(1.4 2.4)" fill="${SHADE}" opacity=".25"/><rect x="${f(-L / 2)}" y="-4" width="${f(L)}" height="8" rx="4" fill="${Q.lg(p, [[0, '#8a3a7a'], [.35, '#6a2a5a'], [.4, c], [1, dk(c, .3)]], 0, 0, 0, 1)}" stroke="#3a1a2a" stroke-width=".5"/></g></g>`;
const basil = (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#2f6a22', 'bs' + i, { wave: 1.4 });
const greens = (p, x, y, s, r, i, c = '#3f7a2a') => Q.leaf(p, x, y, s, r, c, 'gr' + i, { wave: 3 });
const garlicClove = (p, x, y, s, i) => Q.lump(p, x, y, s / 2, s * .34, '#f4e8cc', 'gc' + i + x, { n: 8, jit: .14, hi: .6, edge: '#c8a870' });
const ginger = (x, y, r) => `<g ${T(x, y, r)}><path d="M-7,0 L7,0" stroke="#e8c870" stroke-width="1.6" stroke-linecap="round"/></g>`;
const shallots = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'sh' + seed, ['#a8641e', '#c8822a', '#8a4a14'], { ry: rx * .4, s: 1.6 });
const driedShrimp = (p, x, y, i) => W.shrimp(p, x, y, 7, i * 50);
const clam = (p, x, y, s, r) => Q.clam(p, x, y, s, r);
const oyster = (p, x, y, s, i) => `<path d="${Q.blob(x, y, s / 2, s * .32, 'oy' + i + x, { n: 10, jit: .3 })}" fill="${Q.rg(p, [[0, '#f8f2e6'], [.6, '#d8ccb8'], [1, '#8a7a68']], .4, .35, .8)}" stroke="#7a6a58" stroke-width=".6"/>`;
const ball = (p, x, y, s, c, i) => W.ball(p, x, y, s, c, 'b' + i, { hi: .6 });
const daikon = (p, x, y, s, i, liq = null, c = '#f2ecd8') => W.dice(p, x, y, s, c, 'dk' + i, { h: s * .4, sink: liq ? 2 : 0, liq, top: Q.lg(p, [[0, lt(c, .4)], [1, dk(c, .05)]], 0, 0, 1, 1) });
const celery = (p, x, y, r) => Q.prism(p, x, y, [[-3.4, -1.8], [3.4, -1.8], [3, 2], [-3, 2]], 2, '#8ac050', { rot: r, line: .4 });
const pidan = (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, s * .2], [0, -s * .38], [s / 2, s * .2], [0, s * .3]], s * .45, '#5a3a1a', { rot: r, top: Q.rg(p, [[0, '#6a7048'], [.35, '#4a5230'], [.45, '#7a4a1c'], [1, '#4a2a10']], .5, .45, .7), line: .5 });
const saltedYolk = (p, x, y, s) => `<path d="${Q.blob(x, y, s, s * .5, 'sy' + x, { n: 10, jit: .3 })}" fill="#f0a830" opacity=".85"/>` + W.flecks(p, x, y, s, 12, 'sy' + x, ['#e8902a', '#f8c850'], { ry: s * .4, s: 1.2 });
const bambooSlice = (p, x, y, s, r, liq = null) => Q.prism(p, x, y, [[-s / 2, -s * .25], [s / 2, -s * .35], [s / 2, s * .3], [-s / 2, s * .3]], 3, '#e8d8a0', { rot: r, sink: liq ? 1 : 0, liquid: liq, top: Q.lg(p, [[0, '#fbf2d0'], [1, '#e0cc90']], 0, 0, 1, 1), line: .45 });
const plateHeap = (p, D, seed, n, R, minD, H, draw, { sauce = null, sauceR = 32 } = {}) => { R *= .92; H += 5; return D.s + (sauce ? W.pool(p, D.o.cx + 4, D.o.cy + 8, sauceR, sauce, seed) : '') + byDepth(W.spots(seed, Math.round(n * 1.4), R, minD * .85).map(([u, v, r], i) => { const [x, y] = P(D.o, u, v, 4 + W.hill(u, v, R, H)); return [y, () => draw(x, y, r, i)]; })); };
const heapBowl = (p, seed, n, minD, H, draw, { base = null, R = 64, after = () => '' } = {}) => W.inBowl(p, smallBowl(p), { R, H, base, items: (o, RR, HH) => [...W.onHill(o, seed, n, RR * .95, minD, HH, draw), [999, () => after(o, HH)]] });
const braise = (p, V, c, seed, n, minD, H, draw, { srx = 50, R = 50 } = {}) => W.heap(p, V, { c, drop: 4, H, R, srx, items: (pl) => [...W.spots(seed, n, R - 4, minD), ...W.spots(seed + '2', Math.round(n / 3), R * .5, minD).map(([u, v, r]) => [u, v, r, H * .35])].map(([u, v, r, z = 0], i) => { const [x, y] = pl(u, v, z); return [y, () => draw(x, y, r, i)]; }) });
const soup = (p, c, items, o = {}) => W.soup(p, o.V ? o.V(p) : bowl(p), { c, drop: 10, glow: .35, gl: .55, items, ...o });
function congee(p, seed, items = () => [], { c = '#f4ecd8' } = {}){
    const V = bowl(p, { rim: Q.RIM.hai }), S = Q.surface(p, V, { drop: 9, c, glow: .4 }), pl = (u, v, z = 0) => at(S.o, u, v, z);
    return V.s + S.s + W.porridge(p, S, seed, { c }) + `<g ${V.inside}>${byDepth(items(pl, S))}</g>` + Q.depthVeil(p, V, V.cy - V.iry, V.cy + V.iry) + V.shine(.5);
}
// 飯碗のご飯にのせる（ルーローハン・鶏肉飯）
function riceTop(p, seed, top){ const V = riceBowl(p), cx = V.cx, cy = V.cy + 2; return V.s + `<g ${V.above}>${Q.riceDome(p, cx, cy, V.irx - 2, (V.irx - 2) * SY, 40)}${top(cx, cy - 40 * CZ + 16)}</g>` + V.shine(.5); }
// 卵焼き（オムレツ・菜脯蛋）: 平たい円盤に焼き色
const omelet = (p, x, y, r, seed, c = '#f2c440') => W.jeon(p, x, y, r, seed, { c, h: 6 }) + `<path d="${Q.blob(x - 6, y - 4, r * .4, r * .2, 'om' + seed)}" fill="#d8902a" opacity=".45"/>` + Q.shine(x - r * .3, y - r * .4, r * .5, -8, .8);
// 揚げ物の衣（薄く粗い片栗粉の衣）
const fried = (p, x, y, rx, ry, i, c = '#d89a48') => W.crusty(p, x, y, rx, ry, i, { c, n: 30, h: 6 });
// 葉物の炒め（山盛り）
const leafyPlate = (p, seed, c, extra = () => '', n = 22) => plateHeap(p, plate(p), seed, n, 50, 12, 14, (x, y, r, i) => i % 3 === 0 ? W.pod(p, x, y, 22, r, { c: lt(c, .25), w: 3 }) : greens(p, x, y, 26, r, i, i % 2 ? c : lt(c, .12))) + extra();

// =========================================================
// 品
// =========================================================
export default {
    // ---------- 主菜 ----------
    // 三杯鶏: 骨つきの鶏を黒ごま油・醤油・米酒で照りよく煮る、バジル（九層塔）、唐辛子（お好みで）（土鍋）
    tw_sanbeiji: p => { const V = Q.donabe(p, { h: 46, cy: 88 }); return braise(p, V, '#5a2a12', 'sb', 14, 15, 34, (x, y, r, i) => i % 4 === 3 ? basil(p, x, y, 16, r, i) + (i % 8 === 7 ? W.chiliRing(x + 6, y - 2, 3, '#c8281a') : '') : chicken(p, x, y, 22, i, '#9a4a1e', '#5a2a12') + Q.shine(x - 4, y - 6, 8, -8, .8), { srx: 60, R: 56 }) + garlicClove(p, 80, 66, 9, 1) + garlicClove(p, 124, 62, 9, 2); },
    // 菜脯蛋: 刻んだ切り干し大根の漬物と卵を厚く焼く、青ねぎ
    tw_caipu_dan: p => { const D = plate(p); return D.s + omelet(p, 100, 100, 60, 1, '#f0bc3a') + W.flecks(p, 100, 92, 46, 40, 'cp', ['#b8823a', '#d8a050', '#4a9a2c'], { ry: 26, s: 1.6 }); },
    // 虱目魚肚の焼き: サバヒーの腹身を皮から焼く、レモン（お好みで）
    tw_jian_shimuyu: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -6, 0);
        return D.s + W.cutSlab(p, x, y, 54, 30, 7, '#f2e6d0', 1, { rot: -6, sear: '#c8823a', edgeC: '#c8c0b0' }) + Array.from({ length: 6 }, (_, i) => `<path d="M${f(x - 36 + i * 14)},${f(y - 16)} q4,14 0,30" stroke="#e8c890" stroke-width="1.2" fill="none" opacity=".7"/>`).join('') + W.lemon(p, ...P(o, 48, 32), 22, { wedge: true, rot: -20 }); },
    // 瓜仔肉: 豚ひき肉と瓜の漬物を蒸す（深皿）
    tw_gualirou: p => { const V = deep(p), S = Q.surface(p, V, { drop: 4, c: '#a8743a', glow: .3, rx: 54 });
        const d = Q.blob(100, S.cy - 4, 44, 26, 'gl', { n: 14, jit: .08 });
        return V.s + S.s + Q.dropOf(p, d, 2, 6, .3) + `<path d="${d}" transform="translate(0 7)" fill="#7a4a2a"/><path d="${d}" fill="${Q.rg(p, [[0, '#c8946a'], [.6, '#a06a42'], [1, '#7a4a2a']], .4, .35, .8)}" stroke="#5a3418" stroke-width=".7"/>` + W.flecks(p, 100, S.cy - 6, 36, 40, 'glm', ['#7a4a2a', '#c8a070'], { ry: 18, s: 1.4 }) + byDepth([[-20, -10], [0, -14], [20, -8], [-8, 4], [14, 6]].map(([u, v], i) => [S.cy + v, () => W.coin(p, 100 + u, S.cy - 8 + v * .6, 5, '#8a8a3a', { h: 2, top: Q.rg(p, [[0, '#d8d890'], [1, '#8a8a3a']], .4, .35, .8) })])) + Q.shine(80, S.cy - 18, 18, -8, .7) + V.shine(.5); },
    // 葱爆牛肉: 牛の薄切りと青ねぎを強火で炒める、唐辛子（お好みで）
    tw_congbao_niurou: p => plateHeap(p, plate(p), 'cb', 28, 48, 10, 14, (x, y, r, i) => i % 6 === 5 ? W.chiliRing(x, y, 3, '#c8281a') : i % 2 ? meat(p, x, y, 20, r, i, '#7a4022', '#a8704a') : W.pod(p, x, y, 22, r, { c: '#4a9a2c', w: 3 }), { sauce: '#5a2a12' }),
    // 炸排骨: 骨なしの豚ロースに下味をつけ、さつまいも粉の衣で揚げる
    tw_zha_paigu: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-14, -10, -10, 1], [14, 16, 10, 2]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => fried(p, x, y, 44, 26, i, '#c8823a')]; })); },
    // 鹽酥雞: 鶏ももをひと口に切ってさつまいも粉で揚げ、胡椒塩、揚げたバジル（お好みで）
    tw_yansuji: p => plateHeap(p, plate(p), 'ys', 14, 46, 16, 16, (x, y, r, i) => i % 5 === 4 ? basil(p, x, y, 16, r, i) : fried(p, x, y, 11, 8, i, '#d8a048')) + W.flecks(p, 100, 90, 40, 30, 'ysp', ['#5a3a20', '#f6eccc'], { ry: 20, s: .9 }),
    // 豆豉蚵: 小粒のかきを豆豉と炒める、豆腐（お好みで）・青ねぎ・唐辛子
    tw_douchi_ke: p => plateHeap(p, plate(p), 'dk', 22, 48, 12, 12, (x, y, r, i) => { const k = i % 5; return k < 2 ? oyster(p, x, y, 16, i) : k === 2 ? W.dice(p, x, y, 9, '#f2ead6', 'df' + i, { h: 5 }) : k === 3 ? W.pod(p, x, y, 16, r, { c: '#4a9a2c', w: 2.6 }) : W.chiliRing(x, y, 3, '#c8281a'); }, { sauce: '#6a3418' }) + W.flecks(p, 100, 90, 40, 20, 'dkb', '#3a2014', { ry: 20, s: 1.4 }),
    // 破布子蒸魚: 丸ごとの白身魚を破布子（コルディアの実）と生姜・青ねぎで蒸す（楕円の皿）
    tw_pobuzi_zhengyu: p => { const D = oval(p, { rz: 66 }); return D.s + W.pool(p, 104, D.cy + 10, 44, '#a8742a', 'pb') + W.wholeFish(p, 100, D.cy - 2, 160, -4, 1, { skin: '#c8c4b4', belly: '#f2ece0', char: 0, H: 26 }) + byDepth(W.spots('pbs', 14, 50, 9, { ry: 10 }).map(([u, v, r], i) => { const [x, y] = [100 + u, D.cy - 12 + v * .6]; return [y, () => i % 3 === 0 ? Q.lump(p, x, y, 3.6, 3, '#c89a4a', 'pb' + i, { hi: .7 }) : i % 3 === 1 ? ginger(x, y, r % 40 - 20) : `<g ${T(x, y, r % 40 - 20)}><path d="M-7,0 L7,0" stroke="#5aa83a" stroke-width="1.4" stroke-linecap="round"/></g>`]; })); },
    // 煎白帯魚: タチウオを粉をはたいて焼く、レモン（お好みで）
    tw_jian_daiyu: p => { const D = oval(p); return D.s + byDepth([[-48, -6], [-16, -12], [16, -6], [48, 0], [-30, 18], [2, 16], [34, 22]].map(([u, v], i) => { const [x, y] = [100 + u, D.cy + v]; return [y, () => Q.prism(p, x, y, [[-15, -10], [15, -10], [15, 10], [-15, 10]], 8, '#d8d4c8', { rot: -6, top: Q.lg(p, [[0, '#f2dcb0'], [.5, '#d8a868'], [1, '#a8742a']], 0, 0, 1, 1), line: .5 }) + Q.shine(x - 4, y - 8, 10, -8, .7)]; })) + W.lemon(p, 150, D.cy + 26, 20, { wedge: true, rot: -20 }); },
    // 香腸: 台湾の甘いソーセージを焼いて斜めに切り、生にんにく、きゅうり（お好みで）
    tw_jian_xiangchang: p => { const D = plate(p), o = D.o; return D.s + byDepth([-40, -24, -8, 8, 24, 40].map((u, i) => { const [x, y] = P(o, u, -u * .3 - 6); return [y, () => W.coin(p, x, y, 13, '#a82a1a', { h: 7, sy: SYF * .7, top: Q.rg(p, [[0, '#f0a090'], [.6, '#d8604a'], [1, '#a8301e']], .4, .35, .8) }) + `<circle cx="${f(x - 3)}" cy="${f(y - 7)}" r="1.2" fill="#fbe8e0"/><circle cx="${f(x + 3)}" cy="${f(y - 5)}" r="1" fill="#fbe8e0"/>`]; })) + [[-30, 30], [-14, 36], [6, 34]].map(([u, v], i) => garlicClove(p, ...P(o, u, v), 10, i)).join('') + [[30, 32], [44, 26]].map(([u, v]) => W.coin(p, ...P(o, u, v), 7, '#3f7a2a', { h: 1.6, top: Q.rg(p, [[0, '#eef6d0'], [1, '#6a9a3a']], .4, .35, .8) })).join(''); },
    // 蛤蜊蒸蛋: あさりを入れた茶わん蒸し、青ねぎ（深皿）
    tw_gela_zhengdan: p => { const V = deep(p, { line: Q.RIM.hai }), S = Q.surface(p, V, { drop: 4, c: '#f6d878', glow: .5, rimShade: .15 }), pl = (u, v, z = 0) => at(S.o, u, v, z);
        return V.s + S.s + `<g ${S.inside}>${byDepth(W.spots('gz', 8, 50, 18).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y, () => clam(p, x, y, 16, r)]; }))}${W.flecks(p, S.cx, S.cy, 50, 16, 'gzn', ['#4a9a2c', '#7ac050'], { ry: 20, s: 1.5 })}</g>` + W.glint(p, S, .6) + V.shine(.5); },
    // 金沙豆腐: 豆腐を揚げて、塩卵の黄身をからめる、青ねぎ
    tw_jinsha_doufu: p => plateHeap(p, plate(p), 'js', 12, 46, 18, 12, (x, y, r, i) => W.dice(p, x, y, 16, '#e8b858', 'js' + i, { h: 11, top: Q.rg(p, [[0, '#fbe8a8'], [.6, '#f0c060'], [1, '#c8902a']], .4, .35, .8) }) + W.flecks(p, x, y - 10, 7, 8, 'jsf' + i, ['#e8902a', '#f8c850'], { ry: 4, s: 1.2 })) + W.flecks(p, 100, 88, 36, 12, 'jsn', ['#4a9a2c'], { ry: 16, s: 1.6 }),
    // 沙茶羊肉: 羊の薄切りを沙茶醤で、玉ねぎ・青ねぎ・唐辛子（お好みで）
    tw_shacha_yangrou: p => plateHeap(p, plate(p), 'sc', 28, 48, 10, 14, (x, y, r, i) => { const k = i % 4; return k < 2 ? meat(p, x, y, 20, r, i, '#8a4a2e', '#c8946a') : k === 2 ? W.onionStrip(x, y, 14, r) : W.pod(p, x, y, 18, r, { c: '#4a9a2c', w: 3 }); }, { sauce: '#7a3418' }),
    // 黒胡椒蝦: 殻つきのえびをにんにくとバターで炒め、粗びきの黒こしょう、青ねぎ（お好みで）
    tw_hujiao_xia: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-30, -18, 10, 1], [10, -24, -10, -1], [36, -6, 20, 1], [-20, 8, -20, -1], [16, 14, 10, 1], [-38, 30, 0, 1], [30, 32, -10, -1]].map(([u, v, r, fl]) => { const [x, y] = P(o, u, v, 4); return [y, () => Q.prawn3q(p, x, y, 30, r, fl)]; })) + W.flecks(p, 100, 92, 46, 70, 'hjp', ['#3a2414', '#5a3a20'], { ry: 26, s: 1 }) + W.flecks(p, 100, 92, 40, 12, 'hjn', ['#4a9a2c'], { ry: 20, s: 1.6 }); },
    // 紅糟肉: 豚バラを紅麹の漬け床に漬けて揚げ、切り分ける、きゅうり（お好みで）
    tw_hongzao_rou: p => { const D = plate(p), o = D.o; return D.s + byDepth([-36, -18, 0, 18, 36].map((u, i) => { const [x, y] = P(o, u, -u * .3 - 6); return [y, () => Q.prism(p, x, y, [[-7, -16], [7, -16], [7, 16], [-7, 16]], 14, '#b8301e', { rot: -14, top: Q.lg(p, [[0, '#f2c8b8'], [.3, '#e89a8a'], [.5, '#f8e0d0'], [1, '#c8604a']], 0, 0, 1, 0), line: .5 })]; })) + [[34, 34], [48, 26]].map(([u, v]) => W.coin(p, ...P(o, u, v), 7, '#3f7a2a', { h: 1.6, top: Q.rg(p, [[0, '#eef6d0'], [1, '#6a9a3a']], .4, .35, .8) })).join(''); },
    // 滷雞腿: 鶏のドラムスティックを醤油と氷砂糖で煮る、煮卵・押し豆腐（お好みで）（深皿）
    tw_lu_jitui: p => braise(p, deep(p), BRAISE, 'lj', 9, 20, 30, (x, y, r, i) => i % 4 === 3 ? Q.lump(p, x, y, 9, 7, '#a8642a', 'le' + i, { n: 12, jit: .06, hi: .7 }) : i % 4 === 2 ? W.dice(p, x, y, 13, '#8a4a1e', 'ld' + i, { h: 5 }) : W.drumstick(p, x, y, 34, r, i, { c: '#8a4018', fried: false })),
    // 客家小炒: 豚バラ・戻したするめ・押し豆腐の細切り・中国セロリ・青ねぎを炒める
    tw_kejia_xiaochao: p => plateHeap(p, plate(p), 'kj', 44, 48, 8, 16, (x, y, r, i) => { const k = i % 5; return k === 0 ? shred(p, x, y, 18, r, '#c8784a', 3) : k === 1 ? shred(p, x, y, 18, r, '#e0a888', 3) : k === 2 ? shred(p, x, y, 18, r, '#8a5a32', 3) : k === 3 ? shred(p, x, y, 18, r, '#8ac050', 2.4) : W.pod(p, x, y, 18, r, { c: '#4a9a2c', w: 2.6 }); }),
    // 豆酥鱈魚: たらの切り身を蒸して、炒めた豆酥（大豆のそぼろ）をのせる、青ねぎ・生姜
    tw_dousu_xueyu: p => { const D = plate(p), o = D.o; const [x, y] = P(o, 0, 4);
        return D.s + W.pool(p, x + 4, y + 10, 36, '#c8a060', 'dx') + W.cutSlab(p, x, y, 40, 28, 12, '#f6f2e8', 1, { rot: -6, edgeC: '#d8d0c0' }) + `<path d="${Q.blob(x, y - 12, 32, 13, 'dxs', { n: 12, jit: .2 })}" fill="#c8823a" opacity=".5"/>` + W.flecks(p, x, y - 12, 32, 120, 'dxc', ['#c8823a', '#a8641e', '#e8b060', '#8a4a14'], { ry: 13, s: 1.4 }) + W.flecks(p, x, y - 14, 26, 14, 'dxn', ['#4a9a2c', '#7ac050'], { ry: 9, s: 1.5 }); },
    // 蔥花蛋: 青ねぎをたっぷり入れた卵焼き
    tw_conghua_dan: p => { const D = plate(p); return D.s + omelet(p, 100, 100, 58, 1, '#f2c440') + W.flecks(p, 100, 94, 46, 50, 'chn', ['#3f8a2a', '#6ab048'], { ry: 26, s: 1.8 }); },
    // 蛋餅: 小麦粉の薄い生地と卵を焼いて巻き、切って並べる、醤油膏
    tw_dan_bing: p => { const D = plate(p), o = D.o;
        const piece = (u, v, i) => { const [x, y] = P(o, u, v); return [y, () => Q.prism(p, x, y, [[-12, -14], [12, -14], [12, 14], [-12, 14]], 10, '#e8c890', { rot: -6, top: Q.lg(p, [[0, '#fbe8c0'], [.5, '#f2d498'], [1, '#d8a860']], 0, 0, 1, 1), line: .55 }) + `<g ${T(x - 13, y - 5, -6)}><path d="M0,-8 Q-4,0 0,8" stroke="#f6c840" stroke-width="3" fill="none"/></g>` + W.flecks(p, x, y - 9, 8, 6, 'db' + i, ['#4a9a2c'], { ry: 8, s: 1.2 })]; };
        return D.s + byDepth([-42, -16, 10, 36].map((u, i) => piece(u, u * .2 - 6, i))) + W.pool(p, 140, 136, 12, '#5a2a12', 'dbs'); },

    // ---------- 副菜 ----------
    // 炒高麗菜: キャベツをにんにくで炒める、にんじん（お好みで）
    tw_chao_gaolicai: p => plateHeap(p, plate(p), 'gl', 22, 48, 12, 14, (x, y, r, i) => i % 7 === 3 ? shred(p, x, y, 12, r, '#e8742a', 2) : Q.leaf(p, x, y, 30, r, i % 2 ? '#d8e8a8' : '#b8d888', 'gl' + i, { wave: 3 })) + W.flecks(p, 100, 92, 40, 14, 'glg', ['#f6eccc', '#e8d8a0'], { ry: 20, s: 1.5 }),
    // 燙地瓜葉: さつまいもの葉をゆでて、醤油膏とにんにく、フライドエシャロット（お好みで）
    tw_tang_diguaye: p => leafyPlate(p, 'dg', '#3a7a2a', () => W.pool(p, 104, 112, 24, '#5a2a12', 'dgs') + shallots(p, 100, 90, 36, 20, 'dg')),
    // 滷豆干: 押し豆腐と卵を醤油で煮る、昆布の結び（お好みで）
    tw_lu_dougan: p => braise(p, deep(p), BRAISE, 'dg', 10, 18, 24, (x, y, r, i) => i % 4 === 3 ? Q.lump(p, x, y, 10, 8, '#a8642a', 'de' + i, { n: 12, jit: .06, hi: .7 }) : i % 6 === 5 ? `<g ${T(x, y, r)}><path d="M-6,0 Q0,-6 6,0 Q0,6 -6,0Z" fill="#3a4a22" stroke="#2a3418" stroke-width=".6"/></g>` : Q.prism(p, x, y, Q.square(16), 6, '#7a3e18', { rot: r, top: Q.rg(p, [[0, '#b8784a'], [.6, '#8a4a22'], [1, '#6a3414']], .4, .35, .8), line: .5 })),
    // 蒼蠅頭: ニラの花茎と豚ひき肉を豆豉と唐辛子で炒める
    tw_cangyingtou: p => plateHeap(p, plate(p), 'cy', 80, 48, 5, 14, (x, y, r, i) => i % 3 === 0 ? `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="#8a4a24"/>` : i % 7 === 1 ? W.chiliRing(x, y, 2.6, '#c8281a') : i % 9 === 4 ? `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2" ry="1.4" fill="#2e1e14"/>` : W.coin(p, x, y, 3, '#4a8a2a', { h: 3, top: Q.rg(p, [[0, '#c8e0a0'], [1, '#4a8a2a']], .4, .35, .8) })),
    // 鹹蛋苦瓜: ゴーヤを塩卵で炒める、唐辛子（お好みで）
    tw_xiandan_kugua: p => plateHeap(p, plate(p), 'xk', 20, 48, 12, 14, (x, y, r, i) => Q.prism(p, x, y, [[-9, -4], [9, -4], [8, 4], [-8, 4]], 3, '#a8c870', { rot: r, top: Q.lg(p, [[0, '#eef4d0'], [1, '#b8d080']], 0, 0, 1, 1), line: .45 }) + (i % 2 ? saltedYolk(p, x, y - 3, 5) : '')) + W.flecks(p, 100, 90, 40, 8, 'xkc', '#c8281a', { ry: 20, s: 2 }),
    // 塔香茄子: なすをバジルとにんにくで炒める、唐辛子（お好みで）
    tw_taxiang_qiezi: p => plateHeap(p, plate(p), 'tq', 18, 46, 14, 14, (x, y, r, i) => i % 4 === 3 ? basil(p, x, y, 16, r, i) : eggplant(p, x, y, 24, r, i), { sauce: '#7a3a18' }) + W.flecks(p, 100, 88, 36, 8, 'tqc', '#c8281a', { ry: 16, s: 2 }),
    // 炒水蓮: 水蓮（細長い茎）をにんにくで炒める、唐辛子（お好みで）
    tw_chao_shuilian: p => plateHeap(p, plate(p), 'sl', 40, 48, 7, 12, (x, y, r, i) => W.pod(p, x, y, 34, r, { c: '#5a9a3a', w: 2.4 })) + W.flecks(p, 100, 90, 40, 14, 'slg', ['#f6eccc', '#c8281a'], { ry: 20, s: 1.5 }),
    // 涼筍: ゆでた緑竹筍を冷やし、甘いマヨネーズで
    tw_liangsun: p => { const D = plate(p); return plateHeap(p, D, 'ls', 10, 44, 18, 10, (x, y, r, i) => Q.prism(p, x, y, [[-12, -9], [12, -9], [10, 9], [-10, 9]], 9, '#f2e8c0', { rot: r, top: Q.lg(p, [[0, '#fffbe8'], [1, '#f0e2b0']], 0, 0, 1, 1), line: .5 })) + W.drizzle([[66, 82], [86, 76], [106, 84], [128, 78]], '#fbf6e2', 3); },
    // 燙秋葵: ゆでたオクラに醤油膏とおろしにんにく
    tw_tang_qiukui: p => plateHeap(p, plate(p), 'qk', 12, 46, 18, 8, (x, y, r, i) => W.pod(p, x, y, 32, r, { c: '#5a9a34', w: 7, tip: '#7aa848' })) + W.pool(p, 140, 136, 12, '#5a2a12', 'qks'),
    // 台式泡菜: キャベツとにんじんを甘酢に漬ける、唐辛子（お好みで）
    tw_paocai: p => heapBowl(p, 'pc', 20, 12, 26, (x, y, r, i) => i % 4 === 3 ? shred(p, x, y, 12, r, '#e8742a', 2.4) : Q.leaf(p, x, y, 20, r, i % 2 ? '#eef2d0' : '#d8e4a8', 'pc' + i, { wave: 3 }), { base: '#e8ecc8', after: (o, H) => [[-12, -2], [12, 4]].map(([u, v]) => W.chiliRing(o.cx + u, o.cy - H * CZ + v, 3, '#c8281a')).join('') }),
    // 炒龍鬚菜: ハヤトウリの若芽をにんにくで炒める、干しえび（お好みで）
    tw_chao_longxucai: p => leafyPlate(p, 'lx', '#4a8a2a', () => W.flecks(p, 100, 90, 40, 12, 'lxg', ['#f6eccc'], { ry: 20, s: 1.5 }) + [[-20, -10], [14, 6], [0, -20]].map(([u, v], i) => driedShrimp(p, 100 + u, 88 + v * .6, i)).join('')),
    // 白菜滷: 白菜をしいたけ・干しえび・にんじん・卵（お好みで）・豚肉（お好みで）と煮る（深皿）
    tw_baicai_lu: p => W.soup(p, deep(p), { c: '#e8d4a0', drop: 4, glow: .4, items: (pl, S) => [
        ...W.spots('bl', 10, 54, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.leaf(p, x, y, 24, r, i % 2 ? '#f2f4d8' : '#d8e4a8', 'bl' + i, { wave: 3 })]; }),
        ...W.spots('bls', 4, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y + 1, () => W.mushSlice(p, x, y, 12, i * 40)]; }),
        ...W.spots('blc', 5, 52, 14).map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y + 1, () => shred(p, x, y, 12, r, '#e8742a', 2)]; }),
        ...W.spots('blx', 4, 50, 16).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y + 1, () => driedShrimp(p, x, y, i)]; }),
        [S.cy + 2, () => Q.eggRibbon(p, S.cx + 10, S.cy + 4, 24, 1)],
        [999, () => shallots(p, S.cx, S.cy, 40, 16, 'bl')],
    ] }),
    // 薑絲絲瓜: へちまを生姜の細切りで炒め煮、干しえび（お好みで）（深皿）
    tw_jiangsi_sigua: p => W.soup(p, deep(p), { c: '#e8e4c0', drop: 4, glow: .45, items: (pl, S) => [
        ...W.spots('js', 12, 54, 14).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.prism(p, x, y, [[-9, -5], [9, -5], [9, 5], [-9, 5]], 4, '#6a9a3a', { rot: r, top: Q.rg(p, [[0, '#f4f6d8'], [.7, '#d8e4a8'], [1, '#8ab858']], .4, .35, .8), line: .45 })]; }),
        ...W.spots('jsg', 10, 50, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 3); return [y + 1, () => ginger(x, y, r)]; }),
        ...W.spots('jsx', 4, 50, 16).map(([u, v], i) => { const [x, y] = pl(u, v, 3); return [y + 1, () => driedShrimp(p, x, y, i)]; }),
    ] }),
    // 番茄切盤: 切ったトマトに、生姜おろし入りの醤油膏を添える
    tw_fanqie_qiepan: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-40, -20], [-14, -26], [14, -24], [40, -16], [-30, 8], [0, 4], [30, 10]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => Q.prism(p, x, y, [[-12, 6], [0, -10], [12, 6], [0, 9]], 9, '#c8301e', { rot: (i % 3 - 1) * 20, top: Q.rg(p, [[0, '#ff9a7a'], [.4, '#e8503a'], [.6, '#f6c050'], [1, '#c8301e']], .45, .4, .7), line: .5 })]; })) + (() => { const [x, y] = P(o, 30, 40); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="14" ry="${f(14 * SYF * .7)}" fill="#5a2a12" stroke="#3a1a0a" stroke-width=".6"/><path d="${Q.blob(x, y - 1, 5, 2.6, 'gg')}" fill="#e8c870"/>`; })(); },
    // 滷筍乾: 乾燥のたけのこを醤油と氷砂糖で煮る、豚バラ（お好みで）（深皿）
    tw_lu_sungan: p => braise(p, deep(p), BRAISE, 'sg', 30, 9, 22, (x, y, r, i) => i % 6 === 5 ? meat(p, x, y, 14, r, i, '#a85a2a', '#e8b890') : shred(p, x, y, 20, r, '#9a6a2a', 3.4)),
    // 炒酸菜: 高菜の漬物を砂糖と唐辛子で炒める
    tw_chao_suancai: p => plateHeap(p, plate(p), 'sc', 40, 48, 7, 14, (x, y, r, i) => i % 7 === 3 ? W.chiliRing(x, y, 3, '#c8281a') : Q.prism(p, x, y, [[-5, -4], [5, -4], [5, 4], [-5, 4]], 2.6, '#9a9a3a', { rot: r, top: Q.rg(p, [[0, '#e0dc90'], [1, '#8a8a2a']], .4, .35, .8), line: .4 })),
    // 滷花生: 皮つきのピーナッツを醤油と八角で煮る
    tw_lu_huasheng: p => heapBowl(p, 'lh', 60, 7, 22, (x, y, r, i) => Q.lump(p, x, y, 5, 3.6, '#7a3e1e', 'lh' + i + x, { n: 8, jit: .1, hi: .5 }), { base: '#5a2a14' }),
    // 香煎豆腐: 豆腐を焼いて、醤油膏とにんにく、青ねぎ
    tw_xiangjian_doufu: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-36, -20], [0, -26], [36, -20], [-30, 14], [6, 10], [40, 16]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.tofuBlock(p, x, y, 30, 0, { sear: '#e0a048', depth: .3 }) + `<path d="${Q.blob(x, y - 9, 9, 4, 'xd' + i)}" fill="#5a2a12" opacity=".8"/>`]; })) + W.flecks(p, 100, 92, 46, 20, 'xdn', ['#4a9a2c', '#7ac050'], { ry: 24, s: 1.6 }); },
    // 炒山蘇: 山蘇（シダの若芽）を小魚と唐辛子で炒める
    tw_chao_shansu: p => plateHeap(p, plate(p), 'ss', 20, 48, 12, 12, (x, y, r, i) => i % 4 === 3 ? `<g ${T(x, y, r)}><path d="M-5,0 Q-2,-2 3,-1 L5,-2 L5,2 L3,1 Q-2,2 -5,0Z" fill="#e0c890" stroke="#8a6a32" stroke-width=".4"/></g>` : W.pod(p, x, y, 28, r, { c: '#4a8a2a', w: 6 }) + `<g ${T(x, y, r)}><path d="M-14,0 L14,0" stroke="#8ac050" stroke-width="1" opacity=".8"/></g>`) + W.flecks(p, 100, 90, 40, 8, 'ssc', '#c8281a', { ry: 20, s: 2 }),
    // 炒蒲瓜: ゆうがおを干しえびで炒め煮、にんじん（お好みで）、フライドエシャロット
    tw_chao_puagua: p => plateHeap(p, plate(p), 'pg', 22, 48, 11, 12, (x, y, r, i) => i % 5 === 4 ? shred(p, x, y, 12, r, '#e8742a', 2) : i % 5 === 3 ? driedShrimp(p, x, y, i) : Q.prism(p, x, y, [[-9, -4], [9, -4], [8, 4], [-8, 4]], 4, '#c8d898', { rot: r, top: Q.lg(p, [[0, '#f6f6e0'], [1, '#d8dca8']], 0, 0, 1, 1), line: .45 })) + shallots(p, 100, 90, 36, 14, 'pg'),
    // 台式馬鈴薯沙拉: じゃがいも・卵・にんじん・きゅうり・コーン（お好みで）を甘いマヨネーズで
    tw_malingshu_shala: p => W.inBowl(p, smallBowl(p), { R: 66, H: 30, items: (o, R, H) => [[0, () => W.cream(p, o.cx, o.cy + 4, R * .95, H, '#f6ead0', 'ml', { ridges: 3 })], ...W.onHill(o, 'mlv', 16, R * .8, 13, H, (x, y, r, i) => { const k = i % 4; return k === 0 ? W.dice(p, x, y, 5, '#e8742a', 'mc' + i, { h: 2 }) : k === 1 ? W.dice(p, x, y, 5, '#5a9a3a', 'mk' + i, { h: 2 }) : k === 2 ? W.kernel(p, x, y, 4.4) : `<path d="${Q.blob(x, y, 3, 2, 'my' + i)}" fill="#f6c840"/>`; }, { lift: 2 })] }),
    // 涼拌雞絲: 鶏むね肉を裂いて、きゅうり・にんじん（お好みで）と醤油・黒酢・ごま油で
    tw_liangban_jisi: p => heapBowl(p, 'jx', 40, 8, 28, (x, y, r, i) => i % 3 === 0 ? shred(p, x, y, 18, r, '#5a9a3a', 2.6) : i % 7 === 4 ? shred(p, x, y, 14, r, '#e8742a', 2) : shred(p, x, y, 18, r, '#f2e4cc', 3), { after: (o, H) => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 14, 'jxc', ['#f4e8c8', '#c8281a'], { ry: 12, s: 1.4 }) }),
    // 醃蜆仔: しじみをにんにく・唐辛子と醤油で漬ける
    tw_xian_xianzai: p => heapBowl(p, 'xz', 22, 12, 22, (x, y, r) => Q.clam(p, x, y, 14, r, Q.SHIJIMI), { base: '#5a3a1e', after: (o, H) => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 16, 'xzg', ['#f4e8cc', '#c8281a'], { ry: 12, s: 1.8 }) }),
    // 沙茶空心菜: 空心菜を沙茶醤とにんにくで炒める、唐辛子（お好みで）
    tw_shacha_kongxincai: p => plateHeap(p, plate(p), 'kx', 26, 48, 10, 14, (x, y, r, i) => i % 2 ? W.pod(p, x, y, 22, r, { c: '#7ab050', w: 3 }) : Q.leaf(p, x, y, 24, r, '#3a7a2a', 'kx' + i, { wave: 2 }), { sauce: '#8a4a1e' }) + W.flecks(p, 100, 90, 40, 8, 'kxc', '#c8281a', { ry: 20, s: 2 }),
    // 鹽酥杏鮑菇: エリンギに衣をつけて揚げ、胡椒塩、バジル（お好みで）
    tw_yansu_xingbaogu: p => plateHeap(p, plate(p), 'xb', 14, 46, 16, 16, (x, y, r, i) => i % 5 === 4 ? basil(p, x, y, 16, r, i) : W.crusty(p, x, y, 10, 8, i, { c: '#e0b060', n: 14, h: 6 })) + W.flecks(p, 100, 90, 40, 30, 'xbp', ['#5a3a20', '#f6eccc'], { ry: 20, s: .9 }),
    // 滷菜頭: 大根を醤油と氷砂糖で煮る、干ししいたけ（お好みで）（深皿）
    tw_lu_caitou: p => braise(p, deep(p), BRAISE, 'ct', 10, 18, 24, (x, y, r, i) => i % 5 === 4 ? W.mushCap(p, x, y, 14, '#6a3a1a') : W.coin(p, x, y, 11, '#a8642a', { h: 9, top: Q.rg(p, [[0, '#e8b878'], [.6, '#c8864a'], [1, '#9a5a2a']], .4, .35, .8) }) + Q.shine(x - 4, y - 10, 8, -8, .7)),

    // ---------- 汁物 ----------
    // 蛤蜊湯: あさりと生姜の細切りのすまし汁、青ねぎ
    tw_geli_tang: p => soup(p, '#f2ecd4', (pl, S) => [...W.spots('gl', 9, 56, 16).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => clam(p, x, y, 17, r)]; }), ...W.spots('glg', 8, 50, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y + 1, () => ginger(x, y, r)]; }), ...negis(pl, 'gln', 8, 56)], { glow: .5 }),
    // 玉米排骨湯: 豚スペアリブ・とうもろこし（輪切り）・にんじん
    tw_yumi_paigu: p => soup(p, '#f0e2b0', (pl, S) => [
        ...[[-24, -8, 20], [18, -12, 160]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.rib(p, x, y, 24, r, i, { c: '#c89a72', glaze: '#d8b088' })]; }),
        ...[[-36, 12], [30, 12], [4, 20]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.coin(p, x, y, 11, '#d8a830', { h: 8, top: Q.rg(p, [[0, '#fff2b0'], [.5, '#f6cc50'], [.7, '#f8e8c0'], [1, '#e8d498']], .4, .35, .8) })]; }),
        ...W.spots('ymc', 5, 52, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => Q.rangiri(p, x, y, 11, i * 40, '#e8682a', i)]; }),
    ]),
    // 魚丸湯: 魚のつみれと中国セロリ、フライドエシャロット
    tw_yuwan_tang: p => soup(p, '#efe6c8', (pl, S) => [...W.spots('yw', 7, 50, 22).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => ball(p, x, y, 20, '#f6f2e6', i)]; }), ...W.spots('ywc', 14, 56, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y + 1, () => celery(p, x, y, r)]; }), [999, () => shallots(p, S.cx, S.cy, 40, 14, 'yw')]]),
    // 香菇雞湯: 骨つきの鶏と干ししいたけのスープ
    tw_xianggu_jitang: p => soup(p, '#ecd090', (pl, S) => [...[[-26, -6], [16, -14], [6, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => chicken(p, x, y, 26, i)]; }), ...W.spots('xg', 7, 56, 17).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.mushCap(p, x, y, 15, '#7a4a2a')]; })], { oil: 8, oilC: '#f0c040' }),
    // 麻油雞: 骨つきの鶏を黒ごま油で炒めた生姜と米酒で煮る（土鍋）
    tw_mayouji: p => soup(p, '#a8642a', (pl, S) => [...[[-26, -6], [16, -14], [6, 14], [-10, 20]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => chicken(p, x, y, 26, i, '#c8864a', '#6a3414')]; }), ...W.spots('mgs', 10, 56, 13).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.coin(p, x, y, 6, '#c8a060', { h: 2, top: Q.rg(p, [[0, '#f6e4b0'], [.7, '#e8c878'], [1, '#a8783a']], .4, .35, .8) })]; })], { V: p => Q.donabe(p), oil: 14, oilC: '#7a4a1e', steamOp: .45 }),
    // 鳳梨苦瓜雞: 鶏とゴーヤ、発酵パイナップルのスープ
    tw_fengli_kugua_ji: p => soup(p, '#f0e0a8', (pl, S) => [...[[-26, -6], [16, -14], [6, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => chicken(p, x, y, 24, i)]; }), ...W.spots('fk', 6, 56, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.prism(p, x, y, [[-9, -5], [9, -5], [8, 5], [-8, 5]], 3, '#9ac060', { rot: r, top: Q.lg(p, [[0, '#e8f0c0'], [1, '#a8c870']], 0, 0, 1, 1), line: .45 })]; }), ...W.spots('fp', 6, 54, 14).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 7, '#e8b830', 'fp' + i, { h: 3 })]; })]),
    // 剝皮辣椒雞: 鶏と、皮をむいた青唐辛子の醤油漬け、干ししいたけ（お好みで）のスープ
    tw_bopi_lajiao_ji: p => soup(p, '#d8b070', (pl, S) => [...[[-26, -6], [16, -14], [6, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => chicken(p, x, y, 24, i)]; }), ...W.spots('bp', 6, 56, 16).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.pod(p, x, y, 26, r, { c: '#8a9a3a', w: 5 })]; }), ...W.spots('bps', 3, 50, 20).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.mushCap(p, x, y, 13, '#7a4a2a')]; })]),
    // 長年雞湯: 鶏とからし菜（長年菜）のスープ
    tw_changnian_jitang: p => soup(p, '#ecd8a0', (pl, S) => [...[[-26, -6], [16, -14], [6, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => chicken(p, x, y, 24, i)]; }), ...W.spots('cn', 7, 56, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => greens(p, x, y, 24, r, i, '#4a8a2a')]; })]),
    // 貢丸湯: 豚の肉団子（貢丸）と大根、中国セロリ、フライドエシャロット
    tw_gongwan_tang: p => soup(p, '#efe2c0', (pl, S) => [...W.spots('gw', 6, 50, 22).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => ball(p, x, y, 21, '#d8c0a0', i)]; }), ...W.spots('gwd', 5, 56, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => daikon(p, x, y, 13, i, '#efe2c0')]; }), ...W.spots('gwc', 12, 56, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y + 1, () => celery(p, x, y, r)]; }), [999, () => shallots(p, S.cx, S.cy, 40, 14, 'gw')]]),
    // 虱目魚肚湯: サバヒーの腹身と生姜の細切りのスープ、中国セロリ（お好みで）
    tw_shimuyu_tang: p => soup(p, '#f2ecd8', (pl, S) => [[S.cy, () => { const [x, y] = pl(-4, 0, 2); return W.cutSlab(p, x, y, 40, 22, 6, '#f2e8d6', 1, { rot: -6, edgeC: '#c8c0b0' }); }], ...W.spots('smg', 10, 54, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 3); return [y + 20, () => ginger(x, y, r)]; }), ...W.spots('smc', 8, 56, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 3); return [y + 20, () => celery(p, x, y, r)]; })], { glow: .5 }),
    // 蚵仔湯: 小粒のかきに片栗粉をまぶしてさっと煮る、生姜の細切り・青ねぎ
    tw_ezai_tang: p => soup(p, '#f0e8d0', (pl, S) => [...W.spots('ez', 12, 56, 13).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => oyster(p, x, y, 14, i)]; }), ...W.spots('ezg', 8, 50, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y + 1, () => ginger(x, y, r)]; }), ...negis(pl, 'ezn', 8, 56)]),
    // 肉羹: 豚の細切りに練りものの衣をまとわせ、白菜・たけのこ（お好みで）・にんじん・しいたけ（お好みで）のとろみスープ
    tw_rougeng: p => soup(p, '#a87a40', (pl, S) => [...W.spots('rg', 9, 52, 17).map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.lump(p, x, y, 9, 4.4, '#e8c8a8', 'rg' + i, { n: 9, jit: .35, hi: .4 })]; }), ...W.spots('rgv', 16, 58, 9).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 4; return [y, () => k === 0 ? shred(p, x, y, 12, r, '#f2f0d8', 2.4) : k === 1 ? shred(p, x, y, 10, r, '#e8742a', 1.8) : k === 2 ? shred(p, x, y, 12, r, '#e8d8a0', 2) : shred(p, x, y, 10, r, '#7a4a2a', 2)]; })], { glow: .3 }),
    // 魷魚羹: いか・たけのこ・白菜のとろみスープ（沙茶醤）、バジル（お好みで）
    tw_youyu_geng: p => soup(p, '#b8823e', (pl, S) => [...W.spots('yy', 8, 54, 17).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => `<g ${T(x, y, r)}><rect x="-12" y="-4.4" width="24" height="8.8" rx="2" fill="${Q.lg(p, [[0, '#fbe8d8'], [1, '#e0b090']], 0, 0, 0, 1)}" stroke="#a8784a" stroke-width=".6"/>${[-7, -2, 3, 8].map(u => `<path d="M${u},-3.6 l2,7" stroke="#d8a080" stroke-width="1" opacity=".8"/>`).join('')}</g>`]; }), ...W.spots('yyb', 6, 56, 15).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => bambooSlice(p, x, y, 13, r, '#b8823e')]; }), ...W.spots('yyc', 5, 56, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 16, r, '#e8ecc8', 'yc' + i, { wave: 2 })]; }), ...W.spots('yyl', 3, 46, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y + 1, () => basil(p, x, y, 14, r, i)]; })]),
    // 四神湯: 豚スペアリブと四神（はと麦・蓮の実・芡実・山薬・茯苓）のスープ
    tw_sishen_tang: p => soup(p, '#efe6cc', (pl, S) => [...[[-24, -8, 20], [18, -12, 160]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.rib(p, x, y, 24, r, i, { c: '#c89a72', glaze: '#d8b088' })]; }), ...W.spots('ss', 26, 58, 7).map(([u, v], i) => { const [x, y] = pl(u, v); const k = i % 4; return [y, () => k === 0 ? Q.pea(p, x, y, 2.6, '#f2ead6') : k === 1 ? Q.lump(p, x, y, 3.8, 3, '#f2e4c4', 'ls' + i, { hi: .6 }) : k === 2 ? Q.pea(p, x, y, 2.4, '#d8b890') : W.coin(p, x, y, 5, '#f4ecd8', { h: 2 })]; })]),
    // 排骨酥湯: 下味の豚スペアリブを揚げて、大根と煮る、中国セロリ（お好みで）
    tw_paigusu_tang: p => soup(p, '#c89a5a', (pl, S) => [...W.spots('pgs', 6, 52, 20).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.crusty(p, x, y, 12, 8, i, { c: '#a8642a', n: 14, h: 5 })]; }), ...W.spots('pgd', 5, 56, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => daikon(p, x, y, 13, i, '#c89a5a', '#f0e2c4')]; }), ...W.spots('pgc', 10, 56, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y + 1, () => celery(p, x, y, r)]; })]),
    // 藥燉排骨: 豚スペアリブを漢方（当帰・川芎・熟地・クコ・なつめ）と煮る、濃い茶色のスープ
    tw_yaodun_paigu: p => soup(p, '#6a3a1a', (pl, S) => [...[[-24, -8, 20], [18, -12, 160], [2, 14, 200]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.rib(p, x, y, 24, r, i, { c: '#a8784a', glaze: '#8a5a2a' })]; }), ...W.spots('ydg', 6, 52, 13).map(([u, v]) => { const [x, y] = pl(u, v, 1); return [y + 1, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.6" fill="#d8301e" stroke="#9a1e10" stroke-width=".4"/>`]; }), ...W.spots('ydd', 4, 50, 16).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => Q.lump(p, x, y, 4.6, 3.6, '#a8281e', 'yd' + i, { hi: .6 })]; }), ...W.spots('ydh', 5, 54, 14).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.prism(p, x, y, [[-6, -3], [6, -3], [6, 3], [-6, 3]], 1.4, '#c8a878', { rot: r, line: .4 })]; })], { glow: .25 }),
    // 豬肝湯: 豚レバーと生姜の細切りのスープ、青ねぎ
    tw_zhugan_tang: p => soup(p, '#f0e4c4', (pl, S) => [...W.spots('zg', 8, 54, 17).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => meat(p, x, y, 18, r, i, '#7a3a2a', '#9a5a4a')]; }), ...W.spots('zgg', 10, 50, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y + 1, () => ginger(x, y, r)]; }), ...negis(pl, 'zgn', 8, 56)], { oil: 3, oilC: SESOIL }),
    // 花生豬腳湯: 豚足とピーナッツの白いスープ
    tw_huasheng_zhujiao: p => soup(p, '#f4eedc', (pl, S) => [...[[-22, -6], [18, -10], [0, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.lump(p, x, y, 15, 11, '#f0d8b8', 'zj' + i, { n: 10, jit: .14, hi: .6 }) + `<ellipse cx="${f(x + 4)}" cy="${f(y - 1)}" rx="5" ry="3" fill="#f8f0e0"/>`]; }), ...W.spots('hsp', 22, 58, 8).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.lump(p, x, y, 4, 3, '#f2dcb8', 'hp' + i, { hi: .6 })]; })], { glow: .5 }),
    // 羅宋湯（台湾）: 牛すね・トマト・キャベツ・じゃがいも・にんじん・玉ねぎのスープ（洋の深皿）
    tw_luosong_tang: p => W.soup(p, W.soupPlate(p), { c: '#d8582a', drop: 5, glow: .3, items: (pl, S) => [...W.spots('ls', 22, 60, 10).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 5; return [y, () => k === 0 ? W.dice(p, x, y, 11, '#6a3418', 'lb' + i, { h: 6, top: Q.rg(p, [[0, '#a86a42'], [1, '#6a3418']], .4, .35, .8) }) : k === 1 ? W.dice(p, x, y, 10, '#f2e2b0', 'lp' + i, { h: 4, sink: 1.6, liq: '#d8582a' }) : k === 2 ? Q.leaf(p, x, y, 16, r, '#d8e4a8', 'lc' + i, { wave: 2 }) : k === 3 ? W.dice(p, x, y, 6, '#e8742a', 'lk' + i, { h: 2.4 }) : W.onionStrip(x, y, 10, r)]; })] }),
    // 清燉牛肉湯: 牛すねと大根の澄んだスープ、青ねぎ
    tw_qingdun_niurou: p => soup(p, '#e8d4a0', (pl, S) => [...W.spots('qd', 6, 52, 19).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.dice(p, x, y, 15, '#7a4a2a', 'qb' + i, { h: 8, top: Q.rg(p, [[0, '#b88a6a'], [.6, '#8a5a3a'], [1, '#6a3a22']], .4, .35, .8) })]; }), ...W.spots('qdd', 5, 56, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => daikon(p, x, y, 15, i, '#e8d4a0')]; }), ...negis(pl, 'qdn', 10, 56)]),
    // 皮蛋莧菜湯: ひゆ菜とピータンのとろみスープ、しらす（お好みで）、にんにく
    tw_pidan_xiancai: p => soup(p, '#9a3a5a', (pl, S) => [...W.spots('px', 10, 56, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => greens(p, x, y, 22, r, i, '#3a7a2a')]; }), ...W.spots('pxp', 6, 52, 16).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y + 1, () => pidan(p, x, y, 11, r)]; }), ...W.spots('pxw', 12, 54, 8).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y + 1, () => `<g ${T(x, y, r)}><path d="M-4,0 L4,0" stroke="#f6f2e2" stroke-width="1.4" stroke-linecap="round"/><circle cx="-4" cy="0" r=".7" fill="#3a2a1a"/></g>`]; })], { glow: .3 }),
    // 鹹湯圓: もち米の白玉を、豚の細切り・しいたけ・干しえび・春菊のスープで
    tw_xian_tangyuan: p => soup(p, '#e8d4a0', (pl, S) => [...W.spots('xt', 14, 54, 12).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.lump(p, x, y, 5.6, 4.6, '#fbf8f0', 'xt' + i, { n: 10, jit: .06, hi: .7 })]; }), ...W.spots('xtm', 6, 56, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => i % 2 ? shred(p, x, y, 12, r, '#e8c8a8', 2.4) : W.mushSlice(p, x, y, 11, r)]; }), ...W.spots('xtg', 5, 56, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => greens(p, x, y, 20, r, i, '#3f8a2a')]; }), ...W.spots('xts', 4, 50, 16).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => driedShrimp(p, x, y, i)]; })]),
    // 竹筍湯: 緑竹筍と干ししいたけ、昆布（お好みで）のすまし汁
    tw_zhusun_tang: p => soup(p, '#f0e6c4', (pl, S) => [...W.spots('zs', 10, 56, 15).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => bambooSlice(p, x, y, 16, r, '#f0e6c4')]; }), ...W.spots('zsm', 4, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.mushCap(p, x, y, 13, '#7a4a2a')]; }), ...W.spots('zsk', 3, 50, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 18, r, '#3a4a22', 'zk' + i, { wave: 2 })]; })], { glow: .5 }),

    // ---------- 麺・ご飯もの ----------
    // 滷肉飯: 皮つきの豚バラを細かく刻んで醤油で煮て、ご飯にかける、フライドエシャロット、煮卵（お好みで）（飯碗）
    tw_lurou_fan: p => riceTop(p, 'lr', (cx, cy) => `<path d="${Q.blob(cx, cy + 2, 58, 20, 'lrs', { n: 12, jit: .18 })}" fill="#7a3a16" opacity=".92"/>` + W.crumble(p, cx, cy, 52, 17, 150, 'lr', { c: '#8a4a22' }) + W.flecks(p, cx, cy, 34, 30, 'lrf', ['#f0d0a0', '#fbe8c8'], { ry: 10, s: 1.4 }) + Q.lump(p, cx + 30, cy + 6, 13, 10, '#a8642a', 'lre', { n: 12, jit: .06, hi: .7 }) + Q.shine(cx - 20, cy - 4, 18, -8, .8)),
    // 炒米粉: 新竹の細いビーフンを、豚の細切り・キャベツ・にんじん・しいたけ・干しえび（お好みで）と炒める
    tw_chao_mifen: p => { const D = plate(p), o = D.o; return D.s + W.noodleMound(p, 100, 104, 58, 20, '#f2e4c0', 'mf', { w: 1.2, n: 220, len: 30, sy: SYF, edge: '#c8b088' }) + byDepth(W.spots('mfv', 18, 50, 11).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u, v, 58, 20)); const k = i % 5; return [y, () => k === 0 ? shred(p, x, y, 14, r, '#b0703e') : k === 1 ? Q.leaf(p, x, y, 14, r, '#c8dc90', 'mfl' + i, { wave: 2 }) : k === 2 ? shred(p, x, y, 12, r, '#e8742a', 1.6) : k === 3 ? shred(p, x, y, 12, r, '#6a3a1a', 2) : driedShrimp(p, x, y, i)]; })) + shallots(p, 100, 90, 36, 14, 'mf'); },
    // 高麗菜飯: キャベツ・豚バラ（お好みで）・しいたけ・干しえび・にんじんと米を炊く（飯碗）
    tw_gaolicai_fan: p => { const V = riceBowl(p), o = { cx: V.cx, cy: V.cy + 2 }, H = 40;
        return V.s + `<g ${V.above}>${W.friedRice(p, o.cx, o.cy, V.irx - 2, H, 'gc', { cols: ['#e8d0a0', '#d8bc88', '#f2e0b8'], edge: '#a8824a', n: 420 })}${byDepth(W.onHill(o, 'gcv', 16, V.irx - 8, 10, H, (x, y, r, i) => { const k = i % 4; return k === 0 ? Q.leaf(p, x, y, 13, r, '#b8d080', 'gl' + i, { wave: 2 }) : k === 1 ? shred(p, x, y, 9, r, '#6a3a1a', 2) : k === 2 ? shred(p, x, y, 9, r, '#e8742a', 1.6) : driedShrimp(p, x, y, i); }, { lift: 2 }))}</g>` + V.shine(.5); },
    // 油飯: もち米を黒ごま油・豚の細切り・しいたけ・干しえび・フライドエシャロットと蒸す（飯碗）
    tw_youfan: p => { const V = riceBowl(p), o = { cx: V.cx, cy: V.cy + 2 }, H = 40;
        return V.s + `<g ${V.above}>${W.friedRice(p, o.cx, o.cy, V.irx - 2, H, 'yf', { cols: ['#a8703a', '#8a5a2a', '#c08a50'], edge: '#5a3418', n: 440 })}${byDepth(W.onHill(o, 'yfv', 14, V.irx - 8, 11, H, (x, y, r, i) => { const k = i % 3; return k === 0 ? shred(p, x, y, 10, r, '#c87a4a', 2.4) : k === 1 ? W.mushSlice(p, x, y, 10, r) : driedShrimp(p, x, y, i); }, { lift: 2 }))}${shallots(p, o.cx, o.cy - H * CZ * .7, 40, 20, 'yf')}</g>` + V.shine(.5); },
    // 雞肉飯（嘉義）: ゆでた鶏むね肉を裂いて、エシャロット油とたれでご飯にかける、たくあん（お好みで）（飯碗）
    tw_jiroufan: p => riceTop(p, 'jr', (cx, cy) => byDepth(W.spots('jr', 50, 50, 6, { ry: 14 }).map(([u, v, r]) => [cy + v, () => shred(p, cx + u, cy + v, 14, r, '#f6ead6', 2.6)])) + W.flecks(p, cx, cy, 34, 30, 'jrf', ['#c8822a', '#e8b060'], { ry: 10, s: 1.4 }) + `<path d="${Q.blob(cx + 30, cy + 8, 8, 4, 'jrr')}" fill="#f6d840" stroke="#c8a820" stroke-width=".5"/>`),
    // 牛肉麺: 牛すねの塊を豆板醤と醤油で煮込んだスープに太麺、トマト・玉ねぎ、青菜（大きな碗）
    tw_niuroumian: p => soup(p, '#9a4a1e', (pl, S) => [
        [S.cy - 2, () => W.noodleMound(p, S.cx, S.cy + 4, S.rx * .78, 6, '#f2dca0', 'nr', { w: 3.4, n: 70, len: 32 })],
        ...[[-26, -8], [8, -14], [28, 4], [-8, 12]].map(([u, v], i) => { const [x, y] = pl(u, v, 5); return [y + 6, () => W.dice(p, x, y, 17, '#6a3418', 'nb' + i, { h: 10, top: Q.rg(p, [[0, '#a86a42'], [.6, '#7a4224'], [1, '#5a2c14']], .4, .35, .8) })]; }),
        [S.cy + 10, () => { const [x, y] = pl(-34, 10, 6); return Q.leaf(p, x, y, 30, 20, '#3f8a2a', 'nrg', { wave: 2 }) + Q.leaf(p, x + 8, y + 4, 26, 60, '#4f9a34', 'nrg2', { wave: 2 }); }],
        ...negis(pl, 'nrn', 8, 54).map(([y, fn]) => [y + 12, fn]),
    ], { oil: 12, oilC: '#e8602a' }),
    // 麻醤麺: 細い麺をごまだれ・醤油・黒酢で和える、きゅうり（お好みで）・青ねぎ（大きな碗）
    tw_majiangmian: p => { const V = bowl(p), o = { cx: 100, cy: V.cy + 6 }, H = 22;
        return V.s + `<g ${V.above}>${W.noodleMound(p, o.cx, o.cy, 76, H, '#f2dca0', 'mj', { w: 2.2, n: 160, len: 32 })}<path d="${Q.blob(o.cx - 4, o.cy - H * CZ + 4, 34, 13, 'mjs', { n: 12, jit: .25 })}" fill="${Q.rg(p, [[0, '#e8b878'], [.6, '#c8904a'], [1, '#a06a2a']], .4, .35, .8)}"/>${byDepth(W.onHill(o, 'mjk', 12, 50, 9, H, (x, y, r) => shred(p, x, y, 16, r, '#6ab048', 2.4), { lift: 3, cu: 26, cv: 6 }))}${W.flecks(p, o.cx - 8, o.cy - H * CZ, 30, 14, 'mjn', ['#4a9a2c', '#7ac050'], { ry: 10, s: 1.5 })}</g>` + V.shine(.5); },
    // 麻油麺線: 細い麺線を黒ごま油と生姜で炒め、卵、青菜（お好みで）
    tw_mayou_mianxian: p => { const D = plate(p), o = D.o; return D.s + W.noodleMound(p, 100, 104, 58, 18, '#d8b880', 'mx', { w: 1.2, n: 220, len: 30, sy: SYF, edge: '#8a6a3a' }) + W.friedEgg(p, 102, 84, 40, 1, { sy: SYF }) + byDepth(W.spots('mxv', 10, 50, 13).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u, v, 58, 18)); return [y, () => i % 2 ? W.coin(p, x, y, 5.6, '#c8a060', { h: 2, top: Q.rg(p, [[0, '#f6e4b0'], [1, '#c8a060']], .4, .35, .8) }) : greens(p, x, y, 16, r, i, '#3f8a2a')]; })) + Q.shine(78, 86, 16, -8, .7); },
    // 地瓜粥: 米とさつまいものかゆ、漬物・煮卵（お好みで）
    tw_digua_zhou: p => congee(p, 'dg', (pl, S) => [...W.spots('dgp', 8, 52, 17).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.dice(p, x, y, 13, '#e8a040', 'dg' + i, { h: 5, sink: 2, liq: '#f4ecd8', top: Q.rg(p, [[0, '#fbd890'], [.6, '#f0b050'], [1, '#c8822a']], .4, .35, .8) })]; })]),
    // 鹹粥: 豚肉・干ししいたけ・干しえびのかゆ、フライドエシャロット、青ねぎ（お好みで）
    tw_xian_zhou: p => congee(p, 'xz', (pl, S) => [...W.spots('xzm', 8, 54, 14).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => i % 2 ? shred(p, x, y, 12, r, '#e8c8a8', 2.4) : W.mushSlice(p, x, y, 10, r)]; }), ...W.spots('xzs', 5, 50, 14).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + .5, () => driedShrimp(p, x, y, i)]; }), ...negis(pl, 'xzn', 8, 54), [999, () => shallots(p, S.cx, S.cy, 40, 16, 'xz')]], { c: '#efe2c8' }),
};
