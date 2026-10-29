// インドネシア（id_*）の主菜・副菜・汁物・麺・ご飯ものを斜め上35度に（オーナーの決定 3番。基準書「8. 外国のおかず」）
// 器: 皿で食べる国。炒め物・揚げ物・焼き物・ご飯・麺は朱赤の縁の白い平皿（主食の id_staple にそろえる）、
// 汁物（soto・sop・sayur）は朱赤の線の白い碗、煮込み（ルンダン・スムール・オポール）は朱赤の縁の深皿、サンバルは石の小鉢（ちょべっ）。
// 材料は gohancho/packs/id.js の ings と seas にあるものだけ（? つきは描いてもよい）。
import * as W from './_world.mjs';
const { Q, f, at, byDepth, SYF, T: TR } = W;

// =========================================================
// インドネシアの器と部品
// =========================================================
const RED = '#c8504a';
const piring = (p, o = {}) => Q.plate(p, { line: 'none', edge: RED, ...o });
const mangkuk = (p, o = {}) => Q.shiroBowl(p, { rim: RED, line: 'none', ...o });
const deep = (p, o = {}) => Q.fukazara(p, { line: RED, ...o });
const cobek = (p, o = {}) => W.sideBowl(p, { outer: '#7a6a5c', inner: '#8a7a6a', edge: '#5a4a3e', h: 30, ...o });
const leafPlate = (p) => { const D = piring(p); const o = D.o; return { ...D, s: D.s + `<path d="${Q.blob(o.cx, o.cy, 74, 74 * SYF * .9, 'bl' + p.id, { n: 10, jit: .08 })}" fill="${Q.lg(p, [[0, '#7ab048'], [1, '#3f7a2a']])}" stroke="#2e5a1e" stroke-width=".8"/><path d="M${f(o.cx - 70)},${f(o.cy + 4)} L${f(o.cx + 70)},${f(o.cy - 4)}" stroke="#a8d070" stroke-width="1.2"/>` }; };
const CEL = ['#3f8a2a', '#5aa83a'], NEGI = '#4a9a2c', FRIED_SHALLOT = '#b8742a';
const ing = {
    chickenTurmeric: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .55, s * .4, i, { c: '#d8a030', n: 14, h: 6, rot: r }),
    chickenSoy: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#a8582a', soak: '#5a2410', k: .6, sy: .72 }),
    chickenGrill: (p, x, y, s, r, i) => W.drumstick(p, x, y, s * 1.6, r, i, { c: '#8a3a14', fried: false }),
    chickenOpor: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#f0d090', soak: '#d8a040', k: .4, sy: .72 }),
    beefSemur: (p, x, y, s, r, i) => W.dice(p, x, y, s, '#4a2010', p.id + 'bs' + i, { h: s * .55, top: Q.rg(p, [[0, '#8a4a24'], [.6, '#5a2a14'], [1, '#3a1a0a']], .4, .35, .8) }),
    rendang: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .55, s * .42, '#5a2a14', p.id + 'rd' + i, { n: 12, jit: .25, hi: .35, edge: '#3a1a0a' }) + W.flecks(p, x, y - s * .2, s * .4, 6, 'rdf' + i, ['#8a5a2a', '#a86a2a'], { ry: s * .2, s: 1 }),
    empal: (p, x, y, s, r, i) => W.cutSlab(p, x, y, s * .8, s * .5, 5, '#7a3a1a', p.id + 'em' + i, { rot: r, sear: '#4a1e0a', edgeC: '#a8603a' }),
    eggBalado: (p, x, y, s, r, i) => Q.lump(p, x, y - s * .2, s * .5, s * .4, '#f6eee0', p.id + 'eb' + i, { n: 10, jit: .05, hi: .7 }) + W.flecks(p, x, y - s * .5, s * .35, 8, 'ebf' + i, ['#c8281a', '#e8401e'], { ry: s * .15, s: 1.6 }),
    tofuFried: (p, x, y, s, r, i, liq) => W.tofuBlock(p, x, y, s, r, { sear: '#c8862e', liq }),
    tofuBacem: (p, x, y, s, r, i) => W.tofuBlock(p, x, y, s, r, { sear: '#8a4a1a' }),
    tempehBacem: (p, x, y, s, r, i) => W.dice(p, x, y, s, '#5a2a10', p.id + 'tb' + i, { h: s * .45, top: Q.rg(p, [[0, '#a8642a'], [.6, '#7a3a14'], [1, '#5a2a10']], .4, .35, .8) }),
    mendoan: (p, x, y, s, r, i) => Q.prism(p, x, y, [[-s * .7, -s * .45], [s * .7, -s * .45], [s * .7, s * .45], [-s * .7, s * .45]], 2.4, '#d8a858', { rot: r, line: .45, top: Q.rg(p, [[0, '#f6dca0'], [.6, '#e8c070'], [1, '#c89040']], .4, .35, .8) }) + W.flecks(p, x, y - 2, s * .5, 6, 'mdf' + i, [NEGI], { ry: s * .25, s: 1.2 }),
    fritter: (p, x, y, s, r, i) => W.crusty(p, x, y, s * .6, s * .45, i, { c: '#d89a3a', n: 18, h: 5, rot: r }) + W.flecks(p, x, y - 3, s * .4, 6, 'frf' + i, ['#e8742a', NEGI], { ry: s * .2, s: 1.2 }),
    perkedel: (p, x, y, s, r, i) => Q.prism(p, x, y, Array.from({ length: 12 }, (_, k) => { const a = k / 12 * 6.283; return [Math.cos(a) * s * .5, Math.sin(a) * s * .5]; }), s * .35, '#a8641e', { rot: 0, line: .45, top: Q.rg(p, [[0, '#e8b868'], [.6, '#c8863a'], [1, '#8a5a1e']], .4, .35, .8) }),
    peyek: (p, x, y, s, r, i) => `<path d="${Q.blob(x, y, s * .8, s * .5, p.id + 'py' + i, { n: 12, jit: .25 })}" fill="${Q.rg(p, [[0, '#f8e8c0'], [1, '#e0c080']], .4, .35, .8)}" stroke="#c8a060" stroke-width=".6"/>` + W.flecks(p, x, y, s * .5, 7, 'pyf' + i, ['#b8783a', '#d8a868'], { ry: s * .3, s: 2 }),
    potCrisp: (p, x, y, s, r) => W.ING.carrotStick(p, x, y, s, r).replace(/#e8742a/g, '#c8502a'),
    jackfruit: (p, x, y, s, r, i) => Q.lump(p, x, y, s * .5, s * .38, '#8a4a24', p.id + 'jf' + i, { n: 10, jit: .3, hi: .5, edge: '#5a2a10' }),
    anchovy: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .5)},0 Q0,-1.6 ${f(s * .5)},0 Q0,1.4 ${f(-s * .5)},0Z" fill="#d8c8a0" stroke="#8a7a5a" stroke-width=".4"/></g>`,
    bitterMelon: (p, x, y, s, r, i) => W.coin(p, x, y, s * .42, '#3f6a24', { h: 2, top: Q.rg(p, [[0, '#e8f0c8'], [.5, '#a8c870'], [.85, '#6a9a3a'], [1, '#3f6a24']], .4, .35, .8) }),
    meatballBakso: (p, x, y, s, r, i, liq) => W.ball(p, x, y - s * .2, s, '#c8a888', p.id + 'mb' + i, { hi: .6 }),
    fishBall: (p, x, y, s, r, i) => W.ball(p, x, y - s * .2, s, '#f2ece0', p.id + 'fb' + i, { hi: .6 }),
    oxtail: (p, x, y, s, r, i) => W.coin(p, x, y, s * .5, '#5a2a14', { h: 6, top: Q.rg(p, [[0, '#f2dcc0'], [.3, '#c89070'], [.5, '#8a4a2a'], [1, '#5a2a14']], .4, .35, .8) }),
    lilyBud: (p, x, y, s, r) => W.ING.carrotStick(p, x, y, s, r).replace(/#e8742a/g, '#d8a040'),
    woodEar: (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#3a2a22', 'we' + p.id + i, { wave: 3 }),
    glassNoodle: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s)},0 Q${f(-s / 3)},-4 0,0 T${f(s)},0" stroke="#efe8d8" stroke-width="1.2" fill="none" opacity=".9"/></g>`,
    luffa: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .45, '#4a7a2a', { h: 3, liq, top: Q.rg(p, [[0, '#f6f8e0'], [.7, '#dce8b8'], [1, '#6a9a3a']], .4, .35, .8) }),
    macaroni: (p, x, y, s, r) => `<g ${TR(x, y, r)}><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#d8b060" stroke-width="${f(s * .32)}" fill="none" stroke-linecap="round"/><path d="M${f(-s * .4)},0 Q0,${f(-s * .5)} ${f(s * .4)},0" stroke="#f6dc90" stroke-width="${f(s * .18)}" fill="none" stroke-linecap="round"/></g>`,
    bilimbi: (p, x, y, s, r, i) => W.coin(p, x, y, s * .36, '#8ab040', { h: 2, top: Q.rg(p, [[0, '#f0f6c0'], [1, '#a8c860']], .4, .35, .8) }),
    greenTomato: (p, x, y, s, r, i) => W.dice(p, x, y, s * .8, '#6a9a3a', p.id + 'gt' + i, { h: s * .4, top: Q.rg(p, [[0, '#e0f0a0'], [1, '#8ab848']], .4, .35, .8) }),
    cassavaLeaf: (p, x, y, s, r, i) => Q.leaf(p, x, y, s, r, '#3a6a22', 'cv' + p.id + i, { wave: 1.6 }),
    egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20),
    saltedEgg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, r % 40 - 20, { yolk: '#e8801e' }),
};
const M = (v, mode, c, items, o = {}) => p => W.make(p, { v, mode, c, items, ing, ...o });
const P = (items, o = {}) => M(piring, 'plate', null, items, { minD: 8, R: 54, H: 22, big: 1.25, ...o });   // 平皿に山盛り
const S = (c, items, o = {}) => M(mangkuk, 'soup', c, items, { minD: 12, ...o });                       // 碗の汁物
const B = (c, items, o = {}) => M(deep, 'braise', c, items, { minD: 13, ...o });                         // 深皿の煮込み
const sambalPot = (c, items, o = {}) => M(cobek, 'bowl', null, items, { minD: 7, base: c, H: 14, ...o });
const fs = (n = 14) => [FRIED_SHALLOT, n, 1.6];
// 丸ごとの魚の皿
const fishDish = (o, on) => p => W.fishOn(p, piring(p), { ...o, on: (x, y) => on(p, x, y) });
const sambalTop = (p, x, y, n = 30, c = ['#c8281a', '#e8401e', '#a81e10']) => W.flecks(p, x, y - 10, 46, n, 'st' + p.id, c, { ry: 10, s: 3 });

// =========================================================
// 品
// =========================================================
export default {
    // ---------- 主菜 ----------
    // アヤム・ゴレン（ターメリックの揚げ鶏）、きゅうり・キャベツ（お好みで）
    id_ayamgoreng: P([['chickenTurmeric', 5, 26], ['cucumber', 4, 12], ['cabbage', 2, 14]], { minD: 22, flecks: [fs(10)] }),
    // スムール（甘い醤油の牛肉煮込み）: 牛肉・じゃがいも、トマト（お好みで）
    id_semur: B('#4a1e0a', [['beefSemur', 9, 17], ['potRed', 4, 16]], { ing: { ...ing, potRed: (p, x, y, s, r, i) => Q.soakLump(p, x, y, s, i, { c: '#e8b060', soak: '#6a3010', k: .55, sy: .78 }) }, flecks: [fs(10)] }),
    // イカン・バラド（揚げ魚のサンバルがけ）: 丸ごとの魚・赤唐辛子・トマト・ライム
    id_ikanbalado: fishDish({ skin: '#a8682a', belly: '#d8a860', char: .4 }, (p, x, y) => sambalTop(p, x, y, 50) + W.lemon(p, x + 58, y + 26, 16, { wedge: true, c: '#8ab83a' })),
    // テルール・バラド（ゆで卵のサンバル）: 卵・赤唐辛子・トマト
    id_telurbalado: P([['eggBalado', 6, 24], ['sambalDab', 6, 18]], { minD: 18, sauce: '#c8301a' }),
    // バチェム（豆腐とテンペの甘煮）
    id_bacem: P([['tofuBacem', 6, 20], ['tempehBacem', 6, 20]], { minD: 18, sauce: '#6a2a10' }),
    // オポール・アヤム（鶏のココナッツミルク煮）、ゆで卵（お好みで）
    id_oporayam: B('#f2dca0', [['chickenOpor', 9, 18], ['egg', 2, 16]], { flecks: [fs(10)] }),
    // ルンダン（牛肉のココナッツ煮詰め）
    id_rendang: B('#5a2a10', [['rendang', 12, 18]], { flecks: [['#8a5a2a', 16, 1.4]] }),
    // アヤム・バカール（甘い醤油の焼き鶏）、きゅうり・レモンバジル（お好みで）
    id_ayambakar: P([['chickenGrill', 4, 22], ['cucumber', 4, 12], ['herb', 3, 12]], { minD: 22 }),
    // アヤム・グプレック（つぶした揚げ鶏とサンバル）
    id_ayamgeprek: P([['fritter', 4, 30], ['sambalDab', 4, 20], ['cucumber', 3, 12]], { minD: 22 }),
    // アヤム・ケチャップ（鶏の甘い醤油煮）: 鶏・トマト・青ねぎ
    id_ayamkecap: B('#5a2410', [['chickenSoy', 10, 18], ['tomato', 2, 12]], { flecks: [[NEGI, 14, 1.6]] }),
    // エンパル（甘いスパイスの揚げ牛肉）
    id_empal: P([['empal', 6, 26]], { minD: 22, flecks: [fs(10)] }),
    // サテ・カンビン（羊の串焼き）と甘い醤油のたれ、エシャロット・トマト
    id_satekambing: p => { const D = piring(p), o = D.o; return D.s + W.pool(p, o.cx + 30, o.cy + 22, 24, '#4a1e0a', 'sk') + W.skewers(p, o, 4, (x, y, i) => Q.lump(p, x, y - 2, 7, 5, '#7a3a1a', 'sk' + i, { n: 9, jit: .25, hi: .6, edge: '#4a1e0a' }), { L: 130, k: 5 }) + W.flecks(p, o.cx + 30, o.cy + 20, 18, 14, 'skf', ['#efdcae', '#c8281a', '#e8402a'], { ry: 8, s: 1.8 }); },
    // イカン・バカール（焼き魚の甘い醤油がけ）、ライム
    id_ikanbakar: fishDish({ skin: '#6a3414', belly: '#a8682a', char: .8 }, (p, x, y) => W.lemon(p, x + 58, y + 26, 16, { wedge: true, c: '#8ab83a' }) + W.ING.cucumber(p, x - 54, y + 26, 14)),
    // ペペス・イカン（魚のバナナの葉包み焼き）: 魚・レモンバジル・トマト
    id_pepesikan: p => { const D = leafPlate(p), o = D.o; return D.s + W.wholeFish(p, o.cx, o.cy - 2, 120, -6, 1, { skin: '#d8a040', belly: '#f0d080', char: .2 }) + W.flecks(p, o.cx, o.cy - 8, 40, 30, 'pp', ['#f0a030', '#c8281a', '#3f8a2a'], { ry: 8, s: 2 }); },
    // イカン・アサム・マニス（揚げ魚の甘酢あん）: 魚・にんじん・トマト、パイナップル・きゅうり（お好みで）
    id_ikanasammanis: P([['fishFried', 5, 24], ['carrotStick', 6, 14], ['tomato', 3, 12], ['pineapple', 3, 12]], { minD: 14, sauce: '#e8702a', sauceR: 44 }),
    // ウダン・バラド（えびのサンバル炒め）、じゃがいも（お好みで）
    id_udangbalado: P([['prawn', 8, 18], ['sambalDab', 8, 16], ['potato', 3, 10]], { minD: 12 }),
    // チュミ・ケチャップ（いかの甘い醤油炒め）: いか・赤唐辛子・青ねぎ
    id_cumikecap: P([['squid', 14, 18], ['chiliR', 4, 14], ['greensLong', 3, 10]], { sauce: '#4a1e0a', ing: { ...ing, squid: (p, x, y, s, r) => W.ING.squid(p, x, y, s, r).replace(/#fbece0/g, '#c8864a').replace(/#e0b8a0/g, '#8a4a1e') } }),
    // テルール・ダダール（厚焼きのオムレツ）: 卵・青ねぎ・エシャロット・赤唐辛子
    id_telurdadar: p => { const D = piring(p); return D.s + W.jeon(p, 100, 100, 58, 1, { c: '#e8b040', h: 8 }) + W.flecks(p, 100, 96, 46, 50, 'td', [NEGI, '#c8281a', '#d898a8'], { ry: 26, s: 1.8 }) + Q.shine(80, 84, 20, -8, .7); },
    // テルール・バリ（卵のバリ風スパイスソース）
    id_telurbali: B('#c8301a', [['eggBalado', 6, 22]], { ing: { ...ing, eggBalado: (p, x, y, s, r, i) => W.ING.egg(p, x, y, s, r, i) } }),
    // タフ・テルール（豆腐の卵焼きとピーナッツソース）: 豆腐・卵・もやし・ピーナッツ・青ねぎ
    id_tahutelur: p => { const D = piring(p), o = D.o; return D.s + W.jeon(p, 100, 102, 52, 1, { c: '#d8a040', h: 10 }) + W.pool(p, 100, 96, 34, '#a8601e', 'tt') + byDepth(W.spots('tts', 10, 30, 8).map(([u, v, r]) => { const [x, y] = at(o, u, v, 10); return [y, () => W.sprout(p, x, y, 14, r)]; })) + W.flecks(p, 100, 92, 30, 20, 'ttf', ['#d8a868', NEGI], { ry: 12, s: 1.8 }); },
    // サポ・タフ（卵豆腐と鶏の土鍋煮）: 卵豆腐・鶏・青菜・にんじん・きのこ、えび（お好みで）
    id_sapotahu: B('#b8803a', [['tofuFried', 6, 18], ['chicken', 4, 14], ['carrot', 4, 12], ['mushCap', 3, 12], ['greensLong', 3, 10]]),
    // ガドガド（ゆで野菜のピーナッツソース）: じゃがいも・いんげん・キャベツ・もやし・豆腐・テンペ・卵・ピーナッツ
    id_gadogado: P([['potato', 4, 14], ['longBean', 4, 10], ['cabbage', 3, 14], ['beanSprout', 5, 12], ['tofuFried', 3, 14], ['tempeh', 3, 14], ['egg', 2, 14], ['krupuk', 2, 18]], { sauce: '#b8783a', sauceR: 50, minD: 10, flecks: [['#c8864a', 14, 2]] }),

    // ---------- ご飯・麺 ----------
    // ナシ・ゴレン: ご飯・卵・きゅうり・トマト、鶏・えびせん（お好みで）
    id_nasigoreng: p => { const D = piring(p), o = D.o; return D.s + W.friedRice(p, 96, 104, 50, 24, 'ng', { cols: ['#b8642a', '#a8541e', '#c8783a'], edge: '#7a3a14', sy: SYF }) + W.friedEgg(p, ...at(o, -6, -4, 22), 40, 1) + [[42, 26], [50, 10]].map(([u, v]) => W.ING.cucumber(p, ...at(o, u, v), 14)).join('') + W.tomatoBall(p, ...at(o, 40, 40), 12) + W.ING.krupuk(p, ...at(o, -44, 32), 22, 0, 1); },
    // ナシ・ウドゥック（ココナッツご飯）: 錦糸の薄焼き卵、ピーナッツ・きゅうり・えびせん（お好みで）
    id_nasiuduk: p => { const D = piring(p), o = D.o; return D.s + W.riceMound(p, ...at(o, -16, -2), 44, 34, { sy: SYF }) + byDepth([['omelette', 38, -18], ['omelette', 46, -2], ['omelette', 36, 8], ['peanut', 24, 30], ['peanut', 30, 34], ['peanut', 20, 38], ['cucumber', 52, 22], ['krupuk', -40, 34]].map(([k, u, v], i) => { const [x, y] = at(o, u, v, 2); return [y, () => (ing[k] || W.ING[k])(p, x, y, k === 'krupuk' ? 30 : k === 'peanut' ? 16 : 22, -20, i)]; })) + W.flecks(p, ...at(o, -16, -10, 34), 22, 16, 'nu', [FRIED_SHALLOT, '#d8a868'], { ry: 6, s: 1.8 }); },
    // ナシ・リウェット（いりこご飯）: ご飯・いりこ、唐辛子（お好みで）
    id_nasiliwet: P([['anchovy', 18, 12], ['chiliG', 3, 12]], { rice: { cols: ['#fbf6ea', '#f4ecd8', '#fffdf6'], edge: '#d8ccb4' }, H: 24, R: 50, flecks: [['#c8281a', 8, 1.4]] }),
    // ミー・ゴレン（焼きそば）: 卵麺・鶏・キャベツ・青菜・卵
    id_miegoreng: P([['chickenSoy', 5, 12], ['cabbage', 4, 12], ['greensLong', 4, 10], ['scramble', 4, 12]], { noodle: { c: '#b8783a', edge: '#7a4a1e' }, H: 18, R: 50, flecks: [fs(14)] }),
    // ミー・アヤム（鶏そば）: 卵麺・甘辛く煮た鶏・青菜・青ねぎ、しいたけ（お好みで）
    id_mieayam: p => { const V = mangkuk(p), o = { cx: 100, cy: V.cy }; return V.s + `<g ${V.above}>${W.noodleMound(p, 100, V.cy, 70, 14, '#e8c070', 'ma', { w: 2.2, n: 160, len: 30, edge: '#b8903a' })}${byDepth(W.onHill(o, 'mam', 10, 30, 10, 14, (x, y, r, i) => ing.chickenSoy(p, x, y, 12, r, i), { lift: 6, cu: -16, cv: -6 }).concat(W.onHill(o, 'mag', 5, 24, 14, 14, (x, y, r, i) => W.ING.greensLong(p, x, y, 14, r, i), { lift: 6, cu: 30, cv: 4 })))}${W.flecks(p, 100, V.cy - 16, 40, 16, 'man', [NEGI], { ry: 12, s: 1.8 })}</g>` + V.shine(.5); },
    // ビーフン・ゴレン（焼きビーフン）: ビーフン・えび・卵・キャベツ・にんじん、青菜（お好みで）
    id_bihungoreng: P([['shrimp', 6, 14], ['scramble', 4, 12], ['cabbage', 3, 12], ['carrotStick', 6, 12], ['greensLong', 3, 10]], { noodle: { c: '#f2dcb0', edge: '#c8a870', w: 1.2, n: 220 }, H: 18, R: 50 }),

    // ---------- 副菜 ----------
    // カンクン炒め（空芯菜）: 空芯菜・赤唐辛子
    id_tumiskangkung: P([['greensLong', 22, 14], ['chiliR', 5, 14], ['garlic', 4, 12]]),
    // テンペ・オレック（甘辛いテンペ）: テンペ・赤唐辛子
    id_tempeorek: P([['tempehSweet', 30, 14], ['chiliLarge', 4, 10]], { flecks: [fs(10)] }),
    // ペルクデル（じゃがいものコロッケ）、セロリの葉（お好みで）
    id_perkedel: P([['perkedel', 6, 30]], { minD: 26, H: 10, flecks: [[CEL[0], 10, 1.4]] }),
    // トマトと唐辛子のサンバル、ライム（お好みで）
    id_sambal: sambalPot('#c8301a', [['chiliR', 4, 12], ['tomato', 3, 10]], { groove: true, crown: [['chiliLarge', 2, 14], ['tomatoChunk', 2, 14]], after: (o, V, p) => W.lemon(p, o.cx + 44, o.cy - 4, 15, { wedge: true, c: '#8ab83a' }) }),
    // ウラップ（ゆで野菜のココナッツ和え）: ささげ・ほうれん草・もやし・キャベツ・ココナッツ
    id_urap: P([['longBean', 5, 10], ['spinach', 6, 12], ['beanSprout', 6, 12], ['cabbage', 3, 12]], { flecks: [['#fbf6ea', 50, 1.8], ['#e8c070', 20, 1.6]] }),
    // チャプチャイ（えびと野菜の炒め物）: えび・にんじん・カリフラワー・キャベツ・青菜
    id_capcay: P([['shrimp', 5, 14], ['carrot', 6, 12], ['cauliflower', 4, 12], ['cabbage', 3, 12], ['greensLong', 3, 10]], { sauce: '#e8d8b0' }),
    // アチャール（きゅうりの即席漬け）: きゅうり・にんじん・エシャロット、唐辛子（お好みで）
    id_acar: M(W.sideBowl, 'bowl', null, [['cucumber', 12, 12], ['carrot', 8, 10], ['redOnion', 4, 10], ['chiliR', 2, 12]], { minD: 8, base: '#f2ecc8' }),
    // カレドック（生野菜のピーナッツソース）: きゅうり・ささげ・もやし・キャベツ・レモンバジル・ピーナッツ
    id_karedok: P([['cucumber', 5, 12], ['longBean', 4, 10], ['beanSprout', 5, 12], ['cabbage', 3, 12], ['herb', 3, 11]], { sauce: '#b8783a', sauceR: 48, flecks: [['#c8864a', 16, 2]] }),
    // サンバル・トラシ（えびみその唐辛子）: 唐辛子・ライム、トマト（お好みで）
    id_sambalterasi: sambalPot('#a8281a', [['chiliR', 3, 12]], { groove: true, crown: [['chiliR', 4, 15], ['shrimpPaste', 1, 16]], after: (o, V, p) => W.lemon(p, o.cx + 44, o.cy - 4, 15, { wedge: true, c: '#8ab83a' }), flecks: [['#5a2a14', 10, 1.4]] }),
    // サンバル・マタ（生のエシャロットの薬味）: エシャロット・唐辛子・ライム
    id_sambalmatah: M(W.sideBowl, 'bowl', null, [['redOnion', 14, 14], ['chiliR', 8, 12], ['chiliG', 3, 12]], { minD: 7, after: (o, V, p) => W.lemon(p, o.cx + 44, o.cy - 4, 15, { wedge: true, c: '#8ab83a' }) }),
    // サンバル・イジョ（青唐辛子のサンバル）、いりこ（お好みで）
    id_sambalijo: sambalPot('#6a9a3a', [['chiliG', 5, 12], ['greenTomato', 3, 10], ['anchovy', 4, 10]], { groove: true, crown: [['greenChiliLarge', 2, 14], ['greenTomato', 2, 13]] }),
    // もやし炒め、豆腐（お好みで）: もやし・赤唐辛子
    id_tumistauge: P([['beanSprout', 34, 14], ['tofuFried', 4, 10], ['chiliR', 3, 12]], { minD: 6 }),
    // いんげんとにんじんの炒め物、えび（お好みで）
    id_tumisbuncis: P([['greenBean', 14, 9], ['carrotStick', 10, 13], ['shrimp', 3, 12]]),
    // ハヤトウリの炒め物: ハヤトウリ・赤唐辛子、にんじん（お好みで）
    id_tumislabusiam: P([['chayote', 20, 14], ['carrotStick', 4, 12], ['chiliR', 4, 12]]),
    // ゴーヤと卵の炒め物: ゴーヤ・卵・赤唐辛子
    id_tumispare: P([['bitterMelon', 16, 15], ['scramble', 10, 14], ['chiliR', 3, 12]]),
    // スルンデン（スパイスのいりココナッツ）、ピーナッツ（お好みで）
    id_serundeng: M(W.sideBowl, 'bowl', null, [['peanut', 10, 14]], { minD: 8, base: '#b8803a', flecks: [['#d8a050', 60, 1.6], ['#8a5a2a', 30, 1.4]] }),
    // トゥロン・バラド（なすのサンバルがけ）: 長なす・赤唐辛子・トマト
    id_terongbalado: P([['eggplant', 8, 18], ['sambalDab', 8, 18]], { minD: 14, ing: { ...ing, eggplant: (p, x, y, s, r) => W.pod(p, x, y, s * 1.6, r, { c: '#5a2a4a', w: 7 }) } }),
    // メンドアン（ころものテンペ）: テンペ・小麦粉・青ねぎ
    id_mendoan: P([['mendoan', 6, 28]], { minD: 22, H: 10 }),
    // バクワン（野菜のかき揚げ）: キャベツ・にんじん・青ねぎ、もやし（お好みで）
    id_bakwan: P([['fritter', 6, 26], ['chiliG', 3, 12]], { minD: 22 }),
    // クンタン・クリン（揚げじゃがいもの甘辛がらめ）: じゃがいも・赤唐辛子、ピーナッツ（お好みで）
    id_kentangkering: P([['potCrisp', 34, 14], ['chiliLarge', 4, 10], ['peanut', 8, 14]], { minD: 6 }),
    // ルンペイェ（ピーナッツのせんべい）
    id_rempeyek: P([['peyek', 6, 30]], { minD: 26, H: 8 }),
    // ペペス・タフ（豆腐のバナナの葉蒸し）: 豆腐・卵・レモンバジル・赤唐辛子
    id_pepestahu: p => { const D = leafPlate(p), o = D.o; return D.s + byDepth([[-20, -4], [22, 4]].map(([u, v], i) => { const [x, y] = at(o, u, v, 2); return [y, () => `<path d="${Q.blob(x, y, 30, 18, 'pt' + i, { n: 10, jit: .08 })}" fill="${Q.rg(p, [[0, '#a8c868'], [1, '#5a8a34']], .4, .35, .8)}" stroke="#2e5a1e" stroke-width=".8"/><path d="${Q.blob(x, y - 2, 18, 10, 'pi' + i, { n: 10, jit: .1 })}" fill="${Q.rg(p, [[0, '#fbf2d8'], [1, '#e8d0a0']], .4, .35, .8)}"/>` + W.flecks(p, x, y - 2, 14, 8, 'pf' + i, ['#c8281a', '#3f8a2a'], { ry: 6, s: 1.4 }) + `<path d="M${f(x - 30)},${f(y)} l-6,-3 M${f(x + 30)},${f(y)} l6,-3" stroke="#d8b878" stroke-width="1.4"/>`]; })); },
    // グドゥッ（若いジャックフルーツのココナッツ煮）、卵（お好みで）
    id_gudeg: B('#8a3a1a', [['jackfruit', 10, 18], ['egg', 2, 16]], { ing: { ...ing, egg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, 0, { yolk: '#c8801e' }) } }),
    // キャッサバの葉のココナッツカレー、いりこ（お好みで）
    id_gulaidaunsingkong: S('#e8b040', [['cassavaLeaf', 12, 16], ['anchovy', 4, 10]], { minD: 8, oil: [8, '#e8901e'] }),
    // オラ・アリック（野菜入りのいり卵）: 卵・キャベツ・にんじん、青ねぎ（お好みで）
    id_orakarik: P([['scramble', 18, 16], ['shred', 8, 12], ['carrotStick', 6, 10]], { ing: { ...ing, shred: (p, x, y, s, r, i) => W.ING.cabbage(p, x, y, s * .7, r, i) }, flecks: [[NEGI, 12, 1.6]] }),
    // ひらたけの炒め物: ひらたけ・赤唐辛子、青ねぎ（お好みで）
    id_tumisjamur: P([['mushOyster', 22, 15], ['chiliR', 4, 12]], { flecks: [[NEGI, 12, 1.6]] }),

    // ---------- 汁物 ----------
    // サユール・アスム（タマリンドの野菜スープ）: とうもろこし・ハヤトウリ・ささげ・ピーナッツ
    id_sayurasem: S('#c8903a', [['corn', 10, 14], ['chayote', 5, 12], ['longBean', 3, 8], ['peanut', 6, 14]], { minD: 9, ing: { ...ing, corn: (p, x, y, s, r, i, liq) => W.coin(p, x, y, s * .5, '#e8b830', { h: 4, liq, top: Q.rg(p, [[0, '#fff2a0'], [.6, '#f6c83a'], [1, '#d09a1a']], .4, .35, .8) }) } }),
    // ソップ・アヤム（鶏と野菜のスープ）: 鶏・にんじん・じゃがいも・キャベツ・セロリと青ねぎ
    id_sopayam: S('#f2dca0', [['chicken', 4, 15], ['carrot', 6, 12], ['potato', 4, 12], ['cabbage', 3, 12]], { flecks: [[CEL[0], 12, 1.6], fs(10)], oil: [10, '#f0c040'] }),
    // サユール・ブニン（ほうれん草ととうもろこしの澄んだスープ）
    id_sayurbening: S('#e8e0b8', [['spinach', 8, 14], ['corn', 16, 13]], { minD: 8 }),
    // ソト・アヤム（ターメリックの鶏スープ）: 鶏・春雨・もやし・キャベツ、ゆで卵・ライム（お好みで）
    id_sotoayam: S('#f0c040', [['chicken', 4, 14], ['glassNoodle', 4, 14], ['beanSprout', 6, 12], ['saltedEgg', 1, 16]], { minD: 10, ing: { ...ing, saltedEgg: (p, x, y, s, r, i) => W.eggHalf(p, x, y, s * 1.4, 10) }, flecks: [[CEL[0], 12, 1.6], fs(12)] }),
    // サユール・ロデ（野菜のココナッツミルク煮）: ハヤトウリ・なす・ささげ・テンペ、ジャックフルーツ・青唐辛子（お好みで）
    id_sayurlodeh: S('#f2dca0', [['chayote', 4, 12], ['eggplant', 4, 12], ['longBean', 3, 8], ['tempeh', 3, 13], ['chiliG', 2, 12]], { minD: 10, oil: [8, '#e8b040'] }),
    // ソップ・ブントゥット（テールスープ）: テール・にんじん・じゃがいも・トマト・セロリと青ねぎ
    id_sopbuntut: S('#d8b878', [['oxtail', 4, 22], ['carrot', 5, 12], ['potato', 3, 12], ['tomato', 2, 10]], { minD: 12, flecks: [[CEL[0], 12, 1.6], fs(10)] }),
    // ラウォン（黒いスープ）: 牛肉、もやし・塩卵（お好みで）
    id_rawon: S('#3a2014', [['beef', 6, 14], ['beanSprout', 5, 12], ['saltedEgg', 1, 16]], { minD: 12, flecks: [[NEGI, 10, 1.6]], oil: [10, '#a8743a'] }),
    // ソト・ブタウィ（ココナッツと牛乳の牛肉スープ）: 牛肉・じゃがいも・トマト・青ねぎ、ライム（お好みで）
    id_sotobetawi: S('#f0d8a0', [['beef', 5, 14], ['potato', 3, 12], ['tomato', 3, 10]], { minD: 12, flecks: [[NEGI, 12, 1.6], fs(10)], oil: [10, '#e0a030'] }),
    // ソップ・カンビン（羊のスパイススープ）: 骨つきの羊・トマト・セロリと青ねぎ、にんじん（お好みで）
    id_sopkambing: S('#c8904a', [['lamb', 6, 15], ['tomato', 2, 10], ['carrot', 3, 12]], { minD: 12, flecks: [[CEL[0], 12, 1.6], fs(10)], oil: [12, '#e0a030'] }),
    // ピンダン・イカン（甘酸っぱい魚のスープ）: 魚の切り身・パイナップル・トマト、唐辛子（お好みで）
    id_pindangikan: S('#d8902a', [['fish', 3, 22], ['pineapple', 4, 12], ['tomato', 3, 10], ['chiliR', 2, 12]], { minD: 12 }),
    // イカン・クア・クニン（黄色い魚のスープ）: 魚の切り身・トマト・ライム、レモンバジル（お好みで）
    id_ikankuahkuning: S('#f0b830', [['fish', 3, 22], ['tomato', 3, 10], ['herb', 3, 11], ['chiliR', 2, 12]], { minD: 12, after: (S, V, p) => W.lemon(p, S.cx + 44, S.cy + 4, 14, { wedge: true, c: '#8ab83a' }) }),
    // スイートコーンと卵のスープ: コーン・卵・青ねぎ、鶏・にんじん（お好みで）
    id_supjagung: S('#f2dc90', [['corn', 26, 13], ['eggRibbon', 3, 14], ['carrot', 4, 8]], { minD: 6, flecks: [[NEGI, 12, 1.6]] }),
    // バクソ（牛肉団子のスープ）: 牛肉団子・青菜・セロリと青ねぎ、麺（お好みで）
    id_baksokuah: S('#d8c088', [['meatballBakso', 5, 20], ['greensLong', 3, 12], ['noodleBit', 5, 14]], { minD: 14, flecks: [[CEL[0], 10, 1.6], fs(12)] }),
    // テクワン（魚団子のスープ）: 魚団子・えび・くずいも・きくらげ・春雨・セロリと青ねぎ
    id_tekwan: S('#e8d0a0', [['fishBall', 8, 12], ['shrimp', 3, 13], ['radish', 3, 9], ['woodEar', 3, 12], ['glassNoodle', 3, 14]], { minD: 10, flecks: [[CEL[0], 10, 1.6], fs(10)] }),
    // マカロニとソーセージのスープ: マカロニ・ソーセージ・にんじん・じゃがいも・セロリ
    id_supmakaroni: S('#f2dcb0', [['macaroni', 10, 14], ['sausageCoin', 5, 14], ['carrot', 4, 12], ['potato', 3, 11]], { minD: 9, flecks: [[CEL[0], 12, 1.6]] }),
    // サユール・ボボール（ほうれん草のココナッツスープ）、ハヤトウリ（お好みで）
    id_sayurbobor: S('#ece0b8', [['spinach', 10, 14], ['chayote', 3, 12]], { minD: 9 }),
    // ブレネボン（赤いんげん豆のスープ）: 豆・牛すね・にんじん・セロリと青ねぎ
    id_brenebon: S('#8a3a24', [['kidney', 20, 14], ['beef', 4, 13], ['carrot', 4, 12]], { top: [['kidney', 14, 16]], minD: 7, flecks: [[CEL[0], 12, 1.6], fs(10)] }),
    // ミー・ゴドッグ（ジャワの卵入り汁そば）: 卵麺・卵・キャベツ、鶏・トマト（お好みで）
    id_migodog: S('#d8b070', [['noodleBit', 14, 16], ['eggRibbon', 3, 14], ['cabbage', 3, 12], ['tomato', 2, 10]], { minD: 8, flecks: [[CEL[0], 10, 1.6], fs(12)] }),
    // ガラン・アセム（ビリンビの酸っぱい鶏スープ）: 鶏・ビリンビ・青トマト・唐辛子・ココナッツミルク
    id_garangasem: S('#f0d898', [['chicken', 4, 14], ['bilimbi', 6, 13], ['greenTomato', 3, 12], ['chiliR', 2, 12], ['chiliG', 2, 12]], { minD: 10 }),
    // カリ・アヤム（鶏のカレースープ）: 鶏・じゃがいも・ココナッツミルク、にんじん（お好みで）
    id_kariayam: S('#e0902a', [['chickenOpor', 5, 16], ['potato', 4, 13], ['carrot', 3, 12]], { minD: 12, oil: [12, '#e8701e'] }),
    // キムロ（金針菜のスープ）: 鶏・金針菜・きくらげ・春雨・にんじん・セロリ、薄焼き卵（お好みで）
    id_kimlo: S('#e8d8a8', [['chicken', 3, 13], ['lilyBud', 6, 14], ['woodEar', 3, 12], ['glassNoodle', 3, 14], ['carrot', 4, 11], ['omelette', 2, 12]], { minD: 9, flecks: [[CEL[0], 10, 1.6]] }),
    // サユール・オヨン（へちまと春雨と卵のスープ）
    id_sayuroyong: S('#ece4c8', [['luffa', 7, 14], ['glassNoodle', 4, 14], ['eggRibbon', 3, 14]], { minD: 9 }),
};
