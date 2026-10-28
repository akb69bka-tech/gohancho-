// World edition (hand-drawn redo): Turkey (tr)
import * as K from '../kit.mjs';
const { T, f, smooth, ring, rng, lt, dk, mix } = K;
const f1 = n => Math.round(n * 10) / 10;

// ---------- このファイル専用の部品（xtr〜）。w_tr の部品を写して使う ----------
const xtrBlur = (p, s = 2) => `filter="url(#${p.def('xtrbl' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`)})"`;
const TURQ = '#1f8a8f', COBALT = '#23468c', TRED = '#c0362c';
const arc = (x, y, r) => `M${f1(x + r)},${f1(y)}a${f1(r)},${f1(r)} 0 1 0 ${f1(-2 * r)},0a${f1(r)},${f1(r)} 0 1 0 ${f1(2 * r)},0`;

// ===== 器 =====
function xtrPlate(p, { rim = TURQ, line = COBALT } = {}){
    return K.plate(p, { rim }) + (line ? `<circle cx="100" cy="100" r="87" fill="none" stroke="${line}" stroke-width=".8" opacity=".7"/>` : '');
}
function xtrIznikBowl(p, { R = 92, lip = .84, inside = '#fbf8f1', n = 12 } = {}){
    const r0 = R * lip, mid = (R + r0) / 2;
    let deco = '';
    for (let i = 0; i < n; i++){
        const a = i / n * Math.PI * 2, x = 100 + Math.cos(a) * mid, y = 100 + Math.sin(a) * mid, deg = a * 57.3 + 90;
        deco += `<g ${T(x, y, deg)}><path d="M0,-4 C2.6,-2 2.6,2 0,4 C-2.6,2 -2.6,-2 0,-4Z" fill="${TRED}"/><path d="M-4.6,0 Q-2.4,-1.6 0,0 Q-2.4,1.6 -4.6,0Z M4.6,0 Q2.4,-1.6 0,0 Q2.4,1.6 4.6,0Z" fill="${TURQ}"/></g>`;
        const b = (i + .5) / n * Math.PI * 2;
        deco += `<circle cx="${f(100 + Math.cos(b) * mid)}" cy="${f(100 + Math.sin(b) * mid)}" r="2" fill="${COBALT}"/>`;
    }
    return K.bowl(p, { glaze: '#f6f2e8', inside, R, lip }) + `<circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="${COBALT}" stroke-width="2"/><circle cx="100" cy="100" r="${f(r0 + 1.2)}" fill="none" stroke="${COBALT}" stroke-width="1.4"/>` + deco;
}
// 色釉の鉢（外の釉薬、内は白、縁に線）
function xtrBowl(p, { glaze = '#f3efe6', inside = '#fbf9f2', line = null, inner = null, R = 92, lip = .87, dots = null } = {}){
    let s = K.bowl(p, { glaze, inside, R, lip });
    if (line) s += `<circle cx="100" cy="100" r="${R - 4.5}" fill="none" stroke="${line}" stroke-width="2.4"/>`;
    if (inner) s += `<circle cx="100" cy="100" r="${f(R * lip + 1.4)}" fill="none" stroke="${inner}" stroke-width="1.2"/>`;
    if (dots){ const mid = (R + R * lip) / 2; for (let i = 0; i < 20; i++){ const a = i / 20 * 6.283; s += `<circle cx="${f(100 + Math.cos(a) * mid)}" cy="${f(100 + Math.sin(a) * mid)}" r="1.6" fill="${dots}" opacity=".9"/>`; } }
    return s;
}
// 銅のサハン（両手の小鍋）
function xtrSahan(p, { R = 80, inner = '#cfcac0' } = {}){
    const handle = x => `<g ${p.sh(1)}><path d="M${x - 9},88 Q${x},84 ${x + 9},88 L${x + 9},112 Q${x},116 ${x - 9},112Z" fill="${p.g('#b8622e', .3, .3)}" stroke="#7a3814" stroke-width=".8"/></g><ellipse cx="${x}" cy="100" rx="3.4" ry="7" fill="#5a2a10" opacity=".6"/>`;
    return handle(100 - R - 2) + handle(100 + R + 2) +
        `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R + 4}" fill="${p.rg('#c4703a', .3, .35, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R + 2}" fill="none" stroke="#e8a06a" stroke-width="1.4" opacity=".8"/>
        <circle cx="100" cy="100" r="${R - 4}" fill="${p.rg(inner, .2, .25, .6, .62)}"/>
        <path d="M${100 - R * .7},${100 - R * .55} A${R * .9},${R * .9} 0 0 1 ${100 - R * .1},${100 - R * .9}" stroke="#ffe0c0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`;
}
// 銅の鉢（内はすず引き）
function xtrCopperBowl(p, { R = 92, lip = .86 } = {}){
    const r = R * lip;
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg('#c26a34', .3, .35, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2}" fill="none" stroke="#f0b07a" stroke-width="1.3" opacity=".75"/>
        ${Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.283, d = (R + r) / 2; return `<ellipse cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" rx="2.4" ry="1.6" fill="#e89a62" opacity=".45" transform="rotate(${f(a * 57.3)} ${f(100 + Math.cos(a) * d)} ${f(100 + Math.sin(a) * d)})"/>`; }).join('')}
        <circle cx="100" cy="100" r="${f(r)}" fill="${p.rg('#cdc8bd', .2, .3, .6, .62)}"/>
        <path d="M${100 - R * .7},${100 - R * .42} A${R * .82},${R * .82} 0 0 1 ${100 - R * .25},${100 - R * .78}" stroke="#ffe0c0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`;
}
// 素焼きの土鍋（ギュヴェチ）: 外は素焼き、内は焦げ茶の釉、左右に耳
function xtrGuvec(p, { R = 84, lip = .84, c = '#a8562e', glz = '#5e2a14' } = {}){
    const r = R * lip;
    const lug = x => `<g ${p.sh(1)}><ellipse cx="${x}" cy="100" rx="11" ry="15" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .35)}" stroke-width=".8"/></g>`;
    return lug(100 - R + 1) + lug(100 + R - 1) +
        `<g ${p.sh(1.8)}><g ${p.crumb(1.1)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .25, .35, .35, .3)}"/></g></g>
        <circle cx="100" cy="100" r="${f(r + 3)}" fill="none" stroke="${lt(c, .25)}" stroke-width="2.4" opacity=".7"/>
        <circle cx="100" cy="100" r="${f(r)}" fill="${p.rg(glz, .15, .3, .6, .62)}"/>
        <path d="M${100 - R * .72},${100 - R * .4} A${R * .84},${R * .84} 0 0 1 ${100 - R * .25},${100 - R * .8}" stroke="#ffd8b8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>`;
}
// 丸い金属のテプスィ（焼き皿）
function xtrTepsi(p, { R = 94, c = '#b9b5ad' } = {}){
    return `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R}" fill="${p.rg(c, .35, .3, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R - 2.5}" fill="none" stroke="${lt(c, .55)}" stroke-width="1.4"/>
        <circle cx="100" cy="100" r="${R - 7}" fill="${p.rg(dk(c, .12), .1, .25, .6, .62)}"/>
        <circle cx="100" cy="100" r="${R - 7}" fill="none" stroke="${dk(c, .3)}" stroke-width="1"/>`;
}
// 四角い金属の天板
function xtrRectTray(p, { w = 188, h = 150, c = '#b3afa8' } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.8)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${p.rg(c, .35, .3, .35, .3)}"/></g>
        <rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="10" fill="none" stroke="${lt(c, .55)}" stroke-width="1.4"/>
        <rect x="${x + 7}" y="${y + 7}" width="${w - 14}" height="${h - 14}" rx="7" fill="${p.rg(dk(c, .14), .1, .25, .6, .6)}" stroke="${dk(c, .3)}" stroke-width="1"/>`;
}
// 耐熱ガラスの角皿（ボルジャム）
function xtrGlassDish(p, { w = 186, h = 140 } = {}){
    const x = 100 - w / 2, y = 100 - h / 2;
    return `<g ${p.sh(1.6)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#d9e8e6" opacity=".9"/></g>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="none" stroke="#a9c6c3" stroke-width="2"/>
        <rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" rx="13" fill="${p.rg('#cfe0dc', .2, .1, .5, .5)}" stroke="#b5ceca" stroke-width="1.2"/>
        <path d="M${x + 14},${y + 34} Q${x + 14},${y + 14} ${x + 34},${y + 14}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`;
}
// ステンレスの浅鍋（両手）
function xtrPot(p, { R = 82 } = {}){
    const handle = x => `<g ${p.sh(1)}><rect x="${x - 8}" y="93" width="16" height="14" rx="5" fill="${p.g('#a8a6a2', .35, .3)}" stroke="#6e6c68" stroke-width=".8"/></g>`;
    return handle(100 - R - 6) + handle(100 + R + 6) +
        `<g ${p.sh(1.8)}><circle cx="100" cy="100" r="${R + 4}" fill="${p.rg('#c9c7c2', .4, .35, .35, .3)}"/></g>
        <circle cx="100" cy="100" r="${R + 2}" fill="none" stroke="#f4f3f0" stroke-width="1.6" opacity=".9"/>
        <circle cx="100" cy="100" r="${R - 3}" fill="${p.rg('#9e9b95', .2, .25, .6, .62)}"/>`;
}

// ===== 面・汁 =====
const xtrShine = (cx, cy, R, op = .35) => `<path d="M${cx - R * .55},${cy + R * .1} A${R * .6},${R * .6} 0 0 1 ${cx - R * .05},${cy - R * .52}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// スープの面（中心をやや明るく）
function xtrSoup(p, c, { R = 74, veil = null, vop = .3 } = {}){
    return K.liquid(p, { R, c, op: 1, shine: false }) + `<circle cx="96" cy="94" r="${f(R * .66)}" fill="${veil || lt(c, .25)}" opacity="${vop}"/>`;
}
// クリームの渦
function xtrSwirl(p, x, y, s, { c = '#f8f2e4', turns = 1.6, w = 3.2, r0 = 0 } = {}){
    const pts = Array.from({ length: 22 }, (_, i) => { const t = i / 21, a = r0 + t * turns * 6.283, rr = s / 2 * (.12 + t * .88); return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * .92]; });
    const d = smooth(pts, false);
    return `<g ${xtrBlur(p, .5)}><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".92"/></g><path d="${d}" stroke="#fff" stroke-width="${f(w * .3)}" fill="none" stroke-linecap="round" opacity=".6" transform="translate(-.6 -.6)"/>`;
}
function xtrOil(p, x, y, s, { n = 12, c = '#e8642a', seed = 1, op = .6, rmax = 2.6 } = {}){
    const R = rng(p.id + 'xtroi' + seed + x);
    let d = '', h = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = .9 + R() * rmax; d += arc(cx, cy, rr); h += `M${f(cx - rr * .5)},${f(cy - rr * .3)}l${f(rr * .4)},${f(-rr * .25)}`; }
    return `<path d="${d}" fill="${c}" opacity="${op}" stroke="${dk(c, .2)}" stroke-width=".4"/><path d="${h}" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".7"/>`;
}
function xtrRedButter(p, x, y, s, { seed = 1, n = 8, op = .8 } = {}){
    const R = rng(p.id + 'xtrrb' + seed + x);
    let d = '';
    for (let i = 0; i < 2; i++){
        const a0 = R() * 6.28, rr = s * (.18 + i * .16);
        const pts = Array.from({ length: 6 }, (_, j) => { const a = a0 + j * .55; return [x + Math.cos(a) * rr * (1 + (R() - .5) * .2), y + Math.sin(a) * rr * .85]; });
        d += smooth(pts, false);
    }
    let pools = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s * .4; pools += `<ellipse cx="${f(x + Math.cos(a) * dd)}" cy="${f(y + Math.sin(a) * dd)}" rx="${f(3 + R() * 4)}" ry="${f(2 + R() * 2.5)}" fill="#d9481c" opacity="${f(op * .7)}"/>`; }
    return `<g ${xtrBlur(p, .7)}><path d="${d}" stroke="#d9481c" stroke-width="3.4" fill="none" stroke-linecap="round" opacity="${op}"/>${pools}</g><path d="${d}" stroke="#f08a4a" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/>` + K.sprinkle(p, x, y, s, { c: '#8a1a0a', n: Math.round(n * 3), r: .7 });
}
function xtrMint(p, x, y, s, { n = 24 } = {}){
    return K.sprinkle(p, x, y, s, { c: '#5a7a34', n, r: .9 }) + K.sprinkle(p, x + 2, y + 1, s * .9, { c: '#7a9a48', n: Math.round(n / 2), r: .8 });
}
function xtrYogurt(p, x, y, s, { seed = 1, sy = .85, c = '#fbfaf3' } = {}){
    const R = rng(p.id + 'xtryg' + seed + x);
    const pts = ring(s / 2, 11, .2, R, 1, sy);
    return `<g ${p.sh(.6)}><path ${T(x, y)} d="${smooth(pts)}" fill="${p.rg(c, .2, .1, .38, .34)}" stroke="#e4e0d2" stroke-width=".7"/></g>
        <path ${T(x, y)} d="M${f(-s * .3)},${f(-s * .14)} Q${f(-s * .1)},${f(-s * .3)} ${f(s * .16)},${f(-s * .26)}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>`;
}

// ===== 散らし・配置 =====
function xtrSpots(seed, n, rmax, minD, cx = 100, cy = 100, sy = 1){
    const R = rng('xtrspots' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const a = R() * 6.28, d = Math.sqrt(R()) * rmax, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sy;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
// 四角の中の配置
function xtrSpotsRect(seed, n, w, h, minD, cx = 100, cy = 100){
    const R = rng('xtrsr' + seed), out = [];
    for (let t = 0; t < 6000 && out.length < n; t++){
        const x = cx + (R() - .5) * w, y = cy + (R() - .5) * h;
        if (out.every(([u, v]) => Math.hypot(u - x, v - y) >= minD)) out.push([x, y, Math.round(R() * 360)]);
    }
    return out;
}
function xtrGrains(p, x, y, s, { cols = ['#8a5a34'], n = 40, size = 1.6, seed = 1, sy = 1, long = 1 } = {}){
    const R = rng(p.id + 'xtrgr' + seed + x + y);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * sy;
        const rr = size * (.7 + R() * .6), k = Math.floor(R() * cols.length), a0 = R() * 6.28;
        ds[k] += 'M' + Array.from({ length: 5 }, (_, j) => { const aa = j / 5 * 6.28, ux = Math.cos(aa) * rr * long, uy = Math.sin(aa) * rr * .7; return `${f(gx + ux * Math.cos(a0) - uy * Math.sin(a0))},${f(gy + ux * Math.sin(a0) + uy * Math.cos(a0))}`; }).join('L') + 'Z';
    }
    return cols.map((c, i) => ds[i] ? `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .22)}" stroke-width=".45" stroke-linejoin="round"/>` : '').join('');
}
// 丸い粒（豆・グリーンピース・コーン）: 3〜4本の path で何十粒も
function xtrBalls(p, pts, { c = '#7cb342', op = 1 } = {}){
    let a = '', b = '', l = '', h = '';
    for (const [x, y, r] of pts){ a += arc(x, y, r); b += arc(x - r * .12, y - r * .12, r * .8); l += arc(x - r * .3, y - r * .3, r * .38); h += arc(x - r * .4, y - r * .42, r * .17); }
    return `<g opacity="${op}"><path d="${a}" fill="${dk(c, .25)}" stroke="${dk(c, .45)}" stroke-width=".5"/><path d="${b}" fill="${c}"/><path d="${l}" fill="${lt(c, .25)}" opacity=".8"/><path d="${h}" fill="#fff" opacity=".8"/></g>`;
}
function xtrParsley(p, x, y, s, { n = 20, seed = 1 } = {}){
    const R = rng(p.id + 'xtrpa' + seed + x + y);
    const ds = ['', ''];
    for (let i = 0; i < n; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = 1.4 + R() * 1.4; ds[R() < .5 ? 0 : 1] += 'M' + Array.from({ length: 6 }, (_, j) => { const aa = j / 6 * 6.28 + R(), r2 = rr * (j % 2 ? .55 : 1); return `${f(cx + Math.cos(aa) * r2)},${f(cy + Math.sin(aa) * r2)}`; }).join('L') + 'Z'; }
    return `<path d="${ds[0]}" fill="#3f8a2c" stroke="#2a6a1c" stroke-width=".4" stroke-linejoin="round"/><path d="${ds[1]}" fill="#5aa63c" stroke="#3a7a22" stroke-width=".4" stroke-linejoin="round"/>`;
}
// ディルの葉（細い羽のような線）
function xtrDill(p, x, y, s, { n = 5, seed = 1 } = {}){
    const R = rng(p.id + 'xtrdl' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){
        const cx = x + (R() - .5) * s * .7, cy = y + (R() - .5) * s * .7, a = R() * 6.28, L = s * (.25 + R() * .2);
        const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L;
        d += `M${f(cx)},${f(cy)}L${f(ex)},${f(ey)}`;
        for (let j = 1; j < 5; j++){ const t = j / 5, bx = cx + (ex - cx) * t, by = cy + (ey - cy) * t, l2 = L * .32 * (1 - t * .5); for (const sg of [-1, 1]){ const b = a + sg * .7; d += `M${f(bx)},${f(by)}l${f(Math.cos(b) * l2)},${f(Math.sin(b) * l2)}`; } }
    }
    return `<path d="${d}" stroke="#3f7a2a" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#7ab04a" stroke-width=".45" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
function xtrScallion(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'xtrsc' + seed + x);
    let d = '', d2 = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = 1.8 + R() * .8; const seg = `M${f(cx + rr)},${f(cy)}a${f(rr)},${f(rr * .85)} 0 1 0 ${f(-2 * rr)},0a${f(rr)},${f(rr * .85)} 0 1 0 ${f(2 * rr)},0`; if (R() < .6) d += seg; else d2 += seg; }
    return `<path d="${d}" fill="#c6e09a" stroke="#4f9a34" stroke-width="1"/><path d="${d2}" fill="#eef4dc" stroke="#9cc46a" stroke-width="1"/>`;
}
// 紫玉ねぎの薄切り（三日月の線）
function xtrRedOnion(p, x, y, s, { n = 14, seed = 1, c = '#9a3a72' } = {}){
    const R = rng(p.id + 'xtrro' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, rr = 5 + R() * 6, a0 = R() * 6.28, sw = 1.2 + R() * 1.4; d += `M${f(cx + Math.cos(a0) * rr)},${f(cy + Math.sin(a0) * rr)}A${f(rr)},${f(rr)} 0 0 1 ${f(cx + Math.cos(a0 + sw) * rr)},${f(cy + Math.sin(a0 + sw) * rr)}`; }
    return `<path d="${d}" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#f1dbe8" stroke-width="1.5" fill="none" stroke-linecap="round" transform="translate(.5 .7)"/>`;
}

// ===== 具 =====
function xtrBean(p, x, y, s, r = 0, { c = '#f1e2c2', tint = '#c8552e', top = .35 } = {}){
    return `<g ${T(x, y, r)}><ellipse rx="${f(s / 2)}" ry="${f(s * .34)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".5"/>${tint ? `<ellipse cx="${f(s * .05)}" cy="${f(s * .2)}" rx="${f(s * .3)}" ry="${f(s * .1)}" fill="${tint}" opacity="${top}"/>` : ''}<ellipse cx="${f(-s * .14)}" cy="${f(-s * .1)}" rx="${f(s * .16)}" ry="${f(s * .07)}" fill="#fff" opacity=".85"/></g>`;
}
function xtrSivri(p, x, y, L, r = 0, { c = '#5a9a2e', bend = 4, cooked = false } = {}){
    const col = cooked ? mix(c, '#8a8a2a', .3) : c;
    const w = L * .13;
    const d = `M${-L / 2},0 C${f(-L * .2)},${f(-w - bend)} ${f(L * .25)},${f(-w * .7 - bend)} ${L / 2},${f(-bend * .4)} C${f(L * .25)},${f(w * .5 - bend)} ${f(-L * .2)},${f(w - bend)} ${-L / 2},0Z`;
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${d}" fill="${p.g(col, .35, .25)}" stroke="${dk(col, .35)}" stroke-width=".7"/></g>
        <path d="M${f(-L * .38)},${f(-w * .4 - bend * .5)} Q${f(-L * .05)},${f(-w * .9 - bend)} ${f(L * .3)},${f(-w * .5 - bend * .8)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M${-L / 2},0 q${f(-w * .6)},${f(-w * .2)} ${f(-w * 1.2)},${f(-w * .9)}" stroke="#3f6a1c" stroke-width="${f(w * .55)}" fill="none" stroke-linecap="round"/>
        <ellipse cx="${f(-L / 2 + w * .3)}" cy="0" rx="${f(w * .6)}" ry="${f(w * .8)}" fill="#4a7a22"/></g>`;
}
function xtrTomatoSlice(p, x, y, s, r = 0){
    const h = s / 2;
    const rooms = [0, 1, 2].map(i => `<g transform="rotate(${i * 120 + 30})"><path d="M${f(h * .15)},${f(-h * .12)} Q${f(h * .64)},${f(-h * .56)} ${f(h * .7)},0 Q${f(h * .64)},${f(h * .56)} ${f(h * .15)},${f(h * .12)}Z" fill="#f2694c"/><ellipse cx="${f(h * .42)}" cy="-1.2" rx="1.1" ry=".7" fill="#f7d36a"/><ellipse cx="${f(h * .42)}" cy="1.4" rx="1.1" ry=".7" fill="#f7d36a"/></g>`).join('');
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><circle r="${h}" fill="${p.g('#de3a2a', .25, .25)}" stroke="#a51f17" stroke-width=".6"/></g><circle r="${f(h * .86)}" fill="#e8483a"/>${rooms}<path d="M${f(-h * .55)},${f(-h * .45)} Q${f(-h * .1)},${f(-h * .8)} ${f(h * .35)},${f(-h * .6)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
function xtrLemonRound(p, x, y, s){
    return `<g ${p.sh(.5)}><circle cx="${f(x)}" cy="${f(y)}" r="${s / 2}" fill="#f2cf3a" stroke="#c9a114" stroke-width=".6"/></g><circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2 - 1.8)}" fill="#fbeea0"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${f(x)},${f(y)} L${f(x + Math.cos(i * .785) * (s / 2 - 2.4))},${f(y + Math.sin(i * .785) * (s / 2 - 2.4))}" stroke="#fffbe0" stroke-width="1"/>`).join('')}<circle cx="${f(x)}" cy="${f(y)}" r="1.4" fill="#fffbe0"/>`;
}
function xtrLemonWedge(p, x, y, s, r = 0){
    const k = s / 20;
    return `<g ${T(x, y, r, k)}><g ${p.sh(.5)}><path d="M-10,0 Q0,-8 10,0 Q0,4.5 -10,0Z" fill="${p.g('#f2cf3a', .3, .2)}" stroke="#c9a114" stroke-width=".6"/></g>
        <path d="M-8.4,-.2 Q0,-6.2 8.4,-.2 Q0,2.4 -8.4,-.2Z" fill="#fbeea0"/>
        ${[-5, -2, 1.6, 5].map(a => `<path d="M${a},${f(-3.6 + Math.abs(a) * .35)} L${f(a * .8)},.8" stroke="#fff8d0" stroke-width=".7"/>`).join('')}</g>`;
}
function xtrDice(p, x, y, s, r = 0, { c = '#e5382a', skin = null, inner = null } = {}){
    const h = s / 2;
    return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${f(s * .92)}" rx="${f(s * .22)}" fill="${p.g(c, .3, .25)}" stroke="${dk(skin || c, .3)}" stroke-width=".55"/>
        ${skin ? `<rect x="${-h}" y="${f(h * .5)}" width="${s}" height="${f(s * .22)}" rx="${f(s * .1)}" fill="${skin}"/>` : ''}
        ${inner ? `<ellipse cx="0" cy="${f(-h * .1)}" rx="${f(s * .22)}" ry="${f(s * .16)}" fill="${inner}" opacity=".9"/>` : ''}
        <path d="M${f(-s * .3)},${f(-s * .3)} L${f(s * .18)},${f(-s * .3)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".7"/></g>`;
}
// 小さな角切りをまとめて（1色1本の path）
function xtrCubes(p, pts, { c = '#ec7b2d', s = 8 } = {}){
    let a = '', h = '';
    for (const [x, y, r] of pts){
        const ca = Math.cos(r / 57.3), sa = Math.sin(r / 57.3), q = s / 2;
        const P = [[-q, -q], [q, -q], [q, q], [-q, q]].map(([u, v]) => `${f(x + u * ca - v * sa)},${f(y + u * sa + v * ca)}`);
        a += `M${P.join('L')}Z`; h += `M${f(x - q * .5)},${f(y - q * .45)}l${f(q * .7)},0`;
    }
    return `<path d="${a}" fill="${p.g(c, .3, .2)}" stroke="${dk(c, .3)}" stroke-width=".55" stroke-linejoin="round"/><path d="${h}" stroke="${lt(c, .5)}" stroke-width="1" stroke-linecap="round" opacity=".8"/>`;
}
function xtrBeefChunk(p, x, y, s, r = 0, { c = '#8e4a2c', seed = 1 } = {}){
    const R = rng(p.id + 'xtrbc' + seed + x + y);
    const pts = [[-1, -.9], [.2, -1.05], [1, -.85], [1.05, .3], [.85, 1], [-.2, 1.05], [-1, .85], [-1.1, -.1]].map(([a, b]) => [a * s / 2 * (1 + (R() - .5) * .25), b * s * .42 * (1 + (R() - .5) * .25)]);
    return `<g ${T(x, y, r)}><g ${p.rough(2, .25)}><path d="${smooth(pts, true, .45)}" fill="${p.g(c, .25, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .8 + 1, b * .7 + 1.5]), true, .45)}" fill="#b4441e" opacity=".3"/>
        <path d="M${f(-s * .3)},${f(-s * .02)} Q${f(-s * .05)},${f(-s * .18)} ${f(s * .26)},${f(-s * .05)} M${f(-s * .2)},${f(s * .2)} Q${f(s * .05)},${f(s * .08)} ${f(s * .26)},${f(s * .18)}" stroke="${dk(c, .45)}" stroke-width=".8" fill="none" opacity=".6"/>
        <path d="M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
function xtrChickenCube(p, x, y, s, r = 0, { seed = 1, c = '#e8c48c', sear = '#c07a32' } = {}){
    const R = rng(p.id + 'xtrck' + seed + x + y);
    const pts = [[-1, -1], [0, -1.1], [1, -.95], [1.05, 0], [.95, 1], [0, 1.05], [-1, .95], [-1.08, 0]].map(([a, b]) => [a * s / 2 * (1 + (R() - .5) * .2), b * s * .42 * (1 + (R() - .5) * .2)]);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${smooth(pts, true, .6)}" fill="${p.g(c, .3, .28)}" stroke="${dk(c, .35)}" stroke-width=".7"/></g>
        <g ${xtrBlur(p, 1.1)}><ellipse cx="${f((R() - .5) * s * .3)}" cy="${f((R() - .5) * s * .2)}" rx="${f(s * .26)}" ry="${f(s * .16)}" fill="${sear}" opacity=".75"/><ellipse cx="${f(s * .25)}" cy="${f(s * .2)}" rx="${f(s * .2)}" ry="${f(s * .12)}" fill="${dk(sear, .2)}" opacity=".7"/></g>
        <path d="M${f(-s * .34)},${f(-s * .24)} Q${f(-s * .1)},${f(-s * .36)} ${f(s * .16)},${f(-s * .3)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function xtrFlatBean(p, x, y, L, r = 0, { c = '#7a9a3a' } = {}){
    const w = 6.4;
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="${-w / 2}" width="${L}" height="${w}" rx="${w / 2}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .32)}" stroke-width=".6"/>
        <path d="M${f(-L / 2 + 2)},${f(-w * .2)} L${f(L / 2 - 2)},${f(-w * .2)}" stroke="${lt(c, .4)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/></g>`;
}
// イズミル・キョフテ（細長いキョフテ）
function xtrKofte(p, x, y, L, r = 0, { c = '#7a3a1e' } = {}){
    const W = L * .4;
    return `<g ${T(x, y, r)}><g ${p.sh(.8)}><g ${p.rough(1.6, .2)}><rect x="${-L / 2}" y="${-W / 2}" width="${L}" height="${W}" rx="${f(W / 2)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g></g>
        <g ${p.crumb(.8)}><rect x="${f(-L / 2 + 3)}" y="${f(-W / 2 + 2)}" width="${L - 6}" height="${f(W - 4)}" rx="${f(W / 2 - 2)}" fill="${lt(c, .12)}" opacity=".55"/></g>
        <path d="M${f(-L * .3)},${f(W * .15)} L${f(L * .3)},${f(W * .15)}" stroke="${dk(c, .5)}" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>
        <path d="M${f(-L * .34)},${f(-W * .22)} Q0,${f(-W * .4)} ${f(L * .3)},${f(-W * .22)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// じゃがいもの輪切り（皮つき、焼き色）
function xtrPotSlice(p, x, y, s, r = 0, { c = '#f0c86a', seed = 1, browned = .5 } = {}){
    const R = rng(p.id + 'xtrps' + seed + x);
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><ellipse rx="${s / 2}" ry="${f(s * .44)}" fill="${p.g(c, .3, .25)}" stroke="#a8702e" stroke-width="1.6"/></g>
        <ellipse cx="${f((R() - .5) * s * .2)}" cy="${f(s * .08)}" rx="${f(s * .24)}" ry="${f(s * .16)}" fill="#c8862e" opacity="${f(browned * .45)}"/>
        <ellipse cx="${f(-s * .14)}" cy="${f(-s * .14)}" rx="${f(s * .18)}" ry="${f(s * .1)}" fill="#fff" opacity=".5"/></g>`;
}
// 焼いたじゃがいものくし切り
function xtrWedge(p, x, y, L, r = 0, { c = '#eab45a' } = {}){
    const W = L * .36;
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="M${-L / 2},0 Q0,${f(-W * 1.1)} ${L / 2},0 Q0,${f(W * .9)} ${-L / 2},0Z" fill="${p.g(c, .3, .3)}" stroke="#9a5a22" stroke-width=".7"/></g>
        <path d="M${-L / 2},0 Q0,${f(W * .9)} ${L / 2},0" stroke="#a8622a" stroke-width="2.2" fill="none" opacity=".8"/>
        <ellipse cx="${f(L * .1)}" cy="${f(-W * .1)}" rx="${f(L * .18)}" ry="${f(W * .2)}" fill="#c87a2a" opacity=".35"/>
        <path d="M${f(-L * .3)},${f(-W * .3)} Q0,${f(-W * .6)} ${f(L * .25)},${f(-W * .35)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 肉詰めピーマン（上から: ふたのトマト、または見えている米とひき肉）
function xtrStuffedPepper(p, x, y, s, r = 0, { seed = 1, cap = 'tomato', c = '#86b23e' } = {}){
    const R = rng(p.id + 'xtrsp' + seed);
    const pts = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.283; const k = 1 - .09 * Math.cos(4 * a + .4) + (R() - .5) * .04; return [Math.cos(a) * s / 2 * k, Math.sin(a) * s / 2 * k]; });
    const inner = s * .3;
    const fill = cap === 'tomato' ? xtrTomatoSlice(p, 1, 1, s * .58, R() * 90)
        : `<circle r="${f(inner)}" fill="#ece0c4"/>` + xtrGrains(p, 0, 0, inner * 1.8, { cols: ['#fbf6e8', '#efe4c8', '#9a5a30', '#c0502e'], n: 30, size: 1.6, long: 1.5, seed });
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${smooth(pts)}" fill="${p.g(c, .35, .3)}" stroke="${dk(c, .4)}" stroke-width=".8"/></g>
        ${[0, 1, 2, 3].map(i => { const a = i * 1.571 + .4; return `<path d="M${f(Math.cos(a) * s * .2)},${f(Math.sin(a) * s * .2)} L${f(Math.cos(a) * s * .44)},${f(Math.sin(a) * s * .44)}" stroke="${dk(c, .25)}" stroke-width="1.2" opacity=".5"/>`; }).join('')}
        <circle r="${f(inner + 2)}" fill="${dk(c, .3)}" opacity=".7"/>${fill}
        <path d="M${f(-s * .42)},${f(-s * .05)} A${f(s * .44)},${f(s * .44)} 0 0 1 ${f(-s * .1)},${f(-s * .42)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// なすの輪切り（揚げた）
function xtrAubRound(p, x, y, w, h, r = 0, { flesh = '#c99248' } = {}){
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><ellipse rx="${w / 2}" ry="${h / 2}" fill="${p.g('#3c1d42', .3, .25)}" stroke="#22102a" stroke-width=".7"/></g>
        <ellipse rx="${f(w / 2 - 2.6)}" ry="${f(h / 2 - 2.6)}" fill="${p.g(flesh, .25, .3)}"/>
        <ellipse rx="${f(w * .26)}" ry="${f(h * .26)}" fill="none" stroke="${dk(flesh, .3)}" stroke-width="1.2" stroke-dasharray="1.2 2.2" opacity=".7"/></g>`;
}
// なすの角切り（揚げた）
function xtrAubCube(p, x, y, s, r = 0){
    const h = s / 2;
    return `<g ${T(x, y, r)}><rect x="${-h}" y="${-h}" width="${s}" height="${f(s * .9)}" rx="${f(s * .25)}" fill="${p.g('#b07838', .3, .3)}" stroke="#6a3e18" stroke-width=".6"/>
        <path d="M${-h},${f(h * .55)} Q0,${f(h * .9)} ${h},${f(h * .55)}" stroke="#3c1d42" stroke-width="${f(s * .22)}" fill="none" stroke-linecap="round"/>
        <path d="M${f(-h * .6)},${f(-h * .5)} L${f(h * .3)},${f(-h * .55)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6"/></g>`;
}
// 揚げたレバー（粉をまぶした薄い切り身）
function xtrLiver(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtrlv' + seed + x + y);
    const pts = ring(s / 2, 8, .45, R, 1.35, .62);
    return `<g ${T(x, y, r)}><g ${p.sh(.7)}><path d="${xtrSm(pts)}" fill="${p.g('#7a321c', .3, .35)}" stroke="#3e140a" stroke-width=".7"/></g>
        <g ${p.crumb(1)}><path d="${xtrSm(pts.map(([a, b]) => [a * .8 - .5, b * .72 - .5]))}" fill="#a8582c" opacity=".8"/></g>
        <path d="M${f(-s * .35)},${f(-s * .1)} Q${f(-s * .1)},${f(-s * .26)} ${f(s * .2)},${f(-s * .18)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// ひよこ豆の位置と大きさ
const xtrPeas = (seed, n, rmax, s, cx = 100, cy = 100, sy = 1) => xtrSpots(seed, n, rmax, s * 1.75, cx, cy, sy).map(([x, y]) => [x, y, s]);
// 金串に刺した鶏肉（タヴク・シシ）
function xtrSkewer(p, x, y, L, r = 0, { n = 6, seed = 1 } = {}){
    const step = (L - 26) / n;
    let chunks = '';
    for (let i = 0; i < n; i++) chunks += xtrShisChunk(p, -L / 2 + 22 + step * (i + .5), (i % 2 ? 1.5 : -1.5), step * 1.22, (i * 47) % 90, { seed: seed * 10 + i, c: i % 3 === 1 ? '#c8662a' : '#d4742c' });
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><rect x="${-L / 2}" y="-1.6" width="${L}" height="3.2" rx="1.2" fill="#c9cbcc" stroke="#7e8285" stroke-width=".5"/>
        <rect x="${-L / 2 - 4}" y="-4" width="12" height="8" rx="2" fill="${p.g('#b9bcbe', .4, .3)}" stroke="#7e8285" stroke-width=".6"/></g>
        <g ${p.sh(.8)}>${chunks}</g></g>`;
}
// 鶏の骨つきもも（焼いた）
function xtrLeg(p, x, y, L, r = 0, { c = '#b8521c', seed = 1 } = {}){
    const R = rng(p.id + 'xtrlg' + seed + x);
    const body = `M${f(-L * .5)},0 C${f(-L * .5)},${f(-L * .3)} ${f(-L * .05)},${f(-L * .32)} ${f(L * .12)},${f(-L * .16)} C${f(L * .22)},${f(-L * .08)} ${f(L * .3)},${f(-L * .06)} ${f(L * .36)},${f(-L * .05)} L${f(L * .36)},${f(L * .05)} C${f(L * .3)},${f(L * .06)} ${f(L * .22)},${f(L * .08)} ${f(L * .12)},${f(L * .16)} C${f(-L * .05)},${f(L * .32)} ${f(-L * .5)},${f(L * .3)} ${f(-L * .5)},0Z`;
    let ch = '';
    for (let i = 0; i < 4; i++) ch += `<ellipse cx="${f(-L * .35 + R() * L * .4)}" cy="${f((R() - .5) * L * .3)}" rx="${f(2 + R() * 3)}" ry="${f(1.4 + R() * 1.6)}" fill="#5a1e08" opacity="${f(.25 + R() * .25)}"/>`;
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${body}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .45)}" stroke-width=".8"/>
        <circle cx="${f(L * .42)}" cy="${f(-L * .04)}" r="${f(L * .07)}" fill="#efe2c8" stroke="#b8a888" stroke-width=".6"/><circle cx="${f(L * .42)}" cy="${f(L * .05)}" r="${f(L * .065)}" fill="#e6d6b8" stroke="#b8a888" stroke-width=".6"/></g>
        <g ${p.crumb(.6)}><path d="${body}" fill="${c}" opacity=".3"/></g>${ch}
        <path d="M${f(-L * .38)},${f(-L * .14)} Q${f(-L * .15)},${f(-L * .27)} ${f(L * .06)},${f(-L * .14)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// 鶏ももの塊（骨なし、焼いた）
function xtrThigh(p, x, y, s, r = 0, { c = '#b8521c', seed = 1 } = {}){
    const R = rng(p.id + 'xtrth' + seed + x);
    const pts = ring(s / 2, 10, .22, R, 1.15, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${smooth(pts)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .45)}" stroke-width=".8"/></g>
        <g ${p.crumb(.6)}><path d="${smooth(pts.map(([a, b]) => [a * .85, b * .85]))}" fill="${c}" opacity=".35"/></g>
        <path d="M${f(-s * .2)},${f(s * .05)} Q0,${f(-s * .05)} ${f(s * .22)},${f(s * .1)}" stroke="${dk(c, .45)}" stroke-width="1.2" fill="none" opacity=".45"/>
        <path d="M${f(-s * .32)},${f(-s * .16)} Q${f(-s * .1)},${f(-s * .34)} ${f(s * .18)},${f(-s * .26)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// ほぐした鶏肉
function xtrShredChicken(p, x, y, s, { n = 26, seed = 1, c = '#f0dcb8', sy = 1, w = 4.6, len = 1 } = {}){
    const R = rng(p.id + 'xtrsc2' + seed + x + y);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd * sy, ang = R() * 3.14, L = (5 + R() * 7) * len, b = (R() - .5) * 4 * len; d += `M${f(cx - Math.cos(ang) * L)},${f(cy - Math.sin(ang) * L)}q${f(Math.cos(ang) * L + b)},${f(Math.sin(ang) * L - b)} ${f(Math.cos(ang) * L * 2)},${f(Math.sin(ang) * L * 2)}`; }
    return `<g ${p.sh(.6)}><path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(w + 1.4)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/></g><path d="${d}" stroke="${dk(c, .18)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6" transform="translate(.8 .9)"/><path d="${d}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6" transform="translate(-.9 -1)"/>`;
}
// 魚の輪切り（白身・皮つき）
function xtrFishSteak(p, x, y, s, r = 0, { seed = 1, flesh = '#f6efe2', skin = '#5e6a76' } = {}){
    const R = rng(p.id + 'xtrfs' + seed + x);
    const pts = ring(s / 2, 10, .14, R, 1.2, .85);
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${smooth(pts)}" fill="${p.g(skin, .3, .3)}" stroke="${dk(skin, .4)}" stroke-width=".7"/></g>
        <path d="${smooth(pts.map(([a, b]) => [a * .93, b * .91]))}" fill="${p.rg(flesh, .2, .15, .4, .38)}"/>
        <path d="M0,${f(-s * .34)} L0,${f(s * .32)} M${f(-s * .4)},0 Q${f(-s * .2)},${f(-s * .1)} 0,0 Q${f(s * .2)},${f(s * .1)} ${f(s * .44)},0 M${f(-s * .3)},${f(-s * .2)} Q${f(-s * .15)},0 ${f(-s * .3)},${f(s * .2)} M${f(s * .3)},${f(-s * .2)} Q${f(s * .15)},0 ${f(s * .3)},${f(s * .2)}" stroke="${dk(flesh, .18)}" stroke-width=".8" fill="none" opacity=".8"/>
        <circle r="${f(s * .05)}" fill="#e8dcc8" stroke="${dk(flesh, .3)}" stroke-width=".6"/>
        <path d="M${f(-s * .36)},${f(-s * .16)} Q${f(-s * .16)},${f(-s * .34)} ${f(s * .12)},${f(-s * .3)}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
// 白身魚の切り身（身を上に、片側に皮）
function xtrWhiteFillet(p, x, y, w, h, r = 0, { seed = 1, c = '#f6eee0', skin = '#76828e' } = {}){
    const R = rng(p.id + 'xtrwf' + seed + x);
    const pts = [[-w / 2, -h * .2], [-w * .3, -h / 2], [w * .2, -h / 2], [w / 2, -h * .25], [w / 2, h * .2], [w * .25, h / 2], [-w * .3, h / 2], [-w / 2, h * .25]].map(([a, b]) => [a + (R() - .5) * 3, b + (R() - .5) * 3]);
    let fl = '';
    for (let i = 1; i < 5; i++){ const xx = -w / 2 + i * w / 5; fl += `M${f1(xx - 2)},${f1(-h * .38)}Q${f1(xx + 3)},0 ${f1(xx - 1)},${f1(h * .4)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xtrSm(pts)}" fill="${p.rg(c, .25, .18, .4, .38)}" stroke="#c9b89a" stroke-width=".7"/></g>
        <path d="${xtrSm(pts.slice(0, 4), false)}" stroke="${skin}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="${fl}" stroke="#e0d2b8" stroke-width="1" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-w * .3)},${f1(-h * .1)} Q${f1(-w * .05)},${f1(-h * .28)} ${f1(w * .25)},${f1(-h * .14)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// ポーチドエッグ
function xtrPoached(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtrpe' + seed);
    const pts = ring(s / 2, 11, .3, R, 1.1, .9);
    return `<g ${T(x, y, r)}><g ${p.sh(1.3)}><path d="${smooth(pts)}" fill="${p.rg('#ffffff', .1, .2, .4, .4)}" stroke="#cfc6b0" stroke-width=".8"/></g>
        <circle cx="2" cy="1" r="${f(s * .27)}" fill="${p.rg('#f4a81e', .3, .1, .35, .32)}"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .5 + 2, b * .45 + 1]))}" fill="#fffdf6" opacity=".3"/>
        <ellipse cx="${f(-s * .02)}" cy="${f(-s * .08)}" rx="${f(s * .1)}" ry="${f(s * .05)}" fill="#fff" opacity=".85"/>
        <path d="M${f(-s * .38)},${f(-s * .1)} Q${f(-s * .26)},${f(-s * .34)} ${f(-s * .02)},${f(-s * .38)}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/></g>`;
}
// スジュク（輪切り）
function xtrSucuk(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtrsu' + seed + x + y);
    let sp = '';
    for (let i = 0; i < 6; i++){ const a = R() * 6.28, d = Math.sqrt(R()) * s * .32; sp += arc(x + Math.cos(a) * d, y + Math.sin(a) * d * .9, .7 + R() * .8); }
    return `<g ${p.sh(.6)}><ellipse cx="${f(x)}" cy="${f(y)}" rx="${s / 2}" ry="${f(s * .46)}" fill="${p.g('#7a1e14', .25, .3)}" stroke="#3e0c06" stroke-width=".7" transform="rotate(${r} ${f(x)} ${f(y)})"/></g>
        <ellipse cx="${f(x - .5)}" cy="${f(y - .5)}" rx="${f(s * .4)}" ry="${f(s * .36)}" fill="#a8341e" transform="rotate(${r} ${f(x)} ${f(y)})"/>
        <path d="${sp}" fill="#ecc0a8"/>
        <path d="M${f(x - s * .3)},${f(y - s * .12)} Q${f(x - s * .1)},${f(y - s * .32)} ${f(x + s * .16)},${f(y - s * .26)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>`;
}
// ズッキーニの輪切り（煮た）
function xtrZuc(p, x, y, s, r = 0, { half = false } = {}){
    const h = s / 2;
    const shape = half ? `M${-h},0 A${h},${h} 0 0 1 ${h},0Z` : null;
    return half
        ? `<g ${T(x, y, r)}><path d="${shape}" fill="#3f6a2a" stroke="#24401a" stroke-width=".6"/><path d="M${f(-h + 1.8)},0 A${f(h - 1.8)},${f(h - 1.8)} 0 0 1 ${f(h - 1.8)},0Z" fill="${p.g('#d6dca0', .25, .2)}"/><path d="M${f(-h * .45)},0 A${f(h * .45)},${f(h * .45)} 0 0 1 ${f(h * .45)},0" fill="none" stroke="#b8c47a" stroke-width="1.2" stroke-dasharray="1 1.6"/></g>`
        : `<g ${T(x, y, r)}><circle r="${h}" fill="#3f6a2a" stroke="#24401a" stroke-width=".6"/><circle r="${f(h - 1.8)}" fill="${p.g('#d6dca0', .25, .2)}"/><circle r="${f(h * .45)}" fill="none" stroke="#b8c47a" stroke-width="1.2" stroke-dasharray="1 1.6"/></g>`;
}
// 白い面に焼き色のついたベシャメル・チーズ
function xtrGratin(p, x, y, w, h, { rx = 10, seed = 1, c = '#e6b860' } = {}){
    const R = rng(p.id + 'xtrgt' + seed);
    let spots = '', dark = '';
    for (let i = 0; i < 26; i++){ const cx = x + (R() - .5) * w * .9, cy = y + (R() - .5) * h * .88, rr = 3 + R() * 7; spots += `<path ${T(cx, cy)} d="${smooth(ring(rr, 7, .5, R))}"/>`; }
    for (let i = 0; i < 14; i++){ const cx = x + (R() - .5) * w * .85, cy = y + (R() - .5) * h * .8, rr = 2 + R() * 4; dark += `<path ${T(cx, cy)} d="${smooth(ring(rr, 6, .5, R))}"/>`; }
    return `<rect x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${w}" height="${h}" rx="${rx}" fill="${p.rg(c, .2, .2, .4, .4)}"/>
        <g ${xtrBlur(p, 1.4)}><g fill="#c87a26" opacity=".8">${spots}</g><g fill="#8a4414" opacity=".7">${dark}</g></g>`;
}
// ペンネ（チーズの間からのぞく）
function xtrPenne(p, x, y, L, r = 0, { c = '#f0cf7a' } = {}){
    const W = L * .36;
    return `<g ${T(x, y, r)}><path d="M${f(-L / 2 + 3)},${f(-W / 2)} L${L / 2},${f(-W / 2)} L${f(L / 2 - 3)},${f(W / 2)} L${-L / 2},${f(W / 2)}Z" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .35)}" stroke-width=".6"/>
        <path d="M${f(-L * .25)},${f(-W / 2 + .8)} l-1.4,${f(W - 1.6)} M0,${f(-W / 2 + .8)} l-1.4,${f(W - 1.6)} M${f(L * .25)},${f(-W / 2 + .8)} l-1.4,${f(W - 1.6)}" stroke="${dk(c, .2)}" stroke-width=".7" opacity=".6"/>
        <ellipse cx="${f(L / 2 - 1.5)}" cy="0" rx="1.6" ry="${f(W * .34)}" fill="${dk(c, .35)}" transform="rotate(14 ${f(L / 2 - 1.5)} 0)"/></g>`;
}
// 青菜を煮くずしたもの（ほうれん草）
function xtrWilted(p, x, y, s, { n = 30, seed = 1, cols = ['#2f5a1e', '#3e6e26', '#4f7f2e'], sy = 1 } = {}){
    const R = rng(p.id + 'xtrwl' + seed + x);
    const ds = cols.map(() => '');
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * sy, rr = 5 + R() * 6;
        ds[Math.floor(R() * cols.length)] += `M${f(cx - rr)},${f(cy)} Q${f(cx - rr * .3)},${f(cy - rr * .9)} ${f(cx + rr)},${f(cy - rr * .2)} Q${f(cx + rr * .2)},${f(cy + rr * .6)} ${f(cx - rr)},${f(cy)}Z`;
    }
    return cols.map((c, i) => `<path d="${ds[i]}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".5" stroke-linejoin="round"/>`).join('');
}
// なめらかな形（小数1桁で小さく）
function xtrSm(pts, closed = true){
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++){
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
}
// ご飯の山（粒を1本ずつ。w_tr の trRice を写したもの）
function xtrRice(p, x, y, s, { sy = 1, tint = '#f4f0e4', density = 1, seed = 1, grain = 3.4, layers = 2, hiK = .85 } = {}){
    const R = rng(p.id + 'xtrRice' + seed + x + y);
    const shape = xtrSm(ring(s / 2, 14, .07, R, 1, sy), true);
    const hi = lt(tint, hiK), mid = dk(tint, .02), sd = dk(tint, .3);
    const n = Math.round(s * s / 40 * density);
    const L = Array.from({ length: layers }, () => ['', '', '']);
    for (let i = 0; i < n; i++){
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * s / 2 * .96;
        const gx = Math.cos(a) * d, gy = Math.sin(a) * d * sy;
        const h = grain * (.5 + R() * .16), b = R() * Math.PI, dx = Math.cos(b) * h, dy = Math.sin(b) * h;
        const seg = `M${Math.round(gx - dx)} ${Math.round(gy - dy)}l${f1(dx * 2)} ${f1(dy * 2)}`;
        const lit = (gx + gy) / (s / 2) + (R() - .5) * 1.4 < .2;
        const l = L[i % layers];
        if (lit){ l[0] += seg; if (R() < .4) l[2] += `M${f1(gx - dx * .6 - .55)} ${f1(gy - dy * .6 - .55)}l${f1(dx * .9)} ${f1(dy * .9)}`; } else l[1] += seg;
    }
    const shade = p.def('xtrRiceShade', id => `<radialGradient id="${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>`);
    let defs = '', body = '';
    L.forEach(([a, b, c]) => {
        const ia = p.uid(), ib = p.uid();
        defs += `<path id="${ia}" d="${a}"/><path id="${ib}" d="${b}"/>`;
        body += `<g stroke-linecap="round" stroke-width="${grain}"><g stroke="${sd}" opacity=".55" transform="translate(.55 .75)"><use href="#${ia}"/><use href="#${ib}"/></g><use href="#${ib}" stroke="${mid}"/><use href="#${ia}" stroke="${hi}"/></g><path d="${c}" stroke="#fff" stroke-width="${f1(grain * .32)}" stroke-linecap="round" opacity=".9"/>`;
    });
    return `<g ${T(x, y)}><defs>${defs}</defs><g ${p.sh(.8)}><path d="${shape}" fill="${p.rg(dk(tint, .07), .15, .18, .38, .34)}"/></g>${body}<path d="${shape}" fill="url(#${shade})"/></g>`;
}
// シシの鶏肉（漬けだれで赤橙、ところどころ焦げ）
function xtrShisChunk(p, x, y, s, r = 0, { seed = 1, c = '#d4742c' } = {}){
    const R = rng(p.id + 'xtrsh' + seed + x);
    const pts = ring(s / 2, 7, .3, R, 1.08, .9);
    let ch = '';
    for (let i = 0; i < 3; i++) ch += `<ellipse cx="${f1((R() - .5) * s * .6)}" cy="${f1((R() - .5) * s * .6)}" rx="${f1(s * (.1 + R() * .12))}" ry="${f1(s * (.06 + R() * .06))}" transform="rotate(${Math.round(R() * 180)})"/>`;
    return `<g ${T(x, y, r)}><path d="${smooth(pts, true, .5)}" fill="${p.g(c, .3, .35)}" stroke="${dk(c, .45)}" stroke-width=".7"/>
        <path d="${smooth(pts.map(([a, b]) => [a * .6 - 1, b * .55 - 1]), true, .5)}" fill="${lt(c, .3)}" opacity=".55"/>
        <g fill="#4a1a06" opacity=".55" ${xtrBlur(p, .8)}>${ch}</g>
        <path d="M${f1(-s * .3)},${f1(-s * .2)} Q${f1(-s * .1)},${f1(-s * .36)} ${f1(s * .14)},${f1(-s * .3)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// イマム・バユルドゥ: 縞にむいたなすを舟形に開き、玉ねぎとトマトの詰めもの、上にトマトとシヴリ
function xtrImam(p, x, y, L, W, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtrim' + seed);
    const pts = Array.from({ length: 20 }, (_, i) => { const a = i / 20 * 6.28, cx = Math.cos(a), cy = Math.sin(a); return [cx * L / 2, cy * W / 2 * (cx > 0 ? 1 - cx * .25 : 1)]; });
    const shape = smooth(pts);
    const cl = p.def('xtrimc' + seed, id => `<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
    let stripes = '';
    for (let i = 0; i < 7; i++){ const sx = -L * .42 + i * L * .13; stripes += `M${f1(sx)},${f1(-W)}Q${f1(sx + 4)},0 ${f1(sx)},${f1(W)}`; }
    const fillPts = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.28; return [Math.cos(a) * L * .38 - L * .03, Math.sin(a) * W * .3]; });
    let on = '';
    for (let i = 0; i < 14; i++){ const cx = -L * .03 + (R() - .5) * L * .62, cy = (R() - .5) * W * .4, a = (R() - .5) * 1.2, l = 5 + R() * 5; on += `M${f1(cx - Math.cos(a) * l)},${f1(cy - Math.sin(a) * l)}q${f1(Math.cos(a) * l)},${f1(-3)} ${f1(Math.cos(a) * l * 2)},${f1(Math.sin(a) * l * 2)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(1.1)}><path d="${shape}" fill="${p.g('#3c1d42', .3, .25)}" stroke="#22102a" stroke-width=".9"/></g>
        <g clip-path="url(#${cl})"><path d="${stripes}" stroke="#c9a86a" stroke-width="${f1(L * .045)}" fill="none" opacity=".8"/></g>
        <path d="M${f1(L / 2 - 2)},0 q8,-2 12,-8 q2,6 -3,10 q4,3 -2,6 q-4,-4 -7,-8Z" fill="${p.g('#6a8a3a', .3, .3)}" stroke="#3e5a1e" stroke-width=".6"/>
        <g ${p.sh(.5)}><path d="${xtrSm(fillPts)}" fill="${p.g('#d8a050', .3, .3)}" stroke="#9a6224" stroke-width=".6"/></g>
        <path d="${on}" stroke="#f6dc9a" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/><path d="${on}" stroke="#b8803a" stroke-width=".6" fill="none" transform="translate(.6 1)" opacity=".6"/>
        ${xtrCubes(p, Array.from({ length: 6 }, () => [-L * .03 + (R() - .5) * L * .55, (R() - .5) * W * .36, R() * 90]), { c: '#d8402a', s: 5 })}
        ${xtrTomatoSlice(p, -L * .1, 0, W * .48, R() * 90)}
        ${xtrSivri(p, L * .14, -1, L * .38, 4, { c: '#4f9a2c', bend: 2, cooked: true })}
        ${xtrParsley(p, -L * .02, 0, L * .5, { n: 6, seed })}
        <path d="M${f1(-L * .4)},${f1(-W * .32)} Q${f1(-L * .1)},${f1(-W * .5)} ${f1(L * .25)},${f1(-W * .4)}" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
}
// ヤプラク・サルマ（ぶどうの葉で米を巻いたもの）
function xtrSarma(p, x, y, L, r = 0, { c = '#6b7a32' } = {}){
    const W = L * .4;
    return `<g ${T(x, y, r)}><rect x="${-L / 2}" y="${f1(-W / 2)}" width="${L}" height="${f1(W)}" rx="${f1(W * .46)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .42)}" stroke-width=".6"/>
        <path d="M${f1(-L * .28)},${f1(-W / 2 + .6)} q3,${f1(W * .5)} 1,${f1(W - 1.2)} M${f1(-L * .02)},${f1(-W / 2 + .6)} q3,${f1(W * .5)} 1,${f1(W - 1.2)} M${f1(L * .24)},${f1(-W / 2 + .6)} q3,${f1(W * .5)} 1,${f1(W - 1.2)}" stroke="${dk(c, .3)}" stroke-width=".8" fill="none" opacity=".7"/>
        <path d="M${f1(-L * .36)},${f1(-W * .2)} L${f1(L * .32)},${f1(-W * .22)}" stroke="#e8eec0" stroke-width="1.2" stroke-linecap="round" opacity=".55"/></g>`;
}
// 長ねぎの斜め切り（オリーブ油で煮た）
function xtrLeek(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><ellipse rx="${f1(s / 2)}" ry="${f1(s * .3)}" fill="${p.g('#e6e2aa', .3, .2)}" stroke="#a8b464" stroke-width="1.2"/>
        <ellipse rx="${f1(s * .36)}" ry="${f1(s * .2)}" fill="#f0ecc4" stroke="#d0cc88" stroke-width=".9"/>
        <ellipse rx="${f1(s * .17)}" ry="${f1(s * .1)}" fill="#f6f4dc" stroke="#cdd890" stroke-width=".8"/>
        <path d="M${f1(-s * .32)},${f1(-s * .2)} Q${f1(-s * .1)},${f1(-s * .32)} ${f1(s * .16)},${f1(-s * .28)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// アーティチョークの芯（器の形）
function xtrArti(p, x, y, s, r = 0){
    const pts = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 6.283, k = i % 2 ? .9 : 1; return [Math.cos(a) * s / 2 * k, Math.sin(a) * s / 2 * k]; });
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><path d="${xtrSm(pts)}" fill="${p.g('#b8b860', .3, .3)}" stroke="#7a7a2a" stroke-width=".8"/></g>
        <circle r="${f1(s * .36)}" fill="${p.rg('#e6dc9a', .2, .2, .55, .55)}" stroke="#c8bc6a" stroke-width="1"/>
        <path d="M${f1(-s * .4)},${f1(-s * .1)} A${f1(s * .42)},${f1(s * .42)} 0 0 1 ${f1(-s * .05)},${f1(-s * .42)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
}
// くるみ
function xtrWalnut(p, x, y, s, r = 0, { seed = 1 } = {}){
    const R = rng(p.id + 'xtrwn' + seed + x + y);
    return `<g ${T(x, y, r)}><path d="${xtrSm(ring(s / 2, 8, .45, R, 1.1, .9))}" fill="${p.g('#b07a3c', .3, .3)}" stroke="#6a4218" stroke-width=".6"/>
        <path d="M${f1(-s * .3)},0 Q0,${f1(-s * .2)} ${f1(s * .3)},0 M0,${f1(-s * .3)} Q${f1(s * .1)},0 0,${f1(s * .3)}" stroke="#7a4a1e" stroke-width=".9" fill="none" opacity=".7"/>
        <circle cx="${f1(-s * .15)}" cy="${f1(-s * .15)}" r="${f1(s * .1)}" fill="#e0b880" opacity=".7"/></g>`;
}
// ロメインレタスの葉
function xtrLettuce(p, x, y, L, W, r = 0, { c = '#7cb84a', seed = 1 } = {}){
    const R = rng(p.id + 'xtrlt' + seed + x);
    const pts = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 6.283, k = 1 + (i % 2 ? -.08 : .06) + (R() - .5) * .06; return [Math.cos(a) * L / 2 * k, Math.sin(a) * W / 2 * k * (Math.cos(a) > 0 ? 1 - Math.cos(a) * .35 : 1)]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="${xtrSm(pts)}" fill="${p.g(c, .3, .25)}" stroke="${dk(c, .3)}" stroke-width=".7"/></g>
        <path d="M${f1(-L / 2)},0 Q0,-1.5 ${f1(L * .45)},0" stroke="#e2f0bc" stroke-width="${f1(W * .14)}" fill="none" stroke-linecap="round"/>
        <path d="M${f1(-L * .25)},0 l-5,${f1(-W * .3)} M0,0 l-5,${f1(-W * .32)} M${f1(L * .2)},0 l-5,${f1(-W * .26)} M${f1(-L * .25)},0 l-5,${f1(W * .3)} M0,0 l-5,${f1(W * .32)} M${f1(L * .2)},0 l-5,${f1(W * .26)}" stroke="#c8e29a" stroke-width=".8" fill="none" opacity=".8"/></g>`;
}
// メルジメッキ・キョフテ（手で握った指の跡のある細長いもの）
function xtrMkofte(p, x, y, L, r = 0, { seed = 1, c = '#d8844a' } = {}){
    const R = rng(p.id + 'xtrmk' + seed + x);
    const W = L * .54;
    const pts = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.283; return [Math.cos(a) * L / 2 * (1 + (R() - .5) * .06), Math.sin(a) * W / 2 * (1 + (R() - .5) * .1) * (Math.cos(a) > .4 ? .82 : 1)]; });
    let gr = '';
    for (let i = 0; i < 3; i++){ const xx = -L * .22 + i * L * .22; gr += `M${f1(xx - 2)},${f1(-W * .42)}Q${f1(xx + 2)},0 ${f1(xx - 1)},${f1(W * .42)}`; }
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><g ${p.crumb(1.2)}><path d="${xtrSm(pts)}" fill="${p.g(c, .3, .3)}" stroke="${dk(c, .4)}" stroke-width=".7"/></g></g>
        <path d="${gr}" stroke="${dk(c, .2)}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".4"/>
        ${K.sprinkle(p, 0, 0, L * .7, { c: '#3f7a22', n: 9, r: .9 })}
        <path d="M${f1(-L * .34)},${f1(-W * .26)} Q${f1(-L * .1)},${f1(-W * .44)} ${f1(L * .2)},${f1(-W * .32)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
}
// 衣をつけて揚げたカリフラワー
function xtrCauli(p, x, y, s, r = 0, { seed = 1, c = '#d9a142' } = {}){
    const R = rng(p.id + 'xtrcf' + seed + x + y);
    let lumps = '';
    let pale = '';
    for (let i = 0; i < 9; i++){ const a = i / 9 * 6.283 + R() * .4, d = i === 0 ? 0 : s * (.18 + R() * .12), rr = s * (.12 + R() * .07); (R() < .3 ? (pale += arc(Math.cos(a) * d, Math.sin(a) * d * .9 - s * .06, rr * .9)) : (lumps += arc(Math.cos(a) * d, Math.sin(a) * d * .9 - s * .06, rr))); }
    return `<g ${T(x, y, r)}><g ${p.sh(1)}><g ${p.crumb(.8)}><path d="${xtrSm(ring(s * .44, 10, .3, R, 1.1, .82).map(([a, b]) => [a, b - s * .06]))}" fill="${p.g(dk(c, .1), .2, .35)}" stroke="${dk(c, .45)}" stroke-width=".7"/><path d="${lumps}" fill="${p.g(lt(c, .08), .35, .3)}" stroke="${dk(c, .25)}" stroke-width=".5"/><path d="${pale}" fill="${p.g('#efdca0', .35, .25)}" stroke="#c8a85a" stroke-width=".5"/></g></g>
        <path d="M${f1(-s * .28)},${f1(-s * .18)} Q${f1(-s * .1)},${f1(-s * .34)} ${f1(s * .1)},${f1(-s * .3)}" stroke="#fff4d6" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
}
// スベリヒユ（肉厚の丸い小さな葉と赤い茎）
function xtrPurslane(p, x, y, s, { n = 60, seed = 1 } = {}){
    const R = rng(p.id + 'xtrpu' + seed + x);
    let st = '', lv = ['', ''];
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, d = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, b = R() * 6.28, rl = 3.4 + R() * 1.8;
        if (i % 4 === 0) st += `M${f1(cx)},${f1(cy)}l${f1(Math.cos(b) * 9)},${f1(Math.sin(b) * 9)}`;
        const pts = [0, 1, 2, 3, 4, 5].map(j => { const aa = j / 6 * 6.28; const ux = Math.cos(aa) * rl * 1.5, uy = Math.sin(aa) * rl; return `${f1(cx + ux * Math.cos(b) - uy * Math.sin(b))},${f1(cy + ux * Math.sin(b) + uy * Math.cos(b))}`; });
        lv[R() < .5 ? 0 : 1] += `M${pts.join('L')}Z`;
    }
    return `<path d="${st}" stroke="#b05a4a" stroke-width="1.6" stroke-linecap="round"/><g ${p.sh(.5)}><path d="${lv[0]}" fill="#4f8f2e" stroke="#2f6018" stroke-width=".5" stroke-linejoin="round"/><path d="${lv[1]}" fill="#6aa83e" stroke="#3a7020" stroke-width=".5" stroke-linejoin="round"/></g>`;
}
// 焼いて皮をむいた赤ピーマン（平たく、つや）
function xtrRoastPep(p, x, y, L, W, r = 0, { seed = 1, c = '#c42c1c' } = {}){
    const R = rng(p.id + 'xtrrp' + seed);
    const pts = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.283; return [Math.cos(a) * L / 2 * (1 + (R() - .5) * .1), Math.sin(a) * W / 2 * (1 + (R() - .5) * .4) * (Math.cos(a) > 0 ? 1 - Math.cos(a) * .2 : 1)]; });
    return `<g ${T(x, y, r)}><g ${p.sh(.9)}><path d="${xtrSm(pts)}" fill="${p.g(c, .3, .32)}" stroke="${dk(c, .45)}" stroke-width=".7"/></g>
        <path d="M${f1(-L * .4)},${f1(W * .05)} Q${f1(-L * .1)},${f1(-W * .2)} ${f1(L * .1)},${f1(W * .1)} T${f1(L * .4)},${f1(W * .05)} M${f1(-L * .3)},${f1(W * .28)} Q0,${f1(W * .1)} ${f1(L * .3)},${f1(W * .25)}" stroke="${dk(c, .3)}" stroke-width="1.6" fill="none" opacity=".4"/>
        <path d="M${f1(-L * .2)},${f1(-W * .05)} Q${f1(L * .05)},${f1(-W * .3)} ${f1(L * .3)},${f1(-W * .1)}" stroke="${lt(c, .3)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>
        <ellipse cx="${f1((R() - .5) * L * .4)}" cy="${f1(W * .15)}" rx="${f1(L * .08)}" ry="${f1(W * .1)}" fill="#3a0e06" opacity=".3"/>
        <path d="M${f1(-L * .36)},${f1(-W * .18)} Q${f1(-L * .1)},${f1(-W * .36)} ${f1(L * .25)},${f1(-W * .22)}" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M${f1(-L / 2 + 1)},0 q-5,-1 -7,-4" stroke="#4a6a20" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
}
// マッシュルームの縦の薄切り
function xtrMushSlice(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.6)}><path d="M${f1(-s / 2)},${f1(s * .05)} Q${f1(-s / 2)},${f1(-s * .45)} 0,${f1(-s * .46)} Q${f1(s / 2)},${f1(-s * .45)} ${f1(s / 2)},${f1(s * .05)} Q${f1(s * .3)},${f1(s * .1)} ${f1(s * .16)},${f1(s * .08)} L${f1(s * .15)},${f1(s * .42)} Q0,${f1(s * .5)} ${f1(-s * .15)},${f1(s * .42)} L${f1(-s * .16)},${f1(s * .08)} Q${f1(-s * .3)},${f1(s * .1)} ${f1(-s / 2)},${f1(s * .05)}Z" fill="${p.g('#efe2c6', .25, .25)}" stroke="#a8885a" stroke-width=".7"/></g>
        <path d="M${f1(-s * .46)},${f1(s * .02)} Q${f1(-s * .46)},${f1(-s * .4)} 0,${f1(-s * .42)} Q${f1(s * .46)},${f1(-s * .4)} ${f1(s * .46)},${f1(s * .02)}" stroke="#9a7650" stroke-width="1.6" fill="none"/></g>`;
}
// クルトン
function xtrCrouton(p, x, y, s, r = 0){
    return `<g ${T(x, y, r)}><g ${p.sh(.5)}><g ${p.crumb(.9)}><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${f1(s * .18)}" fill="${p.g('#dca04a', .35, .3)}" stroke="#a46a24" stroke-width=".5"/></g></g>
        <rect x="${f1(-s / 2 + s * .18)}" y="${f1(-s / 2 + s * .18)}" width="${f1(s * .5)}" height="${f1(s * .5)}" rx="1" fill="#f2cf86" opacity=".7"/></g>`;
}
// 短い細麺（テル・シェフリイェ）・平たい麺（エリシテ）
function xtrNoodleBits(p, x, y, s, { n = 60, seed = 1, c = '#f0cf80', w = 1.5, len = 7, sy = 1 } = {}){
    const R = rng(p.id + 'xtrnb' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd * sy, b = R() * 3.14, l = len * (.5 + R() * .6), bend = (R() - .5) * l * (w > 3 ? .25 : .8); d += `M${f1(cx - Math.cos(b) * l / 2)},${f1(cy - Math.sin(b) * l / 2)}q${f1(Math.cos(b) * l / 2 - Math.sin(b) * bend)},${f1(Math.sin(b) * l / 2 + Math.cos(b) * bend)} ${f1(Math.cos(b) * l)},${f1(Math.sin(b) * l)}`; }
    return `<path d="${d}" stroke="${dk(c, .3)}" stroke-width="${f1(w + .9)}" fill="none" stroke-linecap="round" opacity=".8"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
// カラーラハナ（黒キャベツ）の葉のきれはし
function xtrKale(p, x, y, s, { n = 18, seed = 1 } = {}){
    const R = rng(p.id + 'xtrkl' + seed + x);
    let d = ['', ''];
    for (let i = 0; i < n; i++){
        const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, b = R() * 6.28, l = 9 + R() * 8, w = 3 + R() * 2;
        const ca = Math.cos(b), sa = Math.sin(b);
        const pts = [[-l, 0], [-l * .5, -w], [0, -w * .6], [l * .5, -w * 1.1], [l, 0], [l * .5, w * .9], [0, w * .5], [-l * .5, w]].map(([u, v]) => [cx + u * ca - v * sa, cy + u * sa + v * ca]);
        d[i % 2] += xtrSm(pts);
    }
    return `<g ${p.sh(.5)}><path d="${d[0]}" fill="#2f4a22" stroke="#1a2e12" stroke-width=".5"/><path d="${d[1]}" fill="#3e5e2a" stroke="#22381a" stroke-width=".5"/></g>`;
}
// かぼちゃの種
function xtrSeeds(p, x, y, s, { n = 10, seed = 1 } = {}){
    const R = rng(p.id + 'xtrsd' + seed + x);
    let d = '';
    for (let i = 0; i < n; i++){ const a = R() * 6.28, dd = Math.sqrt(R()) * s / 2, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd, b = R() * 3.14, l = 4.2, w = 2; d += `M${f1(cx - Math.cos(b) * l)},${f1(cy - Math.sin(b) * l)}Q${f1(cx - Math.sin(b) * w * 1.6)},${f1(cy + Math.cos(b) * w * 1.6)} ${f1(cx + Math.cos(b) * l)},${f1(cy + Math.sin(b) * l)}Q${f1(cx + Math.sin(b) * w * 1.6)},${f1(cy - Math.cos(b) * w * 1.6)} ${f1(cx - Math.cos(b) * l)},${f1(cy - Math.sin(b) * l)}Z`; }
    return `<path d="${d}" fill="#6a8a3a" stroke="#3e5a1e" stroke-width=".5"/>`;
}
// レンズ豆（緑）
const xtrLentilCols = ['#7a6a3a', '#8e7a46', '#66562c', '#9a8a54'];

export default {
    // イズミル・キョフテ: 金属の丸い焼き皿に、細長いキョフテ・皮つきじゃがいもの輪切り・トマトを放射状に並べ、トマトのソースで焼き、上にシヴリ
    tr_izmirkofte: p => {
        const out = [];
        for (let i = 0; i < 12; i++){
            const a = i / 12 * 6.283 + .15, x = 100 + Math.cos(a) * 60, y = 100 + Math.sin(a) * 60, deg = a * 57.3;
            const t = i % 3;
            out.push(t === 0 ? xtrKofte(p, x, y, 42, deg, { c: '#8a4422' }) : t === 1 ? xtrPotSlice(p, x, y, 32, deg + 90, { seed: i, c: '#efc472' }) : xtrTomatoSlice(p, x, y, 30, deg));
        }
        for (let i = 0; i < 6; i++){
            const a = i / 6 * 6.283 + .5, x = 100 + Math.cos(a) * 27, y = 100 + Math.sin(a) * 27, deg = a * 57.3;
            out.push(i % 2 ? xtrPotSlice(p, x, y, 30, deg, { seed: 20 + i, c: '#efc472' }) : xtrKofte(p, x, y, 36, deg, { c: '#8a4422' }));
        }
        return [
            xtrTepsi(p),
            `<circle cx="100" cy="100" r="84" fill="${p.rg('#b8452c', .18, .3, .45, .42)}"/>`,
            out.join(''),
            xtrSivri(p, 96, 64, 56, 18, { cooked: true }), xtrSivri(p, 140, 120, 52, 110, { cooked: true }), xtrSivri(p, 66, 128, 52, -140, { cooked: true }),
            xtrOil(p, 100, 100, 150, { n: 16, c: '#e2602a', op: .5 }),
            xtrParsley(p, 100, 100, 24, { n: 6 }),
        ].join('');
    },

    // エトリ・ビベル・ドルマス: 赤い縁の深皿に、米とひき肉を詰めた淡い緑のピーマン5つ（トマトのふた）、トマトの煮汁とヨーグルト
    tr_biberdolmasi: p => [
        xtrBowl(p, { glaze: '#f4f0e6', inside: '#fbf8f1', line: TRED, inner: TRED }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#c0502e', .2, .25, .45, .42)}"/>`,
        xtrStuffedPepper(p, 70, 72, 54, 10, { seed: 1, cap: 'tomato' }),
        xtrStuffedPepper(p, 130, 70, 52, 40, { seed: 2, cap: 'rice' }),
        xtrStuffedPepper(p, 132, 130, 54, 80, { seed: 3, cap: 'tomato' }),
        xtrStuffedPepper(p, 70, 130, 52, -20, { seed: 4, cap: 'rice', c: '#9cc04a' }),
        xtrStuffedPepper(p, 101, 101, 50, 60, { seed: 5, cap: 'tomato', c: '#7aa83a' }),
        xtrOil(p, 100, 100, 150, { n: 12, c: '#e2602a', op: .5 }),
        xtrYogurt(p, 152, 100, 24, { seed: 3 }),
        xtrParsley(p, 100, 100, 120, { n: 10 }),
    ].join(''),

    // パトゥルジャン・ムサッカ: ガラスの耐熱皿に、揚げなすの輪切りとひき肉、トマトとピーマンを重ねてトマトのソースで焼く
    tr_musakka: p => {
        const out = [];
        let i = 0;
        for (const y of [62, 100, 138]) for (const x of [38, 76, 114, 152]){ const dx = (y === 100 ? 8 : 0); out.push(xtrAubRound(p, x + dx, y, 44, 36, (i * 23) % 40 - 20, { flesh: '#b07a38' })); i++; }
        const mince = [];
        i = 0;
        for (const y of [62, 100, 138]) for (const x of [38, 76, 114, 152]){ const dx = (y === 100 ? 8 : 0); mince.push(`<path ${T(x + dx, y)} d="${xtrSm(ring(12, 7, .4, rng('mk' + i)))}" fill="#8a3a1e" opacity=".85"/>` + xtrGrains(p, x + dx, y, 24, { cols: ['#6a2e14', '#9c5a30'], n: 10, size: 2.2, seed: i })); i++; }
        return [
            xtrGlassDish(p),
            `<rect x="16" y="40" width="168" height="120" rx="14" fill="${p.rg('#a8402a', .2, .2, .5, .5)}"/>`,
            `<g ${p.sh(.8)}>`, out.join(''), `</g>`,
            mince.join(''),
            xtrTomatoSlice(p, 58, 82, 22, 10), xtrTomatoSlice(p, 132, 82, 22, 50), xtrTomatoSlice(p, 96, 120, 22, -30), xtrTomatoSlice(p, 162, 122, 20, 20),
            ...[[96, 80, 20], [60, 118, -30], [134, 118, 60], [150, 60, -10], [30, 70, 40]].map(([x, y, r]) => K.pepperPiece(p, x, y, 12, r, { c: '#5a9a2e', strip: true })),
            xtrOil(p, 100, 100, 150, { n: 14, c: '#d9502a', op: .5 }),
            xtrParsley(p, 100, 100, 130, { n: 14 }),
        ].join('');
    },

    // ジエル・タヴァ: 白い皿に、粉をまぶしてかりっと揚げた小さなレバー、紫玉ねぎとパセリのサラダ（スマック）、揚げたシヴリ
    tr_cigertava: p => {
        const sp = xtrSpots('cg', 20, 48, 15, 88, 92);
        return [
            xtrPlate(p),
            `<path ${T(140, 130)} d="${xtrSm(ring(24, 10, .2, rng('cgo'), 1, .9))}" fill="#f4eef2"/>`,
            xtrRedOnion(p, 140, 130, 50, { n: 26 }),
            xtrParsley(p, 140, 130, 48, { n: 30 }),
            K.sprinkle(p, 140, 130, 44, { c: '#8a1a2a', n: 30, r: 1 }),
            `<g>`, sp.map(([x, y, r], i) => xtrLiver(p, x, y, 29 + (i % 3) * 3, r, { seed: i })).join(''), `</g>`,
            xtrSivri(p, 150, 72, 54, 60, { cooked: true, c: '#4f8a2a' }),
            xtrLemonWedge(p, 60, 150, 26, 20),
        ].join('');
    },

    // エトリ・ノフット: トルコ石色の鉢に、ひよこ豆と小さな角切り肉をトマトペーストの赤いソースで煮込む
    tr_etlinohut: p => [
        xtrBowl(p, { glaze: '#2f9a9a', inside: '#fbf7ee', inner: '#1f6f72' }),
        xtrSoup(p, '#b5482a', { R: 76, veil: '#d0683a', vop: .3 }),
        `<g ${p.sh(.6)}>`, xtrBalls(p, xtrPeas('en', 62, 64, 5.4), { c: '#dcae62' }), `</g>`,
        `<g ${p.sh(.8)}>`, ...[[80, 82, 10], [122, 78, 50], [134, 118, -20], [84, 128, 70], [104, 104, 30], [60, 104, -40]].map(([x, y, r], i) => xtrBeefChunk(p, x, y, 18, r, { c: '#7e3e22', seed: i })), `</g>`,
        xtrOil(p, 100, 100, 130, { n: 14, c: '#e85a1e', op: .5 }),
        xtrSivri(p, 128, 140, 34, 20, { cooked: true, bend: 2 }),
        xtrParsley(p, 92, 92, 26, { n: 8 }),
        xtrShine(100, 100, 76, .4),
    ].join(''),

    // タヴク・シシ: 長皿に、ヨーグルトとペーストに漬けた鶏の金串2本、ブルグルのピラフ、焼いたトマトとシヴリ、玉ねぎのスマック和え
    tr_tavuksis: p => [
        K.longPlate(p, { w: 188, h: 140 }),
        `<g ${p.sh(.6)}><path ${T(60, 66)} d="${xtrSm(ring(32, 12, .12, rng('tsb'), 1.25, .66))}" fill="${p.rg('#c47a3e', .25, .2)}"/></g>`,
        xtrGrains(p, 60, 66, 78, { cols: ['#c98a48', '#d89a58', '#b06a34', '#e8b06a'], n: 115, size: 2.7, long: 1.4, seed: 1, sy: .54 }),
        xtrRedOnion(p, 146, 138, 44, { n: 18 }), xtrParsley(p, 146, 138, 40, { n: 18 }), K.sprinkle(p, 146, 138, 34, { c: '#8a1a2a', n: 18, r: .9 }),
        `<g ${p.sh(.6)}><circle cx="40" cy="136" r="15" fill="${p.rg('#d23a28', .25, .3)}" stroke="#8a1e12" stroke-width=".7"/></g><path d="M31,131 q9,-5 17,2 M33,140 q8,-3 14,1" stroke="#4a1e0a" stroke-width="2" fill="none" opacity=".45"/><circle cx="35" cy="130" r="2.6" fill="#fff" opacity=".6"/>`,
        xtrSivri(p, 146, 64, 56, 8, { cooked: true, c: '#4f8a2a' }),
        xtrSkewer(p, 106, 94, 172, -8, { n: 6, seed: 1 }),
        xtrSkewer(p, 104, 124, 166, -5, { n: 6, seed: 2 }),
    ].join(''),

    // フルンダ・パタテスリ・タヴク: 天板に、ペーストを塗って焼いた骨つき鶏もも、くし切りのじゃがいも、玉ねぎ、ピーマン
    tr_firintavuk: p => {
        const W = [[40, 64, 20], [62, 126, -40], [100, 148, 10], [150, 140, 60], [168, 98, -80], [136, 52, 30], [94, 58, -20], [30, 104, 80], [122, 102, 50], [76, 96, -60], [160, 66, 10], [44, 144, 30]];
        return [
            xtrRectTray(p),
            `<rect x="18" y="32" width="164" height="136" rx="10" fill="${p.rg('#c4682f', .15, .3, .5, .5)}" opacity=".85"/>`,
            `<g>`, W.map(([x, y, r]) => xtrWedge(p, x, y, 40, r)).join(''), `</g>`,
            K.onion(p, 116, 74, 18, 30, { c: '#d9a066', layers: 2 }), K.onion(p, 56, 76, 16, -50, { c: '#d9a066', layers: 2 }), K.onion(p, 136, 122, 16, 100, { c: '#d9a066', layers: 2 }),
            xtrLeg(p, 72, 70, 74, 20, { seed: 1 }),
            xtrThigh(p, 140, 78, 52, -20, { seed: 2 }),
            xtrLeg(p, 130, 126, 74, 200, { seed: 3 }),
            xtrThigh(p, 68, 126, 50, 30, { seed: 4 }),
            xtrSivri(p, 102, 102, 44, 70, { cooked: true }),
            xtrOil(p, 100, 100, 150, { n: 12, c: '#e2702a', op: .45 }),
            K.sprinkle(p, 100, 100, 140, { c: '#4f6a2a', n: 20, r: .8 }),
        ].join('');
    },

    // ノフトゥル・タヴクル・ピラヴ: 白い皿に、バターのつやのあるピラフ、ひよこ豆、上にほぐした鶏肉と黒こしょう
    tr_tavuklupilav: p => [
        xtrPlate(p, { rim: COBALT, line: TURQ }),
        xtrRice(p, 100, 102, 138, { tint: '#f6eed6', density: 1.2, grain: 4, hiK: .7 }),
        `<g ${p.sh(.5)}>`, xtrBalls(p, xtrPeas('tp', 16, 62, 5, 100, 102).filter(([x, y]) => Math.hypot(x - 104, y - 92) > 30), { c: '#dcae62' }), `</g>`,
        xtrShredChicken(p, 104, 92, 70, { n: 34, sy: .85, c: '#dfba84' }),
        K.sprinkle(p, 104, 94, 70, { c: '#2a2420', n: 30, r: .7 }),
    ].join(''),

    // ヒュンキャル・ベエンディ: 白い皿に、焼きなすのなめらかなクリーム（ベエンディ）を敷き、真ん中にトマトで煮た羊肉
    tr_hunkar: p => [
        xtrPlate(p, { rim: TRED, line: null }),
        `<g ${p.sh(.8)}><path ${T(100, 100)} d="${xtrSm(ring(71, 16, .05, rng('hk')))}" fill="${p.rg('#ddc9a0', .3, .25, .4, .4)}"/></g>`,
        K.sprinkle(p, 100, 100, 136, { c: '#8a7050', n: 60, r: .9 }),
        `<path d="M40,96 Q54,60 92,44 M156,118 Q144,152 104,160 M46,124 Q56,146 80,156" stroke="#c8b48a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
        `<path ${T(100, 100)} d="${xtrSm(ring(50, 12, .12, rng('hk2')))}" fill="${p.rg('#8a3a22', .25, .3)}"/>`,
        `<g ${p.sh(.8)}>`, ...[[84, 84, 10], [116, 82, 50], [122, 114, -20], [88, 118, 70], [102, 99, 30], [64, 102, -10], [136, 98, 80], [104, 132, 20], [100, 66, 60]].map(([x, y, r], i) => xtrBeefChunk(p, x, y, 22, r, { c: '#7a321c', seed: i })), `</g>`,
        xtrOil(p, 100, 100, 80, { n: 10, c: '#c8401e', op: .5 }),
        xtrParsley(p, 104, 98, 30, { n: 8 }),
    ].join(''),

    // クズ・ギュヴェチ: 素焼きの土鍋で焼いた羊肉、じゃがいも、トマト、シヴリ、いんげん、玉ねぎ
    tr_kuzuguvec: p => {
        const sp = xtrSpots('kg', 24, 54, 16);
        return [
            xtrGuvec(p),
            `<circle cx="100" cy="100" r="68" fill="${p.rg('#a8401e', .2, .35, .45, .42)}"/>`,
            `<g ${p.sh(.9)}>`,
            sp.map(([x, y, r], i) => { const t = i % 6; return t === 0 || t === 3 ? xtrBeefChunk(p, x, y, 22, r, { c: '#7a3a20', seed: i }) : t === 1 ? xtrDice(p, x, y, 15, r, { c: '#e9c06a' }) : t === 2 ? K.tomatoWedge(p, x, y, 20, r) : t === 4 ? xtrFlatBean(p, x, y, 22, r) : K.onion(p, x, y, 16, r, { c: '#d9a066', layers: 1 }); }).join(''),
            xtrSivri(p, 92, 84, 40, 30, { cooked: true }), xtrSivri(p, 120, 120, 36, -40, { cooked: true }),
            `</g>`,
            xtrOil(p, 100, 100, 120, { n: 12, c: '#d0501e', op: .45 }),
            xtrParsley(p, 100, 100, 100, { n: 10 }),
        ].join('');
    },
    // フルンダ・レヴレッキ: 天板に、レモンの輪切りをのせたスズキ1尾、じゃがいも・トマト・玉ねぎ・シヴリを敷いて焼く
    tr_levrek: p => {
        const sp = xtrSpotsRect('lv', 22, 160, 118, 19);
        return [
            xtrRectTray(p, { w: 190, h: 152 }),
            `<rect x="18" y="32" width="164" height="136" rx="10" fill="${p.rg('#d9a858', .2, .3, .5, .5)}" opacity=".7"/>`,
            `<g>`, sp.map(([x, y, r], i) => { const t = i % 4; return t === 0 || t === 2 ? xtrPotSlice(p, x, y, 26, r, { seed: i, c: '#f0c86a', browned: .8 }) : t === 1 ? xtrTomatoSlice(p, x, y, 24, r) : K.onion(p, x, y, 20, r, { c: '#e2b878', layers: 2 }); }).join(''), `</g>`,
            xtrSivri(p, 52, 54, 50, 10, { cooked: true }), xtrSivri(p, 150, 150, 50, 190, { cooked: true }),
            K.wholeFish(p, 102, 100, 172, -6, { skin: '#7d8c98', belly: '#e9e4d8', char: .55 }),
            xtrLemonRound(p, 70, 96, 20), xtrLemonRound(p, 98, 94, 20), xtrLemonRound(p, 126, 91, 18),
            xtrParsley(p, 100, 98, 110, { n: 12 }),
            xtrOil(p, 100, 100, 160, { n: 10, c: '#e8b84a', op: .45 }),
        ].join('');
    },

    // バルック・ブーラマ: ステンレスの浅鍋に、白身魚の切り身をトマト・シヴリ・レモンの輪切りと蒸し煮に。うすいオレンジの煮汁
    tr_bugulama: p => [
        xtrPot(p),
        `<circle cx="100" cy="100" r="78" fill="${p.rg('#d97a45', .25, .25, .45, .42)}"/>`,
        `<circle cx="96" cy="94" r="54" fill="#efa06a" opacity=".3"/>`,
        xtrWhiteFillet(p, 72, 74, 62, 36, 25, { seed: 1 }), xtrWhiteFillet(p, 132, 84, 60, 34, -35, { seed: 2 }), xtrWhiteFillet(p, 96, 132, 66, 36, 5, { seed: 3 }),
        xtrTomatoSlice(p, 100, 92, 26, 20), xtrTomatoSlice(p, 64, 118, 24, 60), xtrTomatoSlice(p, 140, 120, 24, -10), xtrTomatoSlice(p, 104, 56, 22, 40),
        xtrLemonRound(p, 82, 100, 18), xtrLemonRound(p, 122, 106, 18), xtrLemonRound(p, 136, 58, 16),
        xtrSivri(p, 58, 90, 40, 70, { cooked: true }), xtrSivri(p, 150, 96, 38, -80, { cooked: true }),
        xtrParsley(p, 100, 100, 120, { n: 22 }),
        xtrShine(100, 100, 78, .35),
    ].join(''),

    // カリデス・ギュヴェチ: 小さな素焼きの土鍋に、トマトとシヴリで煮たえび、上にとろけて焼き色のついたカシャルチーズ
    tr_karidesguvec: p => [
        xtrGuvec(p, { R: 82 }),
        `<circle cx="100" cy="100" r="66" fill="${p.rg('#c0402a', .2, .3, .45, .42)}"/>`,
        ...[[62, 84, 20], [134, 72, 120], [140, 124, 200], [66, 128, -60]].map(([x, y, r]) => K.shrimp(p, x, y, 26, r, { c: '#ef7a4a' })),
        `<g ${p.sh(.6)}>`, K.cheese(p, 100, 100, 104, { seed: 2, browned: .8 }), `</g>`,
        `<path ${T(100, 100)} d="${xtrSm(ring(50, 12, .3, rng('kgc'), 1, .88))}" fill="none" stroke="#f8e6a0" stroke-width="2" opacity=".6"/>`,
        ...[[86, 92, 40], [118, 108, -20], [104, 70, 100]].map(([x, y, r]) => K.shrimp(p, x, y, 24, r, { c: '#f08a5a' })),
        ...[[80, 120, 20], [120, 80, -40]].map(([x, y, r]) => K.pepperPiece(p, x, y, 12, r, { c: '#5a9a2e' })),
        K.pepperPiece(p, 132, 98, 11, 30, { c: '#d43a22' }),
        xtrParsley(p, 100, 100, 90, { n: 16 }),
        K.sprinkle(p, 100, 100, 100, { c: '#9a1c0c', n: 20, r: .8 }),
    ].join(''),

    // チュルブル: 白い皿に、にんにく入りの濃いヨーグルトを広げ、半熟のポーチドエッグ2つ、唐辛子バター、ディル
    tr_cilbir: p => [
        xtrBowl(p, { glaze: '#2a4a8a', inside: '#3a5a9a', lip: .9, dots: '#f4eee0' }),
        xtrYogurt(p, 100, 100, 150, { seed: 1, sy: .94, c: '#f6f1e2' }),
        `<path d="M50,110 Q70,128 100,130 M70,70 Q96,56 130,66" stroke="#ebe6d6" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`,
        xtrPoached(p, 78, 92, 58, -10, { seed: 1 }), xtrPoached(p, 124, 110, 58, 20, { seed: 2 }),
        xtrRedButter(p, 100, 100, 110, { n: 10, op: .85 }),
        xtrDill(p, 100, 100, 70, { n: 4 }),
    ].join(''),

    // テュルリュ: 黄色い釉の鉢に、なす・ズッキーニ・じゃがいも・いんげん・シヴリ・トマトをトマトペーストで煮込んだ夏野菜
    tr_turlu: p => {
        const sp = xtrSpots('tl', 26, 58, 15);
        return [
            xtrBowl(p, { glaze: '#d29a34', inside: '#fbf6e8', inner: '#8a5a1a' }),
            xtrSoup(p, '#b8502a', { R: 76, veil: '#d0703a', vop: .3 }),
            `<g ${p.sh(.8)}>`,
            sp.map(([x, y, r], i) => { const t = i % 6; return t === 0 ? K.eggplant(p, x, y, 22, r) : t === 1 ? xtrZuc(p, x, y, 19, r, { half: i % 2 === 1 }) : t === 2 ? xtrDice(p, x, y, 15, r, { c: '#e9c472' }) : t === 3 ? xtrFlatBean(p, x, y, 24, r, { c: '#6f9a34' }) : t === 4 ? K.tomatoWedge(p, x, y, 18, r) : xtrZuc(p, x, y, 18, r); }).join(''),
            xtrSivri(p, 90, 96, 40, 30, { cooked: true }), xtrSivri(p, 128, 128, 34, -40, { cooked: true }),
            `</g>`,
            xtrOil(p, 100, 100, 130, { n: 12, c: '#e2602a', op: .45 }),
            xtrParsley(p, 100, 100, 110, { n: 12 }),
            xtrShine(100, 100, 76, .35),
        ].join('');
    },

    // ウスパナック・イェメイ: 白い鉢に、玉ねぎとお米を入れて煮くずしたほうれん草、ヨーグルトと唐辛子
    tr_ispanakyemegi: p => [
        xtrBowl(p, { glaze: '#f3efe6', inside: '#fbf9f2', line: TURQ }),
        `<circle cx="100" cy="100" r="76" fill="${p.rg('#4a5e26', .15, .3, .45, .42)}"/>`,
        `<g ${p.sh(.5)}>`, xtrWilted(p, 100, 100, 140, { n: 70, seed: 1 }), xtrWilted(p, 98, 98, 110, { n: 30, seed: 2, cols: ['#4f7f2e', '#5f8f36'] }), `</g>`,
        xtrGrains(p, 100, 100, 130, { cols: ['#f4eedc', '#e6dcc0'], n: 40, size: 2.2, long: 1.5, seed: 4 }),
        xtrOil(p, 100, 100, 130, { n: 12, c: '#c9a83a', op: .45 }),
        xtrYogurt(p, 126, 120, 44, { seed: 2 }),
        K.sprinkle(p, 126, 118, 30, { c: '#b8281a', n: 14, r: .9 }),
        xtrShine(100, 100, 76, .3),
    ].join(''),

    // フルン・マカルナ: ガラスの耐熱皿に、ペンネとベシャメルを重ね、カシャルチーズにこんがり焼き色
    tr_firinmakarna: p => {
        const pn = xtrSpotsRect('fm', 20, 150, 104, 24);
        return [
            xtrGlassDish(p),
            xtrGratin(p, 100, 100, 168, 122, { rx: 13 }),
            `<g ${p.sh(.4)}>`, pn.map(([x, y, r]) => xtrPenne(p, x, y, 26, r)).join(''), `</g>`,
            `<g ${xtrBlur(p, 1.4)}>`, pn.map(([x, y]) => `<ellipse cx="${f(x + 3)}" cy="${f(y + 5)}" rx="10" ry="5" fill="#f6e2a2" opacity=".75"/>`).join(''), `</g>`,
            `<path d="M30,62 Q60,48 100,52" stroke="#fff6d8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
            xtrParsley(p, 100, 100, 120, { n: 12 }),
        ].join('');
    },

    // イェシル・メルジメッキ: 茶色の釉の鉢に、緑のレンズ豆と粗いブルグル、にんじんをトマトペーストで煮て、唐辛子
    tr_yesilmercimek: p => [
        xtrBowl(p, { glaze: '#8a4a2a', inside: '#f8f2e6', inner: '#5a2a14' }),
        xtrSoup(p, '#8a4626', { R: 76, veil: '#a8603a', vop: .3 }),
        xtrGrains(p, 100, 100, 146, { cols: xtrLentilCols, n: 240, size: 3.9, seed: 1 }),
        xtrGrains(p, 100, 100, 130, { cols: ['#d8a258'], n: 30, size: 2, long: 1.3, seed: 2 }),
        `<g ${p.sh(.5)}>`, xtrCubes(p, xtrSpots('ym', 12, 56, 15).map(([x, y, r]) => [x, y, r]), { c: '#ec7b2d', s: 8 }), `</g>`,
        xtrOil(p, 100, 100, 120, { n: 10, c: '#d0501e', op: .5 }),
        K.sprinkle(p, 100, 100, 110, { c: '#a8200e', n: 24, r: .9 }),
        xtrParsley(p, 106, 96, 24, { n: 6 }),
        xtrShine(100, 100, 76, .4),
    ].join(''),

    // スジュクル・ユムルタ: 銅のサハンに、スジュクの輪切りと目玉焼き3つ、唐辛子
    tr_sucukluyumurta: p => [
        xtrSahan(p),
        `<circle cx="100" cy="100" r="74" fill="#d9481c" opacity=".25"/>`,
        ...[[64, 70], [100, 58], [136, 70], [52, 104], [148, 104], [64, 136], [100, 146], [136, 136], [100, 100], [80, 116], [122, 86]].map(([x, y], i) => xtrSucuk(p, x, y, 22, i * 30, { seed: i })),
        K.friedEgg(p, 80, 86, 56, 10), K.friedEgg(p, 124, 100, 56, -20), K.friedEgg(p, 88, 128, 52, 40),
        ...[[100, 76], [58, 120], [140, 136], [118, 140]].map(([x, y], i) => xtrSucuk(p, x, y, 20, i * 50, { seed: 20 + i })),
        K.sprinkle(p, 100, 100, 120, { c: '#9a1c0c', n: 24, r: .8 }),
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 14, r: .6 }),
    ].join(''),

    // エトリ・ベゼリエ: 藍の釉の鉢に、グリーンピース・角切りの牛肉・にんじん・じゃがいもをトマトペーストで煮る、ディル
    tr_bezelye: p => [
        xtrBowl(p, { glaze: '#2a4a8a', inside: '#fbf8f1', inner: '#1a2e5e' }),
        xtrSoup(p, '#c0602e', { R: 76, veil: '#d8803e', vop: .3 }),
        `<g ${p.sh(.5)}>`, xtrBalls(p, xtrPeas('bz', 72, 66, 5.8), { c: '#7fb23e' }), `</g>`,
        `<g ${p.sh(.7)}>`,
        ...[[84, 84, 20], [122, 90, -30], [96, 126, 60], [132, 124, 10], [66, 112, -50]].map(([x, y, r], i) => xtrBeefChunk(p, x, y, 17, r, { c: '#7e3e22', seed: i })),
        xtrCubes(p, [[104, 72, 10], [60, 88, 30], [146, 104, -20], [112, 108, 40], [76, 142, 0], [140, 72, 60]], { c: '#ec7b2d', s: 9 }),
        xtrCubes(p, [[90, 104, 20], [118, 140, -10], [52, 128, 50], [148, 132, 30]], { c: '#efd08a', s: 11 }),
        `</g>`,
        xtrOil(p, 100, 100, 130, { n: 10, c: '#e2702a', op: .45 }),
        xtrDill(p, 104, 98, 40, { n: 3 }),
        xtrShine(100, 100, 76, .4),
    ].join(''),
    // イマム・バユルドゥ: 楕円の皿に、オリーブ油で煮たなす2本。玉ねぎとトマトの詰めもの、トマトの輪切りとシヴリ、油
    tr_imambayildi: p => [
        K.ovalDish(p, { rx: 96, ry: 80, rim: TURQ }),
        K.pool(p, 100, 100, 160, '#d8a04a', { seed: 1, sy: .74, op: .75 }),
        xtrImam(p, 98, 76, 162, 50, -6, { seed: 1 }),
        xtrImam(p, 102, 126, 162, 50, 4, { seed: 2 }),
        xtrOil(p, 100, 100, 160, { n: 14, c: '#e8b440', op: .5 }),
    ].join(''),

    // ゼイティンヤール・ヤプラク・サルマ: 白い皿に、ぶどうの葉で米を細く巻いたサルマをすき間なく並べ、レモン
    tr_yaprak: p => {
        const out = [];
        let k = 0;
        for (let row = -4; row <= 4; row++){
            const y = 100 + row * 14.5, half = Math.sqrt(Math.max(0, 66 * 66 - (row * 14.5) ** 2));
            const n = Math.max(1, Math.floor((half * 2) / 34));
            for (let i = 0; i < n; i++){ const x = 100 - (n - 1) * 17 + i * 34 + (row % 2 ? 4 : -4); out.push(xtrSarma(p, x, y, 32, (k * 7) % 8 - 4, { c: k % 3 ? '#6b7a32' : '#5e6e2a' })); k++; }
        }
        return [
            xtrPlate(p, { rim: COBALT, line: TURQ }),
            `<circle cx="100" cy="100" r="68" fill="#a8a050" opacity=".25"/>`,
            `<g ${p.sh(.8)}>`, out.join(''), `</g>`,
            xtrOil(p, 100, 100, 120, { n: 10, c: '#d8c050', op: .45 }),
            xtrLemonWedge(p, 70, 64, 30, -20), xtrLemonRound(p, 128, 132, 26),
            xtrDill(p, 132, 70, 30, { n: 2 }),
        ].join('');
    },

    // ゼイティンヤール・プラサ: 楕円の皿に、オリーブ油で煮た長ねぎの斜め切り、にんじんの輪切り、少しのお米、レモン
    tr_pirasa: p => {
        const sp = xtrSpots('pr', 34, 68, 17, 100, 100, .78);
        return [
            K.ovalDish(p, { rx: 96, ry: 80, rim: COBALT }),
            K.pool(p, 100, 100, 158, '#e0c070', { seed: 2, sy: .76, op: .7 }),
            `<g ${p.sh(.6)}>`, sp.map(([x, y, r], i) => i % 5 === 3 ? K.carrotRound(p, x, y, 14, { c: '#ef8030', r }) : xtrLeek(p, x, y, 26, r)).join(''), `</g>`,
            xtrGrains(p, 100, 100, 140, { cols: ['#f6f0dc', '#ebe2c6'], n: 30, size: 2.2, long: 1.5, seed: 3, sy: .78 }),
            xtrOil(p, 100, 100, 150, { n: 14, c: '#e8c440', op: .45 }),
            xtrLemonWedge(p, 150, 70, 28, 30),
        ].join('');
    },

    // バルブニャ・ピラキ: 赤い縁の楕円の皿に、オリーブ油とトマトで煮たうずら豆、にんじんとじゃがいもの角切り、パセリ
    tr_barbunya: p => {
        const sp = xtrSpots('bb', 64, 70, 10.5, 100, 100, .8);
        return [
            K.ovalDish(p, { rx: 96, ry: 80, rim: TRED }),
            K.pool(p, 100, 100, 162, '#c86a3a', { seed: 3, sy: .78 }),
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r], i) => xtrBean(p, x, y, 13, r, { c: i % 3 ? '#b8705a' : '#c48a6a', tint: '#8a3a2a', top: .4 })).join(''), `</g>`,
            `<g ${p.sh(.5)}>`, xtrCubes(p, xtrSpots('bbc', 10, 60, 18, 100, 100, .78), { c: '#ec7b2d', s: 9 }), xtrCubes(p, xtrSpots('bbp', 5, 50, 22, 100, 100, .78), { c: '#f0d68e', s: 11 }), `</g>`,
            xtrOil(p, 100, 100, 150, { n: 14, c: '#e8702a', op: .45 }),
            xtrParsley(p, 100, 100, 130, { n: 22 }),
        ].join('');
    },

    // ゼイティンヤール・エンギナル: 白い皿に、アーティチョークの芯5つ、中にグリーンピース・にんじん・じゃがいもの角切り、ディル、レモン
    tr_enginar: p => {
        const pos = [[66, 72], [134, 72], [56, 128], [144, 128], [100, 104]];
        return [
            xtrPlate(p, { rim: TURQ }),
            K.pool(p, 100, 100, 140, '#e6d28a', { seed: 4, sy: .9, op: .7 }),
            pos.map(([x, y], i) => xtrArti(p, x, y, 52, i * 20)).join(''),
            pos.map(([x, y], i) => `<g ${p.sh(.4)}>` + xtrCubes(p, [[x - 6, y - 4, 10 + i * 9], [x + 5, y + 5, 30], [x + 6, y - 7, -15]], { c: '#ec7b2d', s: 7 }) + xtrCubes(p, [[x - 5, y + 6, 20]], { c: '#f0d68e', s: 8 }) + xtrBalls(p, [[x + 1, y, 3.4], [x - 9, y + 2, 3.4], [x, y + 9, 3.4], [x - 2, y - 9, 3.4]], { c: '#7fb23e' }) + `</g>`).join(''),
            xtrBalls(p, [[100, 64, 3.6], [96, 150, 3.6], [32, 100, 3.4], [168, 100, 3.4], [100, 146, 3.4]], { c: '#7fb23e' }),
            xtrDill(p, 100, 100, 130, { n: 7 }),
            xtrLemonWedge(p, 100, 154, 24, 0),
        ].join('');
    },

    // クスル: 白い皿のふちにロメインレタス、真ん中にトマトとペッパーペーストで赤く染めた細かいブルグル、ねぎ・パセリ・トマト
    tr_kisir: p => [
        xtrPlate(p, { rim: TRED, line: null }),
        ...Array.from({ length: 7 }, (_, i) => { const a = i / 7 * 6.283 - .3; return xtrLettuce(p, 100 + Math.cos(a) * 52, 100 + Math.sin(a) * 52, 52, 30, a * 57.3, { seed: i, c: i % 2 ? '#7cb84a' : '#8cc458' }); }),
        `<g ${p.sh(.8)}><path ${T(100, 100)} d="${xtrSm(ring(52, 14, .1, rng('ks')))}" fill="${p.rg('#c8642e', .2, .2)}"/></g>`,
        xtrGrains(p, 100, 100, 104, { cols: ['#d0703a', '#b8582a', '#e08a4a'], n: 165, size: 1.9, seed: 1 }),
        xtrParsley(p, 100, 100, 96, { n: 30 }),
        xtrScallion(p, 100, 100, 90, { n: 14 }),
        `<g ${p.sh(.4)}>`, xtrCubes(p, xtrSpots('ksd', 10, 40, 15), { c: '#e0352a', s: 7 }), `</g>`,
        xtrLemonWedge(p, 146, 146, 22, -45),
    ].join(''),

    // ピヤズ: 藍の縁の皿に、白いんげんと紫玉ねぎ、パセリ、ゆで卵、トマト、スマック、オリーブ油と酢
    tr_piyaz: p => {
        const sp = xtrSpots('pz', 58, 66, 11.5);
        return [
            xtrPlate(p, { rim: COBALT, line: TURQ }),
            `<circle cx="100" cy="100" r="70" fill="#efe6cc" opacity=".6"/>`,
            `<g ${p.sh(.5)}>`, sp.map(([x, y, r]) => xtrBean(p, x, y, 15, r, { c: '#f4e8cc', tint: null })).join(''), `</g>`,
            xtrRedOnion(p, 100, 100, 120, { n: 22 }),
            xtrParsley(p, 100, 100, 130, { n: 34 }),
            K.eggHalf(p, 76, 70, 26, -20), K.eggHalf(p, 134, 120, 26, 30), K.eggHalf(p, 70, 128, 24, 60),
            K.tomatoWedge(p, 128, 70, 20, 30), K.tomatoWedge(p, 104, 140, 18, -20),
            K.sprinkle(p, 100, 100, 130, { c: '#8a1a2a', n: 30, r: 1 }),
            xtrOil(p, 100, 100, 120, { n: 8, c: '#d8c050', op: .4 }),
        ].join('');
    },

    // ガヴルダー・サラタス: 白い皿に、細かく刻んだトマト・シヴリ・紫玉ねぎ・くるみ・パセリ、ザクロの濃いシロップ
    tr_gavurdagi: p => {
        const sp = xtrSpots('gd', 96, 68, 9.6);
        const g = t => sp.filter((_, i) => i % 8 === t || (t === 0 && i % 8 > 4));
        return [
            xtrPlate(p, { rim: TURQ }),
            `<circle cx="100" cy="100" r="72" fill="${p.rg('#b8301e', .2, .3)}" opacity=".85"/>`,
            `<g ${p.sh(.5)}>`, xtrCubes(p, sp.filter((_, i) => i % 8 < 4 || i % 8 === 7), { c: '#e0352a', s: 10.5 }), xtrCubes(p, g(4), { c: '#5fa036', s: 8.5 }), xtrCubes(p, g(5), { c: '#e8d0e0', s: 8 }), `</g>`,
            `<g ${p.sh(.5)}>`, g(6).map(([x, y, r], i) => xtrWalnut(p, x, y, 13, r, { seed: i })).join(''), `</g>`,
            xtrParsley(p, 100, 100, 136, { n: 40 }),
            `<path d="M58,86 Q80,70 104,82 T148,84 M62,122 Q88,108 112,120 T146,124" stroke="#5a1418" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`,
            K.sprinkle(p, 100, 100, 120, { c: '#8a1a2a', n: 20, r: .9 }),
            xtrOil(p, 100, 100, 110, { n: 8, c: '#d8c050', op: .4 }),
        ].join('');
    },

    // アジュル・エズメ: 赤い釉の小鉢に、とても細かく刻んだトマトとペッパー、玉ねぎ、パセリ。とろりと赤いペースト
    tr_ezme: p => [
        xtrBowl(p, { glaze: '#b8382a', inside: '#fbf6ee', inner: '#7a1e14', dots: '#f6e8d0' }),
        `<circle cx="100" cy="100" r="75" fill="${p.rg('#b8302a', .2, .3, .45, .42)}"/>`,
        xtrGrains(p, 100, 100, 146, { cols: ['#c8302a', '#a82418', '#e0604a'], n: 220, size: 2.5, seed: 1 }),
        xtrGrains(p, 100, 100, 140, { cols: ['#3f8a2c', '#5aa63c'], n: 70, size: 1.9, seed: 2 }),
        xtrGrains(p, 100, 100, 130, { cols: ['#f2e2e0'], n: 24, size: 1.8, seed: 3 }),
        xtrOil(p, 100, 100, 110, { n: 10, c: '#e85a2a', op: .5 }),
        xtrShine(100, 100, 75, .35),
        xtrParsley(p, 114, 88, 22, { n: 5 }),
    ].join(''),

    // シャクシュカ: 藍の釉の小鉢に、素揚げしたなすとシヴリの角切り、トマトのソース、にんにくヨーグルト
    tr_saksuka: p => {
        const sp = xtrSpots('sk', 30, 62, 14.5);
        return [
            xtrBowl(p, { glaze: '#2a4a8a', inside: '#fbf8f1', dots: '#f4eee0' }),
            `<circle cx="100" cy="100" r="75" fill="${p.rg('#b8402a', .2, .3, .45, .42)}"/>`,
            `<g ${p.sh(.7)}>`, sp.map(([x, y, r], i) => i % 5 === 4 ? K.pepperPiece(p, x, y, 14, r, { c: '#5a9a2e' }) : xtrAubCube(p, x, y, 16, r)).join(''), `</g>`,
            `<g ${xtrBlur(p, 1)}>`, ...xtrSpots('sks', 12, 60, 18).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="5" fill="#c0402a" opacity=".55"/>`), `</g>`,
            xtrYogurt(p, 124, 122, 40, { seed: 3 }),
            xtrOil(p, 100, 100, 120, { n: 10, c: '#e2602a', op: .45 }),
            xtrParsley(p, 92, 92, 60, { n: 10 }),
        ].join('');
    },
    // キョズレンミシュ・パトゥルジャン・サラタス: 白い皿に、焼いて刻んだ燻香のなす、シヴリ、トマト、パセリ、オリーブ油
    tr_patlicansalatasi: p => [
        xtrPlate(p, { rim: COBALT, line: TURQ }),
        `<g ${p.sh(.7)}><path ${T(100, 100)} d="${xtrSm(ring(66, 14, .1, rng('ps')))}" fill="${p.rg('#9a8456', .2, .25)}"/></g>`,
        K.shreds(p, 100, 100, 118, { c: '#7a6a40', n: 60, w: 3.4, len: .26, seed: 1, curve: .6 }),
        K.shreds(p, 100, 100, 118, { c: '#b8a070', n: 40, w: 2.6, len: .2, seed: 2, curve: .6 }),
        K.shreds(p, 100, 100, 110, { c: '#4a3a24', n: 16, w: 2, len: .18, seed: 3, curve: .5 }),
        `<g ${p.sh(.4)}>`, xtrCubes(p, xtrSpots('psg', 14, 56, 14), { c: '#5fa036', s: 8 }), xtrCubes(p, xtrSpots('pst', 14, 56, 14), { c: '#e0352a', s: 8 }), `</g>`,
        xtrParsley(p, 100, 100, 120, { n: 26 }),
        xtrOil(p, 100, 100, 110, { n: 12, c: '#d8c050', op: .55, rmax: 3.4 }),
        xtrLemonWedge(p, 146, 146, 22, -45),
    ].join(''),

    // ヨウルトゥル・ハヴチ・タラトル: 青磁の小鉢に、炒めたにんじんのせん切りをにんにくヨーグルトで和え、くるみとディル
    tr_havuctarator: p => [
        K.kobachi(p, { glaze: '#7fb3a0', inside: '#eef4ec' }),
        `<g ${p.sh(.8)}><path ${T(100, 100)} d="${xtrSm(ring(68, 14, .08, rng('ht')))}" fill="${p.rg('#f8f2e2', .2, .15)}"/></g>`,
        K.shreds(p, 100, 100, 124, { c: '#ec7b2d', n: 90, w: 2.3, len: .17, seed: 1, curve: .5 }),
        `<g opacity=".4">`, `<path ${T(100, 100)} d="${xtrSm(ring(58, 12, .3, rng('ht2')))}" fill="#fbf8ee"/>`, `</g>`,
        K.shreds(p, 100, 100, 110, { c: '#f2903e', n: 50, w: 2, len: .16, seed: 2, curve: .5 }),
        `<g ${p.sh(.5)}>`, ...[[94, 90], [114, 104], [98, 116], [80, 106], [116, 82], [132, 120], [68, 84]].map(([x, y], i) => xtrWalnut(p, x, y, 17, i * 40, { seed: i })), `</g>`,
        xtrDill(p, 100, 100, 70, { n: 3 }),
        xtrShine(100, 100, 66, .4),
    ].join(''),

    // メルジメッキ・キョフテスィ: 白い皿にレタスを敷き、手で握った赤レンズ豆とブルグルのキョフテ、レモン、青ねぎ
    tr_mercimekkofte: p => [
        xtrPlate(p, { rim: TURQ }),
        ...[[66, 70, -30], [134, 70, 210], [60, 132, 40], [140, 132, 140], [100, 100, 90]].map(([x, y, r], i) => xtrLettuce(p, x, y, 70, 46, r, { seed: i, c: i % 2 ? '#7cb84a' : '#8cc458' })),
        ...[[72, 76, 30], [104, 64, -10], [134, 80, -40], [62, 108, 80], [96, 98, 20], [130, 112, -20], [76, 138, 50], [108, 132, 0], [140, 144, -60]].map(([x, y, r], i) => xtrMkofte(p, x, y, 38, r, { seed: i, c: i % 2 ? '#c4642a' : '#bc5a26' })),
        xtrLemonWedge(p, 44, 124, 24, 70), xtrLemonWedge(p, 158, 102, 22, -80),
        `<path d="M150,62 l14,-10 M154,66 l16,-6" stroke="#5fa03a" stroke-width="4" stroke-linecap="round"/><path d="M146,64 l6,-4 M150,68 l6,-3" stroke="#eef4dc" stroke-width="4" stroke-linecap="round"/>`,
    ].join(''),

    // ブルグル・ピラヴ: トルコ石色の鉢に、トマトペーストで色づいた粗いブルグルのピラフ、シヴリとトマト
    tr_bulgurpilavi: p => [
        xtrBowl(p, { glaze: '#2f9a9a', inside: '#fbf7ee', dots: '#f6f2e6' }),
        `<g ${p.sh(.8)}><path ${T(100, 101)} d="${xtrSm(ring(70, 14, .06, rng('bp')))}" fill="${p.rg('#b86a34', .2, .25)}"/></g>`,
        xtrGrains(p, 100, 101, 138, { cols: ['#c8803e', '#d8944c', '#b06a30', '#e6aa60'], n: 270, size: 2.7, long: 1.4, seed: 1 }),
        `<g ${p.sh(.4)}>`, xtrCubes(p, xtrSpots('bpg', 10, 54, 18), { c: '#5fa036', s: 7 }), xtrCubes(p, xtrSpots('bpt', 9, 54, 18), { c: '#d8402a', s: 7 }), `</g>`,
        `<path d="M50,86 Q58,62 84,52" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".4"/>`,
    ].join(''),

    // カルナバハル・クザルトマス: 白い皿に、卵と粉の衣で揚げたカリフラワー、にんにくヨーグルト
    tr_karnabahar: p => [
        xtrPlate(p, { rim: TRED, line: null }),
        xtrYogurt(p, 136, 132, 46, { seed: 1 }),
        K.sprinkle(p, 136, 130, 30, { c: '#b8281a', n: 10, r: .8 }),
        ...[[66, 66, 0], [104, 58, 40], [140, 74, 80], [58, 104, 20], [96, 96, -30], [134, 104, 60], [70, 140, 10], [104, 134, -50]].map(([x, y, r], i) => xtrCauli(p, x, y, 40 + (i % 3) * 3, r, { seed: i })),
        xtrParsley(p, 100, 100, 110, { n: 10 }),
    ].join(''),

    // セミズオトゥ・サラタス: 白い鉢に、肉厚のスベリヒユ、トマト、青ねぎ、レモンとオリーブ油
    tr_semizotu: p => [
        xtrBowl(p, { glaze: '#f3efe6', inside: '#fbf9f2', line: COBALT, inner: TURQ }),
        `<circle cx="100" cy="100" r="74" fill="#d6e4b8" opacity=".5"/>`,
        xtrPurslane(p, 100, 100, 140, { n: 120 }),
        `<g ${p.sh(.4)}>`, xtrCubes(p, xtrSpots('sz', 16, 58, 16), { c: '#e0352a', s: 10 }), `</g>`,
        xtrScallion(p, 100, 100, 110, { n: 14 }),
        xtrOil(p, 100, 100, 110, { n: 10, c: '#d8c050', op: .45 }),
        xtrLemonWedge(p, 134, 136, 24, -40),
    ].join(''),

    // パンジャル・サラタス: 白い小鉢に、ゆでたビーツの角切り、にんにく、酢とオリーブ油、パセリ
    tr_pancar: p => [
        K.kobachi(p, { glaze: '#e8e2d4', inside: '#fbf9f2' }),
        `<circle cx="100" cy="100" r="74" fill="none" stroke="${COBALT}" stroke-width="1.6"/>`,
        `<circle cx="100" cy="100" r="68" fill="${p.rg('#7a1a3a', .2, .3)}" opacity=".85"/>`,
        `<g ${p.sh(.6)}>`, xtrSpots('pc', 40, 58, 15).map(([x, y, r]) => xtrDice(p, x, y, 15, r, { c: '#8e1f44', inner: '#b8386a' })).join(''), `</g>`,
        xtrGrains(p, 100, 100, 100, { cols: ['#f6f0e0'], n: 14, size: 1.8, seed: 2 }),
        xtrParsley(p, 100, 100, 110, { n: 22 }),
        xtrOil(p, 100, 100, 110, { n: 10, c: '#d8c050', op: .4 }),
        xtrShine(100, 100, 68, .4),
    ].join(''),

    // ラハナ・サラタス: 白い皿に、ごく細いせん切りのキャベツとにんじん、レモンとオリーブ油、パセリ
    tr_lahana: p => [
        xtrPlate(p, { rim: TURQ }),
        `<g ${p.sh(.7)}><path ${T(100, 100)} d="${xtrSm(ring(68, 14, .1, rng('lh')))}" fill="${p.rg('#eef2d8', .3, .1)}"/></g>`,
        K.shreds(p, 100, 100, 128, { c: '#e2ebc4', n: 62, w: 2.2, len: .26, seed: 1, curve: .6 }),
        K.shreds(p, 100, 100, 124, { c: '#f8f8ea', n: 40, w: 2, len: .24, seed: 2, curve: .6 }),
        K.shreds(p, 100, 100, 124, { c: '#c4d898', n: 30, w: 1.6, len: .22, seed: 3, curve: .6 }),
        K.shreds(p, 100, 100, 112, { c: '#ef8030', n: 36, w: 1.6, len: .24, seed: 4, curve: .5 }),
        xtrParsley(p, 100, 100, 110, { n: 18 }),
        xtrOil(p, 100, 100, 110, { n: 8, c: '#e0c84a', op: .4 }),
        xtrLemonWedge(p, 140, 142, 24, -40),
    ].join(''),

    // キョズレンミシュ・クルムズ・ビベル: 長皿に、焼いて皮をむいた赤ピーマン、にんにく、パセリ、酢とオリーブ油
    tr_kozbiber: p => [
        K.longPlate(p, { w: 188, h: 140 }),
        K.pool(p, 100, 100, 160, '#c8783a', { seed: 1, sy: .66, op: .45 }),
        xtrRoastPep(p, 96, 66, 156, 48, -6, { seed: 1 }),
        xtrRoastPep(p, 104, 102, 158, 50, 4, { seed: 2, c: '#cc341e' }),
        xtrRoastPep(p, 98, 136, 150, 46, -3, { seed: 3, c: '#b8261a' }),
        xtrGrains(p, 100, 100, 120, { cols: ['#f6f0dc'], n: 16, size: 2.2, long: 1.3, seed: 5, sy: .6 }),
        xtrParsley(p, 100, 100, 140, { n: 26 }),
        xtrOil(p, 100, 100, 150, { n: 14, c: '#e8c040', op: .5 }),
    ].join(''),

    // チェルケズ・タヴウ: 白い皿に、ほぐした鶏肉をくるみとパンのなめらかなソースで和えて山にし、唐辛子の赤い油とくるみ
    tr_cerkez: p => [
        xtrPlate(p, { rim: COBALT, line: TURQ }),
        `<g ${p.sh(1)}><path ${T(100, 100)} d="${xtrSm(ring(64, 14, .12, rng('ck')))}" fill="${p.rg('#ddc8a2', .3, .22)}"/></g>`,
        `<g ${p.crumb(.5)}><path ${T(100, 100)} d="${xtrSm(ring(60, 14, .12, rng('ck')))}" fill="#dcc6a0"/></g>`,
        K.sprinkle(p, 100, 100, 120, { c: '#a88a60', n: 50, r: 1 }),
        `<g ${xtrBlur(p, .8)}><path d="M58,92 Q80,70 110,76 T146,96 M66,124 Q96,108 124,120 T144,128" stroke="#c8401e" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`,
        `<path d="M58,92 Q80,70 110,76 T146,96 M66,124 Q96,108 124,120 T144,128" stroke="#f08a4a" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>`,
        `<g ${p.sh(.5)}>`, ...[[100, 96], [76, 104], [124, 108], [100, 124], [86, 80], [118, 84], [60, 84], [140, 90], [72, 136], [128, 136]].map(([x, y], i) => xtrWalnut(p, x, y, 16, i * 50, { seed: i })), `</g>`,
        K.sprinkle(p, 100, 100, 120, { c: '#a8200e', n: 24, r: .8 }),
        xtrParsley(p, 100, 100, 60, { n: 8 }),
    ].join(''),
    // エゾゲリン・チョルバス: 赤い釉の鉢に、赤レンズ豆とブルグルの少しざらりとした橙赤色のスープ、ミントの赤いバター、レモン
    tr_ezogelin: p => [
        xtrBowl(p, { glaze: '#a83a2a', inside: '#fbf6ee', inner: '#6a1a10', dots: '#f6e8d0' }),
        xtrSoup(p, '#c8582a', { R: 76, veil: '#e0783a', vop: .35 }),
        xtrGrains(p, 100, 100, 140, { cols: ['#d87a3e', '#b84c22', '#e89050'], n: 110, size: 1.8, seed: 1 }),
        xtrRedButter(p, 100, 100, 80, { n: 8, op: .75 }),
        xtrMint(p, 100, 100, 96, { n: 24 }),
        xtrLemonWedge(p, 140, 142, 34, -40),
        xtrShine(100, 100, 76, .45),
    ].join(''),

    // タルハナ・チョルバス: 藍の線の白い鉢に、発酵させたタルハナのとろりと赤いスープ、ミントバター、クルトンとすりおろしチーズ
    tr_tarhana: p => [
        xtrBowl(p, { glaze: '#f3efe6', inside: '#fbf9f2', line: COBALT, inner: COBALT }),
        xtrSoup(p, '#b8482a', { R: 76, veil: '#cc6a3e', vop: .3 }),
        xtrGrains(p, 100, 100, 140, { cols: ['#c85a34', '#a83c1e'], n: 70, size: 1.6, seed: 1 }),
        xtrOil(p, 100, 100, 110, { n: 12, c: '#e8a040', op: .55 }),
        xtrMint(p, 100, 100, 110, { n: 30 }),
        ...[[72, 80, 10], [126, 76, 30], [134, 118, -20], [80, 128, 40], [104, 100, 15], [100, 140, -10]].map(([x, y, r]) => xtrCrouton(p, x, y, 14, r)),
        K.shreds(p, 104, 100, 50, { c: '#f6dc84', n: 18, w: 1.8, len: .3, seed: 2, curve: .7 }),
        xtrShine(100, 100, 76, .4),
    ].join(''),

    // デュユン・チョルバス: 銅の鉢に、卵黄とレモンでとろみをつけた白いスープ、ほぐした羊肉、唐辛子の赤いバター、レモン
    tr_dugun: p => [
        xtrCopperBowl(p),
        xtrSoup(p, '#e6d6ac', { R: 76, veil: '#f6ecd0', vop: .45 }),
        `<g opacity=".9">`, xtrShredChicken(p, 100, 100, 110, { n: 46, c: '#b08460', seed: 2, w: 2.6, len: .6 }), `</g>`,
        `<circle cx="100" cy="100" r="66" fill="#efe2bc" opacity=".25"/>`,
        xtrRedButter(p, 100, 100, 100, { n: 10, op: .8 }),
        xtrLemonWedge(p, 138, 140, 32, -40),
        xtrShine(100, 100, 76, .5),
    ].join(''),

    // テルビイェリ・タヴク・チョルバス: トルコ石の線の白い鉢に、卵とレモンでとろみをつけた淡い黄色のスープ、ほぐした鶏肉、にんじん、黒こしょう
    tr_tavukcorba: p => [
        xtrBowl(p, { glaze: '#f3efe6', inside: '#fbf9f2', line: TURQ, inner: TURQ }),
        xtrSoup(p, '#e8d498', { R: 76, veil: '#f6eac0', vop: .45 }),
        xtrShredChicken(p, 100, 100, 116, { n: 30, c: '#e8cfa0', seed: 1, w: 3.6, len: .8 }),
        `<g ${p.sh(.4)}>`, xtrCubes(p, xtrSpots('tc', 14, 60, 14), { c: '#ec7b2d', s: 6.5 }), `</g>`,
        K.sprinkle(p, 100, 100, 120, { c: '#2a2420', n: 30, r: .7 }),
        xtrParsley(p, 100, 100, 70, { n: 14 }),
        xtrShine(100, 100, 76, .45),
    ].join(''),

    // シェフリイェ・チョルバス: イズニック風の鉢に、トマトペーストで薄赤い澄んだスープ、細く短いシェフリイェ、パセリ、レモン
    tr_sehriye: p => [
        xtrIznikBowl(p),
        xtrSoup(p, '#d0602e', { R: 74, veil: '#e88a50', vop: .35 }),
        `<g opacity=".75">`, xtrNoodleBits(p, 100, 100, 134, { n: 70, seed: 1, c: '#e8b06a', w: 1.4 }), `</g>`,
        xtrNoodleBits(p, 100, 100, 124, { n: 60, seed: 2, c: '#f4cc84', w: 1.5 }),
        xtrOil(p, 100, 100, 110, { n: 10, c: '#e86a2a', op: .5 }),
        xtrParsley(p, 100, 100, 100, { n: 22 }),
        xtrLemonWedge(p, 140, 140, 32, -40),
        xtrShine(100, 100, 74, .45),
    ].join(''),

    // クレマル・マンタル・チョルバス: 青灰の釉の鉢に、ベージュのクリームスープ、マッシュルームの薄切り、クリームの渦、パセリ
    tr_mantarcorba: p => [
        xtrBowl(p, { glaze: '#4a6a8a', inside: '#f6f2ea', inner: '#2a4060' }),
        xtrSoup(p, '#cfb894', { R: 76, veil: '#e6d6b8', vop: .45 }),
        xtrSwirl(p, 100, 100, 92, { c: '#f8f2e4', turns: 1.7, w: 3.6 }),
        ...[[68, 80, -20], [124, 68, 20], [140, 112, 70], [94, 136, -60], [104, 96, 10], [62, 116, 40], [130, 140, 10], [96, 60, -40]].map(([x, y, r]) => xtrMushSlice(p, x, y, 26, r)),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 18, r: .7 }),
        xtrParsley(p, 100, 100, 60, { n: 10 }),
        xtrShine(100, 100, 76, .4),
    ].join(''),

    // セブゼ・チョルバス: 黄色い釉の鉢に、トマトの橙色のスープ、にんじん・じゃがいも・ズッキーニの角切り、いんげん、パセリ
    tr_sebze: p => {
        const sp = xtrSpots('sb', 40, 62, 12);
        return [
            xtrBowl(p, { glaze: '#d29a34', inside: '#fbf6e8', inner: '#8a5a1a' }),
            xtrSoup(p, '#d0763e', { R: 76, veil: '#e6965a', vop: .35 }),
            `<g ${p.sh(.6)}>`,
            xtrCubes(p, sp.filter((_, i) => i % 4 === 0), { c: '#ec7b2d', s: 10 }),
            xtrCubes(p, sp.filter((_, i) => i % 4 === 1), { c: '#f0d68e', s: 11 }),
            sp.filter((_, i) => i % 4 === 2).map(([x, y, r]) => xtrDice(p, x, y, 11, r, { c: '#dfe4ac', skin: '#3f6a2a' })).join(''),
            sp.filter((_, i) => i % 4 === 3).map(([x, y, r]) => xtrFlatBean(p, x, y, 13, r, { c: '#5f9a34' })).join(''),
            `</g>`,
            xtrParsley(p, 100, 100, 110, { n: 16 }),
            xtrShine(100, 100, 76, .4),
        ].join('');
    },

    // トゥトマチ・チョルバス: 緑の釉の鉢に、白いヨーグルトのスープ、緑のレンズ豆と平たい手打ち麺、ミントの赤いバター
    tr_tutmac: p => [
        xtrBowl(p, { glaze: '#4a7a3a', inside: '#f8f4ea', inner: '#2a4a1e' }),
        xtrSoup(p, '#ece4cc', { R: 76, veil: '#f8f4e6', vop: .5 }),
        xtrNoodleBits(p, 100, 100, 128, { n: 22, seed: 1, c: '#f2d890', w: 5, len: 13 }),
        xtrGrains(p, 100, 100, 132, { cols: xtrLentilCols, n: 70, size: 2.6, seed: 2 }),
        `<circle cx="100" cy="100" r="70" fill="#f4eedc" opacity=".2"/>`,
        xtrRedButter(p, 100, 100, 70, { n: 7, op: .75 }),
        xtrMint(p, 100, 100, 100, { n: 30 }),
        xtrShine(100, 100, 76, .5),
    ].join(''),

    // ブロコリ・チョルバス: 赤い線の白い鉢に、なめらかな緑のスープ、クリームの渦、小房のブロッコリー、黒こしょう
    tr_brokoli: p => [
        xtrBowl(p, { glaze: '#f3efe6', inside: '#fbf9f2', line: TRED, inner: TRED }),
        xtrSoup(p, '#86a63e', { R: 76, veil: '#a6c260', vop: .35 }),
        xtrSwirl(p, 96, 98, 84, { c: '#f4f2e4', turns: 1.5, w: 3.4, r0: 1 }),
        K.broccoli(p, 134, 112, 26, 20), K.broccoli(p, 76, 128, 22, -20), K.broccoli(p, 118, 68, 22, 40),
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 22, r: .7 }),
        xtrShine(100, 100, 76, .4),
    ].join(''),

    // バルカバウ・チョルバス: 藍の釉の鉢に、なめらかな橙色のかぼちゃのスープ、クリームの渦、かぼちゃの種
    tr_balkabagi: p => [
        xtrBowl(p, { glaze: '#2a4a8a', inside: '#fbf8f1', inner: '#1a2e5e' }),
        xtrSoup(p, '#e08a2a', { R: 76, veil: '#f4ae4c', vop: .4 }),
        xtrSwirl(p, 100, 100, 86, { c: '#f8eedc', turns: 1.6, w: 3.6, r0: 2 }),
        xtrSeeds(p, 108, 96, 50, { n: 10 }),
        K.sprinkle(p, 100, 100, 110, { c: '#8a3a12', n: 16, r: .7 }),
        xtrParsley(p, 112, 92, 20, { n: 4 }),
        xtrShine(100, 100, 76, .45),
    ].join(''),

    // エクシリ・キョフテ・チョルバス: トルコ石の釉の鉢に、卵とレモンで白くにごった酸っぱいスープ、米入りの小さな肉団子、にんじん、じゃがいも、ミント
    tr_eksilikofte: p => [
        xtrBowl(p, { glaze: '#2f9a9a', inside: '#fbf7ee', inner: '#1f6f72' }),
        xtrSoup(p, '#e4cf94', { R: 76, veil: '#f4e8c0', vop: .45 }),
        xtrGrains(p, 100, 100, 130, { cols: ['#f8f2e0'], n: 30, size: 2, long: 1.5, seed: 3 }),
        ...xtrSpots('ek', 15, 58, 21).map(([x, y]) => K.meatball(p, x, y, 16, { c: '#a8643a' })),
        `<g ${p.sh(.4)}>`, xtrCubes(p, [[96, 76, 20], [60, 92, -10], [140, 116, 30], [106, 124, 0], [72, 132, 40], [124, 86, 15]], { c: '#ec7b2d', s: 8 }), xtrCubes(p, [[112, 90, 10], [80, 116, -20], [134, 140, 30], [56, 76, 0]], { c: '#f0d68e', s: 9 }), `</g>`,
        xtrMint(p, 100, 100, 110, { n: 20 }),
        xtrParsley(p, 100, 100, 70, { n: 10 }),
        xtrShine(100, 100, 76, .45),
    ].join(''),

    // パタテス・チョルバス: 藍の点の白い鉢に、なめらかなじゃがいものクリームスープ、角切りじゃがいも、カシャルチーズ、パセリ
    tr_patatescorba: p => [
        xtrBowl(p, { glaze: '#f3efe6', inside: '#fbf9f2', line: COBALT, dots: COBALT }),
        xtrSoup(p, '#e6d098', { R: 74, veil: '#f6e8c4', vop: .45 }),
        `<g ${p.sh(.5)}>`, xtrCubes(p, xtrSpots('pt', 11, 56, 22), { c: '#f0d68e', s: 13 }), `</g>`,
        `<g ${p.sh(.4)}>`, K.shreds(p, 104, 100, 56, { c: '#f8d870', n: 22, w: 2, len: .32, seed: 2, curve: .7 }), `</g>`,
        K.sprinkle(p, 100, 100, 110, { c: '#2a2420', n: 16, r: .7 }),
        xtrParsley(p, 100, 100, 90, { n: 16 }),
        xtrShine(100, 100, 74, .45),
    ].join(''),

    // ムスル・チョルバス: イズニック風の鉢に、ミルクとクリームの黄色いコーンスープ、クリームの渦、コーンの粒
    tr_misir: p => [
        xtrIznikBowl(p),
        xtrSoup(p, '#ecc860', { R: 74, veil: '#f8e290', vop: .45 }),
        xtrSwirl(p, 98, 98, 80, { c: '#fbf6e6', turns: 1.4, w: 3.4, r0: 4 }),
        xtrBalls(p, xtrPeas('ms', 26, 46, 3.4, 104, 102), { c: '#f2c230' }),
        K.sprinkle(p, 100, 100, 100, { c: '#b8281a', n: 16, r: .8 }),
        xtrParsley(p, 104, 98, 30, { n: 6 }),
        xtrShine(100, 100, 74, .45),
    ].join(''),

    // ハヴチ・チョルバス: トルコ石の釉の鉢に、なめらかな明るい橙色のにんじんのスープ、ヨーグルトの渦、パセリ
    tr_havuc: p => [
        xtrBowl(p, { glaze: '#2f9a9a', inside: '#fbf7ee', dots: '#f6f2e6' }),
        xtrSoup(p, '#e8782a', { R: 76, veil: '#f6a050', vop: .4 }),
        xtrSwirl(p, 100, 100, 84, { c: '#fbf7ee', turns: 1.5, w: 3.6, r0: 5 }),
        K.sprinkle(p, 100, 100, 110, { c: '#8a3a12', n: 14, r: .7 }),
        xtrParsley(p, 106, 96, 34, { n: 8 }),
        xtrShine(100, 100, 76, .45),
    ].join(''),

    // クズ・ハシュラマ: 銅の鉢に、羊肉を骨ごとゆでた澄んだ金色のスープ、大きめのじゃがいも・にんじん・玉ねぎ、パセリ、レモン
    tr_haslama: p => [
        xtrCopperBowl(p),
        xtrSoup(p, '#dcb46a', { R: 76, veil: '#eed08a', vop: .35 }),
        `<g ${p.sh(.9)}>`,
        ...[[80, 82, 10], [124, 110, -20], [96, 128, 60]].map(([x, y, r], i) => xtrBeefChunk(p, x, y, 30, r, { c: '#9a6a4a', seed: i })),
        `<g ${T(116, 76, 30)}><rect x="-12" y="-3.2" width="24" height="6.4" rx="3" fill="#f2e8d2" stroke="#c8b898" stroke-width=".6"/><circle cx="-12" cy="-3" r="4" fill="#f2e8d2" stroke="#c8b898" stroke-width=".6"/><circle cx="-12" cy="3" r="4" fill="#f2e8d2" stroke="#c8b898" stroke-width=".6"/></g>`,
        ...[[60, 108, 20], [140, 80, -30], [132, 140, 40]].map(([x, y, r], i) => K.potato(p, x, y, 24, r, { c: '#f0d48a', seed: i })),
        ...[[100, 96, 30], [70, 136, -40], [148, 112, 70], [100, 62, 10]].map(([x, y, r]) => K.carrotChunk(p, x, y, 18, r)),
        `</g>`,
        xtrOil(p, 100, 100, 130, { n: 14, c: '#f0c050', op: .55 }),
        xtrParsley(p, 100, 100, 110, { n: 18 }),
        xtrShine(100, 100, 76, .45),
    ].join(''),

    // カラーラハナ・チョルバス: 黒海地方の素焼きの鉢に、黒キャベツと白いんげん、とうもろこし粉で濃い緑のスープ、唐辛子
    tr_karalahana: p => [
        xtrBowl(p, { glaze: '#8a4a2a', inside: '#e8dcc8', inner: '#4a2210' }),
        xtrSoup(p, '#5e6a30', { R: 76, veil: '#7a8644', vop: .35 }),
        xtrKale(p, 100, 100, 130, { n: 30 }),
        `<g ${p.sh(.5)}>`, ...xtrSpots('kl', 14, 58, 16).map(([x, y, r]) => xtrBean(p, x, y, 13, r, { c: '#f2e6c8', tint: null })), `</g>`,
        xtrBalls(p, xtrPeas('klc', 12, 56, 2.6), { c: '#e8c040' }),
        xtrGrains(p, 100, 100, 120, { cols: ['#d8b860'], n: 24, size: 1.4, seed: 4 }),
        xtrOil(p, 100, 100, 110, { n: 10, c: '#d0a040', op: .45 }),
        K.sprinkle(p, 100, 100, 110, { c: '#a8200e', n: 20, r: .9 }),
        xtrShine(100, 100, 76, .4),
    ].join(''),
};
