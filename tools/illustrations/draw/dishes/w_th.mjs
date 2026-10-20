// タイの家庭料理（อาหารบ้าน）: 世界版パック th
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// 共通の部品（th〜）: w_vn / w_cn / w_kr から写して手直ししたもの
// =========================================================
function thSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const thShine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
const thSoupShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function thOutline(p, c, r = .55){
    const id = p.def('thOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// ご飯の山（米粒を2層）
function thRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'thRice' + seed + x + y);
    const shape = thSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('thRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    const base = `<path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/>`;
    return `<g ${T(x, y)}><defs>${defs}</defs>${shadow ? `<g ${p.sh(.8 * shadow)}>${base}</g>` : base}${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// 小さな粒（ひき肉・ピーナッツ・揚げにんにく）。同じ色は1本のpath
function thGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, w = null, h = null } = {}){
    const R = rng(p.id + 'thGr' + seed + x + y);
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
// 細切り（色ごとに1本）
function thShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'thSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? thOutline(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// 汁に浮いた油の粒
function thOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'thoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 具を散らす位置
function thSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('thspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360), R()]);
    }
    return out;
}
// 黒こしょう・白こしょう
const thPepper = (p, x, y, s, n = 24, c = '#3a2a1c') => K.sprinkle(p, x, y, s, { c, n, r: .7 });

// =========================================================
// タイの器: 白地に緑と赤の帯（ランパーンの鶏の碗の色）
// =========================================================
const TH_GREEN = '#2f8a4e', TH_RED = '#c9392a';
// 赤い牡丹と緑の葉（鶏の碗の花）
function thFlower(p, x, y, k = 1, r = 0){
    return `<g ${T(x, y, r, k)}><path d="M-9,-2 Q-6,-7 -1,-4 M9,0 Q7,-6 2,-4" stroke="${TH_GREEN}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>
        <circle cx="-2.2" cy=".2" r="2.6" fill="${TH_RED}"/><circle cx="1.6" cy="-1.4" r="2.4" fill="${TH_RED}"/><circle cx="1.2" cy="2.4" r="2.2" fill="${TH_RED}"/><circle cx="-1.2" cy="-2.6" r="1.6" fill="#e8705a"/></g>`;
}
// 平皿: 白い磁器、縁に緑の帯と細い赤の線
function thPlate(p, { R = 94, well = .73, flower = true } = {}){
    const w = R * well, base = '#fcfbf7';
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .1, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${TH_GREEN}" stroke-width="2.4" opacity=".9"/>
        <circle cx="100" cy="100" r="${f1(w + 4.5)}" fill="none" stroke="${TH_RED}" stroke-width="1" opacity=".75"/>
        ${flower ? thFlower(p, 100 + (R + w) / 2 * .707 - 1, 100 - (R + w) / 2 * .707 + 1, .55, 20) : ''}
        <circle cx="100" cy="100" r="${f1(w + 1.5)}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".4"/>
        <circle cx="100" cy="100" r="${f1(w)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .2)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 汁物の碗: 白、縁に緑の帯と赤の線、内側に赤い花
function thBowl(p, { R = 92, inside = '#fbfaf5' } = {}){
    const r = R * .87;
    let fl = '';
    for (let i = 0; i < 3; i++){ const a = -1.2 + i * 2.094, rm = (R - 3 + r) / 2; fl += thFlower(p, 100 + Math.cos(a) * rm, 100 + Math.sin(a) * rm, .5, a * 57.3 + 90); }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#f9f8f3', .25, .2, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.4}" fill="none" stroke="${TH_GREEN}" stroke-width="2.6"/>
        <circle cx="100" cy="100" r="${f1(r + 1.6)}" fill="none" stroke="${TH_RED}" stroke-width="1" opacity=".8"/>
        ${fl}
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .22, .64, .66)}"/>
        <path d="M${f1(100 - R * .7)},${f1(100 - R * .42)} A${f1(R * .82)},${f1(R * .82)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .78)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 小鉢（ナムプリック・蒸し卵用）: 白、緑の線
function thSmallBowl(p, { R = 92, inside = '#fbfaf5' } = {}){
    const r = R * .84;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#f9f8f3', .25, .2, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${TH_GREEN}" stroke-width="3"/>
        <circle cx="100" cy="100" r="${f1(r + 1.4)}" fill="none" stroke="${TH_RED}" stroke-width=".9" opacity=".8"/>
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .22, .64, .66)}"/>
        <path d="M${f1(100 - R * .7)},${f1(100 - R * .42)} A${f1(R * .82)},${f1(R * .82)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .78)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 皿の上の小さなたれ用の鉢
function thSaucer(p, x, y, R, liq, { op = .95 } = {}){
    return `<g ${p.sh(1.2)}><circle cx="${x}" cy="${y}" r="${R}" fill="${p.rg('#f8f6f0', .2, .15, .38, .32)}"/></g>
        <circle cx="${x}" cy="${y}" r="${f1(R - 1.6)}" fill="none" stroke="${TH_GREEN}" stroke-width="1.6"/>
        <circle cx="${x}" cy="${y}" r="${f1(R * .78)}" fill="${p.rg(liq, .2, .25, .42, .4)}" opacity="${op}"/>`;
}

// =========================================================
// タイの料理の部品
// =========================================================
// 唐辛子の輪切り（赤）
function thChiliRing(p, x, y, s, r = 0, { c = '#d42a1c' } = {}){
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="${c}" stroke="${dk(c, .4)}" stroke-width=".5"/><circle r="${f(s * .3)}" fill="${lt(c, .35)}"/><circle cx="${f(s * .08)}" cy="${f(-s * .05)}" r="${f(s * .08)}" fill="#f6dfa0"/><circle cx="${f(-s * .1)}" cy="${f(s * .06)}" r="${f(s * .07)}" fill="#f6dfa0"/></g>`;
}
// 唐辛子まるごと（プリッキーヌ: 小さく細い、へたつき）
function thChiliWhole(p, x, y, L, r = 0, { c = '#d8321f' } = {}){
    const w = L * .22;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-L / 2)},0 Q${f(-L / 2)},${f(-w / 2)} ${f(-L / 2 + w * .8)},${f(-w / 2)} L${f(L * .3)},${f(-w * .4)} Q${f(L / 2)},${f(-w * .2)} ${f(L / 2 + 1)},0 Q${f(L / 2)},${f(w * .2)} ${f(L * .3)},${f(w * .4)} L${f(-L / 2 + w * .8)},${f(w / 2)} Q${f(-L / 2)},${f(w / 2)} ${f(-L / 2)},0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/></g>
        <path d="M${f(-L / 2)},0 L${f(-L / 2 - L * .22)},${f(-w * .25)}" stroke="#4f8a2b" stroke-width="${f(w * .5)}" stroke-linecap="round"/>
        ${thShine(`M${f(-L * .3)},${f(-w * .18)} L${f(L * .15)},${f(-w * .1)}`, w * .25, .7)}</g>`;
}
// 長い赤唐辛子の斜め切り
function thChiliSlice(p, x, y, L, r = 0, { c = '#d8321f' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(L / 2)}" ry="${f(L * .22)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .4)}" stroke-width=".5"/><ellipse rx="${f(L * .32)}" ry="${f(L * .11)}" fill="${lt(c, .35)}"/><circle cx="${f(L * .1)}" cy="0" r=".8" fill="#f6dfa0"/><circle cx="${f(-L * .15)}" cy=".4" r=".7" fill="#f6dfa0"/></g>`;
}
// ハーブの葉（ガパオ・ホーラパー）: 先のとがった楕円、葉脈
function thLeaf(p, x, y, s, r = 0, { c = '#2f7a2a', narrow = 1, wilted = false, purple = false } = {}){
    const col = wilted ? mix(c, '#4a5a20', .35) : c;
    return `<g ${T(x, y, r)}><g transform="scale(${f(s / 20)} ${f(s / 20 * narrow)})"><g ${p.sh(.5)}><path d="M-10,0 Q-5,-7.5 4,-5.5 Q9,-3.5 10,0 Q9,3.5 4,5.5 Q-5,7.5 -10,0Z" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 9,0 M-4,0 L0,-4.2 M1,0 L4,-3 M-4,0 L0,4.2 M1,0 L4,3" stroke="${purple ? '#8a4a6a' : lt(col, .35)}" stroke-width=".7" fill="none"/>
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/></g></g>`;
}
// こぶみかんの葉（くびれのある二枚葉、濃い緑、つや）
function thLimeLeaf(p, x, y, L, r = 0, { c = '#2a6a2a', torn = false } = {}){
    const k = L / 36;
    const d = torn ? 'M-16,0 Q-13,-7 -4,-6 Q-1,-4 -1,0 Q-1,4 -4,6 Q-13,7 -16,0Z' : 'M-18,0 Q-14,-7 -3,-6 Q0,-3.5 1,-1 Q4,-6 13,-6.5 Q18,-3 18,0 Q18,3 13,6.5 Q4,6 1,1 Q0,3.5 -3,6 Q-14,7 -18,0Z';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${d}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="M-17,0 L17,0" stroke="${lt(c, .4)}" stroke-width=".9" opacity=".8"/>
        ${thShine('M-14,-2.5 Q-9,-5.4 -3,-4.4', 1.4, .55)}${torn ? '' : thShine('M4,-3.5 Q9,-5.4 14,-3.6', 1.2, .45)}</g>`;
}
// パクチー（丸い切れ込みの小さな葉）
function thCoriander(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}>${[[-5, -2, 5.5], [3, -4, 5], [4, 4, 5.2], [-4, 5, 4.6]].map(([a, b, rr], i) => `<path ${T(a, b, i * 50)} d="M-${rr},0 Q-${rr},-${rr} 0,-${rr} Q${rr * .4},-${rr * .7} ${rr * .5},-${rr * .3} Q${rr},-${rr * .4} ${rr},0 Q${rr},${rr} 0,${rr} Q-${rr},${rr} -${rr},0Z" fill="${p.g(i % 2 ? '#3f8f2f' : '#4c9c36', .3, .25)}" stroke="#2c6a20" stroke-width=".5"/>`).join('')}</g>
        <path d="M0,0 L-5,-2 M0,0 L3,-4 M0,0 L4,4 M0,0 L-4,5 M0,0 L2,11" stroke="#8cbf5c" stroke-width=".9" fill="none"/></g>`;
}
// ねぎのぶつ切り（緑の筒）
function thScallionSeg(p, x, y, L, r = 0, { c = '#5aa33a', white = false, w = 4 } = {}){
    const col = white ? '#eef3df' : c;
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g(col, .3, .2)}" stroke="${dk(col, .3)}" stroke-width=".5"/>
        <path d="M${f(-L / 2 + 2)},-.6 L${f(L / 2 - 2)},-.6" stroke="${lt(col, .45)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}
// 小口ねぎ
const thScallions = (p, x, y, s, n = 14, seed = 1) => K.scallions(p, x, y, s, { n, seed, c: '#4f9a2e' });
// 揚げにんにく・ピーナッツ・干しえび
const thFriedGarlic = (p, x, y, s, n = 26, seed = 1) => thGrains(p, x, y, s, { cols: ['#e4ad48', '#c98a2a', '#f2cc72'], n, size: 1.3, seed });
const thPeanuts = (p, x, y, s, n = 18, seed = 1) => thGrains(p, x, y, s, { cols: ['#e2b878', '#c99556', '#f0d4a0'], n, size: 2.3, seed });
function thDriedShrimp(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 10)}><path d="M-5,2 Q-5,-4 0,-4 Q5,-4 5,1 Q3,4 1,2 Q0,0 -1,2 Q-3,4 -5,2Z" fill="${p.g('#e8742e', .3, .25)}" stroke="#a84a16" stroke-width=".5"/><path d="M-3,-1 Q0,-3 3,-1" stroke="#f8c08a" stroke-width=".8" fill="none"/></g>`;
}
// 殻つきのえび（赤橙、節と尾、照り）
function thShrimp(p, x, y, s, r = 0, { c = '#e0592c', seed = 1 } = {}){
    const k = s / 30;
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
// むきえび（ゆでた、ピンクと白の縞）
function thPeeledShrimp(p, x, y, s, r = 0){
    const k = s / 20, c = '#f08a62';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-8,4 C-10,-4 -4,-10 3,-9 C9,-8 11,-2 9,3 C7,7 2,7 1,3 C0,-1 -3,0 -3,4 C-3,7 -6,8 -8,4Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M-5,-5 Q-3,-2 -6,0 M-1,-8 Q0,-4 -3,-2 M4,-8 Q4,-4 1,-2 M8,-4 Q6,-1 3,0" stroke="#fde1d3" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-8,4 L-11,7 L-7,8Z" fill="${dk(c, .1)}"/>${thShine('M-4,-6 Q0,-7.5 4,-6.5', 1.1, .6)}</g>`;
}
// 目玉焼き（カイダーオ: 縁がちりちりに揚がった）
function thFriedEgg(p, x, y, s, r = 0){
    const R = rng(p.id + 'thegg' + x);
    const pts = ring(19, 15, .26, R, 1.08, .96);
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.9)}><g ${p.rough(1.6, .2)}><path d="${thSm(pts, true)}" fill="${p.rg('#fffcf4', .1, .1)}" stroke="#d9a860" stroke-width="1.2"/></g></g>
        <path d="${thSm(pts, true)}" fill="none" stroke="#c98a3a" stroke-width="3" opacity=".45"/>
        <path d="${thSm(pts.map(([a, b]) => [a * .78, b * .78]), true)}" fill="none" stroke="#e8c88a" stroke-width="2" opacity=".5"/>
        <path d="${thSm(pts.map(([a, b]) => [a * .6 + 1.5, b * .6 + 1.2]), true)}" fill="#f7f2e6" opacity=".7"/>
        <circle cx="2" cy="1" r="8.4" fill="${p.rg('#f7a01a', .35, .18, .35, .32)}" stroke="#d07d10" stroke-width=".8"/>
        <ellipse cx="-.8" cy="-2.2" rx="3.2" ry="1.9" fill="#fff" opacity=".8"/>
        <path d="M-14,-6 Q-9,-13 -1,-14" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 炒めたひき肉（ガパオ: 濃い茶、照り）
function thMince(p, x, y, s, { n = 110, seed = 1, sy = 1, c = '#7a4a24' } = {}){
    return thGrains(p, x, y, s, { cols: [c, lt(c, .14), dk(c, .14), '#9a6238'], n, size: 2.6, seed, sy })
        + thGrains(p, x - 3, y - 3, s * .8, { cols: [lt(c, .45)], n: Math.round(n * .22), size: 1.1, seed: seed + 7, sy });
}
// 鶏肉のひと口大（カレー・スープの中: 淡い色、繊維）
function thChicken(p, x, y, s, r = 0, { c = '#e9d5b2', seed = 1 } = {}){
    const R = rng(p.id + 'thck' + seed + x + y);
    const k = s / 20;
    const pts = [[-10, -3], [-6, -8], [1, -8.5], [7, -6], [10, -1], [8, 5], [3, 8], [-4, 8], [-9, 4]].map(([a, b]) => [a + (R() - .5) * 4.5, b + (R() - .5) * 4.5]);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .75)}" fill="${p.g(c, .2, .28)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .55 + 1.5, b * .5 + 2]), true, .8)}" fill="${dk(c, .1)}" opacity=".45"/>
        <path d="M${f1(-5 + R() * 2)},${f1(2 + R() * 2)} l${f1(4 + R() * 3)},${f1(-1 + R() * 2)} M${f1(1 + R() * 2)},${f1(4 + R())} l${f1(3 + R() * 2)},${f1(-1)}" stroke="${dk(c, .35)}" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".5"/>
        ${thShine('M-7,-4 Q-3,-7 2,-6.4', 1.6, .75)}</g>`;
}
// 牛肉の薄切り（オイスター炒め: 濃い茶、照り）
function thBeef(p, x, y, s, r = 0, { c = '#6e3a1e', seed = 1 } = {}){
    const R = rng(p.id + 'thbf' + seed + x + y);
    const k = s / 30;
    const pts = ring(13, 13, .3, R, 1.2, .62);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M-9,-1 Q-4,-4 1,-1 T10,-1 M-7,3.5 Q-2,1.5 3,4 T10,3" stroke="${dk(c, .4)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>
        ${thShine('M-8,-4.6 Q-1,-7.2 6,-5', 1.8, .7)}<circle cx="7" cy="-2" r=".8" fill="#fff" opacity=".6"/></g>`;
}
// 豚の薄切り（チャーハンの中）
function thPorkBit(p, x, y, s, r = 0, { c = '#b98458', seed = 1 } = {}){
    const R = rng(p.id + 'thpk' + seed + x + y);
    const k = s / 20;
    const pts = ring(10, 7, .55, R, 1.2, .85);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .45)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <ellipse cx="${f1((R() - .5) * 6)}" cy="${f1((R() - .5) * 3)}" rx="3" ry="1.4" fill="${dk(c, .3)}" opacity=".35"/>${thShine('M-6,-3.4 Q0,-5.2 5,-3.8', 1.2, .6)}</g>`;
}
// 鶏むねの薄切り（パッシーイウ: 淡い）
const thChickenSlice = (p, x, y, s, r = 0, o = {}) => thChicken(p, x, y, s, r, { c: '#dcb98a', ...o });
// 玉ねぎのくし切り
const thOnion = (p, x, y, s, r = 0) => K.onion(p, x, y, s, r, { c: '#efe0b4' });
// エシャロット（ホームデーン）の薄切り: 紫がかった輪
function thShallot(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><ellipse rx="${f(s / 2)}" ry="${f(s * .36)}" fill="${p.g('#f0dce0', .25, .15)}" stroke="#9a4a6a" stroke-width=".9"/></g><ellipse rx="${f(s * .33)}" ry="${f(s * .22)}" fill="none" stroke="#b86a8a" stroke-width=".8" opacity=".8"/><ellipse rx="${f(s * .15)}" ry="${f(s * .1)}" fill="none" stroke="#b86a8a" stroke-width=".7" opacity=".8"/></g>`;
}
// フクロタケ（丸い茶色のつぼみ、半分に切ると中が白い）
function thStrawMushroom(p, x, y, s, r = 0, { half = false, seed = 1 } = {}){
    const c = '#8a6a48';
    if (!half) return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${f(s / 2)}" ry="${f(s * .42)}" fill="${p.rg(c, .3, .3, .35, .32)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g><ellipse cx="${f(-s * .14)}" cy="${f(-s * .14)}" rx="${f(s * .16)}" ry="${f(s * .08)}" fill="#fff" opacity=".55"/></g>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${f(s / 2)}" ry="${f(s * .42)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <ellipse rx="${f(s / 2 - 1.8)}" ry="${f(s * .42 - 1.6)}" fill="${p.g('#f1e8d6', .2, .15)}"/>
        <ellipse cx="0" cy="${f(-s * .06)}" rx="${f(s * .22)}" ry="${f(s * .17)}" fill="${lt(c, .25)}" opacity=".8"/>
        <ellipse cx="0" cy="${f(s * .14)}" rx="${f(s * .1)}" ry="${f(s * .08)}" fill="${dk(c, .1)}" opacity=".6"/></g>`;
}
// ヒラタケ（扇形、淡いグレー）
function thOysterMushroom(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'thom' + seed + x + y);
    const k = s / 24, c = '#d9cfbd';
    const pts = [[-12, 2], [-9, -5], [-2, -9], [6, -9], [12, -4], [12, 2], [6, 5], [0, 7], [-6, 5]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,1 Q-2,-2 10,-2 M-6,4 Q0,1 10,0 M-3,-6 Q2,-5 9,-4" stroke="${dk(c, .18)}" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M-12,2 Q-8,4 -6,6" stroke="${lt(c, .3)}" stroke-width="2.4" stroke-linecap="round"/>${thShine('M-7,-5 Q-2,-7.4 4,-7', 1.2, .6)}</g>`;
}
// ガランガル（カー）の薄切り: 淡いクリーム色に年輪、縁がうすいピンク
function thGalangal(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .4)}" fill="${p.g('#f2e6c8', .2, .2)}" stroke="#c29a6a" stroke-width=".8"/></g>
        <ellipse rx="${f(s * .34)}" ry="${f(s * .26)}" fill="none" stroke="#d8c096" stroke-width=".8"/><ellipse rx="${f(s * .18)}" ry="${f(s * .13)}" fill="none" stroke="#d8c096" stroke-width=".7"/>
        <ellipse rx="${f(s / 2 - .8)}" ry="${f(s * .4 - .8)}" fill="none" stroke="#e8a89a" stroke-width="1" opacity=".55"/></g>`;
}
// レモングラスのぶつ切り（うす黄緑の筒、節）
function thLemongrass(p, x, y, L, r = 0){
    const w = L * .28;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${f(w)}" rx="${f(w * .3)}" fill="${p.g('#d9d79a', .3, .25)}" stroke="#8a8a46" stroke-width=".6"/></g>
        <path d="M${f(-L * .2)},${f(-w / 2)} L${f(-L * .2)},${f(w / 2)} M${f(L * .15)},${f(-w / 2)} L${f(L * .15)},${f(w / 2)}" stroke="#a8a860" stroke-width=".7" opacity=".7"/>
        <ellipse cx="${f(L / 2)}" cy="0" rx="${f(w * .25)}" ry="${f(w / 2)}" fill="#eeeccc" stroke="#8a8a46" stroke-width=".5"/>
        <path d="M${f(-L * .4)},${f(-w * .2)} L${f(L * .3)},${f(-w * .2)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g>`;
}
// トマトのくし切り（煮た・生）
function thTomato(p, x, y, s, r = 0, { seed = 1, c = '#e2412c' } = {}){
    const R = rng(p.id + 'thtm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="${lt(c, .3)}" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ミニトマト半分（ソムタム）
function thCherryHalf(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="${p.rg('#e5382a', .3, .25, .4, .36)}" stroke="#a8221a" stroke-width=".6"/></g>
        <circle r="${f(s * .34)}" fill="#f47058"/><circle r="${f(s * .14)}" fill="#f9d36b" opacity=".9"/>
        <path d="M${f(-s * .3)},${f(-s * .08)} Q${f(-s * .2)},${f(-s * .3)} ${f(s * .02)},${f(-s * .32)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ライムのくし切り（緑の皮）
function thLime(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,2 A10,9 0 0 1 10,2 Z" fill="#4f9a2f"/></g><path d="M-8.4,2 A8.4,7.4 0 0 1 8.4,2 Z" fill="#e6f0b8"/><path d="M-7.2,2 A7.2,6.4 0 0 1 7.2,2 Z" fill="${p.rg('#d6e89a', .2, .1)}"/>
        ${[-60, -30, 0, 30, 60].map(a => `<path transform="rotate(${a} 0 2)" d="M0,2 L0,-4.4" stroke="#f6fbe0" stroke-width=".9"/>`).join('')}</g>`;
}
// きゅうりの斜め切り
const thCucumber = (p, x, y, s, r = 0) => K.cucumberSlice(p, x, y, s, r, { oval: 1.35 });
// ササゲ（長いんげん）のぶつ切り
function thLongBean(p, x, y, L, r = 0, { c = '#5a9e3a' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><rect x="${f(-L / 2)}" y="-2.1" width="${L}" height="4.2" rx="2" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        <path d="M${f(-L / 2 + 2)},-.7 L${f(L / 2 - 2)},-.7" stroke="${lt(c, .5)}" stroke-width=".8" stroke-linecap="round" opacity=".8"/>
        <circle cx="${f(L / 2 - .5)}" cy="0" r="1.3" fill="${lt(c, .4)}" stroke="${dk(c, .3)}" stroke-width=".4"/></g>`;
}
// タイなす（マクアプロ）の4つ割り: 緑と白のしま、黄色がかった断面
function thThaiEggplant(p, x, y, s, r = 0, { seed = 1 } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-9,6 Q-10,-3 -3,-8 Q4,-10 9,-4 L9,6 Q0,9 -9,6Z" fill="${p.g('#e9dfa8', .25, .22)}" stroke="#8a8a52" stroke-width=".6"/></g>
        <path d="M-9,6 Q-10,-3 -3,-8 Q-6,-1 -5,6Z" fill="${p.g('#9fc26a', .3, .3)}" stroke="#4f7a2a" stroke-width=".5"/>
        <path d="M-7,-2 Q-8,2 -7,5 M-5,-5 Q-6,0 -6,4" stroke="#eef5d8" stroke-width=".9" fill="none" opacity=".8"/>
        <path d="M-2,0 Q3,-2 7,0 M-1,3 Q3,2 7,3" stroke="#c6b878" stroke-width=".6" fill="none" opacity=".7"/>
        ${[[0, -4], [3, -2], [5, 1], [1, 2]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r=".6" fill="#8a7a4a"/>`).join('')}</g>`;
}
// タイなす（丸ごと小さく、緑白）
function thPeaEggplant(p, x, y, s){
    return `<g ${p.sh(.4)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg('#a8c86a', .3, .3, .35, .32)}" stroke="#4f7a2a" stroke-width=".5"/></g>`;
}
// 空心菜（筒状の茎と矢じり形の葉、炒めてつやつや）
function thMorningGlory(p, x, y, s, { n = 30, seed = 1 } = {}){
    const R = rng(p.id + 'thmg' + seed + x + y);
    const stemC = '#86b44a', leafC = '#2f7026';
    let stems = '', leaves = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .85, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .9, ang = R() * 180;
        if (R() < .55){
            const L = 20 + R() * 16;
            stems += `<g ${T(cx, cy, ang)}><rect x="${f(-L / 2)}" y="-2" width="${f(L)}" height="4" rx="2" fill="${p.g(R() < .5 ? stemC : lt(stemC, .12), .3, .2)}" stroke="${dk(stemC, .35)}" stroke-width=".5"/><path d="M${f(-L / 2 + 2)},-.8 L${f(L / 2 - 2)},-.8" stroke="${lt(stemC, .5)}" stroke-width=".8" stroke-linecap="round"/><ellipse cx="${f(L / 2 - 1)}" cy="0" rx="1" ry="1.7" fill="${lt(stemC, .55)}" stroke="${dk(stemC, .3)}" stroke-width=".4"/></g>`;
        } else {
            const k = .85 + R() * .35;
            leaves += `<g ${T(cx, cy, ang, k)}><path d="M-12,0 Q-8,-5.5 2,-5 Q5,-4.6 6,-2.6 Q9,-1.4 12,0 Q9,1.4 6,2.6 Q5,4.6 2,5 Q-8,5.5 -12,0Z" fill="${p.g(R() < .5 ? leafC : lt(leafC, .1), .3, .25)}" stroke="${dk(leafC, .35)}" stroke-width=".5"/><path d="M-11,0 L10,0" stroke="${lt(leafC, .35)}" stroke-width=".7"/><path d="M-7,-2.4 Q-2,-4 3,-3.4" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
        }
    }
    return `<g ${p.sh(.7)}>${leaves}${stems}</g>`;
}
// カナー（カイラン）: 太い茎の斜め切りと濃い緑の葉
function thKanaStem(p, x, y, L, r = 0){
    const w = L * .34;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-L / 2 + w * .5)},${f(-w / 2)} L${f(L / 2)},${f(-w / 2)} L${f(L / 2 - w * .5)},${f(w / 2)} L${f(-L / 2)},${f(w / 2)}Z" fill="${p.g('#a9cf72', .3, .25)}" stroke="#5a8a36" stroke-width=".6" stroke-linejoin="round"/></g>
        <ellipse cx="${f(L / 2 - w * .25)}" cy="0" rx="${f(w * .22)}" ry="${f(w * .46)}" fill="#dcedb8" stroke="#5a8a36" stroke-width=".4"/>
        <path d="M${f(-L * .35)},${f(-w * .18)} L${f(L * .3)},${f(-w * .18)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
function thKanaLeaf(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'thkl' + seed + x + y);
    const k = s / 30, c = '#2e6e2a';
    const pts = ring(13, 11, .3, R, 1.25, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .28, .28)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-14,0 Q0,-1 14,0 M-6,-1 L-2,-7 M2,-1 L6,-6 M-6,1 L-2,6 M2,1 L6,6" stroke="${lt(c, .4)}" stroke-width=".9" fill="none"/>
        ${thShine('M-9,-4.5 Q-3,-8 4,-6.5', 1.2, .5)}</g>`;
}
// 幅広の米麺（センヤイ）: 黒醤油で茶色、つや、焦げ
function thWideNoodles(p, x, y, s, { c = '#a9733a', w = 8.5, n = 16, seed = 1, sy = .9, len = .6, wav = .5 } = {}){
    const R = rng(p.id + 'thWn' + seed + x);
    const ol = thOutline(p, dk(c, .35), .6), rad = s / 2;
    const L = Array.from({ length: 4 }, () => ['', '', '', '']);
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rad * .8;
        let px = Math.cos(a) * d, py = Math.sin(a) * d, dir = R() * 6.28;
        const step = s * len / 5, pts = [];
        for (let j = 0; j < 6; j++){
            const k = Math.hypot(px, py) / (rad - w);
            if (k > 1){ px /= k; py /= k; dir += Math.PI * .6; }
            pts.push([x + px, y + py * sy]);
            dir += (R() - .5) * wav * 2;
            px += Math.cos(dir) * step; py += Math.sin(dir) * step;
        }
        const dd = thSm(pts), l = L[i % 4];
        if (R() < .3) l[1] += dd; else l[0] += dd;
        l[2] += thSm(pts.slice(1, 5).map(([a, b]) => [a - w * .12, b - w * .22]));
        if (R() < .6){ const q = pts[2 + Math.floor(R() * 3)]; l[3] += `M${f1(q[0] - 2)},${f1(q[1])}q2,-1.6 4,0`; }
    }
    return `<g ${p.sh(.9)}>${L.map(([a, b, h, ch]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .16)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g><path d="${h}" stroke="#fff" stroke-width="${f1(w * .18)}" fill="none" stroke-linecap="round" opacity=".55"/><path d="${ch}" stroke="${dk(c, .55)}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`).join('')}</g>`;
}
// 春雨（透き通った細い麺）
function thGlassNoodles(p, x, y, s, { n = 70, seed = 1, sy = .9, c = '#eceae2' } = {}){
    const R = rng(p.id + 'thGn' + seed);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.15 + R() * .82), a0 = R() * 6.28, sweep = 1 + R() * 2.4;
        const cx = x + (R() - .5) * s * .14, cy = y + (R() - .5) * s * .14;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .3); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = thSm(pts);
        d += one; if (R() < .35) dl += one;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.6)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="${dk(c, .3)}" stroke-width="2.6" opacity=".7"/><use href="#${id}" stroke="${c}" stroke-width="1.7" opacity=".92"/></g><path d="${dl}" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 卵豆腐の輪切り（黄色みのある円盤）
function thEggTofu(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${f(s / 2)}" ry="${f(s * .44)}" fill="${p.g('#f3d98a', .25, .2)}" stroke="#c9a85a" stroke-width=".7"/></g>
        <ellipse rx="${f(s / 2 - 1.4)}" ry="${f(s * .44 - 1.4)}" fill="${p.rg('#f8e4a4', .2, .1, .4, .38)}"/>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .14)}" rx="${f(s * .2)}" ry="${f(s * .1)}" fill="#fff" opacity=".6"/></g>`;
}
// 肉団子（淡い豚のつくね）
function thPorkBall(p, x, y, s, { seed = 1 } = {}){
    const c = '#cfae8a';
    return `<g ${p.sh(.7)}><g ${p.rough(1.4, .2)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg(c, .3, .32, .38, .35)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g></g>
        <ellipse cx="${f(x - s * .16)}" cy="${f(y - s * .18)}" rx="${f(s * .16)}" ry="${f(s * .09)}" fill="#fff" opacity=".6" transform="rotate(-30 ${f(x - s * .16)} ${f(y - s * .18)})"/>`;
}
// 白菜のそぎ切り（煮た）
const thNapa = (p, x, y, s, r = 0, seed = 1) => K.leafPiece(p, x, y, s, r, { c: '#cfe0a0', vein: '#f4f7e4', seed, cooked: true });
// 芹菜（キンチャイ）の葉つき茎
function thCelery(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#86b84e" stroke-width="2.2" stroke-linecap="round"/><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#d9efb6" stroke-width=".6" stroke-linecap="round" opacity=".7"/>
        ${[[L / 2, 0], [L * .1, -3], [L * .15, 3]].map(([a, b], i) => `<path ${T(a, b, i * 70 - 20, .55)} d="M0,0 Q-5,-3 -4.6,-7 Q-2.4,-9.6 0,-8 Q2.4,-9.6 4.6,-7 Q5,-3 0,0Z" fill="#4c9a32" stroke="#2c6a1e" stroke-width=".8"/>`).join('')}</g>`;
}
// ベビーコーン（縦半分、黄色のつぶつぶ）
function thBabyCorn(p, x, y, L, r = 0){
    const w = L * .28;
    let dots = '';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) dots += `<circle cx="${f(-L * .36 + i * L * .17)}" cy="${f((j - .5) * w * .4)}" r="${f(w * .12)}" fill="#f6dc7a" opacity=".9"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f(-L / 2)},${f(-w * .35)} Q${f(-L / 2)},${f(-w / 2)} ${f(-L / 2 + w * .5)},${f(-w / 2)} L${f(L * .3)},${f(-w / 2)} Q${f(L / 2)},${f(-w * .3)} ${f(L / 2 + 1)},0 Q${f(L / 2)},${f(w * .3)} ${f(L * .3)},${f(w / 2)} L${f(-L / 2 + w * .5)},${f(w / 2)} Q${f(-L / 2)},${f(w / 2)} ${f(-L / 2)},${f(w * .35)}Z" fill="${p.g('#f3cf5a', .3, .25)}" stroke="#b88e24" stroke-width=".6"/></g>
        ${dots}<path d="M${f(-L * .4)},0 L${f(L * .38)},0" stroke="#e2b63a" stroke-width=".6" opacity=".7"/>
        ${thShine(`M${f(-L * .38)},${f(-w * .25)} L${f(L * .2)},${f(-w * .25)}`, .9, .55)}</g>`;
}
// 花形に切ったにんじん（タイの炒め物の定番）
function thCarrotFlower(p, x, y, s, r = 0){
    const pts = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.28, rr = i % 2 ? s * .4 : s / 2; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .6)}" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b85a18" stroke-width=".6"/></g><circle r="${f(s * .18)}" fill="#f6b070" opacity=".9"/><path d="M${f(-s * .25)},${f(-s * .18)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .08)},${f(-s * .26)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// キャベツのざく切り（炒めた・生）
const thCabbage = (p, x, y, s, r = 0, { seed = 1, cooked = true } = {}) => K.leafPiece(p, x, y, s, r, { c: cooked ? '#cfe3a2' : '#dfeec0', vein: '#f4f8e6', seed, cooked });
// ブロッコリーの小房
const thBroccoli = (p, x, y, s, r = 0) => K.broccoli(p, x, y, s, r, { c: '#4a9a3a' });
// 青パパイヤの千切り（淡い黄緑〜白、長い）
function thPapaya(p, x, y, s, { seed = 1 } = {}){
    return thShreds(p, x, y, s, { c: '#e4edc0', n: 62, w: 2.4, len: .36, seed, curve: .35, sy: .9 })
        + thShreds(p, x, y, s * .92, { c: '#f3f6e4', n: 40, w: 2.2, len: .34, seed: seed + 1, curve: .4, sy: .9 })
        + thShreds(p, x, y, s * .8, { c: '#d2e2a4', n: 22, w: 2.2, len: .3, seed: seed + 2, curve: .35, sy: .9 });
}
// キャベツのくし切り（ソムタムの添え）
function thCabbageWedge(p, x, y, s, r = 0){
    const k = s / 40;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="M-20,-9 L20,-11 Q24,0 20,11 L-20,9 Q-23,0 -20,-9Z" fill="${p.g('#e4f0c6', .25, .2)}" stroke="#9ab86a" stroke-width=".7"/></g>
        <path d="M-19,-4 Q0,-7 19,-6 M-19,2 Q0,0 19,0 M-18,7 Q0,6 18,6" stroke="#f6faea" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M-19,-4 Q0,-7 19,-6 M-19,2 Q0,0 19,0 M-18,7 Q0,6 18,6" stroke="#b6cf86" stroke-width=".6" fill="none" opacity=".7"/>
        <path d="M-20,-9 L20,-11" stroke="#8cc45a" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 揚げたプラートゥー（短いサバ: 頭を折り曲げた、きつね色の皮）
function thPlaTu(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'thpt' + seed + x);
    const h = L * .36;
    const body = thSm([[-L * .42, -h * .2], [-L * .3, -h * .48], [-L * .05, -h * .52], [L * .2, -h * .4], [L * .36, -h * .16], [L * .4, 0], [L * .36, h * .16], [L * .2, h * .4], [-L * .05, h * .52], [-L * .3, h * .48], [-L * .42, h * .2]], true);
    const cid = p.uid();
    let ch = '';
    for (let i = 0; i < 10; i++) ch += `<ellipse cx="${f(-L * .35 + R() * L * .7)}" cy="${f(-h * .4 + R() * h * .8)}" rx="${f(2 + R() * 4)}" ry="${f(1.2 + R() * 2)}" fill="#6a3a12" opacity="${f(.15 + R() * .3)}"/>`;
    const skin = '#d9a650', belly = '#f0d79a';
    return `<g ${T(x, y, r)}>
        <g ${p.sh(1)}><path d="M${f(L * .37)},0 L${f(L * .52)},${f(-h * .5)} Q${f(L * .47)},0 ${f(L * .52)},${f(h * .5)}Z" fill="${p.g('#c8923a', .25, .3)}" stroke="#7a5018" stroke-width=".7"/>
        <path d="${body}" fill="${p.g(skin, .25, .3)}" stroke="#8a5a1a" stroke-width=".8"/></g>
        <defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs>
        <g clip-path="url(#${cid})"><path d="M${f(-L * .45)},${f(h * .08)} Q0,${f(h * .3)} ${f(L * .4)},${f(h * .05)} L${f(L * .4)},${f(h)} L${f(-L * .45)},${f(h)}Z" fill="${p.g(belly, .2, .2)}" opacity=".9"/>
        <path d="M${f(-L * .4)},${f(-h * .2)} Q0,${f(-h * .3)} ${f(L * .36)},${f(-h * .1)}" stroke="#6f7a6a" stroke-width="1.2" fill="none" opacity=".35"/>${ch}</g>
        <path d="M${f(L * .4)},0 L${f(L * .49)},${f(-h * .34)} M${f(L * .4)},0 L${f(L * .49)},${f(h * .34)}" stroke="#7a5018" stroke-width=".7" opacity=".6"/>
        <path d="M${f(-L * .42)},${f(-h * .2)} Q${f(-L * .56)},${f(h * .1)} ${f(-L * .4)},${f(h * .48)} Q${f(-L * .3)},${f(h * .6)} ${f(-L * .24)},${f(h * .5)} Q${f(-L * .34)},${f(h * .2)} ${f(-L * .3)},${f(-h * .3)}Z" fill="${p.g('#c99040', .3, .35)}" stroke="#7a5018" stroke-width=".7"/>
        <circle cx="${f(-L * .4)}" cy="${f(h * .02)}" r="${f(h * .11)}" fill="#f3ead6" stroke="#3a3a3a" stroke-width=".6"/><circle cx="${f(-L * .4)}" cy="${f(h * .02)}" r="${f(h * .05)}" fill="#222"/>
        <path d="M${f(-L * .3)},${f(-h * .3)} Q${f(-L * .2)},${f(-h * .45)} ${f(L * .05)},${f(-h * .4)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M${f(L * .1)},${f(-h * .36)} Q${f(L * .25)},${f(-h * .3)} ${f(L * .32)},${f(-h * .14)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// カイチアオ（ふわふわに揚げた卵焼き: ちりちりの縁、きつね色、ねぎ）
function thKhaiJiao(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'thkj' + seed);
    const c = '#e9a93a', pts = ring(s / 2, 18, .22, R, 1.04, .9);
    let brown = '', bub = '', green = '';
    for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .4; brown += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(4 + R() * 9)}" ry="${f(2.5 + R() * 5)}" transform="rotate(${f(R() * 180)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="#b86a1a" opacity="${f(.15 + R() * .22)}"/>`; }
    for (let i = 0; i < 36; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .44, rr = 1.2 + R() * 2.6; bub += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(rr)}" fill="none" stroke="#fbe6a8" stroke-width="${f(.6 + R() * .6)}" opacity=".8"/>`; }
    for (let i = 0; i < 22; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .42, gx = Math.cos(a) * d, gy = Math.sin(a) * d; green += `<circle cx="${f(gx)}" cy="${f(gy)}" r="1.7" fill="none" stroke="${R() < .5 ? '#3f8f2f' : '#6aae44'}" stroke-width="1.1"/>`; }
    const sh = thSm(pts, true);
    return `<g ${T(x, y)}><g ${p.sh(1.3)}><g ${p.rough(3, .12)}><path d="${sh}" fill="${p.rg(c, .3, .3, .36, .34)}" stroke="#b06c14" stroke-width="1"/></g></g>
        <g ${p.rough(3, .12)}><path d="${sh}" fill="none" stroke="#b8701a" stroke-width="5" opacity=".4"/>
        <path d="${thSm(pts.map(([a, b]) => [a * .8, b * .8]), true)}" fill="none" stroke="#f6c860" stroke-width="3" opacity=".5"/></g>
        ${brown}
        <g ${p.crumb(.6)}><path d="${thSm(pts.map(([a, b]) => [a * .86, b * .86]), true)}" fill="${lt(c, .12)}" opacity=".45"/></g>
        ${bub}${green}
        ${thShine(`M${f(-s * .34)},${f(-s * .14)} Q${f(-s * .22)},${f(-s * .34)} ${f(s * .04)},${f(-s * .38)}`, 3, .55)}</g>`;
}
// 蒸し卵の表面（カイトゥン: なめらかな淡い黄色、少しの穴）
function thSteamedEgg(p, cx, cy, R){
    const RR = rng(p.id + 'thse');
    let holes = '';
    for (let i = 0; i < 9; i++){ const a = RR() * 6.28, d = Math.sqrt(RR()) * R * .8; holes += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(.8 + RR() * 1.2)}" fill="#d9b35a" opacity=".5"/>`; }
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg('#f5d98a', .18, .18, .4, .38)}"/>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#d4b060" stroke-width="1.6" opacity=".6"/>
        ${holes}
        <path d="M${cx - R * .6},${cy - R * .1} A${R * .7},${R * .7} 0 0 1 ${cx - R * .1},${cy - R * .6}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// ナムプリックカピ（くすんだ茶紫の濃いペースト、唐辛子の粒）
function thKapiDip(p, cx, cy, R){
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg('#6b4a3a', .2, .25, .4, .38)}"/>
        ${thGrains(p, cx, cy, R * 1.6, { cols: ['#c8301c', '#e8552e', '#4f8a2a', '#8a6a52'], n: 44, size: 1.4, seed: 3 })}
        ${thGrains(p, cx, cy, R * 1.4, { cols: ['#e8742e', '#f0a060'], n: 10, size: 1.2, seed: 5 })}
        <path d="M${cx - R * .55},${cy - R * .1} A${R * .65},${R * .65} 0 0 1 ${cx - R * .1},${cy - R * .55}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// 卵のかたまり（チャーハンの炒り卵）
function thEggBits(p, x, y, s, { n = 10, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'theb' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 3.5 + R() * 3.5;
        out += `<path ${T(cx, cy)} d="${smooth(ring(rr, 7, .45, R, 1.2, .8), true, .8)}" fill="${p.g(R() < .5 ? '#f8d348' : '#fbe27a', .3, .18)}" stroke="#d2a420" stroke-width=".5"/>`;
    }
    return `<g ${p.sh(.5)}>${out}</g>`;
}

// =========================================================
export default {
    // 白ご飯（ข้าวสวย）: タイでは平皿に盛る。緑と赤の縁の白い皿にジャスミンライスの山
    th_staple: p => [
        thPlate(p),
        thRice(p, 100, 100, 128, { density: 1.3, grain: 4, tint: '#f6f2e6' }),
        `<path d="M56,86 Q66,60 92,52" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // ガパオ炒めのせご飯（ผัดกะเพราหมูสับ）: 皿の左にご飯、右に濃い茶のひき肉とガパオの葉・唐辛子・ささげ、ご飯の上にカイダーオ
    th_kaprao: p => [
        thPlate(p),
        thRice(p, 74, 100, 94, { density: 1.25, grain: 3.8, sy: 1.12, layers: 1 }),
        K.pool(p, 128, 104, 80, '#8a4a18', { op: .75, seed: 2, sy: 1.15 }),
        `<g ${p.sh(.5)}>`,
        thMince(p, 128, 102, 76, { n: 92, sy: 1.15 }),
        thMince(p, 130, 102, 56, { n: 45, seed: 2, sy: 1.1, c: '#6a3c1a' }),
        `</g>`,
        ...[[112, 70, 30], [146, 80, -40], [152, 118, 70], [116, 138, 20], [138, 148, -20], [160, 96, 10]].map(([x, y, r], i) => thLongBean(p, x, y, 12 + (i % 3) * 3, r)),
        `<g ${p.sh(.4)}>`,
        ...[[122, 84, 20], [148, 100, -30], [130, 122, 60], [150, 136, 100], [118, 112, -60], [140, 66, 40], [160, 118, -10], [126, 146, 30]].map(([x, y, r], i) => thLeaf(p, x, y, 13 + (i % 3) * 2, r, { c: i % 2 ? '#3a7a2e' : '#2f6a28', narrow: .7, wilted: true, purple: i % 3 === 0 })),
        `</g>`,
        thChiliSlice(p, 136, 92, 9, 30), thChiliSlice(p, 152, 128, 8, -50), thChiliSlice(p, 122, 128, 8, 80), thChiliSlice(p, 144, 112, 7, 10),
        thFriedEgg(p, 78, 88, 58, -10),
        thCucumber(p, 60, 142, 15, 20), thCucumber(p, 74, 150, 15, 40),
    ].join(''),

    // グリーンカレー（แกงเขียวหวานไก่）: 白い碗に、うす緑のココナッツカレー、鶏肉、タイなすの4つ割り、ホーラパー、赤唐辛子、こぶみかんの葉、緑の油
    th_kaengkiaowan: p => [
        thBowl(p),
        K.liquid(p, { R: 79, c: '#a9c47a', op: .97, shine: false }),
        `<circle cx="100" cy="100" r="62" fill="#c6d99a" opacity=".3"/>`,
        thOil(p, 100, 100, 150, { n: 14, c: '#9fbb52', op: .5, rmax: 2.4, seed: 2 }),
        ...[[72, 80, 30, 20], [128, 72, 28, -30], [138, 116, 30, 60], [92, 128, 30, 100], [108, 96, 26, -20], [66, 118, 24, 160]].map(([x, y, s, r], i) => thChicken(p, x, y, s, r, { seed: i + 1, c: i % 2 ? '#dccb92' : '#e4d4a0' })),
        ...[[100, 66, 24, 10], [150, 90, 24, 80], [120, 140, 24, -30], [60, 96, 22, 120], [84, 104, 22, 50], [140, 142, 20, 150]].map(([x, y, s, r], i) => thThaiEggplant(p, x, y, s, r, { seed: i })),
        thPeaEggplant(p, 118, 118, 7), thPeaEggplant(p, 80, 142, 6.5), thPeaEggplant(p, 126, 82, 6), thPeaEggplant(p, 70, 64, 6),
        `<g ${p.sh(.4)}>`,
        ...[[112, 110, 18, -20], [86, 84, 17, 40], [146, 128, 16, 110], [64, 134, 15, -60], [132, 60, 15, 20], [100, 148, 16, 70]].map(([x, y, s, r], i) => thLeaf(p, x, y, s, r, { c: i % 2 ? '#2f7a2a' : '#3c8a32', narrow: .75, wilted: true })),
        `</g>`,
        thLimeLeaf(p, 128, 100, 30, -30, { torn: true }), thLimeLeaf(p, 76, 120, 26, 60, { torn: true }),
        thChiliSlice(p, 104, 80, 10, 20), thChiliSlice(p, 142, 104, 9, -60), thChiliSlice(p, 92, 116, 9, 70), thChiliSlice(p, 114, 128, 8, 0),
        thSoupShine(100, 100, 79, .35),
    ].join(''),

    // カイチアオ（ไข่เจียว）: 皿に、ちりちりの縁のふわふわ卵焼き、小皿のシラチャーソース、きゅうり
    th_khaijiao: p => [
        thPlate(p),
        thKhaiJiao(p, 94, 100, 122),
        `<g ${p.sh(.4)}>`, thCucumber(p, 150, 70, 15, 20), thCucumber(p, 162, 84, 15, 50), `</g>`,
        thSaucer(p, 148, 136, 19, '#d8321f'),
        `<circle cx="144" cy="132" r="3" fill="#fff" opacity=".35"/>`,
    ].join(''),

    // プラートゥー揚げ（ปลาทูทอด）: 皿に、頭を折った小さなサバを3尾きつね色に揚げて、きゅうり
    th_platutod: p => [
        thPlate(p),
        thPlaTu(p, 94, 70, 102, -8, { seed: 1 }),
        thPlaTu(p, 104, 104, 104, 4, { seed: 2 }),
        thPlaTu(p, 96, 138, 100, -3, { seed: 3 }),
        `<g ${p.sh(.4)}>`, thCucumber(p, 154, 56, 16, 30), thCucumber(p, 166, 72, 15, 50), thCucumber(p, 46, 140, 15, -30), `</g>`,
        thChiliWhole(p, 160, 132, 16, -40), thChiliWhole(p, 166, 118, 14, 20),
    ].join(''),

    // 牛肉のオイスターソース炒め（เนื้อผัดน้ำมันหอย）: 皿に、濃い茶の照りの牛肉、玉ねぎ、ねぎ、きのこ、赤唐辛子
    th_nueanammanhoi: p => [
        thPlate(p),
        K.pool(p, 100, 104, 112, '#7a3e12', { op: .85, seed: 3, sy: .9 }),
        `<g ${p.sh(.7)}>`,
        thOnion(p, 72, 82, 26, -30), thOnion(p, 134, 124, 26, 150), thOnion(p, 118, 64, 24, 40), thOnion(p, 70, 128, 24, 100), thOnion(p, 146, 84, 22, -80),
        thOysterMushroom(p, 94, 70, 26, 20), thOysterMushroom(p, 142, 110, 26, -40), thOysterMushroom(p, 80, 142, 24, 60, { seed: 2 }),
        ...[[98, 90, -20, 36], [122, 102, 30, 38], [90, 116, 70, 36], [130, 78, -60, 34], [78, 100, 10, 32], [108, 128, 120, 36], [148, 136, -10, 30], [112, 70, 40, 30], [60, 108, 50, 28], [120, 146, 160, 30]].map(([x, y, r, s], i) => thBeef(p, x, y, s, r, { c: i % 2 ? '#6a3618' : '#7a4220', seed: i + 1 })),
        `</g>`,
        `<g ${p.sh(.5)}>`,
        ...[[86, 94, 30], [118, 86, -40], [104, 112, 70], [136, 96, -10], [74, 72, 50], [116, 134, 10], [60, 120, 80], [94, 144, -30], [148, 122, 40]].map(([x, y, r], i) => thScallionSeg(p, x, y, 20, r, { white: i % 4 === 3 })),
        `</g>`,
        thChiliSlice(p, 100, 100, 11, 20), thChiliSlice(p, 132, 112, 10, -50), thChiliSlice(p, 84, 128, 10, 70),
        thPepper(p, 100, 100, 100, 22, '#f0e6d2'),
    ].join(''),

    // 豚のタイ風チャーハン（ข้าวผัดหมู）: 皿に、うす黄色の炒めご飯、豚、卵、トマト、玉ねぎ、ねぎ。添えにきゅうりとライム
    th_khaopad: p => [
        thPlate(p),
        thRice(p, 94, 98, 124, { tint: '#eed9a4', grain: 3.6, hiK: .55, density: 1.1, layers: 1 }),
        `<g ${p.sh(.5)}>`,
        thEggBits(p, 94, 98, 104, { n: 11 }),
        ...[[78, 80, 20, 20], [116, 88, -30, 18], [92, 116, 60, 20], [120, 124, 10, 18], [66, 108, 45, 18], [104, 66, -15, 16], [130, 106, 70, 16], [80, 136, 30, 16]].map(([x, y, r, s], i) => thPorkBit(p, x, y, s, r, { seed: i + 1 })),
        thTomato(p, 72, 92, 20, 30, { seed: 1 }), thTomato(p, 112, 108, 20, -40, { seed: 2 }), thTomato(p, 96, 138, 18, 80, { seed: 3 }), thTomato(p, 126, 72, 17, 160, { seed: 4 }),
        thOnion(p, 90, 96, 18, 40), thOnion(p, 112, 136, 16, -20), thOnion(p, 62, 126, 16, 110),
        `</g>`,
        thScallions(p, 94, 98, 104, 26),
        `<g ${p.sh(.5)}>`, thCucumber(p, 154, 112, 16, 20), thCucumber(p, 160, 130, 16, 50), thCucumber(p, 150, 148, 15, 70), `</g>`,
        thLime(p, 158, 76, 24, -40),
        thChiliRing(p, 148, 94, 5), thChiliRing(p, 164, 100, 4.5),
        `<path d="M56,84 Q66,60 92,52" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`,
    ].join(''),

    // パッシーイウ（ผัดซีอิ๊วไก่）: 皿に、黒醤油色の幅広麺、カナーの茎と葉、鶏肉、卵のかたまり、焦げ目
    th_padseeew: p => [
        thPlate(p),
        K.pool(p, 100, 102, 120, '#6a3c14', { op: .4, seed: 4, sy: .9 }),
        thWideNoodles(p, 100, 100, 136, { n: 15, seed: 1, w: 12, c: '#b98448', len: .7, wav: .35 }),
        `<g ${p.sh(.6)}>`,
        ...[[76, 78, 26, 20], [130, 84, 24, -40], [92, 126, 26, 70], [138, 128, 22, 10], [112, 104, 22, 120], [64, 116, 20, -20]].map(([x, y, s, r], i) => thKanaLeaf(p, x, y, s, r, { seed: i + 1 })),
        ...[[100, 70, 22, -20], [148, 106, 22, 60], [72, 100, 20, 30], [120, 146, 22, -50], [104, 90, 18, 100], [84, 148, 18, 10]].map(([x, y, L, r]) => thKanaStem(p, x, y, L, r)),
        ...[[88, 92, 26, 10], [124, 70, 24, -30], [116, 120, 26, 50], [66, 138, 22, 80], [146, 142, 22, 20], [138, 100, 22, -70]].map(([x, y, s, r], i) => thChickenSlice(p, x, y, s, r, { seed: i + 1 })),
        `</g>`,
        thEggBits(p, 100, 100, 110, { n: 7, seed: 2 }),
        thPepper(p, 100, 100, 96, 20, '#f3eadc'),
        `<path d="M58,84 Q68,60 94,52" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),

    // 空心菜の強火炒め（ผัดผักบุ้งไฟแดง）: 皿に、つやつやの空心菜の茎と葉、赤唐辛子、にんにく、茶色のたれ
    th_padpakbung: p => [
        thPlate(p),
        K.pool(p, 100, 102, 122, '#8a5a24', { op: .4, seed: 5, sy: .85 }),
        thMorningGlory(p, 100, 100, 132, { n: 40, seed: 1 }),
        thMorningGlory(p, 98, 98, 90, { n: 14, seed: 2 }),
        thFriedGarlic(p, 100, 98, 84, 30),
        `<g ${p.sh(.4)}>`, thChiliWhole(p, 86, 92, 18, 30), thChiliWhole(p, 122, 108, 17, -40), thChiliWhole(p, 100, 128, 16, 80), thChiliSlice(p, 118, 78, 9, 20), `</g>`,
        `<path d="M58,80 Q70,58 96,52" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>`,
    ].join(''),

    // ソムタム（ส้มตำไทย）: 皿に、青パパイヤの千切り、ミニトマト、ささげ、ピーナッツ、干しえび、唐辛子、ライム。添えのキャベツ
    th_somtam: p => [
        thPlate(p),
        K.pool(p, 96, 102, 118, '#e8c87a', { op: .45, seed: 6, sy: .9 }),
        `<g ${p.sh(.5)}>`, thPapaya(p, 96, 100, 118, { seed: 1 }), `</g>`,
        ...[[70, 80, 20], [120, 72, -30], [134, 112, 60], [78, 128, 100], [108, 138, 20], [104, 100, -60], [60, 108, 40]].map(([x, y, r], i) => thLongBean(p, x, y, 12 + (i % 2) * 3, r, { c: '#6aa84a' })),
        thCherryHalf(p, 84, 92, 15), thCherryHalf(p, 118, 94, 14), thCherryHalf(p, 92, 122, 14), thCherryHalf(p, 128, 132, 13), thCherryHalf(p, 66, 124, 12), thCherryHalf(p, 110, 60, 12),
        `<g ${p.sh(.3)}>`, thDriedShrimp(p, 100, 84, 9, 20), thDriedShrimp(p, 76, 110, 9, -40), thDriedShrimp(p, 122, 114, 8, 80), thDriedShrimp(p, 96, 136, 8, 10), `</g>`,
        thPeanuts(p, 98, 102, 96, 22),
        thChiliWhole(p, 112, 80, 12, -30), thChiliWhole(p, 86, 134, 11, 40), thChiliSlice(p, 70, 96, 7, 20),
        `<g ${p.sh(.6)}>`, thCabbageWedge(p, 150, 82, 34, -50), `</g>`,
        thLime(p, 148, 138, 22, 160),
    ].join(''),

    // ナムプリックカピと野菜（น้ำพริกกะปิ）: 皿の中央に小鉢のディップ、まわりにきゅうり・ささげ・キャベツ・タイなす
    th_namprikkapi: p => [
        thPlate(p),
        `<g ${p.sh(.5)}>`,
        thCabbage(p, 62, 76, 34, 20, { seed: 1, cooked: false }), thCabbage(p, 138, 72, 32, -30, { seed: 2, cooked: false }), thCabbage(p, 56, 128, 32, 100, { seed: 3, cooked: false }),
        ...[[86, 58, 24, 10], [118, 56, 26, -8], [150, 104, 26, 95], [146, 128, 22, 80]].map(([x, y, L, r]) => thLongBean(p, x, y, L, r, { c: '#6aa84a' })),
        thCucumber(p, 72, 150, 17, 20), thCucumber(p, 92, 158, 17, 40), thCucumber(p, 114, 158, 17, 60), thCucumber(p, 134, 150, 17, 80),
        thThaiEggplant(p, 152, 150, 20, 40), thThaiEggplant(p, 54, 100, 20, -40),
        `</g>`,
        thSaucer(p, 100, 104, 36, '#6b4a3a', { op: 0 }),
        thKapiDip(p, 100, 104, 27),
        thChiliWhole(p, 94, 100, 14, -30), thChiliRing(p, 110, 110, 5), thChiliRing(p, 92, 112, 4.5),
        thPeaEggplant(p, 108, 96, 6), thPeaEggplant(p, 104, 114, 5.5),
    ].join(''),

    // 春雨サラダ（ยำวุ้นเส้น）: 皿に、透き通った春雨、むきえび、ひき肉、エシャロット、トマト、キンチャイ、唐辛子
    th_yamwunsen: p => [
        thPlate(p),
        K.pool(p, 100, 102, 120, '#e9d4a0', { op: .4, seed: 7, sy: .9 }),
        thGlassNoodles(p, 100, 100, 124, { n: 56 }),
        thGrains(p, 100, 100, 100, { cols: ['#c9aa8a', '#b8977a', '#d8bea0'], n: 48, size: 2.2, seed: 2 }),
        `<g ${p.sh(.5)}>`,
        thTomato(p, 74, 80, 22, 30, { seed: 1, c: '#e5442e' }), thTomato(p, 134, 118, 22, -40, { seed: 2, c: '#e5442e' }), thTomato(p, 96, 138, 20, 100, { seed: 3, c: '#e5442e' }),
        ...[[100, 76, 20, 10], [130, 84, 22, -50], [74, 112, 22, 70], [116, 108, 20, 150], [60, 134, 18, -10], [124, 142, 20, 40], [142, 70, 18, 100]].map(([x, y, s, r]) => thPeeledShrimp(p, x, y, s, r)),
        thShallot(p, 92, 100, 15, 20), thShallot(p, 112, 126, 14, -30), thShallot(p, 70, 90, 13, 60), thShallot(p, 140, 100, 13, 10), thShallot(p, 86, 150, 12, 80),
        `</g>`,
        thCelery(p, 108, 92, 26, 20), thCelery(p, 86, 124, 24, -40), thCelery(p, 138, 136, 22, 100), thCelery(p, 70, 66, 22, 50),
        thChiliRing(p, 104, 112, 6), thChiliRing(p, 82, 84, 5.5), thChiliRing(p, 128, 104, 5.5), thChiliRing(p, 108, 146, 5),
        thPeanuts(p, 100, 100, 90, 10, 3),
    ].join(''),

    // 野菜炒め（ผัดผักรวมมิตร）: 皿に、キャベツ、ブロッコリー、花形にんじん、ベビーコーン、きのこ、つやのあるたれ
    th_padpakruam: p => [
        thPlate(p),
        K.pool(p, 100, 102, 124, '#b48a44', { op: .45, seed: 8, sy: .9 }),
        `<g ${p.sh(.6)}>`,
        thCabbage(p, 76, 78, 36, 20, { seed: 1 }), thCabbage(p, 126, 70, 34, -30, { seed: 2 }), thCabbage(p, 62, 120, 34, 100, { seed: 3 }), thCabbage(p, 120, 138, 34, 40, { seed: 4 }), thCabbage(p, 142, 110, 30, 160, { seed: 5 }), thCabbage(p, 88, 148, 30, -60, { seed: 6 }),
        thBroccoli(p, 100, 88, 30, 0), thBroccoli(p, 138, 86, 26, 40), thBroccoli(p, 92, 120, 28, -30), thBroccoli(p, 64, 92, 24, 100),
        thOysterMushroom(p, 112, 112, 24, 30), thOysterMushroom(p, 76, 138, 22, -50, { seed: 2 }),
        thBabyCorn(p, 120, 96, 28, -30), thBabyCorn(p, 84, 104, 26, 40), thBabyCorn(p, 134, 130, 26, 110), thBabyCorn(p, 62, 60, 22, 10),
        thCarrotFlower(p, 110, 68, 15, 10), thCarrotFlower(p, 144, 102, 14, 20), thCarrotFlower(p, 104, 138, 15, 0), thCarrotFlower(p, 70, 106, 13, 30), thCarrotFlower(p, 126, 116, 12, 15),
        `</g>`,
        `<path d="M58,82 Q68,60 94,52" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),

    // 蒸し卵（ไข่ตุ๋น）: 白い小鉢に、なめらかな淡い黄色の蒸し卵、ねぎ、揚げにんにく、こしょう
    th_khaitun: p => [
        thSmallBowl(p),
        thSteamedEgg(p, 100, 100, 74),
        thGrains(p, 100, 100, 110, { cols: ['#c9a888', '#b9957a'], n: 14, size: 1.8, seed: 2 }),
        thScallions(p, 100, 100, 100, 18),
        thFriedGarlic(p, 100, 100, 90, 22, 2),
        thCoriander(p, 112, 90, 16, 20), thCoriander(p, 84, 112, 14, -40),
        thPepper(p, 100, 100, 80, 12),
    ].join(''),

    // トムヤムクン（ต้มยำกุ้ง）: 碗に、橙赤の澄んだスープ、殻つきのえび、フクロタケ、レモングラス、ガランガル、こぶみかんの葉、唐辛子、パクチー、赤い油
    th_tomyum: p => [
        thBowl(p),
        K.liquid(p, { R: 79, c: '#e47a34', op: .92, shine: false }),
        `<circle cx="100" cy="100" r="60" fill="#f2a060" opacity=".28"/>`,
        thOil(p, 100, 100, 150, { n: 16, c: '#d8401c', op: .5, rmax: 2.4 }),
        `<g ${p.sh(.5)}>`,
        thLemongrass(p, 70, 118, 24, -50), thLemongrass(p, 134, 64, 22, 30), thLemongrass(p, 146, 126, 20, 100),
        thGalangal(p, 84, 70, 17, 20), thGalangal(p, 128, 138, 16, -30), thGalangal(p, 60, 96, 15, 60),
        thStrawMushroom(p, 108, 76, 17, 20, { half: true }), thStrawMushroom(p, 76, 140, 16, -30, { half: true }), thStrawMushroom(p, 144, 98, 15, 50), thStrawMushroom(p, 94, 104, 13, 0),
        thTomato(p, 122, 112, 20, 30, { seed: 1 }),
        `</g>`,
        thShrimp(p, 92, 90, 42, -30, { seed: 1 }), thShrimp(p, 124, 92, 40, 40, { seed: 2 }), thShrimp(p, 104, 128, 40, 150, { seed: 3 }), thShrimp(p, 66, 72, 34, -100, { seed: 4 }),
        thLimeLeaf(p, 112, 60, 30, -20, { torn: true }), thLimeLeaf(p, 142, 114, 26, 60, { torn: true }), thLimeLeaf(p, 66, 124, 24, 110, { torn: true }),
        thChiliWhole(p, 98, 112, 15, 20), thChiliWhole(p, 136, 82, 13, -50), thChiliSlice(p, 80, 106, 8, 40),
        thCoriander(p, 110, 104, 18, 20), thCoriander(p, 84, 126, 15, -30), thCoriander(p, 128, 128, 14, 70),
        thSoupShine(100, 100, 79, .35),
    ].join(''),

    // 卵豆腐とひき肉の澄まし汁（แกงจืดเต้าหู้หมูสับ）: 碗に、澄んだ淡い汁、卵豆腐の輪切り、肉団子、白菜、春雨、ねぎ、パクチー、揚げにんにく
    th_tomjued: p => [
        thBowl(p),
        K.liquid(p, { R: 79, c: '#e8d9b6', op: .85, shine: false }),
        `<circle cx="100" cy="100" r="60" fill="#f3e8cc" opacity=".3"/>`,
        thOil(p, 100, 100, 140, { n: 8, c: '#f0cc74', op: .45, rmax: 1.6 }),
        thGlassNoodles(p, 100, 100, 110, { n: 30, c: '#ede5d6', sy: 1 }),
        `<g ${p.sh(.5)}>`,
        thNapa(p, 72, 80, 32, 20, 1), thNapa(p, 134, 76, 30, -40, 2), thNapa(p, 62, 126, 30, 100, 3), thNapa(p, 138, 128, 30, 40, 4), thNapa(p, 100, 148, 28, -10, 5),
        `</g>`,
        thEggTofu(p, 96, 84, 30, -10), thEggTofu(p, 128, 104, 30, 20), thEggTofu(p, 82, 120, 29, 10), thEggTofu(p, 110, 134, 26, -20), thEggTofu(p, 60, 98, 24, 30),
        thPorkBall(p, 112, 104, 20, { seed: 1 }), thPorkBall(p, 72, 66, 18, { seed: 2 }), thPorkBall(p, 148, 100, 18, { seed: 3 }), thPorkBall(p, 94, 108, 17, { seed: 4 }), thPorkBall(p, 136, 140, 16, { seed: 5 }),
        thScallions(p, 100, 100, 120, 16, 2),
        thCoriander(p, 106, 68, 16, 20), thCoriander(p, 76, 140, 15, -40), thCoriander(p, 146, 122, 14, 80),
        thFriedGarlic(p, 100, 100, 120, 22, 3),
        thPepper(p, 100, 100, 80, 10),
        thSoupShine(100, 100, 79, .4),
    ].join(''),

    // トムカーガイ（ต้มข่าไก่）: 碗に、白いココナッツスープ、鶏肉、きのこ、ガランガル、レモングラス、こぶみかんの葉、唐辛子、パクチー、赤い油の点
    th_tomkhagai: p => [
        thBowl(p),
        K.liquid(p, { R: 79, c: '#f1e6cf', op: .98, shine: false }),
        `<circle cx="100" cy="100" r="62" fill="#fbf6ea" opacity=".45"/>`,
        thOil(p, 100, 100, 140, { n: 12, c: '#d8401c', op: .45, rmax: 1.4, seed: 3 }),
        `<g ${p.sh(.5)}>`,
        thLemongrass(p, 134, 72, 24, 30), thLemongrass(p, 64, 112, 22, -60), thLemongrass(p, 128, 142, 20, 110),
        thGalangal(p, 78, 74, 18, 20), thGalangal(p, 142, 108, 17, -30), thGalangal(p, 92, 144, 16, 60), thGalangal(p, 120, 100, 15, 90),
        thStrawMushroom(p, 112, 72, 18, 20, { half: true }), thStrawMushroom(p, 70, 138, 17, -30, { half: true }), thStrawMushroom(p, 150, 128, 15, 50), thOysterMushroom(p, 100, 120, 24, 30),
        `</g>`,
        ...[[96, 90, 32, 20], [124, 120, 30, -30], [72, 96, 28, 60], [136, 88, 26, 110], [92, 128, 26, -70], [60, 70, 22, 10]].map(([x, y, s, r], i) => thChicken(p, x, y, s, r, { seed: i + 1, c: i % 2 ? '#efe0c4' : '#ebd8b8' })),
        thLimeLeaf(p, 108, 108, 30, -20, { torn: true }), thLimeLeaf(p, 80, 60, 26, 50, { torn: true }), thLimeLeaf(p, 146, 146, 24, 120, { torn: true }),
        thChiliWhole(p, 110, 138, 15, -20), thChiliWhole(p, 128, 60, 13, 40), thChiliSlice(p, 76, 118, 8, 30),
        thCoriander(p, 118, 90, 17, 20), thCoriander(p, 84, 112, 15, -30), thCoriander(p, 134, 134, 14, 70),
        thSoupShine(100, 100, 79, .4),
    ].join(''),
};
