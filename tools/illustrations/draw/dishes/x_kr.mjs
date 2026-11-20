// 韓国（kr_）: 手描きで描き直した主菜・副菜・汁物（x_kr）
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// このファイル専用の部品（xkr で始まる。w_kr / z_soup から写したものを含む）
// =========================================================

// 1桁小数のなめらかな線
function xkrSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const xkrSmooth = pts => xkrSm(pts, true);
function xkrOutline(p, c, r = .55){
    const id = p.def('xkrOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// 円の中にばらまく位置（重なりすぎないように）
function xkrSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xkrspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}

// ---------- 器 ----------
// ステンレスの器（ご飯の공기・国の器）: 金属の映り込みの帯
function xkrSteelBowl(p, { R = 92, inner = .86 } = {}){
    const outer = p.def('xkrSteelO', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6f7"/><stop offset=".28" stop-color="#b9c0c6"/><stop offset=".5" stop-color="#eef1f3"/><stop offset=".72" stop-color="#8f979e"/><stop offset="1" stop-color="#cdd2d6"/></linearGradient>`);
    const inn = p.def('xkrSteelI', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9aa2a9"/><stop offset=".45" stop-color="#d7dbdf"/><stop offset=".7" stop-color="#f3f5f6"/><stop offset="1" stop-color="#c3c9ce"/></linearGradient>`);
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="url(#${outer})"/></g>
        <circle cx="100" cy="100" r="${R - 1.5}" fill="none" stroke="#fff" stroke-width="1.4" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(R * inner)}" fill="url(#${inn})"/>
        <circle cx="100" cy="100" r="${f(R * inner)}" fill="none" stroke="#7f878e" stroke-width="1" opacity=".7"/>
        <path d="M${f(100 - R * .78)},${f(100 - R * .36)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 뚝배기（茶黒の釉薬の土鍋）: 厚い縁、外側に細かい斑点
function xkrTtuk(p, { R = 94 } = {}){
    const Rr = rng(p.id + 'ttuk');
    let sp = '';
    for (let i = 0; i < 26; i++){ const a = Rr() * 6.28, d = R * (.9 + Rr() * .08); sp += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" r="${f(.5 + Rr() * .7)}" fill="#c9a07a" opacity=".55"/>`; }
    return `<g ${p.sh(2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#5a3524', .18, .4, .35, .3)}"/></g>${sp}
        <circle cx="100" cy="100" r="${f(R * .87)}" fill="none" stroke="${p.g('#7a4a30', .3, .35)}" stroke-width="5"/>
        <circle cx="100" cy="100" r="${f(R * .84)}" fill="#2a160e"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .44)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#e8c2a0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 白磁の皿（縁は淡い灰）
const xkrPlate = (p, o = {}) => K.plate(p, { rim: '#cfcac0', ...o });
// 白磁の小鉢
const xkrDish = (p, o = {}) => K.kobachi(p, { glaze: '#efede6', inside: '#fbfaf6', ...o });
// 両手鍋（ステンレス、取っ手つき）
function xkrPot(p){
    const outer = p.def('xkrPotO', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef1f3"/><stop offset=".35" stop-color="#b4bbc1"/><stop offset=".55" stop-color="#e6e9ec"/><stop offset="1" stop-color="#8a9299"/></linearGradient>`);
    return `<g ${p.sh(1.8)}><rect x="2" y="91" width="196" height="18" rx="7" fill="${p.g('#9aa1a8', .3, .3)}"/><circle cx="100" cy="100" r="88" fill="url(#${outer})"/></g>
        <rect x="5" y="94" width="14" height="12" rx="4" fill="#6f777e"/><rect x="181" y="94" width="14" height="12" rx="4" fill="#6f777e"/>
        <circle cx="100" cy="100" r="86.5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>
        <circle cx="100" cy="100" r="81" fill="#8d959c"/>
        <path d="M30,60 A80,80 0 0 1 60,30" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
}

// ---------- 具 ----------
// ご飯（e_rice_noodle の erRice と同じ描き方）
function xkrRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xkrRice' + seed + x + y);
    const shape = xkrSmooth(ring(s / 2, 14, .07, R, 1, sy));
    const hi = lt(tint, hiK), mid = dk(tint, .02), sd = dk(tint, .3);
    const n = Math.round(s * s / 40 * density);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * s / 2 * .96;
        const gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy;
        const h = grain * (.42 + R() * .14), b = R() * Math.PI, dx = Math.cos(b) * h, dy = Math.sin(b) * h;
        const seg = `M${Math.round(gx - dx)} ${Math.round(gy - dy)}l${f1(dx * 2)} ${f1(dy * 2)}`;
        const lit = (gx + gy) / (s / 2) + (R() - .5) * 1.4 < .2;
        const l = L[i % layers];
        if (lit){ l[0] += seg; if (R() < .4) l[2] += `M${f1(gx - dx * .6 - .55)} ${f1(gy - dy * .6 - .55)}l${f1(dx * .9)} ${f1(dy * .9)}`; } else l[1] += seg;
    }
    const shade = p.def('xkrRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    const base = `<path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/>`;
    return `<g ${T(x, y)}><defs>${defs}</defs>${shadow ? `<g ${p.sh(.8 * shadow)}>${base}</g>` : base}${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// 白菜キムチの一片（下は白っぽい芯、上は赤い葉）
function xkrKimchi(p, x, y, s, r = 0, { seed = 1, deep = 0 } = {}){
    const R = rng(p.id + 'kmc' + seed + x + y);
    const k = s / 20;
    const leaf = Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1 - i / 8); return [Math.cos(a) * 11, -Math.sin(a) * 8.5 * (.8 + R() * .35) + 1]; });
    const stem = [[11, 1], [10, 6.5], [0, 7.6], [-10, 6.5], [-11, 1]];
    let fl = '';
    for (let i = 0; i < 5; i++) fl += `<circle cx="${f((R() - .5) * 18)}" cy="${f(-3.4 + R() * 9)}" r="${f(.35 + R() * .4)}" fill="#a81e0c" opacity=".85"/>`;
    const stemC = deep ? mix('#f2b08a', '#d8432a', deep) : '#f2b08a';
    return `<g ${T(x, y, r, k)}><path d="${smooth([...leaf, ...stem.slice(1, 4)], true, .8)}" fill="${p.g(stemC, .35, .15)}" stroke="#c0603e" stroke-width=".55"/>
        <path d="${smooth([...leaf, [9, 1.6], [0, 0], [-9, 1.6]], true, .8)}" fill="${p.g('#d8432a', .25, .2)}"/>
        <path d="M-6,-3 Q-4,-1 -6,1 M0,-5 Q2,-2 0,1 M6,-3 Q4,-1 6,1" stroke="#a82a16" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M-8,4.4 Q0,5.4 8,4.4" stroke="#fbe2cc" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/>
        ${fl}<path d="M-7,-2.6 Q-3,-6 3,-6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 大ねぎの斜め切り（白〜緑の細長い楕円の輪）
function xkrNegi(p, x, y, s, r = 0, { green = false } = {}){
    const c = green ? '#7fb84a' : '#eef2dc';
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .24)}" fill="${p.g(c, .25, .2)}" stroke="${dk(c, .3)}" stroke-width=".6"/><ellipse rx="${f(s * .34)}" ry="${f(s * .12)}" fill="none" stroke="${dk(c, .15)}" stroke-width=".7"/></g>`;
}
// 青唐辛子・赤唐辛子の斜め切り（輪と種）
function xkrChili(p, x, y, s, r = 0, { c = '#3f8f2a' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .34)}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".5"/><ellipse rx="${f(s * .32)}" ry="${f(s * .2)}" fill="${lt(c, .55)}"/><circle cx="${f(-s * .08)}" cy="0" r="${f(s * .07)}" fill="#f6eec8"/><circle cx="${f(s * .1)}" cy="${f(s * .04)}" r="${f(s * .07)}" fill="#f6eec8"/></g>`;
}
// 汁の油の粒
function xkrOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 汁のつや
const xkrShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// ぐつぐつの泡
const xkrBubbles = (pts, c = '#ffb59a') => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width=".9" opacity=".8"/><circle cx="${f(x - r * .3)}" cy="${f(y - r * .3)}" r="${f(r * .3)}" fill="#fff" opacity=".7"/>`).join('');
// 大きめのごま
function xkrSesame(p, x, y, rx, ry, n, { c = '#f4e8c8', seed = 1, size = 1 } = {}){
    const R = rng(p.id + 'ses' + seed + c + x);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.283, q = Math.sqrt(R()), cx = x + Math.cos(a) * q * rx, cy = y + Math.sin(a) * q * ry, b = R() * 3.14, L = .8 * size; d += `M${f1(cx - Math.cos(b) * L)},${f1(cy - Math.sin(b) * L)}l${f1(Math.cos(b) * L * 2)},${f1(Math.sin(b) * L * 2)}`; }
    return `<path d="${d}" stroke="${dk(c, .35)}" stroke-width="${f1(2.4 * size)}" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${f1(1.7 * size)}" stroke-linecap="round"/>`;
}
// ひき肉（小さな粒を2色の path にまとめて軽く）
function xkrMince(p, x, y, s, { c = '#7a4a2a', n = 40, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xmn' + seed + x + y);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, r = 1.3 + R() * 1.4; const q = `M${f1(cx - r)},${f1(cy)}l${f1(r * .7)},${f1(-r)}l${f1(r * 1.2)},${f1(r * .3)}l${f1(-r * .2)},${f1(r * 1.1)}Z`; if (R() < .5) a1 += q; else a2 += q; }
    return `<path d="${a1}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".4" stroke-linejoin="round"/><path d="${a2}" fill="${dk(c, .2)}" stroke="${dk(c, .4)}" stroke-width=".4" stroke-linejoin="round"/><path d="${a1}" fill="none" stroke="#fff" stroke-width=".4" opacity=".35" transform="translate(-.4 -.5)"/>`;
}
// 粉唐辛子（赤い細かい粒）
function xkrFlakes(p, x, y, rx, ry, n, { seed = 1, c = '#c22a14' } = {}){
    const R = rng(p.id + 'flk' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.283, q = Math.sqrt(R()), cx = x + Math.cos(a) * q * rx, cy = y + Math.sin(a) * q * ry, s = .6 + R() * .7; d += `M${f1(cx - s)},${f1(cy)}l${f1(s)},${f1(-s * .8)}l${f1(s)},${f1(s * 1.2)}Z`; }
    return `<path d="${d}" fill="${c}" opacity=".85"/>`;
}
// 細い棒（千切り・拍子木）
function xkrStick(p, x, y, L, w, r, c, { gloss = .5 } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${f(w)}" rx="${f(w * .4)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/>`
        + (gloss ? `<path d="M${f(-L / 2 + w * .7)},${f(-w * .2)} L${f(L / 2 - w)},${f(-w * .2)}" stroke="#fff" stroke-width="${f(w * .24)}" stroke-linecap="round" opacity="${gloss}"/>` : '') + `</g>`;
}
// 青菜の葉
function xkrLeaf(p, x, y, L, r, c){
    const k = L / 24;
    return `<g ${T(x, y, r, k)}><path d="M-12,0 Q-6,-7.5 3,-6.5 Q11,-3.5 12,0 Q9,5 1,6 Q-7,6 -12,0Z" fill="${p.g(c, .25, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/><path d="M-11,0 Q0,-1 11,0 M-4,-.4 L-1,-4 M2,-.3 L5,-3.6 M-2,.3 L1,3.6" stroke="${lt(c, .35)}" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
}
// レタスの葉（大きく波打つ）
function xkrLettuce(p, x, y, s, r = 0, { c = '#8cc456', seed = 1 } = {}){
    const R = rng(p.id + 'let' + seed + x + y);
    const pts = ring(s / 2, 16, .28, R, 1.1, .85);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .9)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .22)}" stroke-width=".7"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .72, b * .72]), true, .9)}" fill="${lt(c, .3)}" opacity=".55"/>
        <path d="M${f(-s * .45)},${f(s * .05)} Q0,${f(-s * .05)} ${f(s * .42)},${f(-s * .02)}" stroke="#eef7d8" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M${f(-s * .15)},0 L${f(-s * .3)},${f(-s * .25)} M${f(s * .1)},0 L${f(-s * .02)},${f(-s * .3)} M${f(s * .05)},0 L${f(s * .2)},${f(s * .25)} M${f(-s * .2)},${f(s * .02)} L${f(-s * .28)},${f(s * .26)}" stroke="#e4f2c4" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`;
}
// 薄切り牛肉（ひだと脂の筋）
function xkrBeef(p, x, y, s, r = 0, { c = '#7d4a2c', seed = 1, fat = .6 } = {}){
    const R = rng(p.id + 'xkrBf' + seed + x + y);
    const k = s / 30;
    const folds = Array.from({ length: 3 }, () => { const fx = -8 + R() * 16; return `M${f1(fx)},${f1(-6 + R() * 2)} q${f1((R() - .5) * 5)},6 ${f1((R() - .5) * 3)},${f1(11 + R() * 2)}`; }).join('');
    const fats = Array.from({ length: 2 }, () => { const fx = -10 + R() * 14, fy = -4 + R() * 7; return `M${f1(fx)},${f1(fy)} q${f1(3 + R() * 3)},${f1((R() - .5) * 4)} ${f1(7 + R() * 5)},${f1((R() - .5) * 3)}`; }).join('');
    return `<g ${T(x, y, r, k)}><path d="${xkrSmooth(ring(14, 16, .36, R, 1.1, .6))}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .38)}" stroke-width=".7"/>
        <path d="${folds}" stroke="${dk(c, .42)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="${fats}" stroke="#e6c4a0" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="${fat}"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 骨つき鶏のぶつ切り（たれをまとった身と、のぞく骨の端）
function xkrChickenBone(p, x, y, s, r = 0, { c = '#c0452a', seed = 1, bone = true, lite = false } = {}){
    const R = rng(p.id + 'cbn' + seed + x + y);
    const k = s / 24;
    const pts = ring(10, 10, .3, R, 1.2, .85);
    let pt = '';
    for (let i = 0; i < (lite ? 1 : 3); i++) pt += `<path ${T(-3 + (R() - .5) * 10, (R() - .5) * 7)} d="${smooth(ring(2.4 + R() * 1.8, 6, .5, R, 1.5, .7))}" fill="#efb486" opacity=".75"/>`;
    pt += `<path d="M-8,-1 q4,-1.6 8,0 M-6,2.6 q4,-1 8,.4" stroke="#e8a070" stroke-width=".8" fill="none" opacity=".7"/>`;
    return `<g ${T(x, y, r, k)}>${bone ? `<g ${p.sh(.4)}><rect x="8" y="-2.2" width="7" height="4.4" rx="2" fill="#efe2c8" stroke="#bfa880" stroke-width=".5"/><circle cx="15" cy="-1.6" r="2.4" fill="#f4ead4" stroke="#bfa880" stroke-width=".5"/><circle cx="15" cy="1.6" r="2.4" fill="#f4ead4" stroke="#bfa880" stroke-width=".5"/></g>` : ''}
        <path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>${pt}
        <path d="M-7,4 Q-1,6.5 6,4.4" stroke="${dk(c, .35)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M-7,-3.5 Q-3,-6.6 2.5,-6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 고등어 반마리（開いた半身を皮目を上に焼いたもの）: 頭を落とした左端、右に尾びれ。長さ L
function xkrMackerel(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'mk' + seed + x);
    const h = L * .3;
    const body = xkrSmooth([[-L * .5, -h * .38], [-L * .3, -h * .5], [0, -h * .5], [L * .22, -h * .38], [L * .36, -h * .14], [L * .4, 0], [L * .36, h * .14], [L * .22, h * .38], [0, h * .5], [-L * .3, h * .5], [-L * .5, h * .38], [-L * .52, 0]]);
    const tail = `M${f(L * .37)},0 L${f(L * .5)},${f(-h * .42)} Q${f(L * .46)},0 ${f(L * .5)},${f(h * .42)}Z`;
    const cid = p.uid();
    let st = '';
    for (let i = 0; i < 13; i++){ const sx = -L * .44 + i * L * .062; st += `M${f(sx)},${f(-h * .5)}q${f(3 + R() * 2)},${f(h * .18)} ${f(-1)},${f(h * .3)}t${f(1.5)},${f(h * .22)}`; }
    let ch = '';
    for (let i = 0; i < 14; i++) ch += `<ellipse cx="${f(-L * .45 + R() * L * .8)}" cy="${f(-h * .4 + R() * h * .8)}" rx="${f(2.5 + R() * 6)}" ry="${f(1.5 + R() * 3)}" fill="#3b2210" opacity="${f(.2 + R() * .4)}"/>`;
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs>
        <path d="${tail}" fill="${p.g('#5a5a52', .3, .3)}" stroke="#2e3036" stroke-width=".8"/><path d="M${f(L * .4)},0 L${f(L * .48)},${f(-h * .3)} M${f(L * .4)},0 L${f(L * .48)},${f(h * .3)}" stroke="#2a2420" stroke-width=".8" opacity=".6"/>
        <path d="${body}" fill="${p.g('#dcb47a', .2, .3)}" stroke="#3a3e44" stroke-width=".9"/>
        <g clip-path="url(#${cid})">
            <path d="${xkrSmooth([[-L * .55, -h * .6], [L * .45, -h * .6], [L * .45, h * .12], [0, h * .2], [-L * .55, h * .14]])}" fill="${p.g('#4f6672', .3, .3)}"/>
            <path d="${st}" stroke="#1b232c" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>
            <path d="${body}" fill="${p.rg('#c87a2e', .1, .3)}" opacity=".62"/>
            ${ch}
            <path d="M${f(-L * .5)},${f(h * .22)} Q0,${f(h * .34)} ${f(L * .38)},${f(h * .1)}" stroke="#f2e2c0" stroke-width="2" fill="none" opacity=".6"/>
            <path d="M${f(-L * .5)},${f(-h * .1)} L${f(-L * .44)},${f(-h * .1)}" stroke="#c87a3a" stroke-width="${f(h * .8)}" opacity=".35"/>
        </g>
        <path d="M${f(-L * .52)},${f(-h * .3)} Q${f(-L * .55)},0 ${f(-L * .52)},${f(h * .3)}" stroke="#d9a070" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${f(-L * .36)},${f(-h * .38)} Q0,${f(-h * .52)} ${f(L * .24)},${f(-h * .34)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M${f(-L * .2)},${f(-h * .2)} Q0,${f(-h * .28)} ${f(L * .12)},${f(-h * .2)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 삼겹살（煮た豚ばら: 白い脂と淡い赤身の層）
function xkrPorkBelly(p, x, y, w, h, r = 0, { c = '#c9a08a', seed = 1, tint = null } = {}){
    const R = rng(p.id + 'pb' + seed + x + y);
    const body = xkrSmooth([[-w / 2, -h / 2], [0, -h / 2 - 1], [w / 2, -h / 2], [w / 2 + 1, 0], [w / 2, h / 2], [0, h / 2 + 1], [-w / 2, h / 2], [-w / 2 - 1, 0]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 1.6]));
    const cid = p.uid();
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(.6)}><path d="${body}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <g clip-path="url(#${cid})"><rect x="${f(-w)}" y="${f(-h / 2)}" width="${2 * w}" height="${f(h * .28)}" fill="#f4e6d6"/><rect x="${f(-w)}" y="${f(h * .08)}" width="${2 * w}" height="${f(h * .16)}" fill="#f0dcc8" opacity=".9"/>
        ${tint ? `<path d="${body}" fill="${tint}" opacity=".3"/>` : ''}</g>
        <path d="M${f(-w * .38)},${f(-h * .38)} L${f(w * .3)},${f(-h * .38)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 焼いた豆腐に甘辛だれ（四角い厚切り、焼き目、たれ）
function xkrTofuJorim(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'tfj' + seed + x);
    const sauce = xkrSmooth([[-w / 2 + 1, -h * .3], [-w * .2, -h / 2 + 2], [w * .2, -h * .44], [w / 2 - 1, -h * .3], [w / 2 - 2, h * .2], [w * .2, h * .48], [-w * .2, h * .4], [-w / 2 + 1, h * .3]].map(([a, b]) => [a + (R() - .5) * 6, b + (R() - .5) * 5]));
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(h * .12)}" fill="${p.g('#d9a050', .3, .3)}" stroke="#9a6224" stroke-width=".8"/></g>
        <rect x="${f(-w / 2 + 3)}" y="${f(-h / 2 + 3)}" width="${w - 6}" height="${h - 6}" rx="${f(h * .1)}" fill="${p.rg('#e8b464', .25, .2)}"/>
        <path d="${sauce}" transform="scale(.66)" fill="${p.g('#9a3a1c', .25, .25)}" opacity=".78"/>
        <path d="M${f(-w / 2 + 5)},${f(-h / 2 + 4)} L${f(w / 2 - 8)},${f(-h / 2 + 4)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-w * .15)},${f(-h * .2)} q${f(w * .12)},${f(-h * .08)} ${f(w * .25)},0" stroke="#ffd6c0" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// いか（格子の切り目を入れた短冊が丸まったもの）
function xkrSquid(p, x, y, w, h, r = 0, { c = '#f1d9c6', sauce = '#c43a1e', seed = 1 } = {}){
    const R = rng(p.id + 'sq' + seed + x + y);
    const body = xkrSmooth([[-w / 2, -h * .3], [-w * .2, -h / 2], [w * .2, -h * .46], [w / 2, -h * .2], [w / 2 - 1, h * .3], [w * .15, h / 2], [-w * .25, h * .45], [-w / 2 + 1, h * .2]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]));
    const cid = p.uid();
    let grid = '';
    for (let i = -3; i <= 3; i++){ const gx = i * w / 6; grid += `M${f(gx - h)},${f(-h)}L${f(gx + h)},${f(h)}M${f(gx + h)},${f(-h)}L${f(gx - h)},${f(h)}`; }
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(.8)}><path d="${body}" fill="${p.g(c, .3, .25)}" stroke="${dk(sauce, .2)}" stroke-width=".8"/></g>
        <g clip-path="url(#${cid})"><path d="${body}" fill="${sauce}" opacity=".45"/><path d="${grid}" stroke="#fbeee4" stroke-width="1.6" fill="none" opacity=".85"/>
        <path d="${body}" fill="none" stroke="${sauce}" stroke-width="${f(h * .3)}" opacity=".55"/>
        <path d="${xkrSmooth(ring(h * .3, 7, .5, R, 1.6, .7)).replace('M', `M`)}" transform="translate(${f((R() - .5) * w * .3)} ${f((R() - .5) * h * .2)})" fill="${sauce}" opacity=".35"/></g>
        <path d="M${f(-w * .32)},${f(-h * .26)} Q${f(-w * .05)},${f(-h * .42)} ${f(w * .25)},${f(-h * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// いかの足
function xkrTentacles(p, x, y, s, r = 0, { c = '#e8b89a' } = {}){
    const k = s / 30;
    const legs = [[-8, -12], [-2, -14], [5, -12], [10, -6]].map(([ex, ey], i) => {
        const d = `M0,6 Q${f(ex * .4 - 3)},${f(ey * .3)} ${ex},${ey} q${f(3 + i)},-2 ${f(2 + i * .5)},2`;
        return `<path d="${d}" stroke="${dk(c, .35)}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#f6e2cc" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-dasharray=".4 2.2" opacity=".9"/>`;
    }).join('');
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${legs}<ellipse cx="0" cy="7" rx="6" ry="4.5" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g></g>`;
}
// 계란말이の1切れ（断面に巻いた層、にんじんとねぎの粒）
function xkrRollSlice(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'roll' + seed + x);
    const pts = [];
    const N = 56, turns = 2.6;
    for (let i = 0; i <= N; i++){
        const t = i / N, th = t * turns * 6.283 + .6, rr = .88 - t * .78, c = Math.cos(th), s = Math.sin(th);
        pts.push([Math.sign(c) * Math.pow(Math.abs(c), .3) * w / 2 * rr, Math.sign(s) * Math.pow(Math.abs(s), .3) * h / 2 * rr]);
    }
    let dots = '';
    for (let i = 0; i < 11; i++){ const c = i % 2 ? '#ef7a2a' : '#4f9a34'; dots += `<rect ${T((R() - .5) * w * .78, (R() - .5) * h * .72, R() * 180)} x="-1.2" y="-.9" width="2.4" height="1.8" rx=".5" fill="${c}"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(h * .3)}" fill="${p.rg('#fbe07a', .35, .14, .4, .38)}" stroke="#dcae44" stroke-width="2"/></g>
        <path d="${smooth(pts, false)}" stroke="#e8bb48" stroke-width="1" fill="none" stroke-linecap="round" opacity=".75"/>${dots}
        <path d="M${f(-w / 2 + 4)},${f(-h / 2 + 3)} L${f(w / 2 - 7)},${f(-h / 2 + 3)}" stroke="#fffbe6" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 멸치（小さな煮干し。銀〜飴色、黒い目）
function xkrAnchovy(p, x, y, s, r = 0, { c = '#cdb07a' } = {}){
    const k = s / 22;
    return `<g ${T(x, y, r, k)}><path d="M-10,0 Q-9,-3.6 -2,-3.4 Q6,-2.8 9,-.6 L11.5,-2.6 L10.6,0 L11.5,2.6 L9,.6 Q6,2.8 -2,3.4 Q-9,3.6 -10,0Z" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/>
        <path d="M-7,-.6 L7,-.6" stroke="#fff6dc" stroke-width=".9" stroke-linecap="round" opacity=".9"/><path d="M-4,1 L6,.8" stroke="${dk(c, .3)}" stroke-width=".6" opacity=".6"/><circle cx="-7.6" cy="-.5" r="1" fill="#2a2420"/></g>`;
}
// アーモンド
function xkrAlmond(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-s / 2)},0 Q${f(-s * .2)},${f(-s * .34)} ${f(s / 2)},0 Q${f(-s * .2)},${f(s * .34)} ${f(-s / 2)},0Z" fill="${p.g('#b7743a', .3, .3)}" stroke="#7a4518" stroke-width=".5"/></g><path d="M${f(-s * .3)},${f(-s * .05)} Q0,${f(-s * .14)} ${f(s * .3)},${f(-s * .02)}" stroke="#e9b98a" stroke-width=".8" fill="none" opacity=".8"/></g>`;
}
// 콩나물（大豆もやし: 大きめの黄色い豆と白い軸）
function xkrSoySprout(p, x, y, a, L, { bend = 0 } = {}){
    const rad = a * Math.PI / 180, dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2;
    const d = `M${f(x - dx)},${f(y - dy)} Q${f(x - dy * bend)},${f(y + dx * bend)} ${f(x + dx)},${f(y + dy)}`;
    return [`<path d="${d}" stroke="#cfc7a6" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fbf8ec" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        `<g ${T(x + dx, y + dy, a)}><ellipse rx="4.2" ry="3" fill="${p.g('#f2d65a', .3, .25)}" stroke="#c4a432" stroke-width=".5"/><path d="M-1,-2.4 L-1,2.4" stroke="#d8b83e" stroke-width=".6"/></g>`];
}
// 애호박の半月切り（皮の薄緑の縁、淡い果肉、種の並び）
function xkrZucchini(p, x, y, s, r = 0, { cooked = true } = {}){
    const fl = cooked ? '#e9e4b0' : '#f2f2cc';
    return `<g ${T(x, y, r)}><path d="M${-s / 2},0 A${s / 2},${s / 2} 0 0 1 ${s / 2},0Z" fill="#7aae4a" stroke="#4d7a2c" stroke-width=".5"/><path d="M${f(-s / 2 + 1.5)},0 A${f(s / 2 - 1.5)},${f(s / 2 - 1.5)} 0 0 1 ${f(s / 2 - 1.5)},0Z" fill="${p.g(fl, .25, .15)}"/>
        ${[-.22, 0, .22].map(t => `<ellipse cx="${f(t * s)}" cy="${f(-s * .14)}" rx="1.2" ry=".8" fill="#d8d49a"/>`).join('')}</g>`;
}
// さいの目（じゃがいも・豆腐）
function xkrDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 照りのある角切りじゃがいも（감자조림）
function xkrGlazedCube(p, x, y, s, r = 0, { c = '#c98a3a', seed = 1 } = {}){
    const R = rng(p.id + 'gcb' + seed + x + y);
    const pts = [[-1, -1], [0, -1.08], [1, -1], [1.06, 0], [1, 1], [0, 1.05], [-1, 1], [-1.06, 0]].map(([a, b]) => [a * s / 2 + (R() - .5) * 2, b * s / 2 + (R() - .5) * 2]);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .75)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62 - 1.2, b * .62 - 1.2]), true, .75)}" fill="${lt(c, .3)}" opacity=".65"/>
        <path d="M${f(-s * .3)},${f(-s * .3)} Q${f(-s * .05)},${f(-s * .44)} ${f(s * .25)},${f(-s * .32)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>
        <circle cx="${f(s * .22)}" cy="${f(s * .1)}" r="1" fill="#fff" opacity=".7"/></g>`;
}
// 豆腐の厚切り・角切り（汁の中）
function xkrTofu(p, x, y, w, h, r = 0, { c = '#f7f2e4', tint = null } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(Math.min(w, h) * .16)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .2)}" stroke-width=".6"/></g>
        ${tint ? `<rect x="${f(-w / 2)}" y="${f(h * .1)}" width="${w}" height="${f(h * .4)}" rx="${f(Math.min(w, h) * .16)}" fill="${tint}" opacity=".35"/>` : ''}
        <path d="M${f(-w / 2 + 2)},${f(-h / 2 + 2.5)} L${f(w / 2 - 3)},${f(-h / 2 + 2.5)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/></g>`;
}
// 角切りスパム（ピンクの角、焼き色）
function xkrSpam(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${f(s * .9)}" rx="${f(s * .2)}" fill="${p.g('#e48a78', .3, .25)}" stroke="#a8503e" stroke-width=".5"/></g><rect x="${f(-s / 2)}" y="${f(s * .1)}" width="${s}" height="${f(s * .3)}" rx="${f(s * .15)}" fill="#c0603a" opacity=".45"/><path d="M${f(-s * .3)},${f(-s * .28)} L${f(s * .2)},${f(-s * .28)}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".7"/></g>`;
}
// 미역（大きめのわかめ、つや）
function xkrMiyeok(p, x, y, s, r, { seed = 1 } = {}){
    const R = rng(p.id + 'wak' + seed);
    const pts = ring(s / 2, 15, .85, R, 1.25, .85);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .6)}" fill="${p.g('#33441f', .3, .3)}" stroke="#1e2a14" stroke-width=".6" opacity=".9"/><path d="M${f(-s * .5)},${f(s * .02)} Q0,${f(-s * .08)} ${f(s * .5)},${f(s * .04)}" stroke="#2a3a1c" stroke-width="1.4" fill="none" opacity=".7"/><path d="M${f(-s * .3)},${f(-s * .12)} Q0,${f(-s * .2)} ${f(s * .26)},${f(-s * .12)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".4"/></g>`;
}
// 牛肉の小さなかけら（スープの中）
function xkrBeefBit(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'bb' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${xkrSmooth(ring(s / 2, 9, .75, R, 1.4, .7))}" fill="${p.g('#7c6656', .2, .3)}" stroke="#4e3a2e" stroke-width=".5"/><path d="M${f(-s * .25)},${f(-s * .1)} q${f(s * .2)},${f(-s * .1)} ${f(s * .4)},0" stroke="#c9a88e" stroke-width=".7" fill="none" opacity=".7"/></g>`;
}
// のり（刻みのり・もみのり）
function xkrGim(p, x, y, s, { n = 12, seed = 1 } = {}){
    const R = rng(p.id + 'gim' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .7, a = R() * 6.28, L = 3 + R() * 4, w = 1.6 + R() * 1.6; const ux = Math.cos(a), uy = Math.sin(a); d += `M${f1(cx - ux * L)},${f1(cy - uy * L)}l${f1(ux * 2 * L)},${f1(uy * 2 * L)}l${f1(-uy * w)},${f1(ux * w)}l${f1(-ux * 2 * L)},${f1(-uy * 2 * L)}Z`; }
    return `<path d="${d}" fill="#1f2a1c" stroke="#3a4a30" stroke-width=".4"/>`;
}
// 目玉焼き（白身がつややか、黄身はとろり）
function xkrFriedEgg(p, x, y, s, r = 0){
    const R = rng(p.id + 'egg' + x);
    const pts = ring(19, 13, .2, R);
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.9)}><path d="${xkrSmooth(pts)}" fill="${p.rg('#fffdf8', .1, .08)}" stroke="#e2d8c2" stroke-width=".9"/></g>
        <path d="${xkrSmooth(pts)}" fill="none" stroke="#d9a25a" stroke-width="2.2" opacity=".35"/>
        <path d="${xkrSmooth(pts.map(([a, b]) => [a * .6 + 1.5, b * .6 + 1.2]))}" fill="#f6f1e6" opacity=".7"/>
        <circle cx="2" cy="1" r="8.4" fill="${p.rg('#f7a01a', .35, .18, .35, .32)}" stroke="#d07d10" stroke-width=".8"/>
        <ellipse cx="-.8" cy="-2.2" rx="3.2" ry="1.9" fill="#fff" opacity=".8"/>
        <path d="M-14,-6 Q-9,-13 -1,-14" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}

// いちょう切り（大根・にんじん）: 1/4 の円。c は色、core は中心寄りの明るい輪
function xkrZIcho(p, x, y, s, r = 0, { c = '#f1e6c8', edge = null, op = 1 } = {}){
    const h = s / 2, e = edge || dk(c, .22);
    return `<g ${T(x, y, r)} opacity="${op}"><path d="M${-h},${h} L${h},${h} A${s},${s} 0 0 0 ${-h},${-h} Z" fill="${p.g(c, .32, .22)}" stroke="${e}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M${f(-h + s * .72)},${h} A${f(s * .72)},${f(s * .72)} 0 0 0 ${-h},${f(h - s * .72)}" stroke="${lt(c, .4)}" stroke-width="1" fill="none" opacity=".8"/>
        <path d="M${f(-h + s * .12)},${f(-h + s * .3)} Q${f(-h + s * .45)},${f(-h + s * .35)} ${f(-h + s * .7)},${f(-h + s * .62)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// ふんわり固まった溶き卵（ふちが毛羽立った、半透明の雲）
function xkrZEgg(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'zse' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${smooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// あさり: open=true は殻が開いて白い内側と身が見える姿、false は縞模様の殻の外側に身が少しのぞく姿
function xkrZClam(p, x, y, s, r = 0, { seed = 1, meat = '#f0b46c', open = true } = {}){
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
// くずした豆腐・すくった絹ごし豆腐（不定形）
function xkrZTofuChunk(p, x, y, s, r = 0, { seed = 1, c = '#f8f3e6', tint = null } = {}){
    const R = rng(p.id + 'ztf' + seed + x + y);
    const pts = ring(s / 2, 9, .32, R, 1.15, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .75)}" fill="${p.g(c, .3, .18)}" stroke="${dk(c, .2)}" stroke-width=".6"/></g>
        ${tint ? `<path d="${smooth(pts.map(([a, b]) => [a * .9 + 1.2, b * .9 + 1.2]), true, .75)}" fill="${tint}" opacity=".35"/>` : ''}
        <path d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 薄切り玉ねぎ（煮て透き通った細い弧）
function xkrZOnionStrip(p, x, y, s, r = 0, { c = '#f6e2ae' } = {}){
    const d = `M${-s / 2},${f(s * .14)} Q0,${f(-s * .34)} ${s / 2},${f(s * .14)} L${f(s / 2 - 2)},${f(s * .16)} Q0,${f(-s * .2)} ${f(-s / 2 + 2)},${f(s * .16)}Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="${c}" opacity=".62" stroke="${lt(c, .4)}" stroke-width=".9" stroke-linejoin="round"/><path d="M${f(-s * .34)},${f(-s * .02)} Q0,${f(-s * .24)} ${f(s * .3)},${f(-s * .04)}" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 生卵の黄身（スンドゥブ）: 半透明の白身＋つやのある黄身
function xkrZRawEgg(p, x, y, s){
    const R = rng(p.id + 'zre' + x);
    return `<path ${T(x, y)} d="${smooth(ring(s / 2, 10, .25, R))}" fill="#fbf6ea" opacity=".75" stroke="#e8dfc8" stroke-width=".6"/>
        <g ${p.sh(.6)}><circle cx="${x + 1}" cy="${y + 1}" r="${f(s * .26)}" fill="${p.rg('#f9a81e', .3, .2, .35, .32)}" stroke="#d98510" stroke-width=".7"/></g>
        <ellipse cx="${f(x - s * .06)}" cy="${f(y - s * .07)}" rx="${f(s * .09)}" ry="${f(s * .05)}" fill="#fff" opacity=".85" transform="rotate(-30 ${f(x - s * .06)} ${f(y - s * .07)})"/>`;
}

// ---------- 新しく足した器 ----------
// 무쇠 철판（닭갈비の大きな丸い鉄鍋）: 左右に小さな取っ手
function xkrIronPan(p, { R = 92 } = {}){
    return `<g ${p.sh(2)}><rect x="2" y="92" width="196" height="16" rx="6" fill="${p.g('#3a3432', .2, .3)}"/><circle cx="100" cy="100" r="${R}" fill="${p.rg('#3e3836', .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="#6a625e" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(R * .9)}" fill="${p.rg('#2a2523', .12, .25, .6, .62)}"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .42)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#a69d98" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 삼겹살用の丸い鉄板（溝のある黒い焼き板）
function xkrGrill(p, { R = 92 } = {}){
    const cid = p.uid();
    let gr = '';
    for (let i = -6; i <= 6; i++) gr += `M${f(100 + i * 13 - 90)},${f(100 - 90)} l180,180`;
    return `<g ${p.sh(2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#3a3634', .2, .3, .35, .3)}"/></g>
        <defs><clipPath id="${cid}"><circle cx="100" cy="100" r="${f(R * .86)}"/></clipPath></defs>
        <circle cx="100" cy="100" r="${f(R * .86)}" fill="${p.rg('#2a2624', .1, .2, .6, .62)}"/>
        <g clip-path="url(#${cid})"><path d="${gr}" stroke="#4a4442" stroke-width="3.4" opacity=".8"/><path d="${gr}" transform="translate(-2 0)" stroke="#161210" stroke-width="1.2" opacity=".7"/></g>
        <path d="M${f(100 - R * .74)},${f(100 - R * .42)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#a69d98" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// 木のまな板（四角、角丸、木目）
function xkrBoard(p, { w = 184, h = 150, c = '#d9b07a' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2, R = rng(p.id + 'board');
    let gr = '';
    for (let i = 0; i < 9; i++){ const yy = y + 10 + i * (h - 20) / 8 + (R() - .5) * 6; gr += `M${f(x + 8)},${f(yy)} q${f(w * .25)},${f((R() - .5) * 8)} ${f(w * .5)},0 t${f(w * .45)},${f((R() - .5) * 6)}`; }
    return `<g ${p.sh(1.8)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${p.g(c, .25, .25)}"/></g>
        <path d="${gr}" stroke="${dk(c, .25)}" stroke-width=".9" fill="none" opacity=".45"/>
        <rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="12" fill="none" stroke="${lt(c, .4)}" stroke-width="1.4" opacity=".7"/>
        <path d="M${x + 10},${y + 28} Q${x + 10},${y + 10} ${x + 30},${y + 10}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// 놋그릇（真鍮の鉢）
function xkrBrass(p, { R = 92, lip = .88 } = {}){
    const o = p.def('xkrBrassO', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc8a"/><stop offset=".35" stop-color="#c99a3a"/><stop offset=".6" stop-color="#ecc86a"/><stop offset="1" stop-color="#8e6420"/></linearGradient>`);
    const i = p.def('xkrBrassI', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9c7028"/><stop offset=".5" stop-color="#d8b05a"/><stop offset="1" stop-color="#f2d68a"/></linearGradient>`);
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="url(#${o})"/></g>
        <circle cx="100" cy="100" r="${R - 1.5}" fill="none" stroke="#fff3c8" stroke-width="1.2" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(R * lip)}" fill="url(#${i})"/>
        <path d="M${f(100 - R * .76)},${f(100 - R * .38)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#fffbe6" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 白い汁碗（縁に細い線）
const xkrSoupBowl = (p, o = {}) => K.bowl(p, { glaze: '#f3f1ec', inside: '#fbfaf6', lip: .9, ...o });
// 浅い両手鍋（부대찌개の平たい鍋）
function xkrWidePot(p, { gold = false } = {}){
    const st = gold ? ['#fbe9a8', '#d8b04e', '#f4dc8a', '#9a7426', '#a8822e'] : ['#f2f4f5', '#b8bec4', '#e9ecee', '#868e95', '#7e868d'];
    const o = p.def('xkrWideO' + gold, id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${st[0]}"/><stop offset=".4" stop-color="${st[1]}"/><stop offset=".6" stop-color="${st[2]}"/><stop offset="1" stop-color="${st[3]}"/></linearGradient>`);
    return `<g ${p.sh(1.8)}><path d="M0,94 q0,-6 8,-6 h12 v24 h-12 q-8,0 -8,-6Z M200,94 q0,-6 -8,-6 h-12 v24 h12 q8,0 8,-6Z" fill="#5a3a26"/><circle cx="100" cy="100" r="88" fill="url(#${o})"/></g>
        <circle cx="100" cy="100" r="86" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>
        <circle cx="100" cy="100" r="83" fill="${st[4]}"/>
        <path d="M28,62 A80,80 0 0 1 62,28" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
}

// ---------- 新しく足した具 ----------
// 円の中にクリップして描く
function xkrClip(p, R, body, cx = 100, cy = 100){
    const id = p.uid();
    return `<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs><g clip-path="url(#${id})">${body}</g>`;
}
// 가래떡（棒の餅）: 上から見た角の丸い棒。tint で色がつく
function xkrTteok(p, x, y, L, w, r = 0, { c = '#f8f3e8', sauce = null } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="${f(w / 2)}" fill="${p.g(c, .3, .18)}" stroke="${dk(c, .22)}" stroke-width=".6"/></g>
        ${sauce ? `<rect x="${f(-L / 2)}" y="${f(-w * .1)}" width="${L}" height="${f(w * .6)}" rx="${f(w * .3)}" fill="${sauce}" opacity=".55"/>` : ''}
        <path d="M${f(-L / 2 + w * .5)},${f(-w * .22)} L${f(L / 2 - w * .5)},${f(-w * .22)}" stroke="#fff" stroke-width="${f(w * .2)}" stroke-linecap="round" opacity=".8"/></g>`;
}
// 떡국떡（斜めの楕円の薄切り餅、半透明の白）
function xkrTteokSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .3)}" fill="${p.rg('#fbf8f0', .2, .1, .38, .35)}" stroke="#ddd4c0" stroke-width=".7"/></g>
        <ellipse rx="${f(s * .36)}" ry="${f(s * .19)}" fill="none" stroke="#efe8d8" stroke-width="1"/>
        <path d="M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .05)},${f(-s * .24)} ${f(s * .2)},${f(-s * .18)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// 만두（ひだのある半月の餃子型、ゆでて半透明）
function xkrMandu(p, x, y, s, r = 0, { c = '#f6f0e2' } = {}){
    const k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-15,4 C-15,-9 15,-9 15,4 C10,8 -10,8 -15,4Z" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .25)}" stroke-width=".7"/></g>
        <path d="M-12,1 C-8,-6 8,-6 12,1" stroke="${dk(c, .16)}" stroke-width="1" fill="none"/>
        ${[-9, -4.5, 0, 4.5, 9].map(a => `<path d="M${a},${f(-5 + Math.abs(a) * .2)} q1.5,2.4 0,5" stroke="${dk(c, .2)}" stroke-width=".8" fill="none" opacity=".8"/>`).join('')}
        <path d="M-9,4.5 Q0,6.5 9,4.5" fill="none" stroke="#c7b8a0" stroke-width="1.4" opacity=".4"/>
        <path d="M-9,-3 Q-4,-6.4 2,-6.2" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 어묵（平たい練り物の短冊・折った板）
function xkrEomuk(p, x, y, w, h, r = 0, { c = '#d9a65a', seed = 1, sauce = null } = {}){
    const R = rng(p.id + 'eom' + seed + x + y);
    const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 1.4]);
    let dots = '';
    for (let i = 0; i < Math.round(w * h / 90); i++) dots += `<circle cx="${f((R() - .5) * w * .85)}" cy="${f((R() - .5) * h * .8)}" r="${f(.4 + R() * .5)}" fill="${dk(c, .3)}" opacity=".45"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .25)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        ${sauce ? `<path d="${smooth(pts, true, .25)}" fill="${sauce}" opacity=".3"/>` : ''}${dots}
        <path d="M${f(-w / 2 + 2)},${f(-h / 2 + 1.6)} L${f(w / 2 - 3)},${f(-h / 2 + 1.6)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 串に波形に刺した어묵（어묵탕）
function xkrEomukSkewer(p, x, y, L, r = 0, { c = '#e0b26a' } = {}){
    const k = L / 80;
    const folds = [-27, -9, 9, 27].map((a, i) => `<g transform="translate(${a} 0)"><path d="M-9,-11 Q-11,0 -9,11 L9,11 Q11,0 9,-11Z" fill="${p.g(i % 2 ? c : lt(c, .1), .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".7"/><path d="M-6,-8 L6,-8" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".6"/>${i % 2 ? '' : '<path d="M8,-11 L8,11" stroke="' + dk(c, .3) + '" stroke-width="1.6" opacity=".5"/>'}</g>`).join('');
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-44,0 L40,0" stroke="#d8c09a" stroke-width="2.4" stroke-linecap="round"/>${folds}</g></g>`;
}
// 녹두나물（緑豆もやし: 細く白い軸と小さな黄緑の頭）
function xkrMungSprouts(p, x, y, s, { n = 30, seed = 1, sy = 1, tint = null } = {}){
    const R = rng(p.id + 'mung' + seed + x + y);
    let st = '', hd = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, b = R() * Math.PI, L = 16 + R() * 12, bend = (R() - .5) * 8;
        const dx = Math.cos(b) * L / 2, dy = Math.sin(b) * L / 2;
        const path = `M${f1(cx - dx)},${f1(cy - dy)} Q${f1(cx + bend)},${f1(cy - bend)} ${f1(cx + dx)},${f1(cy + dy)}`;
        st += path;
        if (R() < .4) hd += `<ellipse cx="${f1(cx + dx)}" cy="${f1(cy + dy)}" rx="2" ry="1.3" transform="rotate(${f1(b * 57.3)} ${f1(cx + dx)} ${f1(cy + dy)})" fill="#d6d77a" stroke="#a8a84a" stroke-width=".4"/>`;
    }
    return `<g ${p.sh(.5)}><path d="${st}" stroke="#c9c2a6" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="${st}" stroke="${tint || '#fbf9f0'}" stroke-width="2.2" fill="none" stroke-linecap="round"/>${hd}</g>`;
}
// 고사리（茶色い細い茎、先が少し巻く）
function xkrBracken(p, x, y, s, { n = 24, seed = 1, c = '#7a5230', sy = 1 } = {}){
    const R = rng(p.id + 'gos' + seed + x);
    let out = '', hi = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, b = R() * Math.PI, L = 22 + R() * 16;
        const dx = Math.cos(b) * L / 2, dy = Math.sin(b) * L / 2, bend = (R() - .5) * 10;
        const curl = R() < .4 ? ` q${f1(-dy * .12)},${f1(dx * .12)} ${f1(-dx * .1)},${f1(-dy * .1 + 2)}` : '';
        const col = R() < .5 ? c : R() < .5 ? lt(c, .12) : dk(c, .15);
        out += `<path d="M${f1(cx - dx)},${f1(cy - dy)} Q${f1(cx + bend)},${f1(cy - bend)} ${f1(cx + dx)},${f1(cy + dy)}${curl}" stroke="${col}" stroke-width="${f1(2.6 + R() * 1.2)}" fill="none" stroke-linecap="round"/>`;
        hi += `M${f1(cx - dx * .6)},${f1(cy - dy * .6 - 1)} L${f1(cx + dx * .3)},${f1(cy + dy * .3 - 1)}`;
    }
    return `<g ${p.sh(.6)}>${out}</g><path d="${hi}" stroke="#fff" stroke-width=".7" opacity=".3" stroke-linecap="round"/>`;
}
// 細切りの束（千切り: 大根・じゃがいも・にんじん）を一度に描く
function xkrJulienne(p, x, y, s, { n = 40, seed = 1, c = '#f4eedc', w = 2.6, L = 26, sy = 1, edge = null, gloss = .5 } = {}){
    const R = rng(p.id + 'jul' + seed + x + y + c);
    let a1 = '', a2 = '', hi = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, b = R() * Math.PI, l = L * (.6 + R() * .5);
        const dx = Math.cos(b) * l / 2, dy = Math.sin(b) * l / 2, bend = (R() - .5) * 4;
        const path = `M${f1(cx - dx)},${f1(cy - dy)} Q${f1(cx + bend)},${f1(cy - bend)} ${f1(cx + dx)},${f1(cy + dy)}`;
        if (R() < .5) a1 += path; else a2 += path;
        if (R() < .5) hi += `M${f1(cx - dx * .5 - .5)},${f1(cy - dy * .5 - .6)} L${f1(cx + dx * .3 - .5)},${f1(cy + dy * .3 - .6)}`;
    }
    const e = edge || dk(c, .3);
    return `<g ${p.sh(.5)}><g stroke-linecap="round" fill="none"><path d="${a1}${a2}" stroke="${e}" stroke-width="${f1(w + 1)}"/><path d="${a1}" stroke="${c}" stroke-width="${w}"/><path d="${a2}" stroke="${lt(c, .14)}" stroke-width="${w}"/></g></g><path d="${hi}" stroke="#fff" stroke-width="${f1(w * .3)}" stroke-linecap="round" opacity="${gloss}"/>`;
}
// 黒豆（つやのある黒い粒）
function xkrBean(p, x, y, s, r = 0, { c = '#2a211c' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .4)}" fill="${p.rg(c, .2, .3, .35, .32)}" stroke="#0e0a08" stroke-width=".5"/><ellipse cx="${f(-s * .15)}" cy="${f(-s * .14)}" rx="${f(s * .16)}" ry="${f(s * .08)}" fill="#fff" opacity=".75" transform="rotate(-25)"/></g>`;
}
// 大豆（淡い黄色の粒）
function xkrSoybean(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .42)}" fill="${p.rg('#e8cf8a', .25, .25, .35, .32)}" stroke="#b49650" stroke-width=".5"/><path d="M${f(-s * .1)},${f(-s * .3)} L${f(-s * .1)},${f(s * .3)}" stroke="#c8ac62" stroke-width=".6"/></g>`;
}
// 갈비（骨つき牛カルビの煮込み: 濃い照りの肉と骨）
function xkrGalbi(p, x, y, s, r = 0, { c = '#6a3016', seed = 1, bone = true, glossy = true } = {}){
    const R = rng(p.id + 'glb' + seed + x + y);
    const k = s / 30;
    const pts = [[-14, -9], [-5, -11], [6, -10.5], [14, -8], [15, 2], [13, 10], [2, 11.5], [-9, 11], [-15, 8], [-15.5, -1]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]);
    return `<g ${T(x, y, r, k)}>${bone ? `<g ${p.sh(.5)}><path d="M-15,-10 Q0,-15 15,-10 L16,-5 Q0,-9 -16,-5Z" fill="${p.g('#f0e4c8', .25, .25)}" stroke="#a88a58" stroke-width=".7"/><ellipse cx="15.5" cy="-7.5" rx="2.2" ry="3" fill="#c8a070" stroke="#8a6a3a" stroke-width=".5"/><ellipse cx="15.5" cy="-7.5" rx="1" ry="1.4" fill="#8a4a2a"/></g>` : ''}
        <g ${p.sh(.8)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .28, .32)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        <path d="M-9,2 Q-2,-1 8,3 M-7,6 Q0,4 6,7" stroke="${dk(c, .45)}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M-10,-2 Q-3,-4 4,-2" stroke="#e8c09a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/>
        ${glossy ? `<path d="M-8,-6 Q-2,-9 5,-7.4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/><circle cx="7" cy="1" r="1.1" fill="#fff" opacity=".6"/>` : ''}</g>`;
}
// 대추（干しなつめ: しわのある赤茶の粒）
function xkrJujube(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .38)}" fill="${p.rg('#a8321e', .25, .35, .35, .32)}" stroke="#5e160c" stroke-width=".5"/></g>
        <path d="M${f(-s * .3)},${f(-s * .06)} q${f(s * .15)},${f(-s * .12)} ${f(s * .3)},0 t${f(s * .26)},${f(s * .02)} M${f(-s * .22)},${f(s * .14)} q${f(s * .2)},${f(-s * .08)} ${f(s * .42)},0" stroke="#6e1a0e" stroke-width=".6" fill="none" opacity=".8"/>
        <ellipse cx="${f(-s * .16)}" cy="${f(-s * .16)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".55"/></g>`;
}
// 잣（松の実）
function xkrPineNuts(p, x, y, rx, ry, n, { seed = 1 } = {}){
    const R = rng(p.id + 'pine' + seed + x);
    return Array.from({ length: n }, () => { const a = R() * 6.28, d = Math.sqrt(R()), cx = x + Math.cos(a) * d * rx, cy = y + Math.sin(a) * d * ry; return `<path ${T(cx, cy, R() * 360)} d="M-2.2,0 Q-1.6,-1.6 0,-1.5 Q2,-1.2 2.4,0 Q2,1.2 0,1.5 Q-1.6,1.6 -2.2,0Z" fill="#f4e6c0" stroke="#c4a870" stroke-width=".4"/>`; }).join('');
}
// 지단（黄色と白の錦糸卵の細切り）
function xkrJidan(p, x, y, s, { n = 10, seed = 1, sy = 1, white = true } = {}){
    const R = rng(p.id + 'jd' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += xkrStick(p, x + Math.cos(a) * d, y + Math.sin(a) * d * sy, 14 + R() * 6, 2.6, R() * 180, white && i % 3 === 2 ? '#fbf8ee' : '#f6cf48', { gloss: .4 }); }
    return out;
}
// 깻잎（えごまの葉: ギザギザの縁、濃い緑）
function xkrPerilla(p, x, y, s, r = 0){
    const k = s / 24;
    const pts = [];
    for (let i = 0; i < 24; i++){ const a = i / 24 * 6.283, rr = (i % 2 ? 10.4 : 11.6) * (1 - .25 * Math.abs(Math.sin(a))); pts.push([Math.cos(a) * rr * 1.12, Math.sin(a) * rr * .86]); }
    return `<g ${T(x, y, r, k)}><path d="${smooth(pts, true, .4)}" fill="${p.g('#3f7a2e', .25, .3)}" stroke="#284f1c" stroke-width=".6"/>
        <path d="M-12,0 L12,0 M-5,0 L-8,-5 M-5,0 L-8,5 M1,0 L-2,-6 M1,0 L-2,6 M6,0 L4,-5 M6,0 L4,5" stroke="#7fae5a" stroke-width=".8" fill="none" opacity=".9"/></g>`;
}
// 갈치（太刀魚の筒切り: 銀色の皮、背びれの細い黄の線）
function xkrHairtail(p, x, y, w, h, r = 0, { sauce = null, seed = 1 } = {}){
    const R = rng(p.id + 'galchi' + seed + x);
    const pts = [[-w / 2, -h * .42], [-w * .1, -h / 2], [w * .3, -h * .48], [w / 2, -h * .36], [w / 2 + 1, h * .3], [w * .2, h / 2], [-w * .2, h * .48], [-w / 2 - 1, h * .36]].map(([a, b]) => [a + (R() - .5) * 1.6, b + (R() - .5) * 1.4]);
    const body = smooth(pts, true, .5);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${body}" fill="${p.g('#c6cad2', .5, .4)}" stroke="#6d7078" stroke-width=".7"/></g>
        <path d="M${f(-w / 2 + 2)},${f(-h * .1)} Q0,${f(-h * .2)} ${f(w / 2 - 2)},${f(-h * .08)}" stroke="#f2f4f8" stroke-width="${f(h * .16)}" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M${f(-w / 2 + 1)},${f(-h * .4)} Q0,${f(-h * .52)} ${f(w / 2 - 1)},${f(-h * .34)}" stroke="#d8c48a" stroke-width="1.4" fill="none" opacity=".8"/>
                ${sauce ? `<path d="${body}" fill="${sauce}" opacity=".3"/><path d="M${f(-w * .4)},${f(h * .28)} Q0,${f(h * .4)} ${f(w * .42)},${f(h * .22)}" stroke="${sauce}" stroke-width="${f(h * .22)}" fill="none" stroke-linecap="round" opacity=".55"/>` : ''}
        <path d="M${f(-w / 2 + 3)},${f(h * .02)} L${f(w / 2 - 3)},${f(h * .04)}" stroke="#7a7880" stroke-width=".7" stroke-dasharray="2 1.6" opacity=".6"/>
        <path d="M${f(-w * .35)},${f(-h * .26)} Q0,${f(-h * .4)} ${f(w * .3)},${f(-h * .26)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// 조기（一尾の黄色いぐち、こんがり）
function xkrCroaker(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'jogi' + seed + x);
    const h = L * .26;
    const body = xkrSmooth([[-L * .5, 0], [-L * .42, -h * .42], [-L * .2, -h * .52], [L * .1, -h * .48], [L * .3, -h * .3], [L * .38, -h * .1], [L * .38, h * .1], [L * .3, h * .3], [L * .1, h * .48], [-L * .2, h * .52], [-L * .42, h * .42]]);
    const cid = p.uid();
    let ch = '';
    for (let i = 0; i < 10; i++) ch += `<ellipse cx="${f(-L * .35 + R() * L * .65)}" cy="${f(-h * .35 + R() * h * .5)}" rx="${f(2 + R() * 5)}" ry="${f(1.2 + R() * 2.4)}" fill="#7a3e12" opacity="${f(.2 + R() * .35)}"/>`;
    let sc = '';
    for (let i = 0; i < 9; i++){ const sx = -L * .26 + i * L * .065; sc += `M${f(sx)},${f(-h * .4)} q3,${f(h * .2)} 0,${f(h * .4)}`; }
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs>
        <path d="M${f(L * .36)},0 L${f(L * .52)},${f(-h * .42)} Q${f(L * .47)},0 ${f(L * .52)},${f(h * .42)}Z" fill="${p.g('#c8902e', .3, .35)}" stroke="#7a4e14" stroke-width=".7"/>
        <path d="M${f(L * .38)},0 L${f(L * .5)},${f(-h * .28)} M${f(L * .38)},0 L${f(L * .5)},${f(h * .28)}" stroke="#7a4e14" stroke-width=".7" opacity=".6"/>
        <path d="M${f(-L * .1)},${f(-h * .48)} Q${f(L * .05)},${f(-h * .8)} ${f(L * .25)},${f(-h * .36)}Z" fill="#b88a3a" stroke="#7a4e14" stroke-width=".6"/>
        <path d="${body}" fill="${p.g('#e8b450', .35, .35)}" stroke="#8a5a1a" stroke-width=".9"/>
        <g clip-path="url(#${cid})"><path d="M${f(-L * .5)},${f(h * .1)} Q0,${f(h * .2)} ${f(L * .4)},${f(h * .06)} L${f(L * .4)},${f(h)} L${f(-L * .5)},${f(h)}Z" fill="#f6d67a" opacity=".55"/>
            <path d="${sc}" stroke="#a8701e" stroke-width=".8" fill="none" opacity=".5"/>${ch}</g>
        <path d="M${f(-L * .3)},${f(-h * .5)} Q${f(-L * .28)},0 ${f(-L * .3)},${f(h * .5)}" stroke="#8a5a1a" stroke-width="1" fill="none" opacity=".7"/>
        <circle cx="${f(-L * .4)}" cy="${f(-h * .12)}" r="${f(h * .13)}" fill="#f4efe2" stroke="#4a3a2a" stroke-width=".6"/><circle cx="${f(-L * .4)}" cy="${f(-h * .12)}" r="${f(h * .06)}" fill="#222"/>
        <path d="M${f(-L * .24)},${f(-h * .34)} Q0,${f(-h * .48)} ${f(L * .22)},${f(-h * .26)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 삼겹살（厚切り豚ばらを焼いた細長い一切れ: 脂と赤身の縞、焼き色）
function xkrBellyStrip(p, x, y, L, w, r = 0, { seed = 1, cooked = .7 } = {}){
    const R = rng(p.id + 'bst' + seed + x + y);
    const cid = p.uid();
    const body = smooth([[-L / 2, -w / 2], [0, -w / 2 - .8], [L / 2, -w / 2], [L / 2 + 1, 0], [L / 2, w / 2], [0, w / 2 + .8], [-L / 2, w / 2], [-L / 2 - 1, 0]].map(([a, b]) => [a + (R() - .5) * 1.6, b + (R() - .5) * 1.2]), true, .4);
    const meat = mix('#d9a090', '#a4522a', cooked), fat = mix('#f8f0e4', '#f4dcae', cooked);
    let ch = '';
    for (let i = 0; i < Math.round(L / 14); i++) ch += `<ellipse cx="${f((R() - .5) * L * .9)}" cy="${f((R() - .5) * w * .7)}" rx="${f(3 + R() * 5)}" ry="${f(1.6 + R() * 2)}" fill="#7a3e12" opacity="${f(.2 + R() * .25)}"/>`;
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(.8)}><path d="${body}" fill="${fat}" stroke="${dk(meat, .35)}" stroke-width=".7"/></g>
        <g clip-path="url(#${cid})"><rect x="${-L}" y="${f(-w * .32)}" width="${2 * L}" height="${f(w * .26)}" fill="${p.g(meat, .2, .25)}"/><rect x="${-L}" y="${f(w * .12)}" width="${2 * L}" height="${f(w * .3)}" fill="${p.g(meat, .2, .25)}"/>${ch}
        <rect x="${-L}" y="${f(-w / 2)}" width="${2 * L}" height="${w}" fill="#d08a3a" opacity="${f(cooked * .1)}"/></g>
        <path d="M${f(-L * .4)},${f(-w * .36)} L${f(L * .36)},${f(-w * .36)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".75"/></g>`;
}
// 수육の一切れ（ゆで豚の厚切り: 皮、脂、赤身の層を上から少し斜めに）
function xkrSuyukSlice(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'suy' + seed + x);
    const cid = p.uid();
    const body = smooth([[-L / 2, -w / 2], [L / 2, -w / 2 - .5], [L / 2 + .5, w / 2], [-L / 2, w / 2 + .5]].map(([a, b]) => [a + (R() - .5) * 1.4, b + (R() - .5) * 1.4]), true, .25);
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(.7)}><path d="${body}" fill="#b89482" stroke="#7a5a4a" stroke-width=".6"/></g>
        <g clip-path="url(#${cid})"><rect x="${-L}" y="${f(-w / 2)}" width="${2 * L}" height="${f(w * .14)}" fill="#c08a5a"/><rect x="${-L}" y="${f(-w * .36)}" width="${2 * L}" height="${f(w * .26)}" fill="#f6efe6"/>
        <rect x="${-L}" y="${f(-w * .1)}" width="${2 * L}" height="${f(w * .24)}" fill="${p.g('#bf998a', .2, .2)}"/><rect x="${-L}" y="${f(w * .14)}" width="${2 * L}" height="${f(w * .1)}" fill="#efe2d6"/>
        <path d="M${-L},${f(w * .02)} q${f(L / 2)},-1.5 ${L},0 t${L},0" stroke="#a07e70" stroke-width=".6" fill="none" opacity=".6"/></g>
        <path d="M${f(-L * .4)},${f(-w * .24)} L${f(L * .38)},${f(-w * .24)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 차돌박이（薄い牛ばら: 淡い肉色に白い脂の網）
function xkrChadol(p, x, y, s, r = 0, { seed = 1, cooked = .6 } = {}){
    const R = rng(p.id + 'chd' + seed + x + y);
    const k = s / 30;
    const c = mix('#d48a7a', '#a8704e', cooked);
    let mb = '';
    for (let i = 0; i < 4; i++) mb += `M${f1(-12 + R() * 6)},${f1(-6 + i * 4 + R() * 2)} q${f1(4 + R() * 4)},${f1((R() - .5) * 4)} ${f1(10 + R() * 8)},${f1((R() - .5) * 3)}`;
    return `<g ${T(x, y, r, k)}><path d="${xkrSmooth(ring(14, 11, .3, R, 1.1, .62))}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="${mb}" stroke="#f4e4d4" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M-8,-4 q3,5 0,10 M4,-6 q-3,6 1,11" stroke="${dk(c, .3)}" stroke-width="1" fill="none" opacity=".5"/>
        <path d="M-9,-5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 부추（にら: 細長い平たい緑の葉）
function xkrChives(p, x, y, s, { n = 10, seed = 1, sy = 1, L = 30, c = '#3f8a2a' } = {}){
    return xkrJulienne(p, x, y, s, { n, seed, c, w: 2, L, sy, gloss: .35 });
}
// 전の円盤（卵衣の焼き色ムラ）
function xkrJeonDisc(p, x, y, s, { c = '#f2c24a', seed = 1, edge = '#c88a2a', brown = .5 } = {}){
    const R = rng(p.id + 'jeon' + seed + x + y);
    const pts = ring(s / 2, 12, .1, R);
    let sp = '';
    for (let i = 0; i < 5; i++) sp += `<path ${T((R() - .5) * s * .6, (R() - .5) * s * .6)} d="${smooth(ring(s * (.06 + R() * .06), 6, .5, R))}" fill="#c8862a" opacity="${f(brown * (.3 + R() * .4))}"/>`;
    return `<g ${T(x, y)}><g ${p.sh(.8)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .25)}" stroke="${edge}" stroke-width="1"/></g>${sp}</g>`;
}
// 땅콩 부순 것（砕いたピーナッツ）
function xkrPeanutBits(p, x, y, rx, ry, n, { seed = 1 } = {}){
    const R = rng(p.id + 'pnt' + seed + x);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()), cx = x + Math.cos(a) * d * rx, cy = y + Math.sin(a) * d * ry, s = 1.4 + R() * 1.4; const q = `M${f1(cx - s)},${f1(cy)}l${f1(s * .8)},${f1(-s)}l${f1(s * 1.2)},${f1(s * .5)}l${f1(-s * .4)},${f1(s * 1.1)}Z`; if (R() < .5) a1 += q; else a2 += q; }
    return `<path d="${a1}" fill="#ecd09a" stroke="#a8803e" stroke-width=".35"/><path d="${a2}" fill="#d8b070" stroke="#a8803e" stroke-width=".35"/>`;
}
// 닭강정の一切れ（揚げ衣に、つやのある赤茶の甘辛だれ）
function xkrGangjeong(p, x, y, s, r = 0, { seed = 1, c = '#a8401a' } = {}){
    const R = rng(p.id + 'gj' + seed + x + y);
    const k = s / 30;
    const pts = ring(13, 9, .3, R, 1.12, .9);
    let lumps = '';
    for (let i = 0; i < 2; i++) lumps += `<path ${T((R() - .5) * 12, (R() - .5) * 10)} d="${smooth(ring(4 + R() * 2, 6, .4, R))}" fill="${lt(c, .14)}" opacity=".7"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}><g ${p.rough(2.4, .2)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .4)}" stroke="${dk(c, .5)}" stroke-width=".8"/></g></g>${lumps}
        <path d="M-6,4 q4,3 9,1" stroke="${dk(c, .45)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-9,-4 Q-4,-9 3,-8.4" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="6" cy="-4" r="1.3" fill="#fff" opacity=".75"/><circle cx="-3" cy="3" r=".9" fill="#fff" opacity=".6"/></g>`;
}
// 마른 고추（干した赤唐辛子）
function xkrDriedChili(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-L / 2)},0 Q${f(-L * .1)},${f(-L * .2)} ${f(L * .42)},${f(-L * .06)} Q${f(L * .5)},0 ${f(L * .42)},${f(L * .06)} Q${f(-L * .1)},${f(L * .2)} ${f(-L / 2)},0Z" fill="${p.g('#b0200e', .25, .35)}" stroke="#5e0c04" stroke-width=".5"/></g>
        <path d="M${f(L * .42)},0 l${f(L * .14)},${f(-L * .04)}" stroke="#5a6a2a" stroke-width="2" stroke-linecap="round"/>
        <path d="M${f(-L * .3)},${f(-L * .05)} Q0,${f(-L * .12)} ${f(L * .3)},${f(-L * .05)}" stroke="#ff9a7a" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 떡갈비のパティ（角の丸い平たい形、焼き網の跡、照り）
function xkrTgPatty(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'tgp' + seed + x);
    const pts = ring(w / 2, 12, .08, R, 1, h / w);
    const body = smooth(pts, true, .9);
    let gm = '';
    for (let i = -1; i <= 1; i++) gm += `M${f(i * w * .28 - h * .25)},${f(-h * .36)} l${f(h * .5)},${f(h * .72)}`;
    const cid = p.uid();
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(1.1)}><g ${p.rough(2, .14)}><path d="${body}" fill="${p.g('#82361a', .28, .35)}" stroke="#3e1a08" stroke-width=".8"/></g></g>
        <g clip-path="url(#${cid})"><g ${p.crumb(.8)}><path d="${body}" fill="#8a4620" opacity=".5"/></g><path d="${gm}" stroke="#2a1006" stroke-width="3" opacity=".4" stroke-linecap="round"/></g>
        <path d="M${f(-w * .32)},${f(-h * .26)} Q${f(-w * .05)},${f(-h * .42)} ${f(w * .26)},${f(-h * .3)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".65"/>
        <path d="M${f(-w * .1)},${f(h * .1)} q${f(w * .1)},${f(-h * .06)} ${f(w * .2)},0" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}

// 주꾸미（小さなたこ: 丸い頭と巻いた足、赤いたれ）
function xkrJukkumi(p, x, y, s, r = 0, { c = '#c0402a', seed = 1 } = {}){
    const R = rng(p.id + 'jkm' + seed + x + y);
    const k = s / 40;
    let legs = '';
    for (let i = 0; i < 5; i++){
        const a = 20 + i * 36 + (R() - .5) * 12, rad = a * Math.PI / 180, L = 17 + R() * 6, cu = (R() < .5 ? 1 : -1) * (5 + R() * 4);
        const ex = Math.cos(rad) * L, ey = 2 + Math.sin(rad) * L;
        legs += `M${f1(Math.cos(rad) * 3)},${f1(Math.sin(rad) * 3)} Q${f1(ex * .5 + cu)},${f1(ey * .5)} ${f1(ex)},${f1(ey)} q${f1(cu * .6)},${f1(-2)} ${f1(cu * .3)},${f1(-4)}`;
    }
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${legs}" stroke="${dk(c, .4)}" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="${legs}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <ellipse cx="-2" cy="-8" rx="8" ry="9.5" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/><circle cx="1" cy="-1" r="1.3" fill="#2a1a10"/><circle cx="-5" cy="-1" r="1.3" fill="#2a1a10"/></g>
        <path d="${legs}" stroke="#f6c8b0" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-dasharray=".3 3" opacity=".5"/>
        <path d="M-7,-13 Q-4,-17 1,-16" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 김밥の一切れ（のりの輪、白いご飯、真ん中に色とりどりの具）
function xkrKimbapSlice(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'kb' + seed + x + y);
    const k = s / 40;
    let gr = '';
    for (let i = 0; i < 26; i++){ const a = R() * 6.28, d = 9 + R() * 8, gx = Math.cos(a) * d, gy = Math.sin(a) * d, b = R() * 3.14; gr += `M${f1(gx - Math.cos(b) * 1.4)},${f1(gy - Math.sin(b) * 1.4)}l${f1(Math.cos(b) * 2.8)},${f1(Math.sin(b) * 2.8)}`; }
    const fill = [['#f4d23a', -4, -4, 5, 4], ['#f2a6a0', 3, -4, 5, 4], ['#ec7a2a', -4, 2, 3, 3], ['#3e8a2c', 1, 2, 4, 3], ['#f8e070', 5.5, 1.5, 3.6, 5], ['#c8904a', -1, -1, 3, 2.6]];
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><circle r="19.5" fill="#1d2418" stroke="#0e130c" stroke-width=".8"/></g>
        <circle r="17.6" fill="${p.rg('#f6f2e8', .2, .12)}"/>
        <path d="${gr}" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/><path d="${gr}" transform="translate(.5 .6)" stroke="#d8d0bc" stroke-width="1" stroke-linecap="round" opacity=".6"/>
        <circle r="9" fill="#efe8d8"/>
        ${fill.map(([c, a, b, w, h]) => `<rect x="${f1(a - w / 2)}" y="${f1(b - h / 2)}" width="${w}" height="${h}" rx="1" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".4"/>`).join('')}
        <path d="M-13,-9 A15,15 0 0 1 -4,-15" stroke="#5a6a4a" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 오므라이스の卵（両端の細いラグビーボール形）
function xkrOmelette(p, x, y, w, h, r = 0){
    const body = `M${-w / 2},0 C${f(-w * .42)},${f(-h * .62)} ${f(w * .42)},${f(-h * .62)} ${w / 2},0 C${f(w * .42)},${f(h * .62)} ${f(-w * .42)},${f(h * .62)} ${-w / 2},0Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.3)}><path d="${body}" fill="${p.rg('#fbd85a', .35, .2, .4, .36)}" stroke="#d8a02a" stroke-width="1"/></g>
        <path d="M${f(-w * .3)},${f(h * .26)} Q0,${f(h * .36)} ${f(w * .32)},${f(h * .24)} M${f(-w * .2)},${f(-h * .3)} Q${f(w * .05)},${f(-h * .36)} ${f(w * .25)},${f(-h * .28)}" stroke="#e8b43a" stroke-width="1.2" fill="none" opacity=".6"/>
        <path d="M${f(-w * .34)},${f(-h * .16)} Q${f(-w * .1)},${f(-h * .4)} ${f(w * .2)},${f(-h * .36)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 통김치（一株を縦に切った長いキムチ: 白い芯と赤い葉）
function xkrKimchiLong(p, x, y, L, w, r = 0, { seed = 1, cooked = .5 } = {}){
    const R = rng(p.id + 'kml' + seed + x + y);
    const stem = mix('#f0b088', '#d8643a', cooked), leaf = mix('#c8301a', '#9e2412', cooked);
    const body = smooth([[-L / 2, -w * .3], [-L * .2, -w * .45], [L * .2, -w * .55], [L / 2, -w * .4], [L / 2 + 2, 0], [L / 2, w * .45], [L * .2, w * .55], [-L * .2, w * .42], [-L / 2, w * .3], [-L / 2 - 1, 0]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 3]), true, .8);
    const cid = p.uid();
    let vein = '';
    for (let i = 0; i < 3; i++) vein += `M${f(-L / 2 + 3)},${f(-w * .24 + i * w * .24)} Q${f(-L * .3)},${f(-w * .26 + i * w * .24 + (R() - .5) * 3)} ${f(-L * .18)},${f(-w * .22 + i * w * .24)}`;
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(1)}><path d="${body}" fill="${p.g(leaf, .25, .25)}" stroke="${dk(leaf, .35)}" stroke-width=".7"/></g>
        <g clip-path="url(#${cid})"><path d="M${-L},${-w} L${f(-L * .18)},${-w} Q${f(L * .02)},0 ${f(-L * .15)},${w} L${-L},${w}Z" fill="${p.g(stem, .3, .2)}"/><path d="${vein}" stroke="${lt(stem, .2)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${f(-L * .1)},${f(-w * .25)} q${f(L * .1)},${f(w * .15)} ${f(L * .2)},0 t${f(L * .2)},0 t${f(L * .15)},0 M${f(-L * .1)},${f(w * .2)} q${f(L * .1)},${f(-w * .15)} ${f(L * .2)},0 t${f(L * .2)},0 t${f(L * .15)},0" stroke="${dk(leaf, .35)}" stroke-width="1.3" fill="none" opacity=".55"/><path d="M${f(-L * .1)},0 L${f(L * .45)},0" stroke="${lt(leaf, .3)}" stroke-width="2.4" opacity=".5"/></g>
        <path d="M${f(-L * .4)},${f(-w * .3)} Q0,${f(-w * .5)} ${f(L * .35)},${f(-w * .36)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}

// 麺（K.noodles と同じ描き方を、1本の path と <use> で軽く）
function xkrNoodles(p, x, y, s, { c = '#f2d48a', w = 2.4, n = 26, seed = 1, sy = .9, outline = null, hi = .5 } = {}){
    const R = rng(p.id + 'xnd' + seed);
    let d = '', h = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.25 + R() * .72), a0 = R() * 6.28, sweep = 1.2 + R() * 2.2;
        const cx = x + (R() - .5) * s * .12, cy = y + (R() - .5) * s * .12;
        const pts = Array.from({ length: 6 }, (_, j) => { const a = a0 + j / 5 * sweep, rj = rr * (1 + (R() - .5) * .25); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = xkrSm(pts);
        d += one; if (R() < .35) h += one;
    }
    const id = p.uid(), ih = p.uid();
    return `<defs><path id="${id}" d="${d}"/><path id="${ih}" d="${h}"/></defs><g ${p.sh(.8)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="${outline || dk(c, .25)}" stroke-width="${f(w + 1)}"/><use href="#${id}" stroke="${c}" stroke-width="${w}"/><use href="#${ih}" stroke="${lt(c, .25)}" stroke-width="${w}"/><use href="#${ih}" stroke="#fff" stroke-width="${f(w * .3)}" opacity="${hi}" transform="translate(-.4 -.5)"/></g>`;
}

// 가지나물（蒸して手で裂いたなす: 紫の皮の縁と、しんなりした果肉）
function xkrEggplantStrip(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'gaj' + seed + x + y);
    const top = Array.from({ length: 6 }, (_, i) => [-L / 2 + i * L / 5, -w / 2 + (R() - .5) * 2]);
    const bot = Array.from({ length: 6 }, (_, i) => [L / 2 - i * L / 5, w / 2 + (R() - .5) * 2.4]);
    const body = smooth([...top, ...bot], true, .8);
    return `<g ${T(x, y, r)}><path d="${body}" fill="${p.g('#9a7a5a', .3, .3)}" stroke="#4a3040" stroke-width=".6"/>
        <path d="${smooth(top.map(([a, b]) => [a, b + 1.2]), false)}" stroke="#4d2a5c" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M${f(-L * .35)},${f(w * .1)} L${f(L * .35)},${f(w * .15)}" stroke="#c8b08a" stroke-width="1" opacity=".6"/>
        <path d="M${f(-L * .3)},${f(-w * .05)} L${f(L * .2)},${f(-w * .05)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".5"/></g>`;
}
// 느타리（ひらたけを裂いたもの: 扇形、ひだの線）
function xkrOyster(p, x, y, s, r = 0, { c = '#cdbca0', seed = 1 } = {}){
    const R = rng(p.id + 'oys' + seed + x + y);
    const k = s / 30;
    const w1 = 10 + R() * 3;
    return `<g ${T(x, y, r, k)}><path d="M-2,14 Q-${f(w1)},4 -${f(w1)},-6 Q0,-14 ${f(w1)},-6 Q${f(w1)},4 2,14Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M0,13 L0,-10 M0,13 L-6,-8 M0,13 L6,-8 M0,13 L-9,-3 M0,13 L9,-3" stroke="${dk(c, .2)}" stroke-width=".6" fill="none" opacity=".7"/>
        <path d="M-7,-7 Q0,-12 6,-8" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 꽈리고추（しわのある小さな青唐辛子）
function xkrKkwari(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-L / 2)},0 Q${f(-L * .2)},${f(-L * .2)} ${f(L * .4)},${f(-L * .08)} Q${f(L / 2)},0 ${f(L * .4)},${f(L * .08)} Q${f(-L * .2)},${f(L * .22)} ${f(-L / 2)},0Z" fill="${p.g('#5a8a2a', .3, .3)}" stroke="#2e4a14" stroke-width=".5"/></g>
        <path d="M${f(-L * .2)},${f(-L * .08)} q${f(L * .1)},${f(L * .1)} 0,${f(L * .18)} M${f(L * .1)},${f(-L * .08)} q${f(L * .08)},${f(L * .08)} 0,${f(L * .14)}" stroke="#2e4a14" stroke-width=".6" fill="none" opacity=".6"/>
        <path d="M${f(-L / 2)},0 l${f(-L * .14)},${f(-L * .06)}" stroke="#6a7a3a" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M${f(-L * .3)},${f(-L * .06)} Q0,${f(-L * .14)} ${f(L * .3)},${f(-L * .05)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 小鉢の中の盛り土台（具の下の影と色）
const xkrMound = (p, R, c, seed = 1, cx = 100, cy = 100) => `<g ${p.sh(1)}><path ${T(cx, cy)} d="${smooth(ring(R, 12, .12, rng(p.id + 'mound' + seed), 1, .95))}" fill="${p.rg(c, .25, .3)}"/></g>`;

// 두부부침（こんがり焼いた豆腐の厚切り）
function xkrTofuFried(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'tff' + seed + x);
    let sp = '';
    for (let i = 0; i < 4; i++) sp += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f((R() - .5) * h * .6)}" rx="${f(3 + R() * 5)}" ry="${f(2 + R() * 3)}" fill="#c07a2a" opacity="${f(.2 + R() * .25)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(h * .14)}" fill="${p.g('#e2b462', .3, .3)}" stroke="#a87024" stroke-width=".8"/></g>
        <rect x="${f(-w / 2 + 2.5)}" y="${f(-h / 2 + 2.5)}" width="${w - 5}" height="${h - 5}" rx="${f(h * .1)}" fill="${p.rg('#f0c878', .25, .15)}"/>${sp}
        <path d="M${f(-w / 2 + 4)},${f(-h / 2 + 4)} L${f(w / 2 - 6)},${f(-h / 2 + 4)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>`;
}
// 애호박전（卵衣をつけて焼いたズッキーニの輪切り）
function xkrHobakJeon(p, x, y, s, { seed = 1, chili = null } = {}){
    const R = rng(p.id + 'hbj' + seed + x + y);
    const pts = ring(s / 2, 11, .12, R);
    let sp = '';
    for (let i = 0; i < 3; i++) sp += `<path ${T((R() - .5) * s * .5, (R() - .5) * s * .5)} d="${smooth(ring(s * (.07 + R() * .06), 6, .5, R))}" fill="#d8962e" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.g('#f4c84a', .3, .25)}" stroke="#c88a2a" stroke-width="1"/></g>
        <circle r="${f(s * .32)}" fill="${p.rg('#e2e6a4', .25, .15)}" opacity=".8"/><circle r="${f(s * .32)}" fill="none" stroke="#8ab04a" stroke-width="1.2" opacity=".6"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${f(Math.cos(i * 1.047) * s * .14)}" cy="${f(Math.sin(i * 1.047) * s * .14)}" rx="1.4" ry=".9" transform="rotate(${i * 60} ${f(Math.cos(i * 1.047) * s * .14)} ${f(Math.sin(i * 1.047) * s * .14)})" fill="#f2f0c4"/>`).join('')}
        <path d="${smooth(pts.map(([a, b]) => [a * .82, b * .82]))}" fill="#f8d660" opacity=".35"/>${sp}
        ${chili ? `<g ${T(s * .05, -s * .05)}><ellipse rx="3.4" ry="2.2" fill="${chili}" stroke="${dk(chili, .3)}" stroke-width=".4"/></g>` : ''}
        <path d="M${f(-s * .3)},${f(-s * .26)} Q${f(-s * .1)},${f(-s * .4)} ${f(s * .15)},${f(-s * .36)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 동그랑땡（卵衣の小さな丸いひき肉焼き、にんじんとねぎの粒）
function xkrDongeurang(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'dgt' + seed + x + y);
    const pts = ring(s / 2, 10, .12, R);
    let fl = '';
    for (let i = 0; i < 7; i++) fl += `<rect ${T((R() - .5) * s * .6, (R() - .5) * s * .6, R() * 180)} x="-1.1" y="-.8" width="2.2" height="1.6" rx=".4" fill="${i % 2 ? '#e8702a' : '#4f9a34'}"/>`;
    let sp = '';
    for (let i = 0; i < 3; i++) sp += `<ellipse cx="${f((R() - .5) * s * .5)}" cy="${f((R() - .5) * s * .5)}" rx="${f(s * (.08 + R() * .08))}" ry="${f(s * (.05 + R() * .05))}" fill="#c8862a" opacity="${f(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.g('#f2c650', .3, .3)}" stroke="#c08428" stroke-width=".9"/></g>${sp}${fl}
        <path d="M${f(-s * .28)},${f(-s * .22)} Q${f(-s * .05)},${f(-s * .38)} ${f(s * .18)},${f(-s * .3)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 배추겉절이（生の白菜: 白い芯と黄緑の葉に、赤い薬味）
function xkrGeotjeori(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'gtj' + seed + x + y);
    const k = s / 30;
    const pts = ring(14, 10, .4, R, 1.2, .8);
    let fl = '';
    for (let i = 0; i < 6; i++){ const cx = (R() - .5) * 24, cy = (R() - .5) * 14; fl += `M${f1(cx)},${f1(cy)}l.9,-.7l.9,1.1Z`; }
    return `<g ${T(x, y, r, k)}><path d="${smooth(pts, true, .9)}" fill="${p.g('#d6e08a', .35, .25)}" stroke="#9aa848" stroke-width=".6"/>
        <path d="M-15,3 Q0,1 15,-2" stroke="#fbf8ea" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M-4,1.6 L-8,-7 M4,.6 L1,-8 M-2,2 L-5,9 M6,0 L8,8" stroke="#f2f4d8" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="${smooth(pts.map(([a, b]) => [a * (.85 + R() * .2), b * (.75 + R() * .25)]), true, .9)}" fill="#d4401e" opacity=".55"/>
        <path d="M-12,-4 Q-6,-8 0,-5 M3,4 Q8,7 12,3" stroke="#b8300e" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="${fl}" fill="#a81c0a"/></g>`;
}
// 양파장아찌（醤油漬けの玉ねぎ: 角切りの層が透ける）
function xkrOnionPickle(p, x, y, s, r = 0, { c = '#c8a060', seed = 1 } = {}){
    const R = rng(p.id + 'opk' + seed + x + y);
    const k = s / 24;
    const pts = [[-11, -9], [10, -10], [11, 9], [-10, 10]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    return `<g ${T(x, y, r, k)}><path d="${smooth(pts, true, .4)}" fill="${p.g(c, .3, .2)}" opacity=".78" stroke="${dk(c, .25)}" stroke-width=".6"/>
        <path d="M-10,-1 Q0,-11 10,-1" stroke="${lt(c, .4)}" stroke-width="2.6" fill="none" opacity=".7"/><path d="M-10,5 Q0,-5 10,5" stroke="${lt(c, .4)}" stroke-width="2.6" fill="none" opacity=".7"/>
        <path d="M-10,2 Q0,-8 10,2 M-10,8 Q0,-2 10,8" stroke="${dk(c, .3)}" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M-8,-7 L6,-8" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`;
}
// 도토리묵（どんぐりのこんにゃく状の角切り: 半透明の茶色、つや）
function xkrMuk(p, x, y, w, h, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="2.4" fill="${p.g('#8a604a', .3, .3)}" stroke="#4a2c1e" stroke-width=".7"/></g>
        <rect x="${f(-w / 2 + 2)}" y="${f(-h / 2 + 2)}" width="${w - 6}" height="${h - 6}" rx="1.6" fill="#9a7058" opacity=".45"/>
        <path d="M${f(-w / 2 + 3)},${f(-h / 2 + 3)} L${f(w / 2 - 5)},${f(-h / 2 + 3)}" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".7"/></g>`;
}

// ソーセージの斜め切り（皮の赤茶と淡いピンクの断面）
function xkrFrank(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f(s / 2)}" ry="${f(s * .32)}" fill="#b8502e" stroke="#7a2e14" stroke-width=".6"/></g>
        <ellipse rx="${f(s / 2 - 1.6)}" ry="${f(s * .32 - 1.6)}" fill="${p.rg('#f2b49a', .25, .15)}"/>
        <path d="M${f(-s * .3)},${f(-s * .1)} Q0,${f(-s * .2)} ${f(s * .26)},${f(-s * .1)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 인스턴트 라면（縮れた黄色い麺のかたまり）
function xkrRamen(p, x, y, w, h, { seed = 1, c = '#f2d27a' } = {}){
    const R = rng(p.id + 'rmn' + seed + x);
    let d = '';
    for (let i = 0; i < Math.round(h / 3.2); i++){ const yy = -h / 2 + i * 3.2 + 1.5; let seg = `M${f1(-w / 2 + (R() - .5) * 4)},${f1(yy)}`; for (let j = 0; j < Math.round(w / 6); j++) seg += `q1.5,${R() < .5 ? -3 : 3} 3,0t3,0`; d += seg; }
    const cid = p.uid();
    return `<g ${T(x, y)}><defs><clipPath id="${cid}"><ellipse rx="${f(w / 2)}" ry="${f(h / 2)}"/></clipPath></defs><g ${p.sh(.8)}><ellipse rx="${f(w / 2)}" ry="${f(h / 2)}" fill="${dk(c, .1)}"/></g>
        <g clip-path="url(#${cid})"><path d="${d}" stroke="${dk(c, .3)}" stroke-width="2.6" fill="none"/><path d="${d}" stroke="${c}" stroke-width="1.7" fill="none"/></g>
        <path d="M${f(-w * .3)},${f(-h * .3)} Q0,${f(-h * .45)} ${f(w * .25)},${f(-h * .32)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// スライスチーズ（四角が溶けて角が垂れたもの）
function xkrCheeseSlice(p, x, y, s, r = 0){
    const h = s / 2;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${-h},${-h + 3} Q${-h},${-h} ${-h + 4},${-h} L${h - 3},${f(-h - 1)} Q${h + 2},${-h} ${h + 1},${-h + 6} L${h + 3},${h - 2} Q${h},${h + 4} ${h - 6},${h + 2} L${-h + 2},${h + 5} Q${-h - 3},${h + 3} ${-h - 1},${h - 4}Z" fill="${p.g('#f8c846', .35, .2)}" stroke="#d89a1a" stroke-width=".8" opacity=".97"/></g>
        <path d="M${-h + 4},${-h + 4} L${h - 6},${-h + 3}" stroke="#fff6c8" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 무の薄い色紙切り（汁で透き通った大根）
function xkrRadishSq(p, x, y, s, r = 0, { c = '#f2ecd8', op = .9 } = {}){
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${f(-s / 2)}" y="${f(-s * .42)}" width="${s}" height="${f(s * .84)}" rx="2" fill="${p.g(c, .35, .15)}" stroke="${dk(c, .18)}" stroke-width=".6"/>
        <path d="M${f(-s * .36)},${f(-s * .28)} L${f(s * .26)},${f(-s * .28)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 대파（太ねぎを長めに切ったもの: 白と緑）
function xkrDaepa(p, x, y, L, r = 0, { green = true } = {}){
    const c = green ? '#6aa83a' : '#eef0d8';
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="-3.4" width="${L}" height="6.8" rx="3.4" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M${f(-L / 2 + 3)},-.6 L${f(L / 2 - 3)},-.6" stroke="${lt(c, .4)}" stroke-width="1" opacity=".8"/><path d="M${f(-L / 2 + 3)},-2 L${f(L / 2 - 6)},-2" stroke="#fff" stroke-width=".8" opacity=".5"/></g>`;
}
// 삼계탕の丸鶏（上から: 胸を上に、脚を交差させる）
function xkrWholeChicken(p, x, y, s, r = 0){
    const k = s / 100;
    const thigh = m => `<path transform="scale(${m} 1)" d="M-40,-4 C-52,8 -50,34 -30,44 C-20,48 -14,42 -16,32 C-20,18 -26,6 -40,-4Z" fill="${p.g('#f0e2c8', .35, .3)}" stroke="#c0a47c" stroke-width=".9"/>`;
    const stick = m => `<g transform="scale(${m} 1)"><path d="M-22,34 L8,58" stroke="#c0a47c" stroke-width="8.4" stroke-linecap="round"/><path d="M-22,34 L8,58" stroke="#f2e6cc" stroke-width="7" stroke-linecap="round"/><circle cx="9" cy="59" r="5" fill="#f6ecd8" stroke="#b89a70" stroke-width=".8"/><path d="M-18,34 L4,52" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1.6)}>${thigh(1)}${thigh(-1)}
        <path d="M0,-52 C30,-52 42,-22 40,6 C38,32 22,46 0,46 C-22,46 -38,32 -40,6 C-42,-22 -30,-52 0,-52Z" fill="${p.rg('#f6ecdc', .4, .28, .42, .3)}" stroke="#c8ae88" stroke-width="1"/>
        ${stick(1)}${stick(-1)}</g>
        <path d="M0,-48 C2,-20 2,10 0,40" stroke="#e2d0b0" stroke-width="1.6" fill="none" opacity=".7"/>
        <path d="M-24,-30 C-14,-42 -4,-44 6,-42" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 인삼（水参: 細い根が分かれた淡い黄土色）
function xkrGinseng(p, x, y, L, r = 0){
    const d = `M${f(-L / 2)},0 Q${f(-L * .2)},-2 ${f(L * .1)},0 Q${f(L * .3)},1 ${f(L / 2)},4 M${f(L * .1)},0 Q${f(L * .25)},-3 ${f(L * .45)},-7 M${f(-L * .1)},1 Q${f(L * .1)},6 ${f(L * .3)},9`;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${d}" stroke="#a88a5a" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#e8d6a8" stroke-width="4" fill="none" stroke-linecap="round"/></g>
        <path d="M${f(-L / 2 + 2)},-1.4 L${f(L * .1)},-1.2" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/><path d="M${f(-L / 2)},0 l-4,-3 m4,3 l-4,2" stroke="#7a9a3a" stroke-width="1.4" stroke-linecap="round"/></g>`;
}
// 汁物の共通: 汁面（にごり・油）
function xkrBroth(p, R, c, { cloud = 0, cloudC = '#ffffff', oilC = null, oilN = 12, seed = 1, edge = .4 } = {}){
    const Rr = rng(p.id + 'broth' + seed);
    let cl = '';
    for (let i = 0; i < Math.round(cloud * 8); i++){ const a = Rr() * 6.28, d = Rr() * R * .6; cl += `<path ${T(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, Rr() * 180)} d="${smooth(ring(R * (.18 + Rr() * .14), 8, .5, Rr, 1.4, .7))}" fill="${cloudC}" opacity="${f(.08 + Rr() * .1)}"/>`; }
    return K.liquid(p, { R, c, op: 1, shine: false }) + cl + `<circle cx="100" cy="100" r="${R}" fill="none" stroke="${dk(c, .3)}" stroke-width="3" opacity="${edge}"/>`
        + (oilC ? xkrOil(p, 100, 100, R * 1.8, { n: oilN, c: oilC, op: .6, rmax: 2.4, seed }) : '');
}

// 동태（すけとうだらの筒切り: 白い身、灰色の皮、真ん中の背骨）
function xkrPollack(p, x, y, s, r = 0, { seed = 1, sauce = null } = {}){
    const R = rng(p.id + 'pol' + seed + x + y);
    const k = s / 34;
    const pts = ring(16, 10, .14, R, 1, .78);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .9)}" fill="#6a6660" stroke="#3e3a36" stroke-width=".8"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .86, b * .82]), true, .9)}" fill="${p.rg('#f8f2e8', .2, .15)}"/>
        <path d="M-12,0 Q0,-2 12,0 M0,-10 L0,10 M-6,-8 Q-3,0 -6,8 M6,-8 Q3,0 6,8" stroke="#e2d6c4" stroke-width="1" fill="none"/>
        <circle r="2.6" fill="#ece0cc" stroke="#b8a888" stroke-width=".6"/>
        ${sauce ? `<path d="${smooth(pts.map(([a, b]) => [a * .86, b * .82]), true, .9)}" fill="${sauce}" opacity=".1"/>` : ''}
        <path d="M-9,-8 Q-2,-11 6,-9" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 쑥갓（春菊: 切れ込みの深い葉）
function xkrSsukgat(p, x, y, L, r = 0){
    const k = L / 40;
    let lv = '';
    for (let i = 0; i < 5; i++){ const xx = -14 + i * 7; lv += `<path ${T(xx, -2, -50 + i * 6)} d="M0,0 Q-3,-5 0,-10 Q3,-5 0,0Z M0,0 Q4,-3 8,-2 Q4,1 0,0Z" fill="#4f8f34"/><path ${T(xx + 2, 2, 130 + i * 6)} d="M0,0 Q-3,-5 0,-9 Q3,-5 0,0Z" fill="#5a9a3a"/>`; }
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-20,0 L20,0" stroke="#7aae4a" stroke-width="2.4" stroke-linecap="round"/>${lv}<path d="M20,0 q4,-6 8,-4 q-2,4 -8,4 q6,2 8,6 q-5,0 -8,-6Z" fill="#4f8f34"/></g></g>`;
}
// 얼음（氷: 透明な角）
function xkrIce(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${s}" rx="${f(s * .18)}" fill="#ffffff" opacity=".35" stroke="#ffffff" stroke-width="1.2"/><path d="M${f(-s * .3)},${f(-s * .3)} L${f(s * .2)},${f(-s * .3)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/><path d="M${f(s * .3)},${f(-s * .1)} L${f(s * .3)},${f(s * .3)}" stroke="#cfe4ea" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`;
}

// =========================================================
const DISHES = {
    // 닭갈비: 大きな鉄鍋に、コチュジャンだれの鶏もも、キャベツ、さつまいも、棒餅、ねぎ、えごまの葉
    kr_dakgalbi: p => {
        const sp = xkrSpots('dg', 21, 64, 18);
        const R = rng(p.id + 'dg');
        const cab = [[58, 70, 40, 20], [140, 64, 38, -30], [150, 128, 38, 60], [64, 136, 40, -50], [100, 96, 36, 10], [100, 150, 34, 80], [100, 50, 34, 110]];
        return [
            xkrIronPan(p),
            K.liquid(p, { R: 80, c: '#b8341a', op: .95, shine: false }),
            `<g ${p.sh(.8)}>`,
            ...cab.map(([x, y, s, r], i) => K.leafPiece(p, x, y, s, r, { c: '#e2d88e', vein: '#f6f0cc', seed: i }) + `<path ${T(x, y, r)} d="M-12,3 Q0,-2 12,4" stroke="#c8401c" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>`),
            ...sp.map(([x, y, r], i) => i % 6 === 1 ? K.sweetPotato(p, x, y, 22, r) : i % 6 === 3 ? xkrTteok(p, x, y, 26, 9, r, { sauce: '#c8341a' }) : i % 6 === 5 ? K.onion(p, x, y, 20, r, { c: '#eba27e', layers: 1 }) : xkrChickenBone(p, x, y, 32 + R() * 4, r, { seed: i, bone: false, c: '#b8381c', lite: true })),
            `</g>`,
            ...[[86, 80, 30], [118, 118, -40], [74, 112, 70], [130, 86, 10], [104, 134, 50], [60, 92, -20]].map(([x, y, r], i) => xkrNegi(p, x, y, 18, r, { green: i % 2 === 0 })),
            xkrJulienne(p, 100, 100, 110, { n: 16, c: '#3f7a2e', w: 2.6, L: 18, seed: 3 }),
            xkrSesame(p, 100, 100, 60, 56, 30),
        ].join('');
    },

    // 닭강정: 白い皿に、甘辛い赤茶のたれをからめたひと口の揚げ鶏、砕いたピーナッツ、干し唐辛子
    kr_dakgangjeong: p => {
        const sp = xkrSpots('dgj', 15, 54, 24);
        const R = rng(p.id + 'dgj');
        return [
            xkrPlate(p, { rim: '#9a3a2a' }),
            K.pool(p, 100, 102, 128, '#8e2a10', { op: .8, seed: 4 }),
            `<g ${p.sh(1)}>`,
            ...sp.map(([x, y, r], i) => xkrGangjeong(p, x, y, 34 + R() * 6, r, { seed: i, c: i % 3 ? '#a8401a' : '#b44c1c' })),
            `</g>`,
            xkrDriedChili(p, 76, 90, 20, 30), xkrDriedChili(p, 128, 118, 18, -40), xkrDriedChili(p, 116, 74, 16, 120), xkrDriedChili(p, 84, 130, 16, 70),
            xkrPeanutBits(p, 100, 100, 52, 48, 34),
            xkrSesame(p, 100, 100, 50, 46, 16),
        ].join('');
    },

    // 소갈비찜: 黒い陶器の鉢に、濃い醤油色で照り煮した骨つきカルビ、丸く面取りした大根・にんじん、しいたけ、なつめ、松の実、錦糸卵
    kr_galbijjim: p => [
        K.bowl(p, { glaze: '#3e3834', inside: '#e8e0d2', lip: .88 }),
        K.liquid(p, { R: 76, c: '#6a3214', op: .95, shine: false }),
        `<g ${p.sh(1)}>`,
        ...[[66, 70, 24, 30], [150, 116, 22, 10], [100, 150, 22, 70], [150, 66, 22, -20], [52, 132, 22, 50], [114, 118, 20, 10]].map(([x, y, s, r], i) => xkrGlazedCube(p, x, y, s, r, { c: '#c8823a', seed: i })),
        ...[[100, 62, 48, -10], [64, 104, 46, 80], [128, 136, 46, 170], [132, 92, 48, 20], [88, 134, 44, -110], [100, 100, 44, 190]].map(([x, y, s, r], i) => xkrGalbi(p, x, y, s, r, { seed: i, c: '#74361a' })),
        K.carrotChunk(p, 62, 90, 18, 30, { c: '#e2682a' }), K.carrotChunk(p, 112, 120, 17, -40, { c: '#e2682a' }), K.carrotChunk(p, 134, 58, 16, 80, { c: '#e2682a' }), K.carrotChunk(p, 70, 140, 16, 10, { c: '#e2682a' }),
        K.shiitake(p, 84, 72, 18, 20, { cross: false }), K.shiitake(p, 148, 130, 16, 0, { cross: false }), K.shiitake(p, 104, 118, 15, 0, { cross: false }),
        xkrJujube(p, 128, 76, 13, 30), xkrJujube(p, 78, 120, 12, -20), xkrJujube(p, 150, 108, 12, 70),
        `</g>`,
        xkrJidan(p, 100, 98, 60, { n: 7 }),
        xkrPineNuts(p, 100, 100, 44, 40, 10),
    ].join(''),

    // 차돌박이숙주볶음: 白い皿に、さっと炒めた緑豆もやしの山、牛ばらの薄切り、にら、玉ねぎ、黒こしょう
    kr_chadolsukju: p => [
        xkrPlate(p, { rim: '#7a9a8a' }),
        K.pool(p, 100, 102, 124, '#b88a52', { op: .5, seed: 3 }),
        xkrMungSprouts(p, 100, 100, 124, { n: 95, tint: '#f6efdc' }),
        `<g ${p.sh(.9)}>`,
        ...[[78, 80, 40, 20], [122, 78, 38, -30], [140, 114, 36, 70], [96, 120, 42, 10], [62, 116, 36, -60], [104, 94, 36, 140], [114, 142, 32, 30], [96, 60, 30, -10], [70, 140, 30, 50]].map(([x, y, s, r], i) => xkrChadol(p, x, y, s * 1.15, r, { seed: i, cooked: 1 })),
        K.onion(p, 124, 96, 18, 40, { c: '#efd6a4', layers: 1 }), K.onion(p, 82, 100, 16, -50, { c: '#efd6a4', layers: 1 }),
        `</g>`,
        xkrChives(p, 100, 100, 104, { n: 18, L: 26 }),
        K.sprinkle(p, 100, 100, 110, { c: '#2a1a10', n: 26, r: .6 }),
    ].join(''),

    // 돼지고기수육: 木のまな板に、皮・脂・赤身の層が見えるゆで豚の厚切りを並べ、キムチとサンチュ、アミの塩辛
    kr_suyuk: p => [
        xkrBoard(p, { w: 188, h: 156 }),
        xkrLettuce(p, 150, 70, 50, 30, { seed: 1 }), xkrLettuce(p, 156, 128, 46, -40, { seed: 2, c: '#7fb84a' }),
        `<g ${p.sh(.9)}>`,
        ...[0, 1, 2, 3, 4, 5, 6].map(i => xkrSuyukSlice(p, 36 + i * 13, 70 + i * 1.5, 22, 46, 8 + i * 1.5, { seed: i })),
        ...[0, 1, 2, 3, 4, 5, 6].map(i => xkrSuyukSlice(p, 36 + i * 13, 126 - i * 1.5, 22, 46, -6 - i * 1.5, { seed: i + 9 })),
        ...[[150, 92, 30, 20], [138, 108, 28, -30], [160, 110, 26, 70], [148, 120, 26, 140]].map(([x, y, s, r], i) => xkrKimchi(p, x, y, s, r, { seed: i, deep: .3 })),
        `</g>`,
        xkrNegi(p, 144, 76, 12, 20, { green: true }), xkrChili(p, 162, 100, 8, 20), xkrChili(p, 136, 132, 8, -30),
    ].join(''),

    // 삼겹살구이: 溝のある丸い鉄板で、厚切りの豚ばらをこんがり焼き、キムチ、エリンギ、にんにく
    kr_samgyeopsal: p => [
        xkrGrill(p),
        `<g ${p.sh(1)}>`,
        ...[[92, 56, 96, 24, -12], [98, 84, 118, 25, -12], [104, 112, 116, 25, -12]].map(([x, y, L, w, r], i) => xkrBellyStrip(p, x, y, L, w, r, { seed: i, cooked: .8 + i * .08 })),
        ...[[150, 92, 30, 24, 70], [146, 122, 28, 24, 50], [56, 124, 30, 24, -20], [86, 138, 28, 24, 10]].map(([x, y, L, w, r], i) => xkrBellyStrip(p, x, y, L, w, r, { seed: i + 5, cooked: 1 })),
        ...[[116, 152, 26, 10], [138, 146, 24, -20], [60, 150, 24, 30], [158, 132, 22, -50]].map(([x, y, s, r], i) => xkrKimchi(p, x, y, s, r, { seed: i, deep: .7 })),
        ...[[136, 42, 0], [158, 74, 30], [46, 48, -40]].map(([x, y, r]) => K.eringi(p, x, y, 22, r)),
        ...[[48, 92], [156, 114], [142, 132], [44, 118], [64, 40]].map(([x, y]) => `<g ${T(x, y)}><ellipse rx="5.6" ry="4.4" fill="${p.rg('#f6ecd0', .2, .2)}" stroke="#c8a870" stroke-width=".6"/><ellipse rx="2.6" ry="1.8" fill="#e8c88a" opacity=".6"/></g>`),
        `</g>`,
        xkrSesame(p, 100, 92, 40, 32, 8),
    ].join(''),

    // 떡갈비: 白い皿にサンチュを敷き、甘辛だれで照り焼きした四角いひき肉のパティ、刻んだ松の実
    kr_tteokgalbi: p => [
        xkrPlate(p, { rim: '#4a6a5a' }),
        xkrLettuce(p, 70, 80, 70, -20, { seed: 1 }), xkrLettuce(p, 132, 82, 66, 40, { seed: 2, c: '#7fb84a' }), xkrLettuce(p, 100, 128, 70, 10, { seed: 3 }),
        xkrTgPatty(p, 76, 92, 62, 46, -18, { seed: 1 }),
        xkrTgPatty(p, 126, 90, 60, 44, 14, { seed: 2 }),
        xkrTgPatty(p, 102, 132, 64, 44, 4, { seed: 3 }),
        xkrPineNuts(p, 100, 106, 46, 36, 22),
        ...[[78, 90, 20], [124, 88, -20], [104, 128, 50], [90, 108, 0]].map(([x, y, r]) => xkrNegi(p, x, y, 10, r, { green: true })),
        xkrSesame(p, 100, 106, 46, 36, 12),
    ].join(''),

    // 갈치조림: 黄色いアルミ鍋に、赤い煮汁、大根の厚切り、銀色の太刀魚、玉ねぎ、ねぎ、青唐辛子
    kr_galchijorim: p => [
        xkrWidePot(p, { gold: true }),
        K.liquid(p, { R: 80, c: '#b83a1e', op: .96, shine: false }),
        `<g ${p.sh(.8)}>`,
        ...[[62, 74, 36, 20], [136, 70, 34, -20], [146, 130, 34, 30], [60, 130, 34, 60], [100, 100, 34, 0]].map(([x, y, s, r]) => K.daikon(p, x, y, s, r, { c: '#e8a670' })),
        `</g>`,
        ...[[96, 66, 58, 22, -10], [102, 100, 62, 24, 6], [94, 136, 58, 22, -4], [146, 100, 40, 20, 80], [52, 100, 40, 20, 96]].map(([x, y, w, h, r], i) => xkrHairtail(p, x, y, w, h, r, { sauce: '#b8301a', seed: i })),
        K.onion(p, 130, 76, 18, 40, { c: '#eca07c', layers: 1 }), K.onion(p, 72, 124, 18, -40, { c: '#eca07c', layers: 1 }),
        xkrNegi(p, 120, 120, 16, 30, { green: true }), xkrNegi(p, 76, 84, 15, -40), xkrNegi(p, 128, 150, 14, 10, { green: true }), xkrNegi(p, 70, 60, 14, 60, { green: true }),
        xkrChili(p, 112, 82, 9, 20), xkrChili(p, 80, 112, 9, -30), xkrChili(p, 140, 116, 8, 60, { c: '#c8281a' }),
        xkrFlakes(p, 100, 100, 60, 56, 40),
        xkrBubbles([[44, 70, 2.4], [156, 58, 2], [160, 146, 2.2], [48, 150, 2]]),
    ].join(''),

    // 조기구이: 白い長皿に、こんがり焼いた黄色いぐちを2尾、大根おろし
    kr_jogigui: p => [
        K.longPlate(p, { w: 188, h: 128, base: '#f6f4ef', rim: '#cfc8bc' }),
        `<g ${p.sh(1.2)}>`, xkrCroaker(p, 96, 76, 150, -3, { seed: 1 }), xkrCroaker(p, 104, 124, 150, 3, { seed: 2 }), `</g>`,
        K.grated(p, 170, 100, 18),
    ].join(''),

    // 해물파전: 茶色い縁の皿に、細ねぎを並べて焼いた大きな丸いチヂミ、いか、えび、赤と青の唐辛子
    kr_haemulpajeon: p => {
        const R = rng(p.id + 'pj');
        let stalks = '';
        for (let i = 0; i < 13; i++){
            const off = -66 + i * 11 + (R() - .5) * 3;
            stalks += `<g transform="translate(100 100) rotate(-28) translate(0 ${f(off)})"><path d="M-80,0 L${f(10 + R() * 30)},0" stroke="#3f7a26" stroke-width="5" stroke-linecap="round" opacity=".9"/><path d="M-80,-1 L${f(10 + R() * 30)},-1" stroke="#7fbf4a" stroke-width="2" stroke-linecap="round"/><path d="M${f(30 + R() * 20)},0 L80,0" stroke="#e8ecd0" stroke-width="5" stroke-linecap="round"/></g>`;
        }
        return [
            xkrPlate(p, { rim: '#8a6a4a', base: '#f4efe4' }),
            `<g ${p.sh(1.4)}><g ${p.rough(3, .1)}><circle cx="100" cy="100" r="72" fill="${p.rg('#e6b45a', .25, .3, .4, .38)}" stroke="#a8641e" stroke-width="2"/></g></g>`,
            xkrClip(p, 70, [
                stalks,
                `<g ${p.crumb(.5)}><circle cx="100" cy="100" r="70" fill="#f0c66a" opacity=".35"/></g>`,
                ...[[72, 76], [128, 118], [96, 136], [140, 78], [64, 120]].map(([x, y]) => `<path ${T(x, y)} d="${smooth(ring(9, 7, .5, R, 1.4, .8))}" fill="#c87a24" opacity=".45"/>`),
                ...[[82, 92, 30, 14, 20], [124, 96, 30, 14, -30], [104, 124, 28, 13, 60], [76, 128, 24, 12, 10], [120, 64, 26, 12, 40]].map(([x, y, w, h, r], i) => xkrSquid(p, x, y, w, h, r, { seed: i, sauce: '#f0b070' })),
                ...[[104, 80, 0], [140, 116, 60], [66, 104, -40], [96, 104, 120], [132, 138, 20]].map(([x, y, r]) => K.shrimp(p, x, y, 18, r, { c: '#f08a5a' })),
            ].join('')),
            xkrChili(p, 90, 74, 9, 20, { c: '#c8281a' }), xkrChili(p, 118, 132, 9, -30), xkrChili(p, 146, 96, 8, 40, { c: '#c8281a' }), xkrChili(p, 70, 140, 8, 10), xkrChili(p, 110, 108, 8, 70),
            `<path d="M48,70 A62,62 0 0 1 80,38" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`,
        ].join('');
    },
    // 주꾸미볶음: 白い皿に、赤いたれで炒めた小さなたこ、キャベツ、玉ねぎ、にんじん、ねぎ、ごま
    kr_jjukkumibokkeum: p => [
        xkrPlate(p),
        K.pool(p, 100, 104, 140, '#b8301a', { op: .86, seed: 6 }),
        `<g ${p.sh(.9)}>`,
        ...[[66, 78, 34, 20], [138, 124, 32, -40], [130, 64, 30, 70], [64, 130, 30, 10], [100, 100, 28, 120]].map(([x, y, s, r], i) => K.leafPiece(p, x, y, s, r, { c: '#e8d898', vein: '#f6eec8', seed: i }) + `<path ${T(x, y, r)} d="M-10,3 Q0,-2 10,4" stroke="#c03018" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>`),
        ...[[88, 76, 0], [128, 94, 40], [104, 132, 160], [70, 108, -30], [140, 136, 80], [112, 62, -60], [64, 140, 30]].map(([x, y, r], i) => xkrJukkumi(p, x, y, 44, r * 2.3, { seed: i })),
        ...[[96, 110, 10], [120, 146, -40], [56, 96, 70], [146, 80, 20]].map(([x, y, r]) => xkrStick(p, x, y, 22, 3.6, r, '#ec7a2c')),
        K.onion(p, 116, 112, 20, 60, { c: '#eaa07a' }), K.onion(p, 84, 96, 18, -30, { c: '#eaa07a' }),
        `</g>`,
        xkrNegi(p, 100, 96, 15, 20, { green: true }), xkrNegi(p, 134, 112, 14, -50, { green: true }), xkrNegi(p, 76, 124, 13, 40), xkrNegi(p, 120, 80, 13, 80, { green: true }),
        xkrChili(p, 92, 118, 8, 30), xkrChili(p, 116, 90, 8, -20),
        xkrSesame(p, 100, 104, 52, 48, 22),
    ].join(''),

    // 두부김치: 白い皿の縁に温かい豆腐の厚切りを並べ、真ん中に豚肉と炒めたキムチ、ねぎ、ごま
    kr_dubukimchi: p => {
        const tf = Array.from({ length: 11 }, (_, i) => { const a = i / 11 * 6.283 - 1.2; return xkrTofu(p, 100 + Math.cos(a) * 58, 100 + Math.sin(a) * 58, 36, 22, a * 57.3 + 90, { c: '#f8f3e4' }); });
        return [
            xkrPlate(p, { rim: '#3e4e6e' }),
            `<g ${p.sh(.9)}>`, ...tf, `</g>`,
            K.pool(p, 100, 100, 80, '#a8341a', { op: .6, seed: 2 }),
            `<g ${p.sh(.9)}>`,
            ...xkrSpots('dbk', 9, 28, 14).map(([x, y, r], i) => xkrKimchi(p, x, y, 28, r, { seed: i, deep: .75 })),
            K.porkSlice(p, 88, 92, 26, 30, { c: '#b8502e', fat: '#f0c0a0', seed: 1 }), K.porkSlice(p, 112, 110, 24, -40, { c: '#b8502e', fat: '#f0c0a0', seed: 2 }), K.porkSlice(p, 104, 82, 22, 80, { c: '#b8502e', fat: '#f0c0a0', seed: 3 }),
            `</g>`,
            xkrNegi(p, 96, 108, 12, 20, { green: true }), xkrNegi(p, 116, 94, 12, -40, { green: true }), xkrNegi(p, 86, 118, 11, 60),
            xkrSesame(p, 100, 100, 70, 66, 28),
        ].join('');
    },

    // 오므라이스: 白い楕円皿に、ご飯を包んだ大きな卵、ケチャップの線、パセリ
    kr_omurice: p => [
        K.ovalDish(p, { rx: 96, ry: 78, rim: '#c8443a' }),
        xkrOmelette(p, 100, 100, 154, 98, -6),
        K.drizzle(p, 100, 96, 92, 16, { c: '#d83020', width: 3.6, n: 7, r: -6 }),
        K.parsley(p, 150, 120, 14),
    ].join(''),

    // 비빔밥: 黒い石鍋に、ご飯の上にもやし・ほうれん草・にんじん・ズッキーニ・わらび・牛肉を放射状に、真ん中に目玉焼きとコチュジャン
    kr_bibimbap: p => {
        const R = rng(p.id + 'bb');
        const sec = k => [100 + Math.cos(k / 6 * 6.283 - 1.6) * 46, 100 + Math.sin(k / 6 * 6.283 - 1.6) * 46];
        const [s0, s1, s2, s3, s4, s5] = [0, 1, 2, 3, 4, 5].map(k => sec(k));
        const sprout = [];
        for (let i = 0; i < 14; i++){ const [a, b] = xkrSoySprout(p, s0[0] + (R() - .5) * 40, s0[1] + (R() - .5) * 26, R() * 180, 22, { bend: (R() - .5) * .4 }); sprout.push(a + b); }
        let spin = '';
        for (let i = 0; i < 13; i++) spin += xkrLeaf(p, s2[0] + (R() - .5) * 36, s2[1] + (R() - .5) * 34, 24, R() * 360, i % 2 ? '#2a6424' : '#357a2c');
        return [
            K.stonePot(p, { R: 94 }),
            `<circle cx="100" cy="100" r="80" fill="none" stroke="#4a4442" stroke-width="2"/>`,
            xkrRice(p, 100, 100, 156, { density: .16, seed: 1 }),
            `<g ${p.sh(.8)}>`,
            sprout.join(''),
            xkrJulienne(p, s1[0], s1[1], 50, { n: 22, c: '#ec7a2a', w: 2.4, L: 22, seed: 1 }),
            spin,
            xkrJulienne(p, s3[0], s3[1], 50, { n: 22, c: '#a8cc66', w: 2.8, L: 20, seed: 2, edge: '#4e7a2a' }),
            xkrBracken(p, s4[0], s4[1], 46, { n: 22, seed: 2 }),
            xkrMince(p, s5[0], s5[1], 46, { c: '#6e3e20', n: 56 }),
            `</g>`,
            xkrFriedEgg(p, 100, 100, 60, 0),
            `<g ${p.sh(.5)}><path ${T(110, 84)} d="M-7,0 C-7,-6 7,-6 7,0 C7,5 -7,5 -7,0Z" fill="${p.g('#b82614', .3, .3)}" stroke="#7a1608" stroke-width=".5"/></g><path d="M105,82 q3,-2 6,-1" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/>`,
            xkrSesame(p, 100, 100, 60, 60, 24),
        ].join('');
    },

    // 콩나물밥: 真鍮の器に、炊き込んだご飯と大豆もやし、ひき肉、ねぎ入りの醤油だれ
    kr_kongnamulbap: p => {
        const R = rng(p.id + 'knb');
        const stems = [], heads = [];
        for (const [x, y] of xkrSpots('knb', 34, 60, 10)){ const [a, b] = xkrSoySprout(p, x, y, R() * 360, 28 + R() * 8, { bend: (R() - .5) * .5 }); stems.push(a); heads.push(b); }
        return [
            xkrBrass(p),
            xkrRice(p, 100, 100, 148, { density: .18, tint: '#f2ecdc', seed: 2 }),
            xkrMince(p, 100, 100, 124, { c: '#7a4a2a', n: 40 }),
            `<g ${p.sh(.6)}>`, stems.join(''), heads.join(''), `</g>`,
            `<path ${T(108, 98)} d="${smooth(ring(24, 10, .3, R, 1.2, .8))}" fill="${p.rg('#7a4018', .25, .25)}" opacity=".7"/><path d="M90,92 q8,-6 18,-4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>`,
            K.scallions(p, 108, 98, 40, { n: 18, c: '#4f9a34' }), xkrFlakes(p, 108, 98, 20, 14, 26),
            xkrSesame(p, 100, 100, 56, 54, 18),
        ].join('');
    },

    // 잡채: 白い皿に、醤油とごま油でつやの出た春雨、ほうれん草・にんじん・赤パプリカ・しいたけ・牛肉・玉ねぎ・錦糸卵
    kr_japchae: p => [
        xkrPlate(p, { rim: '#6a4a8a' }),
        xkrNoodles(p, 100, 102, 146, { c: '#9a7452', w: 3, n: 40, seed: 2, sy: .92, outline: '#5e4028', hi: .7 }),
        `<path d="M58,86 Q80,64 110,66" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>`,
        `<g ${p.sh(.6)}>`,
        ...xkrSpots('jc1', 8, 54, 14, 100, 102).map(([x, y, r]) => xkrLeaf(p, x, y, 22, r, '#2f7028')),
        ...xkrSpots('jc2', 10, 56, 10, 100, 102).map(([x, y, r]) => xkrStick(p, x, y, 22, 3, r, '#ec7a2a')),
        ...xkrSpots('jc3', 7, 54, 12, 100, 102).map(([x, y, r]) => xkrStick(p, x, y, 22, 3.6, r, '#d8301e')),
        ...xkrSpots('jc4', 7, 52, 12, 100, 102).map(([x, y, r]) => xkrStick(p, x, y, 18, 4, r, '#6a4026')),
        ...xkrSpots('jc5', 7, 50, 14, 100, 102).map(([x, y, r]) => xkrStick(p, x, y, 20, 3, r, '#4a2a16')),
        ...xkrSpots('jc6', 5, 50, 16, 100, 102).map(([x, y, r]) => K.onion(p, x, y, 14, r, { c: '#efd8b0', layers: 1 })),
        `</g>`,
        xkrJidan(p, 100, 102, 90, { n: 9 }),
        xkrSesame(p, 100, 102, 58, 54, 26),
    ].join(''),

    // 잔치국수: 真鍮の器に、煮干しだしの澄んだ汁、白い素麺、ズッキーニ・にんじん・錦糸卵・刻みキムチ・のり・ねぎ
    kr_janchiguksu: p => [
        xkrBrass(p),
        K.liquid(p, { R: 80, c: '#e2d2a4', op: .92, shine: false }),
        xkrNoodles(p, 100, 100, 148, { c: '#f8f2e2', w: 2.6, n: 42, seed: 4, outline: '#d8ccb0' }),
        `<circle cx="100" cy="100" r="80" fill="#e6d8b0" opacity=".14"/>`,
        `<g ${p.sh(.5)}>`,
        xkrJulienne(p, 70, 86, 42, { n: 22, c: '#9cc45a', w: 2.6, L: 22, seed: 1, edge: '#4e7a2a' }),
        xkrJulienne(p, 132, 84, 38, { n: 18, c: '#ec7a2a', w: 2.4, L: 22, seed: 2 }),
        ...[[104, 124, 20], [86, 132, -20], [120, 136, 70], [98, 140, 0]].map(([x, y, r], i) => xkrKimchi(p, x, y, 18, r, { seed: i, deep: .3 })),
        `</g>`,
        xkrJidan(p, 102, 92, 40, { n: 11, white: false }),
        xkrGim(p, 100, 100, 40, { n: 9 }),
        K.scallions(p, 100, 100, 90, { n: 14, c: '#4f9a34' }),
        xkrSesame(p, 100, 100, 40, 36, 10),
    ].join(''),

    // 비빔국수: 白い深皿に、コチュジャンだれで赤く和えた素麺、きゅうりの千切り、ゆで卵、刻みキムチ、レタス、ごま
    kr_bibimguksu: p => [
        K.bowl(p, { glaze: '#e8e4dc', inside: '#fbfaf6', lip: .88 }),
        xkrLettuce(p, 62, 80, 44, -30, { seed: 1 }), xkrLettuce(p, 140, 126, 44, 140, { seed: 2, c: '#7fb84a' }),
        xkrNoodles(p, 100, 102, 134, { c: '#d65a30', w: 2.6, n: 50, seed: 3, outline: '#9a3018' }),
        `<g ${p.sh(.6)}>`,
        ...[[70, 120, 30], [128, 72, -20], [96, 136, 60]].map(([x, y, r], i) => xkrKimchi(p, x, y, 18, r, { seed: i, deep: .6 })),
        xkrJulienne(p, 92, 90, 34, { n: 20, c: '#c8e09a', w: 2.6, L: 24, seed: 4, edge: '#3d7a2c' }),
        `</g>`,
        K.eggHalf(p, 120, 102, 30, -10), K.eggHalf(p, 128, 120, 26, 30),
        xkrSesame(p, 100, 100, 56, 52, 28),
    ].join(''),

    // 김밥: 木のまな板に、のりで巻いて切った김밥を2列、ごま
    kr_kimbap: p => [
        xkrBoard(p, { w: 188, h: 150, c: '#d4a870' }),
        `<g ${p.sh(.4)}>`,
        ...[0, 1, 2, 3, 4].map(i => xkrKimbapSlice(p, 30 + i * 33, 74, 42, i * 50, { seed: i })),
        ...[0, 1, 2, 3, 4].map(i => xkrKimbapSlice(p, 40 + i * 33, 126, 42, i * 70 + 20, { seed: i + 6 })),
        `</g>`,
        xkrSesame(p, 100, 100, 80, 50, 26),
    ].join(''),

    // 김치찜: 土鍋に、ひと株のまま煮込んだ長いキムチと、厚切りの豚ばら、赤い煮汁、ねぎ
    kr_kimchijjim: p => [
        xkrTtuk(p),
        K.liquid(p, { R: 78, c: '#b03a1c', op: 1, shine: false }),
        xkrOil(p, 100, 100, 144, { n: 12, c: '#ee6a2a', op: .6, rmax: 2.4 }),
        xkrKimchiLong(p, 96, 70, 140, 38, -8, { seed: 1, cooked: .7 }),
        xkrKimchiLong(p, 104, 128, 140, 38, 172, { seed: 2, cooked: .7 }),
        `<g ${p.sh(.8)}>`,
        ...[[62, 100, 32, 28, -10], [100, 98, 34, 28, 8], [138, 100, 32, 28, -6], [80, 148, 28, 24, 20], [128, 52, 28, 24, -16]].map(([x, y, w, h, r], i) => xkrPorkBelly(p, x, y, w, h, r, { seed: i, tint: '#c8502a' })),
        `</g>`,
        xkrNegi(p, 84, 90, 18, 30, { green: true }), xkrNegi(p, 120, 108, 18, -20), xkrNegi(p, 150, 80, 16, 60, { green: true }), xkrNegi(p, 52, 118, 15, -50, { green: true }),
        xkrBubbles([[58, 58, 2.4], [150, 140, 2.2], [44, 104, 2]]),
    ].join(''),
    // 고사리나물: 白磁の小鉢に、ごま油で炒めた茶色いわらび、ねぎ、ごま
    kr_gosarinamul: p => [
        xkrDish(p),
        xkrMound(p, 64, '#5a3a1e'),
        xkrBracken(p, 100, 100, 112, { n: 46, c: '#7a5232' }),
        xkrBracken(p, 100, 100, 80, { n: 18, c: '#8a6038', seed: 2 }),
        K.scallions(p, 100, 100, 90, { n: 12, c: '#4f9a34' }),
        xkrSesame(p, 100, 100, 54, 50, 34),
    ].join(''),

    // 숙주나물: 青磁の小鉢に、塩とごま油で和えた細い緑豆もやし、ねぎ、ごま
    kr_sukjunamul: p => [
        K.kobachi(p, { glaze: '#9fbfae', inside: '#eef2ea' }),
        xkrMound(p, 62, '#e6e2c8'),
        xkrMungSprouts(p, 100, 100, 112, { n: 100, seed: 3 }),
        K.scallions(p, 100, 100, 90, { n: 14, c: '#4f9a34' }),
        xkrSesame(p, 100, 100, 52, 48, 30),
    ].join(''),

    // 무생채: 白磁の小鉢に、粉唐辛子で赤く和えた大根の千切り、ねぎ、ごま
    kr_musaengchae: p => [
        K.kobachi(p, { glaze: '#d8dde6', inside: '#fbfbf8' }),
        xkrMound(p, 62, '#d8603a'),
        xkrJulienne(p, 100, 100, 112, { n: 110, c: '#ef9474', w: 3, L: 30, edge: '#c0482a', seed: 1 }),
        xkrFlakes(p, 100, 100, 54, 50, 70, { c: '#b8200e' }),
        K.scallions(p, 100, 100, 90, { n: 12, c: '#4f9a34' }),
        xkrSesame(p, 100, 100, 52, 48, 26),
    ].join(''),

    // 가지나물: 白磁の小鉢に、蒸して裂いたなすを醤油とごま油で和え、ねぎ、赤唐辛子、ごま
    kr_gajinamul: p => {
        const R = rng(p.id + 'gn');
        return [
            xkrDish(p, { glaze: '#e4e0d8' }),
            xkrMound(p, 62, '#6a4a3a'),
            `<g ${p.sh(.7)}>`, ...xkrSpots('gn', 22, 52, 13).map(([x, y, r], i) => xkrEggplantStrip(p, x, y, 34 + R() * 10, 8 + R() * 3, r, { seed: i })), `</g>`,
            K.scallions(p, 100, 100, 90, { n: 14, c: '#4f9a34' }),
            xkrChili(p, 84, 92, 7, 20, { c: '#c8281a' }), xkrChili(p, 118, 112, 7, -30, { c: '#c8281a' }), xkrChili(p, 108, 80, 6, 50, { c: '#c8281a' }),
            xkrSesame(p, 100, 100, 52, 48, 28),
        ].join('');
    },

    // 버섯볶음: 黒い陶器の小鉢に、裂いたひらたけの炒め、玉ねぎ、にんじん、ねぎ、ごま
    kr_beoseotbokkeum: p => {
        const R = rng(p.id + 'bs');
        return [
            K.kobachi(p, { glaze: '#4a4440', inside: '#ece6dc' }),
            xkrMound(p, 62, '#8a6a48'),
            `<g ${p.sh(.7)}>`,
            ...xkrSpots('bs', 20, 52, 14).map(([x, y, r], i) => xkrOyster(p, x, y, 26 + R() * 8, r, { seed: i, c: i % 3 ? '#c4a47a' : '#ad8c62' })),
            ...xkrSpots('bs2', 5, 46, 18).map(([x, y, r]) => K.onion(p, x, y, 16, r, { c: '#f0dcb0', layers: 1 })),
            `</g>`,
            xkrJulienne(p, 100, 100, 90, { n: 12, c: '#ec7a2a', w: 2.4, L: 18, seed: 2 }),
            K.scallions(p, 100, 100, 90, { n: 12, c: '#4f9a34' }),
            xkrSesame(p, 100, 100, 52, 48, 22),
        ].join('');
    },

    // 어묵볶음: 白磁の小鉢に、短冊の練り物を醤油で甘辛く炒め、玉ねぎ、にんじん、青唐辛子、ごま
    kr_eomukbokkeum: p => {
        const R = rng(p.id + 'eb');
        return [
            xkrDish(p, { glaze: '#c8d4dc' }),
            xkrMound(p, 62, '#b8803a'),
            `<g ${p.sh(.7)}>`,
            ...xkrSpots('eb', 18, 50, 15).map(([x, y, r], i) => xkrEomuk(p, x, y, 30 + R() * 6, 10, r, { seed: i, c: i % 3 ? '#d49a50' : '#c8883e', sauce: '#8a4a1a' })),
            ...xkrSpots('eb2', 5, 46, 18).map(([x, y, r]) => K.onion(p, x, y, 16, r, { c: '#efd2a0', layers: 1 })),
            `</g>`,
            xkrJulienne(p, 100, 100, 92, { n: 14, c: '#ec7a2a', w: 2.4, L: 18, seed: 3 }),
            xkrChili(p, 86, 90, 7, 20), xkrChili(p, 116, 112, 7, -30), xkrChili(p, 110, 78, 7, 60), xkrChili(p, 78, 118, 7, 0),
            ...xkrSpots('eb', 18, 50, 15).slice(0, 10).map(([x, y]) => `<path d="M${f(x - 8)},${f(y - 3)} l10,-1" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>`),
            xkrSesame(p, 100, 100, 52, 48, 26),
        ].join('');
    },

    // 소고기장조림: 茶釉の小鉢に、醤油の煮汁、繊維に沿って裂いた牛肉、煮卵、うずら卵、꽈리고추
    kr_jangjorim: p => [
        K.kobachi(p, { glaze: '#6e4b33', inside: '#efe5d3' }),
        K.liquid(p, { R: 66, c: '#5a3218', op: .92, shine: false }),
        xkrJulienne(p, 100, 104, 112, { n: 60, c: '#7a4a2a', w: 3.2, L: 24, seed: 1, edge: '#3e200c' }),
        `<g ${p.sh(.7)}>`,
        K.eggHalf(p, 80, 82, 32, -20, { stain: '#c8915a' }), K.eggHalf(p, 124, 118, 32, 30, { stain: '#c8915a' }),
        K.quailEgg(p, 124, 80, 16, 20, { c: '#b07a40' }), K.quailEgg(p, 76, 120, 16, -20, { c: '#b07a40' }), K.quailEgg(p, 102, 100, 15, 60, { c: '#a8703a' }),
        xkrKkwari(p, 100, 64, 30, 10), xkrKkwari(p, 140, 98, 26, 80), xkrKkwari(p, 98, 138, 28, -20), xkrKkwari(p, 60, 98, 24, 100),
        `</g>`,
        `<path d="M54,82 A50,50 0 0 1 82,54" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),

    // 콩자반: 白磁の小鉢に、甘辛く煮てつやの出た黒豆、ごま
    kr_kongjaban: p => {
        const R = rng(p.id + 'kj');
        const g = p.rg('#2e241e', .25, .4, .35, .32);
        const beans = xkrSpots('kj', 70, 58, 9.5).map(([x, y, r]) => { const s = 11 + R() * 2.4; return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(s / 2)}" ry="${f1(s * .42)}" transform="rotate(${r} ${f1(x)} ${f1(y)})" fill="${g}" stroke="#0e0a08" stroke-width=".5"/>`; }).join('');
        const hi = xkrSpots('kj', 70, 58, 9.5).map(([x, y]) => `M${f1(x - 3.2)},${f1(y - 1.6)}l2.2,-1.4`).join('');
        return [
            xkrDish(p),
            xkrMound(p, 62, '#2a1e18'),
            `<g ${p.sh(.4)}>${beans}</g>`,
            `<path d="${hi}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`,
            xkrSesame(p, 100, 100, 52, 48, 30),
        ].join('');
    },

    // 연근조림: 青磁の小鉢に、醤油と水あめで照りよく煮たれんこんの輪切り、ごま
    kr_yeongeunjorim: p => [
        K.kobachi(p, { glaze: '#8fb0a0', inside: '#eef2ea' }),
        xkrMound(p, 62, '#6a3a18'),
        ...[[100, 100], [64, 82], [100, 60], [136, 82], [136, 120], [100, 140], [64, 120], [80, 100], [120, 100], [100, 80], [100, 120]].map(([x, y], i) => K.lotus(p, x, y, 38, i * 37, { c: '#94501e' }) + `<path d="M${x - 12},${y - 8} q8,-7 18,-5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`),
        xkrSesame(p, 100, 100, 54, 50, 30),
    ].join(''),

    // 계란찜: 土鍋から盛り上がるほどふくらんだ蒸し卵、ねぎ、にんじん、ごま
    kr_gyeranjjim: p => {
        const R = rng(p.id + 'gj');
        let cr = '';
        for (let i = 0; i < 7; i++){ const a = R() * 6.28, d = 20 + R() * 40; cr += `M${f(100 + Math.cos(a) * d)},${f(100 + Math.sin(a) * d)} q${f((R() - .5) * 12)},${f((R() - .5) * 12)} ${f((R() - .5) * 18)},${f((R() - .5) * 18)}`; }
        return [
            xkrTtuk(p),
            `<g ${p.sh(1.6)}><g ${p.rough(9, .045)}><circle cx="100" cy="100" r="76" fill="${p.rg('#f6d050', .55, .38, .4, .38)}" stroke="#c88a20" stroke-width="1.2"/></g></g>`,
            `<g ${p.crumb(.25)}><circle cx="100" cy="100" r="70" fill="#f6d256" opacity=".3"/></g>`,
            `<circle cx="92" cy="90" r="40" fill="#fff8d0" opacity=".35"/>`,
            `<path d="${cr}" stroke="#d89a2a" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
            `<path d="M50,80 Q62,52 96,44" stroke="#fffbe0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`,
            K.scallions(p, 100, 100, 96, { n: 22, c: '#4f9a34' }),
            K.sprinkle(p, 100, 100, 90, { c: '#e8702a', n: 18, r: 1 }),
            xkrSesame(p, 100, 100, 50, 50, 16),
        ].join('');
    },
    // 두부부침: 白い皿に、きつね色に焼いた豆腐の厚切りを並べ、ねぎ入りの醤油だれと粉唐辛子
    kr_dububuchim: p => {
        const R = rng(p.id + 'db');
        const pcs = [[60, 72, -30], [98, 62, -30], [136, 74, -30], [56, 112, -30], [96, 104, -30], [138, 116, -30], [80, 144, -30], [122, 150, -30]];
        return [
            xkrPlate(p, { rim: '#8a8478' }),
            ...pcs.map(([x, y, r], i) => xkrTofuFried(p, x, y, 44, 30, r + (R() - .5) * 8, { seed: i })),
            ...pcs.map(([x, y]) => `<path ${T(x, y, -30)} d="M-15,2 Q-2,-3 15,1" stroke="#8a4a1c" stroke-width="5" fill="none" stroke-linecap="round" opacity=".38"/><path ${T(x, y, -30)} d="M-10,-2 Q-2,-5 8,-3" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>`),
            K.scallions(p, 100, 106, 120, { n: 30, c: '#4f9a34' }),
            xkrFlakes(p, 100, 106, 60, 54, 60),
            xkrSesame(p, 100, 106, 58, 54, 20),
        ].join('');
    },

    // 애호박전: 白い皿に、卵衣をつけて焼いたズッキーニの輪切りを重ねて並べ、赤唐辛子の飾り
    kr_hobakjeon: p => [
        xkrPlate(p, { rim: '#5a8a5a' }),
        ...[[60, 70], [100, 58], [140, 70], [52, 108], [92, 98], [132, 104], [150, 136], [70, 142], [110, 140]].map(([x, y], i) => xkrHobakJeon(p, x, y, 46, { seed: i, chili: i % 3 === 1 ? '#c8281a' : i % 3 === 2 ? '#3f8f2a' : null })),
    ].join(''),

    // 김치전: 白い皿に、刻みキムチ入りの赤い丸いチヂミを焼き、切り分けたもの、ねぎ
    kr_kimchijeon: p => {
        const R = rng(p.id + 'kj');
        return [
            xkrPlate(p, { rim: '#8a4a3a' }),
            `<g ${p.sh(1.4)}><g ${p.rough(3, .1)}><circle cx="100" cy="100" r="72" fill="${p.rg('#e0703a', .25, .3, .4, .38)}" stroke="#a8401e" stroke-width="2"/></g></g>`,
            xkrClip(p, 70, [
                `<g ${p.crumb(.5)}><circle cx="100" cy="100" r="70" fill="#e8783e" opacity=".5"/></g>`,
                ...xkrSpots('kjn', 12, 56, 18).map(([x, y, r], i) => xkrKimchi(p, x, y, 18, r, { seed: i, deep: .6 })),
                ...[[72, 76], [128, 118], [96, 136], [140, 78], [64, 120], [110, 90], [150, 106], [92, 50]].map(([x, y]) => `<path ${T(x, y)} d="${smooth(ring(9, 7, .5, R, 1.4, .8))}" fill="#8a2e0c" opacity=".45"/>`),
                `<circle cx="100" cy="100" r="68" fill="none" stroke="#9a3a14" stroke-width="6" opacity=".35"/>`,
                K.onion(p, 86, 104, 16, 30, { c: '#f0b080', layers: 1 }), K.onion(p, 124, 70, 14, -40, { c: '#f0b080', layers: 1 }),
            ].join('')),
            K.scallions(p, 100, 100, 110, { n: 14, c: '#4f9a34' }),
            `<path d="M48,70 A62,62 0 0 1 80,38" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".5"/>`,
        ].join('');
    },

    // 동그랑땡: 白い皿に、卵衣で焼いた小さな丸いひき肉と豆腐の焼き物を並べ、パセリ
    kr_dongeurangttaeng: p => [
        xkrPlate(p, { rim: '#c89a3a' }),
        ...[[100, 100], [100, 62], [133, 81], [133, 119], [100, 138], [67, 119], [67, 81], [140, 46], [160, 100], [140, 154], [60, 154], [40, 100], [60, 46]].map(([x, y], i) => xkrDongeurang(p, x, y, i < 7 ? 38 : 32, { seed: i })),
        K.parsley(p, 100, 100, 10),
    ].join(''),

    // 배추겉절이: 白磁の小鉢に、生の白菜を粉唐辛子の薬味で和えた浅漬け、ねぎ、ごま
    kr_baechugeotjeori: p => [
        xkrDish(p),
        xkrMound(p, 60, '#e2a070'),
        `<g ${p.sh(.6)}>`, ...xkrSpots('gtj', 17, 52, 15).map(([x, y, r], i) => xkrGeotjeori(p, x, y, 40, r, { seed: i })), `</g>`,
        xkrChives(p, 100, 100, 96, { n: 14, L: 24, c: '#4f9a34' }),
        xkrFlakes(p, 100, 100, 54, 50, 50),
        xkrSesame(p, 100, 100, 52, 48, 30),
    ].join(''),

    // 미역줄기볶음: 白磁の小鉢に、ごま油で炒めたつやのある濃い緑のわかめの茎、にんじん、玉ねぎ、ごま
    kr_miyeokjulgi: p => [
        xkrDish(p, { glaze: '#d8e0d0' }),
        xkrMound(p, 62, '#2a3a1c'),
        xkrJulienne(p, 100, 100, 112, { n: 64, c: '#4a6a2a', w: 3.4, L: 34, edge: '#1e2a10', seed: 1, gloss: .7 }),
        xkrJulienne(p, 100, 100, 100, { n: 24, c: '#3a5a22', w: 3, L: 30, edge: '#1e2a10', seed: 2, gloss: .7 }),
        xkrJulienne(p, 100, 100, 90, { n: 12, c: '#ec7a2a', w: 2.2, L: 18, seed: 3 }),
        ...xkrSpots('myj', 4, 44, 20).map(([x, y, r]) => K.onion(p, x, y, 14, r, { c: '#f0e0b8', layers: 1 })),
        xkrSesame(p, 100, 100, 52, 48, 34),
    ].join(''),

    // 진미채볶음: 白磁の小鉢に、コチュジャンと水あめで甘辛くからめた裂きいか、ごま
    kr_jinmichae: p => [
        xkrDish(p, { glaze: '#e8d8c8' }),
        xkrMound(p, 62, '#b8441e'),
        xkrJulienne(p, 100, 100, 112, { n: 70, c: '#d8643a', w: 4, L: 28, edge: '#9a2e12', seed: 1, gloss: .75 }),
        xkrJulienne(p, 100, 100, 100, { n: 26, c: '#eca07a', w: 3.4, L: 24, edge: '#b8502a', seed: 2, gloss: .7 }),
        xkrSesame(p, 100, 100, 54, 50, 40),
    ].join(''),

    // 감자채볶음: 白磁の小鉢に、透き通るまで炒めたじゃがいもの千切り、にんじん、玉ねぎ、ごま
    kr_gamjachae: p => [
        K.kobachi(p, { glaze: '#8fa6c0', inside: '#f4f6f8' }),
        xkrMound(p, 62, '#e6d090'),
        xkrJulienne(p, 100, 100, 112, { n: 90, c: '#f2dc96', w: 3.2, L: 28, edge: '#c8a858', seed: 1, gloss: .7 }),
        xkrJulienne(p, 100, 100, 94, { n: 16, c: '#ec7a2a', w: 2.4, L: 22, seed: 2 }),
        ...xkrSpots('gjc', 4, 44, 20).map(([x, y, r]) => K.onion(p, x, y, 14, r, { c: '#f4e6c0', layers: 1 })),
        K.scallions(p, 100, 100, 80, { n: 8, c: '#4f9a34' }),
        xkrSesame(p, 100, 100, 52, 48, 26),
    ].join(''),

    // 도토리묵무침: 白い皿に、どんぐりのこんにゃく状の角切り、サニーレタス、きゅうり、にんじん、赤い醤油だれ、ごま
    kr_dotorimuk: p => {
        const R = rng(p.id + 'dm');
        return [
            xkrPlate(p, { rim: '#6a8a5a' }),
            xkrLettuce(p, 66, 72, 56, -20, { seed: 1 }), xkrLettuce(p, 136, 76, 52, 40, { seed: 2, c: '#7fb84a' }), xkrLettuce(p, 104, 136, 58, 10, { seed: 3 }),
            ...xkrSpots('dm', 12, 48, 21).map(([x, y, r]) => xkrMuk(p, x, y, 26, 16, r)),
            ...[[80, 100, 30], [124, 120, -40], [112, 76, 60]].map(([x, y, r]) => K.cucumberSlice(p, x, y, 14, r, { oval: 1.2 })),
            xkrJulienne(p, 100, 100, 80, { n: 12, c: '#ec7a2a', w: 2.2, L: 18, seed: 3 }),
            ...xkrSpots('dm', 12, 48, 21).slice(0, 8).map(([x, y]) => `<path ${T(x + 2, y)} d="${smooth(ring(5, 7, .4, R, 1.3, .8))}" fill="#9a3418" opacity=".7"/>`),
            K.scallions(p, 100, 100, 90, { n: 12, c: '#4f9a34' }),
            xkrFlakes(p, 100, 100, 50, 46, 30),
            xkrSesame(p, 100, 100, 54, 50, 28),
        ].join('');
    },
    // 순두부찌개: 土鍋に、ラー油の浮いた赤い汁、すくったおぼろ豆腐、あさり、生卵、ねぎ、青唐辛子
    kr_sundubujjigae: p => [
        xkrTtuk(p),
        xkrBroth(p, 78, '#c8361a', { oilC: '#ee6a2a', oilN: 14, edge: .5 }),
        xkrFlakes(p, 100, 100, 70, 70, 50, { c: '#9a1a08' }),
        `<g ${p.sh(.6)}>`,
        ...[[70, 76, 40], [130, 72, 38], [62, 124, 38], [136, 128, 40], [100, 142, 34], [100, 58, 32]].map(([x, y, s], i) => xkrZTofuChunk(p, x, y, s, i * 40, { seed: i, tint: '#e0603a' })),
        `</g>`,
        xkrZClam(p, 146, 98, 26, 30, { seed: 1 }), xkrZClam(p, 54, 98, 26, -20, { seed: 2, open: false }), xkrZClam(p, 118, 152, 24, 160, { seed: 3 }), xkrZClam(p, 78, 50, 24, 200, { seed: 4, open: false }),
        xkrZRawEgg(p, 100, 100, 44),
        K.scallions(p, 100, 100, 130, { n: 20, c: '#4f9a34' }),
        xkrChili(p, 82, 104, 8, 20), xkrChili(p, 122, 96, 8, -40), xkrChili(p, 112, 124, 7, 60, { c: '#c8281a' }),
        xkrBubbles([[56, 60, 2.4], [146, 52, 2], [44, 140, 2.2], [156, 150, 2]]),
    ].join(''),

    // 부대찌개: 浅い両手鍋に、ハム・ソーセージ・キムチ・豆腐・ベイクドビーンズ、真ん中にラーメンとスライスチーズ、ねぎ
    kr_budaejjigae: p => {
        const R = rng(p.id + 'bd');
        return [
            xkrWidePot(p),
            xkrBroth(p, 80, '#c84a2a', { oilC: '#ee7a3a', oilN: 10, edge: .4 }),
            `<g ${p.sh(.7)}>`,
            ...[[56, 68, 20], [76, 52, -10], [62, 88, 40], [46, 108, 0]].map(([x, y, r]) => xkrSpam(p, x, y, 18, r)),
            ...[[138, 56, 20], [156, 82, -30], [128, 72, 60], [148, 104, 10], [160, 126, 80]].map(([x, y, r]) => xkrFrank(p, x, y, 18, r)),
            ...[[60, 140, 30, 20], [84, 158, 28, -30], [52, 124, 26, 70]].map(([x, y, s, r], i) => xkrKimchi(p, x, y, s, r, { seed: i, deep: .6 })),
            xkrTofu(p, 136, 146, 24, 18, 20, { tint: '#e0603a' }), xkrTofu(p, 116, 160, 22, 16, -10, { tint: '#e0603a' }),
            ...Array.from({ length: 12 }, () => `<ellipse cx="${f(104 + (R() - .5) * 26)}" cy="${f(46 + (R() - .5) * 14)}" rx="2.4" ry="1.8" fill="#d0682a" stroke="#8a3a12" stroke-width=".4"/>`),
            xkrRamen(p, 100, 104, 70, 56),
            `</g>`,
            xkrCheeseSlice(p, 104, 100, 34, 12),
            K.scallions(p, 100, 100, 140, { n: 16, c: '#4f9a34' }),
            xkrNegi(p, 72, 108, 14, 20, { green: true }), xkrNegi(p, 140, 124, 14, -30), xkrNegi(p, 120, 60, 13, 60, { green: true }),
        ].join('');
    },

    // 콩나물국: 白い汁碗に、薄く澄んだ汁、たっぷりの大豆もやし、ねぎ、唐辛子
    kr_kongnamulguk: p => {
        const R = rng(p.id + 'kg');
        const stems = [], heads = [];
        for (const [x, y] of xkrSpots('kgk', 40, 62, 9.5)){ const [a, b] = xkrSoySprout(p, x, y, R() * 360, 30 + R() * 10, { bend: (R() - .5) * .5 }); stems.push(a); heads.push(b); }
        return [
            xkrSoupBowl(p),
            xkrBroth(p, 80, '#e6dcb8', { edge: .25 }),
            `<g opacity=".9">`, stems.join(''), heads.join(''), `</g>`,
            `<circle cx="100" cy="100" r="80" fill="#efe6c8" opacity=".12"/>`,
            K.scallions(p, 100, 100, 120, { n: 20, c: '#4f9a34' }),
            xkrChili(p, 84, 92, 8, 20, { c: '#c8281a' }), xkrChili(p, 120, 114, 8, -30), xkrChili(p, 110, 78, 7, 60, { c: '#c8281a' }),
            xkrShine(100, 100, 80, .45),
        ].join('');
    },

    // 소고기뭇국: 青い縁の白い碗に、牛肉のだしで薄く色づいた澄んだ汁、透き通った大根の色紙切り、牛肉、ねぎ
    kr_sogogimuguk: p => [
        K.bowl(p, { glaze: '#e4e8ee', inside: '#fbfbf8', lip: .9 }),
        `<circle cx="100" cy="100" r="88" fill="none" stroke="#3a5a8a" stroke-width="2"/>`,
        xkrBroth(p, 80, '#c89a5a', { edge: .3 }),
        ...xkrSpots('sgm', 16, 58, 18).map(([x, y, r], i) => xkrRadishSq(p, x, y, 22, r, { c: '#efe2c0', op: .85 })),
        `<g ${p.sh(.4)}>`, ...xkrSpots('sgb', 10, 54, 20).map(([x, y, r], i) => xkrBeef(p, x, y, 24, r, { seed: i, c: '#8a6450', fat: .4 })), `</g>`,
        `<circle cx="100" cy="100" r="80" fill="#c8a066" opacity=".12"/>`,
        xkrOil(p, 100, 100, 140, { n: 10, c: '#f1c04e', op: .5, rmax: 2 }),
        K.scallions(p, 100, 100, 120, { n: 16, c: '#4f9a34' }),
        xkrShine(100, 100, 80, .4),
    ].join(''),

    // 북엇국: 白い汁碗に、乳白色の汁、ふんわりした干しだらの裂き身、溶き卵、大根、ねぎ
    kr_bugeoguk: p => [
        xkrSoupBowl(p, { glaze: '#dde4dc' }),
        xkrBroth(p, 80, '#ece2c8', { cloud: 1, cloudC: '#ffffff', edge: .25 }),
        ...xkrSpots('bgr', 8, 56, 22).map(([x, y, r]) => xkrRadishSq(p, x, y, 20, r, { c: '#f2ecda', op: .8 })),
        xkrJulienne(p, 100, 100, 130, { n: 50, c: '#f6ead0', w: 4.2, L: 24, edge: '#d4c098', seed: 1 }),
        ...[[80, 84, 46, 20], [124, 112, 44, -30], [96, 132, 40, 10], [128, 72, 36, 60], [64, 118, 36, -50]].map(([x, y, L, r], i) => xkrZEgg(p, x, y, L, r, { seed: i })),
        K.scallions(p, 100, 100, 120, { n: 20, c: '#4f9a34' }),
        xkrShine(100, 100, 80, .4),
    ].join(''),

    // 계란국: 白い汁碗に、澄んだ薄い汁、ふわふわの溶き卵の帯、玉ねぎ、ねぎ
    kr_gyeranguk: p => [
        xkrSoupBowl(p),
        xkrBroth(p, 80, '#e8d8a4', { edge: .25 }),
        ...xkrSpots('gro', 6, 56, 24).map(([x, y, r]) => xkrZOnionStrip(p, x, y, 22, r)),
        ...[[78, 80, 54, 20], [124, 86, 50, -30], [96, 112, 56, 10], [134, 128, 44, 60], [66, 128, 46, -40], [104, 60, 40, 0], [100, 148, 40, 30]].map(([x, y, L, r], i) => xkrZEgg(p, x, y, L, r, { seed: i })),
        K.scallions(p, 100, 100, 124, { n: 24, c: '#4f9a34' }),
        xkrShine(100, 100, 80, .45),
    ].join(''),

    // 어묵탕: 両手鍋に、澄んだだし、串に波形に刺した練り物、大根、ねぎ、青唐辛子
    kr_eomuktang: p => [
        xkrPot(p),
        xkrBroth(p, 80, '#d8c294', { edge: .3 }),
        ...[[60, 70, 36], [140, 68, 34], [62, 134, 34], [140, 132, 36]].map(([x, y, s], i) => K.daikon(p, x, y, s, i * 30, { c: '#ece0c0' })),
        xkrEomukSkewer(p, 100, 74, 116, -14),
        xkrEomukSkewer(p, 100, 106, 116, 8, { c: '#d8a458' }),
        xkrEomukSkewer(p, 104, 138, 100, -4),
        xkrNegi(p, 72, 96, 15, 20, { green: true }), xkrNegi(p, 128, 120, 14, -30, { green: true }), xkrNegi(p, 120, 92, 14, 50), xkrNegi(p, 84, 154, 13, 0, { green: true }),
        xkrChili(p, 148, 100, 8, 20), xkrChili(p, 56, 104, 8, -30),
        xkrShine(100, 100, 80, .4),
    ].join(''),

    // 육개장: 土鍋に、赤い油の浮いた汁、裂いた牛肉、太ねぎ、わらび、もやし、溶き卵
    kr_yukgaejang: p => [
        xkrTtuk(p),
        xkrBroth(p, 78, '#b8361e', { oilC: '#e8582a', oilN: 16, edge: .5 }),
        xkrMungSprouts(p, 100, 100, 120, { n: 26, seed: 2, tint: '#f6e2c8' }),
        xkrBracken(p, 100, 100, 110, { n: 18, c: '#6a3e22', seed: 3 }),
        xkrJulienne(p, 100, 100, 112, { n: 34, c: '#6e3a20', w: 3.2, L: 22, edge: '#3a1a08', seed: 4 }),
        ...[[70, 80, 44, 30], [128, 76, 42, -40], [134, 126, 44, 70], [70, 128, 42, -20], [100, 104, 40, 10], [104, 58, 38, 90], [100, 148, 36, -70]].map(([x, y, L, r], i) => xkrDaepa(p, x, y, L, r, { green: i % 3 !== 1 })),
        xkrZEgg(p, 92, 92, 38, 20, { seed: 1, op: .85 }), xkrZEgg(p, 120, 110, 32, -40, { seed: 2, op: .85 }),
        `<circle cx="100" cy="100" r="78" fill="#c8401e" opacity=".12"/>`,
        xkrOil(p, 100, 100, 140, { n: 10, c: '#ee6a2a', op: .55, rmax: 2, seed: 5 }),
    ].join(''),

    // 삼계탕: 土鍋に、乳白色のスープ、もち米を詰めた丸鶏、なつめ、高麗人参、ねぎ
    kr_samgyetang: p => [
        xkrTtuk(p),
        xkrBroth(p, 78, '#efe6d2', { cloud: .8, cloudC: '#fff', edge: .25 }),
        xkrWholeChicken(p, 100, 102, 110, 0),
        xkrJujube(p, 52, 84, 14, 20), xkrJujube(p, 150, 118, 14, -30), xkrJujube(p, 140, 64, 12, 60),
        xkrGinseng(p, 62, 132, 44, -30),
        `<g ${p.sh(.4)}>`, ...[[150, 86], [56, 106], [140, 150], [124, 50]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.4" fill="#fbf8f0" stroke="#d8d0c0" stroke-width=".4"/>`), `</g>`,
        K.scallions(p, 100, 100, 150, { n: 20, c: '#4f9a34' }),
        xkrShine(100, 100, 78, .4),
    ].join(''),

    // 갈비탕: 真鍮の器に、澄んだ牛骨スープ、骨つきカルビ、大根、春雨、錦糸卵、ねぎ
    kr_galbitang: p => [
        xkrBrass(p),
        xkrBroth(p, 80, '#cfae78', { edge: .3 }),
        xkrNoodles(p, 100, 104, 120, { c: '#d8cfc0', w: 1.8, n: 18, seed: 5, outline: '#a8987e', hi: .6 }),
        ...[[60, 80, 30, 20], [140, 120, 30, -30], [110, 150, 28, 50]].map(([x, y, s, r]) => xkrRadishSq(p, x, y, s, r, { c: '#efe0bc', op: .85 })),
        ...[[100, 72, 50, -10], [70, 116, 48, 70], [130, 100, 48, 110], [104, 128, 44, 190]].map(([x, y, s, r], i) => xkrGalbi(p, x, y, s, r, { seed: i, c: '#8a5a3a', glossy: false })),
        `<circle cx="100" cy="100" r="80" fill="#d8b884" opacity=".12"/>`,
        xkrOil(p, 100, 100, 140, { n: 10, c: '#f1c04e', op: .5, rmax: 2 }),
        xkrJidan(p, 100, 100, 70, { n: 7 }),
        K.scallions(p, 100, 100, 124, { n: 22, c: '#4f9a34' }),
        xkrShine(100, 100, 80, .4),
    ].join(''),
    // 떡국: 藍釉の碗に、牛骨の乳白色の汁、斜め切りの餅、錦糸卵、牛肉、もみのり、ねぎ
    kr_tteokguk: p => {
        const R = rng(p.id + 'tg');
        return [
            K.bowl(p, { glaze: '#2c4c7c', inside: '#f8f6f0', lip: .9 }),
            xkrBroth(p, 80, '#ebe2ca', { cloud: 1, cloudC: '#fff', edge: .25 }),
            `<g ${p.sh(.4)}>`, ...xkrSpots('tg', 17, 60, 15).map(([x, y, r]) => xkrTteokSlice(p, x, y, 30 + R() * 4, r)), `</g>`,
            xkrMince(p, 100, 100, 70, { c: '#7a5a46', n: 26 }),
            ...[[82, 84, 40, 20], [122, 112, 36, -30], [96, 126, 34, 10]].map(([x, y, L, r], i) => xkrZEgg(p, x, y, L, r, { seed: i, op: .85 })),
            xkrJidan(p, 104, 96, 40, { n: 8 }),
            xkrGim(p, 100, 96, 46, { n: 14 }),
            K.scallions(p, 100, 100, 110, { n: 16, c: '#4f9a34' }),
            xkrShine(100, 100, 80, .4),
        ].join('');
    },

    // 만둣국: 青磁の碗に、澄んだ汁、ゆでた肉まんじゅう、溶き卵、のり、ねぎ
    kr_manduguk: p => [
        K.bowl(p, { glaze: '#9fbfae', inside: '#f2f4ee', lip: .9 }),
        xkrBroth(p, 80, '#dccba0', { edge: .3 }),
        ...[[66, 84, 40, 20], [128, 120, 40, -30], [104, 140, 36, 10], [70, 128, 32, 60]].map(([x, y, L, r], i) => xkrZEgg(p, x, y, L, r, { seed: i, op: .9 })),
        ...[[78, 70, -20], [126, 72, 20], [144, 108, 70], [100, 104, 0], [64, 112, -60], [104, 140, 170]].map(([x, y, r], i) => xkrMandu(p, x, y, 48, r)),
        xkrGim(p, 100, 100, 50, { n: 12 }),
        K.scallions(p, 100, 100, 120, { n: 18, c: '#4f9a34' }),
        xkrShine(100, 100, 80, .4),
    ].join(''),

    // 시금치된장국: 茶釉の碗に、にごった味噌色の汁、ほうれん草、さいの目の豆腐、ねぎ
    kr_sigeumchidoenjangguk: p => {
        const R = rng(p.id + 'sd');
        return [
            K.bowl(p, { glaze: '#7a5638', inside: '#efe6d6', lip: .9 }),
            xkrBroth(p, 80, '#a87a44', { cloud: 1.2, cloudC: '#d8b47a', edge: .4 }),
            ...xkrSpots('sd1', 12, 58, 16).map(([x, y, r], i) => xkrLeaf(p, x, y, 32 + R() * 8, r, i % 2 ? '#2f6a28' : '#3a7a2e')),
            ...xkrSpots('sd2', 6, 54, 18).map(([x, y, r]) => xkrStick(p, x, y, 24, 3.6, r, '#8cc05a', { gloss: .4 })),
            `<circle cx="100" cy="100" r="80" fill="#a87a44" opacity=".22"/>`,
            ...xkrSpots('sd3', 9, 52, 20).map(([x, y, r]) => xkrDice(p, x, y, 15, r, '#f6efdc')),
            K.scallions(p, 100, 100, 120, { n: 16, c: '#4f9a34' }),
            xkrShine(100, 100, 80, .35),
        ].join('');
    },

    // 동태찌개: 両手鍋に、赤い汁、すけとうだらの筒切り、大根、豆腐、春菊、ねぎ、青唐辛子
    kr_dongtaejjigae: p => [
        xkrPot(p),
        xkrBroth(p, 80, '#c4402a', { oilC: '#ee6a2a', oilN: 12, edge: .45 }),
        `<g ${p.sh(.6)}>`,
        ...[[58, 84, 30, 20], [142, 78, 30, -30], [84, 146, 28, 40]].map(([x, y, s, r]) => K.daikon(p, x, y, s, r, { c: '#eaa070', half: true })),
        xkrTofu(p, 140, 126, 26, 20, 20, { tint: '#e0603a' }), xkrTofu(p, 56, 120, 24, 18, -30, { tint: '#e0603a' }),
        `</g>`,
        ...[[84, 80, 48, 10], [128, 100, 48, -20], [94, 120, 46, 40], [118, 58, 40, 80], [62, 106, 38, 120], [140, 140, 38, 60]].map(([x, y, s, r], i) => xkrPollack(p, x, y, s, r, { seed: i, sauce: '#d0402a' })),
        xkrSsukgat(p, 110, 148, 46, -10), xkrSsukgat(p, 66, 64, 40, 40),
        xkrNegi(p, 70, 104, 14, 20, { green: true }), xkrNegi(p, 148, 104, 14, -30), xkrNegi(p, 120, 136, 13, 60, { green: true }),
        xkrChili(p, 100, 100, 8, 20), xkrChili(p, 140, 58, 8, -30), xkrChili(p, 56, 142, 7, 60, { c: '#c8281a' }),
        xkrBubbles([[46, 64, 2.2], [156, 146, 2], [40, 104, 2]]),
    ].join(''),

    // 고추장찌개: 土鍋に、とろりとした橙赤の汁、じゃがいも、ズッキーニ、豚肉、豆腐、玉ねぎ、ねぎ
    kr_gochujangjjigae: p => {
        const sp = xkrSpots('gcj', 20, 60, 16);
        return [
            xkrTtuk(p),
            xkrBroth(p, 78, '#c4502a', { oilC: '#e8702a', oilN: 8, edge: .5 }),
            `<g ${p.sh(.7)}>`,
            ...sp.map(([x, y, r], i) => i % 5 === 0 || i % 5 === 3 ? K.potato(p, x, y, 26, r, { c: '#eebc70', seed: i }) : i % 5 === 1 ? xkrZucchini(p, x, y, 22, r) : i % 5 === 2 ? K.porkSlice(p, x, y, 26, r, { c: '#c07050', fat: '#f0c8a8', seed: i, char: false }) : xkrTofu(p, x, y, 18, 18, r, { tint: '#e0603a' })),
            `</g>`,
            `<circle cx="100" cy="100" r="78" fill="#c4502a" opacity=".15"/>`,
            K.onion(p, 86, 104, 16, 30, { c: '#f0b088', layers: 1 }), K.onion(p, 124, 80, 16, -40, { c: '#f0b088', layers: 1 }),
            xkrNegi(p, 96, 90, 14, 20, { green: true }), xkrNegi(p, 120, 124, 14, -30, { green: true }), xkrNegi(p, 70, 128, 13, 60),
            xkrChili(p, 110, 108, 8, 20), xkrChili(p, 74, 84, 8, -30),
            xkrBubbles([[56, 56, 2.4], [148, 54, 2], [150, 148, 2.2]]),
        ].join('');
    },

    // 청국장찌개: 土鍋に、豆の粒が見える茶色く濃い汁、豆腐、キムチ、ズッキーニ、ねぎ、青唐辛子
    kr_cheonggukjangjjigae: p => {
        const R = rng(p.id + 'cg');
        return [
            xkrTtuk(p),
            xkrBroth(p, 78, '#8a6234', { cloud: 1.4, cloudC: '#c8a066', edge: .5 }),
            `<g ${p.sh(.4)}>`, ...xkrSpots('cgb', 34, 66, 7).map(([x, y, r]) => xkrSoybean(p, x, y, 8 + R() * 2, r)), `</g>`,
            `<g ${p.sh(.7)}>`,
            ...[[70, 80, 0], [128, 76, 20], [100, 108, -10], [140, 124, 10], [64, 124, 30]].map(([x, y, r]) => xkrTofu(p, x, y, 22, 22, r, { c: '#f2e8d2' })),
            ...[[100, 64, 26, 20], [96, 144, 26, -30], [140, 98, 22, 70]].map(([x, y, s, r], i) => xkrKimchi(p, x, y, s, r, { seed: i, deep: .7 })),
            xkrZucchini(p, 72, 102, 22, 40), xkrZucchini(p, 122, 146, 22, -20), xkrZucchini(p, 124, 54, 20, 160),
            `</g>`,
            `<circle cx="100" cy="100" r="78" fill="#8a6234" opacity=".16"/>`,
            K.scallions(p, 100, 100, 120, { n: 16, c: '#4f9a34' }),
            xkrChili(p, 84, 90, 8, 20), xkrChili(p, 118, 120, 8, -30), xkrChili(p, 112, 84, 7, 60, { c: '#c8281a' }),
            xkrBubbles([[54, 58, 2.4], [150, 56, 2], [148, 150, 2.2]], '#d8bc8a'),
        ].join('');
    },

    // 오징어뭇국: 白い汁碗に、粉唐辛子で赤く澄んだ汁、白くなったいか、大根、ねぎ、唐辛子
    kr_ojingeomuguk: p => [
        xkrSoupBowl(p),
        xkrBroth(p, 80, '#d0603a', { oilC: '#f08a3a', oilN: 12, edge: .35 }),
        ...xkrSpots('ojr', 12, 58, 18).map(([x, y, r]) => xkrRadishSq(p, x, y, 22, r, { c: '#f2c8a8', op: .9 })),
        ...[[80, 82, 34, 14, 20], [124, 92, 32, 14, -30], [100, 124, 34, 14, 60], [70, 118, 28, 12, -10], [130, 130, 28, 12, 40], [108, 60, 28, 12, 80]].map(([x, y, w, h, r], i) => xkrSquid(p, x, y, w, h, r, { seed: i, c: '#f8f0ea', sauce: '#e89070' })),
        xkrTentacles(p, 140, 66, 28, 30, { c: '#f0d2c4' }),
        K.scallions(p, 100, 100, 120, { n: 18, c: '#4f9a34' }),
        xkrChili(p, 92, 100, 8, 20, { c: '#c8281a' }), xkrChili(p, 114, 112, 8, -30),
        xkrShine(100, 100, 80, .4),
    ].join(''),

    // 감잣국: 白い汁碗に、澄んだ薄い汁、半月切りのじゃがいも、玉ねぎ、溶き卵、ねぎ
    kr_gamjaguk: p => [
        K.bowl(p, { glaze: '#d8c8b0', inside: '#fbf8f2', lip: .9 }),
        xkrBroth(p, 80, '#e2d4b0', { edge: .25 }),
        ...xkrSpots('gjo', 6, 54, 22).map(([x, y, r]) => xkrZOnionStrip(p, x, y, 24, r)),
        `<g ${p.sh(.5)}>`, ...xkrSpots('gjp', 16, 60, 17).map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-13,3 A13,12 0 0 1 13,3Z" fill="${p.g('#f2dc96', .3, .2)}" stroke="#c8a85a" stroke-width=".6"/><path d="M-9,1 A9,8 0 0 1 9,1" stroke="#fbf0c4" stroke-width="1.2" fill="none" opacity=".8"/></g>`), `</g>`,
        xkrZEgg(p, 86, 92, 40, 20, { seed: 1 }), xkrZEgg(p, 122, 120, 36, -30, { seed: 2 }),
        K.scallions(p, 100, 100, 124, { n: 22, c: '#4f9a34' }),
        xkrShine(100, 100, 80, .45),
    ].join(''),

    // 콩비지찌개: 土鍋に、すりつぶした大豆でもったりした淡い汁、キムチ、豚肉、ねぎ、青唐辛子
    kr_kongbijijjigae: p => {
        const R = rng(p.id + 'kb');
        let gr = '';
        for (let i = 0; i < 160; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 74; gr += `M${f1(100 + Math.cos(a) * d)},${f1(100 + Math.sin(a) * d)}h.1`; }
        return [
            xkrTtuk(p),
            `<g ${p.rough(5, .06)}>${xkrBroth(p, 78, '#e0cea0', { edge: .4 })}</g>`,
            `<g ${p.crumb(.6)}><circle cx="100" cy="100" r="76" fill="#e8d6a8" opacity=".6"/></g>`,
            `<path d="${gr}" stroke="#f6ead0" stroke-width="2.6" stroke-linecap="round"/><path d="${gr}" stroke="#c8ae78" stroke-width="1.4" stroke-linecap="round" transform="translate(.8 .8)" opacity=".6"/>`,
            `<g ${p.sh(.6)}>`,
            ...[[70, 80, 30, 20], [130, 76, 28, -30], [128, 128, 30, 60], [74, 128, 28, -10], [100, 100, 26, 100]].map(([x, y, s, r], i) => xkrKimchi(p, x, y, s, r, { seed: i, deep: .25 })),
            K.porkSlice(p, 102, 70, 24, 20, { c: '#c09070', fat: '#f4e0c8', seed: 1, char: false }), K.porkSlice(p, 96, 134, 22, -30, { c: '#c09070', fat: '#f4e0c8', seed: 2, char: false }),
            `</g>`,
            `<circle cx="100" cy="100" r="76" fill="#e8d6a8" opacity=".3"/>`,
            K.scallions(p, 100, 100, 110, { n: 18, c: '#4f9a34' }),
            xkrChili(p, 84, 100, 8, 20), xkrChili(p, 118, 108, 8, -30),
            xkrBubbles([[56, 60, 2.6], [148, 58, 2.2], [150, 146, 2.4], [54, 142, 2]], '#c8ae78'),
        ].join('');
    },

    // 오이냉국: 淡い青磁の碗に、冷たい澄んだ酢の汁、きゅうりの千切り、わかめ、赤玉ねぎ、赤唐辛子、氷、ごま
    kr_oinaengguk: p => [
        K.bowl(p, { glaze: '#cfe0e4', inside: '#f6fafa', lip: .9 }),
        xkrBroth(p, 80, '#eef0d8', { edge: .2 }),
        ...[[70, 80, 40, 20], [130, 118, 38, -30], [112, 72, 34, 60], [76, 128, 34, -50]].map(([x, y, s, r], i) => xkrMiyeok(p, x, y, s, r, { seed: i })),
        xkrJulienne(p, 100, 100, 118, { n: 44, c: '#cfe4a0', w: 3, L: 30, edge: '#3d7a2c', seed: 1, gloss: .6 }),
        xkrJulienne(p, 100, 100, 100, { n: 10, c: '#a04a8a', w: 2, L: 22, seed: 2, edge: '#6a2a5a' }),
        xkrJulienne(p, 100, 100, 90, { n: 8, c: '#d8301e', w: 1.8, L: 18, seed: 3 }),
        xkrIce(p, 82, 104, 22, 20), xkrIce(p, 124, 90, 20, -15), xkrIce(p, 104, 134, 18, 35),
        xkrSesame(p, 100, 100, 56, 54, 24),
        xkrShine(100, 100, 80, .5),
    ].join(''),
};

// 小数を1桁に丸めてファイルを軽くする
const xkrSlim = str => str.replace(/(\d+\.\d)\d+/g, '$1').replace(/(\d)\.0(?!\d)/g, '$1').replace(/(^|[^\d.])0\.(\d)/g, '$1.$2');
export default Object.fromEntries(Object.entries(DISHES).map(([id, fn]) => [id, p => xkrSlim(fn(p))]));
