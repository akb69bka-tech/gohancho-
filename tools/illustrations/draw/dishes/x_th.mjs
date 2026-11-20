// タイの家庭料理（2回目の手描き: 汁物・おかず・副菜）: 世界版パック th
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// 共通の部品（th〜）: w_vn / w_cn / w_kr から写して手直ししたもの
// =========================================================
function xthSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const xthShine = (d, w = 1.6, op = .7) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
const xthSoupShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
function xthOutline(p, c, r = .55){
    const id = p.def('xthOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// ご飯の山（米粒を2層）
function xthRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xthRice' + seed + x + y);
    const shape = xthSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('xthRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
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
function xthGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, w = null, h = null } = {}){
    const R = rng(p.id + 'xthGr' + seed + x + y);
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
function xthShreds(p, x, y, s, { c = '#ef7f30', n = 10, w = 1.6, len = .9, seed = 1, curve = .3, sy = 1, outline = true } = {}){
    const R = rng(p.id + 'xthSh' + seed + x + y);
    const cols = [c, lt(c, .18), dk(c, .14)], ds = ['', '', ''];
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI, L = s * len * (.55 + R() * .45);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<g ${outline ? xthOutline(p, dk(c, .32), .4) : ''} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>`;
}
// 汁に浮いた油の粒
function xthOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'thoil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 具を散らす位置
function xthSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xthspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360), R()]);
    }
    return out;
}
// 黒こしょう・白こしょう
const xthPepper = (p, x, y, s, n = 24, c = '#3a2a1c') => K.sprinkle(p, x, y, s, { c, n, r: .7 });

// =========================================================
// タイの器: 白地に緑と赤の帯（ランパーンの鶏の碗の色）
// =========================================================
const XTH_GREEN = '#2f8a4e', XTH_RED = '#c9392a';
// 赤い牡丹と緑の葉（鶏の碗の花）
function xthFlower(p, x, y, k = 1, r = 0){
    return `<g ${T(x, y, r, k)}><path d="M-9,-2 Q-6,-7 -1,-4 M9,0 Q7,-6 2,-4" stroke="${XTH_GREEN}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>
        <circle cx="-2.2" cy=".2" r="2.6" fill="${XTH_RED}"/><circle cx="1.6" cy="-1.4" r="2.4" fill="${XTH_RED}"/><circle cx="1.2" cy="2.4" r="2.2" fill="${XTH_RED}"/><circle cx="-1.2" cy="-2.6" r="1.6" fill="#e8705a"/></g>`;
}
// 平皿: 白い磁器、縁に緑の帯と細い赤の線
function xthPlate(p, { R = 94, well = .73, flower = true } = {}){
    const w = R * well, base = '#fcfbf7';
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .1, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${XTH_GREEN}" stroke-width="2.4" opacity=".9"/>
        <circle cx="100" cy="100" r="${f1(w + 4.5)}" fill="none" stroke="${XTH_RED}" stroke-width="1" opacity=".75"/>
        ${flower ? xthFlower(p, 100 + (R + w) / 2 * .707 - 1, 100 - (R + w) / 2 * .707 + 1, .55, 20) : ''}
        <circle cx="100" cy="100" r="${f1(w + 1.5)}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".4"/>
        <circle cx="100" cy="100" r="${f1(w)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .2)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 汁物の碗: 白、縁に緑の帯と赤の線、内側に赤い花
function xthBowl(p, { R = 92, inside = '#fbfaf5' } = {}){
    const r = R * .87;
    let fl = '';
    for (let i = 0; i < 3; i++){ const a = -1.2 + i * 2.094, rm = (R - 3 + r) / 2; fl += xthFlower(p, 100 + Math.cos(a) * rm, 100 + Math.sin(a) * rm, .5, a * 57.3 + 90); }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#f9f8f3', .25, .2, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.4}" fill="none" stroke="${XTH_GREEN}" stroke-width="2.6"/>
        <circle cx="100" cy="100" r="${f1(r + 1.6)}" fill="none" stroke="${XTH_RED}" stroke-width="1" opacity=".8"/>
        ${fl}
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .22, .64, .66)}"/>
        <path d="M${f1(100 - R * .7)},${f1(100 - R * .42)} A${f1(R * .82)},${f1(R * .82)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .78)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 小鉢（ナムプリック・蒸し卵用）: 白、緑の線
function xthSmallBowl(p, { R = 92, inside = '#fbfaf5' } = {}){
    const r = R * .84;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#f9f8f3', .25, .2, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${XTH_GREEN}" stroke-width="3"/>
        <circle cx="100" cy="100" r="${f1(r + 1.4)}" fill="none" stroke="${XTH_RED}" stroke-width=".9" opacity=".8"/>
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .22, .64, .66)}"/>
        <path d="M${f1(100 - R * .7)},${f1(100 - R * .42)} A${f1(R * .82)},${f1(R * .82)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .78)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 皿の上の小さなたれ用の鉢
function xthSaucer(p, x, y, R, liq, { op = .95 } = {}){
    return `<g ${p.sh(1.2)}><circle cx="${x}" cy="${y}" r="${R}" fill="${p.rg('#f8f6f0', .2, .15, .38, .32)}"/></g>
        <circle cx="${x}" cy="${y}" r="${f1(R - 1.6)}" fill="none" stroke="${XTH_GREEN}" stroke-width="1.6"/>
        <circle cx="${x}" cy="${y}" r="${f1(R * .78)}" fill="${p.rg(liq, .2, .25, .42, .4)}" opacity="${op}"/>`;
}

// =========================================================
// タイの料理の部品
// =========================================================
// 唐辛子の輪切り（赤）
function xthChiliRing(p, x, y, s, r = 0, { c = '#d42a1c' } = {}){
    return `<g ${T(x, y, r)}><circle r="${s / 2}" fill="${c}" stroke="${dk(c, .4)}" stroke-width=".5"/><circle r="${f(s * .3)}" fill="${lt(c, .35)}"/><circle cx="${f(s * .08)}" cy="${f(-s * .05)}" r="${f(s * .08)}" fill="#f6dfa0"/><circle cx="${f(-s * .1)}" cy="${f(s * .06)}" r="${f(s * .07)}" fill="#f6dfa0"/></g>`;
}
// 唐辛子まるごと（プリッキーヌ: 小さく細い、へたつき）
function xthChiliWhole(p, x, y, L, r = 0, { c = '#d8321f' } = {}){
    const w = L * .22;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-L / 2)},0 Q${f(-L / 2)},${f(-w / 2)} ${f(-L / 2 + w * .8)},${f(-w / 2)} L${f(L * .3)},${f(-w * .4)} Q${f(L / 2)},${f(-w * .2)} ${f(L / 2 + 1)},0 Q${f(L / 2)},${f(w * .2)} ${f(L * .3)},${f(w * .4)} L${f(-L / 2 + w * .8)},${f(w / 2)} Q${f(-L / 2)},${f(w / 2)} ${f(-L / 2)},0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/></g>
        <path d="M${f(-L / 2)},0 L${f(-L / 2 - L * .22)},${f(-w * .25)}" stroke="#4f8a2b" stroke-width="${f(w * .5)}" stroke-linecap="round"/>
        ${xthShine(`M${f(-L * .3)},${f(-w * .18)} L${f(L * .15)},${f(-w * .1)}`, w * .25, .7)}</g>`;
}
// 長い赤唐辛子の斜め切り
function xthChiliSlice(p, x, y, L, r = 0, { c = '#d8321f' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(L / 2)}" ry="${f(L * .22)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .4)}" stroke-width=".5"/><ellipse rx="${f(L * .32)}" ry="${f(L * .11)}" fill="${lt(c, .35)}"/><circle cx="${f(L * .1)}" cy="0" r=".8" fill="#f6dfa0"/><circle cx="${f(-L * .15)}" cy=".4" r=".7" fill="#f6dfa0"/></g>`;
}
// ハーブの葉（ガパオ・ホーラパー）: 先のとがった楕円、葉脈
function xthLeaf(p, x, y, s, r = 0, { c = '#2f7a2a', narrow = 1, wilted = false, purple = false } = {}){
    const col = wilted ? mix(c, '#4a5a20', .35) : c;
    return `<g ${T(x, y, r)}><g transform="scale(${f(s / 20)} ${f(s / 20 * narrow)})"><g ${p.sh(.5)}><path d="M-10,0 Q-5,-7.5 4,-5.5 Q9,-3.5 10,0 Q9,3.5 4,5.5 Q-5,7.5 -10,0Z" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .3)}" stroke-width=".6"/></g>
        <path d="M-9,0 Q0,-.5 9,0 M-4,0 L0,-4.2 M1,0 L4,-3 M-4,0 L0,4.2 M1,0 L4,3" stroke="${purple ? '#8a4a6a' : lt(col, .35)}" stroke-width=".7" fill="none"/>
        <path d="M-5,-3.5 Q0,-5.6 5,-4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/></g></g>`;
}
// こぶみかんの葉（くびれのある二枚葉、濃い緑、つや）
function xthLimeLeaf(p, x, y, L, r = 0, { c = '#2a6a2a', torn = false } = {}){
    const k = L / 36;
    const d = torn ? 'M-16,0 Q-13,-7 -4,-6 Q-1,-4 -1,0 Q-1,4 -4,6 Q-13,7 -16,0Z' : 'M-18,0 Q-14,-7 -3,-6 Q0,-3.5 1,-1 Q4,-6 13,-6.5 Q18,-3 18,0 Q18,3 13,6.5 Q4,6 1,1 Q0,3.5 -3,6 Q-14,7 -18,0Z';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${d}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="M-17,0 L17,0" stroke="${lt(c, .4)}" stroke-width=".9" opacity=".8"/>
        ${xthShine('M-14,-2.5 Q-9,-5.4 -3,-4.4', 1.4, .55)}${torn ? '' : xthShine('M4,-3.5 Q9,-5.4 14,-3.6', 1.2, .45)}</g>`;
}
// パクチー（丸い切れ込みの小さな葉）
function xthCoriander(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}>${[[-5, -2, 5.5], [3, -4, 5], [4, 4, 5.2], [-4, 5, 4.6]].map(([a, b, rr], i) => `<path ${T(a, b, i * 50)} d="M-${rr},0 Q-${rr},-${rr} 0,-${rr} Q${rr * .4},-${rr * .7} ${rr * .5},-${rr * .3} Q${rr},-${rr * .4} ${rr},0 Q${rr},${rr} 0,${rr} Q-${rr},${rr} -${rr},0Z" fill="${p.g(i % 2 ? '#3f8f2f' : '#4c9c36', .3, .25)}" stroke="#2c6a20" stroke-width=".5"/>`).join('')}</g>
        <path d="M0,0 L-5,-2 M0,0 L3,-4 M0,0 L4,4 M0,0 L-4,5 M0,0 L2,11" stroke="#8cbf5c" stroke-width=".9" fill="none"/></g>`;
}
// ねぎのぶつ切り（緑の筒）
function xthScallionSeg(p, x, y, L, r = 0, { c = '#5aa33a', white = false, w = 4 } = {}){
    const col = white ? '#eef3df' : c;
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g(col, .3, .2)}" stroke="${dk(col, .3)}" stroke-width=".5"/>
        <path d="M${f(-L / 2 + 2)},-.6 L${f(L / 2 - 2)},-.6" stroke="${lt(col, .45)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}
// 小口ねぎ
const xthScallions = (p, x, y, s, n = 14, seed = 1) => K.scallions(p, x, y, s, { n, seed, c: '#4f9a2e' });
// 揚げにんにく・ピーナッツ・干しえび
const xthFriedGarlic = (p, x, y, s, n = 26, seed = 1) => xthGrains(p, x, y, s, { cols: ['#e4ad48', '#c98a2a', '#f2cc72'], n, size: 1.3, seed });
const xthPeanuts = (p, x, y, s, n = 18, seed = 1) => xthGrains(p, x, y, s, { cols: ['#e2b878', '#c99556', '#f0d4a0'], n, size: 2.3, seed });
function xthDriedShrimp(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 10)}><path d="M-5,2 Q-5,-4 0,-4 Q5,-4 5,1 Q3,4 1,2 Q0,0 -1,2 Q-3,4 -5,2Z" fill="${p.g('#e8742e', .3, .25)}" stroke="#a84a16" stroke-width=".5"/><path d="M-3,-1 Q0,-3 3,-1" stroke="#f8c08a" stroke-width=".8" fill="none"/></g>`;
}
// 殻つきのえび（赤橙、節と尾、照り）
function xthShrimp(p, x, y, s, r = 0, { c = '#e0592c', seed = 1 } = {}){
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
function xthPeeledShrimp(p, x, y, s, r = 0){
    const k = s / 20, c = '#f08a62';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-8,4 C-10,-4 -4,-10 3,-9 C9,-8 11,-2 9,3 C7,7 2,7 1,3 C0,-1 -3,0 -3,4 C-3,7 -6,8 -8,4Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M-5,-5 Q-3,-2 -6,0 M-1,-8 Q0,-4 -3,-2 M4,-8 Q4,-4 1,-2 M8,-4 Q6,-1 3,0" stroke="#fde1d3" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-8,4 L-11,7 L-7,8Z" fill="${dk(c, .1)}"/>${xthShine('M-4,-6 Q0,-7.5 4,-6.5', 1.1, .6)}</g>`;
}
// 目玉焼き（カイダーオ: 縁がちりちりに揚がった）
function xthFriedEgg(p, x, y, s, r = 0){
    const R = rng(p.id + 'thegg' + x);
    const pts = ring(19, 15, .26, R, 1.08, .96);
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.9)}><g ${p.rough(1.6, .2)}><path d="${xthSm(pts, true)}" fill="${p.rg('#fffcf4', .1, .1)}" stroke="#d9a860" stroke-width="1.2"/></g></g>
        <path d="${xthSm(pts, true)}" fill="none" stroke="#c98a3a" stroke-width="3" opacity=".45"/>
        <path d="${xthSm(pts.map(([a, b]) => [a * .78, b * .78]), true)}" fill="none" stroke="#e8c88a" stroke-width="2" opacity=".5"/>
        <path d="${xthSm(pts.map(([a, b]) => [a * .6 + 1.5, b * .6 + 1.2]), true)}" fill="#f7f2e6" opacity=".7"/>
        <circle cx="2" cy="1" r="8.4" fill="${p.rg('#f7a01a', .35, .18, .35, .32)}" stroke="#d07d10" stroke-width=".8"/>
        <ellipse cx="-.8" cy="-2.2" rx="3.2" ry="1.9" fill="#fff" opacity=".8"/>
        <path d="M-14,-6 Q-9,-13 -1,-14" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 炒めたひき肉（ガパオ: 濃い茶、照り）
function xthMince(p, x, y, s, { n = 110, seed = 1, sy = 1, c = '#7a4a24' } = {}){
    return xthGrains(p, x, y, s, { cols: [c, lt(c, .14), dk(c, .14), '#9a6238'], n, size: 2.6, seed, sy })
        + xthGrains(p, x - 3, y - 3, s * .8, { cols: [lt(c, .45)], n: Math.round(n * .22), size: 1.1, seed: seed + 7, sy });
}
// 鶏肉のひと口大（カレー・スープの中: 淡い色、繊維）
function xthChicken(p, x, y, s, r = 0, { c = '#e9d5b2', seed = 1 } = {}){
    const R = rng(p.id + 'thck' + seed + x + y);
    const k = s / 20;
    const pts = [[-10, -3], [-6, -8], [1, -8.5], [7, -6], [10, -1], [8, 5], [3, 8], [-4, 8], [-9, 4]].map(([a, b]) => [a + (R() - .5) * 4.5, b + (R() - .5) * 4.5]);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .75)}" fill="${p.g(c, .2, .28)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .55 + 1.5, b * .5 + 2]), true, .8)}" fill="${dk(c, .1)}" opacity=".45"/>
        <path d="M${f1(-5 + R() * 2)},${f1(2 + R() * 2)} l${f1(4 + R() * 3)},${f1(-1 + R() * 2)} M${f1(1 + R() * 2)},${f1(4 + R())} l${f1(3 + R() * 2)},${f1(-1)}" stroke="${dk(c, .35)}" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".5"/>
        ${xthShine('M-7,-4 Q-3,-7 2,-6.4', 1.6, .75)}</g>`;
}
// 牛肉の薄切り（オイスター炒め: 濃い茶、照り）
function xthBeef(p, x, y, s, r = 0, { c = '#6e3a1e', seed = 1 } = {}){
    const R = rng(p.id + 'thbf' + seed + x + y);
    const k = s / 30;
    const pts = ring(13, 13, .3, R, 1.2, .62);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M-9,-1 Q-4,-4 1,-1 T10,-1 M-7,3.5 Q-2,1.5 3,4 T10,3" stroke="${dk(c, .4)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>
        ${xthShine('M-8,-4.6 Q-1,-7.2 6,-5', 1.8, .7)}<circle cx="7" cy="-2" r=".8" fill="#fff" opacity=".6"/></g>`;
}
// 豚の薄切り（チャーハンの中）
function xthPorkBit(p, x, y, s, r = 0, { c = '#b98458', seed = 1 } = {}){
    const R = rng(p.id + 'thpk' + seed + x + y);
    const k = s / 20;
    const pts = ring(10, 7, .55, R, 1.2, .85);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .45)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <ellipse cx="${f1((R() - .5) * 6)}" cy="${f1((R() - .5) * 3)}" rx="3" ry="1.4" fill="${dk(c, .3)}" opacity=".35"/>${xthShine('M-6,-3.4 Q0,-5.2 5,-3.8', 1.2, .6)}</g>`;
}
// 鶏むねの薄切り（パッシーイウ: 淡い）
const xthChickenSlice = (p, x, y, s, r = 0, o = {}) => xthChicken(p, x, y, s, r, { c: '#dcb98a', ...o });
// 玉ねぎのくし切り
const xthOnion = (p, x, y, s, r = 0) => K.onion(p, x, y, s, r, { c: '#efe0b4' });
// エシャロット（ホームデーン）の薄切り: 紫がかった輪
function xthShallot(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><ellipse rx="${f(s / 2)}" ry="${f(s * .36)}" fill="${p.g('#f0dce0', .25, .15)}" stroke="#9a4a6a" stroke-width=".9"/></g><ellipse rx="${f(s * .33)}" ry="${f(s * .22)}" fill="none" stroke="#b86a8a" stroke-width=".8" opacity=".8"/><ellipse rx="${f(s * .15)}" ry="${f(s * .1)}" fill="none" stroke="#b86a8a" stroke-width=".7" opacity=".8"/></g>`;
}
// フクロタケ（丸い茶色のつぼみ、半分に切ると中が白い）
function xthStrawMushroom(p, x, y, s, r = 0, { half = false, seed = 1 } = {}){
    const c = '#8a6a48';
    if (!half) return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${f(s / 2)}" ry="${f(s * .42)}" fill="${p.rg(c, .3, .3, .35, .32)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g><ellipse cx="${f(-s * .14)}" cy="${f(-s * .14)}" rx="${f(s * .16)}" ry="${f(s * .08)}" fill="#fff" opacity=".55"/></g>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${f(s / 2)}" ry="${f(s * .42)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <ellipse rx="${f(s / 2 - 1.8)}" ry="${f(s * .42 - 1.6)}" fill="${p.g('#f1e8d6', .2, .15)}"/>
        <ellipse cx="0" cy="${f(-s * .06)}" rx="${f(s * .22)}" ry="${f(s * .17)}" fill="${lt(c, .25)}" opacity=".8"/>
        <ellipse cx="0" cy="${f(s * .14)}" rx="${f(s * .1)}" ry="${f(s * .08)}" fill="${dk(c, .1)}" opacity=".6"/></g>`;
}
// ヒラタケ（扇形、淡いグレー）
function xthOysterMushroom(p, x, y, s, r = 0, { seed = 1, c = '#d9cfbd' } = {}){
    const R = rng(p.id + 'thom' + seed + x + y);
    const k = s / 24;
    const pts = [[-12, 2], [-9, -5], [-2, -9], [6, -9], [12, -4], [12, 2], [6, 5], [0, 7], [-6, 5]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-9,1 Q-2,-2 10,-2 M-6,4 Q0,1 10,0 M-3,-6 Q2,-5 9,-4" stroke="${dk(c, .18)}" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M-12,2 Q-8,4 -6,6" stroke="${lt(c, .3)}" stroke-width="2.4" stroke-linecap="round"/>${xthShine('M-7,-5 Q-2,-7.4 4,-7', 1.2, .6)}</g>`;
}
// ガランガル（カー）の薄切り: 淡いクリーム色に年輪、縁がうすいピンク
function xthGalangal(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .4)}" fill="${p.g('#f2e6c8', .2, .2)}" stroke="#c29a6a" stroke-width=".8"/></g>
        <ellipse rx="${f(s * .34)}" ry="${f(s * .26)}" fill="none" stroke="#d8c096" stroke-width=".8"/><ellipse rx="${f(s * .18)}" ry="${f(s * .13)}" fill="none" stroke="#d8c096" stroke-width=".7"/>
        <ellipse rx="${f(s / 2 - .8)}" ry="${f(s * .4 - .8)}" fill="none" stroke="#e8a89a" stroke-width="1" opacity=".55"/></g>`;
}
// レモングラスのぶつ切り（うす黄緑の筒、節）
function xthLemongrass(p, x, y, L, r = 0){
    const w = L * .28;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${L}" height="${f(w)}" rx="${f(w * .3)}" fill="${p.g('#d9d79a', .3, .25)}" stroke="#8a8a46" stroke-width=".6"/></g>
        <path d="M${f(-L * .2)},${f(-w / 2)} L${f(-L * .2)},${f(w / 2)} M${f(L * .15)},${f(-w / 2)} L${f(L * .15)},${f(w / 2)}" stroke="#a8a860" stroke-width=".7" opacity=".7"/>
        <ellipse cx="${f(L / 2)}" cy="0" rx="${f(w * .25)}" ry="${f(w / 2)}" fill="#eeeccc" stroke="#8a8a46" stroke-width=".5"/>
        <path d="M${f(-L * .4)},${f(-w * .2)} L${f(L * .3)},${f(-w * .2)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g>`;
}
// トマトのくし切り（煮た・生）
function xthTomato(p, x, y, s, r = 0, { seed = 1, c = '#e2412c' } = {}){
    const R = rng(p.id + 'thtm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="${lt(c, .3)}" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ミニトマト半分（ソムタム）
function xthCherryHalf(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="${p.rg('#e5382a', .3, .25, .4, .36)}" stroke="#a8221a" stroke-width=".6"/></g>
        <circle r="${f(s * .34)}" fill="#f47058"/><circle r="${f(s * .14)}" fill="#f9d36b" opacity=".9"/>
        <path d="M${f(-s * .3)},${f(-s * .08)} Q${f(-s * .2)},${f(-s * .3)} ${f(s * .02)},${f(-s * .32)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ライムのくし切り（緑の皮）
function xthLime(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,2 A10,9 0 0 1 10,2 Z" fill="#4f9a2f"/></g><path d="M-8.4,2 A8.4,7.4 0 0 1 8.4,2 Z" fill="#e6f0b8"/><path d="M-7.2,2 A7.2,6.4 0 0 1 7.2,2 Z" fill="${p.rg('#d6e89a', .2, .1)}"/>
        ${[-60, -30, 0, 30, 60].map(a => `<path transform="rotate(${a} 0 2)" d="M0,2 L0,-4.4" stroke="#f6fbe0" stroke-width=".9"/>`).join('')}</g>`;
}
// きゅうりの斜め切り
const xthCucumber = (p, x, y, s, r = 0) => K.cucumberSlice(p, x, y, s, r, { oval: 1.35 });
// ササゲ（長いんげん）のぶつ切り
function xthLongBean(p, x, y, L, r = 0, { c = '#5a9e3a', w = 4.2 } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><rect x="${f(-L / 2)}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>
        <path d="M${f(-L / 2 + 2)},${f(-w * .17)} L${f(L / 2 - 2)},${f(-w * .17)}" stroke="${lt(c, .5)}" stroke-width="${f(w * .19)}" stroke-linecap="round" opacity=".8"/>
        <circle cx="${f(L / 2 - .5)}" cy="0" r="${f(w * .31)}" fill="${lt(c, .4)}" stroke="${dk(c, .3)}" stroke-width=".4"/></g>`;
}
// タイなす（マクアプロ）の4つ割り: 緑と白のしま、黄色がかった断面
function xthThaiEggplant(p, x, y, s, r = 0, { seed = 1 } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-9,6 Q-10,-3 -3,-8 Q4,-10 9,-4 L9,6 Q0,9 -9,6Z" fill="${p.g('#e9dfa8', .25, .22)}" stroke="#8a8a52" stroke-width=".6"/></g>
        <path d="M-9,6 Q-10,-3 -3,-8 Q-6,-1 -5,6Z" fill="${p.g('#9fc26a', .3, .3)}" stroke="#4f7a2a" stroke-width=".5"/>
        <path d="M-7,-2 Q-8,2 -7,5 M-5,-5 Q-6,0 -6,4" stroke="#eef5d8" stroke-width=".9" fill="none" opacity=".8"/>
        <path d="M-2,0 Q3,-2 7,0 M-1,3 Q3,2 7,3" stroke="#c6b878" stroke-width=".6" fill="none" opacity=".7"/>
        ${[[0, -4], [3, -2], [5, 1], [1, 2]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r=".6" fill="#8a7a4a"/>`).join('')}</g>`;
}
// タイなす（丸ごと小さく、緑白）
function xthPeaEggplant(p, x, y, s){
    return `<g ${p.sh(.4)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg('#a8c86a', .3, .3, .35, .32)}" stroke="#4f7a2a" stroke-width=".5"/></g>`;
}
// 空心菜（筒状の茎と矢じり形の葉、炒めてつやつや）
function xthMorningGlory(p, x, y, s, { n = 30, seed = 1 } = {}){
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
function xthKanaStem(p, x, y, L, r = 0){
    const w = L * .34;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-L / 2 + w * .5)},${f(-w / 2)} L${f(L / 2)},${f(-w / 2)} L${f(L / 2 - w * .5)},${f(w / 2)} L${f(-L / 2)},${f(w / 2)}Z" fill="${p.g('#a9cf72', .3, .25)}" stroke="#5a8a36" stroke-width=".6" stroke-linejoin="round"/></g>
        <ellipse cx="${f(L / 2 - w * .25)}" cy="0" rx="${f(w * .22)}" ry="${f(w * .46)}" fill="#dcedb8" stroke="#5a8a36" stroke-width=".4"/>
        <path d="M${f(-L * .35)},${f(-w * .18)} L${f(L * .3)},${f(-w * .18)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
function xthKanaLeaf(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'thkl' + seed + x + y);
    const k = s / 30, c = '#2e6e2a';
    const pts = ring(13, 11, .3, R, 1.25, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .8)}" fill="${p.g(c, .28, .28)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M-14,0 Q0,-1 14,0 M-6,-1 L-2,-7 M2,-1 L6,-6 M-6,1 L-2,6 M2,1 L6,6" stroke="${lt(c, .4)}" stroke-width=".9" fill="none"/>
        ${xthShine('M-9,-4.5 Q-3,-8 4,-6.5', 1.2, .5)}</g>`;
}
// 幅広の米麺（センヤイ）: 黒醤油で茶色、つや、焦げ
function xthWideNoodles(p, x, y, s, { c = '#a9733a', w = 8.5, n = 16, seed = 1, sy = .9, len = .6, wav = .5 } = {}){
    const R = rng(p.id + 'xthWn' + seed + x);
    const ol = xthOutline(p, dk(c, .35), .6), rad = s / 2;
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
        const dd = xthSm(pts), l = L[i % 4];
        if (R() < .3) l[1] += dd; else l[0] += dd;
        l[2] += xthSm(pts.slice(1, 5).map(([a, b]) => [a - w * .12, b - w * .22]));
        if (R() < .6){ const q = pts[2 + Math.floor(R() * 3)]; l[3] += `M${f1(q[0] - 2)},${f1(q[1])}q2,-1.6 4,0`; }
    }
    return `<g ${p.sh(.9)}>${L.map(([a, b, h, ch]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .16)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g><path d="${h}" stroke="#fff" stroke-width="${f1(w * .18)}" fill="none" stroke-linecap="round" opacity=".55"/><path d="${ch}" stroke="${dk(c, .55)}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`).join('')}</g>`;
}
// 春雨（透き通った細い麺）
function xthGlassNoodles(p, x, y, s, { n = 70, seed = 1, sy = .9, c = '#eceae2' } = {}){
    const R = rng(p.id + 'xthGn' + seed);
    let d = '', dl = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.15 + R() * .82), a0 = R() * 6.28, sweep = 1 + R() * 2.4;
        const cx = x + (R() - .5) * s * .14, cy = y + (R() - .5) * s * .14;
        const pts = Array.from({ length: 5 }, (_, j) => { const a = a0 + j / 4 * sweep, rj = rr * (1 + (R() - .5) * .3); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = xthSm(pts);
        d += one; if (R() < .35) dl += one;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.6)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="${dk(c, .3)}" stroke-width="2.6" opacity=".7"/><use href="#${id}" stroke="${c}" stroke-width="1.7" opacity=".92"/></g><path d="${dl}" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 卵豆腐の輪切り（黄色みのある円盤）
function xthEggTofu(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${f(s / 2)}" ry="${f(s * .44)}" fill="${p.g('#f3d98a', .25, .2)}" stroke="#c9a85a" stroke-width=".7"/></g>
        <ellipse rx="${f(s / 2 - 1.4)}" ry="${f(s * .44 - 1.4)}" fill="${p.rg('#f8e4a4', .2, .1, .4, .38)}"/>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .14)}" rx="${f(s * .2)}" ry="${f(s * .1)}" fill="#fff" opacity=".6"/></g>`;
}
// 肉団子（淡い豚のつくね）
function xthPorkBall(p, x, y, s, { seed = 1 } = {}){
    const c = '#cfae8a';
    return `<g ${p.sh(.7)}><g ${p.rough(1.4, .2)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg(c, .3, .32, .38, .35)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g></g>
        <ellipse cx="${f(x - s * .16)}" cy="${f(y - s * .18)}" rx="${f(s * .16)}" ry="${f(s * .09)}" fill="#fff" opacity=".6" transform="rotate(-30 ${f(x - s * .16)} ${f(y - s * .18)})"/>`;
}
// 白菜のそぎ切り（煮た）
const xthNapa = (p, x, y, s, r = 0, seed = 1) => K.leafPiece(p, x, y, s, r, { c: '#cfe0a0', vein: '#f4f7e4', seed, cooked: true });
// 芹菜（キンチャイ）の葉つき茎
function xthCelery(p, x, y, L, r = 0){
    return `<g ${T(x, y, r)}><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#86b84e" stroke-width="2.2" stroke-linecap="round"/><path d="M${f(-L / 2)},0 L${f(L / 2)},0" stroke="#d9efb6" stroke-width=".6" stroke-linecap="round" opacity=".7"/>
        ${[[L / 2, 0], [L * .1, -3], [L * .15, 3]].map(([a, b], i) => `<path ${T(a, b, i * 70 - 20, .55)} d="M0,0 Q-5,-3 -4.6,-7 Q-2.4,-9.6 0,-8 Q2.4,-9.6 4.6,-7 Q5,-3 0,0Z" fill="#4c9a32" stroke="#2c6a1e" stroke-width=".8"/>`).join('')}</g>`;
}
// ベビーコーン（縦半分、黄色のつぶつぶ）
function xthBabyCorn(p, x, y, L, r = 0){
    const w = L * .28;
    let dots = '';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) dots += `<circle cx="${f(-L * .36 + i * L * .17)}" cy="${f((j - .5) * w * .4)}" r="${f(w * .12)}" fill="#f6dc7a" opacity=".9"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f(-L / 2)},${f(-w * .35)} Q${f(-L / 2)},${f(-w / 2)} ${f(-L / 2 + w * .5)},${f(-w / 2)} L${f(L * .3)},${f(-w / 2)} Q${f(L / 2)},${f(-w * .3)} ${f(L / 2 + 1)},0 Q${f(L / 2)},${f(w * .3)} ${f(L * .3)},${f(w / 2)} L${f(-L / 2 + w * .5)},${f(w / 2)} Q${f(-L / 2)},${f(w / 2)} ${f(-L / 2)},${f(w * .35)}Z" fill="${p.g('#f3cf5a', .3, .25)}" stroke="#b88e24" stroke-width=".6"/></g>
        ${dots}<path d="M${f(-L * .4)},0 L${f(L * .38)},0" stroke="#e2b63a" stroke-width=".6" opacity=".7"/>
        ${xthShine(`M${f(-L * .38)},${f(-w * .25)} L${f(L * .2)},${f(-w * .25)}`, .9, .55)}</g>`;
}
// 花形に切ったにんじん（タイの炒め物の定番）
function xthCarrotFlower(p, x, y, s, r = 0){
    const pts = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.28, rr = i % 2 ? s * .4 : s / 2; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .6)}" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b85a18" stroke-width=".6"/></g><circle r="${f(s * .18)}" fill="#f6b070" opacity=".9"/><path d="M${f(-s * .25)},${f(-s * .18)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .08)},${f(-s * .26)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// キャベツのざく切り（炒めた・生）
const xthCabbage = (p, x, y, s, r = 0, { seed = 1, cooked = true } = {}) => K.leafPiece(p, x, y, s, r, { c: cooked ? '#cfe3a2' : '#dfeec0', vein: '#f4f8e6', seed, cooked });
// ブロッコリーの小房
const xthBroccoli = (p, x, y, s, r = 0) => K.broccoli(p, x, y, s, r, { c: '#4a9a3a' });
// 青パパイヤの千切り（淡い黄緑〜白、長い）
function xthPapaya(p, x, y, s, { seed = 1 } = {}){
    return xthShreds(p, x, y, s, { c: '#e4edc0', n: 62, w: 2.4, len: .36, seed, curve: .35, sy: .9 })
        + xthShreds(p, x, y, s * .92, { c: '#f3f6e4', n: 40, w: 2.2, len: .34, seed: seed + 1, curve: .4, sy: .9 })
        + xthShreds(p, x, y, s * .8, { c: '#d2e2a4', n: 22, w: 2.2, len: .3, seed: seed + 2, curve: .35, sy: .9 });
}
// キャベツのくし切り（ソムタムの添え）
function xthCabbageWedge(p, x, y, s, r = 0){
    const k = s / 40;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="M-20,-9 L20,-11 Q24,0 20,11 L-20,9 Q-23,0 -20,-9Z" fill="${p.g('#e4f0c6', .25, .2)}" stroke="#9ab86a" stroke-width=".7"/></g>
        <path d="M-19,-4 Q0,-7 19,-6 M-19,2 Q0,0 19,0 M-18,7 Q0,6 18,6" stroke="#f6faea" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M-19,-4 Q0,-7 19,-6 M-19,2 Q0,0 19,0 M-18,7 Q0,6 18,6" stroke="#b6cf86" stroke-width=".6" fill="none" opacity=".7"/>
        <path d="M-20,-9 L20,-11" stroke="#8cc45a" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 揚げたプラートゥー（短いサバ: 頭を折り曲げた、きつね色の皮）
function xthPlaTu(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'thpt' + seed + x);
    const h = L * .36;
    const body = xthSm([[-L * .42, -h * .2], [-L * .3, -h * .48], [-L * .05, -h * .52], [L * .2, -h * .4], [L * .36, -h * .16], [L * .4, 0], [L * .36, h * .16], [L * .2, h * .4], [-L * .05, h * .52], [-L * .3, h * .48], [-L * .42, h * .2]], true);
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
function xthKhaiJiao(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'thkj' + seed);
    const c = '#e9a93a', pts = ring(s / 2, 18, .22, R, 1.04, .9);
    let brown = '', bub = '', green = '';
    for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .4; brown += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(4 + R() * 9)}" ry="${f(2.5 + R() * 5)}" transform="rotate(${f(R() * 180)} ${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)})" fill="#b86a1a" opacity="${f(.15 + R() * .22)}"/>`; }
    for (let i = 0; i < 36; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .44, rr = 1.2 + R() * 2.6; bub += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(rr)}" fill="none" stroke="#fbe6a8" stroke-width="${f(.6 + R() * .6)}" opacity=".8"/>`; }
    for (let i = 0; i < 22; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .42, gx = Math.cos(a) * d, gy = Math.sin(a) * d; green += `<circle cx="${f(gx)}" cy="${f(gy)}" r="1.7" fill="none" stroke="${R() < .5 ? '#3f8f2f' : '#6aae44'}" stroke-width="1.1"/>`; }
    const sh = xthSm(pts, true);
    return `<g ${T(x, y)}><g ${p.sh(1.3)}><g ${p.rough(3, .12)}><path d="${sh}" fill="${p.rg(c, .3, .3, .36, .34)}" stroke="#b06c14" stroke-width="1"/></g></g>
        <g ${p.rough(3, .12)}><path d="${sh}" fill="none" stroke="#b8701a" stroke-width="5" opacity=".4"/>
        <path d="${xthSm(pts.map(([a, b]) => [a * .8, b * .8]), true)}" fill="none" stroke="#f6c860" stroke-width="3" opacity=".5"/></g>
        ${brown}
        <g ${p.crumb(.6)}><path d="${xthSm(pts.map(([a, b]) => [a * .86, b * .86]), true)}" fill="${lt(c, .12)}" opacity=".45"/></g>
        ${bub}${green}
        ${xthShine(`M${f(-s * .34)},${f(-s * .14)} Q${f(-s * .22)},${f(-s * .34)} ${f(s * .04)},${f(-s * .38)}`, 3, .55)}</g>`;
}
// 蒸し卵の表面（カイトゥン: なめらかな淡い黄色、少しの穴）
function xthSteamedEgg(p, cx, cy, R){
    const RR = rng(p.id + 'thse');
    let holes = '';
    for (let i = 0; i < 9; i++){ const a = RR() * 6.28, d = Math.sqrt(RR()) * R * .8; holes += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(.8 + RR() * 1.2)}" fill="#d9b35a" opacity=".5"/>`; }
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg('#f5d98a', .18, .18, .4, .38)}"/>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#d4b060" stroke-width="1.6" opacity=".6"/>
        ${holes}
        <path d="M${cx - R * .6},${cy - R * .1} A${R * .7},${R * .7} 0 0 1 ${cx - R * .1},${cy - R * .6}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// ナムプリックカピ（くすんだ茶紫の濃いペースト、唐辛子の粒）
function xthKapiDip(p, cx, cy, R){
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg('#6b4a3a', .2, .25, .4, .38)}"/>
        ${xthGrains(p, cx, cy, R * 1.6, { cols: ['#c8301c', '#e8552e', '#4f8a2a', '#8a6a52'], n: 44, size: 1.4, seed: 3 })}
        ${xthGrains(p, cx, cy, R * 1.4, { cols: ['#e8742e', '#f0a060'], n: 10, size: 1.2, seed: 5 })}
        <path d="M${cx - R * .55},${cy - R * .1} A${R * .65},${R * .65} 0 0 1 ${cx - R * .1},${cy - R * .55}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// 卵のかたまり（チャーハンの炒り卵）
function xthEggBits(p, x, y, s, { n = 10, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'theb' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 3.5 + R() * 3.5;
        out += `<path ${T(cx, cy)} d="${smooth(ring(rr, 7, .45, R, 1.2, .8), true, .8)}" fill="${p.g(R() < .5 ? '#f8d348' : '#fbe27a', .3, .18)}" stroke="#d2a420" stroke-width=".5"/>`;
    }
    return `<g ${p.sh(.5)}>${out}</g>`;
}

// =========================================================
// ここから x_th で足した部品
// =========================================================
const XTH_BLUE = '#2f5f9a';
// 器いろいろ: rooster（白に緑と赤）/ blue（白に藍の二重線）/ celadon（青磁）/ enamel（白いほうろうに青い縁）/ clay（素焼きの土鍋）/ melamine（色つきの樹脂皿）
function xthVessel(p, kind = 'rooster', { R = 94, shape = 'plate', inside = null } = {}){
    const deep = shape === 'bowl';
    if (kind === 'rooster') return deep ? xthBowl(p, { R: R - 2 }) : xthPlate(p, { R });
    const lip = deep ? .86 : .74;
    const r = R * lip;
    const hl = `<path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .22)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="${deep ? .55 : .8}"/>`;
    if (kind === 'blue'){
        const base = '#fbfaf6', ins = inside || '#f7f5ee';
        let dots = '';
        for (let i = 0; i < 16; i++){ const a = i / 16 * 6.283, rm = (R - 5 + r) / 2; dots += `<path ${T(100 + Math.cos(a) * rm, 100 + Math.sin(a) * rm, a * 57.3)} d="M-2.6,0 Q0,-2.4 2.6,0 Q0,2.4 -2.6,0Z" fill="${XTH_BLUE}" opacity=".75"/>`; }
        return `<g ${p.sh(deep ? 1.8 : 1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
            <circle cx="100" cy="100" r="${R - 2.4}" fill="none" stroke="${XTH_BLUE}" stroke-width="2.2"/>${dots}
            <circle cx="100" cy="100" r="${f1(r + 1.8)}" fill="none" stroke="${XTH_BLUE}" stroke-width="1.1"/>
            <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(ins, .1, deep ? .22 : .07, .62, .64)}"/>${hl}`;
    }
    if (kind === 'celadon'){
        const g = '#9fc0a8', ins = inside || '#cfe0cf';
        return `<g ${p.sh(deep ? 1.8 : 1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(g, .25, .25, .35, .3)}"/></g>
            <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${lt(g, .35)}" stroke-width="1.2" opacity=".8"/>
            <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(ins, .15, deep ? .2 : .1, .62, .64)}"/>
            <circle cx="100" cy="100" r="${f1(r)}" fill="none" stroke="${dk(g, .2)}" stroke-width="1" opacity=".6"/>${hl}`;
    }
    if (kind === 'enamel'){
        const ins = inside || '#f7f7f2';
        return `<g ${p.sh(deep ? 1.8 : 1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#f5f6f2', .2, .12, .38, .32)}"/></g>
            <circle cx="100" cy="100" r="${R - 1.6}" fill="none" stroke="#2d5a8c" stroke-width="3.2"/>
            <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(ins, .1, deep ? .2 : .08, .62, .64)}"/>
            <circle cx="100" cy="100" r="${f1(r)}" fill="none" stroke="#dfe1da" stroke-width="1.4"/>${hl}`;
    }
    if (kind === 'clay'){
        const g = '#9a5a36', ins = inside || '#6a3a22';
        return `<g ${p.sh(2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(g, .2, .3, .35, .3)}"/></g>
            <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${dk(g, .3)}" stroke-width="1.4" opacity=".7"/>
            <circle cx="100" cy="100" r="${R - 7}" fill="none" stroke="${lt(g, .2)}" stroke-width="1" opacity=".6"/>
            <circle cx="100" cy="100" r="${f1(R * .84)}" fill="${p.rg(ins, .1, .25, .62, .64)}"/>
            <path d="M${f1(100 - R * .72)},${f1(100 - R * .42)} A${f1(R * .84)},${f1(R * .84)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .8)}" stroke="#f3d2b8" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".45"/>`;
    }
    if (kind === 'melamine'){
        const g = inside || '#f2e2b8';
        return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(g, .25, .2, .38, .32)}"/></g>
            <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${dk(g, .25)}" stroke-width="1.6" opacity=".8"/>
            <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(lt(g, .5), .1, deep ? .2 : .08, .62, .64)}"/>
            <circle cx="100" cy="100" r="${f1(r)}" fill="none" stroke="${dk(g, .1)}" stroke-width="1.6" opacity=".6"/>${hl}`;
    }
    return '';
}
// 魚用の長い楕円皿（白に藍の線）
function xthFishPlate(p, { rx = 96, ry = 66, rim = XTH_BLUE, base = '#fbfaf6' } = {}){
    return `<g ${p.sh(1.6)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(base, .2, .14, .38, .32)}"/></g>
        <ellipse cx="100" cy="100" rx="${rx - 3.4}" ry="${ry - 3.4}" fill="none" stroke="${rim}" stroke-width="2"/>
        <ellipse cx="100" cy="100" rx="${rx - 7}" ry="${ry - 7}" fill="none" stroke="${rim}" stroke-width=".8" opacity=".7"/>
        <ellipse cx="100" cy="100" rx="${f1(rx * .86)}" ry="${f1(ry * .8)}" fill="${p.rg(base, .06, .1, .6, .62)}"/>
        <path d="M${100 - rx * .72},${100 - ry * .38} Q${100 - rx * .55},${100 - ry * .78} ${100 - rx * .2},${100 - ry * .82}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 魚の形のステンレス蒸し皿（プラーヌンマナオ）
function xthFishTray(p){
    const outer = 'M8,100 C20,50 70,36 120,44 C146,48 160,60 168,72 L194,50 Q198,100 194,150 L168,128 C160,140 146,152 120,156 C70,164 20,150 8,100Z';
    return `<g ${p.sh(1.8)}><path d="${outer}" fill="${p.g('#d6dade', .35, .3)}" stroke="#8a9096" stroke-width="1"/></g>
        <path d="M20,100 C30,60 72,50 120,56 C142,60 154,70 160,82 Q164,100 160,118 C154,130 142,140 120,144 C72,150 30,140 20,100Z" fill="${p.rg('#b9bfc4', .25, .25, .55, .55)}" stroke="#9aa0a6" stroke-width="1"/>
        <path d="M30,78 Q50,56 92,52" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M176,66 L186,62 M176,134 L186,138" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>`;
}

// 一尾の魚（揚げ・蒸し）。L は全長、頭は左
function xthFish(p, x, y, L, r = 0, { mode = 'fried', seed = 1, scores = 4 } = {}){
    const h = L * .2;
    const col = mode === 'fried' ? { back: '#a8682a', side: '#d49a48', belly: '#ecc27a', line: '#6a3a12', fin: '#b8742e' }
        : mode === 'grilled' ? { back: '#5a5a52', side: '#a8a28e', belly: '#e8dcc0', line: '#3a3424', fin: '#7a6a52' }
        : { back: '#8e9692', side: '#dfe0d8', belly: '#f6f3ea', line: '#7a807a', fin: '#c4c6bc' };
    const body = `M${-L * .5},${h * .05} C${-L * .46},${-h * .7} ${-L * .3},${-h * 1.02} ${-L * .05},${-h} C${L * .18},${-h * .95} ${L * .32},${-h * .5} ${L * .36},${-h * .18} L${L * .36},${h * .18} C${L * .32},${h * .5} ${L * .18},${h * .95} ${-L * .05},${h} C${-L * .3},${h * 1.02} ${-L * .46},${h * .7} ${-L * .5},${h * .05}Z`;
    const tail = `M${L * .34},0 L${L * .5},${-h * .78} Q${L * .44},0 ${L * .5},${h * .78}Z`;
    const cid = p.uid();
    let sc = '';
    for (let i = 0; i < scores; i++){ const sx = -L * .2 + i * L * .13; sc += `<path d="M${f1(sx + L * .03)},${f1(-h * .78)} Q${f1(sx - L * .02)},0 ${f1(sx + L * .03)},${f1(h * .78)}" stroke="${dk(col.side, .4)}" stroke-width="${mode === 'fried' ? 2.4 : 1.6}" fill="none" stroke-linecap="round" opacity=".55"/><path d="M${f1(sx + L * .045)},${f1(-h * .7)} Q${f1(sx)},0 ${f1(sx + L * .045)},${f1(h * .7)}" stroke="${mode === 'fried' ? '#f6d68a' : '#fff'}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>`; }
    return `<g ${T(x, y, r)}>
        <g ${p.sh(1.1)}><path d="${tail}" fill="${p.g(col.fin, .25, .3)}" stroke="${dk(col.fin, .35)}" stroke-width=".7"/>
        <path d="M${-L * .1},${-h * .92} Q${L * .08},${-h * 1.45} ${L * .26},${-h * .62}Z" fill="${p.g(col.fin, .25, .3)}" stroke="${dk(col.fin, .35)}" stroke-width=".6"/>
        <path d="M${-L * .05},${h * .95} Q${L * .1},${h * 1.35} ${L * .24},${h * .66}Z" fill="${p.g(col.fin, .25, .3)}" stroke="${dk(col.fin, .35)}" stroke-width=".6"/>
        ${mode === 'fried' ? `<g ${p.rough(1.6, .16)}>` : '<g>'}<path d="${body}" fill="${p.g(col.side, .25, .3)}" stroke="${dk(col.side, .4)}" stroke-width=".9"/></g></g>
        <defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs>
        <g clip-path="url(#${cid})"><path d="M${-L * .55},${-h * .1} Q0,${-h * .5} ${L * .4},${-h * .12} L${L * .4},${-h * 1.2} L${-L * .55},${-h * 1.2}Z" fill="${col.back}" opacity=".55"/>
        <path d="M${-L * .55},${h * .35} Q0,${h * .55} ${L * .4},${h * .2} L${L * .4},${h * 1.2} L${-L * .55},${h * 1.2}Z" fill="${col.belly}" opacity=".7"/>
        ${mode === 'fried' ? `<g ${p.crumb(.8)}><path d="${body}" fill="${col.side}" opacity=".35"/></g>` : ''}${sc}</g>
        <path d="M${-L * .3},${-h * .78} Q${-L * .25},0 ${-L * .3},${h * .78}" stroke="${dk(col.side, .45)}" stroke-width="1.2" fill="none" opacity=".7"/>
        <path d="M${-L * .27},${h * .1} Q${-L * .2},${h * .3} ${-L * .16},${h * .55} L${-L * .22},${h * .25}Z" fill="${col.fin}" opacity=".8"/>
        <circle cx="${f1(-L * .4)}" cy="${f1(-h * .22)}" r="${f1(h * .17)}" fill="${mode === 'fried' ? '#f0dcb0' : '#f4efe2'}" stroke="#3a3a3a" stroke-width=".7"/><circle cx="${f1(-L * .4)}" cy="${f1(-h * .22)}" r="${f1(h * .08)}" fill="#222"/>
        ${xthShine(`M${-L * .22},${-h * .66} Q0,${-h * .9} ${L * .2},${-h * .6}`, 1.8, .7)}</g>`;
}
// 鶏の脚1本（ガイヤーン: もも＋ドラムスティック、こんがり焼けた皮と細い焼き網の跡）
function xthChickenLeg(p, x, y, s, r = 0, { c = '#c98432', seed = 1 } = {}){
    const R = rng(p.id + 'xthleg' + seed + x);
    const k = s / 70;
    const thigh = smooth([[-34, -2], [-30, -15], [-16, -21], [0, -19], [10, -12], [12, 0], [10, 12], [-2, 19], [-18, 20], [-30, 12]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]), true, .9);
    const drum = 'M4,-13 Q18,-13 28,-6 Q32,-3 33,0 Q32,3 28,6 Q18,13 4,13Z';
    let grill = '';
    for (let i = 0; i < 7; i++){ const gx = -36 + i * 10; grill += `M${gx},-22 L${gx + 12},22 `; }
    let blis = '';
    for (let i = 0; i < 8; i++) blis += `<ellipse cx="${f1(-28 + R() * 50)}" cy="${f1(-14 + R() * 28)}" rx="${f1(1.5 + R() * 2.5)}" ry="${f1(1 + R() * 1.4)}" fill="#f6cc80" opacity=".55"/>`;
    const cid = p.uid();
    return `<g ${T(x, y, r, k)}><g ${p.sh(1.1)}>
        <path d="M30,-4 Q36,-7 40,-5 Q43,-3 42,0 Q43,3 40,5 Q36,7 30,4Z" fill="${p.g('#f2e4c8', .2, .25)}" stroke="#b89a6a" stroke-width=".7"/>
        <path d="${drum}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .45)}" stroke-width=".8"/>
        <path d="${thigh}" fill="${p.g(c, .28, .32)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g>
        <defs><clipPath id="${cid}"><path d="${thigh}"/><path d="${drum}"/></clipPath></defs>
        <g clip-path="url(#${cid})"><path d="${grill}" stroke="#5a2a08" stroke-width="1.6" stroke-linecap="round" opacity=".5"/><path d="M-40,10 Q0,24 36,6 L36,26 L-40,26Z" fill="${dk(c, .35)}" opacity=".3"/>${blis}</g>
        <path d="M6,-12 Q10,0 6,12" stroke="${dk(c, .4)}" stroke-width="1" fill="none" opacity=".6"/>
        ${xthShine('M-28,-12 Q-14,-19 0,-16', 2.2, .7)}${xthShine('M10,-9 Q20,-10 27,-5', 1.4, .6)}</g>`;
}
// 山の下地（ひき肉・揚げ物の山の、すき間を埋める面）
function xthMound(p, x, y, s, c, { seed = 1, sy = 1, rough = true } = {}){
    const R = rng(p.id + 'xthmd' + seed + x);
    const d = smooth(ring(s / 2, 12, .18, R, 1, sy), true, .9);
    return `<g ${p.sh(.9)}>${rough ? `<g ${p.rough(3, .1)}>` : '<g>'}<path ${T(x, y)} d="${d}" fill="${p.rg(c, .2, .3, .38, .35)}"/></g></g>`;
}
// 揚げた豚のひと口切り（ムートートガティアム）
function xthFriedPork(p, x, y, s, r = 0, { c = '#c07a30', seed = 1 } = {}){
    const R = rng(p.id + 'xthfp' + seed + x + y);
    const pts = ring(s / 2, 8, .35, R, 1.3, .75);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><g ${p.rough(1.4, .2)}><path d="${smooth(pts, true, .6)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .45)}" stroke-width=".7"/></g></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .55 - 1, b * .5 - 1]), true, .6)}" fill="${lt(c, .2)}" opacity=".5"/>
        ${xthShine(`M${f1(-s * .32)},${f1(-s * .14)} Q${f1(-s * .1)},${f1(-s * .3)} ${f1(s * .18)},${f1(-s * .24)}`, 1.3, .6)}</g>`;
}
// カシューナッツ（勾玉形、きつね色）
function xthCashew(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-9,-2 Q-9,-9 -1,-9 Q8,-9 9,0 Q9,8 2,9 Q-3,9 -3,4 Q-2,0 2,0 Q4,0 3,-3 Q0,-5 -4,-3 Q-7,0 -9,-2Z" fill="${p.g('#e3b066', .35, .3)}" stroke="#a8742c" stroke-width=".6"/></g>
        ${xthShine('M-6,-5 Q-1,-8 4,-6', 1.2, .6)}</g>`;
}
// 乾燥唐辛子の切れ端（黒っぽい赤、つや）
function xthDriedChili(p, x, y, L, r = 0){
    const w = L * .34;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${L}" height="${f1(w)}" rx="${f1(w * .45)}" fill="${p.g('#9a1e12', .35, .3)}" stroke="#5a0e06" stroke-width=".5"/></g>
        <ellipse cx="${f1(L / 2 - w * .2)}" cy="0" rx="${f1(w * .22)}" ry="${f1(w * .4)}" fill="#e8c27a" opacity=".8"/>
        ${xthShine(`M${f1(-L * .35)},${f1(-w * .2)} L${f1(L * .2)},${f1(-w * .2)}`, .9, .6)}</g>`;
}
// きくらげ（黒茶の波うつ耳）
function xthWoodEar(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthwe' + seed + x + y);
    const pts = ring(s / 2, 10, .45, R, 1.25, .75);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .8)}" fill="${p.g('#4a3226', .25, .3)}" stroke="#20140c" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .55, b * .5]), true, .8)}" fill="none" stroke="#6a4a38" stroke-width=".9" opacity=".8"/>
        ${xthShine(`M${f1(-s * .3)},${f1(-s * .12)} Q${f1(-s * .1)},${f1(-s * .26)} ${f1(s * .18)},${f1(-s * .2)}`, 1.1, .45)}</g>`;
}
// ミントの葉（明るい緑、しわ）
const xthMint = (p, x, y, s, r = 0) => xthLeaf(p, x, y, s, r, { c: '#4fa040', narrow: .8 });
// 揚げたエシャロット（赤茶の輪のかけら）
function xthCrispShallot(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'xthcs' + seed + x + y);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 2 + R() * 2, a0 = R() * 6.28, sw = 1.6 + R() * 2;
        const seg = `M${f1(cx + Math.cos(a0) * rr)},${f1(cy + Math.sin(a0) * rr)}A${f1(rr)},${f1(rr * .8)} 0 0 1 ${f1(cx + Math.cos(a0 + sw) * rr)},${f1(cy + Math.sin(a0 + sw) * rr)}`;
        if (R() < .5) d1 += seg; else d2 += seg;
    }
    return `<path d="${d1}" stroke="#a8541c" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="${d2}" stroke="#d9862e" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
}
// カレーの表面（とろみ、ココナッツクリームの筋、赤い油）
function xthCurry(p, cx, cy, R, c, { cream = '#f6ead2', creamOp = .75, oil = '#d8401c', seed = 1, swirl = true, oilN = 14 } = {}){
    const Rn = rng(p.id + 'xthcur' + seed);
    let sw = '';
    if (swirl) for (let i = 0; i < 3; i++){ const a = Rn() * 6.28, rr = R * (.3 + Rn() * .45); sw += `<path d="M${f1(cx + Math.cos(a) * rr)},${f1(cy + Math.sin(a) * rr)} A${f1(rr)},${f1(rr)} 0 0 1 ${f1(cx + Math.cos(a + 1.4) * rr)},${f1(cy + Math.sin(a + 1.4) * rr)}" stroke="${cream}" stroke-width="${f1(2.4 + Rn() * 2)}" fill="none" stroke-linecap="round" opacity="${creamOp}"/>`; }
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg(c, .2, .25, .42, .4)}"/>${sw}${xthOil(p, cx, cy, R * 1.8, { n: oilN, c: oil, op: .45, rmax: 2.2, seed })}`;
}
// 細切りのこぶみかんの葉（パネーン・トートマン）
const xthLimeShreds = (p, x, y, s, n = 14, seed = 1) => xthShreds(p, x, y, s, { c: '#2f6a26', n, w: 1.1, len: .14, seed, curve: .2 });
// 牛肉の角切り（煮込み: 角の丸い塊、繊維の筋、照り）
function xthBeefChunk(p, x, y, s, r = 0, { c = '#7a4626', seed = 1 } = {}){
    const R = rng(p.id + 'xthbc' + seed + x + y);
    const w = s / 2, h = s * .4;
    const pts = [[-w, -h], [-w * .2, -h * 1.08], [w, -h * .9], [w * 1.05, h * .1], [w * .9, h], [-w * .1, h * 1.05], [-w * 1.02, h * .8]].map(([a, b]) => [a + (R() - .5) * s * .1, b + (R() - .5) * s * .1]);
    let fib = '';
    for (let i = 0; i < 4; i++){ const yy = -h * .6 + i * h * .4; fib += `M${f1(-w * .8)},${f1(yy)} Q0,${f1(yy + (R() - .5) * 3)} ${f1(w * .8)},${f1(yy + 1)} `; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .5)}" fill="${p.g(c, .28, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        <path d="${fib}" stroke="${dk(c, .35)}" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M${f1(-w * .7)},${f1(h * .3)} Q0,${f1(h * .1)} ${f1(w * .6)},${f1(h * .5)}" stroke="#d8a868" stroke-width="1.4" fill="none" opacity=".45"/>
        ${xthShine(`M${f1(-w * .7)},${f1(-h * .6)} Q${f1(-w * .1)},${f1(-h * .95)} ${f1(w * .5)},${f1(-h * .7)}`, 1.6, .7)}</g>`;
}
// 小玉ねぎまるごと（マッサマン）
function xthPearlOnion(p, x, y, s){
    return `<g ${p.sh(.6)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg('#e8c98a', .3, .3, .36, .34)}" stroke="#a8803a" stroke-width=".6"/></g>
        <circle cx="${x}" cy="${y}" r="${f1(s * .32)}" fill="none" stroke="#c9a056" stroke-width=".7" opacity=".7"/><ellipse cx="${f1(x - s * .16)}" cy="${f1(y - s * .18)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" fill="#fff" opacity=".7"/>`;
}
// 大きめの豚の薄切り（揚げ・炒め・煮）
const xthPorkSlice = (p, x, y, s, r = 0, o = {}) => K.porkSlice(p, x, y, s, r, { c: '#b87a3c', fat: '#f0d6a0', gloss: .6, ...o });

const D = {};
// 書き出す前に、小数を1桁にそろえ、余分な空白を詰める（scale() の中はそのまま）
const xthMin = svg => svg.replace(/scale\([^)]*\)|(-?\d+\.\d{2,})/g, (m, num) => num ? String(Math.round(+num * 10) / 10) : m).replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ');
export default new Proxy(D, { get: (t, k) => typeof t[k] === 'function' ? (p => xthMin(t[k](p))) : t[k] });

// ライムの輪切り
function xthLimeRound(p, x, y, s){
    return `<g ${p.sh(.5)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="#4f9a2f"/></g><circle cx="${x}" cy="${y}" r="${f1(s / 2 - 1.3)}" fill="#eef4c4"/><circle cx="${x}" cy="${y}" r="${f1(s / 2 - 2.4)}" fill="${p.rg('#d2e690', .25, .1)}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${x},${y} L${f1(x + Math.cos(i * .785) * (s / 2 - 2.4))},${f1(y + Math.sin(i * .785) * (s / 2 - 2.4))}" stroke="#f8fbe2" stroke-width=".9"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.2" fill="#f8fbe2"/>`;
}
// にんにくのみじん・薄切り（生、白っぽい）
const xthGarlicBits = (p, x, y, s, n = 16, seed = 1) => xthGrains(p, x, y, s, { cols: ['#f6eed6', '#e8dcb8'], n, size: 1.4, seed });
// ジェーオ（焼き唐辛子と炒り米粉のたれ）
function xthJaew(p, x, y, R){
    return xthSaucer(p, x, y, R, '#7a2a14') + xthGrains(p, x, y, R * 1.3, { cols: ['#c8301c', '#e8a050', '#4f8a2a'], n: Math.round(R * 1.4), size: 1.1, seed: 4 });
}

Object.assign(D, {
    // ムートートガティアム（หมูทอดกระเทียม）: ご飯の横に、きつね色に揚げた豚の薄切りと山盛りの揚げにんにく、こしょう、きゅうり、パクチー
    th_mootodkratiam: p => [
        xthPlate(p),
        xthRice(p, 70, 102, 96, { density: 1.25, grain: 3.8, sy: 1.12, layers: 1 }),
        xthMound(p, 128, 102, 84, '#a86a2a', { seed: 1, sy: 1.15 }),
        ...[[118, 70, 20], [142, 78, -30], [154, 102, 60], [146, 128, 10], [124, 140, 80], [112, 116, -40], [130, 104, 30], [110, 90, 100], [138, 92, 150], [128, 124, -70], [150, 116, 20], [116, 132, 40]].map(([x, y, r], i) => xthFriedPork(p, x, y, 24 + (i % 3) * 3, r, { c: i % 2 ? '#b8702a' : '#c8843a', seed: i })),
        `<g ${p.sh(.4)}>`, xthFriedGarlic(p, 130, 100, 66, 44, 1), xthFriedGarlic(p, 128, 98, 40, 22, 2), `</g>`,
        xthPepper(p, 130, 104, 70, 26),
        `<g ${p.sh(.4)}>`, xthCucumber(p, 58, 150, 15, 20), xthCucumber(p, 74, 158, 15, 40), xthCucumber(p, 44, 136, 14, 0), `</g>`,
        xthCoriander(p, 74, 62, 18, -20), xthCoriander(p, 150, 70, 15, 40),
    ].join(''),

    // ガイパットキン（ไก่ผัดขิง）: 鶏、針しょうが、きくらげ、玉ねぎ、ねぎ、赤唐辛子。淡い茶のたれ
    th_kaiphadkhing: p => [
        xthVessel(p, 'blue'),
        K.pool(p, 100, 102, 124, '#a8743c', { op: .55, seed: 2, sy: .9 }),
        `<g ${p.sh(.6)}>`,
        ...[[78, 82, 30, -40], [134, 76, 30, 30], [70, 122, 28, 70], [128, 132, 30, -30], [104, 104, 28, 10], [150, 108, 24, 60], [96, 140, 24, 20]].map(([x, y, s, r], i) => xthWoodEar(p, x, y, s, r, { seed: i })),
        xthOnion(p, 112, 66, 24, 30), xthOnion(p, 66, 100, 22, -60), xthOnion(p, 110, 144, 22, 140), xthOnion(p, 148, 130, 20, 60),
        ...[[94, 80, 30, 20], [124, 98, 30, -30], [88, 124, 30, 60], [118, 120, 28, 120], [70, 72, 26, 10], [146, 88, 26, -60], [80, 146, 26, 40], [138, 146, 24, 90], [56, 112, 24, 120]].map(([x, y, s, r], i) => xthChickenSlice(p, x, y, s, r, { seed: i + 1, c: i % 2 ? '#c8945a' : '#d4a46a' })),
        `</g>`,
        xthShreds(p, 100, 102, 120, { c: '#f2dc96', n: 46, w: 1.8, len: .26, seed: 3, curve: .3 }),
        `<g ${p.sh(.4)}>`, ...[[84, 100, 30], [120, 80, -40], [108, 128, 70], [138, 116, -10], [66, 88, 50], [96, 148, -20]].map(([x, y, r], i) => xthScallionSeg(p, x, y, 22, r, { white: i % 3 === 2 })), `</g>`,
        xthChiliSlice(p, 104, 92, 11, 20), xthChiliSlice(p, 130, 108, 10, -50), xthChiliSlice(p, 82, 132, 10, 70), xthChiliSlice(p, 72, 98, 9, 0),
    ].join(''),

    // ガイパットメットマムアン（ไก่ผัดเม็ดมะม่วงหิมพานต์）: 揚げた鶏、カシューナッツ、玉ねぎ、パプリカ、ねぎ、乾燥唐辛子。濃い照り
    th_kaimetmamuang: p => [
        xthPlate(p),
        K.pool(p, 100, 102, 130, '#9a4a1e', { op: .9, seed: 3, sy: .92 }),
        `<g ${p.sh(.7)}>`,
        xthOnion(p, 66, 78, 26, -30), xthOnion(p, 136, 136, 26, 150), xthOnion(p, 130, 62, 24, 40), xthOnion(p, 58, 124, 24, 100), xthOnion(p, 152, 98, 22, -80),
        K.pepperPiece(p, 98, 64, 18, 20, { c: '#d83a24' }), K.pepperPiece(p, 150, 118, 17, -40, { c: '#d83a24' }), K.pepperPiece(p, 86, 146, 17, 60, { c: '#3f8f2f' }), K.pepperPiece(p, 52, 100, 16, 10, { c: '#3f8f2f' }), K.pepperPiece(p, 120, 98, 15, 80, { c: '#d83a24' }),
        ...[[84, 88, 30, 20], [122, 82, 30, -30], [100, 116, 32, 60], [70, 112, 28, 100], [134, 116, 28, 10], [104, 72, 26, 140], [146, 82, 24, 60], [116, 142, 26, -40], [66, 140, 22, 30], [102, 96, 24, 0]].map(([x, y, s, r], i) => xthChicken(p, x, y, s, r, { c: i % 2 ? '#c27a3c' : '#b56c32', seed: i })),
        `</g>`,
        `<g ${p.sh(.4)}>`,
        ...[[80, 70, 30], [146, 106, -40], [94, 104, 120], [126, 130, 70], [56, 88, -10], [104, 150, 20], [136, 70, 160], [72, 128, 80], [112, 60, -60], [152, 138, 40], [118, 112, 10]].map(([x, y, r]) => xthCashew(p, x, y, 15, r)),
        ...[[96, 86, 30], [134, 98, -50], [86, 124, 70], [116, 72, 10], [60, 112, 60], [150, 88, -20], [140, 146, 100], [110, 128, 140]].map(([x, y, r]) => xthDriedChili(p, x, y, 13, r)),
        ...[[90, 76, 40], [128, 122, -30], [70, 98, 80], [108, 138, 10], [140, 76, 60]].map(([x, y, r]) => xthScallionSeg(p, x, y, 20, r)),
        `</g>`,
    ].join(''),

    // パネーンムー（พะแนงหมู）: 濃い赤橙のとろりとしたカレーに豚の薄切り、ココナッツクリーム、細切りのこぶみかんの葉、赤唐辛子
    th_panangmoo: p => [
        xthVessel(p, 'blue', { shape: 'bowl' }),
        xthCurry(p, 100, 100, 79, '#c4502a', { cream: '#f4dcc0', creamOp: .5, oil: '#e0401a', oilN: 18 }),
        `<g ${p.sh(.7)}>`,
        ...[[80, 74, -20], [122, 70, 30], [70, 106, 70], [112, 98, -10], [140, 104, 80], [88, 132, 20], [126, 132, -40], [100, 78, 60], [60, 86, 110], [146, 80, 10], [104, 150, 0]].map(([x, y, r], i) => xthPorkSlice(p, x, y, 36, r, { c: i % 2 ? '#b8562c' : '#c8643a', fat: '#ecb88a', char: false, seed: i, gloss: .7 })),
        `</g>`,
        `<path d="M70,96 Q90,84 112,92 Q128,98 140,90 M84,122 Q104,112 124,120" stroke="#fbf0dc" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".92"/>`,
        `<path d="M70,96 Q90,84 112,92 Q128,98 140,90 M84,122 Q104,112 124,120" stroke="#e8c8a0" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7" transform="translate(0 2)"/>`,
        xthLimeShreds(p, 104, 104, 80, 22, 1),
        xthChiliSlice(p, 96, 92, 12, 30), xthChiliSlice(p, 120, 114, 12, -40), xthChiliSlice(p, 80, 116, 11, 80), xthChiliSlice(p, 132, 86, 10, 10),
        xthLeaf(p, 108, 124, 16, -30, { c: '#2f7a2a', narrow: .75 }),
        xthSoupShine(100, 100, 79, .3),
    ].join(''),

    // マッサマンカレー（แกงมัสมั่นเนื้อ）: 茶橙のこっくりしたカレーに、大きな牛肉、じゃがいも、小玉ねぎ、ピーナッツ
    th_massamannuea: p => [
        xthVessel(p, 'celadon', { shape: 'bowl', inside: '#d8e6d6' }),
        xthCurry(p, 100, 100, 78, '#b06a2a', { cream: '#e8b878', creamOp: .45, oil: '#d0701c', oilN: 16, seed: 2 }),
        xthWide(1.1),
        `<g ${p.sh(.8)}>`,
        K.potato(p, 74, 78, 34, 20, { c: '#e8b45a', seed: 1 }), K.potato(p, 132, 122, 34, -30, { c: '#e8b45a', seed: 2 }), K.potato(p, 70, 128, 30, 60, { c: '#e8b45a', seed: 3 }), K.potato(p, 136, 72, 28, 100, { c: '#e8b45a', seed: 4 }),
        xthBeefChunk(p, 104, 76, 32, 10, { seed: 1 }), xthBeefChunk(p, 100, 110, 34, 40, { seed: 2 }), xthBeefChunk(p, 138, 98, 28, -20, { seed: 3 }), xthBeefChunk(p, 100, 144, 28, 70, { seed: 4 }), xthBeefChunk(p, 62, 102, 26, 10, { seed: 5 }),
        `</g>`,
        xthPearlOnion(p, 120, 92, 15), xthPearlOnion(p, 84, 98, 14), xthPearlOnion(p, 118, 144, 14), xthPearlOnion(p, 90, 60, 12),
        `<g ${p.sh(.4)}>`, xthGrains(p, 100, 100, 120, { cols: ['#e8bc7a', '#d4a05a', '#f2d4a0'], n: 22, size: 3, seed: 5 }), `</g>`,
        '</g>',
        xthSoupShine(100, 100, 78, .3),
    ].join(''),

    // ガイヤーン（ไก่ย่าง）: こんがり焼いた鶏の脚2本、ジェーオのたれ、キャベツ、きゅうり、パクチー
    th_kaiyang: p => [
        xthVessel(p, 'enamel'),
        `<g ${p.sh(.5)}>`, xthCabbageWedge(p, 140, 142, 36, -30), xthCucumber(p, 60, 146, 15, 20), xthCucumber(p, 74, 156, 15, 40), `</g>`,
        xthChickenLeg(p, 90, 74, 100, 12, { seed: 1 }),
        xthChickenLeg(p, 92, 120, 100, -8, { seed: 2, c: "#c07a2e" }),
        xthJaew(p, 150, 70, 18),
        xthCoriander(p, 54, 108, 18, -20), xthCoriander(p, 126, 150, 15, 40),
    ].join(''),

    // ラープムー（ลาบหมู）: 炒り米粉をまぶした豚ひき肉、エシャロット、ミント、ねぎ、唐辛子。添えにキャベツといんげん
    th_larbmoo: p => [
        xthVessel(p, 'melamine', { inside: '#cfe0b0' }),
        `<g ${p.sh(.5)}>`, xthCabbageWedge(p, 150, 128, 32, -60), ...[[150, 82, 70], [158, 96, 80], [144, 70, 60]].map(([x, y, r]) => xthLongBean(p, x, y, 26, r, { c: '#5aa03a' })), `</g>`,
        xthMound(p, 92, 100, 112, '#a87a50', { seed: 1, sy: 1.05 }),
        xthMince(p, 92, 100, 108, { n: 100, c: '#a87a4e', seed: 1 }), xthMince(p, 92, 100, 80, { n: 40, c: '#8e6038', seed: 2 }),
        xthGrains(p, 92, 100, 100, { cols: ['#e2c08a', '#d4a868'], n: 60, size: .9, seed: 3 }),
        xthGrains(p, 92, 100, 96, { cols: ['#b8301c'], n: 24, size: .8, seed: 4 }),
        xthShallot(p, 80, 84, 14, 20), xthShallot(p, 108, 116, 13, -30), xthShallot(p, 70, 118, 12, 60), xthShallot(p, 112, 76, 12, 10),
        `<g ${p.sh(.4)}>`, ...[[96, 92, -20], [72, 98, 50], [110, 98, 100], [88, 128, 20], [64, 80, -60], [104, 132, 140], [120, 84, 30]].map(([x, y, r], i) => xthMint(p, x, y, 15 + (i % 3) * 2, r)), `</g>`,
        xthScallions(p, 92, 100, 90, 18, 2),
        xthCoriander(p, 80, 140, 14, 30),
    ].join(''),

    // ゲーンクアファクトン（แกงคั่วฟักทอง）: 橙色のココナッツカレーに、緑の皮つきのかぼちゃ、豚バラ、こぶみかんの葉、赤唐辛子
    th_kaengkhuafaktong: p => [
        xthBowl(p),
        xthCurry(p, 100, 100, 79, '#d8722e', { cream: '#f6dcb4', creamOp: .5, oil: '#e2501c', oilN: 16, seed: 3 }),
        xthWide(1.1),
        `<g ${p.sh(.8)}>`,
        ...[[76, 80, 34, 20], [126, 72, 34, -30], [140, 116, 32, 70], [94, 128, 34, 140], [62, 116, 28, -60], [108, 100, 30, 200], [120, 148, 26, 10]].map(([x, y, s, r]) => K.kabocha(p, x, y, s, r)),
        `</g>`,
        `<g ${p.sh(.6)}>`, ...[[100, 70, 30], [80, 104, -20], [128, 96, 60], [118, 126, -40], [72, 140, 10], [146, 90, 100]].map(([x, y, r], i) => xthPorkSlice(p, x, y, 30, r, { c: '#d09a6a', fat: '#f4e2c0', char: false, seed: i, gloss: .6 })), `</g>`,
        xthLimeLeaf(p, 104, 112, 28, -30, { torn: true }), xthLimeLeaf(p, 66, 96, 24, 60, { torn: true }), xthLimeLeaf(p, 136, 136, 22, 120, { torn: true }),
        xthChiliSlice(p, 92, 90, 11, 30), xthChiliSlice(p, 128, 110, 10, -50), xthChiliSlice(p, 84, 120, 10, 60),
        '</g>',
        xthSoupShine(100, 100, 79, .3),
    ].join(''),

    // プラーラートプリック（ปลาราดพริก）: 長皿に、からりと揚げた一尾魚、赤い甘辛の唐辛子だれ、揚げたバジル
    th_plaraadprik: p => [
        xthFishPlate(p),
        xthFish(p, 100, 100, 164, -4, { mode: 'fried', scores: 4 }),
        `<path d="M58,92 Q80,74 112,80 Q134,86 146,98 Q128,114 104,116 Q76,118 58,104Z" fill="#c8301c" opacity=".88"/>`,
        `<path d="M58,92 Q80,74 112,80 Q134,86 146,98" stroke="#e85a30" stroke-width="2" fill="none" opacity=".7"/>`,
        xthGrains(p, 100, 98, 70, { cols: ['#f0c27a', '#a8140c', '#f6e0b0'], n: 34, size: 1.4, seed: 2, sy: .45 }),
        xthChiliSlice(p, 80, 92, 11, 20), xthChiliSlice(p, 104, 102, 11, -40), xthChiliSlice(p, 124, 96, 10, 60), xthChiliSlice(p, 92, 108, 9, 0), xthChiliSlice(p, 116, 86, 9, 100),
        `<g ${p.sh(.4)}>`, ...[[68, 82, -30], [140, 88, 40], [100, 84, 10], [78, 112, 120], [128, 108, 80]].map(([x, y, r]) => xthLeaf(p, x, y, 15, r, { c: '#1f5a24', narrow: .75 })), `</g>`,
        `<path d="M70,90 Q90,80 112,84" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // プラーヌンマナオ（ปลานึ่งมะนาว）: 魚形の蒸し皿に、白く蒸した魚、ライムと唐辛子とにんにくの澄んだ汁、ライムの輪切り、パクチー
    th_planungmanao: p => [
        xthFishTray(p),
        `<path d="M24,100 C34,64 74,56 120,60 C140,63 152,72 156,84 Q160,100 156,116 C152,128 140,137 120,140 C74,144 34,136 24,100Z" fill="${p.rg('#e2dcae', .25, .2, .45, .42)}" opacity=".92"/>`,
        xthFish(p, 92, 100, 132, 0, { mode: 'steamed', scores: 4 }),
        xthGarlicBits(p, 92, 98, 70, 30, 2),
        ...[[60, 86], [80, 80], [106, 82], [124, 92], [70, 112], [98, 116], [120, 110], [140, 100], [52, 106], [88, 98]].map(([x, y], i) => xthChiliRing(p, x, y, 5.5 + (i % 3) * .6, i * 40, { c: i % 3 === 2 ? '#3f8f2f' : '#d42a1c' })),
        xthLimeRound(p, 74, 96, 17), xthLimeRound(p, 110, 98, 17), xthLimeRound(p, 140, 120, 15),
        xthCoriander(p, 54, 92, 16, -20), xthCoriander(p, 94, 88, 15, 20), xthCoriander(p, 126, 104, 14, 60),
        xthCelery(p, 150, 80, 22, 30),
    ].join(''),
});

// トートマンプラー（赤いカレーペーストの色の平たい揚げさつま揚げ、緑のいんげんの粒）
function xthFishCake(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthfc' + seed + x + y);
    const pts = ring(s / 2, 11, .16, R, 1.08, .92);
    let g = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; g += `<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d)}" r="${f1(s * .045)}" fill="#6aa040" stroke="#3a6a22" stroke-width=".5"/>`; }
    let lf = '';
    for (let i = 0; i < 4; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .3; lf += `M${f1(Math.cos(a) * d)},${f1(Math.sin(a) * d)}l${f1((R() - .5) * 6)},${f1((R() - .5) * 4)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><g ${p.rough(2.2, .14)}><path d="${smooth(pts, true, .9)}" fill="${p.rg('#b8622a', .25, .35, .4, .36)}" stroke="#7a3410" stroke-width=".8"/></g></g>
        <g ${p.crumb(.7)}><path d="${smooth(pts.map(([a, b]) => [a * .8, b * .8]), true, .9)}" fill="#c8743a" opacity=".55"/></g>
        ${g}<path d="${lf}" stroke="#2a5a22" stroke-width="1" stroke-linecap="round"/>
        ${xthShine(`M${f1(-s * .3)},${f1(-s * .12)} Q${f1(-s * .14)},${f1(-s * .3)} ${f1(s * .12)},${f1(-s * .3)}`, 1.6, .5)}</g>`;
}
// 揚げたゆで卵の半分（カイルークーイ: 縁がきつね色にちりちり、黄身は橙）
function xthFriedEggHalf(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthfe' + seed + x);
    const pts = ring(s / 2, 11, .1, R, 1.18, .9);
    let bl = '';
    for (let i = 0; i < 7; i++){ const a = R() * 6.28, d = s * (.32 + R() * .12); bl += `<ellipse cx="${f1(Math.cos(a) * d * 1.1)}" cy="${f1(Math.sin(a) * d * .85)}" rx="${f1(1.6 + R() * 2)}" ry="${f1(1 + R())}" fill="#8a4a14" opacity=".35"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .9)}" fill="${p.rg('#d89a48', .25, .35, .4, .36)}" stroke="#8a5018" stroke-width=".8"/></g>
        ${bl}<path d="${smooth(pts.map(([a, b]) => [a * .74, b * .74]), true, .9)}" fill="${p.rg('#f6ead0', .1, .15)}"/>
        <circle cx="${f1(s * .03)}" cy="${f1(s * .03)}" r="${f1(s * .21)}" fill="${p.rg('#f0961c', .3, .25, .4, .36)}" stroke="#c87010" stroke-width=".6"/>
        <ellipse cx="${f1(-s * .06)}" cy="${f1(-s * .05)}" rx="${f1(s * .07)}" ry="${f1(s * .04)}" fill="#fff" opacity=".7"/>
        ${xthShine(`M${f1(-s * .4)},${f1(-s * .1)} Q${f1(-s * .3)},${f1(-s * .32)} ${f1(-s * .05)},${f1(-s * .38)}`, 1.4, .6)}</g>`;
}
// 卵豆腐の輪切りを揚げたもの（縁がきつね色）
function xthFriedEggTofu(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .46)}" fill="${p.g('#d49a3a', .25, .3)}" stroke="#9a6418" stroke-width=".8"/></g>
        <ellipse rx="${f1(s / 2 - 2.6)}" ry="${f1(s * .46 - 2.6)}" fill="${p.rg('#f6dc8a', .2, .15, .4, .38)}"/>
        <ellipse rx="${f1(s * .3)}" ry="${f1(s * .27)}" fill="none" stroke="#e8c060" stroke-width=".8" opacity=".6"/>
        ${xthShine(`M${f1(-s * .34)},${f1(-s * .1)} Q${f1(-s * .2)},${f1(-s * .32)} ${f1(s * .08)},${f1(-s * .34)}`, 1.4, .6)}</g>`;
}
// 牛の干し肉の揚げ（細長い濃い赤茶の棒）
function xthDriedBeef(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthdb' + seed + x + y);
    const w = L * .42, c = R() < .5 ? '#8a3a1c' : '#9a4622';
    const pts = [[-L / 2, -w * .3], [-L * .25, -w * .55], [L * .1, -w * .45], [L * .4, -w * .55], [L / 2 + 1, -w * .1], [L * .45, w * .45], [L * .1, w * .5], [-L * .25, w * .4], [-L / 2 - 1, w * .3]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 2.6]);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><g ${p.rough(1.6, .15)}><path d="${smooth(pts, true, .5)}" fill="${p.g(c, .3, .4)}" stroke="${dk(c, .5)}" stroke-width=".8"/></g></g>
        <path d="M${f1(-L * .42)},${f1(-w * .1)} Q0,${f1(-w * .2)} ${f1(L * .42)},${f1(-w * .05)} M${f1(-L * .38)},${f1(w * .18)} Q0,${f1(w * .08)} ${f1(L * .4)},${f1(w * .22)}" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f1(-L / 2 + 1)},${f1(w * .3)} L${f1(L * .45)},${f1(w * .42)}" stroke="#4a1a08" stroke-width="2" stroke-linecap="round" opacity=".35"/>
        ${xthShine(`M${f1(-L * .38)},${f1(-w * .32)} Q0,${f1(-w * .45)} ${f1(L * .3)},${f1(-w * .34)}`, 1.3, .55)}</g>`;
}
// しいたけの薄切り（茶色の縁と淡いひだ側）
function xthMushSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f1(-s / 2)},${f1(s * .1)} Q${f1(-s / 2)},${f1(-s * .35)} 0,${f1(-s * .36)} Q${f1(s / 2)},${f1(-s * .35)} ${f1(s / 2)},${f1(s * .1)} Q0,${f1(s * .02)} ${f1(-s / 2)},${f1(s * .1)}Z" fill="${p.g('#6a4228', .25, .3)}" stroke="#3a2210" stroke-width=".6"/></g>
        <path d="M${f1(-s * .38)},${f1(s * .06)} Q${f1(-s * .36)},${f1(-s * .2)} 0,${f1(-s * .22)} Q${f1(s * .36)},${f1(-s * .2)} ${f1(s * .38)},${f1(s * .06)}Z" fill="#cdb08a"/>
        <rect x="${f1(-s * .07)}" y="${f1(-s * .02)}" width="${f1(s * .14)}" height="${f1(s * .34)}" rx="1" fill="#e2cfae" stroke="#a88a62" stroke-width=".4"/></g>`;
}
// ゆで鶏のそぎ切り（カオマンガイ: 白い身、薄黄色の皮、つや）
function xthPoachedSlice(p, x, y, w, h, r = 0){
    const d = `M${f1(-w / 2)},${f1(-h * .3)} Q${f1(-w / 2)},${f1(-h / 2)} ${f1(-w * .35)},${f1(-h / 2)} L${f1(w * .4)},${f1(-h * .5)} Q${f1(w / 2)},${f1(-h * .45)} ${f1(w / 2)},0 Q${f1(w / 2)},${f1(h * .45)} ${f1(w * .4)},${f1(h * .5)} L${f1(-w * .35)},${f1(h / 2)} Q${f1(-w / 2)},${f1(h / 2)} ${f1(-w / 2)},${f1(h * .3)}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${d}" fill="${p.g('#f6eee0', .2, .18)}" stroke="#cdb894" stroke-width=".7"/></g>
        <path d="M${f1(w * .3)},${f1(-h * .5)} Q${f1(w / 2)},${f1(-h * .45)} ${f1(w / 2)},0 Q${f1(w / 2)},${f1(h * .45)} ${f1(w * .3)},${f1(h * .5)} Q${f1(w * .4)},0 ${f1(w * .3)},${f1(-h * .5)}Z" fill="${p.g('#f0d27a', .3, .2)}" stroke="#c8a04a" stroke-width=".5"/>
        <path d="M${f1(-w * .38)},${f1(-h * .1)} L${f1(w * .22)},${f1(-h * .14)} M${f1(-w * .34)},${f1(h * .2)} L${f1(w * .2)},${f1(h * .16)}" stroke="#e2d4b8" stroke-width=".8"/>
        ${xthShine(`M${f1(-w * .36)},${f1(-h * .3)} L${f1(w * .25)},${f1(-h * .34)}`, 1.2, .8)}</g>`;
}
// 平たい米麺（パッタイのセンチャン）: 1本のpathにまとめ、縁取りと塗りを use で重ねる
function xthFlatNoodles(p, x, y, s, { c = '#d89a54', w = 3.6, n = 34, seed = 1, sy = .92 } = {}){
    const R = rng(p.id + 'xthfn' + seed);
    let d = '', dl = '', dd = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.2 + R() * .76), a0 = R() * 6.28, sweep = 1.1 + R() * 2;
        const cx = x + (R() - .5) * s * .12, cy = y + (R() - .5) * s * .12;
        const pts = Array.from({ length: 6 }, (_, j) => { const a = a0 + j / 5 * sweep, rj = rr * (1 + (R() - .5) * .25); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        const one = xthSm(pts);
        const q = R(); if (q < .25) dl += one; else if (q < .45) dd += one; else d += one;
    }
    const ia = p.uid(), ib = p.uid(), ic = p.uid();
    return `<defs><path id="${ia}" d="${d}"/><path id="${ib}" d="${dl}"/><path id="${ic}" d="${dd}"/></defs><g ${p.sh(.8)} fill="none" stroke-linecap="round"><g stroke="${dk(c, .3)}" stroke-width="${w + 1.2}"><use href="#${ia}"/><use href="#${ib}"/><use href="#${ic}"/></g><use href="#${ia}" stroke="${c}" stroke-width="${w}"/><use href="#${ib}" stroke="${lt(c, .2)}" stroke-width="${w}"/><use href="#${ic}" stroke="${dk(c, .12)}" stroke-width="${w}"/></g><use href="#${ib}" stroke="#fff" stroke-width="${f1(w * .25)}" fill="none" opacity=".5" transform="translate(-.6 -.8)"/>`;
}
// ニラ（ぶつ切り、濃い緑の平たい葉）
const xthChive = (p, x, y, L, r = 0) => xthScallionSeg(p, x, y, L, r, { c: '#3f8a2a', w: 2.8 });
// 黄色い豆腐（タオフールアン）の角切り、揚げ豆腐
const xthYellowTofu = (p, x, y, s, r = 0) => K.tofu(p, x, y, s, s, r, { c: '#e8b85a' });

Object.assign(D, {
    // トートマンプラー（ทอดมันปลา）: 赤茶の平たい魚のさつま揚げ、いんげんの粒、きゅうりの甘酢（アチャート）
    th_thodmanpla: p => [
        xthVessel(p, 'celadon', { inside: '#e4eee0' }),
        ...[[72, 76, 0], [118, 66, 30], [60, 118, 60], [104, 108, 10], [148, 98, 80], [90, 148, -20], [136, 140, 40]].map(([x, y, r], i) => xthFishCake(p, x, y, 40, r, { seed: i })),
        xthSaucer(p, 146, 58, 20, '#f2e2b0'),
        xthCucumber(p, 140, 56, 8, 10), xthCucumber(p, 150, 62, 8, 40), xthChiliRing(p, 148, 52, 3.4), xthShallot(p, 142, 64, 6, 20), xthGrains(p, 146, 58, 14, { cols: ['#e2b878'], n: 5, size: 1.6, seed: 9 }),
        `<g ${p.sh(.4)}>`, xthCucumber(p, 42, 96, 14, 80), xthCucumber(p, 160, 124, 13, 20), `</g>`,
        xthCoriander(p, 112, 88, 15, 20),
    ].join(''),

    // グンパットポンカリー（กุ้งผัดผงกะหรี่）: とろりとした黄色いカレー卵のあん、尾つきのえび、玉ねぎ、キンチャイ、赤唐辛子、ねぎ
    th_kungphongkari: p => [
        xthVessel(p, 'blue'),
        K.pool(p, 100, 102, 132, '#e2b03a', { op: .95, seed: 2, sy: .92 }),
        `<g ${p.sh(.5)}>`, ...[[80, 84, 34], [122, 80, 32], [104, 118, 36], [70, 122, 30], [136, 124, 30], [100, 64, 26], [150, 98, 24], [58, 96, 24], [96, 146, 26]].map(([x, y, s], i) => K.scrambled(p, x, y, s, { c: i % 2 ? '#f2c43e' : '#f6d050', seed: i, n: 3 })), `</g>`,
        `<g ${p.sh(.5)}>`, xthOnion(p, 66, 80, 22, -30), xthOnion(p, 136, 66, 22, 40), xthOnion(p, 118, 140, 20, 150), xthOnion(p, 56, 128, 20, 100), `</g>`,
        ...[[92, 92, 0], [124, 100, 60], [100, 124, 140], [72, 108, -60], [128, 72, 20], [84, 64, -20], [146, 124, 100], [76, 142, 170]].map(([x, y, r], i) => xthPeeledShrimp(p, x, y, 28, r)),
        ...[[110, 80, 20], [80, 124, -40], [142, 108, 70], [62, 92, 10], [118, 136, 120]].map(([x, y, r]) => xthCelery(p, x, y, 24, r)),
        xthChiliSlice(p, 100, 104, 11, 20), xthChiliSlice(p, 134, 88, 10, -40), xthChiliSlice(p, 90, 136, 10, 70), xthChiliSlice(p, 64, 112, 9, 10),
        `<g ${p.sh(.4)}>`, ...[[112, 116, 30], [86, 80, -40], [146, 84, 60]].map(([x, y, r]) => xthScallionSeg(p, x, y, 20, r)), `</g>`,
    ].join(''),

    // カイルークーイ（ไข่ลูกเขย）: 揚げたゆで卵の半分に、濃い茶のタマリンドだれ、揚げエシャロット、揚げ唐辛子、パクチー
    th_khailukkhoei: p => [
        xthPlate(p),
        K.pool(p, 100, 102, 128, '#8a4418', { op: .95, seed: 4, sy: .92 }),
        `<path d="M50,96 Q70,74 100,70" stroke="#e8a060" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`,
        ...[[74, 80, -10], [124, 74, 20], [64, 120, 30], [108, 108, -20], [146, 110, 10], [94, 144, 15]].map(([x, y, r], i) => xthFriedEggHalf(p, x, y, 40, r, { seed: i })),
        `<g ${p.sh(.4)}>`, xthCrispShallot(p, 100, 102, 120, { n: 40, seed: 1 }), `</g>`,
        ...[[96, 82, 30], [132, 132, -40], [56, 98, 70], [128, 92, 120], [84, 116, 10], [150, 80, 60]].map(([x, y, r]) => xthDriedChili(p, x, y, 13, r)),
        xthCoriander(p, 90, 98, 16, 20), xthCoriander(p, 130, 118, 15, -30), xthCoriander(p, 72, 146, 14, 60), xthCoriander(p, 118, 56, 14, 0),
    ].join(''),

    // カイヤッサイ（ไข่ยัดไส้）: 四角く包んだ薄焼き卵、角から見える豚ひき肉とトマトの具、ケチャップ、きゅうり、パクチー
    th_khaiyatsai: p => {
        const env = 'M44,58 Q42,48 54,46 L144,44 Q156,44 156,56 L158,146 Q158,156 146,156 L56,158 Q44,158 44,146Z';
        const cid = p.uid();
        let spots = '';
        const R = rng(p.id + 'sp');
        for (let i = 0; i < 18; i++) spots += `<ellipse cx="${f1(52 + R() * 96)}" cy="${f1(52 + R() * 96)}" rx="${f1(3 + R() * 7)}" ry="${f1(2 + R() * 4)}" transform="rotate(${f1(R() * 180)} 100 100)" fill="#d08a2a" opacity="${f1(.12 + R() * .2)}"/>`;
        return [
            xthPlate(p, { flower: false }),
            `<g transform="rotate(-8 100 100)">`,
            `<g ${p.sh(1.2)}><path d="${env}" fill="${p.rg('#f4c84a', .25, .25, .4, .38)}" stroke="#c89020" stroke-width="1"/></g>`,
            `<defs><clipPath id="${cid}"><path d="${env}"/></clipPath></defs><g clip-path="url(#${cid})">${spots}</g>`,
            `<path d="M48,60 L100,100 L152,58 M100,100 L100,154" stroke="#c89428" stroke-width="1.4" fill="none" opacity=".55"/>`,
            `<path d="M48,60 L100,100 L152,58" stroke="#fbe4a0" stroke-width="1.2" fill="none" opacity=".6" transform="translate(0 2)"/>`,
            `<path d="M58,52 Q100,46 140,50" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
            `</g>`,
            `<g ${p.sh(.4)}>`, xthTomato(p, 150, 150, 16, 30), xthGrains(p, 146, 158, 16, { cols: ['#8a5a34', '#a8703e'], n: 10, size: 2, seed: 3 }), xthLongBean(p, 158, 140, 9, 40), `</g>`,
            K.drizzle(p, 100, 102, 70, 14, { c: '#c8281c', width: 2.6, n: 6, r: -8 }),
            xthCoriander(p, 98, 94, 18, 20),
            `<g ${p.sh(.4)}>`, xthCucumber(p, 30, 120, 13, 80), xthCucumber(p, 36, 136, 13, 60), `</g>`,
        ].join('');
    },

    // パットプリックゲーンムー（ผัดพริกแกงหมูถั่วฝักยาว）: 赤いカレーペーストで炒めた豚といんげん、こぶみかんの葉の細切り、赤い油
    th_moophadphrikkaeng: p => [
        xthVessel(p, 'enamel'),
        K.pool(p, 100, 102, 128, '#c8461e', { op: .85, seed: 5, sy: .9 }),
        ...[[76, 96, 20], [112, 64, -30], [146, 84, 60], [96, 120, 100], [132, 120, 10], [62, 134, 40], [150, 128, -50], [58, 104, 110], [126, 90, 140], [84, 152, 80]].map(([x, y, r]) => xthLongBean(p, x, y, 26, r, { w: 6.4 })),
        `<g ${p.sh(.6)}>`,
        ...[[80, 80, -20], [124, 74, 30], [70, 118, 70], [116, 110, -10], [142, 102, 80], [94, 140, 20], [130, 136, -40], [100, 92, 50]].map(([x, y, r], i) => xthPorkSlice(p, x, y, 42, r, { c: i % 2 ? '#a8462a' : '#b8522e', fat: '#f0b888', seed: i, gloss: .7 })),
        `</g>`,
        xthLimeShreds(p, 104, 104, 100, 20, 2),
        xthOil(p, 100, 102, 120, { n: 10, c: '#e0501c', op: .5, rmax: 2, seed: 3 }),
        xthChiliSlice(p, 100, 80, 10, 20), xthChiliSlice(p, 76, 128, 9, -40),
    ].join(''),

    // タオフーソンクルアン（เต้าหู้ไข่ทรงเครื่อง）: 揚げた卵豆腐の輪切りに、ひき肉ときのことにんじんの茶色いあん、ねぎ
    th_taohusongkhrueang: p => [
        xthVessel(p, 'blue'),
        ...[[72, 76], [110, 68], [146, 86], [60, 114], [98, 106], [138, 124], [80, 146], [118, 146]].map(([x, y], i) => xthFriedEggTofu(p, x, y, 34, i * 20)),
        `<path d="M48,92 Q66,58 112,58 Q150,60 160,94 Q164,132 132,150 Q96,164 64,142 Q42,124 48,92Z" fill="#a8743a" opacity=".58"/>`,
        `<path d="M58,90 Q74,66 108,66" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
        xthMince(p, 102, 106, 100, { n: 60, c: '#8a5a34', seed: 2 }),
        `<g ${p.sh(.5)}>`,
        ...[[84, 92, 20], [124, 104, -30], [100, 132, 60], [140, 80, 10], [66, 126, 80]].map(([x, y, r]) => xthMushSlice(p, x, y, 18, r)),
        ...[[112, 86, 0], [76, 108, 20], [130, 136, 40], [94, 70, 10]].map(([x, y, r]) => K.carrotRound(p, x, y, 11, { r })),
        `</g>`,
        xthScallions(p, 102, 104, 100, 24, 3),
    ].join(''),

    // ヌアデートディアオ（เนื้อแดดเดียว）: 一日干しの牛肉を揚げた濃い赤茶の棒、ごま、ジェーオのたれ、キャベツ
    th_nueadaddiao: p => [
        xthVessel(p, 'melamine', { inside: '#e8d2a0' }),
        `<g ${p.sh(.5)}>`, xthCabbageWedge(p, 146, 140, 34, -40), `</g>`,
        ...[[76, 70, -20], [110, 64, 10], [64, 102, 60], [100, 94, -30], [134, 86, 20], [80, 130, 30], [116, 120, -50], [100, 146, 10], [140, 110, 80], [58, 132, -70], [92, 76, 70], [124, 146, -20], [148, 92, 40], [72, 150, 10]].map(([x, y, r], i) => xthDriedBeef(p, x, y, 42, r, { seed: i })),
        K.sesame(p, 100, 104, 90, { n: 26, c: '#f3e2b6' }),
        xthJaew(p, 148, 64, 20),
        xthCoriander(p, 52, 80, 16, -30),
    ].join(''),

    // パッタイ（ผัดไทยกุ้งสด）: 橙茶色の細い米麺、えび、黄色い豆腐、卵、ニラ、もやし。横に生のもやし、ニラ、ライム、砕いたピーナッツ、粉唐辛子
    th_padthai: p => [
        xthVessel(p, 'blue'),
        xthMound(p, 92, 102, 118, '#c08040', { seed: 3, sy: .95, rough: false }),
        xthFlatNoodles(p, 92, 102, 120, { c: '#d8955a', w: 4.4, n: 36, seed: 1 }),
        xthEggBits(p, 92, 102, 96, { n: 8, seed: 2 }),
        `<g ${p.sh(.4)}>`, ...[[72, 86, 20], [110, 120, -30], [96, 74, 40], [66, 120, 0], [118, 92, 70]].map(([x, y, r]) => xthYellowTofu(p, x, y, 10, r)), `</g>`,
        K.sprouts(p, 94, 104, 70, { n: 10, seed: 3 }),
        `<g ${p.sh(.4)}>`, ...[[84, 104, 30], [104, 90, -40], [78, 132, 70], [118, 132, 10], [62, 98, 100], [100, 140, -20]].map(([x, y, r]) => xthChive(p, x, y, 22, r)), `</g>`,
        ...[[86, 92, 30], [106, 108, -40], [80, 118, 120], [114, 76, 60]].map(([x, y, r], i) => xthShrimp(p, x, y, 36, r, { c: '#ec6a3a', seed: i })),
        `<g ${p.sh(.5)}>`, K.sprouts(p, 150, 128, 34, { n: 12, seed: 5 }), ...[[150, 84, 80], [156, 92, 85], [144, 88, 75]].map(([x, y, r]) => xthChive(p, x, y, 34, r)), `</g>`,
        xthLime(p, 132, 154, 24, 170),
        xthPeanuts(p, 150, 112, 22, 12, 4),
        xthGrains(p, 94, 100, 80, { cols: ['#b8301c'], n: 16, size: .8, seed: 6 }),
    ].join(''),

    // ラートナー（ราดหน้าหมู）: 焦げ目のある幅広麺に、とろみのある茶色いあん、カナー、豚の薄切り、白こしょう
    th_radna: p => [
        xthVessel(p, 'melamine', { inside: '#f2e8cc' }),
        xthWideNoodles(p, 100, 100, 134, { n: 10, seed: 1, w: 13, c: '#d8b07a', len: .7, wav: .35 }),
        `<path d="M40,96 Q46,52 100,44 Q152,46 160,96 Q162,146 112,158 Q56,160 40,96Z" fill="#9a6a34" opacity=".55"/>`,
        `<g ${p.sh(.6)}>`,
        ...[[78, 76, 28, 20], [128, 72, 26, -40], [70, 124, 28, 70], [134, 124, 26, 10], [104, 104, 24, 120], [100, 146, 24, -20]].map(([x, y, s, r], i) => xthKanaLeaf(p, x, y, s, r, { seed: i + 1 })),
        ...[[100, 66, 20, -20], [146, 100, 20, 60], [62, 98, 18, 30], [120, 142, 20, -50], [90, 92, 18, 100], [80, 148, 16, 10]].map(([x, y, L, r]) => xthKanaStem(p, x, y, L, r)),
        ...[[88, 108, -10], [122, 96, 40], [104, 126, 80], [116, 70, -30], [70, 86, 60], [146, 132, 20], [62, 138, -40]].map(([x, y, r], i) => xthPorkSlice(p, x, y, 28, r, { c: '#c8a07a', fat: '#f4e6cc', char: false, seed: i, gloss: .5 })),
        `</g>`,
        `<path d="M52,90 Q64,62 98,54 M120,148 Q140,140 150,124" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>`,
        `<path d="M44,100 Q70,92 100,98 Q130,104 156,96" stroke="#c89660" stroke-width="5" fill="none" opacity=".35"/>`,
        xthPepper(p, 100, 100, 100, 26, '#3a2a1c'),
    ].join(''),

    // カオマンガイ（ข้าวมันไก่）: 鶏のだしで炊いた薄黄色のご飯、白いゆで鶏のそぎ切り、きゅうり、パクチー、タオジオだれ、スープの小碗はなし
    th_khaomankai: p => [
        xthVessel(p, 'enamel'),
        xthRice(p, 94, 104, 116, { density: 1.2, grain: 3.6, tint: '#f2e4b8', hiK: .6, layers: 1 }),
        ...[[60, 100, 20], [76, 101, 22], [92, 103, 19], [108, 104, 22], [124, 106, 20], [139, 108, 18]].map(([x, y, w], i) => xthPoachedSlice(p, x, y - 4 + (i % 2) * 3, w, 56 + (i % 3) * 4, 10 - i * 3 + (i % 2) * 4)),
        `<g ${p.sh(.4)}>`, ...[[150, 108, 80], [156, 124, 70], [150, 140, 60], [140, 154, 50], [124, 162, 40]].map(([x, y, r]) => xthCucumber(p, x, y, 15, r)), `</g>`,
        xthCoriander(p, 62, 62, 20, -20), xthCoriander(p, 128, 76, 17, 40), xthCoriander(p, 52, 136, 15, 70),
        xthSaucer(p, 146, 58, 20, '#7a4a1c'),
        xthGrains(p, 146, 58, 22, { cols: ['#d42a1c', '#f2dc96', '#5a9a2e'], n: 20, size: 1.1, seed: 7 }),
    ].join(''),
});

// もやし（まとめて1本のpath）
function xthSprouts(p, x, y, s, { n = 40, seed = 1, sy = .9 } = {}){
    const R = rng(p.id + 'xthsp' + seed + x);
    let d = '', h = '';
    for (let i = 0; i < n; i++){
        const a0 = R() * 6.28, dd = Math.sqrt(R()) * s / 2 * .85, cx = x + Math.cos(a0) * dd, cy = y + Math.sin(a0) * dd * sy, a = R() * Math.PI, L = 12 + R() * 10, b = (R() - .5) * 6;
        const x1 = cx - Math.cos(a) * L / 2, y1 = cy - Math.sin(a) * L / 2, x2 = cx + Math.cos(a) * L / 2, y2 = cy + Math.sin(a) * L / 2;
        d += `M${f1(x1)},${f1(y1)}Q${f1(cx + b)},${f1(cy - b)} ${f1(x2)},${f1(y2)}`;
        h += `M${f1(x2)},${f1(y2)}h.1`;
    }
    const id = p.uid();
    return `<defs><path id="${id}" d="${d}"/></defs><g ${p.sh(.6)} fill="none" stroke-linecap="round"><use href="#${id}" stroke="#cfc6a6" stroke-width="3.4"/><use href="#${id}" stroke="#f8f5e8" stroke-width="2.4"/><path d="${h}" stroke="#e2cc5a" stroke-width="3.4"/></g><use href="#${id}" stroke="#fff" stroke-width=".8" fill="none" transform="translate(-.5 -.6)" opacity=".8"/>`;
}
// トウモロコシの粒の山
function xthCornPile(p, x, y, s, { n = 200, seed = 1, sy = .95 } = {}){
    return xthMound(p, x, y, s * 1.02, '#e8b832', { seed, sy, rough: true })
        + xthGrains(p, x, y, s * .98, { cols: ['#f6cc3a', '#f8d860', '#e8b42a', '#fbe48a'], n, size: 2.8, seed, sy })
        + xthGrains(p, x - 2, y - 2, s * .9, { cols: ['#fff6c8'], n: Math.round(n * .25), size: .9, seed: seed + 3, sy });
}
// 四角豆の斜め切り（ぎざぎざの翼の縁）
function xthWingBean(p, x, y, L, r = 0){
    const w = L * .42;
    let top = `M${f1(-L / 2)},${f1(-w / 2)}`, bot = '';
    for (let i = 1; i <= 6; i++) top += ` L${f1(-L / 2 + i * L / 6 - L / 12)},${f1(-w / 2 - 1.6)} L${f1(-L / 2 + i * L / 6)},${f1(-w / 2)}`;
    for (let i = 5; i >= 0; i--) bot += ` L${f1(-L / 2 + i * L / 6 + L / 12)},${f1(w / 2 + 1.6)} L${f1(-L / 2 + i * L / 6)},${f1(w / 2)}`;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${top} L${f1(L / 2)},${f1(w / 2)}${bot}Z" fill="${p.g('#7ab84a', .3, .25)}" stroke="#3f7a24" stroke-width=".6" stroke-linejoin="round"/></g>
        <rect x="${f1(-L * .4)}" y="${f1(-w * .22)}" width="${f1(L * .8)}" height="${f1(w * .44)}" rx="${f1(w * .2)}" fill="#cfe8a8" opacity=".85"/>
        <path d="M${f1(-L * .4)},${f1(-w * .3)} L${f1(L * .4)},${f1(-w * .3)}" stroke="#fff" stroke-width=".9" opacity=".6"/></g>`;
}
// 缶詰のいわし（トマト煮: 銀の皮、身、赤いソース）
function xthSardine(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthsd' + seed + x + y);
    const h = L * .5;
    const pts = [[-L / 2, -h * .3], [-L * .2, -h / 2], [L * .3, -h * .45], [L / 2, -h * .1], [L * .45, h * .4], [0, h / 2], [-L * .45, h * .35]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#b86448', .25, .3)}" stroke="#7a2a16" stroke-width=".7"/></g>
        <path d="M${f1(-L * .4)},${f1(-h * .22)} Q0,${f1(-h * .45)} ${f1(L * .4)},${f1(-h * .15)} L${f1(L * .35)},${f1(-h * .02)} Q0,${f1(-h * .22)} ${f1(-L * .38)},${f1(-h * .02)}Z" fill="${p.g('#9aa2a2', .4, .2)}" opacity=".55"/>
        <path d="M${f1(-L * .3)},${f1(-h * .28)} L${f1(L * .25)},${f1(-h * .3)}" stroke="#e2eaee" stroke-width=".9" opacity=".8"/>
        <path d="M${f1(-L * .3)},${f1(h * .18)} L${f1(L * .3)},${f1(h * .12)} M${f1(-L * .2)},${f1(h * .32)} L${f1(L * .2)},${f1(h * .3)}" stroke="#e8b0a0" stroke-width="1" opacity=".7"/>
        <path d="M${f1(-L * .45)},${f1(h * .3)} Q0,${f1(h * .6)} ${f1(L * .45)},${f1(h * .35)}" stroke="#d0401c" stroke-width="${f1(h * .3)}" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ムーヨー（ベトナム風の豚肉ソーセージ）の輪切り: 淡いピンクベージュに黒こしょう
function xthMooYor(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthmy' + seed + x + y);
    let dots = '';
    for (let i = 0; i < 7; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .36; dots += `M${f1(Math.cos(a) * d)},${f1(Math.sin(a) * d)}h.1`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .44)}" fill="${p.rg('#ead2c4', .2, .2, .4, .38)}" stroke="#b89480" stroke-width="1.4"/></g>
        <ellipse rx="${f1(s / 2 - 1.8)}" ry="${f1(s * .44 - 1.8)}" fill="none" stroke="#f6e6dc" stroke-width=".8" opacity=".8"/>
        <path d="${dots}" stroke="#3a2a22" stroke-width="1.6" stroke-linecap="round"/>
        ${xthShine(`M${f1(-s * .3)},${f1(-s * .12)} Q${f1(-s * .16)},${f1(-s * .3)} ${f1(s * .08)},${f1(-s * .32)}`, 1.3, .6)}</g>`;
}
// かぼちゃの薄切り（半月、緑の皮）
function xthPumpkinSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f1(-s / 2)},${f1(s * .1)} A${f1(s / 2)},${f1(s * .42)} 0 0 1 ${f1(s / 2)},${f1(s * .1)} Q0,${f1(s * .02)} ${f1(-s / 2)},${f1(s * .1)}Z" fill="${p.g('#f0962a', .3, .25)}" stroke="#b8620e" stroke-width=".6"/></g>
        <path d="M${f1(-s / 2)},${f1(s * .1)} A${f1(s / 2)},${f1(s * .42)} 0 0 1 ${f1(s / 2)},${f1(s * .1)}" stroke="#3f6a2a" stroke-width="2" fill="none"/>
        ${xthShine(`M${f1(-s * .28)},${f1(-s * .12)} Q0,${f1(-s * .24)} ${f1(s * .24)},${f1(-s * .1)}`, 1.1, .55)}</g>`;
}
// 炒めたキャベツの一片（焦げ目つき）
function xthCabbagePiece(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthcp' + seed + x + y);
    const c = R() < .4 ? '#d2e4a0' : R() < .7 ? '#e2eebe' : '#a8cc78';
    const pts = ring(s / 2, 13, .5, R, 1.25, .78);
    let ch = '';
    for (let i = 0; i < 3; i++) ch += `<ellipse cx="${f1((R() - .5) * s * .6)}" cy="${f1((R() - .5) * s * .35)}" rx="${f1(s * (.06 + R() * .08))}" ry="${f1(s * .05)}" fill="#9a6420" opacity="${f1(.25 + R() * .25)}"/>`;
    const b = (R() - .5) * s * .2;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .9)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7" opacity=".96"/></g>
        <path d="M${f1(-s * .5)},${f1(s * .08)} Q0,${f1(b)} ${f1(s * .5)},${f1(-s * .04)}" stroke="#f8fbee" stroke-width="${f1(s * .11)}" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-s * .2)},${f1(s * .05)} Q${f1(-s * .25)},${f1(-s * .15)} ${f1(-s * .32)},${f1(-s * .28)} M${f1(s * .1)},${f1(s * .01)} Q${f1(s * .1)},${f1(-s * .18)} ${f1(s * .04)},${f1(-s * .3)} M${f1(s * .02)},${f1(s * .03)} Q${f1(s * .1)},${f1(s * .2)} ${f1(s * .2)},${f1(s * .3)}" stroke="#f0f6dc" stroke-width="${f1(s * .04)}" fill="none" stroke-linecap="round" opacity=".9"/>
        ${ch}${xthShine(`M${f1(-s * .32)},${f1(-s * .2)} Q0,${f1(-s * .32)} ${f1(s * .22)},${f1(-s * .22)}`, 1.1, .55)}</g>`;
}
// 細切りの揚げ豆腐
function xthTofuStrip(p, x, y, L, r = 0){
    const w = L * .36;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${L}" height="${f1(w)}" rx="1.6" fill="${p.g('#e0a84a', .3, .3)}" stroke="#9a6a20" stroke-width=".6"/></g>
        <rect x="${f1(-L / 2 + 1.6)}" y="${f1(-w / 2 + 1.4)}" width="${f1(L - 3.2)}" height="${f1(w * .4)}" rx="1" fill="#f6e4b8" opacity=".85"/></g>`;
}

Object.assign(D, {
    // ヤムカイダーオ（ยำไข่ดาว）: 縁がちりちりの目玉焼きを切って、トマト、玉ねぎ、キンチャイ、唐辛子とあえる
    th_yamkhaidao: p => [
        xthPlate(p),
        K.pool(p, 100, 102, 124, '#e8c27a', { op: .45, seed: 2, sy: .9 }),
        xthFriedEgg(p, 76, 80, 50, 20), xthFriedEgg(p, 124, 76, 48, -30), xthFriedEgg(p, 70, 126, 48, 70), xthFriedEgg(p, 126, 124, 50, 140),
        `<g ${p.sh(.5)}>`,
        xthOnion(p, 100, 100, 26, 20), xthOnion(p, 146, 100, 22, -60), xthOnion(p, 92, 150, 20, 120),
        xthCherryHalf(p, 98, 74, 16), xthCherryHalf(p, 148, 82, 14), xthCherryHalf(p, 104, 126, 16), xthCherryHalf(p, 54, 100, 14),
        `</g>`,
        ...[[86, 100, 20], [118, 100, -40], [102, 60, 70], [56, 82, 10], [140, 144, 100]].map(([x, y, r]) => xthCelery(p, x, y, 24, r)),
        xthChiliRing(p, 92, 112, 5.5), xthChiliRing(p, 122, 92, 5.5), xthChiliRing(p, 74, 98, 5), xthChiliRing(p, 112, 140, 5),
        xthCoriander(p, 110, 110, 15, 20),
    ].join(''),

    // ヤムムーヨー（ยำหมูยอ）: 淡いピンクのムーヨーの輪切り、玉ねぎ、トマト、キンチャイ、唐辛子
    th_yammuyo: p => [
        xthVessel(p, 'blue'),
        K.pool(p, 100, 102, 120, '#e8b86a', { op: .4, seed: 3, sy: .9 }),
        ...[[76, 76], [118, 70], [148, 100], [62, 112], [100, 100], [136, 136], [90, 140], [112, 122], [80, 104]].map(([x, y], i) => xthMooYor(p, x, y, 32, i * 30, { seed: i })),
        `<g ${p.sh(.5)}>`,
        xthTomato(p, 98, 74, 22, 30), xthTomato(p, 132, 112, 20, -40), xthTomato(p, 64, 136, 20, 80), xthTomato(p, 112, 148, 18, 10),
        xthOnion(p, 84, 90, 22, 20), xthOnion(p, 124, 92, 20, -60), xthOnion(p, 96, 120, 20, 120),
        `</g>`,
        ...[[108, 86, 20], [72, 124, -40], [140, 80, 70], [120, 134, 0]].map(([x, y, r]) => xthCelery(p, x, y, 24, r)),
        xthChiliRing(p, 92, 108, 5.5), xthChiliRing(p, 128, 104, 5.5), xthChiliRing(p, 74, 92, 5), xthChiliRing(p, 104, 136, 5),
    ].join(''),

    // ヤムトゥアプー（ยำถั่วพู）: 四角豆の斜め切り、ココナッツとナムプリックパオのたれ、えび、ピーナッツ、揚げエシャロット、ゆで卵
    th_yamthuaphu: p => [
        xthVessel(p, 'celadon', { inside: '#e6efe0' }),
        K.pool(p, 100, 102, 130, '#dca066', { op: .75, seed: 4, sy: .9 }),
        ...[[72, 80, 20], [104, 70, -30], [136, 80, 40], [60, 108, 80], [92, 98, 10], [126, 108, -60], [150, 116, 70], [76, 132, -20], [108, 128, 50], [138, 140, 0], [96, 150, 100], [118, 90, 120], [86, 116, 150], [56, 90, 30]].map(([x, y, r]) => xthWingBean(p, x, y, 28, r)),
        `<path d="M66,96 Q86,84 110,94 Q130,102 146,96 M74,124 Q96,116 120,124" stroke="#f4e2c0" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".85"/>`,
        ...[[90, 84, 20], [132, 124, -40], [70, 118, 120]].map(([x, y, r]) => xthPeeledShrimp(p, x, y, 24, r)),
        K.eggHalf(p, 116, 70, 26, 10), K.eggHalf(p, 100, 132, 26, -20),
        xthPeanuts(p, 104, 104, 100, 22, 2),
        xthCrispShallot(p, 104, 104, 90, { n: 22, seed: 2 }),
    ].join(''),

    // タムカオポート（ตำข้าวโพด）: 黄色いトウモロコシの粒をたたいて、ミニトマト、いんげん、干しえび、ピーナッツ、唐辛子
    th_tamkhaophot: p => [
        xthVessel(p, 'enamel'),
        xthCornPile(p, 100, 102, 128, { n: 230 }),
        `<g ${p.sh(.4)}>`, ...[[74, 80, 20], [122, 70, -30], [140, 116, 60], [80, 132, 100], [112, 140, 20], [60, 108, 40]].map(([x, y, r]) => xthLongBean(p, x, y, 18, r, { w: 5 })), `</g>`,
        xthCherryHalf(p, 90, 90, 17), xthCherryHalf(p, 124, 96, 16), xthCherryHalf(p, 98, 126, 16), xthCherryHalf(p, 132, 136, 14), xthCherryHalf(p, 64, 128, 14), xthCherryHalf(p, 106, 64, 14),
        `<g ${p.sh(.3)}>`, xthDriedShrimp(p, 108, 98, 10, 20), xthDriedShrimp(p, 78, 110, 10, -40), xthDriedShrimp(p, 120, 120, 9, 80), xthDriedShrimp(p, 94, 70, 9, 10), `</g>`,
        xthPeanuts(p, 100, 102, 90, 16, 3),
        xthChiliWhole(p, 140, 88, 14, -30), xthChiliRing(p, 84, 72, 5),
    ].join(''),

    // カナーパットナムマンホイ（คะน้าผัดน้ำมันหอย）: つやのあるカナーの茎と葉、オイスターソース、にんにく、唐辛子
    th_phadkhana: p => [
        xthVessel(p, 'blue'),
        K.pool(p, 100, 102, 128, '#7a5a30', { op: .6, seed: 5, sy: .9 }),
        `<g ${p.sh(.6)}>`,
        ...[[72, 76, 36, 20], [124, 68, 34, -40], [148, 104, 32, 80], [62, 118, 34, 70], [106, 104, 34, 120], [132, 140, 32, 10], [86, 146, 32, -20], [94, 80, 30, 160]].map(([x, y, s, r], i) => xthKanaLeaf(p, x, y, s, r, { seed: i + 1 })),
        ...[[100, 64, 26, -20], [146, 82, 24, 60], [60, 96, 24, 30], [120, 124, 26, -50], [86, 110, 24, 100], [104, 146, 24, 10], [136, 112, 22, 140], [74, 132, 22, -70]].map(([x, y, L, r]) => xthKanaStem(p, x, y, L, r)),
        `</g>`,
        xthGarlicBits(p, 100, 102, 100, 26, 1),
        xthChiliRing(p, 92, 92, 5.5), xthChiliRing(p, 126, 116, 5.5), xthChiliRing(p, 80, 128, 5),
        `<path d="M56,88 Q66,64 98,56" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),

    // トゥアンゴークパットタオフー（ถั่วงอกผัดเต้าหู้）: もやし、細切りの揚げ豆腐、ニラ
    th_phadthuangok: p => [
        xthVessel(p, 'melamine', { inside: '#d8e6c0' }),
        K.pool(p, 100, 102, 124, '#c9a870', { op: .45, seed: 6, sy: .9 }),
        xthSprouts(p, 100, 102, 130, { n: 70, seed: 1 }),
        ...[[80, 84, 20], [122, 80, -30], [70, 120, 70], [116, 118, 10], [100, 100, 100], [140, 102, 60], [96, 140, -40], [60, 98, 30]].map(([x, y, r]) => xthTofuStrip(p, x, y, 24, r)),
        xthSprouts(p, 100, 102, 90, { n: 22, seed: 2 }),
        `<g ${p.sh(.4)}>`, ...[[88, 98, 30], [118, 92, -40], [104, 124, 70], [74, 72, 10], [132, 130, 100], [66, 108, -60], [140, 78, 40]].map(([x, y, r]) => xthChive(p, x, y, 24, r)), `</g>`,
    ].join(''),

    // ガランプリーパットナムプラー（กะหล่ำปลีผัดน้ำปลา）: 手でちぎったキャベツを強火で、焦げ目、にんにく
    th_kalamphadnampla: p => [
        xthVessel(p, 'enamel'),
        K.pool(p, 100, 102, 124, '#c8a060', { op: .45, seed: 7, sy: .9 }),
        ...[[72, 74, 20], [112, 66, -30], [146, 88, 60], [60, 110, 100], [100, 98, 10], [136, 124, -60], [80, 140, 40], [118, 146, 130], [88, 112, 160], [124, 100, 80], [74, 92, -40], [102, 130, 20], [150, 120, 30], [56, 128, -20]].map(([x, y, r], i) => xthCabbagePiece(p, x, y, 34 + (i % 3) * 6, r, { seed: i })),
        xthGrains(p, 100, 102, 110, { cols: ['#d89a3a', '#b8762a', '#f2c672'], n: 34, size: 1.4, seed: 2 }),
        xthPepper(p, 100, 102, 100, 14),
    ].join(''),

    // ファクトンパットカイ（ฟักทองผัดไข่）: 皮つきのかぼちゃの薄切りと炒り卵、ねぎ
    th_faktongphadkhai: p => [
        xthVessel(p, 'melamine', { inside: '#f0dca8' }),
        K.pool(p, 100, 102, 124, '#d49a40', { op: .4, seed: 8, sy: .9 }),
        ...[[74, 78, 20], [114, 68, -30], [146, 96, 60], [62, 114, 100], [100, 98, 10], [134, 130, -60], [82, 142, 40], [118, 148, 160], [92, 120, -20], [128, 86, 130], [58, 92, 170]].map(([x, y, r]) => xthPumpkinSlice(p, x, y, 30, r)),
        `<g ${p.sh(.5)}>`, ...[[88, 88, 30], [126, 110, 28], [74, 128, 26], [110, 130, 24], [104, 74, 22], [146, 116, 20]].map(([x, y, s], i) => K.scrambled(p, x, y, s, { c: '#f8d248', seed: i, n: 3 })), `</g>`,
        `<g ${p.sh(.4)}>`, ...[[96, 106, 30], [130, 76, -40], [70, 102, 70], [116, 140, 10]].map(([x, y, r]) => xthScallionSeg(p, x, y, 20, r)), `</g>`,
        xthScallions(p, 100, 102, 90, 12, 4),
    ].join(''),

    // ヘットナンファー炒め（ผัดเห็ดนางฟ้า）: 手でさいたヒラタケ、ピーマン、ねぎ、赤唐辛子、こしょう
    th_hetnangfa: p => [
        xthPlate(p),
        K.pool(p, 100, 102, 130, '#8a5a2a', { op: .75, seed: 9, sy: .9 }),
        `<g ${p.sh(.4)}>`, ...[[96, 70, 20], [140, 108, -40], [70, 128, 60], [116, 132, 100], [64, 88, 10]].map(([x, y, r]) => K.pepperPiece(p, x, y, 22, r, { c: '#3f8f2f', strip: true })), `</g>`,
        ...[[74, 76, 30, 20], [118, 70, 30, -30], [146, 92, 26, 70], [62, 108, 28, 100], [100, 98, 30, 10], [134, 120, 28, -60], [84, 136, 28, 40], [120, 148, 24, 150], [96, 124, 26, -20], [140, 140, 22, 80], [80, 100, 24, 160]].map(([x, y, s, r], i) => xthOysterMushroom(p, x, y, s * 1.15, r, { seed: i, c: i % 2 ? '#c8a878' : '#b8986a' })),
        `<g ${p.sh(.4)}>`, ...[[88, 86, 30], [128, 102, -40], [104, 116, 70], [70, 116, 10], [130, 74, 100]].map(([x, y, r], i) => xthScallionSeg(p, x, y, 22, r, { white: i === 2 })), `</g>`,
        xthChiliSlice(p, 106, 84, 11, 20), xthChiliSlice(p, 82, 118, 10, -40), xthChiliSlice(p, 140, 112, 10, 60),
        xthPepper(p, 100, 102, 100, 22),
    ].join(''),
});

// 豚の皮の揚げ（ケープムー: ふくらんだ淡い金色、気泡）
function xthPorkRind(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthpr' + seed + x + y);
    const pts = ring(s / 2, 9, .4, R, 1.3, .7);
    let b = '';
    for (let i = 0; i < 5; i++) b += `<circle cx="${f1((R() - .5) * s * .6)}" cy="${f1((R() - .5) * s * .3)}" r="${f1(1 + R() * 1.6)}" fill="#fff4d4" opacity=".8"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .9)}" fill="${p.g('#eccb86', .35, .3)}" stroke="#b8904a" stroke-width=".6"/></g>
        <path d="M${f1(-s * .4)},${f1(s * .12)} Q0,${f1(s * .3)} ${f1(s * .4)},${f1(s * .1)}" stroke="#a8742c" stroke-width="2" fill="none" opacity=".5"/>${b}</g>`;
}
// ナムプリック（具の多いディップ）を小鉢に
function xthDipBowl(p, x, y, R, c, { grains = [], n = 50, size = 1.8, seed = 1, oil = null } = {}){
    return xthSaucer(p, x, y, R, c, { op: 0 })
        + `<circle cx="${x}" cy="${y}" r="${f1(R * .8)}" fill="${p.rg(c, .2, .25, .4, .38)}"/>`
        + xthGrains(p, x, y, R * 1.5, { cols: grains.length ? grains : [dk(c, .2), lt(c, .2)], n, size, seed })
        + (oil ? xthOil(p, x, y, R * 1.4, { n: 7, c: oil, op: .55, rmax: 1.8, seed }) : '')
        + `<path d="M${f1(x - R * .5)},${f1(y - R * .1)} A${f1(R * .6)},${f1(R * .6)} 0 0 1 ${f1(x - R * .1)},${f1(y - R * .5)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".45"/>`;
}
// チャオム入りの卵焼きの四角（きつね色、緑の羽のような葉）
function xthChaomSquare(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthco' + seed + x + y);
    const g = xthGrains(p, 0, 0, s, { cols: ['#2f6a22', '#4f9a34', '#3f8a2a'], n: 26, size: 1.5, seed, w: s * .82, h: s * .82 });
    let br = '';
    for (let i = 0; i < 4; i++) br += `<ellipse cx="${f1((R() - .5) * s * .6)}" cy="${f1((R() - .5) * s * .6)}" rx="${f1(s * .14)}" ry="${f1(s * .08)}" fill="#b86a1a" opacity=".25"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f1(-s / 2)}" y="${f1(-s / 2)}" width="${s}" height="${s}" rx="${f1(s * .1)}" fill="${p.g('#eeb648', .3, .3)}" stroke="#b07a1c" stroke-width=".8"/></g>
        ${br}${g}${xthShine(`M${f1(-s * .38)},${f1(-s * .36)} L${f1(s * .2)},${f1(-s * .38)}`, 1.4, .6)}</g>`;
}
// きゅうりのいちょう切り（アチャート）
function xthCucumberQuarter(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M0,0 L${f1(s)},0 A${f1(s)},${f1(s)} 0 0 0 0,${f1(-s)}Z" fill="#3f7d2e"/><path d="M0,0 L${f1(s - 1.4)},0 A${f1(s - 1.4)},${f1(s - 1.4)} 0 0 0 0,${f1(-s + 1.4)}Z" fill="${p.g('#d8ecb4', .2, .1)}"/><path d="M${f1(s * .2)},${f1(-s * .2)} L${f1(s * .5)},${f1(-s * .2)} M${f1(s * .25)},${f1(-s * .45)} L${f1(s * .4)},${f1(-s * .35)}" stroke="#f2f8e0" stroke-width="1.2" stroke-linecap="round"/></g>`;
}
// 生えびの開き（半透明の灰色がかったピンク、赤い尾）
function xthRawShrimp(p, x, y, L, r = 0){
    const w = L * .36;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f1(L * .38)},0 L${f1(L / 2 + 3)},${f1(-w * .4)} Q${f1(L / 2 + 1)},0 ${f1(L / 2 + 3)},${f1(w * .4)}Z" fill="#e0502a"/>
        <path d="M${f1(-L / 2)},0 Q${f1(-L / 2)},${f1(-w * .6)} ${f1(-L * .1)},${f1(-w * .55)} Q${f1(L * .3)},${f1(-w * .5)} ${f1(L * .4)},0 Q${f1(L * .3)},${f1(w * .5)} ${f1(-L * .1)},${f1(w * .55)} Q${f1(-L / 2)},${f1(w * .6)} ${f1(-L / 2)},0Z" fill="${p.g('#e8c4c0', .3, .2)}" stroke="#c08a88" stroke-width=".6"/></g>
        <path d="M${f1(-L * .45)},0 L${f1(L * .36)},0" stroke="#d89a98" stroke-width="1.6" opacity=".7"/>
        <path d="M${f1(-L * .3)},${f1(-w * .45)} Q${f1(-L * .25)},0 ${f1(-L * .3)},${f1(w * .45)} M${f1(-L * .05)},${f1(-w * .48)} Q0,0 ${f1(-L * .05)},${f1(w * .48)} M${f1(L * .18)},${f1(-w * .4)} Q${f1(L * .22)},0 ${f1(L * .18)},${f1(w * .4)}" stroke="#f6e4e0" stroke-width="1" fill="none" opacity=".8"/>
        ${xthShine(`M${f1(-L * .38)},${f1(-w * .3)} Q0,${f1(-w * .48)} ${f1(L * .25)},${f1(-w * .3)}`, 1.2, .8)}</g>`;
}
// ゴーヤの薄切り（淡い緑の輪、中は白）
function xthBitterSlice(p, x, y, s, r = 0){
    const pts = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.28, rr = s / 2 * (i % 2 ? .9 : 1); return [Math.cos(a) * rr, Math.sin(a) * rr * .9]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#8cc062', .3, .25)}" stroke="#4f8a2e" stroke-width=".5"/></g><ellipse rx="${f1(s * .3)}" ry="${f1(s * .26)}" fill="#eef4dc"/></g>`;
}
// 塩漬け魚の輪切りを揚げたもの（黒い皮の縁、きつね色の身、中骨）
function xthSaltFish(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthsf' + seed + x + y);
    const w = s, h = s * .6;
    let fl = '';
    for (let i = 0; i < 4; i++){ const xx = -w * .3 + i * w * .2 + (R() - .5) * 3; fl += `M${f1(xx)},${f1(-h * .2)} Q${f1(xx + 2)},${f1(h * .1)} ${f1(xx)},${f1(h * .42)} `; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${w}" height="${f1(h)}" rx="${f1(h * .3)}" fill="${p.g('#c8843a', .3, .32)}" stroke="#7a4a14" stroke-width=".8"/></g>
        <rect x="${f1(-w / 2 + .8)}" y="${f1(-h / 2 + .8)}" width="${f1(w - 1.6)}" height="${f1(h * .3)}" rx="${f1(h * .15)}" fill="${p.g('#5a5048', .35, .25)}"/>
        <g ${p.crumb(.8)}><rect x="${f1(-w / 2 + 2)}" y="${f1(-h * .1)}" width="${f1(w - 4)}" height="${f1(h * .55)}" rx="3" fill="#d8984a" opacity=".55"/></g>
        <path d="${fl}" stroke="#f2d8a0" stroke-width="1.2" fill="none" opacity=".75"/>
        ${xthShine(`M${f1(-w * .38)},${f1(-h * .32)} L${f1(w * .3)},${f1(-h * .34)}`, 1.3, .6)}</g>`;
}
// 揚げ豆腐（三角、きつね色の皮と白い断面）
function xthFriedTofu(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><g ${p.crumb(.9)}><rect x="${f1(-s / 2)}" y="${f1(-s / 2)}" width="${s}" height="${s}" rx="${f1(s * .16)}" fill="${p.g('#d8962e', .3, .32)}" stroke="#8a5a14" stroke-width=".8"/></g></g>
        <path d="M${f1(-s / 2 + 2)},${f1(s / 2 - 2)} L${f1(-s / 2 + 2)},${f1(-s / 6)} L${f1(s / 2 - 2)},${f1(s / 2 - 2)}Z" fill="${p.g('#f8f0da', .2, .12)}" stroke="#d8c8a0" stroke-width=".5"/>
        ${xthShine(`M${f1(-s * .32)},${f1(-s * .36)} L${f1(s * .28)},${f1(-s * .36)}`, 1.4, .6)}</g>`;
}
// 焼きなす（皮をむいた細長い身、焦げの筋）
function xthGrilledEggplant(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthge' + seed + x + y);
    const pts = [[-L / 2, 0], [-L * .4, -w / 2], [L * .1, -w * .55], [L * .45, -w * .4], [L / 2, 0], [L * .45, w * .4], [L * .1, w * .55], [-L * .4, w / 2]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    let st = '';
    for (let i = 0; i < 4; i++){ const yy = (i - 1.5) * w * .22; st += `M${f1(-L * .4)},${f1(yy)} Q0,${f1(yy + (R() - .5) * 4)} ${f1(L * .42)},${f1(yy)} `; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .8)}" fill="${p.g('#a8a060', .3, .3)}" stroke="#5a5428" stroke-width=".7"/></g>
        <path d="${st}" stroke="#d8d098" stroke-width="1.2" fill="none" opacity=".8"/>
        <path d="M${f1(-L * .2)},${f1(-w * .3)} L${f1(L * .05)},${f1(-w * .25)} M${f1(L * .2)},${f1(w * .2)} L${f1(L * .35)},${f1(w * .15)}" stroke="#3a2a14" stroke-width="2" stroke-linecap="round" opacity=".35"/>
        <ellipse cx="${f1(-L / 2 + 2)}" cy="0" rx="3" ry="${f1(w * .3)}" fill="#4f6a2a"/>
        ${xthShine(`M${f1(-L * .35)},${f1(-w * .32)} Q0,${f1(-w * .48)} ${f1(L * .3)},${f1(-w * .34)}`, 1.3, .6)}</g>`;
}

Object.assign(D, {
    // ナムプリックオン（น้ำพริกอ่อง）: 豚ひき肉とトマトの橙赤のディップ、まわりにきゅうり、いんげん、キャベツ、ケープムー
    th_namprikong: p => [
        xthVessel(p, 'celadon', { inside: '#e2ecdc' }),
        `<g ${p.sh(.5)}>`,
        ...[[150, 92, 95], [146, 116, 85], [56, 86, 80]].map(([x, y, r]) => xthLongBean(p, x, y, 30, r, { c: '#6aa84a', w: 5 })),
        xthCucumber(p, 70, 148, 17, 20), xthCucumber(p, 90, 158, 17, 40), xthCucumber(p, 112, 158, 17, 60), xthCucumber(p, 132, 150, 17, 80),
        xthCabbagePiece(p, 64, 62, 30, 20, { seed: 1 }), xthCabbagePiece(p, 46, 112, 26, 80, { seed: 2 }),
        `</g>`,
        ...[[110, 48, 10], [136, 58, -20], [150, 140, 30], [52, 138, -30], [88, 46, 40]].map(([x, y, r], i) => xthPorkRind(p, x, y, 26, r, { seed: i })),
        xthDipBowl(p, 100, 102, 38, '#d0502a', { grains: ['#e8742e', '#a83018', '#8a4a2a', '#f09a5a'], n: 90, size: 2.4, seed: 2, oil: '#e8401a' }),
        xthCoriander(p, 106, 94, 15, 20),
    ].join(''),

    // ナムプリックヌム（น้ำพริกหนุ่ม）: 焼いた青唐辛子をたたいた淡い緑のディップ、きゅうり、いんげん、ケープムー
    th_namprikum: p => [
        xthVessel(p, 'enamel'),
        `<g ${p.sh(.5)}>`,
        ...[[148, 96, 95], [154, 116, 85], [52, 92, 80]].map(([x, y, r]) => xthLongBean(p, x, y, 30, r, { c: '#5a9e3a', w: 5 })),
        xthCucumber(p, 70, 148, 17, 20), xthCucumber(p, 90, 158, 17, 40), xthCucumber(p, 112, 158, 17, 60), xthCucumber(p, 132, 150, 17, 80),
        `</g>`,
        ...[[66, 62, 20], [104, 46, -10], [134, 60, 30], [52, 126, -40], [148, 138, 20]].map(([x, y, r], i) => xthPorkRind(p, x, y, 28, r, { seed: i })),
        xthDipBowl(p, 100, 102, 38, '#a8ac68', { grains: ['#c8cc8a', '#7a8a3a', '#e8e2b0', '#5a6a2a'], n: 90, size: 2.6, seed: 3 }),
        `<g ${p.sh(.4)}>`, xthLeaf(p, 92, 96, 13, 20, { c: '#6a8a2a', narrow: .55 }), xthLeaf(p, 110, 110, 12, -40, { c: '#7a9a3a', narrow: .55 }), `</g>`,
        xthCoriander(p, 106, 92, 15, 20),
    ].join(''),

    // カイトートチャオム（ไข่ทอดชะอม）: チャオムの葉入りの卵焼きを四角に切って重ね、ナムプリックカピを添える
    th_khaijiaochaom: p => [
        xthPlate(p),
        ...[[72, 72, 6], [112, 66, -4], [60, 110, -8], [100, 104, 10], [140, 100, 4], [80, 146, 4], [120, 140, -6]].map(([x, y, r], i) => xthChaomSquare(p, x, y, 38, r, { seed: i })),
        xthSaucer(p, 148, 60, 20, '#6b4a3a'),
        xthGrains(p, 148, 60, 22, { cols: ['#c8301c', '#e8552e', '#4f8a2a'], n: 14, size: 1.1, seed: 4 }),
        xthCoriander(p, 92, 88, 15, 20),
    ].join(''),

    // アチャート（อาจาด）: 澄んだ甘酢に、いちょう切りのきゅうり、エシャロット、赤唐辛子
    th_ajad: p => [
        xthSmallBowl(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#f2e8c2', .2, .15, .42, .4)}" opacity=".9"/>`,
        ...xthSpots('ajad', 24, 50, 14).map(([x, y, r]) => xthCucumberQuarter(p, x, y, 21, r)),
        xthShallot(p, 92, 120, 14, 20), xthShallot(p, 126, 70, 13, -30), xthShallot(p, 70, 128, 12, 60), xthShallot(p, 140, 104, 12, 10), xthShallot(p, 104, 88, 12, 80),
        xthChiliSlice(p, 108, 112, 11, 20), xthChiliSlice(p, 80, 100, 10, -40), xthChiliSlice(p, 122, 128, 10, 70), xthChiliSlice(p, 96, 74, 10, 10), xthChiliSlice(p, 134, 92, 9, 120),
        xthSoupShine(100, 100, 74, .45),
    ].join(''),

    // グンチェーナムプラー（กุ้งแช่น้ำปลา）: 開いた生えびをゴーヤの薄切りに並べ、にんにく、唐辛子、ミント、緑の辛いたれ
    th_kungchaenampla: p => [
        xthVessel(p, 'blue'),
        ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.283; return xthBitterSlice(p, 100 + Math.cos(a) * 54, 100 + Math.sin(a) * 54, 22, i * 20); }),
        K.pool(p, 100, 102, 62, '#a8bc58', { op: .7, seed: 5 }),
        ...Array.from({ length: 7 }, (_, i) => { const a = i / 7 * 6.283 - 1.2; return xthRawShrimp(p, 100 + Math.cos(a) * 30, 100 + Math.sin(a) * 30, 50, a * 57.3); }),
        xthGrains(p, 100, 102, 70, { cols: ['#f6eed6', '#ece0bc'], n: 14, size: 2.4, seed: 6 }),
        xthChiliRing(p, 92, 108, 5.5, 0, { c: '#3f8f2f' }), xthChiliRing(p, 112, 96, 5.5), xthChiliRing(p, 100, 86, 5.5, 0, { c: '#3f8f2f' }), xthChiliRing(p, 108, 116, 5),
        `<g ${p.sh(.4)}>`, xthMint(p, 96, 98, 16, 20), xthMint(p, 116, 108, 14, -50), `</g>`,
    ].join(''),

    // ムーワーン（หมูหวาน）: 砂糖と醤油で照りよく煮た濃い茶の豚の薄切り、揚げエシャロット
    th_moowan: p => [
        xthVessel(p, 'blue', { shape: 'bowl' }),
        xthMound(p, 100, 100, 138, '#6a3214', { seed: 2, rough: false }),
        ...[[78, 74, -20], [120, 68, 30], [62, 108, 70], [108, 98, -10], [144, 100, 80], [86, 134, 20], [128, 134, -40], [98, 66, 60], [140, 70, 10], [104, 150, 0], [80, 102, 130], [60, 136, 40], [146, 128, 110]].map(([x, y, r], i) => xthPorkSlice(p, x, y, 40, r, { c: i % 2 ? '#8a3e16' : '#9e4c1e', fat: '#d89a5a', char: false, seed: i, gloss: .95 })),
        xthCrispShallot(p, 100, 100, 96, { n: 40, seed: 3 }),
        `<path d="M50,90 Q60,62 92,50" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>`,
    ].join(''),

    // パットトゥアランタオグン（ผัดถั่วลันเตากุ้ง）: 絹さや、むきえび、にんじん、にんにく、つやのあるたれ
    th_phadthualantao: p => [
        xthPlate(p),
        K.pool(p, 100, 102, 126, '#b8955a', { op: .45, seed: 6, sy: .9 }),
        `<g ${p.sh(.5)}>`, ...[[72, 76, 20], [104, 66, -30], [140, 80, 60], [58, 108, 100], [92, 96, 10], [128, 106, -60], [150, 120, 70], [72, 136, -20], [104, 128, 50], [130, 146, 0], [96, 154, 100], [120, 86, 120], [80, 112, 150], [60, 88, 30], [112, 112, 80], [140, 64, -10]].map(([x, y, r]) => K.snowPea(p, x, y, 30, r)), `</g>`,
        ...[[86, 84, 20], [124, 94, -40], [96, 118, 120], [70, 120, 70], [136, 130, 160]].map(([x, y, r]) => xthPeeledShrimp(p, x, y, 26, r)),
        xthCarrotFlower(p, 112, 76, 14, 10), xthCarrotFlower(p, 80, 100, 13, 20), xthCarrotFlower(p, 114, 140, 13, 0), xthCarrotFlower(p, 146, 102, 12, 30),
        xthGarlicBits(p, 100, 102, 100, 20, 2),
    ].join(''),

    // ヤムマクアヤーオ（ยำมะเขือยาว）: 焼いて皮をむいた長なすを並べ、甘酸っぱいたれ、ひき肉、干しえび、エシャロット、ゆで卵
    th_yammakhuea: p => [
        xthFishPlate(p, { rim: '#2f8a4e' }),
        ...[[100, 78, -4], [98, 100, 2], [102, 122, -2]].map(([x, y, r], i) => xthGrilledEggplant(p, x, y, 140, 26, r, { seed: i })),
        `<path d="M40,98 Q70,88 100,96 Q130,104 160,96" stroke="#d8a868" stroke-width="10" fill="none" stroke-linecap="round" opacity=".6"/>`,
        xthMince(p, 100, 100, 60, { n: 50, c: '#a8784a', seed: 2, sy: .8 }),
        `<g ${p.sh(.3)}>`, xthDriedShrimp(p, 80, 92, 10, 20), xthDriedShrimp(p, 118, 106, 10, -40), xthDriedShrimp(p, 64, 110, 9, 80), xthDriedShrimp(p, 136, 90, 9, 10), `</g>`,
        xthShallot(p, 96, 112, 13, 20), xthShallot(p, 120, 84, 12, -30), xthShallot(p, 74, 78, 12, 60),
        K.eggHalf(p, 54, 88, 26, 10), K.eggHalf(p, 148, 114, 26, -20),
        xthCoriander(p, 106, 92, 16, 20), xthCoriander(p, 84, 120, 14, -40),
        xthChiliRing(p, 100, 86, 5), xthChiliRing(p, 130, 118, 5),
    ].join(''),

    // タオフートート（เต้าหู้ทอด）: きつね色に揚げた三角の豆腐、ピーナッツを浮かべた甘いチリソース、パクチー
    th_taohutod: p => [
        xthVessel(p, 'melamine', { inside: '#cfe0b8' }),
        ...[[68, 80, 8], [104, 70, -6], [62, 118, -4], [100, 108, 10], [140, 100, 4], [84, 148, 6], [122, 142, -8], [144, 136, 14]].map(([x, y, r]) => xthFriedTofu(p, x, y, 34, r)),
        xthSaucer(p, 140, 52, 22, '#d8502a'),
        xthPeanuts(p, 140, 52, 24, 14, 5),
        xthCoriander(p, 96, 116, 16, 20), xthCoriander(p, 60, 94, 14, -30),
    ].join(''),

    // プラーケムトート（ปลาเค็มทอด）: 輪切りの塩漬け魚をきつね色に揚げ、生のエシャロット、唐辛子、ライム
    th_plakhemthod: p => [
        xthVessel(p, 'enamel'),
        ...[[78, 70, 10], [118, 74, -10], [70, 104, 20], [110, 108, -4], [80, 140, 14], [120, 142, -12]].map(([x, y, r], i) => xthSaltFish(p, x, y, 46, r, { seed: i })),
        xthShallot(p, 146, 100, 16, 20), xthShallot(p, 140, 120, 15, -30), xthShallot(p, 152, 82, 14, 60), xthShallot(p, 130, 140, 14, 10), xthShallot(p, 46, 100, 14, 80),
        xthChiliRing(p, 148, 112, 5.5), xthChiliRing(p, 138, 92, 5.5, 0, { c: '#3f8f2f' }), xthChiliRing(p, 156, 98, 5), xthChiliRing(p, 52, 116, 5),
        xthLime(p, 60, 150, 24, 30), xthLime(p, 140, 156, 22, -20),
    ].join(''),
});

// ---------- 汁物の部品 ----------
// 具の群れを器の中心から少し広げる（汁の面いっぱいに具を）
const xthWide = (k = 1.08) => `<g transform="matrix(${k} 0 0 ${k} ${f1(100 - 100 * k)} ${f1(100 - 100 * k)})">`;
// 汁の面（器の内側いっぱい）: 澄んだ汁は薄いベールと油の粒
function xthBroth(p, c, { R = 79, op = .9, veil = null, veilOp = .3, oil = null, oilN = 10, oilR = 2, seed = 1, cloudy = 0 } = {}){
    return K.liquid(p, { R, c, op, shine: false })
        + (veil ? `<circle cx="100" cy="100" r="${f1(R * .76)}" fill="${veil}" opacity="${veilOp}"/>` : '')
        + (cloudy ? `<circle cx="96" cy="96" r="${f1(R * .6)}" fill="#fff" opacity="${cloudy}"/>` : '')
        + (oil ? xthOil(p, 100, 100, R * 1.85, { n: oilN, c: oil, op: .5, rmax: oilR, seed }) : '');
}
// 冬瓜の角切り（半透明の淡い緑、皮の濃い緑）
function xthWinterMelon(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f1(-s / 2)}" y="${f1(-s * .42)}" width="${s}" height="${f1(s * .84)}" rx="${f1(s * .18)}" fill="${p.g('#d8e4b8', .3, .2)}" stroke="#9ab070" stroke-width=".6" opacity=".95"/></g>
        <rect x="${f1(-s / 2)}" y="${f1(s * .26)}" width="${s}" height="${f1(s * .16)}" rx="${f1(s * .08)}" fill="#5a8a3a" opacity=".9"/>
        <rect x="${f1(-s * .3)}" y="${f1(-s * .24)}" width="${f1(s * .6)}" height="${f1(s * .34)}" rx="${f1(s * .1)}" fill="#eef4dc" opacity=".6"/>
        ${xthShine(`M${f1(-s * .36)},${f1(-s * .3)} L${f1(s * .2)},${f1(-s * .32)}`, 1.2, .7)}</g>`;
}
// ひき肉のかたまり（汁の中: 灰色がかった淡い茶）
function xthPorkClump(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'xthpc' + seed + x + y);
    return `<g ${p.sh(.6)}><g ${p.rough(1.8, .25)}><path ${T(x, y)} d="${smooth(ring(s / 2, 8, .4, R, 1.1, .9), true, .8)}" fill="${p.rg('#c8a888', .25, .3, .38, .35)}" stroke="#8a6a4a" stroke-width=".6"/></g></g>`
        + xthGrains(p, x, y, s * .8, { cols: ['#a8866a', '#dcc0a0'], n: 8, size: 1.1, seed });
}
// ゴーヤの肉詰め（輪切り）
function xthStuffedBitter(p, x, y, s, r = 0){
    const pts = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.28, rr = s / 2 * (i % 2 ? .88 : 1); return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#b8d88a', .3, .25)}" stroke="#6a9a42" stroke-width=".7"/></g>
        <circle r="${f1(s * .32)}" fill="${p.rg('#c8a68a', .25, .3, .38, .35)}" stroke="#e2eccc" stroke-width="2"/>
        ${xthGrains(p, 0, 0, s * .5, { cols: ['#a88468', '#6a5a3a', '#e0c8a8'], n: 10, size: 1.1, seed: x })}
        ${xthShine(`M${f1(-s * .36)},${f1(-s * .1)} Q${f1(-s * .24)},${f1(-s * .34)} ${f1(s * .02)},${f1(-s * .4)}`, 1.4, .6)}</g>`;
}
// 汁用ののり（黒紫のやぶれた薄い膜）
function xthLaver(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthlv' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 12, .55, R, 1.25, .8), true, .9)}" fill="#2a2a24" opacity=".85" stroke="#1a1a14" stroke-width=".5"/>
        <path d="M${f1(-s * .3)},0 Q0,${f1(-s * .1)} ${f1(s * .3)},${f1(s * .04)}" stroke="#4a5a3a" stroke-width="1.4" fill="none" opacity=".7"/></g>`;
}
// 溶き卵の帯（汁の中で固まった、淡い黄色）
function xthEggDrop(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthed' + seed + x + y);
    const pts = Array.from({ length: 6 }, (_, i) => [-L / 2 + i * L / 5, (R() - .5) * L * .3]);
    const d = xthSm(pts);
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#e8c050" stroke-width="${f1(L * .2)}" fill="none" stroke-linecap="round" opacity=".9"/><path d="${d}" stroke="#fbe490" stroke-width="${f1(L * .11)}" fill="none" stroke-linecap="round"/></g>`;
}
// 豚スペアリブの一切れ（淡い茶の肉、白い骨の断面）
function xthRib(p, x, y, s, r = 0, { c = '#c09a72', seed = 1 } = {}){
    const R = rng(p.id + 'xthrb' + seed + x + y);
    const w = s, h = s * .62;
    const pts = [[-w * .42, -h * .5], [w * .1, -h * .58], [w * .4, -h * .4], [w * .45, h * .35], [w * .05, h * .55], [-w * .45, h * .45], [-w * .5, 0]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${f1(w * .3)}" y="${f1(-h * .22)}" width="${f1(w * .32)}" height="${f1(h * .44)}" rx="${f1(h * .18)}" fill="${p.g('#f2e8d2', .2, .25)}" stroke="#b8a480" stroke-width=".6"/>
        <path d="${smooth(pts, true, .7)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <ellipse cx="${f1(w * .6)}" cy="0" rx="${f1(w * .05)}" ry="${f1(h * .2)}" fill="#d8c0a8" stroke="#b8a480" stroke-width=".5"/>
        <path d="M${f1(-w * .38)},${f1(-h * .1)} Q0,${f1(-h * .25)} ${f1(w * .35)},${f1(-h * .08)} M${f1(-w * .3)},${f1(h * .22)} Q0,${f1(h * .1)} ${f1(w * .3)},${f1(h * .24)}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".5"/>
        ${xthShine(`M${f1(-w * .34)},${f1(-h * .34)} Q${f1(-w * .05)},${f1(-h * .5)} ${f1(w * .25)},${f1(-h * .38)}`, 1.3, .6)}</g>`;
}
// 大根の半月（煮て半透明）
const xthDaikon = (p, x, y, s, r = 0) => `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f1(-s / 2)},${f1(s * .2)} A${f1(s / 2)},${f1(s * .5)} 0 0 1 ${f1(s / 2)},${f1(s * .2)}Z" fill="${p.g('#efe8d0', .25, .2)}" stroke="#c8bc98" stroke-width=".6" opacity=".95"/></g><path d="M${f1(-s * .34)},${f1(s * .14)} A${f1(s * .34)},${f1(s * .34)} 0 0 1 ${f1(s * .34)},${f1(s * .14)}" stroke="#fff" stroke-width=".9" fill="none" opacity=".6"/></g>`;
// 漬けた高菜（パッカードーン: 黄緑がかったオリーブ色の葉と茎）
const xthPickledGreen = (p, x, y, s, r = 0, seed = 1) => K.leafPiece(p, x, y, s, r, { c: '#b8b450', vein: '#e8e6b0', seed });
function xthPickledStem(p, x, y, L, r = 0){
    const w = L * .4;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${L}" height="${f1(w)}" rx="${f1(w * .3)}" fill="${p.g('#d8d48a', .3, .25)}" stroke="#8a8a3a" stroke-width=".6"/></g><path d="M${f1(-L * .4)},${f1(-w * .1)} L${f1(L * .4)},${f1(-w * .1)} M${f1(-L * .4)},${f1(w * .2)} L${f1(L * .4)},${f1(w * .2)}" stroke="#b8b462" stroke-width=".7"/></g>`;
}
// 豚バラの角切り（皮・脂・赤身の層、五香で茶色）
function xthPorkBelly(p, x, y, s, r = 0, { c = '#8a4a22' } = {}){
    const w = s, h = s * .8;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${w}" height="${f1(h)}" rx="${f1(s * .14)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .45)}" stroke-width=".7"/></g>
        <rect x="${f1(-w / 2 + 1)}" y="${f1(-h / 2 + 1)}" width="${w - 2}" height="${f1(h * .22)}" rx="${f1(s * .1)}" fill="${p.g(dk(c, .25), .3, .25)}"/>
        <rect x="${f1(-w / 2 + 1)}" y="${f1(-h * .25)}" width="${w - 2}" height="${f1(h * .2)}" rx="1.5" fill="${p.g(lt(c, .45), .3, .2)}"/>
        <rect x="${f1(-w / 2 + 1)}" y="${f1(h * .12)}" width="${w - 2}" height="${f1(h * .12)}" rx="1.5" fill="${lt(c, .35)}" opacity=".8"/>
        ${xthShine(`M${f1(-w * .38)},${f1(-h * .38)} L${f1(w * .3)},${f1(-h * .4)}`, 1.4, .7)}</g>`;
}
// ノコギリコリアンダー（パクチーファラン: 長い葉、縁にぎざぎざ）
function xthSawtooth(p, x, y, L, r = 0){
    const w = L * .24;
    let e = `M${f1(-L / 2)},0`;
    for (let i = 1; i <= 6; i++) e += ` L${f1(-L / 2 + i * L / 6 - L / 12)},${f1(-w / 2 - (i % 2) * .8)} L${f1(-L / 2 + i * L / 6)},${f1(-w / 2 + .6)}`;
    e += ` L${f1(L / 2)},0`;
    for (let i = 5; i >= 0; i--) e += ` L${f1(-L / 2 + i * L / 6 + L / 12)},${f1(w / 2 + (i % 2) * .8)} L${f1(-L / 2 + i * L / 6)},${f1(w / 2 - .6)}`;
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="${e}Z" fill="${p.g('#3f8a2e', .3, .25)}" stroke="#25601c" stroke-width=".5" stroke-linejoin="round"/></g><path d="M${f1(-L * .45)},0 L${f1(L * .45)},0" stroke="#8cc062" stroke-width=".8"/></g>`;
}
// 白身魚のひと切れ（汁の中: 白い身、灰色の皮）
function xthFishChunk(p, x, y, s, r = 0, { seed = 1, skin = '#7a7a72' } = {}){
    const R = rng(p.id + 'xthfk' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.15, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .5)}" fill="${p.g('#f6f0e2', .2, .2)}" stroke="#c8baa0" stroke-width=".7"/></g>
        <path d="M${f1(-s * .55)},${f1(-s * .12)} Q0,${f1(-s * .5)} ${f1(s * .58)},${f1(-s * .1)}" stroke="${skin}" stroke-width="${f1(s * .1)}" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M${f1(-s * .3)},${f1(s * .12)} l${f1(s * .14)},${f1(-s * .04)} M${f1(s * .02)},${f1(s * .2)} l${f1(s * .16)},${f1(-s * .03)}" stroke="#ddd0b6" stroke-width="1.2" stroke-linecap="round" fill="none"/>
        ${xthShine(`M${f1(-s * .3)},${f1(s * .02)} Q${f1(-s * .1)},${f1(-s * .1)} ${f1(s * .15)},${f1(-s * .02)}`, 1.1, .6)}</g>`;
}
// 青パパイヤの角切り（汁で煮て半透明）
function xthPapayaChunk(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f1(-s / 2)},${f1(-s * .3)} L${f1(s * .3)},${f1(-s * .45)} L${f1(s / 2)},${f1(s * .25)} L${f1(-s * .2)},${f1(s * .42)}Z" fill="${p.g('#e8e4a8', .3, .25)}" stroke="#a8a462" stroke-width=".6" stroke-linejoin="round" opacity=".95"/></g>
        <path d="M${f1(-s * .3)},${f1(-s * .18)} L${f1(s * .2)},${f1(-s * .28)}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".6"/></g>`;
}

Object.assign(D, {
    // ゲーンジュートファク（แกงจืดฟักหมูสับ）: 澄んだ汁に、半透明の冬瓜、豚ひき肉のかたまり、しいたけ、ねぎ、パクチー、揚げにんにく
    th_kaengjuedfak: p => [
        xthBowl(p),
        xthBroth(p, '#e9dcc0', { op: .85, veil: '#f6eedc', oil: '#f0cc74', oilN: 9, oilR: 1.6 }),
        xthWide(),
        ...[[76, 76, -10], [124, 72, 20], [64, 116, 30], [140, 112, -20], [104, 140, 10], [100, 100, -30]].map(([x, y, r]) => xthWinterMelon(p, x, y, 30, r)),
        ...[[100, 70], [70, 96], [128, 96], [84, 128], [124, 136], [146, 80], [56, 136]].map(([x, y], i) => xthPorkClump(p, x, y, 18, { seed: i })),
        ...[[90, 88, 20], [118, 118, -40], [80, 148, 60], [148, 132, 0]].map(([x, y, r]) => xthMushSlice(p, x, y, 17, r)),
        xthScallions(p, 100, 100, 120, 14, 2),
        xthCoriander(p, 112, 84, 16, 20), xthCoriander(p, 74, 108, 15, -40),
        xthFriedGarlic(p, 100, 100, 110, 18, 3),
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // ゲーンジュートマラヤッサイ（แกงจืดมะระยัดไส้หมูสับ）: 澄んだ汁に、豚ひき肉を詰めたゴーヤの輪切り、パクチー
    th_marayatsai: p => [
        xthVessel(p, 'blue', { shape: 'bowl' }),
        xthBroth(p, '#e3dcc0', { op: .85, veil: '#f4eedc', oil: '#f0cc74', oilN: 8, oilR: 1.6 }),
        xthWide(),
        ...[[78, 78, 0], [124, 76, 20], [68, 122, 40], [118, 122, 10], [100, 100, 30], [146, 104, 15], [96, 146, 5]].map(([x, y, r]) => xthStuffedBitter(p, x, y, 38, r)),
        xthMushSlice(p, 146, 136, 15, 30), xthMushSlice(p, 56, 96, 14, -40),
        xthCoriander(p, 106, 80, 16, 20), xthCoriander(p, 80, 102, 14, -40), xthCoriander(p, 136, 140, 14, 60),
        xthPepper(p, 100, 100, 100, 14),
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // ゲーンジュートサーライ（แกงจืดสาหร่ายหมูสับ）: 澄んだ汁に、黒い汁用ののり、豚の肉団子、溶き卵、ねぎ
    th_sarai: p => [
        xthVessel(p, 'celadon', { shape: 'bowl', inside: '#d4e4d4' }),
        xthBroth(p, '#ddd2b4', { op: .88, veil: '#ece4cc', oil: '#f0cc74', oilN: 8, oilR: 1.6 }),
        xthWide(),
        ...[[76, 80, 20], [126, 74, -30], [64, 120, 60], [132, 124, 10], [100, 104, 100], [96, 146, -20], [146, 98, 40]].map(([x, y, r], i) => xthLaver(p, x, y, 40, r, { seed: i })),
        ...[[86, 96, 30], [120, 104, -20], [104, 70, 70], [80, 134, 10], [126, 142, 120]].map(([x, y, r], i) => xthEggDrop(p, x, y, 28, r, { seed: i })),
        xthPorkBall(p, 100, 82, 20, { seed: 1 }), xthPorkBall(p, 70, 102, 19, { seed: 2 }), xthPorkBall(p, 134, 92, 19, { seed: 3 }), xthPorkBall(p, 108, 126, 20, { seed: 4 }), xthPorkBall(p, 74, 144, 17, { seed: 5 }), xthPorkBall(p, 142, 128, 17, { seed: 6 }),
        xthScallions(p, 100, 100, 120, 22, 2),
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // ゲーンジュートフアチャイタオ（แกงจืดหัวไชเท้าซี่โครงหมู）: 澄んだ汁に、半透明の大根、豚スペアリブ、にんじん、ねぎ
    th_huachaitao: p => [
        xthVessel(p, 'enamel', { shape: 'bowl' }),
        xthBroth(p, '#e2d4b0', { op: .88, veil: '#f2e8cc', oil: '#f0c460', oilN: 10, oilR: 1.8 }),
        xthWide(),
        ...[[76, 74, 10], [126, 70, -20], [60, 112, 80], [146, 112, 60], [102, 104, -10], [92, 146, 20]].map(([x, y, r]) => xthDaikon(p, x, y, 34, r)),
        ...[[100, 74, 20], [72, 132, -30], [128, 136, 40], [130, 96, 100], [80, 100, 160]].map(([x, y, r], i) => xthRib(p, x, y, 28, r, { seed: i })),
        ...[[110, 122, 20], [148, 84, 60], [60, 90, -30]].map(([x, y, r]) => K.carrotChunk(p, x, y, 16, r)),
        xthScallions(p, 100, 100, 120, 18, 3),
        xthPepper(p, 100, 100, 110, 16),
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // トムパッカードーン（ต้มผักกาดดองซี่โครงหมู）: 少し酸っぱい黄色みの汁に、漬けた高菜、豚スペアリブ、トマト
    th_phakkaddong: p => [
        xthVessel(p, 'blue', { shape: 'bowl' }),
        xthBroth(p, '#d8c486', { op: .9, veil: '#e8dca8', oil: '#e8b840', oilN: 10, oilR: 1.8 }),
        xthWide(),
        ...[[78, 76, 20], [126, 70, -30], [60, 116, 70], [140, 116, 10], [100, 140, -20], [104, 100, 120]].map(([x, y, r], i) => xthPickledGreen(p, x, y, 34, r, i)),
        ...[[96, 72, 30], [64, 92, -60], [134, 92, 70], [84, 124, 10], [126, 140, -30]].map(([x, y, r]) => xthPickledStem(p, x, y, 26, r)),
        ...[[110, 86, 20], [76, 140, -40], [146, 132, 60], [86, 100, 100]].map(([x, y, r], i) => xthRib(p, x, y, 28, r, { seed: i })),
        xthTomato(p, 120, 116, 22, 30), xthTomato(p, 64, 136, 20, -40), xthTomato(p, 116, 60, 18, 80),
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // トムチャップチャーイ（ต้มจับฉ่าย）: 土鍋で長く煮た茶色の汁に、白菜、カナー、キャベツ、大根、豚肉、キンチャイ
    th_chapchai: p => [
        xthVessel(p, 'clay'),
        xthBroth(p, '#9a7445', { op: .95, veil: '#b08a5a', veilOp: .35, oil: '#d8a040', oilN: 10, oilR: 1.8 }),
        xthWide(),
        `<g ${p.sh(.5)}>`,
        ...[[74, 76, 20], [126, 70, -30], [60, 118, 70], [140, 118, 10], [100, 142, -20]].map(([x, y, r], i) => xthNapa(p, x, y, 36, r, i + 1)),
        ...[[100, 96, 30], [76, 140, -60]].map(([x, y, r], i) => K.napaStem(p, x, y, 30, r)),
        `</g>`,
        ...[[96, 70, 26, 20], [140, 92, 26, -40], [70, 100, 24, 60]].map(([x, y, s, r], i) => xthKanaLeaf(p, x, y, s, r, { seed: i + 3 })),
        xthKanaStem(p, 118, 132, 20, 40), xthKanaStem(p, 58, 90, 18, -20),
        xthDaikon(p, 120, 104, 26, 20), xthDaikon(p, 82, 118, 24, -30),
        ...[[104, 84, 20], [128, 144, -30], [88, 100, 60]].map(([x, y, r], i) => xthPorkSlice(p, x, y, 28, r, { c: '#b88a5a', fat: '#efdcb8', char: false, seed: i, gloss: .5 })),
        xthCelery(p, 110, 118, 24, 30), xthCelery(p, 66, 68, 22, -40),
        `<path d="M44,92 A60,60 0 0 1 84,44" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".35"/>`,
        '</g>',
    ].join(''),

    // カイパロー（ไข่พะโล้）: 五香の濃い茶色の甘い煮汁に、色の染みた卵、豚バラ、揚げ豆腐、パクチー
    th_palo: p => [
        xthBowl(p),
        xthBroth(p, '#5e3a1e', { op: .97, veil: '#7a4e2a', veilOp: .3, oil: '#c88a3a', oilN: 12, oilR: 2 }),
        xthWide(),
        ...[[74, 112, 10], [132, 76, -20], [118, 136, 30], [70, 74, -10], [146, 112, 40]].map(([x, y, r]) => xthPorkBelly(p, x, y, 28, r)),
        ...[[98, 74, 20], [102, 150, -20], [56, 94, 30]].map(([x, y, r]) => xthYellowTofu(p, x, y, 20, r).replace(/#e8b85a/g, '#a8622a')),
        K.eggHalf(p, 100, 104, 38, 10, { stain: '#a8642a', yolk: '#f0a82a' }), K.eggHalf(p, 132, 106, 32, -30, { stain: '#9a5a26', yolk: '#f0a82a' }), K.eggHalf(p, 82, 136, 32, 40, { stain: '#a8642a', yolk: '#f0a82a' }),
        `<g ${p.sh(.6)}><circle cx="120" cy="56" r="13" fill="${p.rg('#8a4a1e', .25, .3, .35, .32)}" stroke="#4a2410" stroke-width=".6"/></g><ellipse cx="115" cy="51" rx="4" ry="2" fill="#fff" opacity=".5"/>`,
        xthCoriander(p, 110, 90, 17, 20), xthCoriander(p, 86, 120, 15, -40), xthCoriander(p, 144, 136, 14, 60),
        '</g>',
        xthSoupShine(100, 100, 79, .35),
    ].join(''),

    // トムセープ（ต้มแซ่บกระดูกหมู）: 土鍋に、唐辛子の粉が浮く辛酸っぱい汁、豚スペアリブ、レモングラス、ガランガル、こぶみかんの葉、パクチーファラン、ヒラタケ
    th_tomsaep: p => [
        xthVessel(p, 'clay'),
        xthBroth(p, '#c98a4a', { op: .92, veil: '#d8a060', veilOp: .3, oil: '#d8401c', oilN: 14, oilR: 1.8 }),
        xthWide(),
        xthGrains(p, 100, 100, 140, { cols: ['#b8301c', '#d8603a'], n: 40, size: .8, seed: 3 }),
        ...[[78, 80, 20], [124, 74, -30], [70, 122, 60], [128, 124, 10], [100, 102, 100], [100, 144, -10]].map(([x, y, r], i) => xthRib(p, x, y, 32, r, { seed: i, c: '#b88a62' })),
        thl(p),
        xthOysterMushroom(p, 144, 98, 22, 30), xthOysterMushroom(p, 56, 100, 20, -40, { seed: 2 }),
        xthShallot(p, 112, 86, 13, 20), xthShallot(p, 84, 104, 12, -30),
        xthLimeLeaf(p, 106, 120, 26, -30, { torn: true }), xthLimeLeaf(p, 92, 66, 24, 20, { torn: true }),
        ...[[86, 92, 30], [124, 100, -50], [72, 140, 80], [138, 140, 10]].map(([x, y, r]) => xthSawtooth(p, x, y, 26, r)),
        xthChiliWhole(p, 116, 106, 14, 20), xthChiliWhole(p, 62, 84, 13, -50),
        '</g>',
    ].join(''),

    // トムソムプラー（ต้มส้มปลา）: タマリンドの甘酸っぱい琥珀色の汁に、白身魚、しょうがの千切り、エシャロット、ねぎ
    th_tomsompla: p => [
        xthVessel(p, 'celadon', { shape: 'bowl', inside: '#d4e4d4' }),
        xthBroth(p, '#c9a35c', { op: .92, veil: '#dcbc78', oil: '#e8b840', oilN: 10, oilR: 1.8 }),
        xthWide(),
        ...[[80, 80, 10], [126, 76, -20], [70, 122, 30], [126, 124, 0], [100, 102, -10], [98, 146, 20]].map(([x, y, r], i) => xthFishChunk(p, x, y, 32, r, { seed: i })),
        xthShreds(p, 100, 100, 124, { c: '#f2dc96', n: 24, w: 1.8, len: .18, seed: 3, curve: .3 }),
        xthShallot(p, 104, 76, 14, 20), xthShallot(p, 144, 100, 14, -30), xthShallot(p, 60, 98, 13, 60), xthShallot(p, 112, 128, 13, 10), xthShallot(p, 80, 142, 12, 80),
        `<g ${p.sh(.4)}>`, ...[[88, 96, 30], [118, 102, -40], [136, 144, 70], [62, 140, 10], [146, 72, 100]].map(([x, y, r]) => xthScallionSeg(p, x, y, 20, r)), `</g>`,
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // ゲーンソム（แกงส้มกุ้งผักรวม）: 橙赤のとろりとした酸っぱいカレー汁に、えび、青パパイヤ、ささげ、キャベツ
    th_kaengsom: p => [
        xthBowl(p),
        xthBroth(p, '#d9632e', { op: .96, veil: '#e8854a', veilOp: .3, oil: '#e8401a', oilN: 12, oilR: 2 }),
        xthWide(),
        ...[[74, 78, 20], [126, 132, -30], [64, 124, 70]].map(([x, y, r], i) => xthCabbagePiece(p, x, y, 34, r, { seed: i })),
        ...[[100, 74, 30], [138, 100, -20], [96, 140, 10], [80, 106, 60], [118, 86, 0]].map(([x, y, r]) => xthPapayaChunk(p, x, y, 22, r)),
        ...[[60, 98, 80], [140, 70, 30], [112, 148, -10], [146, 126, 60], [84, 62, -40]].map(([x, y, r]) => xthLongBean(p, x, y, 24, r, { w: 5 })),
        xthShrimp(p, 92, 92, 40, -30, { seed: 1 }), xthShrimp(p, 122, 112, 38, 60, { seed: 2 }), xthShrimp(p, 84, 128, 36, 150, { seed: 3 }), xthShrimp(p, 124, 70, 32, 20, { seed: 4 }),
        '</g>',
        xthSoupShine(100, 100, 79, .35),
    ].join(''),
});
// トムセープの香草（レモングラスとガランガル）
function thl(p){ return xthLemongrass(p, 140, 80, 22, 30) + xthLemongrass(p, 58, 136, 20, -60) + xthGalangal(p, 116, 146, 16, 20) + xthGalangal(p, 84, 64, 15, -30); }

// トカドヘチマの輪切り（緑の稜のある縁、淡い身）
function xthLuffa(p, x, y, s, r = 0){
    const pts = Array.from({ length: 20 }, (_, i) => { const a = i / 20 * 6.28, rr = s / 2 * (i % 2 ? .92 : 1); return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .5)}" fill="#5a8a3a" stroke="#3a6a24" stroke-width=".5"/></g>
        <circle r="${f1(s * .42)}" fill="${p.rg('#e6ecc8', .2, .15)}"/><circle r="${f1(s * .2)}" fill="#d4dca8" opacity=".8"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${f1(Math.cos(i * 1.047) * s * .2)}" cy="${f1(Math.sin(i * 1.047) * s * .2)}" rx="1.3" ry=".8" fill="#f6f6e4" transform="rotate(${i * 60} ${f1(Math.cos(i * 1.047) * s * .2)} ${f1(Math.sin(i * 1.047) * s * .2)})"/>`).join('')}</g>`;
}
// 骨つき鶏のぶつ切り（汁の中: 皮が黄みがかる）
function xthChickenBone(p, x, y, s, r = 0, { c = '#ead6a8', skin = '#e8c070', seed = 1 } = {}){
    const R = rng(p.id + 'xthcb' + seed + x + y);
    const pts = ring(s / 2, 9, .25, R, 1.05, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${f1(s * .4)}" y="${f1(-s * .09)}" width="${f1(s * .42)}" height="${f1(s * .18)}" rx="${f1(s * .09)}" fill="#f2ead8" stroke="#bca880" stroke-width=".6"/><circle cx="${f1(s * .8)}" cy="${f1(-s * .07)}" r="${f1(s * .1)}" fill="#f2ead8" stroke="#bca880" stroke-width=".6"/><circle cx="${f1(s * .8)}" cy="${f1(s * .07)}" r="${f1(s * .1)}" fill="#f2ead8" stroke="#bca880" stroke-width=".6"/>
        <path d="${smooth(pts, true, .8)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .38)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .8 - 1, b * .6 - 2]), true, .8)}" fill="${skin}" opacity=".55"/>
        <path d="M${f1(-s * .3)},${f1(s * .2)} Q0,${f1(s * .1)} ${f1(s * .3)},${f1(s * .22)}" stroke="${dk(c, .3)}" stroke-width=".7" fill="none" opacity=".5"/>
        ${xthShine(`M${f1(-s * .34)},${f1(-s * .16)} Q${f1(-s * .1)},${f1(-s * .32)} ${f1(s * .12)},${f1(-s * .26)}`, 1.4, .7)}</g>`;
}
// ディルの葉（羽のように細い）
function xthDill(p, x, y, L, r = 0){
    let d = `M${f1(-L / 2)},0 L${f1(L / 2)},0`;
    for (let i = 0; i < 6; i++){ const xx = -L * .4 + i * L * .15, l = L * (.22 - i * .02); d += ` M${f1(xx)},0 l${f1(l * .6)},${f1(-l)} M${f1(xx)},0 l${f1(l * .6)},${f1(l)}`; }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="#3f7a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#6aa848" stroke-width=".7" fill="none" stroke-linecap="round"/></g>`;
}
// はすの茎（サーイブア: 淡い緑の筒、断面に小さな穴）
function xthLotusStem(p, x, y, L, r = 0){
    const w = L * .2;
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${L}" height="${f1(w)}" rx="${f1(w * .45)}" fill="${p.g('#c4dca0', .3, .25)}" stroke="#7a9a52" stroke-width=".6"/></g>
        <path d="M${f1(-L * .42)},${f1(-w * .15)} L${f1(L * .42)},${f1(-w * .15)}" stroke="#eef6dc" stroke-width="1" opacity=".8"/>
        <ellipse cx="${f1(L / 2 - w * .2)}" cy="0" rx="${f1(w * .3)}" ry="${f1(w * .48)}" fill="#e8f0d0" stroke="#7a9a52" stroke-width=".5"/>
        ${[-1, 0, 1].map(i => `<circle cx="${f1(L / 2 - w * .2)}" cy="${f1(i * w * .22)}" r=".7" fill="#9ab070"/>`).join('')}</g>`;
}
// 牛テールの輪切り（中に骨、まわりに肉）
function xthOxtail(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthox' + seed + x + y);
    const pts = ring(s / 2, 10, .22, R, 1.05, .95);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${smooth(pts, true, .8)}" fill="${p.g('#7a4426', .25, .3)}" stroke="#40200c" stroke-width=".8"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .78, b * .78]), true, .8)}" fill="none" stroke="#a8683a" stroke-width="1.4" opacity=".6"/>
        <circle r="${f1(s * .17)}" fill="${p.rg('#f2e4c4', .2, .2)}" stroke="#bca070" stroke-width=".7"/><circle r="${f1(s * .07)}" fill="#c8a07a"/>
        ${xthShine(`M${f1(-s * .32)},${f1(-s * .16)} Q${f1(-s * .14)},${f1(-s * .34)} ${f1(s * .1)},${f1(-s * .32)}`, 1.5, .6)}</g>`;
}
// 焼いたプラートゥーのほぐし身（焼き目の皮と茶色い身）
function xthGrilledMackerel(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xthgm' + seed + x + y);
    const pts = ring(s / 2, 8, .3, R, 1.35, .7);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#d8b888', .25, .3)}" stroke="#7a5a3a" stroke-width=".7"/></g>
        <path d="M${f1(-s * .62)},${f1(-s * .05)} Q0,${f1(-s * .42)} ${f1(s * .62)},${f1(-s * .05)}" stroke="#4a4a42" stroke-width="${f1(s * .14)}" fill="none" stroke-linecap="round" opacity=".75"/>
        <ellipse cx="${f1(-s * .1)}" cy="${f1(-s * .18)}" rx="${f1(s * .12)}" ry="${f1(s * .05)}" fill="#2a1a0a" opacity=".5"/>
        <path d="M${f1(-s * .3)},${f1(s * .05)} L${f1(-s * .26)},${f1(s * .25)} M${f1(0)},${f1(s * .02)} L${f1(s * .04)},${f1(s * .25)} M${f1(s * .28)},${f1(s * .02)} L${f1(s * .3)},${f1(s * .22)}" stroke="#e2c8a0" stroke-width="1" fill="none"/></g>`;
}
// ポーチドエッグ（白い膜に半熟の黄身）
function xthPoachedEgg(p, x, y, s){
    const R = rng(p.id + 'xthpe' + x + y);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(ring(s / 2, 10, .3, R, 1.1, .9), true, .9)}" fill="${p.rg('#fbf8ee', .1, .12)}" opacity=".95"/></g>
        <circle cx="${x + 1}" cy="${y + 1}" r="${f1(s * .22)}" fill="${p.rg('#f6b02a', .3, .2, .4, .36)}" stroke="#d88a10" stroke-width=".5"/><ellipse cx="${f1(x - s * .04)}" cy="${f1(y - s * .05)}" rx="${f1(s * .07)}" ry="${f1(s * .04)}" fill="#fff" opacity=".8"/>`;
}

Object.assign(D, {
    // ゲーンリアン（แกงเลียงกุ้งสด）: こしょうの効いた灰色がかった汁に、えび、かぼちゃ、トカドヘチマ、ベビーコーン、メーンラック
    th_kaengliang: p => [
        xthVessel(p, 'blue', { shape: 'bowl' }),
        xthBroth(p, '#b8a27a', { op: .95, veil: '#c8b48c', veilOp: .35, cloudy: .06 }),
        xthWide(),
        ...[[76, 80, 20], [128, 128, -30], [140, 82, 70]].map(([x, y, r]) => K.kabocha(p, x, y, 28, r)),
        ...[[118, 72], [66, 118], [100, 104], [96, 146]].map(([x, y], i) => xthLuffa(p, x, y, 26, i * 20)),
        xthBabyCorn(p, 92, 72, 28, -30), xthBabyCorn(p, 144, 108, 26, 60), xthBabyCorn(p, 70, 144, 24, 20),
        xthShrimp(p, 82, 104, 34, -30, { seed: 1 }), xthShrimp(p, 120, 104, 32, 60, { seed: 2 }), xthShrimp(p, 116, 142, 30, 150, { seed: 3 }),
        `<g ${p.sh(.4)}>`, ...[[100, 86, 20], [62, 96, -40], [132, 140, 60], [148, 132, 10], [86, 128, 100], [110, 60, -30], [56, 132, 40]].map(([x, y, r]) => xthLeaf(p, x, y, 13, r, { c: '#4f9a3a', narrow: .7 })), `</g>`,
        '</g>',
        xthPepper(p, 100, 100, 120, 24),
        xthSoupShine(100, 100, 79, .35),
    ].join(''),

    // ゲーンパー（แกงป่าไก่）: ココナッツなしの澄んだ赤いカレー汁、赤い油、鶏肉、タイなす、ささげ、ベビーコーン、クラチャイ、ガパオ、こぶみかんの葉、赤唐辛子
    th_kaengpa: p => [
        xthVessel(p, 'clay'),
        xthBroth(p, '#b5482a', { op: .95, veil: '#c8603a', veilOp: .3, oil: '#e8401a', oilN: 18, oilR: 2.4 }),
        xthWide(),
        ...[[78, 80, 28, 20], [126, 76, 26, -30], [70, 122, 26, 60], [130, 126, 26, 110], [102, 104, 26, -70]].map(([x, y, s, r], i) => xthChicken(p, x, y, s, r, { seed: i + 1, c: '#d8b088' })),
        ...[[104, 70, 22, 10], [148, 100, 22, 80], [96, 140, 22, -30], [58, 100, 20, 120]].map(([x, y, s, r], i) => xthThaiEggplant(p, x, y, s, r, { seed: i })),
        ...[[86, 100, 30], [120, 92, -40], [80, 146, 70], [146, 74, 10]].map(([x, y, r]) => xthLongBean(p, x, y, 22, r, { w: 4.6 })),
        xthBabyCorn(p, 120, 146, 24, -20), xthBabyCorn(p, 62, 76, 22, 40),
        xthShreds(p, 100, 104, 110, { c: '#e4c88a', n: 12, w: 2.2, len: .14, seed: 4 }),
        `<g ${p.sh(.4)}>`, ...[[112, 116, -20], [88, 84, 40], [140, 138, 110], [66, 136, -60], [124, 62, 20]].map(([x, y, r], i) => xthLeaf(p, x, y, 15, r, { c: i % 2 ? '#3a7a2e' : '#2f6a28', narrow: .7, wilted: true, purple: i % 3 === 0 })), `</g>`,
        xthLimeLeaf(p, 104, 124, 26, -30, { torn: true }),
        xthChiliSlice(p, 94, 92, 11, 30), xthChiliSlice(p, 132, 108, 10, -50), xthPeaEggplant(p, 112, 96, 7), xthPeaEggplant(p, 76, 110, 6.5),
        '</g>',
    ].join(''),

    // ガイトムカミン（ไก่ต้มขมิ้น）: うこんの鮮やかな黄色の汁に、骨つき鶏、レモングラス、ガランガル、エシャロット、こぶみかんの葉、唐辛子
    th_kaitomkhamin: p => [
        xthBowl(p),
        xthBroth(p, '#e0a62a', { op: .95, veil: '#f0c048', veilOp: .3, oil: '#f6cc40', oilN: 14, oilR: 2.2 }),
        xthWide(),
        ...[[80, 80, 34, 20], [126, 78, 32, -30], [72, 124, 32, 60], [128, 126, 32, 110], [100, 104, 30, -70]].map(([x, y, s, r], i) => xthChickenBone(p, x, y, s, r, { seed: i, c: '#eccb7a', skin: '#e2a83a' })),
        xthLemongrass(p, 104, 68, 22, 20), xthLemongrass(p, 146, 102, 20, 80), xthLemongrass(p, 62, 102, 20, -60),
        ...[[96, 140, 20], [132, 150, -30], [64, 146, 60]].map(([x, y, r]) => xthGalangal(p, x, y, 15, r)),
        ...[[88, 98, 15], [116, 140, 13]].map(([x, y, s]) => `<g ${T(x, y)}><circle r="${s / 2}" fill="${p.g('#f0a020', .3, .25)}" stroke="#b86a10" stroke-width=".6"/><circle r="${f1(s * .3)}" fill="none" stroke="#f8c860" stroke-width=".8"/></g>`).join(''),
        xthShallot(p, 112, 94, 13, 20), xthShallot(p, 56, 84, 12, -30),
        xthLimeLeaf(p, 118, 116, 26, -30, { torn: true }), xthLimeLeaf(p, 84, 62, 24, 20, { torn: true }),
        xthChiliWhole(p, 144, 128, 14, 20), xthChiliWhole(p, 80, 112, 13, -50),
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // トムカティサーイブア・プラートゥー（ต้มกะทิสายบัวปลาทู）: 白いココナッツの汁に、はすの茎、焼いたプラートゥー、エシャロット
    th_saibua: p => [
        xthVessel(p, 'celadon', { shape: 'bowl', inside: '#d4e4d4' }),
        xthBroth(p, '#f0e6cf', { op: .98, veil: '#fbf6ea', veilOp: .45, oil: '#e8c070', oilN: 8, oilR: 1.4 }),
        xthWide(),
        ...[[100, 70, 10], [92, 88, -20], [110, 108, 30], [84, 124, -40], [118, 140, 15], [70, 104, 70], [134, 92, 80], [100, 152, -10], [60, 82, 30], [142, 120, -60]].map(([x, y, r]) => xthLotusStem(p, x, y, 40, r)),
        ...[[76, 76, 20], [126, 70, -30], [70, 136, 60], [132, 128, 10], [102, 112, -20]].map(([x, y, r], i) => xthGrilledMackerel(p, x, y, 32, r, { seed: i })),
        xthShallot(p, 112, 82, 14, 20), xthShallot(p, 82, 104, 13, -30), xthShallot(p, 146, 104, 12, 60), xthShallot(p, 96, 136, 12, 10),
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // ゲーンオム（แกงอ่อมไก่）: 炒り米と香草で緑がかった茶色の汁に、鶏、ディル、タイなす、ささげ、ヒラタケ、メーンラック、レモングラス、唐辛子
    th_kaengom: p => [
        xthVessel(p, 'clay'),
        xthBroth(p, '#8d7a3e', { op: .96, veil: '#a8964e', veilOp: .3, cloudy: .05 }),
        xthGrains(p, 100, 100, 140, { cols: ['#c8a868', '#6a5a2a'], n: 40, size: .9, seed: 2 }),
        xthWide(),
        ...[[78, 82, 28, 20], [126, 78, 26, -30], [70, 124, 26, 60], [128, 126, 26, 110], [100, 104, 26, -70]].map(([x, y, s, r], i) => xthChicken(p, x, y, s, r, { seed: i + 1, c: '#d8bc90' })),
        ...[[104, 70, 20, 10], [148, 102, 20, 80], [96, 142, 20, -30]].map(([x, y, s, r], i) => xthThaiEggplant(p, x, y, s, r, { seed: i })),
        xthOysterMushroom(p, 60, 100, 22, 30), xthOysterMushroom(p, 120, 150, 20, -40, { seed: 2 }),
        ...[[88, 100, 30], [116, 92, -40], [78, 148, 70]].map(([x, y, r]) => xthLongBean(p, x, y, 22, r, { w: 4.6 })),
        xthLemongrass(p, 140, 70, 20, 30),
        ...[[96, 84, 20], [124, 112, -40], [74, 108, 80], [142, 138, 10], [62, 74, -60], [110, 132, 120]].map(([x, y, r]) => xthDill(p, x, y, 26, r)),
        `<g ${p.sh(.4)}>`, xthLeaf(p, 104, 118, 12, 20, { c: '#4f9a3a', narrow: .7 }), xthLeaf(p, 84, 72, 12, -40, { c: '#4f9a3a', narrow: .7 }), `</g>`,
        xthChiliWhole(p, 112, 96, 13, 20),
        '</g>',
    ].join(''),

    // ガイトムナムプラー（ไก่ต้มน้ำปลา）: にんにくとナンプラーの琥珀色の澄んだ汁に、骨つきの鶏、パクチー、ねぎ、揚げにんにく
    th_kaitomnampla: p => [
        xthVessel(p, 'enamel', { shape: 'bowl' }),
        xthBroth(p, '#a8763c', { op: .92, veil: '#c09050', veilOp: .3, oil: '#e8b040', oilN: 14, oilR: 2.2 }),
        xthWide(),
        ...[[78, 80, 36, 20], [126, 76, 34, -30], [70, 126, 34, 60], [128, 128, 34, 110], [100, 104, 32, -70], [102, 148, 28, 10]].map(([x, y, s, r], i) => xthChickenBone(p, x, y, s, r, { seed: i, c: '#e2c08a', skin: '#c8904a' })),
        ...[[100, 80], [90, 124], [140, 102], [60, 104]].map(([x, y]) => `<g ${p.sh(.4)}><ellipse cx="${x}" cy="${y}" rx="5" ry="4" fill="${p.g('#f2e6c8', .3, .2)}" stroke="#b8a070" stroke-width=".5"/></g>`).join(''),
        xthCoriander(p, 112, 96, 18, 20), xthCoriander(p, 84, 104, 16, -40), xthCoriander(p, 120, 148, 15, 60), xthCoriander(p, 148, 80, 14, 0),
        `<g ${p.sh(.4)}>`, ...[[96, 64, 30], [140, 132, -40], [62, 84, 70]].map(([x, y, r]) => xthScallionSeg(p, x, y, 22, r)), `</g>`,
        xthFriedGarlic(p, 100, 100, 110, 22, 4),
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // スップハーンウア（ซุปหางวัว）: スパイスの香る澄んだ橙色の汁に、牛テール、じゃがいも、トマト、にんじん、揚げエシャロット、パクチー
    th_hangwua: p => [
        xthVessel(p, 'blue', { shape: 'bowl' }),
        xthBroth(p, '#b9783e', { op: .94, veil: '#d0904e', veilOp: .3, oil: '#e8a030', oilN: 16, oilR: 2.4 }),
        xthWide(),
        ...[[80, 80, 0], [128, 82, 1], [96, 120, 2], [140, 126, 3]].map(([x, y, i]) => xthOxtail(p, x, y, 34, i * 30, { seed: i })),
        K.potato(p, 104, 66, 26, 20, { c: '#ecc77c', seed: 1 }), K.potato(p, 64, 116, 26, -30, { c: '#ecc77c', seed: 2 }), K.potato(p, 116, 150, 22, 60, { c: '#ecc77c', seed: 3 }),
        xthTomato(p, 104, 96, 22, 30), xthTomato(p, 150, 100, 20, -60), xthTomato(p, 70, 146, 20, 80),
        K.carrotChunk(p, 62, 90, 18, 20), K.carrotChunk(p, 122, 106, 16, -40), K.carrotChunk(p, 92, 150, 16, 70),
        xthCrispShallot(p, 104, 104, 100, { n: 22, seed: 2 }),
        xthCoriander(p, 116, 116, 17, 20), xthCoriander(p, 86, 96, 15, -40), xthCoriander(p, 138, 70, 14, 60),
        '</g>',
        xthSoupShine(100, 100, 79, .35),
    ].join(''),

    // ゲーンジュートルークチンプラー（แกงจืดลูกชิ้นปลา）: 澄んだ汁に、白い魚団子、キャベツ、にんじん、春雨、ねぎ
    th_lukchinpla: p => [
        xthVessel(p, 'melamine', { shape: 'bowl', inside: '#bcd8e4' }),
        xthBroth(p, '#e6dcc0', { op: .88, veil: '#f4ecd8', oil: '#f0cc74', oilN: 8, oilR: 1.6 }),
        xthWide(),
        xthGlassNoodles(p, 100, 100, 120, { n: 28, c: '#ede5d6', sy: 1 }),
        ...[[72, 80, 20], [132, 132, -30], [66, 128, 70], [136, 74, 10]].map(([x, y, r], i) => xthCabbagePiece(p, x, y, 32, r, { seed: i })),
        ...[[104, 78], [84, 104], [120, 104], [100, 132], [140, 104], [68, 104], [116, 148], [84, 146], [96, 58]].map(([x, y], i) => `<g ${p.sh(.7)}><circle cx="${x}" cy="${y}" r="10" fill="${p.rg('#f4f0e6', .3, .25, .38, .35)}" stroke="#c8c0a8" stroke-width=".6"/></g><ellipse cx="${x - 3}" cy="${y - 3.5}" rx="3" ry="1.6" fill="#fff" opacity=".85"/>`).join(''),
        ...[[100, 108, 0], [128, 88, 20], [74, 140, 40], [146, 136, 0]].map(([x, y, r]) => K.carrotRound(p, x, y, 11, { r })),
        xthScallions(p, 100, 100, 120, 20, 3),
        xthPepper(p, 100, 100, 110, 16),
        '</g>',
        xthSoupShine(100, 100, 79, .4),
    ].join(''),

    // トムクローン（ต้มโคล้งปลาทูย่าง）: 焦がした乾燥唐辛子とタマリンドの茶色い汁に、焼いたプラートゥー、エシャロット、レモングラス、ガランガル、こぶみかんの葉、バジル
    th_tomklong: p => [
        xthVessel(p, 'clay'),
        xthBroth(p, '#8a5a32', { op: .95, veil: '#a06a3a', veilOp: .3, oil: '#d8a040', oilN: 12, oilR: 2 }),
        xthWide(),
        ...[[80, 82, 20], [126, 78, -30], [72, 124, 60], [128, 126, 10], [102, 104, -20]].map(([x, y, r], i) => xthGrilledMackerel(p, x, y, 32, r, { seed: i })),
        ...[[100, 70, 30], [146, 104, -50], [96, 140, 70], [60, 100, 10], [114, 120, 120], [84, 104, -20]].map(([x, y, r]) => xthDriedChili(p, x, y, 16, r)),
        xthShallot(p, 112, 88, 15, 20), xthShallot(p, 84, 146, 14, -30), xthShallot(p, 140, 144, 13, 60), xthShallot(p, 62, 80, 13, 10),
        xthLemongrass(p, 140, 78, 22, 30), xthGalangal(p, 66, 142, 15, 20),
        xthLimeLeaf(p, 106, 132, 24, -30, { torn: true }),
        `<g ${p.sh(.4)}>`, ...[[96, 92, 20], [124, 102, -40], [76, 112, 80]].map(([x, y, r]) => xthLeaf(p, x, y, 14, r, { c: '#2f6a28', narrow: .7, purple: true })), `</g>`,
        '</g>',
    ].join(''),

    // カオトムムーサップ（ข้าวต้มหมูสับ）: やわらかく煮た米粒の澄んだ汁に、豚の肉団子、半熟卵、キンチャイ、ねぎ、しょうが、揚げにんにく
    th_khaotom: p => [
        xthVessel(p, 'rooster', { shape: 'bowl' }),
        xthBroth(p, '#ece2c8', { op: .9 }),
        xthGrains(p, 100, 100, 152, { cols: ['#fbf8ee', '#f2ecdc', '#ffffff'], n: 180, size: 2, seed: 3, sy: 1 }),
        `<circle cx="100" cy="100" r="76" fill="#efe6cc" opacity=".35"/>`,
        xthWide(),
        xthPoachedEgg(p, 100, 100, 40),
        ...[[72, 80], [126, 76], [64, 120], [136, 120], [100, 142], [96, 64], [146, 98]].map(([x, y], i) => xthPorkClump(p, x, y, 20, { seed: i })),
        xthShreds(p, 100, 100, 110, { c: '#f2dc96', n: 14, w: 1.6, len: .14, seed: 3 }),
        K.scallions(p, 100, 100, 120, { n: 20, seed: 2, c: '#5aa03a' }), K.scallions(p, 100, 100, 100, { n: 12, seed: 3, c: '#8cc062' }),
        xthFriedGarlic(p, 100, 100, 120, 24, 2),
        '</g>',
        xthPepper(p, 100, 100, 110, 16),
        xthSoupShine(100, 100, 79, .4),
    ].join(''),
});
