// インドネシアの家庭料理（masakan rumahan）: 世界版パック id
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// 共通の部品（vn〜）: e_rice_noodle / z_soup / b_main_wa2 から写して手直ししたもの
// =========================================================
function idSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const idShine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function idOutline(p, c, r = .55){
    const id = p.def('idOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// ご飯の山（米粒を2層）
function idRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'idRice' + seed + x + y);
    const shape = idSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('idRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
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
function idGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, w = null, h = null } = {}){
    const R = rng(p.id + 'idGr' + seed + x + y);
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
function idShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'idSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? idOutline(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// もやし
function idSprouts(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'idSp' + seed + x);
    let st = '', hd = '';
    for (let i = 0; i < n; i++){
        const r2 = Math.sqrt(R()) * s / 2 * .85, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * .9, a = R() * Math.PI, L = 9 + R() * 8, bd = (R() - .5) * 5;
        const x2 = cx + Math.cos(a) * L / 2, y2 = cy + Math.sin(a) * L / 2;
        st += `M${f1(cx - Math.cos(a) * L / 2)} ${f1(cy - Math.sin(a) * L / 2)}Q${f1(cx + bd)} ${f1(cy - bd)} ${f1(x2)} ${f1(y2)}`;
        hd += `M${f1(x2)} ${f1(y2)}l${f1(Math.cos(a) * 1.2)} ${f1(Math.sin(a) * 1.2)}`;
    }
    return `<g ${p.sh(.5)}><g ${idOutline(p, '#cfc6a6', .45)} fill="none" stroke-linecap="round"><path d="${st}" stroke="#f8f5e8" stroke-width="2.2"/><path d="${hd}" stroke="#e6cf5e" stroke-width="2.8"/></g></g>`;
}
// 汁に浮いた油の粒
function idOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'idoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// ふんわり溶き卵
function idEggCloud(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'ide' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${smooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// 具を散らす位置
function idSpots(seed, n, rmax, minD, cx = 100, cy = 100){
    const R = rng('idspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// 角切り（かぼちゃ・にんじん）
function idDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 煮たトマト（くし形のかけら）
function idTomato(p, x, y, s, r = 0, { seed = 1, c = '#e2412c' } = {}){
    const R = rng(p.id + 'idtm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="${lt(c, .3)}" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 汁のつや
const idSoupShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 小さな葉（ハーブ）
function idLeaf(p, x, y, s, r = 0, { c = '#2f7a2a', narrow = 1, spot = false } = {}){
    return `<g ${T(x, y, r)}><g transform="scale(${f(s / 20)} ${f(s / 20 * narrow)})"><g ${p.sh(.5)}><path d="M-10,0 Q-4,-7.5 6,-4.5 Q10,-2 10,0 Q10,2 6,4.5 Q-4,7.5 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 9,0 M-3,0 L1,-4 M2,0 L5,-3 M-3,0 L1,4 M2,0 L5,3" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>
        ${spot ? `<ellipse cx="-1" cy="0" rx="2.4" ry="1.6" fill="#6a2a3a" opacity=".55"/>` : ''}
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g></g>`;
}
// パクチー（丸い切れ込みの小さな葉）
function idCoriander(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}>${[[-5, -2, 5.5], [3, -4, 5], [4, 4, 5.2], [-4, 5, 4.6]].map(([a, b, rr], i) => `<path ${T(a, b, i * 50)} d="M-${rr},0 Q-${rr},-${rr} 0,-${rr} Q${rr * .4},-${rr * .7} ${rr * .5},-${rr * .3} Q${rr},-${rr * .4} ${rr},0 Q${rr},${rr} 0,${rr} Q-${rr},${rr} -${rr},0Z" fill="${p.g(i % 2 ? '#3f8f2f' : '#4c9c36', .3, .25)}" stroke="#2c6a20" stroke-width=".5"/>`).join('')}</g>
        <path d="M0,0 L-5,-2 M0,0 L3,-4 M0,0 L4,4 M0,0 L-4,5 M0,0 L2,11" stroke="#8cbf5c" stroke-width=".9" fill="none"/></g>`;
}
// ねぎのぶつ切り（4cm、緑の筒）
function idScallion(p, x, y, L, r = 0, { c = '#5aa33a', white = false } = {}){
    const col = white ? '#eef3df' : c, w = 4.2;
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g(col, .3, .2)}" stroke="${dk(col, .3)}" stroke-width=".5"/>
        <path d="M${f(-L / 2 + 2)},-.6 L${f(L / 2 - 2)},-.6" stroke="${lt(col, .45)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}
// 唐辛子の輪切り
function idChili(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="#d42a1c" stroke="#9a1a10" stroke-width=".5"/><circle r="${f(s * .3)}" fill="#f07a50"/><circle cx="${f(s * .08)}" cy="${f(-s * .05)}" r="${f(s * .08)}" fill="#f6dfa0"/><circle cx="${f(-s * .1)}" cy="${f(s * .06)}" r="${f(s * .07)}" fill="#f6dfa0"/></g>`;
}
// 黒こしょう
const idPepper = (p, x, y, s, n = 24) => K.sprinkle(p, x, y, s, { c: '#2a1c14', n, r: .75 });

// =========================================================
// ベトナムのファイルから写した部品
// =========================================================
// 鶏のぶつ切り（骨つき、飴色の照り）
function idChickenBit(p, x, y, s, r = 0, { c = '#b9702c', seed = 1, bone = false } = {}){
    const R = rng(p.id + 'idck' + seed + x + y);
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
        ${idShine('M-8,-3.5 Q-4,-7.6 3,-6.8', 2, .85)}<circle cx="6" cy="-3" r=".9" fill="#fff" opacity=".7"/></g>`;
}
// 揚げ豆腐の角切り（きつね色）
function idFriedTofu(p, x, y, s, r = 0, { c = '#e3a64c', sauce = null } = {}){
    const R = rng(p.id + 'idtf' + x + y);
    const h = s / 2;
    let bl = '';
    for (let i = 0; i < 5; i++) bl += `<circle cx="${f(-h + 3 + R() * (s * .88 - 6))}" cy="${f(-h + 3 + R() * (s * .88 - 6))}" r="${f(.6 + R() * .8)}" fill="${dk(c, .2)}" opacity=".45"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .25)}"/></g>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.rg(c, .3, .2, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        ${bl}
        ${sauce ? `<path d="M${f(-h)},${f(h * .25)} Q${f(-h * .2)},${f(h * .02)} ${f(h * .72)},${f(h * .4)} L${f(h * .72)},${f(h * .72)} L${f(-h)},${f(h * .72)}Z" fill="${sauce}" opacity=".85"/>` : ''}
        ${idShine(`M${f(-h + 3)},${f(-h + 3.5)} Q${f(-h * .2)},${f(-h + 2)} ${f(h * .45)},${f(-h + 3.5)}`, 1.6, .75)}</g>`;
}
// 空心菜（筒状の茎のぶつ切りと矢じり形の葉）
function idWaterSpinach(p, x, y, s, { n = 30, seed = 1, cooked = true } = {}){
    const R = rng(p.id + 'idws' + seed + x + y);
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
// 揚げにんにく・揚げエシャロット
const idFriedGarlic = (p, x, y, s, n = 26, seed = 1) => idGrains(p, x, y, s, { cols: ['#e4ad48', '#c98a2a', '#f2cc72'], n, size: 1.3, seed });
const idFriedShallot = (p, x, y, s, n = 24, seed = 1) => idGrains(p, x, y, s, { cols: ['#a8642a', '#8a4c1c', '#c4823c'], n, size: 1.5, seed });
const idPeanuts = (p, x, y, s, n = 18, seed = 1) => idGrains(p, x, y, s, { cols: ['#e2b878', '#c99556', '#f0d4a0'], n, size: 2.2, seed });


// 千切りキャベツの山（軽量版: 色ごとに1本のpath）
function idCabbageBed(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'idcbd' + seed);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(ring(s / 2, 10, .2, R, 1, .94))}" fill="${p.rg('#eef6dc', .3, .1)}"/></g>`
        + idShreds(p, x, y, s * .92, { c: '#cfe6a0', n: 70, w: 1.8, len: .16, seed: seed + 1, curve: .5 })
        + idShreds(p, x, y, s * .9, { c: '#f3f8e4', n: 60, w: 1.8, len: .16, seed: seed + 2, curve: .5 })
        + idShreds(p, x, y, s * .8, { c: '#a9cf6c', n: 24, w: 1.6, len: .14, seed: seed + 3, curve: .5 });
}


// =========================================================
// インドネシア向けの部品
// =========================================================
// 同じ部品を何度も使うときは defs に1回描いて use する（SVG を小さく）
function idUse(p, key, make, x, y, r = 0, k = 1){
    const id = p.def('idU' + key, id => `<g id="${id}">${make()}</g>`);
    return `<use href="#${id}" ${T(x, y, r, k)}/>`;
}
const idCrumbArc = (d, w = 1.6, op = .7) => idShine(d, w, op);

// ---------- 器 ----------
// 白い丸皿に小花の輪（piring kembang: どこの家にもあるメラミン・陶器の花柄皿）
function idPlate(p, { c = '#d9485a', leaf = '#4f9a3a', R = 94, n = 12 } = {}){
    let fl = '';
    const petal = Array.from({ length: 5 }, (_, j) => { const a = j / 5 * 6.283 - 1.57; return `<ellipse cx="${f(Math.cos(a) * 2.6)}" cy="${f(Math.sin(a) * 2.6)}" rx="2" ry="1.4" transform="rotate(${f(a * 57.3)} ${f(Math.cos(a) * 2.6)} ${f(Math.sin(a) * 2.6)})" fill="${c}"/>`; }).join('');
    const fid = p.def('idFl' + c + leaf, id => `<g id="${id}"><path d="M-9,1 Q-6,-2.5 -3.5,-.5 Q-6,1.5 -9,1Z M9,1 Q6,-2.5 3.5,-.5 Q6,1.5 9,1Z" fill="${leaf}" opacity=".85"/>${petal}<circle r="1.1" fill="#f2c94a"/></g>`);
    for (let i = 0; i < n; i++){
        const a = i / n * 6.283 + .26, x = 100 + Math.cos(a) * (R - 9), y = 100 + Math.sin(a) * (R - 9);
        fl += `<use href="#${fid}" ${T(x, y, a * 57.3 + 90)}/>`;
        const b = a + 3.1416 / n, bx = 100 + Math.cos(b) * (R - 9), by = 100 + Math.sin(b) * (R - 9);
        fl += `<circle cx="${f(bx)}" cy="${f(by)}" r="1.1" fill="${leaf}" opacity=".7"/>`;
    }
    return K.plate(p, { R, rim: 'none', well: .74 }) + `<circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="${c}" stroke-width="1" opacity=".55"/>` + fl;
}
// 白い鉢（mangkuk）: 縁に色の線と小花
function idBowl(p, { line = '#2f8a5a', c = '#d9485a', R = 92, inside = '#fbf9f3' } = {}){
    let m = '';
    for (let i = 0; i < 10; i++){
        const a = i / 10 * 6.283 + .3, x = 100 + Math.cos(a) * (R * .915), y = 100 + Math.sin(a) * (R * .915);
        m += `<g ${T(x, y)}><circle r="1.6" fill="${c}"/><circle cx="-3" cy="0" r=".9" fill="${line}"/><circle cx="3" cy="0" r=".9" fill="${line}"/></g>`;
    }
    return K.bowl(p, { glaze: '#f6f3ec', inside, R }) + `<circle cx="100" cy="100" r="${f(R * .955)}" fill="none" stroke="${line}" stroke-width="2" opacity=".9"/><circle cx="100" cy="100" r="${f(R * .875)}" fill="none" stroke="${line}" stroke-width=".8" opacity=".7"/>` + m;
}
// バナナの葉を皿に敷く（縁で切る）
function idBanana(p, { r = -28, w = 128, R = 88, cx = 100, cy = 100 } = {}){
    const clip = p.uid();
    let veins = '';
    for (let i = -14; i <= 14; i++){ const x = i * 7; veins += `M${x},-4 L${x + 26},${-w / 2} M${x},4 L${x + 26},${w / 2}`; }
    const g = p.def('idBanG', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa24a"/><stop offset=".45" stop-color="#3f8a36"/><stop offset=".55" stop-color="#3a8232"/><stop offset="1" stop-color="#2e6e2a"/></linearGradient>`);
    return `<defs><clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>
        <g clip-path="url(#${clip})"><g ${T(cx, cy, r)}><g ${p.sh(.8)}><path d="M-120,${-w / 2 + 2} Q-40,${-w / 2 - 3} 0,${-w / 2} T120,${-w / 2 + 3} L120,${w / 2 - 2} Q40,${w / 2 + 3} 0,${w / 2} T-120,${w / 2 - 2}Z" fill="url(#${g})"/></g>
        <path d="${veins}" stroke="#6fb85a" stroke-width=".7" opacity=".55" fill="none"/>
        <path d="M-120,0 L120,0" stroke="#b9d98a" stroke-width="4.5"/><path d="M-120,1.6 L120,1.6" stroke="#8fbf5c" stroke-width="1.2"/>
        <path d="M-90,${-w / 2 + 8} Q-40,${-w / 2 + 4} 10,${-w / 2 + 7}" stroke="#fff" stroke-width="2" fill="none" opacity=".3" stroke-linecap="round"/></g></g>`;
}
// 石のすり鉢（cobek）とすりこぎ（ulekan）
function idCobek(p, { R = 90 } = {}){
    const stone = p.def('idStone', id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .1 0 0 0 0 .1 0 0 0 0 .1 0 0 0 .35 0" result="m"/><feComposite in="m" in2="SourceAlpha" operator="in" result="s"/><feBlend in="s" in2="SourceGraphic" mode="multiply"/></filter>`);
    return `<g ${p.sh(2.2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#6a6662', .2, .3, .35, .3)}"/></g>
        <g filter="url(#${stone})"><circle cx="100" cy="100" r="${R}" fill="${p.rg('#6e6a66', .18, .28, .35, .3)}"/>
        <circle cx="100" cy="100" r="${R - 12}" fill="${p.rg('#4a4644', .1, .25, .6, .62)}"/></g>
        <circle cx="100" cy="100" r="${R - 12}" fill="none" stroke="#3a3634" stroke-width="1.4" opacity=".8"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".3"/>`;
}
function idUlekan(p, x, y, r){
    return `<g ${T(x, y, r)}><g ${p.sh(1.6)}><path d="M-30,-9 Q-34,0 -30,9 L18,8 Q30,8 30,0 Q30,-8 18,-8Z" fill="${p.g('#6c6864', .25, .3)}" stroke="#3a3634" stroke-width=".8"/></g>
        <path d="M-27,-5 Q-8,-7 14,-5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}

// ---------- 料理の部品 ----------
// 揚げた鶏（ウコン色のきつね色、ざらっとした皮）: もも
function idThigh(p, x, y, s, r = 0, { c = '#c9842a', seed = 1 } = {}){
    const R = rng(p.id + 'idTh' + seed + x + y);
    const pts = ring(10, 10, .28, R, 1.25, .85);
    let spots = '';
    for (let i = 0; i < 7; i++) spots += `<ellipse cx="${f((R() - .5) * 16)}" cy="${f((R() - .5) * 11)}" rx="${f(1.5 + R() * 2.5)}" ry="${f(1 + R() * 1.6)}" fill="${dk(c, .35)}" opacity="${f(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.8)}><path d="${idSm(pts, true)}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <g ${p.crumb(.7)}><path d="${idSm(pts, true)}" fill="${lt(c, .05)}" opacity=".5"/></g>${spots}
        <path d="${idSm(pts.map(([a, b]) => [a * .6 + 1.5, b * .55 + 1.5]), true)}" fill="${dk(c, .18)}" opacity=".3"/>
        ${idShine('M-8,-3.5 Q-3,-7.5 4,-6.5', 2, .7)}${idShine('M4,-2 Q7,-2 9,0', 1, .45)}</g>`;
}
// 揚げた鶏: 骨つきのドラム
function idDrum(p, x, y, s, r = 0, { c = '#c9842a' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#e9d6b6', .3, .25)}" stroke="#a88a5c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <g ${p.crumb(.7)}><path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${lt(c, .05)}" opacity=".5"/></g>
        <path d="M-14,4 Q-6,10 4,7" stroke="${dk(c, .35)}" stroke-width="1.4" fill="none" opacity=".4"/>
        <ellipse cx="-8" cy="3" rx="3" ry="1.6" fill="${dk(c, .4)}" opacity=".35"/><ellipse cx="3" cy="-5" rx="2.4" ry="1.4" fill="${dk(c, .4)}" opacity=".3"/>
        ${idShine('M-16,-5 Q-10,-11 -2,-9.5', 2.2, .75)}${idShine('M2,-6 Q7,-4.5 11,-3', 1.2, .5)}</g>`;
}
// 揚げ魚（丸ごと、切り込み入り、きつね色）
function idFriedFish(p, x, y, L, r = 0, { c = '#b8722e', seed = 1 } = {}){
    const k = L / 104;
    const R = rng(p.id + 'idFsh' + seed);
    let spots = '';
    for (let i = 0; i < 12; i++) spots += `<ellipse cx="${f(-30 + R() * 60)}" cy="${f(-12 + R() * 24)}" rx="${f(2 + R() * 4)}" ry="${f(1.2 + R() * 2)}" fill="${R() < .6 ? dk(c, .4) : lt(c, .3)}" opacity="${f(.15 + R() * .2)}"/>`;
    const body = 'M-50,2 C-49,-11 -32,-21 -8,-22 C14,-22 28,-14 35,-5 L36,5 C28,14 14,21 -8,21 C-32,21 -49,14 -50,2Z';
    const slash = xx => `<path d="M${xx},-17 Q${xx + 6},0 ${xx},16" stroke="${dk(c, .5)}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M${xx + .8},-14 Q${xx + 5.6},0 ${xx + .8},13" stroke="#f2dcae" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(1.1)}>
        <path d="M-24,-19 L-20,-28 L-14,-22 L-8,-29 L-2,-23 L4,-29 L10,-22 L16,-27 L20,-19 L28,-21 L33,-10 L30,-6 Z" fill="${p.g(dk(c, .25), .2, .3)}" stroke="${dk(c, .55)}" stroke-width=".7" stroke-linejoin="round"/>
        <path d="M2,19 L8,27 L14,22 L20,26 L24,18 L32,15 L30,6 Z" fill="${p.g(dk(c, .25), .2, .3)}" stroke="${dk(c, .55)}" stroke-width=".7" stroke-linejoin="round"/>
        <path d="M33,-5 L54,-17 Q49,0 54,16 L33,5 Z" fill="${p.g(dk(c, .15), .25, .35)}" stroke="${dk(c, .55)}" stroke-width=".8" stroke-linejoin="round"/>
        <path d="${body}" fill="${p.g(c, .32, .38)}" stroke="${dk(c, .55)}" stroke-width=".9"/></g>
        <path d="M37,-9 L51,-14 M37,-3 L51,-6 M37,3 L51,6 M37,8 L51,13" stroke="${dk(c, .5)}" stroke-width=".8" opacity=".6"/>
        <path d="M-46,-4 C-40,-16 -20,-19 0,-19 C14,-19 26,-12 32,-6 C20,-10 0,-12 -20,-10 C-34,-8 -42,-6 -46,-4Z" fill="${dk(c, .3)}" opacity=".5"/>
        ${spots}${slash(-10)}${slash(4)}${slash(18)}
        <path d="M-27,-15 Q-20,0 -27,15" stroke="${dk(c, .5)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M-22,4 Q-14,8 -10,13 Q-18,13 -22,4Z" fill="${dk(c, .3)}" stroke="${dk(c, .5)}" stroke-width=".6"/>
        <circle cx="-38" cy="-5" r="4.6" fill="#efe6d2" stroke="${dk(c, .5)}" stroke-width="1"/><circle cx="-38" cy="-5" r="2.1" fill="#8a7a66"/>
        <path d="M-49,4 Q-46,6 -42,5" stroke="${dk(c, .55)}" stroke-width="1" fill="none"/>
        ${idShine('M-40,-12 Q-24,-20 -2,-19', 2.4, .55)}${idShine('M8,-17 Q18,-14 26,-9', 1.6, .45)}</g>`;
}
// バラド（粗くつぶした赤唐辛子のサンバル）: 不定形の赤い塊に、皮のかけらと種
function idBalado(p, x, y, s, { seed = 1, sy = .8, op = .95 } = {}){
    const R = rng(p.id + 'idBal' + seed + x + y);
    const shape = idSm(ring(s / 2, 11, .4, R, 1, sy), true);
    let bits = '', seeds = '';
    for (let i = 0; i < Math.round(s * .5); i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .9, bx = Math.cos(a) * d, by = Math.sin(a) * d * sy;
        bits += `<path ${T(bx, by, R() * 180)} d="${idSm(ring(1.6 + R() * 2.6, 6, .5, R, 1.6, .7), true)}" fill="${['#e8402a', '#a81c12', '#f06040', '#c22a1a'][Math.floor(R() * 4)]}" opacity=".9"/>`;
        if (R() < .35) seeds += `<ellipse cx="${f(bx + 2)}" cy="${f(by - 1)}" rx="1.1" ry=".7" transform="rotate(${f(R() * 180)} ${f(bx + 2)} ${f(by - 1)})" fill="#f6dc8a"/>`;
    }
    return `<g ${T(x, y)} opacity="${op}"><g ${p.sh(.7)}><path d="${shape}" fill="${p.rg('#c8301c', .2, .25, .4, .36)}" stroke="#8a160e" stroke-width=".6"/></g>${bits}${seeds}
        <path d="${shape}" fill="${p.rg('#e85030', .3, .1, .3, .3)}" opacity=".25"/>
        ${idShine(`M${f(-s * .28)},${f(-s * .1)} Q${f(-s * .12)},${f(-s * .3 * sy)} ${f(s * .1)},${f(-s * .3 * sy)}`, 1.8, .45)}</g>`;
}
// 揚げたゆで卵（表面がきつね色に泡立つ）。half で断面
function idFriedBoiledEgg(p, x, y, s, r = 0, { half = false, seed = 1 } = {}){
    const R = rng(p.id + 'idFbe' + seed + x + y);
    const rx = s / 2, ry = s * .4;
    let bl = '';
    for (let i = 0; i < 9; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * .8; bl += `<ellipse cx="${f(Math.cos(a) * d * rx)}" cy="${f(Math.sin(a) * d * ry)}" rx="${f(1.2 + R() * 2)}" ry="${f(.9 + R() * 1.4)}" fill="${R() < .5 ? '#b86a22' : '#f3d08a'}" opacity=".55"/>`; }
    if (!half) return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${rx}" ry="${f(ry)}" fill="${p.g('#dca54a', .3, .3)}" stroke="#9a5e14" stroke-width=".7"/></g>${bl}
        <ellipse cx="${f(-rx * .3)}" cy="${f(-ry * .4)}" rx="${f(rx * .22)}" ry="${f(ry * .12)}" fill="#fff" opacity=".8"/></g>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${rx}" ry="${f(ry)}" fill="${p.g('#d49a40', .2, .3)}" stroke="#9a5e14" stroke-width=".7"/></g>
        <ellipse rx="${f(rx - 2.6)}" ry="${f(ry - 2.4)}" fill="${p.rg('#fbf6e8', .1, .1)}"/>
        <circle cx="${f(rx * .04)}" cy="${f(ry * .04)}" r="${f(ry * .54)}" fill="${p.rg('#f2b22a', .3, .2, .38, .35)}" stroke="#d08a14" stroke-width=".5"/>
        <ellipse cx="${f(-rx * .14)}" cy="${f(-ry * .16)}" rx="${f(ry * .2)}" ry="${f(ry * .1)}" fill="#fff" opacity=".7"/></g>`;
}
// テンペ（大豆の粒が白い菌糸でつながった板）。c が地の色、tint で煮汁色
function idTempeh(p, x, y, w, h, r = 0, { c = '#e8d6a8', bean = '#c9a86a', seed = 1, gloss = .5, dark = false } = {}){
    const R = rng(p.id + 'idTmp' + seed + x + y);
    let beans = '';
    const n = Math.round(w * h / 38);
    for (let i = 0; i < n; i++){ const bx = (R() - .5) * (w - 4), by = (R() - .5) * (h - 4); beans += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(1.8 + R() * .8)}" ry="${f(1.3 + R() * .6)}" transform="rotate(${f(R() * 180)} ${f(bx)} ${f(by)})" fill="${R() < .5 ? bean : dk(bean, .18)}" opacity="${dark ? .55 : .8}"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>${beans}
        ${dark ? `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2" fill="${p.g(c, .1, .35)}" opacity=".35"/>` : ''}
        ${idShine(`M${f(-w / 2 + 3)},${f(-h / 2 + 3)} Q${f(-w * .1)},${f(-h / 2 + 1.5)} ${f(w * .3)},${f(-h / 2 + 3)}`, 1.6, gloss)}</g>`;
}
// 三角に切った豆腐（バチェム: こげ茶で照り）
function idTofuTri(p, x, y, s, r = 0, { c = '#94541e', seed = 1 } = {}){
    const R = rng(p.id + 'idTt' + seed + x + y);
    const j = () => (R() - .5) * 2;
    const pts = [[-s / 2 + j(), -s / 2 + j()], [s / 2 + j(), -s / 2 + j()], [-s / 2 + j(), s / 2 + j()]];
    const d = `M${pts.map(([a, b]) => `${f(a)},${f(b)}`).join('L')}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${d}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7" stroke-linejoin="round"/></g>
        <path d="M${f(-s / 2 + 4)},${f(-s / 2 + 4)} L${f(s / 2 - 8)},${f(-s / 2 + 4)} L${f(-s / 2 + 4)},${f(s / 2 - 8)}Z" fill="${lt(c, .15)}" opacity=".45"/>
        <circle cx="${f(-s * .1)}" cy="${f(-s * .05)}" r="1.3" fill="${dk(c, .3)}" opacity=".5"/><circle cx="${f(-s * .3)}" cy="${f(s * .2)}" r="1" fill="${dk(c, .3)}" opacity=".5"/>
        ${idShine(`M${f(-s / 2 + 4)},${f(-s / 2 + 6)} Q${f(-s * .15)},${f(-s / 2 + 3)} ${f(s * .15)},${f(-s / 2 + 5)}`, 1.6, .7)}</g>`;
}
// ペルケデル（じゃがいものコロッケ: 平たい丸、卵衣のレースの縁、こげ目、セロリの葉）
function idPerkedel(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'idPk' + seed + x + y);
    const lace = idSm(ring(s / 2, 16, .3, R, 1.05, .95), true);
    const body = idSm(ring(s / 2 * .86, 12, .1, R, 1.05, .95), true);
    let br = '', cel = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; br += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(2.5 + R() * 4)}" ry="${f(1.8 + R() * 2.4)}" transform="rotate(${f(R() * 180)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="#b06a1e" opacity="${f(.25 + R() * .3)}"/>`; }
    for (let i = 0; i < 5; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .34; cel += `<path ${T(Math.cos(a) * d, Math.sin(a) * d, R() * 180)} d="M-2.2,-.8 L2.2,-.8 L2.2,.8 L-2.2,.8Z" fill="#4f8a2e"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${lace}" fill="${p.g('#f0c04a', .3, .3)}" stroke="#b8781c" stroke-width=".7"/></g>
        <g ${p.crumb(.6)}><path d="${body}" fill="${p.rg('#e6a83a', .3, .25, .38, .34)}" stroke="#b07018" stroke-width=".6"/></g>${br}${cel}
        ${idShine(`M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .12)},${f(-s * .34)} ${f(s * .12)},${f(-s * .3)}`, 2, .6)}</g>`;
}
// クルプック（えびせんべい: うす桃色の波打つ円盤、泡の穴）
function idKrupuk(p, x, y, s, r = 0, { seed = 1, c = '#f6e6c4' } = {}){
    const R = rng(p.id + 'idKr' + seed + x + y);
    const pts = ring(s / 2, 18, .16, R, 1.12, .92);
    let holes = '';
    for (let i = 0; i < 15; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .42, hx = Math.cos(a) * d * 1.05, hy = Math.sin(a) * d * .88, hr = .9 + R() * 1.8; holes += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(hr)}" fill="${dk(c, .12)}" stroke="${dk(c, .28)}" stroke-width=".4"/><circle cx="${f(hx - hr * .3)}" cy="${f(hy - hr * .3)}" r="${f(hr * .35)}" fill="#fff" opacity=".7"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${idSm(pts, true)}" fill="${p.rg(c, .3, .12, .4, .35)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="${idSm(pts.map(([a, b]) => [a * .55, b * .55]), true)}" fill="#f4c4a8" opacity=".35"/>${holes}
        <path d="${idSm(pts.map(([a, b]) => [a * .93, b * .93]), true)}" fill="none" stroke="${dk(c, .15)}" stroke-width=".6" opacity=".6"/></g>`;
}
// とうもろこしの輪切り（端から見た: 黄色の粒が輪にならぶ、芯は淡い）
function idCornRound(p, x, y, s, r = 0){
    let k = '';
    for (const [rr, n] of [[s * .4, 14], [s * .27, 9]]) for (let i = 0; i < n; i++){ const a = i / n * 6.283 + rr; k += `<ellipse cx="${f(Math.cos(a) * rr)}" cy="${f(Math.sin(a) * rr)}" rx="${f(s * .085)}" ry="${f(s * .065)}" transform="rotate(${f(a * 57.3)} ${f(Math.cos(a) * rr)} ${f(Math.sin(a) * rr)})" fill="${p.g('#f6cf3a', .35, .2)}" stroke="#c99a12" stroke-width=".4"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><circle r="${s / 2}" fill="${p.rg('#e8b82a', .2, .25, .4, .36)}" stroke="#b8860e" stroke-width=".7"/></g>${k}<circle r="${f(s * .14)}" fill="#f3e6b0" stroke="#d8c070" stroke-width=".5"/></g>`;
}
// ハヤトウリ（labu siam）のくし形
function idChayote(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-10,4 Q-7,-6 0,-7 Q7,-6 10,4 Q0,7 -10,4Z" fill="${p.g('#d6e6a8', .3, .2)}" stroke="#8fb05a" stroke-width=".7"/></g>
        <path d="M-10,4 Q0,7 10,4 Q0,5.4 -10,2.6Z" fill="#8ab450" opacity=".85"/><path d="M-5,1 Q0,-3 5,1" stroke="#f1f7dc" stroke-width="2" fill="none" opacity=".8"/>${idShine('M-6,-3 Q-1,-6.4 5,-4.6', 1.1, .6)}</g>`;
}
// いんげん（長いささげを 3-4cm に切ったもの）
function idLongBean(p, x, y, L, r = 0, { c = '#5a9a34' } = {}){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="-2.1" width="${L}" height="4.2" rx="2" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".5"/><path d="M${f(-L / 2 + 2)},-.6 L${f(L / 2 - 2)},-.6" stroke="${lt(c, .5)}" stroke-width=".8" stroke-linecap="round" opacity=".8"/><circle cx="${f(L / 2 - 1)}" cy="0" r="1.4" fill="${lt(c, .4)}" stroke="${dk(c, .3)}" stroke-width=".4"/></g>`;
}
// 生ピーナッツ（煮たもの、うす桃色の薄皮）
function idRawPeanut(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .36)}" fill="${p.g('#d8a88a', .3, .25)}" stroke="#9a6a4a" stroke-width=".5"/></g><path d="M${f(-s * .3)},0 Q0,${f(-s * .15)} ${f(s * .3)},0" stroke="#b07a5a" stroke-width=".6" fill="none" opacity=".7"/><ellipse cx="${f(-s * .15)}" cy="${f(-s * .12)}" rx="${f(s * .14)}" ry="${f(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// カリフラワー（白）
function idCauli(p, x, y, s, r = 0, { c = '#f3eedc' } = {}){
    const R = rng(p.id + 'idCau' + x + y);
    let b = '';
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.28, d = i === 0 ? 0 : s * .22; b += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d - s * .05)}" r="${f(s * (.18 + R() * .06))}" fill="${p.g(R() < .5 ? c : lt(c, .3), .35, .18)}" stroke="${dk(c, .22)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${f(-s * .12)},${f(s * .15)} L${f(-s * .1)},${f(s * .5)} L${f(s * .1)},${f(s * .5)} L${f(s * .12)},${f(s * .15)}Z" fill="#dfe3c4" stroke="#b8bd90" stroke-width=".5"/>${b}</g>
        <circle cx="${f(-s * .14)}" cy="${f(-s * .2)}" r="${f(s * .06)}" fill="#fff" opacity=".7"/></g>`;
}
// サウィ（チンゲン菜に近い青菜）: 淡い茎と濃い葉
function idSawi(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'idSw' + seed + x + y);
    const k = s / 30, c = '#3f8a2c';
    const pts = ring(9, 9, .3, R, 1.5, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-15,-3 Q-6,-4.5 2,-3 L2,3 Q-6,4.5 -15,3 Q-17,0 -15,-3Z" fill="${p.g('#cfe39c', .3, .15)}" stroke="#8fb05a" stroke-width=".5"/>
        <path ${T(8, 0)} d="${idSm(pts, true)}" fill="${p.g(R() < .5 ? c : lt(c, .1), .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".5"/></g>
        <path d="M-14,0 L16,0 M4,-1 Q8,-5 13,-6 M4,1 Q8,5 13,6" stroke="${lt(c, .4)}" stroke-width=".8" fill="none" opacity=".8"/>${idShine('M-2,-5 Q6,-8 12,-6', 1, .5)}</g>`;
}
// ほうれん草（bayam）の葉: 丸みのある小さな葉
function idBayam(p, x, y, s, r = 0, { c = '#3a8a2c', seed = 1 } = {}){
    const R = rng(p.id + 'idBy' + seed + x + y);
    const pts = ring(s / 2, 9, .2, R, 1.25, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${idSm(pts, true)}" fill="${p.g(R() < .5 ? c : lt(c, .1), .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".5"/></g>
        <path d="M${f(-s * .55)},0 L${f(s * .5)},0 M${f(-s * .1)},0 Q${f(s * .05)},${f(-s * .25)} ${f(s * .25)},${f(-s * .3)} M${f(-s * .1)},0 Q${f(s * .05)},${f(s * .25)} ${f(s * .25)},${f(s * .3)}" stroke="${lt(c, .45)}" stroke-width=".7" fill="none" opacity=".8"/></g>`;
}
// ライムのくし形（jeruk nipis: 緑の皮、黄緑の果肉）
function idLime(p, x, y, s, r = 0){ return K.lemon(p, x, y, s, r, { c: '#d6e37a', rind: '#5a9a2e' }); }
// こぶみかんの葉（二枚つづき）
function idLimeLeaf(p, x, y, s, r = 0){
    const k = s / 24;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-12,0 Q-9,-5 -1,-4 Q0,-1.5 0,0 Q0,1.5 -1,4 Q-9,5 -12,0Z M0,0 Q1,-3.5 6,-3.6 Q11,-3 12,0 Q11,3 6,3.6 Q1,3.5 0,0Z" fill="${p.g('#2f6e24', .3, .3)}" stroke="#1e4a16" stroke-width=".5"/></g><path d="M-11,0 L11,0" stroke="#7fae5a" stroke-width=".7"/></g>`;
}
// 牛肉の角切り（セムール: 濃い茶、照り）
function idBeefChunk(p, x, y, s, r = 0, { c = '#7a3e1a', seed = 1 } = {}){
    const R = rng(p.id + 'idBf' + seed + x + y);
    const pts = ring(s / 2, 8, .25, R, 1.15, .9);
    const d = idSm(pts, true);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f(-s * .3)},${f(s * .05)} q${f(s * .15)},${f(-s * .1)} ${f(s * .3)},${f(s * .02)} M${f(-s * .2)},${f(s * .25)} q${f(s * .15)},${f(-s * .08)} ${f(s * .34)},0" stroke="${dk(c, .4)}" stroke-width=".9" fill="none" opacity=".55"/>
        ${idShine(`M${f(-s * .32)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .16)},${f(-s * .26)}`, 2, .7)}</g>`;
}
// 煮たじゃがいも（セムール: 煮汁色に染まった角）
function idPotatoChunk(p, x, y, s, r = 0, { c = '#d9a65a', seed = 1 } = {}){
    const R = rng(p.id + 'idPo' + seed + x + y);
    const pts = ring(s / 2, 7, .2, R, 1.1, .92);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .5)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .55 - 1, b * .5 - 1]), true, .5)}" fill="${lt(c, .3)}" opacity=".55"/>
        <path d="${smooth(pts, true, .5)}" fill="#6e3a14" opacity=".12"/>
        ${idShine(`M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .1)},${f(-s * .34)} ${f(s * .14)},${f(-s * .28)}`, 1.5, .6)}</g>`;
}
// 麺（1本の path にまとめる）
function idNoodles(p, x, y, s, { c = '#c07a32', w = 2.2, n = 50, seed = 1, sy = .9, outline = null, hi = .3 } = {}){
    const R = rng(p.id + 'idNd' + seed);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.15 + R() * .82), a0 = R() * 6.28, sweep = 1 + R() * 2.2;
        const cx = x + (R() - .5) * s * .14, cy = y + (R() - .5) * s * .14;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .3); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = idSm(pts);
        d += one; if (R() < hi) dl += one;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.8)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="${outline || dk(c, .3)}" stroke-width="${f(w + .9)}"/><use href="#${id}" stroke="${c}" stroke-width="${w}"/></g><path d="${dl}" stroke="${lt(c, .45)}" stroke-width="${f(w * .45)}" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 鶏むねの薄切り（炒めもの用、白っぽい）
function idChickenSlice(p, x, y, s, r = 0, { c = '#ead2a8', seed = 1 } = {}){
    const R = rng(p.id + 'idCs' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.4, .7);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${idSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g><path d="M${f(-s * .3)},${f(s * .05)} Q0,${f(-s * .05)} ${f(s * .3)},${f(s * .04)}" stroke="${dk(c, .25)}" stroke-width=".6" fill="none" opacity=".6"/>${idShine(`M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .05)},${f(-s * .26)} ${f(s * .2)},${f(-s * .18)}`, 1.2, .6)}</g>`;
}
// セロリの葉（daun seledri: 平たい切れ込みのある葉）
function idCeleryLeaf(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}><path d="M0,6 L0,1 M0,1 L-5,-2 M0,1 L5,-2 M0,1 L0,-5" stroke="#7fae4a" stroke-width="1" fill="none"/>
        ${[[-6, -4, -30], [6, -4, 30], [0, -7, 0]].map(([a, b, rr]) => `<path ${T(a, b, rr)} d="M-3.5,1.5 L-2.5,-1.5 L-1,-.2 L0,-3 L1,-.2 L2.5,-1.5 L3.5,1.5 Q0,3.2 -3.5,1.5Z" fill="${p.g('#4a9a34', .3, .25)}" stroke="#2f6a22" stroke-width=".45"/>`).join('')}</g></g>`;
}
// キャベツのざく切り（炒めて少し透ける）
function idCabbagePiece(p, x, y, s, r = 0, { seed = 1, c = '#d2e3a4' } = {}){ return K.leafPiece(p, x, y, s, r, { c, vein: '#f6f8e6', seed, cooked: true }); }
// 千切り生キャベツの葉（lalapan）
function idRawCabbage(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'idRc' + seed + x + y);
    const k = s / 40;
    const pts = ring(19, 13, .22, R, 1.15, .82);
    const gid = p.def('idRcG', id => `<radialGradient id="${id}" cx=".22" cy=".7" r=".95"><stop offset="0" stop-color="#f4f6e2"/><stop offset=".45" stop-color="#e0ecb8"/><stop offset="1" stop-color="#b9d38a"/></radialGradient>`);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${idSm(pts, true)}" fill="url(#${gid})" stroke="#9fbf6a" stroke-width=".5"/></g>
        <path d="M-20,9 Q-4,3 17,-6 Q-2,1 -19,5Z" fill="#f6f7ea" stroke="#d8e0bc" stroke-width=".5"/>
        <path d="M-9,4.5 Q-11,-2 -16,-5 M-2,2 Q-2,-6 -6,-12 M5,-1 Q7,-8 6,-14 M11,-3.5 Q14,-7 16,-10 M-5,4 Q-2,10 2,13 M4,1 Q8,6 13,7" stroke="#f0f5dc" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// 細長い赤唐辛子の斜め切り（cabai merah）
function idChiliSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s * .7)}" ry="${f(s * .36)}" fill="#d42a1c" stroke="#8a140c" stroke-width=".5"/><ellipse rx="${f(s * .45)}" ry="${f(s * .2)}" fill="#f07a50"/><circle cx="${f(s * .15)}" cy="0" r="${f(s * .07)}" fill="#f6dfa0"/><circle cx="${f(-s * .18)}" cy="${f(s * .05)}" r="${f(s * .06)}" fill="#f6dfa0"/></g>`;
}

// =========================================================
export default {
    // 白ご飯（nasi putih）: 花柄の皿に、ふんわり盛った白いご飯
    id_staple: p => [
        idPlate(p, { c: '#d9485a', leaf: '#4f9a3a' }),
        idRice(p, 100, 100, 128, { density: 1.5, grain: 3.8 }),
        idShine('M56,86 Q62,62 86,52', 3.4, .55), idShine('M66,94 Q70,80 82,72', 2, .4),
    ].join(''),

    // ウコン風味の揚げ鶏（ayam goreng bumbu kuning）: 花柄の皿に、きつね色の骨つき鶏、ラララパン（きゅうり・キャベツ）、サンバル
    id_ayamgoreng: p => [
        idPlate(p, { c: '#2f6aa8', leaf: '#4f9a3a' }),
        idRawCabbage(p, 62, 120, 58, 30, { seed: 1 }), idRawCabbage(p, 76, 142, 50, -20, { seed: 2 }),
        K.cucumberSlice(p, 58, 84, 16, 20), K.cucumberSlice(p, 50, 104, 15, -30), K.cucumberSlice(p, 68, 70, 14, 60),
        idDrum(p, 118, 70, 72, -28, { c: '#c47e26' }),
        idThigh(p, 84, 92, 52, -15, { seed: 1, c: '#cc8a2c' }),
        idThigh(p, 130, 112, 50, 40, { seed: 2, c: '#c27c24' }),
        idDrum(p, 96, 136, 70, 160, { c: '#cd8a2e' }),
        idGrains(p, 108, 104, 110, { cols: ['#e9b84a', '#d49a2a', '#f3d27a'], n: 70, size: 1.3, seed: 2 }),
        idBalado(p, 150, 142, 30, { seed: 3, sy: .9 }),
        idLime(p, 158, 72, 22, 30),
    ].join(''),

    // 甘いしょうゆ煮込み（semur daging）: 鉢に、黒っぽいつやの煮汁、牛肉の角切り、じゃがいも、トマト、揚げエシャロット
    id_semur: p => [
        idBowl(p, { line: '#8a5a2a', c: '#d9485a' }),
        K.liquid(p, { R: 78, c: '#5a2e12', op: 1, shine: false }),
        `<circle cx="100" cy="100" r="62" fill="#8a4a1c" opacity=".3"/>`,
        `<g ${p.sh(.8)}>`,
        idBeefChunk(p, 74, 78, 32, -14, { seed: 1 }), idBeefChunk(p, 128, 72, 30, 20, { seed: 2, c: '#82441c' }), idBeefChunk(p, 138, 120, 32, -30, { seed: 3 }),
        idBeefChunk(p, 66, 124, 30, 40, { seed: 4, c: '#723a18' }), idBeefChunk(p, 100, 142, 30, 10, { seed: 5 }), idBeefChunk(p, 104, 100, 30, 70, { seed: 6, c: '#86461e' }),
        idPotatoChunk(p, 100, 66, 28, 20, { seed: 1 }), idPotatoChunk(p, 72, 100, 26, -30, { seed: 2 }), idPotatoChunk(p, 132, 96, 24, 50, { seed: 3 }), idPotatoChunk(p, 118, 126, 26, -10, { seed: 4 }),
        idTomato(p, 88, 118, 22, 20, { seed: 1 }), idTomato(p, 124, 58, 20, -40, { seed: 2 }),
        `</g>`,
        idOil(p, 100, 100, 140, { n: 10, c: '#c98a3a', op: .4, rmax: 2 }),
        idSoupShine(100, 100, 78, .3),
        idFriedShallot(p, 100, 100, 110, 36, 2),
    ].join(''),

    // 揚げ魚のバラド（ikan goreng balado）: バナナの葉を敷いた皿に、揚げた魚2尾、赤いバラドをのせ、ライム
    id_ikanbalado: p => [
        idPlate(p, { c: '#d9485a', leaf: '#4f9a3a' }),
        idBanana(p, { r: 20, w: 118, R: 76 }),
        idFriedFish(p, 92, 78, 132, -16, { c: '#b8722e', seed: 1 }),
        idFriedFish(p, 106, 124, 128, 170, { c: '#b06a2a', seed: 2 }),
        idBalado(p, 90, 84, 54, { seed: 1, sy: .55 }),
        idBalado(p, 108, 120, 52, { seed: 2, sy: .55 }),
        idBalado(p, 128, 64, 20, { seed: 4, sy: .8 }),
        idLime(p, 156, 140, 22, -30), idLime(p, 44, 60, 20, 40),
    ].join(''),

    // 卵のバラド（telur balado）: 皿に、揚げたゆで卵（丸ごとと半分）を赤いサンバルでからめ、こぶみかんの葉
    id_telurbalado: p => [
        idPlate(p, { c: '#2f8a5a', leaf: '#4f9a3a' }),
        idBalado(p, 100, 102, 124, { seed: 5, sy: .85, op: .95 }),
        idFriedBoiledEgg(p, 74, 80, 40, -20, { seed: 1 }),
        idFriedBoiledEgg(p, 124, 76, 40, 30, { half: true, seed: 2 }),
        idFriedBoiledEgg(p, 70, 124, 40, 40, { half: true, seed: 3 }),
        idFriedBoiledEgg(p, 120, 126, 42, -10, { seed: 4 }),
        idFriedBoiledEgg(p, 100, 102, 40, 80, { half: true, seed: 5 }),
        idGrains(p, 100, 102, 118, { cols: ['#c8301c', '#e8502e'], n: 30, size: 1.6, seed: 6, sy: .85 }),
        idLimeLeaf(p, 96, 64, 24, -20), idLimeLeaf(p, 142, 104, 22, 60), idLimeLeaf(p, 60, 102, 20, 100),
    ].join(''),

    // 豆腐とテンペのバチェム（tahu tempe bacem）: 皿に、こげ茶につやの出た三角の豆腐と板のテンペ、サンバル少し
    id_bacem: p => [
        idPlate(p, { c: '#d98a3a', leaf: '#4f9a3a' }),
        K.pool(p, 100, 104, 100, '#6e3a14', { op: .35, seed: 2, sy: .85 }),
        idTempeh(p, 68, 80, 54, 34, -22, { c: '#7a4418', bean: '#b0783a', seed: 1, dark: true, gloss: .7 }),
        idTempeh(p, 136, 124, 54, 34, 18, { c: '#74401a', bean: '#a8703a', seed: 2, dark: true, gloss: .7 }),
        idTempeh(p, 82, 140, 50, 32, 8, { c: '#7e4616', bean: '#b47c3c', seed: 3, dark: true, gloss: .7 }),
        idTofuTri(p, 128, 72, 42, 10, { seed: 1 }), idTofuTri(p, 104, 104, 40, 190, { seed: 2, c: '#9a5a22' }), idTofuTri(p, 56, 116, 36, 100, { seed: 3, c: '#8e521e' }), idTofuTri(p, 152, 92, 32, -60, { seed: 4 }),
        idFriedShallot(p, 100, 100, 100, 18, 3),
        idBalado(p, 148, 152, 22, { seed: 7, sy: .9 }),
    ].join(''),

    // ナシゴレン（nasi goreng）: 皿に、ケチャップマニス色の炒飯、目玉焼き、きゅうりとトマト、クルプック、揚げエシャロット
    id_nasigoreng: p => [
        idPlate(p, { c: '#d9485a', leaf: '#4f9a3a' }),
        idRice(p, 96, 104, 126, { tint: '#a85c28', grain: 3.6, hiK: .28, density: 1.3 }),
        `<g ${p.sh(.5)}>`,
        idGrains(p, 94, 104, 100, { cols: ['#f1c84a', '#f8dc80'], n: 20, size: 3, seed: 2 }),
        ...[[72, 90, 20], [116, 128, 50], [84, 130, -20], [122, 94, 80]].map(([x, y, r], i) => idChickenSlice(p, x, y, 16, r, { c: '#e0c498', seed: i + 1 })),
        ...[[66, 116, 30], [108, 76, -40], [130, 116, 70]].map(([x, y, r]) => idChiliSlice(p, x, y, 6, r)),
        `</g>`,
        K.scallions(p, 96, 104, 90, { n: 10, c: '#4f9a34' }),
        idFriedShallot(p, 96, 104, 100, 30, 4),
        K.friedEgg(p, 100, 92, 58, 10),
        idKrupuk(p, 150, 70, 44, 20, { seed: 1 }), idKrupuk(p, 160, 96, 38, -40, { seed: 2, c: '#f4dcc0' }),
        K.cucumberSlice(p, 46, 100, 15, 10), K.cucumberSlice(p, 52, 118, 14, -20), K.cucumberSlice(p, 48, 82, 14, 40),
        K.tomatoWedge(p, 60, 142, 22, -30), K.tomatoWedge(p, 80, 154, 20, 10),
    ].join(''),

    // ミーゴレン（mie goreng）: 皿に、つやのある茶色の麺、鶏、キャベツ、サウィ、卵、揚げエシャロット
    id_miegoreng: p => [
        idPlate(p, { c: '#2f6aa8', leaf: '#4f9a3a' }),
        idNoodles(p, 100, 102, 136, { c: '#b8702a', w: 2.4, n: 44, seed: 1, hi: .3 }),
        `<g ${p.sh(.6)}>`,
        ...[[70, 80, 20], [128, 72, -30], [138, 120, 60], [64, 128, -10], [104, 138, 40]].map(([x, y, r], i) => idCabbagePiece(p, x, y, 26, r, { seed: i + 1, c: i % 2 ? '#d8e6a8' : '#c8dc98' })),
        `</g>`,
        idNoodles(p, 100, 100, 112, { c: '#b06a28', w: 2.4, n: 16, seed: 2, hi: .3 }),
        `<g ${p.sh(.6)}>`,
        ...[[86, 92, 30], [118, 102, -20], [96, 120, 70], [122, 128, 10], [76, 108, -50], [110, 74, 20]].map(([x, y, r], i) => idChickenSlice(p, x, y, 18, r, { c: '#e8d0a4', seed: i + 1 })),
        ...[[66, 100, 30], [130, 94, -40], [94, 142, 60], [112, 62, 100], [142, 134, 20]].map(([x, y, r], i) => idSawi(p, x, y, 30, r, { seed: i + 1 })),
        idEggCloud(p, 100, 104, 34, 20, { seed: 1, c: '#f3c848' }), idEggCloud(p, 72, 76, 26, -30, { seed: 2, c: '#f3c848' }), idEggCloud(p, 134, 116, 24, 50, { seed: 3, c: '#f3c848' }),
        `</g>`,
        idFriedShallot(p, 100, 100, 110, 32, 5),
        idChiliSlice(p, 84, 128, 5.5, 20), idChiliSlice(p, 124, 82, 5.5, -40),
        K.scallions(p, 100, 100, 100, { n: 10, c: '#4f9a34' }),
    ].join(''),

    // 空心菜の炒めもの（tumis kangkung）: 楕円皿に、つやのある空心菜の茎と葉、赤唐辛子、エシャロット
    id_tumiskangkung: p => [
        K.ovalDish(p, { rim: '#2f8a5a' }),
        K.pool(p, 100, 102, 126, '#a8884a', { op: .4, seed: 5, sy: .62 }),
        idWaterSpinach(p, 100, 100, 134, { n: 48, seed: 1 }),
        idWaterSpinach(p, 98, 98, 90, { n: 16, seed: 2 }),
        `<g ${p.sh(.4)}>`,
        ...[[74, 90, 30], [118, 84, -40], [96, 116, 70], [132, 118, 10], [64, 118, -20], [110, 70, 50], [84, 134, 100]].map(([x, y, r]) => idChiliSlice(p, x, y, 6.5, r)),
        `</g>`,
        idFriedShallot(p, 100, 100, 100, 22, 6),
        idOil(p, 100, 100, 130, { n: 8, c: '#d9b45a', op: .4, rmax: 1.6 }),
    ].join(''),

    // テンペオレック（tempe orek）: 小鉢に、甘辛く照りの出たテンペの細切り、唐辛子
    id_tempeorek: p => {
        const R = rng('orek');
        let sticks = '';
        const cols = ['#9a5a22', '#b06a2a', '#7e4618', '#c07a30'];
        for (let i = 0; i < 78; i++){
            const a = R() * 6.28, d = Math.sqrt(R()) * 60, cx = 100 + Math.cos(a) * d, cy = 100 + Math.sin(a) * d * .92, ang = R() * 180, L = 14 + R() * 12;
            const c = cols[Math.floor(R() * 4)];
            sticks += `<g ${T(cx, cy, ang)}><rect x="${f(-L / 2)}" y="-2.2" width="${f(L)}" height="4.4" rx="1.2" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/><path d="M${f(-L / 2 + 2)},-.8 L${f(L / 2 - 2)},-.8" stroke="${lt(c, .5)}" stroke-width=".8" stroke-linecap="round" opacity=".7"/>${R() < .5 ? `<circle cx="${f((R() - .5) * L * .6)}" cy=".4" r="1.1" fill="${lt(c, .3)}" opacity=".7"/>` : ''}</g>`;
        }
        return [
            K.bowl(p, { glaze: '#3f7a5a', inside: '#f6f1e6' }),
            K.pool(p, 100, 102, 116, '#7a4418', { op: .5, seed: 3, sy: .9 }),
            `<g ${p.sh(.6)}>${sticks}</g>`,
            `<g ${p.sh(.4)}>`,
            ...[[78, 86, 30], [122, 94, -30], [92, 126, 60], [128, 128, 10], [66, 118, -50]].map(([x, y, r]) => idChiliSlice(p, x, y, 6.5, r)),
            `</g>`,
            idPeanuts(p, 100, 100, 90, 14, 2),
            idLeaf(p, 108, 76, 22, -20, { c: '#5a7a3a', narrow: .7 }),
        ].join('');
    },

    // ペルケデル（perkedel kentang）: 皿に、きつね色の平たいじゃがいものコロッケ、卵衣のレースの縁
    id_perkedel: p => [
        K.plate(p, { rim: '#2f8a5a' }),
        idPerkedel(p, 72, 76, 48, 0, { seed: 1 }), idPerkedel(p, 124, 72, 46, 40, { seed: 2 }),
        idPerkedel(p, 62, 124, 46, 80, { seed: 3 }), idPerkedel(p, 100, 104, 50, 20, { seed: 4 }),
        idPerkedel(p, 138, 122, 46, 120, { seed: 5 }), idPerkedel(p, 100, 148, 44, 200, { seed: 6 }),
        idBalado(p, 156, 70, 22, { seed: 8, sy: .9 }),
    ].join(''),

    // トマトのサンバル（sambal tomat）: 石のすり鉢（cobek）に、赤いサンバル、すりこぎをのせて
    id_sambal: p => [
        idCobek(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#c42e1a', .2, .3, .4, .38)}"/>`,
        idBalado(p, 98, 100, 118, { seed: 9, sy: .9, op: 1 }),
        idGrains(p, 98, 100, 100, { cols: ['#e2402a', '#f07048'], n: 26, size: 2.6, seed: 10, sy: .9 }),
        idGrains(p, 98, 100, 96, { cols: ['#f6dc8a'], n: 24, size: .9, seed: 11, sy: .9 }),
        `<g ${p.sh(.5)}>`,
        idShreds(p, 98, 100, 90, { c: '#3f8a2c', n: 8, w: 1.4, len: .1, seed: 2 }),
        `</g>`,
        idOil(p, 98, 100, 110, { n: 8, c: '#e8702a', op: .5, rmax: 1.8 }),
        idUlekan(p, 134, 134, -40),
        idLime(p, 54, 146, 18, 20),
    ].join(''),

    // ウラップ（urap sayur）: 皿に、ゆでた野菜（ささげ・ほうれん草・もやし・キャベツ）を、香辛料入りのココナッツのそぼろで和えて
    id_urap: p => [
        idPlate(p, { c: '#d98a3a', leaf: '#4f9a3a' }),
        `<g ${p.sh(.6)}><path ${T(100, 102)} d="${smooth(ring(64, 11, .18, rng('urap'), 1, .92))}" fill="${p.rg('#cfdca8', .2, .15)}"/></g>`,
        `<g ${p.sh(.5)}>`,
        ...[[72, 84, 20], [128, 74, -30], [138, 122, 60], [64, 126, -15], [106, 140, 40]].map(([x, y, r], i) => idCabbagePiece(p, x, y, 30, r, { seed: i + 1, c: '#d2e4a2' })),
        ...idSpots('urapb', 14, 56, 15).map(([x, y, r], i) => idBayam(p, x, y, 22, r, { seed: i + 1, c: i % 2 ? '#2f7a24' : '#3a8a2c' })),
        ...[[84, 72, 30], [120, 94, -50], [78, 110, 70], [130, 140, 20], [96, 126, -30], [60, 100, 110], [144, 92, 80], [106, 60, -10], [100, 96, 15], [70, 140, -60]].map(([x, y, r]) => idLongBean(p, x, y, 26, r, { c: '#4f9a2e' })),
        `</g>`,
        idSprouts(p, 100, 102, 110, { n: 16 }),
        idShreds(p, 100, 102, 112, { c: '#f6eed2', n: 90, w: 1.6, len: .06, seed: 3, curve: .4 }),
        idShreds(p, 100, 102, 100, { c: '#e6c878', n: 34, w: 1.5, len: .06, seed: 4, curve: .4 }),
        idGrains(p, 100, 102, 100, { cols: ['#d4301e'], n: 10, size: 1.4, seed: 5 }),
    ].join(''),

    // チャプチャイ（cap cay）: 楕円皿に、とろみの透けるソース、えび、にんじん、カリフラワー、キャベツ、サウィ
    id_capcay: p => [
        K.ovalDish(p, { rim: '#2f6aa8' }),
        K.pool(p, 100, 102, 140, '#d9c89a', { op: .6, seed: 7, sy: .64 }),
        `<g ${p.sh(.6)}>`,
        ...[[62, 92, 20], [138, 112, -20], [108, 128, 50], [90, 74, -40], [134, 80, 70], [76, 122, 10]].map(([x, y, r], i) => idCabbagePiece(p, x, y, 34, r, { seed: i + 1, c: '#d8e8b0' })),
        idSawi(p, 56, 112, 40, 30, { seed: 1 }), idSawi(p, 112, 66, 40, -20, { seed: 2 }), idSawi(p, 152, 122, 38, 70, { seed: 3 }), idSawi(p, 92, 136, 38, 110, { seed: 4 }), idSawi(p, 150, 86, 34, -60, { seed: 5 }),
        idCauli(p, 80, 104, 32, 0), idCauli(p, 120, 96, 30, 30), idCauli(p, 66, 76, 26, -20), idCauli(p, 132, 132, 26, 40),
        K.carrotRound(p, 100, 100, 17, { r: 20 }), K.carrotRound(p, 76, 84, 16, { r: -30 }), K.carrotRound(p, 120, 138, 16, { r: 60 }), K.carrotRound(p, 52, 96, 15, { r: 0 }), K.carrotRound(p, 144, 72, 15, { r: 40 }), K.carrotRound(p, 104, 76, 15, { r: 0 }), K.carrotRound(p, 148, 106, 14, { r: 0 }),
        K.shrimp(p, 90, 92, 28, 20), K.shrimp(p, 124, 114, 28, -60), K.shrimp(p, 100, 120, 26, 100), K.shrimp(p, 64, 108, 25, -20), K.shrimp(p, 128, 84, 24, 140),
        `</g>`,
        idPepper(p, 100, 100, 110, 16),
        `<path d="M44,98 q8,-4 14,-1 M140,60 q6,2 10,6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/>`,
    ].join(''),

    // タマリンドの野菜スープ（sayur asem）: 鉢に、薄茶の酸っぱいスープ、とうもろこし、ハヤトウリ、ささげ、ピーナッツ、ムリンジョの葉
    id_sayurasem: p => [
        idBowl(p, { line: '#2f8a5a', c: '#d9485a' }),
        K.liquid(p, { R: 78, c: '#c8a060', op: .95 }),
        `<circle cx="100" cy="100" r="60" fill="#dcbc80" opacity=".3"/>`,
        `<g ${p.sh(.7)}>`,
        idCornRound(p, 78, 80, 34, 0), idCornRound(p, 128, 122, 32, 20),
        idChayote(p, 126, 74, 30, -30), idChayote(p, 70, 126, 28, 60), idChayote(p, 100, 104, 26, 120),
        ...[[100, 66, 30], [60, 100, -60], [140, 100, 70], [96, 140, 10], [118, 96, -20], [84, 108, 50]].map(([x, y, r]) => idLongBean(p, x, y, 22, r, { c: '#6aa23a' })),
        ...[[90, 92, 20], [112, 134, -30], [64, 80, 60], [136, 140, 10], [118, 60, -50], [74, 142, 40]].map(([x, y, r]) => idRawPeanut(p, x, y, 10, r)),
        ...[[108, 84, 20], [84, 128, -40], [144, 112, 60], [58, 114, 100]].map(([x, y, r]) => idLeaf(p, x, y, 18, r, { c: '#4a8a2c', narrow: .8 })),
        `</g>`,
        idChiliSlice(p, 100, 120, 5.5, 30),
        idOil(p, 100, 100, 130, { n: 8, c: '#e8b85a', op: .45, rmax: 1.6 }),
        idSoupShine(100, 100, 78, .35),
    ].join(''),

    // 鶏のスープ（sop ayam）: 鉢に、澄んだ黄金色のスープ、鶏、にんじん、じゃがいも、キャベツ、セロリの葉、揚げエシャロット
    id_sopayam: p => [
        idBowl(p, { line: '#d9485a', c: '#2f8a5a' }),
        K.liquid(p, { R: 78, c: '#e6c478', op: .9 }),
        `<circle cx="100" cy="100" r="60" fill="#f4dc9a" opacity=".3"/>`,
        `<g ${p.sh(.7)}>`,
        idChickenBit(p, 76, 82, 36, -20, { seed: 1, c: '#e0c08a', bone: true }), idChickenBit(p, 126, 120, 34, 150, { seed: 2, c: '#e4c48e' }), idChickenBit(p, 118, 72, 32, 40, { seed: 3, c: '#dcbc86', bone: true }),
        K.carrotRound(p, 90, 118, 15, { r: 10 }), K.carrotRound(p, 138, 96, 14, { r: -30 }), K.carrotRound(p, 66, 118, 13, { r: 40 }), K.carrotRound(p, 104, 140, 13, { r: 0 }),
        idPotatoChunk(p, 100, 100, 24, 20, { seed: 1, c: '#ead8a0' }), idPotatoChunk(p, 72, 140, 22, -30, { seed: 2, c: '#ead8a0' }), idPotatoChunk(p, 140, 134, 22, 60, { seed: 3, c: '#ead8a0' }),
        idCabbagePiece(p, 58, 94, 22, 30, { seed: 1, c: '#dde9bc' }), idCabbagePiece(p, 100, 64, 22, -20, { seed: 2, c: '#dde9bc' }), idCabbagePiece(p, 146, 110, 20, 80, { seed: 3, c: '#dde9bc' }),
        `</g>`,
        K.scallions(p, 100, 100, 110, { n: 12, c: '#4f9a34' }),
        idCeleryLeaf(p, 92, 94, 18, 20), idCeleryLeaf(p, 118, 100, 16, -40), idCeleryLeaf(p, 84, 70, 15, 70),
        idFriedShallot(p, 100, 100, 110, 22, 7),
        idOil(p, 100, 100, 130, { n: 10, c: '#f0c050', op: .5, rmax: 1.6 }),
        idSoupShine(100, 100, 78, .4),
    ].join(''),

    // ほうれん草ととうもろこしの澄ましスープ（sayur bening bayam）: 鉢に、ごく澄んだスープ、ほうれん草の葉、とうもろこしの粒、薄切りのエシャロット
    id_sayurbening: p => [
        idBowl(p, { line: '#2f6aa8', c: '#d9485a' }),
        K.liquid(p, { R: 78, c: '#e4dcae', op: .72 }),
        `<circle cx="100" cy="100" r="58" fill="#f2ecc8" opacity=".35"/>`,
        idCornRound(p, 128, 84, 30, 10), idCornRound(p, 72, 124, 28, 40),
        `<g ${p.sh(.5)}>`,
        ...idSpots('bening', 22, 58, 15).map(([x, y, r], i) => idBayam(p, x, y, 17 + (i % 3) * 2, r, { seed: i + 1, c: i % 3 ? '#3a8a2c' : '#2f7a24' })),
        ...[[98, 86, 30], [86, 150, -20], [140, 126, 60], [60, 90, 100], [110, 116, -60], [120, 60, 20]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-7" y="-1.4" width="14" height="2.8" rx="1.4" fill="${p.g('#96c060', .3, .2)}" stroke="#5a8a3a" stroke-width=".4"/></g>`),
        `</g>`,
        K.corn(p, 100, 104, 100, { n: 22 }),
        ...[[84, 100, 20], [116, 134, -40], [140, 100, 70], [66, 66, 10], [106, 70, -20]].map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="5" ry="3.2" fill="none" stroke="#e8c8d0" stroke-width="1.4" opacity=".85"/><ellipse rx="2.6" ry="1.5" fill="none" stroke="#d9a8b8" stroke-width=".8" opacity=".8"/></g>`),
        idSoupShine(100, 100, 78, .45),
    ].join(''),
};
