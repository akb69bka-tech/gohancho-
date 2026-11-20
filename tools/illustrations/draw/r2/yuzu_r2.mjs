// 花森ゆず 第2回（組A: 葉物・せん切り・切り身の誤読）17品
// 原則: 明度で分ける／決め手を1つ誇張／192px で効かない細部は消す／数を減らして大きく／材料（ings と seas）にない具は描かない／縁は藍
// 書き出し: node tools/illustrations/draw/r2/render_r2.mjs tools/illustrations/draw/r2/yuzu_r2.mjs <出力フォルダ> [id...]（gohancho/img/dish と manifest には触らない）
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;
const INDIGO = '#2c4c7c';

function spots(seed, n, rmax, minD, { cx = 100, cy = 100, sy = 1, ex = [], exD = 0 } = {}){
    const R = rng('yz2' + seed), out = [];
    for (let t = 0; t < 9000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD) && ex.every(([u, v]) => Math.hypot(u - x, v - y) >= exD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
const shine = (cx, cy, R, op = .4, w = 1.8) => `<path d="M${f(cx - R * .6)},${f(cy + R * .1)} A${f(R * .62)},${f(R * .62)} 0 0 1 ${f(cx - R * .08)},${f(cy - R * .56)}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function drops(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 2.4 } = {}){
    const R = rng(p.id + 'yz2oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 白い鉢に藍の線（深さのある器）
const indigoBowl = (p, inside = '#fbf9f2', { R = 92, lip = .87 } = {}) => K.bowl(p, { glaze: '#f6f2ea', inside, R, lip }) + `<circle cx="100" cy="100" r="${R - 5}" fill="none" stroke="${INDIGO}" stroke-width="2.4"/>`;
// 素焼き・土の器の縁に藍の線を1本
const clayBowl = (p, glaze, inside) => K.bowl(p, { glaze, inside, lip: .86 }) + `<circle cx="100" cy="100" r="88.5" fill="none" stroke="${INDIGO}" stroke-width="2"/>`;
const soup = (p, R, c, glow = .4) => K.liquid(p, { R, c, op: 1, shine: false }) + `<circle cx="95" cy="93" r="${f(R * .66)}" fill="${lt(c, .25)}" opacity="${glow}"/>`;

export default {
    // Tumis jamur tiram: ひらたけは扇形のかさと放射状のひだで「きのこ」と分かる形に。不透明にして重ねても濁らせない。赤唐辛子・ねぎ・エシャロット・にんにく（材料と調味料どおり）を甘醤油のたれの上に
    id_tumisjamur: p => {
        const out = [K.plate(p), K.pool(p, 100, 102, 146, '#6a3a1a', { op: .9, seed: 3, sy: .9 })];
        [[74, 78, -20], [124, 72, 25], [70, 124, -110], [128, 124, 140], [100, 100, 5], [100, 148, 180], [150, 98, 80]].forEach(([x, y, r], i) => out.push(K.yzOysterMush(p, x, y, i === 4 ? 44 : 40, r, { seed: i, c: i % 2 ? '#ddd0b6' : '#ebe1cc', glaze: '#9a5a24' })));
        [[96, 70, 30], [52, 100, -20], [146, 140, 60], [88, 128, 10], [140, 70, -50]].forEach(([x, y, r]) => out.push(K.yzChiliSlant(p, x, y, 12, r)));
        [[116, 98, 40], [76, 150, -30], [58, 84, 70], [120, 152, 20], [150, 118, -60], [104, 50, 0]].forEach(([x, y, r]) => out.push(K.yzScallionSlant(p, x, y, 11, r)));
        [[86, 104], [114, 124], [134, 92]].forEach(([x, y]) => out.push(K.yzShallotSlice(p, x, y, 10, 20)));
        out.push(K.yzGarlicSlice(p, 106, 84, 8, 30, { fried: .3 }), K.yzGarlicSlice(p, 62, 140, 8, -20, { fried: .3 }));
        out.push(shine(100, 102, 66, .3));
        return out.join('');
    },

    // Karedok: 生野菜は種類ごとに区画を分けて大きく並べ（きゅうり・ささげ・もやし・キャベツ・丸なす・ケマンギ）、中央にピーナッツソースと揚げピーナッツ。重ねて濁らせない
    id_karedok: p => {
        const out = [K.plate(p)];
        [[66, 62, 0], [86, 52, 30], [52, 82, 60], [72, 80, 10]].forEach(([x, y, r]) => out.push(K.cucumberSlice(p, x, y, 22, r, { oval: 1.1 })));
        [[120, 46, 12], [130, 56, 6], [116, 60, 16], [138, 66, 10], [126, 70, 14]].forEach(([x, y, r]) => out.push(K.greenBean(p, x, y, 32, r, { c: '#3a8a2a' })));
        [[156, 92, 80], [150, 110, 100], [162, 112, 70], [142, 92, 90], [152, 128, 110], [164, 132, 60], [140, 120, 85]].forEach(([x, y, r]) => out.push(K.yzSprout(p, x, y, 24, r)));
        [[118, 154, 20], [96, 160, -10], [134, 142, 40], [108, 146, 70], [84, 152, 0]].forEach(([x, y, r], i) => out.push(K.leafPiece(p, x, y, 24, r, { c: '#dfeab8', vein: '#f6fae8', seed: i })));
        [[58, 132], [70, 152], [46, 112]].forEach(([x, y]) => out.push(K.yzThaiEggplant(p, x, y, 24)));
        [[76, 120, 30], [62, 100, -40], [146, 76, 80], [88, 134, 10], [150, 146, 40]].forEach(([x, y, r]) => out.push(K.yzSmallLeaf(p, x, y, 17, r, { c: '#3f9a34' })));
        out.push(K.pool(p, 106, 102, 72, '#a86e34', { op: 1, seed: 2, sy: .9 }));
        spots('kd-pn', 9, 24, 10, { cx: 106, cy: 102 }).forEach(([x, y, r]) => out.push(K.yzPeanut(p, x, y, 12, r)));
        out.push(K.sprinkle(p, 106, 102, 56, { c: '#6a3e18', n: 14, r: .9 }));
        return out.join('');
    },

    // Saumon poêlé: ハムに見えないよう、鮭の決め手（白い脂の筋がならぶ・焼き色の縁・銀の皮）を誇張。いんげん・レモン・バターのソースにディル（材料と調味料どおり）
    fr_saumon: p => [
        K.plate(p),
        K.pool(p, 92, 110, 96, '#f3dc8a', { op: .8, seed: 3, sy: .7 }),
        K.yzSalmonFillet(p, 86, 98, 92, 52, -8),
        ...[[140, 64, -30], [146, 70, -26], [150, 78, -34], [138, 76, -22]].map(([x, y, r]) => K.greenBean(p, x, y, 52, r, { c: '#3f8f2f' })),
        K.lemon(p, 140, 134, 34, -30),
        K.yzDill(p, 74, 92, 20, -20), K.yzDill(p, 100, 104, 18, 30),
        K.sprinkle(p, 86, 98, 60, { c: '#2a2420', n: 10, r: .6 }),
    ].join(''),

    // Smażona cukinia: クッキーに見えないよう、輪切りの断面（濃い緑の皮の輪・淡い身・中心の種の輪）を衣ごしに見せる。数を7枚に減らして大きく、にんにく少々
    pl_cukinia: p => {
        const out = [K.plate(p)];
        [[66, 70, 0], [110, 62, 30], [150, 92, 60], [58, 116, 90], [102, 108, 120], [140, 138, 150], [90, 150, 180]].forEach(([x, y, r], i) => out.push(K.yzZucchiniFried(p, x, y, 42, r, { seed: i })));
        out.push(K.sprinkle(p, 100, 104, 110, { c: '#f4ecc8', n: 16, r: 1.1 }), K.sprinkle(p, 100, 104, 110, { c: '#3a2a1a', n: 12, r: .55 }));
        return out.join('');
    },

    // Surówka z selera: 細い線の集まりをやめ、太めのせん切りのセロリアックをクリームであえた山に。決め手は赤い皮の弧が見えるりんごのいちょう切りと黒いレーズン、レモンのくし切り
    pl_seler: p => {
        const out = [indigoBowl(p, '#f4f1e8'), `<g ${p.sh(.8)}><path ${T(100, 102)} d="${smooth(ring(56, 12, .14, rng(p.id + 'm')), true)}" fill="${p.rg('#f6f0dc', .2, .14)}"/></g>`];
        spots('sl-c', 40, 50, 9, { cy: 102 }).forEach(([x, y, r]) => out.push(K.yzStick(p, x, y, 22, 4.4, r, { c: '#f3ecd4', gloss: true })));
        spots('sl-a', 7, 44, 22, { cy: 102 }).forEach(([x, y, r]) => out.push(K.yzAppleBit(p, x, y, 16, r)));
        spots('sl-r', 9, 46, 14, { cy: 102 }).forEach(([x, y, r]) => out.push(K.yzRaisin(p, x, y, 9, r)));
        out.push(K.lemon(p, 146, 146, 30, -40));
        return out.join('');
    },

    // Céleri rémoulade: ポーランドのサラダと区別するため、平皿に流れをそろえて盛ったせん切り。マスタード入りのマヨの淡い黄色、刻んだパセリ、レモン。りんご・レーズンは入れない
    fr_celeri: p => {
        const out = [K.plate(p), `<g ${p.sh(.8)}><path ${T(94, 100)} d="${smooth(ring(46, 12, .12, rng(p.id + 'm'), 1.2, .9), true)}" fill="${p.rg('#f2e6b4', .2, .16)}"/></g>`];
        const R = rng(p.id + 'st');
        for (let i = 0; i < 90; i++){ const x = 94 + (R() - .5) * 92, y = 100 + (R() - .5) * 62; if (((x - 94) / 52) ** 2 + ((y - 100) / 40) ** 2 > 1) continue; out.push(K.yzStick(p, x, y, 26, 4, -25 + (R() - .5) * 30, { c: '#f6efd6', gloss: true, bend: .08 })); }
        out.push(`<path ${T(94, 100)} d="${smooth(ring(40, 10, .2, rng(p.id + 'g'), 1.2, .9), true)}" fill="#efd27a" opacity=".22"/>`);
        out.push(K.sprinkle(p, 94, 98, 70, { c: '#3a8a2c', n: 26, r: 1.1 }));
        out.push(K.lemon(p, 150, 140, 32, -40));
        return out.join('');
    },

    // Insalata di carote: オレンジの円をやめ、太めのせん切りにんじんを明暗3色でこんもりと。平葉パセリ（葉の形）とレモン、オリーブ油の照り。器は白に藍の縁
    it_carote: p => {
        const out = [K.plate(p), `<g ${p.sh(.8)}><path ${T(98, 102)} d="${smooth(ring(52, 12, .14, rng(p.id + 'm')), true)}" fill="${p.rg('#e8742a', .2, .25)}"/></g>`];
        const R = rng(p.id + 'cr');
        const st = [];
        for (let i = 0; i < 60; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 46; st.push([98 + Math.cos(a) * d, 102 + Math.sin(a) * d, R() * 180, d]); }
        st.sort((a, b) => b[3] - a[3]).forEach(([x, y, r, d], i) => out.push(K.yzStick(p, x, y, 20, 3.4, r, { c: mix('#d8601c', '#f8a050', 1 - d / 46), bend: .05 })));
        [[84, 86, 20], [112, 112, -40], [96, 124, 70], [118, 82, 140]].forEach(([x, y, r]) => out.push(K.yzFlatParsley(p, x, y, 18, r)));
        out.push(drops(p, 98, 102, 80, { n: 8, c: '#e6cf5a', op: .6, rmax: 1.6 }), K.lemon(p, 150, 142, 32, -40));
        return out.join('');
    },

    // Spinaci in padella: 三角の葉先・波打つ縁・白い軸を誇張したほうれん草の山。調味料のにんにくの薄切りと唐辛子少々、オリーブ油。縁は藍
    it_spinaci: p => {
        const out = [K.plate(p, { well: .76 }), `<g ${p.sh(.8)}><path ${T(100, 100)} d="${smooth(ring(58, 12, .16, rng(p.id + 'pile2')), true)}" fill="${p.rg('#1d4f1a', .15, .3)}"/></g>`];
        const R2 = rng(p.id + 'sl2');
        const lv = [];
        for (let i = 0; i < 20; i++){ const a = R2() * 6.283, dd = Math.sqrt(R2()) * 50; lv.push([100 + Math.cos(a) * dd, 100 + Math.sin(a) * dd * .95, a * 57.3 + 90 + (R2() - .5) * 80, dd, R2()]); }
        lv.sort((a, b) => b[3] - a[3]);
        lv.forEach(([x, y, r, dd, q], i) => { const t = 1 - dd / 50; out.push(K.yzSpinach2(p, x, y, 36 + q * 10, r, { c: mix('#1f6a20', '#4fae3a', t), seed: i, fold: q < .35 ? .55 : 1 })); });
        [[90, 92, 20], [116, 108, -40], [98, 122, 60]].forEach(([x, y, r]) => out.push(K.yzGarlicSlice(p, x, y, 10, r, { fried: .3 })));
        out.push(K.sprinkle(p, 100, 100, 70, { c: '#c8321e', n: 7, r: .8 }));
        return out.join('');
    },

    // Cicoria ripassata: ほうれん草と分けるため、細長くのこぎり状の縁と太く白い中肋を誇張したチコリ。青みの濃い緑。にんにくの薄切りと乾燥唐辛子（調味料どおり）
    it_cicoria: p => {
        const out = [K.plate(p)];
        const R = rng(p.id + 'lv');
        const lv = [];
        for (let i = 0; i < 18; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 42; lv.push([100 + Math.cos(a) * d, 100 + Math.sin(a) * d, R() * 180, d]); }
        lv.sort((a, b) => b[3] - a[3]).forEach(([x, y, r, d], i) => out.push(K.yzChicoryLeaf(p, x, y, 60, r, { c: mix('#1f4f2a', '#3f7f3a', 1 - d / 40), seed: i })));
        [[88, 92, 30], [116, 110, -20], [104, 76, 70], [80, 122, 0]].forEach(([x, y, r]) => out.push(K.yzGarlicSlice(p, x, y, 10, r, { fried: .45 })));
        out.push(K.yzDriedChili(p, 122, 86, 26, 30));
        out.push(drops(p, 100, 100, 90, { n: 7, c: '#e6cf5a', op: .55, rmax: 1.6 }));
        return out.join('');
    },

    // Ispanak çorbası: 淡い緑のヨーグルトのスープに、ほうれん草のざく切り（葉の形）とふっくらした米粒（玉ねぎはスープに溶けた形で描かない）。上にプル・ビベルの赤いバター。器は白に藍の縁
    tr_ispanak: p => {
        const out = [indigoBowl(p), soup(p, 74, '#c6d6a0', .45)];
        spots('is-l', 9, 54, 26).forEach(([x, y, r], i) => out.push(K.yzSpinach2(p, x, y, 26, r, { c: i % 2 ? '#2f7a2a' : '#3a8a30', seed: i })));
        spots('is-r', 16, 58, 10).forEach(([x, y, r]) => out.push(K.yzRiceGrain(p, x, y, 6, r)));
        out.push(`<circle cx="100" cy="100" r="74" fill="#e6eecf" opacity=".15"/>`);
        out.push(K.yzCreamSwirl(p, 102, 98, 52, { c: '#d8461c', turns: 1.4, w: 2.6, r0: .5 }), drops(p, 102, 98, 70, { n: 9, c: '#e0501e', op: .85, rmax: 1.8 }));
        out.push(shine(100, 100, 74, .4));
        return out.join('');
    },

    // Karalahana çorbası: 黒キャベツは濃い青緑のちりめんのリボン、白いんげんは腎臓形のクリーム色で明るく分ける。トマトペーストととうもろこし粉のとろみのスープ（玉ねぎは溶けて見えない）、プル・ビベルの赤い油
    tr_karalahana: p => {
        const out = [clayBowl(p, '#8a4a2a', '#5a2a18'), soup(p, 75, '#8a6a34', .35)];
        spots('kl-k', 9, 54, 26).forEach(([x, y, r], i) => out.push(K.yzKaleRibbon(p, x, y, 38, 11, r, { seed: i })));
        spots('kl-b', 10, 58, 18, { ex: [], exD: 0 }).forEach(([x, y, r]) => out.push(K.yzWhiteBean(p, x, y, 16, r)));
        out.push(drops(p, 100, 100, 120, { n: 12, c: '#d8461c', op: .8, rmax: 1.8 }), shine(100, 100, 74, .35));
        return out.join('');
    },

    // Collard greens: ほうれん草の葉と分けるため、幅広の帯に切ったくすんだ緑（横に走る葉脈と淡い軸）。ピンクのハムの角切り、煮汁（ポット・リカー）と赤唐辛子のフレーク
    us_collards: p => {
        const out = [indigoBowl(p, '#f4efe2'), soup(p, 74, '#7a7a3a', .3)];
        spots('cl-s', 11, 52, 24).forEach(([x, y, r], i) => out.push(K.yzCollardStrip(p, x, y, 40, 14, r, { seed: i, c: i % 3 === 0 ? '#567a32' : '#46682a' })));
        spots('cl-h', 6, 48, 24).forEach(([x, y, r]) => out.push(K.yzHamCube(p, x, y, 13, r)));
        out.push(K.sprinkle(p, 100, 100, 120, { c: '#c8321e', n: 14, r: .8 }), shine(100, 100, 74, .35));
        return out.join('');
    },

    // 고등어구이: 材料どおり切り身（一尾ではない）を2枚。さばの決め手（青緑の背に黒い波模様・銀の腹・焼き色）を大きく。おろした大根を添える。長皿の縁は藍
    kr_godeungeo: p => [
        K.longPlate(p, { base: '#f6f3ec', rim: INDIGO }),
        K.yzMackerelFillet(p, 92, 82, 124, 34, -4, { seed: 1 }),
        K.yzMackerelFillet(p, 92, 118, 124, 34, 3, { seed: 2 }),
        K.grated(p, 160, 132, 26),
    ].join(''),

    // Vinagrete: 数を減らして大きなさいの目に。トマト（赤と種）・玉ねぎ（白と層）・ピーマン（濃い緑）を明度で分け、パセリ。酢と油の汁。器は白に藍
    br_vinagrete: p => {
        const out = [indigoBowl(p), soup(p, 74, '#f1d6c4', .35)];
        const t = spots('vn-t', 10, 56, 20), o = spots('vn-o', 8, 56, 20, { ex: t, exD: 14 }), g = spots('vn-g', 7, 58, 20, { ex: [...t, ...o], exD: 13 });
        t.forEach(([x, y, r]) => out.push(K.yzDice(p, x, y, 15, r, 'tomato')));
        o.forEach(([x, y, r]) => out.push(K.yzDice(p, x, y, 13, r, 'onion')));
        g.forEach(([x, y, r]) => out.push(`<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="-6.5" y="-6.5" width="13" height="13" rx="2.4" fill="${p.g('#2f8a2c', .3, .3)}" stroke="#1d5a1a" stroke-width=".7"/></g><path d="M-4,-4.4 L2,-4.4" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`));
        spots('vn-p', 7, 56, 18).forEach(([x, y, r]) => out.push(K.yzFlatParsley(p, x, y, 11, r)));
        out.push(drops(p, 100, 100, 120, { n: 10, c: '#efd77a', op: .6, rmax: 1.6 }), shine(100, 100, 74, .4));
        return out.join('');
    },

    // Canelones: 筒を4本に減らして太く。決め手の断面（肉の詰め物）を両端に見せ、ベシャメルと焼き色のチーズ。耐熱皿の縁は藍
    es_canelones: p => [
        `<g ${p.sh(1.6)}><rect x="12" y="26" width="176" height="148" rx="20" fill="${p.rg('#f4ede0', .2, .14, .35, .3)}"/></g><rect x="17" y="31" width="166" height="138" rx="16" fill="none" stroke="${INDIGO}" stroke-width="2.2"/><rect x="24" y="38" width="152" height="124" rx="12" fill="${p.rg('#f6e8c4', .1, .2, .6, .6)}"/>`,
        ...[[100, 58], [100, 86], [100, 114], [100, 142]].map(([x, y], i) => K.yzCannelloni(p, x, y, 140, 26, 0, { seed: i })),
        `<rect x="26" y="40" width="148" height="120" rx="12" fill="#fbf2d6" opacity=".18"/>`,
        K.sprinkle(p, 100, 100, 120, { c: '#c9802a', n: 18, r: 1.2 }),
    ].join(''),

    // Molokhia: 色の円にならないよう、細かく刻んだ葉の粒（暗い緑の点）と、とろみの糸を引く照りをつける。上にタクリーヤ（揚げにんにく）とギーの粒、コリアンダーの粉（調味料どおり）
    eg_molokhia: p => {
        const out = [indigoBowl(p), soup(p, 75, '#2f7a2a', .35)];
        const R = rng(p.id + 'fl');
        let fl = '';
        for (let i = 0; i < 160; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 72; fl += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, R() * 360)} d="M-1.6,-.9 L1.6,-.6 L1.2,.9 L-1.4,.8Z" fill="${R() < .55 ? '#1a4f1a' : '#5aa040'}" opacity=".85"/>`; }
        out.push(fl);
        out.push(`<path d="M60,84 C76,70 98,80 112,70 C124,62 138,70 144,80" stroke="#bfe08a" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/><path d="M58,118 C78,108 96,126 118,114" stroke="#bfe08a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".45"/>`);
        out.push(K.yzFriedGarlic(p, 104, 98, 46, { n: 22 }), drops(p, 104, 98, 70, { n: 8, c: '#f0c040', op: .75, rmax: 2 }), K.sprinkle(p, 104, 98, 50, { c: '#8a6a3a', n: 14, r: .7 }));
        out.push(shine(100, 100, 74, .4));
        return out.join('');
    },

    // Ajoblanco: 白いスープと白い器が溶けないよう、器の内側をやや藍がかった灰に。白ぶどうの半割り（緑の皮の縁と透ける切り口）を大きく、湯むきアーモンド、オリーブ油の金色の点
    es_ajoblanco: p => {
        const out = [K.bowl(p, { glaze: '#f6f2ea', inside: '#d8dce4', lip: .87 }), `<circle cx="100" cy="100" r="87" fill="none" stroke="${INDIGO}" stroke-width="2.4"/>`, soup(p, 74, '#f2ecdc', .5)];
        const R = rng(p.id + 'tx');
        let tx = '';
        for (let i = 0; i < 30; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 66; tx += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" r="${f(.6 + R())}" fill="#e2d8c2" opacity=".8"/>`; }
        out.push(tx);
        [[86, 84, 20], [118, 88, -30], [100, 112, 60], [74, 116, 10], [126, 120, -60]].forEach(([x, y, r]) => out.push(K.yzGrapeHalf(p, x, y, 22, r)));
        [[106, 70, 30], [62, 96, -40], [140, 104, 80]].forEach(([x, y, r]) => out.push(K.yzAlmond(p, x, y, 14, r)));
        out.push(drops(p, 100, 100, 100, { n: 10, c: '#e0c030', op: .85, rmax: 2.2 }), shine(100, 100, 74, .45));
        return out.join('');
    },
};
