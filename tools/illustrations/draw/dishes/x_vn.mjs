// ベトナムの家庭料理（手描き版 x_vn）: 世界版パック vn の主菜・副菜・汁物
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// 共通の部品（xvn_〜）: w_vn から写したもの
// =========================================================
function xvn_Sm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const xvn_Shine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function xvn_Outline(p, c, r = .55){
    const id = p.def('xvn_Ol' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// ご飯の山（米粒を2層）
function xvn_Rice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xvn_Rice' + seed + x + y);
    const shape = xvn_Sm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('xvn_RiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    const base = `<path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/>`;
    return `<g ${T(x, y)}><defs>${defs}</defs>${shadow ? `<g ${p.sh(.8 * shadow)}>${base}</g>` : base}${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// 小さな粒（ひき肉・ピーナッツ・揚げエシャロット・卵）。同じ色は1本のpath
function xvn_Grains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, w = null, h = null } = {}){
    const R = rng(p.id + 'xvn_Gr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        let gx, gy;
        if (w){ gx = x + (R() - .5) * w; gy = y + (R() - .5) * h; }
        else { const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; gx = x + Math.cos(a) * d; gy = y + Math.sin(a) * d * sy; }
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; });
        ds[k] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`).join('');
}
// 細切り（千切り）を色ごとにまとめて
function xvn_Shreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'xvn_Sh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? xvn_Outline(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// もやし
function xvn_Sprouts(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'xvn_Sp' + seed + x);
    let st = '', hd = '';
    for (let i = 0; i < n; i++){
        const r2 = Math.sqrt(R()) * s / 2 * .85, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * .9, a = R() * Math.PI, L = 9 + R() * 8, bd = (R() - .5) * 5;
        const x2 = cx + Math.cos(a) * L / 2, y2 = cy + Math.sin(a) * L / 2;
        st += `M${f1(cx - Math.cos(a) * L / 2)} ${f1(cy - Math.sin(a) * L / 2)}Q${f1(cx + bd)} ${f1(cy - bd)} ${f1(x2)} ${f1(y2)}`;
        hd += `M${f1(x2)} ${f1(y2)}l${f1(Math.cos(a) * 1.2)} ${f1(Math.sin(a) * 1.2)}`;
    }
    return `<g ${p.sh(.5)}><g ${xvn_Outline(p, '#cfc6a6', .45)} fill="none" stroke-linecap="round"><path d="${st}" stroke="#f8f5e8" stroke-width="2.2"/><path d="${hd}" stroke="#e6cf5e" stroke-width="2.8"/></g></g>`;
}
// 汁に浮いた油の粒
function xvn_Oil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'vnoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// ふんわり溶き卵
function xvn_EggCloud(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'vne' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${smooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// 具を散らす位置
function xvn_Spots(seed, n, rmax, minD, cx = 100, cy = 100){
    const R = rng('vnspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// 角切り（かぼちゃ・にんじん）
function xvn_Dice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 煮たトマト（くし形のかけら）
function xvn_Tomato(p, x, y, s, r = 0, { seed = 1, c = '#e2412c' } = {}){
    const R = rng(p.id + 'vntm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="${lt(c, .3)}" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 汁のつや
const xvn_SoupShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 小さな葉（ハーブ）
function xvn_Leaf(p, x, y, s, r = 0, { c = '#2f7a2a', narrow = 1, spot = false } = {}){
    return `<g ${T(x, y, r)}><g transform="scale(${f(s / 20)} ${f(s / 20 * narrow)})"><g ${p.sh(.5)}><path d="M-10,0 Q-4,-7.5 6,-4.5 Q10,-2 10,0 Q10,2 6,4.5 Q-4,7.5 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 9,0 M-3,0 L1,-4 M2,0 L5,-3 M-3,0 L1,4 M2,0 L5,3" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>
        ${spot ? `<ellipse cx="-1" cy="0" rx="2.4" ry="1.6" fill="#6a2a3a" opacity=".55"/>` : ''}
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g></g>`;
}
// パクチー（丸い切れ込みの小さな葉）
function xvn_Coriander(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}>${[[-5, -2, 5.5], [3, -4, 5], [4, 4, 5.2], [-4, 5, 4.6]].map(([a, b, rr], i) => `<path ${T(a, b, i * 50)} d="M-${rr},0 Q-${rr},-${rr} 0,-${rr} Q${rr * .4},-${rr * .7} ${rr * .5},-${rr * .3} Q${rr},-${rr * .4} ${rr},0 Q${rr},${rr} 0,${rr} Q-${rr},${rr} -${rr},0Z" fill="${p.g(i % 2 ? '#3f8f2f' : '#4c9c36', .3, .25)}" stroke="#2c6a20" stroke-width=".5"/>`).join('')}</g>
        <path d="M0,0 L-5,-2 M0,0 L3,-4 M0,0 L4,4 M0,0 L-4,5 M0,0 L2,11" stroke="#8cbf5c" stroke-width=".9" fill="none"/></g>`;
}
// ねぎのぶつ切り（4cm、緑の筒）
function xvn_Scallion(p, x, y, L, r = 0, { c = '#5aa33a', white = false } = {}){
    const col = white ? '#eef3df' : c, w = 4.2;
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g(col, .3, .2)}" stroke="${dk(col, .3)}" stroke-width=".5"/>
        <path d="M${f(-L / 2 + 2)},-.6 L${f(L / 2 - 2)},-.6" stroke="${lt(col, .45)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}
// 唐辛子の輪切り
function xvn_Chili(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="#d42a1c" stroke="#9a1a10" stroke-width=".5"/><circle r="${f(s * .3)}" fill="#f07a50"/><circle cx="${f(s * .08)}" cy="${f(-s * .05)}" r="${f(s * .08)}" fill="#f6dfa0"/><circle cx="${f(-s * .1)}" cy="${f(s * .06)}" r="${f(s * .07)}" fill="#f6dfa0"/></g>`;
}
// 黒こしょう
const xvn_Pepper = (p, x, y, s, n = 24) => K.sprinkle(p, x, y, s, { c: '#2a1c14', n, r: .75 });

// =========================================================
// ベトナムの器
// =========================================================
const XVN_BLUE = '#2d5aa0';
// 白い磁器の皿（バッチャン風: 藍の縁と筆の葉模様）
function xvn_Plate(p, { R = 94 } = {}){
    let m = '';
    for (let i = 0; i < 18; i++){
        const a = i / 18 * Math.PI * 2, x = 100 + Math.cos(a) * (R - 12), y = 100 + Math.sin(a) * (R - 12);
        m += `<path ${T(x, y, a * 57.3 + 90)} d="M-4,0 Q0,-2.6 4,0 Q0,2.6 -4,0Z" fill="${XVN_BLUE}" opacity=".55"/>`;
    }
    return K.plate(p, { R, rim: XVN_BLUE }) + m;
}
// 汁物の鉢（白に藍の線と模様）
function xvn_Bowl(p, { R = 92 } = {}){
    let m = '';
    for (let i = 0; i < 14; i++){
        const a = i / 14 * Math.PI * 2, x = 100 + Math.cos(a) * 86, y = 100 + Math.sin(a) * 86;
        m += `<path ${T(x, y, a * 57.3)} d="M-2.4,-2.4 Q0,0 2.4,-2.4 M-2.4,2.4 Q0,0 2.4,2.4" stroke="${XVN_BLUE}" stroke-width="1" fill="none" opacity=".7"/>`;
    }
    return K.bowl(p, { glaze: '#f6f4ee', inside: '#fbfaf6', R }) + `<circle cx="100" cy="100" r="${R - 1.6}" fill="none" stroke="${XVN_BLUE}" stroke-width="2"/><circle cx="100" cy="100" r="81.6" fill="none" stroke="${XVN_BLUE}" stroke-width="1.2" opacity=".85"/>` + m;
}
// 土鍋の器（tộ）: 素焼きの外側、厚い縁、こげ茶の釉薬の内側
function xvn_ClayPot(p){
    return `<g ${p.sh(2)}><circle cx="100" cy="100" r="94" fill="${p.rg('#9a5634', .22, .35, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="88" fill="none" stroke="#b9714a" stroke-width="5" opacity=".9"/>
        <circle cx="100" cy="100" r="85" fill="none" stroke="#6a341c" stroke-width="1.2" opacity=".8"/>
        <circle cx="100" cy="100" r="83" fill="${p.rg('#3c2216', .12, .3, .62, .64)}"/>
        <path d="M30,58 A86,86 0 0 1 64,22" stroke="#f3c9a8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// 小鉢（白・藍の線）
function xvn_SmallBowl(p, { R = 92 } = {}){
    return K.bowl(p, { glaze: '#f7f5ef', inside: '#fbfaf6', R }) + `<circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${XVN_BLUE}" stroke-width="3"/><circle cx="100" cy="100" r="${R * .87 + 2}" fill="none" stroke="${XVN_BLUE}" stroke-width="1" opacity=".8"/>`;
}

// =========================================================
// ベトナムの料理の部品
// =========================================================
// 豚ばらの角切りを煮たもの（断面: 皮・脂・赤身の層、飴色）
function xvn_PorkBelly(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'vnpb' + seed + x);
    const h = s / 2, j = () => (R() - .5) * s * .08;
    const pts = [[-h + j(), -h + j()], [h + j(), -h + j()], [h + j(), h + j()], [-h + j(), h + j()]];
    const shape = smooth(pts, true, .4);
    const id = p.uid();
    const bands = [['#6a2e0e', .13], ['#dca45e', .2], ['#9a4f22', .22], ['#d9a05a', .14], ['#8a4219', .31]];
    let yy = -h - 2, lay = '';
    for (const [c, t] of bands){ const bh = s * t + (R() - .5) * 2; lay += `<path d="M${-h - 3},${f(yy)} Q0,${f(yy + (R() - .5) * 5)} ${h + 3},${f(yy + (R() - .5) * 3)} L${h + 3},${f(yy + bh + 2)} L${-h - 3},${f(yy + bh + 2)}Z" fill="${p.g(c, .25, .25)}"/>`; yy += bh; }
    return `<g ${T(x, y, r)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
        <g ${p.sh(1)}><path d="${shape}" fill="#7a3a12"/></g>
        <g clip-path="url(#${id})">${lay}<path d="${shape}" fill="#b0601e" opacity=".22"/></g>
        <path d="${shape}" fill="none" stroke="#4a1e06" stroke-width=".9"/>
        ${xvn_Shine(`M${f(-h * .7)},${f(-h * .3)} Q0,${f(-h * .48)} ${f(h * .6)},${f(-h * .3)}`, 2, .75)}
        ${xvn_Shine(`M${f(-h * .6)},${f(h * .45)} Q${f(-h * .1)},${f(h * .35)} ${f(h * .3)},${f(h * .42)}`, 1.3, .45)}</g>`;
}
// 煮卵（丸ごと or 半分）。飴色に染まった白身
function xvn_BraisedEgg(p, x, y, s, r = 0, { half = false } = {}){
    const rx = s / 2, ry = s * .4;
    if (!half) return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${rx}" ry="${f(ry)}" fill="${p.g('#c07a32', .3, .3)}" stroke="#7a420f" stroke-width=".7"/></g>
        <ellipse cx="${f(-rx * .25)}" cy="${f(-ry * .3)}" rx="${f(rx * .42)}" ry="${f(ry * .26)}" fill="#f2c88a" opacity=".55"/>
        <ellipse cx="${f(-rx * .32)}" cy="${f(-ry * .4)}" rx="${f(rx * .2)}" ry="${f(ry * .1)}" fill="#fff" opacity=".85"/></g>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${rx}" ry="${f(ry)}" fill="${p.g('#b06a28', .2, .3)}" stroke="#7a420f" stroke-width=".7"/></g>
        <ellipse rx="${f(rx - 2.4)}" ry="${f(ry - 2.2)}" fill="${p.rg('#f3dcb0', .2, .12)}"/>
        <circle cx="${f(rx * .05)}" cy="${f(ry * .05)}" r="${f(ry * .52)}" fill="${p.rg('#f2a62a', .3, .22, .38, .35)}" stroke="#c97b14" stroke-width=".5"/>
        <ellipse cx="${f(-rx * .12)}" cy="${f(-ry * .14)}" rx="${f(ry * .18)}" ry="${f(ry * .1)}" fill="#fff" opacity=".7"/></g>`;
}
// 魚の筒切り（ナマズ・バサ）を上から: U字の身、皮の縁、中骨
function xvn_FishSteak(p, x, y, s, r = 0, { flesh = '#a8622a', skin = '#3e3530', seed = 1, braised = true } = {}){
    const R = rng(p.id + 'vnfs' + seed + x + y);
    const k = s / 40;
    // 背が上、腹が下。腹の真ん中は内臓を抜いたくぼみ
    const outer = [[0, -16], [9, -14.5], [16, -9], [19, 0], [17, 8], [11, 14], [4, 15], [1.5, 9], [-1.5, 9], [-4, 15], [-11, 14], [-17, 8], [-19, 0], [-16, -9], [-9, -14.5]].map(([a, b]) => [a + (R() - .5) * 1, b + (R() - .5) * 1]);
    const body = smooth(outer, true, .85);
    const inner = smooth(outer.map(([a, b]) => [a * .9, b * .9 - .3]), true, .85);
    const fl = braised ? flesh : '#f3ead9';
    const lines = [5.5, 10, 14.5].map(rr => `M${-rr},${f(-rr * .2)} Q${f(-rr * .55)},${f(-rr * .9)} 0,${f(-rr * .55 - 2)} Q${f(rr * .55)},${f(-rr * .9)} ${rr},${f(-rr * .2)}`).join(' ');
    const lower = `M-14,4 Q-9,6 -6,12 M14,4 Q9,6 6,12`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1)}><path d="${body}" fill="${p.g(skin, .2, .3)}" stroke="${dk(skin, .4)}" stroke-width=".7"/></g>
        <path d="${inner}" fill="${p.g(fl, .3, .28)}"/>
        <path d="${lines} ${lower}" stroke="${dk(fl, braised ? .35 : .15)}" stroke-width=".8" fill="none" opacity=".55"/>
        <path d="M-2.2,-1 Q0,-4 2.2,-1 Q0,1.5 -2.2,-1Z" fill="${braised ? lt(fl, .35) : '#e6dccb'}" stroke="${dk(fl, .3)}" stroke-width=".5"/>
        ${braised ? xvn_Shine('M-14,-5 Q-9,-12 0,-13', 2.4, .8) + xvn_Shine('M5,-12 Q11,-10 14,-5', 1.3, .55) : xvn_Shine('M-13,-5 Q-8,-11 0,-12', 1.4, .5)}</g>`;
}
// 鶏のぶつ切り（骨つき、飴色の照り）
function xvn_ChickenBit(p, x, y, s, r = 0, { c = '#b9702c', seed = 1, bone = false } = {}){
    const R = rng(p.id + 'vnck' + seed + x + y);
    const k = s / 20;
    const pts = [[-11, -3], [-7, -8], [0, -8.5], [7, -7], [11, -2], [10, 5], [4, 8], [-4, 8.5], [-10, 5]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]);
    const meat = lt(c, .28);
    // 皮の面（左上）と、身の断面（右下、筋が見える）
    const skinPts = [pts[0], pts[1], pts[2], pts[3], pts[4], [6, 1], [0, 2.5], [-6, 2]];
    return `<g ${T(x, y, r, k)}>${bone ? `<g ${p.sh(.5)}><path d="M7,1 L15,.5 Q18,-2 19.5,.8 Q20.5,3.4 17.5,4.4 L8,5Z" fill="${p.g('#efe0c2', .3, .2)}" stroke="#b49a72" stroke-width=".5"/></g>` : ''}
        <g ${p.sh(.8)}><path d="${smooth(pts, true, .75)}" fill="${p.g(meat, .2, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M-6,5 Q0,4 6,6 M-3,7.2 Q2,6 7,4" stroke="${dk(meat, .3)}" stroke-width=".6" fill="none" opacity=".6"/>
        <path d="${smooth(skinPts, true, .75)}" fill="${p.g(c, .32, .3)}"/>
        <path d="M-6,-4 Q-3,-2 0,-4.6 M2,-5 Q4,-2.6 7,-4" stroke="${dk(c, .35)}" stroke-width=".7" fill="none" opacity=".55"/>
        ${xvn_Shine('M-8,-3.5 Q-4,-7.6 3,-6.8', 2, .85)}<circle cx="6" cy="-3" r=".9" fill="#fff" opacity=".7"/></g>`;
}
// 揚げ豆腐の角切り（きつね色）
function xvn_FriedTofu(p, x, y, s, r = 0, { c = '#e3a64c', sauce = null } = {}){
    const R = rng(p.id + 'vntf' + x + y);
    const h = s / 2;
    let bl = '';
    for (let i = 0; i < 5; i++) bl += `<circle cx="${f(-h + 3 + R() * (s * .88 - 6))}" cy="${f(-h + 3 + R() * (s * .88 - 6))}" r="${f(.6 + R() * .8)}" fill="${dk(c, .2)}" opacity=".45"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .25)}"/></g>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.rg(c, .3, .2, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        ${bl}
        ${sauce ? `<path d="M${f(-h)},${f(h * .25)} Q${f(-h * .2)},${f(h * .02)} ${f(h * .72)},${f(h * .4)} L${f(h * .72)},${f(h * .72)} L${f(-h)},${f(h * .72)}Z" fill="${sauce}" opacity=".85"/>` : ''}
        ${xvn_Shine(`M${f(-h + 3)},${f(-h + 3.5)} Q${f(-h * .2)},${f(-h + 2)} ${f(h * .45)},${f(-h + 3.5)}`, 1.6, .75)}</g>`;
}
// 殻つきのえび（赤橙、節と尾、照り）
function xvn_Shrimp(p, x, y, s, r = 0, { c = '#e0592c', seed = 1 } = {}){
    const k = s / 30;
    // 体の中心線（頭→尾）に沿って、太さを変えた帯。節ごとに少し濃い帯を入れる
    const cl = [[-7, -6], [-1, -10], [6, -9], [10.5, -4], [11, 2.5], [7.5, 7.5], [2, 9.5], [-2.5, 8]];
    const wd = [7.6, 8, 7.8, 7.2, 6.4, 5.4, 4.4, 3.4];
    const o = [], n = [];
    cl.forEach(([a, b], i) => {
        const [pa, pb] = cl[Math.max(0, i - 1)], [na, nb] = cl[Math.min(cl.length - 1, i + 1)];
        let tx = na - pa, ty = nb - pb; const L = Math.hypot(tx, ty); tx /= L; ty /= L;
        const w = wd[i] / 2; o.push([a - ty * w, b + tx * w]); n.push([a + ty * w, b - tx * w]);
    });
    const body = smooth([...o, ...n.slice().reverse()], true, .7);
    const segs = [2, 3, 4, 5, 6].map(i => `M${f(o[i][0])},${f(o[i][1])} L${f(n[i][0])},${f(n[i][1])}`).join(' ');
    const [ta, tb] = cl[cl.length - 1];
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}>
        <path d="M${ta + 1},${tb - 1} L${ta - 6},${tb + 2} Q${ta - 5},${tb + 5} ${ta - 2},${tb + 5.5} L${ta - 1},${tb + 6.5} Q${ta + 2},${tb + 6} ${ta + 1.5},${tb + 2}Z" fill="${p.g(dk(c, .15), .25, .3)}" stroke="${dk(c, .45)}" stroke-width=".5"/>
        <path d="${body}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .45)}" stroke-width=".7"/>
        <path d="M-9.5,-3 Q-13,-8 -9,-11.5 Q-5,-13 -2.4,-10.5 L-3.6,-4Z" fill="${p.g(dk(c, .08), .3, .3)}" stroke="${dk(c, .45)}" stroke-width=".6"/>
        <path d="M-10,-10 Q-14,-12 -16,-15 M-8.6,-11.6 Q-11,-15 -11,-18" stroke="${dk(c, .3)}" stroke-width=".6" fill="none"/></g>
        <path d="${segs}" stroke="${dk(c, .35)}" stroke-width="1" fill="none" opacity=".6"/>
        <circle cx="-8.6" cy="-6.4" r="1" fill="#2a1a12"/>
        <path d="M-1,-8 Q4,-9 7.6,-6" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M9,-1 Q9.6,2 8.2,4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 空心菜（筒状の茎のぶつ切りと矢じり形の葉）
function xvn_WaterSpinach(p, x, y, s, { n = 30, seed = 1, cooked = true } = {}){
    const R = rng(p.id + 'vnws' + seed + x + y);
    const stemC = cooked ? '#7fae46' : '#9cc95c', leafC = cooked ? '#2f6e24' : '#3f8a2c';
    let stems = '', leaves = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .85, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .9, ang = R() * 180;
        if (R() < .55){
            const L = 20 + R() * 16;
            stems += `<g ${T(cx, cy, ang)}><rect x="${f(-L / 2)}" y="-2" width="${f(L)}" height="4" rx="2" fill="${p.g(R() < .5 ? stemC : lt(stemC, .12), .3, .2)}" stroke="${dk(stemC, .35)}" stroke-width=".5"/><path d="M${f(-L / 2 + 2)},-.8 L${f(L / 2 - 2)},-.8" stroke="${lt(stemC, .5)}" stroke-width=".8" stroke-linecap="round"/><ellipse cx="${f(L / 2 - 1)}" cy="0" rx="1" ry="1.7" fill="${lt(stemC, .55)}" stroke="${dk(stemC, .3)}" stroke-width=".4"/></g>`;
        } else {
            const k = .85 + R() * .35;
            leaves += `<g ${T(cx, cy, ang, k)}><path d="M-12,0 Q-8,-5.5 2,-5 Q5,-4.6 6,-2.6 Q9,-1.4 12,0 Q9,1.4 6,2.6 Q5,4.6 2,5 Q-8,5.5 -12,0Z" fill="${p.g(R() < .5 ? leafC : lt(leafC, .1), .3, .25)}" stroke="${dk(leafC, .35)}" stroke-width=".5"/><path d="M-11,0 L10,0" stroke="${lt(leafC, .35)}" stroke-width=".7"/></g>`;
        }
    }
    return `<g ${p.sh(.7)}>${leaves}${stems}</g>`;
}
// 丸いオムレツ（ねぎ入り、くし切り）
function xvn_Omelette(p, x, y, s, { cuts = 6, seed = 1 } = {}){
    const R = rng(p.id + 'vnom' + seed);
    const c = '#f3bf3a', pts = ring(s / 2, 16, .06, R);
    let brown = '', green = '';
    for (let i = 0; i < 12; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .42; brown += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(4 + R() * 8)}" ry="${f(2.5 + R() * 4)}" transform="rotate(${f(R() * 180)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="#d98a22" opacity="${f(.15 + R() * .2)}"/>`; }
    for (let i = 0; i < 34; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .44, gx = Math.cos(a) * d, gy = Math.sin(a) * d; green += `<path ${T(gx, gy, R() * 180)} d="M-2.6,-1 L2.6,-1 L2.6,1 L-2.6,1Z" fill="${R() < .5 ? '#3f8f2f' : '#6aae44'}"/>`; }
    const cutLines = Array.from({ length: cuts }, (_, i) => { const a = i / cuts * 6.28 + .3; return `M0,0 L${f(Math.cos(a) * s / 2)},${f(Math.sin(a) * s / 2)}`; }).join(' ');
    return `<g ${T(x, y)}><g ${p.sh(1.2)}><path d="${smooth(pts)}" fill="${p.rg(c, .3, .25, .38, .34)}" stroke="#c98a1c" stroke-width=".9"/></g>
        <path d="${smooth(pts)}" fill="none" stroke="#c97a1a" stroke-width="3" opacity=".35"/>
        ${brown}${green}
        <path d="${cutLines}" stroke="#b8761a" stroke-width="1.6" opacity=".7"/><path d="${cutLines}" stroke="#fde6a0" stroke-width=".6" opacity=".7" transform="translate(-.8 -.8)"/>
        ${xvn_Shine(`M${f(-s * .34)},${f(-s * .16)} Q${f(-s * .2)},${f(-s * .36)} ${f(s * .06)},${f(-s * .4)}`, 3, .55)}</g>`;
}
// 焼きなすを裂いたもの（細長い、やわらかい身）
function xvn_EggplantStrip(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'vnep' + seed + x + y);
    const top = Array.from({ length: 8 }, (_, i) => [-L / 2 + i * L / 7, -w / 2 * (i === 0 || i === 7 ? .35 : 1) + (R() - .5) * 3]);
    const bot = Array.from({ length: 8 }, (_, i) => [L / 2 - i * L / 7, w / 2 * (i === 0 || i === 7 ? .35 : 1) + (R() - .5) * 3]);
    const body = smooth([...top, ...bot], true, .8);
    let fib = '', dark = '';
    for (let i = 0; i < 6; i++){ const yy = (R() - .5) * w * .7; fib += `M${f(-L * .44)},${f(yy)} Q${f((R() - .5) * L * .3)},${f(yy + (R() - .5) * 4)} ${f(L * .44)},${f(yy + (R() - .5) * 3)}`; }
    for (let i = 0; i < 3; i++) dark += `<ellipse cx="${f((R() - .5) * L * .7)}" cy="${f((R() - .5) * w * .4)}" rx="${f(L * (.06 + R() * .08))}" ry="${f(w * .14)}" fill="#5e4a2a" opacity=".22"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${body}" fill="${p.g('#bca062', .3, .28)}" stroke="#7e6232" stroke-width=".5"/></g>
        ${dark}
        <path d="${fib}" stroke="#8e7038" stroke-width=".9" fill="none" opacity=".45"/>
        <path d="${fib}" stroke="#ead6a0" stroke-width=".8" fill="none" opacity=".55" transform="translate(-.8 -1.6)"/>
        ${xvn_Shine(`M${f(-L * .35)},${f(-w * .22)} Q0,${f(-w * .4)} ${f(L * .3)},${f(-w * .26)}`, 1.6, .55)}</g>`;
}
// パイナップルのいちょう切り
function xvn_Pineapple(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,6 L10,6 L2,-9 Q0,-10 -2,-9Z" fill="${p.g('#f6c936', .35, .2)}" stroke="#c7951a" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M-6,4 L-1,-6 M0,4 L0,-7 M6,4 L1,-6" stroke="#fbe58a" stroke-width=".9" opacity=".9"/>
        <path d="M-10,6 L10,6" stroke="#e0a91e" stroke-width="2" stroke-linecap="round"/></g>`;
}
// ザ・パクチーの細長い葉（ngò gai）
function xvn_Sawtooth(p, x, y, s, r = 0){
    const k = s / 30;
    const top = Array.from({ length: 8 }, (_, i) => [-14 + i * 4, -3.2 - (i % 2) * 1.2]), bot = Array.from({ length: 8 }, (_, i) => [14 - i * 4, 3.2 + (i % 2) * 1.2]);
    return `<g ${T(x, y, r, k)}><path d="M-15,0 ${top.map(([a, b]) => `L${a},${b}`).join(' ')} L15,0 ${bot.map(([a, b]) => `L${a},${b}`).join(' ')}Z" fill="${p.g('#3f8a2c', .3, .25)}" stroke="#2a5f1e" stroke-width=".5" stroke-linejoin="round"/><path d="M-14,0 L14,0" stroke="#8cc066" stroke-width=".8"/></g>`;
}
// 揚げにんにく・揚げエシャロット
const xvn_FriedGarlic = (p, x, y, s, n = 26, seed = 1) => xvn_Grains(p, x, y, s, { cols: ['#e4ad48', '#c98a2a', '#f2cc72'], n, size: 1.3, seed });
const xvn_FriedShallot = (p, x, y, s, n = 24, seed = 1) => xvn_Grains(p, x, y, s, { cols: ['#a8642a', '#8a4c1c', '#c4823c'], n, size: 1.5, seed });
const xvn_Peanuts = (p, x, y, s, n = 18, seed = 1) => xvn_Grains(p, x, y, s, { cols: ['#e2b878', '#c99556', '#f0d4a0'], n, size: 2.2, seed });
// 中国ソーセージの斜め切り（赤い身に白い脂の粒）
function xvn_LapXuong(p, x, y, s, r = 0){
    const R = rng(p.id + 'vnlx' + x + y);
    let dots = '';
    for (let i = 0; i < 6; i++) dots += `<circle cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .35)}" r="${f(.6 + R() * .7)}" fill="#f8e2d0"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .32)}" fill="#8a1f1a"/></g><ellipse rx="${f(s / 2 - 1)}" ry="${f(s * .32 - 1)}" fill="${p.g('#c43a2e', .25, .2)}"/>${dots}</g>`;
}
// 細く裂いた鶏肉
function xvn_ShreddedChicken(p, x, y, s, { n = 14, seed = 1 } = {}){
    const R = rng(p.id + 'vnsc' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .85, L = 12 + R() * 10, ang = R() * 180;
        out += `<g ${T(cx, cy, ang)}><path d="${smooth([[-L / 2, 0], [-L / 4, -2.2], [L / 4, -1.8], [L / 2, 0], [L / 4, 2], [-L / 4, 2.3]], true, .8)}" fill="${p.g(R() < .5 ? '#f1dfc0' : '#e8cfa6', .3, .2)}" stroke="#c4a172" stroke-width=".5"/><path d="M${f(-L / 3)},.3 L${f(L / 3)},-.2" stroke="#d4b68a" stroke-width=".5"/></g>`;
    }
    return `<g ${p.sh(.6)}>${out}</g>`;
}


// 千切りキャベツの山（軽量版: 色ごとに1本のpath）
function xvn_CabbageBed(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'vncbd' + seed);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(ring(s / 2, 10, .2, R, 1, .94))}" fill="${p.rg('#eef6dc', .3, .1)}"/></g>`
        + xvn_Shreds(p, x, y, s * .92, { c: '#cfe6a0', n: 70, w: 1.8, len: .16, seed: seed + 1, curve: .5 })
        + xvn_Shreds(p, x, y, s * .9, { c: '#f3f8e4', n: 60, w: 1.8, len: .16, seed: seed + 2, curve: .5 })
        + xvn_Shreds(p, x, y, s * .8, { c: '#a9cf6c', n: 24, w: 1.6, len: .14, seed: seed + 3, curve: .5 });
}
// ゆでたキャベツの葉（大きめのざく切り、白い太い葉脈、しんなり半透明）
function xvn_BoiledCabbage(p, x, y, s, r = 0, { seed = 1, c = '#c6dd96' } = {}){
    const R = rng(p.id + 'vncb' + seed + x + y);
    const k = s / 40;
    const pts = ring(19, 13, .22, R, 1.15, .82);
    const gid = p.def('vncbg' + c, id => `<radialGradient id="${id}" cx=".22" cy=".7" r=".95"><stop offset="0" stop-color="#f4f6e2"/><stop offset=".45" stop-color="${lt(c, .3)}"/><stop offset="1" stop-color="${dk(c, .08)}"/></radialGradient>`);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .8)}" fill="url(#${gid})" stroke="${dk(c, .18)}" stroke-width=".5"/></g>
        <path d="M-20,9 Q-4,3 17,-6 Q-2,1 -19,5Z" fill="#f6f7ea" stroke="#d8e0bc" stroke-width=".5"/>
        <path d="M-9,4.5 Q-11,-2 -16,-5 M-2,2 Q-2,-6 -6,-12 M5,-1 Q7,-8 6,-14 M11,-3.5 Q14,-7 16,-10 M-5,4 Q-2,10 2,13 M4,1 Q8,6 13,7" stroke="${lt(c, .55)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/>
        ${xvn_Shine('M-12,-6 Q-4,-13 7,-12', 1.4, .5)}</g>`;
}

// =========================================================
// この版で足した器と部品
// =========================================================
// 釉薬の縁の皿（バッチャン焼き風）: 外側に色釉、内側はクリーム
function xvn_GlazePlate(p, { R = 94, glaze = '#3f6f9a', inside = '#f8f3e6', well = .78 } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(glaze, .25, .25, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="${lt(glaze, .35)}" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="${R * well + 2}" fill="none" stroke="${dk(glaze, .25)}" stroke-width="1.6" opacity=".7"/>
        <circle cx="100" cy="100" r="${R * well}" fill="${p.rg(inside, .1, .1, .6, .62)}"/>
        <path d="M${100 - R * .74},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .22},${100 - R * .8}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// たれの小皿（ヌックマムなど）。x,y に置く
function xvn_DipBowl(p, x, y, R, c = '#c98a3a', { op = .9, chili = true, garlic = true, rim = XVN_BLUE } = {}){
    return `<g ${p.sh(1.1)}><circle cx="${x}" cy="${y}" r="${R}" fill="${p.rg('#f8f6f0', .2, .15, .38, .32)}"/></g>
        <circle cx="${x}" cy="${y}" r="${f(R - 1.6)}" fill="none" stroke="${rim}" stroke-width="1.5"/>
        <circle cx="${x}" cy="${y}" r="${f(R * .76)}" fill="${p.rg(c, .25, .2, .4, .38)}" opacity="${op}"/>
        ${garlic ? xvn_Grains(p, x, y, R * 1.1, { cols: ['#f3ead0', '#e6d8b0'], n: 9, size: 1.1, seed: 9 }) : ''}
        ${chili ? xvn_Chili(p, x - R * .25, y + R * .1, R * .26) + xvn_Chili(p, x + R * .3, y - R * .2, R * .22) : ''}
        ${xvn_Shine(`M${f(x - R * .5)},${f(y - R * .2)} Q${f(x - R * .3)},${f(y - R * .55)} ${f(x + R * .05)},${f(y - R * .58)}`, 1.4, .6)}`;
}
// 層になった切り身（ゆで豚・豚ばら）: bands は [色, 厚さの割合]
function xvn_Layered(p, x, y, w, h, r, bands, { seed = 1, edge = '#8a6a50', shine = .6, flat = false, shadow = true } = {}){
    const R = rng(p.id + 'xvlay' + seed + x + y);
    const hw = w / 2, hh = h / 2, j = () => (R() - .5) * 1.4;
    const pts = [[-hw, -hh + j()], [-hw * .3, -hh + j()], [hw * .3, -hh + j()], [hw, -hh + j()], [hw + j(), hh], [hw * .3, hh + j()], [-hw * .3, hh + j()], [-hw + j(), hh]];
    const shape = smooth(pts, true, .35), id = p.uid();
    let yy = -hh - 1, lay = '';
    for (const [c, t] of bands){ const bh = h * t; lay += `<path d="M${-hw - 2},${f(yy)} Q0,${f(yy + (R() - .5) * 3)} ${hw + 2},${f(yy + (R() - .5) * 2)} L${hw + 2},${f(yy + bh + 2)} L${-hw - 2},${f(yy + bh + 2)}Z" fill="${flat ? c : p.g(c, .2, .15)}"/>`; yy += bh; }
    return `<g ${T(x, y, r)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
        ${shadow ? `<g ${p.sh(.7)}><path d="${shape}" fill="${bands[bands.length - 1][0]}"/></g>` : ''}
        <g clip-path="url(#${id})">${lay}</g>
        <path d="${shape}" fill="none" stroke="${edge}" stroke-width=".6"/>
        ${xvn_Shine(`M${f(-hw * .7)},${f(-hh * .2)} Q0,${f(-hh * .45)} ${f(hw * .6)},${f(-hh * .25)}`, 1.2, shine)}</g>`;
}
// スペアリブのひと口（骨の断面つき・飴色の照り）
function xvn_Rib(p, x, y, s, r = 0, { c = '#8a4214', seed = 1 } = {}){
    const R = rng(p.id + 'xvrib' + seed + x + y), k = s / 30;
    const pts = [[-15, -5], [-8, -8], [2, -8.5], [11, -7], [15, -2], [14, 5], [6, 8], [-4, 8.5], [-13, 6], [-16, 1]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .32, .35)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        <path d="M-9,4 Q0,7 12,3" stroke="${dk(c, .35)}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".35"/>
        <ellipse cx="-12" cy="0" rx="3.2" ry="4.4" fill="${p.g('#f0e0c0', .3, .2)}" stroke="#a88a62" stroke-width=".6"/><ellipse cx="-12" cy=".3" rx="1.3" ry="2" fill="#c2946a"/>
        <path d="M-5,-3 Q2,-5 10,-2" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".45"/>
        ${xvn_Shine('M-6,-5.6 Q3,-8.4 11,-4.6', 2.4, .85)}<circle cx="7" cy="2" r="1.1" fill="#fff" opacity=".65"/></g>`;
}
// 手羽中・手羽元（揚げてからめた、つやのある皮）
function xvn_Wing(p, x, y, s, r = 0, { c = '#a8501a', seed = 1, drum = false } = {}){
    const R = rng(p.id + 'xvwg' + seed + x + y), k = s / 40;
    const pts = drum
        ? [[-20, -2.5], [-17, -4], [-10, -4.5], [-2, -7], [8, -10.5], [16, -9], [21, -3], [20, 4], [15, 9], [6, 8.5], [-2, 5.5], [-10, 4.5], [-17, 4], [-20, 2.5]]
        : [[-20, -4], [-17, -8.5], [-10, -7], [0, -7.5], [10, -8], [17, -9], [21, -3.5], [20, 4], [16, 8.5], [8, 7.5], [-2, 7], [-12, 7.5], [-18, 7.5], [-21, 2]];
    const P = pts.map(([a, b]) => [a + (R() - .5) * 1.2, b + (R() - .5) * 1.2]);
    const knob = drum ? `<ellipse cx="-19.5" cy="0" rx="2.4" ry="3.2" fill="${p.g('#f2e2c4', .3, .2)}" stroke="#a88a62" stroke-width=".5"/>` : `<ellipse cx="-19.5" cy="1" rx="2" ry="4" fill="${dk(c, .2)}" opacity=".6"/><ellipse cx="19.5" cy=".5" rx="2" ry="4" fill="${dk(c, .2)}" opacity=".6"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1)}><path d="${smooth(P, true, .85)}" fill="${p.g(c, .38, .4)}" stroke="${dk(c, .5)}" stroke-width=".9"/></g>
        ${knob}
        <path d="M-8,-2 Q-4,1 -6,4 M2,-3 Q5,0 3,4 M10,-3 Q12,0 11,3" stroke="${dk(c, .45)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".45"/>
        <path d="M-12,5 Q0,8 14,5" stroke="${dk(c, .4)}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".3"/>
        ${xvn_Shine(drum ? 'M-6,-4 Q4,-9 15,-7' : 'M-15,-5 Q-2,-7.5 15,-6', 2.6, .9)}<circle cx="${drum ? 12 : 8}" cy="2" r="1.3" fill="#fff" opacity=".7"/><circle cx="-6" cy="3" r=".9" fill="#fff" opacity=".5"/></g>`;
}
// 牛肉のさいころ（表面をしっかり焼いた）
function xvn_BeefCube(p, x, y, s, r = 0, { c = '#5a2a14', seed = 1 } = {}){
    const R = rng(p.id + 'xvbc' + seed + x + y), h = s / 2, j = () => (R() - .5) * s * .14;
    const pts = [[-h + j(), -h + j()], [h + j(), -h + j()], [h + j(), h + j()], [-h + j(), h + j()]];
    const shape = smooth(pts, true, .45);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${shape}" fill="${p.g(c, .28, .35)}" stroke="${dk(c, .5)}" stroke-width=".8"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62 - s * .06, b * .62 - s * .06]), true, .45)}" fill="${lt(c, .14)}" opacity=".7"/>
        <path d="M${f(-h * .5)},${f(h * .3)} l${f(s * .2)},${f(-s * .05)} M${f(h * .1)},${f(h * .5)} l${f(s * .2)},${f(-s * .08)}" stroke="${dk(c, .6)}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
        ${xvn_Shine(`M${f(-h * .6)},${f(-h * .55)} Q${f(-h * .1)},${f(-h * .8)} ${f(h * .5)},${f(-h * .6)}`, 1.6, .75)}</g>`;
}
// ラロット（ハイゴショウの葉）で巻いた焼き肉の棒
function xvn_BetelRoll(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xvbr' + seed + x + y), c = '#3c6526';
    let veins = '';
    for (let i = 0; i < 5; i++){ const xx = -L / 2 + 6 + i * (L - 12) / 4 + (R() - .5) * 2; veins += `M${f(xx)},${f(-w / 2 + 1)} Q${f(xx + 3)},0 ${f(xx + 1)},${f(w / 2 - 1)}`; }
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f(-L * .35 + R() * L * .7)}" cy="${f((R() - .5) * w * .5)}" rx="${f(2 + R() * 3)}" ry="${f(1.2 + R() * 1.5)}" fill="#1f2a12" opacity="${f(.35 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="${f(w / 2)}" fill="${p.g(c, .28, .35)}" stroke="${dk(c, .45)}" stroke-width=".7"/></g>
        <ellipse cx="${f(L / 2 - w * .28)}" cy="0" rx="${f(w * .26)}" ry="${f(w * .4)}" fill="${p.g('#7a4a2c', .2, .25)}" stroke="#4a2a14" stroke-width=".5"/>
        <path d="${veins}" stroke="${lt(c, .3)}" stroke-width=".7" fill="none" opacity=".75"/>${ch}
        ${xvn_Shine(`M${f(-L / 2 + 5)},${f(-w * .24)} L${f(L / 2 - 7)},${f(-w * .26)}`, 1.8, .75)}</g>`;
}
// いかの切り身（格子の切り込みで丸まる）
function xvn_SquidPiece(p, x, y, s, r = 0, { c = '#f5ece0', tint = null, seed = 1 } = {}){
    const R = rng(p.id + 'xvsq' + seed + x + y), k = s / 24;
    const col = tint ? mix(c, tint, .35) : c;
    const pts = [[-12, -6], [-4, -8.5], [6, -8], [12, -5], [11, 3], [12, 7], [3, 8], [-6, 7.5], [-12, 6], [-10, 0]].map(([a, b]) => [a + (R() - .5) * 1.6, b + (R() - .5) * 1.6]);
    const id = p.uid(), shape = smooth(pts, true, .8);
    let g = '';
    for (let i = -14; i <= 14; i += 4) g += `M${i},-10 l8,20 M${i + 6},-10 l-8,20 `;
    return `<g ${T(x, y, r, k)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs><g ${p.sh(.7)}><path d="${shape}" fill="${p.g(col, .3, .2)}" stroke="${dk(col, .25)}" stroke-width=".6"/></g>
        <path clip-path="url(#${id})" d="${g}" stroke="${dk(col, .2)}" stroke-width="1" fill="none" opacity=".55"/>
        <path d="M11,-5 Q14,1 11,7" stroke="${dk(col, .12)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>
        ${xvn_Shine('M-9,-5 Q-2,-7.5 6,-6.5', 1.4, .75)}</g>`;
}
// ディル（細い羽のような葉）
function xvn_Dill(p, x, y, s, r = 0, { c = '#4f8f2f' } = {}){
    const R = rng(p.id + 'xvdl' + x + y), k = s / 30;
    let d = 'M-14,0 Q0,-1.5 14,0';
    for (let i = 0; i < 6; i++){
        const bx = -11 + i * 4.4, side = i % 2 ? 1 : -1, ex = bx + 4 + R() * 3, ey = side * (5 + R() * 4);
        d += `M${f(bx)},${f(side * -.4)} Q${f(bx + 1)},${f(ey * .5)} ${f(ex)},${f(ey)}`;
        for (let j = 0; j < 3; j++){ const t = .35 + j * .25, px = bx + (ex - bx) * t, py = ey * t; d += `M${f(px)},${f(py)} l${f(2 + R() * 1.5)},${f(side * (1.6 + R()))}M${f(px)},${f(py)} l${f(-1 + R() * .8)},${f(side * (2.2 + R()))}`; }
    }
    return `<g ${T(x, y, r, k)}><path d="${d}" stroke="${dk(c, .25)}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".5" transform="translate(.4 .6)"/><path d="${d}" stroke="${c}" stroke-width="1.05" fill="none" stroke-linecap="round"/></g>`;
}
// レモングラスのみじん切り（揚げると金色）
const xvn_Lemongrass = (p, x, y, s, n = 40, seed = 1, fried = false) => xvn_Grains(p, x, y, s, { cols: fried ? ['#e2b54a', '#c9922a', '#f0d27a'] : ['#e8e0a0', '#cfd08a', '#f2ecc0'], n, size: 1.5, seed });
// レモングラスの斜め切り（筒の断面が輪）
function xvn_LemongrassStalk(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f(-L / 2)}" y="-3" width="${L}" height="6" rx="2.4" fill="${p.g('#d8dc96', .3, .2)}" stroke="#9aa45a" stroke-width=".6"/></g>
        <path d="M${f(-L / 2 + 2)},-1.2 L${f(L / 2 - 2)},-1.2 M${f(-L / 2 + 2)},1.4 L${f(L / 2 - 2)},1.4" stroke="#b6c070" stroke-width=".6"/><ellipse cx="${f(L / 2 - 1)}" cy="0" rx="1.6" ry="2.8" fill="#f0eccc" stroke="#a8b060" stroke-width=".5"/></g>`;
}
// ライムのくし切り・輪切り
function xvn_Lime(p, x, y, s, r = 0, { round = false } = {}){
    if (round) return `<g ${T(x, y, r)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="#4f9a2f"/></g><circle r="${f(s / 2 - 1.5)}" fill="#d8eaa0"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0,0 L${f(Math.cos(i * .785) * (s / 2 - 2.2))},${f(Math.sin(i * .785) * (s / 2 - 2.2))}" stroke="#f4f9e0" stroke-width=".8"/>`).join('')}<circle r="1" fill="#f4f9e0"/></g>`;
    return K.lemon(p, x, y, s, r, { c: '#b9dc6a', rind: '#4f9a2f' });
}
// ピーナッツ（赤い薄皮つき・皮がむけて白い所も）
function xvn_Peanut(p, x, y, s, r = 0, { skin = true, seed = 1 } = {}){
    const c = '#a8523a', R = rng(p.id + 'xvpn' + seed + x + y);
    const body = `M${f(-s / 2)},0 C${f(-s / 2)},${f(-s * .3)} ${f(s * .5)},${f(-s * .34)} ${f(s / 2)},0 C${f(s / 2)},${f(s * .3)} ${f(-s / 2)},${f(s * .32)} ${f(-s / 2)},0Z`;
    const peel = skin && R() < .7 ? `<path d="M${f(-s * .1 + (R() - .5) * s * .3)},${f(-s * .12)} q${f(s * .12)},${f(-s * .06)} ${f(s * .26)},${f(s * .02)} q${f(-s * .04)},${f(s * .16)} ${f(-s * .2)},${f(s * .2)} q${f(-s * .1)},${f(-s * .1)} ${f(-s * .06)},${f(-s * .22)}Z" fill="#f0d8a8" stroke="#c49a6a" stroke-width=".4"/>` : '';
    return `<g ${T(x, y, r)}><path d="${body}" fill="${skin ? p.g(c, .3, .3) : p.g('#ecc890', .3, .25)}" stroke="${skin ? '#5a2014' : '#b08850'}" stroke-width=".5"/>${peel}
        ${skin ? '' : `<path d="M${f(-s * .4)},${f(s * .02)} L${f(s * .4)},${f(-s * .02)}" stroke="#c49a60" stroke-width=".6"/>`}
        <ellipse cx="${f(s * .44)}" cy="0" rx="${f(s * .05)}" ry="${f(s * .08)}" fill="${skin ? '#d8b088' : '#c49a60'}"/><ellipse cx="${f(-s * .14)}" cy="${f(-s * .12)}" rx="${f(s * .16)}" ry="${f(s * .05)}" fill="#fff" opacity=".55"/></g>`;
}
// ふくろたけ（たまご形、上が灰茶）
function xvn_StrawMush(p, x, y, s, r = 0, { c = '#6a5a4a', stew = false } = {}){
    const cap = stew ? dk(c, .2) : c;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f(s / 2)}" ry="${f(s * .38)}" fill="${p.g(stew ? '#c9a070' : '#ece4d4', .3, .2)}" stroke="${stew ? '#7a5228' : '#b8aa90'}" stroke-width=".6"/></g>
        <path d="M${f(-s * .1)},${f(-s * .38)} Q${f(s * .5)},${f(-s * .32)} ${f(s * .48)},${f(s * .05)} Q${f(s * .3)},${f(s * .3)} ${f(s * .02)},${f(s * .3)} Q${f(-s * .1)},0 ${f(-s * .1)},${f(-s * .38)}Z" fill="${p.g(cap, .3, .2)}" opacity=".9"/>
        <ellipse cx="${f(-s * .18)}" cy="${f(-s * .15)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// きくらげ（黒いひらひら）
function xvn_WoodEar(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xvwe' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 9, .5, R, 1.2, .8))}" fill="${p.g('#3a2a24', .25, .2)}" stroke="#1e1410" stroke-width=".5"/><path d="M${f(-s * .3)},${f(-s * .05)} Q0,${f(-s * .2)} ${f(s * .3)},0" stroke="#6a544a" stroke-width=".8" fill="none" opacity=".8"/></g>`;
}
// 春雨・ビーフン（細い白・半透明の麺）
function xvn_Vermicelli(p, x, y, s, { c = '#f6f3ea', n = 60, seed = 1, sy = 1, w = 1.3, clear = false } = {}){
    const R = rng(p.id + 'xvvm' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.15 + R() * .8), a0 = R() * 6.28, sw = 1 + R() * 2;
        const cx = x + (R() - .5) * s * .15, cy = y + (R() - .5) * s * .15;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sw, rj = rr * (1 + (R() - .5) * .3); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        d += xvn_Sm(pts);
    }
    const id = p.uid();
    return `<g ${p.sh(.5)}><defs><path id="${id}" d="${d}"/></defs><use href="#${id}" stroke="${dk(c, clear ? .2 : .14)}" stroke-width="${f(w + .8)}" fill="none" stroke-linecap="round" opacity="${clear ? .5 : .8}"/><use href="#${id}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${clear ? .7 : 1}"/></g>`;
}
// 焼いた豚肉の薄切り（縁が焦げ、照りのある飴色）
function xvn_GrilledPork(p, x, y, s, r = 0, { seed = 1, c = '#bf6c2a' } = {}){
    const R = rng(p.id + 'xvgp' + seed + x + y), k = s / 40;
    const pts = ring(18, 12, .2, R, 1.15, .55);
    let ch = '';
    for (let i = 0; i < 5; i++) ch += `M${f(-15 + i * 7.5)},-8 l-3,16 `;
    const sh = smooth(pts, true, .9);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${sh}" fill="${p.g(c, .3, .35)}" stroke="#5a2408" stroke-width="2.2"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .8, b * .7]), true, .9)}" fill="${lt(c, .12)}" opacity=".6"/>
        <path d="${ch}" stroke="#4a1c06" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>
        ${xvn_Shine('M-12,-3.5 Q0,-7 12,-4.5', 1.8, .75)}</g>`;
}
// 揚げ春巻き（きつね色で泡のような表面）
function xvn_FriedRoll(p, x, y, L, w, r = 0, { seed = 1, cut = false } = {}){
    const R = rng(p.id + 'xvfr' + seed + x + y), c = '#dc962c';
    let bl = '';
    for (let i = 0; i < 14; i++) bl += `<circle cx="${f(-L * .42 + R() * L * .84)}" cy="${f((R() - .5) * w * .7)}" r="${f(.8 + R() * 1.4)}" fill="${R() < .5 ? lt(c, .35) : dk(c, .25)}" opacity=".8"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="${f(w * .45)}" fill="${p.g(c, .38, .4)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        ${bl}
        ${cut ? `<ellipse cx="${f(L / 2 - 2)}" cy="0" rx="${f(w * .22)}" ry="${f(w * .42)}" fill="${dk(c, .3)}"/><ellipse cx="${f(L / 2 - 2)}" cy="0" rx="${f(w * .16)}" ry="${f(w * .34)}" fill="#a87a5a"/>${xvn_Grains(p, L / 2 - 2, 0, w * .5, { cols: ['#3a2a24', '#ef8034', '#f1e6d0'], n: 6, size: .8, seed: 3 })}` : ''}
        ${xvn_Shine(`M${f(-L / 2 + 4)},${f(-w * .26)} L${f(L / 2 - 6)},${f(-w * .28)}`, 1.6, .7)}</g>`;
}
// 生春巻き（透けたライスペーパー越しにえび・にら・葉が見える）
function xvn_FreshRoll(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xvfw' + seed + x + y);
    let inside = `<rect x="${f(-L / 2 + 3)}" y="${f(-w * .1)}" width="${L - 6}" height="${f(w * .38)}" rx="${f(w * .18)}" fill="#f2efe4" opacity=".85"/>`;
    inside += `<rect x="${f(-L / 2 + 2)}" y="${f(-w * .42)}" width="${L - 4}" height="${f(w * .3)}" rx="${f(w * .15)}" fill="#7ab84c" opacity=".75"/>`;
    for (let i = 0; i < 3; i++){ const sx = -L / 2 + L * (.2 + i * .3); inside += `<g ${T(sx, -w * .05, 0, w / 34)}><path d="M-11,-2 C-11,-8 -4,-10 1,-9 C8,-8 11,-4 11,0 L-11,0Z" fill="#f08a62" opacity=".9"/><path d="M-8,-1 Q-6,-6 -3,-8 M-2,-1 Q-1,-6 1,-8.5 M4,-1 Q4,-6 6,-7.5" stroke="#fde0d0" stroke-width="1.6" fill="none"/></g>`; }
    inside += `<path d="M${f(-L / 2 + 2)},${f(w * .32)} L${f(L / 2 - 2)},${f(w * .3)}" stroke="#2f7a2a" stroke-width="1.6" opacity=".6"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="${f(w * .45)}" fill="#f4f0e6" stroke="#cfc6b0" stroke-width=".7"/></g>
        ${inside}
        <rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="${f(w * .45)}" fill="#fbf8f0" opacity=".32"/>
        <path d="M${f(-L / 2 + 6)},${f(w * .1)} q4,-${f(w * .2)} 8,0 M${f(L * .1)},${f(-w * .2)} q4,${f(w * .2)} 8,0" stroke="#d8d0bc" stroke-width=".6" fill="none" opacity=".7"/>
        ${xvn_Shine(`M${f(-L / 2 + 5)},${f(-w * .32)} L${f(L / 2 - 7)},${f(-w * .34)}`, 2, .85)}</g>`;
}
// チンゲン菜（半割りの株: 白い軸と緑の葉）
function xvn_BokChoy(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xvbk' + seed + x + y), k = L / 60;
    const leaf = smooth([[-2, 0], [6, -11], [18, -15], [30, -13], [30, 0], [30, 13], [18, 15], [6, 11]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]), true, .9);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${leaf}" fill="${p.g('#3f7f2a', .25, .3)}" stroke="#244e18" stroke-width=".6"/>
        <path d="M-30,-6 Q-12,-9 4,-7 L8,0 L4,7 Q-12,9 -30,6 Q-32,0 -30,-6Z" fill="${p.g('#e6efc8', .3, .2)}" stroke="#a6b880" stroke-width=".6"/></g>
        <path d="M-28,-2 Q-10,-3 6,-2 M-28,2.6 Q-10,3.4 6,2" stroke="#c5d6a0" stroke-width=".8" fill="none"/>
        <path d="M6,0 L28,0 M12,0 L18,-9 M14,0 L20,9 M20,0 L26,-8 M21,0 L26,8" stroke="#79b056" stroke-width=".9" fill="none"/>
        ${xvn_Shine('M-26,-5 Q-12,-7 2,-5.5', 1.4, .7)}${xvn_Shine('M10,-8 Q18,-12 26,-10', 1.2, .5)}</g>`;
}
// ゴーヤの薄切り（半月、白いわたを抜いた）
function xvn_Goya(p, x, y, s, r = 0, { c = '#5aa13c', cooked = false } = {}){
    const col = cooked ? mix(c, '#8aa848', .3) : c;
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,2 A10,9 0 0 1 10,2 L6,2 A6,5 0 0 0 -6,2Z" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .35)}" stroke-width=".6"/>
        <path d="M-6,2 A6,5 0 0 1 6,2" fill="none" stroke="#e6f0c8" stroke-width="1.6"/>
        ${[-8, -4.5, 0, 4.5, 8].map(a => `<circle cx="${a}" cy="${f(-Math.sqrt(Math.max(0, 81 - a * a)) * .86 + 2.8)}" r="1" fill="${lt(col, .35)}"/>`).join('')}</g>`;
}
// ハヤトウリ（千切りの棒）
function xvn_Batons(p, x, y, s, { c = '#cfe2a0', n = 30, w = 4, len = 18, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xvbt' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, L = len * (.7 + R() * .5), ang = R() * 180;
        const col = R() < .35 ? lt(c, .15) : R() < .5 ? dk(c, .06) : c;
        out += `<g ${T(cx, cy, ang)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${w}" rx="${f(w * .3)}" fill="${col}" stroke="${dk(c, .3)}" stroke-width=".5"/><path d="M${f(-L / 2 + 1.5)},${f(-w * .2)} L${f(L / 2 - 1.5)},${f(-w * .2)}" stroke="#fff" stroke-width=".7" opacity=".55"/></g>`;
    }
    return `<g ${p.sh(.5)}>${out}</g>`;
}
// 漬けた青菜（黄緑のくたっとした葉と軸）
function xvn_PickledGreen(p, x, y, s, r = 0, { seed = 1, c = '#b4b04a' } = {}){
    const R = rng(p.id + 'xvpg' + seed + x + y), k = s / 30;
    const pts = ring(14, 10, .35, R, 1.1, .7);
    return `<g ${T(x, y, r, k)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".6" opacity=".95"/>
        <path d="M-15,1 Q0,-2 15,1 L14,4 Q0,2 -15,5Z" fill="${p.g('#e8e0a6', .3, .15)}" stroke="${dk('#e8e0a6', .25)}" stroke-width=".5"/>
        <path d="M-8,-1 L-11,-6 M-1,-1 L-3,-8 M6,-1 L5,-7" stroke="${lt(c, .4)}" stroke-width=".9" fill="none"/>
        ${xvn_Shine('M-10,-5 Q-2,-9 7,-7', 1.2, .55)}</g>`;
}
// 青菜の葉（ちぢれた大きい葉: からし菜・つるむらさき・春菊など）
function xvn_SoupLeaf(p, x, y, s, r = 0, { c = '#3a7d2a', seed = 1, shape = 'oval', stem = null } = {}){
    const R = rng(p.id + 'xvsl' + seed + x + y), k = s / 30;
    let pts;
    if (shape === 'serrate') pts = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.28, rr = (i % 2 ? 10.6 : 13) * (1 + (R() - .5) * .2); return [Math.cos(a) * rr * 1.25, Math.sin(a) * rr * .6]; });
    else if (shape === 'round') pts = ring(12, 10, .14, R, 1.05, .9);
    else pts = ring(13, 10, .2, R, 1.25, .6);
    return `<g ${T(x, y, r, k)}>${stem ? `<rect x="-2" y="-2.2" width="${stem}" height="4.4" rx="2.2" fill="${p.g('#a8cc78', .3, .2)}" stroke="#6e9a46" stroke-width=".5"/>` : ''}
        <path d="${smooth(pts, true, shape === 'serrate' ? .75 : .9)}" fill="${p.g(c, .28, .25)}" stroke="${dk(c, .32)}" stroke-width=".6"/>
        <path d="M-12,0 Q0,-1 13,0 M-4,0 L-7,-5 M2,0 L0,-6 M-4,0 L-7,5 M2,0 L0,6 M7,0 L6,-4 M7,0 L6,4" stroke="${lt(c, .35)}" stroke-width=".8" fill="none" opacity=".85"/>
        ${xvn_Shine('M-9,-4 Q-2,-7 6,-5', 1.1, .45)}</g>`;
}
// 豚足のぶつ切り（皮のついた輪、真ん中に骨）
function xvn_Hock(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xvhk' + seed + x + y), k = s / 30;
    const pts = ring(14, 11, .18, R, 1.1, .9);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .9)}" fill="${p.g('#efd9b0', .3, .25)}" stroke="#b08a5a" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .72, b * .72]), true, .9)}" fill="${p.g('#d9b08a', .2, .2)}"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .5 + 1, b * .5 + 1]), true, .9)}" fill="${p.g('#c08a64', .2, .25)}"/>
        <ellipse cx="2" cy="1.5" rx="3.2" ry="2.6" fill="#f4ead6" stroke="#b8a07a" stroke-width=".5"/><ellipse cx="2" cy="1.5" rx="1.3" ry="1" fill="#c9a07a"/>
        ${xvn_Shine('M-10,-6 Q-3,-11 6,-10', 1.8, .7)}</g>`;
}
// アルミの両手鍋（上から）
function xvn_MetalPot(p, { R = 88 } = {}){
    return `<g ${p.sh(1.8)}><rect x="${100 - R - 10}" y="94" width="${2 * R + 20}" height="12" rx="6" fill="${p.g('#9aa0a6', .3, .3)}" stroke="#6a7076" stroke-width=".8"/>
        <circle cx="100" cy="100" r="${R}" fill="${p.rg('#c4c9ce', .3, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="#eef1f4" stroke-width="2" opacity=".8"/>
        <circle cx="100" cy="100" r="${R - 6}" fill="${p.rg('#8e959c', .2, .3, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .42} A${R * .84},${R * .84} 0 0 1 ${100 - R * .22},${100 - R * .8}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// なすの細長い乱切り（皮の紫と、炒めてやわらかい身）
const xvn_EggplantBar = (p, x, y, L, w, r, seed = 1) => xvn_Layered(p, x, y, L, w, r, [['#3e1e4a', .3], ['#7a5a3a', .08], ['#c9a464', .62]], { seed, edge: '#2b1433', shine: .75, flat: true, shadow: false });
// 黄色い卵麺（焼きそば状）
const xvn_EggNoodles = (p, x, y, s, seed = 1, n = 40) => xvn_Vermicelli(p, x, y, s, { c: '#ecc058', n, seed, w: 2.6, sy: .92 }) + xvn_Vermicelli(p, x, y, s * .9, { c: '#f6d886', n: Math.round(n / 3), seed: seed + 5, w: 2.4, sy: .92 });
// オクラ（丸ごとゆでた: 先の細いさや、稜線、がく）
function xvn_OkraPod(p, x, y, L, r = 0){
    const w = L * .24, c = '#4f9a34';
    const body = `M${f(-L / 2)},0 Q${f(-L * .2)},${f(-w * .62)} ${f(L * .3)},${f(-w / 2)} Q${f(L * .38)},${f(-w * .5)} ${f(L * .38)},0 Q${f(L * .38)},${f(w * .5)} ${f(L * .3)},${f(w / 2)} Q${f(-L * .2)},${f(w * .62)} ${f(-L / 2)},0Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${body}" fill="${p.g(c, .3, .3)}" stroke="#2c6a1e" stroke-width=".6"/></g>
        <path d="M${f(-L * .46)},0 Q${f(-L * .1)},${f(-w * .26)} ${f(L * .36)},${f(-w * .22)} M${f(-L * .46)},0 Q${f(-L * .1)},${f(w * .26)} ${f(L * .36)},${f(w * .22)} M${f(-L * .46)},0 L${f(L * .36)},0" stroke="#2f6e22" stroke-width=".8" fill="none" opacity=".55"/>
        <path d="M${f(-L * .44)},${f(-w * .1)} Q${f(-L * .1)},${f(-w * .4)} ${f(L * .34)},${f(-w * .34)}" stroke="#8cc860" stroke-width="1" fill="none" opacity=".7"/>
        <path d="M${f(L * .36)},${f(-w * .48)} L${f(L * .46)},${f(-w * .2)} L${f(L / 2 + 3)},0 L${f(L * .46)},${f(w * .2)} L${f(L * .36)},${f(w * .48)} Q${f(L * .3)},0 ${f(L * .36)},${f(-w * .48)}Z" fill="${p.g('#8aab52', .3, .2)}" stroke="#4a6a2a" stroke-width=".5"/>
        ${xvn_Shine(`M${f(-L * .3)},${f(-w * .22)} Q0,${f(-w * .42)} ${f(L * .24)},${f(-w * .36)}`, 1.4, .7)}</g>`;
}
// 大根の煮たいちょう・半月（飴色、半透明）
function xvn_DaikonPiece(p, x, y, s, r = 0, { c = '#d9a65e', seed = 1 } = {}){
    const R = rng(p.id + 'xvdk' + seed + x + y), h = s / 2, j = () => (R() - .5) * s * .1;
    const pts = [[-h + j(), -h * .55 + j()], [h + j(), -h * .55 + j()], [h + j(), h * .55 + j()], [-h + j(), h * .55 + j()]];
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .35)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .7, b * .6]), true, .35)}" fill="${lt(c, .25)}" opacity=".55"/>
        ${xvn_Shine(`M${f(-h * .7)},${f(-h * .3)} L${f(h * .5)},${f(-h * .32)}`, 1.4, .7)}</g>`;
}
// えびの干したもの（小さく赤い）
const xvn_DriedShrimp = (p, x, y, s, n = 14, seed = 1) => xvn_Grains(p, x, y, s, { cols: ['#e8603a', '#d04a2a', '#f08a5a'], n, size: 2.2, seed });
// 炒め物の下地の山（皿の白が透けないように）
function xvn_Mound(p, x, y, s, c, { seed = 1, sy = .95, op = 1 } = {}){
    const Rr = rng(p.id + 'xvmd' + seed);
    return `<g ${p.sh(.8)}><path ${T(x, y)} d="${smooth(ring(s / 2, 12, .16, Rr, 1, sy))}" fill="${p.rg(c, .2, .2, .4, .38)}" opacity="${op}"/></g>`;
}
// いんげんの斜め切り（太め）
function xvn_Bean(p, x, y, L, r = 0, { c = '#4f9a34' } = {}){
    return `<g ${T(x, y, r)}><path d="M${f(-L / 2)},-2.8 L${f(L / 2 - 2)},-2.8 L${f(L / 2 + 1)},2.8 L${f(-L / 2 + 3)},2.8Z" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".6" stroke-linejoin="round"/><path d="M${f(-L / 2 + 2)},-1.2 L${f(L / 2 - 3)},-1.2" stroke="${lt(c, .4)}" stroke-width="1" stroke-linecap="round"/><path d="M${f(-L / 2 + 3)},1.6 L${f(L / 2 - 2)},1.6" stroke="${dk(c, .2)}" stroke-width=".8" opacity=".6"/></g>`;
}
// 小なす（cà pháo）の漬けもの: 丸く、うす黄緑、がくつき
function xvn_CaPhao(p, x, y, s, r = 0, { half = false } = {}){
    const c = '#e6e2a8';
    if (half) return `<g ${T(x, y, r)}><g ${p.sh(.6)}><circle r="${s / 2}" fill="${p.rg('#ecebc0', .25, .2, .38, .34)}" stroke="#a8a466" stroke-width=".6"/></g>${xvn_Grains(p, 0, 0, s * .7, { cols: ['#c9b878', '#b8a868'], n: 14, size: .9, seed: 3 })}<circle r="${f(s * .44)}" fill="none" stroke="#f6f4dc" stroke-width="1" opacity=".8"/></g>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><circle r="${s / 2}" fill="${p.rg(c, .3, .22, .38, .34)}" stroke="#9a9a5a" stroke-width=".6"/></g>
        <path d="M${f(-s * .3)},${f(-s * .1)} Q0,${f(-s * .02)} ${f(s * .32)},${f(-s * .14)} M${f(-s * .28)},${f(s * .14)} Q0,${f(s * .2)} ${f(s * .3)},${f(s * .1)}" stroke="#c9c68a" stroke-width=".8" fill="none" opacity=".7"/>
        <path d="${smooth(Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.28, rr = i % 2 ? s * .1 : s * .22; return [Math.cos(a) * rr + s * .12, Math.sin(a) * rr - s * .14]; }), true, .4)}" fill="${p.g('#5a8a34', .3, .2)}" stroke="#3a6a22" stroke-width=".5"/>
        <ellipse cx="${f(-s * .18)}" cy="${f(-s * .2)}" rx="${f(s * .12)}" ry="${f(s * .07)}" fill="#fff" opacity=".7"/></g>`;
}
// えびせん（ふくらんだ白い円盤、うす桃）
function xvn_Cracker(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xvck' + seed + x + y);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(ring(s / 2, 11, .14, R, 1.1, .9))}" fill="${p.rg('#f8ece4', .3, .15, .38, .34)}" stroke="#e0c8bc" stroke-width=".6"/></g>
        ${xvn_Grains(p, 0, 0, s * .8, { cols: ['#f2d8cc', '#fff8f2'], n: 10, size: 1.6, seed: seed + 2 })}</g>`;
}
// 皮つきの角切りの瓜（へちま・冬瓜）: 半透明の身と緑の皮の縁
function xvn_MelonChunk(p, x, y, s, r = 0, { flesh = '#dfeab8', skin = '#4f8a34', seed = 1 } = {}){
    const R = rng(p.id + 'xvmc' + seed + x + y), h = s / 2, j = () => (R() - .5) * s * .12;
    const pts = [[-h + j(), -h * .7 + j()], [h + j(), -h * .7 + j()], [h * .9 + j(), h * .7 + j()], [-h * .9 + j(), h * .7 + j()]];
    const sh = smooth(pts, true, .4);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${sh}" fill="${p.g(flesh, .3, .2)}" stroke="${dk(flesh, .25)}" stroke-width=".6" opacity=".95"/></g>
        <path d="M${f(pts[3][0])},${f(pts[3][1])} Q0,${f(h * .9)} ${f(pts[2][0])},${f(pts[2][1])}" stroke="${skin}" stroke-width="${f(s * .14)}" fill="none" stroke-linecap="round"/>
        <ellipse cx="0" cy="${f(-h * .05)}" rx="${f(h * .5)}" ry="${f(h * .28)}" fill="${lt(flesh, .4)}" opacity=".55"/>
        ${xvn_Shine(`M${f(-h * .6)},${f(-h * .38)} L${f(h * .4)},${f(-h * .42)}`, 1.2, .7)}</g>`;
}
// 肉詰めゴーヤの輪切り（いぼのある緑の輪、中に豚ひき肉）
function xvn_StuffedGoya(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xvsg' + seed + x + y);
    const n = 18, outer = Array.from({ length: n }, (_, i) => { const a = i / n * 6.28, rr = s / 2 * (i % 2 ? .93 : 1) * (1 + (R() - .5) * .05); return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    let bumps = '';
    for (let i = 0; i < 12; i++){ const a = i / 12 * 6.28 + .2, d = s * .4; bumps += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(s * .05)}" ry="${f(s * .035)}" transform="rotate(${f(a * 57.3)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="#9ccc6a" opacity=".8"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(outer, true, .7)}" fill="${p.g('#5a9a3a', .25, .3)}" stroke="#2f6a22" stroke-width=".7"/></g>${bumps}
        <circle r="${f(s * .32)}" fill="#e6f0c8" stroke="#a8c080" stroke-width=".6"/>
        <circle r="${f(s * .28)}" fill="${p.rg('#c49a7a', .25, .25, .4, .38)}"/>
        ${xvn_Grains(p, 0, 0, s * .46, { cols: ['#3a2a24', '#e0c0a0'], n: 12, size: 1, seed })}
        ${xvn_Shine(`M${f(-s * .3)},${f(-s * .26)} Q${f(-s * .1)},${f(-s * .44)} ${f(s * .16)},${f(-s * .42)}`, 1.4, .6)}</g>`;
}
// キャベツの肉巻き（ねぎで結ぶ）
function xvn_CabbageRoll(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xvcr' + seed + x + y), c = '#cfe2a6';
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="${f(w * .45)}" fill="${p.g(c, .3, .25)}" stroke="#93ab6a" stroke-width=".7"/></g>
        <path d="M${f(-L * .3)},${f(-w / 2 + 1)} Q${f(-L * .1)},0 ${f(-L * .3)},${f(w / 2 - 1)} M${f(L * .05)},${f(-w / 2 + 1)} Q${f(L * .25)},0 ${f(L * .05)},${f(w / 2 - 1)}" stroke="#eef4dc" stroke-width="1.6" fill="none" opacity=".9"/>
        <path d="M${f(-L / 2 + 3)},${f(w * .1)} Q0,${f(w * .3)} ${f(L / 2 - 3)},${f(w * .05)}" stroke="#a8c080" stroke-width=".8" fill="none" opacity=".7"/>
        <rect x="${f(L * .12 + (R() - .5) * 3)}" y="${f(-w / 2 - 1)}" width="3.4" height="${w + 2}" rx="1.7" fill="${p.g('#3f8f2f', .3, .2)}" stroke="#2a6a1e" stroke-width=".4"/>
        ${xvn_Shine(`M${f(-L / 2 + 5)},${f(-w * .28)} L${f(L / 2 - 6)},${f(-w * .3)}`, 1.6, .7)}</g>`;
}
// 豚肉団子（ゆでた、白っぽいピンク）
const xvn_PorkBall = (p, x, y, s, c = '#e6cab4') => `<g ${p.sh(.7)}><g ${p.rough(3, .12)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g></g>` + xvn_Grains(p, x, y, s * .7, { cols: ['#c49a88', '#5a4a40'], n: 6, size: .9, seed: x }) + `<ellipse cx="${f(x - s * .16)}" cy="${f(y - s * .18)}" rx="${f(s * .14)}" ry="${f(s * .07)}" fill="#fff" opacity=".7"/>`;
// ゆでた骨つき豚スペアリブ（白っぽい）
const xvn_BoiledRib = (p, x, y, s, r = 0, seed = 1) => xvn_Rib(p, x, y, s, r, { c: '#d8b49a', seed });
// 蟹の浮き身（田蟹のすり身がふわっと固まった茶色の島）
function xvn_CrabRaft(p, x, y, s, { seed = 1, sy = .8 } = {}){
    const R = rng(p.id + 'xvcf' + seed + x + y);
    return `<g ${p.sh(.6)}><g ${p.rough(5, .1)}><path ${T(x, y)} d="${smooth(ring(s / 2, 12, .35, R, 1, sy))}" fill="${p.rg('#b88a5a', .25, .25)}"/></g></g>
        ${xvn_Grains(p, x, y, s * .85, { cols: ['#d8b080', '#9a6a3e', '#e8c89a', '#c48a50'], n: Math.round(s * .8), size: 2.6, seed, sy })}`;
}
// 白身魚の切り身（煮て白くなった、ほぐれ目）
function xvn_FishChunk(p, x, y, s, r = 0, { seed = 1, skin = '#8a8a86' } = {}){
    const R = rng(p.id + 'xvfc' + seed + x + y), k = s / 30;
    const pts = ring(14, 10, .2, R, 1.2, .75);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .8)}" fill="${p.g('#f6f0e2', .3, .2)}" stroke="#c8bca4" stroke-width=".6"/></g>
        <path d="${smooth(pts.slice(1, 5).map(([a, b]) => [a, b * .98]), false)}" stroke="${skin}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M-9,-4 Q-6,2 -9,7 M-3,-6 Q0,1 -3,8 M3,-6 Q6,1 3,8 M9,-4 Q11,1 9,6" stroke="#ddd0b8" stroke-width=".9" fill="none"/>
        ${xvn_Shine('M-10,-6 Q-2,-9 6,-8', 1.2, .6)}</g>`;
}
// たけのこの細切り（干したものを戻した、黄色い帯）
function xvn_BambooStrip(p, x, y, L, w, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${w}" rx="${f(w * .3)}" fill="${p.g('#e2c47a', .3, .25)}" stroke="#a8884a" stroke-width=".5"/></g>
        <path d="M${f(-L / 2 + 2)},${f(-w * .2)} L${f(L / 2 - 2)},${f(-w * .2)} M${f(-L / 2 + 2)},${f(w * .15)} L${f(L / 2 - 2)},${f(w * .15)}" stroke="#c4a058" stroke-width=".6"/>
        ${xvn_Shine(`M${f(-L / 2 + 3)},${f(-w * .32)} L${f(L / 2 - 4)},${f(-w * .32)}`, .9, .6)}</g>`;
}
// 生姜の千切り
const xvn_Ginger = (p, x, y, s, n = 12, seed = 1) => xvn_Shreds(p, x, y, s, { c: '#f0d68a', n, w: 1.5, len: .22, seed });
// 小さな葉をたくさん（軽量: 色ごとに1本のpath）
function xvn_LeafSwarm(p, x, y, s, { cols = ['#2f6e24', '#3f8030'], n = 40, size = 11, seed = 1, minD = 9 } = {}){
    const sp = xvn_Spots(p.id + 'lsw' + seed, n, s / 2, minD, x, y), ds = cols.map(() => ''), vs = [];
    sp.forEach(([cx, cy, r], i) => {
        const a = r * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), L = size * (.85 + (i % 3) * .12), W = L * .48;
        const P = (u, v) => `${f1(cx + u * ca - v * sa)},${f1(cy + u * sa + v * ca)}`;
        ds[i % cols.length] += `M${P(-L, 0)}Q${P(-L * .4, -W * 1.5)} ${P(L * .4, -W)}Q${P(L, -W * .3)} ${P(L, 0)}Q${P(L, W * .3)} ${P(L * .4, W)}Q${P(-L * .4, W * 1.5)} ${P(-L, 0)}Z`;
        vs.push(`M${P(-L * .9, 0)}L${P(L * .85, 0)}`);
    });
    return `<g ${p.sh(.5)}>${cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".6"/>`).join('')}</g><path d="${vs.join('')}" stroke="#8cc46a" stroke-width=".8" opacity=".8"/><path d="${sp.map(([cx, cy, r]) => { const a = r * Math.PI / 180; return `M${f1(cx - Math.cos(a) * size * .5 - 1)},${f1(cy - Math.sin(a) * size * .5 - 2)}l${f1(Math.cos(a) * size * .6)},${f1(Math.sin(a) * size * .6)}`; }).join('')}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".35"/>`;
}
// 色釉の汁鉢（外が色釉、内はクリーム）
function xvn_GlazeBowl(p, glaze){
    return K.bowl(p, { glaze, inside: '#f8f4e8', R: 92 }) + `<circle cx="100" cy="100" r="81" fill="none" stroke="${dk(glaze, .2)}" stroke-width="1.2" opacity=".7"/>`;
}
// 汁の表面（澄んだ / とろみ）: 鉢の内側いっぱい
function xvn_Broth(p, c, { R = 79, op = .9, cloud = 0, lightC = null } = {}){
    return K.liquid(p, { R, c, op, shine: false }) + (cloud ? `<circle cx="96" cy="96" r="${R * .72}" fill="${lightC || lt(c, .35)}" opacity="${cloud}"/>` : '');
}

// =========================================================
export default {
    // スペアリブの甘辛煮詰め（sườn ram mặn ngọt）: 白い皿に、飴色の照りの骨つきリブ、にんにく、ねぎ、こしょう
    vn_suonram: p => [
        xvn_Plate(p),
        K.pool(p, 100, 102, 124, '#7a3610', { op: .85, seed: 1, sy: .9 }),
        `<g ${p.sh(.6)}>`,
        ...[[74, 74, 20], [108, 66, -25], [140, 86, 70], [62, 104, 95], [96, 98, 10], [130, 116, -40], [78, 132, 30], [112, 138, -70], [146, 120, 100], [90, 120, 150], [120, 92, 140], [54, 128, 60]].map(([x, y, r], i) => xvn_Rib(p, x, y, 36, r, { seed: i, c: i % 3 ? '#8a3e12' : '#9a4a18' })),
        `</g>`,
        xvn_FriedGarlic(p, 100, 102, 100, 30),
        K.scallions(p, 100, 100, 104, { n: 18, c: '#4f9a34' }),
        xvn_Pepper(p, 100, 100, 108, 34),
    ].join(''),

    // 豚ばらのカリカリ炒め（thịt rang cháy cạnh）: 藍釉の皿に、縁が焦げて反り返った豚ばらの薄切り、ねぎのぶつ切り
    vn_thitrangchay: p => [
        xvn_GlazePlate(p, { glaze: '#2f5f8f' }),
        K.pool(p, 100, 102, 118, '#8a4414', { op: .6, seed: 2, sy: .9 }),
        `<g ${p.sh(.7)}>`,
        ...[[72, 78, -20], [110, 68, 15], [140, 96, 60], [64, 112, 80], [102, 98, -5], [134, 128, -30], [84, 136, 25], [116, 142, -10], [92, 118, 50], [126, 108, 110], [58, 88, 120], [100, 78, 160], [148, 120, 20]].map(([x, y, r], i) => xvn_Layered(p, x, y, 40, 15, r, [['#6a2a0c', .16], ['#e2a856', .26], ['#a8561e', .28], ['#d89a50', .12], ['#8a3e14', .18]], { seed: i, edge: '#4a1e06', shine: .8, flat: true, shadow: false })),
        `</g>`,
        `<g ${p.sh(.4)}>`,
        ...[[88, 88, 30], [122, 82, -40], [108, 118, 70], [74, 120, -10], [138, 108, 50], [96, 140, 10], [62, 96, 80], [116, 98, 120]].map(([x, y, r], i) => xvn_Scallion(p, x, y, 22, r, { white: i % 3 === 2 })),
        `</g>`,
        xvn_Pepper(p, 100, 100, 110, 30),
    ].join(''),

    // ゆで豚とヌックマム（thịt luộc chấm nước mắm）: 長皿に、皮・脂・赤身の層が見える薄切りを並べ、きゅうり、しそ・ミント、にんにく唐辛子のたれ
    vn_thitluoc: p => {
        const bands = [['#e9cf9a', .12], ['#fbf6ea', .3], ['#d9b49c', .28], ['#f6efe2', .1], ['#cfa48c', .2]];
        return [
            K.longPlate(p, { base: '#f6f3ec', rim: XVN_BLUE }),
            `<g ${p.sh(.8)}>`,
            ...[0, 1, 2, 3, 4, 5].map(i => xvn_Layered(p, 58, 58 + i * 16, 50, 17, -4, bands, { seed: i, edge: '#b89276', flat: true, shadow: false })),
            ...[0, 1, 2, 3, 4, 5].map(i => xvn_Layered(p, 106, 60 + i * 16, 48, 17, 3, bands, { seed: i + 9, edge: '#b89276', flat: true, shadow: false })),
            `</g>`,
            `<g ${p.sh(.5)}>`,
            ...[[144, 60], [162, 66], [168, 86], [146, 80]].map(([x, y], i) => K.cucumberSlice(p, x, y, 17, i * 30, { oval: 1.1 })),
            `</g>`,
            xvn_Leaf(p, 140, 132, 26, -30, { c: '#3a7a2c', spot: true }), xvn_Leaf(p, 160, 136, 22, 40, { c: '#4a8a34' }), xvn_Leaf(p, 170, 118, 20, 100, { c: '#5a9a3a', spot: true }),
            xvn_DipBowl(p, 150, 106, 15, '#c9842e'),
        ].join('');
    },

    // 肉団子のトマトソース煮（xíu mại sốt cà chua）: 白い鉢に、赤いトマトソース、肉団子、玉ねぎ、ねぎ
    vn_xiumai: p => { const XM = [[68, 74], [106, 62], [142, 86], [60, 112], [100, 100], [138, 126], [84, 140], [120, 142], [130, 102]]; return [
        xvn_SmallBowl(p),
        K.liquid(p, { R: 78, c: '#c8402a', op: 1, shine: false }),
        `<circle cx="94" cy="94" r="50" fill="#e8684a" opacity=".25"/>`,
        xvn_Grains(p, 100, 100, 140, { cols: ['#a82a1a', '#e05a3a', '#f08a5a'], n: 46, size: 2.6, seed: 2 }),
        ...XM.map(([x, y]) => K.meatball(p, x, y, 36, { c: '#b8704a' })),
        ...XM.map(([x, y]) => `<path d="M${x - 16},${y + 3} Q${x},${y + 19} ${x + 16},${y + 3} Q${x + 8},${y + 11} ${x},${y + 9} Q${x - 9},${y + 11} ${x - 16},${y + 3}Z" fill="#c8401f" opacity=".85"/><path d="M${x + 2},${y - 14} Q${x + 12},${y - 10} ${x + 14},${y - 2} Q${x + 8},${y - 6} ${x + 2},${y - 14}Z" fill="#d04a26" opacity=".7"/>`),
        xvn_Tomato(p, 86, 86, 18, 20, { seed: 1, c: '#d93a24' }), xvn_Tomato(p, 120, 136, 18, -30, { seed: 2, c: '#d93a24' }), xvn_Tomato(p, 150, 108, 16, 60, { seed: 3, c: '#d93a24' }),
        K.scallions(p, 100, 100, 120, { n: 20, c: '#4f9a34' }),
        xvn_Pepper(p, 100, 100, 100, 20),
        xvn_SoupShine(100, 100, 78, .3),
    ].join(''); },

    // 卵と豚ひき肉の蒸し焼き（chả trứng hấp）: 皿に、黄身を塗った黄金色の表面、きくらげの黒い粒、四角に切り分け
    vn_chatrung: p => {
        const id = p.uid();
        const R = rng(p.id + 'ct');
        let blot = '';
        for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 58; blot += `<ellipse cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" rx="${f(4 + R() * 7)}" ry="${f(3 + R() * 4)}" fill="#e09a2a" opacity="${f(.2 + R() * .25)}"/>`; }
        const grid = [-1.5, -.5, .5, 1.5].map(k => `M${100 + k * 34},20 L${100 + k * 34},180 M20,${100 + k * 34} L180,${100 + k * 34}`).join(' ');
        return [
            xvn_Plate(p),
            `<defs><clipPath id="${id}"><circle cx="100" cy="100" r="66"/></clipPath></defs>`,
            `<g ${p.sh(1.2)}><circle cx="100" cy="100" r="66" fill="#c98a4a"/></g>`,
            `<g clip-path="url(#${id})"><circle cx="100" cy="100" r="64" fill="${p.rg('#f2c23e', .3, .2, .38, .35)}"/>${blot}`,
            xvn_Grains(p, 100, 100, 124, { cols: ['#2a1e18', '#4a3a30'], n: 26, size: 1.6, seed: 3 }),
            xvn_Grains(p, 100, 100, 124, { cols: ['#d8a080'], n: 14, size: 1.4, seed: 5 }),
            `<path d="${[-1, 0, 1].map(k => `M${100 + k * 34 - 17},20 L${100 + k * 34 - 17},180`).join('')}" stroke="none"/>`,
            `<path d="${[-1, 1].map(k => `M${100 + k * 22},20 L${100 + k * 22},180 M20,${100 + k * 22} L180,${100 + k * 22}`).join(' ')}" stroke="#b5702a" stroke-width="2.4"/>`,
            `<path d="${[-1, 1].map(k => `M${100 + k * 22 - 1.2},20 L${100 + k * 22 - 1.2},180 M20,${100 + k * 22 - 1.2} L180,${100 + k * 22 - 1.2}`).join(' ')}" stroke="#fde6a0" stroke-width=".9" opacity=".8"/>`,
            `</g>`,
            `<circle cx="100" cy="100" r="65" fill="none" stroke="#c07a2a" stroke-width="2.2" opacity=".7"/>`,
            K.scallions(p, 100, 100, 112, { n: 22, c: '#3f8f2f' }),
            xvn_Shine('M48,82 Q58,52 90,42', 3, .5),
        ].join('');
    },

    // 手羽のヌックマム揚げ（cánh gà chiên nước mắm）: 白い皿に、飴色にからめた揚げ手羽、揚げにんにく、唐辛子
    vn_gachiennuocmam: p => [
        xvn_Plate(p),
        K.pool(p, 100, 102, 110, '#a85a1a', { op: .45, seed: 3, sy: .9 }),
        ...[[72, 72, 30, 0], [116, 66, -20, 1], [146, 98, 80, 0], [64, 106, 100, 1], [104, 100, 15, 0], [136, 130, -40, 1], [80, 138, 40, 0], [112, 136, 160, 0], [92, 82, 120, 1]].map(([x, y, r, d], i) => xvn_Wing(p, x, y, 46, r, { seed: i, drum: !!d, c: i % 2 ? '#b0601c' : '#bf6e22' })),
        xvn_FriedGarlic(p, 100, 102, 104, 40, 2),
        xvn_Chili(p, 88, 96, 7, 0), xvn_Chili(p, 124, 88, 6, 0), xvn_Chili(p, 102, 124, 7, 0), xvn_Chili(p, 72, 120, 6, 0),
        K.scallions(p, 100, 100, 90, { n: 10, c: '#4f9a34' }),
    ].join(''),

    // 鶏のレモングラス唐辛子炒め（gà xào sả ớt）: 茶釉の皿に、ターメリック色の鶏、きつね色のレモングラス、赤唐辛子、玉ねぎ
    vn_gaxaosa: p => [
        xvn_GlazePlate(p, { glaze: '#8a5a32' }),
        K.pool(p, 100, 102, 120, '#c4821e', { op: .7, seed: 4, sy: .9 }),
        `<g ${p.sh(.7)}>`,
        ...[[74, 76, 20], [114, 68, -30], [142, 98, 60], [66, 110, 100], [102, 100, 10], [134, 130, -40], [84, 136, 70], [112, 132, 30], [92, 76, 150]].map(([x, y, r], i) => xvn_ChickenBit(p, x, y, 34, r, { seed: i, c: i % 2 ? '#b8701c' : '#c48024', bone: i % 3 === 0 })),
        K.onion(p, 124, 86, 20, 30, { c: '#efd9a0' }), K.onion(p, 80, 120, 20, -60, { c: '#efd9a0' }),
        `</g>`,
        xvn_Lemongrass(p, 100, 102, 110, 70, 1, true),
        ...[[86, 90], [122, 108], [104, 128], [70, 96], [132, 78], [92, 112], [118, 146]].map(([x, y]) => xvn_Chili(p, x, y, 7, 0)),
        xvn_Coriander(p, 100, 92, 18, 20), xvn_Coriander(p, 140, 116, 16, -30),
    ].join(''),

    // 牛肉のサイコロステーキ（bò lúc lắc）: 皿にクレソンとレタス、トマトの輪切り、焼いた牛のさいころ、赤と緑のピーマン、玉ねぎ
    vn_boluclac: p => [
        xvn_Plate(p),
        `<g ${p.sh(.6)}>`,
        ...[[60, 70, 20], [100, 52, -10], [140, 66, 30], [152, 104, 80], [138, 142, 120], [100, 152, 180], [60, 140, 220], [48, 104, 260]].map(([x, y, r], i) => xvn_SoupLeaf(p, x, y, 40, r, { c: i % 2 ? '#4f9a34' : '#6ab040', seed: i, shape: 'round' })),
        `</g>`,
        ...[[70, 64], [134, 62], [146, 130], [62, 134]].map(([x, y], i) => `<g ${p.sh(.5)}><circle cx="${x}" cy="${y}" r="12" fill="${p.g('#e5382a', .3, .25)}" stroke="#a8221a" stroke-width=".6"/></g><circle cx="${x}" cy="${y}" r="8" fill="#f06a52"/><path d="M${x - 4},${y} Q${x},${y - 4} ${x + 4},${y} M${x - 3},${y + 3} Q${x},${y + 1} ${x + 3},${y + 3}" stroke="#f9d36b" stroke-width="1.3" fill="none"/>`),
        `<g ${p.sh(.7)}>`,
        ...[[84, 82, 10], [108, 78, -15], [130, 92, 20], [74, 104, -5], [98, 102, 25], [122, 114, -20], [88, 124, 15], [110, 128, 5], [138, 112, 40]].map(([x, y, r], i) => xvn_BeefCube(p, x, y, 22, r, { seed: i, c: i % 2 ? '#5a2a14' : '#6a321a' })),
        K.pepperPiece(p, 96, 88, 14, 20, { c: '#d8341e' }), K.pepperPiece(p, 118, 100, 13, -30, { c: '#3f8f2f' }), K.pepperPiece(p, 84, 112, 13, 60, { c: '#3f8f2f' }), K.pepperPiece(p, 126, 126, 12, 10, { c: '#d8341e' }), K.pepperPiece(p, 104, 140, 12, -40, { c: '#e8a020' }),
        K.onion(p, 116, 82, 16, 40), K.onion(p, 96, 116, 16, -40),
        `</g>`,
        xvn_FriedGarlic(p, 104, 104, 70, 20, 3),
        xvn_Pepper(p, 104, 104, 70, 26),
    ].join(''),

    // ラロット葉の牛肉巻き焼き（bò cuốn lá lốt）: 長皿に、焼いて照った緑の巻きを並べ、砕いたピーナッツとねぎ油
    vn_bolalot: p => [
        K.longPlate(p, { base: '#f6f3ec', rim: XVN_BLUE }),
        ...[0, 1, 2, 3, 4, 5, 6].map(i => xvn_BetelRoll(p, 46 + i * 18, 100, 76, 15, -72 + (i % 2) * 4, { seed: i })),
        xvn_Grains(p, 100, 100, 100, { cols: ['#4fa034', '#6cbc44'], n: 34, size: 2, seed: 3, w: 130, h: 60 }),
        xvn_Grains(p, 100, 100, 100, { cols: ['#e2b878', '#c99556', '#f0d4a0'], n: 50, size: 2.2, seed: 4, w: 130, h: 64 }),
        K.scallions(p, 100, 100, 110, { n: 12, c: '#4f9a34' }),
    ].join(''),

    // 揚げ魚のトマトソース煮（cá sốt cà chua）: 楕円皿に、赤いトマトソース、きつね色の筒切りの魚、トマト、ねぎ
    vn_casotca: p => [
        K.ovalDish(p, { rim: XVN_BLUE, deep: true }),
        `<ellipse cx="100" cy="101" rx="76" ry="58" fill="${p.rg('#c83a24', .22, .25, .45, .42)}"/>`,
        xvn_Grains(p, 100, 100, 100, { cols: ['#a82a1a', '#e85a3a', '#f08a5a'], n: 40, size: 2.6, seed: 2, w: 140, h: 100 }),
        xvn_FishSteak(p, 62, 98, 64, -80, { seed: 1, flesh: '#e2a446', skin: '#9a6a34' }),
        xvn_FishSteak(p, 102, 96, 66, 96, { seed: 2, flesh: '#dc9c40', skin: '#9a6a34' }),
        xvn_FishSteak(p, 142, 100, 62, -84, { seed: 3, flesh: '#e2a446', skin: '#9a6a34' }),
        `<path d="M44,112 Q62,124 80,112 M86,110 Q102,122 120,110 M126,112 Q142,122 158,112" stroke="#c43a22" stroke-width="6" fill="none" stroke-linecap="round" opacity=".75"/>`,
        xvn_Tomato(p, 80, 70, 18, 20, { seed: 1, c: '#d93a24' }), xvn_Tomato(p, 124, 132, 18, -30, { seed: 2, c: '#d93a24' }), xvn_Tomato(p, 120, 66, 16, 60, { seed: 3, c: '#d93a24' }), xvn_Tomato(p, 78, 130, 16, 0, { seed: 4, c: '#d93a24' }),
        `<g ${p.sh(.4)}>`, ...[[82, 92, 20], [122, 104, -30], [102, 120, 60], [62, 116, -10], [142, 84, 40]].map(([x, y, r]) => xvn_Scallion(p, x, y, 16, r)), `</g>`,
        K.scallions(p, 100, 100, 110, { n: 14, c: '#4f9a34' }),
        xvn_Pepper(p, 100, 100, 100, 20),
    ].join(''),
    // 白身魚のディル入りさつま揚げ（chả cá thì là）: 皿に、きつね色の平たい魚のすり身焼き、ディル、ライム、唐辛子
    vn_chaca: p => [
        xvn_Plate(p),
        ...[[70, 74, 46], [116, 68, 44], [148, 104, 40], [60, 116, 42], [104, 108, 46], [136, 142, 40], [86, 146, 42]].map(([x, y, s], i) => K.patty(p, x, y, s, s * .88, i * 30, { c: i % 2 ? '#d29a42' : '#dca64c' })),
        ...[[70, 74], [116, 68], [148, 104], [60, 116], [104, 108], [136, 142], [86, 146]].map(([x, y], i) => xvn_Grains(p, x, y, 28, { cols: ['#3f7d2a', '#5a9a3a'], n: 12, size: .9, seed: i })),
        `<g ${p.sh(.4)}>`, xvn_Dill(p, 134, 66, 30, -30), xvn_Dill(p, 92, 92, 26, 40), xvn_Dill(p, 58, 140, 24, 10), `</g>`,
        xvn_Lime(p, 156, 70, 22, 30),
        xvn_Chili(p, 118, 126, 6, 0), xvn_Chili(p, 84, 126, 6, 0),
    ].join(''),

    // 蒸し魚の生姜ねぎのせ（cá hấp gừng hành）: 長皿に、一尾の蒸し魚（切り込み）、醤油の汁、針しょうが、白髪ねぎ、しいたけ
    vn_cahap: p => [
        K.longPlate(p, { base: '#f6f3ec', rim: '#b9b0a0' }),
        `<rect x="22" y="50" width="156" height="100" rx="14" fill="${p.rg('#b88a44', .2, .25, .45, .42)}" opacity=".8"/>`,
        `<g transform="translate(100 100) scale(1 1.75) translate(-100 -100)">`, K.wholeFish(p, 100, 100, 164, 0, { skin: '#a8a49a', belly: '#efe9dc', char: 0 }), `</g>`,
        `<path d="M66,84 q5,14 0,30 M86,80 q5,18 0,38 M106,80 q5,18 0,38 M126,84 q5,14 0,30" stroke="#8a8478" stroke-width="1.8" fill="none" opacity=".55"/>`,
        `<path d="M66,84 q5,14 0,30 M86,80 q5,18 0,38 M106,80 q5,18 0,38 M126,84 q5,14 0,30" stroke="#f6f2e8" stroke-width="1" fill="none" transform="translate(1.8 0)"/>`,
        `<g ${p.sh(.4)}>`, ...[[80, 92, 20], [100, 104, -30], [118, 90, 60], [92, 112, 100], [126, 108, -10]].map(([x, y, r]) => `<g ${K.T(x, y, r)}><path d="M-7,-2 Q0,-5 7,-2 L6,2 Q0,0 -6,2Z" fill="${p.g('#7a4b2b', .25, .25)}" stroke="#4a2b16" stroke-width=".5"/><path d="M-5,1.4 Q0,0 5,1.4" stroke="#e6d4b4" stroke-width="1.2" fill="none"/></g>`), `</g>`,
        xvn_Shreds(p, 100, 98, 100, { c: '#f2d880', n: 34, w: 1.6, len: .2, seed: 2, sy: .45 }),
        xvn_Shreds(p, 104, 96, 96, { c: '#f2f4e4', n: 22, w: 1.7, len: .3, seed: 3, sy: .45, curve: .5 }),
        xvn_Shreds(p, 104, 98, 100, { c: '#5aa83a', n: 24, w: 1.6, len: .3, seed: 4, sy: .45, curve: .5 }),
        K.chiliThreads(p, 100, 96, 70),
        xvn_Oil(p, 100, 100, 120, { n: 10, c: '#e6b04a', op: .5, rmax: 1.8 }),
    ].join(''),

    // いかの甘酢炒め（mực xào chua ngọt）: 皿に、切り込みで丸まったいか、パイナップル、トマト、玉ねぎ、ピーマン、ねぎ
    vn_mucxao: p => [
        xvn_Plate(p),
        K.pool(p, 100, 102, 124, '#d8642e', { op: .7, seed: 5, sy: .9 }),
        `<g ${p.sh(.6)}>`,
        ...[[72, 78, 20], [112, 66, -30], [144, 96, 60], [64, 112, 100], [100, 98, 10], [132, 128, -40], [84, 138, 70], [118, 112, 160]].map(([x, y, r], i) => xvn_SquidPiece(p, x, y, 32, r, { seed: i, tint: '#f08a4a' })),
        ...[[92, 74, 20], [128, 82, 200], [78, 98, -40], [110, 136, 80]].map(([x, y, r]) => xvn_Pineapple(p, x, y, 18, r)),
        xvn_Tomato(p, 140, 120, 18, 30, { seed: 1 }), xvn_Tomato(p, 66, 132, 16, -40, { seed: 2 }), xvn_Tomato(p, 104, 54, 14, 70, { seed: 3 }),
        K.pepperPiece(p, 120, 96, 14, 20, { c: '#3f8f2f' }), K.pepperPiece(p, 86, 120, 13, -50, { c: '#3f8f2f' }), K.pepperPiece(p, 150, 110, 12, 40, { c: '#d8341e' }),
        K.onion(p, 98, 120, 18, 30), K.onion(p, 58, 90, 16, -60),
        `</g>`,
        `<g ${p.sh(.4)}>`, ...[[96, 88, 30], [126, 70, -40], [70, 124, 60], [140, 140, 10]].map(([x, y, r]) => xvn_Scallion(p, x, y, 18, r)), `</g>`,
        xvn_Pepper(p, 100, 100, 100, 18),
    ].join(''),

    // あさりのレモングラス蒸し（nghêu hấp sả）: アルミの鍋に、口の開いたあさり、レモングラス、生姜、唐辛子、タイバジル
    vn_ngheuhapsa: p => {
        const sp = xvn_Spots('ngheu', 18, 60, 20);
        return [
            xvn_MetalPot(p),
            K.liquid(p, { R: 80, c: '#d9cf9e', op: .9, shine: false }),
            `<g ${p.sh(.6)}>`, ...sp.map(([x, y, r]) => K.clam(p, x, y, 28, r)), `</g>`,
            ...[[78, 92, 30], [124, 112, -50], [100, 64, 80], [70, 130, 10], [140, 74, -20]].map(([x, y, r]) => xvn_LemongrassStalk(p, x, y, 22, r)),
            K.gingerShreds(p, 104, 100, 80),
            xvn_Chili(p, 92, 116, 8, 0), xvn_Chili(p, 128, 88, 7, 0), xvn_Chili(p, 64, 102, 7, 0),
            xvn_Leaf(p, 110, 132, 22, -30, { c: '#2f7a2a', narrow: .7 }), xvn_Leaf(p, 86, 74, 20, 40, { c: '#3a8a2c', narrow: .7 }), xvn_Leaf(p, 140, 128, 18, 100, { c: '#2f7a2a', narrow: .7 }),
            xvn_SoupShine(100, 100, 80, .3),
        ].join('');
    },

    // 揚げ豆腐のレモングラス唐辛子まぶし（đậu hũ chiên sả ớt）: 青磁の皿に、きつね色の豆腐、カリカリのレモングラス、赤唐辛子
    vn_dauhusaot: p => [
        xvn_GlazePlate(p, { glaze: '#8fb8a0', inside: '#f6f6ee' }),
        `<g ${p.sh(.4)}>`,
        ...[[74, 74, 8], [104, 70, -10], [134, 80, 14], [66, 104, -6], [98, 102, 12], [130, 110, -14], [76, 134, 10], [108, 134, -4], [138, 140, 20], [148, 86, 30]].map(([x, y, r]) => xvn_FriedTofu(p, x, y, 28, r, { c: '#e0a040' })),
        `</g>`,
        xvn_Lemongrass(p, 104, 104, 112, 120, 1, true),
        xvn_Lemongrass(p, 100, 100, 90, 50, 2, false),
        ...[[86, 88], [118, 96], [102, 122], [72, 116], [136, 124], [124, 70], [90, 140]].map(([x, y]) => xvn_Chili(p, x, y, 7, 0)),
        K.scallions(p, 104, 104, 80, { n: 8, c: '#4f9a34' }),
    ].join(''),

    // 豆腐ときのこの醤油煮（đậu hũ kho nấm）: 土鍋に、醤油色の煮汁、煮しめた揚げ豆腐、ふくろたけ、ねぎ、こしょう
    vn_dauhukhonam: p => [
        xvn_ClayPot(p),
        K.liquid(p, { R: 80, c: '#6a3a18', op: 1, shine: false }),
        xvn_Oil(p, 100, 100, 150, { n: 14, c: '#c88a3a', op: .5, rmax: 2 }),
        `<g ${p.sh(.4)}>`,
        ...[[74, 74, 10], [110, 66, -14], [140, 96, 20], [66, 110, -8], [102, 104, 12], [132, 132, -18], [80, 140, 6]].map(([x, y, r]) => xvn_FriedTofu(p, x, y, 30, r, { c: '#b8702a', sauce: '#6a3416' })),
        `</g>`,
        ...[[92, 86, 20], [124, 84, -30], [86, 120, 60], [118, 118, 10], [56, 92, -40], [106, 146, 80], [146, 120, 30]].map(([x, y, r]) => xvn_StrawMush(p, x, y, 18, r, { stew: true })),
        xvn_SoupShine(100, 100, 80, .3),
        `<g ${p.sh(.4)}>`, ...[[98, 92, 30], [130, 108, -40], [72, 96, 70]].map(([x, y, r]) => xvn_Scallion(p, x, y, 14, r)), `</g>`,
        K.scallions(p, 100, 100, 100, { n: 12, c: '#4f9a34' }),
        xvn_Pepper(p, 100, 100, 110, 30),
    ].join(''),

    // なすとひき肉の炒めもの（cà tím xào thịt bằm）: 皿に、紫の皮の残るやわらかいなす、そぼろ、タイバジル、唐辛子
    vn_catimxaothit: p => [
        xvn_Plate(p),
        K.pool(p, 100, 102, 120, '#a8692c', { op: .55, seed: 6, sy: .9 }),
        `<g ${p.sh(.7)}>`,
        ...[[72, 76, -30], [110, 66, 20], [140, 94, 70], [62, 108, 80], [100, 96, -10], [134, 126, -40], [78, 136, 30], [114, 134, 110], [92, 116, 160], [124, 104, 140]].map(([x, y, r], i) => xvn_EggplantBar(p, x, y, 40, 15, r, i)),
        `</g>`,
        xvn_Grains(p, 100, 102, 118, { cols: ['#8a5a34', '#a06a3c', '#6e4428'], n: 70, size: 1.9, seed: 3 }),
        `<g ${p.sh(.4)}>`, ...[[86, 82, 20], [124, 80, -40], [80, 120, 100], [118, 120, 60], [146, 110, -20]].map(([x, y, r]) => xvn_Leaf(p, x, y, 18, r, { c: '#2f7a2a', narrow: .7 })), `</g>`,
        xvn_Chili(p, 104, 86, 6, 0), xvn_Chili(p, 70, 98, 6, 0), xvn_Chili(p, 132, 140, 6, 0),
        xvn_FriedGarlic(p, 100, 100, 90, 16, 4),
    ].join(''),

    // 焼き豚のせビーフン（bún thịt nướng）: 白い鉢に、ビーフン、焦げ目の焼き豚、レタスと香草、きゅうり、なます、ピーナッツ、ねぎ油
    vn_bunthitnuong: p => [
        xvn_Bowl(p),
        `<circle cx="100" cy="100" r="80" fill="#f4f1e8"/>`,
        xvn_Vermicelli(p, 100, 102, 132, { n: 40, w: 1.7 }),
        `<g ${p.sh(.5)}>`,
        ...[[52, 90, 80], [56, 124, 50], [66, 62, 120], [80, 146, 10]].map(([x, y, r], i) => xvn_SoupLeaf(p, x, y, 40, r, { c: i % 2 ? '#9cca5a' : '#8cc04c', seed: i, shape: 'serrate' })),
        xvn_Leaf(p, 62, 104, 20, 30, { c: '#2f7a2a', spot: true }), xvn_Leaf(p, 72, 76, 18, 80, { c: '#4a9a34' }), xvn_Leaf(p, 66, 134, 16, -20, { c: '#3a8a2c' }),
        `</g>`,
        ...[[112, 68, -10], [140, 92, 40], [106, 100, 15], [134, 126, -20], [108, 134, 30]].map(([x, y, r], i) => xvn_GrilledPork(p, x, y, 46, r, { seed: i, c: i % 2 ? '#b8622a' : '#c4722e' })),
        xvn_Batons(p, 150, 60, 22, { c: '#d6eab0', n: 6, w: 3, len: 14, seed: 2 }),
        xvn_Shreds(p, 84, 150, 26, { c: '#ef7f30', n: 10, w: 2.4, len: .5, seed: 5 }),
        xvn_Grains(p, 120, 104, 64, { cols: ['#4fa034', '#6cbc44'], n: 18, size: 1.8, seed: 5 }),
        xvn_Peanuts(p, 122, 100, 60, 22),
    ].join(''),

    // 海鮮と青菜の焼きそば（mì xào thập cẩm）: 皿に、黄色い卵麺、とろみのあるあん、えび、いか、チンゲン菜、にんじん
    vn_mixao: p => [
        xvn_Plate(p),
        xvn_EggNoodles(p, 100, 102, 138, 1, 38),
        K.glaze(p, 104, 100, 100, '#b07a32', { op: .4 }),
        `<g ${p.sh(.4)}>`,
        xvn_BokChoy(p, 64, 92, 56, 200, { seed: 1 }), xvn_BokChoy(p, 136, 116, 54, -20, { seed: 2 }), xvn_BokChoy(p, 112, 66, 46, 30, { seed: 3 }),
        `</g>`,
        ...[[96, 96, 20], [128, 82, -40], [84, 128, 100]].map(([x, y, r], i) => xvn_Shrimp(p, x, y, 36, r, { seed: i, c: '#f08a5a' })),
        ...[[112, 108, 30], [74, 112, -40]].map(([x, y, r], i) => xvn_SquidPiece(p, x, y, 26, r, { seed: i })),
        ...[[92, 76], [120, 140], [146, 92], [70, 140]].map(([x, y], i) => K.carrotRound(p, x, y, 11, { half: true, r: i * 60 })),
        xvn_Pepper(p, 100, 100, 110, 24),
    ].join(''),

    // 牛肉と高菜漬けのチャーハン（cơm rang dưa bò）: 皿に、香ばしい炒めご飯、牛肉の薄切り、黄緑の漬け菜、トマト、ねぎ
    vn_comrangduabo: p => [
        xvn_Plate(p),
        xvn_Rice(p, 100, 100, 134, { tint: '#e8c27a', grain: 3.8, hiK: .45, density: .6 }),
        `<g ${p.sh(.6)}>`,
        ...[[80, 80, 20], [124, 86, -30], [96, 118, 60], [134, 122, 10], [70, 112, 45]].map(([x, y, r], i) => K.beefSlice(p, x, y, 40, r, { seed: i, c: '#9a6040' })),
        ...[[104, 72, 30], [110, 100, -20], [76, 134, 60], [146, 98, 100], [58, 92, 0]].map(([x, y, r], i) => xvn_PickledGreen(p, x, y, 22, r, { seed: i })),
        xvn_Tomato(p, 120, 140, 16, 20, { seed: 1 }), xvn_Tomato(p, 90, 96, 14, -40, { seed: 2 }),
        `</g>`,
        xvn_Grains(p, 100, 100, 110, { cols: ['#f8d548', '#fbe48a'], n: 18, size: 3.4, seed: 7 }),
        K.scallions(p, 100, 100, 110, { n: 22, c: '#4f9a34' }),
        xvn_Pepper(p, 100, 100, 100, 18),
    ].join(''),
    // もやしとにらの炒めもの（giá xào hẹ）: 皿に、白いもやし、緑のにらのぶつ切り、薄切りの揚げ豆腐
    vn_giaxaohe: p => [
        xvn_Plate(p),
        xvn_Mound(p, 100, 100, 140, '#ece6c8'),
        xvn_Sprouts(p, 100, 100, 148, { n: 90, seed: 1 }),
        `<g ${p.sh(.4)}>`, ...[[70, 84, 20], [116, 72, -30], [142, 106, 60], [84, 124, -10], [118, 134, 40], [100, 100, 80], [62, 112, 100]].map(([x, y, r], i) => K.aburaage(p, x, y, 22, 8, r)), `</g>`,
        xvn_Sprouts(p, 100, 100, 130, { n: 50, seed: 2 }),
        `<g ${p.sh(.4)}>`,
        ...[[86, 74, 20], [126, 88, -40], [96, 116, 70], [64, 98, -10], [136, 124, 30], [108, 92, 120], [80, 140, 50], [120, 60, 90], [148, 92, 10], [56, 124, -60]].map(([x, y, r]) => `<g ${K.T(x, y, r)}><rect x="-13" y="-1.6" width="26" height="3.2" rx="1.6" fill="${p.g('#3f8f2f', .3, .2)}" stroke="#2a6a1e" stroke-width=".4"/></g>`),
        `</g>`,
    ].join(''),

    // ハヤトウリのにんにく炒め（su su xào tỏi）: 皿に、うす緑の千切りハヤトウリ、にんじん、揚げにんにく
    vn_susuxao: p => [
        xvn_Plate(p),
        xvn_Mound(p, 100, 100, 138, '#c4dc94'),
        xvn_Batons(p, 100, 100, 132, { c: '#cfe4a0', n: 40, w: 6, len: 26, seed: 1 }),
        xvn_Batons(p, 100, 100, 110, { c: '#f08a3a', n: 12, w: 4, len: 22, seed: 2 }),
        xvn_Batons(p, 100, 100, 90, { c: '#d6e8aa', n: 12, w: 6, len: 24, seed: 3 }),
        xvn_FriedGarlic(p, 100, 100, 100, 30),
        xvn_Pepper(p, 100, 100, 90, 18),
    ].join(''),

    // ゴーヤの卵炒め（khổ qua xào trứng）: 皿に、うすい半月切りのゴーヤ、ふんわり卵、ねぎ
    vn_khoquaxaotrung: p => [
        xvn_Plate(p),
        xvn_Mound(p, 100, 100, 136, '#e8d070', { op: .9 }),
        `<g ${p.sh(.5)}>`, ...xvn_Spots('kq', 20, 58, 19).map(([x, y, r]) => xvn_Goya(p, x, y, 28, r, { cooked: true })), `</g>`,
        xvn_EggCloud(p, 84, 84, 50, -15, { seed: 1 }), xvn_EggCloud(p, 124, 104, 46, 30, { seed: 2 }), xvn_EggCloud(p, 92, 130, 44, 60, { seed: 3 }),
        `<g ${p.sh(.4)}>`, ...xvn_Spots('kq2', 6, 50, 26).map(([x, y, r]) => xvn_Goya(p, x, y, 26, r, { cooked: true })), `</g>`,
        K.scallions(p, 100, 100, 110, { n: 16, c: '#4f9a34' }),
        xvn_Pepper(p, 100, 100, 90, 16),
    ].join(''),

    // ブロッコリーとにんじんの炒めもの（bông cải xào cà rốt）: 皿に、つやのある緑のブロッコリー、カリフラワー、花形のにんじん
    vn_bongcaixao: p => [
        xvn_Plate(p),
        K.glaze(p, 100, 102, 124, '#d8c08a', { op: .45 }),
        ...[[72, 74, 0], [112, 66, 30], [144, 96, -20], [62, 110, 40], [100, 100, 10], [136, 132, -30], [78, 140, 20], [114, 138, 60]].map(([x, y, r], i) => i % 4 === 3 ? K.broccoli(p, x, y, 34, r, { c: '#efe6cc' }) : K.broccoli(p, x, y, 36, r, { c: '#3f8a34' })),
        ...[[92, 80], [126, 112], [84, 120], [118, 86], [146, 118], [60, 92]].map(([x, y], i) => `<g ${K.T(x, y, i * 25)}><g ${p.sh(.4)}><path d="${smooth(Array.from({ length: 10 }, (_, j) => { const a = j / 10 * 6.28, rr = j % 2 ? 4.6 : 6.6; return [Math.cos(a) * rr, Math.sin(a) * rr]; }), true, .6)}" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b8561a" stroke-width=".5"/></g><circle r="2.2" fill="#f8b070"/></g>`),
        xvn_FriedGarlic(p, 100, 100, 100, 18),
    ].join(''),

    // いんげんのにんにく炒め（đậu que xào tỏi）: 皿に、斜め切りのいんげん、にんじん、揚げにんにく
    vn_dauquexao: p => [
        xvn_Plate(p),
        xvn_Mound(p, 100, 100, 134, '#4a8a30'),
        `<g ${p.sh(.5)}>`,
        ...xvn_Spots('dq', 32, 60, 12).map(([x, y, r], i) => xvn_Bean(p, x, y, 30, r, { c: i % 3 ? '#4f9a34' : '#5aa83c' })),
        `</g>`,
        xvn_Batons(p, 100, 100, 110, { c: '#f08a3a', n: 12, w: 3.2, len: 18, seed: 2 }),
        `<g ${p.sh(.4)}>`, ...xvn_Spots('dq2', 10, 52, 16).map(([x, y, r]) => xvn_Bean(p, x, y, 28, r, { c: '#56a238' })), `</g>`,
        xvn_FriedGarlic(p, 100, 100, 110, 34),
        xvn_Pepper(p, 100, 100, 100, 20),
    ].join(''),

    // チンゲン菜としいたけのオイスター炒め（cải thìa xào nấm）: 皿に、半割りのチンゲン菜を放射状、しいたけ、とろみのあん
    vn_caithiaxaonam: p => [
        xvn_Plate(p),
        `<g ${p.sh(.5)}>`,
        ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * 360 + 10, rad = a * Math.PI / 180; return xvn_BokChoy(p, 100 + Math.cos(rad) * 36, 100 + Math.sin(rad) * 36, 74, a, { seed: i }); }),
        `</g>`,
        K.glaze(p, 100, 100, 110, '#8a5a2a', { op: .35 }),
        `<g ${p.sh(.6)}>`, ...[[100, 100], [84, 86], [118, 88], [92, 118], [118, 116], [100, 72]].map(([x, y], i) => K.shiitake(p, x, y, 22, i * 40)), `</g>`,
        xvn_FriedGarlic(p, 100, 100, 70, 14),
    ].join(''),

    // とうもろこしと干しえびのねぎ油炒め（bắp xào tép mỡ hành）: 白い小鉢に、黄色いコーンの粒、赤い干しえび、緑のねぎ油
    vn_bapxao: p => [
        xvn_SmallBowl(p),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#e8b62a', .2, .25)}"/>`,
        xvn_Grains(p, 100, 100, 150, { cols: ['#f6cf3a', '#fbe070', '#e8b020'], n: 230, size: 3.6, seed: 1 }),
        xvn_Grains(p, 100, 100, 140, { cols: ['#fff2b0'], n: 70, size: 1.3, seed: 2 }),
        xvn_DriedShrimp(p, 100, 100, 120, 26),
        xvn_Grains(p, 100, 100, 130, { cols: ['#4fa034', '#6cbc44', '#3a8a2a'], n: 60, size: 2.2, seed: 4 }),
        xvn_Oil(p, 100, 100, 130, { n: 10, c: '#f6d040', op: .5, rmax: 2 }),
    ].join(''),

    // ゆでオクラとヌックマム（đậu bắp luộc）: 皿に、丸ごとゆでたオクラを並べ、唐辛子入りのたれ
    vn_daubapluoc: p => [
        xvn_GlazePlate(p, { glaze: '#5f8a6a', inside: '#f6f4ea' }),
        ...[[70, 56, 160], [64, 76, 164], [60, 96, 170], [62, 116, 176], [70, 136, 182], [126, 58, 20], [134, 78, 16], [138, 98, 10], [96, 66, 100], [100, 112, 84], [88, 150, 200]].map(([x, y, r]) => xvn_OkraPod(p, x, y, 54, r)),
        xvn_DipBowl(p, 136, 134, 20, '#c9842e'),
    ].join(''),

    // ゆで野菜とコックェット（rau củ luộc chấm kho quẹt）: 皿に、ゆでたキャベツ・にんじん・いんげん・オクラ、真ん中に土鍋の濃い飴色のたれ
    vn_khoquet: p => [
        xvn_Plate(p),
        `<g ${p.sh(.6)}>`,
        ...[[62, 82, 40, 20], [88, 58, 40, -30], [60, 118, 40, 80]].map(([x, y, s, r], i) => xvn_BoiledCabbage(p, x, y, s, r, { seed: i + 1 })),
        ...[[128, 56, -20], [142, 70, -30], [150, 88, -40]].map(([x, y, r]) => K.greenBean(p, x, y, 40, r)),
        ...[[138, 124], [128, 140], [148, 108], [112, 148]].map(([x, y], i) => K.carrotRound(p, x, y, 14, { r: i * 30 })),
        xvn_OkraPod(p, 78, 146, 36, 30), xvn_OkraPod(p, 92, 152, 34, 10),
        `</g>`,
        `<g ${p.sh(1.4)}><circle cx="104" cy="100" r="30" fill="${p.rg('#9a5634', .2, .35, .35, .3)}"/></g>`,
        `<circle cx="104" cy="100" r="26" fill="none" stroke="#b9714a" stroke-width="2.4"/>`,
        `<circle cx="104" cy="100" r="23" fill="${p.rg('#5a2a0c', .25, .3, .42, .4)}"/>`,
        xvn_Grains(p, 104, 100, 40, { cols: ['#e8b070', '#f4d090'], n: 12, size: 2.4, seed: 5 }),
        xvn_DriedShrimp(p, 104, 100, 36, 10, 6),
        xvn_Chili(p, 98, 104, 5, 0), xvn_Chili(p, 112, 94, 4.6, 0),
        xvn_Pepper(p, 104, 100, 36, 14),
        xvn_Shine('M90,92 Q94,82 104,80', 1.6, .6),
    ].join(''),

    // 大根と干しえびの煮もの（củ cải trắng kho tép）: 土鍋に、飴色に煮えた大根、小さな干しえび、ねぎ、こしょう
    vn_cucaikho: p => [
        xvn_ClayPot(p),
        K.liquid(p, { R: 80, c: '#8a4a1a', op: 1, shine: false }),
        `<g ${p.sh(.5)}>`, ...xvn_Spots('cck', 14, 56, 24).map(([x, y, r], i) => xvn_DaikonPiece(p, x, y, 28, r, { seed: i, c: i % 2 ? '#c98a3e' : '#d49a4c' })), `</g>`,
        xvn_DriedShrimp(p, 100, 100, 130, 30),
        xvn_SoupShine(100, 100, 80, .3),
        `<g ${p.sh(.4)}>`, ...[[90, 96, 30], [124, 116, -40], [70, 120, 70], [118, 76, 10]].map(([x, y, r]) => xvn_Scallion(p, x, y, 14, r)), `</g>`,
        K.scallions(p, 100, 100, 100, { n: 12, c: '#4f9a34' }),
        xvn_Pepper(p, 100, 100, 110, 30),
    ].join(''),
    // 蓮の茎とえび・豚のサラダ（gỏi ngó sen tôm thịt）: 皿に、白い蓮の茎、半割りのえび、豚の薄切り、にんじん、ラウラム、ピーナッツ、えびせん
    vn_goingosen: p => [
        xvn_Plate(p),
        xvn_Cracker(p, 48, 74, 40, 0, { seed: 1 }), xvn_Cracker(p, 150, 136, 38, 30, { seed: 2 }),
        xvn_Mound(p, 100, 102, 116, '#efe8d6'),
        xvn_Batons(p, 100, 102, 112, { c: '#f2ece0', n: 14, w: 6, len: 40, seed: 1 }),
        xvn_Shreds(p, 100, 102, 104, { c: '#ef8034', n: 26, w: 1.8, len: .3, seed: 2 }),
        ...[[84, 84, 20], [134, 122, 60], [80, 136, 100]].map(([x, y, r], i) => xvn_Layered(p, x, y, 32, 12, r, [['#e9d0a0', .15], ['#fbf6ea', .35], ['#d9b49c', .5]], { seed: i, edge: '#b89276', flat: true })),
        ...[[100, 70, -30], [138, 96, 40], [72, 108, 120], [108, 128, 10]].map(([x, y, r], i) => xvn_Shrimp(p, x, y, 40, r, { seed: i, c: '#f07a50' })),
        `<g ${p.sh(.4)}>`, ...[[72, 82, 30], [132, 70, -40], [66, 128, -10], [112, 92, 100]].map(([x, y, r]) => xvn_Leaf(p, x, y, 20, r, { c: '#3a8a2c', narrow: .6, spot: true })), `</g>`,
        xvn_Peanuts(p, 102, 102, 80, 26),
        xvn_FriedShallot(p, 100, 104, 70, 20, 3),
        xvn_Chili(p, 86, 96, 6, 0), xvn_Chili(p, 120, 128, 6, 0),
    ].join(''),

    // 青パパイヤのサラダ（nộm đu đủ）: 皿に、うす緑の青パパイヤの千切り、にんじん、香草、ピーナッツ、唐辛子
    vn_nomdudu: p => [
        xvn_Plate(p),
        xvn_Mound(p, 100, 102, 134, '#dfe8bc'),
        xvn_Shreds(p, 100, 102, 130, { c: '#cfe0a0', n: 150, w: 2.6, len: .24, seed: 1, curve: .4 }),
        xvn_Shreds(p, 100, 102, 126, { c: '#eef2d8', n: 110, w: 2.4, len: .24, seed: 2, curve: .4 }),
        xvn_Shreds(p, 100, 102, 116, { c: '#ef8034', n: 50, w: 2.2, len: .24, seed: 3, curve: .4 }),
        `<g ${p.sh(.4)}>`, ...[[74, 80, 30], [128, 74, -40], [140, 120, 60], [70, 126, -10], [104, 140, 100], [100, 98, 10]].map(([x, y, r], i) => xvn_Leaf(p, x, y, 18, r, { c: i % 2 ? '#2f7a2a' : '#3a8a2c', narrow: .7, spot: i % 2 === 0 })), `</g>`,
        xvn_Peanuts(p, 102, 100, 70, 30),
        xvn_Chili(p, 88, 108, 6, 0), xvn_Chili(p, 118, 92, 6, 0), xvn_Chili(p, 110, 120, 5.4, 0),
    ].join(''),

    // レタスとトマトの酢油あえ（xà lách trộn dầu giấm）: 皿に、レタス、輪切りのトマト、玉ねぎの輪、きゅうり、ゆで卵
    vn_xalachdaugiam: p => [
        xvn_Plate(p),
        `<g ${p.sh(.6)}>`, ...[[66, 72, 20], [110, 60, -10], [146, 92, 40], [140, 136, 120], [96, 146, 180], [56, 124, 220], [100, 100, 0]].map(([x, y, r], i) => xvn_SoupLeaf(p, x, y, 54, r, { c: i % 2 ? '#a6d064' : '#8cc04c', seed: i, shape: 'serrate' })), `</g>`,
        ...[[78, 84], [124, 80], [84, 124]].map(([x, y]) => `<g ${p.sh(.5)}><circle cx="${x}" cy="${y}" r="15" fill="${p.g('#e5382a', .3, .25)}" stroke="#a8221a" stroke-width=".6"/></g><circle cx="${x}" cy="${y}" r="11" fill="#f06a52"/><path d="M${x - 6},${y - 3} Q${x - 2},${y - 8} ${x + 2},${y - 3} M${x + 1},${y + 2} Q${x + 5},${y - 2} ${x + 8},${y + 3} M${x - 7},${y + 4} Q${x - 4},${y + 1} ${x - 1},${y + 6}" stroke="#f9d36b" stroke-width="1.6" fill="none"/>`),
        `<g ${p.sh(.4)}>`, ...[[106, 106, 1], [134, 112, 1.2], [64, 102, 1.1]].map(([x, y, k]) => `<ellipse cx="${x}" cy="${y}" rx="${12 * k}" ry="${10 * k}" fill="none" stroke="#f2e8f0" stroke-width="2.4"/><ellipse cx="${x}" cy="${y}" rx="${12 * k}" ry="${10 * k}" fill="none" stroke="#c8a8c8" stroke-width=".6"/><ellipse cx="${x}" cy="${y}" rx="${8 * k}" ry="${6.5 * k}" fill="none" stroke="#f2e8f0" stroke-width="2"/>`), `</g>`,
        ...[[112, 132], [136, 92], [100, 76]].map(([x, y], i) => K.cucumberSlice(p, x, y, 15, i * 40, { oval: 1.1 })),
        K.eggHalf(p, 120, 124, 26, 20), K.eggHalf(p, 70, 140, 22, -30),
        xvn_Pepper(p, 100, 100, 100, 20),
    ].join(''),

    // 生春巻き（gỏi cuốn）: 長皿に、えびの透ける生春巻き、ハーブ、ピーナッツをのせた甘味噌のたれ
    vn_goicuon: p => [
        K.longPlate(p, { base: '#f6f3ec', rim: XVN_BLUE }),
        ...[[72, 64, -4], [74, 100, -2], [76, 136, 0], [146, 68, 90]].map(([x, y, r], i) => xvn_FreshRoll(p, x, y, i === 3 ? 56 : 96, 32, r, { seed: i })),
        `<g ${p.sh(.4)}>`, xvn_Leaf(p, 130, 112, 22, -60, { c: '#3a8a2c' }), xvn_Leaf(p, 168, 104, 18, 60, { c: '#4a9a34' }), `</g>`,
        `<g ${p.sh(1.1)}><circle cx="148" cy="126" r="22" fill="${p.rg('#f8f6f0', .2, .15, .38, .32)}"/></g>`,
        `<circle cx="148" cy="126" r="20.4" fill="none" stroke="${XVN_BLUE}" stroke-width="1.5"/>`,
        `<circle cx="148" cy="126" r="17" fill="${p.rg('#7a3a1e', .25, .2, .4, .38)}"/>`,
        xvn_Peanuts(p, 148, 124, 20, 12, 3), xvn_Chili(p, 154, 132, 4.6, 0),
        xvn_Shine('M138,118 Q141,112 148,110', 1.4, .6),
    ].join(''),

    // 青菜の漬けもの（dưa cải chua）: 白い小鉢に、黄色っぽく漬かったからし菜、エシャロット、唐辛子、漬け汁
    vn_duacai: p => [
        xvn_SmallBowl(p),
        K.liquid(p, { R: 76, c: '#e8dc9a', op: .8, shine: false }),
        `<g ${p.sh(.5)}>`, ...xvn_Spots('dc', 12, 54, 26).map(([x, y, r], i) => xvn_PickledGreen(p, x, y, 44, r, { seed: i, c: i % 2 ? '#a8a838' : '#bab44a' })), `</g>`,
        `<g ${p.sh(.4)}>`, ...xvn_Spots('dc2', 5, 46, 30).map(([x, y, r], i) => xvn_PickledGreen(p, x, y, 38, r, { seed: i + 20, c: '#9a9e30' })), `</g>`,
        ...[[86, 92], [122, 110], [100, 126]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="4" fill="none" stroke="#e8c8d0" stroke-width="1.6" opacity=".9"/>`),
        xvn_Chili(p, 110, 86, 7, 0), xvn_Chili(p, 76, 116, 6, 0),
        xvn_SoupShine(100, 100, 76, .35),
    ].join(''),

    // もやしの漬けもの（dưa giá）: 白い小鉢に、漬け汁にもやし、にら、にんじんの千切り
    vn_duagia: p => [
        xvn_SmallBowl(p),
        K.liquid(p, { R: 76, c: '#ece2b8', op: .7, shine: false }),
        xvn_Sprouts(p, 100, 100, 150, { n: 90, seed: 1 }),
        xvn_Shreds(p, 100, 100, 124, { c: '#ef8034', n: 22, w: 2, len: .28, seed: 2 }),
        `<g ${p.sh(.4)}>`, ...[[80, 80, 20], [124, 92, -40], [96, 120, 70], [70, 108, -10], [130, 122, 30], [108, 70, 120]].map(([x, y, r]) => `<g ${K.T(x, y, r)}><rect x="-14" y="-1.6" width="28" height="3.2" rx="1.6" fill="${p.g('#4f9a34', .3, .2)}" stroke="#2a6a1e" stroke-width=".4"/></g>`), `</g>`,
        xvn_Sprouts(p, 100, 100, 120, { n: 30, seed: 3 }),
        xvn_SoupShine(100, 100, 76, .4),
    ].join(''),

    // 小なすの塩漬け（cà pháo muối）: 白い小鉢に、うす黄緑の丸い小なす、唐辛子、生姜、にんにく
    vn_caphaomuoi: p => [
        xvn_SmallBowl(p),
        K.liquid(p, { R: 76, c: '#e6dcaa', op: .75, shine: false }),
        ...xvn_Spots('cp', 15, 56, 27).map(([x, y, r], i) => xvn_CaPhao(p, x, y, 28, r, { half: i % 5 === 2 })),
        xvn_Chili(p, 100, 100, 8, 0), xvn_Chili(p, 76, 128, 7, 0), xvn_Chili(p, 130, 76, 7, 0),
        ...[[118, 120], [82, 82]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="4" fill="#f6e8b0" stroke="#d8c070" stroke-width=".6"/>`),
        xvn_SoupShine(100, 100, 76, .4),
    ].join(''),

    // 揚げ春巻き（chả giò）: 皿にレタスと香草、こんがり揚げた春巻き（切り口つき）、ヌックマムのたれ
    vn_chagio: p => [
        xvn_Plate(p),
        `<g ${p.sh(.6)}>`, ...[[60, 70, 30], [52, 112, 80], [70, 146, 130], [140, 58, -20]].map(([x, y, r], i) => xvn_SoupLeaf(p, x, y, 50, r, { c: i % 2 ? '#a6d064' : '#8cc04c', seed: i, shape: 'serrate' })), `</g>`,
        ...[[96, 72, -20, 0], [102, 94, -18, 1], [94, 118, -22, 0], [108, 140, -16, 1], [130, 108, 70, 0]].map(([x, y, r, c], i) => xvn_FriedRoll(p, x, y, 60, 18, r, { seed: i, cut: !!c })),
        `<g ${p.sh(.4)}>`, xvn_Leaf(p, 66, 98, 20, 30, { c: '#2f7a2a' }), xvn_Leaf(p, 72, 128, 18, 80, { c: '#3a8a2c', spot: true }), `</g>`,
        xvn_DipBowl(p, 148, 140, 18, '#d49a4a'),
    ].join(''),

    // 塩炒りピーナッツ（lạc rang muối）: 白い小鉢に、赤い薄皮のピーナッツ、白い塩
    vn_lacrang: p => [
        xvn_SmallBowl(p),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#7a3020', .2, .3)}"/>`,
        xvn_Grains(p, 100, 100, 150, { cols: ['#6a2618', '#8a3a26', '#a8523a', '#e0bc84'], n: 110, size: 5.5, seed: 1 }),
        `<g ${p.sh(.5)}>`, ...xvn_Spots('lr', 34, 64, 17).map(([x, y, r], i) => xvn_Peanut(p, x, y, 23, r, { skin: i % 4 !== 1, seed: i })), `</g>`,
        K.sprinkle(p, 100, 100, 140, { c: '#fbf8f0', n: 60, r: .7 }),
    ].join(''),

    // 牛肉のライム和え（bò tái chanh）: 皿に、ライムで白っぽく締まった牛の薄切り、玉ねぎ、香草、ピーナッツ、揚げエシャロット、唐辛子、ライム
    vn_botaichanh: p => [
        xvn_Plate(p),
        `<g ${p.sh(.6)}>`,
        ...[[72, 76, 20], [112, 66, -30], [142, 100, 60], [62, 112, 100], [102, 100, 10], [132, 134, -40], [82, 140, 70], [118, 118, 160], [94, 74, 120], [148, 74, 30], [104, 146, -20]].map(([x, y, r], i) => K.beefSlice(p, x, y, 44, r, { seed: i, c: i % 2 ? '#c88a7c' : '#d8988a' })),
        `</g>`,
        `<g ${p.sh(.4)}>`, ...[[88, 92, 20], [124, 86, -40], [98, 124, 70], [72, 98, -10], [130, 114, 40]].map(([x, y, r]) => K.onion(p, x, y, 18, r, { c: '#f2e4ec', layers: 1 })), `</g>`,
        `<g ${p.sh(.4)}>`, ...[[80, 70, 30], [136, 72, -40], [148, 118, 60], [66, 128, -10], [108, 142, 100]].map(([x, y, r], i) => xvn_Leaf(p, x, y, 18, r, { c: i % 2 ? '#2f7a2a' : '#4a9a34', narrow: .7, spot: i % 2 === 0 })), xvn_Sawtooth(p, 110, 98, 26, -30), `</g>`,
        xvn_Peanuts(p, 102, 100, 76, 26),
        xvn_FriedShallot(p, 100, 104, 70, 26, 3),
        xvn_Chili(p, 92, 108, 6, 0), xvn_Chili(p, 118, 96, 6, 0),
        xvn_Lime(p, 150, 80, 22, 40),
    ].join(''),
    // あまめしばのスープ（canh rau ngót thịt bằm）: 白い鉢に、澄んだスープ、小さな楕円の濃い緑の葉がたっぷり、豚ひき肉、ねぎ
    vn_canhraungot: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#d6d09a', { op: .9, cloud: .2 }),
        xvn_LeafSwarm(p, 100, 100, 138, { n: 60, size: 10, minD: 10 }),
        xvn_Grains(p, 100, 100, 130, { cols: ['#b89a7a', '#9a7a5a', '#c8ac8a'], n: 50, size: 2.2, seed: 2 }),
        K.scallions(p, 100, 100, 110, { n: 16, c: '#5aa83a' }),
        xvn_Pepper(p, 100, 100, 80, 16),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // からし菜とえびのスープ（canh cải xanh nấu tôm）: 白い鉢に、澄んだスープ、大きなからし菜の葉と軸、むきえび、生姜
    vn_canhcaixanh: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#dcd6a6', { op: .88, cloud: .2 }),
        `<g ${p.sh(.5)}>`, ...[[72, 76, 30], [118, 70, -20], [142, 108, 70], [70, 120, 110], [104, 104, 10], [118, 142, 160], [84, 146, 200]].map(([x, y, r], i) => xvn_SoupLeaf(p, x, y, 46, r, { c: i % 2 ? '#4a8a30' : '#5a9a3a', seed: i, stem: 26 })), `</g>`,
        ...[[96, 82, 20], [130, 92, -60], [86, 118, 120], [120, 122, 200]].map(([x, y, r]) => K.shrimp(p, x, y, 24, r, { c: '#f2865a' })),
        xvn_Ginger(p, 100, 100, 100, 16),
        xvn_Pepper(p, 100, 100, 70, 12),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // つるむらさきとへちまのスープ（canh mồng tơi mướp）: 白い鉢に、少しとろみのある緑がかったスープ、丸いつやのある葉、へちま、干しえび
    vn_canhmongtoi: p => [
        xvn_GlazeBowl(p, '#8fb8a0'),
        xvn_Broth(p, '#bcc884', { op: .92, cloud: .25 }),
        `<g ${p.sh(.5)}>`, ...xvn_Spots('mt', 13, 58, 26).map(([x, y, r], i) => xvn_SoupLeaf(p, x, y, 38, r, { c: i % 2 ? '#2a6a22' : '#357a2a', seed: i, shape: 'round' })), `</g>`,
        ...[[86, 92, 20], [124, 86, -30], [106, 124, 60], [70, 128, 10], [140, 124, -50]].map(([x, y, r], i) => xvn_MelonChunk(p, x, y, 22, r, { flesh: '#e6ecc0', skin: '#3f7a2a', seed: i })),
        xvn_DriedShrimp(p, 100, 100, 110, 14),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // 冬瓜とえびのスープ（canh bí xanh nấu tôm）: 白い鉢に、澄んだスープ、透き通った冬瓜、えび、ねぎ、パクチー
    vn_canhbixanh: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#e4ddb8', { op: .88, cloud: .2 }),
        `<g ${p.sh(.4)}>`, ...xvn_Spots('bx', 12, 58, 27).map(([x, y, r], i) => xvn_MelonChunk(p, x, y, 28, r, { flesh: '#e2ecc4', skin: '#5a9a44', seed: i })), `</g>`,
        ...[[94, 86, 20], [124, 112, -60], [80, 124, 120], [118, 72, 200]].map(([x, y, r]) => K.shrimp(p, x, y, 24, r, { c: '#f2865a' })),
        K.scallions(p, 100, 100, 110, { n: 16, c: '#5aa83a' }),
        xvn_Coriander(p, 106, 104, 20, 30), xvn_Coriander(p, 66, 92, 16, -40),
        xvn_Pepper(p, 100, 100, 70, 12),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // ゴーヤの肉詰めスープ（canh khổ qua nhồi thịt）: 白い鉢に、澄んだスープ、肉を詰めたゴーヤの輪切り、ねぎ、パクチー
    vn_canhkhoqua: p => [
        xvn_GlazeBowl(p, '#8fb8a0'),
        xvn_Broth(p, '#d4cc94', { op: .9, cloud: .2 }),
        ...[[74, 76, 0], [124, 72, 30], [140, 116, 60], [98, 108, 15], [62, 118, 45], [106, 146, 80]].map(([x, y, r], i) => xvn_StuffedGoya(p, x, y, 40, r, { seed: i })),
        K.scallions(p, 100, 100, 120, { n: 16, c: '#5aa83a' }),
        xvn_Coriander(p, 98, 80, 18, 20), xvn_Coriander(p, 134, 140, 16, -40),
        xvn_Pepper(p, 100, 100, 80, 14),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // キャベツの肉巻きスープ（canh bắp cải cuộn thịt）: 白い鉢に、澄んだスープ、ねぎで結んだキャベツの肉巻き、こしょう
    vn_canhbapcai: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#e0d8b0', { op: .88, cloud: .2 }),
        ...[[74, 78, 30], [126, 76, -30], [70, 122, -40], [100, 104, 80], [130, 124, 20], [100, 146, -10]].map(([x, y, r], i) => xvn_CabbageRoll(p, x, y, 44, 22, r, { seed: i })),
        ...[[104, 66], [146, 98], [56, 100]].map(([x, y], i) => xvn_WoodEar(p, x, y, 12, i * 50)),
        K.scallions(p, 100, 100, 120, { n: 12, c: '#5aa83a' }),
        xvn_Pepper(p, 100, 100, 110, 30),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // にらと絹豆腐のスープ（canh hẹ đậu hũ）: 白い鉢に、澄んだスープ、白い豆腐、緑のにら、豚ひき肉、こしょう
    vn_canhhedauhu: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#e6e0c2', { op: .88, cloud: .2 }),
        ...[[78, 78, 8], [114, 74, -10], [140, 104, 14], [72, 114, -6], [106, 108, 12], [128, 136, -14], [88, 140, 6]].map(([x, y, r]) => K.tofu(p, x, y, 24, 24, r)),
        `<g ${p.sh(.4)}>`, ...[[94, 92, 20], [126, 90, -40], [92, 126, 70], [62, 96, -10], [116, 122, 30], [100, 64, 120], [146, 128, 60], [70, 136, -30], [138, 76, 10]].map(([x, y, r]) => `<g ${K.T(x, y, r)}><rect x="-14" y="-1.8" width="28" height="3.6" rx="1.8" fill="${p.g('#3f8f2f', .3, .2)}" stroke="#2a6a1e" stroke-width=".4"/></g>`), `</g>`,
        xvn_Grains(p, 100, 100, 130, { cols: ['#c4a080', '#a8845e'], n: 40, size: 2, seed: 2 }),
        xvn_Pepper(p, 100, 100, 100, 26),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // あさりとトマトの酸っぱいスープ（canh ngao nấu chua）: 白い鉢に、トマト色の澄んだスープ、殻つきのあさり、トマト、ディル
    vn_canhngao: p => [
        xvn_GlazeBowl(p, '#2f5f8f'),
        xvn_Broth(p, '#e8a868', { op: .88, cloud: .2 }),
        `<g ${p.sh(.5)}>`, ...xvn_Spots('ng', 14, 60, 22).map(([x, y, r]) => K.clam(p, x, y, 26, r)), `</g>`,
        xvn_Tomato(p, 98, 98, 22, 20, { seed: 1 }), xvn_Tomato(p, 136, 120, 20, -40, { seed: 2 }), xvn_Tomato(p, 70, 126, 20, 60, { seed: 3 }),
        `<g ${p.sh(.3)}>`, xvn_Dill(p, 110, 80, 34, -20), xvn_Dill(p, 84, 112, 30, 40), xvn_Dill(p, 124, 140, 28, 10), `</g>`,
        K.scallions(p, 100, 100, 100, { n: 10, c: '#5aa83a' }),
        xvn_Oil(p, 100, 100, 130, { n: 8, c: '#f2b04a', op: .5, rmax: 1.8 }),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // 大根と豚スペアリブのスープ（canh củ cải sườn heo）: 白い鉢に、澄んだスープ、半透明の大根、にんじん、骨つきのスペアリブ、ねぎ、パクチー
    vn_canhcucai: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#dfd0a0', { op: .88, cloud: .2 }),
        ...[[72, 76, 20], [122, 66, -30], [60, 114, 60], [110, 104, 10], [142, 130, -40], [92, 144, 70], [146, 88, 80], [84, 100, -60]].map(([x, y, r], i) => xvn_DaikonPiece(p, x, y, 34, r, { c: '#eee8d4', seed: i })),
        ...[[78, 60, -30], [122, 146, 100], [126, 84, 40], [76, 124, 0]].map(([x, y, r]) => K.carrotChunk(p, x, y, 20, r)),
        ...[[132, 106, 70], [100, 126, -20], [98, 74, 110], [64, 140, 30]].map(([x, y, r], i) => xvn_Rib(p, x, y, 34, r, { c: '#c49478', seed: i })),
        K.scallions(p, 100, 100, 110, { n: 14, c: '#5aa83a' }),
        xvn_Coriander(p, 112, 90, 18, 20), xvn_Coriander(p, 76, 136, 16, -40),
        xvn_Pepper(p, 100, 100, 80, 14),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // 豚肉団子のスープ（canh mọc）: 白い鉢に、澄んだスープ、白っぽい肉団子、しいたけ、きくらげ、春雨、ねぎ、パクチー
    vn_canhmoc: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#ddd0a0', { op: .88, cloud: .2 }),
        xvn_Vermicelli(p, 100, 100, 130, { c: '#f4f0e0', n: 20, w: 1.3, clear: true, seed: 2 }),
        ...[[76, 78], [118, 72], [140, 110], [70, 116], [104, 102], [118, 140], [84, 144]].map(([x, y]) => xvn_PorkBall(p, x, y, 28)),
        `<g ${p.sh(.4)}>`, ...[[96, 74], [134, 86], [92, 126], [56, 96]].map(([x, y], i) => K.shiitake(p, x, y, 16, i * 40, { cross: false })), `</g>`,
        ...[[122, 92, 20], [104, 132, -30], [140, 134, 60], [66, 136, 0]].map(([x, y, r], i) => xvn_WoodEar(p, x, y, 14, r, { seed: i })),
        K.scallions(p, 100, 100, 110, { n: 16, c: '#5aa83a' }),
        xvn_Coriander(p, 92, 98, 18, 20), xvn_Coriander(p, 126, 116, 16, -40),
        xvn_Pepper(p, 100, 100, 80, 16),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),
    // 鶏ととうもろこしのとろみスープ（súp gà ngô）: 白い鉢に、とろりとした黄色いスープ、コーン、裂いた鶏肉、溶き卵、にんじん、パクチー
    vn_supgango: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#efd27c', { op: 1, cloud: .3, lightC: '#f8e6a8' }),
        xvn_EggCloud(p, 84, 82, 44, -15, { seed: 1, op: .8 }), xvn_EggCloud(p, 124, 112, 40, 30, { seed: 2, op: .8 }), xvn_EggCloud(p, 92, 132, 36, 60, { seed: 3, op: .8 }),
        xvn_ShreddedChicken(p, 104, 98, 90, { n: 14 }),
        xvn_Grains(p, 100, 100, 140, { cols: ['#f6c832', '#fbe070', '#e8a818'], n: 70, size: 3.4, seed: 1 }),
        ...[[78, 108], [128, 84], [110, 142], [140, 128], [64, 90]].map(([x, y], i) => xvn_Dice(p, x, y, 6, i * 20, '#ef7f30')),
        xvn_Coriander(p, 100, 96, 20, 20), xvn_Coriander(p, 134, 66, 16, -40),
        K.scallions(p, 100, 100, 100, { n: 10, c: '#4f9a34' }),
        xvn_Pepper(p, 100, 100, 100, 26),
        xvn_SoupShine(100, 100, 79, .4),
    ].join(''),

    // 蟹と卵のとろみスープ（súp cua）: 白い鉢に、とろりとしたクリーム色のスープ、ほぐした蟹身、卵の帯、しいたけ、コーン、パクチー、こしょう
    vn_supcua: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#ead8a8', { op: 1, cloud: .3, lightC: '#f6ead0' }),
        K.eggRibbons(p, 100, 100, 120, { n: 14 }),
        xvn_Shreds(p, 100, 100, 120, { c: '#f6efe2', n: 50, w: 2.4, len: .14, seed: 2, curve: .6 }),
        xvn_Shreds(p, 100, 100, 110, { c: '#ef8a5a', n: 24, w: 2.2, len: .12, seed: 3, curve: .6 }),
        xvn_Grains(p, 100, 100, 120, { cols: ['#6a4428', '#8a5a34'], n: 26, size: 2.2, seed: 4 }),
        xvn_Grains(p, 100, 100, 120, { cols: ['#f6c832', '#fbe070'], n: 24, size: 2.8, seed: 5 }),
        xvn_Coriander(p, 100, 96, 22, 20), xvn_Coriander(p, 128, 120, 16, -40),
        K.scallions(p, 100, 100, 90, { n: 10, c: '#4f9a34' }),
        xvn_Pepper(p, 100, 100, 100, 30),
        xvn_SoupShine(100, 100, 79, .4),
    ].join(''),

    // 紫山芋とえびのスープ（canh khoai mỡ nấu tôm）: 白い鉢に、とろりとした紫のスープ、えび、ノコギリコリアンダー・ねぎ
    vn_canhkhoaimo: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#8a5aa0', { op: 1, cloud: .25, lightC: '#b088c4' }),
        xvn_Grains(p, 100, 100, 140, { cols: ['#a07ab8', '#7a4a90'], n: 40, size: 2.4, seed: 1 }),
        ...[[84, 80, 20], [124, 88, -60], [92, 122, 120], [130, 128, 200], [64, 108, 60]].map(([x, y, r]) => K.shrimp(p, x, y, 26, r, { c: '#f28a62' })),
        `<g ${p.sh(.4)}>`, xvn_Sawtooth(p, 108, 104, 30, -30), xvn_Sawtooth(p, 74, 136, 26, 40), `</g>`,
        xvn_LeafSwarm(p, 104, 100, 90, { cols: ['#3f8a2c', '#4f9a34'], n: 10, size: 6, minD: 14, seed: 2 }),
        K.scallions(p, 100, 100, 110, { n: 16, c: '#6cbc44' }),
        xvn_Pepper(p, 100, 100, 80, 14),
        xvn_SoupShine(100, 100, 79, .4),
    ].join(''),

    // 白身魚とディルのスープ（canh cá nấu thì là）: 白い鉢に、トマトでうす橙の澄んだスープ、白身魚の切り身、トマト、たっぷりのディル、油の玉
    vn_canhcathila: p => [
        xvn_GlazeBowl(p, '#2f5f8f'),
        xvn_Broth(p, '#e8b070', { op: .9, cloud: .2 }),
        ...[[74, 80, -10], [124, 76, 30], [96, 116, 10], [142, 118, -30], [62, 126, 40], [112, 148, 0]].map(([x, y, r], i) => xvn_FishChunk(p, x, y, 40, r, { seed: i })),
        xvn_Tomato(p, 104, 90, 22, 20, { seed: 1 }), xvn_Tomato(p, 78, 146, 18, -40, { seed: 2 }), xvn_Tomato(p, 146, 92, 18, 60, { seed: 3 }),
        `<g ${p.sh(.3)}>`, xvn_Dill(p, 100, 70, 40, -10), xvn_Dill(p, 82, 104, 36, 50), xvn_Dill(p, 130, 104, 34, -40), xvn_Dill(p, 86, 140, 30, 20), `</g>`,
        xvn_Ginger(p, 110, 110, 60, 8),
        xvn_Oil(p, 100, 100, 140, { n: 14, c: '#f2b84a', op: .6, rmax: 2.4 }),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // 高菜漬けと牛肉の酸っぱいスープ（canh dưa chua thịt bò）: 白い鉢に、うす茶の澄んだスープ、黄緑の漬け菜、牛肉の薄切り、トマト、パクチー
    vn_canhduabo: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#d8aa6a', { op: .88, cloud: .2 }),
        `<g ${p.sh(.4)}>`, ...[[72, 80, 30], [122, 70, -20], [142, 110, 70], [70, 124, 110], [104, 100, 10], [114, 140, 160]].map(([x, y, r], i) => xvn_PickledGreen(p, x, y, 40, r, { seed: i, c: i % 2 ? '#a8a838' : '#b8b04a' })), `</g>`,
        `<g ${p.sh(.5)}>`, ...[[96, 76, 20], [130, 94, -30], [86, 112, 60], [120, 120, 10], [84, 146, -40]].map(([x, y, r], i) => K.beefSlice(p, x, y, 28, r, { seed: i, c: '#8a5a3a' })), `</g>`,
        xvn_Tomato(p, 108, 92, 18, 20, { seed: 1 }), xvn_Tomato(p, 60, 100, 16, -40, { seed: 2 }), xvn_Tomato(p, 144, 136, 16, 60, { seed: 3 }),
        xvn_Coriander(p, 100, 128, 18, 20),
        K.scallions(p, 100, 100, 110, { n: 14, c: '#5aa83a' }),
        xvn_Oil(p, 100, 100, 130, { n: 8, c: '#f2b04a', op: .5, rmax: 1.8 }),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // 春菊と豚団子のスープ（canh cải cúc thịt bằm）: 白い鉢に、澄んだスープ、切れ込みのある春菊の葉、小さな豚団子、こしょう
    vn_canhcaicuc: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#d6d29c', { op: .88, cloud: .2 }),
        `<g ${p.sh(.5)}>`, ...xvn_Spots('cc', 12, 58, 26).map(([x, y, r], i) => xvn_SoupLeaf(p, x, y, 40, r, { c: i % 2 ? '#3a7a2a' : '#4a8a34', seed: i, shape: 'serrate', stem: i % 3 === 0 ? 22 : null })), `</g>`,
        ...[[88, 86], [124, 96], [96, 124], [70, 108], [130, 130], [112, 68]].map(([x, y]) => xvn_PorkBall(p, x, y, 20)),
        K.scallions(p, 100, 100, 100, { n: 10, c: '#5aa83a' }),
        xvn_Pepper(p, 100, 100, 110, 26),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // たけのこと豚足のスープ（canh măng móng giò）: 土鍋に、うす黄色のスープ、黄色いたけのこの帯、輪切りの豚足、浮いた脂、ねぎ、パクチー
    vn_canhmang: p => [
        xvn_ClayPot(p),
        K.liquid(p, { R: 80, c: '#dcc086', op: .95, shine: false }),
        `<g ${p.sh(.3)}>`, ...[[80, 68, 20], [120, 64, -30], [142, 100, 80], [56, 104, 70], [100, 98, -10], [80, 138, 40], [124, 140, -50], [104, 120, 100], [64, 82, -60], [140, 76, 30], [60, 126, -20], [104, 80, 150]].map(([x, y, r]) => xvn_BambooStrip(p, x, y, 50, 9, r)), `</g>`,
        ...[[84, 92, 0], [124, 104, 40], [96, 140, 80], [118, 70, 20]].map(([x, y, r], i) => xvn_Hock(p, x, y, 34, r, { seed: i })),
        xvn_Oil(p, 100, 100, 150, { n: 16, c: '#f2c45a', op: .6, rmax: 2.6 }),
        K.scallions(p, 100, 100, 110, { n: 14, c: '#5aa83a' }),
        xvn_Coriander(p, 106, 96, 18, 20),
        xvn_Pepper(p, 100, 100, 90, 18),
        xvn_SoupShine(100, 100, 80, .3),
    ].join(''),

    // わかめと豚ひき肉のスープ（canh rong biển thịt bằm）: 白い鉢に、澄んだスープ、ゆらゆらのわかめ、絹豆腐、豚ひき肉、ねぎ
    vn_canhrongbien: p => [
        xvn_GlazeBowl(p, '#b9a47a'),
        xvn_Broth(p, '#cec698', { op: .88, cloud: .2 }),
        ...[[74, 80, 20], [120, 70, -30], [140, 110, 60], [70, 126, 100], [102, 104, 10], [118, 142, 140], [92, 72, 60]].map(([x, y, r], i) => K.wakame(p, x, y, 40, r, { seed: i })),
        ...[[86, 100, 8], [124, 92, -10], [106, 130, 14], [62, 104, -6], [132, 124, 10]].map(([x, y, r]) => K.tofu(p, x, y, 20, 20, r)),
        xvn_Grains(p, 100, 100, 130, { cols: ['#c4a080', '#a8845e'], n: 40, size: 2, seed: 2 }),
        K.scallions(p, 100, 100, 110, { n: 16, c: '#5aa83a' }),
        xvn_Pepper(p, 100, 100, 80, 14),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),

    // 田蟹とモロヘイヤのスープ（canh cua rau đay）: 白い鉢に、うす茶のスープ、ふわっと浮いた蟹の身、刻んだモロヘイヤ、へちま
    vn_canhcua: p => [
        xvn_GlazeBowl(p, '#6e4b33'),
        xvn_Broth(p, '#b8a06a', { op: .95, cloud: .15 }),
        xvn_LeafSwarm(p, 100, 100, 150, { cols: ['#2f6a22', '#3a7a2a', '#285c1e'], n: 60, size: 8, minD: 8, seed: 1 }),
        ...[[66, 82, 20], [138, 118, -30], [76, 136, 50]].map(([x, y, r], i) => xvn_MelonChunk(p, x, y, 22, r, { flesh: '#e6ecc0', skin: '#3f7a2a', seed: i })),
        xvn_CrabRaft(p, 108, 96, 74, { seed: 1 }),
        xvn_CrabRaft(p, 120, 140, 34, { seed: 2 }),
        xvn_CrabRaft(p, 70, 110, 30, { seed: 3 }),
        xvn_SoupShine(100, 100, 79, .3),
    ].join(''),

    // 鶏としいたけのスープ（canh gà nấm đông cô）: 白い鉢に、黄金色の澄んだスープ、骨つきの鶏、しいたけ、花形にんじん、生姜、油の玉、ねぎ
    vn_canhganam: p => [
        xvn_Bowl(p),
        xvn_Broth(p, '#e2c27e', { op: .9, cloud: .2 }),
        ...[[76, 80, 20], [124, 74, -30], [140, 116, 60], [70, 122, 100], [108, 112, 10]].map(([x, y, r], i) => xvn_ChickenBit(p, x, y, 36, r, { seed: i, c: '#deaa52', bone: i % 2 === 0 })),
        `<g ${p.sh(.5)}>`, ...[[100, 80], [96, 140], [138, 92], [58, 100]].map(([x, y], i) => K.shiitake(p, x, y, 20, i * 40)), `</g>`,
        ...[[118, 140], [84, 100], [126, 128], [100, 64]].map(([x, y], i) => `<g ${K.T(x, y, i * 25)}><g ${p.sh(.4)}><path d="${smooth(Array.from({ length: 10 }, (_, j) => { const a = j / 10 * 6.28, rr = j % 2 ? 4.4 : 6.4; return [Math.cos(a) * rr, Math.sin(a) * rr]; }), true, .6)}" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b8561a" stroke-width=".5"/></g><circle r="2.2" fill="#f8b070"/></g>`),
        xvn_Ginger(p, 100, 100, 90, 10),
        xvn_Oil(p, 100, 100, 140, { n: 16, c: '#f2c04a', op: .6, rmax: 2.6 }),
        K.scallions(p, 100, 100, 110, { n: 14, c: '#5aa83a' }),
        xvn_Pepper(p, 100, 100, 80, 14),
        xvn_SoupShine(100, 100, 79, .35),
    ].join(''),
    // __END__
};
