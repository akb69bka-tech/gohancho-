// イタリア（it_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: パスタ・リゾット・スープはイタリアの深皿（piatto fondo）、主菜は白い平皿（piatto piano）、オーブン料理はテラコッタの耐熱皿、
// サラダは白い鉢、付け合わせは白い平皿か小鉢。イタリアの陶器は青の絵付けが多いが、青は使わない（縁は灰・テラコッタ）。
// 材料は gohancho/packs/it.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, T, rng, smooth, lt, dk, mix, SY, CZ, SYF, SHADE, at, byDepth } = W;

// =========================================================
// イタリアの器と部品
// =========================================================
const EDGE = '#c8b89a', TERRA = '#c06a3e', SUGO = '#c8301e', OIL = '#d8b040';
const P = (o, u, v, z = 0) => at(o, u, v, z);
const plate = (p, o = {}) => Q.plate(p, { line: 'none', edge: EDGE, ...o });
const fondo = (p, o = {}) => Q.fukazara(p, { line: EDGE, well: .66, ...o });
const bowl = (p, o = {}) => W.bowl(p, { outer: '#f2ede2', inner: '#faf7f0', edge: EDGE, h: 48, cy: 82, ...o });
const smallBowl = (p, o = {}) => W.sideBowl(p, { outer: '#f4f1ea', inner: '#fbf9f4', edge: EDGE, ...o });
const teglia = (p, o = {}) => W.casserole(p, { base: TERRA, inner: '#e8c8a0', ...o });
// 具
const basil = (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#2f7a2a', 'bs' + i, { wave: 1.2 });
const parsley = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'pz' + seed, ['#3f7a2a', '#5a9a3a'], { ry: rx * .45, s: 1.3 });
const parm = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'pm' + seed, ['#fbf6e0', '#f2e6c0', '#e8d8a8'], { ry: rx * .45, s: 1.4 });
const pepper = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'pp' + seed, ['#3a2414', '#5a3a20'], { ry: rx * .45, s: .8 });
const shaving = (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, -s * .25], [s / 2, -s * .35], [s * .4, s * .3], [-s * .45, s * .25]], 1.4, '#f2e2b0', { rot: r, top: Q.lg(p, [[0, '#fffbe8'], [1, '#f0dca0']], 0, 0, 1, 1), line: .4 });
const mozz = (p, x, y, rx, ry, i) => `<path d="${Q.blob(x, y, rx, ry, 'mz' + i + x, { n: 10, jit: .3 })}" fill="${Q.rg(p, [[0, '#fffdf4'], [.7, '#f8eed0'], [1, '#e0c890']], .4, .35, .8)}" stroke="#e0c890" stroke-width=".5"/>`;
const mozzBall = (p, x, y, s, i) => Q.lump(p, x, y, s / 2, s * .4, '#fbf8ee', 'mb' + i + x, { n: 10, jit: .08, hi: .6, edge: '#e0d6c0' });
const olive = (p, x, y, s, c = '#4a3028') => `<ellipse cx="${f(x + 1)}" cy="${f(y + 1.4)}" rx="${f(s / 2)}" ry="${f(s * .3)}" fill="${SHADE}" opacity=".3"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s / 2)}" ry="${f(s * .38)}" fill="${Q.rg(p, [[0, lt(c, .35)], [.6, c], [1, dk(c, .3)]], .35, .3, .8)}" stroke="${dk(c, .4)}" stroke-width=".5"/><ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .12)}" rx="${f(s * .12)}" ry="${f(s * .07)}" fill="#fff" opacity=".7"/>`;
const caper = (p, x, y) => Q.pea(p, x, y, 1.8, '#7a8a3a');
const rosemary = (x, y, L, r) => `<g ${T(x, y, r)}><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#6a5a3a" stroke-width=".9"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${f(-L / 2 + 2 + i * (L - 4) / 7)},0 l${i % 2 ? 2 : -2},${i % 2 ? -4 : 4}" stroke="#4a6a3a" stroke-width="1.4" stroke-linecap="round"/>`).join('')}</g>`;
const sage = (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#7a9a6a', 'sg' + i, { wave: .6 });
const tomatoDice = (p, x, y, s, i) => W.tomatoDice(p, x, y, s, i);
const cherry = (p, x, y, s, halved = false) => halved ? Q.cast(p, x, y + 2, s * .5, s * .16, .3) + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s / 2)}" ry="${f(s * .36)}" fill="#c8281a" stroke="#9a1e10" stroke-width=".5"/><ellipse cx="${f(x)}" cy="${f(y - 1)}" rx="${f(s * .42)}" ry="${f(s * .3)}" fill="${Q.rg(p, [[0, '#ff9a7a'], [.5, '#e8503a'], [.75, '#f6c050'], [1, '#d8402a']], .45, .4, .7)}"/>` : W.tomatoBall(p, x, y, s);
// ショートパスタ（ペンネ・リガトーニ・ディタリーニ）: 斜めに切った筒
function penne(p, x, y, L, r, { c = '#f2d690', w = 5, ridge = true } = {}){
    return `<g ${T(x, y, r)}>${Q.cast(p, 0, w * .6, L * .5, w * .3, .25)}<path d="M${f(-L / 2)},${f(-w / 2)} L${f(L / 2 - 2)},${f(-w / 2)} L${f(L / 2 + 2)},${f(w / 2)} L${f(-L / 2 + 4)},${f(w / 2)}Z" fill="${Q.lg(p, [[0, lt(c, .3)], [.5, c], [1, dk(c, .2)]], 0, 0, 0, 1)}" stroke="${dk(c, .3)}" stroke-width=".5"/>${ridge ? [-.3, 0, .3].map(k => `<path d="M${f(-L / 2 + 2)},${f(k * w)} L${f(L / 2 - 1)},${f(k * w)}" stroke="${dk(c, .12)}" stroke-width=".5"/>`).join('') : ''}<ellipse cx="${f(L / 2)}" cy="0" rx="1.6" ry="${f(w / 2)}" fill="${dk(c, .35)}"/></g>`;
}
const ditali = (p, x, y, s = 4, c = '#f2d690') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .6)}" ry="${f(s * .45)}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".5"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .25)}" ry="${f(s * .18)}" fill="${dk(c, .3)}"/>`;
const star = (x, y, s = 2.6, c = '#f2d690') => `<path d="${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.283 - 1.57, r = i % 2 ? s * .45 : s; return `${i ? 'L' : 'M'}${f(x + Math.cos(a) * r)},${f(y + Math.sin(a) * r * .7)}`; }).join('')}Z" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".4"/>`;
// トルテッリーニ（指輪形）
const tortellino = (p, x, y, s, r) => `<g ${T(x, y, r)}>${Q.cast(p, 0, s * .3, s * .5, s * .15, .3)}<path d="M${f(-s / 2)},0 Q${f(-s / 2)},${f(-s * .5)} 0,${f(-s * .5)} Q${f(s / 2)},${f(-s * .5)} ${f(s / 2)},0 Q${f(s * .3)},${f(s * .3)} 0,${f(s * .2)} Q${f(-s * .3)},${f(s * .3)} ${f(-s / 2)},0Z" fill="${Q.rg(p, [[0, '#fbe8b0'], [.6, '#f0cc78'], [1, '#c89a48']], .4, .3, .8)}" stroke="#b8883a" stroke-width=".6"/><ellipse cx="0" cy="${f(-s * .12)}" rx="${f(s * .14)}" ry="${f(s * .1)}" fill="#c89a48"/></g>`;
// ニョッキ（筋のある小さな枕）
const gnocco = (p, x, y, s, r, i) => `<g ${T(x, y, r)}>${Q.lump(p, 0, 0, s / 2, s * .34, '#f2dca0', 'gn' + i, { n: 8, jit: .1, hi: .4 })}${[-.2, 0, .2].map(k => `<path d="M${f(k * s)},${f(-s * .25)} l0,${f(s * .45)}" stroke="#c8a860" stroke-width=".8"/>`).join('')}</g>`;
// ムール貝（黒に近い焦げ茶の殻、橙の身）
const mussel = (p, x, y, s, r) => W.musselOpen(p, x, y, s * 1.3, r);
// 魚の切り身（白身）
const whiteFish = (p, x, y, w, d, r, i, liq = null) => liq ? Q.prism(p, x, y, [[-w / 2, -d / 2], [w / 2, -d * .4], [w * .45, d / 2], [-w * .45, d * .45]], 6, '#f2ece0', { rot: r, sink: 2, liquid: liq, top: Q.lit(p, '#fbf8f0', .2, .08), line: .5 }) : W.cutSlab(p, x, y, w / 2, d / 2 * SYF, 7, '#f6f2e8', i, { rot: r, edgeC: '#e0d8c8' });
const zucchiniRound = (p, x, y, r, liq = null) => W.coin(p, x, y, r, '#3f7a2a', { h: 2.2, liq, top: Q.rg(p, [[0, '#f8f6d8'], [.75, '#e4ecb8'], [.9, '#a8c870'], [1, '#3f7a2a']], .4, .35, .8) });
const carrotDice = (p, x, y, s, i, liq = null) => W.dice(p, x, y, s, '#e8742a', 'cd' + i, { h: s * .5, sink: liq ? 1 : 0, liq });
const celeryDice = (p, x, y, s, i, liq = null) => W.dice(p, x, y, s, '#9ac860', 'ce' + i, { h: s * .4, sink: liq ? 1 : 0, liq });
const potatoDice = (p, x, y, s, i, liq = null) => W.dice(p, x, y, s, '#f2e2b0', 'pd' + i, { h: s * .5, sink: liq ? 2 : 0, liq });
const toast = (p, x, y, w, r) => W.bread(p, x, y, w, r, { toast: .55, th: 6 });
const roastPotato = (p, x, y, s, i) => W.dice(p, x, y, s, '#c8862e', 'rp' + i, { h: s * .6, top: Q.rg(p, [[0, '#fbe0a0'], [.6, '#e8b058'], [.9, '#c8802a'], [1, '#9a5a1a']], .4, .35, .75) });
const eggplantSlice = (p, x, y, r, i) => W.coin(p, x, y, r, '#5a2a4a', { h: 2.4, top: Q.rg(p, [[0, '#f2dca8'], [.7, '#d8b070'], [.9, '#a8783a'], [1, '#5a2a4a']], .4, .35, .8) });

// ---------- 組み立て ----------
// パスタ（深皿に盛る）: noodle = 'long'（スパゲッティ・タリアテッレ）/ 'short'（ペンネ）など。sauce は面のソース
function pasta(p, { kind = 'long', c = '#f2d690', w = 2.2, sauce = null, sauceOp = .9, items = () => [], after = () => '', H = 22, n = 150 }){
    const V = fondo(p), o = { cx: 100, cy: V.cy + 2 };
    let base;
    if (kind === 'long') base = W.noodleMound(p, o.cx, o.cy, 52, H, c, p.id + 'n', { w, n, len: 34, sy: SYF });
    else base = W.mound(p, o.cx, o.cy, 50, H, dk(c, .05), 'sb' + p.id, SYF) + byDepth(W.spots(p.id + 'sp', n, 50, 7.5).map(([u, v, r], i) => { const [x, y] = P({ ...o, sy: SYF }, u, v, W.hill(u, v, 50, H) + 2); return [y, () => kind === 'gnocchi' ? gnocco(p, x, y, 13, r, i) : penne(p, x, y, kind === 'trofie' ? 11 : 15, r, { c, w: kind === 'trofie' ? 3.4 : 5, ridge: kind !== 'trofie' })]; }));
    const sc = sauce ? `<path d="${Q.blob(o.cx, o.cy - H * CZ * .55, 34, 18, p.id + 'sc', { n: 12, jit: .28 })}" fill="${Q.rg(p, [[0, lt(sauce, .3)], [.6, sauce], [1, dk(sauce, .25)]], .4, .35, .8)}" opacity="${sauceOp}"/>` : '';
    return V.s + base + sc + byDepth(items(o, H)) + after(o, H);
}
// 平皿の山
const plateHeap = (p, D, seed, n, R, minD, H, draw, { sauce = null, sauceR = 34 } = {}) => { R *= .92; H += 5; return D.s + (sauce ? W.pool(p, D.o.cx + 4, D.o.cy + 8, sauceR, sauce, seed) : '') + byDepth(W.spots(seed, Math.round(n * 1.3), R, minD * .85).map(([u, v, r], i) => { const [x, y] = P(D.o, u, v, 4 + W.hill(u, v, R, H)); return [y, () => draw(x, y, r, i)]; })); };
const heapBowl = (p, V, seed, n, minD, H, draw, { base = null, R = 64, after = () => '' } = {}) => W.inBowl(p, V, { R, H, base, items: (o, RR, HH) => [...W.onHill(o, seed, n, RR * .95, minD, HH, draw), [999, () => after(o, HH)]] });
const braise = W.braise;
// スープ（深皿）
const zuppa = (p, c, items, o = {}) => W.soup(p, fondo(p), { c, drop: 4, glow: .35, gl: .5, items, oil: 6, oilC: OIL, ...o });
// オーブン皿（テラコッタ）: fill で中身を全面に
const baked = (p, fill, top = () => '', o = {}) => { const V = teglia(p, o); return V.s + `<g ${V.inside}>${fill(V.o, V)}</g>` + top(V.o, V); };
// 焼けたチーズの面
const gratin = (p, c = '#f2c860', seed = 'gr') => `<rect width="200" height="200" fill="${c}"/>` + W.flecks(p, 100, 96, 80, 80, seed, ['#d8902a', '#c8782a', '#f8e0a0', '#a8601e'], { ry: 46, s: 2.4 });

// =========================================================
// 品
// =========================================================
export default {
    // ---------- 主菜 ----------
    // 鶏むね肉のレモンソテー（スカロッピーネ）: 粉をはたいて焼き、レモンとバターのソース、イタリアンパセリ（お好みで）
    it_scaloppine: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 104, 110, 46, '#e8c060', 'sc') + byDepth([[-24, -14, -10, 1], [16, -6, 8, 2], [-6, 20, -4, 3]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => W.cutSlab(p, x, y, 28, 15, 4, '#e8c890', i, { rot: r, sear: '#c8903a' })]; })) + W.lemon(p, ...P(o, 34, 30), 20) + W.lemon(p, ...P(o, 46, 14), 18) + parsley(p, 96, 92, 42, 24, 'sc'); },
    // ミートボールのトマト煮（ポルペッテ）: 牛ひき肉・パン・卵・パルミジャーノの団子をトマトソースで、バジル（お好みで）（深皿）
    it_polpette: p => braise(p, fondo(p), SUGO, 'pl', 8, 22, 22, (x, y, r, i) => W.ball(p, x, y - 4, 24, '#9a5228', 'pl' + i, { hi: .6 }) + (i % 3 === 0 ? basil(p, x + 6, y - 14, 12, r, i) : ''), { srx: 62 }),
    // タラのミニトマトとオリーブ煮: タラの切り身、ミニトマト・黒オリーブ・ケッパー（お好みで）、イタリアンパセリ（深皿）
    it_merluzzo: p => W.soup(p, fondo(p), { c: '#d8603a', drop: 4, glow: .35, oil: 8, oilC: OIL, items: (pl, S) => [
        ...[[-14, -6, -8], [16, 8, -4]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => whiteFish(p, x, y, 40, 26, r, i, '#d8603a')]; }),
        ...W.spots('mzc', 6, 50, 15).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y + 1, () => cherry(p, x, y, 11, i % 2)]; }),
        ...W.spots('mzo', 6, 50, 12).map(([u, v]) => { const [x, y] = pl(u, v, 2); return [y + 1, () => olive(p, x, y, 7)]; }),
        ...W.spots('mzk', 6, 46, 10).map(([u, v]) => { const [x, y] = pl(u, v, 2); return [y + 1, () => caper(p, x, y)]; }),
        [999, () => parsley(p, S.cx, S.cy, 44, 26, 'mz')],
    ] }),
    // ズッキーニのフリッタータ: 卵・ズッキーニ・玉ねぎ・パルミジャーノを厚く焼き、切り分ける
    it_frittata: p => { const D = plate(p), o = D.o, x = 100, y = 98;
        return D.s + W.jeon(p, x, y, 60, 1, { c: '#f2c040', h: 9 }) + `<path d="M${x},${f(y)} L${f(x + 60)},${f(y - 6)} M${x},${f(y)} L${f(x - 20)},${f(y + 44)}" stroke="#c8902a" stroke-width="1.6" opacity=".7"/>` + byDepth(W.spots('ft', 12, 46, 14, { ry: 30 }).map(([u, v], i) => [y + v, () => W.coin(p, x + u, y + v * SYF - 1, 5, '#3f7a2a', { h: 1, top: Q.rg(p, [[0, '#f0f2c8'], [1, '#6a9a3a']], .4, .35, .8) })])) + W.flecks(p, x, y, 46, 30, 'ftc', ['#d8902a', '#fbecc0'], { ry: 30, s: 1.4 }) + Q.shine(76, 84, 22, -8, .7); },
    // ソーセージとじゃがいものオーブン焼き: イタリアのソーセージ・じゃがいも・赤玉ねぎ（お好みで）・ローズマリー（耐熱皿）
    it_salsiccia: p => baked(p, (o) => `<rect width="200" height="200" fill="#d8a858"/>` + byDepth(W.spots('sl', 16, 74, 16, { ry: 44 }).map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => i % 3 === 0 ? W.cutSlab(p, x, y, 22, 7, 7, '#a8502a', i, { rot: r, sear: '#5a2a10', jit: .04 }) : i % 5 === 4 ? W.onionStrip(x, y, 14, r, '#c87aa8') : roastPotato(p, x, y, 14, i)]; })) + [[-40, -10], [20, 14], [50, -20]].map(([u, v], i) => rosemary(...P(o, u, v), 22, i * 50)).join('')),
    // ミラノ風カツレツ（コトレッタ）: 薄い鶏むね肉に卵とパン粉（パルミジャーノ）をつけて揚げ焼き、レモン
    it_cotoletta: p => { const D = plate(p), o = D.o; const [x, y] = P(o, -6, 0); return D.s + W.crusty(p, x, y, 56, 36, 1, { c: '#d8a048', n: 60, h: 6 }) + W.lemon(p, ...P(o, 44, 34), 22, { wedge: true, rot: -20 }); },
    // 鶏の猟師風（カッチャトーラ）: 骨つきの鶏を玉ねぎとトマトで煮る、黒オリーブ（お好みで）、ローズマリー（深皿）
    it_cacciatora: p => braise(p, fondo(p), '#b83a1e', 'cc', 12, 15, 26, (x, y, r, i) => i % 4 === 3 ? olive(p, x, y, 8) : i % 6 === 5 ? W.onionStrip(x, y, 12, r) : Q.soakLump(p, x, y, 24, i, { c: '#c8783a', soak: '#a8341e', k: .5, sy: .72 })) ,
    // 牛肉とじゃがいもの煮込み（スペッツァティーノ）: 牛の角切り・じゃがいも・玉ねぎ・にんじん・セロリをトマトで煮込む（深皿）
    it_spezzatino: p => braise(p, fondo(p), '#8a3a1a', 'sz', 14, 14, 26, (x, y, r, i) => { const k = i % 4; return k < 2 ? W.dice(p, x, y, 14, '#6a3418', 'sz' + i, { h: 9, top: Q.rg(p, [[0, '#a86a42'], [.6, '#7a4224'], [1, '#5a2c14']], .4, .35, .8) }) : k === 2 ? Q.glossLump(p, x, y, 16, i, { c: '#e8c070' }) : (i % 8 === 3 ? celeryDice(p, x, y, 6, i) : carrotDice(p, x, y, 8, i)); }),
    // 牛肉のピッツァイオーラ: 牛の薄切りをトマトとオレガノで煮る、モッツァレラ（お好みで）
    it_pizzaiola: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 104, 108, 52, SUGO, 'pz') + byDepth([[-20, -12, -10, 1], [16, -2, 8, 2], [-4, 22, -4, 3]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => W.cutSlab(p, x, y, 28, 14, 3, '#8a4a2a', i, { rot: r }) + `<path d="${Q.blob(x, y - 3, 18, 7, 'pzs' + i)}" fill="#c8301e" opacity=".85"/>` + mozz(p, x + 2, y - 5, 9, 4, i)]; })) + W.flecks(p, 100, 92, 44, 30, 'pzo', ['#5a6a2a', '#3a4a1a'], { ry: 24, s: .9 }); },
    // 豚ロースの牛乳煮（マイアーレ・アル・ラッテ）: 豚ロースを牛乳とバターで煮て切り分け、ローズマリー（セージ）、牛乳のソース
    it_maialelatte: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 104, 112, 46, '#e8d0a0', 'ml') + byDepth([-36, -18, 0, 18, 36].map((u, i) => { const [x, y] = P(o, u, -u * .3); return [y, () => W.coin(p, x, y, 16, '#c8946a', { h: 7, sy: SYF, top: Q.rg(p, [[0, '#fbf2e8'], [.6, '#f0dcc8'], [.88, '#d8b090'], [1, '#a8784a']], .45, .4, .7) })]; })) + W.flecks(p, 100, 92, 40, 30, 'mlc', ['#f6eccc', '#c8a060'], { ry: 20, s: 1.6 }) + rosemary(...P(o, 30, 36), 24, -10); },
    // 子羊のローストとじゃがいも: 骨つきの子羊・じゃがいも・ローズマリー・にんにく、レモン（お好みで）（耐熱皿）
    it_agnello: p => baked(p, (o) => `<rect width="200" height="200" fill="#c8945a"/>` + byDepth(W.spots('ag', 14, 72, 18, { ry: 44 }).map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => i % 2 ? W.rib(p, x, y, 30, r, i, { c: '#8a4a28', glaze: '#c8783a' }) : roastPotato(p, x, y, 15, i)]; })) + [[-36, -14], [30, 10]].map(([u, v], i) => rosemary(...P(o, u, v), 24, i * 60)).join('') + W.lemon(p, ...P(o, 56, 24), 16, { wedge: true, rot: -10 })),
    // 鯛とじゃがいものオーブン焼き: 丸ごとの鯛・じゃがいもの薄切り・ミニトマト（お好みで）・レモン・イタリアンパセリ（耐熱皿）
    it_orata: p => baked(p, (o) => `<rect width="200" height="200" fill="#e8c890"/>` + byDepth(W.spots('or', 22, 76, 12, { ry: 46 }).map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.coin(p, x, y, 8, '#e0b060', { h: 2, top: Q.rg(p, [[0, '#fbe8b0'], [.7, '#f0c870'], [1, '#c8902a']], .4, .35, .8) })]; })) + W.wholeFish(p, 100, 96, 150, -4, 1, { skin: '#c8bca8', belly: '#f2ece0', char: .3, H: 24 }) + [[-40, 26], [36, 30]].map(([u, v]) => cherry(p, ...P(o, u, v), 11)).join('') + [[-20, -2], [10, 0]].map(([u, v]) => W.lemon(p, ...P(o, u, v, 8), 14)).join('') + parsley(p, 100, 90, 60, 30, 'or')),
    // コウイカとグリーンピースの煮込み: いか・グリーンピース・玉ねぎをトマトで煮る、イタリアンパセリ（深皿）
    it_seppie: p => braise(p, fondo(p), '#c8501e', 'sp', 24, 10, 20, (x, y, r, i) => i % 3 === 0 ? `<g ${T(x, y, r)}><rect x="-11" y="-4" width="22" height="8" rx="2" fill="${Q.lg(p, [[0, '#fbece0'], [1, '#e0b8a0']], 0, 0, 0, 1)}" stroke="#a8785a" stroke-width=".6"/></g>` : Q.pea(p, x, y, 3.4)) + parsley(p, 100, 82, 40, 24, 'sp'),
    // 煉獄の卵（ウオヴァ・アル・プルガトーリオ）: トマトソースに卵を落として煮る、バジル、パルミジャーノ（お好みで）、パン（深皿）
    it_purgatorio: p => W.soup(p, fondo(p), { c: SUGO, drop: 4, glow: .3, oil: 8, oilC: OIL, items: (pl, S) => [
        ...[[-22, -6], [18, -10], [0, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.friedEgg(p, x, y, 30, i, { sy: SYF, crisp: false })]; }),
        ...W.spots('pgb', 5, 48, 14).map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y + 2, () => basil(p, x, y, 12, r, i)]; }),
        [999, () => parm(p, S.cx, S.cy, 40, 30, 'pg') + toast(p, 158, 136, 34, 20)],
    ] }),
    // なすのパルミジャーナ: 揚げたなす・トマトソース・モッツァレラ・パルミジャーノを重ねて焼く、バジル（耐熱皿）
    it_parmigiana: p => baked(p, (o) => `<rect width="200" height="200" fill="#b8341e"/>` + byDepth(W.spots('pa', 14, 72, 18, { ry: 42 }).map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => eggplantSlice(p, x, y, 13, i) + mozz(p, x + 2, y - 3, 9, 4, i)]; })) + W.flecks(p, 100, 96, 80, 60, 'pac', ['#d8902a', '#f8e0a0'], { ry: 46, s: 1.8 }), (o) => [[-30, -14], [20, 6], [44, -16]].map(([u, v], i) => basil(p, ...P(o, u, v, 6), 14, i * 60, i)).join('')),
    // トスカーナの白いんげん豆とセージのトマト煮、ソーセージ（お好みで）（深皿）
    it_uccelletto: p => braise(p, fondo(p), '#b8501e', 'uc', 40, 7, 18, (x, y, r, i) => i % 9 === 4 ? W.cutSlab(p, x, y, 14, 6, 6, '#a8502a', i, { rot: r, sear: '#5a2a10' }) : i % 7 === 3 ? sage(p, x, y, 14, r, i) : Q.bean(p, x, y, 9, r, '#efe6d0')),

    // ---------- 副菜 ----------
    // ミックスサラダ: レタス・トマト・にんじん・フェンネル（お好みで）（白い鉢）
    it_insalata: p => heapBowl(p, bowl(p), 'in', 26, 12, 34, (x, y, r, i) => { const k = i % 6; return k < 3 ? (i % 2 ? W.standLeaf(p, x, y, 26, 18, r % 50 - 25, '#7ab848', i) : Q.leaf(p, x, y, 26, r, '#5a9a34', 'il' + i, { wave: 4 })) : k === 3 ? tomatoDice(p, x, y, 9, i) : k === 4 ? `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2" stroke-linecap="round"/>` : Q.prism(p, x, y, [[-6, -3], [6, -3], [6, 3], [-6, 3]], 2, '#e8f0c8', { rot: r, line: .4 }); }, { base: '#4a8a2c', R: 70 }),
    // カプレーゼ: トマトとモッツァレラを交互に並べ、バジル、オリーブ油、オレガノ（お好みで）
    it_caprese: p => { const D = plate(p), o = D.o; const it = []; for (let i = 0; i < 9; i++){ const a = i / 9 * 6.283, [x, y] = P(o, Math.cos(a) * 40, Math.sin(a) * 40, 2); it.push([y, () => (i % 2 ? W.coin(p, x, y, 14, '#c8281a', { h: 4, top: Q.rg(p, [[0, '#ff9a7a'], [.5, '#e8503a'], [.7, '#f6c050'], [1, '#c8301e']], .45, .4, .7) }) : W.coin(p, x, y, 14, '#e8e2d0', { h: 5, top: Q.rg(p, [[0, '#ffffff'], [.7, '#f8f2e2'], [1, '#e0d6c0']], .4, .35, .8) })) + (i % 3 === 0 ? basil(p, x + 2, y - 6, 14, i * 40, i) : '')]); }
        return D.s + byDepth(it) + basil(p, 100, 94, 20, 30, 9) + W.flecks(p, 100, 96, 50, 16, 'cpo', OIL, { ry: 30, s: 1.8 }); },
    // ズッキーニのにんにくとパセリ炒め
    it_zucchine: p => plateHeap(p, plate(p), 'zc', 24, 50, 11, 12, (x, y, r, i) => zucchiniRound(p, x, y, 8)) + parsley(p, 100, 90, 42, 26, 'zc'),
    // ほうれん草のソテー: にんにくとオリーブ油、唐辛子（お好みで）
    it_spinaci: p => plateHeap(p, plate(p), 'sn', 18, 46, 13, 14, (x, y, r, i) => Q.leaf(p, x, y, 24, r, i % 2 ? '#2f6a22' : '#3f7a2a', 'sn' + i, { wave: 2.4 })) + W.flecks(p, 100, 90, 40, 14, 'sng', ['#f4e8c8', '#c8281a'], { ry: 20, s: 1.4 }),
    // ペペロナータ: 赤と黄のパプリカ・玉ねぎ・トマトの煮込み（深皿）
    it_peperonata: p => braise(p, fondo(p), '#c8501e', 'pn', 24, 10, 20, (x, y, r, i) => i % 5 === 4 ? W.onionStrip(x, y, 14, r) : W.pepperStrip(p, x, y, 22, r, i % 2 ? '#d8302a' : '#f2b82a')),
    // いんげんのオリーブ油とレモン和え
    it_fagiolini: p => plateHeap(p, plate(p), 'fg', 22, 50, 9, 12, (x, y, r, i) => W.pod(p, x, y, 34, r)) + W.lemon(p, 148, 134, 18, { wedge: true, rot: -20 }) + W.flecks(p, 100, 92, 40, 12, 'fgo', OIL, { ry: 20, s: 1.6 }),
    // ブロッコリーのにんにくと唐辛子炒め
    it_broccoli: p => plateHeap(p, plate(p), 'br', 12, 48, 18, 12, (x, y, r, i) => W.broc(p, x, y, 28, i)) + W.flecks(p, 100, 90, 40, 16, 'brc', ['#f4e8c8', '#c8281a'], { ry: 20, s: 1.4 }),
    // フェンネルとオレンジのサラダ、黒オリーブ・赤玉ねぎ（お好みで）
    it_finocchiarance: p => { const D = plate(p), o = D.o; return D.s + byDepth(W.spots('fa', 14, 50, 15).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 2); return [y, () => i % 2 ? W.coin(p, x, y, 11, '#e8862a', { h: 2.4, top: Q.rg(p, [[0, '#ffc870'], [.7, '#f0902a'], [.9, '#fbe8c0'], [1, '#e8862a']], .4, .35, .8) }) : Q.prism(p, x, y, [[-11, -4], [11, -6], [10, 4], [-10, 5]], 2.4, '#e8f0d0', { rot: r, top: Q.lg(p, [[0, '#ffffff'], [1, '#d8e8b8']], 0, 0, 1, 1), line: .4 })]; })) + [[-20, -10], [26, 6], [0, 26]].map(([u, v]) => olive(p, ...P(o, u, v, 4), 8)).join('') + [[14, -20], [-30, 14]].map(([u, v], i) => W.onionStrip(...P(o, u, v, 4), 12, i * 60, '#c87aa8')).join(''); },
    // パンツァネッラ: 硬くなったパンとトマト・きゅうり・赤玉ねぎ・バジルを酢とオリーブ油で（白い鉢）
    it_panzanella: p => heapBowl(p, bowl(p), 'pz', 24, 12, 28, (x, y, r, i) => { const k = i % 5; return k === 0 ? W.dice(p, x, y, 12, '#d8a858', 'pzb' + i, { h: 9, top: Q.rg(p, [[0, '#f8e8c8'], [.7, '#e8c890'], [1, '#c8945a']], .4, .35, .8) }) : k === 1 ? tomatoDice(p, x, y, 11, i) : k === 2 ? W.coin(p, x, y, 6, '#3f7a2a', { h: 1.6, top: Q.rg(p, [[0, '#eef6d0'], [1, '#6a9a3a']], .4, .35, .8) }) : k === 3 ? W.onionStrip(x, y, 10, r, '#c87aa8') : basil(p, x, y, 13, r, i); }, { base: '#d8b070', R: 70 }),
    // ルッコラ・ミニトマト・パルミジャーノのサラダ、バルサミコ（レモン）
    it_rucola: p => { const D = plate(p), o = D.o; return plateHeap(p, D, 'rc', 26, 48, 9, 16, (x, y, r, i) => i % 6 === 5 ? cherry(p, x, y - 3, 11, true) : Q.leaf(p, x, y, 18, r, i % 2 ? '#3f7a2a' : '#5a9a34', 'rc' + i, { wave: 3.4 })) + W.spots('rcs', 7, 40, 14).map(([u, v, r]) => shaving(p, ...P(o, u, v, 16), 11, r)).join(''); },
    // ピンツィモーニオ: 生のにんじん・セロリ・フェンネル・パプリカ（お好みで）・きゅうり（お好みで）をオリーブ油につける
    it_pinzimonio: p => { const D = plate(p), o = D.o; const cols = ['#e8742a', '#9ac860', '#eef2d8', '#d8302a', '#3f7a2a', '#f2b82a'];
        const sticks = Array.from({ length: 14 }, (_, k) => { const [x, y] = P(o, -30 + (k % 7) * 9, -20 + Math.floor(k / 7) * 22); return [y, () => W.pod(p, x, y, 54, -20 + (k % 7) * 6, { c: cols[k % 6], w: 6 })]; });
        const [bx, by] = P(o, 40, 34); return D.s + byDepth(sticks) + `<ellipse cx="${f(bx)}" cy="${f(by + 3)}" rx="17" ry="${f(17 * SY)}" fill="#d8ccb8"/><ellipse cx="${f(bx)}" cy="${f(by)}" rx="17" ry="${f(17 * SY)}" fill="#f2ede2" stroke="#c8b89a" stroke-width=".8"/><ellipse cx="${f(bx)}" cy="${f(by)}" rx="14" ry="${f(14 * SY)}" fill="${Q.rg(p, [[0, '#f0d870'], [1, '#b8a030']], .4, .35, .8)}"/>` + W.flecks(p, bx, by, 10, 6, 'pzp', '#3a2414', { ry: 4, s: .7 }); },
    // にんじんのせん切りサラダ、レモン、イタリアンパセリ（お好みで）
    it_carote: p => W.inBowl(p, smallBowl(p), { R: 64, H: 28, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#f08a3a', '#e8742a', '#f8a858'], 'ct', { n: 160, L: 14, w: 2 })], [999, () => parsley(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'ct')]] }),
    // ボルロッティ豆と赤玉ねぎのサラダ、イタリアンパセリ、ツナ（お好みで）
    it_borlotti: p => heapBowl(p, smallBowl(p), 'bo', 46, 7, 24, (x, y, r, i) => i % 6 === 5 ? W.onionStrip(x, y, 10, r, '#c87aa8') : Q.bean(p, x, y, 9, r, '#c89a8a') + `<path d="M${f(x - 3)},${f(y - 1)} l3,1 l3,-1" stroke="#8a3a3a" stroke-width=".7" fill="none"/>`, { base: '#b8907a', after: (o, H) => parsley(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'bo') + Q.lump(p, o.cx + 14, o.cy - H * CZ - 2, 8, 5, '#e8c8a8', 'tn', { n: 8, jit: .4, hi: .4 }) }),
    // ズッキーニのスカペーチェ: 揚げたズッキーニを酢とミントでマリネ
    it_scapece: p => plateHeap(p, plate(p), 'sca', 20, 48, 12, 10, (x, y, r, i) => W.coin(p, x, y, 8, '#3a6a24', { h: 2, top: Q.rg(p, [[0, '#f2e4a0'], [.6, '#d8b858'], [.85, '#a8883a'], [1, '#3a6a24']], .4, .35, .8) }) + (i % 4 === 0 ? Q.leaf(p, x + 3, y - 4, 10, r, '#4a9a3a', 'mn' + i, { wave: .8 }) : '')),
    // 小玉ねぎの甘酢煮: 小玉ねぎをバターと砂糖・ワインビネガーで照りよく（小鉢）
    it_cipolline: p => heapBowl(p, smallBowl(p), 'ci', 16, 14, 22, (x, y, r, i) => Q.glossLump(p, x, y, 16, i, { c: '#c8823a' }), { base: '#8a4a1e' }),
    // マッシュルームのトリフォラーティ: にんにくとパセリで炒める
    it_funghitrifolati: p => plateHeap(p, plate(p), 'ft', 18, 48, 13, 12, (x, y, r, i) => W.mushSlice(p, x, y, 18, r % 60 - 30)) + parsley(p, 100, 90, 42, 30, 'ft'),
    // チコリのにんにくと唐辛子炒め
    it_cicoria: p => plateHeap(p, plate(p), 'cr', 26, 48, 10, 14, (x, y, r, i) => i % 2 ? W.pod(p, x, y, 24, r, { c: '#7aa848', w: 3 }) : Q.leaf(p, x, y, 22, r, '#3a6a2a', 'cr' + i, { wave: 3.4 })) + W.flecks(p, 100, 90, 40, 14, 'crc', ['#f4e8c8', '#c8281a'], { ry: 20, s: 1.4 }),
    // ローマ風アーティチョークの煮込み、ミント、イタリアンパセリ（深皿）
    it_carciofi: p => { const D = plate(p), o = D.o;
        const half = (x, y, r, i) => { const L = 52, Wd = 30, out = `M${f(-L / 2)},0 C${f(-L / 2)},${f(-Wd * .7)} ${f(L * .2)},${f(-Wd * .62)} ${f(L * .3)},${f(-Wd * .2)} L${f(L / 2 + 8)},-3 L${f(L / 2 + 8)},3 L${f(L * .3)},${f(Wd * .2)} C${f(L * .2)},${f(Wd * .62)} ${f(-L / 2)},${f(Wd * .7)} ${f(-L / 2)},0Z`;
            const heart = `M${f(-L * .36)},0 C${f(-L * .36)},${f(-Wd * .42)} ${f(L * .12)},${f(-Wd * .36)} ${f(L * .26)},0 C${f(L * .12)},${f(Wd * .36)} ${f(-L * .36)},${f(Wd * .42)} ${f(-L * .36)},0Z`;
            return Q.cast(p, x + 2, y + 4, 28, 8, .32) + `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r)}) scale(1 ${f(SYF * .95)})"><path d="${out}" transform="translate(0 4)" fill="#4a5a2a"/><path d="${out}" fill="${Q.lg(p, [[0, '#9aa860'], [.5, '#6a7a3a'], [1, '#7a4a5a']], 0, 0, 0, 1)}" stroke="#3a4420" stroke-width=".8"/><path d="${heart}" fill="${Q.rg(p, [[0, '#fbf2c8'], [.6, '#e8dc98'], [1, '#c8b868']], .4, .4, .8)}"/>${[-.24, -.12, 0, .12].map(k => `<path d="M${f(L * k)},${f(-Wd * .16)} Q${f(L * k + 4)},0 ${f(L * k)},${f(Wd * .16)}" stroke="#b8a058" stroke-width=".8" fill="none"/>`).join('')}${[-1, 1].map(sd => `<path d="M${f(-L * .42)},0 C${f(-L * .4)},${f(sd * Wd * .52)} ${f(L * .16)},${f(sd * Wd * .48)} ${f(L * .28)},${f(sd * Wd * .1)}" stroke="#8a5a6a" stroke-width="1.2" fill="none" opacity=".8"/>`).join('')}</g>` + Q.shine(x - 10, y - 10, 16, r, .7); };
        return D.s + W.pool(p, 104, 112, 30, '#c8b060', 'ca') + byDepth([[-16, -18, -20], [18, -8, 160], [-6, 22, -10]].map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => half(x, y, r, i)]; })) + W.flecks(p, 100, 92, 50, 30, 'cam', ['#3f8a2a', '#5aa83a'], { ry: 24, s: 1.4 }); },
    // カポナータ: 揚げたなす・セロリ・玉ねぎをトマトと甘酢で、グリーンオリーブ・ケッパー・松の実（お好みで）（小鉢）
    it_caponata: p => heapBowl(p, smallBowl(p), 'cp', 30, 10, 24, (x, y, r, i) => { const k = i % 5; return k < 2 ? W.dice(p, x, y, 11, '#5a2a4a', 'cpe' + i, { h: 7, top: Q.rg(p, [[0, '#e8b878'], [.6, '#c8864a'], [1, '#8a4a2a']], .4, .35, .8) }) : k === 2 ? celeryDice(p, x, y, 7, i) : k === 3 ? olive(p, x, y, 7, '#8a9a3a') : caper(p, x, y) + `<ellipse cx="${f(x + 4)}" cy="${f(y)}" rx="2" ry="1.2" fill="#f2e2b8"/>`; }, { base: '#b8501e' }),
    // グリーンピースとハムと玉ねぎの煮込み（小鉢）
    it_piselli: p => heapBowl(p, smallBowl(p), 'ps', 70, 6, 24, (x, y, r, i) => i % 6 === 5 ? W.hamDice(p, x, y, 6, i) : Q.pea(p, x, y, 3.4), { base: '#6a9a3a' }),
    // ちりめんキャベツの蒸し煮、玉ねぎ、パンチェッタ（お好みで）
    it_verza: p => plateHeap(p, plate(p), 'vz', 22, 48, 12, 14, (x, y, r, i) => i % 6 === 5 ? W.baconBit(p, x, y, 7, i) : Q.leaf(p, x, y, 22, r, i % 2 ? '#a8c870' : '#c8dc90', 'vz' + i, { wave: 4.4 })),
    // イタリアのマッシュポテト（ピュレ）: じゃがいも・牛乳・バター・パルミジャーノ、ナツメグ（小鉢）
    it_pure: p => W.inBowl(p, smallBowl(p), { R: 66, H: 30, items: (o, R, H) => [[0, () => W.cream(p, o.cx, o.cy + 4, R * .98, H, '#f6ecc8', 'pu', { ridges: 4 }) + W.butterPat(p, o.cx + 4, o.cy - H * CZ * .95, 9) + W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 14, 'pun', '#a8763a', { ry: 12, s: .8 })]] }),
    // ローズマリーのローストポテト、にんにく
    it_patatearrosto: p => plateHeap(p, plate(p), 'pa', 18, 48, 14, 12, (x, y, r, i) => roastPotato(p, x, y, 16, i)) + [[-30, -10], [24, 14], [0, -26]].map(([u, v], i) => rosemary(100 + u, 90 + v * .7, 22, i * 50)).join(''),
    // 焼き野菜のハーブオイル: なす・ズッキーニ・パプリカを焼いて、イタリアンパセリ（ミント）とオリーブ油
    it_grigliate: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-34, -18, 'e'], [0, -24, 'z'], [34, -16, 'p'], [-28, 10, 'z'], [6, 6, 'e'], [36, 14, 'y'], [-10, 34, 'p'], [24, 36, 'z']].map(([u, v, k], i) => { const [x, y] = P(o, u, v, 2); const c = k === 'e' ? '#e0b878' : k === 'z' ? '#d8e0a0' : k === 'p' ? '#d8302a' : '#f2b82a', rim = k === 'e' ? '#5a2a4a' : k === 'z' ? '#3f7a2a' : dk(c, .2); return [y, () => Q.prism(p, x, y, [[-18, -7], [18, -7], [18, 7], [-18, 7]], 2.4, rim, { rot: -14, top: c, line: .4 }) + `<g ${T(x, y - 2, -14)}>${[-10, -2, 6].map(u2 => `<path d="M${u2},-6 l5,12" stroke="#4a2410" stroke-width="2" opacity=".55"/>`).join('')}</g>`]; })) + parsley(p, 100, 90, 44, 28, 'gr') + W.flecks(p, 100, 92, 40, 12, 'gro', OIL, { ry: 22, s: 1.6 }); },
    // トマトのパン粉焼き: 半分に切ったトマトにハーブ入りのパン粉、パルミジャーノ（お好みで）
    it_pomodorigratinati: p => baked(p, (o) => `<rect width="200" height="200" fill="#c8501e" opacity=".5"/>` + byDepth([[-50, -18], [-16, -22], [18, -20], [52, -16], [-40, 16], [-4, 14], [32, 18]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.coin(p, x, y, 15, '#c8281a', { h: 10, sy: SYF, top: Q.rg(p, [[0, '#f2d088'], [.6, '#d8a050'], [1, '#a8601e']], .4, .35, .8) }) + W.flecks(p, x, y - 10, 12, 12, 'pg' + i, ['#3f7a2a', '#c8782a'], { ry: 7, s: 1.2 })]; }))),
    // カリフラワーのグラタン: パルミジャーノ・パン粉・バター、ベシャメル（お好みで）（耐熱皿）
    it_cavolfiore: p => baked(p, (o) => `<rect width="200" height="200" fill="#f2dca0"/>` + byDepth(W.spots('cv', 14, 72, 18, { ry: 42 }).map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.broc(p, x, y, 24, i, '#f2e8c8', { roast: .5 })]; })) + W.flecks(p, 100, 96, 80, 80, 'cvc', ['#d8902a', '#c8782a', '#f8e0a0'], { ry: 46, s: 2 })),
    // アスパラのバターとパルミジャーノ、目玉焼き（お好みで）
    it_asparagi: p => { const D = plate(p), o = D.o; return D.s + byDepth([-24, -16, -8, 0, 8, 16].map((v, i) => { const [x, y] = P(o, -4 + i * 2, v); return [y, () => W.asparagus(p, x, y, 96, -4 + i)]; })) + parm(p, 96, 92, 40, 40, 'as') + W.friedEgg(p, ...P(o, 20, 30), 40, 1, { sy: SYF }); },

    // ---------- 汁物 ----------
    // ミネストローネ: ズッキーニ・にんじん・セロリ・じゃがいも・玉ねぎ、白いんげん（お好みで）、パルミジャーノ（深皿）
    it_minestrone: p => zuppa(p, '#d8904a', (pl, S) => [...W.spots('mn', 24, 58, 9).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 5; return [y, () => k === 0 ? zucchiniRound(p, x, y, 5, '#d8904a') : k === 1 ? carrotDice(p, x, y, 6, i, '#d8904a') : k === 2 ? celeryDice(p, x, y, 5, i, '#d8904a') : k === 3 ? potatoDice(p, x, y, 8, i, '#d8904a') : Q.bean(p, x, y, 8, r, '#efe6d0')]; }), [999, () => parm(p, S.cx, S.cy, 30, 24, 'mn')]]),
    // パスタ・エ・ファジョーリ: ボルロッティ豆と小さなパスタのスープ、ローズマリー（深皿）
    it_pastafagioli: p => zuppa(p, '#a8643a', (pl, S) => [...W.spots('pf', 34, 58, 7).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => i % 3 === 0 ? ditali(p, x, y) : Q.bean(p, x, y, 8, r, '#c89a8a')]; }), [999, () => rosemary(S.cx + 14, S.cy - 6, 22, -10)]]),
    // ストラッチャテッラ: ブロードに卵とパルミジャーノを流し入れる、イタリアンパセリ（お好みで）（深皿）
    it_stracciatella: p => zuppa(p, '#ecd090', (pl, S) => [...W.spots('st', 7, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => Q.eggRibbon(p, x, y, 26, i)]; }), [999, () => parsley(p, S.cx, S.cy, 44, 20, 'st')]]),
    // トルテッリーニ・イン・ブロード: 肉のトルテッリーニを澄んだブロードで、パルミジャーノ（深皿）
    it_tortellinibrodo: p => zuppa(p, '#e8c070', (pl, S) => [...W.spots('tb', 12, 54, 14).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => tortellino(p, x, y, 14, r)]; }), [999, () => parm(p, S.cx, S.cy, 30, 24, 'tb')]]),
    // パスティーナ・イン・ブロード: 星形の小さなパスタと野菜のスープ、パルミジャーノ（深皿）
    it_pastinabrodo: p => zuppa(p, '#ecc87a', (pl, S) => [...W.spots('pb', 50, 60, 5).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => i % 6 === 5 ? carrotDice(p, x, y, 4, i) : star(x, y)]; }), [999, () => parm(p, S.cx, S.cy, 30, 20, 'pb')]]),
    // 鶏のブロードとゆで鶏: 骨つきの鶏・にんじん・セロリ・玉ねぎ、ミニトマト・小さなパスタ（お好みで）（深皿）
    it_brodopollo: p => zuppa(p, '#ecc870', (pl, S) => [...[[-20, -6], [18, -10]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.soakLump(p, x, y, 26, i, { c: '#efd8b0', soak: '#c8a060', k: .3, sy: .72 })]; }), ...W.spots('bpv', 10, 56, 13).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => i % 3 === 0 ? W.coin(p, x, y, 5, '#e8742a', { h: 2 }) : i % 3 === 1 ? celeryDice(p, x, y, 5, i, '#ecc870') : cherry(p, x, y, 8)]; }), ...W.spots('bps', 14, 54, 6).map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => star(x, y, 2.2)]; })], { oil: 10, oilC: '#f0c040' }),
    // リボッリータ: 白いんげん・黒キャベツ・じゃがいも・にんじん・セロリ・玉ねぎ・パンの濃いスープ（深皿）
    it_ribollita: p => zuppa(p, '#a87a3a', (pl, S) => [...W.spots('rb', 22, 58, 9).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 4; return [y, () => k === 0 ? Q.leaf(p, x, y, 18, r, '#2e4a22', 'rk' + i, { wave: 3 }) : k === 1 ? Q.bean(p, x, y, 8, r, '#efe6d0') : k === 2 ? W.dice(p, x, y, 9, '#c8a060', 'rbr' + i, { h: 4, sink: 1, liq: '#a87a3a' }) : carrotDice(p, x, y, 5, i, '#a87a3a')]; })], { glow: .25 }),
    // パッパ・アル・ポモドーロ: トマトとパンを煮くずした濃いスープ、バジル（深皿）
    it_pappapomodoro: p => zuppa(p, '#c8401e', (pl, S) => [...W.spots('pap', 16, 56, 10).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => `<path d="${Q.blob(x, y, 6, 3, 'pap' + i, { n: 8, jit: .4 })}" fill="#d8784a" opacity=".85"/>`]; }), ...[[-10, -4], [6, -8], [14, 4]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y + 1, () => basil(p, x, y, 14, i * 70, i)]; })], { glow: .25, oil: 12 }),
    // パッサテッリ: パン粉とパルミジャーノと卵の生地を押し出した短い麺をブロードで（深皿）
    it_passatelli: p => zuppa(p, '#e8c070', (pl, S) => [...W.spots('ps', 20, 56, 10).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => `<g ${T(x, y, r)}><path d="M-8,0 Q0,-2 8,1" stroke="#a87a3a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-8,-.6 Q0,-2.6 8,.4" stroke="#e0b870" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>`]; }), [999, () => parm(p, S.cx, S.cy, 30, 20, 'ps')]]),
    // レンズ豆のスープ、焼いたパン（お好みで）（深皿）
    it_lenticchie: p => zuppa(p, '#9a6232', (pl, S) => [...W.spots('le', 60, 60, 5).map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.6" fill="${Q.rg(p, [[0, '#c8945a'], [1, '#7a4a22']], .35, .3, .8)}" stroke="#5a3418" stroke-width=".3"/>`]; }), ...W.spots('lec', 6, 54, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => i % 2 ? carrotDice(p, x, y, 5, i) : celeryDice(p, x, y, 5, i)]; }), [999, () => toast(p, S.cx + 40, S.cy - 6, 30, 20)]]),
    // パスタ・エ・チェーチ: ひよこ豆と小さなパスタのスープ、ローズマリー（深皿）
    it_pastaceci: p => zuppa(p, '#d8a85a', (pl, S) => [...W.spots('pc', 36, 58, 7).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => i % 3 === 0 ? ditali(p, x, y) : Q.pea(p, x, y, 3.6, '#e8c890')]; }), [999, () => rosemary(S.cx + 16, S.cy - 6, 22, -10)]]),
    // かぼちゃのヴェッルタータ: かぼちゃ・じゃがいも・玉ねぎをなめらかに、パルミジャーノ（お好みで）（深皿）
    it_vellutatazucca: p => zuppa(p, '#f0a040', (pl, S) => [[999, () => Q.velvet(p, S, '#f0a040') + parm(p, S.cx, S.cy, 20, 20, 'vz') + W.flecks(p, S.cx, S.cy, 30, 10, 'vzp', '#3a2414', { ry: 12, s: .8 })]], { cream: '#fbf2e4' }),
    // じゃがいもとポロねぎのスープ、バター、パルミジャーノ（お好みで）（深皿）
    it_patateporri: p => zuppa(p, '#ece2bc', (pl, S) => [[999, () => Q.velvet(p, S, '#ece2bc') + byDepth([[-10, -4], [10, 4], [0, -10]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.coin(p, x, y, 5, '#9ac860', { h: 1.6, top: Q.rg(p, [[0, '#f2f6d8'], [1, '#9ac860']], .4, .35, .8) })]; })) + pepper(p, S.cx, S.cy, 30, 14, 'pp')]]),
    // ムール貝のトマトスープ（ズッパ・ディ・コッツェ）、イタリアンパセリ、焼いたパン（深皿）
    it_zuppacozze: p => zuppa(p, '#c8501e', (pl, S) => [...W.spots('zc', 13, 56, 13).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => mussel(p, x, y, 20, r)]; }), [999, () => parsley(p, S.cx, S.cy, 44, 24, 'zc') + toast(p, S.cx + 44, S.cy - 6, 30, 20)]]),
    // 家庭の魚のスープ: 白身魚・殻つきのえび・ムール貝（お好みで）・トマト、イタリアンパセリ、焼いたパン（深皿）
    it_zuppapesce: p => zuppa(p, '#c8581e', (pl, S) => [...[[-20, -6], [16, 10]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => whiteFish(p, x, y, 30, 18, i * 20 - 10, i, '#c8581e')]; }), ...[[22, -14, 20, 1], [-30, 14, -10, -1]].map(([u, v, r, fl]) => { const [x, y] = pl(u, v, 3); return [y + 2, () => Q.prawn3q(p, x, y, 26, r, fl)]; }), ...W.spots('zpm', 4, 54, 18).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => mussel(p, x, y, 18, r)]; }), [999, () => parsley(p, S.cx, S.cy, 44, 20, 'zp')]]),
    // 大麦とスペックのスープ: 押し麦・スペック・じゃがいも・にんじん・ポロねぎ・セロリ（深皿）
    it_orzo: p => zuppa(p, '#e0c890', (pl, S) => [...W.spots('oz', 40, 58, 6).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="1.6" fill="#f6ecd0" stroke="#d0bc90" stroke-width=".4"/>`]; }), ...W.spots('ozv', 14, 56, 11).map(([u, v], i) => { const [x, y] = pl(u, v); const k = i % 4; return [y + .5, () => k === 0 ? W.hamDice(p, x, y, 7, i) : k === 1 ? potatoDice(p, x, y, 8, i) : k === 2 ? carrotDice(p, x, y, 6, i) : celeryDice(p, x, y, 5, i)]; })]),
    // ナポリのパスタ・エ・パターテ: じゃがいもと混ぜたパスタの濃いスープ、ミニトマト（お好みで）、パルミジャーノ（深皿）
    it_pastapatate: p => zuppa(p, '#e8b860', (pl, S) => [...W.spots('pp', 22, 58, 9).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => i % 2 ? potatoDice(p, x, y, 9, i) : penne(p, x, y, 11, r, { w: 4 })]; }), ...W.spots('ppt', 4, 50, 18).map(([u, v]) => { const [x, y] = pl(u, v, 1); return [y, () => cherry(p, x, y, 9, true)]; }), [999, () => parm(p, S.cx, S.cy, 34, 24, 'pp')]]),
    // スペルト小麦（ファッロ）と野菜のスープ、パルミジャーノ（お好みで）（深皿）
    it_farro: p => zuppa(p, '#c8844a', (pl, S) => [...W.spots('fa', 46, 58, 6).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.5" fill="#d8b070" stroke="#a8803a" stroke-width=".4"/>`]; }), ...W.spots('fav', 12, 56, 12).map(([u, v], i) => { const [x, y] = pl(u, v); const k = i % 3; return [y + .5, () => k === 0 ? zucchiniRound(p, x, y, 5) : k === 1 ? carrotDice(p, x, y, 6, i) : celeryDice(p, x, y, 5, i)]; }), [999, () => parm(p, S.cx, S.cy, 30, 20, 'fa')]]),
    // 小さな肉団子のブロード、小さなパスタ・ほうれん草（お好みで）（深皿）
    it_polpettinebrodo: p => zuppa(p, '#e8c070', (pl, S) => [...W.spots('pb', 10, 54, 15).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.ball(p, x, y, 11, '#a86a3a', 'pb' + i)]; }), ...W.spots('pbs', 20, 56, 6).map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => star(x, y, 2.2)]; }), ...W.spots('pbg', 4, 54, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.leaf(p, x, y, 16, r, '#2f6a22', 'pbg' + i, { wave: 2 })]; })]),
    // マッシュルームのヴェッルタータ、イタリアンパセリ（お好みで）（深皿）
    it_vellutatafunghi: p => zuppa(p, '#c8a478', (pl, S) => [[999, () => Q.velvet(p, S, '#c8a478') + byDepth([[-14, -6, -20], [10, -10, 10], [16, 6, 40]].map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => W.mushSlice(p, x, y, 13, r)]; })) + parsley(p, S.cx, S.cy, 30, 16, 'vf')]]),
    // ズッパ・パヴェーゼ: バターで焼いたパンに卵を落とし、熱いブロードを注ぐ、パルミジャーノ（深皿）
    it_zuppapavese: p => zuppa(p, '#e8c070', (pl, S) => [...[[-22, -4], [22, -4]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.bread(p, x, y, 34, i * 10, { toast: .6, th: 5 }) + W.friedEgg(p, x, y - 6, 24, i, { crisp: false })]; }), [999, () => parm(p, S.cx, S.cy, 40, 30, 'zp')]], { oil: 0 }),
    // 野菜のパッサート: じゃがいも・にんじん・ズッキーニ・ポロねぎ・セロリをこした緑がかったスープ、パルミジャーノ（深皿）
    it_passatoverdure: p => zuppa(p, '#c8b860', (pl, S) => [[999, () => Q.velvet(p, S, '#c8b860') + parm(p, S.cx, S.cy, 26, 18, 'pv')]], { cream: null }),

    // ---------- 麺・ご飯もの ----------
    // スパゲッティ・アル・ポモドーロ: トマトソース、バジル、パルミジャーノ（お好みで）（深皿）
    it_pomodoro: p => pasta(p, { sauce: SUGO, items: (o, H) => [[o.cy, () => basil(p, o.cx + 4, o.cy - H * CZ * .8, 22, 30, 1) + basil(p, o.cx - 8, o.cy - H * CZ * .75, 18, 150, 2)]], after: (o, H) => parm(p, o.cx, o.cy - H * CZ * .5, 30, 20, 'po') }),
    // カルボナーラ: グアンチャーレ・卵黄・ペコリーノ、黒こしょう（深皿）
    it_carbonara: p => pasta(p, { c: '#f2d070', sauce: '#f6d878', sauceOp: .6, items: (o, H) => W.spots('cb', 10, 36, 12).map(([u, v], i) => { const [x, y] = P({ ...o, sy: SYF }, u, v, W.hill(u, v, 52, H) + 2); return [y, () => W.baconBit(p, x, y, 7, i)]; }), after: (o, H) => pepper(p, o.cx, o.cy - H * CZ * .5, 40, 50, 'cb') + parm(p, o.cx, o.cy - H * CZ * .5, 36, 30, 'cb') }),
    // タリアテッレのラグー: 牛と豚のひき肉と香味野菜をトマトで煮込んだソース、パルミジャーノ（深皿）
    it_ragu: p => pasta(p, { c: '#f2cc70', w: 4, n: 110, sauce: '#9a3a1e', items: (o, H) => [[o.cy, () => W.crumble(p, o.cx, o.cy - H * CZ * .55, 28, 12, 60, 'rg', { c: '#8a3a1e' })]], after: (o, H) => parm(p, o.cx, o.cy - H * CZ * .5, 30, 24, 'rg') }),
    // ブカティーニのアマトリチャーナ: グアンチャーレとトマト、ペコリーノ、唐辛子（深皿）
    it_amatriciana: p => pasta(p, { c: '#e8a050', w: 3.2, n: 120, sauce: '#c8401e', sauceOp: .7, items: (o, H) => W.spots('am', 10, 36, 12).map(([u, v], i) => { const [x, y] = P({ ...o, sy: SYF }, u, v, W.hill(u, v, 52, H) + 2); return [y, () => W.baconBit(p, x, y, 7, i)]; }), after: (o, H) => parm(p, o.cx, o.cy - H * CZ * .5, 34, 30, 'am') + W.flecks(p, o.cx, o.cy - H * CZ * .5, 30, 10, 'amc', '#a82014', { ry: 12, s: .8 }) }),
    // ジェノベーゼ（バジルのペスト）: トロフィエ、松の実・パルミジャーノ、じゃがいも・いんげん（お好みで）（深皿）
    it_pesto: p => pasta(p, { kind: 'trofie', c: '#8ab048', n: 60, H: 20, items: (o, H) => W.spots('pe', 8, 40, 14).map(([u, v, r], i) => { const [x, y] = P({ ...o, sy: SYF }, u, v, W.hill(u, v, 50, H) + 4); return [y, () => i % 2 ? potatoDice(p, x, y, 8, i) : W.pod(p, x, y, 16, r, { c: '#4a8a2a', w: 3 })]; }), after: (o, H) => basil(p, o.cx, o.cy - H * CZ - 4, 18, 40, 1) + W.flecks(p, o.cx, o.cy - H * CZ * .6, 30, 10, 'pin', '#f2e2b8', { ry: 12, s: 1.6, shape: 'seed' }) + parm(p, o.cx, o.cy - H * CZ * .6, 30, 20, 'pe') }),
    // ツナとトマトのペンネ、ケッパー（お好みで）、イタリアンパセリ（深皿）
    it_tonno: p => pasta(p, { kind: 'short', c: '#e8a858', n: 46, items: (o, H) => W.spots('tn', 9, 36, 13).map(([u, v], i) => { const [x, y] = P({ ...o, sy: SYF }, u, v, W.hill(u, v, 50, H) + 4); return [y, () => Q.lump(p, x, y, 6, 4, '#e8c8a8', 'tn' + i, { n: 8, jit: .4, hi: .4 })]; }), after: (o, H) => W.flecks(p, o.cx, o.cy - H * CZ * .6, 30, 8, 'tnk', '#7a8a3a', { ry: 12, s: 1.8 }) + parsley(p, o.cx, o.cy - H * CZ * .6, 36, 24, 'tn') }),
    // ボンゴレ: スパゲッティとあさり、にんにく・白ワイン・オリーブ油、イタリアンパセリ（深皿）
    it_vongole: p => pasta(p, { c: '#f2dc98', items: (o, H) => W.spots('vg', 10, 46, 15).map(([u, v, r]) => { const [x, y] = P({ ...o, sy: SYF }, u, v, W.hill(u, v, 52, H) + 3); return [y, () => Q.clam(p, x, y, 16, r)]; }), after: (o, H) => parsley(p, o.cx, o.cy - H * CZ * .5, 40, 30, 'vg') + W.flecks(p, o.cx, o.cy - H * CZ * .5, 30, 10, 'vgo', OIL, { ry: 14, s: 1.6 }) }),
    // パスタ・アッラ・ノルマ: 揚げたなすとトマトのリガトーニ、リコッタ・サラータ、バジル（深皿）
    it_norma: p => pasta(p, { kind: 'short', c: '#e8984a', n: 40, items: (o, H) => W.spots('nr', 9, 38, 13).map(([u, v], i) => { const [x, y] = P({ ...o, sy: SYF }, u, v, W.hill(u, v, 50, H) + 4); return [y, () => W.dice(p, x, y, 10, '#5a2a4a', 'ne' + i, { h: 6, top: Q.rg(p, [[0, '#e8b878'], [.6, '#c8864a'], [1, '#8a4a2a']], .4, .35, .8) })]; }), after: (o, H) => W.flecks(p, o.cx, o.cy - H * CZ * .7, 30, 50, 'nrr', ['#fbfaf2', '#f2eee0'], { ry: 12, s: 1.8 }) + basil(p, o.cx + 6, o.cy - H * CZ - 4, 18, 20, 1) }),
    // ニョッキのオーブン焼き（ソッレンティーナ）: トマト・モッツァレラ・パルミジャーノ、バジル（耐熱皿）
    it_gnocchi: p => baked(p, (o) => `<rect width="200" height="200" fill="#c8401e"/>` + byDepth(W.spots('gn', 34, 74, 11, { ry: 44 }).map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => gnocco(p, x, y, 13, r, i)]; })) + [[-40, -10], [-6, -20], [30, -6], [50, 20], [-24, 18], [10, 16]].map(([u, v], i) => mozz(p, ...P(o, u, v, 4), 14, 6, i)).join('') + W.flecks(p, 100, 96, 80, 40, 'gnc', ['#d8902a', '#f8e0a0'], { ry: 46, s: 1.6 }), (o) => [[-20, -12], [24, 8]].map(([u, v], i) => basil(p, ...P(o, u, v, 6), 14, i * 60, i)).join('')),
    // キノコのリゾット: 米・マッシュルーム（ポルチーニ）・玉ねぎ・バター・パルミジャーノ、イタリアンパセリ（お好みで）（深皿）
    it_risottofunghi: p => { const V = fondo(p), S = Q.surface(p, V, { drop: 2, c: '#e8d0a0', glow: .4 }), pl = (u, v, z = 0) => at(S.o, u, v, z);
        return V.s + S.s + W.porridge(p, S, 'rf', { c: '#efdcb0', n: 220 }) + `<g ${V.above}>${byDepth(W.spots('rfm', 10, 50, 14).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y, () => W.mushSlice(p, x, y, 14, r % 60 - 30)]; }))}${parsley(p, S.cx, S.cy, 40, 24, 'rf')}${parm(p, S.cx, S.cy, 30, 20, 'rf')}</g>` + V.shine(.5); },
    // ミラノ風リゾット: サフランの黄色い米・玉ねぎ・バター・パルミジャーノ（深皿）
    it_risottomilanese: p => { const V = fondo(p), S = Q.surface(p, V, { drop: 2, c: '#f2c040', glow: .45 });
        return V.s + S.s + W.porridge(p, S, 'rm', { c: '#f6c848', n: 240 }) + `<g ${V.above}>${parm(p, S.cx, S.cy, 36, 30, 'rm')}${W.butterPat(p, S.cx + 6, S.cy - 2, 9)}</g>` + V.shine(.5); },
    // アーリオ・オーリオ・ペペロンチーノ: スパゲッティ・にんにく・オリーブ油・唐辛子、イタリアンパセリ（深皿）
    it_aglioolio: p => pasta(p, { c: '#f2dc98', items: (o, H) => W.spots('ao', 10, 40, 10).map(([u, v, r]) => { const [x, y] = P({ ...o, sy: SYF }, u, v, W.hill(u, v, 52, H) + 3); return [y, () => W.coin(p, x, y, 3, '#e8c870', { h: 1, top: '#f6dca0' })]; }), after: (o, H) => parsley(p, o.cx, o.cy - H * CZ * .5, 40, 30, 'ao') + W.flecks(p, o.cx, o.cy - H * CZ * .5, 36, 14, 'aoc', '#c8281a', { ry: 14, s: 1.2 }) + W.flecks(p, o.cx, o.cy - H * CZ * .5, 30, 10, 'aoo', OIL, { ry: 14, s: 1.6 }) }),
    // カチョ・エ・ペペ: スパゲッティ（トンナレッリ）にペコリーノと黒こしょう（深皿）
    it_cacioepepe: p => pasta(p, { c: '#f2dc98', sauce: '#fbf2d8', sauceOp: .5, after: (o, H) => pepper(p, o.cx, o.cy - H * CZ * .5, 40, 70, 'cp') + parm(p, o.cx, o.cy - H * CZ * .5, 36, 50, 'cp') }),
};
