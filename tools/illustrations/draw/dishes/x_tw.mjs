// 台湾（家常菜・小吃・湯）: 二回目の手描き。w_tw.mjs の器と部品を写して（xtw〜）、料理ごとに盛りつけ
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// このファイル専用の部品（tw で始まる）。w_cn / w_kr / w_vn から写して手直ししたもの
// =========================================================
function xtwSm(pts, closed = false, k = 1){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6 * k)},${f1(p1[1] + (p2[1] - p0[1]) / 6 * k)} ${f1(p2[0] - (p3[0] - p1[0]) / 6 * k)},${f1(p2[1] - (p3[1] - p1[1]) / 6 * k)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const xtwSmooth = (pts, k = 1) => xtwSm(pts, true, k);
function xtwOutline(p, c, r = .55){
    const id = p.def('xtwOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// 散らす位置（重なりすぎないように）
function xtwSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('twspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360), R()]);
    }
    return out;
}
const xtwShine = (cx, cy, R, op = .35) => `<path d="M${f1(cx - R * .55)},${f1(cy + R * .1)} A${f1(R * .6)},${f1(R * .6)} 0 0 1 ${f1(cx - R * .05)},${f1(cy - R * .52)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;

// ---------- 器（白磁に藍の線、縁に小さな桃色の花: 台湾の食卓でよく見る柄） ----------
const XTW_BLUE = '#2f5f9e';
function xtwFlower(p, x, y, s, a = 0){
    return `<g ${T(x, y, a, s / 10)}>${[0, 72, 144, 216, 288].map(r => `<ellipse transform="rotate(${r})" cx="0" cy="-3" rx="1.8" ry="2.5" fill="#e4697c" opacity=".8"/>`).join('')}<circle r="1.3" fill="#f3cf5a"/><path d="M-3.6,3.6 q-4.4,1.6 -6.6,-1.6 q4.4,-2.2 6.6,1.6Z M3.6,3.6 q4.4,1.6 6.6,-1.6 q-4.4,-2.2 -6.6,1.6Z" fill="#5b9e4e" opacity=".8"/></g>`;
}
function xtwFlowers(p, rm, n, s = 10, start = 0){
    let out = '';
    for (let i = 0; i < n; i++){ const a = start + i / n * Math.PI * 2; out += xtwFlower(p, 100 + Math.cos(a) * rm, 100 + Math.sin(a) * rm, s, a * 57.3 + 90); }
    return out;
}
// 平皿（盤子）
function xtwPlate(p, { R = 94, well = .72, flowers = 4 } = {}){
    const w = R * well, base = '#fbfbf7';
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .1, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${XTW_BLUE}" stroke-width="1.8"/>
        <circle cx="100" cy="100" r="${R - 6}" fill="none" stroke="${XTW_BLUE}" stroke-width=".6" opacity=".7"/>
        ${flowers ? xtwFlowers(p, (R - 6 + w + 3) / 2, flowers, 11, .8) : ''}
        <circle cx="100" cy="100" r="${f1(w + 1.5)}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".45"/>
        <circle cx="100" cy="100" r="${f1(w)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .2)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 碗（飯碗・湯碗）: 縁に藍の二重線、縁の内側に花
function xtwBowl(p, { R = 92, inside = '#fbfaf5', lip = .87, flowers = 3 } = {}){
    const r = R * lip;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#f9f8f3', .25, .2, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.4}" fill="none" stroke="${XTW_BLUE}" stroke-width="2.2"/>
        <circle cx="100" cy="100" r="${R - 5}" fill="none" stroke="${XTW_BLUE}" stroke-width=".6" opacity=".7"/>
        ${flowers ? xtwFlowers(p, (R - 5 + r) / 2, flowers, Math.max(7, (R - 5 - r) * .85), 1.2) : ''}
        <circle cx="100" cy="100" r="${f1(r + 1.2)}" fill="none" stroke="${XTW_BLUE}" stroke-width=".8" opacity=".8"/>
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .22, .64, .66)}"/>
        <path d="M${f1(100 - R * .7)},${f1(100 - R * .42)} A${f1(R * .82)},${f1(R * .82)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .78)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 魚盤（楕円の白い皿）
function xtwOval(p, { rx = 97, ry = 70 } = {}){
    const base = '#fbfbf7';
    return `<g ${p.sh(1.6)}><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${p.rg(base, .2, .12, .38, .32)}"/></g>
        <ellipse cx="100" cy="100" rx="${rx - 3}" ry="${ry - 3}" fill="none" stroke="${XTW_BLUE}" stroke-width="1.8"/>
        <ellipse cx="100" cy="100" rx="${rx - 6}" ry="${ry - 6}" fill="none" stroke="${XTW_BLUE}" stroke-width=".6" opacity=".7"/>
        ${xtwFlower(p, 100 - rx + 13, 100, 11, -90)}${xtwFlower(p, 100 + rx - 13, 100, 11, 90)}
        <ellipse cx="100" cy="100" rx="${rx - 20}" ry="${ry - 16}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".45"/>
        <ellipse cx="100" cy="100" rx="${rx - 21}" ry="${ry - 17}" fill="${p.rg(base, .06, .08, .6, .62)}"/>
        <path d="M${100 - rx * .8},${100 - ry * .35} Q${100 - rx * .7},${100 - ry * .82} ${100 - rx * .3},${100 - ry * .88}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 砂鍋（三杯雞の土鍋）: 砂色の外側に斑点、厚い縁、黒茶の釉薬の内側、左右に小さな耳
function xtwSandPot(p, { R = 90 } = {}){
    const Rr = rng(p.id + 'sand');
    let sp = '';
    for (let i = 0; i < 30; i++){ const a = Rr() * 6.28, d = R * (.9 + Rr() * .08); sp += `<circle cx="${f1(100 + Math.cos(a) * d)}" cy="${f1(100 + Math.sin(a) * d)}" r="${f1(.5 + Rr() * .8)}" fill="#6a4a30" opacity=".5"/>`; }
    return `<g ${p.sh(2)}><rect x="3" y="90" width="194" height="20" rx="8" fill="${p.g('#8f6a48', .25, .3)}"/><circle cx="100" cy="100" r="${R}" fill="${p.rg('#b8926a', .2, .32, .35, .3)}"/></g>${sp}
        <circle cx="100" cy="100" r="${f1(R * .88)}" fill="none" stroke="${p.g('#9a7250', .3, .35)}" stroke-width="5"/>
        <circle cx="100" cy="100" r="${f1(R * .85)}" fill="${p.rg('#2e1a10', .14, .2, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .44)} A${f1(R * .84)},${f1(R * .84)} 0 0 1 ${f1(100 - R * .3)},${f1(100 - R * .78)}" stroke="#f1d6b8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`;
}

// ---------- ご飯・麺 ----------
function xtwRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85, sdOp = .55, base = null } = {}){
    const R = rng(p.id + 'xtwRice' + seed + x + y);
    const shape = xtwSmooth(ring(s / 2, 14, .07, R, 1, sy));
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
    const shade = p.def('xtwRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity="${sdOp}" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(base || dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// うねった細い麺（米粉）
function xtwWavy(p, x, y, s, { c = '#f3ead2', w = 5, n = 14, seed = 1, sy = .9, len = .55, wav = .5, outline = null, layers = 4 } = {}){
    const R = rng(p.id + 'xtwWv' + seed + x);
    const ol = xtwOutline(p, outline || dk(c, .25), .6), rad = s / 2;
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
        const dd = xtwSm(pts);
        const l = L[i % layers];
        if (R() < .3) l[1] += dd; else l[0] += dd;
        if (R() < .5) l[2] += xtwSm(pts.slice(1, 4).map(([a, b]) => [a - w * .18, b - w * .2]));
    }
    return `<g ${p.sh(.8)}>${L.map(([a, b, h]) => `<g ${ol}><path d="${a}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${b}" stroke="${lt(c, .14)}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g>${h ? `<path d="${h}" stroke="#fff" stroke-width="${f1(w * .24)}" fill="none" stroke-linecap="round" opacity=".5"/>` : ''}`).join('')}</g>`;
}
// 小さな粒（みじん切り・ひき肉・油蔥酥など）。色ごとに1本のpath
function xtwGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1 } = {}){
    const R = rng(p.id + 'xtwGr' + seed + x + y);
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
function xtwStrips(p, x, y, s, { c = '#8a5230', n = 14, w = 3.4, len = .28, seed = 1, sy = .85, curve = .25, dir = null, gloss = .4 } = {}){
    const R = rng(p.id + 'xtwSt' + seed + x + y);
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
    return `<g ${xtwOutline(p, dk(c, .35), .5)} fill="none" stroke-linecap="round" stroke-width="${w}">${cols.map((cc, i) => ds[i] ? `<path d="${ds[i]}" stroke="${cc}"/>` : '').join('')}</g>${gloss ? `<path d="${hl}" stroke="#fff" stroke-width="${f1(w * .28)}" fill="none" stroke-linecap="round" opacity="${gloss}"/>` : ''}`;
}
// 細い千切り（しょうが・ねぎ）
function xtwFineShreds(p, x, y, s, { c = '#f2f4e2', n = 16, w = 1.4, seed = 1, dir = -.4, len = .7 } = {}){
    const R = rng(p.id + 'xtwFs' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){
        const a = dir + (R() - .5) * .9, L = s * len * (.6 + R() * .5), cx = x + (R() - .5) * s * .7, cy = y + (R() - .5) * s * .4;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, b = (R() - .5) * 4;
        d += `M${f1(cx - dx)} ${f1(cy - dy)}Q${f1(cx + b)} ${f1(cy - b)} ${f1(cx + dx)} ${f1(cy + dy)}`;
    }
    return `<path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(w + .8)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
// 汁に浮いた油の粒
function xtwOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .6, rmax = 2 } = {}){
    const R = rng(p.id + 'xtwOi' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f1(cx - rr * .3)}" cy="${f1(cy - rr * .35)}" r="${f1(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 皿の上のたれ・汁気の面
function xtwSauce(p, x, y, s, c, { op = .9, seed = 1, sy = .82 } = {}){
    const R = rng(p.id + 'xtwSc' + seed);
    return `<path ${T(x, y)} d="${xtwSmooth(ring(s / 2, 11, .22, R, 1, sy))}" fill="${p.rg(c, .22, .25)}" opacity="${op}"/>`;
}
// 青ねぎの小口切り
const xtwScallions = (p, x, y, s, o = {}) => K.scallions(p, x, y, s, { c: '#4f9a2e', ...o });
// ぶつ切りのねぎ（4cm、白と緑）
function xtwScallionSeg(p, x, y, s, r = 0, { green = false } = {}){
    const c = green ? '#6fb044' : '#f1f3df', h = s * .24;
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><rect x="${f1(-s / 2)}" y="${f1(-h / 2)}" width="${f1(s)}" height="${f1(h)}" rx="${f1(h * .35)}" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="M${f1(-s * .4)},${f1(-h * .05)} L${f1(s * .4)},${f1(-h * .05)}" stroke="${green ? lt(c, .4) : dk(c, .1)}" stroke-width=".7" opacity=".8"/>
        <path d="M${f1(-s * .38)},${f1(-h * .3)} L${f1(s * .22)},${f1(-h * .3)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".75"/></g>`;
}
// 赤唐辛子の斜め切り（輪と種）
function xtwChiliRing(p, x, y, s, r = 0, { c = '#d42a1c' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .34)}" fill="${p.g(c, .25, .25)}" stroke="${dk(c, .35)}" stroke-width=".5"/><ellipse rx="${f1(s * .32)}" ry="${f1(s * .19)}" fill="${lt(c, .5)}"/><circle cx="${f1(-s * .08)}" cy="0" r="${f1(s * .07)}" fill="#f6eec8"/><circle cx="${f1(s * .1)}" cy="${f1(s * .04)}" r="${f1(s * .07)}" fill="#f6eec8"/></g>`;
}
// 九層塔の葉（先のとがった濃い緑、葉脈）
function xtwBasil(p, x, y, s, r = 0, { c = '#2f6e2a' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,0 Q-7,-5.5 -1,-6.4 Q6,-6.4 10,0 Q6,6.4 -1,6.4 Q-7,5.5 -10,0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M-9,0 L9,0 M-4,-.3 Q-2,-3 0,-4.6 M1,-.3 Q3,-3 5,-4 M-4,.3 Q-2,3 0,4.6 M1,.3 Q3,3 5,4" stroke="${lt(c, .4)}" stroke-width=".7" fill="none" stroke-linecap="round"/>
        <path d="M-11.5,0 L-9,0" stroke="#7a4a6a" stroke-width="1" stroke-linecap="round"/>
        <path d="M-6,-2.4 Q-2,-4.6 3,-4" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// にんにく（丸ごと1片、揚げ色）
function xtwGarlic(p, x, y, s, r = 0, { c = '#e6c078' } = {}){
    return `<g ${T(x, y, r, s / 12)}><g ${p.sh(.5)}><path d="M-5,3 Q-6.4,-2 -2.4,-5 Q0,-7.2 2.4,-5 Q6.4,-2 5,3 Q0,6.2 -5,3Z" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="M-3,1 Q-2.4,-2 -.4,-3.8" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".75"/><path d="M0,-7 L0,-5.2" stroke="${dk(c, .5)}" stroke-width=".8"/></g>`;
}
// しょうがの薄切り（淡い黄色、縁に茶の皮）
function xtwGinger(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.4)}><path d="M${f1(-s / 2)},0 Q${f1(-s * .4)},${f1(-s * .3)} ${f1(-s * .1)},${f1(-s * .32)} Q${f1(s * .35)},${f1(-s * .34)} ${f1(s / 2)},${f1(-s * .05)} Q${f1(s * .4)},${f1(s * .3)} ${f1(s * .05)},${f1(s * .32)} Q${f1(-s * .35)},${f1(s * .3)} ${f1(-s / 2)},0Z" fill="${p.g('#f0dc9a', .3, .2)}" stroke="#b88a3c" stroke-width="1"/></g>
        <path d="M${f1(-s * .3)},${f1(-s * .05)} Q0,${f1(-s * .14)} ${f1(s * .3)},${f1(-s * .02)}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 骨つき鶏のぶつ切り（濃いたれをまとった身、のぞく骨）
function xtwChickenBone(p, x, y, s, r = 0, { c = '#9a4a1c', seed = 1, bone = true } = {}){
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
function xtwLuRou(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'twlr' + seed + x + y);
    const body = xtwSmooth(ring(L / 2, 7, .35, R, 1, w / L), .8);
    return `<g ${T(x, y, r)}><path d="${body}" fill="${p.g(R() < .5 ? '#7a3412' : '#8e4418', .3, .35)}" stroke="#3e1a06" stroke-width=".6"/>
        <path d="M${f1(-L * .38)},${f1(-w * .08)} Q0,${f1(-w * .2)} ${f1(L * .36)},${f1(-w * .04)}" stroke="#e2b07a" stroke-width="${f1(w * .26)}" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M${f1(-L * .3)},${f1(-w * .3)} L${f1(L * .2)},${f1(-w * .32)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".75"/></g>`;
}
// 滷蛋（たれ色に染まった煮卵の半分）
function xtwLuEgg(p, x, y, s, r = 0){
    const rx = s / 2, ry = s * .4;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${rx}" ry="${f1(ry)}" fill="${p.g('#b06a28', .2, .3)}" stroke="#6e3a0c" stroke-width=".7"/></g>
        <ellipse rx="${f1(rx - 2.4)}" ry="${f1(ry - 2.2)}" fill="${p.rg('#f3dcb0', .2, .12)}"/>
        <circle cx="${f1(rx * .05)}" cy="${f1(ry * .05)}" r="${f1(ry * .52)}" fill="${p.rg('#f2a62a', .3, .22, .38, .35)}" stroke="#c97b14" stroke-width=".5"/>
        <ellipse cx="${f1(-rx * .12)}" cy="${f1(-ry * .14)}" rx="${f1(ry * .18)}" ry="${f1(ry * .1)}" fill="#fff" opacity=".7"/></g>`;
}
// 滷蛋（丸ごと）
function xtwLuEggWhole(p, x, y, s, r = 0){
    const rx = s / 2, ry = s * .4;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><ellipse rx="${rx}" ry="${f1(ry)}" fill="${p.g('#c07a32', .3, .3)}" stroke="#7a420f" stroke-width=".7"/></g>
        <ellipse cx="${f1(-rx * .25)}" cy="${f1(-ry * .3)}" rx="${f1(rx * .42)}" ry="${f1(ry * .26)}" fill="#f2c88a" opacity=".5"/>
        <ellipse cx="${f1(-rx * .32)}" cy="${f1(-ry * .4)}" rx="${f1(rx * .2)}" ry="${f1(ry * .1)}" fill="#fff" opacity=".85"/></g>`;
}
// 黄色いたくあん（半月）
function xtwPickledRadish(p, x, y, s, r = 0){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,2 A10,9 0 0 1 10,2 Z" fill="${p.g('#f2c93a', .3, .25)}" stroke="#c79a18" stroke-width=".6"/></g><path d="M-7.6,2 A7.6,6.8 0 0 1 7.6,2" stroke="#fbe27a" stroke-width="1" fill="none" opacity=".8"/></g>`;
}
// 豆干の薄切り（茶色い皮、淡い断面）
function xtwDougan(p, x, y, w, h, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="2.4" fill="#5a3010"/></g>
        <rect x="${f1(-w / 2 + 2.2)}" y="${f1(-h / 2 + 2.2)}" width="${f1(w - 4.4)}" height="${f1(h - 4.4)}" rx="1.6" fill="${p.rg('#d9b07a', .2, .25)}"/>
        <rect x="${f1(-w / 2 + 2.2)}" y="${f1(-h / 2 + 2.2)}" width="${f1(w - 4.4)}" height="${f1(h - 4.4)}" rx="1.6" fill="none" stroke="#a8682e" stroke-width="1.4" opacity=".6"/>
        <path d="M${f1(-w * .3)},${f1(-h * .28)} L${f1(w * .2)},${f1(-h * .28)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 海帯結（昆布の結び目）
function xtwKelpKnot(p, x, y, s, r = 0){
    const k = s / 20, c = '#2d5a2a';
    const rib = (d) => `<path d="${d}" stroke="${dk(c, .4)}" stroke-width="6.4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${p.g(c, .3, .25)}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${lt(c, .3)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".55" transform="translate(-.6 -1)"/>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${rib('M-13,4 Q-6,-4 0,-2')}${rib('M13,-5 Q5,4 0,1')}${rib('M-5,-6 Q6,-7 6,0 Q6,7 -5,5 Q-9,0 -5,-6')}</g></g>`;
}
// とうもろこしの輪切り（横から: 粒の並び、端に芯の断面）
function xtwCorn(p, x, y, w, h, r = 0, { seed = 1 } = {}){
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
function xtwRib(p, x, y, s, r = 0, { c = '#a87556', seed = 1 } = {}){
    const R = rng(p.id + 'xtwRb' + seed + x + y);
    const w = s, h = s * .62, j = () => (R() - .5) * s * .08;
    const pts = [[-w / 2 + j(), -h / 2 + j()], [0, -h / 2 - 1 + j()], [w / 2 + j(), -h / 2 + j()], [w / 2 + 1, 0], [w / 2 + j(), h / 2 + j()], [0, h / 2 + 1 + j()], [-w / 2 + j(), h / 2 + j()], [-w / 2 - 1, 0]];
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xtwSmooth(pts, .6)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="M${f1(-w * .3)},${f1(-h * .05)} Q${f1(-w * .05)},${f1(-h * .2)} ${f1(w * .2)},${f1(-h * .05)} M${f1(-w * .25)},${f1(h * .22)} Q0,${f1(h * .1)} ${f1(w * .22)},${f1(h * .24)}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".55"/>
        <rect x="${f1(-w * .62)}" y="${f1(-h * .22)}" width="${f1(w * .2)}" height="${f1(h * .44)}" rx="${f1(h * .2)}" fill="${p.g('#f2e8d4', .3, .2)}" stroke="#bfae90" stroke-width=".7"/>
        <ellipse cx="${f1(-w * .58)}" cy="0" rx="${f1(w * .05)}" ry="${f1(h * .12)}" fill="#d4a88a"/>
        <path d="M${f1(-w * .32)},${f1(-h * .32)} Q${f1(-w * .05)},${f1(-h * .48)} ${f1(w * .26)},${f1(-h * .36)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 魚丸（白い丸）
function xtwFishBall(p, x, y, s){
    return `<g ${p.sh(.8)}><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s / 2)}" fill="${p.rg('#f3efe3', .14, .22, .36, .34)}" stroke="#c9bda6" stroke-width=".7"/></g>
        <ellipse cx="${f1(x - s * .18)}" cy="${f1(y - s * .2)}" rx="${f1(s * .17)}" ry="${f1(s * .1)}" fill="#fff" opacity=".8"/>`;
}
// 炒めた高麗菜（手でちぎった大きめの葉、太い白い葉脈、つや）
function xtwCabbage(p, x, y, s, r = 0, { seed = 1, c = '#c3dc8e' } = {}){
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
function xtwSPLeaf(p, x, y, s, r = 0, { c = '#2c6a28' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M0,-7.5 Q4,-11 8,-8 Q12,-4 8,2 Q4,7 0,10 Q-4,7 -8,2 Q-12,-4 -8,-8 Q-4,-11 0,-7.5Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M0,-6 L0,8 M0,-2 L-5,-5 M0,-2 L5,-5 M0,2 L-5,3 M0,2 L5,3" stroke="${lt(c, .4)}" stroke-width=".7" fill="none" stroke-linecap="round"/>
        <path d="M0,-7 L0,-13" stroke="#7fb050" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M-6,-6 Q-3,-8.4 1,-7" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// 細い茎（地瓜葉・芹菜）
function xtwStick(p, x, y, L, w, r, c, { gloss = .5 } = {}){
    return `<g ${T(x, y, r)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${f1(L)}" height="${f1(w)}" rx="${f1(w * .4)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/>`
        + (gloss ? `<path d="M${f1(-L / 2 + w * .7)},${f1(-w * .2)} L${f1(L / 2 - w)},${f1(-w * .2)}" stroke="#fff" stroke-width="${f1(w * .24)}" stroke-linecap="round" opacity="${gloss}"/>` : '') + `</g>`;
}
// 白玉苦瓜の薄切り（半月: でこぼこの縁、淡い緑白）
function xtwKugua(p, x, y, s, r = 0, { c = '#c9dfa6' } = {}){
    return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}><path d="M-10,2 A10,8.6 0 0 1 10,2 Q8,3.2 5.4,2 A5.4,4 0 0 0 -5.4,2 Q-8,3.2 -10,2Z" fill="${p.g(c, .3, .22)}" stroke="${dk(c, .32)}" stroke-width=".6"/></g>
        <path d="M-6,-3.4 Q-2,-6 3,-5.4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M-8,0 Q-5,-4 0,-5" stroke="#f0b63a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 茄子の棒切り（皮は紫、断面はやわらかな飴色、つや）
function xtwEggplantBaton(p, x, y, L, w, r = 0, { seed = 1, skinUp = true } = {}){
    const R = rng(p.id + 'tweb' + seed + x + y);
    const body = xtwSmooth([[-L / 2, -w / 2], [-L * .2, -w / 2 - 1], [L * .2, -w / 2 - .6], [L / 2, -w / 2], [L / 2 + 1, 0], [L / 2, w / 2], [L * .2, w / 2 + .8], [-L * .2, w / 2 + .6], [-L / 2, w / 2], [-L / 2 - 1, 0]].map(([a, b]) => [a + (R() - .5) * 1.4, b + (R() - .5) * 1.4]), .6);
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
function xtwCaipuDan(p, x, y, s, { cuts = 6, seed = 1 } = {}){
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
function xtwMilkfish(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'twmf' + seed + x);
    const h = L * .36;
    const body = xtwSmooth([[-L / 2, 0], [-L * .36, -h * .36], [-L * .12, -h * .5], [L * .14, -h * .48], [L * .36, -h * .32], [L / 2, 0], [L * .36, h * .32], [L * .14, h * .48], [-L * .12, h * .5], [-L * .36, h * .36]], .9);
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
const xtwPorkShreds = (p, x, y, s, o = {}) => xtwStrips(p, x, y, s, { c: '#cfa07a', n: 14, w: 3.6, len: .26, gloss: .4, ...o });


// =========================================================
// x_tw で足した部品（xtw で始まる）
// =========================================================
// 小吃の白いメラミン碗（縁に赤の太線、福の丸紋）
function xtwStallBowl(p, { R = 92, c = '#c8332a', lip = .85, inside = '#fbfaf5' } = {}){
    const r = R * lip, rm = (R - 6 + r) / 2, rs = (R - 6 - r) * .3;
    let mk = '';
    for (let i = 0; i < 5; i++){ const a = .4 + i / 5 * 6.28, x = 100 + Math.cos(a) * rm, y = 100 + Math.sin(a) * rm; mk += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rs)}" fill="none" stroke="${c}" stroke-width="1.1"/><path d="M${f1(x - rs * .5)},${f1(y)} h${f1(rs)} M${f1(x)},${f1(y - rs * .5)} v${f1(rs)}" stroke="${c}" stroke-width=".9"/>`; }
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#fbfaf6', .2, .16, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${f1(R - 2.6)}" fill="none" stroke="${c}" stroke-width="3.6"/>
        <circle cx="100" cy="100" r="${f1(R - 6.4)}" fill="none" stroke="${c}" stroke-width=".7" opacity=".8"/>${mk}
        <circle cx="100" cy="100" r="${f1(r + 1.2)}" fill="none" stroke="${c}" stroke-width=".8" opacity=".7"/>
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg(inside, .12, .22, .64, .66)}"/>
        <path d="M${f1(100 - R * .7)},${f1(100 - R * .42)} A${f1(R * .82)},${f1(R * .82)} 0 0 1 ${f1(100 - R * .25)},${f1(100 - R * .78)}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// ステンレスの碗・皿（自助餐・便当屋の器）
function xtwSteel(p, { R = 92, lip = .9 } = {}){
    const r = R * lip;
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#cfd3d6', .35, .38, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${f1(R - 1.6)}" fill="none" stroke="#f4f6f7" stroke-width="1.6"/>
        <circle cx="100" cy="100" r="${f1(r)}" fill="${p.rg('#b4b9bd', .4, .32, .62, .64)}"/>
        <circle cx="100" cy="100" r="${f1(r * .72)}" fill="none" stroke="#e2e5e7" stroke-width="3" opacity=".45"/>
        <path d="M${f1(100 - R * .74)},${f1(100 - R * .4)} A${f1(R * .84)},${f1(R * .84)} 0 0 1 ${f1(100 - R * .26)},${f1(100 - R * .79)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
// 白い皿（縁に色の二重線と点の輪）。花柄の皿と並べて単調にならないように
function xtwRimPlate(p, { R = 94, well = .74, line = '#3d7a52', dots = true } = {}){
    const w = R * well, base = '#fbfbf7';
    const dd = dots ? Array.from({ length: 30 }, (_, i) => { const a = i / 30 * 6.28; return `<circle cx="${f1(100 + Math.cos(a) * (R - 9))}" cy="${f1(100 + Math.sin(a) * (R - 9))}" r="1.3" fill="${line}" opacity=".8"/>`; }).join('') : '';
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(base, .2, .1, .38, .32)}"/></g>
        <circle cx="100" cy="100" r="${R - 3}" fill="none" stroke="${line}" stroke-width="2.2"/>${dd}
        <circle cx="100" cy="100" r="${f1(w + 3)}" fill="none" stroke="${line}" stroke-width=".8" opacity=".7"/>
        <circle cx="100" cy="100" r="${f1(w + 1)}" fill="none" stroke="${dk(base, .08)}" stroke-width="2.4" opacity=".45"/>
        <circle cx="100" cy="100" r="${f1(w)}" fill="${p.rg(base, .1, .07, .62, .64)}"/>
        <path d="M${f1(100 - R * .72)},${f1(100 - R * .4)} A${f1(R * .86)},${f1(R * .86)} 0 0 1 ${f1(100 - R * .2)},${f1(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
// 汁の面（器の内側いっぱい）+ 具の上にかける汁の膜
const xtwVeil = (R, c, op) => `<circle cx="100" cy="100" r="${R}" fill="${c}" opacity="${op}"/>`;
// 殻つきのえび（頭・節のある太いC字の胴・扇の尾・短いひげ）。s は差し渡しのめやす
function xtwShrimpShell(p, x, y, s, r = 0, { c = '#e8603a', seed = 1 } = {}){
    const k = s / 40, P = (a, rr) => [Math.cos(a / 57.3) * rr, Math.sin(a / 57.3) * rr];
    const a0 = 170, a1 = -55, Ro = 16, Ri = 8;
    const outer = [], inner = [];
    for (let i = 0; i <= 8; i++){ const a = a0 + (a1 - a0) * i / 8, t = i / 8; outer.push(P(a, Ro - t * 2)); inner.unshift(P(a, Ri + t * 2)); }
    const body = smooth([...outer, ...inner], true, .8);
    let segs = '';
    for (let i = 1; i <= 5; i++){ const a = a0 + (a1 - a0) * i / 6.2, [ox, oy] = P(a, Ro - i * .5), [ix, iy] = P(a, Ri + i * .5); segs += `M${f1(ox)},${f1(oy)} Q${f1((ox + ix) / 2 + Math.cos(a / 57.3 + 1.57) * 2)},${f1((oy + iy) / 2 + Math.sin(a / 57.3 + 1.57) * 2)} ${f1(ix)},${f1(iy)}`; }
    const [tx, ty] = P(a1, 12);
    const tail = [-28, 0, 28].map(d => `<path transform="translate(${f1(tx)} ${f1(ty)}) rotate(${a1 + d})" d="M0,0 Q-4,6 0,13 Q4,6 0,0Z" fill="${dk(c, .12)}" stroke="${dk(c, .4)}" stroke-width=".5"/>`).join('');
    const [hx, hy] = P(a0 + 6, 12);
    const head = `<g transform="translate(${f1(hx)} ${f1(hy)}) rotate(${a0 + 6 - 90})"><path d="M-8,0 Q-8,-11 0,-15 Q8,-11 8,0 Q6,5 0,5 Q-6,5 -8,0Z" fill="${p.g(lt(c, .04), .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>
        <path d="M0,-15 L0,-21" stroke="${dk(c, .2)}" stroke-width="1.6" stroke-linecap="round"/><circle cx="-5" cy="-12" r="1.6" fill="#2a1406"/><circle cx="5" cy="-12" r="1.6" fill="#2a1406"/>
        <path d="M-4,-7 Q0,-9.5 4,-7" stroke="${dk(c, .3)}" stroke-width=".7" fill="none" opacity=".6"/>
        <path d="M-2,-18 Q-8,-23 -7,-29 M2,-18 Q8,-22 8,-28" stroke="${dk(c, .15)}" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
    let legs = '';
    for (let i = 1; i <= 4; i++){ const a = a0 + (a1 - a0) * i / 6, [ix, iy] = P(a, Ri + 1); legs += `<path d="M${f1(ix)},${f1(iy)} l${f1(-Math.cos(a / 57.3) * 3.5)},${f1(-Math.sin(a / 57.3) * 3.5)}" stroke="${lt(c, .15)}" stroke-width="1.1" stroke-linecap="round"/>`; }
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}>${tail}${legs}<path d="${body}" fill="${p.g(c, .32, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/>${head}</g>
        <path d="${segs}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".7"/>
        <path d="${smooth(outer.slice(1, 6).map(([a, b]) => [a * .86, b * .86]), false)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// むき身の牡蠣（クリーム色のふくらみ、黒灰色のひだの縁）
function xtwOyster(p, x, y, s, r = 0, { seed = 1, coat = false } = {}){
    const R = rng(p.id + 'xoy' + seed + x + y), k = s / 20;
    const pts = ring(9.5, 9, .25, R, 1.3, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><g ${p.rough(1.6, .35)}><path d="${smooth(pts, true, .9)}" fill="${p.g(coat ? '#a8a094' : '#5c5448', .2, .3)}"/></g></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .78 - .8, b * .74 - .6]), true, .9)}" fill="${p.g(coat ? '#f8f4ea' : '#d2bc94', .3, .2)}" stroke="#a89a80" stroke-width=".5"/>
        <path d="M${f1(-7)},2 Q0,4.6 7,1.4" stroke="#a89a86" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-6,-2.4 Q-2,-5.4 3,-4.6" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// 鶏の骨つきもも（ドラムスティック）
function xtwDrum(p, x, y, s, r = 0, { c = '#8a4418', seed = 1 } = {}){
    const k = s / 44, R = rng(p.id + 'xdr' + seed + x);
    const body = smooth([[-21, 0], [-19, -9], [-10, -13], [0, -10], [8, -5], [13, -3.4], [13, 3.4], [8, 5], [0, 10], [-10, 13], [-19, 9]], true, .9);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}><rect x="11" y="-3" width="9" height="6" rx="2.6" fill="${p.g('#efe2c6', .3, .2)}" stroke="#bfa880" stroke-width=".6"/><circle cx="21" cy="-2.6" r="3.2" fill="#f5ebd6" stroke="#bfa880" stroke-width=".6"/><circle cx="21" cy="2.6" r="3.2" fill="#f5ebd6" stroke="#bfa880" stroke-width=".6"/>
        <path d="${body}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        <path d="M-16,4 Q-6,10 6,5" stroke="${dk(c, .4)}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M-15,-6 Q-8,-10.5 1,-8" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/><path d="M4,-5 Q8,-4 11,-3" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5"/>
        <circle cx="${f1(-8 + R() * 6)}" cy="${f1(-2 + R() * 4)}" r="1.4" fill="#fff" opacity=".5"/></g>`;
}
// 一尾の蒸し魚・煎魚（横向き: 頭・ひれ・尾、身に切り込み）
function xtwFish(p, x, y, L, r = 0, { skin = '#8f948a', belly = '#e6e2d4', cuts = 3, cooked = true } = {}){
    const h = L * .42, gid = p.def('xtwfish' + skin, id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dk(skin, .25)}"/><stop offset=".45" stop-color="${skin}"/><stop offset="1" stop-color="${belly}"/></linearGradient>`);
    const body = smooth([[-L * .5, h * .02], [-L * .43, -h * .3], [-L * .26, -h * .47], [0, -h * .5], [L * .2, -h * .36], [L * .33, -h * .15], [L * .33, h * .15], [L * .2, h * .34], [0, h * .47], [-L * .26, h * .43], [-L * .43, h * .27]], true, .9);
    let sl = '';
    for (let i = 0; i < cuts; i++){ const sx = -L * .1 + i * L * .12; sl += `<path d="M${f1(sx)},${f1(-h * .4)} Q${f1(sx + L * .05)},${f1(-h * .05)} ${f1(sx - L * .01)},${f1(h * .3)}" stroke="${dk(skin, .3)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/><path d="M${f1(sx + .8)},${f1(-h * .38)} Q${f1(sx + L * .05 + .8)},${f1(-h * .05)} ${f1(sx)},${f1(h * .28)}" stroke="#f6f0e2" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.2)}>
        <path d="M${f1(L * .3)},${f1(-h * .1)} L${f1(L * .5)},${f1(-h * .5)} Q${f1(L * .44)},0 ${f1(L * .5)},${f1(h * .5)} L${f1(L * .3)},${f1(h * .1)}Z" fill="${p.g(dk(skin, .1), .2, .3)}" stroke="${dk(skin, .4)}" stroke-width=".7"/>
        <path d="M${f1(-L * .2)},${f1(-h * .46)} Q${f1(L * .02)},${f1(-h * .8)} ${f1(L * .26)},${f1(-h * .3)} L${f1(L * .18)},${f1(-h * .36)} Q0,${f1(-h * .5)} ${f1(-L * .2)},${f1(-h * .46)}Z" fill="${dk(skin, .15)}" stroke="${dk(skin, .4)}" stroke-width=".6"/>
        <path d="M${f1(-L * .02)},${f1(h * .46)} Q${f1(L * .12)},${f1(h * .7)} ${f1(L * .22)},${f1(h * .33)}Z" fill="${dk(skin, .1)}" stroke="${dk(skin, .4)}" stroke-width=".6"/>
        <path d="${body}" fill="url(#${gid})" stroke="${dk(skin, .45)}" stroke-width=".9"/></g>
        <path d="M${f1(L * .34)},${f1(-h * .1)} L${f1(L * .47)},${f1(-h * .4)} M${f1(L * .35)},0 L${f1(L * .46)},0 M${f1(L * .34)},${f1(h * .1)} L${f1(L * .47)},${f1(h * .4)}" stroke="${dk(skin, .35)}" stroke-width=".7" opacity=".6"/>
        <path d="M${f1(-L * .27)},${f1(-h * .4)} Q${f1(-L * .2)},0 ${f1(-L * .28)},${f1(h * .36)}" stroke="${dk(skin, .4)}" stroke-width="1.2" fill="none" opacity=".7"/>
        <path d="M${f1(-L * .22)},${f1(h * .05)} Q${f1(-L * .14)},${f1(h * .12)} ${f1(-L * .1)},${f1(h * .24)}" stroke="${dk(skin, .3)}" stroke-width="1" fill="none" opacity=".5"/>
        <circle cx="${f1(-L * .39)}" cy="${f1(-h * .1)}" r="${f1(h * .1)}" fill="${cooked ? '#f2efe6' : '#e8e2d0'}" stroke="${dk(skin, .4)}" stroke-width=".8"/><circle cx="${f1(-L * .39)}" cy="${f1(-h * .1)}" r="${f1(h * .045)}" fill="${cooked ? '#9a948a' : '#222'}"/>
        ${sl}
        <path d="M${f1(-L * .3)},${f1(-h * .34)} Q${f1(-L * .05)},${f1(-h * .5)} ${f1(L * .2)},${f1(-h * .3)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 白帯魚の筒切りを焼いたもの（銀の皮にこんがりした焼き色、ぎざぎざの背びれ）
function xtwHairtail(p, x, y, L, w, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xht' + seed + x + y);
    const body = smooth([[-L / 2, -w * .44], [0, -w * .5], [L / 2, -w * .4], [L / 2 + .5, 0], [L / 2, w * .44], [0, w * .5], [-L / 2, w * .46], [-L / 2 - .5, 0]], true, .4);
    const gid = p.def('xtwht', id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b07a36"/><stop offset=".3" stop-color="#d9a858"/><stop offset=".55" stop-color="#ead4a4"/><stop offset=".8" stop-color="#d4a660"/><stop offset="1" stop-color="#a87034"/></linearGradient>`);
    let ch = '', sil = '';
    for (let i = 0; i < 8; i++){ const cx = -L * .42 + R() * L * .84, cy = (R() - .5) * w * .6; ch += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(4 + R() * 6)}" ry="${f1(2 + R() * 2.6)}" fill="${R() < .5 ? '#a8661e' : '#8a4e16'}" opacity="${f1(.35 + R() * .35)}"/>`; }
    for (let i = 0; i < 5; i++){ const cx = -L * .4 + R() * L * .8, cy = (R() - .3) * w * .5; sil += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(3 + R() * 5)}" ry="${f1(1.2 + R() * 1.4)}" fill="#f2f2ee" opacity=".55"/>`; }
    const n = Math.round(L / 3.2);
    let fin = `M${f1(-L / 2 + 1)},${f1(-w * .44)}`;
    for (let i = 1; i <= n; i++) fin += ` L${f1(-L / 2 + 1 + (i - .5) * (L - 2) / n)},${f1(-w * .62)} L${f1(-L / 2 + 1 + i * (L - 2) / n)},${f1(-w * .45)}`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${fin}Z" fill="#9a6a30" stroke="#6e4818" stroke-width=".5"/><path d="${body}" fill="url(#${gid})" stroke="#7a5426" stroke-width=".8"/></g>
        ${ch}${sil}
        <path d="M${f1(-L / 2 + 2)},${f1(w * .06)} L${f1(L / 2 - 2)},${f1(w * .03)}" stroke="#8a6030" stroke-width=".8" opacity=".5"/>
        <path d="M${f1(-L * .36)},${f1(-w * .22)} L${f1(L * .3)},${f1(-w * .26)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/></g>`;
}
// 台湾の香腸（つやのある赤い腸詰め、焼き目）と、その斜め切り
function xtwSausage(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xsg' + seed + x), w = L * .27;
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f1(-L * .35 + R() * L * .7)}" cy="${f1((R() - .2) * w * .4)}" rx="${f1(2 + R() * 3)}" ry="${f1(1.2 + R() * 1.4)}" fill="#4a120c" opacity="${f1(.3 + R() * .3)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${f1(L)}" height="${f1(w)}" rx="${f1(w / 2)}" fill="${p.g('#b8342a', .3, .32)}" stroke="#6e1a12" stroke-width=".8"/></g>
        ${Array.from({ length: 6 }, () => `<circle cx="${f1(-L * .4 + R() * L * .8)}" cy="${f1((R() - .5) * w * .5)}" r="${f1(.7 + R() * .6)}" fill="#f2c8b0" opacity=".55"/>`).join('')}${ch}
        <path d="M${f1(-L / 2)},0 l-2,-1.6 M${f1(-L / 2)},0 l-2,1.6" stroke="#e6d6b0" stroke-width=".8"/>
        <path d="M${f1(-L * .38)},${f1(-w * .22)} L${f1(L * .34)},${f1(-w * .24)}" stroke="#fff" stroke-width="${f1(w * .16)}" stroke-linecap="round" opacity=".6"/></g>`;
}
function xtwSausageSlice(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xss' + seed + x + y);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="#8e2218" stroke="#5e140c" stroke-width=".6"/></g>
        <ellipse cx="-.4" cy="-.3" rx="${f1(s / 2 - 1.6)}" ry="${f1(s * .38 - 1.6)}" fill="${p.rg('#d0584e', .25, .2)}"/>
        ${Array.from({ length: 6 }, () => `<ellipse cx="${f1((R() - .5) * s * .6)}" cy="${f1((R() - .5) * s * .42)}" rx="${f1(.8 + R() * .8)}" ry="${f1(.6 + R() * .5)}" fill="#f6dcd0" opacity=".85"/>`).join('')}
        <path d="M${f1(-s * .3)},${f1(-s * .18)} Q${f1(-s * .1)},${f1(-s * .3)} ${f1(s * .14)},${f1(-s * .26)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 生にんにく（皮をむいた白い1片）
function xtwRawGarlic(p, x, y, s, r = 0){ return `<g ${T(x, y, r, s / 12)}><g ${p.sh(.4)}><path d="M-5,3 Q-6.4,-2 -2.4,-5 Q0,-7.2 2.4,-5 Q6.4,-2 5,3 Q0,6.2 -5,3Z" fill="${p.g('#f7f3e6', .3, .18)}" stroke="#cfc4a6" stroke-width=".6"/></g><path d="M-3,1 Q-2.4,-2 -.4,-3.8" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M0,-7 L0,-5.2" stroke="#c8b47a" stroke-width=".8"/></g>`; }
// にんにくの薄切り
function xtwGarlicSlice(p, x, y, s, r = 0, { c = '#f6efd8' } = {}){ return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .36)}" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".5"/><ellipse rx="${f1(s * .2)}" ry="${f1(s * .12)}" fill="${dk(c, .08)}"/></g>`; }
// 揚げ物の大きな1枚（炸排骨: さつまいも粉の白い粒が残るごつごつの衣）
function xtwChop(p, x, y, w, h, r = 0, { c = '#c98a36', seed = 1 } = {}){
    const R = rng(p.id + 'xch' + seed);
    const pts = ring(w / 2, 16, .12, R, 1, h / w);
    const inE = () => { const a = R() * 6.28, d = Math.sqrt(R()) * .86; return [Math.cos(a) * d * w / 2, Math.sin(a) * d * h / 2]; };
    let lump = '', lumpD = '', fl = '', cr = '';
    for (let i = 0; i < 34; i++){ const [fx, fy] = inE(), rr = 3 + R() * 4; lump += `M${f1(fx - rr)},${f1(fy)}a${f1(rr)},${f1(rr * .8)} 0 1 1 ${f1(rr * 2)},0a${f1(rr)},${f1(rr * .8)} 0 1 1 ${f1(-rr * 2)},0`; lumpD += `M${f1(fx - rr * .6)},${f1(fy + rr * .55)}q${f1(rr * .6)},${f1(rr * .4)} ${f1(rr * 1.3)},${f1(-rr * .1)}`; }
    for (let i = 0; i < 40; i++){ const [fx, fy] = inE(), rr = .7 + R() * 1.2; fl += `M${f1(fx - rr)},${f1(fy)}l${f1(rr)},${f1(-rr)}l${f1(rr)},${f1(rr)}l${f1(-rr)},${f1(rr * .8)}Z`; }
    for (let i = 0; i < 14; i++){ const [fx, fy] = inE(); cr += `M${f1(fx)},${f1(fy)}q${f1((R() - .5) * 8)},${f1((R() - .5) * 6)} ${f1((R() - .5) * 10)},${f1((R() - .5) * 8)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.4)}><g ${p.rough(3, .1)}><path d="${smooth(pts, true, .9)}" fill="${p.g(c, .3, .4)}" stroke="${dk(c, .45)}" stroke-width=".9"/></g></g>
        <g ${p.crumb(.5)}><path d="${smooth(pts.map(([a, b]) => [a * .9, b * .88]), true, .9)}" fill="${lt(c, .1)}"/></g>
        <path d="${lump}" fill="${lt(c, .22)}" opacity=".55"/><path d="${lumpD}" stroke="${dk(c, .4)}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".45"/>
        <path d="${cr}" stroke="${dk(c, .5)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="${fl}" fill="#fbefd2" opacity=".8"/>
        <path d="M${f1(-w * .32)},${f1(-h * .22)} Q${f1(-w * .12)},${f1(-h * .42)} ${f1(w * .18)},${f1(-h * .38)}" stroke="#fff3d8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 揚げたひと口の塊（鹽酥雞・鹽酥杏鮑菇）: でこぼこの縁、こぶ、衣のざらつき、照り
function xtwNugget(p, x, y, s, r = 0, { c = '#cf8a34', seed = 1, cut = null } = {}){
    const R = rng(p.id + 'xng' + seed + x + y), k = s / 20;
    const pts = ring(9.5, 10, .3, R, 1.15, .9);
    let lumps = '';
    for (let i = 0; i < 4; i++){ const a = i * 1.6 + R(), d = 3 + R() * 2.5, rr = 3.2 + R() * 1.4; lumps += `<ellipse cx="${f1(Math.cos(a) * d - 1)}" cy="${f1(Math.sin(a) * d - 1)}" rx="${f1(rr * 1.1)}" ry="${f1(rr)}" fill="${p.rg(lt(c, .1), .35, .2, .35, .3)}"/>`; }
    return `<g ${T(x, y, r, k)}><g ${p.rough(1.8, .22)}><path d="${smooth(pts, true, .9)}" fill="${p.g(dk(c, .12), .2, .4)}" stroke="${dk(c, .5)}" stroke-width=".7"/></g>
        <g ${p.crumb(.9)}>${lumps}</g>
        ${cut ? `<path d="${smooth(pts.map(([a, b]) => [a * .42 + 2, b * .38 + 2.4]), true, .9)}" fill="${cut}" stroke="${dk(cut, .2)}" stroke-width=".5"/>` : ''}
        <path d="M-6.5,-4 Q-3,-7 1.5,-6.4" stroke="#fff3d8" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/><circle cx="3.5" cy="-3" r=".9" fill="#fff" opacity=".8"/></g>`;
}
// 揚げた九層塔（濃い緑が透けてちりっとした葉）
function xtwFriedBasil(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><path d="M-10,0 Q-7,-5.5 -1,-6.4 Q6,-6.4 10,0 Q6,6.4 -1,6.4 Q-7,5.5 -10,0Z" fill="#1f4a22" opacity=".9" stroke="#14301a" stroke-width=".6"/><path d="M-9,0 L9,0" stroke="#3f7a3a" stroke-width=".8"/><path d="M-5,-2.6 Q0,-4.8 5,-3.4" stroke="#7fb06a" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 立方体の揚げ豆腐・焼き豆腐（上面と側面）
function xtwTofuCube(p, x, y, s, r = 0, { c = '#e2a446', face = '#f0c470', crumb = true } = {}){
    const h = s * .2;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><rect x="${f1(-s / 2)}" y="${f1(-s / 2)}" width="${f1(s)}" height="${f1(s + h)}" rx="${f1(s * .2)}" fill="${p.g(dk(c, .12), .2, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <g ${crumb ? p.crumb(.8) : ''}><rect x="${f1(-s / 2 + .8)}" y="${f1(-s / 2 + .8)}" width="${f1(s - 1.6)}" height="${f1(s - 1.6)}" rx="${f1(s * .18)}" fill="${p.g(face, .3, .25)}"/></g>
        <path d="M${f1(-s * .32)},${f1(-s * .3)} L${f1(s * .2)},${f1(-s * .32)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`;
}
// 苦瓜の大きなかけら（緑のこぶの皮、白いわた側）
function xtwBitter(p, x, y, s, r = 0, { c = '#6aa83e' } = {}){
    const k = s / 24;
    let bumps = '';
    for (let i = 0; i < 7; i++){ const bx = -9 + i * 3, by = -6.5 + Math.sin(i * 1.3) * .8; bumps += `<ellipse cx="${bx}" cy="${f1(by)}" rx="1.6" ry="2.2" fill="${lt(c, .25)}" opacity=".9"/>`; }
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="M-12,-6 Q-12,-10 -8,-10 L8,-10 Q12,-10 12,-6 L12,6 Q12,9 8,9 L-8,9 Q-12,9 -12,6Z" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="M-10,3 Q0,6 10,3 L10,7 Q0,9 -10,7Z" fill="${p.g('#eef2d6', .2, .15)}"/>${bumps}
        <path d="M-10,-1 Q0,1 10,-1" stroke="${dk(c, .2)}" stroke-width="1" fill="none" opacity=".6"/>
        <path d="M-8,-8.6 L6,-8.6" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/></g>`;
}
// 鳳梨（醤鳳梨のかけら、黄金色の扇形）
function xtwPineapple(p, x, y, s, r = 0, { c = '#e8b43a' } = {}){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M0,8 L-8,-6 A11,11 0 0 1 8,-6 Z" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <path d="M0,7 L-4,-6 M0,7 L0,-8 M0,7 L4,-6" stroke="${lt(c, .35)}" stroke-width=".8" opacity=".8"/><path d="M-6,-6 A10,10 0 0 1 6,-6" stroke="${dk(c, .2)}" stroke-width="1.4" fill="none" opacity=".6"/></g>`;
}
// 剝皮辣椒（皮をむいた青唐辛子の醤油漬け: 細長くつやのある黄緑）
function xtwPeeledChili(p, x, y, L, r = 0, { c = '#b4ae46' } = {}){
    const w = L * .17;
    const body = `M${f1(-L / 2)},${f1(-w * .1)} Q${f1(-L / 2)},${f1(-w * .55)} ${f1(-L * .38)},${f1(-w * .55)} Q${f1(L * .05)},${f1(-w * .5)} ${f1(L * .3)},${f1(-w * .1)} Q${f1(L * .44)},${f1(w * .14)} ${f1(L / 2)},${f1(w * .5)} Q${f1(L * .36)},${f1(w * .36)} ${f1(L * .2)},${f1(w * .36)} Q${f1(-L * .1)},${f1(w * .55)} ${f1(-L * .38)},${f1(w * .5)} Q${f1(-L / 2)},${f1(w * .45)} ${f1(-L / 2)},${f1(-w * .1)}Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${body}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7" opacity=".95"/></g>
        <path d="M${f1(-L * .44)},${f1(-w * .45)} Q${f1(-L * .5)},0 ${f1(-L * .44)},${f1(w * .42)} L${f1(-L * .38)},${f1(w * .2)} L${f1(-L * .36)},0 L${f1(-L * .38)},${f1(-w * .2)}Z" fill="#5e8a2a" stroke="#3e6a1a" stroke-width=".5"/>
        <path d="M${f1(-L * .47)},0 q-4,-1 -6,-4" stroke="#5e8a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-L * .3)},${f1(-w * .22)} Q0,${f1(-w * .32)} ${f1(L * .24)},${f1(-w * .02)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 芥菜（長年菜）の茎のかけら（厚い淡緑の茎、ちぢれた葉先）
function xtwMustard(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xmu' + seed + x), k = s / 30;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${smooth(ring(8, 9, .4, R, 1.1, 1).map(([a, b]) => [a + 9, b]))}" fill="${p.g('#5f9a3a', .2, .3)}" stroke="#3a6a24" stroke-width=".6"/>
        <path d="M-14,-6 Q-4,-9 8,-6 L8,6 Q-4,9 -14,6 Q-15,0 -14,-6Z" fill="${p.g('#c8dc98', .3, .2)}" stroke="#8aa85a" stroke-width=".6"/></g>
        <path d="M-12,-2 L6,-2 M-12,2 L6,2" stroke="#e6efc8" stroke-width=".9" opacity=".9"/>
        <path d="M-11,-4.6 L4,-5.2" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".6"/></g>`;
}
// 皮蛋のかけら（透ける琥珀〜黒の白身、灰緑の黄身）
function xtwPidan(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,4 A10,9 0 0 1 10,4 Q0,7 -10,4Z" fill="${p.g('#5a3416', .35, .4)}" stroke="#2a1606" stroke-width=".6"/></g>
        <path d="M-5,4 A5,4.6 0 0 1 5,4 Q0,5.4 -5,4Z" fill="${p.g('#6e7650', .2, .3)}"/><path d="M-3,3.6 A3,2.4 0 0 1 3,3.6" fill="#c8b45a" opacity=".7"/>
        <path d="M-7,0 Q-4,-4.4 1,-4.6" stroke="#e8b878" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 落花生（皮つき・皮なし）
function xtwPeanut(p, x, y, s, r = 0, { c = '#8e3a22', skin = true } = {}){
    const col = skin ? c : '#f0e0bc';
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .34)}" fill="${p.g(col, .3, .3)}" stroke="${dk(col, .35)}" stroke-width=".5"/>${skin ? `<path d="M${f1(-s * .3)},0 Q0,${f1(-s * .06)} ${f1(s * .3)},0" stroke="${dk(col, .25)}" stroke-width=".5" fill="none" opacity=".6"/>` : `<path d="M${f1(-s * .1)},${f1(-s * .3)} L${f1(-s * .1)},${f1(s * .3)}" stroke="${dk(col, .2)}" stroke-width=".5" opacity=".6"/>`}<ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .12)}" rx="${f1(s * .14)}" ry="${f1(s * .07)}" fill="#fff" opacity="${skin ? .45 : .7}"/></g>`;
}
// オクラ（丸ごと1本: 先細りのさや、がく、稜線）
function xtwOkraPod(p, x, y, L, r = 0, { c = '#4f9e34' } = {}){
    const w = L * .24;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f1(-L / 2)},${f1(-w / 2)} Q${f1(L * .1)},${f1(-w * .55)} ${f1(L / 2)},0 Q${f1(L * .1)},${f1(w * .55)} ${f1(-L / 2)},${f1(w / 2)}Z" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .4)}" stroke-width=".6"/></g>
        <path d="M${f1(-L * .4)},${f1(-w * .18)} Q${f1(L * .1)},${f1(-w * .2)} ${f1(L * .44)},0 M${f1(-L * .4)},${f1(w * .18)} Q${f1(L * .1)},${f1(w * .2)} ${f1(L * .44)},0" stroke="${dk(c, .25)}" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M${f1(-L / 2 - 4)},${f1(-w * .25)} L${f1(-L / 2 + 1)},${f1(-w * .45)} L${f1(-L / 2 + 1)},${f1(w * .45)} L${f1(-L / 2 - 4)},${f1(w * .25)}Z" fill="#9ac46a" stroke="#5a8a3a" stroke-width=".5"/>
        <path d="M${f1(-L * .34)},${f1(-w * .3)} Q0,${f1(-w * .42)} ${f1(L * .3)},${f1(-w * .14)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 筍のかけら（乱切り: 象牙色、細かい横すじ、穂先の節）
function xtwShoot(p, x, y, s, r = 0, { c = '#f1e4b8', seed = 1 } = {}){
    const R = rng(p.id + 'xbs' + seed + x + y), k = s / 24;
    const pts = [[-11, 7], [-9, -4], [-3, -10], [6, -9], [11, -2], [10, 7], [0, 9]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 2.4]);
    let ln = '';
    for (let i = 0; i < 5; i++){ const yy = -6 + i * 3; ln += `M${f1(-8 + i * .4)},${f1(yy)} Q0,${f1(yy - 1.6)} ${f1(8 - i * .2)},${f1(yy + .4)} `; }
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .5)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g>
        <path d="${ln}" stroke="${dk(c, .14)}" stroke-width=".7" fill="none" opacity=".8"/>
        <path d="M-6,5 Q0,7 7,5" stroke="${dk(c, .2)}" stroke-width="1" fill="none" opacity=".5"/>
        <path d="M-6,-6 Q-1,-9 4,-8" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 豬肝の薄切り（なめらかな赤茶、つや）
function xtwLiver(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xlv' + seed + x + y), k = s / 24;
    const pts = ring(11, 10, .4, R, 1.35, .6);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}><path d="${smooth(pts, true, .9)}" fill="${p.g('#8a3a28', .3, .35)}" stroke="#4a1a10" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .7 - 1, b * .6 - 1]), true, .9)}" fill="#9a4a38" opacity=".5"/>
        <path d="M-7,-3 Q-1,-6 6,-4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 豬腳のかけら（つやのあるぷるんとした皮、赤身、骨の断面）
function xtwTrotter(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtr' + seed + x + y), k = s / 30;
    const pts = ring(14, 11, .18, R, 1.1, .9);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .9)}" fill="${p.g('#efd6b4', .3, .25)}" stroke="#b8946a" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .66 + 1.5, b * .66 + 1.5]), true, .9)}" fill="${p.g('#c99878', .2, .25)}"/>
        <circle cx="3" cy="3" r="4.2" fill="#f4ecdc" stroke="#cdb894" stroke-width=".7"/><circle cx="3" cy="3" r="1.8" fill="#d6a890"/>
        <path d="M-10,-4 Q-4,-11 5,-11" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/><circle cx="8" cy="-8" r="1.2" fill="#fff" opacity=".6"/></g>`;
}
// 紅棗・枸杞・八角
function xtwJujube(p, x, y, s, r = 0){ return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .38)}" fill="${p.g('#9a2418', .25, .35)}" stroke="#5a1008" stroke-width=".5"/></g><path d="M${f1(-s * .3)},${f1(-s * .05)} Q0,${f1(s * .1)} ${f1(s * .3)},${f1(-s * .08)} M${f1(-s * .2)},${f1(s * .16)} Q0,${f1(s * .06)} ${f1(s * .24)},${f1(s * .18)}" stroke="#5a1008" stroke-width=".6" fill="none" opacity=".6"/><ellipse cx="${f1(-s * .16)}" cy="${f1(-s * .14)}" rx="${f1(s * .12)}" ry="${f1(s * .06)}" fill="#fff" opacity=".5"/></g>`; }
function xtwGoji(p, x, y, s, r = 0){ return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .3)}" fill="${p.g('#e2462a', .3, .25)}" stroke="#a8261a" stroke-width=".4"/><ellipse cx="${f1(-s * .14)}" cy="${f1(-s * .08)}" rx="${f1(s * .12)}" ry="${f1(s * .06)}" fill="#fff" opacity=".6"/></g>`; }
function xtwStarAnise(p, x, y, s, r = 0){ return `<g ${T(x, y, r, s / 20)}><g ${p.sh(.5)}>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path transform="rotate(${a})" d="M0,0 Q-2.6,-5 0,-10 Q2.6,-5 0,0Z" fill="${p.g('#8a4a24', .25, .3)}" stroke="#4a2410" stroke-width=".5"/>`).join('')}</g>${[0, 90, 180, 270].map(a => `<ellipse transform="rotate(${a}) translate(0 -6)" rx="1" ry="1.4" fill="#d8a060"/>`).join('')}</g>`; }
// 当帰の薄切り（淡い茶の不定形の片）
function xtwHerbSlice(p, x, y, s, r = 0, { seed = 1, c = '#c9a46a' } = {}){ const R = rng(p.id + 'xhb' + seed + x); return `<g ${T(x, y, r)}><path d="${smooth(ring(s / 2, 8, .45, R, 1.3, .7))}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .35)}" stroke-width=".5" opacity=".95"/><path d="M${f1(-s * .3)},0 Q0,${f1(-s * .1)} ${f1(s * .3)},0" stroke="${dk(c, .3)}" stroke-width=".6" fill="none" opacity=".6"/></g>`; }
// 香菜（丸いぎざぎざの小葉が3つ）
function xtwCilantro(p, x, y, s, r = 0, { c = '#3f9038' } = {}){
    const k = s / 20;
    const lobe = a => `<g transform="rotate(${a}) translate(0 -6)"><path d="M0,4 Q-5,3 -5,-1 Q-4,-5 0,-5 Q4,-5 5,-1 Q5,3 0,4Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".5"/><path d="M0,3 L0,-3 M0,0 L-2.6,-2.6 M0,0 L2.6,-2.6" stroke="${lt(c, .4)}" stroke-width=".5" fill="none"/></g>`;
    return `<g ${T(x, y, r, k)}><path d="M0,0 L0,9" stroke="#8cbf5c" stroke-width="1.2" stroke-linecap="round"/>${lobe(-60)}${lobe(0)}${lobe(60)}</g>`;
}
// 空心菜の葉（細長い矢じり形）と、穴のあいた茎
function xtwLongLeaf(p, x, y, L, r = 0, { c = '#2f7a2a', w = .26 } = {}){
    const h = L * w;
    return `<g ${T(x, y, r)}><path d="M${f1(-L / 2)},0 Q${f1(-L * .2)},${f1(-h * .9)} ${f1(L * .1)},${f1(-h * .55)} Q${f1(L * .35)},${f1(-h * .25)} ${f1(L / 2)},0 Q${f1(L * .35)},${f1(h * .25)} ${f1(L * .1)},${f1(h * .55)} Q${f1(-L * .2)},${f1(h * .9)} ${f1(-L / 2)},0Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f1(-L * .48)},0 L${f1(L * .46)},0" stroke="${lt(c, .35)}" stroke-width=".8"/>
        <path d="M${f1(-L * .3)},${f1(-h * .3)} Q${f1(-L * .05)},${f1(-h * .5)} ${f1(L * .2)},${f1(-h * .3)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
function xtwHollowStem(p, x, y, L, w, r = 0, { c = '#8cc05a' } = {}){
    return `<g ${T(x, y, r)}><rect x="${f1(-L / 2)}" y="${f1(-w / 2)}" width="${f1(L)}" height="${f1(w)}" rx="${f1(w * .3)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/><ellipse cx="${f1(L / 2 - .6)}" cy="0" rx="${f1(w * .22)}" ry="${f1(w * .4)}" fill="${lt(c, .3)}" stroke="${dk(c, .3)}" stroke-width=".4"/><ellipse cx="${f1(L / 2 - .6)}" cy="0" rx="${f1(w * .1)}" ry="${f1(w * .2)}" fill="${dk(c, .3)}"/><path d="M${f1(-L / 2 + w)},${f1(-w * .2)} L${f1(L / 2 - w)},${f1(-w * .2)}" stroke="#fff" stroke-width="${f1(w * .22)}" stroke-linecap="round" opacity=".55"/></g>`;
}
// 巻きひげ（龍鬚菜）: 茎から伸びてくるりと巻く細い線
function xtwTendril(x, y, s, r = 0, c = '#9cc860'){
    const pts = [];
    for (let i = 0; i < 16; i++){ const a = Math.PI / 2 + i * .62, rr = s * .3 * Math.pow(.86, i); pts.push([Math.cos(a) * rr, Math.sin(a) * rr - s * .3]); }
    return `<path ${T(x, y, r)} d="M${f1(-s)},${f1(s * .1)} Q${f1(-s * .5)},${f1(s * .1)} 0,0 ${pts.map(([a, b]) => `L${f1(a)},${f1(b + s * .3 - s * .3)}`).join('')}" stroke="${c}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// 山蘇の葉（細長く平たい濃い緑、真ん中に明るい葉脈、ゆるく波打つ縁）
function xtwFern(p, x, y, L, w, r = 0, { c = '#2e6e26' } = {}){
    const n = 6, top = [], bot = [];
    for (let i = 0; i <= n; i++){ const xx = -L / 2 + i * L / n, e = i === 0 || i === n ? .35 : 1, ww = (w / 2 * (1 - Math.abs(i / n - .5) * .4) + Math.sin(i * 2.6) * 1.4) * e; top.push([xx + (i === 0 ? 3 : 0), -ww]); bot.unshift([xx - (i === n ? 3 : 0), ww * (.9 + (i % 2) * .2)]); }
    return `<g ${T(x, y, r)}><path d="${smooth([...top, ...bot], true, .7)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f1(-L / 2 + 2)},0 Q0,${f1(-w * .08)} ${f1(L / 2 - 2)},0" stroke="#b8cc7a" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M${f1(-L * .3)},${f1(-w * .1)} l3,-${f1(w * .25)} M${f1(-L * .05)},${f1(-w * .1)} l3,-${f1(w * .25)} M${f1(L * .2)},${f1(-w * .1)} l3,-${f1(w * .25)} M${f1(-L * .2)},${f1(w * .1)} l3,${f1(w * .25)} M${f1(L * .08)},${f1(w * .1)} l3,${f1(w * .25)}" stroke="${lt(c, .25)}" stroke-width=".6" opacity=".7"/>
        <path d="M${f1(-L * .4)},${f1(-w * .26)} L${f1(L * .3)},${f1(-w * .28)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".5"/></g>`;
}
// 小魚乾（銀色の小さな煮干し）
function xtwAnchovy(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><path d="M${f1(-s / 2)},0 Q${f1(-s * .2)},${f1(-s * .16)} ${f1(s * .34)},${f1(-s * .04)} L${f1(s / 2)},${f1(-s * .12)} L${f1(s / 2)},${f1(s * .12)} L${f1(s * .34)},${f1(s * .04)} Q${f1(-s * .2)},${f1(s * .16)} ${f1(-s / 2)},0Z" fill="${p.g('#d6d2c2', .3, .3)}" stroke="#8a8676" stroke-width=".4"/><path d="M${f1(-s * .4)},${f1(-s * .04)} L${f1(s * .3)},${f1(-s * .04)}" stroke="#6a665a" stroke-width=".6"/><circle cx="${f1(-s * .36)}" cy="0" r="${f1(s * .05)}" fill="#2a2a2a"/></g>`;
}
// 鹹蜆仔（小さな黒緑の殻、口が少し開いて身が見える）
function xtwXian(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xxn' + seed + x + y), k = s / 16, c = R() < .5 ? '#3a3a24' : '#4a4626';
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-8,2 C-8,-5 -3,-8 0,-8 C3,-8 8,-5 8,2 C5,5 -5,5 -8,2Z" fill="${p.g(c, .35, .3)}" stroke="#1a1a10" stroke-width=".6"/></g>
        <path d="M-5,1 C-4,-4 -1,-6 0,-7 M4,1 C4,-4 1,-6 0,-7" stroke="#6a6a3a" stroke-width=".6" fill="none" opacity=".7"/>
        <path d="M-6,2.6 Q0,5.6 6,2.6 Q0,3.6 -6,2.6Z" fill="#d8a870" stroke="#9a6a3a" stroke-width=".4"/>
        <path d="M-4.4,-3.4 Q-2,-6 1,-6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 湯圓（小さな白い白玉、つや）
function xtwTangyuan(p, x, y, s){
    return `<g ${p.sh(.5)}><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s / 2)}" fill="${p.rg('#faf8f2', .2, .14, .36, .34)}" stroke="#d8d2c2" stroke-width=".6"/></g><ellipse cx="${f1(x - s * .16)}" cy="${f1(y - s * .18)}" rx="${f1(s * .16)}" ry="${f1(s * .09)}" fill="#fff"/>`;
}
// 羹の具: 魚漿をまとった肉・いか（でこぼこの淡い衣）
function xtwGengPiece(p, x, y, L, w, r = 0, { c = '#d8b08a', coat = '#efe4d0', seed = 1 } = {}){
    const R = rng(p.id + 'xgp' + seed + x + y);
    const pts = ring(L / 2, 9, .3, R, 1, w / L);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><g ${p.rough(2, .25)}><path d="${smooth(pts, true, .9)}" fill="${p.g(coat, .3, .25)}" stroke="${dk(coat, .3)}" stroke-width=".6"/></g></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .6 + .8, b * .5 + .6]), true, .9)}" fill="${c}" opacity=".7"/>
        <path d="M${f1(-L * .3)},${f1(-w * .2)} Q0,${f1(-w * .4)} ${f1(L * .24)},${f1(-w * .22)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 鹿の子に切り込みを入れたいか（白〜淡い桃色、格子の切れ目、丸まった縁）
function xtwSquidCut(p, x, y, L, w, r = 0, { seed = 1, c = '#f6e6dc' } = {}){
    const R = rng(p.id + 'xsq' + seed + x + y);
    const body = smooth([[-L / 2, -w * .3], [-L * .2, -w / 2], [L * .3, -w * .45], [L / 2, -w * .1], [L * .44, w * .4], [0, w / 2], [-L * .4, w * .42]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]), true, .8);
    const cid = p.uid();
    let grid = '';
    for (let i = -4; i <= 4; i++) grid += `M${f1(i * 4.6 - w)},${f1(-w)} l${f1(w * 2)},${f1(w * 2)} M${f1(i * 4.6 + w)},${f1(-w)} l${f1(-w * 2)},${f1(w * 2)} `;
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(.6)}><path d="${body}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <g clip-path="url(#${cid})"><path d="${grid}" stroke="${dk(c, .28)}" stroke-width="1" opacity=".6"/><path d="${body}" fill="none" stroke="#e8b4a8" stroke-width="3" opacity=".5"/></g>
        <path d="M${f1(-L * .3)},${f1(-w * .26)} Q0,${f1(-w * .44)} ${f1(L * .26)},${f1(-w * .3)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 紅糟肉の切り口（濃い紅の揚げ衣の縁、淡い桃色の断面、脂の筋）
function xtwHongzao(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xhz' + seed + x + y);
    const pts = [[-w / 2, -h / 2], [0, -h / 2 - 1], [w / 2, -h / 2], [w / 2 + 1, 0], [w / 2, h / 2], [0, h / 2 + 1], [-w / 2, h / 2], [-w / 2 - 1, 0]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    const inner = pts.map(([a, b]) => [a * .78, b * .86]);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><g ${p.rough(1.6, .3)}><path d="${smooth(pts, true, .6)}" fill="${p.g('#9a2228', .2, .35)}" stroke="#5a1014" stroke-width=".7"/></g></g>
        <path d="${smooth(inner, true, .6)}" fill="${p.g('#eeb2aa', .3, .2)}"/>
        <path d="${smooth(inner, true, .6)}" fill="none" stroke="#d0545a" stroke-width="2" opacity=".6"/>
        <path d="M${f1(-w * .3)},${f1(-h * .18 + R() * 4)} Q0,${f1(-h * .08)} ${f1(w * .3)},${f1(-h * .2 + R() * 4)}" stroke="#fbeee6" stroke-width="2.2" fill="none" opacity=".8"/>
        <path d="M${f1(-w * .26)},${f1(h * .2)} Q0,${f1(h * .28)} ${f1(w * .26)},${f1(h * .16)}" stroke="#d88a86" stroke-width="1" fill="none" opacity=".6"/></g>`;
}
// 煮込んだ牛すねのかたまり（濃い赤茶、すじの透けた飴色、繊維の線）
function xtwBeefChunk(p, x, y, s, r = 0, { c = '#6e3418', seed = 1, tendon = true } = {}){
    const R = rng(p.id + 'xbc' + seed + x + y), k = s / 30;
    const pts = [[-14, -9], [-2, -12], [12, -10], [15, 0], [12, 10], [0, 12], [-13, 10], [-15, 0]].map(([a, b]) => [a + (R() - .5) * 4, b + (R() - .5) * 4]);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.9)}><path d="${smooth(pts, true, .7)}" fill="${p.g(c, .28, .38)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        ${tendon ? `<path d="M-10,${f1(2 + R() * 3)} Q-2,${f1(-2 + R() * 3)} 9,${f1(3 + R() * 3)} Q0,${f1(8 + R() * 2)} -10,${f1(4 + R() * 3)}Z" fill="#c48a52" opacity=".75"/>` : ''}
        <path d="M-10,-5 Q0,-8 10,-5 M-11,-1 Q0,-4 11,-1 M-9,6 Q0,9 9,6" stroke="${dk(c, .35)}" stroke-width=".8" fill="none" opacity=".55"/>
        <path d="M-9,-7.5 Q-2,-11 6,-9" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 青梗菜（半割り: 白緑の軸と濃い緑の葉）
function xtwBokChoy(p, x, y, L, r = 0, { c = '#3f8a2e' } = {}){
    const k = L / 40;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.7)}><path d="M-2,-11 Q8,-16 18,-11 Q22,-4 19,4 Q14,12 4,11 Q-3,8 -2,-11Z" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/>
        <path d="M-20,-3 Q-8,-7 4,-7 Q8,0 4,7 Q-8,7 -20,3 Q-21,0 -20,-3Z" fill="${p.g('#d6eaa8', .3, .2)}" stroke="#9ab86a" stroke-width=".7"/></g>
        <path d="M-18,0 L6,0 M2,-6 Q10,-6 17,-8 M4,0 Q12,0 19,-1 M2,6 Q10,6 15,8" stroke="#eaf4cc" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-16,-3.4 L0,-5" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".7"/></g>`;
}
// 鱈の切り身（輪切り: 白い身、細い灰黒の皮の縁、腹側の切れ込み、真ん中の骨）
function xtwCodSteak(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xcd' + seed + x);
    const pts = ring(w / 2, 14, .08, R, 1, h / w);
    let fl = '';
    for (let i = 0; i < 6; i++){ const a = i / 6 * 6.28 + .3; fl += `M${f1(Math.cos(a) * w * .08)},${f1(Math.sin(a) * h * .08)} Q${f1(Math.cos(a + .3) * w * .25)},${f1(Math.sin(a + .3) * h * .25)} ${f1(Math.cos(a) * w * .42)},${f1(Math.sin(a) * h * .42)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${smooth(pts)}" fill="#8a8882" stroke="#5a5852" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .96, b * .955]))}" fill="${p.rg('#faf6ec', .2, .1)}"/>
        <path d="${fl}" stroke="#e6e0d0" stroke-width="1" fill="none" opacity=".9"/>
        <ellipse cx="0" cy="${f1(-h * .02)}" rx="${f1(w * .05)}" ry="${f1(h * .045)}" fill="#e8dcc4" stroke="#c8b898" stroke-width=".6"/></g>`;
}
// 絲瓜のかけら（やわらかく透けた淡い緑の身、ところどころに濃い緑の稜のすじ）
function xtwLoofah(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xlf' + seed + x + y), k = s / 24;
    const pts = ring(11, 8, .35, R, 1.2, .85);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .8)}" fill="${p.rg('#c4dc8a', .4, .25, .4, .38)}" stroke="#94b862" stroke-width=".6"/></g>
        <path d="M${f1(pts[1][0])},${f1(pts[1][1])} Q${f1(pts[2][0] * .7)},${f1(pts[2][1] * 1.1)} ${f1(pts[3][0])},${f1(pts[3][1])}" stroke="#5a8a30" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M-6,1 Q0,3 6,0" stroke="#f4f8e2" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M-6,-4 Q-1,-7 4,-6" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 焼き豆腐の厚切り（両面こんがり: 縁は淡く、面は焼き色）
function xtwTofuSlab(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xts' + seed + x + y);
    let sp = '';
    for (let i = 0; i < 4; i++) sp += `<ellipse cx="${f1((R() - .5) * w * .6)}" cy="${f1((R() - .5) * h * .6)}" rx="${f1(w * (.12 + R() * .12))}" ry="${f1(h * (.1 + R() * .1))}" fill="#a8641a" opacity="${f1(.2 + R() * .2)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(Math.min(w, h) * .14)}" fill="${p.g('#f2dcae', .3, .25)}" stroke="#b88a4a" stroke-width=".7"/></g>
        <rect x="${f1(-w / 2 + 2)}" y="${f1(-h / 2 + 2)}" width="${f1(w - 4)}" height="${f1(h - 4)}" rx="${f1(Math.min(w, h) * .12)}" fill="${p.rg('#d8973c', .25, .3)}"/>${sp}
        <path d="M${f1(-w * .34)},${f1(-h * .3)} L${f1(w * .2)},${f1(-h * .32)}" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".6"/></g>`;
}
// 小さなさいの目（にんじん・きゅうり・卵白）
function xtwDice(p, x, y, s, r = 0, c = '#ef7f30'){
    return `<g ${T(x, y, r)}><rect x="${f1(-s / 2)}" y="${f1(-s / 2)}" width="${f1(s)}" height="${f1(s)}" rx="${f1(s * .2)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".5"/></g>`;
}
// 虱目魚肚（湯の中: 扇形の腹身。白くふっくらした身、片側に銀灰色の皮、脂の層）
function xtwFishBelly(p, x, y, L, r = 0){
    const h = L * .5;
    const body = smooth([[-L / 2, -h * .1], [-L * .3, -h * .44], [L * .05, -h * .5], [L * .36, -h * .36], [L / 2, -h * .04], [L * .42, h * .3], [L * .1, h * .44], [-L * .3, h * .36]], true, .9);
    const skin = smooth([[-L * .46, h * .02], [-L * .3, h * .3], [L * .1, h * .4], [L * .4, h * .26], [L * .46, h * .06], [L * .3, h * .14], [L * .05, h * .2], [-L * .3, h * .14]], true, .8);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${body}" fill="${p.rg('#f6f2ea', .2, .14, .4, .34)}" stroke="#c8beac" stroke-width=".8"/></g>
        <path d="${skin}" fill="${p.g('#a8b2b4', .35, .3)}" opacity=".9"/>
        ${[-.28, -.12, .04, .2].map(t => `<path d="M${f1(L * t)},${f1(-h * .38)} Q${f1(L * t + 6)},${f1(-h * .1)} ${f1(L * t + 1)},${f1(h * .12)}" stroke="#e2d8c4" stroke-width="1.3" fill="none"/>`).join('')}
        <path d="M${f1(-L * .3)},${f1(-h * .02)} Q0,${f1(h * .06)} ${f1(L * .34)},${f1(-h * .02)}" stroke="#f2e4c4" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${f1(-L * .28)},${f1(-h * .28)} Q${f1(-L * .05)},${f1(-h * .42)} ${f1(L * .2)},${f1(-h * .32)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
}
// 老しょうがの厚切り（麻油で焼いて縁が茶色い、ごつごつした不定形の大きな片）
function xtwOldGinger(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xog' + seed + x);
    const pts = ring(s / 2, 9, .4, R, 1.25, .75);
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.rg('#f0d488', .3, .25)}" stroke="#8a5a24" stroke-width="1.8"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .6, b * .55]), true, .7)}" fill="none" stroke="#d8b060" stroke-width=".8" opacity=".8"/>
        <path d="M${f1(-s * .3)},${f1(-s * .14)} Q${f1(-s * .1)},${f1(-s * .24)} ${f1(s * .14)},${f1(-s * .2)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// スープの鶏（骨つきのぶつ切り: 皮つきの淡い身。sear で麻油雞の焼き色）
function xtwSoupChk(p, x, y, s, r = 0, { seed = 1, c = '#efd6a6', bone = true } = {}){ return xtwChickenBone(p, x, y, s, r, { c, seed, bone }); }
// 薏仁（白い丸い粒、真ん中に茶色い溝）・蓮子・芡実
function xtwBarley(p, x, y, s, { n = 40, seed = 1 } = {}){
    const R = rng(p.id + 'xbl' + seed + x);
    let a = '', b = '';
    for (let i = 0; i < n; i++){ const t = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(t) * d, cy = y + Math.sin(t) * d, rr = 3 + R() * .7, ang = R() * 3.14; a += `M${f1(cx - rr)},${f1(cy)}a${f1(rr)},${f1(rr * .85)} 0 1 1 ${f1(rr * 2)},0a${f1(rr)},${f1(rr * .85)} 0 1 1 ${f1(-rr * 2)},0`; b += `M${f1(cx - Math.cos(ang) * rr * .6)},${f1(cy - Math.sin(ang) * rr * .6)}l${f1(Math.cos(ang) * rr * 1.2)},${f1(Math.sin(ang) * rr * 1.2)}`; }
    return `<g ${p.sh(.4)}><path d="${a}" fill="#fbf8ee" stroke="#c4b48e" stroke-width=".6"/></g><path d="${b}" stroke="#9a6a3a" stroke-width="1" stroke-linecap="round"/>`;
}
function xtwLotusSeed(p, x, y, s, r = 0){ return `<g ${T(x, y, r)}><g ${p.sh(.5)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .42)}" fill="${p.rg('#f2e6c4', .3, .2, .35, .32)}" stroke="#c8b07a" stroke-width=".6"/></g><path d="M0,${f1(-s * .38)} L0,${f1(s * .38)}" stroke="#c8a868" stroke-width=".9"/><ellipse cx="${f1(-s * .18)}" cy="${f1(-s * .14)}" rx="${f1(s * .1)}" ry="${f1(s * .06)}" fill="#fff" opacity=".8"/></g>`; }
// 莧菜の葉（緑の葉の真ん中が赤紫）
function xtwAmaranth(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.4)}><path d="M-10,0 Q-6,-8 2,-7 Q9,-5 10,0 Q8,6 1,7 Q-6,7 -10,0Z" fill="${p.g('#4a8a30', .25, .3)}" stroke="#2e5e1e" stroke-width=".6"/></g>
        <path d="M-8,0 Q-3,-3 3,-2 Q5,0 3,2 Q-3,3 -8,0Z" fill="#8a2042" opacity=".7"/><path d="M-9,0 L9,0 M-3,0 L-6,-4 M2,0 L0,-5 M-3,0 L-6,4 M2,0 L0,5" stroke="#c45a7a" stroke-width=".7" fill="none"/></g>`;
}
// 煮たトマトのかけら（z_soup.mjs から写したもの）
function zsTomatoX(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtm' + seed + x + y);
    const k = s / 20;
    const pts = ring(9.5, 8, .3, R, 1.15, .8);
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="${smooth(pts, true, .7)}" fill="${p.g('#e2412c', .3, .25)}" stroke="#a6261a" stroke-width=".6"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62, b * .58 + 1]), true, .7)}" fill="#f37a5c" opacity=".9"/>
        <path d="M-4,1.2 Q-2.5,-1 -1,1.2 M1.2,1.4 Q2.8,-.8 4.2,1.4" stroke="#f6c463" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M-7,-4 Q-1,-7.5 5,-5.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 骨つきの鶏（スープの中: 淡い皮）
const xtwSoupChicken = (p, x, y, s, r, o = {}) => xtwChickenBone(p, x, y, s, r, { c: '#e8c894', ...o });
// あさり（z_soup.mjs から写したもの）
function xtwClam(p, x, y, s, r = 0, { seed = 1, meat = '#f0b46c', open = true } = {}){
    const R = rng(p.id + 'xcl' + seed + x + y);
    const k = s / 30;
    const outerC = ['#a8957c', '#8f8170', '#b39c80', '#7f766c'][Math.floor(R() * 4)];
    // 殻1枚: 蝶番（umbo）を (0,0) にした丸い三角
    const shell = `M0,0 C-3,1 -11,4 -12,10 C-12.5,15 -7,18 0,18 C7,18 12.5,15 12,10 C11,4 3,1 0,0Z`;
    if (!open){
        let zz = '';
        for (let i = 0; i < 4; i++){ const yy = 5 + i * 3.2, w = 8 + i * 1.2; zz += `<path d="M${-w},${yy} l2.5,-1.6 l2.5,1.6 l2.5,-1.6 l2.5,1.6 l2.5,-1.6 l2.5,1.6 l2.5,-1.6" transform="translate(${f(-w * .0)} 0)" stroke="${dk(outerC, .45)}" stroke-width=".8" fill="none" opacity=".55"/>`; }
        return `<g ${T(x, y, r, k)}><g transform="translate(0 -9)"><g ${p.sh(.6)}><path d="${shell}" fill="${p.g(outerC, .3, .32)}" stroke="${dk(outerC, .4)}" stroke-width=".7"/></g>
            ${zz}<path d="M-10,12 Q0,9 10,12 M-11.5,15 Q0,12 11.5,15" stroke="${lt(outerC, .35)}" stroke-width=".7" fill="none" opacity=".8"/>
            <path d="M-7,17.4 Q0,20.5 7,17.4 Q0,18.6 -7,17.4Z" fill="${meat}" stroke="${dk(meat, .3)}" stroke-width=".5"/>
            <path d="M-5,5 Q-2,2.6 1,3" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/></g></g>`;
    }
    const valve = a => `<g transform="rotate(${a})"><path d="${shell}" fill="${p.g(outerC, .2, .3)}" stroke="${dk(outerC, .4)}" stroke-width=".7"/>
        <path d="M0,1.6 C-3,2.6 -9.6,5 -10.4,10 C-10.8,14 -6.4,16.4 0,16.4 C6.4,16.4 10.8,14 10.4,10 C9.6,5 3,2.6 0,1.6Z" fill="${p.g('#f1ebed', .3, .14)}"/>
        <path d="M-9,13.6 Q0,18 9,13.6" stroke="#9a86b0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${valve(-62)}${valve(62)}</g>
        <g transform="rotate(-62)"><path d="M-7,9 C-7,3.5 7,3.5 7.4,9 C7.6,14 3,15.6 0,15.4 C-4,15.2 -7,13 -7,9Z" fill="${p.g(meat, .32, .28)}" stroke="${dk(meat, .32)}" stroke-width=".6"/>
        <path d="M-5.6,11.4 C-3,14.4 3,14.6 5.8,11" stroke="${dk(meat, .3)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M-4,7.4 Q0,5.4 3.6,7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".75"/></g></g>`;
}

// =========================================================
const DISHES = {
    // 炸排骨: 白い皿に、さつまいも粉の衣でごつごつに揚げた大きな豚ロースの1枚、千切りキャベツ、レモン
    tw_zha_paigu: p => [
        xtwPlate(p),
        K.cabbageShreds(p, 140, 138, 40, { seed: 2, sy: .8 }),
        xtwChop(p, 94, 94, 126, 100, -14, { c: '#d07c1e' }),
        K.lemon(p, 148, 64, 24, 40),
        K.sprinkle(p, 92, 96, 80, { c: '#5a4030', n: 18, r: .55 }),
    ].join(''),

    // 鹽酥雞: 白い皿に、さつまいも粉で揚げたひと口の鶏をこんもり、揚げた九層塔、胡椒塩、にんにく
    tw_yansuji: p => {
        const pos = xtwSpots('ysj', 16, 50, 20, 100, 102);
        return [
            xtwRimPlate(p, { line: '#b8402e' }),
            `<g ${p.sh(.9)}>`,
            ...pos.map(([x, y, r, q], i) => xtwNugget(p, x, y, 29 + q * 5, r, { c: i % 3 ? '#c87a26' : '#b4661c', seed: i })),
            `</g>`,
            ...xtwSpots('ysjb', 9, 50, 22, 100, 102).map(([x, y, r]) => xtwFriedBasil(p, x, y, 20, r)),
            xtwGrains(p, 100, 102, 100, { cols: ['#f2e2b0', '#e8cf8a'], n: 20, size: 1.4, seed: 3 }),
            xtwGrains(p, 100, 102, 108, { cols: ['#f8f2e0'], n: 30, size: .8, seed: 5 }),
            xtwGrains(p, 100, 102, 108, { cols: ['#3a2a1e'], n: 30, size: .7, seed: 6 }),
        ].join('');
    },

    // 豆豉蚵: 白い碗に、とろみのある濃い茶色のたれ、ぷっくりした牡蠣、豆腐、豆豉、ねぎ、赤唐辛子
    tw_douchi_ke: p => [
        xtwBowl(p, { R: 92, lip: .86 }),
        K.liquid(p, { R: 76, c: '#5e3618', op: 1, shine: false }),
        `<circle cx="96" cy="96" r="58" fill="#8a5428" opacity=".35"/>`,
        `<g ${p.sh(.6)}>`,
        ...[[70, 74], [112, 66], [140, 98], [62, 112], [118, 128], [84, 140], [80, 56], [102, 152]].map(([x, y], i) => xtwTofuCube(p, x + 6, y + 10, 14, i * 23, { c: '#d8c49a', face: '#efe2c0', crumb: false })),
        `</g>`,
        ...xtwSpots('dck', 14, 56, 19, 100, 100).map(([x, y, r, q], i) => xtwOyster(p, x, y, 26 + q * 5, r, { seed: i })),
        `<circle cx="100" cy="100" r="76" fill="#8a5022" opacity=".26"/>`,
        xtwGrains(p, 100, 100, 130, { cols: ['#24160e', '#3a2416'], n: 34, size: 2.2, seed: 2 }),
        ...[[86, 86, 30], [124, 104, -40], [70, 128, 70], [110, 70, -10], [134, 140, 110], [58, 100, 20], [102, 124, 150]].map(([x, y, r], i) => xtwScallionSeg(p, x, y, 20, r, { green: i % 3 !== 0 })),
        xtwChiliRing(p, 100, 110, 9, 20), xtwChiliRing(p, 76, 96, 8, -50), xtwChiliRing(p, 132, 118, 8, 70), xtwChiliRing(p, 118, 82, 8, 10),
        xtwOil(p, 100, 100, 130, { n: 10, c: '#c8822a', op: .45, rmax: 1.6 }),
        xtwShine(100, 100, 76, .35),
    ].join(''),

    // 破布子蒸魚: 楕円の魚皿に、一尾の蒸し魚、破布子（橙茶色の小さな実）と汁、針しょうが、白髪ねぎ、赤唐辛子
    tw_pobuzi_zhengyu: p => {
        const R = rng(p.id + 'pbz');
        let seeds = '';
        for (const [x, y] of xtwSpots('pbz', 26, 70, 9, 100, 100, .62)) seeds += `<g ${p.sh(.4)}><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(3 + R())}" fill="${p.rg('#c47a30', .3, .3, .35, .32)}" stroke="#7a4214" stroke-width=".5"/></g><circle cx="${f1(x - 1)}" cy="${f1(y - 1.1)}" r=".9" fill="#fff" opacity=".8"/>`;
        return [
            xtwOval(p),
            xtwSauce(p, 100, 104, 156, '#8a5e2c', { op: .8, sy: .62 }),
            xtwFish(p, 98, 98, 152, -4, { skin: '#9a9a88', belly: '#ece6d4' }),
            seeds,
            xtwFineShreds(p, 92, 92, 66, { c: '#f6f4e2', n: 14, w: 1.4, seed: 3, dir: -.2, len: .6 }),
            xtwFineShreds(p, 104, 96, 60, { c: '#6fb044', n: 10, w: 1.4, seed: 4, dir: -.3, len: .55 }),
            xtwFineShreds(p, 96, 100, 54, { c: '#f1dc92', n: 10, w: 1.2, seed: 5, dir: .1, len: .5 }),
            xtwFineShreds(p, 108, 94, 40, { c: '#d83a24', n: 5, w: 1.2, seed: 6, dir: -.4, len: .5 }),
            xtwOil(p, 100, 104, 140, { n: 10, c: '#d8a24a', op: .45, rmax: 1.4 }),
        ].join('');
    },

    // 乾煎白帶魚: 長皿に、銀の皮がこんがり焼けた白帯魚の筒切りを4切れ、レモン
    tw_jian_daiyu: p => [
        K.longPlate(p, { w: 186, h: 124, base: '#f6f4ee', rim: '#7a9ab8' }),
        xtwHairtail(p, 62, 80, 66, 30, -6, { seed: 1 }),
        xtwHairtail(p, 128, 74, 64, 30, -2, { seed: 2 }),
        xtwHairtail(p, 70, 122, 66, 30, 4, { seed: 3 }),
        xtwHairtail(p, 132, 120, 62, 30, -5, { seed: 4 }),
        K.lemon(p, 170, 92, 18, 90), K.lemon(p, 172, 112, 16, 100),
        xtwFineShreds(p, 102, 100, 24, { c: '#f1dc92', n: 6, w: 1.2, seed: 2, dir: .5, len: .7 }),
    ].join(''),

    // 煎香腸: 白い皿に、つやよく焼いた台湾の香腸を斜め切りと丸ごとで、生にんにく、きゅうり
    tw_jian_xiangchang: p => [
        xtwPlate(p),
        xtwSausage(p, 96, 64, 100, -6, { seed: 1 }),
        `<g>`,
        ...[[50, 94], [66, 92], [82, 90], [98, 90], [114, 90], [130, 92], [146, 96]].map(([x, y], i) => xtwSausageSlice(p, x, y + 2, 24, -20 + i * 2, { seed: i })),
        ...[[56, 120], [72, 118], [88, 116], [104, 116], [120, 118], [136, 122]].map(([x, y], i) => xtwSausageSlice(p, x, y + 2, 24, -18, { seed: i + 9 })),
        `</g>`,
        ...[[74, 146], [92, 150], [110, 148], [128, 144]].map(([x, y], i) => K.cucumberSlice(p, x, y, 18, i * 30, { oval: 1.25 })),
        xtwRawGarlic(p, 148, 130, 15, 30), xtwRawGarlic(p, 154, 112, 14, -20), xtwRawGarlic(p, 52, 140, 14, 60), xtwRawGarlic(p, 144, 148, 13, 10),
    ].join(''),

    // 蛤蜊蒸蛋: 白い鉢に、なめらかに蒸した卵の面、口を開けた蛤蜊、醤油、ねぎ
    tw_gela_zhengdan: p => [
        K.bowl(p, { R: 92, glaze: '#e6ddc8', inside: '#f8f4ea', lip: .88 }),
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#f4da8a', .35, .16, .42, .4)}"/>`,
        `<circle cx="100" cy="100" r="78" fill="none" stroke="#e8b84a" stroke-width="3" opacity=".5"/>`,
        ...[[72, 76, -20], [124, 70, 30], [100, 106, 0], [62, 120, -70], [134, 118, 80], [96, 146, 160], [138, 150, 200]].map(([x, y, r], i) => xtwClam(p, x, y, 36, r, { seed: i, meat: '#f2b46a' })),
        `<circle cx="100" cy="100" r="78" fill="#f4da8a" opacity=".2"/>`,
        `<path ${T(104, 92)} d="${xtwSmooth(ring(13, 9, .35, rng('gzs'), 1.4, .7))}" fill="#8a4a1a" opacity=".3"/>`,
        xtwScallions(p, 100, 100, 110, { n: 16 }),
        `<path d="M48,86 A54,54 0 0 1 84,48" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // 金沙豆腐: 白い皿に、揚げた角切り豆腐に鹹蛋の黄身の金色の砂をからめ、ねぎ
    tw_jinsha_doufu: p => {
        const pos = xtwSpots('jsd', 18, 50, 22, 100, 102);
        return [
            xtwRimPlate(p, { line: '#c08a2a' }),
            `<g ${p.sh(.4)}>`,
            ...pos.map(([x, y, r, q]) => xtwTofuCube(p, x, y, 25 + q * 4, r, { c: '#d89434', face: '#eab452' })),
            `</g>`,
            xtwGrains(p, 100, 102, 124, { cols: ['#f0a830', '#f6c24a', '#e8901e', '#f8d870'], n: 230, size: 1.9, seed: 1 }),
            xtwGrains(p, 100, 102, 110, { cols: ['#fbe7a0'], n: 30, size: 1.3, seed: 2 }),
            xtwScallions(p, 100, 102, 104, { n: 16 }),
        ].join('');
    },

    // 高麗菜飯: 飯碗に、醤油色のご飯にキャベツ、にんじん、しいたけ、豚ばら、蝦米を炊き込んだもの
    tw_gaolicai_fan: p => [
        xtwBowl(p, { R: 92 }),
        xtwRice(p, 100, 101, 148, { density: .72, grain: 4.6, tint: '#e8cc92', hiK: .6, sdOp: .25, base: '#e4c890' }),
        `<g ${p.sh(.5)}>`,
        ...xtwSpots('glc', 10, 52, 22, 100, 102).map(([x, y, r], i) => xtwCabbage(p, x, y, 30, r, { c: i % 2 ? '#a8c870' : '#98bc60', seed: i })),
        `</g>`,
        xtwStrips(p, 100, 102, 110, { c: '#e8782a', n: 16, w: 2.2, len: .22, seed: 2 }),
        xtwStrips(p, 100, 102, 106, { c: '#6a4428', n: 9, w: 2.6, len: .16, seed: 3, gloss: .35 }),
        xtwPorkShreds(p, 100, 102, 104, { seed: 5, n: 12, c: '#d6a882' }),
        ...xtwSpots('glcs', 9, 50, 16, 100, 102).map(([x, y, r]) => K.shrimp(p, x, y, 10, r, { c: '#e88a5a' })),
        `<path d="M54,86 Q62,64 86,54" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),

    // 油飯: 碗に、つやのある茶色のもち米、豚肉の細切り、しいたけ、蝦米、油蔥酥、香菜、甘い辣椒醬
    tw_youfan: p => [
        K.bowl(p, { R: 92, glaze: '#8a5a3a', inside: '#f4ecdc', lip: .87 }),
        xtwRice(p, 100, 101, 148, { density: 1.1, grain: 4.4, tint: '#bf8448', hiK: .45, sdOp: .35, base: '#9a6430' }),
        `<path ${T(100, 101)} d="${xtwSmooth(ring(72, 14, .07, rng('yfa'), 1, 1))}" fill="#9a6232" opacity=".18"/>`,
        xtwStrips(p, 100, 102, 112, { c: '#b06a3a', n: 18, w: 3.4, len: .2, seed: 2, gloss: .45 }),
        xtwStrips(p, 100, 102, 110, { c: '#4a2c1c', n: 12, w: 2.8, len: .16, seed: 3, gloss: .4 }),
        ...xtwSpots('yfs', 10, 52, 15, 100, 102).map(([x, y, r]) => K.shrimp(p, x, y, 11, r, { c: '#e2784a' })),
        xtwGrains(p, 100, 102, 120, { cols: ['#a8642a', '#c4823c', '#8a4c1c'], n: 46, size: 1.6, seed: 4 }),
        `<path ${T(134, 130)} d="${xtwSmooth(ring(14, 10, .3, rng('yfc'), 1.3, .7))}" fill="#e0563e" opacity=".85"/><path d="M126,127 Q132,124 140,126" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>`,
        xtwCilantro(p, 80, 76, 22, -20), xtwCilantro(p, 94, 68, 20, 30), xtwCilantro(p, 70, 90, 18, -60),
        `<path d="M54,88 Q62,66 86,56" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35"/>`,
    ].join(''),
    // 紅燒牛肉麵: 大きな碗に、赤茶色のつやのある紅燒の汁、太い麺、大きな牛すねのかたまり、青梗菜、ねぎ、酸菜
    tw_niuroumian: p => [
        K.bowl(p, { R: 94, glaze: '#3e3a40', inside: '#f2ece0', lip: .88 }),
        K.liquid(p, { R: 81, c: '#8a3a1a', op: 1, shine: false }),
        K.noodles(p, 100, 104, 140, { c: '#ecd49a', w: 4.4, n: 20, seed: 2, sy: .9 }),
        `<circle cx="100" cy="100" r="81" fill="#8a3a1a" opacity=".35"/>`,
        xtwOil(p, 100, 100, 150, { n: 16, c: '#d8582a', op: .55, rmax: 2.6 }),
        xtwBeefChunk(p, 74, 72, 44, -20, { seed: 1 }), xtwBeefChunk(p, 120, 66, 42, 15, { seed: 2 }), xtwBeefChunk(p, 140, 106, 42, 80, { seed: 3 }),
        xtwBeefChunk(p, 64, 112, 40, 60, { seed: 4 }), xtwBeefChunk(p, 100, 96, 44, -5, { seed: 5, c: '#7a3a1c' }),
        xtwBokChoy(p, 110, 138, 58, 10), xtwBokChoy(p, 76, 140, 50, 150),
        xtwGrains(p, 136, 136, 26, { cols: ['#7a7a2a', '#8e8a34', '#6a6a22'], n: 22, size: 2.2, seed: 3 }),
        xtwScallions(p, 100, 92, 100, { n: 16 }),
        xtwShine(100, 100, 81, .35),
    ].join(''),

    // 雞肉飯: 飯碗の白いご飯に、裂いた鶏むねをたっぷりのせ、油蔥酥と金色の葱油、黄色いたくあん
    tw_jiroufan: p => [
        xtwBowl(p, { R: 92, flowers: 3 }),
        xtwRice(p, 100, 101, 148, { density: 1.1, grain: 4 }),
        `<path ${T(98, 102)} d="${xtwSmooth(ring(46, 12, .22, rng('jrf'), 1.05, .92))}" fill="#d8a448" opacity=".45"/>`,
        `<g ${p.sh(.6)}>${xtwStrips(p, 98, 102, 96, { c: '#f2e2c0', n: 44, w: 3.8, len: .3, seed: 1, curve: .35, gloss: .5 })}${xtwStrips(p, 98, 102, 84, { c: '#e8cc9a', n: 18, w: 3.2, len: .28, seed: 2, curve: .35, gloss: .4 })}</g>`,
        xtwGrains(p, 98, 102, 84, { cols: ['#a8642a', '#c4823c', '#8a4c1c'], n: 40, size: 1.6, seed: 3 }),
        xtwOil(p, 98, 102, 90, { n: 10, c: '#f0b840', op: .6, rmax: 1.8 }),
        xtwPickledRadish(p, 140, 128, 24, -30), xtwPickledRadish(p, 130, 142, 22, 10),
        `<path d="M54,86 Q62,64 86,54" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),

    // 麻醬麵: 白い碗に、細い麺をこんもり、まん中に芝麻醬、きゅうりの千切り、ねぎ、ラー油を少し
    tw_majiangmian: p => [
        xtwStallBowl(p, { c: '#2f6a9e' }),
        K.noodles(p, 100, 102, 150, { c: '#f2dc9e', w: 3, n: 28, seed: 1, sy: .92 }),
        `<path ${T(96, 98)} d="${xtwSmooth(ring(40, 14, .4, rng('mjm'), 1.2, .9))}" fill="#a8703a" opacity=".85"/>`,
        `<path ${T(94, 96)} d="${xtwSmooth(ring(30, 12, .35, rng('mjm2'), 1.15, .85))}" fill="#c08a52"/>`,
        K.noodles(p, 100, 102, 120, { c: '#e2bf82', w: 2.8, n: 8, seed: 7, sy: .92, outline: '#9a6a3a' }),
        `<path ${T(90, 92)} d="${xtwSmooth(ring(14, 10, .35, rng('mjm3'), 1.2, .8))}" fill="#d2a066" opacity=".8"/>`,
        `<path d="M74,90 Q84,76 102,78" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`,
        `<path ${T(112, 108)} d="${xtwSmooth(ring(8, 8, .3, rng('mjr'), 1.3, .7))}" fill="#c8301a" opacity=".7"/>`,
        `<g ${p.sh(.6)}>${xtwStrips(p, 132, 128, 50, { c: '#8cc456', n: 20, w: 2.8, len: .55, seed: 2, dir: -.6, gloss: .3 })}${xtwStrips(p, 132, 128, 40, { c: '#e6f2c8', n: 8, w: 2.4, len: .5, seed: 3, dir: -.6, gloss: 0 })}</g>`,
        xtwScallions(p, 80, 112, 46, { n: 12 }),
        K.sesame(p, 96, 96, 40, { n: 12 }),
    ].join(''),

    // 沙茶羊肉: 白い皿に、沙茶醬でからめた薄切り羊肉、玉ねぎ、ねぎのぶつ切り、赤唐辛子
    tw_shacha_yangrou: p => [
        xtwPlate(p),
        xtwSauce(p, 100, 104, 128, '#7a4420', { op: .6 }),
        `<g ${p.sh(1)}>`,
        ...[[80, 80, 10], [122, 76, -30], [100, 108, 50], [66, 110, -20], [138, 110, 60], [90, 138, 120], [126, 136, -60], [106, 60, 30], [60, 84, 70], [148, 86, 100], [112, 92, 160], [74, 130, 0]].map(([x, y, r], i) => K.beefSlice(p, x, y, 36, r, { c: i % 2 ? '#8a5034' : '#7a462c', seed: i + 1 })),
        `</g>`,
        ...[[96, 92, 30], [124, 104, -40], [72, 98, 70], [132, 76, -10], [104, 128, 20], [62, 124, 100], [142, 128, 50]].map(([x, y, r]) => K.onion(p, x, y, 24, r, { c: '#e8c88a' })),
        ...[[88, 70, 140], [146, 98, 80], [112, 84, 60], [70, 76, -60], [118, 148, 110], [84, 112, 20], [56, 102, -10]].map(([x, y, r], i) => xtwScallionSeg(p, x, y, 24, r, { green: i % 3 !== 0 })),
        xtwGrains(p, 100, 104, 116, { cols: ['#8a4a1c', '#a85e24', '#6e3a16'], n: 70, size: 1.3, seed: 2 }),
        xtwChiliRing(p, 104, 110, 9, 20), xtwChiliRing(p, 80, 120, 8, -50), xtwChiliRing(p, 130, 118, 8, 70), xtwChiliRing(p, 116, 66, 8, 0),
    ].join(''),

    // 胡椒蝦: 白い皿に、殻つきのえびを黒胡椒とにんにくで炒め、粗びき胡椒がたっぷり
    tw_hujiao_xia: p => [
        xtwRimPlate(p, { line: '#2a2a2a', dots: false }),
        ...[[74, 80, 20], [126, 74, 80], [134, 128, 170], [96, 110, -20], [66, 132, -80], [104, 64, 140]].map(([x, y, r], i) => xtwShrimpShell(p, x, y, 66, r, { c: i % 2 ? '#de5a2e' : '#e86a36', seed: i })),
        ...[[96, 86, 20], [124, 100, -30], [80, 112, 60], [112, 120, 100], [132, 84, 10], [70, 92, -50], [96, 130, 30]].map(([x, y, r]) => xtwGarlic(p, x, y, 12, r, { c: '#e8c27a' })),
        xtwGrains(p, 100, 104, 120, { cols: ['#3a3028', '#4e4034', '#2a2018'], n: 160, size: .8, seed: 2 }),
        xtwScallions(p, 104, 102, 90, { n: 10 }),
    ].join(''),

    // 紅糟肉: 白い皿に、紅糟に漬けて揚げた豚肉の薄切り（赤い衣と淡い桃色の断面）を並べ、きゅうり
    tw_hongzao_rou: p => [
        xtwPlate(p),
        `<g>`,
        ...[[52, 98, -50], [62, 78, -36], [78, 64, -20], [98, 58, -4], [118, 62, 12], [136, 72, 28], [148, 90, 44]].map(([x, y, r], i) => xtwHongzao(p, x, y + 6, 26, 42, r, { seed: i })),
        ...[[70, 120, -30], [88, 108, -12], [108, 106, 6], [126, 114, 24]].map(([x, y, r], i) => xtwHongzao(p, x, y + 8, 26, 40, r, { seed: i + 7 })),
        `</g>`,
        ...[[84, 150], [102, 154], [120, 150], [138, 140], [66, 142]].map(([x, y], i) => K.cucumberSlice(p, x, y, 18, i * 40, { oval: 1.25 })),
        xtwGrains(p, 100, 104, 100, { cols: ['#f2ead8'], n: 14, size: 1.3, seed: 3 }),
    ].join(''),

    // 滷雞腿: 茶色の鉢に、醤油と氷砂糖で煮た照りの鶏ももの骨つき、滷蛋、豆干、八角、煮汁
    tw_lu_jitui: p => [
        K.bowl(p, { R: 92, glaze: '#7a5a3a', inside: '#efe4d0', lip: .87 }),
        K.liquid(p, { R: 78, c: '#5a3014', op: 1, shine: false }),
        `<circle cx="100" cy="100" r="62" fill="#8a4a1a" opacity=".3"/>`,
        xtwDougan(p, 140, 132, 28, 26, 14), xtwDougan(p, 60, 72, 26, 24, -18),
        xtwLuEggWhole(p, 136, 68, 34, 30), xtwLuEgg(p, 62, 128, 34, -20),
        xtwDrum(p, 98, 82, 92, 22, { c: '#7e3c14', seed: 1 }),
        xtwDrum(p, 104, 124, 90, -160, { c: '#8a4418', seed: 2 }),
        xtwStarAnise(p, 146, 102, 16, 20), xtwStarAnise(p, 56, 100, 14, -10),
        xtwScallions(p, 100, 104, 80, { n: 8 }),
        xtwOil(p, 100, 100, 140, { n: 8, c: '#c8822a', op: .45, rmax: 1.6 }),
        xtwShine(100, 100, 78, .35),
    ].join(''),

    // 客家小炒: 白い皿に、豚ばら・するめ・豆干の細切り、芹菜、ねぎ、赤唐辛子を醤油で香ばしく炒めたもの
    tw_kejia_xiaochao: p => [
        xtwRimPlate(p, { line: '#2f6a9e' }),
        xtwSauce(p, 100, 104, 128, '#8a5a2a', { op: .45 }),
        `<g ${p.sh(.8)}>`,
        xtwStrips(p, 100, 102, 116, { c: '#e6a052', n: 14, w: 4.6, len: .34, seed: 1, curve: .35, gloss: .5 }),
        xtwStrips(p, 100, 102, 116, { c: '#7a4a24', n: 13, w: 5.4, len: .32, seed: 2, curve: .1, gloss: .3 }),
        xtwStrips(p, 100, 102, 112, { c: '#c48a62', n: 12, w: 5, len: .3, seed: 3, curve: .2, gloss: .5 }),
        `</g>`,
        ...xtwSpots('kjx', 12, 52, 16, 100, 102).map(([x, y, r]) => xtwStick(p, x, y, 26, 4, r, '#6aaa3a')),
        ...xtwSpots('kjs', 6, 46, 20, 100, 102).map(([x, y, r], i) => xtwScallionSeg(p, x, y, 22, r, { green: i % 2 === 0 })),
        xtwChiliRing(p, 104, 110, 9, 20), xtwChiliRing(p, 80, 92, 8, -50), xtwChiliRing(p, 126, 124, 8, 70), xtwChiliRing(p, 120, 78, 8, 0),
    ].join(''),

    // 麻油麵線: 碗に、黒ごま油でつやの出た細い麺線、ふちのこんがりした目玉焼き、老しょうが、青菜
    tw_mayou_mianxian: p => [
        K.bowl(p, { R: 92, glaze: '#2e2a28', inside: '#f0e8da', lip: .87 }),
        `<circle cx="100" cy="100" r="74" fill="${p.rg('#8a5a2a', .2, .3)}"/>`,
        K.noodles(p, 100, 102, 146, { c: '#d8ae6a', w: 2.3, n: 32, seed: 1, sy: .92, outline: '#9a6a32' }),
        xtwBokChoy(p, 140, 120, 46, -30, { c: '#3a8a2a' }), xtwBokChoy(p, 60, 118, 44, 200, { c: '#3a8a2a' }),
        `<g ${p.sh(1)}>${K.friedEgg(p, 100, 92, 74, -10)}</g>`,
        `<circle cx="100" cy="92" r="32" fill="none" stroke="#a8641a" stroke-width="5" opacity=".35"/>`,
        xtwGinger(p, 132, 74, 18, 20), xtwGinger(p, 70, 80, 17, -40), xtwGinger(p, 104, 140, 16, 70), xtwGinger(p, 128, 148, 15, 10),
        xtwOil(p, 100, 100, 140, { n: 10, c: '#6a3a14', op: .45, rmax: 2 }),
    ].join(''),

    // 豆酥鱈魚: 楕円の魚皿に、蒸した鱈の輪切りに、こんがり炒めた豆酥をたっぷりのせ、ねぎ
    tw_dousu_xueyu: p => [
        xtwOval(p),
        xtwSauce(p, 100, 104, 150, '#d8b884', { op: .5, sy: .6 }),
        xtwCodSteak(p, 72, 100, 70, 80, -8, { seed: 1 }),
        xtwCodSteak(p, 130, 100, 68, 78, 10, { seed: 2 }),
        `<g ${p.sh(.6)}>${xtwGrains(p, 72, 98, 66, { cols: ['#b8762e', '#9a5a1c', '#d09040', '#7a4414'], n: 165, size: 2.2, seed: 1 })}${xtwGrains(p, 130, 98, 64, { cols: ['#b8762e', '#9a5a1c', '#d09040', '#7a4414'], n: 165, size: 2.2, seed: 2 })}</g>`,
        xtwScallions(p, 72, 94, 46, { n: 9 }), xtwScallions(p, 130, 94, 44, { n: 9 }),
        xtwChiliRing(p, 84, 84, 6, 20), xtwChiliRing(p, 124, 110, 6, -40),
    ].join(''),

    // 炒水蓮: 白い皿に、細長い水蓮の茎をつやよく炒め、にんにくの薄切り、赤唐辛子
    tw_chao_shuilian: p => {
        const R = rng(p.id + 'sl');
        let g = '';
        for (let i = 0; i < 64; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * 52, x = 100 + Math.cos(a) * d, y = 102 + Math.sin(a) * d * .95, rr = -30 + (R() - .5) * 70; g += xtwStick(p, x, y, 40 + R() * 12, 3.4, rr, R() < .5 ? '#5aa034' : '#6cb042', { gloss: .5 }); }
        return [
            xtwPlate(p),
            `<g ${p.sh(.5)}>${g}</g>`,
            ...xtwSpots('slg', 9, 46, 14, 100, 102).map(([x, y, r]) => xtwGarlicSlice(p, x, y, 8, r)),
            xtwChiliRing(p, 104, 110, 8, 20), xtwChiliRing(p, 80, 92, 7, -50), xtwChiliRing(p, 126, 124, 7, 70), xtwChiliRing(p, 120, 80, 7, 0), xtwChiliRing(p, 76, 128, 7, 30),
            xtwOil(p, 100, 102, 110, { n: 8, c: '#e8e0a0', op: .4, rmax: 1.4 }),
        ].join('');
    },
    // 白菜滷: 深い鉢に、くたっと煮た白菜（白い軸と黄緑の葉）、しいたけ、にんじん、蛋酥（揚げ卵のかりかり）、豚肉、淡い茶色の煮汁
    tw_baicai_lu: p => [
        K.bowl(p, { R: 92, glaze: '#b89a6a', inside: '#f4ecdc', lip: .87 }),
        K.liquid(p, { R: 78, c: '#d8b880', op: .95, shine: false }),
        `<g ${p.sh(.5)}>`,
        ...[[70, 72, 30], [122, 64, -20], [144, 108, 80], [60, 122, 110], [106, 144, 10], [100, 96, -40], [136, 142, 50]].map(([x, y, r], i) => K.leafPiece(p, x, y, 50, r, { c: i % 2 ? '#c8d890' : '#d6e2a2', vein: '#f8f8e8', seed: i, cooked: true })),
        ...[[86, 80, 20], [126, 94, -30], [74, 104, 70], [118, 122, 110], [90, 130, -60], [142, 74, 40], [56, 92, 90], [104, 60, 150]].map(([x, y, r]) => K.napaStem(p, x, y, 46, r)),
        `</g>`,
        `<circle cx="100" cy="100" r="78" fill="#d8b880" opacity=".2"/>`,
        ...[[106, 80, 10], [74, 132, 60], [140, 124, -20]].map(([x, y, r]) => K.shiitake(p, x, y, 18, r, { cross: false })),
        xtwStrips(p, 100, 100, 110, { c: '#ec7a2a', n: 10, w: 2.4, len: .22, seed: 2 }),
        xtwPorkShreds(p, 100, 100, 100, { seed: 4, n: 8 }),
        `<g ${p.sh(.4)}>${xtwGrains(p, 100, 100, 100, { cols: ['#eab448', '#f4cc64', '#d89a30'], n: 40, size: 3, seed: 3 })}</g>`,
        xtwShine(100, 100, 78, .35),
    ].join(''),

    // 薑絲炒絲瓜: 青磁の鉢に、透き通った淡い緑の絲瓜、針しょうが、蝦米、とろりとした汁
    tw_jiangsi_sigua: p => [
        K.bowl(p, { R: 92, glaze: '#7ea898', inside: '#eef4ec', lip: .87 }),
        K.liquid(p, { R: 78, c: '#ecebd0', op: .8, shine: false }),
        ...xtwSpots('sg', 13, 56, 24, 100, 100).map(([x, y, r, q], i) => xtwLoofah(p, x, y, 38 + q * 6, r, { seed: i })),
        `<circle cx="100" cy="100" r="78" fill="#e8ecc4" opacity=".18"/>`,
        xtwFineShreds(p, 100, 100, 100, { c: '#f2dc92', n: 12, w: 1.3, seed: 2, dir: -.4, len: .22 }),
        ...xtwSpots('sgs', 6, 46, 20, 100, 100).map(([x, y, r]) => K.shrimp(p, x, y, 10, r, { c: '#e8865a' })),
        xtwShine(100, 100, 78, .4),
    ].join(''),

    // 番茄切盤: 白い皿に、くし切りのトマトをぐるりと並べ、まん中に醤油膏・しょうが・砂糖の黒いたれ
    tw_fanqie_qiepan: p => [
        xtwRimPlate(p, { line: '#c0402e' }),
        ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.28 - 1.2; return K.tomatoWedge(p, 100 + Math.cos(a) * 50, 100 + Math.sin(a) * 50, 42, a * 57.3 - 90); }),
        `<g ${p.sh(1)}><circle cx="100" cy="100" r="25" fill="${p.rg('#fbfaf6', .1, .15, .6, .6)}" stroke="#2f5f9e" stroke-width="1.6"/></g>`,
        `<circle cx="100" cy="100" r="19" fill="${p.rg('#3a1c0e', .25, .2)}"/>`,
        `<path ${T(104, 102)} d="${xtwSmooth(ring(6, 8, .4, rng('fqj'), 1.2, .8))}" fill="#e8c878"/>`,
        `<path d="M88,94 Q94,86 104,87" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>`,
    ].join(''),

    // 滷筍乾: 小鉢に、醤油で長く煮た濃い茶色の筍乾（繊維の筋）、豚ばら、煮汁
    tw_lu_sungan: p => [
        K.kobachi(p, { R: 92, glaze: '#5a4a3e', inside: '#efe6d4' }),
        K.liquid(p, { R: 74, c: '#5a3416', op: .95, shine: false }),
        `<g ${p.sh(.6)}>`,
        xtwStrips(p, 100, 100, 136, { c: '#8a5a2a', n: 26, w: 5, len: .36, seed: 1, curve: .2, gloss: .4 }),
        xtwStrips(p, 100, 100, 130, { c: '#6a4018', n: 22, w: 4.4, len: .34, seed: 2, curve: .2, gloss: .35 }),
        xtwStrips(p, 100, 100, 120, { c: '#a8763a', n: 14, w: 3.6, len: .32, seed: 3, curve: .2, gloss: .45 }),
        `</g>`,
        ...xtwSpots('sgp', 6, 44, 24, 100, 100).map(([x, y, r], i) => xtwLuRou(p, x, y, 20, 11, r, { seed: i })),
        xtwOil(p, 100, 100, 130, { n: 10, c: '#c88a2a', op: .45, rmax: 1.6 }),
        xtwShine(100, 100, 74, .35),
    ].join(''),

    // 炒酸菜: 小鉢に、細かく刻んだ黄緑の酸菜を砂糖とにんにくで炒め、赤唐辛子
    tw_chao_suancai: p => [
        K.kobachi(p, { R: 92, glaze: '#d8cfb8', inside: '#f6f2e6' }),
        `<g ${p.sh(1)}><path ${T(100, 100)} d="${xtwSmooth(ring(68, 14, .12, rng('scb'), 1, .96))}" fill="${p.rg('#9a9a3a', .25, .3)}"/></g>`,
        xtwGrains(p, 100, 100, 134, { cols: ['#a8a23e', '#8e8a2c', '#c2b858', '#b4aa48'], n: 260, size: 3, seed: 1 }),
        xtwStrips(p, 100, 100, 120, { c: '#c8c070', n: 18, w: 3.4, len: .14, seed: 2, gloss: .4 }),
        xtwGrains(p, 100, 100, 120, { cols: ['#f2ecc8'], n: 20, size: 1.6, seed: 3 }),
        ...[[96, 92, 20], [124, 110, -40], [76, 118, 70], [112, 72, -10], [134, 84, 30], [70, 84, 60], [100, 132, 100]].map(([x, y, r]) => xtwChiliRing(p, x, y, 9, r)),
        xtwOil(p, 100, 100, 120, { n: 8, c: '#f0e6a0', op: .45, rmax: 1.4 }),
    ].join(''),

    // 滷花生: 小鉢に、赤茶の薄皮つきの落花生を醤油と八角で煮たもの、少しの煮汁
    tw_lu_huasheng: p => [
        K.kobachi(p, { R: 92, glaze: '#9fbfae' }),
        K.liquid(p, { R: 74, c: '#5a3416', op: .9, shine: false }),
        `<g ${p.sh(.4)}>`,
        ...xtwSpots('lhs', 54, 64, 11.5, 100, 100).map(([x, y, r, q], i) => xtwPeanut(p, x, y, 16 + q * 3, r, { c: i % 3 ? '#8a3a22' : '#a0482a' })),
        `</g>`,
        xtwStarAnise(p, 118, 88, 22, 20), xtwStarAnise(p, 78, 120, 18, -15),
        xtwShine(100, 100, 74, .35),
    ].join(''),

    // 香煎豆腐: 白い皿に、両面をこんがり焼いた厚切り豆腐を重ねて並べ、醤油膏とねぎ
    tw_xiangjian_doufu: p => [
        xtwPlate(p),
        ...[[66, 76, -8], [102, 70, 4], [138, 78, 12], [62, 112, -4], [100, 108, 6], [138, 116, -6], [82, 144, 4], [120, 146, -10]].map(([x, y, r], i) => xtwTofuSlab(p, x, y, 38, 30, r, { seed: i })),
        `<path d="M56,96 Q80,86 104,96 T150,94 M66,130 Q90,122 112,132 T150,130" stroke="#4a220c" stroke-width="4.6" fill="none" stroke-linecap="round" opacity=".6"/><path d="M60,94 Q80,86 100,93 M70,128 Q90,121 108,129" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/>`,
        xtwScallions(p, 100, 106, 100, { n: 18 }),
    ].join(''),

    // 小魚乾炒山蘇: 白い皿に、濃い緑の山蘇の葉、銀色の小魚乾、赤唐辛子、豆豉
    tw_chao_shansu: p => {
        const R = rng(p.id + 'ss');
        let g = '';
        for (const [x, y, r] of xtwSpots('ssf', 17, 54, 17, 100, 102)) g += xtwFern(p, x, y, 32 + R() * 10, 14 + R() * 3, r, { c: R() < .5 ? '#2a6a24' : '#347a2c' });
        return [
            xtwRimPlate(p, { line: '#3d7a52' }),
            `<g ${p.sh(.7)}>${g}</g>`,
            ...xtwSpots('ssa', 14, 54, 13, 100, 102).map(([x, y, r]) => xtwAnchovy(p, x, y, 22, r)),
            xtwGrains(p, 100, 102, 104, { cols: ['#24160e', '#3a2416'], n: 14, size: 2, seed: 2 }),
            ...[[96, 92, 20], [124, 110, -40], [76, 118, 70], [112, 72, -10], [134, 84, 30]].map(([x, y, r]) => xtwChiliRing(p, x, y, 9, r)),
            xtwOil(p, 100, 102, 110, { n: 8, c: '#e8e0a0', op: .4, rmax: 1.4 }),
        ].join('');
    },

    // 炒蒲瓜: 深めの白い碗に、透き通った淡い緑白の蒲瓜の細切り、蝦米、にんじん、とろりとした汁
    tw_chao_puagua: p => [
        xtwBowl(p, { R: 92, flowers: 3 }),
        K.liquid(p, { R: 78, c: '#e8e4c4', op: .8, shine: false }),
        `<g ${p.sh(.5)}>`,
        xtwStrips(p, 100, 100, 140, { c: '#e2eac0', n: 34, w: 6.4, len: .3, seed: 1, curve: .15, gloss: .55 }),
        xtwStrips(p, 100, 100, 130, { c: '#ecf0d4', n: 22, w: 6, len: .3, seed: 2, curve: .15, gloss: .55 }),
        `</g>`,
        xtwStrips(p, 100, 100, 112, { c: '#ec7a2a', n: 12, w: 2.6, len: .24, seed: 3 }),
        ...xtwSpots('pgs', 9, 50, 18, 100, 100).map(([x, y, r]) => K.shrimp(p, x, y, 11, r, { c: '#e8865a' })),
        xtwGrains(p, 100, 100, 110, { cols: ['#a8642a', '#c4823c'], n: 16, size: 1.4, seed: 4 }),
        xtwShine(100, 100, 78, .4),
    ].join(''),

    // 馬鈴薯沙拉: 小鉢に、甘いマヨネーズであえたつぶしたじゃがいもの山、にんじん・きゅうり・コーン・卵
    tw_malingshu_shala: p => {
        const R = rng(p.id + 'ml');
        let d = '';
        for (const [x, y, r, q] of xtwSpots('mld', 34, 54, 11, 100, 100)) d += xtwDice(p, x, y, 6 + q * 2, r, q < .3 ? '#ef8a3a' : q < .55 ? '#7ab84a' : q < .75 ? '#f8f4e6' : '#f6cf3a');
        return [
            K.kobachi(p, { R: 92, glaze: '#c9d8e6', inside: '#f4f6f8' }),
            `<g ${p.sh(1.4)}><g ${p.rough(3, .08)}><path ${T(100, 100)} d="${xtwSmooth(ring(68, 14, .1, R, 1, .96))}" fill="${p.rg('#f6e6b0', .35, .2, .38, .34)}"/></g></g>`,
            `<g ${p.rough(2.4, .12)}>${[[84, 84, 22], [118, 90, 20], [100, 118, 24], [70, 114, 16], [130, 122, 16]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fbf0c8" opacity=".55"/>`).join('')}</g>`,
            d,
            `<path d="M58,90 Q66,66 92,58" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
        ].join('');
    },
    // 涼筍沙拉: 白い皿に、ゆでて冷やした綠竹筍の乱切りを山にして、甘いマヨネーズを細く絞る
    tw_liangsun: p => [
        xtwPlate(p),
        `<g ${p.sh(.4)}>`,
        ...xtwSpots('ls', 13, 46, 24, 100, 102).map(([x, y, r, q], i) => xtwShoot(p, x, y, 36 + q * 8, r, { c: i % 3 ? '#f2e8c4' : '#ece0ae', seed: i })),
        `</g>`,
        K.drizzle(p, 98, 96, 96, 18, { c: '#fdf6dc', width: 3, n: 7, r: -20 }),
        K.drizzle(p, 104, 118, 78, 14, { c: '#fdf6dc', width: 3, n: 6, r: -20 }),
    ].join(''),

    // 燙秋葵: 白い角皿に、ゆでた鮮やかな緑のオクラを並べ、醤油膏とおろしにんにく、わさび
    tw_tang_qiukui: p => [
        K.squareDish(p, { s: 168, base: '#f6f4ee', rim: '#2f5f9e' }),
        ...[[70, 64], [96, 58], [122, 52], [64, 92], [90, 86], [116, 80], [142, 74], [62, 122], [88, 116], [114, 110], [140, 104], [84, 146], [110, 140], [136, 134]].map(([x, y], i) => xtwOkraPod(p, x + 2, y + 4, 52, 50 + (i % 3) * 5, { c: i % 2 ? '#4a9a30' : '#56a636' })),
        `<path d="${xtwSmooth(ring(22, 10, .35, rng('qkj'), 1.6, .5))}" transform="translate(104 102) rotate(-30)" fill="#4a220c" opacity=".6"/>`,
        xtwGrains(p, 112, 102, 30, { cols: ['#f6efd8', '#ece0bc'], n: 16, size: 1.6, seed: 2 }),
        `<g ${p.sh(.5)}><path ${T(150, 64)} d="${xtwSmooth(ring(8, 8, .3, rng('wsb'), 1.2, .9))}" fill="${p.rg('#9ac86a', .3, .25)}"/></g>`,
    ].join(''),

    // 台式泡菜: 小鉢に、甘酢に漬けた淡い緑白のキャベツ、にんじんの薄切り、赤唐辛子、にんにく
    tw_paocai: p => [
        K.kobachi(p, { R: 92, glaze: '#e4ddd0', inside: '#f6f4ee' }),
        K.liquid(p, { R: 74, c: '#f0ecd0', op: .7, shine: false }),
        `<g ${p.sh(.4)}>`,
        ...xtwSpots('pc', 13, 52, 21, 100, 100).map(([x, y, r, q], i) => xtwCabbage(p, x, y, 40 + q * 8, r, { c: i % 3 ? '#d6e4ae' : '#c2d892', seed: i })),
        `</g>`,
        ...[[80, 80], [120, 76], [134, 116], [92, 124], [64, 108], [108, 100], [112, 144], [70, 140]].map(([x, y], i) => K.carrotRound(p, x, y, 15, { c: '#f08a3a', half: i % 2 === 1, r: i * 40 })),
        xtwChiliRing(p, 100, 88, 10, 20), xtwChiliRing(p, 124, 98, 9, -40), xtwChiliRing(p, 86, 108, 9, 70), xtwChiliRing(p, 112, 126, 9, 0),
        xtwGarlicSlice(p, 72, 92, 9, 20), xtwGarlicSlice(p, 140, 132, 9, -30), xtwGarlicSlice(p, 98, 140, 9, 60),
        xtwShine(100, 100, 74, .4),
    ].join(''),

    // 炒龍鬚菜: 白い皿に、龍鬚菜（佛手瓜の若い茎と葉、くるりとした巻きひげ）をにんにくで炒め、蝦米
    tw_chao_longxucai: p => {
        const R = rng(p.id + 'lx');
        let g = '';
        for (const [x, y, r] of xtwSpots('lxs', 26, 54, 12, 100, 102)) g += xtwStick(p, x, y, 40 + R() * 12, 3.4, -30 + (r % 70), R() < .5 ? '#7ab448' : '#8cc458', { gloss: .5 });
        for (const [x, y, r] of xtwSpots('lxl', 9, 48, 22, 100, 102)) g += xtwSPLeaf(p, x, y, 20 + R() * 4, r, { c: R() < .5 ? '#3f8a30' : '#4c9a38' });
        let t = '';
        for (const [x, y, r] of xtwSpots('lxt', 14, 54, 15, 100, 102)) t += xtwTendril(x, y, 16, r, '#b4d878');
        return [
            xtwPlate(p),
            `<g ${p.sh(.6)}>${g}</g>`, t,
            ...xtwSpots('lxg', 8, 44, 16, 100, 102).map(([x, y, r]) => xtwGarlicSlice(p, x, y, 8, r)),
            ...xtwSpots('lxp', 7, 46, 18, 100, 102).map(([x, y, r]) => K.shrimp(p, x, y, 10, r, { c: '#e8865a' })),
            xtwOil(p, 100, 102, 110, { n: 8, c: '#eee6b0', op: .4, rmax: 1.4 }),
        ].join('');
    },

    // 涼拌雞絲: 白い皿に、きゅうりの千切りを敷き、裂いた鶏むね、にんじん、醤油と黒酢とごま油のたれ、香菜
    tw_liangban_jisi: p => [
        xtwRimPlate(p, { line: '#2f6a9e' }),
        `<g ${p.sh(.5)}>${xtwStrips(p, 100, 102, 130, { c: '#7ab84a', n: 34, w: 3, len: .32, seed: 1, gloss: .3 })}${xtwStrips(p, 100, 102, 126, { c: '#e2f0c4', n: 18, w: 2.6, len: .3, seed: 2, gloss: 0 })}</g>`,
        xtwSauce(p, 100, 102, 104, '#8a4a22', { op: .45 }),
        `<g ${p.sh(.6)}>${xtwStrips(p, 100, 100, 100, { c: '#f2e4c6', n: 40, w: 3.6, len: .3, seed: 3, curve: .3, gloss: .5 })}</g>`,
        xtwStrips(p, 100, 100, 104, { c: '#ef7f30', n: 12, w: 2.2, len: .28, seed: 4 }),
        xtwGrains(p, 100, 100, 70, { cols: ['#f6efd8'], n: 14, size: 1.4, seed: 5 }),
        xtwCilantro(p, 92, 84, 20, -20), xtwCilantro(p, 112, 92, 18, 30), xtwCilantro(p, 100, 112, 18, 80),
        K.sesame(p, 100, 100, 70, { n: 14 }),
    ].join(''),

    // 鹹蜆仔: 小鉢に、醤油漬けの小さな黒緑の蜆（口が開いて身が見える）、にんにく、赤唐辛子
    tw_xian_xianzai: p => [
        K.kobachi(p, { R: 92, glaze: '#f0ece2', inside: '#f6f4ee' }),
        K.liquid(p, { R: 74, c: '#4a2a12', op: .9, shine: false }),
        `<g>`,
        ...xtwSpots('xz', 34, 62, 13.5, 100, 100).map(([x, y, r, q], i) => xtwXian(p, x, y, 20 + q * 4, r, { seed: i })),
        `</g>`,
        ...[[96, 92, 20], [124, 110, -40], [76, 118, 70], [112, 72, -10], [70, 84, 60]].map(([x, y, r]) => xtwChiliRing(p, x, y, 9, r)),
        ...[[108, 120], [86, 76], [132, 88], [64, 104], [100, 140]].map(([x, y], i) => xtwGarlicSlice(p, x, y, 9, i * 50)),
        xtwShine(100, 100, 74, .35),
    ].join(''),

    // 沙茶空心菜: 白い皿に、空心菜（穴のあいた茎と細長い葉）を沙茶醬で炒め、赤唐辛子、にんにく
    tw_shacha_kongxincai: p => {
        const R = rng(p.id + 'kx');
        let g = '';
        for (const [x, y, r] of xtwSpots('kxs', 16, 52, 14, 100, 102)) g += xtwHollowStem(p, x, y, 30 + R() * 8, 5.6, r, { c: R() < .5 ? '#7ab448' : '#8ac25a' });
        for (const [x, y, r] of xtwSpots('kxl', 14, 52, 16, 100, 102)) g += xtwLongLeaf(p, x, y, 40 + R() * 8, r, { c: R() < .5 ? '#2f7a2a' : '#3a8a32', w: .3 });
        return [
            xtwRimPlate(p, { line: '#b8402e', dots: true }),
            xtwSauce(p, 100, 104, 126, '#7a5a2a', { op: .5 }),
            `<g ${p.sh(.6)}>${g}</g>`,
            xtwGrains(p, 100, 102, 112, { cols: ['#8a5a2a', '#a06a32', '#6e4420'], n: 60, size: 1.3, seed: 2 }),
            ...[[96, 92, 20], [124, 110, -40], [76, 118, 70], [112, 72, -10], [134, 84, 30]].map(([x, y, r]) => xtwChiliRing(p, x, y, 9, r)),
            ...xtwSpots('kxg', 6, 44, 16, 100, 102).map(([x, y, r]) => xtwGarlicSlice(p, x, y, 8, r)),
        ].join('');
    },

    // 鹽酥杏鮑菇: 白い皿に、角切りの杏鮑菇をさつまいも粉で揚げ（白い断面がのぞく）、揚げた九層塔、胡椒塩
    tw_yansu_xingbaogu: p => {
        const pos = xtwSpots('xbg', 14, 50, 21, 100, 102);
        return [
            xtwPlate(p),
            `<g ${p.sh(.9)}>`,
            ...pos.map(([x, y, r, q], i) => xtwNugget(p, x, y, 28 + q * 5, r, { c: i % 3 ? '#d8a04a' : '#c88c38', seed: i, cut: i % 2 ? '#f4ead0' : null })),
            `</g>`,
            ...xtwSpots('xbb', 8, 50, 22, 100, 102).map(([x, y, r]) => xtwFriedBasil(p, x, y, 20, r)),
            xtwGrains(p, 100, 102, 108, { cols: ['#f8f2e0'], n: 30, size: .8, seed: 5 }),
            xtwGrains(p, 100, 102, 108, { cols: ['#3a2a1e'], n: 26, size: .7, seed: 6 }),
            xtwChiliRing(p, 96, 96, 8, 20), xtwChiliRing(p, 126, 116, 8, -40), xtwChiliRing(p, 74, 120, 8, 60),
        ].join('');
    },

    // 滷菜頭: 深い鉢に、醤油と氷砂糖で煮て飴色になった厚切りの大根、しいたけ、煮汁
    tw_lu_caitou: p => [
        xtwBowl(p, { R: 92, flowers: 3 }),
        K.liquid(p, { R: 78, c: '#6a3a16', op: .95, shine: false }),
        ...[[72, 74, 46], [124, 70, 44], [146, 116, 40], [100, 112, 48], [60, 122, 42], [106, 152, 36]].map(([x, y, s]) => K.daikon(p, x, y, s, 0, { c: '#c88a42' })),
        ...[[100, 70, 22], [134, 94, 20], [76, 100, 20], [128, 140, 20], [82, 144, 18]].map(([x, y, s], i) => K.shiitake(p, x, y, s, i * 40, { cross: i % 2 === 0 })),
        xtwOil(p, 100, 100, 140, { n: 8, c: '#c88a2a', op: .45, rmax: 1.6 }),
        xtwShine(100, 100, 78, .35),
    ].join(''),
    // 香菇雞湯: 白い湯碗に、澄んだ金色の鶏のスープ、骨つきの鶏、まるごとのしいたけ、しょうが、鶏の脂の粒
    tw_xianggu_jitang: p => [
        xtwBowl(p, { R: 92 }),
        K.liquid(p, { R: 79, c: '#dcb460', op: .78, shine: false }),
        ...[[74, 80, 20], [124, 72, -40], [140, 116, 70], [96, 108, 140], [64, 124, -70], [112, 144, 100]].map(([x, y, r], i) => xtwSoupChk(p, x, y, 40, r, { seed: i, bone: i % 2 === 0 })),
        `<circle cx="100" cy="100" r="79" fill="#e2bc6a" opacity=".18"/>`,
        ...[[100, 74, 26], [136, 92, 24], [86, 134, 26], [62, 98, 22], [124, 124, 22], [102, 60, 0], [148, 140, 0]].filter(a => a[2]).map(([x, y, s], i) => K.shiitake(p, x, y, s, i * 37, { cross: i % 2 === 0 })),
        xtwGinger(p, 110, 100, 14, 30), xtwGinger(p, 80, 64, 13, -40),
        xtwOil(p, 100, 100, 140, { n: 16, c: '#f2c650', op: .6, rmax: 2.4 }),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 麻油雞: 砂鍋に、黒ごま油で焼いた骨つき鶏、皮つきの老しょうがの厚切りをたっぷり、米酒の琥珀色のスープ、枸杞
    tw_mayouji: p => [
        xtwSandPot(p),
        K.liquid(p, { R: 75, c: '#7a4418', op: 1, shine: false }),
        xtwOil(p, 100, 100, 140, { n: 12, c: '#3a1e0a', op: .45, rmax: 3 }),
        ...[[74, 78, 20], [122, 70, -40], [140, 112, 70], [98, 104, 140], [64, 120, -70], [108, 140, 100], [88, 60, 40]].map(([x, y, r], i) => xtwSoupChk(p, x, y, 40, r, { seed: i, c: i % 2 ? '#b8743a' : '#c8843e', bone: i % 2 === 0 })),
        `<g>${[[98, 84, 20], [132, 98, -40], [76, 104, 70], [114, 124, 110], [88, 138, -60], [140, 70, 40], [60, 82, 90], [138, 140, 10]].map(([x, y, r], i) => xtwOldGinger(p, x, y, 30, r, { seed: i })).join('')}</g>`,
        xtwGoji(p, 104, 96, 7, 20), xtwGoji(p, 84, 118, 7, -30), xtwGoji(p, 126, 108, 7, 60),
        xtwOil(p, 100, 100, 130, { n: 10, c: '#e8a840', op: .5, rmax: 1.6, seed: 2 }),
        xtwShine(100, 100, 75, .35),
    ].join(''),

    // 鳳梨苦瓜雞湯: 青磁の湯碗に、少し濁った黄色いスープ、緑の苦瓜の大きなかけら、醤鳳梨、骨つきの鶏
    tw_fengli_kugua_ji: p => [
        K.bowl(p, { R: 92, glaze: '#7ea898', inside: '#eef4ec', lip: .87 }),
        K.liquid(p, { R: 78, c: '#dcc47a', op: .9, shine: false }),
        ...[[74, 80, 20], [128, 72, -40], [100, 112, 140], [66, 128, -70], [140, 128, 100]].map(([x, y, r], i) => xtwSoupChk(p, x, y, 40, r, { seed: i, bone: i % 2 === 0 })),
        ...[[100, 70, 10], [140, 100, 80], [62, 104, -60], [116, 142, 30], [86, 140, 120]].map(([x, y, r]) => xtwBitter(p, x, y, 40, r)),
        `<circle cx="100" cy="100" r="78" fill="#e0c880" opacity=".18"/>`,
        ...[[96, 92, 20], [122, 112, -40], [80, 112, 70], [118, 86, 140], [134, 140, 0], [74, 82, 60]].map(([x, y, r]) => xtwPineapple(p, x, y, 18, r)),
        xtwOil(p, 100, 100, 130, { n: 10, c: '#f2cf6c', op: .5, rmax: 1.8 }),
        xtwShine(100, 100, 78, .4),
    ].join(''),

    // 剝皮辣椒雞湯: 白い湯碗に、醤油色の澄んだスープ、つやのある剝皮辣椒を丸ごと、骨つきの鶏、しいたけ
    tw_bopi_lajiao_ji: p => [
        xtwBowl(p, { R: 92, flowers: 4 }),
        K.liquid(p, { R: 79, c: '#c49a4a', op: .82, shine: false }),
        ...[[74, 78, 20], [126, 72, -40], [142, 118, 70], [70, 126, -70], [108, 146, 100]].map(([x, y, r], i) => xtwSoupChk(p, x, y, 40, r, { seed: i, c: '#e6c48c', bone: i % 2 === 0 })),
        `<circle cx="100" cy="100" r="79" fill="#c8a050" opacity=".15"/>`,
        xtwPeeledChili(p, 98, 96, 84, -30), xtwPeeledChili(p, 112, 122, 80, 8), xtwPeeledChili(p, 84, 116, 74, 64), xtwPeeledChili(p, 126, 92, 70, 112),
        K.shiitake(p, 96, 64, 22, 20), K.shiitake(p, 144, 94, 20, -10), K.shiitake(p, 62, 98, 20, 40),
        xtwOil(p, 100, 100, 140, { n: 14, c: '#e8b84a', op: .55, rmax: 2 }),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 長年菜雞湯: 黒い釉の土鍋風の碗に、澄んだ淡いスープ、芥菜（長年菜）の厚い茎と葉、骨つきの鶏
    tw_changnian_jitang: p => [
        K.bowl(p, { R: 92, glaze: '#3a3632', inside: '#efe8da', lip: .87 }),
        K.liquid(p, { R: 78, c: '#e2d4a2', op: .85, shine: false }),
        ...[[76, 78, 20], [128, 70, -40], [100, 110, 140], [66, 126, -70], [138, 130, 100]].map(([x, y, r], i) => xtwSoupChk(p, x, y, 40, r, { seed: i, bone: i % 2 === 0 })),
        ...[[100, 68, -10], [142, 100, 70], [62, 100, 110], [114, 140, 20], [80, 142, 160], [104, 96, 40]].map(([x, y, r], i) => xtwMustard(p, x, y, 46, r, { seed: i })),
        `<circle cx="100" cy="100" r="78" fill="#e2d6a8" opacity=".15"/>`,
        xtwGinger(p, 120, 116, 13, 30), xtwGinger(p, 84, 84, 12, -40),
        xtwOil(p, 100, 100, 130, { n: 12, c: '#f2cf6c', op: .5, rmax: 1.8 }),
        xtwShine(100, 100, 78, .4),
    ].join(''),

    // 貢丸湯: 小吃の赤い縁のメラミン碗に、澄んだスープ、ぷりっとした貢丸、大根、芹菜珠、油蔥酥、白こしょう
    tw_gongwan_tang: p => [
        xtwStallBowl(p, { c: '#c8332a' }),
        K.liquid(p, { R: 77, c: '#eadfc0', op: .66, shine: false }),
        ...[[116, 120, 20], [72, 92, -30], [134, 82, 40], [92, 140, 10], [62, 124, 60], [146, 120, -20]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="-9" y="-8" width="18" height="16" rx="3" fill="${p.g('#f0e8d2', .3, .2)}" stroke="#d2c6a8" stroke-width=".6"/></g><path d="M-6,-5 L5,-5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`),
        ...[[80, 70], [120, 66], [100, 100], [140, 100], [64, 104], [116, 138], [82, 124], [100, 72], [146, 140]].map(([x, y], i) => K.meatball(p, x, y, i > 6 ? 22 : 28, { c: i % 2 ? '#c6b092' : '#b8a284' })),
        xtwGrains(p, 100, 100, 126, { cols: ['#4f9a2e', '#6aae44', '#3f8a26'], n: 50, size: 1.7, seed: 1 }),
        xtwGrains(p, 100, 100, 120, { cols: ['#a8642a', '#8a4c1c', '#c4823c'], n: 26, size: 1.5, seed: 2 }),
        K.sprinkle(p, 100, 100, 110, { c: '#6a5a44', n: 14, r: .6 }),
        xtwOil(p, 100, 100, 130, { n: 10, c: '#f2cf6c', op: .45, rmax: 1.6 }),
        xtwShine(100, 100, 77, .4),
    ].join(''),

    // 虱目魚肚湯: 白い湯碗に、澄んだ白っぽいスープ、ふっくらした虱目魚の腹身、針しょうが、芹菜
    tw_shimuyu_tang: p => [
        xtwBowl(p, { R: 92, flowers: 3 }),
        K.liquid(p, { R: 79, c: '#ece4ce', op: .72, shine: false }),
        xtwFishBelly(p, 100, 100, 150, -14),
        xtwFineShreds(p, 96, 92, 70, { c: '#f2dc92', n: 16, w: 1.4, seed: 2, dir: -.2, len: .5 }),
        xtwGrains(p, 100, 100, 140, { cols: ['#4f9a2e', '#6aae44', '#3f8a26'], n: 36, size: 1.7, seed: 1 }),
        K.sprinkle(p, 100, 100, 120, { c: '#6a5a44', n: 12, r: .6 }),
        xtwOil(p, 100, 100, 140, { n: 12, c: '#f2cf6c', op: .45, rmax: 1.8 }),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 薑絲蚵仔湯: 白い湯碗に、澄んだスープ、粉をまぶしてぷっくりゆでた牡蠣、針しょうが、ねぎ
    tw_ezai_tang: p => [
        xtwBowl(p, { R: 92 }),
        K.liquid(p, { R: 79, c: '#ebe2c8', op: .66, shine: false }),
        ...xtwSpots('ez', 16, 60, 18, 100, 100).map(([x, y, r, q], i) => xtwOyster(p, x, y, 26 + q * 4, r, { seed: i, coat: true })),
        `<circle cx="100" cy="100" r="79" fill="#efe8d4" opacity=".14"/>`,
        xtwFineShreds(p, 100, 100, 120, { c: '#f2dc92', n: 22, w: 1.4, seed: 2, dir: -.3, len: .3 }),
        xtwScallions(p, 100, 100, 120, { n: 18 }),
        xtwOil(p, 100, 100, 130, { n: 10, c: '#f2cf6c', op: .45, rmax: 1.6 }),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 肉羹湯: 小吃の赤い縁の碗に、とろみのある茶色の羹、魚漿をまとった豚肉の羹、白菜・にんじん・たけのこの細切り、香菜、黒酢
    tw_rougeng: p => [
        xtwStallBowl(p, { c: '#c8332a' }),
        K.liquid(p, { R: 77, c: '#946034', op: 1, shine: false }),
        `<circle cx="96" cy="96" r="56" fill="#b07a46" opacity=".35"/>`,
        xtwStrips(p, 100, 100, 130, { c: '#efe6c4', n: 18, w: 2.6, len: .28, seed: 1, gloss: .3 }),
        xtwStrips(p, 100, 100, 124, { c: '#ec7a2a', n: 12, w: 2.2, len: .26, seed: 2, gloss: .3 }),
        xtwStrips(p, 100, 100, 124, { c: '#e8d48c', n: 10, w: 2.4, len: .26, seed: 3, gloss: .3 }),
        ...xtwSpots('rg', 11, 56, 22, 100, 100).map(([x, y, r, q], i) => xtwGengPiece(p, x, y, 36 + q * 6, 14, r, { seed: i, c: '#c47e5a', coat: '#e6cdb0' })),
        `<circle cx="100" cy="100" r="77" fill="#8a5a30" opacity=".16"/>`,
        ...[[86, 80, -20], [112, 88, 30], [100, 110, 80]].map(([x, y, r]) => xtwCilantro(p, x, y, 20, r)),
        xtwOil(p, 100, 100, 120, { n: 6, c: '#3a1a0a', op: .5, rmax: 2.2 }),
        `<path d="M48,84 A56,56 0 0 1 80,48" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/><path d="M60,104 Q66,86 80,78" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".35"/>`,
    ].join(''),

    // 魷魚羹: 小吃の緑の縁の碗に、とろみのある茶色の羹、鹿の子に切ったいか、たけのこの薄切り、白菜、九層塔
    tw_youyu_geng: p => [
        xtwStallBowl(p, { c: '#2f7a4a' }),
        K.liquid(p, { R: 77, c: '#a06c3c', op: 1, shine: false }),
        `<circle cx="96" cy="96" r="56" fill="#b88250" opacity=".3"/>`,
        xtwStrips(p, 100, 100, 130, { c: '#eef0d0', n: 14, w: 3.4, len: .28, seed: 1, gloss: .3 }),
        ...[[100, 70, 10], [140, 104, 80], [64, 110, -40], [110, 140, 30]].map(([x, y, r]) => K.bamboo(p, x, y, 22, r)),
        ...[[78, 80, -20], [124, 78, 30], [100, 104, -10], [142, 132, 60], [70, 136, 110], [96, 148, -40], [56, 92, 70], [132, 56, 20]].map(([x, y, r], i) => xtwSquidCut(p, x, y, 36, 22, r, { seed: i })),
        `<circle cx="100" cy="100" r="77" fill="#9a6a3c" opacity=".14"/>`,
        xtwBasil(p, 112, 118, 22, -30), xtwBasil(p, 92, 90, 20, 40), xtwBasil(p, 124, 100, 18, 120),
        xtwGrains(p, 100, 100, 100, { cols: ['#c8a050', '#a87a34'], n: 12, size: 1.8, seed: 2 }),
        `<path d="M48,84 A56,56 0 0 1 80,48" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`,
    ].join(''),
    // 四神湯: 白い湯碗に、白く濁ったスープ、薏仁・蓮子・芡実・山藥の薄切り、小さく切った排骨
    tw_sishen_tang: p => [
        xtwBowl(p, { R: 92, flowers: 3 }),
        K.liquid(p, { R: 79, c: '#ddcca4', op: .92, shine: false }),
        ...[[76, 80, 20], [126, 74, -40], [138, 124, 70], [70, 128, -70], [104, 108, 100]].map(([x, y, r], i) => xtwRib(p, x, y, 32, r, { c: '#d8b89a', seed: i })),
        ...[[100, 70], [140, 98], [62, 102], [112, 142], [86, 144]].map(([x, y], i) => `<g ${T(x, y, i * 30)}><ellipse rx="11" ry="9" fill="${p.rg('#f6f2e6', .2, .15)}" stroke="#d8ccb0" stroke-width=".6"/><ellipse rx="4" ry="3" fill="none" stroke="#e8dcc0" stroke-width=".8"/></g>`),
        `<circle cx="100" cy="100" r="79" fill="#e8dcc0" opacity=".25"/>`,
        xtwBarley(p, 100, 100, 140, { n: 60 }),
        ...[[90, 90], [118, 96], [80, 116], [124, 118], [100, 128], [112, 76], [70, 94], [140, 84]].map(([x, y], i) => xtwLotusSeed(p, x, y, 10, i * 40)),
        ...[[96, 104], [130, 106], [74, 76], [146, 138], [58, 116]].map(([x, y]) => `<g ${p.sh(.4)}><circle cx="${x}" cy="${y}" r="4.6" fill="${p.rg('#f0e6d0', .3, .2)}" stroke="#c8b48a" stroke-width=".5"/></g><circle cx="${x + 1}" cy="${y - 1}" r="1.6" fill="#9a6a4a"/>`),
        xtwOil(p, 100, 100, 130, { n: 8, c: '#f2dc8c', op: .45, rmax: 1.6 }),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 排骨酥湯: 茶色の鉢に、揚げてから蒸した排骨酥、透き通った大根、醤油色のスープ、芹菜、香菜
    tw_paigusu_tang: p => [
        K.bowl(p, { R: 92, glaze: '#6e4b33', inside: '#efe5d3', lip: .87 }),
        K.liquid(p, { R: 78, c: '#b08046', op: .95, shine: false }),
        ...[[126, 120, 20], [72, 92, -30], [132, 80, 40], [94, 144, 10], [64, 130, 60]].map(([x, y, r]) => `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="-12" y="-10" width="24" height="20" rx="4" fill="${p.g('#ecdcae', .35, .25)}" stroke="#c8b07a" stroke-width=".6" opacity=".95"/></g><path d="M-8,-6 L6,-6" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".8"/></g>`),
        `<g ${p.rough(1.6, .25)}>${[[84, 72, 30], [116, 66, -20], [142, 104, 80], [100, 100, 10], [64, 108, 120], [112, 132, -50], [84, 124, 60]].map(([x, y, r], i) => xtwRib(p, x, y, 34, r, { c: i % 2 ? '#94501e' : '#a65e26', seed: i })).join('')}</g>`,
        `<circle cx="100" cy="100" r="78" fill="#a87840" opacity=".12"/>`,
        xtwGrains(p, 100, 100, 130, { cols: ['#4f9a2e', '#6aae44', '#3f8a26'], n: 40, size: 1.7, seed: 1 }),
        xtwCilantro(p, 100, 92, 20, 20), xtwCilantro(p, 130, 118, 18, -40),
        xtwOil(p, 100, 100, 140, { n: 14, c: '#e8a840', op: .55, rmax: 2.2 }),
        xtwShine(100, 100, 78, .35),
    ].join(''),

    // 藥燉排骨: 砂鍋に、当帰などの漢方で煮た黒褐色の澄んだスープ、排骨、紅棗、枸杞、当帰の薄切り
    tw_yaodun_paigu: p => [
        xtwSandPot(p),
        K.liquid(p, { R: 75, c: '#4a2a12', op: 1, shine: false }),
        `<circle cx="96" cy="96" r="54" fill="#6a3a18" opacity=".35"/>`,
        ...[[76, 80, 20], [124, 72, -40], [140, 116, 70], [96, 108, 100], [64, 122, -70], [112, 142, 10]].map(([x, y, r], i) => xtwRib(p, x, y, 34, r, { c: i % 2 ? '#8a5a3a' : '#9a6440', seed: i })),
        `<circle cx="100" cy="100" r="75" fill="#4a2a12" opacity=".14"/>`,
        ...[[100, 82, 20], [130, 96, -30], [80, 104, 60], [118, 126, 10], [74, 140, 40]].map(([x, y, r]) => xtwJujube(p, x, y, 16, r)),
        ...[[94, 70, 10], [146, 94, -20], [62, 96, 30]].map(([x, y, r], i) => xtwHerbSlice(p, x, y, 22, r, { seed: i })),
        ...xtwSpots('ydg', 12, 56, 12, 100, 100).map(([x, y, r]) => xtwGoji(p, x, y, 8, r)),
        xtwOil(p, 100, 100, 130, { n: 8, c: '#c88a3a', op: .45, rmax: 1.6 }),
        xtwShine(100, 100, 75, .35),
    ].join(''),

    // 豬肝湯: 白い湯碗に、澄んだスープ、なめらかな赤茶の豬肝の薄切り、針しょうが、ねぎ
    tw_zhugan_tang: p => [
        xtwBowl(p, { R: 92 }),
        K.liquid(p, { R: 79, c: '#ece0c2', op: .66, shine: false }),
        ...xtwSpots('zg', 10, 56, 24, 100, 100).map(([x, y, r, q], i) => xtwLiver(p, x, y, 40 + q * 6, r, { seed: i })),
        `<circle cx="100" cy="100" r="79" fill="#efe4c8" opacity=".12"/>`,
        xtwFineShreds(p, 100, 100, 120, { c: '#f2dc92', n: 22, w: 1.4, seed: 2, dir: -.3, len: .3 }),
        xtwScallions(p, 100, 100, 124, { n: 18 }),
        xtwOil(p, 100, 100, 130, { n: 12, c: '#f2cf6c', op: .5, rmax: 1.8 }),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 花生豬腳湯: ステンレスの鍋碗に、白く濁ったスープ、ぷるんとした豬腳、皮をむいた白い落花生
    tw_huasheng_zhujiao: p => [
        xtwSteel(p, { R: 92, lip: .9 }),
        K.liquid(p, { R: 80, c: '#efe6d2', op: .95, shine: false }),
        ...[[76, 78, 20], [126, 72, -40], [140, 120, 70], [98, 106, 100], [66, 126, -70], [110, 146, 10]].map(([x, y, r], i) => xtwTrotter(p, x, y, 42, r, { seed: i })),
        `<circle cx="100" cy="100" r="80" fill="#f0e8d6" opacity=".15"/>`,
        `<g ${p.sh(.4)}>${xtwSpots('hsz', 26, 62, 10, 100, 100).map(([x, y, r]) => xtwPeanut(p, x, y, 12, r, { skin: false })).join('')}</g>`,
        xtwOil(p, 100, 100, 140, { n: 12, c: '#f6e6a8', op: .55, rmax: 2 }),
        xtwShine(100, 100, 80, .45),
    ].join(''),

    // 羅宋湯: 白い湯碗に、トマトの赤橙のスープ、牛肉、キャベツ、じゃがいも、にんじん、玉ねぎ、パセリ
    tw_luosong_tang: p => [
        xtwBowl(p, { R: 92, flowers: 4 }),
        K.liquid(p, { R: 79, c: '#c8502a', op: 1, shine: false }),
        `<circle cx="96" cy="96" r="56" fill="#e06a3a" opacity=".3"/>`,
        ...[[74, 78, 20], [128, 74, -40], [100, 124, 100]].map(([x, y, r], i) => xtwBeefChunk(p, x, y, 30, r, { seed: i, tendon: false, c: '#7a3a20' })),
        ...[[104, 84, 10], [140, 110, 70], [62, 112, -50]].map(([x, y, r], i) => K.leafPiece(p, x, y, 32, r, { c: '#d8d890', seed: i, cooked: true })),
        ...[[86, 102], [124, 100], [78, 136], [140, 136]].map(([x, y], i) => K.potato(p, x, y, 18, i * 30, { c: '#f0c870' })),
        ...xtwSpots('lsd', 10, 58, 14, 100, 100).map(([x, y, r]) => xtwDice(p, x, y, 9, r, '#f07a2a')),
        ...[[112, 64, 20], [116, 144, -30], [58, 92, 60]].map(([x, y, r]) => zsTomatoX(p, x, y, 22, r)),
        `<circle cx="100" cy="100" r="79" fill="#c8502a" opacity=".14"/>`,
        xtwGrains(p, 100, 100, 110, { cols: ['#3f8a2c', '#4fa03a'], n: 26, size: 1.5, seed: 3 }),
        xtwOil(p, 100, 100, 140, { n: 12, c: '#f08a3a', op: .55, rmax: 2 }),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 清燉牛肉湯: 白い湯碗に、澄んだ琥珀色のスープ、やわらかく煮た牛すね、透き通った大根、ねぎ
    tw_qingdun_niurou: p => [
        xtwBowl(p, { R: 92 }),
        K.liquid(p, { R: 79, c: '#d8c08a', op: .78, shine: false }),
        ...[[96, 112, 34], [146, 104, 30], [62, 108, 32], [118, 144, 30]].map(([x, y, s]) => K.daikon(p, x, y, s, 0, { c: '#ece2c6' })),
        ...[[78, 76, -20], [124, 70, 20], [104, 100, -5], [140, 130, 70], [66, 136, 40]].map(([x, y, r], i) => xtwBeefChunk(p, x, y, 38, r, { seed: i, c: '#8a5236' })),
        `<circle cx="100" cy="100" r="79" fill="#dcc48e" opacity=".14"/>`,
        xtwScallions(p, 100, 100, 120, { n: 20 }),
        xtwOil(p, 100, 100, 140, { n: 16, c: '#f2c650', op: .55, rmax: 2.2 }),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 皮蛋莧菜湯: 白い湯碗に、赤莧菜で淡い紅色に染まったとろみのスープ、莧菜の葉、皮蛋のかけら、吻仔魚、にんにく
    tw_pidan_xiancai: p => [
        xtwBowl(p, { R: 92, flowers: 3 }),
        K.liquid(p, { R: 79, c: '#8e3a4e', op: .92, shine: false }),
        `<circle cx="96" cy="96" r="56" fill="#a84a62" opacity=".3"/>`,
        ...xtwSpots('xc', 13, 58, 22, 100, 100).map(([x, y, r, q]) => xtwAmaranth(p, x, y, 36 + q * 6, r)),
        ...[[96, 98, 20], [128, 82, -40], [76, 124, 70], [120, 128, 160], [70, 84, 110], [104, 64, -10], [144, 110, 40]].map(([x, y, r]) => xtwPidan(p, x, y, 22, r)),
        ...xtwSpots('xcw', 12, 56, 14, 100, 100).map(([x, y, r]) => `<g ${T(x, y, r)}><path d="M-6,0 Q-2,-1.6 5,-.4 L7,-1.4 L7,1.4 L5,.4 Q-2,1.6 -6,0Z" fill="#f4efe2" stroke="#c8c0aa" stroke-width=".4"/><circle cx="-4.4" cy="0" r=".7" fill="#2a2a2a"/></g>`),
        ...[[108, 110], [86, 86], [132, 100]].map(([x, y], i) => xtwGarlicSlice(p, x, y, 8, i * 50, { c: '#f2dca0' })),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 鹹湯圓: 白い湯碗に、醤油色の澄んだスープ、小さな白い湯圓、豚肉、しいたけ、蝦米、茼蒿、油蔥酥、芹菜
    tw_xian_tangyuan: p => [
        xtwBowl(p, { R: 92 }),
        K.liquid(p, { R: 79, c: '#c49a58', op: .82, shine: false }),
        K.greens(p, 128, 120, 60, { c: '#3f8a2c', n: 9, stems: '#8cc05a', seed: 2 }),
        xtwPorkShreds(p, 90, 96, 90, { seed: 3, n: 12 }),
        xtwStrips(p, 100, 100, 110, { c: '#5a3820', n: 10, w: 3, len: .2, seed: 4, gloss: .35 }),
        ...xtwSpots('ty', 18, 58, 15, 100, 100).map(([x, y]) => xtwTangyuan(p, x, y, 15)),
        ...xtwSpots('tys', 6, 50, 18, 100, 100).map(([x, y, r]) => K.shrimp(p, x, y, 10, r, { c: '#e2784a' })),
        xtwGrains(p, 100, 100, 130, { cols: ['#4f9a2e', '#6aae44'], n: 30, size: 1.6, seed: 1 }),
        xtwGrains(p, 100, 100, 124, { cols: ['#a8642a', '#8a4c1c', '#c4823c'], n: 26, size: 1.5, seed: 2 }),
        xtwOil(p, 100, 100, 140, { n: 12, c: '#e8b84a', op: .5, rmax: 1.8 }),
        xtwShine(100, 100, 79, .4),
    ].join(''),

    // 綠竹筍湯: 青磁の湯碗に、澄んだスープ、象牙色の綠竹筍の乱切り、しいたけ、昆布
    tw_zhusun_tang: p => [
        K.bowl(p, { R: 92, glaze: '#9fbfae', inside: '#f2f6f0', lip: .87 }),
        K.liquid(p, { R: 78, c: '#ece4c8', op: .7, shine: false }),
        ...xtwSpots('zs', 11, 54, 25, 100, 100).map(([x, y, r, q], i) => xtwShoot(p, x, y, 38 + q * 6, r, { c: i % 3 ? '#f2e8c2' : '#ebdca6', seed: i })),
        `<circle cx="100" cy="100" r="78" fill="#efe8cc" opacity=".14"/>`,
        K.shiitake(p, 96, 98, 22, 20), K.shiitake(p, 136, 84, 20, -10), K.shiitake(p, 72, 128, 20, 40),
        ...[[120, 128, 30], [70, 80, -40]].map(([x, y, r]) => `<g ${T(x, y, r)}><rect x="-14" y="-5" width="28" height="10" rx="2" fill="${p.g('#3a5a32', .3, .3)}" stroke="#22381e" stroke-width=".6" opacity=".9"/><path d="M-11,-2 L11,-2" stroke="#6a8a52" stroke-width=".8" opacity=".7"/></g>`),
        xtwOil(p, 100, 100, 130, { n: 8, c: '#f2dc8c', op: .45, rmax: 1.6 }),
        xtwShine(100, 100, 78, .4),
    ].join(''),
};

// 小数を1桁に丸めてファイルを軽くする
const xtwSlim = str => str.replace(/(\d+\.\d)\d+/g, '$1').replace(/(\d)\.0(?!\d)/g, '$1').replace(/\s*\n\s*/g, ' ').replace(/> </g, '><');
export default Object.fromEntries(Object.entries(DISHES).map(([id, fn]) => [id, p => xtwSlim(fn(p))]));
