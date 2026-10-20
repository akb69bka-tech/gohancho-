// ブラジルの家庭料理（World edition: br pack）
import * as K from '../kit.mjs';

const { T, f, rng, ring, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// このファイル専用の部品（wb = world brazil）
// =========================================================

// 1桁小数のなめらかな線
function wbSm(pts, closed = true){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
// まとめて描いた粒・線のまわりに細い輪郭
function wbOutline(p, c, r = .55){
    const id = p.def('wbOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// ご飯（e_rice_noodle の erRice と同じ描き方）
function wbRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'wbRice' + seed + x + y);
    const shape = wbSm(ring(s / 2, 14, .07, R, 1, sy));
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
    const shade = p.def('wbRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
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
function wbGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'wbGr' + seed + x + y);
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
function wbSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('wbspots' + seed), out = [];
    for (let t = 0; t < 8000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// さいの目
function wbDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 小さな角切り（軽い版: 1つの四角）
function wbCube(p, x, y, s, r = 0, c = '#e03a2a', { op = 1 } = {}){
    return `<rect ${T(x, y, r)} x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${f(s * .9)}" rx="${f(s * .24)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .3)}" stroke-width=".5" opacity="${op}"/>`;
}
// 刻んだ香草（cheiro-verde）
function wbHerbs(p, x, y, s, { n = 16, seed = 1, cols = ['#3f8a2c', '#5aa63c'], sy = 1 } = {}){
    const R = rng(p.id + 'wbHb' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 1 + R();
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R(), r2 = rr * (.6 + R() * .6); return `${f1(cx + Math.cos(aa) * r2)},${f1(cy + Math.sin(aa) * r2)}`; });
        ds[i % cols.length] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// 小口切りのねぎ（輪）
function wbRings(p, x, y, s, { n = 10, seed = 1, c = '#5fa03a' } = {}){
    const R = rng(p.id + 'wbRg' + seed + x + y);
    let d = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd; const seg = `M${f1(cx - 1.9)},${f1(cy)}a1.9,1.7 0 1 0 3.8,0a1.9,1.7 0 1 0 -3.8,0`; if (R() < .6) d += seg; else d2 += seg; }
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.2"/><path d="${d2}" fill="none" stroke="${lt(c, .35)}" stroke-width="1.2"/>`;
}
// 汁のつや
const wbShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 皿の上のソース（点で形を指定）
function wbSauce(p, pts, c, { op = 1, l = .2, d = .28 } = {}){
    return `<path d="${wbSm(pts)}" fill="${p.rg(c, l, d, .42, .4)}" opacity="${op}"/>`;
}
// 油の粒
function wbOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'wbOil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 細い棒の山（batata palha）: 楕円 w×h の中に、層ごとに輪郭をつけて重ねる
function wbSticks(p, x, y, w, h, { n = 60, c = '#f0c050', len = 12, sw = 1.8, seed = 1, layers = 3 } = {}){
    const R = rng(p.id + 'wbSt' + seed + x + y);
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
    const ol = wbOutline(p, dk(c, .42), .45);
    return `<g ${p.sh(.7)}>${L.map(([a, b, d]) => `<g ${ol} fill="none" stroke-linecap="round" stroke-width="${sw}"><path d="${d}" stroke="${dk(c, .14)}"/><path d="${b}" stroke="${c}"/><path d="${a}" stroke="${lt(c, .3)}"/></g>`).join('')}</g><path d="${hi}" stroke="#fffbe6" stroke-width="${f1(sw * .35)}" opacity=".8" fill="none" stroke-linecap="round"/>`;
}
// 香菜（コリアンダー）・パセリの葉: 丸い切れ込みの3裂の葉
function wbLeaf(p, x, y, s, r = 0, { c = '#3f8a2c' } = {}){
    const d = 'M0,8 C-1,5 -2,3 -3,2 C-7,4 -10,1 -8,-2 C-10,-5 -6,-8 -3,-6 C-3,-10 3,-10 3,-6 C6,-8 10,-5 8,-2 C10,1 7,4 3,2 C2,3 1,5 0,8Z';
    return `<g ${T(x, y, r, s / 20)}><path d="${d}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/><path d="M0,7 L0,-6 M0,0 L-6,-3 M0,0 L6,-3" stroke="${lt(c, .4)}" stroke-width=".6" fill="none"/></g>`;
}
// 玉ねぎの輪切り（raw は白い生、それ以外は炒めて飴色に透けた輪）
function wbOnionRing(p, x, y, s, r = 0, { c = '#e9c27a', raw = false, sy = .82 } = {}){
    const col = raw ? '#f6f2e6' : c, e = raw ? '#cfc5a6' : dk(c, .25);
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="${e}" stroke-width="${f(s * .16 + 1)}" opacity=".85"/><ellipse rx="${f(s / 2)}" ry="${f(s / 2 * sy)}" fill="none" stroke="${col}" stroke-width="${f(s * .16)}" opacity="${raw ? 1 : .9}"/>
        <path d="M${f(-s * .44)},${f(-s * .12)} Q${f(-s * .34)},${f(-s * .38)} ${f(-s * .08)},${f(-s * .42)}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// トマトの輪切り（種の部屋が見える）
function wbTomatoSlice(p, x, y, s, r = 0, { cooked = false } = {}){
    const c = cooked ? '#d9472c' : '#e33a2a';
    const rooms = [0, 1, 2, 3, 4].map(i => { const a = i / 5 * 6.28 + .3; return `<path ${T(Math.cos(a) * s * .24, Math.sin(a) * s * .24, a * 57.3 + 90)} d="M${f(-s * .1)},0 Q0,${f(-s * .16)} ${f(s * .1)},0 Q0,${f(s * .1)} ${f(-s * .1)},0Z" fill="#f6b34a" opacity=".9"/>`; }).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><circle r="${s / 2}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <circle r="${f(s / 2 - 2)}" fill="#f2604a"/>${rooms}<circle r="${f(s * .1)}" fill="#f7a189"/>
        <path d="M${f(-s * .3)},${f(-s * .26)} Q${f(-s * .1)},${f(-s * .42)} ${f(s * .14)},${f(-s * .38)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// ピーマンの輪切り
function wbPepRing(p, x, y, s, r = 0, { c = '#3f8f2f' } = {}){
    const d = wbSm(ring(s / 2, 8, .15, rng(p.id + 'wbpr' + x + y), 1, .8));
    return `<g ${T(x, y, r)}><path d="${d}" fill="none" stroke="${dk(c, .25)}" stroke-width="${f(s * .16 + 1)}"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${f(s * .16)}"/>
        <path d="M${f(-s * .38)},${f(-s * .18)} Q${f(-s * .2)},${f(-s * .4)} ${f(s * .05)},${f(-s * .4)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// レタス（ふちが波打つ葉）
function wbLettuce(p, x, y, s, r = 0, { seed = 1, c = '#a6d468' } = {}){
    const R = rng(p.id + 'wblt' + seed);
    const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.28, rr = (i % 2 ? .9 : 1.04) * (1 - R() * .08); return [Math.cos(a) * rr * s / 2, Math.sin(a) * rr * s * .36]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${K.smooth(pts, true, .8)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".6"/></g>
        <path d="M${f(-s * .46)},2 Q0,${f(-s * .04)} ${f(s * .44)},0" stroke="#eef8d8" stroke-width="${f(s * .06)}" fill="none" stroke-linecap="round"/>
        ${[-.3, -.1, .1, .28].map((t, i) => `<path d="M${f(s * t)},${f(-s * .01)} q${f(s * .08)},${f(i % 2 ? s * .2 : -s * .2)} ${f(s * .16)},${f(i % 2 ? s * .24 : -s * .24)}" stroke="#e6f4c8" stroke-width="1" fill="none" opacity=".8"/>`).join('')}</g>`;
}

// ---------- ブラジルの器 ----------
// ドゥラレックス風の琥珀色のガラス皿（ブラジルの家庭の定番）
function wbAmberPlate(p, { R = 94 } = {}){
    const c = '#c98838';
    const ribs = Array.from({ length: 36 }, (_, i) => { const a = i / 36 * 6.28; return `M${f1(100 + Math.cos(a) * R * .8)},${f1(100 + Math.sin(a) * R * .8)}L${f1(100 + Math.cos(a) * (R - 3))},${f1(100 + Math.sin(a) * (R - 3))}`; }).join('');
    return `<g ${p.sh(1.4)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .35, .25, .38, .32)}" opacity=".96"/></g>
        <path d="${ribs}" stroke="${lt(c, .35)}" stroke-width="2.2" opacity=".45"/>
        <circle cx="100" cy="100" r="${R * .78}" fill="none" stroke="${dk(c, .2)}" stroke-width="2" opacity=".5"/>
        <circle cx="100" cy="100" r="${R * .76}" fill="${p.rg(lt(c, .12), .2, .15, .6, .62)}"/>
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .86},${R * .86} 0 0 1 ${100 - R * .2},${100 - R * .8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M${100 + R * .5},${100 + R * .45} A${R * .7},${R * .7} 0 0 1 ${100 + R * .1},${100 + R * .66}" stroke="#ffe7c2" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`;
}
// 取っ手つきの鍋（土鍋 panela de barro・アルミ鍋）: 左右に耳
function wbPot(p, { R = 84, c = '#3a302c', inside = '#2a221e', rimC = null } = {}){
    const rc = rimC || lt(c, .25);
    return `<g ${p.sh(1.6)}><rect x="${100 - R - 13}" y="89" width="${2 * R + 26}" height="22" rx="9" fill="${p.g(c, .25, .3)}"/></g>
        <g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .25, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="${rc}" stroke-width="1.6" opacity=".7"/>
        <circle cx="100" cy="100" r="${R * .88}" fill="${p.rg(inside, .12, .25, .62, .64)}"/>
        <path d="M${100 - R * .72},${100 - R * .38} A${R * .84},${R * .84} 0 0 1 ${100 - R * .25},${100 - R * .8}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".4"/>`;
}
// 透明のガラスボウル
function wbGlass(p, { R = 90 } = {}){
    return `<g ${p.sh(1.2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#e4eeec', .3, .12, .38, .32)}" opacity=".95"/></g>
        <circle cx="100" cy="100" r="${R - 1}" fill="none" stroke="#b7cac7" stroke-width="1.4"/>
        <circle cx="100" cy="100" r="${R * .86}" fill="${p.rg('#f2f7f6', .2, .1, .6, .6)}" stroke="#c6d6d3" stroke-width="1.6"/>
        <path d="M${100 - R * .76},${100 - R * .36} A${R * .86},${R * .86} 0 0 1 ${100 - R * .3},${100 - R * .8}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M${100 + R * .62},${100 + R * .5} A${R * .82},${R * .82} 0 0 1 ${100 + R * .2},${100 + R * .78}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// 耐熱ガラスの角皿（refratário）
function wbPyrex(p, { w = 176, h = 136 } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.3)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${p.rg('#e2ecea', .3, .14, .38, .32)}" opacity=".96"/></g>
        <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="23" fill="none" stroke="#b5c8c4" stroke-width="1.4"/>
        <rect x="${x + 11}" y="${y + 11}" width="${w - 22}" height="${h - 22}" rx="16" fill="${p.rg('#f1f6f5', .2, .1, .6, .6)}" stroke="#c4d5d2" stroke-width="1.6"/>
        <path d="M${x + 8},${y + 40} Q${x + 8},${y + 8} ${x + 40},${y + 8}" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 木の器（ファロッファ）
function wbWoodBowl(p, { R = 90 } = {}){
    const c = '#9a6337';
    const grain = [0, 1, 2, 3].map(i => `<ellipse cx="${100 + i * 3}" cy="${100 - i * 2}" rx="${f(R - 4 - i * 2.5)}" ry="${f(R - 6 - i * 2)}" fill="none" stroke="${dk(c, .25)}" stroke-width=".6" opacity=".35"/>`).join('');
    return `<g ${p.sh(1.7)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .2, .3, .35, .3)}"/></g>${grain}
        <circle cx="100" cy="100" r="${R * .84}" fill="${p.rg('#b57a45', .12, .3, .62, .64)}"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#ffe8cc" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
}

// ---------- ブラジルの具 ----------
// 薄い牛ステーキ（焼き色と照り、片側に脂）
function wbSteak(p, x, y, w, h, r = 0, { c = '#8b4a26', seed = 1 } = {}){
    const R = rng(p.id + 'wbSk' + seed + x + y);
    const pts = ring(1, 14, .16, R, w / 2, h / 2);
    let marks = '';
    for (let i = 0; i < 7; i++) marks += `<ellipse cx="${f((R() - .5) * w * .65)}" cy="${f((R() - .5) * h * .55)}" rx="${f(3 + R() * 6)}" ry="${f(2 + R() * 3)}" fill="${dk(c, .45)}" opacity="${f(.2 + R() * .25)}"/>`;
    const fat = wbSm(pts.slice(9, 14).map(([a, b]) => [a * .93, b * .9]), false);
    return `<g ${T(x, y, r)}><path d="${wbSm(pts)}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .4)}" stroke-width=".9"/>
        <path d="${fat}" stroke="#e9cf9e" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>
        ${marks}
        <path d="M${f(-w * .3)},${f(-h * .05)} q${f(w * .1)},${f(-h * .08)} ${f(w * .22)},0 t${f(w * .2)},0 M${f(-w * .2)},${f(h * .18)} q${f(w * .1)},${f(-h * .06)} ${f(w * .2)},0" stroke="${dk(c, .4)}" stroke-width=".8" fill="none" opacity=".5"/>
        <path d="M${f(-w * .32)},${f(-h * .24)} Q${f(-w * .1)},${f(-h * .4)} ${f(w * .2)},${f(-h * .3)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 骨つきの豚ロース（ビステッカ）: 細長い身、縁の焼けた脂、片側の白い骨とT字の骨、焼き色
function wbChop(p, x, y, s, r = 0, { c = '#b5703a', seed = 1 } = {}){
    const R = rng(p.id + 'wbCh' + seed + x + y);
    const outer = [[-26, -13], [-12, -17], [6, -16], [18, -11], [28, -5], [34, 3], [29, 9], [17, 9], [6, 12], [-6, 16], [-20, 15], [-28, 4]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    const inner = outer.map(([a, b]) => [a * .91 + .6, b * .82 + 1]);
    let marks = '';
    for (let i = 0; i < 7; i++) marks += `<ellipse cx="${f(-16 + R() * 40)}" cy="${f(-4 + R() * 16)}" rx="${f(2.5 + R() * 4.5)}" ry="${f(1.5 + R() * 2.4)}" fill="${dk(c, .55)}" opacity="${f(.2 + R() * .25)}"/>`;
    const bone = 'M-23,-8 Q-17,-14.5 -4,-14.5 M-14,-13 Q-12.5,-8 -13,-3';
    return `<g ${T(x, y, r, s / 64)}><path d="${wbSm(outer)}" fill="${p.g('#e3ad62', .3, .25)}" stroke="#8e5e26" stroke-width=".9"/>
        <path d="${wbSm(inner)}" fill="${p.g(c, .18, .22)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        ${marks}
        <path d="${bone}" stroke="#9a7a4c" stroke-width="5.6" fill="none" stroke-linecap="round"/>
        <path d="${bone}" stroke="#ecdcb8" stroke-width="4.4" fill="none" stroke-linecap="round"/>
        <ellipse cx="-15" cy="-11" rx="1.6" ry="1.2" fill="#c9966a"/>
        <path d="M-4,-4 Q10,-8 24,-2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 半月に折ったオムレツ（ふちに具がのぞく）
function wbOmelete(p, x, y, w, h, r = 0){
    const R = rng(p.id + 'wbOm');
    const c = '#f6c94a';
    const body = `M${-w / 2},${f(h * .18)} C${f(-w / 2)},${f(-h * .62)} ${f(w / 2)},${f(-h * .62)} ${w / 2},${f(h * .18)} Q0,${f(h * .4)} ${-w / 2},${f(h * .18)}Z`;
    let brown = '';
    for (let i = 0; i < 9; i++) brown += `<ellipse cx="${f((R() - .5) * w * .7)}" cy="${f(-h * .2 + (R() - .5) * h * .4)}" rx="${f(4 + R() * 8)}" ry="${f(2 + R() * 3)}" fill="#d98e2a" opacity="${f(.12 + R() * .16)}"/>`;
    // ふちからのぞく具（トマト・ハム・溶けたチーズ）
    let peek = '';
    for (let i = 0; i < 8; i++){
        const t = -.42 + i * .12, px = t * w, py = h * .2 + Math.cos(t * 3) * h * .1 + 3;
        peek += i % 3 === 0 ? `<rect ${T(px, py, R() * 60 - 30)} x="-4" y="-3" width="8" height="6" rx="1.6" fill="${p.g('#e23b2c', .3, .2)}" stroke="#a8261a" stroke-width=".5"/>`
            : i % 3 === 1 ? `<rect ${T(px, py, R() * 60 - 30)} x="-5" y="-2.6" width="10" height="5.2" rx="1.2" fill="${p.g('#f1a3a6', .25, .2)}" stroke="#d27f84" stroke-width=".5"/>`
            : `<path ${T(px, py)} d="M-6,-2 Q0,-3 6,-2 Q5,4 2,5 Q0,8 -2,5 Q-6,3 -6,-2Z" fill="#fbeeb0" stroke="#e7cf7a" stroke-width=".5"/>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}>${peek}</g><g ${p.sh(1.3)}><path d="${body}" fill="${p.rg(c, .4, .25, .4, .3)}" stroke="${dk(c, .3)}" stroke-width=".9"/></g>
        ${brown}<path d="${body}" fill="none" stroke="#e5a02c" stroke-width="3" opacity=".3"/>
        <path d="M${f(-w * .3)},${f(-h * .18)} Q${f(-w * .05)},${f(-h * .42)} ${f(w * .26)},${f(-h * .28)}" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 魚の輪切り（posta）: 灰色の皮の縁、白い身、中心の骨、腹の切れ込み
function wbFishSteak(p, x, y, s, r = 0, { tint = '#f2d6b6', seed = 1 } = {}){
    const R = rng(p.id + 'wbFs' + seed + x + y);
    const pts = [[0, -15], [10, -13], [17, -5], [17, 5], [12, 13], [5, 16], [1.5, 9], [-1.5, 9], [-5, 16], [-12, 13], [-17, 5], [-17, -5], [-10, -13]].map(([a, b]) => [a + (R() - .5) * 1.2, b + (R() - .5) * 1.2]);
    const inner = pts.map(([a, b]) => [a * .86, b * .86 - .5]);
    return `<g ${T(x, y, r, s / 36)}><g ${p.sh(.8)}><path d="${wbSm(pts)}" fill="${p.g('#8c8f90', .3, .3)}" stroke="#5e6062" stroke-width=".7"/></g>
        <path d="${wbSm(inner)}" fill="${p.g(tint, .35, .2)}"/>
        <path d="M-9,-6 Q-4,-2 -8,5 M9,-6 Q4,-2 8,5 M-4,-11 Q0,-7 4,-11" stroke="${dk(tint, .18)}" stroke-width=".8" fill="none" opacity=".7"/>
        <circle cx="0" cy="-3" r="2.6" fill="#fbf4ea" stroke="${dk(tint, .25)}" stroke-width=".6"/><path d="M0,-5.6 L0,-12 M0,-.4 L0,5" stroke="${dk(tint, .22)}" stroke-width=".8"/>
        <path d="M-11,-7 Q-6,-12 2,-12.5" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 鶏の骨つきもも（ドラムスティック）
function wbDrum(p, x, y, s, r = 0, { c = '#c9873a', seed = 1 } = {}){
    const R = rng(p.id + 'wbDr' + seed + x + y);
    let spots = '';
    for (let i = 0; i < 5; i++) spots += `<ellipse cx="${f(-16 + R() * 20)}" cy="${f(-6 + R() * 12)}" rx="${f(1.5 + R() * 3)}" ry="${f(1 + R() * 1.6)}" fill="${dk(c, .45)}" opacity="${f(.2 + R() * .2)}"/>`;
    return `<g ${T(x, y, r, s / 42)}><g ${p.sh(.8)}><path d="M6,-2.4 L17,-2 L17,2 L6,2.4Z" fill="#efe3c6" stroke="#bfa880" stroke-width=".6"/>
        <circle cx="18.5" cy="-2.3" r="2.8" fill="${p.g('#f4ead2', .3, .2)}" stroke="#bfa880" stroke-width=".6"/><circle cx="18.5" cy="2.3" r="2.8" fill="${p.g('#f4ead2', .3, .2)}" stroke="#bfa880" stroke-width=".6"/>
        <path d="M8,-4 C2,-11 -14,-13 -19,-5 C-23,2 -17,11 -7,11 C1,11 5,7 8,3 Z" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>
        ${spots}<path d="M-14,-6 Q-7,-11 2,-8" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// ソースをまとった鶏の角切り
function wbChickenCube(p, x, y, s, r = 0, { c = '#efcd9a', sauce = '#e39d63', seed = 1 } = {}){
    const R = rng(p.id + 'wbCc' + seed + x + y);
    const pts = ring(s / 2, 6, .38, R, 1.15, .85);
    return `<g ${T(x, y, r)}><path d="${K.smooth(pts, true, .55)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        <path d="${K.smooth(pts.map(([a, b]) => [a * .92 + s * .05, b * .88 + s * .07]), true, .55)}" fill="${sauce}" opacity=".7"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .05)},${f(-s * .38)} ${f(s * .2)},${f(-s * .28)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// マッシュルームの薄切り（縦の断面）
function wbMushroom(p, x, y, s, r = 0, { c = '#d9c49c' } = {}){
    return `<g ${T(x, y, r, s / 16)}><path d="M-8,1 C-8,-7 8,-7 8,1 L3,1 L3,7 Q0,8 -3,7 L-3,1Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M-6.6,0 C-6.6,-5.4 6.6,-5.4 6.6,0" stroke="${dk(c, .3)}" stroke-width="1.2" fill="none" opacity=".5"/>
        <path d="M-5,-3 Q-2,-5.4 2,-5" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// カラブレーザ（燻製ソーセージの輪切り）
function wbCalabresa(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wbCl' + seed + x + y);
    let fat = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = R() * s * .3; fat += `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(s * .05 + R() * s * .03)}" ry="${f(s * .04)}" fill="#f6d8cc" opacity=".9"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><circle r="${s / 2}" fill="#6a2416"/></g><circle r="${f(s / 2 - 1.6)}" fill="${p.rg('#c4583e', .2, .25)}"/>${fat}
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .38)} ${f(s * .16)},${f(-s * .32)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 炒めた玉ねぎの薄切り（透けた飴色の弧）
function wbSliver(p, x, y, s, r = 0, { c = '#e3b562', span = 1.6, w = null } = {}){
    const R0 = s / 2, a0 = -Math.PI / 2 - span / 2, a1 = a0 + span, sw = w || s * .13;
    const d = `M${f1(Math.cos(a0) * R0)},${f1(Math.sin(a0) * R0)}A${f1(R0)},${f1(R0 * .85)} 0 0 1 ${f1(Math.cos(a1) * R0)},${f1(Math.sin(a1) * R0)}`;
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .18)}" stroke-width="${f1(sw + .8)}" fill="none" stroke-linecap="round" opacity=".55"/><path d="${d}" stroke="${c}" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round" opacity=".85"/><path d="${d}" stroke="${lt(c, .5)}" stroke-width="${f1(sw * .3)}" fill="none" stroke-linecap="round" opacity=".8" transform="translate(-.3 -.4)"/></g>`;
}
// ほぐした鶏肉（細い繊維の束）
function wbShred(p, x, y, s, { n = 14, seed = 1, cols = ['#f1dbb0', '#ddb985'] } = {}){
    const R = rng(p.id + 'wbSh' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .7, a = R() * Math.PI, L = s * (.25 + R() * .3), b = (R() - .5) * L * .5;
        ds[i % cols.length] += `M${f1(cx - Math.cos(a) * L / 2)},${f1(cy - Math.sin(a) * L / 2)}q${f1(Math.cos(a) * L / 2 - Math.sin(a) * b)},${f1(Math.sin(a) * L / 2 + Math.cos(a) * b)} ${f1(Math.cos(a) * L)},${f1(Math.sin(a) * L)}`;
    }
    return `<g ${p.sh(.5)}><g ${wbOutline(p, '#b8915c', .45)} fill="none" stroke-linecap="round">${cols.map((c, i) => `<path d="${ds[i]}" stroke="${c}" stroke-width="2.6"/>`).join('')}</g></g>`;
}
// 細く切ったケール（couve）
function wbCouve(p, x, y, s, { n = 60, seed = 1, sy = .9, w = 2.6, cols = ['#2c6a24', '#3f8030', '#5f9e3c'] } = {}){
    const R = rng(p.id + 'wbCv' + seed + x + y);
    const L = [0, 1, 2].map(() => cols.map(() => ''));
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2 * .92, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy;
        const ang = R() * Math.PI, len = 9 + R() * 12, b = (R() - .5) * 8;
        const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
        L[i % 3][Math.floor(R() * cols.length)] += `M${f1(cx - dx)},${f1(cy - dy)}Q${f1(cx - Math.sin(ang) * b)},${f1(cy + Math.cos(ang) * b)} ${f1(cx + dx)},${f1(cy + dy)}`;
    }
    const ol = wbOutline(p, '#1d4517', .45);
    return `<g ${p.sh(.6)}>${L.map(l => `<g ${ol} fill="none" stroke-linecap="round" stroke-width="${w}">${l.map((d, i) => `<path d="${d}" stroke="${cols[i]}"/>`).join('')}</g>`).join('')}</g>`;
}
// カリオカ豆（1粒を defs に作って <use> で並べる）: 薄茶に濃い茶のまだら
function wbBean(p, x, y, s, r = 0){
    const id = p.def('wbBean', id => `<g id="${id}"><path d="M-5.2,0 C-5.2,-3.6 4.6,-4 5.2,-.4 C5.6,3.2 -4.8,3.8 -5.2,0Z" fill="${p.g('#b07d52', .3, .32)}" stroke="#5e3a20" stroke-width=".5"/><path d="M-3.4,-1.6 l1,.6 M-1,1.4 l1.2,-.4 M1.4,-2 l.8,1 M3,1 l1,-.6 M-3,1.6 l.8,-.6" stroke="#6a4224" stroke-width="1" stroke-linecap="round" opacity=".6"/><path d="M-3.6,-1.8 Q-1,-3.2 2,-2.6" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/></g>`);
    return `<use href="#${id}" ${T(x, y, r, s / 10)}/>`;
}

// =========================================================
export default {
    // 白ご飯（arroz branco）: 白い器に、ぱらっと炊いた白いご飯
    br_staple: p => [
        K.bowl(p, { glaze: '#f3efe7', inside: '#fbf9f4' }),
        `<circle cx="100" cy="100" r="86" fill="none" stroke="#2f7a52" stroke-width="1.6" opacity=".8"/>`,
        wbRice(p, 100, 101, 140, { density: 1.3, grain: 4, tint: '#f6f3ea' }),
        `<path d="M54,84 Q62,60 86,50" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // 鶏のストロガノフ: 白い皿に、サーモン色のクリームソースと鶏肉・マッシュルーム、横にバタタ・パーリャ（細切りポテト）
    br_strogonoff: p => [
        K.plate(p, { rim: '#2f7a52' }),
        wbSauce(p, [[50, 70], [78, 46], [112, 44], [136, 58], [142, 90], [134, 120], [116, 150], [86, 156], [58, 144], [44, 114], [42, 88]], '#de8a50', { l: .25, d: .22 }),
        `<path d="M58,96 C68,72 98,60 122,70 M62,128 C80,142 110,142 128,124" stroke="#f4c096" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".75"/>`,
        `<g ${p.sh(.9)}>`,
        wbChickenCube(p, 72, 76, 20, 10, { seed: 1, sauce: '#d98450' }), wbChickenCube(p, 102, 62, 19, -20, { seed: 2, sauce: '#d98450' }), wbChickenCube(p, 124, 92, 20, 30, { seed: 3, sauce: '#d98450' }),
        wbChickenCube(p, 90, 98, 21, -5, { seed: 4, sauce: '#d98450' }), wbChickenCube(p, 62, 108, 19, 40, { seed: 5, sauce: '#d98450' }), wbChickenCube(p, 96, 132, 20, 15, { seed: 6, sauce: '#d98450' }),
        wbChickenCube(p, 122, 124, 18, -35, { seed: 7, sauce: '#d98450' }), wbChickenCube(p, 74, 136, 17, 70, { seed: 8, sauce: '#d98450' }), wbChickenCube(p, 112, 106, 15, 50, { seed: 9, sauce: '#d98450' }),
        wbMushroom(p, 88, 78, 16, 20), wbMushroom(p, 108, 84, 14, -10), wbMushroom(p, 76, 118, 14, 60), wbMushroom(p, 56, 88, 13, -60), wbMushroom(p, 130, 70, 13, 80), wbMushroom(p, 108, 146, 13, -40),
        `</g>`,
        `<path d="M70,64 q6,-4 12,0 M118,110 q6,4 12,0 M84,150 q6,3 12,-1" stroke="#e8a06c" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`,
        wbSticks(p, 154, 112, 44, 92, { n: 110, c: '#efbd45', len: 13, sw: 1.9, seed: 2 }),
        K.sprinkle(p, 92, 100, 80, { c: '#3f8a2c', n: 16, r: .8 }),
    ].join(''),

    // ビフェ・アセボラード: 琥珀ガラスの皿に、薄い牛ステーキ2枚と、炒めた玉ねぎをたっぷり
    br_bife: p => {
        const R = rng(p.id + 'sl');
        let on = '';
        for (let i = 0; i < 20; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 42; on += K.onion(p, 100 + Math.cos(a) * d, 100 + Math.sin(a) * d * .8, 22 + R() * 10, R() * 360, { c: R() < .5 ? '#d9a04c' : '#e6bb6a', layers: R() < .5 ? 2 : 1 }); }
        return [
            wbAmberPlate(p),
            K.pool(p, 100, 104, 104, '#6e3a1a', { op: .5, seed: 1 }),
            `<g ${p.sh(1.3)}>`,
            wbSteak(p, 80, 120, 92, 58, 22, { seed: 1, c: '#7d401c' }),
            wbSteak(p, 118, 80, 94, 58, -18, { seed: 2, c: '#8f4f26' }),
            `</g>`,
            `<g ${p.sh(.6)}>${on}</g>`,
            K.sprinkle(p, 102, 100, 70, { c: '#3f8a2c', n: 14, r: .8 }),
        ].join('');
    },

    // カルニ・モイダ・コン・バタタ: 白い深皿に、トマトで煮たひき肉とじゃがいもの角切り、ピーマン、cheiro-verde
    br_carne_moida: p => {
        const sp = wbSpots('cm', 13, 50, 20);
        return [
            K.bowl(p, { glaze: '#e9e3d7', inside: '#f7f3eb' }),
            K.liquid(p, { R: 72, c: '#9c5530', op: 1 }),
            `<g ${p.sh(.6)}><g ${p.rough(3, .12)}><path d="${wbSm(ring(64, 14, .12, rng(p.id + 'mass'), 1, 1))}" transform="translate(100 100)" fill="${p.rg('#80462a', .15, .25)}"/></g></g>`,
            wbGrains(p, 100, 100, 128, { cols: ['#6e3a1f', '#93573a', '#5a2e17'], n: 190, size: 2.8, seed: 1 }),
            `<g ${p.sh(.7)}>`,
            sp.map(([x, y, r], i) => i % 4 === 3 ? wbDice(p, x, y, 10, r, '#4f9a34') : wbDice(p, x, y, 17, r, '#ecc46a')).join(''),
            `</g>`,
            wbGrains(p, 100, 100, 120, { cols: ['#d8442c'], n: 18, size: 2.4, seed: 3 }),
            wbRings(p, 100, 100, 110, { n: 16 }),
            wbHerbs(p, 100, 100, 110, { n: 20 }),
            wbShine(100, 100, 70, .3),
        ].join('');
    },

    // モケッカ: 黒い土鍋（panela de barro）に、デンデ油とココナッツミルクのオレンジのソース、魚の輪切り、トマト・玉ねぎ・ピーマンの輪切り、香菜
    br_moqueca: p => [
        wbPot(p, { c: '#3a302c', inside: '#241c19' }),
        K.liquid(p, { R: 72, c: '#e5793a', op: 1 }),
        `<circle cx="96" cy="94" r="50" fill="#f3a361" opacity=".35"/>`,
        wbOil(p, 100, 100, 130, { n: 14, c: '#f08a22', op: .8, rmax: 2.6 }),
        wbFishSteak(p, 76, 84, 52, -10, { seed: 1, tint: '#f6dcc0' }),
        wbFishSteak(p, 124, 90, 54, 20, { seed: 2, tint: '#f6dcc0' }),
        wbFishSteak(p, 96, 128, 50, 170, { seed: 3, tint: '#f6dcc0' }),
        wbTomatoSlice(p, 104, 68, 24, 0, { cooked: true }), wbTomatoSlice(p, 62, 116, 22, 30, { cooked: true }), wbTomatoSlice(p, 138, 124, 22, 0, { cooked: true }),
        `<g ${p.sh(.5)}>`,
        wbPepRing(p, 100, 102, 20, 0, { c: '#d8352a' }), wbPepRing(p, 140, 64, 18, 30, { c: '#3f8f2f' }), wbPepRing(p, 62, 142, 16, 0, { c: '#3f8f2f' }), wbPepRing(p, 120, 148, 16, 10, { c: '#d8352a' }),
        wbOnionRing(p, 84, 104, 20, 0, { c: '#f1dca8' }), wbOnionRing(p, 128, 112, 18, 20, { c: '#f1dca8' }), wbOnionRing(p, 70, 62, 16, 20, { c: '#f1dca8' }),
        `</g>`,
        wbLeaf(p, 92, 92, 14, 20), wbLeaf(p, 110, 116, 13, -40), wbLeaf(p, 142, 100, 13, 80), wbLeaf(p, 70, 128, 13, -10), wbLeaf(p, 116, 70, 12, 120), wbLeaf(p, 84, 146, 12, 30), wbLeaf(p, 56, 92, 12, 60),
        wbShine(100, 100, 72, .35),
    ].join(''),

    // ビステッカ: 白い皿に、こんがり焼いた骨つき豚ロース2枚、炒め玉ねぎ、ライム
    br_bisteca: p => [
        K.plate(p, { rim: '#2f7a52' }),
        `<g ${p.sh(1.3)}>`,
        wbChop(p, 108, 130, 102, 172, { seed: 1, c: '#b8763e' }),
        wbChop(p, 92, 72, 102, -8, { seed: 2, c: '#bf7e44' }),
        `</g>`,
        `<g ${p.sh(.6)}>`, K.onion(p, 50, 104, 20, 60, { c: '#d9a04c' }), K.onion(p, 58, 94, 18, -150, { c: '#e6bb6a', layers: 1 }), `</g>`,
        K.lemon(p, 152, 102, 24, -20, { c: '#c8e07a', rind: '#4f8f2f' }),
    ].join(''),

    // オムレツ: 白い皿に、半月に折った卵焼き。ふちからトマト・ハム・チーズ、上に刻んだパセリ
    br_omelete: p => [
        K.plate(p, { rim: '#d9a441' }),
        wbOmelete(p, 100, 104, 140, 104, -8),
        wbHerbs(p, 100, 84, 70, { n: 18, sy: .5 }),
        wbDice(p, 70, 130, 9, 20, '#e23b2c'), wbDice(p, 132, 128, 8, -20, '#e23b2c'),
    ].join(''),

    // ガリニャーダ: アルミ鍋に、ターメリックで黄色く炊いたご飯と鶏の骨つき肉、コーン、赤ピーマン、cheiro-verde
    br_galinhada: p => [
        wbPot(p, { c: '#b9bbbd', inside: '#8f9295', rimC: '#eef0f2' }),
        wbRice(p, 100, 100, 146, { tint: '#eebf3e', density: .9, grain: 3.8, hiK: .3 }),
        `<g ${p.sh(.9)}>`,
        wbDrum(p, 76, 80, 64, -30, { seed: 1, c: '#bd7228' }),
        wbDrum(p, 128, 92, 62, 200, { seed: 2, c: '#c47a2c' }),
        wbDrum(p, 92, 130, 60, 20, { seed: 3, c: '#b86c24' }),
        `</g>`,
        K.corn(p, 128, 128, 30, { n: 10 }), K.corn(p, 60, 112, 22, { n: 6 }), K.corn(p, 114, 60, 24, { n: 7 }),
        wbDice(p, 146, 116, 8, 10, '#d8352a'), wbDice(p, 60, 96, 8, -20, '#d8352a'), wbDice(p, 104, 102, 8, 30, '#d8352a'), wbDice(p, 136, 62, 7, 0, '#d8352a'), wbDice(p, 70, 140, 7, 0, '#d8352a'),
        wbRings(p, 100, 100, 120, { n: 16 }),
        wbHerbs(p, 100, 100, 124, { n: 30 }),
    ].join(''),

    // 豆の煮もの（フェイジャン・カリオカ）: 白い器に、茶色いとろみの煮汁とまだらの豆、ローリエ
    br_feijao: p => {
        const sp = wbSpots('fj', 80, 62, 9.6);
        return [
            K.bowl(p, { glaze: '#efe9de', inside: '#f8f4ec' }),
            K.liquid(p, { R: 73, c: '#86553a', op: 1 }),
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r], i) => wbBean(p, x, y, i % 5 === 0 ? 11 : 12.5, r)).join(''), `</g>`,
            `<circle cx="100" cy="100" r="70" fill="#7a4a2e" opacity=".14"/>`,
            `<g ${p.sh(.5)}><path ${T(128, 72, -30)} d="M-15,0 Q0,-7.5 15,0 Q0,7.5 -15,0Z" fill="${p.g('#5b6b2c', .25, .25)}" stroke="#3a4718" stroke-width=".6"/></g><path ${T(128, 72, -30)} d="M-13,0 L13,0" stroke="#8a9a52" stroke-width=".7"/>`,
            wbShine(100, 100, 73, .45),
        ].join('');
    },

    // ファロッファ: 木の器に、バターで炒ったキャッサバ粉（黄金色のさらさら）、ベーコン・玉ねぎ・パセリ
    br_farofa: p => [
        wbWoodBowl(p),
        `<g ${p.sh(.8)}><g ${p.crumb(.9)}><path d="${wbSm(ring(68, 14, .08, rng(p.id + 'fa'), 1, 1))}" transform="translate(100 100)" fill="${p.rg('#e2bd72', .3, .25, .38, .34)}"/></g></g>`,
        wbGrains(p, 100, 100, 128, { cols: ['#edd08e', '#d39f50', '#f4e0b0', '#c08840'], n: 250, size: 1.2, seed: 2 }),
        `<g ${p.sh(.5)}>`, wbGrains(p, 100, 100, 112, { cols: ['#9a3b22', '#b85a36'], n: 20, size: 3.2, seed: 4 }), `</g>`,
        wbGrains(p, 100, 100, 110, { cols: ['#f6e8c4'], n: 14, size: 2.4, seed: 5 }),
        wbHerbs(p, 100, 100, 112, { n: 26 }),
    ].join(''),

    // 細切りケールのソテー（couve refogada）: 白い器に、鮮やかな緑の極細の帯の山、にんにく
    br_couve: p => [
        K.bowl(p, { glaze: '#e6dccb', inside: '#f7f3ea' }),
        `<g ${p.sh(.8)}><path d="${wbSm(ring(66, 12, .12, rng(p.id + 'cv'), 1, 1))}" transform="translate(100 100)" fill="${p.rg('#2f6a24', .2, .2)}"/></g>`,
        wbCouve(p, 100, 100, 136, { n: 300, seed: 1, w: 1.7 }),
        wbGrains(p, 100, 100, 100, { cols: ['#f2d58a'], n: 12, size: 1.6, seed: 3 }),
    ].join(''),

    // ヴィナグレッチ: ガラスのボウルに、角切りのトマト・玉ねぎ・ピーマンとパセリ、酢とオイルのつや
    br_vinagrete: p => {
        const sp = wbSpots('vn', 70, 62, 9.4);
        return [
            wbGlass(p),
            `<circle cx="100" cy="100" r="72" fill="#efc9b8" opacity=".6"/>`,
            `<g ${p.sh(.5)}>`,
            sp.map(([x, y, r], i) => i % 5 === 0 || i % 5 === 3 ? wbCube(p, x, y, 9, r, '#f4efdc', { op: .9 }) : i % 5 === 4 ? wbCube(p, x, y, 8.5, r, '#4f9a34') : wbCube(p, x, y, 10, r, '#e03a2a')).join(''),
            sp.filter((_, i) => i % 5 !== 0 && i % 5 !== 3 && i % 5 !== 4).map(([x, y]) => `<rect x="${f(x - 3)}" y="${f(y - 3)}" width="3.4" height="2.4" rx="1" fill="#f7a35a" opacity=".8"/>`).join(''),
            `</g>`,
            wbHerbs(p, 100, 100, 124, { n: 40 }),
            wbShine(100, 100, 70, .5),
        ].join('');
    },

    // サラダ・ジ・マイオネーズ: 耐熱ガラスの角皿に、マヨネーズであえたじゃがいも・にんじん・グリーンピース、パセリ
    br_maionese: p => {
        const sp = wbSpots('mn', 36, 64, 12.5, 100, 100, .72);
        const R = rng(p.id + 'mayo');
        let mayo = '';
        for (let i = 0; i < 16; i++) mayo += `<path ${T(40 + R() * 120, 52 + R() * 96, R() * 180)} d="${wbSm(ring(3 + R() * 3, 6, .4, R, 1.8, .6))}" fill="#fffbea" opacity=".6"/>`;
        return [
            wbPyrex(p),
            `<rect x="28" y="40" width="144" height="120" rx="20" fill="${p.rg('#f5edca', .25, .12)}"/>`,
            `<g ${p.sh(.6)}>`,
            sp.map(([x, y, r], i) => i % 4 === 1 ? wbDice(p, x, y, 11, r, '#ef8a3a') : wbDice(p, x, y, 15, r, '#f2dc98')).join(''),
            `</g>`,
            mayo,
            wbSpots('mnp', 16, 60, 10, 100, 100, .72).map(([x, y]) => `<circle cx="${f(x + 3)}" cy="${f(y + 4)}" r="3.4" fill="${p.rg('#6db043', .3, .25, .35, .32)}" stroke="#3f7a24" stroke-width=".5"/>`).join(''),
            wbHerbs(p, 100, 100, 120, { n: 24, sy: .75 }),
        ].join('');
    },

    // シュシュ（ハヤトウリ）の炒め煮: 緑釉の器に、淡い緑の角切り、トマト、小口ねぎ
    br_chuchu: p => {
        const sp = wbSpots('ch', 22, 56, 16);
        return [
            K.bowl(p, { glaze: '#5f8a74', inside: '#eef0e6' }),
            `<circle cx="100" cy="100" r="68" fill="${p.rg('#cfdc9c', .2, .2)}" opacity=".8"/>`,
            `<g ${p.sh(.6)}>`, sp.map(([x, y, r]) => wbDice(p, x, y, 18, r, '#cfe09a')).join(''), `</g>`,
            sp.map(([x, y, r]) => `<rect ${T(x - 1.5, y - 1.5, r)} x="-4" y="-4" width="8" height="8" rx="2" fill="#eef5d4" opacity=".55"/>`).join(''),
            wbGrains(p, 100, 100, 110, { cols: ['#e0482e'], n: 16, size: 2.4, seed: 2 }),
            wbRings(p, 100, 100, 118, { n: 22 }),
            wbHerbs(p, 100, 100, 110, { n: 18 }),
        ].join('');
    },

    // レタスとトマトのサラダ: 白い皿に、レタスの葉、トマトの輪切り、生の玉ねぎの輪
    br_salada: p => [
        K.plate(p, { rim: '#2f7a52' }),
        wbLettuce(p, 84, 80, 92, -30, { seed: 1, c: '#9fd060' }),
        wbLettuce(p, 116, 118, 90, 20, { seed: 2, c: '#a8d66c' }),
        wbLettuce(p, 76, 124, 72, 60, { seed: 3, c: '#8fc552' }),
        wbLettuce(p, 128, 78, 70, -70, { seed: 4, c: '#b3dc78' }),
        wbTomatoSlice(p, 94, 104, 34, 0), wbTomatoSlice(p, 124, 96, 30, 30), wbTomatoSlice(p, 82, 74, 28, 10), wbTomatoSlice(p, 112, 130, 28, 0), wbTomatoSlice(p, 70, 112, 24, 0),
        `<g ${p.sh(.4)}>`, wbOnionRing(p, 106, 82, 22, 10, { raw: true }), wbOnionRing(p, 96, 126, 18, 0, { raw: true }), wbOnionRing(p, 136, 112, 16, 0, { raw: true }), `</g>`,
    ].join(''),

    // カルド・ヴェルジ: 素焼きの器に、じゃがいものクリーム色のスープ、極細切りのケール、カラブレーザの輪切り、オリーブオイル
    br_caldo_verde: p => [
        K.bowl(p, { glaze: '#9b5230', inside: '#efe2c8' }),
        K.liquid(p, { R: 74, c: '#e2dbb0', op: 1 }),
        `<circle cx="96" cy="94" r="52" fill="#f3edcc" opacity=".5"/>`,
        wbCouve(p, 100, 100, 128, { n: 170, seed: 3, w: 1.15 }),
        wbCalabresa(p, 82, 88, 20, 0, { seed: 1 }), wbCalabresa(p, 118, 82, 19, 0, { seed: 2 }), wbCalabresa(p, 112, 122, 20, 0, { seed: 3 }), wbCalabresa(p, 76, 120, 18, 0, { seed: 4 }), wbCalabresa(p, 138, 104, 17, 0, { seed: 5 }),
        wbOil(p, 100, 100, 110, { n: 10, c: '#d9c24a', op: .7, rmax: 2.6 }),
        wbShine(100, 100, 74, .45),
    ].join(''),

    // カンジャ: 白い器に、澄んだ金色のチキンスープ、ご飯粒、ほぐした鶏肉、にんじん、cheiro-verde
    br_canja: p => {
        const sp = wbSpots('cj', 10, 56, 20);
        const R = rng(p.id + 'grains');
        let g = '';
        for (let i = 0; i < 110; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 66, x = 100 + Math.cos(a) * d, y = 100 + Math.sin(a) * d, b = R() * 3.14; g += `M${f1(x - Math.cos(b) * 1.6)},${f1(y - Math.sin(b) * 1.6)}l${f1(Math.cos(b) * 3.2)},${f1(Math.sin(b) * 3.2)}`; }
        return [
            K.bowl(p, { glaze: '#f4efe6', inside: '#fbf9f3' }),
            `<circle cx="100" cy="100" r="86" fill="none" stroke="#2f7a52" stroke-width="1.6" opacity=".8"/>`,
            K.liquid(p, { R: 74, c: '#e3bc68', op: .95 }),
            `<g ${wbOutline(p, '#cdb98a', .5)}><path d="${g}" stroke="#fbf8ee" stroke-width="3.4" stroke-linecap="round" fill="none"/></g>`,
            wbShred(p, 80, 88, 30, { seed: 1, n: 10 }), wbShred(p, 122, 110, 30, { seed: 2, n: 10 }), wbShred(p, 108, 72, 26, { seed: 3, n: 8 }), wbShred(p, 86, 126, 26, { seed: 4, n: 8 }), wbShred(p, 100, 102, 24, { seed: 5, n: 7 }),
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r]) => wbDice(p, x, y, 10, r, '#ef7f30')).join(''), `</g>`,
            wbOil(p, 100, 100, 120, { n: 10, c: '#f3c45a', op: .6, rmax: 2.4 }),
            wbHerbs(p, 100, 100, 120, { n: 24 }),
            wbShine(100, 100, 74, .4),
        ].join('');
    },
};
