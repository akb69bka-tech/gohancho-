// 江口 ひなた（イラスト部リーダー）: 汁もの37品・主菜の煮22品・副菜の煮14品（基準書 docs/illustration_3q.md）
// 斜め上35度。汁は口より下の面、照り（煮汁・たれ）は飴色の縁と白い弧と点、奥は淡く手前は濃く（depthVeil）。
// 材料は index.html の R(...) 行の ings と seas にあるものだけ。黒は使わない（いちばん暗い色も焦げ茶）。
import * as Q from '../kit3q.mjs';
import * as K from '../kit.mjs';
const { f, T, rng, smooth, ring, lt, dk, mix, SY, CZ, SHADE, at, byDepth } = Q;

// =========================================================
// 江口の部品（2人以上が使うものは kit3q.mjs に入れてもらう。入ったら切り替える）
// =========================================================
// kit3q の江口の部品（glossLump・thick・slice3q・tarePool・shine）をそのまま使う
const { thick, shine, slice3q, tarePool } = Q;
// kit3q の glossLump の色ちがい（染みる煮汁の色 soak と強さ k、つぶれ sy、照り hi を変えられる。里芋・鶏肉など）
function soakLump(p, x, y, s, seed, { c = '#ecc77c', soak = '#b9853f', k = .45, sy = .82, hi = .7 } = {}){
    const R = rng(p.id + 'gl' + seed);
    const d = smooth(ring(s / 2, 7, .28, R, 1.08, sy, R()), true, .6);
    return Q.cast(p, x, y + s * .3, s * .5, s * .16, .35) + `<g ${T(x, y)}>
        <path d="${d}" fill="${Q.rg(p, [[0, lt(c, .4)], [.55, c], [.85, mix(c, soak, k)], [1, dk(c, .35)]], .36, .3, .72)}" stroke="${dk(c, .32)}" stroke-width=".8"/>
        <path d="M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .18)},${f(-s * .34)} ${f(s * .08)},${f(-s * .34)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${hi}"/>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .2)}" rx="${f(s * .06)}" ry="${f(s * .035)}" fill="#fff" opacity="${f(hi + .15)}"/></g>`;
}
// ---------- 置き場所 ----------
// 面の上に重ならないよう散らす（面の座標 u, v。半径 R の円の中）
function spots(seed, n, R, minD){
    const r = rng('sp' + seed), out = [];
    let d = minD, tries = 0;
    while (out.length < n && tries < 8000){
        tries++;
        const a = r() * 6.283, rr = Math.sqrt(r()) * R, u = Math.cos(a) * rr, v = Math.sin(a) * rr;
        if (out.every(([pu, pv]) => Math.hypot(pu - u, pv - v) >= d)) out.push([u, v, r() * 360]);
        if (tries % 400 === 0) d *= .9;
    }
    return out;
}
// 面の座標の多角形を、中心が (0,0) になるようにずらす
const centered = pts => { const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length, cy = pts.reduce((a, q) => a + q[1], 0) / pts.length; return pts.map(([u, v]) => [u - cx, v - cy]); };
const arcPts = (r, a0, a1, n = 8, withCenter = true) => { const pts = Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [Math.cos(a) * r, Math.sin(a) * r]; }); return centered(withCenter ? [[0, 0], ...pts] : pts); };

// =========================================================
// 具（汁・煮物）
// =========================================================
const tofu = (p, x, y, s, a, liq, c = '#f6f1e2') => Q.cube(p, x, y, s, a, c, liq ? { sink: s * .3, liquid: liq } : {});
// いちょう切り・半月切り（大根・にんじん）
const icho = (p, x, y, s, rot, c, liq, h = 2.6) => Q.prism(p, x, y, arcPts(s, 0, 90, 6), h, c, { rot, sink: liq ? 1 : 0, liquid: liq, top: Q.lit(p, c, .35, .12) });
const hangetsu = (p, x, y, s, rot, c, liq, { h = 2.6, top = null } = {}) => Q.prism(p, x, y, arcPts(s, 0, 180, 9), h, c, { rot, sink: liq ? 1 : 0, liquid: liq, top: top || Q.lit(p, c, .35, .12) });
// 短冊・角切り
const rect = (w, d) => [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
const tanzaku = (p, x, y, w, d, rot, c, liq, h = 2.4, top = null) => Q.prism(p, x, y, rect(w, d), h, c, { rot, sink: liq ? 1 : 0, liquid: liq, top: top || Q.lit(p, c, .3, .1) });
// 油揚げ（きつね色の短冊。表面に細かな気泡）
function age(p, x, y, w, d, rot, liq, seed = 1){
    const R = rng(p.id + 'age' + seed);
    let dots = '';
    for (let i = 0; i < 5; i++){ const u = (R() - .5) * w * .7, v = (R() - .5) * d * .5; const a = rot * Math.PI / 180; dots += `<circle cx="${f(x + u * Math.cos(a) - v * Math.sin(a))}" cy="${f(y + (u * Math.sin(a) + v * Math.cos(a)) * SY - 2.4 * CZ)}" r=".7" fill="#b07a2a" opacity=".6"/>`; }
    return tanzaku(p, x, y, w, d, rot, '#d9a54a', liq, 2.6, Q.lit(p, '#e6b45a', .3, .15)) + dots;
}
// こんにゃく（灰色の三角・短冊に、焦げ茶の粒）
function konnyaku(p, x, y, s, rot, liq, seed = 1){
    const R = rng(p.id + 'kon' + seed);
    const pts = centered([[0, 0], [s, s * .1], [s * .4, s * .85]]);
    let dots = '';
    for (let i = 0; i < 4; i++) dots += `<circle cx="${f(x + (R() - .5) * s * .5)}" cy="${f(y + (R() - .5) * s * .3 - 3 * CZ)}" r=".6" fill="#5e544c"/>`;
    return Q.prism(p, x, y, pts, 3, '#8f8a84', { rot, sink: liq ? 1 : 0, liquid: liq }) + dots;
}
// ささがきごぼう（細いそぎ切り）
function sasagaki(p, x, y, s, rot, seed = 1){
    const R = rng(p.id + 'ssg' + seed);
    let o = '';
    for (let i = 0; i < 3; i++){ const r = rot + (R() - .5) * 60, dx = (R() - .5) * 6, dy = (R() - .5) * 4; o += `<g ${T(x + dx, y + dy, r)}><path d="M${f(-s / 2)},0 Q0,-1.6 ${f(s / 2)},.4 Q0,1.6 ${f(-s / 2)},0Z" fill="#a8825a" stroke="#6e4e30" stroke-width=".5"/><path d="M${f(-s * .3)},-.4 L${f(s * .25)},-.5" stroke="#d8bc94" stroke-width=".6"/></g>`; }
    return o;
}
// 薄切りの豚バラ（汁の中: 淡い肉色に白い脂の筋）
function porkBara(p, x, y, s, rot, seed, { c = '#d4a888', fat = '#f6eadc' } = {}){
    rot = rot % 50 - 25;
    const sl = Q.slab(p, x, y, s / 2, s * .2, 1.6, c, 'pb' + seed, { n: 12, jit: .3, rot });
    const a = rot * Math.PI / 180, L = s * .36;
    return sl.s + `<path d="M${f(x - L * Math.cos(a))},${f(y - L * Math.sin(a) * SY - 1)} Q${f(x)},${f(y - 3)} ${f(x + L * Math.cos(a))},${f(y + L * Math.sin(a) * SY - .4)}" stroke="${fat}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 里芋（白く、ぬめりの照り）
const satoimo = (p, x, y, s, seed, soak = null) => soakLump(p, x, y, s, 'si' + seed, { c: '#efe6d2', soak: soak || '#c8b8a0', k: soak ? .5 : .35 });
// しいたけ（かさを上に。飾り切りの十字）
function shiitake(p, x, y, s, seed, { cross = true, sliced = false } = {}){
    if (sliced) return `<g ${T(x, y, (seed * 47) % 180)}><g transform="scale(1 ${SY * 1.3})"><path d="M${f(-s / 2)},0 Q0,${f(-s * .5)} ${f(s / 2)},0 L${f(s / 2)},${f(s * .1)} Q0,${f(-s * .3)} ${f(-s / 2)},${f(s * .1)}Z" fill="${Q.lit(p, '#8a5a34')}" stroke="#5a3a20" stroke-width=".6"/><path d="M${f(-s * .4)},${f(s * .06)} Q0,${f(-s * .26)} ${f(s * .4)},${f(s * .06)}" stroke="#e8d8bc" stroke-width="1.4" fill="none"/></g></g>`;
    const rx = s / 2, ry = s * .36;
    return Q.cast(p, x, y + ry * .6, rx, ry * .5, .3) + `<ellipse cx="${f(x)}" cy="${f(y + 1.6)}" rx="${f(rx)}" ry="${f(ry)}" fill="#e8d6b8"/>
        <ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${Q.dome(p, '#8a5530', .3, .3)}" stroke="#5a3418" stroke-width=".6"/>
        ${cross ? `<path d="M${f(x - rx * .5)},${f(y - ry * .3)} L${f(x + rx * .5)},${f(y + ry * .3)} M${f(x + rx * .5)},${f(y - ry * .3)} L${f(x - rx * .5)},${f(y + ry * .3)}" stroke="#f0e2c8" stroke-width="${f(s * .1)}" stroke-linecap="round"/>` : ''}
        <path d="M${f(x - rx * .7)},${f(y - ry * .1)} Q${f(x - rx * .5)},${f(y - ry * .8)} ${f(x)},${f(y - ry * .85)}" stroke="#fff" stroke-width="1" fill="none" opacity=".5"/>`;
}
// なめこ（小さなつやの粒の群れと、ぬめり）
function nameko(p, x, y, s, seed){
    const R = rng(p.id + 'nm' + seed);
    let o = '';
    const pts = Array.from({ length: 6 }, () => [x + (R() - .5) * s, y + (R() - .5) * s * SY, 2.4 + R() * 1.4]).sort((a, b) => a[1] - b[1]);
    for (const [cx, cy, r] of pts) o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${Q.dome(p, '#c27a30', .3, .4)}" stroke="#7a4214" stroke-width=".5"/><circle cx="${f(cx - r * .35)}" cy="${f(cy - r * .4)}" r="${f(r * .3)}" fill="#fff" opacity=".9"/>`;
    return `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(s * .65)}" ry="${f(s * .65 * SY)}" fill="#d89a50" opacity=".35"/>` + o;
}
// 二枚貝（あさり・しじみ）: ひらいた殻を面に寝かせ、片方に身。殻の外側の縞が見える縁を太く
const ASARI = { shell: '#c8b8a0', band: '#6e5e4c', inner: '#f4ede4', meat: '#eaa878' };
const SHIJIMI = { shell: '#6e6048', band: '#3e3426', inner: '#d4c8cc', meat: '#dca070' };
function clam(p, x, y, s, rot, o = {}){
    const { band, inner, meat, seed = 1 } = { ...ASARI, ...o };
    const valve = `M0,0 C${f(-s * .58)},${f(-s * .1)} ${f(-s * .64)},${f(-s * .8)} 0,${f(-s * .84)} C${f(s * .64)},${f(-s * .8)} ${f(s * .58)},${f(-s * .1)} 0,0Z`;
    const one = (a, withMeat) => `<g transform="rotate(${a})"><path d="${valve}" fill="${band}" stroke="${dk(band, .3)}" stroke-width=".6"/>
        <path d="${valve}" transform="translate(0 ${f(-s * .1)}) scale(.7)" fill="${Q.lg(p, [[0, '#fff'], [1, inner]], 0, 0, 1, 1)}"/>
        ${withMeat ? `<ellipse cx="0" cy="${f(-s * .42)}" rx="${f(s * .3)}" ry="${f(s * .24)}" fill="${Q.dome(p, meat, .35, .3)}" stroke="${dk(meat, .35)}" stroke-width=".5"/><ellipse cx="${f(-s * .1)}" cy="${f(-s * .5)}" rx="${f(s * .08)}" ry="${f(s * .04)}" fill="#fff" opacity=".8"/>` : ''}</g>`;
    const flip = rng(p.id + 'cl' + seed)() < .5;
    return Q.cast(p, x, y + 2, s * .75, s * .22, .32) + `<g transform="translate(${f(x)} ${f(y + s * .22)}) scale(1 ${f(SY * 1.3)}) rotate(${f(rot % 60 - 30)})">${one(-64, flip)}${one(64, !flip)}</g>`;
}
// 閉じた殻（外側の縞と模様）
function shut(p, x, y, s, rot, seed, o = {}){
    const { shell, band } = { ...ASARI, ...o };
    const d = `M0,${f(s * .36)} C${f(-s * .6)},${f(s * .34)} ${f(-s * .56)},${f(-s * .2)} ${f(-s * .1)},${f(-s * .38)} Q0,${f(-s * .44)} ${f(s * .1)},${f(-s * .38)} C${f(s * .56)},${f(-s * .2)} ${f(s * .6)},${f(s * .34)} 0,${f(s * .36)}Z`;
    const R = rng(p.id + 'sh' + seed);
    let pat = '';
    for (let i = 1; i <= 3; i++) pat += `<path d="M${f(-s * .5 * i / 3.4)},${f(s * .3 - s * .5 * i / 3.4)} Q0,${f(-s * .38 * i / 3)} ${f(s * .5 * i / 3.4)},${f(s * .3 - s * .5 * i / 3.4)}" stroke="${band}" stroke-width=".9" fill="none" opacity=".8" transform="translate(0 ${f(s * .5 * (1 - i / 3) * .4)})"/>`;
    for (let i = 0; i < 7; i++) pat += `<path d="M${f((R() - .5) * s * .5)},${f((R() - .3) * s * .3)} l${f(s * .08)},${f(-s * .1)} l${f(s * .08)},${f(s * .1)}" stroke="${dk(band, .2)}" stroke-width=".8" fill="none" opacity=".7"/>`;
    return Q.cast(p, x, y + 2, s * .55, s * .2, .32) + `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot % 50 - 25)}) scale(1 .78)"><path d="${d}" fill="${Q.dome(p, shell, .3, .35)}" stroke="${dk(band, .3)}" stroke-width=".7"/>${pat}<path d="M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .2)},${f(-s * .28)} 0,${f(-s * .3)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// なす（半月。上は淡い身、側面は紫の皮）
const nasu = (p, x, y, s, rot, liq) => hangetsu(p, x, y, s, rot, '#5a2c62', liq, { h: 3, top: Q.lit(p, '#d8c890', .25, .1) });
// じゃがいもの角切り（煮えた淡い黄色）
const potatoChunk = (p, x, y, s, rot, seed, liq) => { const R = rng('pc' + seed); return Q.prism(p, x, y, Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 6.283, r = s / 2 * (.8 + R() * .3); return [Math.cos(a) * r, Math.sin(a) * r * .85]; }), s * .45, '#efd59a', { rot, sink: liq ? 2 : 0, liquid: liq, top: Q.dome(p, '#f4e0aa', .3, .15) }); };
// 玉ねぎ（くし切り・薄切りの、半透明の弧）
function onionArc(p, x, y, L, rot, c = '#eee0b4'){
    return `<g ${T(x, y, rot)}><path d="M${f(-L / 2)},2 Q0,-4 ${f(L / 2)},2" stroke="${dk(c, .25)}" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".7"/><path d="M${f(-L / 2)},2 Q0,-4 ${f(L / 2)},2" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${f(-L * .3)},.2 Q0,-2.2 ${f(L * .2)},-.6" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// キャベツの葉のざく切り
const cabbage = (p, x, y, w, rot, seed) => Q.leaf(p, x, y, w, rot, '#cfe2a0', 'cb' + seed, { wave: 2.4 });
// 三つ葉（3枚の小さな葉と細い茎）
function mitsuba(p, x, y, s, rot){
    const lf = a => `<path d="M0,0 Q${f(-s * .22)},${f(-s * .3)} 0,${f(-s * .5)} Q${f(s * .22)},${f(-s * .3)} 0,0Z" transform="rotate(${a})" fill="${Q.lit(p, '#5aa83a', .3, .2)}" stroke="#2f6a1e" stroke-width=".5"/>`;
    return `<g ${T(x, y, rot)}><path d="M0,0 L${f(s * .9)},${f(s * .25)}" stroke="#a8d07a" stroke-width="1.6" stroke-linecap="round"/><g transform="scale(1 ${f(SY * 1.4)})">${lf(-55)}${lf(0)}${lf(55)}</g></g>`;
}
// 溶き卵（汁にふわりと広がる黄色）
function eggRibbon(p, x, y, s, seed){
    const R = rng(p.id + 'eg' + seed);
    const d = smooth(ring(s / 2, 11, .55, R, 1.3, SY * .9), true, 1);
    return `<path d="${d}" transform="translate(${f(x)} ${f(y + 1)})" fill="#e8b830" opacity=".45"/><path d="${d}" transform="translate(${f(x)} ${f(y)})" fill="${Q.lit(p, '#f8d860', .35, .1)}" stroke="#e0b030" stroke-width=".6"/>
        <path d="M${f(x - s * .3)},${f(y - 1)} Q${f(x - s * .1)},${f(y - s * .2)} ${f(x + s * .2)},${f(y - s * .12)}" stroke="#fffbe0" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="${smooth(ring(s / 5, 7, .5, R, 1.3, SY))}" transform="translate(${f(x + s * .15)} ${f(y + 1)})" fill="#fbf6e6" opacity=".9"/>`;
}
// 鮭の切り身（ひと口大。白い筋、銀の皮）
function salmon(p, x, y, s, rot, seed, liq){
    const pts = [[-s / 2, -s * .32], [s / 2, -s * .26], [s * .46, s * .32], [-s * .5, s * .28]];
    return Q.prism(p, x, y, pts, s * .4, '#e88a5a', { rot, sink: liq ? 2 : 0, liquid: liq, top: Q.lit(p, '#f4a070', .3, .1) }) +
        `<g ${T(x, y - s * .4 * CZ, rot * .5)}><path d="M${f(-s * .3)},-2 Q0,0 ${f(s * .3)},-2.6 M${f(-s * .32)},1.6 Q0,3 ${f(s * .3)},1.2" stroke="#fbe6d6" stroke-width="1" fill="none" opacity=".9"/></g>`;
}
// 鶏肉（煮えたひと口大）
const chickenBit = (p, x, y, s, seed, c = '#e6c39a') => soakLump(p, x, y, s, 'ck' + seed, { c, soak: dk(c, .2), k: .3, sy: .7, hi: .5 });
// さつまいもの輪切り（紫の皮と黄色の身）
const satsumaimo = (p, x, y, s, rot, liq) => cyl(p, x, y, s / 2, 4, '#7a2e4a', liq, { top: Q.dome(p, '#f6d070', .3, .1) });
// 円柱（大根・にんじんの輪切り、餅など）: 半径 r、厚み h
function cyl(p, x, y, r, h, c, liq, { top = null, rimC = null } = {}){
    const ry = r * SY, H = h * CZ;
    return (liq ? '' : Q.cast(p, x, y + ry * .5, r * 1.05, ry * .7, .3)) +
        `<path d="M${f(x - r)},${f(y - H)} L${f(x - r)},${f(y)} A${f(r)},${f(ry)} 0 0 0 ${f(x + r)},${f(y)} L${f(x + r)},${f(y - H)}Z" fill="${Q.lg(p, [[0, lt(c, .1)], [.5, c], [1, dk(c, .3)]])}" stroke="${dk(c, .4)}" stroke-width=".5"/>` +
        (liq ? `<path d="M${f(x - r)},${f(y - H * .4)} A${f(r)},${f(ry)} 0 0 0 ${f(x + r)},${f(y - H * .4)} L${f(x + r)},${f(y + .5)} A${f(r)},${f(ry)} 0 0 1 ${f(x - r)},${f(y + .5)}Z" fill="${liq}" opacity=".5"/>` : '') +
        `<ellipse cx="${f(x)}" cy="${f(y - H)}" rx="${f(r)}" ry="${f(ry)}" fill="${top || Q.lit(p, c, .35, .1)}" stroke="${rimC || dk(c, .35)}" stroke-width=".6"/>`;
}

// バター（溶けかけの小さな角）
const butter = (p, x, y, s) => `<ellipse cx="${f(x + 1)}" cy="${f(y + 2)}" rx="${f(s * .9)}" ry="${f(s * .9 * SY)}" fill="#f4d870" opacity=".5"/>` + Q.prism(p, x, y, [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]].map(([u, v]) => [u * (1 + (v > 0 ? .15 : 0)), v]), s * .4, '#f6dc78', { rot: 20, top: Q.lit(p, '#fff0b0', .4, .1) });
// 魚のぶつ切り（さば: 青銀の皮、淡い身）
function fishChunk(p, x, y, s, rot, liq, { skin = '#6e7e8c', flesh = '#e8dcc4' } = {}){
    const pts = [[-s / 2, -s * .3], [s / 2, -s * .34], [s * .5, s * .3], [-s * .48, s * .32]];
    return Q.prism(p, x, y, pts, s * .4, skin, { rot, sink: liq ? 2 : 0, liquid: liq, top: Q.lit(p, flesh, .3, .12) }) +
        `<g ${T(x, y - s * .4 * CZ, rot * .4)}><path d="M${f(-s * .3)},-1.6 Q0,0 ${f(s * .3)},-2" stroke="${dk(flesh, .15)}" stroke-width=".8" fill="none"/></g>`;
}
// 千切り（色ちがいの細い棒を面に寝かせる。沢煮椀）
function sticks(p, x, y, L, rot, c, seed, n = 3){
    const R = rng(p.id + 'st' + seed);
    let o = '';
    for (let i = 0; i < n; i++){ const r = rot + (R() - .5) * 30, dx = (R() - .5) * 5, dy = (R() - .5) * 3; o += `<g ${T(x + dx, y + dy, r)}><g transform="scale(1 ${SY * 1.4})"><rect x="${f(-L / 2)}" y="-1.6" width="${f(L)}" height="3.2" rx="1" fill="${dk(c, .3)}" transform="translate(0 1.2)"/><rect x="${f(-L / 2)}" y="-1.6" width="${f(L)}" height="3.2" rx="1" fill="${Q.lit(p, c, .3, .1)}" stroke="${dk(c, .35)}" stroke-width=".4"/></g></g>`; }
    return o;
}
// 呉（すりつぶした大豆）のつぶつぶ
function speckle(p, S, n, seed, c = '#f2e2bc'){
    const R = rng(p.id + 'spk' + seed);
    return `<g ${S.inside}>${Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * S.rx * .95, x = S.cx + Math.cos(a) * d, y = S.cy + Math.sin(a) * d * SY; return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.2 + R() * 1.4)}" ry="${f(.8 + R() * .6)}" fill="${R() < .6 ? c : dk(c, .12)}" opacity=".8"/>`; }).join('')}</g>`;
}
// だんご（小麦粉を練ってちぎった平たい団子）
const dango = (p, x, y, s, rot, seed) => Q.slab(p, x, y, s / 2, s * .32, 3, '#f2ead8', 'dg' + seed, { n: 10, jit: .3, rot }).s;

// ポタージュのとろみ（面にうっすら残るうねり）と、クリームのうず（r2 の描き方を斜めに）
function velvet(p, S, c, op = .35){
    const { cx, cy, rx } = S, ry = rx * SY;
    return `<g ${S.inside}><path d="M${f(cx - rx * .55)},${f(cy + ry * .25)} Q${f(cx - rx * .1)},${f(cy + ry * .05)} ${f(cx + rx * .25)},${f(cy + ry * .3)} T${f(cx + rx * .6)},${f(cy + ry * .2)}" stroke="${lt(c, .4)}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="${op}"/>
        <path d="M${f(cx - rx * .35)},${f(cy + ry * .55)} Q${f(cx)},${f(cy + ry * .4)} ${f(cx + rx * .35)},${f(cy + ry * .56)}" stroke="${dk(c, .12)}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="${f(op * .7)}"/></g>`;
}
function swirl(cx, cy, R, { c = '#fffdf6', w = 3, turns = 1.5, op = .95 } = {}){
    let d = '';
    for (let i = 0; i <= 40; i++){ const t = i / 40, a = t * turns * 6.283 - 1.2, rr = R * (.15 + .85 * t); d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr * SY)}`; }
    return `<path d="${d}" stroke="#b8a888" stroke-width="${w + 1}" fill="none" stroke-linecap="round" opacity=".25" transform="translate(.8 1.2)"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}
// 粉・ごま・パセリなどの細かな点（面の上）
function dust(p, S, n, c, seed, { r = .7, R0 = .8, sy = 1 } = {}){
    const R = rng(p.id + 'du' + seed + c);
    return `<g ${S.inside}>${Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * S.rx * R0; return `<ellipse cx="${f(S.cx + Math.cos(a) * d)}" cy="${f(S.cy + Math.sin(a) * d * SY)}" rx="${f(r * (.7 + R() * .6))}" ry="${f(r * (.7 + R() * .6) * sy)}" fill="${c}"/>`; }).join('')}</g>`;
}
// 牛の薄切り（煮た。濃い茶でひだ）
const beef = (p, x, y, s, rot, seed, c = '#8a5434') => { const sl = Q.slab(p, x, y, s / 2, s * .2, 1.8, c, 'bf' + seed, { n: 14, jit: .35, rot: rot % 50 - 25 }); return sl.s + `<path d="M${f(x - s * .3)},${f(y - 1)} Q${f(x - s * .05)},${f(y - 3.4)} ${f(x + s * .25)},${f(y - 1.6)}" stroke="${lt(c, .45)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".75"/>`; };
// しめじ（白い軸と茶のかさ。小さな株）
function shimeji(p, x, y, s, rot, seed){
    const R = rng(p.id + 'sj' + seed);
    let o = '';
    for (let i = 0; i < 3; i++){ const a = (i - 1) * 22 + (R() - .5) * 10, L = s * (.7 + R() * .3); o += `<g transform="rotate(${f(a)})"><path d="M0,0 L0,${f(-L)}" stroke="#e8e0cc" stroke-width="${f(s * .16)}" stroke-linecap="round"/><path d="M0,0 L0,${f(-L)}" stroke="#c8bca0" stroke-width=".5" transform="translate(${f(s * .08)} 0)"/><ellipse cx="0" cy="${f(-L)}" rx="${f(s * .26)}" ry="${f(s * .17)}" fill="${Q.dome(p, '#8a6a4c', .3, .3)}" stroke="#5a4430" stroke-width=".5"/></g>`; }
    return Q.cast(p, x, y + 2, s * .5, s * .15, .25) + `<g ${T(x, y + s * .3, rot % 40 - 20)}>${o}</g>`;
}
// 長ねぎの斜め切り（鍋・芋煮）: 白い楕円の筒を寝かせる
function negiDiag(p, x, y, L, rot, c = '#f2f0dc'){
    return `<g ${T(x, y, rot)}><g transform="scale(1 ${SY * 1.5})">${''}<rect x="${f(-L / 2)}" y="-3.4" width="${f(L)}" height="6.8" rx="3.4" fill="${Q.lg(p, [[0, '#ffffff'], [.5, c], [1, '#c8cca0']], 0, 0, 0, 1)}" stroke="#a8b080" stroke-width=".5"/><ellipse cx="${f(L / 2 - 2)}" cy="0" rx="2.4" ry="3.2" fill="#e4ecc4" stroke="#a8b080" stroke-width=".5"/><ellipse cx="${f(L / 2 - 2)}" cy="0" rx="1.2" ry="1.6" fill="none" stroke="#b8c890" stroke-width=".5"/></g></g>`;
}
// 角餅（焼いた焼き目。だしに半分沈む）
function mochi(p, x, y, s, rot, liq){
    return Q.prism(p, x, y, [[-s / 2, -s * .4], [s / 2, -s * .4], [s / 2, s * .4], [-s / 2, s * .4]], s * .32, '#f4eee2', { rot, sink: 2, liquid: liq, top: Q.dome(p, '#fbf8f0', .3, .08), line: .5 }) +
        `<ellipse cx="${f(x - s * .1)}" cy="${f(y - s * .32 * CZ)}" rx="${f(s * .16)}" ry="${f(s * .08)}" fill="#d8a860" opacity=".55"/><ellipse cx="${f(x + s * .18)}" cy="${f(y - s * .32 * CZ + 2)}" rx="${f(s * .1)}" ry="${f(s * .05)}" fill="#c89048" opacity=".5"/>`;
}
// かまぼこ（ピンクの縁の板）
const kamaboko = (p, x, y, s, rot, liq) => Q.prism(p, x, y, arcPts(s * .55, 180, 360, 8), 3, '#e8708a', { rot, sink: 1, liquid: liq, top: Q.lit(p, '#fbf6ee', .3, .06) });
// にんじんの輪切り
const carrotRound = (p, x, y, s, liq) => cyl(p, x, y, s / 2, 3, '#e8742a', liq, { top: Q.rg(p, [[0, '#f8b070'], [.4, '#f08a3a'], [1, '#d8661e']], .4, .4, .7) });
// ベーコンの角切り
const bacon = (p, x, y, s, rot, liq) => Q.prism(p, x, y, rect(s, s * .6), 2.4, '#c8604a', { rot, sink: liq ? 1 : 0, liquid: liq, top: Q.lg(p, [[0, '#e88a72'], [.45, '#d06a52'], [.5, '#f6e2cc'], [.62, '#f6e2cc'], [.66, '#d06a52'], [1, '#b85440']], 0, 0, 0, 1) });
// コーンの粒
const corn = (p, x, y, s = 4) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .55)}" ry="${f(s * .45)}" fill="${Q.dome(p, '#f6c83a', .35, .3)}" stroke="#c8961a" stroke-width=".5"/><ellipse cx="${f(x - s * .15)}" cy="${f(y - s * .15)}" rx="${f(s * .14)}" ry="${f(s * .09)}" fill="#fff" opacity=".85"/>`;
// トマトのくし切り（煮えて少し崩れた）
function tomatoW(p, x, y, s, rot, liq){
    return Q.prism(p, x, y, arcPts(s / 2, 180, 360, 8), s * .25, '#d8382a', { rot, sink: liq ? 1.5 : 0, liquid: liq, top: Q.lit(p, '#f05a40', .3, .15) }) +
        `<g ${T(x, y - s * .25 * CZ - 1, rot * .3)}><path d="M${f(-s * .22)},1 Q${f(-s * .1)},-1.5 0,1 M${f(s * .04)},1 Q${f(s * .14)},-1.5 ${f(s * .24)},1" stroke="#f8d060" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`;
}
// 細切り（豆腐・しいたけ・たけのこ）
const strip = (p, x, y, L, w, rot, c, liq, h = 2.4) => tanzaku(p, x, y, L, w, rot, c, liq, h);

// ウインナー（つやのある細長い筒を寝かせる）
function sausage(p, x, y, L, rot){
    const w = L * .32;
    return Q.cast(p, x, y + w * .5, L * .5, w * .3, .32) + `<g ${T(x, y, rot)}><g transform="scale(1 ${f(SY * 1.3)})"><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${f(w)}" rx="${f(w / 2)}" fill="${Q.lg(p, [[0, '#e89a7a'], [.4, '#c8684a'], [1, '#8a3e26']], 0, 0, 0, 1)}" stroke="#7a3420" stroke-width=".6"/>
        <path d="M${f(-L * .35)},${f(-w * .22)} L${f(L * .3)},${f(-w * .22)}" stroke="#ffe0d0" stroke-width="1.4" stroke-linecap="round" opacity=".85"/><path d="M${f(L * .1)},${f(-w * .4)} l2,${f(w * .3)} M${f(L * .22)},${f(-w * .4)} l2,${f(w * .3)}" stroke="#8a3e26" stroke-width=".7" opacity=".6"/></g></g>`;
}
// ブロッコリー（小さなつぼみの房）
function broccoli(p, x, y, s, seed){
    const R = rng(p.id + 'br' + seed);
    let o = `<path d="M${f(x)},${f(y + s * .1)} L${f(x + s * .15)},${f(y + s * .5)}" stroke="#9cc46a" stroke-width="${f(s * .25)}" stroke-linecap="round"/>`;
    const b = Array.from({ length: 7 }, () => [x + (R() - .5) * s * .7, y - s * .12 + (R() - .5) * s * .4, s * (.16 + R() * .08)]).sort((a, c) => a[1] - c[1]);
    for (const [bx, by, r] of b) o += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(r)}" fill="${Q.dome(p, '#3f8a34', .3, .35)}" stroke="#25601e" stroke-width=".5"/>`;
    return Q.cast(p, x, y + s * .3, s * .5, s * .16, .3) + o;
}
// ワンタン（ひだのある薄い皮に、透ける肉あん）
function wonton(p, x, y, s, rot, seed){
    const R = rng(p.id + 'wt' + seed);
    const d = smooth(ring(s / 2, 12, .45, R, 1.2, SY * 1.1, R()), true, 1);
    return `<g ${T(x, y, rot % 40 - 20)}><path d="${d}" fill="#f2ecdc" opacity=".75"/><path d="${smooth(ring(s / 2, 12, .45, R, 1.2, SY * 1.1, R()), true, 1)}" fill="${Q.lit(p, '#f8f4e8', .3, .1)}" stroke="#d8ccb0" stroke-width=".6" opacity=".95"/>
        <ellipse cx="${f(-s * .05)}" cy="-1" rx="${f(s * .2)}" ry="${f(s * .13)}" fill="${Q.dome(p, '#d89a88', .3, .2)}" opacity=".85"/><path d="M${f(-s * .35)},${f(s * .05)} Q${f(-s * .2)},${f(-s * .1)} ${f(-s * .05)},${f(s * .08)} M${f(s * .08)},${f(s * .1)} Q${f(s * .22)},${f(-s * .05)} ${f(s * .36)},${f(s * .08)}" stroke="#d8ccb0" stroke-width=".8" fill="none"/>
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .15)},${f(-s * .24)} ${f(s * .05)},${f(-s * .22)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/></g>`;
}
// 春雨（すき通った細い糸の束）
function harusame(p, x, y, s, seed){
    const R = rng(p.id + 'hs' + seed);
    let o = '';
    for (let i = 0; i < 9; i++){ const yy = (R() - .5) * s * .3, pts = Array.from({ length: 6 }, (_, j) => [x - s / 2 + j * s / 5 + (R() - .5) * 3, y + yy + Math.sin(j * 1.2 + i) * 2.6]); const d = smooth(pts, false); o += `<path d="${d}" stroke="#c8b890" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".35"/><path d="${d}" stroke="#fbf8ee" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>`; }
    return o;
}
// 白菜キムチ（赤く染まった葉と白い軸）
function kimchi(p, x, y, s, rot, seed){
    return Q.leaf(p, x, y, s, rot, '#d8442a', 'km' + seed, { wave: 2.6 }) + `<g ${T(x, y, rot)}><g transform="scale(1 ${SY})"><path d="M${f(-s * .35)},2 Q0,-1 ${f(s * .35)},2" stroke="#f6dcc8" stroke-width="${f(s * .12)}" stroke-linecap="round" opacity=".9"/></g></g>`;
}
// 生卵を落とした黄身（白身のまわりに）
const yolkEgg = (p, x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .7)}" ry="${f(s * .7 * SY)}" fill="#fbf6ea" opacity=".9"/><ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(s * .32)}" ry="${f(s * .28)}" fill="${Q.dome(p, '#f6b42a', .4, .3)}" stroke="#d88a14" stroke-width=".6"/><ellipse cx="${f(x - s * .1)}" cy="${f(y - s * .14)}" rx="${f(s * .1)}" ry="${f(s * .05)}" fill="#fff" opacity=".9"/>`;
// 崩したおぼろ豆腐（すくった白い塊）
const softTofu = (p, x, y, s, seed) => Q.slab(p, x, y, s / 2, s * .32, 4, '#f8f4e8', 'st' + seed, { n: 10, jit: .4 }).s;
// パクチー（切れ込みのある小さな葉）
function coriander(p, x, y, s, rot){
    const lf = a => `<path d="M0,0 Q${f(-s * .3)},${f(-s * .2)} ${f(-s * .2)},${f(-s * .5)} Q0,${f(-s * .62)} ${f(s * .2)},${f(-s * .5)} Q${f(s * .3)},${f(-s * .2)} 0,0Z" transform="rotate(${a})" fill="${Q.lit(p, '#4aa03a', .3, .2)}" stroke="#2a6a1e" stroke-width=".5"/>`;
    return `<g ${T(x, y, rot)}><g transform="scale(1 ${f(SY * 1.4)})">${lf(-60)}${lf(0)}${lf(60)}</g></g>`;
}
// マッシュルーム（かさと軸）
function mushroom(p, x, y, s, rot){
    return Q.cast(p, x, y + s * .3, s * .5, s * .15, .3) + `<g ${T(x, y, rot % 30 - 15)}><rect x="${f(-s * .14)}" y="0" width="${f(s * .28)}" height="${f(s * .32)}" rx="2" fill="#e8dcc4" stroke="#a88a64" stroke-width=".5"/><ellipse cx="0" cy="0" rx="${f(s / 2)}" ry="${f(s * .36)}" fill="${Q.dome(p, '#c8a47a', .35, .3)}" stroke="#7a5a3a" stroke-width=".6"/><path d="M${f(-s * .3)},${f(-s * .08)} Q${f(-s * .2)},${f(-s * .28)} ${f(s * .05)},${f(-s * .3)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 玉ねぎのくし切り（層の見える大きな塊。ポトフ）
function onionWedge(p, x, y, s, rot, c = '#efe2b4'){
    const k = s / 20;
    return `<g ${T(x, y, rot, k)}><g ${thick(p, 1.6, dk(c, .35), .6)}><path d="M-10,3 Q0,-9 10,3 L7,4 Q0,-5 -7,4Z" fill="${Q.lg(p, [[0, lt(c, .3)], [1, c]], 0, 0, 0, 1)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M-6.6,4 Q0,-4.4 6.6,4 L4,4.4 Q0,-1 -4,4.4Z" fill="${lt(c, .18)}" stroke="${dk(c, .25)}" stroke-width=".5"/></g><path d="M-7,0 Q-3,-5 2,-5.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}

// ---------- 煮物 ----------
// しらたき（半透明の細い束）
function shirataki(p, x, y, s, seed = 1){
    const R = rng(p.id + 'sh' + seed);
    let o = '';
    for (let i = 0; i < 14; i++){ const yy = (R() - .5) * s * .32, pts = Array.from({ length: 6 }, (_, j) => [-s / 2 + j * s / 5 + (R() - .5) * 3, yy + Math.sin(j * 1.3 + i) * 2.2 + (R() - .5) * 2]); const d = smooth(pts, false); o += `<path d="${d}" stroke="#b9a684" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/><path d="${d}" stroke="${R() < .5 ? '#f3eee2' : '#e8dfcc'}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".95"/>`; }
    return Q.cast(p, x, y + s * .12, s * .5, s * .14, .25) + `<g ${T(x, y, -8)}>${o}</g>`;
}
// れんこんの輪切り（穴のある円柱）
function renkon(p, x, y, s, c = '#e2c595'){
    const r = s / 2, holes = [[0, 0, .2], ...Array.from({ length: 7 }, (_, i) => { const a = i / 7 * 6.283; return [Math.cos(a) * r * .6, Math.sin(a) * r * .6, .15]; })];
    return cyl(p, x, y, r, 5, c, null, { top: Q.lit(p, lt(c, .1), .3, .15) }) + holes.map(([u, v, k]) => `<ellipse cx="${f(x + u)}" cy="${f(y - 5 * CZ + v * SY)}" rx="${f(r * k)}" ry="${f(r * k * SY * 1.1)}" fill="${dk(c, .45)}"/>`).join('');
}
// ぶり・さばの切り身（煮て照りのついた身、濃い皮）
function fishSimmered(p, x, y, s, rot, { skin = '#5e5a64', flesh = '#b07040' } = {}){
    const pts = [[-s / 2, -s * .3], [s * .45, -s * .36], [s / 2, s * .3], [-s * .46, s * .34]];
    return Q.prism(p, x, y, pts, s * .26, skin, { rot, top: Q.rg(p, [[0, lt(flesh, .35)], [.6, flesh], [1, dk(flesh, .3)]], .36, .3, .8) }) + shine(x - s * .1, y - s * .34 * CZ - 2, s * .45, rot * .4);
}
// ゆで卵（半分に切った。煮汁で茶に染まった白身と黄身）
function eggHalf(p, x, y, s, stain = '#c88a4a'){
    return Q.cast(p, x, y + s * .3, s * .5, s * .16, .32) + `<ellipse cx="${f(x)}" cy="${f(y + 2)}" rx="${f(s / 2)}" ry="${f(s * .36)}" fill="${dk(stain, .1)}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s / 2)}" ry="${f(s * .34)}" fill="${Q.rg(p, [[0, '#fbf2e2'], [.7, lt(stain, .5)], [1, stain]], .45, .45, .6)}" stroke="${dk(stain, .3)}" stroke-width=".6"/><ellipse cx="${f(x + .5)}" cy="${f(y)}" rx="${f(s * .24)}" ry="${f(s * .17)}" fill="${Q.dome(p, '#f6b42a', .3, .25)}"/><circle cx="${f(x - s * .06)}" cy="${f(y - s * .06)}" r="${f(s * .04)}" fill="#fff" opacity=".85"/>`;
}
// 豚の角煮（赤身と脂の層が見える角。濃い照り）
function kakuniCube(p, x, y, s, rot){
    const H = s * .72, layers = [[.3, '#8a4a24'], [.14, '#ecd2a8'], [.26, '#8e4c26'], [.1, '#e8c898'], [.2, '#7a3e1c']];
    let z = 0, o = '';
    layers.forEach(([k, c], i) => { const h = H * k, last = i === layers.length - 1; o += Q.prism(p, x, y - z * CZ, square(s), h, c, { rot, sink: i ? .001 : 0, line: .4, top: last ? Q.rg(p, [[0, '#c87a40'], [.6, '#9a5428'], [1, '#6a3414']], .36, .3, .8) : c }); z += h; });
    return o + shine(x - s * .1, y - H * CZ - 1, s * .5, rot * .3);
}
const square = s => [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]];
// 手羽元（太い身と骨の先。照り）
function drumstick(p, x, y, s, rot, c = '#a8642e'){
    const d = `M${f(-s * .5)},0 C${f(-s * .5)},${f(-s * .3)} ${f(-s * .1)},${f(-s * .32)} ${f(s * .15)},${f(-s * .12)} L${f(s * .38)},${f(-s * .05)} L${f(s * .38)},${f(s * .07)} L${f(s * .15)},${f(s * .14)} C${f(-s * .1)},${f(s * .32)} ${f(-s * .5)},${f(s * .3)} ${f(-s * .5)},0Z`;
    return Q.cast(p, x, y + s * .2, s * .5, s * .15, .35) + `<g ${T(x, y, rot)}><g transform="scale(1 ${f(SY * 1.7)})"><path d="${d}" fill="${Q.rg(p, [[0, lt(c, .35)], [.6, c], [1, dk(c, .35)]], .35, .3, .8)}" stroke="${dk(c, .4)}" stroke-width=".6"/>
        <ellipse cx="${f(s * .42)}" cy="${f(s * .01)}" rx="${f(s * .07)}" ry="${f(s * .09)}" fill="#f2e8d4" stroke="#b8a888" stroke-width=".5"/>
        <path d="M${f(-s * .38)},${f(-s * .1)} Q${f(-s * .2)},${f(-s * .24)} ${f(s * .05)},${f(-s * .14)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".75"/></g></g>`;
}
// いかの輪切り（厚みのある輪。煮て淡い茶）
function squidRing3(p, x, y, s, c = '#ecd2b0'){
    const rx = s / 2, ry = rx * SY * 1.15, w = s * .2;
    return Q.cast(p, x, y + ry * .6, rx, ry * .55, .28) + `<path fill-rule="evenodd" d="${Q.eD(x, y + 2, rx, ry)} ${Q.eD(x, y + 2, rx - w, ry - w * SY)}" fill="${dk(c, .25)}"/><path fill-rule="evenodd" d="${Q.eD(x, y, rx, ry)} ${Q.eD(x, y + .6, rx - w, ry - w * SY)}" fill="${Q.lit(p, c, .35, .15)}" stroke="${dk(c, .35)}" stroke-width=".6"/><path d="M${f(x - rx * .7)},${f(y - ry * .5)} A${f(rx)},${f(ry)} 0 0 1 ${f(x)},${f(y - ry * .98)}" stroke="#fff" stroke-width="1" fill="none" opacity=".85"/>`;
}
// 生姜の千切り（細い淡黄の線）
function gingerShreds(p, x, y, s, seed = 1){
    const R = rng(p.id + 'gs' + seed);
    return Array.from({ length: 7 }, () => { const a = R() * 180, L = s * (.5 + R() * .5), dx = (R() - .5) * s * .4, dy = (R() - .5) * s * .2; return `<g ${T(x + dx, y + dy, a)}><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#a88a3a" stroke-width="2" stroke-linecap="round" opacity=".5"/><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#f4e08a" stroke-width="1.2" stroke-linecap="round"/></g>`; }).join('');
}
// あん（すき通ったとろみと照り）
function ankake(p, x, y, rx, seed = 1, c = '#d8a050'){
    const d = smooth(ring(rx, 11, .25, rng(p.id + 'ak' + seed), 1, SY * 1.05));
    return `<path d="${d}" transform="translate(${f(x)} ${f(y)})" fill="${c}" opacity=".45"/><path d="${d}" transform="translate(${f(x)} ${f(y)})" fill="none" stroke="${lt(c, .5)}" stroke-width="1.2" opacity=".6"/>` + shine(x - rx * .35, y - rx * SY * .5, rx * .5, -6, .8) + shine(x + rx * .2, y + 2, rx * .35, -4, .6);
}
// ひき肉のそぼろ（小さな粒）
function mince(p, x, y, rx, n, seed, c = '#c8945a'){
    const R = rng(p.id + 'mi' + seed);
    return Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * rx, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * SY; return `<path d="${smooth(ring(1.8 + R() * 1.2, 5, .5, R))}" transform="translate(${f(px)} ${f(py)})" fill="${Q.lit(p, R() < .5 ? c : dk(c, .15), .3, .2)}" stroke="${dk(c, .4)}" stroke-width=".4"/>`; }).join('');
}
// ごぼう（乱切り）
const goboRan = (p, x, y, s, rot, seed) => Q.rangiri(p, x, y, s, rot, '#9a7450', seed);
// 煮物の組み立て: 器に少ない煮汁、具を中心ほど高く積む（V.above で手前の口に隠す）
function nimono(p, V, { c = '#b98a4a', drop = 14, glow = .3, H = 26, R = 76, items, after = '' }){
    const S = Q.surface(p, V, { drop, c, glow });
    const m = (u, v) => H * Math.max(0, 1 - (u * u + v * v) / R / R);
    const pl = (u, v, z = 0) => at(S.o, u, v, m(u, v) + z);
    return V.s + S.s + `<g ${V.inside}>${Q.cast(p, 100, S.cy + 8, S.rx * .75, S.rx * SY * .5, .3)}</g>` + `<g ${V.above}>${byDepth(items(pl, S))}${after}</g>` + Q.depthVeil(p, V, V.cy - V.iry - H, V.cy + V.iry) + V.shine(.45);
}
// 並べる具の一覧から [[y, fn]] を作る: list = [[kind, u, v, ...args]]、kinds = { kind: (x, y, ...args, i) => svg }
const lay = (pl, list, kinds) => list.map(([k, u, v, ...a], i) => { const [x, y] = pl(u, v); return [y, () => kinds[k](x, y, ...a, i)]; });
// 汁の面の質感 ---------------------------------------------------
// 味噌の雲（汁の中で沈みかけた味噌の対流）: ぼかした明るい塊と、やや濃い筋
function misoCloud(p, S, c, seed = 1, op = .5){
    const R = rng(p.id + 'mc' + seed);
    const blobs = Array.from({ length: 7 }, (_, i) => { const a = i / 7 * 6.283 + R(), d = S.rx * (.2 + R() * .45); return `<ellipse cx="${f(S.cx + Math.cos(a) * d)}" cy="${f(S.cy + Math.sin(a) * d * SY)}" rx="${f(10 + R() * 10)}" ry="${f(5 + R() * 4)}" fill="${lt(c, .3)}" opacity="${op}"/>`; }).join('');
    return `<g ${S.inside}><g ${Q.blur(p, 4)}>${blobs}</g>
        <path d="M${f(S.cx - S.rx * .65)},${f(S.cy + 6)} Q${f(S.cx - S.rx * .35)},${f(S.cy - 4)} ${f(S.cx - 4)},${f(S.cy + 4)} T${f(S.cx + S.rx * .6)},${f(S.cy + 2)}" stroke="${dk(c, .18)}" stroke-width="2.4" fill="none" opacity=".3"/>
        <path d="M${f(S.cx - S.rx * .45)},${f(S.cy + 20)} Q${f(S.cx - 4)},${f(S.cy + 11)} ${f(S.cx + S.rx * .45)},${f(S.cy + 20)}" stroke="${lt(c, .3)}" stroke-width="3" fill="none" opacity=".4"/></g>`;
}
// 面に映る光（左奥に横長のやわらかい照り）
const glint = (p, S, op = .55) => `<g ${S.inside}><ellipse cx="${f(S.cx - S.rx * .4)}" cy="${f(S.cy - S.ry * .62)}" rx="${f(S.rx * .28)}" ry="4.5" fill="#fff" opacity="${op}" transform="rotate(-8 ${f(S.cx - S.rx * .4)} ${f(S.cy - S.ry * .62)})" ${Q.blur(p, 2.2)}/><ellipse cx="${f(S.cx - S.rx * .45)}" cy="${f(S.cy - S.ry * .64)}" rx="${f(S.rx * .11)}" ry="1.6" fill="#fff" opacity="${f(op + .25)}" transform="rotate(-8 ${f(S.cx - S.rx * .45)} ${f(S.cy - S.ry * .64)})"/></g>`;
// 油の粒（ごま油・バター）
function oilDots(p, S, n, seed, c = '#f0c040', R0 = .8){
    const R = rng(p.id + 'od' + seed);
    return `<g ${S.inside}>${Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * S.rx * R0, x = S.cx + Math.cos(a) * d, y = S.cy + Math.sin(a) * d * SY, r = 1 + R() * 2.2; return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * SY)}" fill="${c}" opacity=".5" stroke="${lt(c, .5)}" stroke-width=".5"/>`; }).join('')}</g>`;
}

// ---------- 汁物の組み立て ----------
// V: 器、c: 汁の色、items(place, S) は [[y, () => svg], ...] を返す。miso: 味噌の雲、negiN: ねぎの数
function soup(p, V, { drop = 9, c, glow = .3, rimShade = .3, miso = false, cloudOp = .5, items, negiN = 0, negiC = '#5fa03a', oil = 0, oilC = '#f0c040', gl = .5, steamOp = 0, extra = null }){
    const S = Q.surface(p, V, { drop, c, glow, rimShade });
    const place = (u, v, z = 0) => at(S.o, u, v, z);
    const it = items(place, S);
    if (negiN){ const R = rng(p.id + 'ng'); for (let i = 0; i < negiN; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * S.rx * .78, [x, y] = place(Math.cos(a) * d, Math.sin(a) * d); const col = R() < .6 ? negiC : lt(negiC, .3); it.push([y + .1, () => Q.negi(p, x, y, 7, col)]); } }
    return V.s + S.s + (miso ? misoCloud(p, S, c, 1, cloudOp) : '') + (oil ? oilDots(p, S, oil, 1, oilC) : '') + glint(p, S, gl) + (extra ? extra(S) : '') +
        `<g ${V.inside}>${byDepth(it)}</g>` + Q.depthVeil(p, V, V.cy - V.iry, V.cy + V.iry) + V.shine(.5) + (steamOp ? Q.steam(100, 4, steamOp) : '');
}
// 散らした場所に、kinds を順に置く: kinds = [(x, y, rot, i) => svg, ...]
const scatter = (place, seed, n, R, minD, kinds) => spots(seed, n, R, minD).map(([u, v, r], i) => { const [x, y] = place(u, v); return [y, () => kinds[i % kinds.length](x, y, r, i)]; });

// 器（汁椀の色ちがい: 外が焦げ茶の漆・内が朱）
const wanDark = p => Q.wan(p, { outer: '#4a2c22', lip: '#5a382c', inner: '#8e2a1c' });
const MISO = '#c99a5a', MISO_D = '#b07a40', MISO_W = '#d8b47a';

// =========================================================
// 品
// =========================================================
export default {
    // 豆腐とわかめの味噌汁: 朱の汁椀、味噌の雲、豆腐のさいの目、わかめ、ねぎ
    misoshiru: p => soup(p, Q.wan(p), { c: MISO, miso: true, negiN: 10, items: (pl, S) => [
        ...scatter(pl, 'ms', 5, 50, 30, [(x, y, r) => tofu(p, x, y, 21, r, MISO)]),
        ...[[-46, -22, 15, 1], [40, -8, -25, 2], [10, 34, 10, 3], [-36, 22, -10, 4]].map(([u, v, r, i]) => { const [x, y] = pl(u, v); return [y - 3, () => Q.leaf(p, x, y, 36, r, '#2f5a2a', 'w' + i, { wave: 2.4 })]; }),
    ] }),

    // 豚汁: 焦げ茶の漆に朱の内、にごった味噌汁に豚バラ・大根とにんじんのいちょう切り・ささがきごぼう・こんにゃく・長ねぎ、ごま油の粒
    tonjiru: p => soup(p, wanDark(p), { c: '#c08a50', miso: true, oil: 10, negiN: 8, items: pl => scatter(pl, 'tj', 11, 58, 25, [
        (x, y, r) => icho(p, x, y, 19, r, '#efe6cc', '#c08a50'),
        (x, y, r, i) => porkBara(p, x, y, 38, r, i),
        (x, y, r) => icho(p, x, y, 16, r, '#ec7b2d', '#c08a50'),
        (x, y, r, i) => sasagaki(p, x, y, 18, r, i),
        (x, y, r, i) => konnyaku(p, x, y, 16, r, '#c08a50', i),
    ]) }),

    // けんちん汁: すまし仕立て（醤油の澄んだ琥珀）に、崩した豆腐・大根・にんじん・ごぼう・里芋・こんにゃく、ごま油
    kenchinjiru: p => soup(p, Q.wan(p), { c: '#d2a460', glow: .35, oil: 9, items: pl => scatter(pl, 'kc', 11, 58, 25, [
        (x, y, r, i) => Q.prism(p, x, y, centered(Array.from({ length: 6 }, (_, k) => { const R = rng('kt' + i + k); return [Math.cos(k * 1.05) * (9 + R() * 4), Math.sin(k * 1.05) * (9 + R() * 4)]; })), 5, '#f6f1e2', { rot: r, sink: 1.4, liquid: '#d2a460', top: Q.lg(p, [[0, '#fffefa'], [1, '#efe8d6']], 0, 0, 1, 1) }),
        (x, y, r) => icho(p, x, y, 19, r, '#efe6cc', '#d2a460'),
        (x, y, r) => icho(p, x, y, 16, r, '#ec7b2d', '#d2a460'),
        (x, y, r, i) => sasagaki(p, x, y, 18, r, i),
        (x, y, r, i) => satoimo(p, x, y, 22, i),
        (x, y, r, i) => konnyaku(p, x, y, 16, r, '#d2a460', i),
    ]) }),

    // なめこと豆腐の味噌汁: 焦げ茶の漆、赤みの味噌汁に、つやのあるなめこの群れと豆腐、ねぎ
    namekomiso: p => soup(p, wanDark(p), { c: MISO_D, miso: true, cloudOp: .4, negiN: 8, items: pl => [
        ...scatter(pl, 'nm', 4, 46, 34, [(x, y, r) => tofu(p, x, y, 20, r, MISO_D)]),
        ...[[-42, -24], [30, -36], [50, 14], [-12, 8], [-50, 26], [14, 42]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => nameko(p, x, y, 26, i)]; }),
    ] }),

    // あさりの味噌汁: 朱の汁椀に、ひらいたあさりをたっぷり、ねぎ
    asarimiso: p => soup(p, Q.wan(p), { c: MISO, miso: true, negiN: 8, items: pl => scatter(pl, 'as', 7, 54, 36, [(x, y, r, i) => i % 2 ? clam(p, x, y, 26, r, { seed: i }) : shut(p, x, y, 26, r, i)]) }),

    // 豆腐と三つ葉のすまし汁: 朱の汁椀、澄んだだし（底の内壁が少し透ける）、豆腐、三つ葉、えのき
    sumashijiru: p => soup(p, Q.wan(p), { c: '#e2c47e', glow: .45, rimShade: .22, gl: .7, items: pl => [
        ...[[-26, -10, 20], [20, -16, 50], [0, 18, 10]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => tofu(p, x, y, 22, r, '#e2c47e')]; }),
        ...[[-46, 14, -20], [44, 10, 200]].map(([u, v, r], i) => { const [x, y] = pl(u, v); return [y - 6, () => mitsuba(p, x, y, 22, r)]; }),
        ...[[30, 30, -10], [-48, -28, 30]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y - 1, () => enoki(p, x, y, 32, r)]; }),
    ] }),

    // しじみの味噌汁: 焦げ茶の漆に、小さな濃い殻のしじみをたくさん、ねぎ
    shijimimiso: p => soup(p, wanDark(p), { c: MISO, miso: true, negiN: 7, items: pl => scatter(pl, 'sj', 12, 58, 25, [(x, y, r, i) => i % 3 === 1 ? clam(p, x, y, 18, r, { ...SHIJIMI, seed: i }) : shut(p, x, y, 18, r, i, SHIJIMI)]) }),

    // 大根と油揚げの味噌汁: 朱の汁椀、大根の短冊（半透明の白）と油揚げ、ねぎ
    daikonmiso: p => soup(p, Q.wan(p), { c: MISO, miso: true, negiN: 9, items: pl => scatter(pl, 'dk', 9, 56, 28, [
        (x, y, r) => tanzaku(p, x, y, 30, 8, r, '#eee6cc', MISO, 2.4, Q.lit(p, '#f6f0dc', .3, .08)),
        (x, y, r, i) => age(p, x, y, 26, 10, r, MISO, i),
        (x, y, r) => tanzaku(p, x, y, 28, 8, r, '#eee6cc', MISO, 2.4, Q.lit(p, '#f6f0dc', .3, .08)),
    ]) }),

    // じゃがいもと玉ねぎの味噌汁: 朱の汁椀、じゃがいもの角切りと玉ねぎ、ねぎ
    jagaimomiso: p => soup(p, Q.wan(p), { c: MISO, miso: true, negiN: 8, items: pl => scatter(pl, 'jg', 9, 56, 28, [
        (x, y, r, i) => potatoChunk(p, x, y, 23, r, i, MISO),
        (x, y, r) => onionArc(p, x, y, 30, r),
        (x, y, r, i) => potatoChunk(p, x, y, 22, r, i + 9, MISO),
    ]) }),

    // なすと油揚げの味噌汁: 朱の汁椀、なすの半月（紫の皮）と油揚げ、ねぎ
    nasuagemiso: p => soup(p, Q.wan(p), { c: MISO, miso: true, negiN: 8, items: pl => scatter(pl, 'na', 9, 56, 28, [
        (x, y, r) => nasu(p, x, y, 16, r, MISO),
        (x, y, r, i) => age(p, x, y, 26, 10, r, MISO, i),
        (x, y, r) => nasu(p, x, y, 15, r + 40, MISO),
    ]) }),
    // キャベツと油揚げの味噌汁: 朱の汁椀、ざく切りのキャベツと油揚げ、ねぎ
    cabbagemiso: p => soup(p, Q.wan(p), { c: MISO, miso: true, negiN: 8, items: pl => scatter(pl, 'cbm', 8, 54, 30, [
        (x, y, r, i) => cabbage(p, x, y, 34, r, i),
        (x, y, r, i) => age(p, x, y, 26, 10, r, MISO, i),
        (x, y, r, i) => cabbage(p, x, y, 30, r + 60, i + 7),
    ]) }),

    // かき玉汁: 朱の汁椀、とろみのある澄んだだしに、ふわりと広がる溶き卵、三つ葉
    kakitamajiru: p => soup(p, Q.wan(p), { c: '#e6ca86', glow: .45, rimShade: .22, gl: .7, negiN: 5, items: pl => [
        ...[[-30, -18, 46], [26, -24, 40], [6, 16, 50], [-44, 24, 32], [46, 18, 34]].map(([u, v, s], i) => { const [x, y] = pl(u, v); return [y, () => eggRibbon(p, x, y, s, i)]; }),
        ...[[-8, -4, -20], [34, 36, 160]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y + 6, () => mitsuba(p, x, y, 22, r)]; }),
    ] }),

    // 鮭の粕汁: 焦げ茶の漆、酒粕の白くにごった汁に、鮭・大根とにんじんのいちょう切り・油揚げ・こんにゃく・ねぎ
    kasujiru: p => soup(p, wanDark(p), { c: '#ece0c6', glow: .3, miso: true, cloudOp: .35, negiN: 7, items: pl => scatter(pl, 'ks', 10, 56, 27, [
        (x, y, r, i) => salmon(p, x, y, 22, r, i, '#ece0c6'),
        (x, y, r) => icho(p, x, y, 18, r, '#efe6cc', '#ece0c6'),
        (x, y, r) => icho(p, x, y, 15, r, '#ec7b2d', '#ece0c6'),
        (x, y, r, i) => age(p, x, y, 22, 9, r, '#ece0c6', i),
        (x, y, r, i) => konnyaku(p, x, y, 15, r, '#ece0c6', i),
    ]) }),

    // のっぺい汁: 朱の汁椀、とろみのある醤油色の汁に、鶏肉・里芋・大根とにんじんのいちょう切り・しいたけ・こんにゃく
    noppeijiru: p => soup(p, Q.wan(p), { c: '#d6a866', glow: .4, gl: .65, items: pl => scatter(pl, 'np', 11, 56, 26, [
        (x, y, r, i) => chickenBit(p, x, y, 20, i),
        (x, y, r, i) => satoimo(p, x, y, 22, i, '#b98a4a'),
        (x, y, r) => icho(p, x, y, 18, r, '#efe2c0', '#d6a866'),
        (x, y, r) => icho(p, x, y, 15, r, '#ec7b2d', '#d6a866'),
        (x, y, r, i) => shiitake(p, x, y, 18, i, { sliced: true }),
        (x, y, r, i) => konnyaku(p, x, y, 15, r, '#d6a866', i),
    ]) }),

    // さつま汁: 焦げ茶の漆、味噌汁に鶏肉・大根・にんじん・ごぼう・さつまいもの輪切り、ねぎ、ごま油
    satsumajiru: p => soup(p, wanDark(p), { c: MISO, miso: true, oil: 8, negiN: 8, items: pl => scatter(pl, 'sm', 11, 56, 26, [
        (x, y, r, i) => chickenBit(p, x, y, 20, i),
        (x, y, r) => satsumaimo(p, x, y, 18, r, MISO),
        (x, y, r) => icho(p, x, y, 18, r, '#efe6cc', MISO),
        (x, y, r) => icho(p, x, y, 15, r, '#ec7b2d', MISO),
        (x, y, r, i) => sasagaki(p, x, y, 18, r, i),
    ]) }),

    // 石狩汁: 木の椀、味噌汁に鮭・じゃがいも・玉ねぎ・キャベツ・にんじん・ねぎ、溶けかけのバター
    ishikarijiru: p => soup(p, Q.wan(p, { outer: '#8a5a34', lip: '#a06c40', inner: '#6a3e22' }), { c: MISO, miso: true, negiN: 6, items: pl => [
        ...scatter(pl, 'is', 10, 56, 27, [
            (x, y, r, i) => salmon(p, x, y, 24, r, i, MISO),
            (x, y, r, i) => potatoChunk(p, x, y, 20, r, i, MISO),
            (x, y, r, i) => cabbage(p, x, y, 28, r, i),
            (x, y, r) => onionArc(p, x, y, 26, r),
            (x, y, r) => icho(p, x, y, 15, r, '#ec7b2d', MISO),
        ]),
        (() => { const [x, y] = pl(4, -6); return [y + 40, () => butter(p, x, y - 3, 11)]; })(),
    ] }),

    // 沢煮椀: 焦げ茶の漆、澄んだだしに、豚肉・にんじん・ごぼう・しいたけ・ねぎの細い千切りを沢山、三つ葉
    sawaniwan: p => soup(p, wanDark(p), { c: '#e4c682', glow: .45, rimShade: .22, gl: .7, items: pl => [
        ...scatter(pl, 'sw', 14, 54, 20, [
            (x, y, r, i) => sticks(p, x, y, 26, r, '#e2bca2', i),
            (x, y, r, i) => sticks(p, x, y, 24, r, '#ec7b2d', i),
            (x, y, r, i) => sticks(p, x, y, 24, r, '#9a7450', i),
            (x, y, r, i) => sticks(p, x, y, 22, r, '#7a5030', i),
            (x, y, r, i) => sticks(p, x, y, 26, r, '#f2f0dc', i),
        ]),
        ...[[-4, -2, 20]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y + 30, () => mitsuba(p, x, y - 4, 24, r)]; }),
    ] }),

    // 船場汁: 朱の汁椀、塩味の澄んだ汁に、さばのぶつ切りと大根の短冊、ねぎ
    senbajiru: p => soup(p, Q.wan(p), { c: '#e6d098', glow: .45, rimShade: .22, gl: .7, negiN: 7, items: pl => scatter(pl, 'sb', 8, 54, 32, [
        (x, y, r) => fishChunk(p, x, y, 26, r, '#e6d098'),
        (x, y, r) => tanzaku(p, x, y, 28, 8, r, '#eee6cc', '#e6d098', 2.4, Q.lit(p, '#f6f0dc', .3, .08)),
    ]) }),

    // 呉汁: 朱の汁椀、すりつぶした大豆でつぶつぶの味噌汁に、大根・にんじん・油揚げ・里芋、ねぎ
    gojiru: p => soup(p, Q.wan(p), { c: '#d6b27a', miso: true, cloudOp: .4, negiN: 7, extra: S => speckle(p, S, 120, 1), items: pl => scatter(pl, 'gj', 9, 56, 28, [
        (x, y, r) => icho(p, x, y, 18, r, '#efe6cc', '#d6b27a'),
        (x, y, r) => icho(p, x, y, 15, r, '#ec7b2d', '#d6b27a'),
        (x, y, r, i) => age(p, x, y, 22, 9, r, '#d6b27a', i),
        (x, y, r, i) => satoimo(p, x, y, 21, i),
    ]) }),

    // だんご汁: 焦げ茶の漆、味噌汁に、ちぎった平たいだんご・豚バラ・大根・にんじん・ごぼう・しいたけ、ねぎ
    dangojiru: p => soup(p, wanDark(p), { c: MISO, miso: true, negiN: 6, items: pl => scatter(pl, 'dj', 11, 56, 26, [
        (x, y, r, i) => dango(p, x, y, 30, r, i),
        (x, y, r, i) => porkBara(p, x, y, 34, r, i),
        (x, y, r) => icho(p, x, y, 16, r, '#efe6cc', MISO),
        (x, y, r, i) => dango(p, x, y, 28, r, i + 5),
        (x, y, r) => icho(p, x, y, 14, r, '#ec7b2d', MISO),
        (x, y, r, i) => shiitake(p, x, y, 17, i, { sliced: true }),
        (x, y, r, i) => sasagaki(p, x, y, 16, r, i),
    ]) }),
    // 芋煮（山形）: 土鍋に、醤油味の汁、ごろりとした里芋・牛肉・ちぎったこんにゃく・長ねぎの斜め切り・しめじ
    imoni: p => soup(p, Q.donabe(p), { drop: 10, c: '#c08848', glow: .3, gl: .5, items: pl => scatter(pl, 'im', 12, 60, 26, [
        (x, y, r, i) => satoimo(p, x, y, 26, i, '#a8783a'),
        (x, y, r, i) => beef(p, x, y, 32, r, i),
        (x, y, r, i) => konnyaku(p, x, y, 18, r, '#c08848', i),
        (x, y, r) => negiDiag(p, x, y, 22, r),
        (x, y, r, i) => satoimo(p, x, y, 24, i + 9, '#a8783a'),
        (x, y, r, i) => shimeji(p, x, y, 14, r, i),
    ]) }),

    // お雑煮（関東風）: 朱の汁椀、澄んだすまし汁に、焼いた角餅・鶏肉・小松菜・にんじん・かまぼこ・三つ葉
    zoni: p => soup(p, Q.wan(p), { c: '#e4c682', glow: .45, rimShade: .22, gl: .7, items: pl => [
        ...[[-14, -10, 8], [26, 6, -14]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => mochi(p, x, y, 30, r, '#e4c682')]; }),
        ...[[-44, 18], [40, -30]].map(([u, v], i) => { const [x, y] = pl(u, v); return [y, () => chickenBit(p, x, y, 18, i)]; }),
        ...[[-40, -32, 30, 1], [8, 40, -20, 2]].map(([u, v, r, i]) => { const [x, y] = pl(u, v); return [y - 4, () => Q.leaf(p, x, y, 32, r, '#3d7d2a', 'zk' + i, { wave: 2 })]; }),
        ...[[50, 22]].map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => carrotRound(p, x, y, 16, '#e4c682')]; }),
        ...[[-10, 30, 15]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => kamaboko(p, x, y, 22, r, '#e4c682')]; }),
        ...[[10, -34, 160]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y + 30, () => mitsuba(p, x, y, 22, r)]; }),
    ] }),

    // 中華風卵スープ: 白い鉢、とろみのある鶏がらスープに、溶き卵・わかめ・長ねぎ、ごま油
    tamagosoup: p => soup(p, Q.shiroBowl(p), { c: '#e6c47a', glow: .4, gl: .65, oil: 9, negiN: 8, items: pl => [
        ...[[-30, -16, 44], [24, -26, 38], [8, 14, 48], [-40, 26, 30], [46, 16, 32]].map(([u, v, s], i) => { const [x, y] = pl(u, v); return [y, () => eggRibbon(p, x, y, s, i)]; }),
        ...[[-6, -36, 20, 1], [40, 40, -30, 2]].map(([u, v, r, i]) => { const [x, y] = pl(u, v); return [y - 3, () => Q.leaf(p, x, y, 24, r, '#2f5a2a', 'tw' + i, { wave: 2 })]; }),
    ] }),

    // 玉ねぎのコンソメスープ: 白い鉢、澄んだ琥珀のコンソメに、玉ねぎの薄切り・ベーコン、パセリ
    consomme: p => soup(p, Q.shiroBowl(p), { c: '#c8883a', glow: .45, gl: .7, extra: S => dust(p, S, 26, '#4a9a2c', 1, { r: 1.1, R0: .7 }), items: pl => scatter(pl, 'cs', 12, 56, 24, [
        (x, y, r) => onionArc(p, x, y, 30, r, '#f0dca0'),
        (x, y, r) => onionArc(p, x, y, 26, r + 70, '#f0dca0'),
        (x, y, r) => bacon(p, x, y, 13, r, '#c8883a'),
    ]) }),

    // 韓国風わかめスープ: 白い鉢、ごま油の香る澄んだスープに、たっぷりのわかめ・牛肉・ねぎ・白ごま
    wakamesoup: p => soup(p, Q.shiroBowl(p), { c: '#c89a5a', glow: .35, oil: 12, negiN: 6, extra: S => dust(p, S, 30, '#f6ecd0', 2, { r: 1, sy: .5 }), items: pl => scatter(pl, 'wk', 10, 56, 26, [
        (x, y, r, i) => Q.leaf(p, x, y, 34, r, '#2f5a2a', 'wa' + i, { wave: 2.4 }),
        (x, y, r, i) => beef(p, x, y, 20, r, i, '#7a4a2e'),
        (x, y, r, i) => Q.leaf(p, x, y, 30, r, '#356a2c', 'wb' + i, { wave: 2.4 }),
    ]) }),

    // コーンスープ: 白い鉢、なめらかな黄色のポタージュ（とろみのうねり）、とけたバター、コーンの粒
    cornsoup: p => soup(p, Q.shiroBowl(p), { drop: 8, c: '#f2d06a', glow: .4, rimShade: .26, gl: .5, extra: S => velvet(p, S, '#f2d06a', .45) + `<g ${S.inside}><ellipse cx="${f(S.cx + 4)}" cy="${f(S.cy - 2)}" rx="16" ry="7" fill="#fae48a" opacity=".7" ${Q.blur(p, 1.5)}/></g>`, items: pl => [
        ...scatter(pl, 'cn', 9, 44, 12, [(x, y) => corn(p, x, y, 5)]),
        (() => { const [x, y] = pl(4, -2); return [y, () => butter(p, x, y - 2, 10)]; })(),
    ] }),

    // クラムチャウダー: 白い鉢、牛乳の白いスープに、あさり・じゃがいも・にんじん・玉ねぎ・ベーコン
    clamchowder: p => soup(p, Q.shiroBowl(p), { c: '#f2ead6', glow: .3, rimShade: .28, extra: S => velvet(p, S, '#e8dcc0', .5), items: pl => scatter(pl, 'cc', 11, 58, 27, [
        (x, y, r, i) => shut(p, x, y, 24, r, i),
        (x, y, r, i) => potatoChunk(p, x, y, 22, r, i, '#f2ead6'),
        (x, y, r) => Q.cube(p, x, y, 12, r, '#ec7b2d', { sink: 2, liquid: '#f2ead6' }),
        (x, y, r) => bacon(p, x, y, 15, r, '#f2ead6'),
        (x, y, r) => onionArc(p, x, y, 24, r, '#ece0b8'),
        (x, y, r, i) => potatoChunk(p, x, y, 20, r, i + 7, '#f2ead6'),
    ]) }),

    // 酸辣湯: 白い鉢、とろみのある茶色いスープに、豆腐・しいたけ・たけのこの細切り、溶き卵、ラー油
    sanratan: p => soup(p, Q.shiroBowl(p), { c: '#b8803e', glow: .35, gl: .6, oil: 14, oilC: '#e04a1a', items: pl => [
        ...scatter(pl, 'sr', 12, 56, 22, [
            (x, y, r) => strip(p, x, y, 24, 6, r, '#f6f1e2', '#b8803e', 3),
            (x, y, r) => strip(p, x, y, 22, 4, r, '#7a5030', '#b8803e', 2),
            (x, y, r) => strip(p, x, y, 22, 5, r, '#ecdca8', '#b8803e', 2.4),
        ]),
        ...[[-30, -20, 38], [30, 10, 40], [-6, 34, 30]].map(([u, v, s], i) => { const [x, y] = pl(u, v); return [y - 2, () => eggRibbon(p, x, y, s, i + 3)]; }),
    ] }),

    // トマトと卵のスープ: 白い鉢、鶏がらスープに、くし切りのトマトとふんわり卵、ごま油
    tomatoeggsoup: p => soup(p, Q.shiroBowl(p), { c: '#e8b47a', glow: .4, gl: .6, oil: 8, items: pl => [
        ...scatter(pl, 'te', 6, 50, 32, [(x, y, r) => tomatoW(p, x, y, 26, r, '#e8b47a')]),
        ...[[-34, -6, 40], [30, -30, 34], [12, 30, 42], [44, 20, 28]].map(([u, v, s], i) => { const [x, y] = pl(u, v); return [y, () => eggRibbon(p, x, y, s, i)]; }),
    ] }),

    // かぼちゃのポタージュ: 白い鉢、なめらかな橙のポタージュ（とろみのうねり）、生クリームのうず、こしょう
    kabochapotage: p => soup(p, Q.shiroBowl(p), { drop: 8, c: '#ee9e34', glow: .38, gl: .5, items: () => [], extra: S => velvet(p, S, '#ee9e34', .45) + `<g ${S.inside}>${swirl(S.cx, S.cy - 1, 34, { turns: 1.6, w: 3.4 })}</g>` + dust(p, S, 16, '#6a4a2a', 3, { r: .6, R0: .6 }) }),
    // ポトフ: 白い鉢、澄んだコンソメに、ウインナー・大きなじゃがいも・にんじん・玉ねぎ・キャベツ・ブロッコリー
    potofu: p => soup(p, Q.shiroBowl(p), { drop: 12, c: '#e2bc70', glow: .45, gl: .65, items: pl => [
        [pl(0, -40)[1], () => { const [x, y] = pl(-4, -40); return cabbage(p, x, y, 46, 10, 1) + cabbage(p, x + 14, y + 4, 36, -30, 2); }],
        ...[[-44, -10, 30, 1], [30, 14, 30, 2]].map(([u, v, s, i]) => { const [x, y] = pl(u, v); return [y, () => Q.glossLump(p, x, y - 4, s, 'pf' + i, { c: '#f0d898' })]; }),
        ...[[40, -22, 1], [-24, 24, 2]].map(([u, v, i]) => { const [x, y] = pl(u, v); return [y, () => Q.rangiri(p, x, y - 2, 20, i * 50, '#e97a2a', i)]; }),
        ...[[-8, 2, 20], [16, 40, -30], [-50, 22, 60]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y + 1, () => sausage(p, x, y - 3, 36, r)]; }),
        ...[[52, 34]].map(([u, v]) => { const [x, y] = pl(u, v); return [y, () => onionWedge(p, x, y - 2, 26, -10)]; }),
        ...[[2, -18, 1]].map(([u, v, i]) => { const [x, y] = pl(u, v); return [y, () => broccoli(p, x, y - 4, 22, i)]; }),
    ] }),

    // ワンタンスープ: 白い鉢、澄んだ鶏がらスープに、ワンタン・チンゲン菜・長ねぎ、ごま油
    wantansoup: p => soup(p, Q.shiroBowl(p), { c: '#e4c47e', glow: .45, gl: .7, oil: 10, negiN: 7, items: pl => [
        ...scatter(pl, 'wt', 7, 52, 34, [(x, y, r, i) => wonton(p, x, y, 32, r, i)]),
        ...[[-46, -20, 20, 1], [44, 26, -30, 2]].map(([u, v, r, i]) => { const [x, y] = pl(u, v); return [y - 2, () => Q.leaf(p, x, y, 32, r, '#4a8a34', 'cg' + i, { wave: 2 }) + `<g ${T(x + 8, y + 2, r)}><g transform="scale(1 ${SY})"><path d="M0,0 L14,2" stroke="#d8ecc0" stroke-width="7" stroke-linecap="round"/></g></g>`]; }),
    ] }),

    // 春雨スープ: 白い鉢、鶏がらスープに、春雨・しいたけ・にんじんの細切り・溶き卵・万能ねぎ
    harusamesoup: p => soup(p, Q.shiroBowl(p), { c: '#e2b878', glow: .45, gl: .65, oil: 6, negiN: 8, items: pl => [
        ...[[-20, -16, 1], [24, 10, 2], [-10, 30, 3]].map(([u, v, i]) => { const [x, y] = pl(u, v); return [y - 6, () => harusame(p, x, y, 60, i)]; }),
        ...scatter(pl, 'hs', 8, 54, 26, [
            (x, y, r, i) => shiitake(p, x, y, 20, i, { sliced: true }),
            (x, y, r, i) => sticks(p, x, y, 22, r, '#ec7b2d', i, 2),
        ]),
        ...[[34, -30, 30], [-44, 18, 28]].map(([u, v, s], i) => { const [x, y] = pl(u, v); return [y, () => eggRibbon(p, x, y, s, i)]; }),
    ] }),

    // キムチチゲ: 石鍋（焦げ茶の石）に、赤いスープ、白菜キムチ・豚バラ・豆腐・玉ねぎ・長ねぎ・えのき
    kimchichige: p => soup(p, Q.donabe(p, { stone: true }), { drop: 10, c: '#d0482a', glow: .3, gl: .5, oil: 12, oilC: '#f07a3a', items: pl => scatter(pl, 'kj', 12, 60, 26, [
        (x, y, r, i) => kimchi(p, x, y, 34, r, i),
        (x, y, r) => tofu(p, x, y, 22, r, '#d0482a'),
        (x, y, r, i) => porkBara(p, x, y, 36, r, i),
        (x, y, r) => negiDiag(p, x, y, 22, r),
        (x, y, r) => onionArc(p, x, y, 26, r, '#f0dcc0'),
        (x, y, r) => enoki(p, x, y, 28, r),
    ]) }),

    // スンドゥブチゲ: 石鍋に、赤いスープ、すくった絹ごし豆腐・あさり・豚バラ・キムチ・長ねぎ、まん中に落とした卵
    sundubu: p => soup(p, Q.donabe(p, { stone: true }), { drop: 10, c: '#d4502c', glow: .3, gl: .5, oil: 12, oilC: '#f07a3a', items: pl => [
        ...scatter(pl, 'sd', 10, 60, 28, [
            (x, y, r, i) => softTofu(p, x, y, 32, i),
            (x, y, r, i) => shut(p, x, y, 24, r, i),
            (x, y, r, i) => porkBara(p, x, y, 32, r, i),
            (x, y, r, i) => kimchi(p, x, y, 28, r, i),
            (x, y, r) => negiDiag(p, x, y, 20, r),
        ]).filter(([y], i) => i !== 0),
        (() => { const [x, y] = pl(0, 0); return [y + 20, () => yolkEgg(p, x, y, 22)]; })(),
    ] }),

    // トムヤムクン: 白い鉢、赤みの橙のスープ（ペーストの油）に、えび・しめじ・トマト・パクチー
    tomyumkung: p => soup(p, Q.shiroBowl(p), { c: '#c4501e', glow: .3, gl: .55, oil: 16, oilC: '#f4a040', items: pl => [
        ...[[-30, -14, 1, 10], [28, -26, -1, -10], [4, 26, 1, -6], [44, 22, -1, 14]].map(([u, v, fl, r]) => { const [x, y] = pl(u, v); return [y, () => Q.prawn3q(p, x, y, 40, r, fl)]; }),
        ...[[-46, 22, 0, 1], [-4, -38, 20, 2]].map(([u, v, r, i]) => { const [x, y] = pl(u, v); return [y, () => shimeji(p, x, y, 16, r, i)]; }),
        ...[[52, -6, 30], [-20, 42, -20]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y, () => tomatoW(p, x, y, 22, r, '#e2662a')]; }),
        ...[[-10, 4, 20], [20, 2, -40]].map(([u, v, r]) => { const [x, y] = pl(u, v); return [y + 20, () => coriander(p, x, y, 14, r)]; }),
    ] }),

    // ミネストローネ: 白い鉢、トマトの赤いスープに、玉ねぎ・にんじん・キャベツ・ベーコンの小さな角切り、オリーブオイル
    minestrone: p => soup(p, Q.shiroBowl(p), { c: '#d4502e', glow: .3, gl: .55, oil: 8, oilC: '#e8c040', items: pl => scatter(pl, 'mn', 22, 60, 17, [
        (x, y, r) => Q.cube(p, x, y, 10, r, '#ec7b2d', { sink: 2, liquid: '#d4502e' }),
        (x, y, r) => Q.cube(p, x, y, 10, r, '#f2ead0', { sink: 2, liquid: '#d4502e' }),
        (x, y, r, i) => Q.leaf(p, x, y, 16, r, '#a8cc70', 'mc' + i, { wave: 1 }),
        (x, y, r) => bacon(p, x, y, 11, r, '#d4502e'),
    ]) }),

    // クリームシチュー: 白い鉢、とろりとしたクリームに、鶏肉・じゃがいも・にんじん・玉ねぎ・ブロッコリー
    stew: p => soup(p, Q.shiroBowl(p), { drop: 10, c: '#f4ecd6', glow: .3, rimShade: .3, extra: S => velvet(p, S, '#e6dac0', .55), items: pl => scatter(pl, 'sw', 10, 58, 28, [
        (x, y, r, i) => chickenBit(p, x, y - 2, 24, i, '#ecc898'),
        (x, y, r, i) => Q.glossLump(p, x, y - 3, 24, 'stp' + i, { c: '#f0d898' }),
        (x, y, r, i) => Q.rangiri(p, x, y - 2, 18, r, '#e97a2a', i),
        (x, y, r, i) => broccoli(p, x, y - 4, 22, i),
        (x, y, r) => onionArc(p, x, y, 24, r, '#f4ecd0'),
    ]) }),

    // ビーフシチュー: 白い鉢、照りのある焦げ茶のデミグラスに、牛肉のかたまり・じゃがいも・にんじん・マッシュルーム
    beefstew: p => soup(p, Q.shiroBowl(p), { drop: 10, c: '#7a3a1c', glow: .3, rimShade: .3, gl: .7, extra: S => velvet(p, S, '#7a3a1c', .5), items: pl => [
        ...scatter(pl, 'bs', 10, 58, 28, [
            (x, y, r, i) => soakLump(p, x, y - 3, 28, 'bb' + i, { c: '#8a4a2a', soak: '#5a2a14', k: .5, hi: .8 }),
            (x, y, r, i) => Q.glossLump(p, x, y - 3, 24, 'bsp' + i, { c: '#ecc77c' }),
            (x, y, r, i) => Q.rangiri(p, x, y - 2, 20, r, '#e97a2a', i),
            (x, y, r) => mushroom(p, x, y - 3, 18, r),
            (x, y, r, i) => soakLump(p, x, y - 3, 26, 'bc' + i, { c: '#8a4a2a', soak: '#5a2a14', k: .5, hi: .8 }),
        ]),
        [200, () => shine(84, 92, 18, -6) + shine(118, 106, 14, -4, .7)],
    ] }),

    // 茶碗蒸し: 白い蒸し茶碗、なめらかな卵の面に、えび・しいたけ・鶏肉・三つ葉
    chawanmushi: p => {
        const V = Q.shiroBowl(p, { cy: 70, rx: 74, h: 74, fx: 34, belly: .9 });
        const S = Q.surface(p, V, { drop: 9, c: '#f6e4a2', glow: .45, rimShade: .26 });
        const pl = (u, v) => at(S.o, u, v);
        const it = [
            (() => { const [x, y] = pl(-14, -6); return [y, () => Q.prawn3q(p, x, y, 30, -8, 1)]; })(),
            (() => { const [x, y] = pl(22, -16); return [y, () => shiitake(p, x, y, 22, 1)]; })(),
            (() => { const [x, y] = pl(-34, 18); return [y, () => chickenBit(p, x, y, 16, 1)]; })(),
            (() => { const [x, y] = pl(18, 18); return [y + 10, () => mitsuba(p, x, y, 22, -30)]; })(),
        ];
        return V.s + S.s + glint(p, S, .7) + `<g ${V.inside}>${byDepth(it)}</g>` + Q.depthVeil(p, V, V.cy - V.iry, V.cy + V.iry) + V.shine(.6);
    },
    // 肉じゃが（オーナー採用の試作を基準に）: 焦げ茶の深鉢、少ない煮汁に、じゃがいもを高く積み、豚肉・にんじん・玉ねぎ・しらたき
    nikujaga: p => nimono(p, Q.hachi(p), { c: '#b9853f', H: 34, items: pl => lay(pl, [
        ['shira', -52, -30], ['pot', -30, -56, 42], ['pot', 34, -52, 42], ['car', 6, -66, 24, 10], ['pork', 2, -34, 62, -12], ['oni', 66, -18, 30, 20],
        ['oni', -68, 6, 28, -15], ['car', -28, -12, 26, -30], ['pot', 6, -6, 48], ['pork', 50, 14, 54, 24], ['pot', -48, 30, 40], ['car', 44, 42, 24, 40],
        ['pot', 10, 40, 40], ['oni', -16, 58, 28, 8], ['pork', -60, 50, 44, -20], ['car', 64, 46, 22, 70],
    ], {
        shira: (x, y) => shirataki(p, x, y, 42, 1),
        pot: (x, y, s, i) => Q.glossLump(p, x, y, s, 'nj' + i),
        car: (x, y, s, r, i) => Q.rangiri(p, x, y, s, r, '#e97a2a', i),
        pork: (x, y, s, r, i) => slice3q(p, x, y, s, r, { c: '#a87250', fat: '#e8cfa2', char: false, seed: i, gloss: .55 }, { th: 2.2, tc: '#6a4026' }),
        oni: (x, y, s, r) => onionWedge(p, x, y, s, r, '#e3c07e'),
    }), after: '' }),

    // 筑前煮: 深鉢に、照りのある鶏肉・れんこん・ごぼう・にんじん・こんにゃく・しいたけを高く盛る
    chikuzen: p => nimono(p, Q.hachi(p), { c: '#a8783a', H: 34, items: pl => lay(pl, [
        ['ren', -42, -52, 34], ['ck', 10, -60, 34], ['shi', 52, -40, 30], ['kon', -68, -12, 26, 20], ['car', -16, -30, 28, 30], ['gob', 30, -16, 28, 60],
        ['ck', -40, 6, 36], ['ren', 62, 10, 32], ['shi', -2, 12, 30], ['car', 34, 36, 26, -20], ['gob', -56, 40, 26, -30], ['kon', 64, 46, 24, 70],
        ['ck', -10, 46, 34], ['ren', 20, 62, 28], ['car', -36, 62, 24, 60],
    ], {
        ren: (x, y, s) => renkon(p, x, y - 2, s, '#dcb880'),
        ck: (x, y, s, i) => soakLump(p, x, y, s, 'cz' + i, { c: '#c88a4a', soak: '#8a5020', k: .45, sy: .72, hi: .75 }),
        shi: (x, y, s, i) => shiitake(p, x, y, s, i),
        kon: (x, y, s, r, i) => konnyaku(p, x, y, s, r, null, i),
        car: (x, y, s, r, i) => Q.rangiri(p, x, y, s, r, '#e46a24', i),
        gob: (x, y, s, r, i) => goboRan(p, x, y, s, r, i),
    }), after: shine(90, 66, 12, -6, .7) }),

    // ぶり大根: 深鉢に、飴色に煮えた大根の厚い輪切りと、照りのあるぶり、生姜の千切り
    buridaikon: p => nimono(p, Q.hachi(p), { c: '#9a6230', H: 26, items: pl => lay(pl, [
        ['dai', -42, -46], ['buri', 24, -48, 56, -10], ['dai', 54, 4], ['buri', -36, 10, 56, 14], ['dai', 6, 40], ['buri', 50, 50, 46, -20], ['dai', -50, 52], ['gin', 6, -10],
    ], {
        dai: (x, y) => cyl(p, x, y - 2, 26, 14, '#c89050', null, { top: Q.rg(p, [[0, '#f2d49a'], [.6, '#dca866'], [1, '#b07a3a']], .4, .36, .7) }) + shine(x - 6, y - 14, 14, -6, .7),
        buri: (x, y, s, r) => fishSimmered(p, x, y, s, r, { skin: '#6a5650', flesh: '#9a5a30' }),
        gin: (x, y) => gingerShreds(p, x, y - 12, 26),
    }) }),

    // 豚バラ大根: 深鉢に、半月の大根（飴色）と豚バラ、生姜の千切り
    butadaikon: p => nimono(p, Q.hachi(p), { c: '#a87a40', H: 30, items: pl => lay(pl, [
        ['dai', -40, -50, 20], ['pork', 18, -56, 58, 10], ['dai', 44, -22, -30], ['dai', -56, 2, 50], ['pork', -6, -16, 62, -16], ['dai', 12, 22, 80],
        ['pork', 54, 30, 52, 20], ['dai', -26, 46, -10], ['pork', -54, 50, 46, 30], ['dai', 30, 58, 40], ['gin', 0, 0],
    ], {
        dai: (x, y, r) => hangetsu(p, x, y - 3, 28, r, '#d8a860', null, { h: 11, top: Q.rg(p, [[0, '#f4dca8'], [.6, '#e0b070'], [1, '#b8803e']], .4, .4, .7) }),
        pork: (x, y, s, r, i) => slice3q(p, x, y, s, r, { c: '#a87250', fat: '#ecd4a8', char: false, seed: i, gloss: .6 }, { th: 2, tc: '#6a4026' }),
        gin: (x, y) => gingerShreds(p, x, y - 14, 24),
    }) }),

    // 豚の角煮: 深鉢に、赤身と脂の層の見える角煮を積み、煮汁で染まったゆで卵の半分
    kakuni: p => nimono(p, Q.hachi(p), { c: '#7a4018', H: 24, items: pl => lay(pl, [
        ['ku', -32, -42, 40, 10], ['ku', 32, -38, 38, -14], ['egg', -62, 8], ['ku', 0, 2, 42, 4], ['egg', 60, 14], ['ku', -32, 44, 38, 18], ['ku', 32, 46, 38, -8],
    ], {
        ku: (x, y, s, r) => kakuniCube(p, x, y, s, r),
        egg: (x, y) => eggHalf(p, x, y - 4, 34, '#b07038'),
    }) }),

    // 牛肉とごぼうのしぐれ煮: 深鉢に、照りの濃い牛肉とささがきごぼうを山に、生姜の千切り
    shigureni: p => nimono(p, Q.hachi(p), { c: '#6a3818', drop: 16, H: 40, R: 74, items: pl => [
        ...lay(pl, Array.from({ length: 18 }, (_, i) => { const a = i * 2.4, d = 10 + (i % 4) * 17; return ['beef', Math.cos(a) * d, Math.sin(a) * d, 46, i * 37]; }), { beef: (x, y, s, r, i) => beef(p, x, y, s, r, i, '#6e3a1e') }),
        ...lay(pl, Array.from({ length: 8 }, (_, i) => { const a = i * 2.1 + 1, d = 10 + (i % 3) * 18; return ['gob', Math.cos(a) * d, Math.sin(a) * d, 20, i * 50]; }), { gob: (x, y, s, r, i) => sasagaki(p, x, y, s, r, i) }),
        [999, () => { const [x, y] = pl(0, -6, 4); return gingerShreds(p, x, y, 26) + shine(x - 20, y + 4, 14, -8) + shine(x + 18, y + 14, 12, -4, .7); }],
    ] }),

    // 肉豆腐: 深鉢に、煮汁が染みた木綿豆腐の大きな角、牛肉・長ねぎ・しらたき
    nikudofu: p => nimono(p, Q.hachi(p), { c: '#a8743a', H: 20, items: pl => lay(pl, [
        ['shira', -50, -44], ['tofu', -14, -44, 34, 10], ['tofu', 36, -18, 34, -12], ['beef', 54, -50, 44, 20], ['negi', -60, 4, 32, 30],
        ['tofu', -32, 12, 34, 6], ['beef', 6, 34, 50, -10], ['negi', 50, 40, 30, -20], ['beef', -50, 50, 40, 30],
    ], {
        shira: (x, y) => shirataki(p, x, y, 40, 2),
        tofu: (x, y, s, r) => Q.cube(p, x, y, s, r, '#e8cc98', { top: Q.rg(p, [[0, '#f8e8c4'], [.6, '#e6c48a'], [1, '#c89858']], .4, .36, .75) }),
        beef: (x, y, s, r, i) => beef(p, x, y, s, r, i),
        negi: (x, y, s, r) => negiDiag(p, x, y, s, r, '#e8dcb0'),
    }), after: '' }),

    // いかと里芋の煮物: 深鉢に、照りのある里芋と、いかの輪切り・胴
    ikasatoimo: p => nimono(p, Q.hachi(p), { c: '#a87a40', H: 32, items: pl => lay(pl, [
        ['imo', -36, -50, 38], ['ika', 28, -56, 32], ['imo', 42, -16, 40], ['ika', -60, -4, 30], ['imo', -6, -10, 42], ['ika', 14, 30, 32], ['imo', -40, 36, 38], ['ika', 58, 32, 28], ['imo', 30, 58, 34], ['ika', -14, 62, 28],
    ], {
        imo: (x, y, s, i) => satoimo(p, x, y, s, i, '#a8783a'),
        ika: (x, y, s) => squidRing3(p, x, y - 2, s, '#e6c49a'),
    }) }),

    // 手羽元のさっぱり煮: 深鉢に、照りのある手羽元と、酢で煮て茶に染まったゆで卵
    tebasappari: p => nimono(p, Q.hachi(p), { c: '#9a6a34', H: 26, items: pl => lay(pl, [
        ['dr', -26, -50, 60, 20], ['dr', 34, -40, 58, -30], ['egg', -62, 0], ['dr', -6, -6, 62, 10], ['dr', 46, 14, 56, -60], ['egg', 14, 44], ['dr', -40, 36, 56, 40], ['dr', 50, 54, 50, 10],
    ], {
        dr: (x, y, s, r) => drumstick(p, x, y - 3, s, r),
        egg: (x, y) => eggHalf(p, x, y - 4, 34, '#b88040'),
    }) }),

    // 厚揚げのそぼろあんかけ: 青磁の小鉢に、厚揚げ、とろりとしたあんと鶏そぼろ、ねぎ
    atsuagesoboro: p => nimono(p, Q.kobachi(p), { c: '#d4a458', drop: 10, H: 10, items: pl => [
        ...lay(pl, [['ag', -28, -30, 10], ['ag', 28, -24, -12], ['ag', -30, 22, 6], ['ag', 30, 28, -8]], {
            ag: (x, y, r) => Q.prism(p, x, y, rect(46, 36), 18, '#c88a3a', { rot: r, top: Q.lit(p, '#f2e4c4', .3, .1) }) + `<path d="M${f(x - 14)},${f(y - 16 * CZ - 1)} l28,-2" stroke="#d8a050" stroke-width="2.4" opacity=".5"/>`,
        }),
        [999, () => { const [x, y] = pl(0, 0, 14); return ankake(p, x, y, 50, 1) + mince(p, x, y, 40, 40, 1) + Array.from({ length: 6 }, (_, i) => Q.negi(p, x - 30 + i * 12, y - 4 + (i % 2) * 8, 6.4)).join(''); }],
    ] }),
};

// えのき（細い白い軸の束と小さなかさ）
function enoki(p, x, y, L, rot){
    let o = '';
    for (let i = 0; i < 6; i++){ const dy = (i - 2.5) * 1.6; o += `<path d="M${f(-L / 2)},${f(dy)} Q0,${f(dy - 1.4)} ${f(L / 2)},${f(dy * .6)}" stroke="#d8d0b8" stroke-width="1.9" fill="none" stroke-linecap="round"/><path d="M${f(-L / 2)},${f(dy)} Q0,${f(dy - 1.4)} ${f(L / 2)},${f(dy * .6)}" stroke="#fbf8ee" stroke-width="1.1" fill="none" stroke-linecap="round"/><circle cx="${f(L / 2 + 1)}" cy="${f(dy * .6)}" r="1.5" fill="#efe4c8" stroke="#c8b890" stroke-width=".4"/>`; }
    return `<g ${T(x, y, rot)}><g transform="scale(1 ${f(SY * 1.2)})">${o}</g></g>`;
}
