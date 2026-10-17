// 汁物
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;

// ---------- この汁物ファイルだけの部品（zs〜） ----------
// いちょう切り（大根・にんじん）: 1/4 の円。c は色、core は中心寄りの明るい輪
function zsIcho(p, x, y, s, r = 0, { c = '#f1e6c8', edge = null, op = 1 } = {}){
    const h = s / 2, e = edge || dk(c, .22);
    return `<g ${T(x, y, r)} opacity="${op}"><path d="M${-h},${h} L${h},${h} A${s},${s} 0 0 0 ${-h},${-h} Z" fill="${p.g(c, .32, .22)}" stroke="${e}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M${f(-h + s * .72)},${h} A${f(s * .72)},${f(s * .72)} 0 0 0 ${-h},${f(h - s * .72)}" stroke="${lt(c, .4)}" stroke-width="1" fill="none" opacity=".8"/>
        <path d="M${f(-h + s * .12)},${f(-h + s * .3)} Q${f(-h + s * .45)},${f(-h + s * .35)} ${f(-h + s * .7)},${f(-h + s * .62)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// ささがきごぼう: 先の細い薄いそぎ片
function zsSasagaki(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${-s / 2},0 Q${f(-s * .1)},${f(-s * .16)} ${s / 2},${f(-s * .03)} Q${f(s * .05)},${f(s * .14)} ${-s / 2},0Z" fill="${p.g('#a07a50', .25, .3)}" stroke="#6e4a2a" stroke-width=".5"/>
        <path d="M${f(-s * .3)},${f(-s * .02)} Q0,${f(-s * .08)} ${f(s * .32)},${f(-s * .03)}" stroke="#d7bf98" stroke-width=".8" fill="none" opacity=".8"/></g>`;
}
// 汁に浮いた油の粒（ごま油・ラー油）
function zsOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// ふんわり固まった溶き卵（ふちが毛羽立った、半透明の雲）
function zsEgg(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'zse' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${smooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// 具をまんべんなく散らす位置（重なりすぎないように）
function zsSpots(seed, n, rmax, minD, cx = 100, cy = 100){
    const R = rng('zsspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// さいの目の野菜・具（角を丸めた立方体を上から: 上面と少しの側面）
function zsDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// あさり: open=true は殻が開いて白い内側と身が見える姿、false は縞模様の殻の外側に身が少しのぞく姿
function zsClam(p, x, y, s, r = 0, { seed = 1, meat = '#f0b46c', open = true } = {}){
    const R = rng(p.id + 'zcl' + seed + x + y);
    const k = s / 30;
    const outerC = ['#a8957c', '#8f8170', '#b39c80', '#7f766c'][Math.floor(R() * 4)];
    // 殻1枚: 蝶番（umbo）を (0,0) にした丸い三角
    const shell = `M0,0 C-3,1 -11,4 -12,10 C-12.5,15 -7,18 0,18 C7,18 12.5,15 12,10 C11,4 3,1 0,0Z`;
    if (!open){
        let zz = '';
        for (let i = 0; i < 4; i++){ const yy = 5 + i * 3.2, w = 8 + i * 1.2; zz += `<path d="M${-w},${yy} l2.5,-1.6 l2.5,1.6 l2.5,-1.6 l2.5,1.6 l2.5,-1.6 l2.5,1.6 l2.5,-1.6" transform="translate(${f(-w * .0)} 0)" stroke="${dk(outerC, .45)}" stroke-width=".8" fill="none" opacity=".55"/>`; }
        return `<g ${T(x, y, r, k)}><g transform="translate(0 -9)"><g ${p.sh(.6)}><path d="${shell}" fill="${p.g(outerC, .3, .32)}" stroke="${dk(outerC, .4)}" stroke-width=".7"/></g>
            ${zz}<path d="M-10,12 Q0,9 10,12 M-11.5,15 Q0,12 11.5,15" stroke="${lt(outerC, .35)}" stroke-width=".7" fill="none" opacity=".8"/>
            <path d="M-7,17.4 Q0,20.5 7,17.4 Q0,18.6 -7,17.4Z" fill="${meat}" stroke="${dk(meat, .3)}" stroke-width=".5"/>
            <path d="M-5,5 Q-2,2.6 1,3" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g></g>`;
    }
    const valve = a => `<g transform="rotate(${a})"><path d="${shell}" fill="${p.g(outerC, .2, .3)}" stroke="${dk(outerC, .4)}" stroke-width=".7"/>
        <path d="M0,1.6 C-3,2.6 -9.6,5 -10.4,10 C-10.8,14 -6.4,16.4 0,16.4 C6.4,16.4 10.8,14 10.4,10 C9.6,5 3,2.6 0,1.6Z" fill="${p.g('#f1ebed', .3, .14)}"/>
        <path d="M-9,13.6 Q0,18 9,13.6" stroke="#9a86b0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${valve(-62)}${valve(62)}</g>
        <g transform="rotate(-62)"><path d="M-7,9 C-7,3.5 7,3.5 7.4,9 C7.6,14 3,15.6 0,15.4 C-4,15.2 -7,13 -7,9Z" fill="${p.g(meat, .32, .28)}" stroke="${dk(meat, .32)}" stroke-width=".6"/>
        <path d="M-5.6,11.4 C-3,14.4 3,14.6 5.8,11" stroke="${dk(meat, .3)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-4,7.4 Q0,5.4 3.6,7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".75"/></g></g>`;
}
// 汁に沈む具の上にかかる、汁の膜（具が汁に浸かって見える）
function zsVeil(cx, cy, R, c, op){ return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${c}" opacity="${op}"/>`; }
// くずした豆腐・すくった絹ごし豆腐（不定形）
function zsTofuChunk(p, x, y, s, r = 0, { seed = 1, c = '#f8f3e6', tint = null } = {}){
    const R = rng(p.id + 'ztf' + seed + x + y);
    const pts = ring(s / 2, 9, .32, R, 1.15, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .75)}" fill="${p.g(c, .3, .18)}" stroke="${dk(c, .2)}" stroke-width=".6"/></g>
        ${tint ? `<path d="${smooth(pts.map(([a, b]) => [a * .9 + 1.2, b * .9 + 1.2]), true, .75)}" fill="${tint}" opacity=".35"/>` : ''}
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 細切りの具（酸辣湯の豆腐・しいたけ・たけのこ）
function zsStrip(p, x, y, L, w, r = 0, c = '#f6f0e0'){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="${-w / 2}" width="${L}" height="${w}" rx="${f(w * .4)}" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
</g>`;
}
// 薄切り玉ねぎ（煮て透き通った細い弧）
function zsOnionStrip(p, x, y, s, r = 0, { c = '#f6e2ae' } = {}){
    const d = `M${-s / 2},${f(s * .14)} Q0,${f(-s * .34)} ${s / 2},${f(s * .14)} L${f(s / 2 - 2)},${f(s * .16)} Q0,${f(-s * .2)} ${f(-s / 2 + 2)},${f(s * .16)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${c}" opacity=".62" stroke="${lt(c, .4)}" stroke-width=".9" stroke-linejoin="round"/><path d="M${f(-s * .34)},${f(-s * .02)} Q0,${f(-s * .24)} ${f(s * .3)},${f(-s * .04)}" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 生卵の黄身（スンドゥブ）: 半透明の白身＋つやのある黄身
function zsRawEgg(p, x, y, s){
    const R = rng(p.id + 'zre' + x);
    return `<path ${T(x, y)} d="${smooth(ring(s / 2, 10, .25, R))}" fill="#fbf6ea" opacity=".75" stroke="#e8dfc8" stroke-width=".6"/>
        <g ${p.sh(.6)}><circle cx="${x + 1}" cy="${y + 1}" r="${f(s * .26)}" fill="${p.rg('#f9a81e', .3, .2, .35, .32)}" stroke="#d98510" stroke-width=".7"/></g>
        <ellipse cx="${f(x - s * .06)}" cy="${f(y - s * .07)}" rx="${f(s * .09)}" ry="${f(s * .05)}" fill="#fff" opacity=".85" transform="rotate(-30 ${f(x - s * .06)} ${f(y - s * .07)})"/>`;
}
// 煮たトマト（皮が少しはがれたくし形のかけら）
function zsTomato(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'ztm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#e2412c', .3, .25)}" stroke="#a6261a" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="#f37a5c" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// クルトン（焼き色のついた小さな角切りパン）
function zsCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f(-s / 2 + s * .18)}" y="${f(-s / 2 + s * .18)}" width="${f(s * .5)}" height="${f(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
// 刻みパセリ（細かい緑の粒）
function zsParsley(p, x, y, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'zpa' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 360)} d="${smooth(ring(1 + R() * 1, 5, .6, R))}" fill="${R() < .5 ? '#3f8a2c' : '#5aa63c'}"/>`; }
    return out;
}
// 長ねぎの斜め薄切り（白〜薄緑の細い楕円の輪）
function zsNegiSlant(p, x, y, s, r = 0, { green = false } = {}){
    const c = green ? '#9cc56a' : '#eef2dc';
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .22)}" fill="${p.g(c, .2, .15)}" stroke="${dk(c, .28)}" stroke-width=".6" opacity=".95"/><ellipse rx="${f(s * .36)}" ry="${f(s * .12)}" fill="none" stroke="${dk(c, .15)}" stroke-width=".6"/></g>`;
}
// 汁のつや（ゆるい弧）
const zsShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 中華の白い碗（縁に色の線）
function zsChinaBowl(p, line){
    return K.bowl(p, { glaze: '#f6f2ea', inside: '#fbf9f3', R: 92 }) + `<circle cx="100" cy="100" r="86" fill="none" stroke="${line}" stroke-width="2.4" opacity=".9"/><circle cx="100" cy="100" r="82.4" fill="none" stroke="${line}" stroke-width=".8" opacity=".7"/>`;
}


export default {
    // 豆腐とわかめの味噌汁: 漆の椀、にごった味噌汁、さいの目の豆腐・わかめ・小口ねぎ
    misoshiru: p => [
        K.wan(p),
        K.liquid(p, { R: 76, c: '#c79a55', op: 1 }),
        `<circle cx="100" cy="100" r="66" fill="#e2c38c" opacity=".35"/>`,
        K.wakame(p, 78, 118, 30, 20, { seed: 1 }), K.wakame(p, 124, 86, 26, -40, { seed: 2 }), K.wakame(p, 112, 132, 22, 70, { seed: 3 }),
        K.tofu(p, 90, 86, 18, 18, 8), K.tofu(p, 116, 108, 18, 18, -12), K.tofu(p, 76, 100, 16, 16, 30), K.tofu(p, 106, 70, 16, 16, 20), K.tofu(p, 132, 120, 16, 16, -5),
        K.scallions(p, 100, 100, 70, { n: 12 }),
    ].join(''),

    // 豚汁: 黒漆（内朱）の椀、にごった味噌汁に豚バラ・大根とにんじんのいちょう切り・ささがきごぼう・こんにゃく・長ねぎ、ごま油の粒
    tonjiru: p => {
        const sp = zsSpots('ton', 22, 56, 17);
        const veg = sp.map(([x, y, r], i) => {
            const t = i % 5;
            return t === 0 || t === 3 ? zsIcho(p, x, y, 22, r, { c: '#efe2c0' })
                : t === 1 ? zsIcho(p, x, y, 18, r, { c: '#ec7b2d' })
                : t === 2 ? K.konnyaku(p, x, y, 17, r)
                : zsSasagaki(p, x, y, 22, r);
        }).join('');
        return [
            K.wan(p, { outer: '#2a2321', inner: '#8e2a1c' }),
            K.liquid(p, { R: 76, c: '#bf8a4a', op: 1 }),
            `<circle cx="100" cy="100" r="64" fill="#dcb47a" opacity=".3"/>`,
            `<g ${p.sh(.9)}>`, veg,
            K.porkSlice(p, 84, 84, 46, 25, { c: '#c99c78', fat: '#f4e4cc', char: false, gloss: .35, seed: 1 }),
            K.porkSlice(p, 122, 118, 44, -35, { c: '#c99c78', fat: '#f4e4cc', char: false, gloss: .35, seed: 2 }),
            K.porkSlice(p, 128, 76, 36, 70, { c: '#c4966f', fat: '#f4e4cc', char: false, gloss: .35, seed: 3 }),
            K.porkSlice(p, 76, 126, 36, -70, { c: '#c4966f', fat: '#f4e4cc', char: false, gloss: .35, seed: 4 }),
            zsSasagaki(p, 104, 102, 22, 30), zsSasagaki(p, 100, 66, 20, -20), zsSasagaki(p, 140, 100, 18, 80),
            `</g>`,
            K.negiPiece(p, 98, 92, 12, 20), K.negiPiece(p, 110, 132, 11, -30), K.negiPiece(p, 66, 100, 11, 50), K.negiPiece(p, 136, 136, 10, 10),
            K.scallions(p, 104, 104, 70, { n: 8, c: '#6aa83e' }),
            zsOil(p, 100, 100, 130, { n: 14, c: '#f0c25a', op: .55, rmax: 1.6 }),
        ].join('');
    },

    // ミネストローネ: 白いスープ皿、トマトの赤いスープに角切りのにんじん・玉ねぎ・キャベツ・ベーコン・トマト、パセリ
    minestrone: p => {
        const sp = zsSpots('min', 36, 58, 12.5);
        const items = sp.map(([x, y, r], i) => {
            const t = i % 6;
            return t === 0 || t === 4 ? zsDice(p, x, y, 13, r, '#ef7d2e')
                : t === 1 ? zsDice(p, x, y, 12, r, '#f2e4b6', { op: .92 })
                : t === 2 || t === 5 ? zsDice(p, x, y, 14, r, '#a8cf6e')
                : K.bacon(p, x, y, 15, 8, r);
        }).join('');
        return [
            K.bowl(p, { glaze: '#f3eee4', inside: '#fbf8f1' }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#c9a46a" stroke-width="1.6" opacity=".7"/>`,
            K.liquid(p, { R: 72, c: '#cf4429', op: 1 }),
            `<circle cx="100" cy="100" r="62" fill="#e0603c" opacity=".3"/>`,
            `<g ${p.sh(.7)}>`, items, `</g>`,
            zsShine(100, 100, 72, .35),
            zsParsley(p, 100, 100, 100, { n: 26 }),
        ].join('');
    },

    // 中華風卵スープ: 白い中華碗（藍の線）、澄んだ金色のスープにふわふわの溶き卵・わかめ・斜め切りの長ねぎ、ごま油
    tamagosoup: p => [
        zsChinaBowl(p, '#2c4c7c'),
        K.liquid(p, { R: 76, c: '#e0a648', op: .92 }),
        K.wakame(p, 70, 118, 30, 30, { seed: 1 }), K.wakame(p, 134, 82, 28, -40, { seed: 2 }), K.wakame(p, 122, 138, 24, 80, { seed: 3 }), K.wakame(p, 80, 70, 24, -10, { seed: 4 }), K.wakame(p, 106, 104, 22, 50, { seed: 5 }),
        zsEgg(p, 98, 90, 66, -15, { seed: 1 }), zsEgg(p, 84, 122, 56, 25, { seed: 2 }), zsEgg(p, 128, 110, 50, 70, { seed: 3 }),
        zsEgg(p, 116, 66, 48, 10, { seed: 4 }), zsEgg(p, 62, 94, 40, 80, { seed: 5 }), zsEgg(p, 108, 140, 44, -5, { seed: 6 }), zsEgg(p, 144, 94, 34, -60, { seed: 7 }),
        zsNegiSlant(p, 96, 106, 15, 30), zsNegiSlant(p, 120, 92, 14, -20, { green: true }), zsNegiSlant(p, 80, 92, 13, 60, { green: true }), zsNegiSlant(p, 112, 124, 14, 10), zsNegiSlant(p, 140, 120, 12, 80, { green: true }), zsNegiSlant(p, 92, 64, 12, -40),
        zsOil(p, 100, 100, 136, { n: 12, c: '#f2c24c', op: .6, rmax: 1.8 }),
        zsShine(100, 100, 76, .4),
    ].join(''),

    // 玉ねぎのコンソメスープ: 白いスープ皿（金の縁）、澄んだ琥珀色に透き通った薄切り玉ねぎ・細切りベーコン・パセリ
    consomme: p => {
        const sp = zsSpots('con', 16, 54, 16);
        return [
            K.bowl(p, { glaze: '#f7f3ea', inside: '#fcfaf4' }),
            `<circle cx="100" cy="100" r="86" fill="none" stroke="#c8a24a" stroke-width="1.8"/>`,
            K.liquid(p, { R: 72, c: '#c27a2e', op: .9 }),
            `<circle cx="96" cy="94" r="46" fill="#e6a85a" opacity=".25"/>`,
            sp.map(([x, y, r], i) => zsOnionStrip(p, x, y, 26 + (i % 3) * 3, r)).join(''),
            `<g ${p.sh(.5)}>`,
            K.bacon(p, 98, 86, 20, 7, -30), K.bacon(p, 122, 118, 18, 7, 40), K.bacon(p, 76, 112, 18, 7, 75), K.bacon(p, 124, 80, 16, 6.5, 10), K.bacon(p, 96, 134, 16, 6.5, -10),
            `</g>`,
            zsOil(p, 100, 100, 124, { n: 12, c: '#f0c060', op: .5, rmax: 1.6 }),
            zsShine(100, 100, 72, .45),
            zsParsley(p, 104, 102, 40, { n: 18 }),
        ].join('');
    },

    // 韓国風わかめスープ: 真鍮の器、澄んだ茶色のスープにたっぷりのわかめ・牛肉・ねぎ・白ごま、ごま油
    wakamesoup: p => [
        K.bowl(p, { glaze: '#c39a48', inside: '#e3c47e' }),
        K.liquid(p, { R: 76, c: '#a8743a', op: .82 }),
        ...[[76, 82, 40, 20], [124, 74, 38, -30], [134, 118, 40, 60], [84, 126, 40, -20], [104, 100, 36, 100], [60, 106, 28, 70], [110, 144, 28, 0], [100, 60, 28, 160], [146, 92, 24, 120]].map(([x, y, s, r], i) => K.wakame(p, x, y, s, r, { seed: i + 1 })),
        `<g ${p.sh(.6)}>`,
        ...[[94, 86, 20], [122, 100, -40], [80, 114, 70], [112, 128, 10], [140, 108, 50], [112, 70, -20]].map(([x, y, r], i) => K.porkSlice(p, x, y, 24, r, { c: '#8e6a52', fat: '#a88a72', char: false, gloss: .25, seed: i + 1 })),
        `</g>`,
        zsNegiSlant(p, 102, 112, 12, 20, { green: true }), zsNegiSlant(p, 128, 86, 11, -40), zsNegiSlant(p, 84, 72, 11, 50, { green: true }), zsNegiSlant(p, 74, 134, 10, -10),
        zsOil(p, 100, 100, 132, { n: 12, c: '#f1c04e', op: .6, rmax: 2.2 }),
        K.sesame(p, 102, 100, 80, { n: 18 }),
        zsShine(100, 100, 76, .4),
    ].join(''),

    // スンドゥブチゲ: 黒い石鍋でぐつぐつ煮える赤いスープ、大きくすくった絹ごし豆腐・あさり・豚肉・キムチ、真ん中に卵黄、ねぎ
    sundubu: p => [
        K.stonePot(p),
        K.liquid(p, { R: 76, c: '#cf3a1e', op: 1, shine: false }),
        `<circle cx="100" cy="100" r="76" fill="none" stroke="#9e1e10" stroke-width="5" opacity=".5"/>`,
        zsOil(p, 100, 100, 140, { n: 16, c: '#ef6a2a', op: .7, rmax: 2.4, seed: 3 }),
        K.kimchi(p, 142, 92, 22, 40, { seed: 1 }), K.kimchi(p, 60, 112, 22, -30, { seed: 2 }), K.kimchi(p, 108, 148, 20, 10, { seed: 3 }),
        K.porkSlice(p, 130, 134, 30, -40, { c: '#c9906e', fat: '#f2dcc4', char: false, gloss: .3, seed: 4 }),
        K.porkSlice(p, 64, 72, 26, 60, { c: '#c9906e', fat: '#f2dcc4', char: false, gloss: .3, seed: 5 }),
        `<g ${p.sh(.8)}>`,
        zsTofuChunk(p, 80, 82, 38, 20, { seed: 1, tint: '#f08a6a' }), zsTofuChunk(p, 128, 70, 34, -20, { seed: 2, tint: '#f08a6a' }),
        zsTofuChunk(p, 76, 134, 34, 40, { seed: 3, tint: '#f08a6a' }), zsTofuChunk(p, 136, 112, 30, 70, { seed: 4, tint: '#f08a6a' }),
        `</g>`,
        zsClam(p, 104, 58, 34, 10, { seed: 1 }), zsClam(p, 54, 100, 32, -80, { seed: 2 }), zsClam(p, 106, 140, 32, 170, { seed: 3 }), zsClam(p, 152, 134, 26, 120, { seed: 4, open: false }),
        zsRawEgg(p, 102, 100, 36),
        K.scallions(p, 100, 100, 116, { n: 16, c: '#4f9a34' }),
        ...[[70, 58, 3], [148, 72, 2.4], [50, 136, 2.6], [154, 154, 2], [86, 158, 2.2], [162, 108, 2.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#ffb59a" stroke-width=".9" opacity=".8"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .3}" fill="#fff" opacity=".7"/>`),
    ].join(''),

    // けんちん汁: 内朱の木の椀、澄んだしょうゆ色のだしに大根・にんじん・ごぼう・里芋・こんにゃく・くずした豆腐、ねぎ
    kenchinjiru: p => {
        const sp = zsSpots('ken', 26, 58, 16);
        const items = sp.map(([x, y, r], i) => {
            const t = i % 7;
            return t === 0 ? zsTofuChunk(p, x, y, 22, r, { seed: i, c: '#f2ead6' })
                : t === 1 ? zsIcho(p, x, y, 21, r, { c: '#e9d6a8' })
                : t === 2 ? zsIcho(p, x, y, 18, r, { c: '#e8762a' })
                : t === 3 ? K.gobo(p, x, y, 17, r)
                : t === 4 ? K.satoimo(p, x, y, 22, r, { c: '#ebdfc6' })
                : t === 5 ? K.konnyaku(p, x, y, 16, r)
                : zsIcho(p, x, y, 20, r, { c: '#e9d6a8' });
        }).join('');
        return [
            K.wan(p, { outer: '#6b4226', inner: '#b0442a' }),
            K.liquid(p, { R: 76, c: '#a7642a', op: .82 }),
            `<g ${p.sh(.8)}>`, items, `</g>`,
            zsVeil(100, 100, 76, '#a7642a', .12),
            K.scallions(p, 100, 100, 80, { n: 14, c: '#5fa03a' }),
            zsOil(p, 100, 100, 130, { n: 10, c: '#efbf58', op: .5, rmax: 1.4 }),
            zsShine(100, 100, 76, .4),
        ].join('');
    },

    // なめこと豆腐の味噌汁: 黒漆の椀、赤だし色のにごった味噌汁につやつやのなめこ・さいの目豆腐・小口ねぎ
    namekomiso: p => {
        const R = rng(p.id + 'nm');
        let nm = '';
        for (let i = 0; i < 36; i++){
            const a = R() * 6.28, d = 10 + Math.sqrt(R()) * 54, cx = 100 + Math.cos(a) * d, cy = 100 + Math.sin(a) * d, rr = 3.8 + R() * 2.6;
            nm += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rr * 1.6)}" ry="${f(rr * 1.45)}" fill="#e8b06a" opacity=".16"/><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rr * 1.1)}" ry="${f(rr)}" fill="${p.rg('#b95f22', .3, .32, .35, .32)}" stroke="#7a3812" stroke-width=".5"/><ellipse cx="${f(cx - rr * .35)}" cy="${f(cy - rr * .38)}" rx="${f(rr * .38)}" ry="${f(rr * .22)}" fill="#fff" opacity=".8" transform="rotate(-30 ${f(cx - rr * .35)} ${f(cy - rr * .38)})"/>`;
        }
        return [
            K.wan(p, { outer: '#1e1816', inner: '#2a1512' }),
            `<circle cx="100" cy="100" r="88" fill="none" stroke="#b8902e" stroke-width="1.2" opacity=".7"/>`,
            K.liquid(p, { R: 76, c: '#8a4b26', op: 1 }),
            `<circle cx="100" cy="100" r="62" fill="#b07040" opacity=".25"/>`,
            K.tofu(p, 96, 92, 17, 17, 10), K.tofu(p, 122, 116, 17, 17, -15), K.tofu(p, 78, 122, 16, 16, 25), K.tofu(p, 120, 78, 16, 16, 30), K.tofu(p, 70, 88, 15, 15, -10), K.tofu(p, 102, 138, 15, 15, 5),
            `<g ${p.sh(.5)}>${nm}</g>`,
            K.scallions(p, 100, 100, 70, { n: 14, c: '#5fa63a' }),
            zsShine(100, 100, 76, .4),
        ].join('');
    },

    // あさりの味噌汁: 朱の椀、うすいにごりの味噌汁に殻の開いたあさりがたくさん、小口ねぎ
    asarimiso: p => [
        K.wan(p, { outer: '#a8331f', inner: '#7e2416' }),
        K.liquid(p, { R: 76, c: '#c79c5e', op: 1 }),
        `<circle cx="100" cy="100" r="64" fill="#e4c896" opacity=".3"/>`,
        zsClam(p, 70, 120, 36, 40, { seed: 5, open: false }), zsClam(p, 132, 66, 34, -150, { seed: 7, open: false }), zsClam(p, 122, 138, 34, -20, { seed: 8, open: false }),
        zsClam(p, 84, 70, 44, 20, { seed: 1 }), zsClam(p, 136, 108, 42, 70, { seed: 3 }),
        zsClam(p, 92, 134, 42, 170, { seed: 4 }), zsClam(p, 60, 90, 36, -60, { seed: 2 }), zsClam(p, 108, 98, 42, 120, { seed: 6 }),
        K.scallions(p, 100, 100, 100, { n: 16, c: '#5fa03a' }),
        zsShine(100, 100, 76, .35),
    ].join(''),

    // コーンスープ: 白いスープ皿、なめらかな淡い黄色のクリームスープにクルトンとパセリ、生クリームのひと筋
    cornsoup: p => [
        K.bowl(p, { glaze: '#f5efe2', inside: '#fbf8f1' }),
        `<circle cx="100" cy="100" r="80" fill="none" stroke="#2c4c7c" stroke-width="1.6" opacity=".8"/>`,
        K.liquid(p, { R: 73, c: '#f2d36e', op: 1 }),
        `<circle cx="96" cy="94" r="50" fill="#f8e6a2" opacity=".5"/>`,
        `<path d="M58,110 C66,80 104,74 124,88 C140,100 132,124 108,124 C92,124 88,110 100,104" stroke="#fffaf0" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".8"/>`,
        zsCrouton(p, 98, 90, 15, 15), zsCrouton(p, 118, 104, 14, -20), zsCrouton(p, 86, 112, 14, 35), zsCrouton(p, 112, 80, 13, 5), zsCrouton(p, 130, 88, 12, 40), zsCrouton(p, 100, 120, 13, -10), zsCrouton(p, 76, 94, 12, 25),
        zsParsley(p, 104, 100, 60, { n: 22 }),
        zsShine(100, 100, 73, .5),
    ].join(''),

    // クラムチャウダー: 藍の器、白いとろみのスープにあさりの身・殻・角切りのじゃがいも・にんじん・ベーコン、パセリ
    clamchowder: p => {
        const sp = zsSpots('chw', 28, 56, 15);
        const items = sp.map(([x, y, r], i) => {
            const t = i % 6;
            return t === 0 || t === 3 ? zsDice(p, x, y, 17, r, '#f2dc98')
                : t === 1 ? zsDice(p, x, y, 12, r, '#ef7d2e')
                : t === 2 ? `<path ${T(x, y, r)} d="M-7,0 C-7,-5.4 7,-5.4 7,0 C7,4.6 -7,4.6 -7,0Z" fill="${p.g('#eab889', .3, .25)}" stroke="#b47d4c" stroke-width=".5"/>`
                : t === 4 ? K.bacon(p, x, y, 13, 7, r)
                : zsDice(p, x, y, 10, r, '#f0e2b4', { op: .85 });
        }).join('');
        return [
            K.bowl(p, { glaze: '#5d7f9a', inside: '#f7f2e6' }),
            K.liquid(p, { R: 72, c: '#f1ead8', op: 1 }),
            `<circle cx="96" cy="94" r="52" fill="#fffdf6" opacity=".45"/>`,
            `<g ${p.sh(.6)}>`, items, `</g>`,
            `<circle cx="100" cy="100" r="66" fill="#f6f0e2" opacity=".18"/>`,
            zsClam(p, 134, 128, 32, 120, { seed: 1 }), zsClam(p, 68, 74, 30, -40, { seed: 2 }),
            zsShine(100, 100, 72, .5),
            zsParsley(p, 100, 100, 80, { n: 24 }),
            K.sprinkle(p, 100, 100, 90, { c: '#5a4a3a', n: 14, r: .45 }),
        ].join('');
    },

    // 酸辣湯: 白い中華碗（朱の線）、とろみのある濃い茶色のスープに細切りの豆腐・しいたけ・たけのこ、溶き卵、ラー油の赤い粒、ねぎ
    sanratan: p => {
        const R = rng(p.id + 'st');
        const tf = [], sh = [], bm = [];
        for (let i = 0; i < 36; i++){
            const a = R() * 6.28, d = Math.sqrt(R()) * 62, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d, r = R() * 180, t = R();
            if (t < .42) tf.push(zsStrip(p, x, y, 20 + R() * 6, 4.6, r, '#f7f1e2'));
            else if (t < .72) sh.push(zsStrip(p, x, y, 17 + R() * 5, 4, r, '#6e4528'));
            else bm.push(zsStrip(p, x, y, 16 + R() * 5, 4, r, '#ead79a'));
        }
        return [
            zsChinaBowl(p, '#b8321f'),
            K.liquid(p, { R: 76, c: '#7c4a22', op: 1 }),
            `<circle cx="100" cy="100" r="62" fill="#9a6232" opacity=".3"/>`,
            `<g ${p.sh(.4)}>${bm.join('')}${sh.join('')}${tf.join('')}</g>`,
            zsEgg(p, 94, 90, 42, 20, { seed: 1, c: '#f1cf5a', op: .9 }), zsEgg(p, 124, 122, 36, -30, { seed: 2, c: '#f1cf5a', op: .9 }), zsEgg(p, 72, 122, 32, 60, { seed: 3, c: '#f1cf5a', op: .9 }), zsEgg(p, 124, 74, 30, -10, { seed: 4, c: '#f1cf5a', op: .9 }),
            zsVeil(100, 100, 76, '#7c4a22', .12),
            zsOil(p, 100, 100, 144, { n: 22, c: '#e8461c', op: .85, rmax: 2.6, seed: 2 }),
            K.scallions(p, 100, 100, 50, { n: 12, c: '#5fa03a' }),
            K.sprinkle(p, 100, 100, 110, { c: '#2a1d14', n: 30, r: .55 }),
            zsShine(100, 100, 76, .4),
        ].join('');
    },

    // トマトと卵のスープ: 青磁の碗、澄んだ淡いトマト色のスープにくし切りトマトとふんわり卵、ねぎ、ごま油
    tomatoeggsoup: p => [
        K.kobachi(p, { glaze: '#9fbfae', inside: '#f3f5ee' }),
        K.liquid(p, { R: 74, c: '#e88d58', op: .9 }),
        `<g ${p.sh(.6)}>`,
        zsTomato(p, 80, 78, 32, 20, { seed: 1 }), zsTomato(p, 128, 88, 30, -40, { seed: 2 }), zsTomato(p, 104, 136, 32, 160, { seed: 3 }), zsTomato(p, 66, 120, 28, 80, { seed: 4 }), zsTomato(p, 138, 128, 26, 120, { seed: 5 }), zsTomato(p, 106, 62, 24, -10, { seed: 6 }),
        `</g>`,
        zsEgg(p, 102, 102, 62, -10, { seed: 1 }), zsEgg(p, 118, 74, 40, 20, { seed: 2 }), zsEgg(p, 80, 100, 38, 70, { seed: 3 }), zsEgg(p, 128, 114, 34, 40, { seed: 4 }), zsEgg(p, 86, 140, 30, -20, { seed: 5 }), zsEgg(p, 60, 90, 24, -60, { seed: 6 }),
        K.scallions(p, 100, 100, 76, { n: 16, c: '#5fa03a' }),
        zsOil(p, 100, 100, 130, { n: 10, c: '#f2c24c', op: .55, rmax: 1.6 }),
        zsShine(100, 100, 74, .45),
    ].join(''),
};
