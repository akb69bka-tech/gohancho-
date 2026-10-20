// 世界版: 韓国（kr_ で始まる料理）
import * as K from '../kit.mjs';

const { T, f, rng, ring, smooth, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// =========================================================
// このファイル専用の部品（wk で始まる）
// =========================================================

// 1桁小数のなめらかな線
function wkSm(pts, closed = false){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
const wkSmooth = pts => wkSm(pts, true);
function wkOutline(p, c, r = .55){
    const id = p.def('wkOl' + c + r, id => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${c}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return `filter="url(#${id})"`;
}
// 円の中にばらまく位置（重なりすぎないように）
function wkSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('wkspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}

// ---------- 器 ----------
// ステンレスの器（ご飯の공기・国の器）: 金属の映り込みの帯
function wkSteelBowl(p, { R = 92, inner = .86 } = {}){
    const outer = p.def('wkSteelO', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6f7"/><stop offset=".28" stop-color="#b9c0c6"/><stop offset=".5" stop-color="#eef1f3"/><stop offset=".72" stop-color="#8f979e"/><stop offset="1" stop-color="#cdd2d6"/></linearGradient>`);
    const inn = p.def('wkSteelI', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9aa2a9"/><stop offset=".45" stop-color="#d7dbdf"/><stop offset=".7" stop-color="#f3f5f6"/><stop offset="1" stop-color="#c3c9ce"/></linearGradient>`);
    return `<g ${p.sh(1.6)}><circle cx="100" cy="100" r="${R}" fill="url(#${outer})"/></g>
        <circle cx="100" cy="100" r="${R - 1.5}" fill="none" stroke="#fff" stroke-width="1.4" opacity=".8"/>
        <circle cx="100" cy="100" r="${f(R * inner)}" fill="url(#${inn})"/>
        <circle cx="100" cy="100" r="${f(R * inner)}" fill="none" stroke="#7f878e" stroke-width="1" opacity=".7"/>
        <path d="M${f(100 - R * .78)},${f(100 - R * .36)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// 뚝배기（茶黒の釉薬の土鍋）: 厚い縁、外側に細かい斑点
function wkTtuk(p, { R = 94 } = {}){
    const Rr = rng(p.id + 'ttuk');
    let sp = '';
    for (let i = 0; i < 26; i++){ const a = Rr() * 6.28, d = R * (.9 + Rr() * .08); sp += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" r="${f(.5 + Rr() * .7)}" fill="#c9a07a" opacity=".55"/>`; }
    return `<g ${p.sh(2)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#5a3524', .18, .4, .35, .3)}"/></g>${sp}
        <circle cx="100" cy="100" r="${f(R * .87)}" fill="none" stroke="${p.g('#7a4a30', .3, .35)}" stroke-width="5"/>
        <circle cx="100" cy="100" r="${f(R * .84)}" fill="#2a160e"/>
        <path d="M${f(100 - R * .74)},${f(100 - R * .44)} A${f(R * .86)},${f(R * .86)} 0 0 1 ${f(100 - R * .3)},${f(100 - R * .8)}" stroke="#e8c2a0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 白磁の皿（縁は淡い灰）
const wkPlate = (p, o = {}) => K.plate(p, { rim: '#cfcac0', ...o });
// 白磁の小鉢
const wkDish = (p, o = {}) => K.kobachi(p, { glaze: '#efede6', inside: '#fbfaf6', ...o });
// 両手鍋（ステンレス、取っ手つき）
function wkPot(p){
    const outer = p.def('wkPotO', id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef1f3"/><stop offset=".35" stop-color="#b4bbc1"/><stop offset=".55" stop-color="#e6e9ec"/><stop offset="1" stop-color="#8a9299"/></linearGradient>`);
    return `<g ${p.sh(1.8)}><rect x="2" y="91" width="196" height="18" rx="7" fill="${p.g('#9aa1a8', .3, .3)}"/><circle cx="100" cy="100" r="88" fill="url(#${outer})"/></g>
        <rect x="5" y="94" width="14" height="12" rx="4" fill="#6f777e"/><rect x="181" y="94" width="14" height="12" rx="4" fill="#6f777e"/>
        <circle cx="100" cy="100" r="86.5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>
        <circle cx="100" cy="100" r="81" fill="#8d959c"/>
        <path d="M30,60 A80,80 0 0 1 60,30" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
}

// ---------- 具 ----------
// ご飯（e_rice_noodle の erRice と同じ描き方）
function wkRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, shadow = 1, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'wkRice' + seed + x + y);
    const shape = wkSmooth(ring(s / 2, 14, .07, R, 1, sy));
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
    const shade = p.def('wkRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    const base = `<path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/>`;
    return `<g ${T(x, y)}><defs>${defs}</defs>${shadow ? `<g ${p.sh(.8 * shadow)}>${base}</g>` : base}${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// 白菜キムチの一片（下は白っぽい芯、上は赤い葉）
function wkKimchi(p, x, y, s, r = 0, { seed = 1, deep = 0 } = {}){
    const R = rng(p.id + 'kmc' + seed + x + y);
    const k = s / 20;
    const leaf = Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1 - i / 8); return [Math.cos(a) * 11, -Math.sin(a) * 8.5 * (.8 + R() * .35) + 1]; });
    const stem = [[11, 1], [10, 6.5], [0, 7.6], [-10, 6.5], [-11, 1]];
    let fl = '';
    for (let i = 0; i < 5; i++) fl += `<circle cx="${f((R() - .5) * 18)}" cy="${f(-3.4 + R() * 9)}" r="${f(.35 + R() * .4)}" fill="#a81e0c" opacity=".85"/>`;
    const stemC = deep ? mix('#f2b08a', '#d8432a', deep) : '#f2b08a';
    return `<g ${T(x, y, r, k)}><path d="${smooth([...leaf, ...stem.slice(1, 4)], true, .8)}" fill="${p.g(stemC, .35, .15)}" stroke="#c0603e" stroke-width=".55"/>
        <path d="${smooth([...leaf, [9, 1.6], [0, 0], [-9, 1.6]], true, .8)}" fill="${p.g('#d8432a', .25, .2)}"/>
        <path d="M-6,-3 Q-4,-1 -6,1 M0,-5 Q2,-2 0,1 M6,-3 Q4,-1 6,1" stroke="#a82a16" stroke-width=".7" fill="none" opacity=".7"/>
        <path d="M-8,4.4 Q0,5.4 8,4.4" stroke="#fbe2cc" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/>
        ${fl}<path d="M-7,-2.6 Q-3,-6 3,-6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 大ねぎの斜め切り（白〜緑の細長い楕円の輪）
function wkNegi(p, x, y, s, r = 0, { green = false } = {}){
    const c = green ? '#7fb84a' : '#eef2dc';
    return `<g ${T(x, y, r)}><ellipse rx="${s / 2}" ry="${f(s * .24)}" fill="${p.g(c, .25, .2)}" stroke="${dk(c, .3)}" stroke-width=".6"/><ellipse rx="${f(s * .34)}" ry="${f(s * .12)}" fill="none" stroke="${dk(c, .15)}" stroke-width=".7"/></g>`;
}
// 青唐辛子・赤唐辛子の斜め切り（輪と種）
function wkChili(p, x, y, s, r = 0, { c = '#3f8f2a' } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .34)}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".5"/><ellipse rx="${f(s * .32)}" ry="${f(s * .2)}" fill="${lt(c, .55)}"/><circle cx="${f(-s * .08)}" cy="0" r="${f(s * .07)}" fill="#f6eec8"/><circle cx="${f(s * .1)}" cy="${f(s * .04)}" r="${f(s * .07)}" fill="#f6eec8"/></g>`;
}
// 汁の油の粒
function wkOil(p, x, y, s, { n = 10, c = '#f3c45a', seed = 1, op = .75, rmax = 3 } = {}){
    const R = rng(p.id + 'oil' + seed + x);
    let out = '';
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = .9 + R() * rmax;
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><circle cx="${f(cx - rr * .3)}" cy="${f(cy - rr * .35)}" r="${f(rr * .3)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
}
// 汁のつや
const wkShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// ぐつぐつの泡
const wkBubbles = (pts, c = '#ffb59a') => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width=".9" opacity=".8"/><circle cx="${f(x - r * .3)}" cy="${f(y - r * .3)}" r="${f(r * .3)}" fill="#fff" opacity=".7"/>`).join('');
// 大きめのごま
function wkSesame(p, x, y, rx, ry, n, { c = '#f4e8c8', seed = 1, size = 1 } = {}){
    const R = rng(p.id + 'ses' + seed + c + x);
    return Array.from({ length: n }, () => { const a = R() * 6.283, d = Math.sqrt(R()), cx = x + Math.cos(a) * d * rx, cy = y + Math.sin(a) * d * ry; return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(1.7 * size)}" ry="${f(1 * size)}" transform="rotate(${f(R() * 180)} ${f(cx)} ${f(cy)})" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".35"/>`; }).join('');
}
// 粉唐辛子（赤い細かい粒）
function wkFlakes(p, x, y, rx, ry, n, { seed = 1, c = '#c22a14' } = {}){
    const R = rng(p.id + 'flk' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.283, q = Math.sqrt(R()), cx = x + Math.cos(a) * q * rx, cy = y + Math.sin(a) * q * ry, s = .6 + R() * .7; d += `M${f1(cx - s)},${f1(cy)}l${f1(s)},${f1(-s * .8)}l${f1(s)},${f1(s * 1.2)}Z`; }
    return `<path d="${d}" fill="${c}" opacity=".85"/>`;
}
// 細い棒（千切り・拍子木）
function wkStick(p, x, y, L, w, r, c, { gloss = .5 } = {}){
    return `<g ${T(x, y, r)}><rect x="${f(-L / 2)}" y="${f(-w / 2)}" width="${f(L)}" height="${f(w)}" rx="${f(w * .4)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".5"/>`
        + (gloss ? `<path d="M${f(-L / 2 + w * .7)},${f(-w * .2)} L${f(L / 2 - w)},${f(-w * .2)}" stroke="#fff" stroke-width="${f(w * .24)}" stroke-linecap="round" opacity="${gloss}"/>` : '') + `</g>`;
}
// 青菜の葉
function wkLeaf(p, x, y, L, r, c){
    const k = L / 24;
    return `<g ${T(x, y, r, k)}><path d="M-12,0 Q-6,-7.5 3,-6.5 Q11,-3.5 12,0 Q9,5 1,6 Q-7,6 -12,0Z" fill="${p.g(c, .25, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/><path d="M-11,0 Q0,-1 11,0 M-4,-.4 L-1,-4 M2,-.3 L5,-3.6 M-2,.3 L1,3.6" stroke="${lt(c, .35)}" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
}
// レタスの葉（大きく波打つ）
function wkLettuce(p, x, y, s, r = 0, { c = '#8cc456', seed = 1 } = {}){
    const R = rng(p.id + 'let' + seed + x + y);
    const pts = ring(s / 2, 16, .28, R, 1.1, .85);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .9)}" fill="${p.g(c, .35, .25)}" stroke="${dk(c, .22)}" stroke-width=".7"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .72, b * .72]), true, .9)}" fill="${lt(c, .3)}" opacity=".55"/>
        <path d="M${f(-s * .45)},${f(s * .05)} Q0,${f(-s * .05)} ${f(s * .42)},${f(-s * .02)}" stroke="#eef7d8" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M${f(-s * .15)},0 L${f(-s * .3)},${f(-s * .25)} M${f(s * .1)},0 L${f(-s * .02)},${f(-s * .3)} M${f(s * .05)},0 L${f(s * .2)},${f(s * .25)} M${f(-s * .2)},${f(s * .02)} L${f(-s * .28)},${f(s * .26)}" stroke="#e4f2c4" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`;
}
// 薄切り牛肉（ひだと脂の筋）
function wkBeef(p, x, y, s, r = 0, { c = '#7d4a2c', seed = 1, fat = .6 } = {}){
    const R = rng(p.id + 'wkBf' + seed + x + y);
    const k = s / 30;
    const folds = Array.from({ length: 3 }, () => { const fx = -8 + R() * 16; return `M${f1(fx)},${f1(-6 + R() * 2)} q${f1((R() - .5) * 5)},6 ${f1((R() - .5) * 3)},${f1(11 + R() * 2)}`; }).join('');
    const fats = Array.from({ length: 2 }, () => { const fx = -10 + R() * 14, fy = -4 + R() * 7; return `M${f1(fx)},${f1(fy)} q${f1(3 + R() * 3)},${f1((R() - .5) * 4)} ${f1(7 + R() * 5)},${f1((R() - .5) * 3)}`; }).join('');
    return `<g ${T(x, y, r, k)}><path d="${wkSmooth(ring(14, 16, .36, R, 1.1, .6))}" fill="${p.g(c, .28, .3)}" stroke="${dk(c, .38)}" stroke-width=".7"/>
        <path d="${folds}" stroke="${dk(c, .42)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="${fats}" stroke="#e6c4a0" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="${fat}"/>
        <path d="M-9,-4.5 Q-2,-7.4 6,-5.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 骨つき鶏のぶつ切り（たれをまとった身と、のぞく骨の端）
function wkChickenBone(p, x, y, s, r = 0, { c = '#c0452a', seed = 1, bone = true } = {}){
    const R = rng(p.id + 'cbn' + seed + x + y);
    const k = s / 24;
    const pts = ring(10, 10, .3, R, 1.2, .85);
    let pt = '';
    for (let i = 0; i < 3; i++) pt += `<path ${T(-3 + (R() - .5) * 10, (R() - .5) * 7)} d="${smooth(ring(2.4 + R() * 1.8, 6, .5, R, 1.5, .7))}" fill="#efb486" opacity=".75"/>`;
    pt += `<path d="M-8,-1 q4,-1.6 8,0 M-6,2.6 q4,-1 8,.4" stroke="#e8a070" stroke-width=".8" fill="none" opacity=".7"/>`;
    return `<g ${T(x, y, r, k)}>${bone ? `<g ${p.sh(.4)}><rect x="8" y="-2.2" width="7" height="4.4" rx="2" fill="#efe2c8" stroke="#bfa880" stroke-width=".5"/><circle cx="15" cy="-1.6" r="2.4" fill="#f4ead4" stroke="#bfa880" stroke-width=".5"/><circle cx="15" cy="1.6" r="2.4" fill="#f4ead4" stroke="#bfa880" stroke-width=".5"/></g>` : ''}
        <path d="${smooth(pts, true, .8)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/>${pt}
        <path d="M-7,4 Q-1,6.5 6,4.4" stroke="${dk(c, .35)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M-7,-3.5 Q-3,-6.6 2.5,-6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// 고등어 반마리（開いた半身を皮目を上に焼いたもの）: 頭を落とした左端、右に尾びれ。長さ L
function wkMackerel(p, x, y, L, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'mk' + seed + x);
    const h = L * .3;
    const body = wkSmooth([[-L * .5, -h * .38], [-L * .3, -h * .5], [0, -h * .5], [L * .22, -h * .38], [L * .36, -h * .14], [L * .4, 0], [L * .36, h * .14], [L * .22, h * .38], [0, h * .5], [-L * .3, h * .5], [-L * .5, h * .38], [-L * .52, 0]]);
    const tail = `M${f(L * .37)},0 L${f(L * .5)},${f(-h * .42)} Q${f(L * .46)},0 ${f(L * .5)},${f(h * .42)}Z`;
    const cid = p.uid();
    let st = '';
    for (let i = 0; i < 13; i++){ const sx = -L * .44 + i * L * .062; st += `M${f(sx)},${f(-h * .5)}q${f(3 + R() * 2)},${f(h * .18)} ${f(-1)},${f(h * .3)}t${f(1.5)},${f(h * .22)}`; }
    let ch = '';
    for (let i = 0; i < 14; i++) ch += `<ellipse cx="${f(-L * .45 + R() * L * .8)}" cy="${f(-h * .4 + R() * h * .8)}" rx="${f(2.5 + R() * 6)}" ry="${f(1.5 + R() * 3)}" fill="#3b2210" opacity="${f(.2 + R() * .4)}"/>`;
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs>
        <path d="${tail}" fill="${p.g('#5a5a52', .3, .3)}" stroke="#2e3036" stroke-width=".8"/><path d="M${f(L * .4)},0 L${f(L * .48)},${f(-h * .3)} M${f(L * .4)},0 L${f(L * .48)},${f(h * .3)}" stroke="#2a2420" stroke-width=".8" opacity=".6"/>
        <path d="${body}" fill="${p.g('#dcb47a', .2, .3)}" stroke="#3a3e44" stroke-width=".9"/>
        <g clip-path="url(#${cid})">
            <path d="${wkSmooth([[-L * .55, -h * .6], [L * .45, -h * .6], [L * .45, h * .12], [0, h * .2], [-L * .55, h * .14]])}" fill="${p.g('#4f6672', .3, .3)}"/>
            <path d="${st}" stroke="#1b232c" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>
            <path d="${body}" fill="${p.rg('#c87a2e', .1, .3)}" opacity=".62"/>
            ${ch}
            <path d="M${f(-L * .5)},${f(h * .22)} Q0,${f(h * .34)} ${f(L * .38)},${f(h * .1)}" stroke="#f2e2c0" stroke-width="2" fill="none" opacity=".6"/>
            <path d="M${f(-L * .5)},${f(-h * .1)} L${f(-L * .44)},${f(-h * .1)}" stroke="#c87a3a" stroke-width="${f(h * .8)}" opacity=".35"/>
        </g>
        <path d="M${f(-L * .52)},${f(-h * .3)} Q${f(-L * .55)},0 ${f(-L * .52)},${f(h * .3)}" stroke="#d9a070" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M${f(-L * .36)},${f(-h * .38)} Q0,${f(-h * .52)} ${f(L * .24)},${f(-h * .34)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M${f(-L * .2)},${f(-h * .2)} Q0,${f(-h * .28)} ${f(L * .12)},${f(-h * .2)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".45"/></g>`;
}
// 삼겹살（煮た豚ばら: 白い脂と淡い赤身の層）
function wkPorkBelly(p, x, y, w, h, r = 0, { c = '#c9a08a', seed = 1, tint = null } = {}){
    const R = rng(p.id + 'pb' + seed + x + y);
    const body = wkSmooth([[-w / 2, -h / 2], [0, -h / 2 - 1], [w / 2, -h / 2], [w / 2 + 1, 0], [w / 2, h / 2], [0, h / 2 + 1], [-w / 2, h / 2], [-w / 2 - 1, 0]].map(([a, b]) => [a + (R() - .5) * 2.4, b + (R() - .5) * 1.6]));
    const cid = p.uid();
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(.6)}><path d="${body}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".6"/></g>
        <g clip-path="url(#${cid})"><rect x="${f(-w)}" y="${f(-h / 2)}" width="${2 * w}" height="${f(h * .28)}" fill="#f4e6d6"/><rect x="${f(-w)}" y="${f(h * .08)}" width="${2 * w}" height="${f(h * .16)}" fill="#f0dcc8" opacity=".9"/>
        ${tint ? `<path d="${body}" fill="${tint}" opacity=".3"/>` : ''}</g>
        <path d="M${f(-w * .38)},${f(-h * .38)} L${f(w * .3)},${f(-h * .38)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 焼いた豆腐に甘辛だれ（四角い厚切り、焼き目、たれ）
function wkTofuJorim(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'tfj' + seed + x);
    const sauce = wkSmooth([[-w / 2 + 1, -h * .3], [-w * .2, -h / 2 + 2], [w * .2, -h * .44], [w / 2 - 1, -h * .3], [w / 2 - 2, h * .2], [w * .2, h * .48], [-w * .2, h * .4], [-w / 2 + 1, h * .3]].map(([a, b]) => [a + (R() - .5) * 6, b + (R() - .5) * 5]));
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(h * .12)}" fill="${p.g('#d9a050', .3, .3)}" stroke="#9a6224" stroke-width=".8"/></g>
        <rect x="${f(-w / 2 + 3)}" y="${f(-h / 2 + 3)}" width="${w - 6}" height="${h - 6}" rx="${f(h * .1)}" fill="${p.rg('#e8b464', .25, .2)}"/>
        <path d="${sauce}" transform="scale(.66)" fill="${p.g('#9a3a1c', .25, .25)}" opacity=".78"/>
        <path d="M${f(-w / 2 + 5)},${f(-h / 2 + 4)} L${f(w / 2 - 8)},${f(-h / 2 + 4)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        <path d="M${f(-w * .15)},${f(-h * .2)} q${f(w * .12)},${f(-h * .08)} ${f(w * .25)},0" stroke="#ffd6c0" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// いか（格子の切り目を入れた短冊が丸まったもの）
function wkSquid(p, x, y, w, h, r = 0, { c = '#f1d9c6', sauce = '#c43a1e', seed = 1 } = {}){
    const R = rng(p.id + 'sq' + seed + x + y);
    const body = wkSmooth([[-w / 2, -h * .3], [-w * .2, -h / 2], [w * .2, -h * .46], [w / 2, -h * .2], [w / 2 - 1, h * .3], [w * .15, h / 2], [-w * .25, h * .45], [-w / 2 + 1, h * .2]].map(([a, b]) => [a + (R() - .5) * 2, b + (R() - .5) * 2]));
    const cid = p.uid();
    let grid = '';
    for (let i = -3; i <= 3; i++){ const gx = i * w / 6; grid += `M${f(gx - h)},${f(-h)}L${f(gx + h)},${f(h)}M${f(gx + h)},${f(-h)}L${f(gx - h)},${f(h)}`; }
    return `<g ${T(x, y, r)}><defs><clipPath id="${cid}"><path d="${body}"/></clipPath></defs><g ${p.sh(.8)}><path d="${body}" fill="${p.g(c, .3, .25)}" stroke="${dk(sauce, .2)}" stroke-width=".8"/></g>
        <g clip-path="url(#${cid})"><path d="${body}" fill="${sauce}" opacity=".45"/><path d="${grid}" stroke="#fbeee4" stroke-width="1.6" fill="none" opacity=".85"/>
        <path d="${body}" fill="none" stroke="${sauce}" stroke-width="${f(h * .3)}" opacity=".55"/>
        <path d="${wkSmooth(ring(h * .3, 7, .5, R, 1.6, .7)).replace('M', `M`)}" transform="translate(${f((R() - .5) * w * .3)} ${f((R() - .5) * h * .2)})" fill="${sauce}" opacity=".35"/></g>
        <path d="M${f(-w * .32)},${f(-h * .26)} Q${f(-w * .05)},${f(-h * .42)} ${f(w * .25)},${f(-h * .3)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}
// いかの足
function wkTentacles(p, x, y, s, r = 0, { c = '#e8b89a' } = {}){
    const k = s / 30;
    const legs = [[-8, -12], [-2, -14], [5, -12], [10, -6]].map(([ex, ey], i) => {
        const d = `M0,6 Q${f(ex * .4 - 3)},${f(ey * .3)} ${ex},${ey} q${f(3 + i)},-2 ${f(2 + i * .5)},2`;
        return `<path d="${d}" stroke="${dk(c, .35)}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#f6e2cc" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-dasharray=".4 2.2" opacity=".9"/>`;
    }).join('');
    return `<g ${T(x, y, r, k)}><g ${p.sh(.6)}>${legs}<ellipse cx="0" cy="7" rx="6" ry="4.5" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .3)}" stroke-width=".6"/></g></g>`;
}
// 계란말이の1切れ（断面に巻いた層、にんじんとねぎの粒）
function wkRollSlice(p, x, y, w, h, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'roll' + seed + x);
    const pts = [];
    const N = 56, turns = 2.6;
    for (let i = 0; i <= N; i++){
        const t = i / N, th = t * turns * 6.283 + .6, rr = .88 - t * .78, c = Math.cos(th), s = Math.sin(th);
        pts.push([Math.sign(c) * Math.pow(Math.abs(c), .3) * w / 2 * rr, Math.sign(s) * Math.pow(Math.abs(s), .3) * h / 2 * rr]);
    }
    let dots = '';
    for (let i = 0; i < 11; i++){ const c = i % 2 ? '#ef7a2a' : '#4f9a34'; dots += `<rect ${T((R() - .5) * w * .78, (R() - .5) * h * .72, R() * 180)} x="-1.2" y="-.9" width="2.4" height="1.8" rx=".5" fill="${c}"/>`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(h * .3)}" fill="${p.rg('#fbe07a', .35, .14, .4, .38)}" stroke="#dcae44" stroke-width="2"/></g>
        <path d="${smooth(pts, false)}" stroke="#e8bb48" stroke-width="1" fill="none" stroke-linecap="round" opacity=".75"/>${dots}
        <path d="M${f(-w / 2 + 4)},${f(-h / 2 + 3)} L${f(w / 2 - 7)},${f(-h / 2 + 3)}" stroke="#fffbe6" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;
}
// 멸치（小さな煮干し。銀〜飴色、黒い目）
function wkAnchovy(p, x, y, s, r = 0, { c = '#cdb07a' } = {}){
    const k = s / 22;
    return `<g ${T(x, y, r, k)}><path d="M-10,0 Q-9,-3.6 -2,-3.4 Q6,-2.8 9,-.6 L11.5,-2.6 L10.6,0 L11.5,2.6 L9,.6 Q6,2.8 -2,3.4 Q-9,3.6 -10,0Z" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .35)}" stroke-width=".5"/>
        <path d="M-7,-.6 L7,-.6" stroke="#fff6dc" stroke-width=".9" stroke-linecap="round" opacity=".9"/><path d="M-4,1 L6,.8" stroke="${dk(c, .3)}" stroke-width=".6" opacity=".6"/><circle cx="-7.6" cy="-.5" r="1" fill="#2a2420"/></g>`;
}
// アーモンド
function wkAlmond(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><path d="M${f(-s / 2)},0 Q${f(-s * .2)},${f(-s * .34)} ${f(s / 2)},0 Q${f(-s * .2)},${f(s * .34)} ${f(-s / 2)},0Z" fill="${p.g('#b7743a', .3, .3)}" stroke="#7a4518" stroke-width=".5"/></g><path d="M${f(-s * .3)},${f(-s * .05)} Q0,${f(-s * .14)} ${f(s * .3)},${f(-s * .02)}" stroke="#e9b98a" stroke-width=".8" fill="none" opacity=".8"/></g>`;
}
// 콩나물（大豆もやし: 大きめの黄色い豆と白い軸）
function wkSoySprout(p, x, y, a, L, { bend = 0 } = {}){
    const rad = a * Math.PI / 180, dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2;
    const d = `M${f(x - dx)},${f(y - dy)} Q${f(x - dy * bend)},${f(y + dx * bend)} ${f(x + dx)},${f(y + dy)}`;
    return [`<path d="${d}" stroke="#cfc7a6" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fbf8ec" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        `<g ${T(x + dx, y + dy, a)}><ellipse rx="4.2" ry="3" fill="${p.g('#f2d65a', .3, .25)}" stroke="#c4a432" stroke-width=".5"/><path d="M-1,-2.4 L-1,2.4" stroke="#d8b83e" stroke-width=".6"/></g>`];
}
// 애호박の半月切り（皮の薄緑の縁、淡い果肉、種の並び）
function wkZucchini(p, x, y, s, r = 0, { cooked = true } = {}){
    const fl = cooked ? '#e9e4b0' : '#f2f2cc';
    return `<g ${T(x, y, r)}><path d="M${-s / 2},0 A${s / 2},${s / 2} 0 0 1 ${s / 2},0Z" fill="#7aae4a" stroke="#4d7a2c" stroke-width=".5"/><path d="M${f(-s / 2 + 1.5)},0 A${f(s / 2 - 1.5)},${f(s / 2 - 1.5)} 0 0 1 ${f(s / 2 - 1.5)},0Z" fill="${p.g(fl, .25, .15)}"/>
        ${[-.22, 0, .22].map(t => `<ellipse cx="${f(t * s)}" cy="${f(-s * .14)}" rx="1.2" ry=".8" fill="#d8d49a"/>`).join('')}</g>`;
}
// さいの目（じゃがいも・豆腐）
function wkDice(p, x, y, s, r = 0, c = '#ef7f30', { op = 1 } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)} opacity="${op}"><rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${f(s * .2)}" fill="${dk(c, .18)}"/>
        <rect x="${-h}" y="${-h}" width="${f(s * .86)}" height="${f(s * .86)}" rx="${f(s * .18)}" fill="${p.g(c, .32, .12)}" stroke="${dk(c, .25)}" stroke-width=".5"/>
        <path d="M${f(-h + s * .18)},${f(-h + s * .2)} L${f(-h + s * .62)},${f(-h + s * .2)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 照りのある角切りじゃがいも（감자조림）
function wkGlazedCube(p, x, y, s, r = 0, { c = '#c98a3a', seed = 1 } = {}){
    const R = rng(p.id + 'gcb' + seed + x + y);
    const pts = [[-1, -1], [0, -1.08], [1, -1], [1.06, 0], [1, 1], [0, 1.05], [-1, 1], [-1.06, 0]].map(([a, b]) => [a * s / 2 + (R() - .5) * 2, b * s / 2 + (R() - .5) * 2]);
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><path d="${smooth(pts, true, .75)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .62 - 1.2, b * .62 - 1.2]), true, .75)}" fill="${lt(c, .3)}" opacity=".65"/>
        <path d="M${f(-s * .3)},${f(-s * .3)} Q${f(-s * .05)},${f(-s * .44)} ${f(s * .25)},${f(-s * .32)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>
        <circle cx="${f(s * .22)}" cy="${f(s * .1)}" r="1" fill="#fff" opacity=".7"/></g>`;
}
// 豆腐の厚切り・角切り（汁の中）
function wkTofu(p, x, y, w, h, r = 0, { c = '#f7f2e4', tint = null } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(Math.min(w, h) * .16)}" fill="${p.g(c, .35, .2)}" stroke="${dk(c, .2)}" stroke-width=".6"/></g>
        ${tint ? `<rect x="${f(-w / 2)}" y="${f(h * .1)}" width="${w}" height="${f(h * .4)}" rx="${f(Math.min(w, h) * .16)}" fill="${tint}" opacity=".35"/>` : ''}
        <path d="M${f(-w / 2 + 2)},${f(-h / 2 + 2.5)} L${f(w / 2 - 3)},${f(-h / 2 + 2.5)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/></g>`;
}
// 角切りスパム（ピンクの角、焼き色）
function wkSpam(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${f(s * .9)}" rx="${f(s * .2)}" fill="${p.g('#e48a78', .3, .25)}" stroke="#a8503e" stroke-width=".5"/></g><rect x="${f(-s / 2)}" y="${f(s * .1)}" width="${s}" height="${f(s * .3)}" rx="${f(s * .15)}" fill="#c0603a" opacity=".45"/><path d="M${f(-s * .3)},${f(-s * .28)} L${f(s * .2)},${f(-s * .28)}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".7"/></g>`;
}
// 미역（大きめのわかめ、つや）
function wkMiyeok(p, x, y, s, r, { seed = 1 } = {}){
    const R = rng(p.id + 'wak' + seed);
    const pts = ring(s / 2, 15, .85, R, 1.25, .85);
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .6)}" fill="${p.g('#33441f', .3, .3)}" stroke="#1e2a14" stroke-width=".6" opacity=".9"/><path d="M${f(-s * .5)},${f(s * .02)} Q0,${f(-s * .08)} ${f(s * .5)},${f(s * .04)}" stroke="#2a3a1c" stroke-width="1.4" fill="none" opacity=".7"/><path d="M${f(-s * .3)},${f(-s * .12)} Q0,${f(-s * .2)} ${f(s * .26)},${f(-s * .12)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".4"/></g>`;
}
// 牛肉の小さなかけら（スープの中）
function wkBeefBit(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'bb' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${wkSmooth(ring(s / 2, 9, .75, R, 1.4, .7))}" fill="${p.g('#7c6656', .2, .3)}" stroke="#4e3a2e" stroke-width=".5"/><path d="M${f(-s * .25)},${f(-s * .1)} q${f(s * .2)},${f(-s * .1)} ${f(s * .4)},0" stroke="#c9a88e" stroke-width=".7" fill="none" opacity=".7"/></g>`;
}
// のり（刻みのり・もみのり）
function wkGim(p, x, y, s, { n = 12, seed = 1 } = {}){
    const R = rng(p.id + 'gim' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const cx = x + (R() - .5) * s, cy = y + (R() - .5) * s * .7, a = R() * 6.28, L = 3 + R() * 4, w = 1.6 + R() * 1.6; const ux = Math.cos(a), uy = Math.sin(a); d += `M${f1(cx - ux * L)},${f1(cy - uy * L)}l${f1(ux * 2 * L)},${f1(uy * 2 * L)}l${f1(-uy * w)},${f1(ux * w)}l${f1(-ux * 2 * L)},${f1(-uy * 2 * L)}Z`; }
    return `<path d="${d}" fill="#1f2a1c" stroke="#3a4a30" stroke-width=".4"/>`;
}
// 目玉焼き（白身がつややか、黄身はとろり）
function wkFriedEgg(p, x, y, s, r = 0){
    const R = rng(p.id + 'egg' + x);
    const pts = ring(19, 13, .2, R);
    return `<g ${T(x, y, r, s / 40)}><g ${p.sh(.9)}><path d="${wkSmooth(pts)}" fill="${p.rg('#fffdf8', .1, .08)}" stroke="#e2d8c2" stroke-width=".9"/></g>
        <path d="${wkSmooth(pts)}" fill="none" stroke="#d9a25a" stroke-width="2.2" opacity=".35"/>
        <path d="${wkSmooth(pts.map(([a, b]) => [a * .6 + 1.5, b * .6 + 1.2]))}" fill="#f6f1e6" opacity=".7"/>
        <circle cx="2" cy="1" r="8.4" fill="${p.rg('#f7a01a', .35, .18, .35, .32)}" stroke="#d07d10" stroke-width=".8"/>
        <ellipse cx="-.8" cy="-2.2" rx="3.2" ry="1.9" fill="#fff" opacity=".8"/>
        <path d="M-14,-6 Q-9,-13 -1,-14" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}

// =========================================================
const DISHES = {
    // 밥: ステンレスの공기に、つやのある白いご飯をこんもり
    kr_staple: p => [
        wkSteelBowl(p),
        wkRice(p, 100, 100, 150),
    ].join(''),

    // 제육볶음: 白い皿に、コチュジャンで赤く照った豚肉、玉ねぎ、ねぎ、にんじん、ごま。奥にサンチュ
    kr_jeyuk: p => [
        wkPlate(p),
        wkLettuce(p, 138, 56, 60, 30, { seed: 1 }), wkLettuce(p, 160, 88, 46, 80, { seed: 2, c: '#7fb84a' }),
        K.pool(p, 94, 112, 116, '#9e3018', { op: .85, seed: 2 }),
        `<g ${p.sh(1.1)}>`,
        K.onion(p, 62, 86, 26, 30, { c: '#ecaa84' }), K.onion(p, 128, 134, 24, 160, { c: '#ecaa84' }), K.onion(p, 112, 82, 22, -60, { c: '#ecaa84' }),
        ...[[78, 108, 50, -20, 1], [116, 112, 48, 30, 2], [90, 140, 46, 10, 3], [70, 74, 42, 50, 4], [106, 86, 44, -40, 5], [56, 124, 38, 70, 6], [130, 92, 36, 110, 7], [118, 146, 34, -30, 8]].map(([x, y, s, r, seed]) => K.porkSlice(p, x, y, s, r, { c: '#b9442a', fat: '#efb08e', seed, gloss: .7 })),
        K.carrotRound(p, 86, 120, 12, { half: true, r: 30 }), K.carrotRound(p, 132, 120, 12, { half: true, r: -60 }), K.carrotRound(p, 74, 92, 11, { half: true, r: 100 }),
        K.onion(p, 98, 118, 20, 100, { c: '#ecaa84', layers: 1 }),
        `</g>`,
        wkNegi(p, 94, 98, 16, 20, { green: true }), wkNegi(p, 66, 108, 14, -30), wkNegi(p, 124, 104, 15, 60, { green: true }), wkNegi(p, 104, 132, 14, -10), wkNegi(p, 80, 82, 13, 80, { green: true }),
        wkChili(p, 112, 96, 9, 20), wkChili(p, 76, 132, 8, -40),
        wkSesame(p, 96, 108, 46, 40, 18),
    ].join(''),

    // 소불고기: 白い皿に、醤油色でつやのある薄切り牛肉、玉ねぎ、にんじん、きのこ、ねぎ、ごま
    kr_bulgogi: p => [
        wkPlate(p),
        K.pool(p, 100, 104, 136, '#6a3416', { op: .82, seed: 8 }),
        `<g ${p.sh(1)}>`,
        K.onion(p, 64, 80, 28, 30, { c: '#d7a160' }), K.onion(p, 136, 124, 28, -150, { c: '#d7a160' }), K.onion(p, 118, 64, 24, 80, { c: '#d7a160' }),
        ...[[84, 96, 50, 10], [124, 94, 48, -30], [98, 128, 50, 50], [66, 120, 44, -20], [140, 72, 38, 60], [88, 64, 40, 120], [130, 142, 36, -60], [54, 96, 34, 30], [112, 110, 40, 160], [150, 108, 32, 90]].map(([x, y, s, r], i) => wkBeef(p, x, y, s, r, { c: '#6e3a1e', seed: i })),
        ...[[78, 80, -20], [116, 132, 40], [146, 92, 70], [70, 140, 10]].map(([x, y, r]) => wkStick(p, x, y, 24, 3.6, r, '#ec7a2c')),
        K.shimeji(p, 104, 76, 26, 200, { n: 3 }), K.shimeji(p, 60, 112, 24, 20, { n: 3 }),
        `</g>`,
        wkNegi(p, 96, 108, 16, 20, { green: true }), wkNegi(p, 132, 116, 15, -40, { green: true }), wkNegi(p, 74, 96, 14, 60), wkNegi(p, 110, 88, 14, -10, { green: true }), wkNegi(p, 92, 140, 14, 30),
        wkSesame(p, 100, 104, 50, 44, 30),
    ].join(''),

    // 닭볶음탕: 両手のステンレス鍋に、赤い煮汁、骨つき鶏、じゃがいも、にんじん、玉ねぎ、ねぎ
    kr_dakbokkeumtang: p => [
        wkPot(p),
        K.liquid(p, { R: 80, c: '#c2401c', op: .95, shine: false }),
        wkOil(p, 100, 100, 150, { n: 12, c: '#e8601e', op: .6, rmax: 2.6, seed: 2 }),
        `<g ${p.sh(1)}>`,
        ...[[70, 78, 34, 20], [128, 74, 34, -40], [148, 120, 32, 70], [94, 140, 34, 160], [56, 120, 30, -100]].map(([x, y, s, r], i) => K.potato(p, x, y, s, r, { c: '#f2c070', seed: i })),
        ...[[100, 96, 48, 10], [64, 98, 42, 200], [126, 104, 44, 80], [100, 60, 40, -30], [124, 142, 40, 130], [70, 140, 38, 40]].map(([x, y, s, r], i) => wkChickenBone(p, x, y, s, r, { seed: i, bone: i % 2 === 0, c: '#ad4426' })),
        K.carrotChunk(p, 86, 120, 20, 30, { c: '#e8622a' }), K.carrotChunk(p, 144, 92, 18, -50, { c: '#e8622a' }), K.carrotChunk(p, 82, 64, 18, 100, { c: '#e8622a' }),
        K.onion(p, 112, 122, 22, 40, { c: '#eaa07a' }), K.onion(p, 150, 70, 20, -20, { c: '#eaa07a' }),
        `</g>`,
        wkNegi(p, 92, 116, 15, 30, { green: true }), wkNegi(p, 116, 84, 14, -20), wkNegi(p, 78, 84, 14, 70, { green: true }), wkNegi(p, 138, 138, 13, 10, { green: true }),
        wkChili(p, 108, 132, 9, 20), wkChili(p, 60, 82, 9, -50),
        wkBubbles([[46, 98, 2.6], [154, 150, 2.2], [150, 52, 2.4], [56, 150, 2]]),
    ].join(''),

    // 고등어구이: 白い長皿に、皮目をこんがり焼いたさばの半身、大根おろし
    kr_godeungeo: p => [
        K.longPlate(p, { base: '#f6f4ef', rim: '#d2ccc0' }),
        `<g ${p.sh(1.2)}>`, wkMackerel(p, 98, 98, 150, -3), `</g>`,
        K.grated(p, 40, 136, 20),
    ].join(''),

    // 두부조림: 白い角皿に、焼いた豆腐の厚切りを並べ、赤い甘辛だれ、ねぎ、唐辛子、ごま
    kr_dubujorim: p => [
        K.squareDish(p, { s: 176, base: '#f6f4ef', rim: '#cfcac0' }),
        K.pool(p, 100, 102, 150, '#a8401c', { op: .45, seed: 3, sy: .9 }),
        `<g ${p.sh(1)}>`,
        ...[[46, 64, -8], [80, 62, -4], [114, 60, -6], [148, 62, -3], [48, 102, -5], [82, 100, -8], [116, 100, -4], [150, 98, -6], [50, 140, -4], [84, 138, -6], [118, 138, -3], [152, 136, -7]].map(([x, y, r], i) => wkTofuJorim(p, x, y, 40, 40, r, { seed: i })),
        `</g>`,
        K.scallions(p, 100, 102, 120, { n: 22, c: '#4f9a34' }),
        wkChili(p, 80, 84, 8, 20, { c: '#c8281a' }), wkChili(p, 120, 124, 8, -30, { c: '#c8281a' }), wkChili(p, 118, 84, 8, 50), wkChili(p, 82, 122, 8, -10),
        wkFlakes(p, 100, 104, 60, 56, 40),
        wkSesame(p, 100, 104, 56, 54, 26),
    ].join(''),

    // 김치볶음밥: 白い浅鉢に、キムチで赤く炒めたご飯、スパム、目玉焼き、刻みのり、ごま、ねぎ
    kr_kimchibokkeumbap: p => [
        wkPlate(p, { rim: '#b8b2a6' }),
        wkRice(p, 100, 102, 138, { tint: '#e48a4a', density: .9, hiK: .5, seed: 2 }),
        `<g ${p.sh(.7)}>`,
        ...wkSpots('kbb', 14, 54, 16, 100, 102).map(([x, y, r], i) => i % 2 ? wkKimchi(p, x, y, 18, r, { seed: i, deep: .5 }) : wkSpam(p, x, y, 9, r)),
        `</g>`,
        wkFriedEgg(p, 104, 92, 66, 10),
        wkGim(p, 66, 128, 34, { n: 8 }), wkGim(p, 140, 128, 30, { n: 6, seed: 2 }),
        K.scallions(p, 100, 104, 120, { n: 14, c: '#4f9a34' }),
        wkSesame(p, 100, 100, 60, 56, 16),
    ].join(''),

    // 오징어볶음: 白い皿に、格子の切り目のいかを赤いたれで炒め、キャベツ・にんじん・玉ねぎ・ねぎ
    kr_ojingeobokkeum: p => [
        wkPlate(p),
        K.pool(p, 100, 104, 140, '#b8361a', { op: .82, seed: 5 }),
        `<g ${p.sh(1)}>`,
        ...[[64, 82, 30, 20], [138, 124, 30, -40], [128, 64, 26, 70], [66, 130, 26, 10]].map(([x, y, s, r], i) => K.leafPiece(p, x, y, s, r, { c: '#d9dc9a', seed: i, cooked: true })),
        ...[[86, 96, 40, 18, 20], [124, 98, 38, 18, -30], [100, 128, 40, 18, 10], [70, 112, 34, 16, 70], [108, 70, 36, 16, -10], [140, 140, 30, 15, 40], [144, 86, 30, 14, 90]].map(([x, y, w, h, r], i) => wkSquid(p, x, y, w * 1.1, h * 1.1, r, { seed: i })),
        wkTentacles(p, 82, 144, 30, 30, { c: '#e4a088' }), wkTentacles(p, 70, 70, 26, -60, { c: '#e4a088' }),
        ...[[96, 110, 10], [118, 140, -40], [56, 100, 70], [130, 78, 20]].map(([x, y, r]) => wkStick(p, x, y, 22, 3.6, r, '#ec7a2c')),
        K.onion(p, 112, 112, 20, 60, { c: '#eaa07a' }), K.onion(p, 90, 76, 20, -30, { c: '#eaa07a' }),
        `</g>`,
        wkNegi(p, 100, 100, 15, 20, { green: true }), wkNegi(p, 132, 112, 14, -50, { green: true }), wkNegi(p, 78, 120, 13, 40), wkNegi(p, 120, 84, 13, 80, { green: true }),
        wkChili(p, 92, 116, 8, 30), wkChili(p, 114, 90, 8, -20),
        wkSesame(p, 100, 104, 50, 46, 14),
    ].join(''),

    // 콩나물무침: 白磁の小鉢に、黄色い豆のついた大豆もやし、ねぎ、ごま
    kr_kongnamul: p => {
        const R = rng(p.id + 'kg');
        const stems = [], heads = [];
        for (const [x, y] of wkSpots('kong', 26, 52, 11)){
            const [s, h] = wkSoySprout(p, x, y, R() * 360, 28 + R() * 10, { bend: (R() - .5) * .5 });
            stems.push(s); heads.push(h);
        }
        return [
            wkDish(p),
            `<g ${p.sh(1)}><path ${T(100, 100)} d="${smooth(ring(62, 12, .14, R, 1, .95))}" fill="${p.rg('#ede6c8', .25, .25)}"/></g>`,
            `<g ${p.sh(.6)}>`, stems.join(''), heads.join(''), `</g>`,
            K.scallions(p, 100, 100, 90, { n: 12, c: '#4f9a34' }),
            wkSesame(p, 100, 100, 50, 46, 24),
        ].join('');
    },

    // 시금치나물: 白磁の小鉢に、ごま油で和えたほうれん草（濃い葉と明るい茎）、ごま
    kr_sigeumchi: p => {
        const R = rng(p.id + 'sg');
        let g = '';
        for (const [x, y] of wkSpots('sg1', 12, 46, 14)) g += wkLeaf(p, x, y, 30 + R() * 8, R() * 360, R() < .5 ? '#2a6424' : '#357a2c');
        for (const [x, y] of wkSpots('sg2', 12, 44, 12)) g += wkStick(p, x, y, 26 + R() * 6, 4, R() * 180, '#8cc05a', { gloss: .5 });
        for (const [x, y] of wkSpots('sg3', 8, 36, 14)) g += wkLeaf(p, x, y, 28, R() * 360, '#2f6e28');
        return [
            wkDish(p, { glaze: '#a9c3b2', inside: '#eef3ec' }),
            `<g ${p.sh(1)}><path ${T(100, 100)} d="${smooth(ring(58, 12, .16, R, 1, .95))}" fill="${p.rg('#2a5a22', .25, .3)}"/></g>`,
            `<g ${p.sh(.7)}>`, g, `</g>`,
            wkSesame(p, 100, 100, 50, 46, 34),
        ].join('');
    },

    // 계란말이: 白い長皿に、にんじんとねぎの入った卵焼きの厚切りを並べる
    kr_gyeranmari: p => [
        K.longPlate(p, { w: 184, h: 112, base: '#f6f4ef', rim: '#d2ccc0' }),
        `<g ${p.sh(1)}>`,
        ...[30, 58, 86, 114, 142, 170].map((x, i) => wkRollSlice(p, x, 100 + (i % 2 ? 2 : -2), 30, 64, i % 2 ? 4 : -3, { seed: i })),
        `</g>`,
    ].join(''),

    // 멸치볶음: 白磁の小鉢に、照りのある小さな煮干しとアーモンド、ごま
    kr_myeolchi: p => {
        const R = rng(p.id + 'my');
        const fish = wkSpots('my', 44, 56, 10).map(([x, y, r]) => wkAnchovy(p, x, y, 22 + R() * 6, r, { c: R() < .5 ? '#d4a860' : '#c08f4a' })).join('');
        return [
            wkDish(p, { glaze: '#d9d2c2', inside: '#f8f6f0' }),
            `<g ${p.sh(1)}><path ${T(100, 100)} d="${smooth(ring(64, 12, .12, R, 1, .95))}" fill="${p.rg('#c09050', .25, .3)}"/></g>`,
            `<g ${p.sh(.4)}>`, fish, `</g>`,
            ...[[80, 84, 20], [124, 92, -40], [96, 126, 70], [132, 128, 10], [68, 116, -70]].map(([x, y, r]) => wkAlmond(p, x, y, 16, r)),
            wkSesame(p, 100, 100, 54, 50, 18),
            `<path d="M52,82 A52,52 0 0 1 82,50" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`,
        ].join('');
    },

    // 오이무침: 白磁の小鉢に、粉唐辛子で赤く和えた薄切りきゅうりと玉ねぎ、ごま
    kr_oimuchim: p => {
        const R = rng(p.id + 'oi');
        return [
            wkDish(p),
            `<g ${p.sh(.8)}>`,
            ...wkSpots('oi', 22, 52, 14).map(([x, y, r]) => K.cucumberSlice(p, x, y, 22 + R() * 4, r, { oval: 1.2 })),
            K.onion(p, 82, 94, 22, 30, { c: '#f2d2c0', layers: 1 }), K.onion(p, 122, 116, 20, -60, { c: '#f2d2c0', layers: 1 }), K.onion(p, 110, 76, 18, 120, { c: '#f2d2c0', layers: 1 }),
            `</g>`,
            `<circle cx="100" cy="100" r="60" fill="#d4401e" opacity=".22"/>`,
            wkFlakes(p, 100, 100, 58, 56, 150, { seed: 2 }),
            wkFlakes(p, 100, 100, 50, 48, 60, { seed: 3, c: '#e0562a' }),
            K.scallions(p, 100, 100, 90, { n: 8, c: '#4f9a34' }),
            wkSesame(p, 100, 100, 54, 50, 26),
        ].join('');
    },

    // 감자조림: 白磁の小鉢に、醤油で照りよく煮た角切りじゃがいも、にんじん、ごま
    kr_gamjajorim: p => {
        const R = rng(p.id + 'gj');
        return [
            wkDish(p, { glaze: '#5a4a3e', inside: '#efe8dc' }),
            K.liquid(p, { R: 60, c: '#9a5a22', op: .7, shine: false }),
            `<g ${p.sh(.8)}>`,
            ...wkSpots('gj', 15, 48, 21).map(([x, y, r], i) => i % 5 === 3 ? K.carrotChunk(p, x, y, 17, r, { c: '#e0702a' }) : K.potato(p, x, y, 27 + R() * 3, r, { c: '#c99048', seed: i })),
            K.liquid(p, { R: 58, c: '#ffffff', op: 0, shine: false }),
            ...wkSpots('gj', 15, 48, 21).filter((_, i) => i % 5 !== 3).map(([x, y]) => `<path d="M${f(x - 7)},${f(y - 4)} q4,-4 9,-3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>`),
            `</g>`,
            wkSesame(p, 100, 100, 52, 48, 28),
        ].join('');
    },

    // 된장찌개: 뚝배기に、にごった味噌色の汁、豆腐、애호박、じゃがいも、玉ねぎ、青唐辛子、ねぎ
    kr_doenjangjjigae: p => {
        const sp = wkSpots('dj', 22, 60, 15);
        return [
            wkTtuk(p),
            K.liquid(p, { R: 78, c: '#9c7440', op: 1, shine: false }),
            `<circle cx="100" cy="100" r="78" fill="none" stroke="#6e4a22" stroke-width="4" opacity=".45"/>`,
            `<g ${p.sh(.7)}>`,
            ...sp.map(([x, y, r], i) => i % 4 === 0 ? wkTofu(p, x, y, 17, 17, r, { c: '#f6efdc' }) : i % 4 === 1 ? wkZucchini(p, x, y, 20, r) : i % 4 === 2 ? wkDice(p, x, y, 13, r, '#ecd79a') : K.onion(p, x, y, 16, r, { c: '#e6cf98', layers: 1 })),
            `</g>`,
            `<circle cx="100" cy="100" r="76" fill="#a07a48" opacity=".18"/>`,
            wkChili(p, 96, 92, 9, 20), wkChili(p, 126, 120, 9, -40), wkChili(p, 72, 118, 9, 60), wkChili(p, 118, 70, 8, 10, { c: '#c8281a' }), wkChili(p, 80, 72, 8, -30, { c: '#c8281a' }),
            K.scallions(p, 100, 100, 110, { n: 14, c: '#4f9a34' }),
            wkBubbles([[60, 60, 2.4], [146, 76, 2], [54, 136, 2.2], [150, 146, 2], [100, 160, 1.8]], '#d8bc8a'),
            wkShine(100, 100, 78, .3),
        ].join('');
    },

    // 김치찌개: 뚝배기に、赤い汁、キムチ、豚肉、豆腐の厚切り、ねぎ
    kr_kimchijjigae: p => [
        wkTtuk(p),
        K.liquid(p, { R: 78, c: '#c8361a', op: 1, shine: false }),
        `<circle cx="100" cy="100" r="78" fill="none" stroke="#8e1e10" stroke-width="5" opacity=".45"/>`,
        wkOil(p, 100, 100, 146, { n: 14, c: '#ee6a2a', op: .65, rmax: 2.4, seed: 3 }),
        `<g ${p.sh(.8)}>`,
        ...[[70, 76, 34, 20], [132, 70, 32, -30], [148, 110, 30, 60], [64, 124, 32, -60], [104, 148, 30, 10], [100, 62, 28, 150], [128, 138, 28, 100]].map(([x, y, s, r], i) => wkKimchi(p, x, y, s, r, { seed: i, deep: .45 })),
        wkPorkBelly(p, 82, 98, 26, 16, -30, { seed: 2, tint: '#d0502a' }), wkPorkBelly(p, 122, 92, 24, 15, 50, { seed: 3, tint: '#d0502a' }),
        wkPorkBelly(p, 92, 130, 24, 15, 10, { seed: 4, tint: '#d0502a' }), wkPorkBelly(p, 140, 132, 22, 14, -60, { seed: 5, tint: '#d0502a' }),
        wkTofu(p, 104, 98, 30, 22, -10, { tint: '#e0603a' }), wkTofu(p, 76, 100, 26, 20, 60, { tint: '#e0603a' }), wkTofu(p, 128, 118, 26, 20, 20, { tint: '#e0603a' }),
        `</g>`,
        wkNegi(p, 96, 82, 15, 20, { green: true }), wkNegi(p, 116, 126, 14, -40), wkNegi(p, 70, 140, 13, 60, { green: true }), wkNegi(p, 140, 90, 13, 10, { green: true }), wkNegi(p, 86, 116, 13, -70),
        wkBubbles([[58, 58, 2.6], [150, 54, 2.2], [46, 104, 2.4], [158, 136, 2], [90, 162, 2.2]]),
    ].join(''),

    // 미역국: 白い汁碗に、ごま油の浮いた澄んだ汁、たっぷりのわかめ、牛肉
    kr_miyeokguk: p => [
        K.bowl(p, { glaze: '#f3f1ec', inside: '#fbfaf6', lip: .9 }),
        K.liquid(p, { R: 80, c: '#b8a47e', op: .9, shine: false }),
        ...wkSpots('my', 15, 58, 22).map(([x, y, r], i) => wkMiyeok(p, x, y, 38 + (i % 3) * 6, r, { seed: i })),
        `<g ${p.sh(.4)}>`,
        ...wkSpots('mb', 12, 54, 16).map(([x, y, r], i) => wkBeefBit(p, x, y, 13, r, { seed: i })),
        `</g>`,
        `<circle cx="100" cy="100" r="80" fill="#c8b48a" opacity=".16"/>`,
        wkOil(p, 100, 100, 140, { n: 14, c: '#f1c04e', op: .6, rmax: 2.2 }),
        wkShine(100, 100, 80, .45),
    ].join(''),
};

// 小数を1桁に丸めてファイルを軽くする
const wkSlim = str => str.replace(/(\d+\.\d)\d+/g, '$1').replace(/(\d)\.0(?!\d)/g, '$1');
export default Object.fromEntries(Object.entries(DISHES).map(([id, fn]) => [id, p => wkSlim(fn(p))]));
