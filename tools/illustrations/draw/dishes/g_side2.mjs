// 副菜（小鉢・和え物・炒め物・お漬物）その2
import * as K from '../kit.mjs';
const { smooth, ring, rng, lt, dk, mix, T, f } = K;

// ---------- この盛りつけファイル専用の部品（s2 で始まる） ----------
// 円の中にひまわりの種の並び（黄金角）で n 個の位置を作る。外側から先に描けば、中央が上に重なって山になる
function s2Spots(seed, n, R, { cx = 100, cy = 100, jit = .18, sy = 1, rot = 0 } = {}){
    const r = rng(seed);
    const out = [];
    for (let i = 0; i < n; i++){
        const d = R * Math.sqrt((i + .5) / n) * (1 + (r() - .5) * jit), a = i * 2.39996 + rot + (r() - .5) * jit;
        out.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * sy, r() * 360, r]);
    }
    return out.reverse();
}
// 和え物・サラダの山（ふちが不定形の面）
function s2Mound(p, x, y, s, c, { seed = 1, sy = .92, jit = .22, n = 12, l = .25, d = .28, rough = 0 } = {}){
    const R = rng(p.id + 'mnd' + seed);
    const path = `<path ${T(x, y)} d="${smooth(ring(s / 2, n, jit, R, 1, sy))}" fill="${p.rg(c, l, d, .38, .34)}"/>`;
    return `<g ${p.sh(1)}>${rough ? `<g ${p.rough(rough, .12)}>${path}</g>` : path}</g>`;
}
// 細い棒（千切り・拍子木・短冊）。edge を指定すると片側に皮の色の線
function s2Stick(p, x, y, L, w, r, c, { edge = null, bend = 0 } = {}){
    const h = w / 2;
    const d = `M${f(-L / 2)},${f(-h)} Q0,${f(-h + bend)} ${f(L / 2)},${f(-h)} L${f(L / 2)},${f(h)} Q0,${f(h + bend)} ${f(-L / 2)},${f(h)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .3)}" stroke-width=".5" stroke-linejoin="round"/>
        ${edge ? `<path d="M${f(-L / 2 + .6)},${f(-h + .7)} Q0,${f(-h + bend + .7)} ${f(L / 2 - .6)},${f(-h + .7)}" stroke="${edge}" stroke-width="${f(Math.max(1, w * .38))}" fill="none" stroke-linecap="round"/>` : ''}</g>`;
}
// オクラの輪切り（星形の断面・明るい果肉・白い種）
function s2Okra(p, x, y, s, r = 0){
    const pts = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.28 - 1.57, rr = i % 2 ? s * .37 : s / 2; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    const poly = q => 'M' + q.map(([a, b]) => `${f(a)},${f(b)}`).join('L') + 'Z';
    return `<g ${T(x, y, r)}><path d="${poly(pts)}" fill="${p.g('#4f9e34', .25, .3)}" stroke="#2c6620" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="${poly(pts.map(([a, b]) => [a * .66, b * .66]))}" fill="#cfe8a0" stroke="#cfe8a0" stroke-width="1.4" stroke-linejoin="round"/>
        ${[0, 1, 2, 3, 4].map(i => `<circle cx="${f(Math.cos(i * 1.257 - 1.57 + .63) * s * .21)}" cy="${f(Math.sin(i * 1.257 - 1.57 + .63) * s * .21)}" r="${f(s * .06)}" fill="#f6f9e6"/>`).join('')}
        <path d="M${f(-s * .3)},${f(-s * .18)} Q${f(-s * .18)},${f(-s * .34)} 0,${f(-s * .36)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// かつお節（大きめでくるりと反った薄片）
function s2Bonito(p, x, y, s, { n = 10, seed = 1 } = {}){
    const R = rng(p.id + 'bon2' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .7, k = .8 + R() * .5, c = R() < .5 ? '#e2bf98' : '#cfa078';
        out += `<g ${T(cx, cy, R() * 360, k)}><path d="M-7,-3 Q-3,-6 1,-4 Q5,-7 8,-3 Q7,1 8,4 Q3,2 -1,5 Q-4,2 -8,3 Q-6,0 -7,-3Z" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".5" opacity=".95"/><path d="M-5,-2 Q-1,-4 4,-3.6 M-4,1.5 Q0,0 5,1" stroke="#f6e4cc" stroke-width=".8" fill="none" stroke-linecap="round"/></g>`;
    }
    return `<g ${p.sh(.4)}>${out}</g>`;
}
// 大学芋（皮つきの乱切り・あめの照り）
function s2Imo(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'imo' + seed + x + y);
    const pts = Array.from({ length: 5 }, (_, i) => { const a = i / 5 * 6.28 + R() * .5, rr = s / 2 * (.75 + R() * .3); return [Math.cos(a) * rr * 1.15, Math.sin(a) * rr * .9]; });
    const inner = pts.map(([a, b]) => [a * .84 - s * .05, b * .82 - s * .05]);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .45)}" fill="${p.g('#7d2442', .25, .3)}" stroke="#4e1226" stroke-width=".7"/>
        <path d="${smooth(inner, true, .45)}" fill="${p.g('#eeaa30', .35, .3)}" stroke="#b9741c" stroke-width=".5"/>
        <path d="${smooth(inner.map(([a, b]) => [a * .55 - s * .04, b * .5 - s * .05]), true, .45)}" fill="#f8cf63" opacity=".55"/>
        <path d="M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .14)},${f(-s * .34)} ${f(s * .14)},${f(-s * .3)}" stroke="#fff" stroke-width="${f(s * .07)}" fill="none" stroke-linecap="round" opacity=".85"/>
        <circle cx="${f(s * .16)}" cy="${f(s * .06)}" r="${f(s * .04)}" fill="#fff" opacity=".8"/></g>`;
}
// 白菜のざく切り（白い軸と薄緑の葉）
function s2Napa(p, x, y, s, r = 0, { seed = 1 } = {}){
    const k = s / 30, R = rng(p.id + 'npa' + seed + x);
    const leaf = smooth([[-13, -2], [-12, -9], [-6, -13], [0, -11], [6, -14], [12, -9], [13, -2], [6, -4], [-6, -4]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]));
    return `<g ${T(x, y, r, k)}><path d="${leaf}" fill="${p.g('#bcd97a', .3, .25)}" stroke="#7fa64a" stroke-width=".7"/>
        <path d="M-8,-8 Q-4,-6 -2,-4 M3,-10 Q4,-7 3,-4 M9,-8 Q7,-6 6,-4" stroke="#e6f1c2" stroke-width=".9" fill="none"/>
        <path d="M-12,-4 Q0,-7 12,-4 L11,9 Q0,12 -11,9Z" fill="${p.g('#f6f4e8', .2, .18)}" stroke="#cfcab0" stroke-width=".7"/>
        <path d="M-7,-3 L-6.5,9 M-1,-4 L-1,10 M5,-4 L5,9.6" stroke="#e2dec6" stroke-width="1.1"/>
        <path d="M-9,-2.5 Q0,-5.4 9,-2.6" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// チンゲン菜（スプーン形の軸の先に濃い緑の葉）。s は長さ
function s2Bok(p, x, y, s, r = 0, { seed = 1, leaf = true } = {}){
    const k = s / 50, R = rng(p.id + 'bok' + seed + x);
    const lf = leaf ? `<path d="${smooth([[4, -8], [14, -14], [26, -12], [30, -2], [28, 9], [17, 13], [5, 7]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]))}" fill="${p.g('#3f8c2e', .25, .3)}" stroke="#25601c" stroke-width=".7"/>
        <path d="M2,0 Q15,-1 28,-1 M14,-1 L20,-8 M14,-1 L20,7 M22,-1 L26,-6 M22,-1 L26,5" stroke="#8cc566" stroke-width=".9" fill="none"/>` : '';
    return `<g ${T(x, y, r, k)}>${lf}
        <path d="M-24,0 Q-24,-9 -14,-9.5 Q-2,-8 8,-3.5 L8,3.5 Q-2,8 -14,9.5 Q-24,9 -24,0Z" fill="${p.g('#d7ecb2', .35, .22)}" stroke="#93be63" stroke-width=".7"/>
        <path d="M-20,-3 Q-8,-4 6,-1.5 M-20,3 Q-8,4 6,1.5" stroke="#b9db8c" stroke-width=".9" fill="none"/>
        <path d="M-20,-5.5 Q-12,-8 -2,-6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// にんにくの薄切り（炒めて縁が狐色）
function s2Garlic(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${f(-s / 2)},${f(s * .1)} Q${f(-s * .45)},${f(-s * .42)} 0,${f(-s * .42)} Q${f(s * .45)},${f(-s * .42)} ${f(s / 2)},${f(s * .1)} Q0,${f(s * .5)} ${f(-s / 2)},${f(s * .1)}Z" fill="${p.g('#f5e6b8', .3, .2)}" stroke="#c99a4a" stroke-width="${f(s * .08)}"/><path d="M0,${f(-s * .3)} L0,${f(s * .25)}" stroke="#e3cf98" stroke-width=".6"/></g>`;
}
// たこの薄切り（赤紫の皮と吸盤・白い身）
function s2Tako(p, x, y, s, r = 0, { seed = 1 } = {}){
    const k = s / 30, R = rng(p.id + 'tak' + seed + x);
    const body = smooth([[-14, 2], [-12, -6], [-4, -10], [6, -10], [13, -5], [15, 2], [9, 7], [-2, 8], [-10, 7]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]));
    return `<g ${T(x, y, r, k)}><path d="${body}" fill="${p.g('#f4e6e0', .25, .15)}" stroke="#c98d8a" stroke-width=".7"/>
        <path d="M-13,-1 Q-11,-8 -3,-10.5 Q7,-11 13,-5 Q15,-2 15,2 Q8,-3 0,-4 Q-8,-4 -13,-1Z" fill="${p.g('#a8303f', .25, .25)}" stroke="#6e1a26" stroke-width=".6"/>
        <circle cx="-6" cy="-6" r="1.9" fill="#e8b4b0" stroke="#8a2834" stroke-width=".5"/><circle cx="1" cy="-7.6" r="2" fill="#e8b4b0" stroke="#8a2834" stroke-width=".5"/><circle cx="8" cy="-5.2" r="1.7" fill="#e8b4b0" stroke="#8a2834" stroke-width=".5"/>
        <path d="M-9,3 Q0,0 10,2" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// きゅうりの薄切り（塩もみ・浅漬け。縁が濃い緑）
function s2Cuke(p, x, y, s, r = 0, { half = false } = {}){
    if (half) return `<g ${T(x, y, r)}><path d="M${f(-s / 2)},0 A${f(s / 2)},${f(s / 2)} 0 0 1 ${f(s / 2)},0Z" fill="#3c7a2b"/><path d="M${f(-s / 2 + 1.4)},0 A${f(s / 2 - 1.4)},${f(s / 2 - 1.4)} 0 0 1 ${f(s / 2 - 1.4)},0Z" fill="${p.g('#d4e9a6', .3, .12)}"/><path d="M${f(-s * .22)},0 A${f(s * .22)},${f(s * .22)} 0 0 1 ${f(s * .22)},0Z" fill="#bcd98c"/>${[-.12, .12].map(a => `<ellipse cx="${f(a * s)}" cy="${f(-s * .1)}" rx="1" ry=".6" fill="#f3f8e4"/>`).join('')}</g>`;
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2 * 1.15)}" ry="${f(s / 2)}" fill="#3c7a2b"/><ellipse rx="${f(s / 2 * 1.15 - 1.4)}" ry="${f(s / 2 - 1.4)}" fill="${p.rg('#d4e9a6', .25, .12)}"/><ellipse rx="${f(s * .24)}" ry="${f(s * .2)}" fill="#bad78a"/>${[0, 1, 2].map(i => `<ellipse cx="${f(Math.cos(i * 2.09 + .5) * s * .13)}" cy="${f(Math.sin(i * 2.09 + .5) * s * .11)}" rx="1.1" ry=".65" fill="#f3f8e4"/>`).join('')}</g>`;
}
// たくあんの半月切り（黄色・年輪の線）
function s2Takuan(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f(-s / 2)},${f(s * .12)} A${f(s / 2)},${f(s / 2)} 0 0 1 ${f(s / 2)},${f(s * .12)} L${f(s / 2)},${f(s * .2)} L${f(-s / 2)},${f(s * .2)}Z" fill="${p.g('#f2cd2c', .3, .25)}" stroke="#c99a10" stroke-width=".7"/></g>
        <path d="M${f(-s * .34)},${f(s * .12)} A${f(s * .34)},${f(s * .34)} 0 0 1 ${f(s * .34)},${f(s * .12)}" stroke="#f8e27a" stroke-width="1.1" fill="none"/>
        <path d="M${f(-s * .38)},${f(-s * .1)} Q${f(-s * .2)},${f(-s * .34)} ${f(s * .05)},${f(-s * .36)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 長いもの拍子木（白くみずみずしい）
function s2Baton(p, x, y, L, w, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="1.6" fill="${p.g('#fbf8ec', .2, .14)}" stroke="#d3c9ad" stroke-width=".6"/></g>
        <rect x="${f(-L / 2 + 1)}" y="${f(w / 2 - 2.2)}" width="${L - 2}" height="1.6" rx=".8" fill="#ece5cf"/>
        <path d="M${f(-L / 2 + 2.5)},${f(-w / 2 + 1.6)} L${f(L / 2 - 4)},${f(-w / 2 + 1.6)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></g>`;
}
// 赤唐辛子の輪切り
function s2Chili(p, x, y, s){ return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="none" stroke="#d6281a" stroke-width="${f(s * .32)}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(s * .12)}" fill="#f2c76a"/>`; }
// かぼちゃの皮（濃い緑のかけら、片側に黄色い身）
function s2Skin(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${f(-s / 2)},${f(-s * .2)} Q0,${f(-s * .45)} ${f(s / 2)},${f(-s * .15)} L${f(s * .35)},${f(s * .3)} Q0,${f(s * .4)} ${f(-s * .4)},${f(s * .25)}Z" fill="${p.g('#f2b73a', .3, .2)}" stroke="#c98a1c" stroke-width=".4"/><path d="M${f(-s / 2)},${f(-s * .2)} Q0,${f(-s * .45)} ${f(s / 2)},${f(-s * .15)} L${f(s * .42)},${f(s * .02)} Q0,${f(-s * .22)} ${f(-s * .44)},${f(s * .02)}Z" fill="#2c5a26"/></g>`;
}
// 里芋（六方むきの面がわずかに見える、醤油色の照り）
function s2Taro(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'tar' + seed);
    const pts = Array.from({ length: 7 }, (_, i) => { const a = i / 7 * 6.28, rr = s / 2 * (.9 + R() * .14); return [Math.cos(a) * rr * 1.08, Math.sin(a) * rr * .92]; });
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .6)}" fill="${p.rg('#d9ad6c', .35, .4, .38, .34)}" stroke="#8a5420" stroke-width=".8"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .55 - s * .06, b * .55 - s * .07]), true, .6)}" fill="#efd6a4" opacity=".55"/>
        <path d="M${f(pts[1][0] * .5)},${f(pts[1][1] * .5)} L${f(pts[1][0] * .95)},${f(pts[1][1] * .95)} M${f(pts[3][0] * .5)},${f(pts[3][1] * .5)} L${f(pts[3][0] * .95)},${f(pts[3][1] * .95)}" stroke="#b07a3a" stroke-width=".8" opacity=".5"/>
        <path d="M${f(-s * .3)},${f(-s * .05)} Q${f(-s * .22)},${f(-s * .3)} ${f(s * .05)},${f(-s * .33)}" stroke="#fff" stroke-width="${f(s * .07)}" fill="none" stroke-linecap="round" opacity=".85"/>
        <circle cx="${f(s * .14)}" cy="${f(-s * .26)}" r="${f(s * .035)}" fill="#fff" opacity=".8"/></g>`;
}
// ブロッコリーの小房（つぶつぶの房の集まり）
function s2Floret(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'flo' + seed + x), k = s / 30;
    let buds = '';
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.28 + R(), d = i ? 6 + R() * 3 : 0; buds += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d * .9 - 2)}" r="${f(5.4 + R() * 1.6)}" fill="${p.g(R() < .5 ? '#3c8c30' : '#2f7a28', .35, .3)}" stroke="#1d5418" stroke-width=".7"/>`; }
    let dots = '';
    for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 11; dots += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d - 2)}" r=".9" fill="${R() < .6 ? '#7cc05a' : '#215e1c'}"/>`; }
    return `<g ${T(x, y, r, k)}><path d="M-3,6 L-4,15 Q0,17 4,15 L3,6Z" fill="${p.g('#b4d886', .3, .2)}" stroke="#7aa24e" stroke-width=".6"/>
        <g ${p.rough(1.2, .35)}>${buds}</g>${dots}
        <path d="M-8,-8 Q-3,-13 3,-12" stroke="#d7f0b8" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 小さな不定形のかけら
// （ハム・油揚げ・にんじん・しいたけの細かい刻み）
function s2Bit(p, x, y, s, r, c, { seed = 1 } = {}){
    const R = rng(p.id + 'bit' + seed + x + y);
    return `<path ${T(x, y, r)} d="${smooth(ring(s / 2, 5, .45, R, 1.3, .8), true, .5)}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .3)}" stroke-width=".45"/>`;
}

const sesameB = (p, x, y, s, n, seed = 3) => K.sesame(p, x, y, s, { n, c: '#2b2420', seed });
const sesameW = (p, x, y, s, n, seed = 3) => K.sesame(p, x, y, s, { n, seed });

export default {
    // オクラのおかか和え: 萩焼の小鉢に星形のオクラの輪切りを山盛り、かつお節をのせ、醤油がしみる
    okraokaka: p => [
        K.kobachi(p, { glaze: '#cfae84', inside: '#f3ebdc' }),
        `<circle cx="100" cy="104" r="62" fill="#9b6a3a" opacity=".18"/>`,
        `<g ${p.sh(.8)}>`,
        ...s2Spots(p.id, 15, 55, { cy: 101 }).map(([x, y, r]) => s2Okra(p, x, y, 27, r)),
        ...s2Spots(p.id + 'top', 6, 26, { cy: 98, rot: .8 }).map(([x, y, r]) => s2Okra(p, x, y, 27, r)),
        `</g>`,
        s2Bonito(p, 98, 96, 80, { n: 14, seed: 1 }),
    ].join(''),

    // 春雨サラダ: ガラス風の小鉢に透明な春雨、きゅうり・ハム・にんじんの細切り、白ごま
    harusamesalad: p => [
        K.kobachi(p, { glaze: '#a9cdd8', inside: '#e4eef1' }),
        s2Mound(p, 100, 101, 130, '#e3e3da', { seed: 2, l: .25, d: .12, jit: .12 }),
        K.noodles(p, 100, 100, 124, { c: '#fbfaf5', outline: '#cfd2c8', w: 1.8, n: 18, seed: 3, sy: .92 }),
        `<g ${p.sh(.6)}>`,
        ...s2Spots(p.id + 'c', 9, 50).map(([x, y, r], i) => s2Stick(p, x, y, 30, 5, r, '#cfe59a', { edge: '#3b7a2a' })),
        ...s2Spots(p.id + 'h', 8, 46, { rot: 1 }).map(([x, y, r]) => s2Stick(p, x, y, 28, 5, r, '#f3a3a8')),
        ...s2Spots(p.id + 'n', 8, 48, { rot: 2.2 }).map(([x, y, r]) => s2Stick(p, x, y, 26, 3.8, r, '#f08a32')),
        `</g>`,
        sesameW(p, 100, 98, 80, 22),
    ].join(''),

    // マカロニサラダ: 白い鉢にマヨで和えたマカロニ、きゅうりの薄切り、ハム、黒こしょう
    macaronisalad: p => [
        K.bowl(p, { glaze: '#d9d2c2', inside: '#fbf9f3' }),
        s2Mound(p, 100, 101, 136, '#f3e6bf', { seed: 1 }),
        `<g ${p.sh(.6)}>`,
        ...s2Spots(p.id, 30, 58).map(([x, y, r]) => K.macaroni(p, x, y, 22, r, { c: '#f2d37e' })),
        ...s2Spots(p.id + 'h', 6, 46, { rot: .7 }).map(([x, y, r]) => s2Stick(p, x, y, 16, 6, r, '#f2a0a6')),
        ...s2Spots(p.id + 'k', 7, 50, { rot: 2.1 }).map(([x, y, r]) => s2Cuke(p, x, y, 14, r)),
        `</g>`,
        `<path d="M70,82 Q86,70 104,74" stroke="#fffdf2" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
        K.sprinkle(p, 100, 100, 110, { c: '#3a2e26', n: 22, r: .65 }),
    ].join(''),

    // かぼちゃサラダ: 黒釉の小鉢に、粗くつぶしたかぼちゃ（緑の皮が点々）をこんもり
    kabochasalad: p => [
        K.kobachi(p, { glaze: '#2f2a28', inside: '#efe8dc' }),
        s2Mound(p, 100, 101, 138, '#eeac2c', { seed: 3, rough: 5, l: .35, d: .3 }),
        ...s2Spots(p.id + 'l', 16, 54).map(([x, y, r, R]) => `<path ${T(x, y, r)} d="${smooth(ring(7 + R() * 6, 7, .45, R, 1.2, .9))}" fill="${p.g(R() < .5 ? '#f7c94e' : '#f3b638', .45, .25)}" opacity=".8"/>`),
        ...s2Spots(p.id + 'g', 10, 52, { rot: .5 }).map(([x, y, r, R]) => s2Skin(p, x, y, 11 + R() * 5, r)),
        `<path d="M66,84 Q80,66 102,68" stroke="#fff6d8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
        K.sprinkle(p, 100, 100, 100, { c: '#5a4030', n: 14, r: .6 }),
    ].join(''),

    // 里芋の煮っころがし: 藍の鉢に、照りのある醤油色の里芋をころころと
    satoimonikkorogashi: p => [
        K.bowl(p, { glaze: '#2c4c7c', inside: '#efe5d3' }),
        K.liquid(p, { R: 66, c: '#8a5223', op: .9 }),
        `<g ${p.sh(1.1)}>`,
        ...[[70, 76, 40, 20, 1], [116, 68, 38, -30, 2], [140, 104, 36, 60, 3], [64, 118, 38, -10, 4], [106, 136, 38, 30, 5], [100, 102, 42, 10, 6]].map(([x, y, s, r, seed]) => s2Taro(p, x, y, s, r, { seed })),
        `</g>`,
        K.shreds(p, 102, 98, 16, { c: '#f2c234', n: 5, w: 1.8, len: .9, seed: 4 }),
    ].join(''),

    // 大学芋: 赤茶の小鉢に、皮つきの乱切りさつまいも。あめの照りと黒ごま
    daigakuimo: p => [
        K.kobachi(p, { glaze: '#7a2e26', inside: '#f2e9da' }),
        `<circle cx="100" cy="102" r="58" fill="#d9902a" opacity=".25"/>`,
        `<g ${p.sh(1.1)}>`,
        ...[[66, 84, 40, 20, 1], [104, 64, 38, 100, 7], [136, 82, 40, -40, 2], [142, 120, 38, 70, 3], [68, 126, 40, 140, 4], [106, 140, 40, -100, 5], [102, 104, 46, 10, 6]].map(([x, y, s, r, seed]) => s2Imo(p, x, y, s, r, { seed })),
        `</g>`,
        sesameB(p, 100, 100, 100, 34),
    ].join(''),

    // 白菜の浅漬け: 青磁の小鉢に、白い軸と薄緑の葉のざく切り、昆布の細切り、赤唐辛子
    hakusaiasazuke: p => [
        K.kobachi(p, { glaze: '#9fbfae', inside: '#eef2ea' }),
        `<g ${p.sh(.9)}>`,
        ...[[70, 76, 48, -20, 1], [128, 74, 46, 25, 2], [140, 116, 44, 80, 3], [64, 118, 46, -70, 4], [104, 136, 46, 170, 5], [100, 104, 50, 5, 6]].map(([x, y, s, r, seed]) => s2Napa(p, x, y, s, r, { seed })),
        `</g>`,
        ...[[86, 90, 30, 30], [118, 118, 26, -40], [120, 84, 24, 70], [82, 124, 24, 10], [104, 100, 22, -70]].map(([x, y, L, r]) => s2Stick(p, x, y, L, 2.2, r, '#2f3a26', { bend: 2 })),
        s2Chili(p, 92, 112, 5), s2Chili(p, 124, 100, 5), s2Chili(p, 104, 80, 4.5), s2Chili(p, 76, 100, 4.5),
    ].join(''),

    // チンゲン菜のにんにく炒め: 飴釉の小鉢に、つやのある軸と葉、にんにくの薄切り
    chingensai: p => [
        K.kobachi(p, { glaze: '#7a5236', inside: '#f3ece0' }),
        `<circle cx="100" cy="102" r="58" fill="#d8c27a" opacity=".22"/>`,
        `<g ${p.sh(1)}>`,
        s2Bok(p, 80, 70, 74, 30, { seed: 1 }),
        s2Bok(p, 136, 82, 70, 110, { seed: 2 }),
        s2Bok(p, 64, 116, 70, -40, { seed: 3 }),
        s2Bok(p, 124, 134, 70, 200, { seed: 4 }),
        s2Bok(p, 92, 138, 64, -80, { seed: 6 }),
        s2Bok(p, 100, 100, 76, -10, { seed: 5 }),
        `</g>`,
        s2Garlic(p, 88, 92, 9, 20), s2Garlic(p, 116, 108, 9, -30), s2Garlic(p, 102, 124, 8, 60), s2Garlic(p, 120, 80, 8, 10), s2Garlic(p, 76, 108, 8, -60),
    ].join(''),

    // ブロッコリーのごまマヨ和え: 黄瀬戸の小鉢に、すりごま入りマヨをからめた小房
    broccoligoma: p => [
        K.kobachi(p, { glaze: '#c9a35e', inside: '#f3ead6' }),
        `<g ${p.sh(1)}>`,
        `</g>`,
        s2Mound(p, 100, 102, 116, '#d9bf86', { seed: 5, l: .3, d: .2, jit: .35, n: 10 }),
        `<g ${p.sh(1)}>`,
        ...[[70, 80, 44, -30, 1], [124, 70, 42, 25, 2], [142, 112, 40, 70, 3], [66, 124, 42, -80, 4], [108, 140, 40, 160, 5], [100, 102, 48, 0, 6]].map(([x, y, s, r, seed]) => s2Floret(p, x, y, s, r, { seed })),
        `</g>`,
        ...[[92, 92, 1], [74, 76, 2], [124, 64, 3], [140, 106, 4], [62, 118, 5], [106, 134, 6]].map(([x, y, seed]) => `<path ${T(x, y, seed * 50)} d="M-7,1 Q-2,-4 4,-2 Q8,0 5,3 Q0,5 -7,1Z" fill="#e3cd96" stroke="#bfa066" stroke-width=".5" opacity=".9"/>`),
        K.sprinkle(p, 100, 100, 110, { c: '#8a6a40', n: 30, r: .75 }),
        sesameW(p, 100, 100, 80, 12),
    ].join(''),

    // きのこのバター醤油炒め: 鉄色の小鉢に、エリンギの縦切り・しめじ・まいたけ、バター醤油の照りとパセリ
    kinokobutter: p => [
        K.kobachi(p, { glaze: '#4a5866', inside: '#ece7de' }),
        K.liquid(p, { R: 50, c: '#a8743a', op: .7, shine: false }),
        `<g ${p.sh(.9)}>`,
        K.maitake(p, 70, 116, 54, 200), K.maitake(p, 128, 70, 52, -40), K.maitake(p, 136, 124, 50, 60), K.maitake(p, 74, 76, 48, -150),
        K.shimeji(p, 56, 98, 46, 10, { n: 3, cap: '#6e4e32' }), K.shimeji(p, 100, 148, 46, -70, { n: 3, cap: '#6e4e32' }), K.shimeji(p, 148, 92, 44, 170, { n: 3, cap: '#6e4e32' }), K.shimeji(p, 98, 54, 44, 100, { n: 3, cap: '#6e4e32' }), K.shimeji(p, 140, 138, 40, -135, { n: 2, cap: '#6e4e32' }),
        K.eringi(p, 92, 96, 48, -20), K.eringi(p, 118, 100, 48, 30), K.eringi(p, 90, 124, 44, 100), K.eringi(p, 112, 78, 40, 60), K.eringi(p, 120, 122, 40, -60),
        `</g>`,
        `<ellipse cx="104" cy="106" rx="9" ry="6" fill="#f7dc80" opacity=".9"/><ellipse cx="102" cy="104" rx="4" ry="2" fill="#fff6d0" opacity=".9"/>`,
        K.sprinkle(p, 104, 100, 90, { c: '#3d8a2c', n: 28, r: 1.2 }),
    ].join(''),

    // 長いもの梅和え: 瑠璃の小鉢に白い拍子木を井桁に積み、たたいた梅と大葉のせん切り
    nagaimoume: p => [
        K.kobachi(p, { glaze: '#2f5f8a', inside: '#e3e9ee' }),
        `<g ${p.sh(.9)}>`,
        ...[-42, -28, -14, 0, 14, 28, 42].map((dx, i) => s2Baton(p, 100 + dx, 100 + (i % 2 ? 4 : -3), 116 - Math.abs(dx) * .9, 13, 90)),
        ...[-34, -20, -6, 8, 22, 36].map((dy, i) => s2Baton(p, 100 + (i % 2 ? 3 : -4), 100 + dy, 112 - Math.abs(dy) * 1, 13, 0)),
        `</g>`,
        `<g ${p.sh(.6)}><g ${p.rough(2.4, .15)}><path d="${smooth(ring(19, 9, .3, rng('ume2'), 1.15, .9).map(([a, b]) => [a + 98, b + 96]))}" fill="${p.g('#c8323e', .3, .3)}" stroke="#86202a" stroke-width=".7"/></g></g>`,
        `<path d="M85,90 Q92,84 100,86" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>`,
        K.shreds(p, 112, 114, 34, { c: '#3e8a34', n: 12, w: 2.2, len: .9, seed: 5 }),
    ].join(''),

    // ほうれん草とベーコンのソテー: 白い小鉢に、バターでつやの出たほうれん草とベーコン
    spinachbacon: p => [
        K.kobachi(p, { glaze: '#e4ddcf', inside: '#faf8f2' }),
        `<circle cx="100" cy="102" r="60" fill="#c9b46a" opacity=".2"/>`,
        ...[[76, 82], [124, 80], [130, 122], [74, 122], [102, 140], [100, 62], [100, 102]].map(([x, y], i) => K.greens(p, x, y, 64, { c: i % 2 ? '#24601e' : '#2c6c24', n: 11, seed: i + 1, stems: '#7fae52', sy: .95 })),


        `<g ${p.sh(.7)}>`,
        ...[[78, 82, -20], [122, 80, 30], [132, 116, -60], [74, 120, 70], [104, 134, 10], [100, 100, 40], [112, 64, -10]].map(([x, y, r]) => K.bacon(p, x, y, 20, 10, r)),
        `</g>`,
        K.sprinkle(p, 100, 100, 100, { c: '#2b2420', n: 16, r: .6 }),
    ].join(''),

    // ごぼうサラダ: 藍の小鉢に、マヨで和えたごぼうとにんじんの細切り、すりごま
    gobosalad: p => [
        K.kobachi(p, { glaze: '#33507e', inside: '#eef0f0' }),
        s2Mound(p, 100, 101, 128, '#efe2bf', { seed: 4, jit: .12, n: 14 }),
        `<g ${p.sh(.5)}>`,
        ...s2Spots(p.id + 'g', 44, 52).map(([x, y, r]) => s2Stick(p, x, y, 30, 2.8, r, '#a98058', { bend: 1.5 })),
        ...s2Spots(p.id + 'c', 18, 50, { rot: 1.3 }).map(([x, y, r]) => s2Stick(p, x, y, 28, 2.8, r, '#ef8434', { bend: -1.2 })),
        `</g>`,
        ...s2Spots(p.id + 'm', 10, 46, { rot: .4 }).map(([x, y, r]) => `<path ${T(x, y, r)} d="M-12,2 Q0,-4 12,1" stroke="#fbf4dc" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".75"/>`),
        K.sprinkle(p, 100, 100, 100, { c: '#9a7a50', n: 30, r: .7 }),
        sesameW(p, 100, 98, 70, 12),
    ].join(''),

    // 卯の花: 織部の小鉢に、ほろほろのおから。にんじん・しいたけ・油揚げ・青ねぎが点々
    unohana: p => [
        K.kobachi(p, { glaze: '#4f7a4a', inside: '#efe9dc' }),
        `<g ${p.sh(1)}><g ${p.rough(4, .1)}><path d="${smooth(ring(66, 14, .14, rng('unohana-m'), 1, .94).map(([a, b]) => [a + 100, b + 101]))}" fill="${p.rg('#e6d3a8', .25, .2, .38, .34)}"/></g></g>`,
        `<g ${p.crumb(.9)}><path d="${smooth(ring(60, 14, .14, rng('unohana-m2'), 1, .94).map(([a, b]) => [a + 100, b + 101]))}" fill="#ead9b0" opacity=".9"/></g>`,
        ...s2Spots(p.id + 'c', 14, 52).map(([x, y, r]) => s2Bit(p, x, y, 6, r, '#ee7f2e')),
        ...s2Spots(p.id + 's', 9, 50, { rot: 1.1 }).map(([x, y, r]) => s2Bit(p, x, y, 7, r, '#6e4428')),
        ...s2Spots(p.id + 'a', 9, 50, { rot: 2.3 }).map(([x, y, r]) => s2Stick(p, x, y, 11, 4, r, '#d9a04a')),
        K.scallions(p, 100, 100, 70, { n: 14, c: '#4f9a34' }),
        `<path d="M66,82 Q80,66 102,66" stroke="#fffaf0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
    ].join(''),

    // たこときゅうりの酢の物: 鼠志野の小鉢に、甘酢、きゅうりの薄切り・わかめ・ゆでだこ
    takosunomono: p => [
        K.kobachi(p, { glaze: '#5f7f9f', inside: '#eef0ee' }),
        K.liquid(p, { R: 62, c: '#efe6c4', op: .7 }),
        K.wakame(p, 74, 112, 40, 20, { seed: 1 }), K.wakame(p, 126, 80, 38, -30, { seed: 2 }), K.wakame(p, 120, 128, 34, 60, { seed: 3 }), K.wakame(p, 80, 80, 30, 120, { seed: 4 }),
        ...s2Spots(p.id + 'k', 20, 54).map(([x, y, r]) => s2Cuke(p, x, y, 18, r)),
        `<g ${p.sh(.8)}>`,
        s2Tako(p, 76, 90, 42, -20, { seed: 1 }), s2Tako(p, 124, 96, 42, 30, { seed: 2 }), s2Tako(p, 98, 128, 40, 170, { seed: 3 }), s2Tako(p, 106, 70, 38, 190, { seed: 4 }), s2Tako(p, 100, 100, 40, 80, { seed: 5 }),
        `</g>`,
        K.gingerShreds(p, 100, 100, 18),
    ].join(''),

    // お漬物: 角皿に、たくあんの半月切り・きゅうりの浅漬け・少しのしば漬け
    konomono: p => [
        K.squareDish(p, { s: 156 }),
        ...[[52, 76], [72, 72], [92, 68], [112, 64], [132, 60]].map(([x, y], i) => s2Takuan(p, x, y, 46, -12)),
        `<g ${p.sh(.6)}>`,
        ...[[54, 126], [70, 130], [86, 134], [62, 112], [78, 116]].map(([x, y]) => s2Cuke(p, x, y, 26, -10)),
        `</g>`,
        `<g ${p.sh(.7)}>${[...s2Spots(p.id + 'sb', 16, 24, { cx: 132, cy: 124 })].map(([x, y, r, R]) => R() < .65 ? s2Bit(p, x, y, 13, r, R() < .5 ? '#8a2e5c' : '#a33a6a') : s2Stick(p, x, y, 14, 4, r, R() < .5 ? '#7b3a6e' : '#5e7a3a')).join('')}</g>`,
        K.sesame(p, 70, 122, 30, { n: 6, seed: 4 }),

    ].join(''),
};
