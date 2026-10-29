// ベトナム（vn_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 炒め物・揚げ物・和え物は若草（緑）の縁の白い平皿（主食の器のベトナム＝緑にそろえる）、汁物（canh）は緑の線の白い大きな碗、
// 煮つけ（kho）は土鍋、漬物・小さな副菜は白い小鉢、蒸し魚は楕円皿。バッチャン焼きの藍は描かない。
// 材料は gohancho/packs/vn.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, T, rng, smooth, lt, dk, mix, SY, CZ, SYF, SHADE, at, byDepth } = W;

// =========================================================
// ベトナムの器と部品
// =========================================================
const GREEN = Q.RIM.wakakusa, KHO = '#7a3414';
const P = (o, u, v, z = 0) => at(o, u, v, z);
const plate = (p, o = {}) => Q.plate(p, { line: 'none', edge: GREEN, ...o });
const oval = (p, o = {}) => Q.ovalPlate(p, { rim: GREEN, rz: 70, h: 14, ...o });
const bowl = (p, o = {}) => Q.shiroBowl(p, { rim: GREEN, ...o });
const smallBowl = (p, o = {}) => W.sideBowl(p, { outer: '#f4f1ea', inner: '#fbf9f4', edge: GREEN, ...o });
const claypot = (p, o = {}) => Q.donabe(p, { h: 46, cy: 86, rx: 88, ...o });
const deep = (p, o = {}) => Q.fukazara(p, { line: GREEN, ...o });
// 具
const herbs = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'hb' + seed, ['#3f8a2a', '#6ab048'], { ry: rx * .45, s: 1.6 });
const peanuts = (p, x, y, rx, n, seed) => W.flecks(p, x, y, rx, n, 'pn' + seed, ['#d8a868', '#c89050', '#e8c088'], { ry: rx * .45, s: 1.8 });
const negis = (pl, seed, n, R, c = '#4a9a2c') => W.spots(seed, n, R, 8).map(([u, v]) => { const [x, y] = pl(u, v); return [y + .1, () => Q.negi(null, x, y, 5, c)]; });
const chiliRing = (x, y, i) => W.chiliRing(x, y, 2.8, i % 3 ? '#d8281a' : '#3f8f2f');
const lime = (p, x, y, s, r = -14) => W.lemon(p, x, y, s, { wedge: true, rot: r, c: '#8ab83a' });
const meat = (p, x, y, s, r, i, c = '#b0703e', fat = '#eac8a0') => Q.slice3q(p, x, y, s, r, { c, fat, seed: i, gloss: .7, char: false }, { sq: .5 });
const porkBelly = (p, x, y, s, r, i, glaze = true) => Q.prism(p, x, y, Q.square(s), s * .7, glaze ? '#8a3a1a' : '#e8c8b0', { rot: r, top: glaze ? Q.lg(p, [[0, '#c86a3a'], [.5, '#a84a22'], [1, '#7a2e10']], 0, 0, 1, 1) : Q.lg(p, [[0, '#fbf2ea'], [.4, '#e8b8a8'], [.6, '#fbf0e4'], [1, '#d8a090']], 0, 0, 0, 1), line: .55 });
const shrimpP = (p, x, y, s, r) => W.shrimp(p, x, y, s, r);
const prawn = (p, x, y, s, r, fl = 1) => Q.prawn3q(p, x, y, s, r, fl, { c: '#e8602a' });
const rib = (p, x, y, s, r, i, c = '#c89a72', g = '#d8b088') => W.rib(p, x, y, s, r, i, { c, glaze: g });
const tomatoW = (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, s * .2], [0, -s * .35], [s / 2, s * .2], [0, s * .32]], s * .4, '#c8301e', { rot: r, top: Q.rg(p, [[0, '#ff8a6a'], [.6, '#e0402a'], [1, '#a82a1a']], .4, .35, .8), line: .5 });
const woodEar = (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#3a2a22', 'we' + i, { wave: 3, vein: false });
const dill = (x, y, r) => `<g ${T(x, y, r)}>${[-5, -2, 1, 4].map((d, k) => `<path d="M0,0 l${d},-7 M${d * .6},-4 l${k % 2 ? 2 : -2},-2" stroke="#5a9a3a" stroke-width=".8" fill="none"/>`).join('')}</g>`;
const lemongrass = (p, x, y) => W.coin(p, x, y, 4, '#c8d898', { h: 1.4, top: Q.rg(p, [[0, '#f6f8d8'], [1, '#c8d898']], .4, .35, .8) });
const ball = (p, x, y, s, c, i) => W.ball(p, x, y, s, c, 'b' + i, { hi: .6 });
const tofu = (p, x, y, s, r, c = '#e8b048') => Q.prism(p, x, y, [[-s / 2, -s * .4], [s / 2, -s * .4], [s / 2, s * .4], [-s / 2, s * .4]], s * .5, c, { rot: r, top: Q.rg(p, [[0, lt(c, .35)], [.6, c], [1, dk(c, .15)]], .4, .35, .8), line: .5 });
const cucumber = (p, x, y, r = 7) => W.coin(p, x, y, r, '#3f7a2a', { h: 1.6, top: Q.rg(p, [[0, '#f8faea'], [.6, '#e8f0d0'], [.85, '#c8dca0'], [1, '#3f7a2a']], .4, .35, .8) });
const greensLeaf = (p, x, y, s, r, i, c = '#3f7a2a') => Q.leaf(p, x, y, s, r, c, 'gl' + i, { wave: 2.6 });
const dipBowl = (p, x, y, c = '#c8a060', s = 14) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${s}" ry="${f(s * SY)}" fill="#f4f1ea" stroke="${GREEN}" stroke-width=".8"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${s - 3}" ry="${f((s - 3) * SY)}" fill="${c}"/>` + W.flecks(p, x, y, s - 5, 6, 'db' + x, ['#d8281a', '#f2e8c8'], { ry: 2, s: .8 });
// ---------- 組み立て ----------
const plateHeap = (p, D, seed, n, R, minD, H, draw, { sauce = null, sauceR = 34 } = {}) => { R *= .92; H += 5; return D.s + (sauce ? W.pool(p, D.o.cx + 4, D.o.cy + 8, sauceR, sauce, seed) : '') + byDepth(W.spots(seed, Math.round(n * 1.3), R, minD * .85).map(([u, v, r], i) => { const [x, y] = P(D.o, u, v, 4 + W.hill(u, v, R, H)); return [y, () => draw(x, y, r, i)]; })); };
const heapBowl = (p, seed, n, minD, H, draw, { base = null, R = 64, after = () => '' } = {}) => W.inBowl(p, smallBowl(p), { R, H, base, items: (o, RR, HH) => [...W.onHill(o, seed, n, RR * .95, minD, HH, draw), [999, () => after(o, HH)]] });
const canh = (p, c, items, o = {}) => W.soup(p, o.V ? o.V(p) : bowl(p), { c, drop: 10, glow: .35, gl: .5, items, ...o });
// 土鍋の煮つけ（kho）: 煮汁は少なく、具を山に
const kho = (p, seed, n, minD, H, draw, c = KHO) => W.heap(p, claypot(p), { c, drop: 14, H, R: 56, srx: 60, items: (pl) => [...W.spots(seed, n, 52, minD), ...W.spots(seed + '2', Math.round(n / 3), 26, minD).map(([u, v, r]) => [u, v, r, H * .35])].map(([u, v, r, z = 0], i) => { const [x, y] = pl(u, v, z); return [y, () => draw(x, y, r, i)]; }) });

// =========================================================
// 品
// =========================================================
export default {
    // ---------- 主菜 ----------
    // ティットコー・チュン（豚バラと卵のココナッツ煮）: 豚バラ・ゆで卵をココナッツ水と魚醤で照りよく（土鍋）
    vn_thitkhotrung: p => kho(p, 'tk', 12, 16, 26, (x, y, r, i) => i % 3 === 2 ? Q.lump(p, x, y, 11, 8.6, '#c8864a', 'te' + i, { n: 12, jit: .06, hi: .7 }) : porkBelly(p, x, y, 16, r, i) + Q.shine(x - 3, y - 12, 8, -8, .8)),
    // カーコー（魚の煮つけ）: なまずの切り身を魚醤とカラメルで煮つける、青ねぎ・唐辛子（お好みで）（土鍋）
    vn_cakho: p => kho(p, 'ck', 5, 28, 18, (x, y, r, i) => W.coin(p, x, y, 16, '#8a5a3a', { h: 9, sy: SY, top: Q.rg(p, [[0, '#c8864a'], [.3, '#9a5a2a'], [.6, '#c87a4a'], [1, '#6a3414']], .4, .35, .8) }) + `<ellipse cx="${f(x)}" cy="${f(y - 9 * CZ)}" rx="4" ry="2.6" fill="#e8d8c0"/>` + Q.shine(x - 6, y - 14, 10, -8, .8)) + W.flecks(p, 100, 66, 40, 20, 'ckn', ['#4a9a2c', '#d8281a', '#3a1a0a'], { ry: 14, s: 1.6 }),
    // ガーランギュン（鶏の生姜炒め）: 骨つきの鶏・生姜・青ねぎ
    vn_garang: p => plateHeap(p, plate(p), 'gr', 18, 46, 13, 14, (x, y, r, i) => i % 4 === 3 ? `<g ${T(x, y, r)}><path d="M-7,0 L7,0" stroke="#f0d890" stroke-width="2.2" stroke-linecap="round"/></g>` : Q.soakLump(p, x, y, 20, i, { c: '#c8803a', soak: '#7a3414', k: .5, sy: .72 }), { sauce: KHO }) + herbs(p, 100, 88, 36, 14, 'gr'),
    // ボーサオ（牛肉と玉ねぎ炒め）: 牛肉・玉ねぎ・トマト・青ねぎ
    vn_boxao: p => plateHeap(p, plate(p), 'bx', 26, 48, 10, 14, (x, y, r, i) => { const k = i % 4; return k < 2 ? meat(p, x, y, 20, r, i, '#6a3a1e', '#8a5a3a') : k === 2 ? W.onionStrip(x, y, 14, r) : tomatoW(p, x, y, 12, r); }, { sauce: '#7a3a1a' }) + herbs(p, 100, 88, 36, 12, 'bx'),
    // ダウフースオット（揚げ豆腐のトマト煮）、青ねぎ（深皿）
    vn_dauphusotca: p => W.soup(p, deep(p), { c: '#d8502a', drop: 4, glow: .3, items: (pl, S) => [...[[-22, -8], [10, -14], [32, 2], [-14, 12], [16, 16]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => tofu(p, x, y, 18, i * 15)]; }), ...negis(pl, 'dpn', 10, 50)] }),
    // トムリム（えびのカラメリゼ）: 殻つきのえびを魚醤と砂糖で照りよく、青ねぎ
    vn_tomrim: p => { const D = plate(p), o = D.o; return D.s + W.pool(p, 104, 108, 40, '#a8401a', 'tr') + byDepth([[-30, -18, 10, 1], [10, -24, -10, -1], [36, -6, 20, 1], [-20, 8, -20, -1], [16, 14, 10, 1], [-38, 30, 0, 1], [30, 32, -10, -1]].map(([u, v, r, fl]) => { const [x, y] = P(o, u, v, 4); return [y, () => prawn(p, x, y, 26, r, fl)]; })) + herbs(p, 100, 92, 40, 14, 'tr'); },
    // スオンラム（スペアリブの甘じょっぱい煮つけ）、青ねぎ
    vn_suonram: p => plateHeap(p, plate(p), 'sr', 12, 46, 20, 14, (x, y, r, i) => rib(p, x, y, 22, r, i, '#8a3a18', '#c8602a') + Q.shine(x - 4, y - 4, 8, -8, .8), { sauce: '#7a3014', sauceR: 44 }) + herbs(p, 100, 88, 36, 14, 'sr'),
    // ティットランチャイ（縁をこんがりさせた豚バラ）、青ねぎ
    vn_thitrangchay: p => plateHeap(p, plate(p), 'rc', 20, 46, 12, 12, (x, y, r, i) => meat(p, x, y, 20, r, i, '#a85a2a', '#f0c8a0')) + herbs(p, 100, 88, 36, 14, 'rc'),
    // ティットルオック（ゆで豚）とにんにく唐辛子の魚醤、きゅうり・ハーブ（お好みで）
    vn_thitluoc: p => { const D = plate(p), o = D.o; return D.s + byDepth([-18, -8, 2, 12, 22].map((v, i) => { const [x, y] = P(o, -14 + i * 6, v - 6); return [y, () => Q.prism(p, x, y, [[-28, -5], [28, -5], [28, 5], [-28, 5]], 4, '#e8d8c8', { rot: -14, top: Q.lg(p, [[0, '#fbf4ec'], [.3, '#f2dcd0'], [.45, '#c8908a'], [.6, '#f6ece0'], [.75, '#d8a49a'], [1, '#a86a5a']], 0, 0, 0, 1), line: .5 })]; })) + [[40, 30], [50, 16]].map(([u, v]) => cucumber(p, ...P(o, u, v), 7)).join('') + Q.leaf(p, ...P(o, -44, 28), 22, 30, '#6a3a5a', 'ps', { wave: 2 }) + dipBowl(p, ...P(o, 10, 40), '#d8a050'); },
    // シウマイ（豚団子のトマト煮）: 豚の団子・トマト・玉ねぎ、きくらげ（お好みで）、青ねぎ（深皿）
    vn_xiumai: p => W.soup(p, deep(p), { c: '#c8401e', drop: 4, glow: .3, items: (pl, S) => [...W.spots('xm', 8, 48, 22).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => ball(p, x, y - 4, 22, '#c8865a', i)]; }), ...negis(pl, 'xmn', 8, 50)] }),
    // チャートゥン（卵と豚ひき肉の蒸し焼き）: 春雨・きくらげ・青ねぎ入り、表面に卵黄
    vn_chatrung: p => { const D = plate(p); return D.s + W.jeon(p, 100, 100, 56, 1, { c: '#e8a840', h: 10 }) + W.flecks(p, 100, 96, 44, 50, 'ct', ['#c8946a', '#3a2a22', '#4a9a2c', '#f2e8c8'], { ry: 26, s: 1.6 }) + Q.shine(76, 84, 22, -8, .7); },
    // ガーチエンヌックマム（手羽の魚醤揚げ）、唐辛子（お好みで）
    vn_gachiennuocmam: p => plateHeap(p, plate(p), 'gc', 10, 46, 22, 10, (x, y, r, i) => W.crusty(p, x, y, 14, 9, i, { c: '#b8601e', n: 14, h: 6, rot: r }) + `<circle cx="${f(x + 12)}" cy="${f(y)}" r="2" fill="#f4ecd8"/>`) + W.flecks(p, 100, 88, 40, 16, 'gcg', ['#f2e8c8', '#d8281a'], { ry: 20, s: 1.4 }),
    // ガーサオサー（鶏のレモングラスと唐辛子炒め）、玉ねぎ（お好みで）
    vn_gaxaosa: p => plateHeap(p, plate(p), 'gs', 22, 46, 11, 14, (x, y, r, i) => i % 4 === 3 ? W.onionStrip(x, y, 12, r) : Q.soakLump(p, x, y, 18, i, { c: '#d8a040', soak: '#a8601e', k: .4, sy: .72 })) + W.flecks(p, 100, 88, 40, 40, 'gsl', ['#e8e8b0', '#c8d898', '#d8281a'], { ry: 20, s: 1.6 }),
    // ボールックラック（シェイキングビーフ）: 牛の角切り・パプリカ・玉ねぎ、レタス（クレソン）・トマト（お好みで）
    vn_boluclac: p => { const D = plate(p), o = D.o; return D.s + byDepth(W.spots('blv', 6, 50, 24).map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y - 20, () => Q.leaf(p, x, y, 32, r, i % 2 ? '#7ab848' : '#5a9a34', 'bl' + i, { wave: 3.4 })]; }).concat(W.spots('bl', 18, 38, 11).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 10 + W.hill(u, v, 40, 10)); const k = i % 4; return [y, () => k < 2 ? W.dice(p, x, y, 12, '#5a2a14', 'bc' + i, { h: 8, top: Q.rg(p, [[0, '#9a5a3a'], [.6, '#6a3418'], [1, '#4a2010']], .4, .35, .8) }) : k === 2 ? W.pepperStrip(p, x, y, 10, r, '#d8302a') : W.onionStrip(x, y, 10, r, '#c87aa8')]; }))) + [[44, 30], [-44, 26]].map(([u, v], i) => tomatoW(p, ...P(o, u, v, 6), 13, i * 40)).join(''); },
    // ボーラーロット（ハイゴショウの葉で巻いた牛肉の串焼き）、レモングラス・ピーナッツ
    vn_bolalot: p => { const D = plate(p), o = D.o; return D.s + byDepth([-20, -6, 8, 22].map((v, i) => { const [x, y] = P(o, -4, v); return [y, () => `<g ${T(x, y, -8)}><path d="M-60,0 L60,0" stroke="#d8b878" stroke-width="2.2" stroke-linecap="round"/>${[-36, -12, 12, 36].map(u => `<g transform="translate(${u} 0)"><ellipse cx="2" cy="4" rx="11" ry="4" fill="${SHADE}" opacity=".25"/><rect x="-10" y="-5" width="20" height="10" rx="5" fill="${Q.lg(p, [[0, '#6a8a3a'], [.5, '#3a5a22'], [1, '#2a3a18']], 0, 0, 0, 1)}" stroke="#1e2a12" stroke-width=".5"/><path d="M-8,-2 q8,-3 16,0" stroke="#8aa858" stroke-width=".8" fill="none"/></g>`).join('')}</g>`]; })) + peanuts(p, 100, 92, 44, 30, 'bl'); },
    // カーソットカー（揚げた魚のトマト煮）、青ねぎ（深皿）
    vn_casotca: p => W.soup(p, deep(p), { c: '#d8502a', drop: 4, glow: .3, items: (pl, S) => [...[[-20, -6, -10], [18, 8, 10]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.coin(p, x, y, 18, '#8a7a5a', { h: 9, top: Q.rg(p, [[0, '#e8b070'], [.5, '#c8823a'], [.75, '#d8603a'], [1, '#9a5a2a']], .4, .35, .8) })]; }), ...negis(pl, 'csn', 10, 50)] }),
    // チャーカー（ディル入りの魚のさつま揚げ）、青ねぎ
    vn_chaca: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-34, -18], [0, -24], [34, -18], [-30, 12], [6, 8], [40, 14]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => W.jeon(p, x, y, 16, i, { c: '#e0a848', h: 4 }) + W.flecks(p, x, y, 10, 8, 'cc' + i, ['#5a9a3a'], { ry: 6, s: 1.4 })]; })) + [[-10, 36], [20, 38]].map(([u, v], i) => dill(...P(o, u, v, 4), i * 40)).join('') + dipBowl(p, ...P(o, -40, 36), '#c8a8a0'); },
    // カーハップ（蒸し魚）: 丸ごとの魚を生姜・青ねぎ・しいたけ（お好みで）と蒸す（楕円皿）
    vn_cahap: p => { const D = oval(p, { rz: 66 }); return D.s + W.pool(p, 104, D.cy + 10, 44, '#c8a060', 'ch') + W.wholeFish(p, 100, D.cy - 2, 160, -4, 1, { skin: '#c8c4b4', belly: '#f2ece0', char: 0, H: 26 }) + byDepth(W.spots('chs', 12, 50, 9, { ry: 10 }).map(([u, v, r], i) => { const [x, y] = [100 + u, D.cy - 12 + v * .6]; return [y, () => i % 3 === 0 ? W.mushCap(p, x, y, 10, '#6a3a1a') : `<g ${T(x, y, r % 40 - 20)}><path d="M-7,0 L7,0" stroke="${i % 2 ? '#e8c870' : '#5aa83a'}" stroke-width="1.4" stroke-linecap="round"/></g>`]; })); },
    // ムックサオ（いかの甘酢炒め）: いか・パイナップル・トマト・玉ねぎ、パプリカ（お好みで）・青ねぎ
    vn_mucxao: p => plateHeap(p, plate(p), 'mx', 24, 48, 10, 14, (x, y, r, i) => { const k = i % 5; return k < 2 ? `<g ${T(x, y, r)}><rect x="-11" y="-4" width="22" height="8" rx="2" fill="${Q.lg(p, [[0, '#fbece0'], [1, '#e0b8a0']], 0, 0, 0, 1)}" stroke="#a8785a" stroke-width=".6"/>${[-6, -1, 4].map(u => `<path d="M${u},-3 l2,6" stroke="#d8a080" stroke-width="1"/>`).join('')}</g>` : k === 2 ? W.dice(p, x, y, 9, '#e8b830', 'pa' + i, { h: 4 }) : k === 3 ? tomatoW(p, x, y, 11, r) : W.onionStrip(x, y, 12, r); }, { sauce: '#d8602a' }),
    // ゲウハップサー（あさりのレモングラス蒸し）: 生姜・唐辛子、タイバジル（お好みで）（土鍋）
    vn_ngheuhapsa: p => { const V = claypot(p), o = { cx: 100, cy: V.cy + 6 }, H = 24; return V.s + `<g ${V.above}>${W.mound(p, o.cx, o.cy, 78, H * .7, '#c8b898', 'nh')}${byDepth(W.onHill(o, 'nh', 22, 72, 14, H, (x, y, r, i) => Q.clam(p, x, y, 18, r), { lift: 2 }).concat(W.onHill(o, 'nhl', 10, 60, 14, H, (x, y, r, i) => i % 3 === 0 ? lemongrass(p, x, y) : i % 3 === 1 ? chiliRing(x, y, i) : Q.leaf(p, x, y, 12, r, '#2f6a22', 'nb' + i, { wave: 1 }), { lift: 6 })))}</g>` + V.shine(.5) + Q.steam(100, 0, .45); },
    // ダウフーサオット（揚げ豆腐のレモングラスと唐辛子）
    vn_dauhusaot: p => plateHeap(p, plate(p), 'ds', 12, 46, 18, 12, (x, y, r, i) => tofu(p, x, y, 18, r)) + W.flecks(p, 100, 88, 40, 50, 'dsl', ['#e8e8b0', '#c8d898', '#d8281a', '#f0c050'], { ry: 20, s: 1.6 }),
    // ダウフーコーナム（豆腐ときのこの醤油煮）、青ねぎ（土鍋）
    vn_dauhukhonam: p => kho(p, 'dk', 12, 16, 20, (x, y, r, i) => i % 3 === 2 ? W.mushCap(p, x, y, 13, '#c8b8a0') : tofu(p, x, y, 16, r, '#c8823a'), '#8a4a1e') + W.flecks(p, 100, 70, 40, 14, 'dkn', ['#4a9a2c'], { ry: 14, s: 1.6 }),
    // カーティムサオティット（なすと豚ひき肉の炒め）、しそ（タイバジル）（お好みで）
    vn_catimxaothit: p => plateHeap(p, plate(p), 'ct', 18, 46, 13, 14, (x, y, r, i) => i % 5 === 4 ? Q.leaf(p, x, y, 12, r, '#6a3a5a', 'ps' + i, { wave: 1 }) : `<g ${T(x, y, r)}><g transform="scale(1 ${f(SY * 1.4)})"><rect x="-12" y="-4" width="24" height="8" rx="4" fill="${Q.lg(p, [[0, '#8a3a7a'], [.35, '#6a2a5a'], [.4, '#c8945a'], [1, '#8a5a2a']], 0, 0, 0, 1)}" stroke="#3a1a2a" stroke-width=".5"/></g></g>`, { sauce: '#8a4a1e' }) + W.crumble(p, 100, 88, 34, 12, 30, 'ctm', { c: '#8a4a24' }),

    // ---------- 副菜 ----------
    // ラウムオンサオトイ（空心菜のにんにく炒め）
    vn_raumuongxao: p => plateHeap(p, plate(p), 'rm', 26, 48, 10, 14, (x, y, r, i) => i % 2 ? W.pod(p, x, y, 22, r, { c: '#7ab050', w: 3 }) : Q.leaf(p, x, y, 24, r, '#3a7a2a', 'rm' + i, { wave: 2 })) + W.flecks(p, 100, 88, 40, 20, 'rmg', ['#f6eccc', '#c8a050'], { ry: 20, s: 1.6 }),
    // バップカイルオック（ゆでキャベツと卵の魚醤）、唐辛子（お好みで）
    vn_bapcailuoc: p => { const D = plate(p), o = D.o; return plateHeap(p, D, 'bc', 14, 46, 15, 10, (x, y, r, i) => Q.leaf(p, x, y, 28, r, i % 2 ? '#c8dc90' : '#a8c870', 'bc' + i, { wave: 3.4 })) + (() => { const [x, y] = P(o, 38, 32); return dipBowl(p, x, y, '#d8b060', 16) + W.flecks(p, x, y, 8, 10, 'bce', ['#f6d860', '#fbf6e0'], { ry: 3, s: 1.4 }); })(); },
    // チュンチエン（青ねぎの卵焼き）
    vn_trungchien: p => { const D = plate(p); return D.s + W.jeon(p, 100, 100, 58, 1, { c: '#f2c440', h: 6 }) + W.flecks(p, 100, 96, 44, 40, 'tc', ['#3f8a2a', '#6ab048'], { ry: 26, s: 1.8 }) + Q.shine(76, 84, 22, -8, .7); },
    // ゴイガー（鶏とキャベツのサラダ）: 鶏肉・キャベツ・にんじん・玉ねぎ・ラウラム・ピーナッツ・ライム
    vn_goiga: p => { const D = plate(p), o = D.o; return D.s + W.strands(p, 100, 104, 54, 22, ['#eef2d8', '#e0e8c0', '#f8f8e8'], 'gg', { n: 140, L: 14, w: 2 }) + byDepth(W.spots('ggv', 20, 46, 10).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 12 + W.hill(u, v, 50, 12)); const k = i % 4; return [y, () => k === 0 ? `<g ${T(x, y, r)}><path d="M-8,0 L8,0" stroke="#f2e4cc" stroke-width="3" stroke-linecap="round"/></g>` : k === 1 ? `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2" stroke-linecap="round"/>` : k === 2 ? Q.leaf(p, x, y, 10, r, '#4a8a2a', 'rr' + i, { wave: .6 }) : W.onionStrip(x, y, 8, r)]; })) + peanuts(p, 100, 88, 36, 26, 'gg') + lime(p, ...P(o, 46, 30), 18); },
    // ドーチュア（にんじんと大根の甘酢漬け）（白い小鉢）
    vn_dochua: p => W.inBowl(p, smallBowl(p), { R: 64, H: 26, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#f08a3a', '#f6f2e2', '#e8742a', '#fbf8ee'], 'dc', { n: 140, L: 16, w: 3 })]] }),
    // カーティムヌオン（焼きなすのねぎ油がけ）、ピーナッツ（お好みで）
    vn_catimnuong: p => { const D = plate(p), o = D.o; return D.s + byDepth([-16, -2, 12].map((v, i) => { const [x, y] = P(o, -4, v); return [y, () => W.pod(p, x, y, 100, -6, { c: '#7a5a6a', w: 12 }) + `<g ${T(x, y, -6)}><path d="M-46,0 L46,0" stroke="#d8c088" stroke-width="5" opacity=".7"/></g>`]; })) + W.flecks(p, 100, 92, 46, 40, 'cn', ['#3f8a2a', '#6ab048'], { ry: 20, s: 1.8 }) + peanuts(p, 100, 92, 40, 20, 'cn'); },
    // ザーサオヘー（もやしとニラの炒め）、揚げ豆腐（お好みで）
    vn_giaxaohe: p => plateHeap(p, plate(p), 'gx', 40, 48, 7, 14, (x, y, r, i) => i % 6 === 0 ? tofu(p, x, y, 8, r) : i % 4 === 3 ? W.pod(p, x, y, 18, r, { c: '#3f8a2a', w: 2.4 }) : W.sprout(p, x, y, 16, r, { head: false })),
    // スースーサオ（ハヤトウリのにんにく炒め）、にんじん（お好みで）
    vn_susuxao: p => plateHeap(p, plate(p), 'ss', 30, 48, 9, 14, (x, y, r, i) => i % 5 === 4 ? `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2.2" stroke-linecap="round"/>` : Q.prism(p, x, y, [[-9, -2.4], [9, -2.4], [9, 2.4], [-9, 2.4]], 2.6, '#a8c878', { rot: r, top: Q.lg(p, [[0, '#f2f6d8'], [1, '#c8dca0']], 0, 0, 0, 1), line: .4 })) + W.flecks(p, 100, 88, 40, 14, 'ssg', '#f6eccc', { ry: 20, s: 1.5 }),
    // コーカーサオチュン（ゴーヤと卵の炒め）、青ねぎ
    vn_khoquaxaotrung: p => plateHeap(p, plate(p), 'kq', 24, 48, 10, 14, (x, y, r, i) => i % 3 === 0 ? Q.lump(p, x, y, 8, 5, '#f6d860', 'kqe' + i, { n: 8, jit: .4, hi: .4, edge: '#d8a830' }) : Q.prism(p, x, y, [[-9, -4], [9, -4], [8, 4], [-8, 4]], 3, '#7aa848', { rot: r, top: Q.lg(p, [[0, '#eef4d0'], [1, '#a8c870']], 0, 0, 1, 1), line: .45 })) + herbs(p, 100, 88, 36, 12, 'kq'),
    // ボンカイサオ（ブロッコリーとにんじんの炒め）、えび（お好みで）
    vn_bongcaixao: p => plateHeap(p, plate(p), 'bg', 16, 48, 15, 12, (x, y, r, i) => i % 4 === 3 ? shrimpP(p, x, y, 13, r) : i % 4 === 2 ? W.coin(p, x, y, 5.4, '#e8742a', { h: 2 }) : W.broc(p, x, y, 24, i), { sauce: '#e8c870', sauceR: 34 }),
    // ダウクエサオ（いんげんのにんにく炒め）、にんじん（お好みで）
    vn_dauquexao: p => plateHeap(p, plate(p), 'dq', 22, 48, 9, 12, (x, y, r, i) => i % 6 === 5 ? `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2.2" stroke-linecap="round"/>` : W.pod(p, x, y, 32, r)) + W.flecks(p, 100, 88, 40, 14, 'dqg', '#f6eccc', { ry: 20, s: 1.5 }),
    // カイティアサオナム（チンゲン菜ときのこの炒め）
    vn_caithiaxaonam: p => plateHeap(p, plate(p), 'cn', 12, 46, 18, 12, (x, y, r, i) => i % 3 === 2 ? W.mushCap(p, x, y, 13, '#7a4a2a') : `<g ${T(x, y, r)}><path d="M-20,-3 Q-4,-6 4,-4 L4,4 Q-4,6 -20,3Z" fill="${Q.lg(p, [[0, '#f2f6d8'], [1, '#c8dca0']], 0, 0, 0, 1)}" stroke="#8ab060" stroke-width=".6"/><path d="M4,-6 Q16,-12 22,-2 Q16,9 4,6Z" fill="${Q.lg(p, [[0, '#6aa848'], [1, '#2f6a22']], 0, 0, 1, 1)}" stroke="#2a5a1a" stroke-width=".6"/></g>`, { sauce: '#7a4a1e' }),
    // バップサオ（コーンと干しえびのねぎ油炒め）
    vn_bapxao: p => plateHeap(p, plate(p), 'bx', 70, 46, 5, 14, (x, y, r, i) => i % 11 === 5 ? W.shrimp(p, x, y, 7, r) : W.kernel(p, x, y, 4.6)) + herbs(p, 100, 88, 36, 20, 'bx'),
    // ダウバップルオック（ゆでオクラと魚醤のたれ）、唐辛子（お好みで）
    vn_daubapluoc: p => { const D = plate(p), o = D.o; return plateHeap(p, D, 'db', 12, 44, 18, 8, (x, y, r) => W.pod(p, x, y, 32, r, { c: '#5a9a34', w: 7, tip: '#7aa848' })) + dipBowl(p, ...P(o, 38, 34), '#c8a060', 15); },
    // コークエット（ゆで野菜と、豚の脂と干しえびのたれ）: にんじん・キャベツ・いんげん（オクラ）
    vn_khoquet: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-40, -14, 'c'], [-20, -26, 'k'], [6, -28, 'b'], [32, -20, 'c'], [44, 4, 'k'], [-44, 12, 'b'], [30, 30, 'c'], [-20, 32, 'k']].map(([u, v, k], i) => { const [x, y] = P(o, u, v); return [y, () => k === 'c' ? Q.prism(p, x, y, [[-12, -3], [12, -3], [12, 3], [-12, 3]], 4, '#e8742a', { rot: i * 30, line: .4 }) : k === 'k' ? Q.leaf(p, x, y, 24, i * 40, '#c8dc90', 'kq' + i, { wave: 2.4 }) : W.pod(p, x, y, 28, i * 30)]; })) + (() => { const [x, y] = P(o, 2, 2); return dipBowl(p, x, y, '#8a3a14', 20) + W.flecks(p, x, y, 12, 14, 'kqd', ['#f2d8a8', '#e8a090'], { ry: 5, s: 1.6 }); })(); },
    // クーカイコー（大根と干しえびの煮つけ）、青ねぎ（土鍋）
    vn_cucaikho: p => kho(p, 'cc', 12, 16, 20, (x, y, r, i) => i % 4 === 3 ? W.shrimp(p, x, y, 8, r) : W.dice(p, x, y, 14, '#a8642a', 'cd' + i, { h: 8, top: Q.rg(p, [[0, '#e8b878'], [.6, '#c8864a'], [1, '#9a5a2a']], .4, .35, .8) }), '#8a4a1e') + W.flecks(p, 100, 70, 40, 14, 'ccn', ['#4a9a2c'], { ry: 14, s: 1.6 }),
    // ゴイゴーセン（蓮の茎とえびと豚肉のサラダ）: にんじん・ラウラム（タイバジル）・ピーナッツ
    vn_goingosen: p => { const D = plate(p), o = D.o; return D.s + W.strands(p, 100, 104, 54, 22, ['#eef0d8', '#dce4c0', '#f8f8ea'], 'gn', { n: 120, L: 18, w: 2.6 }) + byDepth(W.spots('gnv', 16, 46, 11).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 12 + W.hill(u, v, 50, 12)); const k = i % 4; return [y, () => k === 0 ? shrimpP(p, x, y, 13, r) : k === 1 ? Q.prism(p, x, y, [[-8, -2.6], [8, -2.6], [8, 2.6], [-8, 2.6]], 2, '#e8d0c0', { rot: r, top: Q.lg(p, [[0, '#fbf2ea'], [.5, '#e8b8a8'], [1, '#fbf0e4']], 0, 0, 0, 1), line: .4 }) : k === 2 ? `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2" stroke-linecap="round"/>` : Q.leaf(p, x, y, 10, r, '#3f8a2a', 'gb' + i, { wave: .6 })]; })) + peanuts(p, 100, 88, 36, 26, 'gn'); },
    // ノムドゥードゥー（青パパイヤのサラダ）: にんじん・タイバジル・ラウラム・ピーナッツ
    vn_nomdudu: p => { const D = plate(p), o = D.o; return D.s + W.strands(p, 100, 104, 54, 24, ['#e8eec0', '#d8e4a8', '#f2f4d0'], 'nd', { n: 160, L: 14, w: 2 }) + byDepth(W.spots('ndv', 14, 44, 11).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 14 + W.hill(u, v, 50, 12)); return [y, () => i % 2 ? `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2" stroke-linecap="round"/>` : Q.leaf(p, x, y, 11, r, '#2f6a22', 'nb' + i, { wave: .8 })]; })) + peanuts(p, 100, 86, 36, 26, 'nd'); },
    // サラッチダウザム（レタスとトマトのサラダ）: 玉ねぎ、きゅうり・ゆで卵（お好みで）
    vn_xalachdaugiam: p => { const D = plate(p), o = D.o; return plateHeap(p, D, 'xl', 16, 48, 14, 12, (x, y, r, i) => i % 3 === 0 ? W.standLeaf(p, x, y, 24, 16, r % 50 - 25, '#86c050', i) : Q.leaf(p, x, y, 26, r, '#6aa83a', 'xl' + i, { wave: 4 })) + byDepth([[-30, -10], [24, -14], [0, 14], [36, 18]].map(([u, v], i) => { const [x, y] = P(o, u, v, 16); return [y, () => tomatoW(p, x, y, 13, i * 40)]; })) + [[-14, -2], [14, 6]].map(([u, v], i) => W.onionStrip(...P(o, u, v, 18), 12, i * 60)).join('') + W.eggHalf(p, ...P(o, -34, 26, 12), 20, -10); },
    // ゴイクオン（生春巻き）: ライスペーパーで、えび・豚バラ・ビーフン・レタス・ミント・しそ・ニラ、ホイシンピーナッツだれ
    vn_goicuon: p => { const D = plate(p), o = D.o;
        const roll = (u, v, i) => { const [x, y] = P(o, u, v); return [y, () => `<g ${T(x, y, -12)}><ellipse cx="3" cy="10" rx="40" ry="6" fill="${SHADE}" opacity=".25"/><rect x="-40" y="-10" width="80" height="20" rx="10" fill="#f2f6e8" opacity=".95" stroke="#d8dcc8" stroke-width=".8"/><rect x="-36" y="-6" width="72" height="11" rx="5" fill="#9ac870" opacity=".75"/>${[-24, -4, 16].map(k => `<path d="M${k},-7 q6,-4 12,0 q-2,6 -6,7 q-4,-2 -6,-7Z" fill="#f08a5a" opacity=".85"/>`).join('')}<path d="M-40,0 L40,0" stroke="#fbfaf2" stroke-width="3" opacity=".6"/><path d="M-38,-6 Q0,-12 38,-6" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/><path d="M38,-4 l14,-6 M38,2 l12,-2" stroke="#3f8a2a" stroke-width="2" stroke-linecap="round"/></g>`]; };
        return D.s + byDepth([roll(-6, -18, 1), roll(-2, 4, 2), roll(2, 26, 3)]) + dipBowl(p, ...P(o, 44, 36), '#8a4a24', 14) + peanuts(p, ...P(o, 44, 36), 6, 6, 'gc'); },
    // ズアカイ（からし菜の漬物）、青ねぎ（お好みで）（白い小鉢）
    vn_duacai: p => heapBowl(p, 'dc', 18, 12, 24, (x, y, r, i) => Q.leaf(p, x, y, 22, r, i % 2 ? '#b8b04a' : '#a8a840', 'dc' + i, { wave: 2 }), { base: '#a8a040' }),
    // ズアザー（もやしの漬物）: もやし・ニラ、にんじん（お好みで）（白い小鉢）
    vn_duagia: p => W.inBowl(p, smallBowl(p), { R: 64, H: 26, items: (o, R, H) => [[0, () => W.strands(p, o.cx, o.cy + 4, R, H, ['#f6f2e2', '#efe8d0', '#e8dcb8'], 'dg', { n: 130, L: 14, w: 2.2 })], ...W.onHill(o, 'dgv', 12, R * .85, 12, H, (x, y, r, i) => i % 2 ? W.pod(p, x, y, 16, r, { c: '#3f8a2a', w: 2 }) : `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2" stroke-linecap="round"/>`, { lift: 2 })] }),
    // カーファオムオイ（小なすの塩漬け）: 生姜・唐辛子・にんにく（白い小鉢）
    vn_caphaomuoi: p => heapBowl(p, 'cp', 18, 13, 22, (x, y, r, i) => i % 6 === 5 ? W.chiliRing(x, y, 3, '#d8281a') : Q.lump(p, x, y, 7, 6, '#d8e0a8', 'cp' + i + x, { n: 10, jit: .05, hi: .6 }) + `<path d="M${f(x - 2)},${f(y - 6)} l2,-2 l2,2" stroke="#4a6a2a" stroke-width="1.2" fill="none"/>`, { base: '#c8c890' }),
    // チャーゾー（揚げ春巻き）: 豚ひき肉・きくらげ・春雨・にんじん・卵、えび（お好みで）、ヌックチャム
    vn_chagio: p => { const D = plate(p), o = D.o; return D.s + byDepth([[-8, -22, -14], [2, -6, -12], [-4, 10, -16], [6, 26, -10]].map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => `<g ${T(x, y, r)}><ellipse cx="3" cy="8" rx="38" ry="5" fill="${SHADE}" opacity=".25"/><rect x="-38" y="-8" width="76" height="16" rx="8" fill="${Q.lg(p, [[0, '#f8d070'], [.5, '#d8902a'], [1, '#a85a1a']], 0, 0, 0, 1)}" stroke="#8a4a14" stroke-width=".6"/>${Array.from({ length: 12 }, (_, k) => `<circle cx="${-32 + k * 6}" cy="${(k % 3) * 3 - 3}" r="1.2" fill="#fbe0a0" opacity=".7"/>`).join('')}</g>`]; })) + dipBowl(p, ...P(o, 44, 36), '#e8a060', 14) + Q.leaf(p, ...P(o, -44, 32), 26, 20, '#7ab848', 'cg', { wave: 3 }); },
    // ラックラン（皮つきピーナッツの塩炒り）（白い小鉢）
    vn_lacrang: p => heapBowl(p, 'lr', 60, 7, 22, (x, y, r, i) => Q.lump(p, x, y, 4.6, 3.6, '#9a3a24', 'lr' + i + x, { n: 8, jit: .1, hi: .65 }), { base: '#8a3a24', after: (o, H) => W.flecks(p, o.cx, o.cy - H * CZ * .6, 40, 20, 'lrs', '#fbf6ea', { ry: 12, s: .8 }) }),
    // ボータイチャン（牛肉のライム和え）: 玉ねぎ・ライム・ハーブ（ラウラム・ミント・ノコギリコリアンダー）・ピーナッツ（ごま）
    vn_botaichanh: p => { const D = plate(p), o = D.o; return plateHeap(p, D, 'bt', 18, 46, 13, 10, (x, y, r, i) => i % 4 === 3 ? W.onionStrip(x, y, 12, r) : meat(p, x, y, 20, r, i, '#c88a7a', '#e8b8a8')) + herbs(p, 100, 88, 40, 30, 'bt') + peanuts(p, 100, 88, 36, 20, 'bt') + lime(p, ...P(o, 44, 32), 18); },

    // ---------- 汁物（canh） ----------
    // カインチュア（酸っぱい魚のスープ）: 魚・トマト・パイナップル・オクラ・もやし・タマリンド、ハーブ
    vn_canhchua: p => canh(p, '#e8a050', (pl, S) => [...[[-20, -6], [16, 10]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.coin(p, x, y, 13, '#a8a090', { h: 6, liq: '#e8a050', top: Q.rg(p, [[0, '#f8f2e8'], [.7, '#efe6d8'], [1, '#c8b8a0']], .4, .35, .8) })]; }), ...W.spots('cc', 14, 56, 12).map(([u, v, r], i) => { const [x, y] = pl(u, v); const k = i % 4; return [y, () => k === 0 ? tomatoW(p, x, y, 11, r) : k === 1 ? W.dice(p, x, y, 9, '#e8b830', 'cp' + i, { h: 4 }) : k === 2 ? W.coin(p, x, y, 4.4, '#4a8a2a', { h: 2, top: Q.rg(p, [[0, '#e8f0c8'], [.5, '#a8c870'], [1, '#4a8a2a']], .4, .35, .8) }) : W.sprout(p, x, y, 14, r, { head: false })]; }), [999, () => herbs(p, S.cx, S.cy, 44, 20, 'cc')]], { oil: 6, oilC: '#e8702a' }),
    // カインビードー（かぼちゃと豚ひき肉のスープ）、青ねぎ・パクチー（お好みで）
    vn_canhbido: p => canh(p, '#f0c870', (pl, S) => [...W.spots('bd', 8, 56, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 13, '#4a7a2a', 'bd' + i, { h: 6, sink: 2, liq: '#f0c870', top: Q.rg(p, [[0, '#fbc860'], [.6, '#f0a030'], [1, '#c8781a']], .4, .35, .8) })]; }), ...W.spots('bdm', 6, 50, 13).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.crumble(p, x, y, 6, 3, 8, 'bdm' + i, { c: '#c8a080' })]; }), ...negis(pl, 'bdn', 10, 56)]),
    // カインカチュア（トマトと卵のスープ）、青ねぎ
    vn_canhcachua: p => canh(p, '#e8803a', (pl, S) => [...W.spots('ct', 7, 56, 17).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => tomatoW(p, x, y, 13, r)]; }), ...[[-22, -8], [16, 4], [-2, 18]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + .5, () => Q.eggRibbon(p, x, y, 26, i)]; }), ...negis(pl, 'ctn', 10, 56)]),
    // カインラウゴット（甘い葉と豚ひき肉のスープ）、青ねぎ（お好みで）
    vn_canhraungot: p => canh(p, '#d8d090', (pl, S) => [...W.spots('rn', 16, 58, 12).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 14, r, '#2f6a22', 'rn' + i, { wave: 1.4 })]; }), ...W.spots('rnm', 6, 50, 14).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.crumble(p, x, y, 6, 3, 8, 'rnm' + i, { c: '#c8a080' })]; })]),
    // カインカイサイン（からし菜とえびと生姜のスープ）
    vn_canhcaixanh: p => canh(p, '#d8d498', (pl, S) => [...W.spots('cx', 8, 58, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => greensLeaf(p, x, y, 24, r, i, '#4a8a2a')]; }), ...W.spots('cxs', 5, 50, 16).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => shrimpP(p, x, y, 13, r)]; }), ...W.spots('cxg', 8, 50, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y + 1, () => `<g ${T(x, y, r)}><path d="M-6,0 L6,0" stroke="#e8c870" stroke-width="1.4" stroke-linecap="round"/></g>`]; })]),
    // カインモントイ（ツルムラサキとヘチマのスープ）、干しえび（お好みで）
    vn_canhmongtoi: p => canh(p, '#c8c890', (pl, S) => [...W.spots('mt', 8, 58, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => greensLeaf(p, x, y, 22, r, i, '#2e6a22')]; }), ...W.spots('mtl', 6, 56, 15).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 10, '#6a9a3a', 'ml' + i, { h: 4, sink: 1.6, liq: '#c8c890', top: Q.rg(p, [[0, '#f4f6d8'], [1, '#c8dca0']], .4, .35, .8) })]; }), ...W.spots('mts', 4, 50, 14).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y + .5, () => W.shrimp(p, x, y, 7, i * 50)]; })]),
    // カインビーサイン（冬瓜とえびのスープ）、青ねぎ・パクチー（お好みで）
    vn_canhbixanh: p => canh(p, '#efe6c4', (pl, S) => [...W.spots('bx', 7, 56, 17).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 14, '#b8c890', 'bx' + i, { h: 6, sink: 2, liq: '#efe6c4', top: Q.rg(p, [[0, '#f4f6e0'], [.6, '#dce4b8'], [1, '#98b070']], .4, .35, .8) })]; }), ...W.spots('bxs', 5, 50, 16).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => shrimpP(p, x, y, 13, r)]; }), ...negis(pl, 'bxn', 8, 56)]),
    // カインコーカー（ゴーヤの肉詰めスープ）: 豚ひき肉・きくらげ、春雨（お好みで）、青ねぎ・パクチー
    vn_canhkhoqua: p => canh(p, '#e8dcb0', (pl, S) => [...W.spots('kq', 5, 50, 22).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => W.coin(p, x, y, 13, '#7aa848', { h: 8, top: Q.rg(p, [[0, '#d8b090'], [.6, '#b88a6a'], [.75, '#e8f0c8'], [1, '#6a9a3a']], .4, .35, .8) })]; }), ...negis(pl, 'kqn', 8, 56)]),
    // カインバップカイ（キャベツ巻きのすまし汁）: 豚ひき肉をキャベツで巻き、青ねぎで結ぶ、きくらげ（お好みで）
    vn_canhbapcai: p => canh(p, '#ecdcb0', (pl, S) => [...W.spots('bc', 5, 50, 22).map(([u, v, r], i) => { const [x, y] = pl(u, v, 2); return [y, () => `<g ${T(x, y, r % 40 - 20)}><rect x="-12" y="-7" width="24" height="14" rx="7" fill="${Q.lg(p, [[0, '#f2f6d8'], [1, '#b8d080']], 0, 0, 0, 1)}" stroke="#8ab060" stroke-width=".6"/><path d="M-2,-7 L-2,7" stroke="#3f8a2a" stroke-width="2"/></g>`]; }), ...W.spots('bcw', 4, 54, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => woodEar(p, x, y, 11, r, i)]; })]),
    // カインヘーダウフー（ニラとやわらかい豆腐のスープ）、豚ひき肉（お好みで）
    vn_canhhedauhu: p => canh(p, '#ece2bc', (pl, S) => [...[[-20, -4], [14, -12], [26, 12], [-6, 16]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + 1, () => W.tofuBlock(p, x, y, 15, i * 20, { liq: '#ece2bc', sink: 3 })]; }), ...W.spots('hh', 12, 56, 10).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => W.pod(p, x, y, 16, r, { c: '#3f8a2a', w: 2.2 })]; })]),
    // カインゲーウ（あさりとトマトとディルの酸っぱいスープ）、青ねぎ
    vn_canhngao: p => canh(p, '#e8b070', (pl, S) => [...W.spots('ng', 8, 56, 16).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => Q.clam(p, x, y, 16, r)]; }), ...W.spots('ngt', 5, 54, 16).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => tomatoW(p, x, y, 12, r)]; }), ...W.spots('ngd', 6, 50, 12).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y + 1, () => dill(x, y, r)]; })]),
    // カインクーカイ（大根とスペアリブのスープ）、にんじん（お好みで）、青ねぎ・パクチー（お好みで）
    vn_canhcucai: p => canh(p, '#efe2c0', (pl, S) => [...[[-24, -8, 20], [18, -12, 160]].map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => rib(p, x, y, 24, r, i)]; }), ...W.spots('cd', 6, 56, 17).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 13, '#f2ecd8', 'cd' + i, { h: 5, sink: 2, liq: '#efe2c0' })]; }), ...W.spots('cdc', 3, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.coin(p, x, y, 5, '#e8742a', { h: 2 })]; }), ...negis(pl, 'cdn', 8, 56)]),
    // カインモック（豚団子ときのこのスープ）: きくらげ・干ししいたけ、春雨（お好みで）、青ねぎ
    vn_canhmoc: p => canh(p, '#e8d8a8', (pl, S) => [...W.spots('mc', 7, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => ball(p, x, y, 16, '#e0c8a8', i)]; }), ...W.spots('mcw', 5, 54, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => i % 2 ? woodEar(p, x, y, 11, r, i) : W.mushSlice(p, x, y, 10, r)]; }), ...negis(pl, 'mcn', 8, 56)]),
    // スップガーゴー（鶏とコーンのとろみスープ）: 卵、にんじん・青ねぎ・パクチー（お好みで）
    vn_supgango: p => canh(p, '#f4d878', (pl, S) => [...W.spots('sg', 36, 60, 7).map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => W.kernel(p, x, y, 4.4)]; }), ...W.spots('sgc', 6, 54, 14).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.pepperStrip(p, x, y, 12, r, '#f2e4cc')]; }), [S.cy, () => Q.eggRibbon(p, S.cx - 10, S.cy - 2, 26, 1)], ...negis(pl, 'sgn', 6, 56)], { glow: .45 }),
    // スップクア（かにと卵のとろみスープ）: 干ししいたけ、コーン（お好みで）、青ねぎ・パクチー
    vn_supcua: p => canh(p, '#f0e0b0', (pl, S) => [...W.spots('sc', 12, 56, 12).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => W.pepperStrip(p, x, y, 12, r, '#f6d8c8')]; }), ...W.spots('scm', 4, 50, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.mushSlice(p, x, y, 10, i * 40)]; }), ...W.spots('sck', 10, 54, 9).map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => W.kernel(p, x, y, 4)]; }), [S.cy, () => Q.eggRibbon(p, S.cx + 10, S.cy + 2, 24, 1)], [999, () => herbs(p, S.cx, S.cy, 40, 16, 'sc')]], { glow: .45 }),
    // カインコアイモー（紫山芋とえびのスープ）: ゴオム（パクチー）・青ねぎ
    vn_canhkhoaimo: p => canh(p, '#a874b0', (pl, S) => [...W.spots('km', 5, 50, 16).map(([u, v, r]) => { const [x, y] = pl(u, v, 1); return [y, () => shrimpP(p, x, y, 13, r)]; }), ...negis(pl, 'kmn', 8, 56), [999, () => herbs(p, S.cx, S.cy, 40, 14, 'km')]], { glow: .35 }),
    // カインカーティーラー（魚とディルとトマトのスープ）: 生姜・青ねぎ
    vn_canhcathila: p => canh(p, '#e8b860', (pl, S) => [...[[-20, -6], [16, 10]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.prism(p, x, y, [[-11, -7], [11, -6], [10, 7], [-10, 6]], 6, '#f2ece0', { rot: i * 20, sink: 2, liquid: '#e8b860', top: Q.lit(p, '#fbf8f0', .2, .08), line: .5 })]; }), ...W.spots('ctt', 5, 54, 16).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => tomatoW(p, x, y, 11, r)]; }), ...W.spots('ctd', 7, 50, 11).map(([u, v, r]) => { const [x, y] = pl(u, v, 2); return [y + 1, () => dill(x, y, r)]; })]),
    // カインズアボー（高菜漬けと牛肉のスープ）: トマト・青ねぎ・パクチー（お好みで）
    vn_canhduabo: p => canh(p, '#d8b860', (pl, S) => [...W.spots('db', 6, 54, 16).map(([u, v, r], i) => { const [x, y] = pl(u, v, 1); return [y, () => meat(p, x, y, 18, r, i, '#8a5a3a', '#b88a6a')]; }), ...W.spots('dbg', 7, 56, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 18, r, '#a8a040', 'dbg' + i, { wave: 2 })]; }), ...W.spots('dbt', 3, 50, 18).map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => tomatoW(p, x, y, 11, r)]; }), ...negis(pl, 'dbn', 6, 56)]),
    // カインカイクック（春菊と豚団子のスープ）、青ねぎ（お好みで）
    vn_canhcaicuc: p => canh(p, '#d8d498', (pl, S) => [...W.spots('ck', 8, 58, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => greensLeaf(p, x, y, 22, r, i, '#3f8a2a')]; }), ...W.spots('ckm', 6, 50, 17).map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => ball(p, x, y, 12, '#d8b890', i)]; })]),
    // カインマン（たけのこと豚足のスープ）: 青ねぎ・パクチー（土鍋）
    vn_canhmang: p => canh(p, '#e0c890', (pl, S) => [...[[-22, -6], [18, -10], [0, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 2); return [y, () => Q.lump(p, x, y, 14, 10, '#f0d8b8', 'mg' + i, { n: 10, jit: .14, hi: .6 }) + `<ellipse cx="${f(x + 4)}" cy="${f(y - 1)}" rx="5" ry="3" fill="#f8f0e0"/>`]; }), ...W.spots('mgb', 8, 56, 14).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.prism(p, x, y, [[-10, -3], [10, -3], [10, 3], [-10, 3]], 2.4, '#c8a050', { rot: r, top: Q.lg(p, [[0, '#f2dca0'], [1, '#c8a050']], 0, 0, 0, 1), line: .4 })]; }), ...negis(pl, 'mgn', 8, 56)], { V: claypot, steamOp: .4 }),
    // カインゾンビエン（海藻と豚ひき肉のスープ）、やわらかい豆腐（お好みで）、青ねぎ
    vn_canhrongbien: p => canh(p, '#e0d4a0', (pl, S) => [...W.spots('rb', 9, 56, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => Q.leaf(p, x, y, 24, r, i % 2 ? '#3a5a26' : '#2e4e22', 'rb' + i, { wave: 3.4 })]; }), ...W.spots('rbm', 5, 50, 14).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.crumble(p, x, y, 6, 3, 8, 'rbm' + i, { c: '#c8a080' })]; }), ...[[-14, 12], [22, -8]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y + 1, () => W.tofuBlock(p, x, y, 13, i * 20, { liq: '#e0d4a0', sink: 3 })]; }), ...negis(pl, 'rbn', 6, 56)]),
    // カインクア（田がにとツナソの葉のスープ）、ヘチマ・ツルムラサキ（お好みで）
    vn_canhcua: p => canh(p, '#c8a868', (pl, S) => [[S.cy - 2, () => `<g ${S.inside}>${Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28, d = 14 + (i % 3) * 14; return `<ellipse cx="${f(S.cx + Math.cos(a) * d)}" cy="${f(S.cy + Math.sin(a) * d * SY)}" rx="${12 + i % 3 * 3}" ry="5" fill="#d8b070" opacity=".85"/>`; }).join('')}</g>`], ...W.spots('cu', 9, 58, 15).map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y, () => greensLeaf(p, x, y, 20, r, i, '#3a6a24')]; }), ...W.spots('cul', 4, 54, 16).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.dice(p, x, y, 9, '#6a9a3a', 'cl' + i, { h: 4, sink: 1.6, liq: '#c8a868', top: Q.rg(p, [[0, '#f4f6d8'], [1, '#c8dca0']], .4, .35, .8) })]; })]),
    // カインガーナム（鶏としいたけのスープ）: 生姜、にんじん（お好みで）、青ねぎ
    vn_canhganam: p => canh(p, '#ecd090', (pl, S) => [...[[-26, -6], [16, -14], [6, 14]].map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => Q.soakLump(p, x, y, 24, i, { c: '#efd8b0', soak: '#c8a060', k: .3, sy: .72 })]; }), ...W.spots('gnm', 6, 56, 17).map(([u, v], i) => { const [x, y] = pl(u, v, 1); return [y, () => W.mushCap(p, x, y, 14, '#7a4a2a')]; }), ...W.spots('gnc', 3, 50, 18).map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => W.coin(p, x, y, 5, '#e8742a', { h: 2 })]; }), ...negis(pl, 'gnn', 8, 56)], { oil: 8, oilC: '#f0c040' }),

    // ---------- 麺・ご飯もの ----------
    // コムチエン（卵チャーハン）: 卵・青ねぎ、にんじん・中国ソーセージ（お好みで）
    vn_comchien: p => { const D = plate(p), o = D.o; return D.s + W.friedRice(p, 100, 104, 56, 24, 'cc', { cols: ['#f6dc90', '#f2cc70', '#fbecc0'], edge: '#c89a3a', sy: SYF }) + byDepth(W.spots('ccs', 24, 48, 9).map(([u, v], i) => { const [x, y] = P(o, u, v, 5 + W.hill(u, v, 56, 24)); const k = i % 4; return [y, () => k === 0 ? Q.lump(p, x, y, 5, 3.4, '#f6d860', 'ce' + i, { hi: .4 }) : k === 1 ? Q.negi(null, x, y, 5, '#4a9a2c') : k === 2 ? W.dice(p, x, y, 4, '#e8742a', 'ck' + i, { h: 2 }) : W.sausageCoin(p, x, y, 4.4, { c: '#9a2a1a', inner: '#d86a5a' })]; })); },
    // ブンティットヌオン（焼き豚のビーフン）: ビーフン・レモングラスで焼いた豚肉・レタス・きゅうり・ミントとしそ、ピーナッツ・ヌックチャム（白い大きな碗）
    vn_bunthitnuong: p => { const V = bowl(p), o = { cx: 100, cy: V.cy + 6 }, H = 22;
        return V.s + `<g ${V.above}>${W.noodleMound(p, o.cx, o.cy, 76, H, '#fbf8ee', 'bt', { w: 1.4, n: 200, len: 28, edge: '#d8d0bc' })}${byDepth(W.onHill(o, 'btm', 8, 40, 14, H, (x, y, r, i) => meat(p, x, y, 20, r, i, '#a8501e', '#e8a060'), { lift: 4, cu: 16, cv: -4 }).concat(W.onHill(o, 'btv', 10, 40, 12, H, (x, y, r, i) => i % 3 === 0 ? cucumber(p, x, y, 6) : Q.leaf(p, x, y, 16, r, i % 2 ? '#7ab848' : '#3f8a2a', 'bv' + i, { wave: 2 }), { lift: 4, cu: -30, cv: 6 })))}${peanuts(p, o.cx + 6, o.cy - H * CZ, 30, 20, 'bt')}</g>` + V.shine(.5) + dipBowl(p, 160, 150, '#e8a060', 13); },
    // ミーサオ（卵麺の海鮮と青菜炒め）: えび・いか（お好みで）・チンゲン菜（菜心）・にんじん
    vn_mixao: p => { const D = plate(p), o = D.o; return D.s + W.noodleMound(p, 100, 104, 58, 20, '#e8c070', 'mx', { w: 2.4, n: 150, len: 32, sy: SYF, edge: '#a8803a' }) + byDepth(W.spots('mxv', 16, 50, 12).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 4 + W.hill(u, v, 58, 20)); const k = i % 4; return [y, () => k === 0 ? shrimpP(p, x, y, 14, r) : k === 1 ? Q.leaf(p, x, y, 16, r, '#2f6a22', 'mg' + i, { wave: 2 }) : k === 2 ? `<path d="M${f(x - 5)},${f(y)} l10,-1" stroke="#e8742a" stroke-width="2.2" stroke-linecap="round"/>` : `<g ${T(x, y, r)}><rect x="-8" y="-3" width="16" height="6" rx="2" fill="#f6ece0" stroke="#c8a080" stroke-width=".5"/></g>`]; })); },
    // コムザンズアボー（牛肉と高菜漬けのチャーハン）: トマト、卵（お好みで）・青ねぎ
    vn_comrangduabo: p => { const D = plate(p), o = D.o; return D.s + W.friedRice(p, 100, 104, 56, 24, 'cr', { cols: ['#e8c890', '#d8b070', '#f2dcb0'], edge: '#a8803a', sy: SYF }) + byDepth(W.spots('crs', 18, 48, 11).map(([u, v, r], i) => { const [x, y] = P(o, u, v, 5 + W.hill(u, v, 56, 24)); const k = i % 4; return [y, () => k === 0 ? meat(p, x, y, 13, r, i, '#7a4a2a', '#a8784a') : k === 1 ? Q.leaf(p, x, y, 10, r, '#a8a040', 'cg' + i, { wave: 1 }) : k === 2 ? tomatoW(p, x, y, 8, r) : Q.negi(null, x, y, 5, '#4a9a2c')]; })); },
};
