// 花森 ゆず 担当（斜め上35度）: 和え物・揚げ物・副菜の炒めと焼き・主菜の炒め物 73品
// 基準: docs/illustration_3q.md。材料は gohancho/index.html の R(...) 行どおり（「?」はお好みで）。黒は使わない（いちばん暗い色は焦げ茶）
import * as Q from '../kit3q.mjs';
import * as K from '../kit.mjs';
const { f, rng, lt, dk, mix, T, SY, CZ, SHADE } = Q;

// =========================================================
// 共通の小道具
// =========================================================
// 面の上に重ならないよう点を散らす（u, v は面の座標）
function scatter(seed, n, rx, minD, { ry = rx, ex = [], exD = 0, cu = 0, cv = 0 } = {}){
    const R = rng('hm' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.283, d = Math.sqrt(R()), u = cu + Math.cos(a) * d * rx, v = cv + Math.sin(a) * d * ry;
        if (out.every(([x, y]) => Math.hypot(x - u, y - v) >= minD) && ex.every(([x, y]) => Math.hypot(x - u, y - v) >= exD)) out.push([u, v, R()]);
    }
    return out;
}
const P = (o, u, v, z = 0) => Q.at(o, u, v, z);
// 中心ほど高い山の高さ
const hill = (u, v, R, H, k = .8) => H * Math.max(0, 1 - (u * u + v * v) / R / R) ** k;
// 平らに広がるソース・たれ・汁（面に置いた形を縦につぶす）
function pool(p, x, y, rx, c, seed, { op = .9, rz = rx * .7, gloss = true } = {}){
    const d = Q.blob(x, y, rx, rz * SY, 'hpl' + seed, { n: 10, jit: .25 });
    return `<path d="${d}" fill="${Q.rg(p, [[0, lt(c, .25)], [.6, c], [1, dk(c, .25)]], .4, .35, .7)}" opacity="${op}"/>` +
        (gloss ? `<path d="M${f(x - rx * .55)},${f(y - rz * SY * .25)} Q${f(x - rx * .2)},${f(y - rz * SY * .6)} ${f(x + rx * .2)},${f(y - rz * SY * .55)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/>` : '');
}
const gl = (x, y, w, r = -8, op = .75) => Q.shine(x, y, w, r, op);
// 厚みのある塊（面の形 rx × rz を高さ hgt で立ち上げる）。top は上の面、side は側面
function chunk(p, x, y, rx, rz, hgt, top, side, seed, { rot = 0, jit = .14, n = 12, dome = .5, sharp = false } = {}){
    const d = Q.blob(x, y, rx, rz * SY, 'hck' + seed, { n, jit, rot, sharp });
    const steps = Math.max(3, Math.round(hgt * CZ / 1.1));
    let s = Q.dropOf(p, d, 2.4, hgt * CZ * .5 + 2.6, .34, 2);
    for (let i = steps; i >= 1; i--) s += `<path d="${d}" transform="translate(0 ${f(-hgt * CZ * (1 - i / steps))})" fill="${mix(dk(side, .3), side, 1 - i / steps)}"/>`;
    const td = Q.blob(x, y - hgt * CZ, rx, rz * SY, 'hck' + seed, { n, jit, rot, sharp });
    s += `<path d="${td}" fill="${Q.rg(p, [[0, lt(top, .3 * dome + .1)], [.6, top], [1, dk(top, .2)]], .36, .3, .8)}" stroke="${dk(side, .4)}" stroke-width=".7"/>`;
    return { s, d: td, y: y - hgt * CZ };
}
// 衣の粒（パン粉・唐揚げの衣）: 形 d の中に明るい粒と焦げの粒
function crumbs(p, d, x, y, rx, ry, seed, { n = 40, light = '#f6d68a', dark = '#a8622a', r = 1.3 } = {}){
    const R = rng('cr' + seed);
    let o = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.283, q = Math.sqrt(R()), cx = x + Math.cos(a) * q * rx, cy = y + Math.sin(a) * q * ry, rr = r * (.6 + R() * .8); o += `<path d="${Q.blob(cx, cy, rr * 1.3, rr, 'cg' + seed + i, { n: 5, jit: .5, sharp: true, rot: R() * 180 })}" fill="${R() < .62 ? light : dark}" opacity=".85"/>`; }
    return `<g ${Q.clip(p, d)}>${o}</g>`;
}
// 揚げた塊（唐揚げ・油淋鶏）: でこぼこの衣、照りと粒
function fried(p, x, y, rx, ry, seed, { c = '#c47c30', crumb = true } = {}){
    const d = Q.blob(x, y, rx, ry, 'fr' + seed, { n: 11, jit: .38 });
    return Q.dropOf(p, d, 2, 2.8, .36, 1.6) + `<path d="${d}" fill="${Q.rg(p, [[0, lt(c, .42)], [.5, c], [1, dk(c, .38)]], .34, .3, .8)}" stroke="${dk(c, .45)}" stroke-width=".7"/>` +
        (crumb ? crumbs(p, d, x, y, rx, ry, seed, { n: 18, light: lt(c, .5), dark: dk(c, .4), r: 1.6 }) : '') +
        `<path d="M${f(x - rx * .55)},${f(y - ry * .1)} Q${f(x - rx * .4)},${f(y - ry * .65)} ${f(x + rx * .1)},${f(y - ry * .72)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// パン粉の衣の揚げ物（とんかつ・コロッケ・フライ）。cuts で切り分けの線、cutC は断面の色
function breaded(p, x, y, rx, rz, hgt, seed, { rot = 0, cuts = 0, cutC = '#f2dcc0', c = '#d4943e', n = 14, jit = .1 } = {}){
    const ck = chunk(p, x, y, rx, rz, hgt, c, dk(c, .1), 'br' + seed, { rot, jit, n, dome: .5 });
    let s = ck.s + crumbs(p, ck.d, x, ck.y, rx, rz * SY, seed, { n: Math.round(rx * rz / 14), light: '#f8dc90', dark: '#a8602a', r: 1.4 });
    if (cuts){
        const a = rot * Math.PI / 180;
        for (let i = 1; i <= cuts; i++){ const t = -rx + 2 * rx * i / (cuts + 1), cx = x + Math.cos(a) * t, cy = ck.y + Math.sin(a) * t * SY;
            s += `<g ${Q.clip(p, ck.d)}><path d="M${f(cx - 3)},${f(cy - rz * SY)} L${f(cx + 3)},${f(cy + rz * SY + 2)}" stroke="${cutC}" stroke-width="2.6"/><path d="M${f(cx - 1.4)},${f(cy - rz * SY)} L${f(cx + 4.6)},${f(cy + rz * SY + 2)}" stroke="${dk(c, .4)}" stroke-width="1"/></g>`;
            s += `<path d="M${f(cx + 3)},${f(cy + rz * SY - .5)} l0,${f(hgt * CZ)}" stroke="${cutC}" stroke-width="2.4"/>`; }
    }
    return { s: s + gl(x - rx * .4, ck.y - rz * SY * .3, rx * .5, rot - 6, .45), d: ck.d, y: ck.y };
}
// 切り分けた揚げ物（とんかつ・チキン南蛮・油淋鶏）: 切り身ごとに角柱を立て、切り口（肉の色）と衣の側面を描き分ける
// o は面の中心、(u, v) は全体の中心、L × W は面での長さと幅、H は厚み、n 切れ、rot は向き（度）
function cutlet(p, o, { u = 0, v = 0, L = 110, W = 44, H = 12, n = 5, rot = -10, gap = 3, crust = '#d4943e', meat = '#f4e0c4', seed = 1, crumb = true, top = null } = {}){
    const a = rot * Math.PI / 180, ax = [Math.cos(a), Math.sin(a)], pp = [-Math.sin(a), Math.cos(a)], R = rng('ct' + seed);
    const sl = (L - gap * (n - 1)) / n, items = [];
    for (let i = 0; i < n; i++){
        const t0 = -L / 2 + i * (sl + gap), t1 = t0 + sl, jw = (R() - .5) * 3, jv = (R() - .5) * 2;
        const C = (t, s, z) => P(o, u + ax[0] * t + pp[0] * (s + jv), v + ax[1] * t + pp[1] * (s + jv), z);
        const w0 = W / 2 * (1 - .18 * (Math.abs(t0) / (L / 2)) ** 2) + jw, w1 = W / 2 * (1 - .18 * (Math.abs(t1) / (L / 2)) ** 2) + jw;
        const cor = [[t0, -w0], [t1, -w1], [t1, w1], [t0, w0]];
        const top3 = cor.map(([t, s]) => C(t, s, H)), bot = cor.map(([t, s]) => C(t, s, 0));
        const [mx, my] = C((t0 + t1) / 2, 0, 0);
        items.push([my, () => {
            const faces = [];
            for (let k = 0; k < 4; k++){
                const k2 = (k + 1) % 4, A = cor[k], B = cor[k2];
                const nv = k === 0 ? -pp[1] : k === 1 ? ax[1] : k === 2 ? pp[1] : -ax[1], nu = k === 0 ? -pp[0] : k === 1 ? ax[0] : k === 2 ? pp[0] : -ax[0];
                const cutFace = k === 1 || k === 3;
                const q = [top3[k], top3[k2], bot[k2], bot[k]];
                const d = 'M' + q.map(r => r.map(f).join(',')).join('L') + 'Z';
                const shade = (.5 + .5 * nu) * .5;
                faces.push([nv, cutFace ? `<path d="${d}" fill="${mix(meat, dk(meat, .3), shade)}" stroke="${dk(crust, .2)}" stroke-width="1.6" stroke-linejoin="round"/>` : `<path d="${d}" fill="${mix(dk(crust, .04), dk(crust, .3), shade)}" stroke="${dk(crust, .45)}" stroke-width=".5"/>`]);
            }
            faces.sort((x, y) => x[0] - y[0]);
            const tp = []; for (let k = 0; k < 4; k++){ const A = cor[k], B = cor[(k + 1) % 4]; for (const q of [.12, .5, .88]){ const t = A[0] + (B[0] - A[0]) * q, ss = A[1] + (B[1] - A[1]) * q; tp.push(C(t + (R() - .5) * 1.6, ss + (R() - .5) * 2.4, H + (q === .5 ? 1.5 : 0))); } }
            const td = Q.smooth(tp, true, .7);
            const [tx, ty] = C((t0 + t1) / 2, 0, H);
            return Q.dropOf(p, 'M' + bot.map(r => r.map(f).join(',')).join('L') + 'Z', 2, 2.4, .3, 1.4) + faces.map(x => x[1]).join('') +
                `<path d="${td}" fill="${top || Q.lit(p, crust, .28, .18)}" stroke="${dk(crust, .4)}" stroke-width=".6" stroke-linejoin="round"/>` +
                (crumb ? crumbs(p, td, tx, ty, sl * .8, W * SY * .6, seed + 'c' + i, { n: Math.round(sl * W / 16), light: lt(crust, .45), dark: dk(crust, .35), r: 1.3 }) : '');
        }]);
    }
    return items;
}
// 器の中身の奥を淡く・手前を濃く（平皿は見込みの形で切る）
const veil = (p, D, top = D.cy - (D.ry || 40) - 30, bottom = D.cy + (D.ry || 40)) => Q.depthVeil(p, D.inside ? D : { inside: Q.clip(p, Q.eD(D.cx, D.cy, D.rx || 80, D.ry || 45)) }, top, bottom);
// とろりとかけたソース（とんかつソース・甘酢あん）: ゆるい帯
function drizzle(p, pts, c = '#5a2a12', w = 4){
    const d = Q.smooth(pts, false);
    return `<path d="${d}" stroke="${dk(c, .25)}" stroke-width="${w + 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#fff" stroke-width="${f(w * .25)}" fill="none" stroke-linecap="round" opacity=".45" transform="translate(-.6 -.8)"/>`;
}
// 玉ねぎの薄切り（あめ色の弧）・くし切り
const onionStrip = (x, y, L, r, c = '#e0b46a') => `<g ${T(x, y, r)}><path d="M${-L / 2},2 Q0,-4 ${L / 2},2" stroke="${dk(c, .35)}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M${-L / 2},2 Q0,-4 ${L / 2},2" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${-L * .3},.3 Q0,-2.2 ${L * .2},-.5" stroke="#fff6dc" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
const onionWedge = (p, x, y, s, r, c = '#efdba0') => Q.cast(p, x, y + 2, s * .5, s * .16, .25) + `<g ${T(x, y, r, s / 26)}><path d="M-13,3 Q0,-13 13,3 Q0,-4 -13,3Z" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".7"/><path d="M-10,1 Q0,-9 10,1" stroke="${dk(c, .2)}" stroke-width=".9" fill="none"/><path d="M-11,-1 Q-4,-10 4,-9.6" stroke="#fff" stroke-width="1.1" fill="none" opacity=".7"/></g>`;
// ピーマン・パプリカの切り片（細切り・乱切り）
const pepperBit = (p, x, y, s, rot, c = '#3f8f2f', w = .16) => Q.prism(p, x, y, [[-s / 2, -s * w], [s / 2, -s * w], [s / 2, s * w], [-s / 2, s * w]], 2.4, c, { rot, line: .45 });
const pepperTri = (p, x, y, s, rot, c = '#3f8f2f') => Q.prism(p, x, y, [[-s / 2, -s * .3], [s / 2, -s * .4], [s * .1, s * .45]], 2.6, c, { rot, line: .5, top: Q.lg(p, [[0, lt(c, .45)], [.5, c], [1, dk(c, .2)]], 0, 0, 1, 1) });
// にんじんの細切り・短冊
const stick = (p, x, y, s, rot, c = '#ec7b2d', w = .12) => Q.prism(p, x, y, [[-s / 2, -s * w], [s / 2, -s * w], [s / 2, s * w], [-s / 2, s * w]], s * w * 1.5, c, { rot, line: .4 });
// レモンのくし切り
function citrus(p, x, y, s, rot = 0, c = '#f6d23a'){
    const k = s / 30;
    return Q.cast(p, x + 2, y + 5 * k, 15 * k, 4 * k, .32) + `<g ${T(x, y, rot, k)}><path d="M-15,0 Q0,13 15,0 Q0,7 -15,0Z" fill="${dk(c, .2)}" stroke="${dk(c, .45)}" stroke-width=".7"/><path d="M-15,0 A15,7 0 0 1 15,0 Q0,7 -15,0Z" fill="${lt(c, .7)}" stroke="${dk(c, .1)}" stroke-width=".7"/><path d="M-12.6,.4 A12.6,5.4 0 0 1 12.6,.4 Q0,5.4 -12.6,.4Z" fill="${lt(c, .3)}"/><path d="M0,3.6 L-9,-3 M0,3.6 L-3.4,-5 M0,3.6 L3.4,-5 M0,3.6 L9,-3" stroke="${lt(c, .7)}" stroke-width="1" fill="none"/></g>`;
}
// 大根おろし（白い小山）
function oroshi(p, x, y, s, seed = 1){
    const d = `M${f(x - s / 2)},${f(y)} Q${f(x - s * .4)},${f(y - s * .55)} ${f(x)},${f(y - s * .6)} Q${f(x + s * .4)},${f(y - s * .55)} ${f(x + s / 2)},${f(y)} Q${f(x)},${f(y + s * .2)} ${f(x - s / 2)},${f(y)}Z`;
    const R = rng('hor' + seed);
    return Q.dropOf(p, d, 2, 2, .3) + `<path d="${d}" fill="${Q.rg(p, [[0, '#ffffff'], [.6, '#f2efe6'], [1, '#d8d2c4']], .35, .3, .8)}" stroke="#cfc8b8" stroke-width=".5"/>` + Array.from({ length: 14 }, () => `<circle cx="${f(x + (R() - .5) * s * .8)}" cy="${f(y - R() * s * .45)}" r=".7" fill="#e2dccd"/>`).join('');
}
// おろし生姜（淡い黄の小山）
const ginger = (p, x, y, s, seed = 1) => { const d = Q.blob(x, y, s / 2, s * .32, 'gi' + seed, { n: 9, jit: .3 }); return Q.dropOf(p, d, 1.4, 1.8, .28) + `<path d="${d}" fill="${Q.dome(p, '#f0d880')}" stroke="#c8a850" stroke-width=".5"/>`; };
// しし唐など細長い緑
function greenPod(p, x, y, L, rot, { c = '#4a8f2a', w = 5 } = {}){
    return `<g ${T(x, y, rot)}>${Q.cast(p, 0, 2, L * .5, 2, .3)}<path d="M${-L / 2},0 Q0,${-w * .4} ${L / 2 - 3},0 L${L / 2},-1" stroke="${dk(c, .4)}" stroke-width="${w + 1}" stroke-linecap="round" fill="none"/><path d="M${-L / 2},0 Q0,${-w * .4} ${L / 2 - 3},0" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/><path d="M${-L * .35},${-w * .3} Q0,${-w * .7} ${L * .25},${-w * .35}" stroke="${lt(c, .5)}" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M${L / 2 - 2},-1 l4,-2" stroke="#7a9a4a" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
// 大葉（ぎざぎざの縁の葉を面につぶす）
function shiso(p, x, y, s, rot, seed = 1){
    const pts = [];
    for (let i = 0; i <= 16; i++){ const t = i / 16, a = Math.PI * t, r = s / 2 * (i % 2 ? .92 : 1); pts.push([-s / 2 + t * s, -Math.sin(a) * s * .36 * (i % 2 ? .9 : 1)]); }
    for (let i = 16; i >= 0; i--){ const t = i / 16, a = Math.PI * t; pts.push([-s / 2 + t * s, Math.sin(a) * s * .36 * (i % 2 ? .9 : 1)]); }
    const d = 'M' + pts.map(q => q.map(f).join(',')).join('L') + 'Z';
    return `<g transform="translate(${f(x)} ${f(y)}) scale(1 ${SY}) rotate(${f(rot)})"><path d="${d}" transform="translate(1.5 3)" fill="${SHADE}" opacity=".22"/><path d="${d}" fill="${Q.lg(p, [[0, '#6fb04a'], [.5, '#3f8a2c'], [1, '#2f6a22']], 0, 0, 1, 1)}" stroke="#2a5a1e" stroke-width=".7"/><path d="M${f(-s / 2)},0 L${f(s * .4)},0" stroke="#9ccf6a" stroke-width="1.1"/>${[-.25, 0, .2].map(t => `<path d="M${f(t * s)},0 l${f(s * .12)},${f(-s * .2)} M${f(t * s)},0 l${f(s * .12)},${f(s * .2)}" stroke="#7fbf5a" stroke-width=".7"/>`).join('')}</g>`;
}
// ごま（白・黒は焦げ茶）
const sesame = (x, y, s, seed = 1, c = '#f4e8c8', n = 12) => { const R = rng('hgm' + seed); return Array.from({ length: n }, () => { const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .5; return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="1.1" ry=".6" transform="rotate(${f(R() * 180)} ${f(cx)} ${f(cy)})" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".3"/>`; }).join(''); };
// かつお節（薄い桃茶の削り片）
const katsuobushi = (x, y, s, seed = 1, n = 14) => { const R = rng('kb' + seed); return Array.from({ length: n }, () => { const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .45, w = 3 + R() * 3; return `<path d="${Q.blob(cx, cy, w, w * .55, 'kbb' + seed + cx, { n: 6, jit: .5, sharp: true, rot: R() * 180 })}" fill="${R() < .5 ? '#d8a07a' : '#ecc4a0'}" stroke="#a8704a" stroke-width=".3" opacity=".95"/>`; }).join(''); };
// 赤唐辛子の輪切り
const chiliRing = (x, y, s = 3.4) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s)}" ry="${f(s * .7)}" fill="#f0e0a0" stroke="#d2281e" stroke-width="1.3"/>`;
// きゅうりの輪切り・斜め切り（面につぶした楕円。皮の濃い緑の縁、淡い身、種の輪）
function cucumber(p, x, y, s, rot = 0, { oval = 1, thick = 2 } = {}){
    const rx = s / 2 * oval, ry = s / 2 * SY;
    return `<g ${T(x, y, rot)}>${Q.cast(p, 0, thick, rx, ry * .6, .25)}<ellipse cy="${thick}" rx="${f(rx)}" ry="${f(ry)}" fill="#2f6a26"/><ellipse rx="${f(rx)}" ry="${f(ry)}" fill="#e6f0c8" stroke="#3a7a2a" stroke-width="1.4"/><ellipse rx="${f(rx * .62)}" ry="${f(ry * .62)}" fill="none" stroke="#c4dc96" stroke-width="1"/>${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${f(Math.cos(i) * rx * .32)}" cy="${f(Math.sin(i) * ry * .32)}" rx=".9" ry=".6" fill="#b4cc84"/>`).join('')}</g>`;
}
// トマトのくし切り（皮の赤・果肉・種のゼリー）
function tomatoWedge(p, x, y, s, rot = 0){
    const k = s / 28;
    return Q.cast(p, x + 1, y + 4 * k, 13 * k, 4 * k, .3) + `<g ${T(x, y, rot, k)}><path d="M-14,2 Q0,14 14,2 Q0,8 -14,2Z" fill="#b8281c"/><path d="M-14,2 Q-12,-9 0,-10 Q12,-9 14,2 Q0,8 -14,2Z" fill="${Q.rg(p, [[0, '#ff7a5a'], [.6, '#e8402a'], [1, '#b8281c']], .35, .3, .8)}" stroke="#a8241a" stroke-width=".7"/><path d="M-9,1 Q-6,-5 -1,-4 Q-3,2 -9,1Z M9,1 Q6,-5 1,-4 Q3,2 9,1Z" fill="#f8b070" opacity=".9"/><path d="M-10,-4 Q-6,-8 0,-8.4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".6" stroke-linecap="round"/></g>`;
}
// ハム（薄切りの短冊・半月）
const hamBit = (p, x, y, s, rot) => Q.prism(p, x, y, [[-s / 2, -s * .14], [s / 2, -s * .14], [s / 2, s * .14], [-s / 2, s * .14]], 1.6, '#f0a0a0', { rot, line: .4, top: Q.lg(p, [[0, '#ffd0cc'], [1, '#e88a8a']], 0, 0, 1, 1) });
// 小口切りのねぎ（kit の negi）を散らす
const negis = (p, x, y, s, n, seed, c) => { const R = rng('hng' + seed); let o = ''; for (let i = 0; i < n; i++) o += Q.negi(p, x + (R() - .5) * s, y + (R() - .5) * s * .5, 5, c); return o; };
// 白い器の上の衣（マヨネーズなど）: クリーム色の面
const creamy = (p, d, c) => `<path d="${d}" fill="${Q.rg(p, [[0, lt(c, .5)], [.6, c], [1, dk(c, .18)]], .36, .3, .8)}" stroke="${dk(c, .3)}" stroke-width=".6"/>`;
// 和え物の山（中身の形の塊にあえ衣）: items を山に置く
const onHill = (o, R, H, list, draw) => list.map(([u, v, ...rest], i) => { const [x, y] = P(o, u, v, hill(u, v, R, H)); return [y, () => draw(x, y, i, ...rest)]; });

// kit.mjs の真上から見た部品を、面に寝かせる（縦につぶし、thick で厚み）
const flat = (p, x, y, inner, { sq = .62, th = 1.6, tc = '#5a3418' } = {}) => `<g ${Q.thick(p, th, tc, .7)}><g transform="translate(${f(x)} ${f(y)}) scale(1 ${sq})">${inner}</g></g>`;
// 炒め物・和え物の山: kinds = [[重み, (x, y, r, i) => svg], ...] を n 個、中心ほど高く積む
function mound(o, R, H, seed, n, minD, kinds, { ry = R, cu = 0, cv = 0, lift = 0 } = {}){
    const tot = kinds.reduce((a, k) => a + k[0], 0), Rr = rng('mk' + seed);
    return scatter(seed, n, R, minD, { ry, cu, cv }).map(([u, v, r], i) => {
        let w = Rr() * tot, k = kinds[0]; for (const kk of kinds){ w -= kk[0]; if (w <= 0){ k = kk; break; } }
        const [x, y] = P(o, u, v, hill(u - cu, v - cv, R * 1.05, H) + lift);
        return [y, () => k[1](x, y, r * 360, i)];
    });
}
// 春雨（透けた細い麺の束）: 面に置いたゆるい曲線
function glassNoodles(p, o, R, H, seed, { n = 40, c = '#d8c8a8', w = 1.6 } = {}){
    const Rr = rng('gn' + seed), it = [];
    for (let i = 0; i < n; i++){
        const a = Rr() * 6.283, d = Math.sqrt(Rr()) * R * .9, u0 = Math.cos(a) * d, v0 = Math.sin(a) * d, dir = Rr() * 6.283, pts = [];
        for (let k = 0; k <= 5; k++){ const t = k / 5 - .5, ang = dir + Math.sin(k + i) * .8, u = u0 + Math.cos(ang) * t * 34, v = v0 + Math.sin(ang) * t * 34; pts.push(P(o, u, v, hill(u, v, R * 1.1, H))); }
        it.push([pts[2][1], () => { const d = Q.smooth(pts, false); return `<path d="${d}" stroke="${dk(c, .3)}" stroke-width="${w + .9}" fill="none" stroke-linecap="round" opacity=".7"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".9"/>`; }]);
    }
    return it;
}

// なすの乱切り（花森の角柱）: 上は照りのある身、側面は紫の皮
const nasu = (p, x, y, s, rot, seed = 1, flesh = '#d8b070') => { const R = rng('ns' + seed); const pts = Array.from({ length: 5 }, (_, i) => { const a = i / 5 * 6.283, r = s / 2 * (.75 + R() * .35); return [Math.cos(a) * r, Math.sin(a) * r * .8]; }); return Q.prism(p, x, y, pts, s * .4, '#5a2c66', { rot, top: Q.lg(p, [[0, lt(flesh, .35)], [.6, flesh], [1, dk(flesh, .3)]], 0, 0, 1, 1), line: .6 }) + gl(x - s * .15, y - s * .4, s * .35, -8, .7); };
// 小鉢（今の絵の器の色）: outer は外の色。中身は V.above で手前の口より上だけ見せ、最後に depthVeil
const bowlOf = (p, outer, o = {}) => Q.kobachi(p, { outer, lip: lt(outer, .22), inner: '#f2ede2', ...o });
const inBowl = (p, V, body) => V.s + `<g ${V.above}>${body}</g>` + Q.depthVeil(p, V, V.cy - 56, V.cy + V.iry) + V.shine(.5);
// あえ衣の山（ポテトサラダ・白和え・かぼちゃサラダ）: 斜めから見たこんもりした形。返り値 { s, top(u, v) }
function creamMound(p, cx, cy, rx, H, c, seed, { bump = 10, shade = .2 } = {}){
    const ry = rx * SY, R = rng('cm' + seed), prof = q => Math.pow(Math.max(0, 1 - q), .7);
    const top = []; for (let i = 0; i <= 30; i++){ const u = -1 + 2 * i / 30; top.push([cx + u * rx, cy - H * prof(u * u) - Math.sqrt(Math.max(0, 1 - u * u)) * ry * .3 + (R() - .5) * 3]); }
    const outline = `M${f(cx - rx)},${f(cy)} ${Q.smooth(top, false).slice(1).replace(/^[^C]*/, m => 'L' + m)} L${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx)},${f(cy)}Z`;
    let tex = '';
    for (let i = 0; i < bump; i++){ const a = R() * 6.283, d = Math.sqrt(R()) * .9, u = Math.cos(a) * d, v = Math.sin(a) * d; tex += `<ellipse cx="${f(cx + u * rx)}" cy="${f(cy + v * ry - H * prof(d * d))}" rx="${f(5 + R() * 6)}" ry="${f(3 + R() * 3)}" fill="${lt(c, .35)}" opacity=".5"/>`; }
    return { s: Q.dropOf(p, outline, 2, 3, .28, 2) + `<path d="${outline}" fill="${Q.rg(p, [[0, lt(c, .4)], [.55, c], [1, dk(c, .22)]], .36, .3, .8)}"/>` + `<g ${Q.clip(p, outline)}>${tex}</g>` + `<path d="${outline}" fill="${Q.lg(p, [[0, SHADE, 0], [.5, SHADE, 0], [1, SHADE, shade]], 0, 0, 1, 1)}"/>`,
        at: (u, v, lift = 0) => Q.at({ cx, cy }, u * rx, v * rx, H * prof(u * u + v * v) + lift) };
}
// 山の上に具を散らす（creamMound の at を使う）
const onCream = (M, seed, n, minD, draw, lift = 0) => scatter(seed, n, .85, minD).map(([u, v, r], i) => { const [x, y] = M.at(u, v, lift); return [y, () => draw(x, y, r * 360, i)]; });
// オクラの輪切り（星形の断面と白い種）を面に寝かせる
const okraSlice = (p, x, y, s) => flat(p, x, y, K.okra(p, 0, 0, s), { th: 1.6, tc: '#2a5a1e', sq: .66 });
// むきえび（エビチリ）: 殻のない身。ゆるく曲がった胴に節の線と背の明るい帯、小さな尾。丸い輪にしない（海老の頭つきは Q.prawn3q）
function peeledShrimp(p, x, y, s, rot = 0, flip = 1, c = '#fbd0bc'){
    const L = s * 1.1, P0 = [-L / 2, 0], P1 = [0, -L * .42], P2 = [L / 2, L * .05];
    const B = t => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
    const N = t => { const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]), l = Math.hypot(dx, dy); return [dy / l, -dx / l]; };
    const W = t => s * (.2 - t * .12), off = (t, k) => { const [bx, by] = B(t), [nx, ny] = N(t); return [bx + nx * W(t) * k, by + ny * W(t) * k]; };
    const ts = Array.from({ length: 19 }, (_, i) => i / 18 * .9);
    const body = 'M' + ts.map(t => off(t, 1).map(f).join(',')).join('L') + 'L' + ts.slice().reverse().map(t => off(t, -1).map(f).join(',')).join('L') + 'Z';
    let seg = ''; for (let i = 1; i < 5; i++){ const t = i * .18, a = off(t, 1), b = off(t, -1); seg += `<path d="M${f(a[0])},${f(a[1])} Q${f((a[0] + b[0]) / 2 + 1.5)},${f((a[1] + b[1]) / 2)} ${f(b[0])},${f(b[1])}" stroke="#f06a40" stroke-width="2.4" fill="none" opacity=".85"/>`; }
    const [ex, ey] = B(.9), base = Math.atan2(N(.9)[1], N(.9)[0]) - Math.PI / 2;
    const tail = [-.4, .4].map(a => { const ang = base + a, tl = s * .22; return `<path d="M${f(ex)},${f(ey)} L${f(ex + Math.cos(ang - .25) * tl)},${f(ey + Math.sin(ang - .25) * tl)} L${f(ex + Math.cos(ang + .25) * tl)},${f(ey + Math.sin(ang + .25) * tl)}Z" fill="#d84a26" stroke="#a83a20" stroke-width=".5"/>`; }).join('');
    const back = 'M' + Array.from({ length: 10 }, (_, i) => off(.05 + i / 9 * .75, .5).map(f).join(',')).join('L');
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${flip} 1)"><path d="${body}" fill="${SHADE}" opacity=".3" transform="translate(2 3.4)" ${Q.blur(p, 1.3)}/>${tail}<path d="${body}" fill="${Q.lg(p, [[0, lt(c, .5)], [.5, c], [1, dk(c, .2)]], 0, 0, 0, 1)}" stroke="${dk(c, .4)}" stroke-width=".7" stroke-linejoin="round"/>${seg}<path d="${back}" stroke="${lt(c, .65)}" stroke-width="${f(s * .06)}" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}

// =========================================================
// 盛りつけ
// =========================================================
export default {
    // ---------- 主菜・揚 ----------
    // 鶏の唐揚げ: でこぼこの衣の塊を山に積む。レモン（お好みで）
    karaage: p => {
        const D = Q.plate(p), o = D.o;
        const it = [[-30, -24], [6, -32], [36, -14], [-40, 8], [-6, -2], [28, 16], [-22, 30], [10, 30]].map(([u, v], i) => { const z = hill(u, v, 60, 16); const [x, y] = P(o, u, v, z); return [y, () => fried(p, x, y, 19, 14, 'ka' + i)]; });
        const [lx, ly] = P(o, 50, 34); it.push([ly, () => citrus(p, lx, ly, 28, -20)]);
        return D.s + Q.byDepth(it) + veil(p, D);
    },
    // チキン南蛮: 切り分けた鶏むねの揚げ焼きに甘酢とタルタル（卵・玉ねぎ・マヨネーズ）。奥にキャベツ（お好みで）
    nanban: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + Q.shredMound(p, 142, 86, 26, 24, undefined, 2, { n: 110 });
        const it = cutlet(p, o, { u: -12, v: 6, L: 104, W: 46, H: 9, n: 5, rot: -8, gap: 2.4, crust: '#d08a3a', meat: '#f8eedc', seed: 'nb', top: Q.lit(p, '#b8702a', .3, .2) });
        const [tx, ty] = P(o, -12, 2, 14);
        it.push([200, () => { const d = Q.blob(tx, ty, 32, 11, 'tt', { n: 12, jit: .3 }); const R = rng('tt'); let e = ''; for (let i = 0; i < 16; i++){ const x = tx + (R() - .5) * 50, y = ty + (R() - .5) * 16; e += `<path d="${Q.blob(x, y, 2.4, 1.8, 'te' + i, { n: 5, jit: .4, sharp: true })}" fill="${i % 3 ? '#f6d04a' : '#fffaf0'}" stroke="${i % 3 ? '#d8a428' : '#e8e0c8'}" stroke-width=".4"/>`; } return Q.dropOf(p, d, 1.5, 2.4, .3) + creamy(p, d, '#fbf4dc') + `<g ${Q.clip(p, d)}>${e}</g>` + gl(tx - 10, ty - 6, 16, -6, .8); }]);
        return s + Q.byDepth(it) + veil(p, D);
    },
    // 酢豚: 照りのある甘酢あんに、揚げた豚肉・玉ねぎ・ピーマン・にんじん（お好みで）
    subuta: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + pool(p, 100, 110, 58, '#b8401e', 2, { op: .9 });
        const it = [];
        scatter('sb', 7, 44, 22).forEach(([u, v], i) => { const [x, y] = P(o, u, v, hill(u, v, 56, 10)); it.push([y, () => fried(p, x, y, 13, 10, 'sb' + i, { c: '#a8401c', crumb: false }) + gl(x - 4, y - 5, 9, -10, .9)]); });
        scatter('sbv', 10, 50, 14, { ex: [] }).forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, hill(u, v, 56, 10) + 2); it.push([y + .5, () => i % 3 === 0 ? onionWedge(p, x, y, 20, r * 360) : i % 3 === 1 ? pepperTri(p, x, y, 16, r * 360) : Q.rangiri(p, x, y, 13, r * 360, '#e97a2a', i)]); });
        return s + Q.byDepth(it) + veil(p, D);
    },
    // とんかつ: 厚いロースを切り分け（断面の白い肉）、ソース。奥にキャベツの千切り（お好みで）
    tonkatsu: p => {
        const D = Q.plate(p), o = D.o;
        const it = cutlet(p, o, { u: -14, v: 8, L: 118, W: 50, H: 13, n: 6, rot: -12, seed: 'tk' });
        it.push([D.cy + 60, () => { let z = ''; for (let i = 0; i < 6; i++){ const [x, y] = P(o, -60 + i * 19, 8 + 10 * Math.sin(-12 / 57.3) * (i - 3) - 2, 13); z += drizzle(p, [[x - 6, y - 4], [x + 2, y + 2], [x + 8, y - 3]], '#5a2610', 3.4); } return z; }]);
        return D.s + Q.shredMound(p, 142, 84, 28, 30, undefined, 3, { n: 140 }) + Q.byDepth(it) + veil(p, D);
    },
    // あじフライ: 開いたあじの形（尾つき）のパン粉の衣2枚、ソース。奥にキャベツ（お好みで）
    ajifry: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + Q.shredMound(p, 142, 84, 26, 26, undefined, 4, { n: 120 });
        const it = [[-24, -10, -14, 0], [10, 18, -8, 1]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => {
            const a = r * Math.PI / 180, tx = x - Math.cos(a) * 46, ty = y - Math.sin(a) * 46 * SY - 6;
            const tail = `<path d="M${f(tx + 6)},${f(ty)} L${f(tx - 10)},${f(ty - 9)} L${f(tx - 6)},${f(ty)} L${f(tx - 10)},${f(ty + 8)}Z" fill="${Q.lg(p, [[0, '#c8b8a0'], [1, '#8a7a68']])}" stroke="#6a5a48" stroke-width=".6"/>`;
            const b = breaded(p, x, y, 40, 30, 8, 'af' + i, { rot: r, n: 14, jit: .12 });
            return tail + b.s + drizzle(p, [[x - 26, b.y - 2], [x - 18, b.y + 4], [x - 8, b.y - 5], [x + 2, b.y + 3], [x + 12, b.y - 5], [x + 22, b.y + 1]], '#5a2610', 3);
        }]; });
        return s + Q.byDepth(it) + veil(p, D);
    },
    // 白身魚の甘酢あんかけ: 揚げただら2切れに、玉ねぎ・にんじん・ピーマン（お好みで）の細切りの透明なあん
    amazu_sakana: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + pool(p, 100, 112, 60, '#d8803a', 3, { op: .75 });
        const it = [[-22, -6, -8, 0], [24, 12, 10, 1]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => { const c = chunk(p, x, y, 32, 24, 12, '#e0b064', '#f2e0c0', 'am' + i, { rot: r, jit: .2, n: 12, dome: .5 }); return c.s + crumbs(p, c.d, x, c.y, 32, 24 * SY, 'am' + i, { n: 22, light: '#f4d088', dark: '#b8803a', r: 1.6 }); }]; });
        const R = rng('amv');
        for (let i = 0; i < 22; i++){ const u = (R() - .5) * 90, v = (R() - .5) * 50, [x, y] = P(o, u, v, 13), r = R() * 360, k = i % 3; it.push([150 + i, () => k === 0 ? onionStrip(x, y, 16, r, '#f4e2b0') : k === 1 ? stick(p, x, y, 16, r, '#ec7b2d', .1) : stick(p, x, y, 16, r, '#3f8f2f', .1)]); }
        it.push([300, () => `<path d="${Q.blob(100, 104, 52, 18, 'ama', { n: 12, jit: .3 })}" fill="#e89a40" opacity=".28"/>` + gl(80, 96, 26, -8, .8) + gl(118, 108, 18, -8, .6)]);
        return s + Q.byDepth(it) + veil(p, D);
    },
    // 油淋鶏: 切り分けた揚げ鶏に、刻んだ長ねぎのたれ
    yurinchi: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + pool(p, 112, 124, 40, '#b87838', 'yrt', { op: .5, gloss: false });
        const it = cutlet(p, o, { u: 0, v: 2, L: 112, n: 6, rot: 8, crust: '#d48e3e', meat: '#f8ecd8', seed: 'yr', gap: 2.2, H: 8, W: 46 });
        const R = rng('yrn');
        it.push([300, () => { let o2 = ''; for (let i = 0; i < 30; i++){ const [x, y] = P(o, (R() - .5) * 96, (R() - .5) * 30 + 2, 13); o2 += `<path d="${Q.blob(x, y, 2.6, 1.6, 'yn' + i, { n: 5, jit: .5, sharp: true, rot: R() * 180 })}" fill="${R() < .55 ? '#f4f6e0' : '#9ccc64'}" stroke="#7aa850" stroke-width=".4"/>`; } return o2 + gl(74, 86, 18, -6, .75) + gl(120, 92, 14, 4, .6); }]);
        return s + Q.byDepth(it) + veil(p, D);
    },
    // 肉団子の甘酢あん: 白い鉢に照りのあん、丸い肉団子
    nikudango: p => {
        const V = Q.shiroBowl(p, { cy: 82, h: 46, fx: 46 }), S = Q.surface(p, V, { drop: 8, c: '#c45a2a', glow: .35 });
        const it = [[-40, -26], [-4, -34], [32, -22], [-50, 6], [-14, 0], [22, 6], [52, 14], [-30, 30], [8, 34]].map(([u, v], i) => { const [x, y] = P(S.o, u, v, 6 + hill(u, v, 70, 6)); return [y, () => Q.lump(p, x, y, 15, 13, '#a04a22', 'nd' + i, { n: 10, jit: .12, hi: .7 })]; });
        return V.s + S.s + `<g ${V.above}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, V.cy - 50, V.cy + V.iry) + V.shine(.6);
    },
    // コロッケ: 小判形の2つ、ソース。奥にキャベツ（お好みで）
    korokke: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + Q.shredMound(p, 142, 86, 26, 26, undefined, 5, { n: 120 });
        const it = [[-30, -6, -10, 0], [10, 20, 6, 1]].map(([u, v, r, i]) => { const [x, y] = P(o, u, v); return [y, () => { const b = breaded(p, x, y, 32, 24, 12, 'kr' + i, { rot: r, c: '#c8823a', jit: .08 }); return b.s + drizzle(p, [[x - 20, b.y - 1], [x - 12, b.y + 4], [x - 2, b.y - 5], [x + 8, b.y + 3], [x + 18, b.y - 3]], '#5a2610', 3); }]; });
        return s + Q.byDepth(it) + veil(p, D);
    },
    // あじの南蛮漬け: 角皿に揚げたあじ、玉ねぎ・にんじん・ピーマン（お好みで）の細切りと赤唐辛子、漬け汁
    ajinanbanzuke: p => {
        const D = Q.slabPlate(p, { d: 140, base: '#f0ece2' }), o = D.o;
        let s = D.s + pool(p, 100, 106, 70, '#d8a860', 6, { op: .5 });
        const it = [[-34, -26, 20], [20, -30, -10], [-28, 14, -20], [26, 12, 15], [-2, 40, 5]].map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => { const c = chunk(p, x, y, 22, 13, 6, '#d0944a', '#ecd2a8', 'an' + i, { rot: r, jit: .2, n: 10, dome: .5 }); return c.s + crumbs(p, c.d, x, c.y, 22, 13 * SY, 'an' + i, { n: 12, light: '#ecbc78', dark: '#9a5a26', r: 1.5 }); }]; });
        const R = rng('anv');
        for (let i = 0; i < 26; i++){ const u = (R() - .5) * 120, v = (R() - .5) * 100, [x, y] = P(o, u, v, 7), r = R() * 360, k = i % 3; it.push([200 + i, () => k === 0 ? onionStrip(x, y, 16, r, '#f4ecd0') : k === 1 ? stick(p, x, y, 16, r, '#ec7b2d', .09) : stick(p, x, y, 15, r, '#3f8f2f', .09)]); }
        [[-50, -6], [40, -12], [8, 22]].forEach(([u, v]) => { const [x, y] = P(o, u, v, 7); it.push([400, () => chiliRing(x, y)]); });
        return s + Q.byDepth(it) + veil(p, D);
    },
    // えびフライ: 尾の赤いまっすぐなフライ3本、タルタル。奥にキャベツ、レモン（お好みで）
    ebifry: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + Q.shredMound(p, 144, 86, 26, 26, undefined, 6, { n: 120 });
        const it = [[-20, -20, -14], [-6, 2, -10], [8, 24, -6]].map(([u, v, r], i) => { const [x, y] = P(o, u, v); return [y, () => {
            const a = r * Math.PI / 180, tx = x + Math.cos(a) * 46, ty = y + Math.sin(a) * 46 * SY - 6;
            const tail = `<g ${T(tx, ty, r)}><path d="M-4,0 L9,-8 L7,0 L9,7Z" fill="${Q.lg(p, [[0, '#f26a3a'], [1, '#b8301c']])}" stroke="#8a2414" stroke-width=".6"/><path d="M-2,0 L8,-5" stroke="#ff9a70" stroke-width=".8"/></g>`;
            return breaded(p, x, y, 44, 11, 9, 'ef' + i, { rot: r, jit: .14, n: 12, c: '#d8983e' }).s + tail; }]; });
        const [tx, ty] = P(o, -40, 40, 3);
        it.push([ty, () => { const d = Q.blob(tx, ty, 16, 9, 'eft', { n: 10, jit: .25 }); return Q.dropOf(p, d, 1.5, 2.4, .3) + creamy(p, d, '#fbf4dc') + `<g ${Q.clip(p, d)}>${sesame(tx, ty, 26, 'eft', '#f6d04a', 8)}</g>` + gl(tx - 5, ty - 4, 10, -6, .8); }]);
        const [lx, ly] = P(o, 46, 38); it.push([ly, () => citrus(p, lx, ly, 26, -20)]);
        return s + Q.byDepth(it) + veil(p, D);
    },
    // 天ぷら: 角皿に、衣をまとったえび・なす・かぼちゃ・さつまいも・大葉・ししとう（お好みで）、大根おろし
    tempura: p => {
        const D = Q.slabPlate(p, { d: 130 }), o = D.o;
        const batter = (x, y, rx, ry, seed, rot = 0) => { const d = Q.blob(x, y, rx, ry, 'tb' + seed, { n: 14, jit: .3, rot }); return { d, s: Q.dropOf(p, d, 2, 3, .3, 1.6) + `<path d="${d}" fill="${Q.rg(p, [[0, '#fff4d0'], [.55, '#f2d48c'], [1, '#d8a85a']], .36, .3, .8)}" stroke="#c49048" stroke-width=".6"/>` }; };
        const lace = (d, x, y, rx, ry, seed) => crumbs(p, d, x, y, rx, ry, 'tl' + seed, { n: Math.round(rx * ry / 10), light: '#fffae6', dark: '#e2b468', r: 1.6 });
        const it = [];
        // えび（立てかけて、尾が赤い）
        [[-24, -18, -30], [6, -26, -24]].forEach(([u, v, r], i) => { const [x, y] = P(o, u, v, 6); it.push([y, () => { const b = batter(x, y, 40, 9, 'e' + i, r); const a = r * Math.PI / 180, tx = x + Math.cos(a) * 42, ty = y + Math.sin(a) * 42; return b.s + lace(b.d, x, y, 40, 14, 'e' + i) + `<g ${T(tx, ty, r)}><path d="M-4,0 L9,-7 L7,0 L9,6Z" fill="#e8502c" stroke="#a83a20" stroke-width=".6"/></g>`; }]); });
        // かぼちゃ（緑の皮の弧が見える）
        { const [x, y] = P(o, -48, 24, 2); it.push([y, () => { const b = batter(x, y, 20, 13, 'k', -10); return b.s + `<g ${Q.clip(p, b.d)}><path d="M${x - 22},${y + 6} Q${x},${y + 14} ${x + 22},${y + 2}" stroke="#2f6a26" stroke-width="5" fill="none"/><path d="${Q.blob(x, y - 2, 14, 7, 'kf')}" fill="#f0a830" opacity=".55"/></g>` + lace(b.d, x, y, 20, 13, 'k'); }]); }
        // さつまいも（輪切り: 赤紫の皮の輪）
        { const [x, y] = P(o, 50, -2, 2); it.push([y, () => { const b = batter(x, y, 17, 11, 's'); return b.s + `<path d="${Q.eD(x, y - 1, 13, 8)}" fill="#f6d070" stroke="#9a3a5a" stroke-width="2.4" opacity=".85"/>` + lace(b.d, x, y, 17, 11, 's'); }]); }
        // なす（扇に切って揚げる: 紫の皮）
        { const [x, y] = P(o, -6, 22, 3); it.push([y, () => { const b = batter(x, y, 26, 11, 'n', 10); return b.s + `<g ${Q.clip(p, b.d)}>${[-12, -4, 4, 12].map(dx => `<path d="M${x + dx - 6},${y - 8} l12,16" stroke="#5a2a6a" stroke-width="3" opacity=".75"/>`).join('')}</g>` + lace(b.d, x, y, 26, 11, 'n'); }]); }
        // 大葉（片面に衣）
        { const [x, y] = P(o, 32, 30, 2); it.push([y, () => shiso(p, x, y, 32, -20, 1) + `<path d="${Q.blob(x - 2, y + 2, 10, 4, 'sb')}" fill="#fff4d0" opacity=".85"/>`]); }
        // ししとう
        { const [x, y] = P(o, 52, 26, 3); it.push([y + 2, () => greenPod(p, x, y, 28, -40)]); }
        // 大根おろし
        { const [x, y] = P(o, 58, -34); it.push([y, () => oroshi(p, x, y, 22, 2)]); }
        return D.s + Q.byDepth(it) + veil(p, { cx: D.cx, cy: D.cy, rx: 82, ry: 60 });
    },

    // ---------- 主菜・炒 ----------
    // 麻婆豆腐: 白い鉢に赤茶のあん、角切りの豆腐（花森の角柱）、ひき肉、長ねぎ
    mapo: p => {
        const V = Q.shiroBowl(p, { cy: 82, h: 44, fx: 46 }), S = Q.surface(p, V, { drop: 9, c: '#b8401e', glow: .3 });
        const it = scatter('mp', 13, 62, 17, { ry: 50 }).map(([u, v, r], i) => { const [x, y] = P(S.o, u, v); return [y, () => Q.cube(p, x, y, 16, r * 90, '#f6eedc', { sink: 4, liquid: '#b8401e' })]; });
        const R = rng('mpm');
        for (let i = 0; i < 26; i++){ const u = (R() - .5) * 120, v = (R() - .5) * 90; if (u * u / 64 / 64 + v * v / 50 / 50 > 1) continue; const [x, y] = P(S.o, u, v, 1); it.push([y + .3, () => `<path d="${Q.blob(x, y, 2.8, 1.8, 'mm' + i, { n: 6, jit: .5 })}" fill="${Q.dome(p, '#7a3a1a')}" stroke="#5a2410" stroke-width=".4"/>`]); }
        for (let i = 0; i < 12; i++){ const [x, y] = P(S.o, (R() - .5) * 100, (R() - .5) * 70, 2); it.push([y + .5, () => Q.negi(p, x, y, 5)]); }
        return V.s + S.s + `<g ${V.inside}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, V.cy - 50, V.cy + V.iry) + V.shine(.6);
    },
    // 回鍋肉: キャベツのざく切り・ピーマン・豚バラの薄切りを甜麺醤の照りで
    hoikoro: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 58, 22, 'hk', 40, 11, [
            [4, (x, y, r, i) => flat(p, x, y, K.leafPiece(p, 0, 0, 26, r, { c: '#b8d880', seed: i, cooked: true }), { tc: '#7a8a4a' })],
            [2, (x, y, r) => flat(p, x, y, K.pepperPiece(p, 0, 0, 16, r), { tc: '#2a5a1e' })],
            [3, (x, y, r, i) => Q.slice3q(p, x, y, 34, r, { c: '#9a5228', fat: '#f0d8b0', seed: i, gloss: .8 }, { th: 2, tc: '#5a2a10', sq: .62 })],
        ]);
        return D.s + pool(p, 112, 126, 40, '#a8622a', 'hkt', { op: .5, gloss: false }) + Q.byDepth(it) + veil(p, D);
    },
    // 青椒肉絲: ピーマン・豚肉・たけのこ（お好みで）の細切りを山に
    chinjao: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 58, 24, 'cj', 90, 6, [
            [5, (x, y, r) => pepperBit(p, x, y, 26, r, '#3f8f2f', .1)],
            [4, (x, y, r) => Q.prism(p, x, y, [[-12, -2], [12, -2], [12, 2], [-12, 2]], 3, '#8a4a22', { rot: r, line: .4, top: Q.lit(p, '#9a5a2e', .3, .2) })],
            [2, (x, y, r) => stick(p, x, y, 20, r, '#f2e2a8', .1)],
        ]);
        return D.s + pool(p, 112, 126, 40, '#a8682e', 'cjt', { op: .5, gloss: false }) + Q.byDepth(it) + veil(p, D);
    },
    // 豚キムチ炒め: キムチ・豚バラ・玉ねぎ・ニラ（お好みで）
    butakimu: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 58, 20, 'bk', 34, 12, [
            [4, (x, y, r, i) => flat(p, x, y, K.kimchi(p, 0, 0, 22, r, { seed: i }), { tc: '#8a2a14' })],
            [3, (x, y, r, i) => Q.slice3q(p, x, y, 32, r, { c: '#b0643a', fat: '#f4dcc0', seed: i, gloss: .8 }, { th: 2, tc: '#6a2a10', sq: .62 })],
            [2, (x, y, r) => onionStrip(x, y, 18, r, '#f0d8a0')],
            [2, (x, y, r) => pepperBit(p, x, y, 22, r, '#3f9a2c', .08)],
        ]);
        return D.s + Q.tarePool(p, 100, 118, 44, '#c8603a', 'bkt') + Q.byDepth(it) + veil(p, D);
    },
    // チャプチェ: 春雨の山に牛肉・ピーマン・にんじん・しいたけ（お好みで）、白ごま
    japchae: p => {
        const D = Q.plate(p), o = D.o;
        const it = glassNoodles(p, o, 58, 20, 'jc', { n: 60, c: '#b8946a', w: 1.8 });
        it.push(...mound(o, 54, 20, 'jcv', 22, 14, [
            [3, (x, y, r, i) => flat(p, x, y - 3, K.beefSlice(p, 0, 0, 18, r, { seed: i }), { tc: '#4a2a14' })],
            [2, (x, y, r) => pepperBit(p, x, y - 3, 20, r, '#3f8f2f', .08)],
            [2, (x, y, r) => stick(p, x, y - 3, 18, r, '#ec7b2d', .09)],
            [1, (x, y, r) => flat(p, x, y - 3, K.shiitake(p, 0, 0, 14, r, { cross: false }), { tc: '#3a2414' })],
        ]));
        it.push([300, () => sesame(100, 84, 80, 'jc', '#f4e8c8', 26)]);
        return D.s + Q.byDepth(it) + gl(80, 82, 20, -8, .7) + veil(p, D);
    },
    // エビチリ: むきえびを赤いチリソースに。長ねぎのみじん
    ebichili: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + pool(p, 100, 112, 60, '#c23a22', 'ec', { op: .9 });
        const it = scatter('ec', 7, 46, 28, { ry: 40 }).map(([u, v, r], i) => { const [x, y] = P(o, u, v, hill(u, v, 60, 10)); return [y, () => peeledShrimp(p, x, y, 38, (r - .5) * 50, i % 2 ? 1 : -1)]; });
        it.push([300, () => negis(p, 100, 104, 90, 14, 'ec', '#7aa850')]);
        return s + Q.byDepth(it) + veil(p, D);
    },
    // 八宝菜: 透明なあんに白菜・にんじん・しいたけ・豚肉・うずらの卵（お好みで）
    happosai: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + pool(p, 100, 112, 62, '#e8d6a8', 'hp', { op: .8 });
        const it = mound(o, 56, 16, 'hp', 30, 13, [
            [3, (x, y, r) => flat(p, x, y, K.napaStem(p, 0, 0, 24, r), { tc: '#b8b090' })],
            [2, (x, y, r, i) => flat(p, x, y, K.leafPiece(p, 0, 0, 22, r, { c: '#a8cc70', seed: i, cooked: true }), { tc: '#6a8a40' })],
            [2, (x, y, r) => stick(p, x, y, 16, r, '#ec7b2d', .22)],
            [2, (x, y, r) => flat(p, x, y, K.shiitake(p, 0, 0, 16, r), { tc: '#3a2414' })],
            [2, (x, y, r, i) => Q.slice3q(p, x, y, 26, r, { c: '#c49a74', fat: '#f4e4cc', seed: i, char: false }, { th: 1.6, tc: '#7a5030', sq: .62 })],
        ]);
        [[-20, -12], [24, 4], [-4, 22]].forEach(([u, v], i) => { const [x, y] = P(o, u, v, hill(u, v, 58, 16) + 4); it.push([y + 1, () => Q.lump(p, x, y, 8, 6.4, '#f4ecd8', 'qe' + i, { n: 10, jit: .06, hi: .8 })]); });
        it.push([400, () => gl(76, 90, 22, -8, .8) + gl(118, 106, 16, -6, .7)]);
        return s + Q.byDepth(it) + veil(p, D);
    },
    // ゴーヤチャンプルー: ゴーヤの半月切り・焼き色の豆腐・豚バラ・炒り卵、かつお節
    champuru: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 58, 18, 'cp', 34, 12, [
            [4, (x, y, r) => flat(p, x, y, K.goya(p, 0, 0, 20, r), { tc: '#2a5a1e', sq: .7 })],
            [3, (x, y, r) => Q.prism(p, x, y, Q.square(14), 7, '#f2e6cc', { rot: r, top: Q.lg(p, [[0, '#f8eed8'], [.6, '#ecd6a8'], [1, '#c8964a']], 0, 0, 1, 1) })],
            [2, (x, y, r, i) => Q.slice3q(p, x, y, 26, r, { c: '#b88a62', fat: '#f4e4cc', seed: i }, { th: 1.6, tc: '#6a4020', sq: .62 })],
            [3, (x, y, r, i) => `<path d="${Q.blob(x, y, 8, 5, 'cpe' + i, { n: 8, jit: .45 })}" fill="${Q.dome(p, '#f8d450')}" stroke="#d8a428" stroke-width=".5"/>`],
        ]);
        it.push([400, () => katsuobushi(100, 88, 60, 'cp', 18)]);
        return D.s + Q.byDepth(it) + veil(p, D);
    },
    // 厚揚げと豚肉の味噌炒め: 狐色の厚揚げ（角柱）・豚こま・キャベツ・ピーマン（お好みで）に味噌の照り
    atsuage: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 58, 18, 'at', 34, 13, [
            [3, (x, y, r) => Q.prism(p, x, y, [[-9, -9], [9, -9], [9, 9], [-9, 9]], 11, '#f0e2c4', { rot: r, top: Q.lg(p, [[0, '#e8b868'], [.6, '#c8883a'], [1, '#9a6024']], 0, 0, 1, 1) })],
            [3, (x, y, r, i) => Q.slice3q(p, x, y, 26, r, { c: '#a8643a', fat: '#f0d8b4', seed: i, gloss: .8 }, { th: 1.8, tc: '#5a2a10', sq: .62 })],
            [3, (x, y, r, i) => flat(p, x, y, K.leafPiece(p, 0, 0, 24, r, { c: '#b8d880', seed: i, cooked: true }), { tc: '#7a8a4a' })],
            [2, (x, y, r) => flat(p, x, y, K.pepperPiece(p, 0, 0, 15, r), { tc: '#2a5a1e' })],
        ]);
        return D.s + pool(p, 110, 124, 42, '#a8702e', 'att', { op: .55, gloss: false }) + Q.byDepth(it) + veil(p, D);
    },
    // 麻婆なす: 皮の紫と照りのなす、ひき肉、長ねぎ（お好みで）を赤茶のあんで
    mabonasu: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + pool(p, 100, 112, 60, '#a8401e', 'mbn', { op: .9 });
        const it = mound(o, 54, 12, 'mb', 16, 19, [[1, (x, y, r, i) => nasu(p, x, y, 20, r, i, '#b87048')]]);
        const R = rng('mbm');
        for (let i = 0; i < 26; i++){ const u = (R() - .5) * 110, v = (R() - .5) * 80; if (u * u / 56 / 56 + v * v / 42 / 42 > 1) continue; const [x, y] = P(o, u, v, 3); it.push([y + .3, () => `<path d="${Q.blob(x, y, 2.6, 1.7, 'mbm' + i, { n: 6, jit: .5 })}" fill="${Q.dome(p, '#7a3a1a')}" stroke="#5a2410" stroke-width=".4"/>`]); }
        it.push([400, () => negis(p, 100, 100, 80, 10, 'mb', '#6aa840')]);
        return s + Q.byDepth(it) + veil(p, D);
    },
    // なすと豚肉の味噌炒め: なす・豚バラ・ピーマン（お好みで）に味噌の照り
    nasumiso: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 58, 16, 'nm', 30, 14, [
            [4, (x, y, r, i) => nasu(p, x, y, 20, r, i)],
            [3, (x, y, r, i) => Q.slice3q(p, x, y, 30, r, { c: '#a8643a', fat: '#f0d8b4', seed: i, gloss: .8 }, { th: 2, tc: '#5a2a10', sq: .62 })],
            [2, (x, y, r) => flat(p, x, y, K.pepperPiece(p, 0, 0, 15, r), { tc: '#2a5a1e' })],
        ]);
        return D.s + Q.tarePool(p, 100, 118, 44, '#a8682e', 'nmt') + Q.byDepth(it) + veil(p, D);
    },
    // プルコギ: 甘辛の牛肉・玉ねぎ・にんじん・ピーマン・ニラ（お好みで）、白ごま
    bulgogi: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 58, 20, 'bg', 50, 10, [
            [5, (x, y, r, i) => flat(p, x, y, K.beefSlice(p, 0, 0, 22, r, { seed: i }), { tc: '#3a2010' }) + (i % 3 ? '' : gl(x - 3, y - 3, 8, -8, .6))],
            [3, (x, y, r) => onionStrip(x, y, 18, r, '#e6c27a')],
            [2, (x, y, r) => stick(p, x, y, 18, r, '#ec7b2d', .09)],
            [2, (x, y, r) => pepperBit(p, x, y, 20, r, '#3f8f2f', .09)],
            [2, (x, y, r) => pepperBit(p, x, y, 22, r, '#3a8a2a', .05)],
        ]);
        it.push([400, () => sesame(100, 92, 80, 'bg', '#f4e8c8', 22)]);
        return D.s + Q.tarePool(p, 100, 118, 46, '#7a4018', 'bgt') + Q.byDepth(it) + veil(p, D);
    },
    // タッカルビ: 鉄の鍋にコチュジャンの赤、鶏もも・キャベツ・玉ねぎ・さつまいも（お好みで）、まん中にとけたチーズ（お好みで）
    dakgalbi: p => {
        const V = Q.pan(p, { outer: '#6a625c', lip: '#7a726c', inner: '#5a524c', handleC: '#7a6a5e' }), S = Q.surface(p, V, { drop: 4, c: '#c4502e', glow: .25 });
        const o = S.o;
        const it = mound(o, 70, 10, 'dg', 36, 13, [
            [3, (x, y, r, i) => Q.lump(p, x, y, 11, 8, '#b84a2a', 'dgc' + i, { n: 9, jit: .3, hi: .6 })],
            [3, (x, y, r, i) => flat(p, x, y, K.leafPiece(p, 0, 0, 22, r, { c: '#c8e09a', seed: i, cooked: true }), { tc: '#7a8a4a' })],
            [2, (x, y, r) => onionWedge(p, x, y, 18, r, '#f0d8a8')],
            [2, (x, y, r) => Q.prism(p, x, y, [[-8, -4], [8, -4], [8, 4], [-8, 4]], 5, '#f2c050', { rot: r, top: Q.lg(p, [[0, '#ffe08a'], [1, '#e8a830']], 0, 0, 1, 1) })],
        ], { ry: 52 });
        const [cx, cy] = P(o, 0, 0, 10);
        it.push([cy + 20, () => { const d = Q.blob(cx, cy, 26, 11, 'dgch', { n: 12, jit: .3 }); return Q.dropOf(p, d, 1.5, 2.4, .3) + `<path d="${d}" fill="${Q.rg(p, [[0, '#fff2b0'], [.6, '#f8d860'], [1, '#e0a830']], .36, .3, .8)}" stroke="#d09a2a" stroke-width=".6"/>` + gl(cx - 8, cy - 4, 14, -6, .85); }]);
        return V.s + S.s + `<g ${V.inside}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, V.cy - 50, V.cy + V.iry) + V.shine();
    },
    // レバニラ炒め: 濃い赤茶のレバー・ニラ・もやし・にんじん（お好みで）
    rebanira: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 58, 18, 'rn', 60, 9, [
            [3, (x, y, r, i) => { const sl = Q.slab(p, x, y, 10, 6, 2.6, '#7a2e22', 'lv' + i, { rot: r, jit: .3 }); return sl.s + gl(x - 3, y - 2, 7, r, .6); }],
            [5, (x, y, r) => pepperBit(p, x, y, 26, r, '#3a8a2a', .05)],
            [3, (x, y, r, i) => flat(p, x, y, K.sprouts(p, 0, 0, 22, { n: 3, seed: i }), { th: .8, tc: '#b8b090', sq: .8 })],
            [1, (x, y, r) => stick(p, x, y, 18, r, '#ec7b2d', .09)],
        ]);
        return D.s + Q.tarePool(p, 100, 118, 44, '#8a4a1e', 'rnt') + Q.byDepth(it) + veil(p, D);
    },
    // 野菜炒め: キャベツ・もやし・にんじん・ピーマン・きくらげ（お好みで）・豚こま
    yasaiitame: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 58, 22, 'yi', 50, 10, [
            [4, (x, y, r, i) => flat(p, x, y, K.leafPiece(p, 0, 0, 24, r, { c: '#cce4a0', seed: i, cooked: true }), { tc: '#7a8a4a' })],
            [3, (x, y, r, i) => flat(p, x, y, K.sprouts(p, 0, 0, 22, { n: 3, seed: i }), { th: .8, tc: '#b8b090', sq: .8 })],
            [2, (x, y, r) => stick(p, x, y, 18, r, '#ec7b2d', .1)],
            [1, (x, y, r) => pepperBit(p, x, y, 18, r, '#3f8f2f', .12)],
            [1, (x, y, r, i) => `<path d="${Q.blob(x, y, 7, 4, 'kk' + i, { n: 9, jit: .5, rot: r })}" fill="${Q.dome(p, '#6a4a3a', .25, .3)}" stroke="#4a3022" stroke-width=".5"/>`],
            [2, (x, y, r, i) => Q.slice3q(p, x, y, 24, r, { c: '#b88a62', fat: '#f4e4cc', seed: i }, { th: 1.6, tc: '#6a4020', sq: .62 })],
        ]);
        return D.s + Q.byDepth(it) + gl(84, 86, 18, -8, .6) + veil(p, D);
    },
    // 冷しゃぶサラダ: レタスの上にゆでた豚の薄切り、トマト・きゅうり（お好みで）、ポン酢
    reishabu: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 60, 10, 'rsl', 12, 22, [[1, (x, y, r, i) => Q.leaf(p, x, y, 46, r, '#a8d070', 'rsl' + i, { wave: 4 })]]);
        mound(o, 40, 22, 'rsp', 9, 15, [[1, (x, y, r, i) => Q.slice3q(p, x, y - 6, 36, r, { c: '#e8c8b8', fat: '#fbf2ea', seed: i, char: false, gloss: .7 }, { th: 1.6, tc: '#a87a68', sq: .62 })]]).forEach(q => it.push([q[0] + 30, q[1]]));
        [[-56, 10], [54, 18], [-30, 40], [30, 42]].forEach(([u, v], i) => { const [x, y] = P(o, u, v, 4); it.push([y + 40, () => tomatoWedge(p, x, y, 22, i * 40 - 30)]); });
        [[-44, -30], [48, -24], [0, 50]].forEach(([u, v], i) => { const [x, y] = P(o, u, v, 4); it.push([y + 40, () => cucumber(p, x, y, 16, i * 30)]); });
        return D.s + pool(p, 100, 118, 40, '#a86a34', 'rsp', { op: .35, gloss: false }) + Q.byDepth(it) + veil(p, D);
    },
    // 棒棒鶏: きゅうりの細切りの上に、切った鶏むね（白い身）と練りごまのたれ。トマト（お好みで）
    banbanji: p => {
        const D = Q.plate(p), o = D.o;
        let s = D.s + Q.shredMound(p, 100, 112, 52, 12, ['#e8f2c4', '#8ac05a', '#3f8a2c'], 'bbj', { n: 130 });
        const it = [-30, -18, -6, 6, 18].map((v, i) => { const [x, y] = P(o, (i % 2) * 6 - 6, v, 14 - Math.abs(v) * .15); return [y, () => { const sl = Q.slab(p, x, y, 26, 8, 3, '#fbf6ea', 'bb' + i, { rot: -6, jit: .12, n: 12 }); return sl.s + `<g ${Q.clip(p, sl.d)}>${[-14, -5, 4, 13].map(d => `<path d="M${f(x + d - 2)},${f(y - 6)} l4,12" stroke="#e8dcc4" stroke-width=".8"/>`).join('')}</g>`; }]; });
        it.push([300, () => drizzle(p, [[64, 98], [80, 92], [98, 99], [116, 92], [134, 98]], '#c89a5a', 6)]);
        [[-58, 30], [58, 26], [-62, -6]].forEach(([u, v], i) => { const [x, y] = P(o, u, v, 2); it.push([y + 40, () => tomatoWedge(p, x, y, 22, i * 50 - 30)]); });
        return s + Q.byDepth(it) + veil(p, D);
    },

    // ---------- 副菜・和え ----------
    // ほうれん草のおひたし: 藍の小鉢に、そろえたほうれん草の山とかつお節
    ohitashi: p => {
        const V = Q.kobachi(p, { outer: '#34508a', lip: '#4a66a0', inner: '#efe8d8' });
        const o = { cx: 100, cy: V.cy + 6 };
        const it = [];
        // 茎をそろえた束: 手前に白緑の茎の切り口、奥に濃い葉
        for (let i = 0; i < 13; i++){ const u = -60 + i * 10, [x, y] = P(o, u, 14, 22 - Math.abs(u) * .2); it.push([y, () => `<path d="M${f(x - 5)},${f(y + 8)} L${f(x - 3)},${f(y - 6)} L${f(x + 5)},${f(y - 6)} L${f(x + 5)},${f(y + 8)}Z" fill="${Q.lg(p, [[0, '#b8d888'], [1, '#6a9a3a']], 0, 0, 1, 0)}" stroke="#4a7a2a" stroke-width=".5"/><ellipse cx="${f(x + 1)}" cy="${f(y + 8)}" rx="4.6" ry="2" fill="#dcecb0" stroke="#7aa850" stroke-width=".5"/>`]); }
        it.push([o.cy - 2, () => Q.greensMound(p, 100, o.cy - 2, 66, 34, '#2f6e24', 3, { n: 30 })]);
        it.push([o.cy + 40, () => katsuobushi(100, o.cy - 28, 56, 'oh', 22)]);
        return V.s + `<g ${V.above}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, V.cy - 50, V.cy + V.iry) + V.shine(.5);
    },
    // ポテトサラダ: 青灰の小鉢に、じゃがいものあえ衣の山。きゅうりの輪切り・ハム・玉ねぎ（お好みで）
    potesala: p => {
        const V = bowlOf(p, '#4a6a9a'), M = creamMound(p, 100, V.cy + 10, 70, 36, '#f4e2a8', 'ps', { bump: 16 });
        const it = onCream(M, 'ps', 16, .3, (x, y, r, i) => i % 3 === 0 ? cucumber(p, x, y, 13, r, { thick: 1 }) : i % 3 === 1 ? hamBit(p, x, y, 12, r) : Q.lump(p, x, y, 6, 4.5, '#f6e2a0', 'pp' + i, { hi: .4 }), 1);
        return inBowl(p, V, M.s + Q.byDepth(it));
    },
    // たたききゅうり: 赤茶の小鉢に、割れたきゅうりの塊（皮の濃い緑の側面と淡い身の面）、白ごま
    tatakikyuri: p => {
        const V = bowlOf(p, '#9a3a2a'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 62, 20, 'tk', 20, 18, [[1, (x, y, r, i) => { const R = rng('tq' + i), pts = Array.from({ length: 6 }, (_, k) => { const a = k / 6 * 6.283, rr = 10 * (.6 + R() * .5); return [Math.cos(a) * rr * 1.3, Math.sin(a) * rr * .8]; }); return Q.prism(p, x, y, pts, 8, '#3a7a2a', { rot: r, top: Q.lg(p, [[0, '#eef6d0'], [.6, '#cfe4a0'], [1, '#9cc46a']], 0, 0, 1, 1), line: .7 }) + gl(x - 4, y - 8, 8, -8, .6); }]], { ry: 50 });
        it.push([300, () => sesame(100, o.cy - 14, 90, 'tk', '#f6ecd0', 20)]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // もやしのナムル: 灰の小鉢に、もやし・ほうれん草（お好みで）・にんじん（お好みで）を3つの山に、白ごま
    namul: p => {
        const V = bowlOf(p, '#a8a49c'), o = { cx: 100, cy: V.cy + 8 };
        const it = [];
        it.push([o.cy - 6, () => Q.shredMound(p, 76, o.cy - 2, 34, 22, ['#fffcee', '#f2ecd4', '#d8ceb0'], 'nm1', { n: 90, w: 2 })]);
        it.push([o.cy - 8, () => Q.greensMound(p, 128, o.cy - 8, 30, 18, '#2f7a2a', 5, { n: 12 })]);
        it.push([o.cy + 14, () => Q.shredMound(p, 112, o.cy + 18, 28, 16, ['#ffb070', '#f07a2a', '#c85a18'], 'nm3', { n: 70, w: 1.6 })]);
        it.push([300, () => sesame(100, o.cy - 14, 90, 'nm', '#f6ecd0', 22)]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // コールスロー: 緑の小鉢に、細かいキャベツ・にんじん（お好みで）・コーン（お好みで）をマヨネーズであえた山
    coleslaw: p => {
        const V = bowlOf(p, '#3a6a4a'), o = { cx: 100, cy: V.cy + 10 };
        let b = Q.shredMound(p, 100, o.cy, 68, 30, ['#fbfcec', '#e2eec0', '#bcd494'], 'cs', { n: 220, w: 1.4 });
        const it = [];
        const R = rng('csv');
        for (let i = 0; i < 30; i++){ const u = (R() - .5) * 1.6, v = (R() - .5) * 1.4; if (u * u + v * v > .8) continue; const [x, y] = P(o, u * 66, v * 66, hill(u * 66, v * 66, 72, 30) + 2); it.push([y, () => i % 3 ? `<path d="M${f(x - 5)},${f(y)} l10,${f((R() - .5) * 4)}" stroke="#e8701e" stroke-width="1.8" stroke-linecap="round"/>` : `<rect x="${f(x - 1.8)}" y="${f(y - 1.6)}" width="3.6" height="3.2" rx="1" fill="${Q.dome(p, '#f6cf3a')}" stroke="#c99a12" stroke-width=".4"/>`]); }
        return inBowl(p, V, b + Q.byDepth(it));
    },
    // 冷ややっこ: 藍の器に絹ごし豆腐の大きな角柱。上に長ねぎ（お好みで）・おろし生姜・かつお節、醤油
    hiyayakko: p => {
        const V = bowlOf(p, '#2c4c7c'), o = { cx: 100, cy: V.cy + 10 };
        const [x, y] = P(o, 0, 4);
        let b = pool(p, 104, o.cy + 10, 50, '#8a5a2a', 'hy', { op: .45, gloss: false });
        b += Q.prism(p, x, y + 8, [[-40, -30], [40, -30], [40, 30], [-40, 30]], 30, '#f8f4e8', { rot: -8, top: Q.lg(p, [[0, '#ffffff'], [.6, '#f8f4ea'], [1, '#e8e0cc']], 0, 0, 1, 1), line: .7 });
        const ty = y + 8 - 30 * CZ;
        b += pool(p, x + 6, ty + 4, 22, '#7a4a20', 'hys', { op: .5 });
        b += negis(p, x - 8, ty, 40, 10, 'hy', '#5fa03a') + ginger(p, x + 16, ty - 2, 14) + katsuobushi(x - 6, ty - 4, 34, 'hy', 12);
        return inBowl(p, V, b);
    },
    // きゅうりとわかめの酢の物: 水色の小鉢に、薄い輪切りのきゅうりとわかめを甘酢に
    sunomono: p => {
        const V = bowlOf(p, '#9cc4d4'), S = Q.surface(p, V, { drop: 12, c: '#f2ecd0', glow: .2, rimShade: .18 }), o = S.o;
        const it = mound(o, 56, 16, 'sn', 22, 15, [
            [3, (x, y, r) => cucumber(p, x, y, 16, r, { thick: 1.2 })],
            [2, (x, y, r, i) => Q.leaf(p, x, y, 26, r, '#2f5a2a', 'snw' + i, { wave: 3, vein: false })],
        ], { lift: 2 });
        return V.s + S.s + `<g ${V.above}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, V.cy - 56, V.cy + V.iry) + V.shine(.5);
    },
    // ほうれん草の胡麻和え: 焦げ茶の小鉢に、すりごまをまとったほうれん草の山
    gomaae: p => {
        const V = bowlOf(p, '#4a3428'), o = { cx: 100, cy: V.cy + 8 };
        const g = Q.greensMound(p, 100, o.cy, 64, 34, '#2f6e24', 7, { n: 44 });
        const R = rng('gma'); let d = '';
        for (let i = 0; i < 70; i++){ const u = (R() - .5) * 1.7, v = (R() - .5) * 1.5; if (u * u + v * v > .85) continue; const [x, y] = P(o, u * 60, v * 60, hill(u * 60, v * 60, 64, 30) + 2); d += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.5" ry=".9" fill="${R() < .6 ? '#c8a878' : '#e8d4a8'}" stroke="#8a6a44" stroke-width=".25"/>`; }
        return inBowl(p, V, g + d);
    },
    // オクラのおかか和え: 黄土の小鉢に、星形のオクラの輪切りとかつお節
    okraokaka: p => {
        const V = bowlOf(p, '#c8a070'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 60, 16, 'ok', 26, 13, [[1, (x, y) => okraSlice(p, x, y, 16)]]);
        it.push([300, () => katsuobushi(100, o.cy - 10, 70, 'ok', 26)]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // 春雨サラダ: 水色の小鉢に、春雨・きゅうり・ハム・にんじん（お好みで）の細切り、白ごま
    harusamesalad: p => {
        const V = bowlOf(p, '#9cc4d4'), o = { cx: 100, cy: V.cy + 8 };
        const it = glassNoodles(p, o, 60, 24, 'hs', { n: 70, c: '#f2f0e8', w: 1.6 });
        it.push(...mound(o, 56, 24, 'hsv', 26, 11, [
            [3, (x, y, r) => stick(p, x, y - 2, 20, r, '#5a9a3a', .07)],
            [2, (x, y, r) => hamBit(p, x, y - 2, 18, r)],
            [2, (x, y, r) => stick(p, x, y - 2, 18, r, '#ec7b2d', .07)],
        ]));
        it.push([300, () => sesame(100, o.cy - 14, 80, 'hs', '#f6ecd0', 18)]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // マカロニサラダ: 生成りの小鉢に、マヨネーズであえたマカロニの山。きゅうり・ハム・玉ねぎ（お好みで）
    macaronisalad: p => {
        const V = bowlOf(p, '#d8d0c0'), M = creamMound(p, 100, V.cy + 10, 68, 30, '#f6eccc', 'mc', { bump: 6 });
        const it = onCream(M, 'mc', 34, .2, (x, y, r, i) => i % 5 === 0 ? cucumber(p, x, y, 12, r, { thick: 1 }) : i % 5 === 1 ? hamBit(p, x, y, 11, r) : flat(p, x, y, K.macaroni(p, 0, 0, 14, r), { th: 1.2, tc: '#a8803a', sq: .75 }));
        return inBowl(p, V, M.s + Q.byDepth(it));
    },
    // かぼちゃサラダ: 焦げ茶の小鉢に、かぼちゃのあえ衣の山（緑の皮のかけら）。玉ねぎ・ハム（お好みで）
    kabochasalad: p => {
        const V = bowlOf(p, '#4a3428'), M = creamMound(p, 100, V.cy + 10, 70, 36, '#f2b83e', 'kb', { bump: 14 });
        const it = onCream(M, 'kb', 20, .25, (x, y, r, i) => i % 3 === 0 ? `<path d="${Q.blob(x, y, 5, 2.6, 'kbs' + i, { n: 6, jit: .4, rot: r })}" fill="${Q.dome(p, '#3f7a2a')}" stroke="#2a5a1e" stroke-width=".4"/>` : i % 3 === 1 ? hamBit(p, x, y, 11, r) : onionStrip(x, y, 10, r, '#f6ecc8'), 1);
        return inBowl(p, V, M.s + Q.byDepth(it));
    },
    // 白菜の浅漬け: 青磁の小鉢に、白い軸と淡い緑の葉の白菜、昆布の細切り（お好みで）、赤唐辛子
    hakusaiasazuke: p => {
        const V = bowlOf(p, '#9ab8a8'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 60, 20, 'hz', 20, 18, [
            [3, (x, y, r) => flat(p, x, y, K.napaStem(p, 0, 0, 28, r), { tc: '#a8a488', th: 2 })],
            [2, (x, y, r, i) => Q.leaf(p, x, y, 28, r, '#c4e090', 'hzl' + i, { wave: 3 })],
        ]);
        const R = rng('hzk');
        for (let i = 0; i < 8; i++){ const [x, y] = P(o, (R() - .5) * 100, (R() - .5) * 80, 20); it.push([y + 50, () => i % 2 ? chiliRing(x, y, 2.6) : `<path d="M${f(x - 6)},${f(y)} l12,${f((R() - .5) * 4)}" stroke="#4a5a34" stroke-width="2" stroke-linecap="round"/>`]); }
        return inBowl(p, V, Q.byDepth(it));
    },
    // ブロッコリーのごまマヨ和え: 黄土の小鉢に、小房のブロッコリー（丸いつぼみの集まり）とごまマヨ
    broccoligoma: p => {
        const V = bowlOf(p, '#c8a060'), o = { cx: 100, cy: V.cy + 8 };
        const floret = (x, y, s, i) => { const R = rng('bf' + i); let g = Q.cast(p, x, y + s * .3, s * .5, s * .18, .3) + `<path d="M${f(x - 3)},${f(y + s * .05)} l1,${f(s * .32)} l4,0 l1,${f(-s * .32)}Z" fill="#a8cc78" stroke="#6a9a44" stroke-width=".5"/>`; for (let k = 0; k < 7; k++){ const a = k / 7 * 6.283 + R(), d = k ? s * .24 : 0; g += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y - s * .12 + Math.sin(a) * d * .6)}" r="${f(s * .2)}" fill="${Q.dome(p, '#3f8a34')}" stroke="#2a5e22" stroke-width=".5"/>`; } return g + `<path d="${Q.blob(x + 2, y - s * .05, s * .22, s * .1, 'bm' + i)}" fill="#f8f0d4" opacity=".85"/>` + sesame(x, y - s * .15, s * .5, 'bfs' + i, '#e8d4a8', 4); };
        const it = mound(o, 58, 20, 'bc', 14, 22, [[1, (x, y, r, i) => floret(x, y, 26, i)]]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // 長いもの梅和え: 藍の小鉢に、拍子木切りの長いも（白い角柱）を重ね、梅肉と大葉（お好みで）のせん切り
    nagaimoume: p => {
        const V = bowlOf(p, '#2c4c7c'), o = { cx: 100, cy: V.cy + 10 };
        const it = [];
        for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 5 - layer; i++){ const u = (i - (4 - layer) / 2) * 16, [x, y] = P(o, u, layer * -4, layer * 8); it.push([layer * 100 + y, () => Q.prism(p, x, y, [[-6, -30], [6, -30], [6, 30], [-6, 30]], 7, '#f4f0e2', { rot: 72, top: Q.lg(p, [[0, '#ffffff'], [1, '#e8e2cc']], 0, 0, 1, 1), line: .5 })]); }
        const [ux, uy] = P(o, 0, -6, 30);
        it.push([999, () => `<path d="${Q.blob(ux, uy, 12, 6, 'ume', { n: 10, jit: .3 })}" fill="${Q.dome(p, '#c42c35')}" stroke="#8a1a24" stroke-width=".5"/>` + gl(ux - 4, uy - 2, 8, -8, .8) + Array.from({ length: 7 }, (_, i) => `<path d="M${f(ux - 14 + i * 4)},${f(uy - 7 + (i % 2) * 3)} l6,-2" stroke="#3f8a2c" stroke-width="1.6" stroke-linecap="round"/>`).join('')]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // ごぼうサラダ: 藍の小鉢に、ごぼうとにんじんの細切りをマヨネーズであえた山、すりごま
    gobosalad: p => {
        const V = bowlOf(p, '#34508a'), o = { cx: 100, cy: V.cy + 10 };
        let b = Q.shredMound(p, 100, o.cy, 66, 30, ['#e8d8b4', '#b8986a', '#8a6a44'], 'gb', { n: 160, w: 2 });
        const R = rng('gbc'); const it = [];
        for (let i = 0; i < 40; i++){ const u = (R() - .5) * 1.7, v = (R() - .5) * 1.5; if (u * u + v * v > .8) continue; const [x, y] = P(o, u * 66, v * 66, hill(u * 66, v * 66, 70, 30) + 2); const a = R() * 180; it.push([y, () => `<g ${T(x, y, a)}><path d="M-6,0 l12,0" stroke="#b85a18" stroke-width="2.6" stroke-linecap="round"/><path d="M-6,0 l12,0" stroke="#f07a2a" stroke-width="1.6" stroke-linecap="round"/></g>`]); }
        for (let i = 0; i < 8; i++){ const u = (R() - .5) * 1.2, v = (R() - .5) * 1; const [x, y] = P(o, u * 60, v * 60, hill(u * 60, v * 60, 70, 30) + 3); it.push([y + .5, () => `<path d="${Q.blob(x, y, 7, 3, 'gbm' + i, { n: 8, jit: .4 })}" fill="#fbf4dc" opacity=".85"/>`]); }
        it.push([300, () => sesame(100, o.cy - 18, 80, 'gb', '#e8d4a8', 18)]);
        return inBowl(p, V, b + Q.byDepth(it));
    },
    // たこときゅうりの酢の物: 青灰の小鉢に、たこのそぎ切り（赤紫の縁と白い身）・きゅうり・わかめ（お好みで）
    takosunomono: p => {
        const V = bowlOf(p, '#5a7a9a'), S = Q.surface(p, V, { drop: 12, c: '#f2ecd0', glow: .2, rimShade: .18 }), o = S.o;
        const tako = (x, y, r, i) => { const sl = Q.slab(p, x, y, 11, 6, 2.6, '#f6eee6', 'tk' + i, { rot: r, jit: .2, edgeC: '#8a2a3a' }); return sl.s + `<g ${Q.clip(p, sl.d)}><path d="${Q.eD(x + 7, y + 3, 9, 6)}" fill="none" stroke="#a83448" stroke-width="5"/></g>` + `<circle cx="${f(x + 5)}" cy="${f(y - 1)}" r="1.6" fill="#f0d4d8" stroke="#a83448" stroke-width=".5"/>`; };
        const it = mound(o, 56, 16, 'ts', 22, 15, [
            [3, tako],
            [3, (x, y, r) => cucumber(p, x, y, 15, r, { thick: 1.2 })],
            [2, (x, y, r, i) => Q.leaf(p, x, y, 24, r, '#2f5a2a', 'tsw' + i, { wave: 3, vein: false })],
        ], { lift: 2 });
        return V.s + S.s + `<g ${V.above}>${Q.byDepth(it)}</g>` + Q.depthVeil(p, V, V.cy - 56, V.cy + V.iry) + V.shine(.5);
    },
    // かぶの甘酢漬け: 淡い青灰の小鉢に、くし切りのかぶ（白い角柱）、かぶの葉・昆布（お好みで）、赤唐辛子
    kabuamazu: p => {
        const V = bowlOf(p, '#a8bccc'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 58, 18, 'kz', 16, 22, [[1, (x, y, r) => Q.prism(p, x, y, [[-14, -6], [12, -8], [16, 2], [6, 8], [-12, 6]], 9, '#f2eee4', { rot: r, top: Q.lg(p, [[0, '#ffffff'], [.6, '#f6f2e8'], [1, '#ddd6c4']], 0, 0, 1, 1), line: .55 })]]);
        const R = rng('kzv');
        for (let i = 0; i < 10; i++){ const [x, y] = P(o, (R() - .5) * 100, (R() - .5) * 80, 20); const k = i % 3; it.push([y + 30, () => k === 0 ? chiliRing(x, y, 2.6) : k === 1 ? `<path d="M${f(x - 5)},${f(y)} l10,${f((R() - .5) * 4)}" stroke="#4f9a34" stroke-width="2.4" stroke-linecap="round"/>` : `<path d="M${f(x - 6)},${f(y)} l12,${f((R() - .5) * 3)}" stroke="#4a5a34" stroke-width="2" stroke-linecap="round"/>`]); }
        return inBowl(p, V, Q.byDepth(it));
    },
    // 白和え: 焦げ茶の小鉢に、豆腐とごまの白いあえ衣。ほうれん草・にんじん・こんにゃく（お好みで）
    shiraae: p => {
        const V = bowlOf(p, '#4a3428'), M = creamMound(p, 100, V.cy + 10, 70, 32, '#f2ece0', 'sr', { bump: 14, shade: .16 });
        const it = onCream(M, 'sr', 22, .22, (x, y, r, i) => i % 3 === 0 ? Q.leaf(p, x, y, 14, r, '#3f8a2c', 'srl' + i, { wave: 1, vein: false }) : i % 3 === 1 ? stick(p, x, y, 13, r, '#ec7b2d', .12) : stick(p, x, y, 12, r, '#9a948a', .14), 1);
        return inBowl(p, V, M.s + Q.byDepth(it));
    },
    // キャベツの塩昆布和え: 白い小鉢に、ざく切りのキャベツ・きゅうり（お好みで）と塩昆布の細切り、白ごま
    shiokombu: p => {
        const V = bowlOf(p, '#d8d4cc'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 60, 22, 'sk', 22, 17, [
            [4, (x, y, r, i) => flat(p, x, y, K.leafPiece(p, 0, 0, 28, r, { c: '#cfe6a4', seed: i }), { tc: '#8aa860' })],
            [1, (x, y, r) => cucumber(p, x, y, 13, r, { thick: 1 })],
        ]);
        const R = rng('skk');
        for (let i = 0; i < 22; i++){ const u = (R() - .5) * 110, v = (R() - .5) * 90; const [x, y] = P(o, u, v, hill(u, v, 64, 22) + 3); const a = R() * 180; it.push([y + 30, () => `<path d="M${f(x - 4)},${f(y)} l8,${f((R() - .5) * 3)}" stroke="#4a3a24" stroke-width="1.8" stroke-linecap="round" transform="rotate(${f(a * .3)} ${f(x)} ${f(y)})"/>`]); }
        it.push([400, () => sesame(100, o.cy - 14, 80, 'sk', '#f6ecd0', 16)]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // 大根サラダ: 淡い水色の器に、大根の細切りの山。水菜・かいわれ・ツナ・かつお節（お好みで）、刻みのり
    daikonsalad: p => {
        const V = bowlOf(p, '#c8dce0'), o = { cx: 100, cy: V.cy + 10 };
        let b = Q.shredMound(p, 100, o.cy, 66, 32, ['#ffffff', '#f2f0e6', '#d6d2c2'], 'dk', { n: 200, w: 1.8 });
        const R = rng('dkv'), it = [];
        for (let i = 0; i < 30; i++){ const u = (R() - .5) * 1.7, v = (R() - .5) * 1.5; if (u * u + v * v > .8) continue; const [x, y] = P(o, u * 64, v * 64, hill(u * 64, v * 64, 70, 32) + 2); const a = R() * 180, k = i % 3; it.push([y, () => k === 0 ? `<g ${T(x, y, a)}><path d="M-8,0 Q0,-2 8,0" stroke="#3f8a2c" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>` : k === 1 ? `<g ${T(x, y, a)}><path d="M-6,0 L5,0" stroke="#f4f4e4" stroke-width="1.4"/><ellipse cx="6.5" cy="0" rx="2.4" ry="1.4" fill="#6ab040"/></g>` : `<path d="${Q.blob(x, y, 3.4, 2.2, 'tn' + i, { n: 6, jit: .5 })}" fill="${Q.dome(p, '#d8b890')}" stroke="#a8885a" stroke-width=".4"/>`]); }
        it.push([400, () => katsuobushi(100, o.cy - 26, 40, 'dk', 12) + Array.from({ length: 10 }, (_, i) => { const x = 82 + R() * 36, y = o.cy - 30 + R() * 14; return `<path d="M${f(x)},${f(y)} l${f(4 + R() * 3)},${f((R() - .5) * 3)}" stroke="#34442c" stroke-width="1.3" stroke-linecap="round"/>`; }).join('')]);
        return inBowl(p, V, b + Q.byDepth(it));
    },
    // トマトのマリネ: 淡い平皿に、くし切りのトマトを放射に重ね、玉ねぎの薄切り・大葉（お好みで）のせん切り、オリーブ油の照り
    tomatomarine: p => {
        const D = Q.plate(p, { base: '#f6f8f6' }), o = D.o;
        const it = [];
        for (let ring2 = 0; ring2 < 2; ring2++){ const n = ring2 ? 4 : 9, rr = ring2 ? 18 : 44; for (let i = 0; i < n; i++){ const a = i / n * 6.283 + ring2 * .4, u = Math.cos(a) * rr, v = Math.sin(a) * rr, [x, y] = P(o, u, v, ring2 * 8); it.push([ring2 * 200 + y, () => tomatoWedge(p, x, y, 30, a * 57.3 + 90)]); } }
        const R = rng('tmo');
        for (let i = 0; i < 8; i++){ const [x, y] = P(o, (R() - .5) * 80, (R() - .5) * 60, 14); it.push([500 + i, () => onionStrip(x, y, 14, R() * 360, '#f4ecf2')]); }
        for (let i = 0; i < 12; i++){ const [x, y] = P(o, (R() - .5) * 50, (R() - .5) * 36, 16); it.push([600 + i, () => `<path d="M${f(x - 4)},${f(y)} l8,${f((R() - .5) * 3)}" stroke="#3f8a2c" stroke-width="1.6" stroke-linecap="round"/>`]); }
        return D.s + pool(p, 100, 112, 54, '#e8c860', 'tm', { op: .3, gloss: false }) + Q.byDepth(it) + veil(p, D);
    },
    // 菜の花のからし和え: 辛子色の小鉢に、緑の茎と黄緑のつぼみの菜の花
    karashiae: p => {
        const V = bowlOf(p, '#c8a840'), o = { cx: 100, cy: V.cy + 8 };
        const nano = (x, y, r, i) => { const R = rng('nh' + i); let g = `<g ${T(x, y, r)}>${Q.cast(p, 0, 3, 14, 3, .28)}<path d="M-14,2 L8,0" stroke="#2f6a22" stroke-width="4.4" stroke-linecap="round"/><path d="M-14,2 L8,0" stroke="#5aa03a" stroke-width="3" stroke-linecap="round"/><path d="M-12,1 L6,-.6" stroke="#a8d870" stroke-width=".9"/>`; g += `<path d="M-4,1 Q-8,-6 -2,-8 Q2,-4 -4,1Z" fill="#3f8a2c" stroke="#2a5e22" stroke-width=".5"/>`; for (let k = 0; k < 7; k++) g += `<circle cx="${f(10 + (R() - .5) * 8)}" cy="${f(-1 + (R() - .5) * 6)}" r="${f(1.6 + R())}" fill="${R() < .7 ? '#a8c848' : '#e8d840'}" stroke="#6a8a2a" stroke-width=".4"/>`; return g + '</g>'; };
        const it = mound(o, 60, 22, 'kr', 26, 14, [[1, nano]]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // ねぎ納豆: 黄土の小鉢に、糸を引く納豆の山（豆は光と影の球）、長ねぎの小口切り、からし
    natto: p => {
        const V = bowlOf(p, '#c8b090'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 60, 24, 'nt', 170, 5, [[1, (x, y) => Q.pea(p, x, y, 3.6, '#9a6a34')]]);
        const R = rng('ntt');
        it.push([300, () => { let t = ''; for (let i = 0; i < 16; i++){ const [x1, y1] = P(o, (R() - .5) * 100, (R() - .5) * 80, 16), [x2, y2] = P(o, (R() - .5) * 100, (R() - .5) * 80, 16); t += `<path d="M${f(x1)},${f(y1)} Q${f((x1 + x2) / 2)},${f(Math.min(y1, y2) - 10)} ${f(x2)},${f(y2)}" stroke="#fffaf0" stroke-width=".6" fill="none" opacity=".75"/>`; } return t; }]);
        it.push([310, () => negis(p, 100, o.cy - 14, 50, 9, 'nt', '#5fa03a')]);
        const [kx, ky] = P(o, 30, -20, 14); it.push([320, () => `<path d="${Q.blob(kx, ky, 6, 3.4, 'kr2')}" fill="${Q.dome(p, '#e8c030')}" stroke="#b8901a" stroke-width=".5"/>`]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // きゅうりの浅漬け: 青磁の小鉢に、厚めのきゅうりの輪切り、昆布・赤唐辛子（お好みで）
    kyuriasazuke: p => {
        const V = bowlOf(p, '#9ab8a8'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 60, 16, 'ka', 22, 17, [[1, (x, y, r) => cucumber(p, x, y, 20, r, { thick: 3.4 })]]);
        const R = rng('kak');
        for (let i = 0; i < 9; i++){ const [x, y] = P(o, (R() - .5) * 100, (R() - .5) * 80, 18); it.push([y + 40, () => i % 2 ? chiliRing(x, y, 2.6) : `<path d="M${f(x - 6)},${f(y)} l12,${f((R() - .5) * 4)}" stroke="#4a5a34" stroke-width="2" stroke-linecap="round"/>`]); }
        return inBowl(p, V, Q.byDepth(it));
    },
    // グリーンサラダ: 緑の小鉢に、レタスの山、トマトのくし切り・きゅうり・玉ねぎ（お好みで）、和風ドレッシングと白ごま
    greensalad: p => {
        const V = bowlOf(p, '#8ab0a0'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 62, 22, 'gs', 16, 20, [[1, (x, y, r, i) => Q.leaf(p, x, y, 42, r, i % 2 ? '#b8dc80' : '#8cc458', 'gsl' + i, { wave: 5 })]]);
        mound(o, 50, 22, 'gsv', 9, 22, [
            [2, (x, y, r) => tomatoWedge(p, x, y - 4, 24, r)],
            [2, (x, y, r) => cucumber(p, x, y - 4, 15, r, { thick: 1.2 })],
            [1, (x, y, r) => onionStrip(x, y - 4, 14, r, '#f6f0f2')],
        ]).forEach(q => it.push([q[0] + 40, q[1]]));
        it.push([400, () => sesame(100, o.cy - 14, 80, 'gs', '#f6ecd0', 16) + gl(84, o.cy - 22, 16, -8, .5)]);
        return inBowl(p, V, Q.byDepth(it));
    },

    // ---------- 副菜・炒 ----------
    // きんぴらごぼう: 生成りの小鉢に、照りのあるごぼうとにんじんの細切り、白ごまと赤唐辛子
    kinpira: p => {
        const V = bowlOf(p, '#d0c8b8'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 60, 22, 'kp', 110, 5, [
            [3, (x, y, r) => stick(p, x, y, 22, r, '#8a5a32', .07)],
            [2, (x, y, r) => stick(p, x, y, 20, r, '#e0702a', .07)],
        ]);
        it.push([400, () => sesame(100, o.cy - 16, 80, 'kp', '#f6ecd0', 18) + chiliRing(90, o.cy - 18, 2.4) + chiliRing(114, o.cy - 10, 2.4) + gl(86, o.cy - 20, 16, -8, .7)]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // トマトと卵の炒め物: 平皿に、ふんわりした炒り卵の塊と、照りのあるトマトのくし切り
    tomatotamago: p => {
        const D = Q.plate(p), o = D.o;
        const it = mound(o, 56, 16, 'tt', 20, 17, [
            [3, (x, y, r, i) => `<path d="${Q.blob(x, y, 13, 8, 'te' + i, { n: 10, jit: .4, rot: r })}" fill="${Q.rg(p, [[0, '#fff2a0'], [.55, '#f8d04a'], [1, '#d8a020']], .36, .3, .8)}" stroke="#c8961a" stroke-width=".5"/>` + gl(x - 4, y - 3, 8, -8, .7)],
            [2, (x, y, r) => tomatoWedge(p, x, y, 26, r)],
        ]);
        return D.s + pool(p, 100, 116, 50, '#e8704a', 'ttp', { op: .4, gloss: false }) + Q.byDepth(it) + veil(p, D);
    },
    // チンゲン菜のにんにく炒め: 茶の小鉢に、匙形の白緑の軸と濃い緑の葉、にんにくの照り
    chingensai: p => {
        const V = bowlOf(p, '#6a4a30'), o = { cx: 100, cy: V.cy + 8 };
        const stalk = (x, y, r, i) => Q.leaf(p, x + Math.cos(r / 57.3) * 20, y + Math.sin(r / 57.3) * 11, 34, r, '#2f6e24', 'cg' + i, { wave: 3 }) + `<g ${T(x, y, r, 1.25)}>${Q.cast(p, 0, 4, 16, 4, .28)}<path d="M-18,2 Q-6,-5 6,-4 Q12,0 6,4 Q-6,6 -18,2Z" fill="${Q.lg(p, [[0, '#f0f8dc'], [.6, '#c8e4a0'], [1, '#8ab860']], 0, 0, 0, 1)}" stroke="#6a9a44" stroke-width=".6"/><path d="M-14,1 Q-4,-2 6,-1" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/></g>`;
        const it = mound(o, 60, 26, 'cg', 22, 15, [[1, stalk]]);
        it.push([400, () => gl(84, o.cy - 20, 18, -8, .7)]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // きのこのバター醤油炒め: 青灰の小鉢に、しめじ・エリンギ・まいたけ（お好みで）、バターの照り
    kinokobutter: p => {
        const V = bowlOf(p, '#4a5a6a'), o = { cx: 100, cy: V.cy + 8 };
        const it = mound(o, 62, 24, 'kn', 34, 13, [
            [3, (x, y, r) => flat(p, x, y, K.shimeji(p, 0, 0, 30, r, { n: 4, cap: '#8a6a4c' }), { tc: '#6a5038', sq: .75 })],
            [3, (x, y, r) => flat(p, x, y, K.eringi(p, 0, 0, 28, r), { tc: '#8a6a44', sq: .7 })],
            [2, (x, y, r) => flat(p, x, y, K.maitake(p, 0, 0, 30, r), { tc: '#3a2a1a', sq: .75 })],
        ]);
        it.push([400, () => `<path d="${Q.blob(104, o.cy - 18, 8, 4, 'bt')}" fill="#fbe490" stroke="#d8b450" stroke-width=".5" opacity=".9"/>` + gl(86, o.cy - 20, 18, -8, .75)]);
        return inBowl(p, V, Q.byDepth(it));
    },
    // ほうれん草とベーコンのソテー: 生成りの小鉢に、ほうれん草の山とベーコンの短冊
    spinachbacon: p => {
        const V = bowlOf(p, '#d8d0c0'), o = { cx: 100, cy: V.cy + 8 };
        const it = [[o.cy, () => Q.greensMound(p, 100, o.cy, 62, 26, '#2f6e24', 9, { n: 34 })]];
        const R = rng('sbb');
        for (let i = 0; i < 9; i++){ const u = (R() - .5) * 90, v = (R() - .5) * 70; const [x, y] = P(o, u, v, hill(u, v, 66, 26) + 4); it.push([200 + y, () => flat(p, x, y, K.bacon(p, 0, 0, 18, 8, R() * 180), { tc: '#6a2418', th: 1.8, sq: .7 })]); }
        it.push([400, () => gl(84, o.cy - 20, 18, -8, .6)]);
        return inBowl(p, V, Q.byDepth(it));
    },
};
