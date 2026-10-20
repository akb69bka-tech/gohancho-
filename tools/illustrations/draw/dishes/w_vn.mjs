// ベトナムの家庭料理（cơm nhà）: 世界版パック vn
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// 共通の部品（vn〜）: e_rice_noodle / z_soup / b_main_wa2 から写して手直ししたもの
// =========================================================
function vnSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const vnShine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function vnOutline(p, c, r = .55){
    const id = p.def('vnOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// ご飯の山（米粒を2層）
function vnRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'vnRice' + seed + x + y);
    const shape = vnSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('vnRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
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
function vnGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, w = null, h = null } = {}){
    const R = rng(p.id + 'vnGr' + seed + x + y);
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
function vnShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'vnSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? vnOutline(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// もやし
function vnSprouts(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'vnSp' + seed + x);
    let st = '', hd = '';
    for (let i = 0; i < n; i++){
        const r2 = Math.sqrt(R()) * s / 2 * .85, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * .9, a = R() * Math.PI, L = 9 + R() * 8, bd = (R() - .5) * 5;
        const x2 = cx + Math.cos(a) * L / 2, y2 = cy + Math.sin(a) * L / 2;
        st += `M${f1(cx - Math.cos(a) * L / 2)} ${f1(cy - Math.sin(a) * L / 2)}Q${f1(cx + bd)} ${f1(cy - bd)} ${f1(x2)} ${f1(y2)}`;
        hd += `M${f1(x2)} ${f1(y2)}l${f1(Math.cos(a) * 1.2)} ${f1(Math.sin(a) * 1.2)}`;
    }
    return `<g ${p.sh(.5)}><g ${vnOutline(p, '#cfc6a6', .45)} fill="none" stroke-linecap="round"><path d="${st}" stroke="#f8f5e8" stroke-width="2.2"/><path d="${hd}" stroke="#e6cf5e" stroke-width="2.8"/></g></g>`;
}
// 汁に浮いた油の粒
function vnOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'vnoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// ふんわり溶き卵
function vnEggCloud(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'vne' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${smooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// 具を散らす位置
function vnSpots(seed, n, rmax, minD, cx = 100, cy = 100){
    const R = rng('vnspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// 角切り（かぼちゃ・にんじん）
function vnDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 煮たトマト（くし形のかけら）
function vnTomato(p, x, y, s, r = 0, { seed = 1, c = '#e2412c' } = {}){
    const R = rng(p.id + 'vntm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="${lt(c, .3)}" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 汁のつや
const vnSoupShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 小さな葉（ハーブ）
function vnLeaf(p, x, y, s, r = 0, { c = '#2f7a2a', narrow = 1, spot = false } = {}){
    return `<g ${T(x, y, r)}><g transform="scale(${f(s / 20)} ${f(s / 20 * narrow)})"><g ${p.sh(.5)}><path d="M-10,0 Q-4,-7.5 6,-4.5 Q10,-2 10,0 Q10,2 6,4.5 Q-4,7.5 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 9,0 M-3,0 L1,-4 M2,0 L5,-3 M-3,0 L1,4 M2,0 L5,3" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>
        ${spot ? `<ellipse cx="-1" cy="0" rx="2.4" ry="1.6" fill="#6a2a3a" opacity=".55"/>` : ''}
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g></g>`;
}
// パクチー（丸い切れ込みの小さな葉）
function vnCoriander(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}>${[[-5, -2, 5.5], [3, -4, 5], [4, 4, 5.2], [-4, 5, 4.6]].map(([a, b, rr], i) => `<path ${T(a, b, i * 50)} d="M-${rr},0 Q-${rr},-${rr} 0,-${rr} Q${rr * .4},-${rr * .7} ${rr * .5},-${rr * .3} Q${rr},-${rr * .4} ${rr},0 Q${rr},${rr} 0,${rr} Q-${rr},${rr} -${rr},0Z" fill="${p.g(i % 2 ? '#3f8f2f' : '#4c9c36', .3, .25)}" stroke="#2c6a20" stroke-width=".5"/>`).join('')}</g>
        <path d="M0,0 L-5,-2 M0,0 L3,-4 M0,0 L4,4 M0,0 L-4,5 M0,0 L2,11" stroke="#8cbf5c" stroke-width=".9" fill="none"/></g>`;
}
// ねぎのぶつ切り（4cm、緑の筒）
function vnScallion(p, x, y, L, r = 0, { c = '#5aa33a', white = false } = {}){
    const col = white ? '#eef3df' : c, w = 4.2;
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g(col, .3, .2)}" stroke="${dk(col, .3)}" stroke-width=".5"/>
        <path d="M${f(-L / 2 + 2)},-.6 L${f(L / 2 - 2)},-.6" stroke="${lt(col, .45)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}
// 唐辛子の輪切り
function vnChili(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="#d42a1c" stroke="#9a1a10" stroke-width=".5"/><circle r="${f(s * .3)}" fill="#f07a50"/><circle cx="${f(s * .08)}" cy="${f(-s * .05)}" r="${f(s * .08)}" fill="#f6dfa0"/><circle cx="${f(-s * .1)}" cy="${f(s * .06)}" r="${f(s * .07)}" fill="#f6dfa0"/></g>`;
}
// 黒こしょう
const vnPepper = (p, x, y, s, n = 24) => K.sprinkle(p, x, y, s, { c: '#2a1c14', n, r: .75 });

// =========================================================
// ベトナムの器
// =========================================================
const VN_BLUE = '#2d5aa0';
// 白い磁器の皿（バッチャン風: 藍の縁と筆の葉模様）
function vnPlate(p, { R = 94 } = {}){
    let m = '';
    for (let i = 0; i < 18; i++){
        const a = i / 18 * Math.PI * 2, x = 100 + Math.cos(a) * (R - 12), y = 100 + Math.sin(a) * (R - 12);
        m += `<path ${T(x, y, a * 57.3 + 90)} d="M-4,0 Q0,-2.6 4,0 Q0,2.6 -4,0Z" fill="${VN_BLUE}" opacity=".55"/>`;
    }
    return K.plate(p, { R, rim: VN_BLUE }) + m;
}
// 汁物の鉢（白に藍の線と模様）
function vnBowl(p, { R = 92 } = {}){
    let m = '';
    for (let i = 0; i < 14; i++){
        const a = i / 14 * Math.PI * 2, x = 100 + Math.cos(a) * 86, y = 100 + Math.sin(a) * 86;
        m += `<path ${T(x, y, a * 57.3)} d="M-2.4,-2.4 Q0,0 2.4,-2.4 M-2.4,2.4 Q0,0 2.4,2.4" stroke="${VN_BLUE}" stroke-width="1" fill="none" opacity=".7"/>`;
    }
    return K.bowl(p, { glaze: '#f6f4ee', inside: '#fbfaf6', R }) + `<circle cx="100" cy="100" r="${R - 1.6}" fill="none" stroke="${VN_BLUE}" stroke-width="2"/><circle cx="100" cy="100" r="81.6" fill="none" stroke="${VN_BLUE}" stroke-width="1.2" opacity=".85"/>` + m;
}
// 土鍋の器（tộ）: 素焼きの外側、厚い縁、こげ茶の釉薬の内側
function vnClayPot(p){
    return `<g ${p.sh(2)}><circle cx="100" cy="100" r="94" fill="${p.rg('#9a5634', .22, .35, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="88" fill="none" stroke="#b9714a" stroke-width="5" opacity=".9"/>
        <circle cx="100" cy="100" r="85" fill="none" stroke="#6a341c" stroke-width="1.2" opacity=".8"/>
        <circle cx="100" cy="100" r="83" fill="${p.rg('#3c2216', .12, .3, .62, .64)}"/>
        <path d="M30,58 A86,86 0 0 1 64,22" stroke="#f3c9a8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// 小鉢（白・藍の線）
function vnSmallBowl(p, { R = 92 } = {}){
    return K.bowl(p, { glaze: '#f7f5ef', inside: '#fbfaf6', R }) + `<circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${VN_BLUE}" stroke-width="3"/><circle cx="100" cy="100" r="${R * .87 + 2}" fill="none" stroke="${VN_BLUE}" stroke-width="1" opacity=".8"/>`;
}

// =========================================================
// ベトナムの料理の部品
// =========================================================
// 豚ばらの角切りを煮たもの（断面: 皮・脂・赤身の層、飴色）
function vnPorkBelly(p, x, y, s, r = 0, { seed = 1 } = {}){
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
        ${vnShine(`M${f(-h * .7)},${f(-h * .3)} Q0,${f(-h * .48)} ${f(h * .6)},${f(-h * .3)}`, 2, .75)}
        ${vnShine(`M${f(-h * .6)},${f(h * .45)} Q${f(-h * .1)},${f(h * .35)} ${f(h * .3)},${f(h * .42)}`, 1.3, .45)}</g>`;
}
// 煮卵（丸ごと or 半分）。飴色に染まった白身
function vnBraisedEgg(p, x, y, s, r = 0, { half = false } = {}){
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
function vnFishSteak(p, x, y, s, r = 0, { flesh = '#a8622a', skin = '#3e3530', seed = 1, braised = true } = {}){
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
        ${braised ? vnShine('M-14,-5 Q-9,-12 0,-13', 2.4, .8) + vnShine('M5,-12 Q11,-10 14,-5', 1.3, .55) : vnShine('M-13,-5 Q-8,-11 0,-12', 1.4, .5)}</g>`;
}
// 鶏のぶつ切り（骨つき、飴色の照り）
function vnChickenBit(p, x, y, s, r = 0, { c = '#b9702c', seed = 1, bone = false } = {}){
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
        ${vnShine('M-8,-3.5 Q-4,-7.6 3,-6.8', 2, .85)}<circle cx="6" cy="-3" r=".9" fill="#fff" opacity=".7"/></g>`;
}
// 揚げ豆腐の角切り（きつね色）
function vnFriedTofu(p, x, y, s, r = 0, { c = '#e3a64c', sauce = null } = {}){
    const R = rng(p.id + 'vntf' + x + y);
    const h = s / 2;
    let bl = '';
    for (let i = 0; i < 5; i++) bl += `<circle cx="${f(-h + 3 + R() * (s * .88 - 6))}" cy="${f(-h + 3 + R() * (s * .88 - 6))}" r="${f(.6 + R() * .8)}" fill="${dk(c, .2)}" opacity=".45"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .25)}"/></g>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.rg(c, .3, .2, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        ${bl}
        ${sauce ? `<path d="M${f(-h)},${f(h * .25)} Q${f(-h * .2)},${f(h * .02)} ${f(h * .72)},${f(h * .4)} L${f(h * .72)},${f(h * .72)} L${f(-h)},${f(h * .72)}Z" fill="${sauce}" opacity=".85"/>` : ''}
        ${vnShine(`M${f(-h + 3)},${f(-h + 3.5)} Q${f(-h * .2)},${f(-h + 2)} ${f(h * .45)},${f(-h + 3.5)}`, 1.6, .75)}</g>`;
}
// 殻つきのえび（赤橙、節と尾、照り）
function vnShrimp(p, x, y, s, r = 0, { c = '#e0592c', seed = 1 } = {}){
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
function vnWaterSpinach(p, x, y, s, { n = 30, seed = 1, cooked = true } = {}){
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
function vnOmelette(p, x, y, s, { cuts = 6, seed = 1 } = {}){
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
        ${vnShine(`M${f(-s * .34)},${f(-s * .16)} Q${f(-s * .2)},${f(-s * .36)} ${f(s * .06)},${f(-s * .4)}`, 3, .55)}</g>`;
}
// 焼きなすを裂いたもの（細長い、やわらかい身）
function vnEggplantStrip(p, x, y, L, w, r = 0, { seed = 1 } = {}){
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
        ${vnShine(`M${f(-L * .35)},${f(-w * .22)} Q0,${f(-w * .4)} ${f(L * .3)},${f(-w * .26)}`, 1.6, .55)}</g>`;
}
// パイナップルのいちょう切り
function vnPineapple(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,6 L10,6 L2,-9 Q0,-10 -2,-9Z" fill="${p.g('#f6c936', .35, .2)}" stroke="#c7951a" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M-6,4 L-1,-6 M0,4 L0,-7 M6,4 L1,-6" stroke="#fbe58a" stroke-width=".9" opacity=".9"/>
        <path d="M-10,6 L10,6" stroke="#e0a91e" stroke-width="2" stroke-linecap="round"/></g>`;
}
// ザ・パクチーの細長い葉（ngò gai）
function vnSawtooth(p, x, y, s, r = 0){
    const k = s / 30;
    const top = Array.from({ length: 8 }, (_, i) => [-14 + i * 4, -3.2 - (i % 2) * 1.2]), bot = Array.from({ length: 8 }, (_, i) => [14 - i * 4, 3.2 + (i % 2) * 1.2]);
    return `<g ${T(x, y, r, k)}><path d="M-15,0 ${top.map(([a, b]) => `L${a},${b}`).join(' ')} L15,0 ${bot.map(([a, b]) => `L${a},${b}`).join(' ')}Z" fill="${p.g('#3f8a2c', .3, .25)}" stroke="#2a5f1e" stroke-width=".5" stroke-linejoin="round"/><path d="M-14,0 L14,0" stroke="#8cc066" stroke-width=".8"/></g>`;
}
// 揚げにんにく・揚げエシャロット
const vnFriedGarlic = (p, x, y, s, n = 26, seed = 1) => vnGrains(p, x, y, s, { cols: ['#e4ad48', '#c98a2a', '#f2cc72'], n, size: 1.3, seed });
const vnFriedShallot = (p, x, y, s, n = 24, seed = 1) => vnGrains(p, x, y, s, { cols: ['#a8642a', '#8a4c1c', '#c4823c'], n, size: 1.5, seed });
const vnPeanuts = (p, x, y, s, n = 18, seed = 1) => vnGrains(p, x, y, s, { cols: ['#e2b878', '#c99556', '#f0d4a0'], n, size: 2.2, seed });
// 中国ソーセージの斜め切り（赤い身に白い脂の粒）
function vnLapXuong(p, x, y, s, r = 0){
    const R = rng(p.id + 'vnlx' + x + y);
    let dots = '';
    for (let i = 0; i < 6; i++) dots += `<circle cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .35)}" r="${f(.6 + R() * .7)}" fill="#f8e2d0"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .32)}" fill="#8a1f1a"/></g><ellipse rx="${f(s / 2 - 1)}" ry="${f(s * .32 - 1)}" fill="${p.g('#c43a2e', .25, .2)}"/>${dots}</g>`;
}
// 細く裂いた鶏肉
function vnShreddedChicken(p, x, y, s, { n = 14, seed = 1 } = {}){
    const R = rng(p.id + 'vnsc' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .85, L = 12 + R() * 10, ang = R() * 180;
        out += `<g ${T(cx, cy, ang)}><path d="${smooth([[-L / 2, 0], [-L / 4, -2.2], [L / 4, -1.8], [L / 2, 0], [L / 4, 2], [-L / 4, 2.3]], true, .8)}" fill="${p.g(R() < .5 ? '#f1dfc0' : '#e8cfa6', .3, .2)}" stroke="#c4a172" stroke-width=".5"/><path d="M${f(-L / 3)},.3 L${f(L / 3)},-.2" stroke="#d4b68a" stroke-width=".5"/></g>`;
    }
    return `<g ${p.sh(.6)}>${out}</g>`;
}


// 千切りキャベツの山（軽量版: 色ごとに1本のpath）
function vnCabbageBed(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'vncbd' + seed);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(ring(s / 2, 10, .2, R, 1, .94))}" fill="${p.rg('#eef6dc', .3, .1)}"/></g>`
        + vnShreds(p, x, y, s * .92, { c: '#cfe6a0', n: 70, w: 1.8, len: .16, seed: seed + 1, curve: .5 })
        + vnShreds(p, x, y, s * .9, { c: '#f3f8e4', n: 60, w: 1.8, len: .16, seed: seed + 2, curve: .5 })
        + vnShreds(p, x, y, s * .8, { c: '#a9cf6c', n: 24, w: 1.6, len: .14, seed: seed + 3, curve: .5 });
}
// ゆでたキャベツの葉（大きめのざく切り、白い太い葉脈、しんなり半透明）
function vnBoiledCabbage(p, x, y, s, r = 0, { seed = 1, c = '#c6dd96' } = {}){
    const R = rng(p.id + 'vncb' + seed + x + y);
    const k = s / 40;
    const pts = ring(19, 13, .22, R, 1.15, .82);
    const gid = p.def('vncbg' + c, id => `<radialGradient id="${id}" cx=".22" cy=".7" r=".95"><stop offset="0" stop-color="#f4f6e2"/><stop offset=".45" stop-color="${lt(c, .3)}"/><stop offset="1" stop-color="${dk(c, .08)}"/></radialGradient>`);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .8)}" fill="url(#${gid})" stroke="${dk(c, .18)}" stroke-width=".5"/></g>
        <path d="M-20,9 Q-4,3 17,-6 Q-2,1 -19,5Z" fill="#f6f7ea" stroke="#d8e0bc" stroke-width=".5"/>
        <path d="M-9,4.5 Q-11,-2 -16,-5 M-2,2 Q-2,-6 -6,-12 M5,-1 Q7,-8 6,-14 M11,-3.5 Q14,-7 16,-10 M-5,4 Q-2,10 2,13 M4,1 Q8,6 13,7" stroke="${lt(c, .55)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/>
        ${vnShine('M-12,-6 Q-4,-13 7,-12', 1.4, .5)}</g>`;
}

// =========================================================
export default {
    // 白ご飯: 藍の線の白い茶碗（bát cơm）に、ふっくらとした白いご飯
    vn_staple: p => [
        vnSmallBowl(p),
        vnRice(p, 100, 101, 146, { density: 1.35, grain: 4 }),
        `<path d="M50,82 Q58,58 84,48" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
    ].join(''),

    // 豚ばらと卵の煮物（thịt kho trứng）: 土鍋に、飴色の煮汁、角切りの豚ばら、煮卵（丸ごとと半分）、ねぎ
    vn_thitkhotrung: p => [
        vnClayPot(p),
        K.liquid(p, { R: 80, c: '#9a5a22', op: 1, shine: false }),
        `<circle cx="100" cy="100" r="68" fill="#c27a32" opacity=".25"/>`,
        vnOil(p, 100, 100, 150, { n: 16, c: '#e8a64a', op: .55, rmax: 2.2 }),
        `<g ${p.sh(.8)}>`,
        vnPorkBelly(p, 72, 76, 34, -12, { seed: 1 }), vnPorkBelly(p, 130, 70, 32, 14, { seed: 2 }), vnPorkBelly(p, 136, 118, 34, -8, { seed: 3 }),
        vnPorkBelly(p, 64, 122, 32, 20, { seed: 4 }), vnPorkBelly(p, 100, 140, 30, -18, { seed: 5 }), vnPorkBelly(p, 102, 60, 28, 30, { seed: 6 }),
        `</g>`,
        vnBraisedEgg(p, 104, 98, 40, -20, { half: true }), vnBraisedEgg(p, 70, 100, 34, 70), vnBraisedEgg(p, 136, 94, 32, -60, { half: true }), vnBraisedEgg(p, 112, 124, 32, 30),
        vnSoupShine(100, 100, 80, .35),
        vnChili(p, 86, 118, 7, 0), vnChili(p, 122, 82, 6, 0),
    ].join(''),

    // 魚の土鍋煮（cá kho tộ）: 土鍋に、濃いカラメルの煮汁、筒切りの魚、黒こしょう・唐辛子・ねぎ
    vn_cakho: p => [
        vnClayPot(p),
        K.liquid(p, { R: 80, c: '#6e3410', op: 1, shine: false }),
        `<circle cx="100" cy="100" r="64" fill="#9a4e1a" opacity=".3"/>`,
        vnOil(p, 100, 100, 150, { n: 18, c: '#d8902e', op: .55, rmax: 2.4 }),
        vnFishSteak(p, 72, 82, 76, -24, { seed: 1, flesh: '#9a5422', skin: '#3a2414' }),
        vnFishSteak(p, 130, 84, 74, 26, { seed: 2, flesh: '#a25a26', skin: '#3a2414' }),
        vnFishSteak(p, 100, 134, 74, 182, { seed: 3, flesh: '#985224', skin: '#3a2414' }),
        vnSoupShine(100, 100, 80, .3),
        `<g ${p.sh(.4)}>`,
        vnScallion(p, 90, 104, 16, 30), vnScallion(p, 118, 112, 14, -40), vnScallion(p, 60, 112, 14, 80), vnScallion(p, 142, 124, 12, 10),
        vnChili(p, 106, 102, 8, 0), vnChili(p, 64, 98, 7, 0), vnChili(p, 136, 66, 7, 0),
        `</g>`,
        vnPepper(p, 100, 100, 110, 40),
    ].join(''),

    // 鶏の生姜炒め煮（gà rang gừng）: 白い皿に、飴色の照りの骨つき鶏、針しょうが、ねぎ
    vn_garang: p => [
        vnPlate(p),
        K.pool(p, 100, 102, 116, '#9a561e', { op: .75, seed: 1, sy: .85 }),
        `<g ${p.sh(.8)}>`,
        ...[[76, 78, 36, 20, true], [118, 72, 38, -30, false], [140, 104, 34, 60, true], [96, 104, 40, 110, false], [66, 116, 34, -40, true], [112, 134, 36, 10, false], [84, 140, 30, 70, true], [136, 136, 30, -70, false]].map(([x, y, s, r, b], i) => vnChickenBit(p, x, y, s, r, { seed: i + 1, bone: b, c: i % 2 ? '#b46a28' : '#c07a32' })),
        `</g>`,
        vnShreds(p, 104, 100, 96, { c: '#f2d27a', n: 26, w: 1.6, len: .2, seed: 3, curve: .2 }),
        vnShreds(p, 100, 104, 80, { c: '#d9a648', n: 12, w: 1.5, len: .18, seed: 5, curve: .2 }),
        `<g ${p.sh(.4)}>`, vnScallion(p, 92, 88, 14, 20), vnScallion(p, 128, 120, 12, -50), vnScallion(p, 70, 98, 12, 70), `</g>`,
        K.scallions(p, 104, 106, 60, { n: 8, c: '#4f9a34' }),
        vnPepper(p, 104, 104, 90, 22),
    ].join(''),

    // 牛肉と玉ねぎの炒めもの（bò xào hành tây）: 皿に、薄切り牛肉、くし切り玉ねぎ、トマト、ねぎのぶつ切り
    vn_boxao: p => [
        vnPlate(p),
        K.pool(p, 100, 102, 120, '#8a4a1e', { op: .6, seed: 2, sy: .85 }),
        `<g ${p.sh(.8)}>`,
        K.onion(p, 70, 86, 26, -30, { c: '#ead9a8' }), K.onion(p, 132, 120, 26, 160, { c: '#ead9a8' }), K.onion(p, 112, 64, 24, 40, { c: '#ead9a8' }), K.onion(p, 76, 132, 24, 100, { c: '#ead9a8' }),
        vnTomato(p, 138, 82, 24, 30, { seed: 1 }), vnTomato(p, 64, 108, 22, -40, { seed: 2 }), vnTomato(p, 110, 140, 22, 70, { seed: 3 }),
        ...[[96, 84, -20], [118, 98, 30], [90, 112, 70], [126, 74, -60], [80, 66, 10], [104, 126, 120], [138, 104, -10], [70, 120, 40]].map(([x, y, r], i) => K.beefSlice(p, x, y, 34, r, { c: i % 2 ? '#6e3a20' : '#7c4426', seed: i + 1 })),
        `</g>`,
        `<g ${p.sh(.5)}>`,
        ...[[86, 96, 30], [120, 84, -40], [104, 112, 70], [74, 78, -10], [140, 92, 50], [116, 130, 10], [62, 98, 80], [96, 140, -30]].map(([x, y, r], i) => vnScallion(p, x, y, 20, r, { white: i % 4 === 3 })),
        `</g>`,
        vnPepper(p, 100, 100, 100, 26),
    ].join(''),

    // 揚げ豆腐のトマト煮（đậu phụ sốt cà chua）: 皿に赤いトマトソース、きつね色の揚げ豆腐、ねぎ
    vn_dauphusotca: p => [
        vnPlate(p),
        K.pool(p, 100, 102, 118, '#d43e26', { op: .95, seed: 3, sy: .9 }),
        `<circle cx="94" cy="94" r="40" fill="#f07a50" opacity=".22"/>`,
        vnGrains(p, 100, 102, 112, { cols: ['#b8261a', '#e8583a', '#c9301e'], n: 40, size: 2.6, seed: 4, sy: .9 }),
        ...[[66, 80, 10], [138, 76, -20], [100, 64, 40], [60, 118, 30], [144, 116, -10], [104, 144, 60]].map(([x, y, r], i) => vnTomato(p, x, y, 20, r, { seed: i + 3, c: '#d93a24' })),
        ...[[82, 78, 32, 8], [118, 80, 32, -12], [68, 108, 30, 20], [101, 106, 33, -4], [134, 104, 30, 14], [86, 136, 31, -16], [121, 132, 31, 10]].map(([x, y, s, r]) => vnFriedTofu(p, x, y, s, r, { sauce: '#d4482a' })),
        K.scallions(p, 100, 104, 104, { n: 18, c: '#4f9a34' }),
        vnPepper(p, 100, 100, 90, 14),
    ].join(''),

    // えびの甘辛煮（tôm rim）: 皿に、殻つきのえびを飴色にからめ、ねぎと黒こしょう
    vn_tomrim: p => [
        vnPlate(p),
        K.pool(p, 100, 102, 110, '#b2501e', { op: .8, seed: 4, sy: .85 }),
        ...[[74, 76, -20], [112, 70, 30], [142, 96, 80], [92, 100, 10], [64, 112, -70], [124, 120, 120], [96, 136, 200], [130, 76, -110], [76, 140, 150]].map(([x, y, r], i) => vnShrimp(p, x, y, 44, r, { seed: i, c: i % 2 ? '#d9542a' : '#e2622e' })),
        K.scallions(p, 104, 104, 96, { n: 18, c: '#4f9a34' }),
        vnPepper(p, 100, 100, 100, 30),
    ].join(''),

    // 卵チャーハン（cơm chiên trứng）: 皿に、黄色みのある炒めご飯、卵・ねぎ・にんじん・中国ソーセージ
    vn_comchien: p => [
        vnPlate(p),
        vnRice(p, 100, 100, 132, { tint: '#ecc874', grain: 3.4, hiK: .5 }),
        `<g ${p.sh(.5)}>`,
        vnGrains(p, 100, 100, 112, { cols: ['#f8d548', '#fbe48a', '#f0bb2a'], n: 34, size: 4.4 }),
        ...[[84, 80, 20], [118, 92, -30], [96, 118, 60], [130, 120, 10], [72, 108, 45], [140, 96, 30], [108, 70, -15]].map(([x, y, r]) => vnLapXuong(p, x, y, 11, r)),
        ...[[92, 92, 10], [126, 104, 40], [110, 132, -20], [70, 92, 70], [116, 78, 0], [86, 126, 30], [138, 118, 60]].map(([x, y, r]) => vnDice(p, x, y, 5, r, '#ef7f30')),
        `</g>`,
        K.scallions(p, 100, 100, 112, { n: 24, c: '#4f9a34' }),
        `<path d="M56,86 Q66,60 92,52" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // 空心菜のにんにく炒め（rau muống xào tỏi）: 皿に、つやのある空心菜の茎と葉、揚げにんにく
    vn_raumuongxao: p => [
        vnPlate(p),
        K.pool(p, 100, 102, 120, '#b9a050', { op: .35, seed: 5, sy: .85 }),
        vnWaterSpinach(p, 100, 100, 130, { n: 50, seed: 1 }),
        vnWaterSpinach(p, 98, 98, 90, { n: 18, seed: 2 }),
        vnFriedGarlic(p, 100, 98, 80, 34),
        `<path d="M58,80 Q70,58 96,52" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>`,
    ].join(''),

    // ゆでキャベツと卵入りヌックマム（bắp cải luộc chấm nước mắm trứng）: 皿にゆでたキャベツ、小皿に卵をくずしたヌックマム
    vn_bapcailuoc: p => [
        vnPlate(p),
        `<g ${p.sh(.6)}>`,
        ...[[78, 70, 54, 20], [116, 62, 50, -30], [62, 104, 52, 80], [100, 96, 56, 10], [80, 134, 52, -40], [118, 136, 46, 30], [90, 112, 46, 130]].map(([x, y, s, r], i) => vnBoiledCabbage(p, x, y, s, r, { c: i % 2 ? '#cfe3a2' : '#bdd88c', seed: i + 1 })),
        `</g>`,
        `<g ${p.sh(1.2)}><circle cx="142" cy="104" r="28" fill="${p.rg('#f7f5ef', .2, .15, .38, .32)}"/></g>`,
        `<circle cx="142" cy="104" r="26.4" fill="none" stroke="${VN_BLUE}" stroke-width="1.6"/>`,
        K.liquid(p, { R: 21, c: '#b8742a', op: .95, cx: 142, cy: 104 }),
        vnGrains(p, 142, 104, 28, { cols: ['#f3c24a', '#f8dc80', '#f6f0dc'], n: 26, size: 1.8 }),
        vnChili(p, 136, 98, 5, 0), vnChili(p, 150, 110, 4.6, 0),
    ].join(''),

    // ねぎ入り卵焼き（trứng chiên hành）: 皿に、丸く焼いたねぎ入りの卵焼きをくし切りに
    vn_trungchien: p => [
        vnPlate(p),
        vnOmelette(p, 100, 100, 128, { cuts: 6 }),
    ].join(''),

    // 鶏とキャベツのサラダ（gỏi gà bắp cải）: 皿に、千切りキャベツとにんじん、裂いた鶏肉、玉ねぎ、ラウラム、ピーナッツ、揚げエシャロット
    vn_goiga: p => [
        vnPlate(p),
        vnCabbageBed(p, 100, 100, 136),
        vnShreds(p, 100, 100, 118, { c: '#ef8034', n: 34, w: 1.8, len: .26, seed: 2 }),
        vnShreds(p, 96, 98, 110, { c: '#f4f1e6', n: 14, w: 2.2, len: .26, seed: 7, curve: .6 }),
        vnShreddedChicken(p, 100, 98, 96, { n: 24 }),
        `<g ${p.sh(.4)}>`,
        ...[[66, 82, 22, 30], [128, 72, 22, -40], [138, 118, 20, 60], [72, 126, 22, -10], [104, 138, 20, 100], [104, 66, 20, 10], [96, 100, 20, -60]].map(([x, y, s, r]) => vnLeaf(p, x, y, s, r, { c: '#3a8a2c', narrow: .6, spot: true })),
        `</g>`,
        vnPeanuts(p, 104, 98, 76, 30),
        vnFriedShallot(p, 98, 104, 70, 30, 3),
        vnChili(p, 84, 100, 6, 0), vnChili(p, 120, 104, 6, 0),
    ].join(''),

    // 大根とにんじんのなます（đồ chua）: 白い小鉢に、甘酢に漬けたにんじんと大根の細切り
    vn_dochua: p => [
        vnSmallBowl(p),
        K.liquid(p, { R: 74, c: '#f0e2c0', op: .55 }),
        `<g ${p.sh(.5)}>`,
        vnShreds(p, 100, 100, 112, { c: '#f4efe0', n: 60, w: 3.6, len: .24, seed: 1, curve: .1 }),
        vnShreds(p, 100, 100, 112, { c: '#ef7f30', n: 52, w: 3.4, len: .24, seed: 2, curve: .1 }),
        vnShreds(p, 100, 100, 90, { c: '#f4efe0', n: 20, w: 3.4, len: .26, seed: 3, curve: .1 }),
        vnShreds(p, 100, 100, 80, { c: '#ef7f30', n: 14, w: 3.4, len: .3, seed: 4, curve: .1 }),
        `</g>`,
        vnSoupShine(100, 100, 74, .4),
    ].join(''),

    // 焼きなすのねぎ油がけ（cà tím nướng mỡ hành）: 楕円皿に、裂いた焼きなす、緑のねぎ油、ピーナッツ、たれ
    vn_catimnuong: p => [
        K.ovalDish(p, { rim: VN_BLUE }),
        K.pool(p, 100, 102, 130, '#c08a3a', { op: .45, seed: 6, sy: .6 }),
        vnEggplantStrip(p, 100, 76, 126, 26, -4, { seed: 1 }), vnEggplantStrip(p, 102, 96, 140, 28, 2, { seed: 2 }),
        vnEggplantStrip(p, 98, 116, 136, 27, -2, { seed: 3 }), vnEggplantStrip(p, 104, 130, 112, 22, 4, { seed: 4 }),
        vnGrains(p, 100, 100, 104, { cols: ['#4fa034', '#6cbc44', '#3a8a2a'], n: 70, size: 2.2, seed: 4, sy: .7 }),
        K.scallions(p, 100, 100, 104, { n: 26, c: '#5aa83a' }),
        vnOil(p, 100, 100, 110, { n: 12, c: '#a8c84a', op: .45, rmax: 2 }),
        vnPeanuts(p, 100, 100, 100, 20),
        vnChili(p, 70, 96, 5, 0), vnChili(p, 128, 110, 5, 0), vnChili(p, 110, 84, 4.6, 0),
    ].join(''),

    // 魚の甘酸っぱいスープ（canh chua cá）: 白い鉢に、澄んだ橙のスープ、魚、トマト、パイナップル、オクラ、もやし、ハーブ、揚げにんにく
    vn_canhchua: p => [
        vnBowl(p),
        K.liquid(p, { R: 79, c: '#ec9450', op: .78 }),
        `<circle cx="100" cy="100" r="62" fill="#f8c88a" opacity=".22"/>`,
        vnFishSteak(p, 78, 82, 50, -14, { seed: 1, skin: '#8a8580', braised: false }),
        vnFishSteak(p, 126, 124, 48, 166, { seed: 2, skin: '#8a8580', braised: false }),
        vnSprouts(p, 100, 104, 120, { n: 22 }),
        vnTomato(p, 130, 74, 26, 30, { seed: 1 }), vnTomato(p, 66, 124, 24, -20, { seed: 2 }), vnTomato(p, 102, 104, 22, 80, { seed: 3 }),
        vnPineapple(p, 104, 58, 24, 10), vnPineapple(p, 150, 100, 22, 80), vnPineapple(p, 94, 146, 22, 190), vnPineapple(p, 54, 92, 20, -70),
        K.okra(p, 112, 90, 15), K.okra(p, 84, 112, 14), K.okra(p, 140, 140, 13), K.okra(p, 70, 60, 13),
        vnSawtooth(p, 96, 122, 30, -30), vnSawtooth(p, 146, 116, 26, 50), vnSawtooth(p, 112, 72, 24, 160),
        vnCoriander(p, 120, 98, 20, 20), vnCoriander(p, 62, 102, 18, -40), vnCoriander(p, 98, 86, 16, 60),
        vnFriedGarlic(p, 100, 100, 120, 28, 2),
        vnChili(p, 88, 96, 6, 0), vnChili(p, 136, 132, 5.4, 0), vnChili(p, 116, 136, 5.4, 0),
        vnOil(p, 100, 100, 140, { n: 10, c: '#f2b04a', op: .5, rmax: 1.8 }),
        vnSoupShine(100, 100, 79, .35),
    ].join(''),

    // かぼちゃとひき肉のスープ（canh bí đỏ thịt bằm）: 白い鉢に、澄んだスープ、橙のかぼちゃ、ひき肉、ねぎとパクチー
    vn_canhbido: p => {
        const sp = vnSpots('bido', 13, 56, 21);
        return [
            vnBowl(p),
            K.liquid(p, { R: 78, c: '#e6c47a', op: .85 }),
            `<circle cx="100" cy="100" r="60" fill="#f4dca0" opacity=".3"/>`,
            `<g ${p.sh(.7)}>`, sp.map(([x, y, r], i) => vnDice(p, x, y, 18 + (i % 3) * 2, r, '#f0932a')).join(''), `</g>`,
            vnGrains(p, 100, 100, 130, { cols: ['#b89a7a', '#9a7a5a', '#c8ac8a'], n: 60, size: 2.2, seed: 2 }),
            vnSoupShine(100, 100, 78, .35),
            K.scallions(p, 100, 100, 110, { n: 18, c: '#4f9a34' }),
            vnCoriander(p, 92, 96, 18, 30), vnCoriander(p, 120, 116, 16, -30),
            vnPepper(p, 100, 100, 70, 14),
        ].join('');
    },

    // トマトと卵のスープ（canh trứng cà chua）: 白い鉢に、トマト色のスープ、くし切りのトマト、ふんわり卵、ねぎ
    vn_canhcachua: p => [
        vnBowl(p),
        K.liquid(p, { R: 78, c: '#e9783e', op: .9 }),
        `<circle cx="100" cy="100" r="60" fill="#f39a5a" opacity=".25"/>`,
        vnTomato(p, 76, 80, 26, 20, { seed: 1 }), vnTomato(p, 132, 90, 24, -40, { seed: 2 }), vnTomato(p, 96, 132, 26, 60, { seed: 3 }), vnTomato(p, 140, 128, 20, 10, { seed: 4 }), vnTomato(p, 60, 116, 20, -60, { seed: 5 }),
        vnEggCloud(p, 102, 96, 60, -15, { seed: 1 }), vnEggCloud(p, 112, 66, 44, 20, { seed: 2 }), vnEggCloud(p, 72, 110, 40, 60, { seed: 3 }), vnEggCloud(p, 128, 116, 40, -30, { seed: 4 }), vnEggCloud(p, 104, 146, 34, 5, { seed: 5 }),
        `<g ${p.sh(.4)}>`, vnScallion(p, 88, 92, 13, 30), vnScallion(p, 118, 104, 12, -20), vnScallion(p, 82, 140, 11, 70), `</g>`,
        K.scallions(p, 100, 100, 110, { n: 14, c: '#4f9a34' }),
        vnOil(p, 100, 100, 130, { n: 10, c: '#f2b04a', op: .55, rmax: 1.8 }),
        vnSoupShine(100, 100, 78, .4),
    ].join(''),
};
