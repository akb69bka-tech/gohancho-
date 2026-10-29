// 中国（cn_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 炒め物・煮物は朱の縁の白い平皿、あんやたれの多い料理は中華の深皿、蒸し魚は楕円の皿、汁は朱の線の中華碗、
// 甘いスープ・かゆ・蒸し卵は白い碗、汁のある麺は大きな中華碗、冷菜は白い小皿。青は使わない（藍の染付は描かない）。
// 材料は gohancho/packs/cn.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, T, rng, smooth, lt, dk, mix, SY, CZ, SYF, SHADE, at, byDepth } = W;

// =========================================================
// 中国の器と部品
// =========================================================
const ZHU = '#b8402c', SOY = '#7a3a16', BRAISE = '#8a3a18', SESOIL = '#e8b040', CHILIOIL = '#d8401e';
const P = (o, u, v, z = 0) => at(o, u, v, z);
const plate = (p, o = {}) => Q.plate(p, { line: 'none', edge: ZHU, ...o });
const oval = (p, o = {}) => Q.ovalPlate(p, { rim: ZHU, rz: 70, h: 14, ...o });
const deep = (p, o = {}) => Q.fukazara(p, { line: ZHU, ...o });
const bowl = (p, o = {}) => Q.shiroBowl(p, { rim: ZHU, ...o });
const smallBowl = (p, o = {}) => W.sideBowl(p, { outer: '#f4f1ea', inner: '#fbf9f4', edge: ZHU, ...o });
// 細切り（肉・ピーマン・じゃがいも・たけのこ）: 細長い角柱
const shred = (p, x, y, L, rot, c, w = 2.4) => Q.prism(p, x, y, [[-L / 2, -w / 2], [L / 2, -w / 2], [L / 2, w / 2], [-L / 2, w / 2]], w * .8, c, { rot, line: .35, top: Q.lg(p, [[0, lt(c, .35)], [1, dk(c, .1)]], 0, 0, 0, 1) });
// 薄切り肉（炒め物）
const meat = (p, x, y, s, r, i, c = '#b0703e', fat = '#eac8a0') => Q.slice3q(p, x, y, s, r, { c, fat, seed: i, gloss: .7, char: false }, { sq: .5 });
// きくらげ（黒に近い焦げ茶の波打つかけら）
const muer = (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#3a2a22', 'me' + i, { wave: 4, vein: false });
// 青ねぎの斜め切り・小口切り
const scallion = (p, x, y, L, r) => `<g ${T(x, y, r)}><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#2f7a2a" stroke-width="3" stroke-linecap="round"/><path d="M${f(-L / 2 + 1)},-.6 L${f(L / 2 - 1)},-.6" stroke="#9ad070" stroke-width="1.2" stroke-linecap="round"/></g>`;
const negis = (pl, seed, n, R, c = '#4a9a2c') => W.spots(seed, n, R, 8).map(([u, v]) => { const [x, y] = pl(u, v); return [y + .1, () => Q.negi(null, x, y, 5, c)]; });
// 乾燥唐辛子（赤い細長いさや）
const driedChili = (p, x, y, L, r) => `<g ${T(x, y, r)}><path d="M${f(-L / 2)},0 Q0,-4 ${f(L / 2)},-1 Q0,3.4 ${f(-L / 2)},0Z" fill="${Q.lg(p, [[0, '#e8503a'], [1, '#9a1e10']], 0, 0, 0, 1)}" stroke="#7a1a0e" stroke-width=".5"/><path d="M${f(-L / 2)},0 l-3,-1" stroke="#5a7a2a" stroke-width="1.4" stroke-linecap="round"/><path d="M${f(-L / 4)},-1.2 L${f(L / 4)},-1.6" stroke="#ff9a7a" stroke-width=".8" opacity=".7"/></g>`;
// 花椒の粒・ピーナッツ
const peanut = (p, x, y, s, i) => Q.lump(p, x, y, s / 2, s * .36, '#d8a868', 'pn' + i + x, { n: 8, jit: .12, hi: .55 });
const redPeanut = (p, x, y, s, i) => Q.lump(p, x, y, s / 2, s * .38, '#9a3a24', 'rp' + i + x, { n: 8, jit: .1, hi: .65 });
// 卵の炒め（ふわふわの黄色い塊）
const eggBit = (p, x, y, s, i) => Q.lump(p, x, y, s / 2, s * .34, i % 2 ? '#f8d050' : '#f6e080', p.id + 'eb' + i, { n: 8, jit: .38, hi: .5, edge: '#d8a830' });
// トマトのくし切り（炒めて少しくずれた）
const tomatoW = (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, s * .2], [0, -s * .35], [s / 2, s * .2], [0, s * .32]], s * .4, '#c8301e', { rot: r, top: Q.rg(p, [[0, '#ff8a6a'], [.6, '#e0402a'], [1, '#a82a1a']], .4, .35, .8), line: .5 });
// 青梗菜・小松菜の株（白い茎と緑の葉）
function bokchoy(p, x, y, L, r, i, { stem = '#e8f0c8', leafC = '#3f7a2a' } = {}){
    return `<g ${T(x, y, r)}>${Q.cast(p, 0, 4, L * .5, 4, .3)}<path d="M${f(-L / 2)},-3 Q${f(-L * .1)},-6 ${f(L * .1)},-4 L${f(L * .1)},4 Q${f(-L * .1)},6 ${f(-L / 2)},3Z" fill="${Q.lg(p, [[0, lt(stem, .4)], [1, dk(stem, .15)]], 0, 0, 0, 1)}" stroke="${dk(stem, .3)}" stroke-width=".6"/><path d="M${f(L * .05)},-6 Q${f(L * .35)},-12 ${f(L / 2)},-2 Q${f(L * .4)},9 ${f(L * .05)},6Z" fill="${Q.lg(p, [[0, lt(leafC, .3)], [1, dk(leafC, .2)]], 0, 0, 1, 1)}" stroke="${dk(leafC, .35)}" stroke-width=".6"/><path d="M${f(L * .05)},0 Q${f(L * .3)},-1 ${f(L * .45)},-2" stroke="${lt(leafC, .45)}" stroke-width="1" fill="none"/></g>`;
}
// ピータン（くし切り: 琥珀色の白身と、灰緑の黄身）
const pidan = (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, s * .2], [0, -s * .38], [s / 2, s * .2], [0, s * .3]], s * .45, '#5a3a1a', { rot: r, top: Q.rg(p, [[0, '#6a7048'], [.35, '#4a5230'], [.45, '#7a4a1c'], [1, '#4a2a10']], .5, .45, .7), line: .5 });
// 豚バラの角煮（紅焼）: 皮・脂・赤身の層と照り
const porkCube = (p, x, y, s, r, i) => Q.prism(p, x, y, Q.square(s), s * .75, '#8a3a1a', { rot: r, top: Q.lg(p, [[0, '#c86a3a'], [.5, '#a84a22'], [1, '#7a2e10']], 0, 0, 1, 1), line: .6 }) + `<g ${T(x, y - s * .75 * CZ * .45, r * .2)}><path d="M${f(-s * .45)},${f(-s * .05)} L${f(s * .45)},${f(-s * .05)}" stroke="#f0c890" stroke-width="2.2" opacity=".8"/><path d="M${f(-s * .45)},${f(s * .15)} L${f(s * .45)},${f(s * .15)}" stroke="#e8b080" stroke-width="1.4" opacity=".7"/></g>` + Q.shine(x - s * .2, y - s * .75 * CZ - 2, s * .5, -8, .8);
// 骨つきの肉（スペアリブ・手羽中）: たれの照り
const glossRib = (p, x, y, s, r, i, c = '#8a3a18') => W.rib(p, x, y, s, r, i, { c, glaze: '#c8602a' }) + Q.shine(x - s * .15, y - s * .2, s * .4, -8, .8);
// 鶏肉のぶつ切り（煮込み）
const chicken = (p, x, y, s, i, c = '#c88a4a') => Q.soakLump(p, x, y, s, i, { c, soak: '#8a3a18', k: .5, sy: .72 });
// なす（皮つきの細長い切り身）
const eggplant = (p, x, y, L, r, i, c = '#c8945a') => `<g ${T(x, y, r)}><g transform="scale(1 ${f(SY * 1.4)})"><rect x="${f(-L / 2)}" y="-4" width="${f(L)}" height="8" rx="4" transform="translate(1.4 2.4)" fill="${SHADE}" opacity=".25"/><rect x="${f(-L / 2)}" y="-4" width="${f(L)}" height="8" rx="4" fill="${Q.lg(p, [[0, '#7a3a6a'], [.35, '#5a2a4a'], [.4, c], [1, dk(c, .3)]], 0, 0, 0, 1)}" stroke="#3a1a2a" stroke-width=".5"/></g></g>`;
// れんこんの輪切り
const lotus = (p, x, y, r, c = '#f2e8d0') => W.coin(p, x, y, r, dk(c, .1), { h: 3, top: Q.rg(p, [[0, lt(c, .4)], [.7, c], [1, dk(c, .15)]], .4, .35, .8) }) + [[0, 0], [-.45, -.1], [.45, -.1], [-.28, .4], [.28, .4], [0, -.48]].map(([dx, dy]) => `<ellipse cx="${f(x + dx * r)}" cy="${f(y - 3 * CZ + dy * r * SY)}" rx="${f(r * .14)}" ry="${f(r * .1)}" fill="${dk(c, .35)}"/>`).join('');
// 冬瓜（淡い緑の半透明の角）
const wintermelon = (p, x, y, s, i, liq = null) => W.dice(p, x, y, s, '#b8c890', 'wm' + i, { h: s * .5, sink: liq ? 2 : 0, liq, top: Q.rg(p, [[0, '#f4f6e0'], [.6, '#dce4b8'], [1, '#98b070']], .4, .35, .8) });
// えび（殻つき・ゆで）
const prawn = (p, x, y, s, r, fl = 1) => Q.prawn3q(p, x, y, s, r, fl);
// 餃子（ひだの三日月）
function jiaozi(p, x, y, s, r, i, { fried = false } = {}){
    const d = `M${f(-s / 2)},${f(s * .1)} Q${f(-s * .45)},${f(-s * .42)} 0,${f(-s * .45)} Q${f(s * .45)},${f(-s * .42)} ${f(s / 2)},${f(s * .1)} Q0,${f(s * .32)} ${f(-s / 2)},${f(s * .1)}Z`;
    return `<g ${T(x, y, r)}>${Q.cast(p, 0, s * .2, s * .5, s * .14, .3)}<path d="${d}" fill="${Q.rg(p, [[0, '#ffffff'], [.6, '#f4eedc'], [1, '#d8ccb0']], .4, .3, .8)}" stroke="#c8b898" stroke-width=".7"/>${[-.3, -.15, 0, .15, .3].map(k => `<path d="M${f(k * s)},${f(-s * .44)} q${f(s * .03)},${f(s * .1)} 0,${f(s * .18)}" stroke="#d8ccb0" stroke-width=".8" fill="none"/>`).join('')}<path d="M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .15)},${f(-s * .3)} ${f(s * .05)},${f(-s * .32)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".9"/></g>`;
}
// 汁物の器（朱の線の中華碗）
const soup = (p, c, items, o = {}) => W.soup(p, o.V ? o.V(p) : bowl(p), { c, drop: 10, glow: .35, gl: .55, items, ...o });
// 平皿の山
const plateHeap = W.plateHeap;
// 小鉢に山高
const heapBowl = (p, seed, n, minD, H, draw, { base = null, R = 64, after = () => '' } = {}) => W.inBowl(p, smallBowl(p), { R, H, base, items: (o, RR, HH) => [...W.onHill(o, seed, n, RR * .95, minD, HH, draw), [999, () => after(o, HH)]] });
// 深皿の煮込み（煮汁は中央に少し、具を山に）
const braise = W.braise;
// かゆ
function congee(p, seed, items = () => [], { c = '#f4ecd8' } = {}){
    const V = bowl(p, { rim: Q.RIM.hai }), S = Q.surface(p, V, { drop: 9, c, glow: .4 }), pl = (u, v, z = 0) => at(S.o, u, v, z);
    return V.s + S.s + W.porridge(p, S, seed, { c }) + `<g ${V.inside}>${byDepth(items(pl, S))}</g>` + Q.depthVeil(p, V, V.cy - V.iry, V.cy + V.iry) + V.shine(.5);
}

// =========================================================
// 品
// =========================================================
export default {
    // ---------- 主菜 ----------
    // トマトと卵の炒め: ふわふわの卵とくずれたトマト、青ねぎ（お好みで）
    cn_fanqie_chaodan: p => plateHeap(p, plate(p), 'fq', 22, 52, 13, 16, (x, y, r, i) => i % 2 ? tomatoW(p, x, y, 16, r, i) : eggBit(p, x, y, 20, i), { sauce: '#e05a30' }) + W.flecks(p, 100, 92, 40, 16, 'fqn', ['#4a9a2c', '#7ac050'], { ry: 20, s: 1.5 }),
    // 紅焼肉（豚バラの醤油煮）: 皮つきの豚バラを氷砂糖と醤油で照りよく煮る、青ねぎ
    cn_hongshaorou: p => plateHeap(p, plate(p), 'hs', 11, 44, 22, 12, (x, y, r, i) => porkCube(p, x, y, 22, r % 30 - 15, i), { sauce: BRAISE, sauceR: 52 }) + W.flecks(p, 100, 88, 36, 10, 'hsn', ['#4a9a2c', '#7ac050'], { ry: 16, s: 1.6 }),
    // 宮保鶏丁: 鶏の角切り・ピーナッツ・長ねぎ・乾燥唐辛子、花椒
    cn_gongbao_jiding: p => plateHeap(p, plate(p), 'gb', 34, 54, 9, 14, (x, y, r, i) => { const k = i % 5; return k < 2 ? W.dice(p, x, y, 10, '#c8803e', 'gb' + i, { h: 6, top: Q.rg(p, [[0, '#e8a868'], [.6, '#c8783a'], [1, '#9a4a1e']], .4, .35, .8) }) : k === 2 ? peanut(p, x, y, 8, i) : k === 3 ? driedChili(p, x, y, 14, r) : W.daepa(p, x, y, 9, r); }, { sauce: '#9a3a18' }) + W.flecks(p, 100, 92, 44, 14, 'gbs', '#6a2a14', { ry: 24, s: 1 }),
    // 魚香肉絲: 豚の細切り・きくらげ・にんじん・ピーマンを豆板醤の甘酸っぱいたれで
    cn_yuxiang_rousi: p => plateHeap(p, plate(p), 'yx', 44, 52, 8, 14, (x, y, r, i) => { const k = i % 4; return k < 2 ? shred(p, x, y, 22, r, '#b8603a', 3) : k === 2 ? (i % 8 === 2 ? muer(p, x, y, 14, r, i) : shred(p, x, y, 20, r, '#e8742a', 2.4)) : shred(p, x, y, 20, r, '#3f8a2a', 2.4); }, { sauce: '#b8401e' }),
    // 清蒸魚: 丸ごとのすずきを蒸し、生姜と青ねぎの細切り、熱した油と醤油（楕円の皿）
    cn_qingzheng_yu: p => { const D = oval(p, { rz: 66 }), o = D.o ?? { cx: 100, cy: D.cy, sy: SYF };
        return D.s + W.pool(p, 104, D.cy + 10, 44, '#a86a2a', 'qz') + W.wholeFish(p, 100, D.cy - 2, 160, -4, 1, { skin: '#c8c4b4', belly: '#f2ece0', char: 0, H: 26 }) + byDepth(W.spots('qzn', 16, 50, 7, { ry: 10 }).map(([u, v, r], i) => { const [x, y] = [100 + u, D.cy - 12 + v * .6]; return [y, () => i % 3 ? `<g ${T(x, y, r % 40 - 20)}><path d="M-8,0 L8,0" stroke="${i % 2 ? '#f6f2d8' : '#5aa83a'}" stroke-width="1.4" stroke-linecap="round"/></g>` : `<g ${T(x, y, r % 40 - 20)}><path d="M-7,0 L7,0" stroke="#e8c870" stroke-width="1.4" stroke-linecap="round"/></g>`]; })) + W.flecks(p, 100, D.cy - 8, 60, 10, 'qzo', SESOIL, { ry: 12, s: 1.8 }); },
    // 家常豆腐: 焼いた豆腐とピーマン・豚バラ（お好みで）・きくらげ（お好みで）を豆板醤で
    cn_jiachang_doufu: p => plateHeap(p, plate(p), 'jc', 18, 52, 13, 12, (x, y, r, i) => { const k = i % 4; return k < 2 ? Q.prism(p, x, y, [[-11, -9], [11, -9], [11, 9], [-11, 9]], 4, '#d89a48', { rot: r, top: Q.rg(p, [[0, '#f8dca0'], [.5, '#e8b060'], [1, '#c8823a']], .4, .35, .8), line: .5 }) : k === 2 ? W.pepperStrip(p, x, y, 12, r, '#3f8a2a') : i % 8 === 3 ? muer(p, x, y, 12, r, i) : meat(p, x, y, 16, r, i, '#c87a4a', '#f0d0b0'); }, { sauce: '#b8401e' }),
    // 青椒肉絲: 豚の細切りと長い青唐辛子の細切り
    cn_qingjiao_rousi: p => plateHeap(p, plate(p), 'qj', 46, 52, 8, 14, (x, y, r, i) => i % 2 ? shred(p, x, y, 24, r, '#b0703e', 3) : shred(p, x, y, 24, r, '#4a9a2c', 2.8), { sauce: '#8a4a1e' }),
    // 糖醋排骨: 短く切ったスペアリブを甘酢で照りよく
    cn_tangcu_paigu: p => plateHeap(p, plate(p), 'tc', 12, 46, 20, 14, (x, y, r, i) => glossRib(p, x, y, 22, r, i, '#9a3a18'), { sauce: '#a8401a', sauceR: 50 }) + W.sesame(p, 100, 88, 36, 20, 'tc'),
    // 麻婆豆腐: やわらかい豆腐と牛ひき肉を豆板醤・豆豉・花椒で、ねぎ（中華の深皿）
    cn_mapo_doufu: p => W.soup(p, deep(p), { c: '#b8301c', drop: 4, glow: .25, oil: 12, oilC: '#e8502a', items: (pl, S) => [
        ...W.spots('mp', 14, 56, 15).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.tofuBlock(p, x, y, 15, r, { liq: '#b8301c', sink: 3 })]; }),
        [S.cy, () => W.crumble(p, S.cx, S.cy + 2, S.rx * .7, S.rx * SYF * .5, 50, 'mpc', { c: '#7a3a1e' })],
        ...W.spots('mpn', 10, 52, 12).map(([u, v, r]) => { const [x, y] = pl(u, v, 3); return [y + 2, () => scallion(p, x, y, 8, r)]; }),
        [999, () => W.flecks(p, S.cx, S.cy, 50, 30, 'mph', ['#6a2a14', '#3a1a0a'], { ry: 24, s: .9 })],
    ] }),
    // コーラ手羽: 手羽中をコーラと醤油で照りよく煮る
    cn_kele_jichi: p => plateHeap(p, plate(p), 'kl', 10, 46, 22, 10, (x, y, r, i) => W.cutSlab(p, x, y, 13, 8, 6, '#8a4018', i, { rot: r, glaze: '#c8602a' }) + `<circle cx="${f(x + 10)}" cy="${f(y)}" r="2" fill="#f4ecd8"/>`, { sauce: '#7a3014', sauceR: 52 }) + W.sesame(p, 100, 88, 36, 16, 'kl'),
    // 土豆焼鶏: 鶏のぶつ切りとじゃがいも・にんじん（お好みで）・ピーマン（お好みで）を醤油と八角で煮る（深皿）
    cn_tudou_shaoji: p => braise(p, deep(p), '#8a4a1e', 'ts', 12, 15, 34, (x, y, r, i) => { const k = i % 4; return k < 2 ? chicken(p, x, y, 22, i) : k === 2 ? Q.glossLump(p, x, y, 17, i, { c: '#e8b860' }) : (i % 8 === 3 ? W.pepperStrip(p, x, y, 10, r, '#3f8a2a') : Q.rangiri(p, x, y, 12, r, '#e8682a', i)); }),
    // 紅焼帯魚: タチウオを焼いて醤油と黒酢で煮る、青ねぎ
    cn_hongshao_daiyu: p => { const D = oval(p), o = D.o ?? { cx: 100, cy: D.cy, sy: SYF };
        return D.s + W.pool(p, 104, D.cy + 8, 44, BRAISE, 'hd') + byDepth([[-50, -6], [-18, -12], [14, -6], [46, 0], [-34, 18], [0, 16], [32, 22]].map(([u, v], i) => { const [x, y] = [100 + u, D.cy + v]; return [y, () => Q.prism(p, x, y, [[-15, -11], [15, -11], [15, 11], [-15, 11]], 9, '#c8c0b0', { rot: -6, top: Q.lg(p, [[0, '#c87a40'], [.5, '#9a5022'], [1, '#6a3010']], 0, 0, 1, 1), line: .5 }) + Q.shine(x - 4, y - 8, 10, -8, .7)]; })) + W.flecks(p, 100, D.cy - 6, 50, 14, 'hdn', ['#4a9a2c', '#f2eed8'], { ry: 12, s: 1.6 }); },
    // 油燜大蝦: 殻つきのえびをケチャップと醤油で照りよく
    cn_youmen_daxia: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 104, 108, 46, '#c8401e', 'ym') + byDepth([[-30, -18, 10, 1], [10, -24, -10, -1], [36, -6, 20, 1], [-20, 8, -20, -1], [16, 14, 10, 1], [-38, 30, 0, 1], [30, 32, -10, -1]].map(([u, v, r, fl]) => { const [x, y] = P(o, u, v, 4); return [y, () => prawn(p, x, y, 30, r, fl)]; })) + W.flecks(p, 100, 92, 44, 12, 'ymn', ['#4a9a2c'], { ry: 22, s: 1.6 }); },
    // 蠔油牛肉: 牛肉の薄切りをオイスターソースで、玉ねぎ・ピーマン（お好みで）
    cn_haoyou_niurou: p => plateHeap(p, plate(p), 'hy', 26, 52, 11, 14, (x, y, r, i) => { const k = i % 4; return k < 2 ? meat(p, x, y, 22, r, i, '#6a3a1e', '#8a5a3a') : k === 2 ? W.onionStrip(x, y, 14, r) : W.pepperStrip(p, x, y, 12, r, i % 8 === 3 ? '#d8302a' : '#3f8a2a'); }, { sauce: '#5a2a12' }),
    // 土豆焼牛肉: 牛すね肉とじゃがいも・にんじん（お好みで）・トマト（お好みで）を醤油で煮込む（深皿）
    cn_tudou_niurou: p => braise(p, deep(p), '#7a3a18', 'tn', 12, 15, 34, (x, y, r, i) => { const k = i % 4; return k < 2 ? W.dice(p, x, y, 15, '#6a3418', 'tn' + i, { h: 10, top: Q.rg(p, [[0, '#a86a42'], [.6, '#7a4224'], [1, '#5a2c14']], .4, .35, .8) }) : k === 2 ? Q.glossLump(p, x, y, 17, i, { c: '#e8b860' }) : Q.rangiri(p, x, y, 12, r, '#e8682a', i); }),
    // 葱爆羊肉: 羊の薄切りと太い長ねぎを強火で炒める
    cn_congbao_yangrou: p => plateHeap(p, plate(p), 'cb', 30, 52, 10, 14, (x, y, r, i) => i % 2 ? meat(p, x, y, 20, r, i, '#8a4a2e', '#c8946a') : W.daepa(p, x, y, 14, r), { sauce: '#6a3014' }),
    // 肉末蒸蛋: 卵をぬるま湯で溶いてなめらかに蒸し、豚ひき肉のそぼろとねぎ、醤油（白い深皿）
    cn_roumo_zhengdan: p => { const V = deep(p, { line: Q.RIM.hai }), S = Q.surface(p, V, { drop: 4, c: '#f6d460', glow: .5, rimShade: .15 });
        return V.s + S.s + `<g ${S.inside}><path d="${Q.blob(S.cx + 4, S.cy + 4, 28, 12, 'rz')}" fill="#9a5a24" opacity=".55"/>${W.crumble(p, S.cx + 2, S.cy + 2, 26, 9, 46, 'rzc', { c: '#8a4a24' })}${W.flecks(p, S.cx, S.cy, 50, 16, 'rzn', ['#4a9a2c', '#7ac050'], { ry: 20, s: 1.5 })}</g>` + W.glint(p, S, .6) + V.shine(.5); },
    // 紅焼獅子頭: 大きな豚肉の団子を白菜の葉と煮る（深皿）
    cn_hongshao_shizitou: p => { const V = deep(p), S = Q.surface(p, V, { drop: 4, c: '#9a5024', glow: .3 }), pl = (u, v, z = 0) => at(S.o, u, v, z);
        const it = [[-24, 6, 'l'], [24, 10, 'l'], [0, -16, 'l'], [-20, -6, 'm'], [20, -4, 'm'], [0, 16, 'm']].map(([u, v, k], i) => { const [x, y] = pl(u, v, k === 'm' ? 2 : 0); return [y + (k === 'm' ? 10 : 0), () => k === 'l' ? Q.leaf(p, x, y, 46, i * 60, '#d8e4a8', 'sz' + i, { wave: 3 }) : W.ball(p, x, y - 6, 40, '#9a5228', 'sz' + i, { hi: .6 })]; });
        return V.s + S.s + `<g ${V.above}>${byDepth(it)}</g>` + W.flecks(p, 100, 84, 40, 10, 'szn', ['#4a9a2c'], { ry: 14, s: 1.6 }) + V.shine(.5); },
    // 豚肉と白菜の水餃子
    cn_zhurou_jiaozi: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-40, -22], [-12, -28], [16, -26], [42, -18], [-48, 6], [-18, 2], [12, 2], [42, 10], [-30, 32], [0, 30], [30, 36]].map(([u, v], i) => { const [x, y] = P(o, u, v, 4); return [y, () => jiaozi(p, x, y, 30, (i % 3 - 1) * 10, i)]; })); },
    // 紅焼茄子: 長なすを揚げて醤油とオイスターソースのあんで、ピーマン（お好みで）
    cn_hongshao_qiezi: p => plateHeap(p, plate(p), 'hq', 16, 50, 15, 14, (x, y, r, i) => i % 5 === 4 ? W.pepperStrip(p, x, y, 12, r, '#3f8a2a') : eggplant(p, x, y, 26, r, i), { sauce: '#7a3a18' }) + Q.shine(80, 82, 18, -8, .7),
    // 酸菜魚: 白身魚の切り身と高菜の漬物を辛く煮る、乾燥唐辛子と花椒（大きな中華碗）
    cn_suancaiyu: p => soup(p, '#e8d088', (pl, S) => [
        ...W.spots('scf', 10, 56, 17).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => `<path d="${Q.blob(x, y, 11, 6, 'scf' + i, { n: 10, jit: .3, rot: r })}" fill="${Q.rg(p, [[0, '#ffffff'], [.6, '#f6f0e2'], [1, '#e0d6c0']], .4, .35, .8)}" stroke="#d8ccb4" stroke-width=".5"/>`]; }),
        ...W.spots('scc', 8, 56, 14).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 16, r, '#9a9a4a', 'scc' + i, { wave: 2 })]; }),
        ...W.spots('scd', 9, 50, 12).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y + 1, () => driedChili(p, x, y, 12, r)]; }),
    ], { oil: 12, oilC: '#e8902a' }),
    // 回鍋肉: ゆでた豚バラを薄切りにして、ピーマン・青ねぎと豆板醤で炒める
    cn_huiguo_rou: p => plateHeap(p, plate(p), 'hg', 24, 52, 12, 14, (x, y, r, i) => i % 3 === 2 ? W.pepperStrip(p, x, y, 14, r, '#3f8a2a') : i % 6 === 1 ? W.daepa(p, x, y, 11, r) : meat(p, x, y, 24, r, i, '#c8603a', '#f0c8a0'), { sauce: '#b8401e' }),
    // 魚香茄子: なすと豚ひき肉を豆板醤と黒酢の甘酸っぱいたれで、ねぎ（中華の深皿）
    cn_yuxiang_qiezi: p => braise(p, deep(p), '#b8401e', 'yq', 14, 14, 26, (x, y, r, i) => eggplant(p, x, y, 24, r, i), { srx: 60 }) + W.crumble(p, 100, 84, 30, 10, 30, 'yqc', { c: '#8a4a24' }) + W.flecks(p, 100, 82, 36, 14, 'yqn', ['#4a9a2c', '#7ac050'], { ry: 14, s: 1.6 }),
    // 螞蟻上樹: 春雨と豚ひき肉を豆板醤で炒め煮、青ねぎ
    cn_mayi_shangshu: p => { const D = plate(p); return D.s + W.noodleMound(p, 100, 104, 58, 20, '#c8945a', 'my', { w: 1.6, n: 170, len: 34, sy: SYF, edge: '#8a5a2a' }) + W.crumble(p, 100, 92, 40, 16, 60, 'myc', { c: '#7a3a1e' }) + W.flecks(p, 100, 90, 40, 18, 'myn', ['#4a9a2c', '#7ac050'], { ry: 16, s: 1.6 }) + Q.shine(78, 84, 16, -8, .7); },

    // ---------- 副菜 ----------
    // 蒜蓉青菜: 青梗菜をにんにくで炒める、オイスターソース（お好みで）
    cn_suanrong_qingcai: p => plateHeap(p, plate(p), 'sq', 9, 46, 22, 10, (x, y, r, i) => bokchoy(p, x, y, 46, (i % 2 ? 160 : -20) + (r % 30 - 15), i), { sauce: '#c8a050', sauceR: 40 }) + W.flecks(p, 100, 92, 40, 14, 'sqg', ['#f6eccc', '#e8d8a0'], { ry: 20, s: 1.5 }),
    // 酸辣土豆絲: じゃがいもの細切りを酢と唐辛子で炒める、ピーマン（お好みで）
    cn_suanla_tudousi: p => plateHeap(p, plate(p), 'tds', 70, 50, 6, 14, (x, y, r, i) => i % 9 === 4 ? driedChili(p, x, y, 12, r) : i % 7 === 3 ? shred(p, x, y, 16, r, '#4a9a2c', 1.8) : shred(p, x, y, 20, r, '#f2e2a8', 2)),
    // 地三鮮: なす・じゃがいも・ピーマンを揚げて醤油のあんで
    cn_disanxian: p => plateHeap(p, plate(p), 'ds', 20, 50, 13, 14, (x, y, r, i) => { const k = i % 3; return k === 0 ? eggplant(p, x, y, 18, r, i) : k === 1 ? W.dice(p, x, y, 13, '#d8a050', 'dsp' + i, { h: 8, top: Q.rg(p, [[0, '#fbe4a8'], [.6, '#e8b860'], [1, '#c8822a']], .4, .35, .8) }) : Q.prism(p, x, y, [[-8, -6], [8, -7], [7, 6], [-7, 6]], 2.4, '#3f8a2a', { rot: r, line: .45 }); }, { sauce: '#8a4a1e' }),
    // 涼拌木耳: きくらげを黒酢とにんにくで和える、香菜、赤唐辛子（お好みで）
    cn_liangban_muer: p => heapBowl(p, 'lm', 18, 13, 26, (x, y, r, i) => muer(p, x, y, 18, r, i), { base: '#3a2a22', after: (o, H) => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 16, 'lmc', ['#4a9a2c', '#d8281a', '#f4e8c8'], { ry: 12, s: 1.6 }) }),
    // 芹菜香干: セロリと燻製の押し豆腐の細切り、にんじん（お好みで）
    cn_qincai_xianggan: p => plateHeap(p, plate(p), 'qx', 50, 50, 7, 12, (x, y, r, i) => i % 3 === 0 ? shred(p, x, y, 18, r, '#8a5a32', 3) : i % 7 === 4 ? shred(p, x, y, 14, r, '#e8742a', 1.8) : shred(p, x, y, 18, r, '#8ac050', 2.4)),
    // 皮蛋豆腐: 絹豆腐にピータンをのせ、醤油と黒酢のたれ、青ねぎ（白い平皿）
    cn_pidan_doufu: p => { const D = plate(p), o = D.o; const [x, y] = P(o, 0, 4);
        return D.s + W.pool(p, x + 4, y + 8, 46, '#7a3a16', 'pd') + Q.prism(p, x, y, [[-34, -22], [34, -22], [34, 22], [-34, 22]], 18, '#f6f2e6', { top: Q.lg(p, [[0, '#ffffff'], [1, '#f2ecdc']], 0, 0, 1, 1), line: .6 }) + byDepth([[-18, -6, 20], [2, -10, -30], [20, -4, 60], [-6, 8, 140], [16, 10, 200]].map(([u, v, r]) => { const xx = x + u, yy = y - 18 * CZ + v * SY; return [yy, () => pidan(p, xx, yy, 16, r)]; })) + W.flecks(p, x, y - 16, 30, 18, 'pdn', ['#4a9a2c', '#7ac050', '#c8281a'], { ry: 10, s: 1.6 }); },
    // 拍黄瓜: たたいたきゅうりをにんにく・黒酢・ごま油で、赤唐辛子（お好みで）
    cn_paihuanggua: p => heapBowl(p, 'ph', 18, 13, 24, (x, y, r, i) => W.flat(p, x, y, W.K.cucumberChunk(p, 0, 0, 16, r, { seed: i }), { sq: .7, th: 2, tc: '#2a5a1e' }), { after: (o, H) => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 18, 'phg', ['#f4e8c8', '#d8281a'], { ry: 12, s: 1.4 }) }),
    // 涼拌菠菜: ゆでたほうれん草を黒酢とにんにくで、ピーナッツ（お好みで）、ごま
    cn_liangban_bocai: p => W.inBowl(p, smallBowl(p), { R: 64, H: 28, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#3f7a2a', '#2f6a22', '#5a9a3a'], 'lb', { n: 120, L: 16, w: 3 })], ...W.onHill(o, 'lbp', 10, R * .8, 14, H, (x, y, r, i) => peanut(p, x, y, 7, i), { lift: 2 }), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 24, 'lb')]] }),
    // 涼拌腐竹: 戻した湯葉の棒をにんにくと酢で、きゅうり・にんじん（お好みで）
    cn_liangban_fuzhu: p => heapBowl(p, 'fz', 26, 10, 24, (x, y, r, i) => i % 5 === 3 ? shred(p, x, y, 14, r, '#e8742a', 1.8) : i % 5 === 4 ? shred(p, x, y, 14, r, '#4a8a2a', 2) : Q.prism(p, x, y, [[-11, -2.6], [11, -3], [11, 2.6], [-11, 3]], 3, '#e8c880', { rot: r, top: Q.lg(p, [[0, '#fbecc0'], [1, '#d8b060']], 0, 0, 0, 1), line: .4 }), { after: (o, H) => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 16, 'fzc', ['#d8281a', '#f4e8c8'], { ry: 12, s: 1.2 }) }),
    // 涼拌海帯絲: 細切りの昆布を酢とにんにくで、にんじん・香菜（お好みで）
    cn_liangban_haidaisi: p => W.inBowl(p, smallBowl(p), { R: 64, H: 28, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#3a4a22', '#4a5a2a', '#2e3a1a'], 'hd', { n: 120, L: 18, w: 2.6 })], ...W.onHill(o, 'hdc', 10, R * .85, 14, H, (x, y, r) => `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2" stroke-linecap="round"/>`, { lift: 1 }), [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 14, 'hdx', ['#5aa83a', '#f4e8c8', '#d8281a'], { ry: 12, s: 1.4 })]] }),
    // 糖醋蘿蔔: 大根を甘酢に漬ける、赤唐辛子（お好みで）
    cn_tangcu_luobo: p => heapBowl(p, 'tl', 20, 12, 22, (x, y, r, i) => Q.prism(p, x, y, [[-9, -4], [9, -4], [9, 4], [-9, 4]], 7, '#f2ecd8', { rot: r, top: Q.lg(p, [[0, '#ffffff'], [1, '#f0e8cc']], 0, 0, 1, 1), line: .45 }), { after: (o, H) => [[-14, -2], [10, 4]].map(([u, v]) => W.chiliRing(o.cx + u, o.cy - H * CZ + v, 3, '#c8281a')).join('') }),
    // 醋溜白菜: 白菜の茎を黒酢で炒める、乾燥唐辛子（お好みで）
    cn_culiu_baicai: p => plateHeap(p, plate(p), 'cl', 22, 52, 12, 12, (x, y, r, i) => i % 7 === 3 ? driedChili(p, x, y, 12, r) : Q.prism(p, x, y, [[-12, -5], [12, -6], [11, 5], [-11, 6]], 3, '#ecefd0', { rot: r, top: Q.lg(p, [[0, '#ffffff'], [.6, '#f0f2d8'], [1, '#c8d898']], 0, 0, 1, 1), line: .45 }), { sauce: '#b8823a' }),
    // 蠔油生菜: レタスをさっとゆでて、オイスターソースのあんとにんにく
    cn_haoyou_shengcai: p => plateHeap(p, plate(p), 'hs', 12, 48, 18, 10, (x, y, r, i) => Q.leaf(p, x, y, 36, r, i % 2 ? '#9ac860' : '#c8e090', 'hs' + i, { wave: 4 }), { sauce: '#7a3a18', sauceR: 44 }) + Q.shine(80, 82, 18, -8, .8) + W.flecks(p, 100, 90, 30, 12, 'hsg', ['#f6eccc'], { ry: 14, s: 1.5 }),
    // 乾煸豆角: いんげんを油でしわしわに炒め、豚ひき肉・ザーサイ（お好みで）・乾燥唐辛子
    cn_ganbian_doujiao: p => plateHeap(p, plate(p), 'gd', 28, 52, 9, 12, (x, y, r, i) => i % 7 === 3 ? driedChili(p, x, y, 12, r) : W.pod(p, x, y, 30, r, { c: '#5a8a2a', w: 4.6 }) + `<path d="M${f(x - 6)},${f(y - 1)} l3,1 l3,-1 l3,1" stroke="#3a5a1a" stroke-width=".6" fill="none" opacity=".6"/>`) + W.crumble(p, 100, 92, 34, 14, 30, 'gdc', { c: '#8a4a24' }),
    // 手撕包菜: 手でちぎったキャベツを黒酢で炒める、豚バラ（お好みで）・乾燥唐辛子
    cn_shousi_baocai: p => plateHeap(p, plate(p), 'ss', 20, 52, 13, 14, (x, y, r, i) => i % 6 === 3 ? driedChili(p, x, y, 12, r) : i % 7 === 5 ? meat(p, x, y, 16, r, i, '#c8703a', '#f2d4b0') : Q.leaf(p, x, y, 22, r, i % 2 ? '#d8e8a8' : '#b8d888', 'ss' + i, { wave: 3 }), { sauce: '#a8742a' }),
    // 韮菜炒蛋: ニラと卵の炒め物
    cn_jiucai_jidan: p => plateHeap(p, plate(p), 'jj', 34, 52, 10, 14, (x, y, r, i) => i % 2 ? eggBit(p, x, y, 16, i) : W.pod(p, x, y, 20, r, { c: '#3f8a2a', w: 2.6 })),
    // 蒜蓉西蘭花: ブロッコリーをにんにくで炒めてあんをからめる、にんじん（お好みで）
    cn_suanrong_xilanhua: p => plateHeap(p, plate(p), 'sx', 14, 50, 17, 12, (x, y, r, i) => i % 5 === 4 ? W.coin(p, x, y, 6, '#e8742a', { h: 2 }) : W.broc(p, x, y, 26, i), { sauce: '#d8b060', sauceR: 44 }) + W.flecks(p, 100, 90, 40, 14, 'sxg', ['#f6eccc'], { ry: 20, s: 1.5 }),
    // 紅焼冬瓜: 冬瓜を醤油で煮る、青ねぎ
    cn_hongshao_donggua: p => plateHeap(p, plate(p), 'hdg', 14, 46, 18, 10, (x, y, r, i) => W.dice(p, x, y, 18, '#7a9a4a', 'hd' + i, { h: 11, top: Q.rg(p, [[0, '#e0c890'], [.6, '#c09050'], [1, '#8a5a2a']], .4, .35, .8) }) + Q.shine(x - 4, y - 12, 8, -8, .7), { sauce: BRAISE }) + W.flecks(p, 100, 88, 36, 12, 'hdn', ['#4a9a2c'], { ry: 16, s: 1.6 }),
    // 油燜筍: 春のたけのこを醤油と砂糖で照りよく煮る
    cn_youmen_sun: p => plateHeap(p, plate(p), 'yms', 16, 48, 15, 12, (x, y, r, i) => Q.prism(p, x, y, [[-12, -5], [12, -3], [12, 4], [-12, 5]], 7, '#c8823a', { rot: r, top: Q.lg(p, [[0, '#f0c070'], [.5, '#c8823a'], [1, '#8a4a1a']], 0, 0, 1, 1), line: .5 }) + `<path d="M${f(x - 8)},${f(y - 6)} l16,1" stroke="#f8dca0" stroke-width=".8" opacity=".7"/>`, { sauce: '#8a4a1a' }) + Q.shine(80, 84, 18, -8, .8),
    // 上湯娃娃菜: ミニ白菜を鶏のスープで煮て、ピータン・中国ハム（お好みで）、にんにく（深皿）
    cn_shangtang_wawacai: p => W.soup(p, deep(p), { c: '#f2e2b0', drop: 4, glow: .45, items: (pl, S) => [
        ...[[-30, -10, -20], [0, -14, 0], [30, -8, 20], [-16, 12, -10], [18, 14, 10]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => bokchoy(p, x, y, 40, 90 + r, i, { stem: '#f2f4d8', leafC: '#a8c870' })]; }),
        ...W.spots('wwp', 5, 50, 18).map(([u, v, r]) => { const [x, y] = pl(u, v, 3); return [y + 2, () => pidan(p, x, y, 10, r)]; }),
        ...W.spots('wwh', 8, 52, 12).map(([u, v], i) => { const [x, y] = pl(u, v, 3); return [y + 2, () => W.dice(p, x, y, 5, '#e88a7a', 'wh' + i, { h: 2.4 })]; }),
        [999, () => W.flecks(p, S.cx, S.cy, 50, 14, 'wwg', ['#f6eccc', '#e8c870'], { ry: 20, s: 1.4 })],
    ] }),
    // 白菜燉粉条: 白菜と太い春雨を豚バラ（お好みで）と煮る（深皿）
    cn_baicai_dun_fentiao: p => W.soup(p, deep(p), { c: '#c8904a', drop: 4, glow: .35, items: (pl, S) => [
        [S.cy - 1, () => W.noodleMound(p, S.cx, S.cy + 2, S.rx * .8, 0, '#b88a5a', 'fd', { w: 3.4, n: 40, len: 40, sy: SYF, flat: true, edge: '#7a4a2a' })],
        ...W.spots('fdc', 10, 54, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => Q.leaf(p, x, y, 22, r, i % 2 ? '#e8ecc8' : '#c8d898', 'fd' + i, { wave: 3 })]; }),
        ...W.spots('fdp', 4, 46, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y + 2, () => meat(p, x, y, 16, r, i, '#c8804a', '#f2d4b0')]; }),
    ] }),
    // 白灼菜心: 菜心をゆでて、醤油だれと熱した油（にんにく）
    cn_baizhuo_caixin: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 104, 110, 44, '#7a3a16', 'bz') + byDepth([-30, -18, -6, 6, 18, 30].map((v, i) => { const [x, y] = P(o, (i % 2 ? 4 : -4), v, 6); return [y, () => bokchoy(p, x, y, 100, -6, i, { stem: '#b8d880', leafC: '#3a7a2a' })]; })) + W.flecks(p, 100, 90, 40, 12, 'bzg', ['#f6eccc'], { ry: 20, s: 1.5 }); },
    // 虎皮青椒: 長い青唐辛子を焼いて皮を虎模様に、醤油と黒酢
    cn_hupi_qingjiao: p => plateHeap(p, plate(p), 'hp', 9, 46, 20, 10, (x, y, r, i) => W.pod(p, x, y, 52, r % 60 - 30, { c: '#4a8a2a', w: 9, tip: '#5a7a2a' }) + `<g ${T(x, y, r % 60 - 30)}>${[-14, -2, 10].map(u => `<ellipse cx="${u}" cy="-1" rx="5" ry="2.6" fill="#5a3a14" opacity=".55"/>`).join('')}</g>`, { sauce: '#7a3a16' }),
    // 清炒藕片: れんこんの薄切りを白酢と塩で炒める、赤唐辛子（お好みで）
    cn_qingchao_oupian: p => plateHeap(p, plate(p), 'op', 13, 48, 18, 10, (x, y) => lotus(p, x, y, 13)) + W.flecks(p, 100, 92, 40, 14, 'opc', ['#d8281a', '#4a9a2c'], { ry: 20, s: 1.5 }),
    // 油炸花生: 皮つきのピーナッツを油で揚げて塩
    cn_youzha_huasheng: p => heapBowl(p, 'hs', 60, 7, 22, (x, y, r, i) => redPeanut(p, x, y, 9, i), { base: '#8a3a24', after: (o, H) => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'hss', '#fbf6ea', { ry: 12, s: .8 }) }),
    // 肉末酸豆角: 漬けたささげと豚ひき肉を炒める、赤唐辛子（お好みで）
    cn_roumo_suandoujiao: p => plateHeap(p, plate(p), 'sd', 80, 50, 5, 12, (x, y, r, i) => i % 4 === 0 ? `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="#8a4a24"/>` : i % 9 === 1 ? W.chiliRing(x, y, 2.6, '#c8281a') : W.coin(p, x, y, 3, '#7a8a3a', { h: 3, top: Q.rg(p, [[0, '#d8dca0'], [1, '#8a9a4a']], .4, .35, .8) })),

    // ---------- 汁物 ----------
    // 紫菜蛋花湯: 干しのり（紫菜）と溶き卵、干しえび（お好みで）、青ねぎ
    cn_zicai_danhua: p => soup(p, '#e8d49a', (pl, S) => [
        ...W.spots('zc', 9, 56, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 22, r, '#3a2a2e', 'zc' + i, { wave: 4, vein: false, op: .9 })]; }),
        ...[[-20, -8], [14, 6], [30, -12]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => Q.eggRibbon(p, x, y, 26, i)]; }),
        ...W.spots('zcx', 6, 50, 14).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => W.shrimp(p, x, y, 6, i * 50)]; }),
        ...negis(pl, 'zcn', 8, 56),
    ], { oil: 4, oilC: SESOIL }),
    // 冬瓜排骨湯: 豚スペアリブと冬瓜のスープ、青ねぎ
    cn_donggua_paigu: p => soup(p, '#efe2b8', (pl, S) => [
        ...[[-24, -8, 20], [18, -12, 160], [2, 14, 200]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.rib(p, x, y, 24, r, i, { c: '#c89a72', glaze: '#d8b088' })]; }),
        ...[[-44, 6], [40, 4], [-18, 20], [26, 20]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => wintermelon(p, x, y, 15, i, '#efe2b8')]; }),
        ...negis(pl, 'dgn', 8, 56),
    ]),
    // 白菜豆腐湯: 白菜と豆腐、春雨（お好みで）のスープ
    cn_baicai_doufu_tang: p => soup(p, '#f0e4c0', (pl, S) => [
        ...W.spots('bt', 7, 56, 17).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 26, r, i % 2 ? '#e8ecc8' : '#c8d898', 'bt' + i, { wave: 3 })]; }),
        ...[[-20, -4], [14, -12], [26, 12], [-6, 16]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + 1, () => W.tofuBlock(p, x, y, 15, i * 20, { liq: '#f0e4c0', sink: 3 })]; }),
        [S.cy - 3, () => { let s = ''; const R = rng('fs'); for (let i = 0; i < 8; i++){ const x = S.cx + (R() - .5) * 70, y = S.cy + (R() - .5) * 26; s += `<path d="M${f(x - 10)},${f(y)} q6,-4 12,0 t10,0" stroke="#e8e0c8" stroke-width="1.4" fill="none" opacity=".9"/>`; } return s; }],
    ]),
    // 西紅柿蛋湯: トマトと溶き卵のスープ、青ねぎ・香菜（お好みで）
    cn_xihongshi_dantang: p => soup(p, '#e8803a', (pl, S) => [
        ...W.spots('xt', 7, 56, 17).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => tomatoW(p, x, y, 13, r, i)]; }),
        ...[[-22, -8], [16, 4], [-2, 18], [30, -14]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => Q.eggRibbon(p, x, y, 26, i)]; }),
        ...negis(pl, 'xtn', 8, 56),
    ], { oil: 4, oilC: SESOIL }),
    // 酸辣湯: 豚の細切り・豆腐・きくらげ・しいたけ・溶き卵・たけのこ（お好みで）、黒酢と白こしょう
    cn_suanlatang: p => soup(p, '#9a5a2a', (pl, S) => [
        ...W.spots('slt', 22, 58, 9).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 5; return [y, () => k === 0 ? shred(p, x, y, 12, r, '#f2ead6', 2.4) : k === 1 ? muer(p, x, y, 10, r, i) : k === 2 ? shred(p, x, y, 12, r, '#b88a5a', 2) : k === 3 ? shred(p, x, y, 12, r, '#e8d4a0', 2) : W.mushSlice(p, x, y, 9, r)]; }),
        ...[[-16, -4], [18, 8]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => Q.eggRibbon(p, x, y, 28, i)]; }),
        ...negis(pl, 'sln', 8, 56),
        [999, () => W.flecks(p, S.cx, S.cy, 50, 20, 'slp', '#3a2010', { ry: 24, s: .7 })],
    ], { oil: 6, oilC: CHILIOIL }),
    // 蓮藕排骨湯: 豚スペアリブとれんこんのスープ、青ねぎ
    cn_lianou_paigu: p => soup(p, '#e8d8b0', (pl, S) => [
        ...[[-24, -8, 20], [18, -12, 160], [2, 14, 200]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.rib(p, x, y, 24, r, i, { c: '#c89a72', glaze: '#d8b088' })]; }),
        ...[[-44, 6], [40, 4], [-18, 22], [28, 20]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => lotus(p, x, y, 10, '#e8dcc0')]; }),
        ...negis(pl, 'lon', 8, 56),
    ]),
    // 鯽魚豆腐湯: フナを焼いて煮出した白いスープに豆腐、青ねぎ・香菜（お好みで）
    cn_jiyu_doufu: p => soup(p, '#f6f2e6', (pl, S) => [
        [S.cy - 2, () => W.wholeFish(p, S.cx - 4, S.cy - 2, 110, -6, 1, { skin: '#c8b898', belly: '#ece4d4', char: .2, H: 16 })],
        ...[[-36, 14], [30, 14], [6, 22], [44, -6]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + 1, () => W.tofuBlock(p, x, y, 14, i * 20, { liq: '#f6f2e6', sink: 3 })]; }),
        ...negis(pl, 'jyn', 8, 56),
    ], { glow: .5 }),
    // 汆丸子: 豚肉の団子と青梗菜、春雨（お好みで）、青ねぎ
    cn_cuan_wanzi: p => soup(p, '#efe2b8', (pl, S) => [
        ...W.spots('cw', 7, 50, 22).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.ball(p, x, y, 20, '#d8b890', 'cw' + i, { hi: .6 })]; }),
        ...W.spots('cwb', 5, 58, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 22, r, '#3f8a2a', 'cwb' + i, { wave: 2 })]; }),
        ...negis(pl, 'cwn', 6, 56),
    ]),
    // 絲瓜蛤蜊湯: あさりとへちまのスープ、青ねぎ（お好みで）
    cn_sigua_huage: p => soup(p, '#f0ead0', (pl, S) => [
        ...W.spots('sgc', 8, 56, 17).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => Q.clam(p, x, y, 16, r)]; }),
        ...W.spots('sgl', 7, 58, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.hangetsu(p, x, y, 8, r, '#4a8a2a', '#f0ead0', { h: 3, top: Q.rg(p, [[0, '#f4f6d8'], [.7, '#d8e4a8'], [1, '#6a9a3a']], .4, .35, .8) })]; }),
        ...negis(pl, 'sgn', 6, 56),
    ]),
    // 豬肝菠菜湯: 豚レバーとほうれん草のスープ、クコの実（お好みで）
    cn_zhugan_bocai: p => soup(p, '#e8d4a0', (pl, S) => [
        ...W.spots('zg', 7, 54, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => meat(p, x, y, 18, r, i, '#7a3a2a', '#9a5a4a')]; }),
        ...W.spots('zgs', 8, 58, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 22, r, '#2f6a22', 'zgs' + i, { wave: 2 })]; }),
        ...W.spots('zgg', 7, 50, 12).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.6" fill="#d8301e" stroke="#9a1e10" stroke-width=".4"/>`]; }),
    ], { oil: 4, oilC: SESOIL }),
    // 香菇鶏湯: 骨つきの鶏と干ししいたけのスープ、なつめ・クコの実（お好みで）（土鍋）
    cn_xianggu_jitang: p => soup(p, '#ecd090', (pl, S) => [
        ...[[-26, -6], [16, -14], [6, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => chicken(p, x, y, 26, i, '#e8c890')]; }),
        ...W.spots('xgs', 6, 56, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.mushCap(p, x, y, 15, '#7a4a2a')]; }),
        ...W.spots('xgd', 5, 50, 14).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => Q.lump(p, x, y, 4.6, 3.6, '#a8281e', 'rd' + i, { hi: .6 })]; }),
        ...W.spots('xgg', 6, 50, 12).map(([u, v]) => { const [x, y] = pl(u, v, 1); return [y + 1, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="1.5" fill="#d8301e" stroke="#9a1e10" stroke-width=".4"/>`]; }),
    ], { V: p => Q.donabe(p), oil: 8, oilC: '#f0c040', steamOp: .45 }),
    // 緑豆湯: 緑豆を氷砂糖で煮た甘いスープ（白い碗）
    cn_lvdou_tang: p => soup(p, '#c8b860', (pl, S) => [...W.spots('ld', 60, 60, 5).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => Q.pea(p, x, y, 2.6, '#7aa040')]; })], { V: p => bowl(p, { rim: Q.RIM.hai }), glow: .45 }),
    // 疙瘩湯: 小麦粉のすいとんをトマトと卵のスープで、青菜（お好みで）・青ねぎ
    cn_geda_tang: p => soup(p, '#e8803a', (pl, S) => [
        ...W.spots('gd', 26, 58, 9).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.lump(p, x, y, 4.4, 3.4, '#f2e8d0', 'gd' + i, { n: 7, jit: .4, hi: .5 })]; }),
        ...W.spots('gdt', 6, 54, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => tomatoW(p, x, y, 12, r, i)]; }),
        ...[[-18, -8], [20, 10]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => Q.eggRibbon(p, x, y, 24, i)]; }),
        ...W.spots('gdg', 4, 54, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 18, r, '#3f8a2a', 'gdg' + i, { wave: 2 })]; }),
        ...negis(pl, 'gdn', 6, 56),
    ], { oil: 4, oilC: SESOIL }),
    // 榨菜肉絲湯: ザーサイと豚の細切りのスープ、溶き卵（お好みで）、青ねぎ
    cn_zhacai_rousi: p => soup(p, '#e8d49a', (pl, S) => [
        ...W.spots('zr', 18, 58, 10).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => i % 2 ? shred(p, x, y, 14, r, '#f0e2cc', 2.4) : shred(p, x, y, 12, r, '#a8a050', 2.6)]; }),
        [S.cy + 1, () => Q.eggRibbon(p, S.cx + 10, S.cy + 4, 26, 1)],
        ...negis(pl, 'zrn', 8, 56),
    ], { oil: 4, oilC: SESOIL }),
    // 羅宋湯（上海風ボルシチ）: 牛すね・キャベツ・じゃがいも・トマト・にんじん・玉ねぎ（洋の深皿）
    cn_luosong_tang: p => W.soup(p, W.soupPlate(p), { c: '#d8582a', drop: 5, glow: .3, items: (pl, S) => [
        ...W.spots('ls', 22, 60, 10).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 5; return [y, () => k === 0 ? W.dice(p, x, y, 11, '#6a3418', 'lb' + i, { h: 6, top: Q.rg(p, [[0, '#a86a42'], [1, '#6a3418']], .4, .35, .8) }) : k === 1 ? W.dice(p, x, y, 10, '#f2e2b0', 'lp' + i, { h: 4, sink: 1.6, liq: '#d8582a' }) : k === 2 ? Q.leaf(p, x, y, 16, r, '#d8e4a8', 'lc' + i, { wave: 2 }) : k === 3 ? W.dice(p, x, y, 6, '#e8742a', 'lk' + i, { h: 2.4 }) : W.onionStrip(x, y, 10, r)]; }),
    ] }),
    // 醃篤鮮: 塩漬けの豚肉と生の豚バラ、春のたけのこのスープ、湯葉の結び（お好みで）（土鍋）
    cn_yanduxian: p => soup(p, '#f4eedc', (pl, S) => [
        ...[[-24, -8], [20, -12]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.dice(p, x, y, 16, '#e8b8a0', 'yr' + i, { h: 8, top: Q.lg(p, [[0, '#f6e4d4'], [.4, '#d88a7a'], [.6, '#f6ecdc'], [1, '#c87a6a']], 0, 0, 0, 1) })]; }),
        ...W.spots('yds', 7, 58, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.prism(p, x, y, [[-8, -5], [8, -4], [8, 5], [-8, 4]], 4, '#e8d8a0', { rot: r, top: Q.lg(p, [[0, '#fbf2d0'], [1, '#e0cc90']], 0, 0, 1, 1), line: .45 })]; }),
        ...W.spots('ydk', 3, 46, 20).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.lump(p, x, y, 6, 4, '#f2dca0', 'yk' + i, { hi: .5 })]; }),
    ], { V: p => Q.donabe(p), glow: .5, steamOp: .45 }),
    // 蘿蔔羊肉湯: 骨つきの羊肉と大根のスープ、青ねぎ・香菜
    cn_luobo_yangrou: p => soup(p, '#f0e6cc', (pl, S) => [
        ...W.spots('lyr', 6, 54, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.dice(p, x, y, 13, '#a87a5a', 'ly' + i, { h: 6, top: Q.rg(p, [[0, '#d8b090'], [1, '#9a6a4a']], .4, .35, .8) })]; }),
        ...W.spots('lyd', 7, 58, 15).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 13, '#f2ecd8', 'ld' + i, { h: 4, sink: 1.6, liq: '#f0e6cc', top: Q.lg(p, [[0, '#ffffff'], [1, '#ece4cc']], 0, 0, 1, 1) })]; }),
        ...negis(pl, 'lyn', 10, 56),
        [999, () => W.flecks(p, S.cx, S.cy, 40, 10, 'lyc', ['#5aa83a'], { ry: 16, s: 2 })],
    ]),
    // 西湖牛肉羹: 牛ひき肉・やわらかい豆腐・しいたけ・卵白のとろみスープ、香菜
    cn_xihu_niurougeng: p => soup(p, '#e8dcb8', (pl, S) => [
        ...W.spots('xh', 26, 58, 8).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 3; return [y, () => k === 0 ? `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="#8a5a3a"/>` : k === 1 ? W.dice(p, x, y, 5, '#f6f2e6', 'xt' + i, { h: 2 }) : W.dice(p, x, y, 4.4, '#8a5a3a', 'xm' + i, { h: 1.6 })]; }),
        ...[[-14, -6], [16, 6], [-24, 14]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => `<path d="${smooth(Array.from({ length: 9 }, (_, k) => [x + Math.cos(k / 9 * 6.28) * 12 * (.7 + (k % 2) * .4), y + Math.sin(k / 9 * 6.28) * 5]))}" fill="#fbfaf2" opacity=".9"/>`]; }),
        [999, () => W.flecks(p, S.cx, S.cy, 40, 12, 'xhc', ['#5aa83a'], { ry: 16, s: 2 })],
    ]),
    // 菌菇湯: エリンギ・しめじ・ひらたけ・えのきのスープ、にんじん（お好みで）、青ねぎ
    cn_jungu_tang: p => soup(p, '#e0c890', (pl, S) => [
        ...W.spots('jg', 14, 58, 12).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); const k = i % 3; return [y, () => k === 0 ? W.mushSlice(p, x, y, 13, r, { c: '#e8dcc0' }) : k === 1 ? W.mushCap(p, x, y, 10, '#a87a4a') : `<g ${T(x, y, r)}>${[-2, 0, 2].map(d => `<path d="M${d},4 L${d * 1.6},-8" stroke="#f6f2e2" stroke-width="1.4"/><circle cx="${d * 1.6}" cy="-8" r="1.4" fill="#f2e8c8"/>`).join('')}</g>`]; }),
        ...W.spots('jgc', 5, 54, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.coin(p, x, y, 4.4, '#e8742a', { h: 2 })]; }),
        ...negis(pl, 'jgn', 8, 56),
    ]),
    // 玉米羹: コーンと溶き卵のとろみスープ、にんじん・青ねぎ（お好みで）
    cn_yumi_geng: p => soup(p, '#f4d878', (pl, S) => [
        ...W.spots('ym', 40, 60, 7).map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => W.kernel(p, x, y, 4.4)]; }),
        ...[[-16, -6], [18, 8]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => Q.eggRibbon(p, x, y, 28, i)]; }),
        ...W.spots('ymc', 5, 54, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 4.4, '#e8742a', 'yc' + i, { h: 2 })]; }),
        ...negis(pl, 'ymn', 6, 56),
    ], { glow: .45 }),
    // 海帯豆腐湯: 昆布と豆腐のスープ、干しえび（お好みで）、青ねぎ
    cn_haidai_doufu: p => soup(p, '#e8d8a8', (pl, S) => [
        ...W.spots('hdk', 8, 56, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 22, r, '#3a4a22', 'hk' + i, { wave: 2.4 })]; }),
        ...[[-20, -4], [14, -12], [26, 12], [-6, 16]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + 1, () => W.tofuBlock(p, x, y, 14, i * 20, { liq: '#e8d8a8', sink: 3 })]; }),
        ...W.spots('hds', 5, 50, 14).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => W.shrimp(p, x, y, 6, i * 50)]; }),
        ...negis(pl, 'hdn', 6, 56),
    ], { oil: 4, oilC: SESOIL }),
    // 酸湯肥牛: 牛バラの薄切りとえのき、春雨（お好みで）を黄色い唐辛子のすっぱいスープで、唐辛子（お好みで）
    cn_suantang_feiniu: p => soup(p, '#f0c040', (pl, S) => [
        ...W.spots('st', 7, 54, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => meat(p, x, y, 22, r, i, '#c88a6a', '#f6dcc8')]; }),
        ...W.spots('ste', 4, 56, 20).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => `<g ${T(x, y, r)}>${[-3, -1, 1, 3].map(d => `<path d="M${d},6 L${d * 1.6},-9" stroke="#f6f2e2" stroke-width="1.4"/><circle cx="${d * 1.6}" cy="-9" r="1.4" fill="#f2e8c8"/>`).join('')}</g>`]; }),
        ...W.spots('stc', 8, 52, 12).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => W.chiliRing(x, y, 3, i % 2 ? '#3f8f2f' : '#c8281a')]; }),
    ], { oil: 8, oilC: '#e8902a' }),
    // 銀耳蓮子湯: 白きくらげと蓮の実を氷砂糖で煮た甘いスープ、なつめ・クコの実（お好みで）（白い碗）
    cn_yiner_lianzi: p => soup(p, '#f6eccc', (pl, S) => [
        ...W.spots('yn', 7, 54, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 20, r, '#f6eac0', 'yn' + i, { wave: 5, vein: false, op: .85 })]; }),
        ...W.spots('ynl', 8, 56, 13).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + .5, () => Q.lump(p, x, y, 4.6, 3.8, '#f2e4c4', 'ln' + i, { hi: .6 })]; }),
        ...W.spots('ynd', 4, 50, 16).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 1, () => Q.lump(p, x, y, 4.6, 3.6, '#a8281e', 'yd' + i, { hi: .6 })]; }),
        ...W.spots('yng', 6, 50, 12).map(([u, v]) => { const [x, y] = pl(u, v, 1); return [y + 1, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="1.5" fill="#d8301e" stroke="#9a1e10" stroke-width=".4"/>`]; }),
    ], { V: p => bowl(p, { rim: Q.RIM.hai }), glow: .5 }),

    // ---------- 麺・ご飯もの ----------
    // 炸醤麺: ゆでた麺に、豚ひき肉の甘みそ（炸醤）、きゅうりの細切り、もやし（お好みで）（大きな碗）
    cn_zhajiangmian: p => { const V = bowl(p), o = { cx: 100, cy: V.cy + 6 }, H = 20;
        return V.s + `<g ${V.above}>${W.noodleMound(p, o.cx, o.cy, 76, H, '#f2dca0', 'zj', { w: 3, n: 140, len: 30 })}${W.crumble(p, o.cx - 6, o.cy - H * CZ + 4, 26, 10, 60, 'zjc', { c: '#5a2a12', sauce: '#6a3014' })}${byDepth(W.onHill(o, 'zjk', 14, 60, 9, H, (x, y, r) => shred(p, x, y, 18, r, '#6ab048', 2.4), { lift: 3, cu: 24, cv: 4 }).concat(W.onHill(o, 'zjb', 8, 40, 8, H, (x, y, r) => W.sprout(p, x, y, 14, r, { head: false }), { lift: 3, cu: -30, cv: 6 })))}</g>` + V.shine(.5); },
    // 蛋炒飯: 冷やご飯を卵と炒め、青ねぎ、にんじん・コーン（グリーンピース）（お好みで）
    cn_dan_chaofan: p => { const D = plate(p), o = D.o; return D.s + W.friedRice(p, 100, 104, 58, 24, 'dc', { cols: ['#f6dc90', '#f2cc70', '#fbecc0'], edge: '#c89a3a', sy: SYF }) + byDepth(W.spots('dcs', 26, 50, 9).map(([u, v], i) => { const [x, y] = P(o, u, v, 5 + W.hill(u, v, 58, 24)); const k = i % 4; return [y, () => k === 0 ? eggBit(p, x, y, 10, i) : k === 1 ? Q.negi(null, x, y, 5, '#4a9a2c') : k === 2 ? W.dice(p, x, y, 4, '#e8742a', 'dk' + i, { h: 2 }) : Q.pea(p, x, y, 2.6)]; })); },
    // 臘腸煲仔飯: 米を中国ソーセージ・干ししいたけ（お好みで）と土鍋で炊き、青梗菜（お好みで）、甘い醤油
    cn_lachang_menfan: p => { const V = Q.donabe(p), o = { cx: 100, cy: V.cy + 8 };
        return V.s + `<g ${V.inside}>${Q.riceDome(p, o.cx, o.cy + 6, 84, 84 * SY, 8, { n: 500 })}</g><g ${V.above}>${byDepth([[-34, -6], [-12, -12], [10, -10], [32, -4]].map(([u, v], i) => { const [x, y] = P(o, u, v, 6); return [y, () => W.sausageCoin(p, x, y, 9, { c: '#9a2a1a', inner: '#d86a5a' })]; }).concat([[-20, 14], [20, 14]].map(([u, v], i) => { const [x, y] = P(o, u, v, 6); return [y, () => W.mushCap(p, x, y, 16, '#6a3a1a')]; }), [[0, 20]].map(([u, v]) => { const [x, y] = P(o, u, v, 6); return [y, () => bokchoy(p, x, y, 40, -10, 1)]; })))}${W.drizzle([[60, 82], [80, 86], [100, 82], [120, 88]], '#6a2e12', 2)}</g>` + V.shine(.5) + Q.steam(100, 0, .45); },
    // 葱油拌麺: 細い麺を、ねぎを揚げた油と醤油・砂糖のたれで和える（大きな碗）
    cn_congyou_banmian: p => { const V = bowl(p), o = { cx: 100, cy: V.cy + 6 }, H = 22;
        return V.s + `<g ${V.above}>${W.noodleMound(p, o.cx, o.cy, 76, H, '#c8904a', 'cy', { w: 2, n: 170, len: 34, edge: '#8a5a24' })}${byDepth(W.onHill(o, 'cyn', 16, 50, 9, H, (x, y, r) => `<g ${T(x, y, r)}><path d="M-7,0 Q0,-3 7,0" stroke="#3a4a14" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M-6,-.4 Q0,-3.4 6,-.4" stroke="#7a8a2a" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`, { lift: 3 }))}${Q.shine(80, o.cy - H * CZ, 20, -8, .8)}</g>` + V.shine(.5); },
    // 肉絲炒麺: 麺を豚の細切り・キャベツ・もやし（お好みで）・にんじん（お好みで）と醤油で炒める
    cn_rousi_chaomian: p => { const D = plate(p), o = D.o; return D.s + W.noodleMound(p, 100, 104, 58, 20, '#d8a050', 'rc', { w: 2.6, n: 150, len: 34, sy: SYF, edge: '#9a6a2a' }) + byDepth(W.spots('rcv', 18, 50, 11).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u, v, 58, 20)); const k = i % 4; return [y, () => k === 0 ? shred(p, x, y, 14, r, '#b0703e') : k === 1 ? Q.leaf(p, x, y, 14, r, '#c8dc90', 'rcl' + i, { wave: 2 }) : k === 2 ? W.sprout(p, x, y, 13, r, { head: false }) : shred(p, x, y, 12, r, '#e8742a', 1.6)]; })) + Q.shine(80, 84, 16, -8, .7); },
    // 白粥: 米をことこと煮たおかゆ、ザーサイ・煮卵（お好みで）を添える
    cn_baizhou: p => congee(p, 'bz', (pl, S) => [[S.cy, () => { const [x, y] = pl(24, -4, 4); return Q.lump(p, x, y, 10, 7.6, '#c8864a', 'be', { n: 12, jit: .06, hi: .7 }) + W.dice(p, ...pl(-26, -6, 2), 6, '#b8a850', 'zc1', { h: 3 }) + W.dice(p, ...pl(-18, 2, 2), 6, '#a8a048', 'zc2', { h: 3 }) + W.dice(p, ...pl(-30, 4, 2), 5, '#b8b058', 'zc3', { h: 3 }); }]]),
    // 皮蛋痩肉粥: ピータンと豚肉のかゆ、青ねぎ
    cn_pidan_shourou_zhou: p => congee(p, 'pz', (pl, S) => [
        ...W.spots('pzp', 7, 52, 16).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => pidan(p, x, y, 11, r)]; }),
        ...W.spots('pzm', 8, 54, 12).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => shred(p, x, y, 10, r, '#e8d0b8', 2.4)]; }),
        ...negis(pl, 'pzn', 10, 54),
    ]),
    // 番茄鶏蛋麺: トマトと卵のスープに麺、青ねぎ（大きな碗）
    cn_fanqie_jidan_mian: p => soup(p, '#e8803a', (pl, S) => [
        [S.cy - 2, () => W.noodleMound(p, S.cx, S.cy + 4, S.rx * .75, 6, '#f2dca0', 'fj', { w: 2.4, n: 90, len: 30 })],
        ...[[-26, -10], [24, -6], [-10, 14], [36, 12]].map(([u, v], i) => { const [x, y] = pl(u, v, 4); return [y + 6, () => tomatoW(p, x, y, 14, i * 40, i)]; }),
        ...[[-2, -4], [16, 16]].map(([u, v], i) => { const [x, y] = pl(u, v, 5); return [y + 7, () => eggBit(p, x, y, 18, i)]; }),
        ...negis(pl, 'fjn', 8, 54).map(([y, fn]) => [y + 8, fn]),
    ], { oil: 4, oilC: '#f0c040' }),
};
