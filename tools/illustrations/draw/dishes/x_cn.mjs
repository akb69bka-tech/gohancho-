// 中国（家常菜）2: 手で盛りつけ直した おかず・凉菜・汤（青花の器・砂锅・色釉の鉢）
import * as K from '../kit.mjs';

const { T, f, ring, rng, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;
function xcnSmooth(pts, closed = true, k = 1){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6 * k)},${f1(p1[1] + (p2[1] - p0[1]) / 6 * k)} ${f1(p2[0] - (p3[0] - p1[0]) / 6 * k)},${f1(p2[1] - (p3[1] - p1[1]) / 6 * k)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const xcnSm = (pts, closed = false) => xcnSmooth(pts, closed);

// =========================================================
// 器
// =========================================================
const BLUE = '#2a58a6';
function xcnMotif(p, rm, n, sz = 1, col = BLUE){
    let d = '';
    for (let i = 0; i < n; i++){
        const a = i / n * Math.PI * 2, x = 100 + Math.cos(a) * rm, y = 100 + Math.sin(a) * rm, c = Math.cos(a + Math.PI / 2), s = Math.sin(a + Math.PI / 2);
        const pt = (u, v) => `${f1(x + (u * c - v * s) * sz)},${f1(y + (u * s + v * c) * sz)}`;
        d += `M${pt(-3.4, 1)}Q${pt(-3.4, -2.4)} ${pt(0, -2.4)}Q${pt(2.6, -2.4)} ${pt(2.6, -.2)}Q${pt(2.6, 1.6)} ${pt(.8, 1.4)}`;
    }
    return `<path d="${d}" stroke="${col}" stroke-width="${f1(1.1 * sz)}" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 青花の平皿。well が内側の半径の割合
function xcnPlate(p, { R = 94, well = .74, line = BLUE, motif = true } = {}){
    const w = R * well, base = '#fbfbf7';
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .1, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${line}" stroke-width="2"/>
        ${motif ? xcnMotif(p, (R - 3 + w + 4) / 2, 22, 1, line) : ''}
        <circle cx="100" cy="100" r="${f1(w + 4)}" fill="none" stroke="${line}" stroke-width=".9" opacity=".8"/>
        <circle cx="100" cy="100" r="${f1(w + 1.5)}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".45"/>
        <circle cx="100" cy="100" r="${f1(w)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .2)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 碗（青花）。inner 半径 = R*.88
function xcnBowl(p, { R = 92, inside = '#fbfaf5', motif = true, line = BLUE, outer = '#f8f7f2' } = {}){
    const r = R * .88;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(outer, .25, .2, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.6}" fill="none" stroke="${line}" stroke-width="2.4"/>
        <circle cx="100" cy="100" r="${f1(r + 1.2)}" fill="none" stroke="${line}" stroke-width=".9"/>
        ${motif ? xcnMotif(p, (R - 3.8 + r + 1.2) / 2, 26, .75, line) : ''}
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .22, .64, .66)}"/>
        <path d="M${f1(100 - R * .7)},${f1(100 - R * .42)} A${f1(R * .82)},${f1(R * .82)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .78)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 色釉の鉢（外は釉薬の色、内は白っぽい）。inner 半径 = R*lip
function xcnGlazeBowl(p, { R = 92, glaze = '#3f6f8a', inside = '#f6f3ea', lip = .86 } = {}){
    const r = R * lip;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(glaze, .28, .28, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="${lt(glaze, .35)}" stroke-width="1.2" opacity=".7"/>
        <circle cx="100" cy="100" r="${f1(r + 1.4)}" fill="none" stroke="${dk(glaze, .25)}" stroke-width="1.6" opacity=".7"/>
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .26, .64, .66)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .84)},${f1(R * .84)} 0 0 1 ${f1(100 - R * .26)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// 白い平皿に色の縁取り（红边・绿边の食堂の皿）
function xcnRimPlate(p, { R = 94, well = .76, rim = '#c0392b' } = {}){
    const w = R * well, base = '#fcfbf7';
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .1, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.4}" fill="none" stroke="${rim}" stroke-width="3.2"/>
        <circle cx="100" cy="100" r="${R - 6.4}" fill="none" stroke="${rim}" stroke-width=".9" opacity=".85"/>
        <circle cx="100" cy="100" r="${f1(w + 1.5)}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".45"/>
        <circle cx="100" cy="100" r="${f1(w)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .2)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 鱼盘（楕円の長皿）
function xcnFishPlate(p, { rx = 97, ry = 72 } = {}){
    const base = '#fbfbf7';
    let d = '';
    const n = 28;
    for (let i = 0; i < n; i++){
        const a = i / n * Math.PI * 2, x = 100 + Math.cos(a) * (rx - 10), y = 100 + Math.sin(a) * (ry - 10);
        d += `M${f1(x - 2.2)},${f1(y)}a2.2,2.2 0 1 1 4.4,0`;
    }
    return `<g ${p.sh(1.6)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <ellipse cx="100" cy="100" rx="${rx - 3}" ry="${ry - 3}" fill="none" stroke="${BLUE}" stroke-width="2"/>
        <path d="${d}" stroke="${BLUE}" stroke-width="1" fill="none" opacity=".75"/>
        <ellipse cx="100" cy="100" rx="${rx - 16}" ry="${ry - 16}" fill="none" stroke="${BLUE}" stroke-width=".8" opacity=".8"/>
        <ellipse cx="100" cy="100" rx="${rx - 18}" ry="${ry - 18}" fill="${p.rg(base, .06, .08, .6, .62)}"/>
        <path d="M${100 - rx * .8},${100 - ry * .35} Q${100 - rx * .7},${100 - ry * .82} ${100 - rx * .3},${100 - ry * .88}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 砂锅（土鍋）: 黒茶の釉、素焼きの縁、左右に小さな耳。内側の半径 = R*.86
function xcnClayPot(p, { R = 86, glaze = '#4a3226' } = {}){
    const ear = sx => `<g ${T(100 + sx * (R + 1), 100)}><rect x="-9" y="-11" width="18" height="22" rx="7" fill="${p.g('#5a3c2c', .25, .3)}" stroke="#2a1810" stroke-width=".8"/><rect x="-5" y="-6" width="10" height="12" rx="4" fill="#2a1a12" opacity=".5"/></g>`;
    return `<g ${p.sh(2)}>${ear(-1)}${ear(1)}<circle cx="100" cy="100" r="${R}" fill="${p.rg(glaze, .2, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="#c8a888" stroke-width="2.4" opacity=".55"/>
        <circle cx="100" cy="100" r="${f1(R * .86 + 1.4)}" fill="none" stroke="#1e120c" stroke-width="2"/>
        <circle cx="100" cy="100" r="${f1(R * .86)}" fill="${p.rg('#3a2418', .1, .2, .62, .64)}"/>
        <path d="M${f1(100 - R * .74)},${f1(100 - R * .42)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .26)},${f1(100 - R * .82)}" stroke="#f3dcc6" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".45"/>`;
}

// =========================================================
// ご飯・麺・粒（w_cn.mjs の部品を写したもの）
// =========================================================
function xcnOutline(p, c, r = .55){
    const id = p.def('xcnOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
function xcnRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xcnRice' + seed + x + y);
    const shape = xcnSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('xcnRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// うねった麺
function xcnWavy(p, x, y, s, { c = '#f3ead2', w = 5, n = 14, seed = 1, sy = .9, len = .55, wav = .5, outline = null, layers = 4, hi = .5 } = {}){
    const R = rng(p.id + 'xcnWv' + seed + x);
    const ol = xcnOutline(p, outline || dk(c, .25), .6), rad = s / 2;
    const L = Array.from({ length: layers }, () => ['', '', '']);
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
        const dd = xcnSm(pts);
        const l = L[i % layers];
        if (R() < .3) l[1] += dd; else l[0] += dd;
        if (R() < .5) l[2] += xcnSm(pts.slice(1, 4).map(([a, b]) => [a - w * .18, b - w * .2]));
    }
    return `<g ${p.sh(.8)}>${L.map(([a, b, h]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .14)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>${h && hi ? `<path d="${h}" stroke="#fff" stroke-width="${f1(w * .24)}" fill="none" stroke-linecap="round" opacity="${hi}"/>` : ''}`).join('')}</g>`;
}
// 小さな粒（にんにく・ひき肉・こしょう）。色ごとに1本のpath
function xcnGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xcnGr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; });
        ds[k] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`).join('');
}
// 細切りの束
function xcnStrips(p, x, y, s, { c = '#8a5230', n = 14, w = 3.4, len = .28, seed = 1, sy = .85, curve = .25, dir = null, gloss = .4 } = {}){
    const R = rng(p.id + 'xcnSt' + seed + x + y);
    const cols = [c, lt(c, .14), dk(c, .12)], ds = ['', '', ''];
    let hl = '';
    for (let i = 0; i < n; i++){
        const a = dir === null ? R() * Math.PI : dir + (R() - .5) * .9, L = s * len * (.7 + R() * .5);
        const r2 = Math.sqrt(R()) * s / 2, b = R() * 6.28, cx = x + Math.cos(b) * r2, cy = y + Math.sin(b) * r2 * sy;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, bend = (R() - .5) * curve * 2;
        const seg = `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx - dy * bend)} ${f1(cy + dx * bend)} ${f1(cx + dx)} ${f1(cy + dy)}`;
        ds[R() < .5 ? 0 : R() < .5 ? 1 : 2] += seg;
        if (R() < .5) hl += `M${f1(cx - dx * .6 - .5)} ${f1(cy - dy * .6 - .7)}L${f1(cx + dx * .2 - .5)} ${f1(cy + dy * .2 - .7)}`;
    }
    return `<g ${xcnOutline(p, dk(c, .35), .5)} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>${gloss && hl ? `<path d="${hl}" stroke="#fff" stroke-width="${f1(w * .28)}" fill="none" stroke-linecap="round" opacity="${gloss}"/>` : ''}`;
}
// 汁気のあるソースの面
function xcnSauce(p, x, y, s, c, { op = .9, seed = 1, sy = .84 } = {}){
    const R = rng(p.id + 'xcnSc' + seed);
    return `<path ${T(x, y)} d="${xcnSmooth(ring(s / 2, 11, .2, R, 1, sy))}" fill="${p.rg(c, .22, .25)}" opacity="${op}"/>`;
}
function xcnOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .6, rmax = 2 } = {}){
    const R = rng(p.id + 'xcnOi' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
const xcnShine = (cx, cy, R, op = .35) => `<path d="M${f1(cx - R * .55)},${f1(cy + R * .1)} A${f1(R * .6)},${f1(R * .6)} 0 0 1 ${f1(cx - R * .05)},${f1(cy - R * .52)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 汁の表面（スープ）
function xcnBroth(p, R, c, { op = .95, cx = 100, cy = 100 } = {}){
    return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.rg(c, .2, .22, .45, .42)}" opacity="${op}"/>`;
}
function xcnSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xcnspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360), R()]);
    }
    return out;
}
const xcnScallions = (p, x, y, s, { n = 14, seed = 1 } = {}) => K.scallions(p, x, y, s, { n, seed, c: '#4f9a2e' });

// =========================================================
// 具（w_cn.mjs / z_soup.mjs から写したもの）
// =========================================================
function xcnEggCurd(p, x, y, s, r = 0, { seed = 1, c = '#fadb6a' } = {}){
    const R = rng(p.id + 'xcnEg' + seed + x + y);
    let lobes = '', folds = '';
    for (let i = 0; i < 5; i++){
        const a = i / 5 * 6.28 + R(), d = i === 0 ? 0 : s * (.16 + R() * .1), rr = s * (.2 + R() * .08);
        const lx = Math.cos(a) * d * 1.15, ly = Math.sin(a) * d * .85;
        lobes += `<path ${T(lx, ly)} d="${xcnSmooth(ring(rr, 9, .3, R, 1.15, .9))}" fill="${p.g(c, .5, .18)}" stroke="${dk(c, .2)}" stroke-width=".7"/>`;
        folds += `M${f1(lx - rr * .5)},${f1(ly + rr * .3)} Q${f1(lx)},${f1(ly + rr * .6)} ${f1(lx + rr * .5)},${f1(ly + rr * .25)}`;
    }
    return `<g ${T(x, y, r)}>${lobes}
        <path d="${folds}" stroke="${dk(c, .15)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="${f1(s * .14)}" cy="${f1(-s * .02)}" rx="${f1(s * .08)}" ry="${f1(s * .05)}" fill="#e3a640" opacity=".35"/>
        <path d="M${f1(-s * .3)},${f1(-s * .1)} Q${f1(-s * .16)},${f1(-s * .28)} ${f1(s * .06)},${f1(-s * .26)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// 炒り卵の小さなかけら（炒飯・韭菜炒蛋）: 軽い1片
function xcnEggBit(p, x, y, s, r = 0, { seed = 1, c = '#f9d54a' } = {}){
    const R = rng(p.id + 'xcnEb' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${xcnSmooth(ring(s / 2, 7, .45, R, 1.2, .85), true, .9)}" fill="${p.g(c, .45, .18)}" stroke="${dk(c, .22)}" stroke-width=".6"/><path d="M${f1(-s * .26)},${f1(-s * .08)} Q${f1(-s * .06)},${f1(-s * .26)} ${f1(s * .16)},${f1(-s * .16)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
function xcnTomato(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnTm' + seed + x + y);
    const pts = ring(9.5, 8, .3, R, 1.18, .78);
    return `<g ${T(x, y, r, s / 20)}><path d="${xcnSmooth(pts, true, .7)}" fill="${p.g('#e0392a', .3, .25)}" stroke="#a6261a" stroke-width=".6"/>
        <path d="${xcnSmooth(pts.map(([a, b]) => [a * .64, b * .56 + 1.2]), true, .7)}" fill="#f2694c" opacity=".95"/>
        <path d="M-4.4,1.6 Q-2.8,-.8 -1.2,1.6 M1.2,1.8 Q2.8,-.6 4.4,1.8" stroke="#f6c463" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-3.8 Q-1,-7.4 5,-5.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 乾燥唐辛子
function xcnChili(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><path d="M-10,0 Q-8,-3.6 0,-3.6 Q8,-3.4 10,-.6 Q8,3 0,3.4 Q-8,3.6 -10,0Z" fill="${p.g('#b8231a', .3, .35)}" stroke="#6a0e08" stroke-width=".7"/>
        <path d="M-10,0 Q-11.5,0 -11.5,-.2" stroke="#6a0e08" stroke-width="1" fill="none"/>
        <path d="M-6,-1.8 Q0,-3 6,-1.8" stroke="#ff8a6a" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".75"/>
        <circle cx="2" cy="1" r=".8" fill="#f1d38a"/><circle cx="-2" cy="1.4" r=".7" fill="#f1d38a"/></g>`;
}
// 生の唐辛子の輪切り
const xcnChiliRing = (x, y, s = 7, c = '#d42a1c') => `<g ${T(x, y)}><circle r="${f1(s / 2)}" fill="none" stroke="${c}" stroke-width="${f1(s * .28)}"/><circle r="${f1(s * .14)}" fill="#f6d68a"/></g>`;
function xcnScallionSeg(p, x, y, s, r = 0, { green = false } = {}){
    const c = green ? '#8cc456' : '#f1f3df', h = s * .42;
    return `<g ${T(x, y, r)}><rect x="${f1(-s / 2)}" y="${f1(-h / 2)}" width="${f1(s)}" height="${f1(h)}" rx="${f1(h * .4)}" fill="${p.g(c, .3, .18)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        <path d="M${f1(-s * .38)},${f1(-h * .1)} L${f1(s * .38)},${f1(-h * .1)}" stroke="${dk(c, .12)}" stroke-width=".6"/>
        <path d="M${f1(-s * .36)},${f1(-h * .3)} L${f1(s * .2)},${f1(-h * .3)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`;
}
function xcnFineShreds(p, x, y, s, { c = '#f2f4e2', n = 16, w = 1.4, seed = 1, dir = -.4, len = .7 } = {}){
    const R = rng(p.id + 'xcnFs' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){
        const a = dir + (R() - .5) * .9, L = s * len * (.6 + R() * .5), cx = x + (R() - .5) * s * .7, cy = y + (R() - .5) * s * .4;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, b = (R() - .5) * 4;
        d += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx + b)} ${f1(cy - b)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(w + .8)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
function xcnWoodEar(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnWe' + seed + x + y);
    const pts = ring(s / 2, 14, .42, R, 1.15, .85);
    return `<g ${T(x, y, r)}><path d="${xcnSmooth(pts, true, .9)}" fill="${p.g('#3d2c28', .28, .35)}" stroke="#140a08" stroke-width=".7"/>
        <path d="${xcnSmooth(pts.map(([a, b]) => [a * .62, b * .62]), true, .9)}" fill="none" stroke="#6e5a52" stroke-width="1" opacity=".7"/>
        <path d="M${f1(-s * .32)},${f1(-s * .1)} Q${f1(-s * .15)},${f1(-s * .32)} ${f1(s * .12)},${f1(-s * .3)}" stroke="#b8a8a0" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function xcnCilantro(p, x, y, s, r = 0){
    const lobe = a => `<path transform="rotate(${a})" d="M0,0 Q-5,-3 -4.6,-7 Q-2.4,-9.6 0,-8 Q2.4,-9.6 4.6,-7 Q5,-3 0,0Z" fill="#4c9a32" stroke="#2c6a1e" stroke-width=".6"/>`;
    return `<g ${T(x, y, r, s / 16)}><path d="M0,0 L0,7" stroke="#7fb850" stroke-width="1.2" stroke-linecap="round"/>${lobe(-62)}${lobe(0)}${lobe(62)}<path d="M0,-1 L0,-6 M0,-1 L-4,-4 M0,-1 L4,-4" stroke="#8cc866" stroke-width=".5"/></g>`;
}
function xcnEggCloud(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'xcnEc' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${xcnSmooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${xcnSmooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${xcnSmooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
function xcnWinterMelon(p, x, y, s, r = 0, { seed = 1, c = '#e3ebc6', braised = false } = {}){
    const R = rng(p.id + 'xcnWm' + seed + x + y);
    const w = s, h = s * .72, j = () => (R() - .5) * 2;
    const pts = [[-w / 2 + j(), -h / 2 + j()], [w / 2 + j(), -h / 2 + j()], [w / 2 + j(), h / 2 + j()], [-w / 2 + j(), h / 2 + j()]];
    const skin = braised ? '#4f6a2e' : '#5f8a3e';
    return `<g ${T(x, y, r)}><path d="${xcnSmooth(pts, true, .35)}" fill="${p.g(c, .4, .2)}" stroke="${dk(c, .25)}" stroke-width=".7" opacity=".95"/>
        <path d="M${f1(pts[3][0] + 1)},${f1(pts[3][1] - 1.4)} L${f1(pts[2][0] - 1)},${f1(pts[2][1] - 1.4)}" stroke="${skin}" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M${f1(pts[3][0] + 2)},${f1(pts[3][1] - 4)} L${f1(pts[2][0] - 2)},${f1(pts[2][1] - 4)}" stroke="${lt(skin, .4)}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
        <path d="M${f1(-w * .3)},${f1(-h * .2)} Q${f1(-w * .05)},${f1(-h * .36)} ${f1(w * .24)},${f1(-h * .28)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// スペアリブのぶつ切り（骨の断面つき）
function xcnRib(p, x, y, s, r = 0, { c = '#a87556', seed = 1, gloss = .6 } = {}){
    const R = rng(p.id + 'xcnRb' + seed + x + y);
    const w = s, h = s * .62, j = () => (R() - .5) * s * .08;
    const pts = [[-w / 2 + j(), -h / 2 + j()], [0, -h / 2 - 1 + j()], [w / 2 + j(), -h / 2 + j()], [w / 2 + 1, 0], [w / 2 + j(), h / 2 + j()], [0, h / 2 + 1 + j()], [-w / 2 + j(), h / 2 + j()], [-w / 2 - 1, 0]];
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xcnSmooth(pts, true, .6)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M${f1(-w * .3)},${f1(-h * .05)} Q${f1(-w * .05)},${f1(-h * .2)} ${f1(w * .2)},${f1(-h * .05)} M${f1(-w * .25)},${f1(h * .22)} Q0,${f1(h * .1)} ${f1(w * .22)},${f1(h * .24)}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".55"/>
        <rect x="${f1(-w * .62)}" y="${f1(-h * .22)}" width="${f1(w * .2)}" height="${f1(h * .44)}" rx="${f1(h * .2)}" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae90" stroke-width=".7"/>
        <ellipse cx="${f1(-w * .58)}" cy="0" rx="${f1(w * .05)}" ry="${f1(h * .12)}" fill="#d4a88a"/>
        <path d="M${f1(-w * .32)},${f1(-h * .32)} Q${f1(-w * .05)},${f1(-h * .48)} ${f1(w * .26)},${f1(-h * .36)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="${gloss}"/></g>`;
}
function xcnNapa(p, x, y, s, r = 0, { seed = 1, cooked = false } = {}){
    const R = rng(p.id + 'xcnNp' + seed + x);
    const lc = cooked ? '#b4cc78' : '#bcd97a', wc = cooked ? '#f1ecd6' : '#f6f4e8';
    const leaf = xcnSmooth([[-13, -2], [-12, -9], [-6, -13], [0, -11], [6, -14], [12, -9], [13, -2], [6, -4], [-6, -4]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]));
    return `<g ${T(x, y, r, s / 30)}><path d="${leaf}" fill="${p.g(lc, .3, .25)}" stroke="${dk(lc, .3)}" stroke-width=".7"/>
        <path d="M-8,-8 Q-4,-6 -2,-4 M3,-10 Q4,-7 3,-4 M9,-8 Q7,-6 6,-4" stroke="#e6f1c2" stroke-width=".9" fill="none"/>
        <path d="M-12,-4 Q0,-7 12,-4 L11,9 Q0,12 -11,9Z" fill="${p.g(wc, .2, .18)}" stroke="#cfcab0" stroke-width=".7"/>
        <path d="M-7,-3 L-6.5,9 M-1,-4 L-1,10 M5,-4 L5,9.6" stroke="#e2dec6" stroke-width="1.1"/>
        <path d="M-9,-2.5 Q0,-5.4 9,-2.6" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
function xcnBok(p, x, y, s, r = 0, { seed = 1, leaf = true, cooked = false } = {}){
    const R = rng(p.id + 'xcnBk' + seed + x);
    const lc = cooked ? '#3a7a2a' : '#3f8c2e';
    const lf = leaf ? `<path d="${xcnSmooth([[4, -8], [14, -14], [26, -12], [30, -2], [28, 9], [17, 13], [5, 7]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]))}" fill="${p.g(lc, .25, .3)}" stroke="#25601c" stroke-width=".7"/>
        <path d="M2,0 Q15,-1 28,-1 M14,-1 L20,-8 M14,-1 L20,7 M22,-1 L26,-6 M22,-1 L26,5" stroke="#8cc566" stroke-width=".9" fill="none"/>` : '';
    return `<g ${T(x, y, r, s / 50)}>${lf}
        <path d="M-24,0 Q-24,-9 -14,-9.5 Q-2,-8 8,-3.5 L8,3.5 Q-2,8 -14,9.5 Q-24,9 -24,0Z" fill="${p.g('#bfe08a', .35, .22)}" stroke="#7fae4c" stroke-width=".7"/>
        <path d="M-20,-3 Q-8,-4 6,-1.5 M-20,3 Q-8,4 6,1.5" stroke="#d9efb6" stroke-width=".9" fill="none"/>
        <path d="M-20,-5.5 Q-12,-8 -2,-6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
function xcnNasu(p, x, y, s, r = 0, { flesh = '#c99050', skin = '#4a2252', seed = 1 } = {}){
    const R = rng(p.id + 'xcnNs' + seed + x + y);
    const pts = [[-10, -3], [-4, -9], [7, -8], [10, 2], [5, 8], [-6, 7]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]);
    const inner = [pts[0], pts[1], pts[2], [pts[3][0] - 3.4, pts[3][1] - 1.6], [pts[4][0] - 2.6, pts[4][1] - 3.4], [pts[5][0] + .6, pts[5][1] - 3.6]];
    return `<g ${T(x, y, r, s / 20)}><path d="${xcnSmooth(pts, true, .6)}" fill="${p.g(skin, .3, .25)}" stroke="#26102c" stroke-width=".6"/>
        <path d="${xcnSmooth(inner, true, .6)}" fill="${p.g(flesh, .3, .25)}" stroke="${dk(flesh, .25)}" stroke-width=".5"/>
        <path d="M-6,-4 Q-1,-7.4 5,-6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M8,1 Q6,5.5 2.5,7" stroke="#c8a0d8" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function xcnPeanut(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .34)}" fill="${p.g('#e9c58a', .3, .28)}" stroke="#a87638" stroke-width=".6"/>
        <path d="M${f1(-s * .42)},0 Q0,${f1(s * .06)} ${f1(s * .42)},0" stroke="#c49556" stroke-width=".7" fill="none"/>
        <ellipse cx="${f1(-s * .16)}" cy="${f1(-s * .14)}" rx="${f1(s * .14)}" ry="${f1(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// あさり（z_soup.mjs の部品）
function xcnClam(p, x, y, s, r = 0, { seed = 1, meat = '#f0b46c' } = {}){
    const R = rng(p.id + 'xcncl' + seed + x + y);
    const outerC = ['#a8957c', '#8f8170', '#b39c80', '#7f766c'][Math.floor(R() * 4)];
    const shell = `M0,0 C-3,1 -11,4 -12,10 C-12.5,15 -7,18 0,18 C7,18 12.5,15 12,10 C11,4 3,1 0,0Z`;
    const valve = a => `<g transform="rotate(${a})"><path d="${shell}" fill="${p.g(outerC, .2, .3)}" stroke="${dk(outerC, .4)}" stroke-width=".7"/>
        <path d="M0,1.6 C-3,2.6 -9.6,5 -10.4,10 C-10.8,14 -6.4,16.4 0,16.4 C6.4,16.4 10.8,14 10.4,10 C9.6,5 3,2.6 0,1.6Z" fill="${p.g('#f1ebed', .3, .14)}"/>
        <path d="M-9,13.6 Q0,18 9,13.6" stroke="#9a86b0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
    return `<g ${T(x, y, r, s / 30)}><g ${p.sh(.6)}>${valve(-62)}${valve(62)}</g>
        <g transform="rotate(-62)"><path d="M-7,9 C-7,3.5 7,3.5 7.4,9 C7.6,14 3,15.6 0,15.4 C-4,15.2 -7,13 -7,9Z" fill="${p.g(meat, .32, .28)}" stroke="${dk(meat, .32)}" stroke-width=".6"/>
        <path d="M-4,7.4 Q0,5.4 3.6,7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".75"/></g></g>`;
}
function xcnTofuChunk(p, x, y, s, r = 0, { seed = 1, c = '#f8f3e6' } = {}){
    const R = rng(p.id + 'xcntf' + seed + x + y);
    const pts = ring(s / 2, 9, .32, R, 1.15, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xcnSmooth(pts, true, .75)}" fill="${p.g(c, .3, .18)}" stroke="${dk(c, .2)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .3)},${f1(-s * .14)} Q${f1(-s * .1)},${f1(-s * .3)} ${f1(s * .16)},${f1(-s * .26)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
function xcnStrip(p, x, y, L, w, r = 0, c = '#f6f0e0'){
    return `<g ${T(x, y, r)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${L}" height="${w}" rx="${f1(w * .4)}" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .25)}" stroke-width=".5"/></g>`;
}
// さいの目（上面と少しの側面）
function xcnDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f1(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f1(s * .86)}" height="${f1(s * .86)}" rx="${f1(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f1(-h + s * .18)},${f1(-h + s * .2)} L${f1(-h + s * .62)},${f1(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}

// =========================================================
// 具（このファイルで描いたもの）
// =========================================================
// ごろっとした肉のかたまり（牛すね・羊肉）: 角の丸い不定形、繊維の筋、照り
function xcnChunk(p, x, y, s, r = 0, { c = '#7a4428', seed = 1, gloss = .55, fat = null } = {}){
    const R = rng(p.id + 'xcnCk' + seed + x + y);
    const pts = ring(s / 2, 8, .28, R, 1.12, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${xcnSmooth(pts, true, .55)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .38)}" stroke-width=".7"/></g>
        ${fat ? `<path d="${xcnSmooth(pts.slice(0, 4).map(([a, b]) => [a * .86, b * .86]), false)}" stroke="${fat}" stroke-width="${f1(s * .12)}" fill="none" stroke-linecap="round" opacity=".85"/>` : ''}
        <path d="M${f1(-s * .3)},${f1(-s * .02)} Q${f1(-s * .05)},${f1(-s * .14)} ${f1(s * .28)},${f1(-s * .02)} M${f1(-s * .26)},${f1(s * .16)} Q0,${f1(s * .06)} ${f1(s * .26)},${f1(s * .18)}" stroke="${dk(c, .35)}" stroke-width=".8" fill="none" opacity=".55"/>
        <path d="M${f1(-s * .3)},${f1(-s * .2)} Q${f1(-s * .1)},${f1(-s * .34)} ${f1(s * .14)},${f1(-s * .3)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="${gloss}"/></g>`;
}
// 鶏肉のぶつ切り（骨つき・皮つき、煮込み）
function xcnChickenBone(p, x, y, s, r = 0, { c = '#c88a4a', seed = 1, gloss = .6 } = {}){
    const R = rng(p.id + 'xcnCb' + seed + x + y);
    const pts = ring(s / 2, 9, .26, R, 1.15, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${xcnSmooth(pts, true, .6)}" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .36)}" stroke-width=".7"/></g>
        <path d="${xcnSmooth(pts.map(([a, b]) => [a * .7 + s * .06, b * .62 + s * .05]), true, .6)}" fill="${dk(c, .12)}" opacity=".35"/>
        <path d="M${f1(-s * .2)},${f1(s * .06)} q${f1(s * .1)},${f1(-s * .06)} ${f1(s * .2)},0" stroke="${dk(c, .3)}" stroke-width=".7" fill="none" opacity=".5"/>
        <ellipse cx="${f1(s * .42)}" cy="${f1(s * .04)}" rx="${f1(s * .08)}" ry="${f1(s * .11)}" fill="#f1e6d0" stroke="#c4ae8a" stroke-width=".6"/>
        <path d="M${f1(-s * .32)},${f1(-s * .16)} Q${f1(-s * .12)},${f1(-s * .32)} ${f1(s * .14)},${f1(-s * .28)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="${gloss}"/></g>`;
}
// 手羽中（可乐鸡翅）: くびれた長丸、つやのある飴色の皮
function xcnWing(p, x, y, s, r = 0, { c = '#8a4214', seed = 1 } = {}){
    const R = rng(p.id + 'xcnWg' + seed + x + y);
    const L = s, h = s * .72, j = () => (R() - .5) * s * .04;
    const pts = [[-L / 2, -h * .05 + j()], [-L * .42, -h * .36 + j()], [-L * .15, -h * .42 + j()], [L * .15, -h * .5 + j()], [L * .42, -h * .5 + j()], [L / 2, -h * .1 + j()], [L * .44, h * .4 + j()], [L * .15, h * .5 + j()], [-L * .15, h * .44 + j()], [-L * .42, h * .36 + j()]];
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xcnSmooth(pts, true, .9)}" fill="${p.g(c, .32, .35)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        <path d="M${f1(-L * .3)},${f1(h * .1)} Q${f1(-L * .1)},${f1(h * .25)} ${f1(L * .2)},${f1(h * .08)} M${f1(-L * .2)},${f1(-h * .08)} Q0,${f1(h * .05)} ${f1(L * .28)},${f1(-h * .12)}" stroke="${dk(c, .35)}" stroke-width=".9" fill="none" opacity=".5"/>
        <ellipse cx="${f1(L * .46)}" cy="0" rx="${f1(L * .04)}" ry="${f1(h * .2)}" fill="#e6cfa8" opacity=".85"/><ellipse cx="${f1(-L * .46)}" cy="0" rx="${f1(L * .035)}" ry="${f1(h * .16)}" fill="#e6cfa8" opacity=".7"/>
        <path d="M${f1(-L * .36)},${f1(-h * .26)} Q${f1(-L * .05)},${f1(-h * .42)} ${f1(L * .3)},${f1(-h * .26)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
        <circle cx="${f1(L * .14)}" cy="${f1(h * .12)}" r="1" fill="#fff" opacity=".6"/></g>`;
}
// 殻つきの大えび（頭つき、上から見て弧を描く）。頭は弧の始まり
function xcnPrawn(p, x, y, s, r = 0, { c = '#dd5226', span = 1.7 } = {}){
    const N = 12, C = [], W = [], Rc = s * .54, my = Rc * (1 + Math.cos(span / 2)) / 2;
    for (let i = 0; i <= N; i++){
        const t = i / N, th = Math.PI * .5 + span / 2 - t * span;
        C.push([Math.cos(th) * Rc, Math.sin(th) * Rc - my]);
        W.push(s * (t < .34 ? .085 + Math.sin(t / .34 * Math.PI / 2) * .025 : .11 * (1 - (t - .34) / .66 * .55)));
    }
    const nrm = i => { const a = C[Math.max(0, i - 1)], b = C[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
    const up = C.map((q, i) => { const n = nrm(i); return [q[0] + n[0] * W[i], q[1] + n[1] * W[i]]; });
    const lo = C.map((q, i) => { const n = nrm(i); return [q[0] - n[0] * W[i], q[1] - n[1] * W[i]]; });
    const body = xcnSmooth([...up, ...lo.slice().reverse()], true, .8);
    const hd = 4;
    const head = xcnSmooth([...up.slice(0, hd + 1), ...lo.slice(0, hd + 1).reverse()], true, .8);
    let seg = '';
    for (const i of [5, 6, 7, 8, 9, 10]) seg += `M${f1(up[i][0])},${f1(up[i][1])}L${f1(lo[i][0])},${f1(lo[i][1])}`;
    const e = C[N], e2 = C[N - 1], ang = Math.atan2(e[1] - e2[1], e[0] - e2[0]) * 57.3;
    const tail = `<g ${T(e[0], e[1], ang)}><path d="M-1,0 L${f1(s * .13)},${f1(-s * .09)} Q${f1(s * .16)},0 ${f1(s * .13)},${f1(s * .09)}Z" fill="${p.g(dk(c, .05), .2, .3)}" stroke="${dk(c, .4)}" stroke-width=".6"/><path d="M0,0 L${f1(s * .13)},0" stroke="${dk(c, .35)}" stroke-width=".6"/></g>`;
    const h0 = C[0], h1 = C[1], ha = Math.atan2(h0[1] - h1[1], h0[0] - h1[0]);
    const fx = Math.cos(ha), fy = Math.sin(ha), nx = -fy, ny = fx;
    const ant = `M${f1(h0[0])},${f1(h0[1])} Q${f1(h0[0] + fx * s * .3 + nx * s * .1)},${f1(h0[1] + fy * s * .3 + ny * s * .1)} ${f1(h0[0] + fx * s * .22 + nx * s * .26)},${f1(h0[1] + fy * s * .22 + ny * s * .26)} M${f1(h0[0])},${f1(h0[1])} Q${f1(h0[0] + fx * s * .34 - nx * s * .02)},${f1(h0[1] + fy * s * .34 - ny * s * .02)} ${f1(h0[0] + fx * s * .3 - nx * s * .16)},${f1(h0[1] + fy * s * .3 - ny * s * .16)}`;
    let legs = '';
    for (const i of [2, 3, 5, 6, 7]){ const n = nrm(i); legs += `M${f1(lo[i][0])},${f1(lo[i][1])}l${f1(-n[0] * s * .07)},${f1(-n[1] * s * .07)}`; }
    return `<g ${T(x, y, r)}><path d="${ant}" stroke="${dk(c, .15)}" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="${legs}" stroke="${dk(c, .1)}" stroke-width="1" stroke-linecap="round" opacity=".8"/>
        <g ${p.sh(1)}>${tail}<path d="${body}" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .42)}" stroke-width=".8"/></g>
        <path d="${head}" fill="${p.g(dk(c, .1), .3, .25)}" stroke="${dk(c, .42)}" stroke-width=".7"/>
        <path d="M${f1(h0[0])},${f1(h0[1])} l${f1(fx * s * .14)},${f1(fy * s * .14)}" stroke="${dk(c, .3)}" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="${f1(up[1][0])}" cy="${f1(up[1][1])}" r="${f1(s * .03)}" fill="#2a120a"/>
        <path d="${seg}" stroke="${dk(c, .3)}" stroke-width=".9" fill="none" opacity=".6"/>
        <path d="${xcnSm(C.slice(2, 10).map(([a, b], i) => { const n = nrm(i + 2); return [a + n[0] * W[i + 2] * .45, b + n[1] * W[i + 2] * .45]; }))}" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 太刀魚のぶつ切り（上から: 背側は細い背びれ、腹側は丸く細る。焼いた銀の皮に照りのたれ）
function xcnHairtail(p, x, y, w, h, r = 0, { c = '#a8692e', seed = 1 } = {}){
    const R = rng(p.id + 'xcnHt' + seed + x + y);
    const j = () => (R() - .5) * 1.6;
    const pts = [[-w / 2 + j(), -h / 2], [w / 2 + j(), -h / 2], [w / 2 - 1 + j(), h * .2], [w * .3, h / 2 - 1], [-w * .3, h / 2 - 1], [-w / 2 + 1 + j(), h * .2]];
    let fin = '';
    for (let i = 0; i < 8; i++){ const fx = -w / 2 + 2 + i * (w - 4) / 7; fin += `M${f1(fx)},${f1(-h / 2 + 1)}l${f1(1.4)},${f1(-4)}`; }
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f1((R() - .5) * w * .6)}" cy="${f1((R() - .5) * h * .6)}" rx="${f1(2 + R() * 3)}" ry="${f1(1.2 + R() * 1.4)}" fill="#5a2a0a" opacity="${f1(.25 + R() * .25)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="M${f1(-w / 2 + 1)},${f1(-h / 2 + 1)} L${f1(w / 2 - 1)},${f1(-h / 2 + 1)} L${f1(w / 2 - 2)},${f1(-h / 2 - 3.8)} L${f1(-w / 2 + 2)},${f1(-h / 2 - 3.8)}Z" fill="#6a4420" opacity=".75"/>
        <path d="${xcnSmooth(pts, true, .4)}" fill="${p.g(c, .32, .32)}" stroke="${dk(c, .42)}" stroke-width=".8"/></g>
        <path d="${fin}" stroke="${dk(c, .45)}" stroke-width=".5" opacity=".5"/>
        <path d="M${f1(-w / 2 + 2)},${f1(-h * .08)} L${f1(w / 2 - 2)},${f1(-h * .1)}" stroke="#5a2e10" stroke-width="1" opacity=".5"/>
        <path d="${xcnSmooth(pts.map(([a, b]) => [a * .8, b * .5 - h * .05]), true, .4)}" fill="#e4e0d4" opacity=".2"/>
        ${ch}
        <path d="M${f1(-w * .3)},${f1(h * .1)} Q${f1(-w * .34)},${f1(-h * .25)} ${f1(-w * .1)},${f1(-h * .36)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 獅子頭（大きな肉団子: こんがり、ひき肉のでこぼこ、たれの照り）
function xcnLionHead(p, x, y, s, { c = '#9a5226' } = {}){
    const R = rng(p.id + 'xcnLh' + x + y);
    let bumps = '';
    for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .38; bumps += `<circle cx="${f1(x + Math.cos(a) * d)}" cy="${f1(y + Math.sin(a) * d)}" r="${f1(s * (.04 + R() * .04))}" fill="${R() < .5 ? dk(c, .25) : lt(c, .2)}" opacity=".55"/>`; }
    return `<g ${p.sh(1.2)}><g ${p.rough(2.4, .14)}><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${p.rg(c, .3, .4, .36, .34)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g></g>
        ${bumps}
        <ellipse cx="${f1(x - s * .14)}" cy="${f1(y - s * .18)}" rx="${f1(s * .18)}" ry="${f1(s * .08)}" fill="#fff" opacity=".6" transform="rotate(-25 ${f1(x - s * .14)} ${f1(y - s * .18)})"/>
        <circle cx="${f1(x + s * .12)}" cy="${f1(y - s * .26)}" r="1.2" fill="#fff" opacity=".7"/>`;
}
// 餃子（上から: 三日月、上の縁にひだ）
function xcnDumpling(p, x, y, s, r = 0, { c = '#f0e2c0', seed = 1 } = {}){
    const R = rng(p.id + 'xcnDp' + seed + x + y);
    const k = s / 30;
    const j = () => (R() - .5) * 1.4;
    const body = `M-15,4 C-15,${f1(-6 + j())} -7,${f1(-11 + j())} 0,-11 C7,${f1(-11 + j())} 15,${f1(-6 + j())} 15,4 C9,9 -9,9 -15,4Z`;
    let pl = '';
    for (let i = 0; i < 6; i++){ const t = -.7 + i * .28, px = Math.sin(t) * 12, py = -Math.cos(t) * 9 + 1; pl += `M${f1(px)},${f1(py)} q${f1(Math.sin(t) * 2.4 - 1)},${f1(3.6)} ${f1(Math.sin(t) * 1.2 + 1)},${f1(6)}`; }
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}><path d="${body}" fill="${p.g(c, .4, .2)}" stroke="${dk(c, .26)}" stroke-width=".8"/></g>
        <path d="M-13,1 C-12,-7 -6,-10 0,-10 C6,-10 12,-7 13,1" stroke="${dk(c, .1)}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="${pl}" stroke="${dk(c, .22)}" stroke-width=".8" fill="none" stroke-linecap="round"/>
        <path d="M-9,4 C-4,6.4 4,6.4 9,4" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="2" cy="2" rx="6" ry="2.6" fill="#e9d6b4" opacity=".35"/></g>`;
}
// 白身魚の薄切り（煮て白くちぢれた1枚）
function xcnFishSlice(p, x, y, s, r = 0, { c = '#fbf6ea', seed = 1 } = {}){
    const R = rng(p.id + 'xcnFsl' + seed + x + y);
    const pts = ring(s / 2, 10, .3, R, 1.25, .72);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xcnSmooth(pts, true, .8)}" fill="${p.g(c, .3, .16)}" stroke="${dk(c, .2)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .3)},${f1(s * .08)} Q0,${f1(-s * .04)} ${f1(s * .26)},${f1(s * .12)}" stroke="${dk(c, .12)}" stroke-width=".9" fill="none" opacity=".8"/>
        <path d="M${f1(-s * .34)},${f1(-s * .12)} Q${f1(-s * .1)},${f1(-s * .3)} ${f1(s * .2)},${f1(-s * .2)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// 酸菜（漬けた高菜の黄緑の切れ端）
function xcnSuancai(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnSc' + seed + x + y);
    const col = R() < .5 ? '#b9b25a' : '#a8a64e';
    return `<g ${T(x, y, r)}><path d="${xcnSmooth(ring(s / 2, 8, .38, R, 1.4, .6), true, .7)}" fill="${p.g(col, .3, .25)}" stroke="${dk(col, .35)}" stroke-width=".6"/>
        <path d="M${f1(-s * .5)},0 L${f1(s * .5)},${f1((R() - .5) * 2)}" stroke="#e2dca0" stroke-width="${f1(s * .1)}" stroke-linecap="round" opacity=".8"/></g>`;
}
// 腊肠の斜め切り（赤い肉に白い脂の粒）
function xcnLapCheong(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnLc' + seed + x + y);
    let dots = '';
    for (let i = 0; i < 7; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; dots += `<ellipse cx="${f1(Math.cos(a) * d * 1.4)}" cy="${f1(Math.sin(a) * d * .8)}" rx="${f1(.9 + R() * .9)}" ry="${f1(.7 + R() * .6)}" fill="#f4e2c4"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .3)}" fill="#7a1a10"/></g><ellipse rx="${f1(s / 2 - 1.2)}" ry="${f1(s * .3 - 1.2)}" fill="${p.g('#c43a2a', .25, .25)}"/>
        ${dots}<path d="M${f1(-s * .3)},${f1(-s * .14)} Q0,${f1(-s * .24)} ${f1(s * .28)},${f1(-s * .14)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 干ししいたけ（もどして煮たもの、上から）
function xcnShiitake(p, x, y, s, r = 0, { c = '#6e4226' } = {}){
    const R = rng(p.id + 'xcnSh' + x + y);
    let cr = '';
    for (let i = 0; i < 5; i++){ const a = R() * 6.28, d = R() * s * .3; cr += `M${f1(Math.cos(a) * d)},${f1(Math.sin(a) * d)}l${f1((R() - .5) * s * .2)},${f1((R() - .5) * s * .2)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xcnSmooth(ring(s / 2, 9, .12, R), true, .9)}" fill="${p.rg(c, .25, .32, .35, .32)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="${cr}" stroke="#d8bf9a" stroke-width="1" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .2)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" fill="#fff" opacity=".4"/></g>`;
}
// 香ばしく揚げたねぎ（葱油）: 濃い茶色のちぢれた小片
function xcnFriedScallion(p, x, y, s, { n = 16, seed = 1 } = {}){
    const R = rng(p.id + 'xcnFsc' + seed + x + y);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, ang = R() * 6.28, L = 6 + R() * 8;
        const seg = `M${f1(cx - Math.cos(ang) * L / 2)},${f1(cy - Math.sin(ang) * L / 2)}q${f1((R() - .5) * 5)},${f1((R() - .5) * 5)} ${f1(Math.cos(ang) * L)},${f1(Math.sin(ang) * L)}`;
        if (R() < .5) d1 += seg; else d2 += seg;
    }
    return `<path d="${d1}" stroke="#3a1c08" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="${d2}" stroke="#6a3a12" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="${d2}" stroke="#a8682a" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// 春雨・粉条（透けた細麺の束）
function xcnGlassNoodles(p, x, y, s, { c = '#d9c6a0', n = 26, w = 1.8, seed = 1, sy = .85, op = .8, hi = true } = {}){
    const R = rng(p.id + 'xcnGn' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){
        const a0 = R() * 6.28, rr = s / 2 * (.2 + R() * .75), sw = 1 + R() * 2;
        const pts = Array.from({ length: 6 }, (_, j) => { const a = a0 + j / 5 * sw; const q = rr * (1 + (R() - .5) * .35); return [x + Math.cos(a) * q, y + Math.sin(a) * q * sy]; });
        d += xcnSm(pts);
    }
    return `<path d="${d}" stroke="${dk(c, .25)}" stroke-width="${f1(w + .9)}" fill="none" stroke-linecap="round" opacity="${f1(op * .7)}"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>${hi ? `<path d="${d}" stroke="#fff" stroke-width="${f1(w * .3)}" fill="none" stroke-linecap="round" opacity=".35" transform="translate(-.4 -.5)"/>` : ''}`;
}
// 豚バラの薄切り（kit の porkSlice を中華の色で）
const xcnPorkSlice = (p, x, y, s, r, o = {}) => K.porkSlice(p, x, y, s, r, { c: '#b8703c', fat: '#f2dcb0', ...o });
// 長い唐辛子・青椒（虎皮青椒: 焼けて皺の寄った長いさや）
function xcnLongPepper(p, x, y, L, r = 0, { c = '#4f8f2a', seed = 1, blister = .8 } = {}){
    const R = rng(p.id + 'xcnLp' + seed + x + y);
    const h = L * .17;
    const pts = [[-L / 2, 0], [-L * .44, -h * .48], [-L * .2, -h * .5], [L * .1, -h * .46], [L * .34, -h * .36], [L / 2, -h * .05], [L * .34, h * .34], [L * .1, h * .48], [-L * .2, h * .5], [-L * .44, h * .48]].map(([a, b]) => [a, b + Math.sin(a / L * 6 + seed) * h * .12]);
    let bl = '';
    for (let i = 0; i < 7; i++){ const bx = -L * .38 + R() * L * .74, by = (R() - .5) * h * .6; bl += `<ellipse cx="${f1(bx)}" cy="${f1(by)}" rx="${f1(2 + R() * 3.2)}" ry="${f1(1.3 + R() * 1.6)}" fill="${R() < .5 ? '#3a2a10' : '#6a5a22'}" opacity="${f1(blister * (.35 + R() * .4))}"/>`; }
    let wr = '';
    for (let i = 0; i < 4; i++){ const wx = -L * .3 + i * L * .2 + (R() - .5) * 4; wr += `M${f1(wx)},${f1(-h * .4)}q${f1(2)},${f1(h * .4)} 0,${f1(h * .8)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${xcnSmooth(pts, true, .9)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        ${bl}<path d="${wr}" stroke="${dk(c, .35)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f1(-L / 2 + 1)},0 q${f1(-L * .06)},${f1(-h * .3)} ${f1(-L * .1)},${f1(-h * .2)}" stroke="#6a8a2a" stroke-width="${f1(h * .3)}" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-L * .34)},${f1(-h * .26)} Q0,${f1(-h * .46)} ${f1(L * .3)},${f1(-h * .24)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 干煸のいんげん（皺の寄ったさやに焦げ目）
function xcnBlisterBean(p, x, y, L, r = 0, { seed = 1, c = '#5a8f2e' } = {}){
    const R = rng(p.id + 'xcnBb' + seed + x + y);
    const w = 5.6, b = (R() - .5) * 5;
    const d = `M${f1(-L / 2)},0 Q0,${f1(b)} ${f1(L / 2)},0`;
    let sp = '';
    for (let i = 0; i < 3; i++){ const t = R() - .5; sp += `M${f1(t * L * .8)},${f1(b * (1 - 4 * t * t) / 2 - .8)}l${f1(1.5 + R() * 2)},0`; }
    return `<g ${T(x, y, r)}><path d="${d}" stroke="${dk(c, .4)}" stroke-width="${f1(w + 1.2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
        <path d="${sp}" stroke="#3a2a0c" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
        <path d="M${f1(-L * .35)},${f1(b * .2 - 1.2)} Q0,${f1(b * .5 - 1.4)} ${f1(L * .3)},${f1(b * .2 - 1.2)}" stroke="#d4e8a0" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// レタスの葉（波打つ大きな葉）
function xcnLettuce(p, x, y, s, r = 0, { seed = 1, c = '#6fb83c' } = {}){
    const R = rng(p.id + 'xcnLt' + seed + x + y);
    const pts = ring(s / 2, 16, .3, R, 1.2, .8);
    return `<g ${T(x, y, r)}><path d="${xcnSmooth(pts, true, .9)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="${xcnSmooth(pts.map(([a, b]) => [a * .7, b * .65]), true, .9)}" fill="${lt(c, .25)}" opacity=".5"/>
        <path d="M${f1(-s * .5)},${f1(s * .04)} Q0,${f1(-s * .04)} ${f1(s * .48)},0 M${f1(-s * .2)},0 L${f1(-s * .3)},${f1(-s * .2)} M${f1(s * .05)},0 L0,${f1(-s * .22)} M${f1(s * .05)},0 L${f1(s * .14)},${f1(s * .2)} M${f1(-s * .2)},0 L${f1(-s * .1)},${f1(s * .2)}" stroke="${lt(c, .55)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-s * .36)},${f1(-s * .16)} Q${f1(-s * .1)},${f1(-s * .32)} ${f1(s * .2)},${f1(-s * .24)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 赤い薄皮の落花生（丸ごと）
function xcnRedPeanut(p, x, y, s, r = 0, { c = '#a8361e' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .34)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".6"/><ellipse cx="${f1(-s * .14)}" cy="${f1(-s * .12)}" rx="${f1(s * .16)}" ry="${f1(s * .07)}" fill="#fff" opacity=".55"/></g>`;
}
// 腐竹（もどした湯葉の棒、斜め切り。しわの寄った淡い黄色）
function xcnFuzhu(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnFz' + seed + x + y);
    const w = L * .34, c = '#ecd088';
    const pts = [[-L / 2, -w / 2], [L / 2 - w * .4, -w / 2], [L / 2, w / 2], [-L / 2 + w * .4, w / 2]].map(([a, b]) => [a + (R() - .5) * 1.6, b + (R() - .5) * 1.6]);
    let wr = '';
    for (let i = 0; i < 4; i++){ const wx = -L * .3 + i * L * .2; wr += `M${f1(wx)},${f1(-w * .4)}q${f1(1.5)},${f1(w * .4)} ${f1(-.5)},${f1(w * .8)}`; }
    return `<g ${T(x, y, r)}><path d="${xcnSmooth(pts, true, .35)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .32)}" stroke-width=".7"/>
        <path d="${wr}" stroke="${dk(c, .2)}" stroke-width=".8" fill="none" opacity=".7"/>
        <path d="M${f1(-L * .36)},${f1(-w * .2)} L${f1(L * .26)},${f1(-w * .24)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7"/></g>`;
}
// たたききゅうり（皮の濃い緑、割れた淡い断面）
function xcnSmashedCuc(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnCu' + seed + x + y);
    const pts = ring(s / 2, 7, .45, R, 1.35, .8);
    const half = pts.slice(0, 4);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xcnSmooth(pts, true, .45)}" fill="${p.g('#d4e8a8', .25, .18)}" stroke="#2f6a22" stroke-width=".7"/></g>
        <path d="${xcnSm(half)}" stroke="${p.g('#3f7d2e', .2, .3)}" stroke-width="${f1(s * .22)}" fill="none" stroke-linecap="round"/>
        <path d="${xcnSmooth(pts.map(([a, b]) => [a * .42 - 1, b * .4 - 1]), true, .5)}" fill="#bcd98c" opacity=".9"/>
        ${[0, 1, 2].map(i => `<ellipse cx="${f1(-s * .12 + i * s * .1)}" cy="${f1(-s * .02)}" rx="1" ry=".6" fill="#f2f7e2"/>`).join('')}
        <path d="M${f1(-s * .3)},${f1(s * .06)} Q${f1(-s * .1)},${f1(-s * .1)} ${f1(s * .12)},${f1(-s * .06)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 赤いなつめ
function xcnJujube(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="${p.g('#a42218', .3, .35)}" stroke="#5a0e08" stroke-width=".6"/></g>
        <path d="M${f1(-s * .3)},${f1(-s * .05)} q${f1(s * .15)},${f1(s * .12)} ${f1(s * .3)},0 M${f1(-s * .1)},${f1(s * .14)} q${f1(s * .15)},${f1(-s * .1)} ${f1(s * .3)},0" stroke="#6a120a" stroke-width=".8" fill="none" opacity=".7"/>
        <ellipse cx="${f1(-s * .16)}" cy="${f1(-s * .14)}" rx="${f1(s * .13)}" ry="${f1(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// 枸杞の実
function xcnGoji(p, x, y, s = 6, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .3)}" fill="${p.g('#e2361e', .3, .25)}" stroke="#9a1a0c" stroke-width=".5"/><ellipse cx="${f1(-s * .14)}" cy="${f1(-s * .08)}" rx="${f1(s * .14)}" ry="${f1(s * .06)}" fill="#fff" opacity=".7"/></g>`;
}
// えのき（細い軸と小さなかさの束）
function xcnEnoki(p, x, y, L, r = 0, { n = 7, seed = 1 } = {}){
    const R = rng(p.id + 'xcnEn' + seed + x + y);
    let st = '', caps = '';
    for (let i = 0; i < n; i++){
        const off = (i - (n - 1) / 2) * 2.2, a = (R() - .5) * .3, bx = -L / 2, by = off * .5;
        const ex = L / 2 * Math.cos(a), ey = off + L / 2 * Math.sin(a);
        st += `M${f1(bx)},${f1(by)} Q0,${f1(off + (R() - .5) * 3)} ${f1(ex)},${f1(ey)}`;
        caps += `<ellipse cx="${f1(ex + 1)}" cy="${f1(ey)}" rx="2" ry="1.7" fill="#f4ecd6" stroke="#c8b890" stroke-width=".4"/>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${st}" stroke="#d8ccae" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="${st}" stroke="#faf6ea" stroke-width="1.3" fill="none" stroke-linecap="round"/>${caps}</g></g>`;
}
// 銀耳（白きくらげ: 透けたひだの房）
function xcnSilverEar(p, x, y, s, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnSe' + seed + x + y);
    let out = '';
    for (let i = 0; i < 5; i++){
        const a = i / 5 * 6.28 + R(), d = i ? s * .22 : 0, rr = s * (.26 + R() * .08);
        out += `<path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d)} d="${xcnSmooth(ring(rr, 12, .45, R, 1.1, .9), true, 1)}" fill="${p.g('#f8ecc8', .4, .15)}" opacity=".85" stroke="#c8ae78" stroke-width=".8"/><path ${T(x + Math.cos(a) * d, y + Math.sin(a) * d)} d="${xcnSmooth(ring(rr * .55, 9, .5, R, 1.1, .9), true, 1)}" fill="none" stroke="#d8c08c" stroke-width=".7" opacity=".8"/>`;
    }
    return `<g opacity=".95">${out}</g><path d="M${f1(x - s * .2)},${f1(y - s * .1)} q${f1(s * .1)},${f1(-s * .12)} ${f1(s * .22)},${f1(-s * .04)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 蓮の実
function xcnLotusSeed(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .42)}" fill="${p.g('#f1e2be', .3, .22)}" stroke="#c4a872" stroke-width=".5"/></g><path d="M0,${f1(-s * .38)} L0,${f1(s * .38)}" stroke="#c9ab72" stroke-width=".7"/><ellipse cx="${f1(-s * .16)}" cy="${f1(-s * .14)}" rx="${f1(s * .12)}" ry="${f1(s * .07)}" fill="#fff" opacity=".7"/></g>`;
}
// 緑豆（煮てはじけた小さな豆）
function xcnMungBeans(p, x, y, s, { n = 60, seed = 1 } = {}){
    const R = rng(p.id + 'xcnMb' + seed + x + y);
    let a1 = '', a2 = '', a3 = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, ang = R() * 180;
        const e = `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="2.6" ry="1.9" transform="rotate(${Math.round(ang)} ${f1(cx)} ${f1(cy)})"/>`;
        const q = R();
        if (q < .45) a1 += e; else if (q < .8) a2 += e; else a3 += `<path d="M${f1(cx - 2.4)},${f1(cy)} q2.4,-3 4.8,0 q-2.4,2 -4.8,0Z"/>`;
    }
    return `<g fill="#4f7a2a" stroke="#2e4a16" stroke-width=".5">${a1}</g><g fill="#6e9638" stroke="#3a5a1a" stroke-width=".5">${a2}</g><g fill="#e8e0b8" stroke="#a8a070" stroke-width=".5">${a3}</g>`;
}
// 疙瘩（小麦粉の小さなだんご）
function xcnGeda(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnGd' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${xcnSmooth(ring(s / 2, 7, .5, R, 1.3, .8), true, .8)}" fill="${p.g('#f2ead6', .3, .2)}" stroke="#cdbf9e" stroke-width=".5" opacity=".95"/></g>`;
}
// 豚レバーの薄切り
function xcnLiver(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnLv' + seed + x + y);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xcnSmooth(ring(s / 2, 11, .4, R, 1.3, .6), true, .8)}" fill="${p.g('#7e3a2c', .2, .2)}" stroke="#3e160e" stroke-width=".6"/></g>
        <path d="M${f1(-s * .32)},${f1(-s * .06)} Q0,${f1(-s * .16)} ${f1(s * .28)},${f1(-s * .06)}" stroke="#b86a58" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// へちま（丸い輪切りの半分、外に緑の皮）
function xcnLuffa(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f1(-s / 2)},${f1(s * .1)} A${f1(s / 2)},${f1(s * .46)} 0 0 1 ${f1(s / 2)},${f1(s * .1)} Q0,${f1(s * .26)} ${f1(-s / 2)},${f1(s * .1)}Z" fill="${p.g('#e4efc4', .35, .2)}" stroke="#4f7a30" stroke-width="1.6"/></g>
        <path d="M${f1(-s * .3)},${f1(s * .04)} Q0,${f1(-s * .2)} ${f1(s * .3)},${f1(s * .04)}" stroke="#c4d898" stroke-width="1" fill="none"/>
        ${[-.18, 0, .18].map(t => `<ellipse cx="${f1(t * s)}" cy="${f1(-s * .06)}" rx="1.1" ry=".7" fill="#f6f8e4"/>`).join('')}
        <path d="M${f1(-s * .34)},${f1(-s * .12)} Q${f1(-s * .1)},${f1(-s * .32)} ${f1(s * .18)},${f1(-s * .28)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 海帯（昆布の短冊: 波打つ縁の濃い緑褐色、つや）
function xcnKelp(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnKp' + seed + x + y);
    const w = s * .42, top = [], bot = [];
    for (let i = 0; i <= 6; i++){ const u = -s / 2 + i * s / 6; top.push([u, -w / 2 + Math.sin(i * 1.6 + seed) * 1.6 + (R() - .5)]); bot.unshift([u, w / 2 + Math.sin(i * 1.4 + seed) * 1.6 + (R() - .5)]); }
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xcnSmooth([...top, ...bot], true, .7)}" fill="${p.g('#2e3c22', .3, .3)}" stroke="#121a0a" stroke-width=".6"/></g>
        <path d="M${f1(-s * .42)},${f1(w * .1)} Q0,${f1(-w * .1)} ${f1(s * .42)},${f1(w * .12)}" stroke="#5a7040" stroke-width="1" fill="none" opacity=".7"/>
        <path d="M${f1(-s * .36)},${f1(-w * .22)} Q0,${f1(-w * .36)} ${f1(s * .3)},${f1(-w * .2)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// たけのこ（縦のくし切り: 先が細く、節の横線、照り）
function xcnShoot(p, x, y, s, r = 0, { c = '#ecd9a0', seed = 1 } = {}){
    const R = rng(p.id + 'xcnSo' + seed + x + y);
    const j = () => (R() - .5) * 1.4, w = s * .36;
    const pts = [[-s / 2, -w * .5 + j()], [-s * .1, -w * .56 + j()], [s * .3, -w * .4 + j()], [s / 2, -w * .05], [s * .3, w * .3 + j()], [-s * .1, w * .5 + j()], [-s / 2, w * .5 + j()]];
    let nd = '';
    for (let i = 0; i < 4; i++){ const nx = -s * .36 + i * s * .2, hw = w * (.48 - i * .07); nd += `M${f1(nx)},${f1(-hw)}Q${f1(nx + 1.5)},0 ${f1(nx)},${f1(hw)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xcnSmooth(pts, true, .45)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M${f1(-s * .46)},${f1(w * .05)} L${f1(s * .38)},${f1(w * .02)}" stroke="${lt(c, .3)}" stroke-width="${f1(w * .28)}" stroke-linecap="round" opacity=".55"/>
        <path d="${nd}" stroke="${dk(c, .3)}" stroke-width=".9" fill="none" opacity=".7"/>
        <path d="M${f1(-s * .38)},${f1(-w * .3)} Q${f1(-s * .05)},${f1(-w * .48)} ${f1(s * .26)},${f1(-w * .3)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 娃娃菜の縦半分（白い芯と淡い黄緑の葉先）。頭は +x
function xcnBabyNapa(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnBn' + seed + x + y);
    const h = L * .36;
    const leaf = xcnSmooth([[L * .05, -h * .5], [L * .3, -h * .56], [L * .46, -h * .4], [L * .52, 0], [L * .46, h * .42], [L * .3, h * .56], [L * .05, h * .5]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]), false);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="M${f1(-L / 2)},${f1(-h * .3)} Q${f1(-L * .3)},${f1(-h * .52)} ${f1(L * .1)},${f1(-h * .5)} L${f1(L * .1)},${f1(h * .5)} Q${f1(-L * .3)},${f1(h * .52)} ${f1(-L / 2)},${f1(h * .3)}Z" fill="${p.g('#f6f2de', .3, .18)}" stroke="#cfc8a4" stroke-width=".7"/>
        <path d="${leaf}Z" fill="${p.g('#d4e48e', .3, .25)}" stroke="#94ac4a" stroke-width=".7"/></g>
        <path d="M${f1(-L * .44)},${f1(-h * .12)} L${f1(L * .44)},${f1(-h * .1)} M${f1(-L * .44)},${f1(h * .12)} L${f1(L * .4)},${f1(h * .16)} M${f1(-L * .3)},${f1(-h * .32)} L${f1(L * .1)},${f1(-h * .36)} M${f1(-L * .3)},${f1(h * .32)} L${f1(L * .1)},${f1(h * .36)}" stroke="#e2dcbc" stroke-width="1" opacity=".9"/>
        <path d="M${f1(L * .2)},${f1(-h * .3)} q${f1(L * .06)},${f1(h * .1)} ${f1(L * .14)},${f1(h * .02)} M${f1(L * .22)},${f1(h * .3)} q${f1(L * .06)},${f1(-h * .1)} ${f1(L * .14)},0" stroke="#eef4c4" stroke-width=".9" fill="none"/>
        <path d="M${f1(-L * .4)},${f1(-h * .26)} Q${f1(-L * .1)},${f1(-h * .44)} ${f1(L * .2)},${f1(-h * .4)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// 菜心（細い茎と細長い葉、先に黄色いつぼみ）。葉は +x
function xcnChoySum(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcnCs' + seed + x + y);
    const lw = L * .13;
    const leaf = (ox, oy, a, ll) => `<path ${T(ox, oy, a)} d="M0,0 Q${f1(ll * .3)},${f1(-lw)} ${f1(ll * .7)},${f1(-lw * .8)} Q${f1(ll)},${f1(-lw * .2)} ${f1(ll)},0 Q${f1(ll * .7)},${f1(lw * .9)} ${f1(ll * .3)},${f1(lw * .7)}Z" fill="${p.g('#3c8a2c', .25, .3)}" stroke="#235a18" stroke-width=".6"/><path ${T(ox, oy, a)} d="M1,0 L${f1(ll * .9)},0" stroke="#7cbc56" stroke-width=".8"/>`;
    let bud = '';
    for (let i = 0; i < 4; i++) bud += `<circle cx="${f1(L / 2 + 1 + R() * 3)}" cy="${f1((R() - .5) * 5)}" r="1.5" fill="#f2d23a" stroke="#c4a018" stroke-width=".4"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${f1(-L / 2)},0 L${f1(L * .44)},0" stroke="#4f8a2e" stroke-width="5" stroke-linecap="round"/><path d="M${f1(-L / 2)},0 L${f1(L * .44)},0" stroke="#9ccc66" stroke-width="3.6" stroke-linecap="round"/>
        ${leaf(L * .05, 0, -16 + (R() - .5) * 8, L * .42)}${leaf(L * .18, 0, 14 + (R() - .5) * 8, L * .34)}</g>
        <path d="M${f1(-L * .46)},-.8 L${f1(L * .02)},-.8" stroke="#e2f2c4" stroke-width="1" stroke-linecap="round" opacity=".9"/>${bud}</g>`;
}
// 鲫鱼（煎ってからスープで煮た一尾。体高があり、こんがりした皮）。頭は -x
function xcnCarp(p, x, y, L, r = 0){
    const h = L * .42;
    const body = `M${f1(-L / 2)},0 C${f1(-L * .44)},${f1(-h * .52)} ${f1(-L * .2)},${f1(-h * .62)} ${f1(L * .02)},${f1(-h * .6)} C${f1(L * .2)},${f1(-h * .56)} ${f1(L * .3)},${f1(-h * .3)} ${f1(L * .34)},${f1(-h * .1)} L${f1(L * .34)},${f1(h * .1)} C${f1(L * .3)},${f1(h * .3)} ${f1(L * .2)},${f1(h * .56)} ${f1(L * .02)},${f1(h * .6)} C${f1(-L * .2)},${f1(h * .62)} ${f1(-L * .44)},${f1(h * .52)} ${f1(-L / 2)},0Z`;
    const tail = `M${f1(L * .32)},0 L${f1(L * .5)},${f1(-h * .5)} Q${f1(L * .44)},0 ${f1(L * .5)},${f1(h * .5)}Z`;
    let sc = '';
    for (let i = 0; i < 4; i++) for (let j = -1; j <= 1; j++){ const sx = -L * .14 + i * L * .1, sy = j * h * .22; sc += `M${f1(sx)},${f1(sy - 3)}q3,3 0,6`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${tail}" fill="${p.g('#b89a6a', .25, .3)}" stroke="#7a6038" stroke-width=".7"/><path d="${body}" fill="${p.g('#d4b07a', .3, .3)}" stroke="#8a6a3a" stroke-width=".9"/></g>
        <path d="M${f1(-L * .1)},${f1(-h * .58)} Q${f1(L * .08)},${f1(-h * .78)} ${f1(L * .24)},${f1(-h * .36)}" fill="#b4925e" stroke="#8a6a3a" stroke-width=".6"/>
        <path d="${sc}" stroke="#a8854e" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f1(-L * .3)},${f1(-h * .44)} Q${f1(-L * .24)},0 ${f1(-L * .3)},${f1(h * .44)}" stroke="#8a6a3a" stroke-width="1.1" fill="none" opacity=".7"/>
        <circle cx="${f1(-L * .4)}" cy="${f1(-h * .14)}" r="${f1(h * .08)}" fill="#f2eee4" stroke="#6a6a64" stroke-width=".7"/><circle cx="${f1(-L * .4)}" cy="${f1(-h * .14)}" r="${f1(h * .035)}" fill="#3a3a38"/>
        <ellipse cx="${f1(-L * .05)}" cy="${f1(-h * .1)}" rx="${f1(L * .18)}" ry="${f1(h * .2)}" fill="#a87a3e" opacity=".3"/>
        <path d="M${f1(-L * .2)},${f1(-h * .46)} Q${f1(L * .02)},${f1(-h * .6)} ${f1(L * .2)},${f1(-h * .38)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 肥牛（しゃぶしゃぶ用の薄切り牛肉を煮たもの: 波打つ薄い1枚、白い脂の筋）
function xcnFeiniu(p, x, y, s, r = 0, { seed = 1, c = '#b88272' } = {}){
    const R = rng(p.id + 'xcnFn' + seed + x + y);
    const pts = ring(s / 2, 12, .3, R, 1.25, .7);
    let fat = '';
    for (let i = 0; i < 3; i++){ const yy = (R() - .5) * s * .3; fat += `M${f1(-s * .4)},${f1(yy)} q${f1(s * .2)},${f1((R() - .5) * 6)} ${f1(s * .4)},${f1((R() - .5) * 4)} t${f1(s * .38)},${f1((R() - .5) * 4)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xcnSmooth(pts, true, .9)}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="${fat}" stroke="#f6e8dc" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${f1(-s * .3)},${f1(-s * .1)} Q0,${f1(-s * .24)} ${f1(s * .26)},${f1(-s * .12)}" stroke="${dk(c, .3)}" stroke-width=".9" fill="none" opacity=".5"/></g>`;
}
// 刻んだ小さな具（酸豆角など）: 色ごとに1本の path にまとめた短い角柱
function xcnBits(p, x, y, s, { n = 80, len = 9, w = 4.6, cols = ['#8c9a3a'], seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xcnBt' + seed + x + y);
    const ds = cols.map(() => ''); let hl = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, b = R() * 3.14;
        const L = len * (.75 + R() * .5), ux = Math.cos(b), uy = Math.sin(b), vx = -uy * w / 2, vy = ux * w / 2;
        const P = (u, v) => `${f1(cx + ux * u + vx * v)},${f1(cy + uy * u + vy * v)}`;
        ds[Math.floor(R() * cols.length)] += `M${P(-L / 2, -1)}L${P(L / 2, -1)}L${P(L / 2, 1)}L${P(-L / 2, 1)}Z`;
        hl += `M${P(-L * .35, -.5)}L${P(L * .3, -.5)}`;
    }
    return `<g stroke-linejoin="round">${cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .4)}" stroke-width=".6"/>`).join('')}</g><path d="${hl}" stroke="#fff" stroke-width=".7" opacity=".45"/>`;
}
// 百叶結（湯葉の結び）
function xcnTofuKnot(p, x, y, s, r = 0){
    const c = '#ead6a2';
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f1(-s / 2)},${f1(-s * .1)} L${f1(-s * .1)},${f1(-s * .14)} M${f1(s * .1)},${f1(s * .14)} L${f1(s / 2)},${f1(s * .1)}" stroke="${dk(c, .3)}" stroke-width="${f1(s * .3)}" stroke-linecap="round"/><path d="M${f1(-s / 2)},${f1(-s * .1)} L${f1(-s * .1)},${f1(-s * .14)} M${f1(s * .1)},${f1(s * .14)} L${f1(s / 2)},${f1(s * .1)}" stroke="${c}" stroke-width="${f1(s * .24)}" stroke-linecap="round"/>
        <ellipse rx="${f1(s * .24)}" ry="${f1(s * .2)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .12)},${f1(-s * .06)} q${f1(s * .12)},${f1(s * .1)} ${f1(s * .24)},0" stroke="${dk(c, .25)}" stroke-width=".7" fill="none"/></g>`;
}
// 斜め切りの細長い茎（長ねぎ・芹菜・豆角）: 両端が斜めの平行四辺形
function xcnSlant(p, x, y, L, r = 0, { c = '#78b446', w = null, op = 1 } = {}){
    const h = w || L * .2;
    return `<g ${T(x, y, r)} opacity="${op}"><path d="M${f1(-L / 2 + h * .6)},${f1(-h / 2)} L${f1(L / 2)},${f1(-h / 2)} L${f1(L / 2 - h * .6)},${f1(h / 2)} L${f1(-L / 2)},${f1(h / 2)}Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M${f1(-L * .4)},${f1(-h * .1)} L${f1(L * .42)},${f1(-h * .1)} M${f1(-L * .42)},${f1(h * .22)} L${f1(L * .38)},${f1(h * .22)}" stroke="${lt(c, .35)}" stroke-width=".7"/>
        <path d="M${f1(-L * .3)},${f1(-h * .32)} L${f1(L * .3)},${f1(-h * .32)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g>`;
}
// 白い大根・冬瓜などの角切り（煮た半透明）
function xcnBlock(p, x, y, s, r = 0, { c = '#f1ead8', seed = 1, sk = null } = {}){
    const R = rng(p.id + 'xcnBl' + seed + x + y);
    const h = s / 2, j = () => (R() - .5) * s * .1;
    const pts = [[-h + j(), -h + j()], [h + j(), -h + j()], [h + j(), h + j()], [-h + j(), h + j()]];
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xcnSmooth(pts, true, .35)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .25)}" stroke-width=".7"/></g>
        ${sk ? `<path d="M${f1(pts[3][0] + 1)},${f1(pts[3][1] - 1.4)} L${f1(pts[2][0] - 1)},${f1(pts[2][1] - 1.4)}" stroke="${sk}" stroke-width="2.4" stroke-linecap="round"/>` : ''}
        <path d="M${f1(-h * .6)},${f1(-h * .45)} Q0,${f1(-h * .7)} ${f1(h * .5)},${f1(-h * .5)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}

const xcnRim = `<path d="M58,70 Q72,56 92,52" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/>`;

// =========================================================
export default {
    // 青椒肉丝: 淡い茶色の豚の細切りと、鮮やかな青椒の細切り、うすい照りのたれ
    cn_qingjiao_rousi: p => [
        xcnPlate(p),
        xcnSauce(p, 100, 102, 128, '#c08a4a', { op: .45 }),
        `<g ${p.sh(1)}>`,
        xcnStrips(p, 100, 102, 120, { c: '#c4875a', n: 34, w: 4.2, len: .32, seed: 1, gloss: .5 }),
        xcnStrips(p, 100, 102, 120, { c: '#4a9a2c', n: 26, w: 3.8, len: .36, seed: 2, gloss: .6 }),
        xcnStrips(p, 100, 100, 96, { c: '#c98e60', n: 18, w: 4.2, len: .32, seed: 3, gloss: .5 }),
        xcnStrips(p, 100, 100, 92, { c: '#5aa834', n: 12, w: 3.8, len: .34, seed: 4, gloss: .6 }),
        `</g>`,
        xcnGrains(p, 100, 100, 90, { cols: ['#f3ecd0'], n: 10, size: 1.3, seed: 5 }),
        xcnRim,
    ].join(''),

    // 糖醋排骨: 赤茶の甘酢あんがからんだスペアリブのぶつ切り、白ごま
    cn_tangcu_paigu: p => {
        const sp = xcnSpots('tcpg', 13, 54, 24, 100, 102);
        return [
            xcnRimPlate(p, { rim: '#2a58a6' }),
            xcnSauce(p, 100, 102, 136, '#9a3412', { op: .9 }),
            ...sp.map(([x, y, r, q], i) => xcnRib(p, x, y, 32 + q * 6, r, { c: i % 3 ? '#b2441a' : '#a23a16', seed: i, gloss: .95 })),
            `<circle cx="100" cy="102" r="60" fill="#d0602a" opacity=".1"/>`,
            K.sesame(p, 100, 100, 104, { n: 38, c: '#f6ecd0' }),
            xcnScallions(p, 104, 98, 60, { n: 8 }),
        ].join('');
    },

    // 麻婆豆腐: 赤いラー油のあんに、さいの目の豆腐、牛ひき肉、青ねぎ（蒜苗）、花椒の粉
    cn_mapo_doufu: p => {
        const sp = xcnSpots('mapo', 26, 60, 19);
        return [
            xcnGlazeBowl(p, { glaze: '#f2efe6', inside: '#f8f5ee' }),
            `<circle cx="100" cy="100" r="77" fill="${p.rg('#b42a12', .25, .3, .45, .42)}"/>`,
            ...sp.map(([x, y, r, q]) => K.tofu(p, x, y, 20 + q * 3, 19 + q * 3, r % 30 - 15, { c: '#fbf3e2' })),
            `<circle cx="100" cy="100" r="77" fill="#c4361a" opacity=".1"/>`,
            xcnGrains(p, 100, 100, 136, { cols: ['#7a3416', '#934420', '#6a2a12'], n: 62, size: 2.6, seed: 1 }),
            xcnOil(p, 100, 100, 146, { n: 16, c: '#e2401a', op: .7, rmax: 2.4 }),
            ...[[82, 84, 20], [124, 92, -40], [96, 124, 70], [132, 128, 10], [68, 116, -60], [110, 66, 30], [140, 76, 80], [62, 90, 10]].map(([x, y, r]) => xcnScallionSeg(p, x, y, 12, r, { green: true })),
            xcnScallions(p, 100, 100, 110, { n: 16 }),
            xcnGrains(p, 100, 100, 120, { cols: ['#3a1a0c'], n: 40, size: .8, seed: 2 }),
            xcnShine(100, 100, 77, .35),
        ].join('');
    },

    // 可乐鸡翅: 飴色にてりてりの手羽中、とろりとした煮汁、白ごまと青ねぎ
    cn_kele_jichi: p => {
        const w = [[72, 76, 30], [112, 66, -10], [146, 96, 70], [64, 118, 100], [104, 104, 20], [140, 134, -30], [96, 144, 160], [128, 74, 140]];
        return [
            xcnPlate(p),
            xcnSauce(p, 102, 104, 134, '#5a2a0c', { op: .9 }),
            ...w.map(([x, y, r], i) => xcnWing(p, x, y, 42, r, { seed: i, c: i % 2 ? '#a8521a' : '#984818' })),
            K.sesame(p, 102, 102, 96, { n: 26, c: '#f6ecd0' }),
            xcnScallions(p, 102, 102, 80, { n: 10 }),
        ].join('');
    },

    // 土豆烧鸡: 茶色い煮汁に、骨つき鶏、じゃがいも、にんじん、青椒
    cn_tudou_shaoji: p => {
        const ch = [[76, 74, 20], [126, 70, -30], [100, 108, 60], [60, 116, 140], [142, 114, -10], [108, 146, 90], [74, 144, 40]];
        const po = [[102, 76, 10], [72, 96, 40], [140, 90, -20], [84, 126, 70], [126, 134, 30], [124, 104, 0], [50, 92, 60]];
        return [
            xcnGlazeBowl(p, { glaze: '#8a5a32', inside: '#f3ead8' }),
            `<circle cx="100" cy="100" r="77" fill="${p.rg('#9a5c26', .25, .3, .45, .42)}"/>`,
            ...ch.map(([x, y, r], i) => xcnChickenBone(p, x, y, 32, r, { c: '#c07a3c', seed: i })),
            ...po.map(([x, y, r], i) => K.potato(p, x, y, 26, r, { c: '#e6b25a', seed: i })),
            ...[[88, 108, 30], [116, 90, -40], [60, 136, 100], [150, 132, 10], [98, 56, 50]].map(([x, y, r]) => K.carrotChunk(p, x, y, 17, r)),
            `<g ${p.sh(.6)}>`, ...[[112, 124, 20], [86, 78, -30], [150, 76, 60], [92, 160, 0], [58, 74, 40]].map(([x, y, r]) => K.pepperPiece(p, x, y, 17, r)), `</g>`,
            xcnShine(100, 100, 77, .3),
        ].join('');
    },

    // 红烧带鱼: 魚皿に、焼いてから煮た太刀魚のぶつ切り、赤茶のたれ、ねぎ・しょうが
    cn_hongshao_daiyu: p => [
        xcnFishPlate(p),
        xcnSauce(p, 100, 100, 152, '#6a2e10', { op: .85, sy: .62 }),
        xcnHairtail(p, 58, 90, 28, 44, -24, { seed: 1, c: '#94501e' }), xcnHairtail(p, 142, 108, 28, 44, 20, { seed: 2, c: '#94501e' }),
        xcnHairtail(p, 82, 112, 28, 46, 12, { seed: 3, c: '#9c5622' }), xcnHairtail(p, 116, 88, 28, 46, -10, { seed: 4, c: '#9c5622' }),
        xcnHairtail(p, 100, 104, 28, 48, 80, { seed: 5, c: '#a45c26' }), xcnHairtail(p, 144, 78, 24, 40, 60, { seed: 6, c: '#94501e' }), xcnHairtail(p, 60, 124, 24, 40, -70, { seed: 7, c: '#94501e' }),
        `<g ${p.sh(.6)}>`,
        ...[[72, 70, 30], [104, 132, -20], [126, 66, 50], [150, 128, -40], [44, 104, 10], [92, 80, -60]].map(([x, y, r], i) => xcnScallionSeg(p, x, y, 13, r, { green: i % 2 === 0 })),
        ...[[118, 120], [128, 96], [80, 92]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="3.6" fill="#f2deaa" stroke="#c4a060" stroke-width=".6"/>`),
        `</g>`,
        xcnOil(p, 100, 104, 110, { n: 8, c: '#c8701e', op: .5, rmax: 1.6 }),
    ].join(''),

    // 油焖大虾: 殻つきの大えびを赤い油のたれで、青ねぎ
    cn_youmen_daxia: p => {
        const pr = [[100, 64, 0], [100, 88, 0], [100, 112, 0], [100, 136, 0], [100, 158, 0]];
        return [
            K.ovalDish(p, { rx: 95, ry: 80, rim: BLUE }),
            xcnSauce(p, 100, 102, 144, '#c23a16', { op: .85, sy: .78 }),
            ...pr.map(([x, y, r], i) => xcnPrawn(p, x + (i % 2 ? 14 : 10), y, i === 0 || i === 4 ? 84 : 94, r, { c: i % 3 ? '#e0582a' : '#d24a22' })),
            xcnOil(p, 100, 102, 130, { n: 10, c: '#e8501e', op: .6, rmax: 1.8 }),
            xcnScallions(p, 100, 104, 110, { n: 16 }),
        ].join('');
    },

    // 蚝油牛肉: 濃いオイスターソースの照り、牛肉の薄切り、玉ねぎ、赤と緑のピーマン
    cn_haoyou_niurou: p => {
        const sp = xcnSpots('hyn', 15, 54, 17, 100, 102);
        return [
            xcnPlate(p),
            xcnSauce(p, 100, 102, 128, '#4a2810', { op: .8 }),
            ...[[84, 70, 20], [130, 112, -30], [70, 128, 80]].map(([x, y, r]) => K.onion(p, x, y, 28, r)),
            `<g ${p.sh(1)}>`,
            ...sp.map(([x, y, r, q], i) => K.beefSlice(p, x, y, 26 + q * 6, r, { c: '#6e3a1c', seed: i })),
            `</g>`,
            `<g ${p.sh(.7)}>`,
            ...[[108, 82, 30], [74, 104, -40], [140, 90, 60], [100, 140, 10]].map(([x, y, r]) => K.pepperPiece(p, x, y, 18, r)),
            ...[[124, 70, -20], [118, 136, 50], [64, 88, 20], [92, 112, 80]].map(([x, y, r]) => K.pepperPiece(p, x, y, 17, r, { c: '#d83a24' })),
            ...[[60, 112, 30], [146, 124, -50]].map(([x, y, r]) => K.onion(p, x, y, 22, r)),
            `</g>`,
            xcnRim,
        ].join('');
    },

    // 土豆炖牛肉: 砂锅に、ほろほろの牛すね肉、じゃがいも、にんじん、トマトの煮汁、香菜
    cn_tudou_niurou: p => [
        xcnClayPot(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#8a4220', .22, .3, .45, .42)}"/>`,
        ...[[78, 74, 20], [124, 68, -30], [102, 104, 60], [64, 116, 140], [138, 110, -10], [100, 140, 90], [56, 86, 10]].map(([x, y, r], i) => xcnChunk(p, x, y, 30, r, { c: '#6a3418', seed: i })),
        ...[[100, 72, 10], [74, 96, 40], [140, 86, -20], [78, 138, 70], [126, 136, 30], [118, 112, 0]].map(([x, y, r], i) => K.potato(p, x, y, 26, r, { c: '#e2a656', seed: i })),
        ...[[118, 90, 30], [86, 120, -40], [146, 128, 100], [100, 156, 10], [148, 70, 60]].map(([x, y, r]) => K.carrotChunk(p, x, y, 18, r)),
        ...[[122, 124], [84, 92]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.6" fill="#d2401e" opacity=".8"/>`),
        xcnShine(100, 100, 74, .28),
        ...[[96, 96, 20], [116, 116, -40], [80, 80, 70]].map(([x, y, r]) => xcnCilantro(p, x, y, 13, r)),
    ].join(''),

    // 葱爆羊肉: 羊肉の薄切りと、太い長ねぎ（白と青）の斜め切りを強火で
    cn_congbao_yangrou: p => {
        const sp = xcnSpots('cby', 16, 56, 16, 100, 102);
        return [
            xcnRimPlate(p, { rim: '#2f7a4a' }),
            xcnSauce(p, 100, 102, 130, '#6a3a18', { op: .6 }),
            `<g ${p.sh(1)}>`,
            ...sp.map(([x, y, r, q], i) => K.beefSlice(p, x, y, 28 + q * 6, r, { c: '#7a4a2e', seed: i })),
            `</g>`,
            `<g ${p.sh(.6)}>`,
            ...xcnSpots('cby2', 16, 56, 14, 100, 102).map(([x, y, r, q], i) => xcnSlant(p, x, y, 26 + q * 6, r, { c: i % 3 === 0 ? '#9cc860' : '#eef0d8', w: 6.5, op: .95 })),
            `</g>`,
            xcnGrains(p, 100, 100, 100, { cols: ['#f4ecc8'], n: 10, size: 1.3, seed: 3 }),
            xcnCilantro(p, 118, 88, 13, 20), xcnCilantro(p, 84, 120, 12, -40), xcnCilantro(p, 132, 128, 12, 80),
        ].join('');
    },


    // 肉末蒸蛋: なめらかに蒸した卵の面に、醤油と肉そぼろ、青ねぎ
    cn_roumo_zhengdan: p => [
        xcnGlazeBowl(p, { glaze: '#ece6d6', inside: '#f6f1e4', lip: .88 }),
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#f2c64a', .3, .18, .42, .4)}"/>`,
        `<circle cx="100" cy="100" r="76" fill="none" stroke="#e2ae36" stroke-width="2" opacity=".5"/>`,
        xcnSauce(p, 102, 104, 92, '#8a4a1a', { op: .5, sy: .9 }),
        xcnSauce(p, 102, 104, 64, '#7a3a14', { op: .5, seed: 2, sy: .9 }),
        `<g ${p.sh(.6)}>`, xcnGrains(p, 102, 104, 64, { cols: ['#7a4020', '#8e5028', '#663418'], n: 70, size: 2.6, seed: 1 }), `</g>`,
        xcnScallions(p, 102, 102, 70, { n: 16 }),
        `<path d="M44,86 Q50,58 78,44" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>`,
        `<path d="M54,104 Q56,94 62,86" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".4"/>`,
    ].join(''),

    // 红烧狮子头: 大きな肉団子を赤茶のたれで煮込み、下に白菜、青ねぎ
    cn_hongshao_shizitou: p => [
        xcnBowl(p, { R: 93 }),
        `<circle cx="100" cy="100" r="79" fill="${p.rg('#8a4418', .22, .3, .45, .42)}"/>`,
        `<g ${p.sh(.6)}>`,
        ...[[50, 70, -60], [150, 74, 60], [52, 134, -120], [150, 132, 120], [100, 44, 0], [100, 158, 180]].map(([x, y, r], i) => xcnNapa(p, x, y, 46, r, { seed: i, cooked: true })),
        `</g>`,
        `<circle cx="100" cy="100" r="79" fill="#8a4418" opacity=".22"/>`,
        xcnLionHead(p, 76, 78, 56), xcnLionHead(p, 128, 82, 56), xcnLionHead(p, 100, 128, 58),
        xcnShine(100, 100, 79, .3),
        xcnScallions(p, 100, 100, 100, { n: 14 }),
    ].join(''),

    // 猪肉白菜饺子: ひだのある水餃子を丸く並べて、まん中に酢醤油の小皿
    cn_zhurou_jiaozi: p => {
        const out = [];
        for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2 - Math.PI / 2, x = 100 + Math.cos(a) * 48, y = 100 + Math.sin(a) * 48; out.push(xcnDumpling(p, x, y, 42, a * 57.3 + 90, { seed: i })); }
        return [
            xcnPlate(p, { well: .76 }),
            ...out,
            `<g ${p.sh(1)}><circle cx="100" cy="100" r="22" fill="${p.rg('#fbfbf7', .2, .1, .38, .32)}"/></g>`,
            `<circle cx="100" cy="100" r="20" fill="none" stroke="${BLUE}" stroke-width="1.2"/>`,
            `<circle cx="100" cy="100" r="16" fill="${p.rg('#5a2a10', .2, .25, .45, .42)}"/>`,
            xcnOil(p, 100, 100, 20, { n: 4, c: '#d8401c', op: .7, rmax: 1.4 }),
            K.sesame(p, 100, 100, 18, { n: 5 }),
        ].join('');
    },

    // 红烧茄子: とろりと煮たなすの乱切りに、照りのある醤油のあん、青椒とにんにく
    cn_hongshao_qiezi: p => {
        const sp = xcnSpots('hsqz', 17, 56, 20, 100, 102);
        return [
            xcnPlate(p),
            xcnSauce(p, 100, 102, 134, '#6a3014', { op: .85 }),
            `<g ${p.sh(1)}>`,
            ...sp.map(([x, y, r, q], i) => xcnNasu(p, x, y, 30 + q * 6, r, { seed: i, flesh: '#a8702e', skin: '#3e1c44' })),
            ...[[84, 82, 20], [122, 108, -40], [96, 132, 70], [138, 76, 10], [64, 118, -30]].map(([x, y, r]) => K.pepperPiece(p, x, y, 16, r)),
            `</g>`,
            `<circle cx="100" cy="102" r="58" fill="#7a3a14" opacity=".12"/>`,
            xcnGrains(p, 100, 100, 100, { cols: ['#f6e7b0', '#ead08a'], n: 22, size: 1.5, seed: 3 }),
            xcnOil(p, 100, 104, 120, { n: 8, c: '#a05a1e', op: .5, rmax: 1.6 }),
        ].join('');
    },

    // 酸菜鱼: 大きな碗に、白濁した黄色いスープ、白身魚の薄切り、酸菜、上に乾燥唐辛子と花椒
    cn_suancaiyu: p => {
        const fs = xcnSpots('scy', 12, 60, 22);
        return [
            xcnBowl(p, { R: 94 }),
            `<circle cx="100" cy="100" r="80" fill="${p.rg('#e2c46a', .25, .2, .45, .42)}"/>`,
            ...xcnSpots('scy2', 10, 64, 20).map(([x, y, r], i) => xcnSuancai(p, x, y, 26, r, { seed: i })),
            ...fs.map(([x, y, r, q], i) => xcnFishSlice(p, x, y, 26 + q * 6, r, { seed: i, c: '#f8f0dc' })),
            `<circle cx="100" cy="100" r="80" fill="#e6c870" opacity=".12"/>`,
            xcnOil(p, 100, 100, 150, { n: 10, c: '#e6801e', op: .6, rmax: 2.2 }),
            `<g ${p.sh(.6)}>`,
            ...xcnSpots('scy3', 10, 34, 12).map(([x, y, r]) => xcnChili(p, x, y, 20, r)),
            `</g>`,
            xcnGrains(p, 100, 100, 64, { cols: ['#7a2a14', '#5a1c0c'], n: 18, size: 1.7, seed: 2 }),
            xcnScallions(p, 100, 100, 70, { n: 10 }),
            ...[[136, 132, 20], [62, 72, -30]].map(([x, y, r]) => xcnCilantro(p, x, y, 13, r)),
            xcnShine(100, 100, 80, .3),
        ].join('');
    },

    // 蛋炒饭: ぱらりとした黄色い炒飯に、卵のかけら、にんじん・コーン・グリーンピース、青ねぎ
    cn_dan_chaofan: p => [
        xcnPlate(p),
        xcnRice(p, 100, 102, 138, { tint: '#f6da84', density: .75, grain: 4.2, sy: .94, hiK: .35 }),
        `<g ${p.sh(.5)}>`,
        ...xcnSpots('dcf', 12, 56, 17, 100, 102).map(([x, y, r, q], i) => xcnEggBit(p, x, y, 11 + q * 5, r, { seed: i })),
        ...xcnSpots('dcf2', 16, 58, 9, 100, 102).map(([x, y, r]) => `<rect ${T(x, y, r)} x="-2.8" y="-2.8" width="5.6" height="5.6" rx="1.2" fill="${p.g('#ec7a2e', .3, .2)}" stroke="#b4521a" stroke-width=".5"/>`),
        `</g>`,
        K.corn(p, 100, 102, 110, { n: 16 }),
        ...xcnSpots('dcf3', 16, 58, 8, 100, 102).map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="${p.rg('#5aa83a', .3, .25, .35, .32)}" stroke="#2f6a22" stroke-width=".5"/>`),
        xcnScallions(p, 100, 100, 110, { n: 18 }),
    ].join(''),

    // 腊肠焖饭: 砂锅で炊いたご飯に、腊肠の斜め切り、しいたけ、青菜、醤油をひと回し
    cn_lachang_menfan: p => [
        xcnClayPot(p),
        xcnRice(p, 100, 100, 146, { tint: '#f0e2c0', density: .8, grain: 4 }),
        xcnSauce(p, 100, 100, 110, '#8a4a1a', { op: .28 }),
        ...[[70, 72, -30], [96, 64, -10], [122, 70, 20], [62, 98, -60], [138, 96, 60], [80, 92, -30], [118, 92, 30]].map(([x, y, r], i) => xcnLapCheong(p, x, y, 26, r, { seed: i })),
        xcnShiitake(p, 76, 122, 24, 10), xcnShiitake(p, 126, 124, 22, -30), xcnShiitake(p, 100, 104, 20, 0),
        `<g ${p.sh(.7)}>`, xcnBok(p, 100, 140, 54, -90, { seed: 1, cooked: true }), xcnBok(p, 140, 132, 46, -40, { seed: 2, cooked: true }), xcnBok(p, 60, 132, 46, -140, { seed: 3, cooked: true }), `</g>`,
        xcnScallions(p, 100, 96, 70, { n: 10 }),
    ].join(''),

    // 葱油拌面: 醤油色にからんだ細麺に、香ばしく揚げたねぎ油のねぎ、青ねぎ
    cn_congyou_banmian: p => [
        xcnGlazeBowl(p, { glaze: '#5a3420', inside: '#f3eadb', lip: .86 }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#8a5226', .2, .3, .45, .42)}" opacity=".7"/>`,
        xcnWavy(p, 100, 100, 150, { c: '#b07a3c', w: 2.4, n: 52, seed: 1, len: .7, wav: .4, outline: '#6a3e16', hi: .6 }),
        xcnWavy(p, 100, 100, 110, { c: '#bc8846', w: 2.4, n: 26, seed: 2, len: .6, wav: .4, outline: '#6a3e16', hi: .6 }),
        `<g ${p.sh(.7)}>`, xcnFriedScallion(p, 100, 98, 72, { n: 50 }), `</g>`,
        xcnOil(p, 100, 100, 120, { n: 10, c: '#b8722a', op: .5, rmax: 1.6 }),
        xcnScallions(p, 104, 100, 54, { n: 10 }),
    ].join(''),

    // 肉丝炒面: 焼いた中華麺に、豚の細切り、キャベツ、もやし、にんじん、青ねぎ
    cn_rousi_chaomian: p => [
        xcnPlate(p),
        xcnWavy(p, 100, 102, 140, { c: '#dcae5e', w: 4, n: 40, seed: 1, len: .62, outline: '#a8742e' }),
        `<g ${p.sh(.7)}>`,
        ...[[72, 82, 20], [130, 116, -30], [118, 72, 60], [76, 128, -10]].map(([x, y, r], i) => K.leafPiece(p, x, y, 22, r, { c: '#c8dc94', seed: i, cooked: true })),
        `</g>`,
        K.sprouts(p, 100, 104, 100, { n: 14 }),
        `<g ${p.sh(.8)}>`,
        xcnStrips(p, 100, 102, 110, { c: '#a8693a', n: 18, w: 3.8, len: .28, seed: 3 }),
        xcnStrips(p, 100, 102, 104, { c: '#ec7a2e', n: 10, w: 2.4, len: .26, seed: 4 }),
        `</g>`,
        xcnWavy(p, 100, 102, 96, { c: '#e0b468', w: 4, n: 10, seed: 5, len: .5, outline: '#a8742e' }),
        xcnScallions(p, 100, 100, 100, { n: 14 }),
    ].join(''),

    // 蚂蚁上树: 醤油色の春雨に、ひき肉（蟻）がからみ、ラー油と青ねぎ
    cn_mayi_shangshu: p => [
        xcnPlate(p),
        xcnSauce(p, 100, 102, 128, '#a2461c', { op: .45 }),
        `<g ${p.sh(.7)}>`,
        xcnWavy(p, 100, 102, 138, { c: '#c48c5a', w: 2.2, n: 36, seed: 1, len: .75, wav: .35, outline: '#8a5430', hi: .5, layers: 2 }),
        xcnWavy(p, 100, 100, 100, { c: '#d09a68', w: 2.2, n: 20, seed: 2, len: .6, wav: .35, outline: '#8a5430', hi: .5, layers: 2 }),
        `</g>`,
        xcnGrains(p, 100, 102, 124, { cols: ['#6a3416', '#7e4220', '#5a2a10'], n: 85, size: 1.9, seed: 1 }),
        xcnOil(p, 100, 102, 120, { n: 10, c: '#d8401c', op: .6, rmax: 1.6 }),
        xcnScallions(p, 100, 100, 104, { n: 20 }),
        xcnGrains(p, 100, 100, 90, { cols: ['#c42a1a'], n: 8, size: 1.3, seed: 2 }),
    ].join(''),

    // 拍黄瓜: たたいて割ったきゅうりに、黒酢と醤油のたれ、ラー油、にんにく、赤唐辛子
    cn_paihuanggua: p => [
        K.kobachi(p, { R: 92, glaze: '#8fb8a8', inside: '#f1f4ec' }),
        xcnSauce(p, 100, 102, 124, '#5a2e14', { op: .55 }),
        `<g ${p.sh(.9)}>`,
        ...xcnSpots('phg', 15, 54, 19, 100, 100).map(([x, y, r, q], i) => xcnSmashedCuc(p, x, y, 22 + q * 7, r, { seed: i })),
        `</g>`,
        xcnOil(p, 100, 102, 120, { n: 12, c: '#d8401c', op: .65, rmax: 2 }),
        xcnGrains(p, 100, 100, 100, { cols: ['#f6ecc0', '#ead69a'], n: 30, size: 1.6, seed: 3 }),
        ...[[86, 84], [118, 106], [100, 128], [70, 112], [128, 76]].map(([x, y]) => xcnChiliRing(x, y, 7)),
        xcnCilantro(p, 112, 86, 13, 20), xcnCilantro(p, 80, 124, 12, -40),
    ].join(''),

    // 凉拌菠菜: ゆでたほうれん草をこんもり、炒ったピーナッツ、白ごま、にんにく
    cn_liangban_bocai: p => [
        xcnPlate(p, { well: .76 }),
        `<g ${p.sh(1)}>`,
        `<path ${T(100, 102)} d="${xcnSmooth(ring(58, 12, .14, rng('lbbc'), 1, .9))}" fill="${p.rg('#2f6a22', .2, .3)}"/>`,
        xcnStrips(p, 100, 102, 116, { c: '#3a7a28', n: 34, w: 5, len: .34, seed: 1, gloss: .5 }),
        K.greens(p, 100, 102, 110, { c: '#2f7424', n: 16, stems: '#7fb04a', seed: 2 }),
        xcnStrips(p, 100, 100, 90, { c: '#6ea83c', n: 14, w: 3.4, len: .3, seed: 3, gloss: .5 }),
        `</g>`,
        `<g ${p.sh(.6)}>`, ...xcnSpots('lbbc2', 16, 50, 13, 100, 100).map(([x, y, r]) => xcnPeanut(p, x, y, 11, r)), `</g>`,
        K.sesame(p, 100, 100, 96, { n: 22 }),
        xcnGrains(p, 100, 100, 80, { cols: ['#f6ecc0'], n: 14, size: 1.4, seed: 4 }),
    ].join(''),

    // 凉拌腐竹: もどした腐竹の斜め切りに、きゅうり・にんじんの細切り、ラー油と香菜
    cn_liangban_fuzhu: p => [
        xcnRimPlate(p, { rim: '#c0392b' }),
        xcnSauce(p, 100, 102, 128, '#c4501e', { op: .5 }),
        `<g ${p.sh(.9)}>`,
        ...xcnSpots('lbfz', 20, 58, 16, 100, 102).map(([x, y, r, q], i) => xcnFuzhu(p, x, y, 32 + q * 8, r, { seed: i })),
        xcnStrips(p, 100, 102, 110, { c: '#4f9a30', n: 14, w: 3, len: .3, seed: 2 }),
        xcnStrips(p, 100, 102, 104, { c: '#ec7a2e', n: 12, w: 2.6, len: .28, seed: 3 }),
        `</g>`,
        xcnOil(p, 100, 102, 110, { n: 12, c: '#d8401c', op: .65, rmax: 1.8 }),
        xcnGrains(p, 100, 100, 90, { cols: ['#f6ecc0'], n: 14, size: 1.4, seed: 4 }),
        xcnCilantro(p, 110, 90, 13, 20), xcnCilantro(p, 84, 118, 12, -40), xcnCilantro(p, 132, 120, 12, 70),
    ].join(''),

    // 凉拌海带丝: 濃い緑の昆布の細切りをこんもり、にんじん、香菜、にんにく、唐辛子
    cn_liangban_haidaisi: p => [
        K.kobachi(p, { R: 92, glaze: '#c9b48a', inside: '#f6f1e4' }),
        xcnWavy(p, 100, 100, 146, { c: '#3e5e2c', w: 3.4, n: 44, seed: 1, len: .6, wav: .6, outline: '#1e3014', hi: .4 }),
        xcnWavy(p, 100, 100, 104, { c: '#4a6a32', w: 3.4, n: 16, seed: 2, len: .5, wav: .6, outline: '#1e3014', hi: .4 }),
        `<g ${p.sh(.6)}>`, xcnStrips(p, 100, 100, 100, { c: '#ec7a2e', n: 12, w: 2.4, len: .3, seed: 3 }), `</g>`,
        xcnOil(p, 100, 100, 100, { n: 8, c: '#d8401c', op: .6, rmax: 1.6 }),
        xcnGrains(p, 100, 100, 70, { cols: ['#f6ecc0'], n: 14, size: 1.4, seed: 4 }),
        ...[[86, 84], [120, 112], [108, 72]].map(([x, y]) => xcnChiliRing(x, y, 6.5)),
        xcnCilantro(p, 112, 92, 14, 20), xcnCilantro(p, 86, 116, 13, -40), xcnCilantro(p, 124, 128, 12, 80),
    ].join(''),

    // 糖醋萝卜: 甘酢に漬けた白い大根の拍子木切り、赤唐辛子
    cn_tangcu_luobo: p => [
        xcnBowl(p, { R: 90 }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#efe2b4', .2, .2, .45, .42)}" opacity=".7"/>`,
        `<g ${p.sh(.7)}>`,
        ...xcnSpots('tclb', 44, 62, 10).map(([x, y, r, q]) => `<g ${T(x, y, r)}><rect x="-14" y="-4.5" width="28" height="9" rx="1.6" fill="${p.g('#f6f0dc', .4, .18)}" stroke="#cfc4a0" stroke-width=".6"/><path d="M-11,-2 L9,-2" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".9"/></g>`),
        `</g>`,
        `<circle cx="100" cy="100" r="76" fill="#f2dc9c" opacity=".14"/>`,
        ...[[86, 84], [118, 104], [100, 128], [70, 112], [128, 76], [110, 60], [140, 122]].map(([x, y]) => xcnChiliRing(x, y, 7.5)),
        xcnShine(100, 100, 76, .4),
    ].join(''),

    // 醋溜白菜: 白菜の芯のそぎ切りを強火で、照りのある甘酢あん、乾燥唐辛子
    cn_culiu_baicai: p => [
        xcnPlate(p),
        xcnSauce(p, 100, 102, 128, '#c8904a', { op: .45 }),
        `<g ${p.sh(.9)}>`,
        ...xcnSpots('clbc', 22, 58, 15, 100, 102).map(([x, y, r, q], i) => i % 4 === 3 ? K.leafPiece(p, x, y, 30, r, { c: '#b8d27a', seed: i, cooked: true }) : `<g ${T(x, y, r, 1.15)}><path d="M-15,-6 Q0,-9 15,-6 L13,6 Q0,9 -13,6Z" fill="${p.g('#f4efd8', .3, .2)}" stroke="#cbbf94" stroke-width=".7"/><path d="M-10,-2 L10,-2 M-9,2 L9,2.4" stroke="#e2d8b4" stroke-width=".9"/><path d="M-12,-4.6 Q0,-7.4 11,-4.8" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`),
        `</g>`,
        `<circle cx="100" cy="102" r="58" fill="#d89a48" opacity=".1"/>`,
        ...[[84, 84, 20], [120, 96, -50], [100, 122, 80], [72, 112, 140], [130, 126, 10], [114, 70, 60]].map(([x, y, r]) => xcnChili(p, x, y, 18, r)),
        xcnGrains(p, 100, 100, 100, { cols: ['#f6ecc0'], n: 14, size: 1.4, seed: 4 }),
    ].join(''),

    // 蚝油生菜: さっとゆでた鮮やかなレタスに、つやのあるオイスターソースとにんにく
    cn_haoyou_shengcai: p => [
        xcnPlate(p),
        `<g ${p.sh(1)}>`,
        ...[[74, 78, 30], [128, 76, -40], [140, 120, 60], [74, 126, -60], [104, 140, 10], [100, 100, -10]].map(([x, y, r], i) => xcnLettuce(p, x, y, 56, r, { seed: i, c: i % 2 ? '#7cc040' : '#6ab236' })),
        `</g>`,
        xcnSauce(p, 100, 102, 110, '#5a2a10', { op: .38, sy: .86, seed: 3 }),
        xcnSauce(p, 104, 104, 64, '#4a2008', { op: .3, sy: .8, seed: 4 }),
        `<path d="M66,96 Q80,74 106,72 M84,108 Q92,96 104,94" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>`,
        xcnGrains(p, 100, 100, 60, { cols: ['#f6e2a0', '#e8c878'], n: 22, size: 1.6, seed: 4 }),
    ].join(''),

    // 干煸四季豆: 皺が寄って焦げ目のついたいんげん、ひき肉、乾燥唐辛子、にんにく
    cn_ganbian_doujiao: p => [
        xcnPlate(p),
        ...xcnSpots('gbdj', 29, 56, 11, 100, 102).map(([x, y, r, q], i) => `<g ${p.sh(.6)}>${xcnBlisterBean(p, x, y, 38 + q * 10, r, { seed: i, c: i % 3 ? '#5a8f2e' : '#6a9a36' })}</g>`),
        xcnGrains(p, 100, 102, 110, { cols: ['#7a4a26', '#5e3418'], n: 60, size: 1.8, seed: 1 }),
        ...[[84, 84, 20], [120, 96, -50], [100, 122, 80], [72, 112, 140], [130, 126, 10]].map(([x, y, r]) => xcnChili(p, x, y, 16, r)),
        xcnGrains(p, 100, 100, 90, { cols: ['#f6ecc0'], n: 14, size: 1.4, seed: 4 }),
    ].join(''),

    // 手撕包菜: 手でちぎったキャベツを強火で、焼き色と照り、豚バラ、乾燥唐辛子
    cn_shousi_baocai: p => [
        xcnRimPlate(p, { rim: '#2a58a6' }),
        xcnSauce(p, 100, 102, 124, '#b0783a', { op: .35 }),
        `<g ${p.sh(.9)}>`,
        ...xcnSpots('ssbc', 19, 58, 18, 100, 102).map(([x, y, r, q], i) => K.leafPiece(p, x, y, 34 + q * 8, r, { c: i % 3 ? '#cfe2a0' : '#e6efc8', vein: '#f6f8e8', seed: i })),
        `</g>`,
        ...[[80, 92], [120, 82], [108, 126], [70, 124], [134, 112]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#8a5a22" opacity=".35"/>`),
        xcnPorkSlice(p, 86, 74, 30, 20, { seed: 1, c: '#b06a34' }), xcnPorkSlice(p, 124, 120, 30, -30, { seed: 2, c: '#b06a34' }), xcnPorkSlice(p, 74, 120, 26, 60, { seed: 3, c: '#b06a34' }),
        ...[[100, 100, 20], [134, 86, -50], [96, 136, 80], [62, 96, 140]].map(([x, y, r]) => xcnChili(p, x, y, 17, r)),
        xcnGrains(p, 100, 100, 90, { cols: ['#f6ecc0'], n: 12, size: 1.4, seed: 4 }),
    ].join(''),

    // 韭菜炒鸡蛋: ふんわりした黄色い炒り卵と、濃い緑のにらのざく切り
    cn_jiucai_jidan: p => [
        xcnPlate(p),
        `<g ${p.sh(.9)}>`,
        xcnStrips(p, 100, 102, 124, { c: '#3f8a2a', n: 40, w: 3.6, len: .3, seed: 1, gloss: .5 }),
        xcnEggCurd(p, 78, 80, 42, 20, { seed: 1 }), xcnEggCurd(p, 124, 84, 40, -30, { seed: 2 }), xcnEggCurd(p, 98, 128, 44, 60, { seed: 3 }),
        xcnEggCurd(p, 138, 124, 32, 10, { seed: 4 }), xcnEggCurd(p, 64, 116, 30, 40, { seed: 5 }), xcnEggCurd(p, 104, 98, 30, -10, { seed: 6 }),
        xcnStrips(p, 100, 102, 110, { c: '#4c9a32', n: 22, w: 3.6, len: .28, seed: 2, gloss: .5 }),
        `</g>`,
    ].join(''),

    // 蒜蓉西兰花: 鮮やかなブロッコリーの小房に、にんじんの花形切り、にんにくのみじん切り
    cn_suanrong_xilanhua: p => [
        xcnPlate(p),
        xcnSauce(p, 100, 102, 120, '#dfe6b0', { op: .4 }),
        ...xcnSpots('srxl', 10, 52, 28, 100, 102).map(([x, y, r, q]) => K.broccoli(p, x, y, 38 + q * 6, r, { c: '#3f9a34' })),
        ...[[82, 92, 0], [124, 108, 30], [100, 132, 60], [116, 74, 10], [70, 124, 40]].map(([x, y, r]) => `<g ${p.sh(.5)}><g ${T(x, y, r)}><path d="M0,-7 L2,-2.6 7,-2.2 3.4,1.2 4.4,6 0,3.4 -4.4,6 -3.4,1.2 -7,-2.2 -2,-2.6Z" fill="${p.g('#ef7f30', .3, .25)}" stroke="#b4521a" stroke-width=".6" stroke-linejoin="round"/><circle r="1.6" fill="#f6b070"/></g></g>`),
        xcnGrains(p, 100, 100, 100, { cols: ['#f8ecc0', '#ecd492'], n: 34, size: 1.6, seed: 3 }),
    ].join(''),

    // 红烧冬瓜: 醤油で煮て飴色に透けた冬瓜の角切り、青ねぎ
    cn_hongshao_donggua: p => [
        xcnGlazeBowl(p, { glaze: '#2f5f7a', inside: '#f3efe4' }),
        `<circle cx="100" cy="100" r="77" fill="${p.rg('#8a5226', .22, .3, .45, .42)}"/>`,
        ...xcnSpots('hsdg', 12, 52, 26).map(([x, y, r, q], i) => xcnWinterMelon(p, x, y, 32 + q * 6, r % 40 - 20, { seed: i, c: '#c88a44', braised: true })),
        `<circle cx="100" cy="100" r="77" fill="#9a5a24" opacity=".12"/>`,
        xcnShine(100, 100, 77, .35),
        xcnScallions(p, 100, 100, 110, { n: 16 }),
    ].join(''),

    // 油焖笋: 春たけのこのくし切りを醤油と砂糖で照りよく煮つめて
    cn_youmen_sun: p => [
        xcnPlate(p),
        xcnSauce(p, 100, 102, 128, '#6a3412', { op: .85 }),
        ...xcnSpots('ymsun', 14, 52, 22, 100, 102).map(([x, y, r, q], i) => xcnShoot(p, x, y, 44 + q * 8, r, { c: i % 2 ? '#b8782e' : '#a86a28', seed: i })),
        `<circle cx="100" cy="102" r="58" fill="#7a3a14" opacity=".1"/>`,
        xcnOil(p, 100, 104, 120, { n: 8, c: '#a05a1e', op: .5, rmax: 1.6 }),
        xcnScallions(p, 100, 100, 70, { n: 8 }),
    ].join(''),

    // 上汤娃娃菜: 白い上湯にミニ白菜の縦割り、皮蛋とハムのさいの目、にんにく、枸杞
    cn_shangtang_wawacai: p => [
        xcnGlazeBowl(p, { glaze: '#f0ece2', inside: '#f8f5ee' }),
        `<circle cx="100" cy="100" r="77" fill="${p.rg('#efe2bc', .2, .2, .45, .42)}"/>`,
        xcnBabyNapa(p, 96, 68, 120, 4, { seed: 1 }), xcnBabyNapa(p, 102, 100, 128, -2, { seed: 2 }), xcnBabyNapa(p, 98, 132, 118, 3, { seed: 3 }),
        `<circle cx="100" cy="100" r="77" fill="#f2e6c4" opacity=".16"/>`,
        ...xcnSpots('stwc', 14, 60, 13).map(([x, y, r], i) => i % 2 ? xcnDice(p, x, y, 8, r, '#e88a8a') : xcnDice(p, x, y, 8, r, '#4a4024')),
        xcnGrains(p, 100, 100, 110, { cols: ['#f8ecc0'], n: 16, size: 1.6, seed: 3 }),
        ...[[70, 84], [128, 118], [110, 52], [140, 84]].map(([x, y]) => xcnGoji(p, x, y, 7, 30)),
        xcnShine(100, 100, 77, .35),
    ].join(''),

    // 白菜炖粉条: 砂锅で白菜、太い粉条、豚バラを煮込んで
    cn_baicai_dun_fentiao: p => [
        xcnClayPot(p),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#c8a070', .2, .3, .45, .42)}"/>`,
        `<g ${p.sh(.6)}>`,
        ...[[74, 76, 20], [128, 80, -40], [126, 128, 160], [72, 124, 110], [100, 100, 60]].map(([x, y, r], i) => xcnNapa(p, x, y, 42, r, { seed: i, cooked: true })),
        `</g>`,
        xcnWavy(p, 100, 100, 140, { c: '#8a6a52', w: 4.4, n: 16, seed: 3, len: .7, wav: .35, outline: '#5a4030', hi: .5, layers: 2 }),
        xcnPorkSlice(p, 84, 92, 32, 30, { seed: 1, c: '#c09070', char: false }), xcnPorkSlice(p, 122, 110, 32, -20, { seed: 2, c: '#c09070', char: false }), xcnPorkSlice(p, 100, 136, 28, 10, { seed: 3, c: '#c09070', char: false }),
        `<circle cx="100" cy="100" r="74" fill="#c8a070" opacity=".1"/>`,
        xcnShine(100, 100, 74, .3),
        xcnScallions(p, 100, 100, 100, { n: 12 }),
    ].join(''),

    // 白灼菜心: 長皿に、ゆでた菜心をそろえて並べ、醤油だれと熱した油、細切りの唐辛子とねぎ
    cn_baizhuo_caixin: p => {
        const st = [];
        for (let i = 0; i < 8; i++){ const y = 60 + i * 11.4; st.push(xcnChoySum(p, 90 + (i % 2) * 6, y, 136 - (i % 3) * 8, -4 + (i % 3) * 3, { seed: i })); }
        return [
            K.longPlate(p, { w: 188, h: 136, base: '#fbfaf6', rim: '#9ab4cc' }),
            xcnSauce(p, 100, 104, 160, '#5a2a10', { op: .6, sy: .62 }),
            ...st,
            xcnFineShreds(p, 104, 100, 70, { c: '#f2f4e2', n: 10, w: 1.4, seed: 1, dir: 0 }),
            xcnFineShreds(p, 104, 102, 60, { c: '#d8301e', n: 7, w: 1.2, seed: 2, dir: 0 }),
            xcnOil(p, 100, 108, 120, { n: 8, c: '#e2b04a', op: .5, rmax: 1.6 }),
        ].join('');
    },

    // 虎皮青椒: 焼いて皺と焦げ目の入った長い青唐辛子を、黒酢醤油のたれで
    cn_hupi_qingjiao: p => [
        xcnPlate(p),
        xcnSauce(p, 100, 102, 128, '#4a2810', { op: .7 }),
        ...[[100, 70, -6, 104], [96, 92, 4, 116], [104, 114, -4, 118], [98, 136, 6, 104], [74, 102, 70, 64], [130, 104, -70, 60]].map(([x, y, r, L], i) => xcnLongPepper(p, x, y, L, r, { seed: i, c: i % 2 ? '#5a9a30' : '#4a8a2a' })),
        xcnGrains(p, 100, 100, 100, { cols: ['#f6ecc0'], n: 16, size: 1.4, seed: 4 }),
        xcnOil(p, 100, 104, 120, { n: 8, c: '#a06a2a', op: .5, rmax: 1.6 }),
    ].join(''),

    // 清炒藕片: しゃきっと白い蓮根の薄切り、赤唐辛子と青ねぎ
    cn_qingchao_oupian: p => [
        xcnRimPlate(p, { rim: '#2f7a4a' }),
        `<g ${p.sh(.7)}>`,
        ...xcnSpots('qcop', 14, 54, 22, 100, 102).map(([x, y, r, q]) => K.lotus(p, x, y, 32 + q * 6, r, { c: '#f2e8d2' })),
        `</g>`,
        ...[[86, 84, 20], [120, 106, -50], [100, 128, 80], [70, 112, 140], [132, 80, 10]].map(([x, y, r]) => xcnScallionSeg(p, x, y, 10, r, { green: true })),
        ...[[96, 96], [128, 128], [70, 80], [112, 70]].map(([x, y]) => xcnChiliRing(x, y, 7)),
        xcnGrains(p, 100, 100, 90, { cols: ['#f6ecc0'], n: 10, size: 1.4, seed: 4 }),
    ].join(''),

    // 油炸花生米: 赤い薄皮の落花生を油でからりと、塩をひとふり
    cn_youzha_huasheng: p => [
        K.kobachi(p, { R: 90, glaze: '#c4a46a', inside: '#f6f2e8' }),
        `<circle cx="100" cy="100" r="70" fill="#8a2a14" opacity=".55"/>`,
        `<g ${p.sh(.5)}>`, ...xcnSpots('yzhs', 90, 66, 7.4).map(([x, y, r, q]) => xcnRedPeanut(p, x, y, 15 + q * 2, r, { c: q < .5 ? '#a8361e' : '#b8442a' })), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#ffffff', n: 30, r: .6 }),
    ].join(''),

    // 肉末酸豆角: 刻んだ酸っぱい豇豆とひき肉、赤唐辛子を炒めて
    cn_roumo_suandoujiao: p => [
        K.kobachi(p, { R: 92, glaze: '#5a7a9a', inside: '#f4f2ea' }),
        xcnSauce(p, 100, 100, 146, '#6a5a24', { op: .85, sy: 1 }),
        `<g ${p.sh(.6)}>`,
        xcnBits(p, 100, 100, 140, { n: 230, len: 11, w: 5.6, cols: ['#8c9a3a', '#a0a648', '#7a8a32'], seed: 1 }),
        `</g>`,
        xcnGrains(p, 100, 100, 130, { cols: ['#7a4a26', '#5e3418'], n: 70, size: 1.9, seed: 1 }),
        ...[[86, 84], [118, 106], [100, 128], [70, 112], [128, 76], [110, 92], [80, 140], [140, 124]].map(([x, y]) => xcnChiliRing(x, y, 7)),
        xcnGrains(p, 100, 100, 90, { cols: ['#f6ecc0'], n: 10, size: 1.4, seed: 4 }),
    ].join(''),


    // 西红柿鸡蛋汤: 赤みのあるトマトのスープに、ふんわり卵、トマト、青ねぎと香菜
    cn_xihongshi_dantang: p => [
        xcnBowl(p, { R: 92 }),
        xcnBroth(p, 79, '#e2683c', { op: .9 }),
        ...[[78, 80, 20], [126, 74, -30], [138, 120, 60], [72, 128, 100], [104, 104, 10], [100, 60, 80], [54, 102, -40], [112, 146, 30]].map(([x, y, r], i) => xcnTomato(p, x, y, 26, r, { seed: i })),
        xcnEggCloud(p, 96, 88, 64, -15, { seed: 1 }), xcnEggCloud(p, 84, 120, 56, 25, { seed: 2 }), xcnEggCloud(p, 130, 104, 52, 70, { seed: 3 }), xcnEggCloud(p, 120, 64, 46, 10, { seed: 4 }),
        xcnEggCloud(p, 60, 84, 40, 80, { seed: 5 }), xcnEggCloud(p, 112, 146, 46, 10, { seed: 7 }),
        xcnOil(p, 100, 100, 140, { n: 14, c: '#f2a23c', op: .6, rmax: 1.8 }),
        xcnScallions(p, 100, 100, 120, { n: 18 }),
        xcnCilantro(p, 110, 96, 13, 20), xcnCilantro(p, 80, 104, 12, -50),
        xcnShine(100, 100, 79, .4),
    ].join(''),

    // 酸辣汤: とろみのある濃い茶色のスープに、豆腐・木耳・しいたけ・たけのこ・豚の細切り、溶き卵、ラー油と香菜
    cn_suanlatang: p => {
        const sp = xcnSpots('slt', 34, 64, 10);
        const cols = ['#f8f2e2', '#2e2220', '#7a4a2a', '#ead6a0', '#b8865a'];
        return [
            xcnBowl(p, { R: 92 }),
            xcnBroth(p, 79, '#7a4422', { op: 1 }),
            ...[[90, 84, 0], [120, 116, 40], [72, 120, -30], [126, 76, 70], [100, 140, 10]].map(([x, y, r], i) => xcnEggCloud(p, x, y, 46, r, { seed: i, c: '#f2cf5c', op: .8 })),
            ...sp.map(([x, y, r], i) => xcnStrip(p, x, y, 18, i % 5 === 1 ? 4 : 4.4, r, cols[i % 5])),
            `<circle cx="100" cy="100" r="79" fill="#7a4422" opacity=".14"/>`,
            xcnOil(p, 100, 100, 146, { n: 18, c: '#d8401c', op: .7, rmax: 2.2 }),
            xcnGrains(p, 100, 100, 130, { cols: ['#2a1a10'], n: 30, size: .8, seed: 2 }),
            ...[[110, 92, 20], [84, 108, -40], [128, 128, 70], [92, 66, 10]].map(([x, y, r]) => xcnCilantro(p, x, y, 13, r)),
            xcnShine(100, 100, 79, .4),
        ].join('');
    },

    // 鲫鱼豆腐汤: ミルクのように白いスープに、こんがり煎った鲫鱼一尾、豆腐、青ねぎと香菜
    cn_jiyu_doufu: p => [
        xcnGlazeBowl(p, { R: 94, glaze: '#f2eee4', inside: '#faf8f2', lip: .88 }),
        xcnBroth(p, 81, '#f3eee2', { op: 1 }),
        xcnCarp(p, 98, 96, 140, -8),
        `<ellipse cx="98" cy="104" rx="66" ry="22" fill="#f6f2e8" opacity=".35"/>`,
        ...[[56, 66, 10], [80, 140, -8], [118, 142, 14], [148, 118, 6], [150, 74, -10], [100, 50, 20], [50, 124, 4], [130, 50, -6], [70, 46, 12], [98, 156, -4], [158, 96, 10], [42, 96, -10]].map(([x, y, r]) => K.tofu(p, x, y, 20, 19, r, { c: '#fbf8ee' })),
        xcnScallions(p, 100, 100, 130, { n: 20 }),
        xcnCilantro(p, 132, 92, 13, 20), xcnCilantro(p, 70, 102, 13, -40),
        xcnShine(100, 100, 81, .4),
    ].join(''),

    // 汆丸子汤: 澄んだスープに、白っぽい豚肉団子、青菜、春雨、青ねぎ
    cn_cuan_wanzi: p => [
        xcnBowl(p, { R: 92 }),
        xcnBroth(p, 79, '#ead8a8', { op: .75 }),
        xcnGlassNoodles(p, 100, 100, 140, { c: '#f6f2e6', n: 18, w: 1.8, seed: 1, op: .75 }),
        `<g ${p.sh(.7)}>`, xcnBok(p, 58, 100, 44, -80, { seed: 1, cooked: true }), xcnBok(p, 142, 100, 44, 100, { seed: 2, cooked: true }), xcnBok(p, 100, 148, 40, 0, { seed: 3, cooked: true }), `</g>`,
        ...[[80, 72], [120, 74], [100, 102], [72, 112], [128, 122], [96, 132], [140, 88], [62, 82]].map(([x, y]) => K.meatball(p, x, y, 26, { c: '#c8a480' })),
        xcnOil(p, 100, 100, 140, { n: 14, c: '#f2cf6c', op: .55, rmax: 1.8 }),
        xcnScallions(p, 100, 100, 120, { n: 18 }),
        xcnShine(100, 100, 79, .4),
    ].join(''),

    // 丝瓜花蛤汤: 澄んだスープに、口の開いたあさりと、淡い緑のへちま、しょうがと青ねぎ
    cn_sigua_huage: p => [
        xcnBowl(p, { R: 92 }),
        xcnBroth(p, 79, '#ece6cc', { op: .8 }),
        ...[[78, 70, 10], [128, 70, -30], [140, 116, 60], [62, 108, -60], [100, 138, 20], [104, 100, 80], [58, 140, 0]].map(([x, y, r]) => xcnLuffa(p, x, y, 30, r)),
        ...[[100, 66, 20], [70, 96, -40], [128, 96, 80], [84, 126, 150], [124, 140, -100], [100, 112, 10], [148, 84, 40], [52, 80, 0]].map(([x, y, r], i) => xcnClam(p, x, y, 30, r, { seed: i })),
        ...[[116, 84], [80, 84]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="3" fill="#f2deaa" stroke="#c4a060" stroke-width=".6"/>`),
        xcnScallions(p, 100, 100, 120, { n: 18 }),
        xcnOil(p, 100, 100, 140, { n: 10, c: '#f2cf6c', op: .5, rmax: 1.6 }),
        xcnShine(100, 100, 79, .4),
    ].join(''),

    // 菠菜猪肝汤: 澄んだスープに、豚レバーの薄切り、ほうれん草、枸杞、しょうが
    cn_zhugan_bocai: p => [
        xcnGlazeBowl(p, { glaze: '#3f6f8a', inside: '#f4f1e8' }),
        xcnBroth(p, 78, '#d8bf8a', { op: .85 }),
        K.greens(p, 100, 100, 130, { c: '#2f7a26', n: 22, stems: '#7fb04a', seed: 1, sy: 1 }),
        ...[[86, 80, 20], [122, 78, -30], [130, 116, 60], [76, 118, -50], [104, 136, 10], [100, 102, 80], [56, 94, 30], [146, 96, -60]].map(([x, y, r], i) => xcnLiver(p, x, y, 30, r, { seed: i })),
        ...[[96, 72], [116, 100], [84, 136], [136, 136], [64, 76], [112, 124]].map(([x, y], i) => xcnGoji(p, x, y, 7, i * 40)),
        xcnOil(p, 100, 100, 140, { n: 10, c: '#f2cf6c', op: .5, rmax: 1.6 }),
        xcnShine(100, 100, 78, .4),
    ].join(''),

    // 香菇炖鸡汤: 砂锅に、黄金色の鶏のスープ、骨つき鶏、干ししいたけ、赤いなつめと枸杞
    cn_xianggu_jitang: p => [
        xcnClayPot(p),
        xcnBroth(p, 74, '#d8a444', { op: .95 }),
        ...[[78, 78, 20], [126, 76, -30], [100, 112, 60], [64, 120, 140], [138, 120, -10]].map(([x, y, r], i) => xcnChickenBone(p, x, y, 34, r, { c: '#ecc888', seed: i })),
        ...[[104, 76], [72, 98], [132, 98], [96, 144], [124, 142]].map(([x, y], i) => xcnShiitake(p, x, y, 24, i * 30)),
        xcnJujube(p, 88, 126, 13, 30), xcnJujube(p, 116, 58, 12, -20), xcnJujube(p, 150, 100, 12, 80),
        ...[[84, 62], [112, 96], [70, 140], [140, 130], [56, 92]].map(([x, y], i) => xcnGoji(p, x, y, 6.5, i * 40)),
        xcnOil(p, 100, 100, 136, { n: 20, c: '#f6c240', op: .7, rmax: 2.6 }),
        xcnShine(100, 100, 74, .35),
    ].join(''),

    // 绿豆汤: 淡い緑に濁った甘いスープに、煮てはじけた緑豆
    cn_lvdou_tang: p => [
        xcnBowl(p, { R: 90 }),
        xcnBroth(p, 77, '#a8b46a', { op: .95 }),
        xcnMungBeans(p, 100, 102, 140, { n: 210, seed: 1 }),
        `<circle cx="100" cy="100" r="77" fill="#b4bc78" opacity=".22"/>`,
        xcnMungBeans(p, 100, 102, 116, { n: 40, seed: 2 }),
        xcnShine(100, 100, 77, .45),
    ].join(''),

    // 疙瘩汤: トマトの赤いスープに、小麦粉の小さなだんご（疙瘩）、溶き卵、青菜、青ねぎ
    cn_geda_tang: p => [
        xcnBowl(p, { R: 92 }),
        xcnBroth(p, 79, '#dc7444', { op: .95 }),
        `<path d="${xcnSpots('gdt', 46, 68, 9).map(([x, y, r, q]) => xcnSmooth(ring(4.5 + q * 2, 6, .5, rng('gd' + x), 1.3, .8).map(([a, b]) => [x + a, y + b]), true, .8)).join('')}" fill="${p.g('#f2ead6', .3, .2)}" stroke="#cdbf9e" stroke-width=".5"/>`,
        ...[[76, 80, 20], [126, 116, -30], [100, 140, 60]].map(([x, y, r], i) => xcnTomato(p, x, y, 22, r, { seed: i })),
        xcnEggCloud(p, 100, 92, 50, -15, { seed: 1 }), xcnEggCloud(p, 72, 118, 40, 25, { seed: 2 }), xcnEggCloud(p, 130, 80, 40, 70, { seed: 3 }),
        K.greens(p, 120, 128, 40, { c: '#3a8a2a', n: 5, seed: 3 }), K.greens(p, 70, 70, 34, { c: '#3a8a2a', n: 4, seed: 4 }),
        xcnScallions(p, 100, 100, 120, { n: 16 }),
        xcnShine(100, 100, 79, .4),
    ].join(''),

    // 榨菜肉丝汤: 澄んだスープに、豚の細切りと榨菜の細切り、溶き卵、青ねぎ
    cn_zhacai_rousi: p => [
        xcnBowl(p, { R: 92 }),
        xcnBroth(p, 79, '#e2cf9c', { op: .8 }),
        xcnEggCloud(p, 92, 120, 54, 20, { seed: 1, op: .85 }), xcnEggCloud(p, 124, 80, 46, -20, { seed: 2, op: .85 }), xcnEggCloud(p, 68, 82, 40, 60, { seed: 3, op: .85 }),
        `<g ${p.sh(.6)}>`,
        xcnStrips(p, 100, 100, 132, { c: '#c8a07a', n: 30, w: 3.6, len: .22, seed: 1, sy: 1 }),
        xcnStrips(p, 100, 100, 128, { c: '#a8b45a', n: 22, w: 3.4, len: .2, seed: 2, sy: 1 }),
        `</g>`,
        xcnOil(p, 100, 100, 140, { n: 14, c: '#f2c24c', op: .6, rmax: 1.8 }),
        xcnScallions(p, 100, 100, 120, { n: 20 }),
        xcnShine(100, 100, 79, .4),
    ].join(''),

    // 罗宋汤: 上海風ボルシチ。トマトの赤いとろりとしたスープに、牛肉、キャベツ、じゃがいも、にんじん、玉ねぎ
    cn_luosong_tang: p => [
        xcnGlazeBowl(p, { R: 92, glaze: '#f0ece2', inside: '#f8f5ee' }),
        xcnBroth(p, 79, '#c84a2a', { op: 1 }),
        ...[[76, 74, 20], [128, 122, -30], [68, 128, 60], [132, 70, 100], [100, 100, 10]].map(([x, y, r], i) => K.leafPiece(p, x, y, 32, r, { c: '#c2c26a', vein: '#e6e2a8', seed: i, cooked: true })),
        ...[[104, 70, 10], [136, 98, -30], [96, 124, 60], [60, 100, 140], [106, 150, -10]].map(([x, y, r], i) => xcnChunk(p, x, y, 26, r, { c: '#7e4a30', seed: i, gloss: .15 })),
        ...[[82, 94], [118, 108], [146, 132], [80, 148], [54, 76], [118, 54]].map(([x, y], i) => xcnDice(p, x, y, 14, i * 20, '#eab868')),
        ...[[112, 86], [74, 116], [140, 72], [124, 140], [46, 120], [90, 62]].map(([x, y], i) => xcnDice(p, x, y, 10, i * 25, '#e86a2a')),
        `<circle cx="100" cy="100" r="79" fill="#c84a2a" opacity=".16"/>`,
        xcnOil(p, 100, 100, 140, { n: 12, c: '#f08a3a', op: .6, rmax: 1.8 }),
        K.parsley(p, 98, 98, 12), K.parsley(p, 132, 112, 10),
        xcnShine(100, 100, 79, .4),
    ].join(''),

    // 腌笃鲜: 砂锅に、白く濁ったスープ、春たけのこ、塩漬け豚と生の豚バラ、百叶結
    cn_yanduxian: p => [
        xcnClayPot(p),
        xcnBroth(p, 74, '#ede2c4', { op: 1 }),
        ...[[76, 74, 20], [126, 122, -30], [100, 98, 80], [62, 124, 140], [136, 78, -60]].map(([x, y, r], i) => xcnShoot(p, x, y, 46, r, { c: '#f2e0a8', seed: i })),
        ...[[112, 64, 10], [70, 100, -20], [108, 142, 30]].map(([x, y, r], i) => xcnPorkSlice(p, x, y, 42, r, { seed: i, c: '#b0402a', fat: '#f6ead6', char: false })),
        ...[[136, 102, -10], [84, 140, 20], [60, 76, 60]].map(([x, y, r], i) => xcnPorkSlice(p, x, y, 40, r, { seed: i + 5, c: '#e4c0a4', fat: '#fbf3e6', char: false, gloss: .3 })),
        ...[[96, 120, 20], [146, 134, -30], [92, 60, 70], [156, 96, 10], [48, 104, -20]].map(([x, y, r]) => xcnTofuKnot(p, x, y, 24, r)),
        `<circle cx="100" cy="100" r="74" fill="#f2ead6" opacity=".14"/>`,
        xcnOil(p, 100, 100, 130, { n: 10, c: '#f2d27a', op: .5, rmax: 1.8 }),
        xcnShine(100, 100, 74, .35),
    ].join(''),

    // 萝卜羊肉汤: 白く濁ったスープに、羊肉のかたまり、大根の角切り、香菜と青ねぎ、こしょう
    cn_luobo_yangrou: p => [
        xcnBowl(p, { R: 92 }),
        xcnBroth(p, 79, '#ede4cc', { op: 1 }),
        ...[[80, 76, 20], [126, 74, -30], [100, 112, 60], [62, 120, 140], [138, 120, -10], [96, 148, 20]].map(([x, y, r], i) => xcnChunk(p, x, y, 26, r, { c: '#9a6a4c', seed: i, fat: '#efe2cc' })),
        ...[[104, 76, 10], [72, 98, 40], [138, 96, -20], [84, 140, 70], [124, 140, 30], [118, 104, 0], [56, 80, 20]].map(([x, y, r], i) => xcnBlock(p, x, y, 20, r, { c: '#f4eedc', seed: i })),
        `<circle cx="100" cy="100" r="79" fill="#f0e8d4" opacity=".18"/>`,
        xcnOil(p, 100, 100, 140, { n: 12, c: '#f2cf6c', op: .55, rmax: 1.8 }),
        xcnGrains(p, 100, 100, 120, { cols: ['#3a2a1a'], n: 26, size: .7, seed: 2 }),
        ...[[100, 92, 20], [80, 120, -40], [128, 108, 70], [112, 132, 10], [86, 66, 40]].map(([x, y, r]) => xcnCilantro(p, x, y, 14, r)),
        xcnScallions(p, 100, 100, 110, { n: 12 }),
        xcnShine(100, 100, 79, .4),
    ].join(''),

    // 西湖牛肉羹: とろみのあるスープに、細かい牛肉、豆腐としいたけの小さな角切り、白い卵白の筋、香菜
    cn_xihu_niurougeng: p => [
        xcnGlazeBowl(p, { glaze: '#3e6a5a', inside: '#f4f1e8' }),
        xcnBroth(p, 78, '#d2bc8e', { op: 1 }),
        ...[[96, 92, -15], [80, 128, 25], [130, 112, 70], [120, 68, 10], [66, 86, 80]].map(([x, y, r], i) => xcnEggCloud(p, x, y, 54, r, { seed: i, c: '#faf6ea', op: .85 })),
        xcnGrains(p, 100, 100, 136, { cols: ['#7a4a2e', '#8e5a3a'], n: 70, size: 1.8, seed: 1 }),
        ...xcnSpots('xhn', 24, 62, 12).map(([x, y, r], i) => i % 3 === 2 ? xcnDice(p, x, y, 6.5, r, '#7a5034') : xcnDice(p, x, y, 7, r, '#f8f4e6')),
        `<circle cx="100" cy="100" r="78" fill="#d8c494" opacity=".14"/>`,
        xcnGrains(p, 100, 100, 120, { cols: ['#3f8a2c', '#5aa63c'], n: 34, size: 1.5, seed: 3 }),
        xcnCilantro(p, 108, 96, 13, 20), xcnCilantro(p, 84, 110, 12, -40),
        xcnShine(100, 100, 78, .45),
    ].join(''),

    // 菌菇汤: きのこのだしの澄んだスープに、エリンギ・しめじ・えのき、にんじん、青ねぎ
    cn_jungu_tang: p => [
        xcnBowl(p, { R: 92 }),
        xcnBroth(p, 79, '#c9a46a', { op: .9 }),
        ...[[78, 74, 20], [128, 118, -30], [120, 68, 60], [68, 124, -20], [100, 100, 100]].map(([x, y, r]) => K.eringi(p, x, y, 44, r)),
        K.shimeji(p, 104, 136, 50, -60, { n: 4 }), K.shimeji(p, 146, 92, 40, 160, { n: 4 }), K.shimeji(p, 56, 92, 40, -10, { n: 3 }),
        xcnEnoki(p, 92, 62, 48, -10, { seed: 1, n: 8 }), xcnEnoki(p, 134, 146, 44, 30, { seed: 2 }), xcnEnoki(p, 70, 150, 40, -40, { seed: 3, n: 6 }),
        ...[[100, 84], [60, 140], [150, 118], [116, 100], [82, 104]].map(([x, y], i) => K.carrotRound(p, x, y, 13, { half: true, r: i * 50 })),
        xcnOil(p, 100, 100, 140, { n: 12, c: '#f2cf6c', op: .5, rmax: 1.8 }),
        xcnScallions(p, 100, 100, 120, { n: 18 }),
        xcnShine(100, 100, 79, .4),
    ].join(''),

    // 玉米鸡蛋羹: とろりとした黄色いコーンのスープに、コーンの粒、溶き卵、にんじん、青ねぎ
    cn_yumi_geng: p => [
        xcnBowl(p, { R: 92 }),
        xcnBroth(p, 79, '#f2cc5a', { op: 1 }),
        ...[[96, 92, -15], [80, 124, 25], [126, 106, 70], [120, 68, 10], [66, 84, 80], [128, 140, -30]].map(([x, y, r], i) => xcnEggCloud(p, x, y, 50, r, { seed: i, c: '#fbe48a', op: .85 })),
        K.corn(p, 100, 100, 130, { n: 70 }),
        ...xcnSpots('ymg', 12, 60, 14).map(([x, y, r]) => `<rect ${T(x, y, r)} x="-2.6" y="-2.6" width="5.2" height="5.2" rx="1.1" fill="${p.g('#ec7a2e', .3, .2)}" stroke="#b4521a" stroke-width=".5"/>`),
        `<circle cx="100" cy="100" r="79" fill="#f6d46a" opacity=".12"/>`,
        xcnScallions(p, 100, 100, 110, { n: 16 }),
        xcnShine(100, 100, 79, .45),
    ].join(''),

    // 海带豆腐汤: 澄んだスープに、濃い緑の昆布、さいの目の豆腐、小えび（干しえび）、青ねぎ
    cn_haidai_doufu: p => [
        xcnBowl(p, { R: 92 }),
        xcnBroth(p, 79, '#dcd2ae', { op: .85 }),
        ...[[78, 76, 20], [126, 120, -30], [120, 70, 60], [70, 124, -20], [146, 96, 80], [98, 148, 10]].map(([x, y, r], i) => xcnKelp(p, x, y, 32, r, { seed: i })),
        ...[[100, 96, 8], [96, 126, -6], [140, 124, 14], [102, 64, -10], [60, 98, 4], [124, 96, 20], [76, 100, -14], [118, 148, 10]].map(([x, y, r]) => K.tofu(p, x, y, 17, 16, r, { c: '#f8f4e8' })),
        ...[[88, 84, 20], [132, 108, -40], [84, 140, 60], [112, 82, 100]].map(([x, y, r]) => K.shrimp(p, x, y, 10, r, { c: '#e8905a' })),
        xcnScallions(p, 100, 100, 120, { n: 18 }),
        xcnOil(p, 100, 100, 140, { n: 10, c: '#f2cf6c', op: .5, rmax: 1.6 }),
        xcnShine(100, 100, 79, .4),
    ].join(''),

    // 酸汤肥牛: 黒い器に、黄金色の酸っぱいスープ、薄切り牛肉、えのき、春雨、赤と青の唐辛子の輪切り
    cn_suantang_feiniu: p => [
        xcnGlazeBowl(p, { R: 93, glaze: '#2b2b2b', inside: '#3a3434', lip: .88 }),
        xcnBroth(p, 81, '#e8b42c', { op: 1 }),
        xcnGlassNoodles(p, 100, 100, 140, { c: '#f6eccc', n: 10, w: 1.8, seed: 1, op: .7 }),
        xcnEnoki(p, 70, 124, 44, -40, { seed: 1 }), xcnEnoki(p, 134, 72, 40, 140, { seed: 2 }),
        ...xcnSpots('stfn', 12, 58, 24).map(([x, y, r, q], i) => xcnFeiniu(p, x, y, 36 + q * 6, r, { seed: i, c: i % 2 ? '#c08a7a' : '#b47e6e' })),
        ...xcnSpots('stfn2', 10, 60, 18).map(([x, y], i) => xcnChiliRing(x, y, 8, i % 2 ? '#d42a1c' : '#4f9a2e')),
        xcnOil(p, 100, 100, 150, { n: 14, c: '#f6c43a', op: .6, rmax: 2 }),
        xcnScallions(p, 100, 100, 110, { n: 12 }),
        xcnShine(100, 100, 81, .45),
    ].join(''),

    // 银耳莲子羹: とろりと透けた甘いスープに、白きくらげ、蓮の実、赤いなつめ、枸杞
    cn_yiner_lianzi: p => [
        xcnGlazeBowl(p, { glaze: '#e8e0f0', inside: '#faf8f2' }),
        xcnBroth(p, 78, '#ead2a0', { op: .9 }),
        xcnSilverEar(p, 76, 78, 54, { seed: 1 }), xcnSilverEar(p, 128, 82, 52, { seed: 2 }), xcnSilverEar(p, 100, 128, 58, { seed: 3 }), xcnSilverEar(p, 142, 130, 42, { seed: 5 }),
        ...[[100, 92], [70, 104], [128, 108], [88, 150], [116, 58], [146, 100], [80, 56]].map(([x, y], i) => xcnLotusSeed(p, x, y, 14, i * 40)),
        xcnJujube(p, 112, 104, 16, 30), xcnJujube(p, 72, 142, 15, -20), xcnJujube(p, 98, 66, 15, 80),
        ...[[90, 116], [120, 140], [60, 90], [140, 70], [110, 84]].map(([x, y], i) => xcnGoji(p, x, y, 7, i * 40)),
        xcnShine(100, 100, 78, .5),
    ].join(''),

};
