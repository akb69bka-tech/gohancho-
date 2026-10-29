// フィリピン（ph_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 皿で食べる国。炒め物・揚げ物・ご飯・麺は山吹（#d0a040）の縁の白い平皿（主食の ph_staple にそろえる）、
// 汁物（シニガン・ティノーラ・ニラガ）は山吹の線の白い大きな碗、煮込み（アドボ・カルデレータ・カレカレ）は山吹の縁の深皿、
// 酢の物・アチャラは白い小鉢。焼き魚・揚げ魚はバナナの葉を敷いた皿。
// 材料は gohancho/packs/ph.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, T: TR } = W;

const GOLD = '#d0a040';
const plato = (p, o = {}) => Q.plate(p, { line: 'none', edge: GOLD, ...o });
const mangkok = (p, o = {}) => Q.shiroBowl(p, { rim: GOLD, line: 'none', ...o });
const deep = (p, o = {}) => Q.fukazara(p, { line: GOLD, ...o });
const small = (p, o = {}) => W.sideBowl(p, { edge: GOLD, ...o });
const leafPlate = p => { const D = plato(p), o = D.o; return { ...D, s: D.s + `<path d="${Q.blob(o.cx, o.cy, 74, 74 * SYF * .9, 'bl' + p.id, { n: 10, jit: .08 })}" fill="${Q.lg(p, [[0, '#7ab048'], [1, '#3f7a2a']])}" stroke="#2e5a1e" stroke-width=".8"/><path d="M${f(o.cx - 70)},${f(o.cy + 4)} L${f(o.cx + 70)},${f(o.cy - 4)}" stroke="#a8d070" stroke-width="1.2"/>` }; };
const NEGI = '#4a9a2c', GARLIC = ['#c8862e', '#e0a848'];
const calamansi = (p, x, y, s = 9) => W.ING.lime(p, x, y, s, 0);
const ing = {
    adobo: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#9a5a2a', soak: '#4a2210', k: .6, sy: .72 }),
    porkTomato: (p, x, y, s, r, i) => W.dice(p, x, y, s, '#a8401e', p.id + 'pt' + i, { h: s * .55, top: Q.rg(p, [[0, '#e8906a'], [.6, '#c8502a'], [1, '#8a2a14']], .4, .35, .8) }),
    chickenTomato: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e8a070', soak: '#c8401e', k: .5, sy: .72 }),
    chickenPine: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#f2d8a0', soak: '#e0a050', k: .4, sy: .72 }),
    beefStrip: (p, x, y, s, r, i) => Q.slice3q(p, x, y, s * 1.4, r, { c: '#6a3418', fat: '#8a5a3a', seed: i, gloss: .8, char: false }, { sq: .5 }),
    porkBelly: (p, x, y, s, r, i, liq) => Q.prism(p, x, y, Q.square(s), s * .7, '#e8c8b0', { rot: r, sink: liq ? 2 : 0, liquid: liq, top: Q.lg(p, [[0, '#fbf2ea'], [.4, '#e8b8a8'], [.6, '#fbf0e4'], [1, '#d8a090']], 0, 0, 0, 1), line: .55 }),
    lechon: (p, x, y, s, r, i) => Q.prism(p, x, y, Q.square(s), s * .8, '#f2d8b8', { rot: r, top: Q.lg(p, [[0, '#e8a050'], [.25, '#c8742a'], [.3, '#f6e8d8'], [.55, '#e8b8a0'], [.6, '#fbf0e4'], [1, '#e0a890']], 0, 0, 0, 1), line: .55 }) + W.flecks(p, x, y - s * .55, s * .4, 6, 'lc' + i, ['#fbe0a0'], { ry: s * .12, s: 1.2 }),
    oxtailPeanut: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#5a2a14', { h: 6, top: Q.rg(p, [[0, '#f2dcc0'], [.3, '#c89070'], [.5, '#8a4a2a'], [1, '#5a2a14']], .4, .35, .8) }),
    squidAdobo: (p, x, y, s, r) => `<g ${TR(x, y, r)}><ellipse rx="${f(s * .5)}" ry="${f(s * .36)}" fill="none" stroke="#3a2a22" stroke-width="${f(s * .2)}"/><ellipse rx="${f(s * .5)}" ry="${f(s * .36)}" fill="none" stroke="#6a5048" stroke-width="${f(s * .08)}" transform="translate(-.5 -.8)"/></g>`,
    saba: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .5, '#c8a040', { h: 4, liq, top: Q.rg(p, [[0, '#fff2c0'], [.7, '#f6dc90'], [1, '#d8b058']], .4, .35, .8) }),
    cornCob: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .55, '#e8b830', { h: s * .5, liq, top: Q.rg(p, [[0, '#fff8d0'], [.3, '#f6e8a0'], [.4, '#f6c83a'], [1, '#d09a1a']], .4, .35, .8) }),
    pechay: (p, x, y, s, r, i) => W.standLeaf ? Q.leaf(p, x, y, s * 1.6, r, i % 2 ? '#3f8a2a' : '#5aa83a', 'pc' + p.id + i, { wave: 1.6 }) + W.ING.celery(p, x - s * .3, y + 2, s * .8, r) : '',
    labanos: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .5, '#e8e4d8', { h: 2, liq, top: Q.rg(p, [[0, '#ffffff'], [1, '#f0ece0']], .4, .35, .8) }),
    taro: (p, x, y, s, r, i, liq) => Q.lump(p, x, y, s * .5, s * .4, '#e8dcd0', p.id + 'ta' + i, { n: 10, jit: .12, hi: .6, edge: '#a89080' }),
    lumpia: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><rect x="${f(-s)}" y="${f(-s * .14)}" width="${f(s * 2)}" height="${f(s * .28)}" rx="${f(s * .13)}" fill="${Q.lg(p, [[0, '#f6d890'], [.5, '#d8a048'], [1, '#a8702a']], 0, 0, 0, 1)}" stroke="#8a5a1e" stroke-width=".6"/><path d="M${f(-s * .8)},${f(-s * .1)} L${f(s * .8)},${f(-s * .1)}" stroke="#fff4c8" stroke-width="1" opacity=".7"/></g>`,
    papaya: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s / 2, -1], [s / 2, -1], [s / 2, 1], [-s / 2, 1]], 1.4, i % 3 ? '#f2ecc8' : '#e8742a', { rot: r, line: .3 }),
    mangoGreen: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#8ab040', p.id + 'mg' + i, { h: s * .4, top: Q.rg(p, [[0, '#f6f8c8'], [1, '#d8e090']], .4, .35, .8) }),
    mangoSlice: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .7, 0], [-s * .3, -s * .3], [s * .5, -s * .25], [s * .7, 0], [s * .3, s * .3], [-s * .4, s * .25]], 3, '#7a9a2a', { rot: r, line: .45, top: Q.rg(p, [[0, '#f8f6c0'], [1, '#e0e090']], .4, .35, .8) }),
    tuna: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#e8d0c0', p.id + 'tu' + i, { h: s * .5, top: Q.rg(p, [[0, '#fff4ec'], [1, '#f0d8c8']], .4, .35, .8) }),
    hotdog: (p, x, y, s, r, i, liq) => W.sausageCoin(p, x, y, s * .4, { c: '#c8301e', inner: '#e86a5a', liq }),
    macaroni: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#d8b060" stroke-width="${f(s * .32)}" fill="none" stroke-linecap="round"/><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#f6dc90" stroke-width="${f(s * .18)}" fill="none" stroke-linecap="round"/></g>`,
    macaroniCream: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#e0d0a0" stroke-width="${f(s * .34)}" fill="none" stroke-linecap="round"/><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#fbf2d8" stroke-width="${f(s * .2)}" fill="none" stroke-linecap="round"/></g>`,
    wonton: (p, x, y, s, r, i) => `<path d="${Q.blob(x, y, s * .6, s * .38, p.id + 'wt' + i, { n: 10, jit: .3 })}" fill="${Q.rg(p, [[0, '#fbf6e8'], [1, '#e8dcc0']], .4, .35, .8)}" stroke="#c8b890" stroke-width=".5" opacity=".95"/>` + W.ball(p, x, y - 2, s * .4, '#d8b0a0', p.id + 'wb' + i, { hi: .5 }),
    misua: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s)},0 Q${f(-s / 3)},-3 0,0 T${f(s)},0" stroke="#f4ecd8" stroke-width="1" fill="none"/></g>`,
    patola: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .45, '#4a7a2a', { h: 3, liq, top: Q.rg(p, [[0, '#f6f8e0'], [.7, '#dce8b8'], [1, '#6a9a3a']], .4, .35, .8) }),
    tortaTalong: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="${Q.blob(0, 0, s * 1.2, s * .5, p.id + 'tt' + i, { n: 12, jit: .1 })}" fill="${Q.rg(p, [[0, '#f6d870'], [.6, '#e0a840'], [1, '#a8702a']], .4, .35, .8)}" stroke="#a8702a" stroke-width=".6"/>${[-.6, -.3, 0, .3, .6].map(k => `<path d="M${f(k * s)},${f(-s * .35)} l${f(s * .1)},${f(s * .7)}" stroke="#7a4a2a" stroke-width="1.6" opacity=".5"/>`).join('')}</g>`,
    bangus: (p, x, y, s, r, i) => `<g ${TR(x, y, r)}><path d="${Q.blob(0, 0, s * 1.4, s * .7, p.id + 'bg' + i, { n: 14, jit: .06 })}" fill="${Q.rg(p, [[0, '#f8e0a0'], [.6, '#e0a848'], [1, '#a8702a']], .4, .35, .8)}" stroke="#8a5a1e" stroke-width=".7"/><path d="M${f(-s * 1.2)},0 L${f(s * 1.2)},0" stroke="#c8863a" stroke-width="1.4"/>${[-.8, -.4, 0, .4, .8].map(k => `<path d="M${f(k * s)},0 l${f(s * .2)},${f(-s * .5)} M${f(k * s)},0 l${f(s * .2)},${f(s * .5)}" stroke="#b8782e" stroke-width=".8" opacity=".6"/>`).join('')}</g>`,
    okoy: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .6, s * .45, i, { c: '#d89a3a', n: 18, h: 5, rot: r }) + W.ING.shrimp(p, x, y - 4, s * .6, r),
    taroLeaf: (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#3a4a22', 'tl' + p.id + i, { wave: 2 }),
    jackfruit: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .5, s * .38, '#e8d0a0', p.id + 'jf' + i, { n: 10, jit: .3, hi: .5, edge: '#a88a5a' }),
    eggplantAdobo: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#4a2038', { h: 4, top: Q.rg(p, [[0, '#c8945a'], [.6, '#8a5a2a'], [1, '#5a3418']], .4, .35, .8) }),
    mussel: (p, x, y, s, r) => W.musselOpen(p, x, y, s * 1.3, r),
    leaf: (p, x, y, s, r, i) => Q.leaf(p, x, y, s * .6, r, '#3f8a2a', 'ml' + p.id + i, { wave: .3 }),
    shrimpHead: (p, x, y, s, r, i) => Q.prawn3q(p, x, y, s * 1.3, r, i % 2 ? 1 : -1),
    saltedEgg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20, { yolk: '#e8801e' }),
    egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    liver: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#5a2418', p.id + 'lv' + i, { h: s * .4, top: Q.rg(p, [[0, '#8a4a3a'], [1, '#4a1e14']], .4, .35, .8) }),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(plato, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });
const S = (c, items, o = {}) => M(mangkok, 'soup', c, items, { minD: 12, ...o });
const B = (c, items, o = {}) => M(deep, 'braise', c, items, { minD: 13, ...o });
const K = (items, o = {}) => M(small, 'bowl', null, items, { minD: 7, ...o });
const rolls = (n, L, dip) => p => { const D = plato(p), o = D.o; return D.s + byDepth(Array.from({ length: n }, (_, i) => { const [x, y] = at(o, -12 + i * 3, -30 + i * 13, 6); return [y, () => ing.lumpia(p, x, y, L, -14, i)]; })) + `<ellipse cx="${f(o.cx + 54)}" cy="${f(o.cy + 26)}" rx="14" ry="${f(14 * SYF)}" fill="#f4f0e6" stroke="${GOLD}" stroke-width=".8"/><ellipse cx="${f(o.cx + 54)}" cy="${f(o.cy + 26)}" rx="11" ry="${f(11 * SYF)}" fill="${dip}"/>`; };
const garlicBits = n => [GARLIC[0], n, 1.8];
const fishDish = (o, on = () => '') => p => W.fishOn(p, leafPlate(p), { ...o, on: (x, y) => on(p, x, y) });
const sinigang = (items, o = {}) => S('#e8d8a8', items, { minD: 10, ...o });

export default {
    // ---------- 主菜 ----------
    // チキン・アドボ（鶏の酢醤油煮）、ゆで卵（お好みで）
    ph_adobo: B('#4a2210', [['adobo', 10, 18], ['egg', 2, 16]], { flecks: [garlicBits(10)] }),
    // ギニリン（豚ひき肉のトマト煮）: ひき肉・じゃがいも・にんじん・玉ねぎ、グリンピース・ゆで卵（お好みで）
    ph_giniling: K([['mince', 12, 16], ['potato', 6, 10], ['carrot', 6, 10], ['pea', 8, 13]], { base: '#a8401e', minD: 8 }),
    // ビステック（牛肉の醤油レモン煮）と玉ねぎの輪
    ph_bistek: P([['beefStrip', 10, 20], ['onion', 8, 18]], { sauce: '#4a2210', sauceR: 44, after: (o, D, p) => calamansi(p, ...at(o, 48, 30), 12) }),
    // ティラピアの揚げ焼き、カラマンシー・トマト（お好みで）
    ph_tilapia: fishDish({ skin: '#a8682a', belly: '#d8a860', char: .5 }, (p, x, y) => W.tomatoBall(p, x + 50, y + 22, 14) + calamansi(p, x - 50, y + 24, 12)),
    // ムンゴ（緑豆の煮込み）: 緑豆・トマト・玉ねぎ・モリンガの葉、豚バラ（お好みで）
    ph_munggo: S('#9a8a3a', [['leaf', 14, 14], ['porkBelly', 3, 12], ['tomato', 2, 10]], { minD: 8, flecks: [['#6a8a2a', 30, 1.6]] }),
    // トルタン・タロン（焼きなすのオムレツ）
    ph_tortang_talong: P([['tortaTalong', 2, 32]], { minD: 30, H: 6 }),
    // メヌード（豚のトマト煮）: 豚・じゃがいも・にんじん・赤ピーマン・玉ねぎ、レバー・レーズン（お好みで）
    ph_menudo: B('#b8401a', [['porkTomato', 6, 15], ['potato', 4, 13], ['carrot', 4, 12], ['pepperR', 3, 12], ['raisin', 3, 12]]),
    // カルデレータ（牛肉のトマト煮）: 牛肉・じゃがいも・にんじん・ピーマン
    ph_kaldereta: B('#a8341a', [['beef', 6, 17], ['potato', 4, 15], ['carrot', 3, 13], ['pepperR', 2, 12], ['pepperG', 2, 12]], { flecks: [['#f2c040', 10, 1.6]] }),
    // アフリターダ（鶏のトマト煮）: 鶏・じゃがいも・にんじん・ピーマン、グリンピース（お好みで）
    ph_afritada: B('#c8401e', [['chickenTomato', 6, 18], ['potato', 4, 14], ['carrot', 3, 12], ['pepperG', 2, 12], ['pea', 4, 12]]),
    // レチョン・カワリ（豚バラのかりかり揚げ）
    ph_lechon_kawali: P([['lechon', 7, 22]], { minD: 20, H: 12, after: (o, D, p) => `<ellipse cx="${f(o.cx + 50)}" cy="${f(o.cy + 26)}" rx="14" ry="${f(14 * SYF)}" fill="#f4f0e6" stroke="${GOLD}" stroke-width=".8"/><ellipse cx="${f(o.cx + 50)}" cy="${f(o.cy + 26)}" rx="11" ry="${f(11 * SYF)}" fill="#8a4a1e"/>` }),
    // カレカレ（テールのピーナッツ煮込み）: テール・なす・ささげ・チンゲン菜
    ph_kare_kare: B('#c8863a', [['oxtailPeanut', 6, 20], ['eggplant', 3, 13], ['longBean', 3, 9], ['pechay', 2, 12]]),
    // ビコール・エクスプレス（豚のココナッツ唐辛子煮）
    ph_bicol_express: B('#ead8a8', [['porkBelly', 9, 15], ['greenChiliLarge', 5, 10]]),
    // ピニヤハン・マノック（パイナップルの鶏煮）: 鶏・パイナップル・にんじん・じゃがいも・ピーマン
    ph_pininyahang_manok: B('#f0d8a0', [['chickenPine', 6, 17], ['pineapple', 4, 14], ['carrot', 3, 12], ['potato', 3, 13], ['pepperR', 2, 12]]),
    // ダイン・ナ・バグス（ミルクフィッシュの開き揚げ）
    ph_daing_bangus: p => { const D = plato(p), o = D.o; return D.s + ing.bangus(p, o.cx - 6, o.cy - 2, 44, -8, 1) + W.flecks(p, o.cx - 6, o.cy - 6, 40, 16, 'db', GARLIC, { ry: 12, s: 1.8 }) + `<ellipse cx="${f(o.cx + 52)}" cy="${f(o.cy + 28)}" rx="13" ry="${f(13 * SYF)}" fill="#f4f0e6" stroke="${GOLD}" stroke-width=".8"/><ellipse cx="${f(o.cx + 52)}" cy="${f(o.cy + 28)}" rx="10" ry="${f(10 * SYF)}" fill="#e8dcb8"/>`; },
    // エスカベッチェ（揚げ魚の甘酢あん）: 丸ごとの魚・ピーマン・にんじん・玉ねぎ
    ph_escabeche: p => { const D = plato(p), o = D.o; return W.fishOn(p, D, { skin: '#a8682a', belly: '#d8a860', char: .5, on: (x, y) => W.pool(p, x, y - 2, 40, '#e8702a', 'es', SYF) + byDepth(W.spots('esv', 14, 40, 8).map(([u, v, r], i) => { const [xx, yy] = at(o, u, v * .5, 10); return [yy, () => [W.ING.pepperR, W.ING.pepperG, W.ING.carrotStick, W.ING.onion][i % 4](p, xx, yy, 13, r)]; })) }); },
    // パクシウ（魚の酢と生姜煮）: 魚・なす・青唐辛子、ゴーヤ（お好みで）
    ph_paksiw_isda: p => W.fishOn(p, deep(p), { L: 130, skin: '#b8b0a0', belly: '#ece4d4', char: 0, on: (x, y) => [[-40, 18], [44, 14]].map(([dx, dy], i) => ing.eggplantAdobo(p, x + dx, y + dy, 16, 0, i)).join('') + W.ING.greenChiliLarge(p, x + 10, y + 24, 12, -10) }),
    // ギナタアン・ヒポン（えびのココナッツ煮）: 頭つきのえび・青唐辛子、チンゲン菜（お好みで）
    ph_ginataang_hipon: B('#f2e2b8', [['shrimpHead', 9, 18], ['greenChiliLarge', 3, 10]]),
    // アドボン・プシット（いかの墨煮）: いか・玉ねぎ・トマト
    ph_adobong_pusit: B('#2e2018', [['squidAdobo', 12, 18], ['tomato', 2, 11]]),
    // トルタン・パタタス（じゃがいものオムレツ）
    ph_tortang_patatas: p => { const D = plato(p); return D.s + W.jeon(p, 100, 100, 56, 1, { c: '#e8b440', h: 9 }) + W.flecks(p, 100, 96, 44, 40, 'tp', ['#f6e0a0', '#c8862e', '#efdcae'], { ry: 24, s: 2 }) + Q.shine(80, 84, 20, -8, .7); },
    // トクワット・バボイ（揚げ豆腐と豚の酢醤油）: 豆腐・豚バラ・赤玉ねぎ、唐辛子（お好みで）
    ph_tokwat_baboy: K([['tofuFried', 8, 16], ['porkBelly', 6, 13], ['redOnion', 5, 11], ['chiliR', 2, 12]], { base: '#8a5a2a', ing: { ...ing, tofuFried: (p, x, y, s, r) => W.tofuBlock(p, x, y, s, r, { sear: '#d8a040' }) } }),
    // ピナクベット（野菜のバゴオン煮）: かぼちゃ・なす・オクラ・ゴーヤ・ささげ・トマト
    ph_pinakbet: B('#a8642a', [['pumpkin', 4, 14], ['eggplant', 3, 13], ['okra', 4, 14], ['bitter', 3, 14], ['longBean', 3, 9], ['tomato', 2, 10]], { ing: { ...ing, bitter: (p, x, y, s) => W.coin(p, x, y, s * .42, '#3f6a24', { h: 2, top: Q.rg(p, [[0, '#e8f0c8'], [.5, '#a8c870'], [1, '#3f6a24']], .4, .35, .8) }) } }),
    // ライン（里芋の葉のココナッツ煮）: 里芋の葉・ココナッツミルク・青唐辛子
    ph_laing: K([['taroLeaf', 16, 14], ['greenChiliLarge', 3, 10]], { base: '#5a5a2a', flecks: [['#f2e8c8', 20, 1.6]] }),

    // ---------- ご飯・麺 ----------
    // シナンガグ（ガーリックライス）、目玉焼き・青ねぎ（お好みで）
    ph_sinangag: p => { const D = plato(p), o = D.o; return D.s + W.friedRice(p, 96, 104, 50, 24, 'sg', { cols: ['#fbf2d8', '#f4e4c0', '#fffaf0'], edge: '#c8a870', sy: SYF }) + W.flecks(p, 96, 92, 40, 30, 'sgf', GARLIC, { ry: 16, s: 2 }) + W.friedEgg(p, ...at(o, 4, -4, 22), 40, 1) + W.flecks(p, 96, 92, 40, 12, 'sgn', [NEGI], { ry: 16, s: 1.8 }); },
    // アロス・カルド（鶏と生姜のおかゆ）: 鶏・青ねぎ・カラマンシー、ゆで卵（お好みで）
    ph_arroz_caldo: S('#f2e4b8', [['chicken', 4, 14], ['egg', 1, 16]], { porr: { c: '#f6ecc8', n: 150 }, flecks: [garlicBits(14), [NEGI, 14, 1.6]], after: (S, V, p) => calamansi(p, S.cx + 44, S.cy + 4, 10) }),
    // パンシット・ビーフン: ビーフン・鶏・キャベツ・にんじん・玉ねぎ、さやいんげん（お好みで）、カラマンシー
    ph_pancit: P([['chicken', 5, 12], ['cabbage', 4, 12], ['carrotStick', 8, 12], ['greenBean', 3, 8]], { noodle: { c: '#f2dcb0', edge: '#c8a870', w: 1.2, n: 220 }, H: 18, R: 50, after: (o, D, p) => calamansi(p, ...at(o, 50, 30), 12) }),
    // パンシット・カントン（焼きそば）: 卵麺・豚・キャベツ・にんじん、えび（お好みで）、カラマンシー
    ph_pancit_canton: P([['porkSlice', 4, 12], ['shrimp', 3, 12], ['cabbage', 4, 12], ['carrotStick', 6, 12]], { noodle: { c: '#e0b060', edge: '#a8783a' }, H: 18, R: 50, after: (o, D, p) => calamansi(p, ...at(o, 50, 30), 12) }),
    // フィリピンの甘いスパゲッティ: ソーセージ・ひき肉・トマトソース・チェダーチーズ
    ph_spaghetti: p => { const D = plato(p), o = D.o; return D.s + W.noodleMound(p, 100, 104, 52, 18, '#f0d080', 'sp', { w: 2.4, n: 150, len: 34, sy: SYF, edge: '#c8a050' }) + W.mound(p, 100, 96, 34, 10, '#c8301e', 'sps', SYF) + byDepth(W.spots('spv', 8, 26, 9).map(([u, v], i) => { const [x, y] = at(o, u, v, 18); return [y, () => ing.hotdog(p, x, y, 14, 0, i)]; })) + W.cheese(p, 100, 84, 26, 30, 'spc', { c: '#f2b030' }); },

    // ---------- 副菜 ----------
    // トマトと玉ねぎのサラダ、塩卵（お好みで）
    ph_ensalada: K([['tomato', 12, 13], ['redOnion', 6, 12], ['saltedEgg', 2, 14]]),
    // アチャラ（青パパイヤの甘酢漬け）: パパイヤ・にんじん・赤ピーマン、レーズン（お好みで）
    ph_atchara: K([['papaya', 40, 14], ['pepperR', 4, 10], ['raisin', 3, 12]], { base: '#f2ecc8', minD: 5 }),
    // カンコン・アドボ（空芯菜）
    ph_kangkong: P([['greensLong', 24, 14]], { flecks: [garlicBits(14)], sauce: '#5a3018' }),
    // アンパラヤと卵: ゴーヤ・卵・トマト・玉ねぎ
    ph_ampalaya: P([['bitter', 14, 15], ['scramble', 10, 14], ['tomato', 3, 10]], { ing: { ...ing, bitter: (p, x, y, s) => W.coin(p, x, y, s * .42, '#3f6a24', { h: 2, top: Q.rg(p, [[0, '#e8f0c8'], [.5, '#a8c870'], [1, '#3f6a24']], .4, .35, .8) }) } }),
    // かぼちゃとささげのココナッツ煮、小えび（お好みで）
    ph_kalabasa: B('#f0d8a0', [['pumpkin', 8, 16], ['longBean', 4, 9], ['shrimp', 2, 12]]),
    // ルンピア（豚肉の揚げ春巻き）
    ph_lumpia: rolls(6, 40, '#d8402a'),
    // チョプスイ（野菜炒め）: キャベツ・にんじん・ハヤトウリ・カリフラワー・ピーマン、えび（お好みで）
    ph_chopsuey: P([['cabbage', 4, 13], ['carrot', 5, 12], ['chayote', 4, 12], ['cauliflower', 4, 12], ['pepperR', 3, 12], ['shrimp', 3, 12]], { sauce: '#e8d8b0' }),
    // アドボン・シタウ（ささげのアドボ）、豚バラ（お好みで）
    ph_adobong_sitaw: P([['longBean', 22, 10], ['porkBelly', 4, 10]], { sauce: '#5a3018', flecks: [garlicBits(10)] }),
    // ハヤトウリの炒め物: ハヤトウリ・トマト・玉ねぎ、ひき肉（お好みで）
    ph_ginisang_sayote: P([['chayote', 22, 14], ['tomato', 4, 10], ['mince', 3, 10]]),
    // ゆうがおの炒め煮: ゆうがお・トマト・玉ねぎ
    ph_ginisang_upo: B('#e8dcb8', [['upo', 12, 16], ['tomato', 3, 11]], { ing: { ...ing, upo: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#8ab060', { h: 3, top: Q.rg(p, [[0, '#f6f8e0'], [.7, '#e8f0c8'], [1, '#a8c880']], .4, .35, .8) }) } }),
    // もやしの炒め物: もやし・にんじん、いんげん・豆腐（お好みで）
    ph_ginisang_togue: P([['beanSprout', 30, 14], ['carrotStick', 6, 10], ['tofuFried', 3, 10]], { minD: 6, ing: { ...ing, tofuFried: (p, x, y, s, r) => W.tofuBlock(p, x, y, s, r, { sear: '#d8a040' }) } }),
    // キャベツの炒め物: キャベツ・にんじん・玉ねぎ
    ph_ginisang_repolyo: P([['cabbage', 18, 14], ['carrotStick', 6, 12], ['onion', 4, 12]]),
    // 焼きなすのサラダ: なす・トマト・赤玉ねぎ
    ph_ensaladang_talong: p => { const D = plato(p), o = D.o; return D.s + byDepth([-14, 6].map((v, i) => { const [x, y] = at(o, -10, v); return [y, () => W.pod(p, x, y, 100, -6, { c: '#4a2a3a', w: 14 })]; })) + byDepth(W.spots('etv', 14, 40, 9).map(([u, v, r], i) => { const [x, y] = at(o, u, v, 10); return [y, () => i % 2 ? W.tomatoDice(p, x, y, 9, i) : W.onionStrip(x, y, 9, r, '#c87aa8')]; })); },
    // 青マンゴーのサラダ: 青マンゴー・トマト・赤玉ねぎ
    ph_ensaladang_mangga: K([['mangoGreen', 12, 14], ['tomato', 8, 12], ['redOnion', 5, 11]]),
    // きゅうりと玉ねぎの酢の物
    ph_ensaladang_pipino: K([['cucumber', 16, 13], ['redOnion', 6, 12]], { base: '#f2f0dc' }),
    // さつまいもの葉のサラダ: 葉・トマト・赤玉ねぎ、塩卵（お好みで）
    ph_talbos_kamote: K([['spinach', 12, 13], ['tomato', 6, 11], ['redOnion', 4, 11], ['saltedEgg', 1, 13]]),
    // キニラウ（魚の酢じめ）: まぐろ・赤玉ねぎ・青唐辛子・カラマンシー、きゅうり（お好みで）
    ph_kinilaw: K([['tuna', 14, 15], ['redOnion', 5, 11], ['cucumber', 4, 11], ['greenChiliLarge', 3, 8]], { base: '#f2f0e0', after: (o, V, p) => calamansi(p, o.cx + 42, o.cy - 6, 11) }),
    // 青マンゴーの漬物
    ph_burong_mangga: K([['mangoSlice', 12, 20]], { minD: 12, base: '#e8e0a0' }),
    // ギナタアン・ランカ（若いジャックフルーツのココナッツ煮）: ジャックフルーツ・青唐辛子、小えび（お好みで）
    ph_ginataang_langka: B('#f2e2b8', [['jackfruit', 10, 16], ['greenChiliLarge', 3, 10], ['shrimp', 2, 12]]),
    // なすのアドボ
    ph_adobong_talong: B('#4a2210', [['eggplantAdobo', 10, 18]], { flecks: [garlicBits(10)] }),
    // ルンピアン・グライ（野菜の揚げ春巻き）
    ph_lumpiang_gulay: rolls(4, 50, '#e8dcb8'),
    // オコイ（小えびと野菜のかき揚げ）
    ph_okoy: P([['okoy', 6, 26]], { minD: 22, H: 10 }),
    // フィリピンのマカロニサラダ: マカロニ・マヨネーズ・にんじん・チェダー・玉ねぎ、鶏・レーズン（お好みで）
    ph_macaroni_salad: K([['macaroniCream', 22, 15], ['carrot', 6, 9], ['cheese', 5, 10], ['raisin', 3, 12]], { base: '#f6ecd0', minD: 6 }),
    // ゆでオクラ、トマト（お好みで）
    ph_nilagang_okra: P([['okraWhole', 10, 16], ['tomato', 3, 10]], { minD: 12, ing: { ...ing, okraWhole: (p, x, y, s, r) => W.pod(p, x, y, s * 1.6, r, { c: '#4a8a2a', w: 6 }) } }),
    // チンゲン菜のにんにく炒め
    ph_ginisang_pechay: P([['pechay', 12, 16]], { minD: 14, flecks: [garlicBits(16)] }),
    // バターのコーン・にんじん・いんげん、グリンピース（お好みで）
    ph_buttered_veg: P([['corn', 30, 13], ['carrot', 10, 9], ['greenBean', 6, 8], ['pea', 8, 12]], { minD: 6, after: (o, D, p) => W.butterPat(p, o.cx, o.cy - 18, 9) }),

    // ---------- 汁物 ----------
    // シニガン（豚の酸っぱいタマリンドのスープ）: 豚・大根・ささげ・空芯菜・トマト・玉ねぎ・青唐辛子
    ph_sinigang: sinigang([['porkBelly', 4, 14], ['labanos', 4, 13], ['longBean', 3, 9], ['greensLong', 3, 12], ['tomato', 3, 11], ['greenChiliLarge', 1, 10]]),
    // ティノーラ（鶏の生姜スープ）: 鶏・ハヤトウリ・モリンガの葉
    ph_tinola: S('#f0e4b8', [['chicken', 4, 15], ['chayote', 4, 13], ['leaf', 14, 12]], { minD: 9 }),
    // ミスア（そうめんとへちまのスープ）: へちま・ミスア・ひき肉
    ph_misua: S('#ece0c0', [['patola', 6, 14], ['misua', 10, 14], ['mince', 3, 10]], { minD: 9 }),
    // えびのシニガン: えび・大根・オクラ・空芯菜・トマト・青唐辛子
    ph_sinigang_hipon: sinigang([['shrimpHead', 4, 16], ['labanos', 3, 13], ['okra', 3, 13], ['greensLong', 3, 12], ['tomato', 2, 11], ['greenChiliLarge', 1, 10]]),
    // ミルクフィッシュのシニガン: 魚の切り身・大根・なす・トマト・青唐辛子
    ph_sinigang_bangus: sinigang([['fish', 3, 20], ['labanos', 3, 13], ['eggplant', 3, 12], ['tomato', 2, 11], ['greensLong', 2, 12], ['greenChiliLarge', 1, 10]]),
    // 牛肉のシニガン（里芋入り）: 牛肉・里芋・大根・ささげ・空芯菜・トマト
    ph_sinigang_baka: sinigang([['beef', 4, 14], ['taro', 3, 16], ['labanos', 3, 13], ['longBean', 2, 9], ['greensLong', 2, 12], ['tomato', 2, 11]]),
    // 鮭のみそシニガン: 鮭・みそ・からし菜・大根・トマト・青唐辛子
    ph_sinigang_miso: S('#c8a060', [['salmon', 3, 18], ['greensLong', 3, 12], ['labanos', 3, 13], ['tomato', 2, 10], ['greenChiliLarge', 1, 10]], { minD: 10 }),
    // ニラガン・バカ（牛肉と野菜のスープ）: 牛肉・じゃがいも・とうもろこし・キャベツ・チンゲン菜、バナナ（お好みで）
    ph_nilagang_baka: S('#e0c890', [['beef', 4, 14], ['potato', 3, 14], ['cornCob', 2, 18], ['cabbage', 2, 14], ['pechay', 2, 12], ['saba', 1, 14]], { minD: 12 }),
    // ニラガン・バボイ（豚と野菜のスープ）: 豚・じゃがいも・バナナ・キャベツ・チンゲン菜
    ph_nilagang_baboy: S('#e8d4a0', [['porkBelly', 4, 14], ['potato', 3, 14], ['saba', 2, 14], ['cabbage', 2, 14], ['pechay', 2, 12]], { minD: 12 }),
    // ブラロ（牛すねと骨髄のスープ）: 牛すね・とうもろこし・キャベツ・チンゲン菜
    ph_bulalo: S('#e0c890', [['shank', 2, 26], ['cornCob', 2, 18], ['cabbage', 2, 14], ['pechay', 2, 12]], { minD: 18, ing: { ...ing, shank: (p, x, y, s) => W.coin(p, x, y, s * .55, '#6a3418', { h: 6, top: Q.rg(p, [[0, '#f2e0c0'], [.25, '#e8d0a0'], [.32, '#8a4a2a'], [1, '#5a2a14']], .4, .35, .8) }) }, oil: [10, '#f0c040'] }),
    // プチェロ（豚とバナナとひよこ豆のトマト煮）: 豚・バナナ・ひよこ豆・じゃがいも・キャベツ・チンゲン菜
    ph_pochero: B('#c8401e', [['porkTomato', 5, 15], ['saba', 3, 15], ['chickpea', 6, 14], ['potato', 2, 13], ['pechay', 2, 12]]),
    // ソパス（鶏とマカロニのミルクスープ）: 鶏・マカロニ・エバミルク・にんじん・キャベツ、ソーセージ（お好みで）
    ph_sopas: S('#f6ecd0', [['macaroni', 10, 14], ['chicken', 3, 12], ['carrot', 4, 9], ['cabbage', 2, 12], ['hotdog', 3, 13]], { minD: 9 }),
    // モロ（豚のワンタンスープ）: ワンタン・鶏・にんじん・卵
    ph_molo: S('#ecdcb0', [['wonton', 6, 22], ['carrot', 3, 8]], { minD: 16, flecks: [garlicBits(12), [NEGI, 8, 1.4]] }),
    // ソタンホン（鶏と春雨のスープ）: 鶏・春雨・にんじん・キャベツ、ゆで卵（お好みで）
    ph_sotanghon: S('#e8c890', [['misua', 10, 14], ['chicken', 3, 12], ['carrotStick', 4, 10], ['cabbage', 2, 12], ['egg', 1, 14]], { minD: 9, flecks: [garlicBits(10)] }),
    // ムール貝の生姜スープ: ムール貝・モリンガの葉、ハヤトウリ（お好みで）
    ph_tinolang_tahong: S('#ece4c8', [['mussel', 7, 16], ['leaf', 10, 12], ['chayote', 2, 12]], { minD: 10 }),
    // とうもろこしとモリンガのスープ、小えび・卵（お好みで）
    ph_sinabawang_mais: S('#f2e0a0', [['corn', 22, 13], ['leaf', 10, 12], ['shrimp', 2, 12]], { minD: 6 }),
    // ペサン・イスダ（魚の生姜スープ）: 魚・チンゲン菜・キャベツ、みそのたれ
    ph_pesang_isda: S('#ece4cc', [['fish', 3, 20], ['pechay', 2, 12], ['cabbage', 2, 13], ['potato', 2, 11]], { minD: 12 }),
    // ピカディージョ（牛ひき肉とじゃがいものスープ）: ひき肉・じゃがいも・トマト・玉ねぎ
    ph_picadillo: S('#c8803a', [['mince', 6, 12], ['potato', 6, 11], ['carrot', 3, 9], ['tomato', 2, 10]], { minD: 8 }),
    // ブランラン（とぎ汁の野菜スープ）: かぼちゃ・オクラ・ささげ・なす・トマト・玉ねぎ
    ph_bulanglang: S('#ece4cc', [['pumpkin', 3, 13], ['okra', 3, 13], ['longBean', 2, 9], ['eggplant', 2, 12], ['tomato', 2, 10]], { minD: 10 }),
    // ビナコル（ココナッツジュースの鶏スープ）: 鶏・ハヤトウリ・モリンガの葉、ココナッツの果肉（お好みで）
    ph_binakol: S('#f4ecd8', [['chicken', 4, 15], ['chayote', 3, 13], ['leaf', 10, 12], ['coconut', 3, 12]], { minD: 9, ing: { ...ing, coconut: (p, x, y, s, r) => Q.prism(p, x, y, [[-s / 2, -2], [s / 2, -2], [s / 2, 2], [-s / 2, 2]], 2, '#fbf8f0', { rot: r, line: .3 }) } }),
    // ロミ（とろみの太麺スープ）: 太い卵麺・豚・卵・キャベツ・にんじん、レバー（お好みで）
    ph_lomi: S('#d8b070', [['noodleBit', 12, 18], ['porkSlice', 3, 12], ['eggRibbon', 3, 14], ['cabbage', 2, 12], ['carrotStick', 3, 10]], { minD: 8 }),
    // シナンパルカン・マノック（タマリンドの葉の鶏スープ）: 鶏・トマト・玉ねぎ、ささげ・青唐辛子（お好みで）
    ph_sinampalukang_manok: sinigang([['chicken', 4, 15], ['tomato', 3, 11], ['leaf', 8, 11], ['longBean', 2, 9], ['greenChiliLarge', 1, 10]]),
    // ハラアン（あさりと生姜のスープ）: あさり・モリンガの葉、トマト（お好みで）
    ph_halaan: S('#ece4cc', [['clam', 8, 16], ['leaf', 8, 12], ['tomato', 2, 10]], { minD: 10 }),
};
