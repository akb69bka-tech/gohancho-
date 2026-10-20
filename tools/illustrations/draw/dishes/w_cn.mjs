// 中国（家常菜）: 青花の白い器に盛った毎日のおかず・汤・米饭
import * as K from '../kit.mjs';

const { T, f, smooth, ring, rng, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;
// 1桁小数のなめらかな閉じた形（kit の smooth と同じ、軽いSVGのため）
function wcSmooth(pts, closed = true, k = 1){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6 * k)},${f1(p1[1] + (p2[1] - p0[1]) / 6 * k)} ${f1(p2[0] - (p3[0] - p1[0]) / 6 * k)},${f1(p2[1] - (p3[1] - p1[1]) / 6 * k)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}

// =========================================================
// 器（青花: 白地にコバルトの線と小さな雲の文様）
// =========================================================
const BLUE = '#2a58a6';
function wcMotif(p, rm, n, sz = 1){
    let d = '';
    for (let i = 0; i < n; i++){
        const a = i / n * Math.PI * 2, x = 100 + Math.cos(a) * rm, y = 100 + Math.sin(a) * rm, c = Math.cos(a + Math.PI / 2), s = Math.sin(a + Math.PI / 2);
        const pt = (u, v) => `${f1(x + (u * c - v * s) * sz)},${f1(y + (u * s + v * c) * sz)}`;
        d += `M${pt(-3.4, 1)}Q${pt(-3.4, -2.4)} ${pt(0, -2.4)}Q${pt(2.6, -2.4)} ${pt(2.6, -.2)}Q${pt(2.6, 1.6)} ${pt(.8, 1.4)}`;
    }
    return `<path d="${d}" stroke="${BLUE}" stroke-width="${f1(1.1 * sz)}" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 平皿（盘子）
function wcPlate(p, { R = 94, well = .72 } = {}){
    const w = R * well, base = '#fbfbf7';
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .1, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${BLUE}" stroke-width="2"/>
        ${wcMotif(p, (R - 3 + w + 4) / 2, 22)}
        <circle cx="100" cy="100" r="${f1(w + 4)}" fill="none" stroke="${BLUE}" stroke-width=".9" opacity=".8"/>
        <circle cx="100" cy="100" r="${f1(w + 1.5)}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".45"/>
        <circle cx="100" cy="100" r="${f1(w)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .2)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 碗（汤碗・饭碗）: 縁に青い二重線、内側の縁に小さな文様
function wcBowl(p, { R = 92, inside = '#fbfaf5', motif = true } = {}){
    const r = R * .88;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#f8f7f2', .25, .2, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.6}" fill="none" stroke="${BLUE}" stroke-width="2.4"/>
        <circle cx="100" cy="100" r="${f1(r + 1.2)}" fill="none" stroke="${BLUE}" stroke-width=".9"/>
        ${motif ? wcMotif(p, (R - 3.8 + r + 1.2) / 2, 26, .75) : ''}
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .22, .64, .66)}"/>
        <path d="M${f1(100 - R * .7)},${f1(100 - R * .42)} A${f1(R * .82)},${f1(R * .82)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .78)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 鱼盘（長い楕円の皿）
function wcFishPlate(p, { rx = 97, ry = 70 } = {}){
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

// =========================================================
// ご飯・麺（e_rice_noodle.mjs の部品を写したもの）
// =========================================================
function wcSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
function wcOutline(p, c, r = .55){
    const id = p.def('wcOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
function wcRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'wcRice' + seed + x + y);
    const shape = wcSm(ring(s / 2, 14, .07, R, 1, sy), true);
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
    const shade = p.def('wcRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// うねった麺
function wcWavy(p, x, y, s, { c = '#f3ead2', w = 5, n = 14, seed = 1, sy = .9, len = .55, wav = .5, outline = null, layers = 4 } = {}){
    const R = rng(p.id + 'wcWv' + seed + x);
    const ol = wcOutline(p, outline || dk(c, .25), .6), rad = s / 2;
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
        const dd = wcSm(pts);
        const l = L[i % layers];
        if (R() < .3) l[1] += dd; else l[0] += dd;
        if (R() < .5) l[2] += wcSm(pts.slice(1, 4).map(([a, b]) => [a - w * .18, b - w * .2]));
    }
    return `<g ${p.sh(.8)}>${L.map(([a, b, h]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .14)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>${h ? `<path d="${h}" stroke="#fff" stroke-width="${f1(w * .24)}" fill="none" stroke-linecap="round" opacity=".5"/>` : ''}`).join('')}</g>`;
}
// 小さな粒（にんにくのみじん切り・ひき肉など）。色ごとに1本のpath
function wcGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'wcGr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; });
        ds[k] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`).join('');
}
// 細切りの束（肉・にんじん・ピーマン・木耳・じゃがいも）。色3段を1本ずつのpathにまとめ、輪郭はフィルター
function wcStrips(p, x, y, s, { c = '#8a5230', n = 14, w = 3.4, len = .28, seed = 1, sy = .85, curve = .25, dir = null, gloss = .4 } = {}){
    const R = rng(p.id + 'wcSt' + seed + x + y);
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
    return `<g ${wcOutline(p, dk(c, .35), .5)} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>${gloss ? `<path d="${hl}" stroke="#fff" stroke-width="${f1(w * .28)}" fill="none" stroke-linecap="round" opacity="${gloss}"/>` : ''}`;
}

// =========================================================
// 具
// =========================================================
// ふんわり大きな炒り卵のかたまり（番茄炒蛋）: 丸いこぶが寄り集まった形、淡い黄色、ところどころ焼き色
function wcEggCurd(p, x, y, s, r = 0, { seed = 1, juice = 0 } = {}){
    const R = rng(p.id + 'wcEg' + seed + x + y);
    let lobes = '', folds = '';
    const n = 5;
    for (let i = 0; i < n; i++){
        const a = i / n * 6.28 + R(), d = i === 0 ? 0 : s * (.16 + R() * .1), rr = s * (.2 + R() * .08);
        const lx = Math.cos(a) * d * 1.15, ly = Math.sin(a) * d * .85;
        lobes += `<path ${T(lx, ly)} d="${wcSmooth(ring(rr, 9, .3, R, 1.15, .9))}" fill="${p.g('#fadb6a', .5, .18)}" stroke="#e0ae3a" stroke-width=".7"/>`;
        folds += `M${f1(lx - rr * .5)},${f1(ly + rr * .3)} Q${f1(lx)},${f1(ly + rr * .6)} ${f1(lx + rr * .5)},${f1(ly + rr * .25)}`;
    }
    return `<g ${T(x, y, r)}>${lobes}
        <path d="${folds}" stroke="#e8b043" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/>
        ${juice ? `<ellipse cx="${f1(s * .18)}" cy="${f1(s * .2)}" rx="${f1(s * .22)}" ry="${f1(s * .1)}" fill="#e2502a" opacity="${juice}"/>` : ''}
        <ellipse cx="${f1(s * .14)}" cy="${f1(-s * .02)}" rx="${f1(s * .08)}" ry="${f1(s * .05)}" fill="#e3a640" opacity=".35"/>
        <path d="M${f1(-s * .3)},${f1(-s * .1)} Q${f1(-s * .16)},${f1(-s * .28)} ${f1(s * .06)},${f1(-s * .26)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// 炒めてやわらかくなったトマトのくし形
function wcTomato(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wcTm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.18, .78);
    return `<g ${T(x, y, r, k)}><path d="${wcSmooth(pts, true, .7)}" fill="${p.g('#e0392a', .3, .25)}" stroke="#a6261a" stroke-width=".6"/>
        <path d="${wcSmooth(pts.map(([a, b]) => [a * .64, b * .56 + 1.2]), true, .7)}" fill="#f2694c" opacity=".95"/>
        <path d="M-4.4,1.6 Q-2.8,-.8 -1.2,1.6 M1.2,1.8 Q2.8,-.6 4.4,1.8" stroke="#f6c463" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-3.8 Q-1,-7.4 5,-5.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 红烧肉の角切り: 皮・脂・赤身の層が見える、赤茶の照り
function wcPorkCube(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wcPc' + seed + x);
    const h = s / 2, j = () => (R() - .5) * s * .08;
    const pts = [[-h + j(), -h + j()], [h + j(), -h + j()], [h + j(), h + j()], [-h + j(), h + j()]];
    const shape = wcSmooth(pts, true, .4);
    const id = p.uid();
    const bands = [['#6a1e0c', .14], ['#e8b47a', .18], ['#a33c1a', .24], ['#e2a86c', .14], ['#94341a', .32]];
    let yy = -h - 2, lay = '';
    for (const [c, t] of bands){ const bh = s * t + (R() - .5) * 2; lay += `<path d="M${f1(-h - 3)},${f1(yy)} Q0,${f1(yy + (R() - .5) * 5)} ${f1(h + 3)},${f1(yy + (R() - .5) * 3)} L${f1(h + 3)},${f1(yy + bh + 2)} L${f1(-h - 3)},${f1(yy + bh + 2)}Z" fill="${p.g(c, .25, .25)}"/>`; yy += bh; }
    return `<g ${T(x, y, r)}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
        <g ${p.sh(1)}><path d="${shape}" fill="#7a2410"/></g>
        <g clip-path="url(#${id})">${lay}<path d="${shape}" fill="#9a2e10" opacity=".28"/></g>
        <path d="${shape}" fill="none" stroke="#4a1206" stroke-width=".9"/>
        <path d="M${f1(-h * .7)},${f1(-h * .3)} Q0,${f1(-h * .5)} ${f1(h * .6)},${f1(-h * .32)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${f1(-h * .6)},${f1(h * .45)} Q${f1(-h * .1)},${f1(h * .35)} ${f1(h * .3)},${f1(h * .42)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// たれのからんだ鶏の角切り（宫保鸡丁）
function wcDice(p, x, y, s, r = 0, { c = '#b8582a', core = '#e8b277', seed = 1 } = {}){
    const R = rng(p.id + 'wcDc' + seed + x + y);
    const h = s / 2, pts = [[-h, -h], [0, -h * 1.05], [h, -h], [h * 1.05, 0], [h, h], [0, h * 1.04], [-h, h], [-h * 1.05, 0]].map(([a, b]) => [a + (R() - .5) * s * .14, b + (R() - .5) * s * .14]);
    return `<g ${T(x, y, r)}><path d="${wcSmooth(pts, true, .5)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="${wcSmooth(pts.map(([a, b]) => [a * .55 - h * .1, b * .5 - h * .12]), true, .5)}" fill="${core}" opacity=".55"/>
        <path d="M${f1(-h * .6)},${f1(-h * .5)} Q${f1(-h * .1)},${f1(-h * .85)} ${f1(h * .45)},${f1(-h * .6)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 落花生（半割り）
function wcPeanut(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .34)}" fill="${p.g('#e9c58a', .3, .28)}" stroke="#a87638" stroke-width=".6"/>
        <path d="M${f1(-s * .42)},0 Q0,${f1(s * .06)} ${f1(s * .42)},0" stroke="#c49556" stroke-width=".7" fill="none"/>
        <path d="M${f1(s * .2)},${f1(s * .24)} Q${f1(s * .42)},${f1(s * .12)} ${f1(s * .46)},${f1(-s * .06)}" stroke="#a8482a" stroke-width="1" fill="none" opacity=".55"/>
        <ellipse cx="${f1(-s * .16)}" cy="${f1(-s * .14)}" rx="${f1(s * .14)}" ry="${f1(s * .06)}" fill="#fff" opacity=".6"/></g>`;
}
// 乾燥唐辛子（切ったさや）
function wcChili(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><path d="M-10,0 Q-8,-3.6 0,-3.6 Q8,-3.4 10,-.6 Q8,3 0,3.4 Q-8,3.6 -10,0Z" fill="${p.g('#b8231a', .3, .35)}" stroke="#6a0e08" stroke-width=".7"/>
        <path d="M-10,0 Q-11.5,0 -11.5,-.2" stroke="#6a0e08" stroke-width="1" fill="none"/>
        <path d="M-6,-1.8 Q0,-3 6,-1.8" stroke="#ff8a6a" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".75"/>
        <circle cx="2" cy="1" r=".8" fill="#f1d38a"/><circle cx="-2" cy="1.4" r=".7" fill="#f1d38a"/></g>`;
}
// ぶつ切りの長ねぎ（白い部分を横から）
function wcScallionSeg(p, x, y, s, r = 0, { green = false } = {}){
    const c = green ? '#9cc860' : '#f1f3df', h = s * .42;
    return `<g ${T(x, y, r)}><rect x="${f1(-s / 2)}" y="${f1(-h / 2)}" width="${f1(s)}" height="${f1(h)}" rx="${f1(h * .4)}" fill="${p.g(c, .3, .18)}" stroke="${dk(c, .3)}" stroke-width=".6"/>
        <path d="M${f1(-s * .38)},${f1(-h * .1)} L${f1(s * .38)},${f1(-h * .1)}" stroke="${dk(c, .12)}" stroke-width=".6"/>
        <path d="M${f1(-s * .36)},${f1(-h * .3)} L${f1(s * .2)},${f1(-h * .3)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`;
}
// 細い白髪ねぎ・しょうがの千切り（清蒸鱼の上）
function wcFineShreds(p, x, y, s, { c = '#f2f4e2', n = 16, w = 1.4, seed = 1, dir = -.4, len = .7 } = {}){
    const R = rng(p.id + 'wcFs' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){
        const a = dir + (R() - .5) * .9, L = s * len * (.6 + R() * .5), cx = x + (R() - .5) * s * .7, cy = y + (R() - .5) * s * .4;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, b = (R() - .5) * 4;
        d += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx + b)} ${f1(cy - b)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(w + .8)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
// 木耳（ひらひらした黒い1片）
function wcWoodEar(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wcWe' + seed + x + y);
    const pts = ring(s / 2, 14, .42, R, 1.15, .85);
    return `<g ${T(x, y, r)}><path d="${wcSmooth(pts, true, .9)}" fill="${p.g('#3d2c28', .28, .35)}" stroke="#140a08" stroke-width=".7"/>
        <path d="${wcSmooth(pts.map(([a, b]) => [a * .62, b * .62]), true, .9)}" fill="none" stroke="#6e5a52" stroke-width="1" opacity=".7"/>
        <path d="M${f1(-s * .1)},${f1(-s * .02)} Q${f1(s * .05)},${f1(s * .12)} ${f1(s * .18)},${f1(s * .02)}" stroke="#1e1210" stroke-width="1.2" fill="none" opacity=".8"/>
        <path d="M${f1(-s * .32)},${f1(-s * .1)} Q${f1(-s * .15)},${f1(-s * .32)} ${f1(s * .12)},${f1(-s * .3)}" stroke="#b8a8a0" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 清蒸鱼（一尾、横向き。頭は左）
function wcSteamedFish(p, x, y, L, r = 0){
    const h = L * .3;
    const gid = p.def('wcFishG', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f7c84"/><stop offset=".38" stop-color="#b9c0bf"/><stop offset=".62" stop-color="#ebe6da"/><stop offset="1" stop-color="#d9d2c2"/></linearGradient>`);
    const body = `M${f1(-L / 2)},0 C${f1(-L * .45)},${f1(-h * .5)} ${f1(-L * .26)},${f1(-h * .64)} ${f1(-L * .05)},${f1(-h * .6)} C${f1(L * .15)},${f1(-h * .56)} ${f1(L * .28)},${f1(-h * .3)} ${f1(L * .35)},${f1(-h * .12)} L${f1(L * .35)},${f1(h * .12)} C${f1(L * .28)},${f1(h * .3)} ${f1(L * .15)},${f1(h * .56)} ${f1(-L * .05)},${f1(h * .6)} C${f1(-L * .26)},${f1(h * .64)} ${f1(-L * .45)},${f1(h * .5)} ${f1(-L / 2)},0Z`;
    const tail = `M${f1(L * .33)},0 L${f1(L * .5)},${f1(-h * .62)} Q${f1(L * .44)},0 ${f1(L * .5)},${f1(h * .62)}Z`;
    const fin = `M${f1(-L * .12)},${f1(-h * .58)} Q${f1(L * .06)},${f1(-h * .92)} ${f1(L * .24)},${f1(-h * .36)}Z`;
    let cuts = '';
    for (const cx of [-.16, 0, .15]){ const X = L * cx; cuts += `M${f1(X - h * .05)},${f1(-h * .48)} Q${f1(X + h * .08)},${f1(-h * .15)} ${f1(X - h * .02)},${f1(h * .22)}`; }
    let rays = '';
    for (let i = -2; i <= 2; i++) rays += `M${f1(L * .36)},0 L${f1(L * .48)},${f1(i * h * .24)}`;
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}><path d="${tail}" fill="${p.g('#8f9894', .25, .2)}" stroke="#56605e" stroke-width=".7"/><path d="${fin}" fill="#7e8a8a" stroke="#56605e" stroke-width=".6"/><path d="${body}" fill="url(#${gid})" stroke="#5e6766" stroke-width=".9"/></g>
        <path d="${rays}" stroke="#5e6766" stroke-width=".6" opacity=".6"/>
        <path d="${cuts}" stroke="#7e8584" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="${cuts}" stroke="#f8f2e4" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-L * .31)},${f1(-h * .42)} Q${f1(-L * .26)},0 ${f1(-L * .31)},${f1(h * .42)}" stroke="#5e6766" stroke-width="1.1" fill="none" opacity=".7"/>
        <circle cx="${f1(-L * .4)}" cy="${f1(-h * .14)}" r="${f1(h * .1)}" fill="#f2eee4" stroke="#6a6a64" stroke-width=".7"/><circle cx="${f1(-L * .4)}" cy="${f1(-h * .14)}" r="${f1(h * .04)}" fill="#3a3a38"/>
        <path d="M${f1(-L * .4)},${f1(h * .1)} Q${f1(-L * .45)},${f1(h * .14)} ${f1(-L * .48)},${f1(h * .06)}" stroke="#5e6766" stroke-width=".8" fill="none"/>
        <path d="M${f1(-L * .2)},${f1(-h * .5)} Q${f1(L * .02)},${f1(-h * .66)} ${f1(L * .22)},${f1(-h * .4)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 焼き色のついた厚い三角の豆腐（家常豆腐）: 上は狐色に焼けた面（焼きむら）、手前の辺に白っぽい切り口の側面
function wcTofuTri(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wcTt' + seed + x + y);
    const pts = [[-s / 2, s * .3], [s / 2, s * .3], [0, -s * .48]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]);
    const side = [[pts[0][0], pts[0][1]], [pts[1][0], pts[1][1]], [pts[1][0] - 1, pts[1][1] + s * .14], [pts[0][0] + 1, pts[0][1] + s * .14]];
    let spots = '';
    for (let i = 0; i < 6; i++) spots += `<ellipse cx="${f1((R() - .5) * s * .45)}" cy="${f1(s * (-.15 + R() * .35))}" rx="${f1(s * (.05 + R() * .07))}" ry="${f1(s * (.03 + R() * .04))}" fill="#a8641e" opacity="${f1(.25 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${wcSmooth(side, true, .2)}" fill="${p.g('#f2dfb0', .2, .2)}" stroke="#b88a48" stroke-width=".7"/><path d="${wcSmooth(pts, true, .25)}" fill="${p.g('#e3aa4c', .35, .3)}" stroke="#9a6020" stroke-width=".8" stroke-linejoin="round"/></g>
        ${spots}
        <path d="M${f1(-s * .3)},${f1(s * .18)} L${f1(-s * .06)},${f1(-s * .3)}" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>
        <path d="M${f1(-s * .1)},${f1(s * .16)} Q${f1(s * .1)},${f1(s * .06)} ${f1(s * .3)},${f1(s * .22)}" stroke="#a63a16" stroke-width="${f1(s * .1)}" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// チンゲン菜・上海青（縦割り）
function wcBok(p, x, y, s, r = 0, { seed = 1, leaf = true } = {}){
    const k = s / 50, R = rng(p.id + 'wcBk' + seed + x);
    const lf = leaf ? `<path d="${wcSmooth([[4, -8], [14, -14], [26, -12], [30, -2], [28, 9], [17, 13], [5, 7]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]))}" fill="${p.g('#3f8c2e', .25, .3)}" stroke="#25601c" stroke-width=".7"/>
        <path d="M2,0 Q15,-1 28,-1 M14,-1 L20,-8 M14,-1 L20,7 M22,-1 L26,-6 M22,-1 L26,5" stroke="#8cc566" stroke-width=".9" fill="none"/>` : '';
    return `<g ${T(x, y, r, k)}>${lf}
        <path d="M-24,0 Q-24,-9 -14,-9.5 Q-2,-8 8,-3.5 L8,3.5 Q-2,8 -14,9.5 Q-24,9 -24,0Z" fill="${p.g('#bfe08a', .35, .22)}" stroke="#7fae4c" stroke-width=".7"/>
        <path d="M-20,-3 Q-8,-4 6,-1.5 M-20,3 Q-8,4 6,1.5" stroke="#d9efb6" stroke-width=".9" fill="none"/>
        <path d="M-20,-5.5 Q-12,-8 -2,-6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// 炒めたなす（皮つき乱切り）
function wcNasu(p, x, y, s, r = 0, { flesh = '#c99050', skin = '#4a2252', seed = 1 } = {}){
    const R = rng(p.id + 'wcNs' + seed + x + y);
    const k = s / 20;
    const pts = [[-10, -3], [-4, -9], [7, -8], [10, 2], [5, 8], [-6, 7]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]);
    const inner = [pts[0], pts[1], pts[2], [pts[3][0] - 3.4, pts[3][1] - 1.6], [pts[4][0] - 2.6, pts[4][1] - 3.4], [pts[5][0] + .6, pts[5][1] - 3.6]];
    return `<g ${T(x, y, r, k)}><path d="${wcSmooth(pts, true, .6)}" fill="${p.g(skin, .3, .25)}" stroke="#26102c" stroke-width=".6"/>
        <path d="${wcSmooth(inner, true, .6)}" fill="${p.g(flesh, .3, .25)}" stroke="${dk(flesh, .25)}" stroke-width=".5"/>
        <path d="M-6,-4 Q-1,-7.4 5,-6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M8,1 Q6,5.5 2.5,7" stroke="#c8a0d8" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 香菜の葉
function wcCilantro(p, x, y, s, r = 0){
    const k = s / 16;
    const lobe = a => `<path transform="rotate(${a})" d="M0,0 Q-5,-3 -4.6,-7 Q-2.4,-9.6 0,-8 Q2.4,-9.6 4.6,-7 Q5,-3 0,0Z" fill="#4c9a32" stroke="#2c6a1e" stroke-width=".6"/>`;
    return `<g ${T(x, y, r, k)}><path d="M0,0 L0,7" stroke="#7fb850" stroke-width="1.2" stroke-linecap="round"/>${lobe(-62)}${lobe(0)}${lobe(62)}<path d="M0,-1 L0,-6 M0,-1 L-4,-4 M0,-1 L4,-4" stroke="#8cc866" stroke-width=".5"/></g>`;
}
// 斜め切りの芹菜（中国芹菜の茎）
function wcCelery(p, x, y, L, r = 0, { c = '#78b446' } = {}){
    const w = L * .2;
    return `<g ${T(x, y, r)}><path d="M${f1(-L / 2 + w * .6)},${f1(-w / 2)} L${f1(L / 2)},${f1(-w / 2)} L${f1(L / 2 - w * .6)},${f1(w / 2)} L${f1(-L / 2)},${f1(w / 2)}Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M${f1(-L * .4)},${f1(-w * .12)} L${f1(L * .42)},${f1(-w * .12)} M${f1(-L * .42)},${f1(w * .2)} L${f1(L * .38)},${f1(w * .2)}" stroke="${lt(c, .35)}" stroke-width=".7"/>
        <path d="M${f1(-L * .3)},${f1(-w * .34)} L${f1(L * .3)},${f1(-w * .34)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g>`;
}
// 香干の細切り（茶色い皮と淡い断面）
function wcXianggan(p, x, y, L, r = 0){
    const w = L * .3;
    return `<g ${T(x, y, r)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${f1(L)}" height="${f1(w)}" rx="1.4" fill="${p.g('#dcb882', .3, .2)}" stroke="#5e3414" stroke-width="1.1"/>
        <path d="M${f1(-L * .4)},${f1(-w * .18)} L${f1(L * .3)},${f1(-w * .18)}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".55"/></g>`;
}
// 皮蛋のくし切り（琥珀のゼリー状の白身、濃い灰緑の黄身）
function wcPidan(p, x, y, s, r = 0){
    const k = s / 24;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-12,2 Q-10,-8 0,-8.6 Q10,-8 12,2 Q0,5.4 -12,2Z" fill="${p.g('#7a4618', .35, .35)}" stroke="#3a1c08" stroke-width=".7"/></g>
        <path d="M-9.4,1.4 Q-7,-4.6 0,-5 Q7,-4.6 9.4,1.4 Q0,3.8 -9.4,1.4Z" fill="${p.g('#a86a2a', .3, .25)}" opacity=".85"/>
        <path d="M-6.4,1.6 Q-4.6,-2.4 0,-2.6 Q4.6,-2.4 6.4,1.6 Q0,3.2 -6.4,1.6Z" fill="${p.g('#4f5636', .25, .3)}" stroke="#7e7c4c" stroke-width=".9"/>
        <ellipse cx="0" cy=".4" rx="2.6" ry="1.1" fill="#2e3220"/>
        <path d="M-9,-3 Q-4,-7.6 3,-7.4" stroke="#ffe4b8" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 紫菜（黒紫の薄い海苔のかけら）
function wcLaver(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wcLv' + seed + x + y);
    return `<g ${T(x, y, r)}><g ${p.rough(3, .2)}><path d="${wcSmooth(ring(s / 2, 10, .5, R, 1.25, .75), true, .7)}" fill="#2c2433" opacity=".86"/></g>
        <path d="M${f1(-s * .3)},${f1(-s * .02)} Q0,${f1(-s * .14)} ${f1(s * .3)},${f1(-s * .04)}" stroke="#5c4a6a" stroke-width=".9" fill="none" opacity=".8"/></g>`;
}
// 汁の中のふんわり溶き卵（z_soup.mjs の部品を写したもの）
function wcEggCloud(p, x, y, L, r = 0, { seed = 1, c = '#f8d65c', op = .95 } = {}){
    const R = rng(p.id + 'wcEc' + seed + x + y);
    const pts = ring(L / 2, 15, .5, R, 1, .46);
    return `<g ${T(x, y, r)} opacity="${op}"><g ${p.rough(4, .14)}><path d="${wcSmooth(pts, true, .9)}" fill="${lt(c, .35)}" opacity=".6"/>
        <path d="${wcSmooth(pts.map(([a, b]) => [a * .78, b * .7]), true, .9)}" fill="${p.g(c, .35, .12)}" opacity=".95"/></g>
        <path d="${wcSmooth(pts.map(([a, b]) => [a * .42 - 1.5, b * .3 - 1]), true, .9)}" fill="${lt(c, .55)}" opacity=".75"/></g>`;
}
function wcOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .6, rmax = 2 } = {}){
    const R = rng(p.id + 'wcOi' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
const wcShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// 冬瓜（煮て透き通った厚い切り身、片側に緑の皮）
function wcWinterMelon(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'wcWm' + seed + x + y);
    const w = s, h = s * .72, j = () => (R() - .5) * 2;
    const pts = [[-w / 2 + j(), -h / 2 + j()], [w / 2 + j(), -h / 2 + j()], [w / 2 + j(), h / 2 + j()], [-w / 2 + j(), h / 2 + j()]];
    return `<g ${T(x, y, r)}><path d="${wcSmooth(pts, true, .35)}" fill="${p.g('#e3ebc6', .4, .15)}" stroke="#b9c896" stroke-width=".7" opacity=".93"/>
        <path d="M${f1(pts[3][0] + 1)},${f1(pts[3][1] - 1.4)} L${f1(pts[2][0] - 1)},${f1(pts[2][1] - 1.4)}" stroke="#5f8a3e" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M${f1(pts[3][0] + 2)},${f1(pts[3][1] - 4)} L${f1(pts[2][0] - 2)},${f1(pts[2][1] - 4)}" stroke="#a9c47a" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
        <path d="M${f1(-w * .3)},${f1(-h * .2)} Q${f1(-w * .05)},${f1(-h * .36)} ${f1(w * .24)},${f1(-h * .28)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// 煮込んだスペアリブのぶつ切り: 角の丸い肉のかたまり、片側の端から白い骨の断面がのぞく
function wcRib(p, x, y, s, r = 0, { c = '#a87556', seed = 1 } = {}){
    const R = rng(p.id + 'wcRb' + seed + x + y);
    const w = s, h = s * .62, j = () => (R() - .5) * s * .08;
    const pts = [[-w / 2 + j(), -h / 2 + j()], [0, -h / 2 - 1 + j()], [w / 2 + j(), -h / 2 + j()], [w / 2 + 1, 0], [w / 2 + j(), h / 2 + j()], [0, h / 2 + 1 + j()], [-w / 2 + j(), h / 2 + j()], [-w / 2 - 1, 0]];
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${wcSmooth(pts, true, .6)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M${f1(-w * .3)},${f1(-h * .05)} Q${f1(-w * .05)},${f1(-h * .2)} ${f1(w * .2)},${f1(-h * .05)} M${f1(-w * .25)},${f1(h * .22)} Q0,${f1(h * .1)} ${f1(w * .22)},${f1(h * .24)}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".55"/>
        <rect x="${f1(-w * .62)}" y="${f1(-h * .22)}" width="${f1(w * .2)}" height="${f1(h * .44)}" rx="${f1(h * .2)}" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae90" stroke-width=".7"/>
        <ellipse cx="${f1(-w * .58)}" cy="0" rx="${f1(w * .05)}" ry="${f1(h * .12)}" fill="#d4a88a"/>
        <path d="M${f1(-w * .32)},${f1(-h * .32)} Q${f1(-w * .05)},${f1(-h * .48)} ${f1(w * .26)},${f1(-h * .36)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 白菜のそぎ切り（g_side2.mjs の部品を写したもの）
function wcNapa(p, x, y, s, r = 0, { seed = 1 } = {}){
    const k = s / 30, R = rng(p.id + 'wcNp' + seed + x);
    const leaf = wcSmooth([[-13, -2], [-12, -9], [-6, -13], [0, -11], [6, -14], [12, -9], [13, -2], [6, -4], [-6, -4]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]));
    return `<g ${T(x, y, r, k)}><path d="${leaf}" fill="${p.g('#bcd97a', .3, .25)}" stroke="#7fa64a" stroke-width=".7"/>
        <path d="M-8,-8 Q-4,-6 -2,-4 M3,-10 Q4,-7 3,-4 M9,-8 Q7,-6 6,-4" stroke="#e6f1c2" stroke-width=".9" fill="none"/>
        <path d="M-12,-4 Q0,-7 12,-4 L11,9 Q0,12 -11,9Z" fill="${p.g('#f6f4e8', .2, .18)}" stroke="#cfcab0" stroke-width=".7"/>
        <path d="M-7,-3 L-6.5,9 M-1,-4 L-1,10 M5,-4 L5,9.6" stroke="#e2dec6" stroke-width="1.1"/>
        <path d="M-9,-2.5 Q0,-5.4 9,-2.6" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// きゅうりの細切りの山（d_main_chuka.mjs の部品を写したもの）
function wcCucumberShreds(p, x, y, s, { n = 26, seed = 1, sy = .75 } = {}){
    const R = rng(p.id + 'wcCs' + seed + x);
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s * .44, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, ang = (R() - .5) * 2.4, L = 10 + R() * 9;
        const dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2;
        d1 += `M${f1(cx - dx)},${f1(cy - dy)}L${f1(cx + dx)},${f1(cy + dy)}`;
        d2 += `M${f1(cx - dx)},${f1(cy - dy + .6)}L${f1(cx + dx)},${f1(cy + dy + .6)}`;
    }
    return `<g ${p.sh(.5)}><path d="${d1}" stroke="#2f6f24" stroke-width="2.8" stroke-linecap="round"/><path d="${d2}" stroke="#cfe8a2" stroke-width="1.5" stroke-linecap="round"/></g>`;
}
// 汁気のあるとろみソースの面（皿の上）
function wcSauce(p, x, y, s, c, { op = .9, seed = 1, sy = .82 } = {}){
    const R = rng(p.id + 'wcSc' + seed);
    return `<path ${T(x, y)} d="${wcSmooth(ring(s / 2, 11, .22, R, 1, sy))}" fill="${p.rg(c, .22, .25)}" opacity="${op}"/>`;
}
// 揚げ焼きしたじゃがいも（地三鮮）
function wcPotatoFried(p, x, y, s, r = 0, { seed = 1 } = {}){
    return K.potato(p, x, y, s, r, { c: '#e2a650', seed });
}
// 小口切りの青ねぎ
function wcScallions(p, x, y, s, { n = 14, seed = 1 } = {}){ return K.scallions(p, x, y, s, { n, seed, c: '#4f9a2e' }); }

// 散らす位置（重なりすぎないように）
function wcSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('wcspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360), R()]);
    }
    return out;
}

// =========================================================
export default {
    // 米饭: 青花の饭碗に白いご飯
    cn_staple: p => [
        wcBowl(p, { R: 92 }),
        wcRice(p, 100, 101, 146, { density: 1.35, grain: 4 }),
        `<path d="M50,82 Q58,58 84,48" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
    ].join(''),

    // 番茄炒蛋: 赤いトマトの汁に、大きなふわふわの卵とくし形トマト、青ねぎ
    cn_fanqie_chaodan: p => [
        wcPlate(p),
        wcSauce(p, 100, 102, 132, '#e0482a', { op: .85 }),
        `<g ${p.sh(1)}>`,
        wcTomato(p, 112, 66, 30, 150, { seed: 3 }), wcTomato(p, 150, 110, 26, -20, { seed: 5 }), wcTomato(p, 62, 124, 28, -60, { seed: 2 }),
        wcEggCurd(p, 76, 82, 50, 20, { seed: 1, juice: .25 }), wcEggCurd(p, 132, 90, 48, -30, { seed: 2, juice: .3 }),
        wcEggCurd(p, 96, 132, 50, 60, { seed: 3, juice: .3 }), wcEggCurd(p, 140, 136, 36, 10, { seed: 4, juice: .3 }),
        wcTomato(p, 104, 100, 34, 30, { seed: 1 }), wcTomato(p, 70, 108, 28, 100, { seed: 7 }), wcTomato(p, 126, 120, 30, 80, { seed: 4 }),
        wcTomato(p, 98, 70, 26, -40, { seed: 8 }), wcTomato(p, 78, 150, 24, 200, { seed: 6 }), wcTomato(p, 150, 80, 24, 60, { seed: 9 }),
        wcEggCurd(p, 112, 108, 28, -10, { seed: 5, juice: .3 }), wcEggCurd(p, 58, 98, 26, 40, { seed: 6 }),
        `</g>`,
        wcScallions(p, 100, 100, 100, { n: 14 }),
    ].join(''),

    // 红烧肉: 白い皿に、照りの強い赤茶の角切りの豚バラ、たれ、八角と青ねぎ
    cn_hongshaorou: p => {
        const cubes = [[74, 76, 8], [104, 70, -6], [134, 80, 10], [64, 106, -12], [96, 102, 4], [128, 110, -8], [80, 134, 12], [112, 136, -4], [146, 132, 6]];
        return [
            wcPlate(p),
            wcSauce(p, 102, 104, 132, '#7a2410', { op: .9 }),
            `<circle cx="100" cy="104" r="50" fill="#a83c18" opacity=".2"/>`,
            ...cubes.map(([x, y, r], i) => wcPorkCube(p, x, y, 30, r, { seed: i })),
            `<g ${p.sh(.6)}><path ${T(150, 100, 20, 1.1)} d="M0,-8 L2,-2 L8,-2.4 L3,1.6 L5,8 L0,4 L-5,8 L-3,1.6 L-8,-2.4 L-2,-2Z" fill="${p.g('#8a4a26', .2, .3)}" stroke="#4a2410" stroke-width=".6" stroke-linejoin="round"/></g>`,
            K.scallions(p, 98, 104, 90, { n: 12, c: '#4f9a2e' }),
            `<path d="M48,74 Q60,52 86,44" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".3"/>`,
        ].join('');
    },

    // 宫保鸡丁: たれのからんだ鶏の角切り、ピーナッツ、乾燥唐辛子、ねぎのぶつ切り
    cn_gongbao_jiding: p => {
        const ch = wcSpots('gb', 19, 52, 18, 100, 102);
        const pn = wcSpots('gbp', 12, 56, 10, 100, 102);
        return [
            wcPlate(p),
            wcSauce(p, 100, 102, 128, '#a2401c', { op: .55 }),
            `<g ${p.sh(1)}>`,
            ...ch.map(([x, y, r, q], i) => wcDice(p, x, y, 19 + q * 4, r, { c: '#b04e22', seed: i })),
            ...[[82, 90, 30], [120, 76, -40], [70, 124, 80], [130, 120, 10], [104, 140, -60], [148, 98, 50], [96, 110, 120]].map(([x, y, r]) => wcScallionSeg(p, x, y, 15, r)),
            ...[[94, 78, 20], [128, 100, -30], [76, 108, 70], [110, 124, 150], [60, 92, -10], [140, 136, 40], [86, 144, 100], [118, 60, 80], [146, 74, 10]].map(([x, y, r]) => wcChili(p, x, y, 21, r)),
            ...pn.map(([x, y, r]) => wcPeanut(p, x, y, 12, r)),
            `</g>`,
        ].join('');
    },

    // 鱼香肉丝: 赤みがかった照りのソースに、細切り豚肉・木耳・にんじん・ピーマン
    cn_yuxiang_rousi: p => [
        wcPlate(p),
        wcSauce(p, 100, 102, 128, '#c4501e', { op: .6 }),
        `<g ${p.sh(1)}>`,
        wcStrips(p, 100, 102, 116, { c: '#2c2220', n: 18, w: 4.6, len: .26, seed: 1, gloss: .3 }),
        wcStrips(p, 100, 102, 118, { c: '#ec7a2e', n: 20, w: 3.2, len: .3, seed: 2 }),
        wcStrips(p, 100, 102, 120, { c: '#b0562c', n: 30, w: 4.4, len: .3, seed: 3, gloss: .5 }),
        wcStrips(p, 100, 102, 112, { c: '#3f9030', n: 16, w: 3.6, len: .3, seed: 4 }),
        wcStrips(p, 100, 100, 92, { c: '#b65c30', n: 12, w: 4.4, len: .3, seed: 5, gloss: .5 }),
        wcStrips(p, 100, 100, 90, { c: '#2c2220', n: 6, w: 4.4, len: .26, seed: 6, gloss: .3 }),
        `</g>`,
        wcGrains(p, 100, 100, 100, { cols: ['#f1f3dc', '#cfe3a0'], n: 16, size: 1.4, seed: 7 }),
    ].join(''),

    // 清蒸鲈鱼: 楕円の魚皿に一尾、醤油だまり、上に白髪ねぎ・青ねぎ・しょうが・赤唐辛子の千切り
    cn_qingzheng_yu: p => [
        wcFishPlate(p),
        wcSauce(p, 100, 104, 150, '#7a4418', { op: .75, sy: .5 }),
        wcSteamedFish(p, 100, 100, 164, -4),
        `<g ${p.sh(.5)}>`,
        wcFineShreds(p, 96, 92, 90, { c: '#f2f4e2', n: 16, w: 1.5, seed: 1, dir: -.2 }),
        wcFineShreds(p, 100, 94, 90, { c: '#6fb046', n: 14, w: 1.6, seed: 2, dir: -.15 }),
        wcFineShreds(p, 92, 96, 70, { c: '#f1d98a', n: 9, w: 1.3, seed: 3, dir: -.25 }),
        wcFineShreds(p, 104, 92, 64, { c: '#d8301e', n: 6, w: 1.2, seed: 4, dir: -.2 }),
        `</g>`,
        wcOil(p, 100, 120, 110, { n: 8, c: '#d9a046', op: .5, rmax: 1.6 }),
    ].join(''),

    // 家常豆腐: 焼き色の三角豆腐、赤みのたれ、ピーマン・豚バラ・木耳
    cn_jiachang_doufu: p => {
        const tri = [[74, 78, 10], [112, 70, 190], [146, 96, -20], [66, 116, 170], [102, 106, 20], [136, 132, 200], [92, 144, -10], [62, 140, 40]];
        return [
            wcPlate(p),
            wcSauce(p, 100, 104, 134, '#a63c18', { op: .85 }),
            K.porkSlice(p, 128, 70, 36, 30, { c: '#b0602e', fat: '#f0cfa0', seed: 1, gloss: .6 }),
            K.porkSlice(p, 70, 132, 34, -20, { c: '#b0602e', fat: '#f0cfa0', seed: 2, gloss: .6 }),
            ...tri.map(([x, y, r], i) => wcTofuTri(p, x, y, 36, r, { seed: i })),
            `<g ${p.sh(.8)}>`,
            wcWoodEar(p, 124, 108, 18, 20, { seed: 1 }), wcWoodEar(p, 84, 96, 16, -40, { seed: 2 }), wcWoodEar(p, 112, 146, 15, 60, { seed: 3 }),
            K.pepperPiece(p, 92, 72, 20, 30), K.pepperPiece(p, 140, 116, 20, -50), K.pepperPiece(p, 78, 120, 18, 80), K.pepperPiece(p, 118, 88, 18, 10), K.pepperPiece(p, 56, 98, 17, -20),
            `</g>`,
            `<path d="M58,70 Q72,56 92,52" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/>`,
        ].join('');
    },

    // 炸酱面: 大きな碗に、白っぽい手打ち麺、濃い茶色の肉味噌、きゅうりの細切り、もやし
    cn_zhajiangmian: p => {
        const blob = wcSmooth(ring(36, 14, .28, rng('zjm2'), 1.12, .9));
        return [
            wcBowl(p, { R: 94 }),
            wcWavy(p, 100, 100, 154, { c: '#efd9a0', w: 5.4, n: 36, seed: 1, len: .6, outline: '#c4a468' }),
            wcCucumberShreds(p, 146, 102, 48, { n: 26, seed: 1 }),
            K.sprouts(p, 100, 150, 46, { n: 16, seed: 2 }),
            `<path d="${blob}" fill="#7a3a16" opacity=".5" transform="translate(94 100) scale(1.14)"/>`,
            `<g ${p.sh(1.1)}><path ${T(94, 100)} d="${blob}" fill="${p.rg('#5c2a10', .22, .32, .4, .36)}" stroke="#3a1606" stroke-width=".8"/></g>`,
            wcGrains(p, 94, 100, 60, { cols: ['#6e3414', '#7e4020'], n: 34, size: 2.8, seed: 2, sy: .85 }),
            `<path d="M70,90 Q80,74 100,72 M78,102 Q84,94 94,92" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/>`,
            wcOil(p, 94, 100, 56, { n: 6, c: '#b8601e', op: .5, rmax: 1.6 }),
            K.scallions(p, 98, 102, 30, { n: 7, c: '#4f9a2e' }),
        ].join('');
    },

    // 蒜蓉炒青菜: 縦割りの上海青をつややかに、にんにくのみじん切り
    cn_suanrong_qingcai: p => [
        wcPlate(p),
        wcSauce(p, 100, 102, 120, '#cfd9a0', { op: .4 }),
        `<g ${p.sh(1)}>`,
        wcBok(p, 78, 72, 72, 30, { seed: 1 }), wcBok(p, 138, 82, 70, 115, { seed: 2 }), wcBok(p, 62, 118, 70, -30, { seed: 3 }),
        wcBok(p, 126, 134, 70, 200, { seed: 4 }), wcBok(p, 94, 140, 62, -80, { seed: 6 }), wcBok(p, 100, 100, 76, -12, { seed: 5 }),
        `</g>`,
        wcGrains(p, 100, 100, 96, { cols: ['#f6e7b0', '#e9cf86'], n: 38, size: 1.6, seed: 3 }),
        wcGrains(p, 100, 100, 60, { cols: ['#fff6cf'], n: 12, size: 1.4, seed: 4 }),
    ].join(''),

    // 酸辣土豆丝: 細い千切りのじゃがいもの山、ピーマンの細切り、乾燥唐辛子
    cn_suanla_tudousi: p => [
        wcPlate(p),
        `<g ${p.sh(1)}>`,
        `<path ${T(100, 102)} d="${wcSmooth(ring(58, 12, .16, rng('tds'), 1, .86))}" fill="#f0dc98"/>`,
        wcStrips(p, 100, 102, 116, { c: '#f2dc8e', n: 70, w: 2.6, len: .32, seed: 1, gloss: .5 }),
        wcStrips(p, 100, 100, 100, { c: '#3f9030', n: 12, w: 2.4, len: .3, seed: 2 }),
        wcStrips(p, 100, 100, 96, { c: '#f6e4a2', n: 34, w: 2.6, len: .32, seed: 3, gloss: .5 }),
        `</g>`,
        ...[[84, 84, 30], [120, 92, -50], [100, 122, 80], [70, 112, 140], [132, 122, 10]].map(([x, y, r]) => wcChili(p, x, y, 17, r)),
        wcGrains(p, 100, 100, 70, { cols: ['#4a2a1a'], n: 8, size: 1, seed: 3 }),
    ].join(''),

    // 地三鲜: 照りのある茶色いあんに、揚げたじゃがいも・なす・ピーマン
    cn_disanxian: p => [
        wcPlate(p),
        wcSauce(p, 100, 102, 130, '#9a5a24', { op: .7 }),
        `<g ${p.sh(1)}>`,
        ...[[74, 80, 20], [126, 76, -30], [66, 126, 60], [112, 112, 10], [140, 128, -50], [96, 144, 30]].map(([x, y, r], i) => wcPotatoFried(p, x, y, 28, r, { seed: i })),
        ...[[100, 70, 40], [140, 100, -20], [86, 108, 70], [62, 102, 160], [118, 140, 120], [100, 96, -60], [80, 146, 200]].map(([x, y, r], i) => wcNasu(p, x, y, 30, r, { seed: i, flesh: '#b98444' })),
        K.pepperPiece(p, 110, 88, 22, 30), K.pepperPiece(p, 76, 100, 20, -40), K.pepperPiece(p, 130, 112, 20, 70), K.pepperPiece(p, 92, 128, 20, 10), K.pepperPiece(p, 122, 58, 18, -60), K.pepperPiece(p, 54, 120, 18, 40),
        `</g>`,
        `<path d="M58,72 Q72,56 94,52" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/>`,
    ].join(''),

    // 凉拌木耳: 青花の鉢に、黒い木耳、赤唐辛子の輪切り、香菜、にんにく
    cn_liangban_muer: p => {
        const sp = wcSpots('mue', 14, 52, 19);
        return [
            wcBowl(p, { R: 92 }),
            wcSauce(p, 100, 102, 118, '#6a3a1a', { op: .5 }),
            `<g ${p.sh(.9)}>`,
            ...sp.map(([x, y, r, q], i) => wcWoodEar(p, x, y, 28 + q * 10, r, { seed: i })),
            `</g>`,
            ...[[86, 84], [118, 104], [100, 128], [70, 112], [128, 76], [140, 124]].map(([x, y]) => `<g ${T(x, y)}><circle r="3.6" fill="none" stroke="#d42a1c" stroke-width="2"/><circle r="1" fill="#f6d68a"/></g>`).join(''),
            ...[[108, 84, 20], [80, 124, -40], [132, 110, 70], [96, 106, 160]].map(([x, y, r]) => wcCilantro(p, x, y, 14, r)),
            wcGrains(p, 100, 102, 90, { cols: ['#f6e7b0'], n: 18, size: 1.4, seed: 2 }),
        ].join('');
    },

    // 芹菜炒香干: 緑の芹菜の斜め切りと、茶色い香干の細切り、にんじん
    cn_qincai_xianggan: p => {
        const sp = wcSpots('qc', 26, 56, 12, 100, 102);
        return [
            wcPlate(p),
            wcSauce(p, 100, 102, 126, '#c8a060', { op: .35 }),
            `<g ${p.sh(.9)}>`,
            ...sp.map(([x, y, r, q], i) => i % 2 ? wcXianggan(p, x, y, 26 + q * 6, r) : wcCelery(p, x, y, 24 + q * 6, r, { c: q < .5 ? '#78b446' : '#8cc458' })),
            wcStrips(p, 100, 102, 100, { c: '#ec7a2e', n: 8, w: 2.6, len: .26, seed: 3 }),
            ...wcSpots('qc2', 8, 40, 14, 100, 100).map(([x, y, r]) => wcCelery(p, x, y, 26, r)),
            `</g>`,
        ].join('');
    },

    // 皮蛋豆腐: 白い豆腐を切って、皮蛋のくし切りを周りに、醤油だれと青ねぎ
    cn_pidan_doufu: p => [
        wcPlate(p),
        wcSauce(p, 100, 102, 128, '#6a3414', { op: .7 }),
        `<g ${p.sh(1)}>`,
        ...[0, 1, 2].map(i => `<g ${T(100, 78 + i * 23)}><rect x="-36" y="-11.5" width="72" height="23" rx="2.6" fill="${p.g('#fcf9f0', .3, .12)}" stroke="#d9d1bc" stroke-width=".7"/><path d="M-32,-8.5 L30,-8.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></g>`),
        `</g>`,
        `<path d="M66,92 Q100,104 134,88 L134,108 Q100,118 66,110Z" fill="#7a3c14" opacity=".4"/>`,
        ...[[46, 80, -80], [46, 120, -100], [154, 80, 80], [154, 120, 100], [100, 48, 0], [100, 154, 180], [86, 98, -20], [114, 104, 160]].map(([x, y, r]) => wcPidan(p, x, y, 34, r)),
        K.scallions(p, 100, 100, 70, { n: 22, c: '#4f9a2e' }),
        wcOil(p, 100, 104, 56, { n: 6, c: '#d4401c', op: .55, rmax: 1.8 }),
    ].join(''),

    // 紫菜蛋花汤: 青花の汤碗に、淡い澄んだスープ、黒紫の紫菜、ふんわり卵、青ねぎ、小えび
    cn_zicai_danhua: p => [
        wcBowl(p, { R: 92 }),
        K.liquid(p, { R: 78, c: '#e6cf8e', op: .6, shine: false }),
        wcLaver(p, 74, 84, 34, 20, { seed: 1 }), wcLaver(p, 128, 76, 30, -30, { seed: 2 }), wcLaver(p, 122, 128, 34, 60, { seed: 3 }),
        wcLaver(p, 76, 128, 28, -50, { seed: 4 }), wcLaver(p, 100, 100, 26, 10, { seed: 5 }), wcLaver(p, 146, 104, 20, 80, { seed: 6 }), wcLaver(p, 100, 56, 20, 0, { seed: 7 }),
        wcEggCloud(p, 96, 92, 60, -15, { seed: 1 }), wcEggCloud(p, 86, 124, 50, 25, { seed: 2 }), wcEggCloud(p, 128, 108, 46, 70, { seed: 3 }), wcEggCloud(p, 118, 66, 42, 10, { seed: 4 }), wcEggCloud(p, 62, 100, 36, 80, { seed: 5 }), wcEggCloud(p, 140, 138, 34, -30, { seed: 6 }), wcEggCloud(p, 70, 64, 32, 40, { seed: 7 }),
        wcGrains(p, 100, 100, 110, { cols: ['#f2a888', '#e88a6a'], n: 14, size: 1.3, seed: 4 }),
        K.scallions(p, 100, 100, 110, { n: 16, c: '#4f9a2e' }),
        wcOil(p, 100, 100, 130, { n: 12, c: '#f2c24c', op: .55, rmax: 1.6 }),
        wcShine(100, 100, 78, .4),
    ].join(''),

    // 冬瓜排骨汤: 澄んだスープに、透き通った冬瓜とスペアリブ、青ねぎ
    cn_donggua_paigu: p => [
        wcBowl(p, { R: 92 }),
        K.liquid(p, { R: 78, c: '#ecd69c', op: .6, shine: false }),
        `<g ${p.sh(.6)}>`,
        wcRib(p, 78, 80, 34, 20, { seed: 1 }), wcRib(p, 128, 122, 34, -40, { seed: 2 }), wcRib(p, 74, 130, 32, 100, { seed: 3 }), wcRib(p, 130, 74, 30, 160, { seed: 4 }),
        wcWinterMelon(p, 104, 100, 32, 15, { seed: 1 }), wcWinterMelon(p, 98, 140, 28, -20, { seed: 2 }), wcWinterMelon(p, 148, 98, 24, 80, { seed: 3 }),
        wcWinterMelon(p, 56, 104, 24, -70, { seed: 4 }), wcWinterMelon(p, 104, 58, 26, 190, { seed: 5 }),
        `</g>`,
        `<circle cx="100" cy="100" r="78" fill="#efe0b0" opacity=".12"/>`,
        K.scallions(p, 100, 100, 110, { n: 14, c: '#4f9a2e' }),
        wcOil(p, 100, 100, 130, { n: 10, c: '#f2cf6c', op: .5, rmax: 2 }),
        wcShine(100, 100, 78, .4),
    ].join(''),

    // 白菜豆腐汤: 白菜のそぎ切り、さいの目の豆腐、春雨、青ねぎ
    cn_baicai_doufu_tang: p => [
        wcBowl(p, { R: 92 }),
        K.liquid(p, { R: 78, c: '#efe0b4', op: .6, shine: false }),
        K.threads(p, 100, 100, 120, { c: '#f4f1e6', n: 14, w: 1.5 }),
        `<g ${p.sh(.6)}>`,
        wcNapa(p, 74, 80, 36, 20, { seed: 1 }), wcNapa(p, 130, 84, 34, -40, { seed: 2 }), wcNapa(p, 120, 132, 34, 160, { seed: 3 }), wcNapa(p, 70, 124, 32, 110, { seed: 4 }),
        `</g>`,
        ...[[100, 96, 8], [96, 128, -6], [140, 108, 14], [104, 66, -10], [60, 102, 4], [122, 104, 20], [84, 104, -14]].map(([x, y, r]) => K.tofu(p, x, y, 17, 16, r, { c: '#f8f4e8' })),
        K.scallions(p, 100, 100, 110, { n: 14, c: '#4f9a2e' }),
        wcOil(p, 100, 100, 130, { n: 8, c: '#f2cf6c', op: .45, rmax: 1.6 }),
        wcShine(100, 100, 78, .4),
    ].join(''),
};
