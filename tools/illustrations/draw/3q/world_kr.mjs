// 韓国（kr_*）の主菜・副菜・汁物を斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: チゲは石鍋（トゥッペギ）、プデチゲは黄色いアルミの鍋、汁（クッ）は白い磁器の鉢、カルビタン・トックッ・カルビチムは真鍮の器（ユギ）、
// 主菜は白い平皿・長皿・浅い鍋、パンチャン（副菜）は白い磁器の小鉢に山高、焼きものの副菜は白い平皿。青は使わない。
// 材料は gohancho/packs/kr.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, T, rng, smooth, lt, dk, mix, SY, CZ, SYF, SHADE, at, byDepth } = W;

// =========================================================
// 韓国の部品
// =========================================================
const RED = '#c8341e', GOCHU = '#b8301c', SOY = '#7a3e18', SESOIL = '#e8b040';
const P = (o, u, v, z = 0) => at(o, u, v, z);
const plate = W.krPlate, bc = W.banchan;
// 赤いたれ（コチュジャン）をまとった具の色
const coat = c => mix(c, '#c8341e', .55);
// 豚・牛の薄切り（たれをまとう）
const meat = (p, x, y, s, r, i, c = '#a8562e', fat = '#e8b890') => Q.slice3q(p, x, y, s, r, { c, fat, seed: i, gloss: .7, char: false }, { sq: .5 });
// 青唐辛子・赤唐辛子の斜め切り
const chili = (x, y, i) => W.chiliRing(x, y, 3.2, i % 2 ? '#3f8f2f' : '#c8281a');
// えごまの葉・サンチュ
const perilla = (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#3f7a2a', 'pr' + i, { wave: 2 }) + `<g transform="translate(${f(x)} ${f(y)}) scale(1 ${SY}) rotate(${f(r)})">${[-.2, 0, .2].map(k => `<path d="M${f(-s * .1)},0 l${f(s * .2)},${f(k * s)}" stroke="#7ab858" stroke-width=".7" opacity=".7"/>`).join('')}</g>`;
const lettuce = (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, i % 2 ? '#7ab848' : '#5a9a34', 'lt' + i, { wave: 4.4 });
// 大根の角切り・いちょう切り（汁の中）
const radish = (p, x, y, s, i, liq = null, c = '#f2ead6') => Q.prism(p, x, y, [[-s / 2, -s * .45], [s / 2, -s * .45], [s / 2, s * .45], [-s / 2, s * .45]], 2.6, c, { rot: i * 37 % 90, sink: liq ? 1 : 0, liquid: liq, top: Q.lit(p, lt(c, .2), .3, .08), line: .45 });
// ズッキーニ（エホバク）の半月切り
const zuke = (p, x, y, s, r, liq = null) => Q.hangetsu(p, x, y, s, r, '#5a9a3a', liq, { h: 2.6, top: Q.rg(p, [[0, '#f8f6d8'], [.7, '#e4ecb8'], [1, '#9ac860']], .4, .35, .8) });
// じゃがいもの角切り（煮汁に沈める）
const potato = (p, x, y, s, i, liq = null, c = '#f0d690') => W.dice(p, x, y, s, c, 'po' + i, { h: s * .5, sink: liq ? 2 : 0, liq, top: Q.rg(p, [[0, lt(c, .35)], [.6, c], [1, dk(c, .15)]], .4, .35, .8) });
// 白い身の魚の切り身（スケトウダラ・タチウオ・サバ）: 皮は銀の灰（青は使わない）
const fishChunk = (p, x, y, s, r, i, { skin = '#a8a49a', flesh = '#f4ecdc', liq = null } = {}) => Q.prism(p, x, y, [[-s / 2, -s * .32], [s / 2, -s * .36], [s * .5, s * .3], [-s * .48, s * .32]], s * .45, skin, { rot: r, sink: liq ? 2 : 0, liquid: liq, top: Q.lit(p, flesh, .3, .1), line: .5 });
// 豆腐（汁の中）
const tofu = (p, x, y, s, r, liq) => W.tofuBlock(p, x, y, s, r, { liq, sink: s * .25 });
// スンドゥブ（崩れたやわらかい豆腐）
const softTofu = (p, x, y, s, i) => `<path d="${Q.blob(x, y, s / 2, s * .3, p.id + 'sd' + i, { n: 10, jit: .35 })}" fill="${Q.rg(p, [[0, '#ffffff'], [.6, '#f6f0e0'], [1, '#e2d6bc']], .4, .35, .8)}" stroke="#d8c8a8" stroke-width=".5"/>`;
// あさり（ひらいた殻）
const clam = (p, x, y, s, r) => Q.clam(p, x, y, s, r);
// 牛のスープ肉（薄い角切り）
const beefBit = (p, x, y, s, i, liq = null) => W.dice(p, x, y, s, '#8a5a3a', 'bf' + i, { h: 2.4, sink: liq ? 1 : 0, liq, top: Q.rg(p, [[0, '#b88a6a'], [.6, '#8a5a3a'], [1, '#6a3a22']], .4, .35, .8) });
// わかめ（ゆれる葉）
const seaweed = (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, i % 2 ? '#3a5a26' : '#2e4e22', 'mw' + i, { wave: 3.4 });
// 青ねぎ（小口切り）を面に散らす
const negis = (pl, seed, n, R, c = '#4a9a2c') => W.spots(seed, n, R, 8).map(([u, v]) => { const [x, y] = pl(u, v); return [y + .1, () => Q.negi(null, x, y, 5, c)]; });
// のり（もみのり）
const gim = (x, y, n, seed) => { const R = rng('gim' + seed); return Array.from({ length: n }, () => { const xx = x + (R() - .5) * 30, yy = y + (R() - .5) * 12; return `<path d="M${f(xx)},${f(yy)} l${f(3 + R() * 4)},${f((R() - .5) * 3)} l${f(-1 - R() * 2)},${f(2 + R() * 2)}Z" fill="#2e3426" stroke="#3a4030" stroke-width=".4"/>`; }).join(''); };
// 溶き卵（汁にふわり）
const egg = (p, x, y, s, i) => Q.eggRibbon(p, x, y, s, i);
// 練り物の串（オムク）
function skewer(p, x, y, L, rot, i, liq){
    const R = rng(p.id + 'sk' + i);
    let s = `<g ${T(x, y, rot)}><path d="M${f(-L / 2 - 12)},0 L${f(L / 2 + 10)},0" stroke="#d8b878" stroke-width="2.2" stroke-linecap="round"/>`;
    for (let k = 0; k < 4; k++){ const u = -L / 2 + k * L / 3.2; s += `<path d="M${f(u)},-5 q${f(L / 8)},-6 ${f(L / 4)},0 q${f(-L / 8)},7 ${f(-L / 4)},10Z" transform="translate(0 0)" fill="${Q.lg(p, [[0, '#f0c47a'], [1, '#c8904a']], 0, 0, 1, 1)}" stroke="#a8743a" stroke-width=".6"/>`; }
    return s + '</g>';
}
// 卵（ゆで卵の殻をむいた丸ごと、醤油色）
const wholeEgg = (p, x, y, s, c = '#d8a060') => Q.lump(p, x, y, s / 2, s * .4, c, p.id + 'we' + x, { n: 10, jit: .06, hi: .7 });
// 骨つきの鶏（煮込み）
const chickenPiece = (p, x, y, s, i, c = '#c8743a') => Q.soakLump(p, x, y, s, i, { c, soak: '#a8341e', k: .5, sy: .7 });

// ---------- 汁物の器 ----------
const jjigae = (p, c, items, o = {}) => W.soup(p, W.ttukbaegi(p), { c, drop: 7, glow: .25, oil: o.oil ?? 10, oilC: o.oilC ?? '#e8602a', gl: .4, items, steamOp: .45, ...o });
const guk = (p, c, items, o = {}) => W.soup(p, o.V ? o.V(p) : W.krSoupBowl(p), { c, drop: 10, glow: .35, gl: .55, items, ...o });

// ---------- 主菜の盛り（浅い山に、具を奥から手前へ） ----------
const plateHeap = (p, D, seed, n, R, minD, H, draw, { sauce = null, sauceR = 50 } = {}) => D.s + (sauce ? W.pool(p, D.o.cx + 4, D.o.cy + 6, sauceR, sauce, seed) : '') + byDepth(W.spots(seed, n, R, minD).map(([u, v, r], i) => { const [x, y] = P(D.o, u, v, 4 + W.hill(u, v, R, H)); return [y, () => draw(x, y, r, i)]; }));

// =========================================================
// 品
// =========================================================
export default {
    // ---------- 主菜 ----------
    // 豚肉のコチュジャン炒め（チェユク）: 豚の薄切り・玉ねぎ・長ねぎ、にんじん・青唐辛子（お好みで）、ごま、サンチュ（お好みで）
    kr_jeyuk: p => { const D = plate(p); return plateHeap(p, D, 'jy', 24, 54, 12, 14, (x, y, r, i) => i % 4 === 3 ? W.onionStrip(x, y, 16, r, '#f0c8a0') : i % 6 === 1 ? W.daepa(p, x, y, 13, r) : i % 8 === 5 ? W.pepperStrip(p, x, y, 12, r, '#e8782a') : meat(p, x, y, 26, r, i, '#c0462a', '#f0a080'), { sauce: '#b8341e' }) + W.sesame(p, 100, 92, 40, 30, 'jy') + lettuce(p, 40, 140, 30, 20, 1); },
    // プルコギ: 牛の薄切りを醤油・砂糖・ごま油で、玉ねぎ・長ねぎ、にんじん・しいたけ（お好みで）、ごま
    kr_bulgogi: p => { const D = plate(p); return plateHeap(p, D, 'bg', 26, 56, 11, 12, (x, y, r, i) => i % 4 === 3 ? W.onionStrip(x, y, 16, r, '#e8c890') : i % 7 === 1 ? W.daepa(p, x, y, 12, r) : i % 9 === 5 ? W.mushSlice(p, x, y, 14, r) : i % 11 === 2 ? W.pepperStrip(p, x, y, 10, r, '#e8782a') : meat(p, x, y, 26, r, i, '#7a4022', '#a8704a'), { sauce: SOY }) + W.sesame(p, 100, 92, 40, 30, 'bg'); },
    // タッポックムタン: 骨つきの鶏とじゃがいも・にんじん・玉ねぎを辛く煮る、長ねぎ、青唐辛子（お好みで）
    kr_dakbokkeumtang: p => W.heap(p, W.krSoupBowl(p, { h: 50, cy: 80 }), { c: '#b83a1e', drop: 10, H: 22, R: 66, items: (pl, S) => [
        ...[[-30, -16], [10, -24], [36, -2], [-6, 6], [-38, 14]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => chickenPiece(p, x, y, 30, i)]; }),
        ...[[24, 20], [-18, -26], [6, 26], [-46, -4]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => potato(p, x, y, 16, i, null, '#e8b860')]; }),
        ...[[40, -24], [-24, 30], [50, 16]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.rangiri(p, x, y, 14, i * 40, '#e8682a', i)]; }),
        ...W.spots('dbn', 6, 50, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v, 6); return [y + 2, () => W.daepa(p, x, y, 11, r)]; }),
    ] }),
    // サバの塩焼き（コドゥンオ）: 塩サバをこんがり焼く、大根おろし（お好みで）
    kr_godeungeo: p => { const D = Q.slabPlate(p, { line: 'none', base: '#f4f1ea', d: 120 }), o = D.o;
        const [x, y] = P(o, -8, -4);
        const fil = `M${f(x - 66)},${f(y + 4)} C${f(x - 60)},${f(y - 22)} ${f(x + 40)},${f(y - 26)} ${f(x + 66)},${f(y - 8)} L${f(x + 62)},${f(y + 14)} C${f(x + 30)},${f(y + 24)} ${f(x - 50)},${f(y + 24)} ${f(x - 66)},${f(y + 4)}Z`;
        let s = D.s + Q.dropOf(p, fil, 2, 7, .32) + `<path d="${fil}" transform="translate(0 5)" fill="#e8dcc4"/><path d="${fil}" fill="${Q.lg(p, [[0, '#d0c8b4'], [.5, '#a8a090'], [1, '#7a7466']], 0, 0, 0, 1)}" stroke="#5a5244" stroke-width=".7"/>`;
        s += `<g ${Q.clip(p, fil)}>${Array.from({ length: 10 }, (_, i) => `<path d="M${f(x - 56 + i * 12)},${f(y - 22)} q8,10 2,22" stroke="#5a5446" stroke-width="2" fill="none" opacity=".55"/>`).join('')}${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${f(x - 50 + i * 13)}" cy="${f(y - 6 + (i % 3) * 5)}" rx="6" ry="3" fill="#7a3e14" opacity=".45"/>`).join('')}</g>`;
        return s + Q.shine(x - 30, y - 12, 30, -6, .8) + `<path d="${Q.blob(146, 150, 14, 8, 'or')}" fill="${Q.rg(p, [[0, '#ffffff'], [1, '#e8e2d4']], .4, .35, .8)}" stroke="#d8d0c0" stroke-width=".5"/>`; },
    // 豆腐の辛い醤油煮（トゥブジョリム）: 焼いた豆腐に唐辛子の醤油だれ、青ねぎ、唐辛子（お好みで）、ごま
    kr_dubujorim: p => { const D = plate(p), o = D.o;
        const it = [[-34, -22], [0, -26], [34, -22], [-34, 10], [0, 6], [34, 10], [-16, 38], [18, 38]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.tofuBlock(p, x, y, 30, 0, { sear: '#d8963a', depth: .32 }) + `<path d="${Q.blob(x, y - 9, 11, 5, 'dj' + i)}" fill="#a8341e" opacity=".85"/>` + W.gochugaru(p, x, y - 9, 10, 8, 'dj' + i)]; });
        return D.s + W.pool(p, 104, 108, 54, '#9a3a1a', 'djp') + byDepth(it) + W.flecks(p, 100, 92, 50, 26, 'djn', ['#4a9a2c', '#7ac050'], { ry: 30, s: 1.6 }) + W.sesame(p, 100, 92, 46, 24, 'dj'); },
    // オジンオポックム: いか・キャベツ・玉ねぎ・にんじん・長ねぎを辛く炒める、ごま
    kr_ojingeobokkeum: p => { const D = plate(p); return plateHeap(p, D, 'oj', 26, 56, 11, 14, (x, y, r, i) => i % 3 === 0 ? `<g ${T(x, y, r)}><rect x="-12" y="-4.4" width="24" height="8.8" rx="2" fill="${Q.lg(p, [[0, '#f0a080'], [.6, '#d8583a'], [1, '#a83a20']], 0, 0, 0, 1)}" stroke="#8a2a14" stroke-width=".6"/>${[-7, -2, 3, 8].map(u => `<path d="M${u},-3.6 l2,7" stroke="#f8c0a0" stroke-width="1" opacity=".8"/>`).join('')}</g>` : i % 5 === 1 ? Q.leaf(p, x, y, 18, r, '#c8dc90', 'cb' + i, { wave: 2 }) : i % 5 === 2 ? W.onionStrip(x, y, 14, r, '#f0c8a0') : i % 5 === 3 ? W.daepa(p, x, y, 12, r) : W.pepperStrip(p, x, y, 10, r, '#e8782a'), { sauce: RED }) + W.sesame(p, 100, 90, 40, 28, 'oj'); },
    // タッカルビ: 鶏もも・キャベツ・さつまいも・長ねぎ・玉ねぎ、トック・えごまの葉（お好みで）を大きな鉄板で
    kr_dakgalbi: p => { const V = Q.pan(p, { rx: 90, cy: 100, h: 14, outer: '#5a4a40', lip: '#6a5a50', inner: '#4e4038', handles: 'loop', handleC: '#5a4a40', rim: '#7a6a5e' }), o = { cx: 100, cy: 101 };
        const it = W.spots('dg', 30, 74, 12).map(([u, v, r], i) => { const [x, y] = P(o, u, v * 1.02); const k = i % 6; return [y, () => k === 0 || k === 3 ? chickenPiece(p, x, y, 18, i, '#d0602a') : k === 1 ? Q.leaf(p, x, y, 20, r, '#d8e8a8', 'dc' + i, { wave: 2 }) : k === 2 ? W.coin(p, x, y, 6, '#a84a5a', { h: 3, top: Q.rg(p, [[0, '#fff2b0'], [1, '#e8b850']], .4, .35, .8) }) : k === 4 ? W.tteokStick(p, x, y, 16, r, { coat: '#e06a3a' }) : W.daepa(p, x, y, 12, r)]; });
        return V.s + `<g ${V.inside}><ellipse cx="100" cy="102" rx="80" ry="44" fill="#b8341e" opacity=".6"/>${byDepth(it)}</g>` + perilla(p, 100, 92, 28, 30, 1) + V.shine(.5); },
    // タッカンジョン: 揚げた鶏に甘辛いたれをからめる、ピーナッツ・唐辛子（お好みで）
    kr_dakgangjeong: p => { const D = plate(p); return plateHeap(p, D, 'dk', 14, 52, 20, 18, (x, y, r, i) => W.crusty(p, x, y, 13, 10, i, { c: '#b8461e', n: 16, h: 6, rot: r }) + `<path d="${Q.blob(x - 3, y - 4, 6, 3, 'dkg' + i)}" fill="#fff" opacity=".35"/>`) + W.flecks(p, 100, 88, 40, 26, 'dkp', ['#f0d8a0', '#d8b070'], { ry: 20, s: 1.6 }) + W.flecks(p, 100, 88, 40, 6, 'dkc', '#a82014', { ry: 20, s: 2.4 }); },
    // カルビチム: 牛の骨つきカルビを大根・にんじん・しいたけ・なつめと甘い醤油で煮る（真鍮の器）
    kr_galbijjim: p => W.heap(p, W.yugi(p), { c: '#7a3e18', drop: 10, H: 24, R: 64, items: (pl, S) => [
        ...[[-30, -18, 30], [10, -24, -20], [36, -2, 160], [-4, 8, 200], [-38, 14, 10]].map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => W.rib(p, x, y, 32, r, i, { c: '#6a3418', glaze: '#a85a24' })]; }),
        ...[[26, 22], [-16, 30], [46, -22]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.glossLump(p, x, y, 18, i, { c: '#e8c890' })]; }),
        ...[[-20, -30], [6, 30], [-50, -4]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.rangiri(p, x, y, 13, i * 40, '#e8682a', i)]; }),
        ...[[20, -6], [-10, -10]].map(([u, v], i) => { const [x, y] = pl(u, v, 8); return [y + 3, () => Q.lump(p, x, y, 5, 4, '#a8281e', 'jj' + i, { hi: .5 })]; }),
        [999, () => Q.shine(80, 54, 22, -10, .8)],
    ] }),
    // チャドルスッチュ: 牛の薄切りバラ肉ともやしを炒める、ニラ・玉ねぎ（お好みで）
    kr_chadolsukju: p => { const D = plate(p), o = D.o; return D.s + Q.cast(p, 100, 108, 60, 30, .3) + W.strands(p, 100, 104, 58, 20, ['#f6f2e2', '#efe8d0', '#e8dcb8'], 'cs', { n: 140, L: 14, w: 2.2 }) + byDepth(W.spots('csb', 10, 46, 16).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 10 + W.hill(u, v, 50, 8)); return [y, () => i % 4 === 3 ? W.pod(p, x, y, 22, r, { c: '#3f8a2a', w: 2.4 }) : meat(p, x, y, 22, r, i, '#b06a4a', '#f2dcc8')]; })); },
    // スユク（ゆで豚）: 豚バラの塊をゆでて薄切り、白菜キムチ（お好みで）、サンチュ（お好みで）
    kr_suyuk: p => { const D = plate(p), o = D.o;
        const sl = (u, v, i) => { const [x, y] = P(o, u, v); return [y, () => Q.prism(p, x, y, [[-30, -5], [30, -5], [30, 5], [-30, 5]], 4, '#e8d8c8', { rot: -14, top: Q.lg(p, [[0, '#fbf4ec'], [.3, '#f2dcd0'], [.45, '#c8908a'], [.6, '#f6ece0'], [.75, '#d8a49a'], [1, '#a86a5a']], 0, 0, 0, 1), line: .5 })]; };
        return D.s + lettuce(p, 50, 72, 40, 10, 1) + lettuce(p, 62, 88, 38, -20, 2) + byDepth([-18, -8, 2, 12, 22, 32].map((v, i) => sl(-8 + i * 6, v, i))) + byDepth([[46, 30], [56, 18], [42, 44]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.kimchi(p, x, y, 22, i * 50, i)]; })); },
    // サムギョプサル: 厚切りの豚バラを焼き、サンチュとえごまの葉、にんにく、キムチ・きのこ（お好みで）、サムジャン
    kr_samgyeopsal: p => { const D = plate(p), o = D.o;
        const belly = (u, v, r, i) => { const [x, y] = P(o, u, v); return [y, () => Q.prism(p, x, y, [[-28, -9], [28, -9], [28, 9], [-28, 9]], 6, '#c88a5a', { rot: r, top: Q.lg(p, [[0, '#f4d4a8'], [.22, '#e0a070'], [.38, '#fbe8d0'], [.55, '#d89060'], [.72, '#f8e0c4'], [1, '#c87a48']], 0, 0, 0, 1), line: .6 }) + Q.shine(x - 10, y - 8, 16, r, .7)]; };
        return D.s + lettuce(p, 60, 76, 44, 10, 1) + perilla(p, 70, 90, 34, -24, 2) + byDepth([belly(10, -24, -6, 1), belly(16, -2, -6, 2), belly(4, 22, -6, 3)]) + [[-46, 30], [-34, 40], [-50, 46]].map(([u, v], i) => { const [x, y] = P(o, u, v); return Q.lump(p, x, y, 5.5, 4.4, '#f6ecd4', 'sg' + i, { hi: .6 }); }).join('') + (() => { const [x, y] = P(o, 46, 38); return `<path d="${Q.blob(x, y, 11, 6, 'ssj')}" fill="${Q.rg(p, [[0, '#c87a3a'], [1, '#7a3a14']], .4, .35, .8)}" stroke="#5a2a10" stroke-width=".5"/>`; })() + W.mushCap(p, ...P(o, 50, -24), 18, '#e8dcc0'); },
    // トッカルビ: 牛と豚のひき肉を練って平たく焼き、甘い醤油だれ、松の実（お好みで）
    kr_tteokgalbi: p => { const D = plate(p), o = D.o;
        const pat = (u, v, i) => { const [x, y] = P(o, u, v); return [y, () => W.cutSlab(p, x, y, 32, 20, 8, '#8a4a28', i, { rot: -6, sear: '#4a2010', glaze: '#a8581e', jit: .1 }) + W.flecks(p, x, y - 2, 20, 10, 'tg' + i, ['#4a9a2c', '#f6eccc'], { ry: 8, s: 1.2 })]; };
        return D.s + W.pool(p, 104, 108, 50, SOY, 'tgp') + byDepth([pat(-26, -16, 1), pat(26, -10, 2), pat(0, 22, 3)]) + W.flecks(p, 100, 90, 44, 12, 'tgn', '#f8f0d8', { ry: 26, s: 1.6, shape: 'seed' }); },
    // タチウオの辛い煮付け（カルチジョリム）: 大根の上にタチウオを並べ、唐辛子の煮汁、長ねぎ・青唐辛子（浅い鍋）
    kr_galchijorim: p => { const V = Q.pan(p, { rx: 86, cy: 98, h: 22, outer: '#c8b070', lip: '#dcc488', inner: '#b89a5a', handles: 'loop', handleC: '#c8a860', rim: '#a88a4a' }), o = { cx: 100, cy: 104 };
        const it = [];
        [[-30, -14], [16, -18], [-6, 12], [38, 10]].forEach(([u, v], i) => { const [x, y] = P(o, u, v); it.push([y, () => radish(p, x, y, 24, i, '#b83a1e', '#f0d8b8')]); });
        [[-36, -6, -10], [6, -4, -6], [-14, 22, -8], [32, 22, -4]].forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 4); it.push([y + 2, () => fishChunk(p, x, y, 28, r, i, { skin: '#c8c4b8', flesh: '#e8d0b8' }) + `<path d="M${f(x - 10)},${f(y - 13)} l20,0" stroke="#f8f6ee" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>`]); });
        W.spots('gcn', 6, 56, 18).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 10); it.push([y + 4, () => i % 2 ? W.daepa(p, x, y, 11, r) : chili(x, y, i)]); });
        return V.s + `<g ${V.inside}><ellipse cx="100" cy="102" rx="78" ry="42" fill="${Q.rg(p, [[0, '#d85a3a'], [1, '#9a2a14']], .4, .35, .8)}"/>${byDepth(it)}</g>` + W.gochugaru(p, 100, 96, 50, 30, 'gc') + V.shine(.5); },
    // イシモチの塩焼き（チョギグイ）: 小さなイシモチを丸ごと焼き、大根おろし（お好みで）、たれ
    kr_jogigui: p => { const D = Q.slabPlate(p, { line: 'none', base: '#f4f1ea', d: 120 }), o = D.o;
        return D.s + byDepth([[-8, -18, -6, 1], [4, 16, -4, 2]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => W.wholeFish(p, x, y, 140, r, i, { skin: '#d8b860', belly: '#f2e4b8', char: .5 })]; })) + `<path d="${Q.blob(150, 152, 12, 7, 'or')}" fill="${Q.rg(p, [[0, '#ffffff'], [1, '#e8e2d4']], .4, .35, .8)}" stroke="#d8d0c0" stroke-width=".5"/>`; },
    // 海鮮ねぎチヂミ（ヘムルパジョン）: 細ねぎを並べ、いか・えびをのせて焼く、唐辛子（お好みで）、酢醤油
    kr_haemulpajeon: p => { const D = plate(p), o = D.o, x = 100, y = 98;
        let s = D.s + W.jeon(p, x, y, 66, 1, { c: '#e8c060', h: 4 });
        const R = rng('pj');
        for (let i = 0; i < 12; i++){ const v = -36 + i * 6.4; const [x1, y1] = P(o, -54 + Math.abs(v) * .5, v - 2), [x2, y2] = P(o, 54 - Math.abs(v) * .5, v + 2); s += `<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="#3f8a2a" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M${f(x1)},${f(y1 - .8)} L${f(x2)},${f(y2 - .8)}" stroke="#9ad070" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`; }
        s += byDepth(W.spots('pjs', 10, 48, 18).map(([u, v, r], i) => { const [xx, yy] = P(o, u, v * .8, 4); return [yy, () => i % 2 ? W.shrimp(p, xx, yy, 14, r) : W.coin(p, xx, yy, 6, '#f2e4d4', { h: 2, top: '#fbf4ec', rim: '#d8b8a0' }) + `<ellipse cx="${f(xx)}" cy="${f(yy - 2)}" rx="2.6" ry="1.4" fill="#e8c890"/>`]; }));
        s += W.flecks(p, x, y - 4, 50, 8, 'pjc', ['#c8281a', '#3f8f2f'], { ry: 26, s: 2 }) + Q.shine(66, 76, 24, -8, .6);
        return s; },
    // チュクミポックム: いいだこ・キャベツ・玉ねぎ・長ねぎを辛く炒める、ごま
    kr_jjukkumibokkeum: p => { const D = plate(p); return plateHeap(p, D, 'jk', 22, 56, 12, 14, (x, y, r, i) => i % 3 === 0 ? `<g ${T(x, y, r)}>${Q.lump(p, 0, -2, 7, 6, '#c8341e', 'jkh' + i, { hi: .7 })}${[-1, 0, 1].map(k => `<path d="M${k * 4},2 q${k * 6},8 ${k * 10},4" stroke="#b8301c" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join('')}</g>` : i % 3 === 1 ? Q.leaf(p, x, y, 18, r, '#d8e8a8', 'jc' + i, { wave: 2 }) : i % 2 ? W.onionStrip(x, y, 14, r, '#f0c8a0') : W.daepa(p, x, y, 12, r), { sauce: RED }) + W.sesame(p, 100, 90, 40, 28, 'jk'); },
    // トゥブキムチ: ゆでた豆腐に、豚肉（お好みで）と炒めたキムチ、青ねぎ、ごま
    kr_dubukimchi: p => { const D = plate(p), o = D.o;
        const tf = [[-48, -18], [-48, 6], [-48, 30], [-28, -30], [-26, -6]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.tofuBlock(p, x, y, 22, 0, { depth: .55 })]; });
        const km = W.spots('dk', 14, 34, 11, { cu: 20, cv: 4 }).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u - 20, v - 4, 34, 14)); return [y, () => i % 4 === 3 ? meat(p, x, y, 18, r, i, '#c0562e', '#f0b090') : W.kimchi(p, x, y, 20, r, i)]; });
        return D.s + byDepth([...tf, ...km]) + W.flecks(p, 120, 88, 26, 12, 'dkn', ['#4a9a2c'], { ry: 12, s: 1.6 }) + W.sesame(p, 120, 88, 28, 14, 'dk'); },
    // キムチチム: 熟成キムチを株ごと、豚肉の塊と煮込む、長ねぎ（浅い鍋）
    kr_kimchijjim: p => { const V = Q.pan(p, { rx: 86, cy: 96, h: 24, outer: '#5a4a40', lip: '#6a5a50', inner: '#4e4038', handles: 'loop', handleC: '#5a4a40', rim: '#7a6a5e' }), o = { cx: 100, cy: 100 };
        const leafLong = (x, y, r, i) => `<g ${T(x, y, r)}><path d="M-46,-8 Q-10,-18 44,-6 Q50,2 44,8 Q-10,16 -46,8 Q-52,0 -46,-8Z" fill="${Q.lg(p, [[0, '#e86a40'], [.6, '#c8341e'], [1, '#9a2414']], 0, 0, 0, 1)}" stroke="#7a1e10" stroke-width=".7"/><path d="M-40,1 Q0,-4 40,1" stroke="#f2d4b0" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
        const it = [[-6, -18, -6], [4, 4, -4], [-2, 26, -8]].map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => leafLong(x, y, r, i)]; });
        [[-40, -10], [36, -14], [40, 16], [-36, 18]].forEach(([u, v], i) => { const [x, y] = P(o, u, v, 4); it.push([y + 3, () => W.dice(p, x, y, 16, '#e8b890', 'kp' + i, { h: 12, top: Q.lg(p, [[0, '#fbe4d0'], [.35, '#e0a080'], [.5, '#fbecd8'], [1, '#c87a50']], 0, 0, 0, 1) })]); });
        W.spots('kjn', 5, 50, 20).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 10); it.push([y + 4, () => W.daepa(p, x, y, 11, r)]); });
        return V.s + `<g ${V.inside}><ellipse cx="100" cy="100" rx="80" ry="44" fill="#a82a14" opacity=".7"/>${byDepth(it)}</g>` + V.shine(.5); },
    // トッポッキ: 円柱の餅と練り物を甘辛いコチュジャンで煮る、長ねぎ、キャベツ・ゆで卵（お好みで）
    kr_tteokbokki: p => { const D = plate(p), o = D.o;
        return D.s + W.pool(p, 102, 106, 58, '#c8341e', 'tbp') + byDepth(W.spots('tb', 22, 54, 12).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u, v, 54, 10)); return [y, () => i % 5 === 4 ? W.eomuk(p, x, y, 22, r, i, { c: '#d8603a' }) : i % 7 === 3 ? W.daepa(p, x, y, 11, r) : W.tteokStick(p, x, y, 22, r, { coat: '#e0583a' })]; })) + (() => { const [x, y] = P(o, 30, 26, 8); return W.eggHalf(p, x, y, 20, -10); })() + Q.shine(80, 82, 20, -8, .8) + W.sesame(p, 100, 92, 40, 16, 'tb'); },

    // ---------- 副菜（パンチャン） ----------
    // 豆もやしのナムル
    kr_kongnamul: p => W.inBowl(p, bc(p), { R: 66, H: 26, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#f6f2e2', '#efe8d0', '#e8dcb8'], 'kn', { n: 130, L: 14, w: 2.2 })], ...W.onHill(o, 'knh', 22, R * .9, 12, H, (x, y, r) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.4" ry="2.4" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="${Q.rg(p, [[0, '#fff2a0'], [1, '#e2c040']], .35, .3, .8)}" stroke="#c8a030" stroke-width=".4"/>`, { lift: 1 }), [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 14, 'knn', '#4a9a2c', { ry: 12, s: 1.5 }) + W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'kn')]] }),
    // ほうれん草のナムル
    kr_sigeumchi: p => W.inBowl(p, bc(p), { R: 66, H: 28, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#3f7a2a', '#2f6a22', '#5a9a3a'], 'sg', { n: 120, L: 16, w: 3 })], ...W.onHill(o, 'sgs', 8, R * .8, 18, H, (x, y, r) => `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#d87a8a" stroke-width="2.4" stroke-linecap="round"/>`, { lift: 1 }), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 24, 'sg')]] }),
    // ケランマリ（卵焼き）: にんじんと青ねぎを入れて巻き、切って並べる
    kr_gyeranmari: p => { const D = plate(p), o = D.o;
        const roll = (u, v, i) => { const [x, y] = P(o, u, v); const w = 34, d = 26, h = 9, pts = Array.from({ length: 16 }, (_, k) => { const a = k / 16 * 6.283, c = Math.cos(a), sn = Math.sin(a); return [Math.sign(c) * Math.abs(c) ** .6 * w / 2, Math.sign(sn) * Math.abs(sn) ** .6 * d / 2]; });
            let sp = ''; for (let k = 0; k <= 40; k++){ const t = k / 40, a = t * 3 * 6.283, r = 1 + t * .9; sp += `${k ? 'L' : 'M'}${f(x + Math.cos(a) * r * w * .26)},${f(y - h * CZ + Math.sin(a) * r * d * .26 * SYF)}`; }
            return [y, () => Q.prism(p, x, y, pts.map(([a, b]) => [a, b * SYF / SY]), h, '#e8b030', { top: Q.rg(p, [[0, '#fff6c0'], [.6, '#f8dc68'], [1, '#e8b838']], .4, .35, .8), line: .6 }) + `<path d="${sp}" stroke="#e0a828" stroke-width="1.1" fill="none" opacity=".8"/>` + W.flecks(p, x, y - h * CZ, 12, 10, 'gm' + i, ['#e8742a', '#4a9a2c'], { ry: 6, s: 1 })]; };
        return D.s + byDepth([[-40, -20], [-4, -26], [32, -20], [-24, 12], [12, 8], [46, 14], [-6, 40], [30, 42]].map(([u, v], i) => roll(u, v, i))); },
    // ミョルチポックム: 小さな煮干しを甘辛く炒める、アーモンド（お好みで）、ごま
    kr_myeolchi: p => W.inBowl(p, bc(p), { R: 66, H: 24, base: '#c89a50', items: (o, R, H) => [...W.onHill(o, 'my', 70, R * .95, 6, H, (x, y, r) => `<g ${T(x, y, r)}><path d="M-6,0 Q-2,-2.4 4,-1 L6,-2.4 L6,2 L4,1 Q-2,2.4 -6,0Z" fill="${Q.lg(p, [[0, '#f0d8a0'], [1, '#b8904a']], 0, 0, 0, 1)}" stroke="#8a6a32" stroke-width=".4"/><circle cx="-4.4" cy="-.4" r=".6" fill="#3a2010"/></g>`), ...W.onHill(o, 'mya', 7, R * .8, 18, H, (x, y, r, i) => Q.lump(p, x, y, 5, 3.4, '#d8a868', 'am' + i, { hi: .5 }), { lift: 2 }), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 24, 'my') + Q.shine(o.cx - 20, o.cy - H * CZ - 2, 18, -8, .7)]] }),
    // オイムチム: きゅうりと玉ねぎを唐辛子と酢で和える、青ねぎ（お好みで）、ごま
    kr_oimuchim: p => W.inBowl(p, bc(p), { R: 66, H: 26, base: '#a84a2a', items: (o, R, H) => [...W.onHill(o, 'oi', 22, R * .95, 13, H, (x, y, r) => W.coin(p, x, y, 8, '#3f7a2a', { h: 2.4, top: Q.rg(p, [[0, '#f0f4c8'], [.55, '#d8e0a0'], [.8, '#c87050'], [1, '#3f7a2a']], .4, .35, .8) }) + W.gochugaru(p, x, y - 3, 5, 4, 'oi' + x)), ...W.onHill(o, 'oio', 6, R * .8, 18, H, (x, y, r) => W.onionStrip(x, y, 10, r, '#f2dcc0'), { lift: 2 }), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 22, 'oi')]] }),
    // カムジャジョリム: じゃがいもの角切りを醤油と水あめで照りよく煮る、にんじん・玉ねぎ（お好みで）、ごま
    kr_gamjajorim: p => W.inBowl(p, bc(p), { R: 66, H: 26, base: '#b8823a', items: (o, R, H) => [...W.onHill(o, 'gj', 20, R * .95, 14, H, (x, y, r, i) => i % 6 === 5 ? W.dice(p, x, y, 9, '#e8682a', 'gc' + i, { h: 5 }) : potato(p, x, y, 14, i, null, '#d8a050') + `<ellipse cx="${f(x - 2)}" cy="${f(y - 8)}" rx="2.6" ry="1.2" fill="#fff" opacity=".7"/>`), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 22, 'gj')]] }),
    // コサリナムル: 戻したわらびを醤油とえごま油で炒める、ごま
    kr_gosarinamul: p => W.inBowl(p, bc(p), { R: 66, H: 26, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#7a5a2a', '#8a6a34', '#5a4020'], 'gs', { n: 110, L: 18, w: 3 })], [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 10, 'gsn', '#4a9a2c', { ry: 12, s: 1.5 }) + W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 24, 'gs')]] }),
    // スッチュナムル: 緑豆もやしのナムル
    kr_sukjunamul: p => W.inBowl(p, bc(p), { R: 66, H: 26, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#fbf8ee', '#f2eee0', '#e8e4c8'], 'sj', { n: 140, L: 14, w: 2 })], ...W.onHill(o, 'sjh', 14, R * .9, 14, H, (x, y, r) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.6" fill="#d8e4a0" stroke="#a8b860" stroke-width=".4"/>`, { lift: 1 }), [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 12, 'sjn', '#4a9a2c', { ry: 12, s: 1.4 }) + W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'sj')]] }),
    // ムセンチェ: 大根の千切りを唐辛子と酢で和える、ごま
    kr_musaengchae: p => W.inBowl(p, bc(p), { R: 66, H: 28, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#e8603a', '#d8482a', '#f08a5a'], 'ms', { n: 160, L: 14, w: 2 })], [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 10, 'msn', '#4a9a2c', { ry: 12, s: 1.5 }) + W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 22, 'ms')]] }),
    // カジナムル: 蒸したなすを裂いて醤油とごま油で和える、青ねぎ・赤唐辛子（お好みで）
    kr_gajinamul: p => W.inBowl(p, bc(p), { R: 66, H: 26, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#8a5a6a', '#c8a88a', '#5a3a4a'], 'gj', { n: 70, L: 22, w: 4.4 })], [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 12, 'gjn', ['#4a9a2c', '#c8281a'], { ry: 12, s: 1.5 }) + W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'gj')]] }),
    // ポソッポックム: ひらたけ・玉ねぎ・にんじんを炒める、ごま
    kr_beoseotbokkeum: p => W.inBowl(p, bc(p), { R: 66, H: 24, base: '#c8a070', items: (o, R, H) => [...W.onHill(o, 'bs', 22, R * .95, 12, H, (x, y, r, i) => i % 5 === 4 ? W.onionStrip(x, y, 12, r) : i % 7 === 3 ? W.pepperStrip(p, x, y, 10, r, '#e8742a') : W.mushSlice(p, x, y, 16, r % 60 - 30, { c: '#d8c09a' })), [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 10, 'bsn', '#4a9a2c', { ry: 12, s: 1.5 }) + W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'bs')]] }),
    // オムクポックム: 平たい練り物を細切りにして玉ねぎ・にんじんと甘辛く炒める、ごま
    kr_eomukbokkeum: p => W.inBowl(p, bc(p), { R: 66, H: 24, base: '#c88a4a', items: (o, R, H) => [...W.onHill(o, 'eb', 20, R * .95, 12, H, (x, y, r, i) => i % 5 === 4 ? W.onionStrip(x, y, 12, r) : i % 6 === 2 ? W.pepperStrip(p, x, y, 10, r, '#e8742a') : W.pepperStrip(p, x, y, 22, r, '#d8a058')), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 24, 'eb') + Q.shine(o.cx - 20, o.cy - H * CZ, 16, -8, .7)]] }),
    // チャンジョリム: 牛肉と卵を醤油で煮る、青唐辛子（お好みで）
    kr_jangjorim: p => W.heap(p, bc(p), { c: '#6a3414', drop: 8, H: 18, R: 60, items: (pl, S) => [
        ...[[-26, -10], [22, -14], [0, 16]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => wholeEgg(p, x, y, 24, '#b87a3a') + (i === 2 ? '' : '')]; }),
        ...W.spots('jj', 12, 56, 12).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y - 1, () => W.pepperStrip(p, x, y, 16, r, '#7a4a2a')]; }),
        ...[[38, 14], [-40, 16]].map(([u, v], i) => { const [x, y] = pl(u, v, 4); return [y + 2, () => W.pod(p, x, y, 18, i * 40, { c: '#4a8a2a', w: 4 })]; }),
    ] }),
    // コンジャバン: 黒豆を醤油と水あめで照りよく煮る、ごま
    kr_kongjaban: p => W.inBowl(p, bc(p), { R: 64, H: 24, base: '#3a2420', items: (o, R, H) => [...W.onHill(o, 'kj', 70, R * .95, 6, H, (x, y, r) => Q.bean(p, x, y, 8, r, '#4a3028')), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'kj')]] }),
    // ヨングンジョリム: れんこんを醤油と水あめで照りよく煮る、ごま
    kr_yeongeunjorim: p => W.inBowl(p, bc(p), { R: 64, H: 22, base: '#8a5428', items: (o, R, H) => [...W.onHill(o, 'yg', 12, R * .9, 18, H, (x, y) => W.coin(p, x, y, 12, '#8a5428', { h: 3, top: Q.rg(p, [[0, '#d8a060'], [.7, '#a8682e'], [1, '#7a4418']], .4, .35, .8) }) + [[0, 0], [-5, -1.4], [5, -1.4], [-3, 2.6], [3, 2.6], [0, -3.6]].map(([dx, dy]) => `<ellipse cx="${f(x + dx)}" cy="${f(y - 3 * CZ + dy)}" rx="1.6" ry="1.1" fill="#6a3412"/>`).join('') + `<ellipse cx="${f(x - 4)}" cy="${f(y - 6)}" rx="2.6" ry="1" fill="#fff" opacity=".6"/>`), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'yg')]] }),
    // ケランチム: 卵をだしで溶いてふっくら蒸す、青ねぎ、にんじん（お好みで）（石鍋のまま）
    kr_gyeranjjim: p => { const V = W.ttukbaegi(p, { rx: 86 }), cx = 100, cy = V.cy, rx = 82;
        const top = `M${f(cx - rx)},${f(cy + 2)} C${f(cx - rx - 2)},${f(cy - 30)} ${f(cx - 30)},${f(cy - 40)} ${f(cx)},${f(cy - 38)} C${f(cx + 34)},${f(cy - 40)} ${f(cx + rx + 2)},${f(cy - 28)} ${f(cx + rx)},${f(cy + 2)} A${f(rx)},${f(rx * SY)} 0 0 1 ${f(cx - rx)},${f(cy + 2)}Z`;
        return V.s + `<g ${V.above}><path d="${top}" fill="${Q.rg(p, [[0, '#fff4b0'], [.5, '#f8d860'], [.85, '#e8b838'], [1, '#c8902a']], .4, .3, .8)}" stroke="#c89a2a" stroke-width=".7"/><path d="M${f(cx - 40)},${f(cy - 26)} q20,-8 40,-4" stroke="#fffbe0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>${W.flecks(p, cx, cy - 20, 40, 26, 'gjf', ['#4a9a2c', '#7ac050', '#e8742a'], { ry: 12, s: 1.6 })}</g>` + Q.steam(100, 0, .5); },
    // トゥブブチム: 豆腐を焼いて、唐辛子の醤油だれをかける、青ねぎ、ごま
    kr_dububuchim: p => { const D = plate(p), o = D.o;
        const it = [[-36, -20], [0, -26], [36, -20], [-30, 14], [6, 10], [40, 16]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.tofuBlock(p, x, y, 32, 0, { sear: '#e0a048', depth: .3 }) + `<path d="${Q.blob(x, y - 9, 10, 5, 'db' + i)}" fill="#8a3a1a" opacity=".8"/>` + W.flecks(p, x, y - 10, 9, 6, 'dbn' + i, ['#4a9a2c', '#c8281a'], { ry: 4, s: 1.4 })]; });
        return D.s + byDepth(it) + W.sesame(p, 100, 92, 46, 22, 'db'); },
    // ホバクジョン: ズッキーニの輪切りに粉と卵をつけて焼く、酢醤油
    kr_hobakjeon: p => { const D = plate(p), o = D.o;
        const it = [[-36, -22], [0, -28], [36, -22], [-40, 8], [-4, 4], [32, 8], [-18, 34], [18, 36]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.jeon(p, x, y, 18, i, { c: '#f2cc58', h: 3.4 }) + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="12" ry="${f(12 * SYF)}" fill="${Q.rg(p, [[0, '#f8f4c8'], [.6, '#e0e8a8'], [1, '#8ab858']], .4, .35, .8)}" opacity=".85"/>` + [0, 1, 2, 3, 4].map(k => `<circle cx="${f(x + Math.cos(k * 1.25) * 5)}" cy="${f(y + Math.sin(k * 1.25) * 5 * SYF)}" r=".8" fill="#c8c890"/>`).join('')]; });
        return D.s + byDepth(it); },
    // キムチジョン: 刻んだキムチと粉の生地を焼く、玉ねぎ・豚肉（お好みで）
    kr_kimchijeon: p => { const D = plate(p), o = D.o, x = 100, y = 98;
        return D.s + W.jeon(p, x, y, 64, 1, { c: '#e0602a', h: 4 }) + byDepth(W.spots('kj', 18, 48, 12).map(([u, v, r], i) => { const [xx, yy] = P(o, u, v * .8, 2); return [yy, () => i % 4 === 3 ? W.onionStrip(xx, yy, 10, r, '#f2c8a0') : W.kimchi(p, xx, yy, 14, r, i)]; })) + `<g ${Q.clip(p, Q.eD(x, y, 64, 64 * SYF))}><ellipse cx="${x}" cy="${y}" rx="64" ry="${f(64 * SYF)}" fill="none" stroke="#9a2a12" stroke-width="7" opacity=".4"/></g>` + Q.shine(70, 80, 22, -8, .6); },
    // トングランテン: 豚ひき肉と豆腐・野菜のだんごを平たくして、粉と卵をつけて焼く
    kr_dongeurangttaeng: p => { const D = plate(p), o = D.o;
        const it = [[-36, -22], [0, -28], [36, -22], [-40, 8], [-4, 4], [32, 8], [-18, 34], [18, 36]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.jeon(p, x, y, 17, i, { c: '#f2c850', h: 5 }) + W.flecks(p, x, y - 1, 12, 9, 'dg' + i, ['#e8742a', '#4a9a2c', '#a8784a'], { ry: 8, s: 1.1 })]; });
        return D.s + byDepth(it); },
    // ペチュコッチョリ: 白菜を唐辛子・魚醤・にんにくで和える即席キムチ、細ねぎ、ごま
    kr_baechugeotjeori: p => W.inBowl(p, bc(p), { R: 66, H: 30, base: '#c8402a', items: (o, R, H) => [...W.onHill(o, 'bg', 16, R * .95, 15, H, (x, y, r, i) => W.kimchi(p, x, y, 26, r, i, { c: '#d84a2a', stem: '#f8e4c4' })), ...W.onHill(o, 'bgn', 8, R * .8, 16, H, (x, y, r) => W.pod(p, x, y, 18, r, { c: '#3f8a2a', w: 2.2 }), { lift: 3 }), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 24, 'bg')]] }),
    // ヤンパジャンアチ: 玉ねぎを醤油・酢・砂糖の液に漬ける、青唐辛子（お好みで）
    kr_yangpajangajji: p => W.soup(p, bc(p, { h: 42, cy: 80 }), { c: '#8a4a1e', drop: 5, glow: .4, rimShade: .2, items: (pl, S) => [
        ...W.spots('yp', 16, 58, 13).map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.prism(p, x, y, [[-9, -5], [9, -6], [8, 5], [-8, 6]], 3, '#c8904a', { rot: r, line: .45, top: Q.rg(p, [[0, '#f2d8a0'], [.6, '#d8a060'], [1, '#a8682a']], .4, .35, .8) })]; }),
        ...W.spots('ypc', 6, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 3); return [y + 1, () => chili(x, y, 1)]; }),
    ] }),
    // ミヨクチュルギポックム: 塩蔵わかめの茎を戻して炒める、にんじん・玉ねぎ（お好みで）、ごま
    kr_miyeokjulgi: p => W.inBowl(p, bc(p), { R: 66, H: 26, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#3a6a2a', '#4a7a30', '#2e5a22'], 'mj', { n: 110, L: 16, w: 3 })], ...W.onHill(o, 'mjc', 10, R * .85, 14, H, (x, y, r) => `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2" stroke-linecap="round"/>`, { lift: 1 }), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 24, 'mj')]] }),
    // チンミチェ: 味つけの干しいかの裂きをコチュジャンと水あめで炒める、ごま
    kr_jinmichae: p => W.inBowl(p, bc(p), { R: 66, H: 26, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#d8603a', '#e8885a', '#b8462a', '#f0b890'], 'jm', { n: 120, L: 18, w: 2.8 })], [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 26, 'jm') + Q.shine(o.cx - 20, o.cy - H * CZ, 16, -8, .7)]] }),
    // カムジャチェ: じゃがいもの細切りを玉ねぎ・にんじんと炒める、ごま
    kr_gamjachae: p => W.inBowl(p, bc(p), { R: 66, H: 26, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#f6e4a8', '#f0d890', '#fbf0c8'], 'gc', { n: 130, L: 16, w: 2.6 })], ...W.onHill(o, 'gcc', 10, R * .85, 14, H, (x, y, r) => `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2" stroke-linecap="round"/>`, { lift: 1 }), [999, () => W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'gc')]] }),
    // トトリムク: どんぐりのこんにゃく状のムクを切り、レタス・きゅうり・にんじん（お好みで）と唐辛子の醤油だれで和える
    kr_dotorimuk: p => { const D = plate(p), o = D.o;
        const it = [];
        W.spots('dtl', 6, 54, 26).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v); it.push([y - 20, () => lettuce(p, x, y, 32, r, i)]); });
        W.spots('dt', 12, 48, 18).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 6); it.push([y, () => Q.prism(p, x, y, [[-11, -5], [11, -5], [11, 5], [-11, 5]], 7, '#6a4030', { rot: r, top: Q.rg(p, [[0, '#9a6a52'], [.6, '#7a4a36'], [1, '#5a3424']], .4, .35, .8), line: .5 }) + `<ellipse cx="${f(x - 3)}" cy="${f(y - 7)}" rx="3" ry="1" fill="#fff" opacity=".4"/>`]); });
        W.spots('dtc', 8, 50, 16).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 8); it.push([y + 2, () => i % 2 ? W.pepperStrip(p, x, y, 12, r, '#3f7a2a') : `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2" stroke-linecap="round"/>`]); });
        return D.s + byDepth(it) + W.gochugaru(p, 100, 92, 40, 30, 'dt') + W.sesame(p, 100, 92, 40, 26, 'dt'); },
    // エホバクポックム: ズッキーニの半月切りをアミの塩辛（または塩）とにんにくで炒める、玉ねぎ・青ねぎ（お好みで）、ごま
    kr_aehobakbokkeum: p => W.inBowl(p, bc(p), { R: 66, H: 24, base: '#c8d890', items: (o, R, H) => [...W.onHill(o, 'ah', 22, R * .95, 12, H, (x, y, r, i) => i % 6 === 5 ? W.onionStrip(x, y, 12, r) : zuke(p, x, y, 11, r)), [999, () => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 10, 'ahn', '#4a9a2c', { ry: 12, s: 1.5 }) + W.sesame(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'ah')]] }),
    // 目玉焼きの醤油がけ（ケランフライ）: 目玉焼きに醤油とごま油、青ねぎ（お好みで）、ごま
    kr_gyeranfry: p => { const D = plate(p), o = D.o; const [x1, y1] = P(o, -22, -10), [x2, y2] = P(o, 24, 14);
        return D.s + W.friedEgg(p, x1, y1, 62, 1, { sy: SYF }) + W.friedEgg(p, x2, y2, 62, 2, { sy: SYF }) + `<path d="${Q.blob(x1 + 14, y1 + 8, 8, 3, 'gs1')}" fill="#6a2e12" opacity=".8"/><path d="${Q.blob(x2 - 12, y2 + 8, 8, 3, 'gs2')}" fill="#6a2e12" opacity=".8"/>` + W.flecks(p, 100, 96, 44, 14, 'gfn', '#4a9a2c', { ry: 24, s: 1.6 }) + W.sesame(p, 100, 96, 44, 20, 'gf'); },

    // ---------- 汁物 ----------
    // テンジャンチゲ: 豆腐・ズッキーニ・じゃがいも・玉ねぎを味噌で煮る、青唐辛子（お好みで）・青ねぎ
    kr_doenjangjjigae: p => jjigae(p, '#a8743a', (pl, S) => [
        ...[[-26, -10], [6, -18], [28, 4], [-6, 14]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => tofu(p, x, y, 17, i * 20, '#a8743a')]; }),
        ...W.spots('dzz', 6, 56, 14).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => zuke(p, x, y, 9, r, '#a8743a')]; }),
        ...W.spots('dzp', 4, 52, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => potato(p, x, y, 10, i, '#a8743a')]; }),
        ...negis(pl, 'dzn', 8, 54), ...W.spots('dzc', 4, 46, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .2, () => chili(x, y, i)]; }),
    ], { oil: 4, oilC: '#e8b040' }),
    // キムチチゲ: 熟成キムチと豚肉・豆腐・玉ねぎ、青ねぎ
    kr_kimchijjigae: p => jjigae(p, '#c8401e', (pl, S) => [
        ...W.spots('kjk', 9, 56, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => W.kimchi(p, x, y, 18, r, i)]; }),
        ...[[-24, -8], [14, -16], [24, 12]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + 1, () => tofu(p, x, y, 17, i * 20, '#c8401e')]; }),
        ...W.spots('kjp', 4, 50, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => meat(p, x, y, 16, r, i, '#d8885a', '#f6d8c0')]; }),
        ...negis(pl, 'kjn', 8, 54),
    ]),
    // ミヨックッ（わかめスープ）: わかめと牛肉をごま油で炒めて煮る（白い磁器の鉢）
    kr_miyeokguk: p => guk(p, '#a8743a', (pl, S) => [
        ...W.spots('mg', 10, 60, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => seaweed(p, x, y, 30, r, i)]; }),
        ...W.spots('mgb', 6, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => beefBit(p, x, y, 8, i, '#a8743a')]; }),
    ], { oil: 10, oilC: SESOIL }),
    // スンドゥブチゲ: やわらかい豆腐・あさり（お好みで）・豚肉（お好みで）・卵・玉ねぎ・青ねぎ、唐辛子
    kr_sundubujjigae: p => jjigae(p, '#d0401e', (pl, S) => [
        ...[[-24, -6], [10, -14], [-4, 14], [30, 8]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => softTofu(p, x, y, 26, i)]; }),
        ...[[-40, 10], [40, -8]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => clam(p, x, y, 14, i * 50)]; }),
        [S.cy + 2, () => { const [x, y] = pl(8, 2, 2); return W.friedEgg(p, x, y, 26, 1, { crisp: false, yolk: '#f6b028' }); }],
        ...negis(pl, 'sbn', 8, 54), ...W.spots('sbc', 3, 46, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .2, () => chili(x, y, i)]; }),
    ]),
    // プデチゲ: スパム・フランクフルト・キムチ・豆腐（お好みで）・玉ねぎ・青ねぎ、インスタント麺（お好みで）を黄色いアルミの鍋で
    kr_budaejjigae: p => { const V = Q.pan(p, { rx: 88, cy: 92, h: 26, outer: '#d8b04a', lip: '#ecc868', inner: '#c8a040', handles: 'loop', handleC: '#5a3a24', rim: '#b89038' });
        return W.soup(p, V, { c: '#c8401e', drop: 6, glow: .25, oil: 10, oilC: '#e8602a', items: (pl, S) => [
            [S.cy - 2, () => { let s = ''; const R = rng('rm'); for (let i = 0; i < 26; i++){ const x = S.cx - 16 + (R() - .5) * 40, y = S.cy - 2 + (R() - .5) * 14; s += `<path d="M${f(x - 8)},${f(y)} q2,-3 4,0 t4,0 t4,0 t4,0" stroke="#f2d890" stroke-width="2" fill="none" stroke-linecap="round"/>`; } return s; }],
            ...[[-44, -6], [-34, 12], [40, -12]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 16, '#e8a090', 'sp' + i, { h: 4, top: Q.lit(p, '#f2b8a8', .3, .1) })]; }),
            ...[[16, 12], [30, 0], [4, 22], [44, 14]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.sausageCoin(p, x, y, 6.4, { c: '#c8603a', inner: '#e8a080' })]; }),
            ...W.spots('bjk', 5, 54, 18, { cu: -10, cv: 10 }).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => W.kimchi(p, x, y, 16, r, i)]; }),
            ...negis(pl, 'bjn', 7, 54),
        ] }); },
    // コンナムルクッ: 豆もやしのすまし汁、青ねぎ、唐辛子（お好みで）
    kr_kongnamulguk: p => guk(p, '#efe2b8', (pl, S) => [
        ...W.spots('kg', 22, 60, 9).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.sprout(p, x, y, 20, r)]; }),
        ...negis(pl, 'kgn', 10, 56), ...W.spots('kgc', 3, 46, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .2, () => chili(x, y, i)]; }),
    ], { glow: .45 }),
    // ソコギムックッ: 牛肉と大根のすまし汁、青ねぎ
    kr_sogogimuguk: p => guk(p, '#d8b878', (pl, S) => [
        ...W.spots('sm', 9, 58, 15).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => radish(p, x, y, 13, i, '#d8b878')]; }),
        ...W.spots('smb', 6, 50, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => beefBit(p, x, y, 8, i, '#d8b878')]; }),
        ...negis(pl, 'smn', 10, 56),
    ], { oil: 6, oilC: SESOIL }),
    // プゴクッ: 干しスケトウダラの裂きを炒めて煮る、卵、大根（お好みで）、青ねぎ
    kr_bugeoguk: p => guk(p, '#f0e2c0', (pl, S) => [
        ...W.spots('bgf', 14, 56, 11).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.pepperStrip(p, x, y, 16, r, '#e8d4b0')]; }),
        ...W.spots('bgr', 4, 54, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => radish(p, x, y, 11, i, '#f0e2c0')]; }),
        ...[[-14, -4], [18, 8]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => egg(p, x, y, 26, i)]; }),
        ...negis(pl, 'bgn', 8, 56),
    ], { oil: 6, oilC: SESOIL }),
    // ケランクッ: 溶き卵のすまし汁、玉ねぎ（お好みで）、青ねぎ
    kr_gyeranguk: p => guk(p, '#e8d49a', (pl, S) => [
        ...[[-26, -8], [8, -14], [26, 8], [-8, 14]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => egg(p, x, y, 30, i)]; }),
        ...W.spots('gko', 4, 52, 20).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.onionStrip(x, y, 12, r, '#f2e8c8')]; }),
        ...negis(pl, 'gkn', 12, 56),
    ], { oil: 3, oilC: SESOIL }),
    // オムクタン: 練り物の串を、煮干しと昆布のだしで大根と煮る、青ねぎ、唐辛子（お好みで）
    kr_eomuktang: p => guk(p, '#e8d4a0', (pl, S) => [
        ...[[-10, -14, -14], [8, 10, -8]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 3); return [y, () => skewer(p, x, y, 56, r, i, '#e8d4a0')]; }),
        ...[[-40, 12], [40, -6]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => radish(p, x, y, 14, i, '#e8d4a0')]; }),
        ...negis(pl, 'otn', 8, 56), ...W.spots('otc', 3, 46, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .2, () => chili(x, y, i)]; }),
    ]),
    // ユッケジャン: 牛肉を裂いて、長ねぎ・もやし・わらび（お好みで）・ひらたけ（お好みで）と辛く煮る、卵（お好みで）
    kr_yukgaejang: p => guk(p, '#c03a1a', (pl, S) => [
        ...W.spots('yb', 10, 56, 13).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.pepperStrip(p, x, y, 18, r, '#8a4a2a')]; }),
        ...W.spots('yd', 8, 58, 14).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.pod(p, x, y, 24, r, { c: '#4a8a2a', w: 3.6 })]; }),
        ...W.spots('ys', 6, 56, 14).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.sprout(p, x, y, 16, r)]; }),
        [S.cy + 3, () => egg(p, S.cx + 10, S.cy + 4, 22, 1)],
    ], { oil: 14, oilC: '#e8602a' }),
    // サムゲタン: 若鶏にもち米・なつめ・高麗人参（お好みで）・にんにくを詰めて煮る、青ねぎ（石鍋のまま）
    kr_samgyetang: p => W.soup(p, W.ttukbaegi(p), { c: '#f2e8cc', drop: 7, glow: .5, gl: .5, steamOp: .5, items: (pl, S) => [
        [S.cy - 4, () => { const x = S.cx, y = S.cy + 2; return Q.lump(p, x, y - 4, 44, 26, '#f2dcb4', 'sgc', { n: 12, jit: .08, hi: .5 }) + `<path d="M${f(x - 44)},${f(y - 2)} q-8,-12 2,-18" stroke="#e8cfa4" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${f(x + 42)},${f(y - 2)} q10,-10 2,-18" stroke="#e8cfa4" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${f(x - 20)},${f(y - 20)} Q${f(x)},${f(y - 30)} ${f(x + 20)},${f(y - 20)}" stroke="#d8bc8a" stroke-width="1.2" fill="none"/>`; }],
        ...[[-46, 8], [46, 10], [0, 22]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 20, () => Q.lump(p, x, y, 4.6, 3.6, '#a8281e', 'jj' + i, { hi: .6 })]; }),
        ...[[-30, 18], [30, 20]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + 20, () => Q.lump(p, x, y, 4, 3.4, '#f6ecd4', 'ga' + i, { hi: .6 })]; }),
        [S.cy + 20, () => { const [x, y] = pl(-16, 12, 6); return `<path d="M${f(x)},${f(y)} q14,-4 24,-14" stroke="#e8c890" stroke-width="3.2" fill="none" stroke-linecap="round"/>`; }],
        ...negis(pl, 'sgn', 8, 56).map(([y, fn]) => [y + 30, fn]),
    ] }),
    // カルビタン: 牛の骨つきカルビと大根のすまし汁、春雨（お好みで）、青ねぎ（真鍮の器）
    kr_galbitang: p => guk(p, '#e0c888', (pl, S) => [
        ...[[-24, -8, 20], [18, -12, 160], [4, 14, 200]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.rib(p, x, y, 28, r, i, { c: '#8a5a3a', glaze: '#a87a4a' })]; }),
        ...[[-42, 10], [42, 4]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => radish(p, x, y, 14, i, '#e0c888')]; }),
        [S.cy - 2, () => { let s = ''; const R = rng('gm'); for (let i = 0; i < 10; i++){ const x = S.cx + (R() - .5) * 70, y = S.cy + (R() - .5) * 26; s += `<path d="M${f(x - 10)},${f(y)} q6,-4 12,0 t10,0" stroke="#d8c8a0" stroke-width="1.4" fill="none" opacity=".8"/>`; } return s; }],
        ...negis(pl, 'gtn', 10, 56),
    ], { V: W.yugi }),
    // トックッ: 薄切りの餅と牛肉のすまし汁に、錦糸卵・青ねぎ、のり（お好みで）（真鍮の器）
    kr_tteokguk: p => guk(p, '#efe0b8', (pl, S) => [
        ...W.spots('tg', 16, 58, 13).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => W.tteokOval(p, x, y, 20, r)]; }),
        ...W.spots('tgb', 4, 46, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y + 1, () => beefBit(p, x, y, 8, i)]; }),
        [999, () => `${[-10, -4, 2, 8].map((k, i) => `<path d="M${f(S.cx - 8 + k)},${f(S.cy - 8)} l14,${f(2 - i)}" stroke="#f6c830" stroke-width="2" stroke-linecap="round"/>`).join('')}` + gim(S.cx + 4, S.cy - 6, 9, 'tg')],
        ...negis(pl, 'tgn', 6, 56),
    ], { V: W.yugi }),
    // マンドゥクッ: 肉の餃子（マンドゥ）のすまし汁に、卵・青ねぎ、のり（お好みで）
    kr_manduguk: p => guk(p, '#e8d49a', (pl, S) => [
        ...[[-26, -10, -10], [10, -16, 20], [30, 8, -20], [-10, 12, 10]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => `<g ${T(x, y, r)}>${Q.cast(p, 0, 6, 16, 4, .3)}<path d="M-17,4 Q-16,-12 0,-12 Q16,-12 17,4 Q0,9 -17,4Z" fill="${Q.rg(p, [[0, '#fffbf0'], [.6, '#f4ecd8'], [1, '#d8c8a8']], .4, .3, .8)}" stroke="#c8b898" stroke-width=".6"/>${[-10, -4, 2, 8].map(u => `<path d="M${u},-11 q2,3 0,6" stroke="#d8c8a8" stroke-width=".8" fill="none"/>`).join('')}</g>`]; }),
        [S.cy + 4, () => egg(p, S.cx - 30, S.cy + 10, 20, 1)],
        [999, () => gim(S.cx + 4, S.cy - 6, 8, 'md')],
        ...negis(pl, 'mdn', 8, 56),
    ]),
    // シグムチテンジャンクッ: ほうれん草の味噌汁、豆腐（お好みで）、青ねぎ
    kr_sigeumchidoenjangguk: p => guk(p, '#b88a4a', (pl, S) => [
        ...W.spots('sd', 10, 58, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 26, r, i % 2 ? '#2f6a2a' : '#3f7a2e', 'sd' + i, { wave: 2.4 })]; }),
        ...[[-20, 8], [18, -10], [30, 14]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => tofu(p, x, y, 13, i * 20, '#b88a4a')]; }),
        ...negis(pl, 'sdn', 8, 56),
    ]),
    // トンテチゲ: 冷凍スケトウダラと大根・豆腐（お好みで）を辛く煮る、春菊（お好みで）・青ねぎ・唐辛子
    kr_dongtaejjigae: p => jjigae(p, '#c8401e', (pl, S) => [
        ...[[-22, -8, -10], [18, -12, 20], [4, 14, 0]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => fishChunk(p, x, y, 26, r, i, { liq: '#c8401e' })]; }),
        ...[[-44, 8], [40, 10]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => radish(p, x, y, 13, i, '#c8401e')]; }),
        ...[[34, -16]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => tofu(p, x, y, 14, 10, '#c8401e')]; }),
        ...W.spots('dtz', 4, 50, 20).map(([u, v, r], i) => { const [x, y] = pl(u, v, 3); return [y + 2, () => Q.leaf(p, x, y, 20, r, '#3f8a2a', 'ss' + i, { wave: 3 })]; }),
        ...negis(pl, 'dtn', 6, 54),
    ]),
    // コチュジャンチゲ: 豚肉・じゃがいも・ズッキーニ・玉ねぎをコチュジャンで煮る、豆腐（お好みで）、青ねぎ
    kr_gochujangjjigae: p => jjigae(p, '#c84a24', (pl, S) => [
        ...W.spots('gjp', 5, 54, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => potato(p, x, y, 12, i, '#c84a24')]; }),
        ...W.spots('gjz', 6, 56, 14).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => zuke(p, x, y, 9, r, '#c84a24')]; }),
        ...W.spots('gjm', 4, 50, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => meat(p, x, y, 15, r, i, '#d8885a', '#f6d8c0')]; }),
        ...[[30, -14]].map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => tofu(p, x, y, 14, 10, '#c84a24')]; }),
        ...negis(pl, 'gjn', 7, 54),
    ]),
    // チョングッチャンチゲ: 納豆に似た味噌でキムチ・豆腐・豚肉（お好みで）・ズッキーニ（お好みで）を煮る、青ねぎ
    kr_cheonggukjangjjigae: p => jjigae(p, '#9a6a34', (pl, S) => [
        ...W.spots('cgb', 18, 58, 8).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => Q.bean(p, x, y, 6.4, r, '#c8a060')]; }),
        ...W.spots('cgk', 5, 54, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => W.kimchi(p, x, y, 16, r, i, { c: '#c8603a' })]; }),
        ...[[-14, -4], [22, 6]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => tofu(p, x, y, 15, i * 20, '#9a6a34')]; }),
        ...W.spots('cgz', 3, 50, 20).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => zuke(p, x, y, 8, r, '#9a6a34')]; }),
        ...negis(pl, 'cgn', 7, 54),
    ], { oil: 4, oilC: '#e8b040' }),
    // オジンオムックッ: いかと大根の辛いスープ、青ねぎ、唐辛子（お好みで）
    kr_ojingeomuguk: p => guk(p, '#c8502a', (pl, S) => [
        ...W.spots('om', 7, 56, 17).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => `<g ${T(x, y, r)}><ellipse rx="8" ry="5" fill="none" stroke="${Q.lg(p, [[0, '#fbece0'], [1, '#e0b8a0']])}" stroke-width="3.2"/><ellipse rx="8" ry="5" fill="none" stroke="#c89078" stroke-width=".5"/></g>`]; }),
        ...W.spots('omr', 7, 58, 15).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => radish(p, x, y, 11, i, '#c8502a')]; }),
        ...negis(pl, 'omn', 8, 56), ...W.spots('omc', 3, 46, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .2, () => chili(x, y, i)]; }),
    ], { oil: 8, oilC: '#e8602a' }),
    // カムジャクッ: じゃがいもと玉ねぎのすまし汁、卵（お好みで）、青ねぎ
    kr_gamjaguk: p => guk(p, '#e8d4a0', (pl, S) => [
        ...W.spots('gp', 9, 58, 15).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => Q.hangetsu(p, x, y, 8, i * 40, '#f0d690', '#e8d4a0', { h: 3, top: Q.rg(p, [[0, '#fff6d0'], [1, '#e8c878']], .4, .35, .8) })]; }),
        ...W.spots('gpo', 4, 52, 20).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.onionStrip(x, y, 12, r, '#f2e8c8')]; }),
        [S.cy + 2, () => egg(p, S.cx + 14, S.cy + 4, 22, 1)],
        ...negis(pl, 'gpn', 10, 56),
    ]),
    // コンビジチゲ: 大豆をすりつぶして、キムチと豚肉と煮る、青ねぎ（石鍋のまま）
    kr_kongbijijjigae: p => jjigae(p, '#f0e2c0', (pl, S) => [
        [S.cy - 4, () => `<g ${S.inside}>${Array.from({ length: 9 }, (_, i) => { const a = i / 9 * 6.28, d = 20 + (i % 3) * 14; return `<ellipse cx="${f(S.cx + Math.cos(a) * d)}" cy="${f(S.cy + Math.sin(a) * d * SY)}" rx="${12 + i % 3 * 3}" ry="6" fill="#fbf6e6" opacity=".8"/>`; }).join('')}</g>`],
        ...W.spots('kbk', 6, 54, 18).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => W.kimchi(p, x, y, 16, r, i)]; }),
        ...W.spots('kbm', 3, 46, 20).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => meat(p, x, y, 15, r, i, '#d8885a', '#f6d8c0')]; }),
        ...negis(pl, 'kbn', 7, 54),
    ], { oil: 3, oilC: '#e8602a' }),
    // オイネングッ: きゅうりの冷たい酢のスープ、わかめ・赤玉ねぎ・赤唐辛子（お好みで）、ごま、氷
    kr_oinaengguk: p => guk(p, '#f2ecc8', (pl, S) => [
        ...W.spots('on', 14, 58, 11).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.pepperStrip(p, x, y, 18, r, '#5a9a3a')]; }),
        ...W.spots('onw', 4, 54, 20).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => seaweed(p, x, y, 20, r, i)]; }),
        ...[[-30, -10], [24, -14], [8, 16]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y + 1, () => Q.prism(p, x, y, Q.square(14), 9, '#eef2ee', { rot: i * 25, top: Q.lg(p, [[0, '#ffffff', .9], [1, '#e2e8e2', .8]], 0, 0, 1, 1), line: .5 })]; }),
        ...W.spots('onr', 4, 50, 18).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.onionStrip(x, y, 10, r, '#c87aa8')]; }),
        [999, () => W.sesame(p, S.cx, S.cy, 44, 18, 'on')],
    ], { glow: .5 }),
};
