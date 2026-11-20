// 白石 凪 担当（斜め上35度）: 主菜の焼き物・ごはん・麺 77品
// 基準: docs/illustration_3q.md。材料は gohancho/index.html の R(...) 行どおり（「?」はお好みで）
import * as Q from '../kit3q.mjs';
const { f, rng, lt, dk, mix, T, SY, CZ, SHADE } = Q;

// =========================================================
// 共通の小道具
// =========================================================
// 面の上に重ならないよう点を散らす（u, v は面の座標）
function scatter(seed, n, rx, minD, { ry = rx, ex = [], exD = 0, cu = 0, cv = 0 } = {}){
    const R = rng('sc' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.283, d = Math.sqrt(R()), u = cu + Math.cos(a) * d * rx, v = cv + Math.sin(a) * d * ry;
        if (out.every(([x, y]) => Math.hypot(x - u, y - v) >= minD) && ex.every(([x, y]) => Math.hypot(x - u, y - v) >= exD)) out.push([u, v, R()]);
    }
    return out;
}
const P = (o, u, v, z = 0) => Q.at(o, u, v, z);
// 平らに広がるソース・たれ（面に置いた形を縦につぶす）
function pool(p, x, y, rx, c, seed, { op = .9, rz = rx * .7, gloss = true } = {}){
    const d = Q.blob(x, y, rx, rz * SY, 'pl' + seed, { n: 10, jit: .25 });
    return `<path d="${d}" fill="${Q.rg(p, [[0, lt(c, .25)], [.6, c], [1, dk(c, .25)]], .4, .35, .7)}" opacity="${op}"/>` +
        (gloss ? `<path d="M${f(x - rx * .55)},${f(y - rz * SY * .25)} Q${f(x - rx * .2)},${f(y - rz * SY * .6)} ${f(x + rx * .2)},${f(y - rz * SY * .55)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/>` : '');
}
// 照りの白い弧（kit の shine の短い版）
const gl = (x, y, w, r = -8, op = .75) => Q.shine(x, y, w, r, op);

// ---------- 肉 ----------
// 薄切り肉（焼き色・脂の縁・照り）
function meatSlice(p, x, y, w, rot, seed, { c = '#a85a28', fat = '#efd3a0', depth = 1.8, char = true, shineOp = .7 } = {}){
    const sl = Q.slab(p, x, y, w / 2, w * .22, depth, c, 'ms' + seed, { n: 15, jit: .3, rot });
    const R = rng('msc' + seed);
    let inner = `<path d="${Q.blob(x - 2, y - w * .14, w / 2, w * .07, 'msf' + seed, { rot, jit: .5, n: 12 })}" fill="${fat}" opacity=".8"/>`;
    if (char) for (let k = 0; k < 4; k++) inner += `<path d="${Q.blob(x - w * .32 + R() * w * .64, y - 4 + R() * 9, 3.6 + R() * 3, 1.8 + R() * 1.4, 'msk' + seed + k)}" fill="${dk(c, .5)}" opacity=".32"/>`;
    return sl.s + `<g ${Q.clip(p, sl.d)}>${inner}</g>` + gl(x - w * .16, y - 3, w * .32, rot - 6, shineOp);
}
// 厚みのある肉・魚の塊（鶏もも・ハンバーグ・切り身）。top は上の面の色、side は側面の色
function chunk(p, x, y, rx, rz, hgt, top, side, seed, { rot = 0, jit = .14, n = 12, dome = .5 } = {}){
    const d = Q.blob(x, y, rx, rz * SY, 'ck' + seed, { n, jit, rot });
    const steps = Math.max(3, Math.round(hgt * CZ / 1.1));
    let s = Q.dropOf(p, d, 2.4, hgt * CZ * .5 + 2.6, .36, 2);
    for (let i = steps; i >= 1; i--) s += `<path d="${d}" transform="translate(0 ${f(-hgt * CZ * (1 - i / steps))})" fill="${mix(dk(side, .3), side, 1 - i / steps)}"/>`;
    const td = Q.blob(x, y - hgt * CZ, rx, rz * SY, 'ck' + seed, { n, jit, rot });
    s += `<path d="${td}" fill="${Q.rg(p, [[0, lt(top, .3 * dome + .1)], [.6, top], [1, dk(top, .2)]], .36, .3, .8)}" stroke="${dk(side, .4)}" stroke-width=".7"/>`;
    return { s, d: td, y: y - hgt * CZ };
}
// 焼き目の線（網目・すじ）
const grillLines = (x, y, w, rot, c = '#5e2c12', n = 3, op = .45) => `<g ${T(x, y, rot)}>${Array.from({ length: n }, (_, i) => `<path d="M${f(-w / 2 + (i + .5) * w / n - 4)},${f(-w * .12)} l8,${f(w * .24)}" stroke="${c}" stroke-width="2.2" stroke-linecap="round" opacity="${op}"/>`).join('')}</g>`;

// ---------- 魚 ----------
// 切り身（皮の縁・身・焼き色）。面で w × d、皮は奥側
function fillet(p, x, y, w, d, rot, seed, { flesh = '#f0b48a', skin = '#868884', hgt = 9, char = .35, glaze = null } = {}){
    const ck = chunk(p, x, y, w / 2, d / 2, hgt, glaze || flesh, dk(flesh, .12), 'fl' + seed, { rot, jit: .1, n: 14 });
    let s = ck.s;
    s += `<g ${Q.clip(p, ck.d)}><path d="${Q.blob(x, ck.y - d * SY * .5, w * .55, d * SY * .22, 'fls' + seed, { rot, jit: .2 })}" fill="${skin}"/><path d="${Q.blob(x, ck.y - d * SY * .5, w * .5, d * SY * .12, 'fls2' + seed, { rot, jit: .3 })}" fill="${lt(skin, .35)}" opacity=".7"/>`;
    if (!glaze) for (let i = 0; i < 4; i++) s += `<path d="M${f(x - w * .35 + i * w * .2)},${f(ck.y - d * SY * .25)} q4,${f(d * SY * .25)} 0,${f(d * SY * .5)}" stroke="${lt(flesh, .35)}" stroke-width="1.6" fill="none" opacity=".75"/>`;
    s += `<path d="${ck.d}" fill="${dk(glaze || flesh, .45)}" opacity="${char * .35}"/></g>`;
    return s + gl(x - w * .15, ck.y - 1, w * .3, rot - 6, .7);
}
// 1尾の魚（さんま・あじの開きは open）
function wholeFish(p, x, y, L, rot, seed, { skin = '#727670', belly = '#e8e2d4', char = .5, open = false, hgt = 7 } = {}){
    const w = open ? L * .26 : L * .09;
    const pts = [];
    for (let i = 0; i <= 12; i++){ const t = i / 12, u = -L / 2 + t * L * .86, hw = w * Math.sin(Math.min(1, t * 1.25) * Math.PI) ** .7 * (t < .1 ? .8 : 1); pts.push([u, -hw]); }
    for (let i = 12; i >= 0; i--){ const t = i / 12, u = -L / 2 + t * L * .86, hw = w * Math.sin(Math.min(1, t * 1.25) * Math.PI) ** .7; pts.push([u, hw]); }
    const body = Q.smooth(pts, true, .8), tail = `M${f(L * .34)},0 L${f(L / 2)},${f(-w * 1.1)} L${f(L * .46)},0 L${f(L / 2)},${f(w * 1.1)}Z`;
    const g = inner => `<g transform="translate(${f(x)} ${f(y)}) scale(1 ${SY}) rotate(${rot})">${inner}</g>`;
    let s = `<g transform="translate(2.4 ${f(hgt * CZ * .5 + 2.6)})">${g(`<path d="${body}" fill="${SHADE}" opacity=".32"/><path d="${tail}" fill="${SHADE}" opacity=".25"/>`)}</g>`;
    s = `<g ${Q.blur(p, 1.8)}>${s}</g>`;
    s += g(`<path d="${tail}" fill="${dk(skin, .2)}" stroke="${dk(skin, .45)}" stroke-width=".6"/>`);
    for (let i = 3; i >= 1; i--) s += `<g transform="translate(0 ${f(-hgt * CZ * (1 - i / 3))})">${g(`<path d="${body}" fill="${dk(open ? '#c9a070' : skin, .3 * i / 3)}"/>`)}</g>`;
    const top = open
        ? `<path d="${body}" fill="${Q.lg(p, [[0, '#f1d6a6'], [.5, '#dcae72'], [1, '#b8844a']], 0, 0, 1, 1)}" stroke="#8a5a2a" stroke-width=".8"/><path d="M${f(-L * .4)},0 L${f(L * .32)},0" stroke="#c9905a" stroke-width="2.4"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${f(-L * .34 + i * L * .08)},${f(-w * .8)} L${f(-L * .34 + i * L * .08 + 3)},${f(w * .8)}" stroke="#b8824a" stroke-width=".8" opacity=".6"/>`).join('')}`
        : `<path d="${body}" fill="${Q.lg(p, [[0, lt(skin, .25)], [.45, skin], [.62, belly], [1, dk(belly, .1)]], 0, 0, 0, 1)}" stroke="${dk(skin, .45)}" stroke-width=".8"/><path d="M${f(-L * .36)},${f(-w * .1)} L${f(L * .34)},${f(-w * .1)}" stroke="${lt(skin, .5)}" stroke-width="1" opacity=".7"/>`;
    s += `<g transform="translate(0 ${f(-hgt * CZ)})">${g(top + (open ? '' : `<circle cx="${f(-L * .42)}" cy="${f(-w * .2)}" r="${f(w * .32)}" fill="#f4efe2" stroke="#6a5a4a" stroke-width=".6"/><circle cx="${f(-L * .42)}" cy="${f(-w * .2)}" r="${f(w * .16)}" fill="#3a2414"/>`) +
        Array.from({ length: 4 }, (_, i) => `<path d="M${f(-L * .2 + i * L * .13)},${f(-w * .9)} l4,${f(w * 1.6)}" stroke="#4a2a14" stroke-width="2.6" stroke-linecap="round" opacity="${char * .7}"/>`).join(''))}</g>`;
    return s;
}

// ---------- 野菜・きのこ ----------
function broccoli(p, x, y, s, seed){
    const R = rng('br' + seed);
    let o = Q.cast(p, x, y + s * .25, s * .5, s * .2, .3) + `<path d="M${f(x - 2)},${f(y + s * .1)} l1,${f(s * .3)} l3,0 l1,${f(-s * .3)}Z" fill="#9cc46a"/>`;
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.283 + R(), d = i ? s * .26 : 0; const cx = x + Math.cos(a) * d, cy = y - s * .12 + Math.sin(a) * d * .6; o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * .2)}" fill="${Q.dome(p, '#3f8a34')}" stroke="#2a5e22" stroke-width=".5"/>`; }
    return o + `<circle cx="${f(x - s * .15)}" cy="${f(y - s * .3)}" r="${f(s * .07)}" fill="#a8d870" opacity=".8"/>`;
}
// しめじ（小さな株）
function shimeji(p, x, y, s, rot = 0, n = 3, seed = 1){
    const R = rng('sj' + seed);
    let o = `<g ${T(x, y, rot)}>`;
    for (let i = 0; i < n; i++){ const dx = (i - (n - 1) / 2) * s * .32, L = s * (.45 + R() * .2); o += `<path d="M${f(dx)},${f(s * .1)} q${f(-dx * .2)},${f(-L / 2)} 0,${f(-L)}" stroke="#d8ccb4" stroke-width="${f(s * .13)}" stroke-linecap="round" fill="none"/><path d="M${f(dx)},${f(s * .1)} q${f(-dx * .2)},${f(-L / 2)} 0,${f(-L)}" stroke="#f4eee0" stroke-width="${f(s * .07)}" stroke-linecap="round" fill="none"/><ellipse cx="${f(dx)}" cy="${f(-L)}" rx="${f(s * .17)}" ry="${f(s * .12)}" fill="${Q.dome(p, '#8a6a4c')}" stroke="#5a4028" stroke-width=".5"/>`; }
    return Q.cast(p, x, y + s * .12, s * .4, s * .12, .25) + o + '</g>';
}
// しいたけ（かさを上から斜めに。十字の飾り切りは cross）
const shiitake = (p, x, y, s, cross = false) => Q.cast(p, x, y + s * .2, s * .5, s * .18, .3) + `<ellipse cx="${f(x)}" cy="${f(y + s * .06)}" rx="${f(s / 2)}" ry="${f(s * .3)}" fill="#5a3a22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s / 2)}" ry="${f(s * .3)}" fill="${Q.dome(p, '#8a5a34')}" stroke="#4e3018" stroke-width=".6"/>${cross ? `<path d="M${f(x - s * .22)},${f(y)} L${f(x + s * .22)},${f(y)} M${f(x)},${f(y - s * .14)} L${f(x)},${f(y + s * .14)}" stroke="#f0dcc0" stroke-width="1.6"/>` : ''}`;
// 玉ねぎの薄切り（あめ色の弧）
const onionStrip = (x, y, L, r, c = '#e0b46a') => `<g ${T(x, y, r)}><path d="M${-L / 2},2 Q0,-4 ${L / 2},2" stroke="${dk(c, .35)}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M${-L / 2},2 Q0,-4 ${L / 2},2" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${-L * .3},.3 Q0,-2.2 ${L * .2},-.5" stroke="#fff6dc" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
// ピーマン・パプリカの切り片
const pepperBit = (p, x, y, s, rot, c = '#3f8f2f') => Q.prism(p, x, y, [[-s / 2, -s * .16], [s / 2, -s * .16], [s / 2, s * .16], [-s / 2, s * .16]], 2.4, c, { rot, line: .45 });
// にんじんの細切り・短冊
const carrotStick = (p, x, y, s, rot) => Q.prism(p, x, y, [[-s / 2, -s * .12], [s / 2, -s * .12], [s / 2, s * .12], [-s / 2, s * .12]], s * .18, '#ec7b2d', { rot, line: .45 });
// レモン・すだちのくし切り
function citrus(p, x, y, s, rot = 0, { c = '#f6d23a', half = false } = {}){
    const k = s / 30;
    if (half) return Q.cast(p, x, y + s * .12, s * .5, s * .2, .3) + `<ellipse cx="${f(x)}" cy="${f(y + s * .05)}" rx="${f(s / 2)}" ry="${f(s * .3)}" fill="${dk(c, .25)}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s / 2)}" ry="${f(s * .3)}" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".6"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * .42)}" ry="${f(s * .24)}" fill="${lt(c, .55)}"/>${[0, 60, 120].map(a => `<path d="M${f(x - Math.cos(a / 57.3) * s * .4)},${f(y - Math.sin(a / 57.3) * s * .22)} L${f(x + Math.cos(a / 57.3) * s * .4)},${f(y + Math.sin(a / 57.3) * s * .22)}" stroke="${lt(c, .2)}" stroke-width=".7"/>`).join('')}`;
    return Q.cast(p, x + 2, y + 5 * k, 15 * k, 4 * k, .32) + `<g ${T(x, y, rot, k)}><path d="M-15,0 Q0,13 15,0 Q0,7 -15,0Z" fill="${dk(c, .2)}" stroke="${dk(c, .45)}" stroke-width=".7"/><path d="M-15,0 A15,7 0 0 1 15,0 Q0,7 -15,0Z" fill="${lt(c, .7)}" stroke="${dk(c, .1)}" stroke-width=".7"/><path d="M-12.6,.4 A12.6,5.4 0 0 1 12.6,.4 Q0,5.4 -12.6,.4Z" fill="${lt(c, .3)}"/><path d="M0,3.6 L-9,-3 M0,3.6 L-3.4,-5 M0,3.6 L3.4,-5 M0,3.6 L9,-3" stroke="${lt(c, .7)}" stroke-width="1" fill="none"/></g>`;
}
// 大根おろし（白い小山）
function oroshi(p, x, y, s, seed = 1){
    const d = `M${f(x - s / 2)},${f(y)} Q${f(x - s * .4)},${f(y - s * .55)} ${f(x)},${f(y - s * .6)} Q${f(x + s * .4)},${f(y - s * .55)} ${f(x + s / 2)},${f(y)} Q${f(x)},${f(y + s * .2)} ${f(x - s / 2)},${f(y)}Z`;
    const R = rng('or' + seed);
    return Q.dropOf(p, d, 2, 2, .3) + `<path d="${d}" fill="${Q.rg(p, [[0, '#ffffff'], [.6, '#f2efe6'], [1, '#d8d2c4']], .35, .3, .8)}" stroke="#cfc8b8" stroke-width=".5"/>` + Array.from({ length: 14 }, () => `<circle cx="${f(x + (R() - .5) * s * .8)}" cy="${f(y - R() * s * .45)}" r=".7" fill="#e2dccd"/>`).join('');
}
// しし唐・アスパラなど細長い緑
function greenPod(p, x, y, L, rot, { c = '#4a8f2a', w = 5 } = {}){
    return `<g ${T(x, y, rot)}>${Q.cast(p, 0, 2, L * .5, 2, .3)}<path d="M${-L / 2},0 Q0,${-w * .4} ${L / 2 - 3},0 L${L / 2},-1" stroke="${dk(c, .4)}" stroke-width="${w + 1}" stroke-linecap="round" fill="none"/><path d="M${-L / 2},0 Q0,${-w * .4} ${L / 2 - 3},0" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/><path d="M${-L * .35},${-w * .3} Q0,${-w * .7} ${L * .25},${-w * .35}" stroke="${lt(c, .5)}" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M${L / 2 - 2},-1 l4,-2" stroke="#7a9a4a" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
// 三つ葉・大葉など小さな葉
const herb = (p, x, y, s, rot = 0, c = '#4f9a34') => [0, 120, 240].map((a, i) => Q.leaf(p, x + Math.cos((a + rot) / 57.3) * s * .3, y + Math.sin((a + rot) / 57.3) * s * .3 * SY, s * .55, a + rot, c, 'hb' + x + i, { wave: .8, vein: false })).join('');
// 紅しょうが
function benishoga(p, x, y, s, seed = 1){
    const R = rng('bs' + seed);
    return Q.cast(p, x, y + 1, s * .5, s * .18, .25) + Array.from({ length: 12 }, () => { const a = R() * 180, L = s * (.3 + R() * .3), dx = (R() - .5) * s * .6, dy = (R() - .5) * s * .25; return `<path d="M${f(x + dx - L / 2)},${f(y + dy)} l${f(L)},${f((R() - .5) * 3)}" stroke="#d2283c" stroke-width="1.6" stroke-linecap="round" transform="rotate(${f(a * .3)} ${f(x)} ${f(y)})"/>`; }).join('');
}
// 刻みのり
function noriStrips(x, y, s, seed = 1){
    const R = rng('nr' + seed);
    return Array.from({ length: 14 }, () => { const dx = (R() - .5) * s, dy = (R() - .5) * s * .5, L = 5 + R() * 5, a = R() * 3.14; return `<path d="M${f(x + dx)},${f(y + dy)} l${f(Math.cos(a) * L)},${f(Math.sin(a) * L * .5)}" stroke="#2e3a26" stroke-width="1.3" stroke-linecap="round"/>`; }).join('');
}
// ごま
const sesame = (x, y, s, seed = 1, c = '#f4e8c8') => { const R = rng('gm' + seed); return Array.from({ length: 12 }, () => `<ellipse cx="${f(x + (R() - .5) * s)}" cy="${f(y + (R() - .5) * s * .5)}" rx="1.1" ry=".6" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".3"/>`).join(''); };

// ---------- 卵 ----------
// 目玉焼き（白身は波打つ平たい面、黄身は丸い山）
function friedEgg(p, x, y, s, seed = 1){
    const d = Q.blob(x, y, s / 2, s * .42 * SY, 'fe' + seed, { n: 11, jit: .22 });
    return Q.dropOf(p, d, 1.5, 2, .25) + `<path d="${d}" fill="${Q.rg(p, [[0, '#ffffff'], [.7, '#fbf8ef'], [1, '#ece4cf']], .35, .3, .8)}" stroke="#d9cfb8" stroke-width=".6"/><path d="${d}" fill="none" stroke="#e8c48a" stroke-width="1.6" opacity=".55"/>` +
        `<ellipse cx="${f(x + 1.4)}" cy="${f(y - s * .05)}" rx="${f(s * .2)}" ry="${f(s * .15)}" fill="#c47a10" opacity=".35"/><ellipse cx="${f(x)}" cy="${f(y - s * .08)}" rx="${f(s * .19)}" ry="${f(s * .15)}" fill="${Q.rg(p, [[0, '#ffd45a'], [.6, '#f6a81a'], [1, '#d8800c']], .36, .3, .75)}"/><ellipse cx="${f(x - s * .06)}" cy="${f(y - s * .13)}" rx="${f(s * .06)}" ry="${f(s * .035)}" fill="#fff" opacity=".85"/>`;
}
// とじ卵（半熟の卵が面に広がる: 白と黄のまだら）
function softEgg(p, cx, cy, rx, seed = 1, { n = 9 } = {}){
    const R = rng('se' + seed);
    let o = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * rx * .8, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * SY; const bd = Q.blob(x, y, 10 + R() * 8, (6 + R() * 4), 'seb' + seed + i, { n: 9, jit: .45, sy: SY * 1.1 }); o += `<path d="${bd}" fill="${R() < .55 ? '#f8d050' : '#fbf3d8'}" stroke="${dk('#f0c040', .2)}" stroke-width=".4" opacity=".95"/>`; }
    return o;
}
// 錦糸卵・炒り卵（細い黄色の帯 / 細かい粒）
const kinshi = (x, y, s, seed = 1) => { const R = rng('ks' + seed); return Array.from({ length: 16 }, () => { const dx = (R() - .5) * s, dy = (R() - .5) * s * .5, L = 6 + R() * 8, a = R() * 3.14; return `<path d="M${f(x + dx)},${f(y + dy)} l${f(Math.cos(a) * L)},${f(Math.sin(a) * L * .5)}" stroke="#d8a820" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(x + dx)},${f(y + dy)} l${f(Math.cos(a) * L)},${f(Math.sin(a) * L * .5)}" stroke="#f8d860" stroke-width="1.6" stroke-linecap="round"/>`; }).join(''); };
const iritamago = (p, x, y, s, seed = 1) => { const R = rng('it' + seed); return Array.from({ length: 30 }, () => { const dx = (R() - .5) * s, dy = (R() - .5) * s * .5; return `<circle cx="${f(x + dx)}" cy="${f(y + dy)}" r="${f(1.6 + R() * 1.4)}" fill="${R() < .5 ? '#f6d04a' : '#fbe27a'}" stroke="#d8a428" stroke-width=".4"/>`; }).join(''); };

// ---------- 麺 ----------
// 麺の山: 中心ほど高い面の上に、ゆるく曲がった麺を奥から手前へ重ねる。c は麺の色、w は太さ
function noodles(p, cx, cy, rx, H, c, seed, { w = 2.4, n = 70, len = 30, curl = 1, edge = null, flat = false } = {}){
    const R = rng('nd' + seed), it = [];
    const z = (u, v) => flat ? 0 : H * Math.max(0, 1 - (u * u + v * v) / rx / rx) ** .8;
    for (let i = 0; i < n; i++){
        const a = R() * 6.283, d = Math.sqrt(R()) * rx * .92, u0 = Math.cos(a) * d, v0 = Math.sin(a) * d, dir = R() * 6.283, pts = [];
        for (let k = 0; k <= 6; k++){ const t = k / 6, ang = dir + Math.sin(t * 3 + i) * curl, u = u0 + Math.cos(ang) * (t - .5) * len, v = v0 + Math.sin(ang) * (t - .5) * len; const r = Math.hypot(u, v), sc = r > rx ? rx / r : 1; pts.push(Q.at({ cx, cy }, u * sc, v * sc, z(u * sc, v * sc))); }
        it.push([pts[3][1], pts]);
    }
    it.sort((a, b) => a[0] - b[0]);
    const ed = edge || dk(c, .3);
    return it.map(([y, pts], i) => { const d = Q.smooth(pts, false); const lit = (pts[3][0] - cx) / rx * -.5 + (cy - y) / rx * .5; return `<path d="${d}" stroke="${ed}" stroke-width="${f(w + 1)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${lit > .1 ? lt(c, .2) : lit < -.25 ? dk(c, .08) : c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`; }).join('');
}
// 面の上の具の位置（麺・ご飯の山の上に置くとき）
const onMound = (cx, cy, rx, H, u, v, lift = 0) => Q.at({ cx, cy }, u, v, H * Math.max(0, 1 - (u * u + v * v) / rx / rx) ** .8 + lift);


// ---------- ご飯 ----------
// 色のついたご飯の山（チャーハン・炊き込み・カレーのご飯）。pal = [明るい, ふつう, 陰, 粒の縁]
function grainDome(p, cx, cy, rx, H, seed, { pal = ['#ffffff', '#f6f2e6', '#e2dac6', '#d8cfb8'], n = 420, size = 2.5 } = {}){
    const R = rng('gd' + seed), ry = rx * SY, prof = q => Math.pow(Math.max(0, 1 - q), .62);
    const top = []; for (let i = 0; i <= 40; i++){ const u = -1 + 2 * i / 40; top.push([cx + u * rx, cy - H * prof(u * u) - Math.sqrt(Math.max(0, 1 - u * u)) * ry * .25]); }
    const outline = `M${f(cx - rx)},${f(cy)} ${top.map(([a, b]) => `L${f(a)},${f(b)}`).join(' ')} L${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx)},${f(cy)}Z`;
    const gs = [];
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()), u = Math.cos(a) * d, v = Math.sin(a) * d; const gu = u * 1.6, gv = v * 1.2 - .7, l = -(gu * .7 + gv * .7) / Math.hypot(gu, gv, 1) + .2; gs.push([cx + u * rx * .98, cy + v * ry - H * prof(d * d), v, l, R() * 180]); }
    gs.sort((a, b) => a[2] - b[2]);
    return Q.dropOf(p, outline, 2.5, 3, .3, 2) + `<path d="${outline}" fill="${Q.rg(p, [[0, pal[0]], [.55, pal[1]], [1, pal[2]]], .38, .3, .75)}"/>` +
        gs.map(([x, y, v, l, r]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${size}" ry="${f(size * .54)}" transform="rotate(${f(r)} ${f(x)} ${f(y)})" fill="${l > .3 ? pal[0] : l > -.25 ? pal[1] : pal[2]}" stroke="${pal[3]}" stroke-width=".35"/>`).join('') +
        `<path d="${outline}" fill="${Q.lg(p, [[0, SHADE, 0], [.5, SHADE, 0], [1, SHADE, .18]], 0, 0, 1, 1)}"/><path d="M${f(cx - rx)},${f(cy)} ${top.map(([a, b]) => `L${f(a)},${f(b)}`).join(' ')} L${f(cx + rx)},${f(cy)}" fill="none" stroke="${dk(pal[2], .12)}" stroke-width="1.1" opacity=".75"/>`;
}
// 山の上に具を散らす（items: (x, y, i, r) => svg）
function onTop(cx, cy, rx, H, seed, n, minD, draw, { lift = 1 } = {}){
    return scatter(seed, n, rx * .85, minD).map(([u, v, r], i) => { const z = H * Math.pow(Math.max(0, 1 - (u * u + v * v) / rx / rx), .62); const [x, y] = Q.at({ cx, cy }, u, v, z + lift); return [y, () => draw(x, y, i, r)]; }).sort((a, b) => a[0] - b[0]).map(i => i[1]()).join('');
}
const WHITE_RICE = ['#ffffff', '#f6f2e6', '#e2dac6', '#d8cfb8'];
// カレー・ハヤシのルウ（皿の右に広がる面と、とろみの照り）
function roux(p, x, y, rx, c, seed){
    const d = Q.blob(x, y, rx, rx * .8 * SY, 'rx' + seed, { n: 12, jit: .18 });
    return Q.dropOf(p, d, 1.5, 2, .25) + `<path d="${d}" fill="${Q.rg(p, [[0, lt(c, .25)], [.6, c], [1, dk(c, .3)]], .4, .35, .7)}" stroke="${dk(c, .35)}" stroke-width=".6"/>`;
}

// 長皿の上の魚の切り身（皮を上に）: 皮の縞・焼き目・脂の照り
function skinFillet(p, x, y, w, d, rot, seed, { skin = '#7a7e7a', stripe = '#464c46', flesh = '#e8dccb', hgt = 9, char = .45 } = {}){
    const ck = chunk(p, x, y, w / 2, d / 2, hgt, skin, flesh, 'sf' + seed, { rot, jit: .08, n: 14, dome: .4 });
    const R = rng('sfs' + seed);
    let t = '';
    for (let i = 0; i < 6; i++){ const u = -w * .4 + i * w * .15; t += `<path d="M${f(x + u)},${f(ck.y - d * SY * .4)} q${f(4 + R() * 3)},${f(d * SY * .4)} ${f(-1)},${f(d * SY * .8)}" stroke="${stripe}" stroke-width="1.6" fill="none" opacity=".6"/>`; }
    for (let i = 0; i < 3; i++) t += `<path d="${Q.blob(x - w * .25 + i * w * .25, ck.y + (R() - .5) * 4, 6 + R() * 4, 3, 'sfc' + seed + i)}" fill="#3a2414" opacity="${char * .6}"/>`;
    t += `<path d="M${f(x - w * .4)},${f(ck.y - d * SY * .2)} Q${f(x)},${f(ck.y - d * SY * .45)} ${f(x + w * .35)},${f(ck.y - d * SY * .25)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/>`;
    return ck.s + `<g ${Q.clip(p, ck.d)}>${t}</g>`;
}
// 醤油のひとたらし
const soyDot = (x, y) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="4" ry="2" fill="#5a2e14" opacity=".85"/>`;
// 平皿・どんぶりの汁に沈む太い麺（うどん）
const udon = (p, cx, cy, rx, seed, c = '#f8f2de') => noodles(p, cx, cy, rx, 0, c, seed, { w: 4.6, n: 26, len: 46, curl: .7, flat: true, edge: '#d8ccb0' });

// おかゆの面（白いとろみと米粒）。V は器、c はおかゆの色
function kayuSurface(p, V, seed, { c = '#f4efe2', drop = 10, n = 120 } = {}){
    const S = Q.surface(p, V, { drop, c, glow: .3, rimShade: .2 }), R = rng('ky' + seed);
    let t = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * .95, x = S.cx + Math.cos(a) * d * S.rx, y = S.cy + Math.sin(a) * d * S.ry; t += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.3" ry="1.2" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="${lt(c, .5)}" stroke="${dk(c, .12)}" stroke-width=".35" opacity=".9"/>`; }
    return { S, s: S.s + `<g ${V.inside}>${t}</g>` };
}
// 白い鉢のおかゆ（具は items(S) で足す）
function kayu(p, seed, items = () => '', { c = '#f4efe2', vessel = null } = {}){
    const V = vessel ? vessel(p) : Q.shiroBowl(p, { bands: [[10, 1.2]] }), K = kayuSurface(p, V, seed, { c });
    return V.s + K.s + `<g ${V.above}>${items(K.S)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6) + Q.steam(100, 14, .45);
}

// =========================================================
// 盛りつけ
// =========================================================
export default {
    // ---------- 主菜の焼き物 ----------
    // 豚の生姜焼き: 白い平皿。重ねた豚ロースに照り、玉ねぎ。奥にキャベツの千切り（お好みで）
    shogayaki: p => {
        const D = Q.plate(p);
        let s = D.s + Q.shredMound(p, 140, 88, 34, 30, undefined, 1, { n: 150 }) + Q.tarePool(p, 88, 112, 46);
        [[80, 84, 70, 14, 4, '#bd7c38', .02], [96, 98, 76, -10, 3, '#c4843e', -.018], [78, 112, 74, 8, 2, '#b9783a', .015], [98, 126, 70, -16, 1, '#c0803a', -.02]].forEach(([x, y, w, r, sd, c, bend]) => { s += Q.slice3q(p, x, y, w, r, { c, seed: sd, gloss: .8, bend }, { th: 2.6, tc: '#6a3010', sq: .72 }); });
        [[120, 116, 20, -20], [62, 104, 18, 30], [104, 94, 16, 10], [74, 126, 18, -10], [118, 132, 16, 25]].forEach(([x, y, L, r]) => { s += onionStrip(x, y, L, r, '#d9a75a'); });
        return s + Q.shine(78, 120, 18, -4) + Q.shine(96, 132, 14, -8) + Q.shine(80, 94, 14, 4, .7) + Q.shine(104, 106, 12, 0, .65);
    },
    // 照り焼きチキン: 切り分けた鶏ももに照り、ブロッコリー（お好みで）
    teriyaki: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + pool(p, 94, 118, 44, '#8a4a1a', 2, { op: .55 });
        const pieces = [-34, -17, 0, 17, 34].map((v, i) => { const [x, y] = P(o, -6 + i * 2, v); return [y, () => { const c = chunk(p, x, y, 40 - Math.abs(v) * .25, 9, 12, '#9a4e1c', '#e2bc90', 'tr' + i, { rot: -4, jit: .08, n: 12, dome: .4 }); return c.s + `<g ${Q.clip(p, c.d)}><path d="M${f(x - 30)},${f(c.y + 3)} q30,-4 60,0" stroke="#6a2e0c" stroke-width="1.6" fill="none" opacity=".45"/></g>` + gl(x - 8, c.y - 1, 22, -4, .85); }]; });
        const br = [[-52, 30], [52, -30], [54, 18]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => broccoli(p, x, y, 22, i)]; });
        return s + Q.byDepth([...pieces, ...br]);
    },
    // ハンバーグ: 厚みのある楕円にケチャップとソースのソース
    hamburg: p => {
        const D = Q.plate(p), o = D.o;
        const [x, y] = P(o, -6, 4);
        const c = chunk(p, x, y, 52, 40, 18, '#6e3a1e', '#5a2e16', 'hb', { jit: .1, n: 14, dome: .3 });
        const sauce = Q.blob(x + 2, c.y + 2, 40, 27 * SY, 'hbs', { n: 12, jit: .2 });
        return D.s + pool(p, x + 8, y + 8, 50, '#7a2e14', 3, { op: .7 }) + c.s + `<path d="${sauce}" fill="${Q.rg(p, [[0, '#c4502a'], [.6, '#9a3216'], [1, '#6e200e']], .4, .35, .7)}"/>` + gl(x - 14, c.y - 6, 22, -8, .85) + gl(x + 10, c.y + 4, 10, -6, .6);
    },
    // 焼き餃子: 羽根つきでなく、焼き色の底を上にして5つ並べる
    gyoza: p => {
        const D = Q.plate(p), o = D.o;
        const it = [-48, -24, 0, 24, 48].map((u, i) => { const [x, y] = P(o, u, (i % 2) * 4 - 2); return [y, () => {
            const c = chunk(p, x, y, 11, 30, 9, '#c4782e', '#f2e6c8', 'gz' + i, { jit: .1, n: 12, dome: .6 });
            const back = Q.blob(x, c.y - 30 * SY * .62, 10, 5, 'gzp' + i, { n: 10, jit: .3 });
            return c.s + `<path d="${back}" fill="#f4ead2" stroke="#c8b088" stroke-width=".6"/>` + [0, 1, 2].map(k => `<path d="M${f(x - 6 + k * 5)},${f(c.y - 30 * SY * .62 - 3)} q1,3 0,6" stroke="#c8b088" stroke-width=".7" fill="none"/>`).join('') +
                `<g ${Q.clip(p, c.d)}><path d="${Q.blob(x, c.y + 4, 9, 9, 'gzc' + i)}" fill="#8a4a18" opacity=".35"/></g>` + gl(x - 3, c.y - 2, 9, -70, .55);
        }]; });
        return D.s + Q.byDepth(it);
    },
    // 鮭のムニエル: バターの照り、レモン（お好みで）
    meuniere: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + pool(p, 96, 118, 50, '#e8b850', 4, { op: .45 });
        const it = [[-22, -14, 0], [24, 16, 1]].map(([u, v, i]) => { const [x, y] = P(o, u, v); return [y, () => fillet(p, x, y, 72, 42, i ? 8 : -12, 'mn' + i, { flesh: '#e8955e', skin: '#9a9890', char: .55 }) + `<path d="${Q.blob(x, y - 9 * CZ - 2, 14, 4, 'bt' + i)}" fill="#f6d872" opacity=".85"/>`]; });
        const [lx, ly] = P(o, 42, -30); it.push([ly, () => citrus(p, lx, ly, 26, -20)]);
        return s + Q.byDepth(it);
    },
    // ぶりの照り焼き: 濃い照りの切り身2つ、ししとう（お好みで）
    buriteri: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + pool(p, 94, 116, 48, '#6e3412', 5, { op: .6 });
        const it = [[-22, -8, -10, 0], [22, 12, 8, 1]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => fillet(p, x, y, 70, 42, r, 'bt' + i, { flesh: '#d8b48a', skin: '#62665f', glaze: '#8a4a1e', hgt: 10 })]; });
        [[38, -34, -20], [48, -22, -30], [-42, 30, 20]].forEach(([u, v, r], i) => { const [x, y] = P(o, u, v); it.push([y, () => greenPod(p, x, y, 26, r)]); });
        return s + Q.byDepth(it);
    },
    // 鮭のちゃんちゃん焼き: 鉄のフライパンに野菜を広げ、鮭に味噌とバター
    chanchan: p => {
        const V = Q.pan(p, { outer: '#5e5650', lip: '#6e6660', inner: '#4a4440', handles: 'long', rx: 90, cx: 94, cy: 90, h: 30, handleLen: 6, handleRise: 36 }), o = { cx: V.cx, cy: V.cy + 4 };
        const it = [];
        scatter('cc', 34, 72, 12).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v); it.push([y, () => i % 3 === 0 ? onionStrip(x, y, 16, r * 180, '#ead8a0') : Q.leaf(p, x, y, 32, r * 180, i % 3 === 1 ? '#c8e09a' : '#9ec46a', 'cb' + i, { wave: 2 })]); });
        scatter('ccc', 7, 66, 22).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 2); it.push([y + .1, () => i % 2 ? carrotStick(p, x, y, 16, r * 180) : shimeji(p, x, y, 16, r * 30 - 15, 3, i)]); });
        const [x, y] = P(o, 0, 0, 3);
        it.push([y + 30, () => fillet(p, x, y, 80, 46, -6, 'cc', { flesh: '#ee9a64', skin: '#9a9890', char: .25 }) + `<path d="${Q.blob(x, y - 13, 28, 10, 'miso')}" fill="${Q.rg(p, [[0, '#d8a050'], [1, '#9a6020']])}"/><path d="${Q.blob(x - 4, y - 14, 8, 4, 'butter')}" fill="#fbe490" stroke="#d8b450" stroke-width=".5"/>`]);
        return V.s + `<g ${V.inside}>${Q.byDepth(it)}</g>` + V.shine(.5);
    },
    // マカロニグラタン: 楕円のグラタン皿に、焼き色のついたチーズとパン粉
    gratin: p => {
        const D = Q.ovalPlate(p, { base: '#f8f4ea', h: 16, rz: 72 }), cx = D.cx, cy = D.cy;
        const R = rng('gr');
        let s = D.s + `<path d="${Q.eD(cx, cy - 4, D.rx, D.ry)}" fill="${Q.rg(p, [[0, '#fbe8a8'], [.5, '#f0c868'], [1, '#c88a34']], .42, .4, .7)}"/>`;
        for (let i = 0; i < 18; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * .85; s += `<path d="${Q.blob(cx + Math.cos(a) * d * D.rx, cy - 4 + Math.sin(a) * d * D.ry, 6 + R() * 8, 3 + R() * 3, 'gb' + i, { jit: .5 })}" fill="${R() < .5 ? '#c27a2a' : '#a8601e'}" opacity=".55"/>`; }
        for (let i = 0; i < 7; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * .7, x = cx + Math.cos(a) * d * D.rx, y = cy - 5 + Math.sin(a) * d * D.ry; s += `<path d="M${f(x - 5)},${f(y)} a5,3 0 0 1 10,0" stroke="#f4e2a8" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${f(x - 5)},${f(y)} a5,3 0 0 1 10,0" stroke="#d8b060" stroke-width="1" fill="none"/>`; }
        s += Array.from({ length: 50 }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * .9; return `<circle cx="${f(cx + Math.cos(a) * d * D.rx)}" cy="${f(cy - 4 + Math.sin(a) * d * D.ry)}" r=".9" fill="#b8742a" opacity=".6"/>`; }).join('');
        return s + `<path d="M${f(cx - D.rx * .7)},${f(cy - D.ry * .5)} Q${f(cx - D.rx * .3)},${f(cy - D.ry * .95)} ${f(cx + D.rx * .1)},${f(cy - D.ry * .9)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>`;
    },
    // 鶏むね肉のねぎ塩焼き: そぎ切りの鶏に刻みねぎの塩だれ、レモン（お好みで）
    negishio: p => {
        const D = Q.plate(p), o = D.o, R = rng('ns');
        const it = [[-34, -16], [-6, -20], [22, -12], [-24, 14], [8, 12], [36, 16]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => { const c = chunk(p, x, y, 19, 26, 8, '#f2d4a4', '#f6e6c8', 'ns' + i, { rot: 30, jit: .15 }); let t = ''; for (let k = 0; k < 7; k++) t += Q.negi(p, x + (R() - .5) * 20, c.y + (R() - .5) * 8, 4.6, k % 2 ? '#7ab84a' : '#e4f0c8'); return c.s + `<g ${Q.clip(p, c.d)}><path d="${c.d}" fill="#c8843a" opacity=".25"/></g>` + t; }]; });
        const [lx, ly] = P(o, 44, -36); it.push([ly, () => citrus(p, lx, ly, 26, -20)]);
        return D.s + Q.byDepth(it);
    },
    // お好み焼き: 厚い円盤にソース、マヨネーズの線、青のりとかつお節
    okonomi: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 0), R = rng('ok');
        const c = chunk(p, x, y, 66, 66, 14, '#c47a34', '#d8a058', 'ok', { jit: .05, n: 18, dome: .2 });
        let s = D.s + c.s + `<path d="${Q.blob(x, c.y, 60, 60 * SY, 'oks', { n: 16, jit: .08 })}" fill="${Q.rg(p, [[0, '#8a4a20'], [.6, '#6a3014'], [1, '#4e220e']], .4, .35, .7)}"/>`;
        for (let i = -3; i <= 3; i++) s += `<path d="M${f(x - 46 + Math.abs(i) * 4)},${f(c.y + i * 8)} ${Array.from({ length: 6 }, (_, k) => `l${f(15 - Math.abs(i))},${k % 2 ? 4 : -4}`).join(' ')}" stroke="#fdf6e4" stroke-width="2" fill="none" stroke-linejoin="round" opacity=".95" transform="rotate(-12 ${x} ${f(c.y)})"/>`;
        for (let i = 0; i < 40; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * 52; s += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(c.y + Math.sin(a) * d * SY)}" r=".9" fill="#4a8a2a"/>`; }
        for (let i = 0; i < 12; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * 40, px = x + Math.cos(a) * d, py = c.y + Math.sin(a) * d * SY - 2; s += `<path d="${Q.blob(px, py, 4 + R() * 3, 2.2 + R(), 'kt' + i, { jit: .5, rot: R() * 180 })}" fill="#e8b48a" stroke="#b8784a" stroke-width=".4"/>`; }
        return s + gl(x - 30, c.y - 18, 26, -10, .55);
    },

    // ---------- ごはん ----------
    // カレーライス: 白い平皿に、左にご飯、右にルウ（豚肉・じゃがいも・にんじん・玉ねぎ）
    curry: p => {
        const D = Q.plate(p), o = D.o;
        const [rx0, ry0] = P(o, -28, -6), [cx1, cy1] = P(o, 22, 8);
        let s = D.s + roux(p, cx1, cy1, 52, '#a8661e', 1);
        s += grainDome(p, rx0, ry0, 38, 22, 'cr', { pal: WHITE_RICE });
        const it = [];
        scatter('cu', 9, 38, 13, { cu: 26, cv: 10 }).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 2); it.push([y, () => i % 3 === 0 ? Q.lump(p, x, y, 9, 7, '#e8c070', 'cp' + i, { hi: .3 }) : i % 3 === 1 ? Q.rangiri(p, x, y, 11, r * 90, '#e97a2a', i) : Q.slab(p, x, y, 9, 5, 2, '#8a5432', 'cpk' + i).s]); });
        return s + Q.byDepth(it) + gl(cx1 + 8, cy1 - 14, 24, -6, .6);
    },
    // 親子丼: どんぶりに、半熟のとじ卵と鶏肉・玉ねぎ、三つ葉（お好みで）
    oyakodon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 4, c: '#e8b84a', glow: .35 });
        const it = [];
        scatter('oy', 7, 56, 20).forEach(([u, v], i) => { const [x, y] = P(S.o, u, v, 2); it.push([y, () => chunk(p, x, y, 11, 10, 5, '#e8c890', '#f4e2c0', 'oyc' + i, { jit: .3, n: 8 }).s]); });
        scatter('oyo', 6, 60, 18).forEach(([u, v, r]) => { const [x, y] = P(S.o, u, v, 3); it.push([y, () => onionStrip(x, y, 16, r * 180, '#ead8a0')]); });
        const [hx, hy] = P(S.o, 18, -14, 5); it.push([hy + 50, () => herb(p, hx, hy, 18, 20, '#5aa83a')]);
        return V.s + S.s + `<g ${V.inside}>${Q.byDepth(it)}${softEgg(p, S.cx, S.cy, S.rx, 1, { n: 10 })}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },
    // 牛丼: どんぶりに、煮た牛肉と玉ねぎ、紅しょうが（お好みで）
    gyudon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 5, c: '#8a5a32', glow: .25 });
        const it = [];
        scatter('gy', 12, 58, 16).forEach(([u, v, r], i) => { const z = 10 * (1 - (u * u + v * v) / 3600); const [x, y] = P(S.o, u, v, z); it.push([y, () => Q.slice3q(p, x, y, 40, r * 180, { c: '#8a5232', fat: '#d8b090', seed: i, gloss: .6, char: false }, { th: 1.8, tc: '#4e2a14', sq: .62 })]); });
        scatter('gyo', 8, 56, 16).forEach(([u, v, r]) => { const z = 10 * (1 - (u * u + v * v) / 3600); const [x, y] = P(S.o, u, v, z + 2); it.push([y + .1, () => onionStrip(x, y, 18, r * 180, '#d8b070')]); });
        const [bx, by] = P(S.o, 34, -20, 8); it.push([by + 60, () => benishoga(p, bx, by, 22)]);
        return V.s + S.s + `<g ${V.above}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },
    // オムライス: 平皿に、ふっくらした卵の山とケチャップ
    omurice: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4), H = 30, rx = 62, rz = 30 * SY;
        const om = `M${x - rx},${y} C${x - rx},${f(y - H * .9)} ${x - rx * .45},${f(y - H * 1.25)} ${x},${f(y - H * 1.25)} C${x + rx * .45},${f(y - H * 1.25)} ${x + rx},${f(y - H * .9)} ${x + rx},${y} C${x + rx},${f(y + rz)} ${x - rx},${f(y + rz)} ${x - rx},${y}Z`;
        const ty = y - H * .95;
        return D.s + Q.dropOf(p, om, 3, 4, .35, 2.4) + `<path d="${om}" fill="${Q.rg(p, [[0, '#fde27a'], [.5, '#f6c03a'], [1, '#d08a14']], .36, .25, .8)}" stroke="#b8780e" stroke-width=".7"/>` +
            `<path d="M${f(x - 40)},${f(ty + 4)} q7,-8 14,-1 t14,-1 t14,-1 t14,-1 t14,1" stroke="#9a1c0c" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${f(x - 40)},${f(ty + 3)} q7,-8 14,-1 t14,-1 t14,-1 t14,-1 t14,1" stroke="#dc3a1c" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${f(x - 38)},${f(ty)} q5,-5 10,-2" stroke="#ff9a7a" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
            `<path d="M${f(x - rx * .8)},${f(y - H * .5)} Q${f(x - rx * .6)},${f(y - H * 1.05)} ${f(x - rx * .1)},${f(y - H * 1.15)}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
    },
    // ガパオライス: ご飯に目玉焼き、鶏ひき肉とパプリカ・玉ねぎ・バジル（お好みで）
    gapao: p => {
        const D = Q.plate(p), o = D.o, [rx0, ry0] = P(o, -26, -4), [mx, my] = P(o, 26, 10);
        let s = D.s + Q.cast(p, mx, my + 6, 34, 12, .3) + `<path d="${Q.blob(mx, my, 36, 28 * SY, 'gpm', { n: 12, jit: .2 })}" fill="${Q.rg(p, [[0, '#a8743e'], [.6, '#7e4e26'], [1, '#5a3418']])}"/>`;
        const it = [];
        scatter('gp', 22, 30, 6, { cu: 26, cv: 10 }).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 3); it.push([y, () => i % 4 === 0 ? pepperBit(p, x, y, 8, r * 180, '#d8301e') : i % 4 === 1 ? Q.leaf(p, x, y, 11, r * 180, '#2f8a2c', 'bz' + i, { wave: 1 }) : `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.6 + r * 1.4)}" fill="${Q.dome(p, '#9a6034')}" stroke="#5a3418" stroke-width=".4"/>`]); });
        s += Q.byDepth(it) + grainDome(p, rx0, ry0, 36, 18, 'gpr', { pal: WHITE_RICE });
        return s + friedEgg(p, rx0 + 2, ry0 - 18, 40, 1);
    },
    // タコライス: ご飯に合いびき肉、レタス、トマト、チーズ（お好みで）
    tacorice: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 2);
        let s = D.s + grainDome(p, x, y, 54, 16, 'tc', { pal: WHITE_RICE, n: 380 });
        s += onTop(x, y, 54, 16, 'tcm', 26, 9, (px, py) => `<circle cx="${f(px)}" cy="${f(py)}" r="3.4" fill="${Q.dome(p, '#8a5a30')}" stroke="#5a3418" stroke-width=".4"/>`, { lift: 2 });
        s += onTop(x, y, 54, 16, 'tcl', 10, 14, (px, py, i, r) => Q.leaf(p, px, py, 18, r * 180, '#9ccc5a', 'tcl' + i, { wave: 2 }), { lift: 4 });
        s += onTop(x, y, 54, 16, 'tct', 8, 14, (px, py, i, r) => Q.cube(p, px, py, 7, r * 90, '#e0402a'), { lift: 5 });
        s += onTop(x, y, 54, 16, 'tcc', 14, 8, (px, py, i, r) => `<path d="M${f(px - 4)},${f(py)} l8,${f((r - .5) * 3)}" stroke="#f4c840" stroke-width="2" stroke-linecap="round"/>`, { lift: 6 });
        return s;
    },
    // チャーハン: 黄金色のご飯の山に、卵・ハム・長ねぎ
    chahan: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + grainDome(p, x, y, 56, 30, 'ch', { pal: ['#fbeaa8', '#eccd78', '#c8a050', '#b88a40'] });
        s += onTop(x, y, 56, 30, 'che', 14, 10, (px, py, i) => `<path d="${Q.blob(px, py, 4.4, 2.8, 'che' + i, { jit: .4 })}" fill="#f8d850" stroke="#c89a20" stroke-width=".4"/>`);
        s += onTop(x, y, 56, 30, 'chh', 10, 12, (px, py, i, r) => Q.cube(p, px, py, 5.4, r * 90, '#e89a9a'));
        s += onTop(x, y, 56, 30, 'chn', 14, 9, (px, py) => Q.negi(p, px, py, 4.4, '#6aaa3a'));
        return s;
    },
    // きのこの炊き込みご飯: 茶碗に、醤油色のご飯としめじ・まいたけ・油揚げ・にんじん
    takikomi: p => {
        const V = Q.chawan(p), cx = 100, cy = V.cy + 2;
        let s = V.s + `<g ${V.above}>${grainDome(p, cx, cy, V.irx - 1, 32, 'tk', { pal: ['#f0dcae', '#dcbc84', '#b8955a', '#a8844a'], n: 460 })}`;
        s += onTop(cx, cy, V.irx - 1, 32, 'tks', 6, 16, (px, py, i, r) => shimeji(p, px, py, 13, r * 40 - 20, 2, i));
        s += onTop(cx, cy, V.irx - 1, 32, 'tka', 6, 14, (px, py, i, r) => Q.prism(p, px, py, [[-6, -2], [6, -2], [6, 2], [-6, 2]], 2.4, '#d8a050', { rot: r * 180 }));
        s += onTop(cx, cy, V.irx - 1, 32, 'tkc', 6, 14, (px, py, i, r) => carrotStick(p, px, py, 9, r * 180));
        return s + '</g>';
    },
    // ---------- 麺 ----------
    // ナポリタン: ケチャップ色のスパゲッティに、ウインナー・ピーマン・玉ねぎ
    napolitan: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + Q.cast(p, x, y + 6, 58, 18, .3) + noodles(p, x, y, 58, 26, '#e0602c', 'np', { w: 2.4, n: 90, len: 34 });
        s += onTop(x, y, 58, 26, 'nps', 7, 14, (px, py, i, r) => `<g ${T(px, py, r * 60 - 30)}><ellipse cx="0" cy="1.2" rx="6" ry="3.6" fill="#a8482a"/><ellipse rx="6" ry="3.4" fill="${Q.dome(p, '#d8784a')}" stroke="#8a3a1e" stroke-width=".5"/><ellipse rx="3.6" ry="2" fill="#f0b090" opacity=".7"/></g>`, { lift: 3 });
        s += onTop(x, y, 58, 26, 'npp', 7, 12, (px, py, i, r) => `<ellipse cx="${f(px)}" cy="${f(py)}" rx="5.4" ry="3.2" fill="none" stroke="#3f8f2f" stroke-width="2" transform="rotate(${f(r * 60)} ${f(px)} ${f(py)})"/>`, { lift: 4 });
        s += onTop(x, y, 58, 26, 'npo', 6, 14, (px, py, i, r) => onionStrip(px, py, 14, r * 180, '#f0d8a0'), { lift: 3 });
        return s;
    },
    // ソース焼きそば: ソース色の麺に、豚肉・キャベツ・もやし・にんじん、青のりと紅しょうが
    yakisoba: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + Q.cast(p, x, y + 6, 58, 18, .3) + noodles(p, x, y, 58, 24, '#a8642e', 'ys', { w: 2.6, n: 85, len: 30, curl: 1.6 });
        s += onTop(x, y, 58, 24, 'ysc', 8, 14, (px, py, i, r) => Q.leaf(p, px, py, 18, r * 180, '#c8dc96', 'ysc' + i, { wave: 2 }), { lift: 3 });
        s += onTop(x, y, 58, 24, 'ysp', 6, 14, (px, py, i, r) => Q.slab(p, px, py, 9, 5, 1.6, '#8a5432', 'ysp' + i, { rot: r * 180 }).s, { lift: 3 });
        s += onTop(x, y, 58, 24, 'ysm', 8, 10, (px, py, i, r) => `<path d="M${f(px - 6)},${f(py)} q6,${f(-3 + r * 2)} 12,0" stroke="#d8ccb0" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${f(px - 6)},${f(py)} q6,${f(-3 + r * 2)} 12,0" stroke="#fbf6e6" stroke-width="1.5" fill="none" stroke-linecap="round"/>`, { lift: 3 });
        s += onTop(x, y, 58, 24, 'ysk', 5, 14, (px, py, i, r) => carrotStick(p, px, py, 10, r * 180), { lift: 3 });
        s += onTop(x, y, 58, 24, 'ysa', 40, 3, (px, py) => `<circle cx="${f(px)}" cy="${f(py)}" r=".9" fill="#3a7a22"/>`, { lift: 4 });
        const [bx, by] = P(o, 36, -26, 18); s += benishoga(p, bx, by, 18, 2);
        return s;
    },

    // カルボナーラ: クリーム色のスパゲッティに、ベーコン、粉チーズと黒こしょう
    carbonara: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + Q.cast(p, x, y + 6, 58, 18, .3) + pool(p, x, y + 4, 56, '#f2dc98', 7, { op: .7 }) + noodles(p, x, y, 56, 24, '#f2d488', 'cb', { w: 2.4, n: 90, len: 34 });
        s += onTop(x, y, 56, 24, 'cbb', 9, 12, (px, py, i, r) => Q.prism(p, px, py, [[-4, -2.4], [4, -2.4], [4, 2.4], [-4, 2.4]], 3, '#c4785a', { rot: r * 180, line: .4 }), { lift: 3 });
        s += onTop(x, y, 56, 24, 'cbc', 30, 4, (px, py) => `<circle cx="${f(px)}" cy="${f(py)}" r="1" fill="#fbf6e2"/>`, { lift: 4 });
        s += onTop(x, y, 56, 24, 'cbp', 40, 3, (px, py) => `<circle cx="${f(px)}" cy="${f(py)}" r=".75" fill="#3a2414"/>`, { lift: 4 });
        return s;
    },
    // きのこの和風パスタ: 醤油バター色のスパゲッティに、しめじ・まいたけ・ベーコン、大葉（お好みで）
    kinokopasta: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + Q.cast(p, x, y + 6, 58, 18, .3) + noodles(p, x, y, 56, 24, '#dcb87a', 'kp', { w: 2.4, n: 90, len: 34 });
        s += onTop(x, y, 56, 24, 'kps', 7, 15, (px, py, i, r) => i % 2 ? shimeji(p, px, py, 15, r * 40 - 20, 3, i) : `<path d="${Q.blob(px, py, 8, 4, 'mt' + i, { jit: .5, n: 10 })}" fill="${Q.lit(p, '#8a6a4a')}" stroke="#5a4028" stroke-width=".5"/><path d="M${f(px - 6)},${f(py)} q6,-3 12,0" stroke="#c8a888" stroke-width=".8" fill="none"/>`, { lift: 3 });
        s += onTop(x, y, 56, 24, 'kpb', 6, 14, (px, py, i, r) => Q.prism(p, px, py, [[-5, -2.4], [5, -2.4], [5, 2.4], [-5, 2.4]], 2.6, '#c4785a', { rot: r * 180, line: .4 }), { lift: 3 });
        s += onTop(x, y, 56, 24, 'kpo', 10, 9, (px, py, i, r) => `<path d="M${f(px - 4)},${f(py)} l8,${f((r - .5) * 3)}" stroke="#3f8a2c" stroke-width="1.8" stroke-linecap="round"/>`, { lift: 6 });
        return s;
    },
    // 肉うどん: どんぶりのつゆに太いうどん、甘辛の牛肉と長ねぎ
    nikuudon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 8, c: '#b88a4a', glow: .3 });
        const it = [];
        scatter('nu', 7, 34, 14, { cu: -8, cv: -8 }).forEach(([u, v, r], i) => { const [x, y] = P(S.o, u, v, 3); it.push([y, () => Q.slice3q(p, x, y, 34, r * 180, { c: '#8a5232', fat: '#d8b090', seed: i, gloss: .6, char: false }, { th: 1.8, tc: '#4e2a14', sq: .62 })]); });
        scatter('nun', 7, 30, 10, { cu: 30, cv: 16 }).forEach(([u, v, r], i) => { const [x, y] = P(S.o, u, v, 3); it.push([y, () => `<g ${T(x, y, r * 40 - 20)}><ellipse rx="5" ry="2.8" fill="#e8f2cc" stroke="#6aa83a" stroke-width="1.2"/><ellipse rx="2" ry="1" fill="#c8e0a0"/></g>`]); });
        return V.s + S.s + `<g ${V.inside}>${udon(p, S.cx, S.cy + 2, S.rx * .9, 'nu')}${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },
    // さばの塩焼き: 長皿に皮を上にした切り身、大根おろし（お好みで）に醤油
    sabashio: p => {
        const D = Q.slabPlate(p), o = D.o, [x, y] = P(o, -14, 0), [ox, oy] = P(o, 54, 12);
        return D.s + skinFillet(p, x, y, 116, 62, -4, 'sb', { skin: '#888a86', stripe: '#424a44' }) + oroshi(p, ox, oy, 26) + soyDot(ox, oy - 12);
    },
    // さんまの塩焼き: 長皿に1尾、大根おろしとすだち（お好みで）
    sanma: p => {
        const D = Q.slabPlate(p), o = D.o, [x, y] = P(o, 0, -6), [ox, oy] = P(o, 40, 22), [sx, sy] = P(o, 64, 20);
        return D.s + wholeFish(p, x, y, 170, -3, 'sm', { skin: '#686c68', belly: '#e8e2d4', char: .6 }) + oroshi(p, ox, oy, 24) + citrus(p, sx, sy, 18, 0, { c: '#7ab83a', half: true });
    },
    // 鮭のホイル焼き: 開いたアルミホイルの中に鮭・玉ねぎ・しめじ・ピーマン（お好みで）、バター
    hoilyaki: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 2), R = rng('hf');
        const pts = []; for (let i = 0; i < 18; i++){ const a = i / 18 * 6.283, r = 66 + (R() - .5) * 12; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * SY * .92 - (Math.sin(a) < 0 ? 10 : 0)]); }
        const foil = Q.smooth(pts, true, .7), inner = Q.blob(x, y, 52, 52 * SY * .85, 'hfi', { n: 14, jit: .12 });
        let s = D.s + Q.dropOf(p, foil, 2.5, 4, .32, 2.4) + `<path d="${foil}" fill="${Q.lg(p, [[0, '#f5f5f2'], [.4, '#cbcbc6'], [.7, '#e8e8e4'], [1, '#a0a09a']], 0, 0, 1, 1)}" stroke="#8e8e88" stroke-width=".7"/>`;
        for (let i = 0; i < 10; i++) s += `<path d="M${f(x + (R() - .5) * 120)},${f(y + (R() - .5) * 60 * SY)} l${f((R() - .5) * 14)},${f((R() - .5) * 8)}" stroke="#fff" stroke-width="1" opacity=".6"/>`;
        s += `<path d="${inner}" fill="${Q.rg(p, [[0, '#f0e2c4'], [1, '#c8b48e']], .4, .4, .8)}"/>`;
        const it = [];
        scatter('hfo', 7, 40, 14).forEach(([u, v, r], i) => { const [px, py] = P({ cx: x, cy: y }, u, v, 2); it.push([py, () => i % 3 === 0 ? shimeji(p, px, py, 14, r * 40 - 20, 3, i) : i % 3 === 1 ? onionStrip(px, py, 14, r * 180, '#efe0b0') : `<ellipse cx="${f(px)}" cy="${f(py)}" rx="5" ry="3" fill="none" stroke="#3f8f2f" stroke-width="2"/>`]); });
        it.push([y + 30, () => fillet(p, x - 4, y + 2, 64, 34, -6, 'hf', { flesh: '#ee9a64', skin: '#9a9890', char: .15 }) + `<path d="${Q.blob(x - 6, y - 8, 9, 5, 'hfb')}" fill="#fbe490" stroke="#d8b450" stroke-width=".5"/>`]);
        return s + Q.byDepth(it);
    },
    // 鶏むね肉のピカタ: 卵の衣をまとった鶏肉、ケチャップ
    piccata: p => {
        const D = Q.plate(p), o = D.o;
        const it = [[-36, -12, 20], [-6, -16, -10], [24, -6, 15], [-24, 16, -20], [10, 16, 5]].map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => { const c = chunk(p, x, y, 20, 15, 7, '#f2c860', '#e8b040', 'pc' + i, { rot: r, jit: .2 }); return c.s + `<g ${Q.clip(p, c.d)}><path d="${Q.blob(x + 3, c.y + 2, 10, 5, 'pcb' + i, { jit: .5 })}" fill="#c88a2a" opacity=".45"/></g>` + gl(x - 6, c.y - 3, 10, -10, .7); }]; });
        const [kx, ky] = P(o, 46, 26); it.push([ky, () => pool(p, kx, ky, 14, '#d0341a', 'k', { op: 1 })]);
        return D.s + Q.byDepth(it);
    },
    // 豆腐ハンバーグ: 白っぽいハンバーグに大根おろしとポン酢、しめじ（お好みで）
    tofuhamburg: p => {
        const D = Q.plate(p), o = D.o;
        const it = [[-24, -4, 0], [26, 6, 1]].map(([u, v, i]) => { const [x, y] = P(o, u, v); return [y, () => { const c = chunk(p, x, y, 30, 24, 12, '#c8925a', '#e8cfa6', 'th' + i, { jit: .1, dome: .5 }); return c.s + oroshi(p, x, c.y + 4, 22, i); }]; });
        scatter('ths', 3, 20, 12, { cu: 0, cv: 36 }).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v); it.push([y, () => shimeji(p, x, y, 14, r * 40 - 20, 3, i)]); });
        return D.s + pool(p, 100, 116, 50, '#8a4a1e', 'pz', { op: .55 }) + Q.byDepth(it);
    },
    // ピーマンの肉詰め: 縦半分のピーマンに肉を詰めて焼き、ケチャップとソース
    pimannikuzume: p => {
        const D = Q.plate(p), o = D.o;
        const it = [[-36, -14, 10], [0, -18, -6], [34, -10, 8], [-20, 16, -10], [18, 16, 6]].map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => { const c = chunk(p, x, y, 18, 13, 9, '#3f8f2f', '#2f6e22', 'pm' + i, { rot: r, jit: .12, dome: .3 }); const m = Q.blob(x, c.y - 1, 14, 9 * SY, 'pmm' + i, { rot: r, jit: .2 }); return c.s + `<path d="${m}" fill="${Q.rg(p, [[0, '#a86a3a'], [.6, '#7a4422'], [1, '#5a2e16']], .4, .35, .75)}"/>` + gl(x - 4, c.y - 3, 9, -10, .6); }]; });
        return D.s + pool(p, 100, 118, 52, '#8a2a14', 'pms', { op: .6 }) + Q.byDepth(it);
    },
    // 鶏そぼろ丼: どんぶりのご飯に、そぼろと炒り卵を半分ずつ、さやいんげん（お好みで）
    soborodon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 4, c: '#f4efe0', glow: .3 });
        const half = side => `<path d="M${S.cx},${f(S.cy - S.ry)} L${S.cx},${f(S.cy + S.ry)} A${S.rx},${S.ry} 0 0 ${side < 0 ? 1 : 0} ${S.cx},${f(S.cy - S.ry)}Z" fill="${side < 0 ? '#8a5a30' : '#f6d04a'}"/>`;
        const R = rng('sb');
        let t = half(-1) + half(1);
        for (let i = 0; i < 90; i++){ const a = R() * 6.283, d = Math.sqrt(R()), x = S.cx + Math.cos(a) * d * S.rx * .95, y = S.cy + Math.sin(a) * d * S.ry * .95; t += x < S.cx - 2 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 + R())}" fill="${R() < .5 ? '#a8703e' : '#6e4220'}"/>` : x > S.cx + 2 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 + R())}" fill="${R() < .5 ? '#fbe27a' : '#e8b828'}"/>` : ''; }
        for (let i = 0; i < 5; i++){ const y = S.cy - S.ry * .8 + i * S.ry * .4; t += greenPod(p, S.cx + (R() - .5) * 4, y, 20, 80 + (R() - .5) * 20, { w: 3.6 }); }
        return V.s + S.s + `<g ${V.inside}>${t}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },

    // 中華丼: どんぶりのご飯に、とろみのあんと豚肉・白菜・にんじん・しいたけ・うずらの卵（お好みで）
    chukadon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 4, c: '#d8b070', glow: .4 });
        const it = [];
        scatter('cd', 22, 60, 10).forEach(([u, v, r], i) => { const z = 6 * (1 - (u * u + v * v) / 3600); const [x, y] = P(S.o, u, v, z + 2); const k = i % 6; it.push([y, () => k === 0 ? Q.slice3q(p, x, y, 22, r * 180, { c: '#c48a62', fat: '#ead0b0', seed: i, gloss: .6, char: false }, { th: 1.6, tc: '#7a4a2a', sq: .6 }) : k === 1 ? carrotStick(p, x, y, 12, r * 180) : k === 2 ? shiitake(p, x, y, 13) : k === 3 && i < 18 ? Q.lump(p, x, y, 6, 5, '#f6f0e0', 'q' + i, { hi: .6 }) : Q.leaf(p, x, y, 22, r * 180, i % 2 ? '#eef0d0' : '#cfe0a0', 'hk' + i, { wave: 2 })]); });
        return V.s + S.s + `<g ${V.inside}>${Q.byDepth(it)}<path d="${Q.eD(S.cx, S.cy, S.rx, S.ry)}" fill="#e8c88a" opacity=".22"/>${Q.shine(S.cx - 30, S.cy - 14, 22, -6)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },
    // ビビンバ: 石鍋のご飯に、牛肉・もやし・ほうれん草・にんじんのナムルを放射状に、真ん中に卵（お好みで）
    bibimbap: p => {
        const V = Q.donabe(p, { stone: true }), S = Q.surface(p, V, { drop: 6, c: '#f4efe0', glow: .3 });
        const segs = [['#7a4a2c', 'beef'], ['#f4f0dc', 'moyashi'], ['#2f7a2a', 'spinach'], ['#ec7b2d', 'carrot']];
        let t = '';
        segs.forEach(([c, k], i) => { const a0 = i / 4 * 6.283 - 1.2, a1 = a0 + 6.283 / 4 * .92; const R = rng('bb' + i); for (let j = 0; j < 40; j++){ const a = a0 + R() * (a1 - a0), d = .4 + R() * .55, x = S.cx + Math.cos(a) * d * S.rx, y = S.cy + Math.sin(a) * d * S.ry; t += k === 'beef' ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.4 + R())}" fill="${R() < .5 ? '#8a5232' : '#5e341c'}"/>` : `<path d="M${f(x - 4)},${f(y)} l8,${f((R() - .5) * 4)}" stroke="${dk(c, .25)}" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(x - 4)},${f(y)} l8,${f((R() - .5) * 4)}" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`; } });
        t += friedEgg(p, S.cx, S.cy + 2, 30, 2) + sesame(S.cx + 20, S.cy + 8, 30, 1);
        return V.s + S.s + `<g ${V.inside}>${t}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.35);
    },
    // ハヤシライス: 平皿に、ご飯と、牛肉・玉ねぎ・しめじ（お好みで）のハヤシソース
    hayashi: p => {
        const D = Q.plate(p), o = D.o, [rx0, ry0] = P(o, -28, -6), [cx1, cy1] = P(o, 22, 8);
        let s = D.s + roux(p, cx1, cy1, 52, '#6e2c16', 2) + grainDome(p, rx0, ry0, 38, 22, 'hy', { pal: WHITE_RICE });
        const it = [];
        scatter('hy', 10, 36, 12, { cu: 26, cv: 10 }).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 2); it.push([y, () => i % 3 === 0 ? onionStrip(x, y, 14, r * 180, '#c88a52') : i % 3 === 1 ? Q.slice3q(p, x, y, 20, r * 180, { c: '#6a3a22', fat: '#a8704a', seed: i, gloss: .5, char: false }, { th: 1.4, tc: '#3e1e0e', sq: .6 }) : shimeji(p, x, y, 12, r * 40 - 20, 2, i)]); });
        return s + Q.byDepth(it) + gl(cx1 + 8, cy1 - 14, 24, -6, .6);
    },
    // ドライカレー: ご飯の山に、カレー色のひき肉・玉ねぎ・にんじん・ピーマン（お好みで）
    drycurry: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 6);
        let s = D.s + grainDome(p, x, y, 56, 20, 'dc', { pal: WHITE_RICE, n: 380 });
        const mx = x, my = y - 8;
        s += Q.cast(p, mx, my + 4, 36, 12, .3) + `<path d="M${mx - 38},${my} Q${mx - 30},${my - 22} ${mx},${my - 24} Q${mx + 30},${my - 22} ${mx + 38},${my} Q${mx},${my + 14} ${mx - 38},${my}Z" fill="${Q.rg(p, [[0, '#c48a3a'], [.6, '#9a6020'], [1, '#6e4014']])}"/>`;
        s += onTop(mx, my, 34, 16, 'dcb', 40, 4, (px, py, i, r) => i % 5 === 0 ? `<rect x="${f(px - 1.6)}" y="${f(py - 1.6)}" width="3.2" height="3.2" fill="#ec7b2d"/>` : i % 7 === 1 ? `<rect x="${f(px - 1.6)}" y="${f(py - 1.6)}" width="3.2" height="3.2" fill="#3f8f2f"/>` : `<circle cx="${f(px)}" cy="${f(py)}" r="${f(1.6 + r)}" fill="${r < .5 ? '#b07a34' : '#7a4a1a'}"/>`, { lift: 1 });
        return s;
    },
    // 冷やし中華: 平皿の中華麺に、ハム・きゅうり・錦糸卵・トマト（お好みで）を放射状に
    hiyashichuka: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + pool(p, x, y + 4, 56, '#c89a52', 'hc', { op: .5 }) + noodles(p, x, y, 56, 14, '#f2dc8a', 'hc', { w: 2, n: 80, len: 34 });
        const strip = (a0, c, w = 2.2) => { const R = rng('hcs' + a0); let t = ''; for (let i = 0; i < 26; i++){ const a = a0 + (R() - .5) * .8, d = .2 + R() * .6; const [px, py] = onMound(x, y, 56, 14, Math.cos(a) * d * 56, Math.sin(a) * d * 56, 2); const dx = Math.cos(a) * 6, dy = Math.sin(a) * 6 * SY; t += `<path d="M${f(px - dx)},${f(py - dy)} l${f(dx * 2)},${f(dy * 2)}" stroke="${dk(c, .25)}" stroke-width="${w + 1.2}" stroke-linecap="round"/><path d="M${f(px - dx)},${f(py - dy)} l${f(dx * 2)},${f(dy * 2)}" stroke="${c}" stroke-width="${w + .2}" stroke-linecap="round"/>`; } return t; };
        s += strip(-2.2, '#f2a6a6', 2.4) + strip(-.6, '#5aa83a', 2) + strip(1.2, '#f8d860', 2.2);
        [[2.6, .5], [2.9, .35]].forEach(([a, d], i) => { const [px, py] = onMound(x, y, 56, 14, Math.cos(a) * d * 56, Math.sin(a) * d * 56, 3); s += `<g ${T(px, py, i * 30)}>${Q.cast(p, 0, 3, 10, 3, .3)}<path d="M-10,2 A10,6 0 0 1 10,2Z" fill="${Q.lit(p, '#e0402a')}" stroke="#a82416" stroke-width=".6"/><path d="M-7,1 A7,4 0 0 1 7,1" fill="#f08a6a"/></g>`; });
        return s;
    },
    // 焼きうどん: 醤油色の太いうどんに、豚肉・キャベツ・玉ねぎ・にんじん、かつお節
    yakiudon: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + Q.cast(p, x, y + 6, 58, 18, .3) + noodles(p, x, y, 58, 20, '#e8c890', 'yu', { w: 4.6, n: 40, len: 42, curl: .8, edge: '#b8945a' });
        s += onTop(x, y, 58, 20, 'yuc', 7, 15, (px, py, i, r) => Q.leaf(p, px, py, 18, r * 180, '#c8dc96', 'yuc' + i, { wave: 2 }), { lift: 4 });
        s += onTop(x, y, 58, 20, 'yup', 5, 15, (px, py, i, r) => Q.slice3q(p, px, py, 20, r * 180, { c: '#b07a52', fat: '#e8cfa8', seed: i, gloss: .5, char: false }, { th: 1.4, tc: '#6a3a1a', sq: .6 }), { lift: 4 });
        s += onTop(x, y, 58, 20, 'yuk', 5, 14, (px, py, i, r) => carrotStick(p, px, py, 10, r * 180), { lift: 4 });
        s += onTop(x, y, 58, 20, 'yuf', 12, 8, (px, py, i, r) => `<path d="${Q.blob(px, py, 3.6, 2.2, 'kt' + i, { jit: .5, rot: r * 180 })}" fill="#e8b48a" stroke="#b8784a" stroke-width=".4"/>`, { lift: 7 });
        return s;
    },
    // 鮭とほうれん草のクリームパスタ
    salmoncreampasta: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + pool(p, x, y + 4, 60, '#f6ecd4', 'sc', { op: .95 }) + noodles(p, x, y, 54, 22, '#f2e2b0', 'sc', { w: 2.4, n: 85, len: 34 });
        s += onTop(x, y, 54, 22, 'scs', 7, 14, (px, py, i, r) => chunk(p, px, py, 6, 5, 4, '#f29a6a', '#e88a5a', 'scs' + i, { jit: .3, n: 8 }).s, { lift: 3 });
        s += onTop(x, y, 54, 22, 'scp', 7, 14, (px, py, i, r) => Q.leaf(p, px, py, 16, r * 180, '#2f7a2a', 'scp' + i, { wave: 1.5 }), { lift: 4 });
        return s + onTop(x, y, 54, 22, 'scc', 20, 4, (px, py) => `<circle cx="${f(px)}" cy="${f(py)}" r=".9" fill="#fffbe8"/>`, { lift: 5 });
    },
    // ツナとトマトのパスタ
    tunatomatopasta: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + pool(p, x, y + 4, 56, '#c8361c', 'tt', { op: .7 }) + noodles(p, x, y, 54, 22, '#e2582c', 'tt', { w: 2.4, n: 85, len: 34 });
        s += onTop(x, y, 54, 22, 'ttt', 10, 12, (px, py, i, r) => `<path d="${Q.blob(px, py, 5 + r * 2, 3.4, 'tn' + i, { jit: .5, n: 9 })}" fill="${Q.lit(p, '#e8cca4')}" stroke="#b8946a" stroke-width=".5"/>`, { lift: 3 });
        s += onTop(x, y, 54, 22, 'tto', 5, 14, (px, py, i, r) => onionStrip(px, py, 12, r * 180, '#f0c8a0'), { lift: 3 });
        return s;
    },
    // たらこスパゲッティ: たらこ色のスパゲッティに、大葉と刻みのり（お好みで）
    tarakopasta: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + noodles(p, x, y, 54, 24, '#f2c0a0', 'tk', { w: 2.4, n: 90, len: 34 });
        s += onTop(x, y, 54, 24, 'tkr', 60, 3, (px, py, i, r) => `<circle cx="${f(px)}" cy="${f(py)}" r=".9" fill="${r < .5 ? '#f08a7a' : '#e86a5a'}"/>`, { lift: 1 });
        const [cx, cy] = onMound(x, y, 54, 24, 0, 0, 2);
        s += Array.from({ length: 10 }, (_, i) => `<path d="M${f(cx - 8 + i * 1.6)},${f(cy - 4 + (i % 3) * 2)} l6,${f(-2 + (i % 2) * 4)}" stroke="#3f8a2c" stroke-width="1.6" stroke-linecap="round"/>`).join('') + noriStrips(cx + 2, cy - 4, 20);
        return s;
    },
    // さわらの西京焼き: 長皿に、味噌の焼き色のついた切り身、大根（お好みで）
    saikyoyaki: p => {
        const D = Q.slabPlate(p), o = D.o, [x, y] = P(o, -14, 0), [ox, oy] = P(o, 54, 12);
        const R = rng('skc'); let c = ''; for (let i = 0; i < 9; i++) c += `<path d="${Q.blob(x - 40 + R() * 80, y - 8 - 8 + R() * 14, 4 + R() * 6, 2 + R() * 2, 'skc' + i, { jit: .5 })}" fill="${R() < .5 ? '#8a4a1a' : '#b8742e'}" opacity=".6"/>`;
        return D.s + fillet(p, x, y, 112, 62, -4, 'sk', { flesh: '#f0d8a8', skin: '#8a8070', char: .9, hgt: 10 }) + c + oroshi(p, ox, oy, 24);
    },

    // かじきのバター醤油ソテー: 切り身に照り、しめじ、ブロッコリー（お好みで）
    kajikisaute: p => {
        const D = Q.plate(p), o = D.o;
        const it = [[-22, -10, -8, 0], [22, 12, 8, 1]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => fillet(p, x, y, 66, 40, r, 'kj' + i, { flesh: '#f0dcc0', skin: '#a8a8a8', glaze: '#c8904a', hgt: 10 })]; });
        scatter('kjs', 4, 30, 14, { cu: 0, cv: 36 }).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v); it.push([y, () => shimeji(p, x, y, 14, r * 40 - 20, 3, i)]); });
        [[48, -30], [-50, 26]].forEach(([u, v], i) => { const [x, y] = P(o, u, v); it.push([y, () => broccoli(p, x, y, 20, i)]); });
        return D.s + Q.tarePool(p, 96, 116, 48, '#a8661e') + Q.byDepth(it);
    },
    // かに玉: ふっくらした卵にかにかま・長ねぎ・しいたけ、甘酢あん、グリーンピース（お好みで）
    kanitama: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 2);
        const c = chunk(p, x, y, 54, 44, 12, '#f4c84a', '#e8b030', 'kt', { jit: .1, n: 14, dome: .6 });
        let s = D.s + c.s;
        s += `<path d="${Q.blob(x, c.y + 2, 50, 38 * SY, 'ktan', { n: 14, jit: .12 })}" fill="${Q.rg(p, [[0, '#f8c070', .75], [1, '#d8803a', .75]], .4, .35, .7)}"/>`;
        const it = scatter('ktk', 14, 40, 10).map(([u, v, r], i) => { const [px, py] = P({ cx: x, cy: c.y + 2 }, u, v, 1); return [py, () => i % 4 === 0 ? Q.prism(p, px, py, [[-6, -1.8], [6, -1.8], [6, 1.8], [-6, 1.8]], 2.4, '#e84a32', { rot: r * 180, top: Q.lg(p, [[0, '#f8f4ec'], [.5, '#f08a6a'], [1, '#e04a2a']], 0, 0, 0, 1) }) : i % 4 === 1 ? Q.negi(p, px, py, 4.6) : i % 4 === 2 ? Q.pea(p, px, py, 2.4) : `<path d="M${f(px - 4)},${f(py)} l8,1" stroke="#7a5030" stroke-width="2.2" stroke-linecap="round"/>`]; });
        return s + Q.byDepth(it) + Q.shine(x - 24, c.y - 8, 22, -8);
    },
    // 豆腐ステーキ: 焼き色の豆腐に甘辛だれ、豚ひき肉と万能ねぎ（お好みで）
    tofusteak: p => {
        const D = Q.plate(p), o = D.o;
        const it = [[-24, -6, 0], [26, 8, 1]].map(([u, v, i]) => { const [x, y] = P(o, u, v); return [y, () => { const q = Q.prism(p, x, y, Q.square(42), 16, '#f2e8d0', { rot: i ? 8 : -6, top: Q.rg(p, [[0, '#e8b46a'], [.6, '#c8843a'], [1, '#9a5a20']], .4, .35, .8), line: .6 }); const ty = y - 16 * CZ; return q + onTop(x, ty, 16, 2, 'tfm' + i, 8, 5, (px, py, k, r) => `<circle cx="${f(px)}" cy="${f(py)}" r="1.8" fill="#8a5a34"/>`) + onTop(x, ty, 16, 2, 'tfn' + i, 6, 6, (px, py) => Q.negi(p, px, py, 4, '#5aa83a')) + Q.shine(x - 8, ty - 3, 12, -6); }]; });
        return D.s + Q.tarePool(p, 96, 118, 50, '#7a3e14') + Q.byDepth(it);
    },
    // あんかけ焼きそば: 焼いた中華麺に、とろみのあんと豚肉・えび・白菜・にんじん・しいたけ・うずらの卵（お好みで）
    ankakeyakisoba: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + Q.cast(p, x, y + 6, 58, 18, .3) + noodles(p, x, y, 58, 14, '#d8a858', 'ak', { w: 2.2, n: 80, len: 30, curl: 1.4 });
        s += `<path d="${Q.blob(x, y - 6, 48, 34 * SY, 'akan', { n: 14, jit: .15 })}" fill="${Q.rg(p, [[0, '#f0d8a0', .85], [1, '#c8a060', .85]], .4, .35, .7)}"/>`;
        s += onTop(x, y - 6, 46, 6, 'akg', 16, 10, (px, py, i, r) => { const k = i % 6; return k === 0 ? Q.slice3q(p, px, py, 18, r * 180, { c: '#c48a62', fat: '#ead0b0', seed: i, gloss: .6, char: false }, { th: 1.4, tc: '#7a4a2a', sq: .6 }) : k === 1 ? Q.prawn3q(p, px, py, 14, r * 40 - 20, r < .5 ? 1 : -1) : k === 2 ? carrotStick(p, px, py, 11, r * 180) : k === 3 ? shiitake(p, px, py, 11) : k === 4 ? Q.lump(p, px, py, 5.4, 4.6, '#f6f0e0', 'aq' + i, { hi: .6 }) : Q.leaf(p, px, py, 18, r * 180, '#eef0d0', 'ak' + i, { wave: 2 }); }, { lift: 2 });
        return s + Q.shine(x - 24, y - 16, 22, -8);
    },
    // 豚肉のアスパラ巻き: 豚バラで巻いたアスパラを照り焼きに、ミニトマト（お好みで）
    asparamaki: p => {
        const D = Q.plate(p), o = D.o;
        const it = [[-30, -24], [-12, -10], [6, 4], [24, 18]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => {
            const L = 84, rot = -14;
            let g = greenPod(p, 0, 0, L, 0, { c: '#5a9a32', w: 9 });
            for (let k = 0; k < 5; k++) g += `<path d="M${-L * .32 + k * 11},-5.6 q3,5.6 0,11.2" stroke="#8a4a22" stroke-width="7" fill="none"/><path d="M${-L * .32 + k * 11},-5.6 q3,5.6 0,11.2" stroke="#c07a46" stroke-width="5" fill="none"/><path d="M${-L * .32 + k * 11 - 1},-4 q1,2 0,3" stroke="#f0d8b0" stroke-width="1.4" fill="none"/>`;
            return `<g ${T(x, y, rot)}>${g}</g>`; }]; });
        [[46, -36], [52, -20]].forEach(([u, v]) => { const [x, y] = P(o, u, v); it.push([y, () => Q.cast(p, x, y + 4, 8, 3, .3) + `<circle cx="${x}" cy="${y}" r="7.5" fill="${Q.dome(p, '#e0402a')}" stroke="#a82416" stroke-width=".6"/><path d="M${x - 2},${y - 7} l2,-2 l2,2" stroke="#3f8a2c" stroke-width="1.4" fill="none"/>`]); });
        return D.s + Q.tarePool(p, 96, 116, 46, '#8a4a1a') + Q.byDepth(it);
    },
    // 鶏つくね: 長皿に照りのつくねを並べ、大葉（お好みで）を敷く
    tsukune: p => {
        const D = Q.slabPlate(p), o = D.o;
        const it = [[-54, 0], [-18, 4], [18, 0], [54, 4]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => Q.leaf(p, x - 4, y + 6, 40, 10 + i * 20, '#3f8a2c', 'tsl' + i, { wave: 2 }) + (() => { const c = chunk(p, x, y, 18, 30, 12, '#9a5422', '#7a3e16', 'ts' + i, { jit: .1, dome: .7 }); return c.s + Q.shine(x - 5, c.y - 4, 10, -10); })()]; });
        return D.s + Q.byDepth(it);
    },
    // かつ丼: どんぶりに、卵でとじたとんかつと玉ねぎ、三つ葉（お好みで）
    katsudon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 4, c: '#e8b84a', glow: .35 });
        const it = [];
        [-30, -15, 0, 15, 30].forEach((v, i) => { const [x, y] = P(S.o, -2 + i, v, 4); it.push([y, () => { const c = chunk(p, x, y, 42 - Math.abs(v) * .3, 8, 10, '#c88838', '#f4e6d0', 'kd' + i, { rot: -3, jit: .06, n: 12, dome: .3 }); return c.s + `<g ${Q.clip(p, c.d)}>${Array.from({ length: 18 }, (_, k) => `<circle cx="${f(x - 36 + (k * 37 % 72))}" cy="${f(c.y - 3 + (k * 13 % 6))}" r="1.1" fill="#a86a24" opacity=".6"/>`).join('')}</g>`; }]); });
        const egg = softEgg(p, S.cx, S.cy, S.rx, 3, { n: 10 });
        const [hx, hy] = P(S.o, 20, -10, 12);
        return V.s + S.s + `<g ${V.above}>${Q.byDepth(it)}${egg}${herb(p, hx, hy, 18, 20, '#5aa83a')}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },
    // ちらし寿司: 赤い器の酢飯に、錦糸卵・しいたけ・にんじん・れんこん・えび・いんげん・のり（お好みで）
    chirashi: p => {
        const V = Q.vessel(p, { cy: 84, rx: 92, h: 40, fx: 54, ft: 5, outer: '#9a2c1e', lip: '#b23a28', inner: '#4a2018', line: 'thin', rim: Q.RIM.kin, belly: .5 }), S = Q.surface(p, V, { drop: 5, c: '#f6f1e2', glow: .3 });
        let t = kinshi(S.cx, S.cy, S.rx * 1.4, 2) + kinshi(S.cx - 10, S.cy + 6, S.rx * 1.2, 3);
        const it = scatter('cs', 22, 62, 10).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v, 2); const k = i % 6; return [y, () => k === 0 ? Q.prawn3q(p, x, y, 14, r * 40 - 20, r < .5 ? 1 : -1) : k === 1 ? shiitake(p, x, y, 10) : k === 2 ? carrotStick(p, x, y, 10, r * 180) : k === 3 ? `<ellipse cx="${f(x)}" cy="${f(y)}" rx="6" ry="3.6" fill="#f2ead8" stroke="#c8b898" stroke-width=".6"/>${[0, 1, 2, 3].map(j => `<circle cx="${f(x - 3 + j * 2)}" cy="${f(y)}" r=".9" fill="#c8b898"/>`).join('')}` : k === 4 ? greenPod(p, x, y, 12, r * 180, { w: 3 }) : `<path d="M${f(x - 4)},${f(y)} l8,1" stroke="#2e3a26" stroke-width="1.4"/>`]; });
        return V.s + S.s + `<g ${V.inside}>${t}${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.4);
    },
    // おかゆ（白がゆ）: 土鍋に白がゆだけ
    okayu: p => kayu(p, 'okayu', () => '', { vessel: p => Q.donabe(p) }),
    // 卵がゆ: 卵と長ねぎ、刻みのり（お好みで）
    tamagogayu: p => kayu(p, 'tamago', S => softEgg(p, S.cx, S.cy, S.rx * .8, 5, { n: 14 }) + scatter('tgn', 8, S.rx * .7, 12).map(([u, v]) => { const [x, y] = P(S.o, u, v * .9); return Q.negi(p, x, y, 6.4); }).join('') + noriStrips(S.cx + 6, S.cy - 4, 26, 4)),

    // 梅がゆ: 梅干し、大葉と白ごま（お好みで）
    umegayu: p => kayu(p, 'ume', S => { const [x, y] = P(S.o, 0, -4, 2); return Q.leaf(p, x - 12, y + 4, 40, 20, '#3f8a2c', 'ume') + Q.lump(p, x, y - 2, 14, 12, '#c8303a', 'ume', { hi: .7 }) + Q.lump(p, x + 22, y + 8, 12, 10, '#c8303a', 'ume2', { hi: .7 }) + sesame(S.cx - 20, S.cy + 10, 30, 2); }),
    // 鮭がゆ: ほぐした塩鮭、長ねぎと刻みのり（お好みで）
    shakegayu: p => kayu(p, 'shake', S => scatter('skf', 12, S.rx * .7, 13).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v * .9, 1); return i % 3 === 2 ? Q.negi(p, x, y, 6.4) : `<path d="${Q.blob(x, y, 9 + r * 3, 5, 'sk' + i, { jit: .45 })}" fill="${Q.lit(p, '#f08a5a')}" stroke="#c8603a" stroke-width=".5"/>`; }).join('') + noriStrips(S.cx + 10, S.cy - 6, 16, 6)),
    // 七草がゆ: 刻んだ春の七草（緑の葉と白い根）
    nanakusagayu: p => kayu(p, 'nana', S => scatter('nk', 16, S.rx * .8, 12).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v * .9, 1); return i % 4 === 3 ? `<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="#fbfaf2" stroke="#d8d2c0" stroke-width=".5"/>` : Q.leaf(p, x, y, 20, r * 180, i % 2 ? '#4f9a34' : '#3a7a2a', 'nk' + i, { wave: 1.5, vein: false }); }).join('')),
    // 中華がゆ: 鶏肉と生姜、長ねぎと白ごま（お好みで）、ごま油
    chukagayu: p => kayu(p, 'chuka', S => scatter('ck', 12, S.rx * .75, 13).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v * .9, 1); return i % 3 === 0 ? chunk(p, x, y, 10, 8, 4, '#f0dcc0', '#e8d0b0', 'ckc' + i, { jit: .3, n: 8 }).s : i % 3 === 1 ? `<path d="M${f(x - 6)},${f(y)} l12,1" stroke="#e8c050" stroke-width="2.4" stroke-linecap="round"/>` : Q.negi(p, x, y, 6.4); }).join('') + sesame(S.cx, S.cy, 40, 3) + `<ellipse cx="${f(S.cx + 14)}" cy="${f(S.cy + 4)}" rx="10" ry="3" fill="#e8b850" opacity=".35"/>`, { c: '#f2ecdc' }),
    // さつまいもがゆ: 角切りのさつまいも
    satsumaimogayu: p => kayu(p, 'satsu', S => Q.byDepth(scatter('sm', 8, S.rx * .7, 20).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v * .9, 0); return [y, () => Q.prism(p, x, y, Q.square(16), 9, '#f2c050', { rot: r * 90, top: Q.lg(p, [[0, '#fbe08a'], [.8, '#f2c050'], [1, '#a8344a']], 0, 0, 1, 1), sink: 2 })]; }))),
    // かぼちゃがゆ: 角切りのかぼちゃ（緑の皮）
    kabochagayu: p => kayu(p, 'kabo', S => Q.byDepth(scatter('kb', 8, S.rx * .7, 20).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v * .9, 0); return [y, () => Q.prism(p, x, y, Q.square(17), 10, '#f0a830', { rot: r * 90, top: Q.lg(p, [[0, '#fbd070'], [.75, '#f0a830'], [.8, '#3a6a2a'], [1, '#2a5420']], 0, 0, 1, 1), sink: 2 })]; })), { c: '#f6ecd0' }),
    // 小豆がゆ: 小豆の色がうつった薄紅のおかゆと小豆
    azukigayu: p => kayu(p, 'azuki', S => scatter('az', 30, S.rx * .85, 8).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v * .9, 0); return Q.bean(p, x, y, 8, r * 180, '#7a2a2a'); }).join(''), { c: '#ecd4cc' }),
    // きのこがゆ: しめじ・えのき・しいたけ（お好みで）、三つ葉（お好みで）
    kinokogayu: p => kayu(p, 'kinoko', S => Q.byDepth(scatter('kn', 9, S.rx * .7, 18).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v * .9, 1); return [y, () => i % 3 === 0 ? shimeji(p, x, y, 20, r * 40 - 20, 3, i) : i % 3 === 1 ? `<path d="M${f(x - 9)},${f(y)} l18,1 M${f(x - 9)},${f(y + 3)} l18,0 M${f(x - 9)},${f(y - 3)} l18,1" stroke="#d8ccb0" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(x - 9)},${f(y)} l18,1 M${f(x - 9)},${f(y + 3)} l18,0 M${f(x - 9)},${f(y - 3)} l18,1" stroke="#fbf6e6" stroke-width="1.6" stroke-linecap="round"/>` : shiitake(p, x, y, 18)]; })) + (() => { const [x, y] = P(S.o, 18, -20, 2); return herb(p, x, y, 24, 0, '#5aa83a'); })(), { c: '#f0e8d8' }),
    // タンドリーチキン: 赤いスパイスの焼き色の鶏もも、レモンとサニーレタス（お好みで）
    tandoori: p => {
        const D = Q.plate(p), o = D.o;
        const it = [[-28, -10, -10], [8, -16, 10], [30, 10, -6], [-12, 16, 14]].map(([u, v, r], i) => { const [x, y] = P(o, u, v, 2); return [y, () => { const c = chunk(p, x, y, 22, 16, 12, '#c8441e', '#a8301a', 'td' + i, { rot: r, jit: .2, dome: .6 }); return c.s + `<g ${Q.clip(p, c.d)}><path d="${Q.blob(x + 6, c.y + 2, 10, 6, 'tdb' + i, { jit: .5 })}" fill="#6a1e0e" opacity=".45"/><path d="${Q.blob(x - 8, c.y - 3, 8, 4, 'tdh' + i, { jit: .5 })}" fill="#f0884a" opacity=".55"/></g>` + Q.shine(x - 6, c.y - 4, 12, -10, .7); }]; });
        const [lx, ly] = P(o, -44, -32); it.unshift([ly - 20, () => Q.leaf(p, lx, ly, 46, 20, '#6aa83a', 'sl', { wave: 4 }) + Q.leaf(p, lx + 10, ly + 2, 30, -10, '#a8344a', 'sl2', { wave: 3, op: .6 })]);
        const [cx, cy] = P(o, 50, 30); it.push([cy, () => citrus(p, cx, cy, 26, -20)]);
        return D.s + Q.byDepth(it);
    },
    // ミートソーススパゲッティ: スパゲッティにミートソース、粉チーズ（お好みで）
    meatsauce: p => {
        const D = Q.plate(p), o = D.o, [x, y] = P(o, 0, 4);
        let s = D.s + Q.cast(p, x, y + 6, 58, 18, .3) + noodles(p, x, y, 58, 20, '#f0d88a', 'mt', { w: 2.4, n: 90, len: 34 });
        const [mx, my] = onMound(x, y, 58, 20, 0, 0, 0);
        s += `<path d="M${mx - 36},${my + 8} Q${mx - 30},${my - 16} ${mx},${my - 16} Q${mx + 30},${my - 16} ${mx + 36},${my + 8} Q${mx},${my + 20} ${mx - 36},${my + 8}Z" fill="${Q.rg(p, [[0, '#d8502a'], [.6, '#a8341a'], [1, '#7a2210']])}"/>`;
        s += onTop(mx, my + 2, 32, 12, 'mtm', 40, 4, (px, py, i, r) => `<circle cx="${f(px)}" cy="${f(py)}" r="${f(1.6 + r)}" fill="${r < .4 ? '#7a3a1a' : r < .7 ? '#c84a24' : '#ec7b2d'}"/>`, { lift: 1 });
        s += onTop(mx, my + 2, 28, 12, 'mtc', 24, 4, (px, py) => `<circle cx="${f(px)}" cy="${f(py)}" r=".9" fill="#fffbe8"/>`, { lift: 3 });
        return s + Q.shine(mx - 14, my - 10, 16, -8);
    },

    // おにぎり（鮭・梅・おかか）: 平皿に立てた三角のおにぎり3つ、のりを巻いて上に具をのぞかせる
    onigiri: p => {
        const D = Q.plate(p), o = D.o;
        const one = (x, y, r, top, seed) => {
            const w = 30, h = 34, tri = `M${-w},${h * .42} Q${-w - 2},${h * .52} ${-w * .7},${h * .55} L${w * .7},${h * .55} Q${w + 2},${h * .52} ${w},${h * .42} L${w * .2},${-h * .5} Q0,${-h * .62} ${-w * .2},${-h * .5}Z`;
            const R = rng('og' + seed);
            let g = `<path d="${tri}" transform="translate(5 3)" fill="#d8d0bc"/><path d="${tri}" fill="${Q.rg(p, [[0, '#ffffff'], [.6, '#f6f2e6'], [1, '#d8cfb8']], .35, .3, .85)}" stroke="#c8bea6" stroke-width=".7"/>`;
            for (let i = 0; i < 40; i++){ const gx = (R() - .5) * w * 1.4, gy = -h * .4 + R() * h * .9; if (Math.abs(gx) > w * (gy + h * .55) / (h * 1.05) * .95) continue; g += `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="2.2" ry="1.2" transform="rotate(${f(R() * 180)} ${f(gx)} ${f(gy)})" fill="#fffef8" stroke="#ddd5c2" stroke-width=".3"/>`; }
            g += `<path d="M${-w * .55},${h * .55} L${-w * .42},${h * .05} L${w * .42},${h * .05} L${w * .55},${h * .55}Z" fill="${Q.lg(p, [[0, '#3e4a32'], [.5, '#2e3a26'], [1, '#26301e']], 0, 0, 1, 0)}"/><path d="M${-w * .38},${h * .12} L${w * .1},${h * .12}" stroke="#5a6a48" stroke-width="1" opacity=".7"/>`;
            g += top;
            return Q.cast(p, x, y + h * .5, w * .9, 6, .35) + `<g ${T(x, y, r)}>${g}</g>`;
        };
        const it = [[-38, -6, -8, `<path d="${Q.blob(0, -14, 7, 4, 'ogs', { jit: .4 })}" fill="#f08a5a" stroke="#c8603a" stroke-width=".5"/>`], [38, -6, 8, `<ellipse cx="0" cy="-14" rx="6" ry="4.4" fill="${Q.dome(p, '#c8303a')}"/>`], [0, 14, 0, `<path d="${Q.blob(0, -14, 8, 4, 'ogk', { jit: .5 })}" fill="#b8784a" stroke="#8a5430" stroke-width=".5"/>`]].map(([u, v, r, top], i) => { const [x, y] = P(o, u, v); return [y, () => one(x, y - 12, r, top, i)]; });
        return D.s + Q.byDepth(it);
    },
    // 天丼: どんぶりのたれご飯に、えび・かぼちゃ・なすの天ぷら、しし唐（お好みで）
    tendon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 4, c: '#e8d8b0', glow: .3 });
        const batter = (x, y, rx, ry, seed) => { const d = Q.blob(x, y, rx, ry, 'tb' + seed, { n: 14, jit: .3 }); return Q.dropOf(p, d, 2, 3, .32, 1.6) + `<path d="${d}" fill="${Q.rg(p, [[0, '#f8dc8a'], [.6, '#e8b850'], [1, '#b8782a']], .36, .3, .8)}" stroke="#a86a24" stroke-width=".6" ${p.rough(2.2, .14)}/>` + Q.shine(x - rx * .3, y - ry * .3, rx * .5, -10, .6); };
        const it = [];
        [[-20, -10, -30], [16, -18, -20]].forEach(([u, v, r], i) => { const [x, y] = P(S.o, u, v, 10); it.push([y, () => `<g ${T(x, y, r)}>${batter(0, 0, 30, 9, 'e' + i)}<path d="M28,-2 l12,-8 l2,8 l-10,6Z" fill="#e8502a" stroke="#a83a1c" stroke-width=".6"/><path d="M30,-2 l9,-5" stroke="#f8a080" stroke-width="1"/></g>`]); });
        { const [x, y] = P(S.o, -30, 22, 6); it.push([y, () => batter(x, y, 18, 12, 'k') + `<path d="M${f(x - 16)},${f(y + 8)} Q${f(x)},${f(y + 15)} ${f(x + 16)},${f(y + 8)}" stroke="#3a6a2a" stroke-width="3" fill="none" stroke-linecap="round"/>`]); }
        { const [x, y] = P(S.o, 24, 22, 6); it.push([y, () => batter(x, y, 18, 11, 'n') + `<path d="M${f(x - 15)},${f(y + 7)} Q${f(x)},${f(y + 13)} ${f(x + 15)},${f(y + 7)}" stroke="#5a2a5c" stroke-width="3" fill="none" stroke-linecap="round"/>`]); }
        { const [x, y] = P(S.o, 50, 0, 6); it.push([y, () => greenPod(p, x, y, 26, 60)]); }
        return V.s + S.s + `<g ${V.inside}>${Q.tarePool(p, S.cx + 6, S.cy + 4, 50, '#a8642a')}</g>` + `<g ${V.above}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },
    // 鮭茶漬け: 茶碗のご飯に熱いお茶をかけ、ほぐした塩鮭・のり・三つ葉・白ごま・わさび（お好みで）
    ochazuke: p => {
        const V = Q.chawan(p, { outer: '#dce8d0', lip: '#eef4e6', inner: '#e4ecd8' }), S = Q.surface(p, V, { drop: 8, c: '#d8cc8a', glow: .35 });
        const R = rng('oz');
        let t = '';
        for (let i = 0; i < 70; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * .9, x = S.cx + Math.cos(a) * d * S.rx, y = S.cy + Math.sin(a) * d * S.ry; t += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="1.3" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="#fbf8ee" opacity=".85"/>`; }
        t += scatter('ozs', 8, S.rx * .5, 12).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v, 1); return `<path d="${Q.blob(x, y, 8 + r * 3, 4.6, 'oz' + i, { jit: .45 })}" fill="${Q.lit(p, '#f08a5a')}" stroke="#c8603a" stroke-width=".5"/>`; }).join('');
        const [hx, hy] = P(S.o, 20, -14, 2);
        t += noriStrips(S.cx - 6, S.cy - 2, 26, 2) + herb(p, hx, hy, 20, 10, '#5aa83a') + sesame(S.cx + 4, S.cy + 8, 30, 4) + `<path d="${Q.blob(S.cx - 26, S.cy + 10, 6, 3.4, 'wsb')}" fill="${Q.dome(p, '#9ac46a')}"/>`;
        return V.s + S.s + `<g ${V.inside}>${t}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6) + Q.steam(100, 30, .4);
    },
    // 卵かけご飯: 茶碗のご飯の山に生卵、刻みのりと長ねぎ（お好みで）、醤油
    tkg: p => {
        const V = Q.chawan(p), cx = 100, cy = V.cy + 2, H = 44;
        const [ex, ey] = onMound(cx, cy, V.irx - 1, H, -4, -6, 0);
        const white = Q.blob(ex, ey + 2, 38, 18, 'tkw', { n: 12, jit: .2 });
        return V.s + `<g ${V.above}>${Q.riceDome(p, cx, cy, V.irx - 1, V.iry, H)}<path d="${white}" fill="#f4eccc" opacity=".55" stroke="#e8d8a8" stroke-width=".6"/>` +
            `<ellipse cx="${f(ex + 1.5)}" cy="${f(ey + 3)}" rx="17" ry="12" fill="#c47a10" opacity=".35"/><ellipse cx="${f(ex)}" cy="${f(ey)}" rx="17" ry="12.5" fill="${Q.rg(p, [[0, '#ffd45a'], [.6, '#f6a81a'], [1, '#d8800c']], .36, .3, .75)}"/><ellipse cx="${f(ex - 4)}" cy="${f(ey - 3.5)}" rx="4" ry="2.2" fill="#fff" opacity=".9"/>` +
            `<path d="M${f(ex + 10)},${f(ey + 6)} q6,3 12,2" stroke="#7a3a14" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>` + noriStrips(ex + 16, ey - 8, 16, 7) + [[-24, 10], [22, 14], [-14, 18]].map(([dx, dy]) => Q.negi(p, ex + dx, ey + dy, 5.4)).join('') + '</g>';
    },
    // 赤飯: 茶碗の薄紅のもち米に、ささげと黒ごま（焦げ茶）
    sekihan: p => {
        const V = Q.chawan(p), cx = 100, cy = V.cy + 2, H = 44, rx = V.irx - 1;
        return V.s + `<g ${V.above}>${grainDome(p, cx, cy, rx, H, 'sh', { pal: ['#fae4e0', '#ecc4c0', '#cc9a98', '#c08a88'], n: 500 })}` + onTop(cx, cy, rx, H, 'shb', 26, 10, (x, y, i, r) => Q.bean(p, x, y, 7.6, r * 180, '#8a2a32')) + onTop(cx, cy, rx, H, 'shg', 30, 5, (x, y, i, r) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.3" ry=".7" transform="rotate(${f(r * 180)} ${f(x)} ${f(y)})" fill="#3a2a22"/>`, { lift: 1 }) + '</g>';
    },
    // 五目炊き込みご飯: 茶碗に、醤油色のご飯と鶏肉・にんじん・ごぼう・しいたけ・油揚げ
    gomokutakikomi: p => {
        const V = Q.chawan(p), cx = 100, cy = V.cy + 2, H = 40, rx = V.irx - 1;
        let s = V.s + `<g ${V.above}>${grainDome(p, cx, cy, rx, H, 'gm', { pal: ['#f0dcae', '#dcbc84', '#b8955a', '#a8844a'], n: 460 })}`;
        s += onTop(cx, cy, rx, H, 'gmi', 16, 12, (x, y, i, r) => { const k = i % 5; return k === 0 ? chunk(p, x, y, 6, 5, 3, '#f0d8b0', '#d8b888', 'gmc' + i, { jit: .3, n: 8 }).s : k === 1 ? carrotStick(p, x, y, 10, r * 180) : k === 2 ? `<path d="M${f(x - 6)},${f(y)} l12,${f((r - .5) * 3)}" stroke="#6a4a2a" stroke-width="2.4" stroke-linecap="round"/>` : k === 3 ? shiitake(p, x, y, 10) : Q.prism(p, x, y, [[-6, -2], [6, -2], [6, 2], [-6, 2]], 2.4, '#d8a050', { rot: r * 180 }); });
        return s + '</g>';
    },
    // いなり寿司: 長皿に甘く煮た油揚げの包み4つ（口から酢飯）、紅しょうが（お好みで）
    inarizushi: p => {
        const D = Q.slabPlate(p), o = D.o;
        const it = [[-54, 0], [-18, 4], [18, 0], [54, 4]].map(([u, v], i) => { const [x, y] = P(o, u, v); return [y, () => { const c = chunk(p, x, y, 20, 36, 14, '#c88a3a', '#a86a24', 'in' + i, { jit: .22, dome: .8, n: 10 }); const mouth = Q.blob(x, c.y - 6, 12, 5.4, 'inm' + i, { jit: .2 }); return c.s + `<path d="${mouth}" fill="${Q.rg(p, [[0, '#ffffff'], [1, '#e8e0cc']], .4, .4, .8)}" stroke="#a86a24" stroke-width=".6"/>` + sesame(x, c.y - 4, 12, i, '#f4e8c8') + Q.shine(x - 6, c.y + 6, 10, -10, .6); }]; });
        const [bx, by] = P(o, 64, 30); it.push([by, () => benishoga(p, bx, by, 16, 3)]);
        return D.s + Q.byDepth(it);
    },
    // 卵雑炊: 土鍋のだしのご飯に、とじ卵・長ねぎ・しいたけ（お好みで）・三つ葉（お好みで）
    zosui: p => kayu(p, 'zosui', S => softEgg(p, S.cx, S.cy, S.rx * .85, 9, { n: 14 }) + Q.byDepth(scatter('zs', 12, S.rx * .75, 12).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v * .9, 1); return [y, () => i % 3 === 0 ? shiitake(p, x, y, 14) : Q.negi(p, x, y, 6.4)]; })) + (() => { const [x, y] = P(S.o, 16, -18, 2); return herb(p, x, y, 22, 0, '#5aa83a'); })(), { c: '#ecdcb0', vessel: p => Q.donabe(p) }),
    // そうめん: ガラスの鉢の冷水にそうめん、きゅうり・錦糸卵・みょうが・大葉・長ねぎ（お好みで）
    somen: p => {
        const V = Q.vessel(p, { cy: 82, rx: 92, h: 44, fx: 50, ft: 4, outer: '#c8dcc4', lip: '#e8f2e4', inner: '#dcead8', line: 'thin', rim: Q.RIM.wakakusa, belly: .5, gloss: .8 }), S = Q.surface(p, V, { drop: 8, c: '#e2eedc', glow: .5, rimShade: .1 });
        let t = noodles(p, S.cx, S.cy, S.rx * .9, 0, '#fbf8ee', 'sm', { w: 1.6, n: 120, len: 40, curl: .5, flat: true, edge: '#d8d0bc' });
        const [ex, ey] = P(S.o, -10, -6, 2);
        t += kinshi(ex, ey, 30, 6) + Array.from({ length: 10 }, (_, i) => { const [x, y] = P(S.o, 18 + (i % 5) * 3, -10 + i * 2, 2); return `<path d="M${f(x - 5)},${f(y)} l10,1" stroke="#2f7a2a" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(x - 5)},${f(y - .5)} l10,1" stroke="#9ccc6a" stroke-width="1.2" stroke-linecap="round"/>`; }).join('');
        const [mx, my] = P(S.o, -30, 18, 2); t += `<path d="M${f(mx - 6)},${f(my)} l12,1 M${f(mx - 5)},${f(my + 3)} l11,0" stroke="#e8a0b0" stroke-width="2" stroke-linecap="round"/>`;
        const [lx, ly] = P(S.o, 30, 20, 2); t += Q.leaf(p, lx, ly, 26, -20, '#3f8a2c', 'smo');
        return V.s + S.s + `<g ${V.inside}>${t}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.8);
    },
    // ざるそば: 竹のざるにそばを盛り、刻みのり、長ねぎとわさび（お好みで）は小皿、つゆのそばちょこ
    zarusoba: p => {
        const D = Q.slabPlate(p, { d: 120, base: '#d8bc84', line: 'none', h: 7 }), o = D.o, R = rng('zr');
        let s = D.s;
        for (let i = -9; i <= 9; i++){ const [x1, y1] = P(o, -78, i * 5.6), [x2, y2] = P(o, 78, i * 5.6); s += `<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="#b8975e" stroke-width=".8" opacity=".7"/>`; }
        const [x, y] = P(o, -10, -4);
        s += Q.cast(p, x, y + 6, 54, 16, .3) + noodles(p, x, y, 54, 20, '#a89a86', 'zs', { w: 2, n: 110, len: 34 });
        s += onTop(x, y, 54, 20, 'zn', 1, 1, () => '') + (() => { const [cx, cy] = onMound(x, y, 54, 20, 0, 0, 2); return noriStrips(cx, cy, 34, 9) + noriStrips(cx - 6, cy + 6, 26, 10); })();
        const [cx, cy] = P(o, 62, 28);
        s += Q.cast(p, cx, cy + 12, 16, 6, .3) + `<path d="M${cx - 16},${cy} L${cx - 13},${cy + 14} A13,${f(13 * SY)} 0 0 0 ${cx + 13},${cy + 14} L${cx + 16},${cy}Z" fill="${Q.lg(p, [[0, '#f6f3ec'], [1, '#c8c0b0']])}"/><path d="${Q.eD(cx, cy, 16, 16 * SY)}" fill="#fbfaf6" stroke="${Q.RIM.kaki}" stroke-width="1.4"/><path d="${Q.eD(cx, cy + 1.6, 13.4, 13.4 * SY)}" fill="${Q.rg(p, [[0, '#7a4a24'], [1, '#4a2a14']])}"/>`;
        return s;
    },
    // きつねうどん: どんぶりのつゆにうどん、甘く煮た油揚げ・長ねぎ・かまぼこ（お好みで）
    kitsuneudon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 8, c: '#d8b070', glow: .35 });
        const [ax, ay] = P(S.o, -8, -6, 4);
        const age = Q.prism(p, ax, ay, [[-30, -18], [30, -24], [26, 20], [-28, 16]], 7, '#c88a3a', { rot: -6, top: Q.rg(p, [[0, '#e8b060'], [.6, '#c88a3a'], [1, '#9a6020']], .4, .35, .8) });
        const it = [[ay, () => age + Q.shine(ax - 12, ay - 10, 16, -8)]];
        scatter('kn', 6, 26, 9, { cu: 32, cv: 18 }).forEach(([u, v]) => { const [x, y] = P(S.o, u, v, 2); it.push([y, () => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="5" ry="2.8" fill="#e8f2cc" stroke="#6aa83a" stroke-width="1.2"/>`]); });
        [[-40, 20], [-26, 28]].forEach(([u, v], i) => { const [x, y] = P(S.o, u, v, 2); it.push([y, () => Q.prism(p, x, y, [[-9, -3], [9, -3], [9, 3], [-9, 3]], 5, '#fbf6ee', { rot: 10, top: Q.lg(p, [[0, '#fbf6ee'], [.7, '#fbf6ee'], [.72, '#e8708a'], [1, '#e8708a']], 0, 0, 0, 1) })]); });
        return V.s + S.s + `<g ${V.inside}>${udon(p, S.cx, S.cy + 2, S.rx * .9, 'ku')}${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },
    // カレーうどん: どんぶりのとろみのあるカレーのつゆに、うどん・豚肉・玉ねぎ・長ねぎ
    curryudon: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 6, c: '#c8902e', glow: .3 });
        const it = [];
        scatter('cu', 6, 46, 14).forEach(([u, v, r], i) => { const [x, y] = P(S.o, u, v, 2); it.push([y, () => Q.slice3q(p, x, y, 22, r * 180, { c: '#a8784a', fat: '#e8cfa8', seed: i, gloss: .4, char: false }, { th: 1.4, tc: '#6a3a1a', sq: .6 })]); });
        scatter('cun', 7, 50, 12).forEach(([u, v, r], i) => { const [x, y] = P(S.o, u, v, 2); it.push([y + .1, () => i % 2 ? onionStrip(x, y, 14, r * 180, '#e0b060') : `<g ${T(x, y, r * 60)}><ellipse rx="5.6" ry="3" fill="#e8f2cc" stroke="#6aa83a" stroke-width="1.2"/></g>`]); });
        const noodleTops = noodles(p, S.cx, S.cy + 4, S.rx * .8, 0, '#f6ead0', 'cud', { w: 4.6, n: 9, len: 30, curl: .6, flat: true, edge: '#c8a868' });
        return V.s + S.s + `<g ${V.inside}>${noodleTops}<path d="${Q.eD(S.cx, S.cy, S.rx, S.ry)}" fill="#c8902e" opacity=".35"/>${Q.byDepth(it)}${Q.shine(S.cx - 30, S.cy - 12, 22, -6)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },
    // 醤油ラーメン: どんぶりの醤油スープに中華麺、豚バラ・もやし・長ねぎ、ゆで卵（お好みで）
    ramen: p => {
        const V = Q.donburi(p), S = Q.surface(p, V, { drop: 8, c: '#a8682e', glow: .35 });
        let t = noodles(p, S.cx, S.cy + 2, S.rx * .9, 0, '#f2d888', 'rm', { w: 2, n: 60, len: 34, curl: 1.6, flat: true, edge: '#b8963e' });
        const it = [];
        [[-30, -16, -10], [-6, -22, 8]].forEach(([u, v, r], i) => { const [x, y] = P(S.o, u, v, 3); it.push([y, () => Q.slice3q(p, x, y, 34, r, { c: '#b07a52', fat: '#f0dcc0', seed: i + 3, gloss: .6, char: false }, { th: 1.8, tc: '#6a3a1a', sq: .62 })]); });
        { const [x, y] = P(S.o, 30, 6, 4); it.push([y, () => { const R = rng('rmy'); let m = Q.cast(p, x, y + 6, 18, 6, .3); for (let i = 0; i < 18; i++){ const dx = (R() - .5) * 30, dy = (R() - .5) * 12 - 4; m += `<path d="M${f(x + dx - 6)},${f(y + dy)} q6,${f(-3 + R() * 2)} 12,0" stroke="#d8ccb0" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${f(x + dx - 6)},${f(y + dy)} q6,${f(-3 + R() * 2)} 12,0" stroke="#fbf6e6" stroke-width="1.5" fill="none" stroke-linecap="round"/>`; } return m; }]); }
        { const [x, y] = P(S.o, -24, 22, 3); it.push([y, () => Q.cast(p, x, y + 4, 12, 4, .3) + `<ellipse cx="${x}" cy="${y}" rx="12" ry="8" fill="#fbf8ee" stroke="#d8d0bc" stroke-width=".6"/><ellipse cx="${x}" cy="${f(y + .5)}" rx="6" ry="4.4" fill="${Q.rg(p, [[0, '#ffc84a'], [1, '#e8901a']])}"/>`]); }
        scatter('rmn', 9, 30, 8, { cu: 6, cv: 30 }).forEach(([u, v]) => { const [x, y] = P(S.o, u, v, 2); it.push([y + .1, () => Q.negi(p, x, y, 5.4)]); });
        return V.s + S.s + `<g ${V.inside}>${t}${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, 40, 130) + V.shine(.6);
    },
    // 鮭の塩焼き: 長皿に塩鮭の切り身、大根おろしとレモン（お好みで）
    shakeshio: p => {
        const D = Q.slabPlate(p), o = D.o, [x, y] = P(o, -14, 0), [ox, oy] = P(o, 52, 12), [lx, ly] = P(o, 62, -14);
        return D.s + fillet(p, x, y, 110, 64, -4, 'ss', { flesh: '#f08a58', skin: '#96968e', char: .45, hgt: 10 }) + oroshi(p, ox, oy, 24) + soyDot(ox, oy - 12) + citrus(p, lx, ly, 22, -10);
    },
    // あじの開き（干物）: 長皿に開いたあじ、大根おろしとすだち（お好みで）
    ajihimono: p => {
        const D = Q.slabPlate(p), o = D.o, [x, y] = P(o, -12, -2), [ox, oy] = P(o, 56, 16), [sx, sy] = P(o, 62, -16);
        return D.s + wholeFish(p, x, y, 132, -2, 'aj', { open: true, char: .5, hgt: 5 }) + oroshi(p, ox, oy, 24) + soyDot(ox, oy - 12) + citrus(p, sx, sy, 18, 0, { c: '#7ab83a', half: true });
    },
    // ハムエッグ: ハムの上に目玉焼き2つ、ミニトマトとレタス（お好みで）
    hamuegg: p => {
        const D = Q.plate(p), o = D.o;
        const it = [[-22, -2, 0], [22, 2, 1]].map(([u, v, i]) => { const [x, y] = P(o, u, v); return [y, () => [0, 1].map(k => { const hd = Q.blob(x - 8 + k * 10, y + 4 - k * 4, 22, 22 * SY, 'hm' + i + k, { n: 14, jit: .06 }); return Q.dropOf(p, hd, 1.5, 2, .25) + `<path d="${hd}" transform="translate(0 1.4)" fill="#c87a80"/><path d="${hd}" fill="${Q.rg(p, [[0, '#f8c0c4'], [.7, '#f0a0a6'], [1, '#d8848c']], .4, .35, .8)}" stroke="#c87a80" stroke-width=".6"/>`; }).join('') + friedEgg(p, x, y - 2, 40, i)]; });
        const [lx, ly] = P(o, -10, -40); it.unshift([ly - 30, () => Q.leaf(p, lx, ly, 54, 0, '#8ac454', 'hl', { wave: 4 })]);
        [[48, -28], [56, -12]].forEach(([u, v]) => { const [x, y] = P(o, u, v); it.push([y, () => Q.cast(p, x, y + 4, 8, 3, .3) + `<circle cx="${x}" cy="${y}" r="7.5" fill="${Q.dome(p, '#e0402a')}" stroke="#a82416" stroke-width=".6"/><path d="M${x - 2},${y - 7} l2,-2 l2,2" stroke="#3f8a2c" stroke-width="1.4" fill="none"/>`]); });
        return D.s + Q.byDepth(it);
    },
    // 焼肉: 長皿に、たれの照りの牛カルビ、玉ねぎ・ピーマン・しいたけ、サンチュ（お好みで）
    yakiniku: p => {
        const D = Q.slabPlate(p), o = D.o;
        const it = [];
        [[-36, -14, -10], [-8, -18, 12], [-30, 10, 6], [0, 8, -14], [-14, 30, 4]].forEach(([u, v, r], i) => { const [x, y] = P(o, u, v); it.push([y, () => Q.slice3q(p, x, y, 50, r, { c: '#8a3e22', fat: '#e8c8a8', seed: i + 10, gloss: .8, char: true }, { th: 2.4, tc: '#4e1e0e', sq: .7 })]); });
        { const [x, y] = P(o, 40, -20); it.push([y, () => shiitake(p, x, y, 18, true)]); }
        { const [x, y] = P(o, 60, -6); it.push([y, () => shiitake(p, x, y, 16, true)]); }
        { const [x, y] = P(o, 36, 14); it.push([y, () => `<g ${T(x, y)}>${Q.cast(p, 0, 3, 12, 4, .3)}<ellipse rx="12" ry="7" fill="#f4ead0" stroke="#c8a870" stroke-width="1.2"/><ellipse rx="8" ry="4.6" fill="none" stroke="#c8a870" stroke-width="1"/><ellipse rx="4" ry="2.2" fill="none" stroke="#c8a870" stroke-width=".8"/></g>`]); }
        { const [x, y] = P(o, 58, 26); it.push([y, () => pepperBit(p, x, y, 20, 20) + pepperBit(p, x + 4, y + 6, 18, -10)]); }
        { const [x, y] = P(o, -62, -26); it.unshift([y - 30, () => Q.leaf(p, x, y, 46, 30, '#5aa83a', 'sc', { wave: 4 })]); }
        return D.s + Q.tarePool(p, 84, 112, 40, '#6e3012') + Q.byDepth(it);
    },
};
