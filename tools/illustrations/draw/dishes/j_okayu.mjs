// おかゆ10品: 茶碗に、白いおかゆ（とろりとした面に、米粒がやわらかく浮く）と、それぞれの具
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk } = K;

// おかゆの面。tint は地の色、grains は米粒の数（全がゆは粒が見える）
function oyPorridge(p, { tint = '#f6f2e6', n = 70, seed = 1, R = 76, rim = '#e6dfc9' } = {}){
    const rd = rng(p.id + 'oy' + seed);
    let g = '';
    for (let i = 0; i < n; i++){
        const a = rd() * 6.28, d = Math.sqrt(rd()) * R * .92, gx = Math.cos(a) * d, gy = Math.sin(a) * d;
        const light = (gx + gy) < 0;
        g += `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="${f(2.9 + rd())}" ry="${f(1.5 + rd() * .3)}" transform="rotate(${f(rd() * 180)} ${f(gx)} ${f(gy)})" fill="${light ? '#ffffff' : '#ece5d2'}" stroke="${light ? '#efe9da' : '#d9d0b8'}" stroke-width=".45" opacity=".95"/>`;
    }
    return `<circle cx="100" cy="100" r="${R + 2}" fill="${rim}" opacity=".6"/>
        <circle cx="100" cy="100" r="${R}" fill="${p.rg(tint, .3, .16, .4, .36)}"/>
        <g ${T(100, 100)}>${g}</g>
        <path d="M${f(100 - R * .7)},${f(100 - R * .35)} A${f(R * .8)},${f(R * .8)} 0 0 1 ${f(100 - R * .2)},${f(100 - R * .76)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 小さな丸い角切り・粒（豆・きのこの切れはしなど）をばらまく
function oyDots(p, cx, cy, R, { n = 20, c = '#9a2f2a', rx = 3.4, ry = 2.6, seed = 1, cols = null } = {}){
    const rd = rng(p.id + 'dot' + seed);
    let o = '';
    for (let i = 0; i < n; i++){
        const a = rd() * 6.28, d = Math.sqrt(rd()) * R, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, col = cols ? cols[Math.floor(rd() * cols.length)] : c;
        o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx * (.85 + rd() * .3))}" ry="${f(ry * (.85 + rd() * .3))}" transform="rotate(${f(rd() * 180)} ${f(x)} ${f(y)})" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .3)}" stroke-width=".5"/>`;
    }
    return `<g ${p.sh(.5)}>${o}</g>`;
}
// 裂いた具（鮭・鶏のほぐし身）
function oyFlakes(p, cx, cy, R, { n = 10, c = '#f08d5c', seed = 1, w = 11, h = 5 } = {}){
    const rd = rng(p.id + 'fl' + seed);
    let o = '';
    for (let i = 0; i < n; i++){
        const a = rd() * 6.28, d = Math.sqrt(rd()) * R, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, ww = w * (.7 + rd() * .6), hh = h * (.7 + rd() * .6);
        o += `<g ${T(x, y, rd() * 180)}><path d="M${f(-ww / 2)},0 Q${f(-ww / 4)},${f(-hh)} ${f(ww / 2)},${f(-hh / 3)} Q${f(ww / 3)},${f(hh)} ${f(-ww / 3)},${f(hh * .7)}Z" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".5"/><path d="M${f(-ww / 3)},0 L${f(ww / 3)},0" stroke="${lt(c, .6)}" stroke-width=".6" opacity=".8"/></g>`;
    }
    return `<g ${p.sh(.5)}>${o}</g>`;
}
const steam = () => `<path d="M88,34 c-5,-7 5,-12 0,-19 M104,32 c-5,-7 5,-12 0,-19 M120,34 c-5,-7 5,-12 0,-19" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;

export default {
    // おかゆ（白がゆ）: 茶碗に、白いおかゆだけ（具なし）
    okayu: p => [
        K.chawan(p),
        oyPorridge(p, { n: 90 }),
        steam(),
    ].join(''),

    // 卵がゆ: ふわっと固まった卵と小口ねぎ
    tamagogayu: p => [
        K.chawan(p),
        oyPorridge(p, { tint: '#f7efd2', n: 60, seed: 2 }),
        K.scrambled(p, 100, 100, 100, { n: 8, seed: 2 }),
        K.scrambled(p, 84, 112, 70, { n: 4, seed: 5, c: '#fbe27a' }),
        K.scallions(p, 100, 100, 100, { n: 18, c: '#4f9a34' }),
        steam(),
    ].join(''),

    // 梅がゆ: 真ん中に梅干し、まわりに大葉の細切り
    umegayu: p => [
        K.chawan(p),
        oyPorridge(p, { n: 80, seed: 3 }),
        K.shreds(p, 100, 100, 70, { c: '#4a9a3a', n: 10, w: 1.8, len: .5, seed: 4, curve: .5 }),
        K.umeboshi(p, 96, 98, 38),
        K.umeboshi(p, 122, 122, 28),
        steam(),
    ].join(''),

    // 鮭がゆ: ほぐした焼き鮭と、のり、ねぎ
    shakegayu: p => [
        K.chawan(p),
        oyPorridge(p, { n: 80, seed: 4 }),
        oyFlakes(p, 100, 100, 46, { n: 14, c: '#f08d5c', seed: 1, w: 17, h: 7.5 }),
        oyFlakes(p, 100, 100, 40, { n: 6, c: '#f5b08a', seed: 2, w: 12, h: 6 }),
        K.noriStrips(p, 100, 100, 100, { n: 8 }),
        K.scallions(p, 100, 100, 90, { n: 12, c: '#4f9a34' }),
        steam(),
    ].join(''),

    // 七草がゆ: 刻んだ春の七草（緑）と、すずしろ（大根）・すずな（かぶ）の白い小片
    nanakusagayu: p => [
        K.chawan(p),
        oyPorridge(p, { tint: '#f1f4e4', n: 70, seed: 5 }),
        K.greens(p, 100, 100, 110, { n: 16, seed: 2, c: '#4b8f33' }),
        oyDots(p, 100, 100, 54, { n: 8, c: '#f4f1e0', rx: 4.2, ry: 4.2, seed: 6 }),
        K.greens(p, 100, 100, 100, { n: 9, seed: 7, c: '#6aa843', stems: '#b6d98a' }),
        steam(),
    ].join(''),

    // 中華がゆ（鶏と生姜）: ほぐした鶏、しょうがの細切り、ねぎ、ごま
    chukagayu: p => [
        K.chawan(p),
        oyPorridge(p, { tint: '#f7f1e0', n: 60, seed: 6 }),
        K.shreds(p, 100, 100, 100, { c: '#f1dcbf', n: 20, w: 3, len: .45, seed: 3, curve: .5 }),
        K.shreds(p, 100, 100, 90, { c: '#e8c995', n: 10, w: 2.4, len: .4, seed: 5, curve: .5 }),
        K.gingerShreds(p, 100, 100, 70),
        K.scallions(p, 100, 100, 100, { n: 20, c: '#4f9a34' }),
        K.sesame(p, 100, 100, 90, { n: 14, seed: 2 }),
        `<circle cx="84" cy="88" r="3.4" fill="#e9b94a" opacity=".5"/><circle cx="116" cy="112" r="2.8" fill="#e9b94a" opacity=".5"/>`,
        steam(),
    ].join(''),

    // さつまいもがゆ: 黄色いさつまいもの角切り
    satsumaimogayu: p => [
        K.chawan(p),
        oyPorridge(p, { tint: '#f7efd6', n: 70, seed: 7 }),
        ...[[78, 84, 20], [118, 80, -30], [96, 112, 70], [126, 116, 10], [74, 120, -40], [104, 76, 50], [136, 96, 80]].map(([x, y, r]) => K.sweetPotato(p, x, y, 30, r)),
        steam(),
    ].join(''),

    // かぼちゃがゆ: やわらかく煮えたかぼちゃ（オレンジ）
    kabochagayu: p => [
        K.chawan(p),
        oyPorridge(p, { tint: '#f9ecc4', n: 60, seed: 8 }),
        ...[[78, 86, 20], [118, 82, -30], [96, 114, 70], [128, 116, 10], [72, 122, -40], [104, 74, 50], [138, 98, 80]].map(([x, y, r]) => K.kabocha(p, x, y, 32, r)),
        steam(),
    ].join(''),

    // 小豆がゆ: ほんのり赤みのあるおかゆに、小豆
    azukigayu: p => [
        K.chawan(p),
        oyPorridge(p, { tint: '#f1d9d2', n: 60, seed: 9, rim: '#e0c4bb' }),
        oyDots(p, 100, 100, 62, { n: 34, cols: ['#7a2d2a', '#8c3a34', '#6a2422'], rx: 3.6, ry: 2.6, seed: 8 }),
        steam(),
    ].join(''),

    // きのこがゆ: しめじ・しいたけ・えのき、三つ葉
    kinokogayu: p => [
        K.chawan(p),
        oyPorridge(p, { tint: '#f4eedd', n: 70, seed: 10 }),
        K.shimeji(p, 76, 90, 46, 20), K.shimeji(p, 124, 80, 44, 150), K.shimeji(p, 114, 130, 46, -40), K.shimeji(p, 66, 128, 40, 100),
        K.shiitake(p, 100, 104, 30, 10, {}), K.shiitake(p, 136, 110, 26, 40, {}),
        K.shreds(p, 100, 100, 70, { c: '#e9dcc0', n: 8, w: 1.5, len: .5, seed: 6, curve: .4 }),
        K.mitsuba(p, 98, 76, 30, 20),
        steam(),
    ].join(''),
};
