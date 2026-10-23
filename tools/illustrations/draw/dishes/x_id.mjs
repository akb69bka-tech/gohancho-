// インドネシアの家庭料理（2巡目: 汁物・主菜・副菜）。w_id.mjs の部品を写して xid 接頭辞にしたもの
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// 共通の部品（vn〜）: e_rice_noodle / z_soup / b_main_wa2 から写して手直ししたもの
// =========================================================
function xidSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const xidShine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function xidOutline(p, c, r = .55){
    const id = p.def('xidOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// ご飯の山（米粒を2層）
function xidRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xidRice' + seed + x + y);
    const shape = xidSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('xidRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
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
function xidGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, w = null, h = null } = {}){
    const R = rng(p.id + 'xidGr' + seed + x + y);
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
function xidShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'xidSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? xidOutline(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// もやし
function xidSprouts(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'xidSp' + seed + x);
    let st = '', hd = '';
    for (let i = 0; i < n; i++){
        const r2 = Math.sqrt(R()) * s / 2 * .85, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * .9, a = R() * Math.PI, L = 9 + R() * 8, bd = (R() - .5) * 5;
        const x2 = cx + Math.cos(a) * L / 2, y2 = cy + Math.sin(a) * L / 2;
        st += `M${f1(cx - Math.cos(a) * L / 2)} ${f1(cy - Math.sin(a) * L / 2)}Q${f1(cx + bd)} ${f1(cy - bd)} ${f1(x2)} ${f1(y2)}`;
        hd += `M${f1(x2)} ${f1(y2)}l${f1(Math.cos(a) * 1.2)} ${f1(Math.sin(a) * 1.2)}`;
    }
    return `<g ${p.sh(.5)}><g ${xidOutline(p, '#cfc6a6', .45)} fill="none" stroke-linecap="round"><path d="${st}" stroke="#f8f5e8" stroke-width="2.2"/><path d="${hd}" stroke="#e6cf5e" stroke-width="2.8"/></g></g>`;
}
// 汁に浮いた油の粒
function xidOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'idoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// ふんわり溶き卵
function xidEggCloud(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'ide' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${smooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
// 具を散らす位置
function xidSpots(seed, n, rmax, minD, cx = 100, cy = 100){
    const R = rng('idspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// 角切り（かぼちゃ・にんじん）
function xidDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 煮たトマト（くし形のかけら）
function xidTomato(p, x, y, s, r = 0, { seed = 1, c = '#e2412c' } = {}){
    const R = rng(p.id + 'idtm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="${lt(c, .3)}" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 汁のつや
const xidSoupShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 小さな葉（ハーブ）
function xidLeaf(p, x, y, s, r = 0, { c = '#2f7a2a', narrow = 1, spot = false } = {}){
    return `<g ${T(x, y, r)}><g transform="scale(${f(s / 20)} ${f(s / 20 * narrow)})"><g ${p.sh(.5)}><path d="M-10,0 Q-4,-7.5 6,-4.5 Q10,-2 10,0 Q10,2 6,4.5 Q-4,7.5 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 9,0 M-3,0 L1,-4 M2,0 L5,-3 M-3,0 L1,4 M2,0 L5,3" stroke="${lt(c, .35)}" stroke-width=".7" fill="none"/>
        ${spot ? `<ellipse cx="-1" cy="0" rx="2.4" ry="1.6" fill="#6a2a3a" opacity=".55"/>` : ''}
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g></g>`;
}
// パクチー（丸い切れ込みの小さな葉）
function xidCoriander(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}>${[[-5, -2, 5.5], [3, -4, 5], [4, 4, 5.2], [-4, 5, 4.6]].map(([a, b, rr], i) => `<path ${T(a, b, i * 50)} d="M-${rr},0 Q-${rr},-${rr} 0,-${rr} Q${rr * .4},-${rr * .7} ${rr * .5},-${rr * .3} Q${rr},-${rr * .4} ${rr},0 Q${rr},${rr} 0,${rr} Q-${rr},${rr} -${rr},0Z" fill="${p.g(i % 2 ? '#3f8f2f' : '#4c9c36', .3, .25)}" stroke="#2c6a20" stroke-width=".5"/>`).join('')}</g>
        <path d="M0,0 L-5,-2 M0,0 L3,-4 M0,0 L4,4 M0,0 L-4,5 M0,0 L2,11" stroke="#8cbf5c" stroke-width=".9" fill="none"/></g>`;
}
// ねぎのぶつ切り（4cm、緑の筒）
function xidScallion(p, x, y, L, r = 0, { c = '#5aa33a', white = false } = {}){
    const col = white ? '#eef3df' : c, w = 4.2;
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g(col, .3, .2)}" stroke="${dk(col, .3)}" stroke-width=".5"/>
        <path d="M${f(-L / 2 + 2)},-.6 L${f(L / 2 - 2)},-.6" stroke="${lt(col, .45)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}
// 唐辛子の輪切り
function xidChili(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="#d42a1c" stroke="#9a1a10" stroke-width=".5"/><circle r="${f(s * .3)}" fill="#f07a50"/><circle cx="${f(s * .08)}" cy="${f(-s * .05)}" r="${f(s * .08)}" fill="#f6dfa0"/><circle cx="${f(-s * .1)}" cy="${f(s * .06)}" r="${f(s * .07)}" fill="#f6dfa0"/></g>`;
}
// 黒こしょう
const xidPepper = (p, x, y, s, n = 24) => K.sprinkle(p, x, y, s, { c: '#2a1c14', n, r: .75 });

// =========================================================
// ベトナムのファイルから写した部品
// =========================================================
// 鶏のぶつ切り（骨つき、飴色の照り）
function xidChickenBit(p, x, y, s, r = 0, { c = '#b9702c', seed = 1, bone = false } = {}){
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
        ${xidShine('M-8,-3.5 Q-4,-7.6 3,-6.8', 2, .85)}<circle cx="6" cy="-3" r=".9" fill="#fff" opacity=".7"/></g>`;
}
// 揚げ豆腐の角切り（きつね色）
function xidFriedTofu(p, x, y, s, r = 0, { c = '#e3a64c', sauce = null } = {}){
    const R = rng(p.id + 'idtf' + x + y);
    const h = s / 2;
    let bl = '';
    for (let i = 0; i < 5; i++) bl += `<circle cx="${f(-h + 3 + R() * (s * .88 - 6))}" cy="${f(-h + 3 + R() * (s * .88 - 6))}" r="${f(.6 + R() * .8)}" fill="${dk(c, .2)}" opacity=".45"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .25)}"/></g>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.rg(c, .3, .2, .35, .32)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        ${bl}
        ${sauce ? `<path d="M${f(-h)},${f(h * .25)} Q${f(-h * .2)},${f(h * .02)} ${f(h * .72)},${f(h * .4)} L${f(h * .72)},${f(h * .72)} L${f(-h)},${f(h * .72)}Z" fill="${sauce}" opacity=".85"/>` : ''}
        ${xidShine(`M${f(-h + 3)},${f(-h + 3.5)} Q${f(-h * .2)},${f(-h + 2)} ${f(h * .45)},${f(-h + 3.5)}`, 1.6, .75)}</g>`;
}
// 空心菜（筒状の茎のぶつ切りと矢じり形の葉）
function xidWaterSpinach(p, x, y, s, { n = 30, seed = 1, cooked = true } = {}){
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
const xidFriedGarlic = (p, x, y, s, n = 26, seed = 1) => xidGrains(p, x, y, s, { cols: ['#e4ad48', '#c98a2a', '#f2cc72'], n, size: 1.3, seed });
const xidFriedShallot = (p, x, y, s, n = 24, seed = 1) => xidGrains(p, x, y, s, { cols: ['#a8642a', '#8a4c1c', '#c4823c'], n, size: 1.5, seed });
const xidPeanuts = (p, x, y, s, n = 18, seed = 1) => xidGrains(p, x, y, s, { cols: ['#e2b878', '#c99556', '#f0d4a0'], n, size: 2.2, seed });


// 千切りキャベツの山（軽量版: 色ごとに1本のpath）
function xidCabbageBed(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'idcbd' + seed);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(ring(s / 2, 10, .2, R, 1, .94))}" fill="${p.rg('#eef6dc', .3, .1)}"/></g>`
        + xidShreds(p, x, y, s * .92, { c: '#cfe6a0', n: 70, w: 1.8, len: .16, seed: seed + 1, curve: .5 })
        + xidShreds(p, x, y, s * .9, { c: '#f3f8e4', n: 60, w: 1.8, len: .16, seed: seed + 2, curve: .5 })
        + xidShreds(p, x, y, s * .8, { c: '#a9cf6c', n: 24, w: 1.6, len: .14, seed: seed + 3, curve: .5 });
}


// =========================================================
// インドネシア向けの部品
// =========================================================
// 同じ部品を何度も使うときは defs に1回描いて use する（SVG を小さく）
function xidUse(p, key, make, x, y, r = 0, k = 1){
    const id = p.def('xidU' + key, id => `<g id="${id}">${make()}</g>`);
    return `<use href="#${id}" ${T(x, y, r, k)}/>`;
}
const xidCrumbArc = (d, w = 1.6, op = .7) => xidShine(d, w, op);

// ---------- 器 ----------
// 白い丸皿に小花の輪（piring kembang: どこの家にもあるメラミン・陶器の花柄皿）
function xidPlate(p, { c = '#d9485a', leaf = '#4f9a3a', R = 94, n = 12 } = {}){
    let fl = '';
    const petal = Array.from({ length: 5 }, (_, j) => { const a = j / 5 * 6.283 - 1.57; return `<ellipse cx="${f(Math.cos(a) * 2.6)}" cy="${f(Math.sin(a) * 2.6)}" rx="2" ry="1.4" transform="rotate(${f(a * 57.3)} ${f(Math.cos(a) * 2.6)} ${f(Math.sin(a) * 2.6)})" fill="${c}"/>`; }).join('');
    const fid = p.def('xidFl' + c + leaf, id => `<g id="${id}"><path d="M-9,1 Q-6,-2.5 -3.5,-.5 Q-6,1.5 -9,1Z M9,1 Q6,-2.5 3.5,-.5 Q6,1.5 9,1Z" fill="${leaf}" opacity=".85"/>${petal}<circle r="1.1" fill="#f2c94a"/></g>`);
    for (let i = 0; i < n; i++){
        const a = i / n * 6.283 + .26, x = 100 + Math.cos(a) * (R - 9), y = 100 + Math.sin(a) * (R - 9);
        fl += `<use href="#${fid}" ${T(x, y, a * 57.3 + 90)}/>`;
        const b = a + 3.1416 / n, bx = 100 + Math.cos(b) * (R - 9), by = 100 + Math.sin(b) * (R - 9);
        fl += `<circle cx="${f(bx)}" cy="${f(by)}" r="1.1" fill="${leaf}" opacity=".7"/>`;
    }
    return K.plate(p, { R, rim: 'none', well: .74 }) + `<circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="${c}" stroke-width="1" opacity=".55"/>` + fl;
}
// 白い鉢（mangkuk）: 縁に色の線と小花
function xidBowl(p, { line = '#2f8a5a', c = '#d9485a', R = 92, inside = '#fbf9f3' } = {}){
    let m = '';
    for (let i = 0; i < 10; i++){
        const a = i / 10 * 6.283 + .3, x = 100 + Math.cos(a) * (R * .915), y = 100 + Math.sin(a) * (R * .915);
        m += `<g ${T(x, y)}><circle r="1.6" fill="${c}"/><circle cx="-3" cy="0" r=".9" fill="${line}"/><circle cx="3" cy="0" r=".9" fill="${line}"/></g>`;
    }
    return K.bowl(p, { glaze: '#f6f3ec', inside, R }) + `<circle cx="100" cy="100" r="${f(R * .955)}" fill="none" stroke="${line}" stroke-width="2" opacity=".9"/><circle cx="100" cy="100" r="${f(R * .875)}" fill="none" stroke="${line}" stroke-width=".8" opacity=".7"/>` + m;
}
// バナナの葉を皿に敷く（縁で切る）
function xidBanana(p, { r = -28, w = 128, R = 88, cx = 100, cy = 100 } = {}){
    const clip = p.uid();
    let veins = '';
    for (let i = -14; i <= 14; i++){ const x = i * 7; veins += `M${x},-4 L${x + 26},${-w / 2} M${x},4 L${x + 26},${w / 2}`; }
    const g = p.def('xidBanG', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa24a"/><stop offset=".45" stop-color="#3f8a36"/><stop offset=".55" stop-color="#3a8232"/><stop offset="1" stop-color="#2e6e2a"/></linearGradient>`);
    return `<defs><clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>
        <g clip-path="url(#${clip})"><g ${T(cx, cy, r)}><g ${p.sh(.8)}><path d="M-120,${-w / 2 + 2} Q-40,${-w / 2 - 3} 0,${-w / 2} T120,${-w / 2 + 3} L120,${w / 2 - 2} Q40,${w / 2 + 3} 0,${w / 2} T-120,${w / 2 - 2}Z" fill="url(#${g})"/></g>
        <path d="${veins}" stroke="#6fb85a" stroke-width=".7" opacity=".55" fill="none"/>
        <path d="M-120,0 L120,0" stroke="#b9d98a" stroke-width="4.5"/><path d="M-120,1.6 L120,1.6" stroke="#8fbf5c" stroke-width="1.2"/>
        <path d="M-90,${-w / 2 + 8} Q-40,${-w / 2 + 4} 10,${-w / 2 + 7}" stroke="#fff" stroke-width="2" fill="none" opacity=".3" stroke-linecap="round"/></g></g>`;
}
// 石のすり鉢（cobek）とすりこぎ（ulekan）
function xidCobek(p, { R = 90 } = {}){
    const stone = p.def('xidStone', id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .1 0 0 0 0 .1 0 0 0 0 .1 0 0 0 .35 0" result="m"/><feComposite in="m" in2="SourceAlpha" operator="in" result="s"/><feBlend in="s" in2="SourceGraphic" mode="multiply"/></filter>`);
    return `<g ${p.sh(2.2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#6a6662', .2, .3, .35, .3)}"/></g>
        <g filter="url(#${stone})"><circle cx="100" cy="100" r="${R}" fill="${p.rg('#6e6a66', .18, .28, .35, .3)}"/>
        <circle cx="100" cy="100" r="${R - 12}" fill="${p.rg('#4a4644', .1, .25, .6, .62)}"/></g>
        <circle cx="100" cy="100" r="${R - 12}" fill="none" stroke="#3a3634" stroke-width="1.4" opacity=".8"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".3"/>`;
}
function xidUlekan(p, x, y, r){
    return `<g ${T(x, y, r)}><g ${p.sh(1.6)}><path d="M-30,-9 Q-34,0 -30,9 L18,8 Q30,8 30,0 Q30,-8 18,-8Z" fill="${p.g('#6c6864', .25, .3)}" stroke="#3a3634" stroke-width=".8"/></g>
        <path d="M-27,-5 Q-8,-7 14,-5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}

// ---------- 料理の部品 ----------
// 揚げた鶏（ウコン色のきつね色、ざらっとした皮）: もも
function xidThigh(p, x, y, s, r = 0, { c = '#c9842a', seed = 1 } = {}){
    const R = rng(p.id + 'xidTh' + seed + x + y);
    const pts = ring(10, 10, .28, R, 1.25, .85);
    let spots = '';
    for (let i = 0; i < 7; i++) spots += `<ellipse cx="${f((R() - .5) * 16)}" cy="${f((R() - .5) * 11)}" rx="${f(1.5 + R() * 2.5)}" ry="${f(1 + R() * 1.6)}" fill="${dk(c, .35)}" opacity="${f(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r, s / 24)}><g ${p.sh(.8)}><path d="${xidSm(pts, true)}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <g ${p.crumb(.7)}><path d="${xidSm(pts, true)}" fill="${lt(c, .05)}" opacity=".5"/></g>${spots}
        <path d="${xidSm(pts.map(([a, b]) => [a * .6 + 1.5, b * .55 + 1.5]), true)}" fill="${dk(c, .18)}" opacity=".3"/>
        ${xidShine('M-8,-3.5 Q-3,-7.5 4,-6.5', 2, .7)}${xidShine('M4,-2 Q7,-2 9,0', 1, .45)}</g>`;
}
// 揚げた鶏: 骨つきのドラム
function xidDrum(p, x, y, s, r = 0, { c = '#c9842a' } = {}){
    const k = s / 44;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}>
        <path d="M12,-2.6 L21,-3 Q24,-6 26,-4 Q28,-2 26,0 Q28,2 26,4 Q24,6 21,3 L12,2.6Z" fill="${p.g('#e9d6b6', .3, .25)}" stroke="#a88a5c" stroke-width=".6"/>
        <path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <g ${p.crumb(.7)}><path d="M-20,-2 C-20,-11 -9,-14 -1,-11 C6,-8.5 10,-5 15,-3.2 L15,3.2 C10,5 6,8.5 -1,11 C-9,14 -20,11 -20,2Z" fill="${lt(c, .05)}" opacity=".5"/></g>
        <path d="M-14,4 Q-6,10 4,7" stroke="${dk(c, .35)}" stroke-width="1.4" fill="none" opacity=".4"/>
        <ellipse cx="-8" cy="3" rx="3" ry="1.6" fill="${dk(c, .4)}" opacity=".35"/><ellipse cx="3" cy="-5" rx="2.4" ry="1.4" fill="${dk(c, .4)}" opacity=".3"/>
        ${xidShine('M-16,-5 Q-10,-11 -2,-9.5', 2.2, .75)}${xidShine('M2,-6 Q7,-4.5 11,-3', 1.2, .5)}</g>`;
}
// 揚げ魚（丸ごと、切り込み入り、きつね色）
function xidFriedFish(p, x, y, L, r = 0, { c = '#b8722e', seed = 1 } = {}){
    const k = L / 104;
    const R = rng(p.id + 'xidFsh' + seed);
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
        ${xidShine('M-40,-12 Q-24,-20 -2,-19', 2.4, .55)}${xidShine('M8,-17 Q18,-14 26,-9', 1.6, .45)}</g>`;
}
// バラド（粗くつぶした赤唐辛子のサンバル）: 不定形の赤い塊に、皮のかけらと種
function xidBalado(p, x, y, s, { seed = 1, sy = .8, op = .95 } = {}){
    const R = rng(p.id + 'xidBal' + seed + x + y);
    const shape = xidSm(ring(s / 2, 11, .4, R, 1, sy), true);
    let bits = '', seeds = '';
    for (let i = 0; i < Math.round(s * .5); i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .9, bx = Math.cos(a) * d, by = Math.sin(a) * d * sy;
        bits += `<path ${T(bx, by, R() * 180)} d="${xidSm(ring(1.6 + R() * 2.6, 6, .5, R, 1.6, .7), true)}" fill="${['#e8402a', '#a81c12', '#f06040', '#c22a1a'][Math.floor(R() * 4)]}" opacity=".9"/>`;
        if (R() < .35) seeds += `<ellipse cx="${f(bx + 2)}" cy="${f(by - 1)}" rx="1.1" ry=".7" transform="rotate(${f(R() * 180)} ${f(bx + 2)} ${f(by - 1)})" fill="#f6dc8a"/>`;
    }
    return `<g ${T(x, y)} opacity="${op}"><g ${p.sh(.7)}><path d="${shape}" fill="${p.rg('#c8301c', .2, .25, .4, .36)}" stroke="#8a160e" stroke-width=".6"/></g>${bits}${seeds}
        <path d="${shape}" fill="${p.rg('#e85030', .3, .1, .3, .3)}" opacity=".25"/>
        ${xidShine(`M${f(-s * .28)},${f(-s * .1)} Q${f(-s * .12)},${f(-s * .3 * sy)} ${f(s * .1)},${f(-s * .3 * sy)}`, 1.8, .45)}</g>`;
}
// 揚げたゆで卵（表面がきつね色に泡立つ）。half で断面
function xidFriedBoiledEgg(p, x, y, s, r = 0, { half = false, seed = 1 } = {}){
    const R = rng(p.id + 'xidFbe' + seed + x + y);
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
function xidTempeh(p, x, y, w, h, r = 0, { c = '#e8d6a8', bean = '#c9a86a', seed = 1, gloss = .5, dark = false } = {}){
    const R = rng(p.id + 'xidTmp' + seed + x + y);
    let beans = '';
    const n = Math.round(w * h / 38);
    for (let i = 0; i < n; i++){ const bx = (R() - .5) * (w - 4), by = (R() - .5) * (h - 4); beans += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(1.8 + R() * .8)}" ry="${f(1.3 + R() * .6)}" transform="rotate(${f(R() * 180)} ${f(bx)} ${f(by)})" fill="${R() < .5 ? bean : dk(bean, .18)}" opacity="${dark ? .55 : .8}"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>${beans}
        ${dark ? `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2" fill="${p.g(c, .1, .35)}" opacity=".35"/>` : ''}
        ${xidShine(`M${f(-w / 2 + 3)},${f(-h / 2 + 3)} Q${f(-w * .1)},${f(-h / 2 + 1.5)} ${f(w * .3)},${f(-h / 2 + 3)}`, 1.6, gloss)}</g>`;
}
// 三角に切った豆腐（バチェム: こげ茶で照り）
function xidTofuTri(p, x, y, s, r = 0, { c = '#94541e', seed = 1 } = {}){
    const R = rng(p.id + 'xidTt' + seed + x + y);
    const j = () => (R() - .5) * 2;
    const pts = [[-s / 2 + j(), -s / 2 + j()], [s / 2 + j(), -s / 2 + j()], [-s / 2 + j(), s / 2 + j()]];
    const d = `M${pts.map(([a, b]) => `${f(a)},${f(b)}`).join('L')}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${d}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7" stroke-linejoin="round"/></g>
        <path d="M${f(-s / 2 + 4)},${f(-s / 2 + 4)} L${f(s / 2 - 8)},${f(-s / 2 + 4)} L${f(-s / 2 + 4)},${f(s / 2 - 8)}Z" fill="${lt(c, .15)}" opacity=".45"/>
        <circle cx="${f(-s * .1)}" cy="${f(-s * .05)}" r="1.3" fill="${dk(c, .3)}" opacity=".5"/><circle cx="${f(-s * .3)}" cy="${f(s * .2)}" r="1" fill="${dk(c, .3)}" opacity=".5"/>
        ${xidShine(`M${f(-s / 2 + 4)},${f(-s / 2 + 6)} Q${f(-s * .15)},${f(-s / 2 + 3)} ${f(s * .15)},${f(-s / 2 + 5)}`, 1.6, .7)}</g>`;
}
// ペルケデル（じゃがいものコロッケ: 平たい丸、卵衣のレースの縁、こげ目、セロリの葉）
function xidPerkedel(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidPk' + seed + x + y);
    const lace = xidSm(ring(s / 2, 16, .3, R, 1.05, .95), true);
    const body = xidSm(ring(s / 2 * .86, 12, .1, R, 1.05, .95), true);
    let br = '', cel = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; br += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(2.5 + R() * 4)}" ry="${f(1.8 + R() * 2.4)}" transform="rotate(${f(R() * 180)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="#b06a1e" opacity="${f(.25 + R() * .3)}"/>`; }
    for (let i = 0; i < 5; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .34; cel += `<path ${T(Math.cos(a) * d, Math.sin(a) * d, R() * 180)} d="M-2.2,-.8 L2.2,-.8 L2.2,.8 L-2.2,.8Z" fill="#4f8a2e"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${lace}" fill="${p.g('#f0c04a', .3, .3)}" stroke="#b8781c" stroke-width=".7"/></g>
        <g ${p.crumb(.6)}><path d="${body}" fill="${p.rg('#e6a83a', .3, .25, .38, .34)}" stroke="#b07018" stroke-width=".6"/></g>${br}${cel}
        ${xidShine(`M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .12)},${f(-s * .34)} ${f(s * .12)},${f(-s * .3)}`, 2, .6)}</g>`;
}
// クルプック（えびせんべい: うす桃色の波打つ円盤、泡の穴）
function xidKrupuk(p, x, y, s, r = 0, { seed = 1, c = '#f6e6c4' } = {}){
    const R = rng(p.id + 'xidKr' + seed + x + y);
    const pts = ring(s / 2, 18, .16, R, 1.12, .92);
    let holes = '';
    for (let i = 0; i < 15; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .42, hx = Math.cos(a) * d * 1.05, hy = Math.sin(a) * d * .88, hr = .9 + R() * 1.8; holes += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(hr)}" fill="${dk(c, .12)}" stroke="${dk(c, .28)}" stroke-width=".4"/><circle cx="${f(hx - hr * .3)}" cy="${f(hy - hr * .3)}" r="${f(hr * .35)}" fill="#fff" opacity=".7"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${xidSm(pts, true)}" fill="${p.rg(c, .3, .12, .4, .35)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="${xidSm(pts.map(([a, b]) => [a * .55, b * .55]), true)}" fill="#f4c4a8" opacity=".35"/>${holes}
        <path d="${xidSm(pts.map(([a, b]) => [a * .93, b * .93]), true)}" fill="none" stroke="${dk(c, .15)}" stroke-width=".6" opacity=".6"/></g>`;
}
// とうもろこしの輪切り（端から見た: 黄色の粒が輪にならぶ、芯は淡い）
function xidCornRound(p, x, y, s, r = 0){
    let k = '';
    for (const [rr, n] of [[s * .4, 14], [s * .27, 9]]) for (let i = 0; i < n; i++){ const a = i / n * 6.283 + rr; k += `<ellipse cx="${f(Math.cos(a) * rr)}" cy="${f(Math.sin(a) * rr)}" rx="${f(s * .085)}" ry="${f(s * .065)}" transform="rotate(${f(a * 57.3)} ${f(Math.cos(a) * rr)} ${f(Math.sin(a) * rr)})" fill="${p.g('#f6cf3a', .35, .2)}" stroke="#c99a12" stroke-width=".4"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><circle r="${s / 2}" fill="${p.rg('#e8b82a', .2, .25, .4, .36)}" stroke="#b8860e" stroke-width=".7"/></g>${k}<circle r="${f(s * .14)}" fill="#f3e6b0" stroke="#d8c070" stroke-width=".5"/></g>`;
}
// ハヤトウリ（labu siam）のくし形
function xidChayote(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-10,4 Q-7,-6 0,-7 Q7,-6 10,4 Q0,7 -10,4Z" fill="${p.g('#d6e6a8', .3, .2)}" stroke="#8fb05a" stroke-width=".7"/></g>
        <path d="M-10,4 Q0,7 10,4 Q0,5.4 -10,2.6Z" fill="#8ab450" opacity=".85"/><path d="M-5,1 Q0,-3 5,1" stroke="#f1f7dc" stroke-width="2" fill="none" opacity=".8"/>${xidShine('M-6,-3 Q-1,-6.4 5,-4.6', 1.1, .6)}</g>`;
}
// いんげん（長いささげを 3-4cm に切ったもの）
function xidLongBean(p, x, y, L, r = 0, { c = '#5a9a34' } = {}){
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="-2.1" width="${L}" height="4.2" rx="2" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".5"/><path d="M${f(-L / 2 + 2)},-.6 L${f(L / 2 - 2)},-.6" stroke="${lt(c, .5)}" stroke-width=".8" stroke-linecap="round" opacity=".8"/><circle cx="${f(L / 2 - 1)}" cy="0" r="1.4" fill="${lt(c, .4)}" stroke="${dk(c, .3)}" stroke-width=".4"/></g>`;
}
// 生ピーナッツ（煮たもの、うす桃色の薄皮）
function xidRawPeanut(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .36)}" fill="${p.g('#d8a88a', .3, .25)}" stroke="#9a6a4a" stroke-width=".5"/></g><path d="M${f(-s * .3)},0 Q0,${f(-s * .15)} ${f(s * .3)},0" stroke="#b07a5a" stroke-width=".6" fill="none" opacity=".7"/><ellipse cx="${f(-s * .15)}" cy="${f(-s * .12)}" rx="${f(s * .14)}" ry="${f(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// カリフラワー（白）
function xidCauli(p, x, y, s, r = 0, { c = '#f3eedc' } = {}){
    const R = rng(p.id + 'xidCau' + x + y);
    let b = '';
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.28, d = i === 0 ? 0 : s * .22; b += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d - s * .05)}" r="${f(s * (.18 + R() * .06))}" fill="${p.g(R() < .5 ? c : lt(c, .3), .35, .18)}" stroke="${dk(c, .22)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${f(-s * .12)},${f(s * .15)} L${f(-s * .1)},${f(s * .5)} L${f(s * .1)},${f(s * .5)} L${f(s * .12)},${f(s * .15)}Z" fill="#dfe3c4" stroke="#b8bd90" stroke-width=".5"/>${b}</g>
        <circle cx="${f(-s * .14)}" cy="${f(-s * .2)}" r="${f(s * .06)}" fill="#fff" opacity=".7"/></g>`;
}
// サウィ（チンゲン菜に近い青菜）: 淡い茎と濃い葉
function xidSawi(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidSw' + seed + x + y);
    const k = s / 30, c = '#3f8a2c';
    const pts = ring(9, 9, .3, R, 1.5, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-15,-3 Q-6,-4.5 2,-3 L2,3 Q-6,4.5 -15,3 Q-17,0 -15,-3Z" fill="${p.g('#cfe39c', .3, .15)}" stroke="#8fb05a" stroke-width=".5"/>
        <path ${T(8, 0)} d="${xidSm(pts, true)}" fill="${p.g(R() < .5 ? c : lt(c, .1), .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".5"/></g>
        <path d="M-14,0 L16,0 M4,-1 Q8,-5 13,-6 M4,1 Q8,5 13,6" stroke="${lt(c, .4)}" stroke-width=".8" fill="none" opacity=".8"/>${xidShine('M-2,-5 Q6,-8 12,-6', 1, .5)}</g>`;
}
// ほうれん草（bayam）の葉: 丸みのある小さな葉
function xidBayam(p, x, y, s, r = 0, { c = '#3a8a2c', seed = 1 } = {}){
    const R = rng(p.id + 'xidBy' + seed + x + y);
    const pts = ring(s / 2, 9, .2, R, 1.25, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${xidSm(pts, true)}" fill="${p.g(R() < .5 ? c : lt(c, .1), .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".5"/></g>
        <path d="M${f(-s * .55)},0 L${f(s * .5)},0 M${f(-s * .1)},0 Q${f(s * .05)},${f(-s * .25)} ${f(s * .25)},${f(-s * .3)} M${f(-s * .1)},0 Q${f(s * .05)},${f(s * .25)} ${f(s * .25)},${f(s * .3)}" stroke="${lt(c, .45)}" stroke-width=".7" fill="none" opacity=".8"/></g>`;
}
// ライムのくし形（jeruk nipis: 緑の皮、黄緑の果肉）
function xidLime(p, x, y, s, r = 0){ return K.lemon(p, x, y, s, r, { c: '#d6e37a', rind: '#5a9a2e' }); }
// こぶみかんの葉（二枚つづき）
function xidLimeLeaf(p, x, y, s, r = 0){
    const k = s / 24;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-12,0 Q-9,-5 -1,-4 Q0,-1.5 0,0 Q0,1.5 -1,4 Q-9,5 -12,0Z M0,0 Q1,-3.5 6,-3.6 Q11,-3 12,0 Q11,3 6,3.6 Q1,3.5 0,0Z" fill="${p.g('#2f6e24', .3, .3)}" stroke="#1e4a16" stroke-width=".5"/></g><path d="M-11,0 L11,0" stroke="#7fae5a" stroke-width=".7"/></g>`;
}
// 牛肉の角切り（セムール: 濃い茶、照り）
function xidBeefChunk(p, x, y, s, r = 0, { c = '#7a3e1a', seed = 1 } = {}){
    const R = rng(p.id + 'xidBf' + seed + x + y);
    const pts = ring(s / 2, 8, .25, R, 1.15, .9);
    const d = xidSm(pts, true);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${d}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f(-s * .3)},${f(s * .05)} q${f(s * .15)},${f(-s * .1)} ${f(s * .3)},${f(s * .02)} M${f(-s * .2)},${f(s * .25)} q${f(s * .15)},${f(-s * .08)} ${f(s * .34)},0" stroke="${dk(c, .4)}" stroke-width=".9" fill="none" opacity=".55"/>
        ${xidShine(`M${f(-s * .32)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .16)},${f(-s * .26)}`, 2, .7)}</g>`;
}
// 煮たじゃがいも（セムール: 煮汁色に染まった角）
function xidPotatoChunk(p, x, y, s, r = 0, { c = '#d9a65a', seed = 1 } = {}){
    const R = rng(p.id + 'xidPo' + seed + x + y);
    const pts = ring(s / 2, 7, .2, R, 1.1, .92);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .5)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .55 - 1, b * .5 - 1]), true, .5)}" fill="${lt(c, .3)}" opacity=".55"/>
        <path d="${smooth(pts, true, .5)}" fill="#6e3a14" opacity=".12"/>
        ${xidShine(`M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .1)},${f(-s * .34)} ${f(s * .14)},${f(-s * .28)}`, 1.5, .6)}</g>`;
}
// 麺（1本の path にまとめる）
function xidNoodles(p, x, y, s, { c = '#c07a32', w = 2.2, n = 50, seed = 1, sy = .9, outline = null, hi = .3 } = {}){
    const R = rng(p.id + 'xidNd' + seed);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.15 + R() * .82), a0 = R() * 6.28, sweep = 1 + R() * 2.2;
        const cx = x + (R() - .5) * s * .14, cy = y + (R() - .5) * s * .14;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .3); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = xidSm(pts);
        d += one; if (R() < hi) dl += one;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.8)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="${outline || dk(c, .3)}" stroke-width="${f(w + .9)}"/><use href="#${id}" stroke="${c}" stroke-width="${w}"/></g><path d="${dl}" stroke="${lt(c, .45)}" stroke-width="${f(w * .45)}" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 鶏むねの薄切り（炒めもの用、白っぽい）
function xidChickenSlice(p, x, y, s, r = 0, { c = '#ead2a8', seed = 1 } = {}){
    const R = rng(p.id + 'xidCs' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.4, .7);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xidSm(pts, true)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g><path d="M${f(-s * .3)},${f(s * .05)} Q0,${f(-s * .05)} ${f(s * .3)},${f(s * .04)}" stroke="${dk(c, .25)}" stroke-width=".6" fill="none" opacity=".6"/>${xidShine(`M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .05)},${f(-s * .26)} ${f(s * .2)},${f(-s * .18)}`, 1.2, .6)}</g>`;
}
// セロリの葉（daun seledri: 平たい切れ込みのある葉）
function xidCeleryLeaf(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}><path d="M0,6 L0,1 M0,1 L-5,-2 M0,1 L5,-2 M0,1 L0,-5" stroke="#7fae4a" stroke-width="1" fill="none"/>
        ${[[-6, -4, -30], [6, -4, 30], [0, -7, 0]].map(([a, b, rr]) => `<path ${T(a, b, rr)} d="M-3.5,1.5 L-2.5,-1.5 L-1,-.2 L0,-3 L1,-.2 L2.5,-1.5 L3.5,1.5 Q0,3.2 -3.5,1.5Z" fill="${p.g('#4a9a34', .3, .25)}" stroke="#2f6a22" stroke-width=".45"/>`).join('')}</g></g>`;
}
// キャベツのざく切り（炒めて少し透ける）
function xidCabbagePiece(p, x, y, s, r = 0, { seed = 1, c = '#d2e3a4' } = {}){ return K.leafPiece(p, x, y, s, r, { c, vein: '#f6f8e6', seed, cooked: true }); }
// 千切り生キャベツの葉（lalapan）
function xidRawCabbage(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidRc' + seed + x + y);
    const k = s / 40;
    const pts = ring(19, 13, .22, R, 1.15, .82);
    const gid = p.def('xidRcG', id => `<radialGradient id="${id}" cx=".22" cy=".7" r=".95"><stop offset="0" stop-color="#f4f6e2"/><stop offset=".45" stop-color="#e0ecb8"/><stop offset="1" stop-color="#b9d38a"/></radialGradient>`);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${xidSm(pts, true)}" fill="url(#${gid})" stroke="#9fbf6a" stroke-width=".5"/></g>
        <path d="M-20,9 Q-4,3 17,-6 Q-2,1 -19,5Z" fill="#f6f7ea" stroke="#d8e0bc" stroke-width=".5"/>
        <path d="M-9,4.5 Q-11,-2 -16,-5 M-2,2 Q-2,-6 -6,-12 M5,-1 Q7,-8 6,-14 M11,-3.5 Q14,-7 16,-10 M-5,4 Q-2,10 2,13 M4,1 Q8,6 13,7" stroke="#f0f5dc" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// 細長い赤唐辛子の斜め切り（cabai merah）
function xidChiliSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s * .7)}" ry="${f(s * .36)}" fill="#d42a1c" stroke="#8a140c" stroke-width=".5"/><ellipse rx="${f(s * .45)}" ry="${f(s * .2)}" fill="#f07a50"/><circle cx="${f(s * .15)}" cy="0" r="${f(s * .07)}" fill="#f6dfa0"/><circle cx="${f(-s * .18)}" cy="${f(s * .05)}" r="${f(s * .06)}" fill="#f6dfa0"/></g>`;
}

// =========================================================
// 2巡目で足した部品（xid）
// =========================================================
// 鶏の絵の鉢（mangkok ayam jago: バクソ・ミーアヤム屋の白い鉢）
function xidJago(p, { R = 92, line = '#2f6aa8' } = {}){
    const rooster = p.def('xidRooster', id => `<g id="${id}"><path d="M-1,-1 Q-8,-9 -11,-2 Q-9,4 -2,4" fill="none" stroke="#1f3a2a" stroke-width="1.8" stroke-linecap="round"/><path d="M0,0 Q-6,-7 -9,-1" fill="none" stroke="#2f8a3a" stroke-width="1.4" stroke-linecap="round"/>
        <ellipse cx="1" cy="1" rx="5.2" ry="3.8" fill="#e2582a"/><ellipse cx="0" cy="2" rx="3" ry="1.6" fill="#f2c94a"/><circle cx="6" cy="-2.6" r="2.3" fill="#e2582a"/><path d="M5,-5 l1,-1.6 l1,1.2 l1,-1.2 l.6,1.8Z" fill="#d42a1c"/><path d="M8.2,-2.4 l2,.6 l-2,.6Z" fill="#f2b02a"/>
        <path d="M0,4.6 l-.6,3 M3,4.6 l.6,3" stroke="#c98a2a" stroke-width=".9"/></g>`);
    const leaf = p.def('xidJgLeaf', id => `<g id="${id}"><path d="M0,6 Q-1,-2 -6,-7 M0,6 Q1,-3 6,-8 M0,6 Q0,-4 0,-9" stroke="#2f8a3a" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="-3" cy="4" r="1.5" fill="#d9485a"/><circle cx="3" cy="4" r="1.5" fill="#d9485a"/></g>`);
    let m = '';
    for (const [a, k] of [[2.35, 'r'], [.6, 'l'], [3.9, 'l'], [5.5, 'r']]){
        const x = 100 + Math.cos(a) * R * .935, y = 100 + Math.sin(a) * R * .935;
        m += `<use href="#${k === 'r' ? rooster : leaf}" ${T(x, y, a * 57.3 + 90, k === 'r' ? .8 : .7)}/>`;
    }
    return K.bowl(p, { glaze: '#f7f4ec', inside: '#fbf9f3', R }) + `<circle cx="100" cy="100" r="${f(R * .985)}" fill="none" stroke="${line}" stroke-width="1.4" opacity=".8"/><circle cx="100" cy="100" r="${f(R * .875)}" fill="none" stroke="${line}" stroke-width="1" opacity=".7"/>` + m;
}
// 白いほうろうの皿・鉢（縁が紺）
function xidEnamel(p, { R = 94, rim = '#24508a', base = '#f8f6f0', deep = false } = {}){
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .1, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 1.6}" fill="none" stroke="${rim}" stroke-width="3.4"/>
        <circle cx="100" cy="100" r="${f(R * (deep ? .84 : .76))}" fill="${p.rg(base, .06, deep ? .24 : .1, .62, .64)}"/>
        <circle cx="100" cy="100" r="${f(R * (deep ? .84 : .76) + 1.5)}" fill="none" stroke="${dk(base, .1)}" stroke-width="1.6" opacity=".5"/>
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 素焼きの土鍋・土の皿（tanah liat / gerabah）
function xidClay(p, { R = 92, c = '#a8562e', inside = '#7a3a1e', lip = .84, handles = false } = {}){
    const h = handles ? [-1, 1].map(s => `<g ${p.sh(1)}><ellipse cx="${100 + s * (R + 2)}" cy="100" rx="9" ry="14" fill="${p.g(c, .2, .3)}" stroke="${dk(c, .3)}" stroke-width=".8"/></g>`).join('') : '';
    return `${h}<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .22, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${lt(c, .25)}" stroke-width="1.2" opacity=".6"/>
        <circle cx="100" cy="100" r="${f(R * lip)}" fill="${p.rg(inside, .12, .3, .62, .64)}"/>
        <circle cx="100" cy="100" r="${f(R * lip)}" fill="none" stroke="${dk(c, .35)}" stroke-width="1.4" opacity=".7"/>
        <path d="M${100 - R * .72},${100 - R * .42} A${R * .84},${R * .84} 0 0 1 ${100 - R * .25},${100 - R * .8}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".35"/>`;
}
// アルミの鍋（kastrol / panci: ナシ・リウットを鍋ごと出す）
function xidKastrol(p, { R = 86 } = {}){
    const al = p.def('xidAlu', id => `<radialGradient id="${id}" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#eef0f0"/><stop offset=".55" stop-color="#bcc2c6"/><stop offset="1" stop-color="#7e868c"/></radialGradient>`);
    return [-1, 1].map(s => `<g ${p.sh(1)}><rect x="${s < 0 ? 100 - R - 12 : 100 + R - 4}" y="92" width="16" height="16" rx="5" fill="#2a2624"/></g>`).join('')
        + `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R + 4}" fill="url(#${al})"/></g>
        <circle cx="100" cy="100" r="${R + 1}" fill="none" stroke="#f4f6f6" stroke-width="2" opacity=".8"/>
        <circle cx="100" cy="100" r="${R - 3}" fill="${p.rg('#9aa2a8', .15, .25, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .45} A${R * .86},${R * .86} 0 0 1 ${100 - R * .25},${100 - R * .82}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// 竹で編んだ皿（piring anyaman）
function xidRattan(p, { R = 94 } = {}){
    let w = '';
    for (let i = 0; i < 4; i++){ const rr = R - 3 - i * 4.5; w += `<circle cx="100" cy="100" r="${rr}" fill="none" stroke="${i % 2 ? '#a8783a' : '#d8ac62'}" stroke-width="3.6" stroke-dasharray="5 2.4" stroke-dashoffset="${i * 3}"/>`; }
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#c8964e', .2, .3, .38, .32)}"/></g>${w}
        <circle cx="100" cy="100" r="${R - 20}" fill="${p.rg('#b88a4a', .1, .25, .6, .62)}"/>`;
}
// 汁の面（器の内側いっぱい）。cream でココナッツミルクのにごり
function xidBroth(p, c, { R = 78, op = .95, cream = 0, glow = .3, cx = 100, cy = 100 } = {}){
    return K.liquid(p, { R, c, op, shine: false, cx, cy })
        + `<circle cx="${cx}" cy="${cy}" r="${f(R * .78)}" fill="${lt(c, .25)}" opacity="${glow}"/>`
        + (cream ? `<circle cx="${cx - R * .12}" cy="${cy - R * .12}" r="${f(R * .7)}" fill="${p.rg(lt(c, .5), .2, 0, .4, .4)}" opacity="${cream}"/>` : '');
}
// 色をかえられる唐辛子の輪切り
function xidChiliC(p, x, y, s, r = 0, c = '#d42a1c'){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s * .6)}" ry="${f(s * .42)}" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".5"/><ellipse rx="${f(s * .38)}" ry="${f(s * .24)}" fill="${lt(c, .4)}"/><circle cx="${f(s * .12)}" cy="0" r="${f(s * .08)}" fill="#f6eaa0"/><circle cx="${f(-s * .14)}" cy="${f(s * .05)}" r="${f(s * .07)}" fill="#f6eaa0"/></g>`;
}
// 丸ごとの唐辛子（cabai rawit / 青唐辛子）。L は長さ
function xidRawit(p, x, y, L, r = 0, { c = '#d42a1c' } = {}){
    return `<g ${T(x, y, r, L / 24)}><g ${p.sh(.5)}><path d="M-9,-2.8 C-2,-3.4 6,-2.4 12,0 C6,2.4 -2,3.4 -9,2.8 Q-10.5,0 -9,-2.8Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M-9,-2.8 Q-12,0 -9,2.8 Q-7.5,0 -9,-2.8Z" fill="#4f8a2e"/><path d="M-10.5,0 L-14,-.6" stroke="#5a8a34" stroke-width="1.3" stroke-linecap="round"/>
        ${xidShine('M-6,-1.6 Q2,-2.6 8,-1', 1, .7)}</g>`;
}
// 輪切りの魚（筒切りの断面: 灰色の皮の縁、腹の切れ込み、中骨、身の筋）
function xidFishSteak(p, x, y, s, r = 0, { flesh = '#f1e4c8', skin = '#6e7178', tint = null } = {}){
    const fl = tint ? mix(flesh, tint, .45) : flesh;
    const d = 'M0,-13 C9,-13 14,-6 14,2 C14,9 9,13 4.5,13 L2.4,6.5 Q0,4.6 -2.4,6.5 L-4.5,13 C-9,13 -14,9 -14,2 C-14,-6 -9,-13 0,-13Z';
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.8)}><path d="${d}" fill="${p.g(fl, .3, .22)}" stroke="${skin}" stroke-width="1.7" stroke-linejoin="round"/></g>
        <path d="M-9,-3 Q-7,-9.5 0,-9.6 Q7,-9.5 9,-3 M-10.5,4 Q-9,9.5 -5.5,10.5 M10.5,4 Q9,9.5 5.5,10.5 M-5,-1 Q-4,-5 0,-5.4 Q4,-5 5,-1" stroke="${dk(fl, .2)}" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M0,-12 L0,4" stroke="${dk(fl, .12)}" stroke-width=".7" opacity=".6"/>
        <circle cx="0" cy="0" r="2.3" fill="${lt(fl, .45)}" stroke="${dk(fl, .3)}" stroke-width=".6"/>
        ${xidShine('M-9,-6 Q-6,-11 0,-11.4', 1.5, .75)}</g>`;
}
// なすの乱切り（片側に紫の皮）
function xidTerong(p, x, y, s, r = 0, { flesh = '#c8b07a', skin = '#4d2a5c', seed = 1 } = {}){
    const R = rng(p.id + 'xidTr' + seed + x + y);
    const k = s / 24;
    const top = [[-11, 2], [-9, -4], [-3, -6.5], [4, -6], [10, -3], [12, 2]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${xidSm([...top, [9, 6.5], [0, 8], [-9, 6]], true)}" fill="${p.g(skin, .3, .25)}" stroke="#2b1433" stroke-width=".6"/></g>
        <path d="${xidSm([...top, [8, 3.6], [0, 4.8], [-8, 3.4]], true)}" fill="${p.g(flesh, .25, .25)}"/>
        ${[[-5, -1], [0, -2.4], [5, -1.4], [-2, 1.6], [3, 1.8]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="1" ry=".6" fill="${dk(flesh, .3)}" opacity=".6"/>`).join('')}
        ${xidShine('M-7,-3 Q-2,-5.6 4,-4.8', 1.1, .55)}${xidShine('M-6,6.4 Q0,7.6 6,6.2', 1, .5)}</g>`;
}
// パイナップルのかけら
function xidPineapple(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.6)}><path d="M-9,6 L-6,-7 Q0,-9 6,-7 L9,6 Q0,9 -9,6Z" fill="${p.g('#f4c83a', .35, .2)}" stroke="#c8961a" stroke-width=".6" stroke-linejoin="round"/></g>
        <path d="M-5,4 L-3,-5 M0,5 L0,-6 M5,4 L3,-5" stroke="#fbe58a" stroke-width="1" opacity=".9"/><path d="M-6,-6.4 Q0,-8.6 6,-6.4" stroke="#e8a82a" stroke-width="1.6" fill="none"/>${xidShine('M-5,-3 Q-2,-6 2,-5.6', 1, .6)}</g>`;
}
// 牛テールの輪切り（中心に骨と髄）
function xidOxtail(p, x, y, s, r = 0, { c = '#8a4a26', seed = 1 } = {}){
    const R = rng(p.id + 'xidOx' + seed + x + y);
    const pts = ring(s / 2, 9, .22, R, 1.08, .95);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xidSm(pts, true)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="${xidSm(pts.map(([a, b]) => [a * .8, b * .8]), true)}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.6" opacity=".5"/>
        <path d="M${f(-s * .38)},0 L${f(-s * .2)},0 M${f(s * .2)},${f(-s * .05)} L${f(s * .38)},${f(-s * .1)} M0,${f(-s * .36)} L0,${f(-s * .2)} M${f(s * .05)},${f(s * .2)} L${f(s * .1)},${f(s * .38)}" stroke="${dk(c, .35)}" stroke-width=".8" opacity=".5"/>
        <circle r="${f(s * .17)}" fill="${p.rg('#efe2c6', .2, .2)}" stroke="#b8a07a" stroke-width=".7"/><circle r="${f(s * .08)}" fill="#b8784a"/>
        ${xidShine(`M${f(-s * .34)},${f(-s * .16)} Q${f(-s * .18)},${f(-s * .38)} ${f(s * .08)},${f(-s * .36)}`, 1.8, .7)}</g>`;
}
// 肉団子（バクソ: 灰色がかった茶、つるっとして少し凸凹）
function xidBakso(p, x, y, s, { c = '#9a7a62' } = {}){
    return `<g ${p.sh(.9)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg(c, .3, .3, .36, .32)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <circle cx="${f(x + s * .12)}" cy="${f(y + s * .1)}" r="${f(s * .08)}" fill="${dk(c, .2)}" opacity=".35"/><circle cx="${f(x - s * .1)}" cy="${f(y + s * .2)}" r="${f(s * .05)}" fill="${dk(c, .2)}" opacity=".35"/>
        <ellipse cx="${f(x - s * .17)}" cy="${f(y - s * .2)}" rx="${f(s * .16)}" ry="${f(s * .08)}" fill="#fff" opacity=".65" transform="rotate(-30 ${f(x - s * .17)} ${f(y - s * .2)})"/>`;
}
// ゆで卵（丸ごと、殻をむいた）。c で煮汁色
function xidEgg(p, x, y, s, r = 0, { c = '#f8f2e2' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${s / 2}" ry="${f(s * .38)}" fill="${p.rg(c, .3, .25, .36, .32)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g><ellipse cx="${f(-s * .16)}" cy="${f(-s * .14)}" rx="${f(s * .14)}" ry="${f(s * .07)}" fill="#fff" opacity=".8"/></g>`;
}
// 若いジャックフルーツの塊（繊維と種の跡）
function xidNangka(p, x, y, s, r = 0, { c = '#ead08a', seed = 1 } = {}){
    const R = rng(p.id + 'xidNk' + seed + x + y);
    const pts = ring(s / 2, 7, .3, R, 1.15, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .55)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .35)},${f(-s * .1)} L${f(s * .3)},${f(-s * .2)} M${f(-s * .35)},${f(s * .08)} L${f(s * .35)},0 M${f(-s * .3)},${f(s * .24)} L${f(s * .3)},${f(s * .2)}" stroke="${dk(c, .2)}" stroke-width=".8" opacity=".55"/>
        <ellipse cx="${f(s * .1)}" cy="${f(s * .05)}" rx="${f(s * .1)}" ry="${f(s * .07)}" fill="${lt(c, .3)}" stroke="${dk(c, .2)}" stroke-width=".5"/>
        ${xidShine(`M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .38)} ${f(s * .15)},${f(-s * .32)}`, 1.3, .6)}</g>`;
}
// 金針菜（つぼみを結んだ細い金色の帯）
function xidLily(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><path d="M${-L / 2},1 Q0,-3 ${L / 2},1" stroke="#9a6418" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M${-L / 2},1 Q0,-3 ${L / 2},1" stroke="#dca040" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="0" cy="0" r="2.4" fill="#c8862a" stroke="#8a5414" stroke-width=".5"/></g>`;
}
// きくらげ
function xidWoodEar(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidWe' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 9, .45, R, 1.2, .8))}" fill="${p.g('#4a3428', .25, .3)}" stroke="#241812" stroke-width=".6"/><path d="M${f(-s * .3)},${f(s * .05)} Q0,${f(-s * .15)} ${f(s * .3)},${f(s * .05)}" stroke="#7a5a48" stroke-width="1" fill="none" opacity=".7"/></g>`;
}
// ひらたけ（jamur tiram）を手で裂いたもの: 細長く波打つ切れ端、縦のひだ、しんなりと照る
function xidOyster(p, x, y, s, r = 0, { c = '#cdb898', seed = 1 } = {}){
    const R = rng(p.id + 'xidOy' + seed + x + y);
    const pts = ring(s / 2, 11, .42, R, 1, .55).map(([a, b], i) => [a, b + Math.sin(i * 2.1) * s * .04]);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xidSm(pts, true)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .32)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .4)},${f1(-s * .05)} Q0,${f1(-s * .12)} ${f1(s * .42)},${f1(-s * .03)} M${f1(-s * .38)},${f1(s * .05)} Q0,${f1(s * .01)} ${f1(s * .4)},${f1(s * .06)} M${f1(-s * .3)},${f1(s * .12)} Q0,${f1(s * .1)} ${f1(s * .3)},${f1(s * .12)}" stroke="${dk(c, .2)}" stroke-width=".7" fill="none" opacity=".7"/>
        ${xidShine(`M${f1(-s * .3)},${f1(-s * .1)} Q${f1(-s * .05)},${f1(-s * .17)} ${f1(s * .2)},${f1(-s * .12)}`, 1.2, .65)}</g>`;
}
// ゴーヤの薄い輪切り（でこぼこの皮、わたを抜いて中は空洞）
function xidPare(p, x, y, s, r = 0, { c = '#5aa23a', seed = 1 } = {}){
    const R = rng(p.id + 'xidPr' + seed + x + y);
    const outer = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.283, rr = s / 2 * (.88 + R() * .14); return [Math.cos(a) * rr, Math.sin(a) * rr * .9]; });
    const ir = s * .3;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path fill-rule="evenodd" d="M${outer.map(([a, b]) => `${f1(a)},${f1(b)}`).join('L')}Z M${f1(ir)},0 A${f1(ir)},${f1(ir * .85)} 0 1 0 ${f1(-ir)},0 A${f1(ir)},${f1(ir * .85)} 0 1 0 ${f1(ir)},0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".9" stroke-linejoin="round"/></g>
        <ellipse rx="${f1(ir + 1.4)}" ry="${f1(ir * .85 + 1.4)}" fill="none" stroke="#e2eec0" stroke-width="2.2"/>
        <path d="M${f1(-s * .36)},${f1(-s * .1)} Q${f1(-s * .2)},${f1(-s * .36)} ${f1(s * .05)},${f1(-s * .38)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// ヘチマ（oyong）の輪切り: 稜のある波打つ縁（皮を筋状にむいた淡い緑）、白いスポンジ状の果肉
function xidLuffa(p, x, y, s, r = 0){
    const pts = Array.from({ length: 20 }, (_, i) => { const a = i / 20 * 6.283, rr = s / 2 * (i % 2 ? .88 : 1); return [Math.cos(a) * rr, Math.sin(a) * rr * .92]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xidSm(pts, true)}" fill="#a6c878" stroke="#5e8a34" stroke-width=".7"/></g>
        <ellipse rx="${f(s * .38)}" ry="${f(s * .35)}" fill="${p.rg('#f4f2dc', .3, .08)}"/>
        <circle cx="${f(-s * .08)}" cy="${f(s * .06)}" r="${f(s * .05)}" fill="#e2e0b8"/><circle cx="${f(s * .1)}" cy="${f(-s * .04)}" r="${f(s * .04)}" fill="#e2e0b8"/><circle cx="${f(s * .02)}" cy="${f(s * .16)}" r="${f(s * .04)}" fill="#e2e0b8"/>
        <path d="M${f(-s * .22)},${f(-s * .14)} Q${f(-s * .05)},${f(-s * .28)} ${f(s * .14)},${f(-s * .22)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// エンピン（melinjo のせんべい: 薄い黄色の円盤）
function xidEmping(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidEm' + seed + x + y);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(ring(s / 2, 12, .18, R, 1.1, .92))}" fill="${p.rg('#ecd690', .25, .2)}" stroke="#b8983a" stroke-width=".6"/></g>
        ${Array.from({ length: 6 }, () => `<circle cx="${f((R() - .5) * s * .6)}" cy="${f((R() - .5) * s * .5)}" r="${f(.8 + R())}" fill="#c8a04a" opacity=".55"/>`).join('')}
        <path d="M${f(-s * .3)},${f(-s * .1)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .15)},${f(-s * .28)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".55" stroke-linecap="round"/></g>`;
}
// 輪切りのソーセージ
function xidSausageRound(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .44)}" fill="#a8482a" stroke="#6e2a14" stroke-width=".6"/></g><ellipse rx="${f(s * .42)}" ry="${f(s * .36)}" fill="${p.rg('#e8a08a', .25, .2)}"/>${[[-.15, -.1], [.12, .05], [-.05, .15], [.15, -.15]].map(([a, b]) => `<circle cx="${f(a * s)}" cy="${f(b * s)}" r=".7" fill="#f6dcd0"/>`).join('')}</g>`;
}
// 赤いんげん豆（キドニー）
function xidKidney(p, x, y, s, r = 0, { c = '#8a2a22' } = {}){
    return `<g ${T(x, y, r, s / 14)}><path d="M-7,1 C-7,-4 -2,-5 1,-3.6 C3,-4.6 7,-4 7,0 C7,4 2,5 0,4.4 C-3,5 -7,4 -7,1Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/><ellipse cx="-3" cy="-1.8" rx="2" ry=".9" fill="#fff" opacity=".55"/></g>`;
}
// 汁から少しのぞく具の上に、汁の色をかける
const xidSubmerge = (c, d, op = .35) => `<path d="${d}" fill="${c}" opacity="${op}"/>`;

// =========================================================
const XD = {};
export default XD;

// ---------- 汁物（sup / soto / sayur berkuah） ----------
Object.assign(XD, {
    // ソト・アヤム: 黄色い澄んだスープに、春雨、ほぐした鶏、もやし、キャベツ、ゆで卵、セロリ、揚げエシャロット、ライム
    id_sotoayam: p => [
        xidBowl(p, { line: '#2f8a5a', c: '#d9485a' }),
        xidBroth(p, '#e6ae2c', { glow: .35 }),
        xidOil(p, 100, 100, 140, { n: 8, c: '#f2c040', op: .6, rmax: 2.4, seed: 1 }),
        K.threads(p, 76, 100, 84, { c: '#f3ecd8', n: 14, w: 1.6, seed: 1 }),
        K.threads(p, 80, 104, 70, { c: '#dccfa8', n: 7, w: 1, seed: 2 }),
        `<g ${p.sh(.7)}>`,
        xidShreds(p, 66, 130, 50, { c: '#dcebb4', n: 26, w: 2.2, len: .4, seed: 3 }),
        xidShreds(p, 112, 92, 76, { c: '#e6caa0', n: 34, w: 3.6, len: .3, seed: 1, curve: .5 }),
        xidShreds(p, 108, 96, 56, { c: '#f2e0b8', n: 22, w: 3.2, len: .3, seed: 2, curve: .5 }),
        `</g>`,
        xidSprouts(p, 118, 134, 62, { n: 26, seed: 1 }),
        K.eggHalf(p, 70, 74, 38, -20), K.eggHalf(p, 146, 92, 34, 30),
        xidCeleryLeaf(p, 104, 76, 20, 20), xidCeleryLeaf(p, 92, 118, 18, -40), xidCeleryLeaf(p, 128, 108, 17, 80), xidCeleryLeaf(p, 60, 106, 16, 120),
        K.scallions(p, 104, 104, 100, { n: 14, c: '#4f9a34' }),
        xidFriedShallot(p, 104, 100, 104, 40, 2),
        xidLime(p, 92, 150, 26, 10),
        xidSoupShine(100, 100, 78, .35),
    ].join(''),

    // サユール・ロデ: ココナッツミルクのクリーム色の汁に、若いジャックフルーツ、ハヤトウリ、なす、ささげ、テンペ、青唐辛子
    id_sayurlodeh: p => [
        K.bowl(p, { glaze: '#3f7a5a', inside: '#f6f1e6' }),
        xidBroth(p, '#ead49a', { cream: .5, glow: .3 }),
        xidOil(p, 100, 100, 140, { n: 14, c: '#f0a83a', op: .55, rmax: 2.4, seed: 2 }),
        `<g ${p.sh(.7)}>`,
        xidNangka(p, 72, 78, 36, -20, { seed: 1 }), xidNangka(p, 132, 128, 34, 30, { seed: 2 }), xidNangka(p, 116, 70, 30, 70, { seed: 3 }), xidNangka(p, 64, 134, 30, 10, { seed: 4 }),
        xidChayote(p, 136, 94, 34, -30), xidChayote(p, 86, 140, 32, 50), xidChayote(p, 56, 104, 28, 100),
        xidTerong(p, 100, 102, 34, 30, { seed: 1 }), xidTerong(p, 92, 68, 28, -20, { seed: 2 }), xidTerong(p, 150, 120, 26, 100, { seed: 3 }), xidTerong(p, 112, 148, 26, -10, { seed: 4 }),
        xidTempeh(p, 114, 118, 24, 18, 20, { seed: 1 }), xidTempeh(p, 78, 108, 22, 16, -30, { seed: 2 }), xidTempeh(p, 140, 66, 20, 16, 50, { seed: 3 }),
        ...[[86, 90, 30], [58, 84, -50], [124, 102, 70], [76, 152, 10], [146, 144, -30], [100, 52, 100], [44, 118, 60], [156, 96, 80]].map(([x, y, r]) => xidLongBean(p, x, y, 24, r, { c: '#5a9a34' })),
        `</g>`,
        ...[[86, 120, 20], [122, 136, -20], [118, 88, 60], [70, 64, 0], [98, 124, 50]].map(([x, y, r]) => xidChiliC(p, x, y, 8, r, '#4f9a2e')),
        xidChiliC(p, 142, 52, 8, 30, '#d42a1c'), xidChiliC(p, 52, 92, 7, 30, '#d42a1c'),
        idSoupShineX(),
    ].join(''),

    // ソップ・ブントゥット: 澄んだ茶色のスープに、牛テールの輪切り、にんじん、じゃがいも、トマト、セロリとねぎ、揚げエシャロット
    id_sopbuntut: p => [
        xidEnamel(p, { rim: '#24508a', deep: true }),
        xidBroth(p, '#c88a48', { R: 79, op: .9, glow: .3 }),
        xidOil(p, 100, 100, 140, { n: 14, c: '#e8b250', op: .55, rmax: 2.2, seed: 3 }),
        `<g ${p.sh(.7)}>`,
        xidOxtail(p, 78, 80, 50, 10, { seed: 1 }), xidOxtail(p, 128, 84, 46, -30, { seed: 2, c: '#7e4220' }), xidOxtail(p, 98, 126, 50, 40, { seed: 3, c: '#8e4e28' }),
        K.carrotRound(p, 144, 122, 20, { r: 10 }), K.carrotRound(p, 58, 114, 20, { r: 0 }), K.carrotRound(p, 126, 150, 18, { r: 0 }), K.carrotRound(p, 104, 52, 18, { r: 0 }), K.carrotRound(p, 66, 146, 17, { r: 0 }),
        xidPotatoChunk(p, 148, 98, 26, 30, { seed: 1, c: '#e4c890' }), xidPotatoChunk(p, 82, 152, 24, -20, { seed: 2, c: '#e4c890' }), xidPotatoChunk(p, 64, 56, 24, 60, { seed: 3, c: '#e4c890' }), xidPotatoChunk(p, 50, 92, 22, 20, { seed: 4, c: '#e4c890' }),
        xidTomato(p, 136, 60, 26, -30, { seed: 1 }), xidTomato(p, 136, 136, 22, 60, { seed: 2 }),
        `</g>`,
        xidCeleryLeaf(p, 104, 98, 20, 20), xidCeleryLeaf(p, 76, 108, 18, -60), xidCeleryLeaf(p, 124, 108, 17, 40), xidCeleryLeaf(p, 98, 74, 16, 100),
        K.scallions(p, 100, 100, 110, { n: 16, c: '#4f9a34' }),
        xidFriedShallot(p, 100, 100, 110, 36, 3),
        idSoupShineX(),
    ].join(''),

    // ラウォン: クルアック（黒い実）で真っ黒なスープ、牛肉の角切り、短いもやし、塩卵、ねぎ、揚げエシャロット
    id_rawon: p => [
        xidBowl(p, { line: '#8a5a2a', c: '#d9485a' }),
        xidBroth(p, '#2a1c14', { op: 1, glow: .25 }),
        `<circle cx="100" cy="100" r="66" fill="#4a3020" opacity=".35"/>`,
        xidOil(p, 100, 100, 140, { n: 16, c: '#8a5a2a', op: .55, rmax: 2.4, seed: 4 }),
        `<g ${p.sh(.7)}>`,
        xidBeefChunk(p, 70, 82, 34, -10, { seed: 1, c: '#5a3018' }), xidBeefChunk(p, 106, 70, 32, 30, { seed: 2, c: '#4e2a16' }), xidBeefChunk(p, 64, 120, 32, 50, { seed: 3, c: '#5a3018' }),
        xidBeefChunk(p, 100, 104, 34, -40, { seed: 4, c: '#54301a' }), xidBeefChunk(p, 128, 108, 30, 10, { seed: 5, c: '#4e2a16' }), xidBeefChunk(p, 92, 140, 30, 80, { seed: 6, c: '#5a3018' }), xidBeefChunk(p, 50, 100, 24, 20, { seed: 7, c: '#4e2a16' }),
        `</g>`,
        `<circle cx="96" cy="104" r="52" fill="#2a1c14" opacity=".22"/>`,
        xidSprouts(p, 134, 76, 58, { n: 30, seed: 2 }),
        K.eggHalf(p, 136, 138, 40, -20, { yolk: '#e8742a' }),
        K.scallions(p, 96, 100, 104, { n: 22, c: '#5fae3a' }),
        xidFriedShallot(p, 96, 100, 104, 34, 4),
        idSoupShineX(.3),
    ].join(''),

    // ソト・ブタウィ: ココナッツミルクと牛乳の黄色いにごったスープ、牛肉、揚げたじゃがいも、トマト、ねぎ、エンピン
    id_sotobetawi: p => [
        xidBowl(p, { line: '#d9485a', c: '#2f8a5a' }),
        xidBroth(p, '#e8c27a', { cream: .45, glow: .3 }),
        xidOil(p, 100, 100, 140, { n: 18, c: '#e8862a', op: .6, rmax: 2.6, seed: 5 }),
        `<g ${p.sh(.7)}>`,
        xidBeefChunk(p, 78, 84, 34, -10, { seed: 1, c: '#8a5232' }), xidBeefChunk(p, 112, 86, 32, 40, { seed: 2, c: '#7e4a2c' }), xidBeefChunk(p, 98, 116, 34, -30, { seed: 3, c: '#8a5232' }), xidBeefChunk(p, 62, 116, 30, 60, { seed: 4, c: '#84502e' }),
        xidPotatoChunk(p, 134, 112, 30, 20, { seed: 1, c: '#e4a84a' }), xidPotatoChunk(p, 80, 146, 28, -40, { seed: 2, c: '#e0a444' }), xidPotatoChunk(p, 92, 58, 26, 60, { seed: 3, c: '#e4a84a' }), xidPotatoChunk(p, 52, 86, 24, 10, { seed: 4, c: '#e0a444' }),
        xidTomato(p, 118, 142, 28, -20, { seed: 1 }), xidTomato(p, 136, 86, 24, 70, { seed: 2 }),
        `</g>`,
        xidEmping(p, 148, 64, 36, 0, { seed: 1 }), xidEmping(p, 122, 54, 32, 40, { seed: 2 }), xidEmping(p, 154, 92, 28, 70, { seed: 3 }),
        K.scallions(p, 98, 104, 104, { n: 18, c: '#4f9a34' }),
        xidFriedShallot(p, 98, 104, 104, 34, 5),
        idSoupShineX(),
    ].join(''),

    // ソップ・カンビン: 香辛料で少しにごった茶色のスープ、骨つきのやぎ肉、トマト、にんじん、セロリ、揚げエシャロット、ライム
    id_sopkambing: p => [
        K.bowl(p, { glaze: '#7a4a2a', inside: '#f3ece0' }),
        xidBroth(p, '#b8844a', { cream: .2, glow: .3 }),
        xidOil(p, 100, 100, 140, { n: 16, c: '#e0a24a', op: .55, rmax: 2.4, seed: 6 }),
        `<g ${p.sh(.7)}>`,
        xidChickenBit(p, 76, 80, 44, -20, { seed: 1, c: '#7a4a2a', bone: true }), xidChickenBit(p, 124, 82, 42, 30, { seed: 2, c: '#704426', bone: true }),
        xidChickenBit(p, 102, 122, 44, 160, { seed: 3, c: '#7a4a2a', bone: true }), xidChickenBit(p, 60, 122, 36, 100, { seed: 4, c: '#744628' }),
        xidTomato(p, 144, 116, 28, -20, { seed: 1 }), xidTomato(p, 98, 56, 24, 30, { seed: 2 }), xidTomato(p, 126, 150, 24, 60, { seed: 3 }),
        K.carrotRound(p, 54, 94, 18, { r: 0 }), K.carrotRound(p, 148, 86, 17, { r: 0 }), K.carrotRound(p, 82, 152, 17, { r: 0 }), K.carrotRound(p, 100, 92, 16, { r: 0 }),
        `</g>`,
        xidCeleryLeaf(p, 100, 100, 20, 20), xidCeleryLeaf(p, 84, 110, 17, -40), xidCeleryLeaf(p, 122, 108, 17, 70), xidCeleryLeaf(p, 80, 60, 15, 100),
        K.scallions(p, 100, 100, 104, { n: 14, c: '#4f9a34' }),
        xidFriedShallot(p, 100, 100, 108, 38, 6),
        xidLime(p, 58, 64, 24, -30),
        idSoupShineX(),
    ].join(''),

    // パレンバンのピンダン・イカン: 澄んだ橙色の甘酸っぱいスープ、魚の筒切り、パイナップル、トマト、丸ごとの唐辛子、レモンバジル
    id_pindangikan: p => [
        xidClay(p, { c: '#b45e32', inside: '#8a4422' }),
        xidBroth(p, '#e09a34', { R: 76, op: .92, glow: .35 }),
        xidOil(p, 100, 100, 136, { n: 12, c: '#f2b23a', op: .55, rmax: 2, seed: 7 }),
        `<g ${p.sh(.7)}>`,
        xidFishSteak(p, 76, 86, 58, -20, { tint: '#e8b24a', skin: '#6a6e78' }), xidFishSteak(p, 124, 114, 58, 160, { tint: '#e8b24a', skin: '#5e6470' }),
        xidPineapple(p, 124, 70, 28, 20), xidPineapple(p, 70, 134, 28, -30), xidPineapple(p, 150, 90, 24, 70), xidPineapple(p, 100, 150, 24, 0), xidPineapple(p, 52, 104, 22, 40),
        xidTomato(p, 100, 104, 26, 30, { seed: 1, c: '#e8402a' }), xidTomato(p, 98, 60, 24, -60, { seed: 2, c: '#e8402a' }), xidTomato(p, 144, 134, 24, 40, { seed: 3, c: '#e8402a' }),
        xidRawit(p, 112, 86, 28, 30), xidRawit(p, 86, 116, 26, -40), xidRawit(p, 124, 146, 24, 160, { c: '#4f9a2e' }), xidRawit(p, 64, 64, 24, 100, { c: '#4f9a2e' }), xidRawit(p, 150, 112, 22, 70),
        `</g>`,
        ...[[96, 84, 20], [116, 130, -40], [60, 76, 60], [82, 150, 10], [140, 72, 80]].map(([x, y, r]) => xidLeaf(p, x, y, 16, r, { c: '#3f8a2c', narrow: .7 })),
        idSoupShineX(),
    ].join(''),

    // イカン・クア・クニン: ウコンで真っ黄色の澄んだスープ、魚の切り身、トマト、唐辛子、レモンバジル、ライム
    id_ikankuahkuning: p => [
        xidBowl(p, { line: '#2f6aa8', c: '#d9485a' }),
        xidBroth(p, '#f0bc1c', { op: .95, glow: .35 }),
        xidOil(p, 100, 100, 140, { n: 14, c: '#f8d040', op: .6, rmax: 2.2, seed: 8 }),
        `<g ${p.sh(.7)}>`,
        xidFishSteak(p, 78, 86, 58, 10, { tint: '#f0c030', flesh: '#ead8bc', skin: '#4e5664' }), xidFishSteak(p, 122, 118, 58, 200, { tint: '#f0c030', flesh: '#ead8bc', skin: '#4e5664' }),
        xidTomato(p, 132, 74, 28, -30, { seed: 1 }), xidTomato(p, 70, 132, 28, 40, { seed: 2 }), xidTomato(p, 106, 54, 22, 0, { seed: 3 }), xidTomato(p, 150, 100, 22, 80, { seed: 4 }),
        xidRawit(p, 104, 98, 28, 30), xidRawit(p, 92, 148, 24, 100), xidRawit(p, 52, 100, 24, -80, { c: '#4f9a2e' }), xidRawit(p, 140, 142, 22, -30),
        `</g>`,
        ...[[100, 72, 20], [92, 124, -40], [146, 124, 60], [60, 72, 100], [118, 94, -10], [70, 108, 30]].map(([x, y, r]) => xidLeaf(p, x, y, 17, r, { c: '#3f8a2c', narrow: .7 })),
        xidLimeLeaf(p, 84, 58, 24, -30), xidLimeLeaf(p, 150, 74, 22, 60),
        xidLime(p, 62, 150, 26, 20),
        idSoupShineX(),
    ].join(''),

    // スップ・ジャグン: とろみのある卵入りコーンスープ、たっぷりのコーン粒、溶き卵、にんじん、鶏、ねぎ
    id_supjagung: p => [
        xidBowl(p, { line: '#d98a3a', c: '#2f8a5a' }),
        xidBroth(p, '#eecb62', { op: 1, cream: .35, glow: .35 }),
        ...[[78, 84, 66, 20], [124, 118, 64, -30], [122, 70, 48, 60], [72, 128, 50, 10]].map(([x, y, L, r], i) => xidEggCloud(p, x, y, L, r, { seed: i + 1, c: '#fae68a' })),
        `<g ${p.sh(.4)}>`,
        xidGrains(p, 100, 100, 138, { cols: ['#f6c832', '#fadc6a', '#e4a81a'], n: 110, size: 3.1, seed: 3 }),
        ...xidSpots('jagungc', 10, 62, 15).map(([x, y, r]) => xidDice(p, x, y, 6, r, '#ef7f30')),
        ...xidSpots('jagungm', 5, 58, 20).map(([x, y, r]) => xidDice(p, x, y, 6.5, r, '#f2e6cc')),
        `</g>`,
        K.scallions(p, 100, 100, 100, { n: 16, c: '#4f9a34' }),
        xidPepper(p, 100, 100, 100, 20),
        idSoupShineX(.45),
    ].join(''),

    // オポール・アヤム: 濃いココナッツミルクの淡黄色の煮汁、骨つきの鶏、ゆで卵、揚げエシャロット、サラムの葉
    id_oporayam: p => [
        K.bowl(p, { glaze: '#2f5f8a', inside: '#f6f2ea' }),
        xidBroth(p, '#ecd296', { op: 1, cream: .4, glow: .3 }),
        xidOil(p, 100, 100, 140, { n: 18, c: '#f0b440', op: .6, rmax: 2.6, seed: 9 }),
        `<g ${p.sh(.8)}>`,
        xidChickenBit(p, 76, 80, 52, -20, { seed: 1, c: '#c88e44', bone: true }), xidChickenBit(p, 128, 88, 50, 40, { seed: 2, c: '#c48a40' }),
        xidChickenBit(p, 94, 128, 52, 170, { seed: 3, c: '#c88e44', bone: true }),
        xidEgg(p, 140, 130, 34, -30, { c: '#f2dcaa' }),
        K.eggHalf(p, 60, 120, 32, 40, { stain: '#e8cf98' }),
        `</g>`,
        `<path d="M50,104 Q96,94 150,108 M64,74 Q100,64 140,72" stroke="#f0d696" stroke-width="7" fill="none" opacity=".45" stroke-linecap="round"/>`,
        xidLeaf(p, 106, 64, 26, -30, { c: '#5a6a2a', narrow: .55 }), xidLeaf(p, 52, 90, 22, 70, { c: '#5a6a2a', narrow: .55 }),
        xidFriedShallot(p, 100, 100, 114, 50, 7),
        idSoupShineX(),
    ].join(''),
});
// 鉢の汁のつや（中心100、半径78）
function idSoupShineX(op = .35){ return xidSoupShine(100, 100, 78, op); }

// つみれ（テクワン: 白い小さな不定形の魚団子）
function xidTekwan(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidTk' + seed + x + y);
    const pts = ring(s / 2, 8, .35, R, 1.2, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.rg('#f4eee0', .3, .2, .36, .32)}" stroke="#cfc4a8" stroke-width=".6"/></g><circle cx="${f(s * .1)}" cy="${f(s * .08)}" r=".7" fill="#a89a80" opacity=".6"/><ellipse cx="${f(-s * .14)}" cy="${f(-s * .12)}" rx="${f(s * .14)}" ry="${f(s * .06)}" fill="#fff" opacity=".8"/></g>`;
}
Object.assign(XD, {
    // バクソ: 鶏の絵の鉢に、澄んだ牛骨スープ、大きな肉団子、黄色い麺と春雨、サウィ、セロリ、揚げエシャロット
    id_baksokuah: p => [
        xidJago(p),
        xidBroth(p, '#d4b884', { R: 79, op: .85, glow: .3 }),
        xidOil(p, 100, 100, 140, { n: 10, c: '#e8c060', op: .55, rmax: 2.4, seed: 1 }),
        xidNoodles(p, 74, 118, 64, { c: '#e8c040', w: 2.4, n: 22, seed: 1 }),
        K.threads(p, 128, 132, 50, { c: '#f3ecd8', n: 10, w: 1.4, seed: 1 }),
        `<g ${p.sh(.6)}>`,
        xidSawi(p, 132, 70, 44, -30, { seed: 1 }), xidSawi(p, 150, 108, 40, 70, { seed: 2 }), xidSawi(p, 62, 74, 38, 200, { seed: 3 }),
        `</g>`,
        xidBakso(p, 100, 96, 38), xidBakso(p, 72, 90, 34), xidBakso(p, 124, 110, 36), xidBakso(p, 100, 132, 34), xidBakso(p, 106, 62, 32), xidBakso(p, 134, 142, 28),
        xidCeleryLeaf(p, 86, 112, 18, 20), xidCeleryLeaf(p, 118, 86, 17, -40), xidCeleryLeaf(p, 80, 140, 16, 60),
        K.scallions(p, 100, 104, 104, { n: 16, c: '#4f9a34' }),
        xidFriedShallot(p, 100, 104, 104, 34, 2),
        idSoupShineX(),
    ].join(''),

    // テクワン: 澄んだえびのスープに、白い小さな魚のつみれ、くずいもの細切り、きくらげ、春雨、えび、セロリ、揚げエシャロット
    id_tekwan: p => [
        xidBowl(p, { line: '#2f6aa8', c: '#d98a3a' }),
        xidBroth(p, '#e2cc94', { R: 78, op: .85, glow: .3 }),
        xidOil(p, 100, 100, 140, { n: 10, c: '#e8b85a', op: .5, rmax: 2, seed: 2 }),
        K.threads(p, 100, 104, 120, { c: '#f3ecd8', n: 14, w: 1.4, seed: 2 }),
        `<g ${p.sh(.6)}>`,
        xidShreds(p, 100, 100, 120, { c: '#f6f2e6', n: 26, w: 3.2, len: .2, seed: 3, curve: .1 }),
        ...[[70, 90, 30], [128, 76, -40], [140, 124, 60], [84, 136, 0]].map(([x, y, r], i) => xidWoodEar(p, x, y, 22, r, { seed: i + 1 })),
        K.shrimp(p, 118, 132, 30, -40), K.shrimp(p, 66, 112, 28, 60),
        `</g>`,
        ...xidSpots('tekwan', 13, 62, 19).map(([x, y, r], i) => xidTekwan(p, x, y, 17 + (i % 3) * 2, r, { seed: i + 1 })),
        xidCeleryLeaf(p, 100, 100, 18, 20), xidCeleryLeaf(p, 76, 70, 16, -40), xidCeleryLeaf(p, 132, 100, 16, 70),
        K.scallions(p, 100, 100, 104, { n: 14, c: '#4f9a34' }),
        xidFriedShallot(p, 100, 100, 104, 34, 3),
        idSoupShineX(),
    ].join(''),

    // スップ・マカロニ: 澄んだスープに、マカロニ、輪切りのソーセージ、にんじん、じゃがいもの角切り、セロリ
    id_supmakaroni: p => [
        xidEnamel(p, { rim: '#b8322a', deep: true }),
        xidBroth(p, '#e4c88a', { R: 79, op: .85, glow: .3 }),
        xidOil(p, 100, 100, 140, { n: 10, c: '#f0c860', op: .5, rmax: 2.2, seed: 3 }),
        `<g ${p.sh(.5)}>`,
        ...xidSpots('mak-p', 7, 60, 24).map(([x, y, r]) => xidDice(p, x, y, 16, r, '#f0d68e')),
        ...xidSpots('mak-c', 8, 64, 22).map(([x, y, r]) => K.carrotRound(p, x, y, 19, { r })),
        ...xidSpots('mak-s', 8, 60, 22).map(([x, y, r]) => xidSausageRound(p, x, y, 20, r)),
        ...xidSpots('mak-m', 24, 66, 14).map(([x, y, r]) => K.macaroni(p, x, y, 19, r, { c: '#f2d88e' })),
        `</g>`,
        xidCeleryLeaf(p, 100, 100, 18, 20), xidCeleryLeaf(p, 76, 70, 16, -40), xidCeleryLeaf(p, 132, 120, 16, 70), xidCeleryLeaf(p, 70, 130, 15, 120),
        xidFriedShallot(p, 100, 100, 104, 26, 3),
        xidPepper(p, 100, 100, 100, 16),
        idSoupShineX(),
    ].join(''),

    // サユール・ボボール: 薄いココナッツミルクの白っぽい汁に、ほうれん草（バヤム）とハヤトウリ
    id_sayurbobor: p => [
        K.bowl(p, { glaze: '#c89a3a', inside: '#f6f2e6' }),
        xidBroth(p, '#ece0b4', { op: 1, cream: .55, glow: .3 }),
        `<g ${p.sh(.5)}>`,
        xidChayote(p, 74, 84, 32, -30), xidChayote(p, 128, 122, 32, 40), xidChayote(p, 120, 70, 28, 80), xidChayote(p, 70, 128, 28, 10),
        ...xidSpots('bobor', 26, 64, 13).map(([x, y, r], i) => xidBayam(p, x, y, 20 + (i % 3) * 3, r, { seed: i + 1, c: i % 3 ? '#3a8a2c' : '#2f7a24' })),
        ...[[98, 86, 30], [86, 150, -20], [140, 96, 60], [56, 100, 100], [110, 120, -60]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-8" y="-1.5" width="16" height="3" rx="1.5" fill="${p.g('#96c060', .3, .2)}" stroke="#5a8a3a" stroke-width=".4"/></g>`),
        `</g>`,
        xidLeaf(p, 104, 104, 24, -30, { c: '#5a6a2a', narrow: .55 }),
        `<path d="M48,112 Q100,128 150,104" stroke="#f4ecd0" stroke-width="5" fill="none" opacity=".4" stroke-linecap="round"/>`,
        idSoupShineX(.4),
    ].join(''),

    // ブレネボン（マナドの赤いんげん豆のスープ）: 赤茶のとろりとしたスープに、赤いんげん豆たっぷり、牛すね肉、にんじん、じゃがいも
    id_brenebon: p => [
        K.bowl(p, { glaze: '#2f6a4a', inside: '#f3ece0' }),
        xidBroth(p, '#8a3a26', { op: 1, glow: .25 }),
        `<g ${p.sh(.7)}>`,
        xidBeefChunk(p, 76, 84, 30, -10, { seed: 1, c: '#6e3a1e' }), xidBeefChunk(p, 124, 116, 30, 40, { seed: 2, c: '#6a361c' }), xidBeefChunk(p, 118, 70, 26, 20, { seed: 3, c: '#6e3a1e' }),
        K.carrotRound(p, 92, 120, 18, { r: 10 }), K.carrotRound(p, 140, 90, 17, { r: 0 }), K.carrotRound(p, 62, 112, 16, { r: 0 }), K.carrotRound(p, 104, 148, 16, { r: 0 }),
        xidPotatoChunk(p, 100, 92, 24, 20, { seed: 1, c: '#e0b070' }), xidPotatoChunk(p, 74, 140, 22, -30, { seed: 2, c: '#e0b070' }), xidPotatoChunk(p, 140, 136, 20, 60, { seed: 3, c: '#e0b070' }),
        `</g>`,
        `<g ${p.sh(.4)}>`,
        ...xidSpots('brene', 40, 70, 10).map(([x, y, r], i) => xidKidney(p, x, y, 13, r, { c: i % 3 ? '#8a2a22' : '#9a3428' })),
        `</g>`,
        xidCeleryLeaf(p, 100, 104, 18, 20), xidCeleryLeaf(p, 80, 72, 16, -40), xidCeleryLeaf(p, 130, 100, 16, 70),
        K.scallions(p, 100, 100, 104, { n: 16, c: '#5fae3a' }),
        xidFriedShallot(p, 100, 100, 104, 30, 4),
        idSoupShineX(.3),
    ].join(''),

    // ミー・ゴドッグ（ジャワの煮込み麺）: 少しにごった茶色のスープに、黄色い卵麺、溶き卵、キャベツ、鶏、トマト、セロリ、揚げエシャロット
    id_migodog: p => [
        xidEnamel(p, { rim: '#2f7a5a', deep: true }),
        xidBroth(p, '#c8984e', { R: 79, op: .95, cream: .2, glow: .3 }),
        xidNoodles(p, 100, 102, 130, { c: '#e2b43a', w: 2.6, n: 30, seed: 2 }),
        `<g ${p.sh(.6)}>`,
        ...[[70, 80, 20], [132, 74, -30], [140, 124, 60], [66, 128, -10]].map(([x, y, r], i) => idCab(p, x, y, 30, r, i)),
        `</g>`,
        xidNoodles(p, 100, 100, 100, { c: '#dcac34', w: 2.6, n: 9, seed: 3 }),
        `<g ${p.sh(.6)}>`,
        xidEggCloud(p, 96, 100, 66, 20, { seed: 1, c: '#f8d040' }), xidEggCloud(p, 128, 108, 44, -40, { seed: 2, c: '#f8d040' }),
        ...[[78, 108, 30], [114, 130, -20], [118, 80, 70], [90, 136, 10]].map(([x, y, r], i) => xidChickenSlice(p, x, y, 20, r, { c: '#ead2a8', seed: i + 1 })),
        xidTomato(p, 66, 98, 24, 30, { seed: 1 }), xidTomato(p, 146, 96, 22, -40, { seed: 2 }), xidTomato(p, 100, 60, 22, 10, { seed: 3 }),
        `</g>`,
        xidCeleryLeaf(p, 104, 112, 18, 20), xidCeleryLeaf(p, 84, 80, 16, -40), xidCeleryLeaf(p, 132, 140, 16, 70),
        K.scallions(p, 100, 100, 104, { n: 14, c: '#4f9a34' }),
        xidFriedShallot(p, 100, 100, 108, 28, 5),
        idSoupShineX(),
    ].join(''),

    // ガラン・アセム: バナナの葉を敷いた鉢に、薄いココナッツの酸っぱい汁、鶏、青トマト、ブリンビン、赤と青の唐辛子
    id_garangasem: p => [
        K.bowl(p, { glaze: '#6a4a2a', inside: '#f3ece0' }),
        xidBanana(p, { r: 30, w: 170, R: 80 }),
        xidBroth(p, '#ead6a0', { R: 66, op: .92, cream: .3, glow: .3 }),
        xidOil(p, 100, 100, 120, { n: 10, c: '#e8b85a', op: .5, rmax: 2, seed: 7 }),
        `<g ${p.sh(.7)}>`,
        xidChickenBit(p, 82, 84, 42, -20, { seed: 1, c: '#d8a868', bone: true }), xidChickenBit(p, 118, 118, 42, 160, { seed: 2, c: '#d4a464', bone: true }), xidChickenBit(p, 76, 124, 34, 80, { seed: 3, c: '#d8a868' }),
        xidTomato(p, 126, 80, 26, -30, { seed: 1, c: '#8ab83a' }), xidTomato(p, 100, 102, 22, 40, { seed: 2, c: '#9ac040' }), xidTomato(p, 54, 100, 22, 80, { seed: 3, c: '#8ab83a' }),
        ...[[104, 66, 20], [146, 106, 80], [98, 146, -10], [60, 74, 50]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-11" y="-3.6" width="22" height="7.2" rx="3.6" fill="${p.g('#b4d060', .3, .25)}" stroke="#6e9a2e" stroke-width=".6"/><path d="M-9,-1 L9,-1" stroke="#e0eca8" stroke-width="1" stroke-linecap="round"/></g>`),
        xidRawit(p, 136, 136, 30, -30), xidRawit(p, 112, 92, 26, 60, { c: '#4f9a2e' }), xidRawit(p, 66, 146, 26, 20, { c: '#4f9a2e' }), xidRawit(p, 140, 60, 24, 120),
        `</g>`,
        xidLeaf(p, 92, 112, 22, -30, { c: '#5a6a2a', narrow: .55 }),
        xidSoupShine(100, 100, 66, .35),
    ].join(''),

    // カリ・アヤム: 橙色のカレーのとろみ汁、赤い油、骨つきの鶏、じゃがいも、にんじん、こぶみかんの葉
    id_kariayam: p => [
        xidBowl(p, { line: '#d98a3a', c: '#d9485a' }),
        xidBroth(p, '#d8862a', { op: 1, cream: .15, glow: .3 }),
        xidOil(p, 100, 100, 144, { n: 18, c: '#d8501a', op: .6, rmax: 2.8, seed: 8 }),
        `<g ${p.sh(.8)}>`,
        xidChickenBit(p, 78, 80, 48, -20, { seed: 1, c: '#c8782a', bone: true }), xidChickenBit(p, 126, 112, 48, 160, { seed: 2, c: '#c47428', bone: true }), xidChickenBit(p, 70, 128, 38, 80, { seed: 3, c: '#c8782a' }),
        xidPotatoChunk(p, 124, 72, 30, 20, { seed: 1, c: '#f0b448' }), xidPotatoChunk(p, 100, 108, 28, -30, { seed: 2, c: '#eeb044' }), xidPotatoChunk(p, 104, 146, 26, 60, { seed: 3, c: '#f0b448' }), xidPotatoChunk(p, 50, 100, 24, 10, { seed: 4, c: '#eeb044' }),
        K.carrotChunk(p, 148, 92, 22, 30), K.carrotChunk(p, 100, 60, 20, -20), K.carrotChunk(p, 142, 140, 20, 80), K.carrotChunk(p, 76, 104, 18, 10),
        `</g>`,
        xidLimeLeaf(p, 110, 88, 22, -30), xidLeaf(p, 62, 66, 22, 40, { c: '#5a6a2a', narrow: .55 }),
        xidFriedShallot(p, 100, 100, 108, 30, 5),
        idSoupShineX(.3),
    ].join(''),

    // スップ・キムロ（ソロ風の澄ましスープ）: 金色の澄んだスープに、金針菜、きくらげ、春雨、鶏、にんじんの花形、薄焼き卵の細切り
    id_kimlo: p => [
        K.bowl(p, { glaze: '#8a2a2a', inside: '#f6f2e6' }),
        xidBroth(p, '#e2c27a', { op: .88, glow: .3 }),
        xidOil(p, 100, 100, 140, { n: 10, c: '#f0c860', op: .5, rmax: 2, seed: 9 }),
        K.threads(p, 100, 104, 120, { c: '#f3ecd8', n: 14, w: 1.4, seed: 3 }),
        `<g ${p.sh(.6)}>`,
        xidShreds(p, 84, 96, 76, { c: '#ecd6ac', n: 30, w: 3.6, len: .3, seed: 1 }),
        ...[[120, 80, 30], [70, 120, -40], [140, 116, 60], [104, 140, 0], [62, 80, 100]].map(([x, y, r], i) => xidWoodEar(p, x, y, 30, r, { seed: i + 1 })),
        xidShreds(p, 118, 110, 70, { c: '#f6d050', n: 20, w: 4, len: .4, seed: 2, curve: .1 }),
        ...[[100, 70, 20], [132, 96, -40], [86, 120, 60], [120, 136, 10], [76, 100, -60], [56, 108, 30], [140, 72, 80], [96, 150, 40]].map(([x, y, r]) => xidLily(p, x, y, 32, r)),
        `</g>`,
        ...[[104, 100, 0], [74, 140, 0], [146, 136, 0], [116, 56, 0], [54, 92, 0]].map(([x, y]) => `<g ${T(x, y)}><path d="M0,-8 Q3,-8 3.4,-4.6 Q7,-6 7.6,-2.4 Q10,0 7.6,2.4 Q7,6 3.4,4.6 Q3,8 0,8 Q-3,8 -3.4,4.6 Q-7,6 -7.6,2.4 Q-10,0 -7.6,-2.4 Q-7,-6 -3.4,-4.6 Q-3,-8 0,-8Z" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b85a1a" stroke-width=".5" transform="scale(.9)"/><circle r="2.6" fill="#f6a860"/></g>`),
        xidCeleryLeaf(p, 92, 86, 18, 20), xidCeleryLeaf(p, 124, 122, 16, -40),
        xidFriedShallot(p, 100, 100, 104, 30, 6),
        idSoupShineX(),
    ].join(''),

    // サユール・オヨン: 澄んだスープに、ヘチマの輪切り、春雨、ふんわり溶き卵、ねぎ、揚げエシャロット
    id_sayuroyong: p => [
        K.bowl(p, { glaze: '#9fbfae', inside: '#f2f4ee' }),
        xidBroth(p, '#e8dcb0', { op: .8, glow: .3 }),
        K.threads(p, 100, 104, 124, { c: '#f3ecd8', n: 6, w: 1.5, seed: 4 }),
        xidEggCloud(p, 84, 96, 64, 20, { seed: 1, c: '#f4c834' }), xidEggCloud(p, 124, 120, 54, -40, { seed: 2, c: '#f4c834' }), xidEggCloud(p, 114, 72, 44, 10, { seed: 3, c: '#f4c834' }),
        `<g ${p.sh(.5)}>`,
        ...xidSpots('oyong', 14, 62, 24).map(([x, y, r], i) => xidLuffa(p, x, y, 26 + (i % 3) * 2, r)),
        `</g>`,
        K.scallions(p, 100, 100, 104, { n: 16, c: '#4f9a34' }),
        xidFriedShallot(p, 100, 100, 104, 26, 7),
        xidPepper(p, 100, 100, 100, 14),
        idSoupShineX(.4),
    ].join(''),
});
function idCab(p, x, y, s, r, i){ return xidCabbagePiece(p, x, y, s, r, { seed: i + 1, c: i % 2 ? '#d8e6a8' : '#c8dc98' }); }

// ---------- 主菜の部品 ----------
// 焼き網の焦げ目（斜めの線）
function xidGrill(x, y, w, h, r = 0, { n = 4, c = '#2a1206', op = .55 } = {}){
    let d = '';
    for (let i = 0; i < n; i++){ const xx = -w / 2 + (i + .5) * w / n; d += `M${f1(xx - 3)},${f1(-h / 2)}L${f1(xx + 3)},${f1(h / 2)}`; }
    return `<path ${T(x, y, r)} d="${d}" stroke="${c}" stroke-width="2.6" stroke-linecap="round" opacity="${op}"/>`;
}
// 照りのかかった焼き鶏（ayam bakar: 赤茶のたれ、焦げ）。kind = 'thigh' | 'drum'
function xidBakar(p, x, y, s, r = 0, { kind = 'thigh', c = '#8a3e16', seed = 1 } = {}){
    const base = kind === 'drum' ? xidDrum(p, 0, 0, s, 0, { c }) : xidThigh(p, 0, 0, s, 0, { c, seed });
    const w = kind === 'drum' ? s * .5 : s * .6, h = kind === 'drum' ? s * .3 : s * .45;
    return `<g ${T(x, y, r)}>${base}${xidGrill(kind === 'drum' ? -s * .1 : 0, 0, w, h, 0, { n: 4 })}
        <path d="M${f(-w * .4)},${f(-h * .25)} Q${f(-w * .1)},${f(-h * .55)} ${f(w * .3)},${f(-h * .4)}" stroke="#ffe8c8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// たたいてつぶした揚げ鶏（ayam geprek）: こぶの多い揚げ衣が割れて平たく広がり、かけらが散る
function xidGeprek(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidGp' + seed + x + y);
    const pts = ring(s / 2, 14, .3, R, 1.2, .82);
    let lumps = '', dark = '', cr = '';
    for (let i = 0; i < 26; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .44, cx = Math.cos(a) * d * 1.15, cy = Math.sin(a) * d * .78, rr = 3 + R() * 4;
        const blob = ring(rr, 6, .45, R).map(([u, v]) => `${f1(cx + u)},${f1(cy + v)}`);
        (R() < .7 ? (lumps += `M${blob.join('L')}Z`) : (dark += `M${blob.join('L')}Z`));
    }
    for (let i = 0; i < 8; i++){ const a = R() * 6.28, d = R() * s * .35, cx = Math.cos(a) * d, cy = Math.sin(a) * d * .75; cr += `M${f1(cx)},${f1(cy)}l${f1((R() - .5) * 16)},${f1((R() - .5) * 10)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><g ${p.rough(3, .18)}><path d="${xidSm(pts, true)}" fill="${p.g('#c8822c', .3, .35)}" stroke="#8a4e16" stroke-width=".8"/></g></g>
        <g ${p.crumb(.9)}><path d="${xidSm(pts.map(([a, b]) => [a * .94, b * .94]), true)}" fill="#cc8a32"/></g>
        <path d="${dark}" fill="#a86220" stroke-linejoin="round" stroke="#a86220" stroke-width="1.5" opacity=".7"/><path d="${lumps}" fill="${p.g('#e8b050', .4, .2)}" stroke="#c88a34" stroke-width=".8" stroke-linejoin="round"/>
        <path d="${cr}" stroke="#7a420e" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        ${xidGrains(p, 0, 0, s * 1.25, { cols: ['#d89a3a', '#e8b452', '#b87428'], n: 28, size: 1.7, seed, sy: .8 })}
        ${xidShine(`M${f(-s * .36)},${f(-s * .1)} Q${f(-s * .2)},${f(-s * .3)} ${f(s * .05)},${f(-s * .3)}`, 1.8, .55)}</g>`;
}
// 粗くつぶした生のサンバル（唐辛子・にんにく・塩、油で照る）
function xidSambalBawang(p, x, y, s, { seed = 1, c = '#d8361e', sy = .8 } = {}){
    const R = rng(p.id + 'xidSb' + seed + x + y);
    const shape = xidSm(ring(s / 2, 11, .38, R, 1, sy), true);
    return `<g ${T(x, y)}><g ${p.sh(.6)}><g ${p.rough(3, .2)}><path d="${shape}" fill="${p.rg(c, .2, .25, .4, .36)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g></g>
        ${xidGrains(p, 0, 0, s * .9, { cols: ['#f05a34', '#a81c10', '#e8402a', '#f27a4a'], n: Math.round(s * 1.1), size: 2.4, seed, sy })}
        ${xidGrains(p, 0, 0, s * .85, { cols: ['#f6e0a0', '#fff4d0'], n: Math.round(s * .4), size: 1, seed: seed + 5, sy })}
        ${xidShine(`M${f(-s * .26)},${f(-s * .1)} Q${f(-s * .1)},${f(-s * .28 * sy)} ${f(s * .12)},${f(-s * .26 * sy)}`, 1.6, .6)}</g>`;
}
// 叩いてのばした牛肉を揚げたもの（empal: 繊維の筋、縁がかりっと濃い）
function xidEmpal(p, x, y, w, h, r = 0, { c = '#8a4e24', seed = 1 } = {}){
    const R = rng(p.id + 'xidEp' + seed + x + y);
    const pts = ring(w / 2, 11, .22, R, 1, h / w);
    let fib = '';
    for (let i = 0; i < 9; i++){ const yy = -h * .38 + i * h * .095; fib += `M${f1(-w * .4 + R() * 4)},${f1(yy + (R() - .5) * 2)}Q0,${f1(yy + (R() - .5) * 5)} ${f1(w * .4 - R() * 4)},${f1(yy + (R() - .5) * 2)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(2.2, .15)}><path d="${xidSm(pts, true)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g></g>
        <path d="${fib}" stroke="${dk(c, .3)}" stroke-width="1" fill="none" opacity=".55"/><path d="${fib}" stroke="${lt(c, .3)}" stroke-width=".5" fill="none" opacity=".5" transform="translate(-.8 -.8)"/>
        <path d="${xidSm(pts.map(([a, b]) => [a * .9, b * .88]), true)}" fill="none" stroke="${dk(c, .35)}" stroke-width="2.4" opacity=".35"/>
        ${xidShine(`M${f(-w * .3)},${f(-h * .25)} Q${f(-w * .05)},${f(-h * .42)} ${f(w * .25)},${f(-h * .3)}`, 1.8, .55)}</g>`;
}
// サテの串（肉と脂身を交互に、甘いしょうゆの照りと焦げ）
function xidSate(p, x, y, L, r = 0, { c = '#6a2e14', n = 4, fat = true, seed = 1 } = {}){
    const R = rng(p.id + 'xidSt' + seed + x + y);
    let ch = '';
    const step = L * .74 / n;
    for (let i = 0; i < n; i++){
        const cx = -L / 2 + 8 + step * (i + .5), isFat = fat && i % 2 === 1, col = isFat ? '#c88a48' : c, sz = step * (isFat ? .44 : .56);
        ch += `<path ${T(cx, (R() - .5) * 1.5, R() * 360)} d="${xidSm(ring(sz, 7, .3, R, 1, .85), true)}" fill="${p.g(col, .3, .35)}" stroke="${dk(col, .45)}" stroke-width=".6"/>
            <circle cx="${f(cx + (R() - .5) * sz)}" cy="${f((R() - .5) * sz)}" r="${f(1.5 + R() * 1.6)}" fill="#1e0c04" opacity=".5"/>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${-L / 2}" y="-1.3" width="${L}" height="2.6" rx="1.3" fill="#d8b47a" stroke="#9a7a46" stroke-width=".4"/>${ch}</g>
        ${xidShine(`M${f(-L / 2 + 6)},${f(-step * .4)} L${f(-L / 2 + 8 + step * n - 4)},${f(-step * .4)}`, 1.4, .55)}</g>`;
}
// 開いたバナナの葉の包み（ペペス: 焼けて茶色くなった縁）
function xidParcel(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidPc' + seed + x + y);
    const outer = ring(w / 2, 12, .12, R, 1, h / w);
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><path d="${xidSm(outer, true)}" fill="${p.g('#5a8a3a', .2, .3)}" stroke="#3a5a22" stroke-width=".8"/></g>
        <path d="${xidSm(outer.map(([a, b]) => [a * .96, b * .94]), true)}" fill="none" stroke="#6a4a22" stroke-width="5" opacity=".55"/>
        <path d="${xidSm(outer.map(([a, b]) => [a * .78, b * .72]), true)}" fill="${p.g('#7aa64a', .2, .25)}" stroke="#4e7a2e" stroke-width=".7"/>
        <path d="M${f(-w * .45)},0 L${f(w * .45)},0" stroke="#a8c878" stroke-width="2" opacity=".6"/>
        ${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${f((R() - .5) * w * .8)}" cy="${f((R() > .5 ? 1 : -1) * h * (.36 + R() * .08))}" rx="${f(4 + R() * 6)}" ry="${f(2 + R() * 2)}" fill="#3a2410" opacity="${f(.35 + R() * .3)}"/>`).join('')}</g>`;
}
// 甘いしょうゆだれ（kecap: 黒褐色の照り）
const xidKecapPool = (p, x, y, s, { seed = 1, sy = .7, op = .9 } = {}) => K.pool(p, x, y, s, '#3a1a0c', { op, seed, sy });

Object.assign(XD, {
    // ルンダン: 花柄の皿に、白いご飯と、真っ黒に近い茶色まで煮詰めた牛肉、ココナッツのそぼろ状のルンダンの香辛料
    id_rendang: p => [
        idPlateX(p, '#d9485a'),
        xidRice(p, 64, 98, 70, { density: 1.3, grain: 3.6, sy: 1.1 }),
        K.pool(p, 118, 104, 100, '#4a2412', { op: .8, seed: 2, sy: 1 }),
        xidGrains(p, 118, 104, 104, { cols: ['#6a3418', '#4a2210', '#8a4a20'], n: 80, size: 1.8, seed: 1 }),
        `<g ${p.sh(1)}><g ${p.rough(2, .18)}>`,
        ...[[104, 72, 34, -10, '#4a2412'], [138, 80, 32, 30, '#40200e'], [118, 106, 36, 60, '#52280f'], [150, 114, 30, -30, '#44200c'], [100, 134, 32, 20, '#4a2412'], [132, 142, 30, 80, '#40200e'], [88, 104, 28, 110, '#4e2610']].map(([x, y, s, r, c], i) => xidBeefChunk(p, x, y, s, r, { seed: i + 1, c })),
        `</g></g>`,
        xidGrains(p, 120, 104, 96, { cols: ['#7a3e18', '#5a2c12', '#9a5a26'], n: 60, size: 1.5, seed: 2 }),
        xidChiliC(p, 112, 88, 6, 20, '#a8281a'), xidChiliC(p, 144, 98, 6, -30, '#a8281a'), xidChiliC(p, 120, 126, 6, 60, '#a8281a'),
        xidLimeLeaf(p, 72, 140, 24, -30),
    ].join(''),

    // アヤム・バカール: バナナの葉を敷いた皿に、甘いしょうゆで照りよく焼いた鶏、きゅうり、レモンバジル、サンバル
    id_ayambakar: p => [
        idPlateX(p, '#2f8a5a'),
        xidBanana(p, { r: -20, w: 130, R: 74 }),
        xidRice(p, 62, 128, 54, { density: 1.3, grain: 3.4 }),
        xidBakar(p, 92, 82, 82, -24, { kind: 'drum', c: '#7a3412' }),
        xidBakar(p, 128, 118, 60, 30, { kind: 'thigh', c: '#82381a', seed: 2 }),
        K.cucumberSlice(p, 150, 74, 17, 20), K.cucumberSlice(p, 140, 58, 16, -30), K.cucumberSlice(p, 156, 92, 15, 50),
        ...[[52, 84, -30], [58, 70, 20], [44, 98, 70]].map(([x, y, r]) => xidLeaf(p, x, y, 18, r, { c: '#3f8a2c', narrow: .7 })),
        xidSambalBawang(p, 104, 150, 26, { seed: 3 }),
        xidLime(p, 132, 152, 20, -20),
    ].join(''),

    // アヤム・ゲプレック: ほうろうの皿に、たたいてつぶした揚げ鶏と、たっぷりの生のサンバル、ご飯、きゅうり
    id_ayamgeprek: p => [
        xidEnamel(p, { rim: '#2f8a5a' }),
        xidRice(p, 64, 112, 66, { density: 1.3, grain: 3.4, sy: 1.15 }),
        xidGeprek(p, 120, 100, 100, -10, { seed: 1 }),
        xidSambalBawang(p, 122, 92, 52, { seed: 2, sy: .75 }),
        xidSambalBawang(p, 100, 120, 26, { seed: 4, sy: .8 }),
        ...[[112, 86, 30], [130, 104, -40]].map(([x, y, r]) => xidChiliC(p, x, y, 7, r, '#3f8a2c')),
        K.cucumberSlice(p, 72, 68, 17, 20), K.cucumberSlice(p, 90, 58, 16, -30), K.cucumberSlice(p, 56, 80, 15, 50),
        xidLeaf(p, 130, 146, 18, 30, { c: '#3f8a2c', narrow: .7 }),
    ].join(''),

    // アヤム・ケチャップ: 楕円の深皿に、甘いしょうゆでつやよく煮た鶏、トマト、ねぎのぶつ切り、玉ねぎ
    id_ayamkecap: p => [
        K.ovalDish(p, { rim: '#8a5a2a', deep: true }),
        K.pool(p, 100, 102, 150, '#4a200c', { op: .95, seed: 3, sy: .7 }),
        `<g ${p.sh(.9)}>`,
        xidChickenBit(p, 62, 96, 48, 160, { seed: 1, c: '#7a3814', bone: true }), xidChickenBit(p, 110, 78, 48, -10, { seed: 2, c: '#723410', bone: true }),
        xidChickenBit(p, 136, 118, 46, 20, { seed: 3, c: '#7a3814', bone: true }), xidChickenBit(p, 92, 124, 46, 190, { seed: 4, c: '#6e320f' }),
        K.onion(p, 52, 110, 20, 30, { c: '#b8824a' }), K.onion(p, 150, 84, 20, -40, { c: '#b8824a' }),
        K.tomatoWedge(p, 118, 64, 24, -20), K.tomatoWedge(p, 66, 130, 22, 30), K.tomatoWedge(p, 150, 136, 20, 70),
        `</g>`,
        ...[[96, 98, 30], [130, 134, -20], [76, 70, 60], [118, 98, 100], [50, 92, 10]].map(([x, y, r]) => xidScallion(p, x, y, 26, r)),
        xidOil(p, 100, 100, 130, { n: 10, c: '#7a3a14', op: .5, rmax: 1.8 }),
        xidSesameX(p),
    ].join(''),

    // ミー・アヤム: 鶏の絵の鉢に、黄色い卵麺、甘いしょうゆで煮た鶏としいたけの角切り、サウィ、ねぎ、揚げエシャロット
    id_mieayam: p => [
        xidJago(p, { line: '#d9485a' }),
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#d8a848', .2, .25)}"/>`,
        xidNoodles(p, 100, 102, 150, { c: '#ecc23e', w: 2.6, n: 40, seed: 1 }),
        `<g ${p.sh(.6)}>`,
        xidSawi(p, 56, 92, 46, 160, { seed: 1 }), xidSawi(p, 70, 134, 44, 130, { seed: 2 }), xidSawi(p, 62, 66, 38, 210, { seed: 3 }),
        `</g>`,
        xidNoodles(p, 96, 104, 100, { c: '#e6ba38', w: 2.6, n: 10, seed: 2 }),
        K.pool(p, 118, 98, 74, '#5a2a10', { op: .9, seed: 4, sy: .9 }),
        `<g ${p.sh(.7)}>`,
        ...xidSpots('miea', 16, 34, 11, 118, 98).map(([x, y, r], i) => xidDice(p, x, y, 11 + (i % 3), r, i % 4 === 3 ? '#4a2a18' : '#8a4a20')),
        `</g>`,
        K.scallions(p, 112, 100, 80, { n: 18, c: '#4f9a34' }),
        xidFriedShallot(p, 110, 100, 90, 26, 3),
    ].join(''),

    // エンパル: 白い皿に、香辛料と椰子砂糖で煮てから揚げた牛肉の平たい切り身、サンバル、きゅうり
    id_empal: p => [
        K.plate(p, { rim: '#8a5a2a' }),
        xidEmpal(p, 80, 78, 84, 56, -20, { seed: 1, c: '#8a4c22' }),
        xidEmpal(p, 124, 102, 80, 58, 25, { seed: 2, c: '#7e4420' }),
        xidEmpal(p, 84, 130, 78, 52, -5, { seed: 3, c: '#8e5026' }),
        xidFriedShallot(p, 100, 104, 100, 20, 2),
        xidSambalBawang(p, 146, 72, 28, { seed: 2 }),
        K.cucumberSlice(p, 140, 142, 17, 20), K.cucumberSlice(p, 124, 152, 16, -30), K.cucumberSlice(p, 154, 128, 15, 50),
        idLeaves(p, [[52, 108, 80], [58, 94, 40]]),
    ].join(''),

    // サテ・カンビン: 長皿に、甘いしょうゆで焼いたやぎ肉の串、しょうゆだれに生のエシャロット・トマト・唐辛子、キャベツ、ライム
    id_satekambing: p => [
        K.longPlate(p, { w: 188, h: 132 }),
        xidKecapPool(p, 128, 120, 66, { seed: 2, sy: .6 }),
        `<g ${p.sh(.4)}>`,
        ...[[118, 116, 20], [136, 124, -30], [126, 128, 70], [146, 114, 40], [112, 126, 100]].map(([x, y, r]) => K.onion(p, x, y, 12, r, { c: '#e8c8d8', layers: 1 })),
        ...[[130, 114, 0], [142, 128, 30], [120, 120, 60]].map(([x, y, r]) => xidChiliC(p, x, y, 6, r)),
        K.tomatoWedge(p, 154, 120, 16, 40),
        `</g>`,
        idCabbageHeap(p, 54, 128, 46),
        ...[0, 1, 2, 3, 4].map(i => xidSate(p, 104, 62 + i * 14, 176, -6, { seed: i + 1, n: 6, c: i % 2 ? '#5e2810' : '#6a2e14' })),
        xidLime(p, 34, 92, 20, -20),
    ].join(''),

    // イカン・バカール: バナナの葉を敷いた長皿に、甘いしょうゆで焼いた魚一尾（焦げ目）、サンバル・ケチャップ、ライム、きゅうり
    id_ikanbakar: p => [
        K.longPlate(p, { w: 190, h: 132, base: '#f4f1ea' }),
        `<g ${p.sh(.6)}><rect x="16" y="44" width="168" height="112" rx="8" fill="${p.g('#4a8a36', .2, .25)}"/></g><path d="M18,100 L182,100" stroke="#a8c878" stroke-width="3" opacity=".6"/>`,
        xidFriedFish(p, 96, 100, 160, -6, { c: '#7a3a16', seed: 1 }),
        xidGrill(96, 100, 80, 40, -6, { n: 6, op: .45 }),
        `<path d="M40,98 Q90,84 150,96" stroke="#ffe0c0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
        xidKecapPool(p, 162, 132, 30, { seed: 3 }),
        ...[[158, 130, 0], [166, 136, 30]].map(([x, y, r]) => xidChiliC(p, x, y, 6, r)),
        xidLime(p, 34, 136, 22, 20), xidLime(p, 168, 66, 20, -20),
        K.cucumberSlice(p, 54, 60, 16, 20), K.cucumberSlice(p, 36, 72, 15, -20),
    ].join(''),

    // ペペス・イカン: 皿の上で開いたバナナの葉の包み、黄色い香辛料をまとった魚、レモンバジル、トマト、唐辛子
    id_pepesikan: p => [
        idPlateX(p, '#2f6aa8'),
        xidParcel(p, 100, 100, 176, 120, -12, { seed: 1 }),
        `<g ${T(100, 100, -12)}><g ${p.sh(.8)}><path d="M-62,2 C-60,-22 -30,-30 0,-30 C26,-30 46,-20 56,-8 L70,-22 Q66,0 70,22 L56,8 C46,20 26,30 0,30 C-30,30 -60,24 -62,2Z" fill="${p.g('#d89a2a', .3, .3)}" stroke="#9a6418" stroke-width=".8"/></g>`,
        xidGrains(p, -4, 0, 100, { cols: ['#e8b03a', '#c8801e', '#f2c860', '#b86a1a'], n: 120, size: 2, seed: 1, sy: .5 }),
        `<path d="M-30,-22 Q-34,0 -30,22 M-6,-26 Q-10,0 -6,26 M18,-24 Q14,0 18,24" stroke="#a8641a" stroke-width="1.6" fill="none" opacity=".5"/></g>`,
        ...[[70, 86, -20], [98, 80, 40], [122, 88, -60], [84, 114, 20], [116, 116, 80], [140, 102, 10], [60, 106, 60]].map(([x, y, r]) => xidLeaf(p, x, y, 18, r, { c: '#2f7a2a', narrow: .65 })),
        K.tomatoWedge(p, 104, 100, 20, 10), K.tomatoWedge(p, 70, 100, 18, -30), K.tomatoWedge(p, 134, 94, 18, 40),
        ...[[90, 96, 30], [120, 104, -20], [80, 82, 60], [146, 112, 0]].map(([x, y, r]) => xidChiliC(p, x, y, 7, r)),
        xidLeaf(p, 110, 70, 26, -10, { c: '#5a6a2a', narrow: .55 }),
    ].join(''),

    // イカン・アサム・マニス: 楕円皿に、衣をつけて揚げた白身魚、とろりとした赤橙の甘酢あん、パイナップル、にんじん、きゅうり、トマト、玉ねぎ
    id_ikanasammanis: p => [
        K.ovalDish(p, { rim: '#d98a3a' }),
        K.pool(p, 100, 102, 150, '#e0561e', { op: .9, seed: 4, sy: .66 }),
        `<g ${p.sh(1)}>`,
        ...[[68, 86, 58, 34, -20], [118, 76, 60, 34, 15], [140, 112, 56, 34, -10], [90, 122, 60, 34, 20]].map(([x, y, w, h, r]) => `<g ${T(x, y, r)}><g ${p.crumb(.7)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h * .45}" fill="${p.g('#d89a40', .3, .3)}" stroke="#9a6020" stroke-width=".8"/></g></g>`),
        `</g>`,
        K.glaze(p, 82, 86, 50, '#e8501a', { seed: 1, op: .5 }), K.glaze(p, 126, 104, 54, '#e8501a', { seed: 2, op: .5 }), K.glaze(p, 96, 120, 40, '#e8501a', { seed: 3, op: .45 }),
        `<g ${p.sh(.6)}>`,
        ...[[80, 92, 20], [126, 96, -30], [104, 120, 60], [62, 112, 80], [144, 82, 0], [100, 72, 40]].map(([x, y, r]) => xidPineapple(p, x, y, 20, r)),
        ...[[92, 80, 20], [116, 112, -40], [70, 104, 70], [138, 104, 10], [110, 90, -70], [86, 132, 30]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-9" y="-1.8" width="18" height="3.6" rx="1.2" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b85a1a" stroke-width=".4"/></g>`),
        K.cucumberChunk(p, 56, 92, 14, 20), K.cucumberChunk(p, 148, 120, 14, -20), K.cucumberChunk(p, 120, 132, 12, 50),
        xidTomato(p, 130, 70, 18, -30, { seed: 1 }), xidTomato(p, 76, 128, 18, 30, { seed: 2 }),
        K.onion(p, 104, 98, 18, 20, { c: '#f0d0b0' }), K.onion(p, 66, 74, 16, -40, { c: '#f0d0b0' }),
        `</g>`,
        glossX(p, 104, 100, 120),
    ].join(''),
});
// 花柄の皿
function idPlateX(p, c){ return xidPlate(p, { c, leaf: '#4f9a3a' }); }
// しょうゆだれの照り
function glossX(p, x, y, s){ return `<path d="M${x - s * .38},${y - s * .02} Q${x - s * .2},${y - s * .2} ${x + s * .05},${y - s * .2}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`; }
// ごま（白）
function xidSesameX(p){ return K.sesame(p, 100, 100, 90, { n: 16 }); }
// 葉を何枚か
function idLeaves(p, list, c = '#3f8a2c'){ return list.map(([x, y, r]) => xidLeaf(p, x, y, 18, r, { c, narrow: .7 })).join(''); }
// 生キャベツの小山（細切り）
function idCabbageHeap(p, x, y, s){ return `<g ${p.sh(.5)}><path ${T(x, y)} d="${smooth(ring(s / 2, 9, .2, rng(p.id + 'ch'), 1, .9))}" fill="${p.rg('#eef6dc', .3, .1)}"/></g>` + xidShreds(p, x, y, s * .9, { c: '#d8e8b0', n: 30, w: 1.8, len: .3, seed: 7 }) + xidShreds(p, x, y, s * .8, { c: '#f4f8e8', n: 20, w: 1.8, len: .3, seed: 8 }); }

// いかの輪切り（甘いしょうゆで染まった）
function xidSquidRing(p, x, y, s, r = 0, { c = '#a86a3a' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f(s / 2 - s * .1)}" ry="${f(s * .42 - s * .1)}" fill="none" stroke="${dk(c, .35)}" stroke-width="${f(s * .24)}"/></g><ellipse rx="${f(s / 2 - s * .1)}" ry="${f(s * .42 - s * .1)}" fill="none" stroke="${p.g(c, .3, .2)}" stroke-width="${f(s * .19)}"/>
        <path d="M${f(-s * .36)},${f(-s * .12)} Q${f(-s * .2)},${f(-s * .36)} ${f(s * .08)},${f(-s * .34)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// いかのげそ
function xidTentacle(p, x, y, s, r = 0, { c = '#8a4a26' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-3,-4 Q-10,0 -9,8 M-1,-4 Q-4,4 -2,10 M1,-4 Q4,3 7,8 M3,-4 Q10,-1 10,6 M0,-4 Q0,4 3,10" stroke="${dk(c, .3)}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M-3,-4 Q-10,0 -9,8 M-1,-4 Q-4,4 -2,10 M1,-4 Q4,3 7,8 M3,-4 Q10,-1 10,6 M0,-4 Q0,4 3,10" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-5" rx="5" ry="3.4" fill="${p.g(c, .3, .25)}"/></g></g>`;
}
// ちりめんじゃこ（teri: 小さな銀色の干し魚）
function xidTeri(p, x, y, s, { n = 20, seed = 1, c = '#cbb89a', k = 1 } = {}){
    const fish = p.def('xidTeri' + c, id => `<g id="${id}"><path d="M-6,0 Q-4,-1.6 3,-.9 L6,-1.8 L5.2,0 L6,1.8 L3,.9 Q-4,1.6 -6,0Z" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".4"/><path d="M-4,-.4 L3,-.3" stroke="#f4eee0" stroke-width=".6"/><circle cx="-4.4" cy="-.2" r=".6" fill="#2a2420"/></g>`);
    const R = rng(p.id + 'xidTr' + seed + x + y);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<use href="#${fish}" ${T(x + Math.cos(a) * d, y + Math.sin(a) * d * .85, R() * 360, k * (.9 + R() * .4))}/>`; }
    return `<g ${p.sh(.4)}>${out}</g>`;
}
// 卵豆腐（tahu jepang）を揚げた輪切り
function xidEggTofu(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><circle r="${s / 2}" fill="${p.rg('#c8862e', .25, .3, .36, .32)}" stroke="#8a5418" stroke-width=".6"/></g><circle r="${f(s * .4)}" fill="${p.rg('#f6dc8a', .3, .15, .4, .36)}"/><circle cx="${f(s * .05)}" cy="${f(s * .05)}" r="${f(s * .25)}" fill="#c89040" opacity=".25"/>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .16)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".75"/></g>`;
}
// しょうゆと落花生のたれのかかった、もやし・きゅうりなど（たれは grains で）
const xidPeanutSauce = (p, x, y, s, { seed = 1, c = '#a8682c', op = .9, sy = .85 } = {}) => K.pool(p, x, y, s, c, { op, seed, sy }) + xidGrains(p, x, y, s * .9, { cols: [dk(c, .2), lt(c, .2)], n: Math.round(s * .45), size: 1.3, seed, sy });

Object.assign(XD, {
    // ウダン・バラド: 花柄の皿に、殻をむいて尾を残したえびを粗い赤唐辛子のバラドでからめ、揚げたじゃがいもの角切り、こぶみかんの葉
    id_udangbalado: p => [
        idPlateX(p, '#d98a3a'),
        K.pool(p, 100, 102, 136, '#c8301c', { op: .95, seed: 1, sy: .92 }),
        xidGrains(p, 100, 102, 128, { cols: ['#e8402a', '#a81c12', '#f06040'], n: 60, size: 2.4, seed: 1, sy: .9 }),
        `<g ${p.sh(.7)}>`,
        ...[[72, 78, 46, -20], [118, 70, 46, 30], [146, 106, 42, 100], [80, 122, 46, 160], [120, 138, 44, 200], [56, 104, 38, 60], [104, 102, 46, 250], [144, 76, 34, -60]].map(([x, y, s, r]) => K.shrimp(p, x, y, s, r, { c: '#ec6a3c' })),
        ...[[94, 80, 10], [126, 100, -20], [96, 140, 40], [60, 132, 0], [148, 134, 30], [72, 92, 50], [112, 120, 20]].map(([x, y, r]) => xidDice(p, x, y, 13, r, '#e6b04a')),
        `</g>`,
        xidGrains(p, 100, 102, 120, { cols: ['#c8301c', '#e8502e', '#a81c10'], n: 40, size: 2.2, seed: 6, sy: .9 }),
        xidLimeLeaf(p, 100, 60, 24, -20), xidLimeLeaf(p, 150, 120, 20, 70),
    ].join(''),

    // チュミ・ケチャップ: 白い皿に、甘いしょうゆで炒めたいかの輪切りとげそ、赤唐辛子、ねぎ、トマト
    id_cumikecap: p => [
        K.plate(p, { rim: '#2f6aa8' }),
        K.pool(p, 100, 102, 136, '#4a2410', { op: .85, seed: 2, sy: .92 }),
        ...xidSpots('cumi', 13, 56, 22).map(([x, y, r], i) => xidSquidRing(p, x, y, 26 + (i % 3) * 3, r, { c: i % 2 ? '#a86a3a' : '#b4783e' })),
        xidTentacle(p, 84, 96, 28, 30, { c: '#8a4a26' }), xidTentacle(p, 124, 112, 26, -60, { c: '#8a4a26' }), xidTentacle(p, 112, 72, 24, 150, { c: '#8a4a26' }),
        `<g ${p.sh(.5)}>`,
        ...[[96, 120, 30], [70, 90, -40], [132, 92, 70], [108, 140, 10], [62, 124, -60]].map(([x, y, r]) => xidScallion(p, x, y, 22, r)),
        ...[[86, 78, 30], [118, 128, -20], [142, 112, 60], [74, 114, 0], [104, 96, 40], [126, 68, 20]].map(([x, y, r]) => xidChiliSlice(p, x, y, 7, r)),
        K.tomatoWedge(p, 140, 132, 22, 30), K.tomatoWedge(p, 60, 74, 20, -30),
        `</g>`,
        xidOil(p, 100, 100, 120, { n: 8, c: '#6a3410', op: .5, rmax: 1.6 }),
        glossX(p, 100, 100, 110),
    ].join(''),

    // ビーフン・ゴレン: 花柄の皿に、甘いしょうゆで炒めた細いビーフン、えび、炒り卵、キャベツ、にんじん、サウィ、揚げエシャロット
    id_bihungoreng: p => [
        idPlateX(p, '#2f6aa8'),
        `<g ${p.sh(.8)}><path d="${xidSm(ring(66, 12, .12, rng('bihun'), 1, .95).map(([a, b]) => [a + 100, b + 102]), true)}" fill="${p.rg('#caa06a', .2, .2)}"/></g>`,
        xidNoodles(p, 100, 102, 134, { c: '#dcb47c', w: 1.5, n: 38, seed: 1, hi: .2 }),
        `<g ${p.sh(.6)}>`,
        idCab(p, 70, 84, 28, 20, 0), idCab(p, 132, 120, 28, -30, 1), idCab(p, 120, 70, 24, 60, 2),
        xidShreds(p, 100, 102, 110, { c: '#ef7f30', n: 18, w: 2, len: .18, seed: 2 }),
        xidSawi(p, 70, 126, 34, 30, { seed: 1 }), xidSawi(p, 146, 90, 30, -60, { seed: 2 }),
        `</g>`,
        xidNoodles(p, 100, 100, 108, { c: '#d4a870', w: 1.5, n: 12, seed: 2, hi: .2 }),
        `<g ${p.sh(.6)}>`,
        K.shrimp(p, 88, 86, 28, 20), K.shrimp(p, 120, 100, 28, -60), K.shrimp(p, 96, 126, 26, 120), K.shrimp(p, 64, 104, 24, -20),
        xidEggCloud(p, 112, 76, 34, 20, { seed: 1, c: '#f3c848' }), xidEggCloud(p, 120, 134, 32, -30, { seed: 2, c: '#f3c848' }),
        `</g>`,
        xidFriedShallot(p, 100, 100, 108, 28, 3),
        K.scallions(p, 100, 100, 100, { n: 10, c: '#4f9a34' }),
        idTomCuc(p),
    ].join(''),

    // パダン風の厚焼き卵（telur dadar padang）: 白い皿に、ふくらんだ厚い丸い卵焼き、ねぎ・唐辛子・エシャロットが散り、縁はこんがり。切り分けて
    id_telurdadar: p => {
        const R = rng('tdadar');
        const edge = ring(70, 18, .08, R, 1, .96).map(([a, b]) => [a + 100, b + 100]);
        let fl = '', br = '';
        for (let i = 0; i < 40; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 62, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d * .95, k = R(); fl += k < .5 ? `<circle cx="${f(x)}" cy="${f(y)}" r="1.9" fill="none" stroke="#4f9a34" stroke-width="1.3"/>` : k < .8 ? `<path ${T(x, y, R() * 180)} d="M-2.2,-1.1 L2.2,-1.1 L1.5,1.3 L-1.7,1.1Z" fill="#d42a1c"/>` : `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.1" fill="#a8587a" opacity=".7"/>`; }
        for (let i = 0; i < 16; i++){ const a = R() * 6.28, d = 20 + R() * 46, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d; br += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(4 + R() * 8)}" ry="${f(3 + R() * 5)}" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="#b8661a" opacity="${f(.18 + R() * .25)}"/>`; }
        return [
            K.plate(p, { rim: '#d98a3a' }),
            `<g ${p.sh(1.4)}><g ${p.rough(4, .1)}><path d="${xidSm(edge, true)}" fill="#b8681a"/></g></g>`,
            `<path d="${xidSm(edge.map(([a, b]) => [(a - 100) * .93 + 100, (b - 100) * .93 + 100]), true)}" fill="${p.rg('#f2b434', .3, .25, .4, .36)}"/>`,
            br,
            `<g ${p.crumb(.35)}><circle cx="98" cy="98" r="54" fill="#f6c848" opacity=".35"/></g>`,
            fl,
            xidShine('M50,86 Q60,56 92,42', 3, .5), xidShine('M66,96 Q72,76 90,66', 2, .35), xidShine('M120,46 Q140,52 150,64', 2, .4),
        ].join('');
    },

    // テルル・ブンブ・バリ: 深皿に、表面を揚げたゆで卵を、赤茶のバリ風の香辛料（唐辛子・しょうが・トマト・甘いしょうゆ）でからめ、こぶみかんの葉
    id_telurbali: p => [
        K.ovalDish(p, { rim: '#8a2a2a', deep: true, rx: 92, ry: 80 }),
        K.pool(p, 100, 102, 150, '#a8301a', { op: .95, seed: 3, sy: .82 }),
        xidGrains(p, 100, 102, 140, { cols: ['#c84a24', '#8a2412', '#d86a3a', '#6a2a14'], n: 90, size: 2.4, seed: 2, sy: .8 }),
        `<g ${p.sh(.8)}>`,
        xidFriedBoiledEgg(p, 70, 88, 42, -20, { seed: 1 }), xidFriedBoiledEgg(p, 114, 78, 42, 30, { half: true, seed: 2 }),
        xidFriedBoiledEgg(p, 136, 112, 42, -10, { seed: 3 }), xidFriedBoiledEgg(p, 90, 122, 42, 40, { half: true, seed: 4 }), xidFriedBoiledEgg(p, 56, 120, 34, 70, { seed: 5 }),
        `</g>`,
        K.pool(p, 92, 98, 40, '#a8301a', { op: .55, seed: 5 }), K.pool(p, 128, 128, 30, '#a8301a', { op: .5, seed: 6 }),
        xidGrains(p, 100, 102, 120, { cols: ['#c8301c', '#e8502e', '#7a2a12'], n: 40, size: 2, seed: 6, sy: .8 }),
        xidLimeLeaf(p, 100, 66, 22, -20), xidLimeLeaf(p, 148, 86, 20, 60),
        xidChiliSlice(p, 112, 102, 7, 20), xidChiliSlice(p, 76, 138, 7, -30), xidChiliSlice(p, 146, 132, 7, 60),
        glossX(p, 100, 100, 120),
    ].join(''),

    // タフ・テルル: 白い皿に、豆腐入りの厚い卵焼き、上にもやし、黒い甘いしょうゆと落花生のたれ、砕いた落花生、ねぎ、えびせんべい
    id_tahutelur: p => [
        K.plate(p, { rim: '#2f8a5a' }),
        `<g ${p.sh(1.2)}><g ${p.rough(2.6, .14)}><path d="${xidSm(ring(56, 14, .12, rng('tht'), 1.05, .92).map(([a, b]) => [a + 96, b + 102]), true)}" fill="${p.g('#d8962e', .3, .3)}"/></g></g>`,
        `<g ${p.crumb(.6)}><path d="${xidSm(ring(50, 14, .12, rng('tht2'), 1.05, .92).map(([a, b]) => [a + 96, b + 102]), true)}" fill="#eab448"/></g>`,
        ...[[74, 84], [104, 78], [126, 96], [80, 116], [110, 124], [66, 102], [98, 100]].map(([x, y], i) => `<rect ${T(x, y, i * 23)} x="-7" y="-7" width="14" height="14" rx="2" fill="${p.g('#f6ecd0', .3, .2)}" stroke="#d8c498" stroke-width=".6" opacity=".9"/>`),
        K.pool(p, 98, 106, 80, '#3e1e0e', { op: .75, seed: 4, sy: .8 }),
        xidSprouts(p, 96, 98, 72, { n: 26, seed: 2 }),
        K.pool(p, 104, 112, 40, '#4a2412', { op: .6, seed: 5, sy: .8 }),
        xidPeanuts(p, 96, 104, 80, 30, 2),
        K.scallions(p, 96, 104, 76, { n: 14, c: '#5fae3a' }),
        xidFriedShallot(p, 96, 104, 80, 20, 3),
        xidKrupuk(p, 150, 68, 40, 20, { seed: 1 }), xidKrupuk(p, 156, 134, 34, -30, { seed: 2 }),
        xidChiliC(p, 60, 140, 8, 20),
    ].join(''),

    // サポ・タフ: 取っ手つきの土鍋に、オイスターソースのつやのある茶色いあん、揚げた卵豆腐、鶏、えび、チンゲン菜、にんじん、しいたけ
    id_sapotahu: p => [
        xidClay(p, { R: 86, c: '#6a4430', inside: '#3a2418', handles: true }),
        `<circle cx="100" cy="100" r="70" fill="${p.rg('#8a5226', .2, .3)}"/>`,
        `<g ${p.sh(.7)}>`,
        xidSawi(p, 60, 98, 44, 170, { seed: 1 }), xidSawi(p, 130, 60, 40, -60, { seed: 2 }), xidSawi(p, 120, 146, 40, 60, { seed: 3 }),
        xidEggTofu(p, 92, 82, 32, 0), xidEggTofu(p, 126, 104, 32, 0), xidEggTofu(p, 92, 118, 32, 0), xidEggTofu(p, 66, 132, 26, 0), xidEggTofu(p, 146, 80, 24, 0),
        ...[[112, 74, 30], [74, 70, -20], [104, 140, 50]].map(([x, y, r], i) => xidChickenSlice(p, x, y, 20, r, { c: '#dcbc8a', seed: i + 1 })),
        K.shrimp(p, 138, 128, 26, -40), K.shrimp(p, 64, 110, 24, 40),
        K.shiitake(p, 112, 120, 18, 20), K.shiitake(p, 76, 96, 16, -30),
        K.carrotRound(p, 106, 100, 15, { r: 0 }), K.carrotRound(p, 140, 116, 14, { r: 0 }), K.carrotRound(p, 82, 140, 14, { r: 0 }),
        `</g>`,
        K.glaze(p, 104, 104, 100, '#8a4a1c', { seed: 2, op: .3 }),
        K.scallions(p, 100, 100, 96, { n: 12, c: '#4f9a34' }),
    ].join(''),

    // ガドガド: 花柄の皿に、ゆでたじゃがいも・ささげ・キャベツ・もやし、揚げ豆腐とテンペ、ゆで卵、上から落花生のたれ、えびせんべい、揚げエシャロット
    id_gadogado: p => [
        idPlateX(p, '#d9485a'),
        `<g ${p.sh(.6)}>`,
        idCab(p, 66, 88, 34, 20, 0), idCab(p, 136, 118, 34, -30, 1), idCab(p, 98, 140, 32, 60, 2),
        ...[[96, 64, 20], [140, 86, -30], [60, 120, 60], [118, 148, 10]].map(([x, y, r]) => xidLongBean(p, x, y, 26, r, { c: '#4f9a2e' })),
        xidPotatoChunk(p, 76, 70, 26, 20, { seed: 1, c: '#ecd08a' }), xidPotatoChunk(p, 146, 104, 24, -30, { seed: 2, c: '#ecd08a' }), xidPotatoChunk(p, 78, 140, 24, 60, { seed: 3, c: '#ecd08a' }),
        xidFriedTofu(p, 120, 70, 22, 10), xidFriedTofu(p, 56, 104, 20, -20),
        xidTempeh(p, 132, 138, 26, 16, 30, { seed: 1, c: '#c8a060' }),
        `</g>`,
        xidSprouts(p, 102, 102, 70, { n: 14, seed: 1 }),
        xidPeanutSauce(p, 102, 104, 80, { seed: 1, c: '#b0702e', op: .88 }),
        `<g ${p.sh(.6)}>`,
        xidLongBean(p, 112, 86, 24, 30, { c: '#4f9a2e' }), xidLongBean(p, 90, 120, 22, -40, { c: '#4f9a2e' }),
        xidFriedTofu(p, 116, 118, 18, 20), xidTempeh(p, 88, 86, 20, 14, -20, { seed: 2, c: '#c8a060' }),
        `</g>`,
        K.pool(p, 104, 104, 40, '#b0702e', { op: .7, seed: 3 }),
        K.eggHalf(p, 70, 96, 32, -30), K.eggHalf(p, 136, 124, 30, 40),
        xidFriedShallot(p, 102, 104, 80, 20, 3),
        xidKrupuk(p, 150, 62, 38, 20, { seed: 1 }),
    ].join(''),

    // ナシ・ウドゥック: バナナの葉を敷いた竹の皿に、ココナッツミルクで炊いたご飯、薄焼き卵の細切り、テンペオレック、落花生、きゅうり、サンバル、えびせんべい
    id_nasiuduk: p => [
        xidRattan(p),
        xidBanana(p, { r: 30, w: 170, R: 76 }),
        xidRice(p, 86, 100, 86, { tint: '#f4ecd6', density: 1.4, grain: 3.6 }),
        xidFriedShallot(p, 86, 92, 50, 26, 2),
        xidShreds(p, 136, 80, 40, { c: '#f4c63c', n: 18, w: 3.6, len: .5, seed: 1, curve: .1 }),
        `<g ${p.sh(.6)}>`,
        ...xidSpots('uduk-o', 14, 18, 7, 132, 124).map(([x, y, r], i) => `<rect ${T(x, y, r)} x="-7" y="-2" width="14" height="4" rx="1.2" fill="${p.g(['#9a5a22', '#b06a2a', '#7e4618'][i % 3], .3, .3)}"/>`),
        `</g>`,
        xidPeanuts(p, 104, 146, 26, 16, 3),
        K.cucumberSlice(p, 60, 140, 16, 20), K.cucumberSlice(p, 76, 150, 15, -20),
        xidSambalBawang(p, 150, 108, 20, { seed: 4 }),
        xidKrupuk(p, 76, 56, 34, 20, { seed: 1 }),
    ].join(''),

    // ナシ・リウット: アルミの鍋ごと、香りよく炊いたご飯の上に、ちりめんじゃこ、丸ごとの唐辛子、サラムの葉、レモングラス、揚げエシャロット
    id_nasiliwet: p => [
        xidKastrol(p),
        xidRice(p, 100, 100, 160, { tint: '#f2e8cc', density: .8, grain: 3.6, shadow: 0 }),
        xidTeri(p, 100, 100, 126, { n: 30, seed: 1, k: 1.7 }),
        `<g ${p.sh(.6)}>`,
        xidLeaf(p, 72, 76, 34, -30, { c: '#5a6a2a', narrow: .55 }), xidLeaf(p, 132, 128, 32, 40, { c: '#5a6a2a', narrow: .55 }), xidLeaf(p, 128, 70, 28, 100, { c: '#4e6224', narrow: .55 }),
        ...[[84, 118, 20], [116, 94, -40], [64, 102, 70]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-14" y="-3" width="28" height="6" rx="3" fill="${p.g('#e6e2b8', .3, .2)}" stroke="#b8b080" stroke-width=".5"/><path d="M-12,0 L12,0" stroke="#c8c890" stroke-width=".6"/></g>`),
        xidRawit(p, 100, 72, 26, 20), xidRawit(p, 92, 136, 26, -30, { c: '#4f9a2e' }), xidRawit(p, 140, 104, 24, 80), xidRawit(p, 70, 130, 24, 120),
        `</g>`,
        xidFriedShallot(p, 100, 100, 120, 30, 2),
    ].join(''),
});
// 炒めものの添え（トマトときゅうり）
function idTomCuc(p){ return [K.cucumberSlice(p, 156, 104, 14, 10), K.cucumberSlice(p, 150, 122, 14, -20), K.tomatoWedge(p, 148, 78, 18, -30)].join(''); }

// ---------- 副菜の部品 ----------
// きゅうりの角切り（片側に濃い緑の皮、種）
function xidCucDice(p, x, y, s, r = 0){
    const h = s / 2;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .18)}" fill="${p.g('#d8eab0', .3, .15)}" stroke="#8fb05a" stroke-width=".5"/></g>
        <rect x="${-h}" y="${f(h - s * .26)}" width="${s}" height="${f(s * .26)}" rx="${f(s * .12)}" fill="#3f7d2e"/>
        <circle cx="${f(-s * .12)}" cy="${f(-s * .05)}" r="${f(s * .07)}" fill="#f2f7e2"/><circle cx="${f(s * .14)}" cy="${f(-s * .12)}" r="${f(s * .07)}" fill="#f2f7e2"/></g>`;
}
// 丸なす（terong bulat）の輪切り
function xidTerongBulat(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="#5a9a3a" stroke="#3a6a22" stroke-width=".5"/></g><circle r="${f(s * .44)}" fill="${p.rg('#eef2d6', .3, .1)}"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${f(Math.cos(i * .785) * s * .22)}" cy="${f(Math.sin(i * .785) * s * .22)}" r="${f(s * .04)}" fill="#b8a86a"/>`).join('')}</g>`;
}
// エシャロット（bawang merah）の薄い輪切り
function xidShallotRing(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="none" stroke="#b8507a" stroke-width="1.6" opacity=".9"/><ellipse rx="${f(s * .3)}" ry="${f(s * .24)}" fill="none" stroke="#e2a0c0" stroke-width="1.2" opacity=".9"/><ellipse rx="${f(s * .42)}" ry="${f(s * .34)}" fill="#f6e4ee" opacity=".35"/></g>`;
}
// 丸ごとの小さなエシャロット
function xidShallot(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${s / 2}" ry="${f(s * .42)}" fill="${p.rg('#c86a8a', .3, .25, .36, .32)}" stroke="#8a3a5a" stroke-width=".6"/></g><path d="M${f(-s * .3)},0 Q0,${f(-s * .3)} ${f(s * .3)},0" stroke="#e8b0c8" stroke-width=".8" fill="none"/><ellipse cx="${f(-s * .14)}" cy="${f(-s * .14)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".7"/></g>`;
}
// レモングラスの小口切り
function xidSereh(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .4)}" fill="#eef0c8" stroke="#a8b070" stroke-width=".7"/><ellipse rx="${f(s * .3)}" ry="${f(s * .22)}" fill="none" stroke="#c8d090" stroke-width=".7"/><ellipse rx="${f(s * .12)}" ry="${f(s * .08)}" fill="#d8e0a0"/></g>`;
}
// いんげん（buncis）の斜め切り
function xidBuncis(p, x, y, L, r = 0, { c = '#4f9a34' } = {}){
    return `<g ${T(x, y, r)}><path d="M${-L / 2},-2.4 L${L / 2 - 3},-2.4 L${L / 2},2.4 L${-L / 2 + 3},2.4Z" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".5" stroke-linejoin="round"/><path d="M${f(-L / 2 + 3)},-.8 L${f(L / 2 - 3)},-.8" stroke="${lt(c, .5)}" stroke-width=".8" stroke-linecap="round"/></g>`;
}
// 細切り（マッチ棒）を色ごとに一本の path で
function xidSticks(p, x, y, s, { c = '#ef7f30', n = 20, L = 16, w = 3, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xidSk' + seed + x + y);
    let d = '', h = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, rr = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * rr, cy = y + Math.sin(a) * rr * sy, b = R() * Math.PI, l = L * (.7 + R() * .5), dx = Math.cos(b) * l / 2, dy = Math.sin(b) * l / 2; d += `M${f1(cx - dx)},${f1(cy - dy)}L${f1(cx + dx)},${f1(cy + dy)}`; if (R() < .5) h += `M${f1(cx - dx * .7 - .6)},${f1(cy - dy * .7 - .6)}L${f1(cx + dx * .5 - .6)},${f1(cy + dy * .5 - .6)}`; }
    return `<g ${p.sh(.5)} stroke-linecap="round" fill="none"><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${w + 1}"/><path d="${d}" stroke="${c}" stroke-width="${w}"/></g><path d="${h}" stroke="${lt(c, .45)}" stroke-width="${f(w * .35)}" stroke-linecap="round" fill="none" opacity=".8"/>`;
}

Object.assign(XD, {
    // アチャール・ティムン: ガラスの小鉢に、甘酢に漬けたきゅうりの角切り、にんじん、小さなエシャロット、丸ごとの唐辛子
    id_acar: p => [
        K.kobachi(p, { glaze: '#bcd6dc', inside: '#eef6f6' }),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#f2eccc', .2, .2)}" opacity=".6"/>`,
        `<g ${p.sh(.4)}>`,
        ...xidSpots('acar-c', 30, 62, 14).map(([x, y, r]) => xidCucDice(p, x, y, 17, r)),
        ...xidSpots('acar-k', 8, 58, 20).map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-8" y="-2.4" width="16" height="4.8" rx="1.4" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b85a1a" stroke-width=".4"/></g>`),
        xidShallot(p, 80, 86, 18, 20), xidShallot(p, 122, 118, 18, -30), xidShallot(p, 110, 72, 16, 60), xidShallot(p, 70, 126, 16, 10),
        xidRawit(p, 100, 104, 26, 30, { c: '#4f9a2e' }), xidRawit(p, 138, 86, 24, -40), xidRawit(p, 86, 146, 22, 70, { c: '#e8402a' }), xidRawit(p, 58, 98, 22, -80, { c: '#4f9a2e' }),
        `</g>`,
        `<circle cx="100" cy="100" r="74" fill="#ffffff" opacity=".08"/>`,
        xidSoupShine(100, 100, 74, .5),
    ].join(''),

    // カレドック: 白い皿に、生のきゅうり・ささげ・もやし・キャベツ・丸なすを刻み、ケンチュル入りの粗い落花生だれで和え、レモンバジル
    id_karedok: p => [
        K.plate(p, { rim: '#2f8a5a' }),
        `<g ${p.sh(.8)}><path d="${xidSm(ring(60, 12, .14, rng('kared'), 1, .95).map(([a, b]) => [a + 100, b + 102]), true)}" fill="${p.rg('#b8783a', .2, .2)}"/></g>`,
        idCabbageHeap(p, 100, 102, 112),
        `<g ${p.sh(.5)}>`,
        ...xidSpots('kar-c', 10, 56, 16).map(([x, y, r]) => xidCucDice(p, x, y, 13, r)),
        ...xidSpots('kar-b', 12, 58, 14).map(([x, y, r]) => xidLongBean(p, x, y, 13, r, { c: '#5aa23a' })),
        ...xidSpots('kar-t', 5, 50, 24).map(([x, y, r]) => xidTerongBulat(p, x, y, 16, r)),
        `</g>`,
        xidSprouts(p, 100, 100, 100, { n: 18, seed: 3 }),
        K.pool(p, 92, 92, 60, '#b0702e', { op: .55, seed: 5 }), K.pool(p, 120, 120, 50, '#b0702e', { op: .5, seed: 6 }), K.pool(p, 76, 128, 36, '#b0702e', { op: .5, seed: 7 }), K.pool(p, 128, 80, 34, '#b0702e', { op: .5, seed: 8 }),
        xidGrains(p, 100, 102, 120, { cols: ['#8a5222', '#c8884a'], n: 50, size: 1.6, seed: 4 }),
        ...[[84, 84, -20], [118, 96, 40], [96, 122, 80], [130, 128, -40], [70, 112, 10]].map(([x, y, r]) => xidLeaf(p, x, y, 16, r, { c: '#2f7a2a', narrow: .7 })),
    ].join(''),

    // サンバル・トゥラシ: 石のすり鉢に、えびの発酵ペーストを焼いて混ぜた赤茶のサンバル、トマト、ライム、すりこぎ
    id_sambalterasi: p => [
        idCobekX(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#9a2e16', .2, .3, .4, .38)}"/>`,
        xidGrains(p, 98, 100, 136, { cols: ['#b83a1e', '#8a2412', '#c8502e', '#6a3a1e'], n: 110, size: 2.6, seed: 1, sy: .92 }),
        xidGrains(p, 98, 100, 120, { cols: ['#f2d68a'], n: 30, size: .9, seed: 2, sy: .9 }),
        xidTomato(p, 76, 80, 26, -20, { seed: 1, c: '#d8402a' }), xidTomato(p, 124, 76, 22, 30, { seed: 2, c: '#d8402a' }),
        idLimeHalf(p, 64, 128, 30),
        xidOil(p, 98, 100, 110, { n: 8, c: '#d8602a', op: .5, rmax: 1.8 }),
        xidUlekan(p, 132, 130, -40),
    ].join(''),

    // サンバル・マタ（バリの生のサンバル）: 小鉢に、薄切りのエシャロット、唐辛子の輪切り、レモングラス、こぶみかんの葉の細切り、ココナッツオイルの照り
    id_sambalmatah: p => [
        K.kobachi(p, { glaze: '#5a3a2a', inside: '#f4eee4' }),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#f6e6b8', .2, .15)}" opacity=".7"/>`,
        ...xidSpots('matah-s', 46, 66, 10.5).map(([x, y, r], i) => xidShallotRing(p, x, y, 14 + (i % 3) * 2, r)),
        ...xidSpots('matah-l', 10, 60, 18).map(([x, y, r]) => xidSereh(p, x, y, 11, r)),
        ...xidSpots('matah-c', 18, 62, 13).map(([x, y, r]) => xidChiliC(p, x, y, 8, r)),
        xidShreds(p, 100, 100, 118, { c: '#2f6e24', n: 26, w: 1.4, len: .14, seed: 5, curve: .2 }),
        xidOil(p, 100, 100, 130, { n: 14, c: '#f6e2a0', op: .45, rmax: 2.6 }),
        idLimeHalf(p, 146, 136, 26),
        xidSoupShine(100, 100, 74, .4),
    ].join(''),

    // サンバル・イジョ: 小鉢に、青唐辛子と青トマトを粗くつぶして油で炒めた緑のサンバル、ちりめんじゃこ
    id_sambalijo: p => [
        K.kobachi(p, { glaze: '#8a6a4a', inside: '#f2ece0' }),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#6a8a24', .2, .3)}"/>`,
        xidGrains(p, 100, 100, 140, { cols: ['#7aa42e', '#5a8020', '#9ac040', '#4a6a1a'], n: 130, size: 2.8, seed: 1 }),
        xidGrains(p, 100, 100, 130, { cols: ['#eef0b0'], n: 34, size: 1, seed: 2 }),
        xidTeri(p, 100, 100, 90, { n: 18, seed: 3, c: '#d0bca0', k: 1.5 }),
        xidOil(p, 100, 100, 136, { n: 14, c: '#c8d060', op: .5, rmax: 2.6 }),
        xidSoupShine(100, 100, 74, .4),
    ].join(''),

    // トゥミス・タウゲ: 白い皿に、さっと炒めたもやし山盛り、揚げ豆腐の角切り、赤唐辛子、ねぎ
    id_tumistauge: p => [
        K.plate(p, { rim: '#d98a3a' }),
        K.pool(p, 100, 102, 130, '#e8d8a8', { op: .45, seed: 1 }),
        xidSprouts(p, 100, 100, 150, { n: 95, seed: 1 }),
        `<g ${p.sh(.6)}>`,
        ...[[80, 84, 10], [122, 78, -20], [130, 120, 30], [84, 124, -10], [104, 102, 40], [60, 104, 20], [142, 98, 0]].map(([x, y, r]) => xidFriedTofu(p, x, y, 17, r)),
        `</g>`,
        xidSprouts(p, 100, 100, 110, { n: 22, seed: 2 }),
        ...[[96, 80, 30], [116, 106, -20], [72, 110, 60], [110, 136, 10], [136, 88, 80], [88, 140, 40]].map(([x, y, r]) => xidChiliSlice(p, x, y, 7, r)),
        ...[[90, 98, 30], [126, 132, -40], [116, 64, 70], [64, 82, 10]].map(([x, y, r]) => xidScallion(p, x, y, 22, r)),
    ].join(''),

    // トゥミス・ブンチス: 楕円皿に、斜め切りのいんげん、にんじんの細切り、えび、少しのとろみ
    id_tumisbuncis: p => [
        K.ovalDish(p, { rim: '#2f6aa8' }),
        K.pool(p, 100, 102, 140, '#d8b880', { op: .5, seed: 2, sy: .64 }),
        `<g ${p.sh(.6)}>`,
        ...xidSpots('buncis', 34, 64, 11).map(([x, y, r]) => xidBuncis(p, x, (y - 100) * .74 + 100, 22, r)),
        `</g>`,
        xidSticks(p, 100, 100, 130, { c: '#ef7f30', n: 26, L: 18, w: 3, seed: 1, sy: .66 }),
        K.shrimp(p, 82, 92, 28, 20), K.shrimp(p, 120, 110, 28, -60), K.shrimp(p, 104, 82, 24, 120), K.shrimp(p, 64, 112, 24, -20), K.shrimp(p, 140, 88, 24, 60),
        xidFriedShallot(p, 100, 100, 110, 16, 2),
        glossX(p, 100, 100, 110),
    ].join(''),

    // トゥミス・ラブ・シアム: 白い皿に、ハヤトウリとにんじんの細切りの炒めもの、赤唐辛子、サラムの葉
    id_tumislabusiam: p => [
        K.plate(p, { rim: '#2f8a5a' }),
        K.pool(p, 100, 102, 128, '#e4d6a8', { op: .5, seed: 3 }),
        xidSticks(p, 100, 100, 124, { c: '#cfe2a0', n: 70, L: 22, w: 4.2, seed: 1 }),
        xidSticks(p, 100, 100, 114, { c: '#ef7f30', n: 22, L: 20, w: 3, seed: 2 }),
        xidSticks(p, 100, 100, 100, { c: '#d8eab0', n: 20, L: 20, w: 4.2, seed: 3 }),
        ...[[96, 80, 30], [116, 106, -20], [72, 110, 60], [110, 136, 10], [136, 88, 80], [84, 92, 40]].map(([x, y, r]) => xidChiliSlice(p, x, y, 7, r)),
        xidLeaf(p, 116, 78, 24, -30, { c: '#5a6a2a', narrow: .55 }),
        xidFriedShallot(p, 100, 100, 100, 16, 2),
    ].join(''),

    // トゥミス・パレ・テルル: 花柄の皿に、薄切りのゴーヤと炒り卵、赤唐辛子
    id_tumispare: p => [
        idPlateX(p, '#2f8a5a'),
        K.pool(p, 100, 102, 130, '#e8d8a0', { op: .4, seed: 1 }),
        ...xidSpots('pare', 16, 60, 21).map(([x, y, r], i) => xidPare(p, x, y, 28 + (i % 3) * 2, r, { seed: i, c: i % 3 ? '#62a83e' : '#4e9632' })),
        `<g ${p.sh(.6)}>`,
        ...[[84, 88, 46, 20], [126, 116, 46, -30], [86, 132, 36, 10]].map(([x, y, L, r], i) => xidEggCloud(p, x, y, L, r, { seed: i + 1, c: '#f6cc40' })),
        `</g>`,
        ...xidSpots('pare2', 5, 56, 26).map(([x, y, r], i) => xidPare(p, x, y, 26, r, { seed: i + 40 })),
        xidEggCloud(p, 108, 92, 34, 40, { seed: 8, c: '#f6cc40' }),
        ...[[96, 104, 30], [116, 92, -20], [72, 112, 60], [110, 138, 10], [140, 104, 80], [88, 68, 40]].map(([x, y, r]) => xidChiliSlice(p, x, y, 7, r)),
    ].join(''),

    // スルンデン: 小鉢に、香辛料と椰子砂糖でからいりした、こげ茶のココナッツのそぼろと落花生
    id_serundeng: p => [
        K.kobachi(p, { glaze: '#4a7a8a', inside: '#f2ece0' }),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#a8682a', .2, .3)}"/>`,
        xidShreds(p, 100, 100, 144, { c: '#b8762e', n: 140, w: 1.8, len: .06, seed: 1, curve: .6, outline: false }),
        xidShreds(p, 100, 100, 140, { c: '#8a5220', n: 90, w: 1.8, len: .06, seed: 2, curve: .6, outline: false }),
        xidShreds(p, 100, 100, 136, { c: '#d8a050', n: 70, w: 1.6, len: .05, seed: 3, curve: .6, outline: false }),
        `<g ${p.sh(.5)}>`,
        ...xidSpots('serund', 16, 60, 15).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="6" ry="4.4" fill="${p.g('#d8a066', .3, .3)}" stroke="#8a5a2a" stroke-width=".5"/><path d="M-4,0 Q0,-1 4,0" stroke="#b07a40" stroke-width=".6" fill="none"/></g>`),
        `</g>`,
        xidLimeLeaf(p, 80, 120, 20, 30), xidLeaf(p, 124, 80, 20, -20, { c: '#5a5a2a', narrow: .55 }),
    ].join(''),
});
// 石のすり鉢（cobek）
function idCobekX(p){ return xidCobek(p); }
// ライムの半割り（切り口を上に）
function idLimeHalf(p, x, y, s){ return K.sudachi(p, x, y, s).replace(/#4f8f2f/g, '#5a9a2e').replace(/#e9efb0/g, '#dfe88a'); }

// 縦に割って揚げた長なす（皮の紫を縁に、果肉を上に）
function xidTerongLong(p, x, y, L, w, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${-L / 2}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g('#4d2a5c', .3, .2)}" stroke="#2b1433" stroke-width=".6"/></g>
        <rect x="${-L / 2 + 2.4}" y="${-w / 2 + 2.4}" width="${L - 4.8}" height="${w - 5.6}" rx="${w / 2 - 2.4}" fill="${p.g('#c8a060', .25, .3)}"/>
        <path d="M${f(-L / 2 + 6)},${f(-w * .1)} L${f(L / 2 - 6)},${f(-w * .1)} M${f(-L / 2 + 8)},${f(w * .12)} L${f(L / 2 - 8)},${f(w * .12)}" stroke="#9a7038" stroke-width=".8" stroke-dasharray="2 3" opacity=".7"/></g>`;
}
// テンペ・メンドアン（薄い衣の、しんなり揚げたテンペ: 淡い黄色、ねぎが透ける）
function xidMendoan(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidMd' + seed + x + y);
    const pts = ring(w / 2, 14, .14, R, 1, h / w);
    let beans = '';
    for (let i = 0; i < 16; i++){ const bx = (R() - .5) * w * .75, by = (R() - .5) * h * .7; beans += `M${f1(bx - 2)},${f1(by)}a2,1.5 0 1 0 4,0a2,1.5 0 1 0 -4,0`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><g ${p.rough(3, .1)}><path d="${xidSm(pts, true)}" fill="${p.g('#e8c868', .3, .3)}" stroke="#b8902e" stroke-width=".7"/></g></g>
        <path d="${beans}" fill="#c8a058" opacity=".55"/>
        ${Array.from({ length: 10 }, () => `<rect x="${f1((R() - .5) * w * .8 - 2.4)}" y="${f1((R() - .5) * h * .7 - 1)}" width="4.8" height="2" rx="1" fill="#5a9a34" opacity=".85"/>`).join('')}
        ${Array.from({ length: 5 }, () => `<ellipse cx="${f1((R() - .5) * w * .7)}" cy="${f1((R() - .5) * h * .6)}" rx="${f1(3 + R() * 4)}" ry="${f1(2 + R() * 2)}" fill="#c89838" opacity=".35"/>`).join('')}
        ${xidShine(`M${f(-w * .32)},${f(-h * .2)} Q${f(-w * .1)},${f(-h * .4)} ${f(w * .2)},${f(-h * .34)}`, 1.6, .5)}</g>`;
}
// バクワン（野菜のかき揚げ: きつね色、縁がレース状、にんじんとキャベツが飛び出す）
function xidBakwan(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidBw' + seed + x + y);
    const pts = ring(s / 2, 14, .32, R, 1.1, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.rough(3.2, .16)}><path d="${xidSm(pts, true)}" fill="${p.g('#c8862e', .3, .35)}" stroke="#8a5216" stroke-width=".8"/></g></g>
        <g ${p.crumb(.7)}><path d="${xidSm(pts.map(([a, b]) => [a * .8, b * .8]), true)}" fill="#d89a3c"/></g>
        ${xidSticks(p, 0, 0, s * .8, { c: '#e8762a', n: 9, L: s * .26, w: 2.2, seed })}
        ${xidSticks(p, 0, 0, s * .8, { c: '#d8e8a8', n: 7, L: s * .28, w: 2.4, seed: seed + 3 })}
        <path d="${xidSm(pts.map(([a, b]) => [a * .6, b * .6]), true)}" fill="#c88a30" opacity=".25"/>
        ${xidShine(`M${f(-s * .3)},${f(-s * .12)} Q${f(-s * .14)},${f(-s * .32)} ${f(s * .1)},${f(-s * .3)}`, 1.8, .55)}</g>`;
}
// ルンペイェック（落花生入りの薄いレースせんべい）
function xidPeyek(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xidPy' + seed + x + y);
    const pts = ring(s / 2, 16, .3, R, 1.15, .9);
    let holes = '', nuts = '';
    for (let i = 0; i < 9; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .4; holes += `M${f1(Math.cos(a) * d * 1.1 - 2)},${f1(Math.sin(a) * d * .85)}a2,1.6 0 1 0 4,0a2,1.6 0 1 0 -4,0`; }
    for (let i = 0; i < 7; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; nuts += xidRawPeanut(p, Math.cos(a) * d * 1.1, Math.sin(a) * d * .85, 9 + R() * 2, R() * 180); }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${xidSm(pts, true)}${holes}" fill-rule="evenodd" fill="${p.g('#eccc7a', .3, .3)}" stroke="#b88a3a" stroke-width=".6"/></g>
        <path d="${xidSm(pts.map(([a, b]) => [a * .94, b * .94]), true)}" fill="none" stroke="#c8902e" stroke-width="2.4" opacity=".4"/>
        ${nuts}${Array.from({ length: 6 }, () => `<rect x="${f1((R() - .5) * s * .7)}" y="${f1((R() - .5) * s * .5)}" width="4" height="1.2" fill="#3f6e24" transform="rotate(${f1(R() * 180)})"/>`).join('')}</g>`;
}

Object.assign(XD, {
    // トゥロン・バラド: 花柄の皿に、縦に割って揚げた長なす、上に粗い赤唐辛子のバラド
    id_terongbalado: p => [
        idPlateX(p, '#2f6aa8'),
        xidTerongLong(p, 100, 66, 118, 26, -8), xidTerongLong(p, 96, 92, 128, 28, 4), xidTerongLong(p, 104, 118, 126, 28, -4), xidTerongLong(p, 98, 142, 104, 24, 6),
        ...[[96, 70, 56, 1, .4], [106, 94, 76, 2, .38], [94, 120, 72, 3, .4], [104, 142, 48, 4, .5]].map(([x, y, w, sd, sy]) => K.pool(p, x, y, w, '#c8301c', { op: .95, seed: sd, sy }) + xidGrains(p, x, y, w * .9, { cols: ['#e8402a', '#a81c12', '#f06040'], n: Math.round(w * .45), size: 2.3, seed: sd, sy }) + xidGrains(p, x, y, w * .8, { cols: ['#f6dc8a'], n: Math.round(w * .12), size: .9, seed: sd + 9, sy })),
        xidLimeLeaf(p, 148, 76, 20, 30),
    ].join(''),

    // テンペ・メンドアン: 白い皿に、ねぎ入りの薄い衣でしんなり揚げた大きなテンペ、唐辛子入りの甘いしょうゆだれ
    id_mendoan: p => [
        K.plate(p, { rim: '#8a5a2a' }),
        xidMendoan(p, 80, 82, 82, 56, -20, { seed: 1 }), xidMendoan(p, 124, 96, 80, 54, 20, { seed: 2 }), xidMendoan(p, 92, 128, 84, 54, 5, { seed: 3 }),
        `<g ${p.sh(1)}><circle cx="148" cy="142" r="20" fill="${p.rg('#fbfaf6', .2, .15)}" stroke="#d8d0c0" stroke-width=".8"/></g>`,
        K.pool(p, 148, 142, 30, '#3a1a0c', { op: .95, seed: 2, sy: .9 }),
        xidChiliC(p, 144, 140, 6, 20), xidChiliC(p, 152, 146, 6, -30, '#4f9a2e'), xidChiliC(p, 150, 136, 5, 60),
        xidRawit(p, 46, 110, 24, 80, { c: '#4f9a2e' }), xidRawit(p, 54, 124, 22, 60, { c: '#4f9a2e' }),
    ].join(''),

    // バクワン・サユール: 白い皿に、キャベツ・にんじん・もやし入りのかき揚げ、青い唐辛子
    id_bakwan: p => [
        K.plate(p, { rim: '#2f8a5a' }),
        xidBakwan(p, 76, 80, 58, -20, { seed: 1 }), xidBakwan(p, 124, 76, 56, 30, { seed: 2 }), xidBakwan(p, 128, 122, 58, 80, { seed: 3 }), xidBakwan(p, 80, 126, 56, 140, { seed: 4 }),
        xidRawit(p, 104, 100, 30, 30, { c: '#4f9a2e' }), xidRawit(p, 100, 152, 26, -10, { c: '#4f9a2e' }), xidRawit(p, 158, 100, 24, 100, { c: '#4f9a2e' }),
    ].join(''),

    // サンバル・ゴレン・ケンタン・クリン: 小鉢に、細切りのじゃがいもをかりかりに揚げ、甘辛い赤唐辛子のあめでからめ、落花生、こぶみかんの葉
    id_kentangkering: p => [
        K.kobachi(p, { glaze: '#d8b04a', inside: '#f6f0e2' }),
        `<circle cx="100" cy="100" r="72" fill="${p.rg('#c8541e', .2, .3)}" opacity=".85"/>`,
        xidSticks(p, 100, 100, 136, { c: '#b8461a', n: 60, L: 20, w: 2.8, seed: 1 }),
        xidSticks(p, 100, 100, 130, { c: '#d06428', n: 50, L: 20, w: 2.8, seed: 2 }),
        xidSticks(p, 100, 100, 120, { c: '#8a3012', n: 26, L: 18, w: 2.6, seed: 3 }),
        `<g ${p.sh(.5)}>`,
        ...xidSpots('kentang', 16, 58, 15).map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="5.6" ry="4.2" fill="${p.g('#d89a5a', .3, .3)}" stroke="#8a5a2a" stroke-width=".5"/><path d="M-3.6,0 Q0,-1 3.6,0" stroke="#b07a40" stroke-width=".6" fill="none"/></g>`),
        `</g>`,
        xidChiliC(p, 92, 84, 7, 20, '#b8281a'), xidChiliC(p, 118, 112, 7, -20, '#b8281a'), xidChiliC(p, 78, 120, 7, 60, '#b8281a'),
        xidLimeLeaf(p, 120, 76, 22, -30), xidLimeLeaf(p, 72, 96, 18, 60),
        xidShine('M54,82 Q62,62 82,54', 2, .4),
    ].join(''),

    // ルンペイェック: 白い皿に、落花生を散らした薄いレースのような揚げせんべい
    id_rempeyek: p => [
        K.plate(p, { rim: '#d98a3a' }),
        xidPeyek(p, 76, 78, 66, -20, { seed: 1 }), xidPeyek(p, 126, 80, 64, 30, { seed: 2 }), xidPeyek(p, 124, 126, 66, 80, { seed: 3 }), xidPeyek(p, 76, 124, 64, 140, { seed: 4 }), xidPeyek(p, 102, 102, 54, 200, { seed: 5 }),
    ].join(''),

    // ペペス・タフ: 開いたバナナの葉の包みに、卵とつぶした豆腐の蒸しもの、レモンバジル、唐辛子、サラムの葉
    id_pepestahu: p => [
        K.plate(p, { rim: '#2f8a5a' }),
        xidParcel(p, 100, 100, 172, 128, 15, { seed: 2 }),
        `<g ${p.sh(.8)}><g ${p.rough(3, .12)}><path d="${xidSm(ring(52, 12, .14, rng('ptahu'), 1.2, .78).map(([a, b]) => [a + 100, b + 100]), true)}" fill="${p.rg('#f2e2b0', .25, .2)}" stroke="#c8b078" stroke-width=".7"/></g></g>`,
        xidGrains(p, 100, 100, 110, { cols: ['#f8f0d8', '#e8d098', '#d8c080'], n: 70, size: 2.4, seed: 1, sy: .66 }),
        ...[[78, 90, -20], [104, 84, 40], [124, 100, -60], [92, 112, 20], [116, 118, 80], [70, 108, 60]].map(([x, y, r]) => xidLeaf(p, x, y, 18, r, { c: '#2f7a2a', narrow: .65 })),
        ...[[90, 96, 30], [118, 90, -20], [104, 122, 60], [134, 112, 0], [76, 122, 40]].map(([x, y, r]) => xidChiliC(p, x, y, 7, r)),
        xidLeaf(p, 102, 70, 26, -10, { c: '#5a6a2a', narrow: .55 }),
    ].join(''),

    // グドゥッグ: 素焼きの皿に、椰子砂糖とチークの葉で赤茶に煮た若いジャックフルーツ、茶色く煮た卵、白いココナッツクリーム（アレ）
    id_gudeg: p => [
        xidClay(p, { c: '#b8683a', inside: '#8a4a28', lip: .86 }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#7a3418', .2, .3)}"/>`,
        `<g ${p.sh(.8)}>`,
        ...xidSpots('gudeg', 14, 58, 21).map(([x, y, r], i) => xidNangka(p, x, y, 30 + (i % 3) * 4, r, { c: i % 2 ? '#9a4a26' : '#a85430', seed: i + 1 })),
        `</g>`,
        xidEgg(p, 124, 118, 40, -20, { c: '#8a5a32' }), xidEgg(p, 80, 82, 38, 30, { c: '#7e5230' }),
        `<g ${p.sh(.6)}><path d="M64,110 C74,98 92,102 104,100 C118,96 128,90 142,96 C152,100 150,112 138,114 C124,118 112,114 100,120 C86,126 70,124 64,110Z" fill="${p.rg('#f4ead2', .3, .12, .36, .32)}" stroke="#d8c8a0" stroke-width=".6"/><path d="M96,72 C104,62 122,60 134,68 C140,74 130,80 118,78 C108,78 98,80 96,72Z" fill="${p.rg('#f4ead2', .3, .12, .36, .32)}" stroke="#d8c8a0" stroke-width=".6"/></g>`,
        xidShine('M80,108 Q92,102 104,104', 1.4, .6),
        xidRawit(p, 60, 132, 24, 30, { c: '#c8301c' }), xidRawit(p, 146, 76, 22, -40, { c: '#c8301c' }),
    ].join(''),

    // グライ・ダウン・シンコン: 鉢に、黄色いココナッツカレーの汁で煮たキャッサバの葉、ちりめんじゃこ、赤唐辛子
    id_gulaidaunsingkong: p => [
        xidBowl(p, { line: '#d98a3a', c: '#2f8a5a' }),
        xidBroth(p, '#e2a43a', { op: 1, cream: .25, glow: .3 }),
        xidOil(p, 100, 100, 144, { n: 14, c: '#e8702a', op: .55, rmax: 2.4, seed: 2 }),
        `<g ${p.sh(.7)}><path d="${xidSm(ring(60, 12, .2, rng('singk'), 1, .95).map(([a, b]) => [a + 100, b + 100]), true)}" fill="${p.rg('#2e5222', .2, .3)}"/></g>`,
        xidShreds(p, 100, 100, 124, { c: '#3a6a2a', n: 70, w: 3, len: .14, seed: 3, outline: false }),
        `<g ${p.sh(.5)}>`,
        ...xidSpots('singk', 22, 60, 14).map(([x, y, r], i) => xidLeaf(p, x, y, 22, r, { c: i % 3 ? '#2f5a22' : '#3e6e2a', narrow: .6 })),
        `</g>`,
        K.pool(p, 100, 104, 70, '#e2a43a', { op: .45, seed: 4 }),
        xidTeri(p, 100, 100, 110, { n: 18, seed: 2, k: 1.4 }),
        ...[[96, 80, 30], [116, 116, -20], [72, 110, 60], [130, 84, 80]].map(([x, y, r]) => xidChiliSlice(p, x, y, 8, r)),
        idSoupShineX(.35),
    ].join(''),

    // オラック・アリック: 花柄の皿に、溶き卵をくずしながら炒めた、キャベツとにんじんの細切り、ねぎ
    id_orakarik: p => [
        idPlateX(p, '#d98a3a'),
        `<g ${p.sh(.6)}><path d="${xidSm(ring(62, 12, .15, rng('orak'), 1, .95).map(([a, b]) => [a + 100, b + 102]), true)}" fill="${p.rg('#ecdcaa', .2, .15)}"/></g>`,
        xidShreds(p, 100, 102, 120, { c: '#d8e8a8', n: 60, w: 2.6, len: .24, seed: 1 }),
        xidShreds(p, 100, 102, 116, { c: '#f2f4e2', n: 30, w: 2.6, len: .24, seed: 2 }),
        ...xidSpots('orak', 7, 52, 28).map(([x, y, r], i) => xidEggCloud(p, x, y, 30 + (i % 3) * 4, r, { seed: i + 1, c: '#f6cc40' })),
        xidShreds(p, 100, 102, 110, { c: '#ef7f30', n: 26, w: 2.2, len: .2, seed: 3 }),
        K.scallions(p, 100, 102, 110, { n: 20, c: '#4f9a34' }),
        xidPepper(p, 100, 102, 100, 14),
    ].join(''),

    // トゥミス・ジャムール・ティラム: 楕円皿に、手で裂いたひらたけをオイスターソースで炒め、赤唐辛子とねぎ
    id_tumisjamur: p => [
        K.ovalDish(p, { rim: '#8a5a2a' }),
        K.pool(p, 100, 102, 146, '#8a5a2e', { op: .55, seed: 2, sy: .64 }),
        `<g ${p.sh(.6)}>`,
        ...xidSpots('jamur', 26, 64, 13).map(([x, y, r], i) => xidOyster(p, x, (y - 100) * .72 + 100, 34 + (i % 3) * 4, r, { c: i % 2 ? '#c2b498' : '#b0a084', seed: i })),
        ...[[84, 92, -30], [124, 110, 150], [110, 78, 60]].map(([x, y, r]) => `<g ${T(x, y, r, 1.5)}><path d="M0,10 L-3,4 Q-13,2 -12,-5 Q-8,-12 0,-11 Q8,-12 12,-5 Q13,2 3,4Z" fill="${p.g('#c4ae8c', .3, .25)}" stroke="#8a7656" stroke-width=".5"/><path d="M0,6 L-9,-5 M0,6 L-5,-9 M0,6 L0,-10 M0,6 L5,-9 M0,6 L9,-5" stroke="#9a8666" stroke-width=".5" opacity=".7"/></g>`),
        `</g>`,
        K.glaze(p, 100, 100, 110, '#7a4a20', { seed: 3, op: .25 }),
        ...[[92, 86, 30], [118, 108, -20], [72, 106, 60], [134, 92, 10], [104, 120, 80]].map(([x, y, r]) => xidChiliSlice(p, x, y, 7, r)),
        ...[[100, 96, 30], [126, 120, -40], [70, 92, 70], [140, 84, 10]].map(([x, y, r]) => xidScallion(p, x, y, 22, r)),
        glossX(p, 100, 100, 110),
    ].join(''),
});
