// 台湾（家常菜）: 白地に藍の線と小さな花の器に盛った、毎日のおかず・湯・白飯
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// このファイル専用の部品（tw で始まる）。w_cn / w_kr / w_vn から写して手直ししたもの
// =========================================================
function twSm(pts, closed = false, k = 1){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6 * k)},${f1(p1[1] + (p2[1] - p0[1]) / 6 * k)} ${f1(p2[0] - (p3[0] - p1[0]) / 6 * k)},${f1(p2[1] - (p3[1] - p1[1]) / 6 * k)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const twSmooth = (pts, k = 1) => twSm(pts, true, k);
function twOutline(p, c, r = .55){
    const id = p.def('twOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// 散らす位置（重なりすぎないように）
function twSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('twspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360), R()]);
    }
    return out;
}
const twShine = (cx, cy, R, op = .35) => `<path d="M${f1(cx - R * .55)},${f1(cy + R * .1)} A${f1(R * .6)},${f1(R * .6)} 0 0 1 ${f1(cx - R * .05)},${f1(cy - R * .52)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// ---------- 器（白磁に藍の線、縁に小さな桃色の花: 台湾の食卓でよく見る柄） ----------
const TW_BLUE = '#2f5f9e';
function twFlower(p, x, y, s, a = 0){
    return `<g ${T(x, y, a, s / 10)}>${[0, 72, 144, 216, 288].map(r => `<ellipse transform="rotate(${r})" cx="0" cy="-3" rx="1.8" ry="2.5" fill="#e4697c" opacity=".8"/>`).join('')}<circle r="1.3" fill="#f3cf5a"/><path d="M-3.6,3.6 q-4.4,1.6 -6.6,-1.6 q4.4,-2.2 6.6,1.6Z M3.6,3.6 q4.4,1.6 6.6,-1.6 q-4.4,-2.2 -6.6,1.6Z" fill="#5b9e4e" opacity=".8"/></g>`;
}
function twFlowers(p, rm, n, s = 10, start = 0){
    let out = '';
    for (let i = 0; i < n; i++){ const a = start + i / n * Math.PI * 2; out += twFlower(p, 100 + Math.cos(a) * rm, 100 + Math.sin(a) * rm, s, a * 57.3 + 90); }
    return out;
}
// 平皿（盤子）
function twPlate(p, { R = 94, well = .72, flowers = 4 } = {}){
    const w = R * well, base = '#fbfbf7';
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .1, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${TW_BLUE}" stroke-width="1.8"/>
        <circle cx="100" cy="100" r="${R - 6}" fill="none" stroke="${TW_BLUE}" stroke-width=".6" opacity=".7"/>
        ${flowers ? twFlowers(p, (R - 6 + w + 3) / 2, flowers, 11, .8) : ''}
        <circle cx="100" cy="100" r="${f1(w + 1.5)}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".45"/>
        <circle cx="100" cy="100" r="${f1(w)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .2)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 碗（飯碗・湯碗）: 縁に藍の二重線、縁の内側に花
function twBowl(p, { R = 92, inside = '#fbfaf5', lip = .87, flowers = 3 } = {}){
    const r = R * lip;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#f9f8f3', .25, .2, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.4}" fill="none" stroke="${TW_BLUE}" stroke-width="2.2"/>
        <circle cx="100" cy="100" r="${R - 5}" fill="none" stroke="${TW_BLUE}" stroke-width=".6" opacity=".7"/>
        ${flowers ? twFlowers(p, (R - 5 + r) / 2, flowers, Math.max(7, (R - 5 - r) * .85), 1.2) : ''}
        <circle cx="100" cy="100" r="${f1(r + 1.2)}" fill="none" stroke="${TW_BLUE}" stroke-width=".8" opacity=".8"/>
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .22, .64, .66)}"/>
        <path d="M${f1(100 - R * .7)},${f1(100 - R * .42)} A${f1(R * .82)},${f1(R * .82)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .78)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 魚盤（楕円の白い皿）
function twOval(p, { rx = 97, ry = 70 } = {}){
    const base = '#fbfbf7';
    return `<g ${p.sh(1.6)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <ellipse cx="100" cy="100" rx="${rx - 3}" ry="${ry - 3}" fill="none" stroke="${TW_BLUE}" stroke-width="1.8"/>
        <ellipse cx="100" cy="100" rx="${rx - 6}" ry="${ry - 6}" fill="none" stroke="${TW_BLUE}" stroke-width=".6" opacity=".7"/>
        ${twFlower(p, 100 - rx + 13, 100, 11, -90)}${twFlower(p, 100 + rx - 13, 100, 11, 90)}
        <ellipse cx="100" cy="100" rx="${rx - 20}" ry="${ry - 16}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".45"/>
        <ellipse cx="100" cy="100" rx="${rx - 21}" ry="${ry - 17}" fill="${p.rg(base, .06, .08, .6, .62)}"/>
        <path d="M${100 - rx * .8},${100 - ry * .35} Q${100 - rx * .7},${100 - ry * .82} ${100 - rx * .3},${100 - ry * .88}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 砂鍋（三杯雞の土鍋）: 砂色の外側に斑点、厚い縁、黒茶の釉薬の内側、左右に小さな耳
function twSandPot(p, { R = 90 } = {}){
    const Rr = rng(p.id + 'sand');
    let sp = '';
    for (let i = 0; i < 30; i++){ const a = Rr() * 6.28, d = R * (.9 + Rr() * .08); sp += `<circle cx="${f1(100 + Math.cos(a) * d)}" cy="${f1(100 + Math.sin(a) * d)}" r="${f1(.5 + Rr() * .8)}" fill="#6a4a30" opacity=".5"/>`; }
    return `<g ${p.sh(2)}><rect x="3" y="90" width="194" height="20" rx="8" fill="${p.g('#8f6a48', .25, .3)}"/><circle cx="100" cy="100" r="${R}" fill="${p.rg('#b8926a', .2, .32, .35, .3)}"/></g>${sp}
        <circle cx="100" cy="100" r="${f1(R * .88)}" fill="none" stroke="${p.g('#9a7250', .3, .35)}" stroke-width="5"/>
        <circle cx="100" cy="100" r="${f1(R * .85)}" fill="${p.rg('#2e1a10', .14, .2, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .44)} A${f1(R * .84)},${f1(R * .84)} 0 0 1 ${f1(100 - R * .3)},${f1(100 - R * .78)}" stroke="#f1d6b8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;
}

// ---------- ご飯・麺 ----------
function twRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'twRice' + seed + x + y);
    const shape = twSmooth(ring(s / 2, 14, .07, R, 1, sy));
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
    const shade = p.def('twRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// うねった細い麺（米粉）
function twWavy(p, x, y, s, { c = '#f3ead2', w = 5, n = 14, seed = 1, sy = .9, len = .55, wav = .5, outline = null, layers = 4 } = {}){
    const R = rng(p.id + 'twWv' + seed + x);
    const ol = twOutline(p, outline || dk(c, .25), .6), rad = s / 2;
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
        const dd = twSm(pts);
        const l = L[i % layers];
        if (R() < .3) l[1] += dd; else l[0] += dd;
        if (R() < .5) l[2] += twSm(pts.slice(1, 4).map(([a, b]) => [a - w * .18, b - w * .2]));
    }
    return `<g ${p.sh(.8)}>${L.map(([a, b, h]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .14)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>${h ? `<path d="${h}" stroke="#fff" stroke-width="${f1(w * .24)}" fill="none" stroke-linecap="round" opacity=".5"/>` : ''}`).join('')}</g>`;
}
// 小さな粒（みじん切り・ひき肉・油蔥酥など）。色ごとに1本のpath
function twGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'twGr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const rr = size * (.6 + R() * .8), k = Math.floor(R() * cols.length);
        const pts = Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28 + R() * .6, r2 = rr * (.75 + R() * .35); return `${f1(gx + Math.cos(aa) * r2)},${f1(gy + Math.sin(aa) * r2)}`; });
        ds[k] += `M${pts.join('L')}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`).join('');
}
// 細切りの束（肉・にんじん・キャベツ・しいたけ）
function twStrips(p, x, y, s, { c = '#8a5230', n = 14, w = 3.4, len = .28, seed = 1, sy = .85, curve = .25, dir = null, gloss = .4 } = {}){
    const R = rng(p.id + 'twSt' + seed + x + y);
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
    return `<g ${twOutline(p, dk(c, .35), .5)} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>${gloss ? `<path d="${hl}" stroke="#fff" stroke-width="${f1(w * .28)}" fill="none" stroke-linecap="round" opacity="${gloss}"/>` : ''}`;
}
// 細い千切り（しょうが・ねぎ）
function twFineShreds(p, x, y, s, { c = '#f2f4e2', n = 16, w = 1.4, seed = 1, dir = -.4, len = .7 } = {}){
    const R = rng(p.id + 'twFs' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){
        const a = dir + (R() - .5) * .9, L = s * len * (.6 + R() * .5), cx = x + (R() - .5) * s * .7, cy = y + (R() - .5) * s * .4;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, b = (R() - .5) * 4;
        d += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx + b)} ${f1(cy - b)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(w + .8)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
// 汁に浮いた油の粒
function twOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .6, rmax = 2 } = {}){
    const R = rng(p.id + 'twOi' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 皿の上のたれ・汁気の面
function twSauce(p, x, y, s, c, { op = .9, seed = 1, sy = .82 } = {}){
    const R = rng(p.id + 'twSc' + seed);
    return `<path ${T(x, y)} d="${twSmooth(ring(s / 2, 11, .22, R, 1, sy))}" fill="${p.rg(c, .22, .25)}" opacity="${op}"/>`;
}
// 青ねぎの小口切り
const twScallions = (p, x, y, s, o = {}) => K.scallions(p, x, y, s, { c: '#4f9a2e', ...o });
// ぶつ切りのねぎ（4cm、白と緑）
function twScallionSeg(p, x, y, s, r = 0, { green = false } = {}){
    const c = green ? '#6fb044' : '#f1f3df', h = s * .24;
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><rect x="${f1(-s / 2)}" y="${f1(-h / 2)}" width="${f1(s)}" height="${f1(h)}" rx="${f1(h * .35)}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .4)},${f1(-h * .05)} L${f1(s * .4)},${f1(-h * .05)}" stroke="${green ? lt(c, .4) : dk(c, .1)}" stroke-width=".7" opacity=".8"/>
        <path d="M${f1(-s * .38)},${f1(-h * .3)} L${f1(s * .22)},${f1(-h * .3)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".75"/></g>`;
}
// 赤唐辛子の斜め切り（輪と種）
function twChiliRing(p, x, y, s, r = 0, { c = '#d42a1c' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .34)}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".5"/><ellipse rx="${f1(s * .32)}" ry="${f1(s * .19)}" fill="${lt(c, .5)}"/><circle cx="${f1(-s * .08)}" cy="0" r="${f1(s * .07)}" fill="#f6eec8"/><circle cx="${f1(s * .1)}" cy="${f1(s * .04)}" r="${f1(s * .07)}" fill="#f6eec8"/></g>`;
}
// 九層塔の葉（先のとがった濃い緑、葉脈）
function twBasil(p, x, y, s, r = 0, { c = '#2f6e2a' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,0 Q-7,-5.5 -1,-6.4 Q6,-6.4 10,0 Q6,6.4 -1,6.4 Q-7,5.5 -10,0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M-9,0 L9,0 M-4,-.3 Q-2,-3 0,-4.6 M1,-.3 Q3,-3 5,-4 M-4,.3 Q-2,3 0,4.6 M1,.3 Q3,3 5,4" stroke="${lt(c, .4)}" stroke-width=".7" fill="none" stroke-linecap="round"/>
        <path d="M-11.5,0 L-9,0" stroke="#7a4a6a" stroke-width="1" stroke-linecap="round"/>
        <path d="M-6,-2.4 Q-2,-4.6 3,-4" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// にんにく（丸ごと1片、揚げ色）
function twGarlic(p, x, y, s, r = 0, { c = '#e6c078' } = {}){
    return `<g ${T(x, y, r, s / 12)}><g ${p.sh(.5)}><path d="M-5,3 Q-6.4,-2 -2.4,-5 Q0,-7.2 2.4,-5 Q6.4,-2 5,3 Q0,6.2 -5,3Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="M-3,1 Q-2.4,-2 -.4,-3.8" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".75"/><path d="M0,-7 L0,-5.2" stroke="${dk(c, .5)}" stroke-width=".8"/></g>`;
}
// しょうがの薄切り（淡い黄色、縁に茶の皮）
function twGinger(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="M${f1(-s / 2)},0 Q${f1(-s * .4)},${f1(-s * .3)} ${f1(-s * .1)},${f1(-s * .32)} Q${f1(s * .35)},${f1(-s * .34)} ${f1(s / 2)},${f1(-s * .05)} Q${f1(s * .4)},${f1(s * .3)} ${f1(s * .05)},${f1(s * .32)} Q${f1(-s * .35)},${f1(s * .3)} ${f1(-s / 2)},0Z" fill="${p.g('#f0dc9a', .3, .2)}" stroke="#b88a3c" stroke-width="1"/></g>
        <path d="M${f1(-s * .3)},${f1(-s * .05)} Q0,${f1(-s * .14)} ${f1(s * .3)},${f1(-s * .02)}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 骨つき鶏のぶつ切り（濃いたれをまとった身、のぞく骨）
function twChickenBone(p, x, y, s, r = 0, { c = '#9a4a1c', seed = 1, bone = true } = {}){
    const R = rng(p.id + 'twcb' + seed + x + y);
    const k = s / 24;
    const pts = ring(10, 10, .3, R, 1.2, .85);
    let pt = '';
    for (let i = 0; i < 3; i++) pt += `<path ${T(-3 + (R() - .5) * 10, (R() - .5) * 7)} d="${smooth(ring(2.4 + R() * 1.8, 6, .5, R, 1.5, .7))}" fill="${lt(c, .3)}" opacity=".6"/>`;
    pt += `<path d="M-8,-1 q4,-1.6 8,0 M-6,2.6 q4,-1 8,.4" stroke="${lt(c, .25)}" stroke-width=".8" fill="none" opacity=".6"/>`;
    return `<g ${T(x, y, r, k)}>${bone ? `<g ${p.sh(.4)}><rect x="8" y="-2.2" width="7" height="4.4" rx="2" fill="#efe2c8" stroke="#bfa880" stroke-width=".5"/><circle cx="15" cy="-1.6" r="2.4" fill="#f4ead4" stroke="#bfa880" stroke-width=".5"/><circle cx="15" cy="1.6" r="2.4" fill="#f4ead4" stroke="#bfa880" stroke-width=".5"/></g>` : ''}
        <path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .45)}" stroke-width=".7"/>${pt}
        <path d="M-7,4 Q-1,6.5 6,4.4" stroke="${dk(c, .4)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M-7,-3.5 Q-3,-6.6 2.5,-6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 滷肉（皮つき豚ばらの細切り煮: 皮・脂・赤身の帯、濃い飴色の照り）
function twLuRou(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'twlr' + seed + x + y);
    const body = twSmooth(ring(L / 2, 7, .35, R, 1, w / L), .8);
    return `<g ${T(x, y, r)}><path d="${body}" fill="${p.g(R() < .5 ? '#7a3412' : '#8e4418', .3, .35)}" stroke="#3e1a06" stroke-width=".6"/>
        <path d="M${f1(-L * .38)},${f1(-w * .08)} Q0,${f1(-w * .2)} ${f1(L * .36)},${f1(-w * .04)}" stroke="#e2b07a" stroke-width="${f1(w * .26)}" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M${f1(-L * .3)},${f1(-w * .3)} L${f1(L * .2)},${f1(-w * .32)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".75"/></g>`;
}
// 滷蛋（たれ色に染まった煮卵の半分）
function twLuEgg(p, x, y, s, r = 0){
    const rx = s / 2, ry = s * .4;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${rx}" ry="${f1(ry)}" fill="${p.g('#b06a28', .2, .3)}" stroke="#6e3a0c" stroke-width=".7"/></g>
        <ellipse rx="${f1(rx - 2.4)}" ry="${f1(ry - 2.2)}" fill="${p.rg('#f3dcb0', .2, .12)}"/>
        <circle cx="${f1(rx * .05)}" cy="${f1(ry * .05)}" r="${f1(ry * .52)}" fill="${p.rg('#f2a62a', .3, .22, .38, .35)}" stroke="#c97b14" stroke-width=".5"/>
        <ellipse cx="${f1(-rx * .12)}" cy="${f1(-ry * .14)}" rx="${f1(ry * .18)}" ry="${f1(ry * .1)}" fill="#fff" opacity=".7"/></g>`;
}
// 滷蛋（丸ごと）
function twLuEggWhole(p, x, y, s, r = 0){
    const rx = s / 2, ry = s * .4;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${rx}" ry="${f1(ry)}" fill="${p.g('#c07a32', .3, .3)}" stroke="#7a420f" stroke-width=".7"/></g>
        <ellipse cx="${f1(-rx * .25)}" cy="${f1(-ry * .3)}" rx="${f1(rx * .42)}" ry="${f1(ry * .26)}" fill="#f2c88a" opacity=".5"/>
        <ellipse cx="${f1(-rx * .32)}" cy="${f1(-ry * .4)}" rx="${f1(rx * .2)}" ry="${f1(ry * .1)}" fill="#fff" opacity=".85"/></g>`;
}
// 黄色いたくあん（半月）
function twPickledRadish(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,2 A10,9 0 0 1 10,2 Z" fill="${p.g('#f2c93a', .3, .25)}" stroke="#c79a18" stroke-width=".6"/></g><path d="M-7.6,2 A7.6,6.8 0 0 1 7.6,2" stroke="#fbe27a" stroke-width="1" fill="none" opacity=".8"/></g>`;
}
// 豆干の薄切り（茶色い皮、淡い断面）
function twDougan(p, x, y, w, h, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="2.4" fill="#5a3010"/></g>
        <rect x="${f1(-w / 2 + 2.2)}" y="${f1(-h / 2 + 2.2)}" width="${f1(w - 4.4)}" height="${f1(h - 4.4)}" rx="1.6" fill="${p.rg('#d9b07a', .2, .25)}"/>
        <rect x="${f1(-w / 2 + 2.2)}" y="${f1(-h / 2 + 2.2)}" width="${f1(w - 4.4)}" height="${f1(h - 4.4)}" rx="1.6" fill="none" stroke="#a8682e" stroke-width="1.4" opacity=".6"/>
        <path d="M${f1(-w * .3)},${f1(-h * .28)} L${f1(w * .2)},${f1(-h * .28)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 海帯結（昆布の結び目）
function twKelpKnot(p, x, y, s, r = 0){
    const k = s / 20, c = '#2d5a2a';
    const rib = (d) => `<path d="${d}" stroke="${dk(c, .4)}" stroke-width="6.4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${p.g(c, .3, .25)}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${lt(c, .3)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".55" transform="translate(-.6 -1)"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${rib('M-13,4 Q-6,-4 0,-2')}${rib('M13,-5 Q5,4 0,1')}${rib('M-5,-6 Q6,-7 6,0 Q6,7 -5,5 Q-9,0 -5,-6')}</g></g>`;
}
// とうもろこしの輪切り（横から: 粒の並び、端に芯の断面）
function twCorn(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'twcn' + seed + x + y);
    let kr = '';
    const rows = 4, cols = Math.max(3, Math.round(w / 6));
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++){
        const kx = -w / 2 + 4 + j * (w - 8) / (cols - 1) + (i % 2) * 1.2, ky = -h / 2 + 3 + i * (h - 6) / (rows - 1);
        if (Math.abs(kx) > w / 2 - 3) continue;
        kr += `<rect x="${f1(kx - 2.4)}" y="${f1(ky - 1.9)}" width="4.8" height="3.8" rx="1.4" fill="${R() < .5 ? '#f6cf3a' : '#f0c128'}" stroke="#c99a12" stroke-width=".35"/>`;
    }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h * .28)}" fill="${p.g('#e9b828', .3, .3)}" stroke="#b58a12" stroke-width=".7"/></g>${kr}
        <ellipse cx="${f1(w / 2 - 1)}" cy="0" rx="3.2" ry="${f1(h / 2 - 1)}" fill="${p.g('#f6e6a8', .2, .2)}" stroke="#c9a94a" stroke-width=".6"/><ellipse cx="${f1(w / 2 - 1)}" cy="0" rx="1.4" ry="${f1(h * .2)}" fill="#e3cf88"/>
        <path d="M${f1(-w * .36)},${f1(-h * .34)} L${f1(w * .2)},${f1(-h * .34)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>`;
}
// 煮込んだ排骨（角の丸い肉のかたまり、端に白い骨の断面）
function twRib(p, x, y, s, r = 0, { c = '#a87556', seed = 1 } = {}){
    const R = rng(p.id + 'twRb' + seed + x + y);
    const w = s, h = s * .62, j = () => (R() - .5) * s * .08;
    const pts = [[-w / 2 + j(), -h / 2 + j()], [0, -h / 2 - 1 + j()], [w / 2 + j(), -h / 2 + j()], [w / 2 + 1, 0], [w / 2 + j(), h / 2 + j()], [0, h / 2 + 1 + j()], [-w / 2 + j(), h / 2 + j()], [-w / 2 - 1, 0]];
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${twSmooth(pts, .6)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M${f1(-w * .3)},${f1(-h * .05)} Q${f1(-w * .05)},${f1(-h * .2)} ${f1(w * .2)},${f1(-h * .05)} M${f1(-w * .25)},${f1(h * .22)} Q0,${f1(h * .1)} ${f1(w * .22)},${f1(h * .24)}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".55"/>
        <rect x="${f1(-w * .62)}" y="${f1(-h * .22)}" width="${f1(w * .2)}" height="${f1(h * .44)}" rx="${f1(h * .2)}" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae90" stroke-width=".7"/>
        <ellipse cx="${f1(-w * .58)}" cy="0" rx="${f1(w * .05)}" ry="${f1(h * .12)}" fill="#d4a88a"/>
        <path d="M${f1(-w * .32)},${f1(-h * .32)} Q${f1(-w * .05)},${f1(-h * .48)} ${f1(w * .26)},${f1(-h * .36)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 魚丸（白い丸）
function twFishBall(p, x, y, s){
    return `<g ${p.sh(.8)}><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s / 2)}" fill="${p.rg('#f3efe3', .14, .22, .36, .34)}" stroke="#c9bda6" stroke-width=".7"/></g>
        <ellipse cx="${f1(x - s * .18)}" cy="${f1(y - s * .2)}" rx="${f1(s * .17)}" ry="${f1(s * .1)}" fill="#fff" opacity=".8"/>`;
}
// 炒めた高麗菜（手でちぎった大きめの葉、太い白い葉脈、つや）
function twCabbage(p, x, y, s, r = 0, { seed = 1, c = '#c3dc8e' } = {}){
    const R = rng(p.id + 'twcb' + seed + x + y);
    const k = s / 40;
    const pts = ring(19, 13, .22, R, 1.15, .82);
    const gid = p.def('twcbg' + c, id => `<radialGradient id="${id}" cx=".22" cy=".7" r=".95"><stop offset="0" stop-color="#f4f6e2"/><stop offset=".45" stop-color="${lt(c, .3)}"/><stop offset="1" stop-color="${dk(c, .08)}"/></radialGradient>`);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .8)}" fill="url(#${gid})" stroke="${dk(c, .2)}" stroke-width=".5"/></g>
        <path d="M-20,9 Q-4,3 17,-6 Q-2,1 -19,5Z" fill="#f6f7ea" stroke="#d8e0bc" stroke-width=".5"/>
        <path d="M-9,4.5 Q-11,-2 -16,-5 M-2,2 Q-2,-6 -6,-12 M5,-1 Q7,-8 6,-14 M11,-3.5 Q14,-7 16,-10 M-5,4 Q-2,10 2,13 M4,1 Q8,6 13,7" stroke="${lt(c, .55)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-12,-6 Q-4,-13 7,-12" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 地瓜葉（ハート形の葉と茎）
function twSPLeaf(p, x, y, s, r = 0, { c = '#2c6a28' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M0,-7.5 Q4,-11 8,-8 Q12,-4 8,2 Q4,7 0,10 Q-4,7 -8,2 Q-12,-4 -8,-8 Q-4,-11 0,-7.5Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M0,-6 L0,8 M0,-2 L-5,-5 M0,-2 L5,-5 M0,2 L-5,3 M0,2 L5,3" stroke="${lt(c, .4)}" stroke-width=".7" fill="none" stroke-linecap="round"/>
        <path d="M0,-7 L0,-13" stroke="#7fb050" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M-6,-6 Q-3,-8.4 1,-7" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 細い茎（地瓜葉・芹菜）
function twStick(p, x, y, L, w, r, c, { gloss = .5 } = {}){
    return `<g ${T(x, y, r)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${f1(L)}" height="${f1(w)}" rx="${f1(w * .4)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/>`
        + (gloss ? `<path d="M${f1(-L / 2 + w * .7)},${f1(-w * .2)} L${f1(L / 2 - w)},${f1(-w * .2)}" stroke="#fff" stroke-width="${f1(w * .24)}" stroke-linecap="round" opacity="${gloss}"/>` : '') + `</g>`;
}
// 白玉苦瓜の薄切り（半月: でこぼこの縁、淡い緑白）
function twKugua(p, x, y, s, r = 0, { c = '#c9dfa6' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,2 A10,8.6 0 0 1 10,2 Q8,3.2 5.4,2 A5.4,4 0 0 0 -5.4,2 Q-8,3.2 -10,2Z" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .32)}" stroke-width=".6"/></g>
        <path d="M-6,-3.4 Q-2,-6 3,-5.4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M-8,0 Q-5,-4 0,-5" stroke="#f0b63a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 茄子の棒切り（皮は紫、断面はやわらかな飴色、つや）
function twEggplantBaton(p, x, y, L, w, r = 0, { seed = 1, skinUp = true } = {}){
    const R = rng(p.id + 'tweb' + seed + x + y);
    const body = twSmooth([[-L / 2, -w / 2], [-L * .2, -w / 2 - 1], [L * .2, -w / 2 - .6], [L / 2, -w / 2], [L / 2 + 1, 0], [L / 2, w / 2], [L * .2, w / 2 + .8], [-L * .2, w / 2 + .6], [-L / 2, w / 2], [-L / 2 - 1, 0]].map(([a, b]) => [a + (R() - .5) * 1.4, b + (R() - .5) * 1.4]), .6);
    const cid = p.uid();
    const skin = '#5a2a66', flesh = '#c9a05a';
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(.8)}><path d="${body}" fill="${p.g(skinUp ? skin : flesh, .3, .3)}" stroke="${dk(skin, .3)}" stroke-width=".6"/></g>
        <g clip-path="url(#${cid})">${skinUp
            ? `<rect x="${f1(-L)}" y="${f1(w * .14)}" width="${2 * L}" height="${w}" fill="${p.g(flesh, .3, .3)}" opacity=".95"/><path d="M${f1(-L / 2)},${f1(w * .16)} L${f1(L / 2)},${f1(w * .12)}" stroke="#3e1a46" stroke-width="1" opacity=".7"/>`
            : `<rect x="${f1(-L)}" y="${f1(w * .28)}" width="${2 * L}" height="${w}" fill="${p.g(skin, .3, .3)}"/><path d="M${f1(-L * .4)},${f1(-w * .05)} Q0,${f1(w * .1)} ${f1(L * .4)},${f1(-w * .08)}" stroke="${dk(flesh, .3)}" stroke-width=".7" fill="none" opacity=".5"/>`}
        <path d="${body}" fill="#5a2a10" opacity=".12"/></g>
        <path d="M${f1(-L * .4)},${f1(-w * .26)} Q${f1(-L * .1)},${f1(-w * .4)} ${f1(L * .3)},${f1(-w * .28)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${skinUp ? .7 : .55}"/></g>`;
}
// 菜脯蛋（ふっくらした丸い卵焼き、焼き色、菜脯の茶色い粒とねぎ、くし切り）
function twCaipuDan(p, x, y, s, { cuts = 6, seed = 1 } = {}){
    const R = rng(p.id + 'twcd' + seed);
    const c = '#f0b93a', pts = ring(s / 2, 16, .07, R);
    let brown = '', bits = '', green = '';
    for (let i = 0; i < 14; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .44; brown += `<ellipse cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d)}" rx="${f1(4 + R() * 9)}" ry="${f1(2.5 + R() * 4)}" transform="rotate(${f1(R() * 180)} ${f1(Math.cos(a) * d)} ${f1(Math.sin(a) * d)})" fill="#c9771c" opacity="${f1(.18 + R() * .25)}"/>`; }
    for (let i = 0; i < 40; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .45, gx = Math.cos(a) * d, gy = Math.sin(a) * d; bits += `<path ${T(gx, gy, R() * 180)} d="M-2.4,-1.4 L2.4,-1.4 L2.6,1.4 L-2.4,1.4Z" fill="${R() < .5 ? '#8a5a2e' : '#a8723c'}"/>`; }
    for (let i = 0; i < 22; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .44, gx = Math.cos(a) * d, gy = Math.sin(a) * d; green += `<path ${T(gx, gy, R() * 180)} d="M-2.4,-.9 L2.4,-.9 L2.4,.9 L-2.4,.9Z" fill="${R() < .5 ? '#3f8f2f' : '#6aae44'}"/>`; }
    const cutLines = Array.from({ length: cuts }, (_, i) => { const a = i / cuts * 6.28 + .3; return `M0,0 L${f1(Math.cos(a) * s / 2)},${f1(Math.sin(a) * s / 2)}`; }).join(' ');
    return `<g ${T(x, y)}><g ${p.sh(1.4)}><path d="${smooth(pts)}" fill="${p.rg(c, .3, .25, .38, .34)}" stroke="#b8761a" stroke-width=".9"/></g>
        <path d="${smooth(pts)}" fill="none" stroke="#c0701a" stroke-width="4" opacity=".4"/>
        ${brown}${bits}${green}
        <path d="${cutLines}" stroke="#a8641a" stroke-width="1.8" opacity=".7"/><path d="${cutLines}" stroke="#fde6a0" stroke-width=".7" opacity=".7" transform="translate(-.8 -.8)"/>
        <path d="M${f1(-s * .34)},${f1(-s * .16)} Q${f1(-s * .2)},${f1(-s * .36)} ${f1(s * .06)},${f1(-s * .4)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 虱目魚肚の焼いたもの（皮目を上に: 銀灰の皮にこんがりした焼き色、両端がとがった細長い形、真ん中に腹の筋）
function twMilkfish(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'twmf' + seed + x);
    const h = L * .36;
    const body = twSmooth([[-L / 2, 0], [-L * .36, -h * .36], [-L * .12, -h * .5], [L * .14, -h * .48], [L * .36, -h * .32], [L / 2, 0], [L * .36, h * .32], [L * .14, h * .48], [-L * .12, h * .5], [-L * .36, h * .36]], .9);
    const cid = p.uid();
    const gid = p.def('twmfg', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e9a9e"/><stop offset=".3" stop-color="#c4ccc8"/><stop offset=".5" stop-color="#e2e0d2"/><stop offset=".7" stop-color="#c2c8c2"/><stop offset="1" stop-color="#8a9498"/></linearGradient>`);
    let ch = '';
    for (let i = 0; i < 12; i++) ch += `<ellipse cx="${f1(-L * .42 + R() * L * .84)}" cy="${f1((R() - .5) * h * .8)}" rx="${f1(4 + R() * 9)}" ry="${f1(2 + R() * 3)}" transform="rotate(${f1((R() - .5) * 30)} ${f1(-L * .42 + R() * L * .84)} ${f1((R() - .5) * h * .8)})" fill="#b8742c" opacity="${f1(.28 + R() * .35)}"/>`;
    let scales = '';
    for (let i = 0; i < 9; i++){ const sx = -L * .4 + i * L * .1; scales += `M${f1(sx)},${f1(-h * .42)} q${f1(2 + R() * 2)},${f1(h * .2)} 0,${f1(h * .42)} q${f1(-2 - R() * 2)},${f1(h * .22)} 0,${f1(h * .42)}`; }
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs>
        <g ${p.sh(1.2)}><path d="${body}" fill="url(#${gid})" stroke="#5e6a6a" stroke-width=".9"/></g>
        <g clip-path="url(#${cid})">
            <path d="${scales}" stroke="#6a7678" stroke-width=".7" fill="none" opacity=".35"/>
            <path d="M${f1(-L / 2)},0 Q0,${f1(h * .08)} ${f1(L / 2)},0" stroke="#58625e" stroke-width="1.6" fill="none" opacity=".55"/>
            ${ch}
            <path d="${body}" fill="none" stroke="#c48a3a" stroke-width="3" opacity=".45"/>
            <path d="M${f1(-L * .3)},${f1(h * .36)} Q0,${f1(h * .48)} ${f1(L * .3)},${f1(h * .34)}" stroke="#f3e2c6" stroke-width="2.4" fill="none" opacity=".7"/>
        </g>
        <path d="M${f1(-L * .34)},${f1(-h * .3)} Q${f1(-L * .1)},${f1(-h * .44)} ${f1(L * .2)},${f1(-h * .3)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M${f1(L * .26)},${f1(-h * .1)} Q${f1(L * .36)},${f1(-h * .02)} ${f1(L * .4)},${f1(h * .1)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 皮つき豚ばらの小さな薄切り（炒米粉の肉絲）
const twPorkShreds = (p, x, y, s, o = {}) => twStrips(p, x, y, s, { c: '#cfa07a', n: 14, w: 3.6, len: .26, gloss: .4, ...o });

// =========================================================
const DISHES = {
    // 白飯: 藍の線と花の飯碗に、つやのある白いご飯をこんもり
    tw_staple: p => [
        twBowl(p, { R: 92 }),
        twRice(p, 100, 101, 146, { density: 1.35, grain: 4 }),
        `<path d="M50,82 Q58,58 84,48" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
    ].join(''),

    // 滷肉飯: 飯碗の白いご飯の上に、飴色の滷肉（皮つき豚ばらの細切り）とたれ、滷蛋の半分、黄色いたくあん
    tw_lurou_fan: p => {
        const bits = twSpots('lr', 40, 44, 7.5, 98, 104, .9);
        return [
            twBowl(p, { R: 92 }),
            twRice(p, 100, 101, 148, { density: 1.1, grain: 4 }),
            `<path ${T(97, 104)} d="${twSmooth(ring(50, 12, .2, rng('lrs'), 1.04, .92))}" fill="#7a3c12" opacity=".78"/>`,
            `<path ${T(97, 104)} d="${twSmooth(ring(40, 12, .2, rng('lrs2'), 1.04, .92))}" fill="#9a4e18" opacity=".45"/>`,
            `<g ${p.sh(.6)}>`,
            ...bits.map(([x, y, r, q], i) => twLuRou(p, x, y, 9 + q * 5, 6 + q * 2, r, { seed: i })),
            `</g>`,
            twGrains(p, 98, 104, 84, { cols: ['#c48a44', '#a86a2a'], n: 26, size: 1.3, seed: 4 }),
            twLuEgg(p, 133, 72, 38, -24),
            twPickledRadish(p, 60, 128, 22, 20),
            twPickledRadish(p, 66, 140, 20, -40),
            twOil(p, 98, 104, 96, { n: 9, c: '#e0a24a', op: .5, rmax: 1.6 }),
            `<path d="M60,88 Q66,70 86,62" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>`,
        ].join('');
    },

    // 三杯雞: 砂鍋に、黒ごま油と醤油の濃い照りの骨つき鶏、丸ごとのにんにく、しょうが、たっぷりの九層塔、赤唐辛子
    tw_sanbeiji: p => [
        twSandPot(p),
        K.liquid(p, { R: 75, c: '#4a2210', op: 1, shine: false }),
        `<circle cx="96" cy="96" r="54" fill="#8a4a1a" opacity=".3"/>`,
        twOil(p, 100, 100, 140, { n: 14, c: '#c88a2a', op: .5, rmax: 2 }),
        `<g ${p.sh(1)}>`,
        ...[[74, 74, 40, 20, true], [118, 66, 40, -40, false], [144, 102, 38, 70, true], [98, 100, 44, 115, false], [62, 116, 38, -50, true], [112, 134, 40, 10, false], [80, 146, 34, 60, true], [142, 140, 32, -80, false], [136, 76, 30, 150, false]].map(([x, y, s, r, b], i) => twChickenBone(p, x, y, s, r, { seed: i + 1, bone: b, c: i % 2 ? '#8e3f16' : '#a04c1c' })),
        ...[[92, 72, 20], [128, 94, -30], [78, 100, 60], [116, 112, 100], [96, 128, -60], [60, 138, 30], [150, 122, 80], [70, 60, -20]].map(([x, y, r]) => twGarlic(p, x, y, 13, r)),
        twGinger(p, 104, 86, 14, 30), twGinger(p, 132, 120, 13, -50), twGinger(p, 74, 124, 13, 70),
        `</g>`,
        ...[[86, 90, -20], [120, 80, 40], [136, 110, -60], [100, 112, 110], [70, 110, 20], [112, 146, -30], [88, 134, 70], [150, 86, 150], [60, 84, 100], [128, 136, 10], [104, 60, -70]].map(([x, y, r], i) => twBasil(p, x, y, 21 + (i % 3) * 2, r, { c: i % 2 ? '#2a6426' : '#357a2c' })),
        twChiliRing(p, 108, 96, 9, 20), twChiliRing(p, 80, 72, 8, -40), twChiliRing(p, 126, 124, 8, 60),
        twShine(100, 100, 75, .3),
    ].join(''),

    // 菜脯蛋: 白い皿に、ふっくら丸く焼いた菜脯入りの卵焼きをくし切りに
    tw_caipu_dan: p => [
        twPlate(p),
        twCaipuDan(p, 100, 100, 126, { cuts: 6 }),
    ].join(''),

    // 乾煎虱目魚肚: 楕円の魚皿に、皮目をこんがり焼いた虱目魚の腹身を2枚、レモン、針しょうが
    tw_jian_shimuyu: p => [
        twOval(p),
        twMilkfish(p, 92, 84, 136, -14, { seed: 1 }),
        twMilkfish(p, 106, 118, 132, -10, { seed: 2 }),
        K.lemon(p, 158, 84, 20, -60), K.lemon(p, 164, 104, 18, -20),
        twFineShreds(p, 44, 116, 26, { c: '#f1dc92', n: 8, w: 1.3, seed: 2, dir: .4, len: .7 }),
    ].join(''),

    // 瓜仔肉: 白い浅鉢に、蒸し上がった豚ひき肉（花瓜の緑の粒が混ざる）、まわりに琥珀色の肉汁
    tw_gualirou: p => {
        const R = rng(p.id + 'gl');
        return [
            twBowl(p, { R: 92, lip: .84, flowers: 3 }),
            K.liquid(p, { R: 76, c: '#c89a4a', op: .9, shine: false }),
            `<g ${p.sh(1.2)}><path ${T(100, 100)} d="${twSmooth(ring(64, 14, .1, R, 1, .96))}" fill="${p.rg('#9c7a5e', .22, .3, .4, .36)}"/></g>`,
            twGrains(p, 100, 100, 122, { cols: ['#a88468', '#8e6a4e', '#bc9a7e', '#9a7658'], n: 170, size: 2.6, seed: 2 }),
            twGrains(p, 100, 100, 118, { cols: ['#6f7a3a', '#86944a'], n: 40, size: 2, seed: 3 }),
            twGrains(p, 100, 100, 112, { cols: ['#c8a888'], n: 36, size: 1.4, seed: 5 }),
            `<path ${T(100, 100)} d="${twSmooth(ring(64, 14, .1, rng(p.id + 'gl'), 1, .96))}" fill="none" stroke="#6e4e34" stroke-width="1" opacity=".5"/>`,
            twOil(p, 100, 100, 150, { n: 14, c: '#e8b85a', op: .55, rmax: 2 }),
            `<path d="M56,82 Q64,64 84,58" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".5"/>`,
            twShine(100, 100, 76, .3),
        ].join('');
    },

    // 蔥爆牛肉: 白い皿に、照りのある薄切り牛肉と、たっぷりのねぎのぶつ切り（白と緑）、赤唐辛子
    tw_congbao_niurou: p => [
        twPlate(p),
        twSauce(p, 100, 104, 128, '#6a3416', { op: .7 }),
        `<g ${p.sh(1)}>`,
        ...[[84, 84, 10], [124, 80, -30], [100, 112, 50], [66, 112, -20], [140, 112, 60], [88, 140, 120], [126, 138, -60], [108, 62, 30], [60, 86, 70], [150, 86, 100], [112, 96, 160], [76, 130, 0]].map(([x, y, r], i) => K.beefSlice(p, x, y, 36, r, { c: i % 2 ? '#6e3a1e' : '#7c4426', seed: i + 1 })),
        `</g>`,
        ...[[92, 94, 30], [118, 104, -40], [76, 100, 70], [128, 72, -10], [100, 130, 20], [60, 124, 100], [140, 128, 50], [86, 66, 140], [146, 98, 80], [108, 82, 60], [70, 76, -60], [120, 148, 110], [94, 148, -20], [134, 90, 160], [56, 102, 20]].map(([x, y, r], i) => twScallionSeg(p, x, y, 26, r, { green: i % 3 !== 0 })),
        twChiliRing(p, 104, 110, 9, 20), twChiliRing(p, 80, 118, 8, -50), twChiliRing(p, 130, 118, 8, 70),
        `<path d="M56,80 Q68,60 92,54" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".3"/>`,
    ].join(''),

    // 炒米粉: 白い皿に、細い米粉を山盛り、肉絲、キャベツ、にんじん、しいたけ、蝦米、油蔥酥、ねぎ
    tw_chao_mifen: p => [
        twPlate(p),
        `<g ${p.sh(1)}><path ${T(100, 102)} d="${twSmooth(ring(62, 12, .14, rng('mf'), 1, .9))}" fill="#e2cfa0"/></g>`,
        twWavy(p, 100, 102, 128, { c: '#f1e6c4', w: 2.6, n: 52, seed: 1, len: .55, sy: .9, outline: '#c7ae78', layers: 5 }),
        twStrips(p, 100, 102, 104, { c: '#cfe29a', n: 14, w: 3.6, len: .3, seed: 2 }),
        twStrips(p, 100, 100, 100, { c: '#ef7f30', n: 12, w: 2.4, len: .3, seed: 3 }),
        twStrips(p, 100, 102, 96, { c: '#5a3a22', n: 9, w: 3.2, len: .26, seed: 4, gloss: .3 }),
        twPorkShreds(p, 100, 100, 100, { seed: 5 }),
        twWavy(p, 100, 100, 100, { c: '#f1e6c4', w: 2.6, n: 26, seed: 2, len: .45, sy: .9, outline: '#c7ae78', layers: 3 }),
        twGrains(p, 100, 102, 100, { cols: ['#e8884a', '#f0a060'], n: 10, size: 1.7, seed: 6 }),
        twGrains(p, 100, 102, 104, { cols: ['#a8642a', '#8a4c1c'], n: 16, size: 1.3, seed: 7 }),
        twScallions(p, 100, 100, 90, { n: 8 }),
        `<path d="M56,84 Q66,62 92,54" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>`,
    ].join(''),

    // 炒高麗菜: 白い皿に、手でちぎった大きめのキャベツをつやよく炒めたもの、にんにくの薄切り、にんじん、赤唐辛子
    tw_chao_gaolicai: p => [
        twPlate(p),
        twSauce(p, 100, 104, 124, '#cfd39a', { op: .4 }),
        `<g ${p.sh(.6)}>`,
        ...[[78, 72, 54, 20], [118, 64, 50, -30], [62, 106, 52, 80], [100, 98, 56, 10], [80, 136, 52, -40], [120, 136, 48, 30], [142, 100, 50, 130], [96, 116, 44, 200], [134, 76, 40, 60]].map(([x, y, s, r], i) => twCabbage(p, x, y, s, r, { c: i % 2 ? '#cfe3a2' : '#bdd88c', seed: i + 1 })),
        `</g>`,
        K.carrotRound(p, 90, 82, 13, { half: true, r: 30 }), K.carrotRound(p, 126, 112, 12, { half: true, r: -60 }), K.carrotRound(p, 76, 124, 12, { half: true, r: 120 }),
        twGrains(p, 100, 100, 110, { cols: ['#f6e7b0', '#eed496'], n: 18, size: 1.8, seed: 3 }),
        twChiliRing(p, 108, 100, 9, 20), twChiliRing(p, 72, 96, 8, -50), twChiliRing(p, 118, 142, 8, 70),
    ].join(''),

    // 燙地瓜葉: 白い皿に、ゆでた地瓜葉（ハート形の葉と茎）を山にして、醤油膏、にんにくのみじん切り、油蔥酥
    tw_tang_diguaye: p => {
        const R = rng(p.id + 'dg');
        let g = '';
        for (const [x, y] of twSpots('dg1', 10, 46, 14)) g += twStick(p, x, y, 26 + R() * 10, 3.6, R() * 180, '#7fb050', { gloss: .5 });
        for (const [x, y] of twSpots('dg2', 14, 48, 14)) g += twSPLeaf(p, x, y, 30 + R() * 10, R() * 360, { c: R() < .5 ? '#2a6426' : '#357a2c' });
        for (const [x, y] of twSpots('dg3', 8, 40, 14)) g += twStick(p, x, y, 24 + R() * 8, 3.4, R() * 180, '#8cc05a', { gloss: .5 });
        for (const [x, y] of twSpots('dg4', 8, 38, 16)) g += twSPLeaf(p, x, y, 30, R() * 360, { c: '#2c6a28' });
        return [
            twPlate(p),
            `<g ${p.sh(1)}><path ${T(100, 102)} d="${twSmooth(ring(58, 12, .16, R, 1, .95))}" fill="${p.rg('#2a5a22', .25, .3)}"/></g>`,
            `<g ${p.sh(.7)}>`, g, `</g>`,
            ...[[86, 92, 16, 9, 20], [112, 104, 18, 10, -20], [96, 118, 14, 8, 40], [124, 84, 12, 7, 10]].map(([x, y, w, h, r]) => `<g ${T(x, y, r)}><ellipse rx="${w / 2}" ry="${h / 2}" fill="#4a2410" opacity=".8"/><path d="M${-w * .3},${-h * .1} Q0,${-h * .4} ${w * .3},${-h * .15}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/></g>`),
            twGrains(p, 100, 100, 90, { cols: ['#f6e7b0', '#fff6cf'], n: 22, size: 1.4, seed: 2 }),
            twGrains(p, 100, 100, 96, { cols: ['#a8642a', '#8a4c1c', '#c4823c'], n: 20, size: 1.5, seed: 3 }),
        ].join('');
    },

    // 滷豆干滷蛋: 白い皿に、薄切りにした滷豆干を並べ、滷蛋（半分と丸ごと）、海帯結、たれ、ねぎ
    tw_lu_dougan: p => [
        twPlate(p),
        twSauce(p, 100, 104, 126, '#6a3414', { op: .55 }),
        `<g ${p.sh(.8)}>`,
        ...[[60, 88, -8], [88, 82, 6], [116, 98, -14], [56, 118, 12], [84, 112, -4], [112, 128, 8], [76, 142, -10], [104, 154, 4]].map(([x, y, r]) => twDougan(p, x, y, 26, 22, r)),
        `</g>`,
        twLuEgg(p, 142, 80, 38, 20), twLuEggWhole(p, 110, 58, 30, -30), twLuEgg(p, 142, 122, 36, -40),
        twKelpKnot(p, 134, 150, 26, 20), twKelpKnot(p, 74, 60, 24, -50), twKelpKnot(p, 156, 101, 20, 80),
        twScallions(p, 100, 100, 100, { n: 12 }),
        twOil(p, 100, 104, 90, { n: 6, c: '#c88a2a', op: .45, rmax: 1.5 }),
    ].join(''),

    // 蒼蠅頭: 白い皿に、小口に刻んだ韭菜花（緑の小さな筒）と、カリッと炒めた豚ひき肉、赤唐辛子、豆豉
    tw_cangyingtou: p => {
        const R = rng(p.id + 'cy');
        let tubes = '';
        for (let i = 0; i < 80; i++){
            const a = R() * 6.28, d = Math.sqrt(R()) * 56, cx = 100 + Math.cos(a) * d, cy = 102 + Math.sin(a) * d * .92, rr = R() * 180, L = 4 + R() * 3, w = 2.8 + R() * 1.2;
            const c = R() < .5 ? '#4f9a2e' : R() < .5 ? '#5fae38' : '#3f8a26';
            tubes += `<rect ${T(cx, cy, rr)} x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${f1(L)}" height="${f1(w)}" rx="1" fill="${c}" stroke="${lt(c, .45)}" stroke-width=".7"/>`;
        }
        return [
            twPlate(p),
            `<g ${p.sh(1)}><path ${T(100, 102)} d="${twSmooth(ring(60, 12, .14, R, 1, .94))}" fill="${p.rg('#6a5230', .2, .3)}"/></g>`,
            twGrains(p, 100, 102, 116, { cols: ['#8a5a34', '#9c6a3c', '#6e4424'], n: 110, size: 2.2, seed: 1, sy: .94 }),
            `<g ${p.sh(.4)}>${tubes}</g>`,
            twGrains(p, 100, 102, 108, { cols: ['#8a5a34', '#a06c3e', '#704626'], n: 45, size: 2.2, seed: 2, sy: .94 }),
            twGrains(p, 100, 102, 100, { cols: ['#2a1a14', '#3a2418'], n: 22, size: 1.5, seed: 3, sy: .94 }),
            ...[[84, 88, 20], [118, 96, -40], [98, 118, 70], [70, 112, 0], [132, 124, 110], [110, 70, 50], [64, 90, -70], [140, 90, 30], [90, 140, -20], [122, 142, 80]].map(([x, y, r]) => twChiliRing(p, x, y, 8, r)),
            `<path d="M58,86 Q68,66 92,58" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".35"/>`,
        ].join('');
    },

    // 鹹蛋苦瓜: 白い皿に、淡い緑白の苦瓜の薄切りに、黄金色の鹹蛋の黄身がからんだもの、白身の粒、赤唐辛子、ねぎ
    tw_xiandan_kugua: p => [
        twPlate(p),
        twSauce(p, 100, 104, 120, '#e8c060', { op: .5 }),
        `<g ${p.sh(.7)}>`,
        ...twSpots('kg', 22, 54, 16, 100, 102).map(([x, y, r, q], i) => twKugua(p, x, y, 30 + q * 6, r, { c: i % 3 ? '#d4e6b4' : '#c2dca0' })),
        `</g>`,
        twGrains(p, 100, 102, 116, { cols: ['#f0b63a', '#e89a2a', '#f6cf5a'], n: 120, size: 2.2, seed: 1 }),
        twGrains(p, 100, 102, 108, { cols: ['#f6f0dc'], n: 18, size: 2, seed: 2 }),
        twChiliRing(p, 92, 92, 8, 20), twChiliRing(p, 124, 110, 8, -40), twChiliRing(p, 76, 124, 7, 70),
        twScallions(p, 100, 100, 90, { n: 8 }),
    ].join(''),

    // 塔香茄子: 白い皿に、皮の紫が映える茄子の棒切りを醤油膏でからめ、九層塔、にんにく、赤唐辛子
    tw_taxiang_qiezi: p => [
        twPlate(p),
        twSauce(p, 100, 104, 128, '#6e3814', { op: .72 }),
        `<g ${p.sh(.8)}>`,
        ...[[80, 70, 48, 14, -20, true], [120, 72, 46, 14, 25, false], [66, 100, 50, 14, 70, true], [104, 96, 52, 15, -8, true], [140, 104, 46, 14, 60, false], [84, 126, 50, 14, 20, false], [124, 132, 48, 14, -30, true], [100, 150, 40, 13, 5, true], [146, 136, 36, 12, 110, true]].map(([x, y, L, w, r, up], i) => twEggplantBaton(p, x, y, L, w, r, { seed: i + 1, skinUp: up })),
        `</g>`,
        twGrains(p, 100, 100, 100, { cols: ['#f6e7b0', '#e9cf86'], n: 18, size: 1.5, seed: 3 }),
        ...[[92, 86, -20], [128, 90, 40], [76, 112, 60], [112, 114, 110], [100, 136, -40], [138, 120, 150], [64, 84, 20], [120, 60, 80]].map(([x, y, r], i) => twBasil(p, x, y, 20 + (i % 3) * 2, r, { c: i % 2 ? '#2a6426' : '#357a2c' })),
        twChiliRing(p, 104, 104, 8, 20), twChiliRing(p, 84, 140, 8, -50), twChiliRing(p, 146, 90, 7, 60),
        twOil(p, 100, 104, 100, { n: 8, c: '#c88a2a', op: .45, rmax: 1.5 }),
    ].join(''),

    // 蛤蜊湯: 白い湯碗に、澄んだ汁、口を開けた蛤蜊、針しょうが、ねぎ、ごま油の粒
    tw_geli_tang: p => [
        twBowl(p, { R: 92 }),
        K.liquid(p, { R: 79, c: '#e8dcb4', op: .62, shine: false }),
        `<g ${p.sh(.8)}>`,
        ...[[74, 80, 28, -20], [122, 72, 28, 25], [142, 112, 27, 70], [96, 102, 30, 5], [62, 120, 27, -60], [116, 134, 28, 160], [88, 142, 25, 120], [140, 80, 24, 110], [72, 60, 22, 40], [112, 60, 22, -15], [60, 96, 23, 100], [148, 140, 22, 190]].map(([x, y, s, r]) => K.clam(p, x, y, s, r, { open: true })),
        `</g>`,
        twFineShreds(p, 100, 100, 110, { c: '#f1dc92', n: 18, w: 1.3, seed: 2, dir: -.3, len: .3 }),
        twScallions(p, 100, 100, 110, { n: 14 }),
        twOil(p, 100, 100, 130, { n: 12, c: '#f2cf6c', op: .5, rmax: 1.8 }),
        twShine(100, 100, 79, .4),
    ].join(''),

    // 玉米排骨湯: 白い湯碗に、澄んだ汁、とうもろこしの輪切り、排骨、にんじん、しょうが
    tw_yumi_paigu: p => [
        twBowl(p, { R: 92 }),
        K.liquid(p, { R: 79, c: '#ecd69c', op: .62, shine: false }),
        `<g ${p.sh(.6)}>`,
        twRib(p, 76, 80, 34, 20, { seed: 1 }), twRib(p, 130, 122, 34, -40, { seed: 2 }), twRib(p, 74, 130, 32, 100, { seed: 3 }), twRib(p, 134, 76, 30, 160, { seed: 4 }), twRib(p, 100, 148, 28, 20, { seed: 5 }),
        twCorn(p, 104, 100, 40, 24, 12, { seed: 1 }), twCorn(p, 60, 104, 34, 22, -70, { seed: 2 }), twCorn(p, 146, 100, 34, 22, 80, { seed: 3 }), twCorn(p, 100, 58, 34, 22, 190, { seed: 4 }),
        K.carrotChunk(p, 118, 128, 18, 30, { c: '#e8622a' }), K.carrotChunk(p, 84, 110, 17, -50, { c: '#e8622a' }), K.carrotChunk(p, 126, 96, 16, 100, { c: '#e8622a' }),
        twGinger(p, 92, 128, 12, 40),
        `</g>`,
        `<circle cx="100" cy="100" r="79" fill="#efe0b0" opacity=".12"/>`,
        twOil(p, 100, 100, 130, { n: 10, c: '#f2cf6c', op: .5, rmax: 2 }),
        twShine(100, 100, 79, .4),
    ].join(''),

    // 魚丸湯: 白い湯碗に、澄んだ汁、白い魚丸、芹菜珠、油蔥酥、白こしょう
    tw_yuwan_tang: p => [
        twBowl(p, { R: 92 }),
        K.liquid(p, { R: 79, c: '#e9dcb2', op: .66, shine: false }),
        ...[[78, 78, 30], [120, 70, 29], [142, 108, 28], [98, 104, 32], [64, 118, 28], [118, 134, 30], [86, 144, 26], [142, 140, 24], [66, 90, 20], [150, 76, 20], [110, 58, 20], [124, 102, 18], [56, 146, 16]].map(([x, y, s]) => twFishBall(p, x, y, s)),
        twGrains(p, 100, 100, 130, { cols: ['#4f9a2e', '#6aae44', '#3f8a26'], n: 50, size: 1.7, seed: 1 }),
        twGrains(p, 100, 100, 124, { cols: ['#a8642a', '#8a4c1c', '#c4823c'], n: 26, size: 1.5, seed: 2 }),
        K.sprinkle(p, 100, 100, 110, { c: '#6a5a44', n: 16, r: .6 }),
        twOil(p, 100, 100, 130, { n: 10, c: '#f2cf6c', op: .45, rmax: 1.6 }),
        twShine(100, 100, 79, .4),
    ].join(''),
};

// 小数を1桁に丸めてファイルを軽くする
const twSlim = str => str.replace(/(\d+\.\d)\d+/g, '$1').replace(/(\d)\.0(?!\d)/g, '$1');
export default Object.fromEntries(Object.entries(DISHES).map(([id, fn]) => [id, p => twSlim(fn(p))]));
