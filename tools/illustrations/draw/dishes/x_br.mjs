// ブラジルの家庭料理（追加分: 主菜・副菜・スープ）。1品ずつ手で盛りつけ
import * as K from '../kit.mjs';

const { T, f, rng, ring, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// このファイル専用の部品（xbr = extra brazil）。w_br.mjs の部品を写して xbr に改名し、足りない部品を足した
// =========================================================

// 1桁小数のなめらかな線
function xbrSm(pts, closed = true){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
// まとめて描いた粒・線のまわりに細い輪郭
function xbrOutline(p, c, r = .55){
    const id = p.def('xbrOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// ご飯（w_br の wbRice と同じ）
function xbrRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xbrRice' + seed + x + y);
    const shape = xbrSm(ring(s / 2, 14, .07, R, 1, sy));
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
    const shade = p.def('xbrRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    const base = `<path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/>`;
    return `<g ${T(x, y)}><defs>${defs}</defs>${shadow ? `<g ${p.sh(.8 * shadow)}>${base}</g>` : base}${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// 小さな粒の集まり（同じ色は1本のpathに）
function xbrGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xbrGr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; });
        ds[k] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`).join('');
}
// 重なりすぎない配置
function xbrSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xbrspots' + seed), out = [];
    for (let t = 0; t < 8000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// さいの目
function xbrDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 小さな角切り（軽い版）
function xbrCube(p, x, y, s, r = 0, c = '#e03a2a', { op = 1 } = {}){
    return `<rect ${T(x, y, r)} x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${f(s * .9)}" rx="${f(s * .24)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".5" opacity="${op}"/>`;
}
// 刻んだ香草（cheiro-verde）
function xbrHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'], sy = 1 } = {}){
    const R = rng(p.id + 'xbrHb' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 1 + R();
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R(), r2 = rr * (.6 + R() * .6); return `${f1(cx + Math.cos(aa) * r2)},${f1(cy + Math.sin(aa) * r2)}`; });
        ds[i % cols.length] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// 小口切りのねぎ（輪）
function xbrRings(p, x, y, s, { n = 10, seed = 1, c = '#5fa03a' } = {}){
    const R = rng(p.id + 'xbrRg' + seed + x + y);
    let d = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd; const seg = `M${f1(cx - 1.9)},${f1(cy)}a1.9,1.7 0 1 0 3.8,0a1.9,1.7 0 1 0 -3.8,0`; if (R() < .6) d += seg; else d2 += seg; }
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.2"/><path d="${d2}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.2"/>`;
}
// 汁のつや
const xbrShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 皿の上のソース（点で形を指定）
function xbrSauce(p, pts, c, { op = 1, l = .2, d = .28 } = {}){
    return `<path d="${xbrSm(pts)}" fill="${p.rg(c, l, d, .42, .4)}" opacity="${op}"/>`;
}
// 楕円に近い不定形のソース
function xbrBlob(p, x, y, w, h, c, { seed = 1, jit = .14, n = 12, op = 1, l = .2, d = .28 } = {}){
    const R = rng(p.id + 'xbrBl' + seed + x + y);
    return `<path ${T(x, y)} d="${xbrSm(ring(1, n, jit, R, w / 2, h / 2))}" fill="${p.rg(c, l, d, .42, .4)}" opacity="${op}"/>`;
}
// 油の粒
function xbrOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'xbrOil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 細い棒の山（batata palha）
function xbrSticks(p, x, y, w, h, { n = 60, c = '#f0c050', len = 12, sw = 1.8, seed = 1, layers = 3 } = {}){
    const R = rng(p.id + 'xbrSt' + seed + x + y);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    let hi = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * .92, cx = x + Math.cos(a) * d * w / 2, cy = y + Math.sin(a) * d * h / 2;
        const ang = R() * Math.PI, Ln = len * (.55 + R() * .6), dx = Math.cos(ang) * Ln / 2, dy = Math.sin(ang) * Ln / 2;
        const seg = `M${f1(cx - dx)} ${f1(cy - dy)}L${f1(cx + dx)} ${f1(cy + dy)}`;
        const lit = (cx - x) / w + (cy - y) / h + (R() - .5) * .8 < -.1;
        L[i % layers][lit ? 0 : R() < .55 ? 1 : 2] += seg;
        if (lit && R() < .5) hi += `M${f1(cx - dx * .5 - .3)} ${f1(cy - dy * .5 - .4)}L${f1(cx + dx * .3 - .3)} ${f1(cy + dy * .3 - .4)}`;
    }
    const ol = xbrOutline(p, dk(c, .42), .45);
    return `<g ${p.sh(.7)}>${L.map(([a, b, d]) => `<g ${ol} fill="none" stroke-linecap="round" stroke-width="${sw}"><path d="${d}" stroke="${dk(c, .14)}"/><path d="${b}" stroke="${c}"/><path d="${a}" stroke="${lt(c, .3)}"/></g>`).join('')}</g><path d="${hi}" stroke="#fffbe6" stroke-width="${f1(sw * .35)}" opacity=".8" fill="none" stroke-linecap="round"/>`;
}
// 香菜・パセリの葉
function xbrLeaf(p, x, y, s, r = 0, { c = '#3f8a2c' } = {}){
    const d = 'M0,8 C-1,5 -2,3 -3,2 C-7,4 -10,1 -8,-2 C-10,-5 -6,-8 -3,-6 C-3,-10 3,-10 3,-6 C6,-8 10,-5 8,-2 C10,1 7,4 3,2 C2,3 1,5 0,8Z';
    return `<g ${T(x, y, r, s / 20)}><path d="${d}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M0,7 L0,-6 M0,0 L-6,-3 M0,0 L6,-3" stroke="${lt(c, .4)}" stroke-width=".6" fill="none"/></g>`;
}
// バジルの葉（つやのある楕円の葉）
function xbrBasil(p, x, y, s, r = 0, { c = '#3c8f34' } = {}){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 C-6,-7 5,-7 10,0 C5,6 -6,6 -10,0Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M-9,0 L8,0 M-3,0 L-6,-3 M1,0 L-1,-3.6 M-3,0 L-6,3 M1,0 L-1,3.6" stroke="${lt(c, .35)}" stroke-width=".6" fill="none"/></g>`;
}
// 玉ねぎの輪切り
function xbrOnionRing(p, x, y, s, r = 0, { c = '#e9c27a', raw = false, sy = .82 } = {}){
    const col = raw ? '#f6f2e6' : c, e = raw ? '#cfc5a6' : dk(c, .25);
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="${e}" stroke-width="${f(s * .16 + 1)}" opacity=".85"/><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="${col}" stroke-width="${f(s * .16)}" opacity="${raw ? 1 : .9}"/>
        <path d="M${f(-s * .44)},${f(-s * .12)} Q${f(-s * .34)},${f(-s * .38)} ${f(-s * .08)},${f(-s * .42)}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// トマトの輪切り
function xbrTomatoSlice(p, x, y, s, r = 0, { cooked = false } = {}){
    const c = cooked ? '#d9472c' : '#e33a2a';
    const rooms = [0, 1, 2, 3, 4].map(i => { const a = i / 5 * 6.28 + .3; return `<path ${T(Math.cos(a) * s * .24, Math.sin(a) * s * .24, a * 57.3 + 90)} d="M${f(-s * .1)},0 Q0,${f(-s * .16)} ${f(s * .1)},0 Q0,${f(s * .1)} ${f(-s * .1)},0Z" fill="#f6b34a" opacity=".9"/>`; }).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <circle r="${f(s / 2 - 2)}" fill="#f2604a"/>${rooms}<circle r="${f(s * .1)}" fill="#f7a189"/>
        <path d="M${f(-s * .3)},${f(-s * .26)} Q${f(-s * .1)},${f(-s * .42)} ${f(s * .14)},${f(-s * .38)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ピーマンの輪切り
function xbrPepRing(p, x, y, s, r = 0, { c = '#3f8f2f' } = {}){
    const d = xbrSm(ring(s / 2, 8, .15, rng(p.id + 'xbrpr' + x + y), 1, .8));
    return `<g ${T(x, y, r)}><path d="${d}" fill="none" stroke="${dk(c, .25)}" stroke-width="${f(s * .16 + 1)}"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${f(s * .16)}"/>
        <path d="M${f(-s * .38)},${f(-s * .18)} Q${f(-s * .2)},${f(-s * .4)} ${f(s * .05)},${f(-s * .4)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// レタス
function xbrLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468' } = {}){
    const R = rng(p.id + 'xbrlt' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .08); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${K.smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .46)},2 Q0,${f(-s * .04)} ${f(s * .44)},0" stroke="#eef8d8" stroke-width="${f(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f(s * t)},${f(-s * .01)} q${f(s * .08)},${f(i % 2 ? s * .2 : -s * .2)} ${f(s * .16)},${f(i % 2 ? s * .24 : -s * .24)}" stroke="#e6f4c8" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}
// カラブレーザ（燻製ソーセージの輪切り）
function xbrCalabresa(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xbrCl' + seed + x + y);
    let fat = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = R() * s * .3; fat += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(s * .05 + R() * s * .03)}" ry="${f(s * .04)}" fill="#f6d8cc" opacity=".9"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><circle r="${s / 2}" fill="#6a2416"/></g><circle r="${f(s / 2 - 1.6)}" fill="${p.rg('#c4583e', .2, .25)}"/>${fat}
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .38)} ${f(s * .16)},${f(-s * .32)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 炒めた玉ねぎの薄切り（透けた弧）
function xbrSliver(p, x, y, s, r = 0, { c = '#e3b562', span = 1.6, w = null } = {}){
    const R0 = s / 2, a0 = -Math.PI / 2 - span / 2, a1 = a0 + span, sw = w || s * .13;
    const d = `M${f1(Math.cos(a0) * R0)},${f1(Math.sin(a0) * R0)}A${f1(R0)},${f1(R0 * .85)} 0 0 1 ${f1(Math.cos(a1) * R0)},${f1(Math.sin(a1) * R0)}`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .18)}" stroke-width="${f1(sw + .8)}" fill="none" stroke-linecap="round" opacity=".55"/><path d="${d}" stroke="${c}" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round" opacity=".85"/><path d="${d}" stroke="${lt(c, .5)}" stroke-width="${f1(sw * .3)}" fill="none" stroke-linecap="round" opacity=".8" transform="translate(-.3 -.4)"/></g>`;
}
// ほぐした肉（細い繊維の束）
function xbrShred(p, x, y, s, { n = 14, seed = 1, cols = ['#f1dbb0', '#ddb985'], ol = '#b8915c', w = 2.6 } = {}){
    const R = rng(p.id + 'xbrSh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .7, a = R() * Math.PI, L = s * (.25 + R() * .3), b = (R() - .5) * L * .5;
        ds[i % cols.length] += `M${f1(cx - Math.cos(a) * L / 2)},${f1(cy - Math.sin(a) * L / 2)}q${f1(Math.cos(a) * L / 2 - Math.sin(a) * b)},${f1(Math.sin(a) * L / 2 + Math.cos(a) * b)} ${f1(Math.cos(a) * L)},${f1(Math.sin(a) * L)}`;
    }
    return `<g ${p.sh(.5)}><g ${xbrOutline(p, ol, .45)} fill="none" stroke-linecap="round">${cols.map((c, i) => `<path d="${ds[i]}" stroke="${c}" stroke-width="${w}"/>`).join('')}</g></g>`;
}
// 細く切った葉もの（couve・キャベツ）
function xbrCouve(p, x, y, s, { n = 60, seed = 1, sy = .9, w = 2.6, cols = ['#2c6a24', '#3f8030', '#5f9e3c'], ol = '#1d4517', len = 9 } = {}){
    const R = rng(p.id + 'xbrCv' + seed + x + y);
    const L = [0, 1, 2].map(() => cols.map(() => ''));
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .92, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy;
        const ang = R() * Math.PI, ln = len + R() * len * 1.3, b = (R() - .5) * 8;
        const dx = Math.cos(ang) * ln / 2, dy = Math.sin(ang) * ln / 2;
        L[i % 3][Math.floor(R() * cols.length)] += `M${f1(cx - dx)},${f1(cy - dy)}Q${f1(cx - Math.sin(ang) * b)},${f1(cy + Math.cos(ang) * b)} ${f1(cx + dx)},${f1(cy + dy)}`;
    }
    const o = xbrOutline(p, ol, .45);
    return `<g ${p.sh(.6)}>${L.map(l => `<g ${o} fill="none" stroke-linecap="round" stroke-width="${w}">${l.map((d, i) => `<path d="${d}" stroke="${cols[i]}"/>`).join('')}</g>`).join('')}</g>`;
}
// 鶏の骨つきもも（ドラムスティック）
function xbrDrum(p, x, y, s, r = 0, { c = '#c9873a', seed = 1 } = {}){
    const R = rng(p.id + 'xbrDr' + seed + x + y);
    let spots = '';
    for (let i = 0; i < 5; i++) spots += `<ellipse cx="${f(-16 + R() * 20)}" cy="${f(-6 + R() * 12)}" rx="${f(1.5 + R() * 3)}" ry="${f(1 + R() * 1.6)}" fill="${dk(c, .45)}" opacity="${f(.2 + R() * .2)}"/>`;
    return `<g ${T(x, y, r, s / 42)}><g ${p.sh(.8)}><path d="M6,-2.4 L17,-2 L17,2 L6,2.4Z" fill="#efe3c6" stroke="#bfa880" stroke-width=".6"/>
        <circle cx="18.5" cy="-2.3" r="2.8" fill="${p.g('#f4ead2', .3, .2)}" stroke="#bfa880" stroke-width=".6"/><circle cx="18.5" cy="2.3" r="2.8" fill="${p.g('#f4ead2', .3, .2)}" stroke="#bfa880" stroke-width=".6"/>
        <path d="M8,-4 C2,-11 -14,-13 -19,-5 C-23,2 -17,11 -7,11 C1,11 5,7 8,3 Z" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>
        ${spots}<path d="M-14,-6 Q-7,-11 2,-8" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 炒めたひき肉（そぼろ状の茶色の粒の山）
function xbrMince(p, x, y, s, { seed = 1, n = 90, sy = 1, cols = ['#6e3a1f', '#93573a', '#5a2e17'], size = 2.6 } = {}){
    return xbrGrains(p, x, y, s, { cols, n, size, seed, sy });
}


// 同じ具をたくさん並べるときは defs に1つ作って use で置く（SVG を軽くする）
function xbrStamp(p, key, make, x, y, r = 0, k = 1){
    const id = p.def('xbrSt' + key, id => `<g id="${id}">${make()}</g>`);
    return `<use href="#${id}" ${T(x, y, r, k)}/>`;
}
// 麺（軽い版: 同じ色の線を1本の path にまとめる）
function xbrNoodles(p, x, y, s, { c = '#f2d48a', w = 2.4, n = 26, seed = 1, sy = .9, outline = null } = {}){
    const R = rng(p.id + 'xbrNd' + seed);
    let a1 = '', a2 = '';
    for (let i = 0; i < n; i++){
        const rr = s / 2 * (.25 + R() * .72), a0 = R() * 6.28, sweep = 1.2 + R() * 2.2;
        const cx = x + (R() - .5) * s * .12, cy = y + (R() - .5) * s * .12;
        const pts = Array.from({ length: 7 }, (_, j) => { const a = a0 + j / 6 * sweep, rj = rr * (1 + (R() - .5) * .25); return [cx + Math.cos(a) * rj, cy + Math.sin(a) * rj * sy]; });
        if (R() < .3) a2 += xbrSm(pts, false); else a1 += xbrSm(pts, false);
    }
    return `<g ${p.sh(.8)}><g ${xbrOutline(p, outline || dk(c, .25), .55)} fill="none" stroke-linecap="round" stroke-width="${w}"><path d="${a1}" stroke="${c}"/><path d="${a2}" stroke="${lt(c, .2)}"/></g></g>`;
}
// ---------- 新しく足した部品 ----------
// パン粉の揚げ物（ミラネーザ: 牛・魚・なす）: w×h の不定形、ざらざらの衣と焼き色の点
function xbrBreaded(p, x, y, w, h, r = 0, { c = '#d99a45', seed = 1, sc = .8 } = {}){
    const R = rng(p.id + 'xbrBd' + seed + x + y);
    const pts = ring(1, 14, .12, R, w / 2, h / 2);
    let sp = '';
    for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * .8; sp += `<circle cx="${f1(Math.cos(a) * d * w / 2)}" cy="${f1(Math.sin(a) * d * h / 2)}" r="${f1(.6 + R() * 1.2)}" fill="${R() < .5 ? dk(c, .4) : lt(c, .45)}" opacity=".75"/>`; }
    return `<g ${T(x, y, r)}><g ${p.crumb(sc)}><path d="${xbrSm(pts)}" fill="${p.g(c, .32, .34)}" stroke="${dk(c, .42)}" stroke-width=".9"/></g>${sp}
        <path d="${xbrSm(pts.map(([a, b]) => [a * .82, b * .78]))}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.2" opacity=".35"/>
        <path d="M${f1(-w * .3)},${f1(-h * .22)} Q${f1(-w * .08)},${f1(-h * .38)} ${f1(w * .18)},${f1(-h * .3)}" stroke="#fff6dc" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 溶けて焼き色のついたチーズ（モッツァレラ）: x,y 中心、w×h
function xbrCheese(p, x, y, w, h, { seed = 1, c = '#f6dc84', browned = .7, n = 10, jit = .22 } = {}){
    const R = rng(p.id + 'xbrCh' + seed + x + y);
    const pts = ring(1, 14, jit, R, w / 2, h / 2);
    let bl = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * .75; bl += `<path ${T(x + Math.cos(a) * d * w / 2, y + Math.sin(a) * d * h / 2)} d="${xbrSm(ring(1.8 + R() * 4, 6, .5, R))}" fill="${R() < .55 ? '#d58e34' : '#b9671f'}" opacity="${f(browned * (.45 + R() * .5))}"/>`; }
    return `<path ${T(x, y)} d="${xbrSm(pts)}" fill="${p.rg(c, .3, .16, .4, .36)}" stroke="${dk(c, .2)}" stroke-width=".6"/>${bl}
        <path ${T(x, y)} d="M${f1(-w * .3)},${f1(-h * .16)} Q${f1(-w * .1)},${f1(-h * .34)} ${f1(w * .14)},${f1(-h * .3)}" stroke="#fffbe8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".75"/>`;
}
// ローストした鶏もも（皮がぱりっと焼けた丸い塊）
function xbrThigh(p, x, y, s, r = 0, { c = '#c77a2c', seed = 1 } = {}){
    const R = rng(p.id + 'xbrTh' + seed + x + y);
    const pts = ring(1, 11, .2, R, s / 2, s * .4);
    let ch = '';
    for (let i = 0; i < 7; i++) ch += `<ellipse cx="${f1((R() - .5) * s * .7)}" cy="${f1((R() - .5) * s * .5)}" rx="${f1(1.5 + R() * s * .08)}" ry="${f1(1 + R() * s * .05)}" fill="${dk(c, .5)}" opacity="${f(.18 + R() * .25)}"/>`;
    return `<g ${T(x, y, r)}><path d="${xbrSm(pts)}" fill="${p.g(c, .38, .32)}" stroke="${dk(c, .4)}" stroke-width=".8"/>
        <path d="${xbrSm(pts.map(([a, b]) => [a * .55 - s * .08, b * .5 - s * .08]))}" fill="${lt(c, .3)}" opacity=".45"/>${ch}
        <path d="M${f1(-s * .28)},${f1(-s * .14)} Q${f1(-s * .1)},${f1(-s * .3)} ${f1(s * .14)},${f1(-s * .26)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".65"/></g>`;
}
// 揚げた・焼いた棒（キャッサバ・ポレンタ）: 長さ L、太さ w
function xbrStick(p, x, y, L, w, r = 0, { c = '#ecc66a', seed = 1, crumb = .9, cracks = 2, rx = .35 } = {}){
    const R = rng(p.id + 'xbrSk' + seed + x + y);
    let cr = '';
    for (let i = 0; i < cracks; i++){ const cx = (R() - .5) * L * .6; cr += `<path d="M${f1(cx)},${f1(-w * .3)} l${f1((R() - .5) * 4)},${f1(w * .3)} l${f1((R() - .5) * 4)},${f1(w * .25)}" stroke="${dk(c, .35)}" stroke-width=".7" fill="none" opacity=".6"/>`; }
    return `<g ${T(x, y, r)}><g ${p.crumb(crumb)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${f1(L)}" height="${f1(w)}" rx="${f1(w * rx)}" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .38)}" stroke-width=".7"/></g>
        <rect x="${f1(-L / 2 + 2)}" y="${f1(-w / 2 + 1.4)}" width="${f1(L - 4)}" height="${f1(w * .36)}" rx="${f1(w * .18)}" fill="${lt(c, .35)}" opacity=".55"/>${cr}</g>`;
}
// 豆（defs に1粒作って use で並べる）: black / eye（ささげ）/ chick（ひよこ豆）/ lentil / carioca
function xbrBean(p, kind, x, y, s, r = 0){
    const id = p.def('xbrBean' + kind, id => {
        if (kind === 'black') return `<g id="${id}"><path d="M-5.2,0 C-5.2,-3.6 4.6,-4 5.2,-.4 C5.6,3.2 -4.8,3.8 -5.2,0Z" fill="${p.g('#3b2a30', .25, .3)}" stroke="#140a0c" stroke-width=".5"/><path d="M-3.4,-1.8 Q-1,-3.2 2,-2.6" stroke="#b8a8b8" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
        if (kind === 'eye') return `<g id="${id}"><path d="M-5.2,0 C-5.2,-3.6 4.6,-4 5.2,-.4 C5.6,3.2 -4.8,3.8 -5.2,0Z" fill="${p.g('#e2cfa6', .3, .3)}" stroke="#96784e" stroke-width=".5"/><ellipse cx="0" cy="1.9" rx="1.5" ry=".8" fill="#3a2a24"/><path d="M-3.4,-1.8 Q-1,-3 2,-2.6" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
        if (kind === 'chick') return `<g id="${id}"><path d="M-4.6,.4 C-4.8,-3.8 2.6,-5.2 4.4,-1.8 C5.6,.6 4,4.4 .4,4.6 C-2.6,4.8 -4.4,3 -4.6,.4Z" fill="${p.g('#e6be7c', .3, .3)}" stroke="#a87a3c" stroke-width=".5"/><path d="M3.2,-2.6 L5.2,-3.8" stroke="#a87a3c" stroke-width="1" stroke-linecap="round"/><path d="M-2.8,-1.6 Q-1,-3.4 1.4,-3" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
        if (kind === 'lentil') return `<g id="${id}"><ellipse rx="3" ry="2.5" fill="${p.g('#8a6236', .25, .3)}" stroke="#4e3418" stroke-width=".5"/><path d="M-1.6,-1 Q0,-1.9 1.4,-1.2" stroke="#e8cfa6" stroke-width=".6" fill="none" opacity=".8"/></g>`;
        return `<g id="${id}"><path d="M-5.2,0 C-5.2,-3.6 4.6,-4 5.2,-.4 C5.6,3.2 -4.8,3.8 -5.2,0Z" fill="${p.g('#b07d52', .3, .32)}" stroke="#5e3a20" stroke-width=".5"/><path d="M-3.4,-1.6 l1,.6 M-1,1.4 l1.2,-.4 M1.4,-2 l.8,1 M3,1 l1,-.6" stroke="#6a4224" stroke-width="1" stroke-linecap="round" opacity=".6"/><path d="M-3.6,-1.8 Q-1,-3.2 2,-2.6" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
    });
    return `<use href="#${id}" ${T(x, y, r, s / 10)}/>`;
}
// 煮込んだ牛肉の角切り（つやのある焦げ茶）
function xbrBeef(p, x, y, s, r = 0, { c = '#7a3f22', seed = 1 } = {}){
    const R = rng(p.id + 'xbrBf' + seed + x + y);
    const pts = ring(s / 2, 7, .3, R, 1.1, .92);
    return `<g ${T(x, y, r)}><path d="${K.smooth(pts, true, .5)}" fill="${p.g(c, .28, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="M${f1(-s * .3)},${f1(s * .02)} q${f1(s * .15)},${f1(-s * .1)} ${f1(s * .3)},0 t${f1(s * .28)},0 M${f1(-s * .22)},${f1(s * .22)} q${f1(s * .14)},${f1(-s * .08)} ${f1(s * .28)},0" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".55"/>
        <path d="M${f1(-s * .28)},${f1(-s * .2)} Q${f1(-s * .08)},${f1(-s * .36)} ${f1(s * .16)},${f1(-s * .28)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// じゃがいもの塊（煮た・焼いた）
function xbrPotato(p, x, y, s, r = 0, { c = '#eac57a', seed = 1, roast = 0 } = {}){
    const R = rng(p.id + 'xbrPt' + seed + x + y);
    const pts = ring(s / 2, 7, .3, R, 1.1, .92);
    let br = '';
    for (let i = 0; i < Math.round(roast * 5); i++) br += `<ellipse cx="${f1((R() - .3) * s * .5)}" cy="${f1((R() - .3) * s * .45)}" rx="${f1(s * (.1 + R() * .12))}" ry="${f1(s * (.06 + R() * .07))}" fill="#a85f16" opacity="${f(.35 + R() * .35)}"/>`;
    return `<g ${T(x, y, r)}><path d="${K.smooth(pts, true, .55)}" fill="${p.g(c, .3, roast ? .45 : .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="${K.smooth(pts.map(([a, b]) => [a * .6 - s * .07, b * .6 - s * .07]), true, .55)}" fill="${lt(c, .2)}" opacity=".35"/>${br}
        <path d="M${f1(-s * .26)},${f1(-s * .2)} Q${f1(-s * .08)},${f1(-s * .32)} ${f1(s * .12)},${f1(-s * .27)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// にんじんの輪切り
function xbrCarrotRound(p, x, y, s, { c = '#ef7f30' } = {}){
    return `<g ${T(x, y)}><circle r="${s / 2}" fill="${p.g(c, .28, .25)}" stroke="${dk(c, .28)}" stroke-width=".6"/><circle r="${f(s * .24)}" fill="${lt(c, .3)}"/><path d="M${f(-s * .28)},${f(-s * .16)} Q${f(-s * .12)},${f(-s * .34)} ${f(s * .1)},${f(-s * .3)}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// ゆで卵の輪切り
function xbrEggSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f(s / 2)}" ry="${f(s * .42)}" fill="${p.rg('#fffdf6', .1, .12)}" stroke="#d8d0bf" stroke-width=".6"/></g><circle cx=".5" cy=".5" r="${f(s * .22)}" fill="${p.rg('#f7b52d', .25, .15)}"/><ellipse cx="${f(-s * .22)}" cy="${f(-s * .18)}" rx="${f(s * .12)}" ry="${f(s * .06)}" fill="#fff" opacity=".7"/></g>`;
}
// 目玉焼き（白身のふちがこんがり）
function xbrFriedEgg(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xbrEg' + seed + x);
    const sh = xbrSm(ring(19, 11, .2, R));
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.8)}><path d="${sh}" fill="${p.rg('#ffffff', .1, .1)}" stroke="#e2dccd" stroke-width=".8"/></g>
        <path d="${sh}" fill="none" stroke="#c98a3a" stroke-width="2.4" opacity=".5"/>
        <circle cx="2" cy="1" r="8.5" fill="${p.rg('#f8a51c', .3, .15, .35, .32)}" stroke="#d98a12" stroke-width=".8"/>
        <ellipse cx="-.5" cy="-2" rx="3" ry="1.8" fill="#fff" opacity=".75"/></g>`;
}

// ---------- ブラジルの器 ----------
// 琥珀色のガラス皿
function xbrAmberPlate(p, { R = 94 } = {}){
    const c = '#c98838';
    const ribs = Array.from({ length: 36 }, (_, i) => { const a = i / 36 * 6.28; return `M${f1(100 + Math.cos(a) * R * .8)},${f1(100 + Math.sin(a) * R * .8)}L${f1(100 + Math.cos(a) * (R - 3))},${f1(100 + Math.sin(a) * (R - 3))}`; }).join('');
    return `<g ${p.sh(1.4)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .35, .25, .38, .32)}" opacity=".96"/></g>
        <path d="${ribs}" stroke="${lt(c, .35)}" stroke-width="2.2" opacity=".45"/>
        <circle cx="100" cy="100" r="${R * .78}" fill="none" stroke="${dk(c, .2)}" stroke-width="2" opacity=".5"/>
        <circle cx="100" cy="100" r="${R * .76}" fill="${p.rg(lt(c, .12), .2, .15, .6, .62)}"/>
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// 取っ手つきの鍋（アルミ・土鍋・鋳物）
function xbrPot(p, { R = 84, c = '#3a302c', inside = '#2a221e', rimC = null } = {}){
    const rc = rimC || lt(c, .25);
    return `<g ${p.sh(1.6)}><rect x="${100 - R - 13}" y="89" width="${2 * R + 26}" height="22" rx="9" fill="${p.g(c, .25, .3)}"/></g>
        <g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .25, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="${rc}" stroke-width="1.6" opacity=".7"/>
        <circle cx="100" cy="100" r="${R * .88}" fill="${p.rg(inside, .12, .25, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .38} A${R * .84},${R * .84} 0 0 1 ${100 - R * .25},${100 - R * .8}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// 透明のガラスボウル
function xbrGlass(p, { R = 90 } = {}){
    return `<g ${p.sh(1.2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#e4eeec', .3, .12, .38, .32)}" opacity=".95"/></g>
        <circle cx="100" cy="100" r="${R - 1}" fill="none" stroke="#b7cac7" stroke-width="1.4"/>
        <circle cx="100" cy="100" r="${R * .86}" fill="${p.rg('#f2f7f6', .2, .1, .6, .6)}" stroke="#c6d6d3" stroke-width="1.6"/>
        <path d="M${100 - R * .76},${100 - R * .36} A${R * .86},${R * .86} 0 0 1 ${100 - R * .3},${100 - R * .8}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
const xbrGlassHi = (R = 90) => `<path d="M${100 + R * .62},${100 + R * .5} A${R * .82},${R * .82} 0 0 1 ${100 + R * .2},${100 + R * .78}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`;
// 耐熱ガラスの角皿（refratário）
function xbrPyrex(p, { w = 176, h = 136 } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.3)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${p.rg('#e2ecea', .3, .14, .38, .32)}" opacity=".96"/></g>
        <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="23" fill="none" stroke="#b5c8c4" stroke-width="1.4"/>
        <rect x="${x + 11}" y="${y + 11}" width="${w - 22}" height="${h - 22}" rx="16" fill="${p.rg('#f1f6f5', .2, .1, .6, .6)}" stroke="#c4d5d2" stroke-width="1.6"/>
        <path d="M${x + 8},${y + 40} Q${x + 8},${y + 8} ${x + 40},${y + 8}" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 木の器
function xbrWoodBowl(p, { R = 90, c = '#9a6337' } = {}){
    const grain = [0, 1, 2, 3].map(i => `<ellipse cx="${100 + i * 3}" cy="${100 - i * 2}" rx="${f(R - 4 - i * 2.5)}" ry="${f(R - 6 - i * 2)}" fill="none" stroke="${dk(c, .25)}" stroke-width=".6" opacity=".35"/>`).join('');
    return `<g ${p.sh(1.7)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .2, .3, .35, .3)}"/></g>${grain}
        <circle cx="100" cy="100" r="${R * .84}" fill="${p.rg(lt(c, .12), .12, .3, .62, .64)}"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#ffe8cc" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// 鉄のフライパン（右に柄）
function xbrSkillet(p, { R = 80, cx = 92 } = {}){
    return `<g ${p.sh(1.6)}><rect x="${cx + R - 6}" y="93" width="${196 - cx - R + 6}" height="14" rx="6" fill="${p.g('#2e2a28', .2, .3)}"/></g>
        <g ${p.sh(1.8)}><circle cx="${cx}" cy="100" r="${R}" fill="${p.rg('#3a3634', .2, .3, .35, .3)}"/></g>
        <circle cx="${cx}" cy="100" r="${R - 2}" fill="none" stroke="#6a6462" stroke-width="1.4" opacity=".7"/>
        <circle cx="${cx}" cy="100" r="${R * .88}" fill="${p.rg('#24201f', .1, .2, .62, .64)}"/>
        <path d="M${cx - R * .72},${100 - R * .38} A${R * .84},${R * .84} 0 0 1 ${cx - R * .25},${100 - R * .8}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".3"/>`;
}
// 金属の角型の天板（assadeira）
function xbrTray(p, { w = 184, h = 150, c = '#b9bcbf' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.5)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${p.g(c, .3, .25)}"/></g>
        <rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="12" fill="none" stroke="${lt(c, .5)}" stroke-width="1.4"/>
        <rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" rx="8" fill="${p.rg(dk(c, .12), .1, .2, .6, .6)}"/>`;
}
// 白い楕円の大皿（travessa）
function xbrOval(p, { rx = 96, ry = 78, rim = '#2f7a52', base = '#fbfaf6' } = {}){
    return `<g ${p.sh(1.6)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(base, .2, .14, .38, .32)}"/></g>
        ${rim ? `<ellipse cx="100" cy="100" rx="${rx - 4}" ry="${ry - 4}" fill="none" stroke="${rim}" stroke-width="2"/>` : ''}
        <ellipse cx="100" cy="100" rx="${f(rx * .82)}" ry="${f(ry * .8)}" fill="${p.rg(base, .06, .1, .6, .62)}"/>
        <path d="M${100 - rx * .7},${100 - ry * .45} A${rx * .86},${ry * .86} 0 0 1 ${100 - rx * .2},${100 - ry * .82}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 白い深皿（prato fundo）: 広いリムに色の線
function xbrDeep(p, { R = 95, rim = '#2f7a52', well = .72, base = '#fbfaf6', band = false } = {}){
    const w = R * well;
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3.5}" fill="none" stroke="${rim}" stroke-width="${band ? 5 : 2}" opacity=".9"/>
        ${band ? `<circle cx="100" cy="100" r="${R - 9}" fill="none" stroke="${rim}" stroke-width=".9" opacity=".8"/>` : ''}
        <circle cx="100" cy="100" r="${f(w + 3)}" fill="none" stroke="${dk(base, .1)}" stroke-width="4" opacity=".45"/>
        <circle cx="100" cy="100" r="${f(w)}" fill="${p.rg(base, .08, .14, .62, .64)}"/>
        <path d="M${100 - R * .74},${100 - R * .38} A${R * .86},${R * .86} 0 0 1 ${100 - R * .24},${100 - R * .8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 取っ手つきのスープカップ（caneca / cumbuca）
function xbrMug(p, { R = 78, c = '#8a5a3c', inside = null, cx = 94 } = {}){
    const ins = inside || lt(c, .1);
    return `<g ${p.sh(1.5)}><path d="M${cx + R - 8},84 C${cx + R + 22},78 ${cx + R + 24},122 ${cx + R - 8},116" stroke="${dk(c, .1)}" stroke-width="13" fill="none" stroke-linecap="round"/></g>
        <path d="M${cx + R - 8},84 C${cx + R + 22},78 ${cx + R + 24},122 ${cx + R - 8},116" stroke="${lt(c, .2)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>
        <g ${p.sh(1.8)}><circle cx="${cx}" cy="100" r="${R}" fill="${p.rg(c, .25, .3, .35, .3)}"/></g>
        <circle cx="${cx}" cy="100" r="${R - 2}" fill="none" stroke="${lt(c, .3)}" stroke-width="1.2" opacity=".7"/>
        <circle cx="${cx}" cy="100" r="${f(R * .86)}" fill="${p.rg(ins, .1, .3, .62, .64)}"/>
        <path d="M${cx - R * .72},${100 - R * .38} A${R * .84},${R * .84} 0 0 1 ${cx - R * .25},${100 - R * .8}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`;
}
// まな板（木の板）
function xbrBoard(p, { w = 188, h = 140, c = '#c08a52' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    const grain = [0, 1, 2, 3, 4, 5].map(i => `<path d="M${x + 8},${f(y + 16 + i * 22)} Q${100},${f(y + 10 + i * 22 + (i % 2 ? 6 : -4))} ${x + w - 8},${f(y + 18 + i * 22)}" stroke="${dk(c, .25)}" stroke-width=".8" fill="none" opacity=".35"/>`).join('');
    return `<g ${p.sh(1.5)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${p.g(c, .25, .25)}"/></g>${grain}
        <rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="10" fill="none" stroke="${lt(c, .3)}" stroke-width="1.2" opacity=".6"/>
        <circle cx="${x + w - 14}" cy="${y + 14}" r="4" fill="${dk(c, .35)}"/>`;
}
// クリームスープの表面（かき混ぜた跡の弧とつや）
function xbrCream(p, { R = 66, c = '#e9c05a', cx = 100, cy = 100, seed = 1, rings = 4 } = {}){
    const Rn = rng(p.id + 'xbrCr' + seed);
    let arcs = '';
    for (let i = 0; i < rings; i++){ const rr = R * (.22 + i * (.66 / rings) + Rn() * .05), a0 = Rn() * 6.28, a1 = a0 + 1.4 + Rn() * 1.6; arcs += `<path d="M${f1(cx + Math.cos(a0) * rr)},${f1(cy + Math.sin(a0) * rr)} A${f1(rr)},${f1(rr)} 0 0 1 ${f1(cx + Math.cos(a1) * rr)},${f1(cy + Math.sin(a1) * rr)}" stroke="${i % 2 ? lt(c, .35) : dk(c, .12)}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`; }
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg(c, .25, .2, .42, .4)}"/>${arcs}`;
}
// 生クリームのうず
function xbrSwirl(cx, cy, s, c = '#fff6e6', { r = 0 } = {}){
    const d = `M${f1(-s * .5)},0 C${f1(-s * .5)},${f1(-s * .4)} ${f1(s * .3)},${f1(-s * .45)} ${f1(s * .35)},${f1(-s * .05)} C${f1(s * .4)},${f1(s * .3)} ${f1(-s * .15)},${f1(s * .35)} ${f1(-s * .18)},${f1(s * .05)} C${f1(-s * .2)},${f1(-s * .18)} ${f1(s * .12)},${f1(-s * .2)} ${f1(s * .1)},0`;
    return `<g ${T(cx, cy, r)}><path d="${d}" stroke="${dk(c, .12)}" stroke-width="5.4" fill="none" stroke-linecap="round" opacity=".5"/><path d="${d}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8" transform="translate(-.6 -.7)"/></g>`;
}
// カリカリのベーコン・豚の皮（torresmo）の小さな角
function xbrBacon(p, x, y, s, r = 0, { c = '#b5532f' } = {}){
    return `<g ${T(x, y, r)}><rect x="${f1(-s / 2)}" y="${f1(-s * .4)}" width="${s}" height="${f1(s * .8)}" rx="${f1(s * .2)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/><rect x="${f1(-s / 2 + 1)}" y="${f1(-s * .12)}" width="${f1(s - 2)}" height="${f1(s * .26)}" rx="1" fill="#f0cfa2" opacity=".85"/></g>`;
}
// クレープを巻いたパンケーキ（上から: 細長い筒、両端に巻きと中のひき肉）
function xbrCrepe(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xbrCp' + seed + x + y);
    let sp = '';
    for (let i = 0; i < 8; i++) sp += `<ellipse cx="${f1((R() - .5) * L * .8)}" cy="${f1((R() - .5) * w * .6)}" rx="${f1(2 + R() * 4)}" ry="${f1(1.2 + R() * 2)}" fill="#c98a3a" opacity="${f(.2 + R() * .25)}"/>`;
    const end = sx => `<ellipse cx="${f1(sx * (L / 2 - 3))}" cy="0" rx="5" ry="${f1(w / 2 - 1)}" fill="${p.g('#e9cf96', .2, .25)}" stroke="#b8925a" stroke-width=".6"/><ellipse cx="${f1(sx * (L / 2 - 3.5))}" cy=".5" rx="3.2" ry="${f1(w / 2 - 4)}" fill="#7a3f22"/><path d="M${f1(sx * (L / 2 - 3))},${f1(-w / 2 + 3)} q${sx * 3},${f1(w * .3)} 0,${f1(w * .5)}" stroke="#d9b880" stroke-width="1" fill="none"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${L}" height="${w}" rx="${f1(w * .45)}" fill="${p.g('#efd59c', .3, .25)}" stroke="#b8925a" stroke-width=".7"/></g>${sp}${end(-1)}${end(1)}
        <path d="M${f1(-L * .36)},${f1(-w * .28)} L${f1(L * .3)},${f1(-w * .28)}" stroke="#fff6dc" stroke-width="2" stroke-linecap="round" opacity=".6"/></g>`;
}
// 豚スペアリブのひと切れ（骨の端が見える）
function xbrRib(p, x, y, s, r = 0, { c = '#8a4a26', seed = 1 } = {}){
    const R = rng(p.id + 'xbrRb' + seed + x + y);
    const pts = ring(1, 9, .18, R, s / 2, s * .32);
    return `<g ${T(x, y, r)}><rect x="${f1(s * .3)}" y="${f1(-s * .09)}" width="${f1(s * .32)}" height="${f1(s * .18)}" rx="${f1(s * .08)}" fill="${p.g('#efe2c4', .3, .2)}" stroke="#b8a074" stroke-width=".6"/>
        <path d="${xbrSm(pts)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="M${f1(-s * .3)},${f1(s * .05)} q${f1(s * .15)},${f1(-s * .1)} ${f1(s * .3)},0 t${f1(s * .25)},0" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".5"/>
        <path d="M${f1(-s * .3)},${f1(-s * .14)} Q${f1(-s * .1)},${f1(-s * .26)} ${f1(s * .16)},${f1(-s * .2)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// ローストポークの薄切り（焼き色のふちと淡い桃色の断面）
function xbrLoinSlice(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xbrLs' + seed + x + y);
    const pts = ring(1, 10, .1, R, s * .42, s / 2);
    return `<g ${T(x, y, r)}><path d="${xbrSm(pts)}" fill="${p.g('#8f4e22', .25, .3)}" stroke="#5e2f12" stroke-width=".7"/>
        <path d="${xbrSm(pts.map(([a, b]) => [a * .84, b * .86]))}" fill="${p.rg('#f1d3b4', .2, .15)}"/>
        <path d="${xbrSm(pts.map(([a, b]) => [a * .45 + 1, b * .45 + 1]))}" fill="#e9b9a0" opacity=".55"/>
        <path d="M${f1(-s * .22)},${f1(-s * .28)} Q${f1(-s * .05)},${f1(-s * .38)} ${f1(s * .14)},${f1(-s * .3)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 揚げにんにくの薄切り
function xbrGarlicChips(p, x, y, s, { n = 12, seed = 1 } = {}){
    const R = rng(p.id + 'xbrGc' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2; out += `<ellipse ${T(x + Math.cos(a) * d, y + Math.sin(a) * d, R() * 180)} rx="3" ry="2.2" fill="${R() < .5 ? '#f1d08a' : '#e2b45e'}" stroke="#a87a32" stroke-width=".5"/>`; }
    return out;
}

// =========================================================
const D = {};
export default D;

// ---------- 主菜 1 ----------
Object.assign(D, {
    // フランゴ・アサード: アルミの天板に、こんがり焼けた鶏ももとドラム、焼いたじゃがいも・玉ねぎ、ライム、焼き汁
    br_frango_assado: p => [
        xbrTray(p),
        xbrBlob(p, 100, 100, 158, 124, '#b8742e', { seed: 1, l: .3, d: .3 }),
        `<g ${p.sh(.9)}>`,
        [[40, 58, 10], [100, 54, 50], [160, 58, 90], [38, 102, 30], [162, 102, 120], [40, 146, 70], [100, 148, 20], [160, 146, 160], [100, 100, 0]].map(([x, y, r], i) => xbrPotato(p, x, y, 30, r, { c: '#dc9a3c', seed: i, roast: 1.4 })).join(''),
        K.onion(p, 64, 50, 22, 30, { c: '#d9a04c' }), K.onion(p, 138, 150, 22, 200, { c: '#d9a04c' }),
        `</g><g ${p.sh(1.2)}>`,
        xbrThigh(p, 70, 80, 54, -14, { seed: 1 }),
        xbrThigh(p, 130, 120, 54, 10, { seed: 2, c: '#c27228' }),
        xbrDrum(p, 132, 74, 62, 200, { seed: 3, c: '#c47a2c' }),
        xbrDrum(p, 70, 126, 60, 15, { seed: 4, c: '#bd7228' }),
        `</g>`,
        K.lemon(p, 170, 78, 22, 70, { c: '#c8e07a', rind: '#4f8f2f' }), K.lemon(p, 30, 124, 22, -110, { c: '#c8e07a', rind: '#4f8f2f' }),
        xbrHerbs(p, 100, 100, 130, { n: 18 }),
    ].join(''),

    // フランゴ・ア・パッサリーニョ: 赤い縁の白い皿に、骨つきの小さな唐揚げを山盛り、揚げにんにくとパセリ、ライム
    br_frango_passarinho: p => {
        const sp = xbrSpots('fp', 14, 54, 22);
        return [
            K.plate(p, { rim: '#c4482f' }),
            `<g ${p.sh(1)}>`,
            sp.map(([x, y, r], i) => xbrStamp(p, 'kara' + (i % 3), () => K.karaage(p, 0, 0, 32, 0, { c: i % 3 === 1 ? '#c97a24' : '#d4892c', seed: i % 3 }), x, y, r, 1 + (i % 4) * .04)).join(''),
            `</g>`,
            sp.slice(0, 5).map(([x, y, r]) => `<path ${T(x + 8, y - 6, r)} d="M-3,-1 L4,-1.5 Q6,0 4,1.5 L-3,1Z" fill="#f2e6cc" stroke="#bfa880" stroke-width=".5"/>`).join(''),
            xbrGarlicChips(p, 100, 100, 110, { n: 18 }),
            xbrHerbs(p, 100, 100, 120, { n: 30 }),
            K.lemon(p, 158, 136, 24, 140, { c: '#c8e07a', rind: '#4f8f2f' }), K.lemon(p, 46, 62, 22, -40, { c: '#c8e07a', rind: '#4f8f2f' }),
        ].join('');
    },

    // フィレ・ア・パルメジャーナ: 白い楕円皿に、パン粉の牛カツ2枚、上にトマトソースと焼き色のついたチーズ、オレガノ
    br_file_parmegiana: p => [
        xbrOval(p, { rim: '#c4482f' }),
        xbrBlob(p, 100, 100, 150, 118, '#c23a24', { seed: 2, op: .9 }),
        `<g ${p.sh(1.2)}>`,
        xbrBreaded(p, 100, 74, 132, 64, -6, { seed: 1, c: '#d29440' }),
        xbrBreaded(p, 100, 126, 132, 62, 5, { seed: 2, c: '#cf903c' }),
        `</g>`,
        xbrBlob(p, 98, 74, 118, 52, '#c8361f', { seed: 3, jit: .2 }), xbrBlob(p, 102, 126, 118, 50, '#c8361f', { seed: 4, jit: .2 }),
        `<g ${p.sh(.5)}>`, xbrCheese(p, 98, 73, 104, 42, { seed: 1, n: 14 }), xbrCheese(p, 104, 125, 102, 40, { seed: 2, n: 14 }), `</g>`,
        K.sprinkle(p, 100, 100, 120, { c: '#4a6a24', n: 30, r: .7 }),
        xbrBasil(p, 120, 70, 18, -20), xbrBasil(p, 84, 128, 16, 30),
    ].join(''),

    // ピカジーニョ: 白い皿に、ご飯、角切り牛肉とにんじん・じゃがいもの煮込み、目玉焼き、ファロッファ少し
    br_picadinho: p => {
        const sp = xbrSpots('pc', 15, 34, 13, 122, 118);
        return [
            K.plate(p, { rim: '#2f7a52' }),
            xbrRice(p, 72, 74, 74, { density: 1.2, grain: 3.6 }),
            xbrGrains(p, 136, 64, 40, { cols: ['#e8c47e', '#d7a65a', '#f2dca8'], n: 90, size: 1.2, seed: 3 }),
            xbrBlob(p, 122, 120, 96, 86, '#7a3f1f', { seed: 1, l: .25, d: .3 }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => i % 5 === 1 ? xbrDice(p, x, y, 11, r, '#ec7d30') : i % 5 === 3 ? xbrDice(p, x, y, 12, r, '#e8c070') : xbrBeef(p, x, y, 18, r, { seed: i, c: '#8a4422' })).join(''),
            `</g>`,
            xbrShine(122, 120, 44, .45),
            xbrFriedEgg(p, 62, 136, 56, 10),
            xbrHerbs(p, 122, 118, 80, { n: 18 }),
        ].join('');
    },

    // カルニ・ジ・パネラ: アルミ鍋に、濃い煮汁でほろほろに煮た大きな牛肉、じゃがいも、にんじん
    br_carne_panela: p => [
        xbrPot(p, { c: '#aeb2b6', inside: '#80858a', rimC: '#eef0f2' }),
        K.liquid(p, { R: 72, c: '#70371a', op: 1 }),
        `<g ${p.sh(1)}>`,
        xbrPotato(p, 64, 72, 32, 20, { c: '#e2b766', seed: 1 }), xbrPotato(p, 138, 132, 32, 80, { c: '#e2b766', seed: 2 }), xbrPotato(p, 140, 72, 28, 0, { c: '#e2b766', seed: 3 }), xbrPotato(p, 58, 128, 28, 50, { c: '#e2b766', seed: 4 }),
        K.carrotChunk(p, 100, 50, 24, 30), K.carrotChunk(p, 100, 152, 24, 200), K.carrotChunk(p, 150, 102, 22, 100), K.carrotChunk(p, 48, 100, 22, -60),
        xbrBeef(p, 82, 92, 42, 15, { seed: 1, c: '#86421f' }), xbrBeef(p, 122, 100, 42, -20, { seed: 2, c: '#8e4a24' }), xbrBeef(p, 98, 126, 36, 60, { seed: 3, c: '#86421f' }), xbrBeef(p, 104, 72, 32, 0, { seed: 4, c: '#8e4a24' }),
        `</g>`,
        xbrSliver(p, 84, 112, 16, 30, { c: '#c98a40' }), xbrSliver(p, 124, 80, 14, -40, { c: '#c98a40' }),
        xbrShine(100, 100, 72, .4),
        xbrHerbs(p, 100, 100, 120, { n: 20 }),
    ].join(''),

    // アルモンデガス: 素焼き色の鉢に、真っ赤なトマトソースと肉団子、cheiro-verde
    br_almondegas: p => {
        const sp = [[72, 76], [112, 66], [144, 96], [128, 134], [86, 140], [58, 110], [100, 102]];
        return [
            K.bowl(p, { glaze: '#b5643c', inside: '#f4e6d4' }),
            K.liquid(p, { R: 79, c: '#b8321e', op: 1 }),
            `<g ${p.sh(1)}>`, sp.map(([x, y]) => K.meatball(p, x, y, 38, { c: '#94542e', glossy: false }) + `<path d="M${x - 11},${y - 5} Q${x - 8},${y - 12} ${x - 1},${y - 13}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/>`).join(''), `</g>`,
            xbrGrains(p, 100, 100, 130, { cols: ['#6e3a1f', '#b0714a'], n: 120, size: .9, seed: 5 }),
            sp.map(([x, y]) => `<path d="M${x - 15},${y + 6} Q${x},${y + 20} ${x + 16},${y + 4} Q${x + 8},${y + 12} ${x},${y + 12} Q${x - 9},${y + 12} ${x - 15},${y + 6}Z" fill="#b8321e" opacity=".85"/>`).join(''),
            xbrGrains(p, 100, 100, 130, { cols: ['#e8c88a'], n: 14, size: 2, seed: 2 }),
            xbrRings(p, 100, 100, 120, { n: 14 }),
            xbrHerbs(p, 100, 100, 124, { n: 24 }),
            xbrShine(100, 100, 72, .35),
        ].join('');
    },

    // パンケッカ・ジ・カルニ: 耐熱ガラスの角皿に、ひき肉を巻いたクレープ3本、トマトソースと溶けたチーズ
    br_panqueca_carne: p => [
        xbrPyrex(p),
        `<rect x="22" y="44" width="156" height="112" rx="14" fill="${p.rg('#c23a24', .2, .25)}"/>`,
        xbrCrepe(p, 100, 66, 146, 32, -2, { seed: 1 }), xbrCrepe(p, 100, 100, 146, 32, 1, { seed: 2 }), xbrCrepe(p, 100, 134, 146, 32, -1, { seed: 3 }),
        xbrBlob(p, 100, 66, 128, 28, '#c8361f', { seed: 1, jit: .18 }), xbrBlob(p, 100, 100, 128, 28, '#c8361f', { seed: 2, jit: .18 }), xbrBlob(p, 100, 134, 128, 28, '#c8361f', { seed: 3, jit: .18 }),
        xbrCheese(p, 96, 66, 100, 22, { seed: 1, n: 8, jit: .3 }), xbrCheese(p, 104, 100, 100, 22, { seed: 2, n: 8, jit: .3 }), xbrCheese(p, 98, 134, 100, 22, { seed: 3, n: 8, jit: .3 }),
        K.sprinkle(p, 100, 100, 120, { c: '#4a6a24', n: 24, r: .7 }),
    ].join(''),

    // エスコンジジーニョ: 素焼きの耐熱皿に、こんがり焼けたチーズの表面。すくった所からキャッサバのピュレと干し肉
    br_escondidinho: p => [
        K.bowl(p, { glaze: '#a85a32', inside: '#c47a48', lip: .86 }),
        `<circle cx="100" cy="100" r="76" fill="#f3e2b0"/>`,
        `<g ${p.crumb(.3)}>`, xbrCheese(p, 100, 100, 152, 152, { seed: 1, jit: .05, browned: 1, n: 50, c: '#e4ac4a' }), `</g>`,
        `<circle cx="100" cy="100" r="73" fill="none" stroke="#b8691e" stroke-width="6" opacity=".45"/>`,
        `<path d="M118,112 C138,104 166,118 160,140 C152,160 120,164 110,148 C102,136 106,118 118,112Z" fill="${p.rg('#f4e4b4', .2, .2)}" stroke="#d6b46a" stroke-width="1"/>`,
        xbrShred(p, 134, 136, 34, { seed: 2, n: 14, cols: ['#a4502e', '#c0683e'], ol: '#6a2a14', w: 2.4 }),
        `<path d="M116,116 C128,110 148,114 156,128" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`,
        xbrHerbs(p, 84, 84, 70, { n: 14 }),
    ].join(''),

    // フェイジョアーダ: 素焼きの鍋に、黒い豆の濃い煮込み、カラブレーザ・リブ・ベーコン・干し肉、ローリエ
    br_feijoada: p => {
        const sp = xbrSpots('fd', 80, 64, 9);
        return [
            xbrPot(p, { c: '#9a5634', inside: '#5a2e1c', rimC: '#d08a5e' }),
            K.liquid(p, { R: 73, c: '#2e1d20', op: 1 }),
            `<g ${p.sh(.4)}>`, sp.map(([x, y, r], i) => xbrBean(p, 'black', x, y, i % 4 ? 12 : 11, r)).join(''), `</g>`,
            `<circle cx="100" cy="100" r="72" fill="#2a181c" opacity=".18"/>`,
            `<g ${p.sh(1)}>`,
            xbrRib(p, 72, 76, 40, -20, { seed: 1 }), xbrRib(p, 130, 128, 40, 160, { seed: 2 }),
            xbrBeef(p, 124, 72, 26, 10, { seed: 3, c: '#7a2e1c' }), xbrBeef(p, 74, 126, 24, 40, { seed: 4, c: '#7a2e1c' }),
            xbrBacon(p, 102, 100, 18, 20, { c: '#a8482a' }), xbrBacon(p, 146, 96, 15, -30, { c: '#a8482a' }),
            xbrCalabresa(p, 98, 66, 20, 0, { seed: 1 }), xbrCalabresa(p, 104, 138, 20, 0, { seed: 2 }), xbrCalabresa(p, 56, 98, 18, 0, { seed: 3 }), xbrCalabresa(p, 150, 128, 16, 0, { seed: 4 }),
            `</g>`,
            `<g ${p.sh(.5)}><path ${T(130, 96, -50)} d="M-15,0 Q0,-7.5 15,0 Q0,7.5 -15,0Z" fill="${p.g('#5b6b2c', .25, .25)}" stroke="#3a4718" stroke-width=".6"/></g><path ${T(130, 96, -50)} d="M-13,0 L13,0" stroke="#8a9a52" stroke-width=".7"/>`,
            xbrShine(100, 100, 73, .45),
        ].join('');
    },

    // ロンボ・アサード: 木のまな板に、焼き色のついた豚ロースの塊と薄切り、焼いたじゃがいも・玉ねぎ、ライム
    br_lombo_assado: p => [
        xbrBoard(p),
        xbrBlob(p, 104, 100, 150, 100, '#a8682e', { seed: 1, op: .35 }),
        `<g ${p.sh(.9)}>`,
        xbrPotato(p, 44, 64, 28, 0, { c: '#dc9a3c', seed: 1, roast: 1.4 }), xbrPotato(p, 40, 134, 28, 40, { c: '#dc9a3c', seed: 2, roast: 1.4 }), xbrPotato(p, 160, 140, 28, 80, { c: '#dc9a3c', seed: 3, roast: 1.4 }), xbrPotato(p, 102, 148, 26, 20, { c: '#dc9a3c', seed: 4, roast: 1.4 }),
        K.onion(p, 70, 148, 22, 20, { c: '#d9a04c' }), K.onion(p, 34, 100, 20, -80, { c: '#d9a04c' }),
        `</g><g ${p.sh(1.3)}>`,
        `<rect x="118" y="46" width="48" height="84" rx="22" fill="${p.g('#9a5424', .3, .32)}" stroke="#5e2f12" stroke-width=".8"/>`,
        `<path d="M126,56 Q142,48 158,58 M124,80 Q142,72 160,82 M124,104 Q142,96 160,106" stroke="#6a3410" stroke-width="1.4" fill="none" opacity=".45"/>`,
        `<path d="M126,60 Q132,52 146,52" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`,
        xbrLoinSlice(p, 64, 98, 50, 10, { seed: 1 }), xbrLoinSlice(p, 80, 96, 50, 6, { seed: 2 }), xbrLoinSlice(p, 96, 94, 50, 2, { seed: 3 }), xbrLoinSlice(p, 112, 92, 50, -4, { seed: 4 }),
        `</g>`,
        K.lemon(p, 70, 52, 22, 20, { c: '#c8e07a', rind: '#4f8f2f' }),
        xbrHerbs(p, 100, 100, 140, { n: 26 }),
    ].join(''),
});

// ソーセージ（salsicha）の輪切り
function xbrSalsicha(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><circle r="${f1(s / 2)}" fill="${p.g('#c4573e', .2, .25)}" stroke="#8a2f1e" stroke-width=".6"/><circle r="${f1(s / 2 - 1.8)}" fill="${p.rg('#ec9a84', .2, .15)}"/><circle cx="${f1(-s * .12)}" cy="${f1(-s * .14)}" r="${f1(s * .1)}" fill="#fff" opacity=".45"/></g>`;
}
// ほぐれた干し鱈（白いはがれ身の塊）
function xbrCod(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xbrCd' + seed + x + y);
    const pts = ring(1, 9, .25, R, s / 2, s * .36);
    let fl = '';
    for (let i = 0; i < 4; i++){ const yy = -s * .2 + i * s * .13; fl += `<path d="M${f1(-s * .36)},${f1(yy)} q${f1(s * .2)},${f1(-s * .07)} ${f1(s * .36)},${f1(s * .02)} t${f1(s * .32)},0" stroke="#d6c8ae" stroke-width="1" fill="none" opacity=".85"/>`; }
    return `<g ${T(x, y, r)}><path d="${xbrSm(pts)}" fill="${p.g('#f7f1e4', .4, .2)}" stroke="#c8b898" stroke-width=".7"/>${fl}
        <path d="${xbrSm(pts.slice(5, 9).map(([a, b]) => [a * .96, b * .96]), false)}" stroke="#9a9a94" stroke-width="2" fill="none" opacity=".55"/>
        <path d="M${f1(-s * .26)},${f1(-s * .22)} Q${f1(-s * .05)},${f1(-s * .32)} ${f1(s * .16)},${f1(-s * .26)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// じゃがいもの輪切り（焼いた・ゆでた）
function xbrPotSlice(p, x, y, s, r = 0, { c = '#efcd7a' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .42)}" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/><ellipse rx="${f1(s / 2 - 2)}" ry="${f1(s * .42 - 2)}" fill="none" stroke="#d29a3a" stroke-width="1.6" opacity=".45"/><path d="M${f1(-s * .26)},${f1(-s * .18)} Q${f1(-s * .05)},${f1(-s * .3)} ${f1(s * .16)},${f1(-s * .24)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// ニョッキ（フォークの筋のある小さな枕）
function xbrGnocchi(p, x, y, s, r = 0, { c = '#f1d898' } = {}){
    const w = s / 2, h = s * .34;
    return `<g ${T(x, y, r)}><ellipse rx="${f1(w)}" ry="${f1(h)}" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f1(-w * .5)},${f1(-h * .7)} q${f1(-w * .15)},${f1(h * .7)} 0,${f1(h * 1.4)} M0,${f1(-h * .85)} q${f1(-w * .15)},${f1(h * .85)} 0,${f1(h * 1.7)} M${f1(w * .5)},${f1(-h * .7)} q${f1(-w * .15)},${f1(h * .7)} 0,${f1(h * 1.4)}" stroke="${dk(c, .25)}" stroke-width=".9" fill="none" opacity=".7"/>
        <path d="M${f1(-w * .6)},${f1(-h * .35)} Q${f1(-w * .2)},${f1(-h * .85)} ${f1(w * .3)},${f1(-h * .7)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// なすの輪切り（紫の皮のふちと、こんがり焼けた身）
function xbrEggplantSlice(p, x, y, s, r = 0, { flesh = '#d9a85a' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .44)}" fill="${p.g('#4d2a5c', .3, .2)}" stroke="#2b1433" stroke-width=".7"/><ellipse rx="${f1(s / 2 - 3)}" ry="${f1(s * .44 - 3)}" fill="${p.g(flesh, .3, .3)}"/></g>`;
}
// コーン粒（少し大きめ）
function xbrCorn(p, x, y, s, { n = 12, seed = 1, c = '#f6c93a' } = {}){
    const R = rng(p.id + 'xbrCo' + seed + x + y);
    let d = '', h = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = R() * 180; d += `M${f1(cx - 2.2)},${f1(cy - 1.6)}h4.4q.6,0 .6,.8v1.6q0,1.2 -2.8,1.6q-2.8,-.4 -2.8,-1.6v-1.6q0,-.8 .6,-.8Z`; h += `M${f1(cx - 1.2)},${f1(cy - .8)}h1.6`; }
    return `<path d="${d}" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .35)}" stroke-width=".4"/><path d="${h}" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".8"/>`;
}

// ---------- 主菜 2 ----------
Object.assign(D, {
    // マカハォン・コン・サルシーシャ: 黄色い縁の深皿に、トマトソースのスパゲッティ、ソーセージの輪切り、コーン、粉チーズ
    br_macarrao_salsicha: p => {
        const sp = xbrSpots('ms', 11, 50, 18);
        return [
            xbrDeep(p, { rim: '#d9a441', well: .76 }),
            `<circle cx="100" cy="100" r="68" fill="${p.rg('#c4452c', .2, .25)}"/>`,
            xbrNoodles(p, 100, 100, 140, { c: '#e9a35a', w: 3.6, n: 48, seed: 2, outline: '#b8582e' }),
            xbrBlob(p, 96, 94, 70, 56, '#c8361f', { seed: 1, op: .7, jit: .3 }),
            `<g ${p.sh(.7)}>`, sp.map(([x, y, r]) => xbrSalsicha(p, x, y, 17, r)).join(''), `</g>`,
            xbrCorn(p, 100, 100, 110, { n: 18 }),
            xbrGrains(p, 100, 96, 90, { cols: ['#fbf3d6', '#f2e2b0'], n: 30, size: 1, seed: 4 }),
            xbrHerbs(p, 100, 100, 100, { n: 14 }),
        ].join('');
    },

    // フィレ・ジ・ペイシ・エンパナード: 藍の縁の白い皿に、パン粉をつけて揚げた白身魚3枚、ライム、レタスとトマト
    br_peixe_empanado: p => [
        K.plate(p, { rim: '#2c4c7c' }),
        xbrLettuce(p, 62, 126, 70, 50, { seed: 1, c: '#9fd060' }), xbrLettuce(p, 52, 96, 56, 80, { seed: 2, c: '#b3dc78' }),
        xbrTomatoSlice(p, 62, 140, 24, 0), xbrTomatoSlice(p, 44, 112, 22, 20),
        `<g ${p.sh(1.2)}>`,
        xbrBreaded(p, 118, 66, 104, 40, -18, { seed: 1, c: '#dba24a' }),
        xbrBreaded(p, 122, 104, 104, 40, -8, { seed: 2, c: '#d69c44' }),
        xbrBreaded(p, 118, 142, 96, 38, 4, { seed: 3, c: '#dca64e' }),
        `</g>`,
        K.lemon(p, 68, 62, 26, -30, { c: '#c8e07a', rind: '#4f8f2f' }), K.lemon(p, 82, 52, 22, 20, { c: '#c8e07a', rind: '#4f8f2f' }),
    ].join(''),

    // バカリャオアーダ: 素焼きの楕円皿に、オリーブオイルをたっぷり、干し鱈・じゃがいもの輪切り・玉ねぎ・ピーマン・ゆで卵・黒オリーブ
    br_bacalhoada: p => [
        xbrOval(p, { rim: '#8a4424', base: '#c0703f' }),
        xbrBlob(p, 100, 100, 160, 124, '#d8b04a', { seed: 1, l: .3, d: .2 }),
        `<g ${p.sh(.8)}>`,
        [[42, 86], [52, 128], [80, 150], [124, 152], [158, 120], [160, 80], [130, 52], [84, 50]].map(([x, y], i) => xbrPotSlice(p, x, y, 30, i * 40)).join(''),
        `</g><g ${p.sh(1)}>`,
        xbrCod(p, 78, 86, 46, 10, { seed: 1 }), xbrCod(p, 124, 84, 44, -20, { seed: 2 }), xbrCod(p, 98, 122, 48, 5, { seed: 3 }),
        `</g>`,
        xbrOnionRing(p, 104, 64, 22, 10, { c: '#f2e2b8' }), xbrOnionRing(p, 64, 118, 20, 0, { c: '#f2e2b8' }), xbrOnionRing(p, 140, 128, 20, 0, { c: '#f2e2b8' }),
        K.pepperPiece(p, 58, 70, 22, 40, { c: '#d8352a', strip: true }), K.pepperPiece(p, 146, 104, 22, 80, { c: '#d8352a', strip: true }), K.pepperPiece(p, 118, 112, 20, -30, { c: '#3f8f2f', strip: true }), K.pepperPiece(p, 82, 140, 20, 20, { c: '#3f8f2f', strip: true }),
        xbrEggSlice(p, 140, 66, 20, 20), xbrEggSlice(p, 70, 104, 18, -10), xbrEggSlice(p, 118, 140, 18, 30),
        [[96, 96], [150, 88], [48, 104], [104, 150], [76, 64]].map(([x, y]) => `<g ${p.sh(.5)}><ellipse cx="${x}" cy="${y}" rx="5.4" ry="4.4" fill="${p.rg('#2e2628', .25, .2, .35, .32)}"/></g><ellipse cx="${x - 1.6}" cy="${y - 1.4}" rx="1.4" ry=".8" fill="#fff" opacity=".7"/>`).join(''),
        xbrOil(p, 100, 100, 130, { n: 10, c: '#e8c24a', op: .6, rmax: 2 }),
        xbrHerbs(p, 100, 100, 130, { n: 30 }),
    ].join(''),

    // ボボ・ジ・カマラォン: 素焼きの鉢に、デンデ油とキャッサバのとろりとしたオレンジ色のクリーム、えび、香菜
    br_bobo_camarao: p => {
        const sp = xbrSpots('bb', 10, 50, 26);
        return [
            K.bowl(p, { glaze: '#8a4a2c', inside: '#c47a48' }),
            xbrCream(p, { R: 76, c: '#eba040', seed: 1, rings: 5 }),
            `<circle cx="94" cy="92" r="40" fill="#f7c068" opacity=".35"/>`,
            `<g ${p.sh(.9)}>`, sp.map(([x, y, r]) => K.shrimp(p, x, y, 32, r, { c: '#f0743e' })).join(''), `</g>`,
            xbrOil(p, 100, 100, 130, { n: 12, c: '#e8761c', op: .75, rmax: 2.2 }),
            xbrGrains(p, 100, 100, 120, { cols: ['#d8352a'], n: 10, size: 2, seed: 2 }),
            xbrLeaf(p, 96, 98, 14, 20), xbrLeaf(p, 128, 70, 13, -30), xbrLeaf(p, 66, 130, 13, 60), xbrLeaf(p, 140, 128, 12, 100), xbrLeaf(p, 70, 70, 12, -60),
            xbrHerbs(p, 100, 100, 120, { n: 14, cols: ['#3f8a2c'] }),
            xbrShine(100, 100, 76, .4),
        ].join('');
    },

    // トゥトゥ・ジ・フェイジャン: 白い深皿に、豆とキャッサバ粉を練った茶色いピュレ、カリカリのベーコン、ゆで卵、couve
    br_tutu_feijao: p => [
        xbrDeep(p, { rim: '#7a4a2a', well: .76 }),
        `<g ${p.crumb(.18)}>`, xbrCream(p, { R: 71, c: '#83583a', seed: 2, rings: 6 }), `</g>`,
        xbrGrains(p, 100, 100, 130, { cols: ['#a37a54', '#5e3a22'], n: 80, size: 1, seed: 1 }),
        xbrCouve(p, 140, 132, 46, { n: 40, seed: 2, w: 2 }),
        `<g ${p.sh(.8)}>`,
        [[84, 76, 20], [110, 92, -10], [70, 108, 40], [124, 66, 10], [96, 118, -30], [60, 84, 60]].map(([x, y, r]) => xbrBacon(p, x, y, 13, r, { c: '#b0502a' })).join(''),
        K.eggHalf(p, 132, 98, 30, 10), K.eggHalf(p, 96, 140, 30, -20),
        `</g>`,
        xbrRings(p, 96, 96, 100, { n: 16 }),
        xbrShine(100, 100, 70, .3),
    ].join(''),

    // クスクス・ノルデスチーノ: 白いほうろう皿に、蒸した黄色いとうもろこしのクスクス、バター、目玉焼き2つ、焼いたコアリョチーズ
    br_cuscuz_nordestino: p => [
        K.plate(p, { rim: '#2c4c7c', base: '#f6f8fa' }),
        `<g ${p.sh(1.2)}><circle cx="82" cy="96" r="54" fill="${p.rg('#f2c24a', .25, .25, .38, .34)}"/></g>`,
        xbrGrains(p, 82, 96, 104, { cols: ['#f7d36a', '#e8ac2e', '#fbe49a', '#dc9a24'], n: 260, size: 1.6, seed: 1 }),
        `<circle cx="82" cy="96" r="53" fill="none" stroke="#c98a1a" stroke-width="2" opacity=".35"/>`,
        `<rect ${T(80, 88, 12)} x="-9" y="-7" width="18" height="14" rx="3" fill="${p.g('#fbe7a0', .4, .15)}" stroke="#e0bf5a" stroke-width=".6"/><path d="M68,96 Q76,104 90,100" stroke="#f8e08a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`,
        xbrFriedEgg(p, 146, 72, 56, -10, { seed: 1 }), xbrFriedEgg(p, 142, 130, 54, 20, { seed: 2 }),
        `<g ${p.sh(.8)}>`,
        [[66, 158, -20], [96, 160, 10]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-14" y="-7" width="28" height="14" rx="3" fill="${p.g('#f6ecd2', .3, .2)}" stroke="#c9b48a" stroke-width=".6"/><path d="M-8,-6 L-12,6 M0,-6 L-4,6 M8,-6 L4,6" stroke="#b8752a" stroke-width="2.2" opacity=".7"/></g>`).join(''),
        `</g>`,
    ].join(''),

    // ベリンジェラ・ア・パルメジャーナ: 耐熱ガラスの角皿に、なすの輪切りを重ね、トマトソースと焼いたチーズ、バジル
    br_berinjela_parmegiana: p => [
        xbrPyrex(p),
        `<rect x="22" y="44" width="156" height="112" rx="14" fill="${p.rg('#c23a24', .2, .25)}"/>`,
        `<g ${p.sh(.8)}>`,
        [[50, 74], [100, 70], [150, 76], [52, 126], [102, 130], [150, 124]].map(([x, y], i) => xbrEggplantSlice(p, x, y, 50, i * 25)).join(''),
        `</g>`,
        [[50, 74], [100, 70], [150, 76], [52, 126], [102, 130], [150, 124]].map(([x, y], i) => xbrBlob(p, x + 1, y + 1, 42, 36, '#c8361f', { seed: i, jit: .25 })).join(''),
        `<g ${p.sh(.5)}>`, [[52, 72], [101, 68], [148, 76], [54, 126], [102, 128], [148, 124]].map(([x, y], i) => xbrCheese(p, x, y, 36, 30, { seed: i + 1, n: 7, jit: .3, browned: 1, c: '#f2cf6a' })).join(''), `</g>`,
        xbrBasil(p, 90, 90, 18, -20), xbrBasil(p, 120, 108, 16, 40), xbrBasil(p, 72, 112, 14, 10),
        K.sprinkle(p, 100, 100, 120, { c: '#4a6a24', n: 20, r: .7 }),
    ].join(''),

    // アホース・ジ・フォルノ: 赤い縁の角型の焼き皿に、鶏・ハム・グリーンピース・コーンを混ぜたご飯、上に焼き色のチーズ
    br_arroz_forno: p => [
        K.squareDish(p, { s: 176, base: '#f4efe4', rim: '#c4482f' }),
        `<rect x="26" y="26" width="148" height="148" rx="14" fill="${p.rg('#efd9a8', .2, .2)}"/>`,
        xbrRice(p, 100, 100, 150, { density: .45, grain: 3.6, tint: '#f2e2b8', shadow: 0 }),
        `<clipPath id="${p.id}-c"><rect x="26" y="26" width="148" height="148" rx="14"/></clipPath>`,
        `<g clip-path="url(#${p.id}-c)">`,
        xbrShred(p, 46, 50, 30, { seed: 1, n: 8 }), xbrShred(p, 154, 150, 30, { seed: 2, n: 8 }), xbrShred(p, 150, 50, 26, { seed: 3, n: 6 }),
        xbrSpots('af', 24, 74, 9).filter(([x, y]) => Math.hypot(x - 100, y - 100) > 46).map(([x, y, r], i) => i % 3 === 0 ? `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="${p.rg('#6db043', .3, .25, .35, .32)}" stroke="#3f7a24" stroke-width=".5"/>` : i % 3 === 1 ? xbrCube(p, x, y, 7, r, '#f1a3a6') : xbrCorn(p, x, y, 6, { n: 2, seed: i })).join(''),
        `</g>`,
        `<g ${p.sh(.6)}>`, `<g ${p.crumb(.35)}>`, xbrCheese(p, 100, 100, 142, 140, { seed: 1, n: 22, jit: .14, browned: 1, c: '#e3a744' }), `</g></g>`,
        xbrHerbs(p, 100, 100, 130, { n: 20 }),
    ].join(''),

    // バイアォン・ジ・ドイス: 鉄のフライパンに、ささげ豆を混ぜたご飯、焼いたコアリョチーズ、カラブレーザ、ベーコン、香菜
    br_baiao_de_dois: p => {
        const sp = xbrSpots('bd', 30, 62, 11, 92, 100);
        const sp2 = xbrSpots('bd2', 14, 56, 18, 92, 100);
        return [
            xbrSkillet(p),
            xbrRice(p, 92, 100, 136, { density: .62, grain: 3.8, tint: '#dcc49a', hiK: .5 }),
            `<g ${p.sh(.4)}>`, sp.map(([x, y, r]) => xbrBean(p, 'eye', x, y, 11, r)).join(''), `</g>`,
            `<g ${p.sh(.7)}>`,
            sp2.map(([x, y, r], i) => i % 3 === 0 ? xbrCalabresa(p, x, y, 16, r, { seed: i }) : i % 3 === 1 ? xbrDice(p, x, y, 14, r, '#f2e4c0') + `<rect ${T(x + 1, y + 1, r)} x="-4" y="-4" width="7" height="6" rx="2" fill="#d89a3e" opacity=".55"/>` : xbrBacon(p, x, y, 11, r)).join(''),
            `</g>`,
            xbrLeaf(p, 80, 84, 13, 20), xbrLeaf(p, 116, 116, 12, -40), xbrLeaf(p, 66, 124, 12, 80), xbrLeaf(p, 112, 70, 11, 140),
            xbrHerbs(p, 92, 100, 120, { n: 24, cols: ['#3f8a2c'] }),
        ].join('');
    },

    // ニョッキ・アオ・スーゴ: 赤い帯の深皿に、トマトソースのじゃがいもニョッキ、粉チーズとバジル
    br_nhoque: p => {
        const sp = xbrSpots('nq', 17, 54, 21);
        return [
            xbrDeep(p, { rim: '#c4482f', band: true, well: .74 }),
            `<circle cx="100" cy="100" r="68" fill="${p.rg('#c23a24', .2, .25)}"/>`,
            `<g ${p.sh(.8)}>`, sp.map(([x, y, r]) => xbrGnocchi(p, x, y, 25, r)).join(''), `</g>`,
            sp.map(([x, y, r]) => `<ellipse ${T(x + 1.5, y + 2.5, r)} rx="12" ry="6" fill="#c8361f" opacity=".45"/>`).join(''),
            xbrGrains(p, 100, 100, 110, { cols: ['#fbf3d6', '#f2e2b0'], n: 60, size: .9, seed: 4 }),
            xbrBasil(p, 104, 92, 20, -30), xbrBasil(p, 116, 104, 16, 50),
            xbrShine(100, 100, 68, .3),
        ].join('');
    },
});

// ズッキーニの半月切り（炒めて少し透けた身と緑の皮）
function xbrZuke(p, x, y, s, r = 0){
    const d = `M${f1(-s / 2)},0 A${f1(s / 2)},${f1(s / 2)} 0 0 1 ${f1(s / 2)},0Z`;
    return `<g ${T(x, y, r)}><path d="${d}" fill="#3f7a2a" stroke="#28541a" stroke-width=".6"/><path d="M${f1(-s / 2 + 1.6)},0 A${f1(s / 2 - 1.6)},${f1(s / 2 - 1.6)} 0 0 1 ${f1(s / 2 - 1.6)},0Z" fill="${p.g('#e6ecb8', .3, .2)}"/>
        <path d="M${f1(-s * .22)},0 A${f1(s * .22)},${f1(s * .22)} 0 0 1 ${f1(s * .22)},0" fill="none" stroke="#c8d690" stroke-width="1"/>${[-.12, 0, .12].map(t => `<ellipse cx="${f1(t * s)}" cy="${f1(-s * .12)}" rx=".9" ry=".6" fill="#f4f6dc"/>`).join('')}</g>`;
}

// ---------- 副菜 1 ----------
Object.assign(D, {
    // マンジョッカ・フリッタ: 琥珀ガラスの皿に、太い棒に切って揚げたキャッサバを山盛り、塩
    br_mandioca_frita: p => {
        const st = [[66, 60, 30], [122, 56, -20], [148, 96, 80], [52, 104, -70], [106, 100, 10], [92, 140, -10], [140, 140, 40], [62, 142, 30], [96, 66, 100], [130, 118, -70], [76, 92, 60], [114, 78, -40], [150, 70, 20], [46, 80, 100], [118, 152, 90], [84, 116, -30], [100, 46, 0], [40, 126, -20]];
        return [
            xbrAmberPlate(p),
            `<g ${p.sh(1.1)}>`, st.map(([x, y, r], i) => xbrStick(p, x, y, 66, 20, r, { c: i % 3 ? '#efc56a' : '#e9b450', seed: i, rx: .3, cracks: 3 })).join(''), `</g>`,
            xbrGrains(p, 100, 100, 120, { cols: ['#ffffff'], n: 30, size: .6, seed: 2 }),
        ].join('');
    },

    // バタタ・ソテー: 黄色い縁の白い皿に、バターで焼いた小さなじゃがいも、パセリ
    br_batata_saute: p => {
        const sp = xbrSpots('bs', 12, 52, 27);
        return [
            K.plate(p, { rim: '#d9a441' }),
            xbrBlob(p, 100, 100, 140, 136, '#f2d27a', { seed: 1, op: .5 }),
            `<g ${p.sh(1)}>`, sp.map(([x, y, r], i) => xbrPotato(p, x, y, 36, r, { c: '#f4cc6c', seed: i, roast: .25 })).join(''), `</g>`,
            sp.map(([x, y]) => `<ellipse cx="${f(x - 5)}" cy="${f(y - 6)}" rx="4" ry="2" fill="#fff" opacity=".55"/>`).join(''),
            xbrHerbs(p, 100, 100, 130, { n: 50 }),
        ].join('');
    },

    // アホース・コン・ブロコリス: 白い器に、刻んだブロッコリーを混ぜた白いご飯、にんにく
    br_arroz_brocolis: p => [
        K.bowl(p, { glaze: '#f3efe7', inside: '#fbf9f4' }),
        `<circle cx="100" cy="100" r="86" fill="none" stroke="#2f7a52" stroke-width="1.6" opacity=".8"/>`,
        xbrRice(p, 100, 101, 144, { density: .7, grain: 4.2, tint: '#f3f1e2' }),
        xbrGrains(p, 100, 100, 130, { cols: ['#2f6e26', '#4a8f34', '#6aa84a'], n: 90, size: 1.8, seed: 1 }),
        `<g ${p.sh(.6)}>`, [[78, 76, 20], [124, 84, -30], [96, 124, 60], [136, 122, 10], [64, 116, -40], [108, 58, 0]].map(([x, y, r], i) => xbrStamp(p, 'bro' + (i % 2), () => K.broccoli(p, i % 2, 0, 20, 0, { c: '#3a8030' }), x, y, r)).join(''), `</g>`,
        xbrGarlicChips(p, 100, 100, 110, { n: 8 }),
    ].join(''),

    // サラダ・ジ・ベテハーバ: ガラスの器に、ゆでたビーツの角切り、玉ねぎの薄切り、cheiro-verde
    br_salada_beterraba: p => {
        const sp = xbrSpots('bt', 46, 62, 14);
        return [
            xbrGlass(p),
            `<circle cx="100" cy="100" r="74" fill="${p.rg('#9a2048', .2, .3)}" opacity=".85"/>`,
            `<g ${p.sh(.6)}>`, sp.map(([x, y, r], i) => xbrDice(p, x, y, i % 3 ? 15 : 13, r, i % 2 ? '#8e1d44' : '#a32651')).join(''), `</g>`,
            [[80, 80, 20], [120, 70, -30], [130, 120, 60], [76, 124, 10], [102, 100, 90]].map(([x, y, r]) => xbrSliver(p, x, y, 22, r, { c: '#f0c8d8', w: 3 })).join(''),
            xbrRings(p, 100, 100, 120, { n: 12 }),
            xbrHerbs(p, 100, 100, 124, { n: 30 }),
            xbrShine(100, 100, 74, .5), xbrGlassHi(),
        ].join('');
    },

    // サラダ・ジ・ペピーノ: 青い器に、薄い輪切りのきゅうりと生の玉ねぎ、オレガノ、オイルのつや
    br_salada_pepino: p => {
        const sp = xbrSpots('pp', 30, 60, 15);
        return [
            K.bowl(p, { glaze: '#4f7fa8', inside: '#f2f4f2' }),
            `<circle cx="100" cy="100" r="74" fill="#e6eed2" opacity=".8"/>`,
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r]) => K.cucumberSlice(p, x, y, 24, r, { oval: 1.05 })).join(''), `</g>`,
            xbrOnionRing(p, 84, 84, 30, 10, { raw: true }), xbrOnionRing(p, 122, 112, 26, 0, { raw: true }), xbrOnionRing(p, 96, 130, 20, 0, { raw: true }), xbrSliver(p, 128, 76, 22, 40, { c: '#f4eee0', w: 3 }),
            K.sprinkle(p, 100, 100, 120, { c: '#5a6a2a', n: 26, r: .7 }),
            xbrShine(100, 100, 72, .5),
        ].join('');
    },

    // サラダ・ジ・セノウラ・ハラーダ: 白い器に、すりおろしたにんじんの山、ライム、cheiro-verde
    br_cenoura_ralada: p => [
        K.bowl(p, { glaze: '#e9e3d7', inside: '#f8f5ee' }),
        `<g ${p.sh(.8)}><path d="${xbrSm(ring(70, 12, .1, rng(p.id + 'cr'), 1, 1))}" transform="translate(100 100)" fill="${p.rg('#e8742a', .2, .2)}"/></g>`,
        xbrCouve(p, 100, 100, 140, { n: 300, seed: 1, w: 1.8, len: 5, cols: ['#f08a34', '#f6a04a', '#e0701e'], ol: '#b8501a' }),
        xbrHerbs(p, 100, 100, 110, { n: 26 }),
        K.lemon(p, 140, 136, 30, 140, { c: '#c8e07a', rind: '#4f8f2f' }),
    ].join(''),

    // アボブリーニャ・ヘフォガーダ: からし色の器に、半月切りのズッキーニの炒め煮、トマト、cheiro-verde
    br_abobrinha_refogada: p => {
        const sp = xbrSpots('ab', 34, 62, 15);
        return [
            K.bowl(p, { glaze: '#d9a441', inside: '#f6efdc' }),
            `<circle cx="100" cy="100" r="72" fill="${p.rg('#cdc884', .2, .2)}" opacity=".85"/>`,
            `<g ${p.sh(.6)}>`, sp.map(([x, y, r]) => xbrZuke(p, x, y, 30, r)).join(''), `</g>`,
            xbrGrains(p, 100, 100, 120, { cols: ['#e0482e', '#c83a24'], n: 22, size: 2.6, seed: 2 }),
            [[84, 96, 20], [120, 120, -30], [112, 78, 60]].map(([x, y, r]) => xbrSliver(p, x, y, 18, r, { c: '#eed8a0', w: 2.6 })).join(''),
            xbrRings(p, 100, 100, 120, { n: 14 }),
            xbrHerbs(p, 100, 100, 124, { n: 22 }),
        ].join('');
    },

    // キアーボ・ヘフォガード: 素焼きの鉢に、輪切りのオクラの炒め煮、トマト、玉ねぎ
    br_quiabo_refogado: p => {
        const sp = xbrSpots('qb', 46, 64, 13.5);
        return [
            K.bowl(p, { glaze: '#a85a32', inside: '#efe2c8' }),
            `<circle cx="100" cy="100" r="74" fill="${p.rg('#6f8a3a', .2, .25)}"/>`,
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r]) => xbrStamp(p, 'okra', () => K.okra(p, 0, 0, 17), x, y, r)).join(''), `</g>`,
            xbrGrains(p, 100, 100, 124, { cols: ['#e0482e', '#c83a24'], n: 20, size: 2.6, seed: 3 }),
            [[88, 90, 20], [118, 116, -30]].map(([x, y, r]) => xbrSliver(p, x, y, 18, r, { c: '#eed8a0', w: 2.6 })).join(''),
            xbrShine(100, 100, 74, .4),
        ].join('');
    },

    // ヘポーリョ・ヘフォガード: 藍の縁の深皿に、しんなり炒めたキャベツの千切り、トマト、ベーコン
    br_repolho_refogado: p => [
        xbrDeep(p, { rim: '#2c4c7c', well: .76 }),
        `<g ${p.sh(.8)}><path d="${xbrSm(ring(70, 12, .1, rng(p.id + 'rp'), 1, 1))}" transform="translate(100 100)" fill="${p.rg('#cdd890', .2, .2)}"/></g>`,
        xbrCouve(p, 100, 100, 138, { n: 170, seed: 1, w: 2.8, len: 10, cols: ['#dfe8a8', '#c6d688', '#eef2cc', '#b4c870'], ol: '#8a9c4c' }),
        `<g ${p.sh(.6)}>`, xbrSpots('rpb', 10, 56, 18).map(([x, y, r], i) => i % 2 ? xbrBacon(p, x, y, 11, r) : xbrCube(p, x, y, 9, r, '#e0482e')).join(''), `</g>`,
        xbrHerbs(p, 100, 100, 110, { n: 12 }),
    ].join(''),
});

// パルミット（ヤシの新芽）の輪切り: 白い円に年輪のような輪
function xbrPalmito(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .46)}" fill="${p.rg('#f7f2dc', .2, .15)}" stroke="#cfc6a0" stroke-width=".7"/></g>
        <ellipse rx="${f1(s * .34)}" ry="${f1(s * .31)}" fill="none" stroke="#e2dab4" stroke-width=".9"/><ellipse rx="${f1(s * .18)}" ry="${f1(s * .16)}" fill="#efe8c8" stroke="#ddd3a8" stroke-width=".7"/>
        <path d="M${f1(-s * .28)},${f1(-s * .18)} Q${f1(-s * .1)},${f1(-s * .34)} ${f1(s * .14)},${f1(-s * .3)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// カリフラワーの小房
function xbrCauli(p, x, y, s, r = 0, { c = '#f2ead0' } = {}){
    const R = rng(p.id + 'xbrCf' + x + y);
    let b = '';
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.28, d = i === 0 ? 0 : s * .22; b += `<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d - s * .05)}" r="${f1(s * (.2 + R() * .06))}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .2)}" stroke-width=".5"/>`; }
    return `<g ${T(x, y, r)}><path d="M${f1(-s * .12)},${f1(s * .15)} L${f1(-s * .14)},${f1(s * .5)} Q0,${f1(s * .56)} ${f1(s * .14)},${f1(s * .5)} L${f1(s * .12)},${f1(s * .15)}Z" fill="#e3e6c0" stroke="#bfc392" stroke-width=".5"/>${b}</g>`;
}
// パン粉をつけて揚げたバナナ（ゆるく反った細長い形）
function xbrBanana(p, x, y, L, r = 0, { c = '#d99a40', seed = 1 } = {}){
    const w = L * .25;
    const pts = [[-L / 2, w * .15], [-L * .36, -w * .42], [0, -w * .72], [L * .36, -w * .42], [L / 2, w * .15], [L * .32, w * .12], [0, -w * .02], [-L * .32, w * .12]];
    const R = rng(p.id + 'xbrBn' + seed + x);
    let sp = '';
    for (let i = 0; i < 9; i++) sp += `<circle cx="${f1((R() - .5) * L * .8)}" cy="${f1(-w * .2 + (R() - .5) * w * .5)}" r="${f1(.6 + R())}" fill="${R() < .5 ? dk(c, .4) : lt(c, .45)}" opacity=".75"/>`;
    return `<g ${T(x, y, r)}><g ${p.crumb(.8)}><path d="${xbrSm(pts)}" fill="${p.g(c, .32, .34)}" stroke="${dk(c, .42)}" stroke-width=".9"/></g>${sp}
        <path d="M${f1(-L * .3)},${f1(-w * .38)} Q0,${f1(-w * .55)} ${f1(L * .28)},${f1(-w * .36)}" stroke="#fff6dc" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}

// ---------- 副菜 2 ----------
Object.assign(D, {
    // サラダ・ジ・パウミット: 白い皿に、レタスの上にパルミットの輪切り、トマト、グリーンオリーブ
    br_salada_palmito: p => {
        const pm = [[84, 82], [110, 74], [132, 96], [96, 104], [72, 112], [118, 124], [92, 134], [144, 124], [62, 90]];
        return [
            K.plate(p, { rim: '#2f7a52' }),
            xbrLettuce(p, 80, 80, 96, -30, { seed: 1, c: '#9fd060' }), xbrLettuce(p, 120, 120, 96, 20, { seed: 2, c: '#a8d66c' }), xbrLettuce(p, 74, 126, 76, 60, { seed: 3, c: '#8fc552' }), xbrLettuce(p, 128, 76, 76, -70, { seed: 4, c: '#b3dc78' }),
            pm.map(([x, y], i) => xbrPalmito(p, x, y, 26, i * 20)).join(''),
            `<g ${p.sh(.5)}>`, [[60, 66, 30], [150, 80, -60], [108, 152, 10], [56, 140, 80]].map(([x, y, r]) => K.tomatoWedge(p, x, y, 26, r)).join(''), `</g>`,
            [[104, 90], [138, 140], [78, 150], [146, 62], [70, 104]].map(([x, y]) => `<g ${p.sh(.5)}><ellipse cx="${x}" cy="${y}" rx="6" ry="4.8" fill="${p.rg('#8a9a2a', .3, .25, .35, .32)}" stroke="#56621a" stroke-width=".5"/></g><ellipse cx="${x - 1.8}" cy="${y - 1.5}" rx="1.6" ry=".9" fill="#fff" opacity=".7"/>`).join(''),
            K.sprinkle(p, 100, 100, 110, { c: '#5a6a2a', n: 20, r: .7 }),
        ].join('');
    },

    // キベベ: 茶色の素焼きの器に、粗くつぶしたかぼちゃのオレンジ色の煮もの、香菜
    br_quibebe: p => {
        const sp = xbrSpots('qbb', 16, 54, 20);
        return [
            K.bowl(p, { glaze: '#7a4a2c', inside: '#efe2c8' }),
            xbrCream(p, { R: 76, c: '#ee9630', seed: 1, rings: 5 }),
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r], i) => xbrBlob(p, x, y, 20, 15, i % 2 ? '#f4a640' : '#f8b450', { seed: i, jit: .3 })).join(''), `</g>`,
            [[84, 90, 20], [118, 116, -30], [120, 78, 60]].map(([x, y, r]) => xbrSliver(p, x, y, 18, r, { c: '#f2d08a', w: 2.6 })).join(''),
            xbrLeaf(p, 96, 98, 15, 20), xbrLeaf(p, 128, 68, 13, -30), xbrLeaf(p, 68, 130, 13, 60), xbrLeaf(p, 138, 124, 12, 100), xbrLeaf(p, 66, 72, 12, -60),
            xbrHerbs(p, 100, 100, 120, { n: 18, cols: ['#3f8a2c'] }),
            xbrShine(100, 100, 76, .35),
        ].join('');
    },

    // コンセルヴァ・ジ・レグミス: ガラスの器に、酢漬けのにんじん・カリフラワー・きゅうり・小玉ねぎ、ローリエと粒こしょう
    br_picles_legumes: p => {
        const sp = xbrSpots('pk', 30, 62, 19);
        return [
            xbrGlass(p),
            `<circle cx="100" cy="100" r="74" fill="${p.rg('#f2e6b0', .2, .15)}" opacity=".9"/>`,
            `<g ${p.sh(.6)}>`,
            sp.map(([x, y, r], i) => {
                const k = i % 5;
                return k === 0 ? xbrCauli(p, x, y, 28, r) : k === 1 ? xbrCarrotRound(p, x, y, 20) : k === 2 ? K.cucumberSlice(p, x, y, 22, r, { oval: 1.1 }) : k === 3 ? `<g ${T(x, y, r)}><rect x="-12" y="-3" width="24" height="6" rx="2" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b8501a" stroke-width=".5"/></g>` : `<circle cx="${f(x)}" cy="${f(y)}" r="8" fill="${p.rg('#f6f2e2', .2, .15)}" stroke="#cfc6a0" stroke-width=".6"/><circle cx="${f(x)}" cy="${f(y)}" r="4.6" fill="none" stroke="#e2dab8" stroke-width=".8"/>`;
            }).join(''),
            `</g>`,
            `<g ${p.sh(.5)}><path ${T(118, 70, 30)} d="M-15,0 Q0,-7.5 15,0 Q0,7.5 -15,0Z" fill="${p.g('#5b6b2c', .25, .25)}" stroke="#3a4718" stroke-width=".6"/></g>`,
            K.sprinkle(p, 100, 100, 120, { c: '#3a2a20', n: 14, r: 1.4 }),
            xbrShine(100, 100, 74, .55), xbrGlassHi(),
        ].join('');
    },

    // ポレンタ・フリッタ: 赤い縁の白い皿に、棒状に切って揚げたポレンタを山盛り、粉チーズ
    br_polenta_frita: p => {
        const st = [[64, 62, 20], [118, 58, -15], [150, 98, 80], [50, 104, -70], [104, 100, 10], [94, 140, -10], [140, 140, 40], [60, 140, 30], [96, 68, 100], [130, 118, -70], [74, 94, 60], [116, 80, -40], [150, 64, 20], [104, 154, 90], [80, 118, -30], [124, 102, 70]];
        return [
            K.plate(p, { rim: '#c4482f' }),
            `<g ${p.sh(1.1)}>`, st.map(([x, y, r], i) => xbrStick(p, x, y, 60, 17, r, { c: i % 3 ? '#efbc3a' : '#e8a82e', seed: i, rx: .14, cracks: 0, crumb: .7 })).join(''), `</g>`,
            xbrGrains(p, 100, 100, 120, { cols: ['#fbf3d6', '#f6e6b4'], n: 60, size: .8, seed: 2 }),
        ].join('');
    },

    // バナナ・ア・ミラネーザ: からし色の縁の楕円皿に、パン粉をつけて揚げたバナナ5本
    br_banana_milanesa: p => [
        xbrOval(p, { rim: '#d9a441' }),
        `<g ${p.sh(1.2)}>`,
        [[96, 62, -8], [104, 92, 4], [96, 122, -6], [102, 152, 6]].map(([x, y, r], i) => xbrBanana(p, x, y, 148 - (i % 3 ? 0 : 14), r, { seed: i, c: i % 2 ? '#d38e34' : '#dc9a3c' })).join(''),
        `</g>`,
    ].join(''),

    // サウピカォン: ガラスの器に、マヨネーズであえた鶏・にんじん・コーン・りんご、上にバタタ・パーリャとパセリ
    br_salpicao: p => [
        xbrGlass(p),
        `<g ${p.sh(.8)}><path d="${xbrSm(ring(72, 12, .08, rng(p.id + 'sp'), 1, 1))}" transform="translate(100 100)" fill="${p.rg('#f4eac4', .2, .15)}"/></g>`,
        xbrShred(p, 70, 80, 40, { seed: 1, n: 14 }), xbrShred(p, 130, 80, 40, { seed: 2, n: 14 }), xbrShred(p, 70, 126, 40, { seed: 3, n: 14 }), xbrShred(p, 132, 126, 40, { seed: 4, n: 14 }),
        xbrCouve(p, 100, 100, 130, { n: 60, seed: 3, w: 1.6, len: 5, cols: ['#f08a34', '#f6a04a'], ol: '#b8501a' }),
        xbrCorn(p, 100, 100, 130, { n: 24 }),
        `<g ${p.sh(.5)}>`, xbrSpots('slp', 9, 60, 20).map(([x, y, r]) => xbrCube(p, x, y, 8, r, '#d8e89a')).join(''), `</g>`,
        xbrSticks(p, 100, 100, 70, 60, { n: 110, c: '#efbd45', len: 12, sw: 1.9, seed: 2 }),
        xbrHerbs(p, 100, 100, 130, { n: 26 }),
        xbrGlassHi(),
    ].join(''),

    // フェイジャン・トロペイロ: 鋳物の鍋に、ファロッファとあえた豆、ベーコン、カラブレーザ、炒り卵、couve
    br_feijao_tropeiro: p => {
        const sp = xbrSpots('ft', 34, 62, 11);
        const sp2 = xbrSpots('ft2', 14, 58, 18);
        return [
            xbrPot(p, { c: '#33302e', inside: '#1f1c1b', R: 86, rimC: '#5a5654' }),
            `<g ${p.sh(.8)}><g ${p.crumb(.9)}><circle cx="100" cy="100" r="72" fill="${p.rg('#d9b06a', .25, .25)}"/></g></g>`,
            xbrGrains(p, 100, 100, 140, { cols: ['#e8c47e', '#c9944a', '#f2dca8'], n: 80, size: 1.3, seed: 1 }),
            `<g ${p.sh(.4)}>`, sp.map(([x, y, r]) => xbrBean(p, 'carioca', x, y, 11, r)).join(''), `</g>`,
            xbrCouve(p, 100, 100, 130, { n: 30, seed: 2, w: 2.2 }),
            `<g ${p.sh(.7)}>`, sp2.map(([x, y, r], i) => i % 3 === 0 ? xbrCalabresa(p, x, y, 15, r, { seed: i }) : i % 3 === 1 ? xbrBacon(p, x, y, 11, r) : K.scrambled(p, x, y, 16, { seed: i, n: 3 })).join(''), `</g>`,
            xbrRings(p, 100, 100, 120, { n: 16 }),
        ].join('');
    },

    // ヴァージェン・ヘフォガーダ: 藍の縁の白い皿に、斜め切りのいんげんとにんじんの細切りの炒めもの、にんにく
    br_vagem_refogada: p => {
        const sp = xbrSpots('vg', 58, 64, 10.5);
        return [
            K.plate(p, { rim: '#2c4c7c' }),
            xbrBlob(p, 100, 100, 140, 136, '#e8d890', { seed: 1, op: .45 }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => i % 4 === 3 ? `<g ${T(x, y, r)}><rect x="-12" y="-2.4" width="24" height="4.8" rx="1.8" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b8501a" stroke-width=".5"/></g>` : `<g ${T(x, y, r)}><path d="M-15,-1 L-12,-3 L12,-3 L15,-1 L15,1 L12,3 L-12,3 L-15,1Z" fill="${p.g(i % 2 ? '#4f9a34' : '#5fa83e', .3, .28)}" stroke="#2f6a22" stroke-width=".5"/><path d="M-11,-1.4 L10,-1.4" stroke="#a6d47a" stroke-width=".9" opacity=".8"/></g>`).join(''),
            `</g>`,
            xbrGarlicChips(p, 100, 100, 110, { n: 10 }),
            xbrOil(p, 100, 100, 120, { n: 8, c: '#f3d46a', op: .5, rmax: 1.6 }),
        ].join('');
    },

    // コウヴィ・フロール・グラチナーダ: 茶色の縁の楕円の焼き皿に、カリフラワーとホワイトソース、焼き色のついたチーズ
    br_couve_flor_gratinada: p => {
        const sp = xbrSpots('cf', 12, 54, 24, 100, 100, .8);
        return [
            K.ovalDish(p, { rx: 96, ry: 82, base: '#f4efe4', rim: '#8a4a2c', deep: true }),
            `<ellipse cx="100" cy="100" rx="80" ry="66" fill="${p.rg('#f8f0d8', .2, .2)}"/>`, xbrCheese(p, 100, 100, 150, 120, { seed: 9, n: 8, jit: .1, browned: .8, c: '#f6eccc' }),
            `<g ${p.sh(.8)}>`, sp.map(([x, y, r], i) => xbrStamp(p, 'cauli' + (i % 2), () => xbrCauli(p, i % 2, 0, 32), x, y, r)).join(''), `</g>`,
            `<g ${p.sh(.4)}>`, sp.map(([x, y], i) => xbrCheese(p, x + 2, y - 1, 22, 17, { seed: i + 3, n: 2, jit: .4, browned: 1, c: '#f2d06e' })).join(''), `</g>`,
            xbrHerbs(p, 100, 100, 120, { n: 18 }),
        ].join('');
    },
});

// クルトン
function xbrCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${f1(-s / 2)}" y="${f1(-s / 2)}" width="${s}" height="${s}" rx="${f1(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f1(-s / 2 + s * .18)}" y="${f1(-s / 2 + s * .18)}" width="${f1(s * .5)}" height="${f1(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
// アルファベットのパスタ（線で描いた文字）
const XBR_LETTERS = { A: 'M-2.6,3.4L0,-3.4L2.6,3.4M-1.5,.8H1.5', B: 'M-2,3.4V-3.4H.6Q2.6,-3.4 2.6,-1.7Q2.6,0 .4,0H-2M.4,0Q2.8,0 2.8,1.7Q2.8,3.4 .6,3.4H-2', C: 'M2.6,-2.2Q1.6,-3.4 0,-3.4Q-2.8,-3.4 -2.8,0Q-2.8,3.4 0,3.4Q1.6,3.4 2.6,2.2', O: 'M0,-3.4Q2.8,-3.4 2.8,0Q2.8,3.4 0,3.4Q-2.8,3.4 -2.8,0Q-2.8,-3.4 0,-3.4Z', E: 'M2.4,-3.4H-2.2V3.4H2.4M-2.2,0H1.6', S: 'M2.4,-2.6Q1.4,-3.4 0,-3.4Q-2.4,-3.4 -2.4,-1.6Q-2.4,0 0,0Q2.6,0 2.6,1.8Q2.6,3.4 0,3.4Q-1.6,3.4 -2.6,2.4', M: 'M-3,3.4V-3.4L0,1L3,-3.4V3.4', L: 'M-2,-3.4V3.4H2.4', T: 'M-2.8,-3.4H2.8M0,-3.4V3.4', U: 'M-2.6,-3.4V1.2Q-2.6,3.4 0,3.4Q2.6,3.4 2.6,1.2V-3.4', R: 'M-2.2,3.4V-3.4H.6Q2.6,-3.4 2.6,-1.6Q2.6,0 .4,0H-2.2M.4,0L2.6,3.4', I: 'M0,-3.4V3.4M-1.6,-3.4H1.6M-1.6,3.4H1.6' };
function xbrLetters(p, x, y, s, { n = 20, seed = 1, k = 1.3 } = {}){
    const R = rng(p.id + 'xbrLt' + seed + x), keys = Object.keys(XBR_LETTERS);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd; d += `<path ${T(cx, cy, (R() - .5) * 120, k)} d="${XBR_LETTERS[keys[Math.floor(R() * keys.length)]]}"/>`; }
    return `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#b8803a" stroke-width="2.6" opacity=".8">${d}</g><g stroke="#f6dc98" stroke-width="1.5">${d}</g></g>`;
}
// カペレッチ（帽子の形の詰めものパスタ）
function xbrCapeletti(p, x, y, s, r = 0, { c = '#f0d494' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-9,2 C-10,-6 -3,-9 2,-8 C8,-7 10,-1 8,4 C6,8 -1,9 -5,7 L-9,9 Z" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <circle cx="0" cy="0" r="4.2" fill="${p.g(lt(c, .1), .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/><path d="M-6,-4 Q-2,-7 3,-6.4" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 押し麦（白い粒にまん中の線）
function xbrBarley(p, x, y, s, { n = 60, seed = 1 } = {}){
    const R = rng(p.id + 'xbrBy' + seed + x);
    let d = '', l = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, b = R() * 3.14, dx = Math.cos(b) * 1.6, dy = Math.sin(b) * 1.6; d += `M${f1(cx - dx)},${f1(cy - dy)}l${f1(dx * 2)},${f1(dy * 2)}`; l += `M${f1(cx - dx * .6)},${f1(cy - dy * .6)}l${f1(dx * 1.2)},${f1(dy * 1.2)}`; }
    return `<g ${xbrOutline(p, '#b89a6a', .5)}><path d="${d}" stroke="#f6eedc" stroke-width="3.6" stroke-linecap="round"/></g><path d="${l}" stroke="#c9ad80" stroke-width=".6"/>`;
}
// 汁の上の具にかかる薄い膜（沈んで見える）
const xbrVeil = (R, c, op, cx = 100, cy = 100) => `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${c}" opacity="${op}"/>`;

// ---------- スープ ----------
Object.assign(D, {
    // ソッパ・ジ・フェイジャン: 茶色の縁の深皿に、とろりとした豆のスープ、小さな貝殻パスタ、ベーコン、じゃがいも、cheiro-verde
    br_sopa_feijao: p => {
        const sp = xbrSpots('sf', 22, 58, 13);
        return [
            xbrDeep(p, { rim: '#7a4a2a', well: .76 }),
            xbrCream(p, { R: 72, c: '#7a4a2e', seed: 1, rings: 4 }),
            xbrGrains(p, 100, 100, 136, { cols: ['#5e3620', '#9a6644'], n: 50, size: 1.4, seed: 1 }),
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r], i) => i % 6 === 2 ? xbrDice(p, x, y, 13, r, '#ecc46a') : i % 6 === 5 ? xbrBacon(p, x, y, 11, r) : K.macaroni(p, x, y, 13, r, { c: '#f2d898' })).join(''), `</g>`,
            xbrRings(p, 100, 100, 120, { n: 16 }),
            xbrHerbs(p, 100, 100, 120, { n: 22 }),
            xbrShine(100, 100, 72, .4),
        ].join('');
    },

    // ソッパ・ジ・レグミス・コン・カルニ: 緑釉の器に、具だくさんの野菜スープ、牛肉、じゃがいも・にんじん・シュシュ・ズッキーニ
    br_sopa_legumes: p => {
        const sp = xbrSpots('sl', 20, 58, 16);
        return [
            K.bowl(p, { glaze: '#2f7a52', inside: '#efe8d8' }),
            K.liquid(p, { R: 76, c: '#c27a3a', op: 1 }),
            `<g ${p.sh(.6)}>`,
            sp.map(([x, y, r], i) => { const k = i % 5; return k === 0 ? xbrBeef(p, x, y, 19, r, { seed: i, c: '#8a4a26' }) : k === 1 ? xbrDice(p, x, y, 13, r, '#ec7d30') : k === 2 ? xbrDice(p, x, y, 14, r, '#ecc870') : k === 3 ? xbrDice(p, x, y, 13, r, '#cfe09a') : xbrZuke(p, x, y, 18, r); }).join(''),
            `</g>`,
            xbrVeil(76, '#c27a3a', .15),
            xbrHerbs(p, 100, 100, 124, { n: 26 }),
            xbrShine(100, 100, 76, .4),
        ].join('');
    },

    // カウド・ジ・マンジョッカ: 茶色のカップに、白っぽいキャッサバのクリームスープ、まん中に炒めたひき肉、cheiro-verde
    br_caldo_mandioca: p => [
        xbrMug(p, { c: '#8a5a3c' }),
        xbrCream(p, { R: 66, c: '#ecdcae', cx: 94, seed: 1, rings: 5 }),
        `<g ${p.sh(.7)}><path ${T(94, 100)} d="${xbrSm(ring(34, 11, .3, rng(p.id + 'mn'), 1, 1))}" fill="#8a4a28"/></g>`,
        xbrMince(p, 94, 100, 70, { n: 150, size: 2.6 }),
        xbrGrains(p, 94, 100, 50, { cols: ['#e0482e', '#4f9a34'], n: 10, size: 1.8, seed: 2 }),
        xbrRings(p, 94, 100, 110, { n: 16 }),
        xbrHerbs(p, 94, 100, 110, { n: 18 }),
        xbrShine(94, 100, 66, .4),
    ].join(''),

    // ソッパ・ジ・エルヴィーリャ: 藍の縁の深皿に、とろりとした緑の干しえんどう豆のスープ、カラブレーザ、クルトン、黒こしょう
    br_sopa_ervilha: p => [
        xbrDeep(p, { rim: '#2c4c7c', well: .76 }),
        xbrCream(p, { R: 72, c: '#a3a246', seed: 1, rings: 5 }),
        `<g ${p.sh(.6)}>`,
        xbrCalabresa(p, 80, 80, 24, 0, { seed: 1 }), xbrCalabresa(p, 122, 76, 23, 0, { seed: 2 }), xbrCalabresa(p, 128, 120, 24, 0, { seed: 3 }), xbrCalabresa(p, 78, 124, 23, 0, { seed: 4 }), xbrCalabresa(p, 102, 102, 22, 0, { seed: 5 }), xbrCalabresa(p, 146, 96, 20, 0, { seed: 6 }),
        `</g>`,
        [[100, 66, 10], [56, 100, -20], [104, 138, 40], [62, 62, 0], [138, 144, 20], [146, 64, 30], [58, 140, 10], [126, 100, 50], [86, 104, -10]].map(([x, y, r]) => xbrCrouton(p, x, y, 15, r)).join(''),
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 30, r: .6 }),
        xbrShine(100, 100, 72, .4),
    ].join(''),

    // ソッパ・ジ・レンチーリャ: 素焼きの器に、茶色いレンズ豆のスープ、カラブレーザ、にんじん、細切りのcouve
    br_sopa_lentilha: p => {
        const sp = xbrSpots('le', 90, 66, 7);
        return [
            K.bowl(p, { glaze: '#a85a32', inside: '#efe2c8' }),
            K.liquid(p, { R: 76, c: '#6e4a2c', op: 1 }),
            `<g ${p.sh(.3)}>`, sp.map(([x, y, r]) => xbrBean(p, 'lentil', x, y, 10, r)).join(''), `</g>`,
            xbrVeil(76, '#6e4a2c', .15),
            `<g ${p.sh(.6)}>`, xbrCalabresa(p, 80, 86, 18, 0, { seed: 1 }), xbrCalabresa(p, 122, 76, 17, 0, { seed: 2 }), xbrCalabresa(p, 118, 124, 18, 0, { seed: 3 }), xbrCalabresa(p, 76, 126, 16, 0, { seed: 4 }),
            xbrSpots('le2', 8, 58, 18).map(([x, y, r]) => xbrDice(p, x, y, 11, r, '#ec7d30')).join(''), `</g>`,
            xbrCouve(p, 100, 100, 120, { n: 36, seed: 2, w: 2 }),
            xbrShine(100, 100, 76, .4),
        ].join('');
    },

    // カウド・ジ・アボボラ・コン・カルニ・セッカ: 藍の器に、オレンジ色のかぼちゃのクリームスープ、まん中にほぐした干し肉、cheiro-verde
    br_caldo_abobora: p => [
        K.bowl(p, { glaze: '#3a5a7a', inside: '#f2ece0' }),
        xbrCream(p, { R: 76, c: '#e88e2c', seed: 1, rings: 5 }),
        xbrShred(p, 100, 98, 60, { seed: 1, n: 26, cols: ['#a4502e', '#c0683e', '#8a3c22'], ol: '#5e2414', w: 2.6 }),
        xbrRings(p, 100, 100, 130, { n: 18 }),
        xbrHerbs(p, 100, 100, 124, { n: 16 }),
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 14, r: .6 }),
        xbrShine(100, 100, 76, .4),
    ].join(''),

    // カンジキーニャ・コン・コステリーニャ: 黒い鍋に、ひき割りとうもろこしの黄色いおかゆ、豚のスペアリブ、couve、トマト
    br_canjiquinha: p => [
        xbrPot(p, { c: '#4a3f3a', inside: '#2e2724' }),
        `<g ${p.crumb(.5)}><circle cx="100" cy="100" r="72" fill="${p.rg('#e6bf4c', .25, .2)}"/></g>`,
        xbrGrains(p, 100, 100, 140, { cols: ['#f2d36a', '#d9a630', '#f8e6a0'], n: 220, size: 1.3, seed: 1 }),
        `<g ${p.sh(1)}>`, xbrRib(p, 76, 80, 44, -30, { seed: 1, c: '#b06a34' }), xbrRib(p, 128, 86, 44, 20, { seed: 2, c: '#b8723a' }), xbrRib(p, 100, 128, 46, 170, { seed: 3, c: '#b06a34' }), `</g>`,
        xbrCouve(p, 100, 100, 124, { n: 34, seed: 2, w: 2 }),
        xbrGrains(p, 100, 100, 120, { cols: ['#e0482e'], n: 12, size: 2.2, seed: 3 }),
        xbrRings(p, 100, 100, 120, { n: 14 }),
        xbrShine(100, 100, 72, .35),
    ].join(''),

    // ソッパ・ジ・レトリーニャ: 赤い器に、澄んだオレンジ色のスープ、アルファベットのパスタ、にんじん・じゃがいも・シュシュ
    br_sopa_letrinhas: p => {
        const sp = xbrSpots('lt', 14, 58, 17);
        return [
            K.bowl(p, { glaze: '#d9442f', inside: '#fbf7ef' }),
            K.liquid(p, { R: 76, c: '#e2924a', op: .95 }),
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r], i) => xbrDice(p, x, y, 12, r, ['#ec7d30', '#efd080', '#cfe09a'][i % 3])).join(''), `</g>`,
            xbrLetters(p, 100, 100, 136, { n: 40, seed: 1, k: 1.5 }),
            xbrHerbs(p, 100, 100, 120, { n: 16 }),
            xbrShine(100, 100, 76, .45),
        ].join('');
    },

    // カウド・ジ・ペイシ: 黒い土鍋に、トマトで赤い魚のスープ、白身魚、トマト、ピーマン・玉ねぎの輪、香菜、ライム
    br_caldo_peixe: p => [
        xbrPot(p, { c: '#3f3631', inside: '#241c19' }),
        K.liquid(p, { R: 72, c: '#d2652e', op: 1 }),
        xbrOil(p, 100, 100, 130, { n: 14, c: '#f08a22', op: .7, rmax: 2.4 }),
        `<g ${p.sh(.9)}>`,
        xbrCod(p, 78, 84, 40, -10, { seed: 1 }), xbrCod(p, 124, 90, 40, 20, { seed: 2 }), xbrCod(p, 98, 128, 40, -30, { seed: 3 }),
        K.tomatoWedge(p, 104, 66, 22, 10), K.tomatoWedge(p, 60, 116, 20, 80), K.tomatoWedge(p, 140, 124, 20, -40),
        `</g><g ${p.sh(.4)}>`,
        xbrPepRing(p, 140, 70, 18, 30, { c: '#3f8f2f' }), xbrPepRing(p, 72, 142, 16, 0, { c: '#d8352a' }), xbrOnionRing(p, 100, 100, 18, 0, { c: '#f1dca8' }), xbrOnionRing(p, 62, 74, 16, 20, { c: '#f1dca8' }),
        `</g>`,
        xbrLeaf(p, 92, 98, 14, 20), xbrLeaf(p, 114, 112, 13, -40), xbrLeaf(p, 146, 100, 12, 80), xbrLeaf(p, 80, 144, 12, 30), xbrLeaf(p, 120, 58, 12, 120),
        xbrShine(100, 100, 72, .35),
    ].join(''),

    // カウジーニョ・ジ・カマラォン: 茶色のカップに、ココナッツミルクのとろりとしたえびのスープ、えび、香菜
    br_caldo_camarao: p => [
        xbrMug(p, { c: '#6b4a34' }),
        xbrCream(p, { R: 66, c: '#f0b47a', cx: 94, seed: 1, rings: 5 }),
        `<g ${p.sh(.8)}>`, [[78, 84, 20], [110, 80, -40], [114, 116, 100], [80, 118, 160], [96, 100, 60]].map(([x, y, r]) => K.shrimp(p, x, y, 28, r, { c: '#f0743e' })).join(''), `</g>`,
        xbrGrains(p, 94, 100, 110, { cols: ['#d8352a'], n: 8, size: 2, seed: 2 }),
        xbrLeaf(p, 94, 70, 13, 20), xbrLeaf(p, 128, 100, 12, 80), xbrLeaf(p, 64, 104, 12, -40),
        xbrHerbs(p, 94, 100, 110, { n: 14, cols: ['#3f8a2c'] }),
        xbrShine(94, 100, 66, .4),
    ].join(''),

    // ソッパ・クレミ・ジ・ミーリョ・ヴェルジ: 緑の縁の深皿に、黄色いコーンのクリームスープ、コーン粒、粉チーズとcheiro-verde
    br_creme_milho: p => [
        xbrDeep(p, { rim: '#2f7a52', well: .76 }),
        xbrCream(p, { R: 72, c: '#f2cc58', seed: 1, rings: 5 }),
        `<g ${p.sh(.4)}>`, xbrSpots('cm', 46, 34, 7).map(([x, y, r]) => xbrCube(p, x, y, 6.4, r, '#f6c62e')).join(''), xbrSpots('cm2', 22, 64, 14).map(([x, y, r]) => xbrCube(p, x, y, 6, r, '#f6c62e')).join(''), `</g>`,
        xbrGrains(p, 100, 100, 100, { cols: ['#fbf3d6', '#f2e2b0'], n: 40, size: .9, seed: 4 }),
        xbrHerbs(p, 100, 100, 120, { n: 22 }),
        xbrShine(100, 100, 72, .4),
    ].join(''),

    // ソッパ・ジ・フバー: 赤い縁の深皿に、とうもろこし粉の黄色いとろみスープ、かき卵、細切りのcouve、カラブレーザ
    br_sopa_fuba: p => [
        xbrDeep(p, { rim: '#c4482f', well: .76 }),
        xbrCream(p, { R: 72, c: '#e6c25a', seed: 1, rings: 4 }),
        K.eggRibbons(p, 100, 100, 110, { n: 12 }),
        `<g opacity=".9">${K.eggRibbons(p, 96, 104, 100, { n: 8, seed: 3 }).replace(/#f6d35a/g, '#fbf0c8')}</g>`,
        xbrCouve(p, 100, 100, 126, { n: 50, seed: 2, w: 2 }),
        `<g ${p.sh(.6)}>`, xbrCalabresa(p, 80, 82, 18, 0, { seed: 1 }), xbrCalabresa(p, 124, 90, 18, 0, { seed: 2 }), xbrCalabresa(p, 104, 128, 18, 0, { seed: 3 }), xbrCalabresa(p, 70, 120, 16, 0, { seed: 4 }), `</g>`,
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 14, r: .6 }),
        xbrShine(100, 100, 72, .4),
    ].join(''),

    // ソッパ・ジ・セヴァジーニャ: 茶色の器に、押し麦と牛肉のスープ、にんじん・じゃがいも、cheiro-verde
    br_sopa_cevadinha: p => {
        const sp = xbrSpots('cv', 12, 56, 20);
        return [
            K.bowl(p, { glaze: '#6e4b33', inside: '#efe5d3' }),
            K.liquid(p, { R: 76, c: '#b5783e', op: 1 }),
            xbrBarley(p, 100, 100, 144, { n: 120 }),
            `<g ${p.sh(.6)}>`, sp.map(([x, y, r], i) => i % 3 === 0 ? xbrBeef(p, x, y, 20, r, { seed: i, c: '#8a4a26' }) : i % 3 === 1 ? xbrDice(p, x, y, 13, r, '#ec7d30') : xbrDice(p, x, y, 14, r, '#ecc870')).join(''), `</g>`,
            xbrVeil(76, '#b5783e', .12),
            xbrHerbs(p, 100, 100, 124, { n: 22 }),
            xbrShine(100, 100, 76, .4),
        ].join('');
    },

    // ソッパ・ジ・カペレッチ: 藍の帯の深皿に、澄んだ金色の鶏のスープ、カペレッチ、ほぐした鶏、にんじん、粉チーズ
    br_sopa_capeletti: p => {
        const sp = xbrSpots('cp', 11, 52, 23);
        return [
            xbrDeep(p, { rim: '#2c4c7c', band: true, well: .74 }),
            K.liquid(p, { R: 70, c: '#e3b052', op: .95 }),
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r]) => xbrCapeletti(p, x, y, 26, r)).join(''), `</g>`,
            xbrShred(p, 84, 112, 22, { seed: 1, n: 7 }), xbrShred(p, 120, 84, 22, { seed: 2, n: 7 }),
            [[70, 86], [132, 116], [104, 70], [92, 136]].map(([x, y]) => xbrCarrotRound(p, x, y, 12)).join(''),
            xbrOil(p, 100, 100, 120, { n: 12, c: '#f3c45a', op: .6, rmax: 2.2 }),
            xbrGrains(p, 100, 100, 100, { cols: ['#fbf3d6', '#f2e2b0'], n: 30, size: .9, seed: 4 }),
            xbrHerbs(p, 100, 100, 120, { n: 20 }),
            xbrShine(100, 100, 70, .45),
        ].join('');
    },

    // カウド・ジ・イニャーミ: 石色の器に、白っぽいイニャーミのクリームスープ、カリカリのベーコン、ポロねぎ
    br_caldo_inhame: p => [
        K.bowl(p, { glaze: '#7a6a5a', inside: '#efe8dc' }),
        xbrCream(p, { R: 76, c: '#e4dac4', seed: 1, rings: 5 }),
        `<g ${p.sh(.7)}>`, xbrSpots('ih', 16, 40, 13).map(([x, y, r]) => xbrBacon(p, x, y, 12, r, { c: '#b0502a' })).join(''), `</g>`,
        [[70, 74, 20], [134, 80, -30], [66, 124, 50], [132, 128, 10], [100, 146, -20], [100, 56, 30], [146, 104, 70], [52, 100, -60], [88, 132, 10], [118, 64, -40]].map(([x, y, r]) => `<g ${T(x, y, r)}><ellipse rx="9" ry="6" fill="${p.g('#d8e8b0', .2, .15)}" stroke="#8aa85a" stroke-width=".7"/><ellipse rx="6" ry="3.6" fill="none" stroke="#b8d08a" stroke-width=".8"/></g>`).join(''),
        xbrHerbs(p, 100, 100, 120, { n: 20 }),
        xbrShine(100, 100, 76, .4),
    ].join(''),

    // クレミ・ジ・ブロコリス: 白い器に、緑のブロッコリーのクリームスープ、生クリームのうず、小房、チーズ
    br_creme_brocolis: p => [
        K.bowl(p, { glaze: '#f3efe7', inside: '#fbf9f4' }),
        `<circle cx="100" cy="100" r="86" fill="none" stroke="#2f7a52" stroke-width="1.6" opacity=".8"/>`,
        xbrCream(p, { R: 76, c: '#7fa64a', seed: 1, rings: 5 }),
        xbrSwirl(92, 96, 56, '#f6f3e6', { r: 20 }),
        `<g ${p.sh(.6)}>`, K.broccoli(p, 130, 122, 22, 10, { c: '#3a8030' }), K.broccoli(p, 72, 128, 20, -20, { c: '#3a8030' }), K.broccoli(p, 128, 72, 18, 30, { c: '#3a8030' }), `</g>`,
        xbrGrains(p, 104, 100, 90, { cols: ['#fbefc0', '#f2d88a'], n: 40, size: 1, seed: 4 }),
        xbrShine(100, 100, 76, .4),
    ].join(''),

    // ソッパ・ジ・セボーラ: 茶色の取っ手つきの器に、飴色の玉ねぎのスープ、上にチーズをのせて焼いたパン
    br_sopa_cebola: p => [
        xbrPot(p, { c: '#8b4a2b', inside: '#5e3018', R: 82, rimC: '#c47a4c' }),
        K.liquid(p, { R: 71, c: '#9a5a26', op: 1 }),
        [[52, 86, 40], [60, 136, -20], [146, 76, 60], [142, 128, 10], [100, 158, 0], [100, 42, 90]].map(([x, y, r]) => xbrSliver(p, x, y, 20, r, { c: '#c98a40', w: 2.8 })).join(''),
        `<g ${p.sh(1.2)}><g ${p.crumb(.6)}><rect x="54" y="56" width="92" height="88" rx="22" fill="${p.g('#d9a050', .3, .3)}"/></g></g>`,
        `<g ${p.crumb(.35)}>`, xbrCheese(p, 100, 100, 100, 96, { seed: 1, n: 26, jit: .2, browned: 1, c: '#eabc58' }), `</g>`,
        xbrShine(100, 100, 71, .35),
    ].join(''),

    // ソッパ・ジ・グラォン・ジ・ビッコ: 緑釉の器に、ひよこ豆とリングイッサのスープ、じゃがいも、cheiro-verde
    br_sopa_grao_bico: p => {
        const sp = xbrSpots('gb', 46, 64, 11);
        return [
            K.bowl(p, { glaze: '#5f8a74', inside: '#eef0e6' }),
            K.liquid(p, { R: 76, c: '#c3843e', op: 1 }),
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r]) => xbrBean(p, 'chick', x, y, 12, r)).join(''), `</g>`,
            `<g ${p.sh(.6)}>`, xbrCalabresa(p, 82, 84, 19, 0, { seed: 1 }), xbrCalabresa(p, 124, 80, 18, 0, { seed: 2 }), xbrCalabresa(p, 116, 126, 19, 0, { seed: 3 }), xbrCalabresa(p, 74, 124, 17, 0, { seed: 4 }),
            xbrDice(p, 100, 104, 14, 20, '#ecc870'), xbrDice(p, 140, 104, 13, -10, '#ecc870'), xbrDice(p, 98, 62, 13, 30, '#ecc870'), `</g>`,
            xbrHerbs(p, 100, 100, 124, { n: 24 }),
            xbrShine(100, 100, 76, .4),
        ].join('');
    },

    // クレミ・ジ・セノウラ: 青い器に、鮮やかなオレンジのにんじんのクリームスープ、生クリームのうず、cheiro-verde
    br_creme_cenoura: p => [
        K.bowl(p, { glaze: '#4f7fa8', inside: '#f2f4f2' }),
        xbrCream(p, { R: 76, c: '#ec7a2e', seed: 1, rings: 5 }),
        xbrSwirl(96, 98, 60, '#fff3e6', { r: 160 }),
        xbrHerbs(p, 100, 100, 110, { n: 26 }),
        `<g ${p.sh(.5)}>`, xbrLeaf(p, 128, 116, 16, 30), `</g>`,
        xbrShine(100, 100, 76, .4),
    ].join(''),
});
